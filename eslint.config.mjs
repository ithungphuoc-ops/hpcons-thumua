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
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
