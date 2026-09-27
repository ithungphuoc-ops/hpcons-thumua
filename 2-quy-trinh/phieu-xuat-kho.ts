import type { DonDatHang, MauDonMuaHang } from "@/3-du-lieu/kieu-du-lieu";
import { laDongHang } from "@/2-quy-trinh/tinh-toan";

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
 *            📌 Chữ trong ngoặc là NHÃN CỘT in ở dòng 19, không phải cột Excel. Cột Excel thật
 *            (đọc lại 27/09/2026): STT A · Tên B:D · Quy cách E:F · ĐVT G · Theo chứng từ H:I ·
 *            Thực xuất J · Đơn giá K:L · Thành tiền M; tiêu đề ở dòng 17–18, hàng từ dòng 20.
 *            Cột N:P ẨN là cột phụ của phần mềm kế toán (N7 = ngày cho công thức I25) — app
 *            không dùng.
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
 * ★ DÒNG "THEO …" CỦA PHIẾU XUẤT KHO — Sếp 27/09/2026 (ảnh khoanh dòng "Theo Đề nghị số 000000162
 * ngày 26/09/2026"): *"Định dạng ngày … tháng … năm …. nhé"*.
 *
 * `canCuXuatThuDeNghi` dựng câu tự điền khi chọn Mẫu PO-03 (form). `chuanHoaCanCuXuatKho` đổi câu
 * ĐÃ LƯU dạng cũ `ngày dd/mm/yyyy` (phiếu lập trước 27/09) sang dạng chữ LÚC HIỆN / IN — không sửa
 * dữ liệu, nên người đã gõ tay câu khác vẫn giữ nguyên chữ của họ.
 */
export function canCuXuatThuDeNghi(maDeNghi: string, ngayDeNghiISO: string | undefined): string {
  const m = ngayDeNghiISO ? /^(\d{4})-(\d{2})-(\d{2})/.exec(ngayDeNghiISO) : null;
  return m
    ? `Đề nghị số ${maDeNghi} ngày ${m[3]} tháng ${m[2]} năm ${m[1]}`
    : `Đề nghị số ${maDeNghi}`;
}
export function chuanHoaCanCuXuatKho(s: string | undefined): string | undefined {
  if (!s) return s;
  return s.replace(
    /ngày (\d{1,2})\/(\d{1,2})\/(\d{4})/g,
    (_, d: string, mo: string, y: string) =>
      `ngày ${d.padStart(2, "0")} tháng ${mo.padStart(2, "0")} năm ${y}`,
  );
}

/** Dải chấm của biểu mẫu (ô A11) — in khi dòng "Theo" để trống, chừa chỗ viết tay. */
export const DAI_CHAM_CAN_CU_XUAT_KHO =
  "........... số .............. ngày ..... tháng ..... năm ..... của ..............................................";

/**
 * ★ PHẦN SAU CHỮ "Theo:" của phiếu xuất kho — MỘT chỗ cho cả tờ in A4 lẫn file Excel (27/09/2026).
 * Trước đó tờ in tự ghép `chuanHoaCanCuXuatKho(...) || "…dải chấm…"`; thêm bản Excel mà chép lại
 * biểu thức đó là hai chỗ cùng nói một chuyện (CLAUDE.md §3.4b).
 */
export function noiDungDongTheoXuatKho(canCu: string | undefined): string {
  return chuanHoaCanCuXuatKho(canCu?.trim()) || DAI_CHAM_CAN_CU_XUAT_KHO;
}

/**
 * Ô "Ngày:" (D6) dạng `dd/mm/yyyy` có số 0 đứng trước — đúng chữ biểu mẫu (`Ngày: 22/09/2026`).
 * Đọc thẳng chuỗi ISO, KHÔNG qua `new Date()`: đổi múi giờ là lệch một ngày trên máy đặt giờ khác.
 * Ngày rỗng/hỏng → `undefined` để nơi gọi tự quyết (Excel để trống nhãn).
 */
export function ngayPhieuXuatKho(ngayISO: string | undefined): string | undefined {
  const m = ngayISO ? /^(\d{4})-(\d{2})-(\d{2})/.exec(ngayISO) : null;
  return m ? `${m[3]}/${m[2]}/${m[1]}` : undefined;
}

/**
 * ★ "DIỄN GIẢI" = TÊN CÔNG TRÌNH THEO ĐỀ NGHỊ — Sếp 27/09/2026: *"Nhập tên công trình theo phiếu đề
 * nghị"*. Ô đã gõ thì giữ chữ người gõ; trống (phiếu lập trước ngày này) thì lấy tên công trình
 * của đơn — đơn mang sẵn `tenCongTrinh` chép từ đề nghị lúc lập.
 */
export function dienGiaiPhieuXuatKho(
  po: Pick<DonDatHang, "dienGiaiXuatKho" | "tenCongTrinh">,
): string | undefined {
  return po.dienGiaiXuatKho?.trim() || po.tenCongTrinh?.trim() || undefined;
}

/**
 * ★ MẪU NÀO CHƯA CÓ BỘ XUẤT EXCEL — `null` là xuất được.
 *
 * ✅ TỪ 27/09/2026 PO-03 ĐÃ CÓ BỘ XUẤT RIÊNG (`xuat-phieu-xuat-kho-excel.ts`) — Sếp: *"e giải quyết
 * xuất excel của PO3 đi"*. Nên cả ba mẫu đều trả `null`.
 *
 * 📜 Trước 27/09/2026 hàm này khoá PO-03 kèm câu *"Mẫu PO-03 (Phiếu xuất kho) chưa có bản xuất
 * Excel theo đúng biểu mẫu — dùng nút In để in phiếu"* (CLAUDE.md §3.5 — bộ xuất lúc đó chỉ dựng
 * được tờ ĐƠN MUA HÀNG, cho bấm là người dùng nhận nhầm loại chứng từ).
 *
 * 🔴 GIỮ HÀM, ĐỪNG XOÁ: `switch` vét cạn `MauDonMuaHang`. Mai kia thêm mẫu thứ tư vào kiểu dữ liệu
 * mà chưa viết bộ xuất thì mẫu đó rơi vào `default` và TỰ BỊ KHOÁ kèm lý do — không lặng lẽ xuất
 * ra tờ đơn mua hàng như lỗi đã chặn ở trên.
 */
export function vuongMacXuatExcelTheoMau(mau: MauDonMuaHang | undefined): string | null {
  switch (mau ?? "thoa_thuan") {
    case "thoa_thuan":
    case "theo_hop_dong":
    case "phieu_xuat_kho":
      return null;
    default:
      return "Mẫu này chưa có bản xuất Excel theo đúng biểu mẫu — dùng nút In để in.";
  }
}

/**
 * ★ VÌ SAO CHƯA XUẤT ĐƯỢC PHIẾU XUẤT KHO RA EXCEL — `null` là xuất được (Sếp 27/09/2026).
 *
 * 🔴 KHÔNG DÙNG `vuongMacXuatPO` CHO PO-03: luật đó đòi chứng từ giá và MỌI dòng có đơn giá > 0,
 * mà PO-03 lưu giá = 0 theo chỉ đạo 26/09/2026 (*"quy trình xuất kho thì sẽ không có đơn giá"*).
 * Đi qua luật đó là nút khoá vĩnh viễn với câu *"Mọi mặt hàng đều chưa có đơn giá"*.
 * Phiếu xuất kho chỉ cần có ít nhất một mặt hàng — dòng ghi chú không tính (`laDongHang`).
 */
export function vuongMacXuatPhieuXuatKho(po: Pick<DonDatHang, "items">): string | null {
  if (!po.items.some(laDongHang)) return "Phiếu xuất kho chưa có mặt hàng nào.";
  return null;
}
