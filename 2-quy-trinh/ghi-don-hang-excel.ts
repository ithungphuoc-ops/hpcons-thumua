// ============================================================
// XUẤT FILE EXCEL ĐỂ NHẬP ĐƠN HÀNG — bản đã điền sẵn mặt hàng
//
// 🔴 VÌ SAO CẦN FILE NÀY (bài học 10/08/2026):
// Biểu mẫu `1. INPUT/Bieu mau/1. DON HANG HPCONS.xlsx` là **mẫu trống** — bảng hàng
// (dòng 12–13) không có ô nào có dữ liệu. Người dùng tải mẫu đó rồi chọn nhập vào app
// thì đọc ra 0 dòng, tưởng chức năng nhập bị hỏng. Ban lãnh đạo báo *"chức năng import
// đơn hàng chưa nhận"* chính là tình huống này.
//
// Cách chữa: app tự xuất file đã điền sẵn **đúng những mặt hàng đang chờ lập đơn** của
// đề nghị đang mở. Người lập chỉ việc điền Đơn giá (và sửa SL nếu chia nhỏ đơn) rồi chọn
// lại file — chắc chắn khớp, vì tên hàng do chính app ghi ra.
//
// ⚠️ File này dựng MỚI bằng ExcelJS, KHÔNG copy file biểu mẫu gốc:
//   • `1. INPUT/` là tài liệu đầu vào, không được sửa và không được đưa lên repo công khai
//     (xem CLAUDE.md mục 3.4 và 6.3).
//   • Vì vậy file xuất ra **không có logo và định dạng in** của bản gốc. Nó chỉ dùng để
//     NHẬP LIỆU. Muốn bản in đúng biểu mẫu thì dùng trang in A4 của app (`/in/don-hang/...`).
//
// 📌 Thứ tự cột PHẢI trùng với bên đọc (`doc-don-hang-excel.ts`):
//     A=STT · B=Mã hàng · C=Tên hàng · D=Thông số kỹ thuật · E=ĐVT · F=SL ·
//     G=Đơn giá · H=Thành tiền · J=Mục đích sử dụng
// Sửa một bên mà quên bên kia là file xuất ra chính app lại không đọc được.
// ============================================================

/** Một dòng cần đưa vào file mẫu. */
export interface DongDeGhi {
  stt: number;
  tenVatLieu: string;
  quyCach?: string;
  donViTinh: string;
  /** Khối lượng còn được đặt — điền sẵn để người lập không phải tra lại. */
  soLuong: number;
  mucDichSuDung?: string;
}

export interface DauVaoFileMau {
  maDeNghi: string;
  tenCongTrinh: string;
  maHopDongCDT?: string;
  diaDiemGiaoHang?: string;
  nguoiNhanHang?: string;
  dong: DongDeGhi[];
}

/** Nhãn của biểu mẫu giấy — giữ nguyên chữ để người dùng nhìn ra ngay là cùng một mẫu. */
const NHAN = {
  tieuDe: "ĐƠN MUA HÀNG",
  nhaCungCap: "Tên nhà cung cấp:",
  diaChi: "Địa chỉ:",
  maSoThue: "Mã số thuế:",
  nguoiNhan: "Người Nhận:",
  congTienHang: "Cộng tiền hàng (Chưa trừ CK):",
  thueSuat: "Thuế suất thuế GTGT:",
  ngayGiaoHang: "Ngày giao hàng:",
  maDeXuat: "Mã đề xuất và tên công trình:",
  canCuHopDong: "Căn cứ hợp đồng số:",
  diaDiemGiao: "Địa điểm giao hàng:",
  dieuKhoanKhac: "Điều khoản khác:",
  dieuKhoanThanhToan: "Điều khoản thanh toán:",
} as const;

/**
 * Tiêu đề bảng.
 *
 * 🔴 CỘT A→J GIỮ NGUYÊN THỨ TỰ CỦA BIỂU MẪU CÔNG TY — đây là chứng từ đang lưu hành, và cả
 * `xuat-don-hang-excel.ts` lẫn trang in A4 đều bám thứ tự này.
 *
 * ★ Hai cột MỚI (K, L) theo màn Đơn mua hàng MISA (chỉ đạo Ban lãnh đạo 17/08/2026) được
 * ĐẶT THÊM VÀO CUỐI, không chen vào giữa. MISA xếp "% Thuế GTGT" ngay sau "Thành tiền", nhưng
 * chen vào đó sẽ đẩy cột "Mục đích sử dụng" của biểu mẫu công ty sang chỗ khác — mà biểu mẫu
 * công ty mới là chứng từ có hiệu lực.
 *
 * 📌 Chen được vào cuối là nhờ `doc-don-hang-excel.ts` nay khớp cột THEO TÊN TIÊU ĐỀ chứ không
 * theo vị trí, nên thứ tự cột không còn là ràng buộc giữa hai file.
 */
const TIEU_DE_BANG = [
  "STT",
  "Mã hàng",
  "Tên hàng",
  "Thông số kỹ thuật",
  "ĐVT",
  "SL",
  "Đơn giá",
  "Thành tiền",
  "",
  "Mục đích sử dụng",
  "% Thuế GTGT",
  "Trường mở rộng 1",
];

/**
 * Dựng file .xlsx để người lập đơn điền đơn giá.
 *
 * `exceljs` nạp động giống bên đọc — không cộng ~1MB vào gói tải lần đầu.
 */
export async function taoFileNhapDonHang(dv: DauVaoFileMau): Promise<Blob> {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Don mua hang");

  // Bề rộng cột cho vừa mắt khi mở ra — không ảnh hưởng lúc đọc lại.
  ws.columns = [
    { width: 6 }, // A STT
    { width: 12 }, // B Mã hàng
    { width: 34 }, // C Tên hàng
    { width: 26 }, // D Thông số kỹ thuật
    { width: 8 }, // E ĐVT
    { width: 10 }, // F SL
    { width: 14 }, // G Đơn giá
    { width: 16 }, // H Thành tiền
    { width: 4 }, // I (bản gốc gộp H:I)
    { width: 24 }, // J Mục đích sử dụng
    { width: 12 }, // K % Thuế GTGT
    { width: 20 }, // L Trường mở rộng 1
  ];

  const datNhan = (dong: number, chu: string) => {
    const o = ws.getRow(dong).getCell(1);
    o.value = chu;
    return o;
  };

  ws.getRow(1).getCell(1).value = NHAN.tieuDe;
  ws.getRow(1).getCell(1).font = { bold: true, size: 14 };

  // Nhãn và giá trị nằm CHUNG một ô, gõ ngay sau dấu hai chấm — đúng cách bên đọc hiểu.
  datNhan(3, NHAN.nhaCungCap);
  datNhan(4, NHAN.diaChi);
  datNhan(5, NHAN.maSoThue);
  datNhan(6, `${NHAN.nguoiNhan} ${dv.nguoiNhanHang ?? ""}`.trim());

  // --- Bảng hàng ---
  const DONG_TIEU_DE = 8;
  const hangTieuDe = ws.getRow(DONG_TIEU_DE);
  TIEU_DE_BANG.forEach((chu, i) => {
    if (chu === "") return;
    const o = hangTieuDe.getCell(i + 1);
    o.value = chu;
    o.font = { bold: true };
    o.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  dv.dong.forEach((d, i) => {
    const r = ws.getRow(DONG_TIEU_DE + 1 + i);
    r.getCell(1).value = d.stt;
    // Cột "Mã hàng" để TRỐNG: dự án chưa có danh mục mã vật tư (quyết định 1 — làm sau).
    r.getCell(3).value = d.tenVatLieu;
    if (d.quyCach) r.getCell(4).value = d.quyCach;
    r.getCell(5).value = d.donViTinh;
    r.getCell(6).value = d.soLuong;
    // Cột 7 (Đơn giá) và 8 (Thành tiền) để TRỐNG — đây chính là phần người lập điền.
    if (d.mucDichSuDung) r.getCell(10).value = d.mucDichSuDung;
    // Cột 11 (% Thuế GTGT) và 12 (Trường mở rộng 1) cũng để TRỐNG. Bỏ trống cột thuế là CỐ Ý:
    // app hiểu "dùng thuế suất chung của đơn", còn điền sẵn một con số vào đây thì người lập
    // tưởng đã được duyệt và không rà lại nữa.
  });

  // --- Khối tổng và các điều khoản, đặt sau bảng ---
  const sauBang = DONG_TIEU_DE + 1 + dv.dong.length;
  datNhan(sauBang, NHAN.congTienHang);
  datNhan(sauBang + 1, NHAN.thueSuat);
  datNhan(sauBang + 3, NHAN.ngayGiaoHang);
  datNhan(sauBang + 4, `${NHAN.maDeXuat} ${dv.maDeNghi} — ${dv.tenCongTrinh}`);
  datNhan(sauBang + 5, `${NHAN.canCuHopDong} ${dv.maHopDongCDT ?? ""}`.trim());
  datNhan(sauBang + 6, `${NHAN.diaDiemGiao} ${dv.diaDiemGiaoHang ?? ""}`.trim());
  datNhan(sauBang + 7, NHAN.dieuKhoanKhac);
  datNhan(sauBang + 8, NHAN.dieuKhoanThanhToan);

  // 📌 Ghi chú cho người điền, đặt cách ra để không lẫn vào vùng app dò nhãn.
  const ghiChu = ws.getRow(sauBang + 11).getCell(1);
  ghiChu.value =
    "Hướng dẫn: điền cột Đơn giá (G) cho từng dòng, sửa SL (F) nếu chia nhỏ đơn cho nhiều nhà cung cấp, " +
    "ghi tên nhà cung cấp ngay sau dấu hai chấm ở dòng “Tên nhà cung cấp:”. " +
    "Cột “% Thuế GTGT” (K) chỉ điền khi dòng đó có thuế suất KHÁC thuế suất chung của đơn; để trống là dùng thuế suất chung. " +
    "KHÔNG đổi tên hàng ở cột C — app đối chiếu theo tên này. " +
    "KHÔNG đổi chữ ở dòng tiêu đề bảng — app tìm cột theo đúng những tên đó. " +
    "Lưu lại rồi bấm “Chọn file Excel” trong app.";
  ghiChu.font = { italic: true, size: 10 };
  ghiChu.alignment = { wrapText: true };

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/** Đặt tên file theo mã đề nghị để không lẫn giữa các đề nghị khi tải nhiều lần. */
export function tenFileNhapDonHang(maDeNghi: string): string {
  return `Don-mua-hang-${maDeNghi}.xlsx`;
}
