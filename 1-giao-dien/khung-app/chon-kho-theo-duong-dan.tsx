"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DuLieuProvider } from "@/3-du-lieu/kho-du-lieu";
import { khoTheoDuongDan } from "@/3-du-lieu/kho-id";

/**
 * ★ CHỌN KHO THEO ĐỊA CHỈ — Sếp duyệt demo 14/10/2026.
 *
 * Địa chỉ bắt đầu bằng `/equi` → dựng provider của kho EQUI, còn lại → kho thường (đúng như
 * trước khi có EQUI).
 *
 * 🔴 `key={kho}` LÀ BẮT BUỘC. Chuyển từ `/de-nghi` sang `/equi/de-nghi` mà không dựng lại provider
 * là giữ nguyên state, ref và sổ "bản ghi mới" của kho thường rồi ghi chúng sang tài liệu EQUI —
 * lẫn dữ liệu ngay lúc bấm menu. Dựng lại thì mất vài trăm mili-giây nạp kho mới, đổi lại hai kho
 * không bao giờ nhìn thấy nhau.
 */
export function ChonKhoTheoDuongDan({ children }: { children: ReactNode }) {
  const kho = khoTheoDuongDan(usePathname());
  return (
    <DuLieuProvider key={kho} kho={kho}>
      {children}
    </DuLieuProvider>
  );
}
