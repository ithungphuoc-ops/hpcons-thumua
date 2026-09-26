import type { ReactNode } from "react";
import Image from "next/image";
import type { DonDatHang, GiaDonDatHang } from "@/3-du-lieu/kieu-du-lieu";
import { laDongHang, tinhTienChiTietPO } from "@/2-quy-trinh/tinh-toan";
import { dongNgayThangNam, soPhieuXuatKho } from "@/2-quy-trinh/phieu-xuat-kho";
import { docSoTien } from "@/6-tien-ich/doc-so-tien";

/**
 * TỜ PHIẾU XUẤT KHO A4 DỌC — bản vẽ của **Mẫu PO-03** (Sếp 26/09/2026).
 *
 * 📄 Bám ĐÚNG biểu mẫu `1. INPUT/Phieu xuat kho   HPCons.xlsx` (sheet1, mẫu theo Thông tư
 * 200/2014/TT-BTC) — bố cục từng ô ghi ở đầu `2-quy-trinh/phieu-xuat-kho.ts`.
 *
 * 🔴 ĐƯỢC GỌI TỪ `ToDonMuaHangA4` khi `po.mauPO === "phieu_xuat_kho"`, KHÔNG gọi thẳng từ trang
 * in. Nhờ vậy cả hai trang in (`/in/don-hang/[id]` và `/in/don-hang-mau`) tự in đúng mẫu mà không
 * phải sửa trang nào — và vẫn chỉ có MỘT chỗ quyết định "đơn này in mẫu gì".
 *
 * 🔴 HAI QUY TẮC CỦA TRANG IN, giống hệt `to-don-mua-hang-a4.tsx` — đừng "sửa cho đúng chuẩn app":
 *  1. Màu và cỡ chữ viết CỨNG, không theo token theme / tùy chọn màu cá nhân (quy ước phiên 04).
 *  2. Nền trắng, không theo Dark Mode. Phông Times New Roman như mọi biểu mẫu giấy của công ty.
 *
 * 📌 Component THUẦN: không đọc kho dữ liệu, không kiểm quyền — trang gọi lo việc đó.
 *
 * ⚠️ CỘT "THỰC XUẤT" LUÔN TRỐNG trên giấy — thủ kho ghi tay lúc xuất (Kho là nguồn duy nhất của
 * số lượng thực tế, nguyên tắc dữ liệu số 2). Cột "Theo chứng từ" in số lượng của đơn.
 * ⚠️ ĐƠN GIÁ / THÀNH TIỀN chỉ in khi có chứng từ giá (`gia`); không có thì để trống cho kế toán
 * ghi, đúng như dữ liệu mẫu của biểu mẫu.
 */
export interface PropToPhieuXuatKhoA4 {
  po: DonDatHang;
  gia?: GiaDonDatHang;
  /** Bản mẫu chưa lưu — in thêm một dòng cảnh báo dưới tiêu đề, y như tờ PO. */
  banMau?: boolean;
}

/** Chuỗi chấm để viết tay khi ô bỏ trống — in ra giấy vẫn còn chỗ điền. */
const CHAM = "……………………………………";

export function ToPhieuXuatKhoA4({ po, gia, banMau = false }: PropToPhieuXuatKhoA4) {
  const tien = tinhTienChiTietPO(po, gia);
  const tienTheoDong = new Map(tien.dong.map((t) => [t.sttDong, t]));
  const coGia = gia !== undefined;
  const donViTien = gia?.loaiTien ?? "VND";
  const so = (n: number) => n.toLocaleString("vi-VN");
  const ngayIn = po.ngayLapPO ? new Date(po.ngayLapPO).toLocaleDateString("vi-VN") : CHAM;

  return (
    <article className="mx-auto w-full max-w-[210mm] px-[15mm] py-[12mm] text-[#000000] [font-family:'Times_New_Roman',Times,serif]">
      {/* ---------- ĐẦU TRANG: logo (A1:B3) · pháp nhân (C1:J3) · căn cứ mẫu (K1:M2) ---------- */}
      <header className="flex items-start gap-[4mm]">
        <Image
          src="/logo-hpc.png"
          alt="Logo Công ty Cổ phần Xây dựng Công nghiệp Hưng Phước"
          width={179}
          height={152}
          priority
          className="h-[18mm] w-auto shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold uppercase leading-tight">
            Công ty Cổ phần Xây dựng Công nghiệp Hưng Phước
          </p>
          <p className="mt-1 text-[11px] leading-snug">
            B_4B3_CN, Khu công nghiệp Mỹ Phước 3, Phường Thới Hòa, Thành phố Hồ Chí Minh, Việt
            Nam.
          </p>
          <p className="text-[11px]">3703172689</p>
        </div>
        {/* (Sếp chỉnh mẫu 26/09/2026: bỏ dòng "Ban hành theo Thông tư 200…", bảng đổi thành Tên mặt hàng · Quy cách / chủng loại (bỏ cột Mã số)). Ô K1:M2 của mẫu mới để trống. */}
      </header>

      {/* ---------- TIÊU ĐỀ (D5) · Ngày (D6) · Số (D7) | Nợ (L6) · Có (L7) ---------- */}
      <section className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-4">
        <div />
        <div className="text-center">
          <h1 className="text-[22px] font-bold uppercase tracking-wide">Phiếu xuất kho</h1>
          {banMau && (
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#B42318]">
              Bản mẫu — chưa cấp số, chưa lưu vào hệ thống
            </p>
          )}
          <p className="mt-1 text-[12px] italic">Ngày: {ngayIn}</p>
          <p className="text-[12px]">Số: {soPhieuXuatKho(po)}</p>
        </div>
        <div className="justify-self-end text-[12px]">
          <p>Nợ: {po.taiKhoanNoXuatKho?.trim() || "…………"}</p>
          <p>Có: {po.taiKhoanCoXuatKho?.trim() || "…………"}</p>
        </div>
      </section>

      {/* ---------- A9 · A11 · A13 | I13 · A15 ---------- */}
      <section className="mt-4 flex flex-col gap-1.5 text-[12px]">
        <p>Họ và tên người nhận: {po.nguoiNhanHangTen?.trim() || CHAM}</p>
        {/* Dòng "Theo …" để trống thì in NGUYÊN dải chấm của biểu mẫu — chỗ viết tay. */}
        <p>
          Theo{" "}
          {po.canCuXuatKho?.trim() ||
            "........... số .............. ngày ..... tháng ..... năm ..... của .............................................."}
        </p>
        <div className="grid grid-cols-[3fr_2fr] gap-4">
          <p>Xuất tại kho: {po.khoXuat?.trim() || CHAM}</p>
          <p>Địa điểm: {po.diaDiemKhoXuat?.trim() || CHAM}</p>
        </div>
        <p>Diễn giải: {po.dienGiaiXuatKho?.trim() || CHAM}</p>
      </section>

      {/* ---------- BẢNG (A17:M22) ----------
          Bề rộng cột theo tỉ lệ cột A→M của biểu mẫu (A · B:D · E:F · G · H:I · J · K:L · M). */}
      <div className="mt-3 overflow-x-auto print:overflow-visible">
        <table className="w-full min-w-[170mm] border-collapse text-[11px] print:min-w-0">
          <colgroup>
            <col className="w-[6%]" />
            <col className="w-[33%]" />
            <col className="w-[10%]" />
            <col className="w-[7%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr>
              <O th rowSpan={2}>STT</O>
              <O th rowSpan={2}>Tên mặt hàng</O>
              <O th rowSpan={2}>Quy cách / chủng loại</O>
              <O th rowSpan={2}>Đơn vị tính</O>
              <O th colSpan={2}>Số lượng</O>
              <O th rowSpan={2}>Đơn giá</O>
              <O th rowSpan={2}>Thành tiền</O>
            </tr>
            <tr>
              <O th>Theo chứng từ</O>
              <O th>Thực xuất</O>
            </tr>
            <tr className="italic">
              {["A", "B", "C", "D", "1", "2", "3", "4"].map((k) => (
                <O key={k} th giua>
                  {k}
                </O>
              ))}
            </tr>
          </thead>
          <tbody>
            {po.items.map((d) => {
              if (!laDongHang(d)) {
                /* Dòng ghi chú của người lập — in ra nhưng không phải một mặt hàng. */
                return (
                  <tr key={d.sttDong} className="break-inside-avoid">
                    <O />
                    <O colSpan={7} nghieng>
                      {d.tenVatLieu}
                    </O>
                  </tr>
                );
              }
              const t = tienTheoDong.get(d.sttDong);
              return (
                <tr key={d.sttDong} className="break-inside-avoid">
                  <O giua>{d.sttDong}</O>
                  <O>{d.tenVatLieu}</O>
                  <O>{d.thongSoKyThuat?.trim() ?? ""}</O>
                  <O giua>{d.donViTinh}</O>
                  <O phai>{so(d.khoiLuongDat)}</O>
                  {/* Thực xuất — thủ kho ghi tay. */}
                  <O />
                  <O phai>{coGia && t ? so(t.donGia) : ""}</O>
                  <O phai>{coGia && t ? so(t.thanhTien) : ""}</O>
                </tr>
              );
            })}
            <tr className="font-bold">
              <O />
              <O giua>Cộng</O>
              <O />
              <O />
              <O />
              <O />
              <O />
              <O phai>{coGia ? so(tien.congTienHang) : ""}</O>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ---------- A23 · A24 ---------- */}
      <section className="mt-2 flex flex-col gap-1 text-[12px]">
        <p>
          Tổng số tiền (Viết bằng chữ):{" "}
          <span className="italic">
            {!coGia
              ? CHAM
              : donViTien === "VND"
                ? docSoTien(tien.congTienHang)
                : `${so(tien.congTienHang)} ${donViTien}`}
          </span>
        </p>
        <p>Số chứng từ gốc kèm theo: {po.soChungTuGocXuatKho?.trim() || CHAM}</p>
      </section>

      {/* ---------- I25 + BỐN Ô KÝ (A26 · D26 · F26 · I26) ---------- */}
      <section className="mt-4 break-inside-avoid text-[12px]">
        <p className="text-right italic">{dongNgayThangNam(po.ngayLapPO)}</p>
        <div className="mt-2 grid grid-cols-4 gap-2 text-center">
          <OKy ten="Người lập biểu" />
          <OKy ten="Người nhận hàng" />
          <OKy ten="Thủ kho" />
          <OKy ten="Kế toán trưởng" phu="(Hoặc bộ phận có nhu cầu nhập)" />
        </div>
      </section>
    </article>
  );
}

function OKy({ ten, phu }: { ten: string; phu?: string }) {
  return (
    <div>
      <p className="font-bold">{ten}</p>
      {phu && <p className="text-[11px] italic">{phu}</p>}
      <p className="text-[11px] italic">(Ký, họ tên)</p>
      <div className="h-20" />
    </div>
  );
}

/** Một ô của bảng — viền mảnh màu đen như biểu mẫu. */
function O({
  children,
  th,
  giua,
  phai,
  colSpan,
  rowSpan,
  nghieng,
}: {
  children?: ReactNode;
  th?: boolean;
  giua?: boolean;
  phai?: boolean;
  colSpan?: number;
  rowSpan?: number;
  nghieng?: boolean;
}) {
  const canh = th || giua ? "text-center" : phai ? "text-right" : "text-left";
  const lop = `border border-[#000000] px-1.5 py-1 align-middle ${canh}${
    nghieng ? " italic text-[#475467]" : ""
  }`;
  if (th) {
    return (
      <th className={`${lop} font-bold`} colSpan={colSpan} rowSpan={rowSpan}>
        {children}
      </th>
    );
  }
  return (
    <td className={lop} colSpan={colSpan} rowSpan={rowSpan}>
      {children}
    </td>
  );
}
