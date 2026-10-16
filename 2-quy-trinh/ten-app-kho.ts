// ============================================================
// TÊN APP KHO NHẬN PO / GỬI PHIẾU NHẬN — THEO KHO (Liên kết mua hàng EQUI, Sếp duyệt 15/10/2026)
//
// Kho thường nói chuyện với QLK CTR ("app Kho công trình"); kho EQUI nói chuyện với App EQUI. Chữ trên
// màn hình phải nói đúng đích, nếu không người dùng kho EQUI đi tìm đơn bên app Kho công trình — nơi
// đơn đó không bao giờ tới (hợp đồng chốt: nhóm "(EQUI)" KHÔNG BAO GIỜ gửi sang QLK CTR).
//
// 🔴 KHO THƯỜNG TRẢ NGUYÊN CHUỖI NƠI GỌI ĐƯA VÀO — không thay một ký tự. Mỗi chỗ trên màn hình viết
// chữ cũ của chính nó làm đối số thứ hai (chỗ thì "app Kho công trình", chỗ "QLK CTR", chỗ "App Kho"),
// nên kho thường hiện y hệt trước; chỉ kho EQUI đổi thành một tên duy nhất `TEN_APP_EQUI`.
//
// Hàm thuần, chỉ `import type` — dựng được bằng esbuild cho bài kiểm.
// ============================================================

import type { KhoId } from "@/3-du-lieu/kho-id";

/** Tên App EQUI trên màn hình — một chỗ sửa duy nhất. */
export const TEN_APP_EQUI = "App EQUI";

/** Kho EQUI → `"App EQUI"`; kho thường (hoặc thiếu) → trả NGUYÊN `chuKhoThuong`. */
export function tenAppKho(kho: KhoId | undefined, chuKhoThuong: string): string {
  return kho === "equi" ? TEN_APP_EQUI : chuKhoThuong;
}
