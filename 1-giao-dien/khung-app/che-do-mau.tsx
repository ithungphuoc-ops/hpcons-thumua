"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Bọc next-themes để hỗ trợ Light + Dark Mode dùng chung một bộ token
 * (HPCons Design System V1.1 - Phần B4.3). Mặc định theo Light Mode (nền màu sáng/trắng)
 * cho tới khi người dùng tự chọn theme khác.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
