// ============================================================
// KHỞI TẠO FIREBASE — MỘT CHỖ DUY NHẤT cho cả Firestore và Authentication
//
// 🔴 Vì sao phải gom về đây: `initializeApp()` gọi hai lần với cùng tên là Firebase ném lỗi
// và cả hai bên cùng hỏng. Trước 12/08/2026 phần Firestore tự khởi tạo riêng trong
// `3-du-lieu/kho-chung-firestore.ts`; thêm Authentication nữa là thành hai chỗ cùng khởi
// tạo. Nay chỉ còn một cửa: `moFirebase()`.
//
// 📌 Cấu hình web KHÔNG phải bí mật — mọi app Firebase đều để lộ nó trong mã tải về máy.
// Bảo mật thật nằm ở Security Rules. Khác hẳn khóa Admin SDK (khóa đó toàn quyền, tuyệt
// đối không được đưa vào đây).
// ============================================================

import type { FirebaseApp } from "firebase/app";

/**
 * Đã khai đủ cấu hình Firebase chưa.
 * Thiếu thì app chạy một mình (lưu trên máy), KHÔNG được coi là lỗi — máy lập trình viên
 * mới clone về chưa có `.env.local` vẫn phải mở được app.
 */
export function daCauHinhFirebase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  );
}

/**
 * Mở kết nối Firebase, nạp gói theo kiểu **động**.
 *
 * 🔴 Không `import` tĩnh: gói `firebase` nặng, mà app còn phải dựng được trang tĩnh lúc
 * build (không có `window`). Nạp động thì máy chưa cấu hình không tải gói này về.
 *
 * Trả `null` khi chưa cấu hình hoặc đang chạy phía máy chủ — người gọi phải xử lý `null`,
 * đừng ép kiểu bỏ qua.
 */
export async function moFirebase(): Promise<FirebaseApp | null> {
  if (typeof window === "undefined" || !daCauHinhFirebase()) return null;

  const { initializeApp, getApps, getApp } = await import("firebase/app");
  // `getApps().length` — Next.js giữ module qua các lần chuyển trang, khởi tạo lại là lỗi.
  if (getApps().length > 0) return getApp();

  return initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}
