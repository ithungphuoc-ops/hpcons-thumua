import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Xuất tĩnh. Các route động ([id]) sinh sẵn trang theo danh sách trong dữ liệu
  // mẫu — xem generateStaticParams ở từng route.
  //
  // 📌 Nơi chạy chính thức là VERCEL (từ 11/08/2026, xem CLAUDE.md mục 6.3).
  // Vercel chạy được cả bản không xuất tĩnh, nhưng GIỮ `output: "export"` là cố ý:
  // app này không có việc gì cần máy chủ (dữ liệu sẽ đọc thẳng Firestore từ trình
  // duyệt), nên bản tĩnh vừa nhanh vừa không phụ thuộc nhà cung cấp nào — muốn dời
  // đi đâu cũng chỉ là bê thư mục `out` sang.
  //
  // ⚠️ Hệ quả phải nhớ: KHÔNG dùng được middleware, route handler, server action,
  // ISR hay tối ưu ảnh của Next. Cần một trong số đó thì phải bỏ dòng này trước.
  output: "export",
  images: { unoptimized: true },
  // Cho phép đổi thư mục build qua biến môi trường (dùng cho `npm run build:check`).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
