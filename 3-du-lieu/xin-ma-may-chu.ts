// ============================================================
// XIN MÃ TỪ MÁY CHỦ — cầu nối của nhịp 3b (23/09/2026)
//
// Giao diện vẫn gọi đúng một hàm như trước; chỉ khác là mã giờ do máy chủ cấp trong một giao
// dịch, nên hai người bấm "Tạo" cùng lúc không còn nhận cùng một số.
//
// 🔴 HỎNG THÌ RƠI VỀ CÁCH CŨ, KHÔNG CHẶN NGƯỜI DÙNG. Mất mạng, máy chủ trục trặc, chưa đăng
// nhập lại — tất cả đều trả `null`, và nơi gọi tự tính mã như trước. Chặn người dùng lập đơn
// vì một lượt gọi mạng hỏng là đổi một rủi ro hiếm lấy một phiền toái chắc chắn.
//
// ⚠️ Đánh đổi phải biết: đúng những lúc rơi về cách cũ thì khả năng trùng mã quay lại y như
// trước. Đây là lưới thưa hơn một chút, không phải khoá cứng.
// ============================================================

import { moFirebase } from "@/5-ket-noi/firebase-chung";
import type { LoaiMa } from "@/2-quy-trinh/cap-ma-may-chu";

/**
 * ★ CÔNG TẮC — mặc định TẮT, y như đợt 2.
 *
 * Merge được mà production không đổi hành vi nào; ngày chuyển chỉ cần thêm biến rồi deploy lại.
 *
 * ⚠️ `.trim().toLowerCase()` bắt buộc — biến môi trường dính ký tự xuống dòng từng khiến app
 * lặng lẽ chạy nhánh sai (lỗi thật 12/08/2026).
 */
export const CAP_MA_MAY_CHU =
  (process.env.NEXT_PUBLIC_CAP_MA_MAY_CHU ?? "").trim().toLowerCase() === "1";

async function layVe(): Promise<string | null> {
  const app = await moFirebase();
  if (!app) return null;
  const { getAuth } = await import("firebase/auth");
  const nguoi = getAuth(app).currentUser;
  return nguoi ? nguoi.getIdToken() : null;
}

/**
 * Xin một mã mới từ máy chủ. `null` = không xin được, nơi gọi tự tính như cũ.
 *
 * `thamSo`: năm (đơn hàng) hoặc mã dự án (đề nghị). Nhà cung cấp không cần, truyền chuỗi rỗng.
 */
export async function xinMaMayChu(loai: LoaiMa, thamSo: string): Promise<string | null> {
  if (!CAP_MA_MAY_CHU) return null;
  try {
    const ve = await layVe();
    if (!ve) return null;
    const res = await fetch("/api/cap-ma", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ve}` },
      body: JSON.stringify({ loai, thamSo }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { ma?: unknown };
    /* Chỉ nhận chuỗi không rỗng. Máy chủ trả gì lạ thì coi như không xin được — thà tự tính
       còn hơn ghi một mã rỗng vào chứng từ. */
    return typeof j.ma === "string" && j.ma.trim() ? j.ma.trim() : null;
  } catch {
    return null;
  }
}
