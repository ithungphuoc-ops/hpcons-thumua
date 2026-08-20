// ============================================================
// LUẬT SỐ BẢN BÁO GIÁ PHẢI ĐÍNH KÈM — MỘT CHỖ DUY NHẤT
//
// 🔴 Ban lãnh đạo 20/08/2026: *"khi yêu cầu 2 báo giá thì phải có 2 mục đính kèm báo giá, và đó
// là quy tắc bắt buộc để được chuyển bước"*.
//
// 🔴 VÌ SAO LÀ HÀM THUẦN Ở `2-quy-trinh/`: luật này được hỏi ở BA NƠI —
//   ① khu đính kèm bước ② (vẽ bao nhiêu ô),
//   ② nút "Trình xét duyệt báo giá" (khóa hay mở, kèm lý do),
//   ③ tầng ghi `trinhXetDuyetBaoGia` (chặn thật, vì nút có thể bị đi vòng).
// Chép điều kiện ra ba chỗ là kiểu lỗi tệ nhất: nút mở mà tầng ghi từ chối, hoặc nút khóa mà
// đường khác vẫn trình được — và không có gì báo cho tới khi hồ sơ đã đi tiếp.
// ============================================================

import { TOI_DA_TEP_MOI_BUOC } from "@/3-du-lieu/kho-du-lieu";
import type { DeNghiMuaHang, MoTaTep } from "@/3-du-lieu/kieu-du-lieu";

/** Bước giữ bản báo giá nhà cung cấp — nơi nhân viên dán tệp vào. */
export const BUOC_DINH_KEM_BAO_GIA = "yeu_cau_bao_gia";

/**
 * Nhãn ghi chú đánh dấu ô báo giá thứ `i` (đếm từ 0).
 *
 * 📌 App giữ tệp mỗi bước thành MỘT DANH SÁCH, không có khái niệm "ô số 1, ô số 2". Để dựng các
 * ô có tên mà không phải đổi cấu trúc dữ liệu, mỗi ô đánh dấu tệp của mình bằng **ghi chú tệp** —
 * ghi chú vốn đã là chỗ ghi nhãn cho chứng từ.
 */
export function nhanOBaoGia(i: number): string {
  return `Báo giá NCC ${i + 1}`;
}

/**
 * Đọc số hiệu ô từ ghi chú tệp. Trả `0` khi ghi chú không phải nhãn ô nào.
 *
 * ⚠️ Phải khớp CHÍNH XÁC dạng `nhanOBaoGia` sinh ra. Nới lỏng thành "có chứa chữ báo giá" là ghi
 * chú người dùng tự gõ (*"báo giá bên A rẻ hơn"*) bị hiểu thành nhãn ô, tệp nhảy sang chỗ khác.
 */
export function chiSoOBaoGia(ghiChu: string | undefined): number {
  const khop = (ghiChu ?? "").trim().match(/^Báo giá NCC (\d+)$/);
  return khop ? Number(khop[1]) : 0;
}

/**
 * ★ CẦN BAO NHIÊU BẢN BÁO GIÁ cho phiếu này.
 *
 * Lấy số CAO NHẤT trong `items[].soBaoGiaYeuCau` — con số trưởng bộ phận đặt lúc giao việc ở
 * bước ①.
 *
 * 🔴 LẤY MAX, KHÔNG LẤY DÒNG ĐẦU hay số nhỏ nhất: trưởng bộ phận có thể đòi dòng thép 3 báo giá
 * còn dòng cát 2 báo giá. Đòi theo số nhỏ hơn là bỏ qua yêu cầu chặt nhất của chính người giao
 * việc — mà đó thường là dòng có giá trị lớn nhất.
 *
 * 📌 Trả `0` khi chưa ai đặt số nào: lúc đó KHÔNG chặn chuyển bước. Chặn bằng một con số không
 * ai đặt ra là bắt người dùng đi tìm luật không tồn tại.
 */
export function soBaoGiaCanCo(deNghi: DeNghiMuaHang): number {
  const so = deNghi.items
    .map((d) => d.soBaoGiaYeuCau)
    .filter((x): x is number => typeof x === "number" && x > 0);
  return so.length === 0 ? 0 : Math.min(Math.max(...so), TOI_DA_TEP_MOI_BUOC);
}

/** Tệp báo giá đang đính ở bước ②. */
export function tepBaoGiaDaCo(deNghi: DeNghiMuaHang): MoTaTep[] {
  return deNghi.tepGiaiDoan?.[BUOC_DINH_KEM_BAO_GIA] ?? [];
}

/**
 * Số ô báo giá phải vẽ ra.
 *
 * 🔴 `max(số cần, số hiệu ô cao nhất đang có tệp)`: hạ SL Báo giá xuống mà ẩn mất ô đang giữ tệp
 * thì người dùng thấy chứng từ "bốc hơi" — tệp vẫn trong hồ sơ nhưng không còn ô nào hiện nó ra.
 */
export function soOBaoGia(deNghi: DeNghiMuaHang): number {
  const can = soBaoGiaCanCo(deNghi);
  const daCo = tepBaoGiaDaCo(deNghi).reduce(
    (max, t) => Math.max(max, chiSoOBaoGia(t.ghiChu)),
    0,
  );
  return Math.min(Math.max(can, daCo), TOI_DA_TEP_MOI_BUOC);
}

/**
 * ★ CÒN VƯỚNG GÌ KHÔNG CHO TRÌNH XÉT DUYỆT — `null` là đủ điều kiện.
 *
 * 🔴 Ban lãnh đạo 20/08/2026: đủ số bản báo giá là **điều kiện bắt buộc để chuyển bước**.
 *
 * ⚠️ TRẢ VỀ CÂU GIẢI THÍCH, không trả `boolean`. Nút khóa mà không nói còn thiếu gì là kiểu bí
 * việc khó chịu nhất — người dùng bấm mãi không được và chẳng biết phải làm gì.
 *
 * 📌 Đếm theo Ô CÓ TÊN (`Báo giá NCC 1..N`), không đếm tổng số tệp: dán 3 tệp vào ô số 1 không
 * phải là có 3 bản báo giá của 3 nhà cung cấp. Đếm tổng là mở đường lách đúng cái luật này.
 */
export function vuongMacTrinhXetDuyet(deNghi: DeNghiMuaHang): string | null {
  const can = soBaoGiaCanCo(deNghi);
  if (can === 0) return null;

  const tep = tepBaoGiaDaCo(deNghi);
  const oDaCoTep = new Set(
    tep.map((t) => chiSoOBaoGia(t.ghiChu)).filter((n) => n >= 1 && n <= can),
  );
  const thieu = can - oDaCoTep.size;
  if (thieu <= 0) return null;

  return `Quy trình yêu cầu ${can} bản báo giá, hiện còn thiếu ${thieu} bản. Đính kèm đủ ${can} ô “Báo giá NCC” ở bước “Yêu cầu NCC báo giá” trước khi trình.`;
}
