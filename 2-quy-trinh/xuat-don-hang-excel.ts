// ============================================================
// XUẤT ĐƠN MUA HÀNG ĐÃ LẬP RA FILE EXCEL — đúng biểu mẫu công ty
//
// 🔴 Chỉ đạo Ban lãnh đạo 11/08/2026: *"thêm chức năng xuất file PO, PO đúng theo mẫu trong
// thư mục nhé"*, và sau đó *"file xuất ra chưa chuẩn theo template"*.
//
// 🔴 BỐ CỤC Ô DƯỚI ĐÂY ĐỌC TRỰC TIẾP TỪ XML CỦA BIỂU MẪU THẬT, không suy từ trang in.
// Nguồn: `DON HANG HPCONS (1).xlsx` (bản đã điền, Ban lãnh đạo cung cấp 11/08/2026) và
// `1. INPUT/Bieu mau/1. DON HANG HPCONS.xlsx`. Cách đọc an toàn: copy sang thư mục tạm, đổi
// đuôi .zip, giải nén, đọc `xl/worksheets/sheet1.xml` — TUYỆT ĐỐI không mở bằng Excel COM vì
// Excel ghi lại metadata làm đổi file gốc (CLAUDE.md mục 3.4).
//
// Bản đồ ô của biểu mẫu (giữ nguyên, đừng "dọn cho gọn"):
//   A1:B4  logo · C1:J1 tên công ty · C2:I2 địa chỉ + MST (MỘT ô, hai dòng)
//   A4:J4  "ĐƠN MUA HÀNG"
//   A6:H6  "Tên nhà cung cấp: <giá trị>"   | I6 "Ngày:"      J6 <giá trị>
//   A7:H7  "Địa chỉ: <giá trị>"            | I7 "Số:"        J7 <mã PO>
//   A8     "Mã số thuế: <giá trị>"         | I8 "Loại tiền:" J8 <VND>
//   A9     "Người Nhận: <giá trị>"
//   A11:J11 tiêu đề bảng (H11:I11 gộp) → hàng từ dòng 12
//   khối tổng: A:G "Cộng tiền hàng (Chưa trừ CK):" H · E "Số tiền CK:" H:I
//              E "Cộng tiền hàng (Đã trừ CK):" H:I
//              A "Thuế suất thuế GTGT:" C <%>  +  E "Tiền thuế GTGT:" H:I
//              E "Tổng tiền thanh toán:" H:I
//   A "Số tiền viết bằng chữ:" C:J <chữ>
//   6 dòng điều khoản, mỗi dòng gộp A:J, nhãn và giá trị CHUNG một ô
//   B:C "Xác nhận của nhà cung cấp" | G:H "Bên mua hàng", dưới là "(Ký, họ tên)"
//
// ⚠️ NHÃN VÀ GIÁ TRỊ NẰM CHUNG MỘT Ô ở khối thông tin và khối điều khoản — đúng như biểu mẫu
// giấy, và cũng đúng cách `doc-don-hang-excel.ts` dò nhãn. Tách ra hai ô là bản in lệch so
// với giấy VÀ app không đọc lại được file mình vừa xuất.
//
// 🔴 ĐỪNG LẪN VỚI `ghi-don-hang-excel.ts`:
//   · `ghi-don-hang-excel.ts` → biểu mẫu CHƯA CÓ GIÁ, để người lập điền rồi NHẬP LẠI vào app
//   · file này               → đơn ĐÃ LẬP, ĐÃ CÓ GIÁ, để gửi nhà cung cấp và lưu hồ sơ
// Gộp hai việc là sớm muộn có ngày xuất bản trống gửi cho nhà cung cấp.
//
// 🔒 CHỈ GỌI KHI VAI TRÒ ĐƯỢC XEM GIÁ — file luôn có đơn giá, không có bản ẩn giá. Chặn ở
// nơi gọi (nút), vì đây là hàm thuần không biết quyền.
// ============================================================

import type { DonDatHang, GiaDonDatHang, NhaCungCap } from "@/3-du-lieu/kieu-du-lieu";
import { tinhTienDonHang } from "@/2-quy-trinh/tinh-toan";
import { docSoTien } from "@/6-tien-ich/doc-so-tien";

/** Pháp nhân bên mua — in cố định trên đầu đơn, đúng chữ trong biểu mẫu. */
const BEN_MUA = {
  ten: "CÔNG TY CỔ PHẦN XÂY DỰNG CÔNG NGHIỆP HƯNG PHƯỚC",
  diaChiVaMST:
    "Địa chỉ: B_4B3_CN, Khu công nghiệp Mỹ Phước 3, Phường Thới Hòa, Thành phố Hồ Chí Minh, Việt Nam.\nMST: 3703172689",
} as const;

/**
 * Định dạng số — LẤY ĐÚNG THEO BIỂU MẪU.
 *
 * 🔴 SL phải giữ 3 chữ số thập phân như bản gốc. Làm tròn về số nguyên là bẫy nặng: 12,5 tấn
 * hiện thành "13" trong khi công thức `=F*G` vẫn tính trên 12,5 — người nhận soát tay thấy
 * `13 × đơn giá ≠ Thành tiền` và mất tin vào cả chứng từ.
 */
const DINH_DANG = {
  soLuong: "#,##0.###",
  tien: "#,##0",
} as const;

/** Bề rộng cột đọc từ biểu mẫu (đơn vị ký tự của Excel). */
const BE_RONG_COT = [7.57, 13, 22.29, 22.29, 8.86, 13, 12.14, 11.43, 8.29, 17.29];

/** Chiều cao dòng của biểu mẫu, theo số dòng. Dòng không khai thì Excel tự tính. */
const CAO_DONG: Record<number, number> = {
  1: 18.75,
  2: 31.5,
  3: 11.25,
  4: 27,
  5: 11.25,
  6: 15.75,
  7: 15.75,
  8: 19.5,
  9: 19.5,
  10: 11.25,
  11: 31.5,
};

export interface DauVaoXuatPO {
  po: DonDatHang;
  /** Chứng từ giá — tách document riêng nên có thể không đọc được. */
  gia?: GiaDonDatHang;
  /** Nhà cung cấp, để lấy địa chỉ và mã số thuế. Không tra ra thì để trống, không bịa. */
  ncc?: NhaCungCap;
  /**
   * Tên công trình cho dòng "Mã đề xuất và tên công trình".
   *
   * ⚠️ Phải truyền từ ngoài vào: `DonDatHang` KHÔNG có trường này, nó nằm ở đề nghị nguồn
   * (`DeNghiMuaHang.tenCongTrinh`). Hàm này thuần nên không tự đi tra kho dữ liệu.
   */
  tenCongTrinh?: string;
  /** Nội dung logo, tải từ `/logo-hpc.png`. Không có thì bỏ qua, không chặn xuất file. */
  logo?: ArrayBuffer;
}

/** Vì sao CHƯA xuất được. `null` là xuất được. */
export function vuongMacXuatPO({ po, gia }: Pick<DauVaoXuatPO, "po" | "gia">): string | null {
  if (po.items.length === 0) return "Đơn hàng chưa có mặt hàng nào.";
  // 🔴 Không có chứng từ giá thì mọi đơn giá về 0 và file xuất ra là một tờ giấy vô nghĩa —
  // tệ hơn nữa là nhìn như thật rồi gửi đi. Chặn thẳng, nói rõ lý do.
  if (!gia) return "Chưa có chứng từ giá của đơn hàng này nên không xuất được đơn mua hàng.";
  const thieuGia = po.items.filter(
    (d) => !(gia.lines.find((l) => l.sttDong === d.sttDong)?.donGia ?? 0),
  );
  if (thieuGia.length === po.items.length) return "Mọi mặt hàng đều chưa có đơn giá.";
  if (thieuGia.length > 0) {
    return `Còn ${thieuGia.length} mặt hàng chưa có đơn giá (${thieuGia
      .map((d) => d.tenVatLieu)
      .join(", ")}).`;
  }
  return null;
}

/**
 * Dựng file .xlsx của một đơn mua hàng đã lập, theo đúng biểu mẫu.
 *
 * `exceljs` nạp động giống các chỗ khác — không cộng ~1MB vào gói tải lần đầu.
 */
export async function xuatDonHangExcel(dv: DauVaoXuatPO): Promise<Blob> {
  const { po, gia, ncc, tenCongTrinh, logo } = dv;
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "App Thu mua HP Cons";
  const ws = wb.addWorksheet("Mau");

  // 🔴 Con số do `tinhTienDonHang` tính, KHÔNG tự cộng lại ở đây. Thuế GTGT tính TRÊN GIÁ ĐÃ
  // TRỪ CHIẾT KHẤU — đảo thứ tự là ra số thuế khác (xem 2-quy-trinh/README.md).
  const tien = tinhTienDonHang(po, gia);

  ws.columns = BE_RONG_COT.map((width) => ({ width }));
  for (const [dong, cao] of Object.entries(CAO_DONG)) ws.getRow(Number(dong)).height = cao;

  // Khổ giấy và tỷ lệ in lấy đúng biểu mẫu — scale 71% là mức để đơn vừa một trang A4 dọc.
  ws.pageSetup = {
    paperSize: 9,
    orientation: "portrait",
    scale: 71,
    margins: { left: 0.394, right: 0.197, top: 0.394, bottom: 0.394, header: 0, footer: 0 },
  };

  /** Đặt chữ vào ô rồi gộp tới cột `den` trên cùng dòng. */
  const dat = (dong: number, cot: number, chu: string | number, den?: number) => {
    const o = ws.getRow(dong).getCell(cot);
    o.value = chu;
    if (den && den > cot) ws.mergeCells(dong, cot, dong, den);
    return o;
  };
  /** Dòng "Nhãn: giá trị" nằm CHUNG một ô, đúng biểu mẫu. */
  const datNhanKemGiaTri = (dong: number, cot: number, nhan: string, giaTri: string, den?: number) =>
    dat(dong, cot, giaTri ? `${nhan} ${giaTri}` : nhan, den);

  // ---------- ĐẦU TRANG ----------
  if (logo) {
    // Logo nằm ở A1:B4 như biểu mẫu. Không có logo thì đơn vẫn xuất được — thiếu logo đỡ
    // hơn là không xuất được đơn.
    const id = wb.addImage({ buffer: logo, extension: "png" });
    ws.addImage(id, { tl: { col: 0.1, row: 0.1 }, ext: { width: 106, height: 91 } });
  }
  dat(1, 3, BEN_MUA.ten, 10).font = { bold: true, size: 12 };
  ws.getRow(1).getCell(3).alignment = { horizontal: "center", vertical: "middle" };

  const oDiaChi = dat(2, 3, BEN_MUA.diaChiVaMST, 9);
  oDiaChi.font = { size: 9 };
  oDiaChi.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

  dat(4, 1, "ĐƠN MUA HÀNG", 10).font = { bold: true, size: 16 };
  ws.getRow(4).getCell(1).alignment = { horizontal: "center", vertical: "middle" };

  // ---------- THÔNG TIN HAI BÊN ----------
  datNhanKemGiaTri(6, 1, "Tên nhà cung cấp:", po.supplierTen, 8).font = { size: 11, bold: true };
  datNhanKemGiaTri(7, 1, "Địa chỉ:", ncc?.diaChi ?? "", 8).font = { size: 11 };
  datNhanKemGiaTri(8, 1, "Mã số thuế:", ncc?.maSoThue ?? "").font = { size: 11 };
  datNhanKemGiaTri(9, 1, "Người Nhận:", po.nguoiNhanHangTen ?? "").font = { size: 11 };

  const cotPhai: [number, string, string][] = [
    [6, "Ngày:", new Date(po.ngayLapPO).toLocaleDateString("vi-VN")],
    [7, "Số:", po.code],
    [8, "Loại tiền:", gia?.loaiTien ?? "VND"],
  ];
  for (const [dong, nhan, giaTri] of cotPhai) {
    dat(dong, 9, nhan).font = { size: 11 };
    dat(dong, 10, giaTri).font = { size: 11, bold: dong === 7 };
  }

  // ---------- BẢNG HÀNG ----------
  const DONG_TIEU_DE = 11;
  const tieuDe: [number, string, "left" | "center" | "right"][] = [
    [1, "STT", "center"],
    [2, "Mã hàng", "left"],
    [3, "Tên hàng", "left"],
    [4, "Thông số kỹ thuật", "left"],
    [5, "ĐVT", "center"],
    [6, "SL", "right"],
    [7, "Đơn giá", "right"],
    [8, "Thành tiền", "right"],
    [10, "Mục đích sử dụng", "left"],
  ];
  for (const [cot, chu, canh] of tieuDe) {
    const o = dat(DONG_TIEU_DE, cot, chu, cot === 8 ? 9 : undefined);
    o.font = { bold: true, size: 11 };
    o.alignment = { horizontal: canh, vertical: "middle", wrapText: true };
  }
  keVien(ws, DONG_TIEU_DE, 1, 10);

  po.items.forEach((d, i) => {
    const dong = DONG_TIEU_DE + 1 + i;
    const r = ws.getRow(dong);
    r.height = 30;
    const donGia = gia?.lines.find((l) => l.sttDong === d.sttDong)?.donGia ?? 0;

    dat(dong, 1, d.sttDong).alignment = { horizontal: "center", vertical: "middle" };
    dat(dong, 2, d.maHang ?? "");
    dat(dong, 3, d.tenVatLieu);
    dat(dong, 4, d.thongSoKyThuat ?? "");
    dat(dong, 5, d.donViTinh).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(6).value = d.khoiLuongDat;
    r.getCell(6).numFmt = DINH_DANG.soLuong;
    r.getCell(7).value = donGia;
    r.getCell(7).numFmt = DINH_DANG.tien;
    // Thành tiền là CÔNG THỨC như biểu mẫu (bản gốc dùng `=+F12*G12`) — hai bên sửa SL hay
    // đơn giá trên file là thấy số cập nhật theo.
    r.getCell(8).value = { formula: `+F${dong}*G${dong}` };
    r.getCell(8).numFmt = DINH_DANG.tien;
    ws.mergeCells(dong, 8, dong, 9);
    dat(dong, 10, d.mucDichSuDung ?? "");

    for (let c = 1; c <= 10; c++) {
      const o = r.getCell(c);
      o.font = { size: 11 };
      o.alignment = { ...o.alignment, vertical: "middle", wrapText: true };
    }
    keVien(ws, dong, 1, 10);
  });

  // ---------- KHỐI TỔNG TIỀN ----------
  const dongCuoiBang = DONG_TIEU_DE + po.items.length;
  const d1 = dongCuoiBang + 1; // Cộng tiền hàng (Chưa trừ CK)
  const d2 = d1 + 1; // Số tiền CK
  const d3 = d2 + 1; // Cộng tiền hàng (Đã trừ CK)
  const d4 = d3 + 1; // Thuế suất + Tiền thuế GTGT
  const d5 = d4 + 1; // Tổng tiền thanh toán

  /**
   * `so` là số chết, `congThuc` là công thức Excel — truyền công thức thì file SỐNG: người
   * nhận sửa SL hay đơn giá là cả khối tổng chạy theo, đúng như biểu mẫu gốc (bản gốc dùng
   * `=SUM(...)`, `=+H16*8%`, `=+H16+H18`).
   *
   * 🔴 CÔNG THỨC PHẢI ĐÚNG THỨ TỰ NGHIỆP VỤ: thuế GTGT tính TRÊN GIÁ ĐÃ TRỪ CHIẾT KHẤU.
   * Bản gốc do người dùng điền tay có chỗ tính thuế trên tổng chưa trừ CK — đừng bắt chước
   * chỗ đó, quy tắc của dự án ghi ở `2-quy-trinh/README.md`.
   */
  const datDongTong = (
    dong: number,
    cotNhan: number,
    nhan: string,
    so: number,
    denNhan?: number,
    congThuc?: string,
  ) => {
    const oNhan = dat(dong, cotNhan, nhan, denNhan);
    oNhan.alignment = { horizontal: "right", vertical: "middle" };
    oNhan.font = { size: 11, bold: dong === d5 };
    const oSo = ws.getRow(dong).getCell(8);
    // Kèm `result` để chương trình nào không tính lại công thức vẫn hiện đúng số.
    oSo.value = congThuc ? { formula: congThuc, result: so } : so;
    oSo.numFmt = DINH_DANG.tien;
    oSo.font = { size: dong === d5 ? 12 : 11, bold: dong === d5 };
    oSo.alignment = { horizontal: "right", vertical: "middle" };
    ws.mergeCells(dong, 8, dong, 9);
    return oSo;
  };

  // Dòng đầu khối gộp A:G đúng biểu mẫu; ba dòng sau nhãn bắt đầu ở cột E.
  const cotTien = `H${DONG_TIEU_DE + 1}:H${dongCuoiBang}`;
  datDongTong(d1, 1, "Cộng tiền hàng (Chưa trừ CK):", tien.congTienHang, 7, `SUM(${cotTien})`);
  // Chiết khấu là số tiền người lập nhập, không suy ra được — để số chết.
  datDongTong(d2, 5, "Số tiền CK:", tien.chietKhau, 7);
  datDongTong(d3, 5, "Cộng tiền hàng (Đã trừ CK):", tien.congTienHangSauCK, 7, `H${d1}-H${d2}`);

  // 🔴 Ô "Thuế suất thuế GTGT" phải ĐỨNG RIÊNG ở A + giá trị ở C, đúng biểu mẫu. Gộp thuế
  // suất vào nhãn dòng thuế thì `doc-don-hang-excel.ts` dò nhãn không ra → nhập lại file
  // mình vừa xuất là MẤT thuế suất.
  dat(d4, 1, "Thuế suất thuế GTGT:", 2).font = { size: 11 };
  dat(d4, 3, `${tien.thueSuatGTGT.toLocaleString("vi-VN", { minimumFractionDigits: 2 })} %`).font = {
    size: 11,
  };
  // Thuế trên dòng d3 (đã trừ CK), KHÔNG phải d1.
  datDongTong(
    d4,
    5,
    "Tiền thuế GTGT:",
    tien.tienThueGTGT,
    7,
    `H${d3}*${tien.thueSuatGTGT}%`,
  );
  datDongTong(d5, 5, "Tổng tiền thanh toán:", tien.tongThanhToan, 7, `H${d3}+H${d4}`);

  // ---------- SỐ TIỀN BẰNG CHỮ ----------
  const dongChu = d5 + 1;
  ws.getRow(dongChu).height = 27;
  // Nhãn KHÔNG gộp ô, đúng biểu mẫu (bản gốc để A20 trơ, chỉ gộp phần chữ C20:J20).
  dat(dongChu, 1, "Số tiền viết bằng chữ:").font = { size: 11 };
  // ⚠️ `docSoTien` đọc theo đồng Việt Nam. Đơn ngoại tệ thì ghi kèm mã tiền để không ai
  // tưởng con số đó là VND.
  const donViTien = gia?.loaiTien ?? "VND";
  const chuTien =
    donViTien === "VND"
      ? docSoTien(tien.tongThanhToan)
      : `${tien.tongThanhToan.toLocaleString("vi-VN")} ${donViTien}`;
  const oChu = dat(dongChu, 3, chuTien, 10);
  oChu.font = { size: 11, italic: true };
  oChu.alignment = { vertical: "middle", wrapText: true };

  // ---------- ĐIỀU KHOẢN ----------
  // Nhãn và giá trị chung một ô, mỗi dòng gộp A:J — đúng biểu mẫu.
  const dieuKhoan: [string, string][] = [
    ["Ngày giao hàng:", new Date(po.ngayGiaoDuKien).toLocaleDateString("vi-VN")],
    [
      "Mã đề xuất và tên công trình :",
      [po.prCode, tenCongTrinh].filter(Boolean).join(" — "),
    ],
    ["Căn cứ hợp đồng số :", po.maHopDongCDT ?? ""],
    ["Địa điểm giao hàng:", po.diaDiemGiaoHang ?? ""],
    ["Điều khoản khác:", po.dieuKhoanKhac ?? po.dieuKienGiaoHang ?? ""],
    ["Điều khoản thanh toán:", gia?.dieuKhoanThanhToan ?? ""],
  ];
  const dongDK = dongChu + 2;
  dieuKhoan.forEach(([nhan, giaTri], i) => {
    const o = datNhanKemGiaTri(dongDK + i, 1, nhan, giaTri, 10);
    o.font = { size: 11 };
    o.alignment = { vertical: "middle", wrapText: true };
  });

  // ---------- CHỮ KÝ ----------
  const dongKy = dongDK + dieuKhoan.length + 2;
  // Gộp ĐÚNG HAI CỘT như biểu mẫu (B:C và G:H), không phải ba.
  const ky: [number, string][] = [
    [2, "Xác nhận của nhà cung cấp"],
    [7, "Bên mua hàng"],
  ];
  for (const [cot, chu] of ky) {
    const o = dat(dongKy, cot, chu, cot + 1);
    o.font = { size: 11, bold: true };
    o.alignment = { horizontal: "center" };
    const oPhu = dat(dongKy + 1, cot, "(Ký, họ tên)", cot + 1);
    oPhu.font = { size: 10 };
    oPhu.alignment = { horizontal: "center" };
  }
  // Chừa bốn dòng cho chỗ ký tay rồi ghi tên người phụ trách bên mua.
  const oTen = dat(dongKy + 5, 7, po.nguoiPhuTrachTen, 8);
  oTen.font = { size: 11, bold: true };
  oTen.alignment = { horizontal: "center" };

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/** Kẻ viền mảnh cho một dải ô của bảng hàng. */
function keVien(
  ws: { getRow: (n: number) => { getCell: (n: number) => { border?: unknown } } },
  dong: number,
  tu: number,
  den: number,
) {
  for (let c = tu; c <= den; c++) {
    ws.getRow(dong).getCell(c).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }
}

/** Tên file theo mã PO — mã đã là duy nhất nên không cần thêm ngày. */
export function tenFileDonHang(maPO: string): string {
  return `${maPO}.xlsx`;
}
