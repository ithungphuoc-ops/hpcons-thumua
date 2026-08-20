// ============================================================
// XÁC THỰC — ĐĂNG NHẬP QUA SSO APP TỔNG (account.hpcore.vn)
//
// 🔴 Chỉ đạo Ban lãnh đạo 20/08/2026: *"xoá quyền đăng nhập và SSO đăng nhập từ app tổng"*.
// Bỏ hẳn màn email/mật khẩu riêng của app này (8 tài khoản tạo tay qua Firebase Console,
// xem lịch sử — không còn dùng nữa) — mọi người đăng nhập bằng ĐÚNG tài khoản họ dùng cho
// toàn bộ hệ sinh thái HPcore, giống Đấu Thầu/Booking/Cuộc Họp.
//
// CÁCH HOẠT ĐỘNG — HAI CHẶNG, một máy chủ một trình duyệt:
//   ① Máy chủ (`app/api/auth/hpcore-session`): đọc cookie phiên `account.hpcore.vn`,
//      xác minh bằng khóa Admin SDK, cấp lại Custom Token cho CHÍNH project Firebase mà
//      app này đang dùng (`hpcons-portal` — chung với App Tổng, xem `hpcore-may-chu.ts`).
//   ② Trình duyệt (hàm `layPhienSSO` dưới đây): gọi route đó, rồi `signInWithCustomToken`
//      để có phiên đăng nhập Firebase Auth CỦA RIÊNG origin `thumua.hpcore.vn` — trình
//      duyệt không tự chia sẻ phiên đăng nhập giữa hai tên miền con dù cùng project.
//
// Chưa đăng nhập App Tổng (route trả 401) → CHUYỂN THẲNG sang `account.hpcore.vn/login`,
// đăng nhập xong quay lại đúng trang đang xem (tham số `next`).
// ============================================================

import { moFirebase } from "@/5-ket-noi/firebase-chung";
import type { VaiTroToanCucAppTong } from "@/4-phan-quyen/quyen";

export const hpcoreLoginUrl = (returnTo: string): string =>
  `https://account.hpcore.vn/login?next=${encodeURIComponent(returnTo)}`;

async function moAuth() {
  const app = await moFirebase();
  if (!app) return null;
  const auth = await import("firebase/auth");
  return { auth: auth.getAuth(app), ...auth };
}

/** Kết quả một lần lấy phiên SSO — BA nhánh, mỗi nhánh một việc rõ ràng. */
export type KetQuaSSO =
  | { trangThai: "thanh-cong"; token: string; email: string; tenHienThi: string; vaiTroToanCuc: VaiTroToanCucAppTong | null }
  | { trangThai: "chua-dang-nhap-app-tong" }
  | { trangThai: "loi"; thongDiep: string };

/**
 * Gọi cầu nối SSO (`/api/auth/hpcore-session`) để xin Custom Token.
 *
 * ⚠️ KHÔNG tự điều hướng ở đây — nơi gọi (`4-phan-quyen/nguoi-dung-hien-tai.tsx`) quyết định
 * làm gì với từng trạng thái, hàm này chỉ hỏi và trả lời trung thực.
 */
export async function layPhienSSO(): Promise<KetQuaSSO> {
  let res: Response;
  try {
    res = await fetch("/api/auth/hpcore-session", { cache: "no-store" });
  } catch {
    return { trangThai: "loi", thongDiep: "Không kết nối được máy chủ. Kiểm tra lại mạng rồi thử lại." };
  }

  if (res.status === 401) return { trangThai: "chua-dang-nhap-app-tong" };

  if (!res.ok) {
    return {
      trangThai: "loi",
      thongDiep: `Không xác thực được với App Tổng (mã ${res.status}). Báo phòng IT.`,
    };
  }

  const body = (await res.json()) as {
    token: string;
    email: string;
    tenHienThi: string;
    vaiTroToanCuc: VaiTroToanCucAppTong | null;
  };
  return { trangThai: "thanh-cong", ...body };
}

/** Đăng nhập Firebase bằng Custom Token vừa xin được từ cầu nối SSO. Trả về uid vừa đăng nhập. */
export async function dangNhapBangCustomToken(token: string): Promise<string> {
  const m = await moAuth();
  if (!m) throw new Error("Chưa cấu hình kết nối Firebase.");
  const kq = await m.signInWithCustomToken(m.auth, token);
  return kq.user.uid;
}

export async function dangXuatFirebase(): Promise<void> {
  const m = await moAuth();
  if (!m) return;
  await m.signOut(m.auth);
}
