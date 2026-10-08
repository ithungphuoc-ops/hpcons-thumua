// ============================================================
// TRÌNH DUYỆT → `/api/thong-bao/day` — báo máy chủ "tôi vừa tạo các tin chuông này" (Sếp duyệt demo 08/10/2026)
//
// Chỉ gửi MÃ TIN. Máy chủ đọc lại tin từ kho chung rồi tự quyết người nhận + nội dung (không giá).
//
// 🔴 KHÔNG BAO GIỜ CHẶN NGƯỜI DÙNG: mọi lỗi (chưa đăng nhập, mất mạng, máy chủ tắt tính năng) đều nuốt im.
// 🔴 KHÔNG TỰ THỬ LẠI ở đây — thử lại vòng vòng chính là kiểu lỗi đã gây sự cố 13–15/09/2026. Mã máy chủ
//    chưa thấy được giữ lại ở `kho-du-lieu.tsx` để gửi lại TỐI ĐA MỘT lần sau lần lưu thành công kế tiếp.
// ============================================================

import { layIdTokenHienTai } from "@/5-ket-noi/xac-thuc-firebase";
import { TOI_DA_MA_MOI_LAN } from "@/2-quy-trinh/thong-bao-app-tong";

/**
 * Gửi mã tin. Trả về tập mã máy chủ ĐÃ THẤY trong kho chung; `null` = không biết (lỗi / tính năng tắt /
 * máy chủ không trả danh sách) — nơi gọi coi như xong, không gửi lại.
 */
export async function guiTinSangAppTong(ids: readonly string[]): Promise<Set<string> | null> {
  const ds = [...new Set(ids)];
  if (ds.length === 0) return new Set();
  try {
    const ve = await layIdTokenHienTai();
    if (!ve) return null;
    const thay = new Set<string>();
    for (let i = 0; i < ds.length; i += TOI_DA_MA_MOI_LAN) {
      const res = await fetch("/api/thong-bao/day", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ve}` },
        body: JSON.stringify({ ids: ds.slice(i, i + TOI_DA_MA_MOI_LAN) }),
        keepalive: true,
        cache: "no-store",
      });
      if (!res.ok) return null;
      const j = (await res.json().catch(() => null)) as { timThay?: unknown } | null;
      if (!j || !Array.isArray(j.timThay)) return null;
      for (const x of j.timThay) if (typeof x === "string") thay.add(x);
    }
    return thay;
  } catch {
    return null;
  }
}
