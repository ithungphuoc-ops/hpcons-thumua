import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "**/.next/**",
      "**/.next-check/**",
      "**/.next-build/**",
      "**/.firebase/**",
      // Sản phẩm của `vercel build` (build tại máy để deploy khi hàng đợi Vercel tắc).
      // Bên trong là mã đã nén — không dọn thì `npm run verify` báo hàng trăm cảnh báo
      // "dòng 1 cột 55000" của chính bản build, che mất cảnh báo thật của mã nguồn.
      "**/.vercel/**",
      "**/out/**",
      "**/build/**",
      "**/next-env.d.ts",
      // 🔴 Worker của pdf.js — mã của THƯ VIỆN NGOÀI, đã nén, chép nguyên từ `node_modules`
      // (xem `6-tien-ich/trich-text-pdf.ts`). Không chặn thì `npm run verify` báo **7 lỗi và
      // hơn 1.500 cảnh báo** của chính tệp đó, che sạch cảnh báo thật của mã nguồn ta viết.
      // Phiên bản tệp này được canh bằng bài kiểm băm trong `kiem-luat-dung-chung.mjs`.
      "public/pdfjs/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
