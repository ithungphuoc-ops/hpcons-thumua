"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Minus, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { useNguoiDung, CHE_DO_XAC_THUC } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  capDatDuocToiDa,
  duocDatCap,
  duocSuaHoSo,
  NHAN_CAP_QUYEN,
} from "@/4-phan-quyen/luat-phan-quyen";
import {
  quyenCuaVaiTro,
  timVaiTroChuan,
  vaiTroGanDuocBoi,
  vaiTroKhopVoiHoSo,
  VAI_TRO_CHUAN,
  VIEC_TREN_BANG_DOI_CHIEU,
  type VaiTroChuan,
} from "@/4-phan-quyen/vai-tro-chuan";
import {
  docHoSoDePhanQuyen,
  ghiVaiTroChoTaiKhoan,
  type HoSoKemMa,
} from "@/5-ket-noi/ho-so-tai-khoan";

/**
 * 🛡️ MÀN PHÂN QUYỀN NGƯỜI DÙNG — gán theo VAI TRÒ, không bắt ghép tay bốn trường.
 *
 * 🔴 Ban lãnh đạo 18/08/2026, hai chỉ đạo nối tiếp:
 *   ① *"thêm tính năng phân quyền cho tài khoản quản trị và tài khoản trưởng bộ phận"*
 *   ② *"tạo cách phân quyền chuyên nghiệp và dễ cài đặt"*
 *
 * ---
 * ## VÌ SAO BẢN ĐẦU PHẢI VIẾT LẠI
 * Bản đầu chỉ cho đổi **cấp 1→4**. Nhưng `tinhQuyen` đọc cả `chucNang` và `vaiTro`, nên nâng một
 * **thủ kho** lên cấp 3 thì họ VẪN không phân bổ được việc và VẪN không thấy giá. Người phân
 * quyền tưởng đã trao quyền mà thực tế không có gì đổi — sai im lặng, và tin được nhầm.
 *
 * Nay chọn **một vai trò** (Trưởng bộ phận Thu mua, Thủ kho…) là gán trọn bộ bốn trường đã khớp
 * nhau. Danh mục ở `4-phan-quyen/vai-tro-chuan.ts`.
 *
 * ## 🔴 BẢNG "LÀM ĐƯỢC GÌ" KHÔNG CHÉP TAY
 * Cả phần xem trước lẫn bảng đối chiếu cuối trang đều gọi `quyenCuaVaiTro()`, tức chạy chính hàm
 * `tinhQuyen` của app. Chép tay một bảng mô tả quyền là sớm muộn nó lệch với luật thật — và lúc
 * đó màn phân quyền **nói dối chính người đang phân quyền**, thứ nguy hiểm nhất ở màn này.
 *
 * ## 🔴 TRẠNG THÁI THẬT: ĐỌC ĐƯỢC, CHƯA GHI ĐƯỢC
 * Firestore đang khóa ghi `nguoi-dung/{uid}` (`allow write: if false`) vì hồ sơ chứa cấp quyền
 * của chính người đó. Bộ rules mở khóa soạn ở `5-ket-noi/firestore-phan-quyen-DE-XUAT.rules`,
 * **chưa duyệt chưa deploy**. Màn hình nói điều đó ngay đầu trang chứ không để người dùng sửa
 * xong bấm Lưu mới biết.
 */
export default function TrangPhanQuyen() {
  const { nguoiDung, quyen } = useNguoiDung();

  const [danhSach, setDanhSach] = useState<HoSoKemMa[] | null>(null);
  const [dangTai, setDangTai] = useState(false);
  /** Vai trò vừa chọn nhưng CHƯA lưu, tra theo mã Firebase. */
  const [vaiTroNhap, setVaiTroNhap] = useState<Record<string, string>>({});
  const [hoiDoi, setHoiDoi] = useState<{ hs: HoSoKemMa; vt: VaiTroChuan } | null>(null);
  const [dangLuu, setDangLuu] = useState(false);

  const laCheDoThat = CHE_DO_XAC_THUC === "firebase";

  const tai = useCallback(async () => {
    if (!laCheDoThat) return;
    setDangTai(true);
    try {
      setDanhSach(await docHoSoDePhanQuyen());
    } finally {
      setDangTai(false);
    }
  }, [laCheDoThat]);

  useEffect(() => {
    void tai();
  }, [tai]);

  /* Lớp chặn thứ ba — hai lớp kia là mục menu và `duocVaoDuongDan`. Mỗi lớp che một đường vào
     khác nhau (menu · gõ URL · điều hướng trong app). */
  if (!quyen.phanQuyenNguoiDung) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Không có quyền vào mục này"
        description="Chỉ tài khoản Quản trị và Trưởng bộ phận mới xem được phân quyền người dùng."
      />
    );
  }

  const toiDa = capDatDuocToiDa(nguoiDung);
  /* Vai trò người này gán được — luật ở `vaiTroGanDuocBoi`, KHÔNG lọc tay ở đây. Chỉ bày thứ gán
     được, để không bày ra rồi báo lỗi khi bấm. */
  const vaiTroGanDuoc = vaiTroGanDuocBoi(toiDa);

  async function luu(hs: HoSoKemMa, vt: VaiTroChuan) {
    setDangLuu(true);
    try {
      const loi = await ghiVaiTroChoTaiKhoan(hs.firebaseUid, {
        chucNang: vt.chucNang,
        vaiTro: vt.vaiTro,
        capTM: vt.capTM,
        // ⚠️ Vai trò không có `capKho` thì ghi 0 chứ không bỏ qua: bỏ qua là giữ nguyên quyền kho
        // cũ, nên đổi một thủ kho sang Kế toán mà họ vẫn ghi được phiếu nhận hàng.
        capKho: vt.capKho ?? 0,
      });
      if (loi) {
        toast.error("Chưa lưu được", { description: loi, duration: 12000 });
        return;
      }
      toast.success("Đã đổi vai trò", {
        description: `${hs.hoSo.tenHienThi} → ${vt.ten}`,
      });
      // Đọc lại từ máy chủ thay vì tự sửa danh sách trong bộ nhớ: thứ hiện trên màn phải là thứ
      // máy chủ THẬT SỰ đang giữ, nếu không thì ghi hỏng một phần mà màn vẫn xanh.
      await tai();
      setVaiTroNhap((c) => {
        const conLai = { ...c };
        delete conLai[hs.firebaseUid];
        return conLai;
      });
    } finally {
      setDangLuu(false);
    }
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Thu mua", href: "/tong-quan" }, { label: "Phân quyền người dùng" }]}
        title="Phân quyền người dùng"
        description={`Chọn một vai trò là gán xong. Bạn gán được tới ${NHAN_CAP_QUYEN[toiDa]}.`}
      />

      {/* ---------- NÓI TRƯỚC TÌNH TRẠNG, không để người dùng phát hiện bằng cách gặp lỗi ---------- */}
      <Card>
        <CardContent className="flex flex-col gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
            Máy chủ đang khóa ghi hồ sơ phân quyền
          </p>
          <p className="text-sm text-text-secondary">
            Hồ sơ phân quyền nằm trên máy chủ và hiện <strong>chỉ cho đọc</strong>. Đây là khóa cố
            ý: hồ sơ chứa cấp quyền của chính mỗi người, mở ghi mà chưa có chốt thì ai cũng tự nâng
            mình lên Quản trị. Bấm <strong>Đổi</strong> vẫn gửi lệnh lên máy chủ, nhưng sẽ bị từ
            chối cho tới khi bộ quy tắc mới được duyệt và áp dụng.
          </p>
          <p className="text-sm text-text-secondary">
            Cách đổi quyền dùng được ngay: chạy <code>tao-tai-khoan.js</code> bằng khóa Admin SDK.
          </p>
        </CardContent>
      </Card>

      {!laCheDoThat ? (
        <EmptyState
          icon={ShieldAlert}
          title="Bản chạy thử đang dùng tài khoản mẫu"
          description="Danh sách người dùng thật chỉ có khi app chạy chế độ đăng nhập Firebase. Ở chế độ tài khoản mẫu, vai trò được viết sẵn trong mã nguồn nên không có hồ sơ nào để phân quyền."
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-text-secondary">
                {danhSach === null ? "Đang đọc danh sách…" : `${danhSach.length} tài khoản`}
              </p>
              <Button variant="outline" size="sm" onClick={() => void tai()} disabled={dangTai}>
                <RefreshCw className={`size-4 ${dangTai ? "animate-spin" : ""}`} aria-hidden />
                Đọc lại
              </Button>
            </div>

            {danhSach !== null && danhSach.length === 0 && (
              <p className="text-sm text-text-desc">
                Không đọc được tài khoản nào. Kiểm tra lại kết nối máy chủ.
              </p>
            )}

            {danhSach !== null && danhSach.length > 0 && (
              <div className="flex flex-col gap-(--hp-md-row-gap)">
                {danhSach.map((hs) => {
                  /* So bằng `uidNghiepVu`, KHÔNG bằng mã Firebase: `nguoiDung.uid` mà toàn app
                     dùng là mã NGHIỆP VỤ (`u-tm1`…) — hai lớp danh tính khác nhau, xem
                     `xac-thuc-firebase.ts`. So nhầm lớp là chốt "không tự sửa mình" mất tác dụng
                     mà không có gì báo. */
                  const laChinhMinh = hs.hoSo.uidNghiepVu === nguoiDung.uid;
                  const xet = duocSuaHoSo(nguoiDung, hs.hoSo.capTM, laChinhMinh);
                  const vtHienTai = vaiTroKhopVoiHoSo(hs.hoSo);
                  const maChon = vaiTroNhap[hs.firebaseUid] ?? vtHienTai?.ma ?? "";
                  const vtChon = timVaiTroChuan(maChon);
                  const daDoi = Boolean(vtChon) && maChon !== vtHienTai?.ma;

                  return (
                    <div
                      key={hs.firebaseUid}
                      className="flex flex-col gap-3 rounded-xl border border-border p-(--hp-md-card-pad) sm:flex-row sm:items-start"
                    >
                      {/* ---- Người ---- */}
                      <div className="sm:w-1/3 sm:shrink-0">
                        <p className="font-medium text-text-primary">
                          {hs.hoSo.tenHienThi}
                          {hs.hoSo.dangLamViec === false && (
                            <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
                              Tạm ngưng
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-text-desc">{hs.hoSo.email}</p>
                        <p className="mt-1 text-xs text-text-secondary">
                          {hs.hoSo.chucDanh} · {hs.hoSo.phongBan}
                        </p>
                        <p className="mt-1 text-xs text-text-desc">
                          Hiện tại:{" "}
                          <strong className="text-text-secondary">
                            {/* 🔴 Hồ sơ không khớp khuôn nào thì ghi "Tùy chỉnh", KHÔNG chọn đại
                                một vai trò. Chọn đại rồi bấm Lưu là đổi quyền người ta mà không
                                ai định làm vậy. Hồ sơ tạo bằng script trước khi có danh mục này
                                rơi đúng vào ca đó. */}
                            {vtHienTai?.ten ?? `Tùy chỉnh (${NHAN_CAP_QUYEN[hs.hoSo.capTM]})`}
                          </strong>
                        </p>
                      </div>

                      {/* ---- Chọn vai trò + xem trước quyền ---- */}
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        {xet.duoc ? (
                          <>
                            <select
                              value={maChon}
                              onChange={(e) =>
                                setVaiTroNhap((c) => ({ ...c, [hs.firebaseUid]: e.target.value }))
                              }
                              aria-label={`Vai trò cho ${hs.hoSo.tenHienThi}`}
                              className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors hover:border-primary focus:border-primary focus:outline-none"
                            >
                              {!vtHienTai && <option value="">— chọn vai trò —</option>}
                              {vaiTroGanDuoc.map((v) => (
                                <option key={v.ma} value={v.ma}>
                                  {v.ten}
                                </option>
                              ))}
                            </select>

                            {vtChon && (
                              <>
                                <p className="text-xs text-text-desc">{vtChon.moTa}</p>
                                {/* Xem trước quyền THẬT của vai trò đang chọn — tính từ
                                    `tinhQuyen`, không phải chữ mô tả. */}
                                <ViecLamDuoc vt={vtChon} />
                              </>
                            )}
                          </>
                        ) : (
                          /* Khóa thì PHẢI nói vì sao — `duocSuaHoSo` luôn kèm lý do. */
                          <p className="text-xs text-text-desc">{xet.lyDo}</p>
                        )}
                      </div>

                      {/* ---- Nút ---- */}
                      {xet.duoc && (
                        <div className="sm:shrink-0">
                          <Button
                            size="sm"
                            disabled={!daDoi || dangLuu}
                            onClick={() => vtChon && setHoiDoi({ hs, vt: vtChon })}
                          >
                            Đổi
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---------- BẢNG ĐỐI CHIẾU: vai trò nào làm được gì ---------- */}
      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          <div>
            <p className="text-h3 text-text-primary">Vai trò nào làm được gì</p>
            <p className="text-sm text-text-secondary">
              Bảng này <strong>tự sinh từ luật phân quyền thật của app</strong>, không phải mô tả
              chép tay — nên nó không thể nói khác thứ app đang chạy.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold tracking-wide text-text-desc uppercase">
                  <th className="px-2 py-2">Việc</th>
                  {VAI_TRO_CHUAN.map((v) => (
                    <th key={v.ma} className="px-2 py-2 text-center align-bottom">
                      {v.ten}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VIEC_TREN_BANG_DOI_CHIEU.map((viec) => (
                  <tr key={viec.khoa} className="border-b border-border">
                    <td className="px-2 py-2 text-text-secondary">{viec.nhan}</td>
                    {VAI_TRO_CHUAN.map((v) => {
                      const co = quyenCuaVaiTro(v)[viec.khoa];
                      return (
                        <td key={v.ma} className="px-2 py-2 text-center">
                          {/* 🔴 CÓ CẢ DẤU LẪN CHỮ CHO TRÌNH ĐỌC — Design System V1.1 cấm dùng
                              mỗi màu/biểu tượng để diễn tả trạng thái. */}
                          {co ? (
                            <>
                              <Check className="mx-auto size-4 text-success" aria-hidden />
                              <span className="sr-only">Được</span>
                            </>
                          ) : (
                            <>
                              <Minus className="mx-auto size-4 text-text-desc" aria-hidden />
                              <span className="sr-only">Không</span>
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 🔴 HỎI TRƯỚC KHI ĐỔI. Đổi vai trò ảnh hưởng ngay tới việc người ta làm được gì — hạ nhầm
          là họ mất quyền giữa lúc đang làm việc, và không tự lấy lại được. */}
      {hoiDoi && (
        <HopXacNhan
          mo
          tieuDe="Đổi vai trò?"
          moTa={
            `Đổi ${hoiDoi.hs.hoSo.tenHienThi} sang vai trò “${hoiDoi.vt.ten}”. ` +
            `${hoiDoi.vt.moTa} Người này sẽ thấy thay đổi ở lần tải trang kế tiếp.`
          }
          canhBao={
            hoiDoi.vt.capTM < hoiDoi.hs.hoSo.capTM
              ? "Đây là HẠ quyền — người này sẽ mất một số việc đang làm được."
              : undefined
          }
          nhanDongY="Đổi vai trò"
          nguyHiem={hoiDoi.vt.capTM < hoiDoi.hs.hoSo.capTM}
          onDongY={() => {
            const { hs, vt } = hoiDoi;
            setHoiDoi(null);
            /* Hỏi luật LẦN NỮA ngay trước khi ghi: giữa lúc hộp xác nhận đang mở, danh sách có
               thể đã được đọc lại và cấp của người kia đã khác. */
            const xet = duocDatCap(nguoiDung, vt.capTM);
            if (!xet.duoc) {
              toast.error("Không đổi được", { description: xet.lyDo });
              return;
            }
            /* 🔴 KIỂM CẢ CỜ `chiQuanTriGan`, không chỉ kiểm cấp. Vai trò "Ban Giám đốc" có cấp 1
               nên qua được `duocDatCap` của người cấp 3, trong khi nó mở quyền xem MỌI hồ sơ kèm
               giá. Đây đúng là lỗ hổng đã bắt được lúc soát danh mục — xem `chiQuanTriGan`. */
            if (!vaiTroGanDuocBoi(toiDa).some((x) => x.ma === vt.ma)) {
              toast.error("Không đổi được", {
                description: `Vai trò “${vt.ten}” chỉ tài khoản Quản trị mới gán được.`,
              });
              return;
            }
            void luu(hs, vt);
          }}
          onDong={() => setHoiDoi(null)}
        />
      )}
    </>
  );
}

/** Xem trước: vai trò đang chọn làm được những việc nào. Dữ liệu từ `tinhQuyen`, không chép tay. */
function ViecLamDuoc({ vt }: { vt: VaiTroChuan }) {
  const q = quyenCuaVaiTro(vt);
  const duoc = VIEC_TREN_BANG_DOI_CHIEU.filter((v) => q[v.khoa]);
  if (duoc.length === 0) {
    return <p className="text-xs text-text-desc">Không làm được việc nào trong app.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {duoc.map((v) => (
        <li
          key={v.khoa}
          className="flex items-center gap-1 rounded-md bg-success-bg px-1.5 py-0.5 text-[11px] font-medium text-success-soft"
        >
          <Check className="size-3 shrink-0" aria-hidden />
          {v.nhan}
        </li>
      ))}
    </ul>
  );
}
