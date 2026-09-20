// ============================================================
// ĐỌC FILE XML HOÁ ĐƠN ĐIỆN TỬ — tự lấy số hoá đơn · ngày · tổng tiền
//
// ★★ Sếp 20/09/2026: ***"a muốn đính kèm file hoá đơn vào là app tự đọc thông tin trên hoá đơn và
// nhập số liệu vào trường dữ liệu đang có thì có được không?"***, và khi được hỏi nhà cung cấp
// gửi dạng gì thì Sếp chọn **"Có file XML kèm theo"**.
//
// 🔴 VÌ SAO ĐỌC XML CHỨ KHÔNG NHẬN DẠNG ẢNH: hoá đơn điện tử phát hành kèm một file XML có cấu
// trúc — số hoá đơn, ngày lập, tổng tiền nằm ở từng thẻ riêng. Đọc thẻ là **lấy đúng con số nhà
// cung cấp đã ký**, không sai một đồng. Nhận dạng ảnh thì phải gửi hoá đơn ra dịch vụ bên ngoài
// (lộ giá và tên nhà cung cấp — đi ngược nguyên tắc chặn giá của dự án), tốn phí, và vẫn đọc sai
// khi ảnh mờ hay dấu mộc đè lên số.
//
// 🔴🔴 HÀM NÀY CHỈ ĐỀ XUẤT, KHÔNG GHI THẲNG VÀO SỔ. Nơi gọi phải điền sẵn vào ô rồi để người dùng
// nhìn và bấm Lưu. Lý do: XML có NHIỀU trường tiền (tiền hàng chưa thuế · tiền thuế · tổng thanh
// toán), mẫu mỗi đơn vị phát hành lệch nhau, và công nợ phải lấy đúng **tổng tiền thanh toán**.
// Lấy nhầm trường mà ghi thẳng là sổ công nợ sai mà không ai biết.
//
// ⚠️ KHÔNG ĐOÁN BỪA. Không tìm được thẻ nào thì trả `null` cho trường đó và nơi gọi nói thẳng
// *"không đọc được, mời nhập tay"* — đúng luật §3.5 của dự án: đừng để giao diện hứa một việc app
// không làm.
// ============================================================

import type { NgayISO } from "@/3-du-lieu/kieu-du-lieu";

/** Kết quả đọc một file XML hoá đơn. Trường nào không đọc được thì `undefined`. */
export interface ThongTinHoaDonXML {
  soHoaDon?: string;
  ngayHoaDon?: NgayISO;
  soTien?: number;
  /** Ký hiệu hoá đơn (VD `1C25TYY`) — ghép vào số cho dễ đối chiếu khi có. */
  kyHieu?: string;
  /** Tên các thẻ đã tra ra, để nơi gọi nói được app đọc được những gì. */
  daDoc: string[];
}

/**
 * ★ TÊN THẺ THEO CHUẨN HOÁ ĐƠN ĐIỆN TỬ CỦA TỔNG CỤC THUẾ, xếp theo thứ tự ưu tiên.
 *
 * 📌 Chuẩn dùng thẻ viết tắt không dấu: `SHDon` (số hoá đơn), `NLap` (ngày lập),
 * `TgTTTBSo` (tổng tiền thanh toán bằng số), `KHHDon`/`KHMSHDon` (ký hiệu).
 *
 * ⚠️ MỘT SỐ ĐƠN VỊ PHÁT HÀNH DÙNG TÊN KHÁC. Nên mỗi nhóm là một DANH SÁCH, dò từ trên xuống và
 * lấy thẻ đầu tiên có giá trị hợp lệ. Thêm tên mới vào đây là đủ, không phải sửa chỗ nào khác.
 *
 * 🔴 THỨ TỰ TRONG NHÓM TIỀN LÀ QUAN TRỌNG NHẤT. `TgTTTBSo` = **tổng tiền thanh toán** (đã gồm
 * thuế) — đúng con số công nợ cần. `TgTCThue` là tiền hàng CHƯA thuế, `TgTThue` là tiền thuế;
 * lấy nhầm hai cái sau là số nợ thiếu đúng phần VAT.
 */
const THE_SO_HOA_DON = ["SHDon", "SoHoaDon", "InvoiceNumber", "invoiceNo", "So"];
const THE_NGAY = ["NLap", "NgayLap", "InvoiceDate", "invoiceDate", "NgayHoaDon"];
const THE_TIEN = [
  "TgTTTBSo", // tổng tiền thanh toán bằng số — ĐÚNG con số cần
  "TongTienThanhToan",
  "TgTTTB", // vài mẫu ghi thiếu chữ "So"
  "TotalAmount",
  "totalPayment",
];
const THE_KY_HIEU = ["KHHDon", "KyHieuHoaDon", "KHMSHDon", "InvoiceSeries", "serial"];

/** Lấy nội dung thẻ đầu tiên tra được trong danh sách. Không phân biệt hoa thường, bỏ tiền tố. */
function layThe(xml: string, cacThe: readonly string[]): string | undefined {
  for (const ten of cacThe) {
    /* Chấp nhận tiền tố kiểu `<inv:SHDon>` và thuộc tính trong thẻ mở. Lấy lần xuất hiện ĐẦU:
       hoá đơn có thể có phần `<DLHDon>` (dữ liệu) rồi `<DSCKS>` (chữ ký) lặp lại vài thẻ. */
    const re = new RegExp(`<(?:[\\w.-]+:)?${ten}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${ten}>`, "i");
    const khop = re.exec(xml);
    const noiDung = khop?.[1]?.trim();
    if (noiDung) return noiDung;
  }
  return undefined;
}

/** "2026-09-20T00:00:00" · "20/09/2026" · "2026-09-20" → `yyyy-mm-dd`, hoặc `undefined`. */
function chuanHoaNgay(chuoi: string | undefined): NgayISO | undefined {
  if (!chuoi) return undefined;
  const s = chuoi.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const vn = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(s);
  if (vn) {
    const hai = (x: string) => x.padStart(2, "0");
    return `${vn[3]}-${hai(vn[2])}-${hai(vn[1])}`;
  }
  return undefined;
}

/**
 * ★ Đổi chuỗi tiền trong XML thành số.
 *
 * 🔴 XML CHUẨN GHI SỐ KIỂU MÁY (`45522000` hoặc `45522000.00`), KHÔNG có dấu phân cách nghìn.
 * Nhưng vẫn có mẫu ghi kiểu người đọc (`45.522.000`), nên phải xử cả hai — và đây là chỗ dễ sai
 * nhất: `45.522.000` mà hiểu dấu chấm là thập phân thì ra **45,5 đồng** thay vì 45 triệu.
 *
 * Luật phân biệt: còn nhiều hơn một dấu chấm ⇒ chắc chắn là phân cách nghìn. Một dấu chấm mà
 * phần sau đúng 3 chữ số cũng là phân cách nghìn (tiền Việt không có phần lẻ tới 3 số).
 */
function chuanHoaTien(chuoi: string | undefined): number | undefined {
  if (!chuoi) return undefined;
  let s = chuoi.trim().replace(/\s/g, "");
  if (!s) return undefined;
  const soDauCham = (s.match(/\./g) ?? []).length;
  const soDauPhay = (s.match(/,/g) ?? []).length;
  if (soDauCham > 1 || (soDauCham === 1 && /\.\d{3}$/.test(s))) s = s.replace(/\./g, "");
  if (soDauPhay > 1 || (soDauPhay === 1 && /,\d{3}$/.test(s))) s = s.replace(/,/g, "");
  s = s.replace(",", "."); // dấu phẩy còn lại là dấu thập phân kiểu Việt
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
}

/**
 * ★★★ ĐỌC MỘT FILE XML HOÁ ĐƠN.
 *
 * @param xml Nội dung file, đọc bằng `File.text()`.
 * @returns Các trường tra được. `daDoc` rỗng = không nhận ra mẫu này, nơi gọi phải mời nhập tay.
 *
 * 📌 DÙNG BIỂU THỨC CHÍNH QUY, KHÔNG DÙNG `DOMParser`: hàm này là hàm THUẦN ở tầng quy trình
 * (quy ước 3.4b), phải chạy được cả trong bài kiểm chạy bằng Node — nơi không có `DOMParser`.
 * Hoá đơn điện tử là XML phẳng, vài chục thẻ, nên không cần bộ phân tích đầy đủ.
 */
export function docHoaDonXML(xml: string): ThongTinHoaDonXML {
  const daDoc: string[] = [];
  const soRaw = layThe(xml, THE_SO_HOA_DON);
  const ngayRaw = layThe(xml, THE_NGAY);
  const tienRaw = layThe(xml, THE_TIEN);
  const kyHieu = layThe(xml, THE_KY_HIEU);

  const soHoaDon = soRaw?.slice(0, 60);
  const ngayHoaDon = chuanHoaNgay(ngayRaw);
  const soTien = chuanHoaTien(tienRaw);

  if (soHoaDon) daDoc.push("số hoá đơn");
  if (ngayHoaDon) daDoc.push("ngày");
  if (soTien !== undefined) daDoc.push("số tiền");

  return { soHoaDon, ngayHoaDon, soTien, kyHieu, daDoc };
}

/** Tên tệp có phải XML không — chỉ để giao diện biết có nên thử đọc hay không. */
export function laTepXML(tenTep: string): boolean {
  return /\.xml$/i.test(tenTep.trim());
}
