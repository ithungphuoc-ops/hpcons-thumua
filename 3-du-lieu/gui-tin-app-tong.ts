// ============================================================
// TRÌNH DUYỆT → `/api/thong-bao/day` — báo máy chủ "tôi vừa tạo các tin chuông này" (Sếp duyệt demo 08/10/2026)
//
// Chỉ gửi MÃ TIN. Máy chủ đọc lại tin từ kho chung rồi tự quyết người nhận + nội dung (không giá).
//
// 🔴 KHÔNG BAO GIỜ CHẶN NGƯỜI DÙNG: mọi lỗi (chưa đăng nhập, mất mạng, máy chủ tắt tính năng) đều nuốt im.
// 🔴 KHÔNG THỬ LẠI: thông báo là phần phụ — thử lại vòng vòng chính là kiểu lỗi đã gây sự cố 13–15/09/2026.
// ============================================================

import { layIdTokenHienTai } from "@/5-ket-noi/xac-thuc-firebase";
import { TOI_DA_MA_MOI_LAN } from "@/2-quy-trinh/thong-bao-app-tong";

export async function guiTinSangAppTong(ids: readonly string[]): Promise<void> {
  const ds = [...new Set(ids)];
  if (ds.length === 0) return;
  try {
    const ve = await layIdTokenHienTai();
    if (!ve) return;
    for (let i = 0; i < ds.length; i += TOI_DA_MA_MOI_LAN) {
      await fetch("/api/thong-bao/day", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ve}` },
        body: JSON.stringify({ ids: ds.slice(i, i + TOI_DA_MA_MOI_LAN) }),
        keepalive: true,
        cache: "no-store",
      });
    }
  } catch {
    /* nuốt — xem đầu tệp */
  }
}
