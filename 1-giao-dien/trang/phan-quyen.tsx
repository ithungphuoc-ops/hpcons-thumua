"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { useNguoiDung, CHE_DO_XAC_THUC } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  cacCapChonDuoc,
  capDatDuocToiDa,
  duocDatCap,
  duocSuaHoSo,
  MO_TA_CAP_QUYEN,
  NHAN_CAP_QUYEN,
} from "@/4-phan-quyen/luat-phan-quyen";
import type { CapQuyen } from "@/4-phan-quyen/quyen";
import {
  docHoSoDePhanQuyen,
  ghiCapQuyen,
  type HoSoKemMa,
} from "@/5-ket-noi/ho-so-tai-khoan";

/**
 * 🛡️ MÀN PHÂN QUYỀN NGƯỜI DÙNG — Ban lãnh đạo 18/08/2026: *"thêm tính năng phân quyền cho tài
 * khoản quản trị và tài khoản trưởng bộ phận"*.
 *
 * ---
 * ## 🔴 TRẠNG THÁI THẬT CỦA TÍNH NĂNG NÀY — ĐỌC TRƯỚC KHI SỬA
 *
 * Hồ sơ phân quyền nằm ở Firestore `nguoi-dung/{firebaseUid}`, và
 * `5-ket-noi/firestore-chay-thu.rules` đang khai `allow write: if false` cho collection đó. Khóa
 * ấy **cố ý**: hồ sơ chứa `capTM` — cấp quyền của chính người đó — nên mở ghi mà không có chốt là
 * bất kỳ ai cũng tự sửa mình lên cấp 4.
 *
 * Vì vậy màn này **đọc được nhưng chưa ghi được**, cho tới khi Ban lãnh đạo duyệt bộ rules ở
 * `5-ket-noi/firestore-phan-quyen-DE-XUAT.rules` và deploy nó.
 *
 * 🔴 VÀ MÀN HÌNH PHẢI NÓI RA ĐIỀU ĐÓ, ngay từ đầu trang, chứ không để người dùng sửa xong bấm Lưu
 * mới biết. Quy ước dự án: *"chức năng chưa làm được thì khóa lại và nói rõ lý do, không được làm
 * giả cảm giác đã xong"*. Nút Lưu vẫn bấm được (để thử ngay sau khi rules được mở), nhưng nếu máy
 * chủ từ chối thì `ghiCapQuyen` trả về đúng lý do và màn hiện nguyên văn.
 *
 * ## Luật ai-sửa-được-ai
 * Nằm hết ở `4-phan-quyen/luat-phan-quyen.ts`, màn này chỉ hỏi. Đừng chép điều kiện vào đây: nút
 * bị khóa trên giao diện mà đường ghi vẫn nhận (hoặc ngược lại) là kiểu lỗi phân quyền tệ nhất.
 *
 * ## ⚠️ CHẾ ĐỘ TÀI KHOẢN MẪU
 * Khi `NEXT_PUBLIC_XAC_THUC` chưa đặt `firebase`, app chạy bằng danh sách vai trò viết cứng trong
 * mã nguồn (`VAI_TRO_MAU`) — không có Firestore nào để đọc, cũng không có gì để ghi. Màn này nói
 * thẳng điều đó thay vì hiện một bảng trống khiến người dùng tưởng chưa ai có tài khoản.
 */
export default function TrangPhanQuyen() {
  const { nguoiDung, quyen } = useNguoiDung();

  const [danhSach, setDanhSach] = useState<HoSoKemMa[] | null>(null);
  const [dangTai, setDangTai] = useState(false);
  /** Cấp người dùng vừa chọn nhưng CHƯA lưu, tra theo mã Firebase. */
  const [capNhap, setCapNhap] = useState<Record<string, CapQuyen>>({});
  /** Hồ sơ đang chờ xác nhận đổi quyền — `null` là chưa hỏi ai. */
  const [hoiDoi, setHoiDoi] = useState<{ hs: HoSoKemMa; capMoi: CapQuyen } | null>(null);
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

  /* 🔴 CHẶN Ở ĐÂY LÀ LỚP THỨ HAI, không phải lớp duy nhất: `duocVaoDuongDan` đã chặn địa chỉ
     `/phan-quyen`, và mục menu cũng chỉ hiện cho người có quyền. Giữ cả ba vì mỗi lớp che một
     đường vào khác nhau (menu · gõ URL · điều hướng trong app). */
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
  const capChonDuoc = cacCapChonDuoc(nguoiDung);

  async function luu(hs: HoSoKemMa, capMoi: CapQuyen) {
    setDangLuu(true);
    try {
      const loi = await ghiCapQuyen(hs.firebaseUid, { capTM: capMoi });
      if (loi) {
        // 🔴 Hiện NGUYÊN VĂN lý do máy chủ từ chối, và để lâu — đây là câu người dùng cần đọc hết
        // rồi chuyển cho IT, không phải một cảnh báo chớp qua.
        toast.error("Chưa lưu được", { description: loi, duration: 12000 });
        return;
      }
      toast.success("Đã đổi quyền", {
        description: `${hs.hoSo.tenHienThi} → cấp ${capMoi} (${NHAN_CAP_QUYEN[capMoi]})`,
      });
      // Đọc lại từ máy chủ thay vì tự sửa danh sách trong bộ nhớ: thứ hiện trên màn phải là thứ
      // máy chủ THẬT SỰ đang giữ, nếu không thì ghi hỏng một phần mà màn vẫn xanh.
      await tai();
      // Bỏ giá trị đang gõ dở của người vừa lưu xong — giữ lại thì lần vẽ sau ô chọn vẫn hiện
      // con số cũ và nút "Đổi" lại sáng lên như thể còn việc chưa lưu.
      setCapNhap((c) => {
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
        description={`Bạn đặt được tới cấp ${toiDa} — ${NHAN_CAP_QUYEN[toiDa]}.`}
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
            mình lên cấp Quản trị. Bấm <strong>Đổi</strong> vẫn gửi lệnh lên máy chủ, nhưng sẽ bị từ
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
                {danhSach === null
                  ? "Đang đọc danh sách…"
                  : `${danhSach.length} tài khoản`}
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
              <div className="overflow-x-auto">
                <table className="w-full min-w-[46rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold tracking-wide text-text-desc uppercase">
                      <th className="px-2 py-2">Họ tên</th>
                      <th className="px-2 py-2">Chức danh</th>
                      <th className="px-2 py-2">Phòng ban</th>
                      <th className="px-2 py-2">Cấp hiện tại</th>
                      <th className="px-2 py-2">Đổi thành</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {danhSach.map((hs) => {
                      /* So bằng `uidNghiepVu` chứ không bằng mã Firebase: `nguoiDung.uid` mà toàn
                         app dùng là mã NGHIỆP VỤ (`u-tm1`…), hai lớp danh tính khác nhau — xem
                         `xac-thuc-firebase.ts`. So nhầm lớp là chốt "không tự sửa mình" mất tác
                         dụng, mà không có gì báo. */
                      const laChinhMinh = hs.hoSo.uidNghiepVu === nguoiDung.uid;
                      const xet = duocSuaHoSo(nguoiDung, hs.hoSo.capTM, laChinhMinh);
                      const capMoi = capNhap[hs.firebaseUid] ?? hs.hoSo.capTM;
                      const daDoi = capMoi !== hs.hoSo.capTM;

                      return (
                        <tr key={hs.firebaseUid} className="border-b border-border align-top">
                          <td className="px-2 py-2">
                            <span className="font-medium text-text-primary">
                              {hs.hoSo.tenHienThi}
                            </span>
                            {hs.hoSo.dangLamViec === false && (
                              <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
                                Tạm ngưng
                              </span>
                            )}
                            <span className="block text-xs text-text-desc">{hs.hoSo.email}</span>
                          </td>
                          <td className="px-2 py-2 text-text-secondary">{hs.hoSo.chucDanh}</td>
                          <td className="px-2 py-2 text-text-secondary">{hs.hoSo.phongBan}</td>
                          <td className="px-2 py-2">
                            <span className="font-medium text-text-primary tabular-nums">
                              {hs.hoSo.capTM}
                            </span>
                            <span className="block text-xs text-text-desc">
                              {NHAN_CAP_QUYEN[hs.hoSo.capTM]}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            {xet.duoc ? (
                              <select
                                value={String(capMoi)}
                                onChange={(e) =>
                                  setCapNhap((c) => ({
                                    ...c,
                                    [hs.firebaseUid]: Number(e.target.value) as CapQuyen,
                                  }))
                                }
                                aria-label={`Cấp quyền mới cho ${hs.hoSo.tenHienThi}`}
                                className="min-h-11 w-full min-w-40 rounded-lg border border-border bg-card px-2 text-sm text-text-primary transition-colors hover:border-primary focus:border-primary focus:outline-none"
                              >
                                {/* 🔴 CHỈ BÀY CẤP ĐẶT ĐƯỢC. Bày cả 4 cấp rồi báo lỗi khi bấm là bắt
                                    người dùng học luật bằng cách gặp lỗi. */}
                                {capChonDuoc.map((c) => (
                                  <option key={c} value={String(c)}>
                                    {c} — {NHAN_CAP_QUYEN[c]}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              /* Khóa thì PHẢI nói vì sao — xem `duocSuaHoSo`, luôn kèm lý do. */
                              <span className="text-xs text-text-desc">{xet.lyDo}</span>
                            )}
                            {xet.duoc && (
                              <span className="mt-1 block text-xs text-text-desc">
                                {MO_TA_CAP_QUYEN[capMoi]}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            {xet.duoc && (
                              <Button
                                size="sm"
                                disabled={!daDoi || dangLuu}
                                onClick={() => setHoiDoi({ hs, capMoi })}
                              >
                                Đổi
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 🔴 HỎI TRƯỚC KHI ĐỔI. Đổi quyền của người khác ảnh hưởng ngay tới việc họ làm được gì —
          hạ nhầm một cấp là người ta mất quyền giữa lúc đang làm việc, và không tự lấy lại được. */}
      {hoiDoi && (
        <HopXacNhan
          mo
          tieuDe="Đổi cấp quyền?"
          moTa={
            `Đổi ${hoiDoi.hs.hoSo.tenHienThi} từ cấp ${hoiDoi.hs.hoSo.capTM} (${NHAN_CAP_QUYEN[hoiDoi.hs.hoSo.capTM]}) ` +
            `sang cấp ${hoiDoi.capMoi} (${NHAN_CAP_QUYEN[hoiDoi.capMoi]}). ` +
            `${MO_TA_CAP_QUYEN[hoiDoi.capMoi]}. Người này sẽ thấy thay đổi ở lần tải trang kế tiếp.`
          }
          nhanDongY="Đổi quyền"
          /* Đỏ khi HẠ cấp: hạ là lấy đi quyền người ta đang dùng, và họ không tự lấy lại được. */
          nguyHiem={hoiDoi.capMoi < hoiDoi.hs.hoSo.capTM}
          onDongY={() => {
            const { hs, capMoi } = hoiDoi;
            setHoiDoi(null);
            /* Hỏi luật LẦN NỮA ngay trước khi ghi. Giữa lúc hộp xác nhận đang mở, danh sách có thể
               đã được đọc lại và cấp của người kia đã khác. */
            const xet = duocDatCap(nguoiDung, capMoi);
            if (!xet.duoc) {
              toast.error("Không đổi được", { description: xet.lyDo });
              return;
            }
            void luu(hs, capMoi);
          }}
          onDong={() => setHoiDoi(null)}
        />
      )}
    </>
  );
}
