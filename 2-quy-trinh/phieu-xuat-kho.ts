import type { DonDatHang, MauDonMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * ★ LUẬT RIÊNG CỦA MẪU PO-03 — PHIẾU XUẤT KHO (Sếp 26/09/2026).
 *
 * Biểu mẫu gốc: `1. INPUT/Phieu xuat kho   HPCons.xlsx`. 📌 Sếp CHỈNH MẪU 26/09/2026 (md5 c268… →
 * 70ab…): bỏ dòng "Ban hành theo Thông tư 200…" (ô K1:M2 nay trống), bảng hàng đổi thành
 * Tên mặt hàng · Quy cách / chủng loại (bỏ cột Mã số). Bố cục dưới đây theo BẢN MỚI.
 * Bố cục đọc từ sheet1 (đọc bản sao giải nén, KHÔNG mở Excel nên tệp gốc không đổi một byte):
 *
 *   C1..C3   Tên pháp nhân · địa chỉ · MST          K1:M2  (trống)
 *   D5       PHIẾU XUẤT KHO
 *   D6       Ngày: …                                L6     Nợ: …
 *   D7       Số: …                                  L7     Có: …
 *   A9       Họ và tên người nhận: …
 *   A11      Theo ….. số ….. ngày ….. tháng ….. năm ….. của …..
 *   A13      Xuất tại kho: …                        I13    Địa điểm: …
 *   A15      Diễn giải: …
 *   Bảng     STT(A) · Tên mặt hàng(B) · Quy cách / chủng loại(C) · Đơn vị tính(D) ·
 *            Số lượng [Theo chứng từ(1) | Thực xuất(2)] ·
 *            Đơn giá(3) · Thành tiền(4) — rồi dòng "Cộng"
 *   A23      Tổng số tiền (Viết bằng chữ): …
 *   A24      Số chứng từ gốc kèm theo: …
 *   I25      Ngày … tháng … năm …
 *   Ký       Người lập biểu · Người nhận hàng · Thủ kho · Kế toán trưởng
 *            (Hoặc bộ phận có nhu cầu nhập) — mỗi ô "(Ký, họ tên)"
 *
 * 🔴 Trên biểu mẫu, cột "Thực xuất" và "Đơn giá" để TRỐNG ở dữ liệu mẫu: thủ kho ghi tay số thực
 * xuất (nguyên tắc dữ liệu số 2 — Kho là nguồn duy nhất của số lượng thực nhận/thực xuất), nên
 * app KHÔNG có ô nhập "Thực xuất" và tờ in để trống cột đó.
 */

/**
 * ★ MÃ LOẠI CHỨNG TỪ CỦA PHIẾU XUẤT KHO — **ĐÃ CHỐT 26/09/2026**, Sếp: *"Mã chứng từ sẽ có quy tắc
 * theo mã PO là XK260001 số nhảy tự động"*. Số cấp ở `dat-ma-don-hang.ts` → `thamSoCapSoDon`, nên
 * `DonDatHang.code` của phiếu xuất kho mới đã là `XK…`. Phiếu PO-03 lập trước ngày này giữ số DMH cũ.
 *
 * 📜 Lịch sử — trước khi chốt, khối này ghi [CHỜ CHỐT]:
 *
 * 🔴 KHÔNG TỰ ĐẶT MÃ LOẠI MỚI (Thông báo 09/2026/TB-HPCS, quy tắc E-6): mã loại cần đơn vị quản lý
 * hệ thống phê duyệt. Biểu mẫu Excel ghi `XK00270` — đó là số của phần mềm kế toán, CHƯA phải mã
 * được duyệt trong hệ mã công ty.
 *
 * Để `null` = tờ in dùng đúng số đơn (`DonDatHang.code`, vd `DMH2026-0008`) làm "Số" của phiếu.
 * Khi được duyệt thì đặt chuỗi mã loại ở đây và viết lại `soPhieuXuatKho` theo đúng văn bản duyệt.
 */
export const MA_LOAI_PHIEU_XUAT_KHO: string | null = "XK";

/** Số in ở ô "Số:" của phiếu. Chưa có mã loại được duyệt thì dùng đúng số đơn. */
export function soPhieuXuatKho(po: Pick<DonDatHang, "code">): string {
  /* Số XK đã cấp thẳng vào `code` lúc lập (xem `thamSoCapSoDon`) — in đúng số đó, không dựng lại. */
  return po.code;
}

export function laPhieuXuatKho(mau: MauDonMuaHang | undefined): boolean {
  return mau === "phieu_xuat_kho";
}

/**
 * Dòng "Ngày … tháng … năm …" trên ô ký (I25) — đúng công thức của biểu mẫu
 * (`"Ngày "&MID(N7,1,2)&" tháng "&MID(N7,4,2)&" năm "&MID(N7,7,5)`), tức lấy theo NGÀY CỦA PHIẾU.
 * Ngày rỗng/hỏng thì chừa chấm để viết tay.
 */
export function dongNgayThangNam(ngayISO: string | undefined): string {
  const m = ngayISO ? /^(\d{4})-(\d{2})-(\d{2})/.exec(ngayISO) : null;
  if (!m) return "Ngày ….. tháng ….. năm …..";
  return `Ngày ${m[3]} tháng ${m[2]} năm ${m[1]}`;
}

/**
 * ★ VÌ SAO NÚT "XUẤT EXCEL" BỊ KHOÁ Ở MẪU PO-03 — `null` là xuất được.
 *
 * 🔴 CLAUDE.md §3.5 *"đừng để giao diện hứa một việc app không làm"*: bộ xuất Excel hiện có
 * (`xuat-don-hang-excel.ts`) chỉ dựng được tờ ĐƠN MUA HÀNG (PO-01/02). Cho bấm ở mẫu PO-03 là
 * người dùng nhận về một tờ đơn mua hàng trong khi họ chọn phiếu xuất kho. Nên khoá và nói rõ.
 */
export function vuongMacXuatExcelTheoMau(mau: MauDonMuaHang | undefined): string | null {
  if (!laPhieuXuatKho(mau)) return null;
  return "Mẫu PO-03 (Phiếu xuất kho) chưa có bản xuất Excel theo đúng biểu mẫu — dùng nút In để in phiếu.";
}
