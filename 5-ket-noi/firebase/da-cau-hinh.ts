/**
 * Kiểm tra đã cấu hình Firebase chưa — TÁCH RIÊNG khỏi `config.ts` một cách có
 * chủ đích: file này không import SDK Firebase, nên giao diện có thể hỏi
 * "đã cấu hình chưa?" mà không kéo theo hàng trăm KB JavaScript.
 *
 * Next.js thay thế `process.env.NEXT_PUBLIC_*` bằng giá trị thật lúc build,
 * nên phải viết đầy đủ tên biến (không dùng biến động).
 */
export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
);
