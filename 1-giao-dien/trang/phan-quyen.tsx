"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Minus, RefreshCw, Search, ShieldAlert, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
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
  docDanhBaCongTy,
  docHoSoDePhanQuyen,
  ganVaiTro,
  type HoSoKemMa,
  type ThanhVienDanhBa,
} from "@/5-ket-noi/ho-so-tai-khoan";
import { boDau } from "@/6-tien-ich/bo-dau";

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
 * ## 📌 20/08/2026 — GHI ĐƯỢC THẬT, QUA API RIÊNG
 * Firestore vẫn khóa ghi `nguoi-dung/{uid}` thẳng từ trình duyệt (`allow write: if false`,
 * đúng thiết kế — hồ sơ chứa cấp quyền của chính người đó). Nhưng route
 * `app/api/phan-quyen` (chạy máy chủ, Admin SDK) tự kiểm ĐÚNG luật ở `luat-phan-quyen.ts` rồi
 * ghi thay — xem `5-ket-noi/ho-so-tai-khoan.ts` → `ganVaiTro()`. Màn hình này giờ ghi được
 * thật, không cần rời khỏi app.
 *
 * ## 📌 THÊM NGƯỜI MỚI — LẤY THẲNG DANH BẠ APP TỔNG
 * Không cần biết trước mã Firebase của ai: khối "Thêm người dùng mới" đọc danh bạ công ty qua
 * `app/api/directory` (đọc `users`/`departments` của App Tổng bằng Admin SDK), lọc sẵn những
 * người CHƯA có hồ sơ Thu mua. Tên/email/phòng ban ghi vào hồ sơ mới lấy THẲNG từ đó — không
 * gõ tay, không đánh máy sai tên.
 */
export default function TrangPhanQuyen() {
  const { nguoiDung, quyen } = useNguoiDung();

  const [danhSach, setDanhSach] = useState<HoSoKemMa[] | null>(null);
  const [dangTai, setDangTai] = useState(false);
  /** Vai trò vừa chọn nhưng CHƯA lưu, tra theo mã Firebase. */
  const [vaiTroNhap, setVaiTroNhap] = useState<Record<string, string>>({});
  const [hoiDoi, setHoiDoi] = useState<{ hs: HoSoKemMa; vt: VaiTroChuan } | null>(null);
  const [dangLuu, setDangLuu] = useState(false);

  // ---------- Khối "Thêm người dùng mới" — danh bạ công ty ----------
  const [danhBa, setDanhBa] = useState<ThanhVienDanhBa[] | null>(null);
  const [dangTaiDanhBa, setDangTaiDanhBa] = useState(false);
  const [tuKhoaTim, setTuKhoaTim] = useState("");
  const [vaiTroChonMoi, setVaiTroChonMoi] = useState<Record<string, string>>({});
  const [hoiThemMoi, setHoiThemMoi] = useState<{ tv: ThanhVienDanhBa; vt: VaiTroChuan } | null>(null);

  const laCheDoThat = CHE_DO_XAC_THUC === "sso";

  const tai = useCallback(async () => {
    if (!laCheDoThat) return;
    setDangTai(true);
    try {
      setDanhSach(await docHoSoDePhanQuyen());
    } finally {
      setDangTai(false);
    }
  }, [laCheDoThat]);

  const taiDanhBa = useCallback(async () => {
    if (!laCheDoThat) return;
    setDangTaiDanhBa(true);
    try {
      setDanhBa(await docDanhBaCongTy());
    } finally {
      setDangTaiDanhBa(false);
    }
  }, [laCheDoThat]);

  useEffect(() => {
    void tai();
    void taiDanhBa();
  }, [tai, taiDanhBa]);

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
      const loi = await ganVaiTro(hs.firebaseUid, vt.ma);
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

  async function themMoi(tv: ThanhVienDanhBa, vt: VaiTroChuan) {
    setDangLuu(true);
    try {
      const loi = await ganVaiTro(tv.uid, vt.ma);
      if (loi) {
        toast.error("Chưa cấp được quyền", { description: loi, duration: 12000 });
        return;
      }
      toast.success("Đã cấp quyền", { description: `${tv.hoTen} → ${vt.ten}` });
      // Đọc lại CẢ HAI danh sách: người mới vừa thêm phải biến mất khỏi danh bạ "chưa có hồ
      // sơ" và hiện ra ở bảng chỉnh sửa bên dưới — không tự suy đoán, đọc lại máy chủ thật.
      await Promise.all([tai(), taiDanhBa()]);
      setVaiTroChonMoi((c) => {
        const conLai = { ...c };
        delete conLai[tv.uid];
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

      {/* ---------- THÊM NGƯỜI DÙNG MỚI — lấy thẳng danh bạ App Tổng ---------- */}
      {laCheDoThat && (
        <Card>
          <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserPlus className="size-4 shrink-0 text-primary" aria-hidden />
                <p className="text-h3 text-text-primary">Thêm người dùng mới</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void taiDanhBa()}
                disabled={dangTaiDanhBa}
              >
                <RefreshCw className={`size-4 ${dangTaiDanhBa ? "animate-spin" : ""}`} aria-hidden />
                Đọc lại danh bạ
              </Button>
            </div>
            <p className="text-sm text-text-secondary">
              Tìm người trong danh bạ công ty (App Tổng) rồi gán vai trò — không cần biết trước
              mã tài khoản, không cần làm gì bên ngoài app này.
            </p>

            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-desc"
                aria-hidden
              />
              <Input
                value={tuKhoaTim}
                onChange={(e) => setTuKhoaTim(e.target.value)}
                placeholder="Tìm theo tên hoặc email…"
                className="pl-9"
                aria-label="Tìm người trong danh bạ công ty"
              />
            </div>

            {dangTaiDanhBa && danhBa === null && (
              <p className="text-sm text-text-desc">Đang đọc danh bạ công ty…</p>
            )}

            {danhBa !== null && (() => {
              const chuaCoHoSo = danhBa.filter((tv) => !tv.daCoHoSoThuMua);
              const tuKhoa = boDau(tuKhoaTim.trim());
              const ketQua = (tuKhoa ? chuaCoHoSo.filter((tv) => boDau(tv.hoTen).includes(tuKhoa) || boDau(tv.email).includes(tuKhoa)) : chuaCoHoSo).slice(0, 30);

              if (chuaCoHoSo.length === 0) {
                return (
                  <p className="text-sm text-text-desc">
                    Toàn bộ công ty đã có hồ sơ ở app Thu mua, hoặc chưa đọc được danh bạ.
                  </p>
                );
              }
              if (ketQua.length === 0) {
                return <p className="text-sm text-text-desc">Không tìm thấy ai khớp &quot;{tuKhoaTim}&quot;.</p>;
              }

              return (
                <div className="flex flex-col gap-(--hp-md-row-gap)">
                  {ketQua.map((tv) => {
                    const maChon = vaiTroChonMoi[tv.uid] ?? "";
                    const vtChon = timVaiTroChuan(maChon);
                    return (
                      <div
                        key={tv.uid}
                        className="flex flex-col gap-3 rounded-xl border border-border p-(--hp-md-card-pad) sm:flex-row sm:items-start"
                      >
                        <div className="sm:w-1/3 sm:shrink-0">
                          <p className="font-medium text-text-primary">{tv.hoTen}</p>
                          <p className="text-xs text-text-desc">{tv.email}</p>
                          <p className="mt-1 text-xs text-text-secondary">
                            {tv.chucDanh || "—"} · {tv.phongBan || "—"}
                          </p>
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <select
                            value={maChon}
                            onChange={(e) =>
                              setVaiTroChonMoi((c) => ({ ...c, [tv.uid]: e.target.value }))
                            }
                            aria-label={`Vai trò cho ${tv.hoTen}`}
                            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors hover:border-primary focus:border-primary focus:outline-none"
                          >
                            <option value="">— chọn vai trò —</option>
                            {vaiTroGanDuoc
                              .filter((v) => v.ma !== "ngung_truy_cap")
                              .map((v) => (
                                <option key={v.ma} value={v.ma}>
                                  {v.ten}
                                </option>
                              ))}
                          </select>
                          {vtChon && (
                            <>
                              <p className="text-xs text-text-desc">{vtChon.moTa}</p>
                              <ViecLamDuoc vt={vtChon} />
                            </>
                          )}
                        </div>

                        <div className="sm:shrink-0">
                          <Button
                            size="sm"
                            disabled={!vtChon || dangLuu}
                            onClick={() => vtChon && setHoiThemMoi({ tv, vt: vtChon })}
                          >
                            Cấp quyền
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

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

      {/* Hỏi trước khi CẤP QUYỀN MỚI — người này trước đó chưa vào được app, cấp nhầm vai trò
          rộng là lộ dữ liệu ngay từ lần đăng nhập đầu tiên. */}
      {hoiThemMoi && (
        <HopXacNhan
          mo
          tieuDe="Cấp quyền cho người này?"
          moTa={
            `Cấp cho ${hoiThemMoi.tv.hoTen} (${hoiThemMoi.tv.email}) vai trò “${hoiThemMoi.vt.ten}”. ` +
            `${hoiThemMoi.vt.moTa} Người này đăng nhập lần tới bằng đúng tài khoản HPcore của họ là vào được ngay.`
          }
          nhanDongY="Cấp quyền"
          onDongY={() => {
            const { tv, vt } = hoiThemMoi;
            setHoiThemMoi(null);
            const xet = duocDatCap(nguoiDung, vt.capTM);
            if (!xet.duoc) {
              toast.error("Không cấp được", { description: xet.lyDo });
              return;
            }
            if (!vaiTroGanDuocBoi(toiDa).some((x) => x.ma === vt.ma)) {
              toast.error("Không cấp được", {
                description: `Vai trò “${vt.ten}” chỉ tài khoản Quản trị mới gán được.`,
              });
              return;
            }
            void themMoi(tv, vt);
          }}
          onDong={() => setHoiThemMoi(null)}
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
