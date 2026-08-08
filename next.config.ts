import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Xuất tĩnh để đưa lên Firebase Hosting. Các route động ([id]) sinh sẵn trang
  // theo danh sách trong dữ liệu mẫu — xem generateStaticParams ở từng route.
  output: "export",
  images: { unoptimized: true },
  // Cho phép đổi thư mục build qua biến môi trường (dùng cho `npm run build:check`).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
