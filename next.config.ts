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
  // 🔴 BẮT BUỘC cho `firebase-admin` (dùng ở `5-ket-noi/hpcore-may-chu.ts`) — lỗi thật gặp
  // trên Vercel 20/08/2026: `ERR_REQUIRE_ESM` (require() gói ESM `jose` từ `jwks-rsa`, một
  // gói con của firebase-admin). Webpack của Next.js cố đóng gói firebase-admin vào cùng
  // bundle route, mà bên trong nó lại trộn CommonJS/ESM không tương thích. Khai gói này là
  // "external" thì Next.js BỎ QUA việc đóng gói, để Node.js tự require thẳng từ
  // node_modules lúc chạy — đây là cách sửa chính thức Next.js khuyến nghị cho đúng lớp lỗi
  // này với firebase-admin.
  // "firebase-admin" một mình chưa đủ (đã thử, vẫn lỗi) — khai thêm ĐÍCH DANH hai gói con
  // gây lỗi (`jwks-rsa` require CommonJS gói `jose` bản ESM) để chắc chắn Next.js bỏ qua
  // đóng gói cả hai, không chỉ gói cha.
  serverExternalPackages: ["firebase-admin", "jwks-rsa", "jose"],
};

export default nextConfig;
