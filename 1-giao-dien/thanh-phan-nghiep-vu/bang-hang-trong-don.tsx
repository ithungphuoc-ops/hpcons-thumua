"use client";

import type { TienDoDongPO } from "@/3-du-lieu/kieu-du-lieu";
/* Dùng lại thanh tiến độ có sẵn — không dựng thanh riêng (và không inline style ở tệp này). */
import { ThanhTienDo } from "@/1-giao-dien/thanh-phan-nghiep-vu/thanh-tien-do";

/**
 * ★★ BẢNG "HÀNG TRONG ĐƠN" — xổ ra dưới một đơn ở màn Đơn đặt hàng.
 *
 * Sếp 27/09/2026 duyệt bản demo (artifact "Demo Đơn đặt hàng"): *"cửa sổ theo dõi đơn hàng cũng làm
 * tương tự"* màn Theo dõi đề nghị — cùng kiểu với `bang-hang-da-dat.tsx`: canh giữa, luôn xuống dòng,
 * Tên hàng + Quy cách mỗi cột 18rem (không chia hết phần còn lại — Sếp: *"giảm còn 2/3"*).
 *
 * 🔴 CHỈ BÀY, KHÔNG TÍNH. `tienDo` từ `tinhTienDoPO` (chỉ đếm phiếu `da_nhap_kho` — §3.5.4), đơn
 * giá / thành tiền từ `tinhTienChiTietPO` — cùng hai hàm trang chi tiết đơn đang dùng.
 *
 * 🔒 `giaTheoDong` chỉ truyền khi vai trò xem được giá (`quyen.xemGia`). Không truyền = không có cột
 * giá. Phiếu xuất kho (PO-03) không có giá → ô để TRỐNG, không in 0 (Sếp 26/09/2026).
 */
const O = "px-3 py-2 text-center align-middle whitespace-normal wrap-break-word text-xs";
const TH = `${O} font-semibold`;

const so = (n: number) => n.toLocaleString("vi-VN");
const tien = (n: number | undefined) => (n ? `${so(n)} ₫` : "");

export function BangHangTrongDon({
  tienDo,
  giaTheoDong,
}: {
  tienDo: TienDoDongPO[];
  giaTheoDong?: Map<number, { donGia: number; thanhTien: number }>;
}) {
  const coGia = Boolean(giaTheoDong);
  return (
    <div className="flex w-full flex-col gap-2">
      <span className="text-xs font-semibold tracking-wide text-primary uppercase">
        Hàng trong đơn — {tienDo.length} mặt hàng
      </span>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        {/* `min-w-*` = tổng bề rộng các cột — khung hẹp thì cuộn ngang chứ không bóp chữ. */}
        <table className={`w-full table-fixed ${coGia ? "min-w-[105rem]" : "min-w-[88rem]"}`}>
          <thead>
            <tr className="border-b bg-primary/10 text-primary">
              <th className={`${TH} w-12`}>STT</th>
              <th className={`${TH} w-72`}>Tên hàng</th>
              <th className={`${TH} w-72`}>Quy cách</th>
              <th className={`${TH} w-20`}>ĐVT</th>
              <th className={`${TH} w-24`}>SL đặt</th>
              <th className={`${TH} w-24`}>Đã nhận</th>
              <th className={`${TH} w-24`}>Còn lại</th>
              {coGia && (
                <>
                  <th className={`${TH} w-32`}>Đơn giá</th>
                  <th className={`${TH} w-36`}>Thành tiền</th>
                </>
              )}
              <th className={`${TH} w-40`}>Tiến độ nhận</th>
            </tr>
          </thead>
          <tbody>
            {tienDo.map((d) => {
              const g = giaTheoDong?.get(d.sttDong);
              return (
                <tr key={d.sttDong} className="border-b last:border-b-0">
                  <td className={`${O} text-text-desc`}>{d.sttDong}</td>
                  <td className={`${O} font-medium text-text-primary`}>{d.tenVatLieu}</td>
                  <td className={`${O} text-text-secondary`}>{d.thongSoKyThuat?.trim() || "—"}</td>
                  <td className={O}>{d.donViTinh}</td>
                  <td className={`${O} tabular-nums`}>{so(d.khoiLuongDat)}</td>
                  <td className={`${O} font-semibold tabular-nums`}>{so(d.khoiLuongDaNhan)}</td>
                  <td
                    className={`${O} font-semibold tabular-nums ${
                      d.khoiLuongConLai > 0 ? "text-warning-soft" : "text-success-soft"
                    }`}
                  >
                    {so(d.khoiLuongConLai)}
                  </td>
                  {coGia && (
                    <>
                      <td className={`${O} tabular-nums`}>{tien(g?.donGia)}</td>
                      <td className={`${O} font-semibold tabular-nums`}>{tien(g?.thanhTien)}</td>
                    </>
                  )}
                  <td className={O}>
                    <ThanhTienDo
                      phanTram={d.phanTram}
                      tong={d.phanTram >= 100 ? "success" : "primary"}
                      className="mx-auto w-24 items-center"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Bản điện thoại — V1.1: bảng nhiều cột trên màn hẹp phải đổi sang thẻ. */
export function TheHangTrongDon({
  tienDo,
  giaTheoDong,
}: {
  tienDo: TienDoDongPO[];
  giaTheoDong?: Map<number, { donGia: number; thanhTien: number }>;
}) {
  return (
    <div className="flex flex-col gap-2">
      {tienDo.map((d) => {
        const g = giaTheoDong?.get(d.sttDong);
        return (
          <div key={d.sttDong} className="flex flex-col gap-1 rounded-lg border border-border bg-background p-3">
            <span className="text-sm font-medium text-text-primary">
              {d.sttDong}. {d.tenVatLieu}
              {d.thongSoKyThuat?.trim() ? ` — ${d.thongSoKyThuat.trim()}` : ""}
            </span>
            <span className="text-xs tabular-nums text-text-secondary">
              Đặt {so(d.khoiLuongDat)} · Đã nhận {so(d.khoiLuongDaNhan)} · Còn {so(d.khoiLuongConLai)}{" "}
              {d.donViTinh}
            </span>
            {g?.donGia ? (
              <span className="text-xs tabular-nums text-text-desc">
                Đơn giá {tien(g.donGia)} · Thành tiền {tien(g.thanhTien)}
              </span>
            ) : null}
            <ThanhTienDo phanTram={d.phanTram} tong={d.phanTram >= 100 ? "success" : "primary"} />
          </div>
        );
      })}
    </div>
  );
}
