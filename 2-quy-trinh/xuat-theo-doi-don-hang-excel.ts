// ============================================================
// XUẤT EXCEL CẢ BẢNG "THEO DÕI ĐƠN HÀNG" — theo mẫu "BẢNG THEO DÕI ĐƠN MUA HÀNG THÁNG … NĂM …"
//
// ★ Sếp 02/10/2026: *"Thêm nút xuất excel bảng tổng của giao diện này"* (màn /don-hang).
//
// 📌 CỘT Y HỆT BẢNG TRÊN MÀN (`don-hang-danh-sach.tsx`), và CẮT CỘT THEO QUYỀN Y HỆT: không xem
//    giá thì không có Giá trị / Ngày hoá đơn / Theo dõi ③; không xem NCC thì không có cột NCC; không
//    xem người phụ trách thì không có cột Nhân viên. Tệp xuất ra mà lộ thứ màn hình giấu là rò dữ
//    liệu qua đường tải về.
// 📌 SỐ LIỆU KHÔNG TÍNH LẠI: mỗi dòng nhận nguyên `DongTheoDoiDonHang` (`theo-doi-don-hang.ts`) mà
//    màn đang vẽ — một nguồn, hai nơi bày.
// 📌 Ngày ghi là NGÀY THẬT của Excel (lọc / sắp xếp được), định dạng `dd/mm/yy` như mẫu. Dựng bằng
//    `Date.UTC` vì exceljs đổi Date sang số ngày Excel theo UTC — dựng theo giờ máy là lệch một ngày.
// 📌 Ô Theo dõi bị TRỄ (cột ① ②, số âm) tô nền vàng + chữ đỏ như ô tô vàng của mẫu. Màu viết cứng
//    trong tệp là CỐ Ý (tệp Excel không theo token giao diện — cùng lý do tờ in A4).
// ============================================================

import type * as ThuVienExcel from "exceljs";
import type { DonDatHang, NgayISO } from "@/3-du-lieu/kieu-du-lieu";
import type { DongTheoDoiDonHang } from "@/2-quy-trinh/theo-doi-don-hang";
import { lamSachTenTep } from "@/2-quy-trinh/xuat-don-hang-excel";

type ExcelJS = typeof ThuVienExcel;

/** Một dòng đưa vào tệp — đúng những gì dòng trên màn đang có. */
export interface DongXuatTheoDoi {
  po: Pick<DonDatHang, "code" | "supplierTen" | "nguoiPhuTrachTen" | "ghiChu">;
  td: DongTheoDoiDonHang;
  giaTri: number;
  /** Chữ trạng thái đã dịch sẵn (vd "Đang giao") — nhãn ở `trang-thai.ts`, không dịch lại ở đây. */
  trangThai: string;
  /** `soNgayQuaHanChuaGiao` — có số thì ô "Ngày giao hàng" ghi "Chưa giao · quá hạn N ngày" như màn. */
  quaHanChuaGiao?: number | null;
}

export interface KhungNgayDat {
  tuNgay: NgayISO | "";
  denNgay: NgayISO | "";
}

/**
 * Lọc theo NGÀY ĐẶT HÀNG (ngày lập PO) — mẫu Excel là bảng theo tháng đặt hàng. Để trống một đầu là
 * không giới hạn đầu đó. Có khung mà đơn không có ngày đặt hàng thì loại (không biết thuộc tháng nào).
 */
export function locTheoKhungNgayDat<T extends { td: Pick<DongTheoDoiDonHang, "ngayDatHang"> }>(
  ds: readonly T[],
  khung: KhungNgayDat,
): T[] {
  if (!khung.tuNgay && !khung.denNgay) return [...ds];
  return ds.filter((d) => {
    const n = d.td.ngayDatHang;
    if (!n) return false;
    if (khung.tuNgay && n < khung.tuNgay) return false;
    if (khung.denNgay && n > khung.denNgay) return false;
    return true;
  });
}

const dd = (iso: string) => {
  const [n, t, d] = iso.slice(0, 10).split("-");
  return `${d}/${t}/${n}`;
};

/**
 * Dòng tiêu đề lớn. Khung đúng TRỌN MỘT THÁNG (01 → ngày cuối tháng) thì ghi đúng như mẫu
 * *"… THÁNG 04 NĂM 2026"*; khung khác thì ghi rõ từ ngày / đến ngày — ghi "THÁNG 04" cho một khung
 * nửa tháng là nói sai phạm vi của bảng.
 */
export function tieuDeBangTheoDoi(khung: KhungNgayDat): string {
  const goc = "BẢNG THEO DÕI ĐƠN MUA HÀNG";
  const { tuNgay, denNgay } = khung;
  if (tuNgay && denNgay && tuNgay.slice(0, 7) === denNgay.slice(0, 7) && tuNgay.slice(8, 10) === "01") {
    const [n, t] = tuNgay.split("-").map(Number);
    const cuoiThang = new Date(Date.UTC(n, t, 0)).getUTCDate();
    if (Number(denNgay.slice(8, 10)) === cuoiThang) {
      return `${goc} THÁNG ${String(t).padStart(2, "0")} NĂM ${n}`;
    }
  }
  if (tuNgay && denNgay) return `${goc} TỪ NGÀY ${dd(tuNgay)} ĐẾN NGÀY ${dd(denNgay)}`;
  if (tuNgay) return `${goc} TỪ NGÀY ${dd(tuNgay)}`;
  if (denNgay) return `${goc} ĐẾN NGÀY ${dd(denNgay)}`;
  return goc;
}

/** Tên tệp: `Theo-doi-don-hang_<từ>_<đến>.xlsx`. */
export function tenFileTheoDoiDonHang(khung: KhungNgayDat): string {
  return `${lamSachTenTep(`Theo-doi-don-hang_${khung.tuNgay || "dau"}_${khung.denNgay || "nay"}`)}.xlsx`;
}

/** Quyền cắt cột — đúng ba cờ màn hình dùng. */
export interface QuyenCotTheoDoi {
  xemGia: boolean;
  xemNhaCungCap: boolean;
  xemNguoiPhuTrach: boolean;
}

type LoaiO = "chu" | "so" | "tien" | "ngay" | "ngay_giao" | "theo_doi_han" | "theo_doi_wf";
interface Cot {
  tieuDe: string;
  /** Tiêu đề NHÓM ở tầng trên (Công trình / Nhà cung cấp) — không có thì gộp dọc hai tầng. */
  nhom?: string;
  rong: number;
  loai: LoaiO;
  lay: (d: DongXuatTheoDoi, stt: number) => string | number | undefined | null;
}

/** Bộ cột — thứ tự Y HỆT bảng trên màn. */
export function cotTheoQuyen(q: QuyenCotTheoDoi): Cot[] {
  const cot: (Cot | false)[] = [
    { tieuDe: "STT", rong: 6, loai: "so", lay: (_d, stt) => stt },
    { tieuDe: "Mã đề xuất", rong: 13, loai: "chu", lay: (d) => d.td.maDeXuat },
    { tieuDe: "Số đơn hàng", rong: 14, loai: "chu", lay: (d) => d.po.code },
    q.xemNhaCungCap && { tieuDe: "Nhà cung cấp", rong: 30, loai: "chu", lay: (d) => d.po.supplierTen },
    { tieuDe: "Mục đích sử dụng", rong: 24, loai: "chu", lay: (d) => d.td.mucDichSuDung },
    { tieuDe: "Nơi sử dụng", rong: 20, loai: "chu", lay: (d) => d.td.noiSuDung },
    q.xemGia && { tieuDe: "Giá trị", rong: 14, loai: "tien", lay: (d) => d.giaTri },
    { tieuDe: "Ngày lập đề nghị", nhom: "Công trình", rong: 11, loai: "ngay", lay: (d) => d.td.ngayLapDeNghi },
    { tieuDe: "Ngày đề nghị cấp", nhom: "Công trình", rong: 11, loai: "ngay", lay: (d) => d.td.ngayDeNghiCap },
    { tieuDe: "Ngày nhận hàng", nhom: "Công trình", rong: 11, loai: "ngay", lay: (d) => d.td.ngayNhanLanDau },
    { tieuDe: "Theo dõi", rong: 8, loai: "theo_doi_han", lay: (d) => d.td.theoDoiCongTrinh },
    { tieuDe: "Ngày đặt hàng", nhom: "Nhà cung cấp", rong: 11, loai: "ngay", lay: (d) => d.td.ngayDatHang },
    { tieuDe: "Ngày thoả thuận giao hàng", nhom: "Nhà cung cấp", rong: 12, loai: "ngay", lay: (d) => d.td.ngayThoaThuanGiao },
    { tieuDe: "Ngày giao hàng", nhom: "Nhà cung cấp", rong: 13, loai: "ngay_giao", lay: (d) => d.td.ngayNhanLanDau },
    { tieuDe: "Theo dõi", rong: 8, loai: "theo_doi_han", lay: (d) => d.td.theoDoiNCC },
    { tieuDe: "Người nhận", rong: 24, loai: "chu", lay: (d) => d.td.nguoiNhan },
    q.xemNguoiPhuTrach && { tieuDe: "Nhân viên thực hiện đơn hàng", rong: 24, loai: "chu", lay: (d) => d.po.nguoiPhuTrachTen },
    { tieuDe: "Ghi chú", rong: 20, loai: "chu", lay: (d) => d.po.ghiChu },
    q.xemGia && { tieuDe: "Ngày hoá đơn / phiếu giao hàng", rong: 13, loai: "ngay", lay: (d) => d.td.ngayHoaDon },
    { tieuDe: "Ngày up workflow", rong: 12, loai: "ngay", lay: (d) => d.td.ngayUpWorkflow },
    q.xemGia && { tieuDe: "Theo dõi", rong: 8, loai: "theo_doi_wf", lay: (d) => d.td.theoDoiWorkflow },
    { tieuDe: "Trạng thái", rong: 16, loai: "chu", lay: (d) => d.trangThai },
  ];
  return cot.filter((c): c is Cot => c !== false);
}

const VIEN: Partial<ThuVienExcel.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

/** `yyyy-mm-dd` → Date UTC nửa đêm (exceljs đổi sang số ngày Excel theo UTC). */
function sangNgayExcel(iso: string | undefined | null): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
}

/**
 * Dựng workbook. THUẦN: không đọc kho, không kiểm quyền (nhận cờ quyền vào), thư viện truyền vào —
 * bài kiểm Node gọi thẳng được (cùng cách `dungPhieuXuatKhoExcel`).
 */
export function dungTheoDoiDonHangExcel(
  thuVien: ExcelJS,
  dv: { dong: readonly DongXuatTheoDoi[]; quyen: QuyenCotTheoDoi; khung: KhungNgayDat; nguoiXuat: string },
): ThuVienExcel.Workbook {
  const wb = new thuVien.Workbook();
  wb.creator = "App Thu mua HP Cons";
  const ws = wb.addWorksheet("Theo doi don hang", { views: [{ state: "frozen", ySplit: 4, xSplit: 3 }] });
  const cot = cotTheoQuyen(dv.quyen);
  const n = cot.length;

  ws.mergeCells(1, 1, 1, n);
  const o1 = ws.getCell(1, 1);
  o1.value = tieuDeBangTheoDoi(dv.khung);
  o1.font = { bold: true, size: 16 };
  o1.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 28;

  ws.mergeCells(2, 1, 2, n);
  const o2 = ws.getCell(2, 1);
  /* 🔴 Chú thích nói ĐÚNG nghĩa từng cột Theo dõi — cột ③ ngược chiều ① ② (phản biện 02/10/2026):
     ghi chung "âm là trễ" thì người đọc hiểu ③ = −2 là trễ 2 ngày, trong khi đó là up TRƯỚC hoá đơn. */
  o2.value =
    `Xuất bởi ${dv.nguoiXuat} lúc ${new Date().toLocaleString("vi-VN")} · ${dv.dong.length} đơn · ` +
    "Theo dõi (Công trình, NCC): âm là trễ, ô tô vàng" +
    (dv.quyen.xemGia ? " · Theo dõi cuối: số ngày up workflow SAU ngày hoá đơn (âm = up trước hoá đơn)" : "");
  o2.font = { italic: true, size: 10 };

  /* Hai tầng tiêu đề: tầng 3 = nhóm (hoặc tên cột gộp dọc), tầng 4 = tên cột trong nhóm. */
  const TRAN = 3;
  const DUOI = 4;
  let c = 1;
  while (c <= n) {
    const cc = cot[c - 1];
    if (cc.nhom) {
      let het = c;
      while (het + 1 <= n && cot[het].nhom === cc.nhom) het += 1;
      ws.mergeCells(TRAN, c, TRAN, het);
      ws.getCell(TRAN, c).value = cc.nhom;
      for (let k = c; k <= het; k++) ws.getCell(DUOI, k).value = cot[k - 1].tieuDe;
      c = het + 1;
    } else {
      ws.mergeCells(TRAN, c, DUOI, c);
      ws.getCell(TRAN, c).value = cc.tieuDe;
      c += 1;
    }
  }
  for (const r of [TRAN, DUOI]) {
    const row = ws.getRow(r);
    row.height = r === TRAN ? 22 : 34;
    for (let k = 1; k <= n; k++) {
      const o = row.getCell(k);
      o.font = { bold: true, size: 10 };
      o.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      o.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDDD9C4" } };
      o.border = VIEN;
    }
  }
  cot.forEach((cc, i) => {
    ws.getColumn(i + 1).width = cc.rong;
  });

  dv.dong.forEach((d, i) => {
    const row = ws.getRow(DUOI + 1 + i);
    cot.forEach((cc, k) => {
      const o = row.getCell(k + 1);
      const v = cc.lay(d, i + 1);
      o.border = VIEN;
      o.alignment = { horizontal: cc.loai === "chu" && k > 2 ? "left" : "center", vertical: "middle", wrapText: true };
      o.font = { size: 10 };
      if (cc.loai === "ngay_giao" && typeof d.quaHanChuaGiao === "number") {
        /* Chưa giao mà quá hạn — ghi chữ đỏ như ô trên màn, không để trống. */
        o.value = `Chưa giao · quá hạn ${d.quaHanChuaGiao} ngày`;
        o.font = { size: 10, bold: true, color: { argb: "FFC00000" } };
      } else if (cc.loai === "ngay" || cc.loai === "ngay_giao") {
        const ngay = sangNgayExcel(typeof v === "string" ? v : null);
        o.value = ngay;
        o.numFmt = "dd/mm/yy";
      } else if (cc.loai === "tien") {
        o.value = typeof v === "number" ? v : null;
        o.numFmt = "#,##0";
        o.alignment = { horizontal: "right", vertical: "middle" };
      } else if (cc.loai === "theo_doi_han" || cc.loai === "theo_doi_wf") {
        o.value = typeof v === "number" ? v : null;
        /* Chỉ cột ① ② (mốc hẹn − ngày thật) tô khi ÂM = trễ. Cột ③ (up workflow − hoá đơn) ngược chiều,
           không tô theo dấu — cùng luật ô `OTheoDoi` trên màn. */
        if (cc.loai === "theo_doi_han" && typeof v === "number" && v < 0) {
          o.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
          o.font = { size: 10, bold: true, color: { argb: "FFC00000" } };
        }
      } else {
        o.value = v === undefined || v === null || v === "" ? null : v;
      }
    });
  });

  ws.autoFilter = { from: { row: DUOI, column: 1 }, to: { row: DUOI, column: n } };
  return wb;
}

/** Bản gọi từ trình duyệt: nạp exceljs động (không cộng ~1MB vào gói tải đầu) rồi trả Blob. */
export async function xuatTheoDoiDonHangExcel(dv: Parameters<typeof dungTheoDoiDonHangExcel>[1]): Promise<Blob> {
  const thuVien = await import("exceljs");
  const buf = await dungTheoDoiDonHangExcel(thuVien, dv).xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
