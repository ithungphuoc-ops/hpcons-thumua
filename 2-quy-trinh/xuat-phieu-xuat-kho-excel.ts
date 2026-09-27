// ============================================================
// XUẤT PHIẾU XUẤT KHO (MẪU PO-03) RA FILE EXCEL — đúng biểu mẫu công ty
//
// ★ Sếp 27/09/2026: *"e giải quyết xuất excel của PO3 đi"*. Trước ngày này nút "Xuất Excel" ở
// PO-03 bị khoá vì bộ xuất duy nhất (`xuat-don-hang-excel.ts`) chỉ dựng được tờ ĐƠN MUA HÀNG.
//
// 🔴 CÁCH LÀM: DỰNG MỚI BẰNG EXCELJS THEO BẢN ĐỒ Ô CỦA BIỂU MẪU — KHÔNG nạp chính tệp biểu mẫu.
// Cùng nếp với `xuat-don-hang-excel.ts` (PO-01/02) và `ghi-don-hang-excel.ts`. Ba lý do:
//   1. Repo GitHub PUBLIC. Bản sao biểu mẫu trong `public/` sẽ lên GitHub VÀ ai biết địa chỉ là
//      tải được. Đo 27/09/2026: tệp gốc có TÊN NGƯỜI THẬT ở ô A9, tên công trình thật ở A15, tên
//      người sửa trong `docProps/core.xml` và đường dẫn máy (`absPath`) trong `workbook.xml` —
//      xoá ô thôi chưa sạch, phải lột cả siêu dữ liệu.
//   2. `1. INPUT/` là tài liệu đầu vào, không sửa, không đưa lên mạng (CLAUDE.md §3.4, §6.3).
//   3. Bảng hàng của biểu mẫu chỉ có 2 dòng; phiếu thật dài bao nhiêu dòng cũng được, nên dù nạp
//      khung vẫn phải chèn dòng + dời toàn bộ khối dưới + gộp ô lại — tức vẫn phải biết đủ bản đồ
//      ô như cách dựng mới, lại thêm rủi ro exceljs làm vỡ gộp ô khi chèn dòng.
//
// 📄 Bản đồ ô ĐỌC TỪ BIỂU MẪU `1. INPUT/Phieu xuat kho   HPCons.xlsx` ngày 27/09/2026 (đọc bản sao
// ở thư mục tạm bằng exceljs, tệp gốc giữ nguyên md5 70ab…). Dòng ≥ 20 dời theo số dòng hàng:
//
//   A1:B3  logo (ảnh nổi)        C1:J1 tên công ty (đậm) · C2:J2 địa chỉ · C3:J3 MST
//   D5:K5  PHIẾU XUẤT KHO (đậm 12)
//   D6:K6  Ngày: dd/mm/yyyy (đậm nghiêng)            L6  Nợ: …
//   D7:K7  Số: XK…                                   L7  Có: …
//   A9:M9  Họ và tên người nhận: …
//   A11:M11 Theo: …                                  (dòng 10/12/14/16 cao 4,5 — khoảng thở)
//   A13:H13 Xuất tại kho: <nghiêng>                  I13:M13 Địa điểm: <nghiêng>
//   A15:H15 Diễn giải: <nghiêng>                     I15:M15 Số HĐ: <nghiêng>   ★ 27/09/2026
//   17–18  tiêu đề: STT A · Tên mặt hàng B:D · Quy cách / chủng loại E:F · Đơn vị tính G ·
//          Số lượng H:J [Theo chứng từ H:I | Thực xuất J] · Đơn giá K:L · Thành tiền M
//   19     nhãn cột A · B · C · D · 1 · 2 · 3 · 4
//   20…    dòng hàng, rồi dòng "Cộng"
//   sau đó A:M Tổng số tiền (Viết bằng chữ) · A:M Số chứng từ gốc kèm theo · I:M Ngày … tháng …
//          năm … · ô ký A:C Người lập biểu · D:E Người nhận hàng · F:H Thủ kho ·
//          I:M Kế toán trưởng / (Hoặc bộ phận có nhu cầu nhập) / (Ký, họ tên)
//
// ⚠️ BA CHỖ CỐ Ý KHÁC BIỂU MẪU — đừng "sửa cho giống":
//   · A15 của biểu mẫu KHÔNG gộp ô. Nay cùng hàng có thêm "Số HĐ" ở I15 (Sếp 27/09/2026, thẳng cột
//     với "Địa điểm" I13) nên gộp A15:H15 / I15:M15 y như hàng 13.
//   · Dòng "Theo" có dấu hai chấm (Sếp 27/09/2026, commit a02df32 thêm cho tờ in) — biểu mẫu không có.
//   · Cột ẩn N:P của phần mềm kế toán (N7 là ngày, I25 là công thức đọc N7) KHÔNG dựng lại: I25
//     ghi thẳng chữ `dongNgayThangNam`, cùng hàm với tờ in.
//
// 🔴 PO-03 KHÔNG CÓ GIÁ (Sếp 26/09/2026): Đơn giá · Thành tiền · Cộng · Tổng tiền bằng chữ để
// TRỐNG — không ghi 0. Hàm này KHÔNG nhận chứng từ giá, nên không có đường nào lọt giá ra file.
// Cột "Thực xuất" cũng trống: thủ kho ghi tay (nguyên tắc dữ liệu số 2 — Kho là nguồn duy nhất
// của số lượng thực tế).
//
// 📌 Ô nào lấy dữ liệu gì: y hệt tờ in `1-giao-dien/thanh-phan-nghiep-vu/to-phieu-xuat-kho-a4.tsx`,
// và dùng CHUNG các hàm của `phieu-xuat-kho.ts` (số phiếu, dòng Theo, Diễn giải, dòng ngày ký).
// Ô trống thì để NHÃN TRƠN như biểu mẫu (vd `Địa điểm: `), không in dải chấm như tờ in — trừ dòng
// "Theo" vốn có dải chấm ngay trong biểu mẫu.
// ============================================================

import type * as ThuVienExcel from "exceljs";
import type { DonDatHang } from "@/3-du-lieu/kieu-du-lieu";
import { laDongHang } from "@/2-quy-trinh/tinh-toan";
import {
  dienGiaiPhieuXuatKho,
  dongNgayThangNam,
  ngayPhieuXuatKho,
  noiDungDongTheoXuatKho,
  soPhieuXuatKho,
} from "@/2-quy-trinh/phieu-xuat-kho";
import { lamSachTenTep } from "@/2-quy-trinh/xuat-don-hang-excel";

/** Thư viện exceljs — truyền vào để hàm dựng chạy được cả ở trình duyệt lẫn bài kiểm Node. */
type ExcelJS = typeof ThuVienExcel;

/** Những trường của đơn mà phiếu xuất kho đọc — không hơn. */
export type DonChoPhieuXuatKho = Pick<
  DonDatHang,
  | "code"
  | "ngayLapPO"
  | "items"
  | "nguoiNhanHangTen"
  | "canCuXuatKho"
  | "khoXuat"
  | "diaDiemKhoXuat"
  | "dienGiaiXuatKho"
  | "tenCongTrinh"
  | "maHopDongCDT"
  | "soChungTuGocXuatKho"
  | "taiKhoanNoXuatKho"
  | "taiKhoanCoXuatKho"
>;

export interface DauVaoXuatPhieuXuatKho {
  po: DonChoPhieuXuatKho;
  /** Nội dung logo, tải từ `/logo-hpc.png` (cùng tệp với ảnh trong biểu mẫu — md5 trùng). */
  logo?: ArrayBuffer;
}

/** Pháp nhân — đúng chữ trong biểu mẫu (C1 · C2 · C3), không thêm "Địa chỉ:" / "MST:". */
const PHAP_NHAN = {
  ten: "CÔNG TY CỔ PHẦN XÂY DỰNG CÔNG NGHIỆP HƯNG PHƯỚC",
  diaChi: "B_4B3_CN, Khu công nghiệp Mỹ Phước 3, Phường Thới Hòa, Thành phố Hồ Chí Minh, Việt Nam.",
  mst: "3703172689",
} as const;

const PHONG_CHU = "Times New Roman";

/**
 * Bề rộng cột A…M của biểu mẫu, tính bằng ĐIỂM ẢNH.
 *
 * 🔴 VÌ SAO KHÔNG CHÉP THẲNG CON SỐ `width` CỦA BIỂU MẪU: đơn vị `width` của Excel là "bề rộng một
 * chữ số của phông Normal". Biểu mẫu có phông Normal là Times New Roman 13 (chữ số rộng 9px), còn
 * tệp exceljs tạo ra có phông Normal Calibri 11 (7px). Chép thẳng thì mọi cột hẹp đi còn 7/9.
 * Nên lưu điểm ảnh đo từ biểu mẫu (`width × 9`, vd F = 16 × 9 = 144px) rồi chia 7 khi đặt.
 */
const BE_RONG_COT_PX = [47, 47, 73, 86, 26, 144, 69, 44, 26, 70, 48, 43, 89];
const COT_CUOI = BE_RONG_COT_PX.length; // M = 13

/** Chiều cao dòng của biểu mẫu (điểm). Mặc định của biểu mẫu là 12,75. */
const CAO_MAC_DINH = 12.75;
const CAO_DONG_DAU: Record<number, number> = {
  1: 23.25,
  2: 25.5,
  3: 12.75,
  5: 15.75,
  10: 4.5,
  12: 4.5,
  14: 4.5,
  16: 4.5,
  18: 25.5,
};

/** Các cột của bảng hàng, [từ, đến] — gộp đúng như biểu mẫu trên MỌI dòng của bảng. */
const COT = {
  stt: [1, 1],
  ten: [2, 4],
  quyCach: [5, 6],
  dvt: [7, 7],
  theoChungTu: [8, 9],
  thucXuat: [10, 10],
  donGia: [11, 12],
  thanhTien: [13, 13],
} as const satisfies Record<string, readonly [number, number]>;

const DONG_TIEU_DE = 17; // 17–18
const DONG_NHAN_COT = 19;
const DONG_HANG_DAU = 20;

/**
 * Bề rộng (px) của dải cột [từ, đến] — dùng để ƯỚC chiều cao dòng khi chữ phải xuống hàng.
 * Excel KHÔNG tự giãn chiều cao ô đã gộp, nên không ước thì chữ dài bị cắt mất nửa dưới.
 */
const beRongPx = (tu: number, den: number) =>
  BE_RONG_COT_PX.slice(tu - 1, den).reduce((a, b) => a + b, 0);

/**
 * Bề rộng ƯỚC của một ký tự Times New Roman 10 (≈13,3px/em) theo điểm ảnh — nhỉnh hơn số đo sách
 * vở một chút để thà dư một dòng trắng còn hơn cắt chữ.
 * 📌 Phải tách chấm/dấu cách ra riêng: dòng "Theo" để trống là ~90 dấu chấm; tính mỗi chấm bằng
 * một chữ thường thì dòng đó bị ước thành HAI dòng dù biểu mẫu vừa khít một dòng.
 */
const doRongKyTu = (ch: string): number =>
  " .,:;'!|()[]-/*".includes(ch) || "iljtfr".includes(ch)
    ? 3.6
    : "—–mwMW".includes(ch)
      ? 11
      : ch >= "0" && ch <= "9"
        ? 7
        : ch !== ch.toLowerCase()
          ? 9.2
          : 6.2;

/**
 * Số dòng chữ ước tính trong một ô rộng `px` — giả lập ngắt dòng theo từ như Excel.
 * ⚠️ CHỈ LÀ ƯỚC LƯỢNG: exceljs không đo được phông thật, và Excel không tự giãn ô đã gộp.
 */
export function soDongUocTinh(chu: string, px: number): number {
  const rong = Math.max(10, px - 6); // trừ lề trong của ô
  const DAU_CACH = doRongKyTu(" ");
  let tong = 0;
  for (const doan of chu.split("\n")) {
    let soDong = 1;
    let dangDung = 0;
    for (const tu of doan.split(" ")) {
      const w = [...tu].reduce((s, ch) => s + doRongKyTu(ch), 0);
      const can = dangDung === 0 ? w : dangDung + DAU_CACH + w;
      if (can <= rong) {
        dangDung = can;
        continue;
      }
      if (dangDung > 0) soDong += 1;
      dangDung = w;
      // Một từ dài hơn cả ô thì Excel bẻ giữa từ.
      while (dangDung > rong) {
        soDong += 1;
        dangDung -= rong;
      }
    }
    tong += soDong;
  }
  return tong;
}

/**
 * Dựng workbook phiếu xuất kho. THUẦN: không đọc kho dữ liệu, không kiểm quyền, không tải gì —
 * thư viện exceljs và logo đều truyền vào. Nhờ vậy bài kiểm Node gọi được thẳng hàm này.
 */
export function dungPhieuXuatKhoExcel(
  thuVien: ExcelJS,
  { po, logo }: DauVaoXuatPhieuXuatKho,
): ThuVienExcel.Workbook {
  const wb = new thuVien.Workbook();
  wb.creator = "App Thu mua HP Cons";
  const ws = wb.addWorksheet("Phieu xuat kho", {
    properties: { defaultRowHeight: CAO_MAC_DINH },
  });

  const phong = (them: Partial<ThuVienExcel.Font> = {}): Partial<ThuVienExcel.Font> => ({
    name: PHONG_CHU,
    family: 1,
    size: 10,
    ...them,
  });

  /* Phông của cả cột = Times New Roman 10 như biểu mẫu — ô nào người dùng gõ thêm (vd cột Thực
     xuất) cũng ra đúng phông, không nhảy về Calibri. */
  ws.columns = BE_RONG_COT_PX.map((px) => ({ width: px / 7, style: { font: phong() } }));
  for (let r = 1; r <= DONG_NHAN_COT; r++) ws.getRow(r).height = CAO_DONG_DAU[r] ?? CAO_MAC_DINH;

  /*
   * Khổ in: A4 dọc, lề đúng biểu mẫu (0,25 / 0,25 / 0,75 / 0,75 / 0,3 / 0,3).
   * ⚠️ Biểu mẫu để tỉ lệ 100%, nhưng tổng bề rộng A:M = 812px ≈ 8,46 inch — RỘNG HƠN phần in được
   * của A4 dọc (8,27 − 0,5 = 7,77 inch). In nguyên 100% là cột M ("Thành tiền") rơi sang trang
   * hai. Nên ép vừa MỘT trang bề ngang, dài bao nhiêu trang cũng được — giống cách
   * `xuat-don-hang-excel.ts` xử lý đơn nhiều cột thuế. (Suy từ số đo, chưa in thử trên máy in.)
   * Tiêu đề bảng (dòng 17–19) lặp lại đầu mỗi trang khi phiếu dài.
   */
  ws.pageSetup = {
    paperSize: 9,
    orientation: "portrait",
    margins: { left: 0.25, right: 0.25, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: `${DONG_TIEU_DE}:${DONG_NHAN_COT}`,
  };

  type CanhNgang = "left" | "center" | "right";
  interface KieuO {
    dam?: boolean;
    nghieng?: boolean;
    co?: number;
    canh?: CanhNgang;
    xuongDong?: boolean;
  }
  /** Ghi giá trị vào ô (dòng, từ) rồi gộp tới (denDong, den). Trả về ô gốc. */
  const dat = (
    dong: number,
    tu: number,
    den: number,
    giaTri: ThuVienExcel.CellValue,
    k: KieuO = {},
    denDong = dong,
  ) => {
    const o = ws.getCell(dong, tu);
    o.value = giaTri;
    o.font = phong({ bold: k.dam, italic: k.nghieng, size: k.co ?? 10 });
    o.alignment = { horizontal: k.canh, vertical: "middle", wrapText: k.xuongDong ?? true };
    if (den > tu || denDong > dong) ws.mergeCells(dong, tu, denDong, den);
    return o;
  };
  /** "Nhãn: " thường + giá trị NGHIÊNG trong CÙNG một ô — đúng kiểu ô A13 / A15 của biểu mẫu. */
  const nhanNghieng = (nhan: string, giaTri: string | undefined): ThuVienExcel.CellValue =>
    giaTri
      ? {
          richText: [
            { text: nhan, font: phong() },
            { text: giaTri, font: phong({ italic: true }) },
          ],
        }
      : nhan;
  /** Kẻ viền mảnh MỌI ô của một dòng bảng (A…M), kể cả ô con trong vùng gộp. */
  const keVien = (dong: number) => {
    for (let c = 1; c <= COT_CUOI; c++) {
      ws.getCell(dong, c).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  };

  // ---------- ĐẦU TRANG ----------
  if (logo) {
    /* Ảnh nổi neo A1 như biểu mẫu (85×72px, lệch ~3px ngang / ~8px dọc). Không có logo vẫn xuất —
       thiếu logo đỡ hơn là không xuất được phiếu.
       📌 `tl` là PHÂN SỐ theo cách exceljs quy đổi (bề rộng cột × 10000 EMU), không phải tỉ lệ
       điểm ảnh thật: 0,47 × (47/7 × 10000) ≈ 31.500 EMU ≈ đúng `colOff` 31.749 của biểu mẫu. */
    const id = wb.addImage({ buffer: logo, extension: "png" });
    ws.addImage(id, { tl: { col: 0.47, row: 0.32 }, ext: { width: 85, height: 72 }, editAs: "oneCell" });
  }
  dat(1, 3, 10, PHAP_NHAN.ten, { dam: true });
  dat(2, 3, 10, PHAP_NHAN.diaChi);
  dat(3, 3, 10, PHAP_NHAN.mst);

  dat(5, 4, 11, "PHIẾU XUẤT KHO", { dam: true, co: 12, canh: "center" });
  const ngay = ngayPhieuXuatKho(po.ngayLapPO);
  dat(6, 4, 11, ngay ? `Ngày: ${ngay}` : "Ngày: ", { dam: true, nghieng: true, canh: "center" });
  dat(7, 4, 11, `Số: ${soPhieuXuatKho(po)}`, { canh: "center" });
  /* Nợ / Có không gộp ô, chữ tràn sang M — đúng biểu mẫu. */
  dat(6, 12, 12, `Nợ: ${po.taiKhoanNoXuatKho?.trim() ?? ""}`, { xuongDong: false });
  dat(7, 12, 12, `Có: ${po.taiKhoanCoXuatKho?.trim() ?? ""}`, { xuongDong: false });

  // ---------- THÔNG TIN PHIẾU ----------
  const giaiDong = (dong: number, ...o: [string, number][]) => {
    const n = Math.max(1, ...o.map(([chu, px]) => soDongUocTinh(chu, px)));
    ws.getRow(dong).height = Math.max(CAO_MAC_DINH, n * CAO_MAC_DINH);
  };

  const nguoiNhan = `Họ và tên người nhận: ${po.nguoiNhanHangTen?.trim() ?? ""}`;
  dat(9, 1, COT_CUOI, nguoiNhan);
  giaiDong(9, [nguoiNhan, beRongPx(1, COT_CUOI)]);

  const dongTheo = `Theo: ${noiDungDongTheoXuatKho(po.canCuXuatKho)}`;
  dat(11, 1, COT_CUOI, dongTheo);
  giaiDong(11, [dongTheo, beRongPx(1, COT_CUOI)]);

  const kho = po.khoXuat?.trim();
  const diaDiem = po.diaDiemKhoXuat?.trim();
  dat(13, 1, 8, nhanNghieng("Xuất tại kho: ", kho));
  dat(13, 9, COT_CUOI, nhanNghieng("Địa điểm: ", diaDiem));
  giaiDong(13, [`Xuất tại kho: ${kho ?? ""}`, beRongPx(1, 8)], [`Địa điểm: ${diaDiem ?? ""}`, beRongPx(9, COT_CUOI)]);

  /* ★ Sếp 27/09/2026: Diễn giải = tên công trình theo đề nghị; "Số HĐ" cùng hàng, thẳng cột I
     với "Địa điểm" — cùng lưới với hàng 13, y như tờ in. */
  const dienGiai = dienGiaiPhieuXuatKho(po);
  const soHD = po.maHopDongCDT?.trim() || undefined;
  dat(15, 1, 8, nhanNghieng("Diễn giải: ", dienGiai));
  dat(15, 9, COT_CUOI, nhanNghieng("Số HĐ: ", soHD));
  giaiDong(15, [`Diễn giải: ${dienGiai ?? ""}`, beRongPx(1, 8)], [`Số HĐ: ${soHD ?? ""}`, beRongPx(9, COT_CUOI)]);

  // ---------- TIÊU ĐỀ BẢNG (17–19) ----------
  const tieuDe = { dam: true, canh: "center" as const };
  dat(DONG_TIEU_DE, 1, 1, "STT", tieuDe, 18);
  dat(DONG_TIEU_DE, 2, 4, "Tên mặt hàng", tieuDe, 18);
  dat(DONG_TIEU_DE, 5, 6, "Quy cách / chủng loại", tieuDe, 18);
  dat(DONG_TIEU_DE, 7, 7, "Đơn vị tính", tieuDe, 18);
  dat(DONG_TIEU_DE, 8, 10, "Số lượng", tieuDe);
  dat(18, 8, 9, "Theo chứng từ", tieuDe);
  dat(18, 10, 10, "Thực xuất", tieuDe);
  dat(DONG_TIEU_DE, 11, 12, "Đơn giá", tieuDe, 18);
  dat(DONG_TIEU_DE, 13, 13, "Thành tiền", tieuDe, 18);
  const nhanCot: [readonly [number, number], string][] = [
    [COT.stt, "A"],
    [COT.ten, "B"],
    [COT.quyCach, "C"],
    [COT.dvt, "D"],
    [COT.theoChungTu, "1"],
    [COT.thucXuat, "2"],
    [COT.donGia, "3"],
    [COT.thanhTien, "4"],
  ];
  for (const [[tu, den], chu] of nhanCot) dat(DONG_NHAN_COT, tu, den, chu, tieuDe);
  for (const d of [DONG_TIEU_DE, 18, DONG_NHAN_COT]) keVien(d);

  // ---------- DÒNG HÀNG ----------
  /** Gộp các cột nhiều ô của bảng trên một dòng (B:D · E:F · H:I · K:L), đúng biểu mẫu. */
  const gopCotBang = (dong: number) => {
    for (const [tu, den] of [COT.ten, COT.quyCach, COT.theoChungTu, COT.donGia]) {
      ws.mergeCells(dong, tu, dong, den);
    }
  };

  let dong = DONG_HANG_DAU;
  for (const d of po.items) {
    if (!laDongHang(d)) {
      /* Dòng ghi chú của người lập — in ra như tờ in (ô STT trống, chữ nghiêng trải B:M), nhưng
         KHÔNG phải một mặt hàng. */
      dat(dong, 2, COT_CUOI, d.tenVatLieu, { nghieng: true });
      ws.getRow(dong).height = Math.max(
        CAO_MAC_DINH,
        soDongUocTinh(d.tenVatLieu, beRongPx(2, COT_CUOI)) * CAO_MAC_DINH,
      );
      keVien(dong);
      dong += 1;
      continue;
    }
    const quyCach = d.thongSoKyThuat?.trim() ?? "";
    dat(dong, 1, 1, d.sttDong, { canh: "center" });
    dat(dong, 2, 2, d.tenVatLieu, { canh: "left" });
    dat(dong, 5, 5, quyCach, { canh: "left" });
    dat(dong, 7, 7, d.donViTinh, { canh: "center" });
    /* SL: số nguyên in không phần lẻ; số lẻ giữ tới 3 chữ số — làm tròn 12,5 thành "13" là bẫy
       đã ghi ở `xuat-don-hang-excel.ts`. (Biểu mẫu dùng `#,##0.00`, cắt mất chữ số thứ ba.) */
    const oSL = dat(dong, 8, 8, d.khoiLuongDat, { canh: "right" });
    oSL.numFmt = Number.isInteger(d.khoiLuongDat) ? "#,##0" : "#,##0.###";
    /* J (Thực xuất) · K:L (Đơn giá) · M (Thành tiền) CỐ Ý TRỐNG — xem đầu tệp. Vẫn gán phông để
       ô gõ tay sau này ra đúng kiểu. */
    for (const c of [10, 11, 13]) dat(dong, c, c, null);
    gopCotBang(dong);
    keVien(dong);
    const n = Math.max(
      soDongUocTinh(d.tenVatLieu, beRongPx(...COT.ten)),
      soDongUocTinh(quyCach, beRongPx(...COT.quyCach)),
      soDongUocTinh(d.donViTinh, beRongPx(...COT.dvt)),
    );
    ws.getRow(dong).height = Math.max(CAO_MAC_DINH, n * CAO_MAC_DINH);
    dong += 1;
  }

  // ---------- DÒNG "CỘNG" — không có tổng tiền (PO-03 không có giá) ----------
  const dongCong = dong;
  dat(dongCong, 2, 2, "Cộng", { dam: true, canh: "center" });
  for (const c of [1, 5, 7, 8, 10, 11, 13]) dat(dongCong, c, c, null, { dam: true });
  gopCotBang(dongCong);
  keVien(dongCong);
  ws.getRow(dongCong).height = CAO_MAC_DINH;

  // ---------- KHỐI DƯỚI BẢNG ----------
  const dTongChu = dongCong + 1;
  const dChungTu = dongCong + 2;
  const dNgay = dongCong + 3;
  const dKy = dongCong + 4;

  /* Tổng tiền bằng chữ: CHỈ nhãn, như biểu mẫu — PO-03 không có giá (không ghi "không đồng"). */
  dat(dTongChu, 1, COT_CUOI, "Tổng số tiền (Viết bằng chữ): ", { xuongDong: false });
  ws.getRow(dTongChu).height = CAO_MAC_DINH;

  const chungTu = `Số chứng từ gốc kèm theo: ${po.soChungTuGocXuatKho?.trim() ?? ""}`;
  dat(dChungTu, 1, COT_CUOI, chungTu);
  ws.getRow(dChungTu).height = Math.max(
    13.5,
    soDongUocTinh(chungTu, beRongPx(1, COT_CUOI)) * CAO_MAC_DINH,
  );

  dat(dNgay, 9, COT_CUOI, dongNgayThangNam(po.ngayLapPO), { canh: "center" });

  const oKy: [number, number, string, string[]][] = [
    [1, 3, "Người lập biểu", ["(Ký, họ tên)"]],
    [4, 5, "Người nhận hàng", ["(Ký, họ tên)"]],
    [6, 8, "Thủ kho", ["(Ký, họ tên)"]],
    [9, COT_CUOI, "Kế toán trưởng", ["(Hoặc bộ phận có nhu cầu nhập)", "(Ký, họ tên)"]],
  ];
  for (const [tu, den, ten, phu] of oKy) {
    dat(dKy, tu, den, ten, { dam: true, canh: "center" });
    phu.forEach((chu, i) =>
      /* Dòng "(Hoặc bộ phận có nhu cầu nhập)" đậm, "(Ký, họ tên)" nghiêng — đúng biểu mẫu. */
      dat(dKy + 1 + i, tu, den, chu, {
        canh: "center",
        dam: chu.startsWith("(Hoặc"),
        nghieng: !chu.startsWith("(Hoặc"),
      }),
    );
  }
  for (let r = dNgay; r <= dKy + 2; r++) ws.getRow(r).height = CAO_MAC_DINH;

  return wb;
}

/** Dựng rồi đóng gói thành `Blob` để tải xuống. `exceljs` nạp động — không cộng vào gói tải đầu. */
export async function xuatPhieuXuatKhoExcel(dv: DauVaoXuatPhieuXuatKho): Promise<Blob> {
  const thuVien = await import("exceljs");
  const buf = await dungPhieuXuatKhoExcel(thuVien, dv).xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * ★ TÊN FILE PHIẾU XUẤT KHO = **số phiếu + tên công trình / phòng ban**, vd
 * `XK260001 - Nhà xưởng Howell.xlsx`.
 *
 * 📌 Khác tên file PO-01/02 (`tenFileDonHang` — mã đề xuất App Request + tên công trình, Ban lãnh
 * đạo 26/08/2026): một đề nghị có thể có CẢ đơn mua hàng LẪN phiếu xuất kho; dùng chung cách đặt
 * tên thì hai file trùng tên, tải cái sau đè cái trước trong thư mục Tải về. Số `XK…` vừa là số
 * chứng từ vừa nói ngay đây là phiếu xuất kho. Giữ phần tên công trình theo đúng lý do của chỉ đạo
 * 26/08 (mở thư mục ra biết ngay file của công trình nào).
 */
export function tenFilePhieuXuatKho(soPhieu: string, tenCongTrinhHoacPhongBan: string): string {
  const dau = soPhieu.trim() || "Phieu-xuat-kho";
  const sau = tenCongTrinhHoacPhongBan.trim();
  return `${lamSachTenTep(sau ? `${dau} - ${sau}` : dau)}.xlsx`;
}

/**
 * Tên file BẢN MẪU (chưa lưu, chưa cấp số) — cùng nếp `tenFileDonHangMau`: tên phải nói ngay đây là
 * bản mẫu, vì ra khỏi app rồi chỉ còn cái tên để phân biệt với phiếu thật.
 */
export function tenFilePhieuXuatKhoMau(maDuAn: string, ngay: string): string {
  const duAn = lamSachTenTep(maDuAn) || "chua-chon-du-an";
  return `MAU-phieu-xuat-kho-${duAn}-${ngay}.xlsx`;
}
