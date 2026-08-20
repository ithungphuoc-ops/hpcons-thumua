import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🔴 ĐÃ BỎ `output: "export"` (20/08/2026, chỉ đạo Ban lãnh đạo: đăng nhập bằng SSO
  // App Tổng thay cho tài khoản riêng của app). Lý do bắt buộc: cầu nối SSO
  // (`app/api/auth/hpcore-session`) phải chạy phía máy chủ — nó dùng khóa Admin SDK
  // để xác minh phiên `account.hpcore.vn` và cấp Custom Token, khóa đó TUYỆT ĐỐI
  // không được đưa xuống trình duyệt. Route handler kiểu này không chạy được ở bản
  // xuất tĩnh (xem cảnh báo cũ đã từng ghi ở đây, nay đúng như vậy).
  //
  // Hệ quả: Vercel giờ build server thật (không còn bê thư mục `out` đi đâu cũng
  // được nữa) — đổi hạ tầng thì phải dựng lại route xác thực, không phải chỉ đổi
  // build command.
  images: { unoptimized: true },
  // Cho phép đổi thư mục build qua biến môi trường (dùng cho `npm run build:check`).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Giữ `firebase-admin` (dùng ở `5-ket-noi/hpcore-may-chu.ts`) ngoài bundle webpack —
  // thực hành tốt cho các gói máy chủ nặng, dù KHÔNG PHẢI nguyên nhân của lỗi thật đã gặp
  // ngày 20/08/2026 (xem chú thích đầy đủ trong package.json ở bản ghim firebase-admin).
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
