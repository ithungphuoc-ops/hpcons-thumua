"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonStar, SunMedium } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/1-giao-dien/nen-tang-ui/tooltip";

/**
 * Nút chuyển Light/Dark Mode trên Header, đặt cạnh tài khoản người dùng.
 *
 * Hai icon xếp chồng và chuyển cảnh bằng xoay + phóng (không hiện/ẩn đột ngột)
 * để cảm giác mượt — thời lượng theo 18-motion của Design System.
 *
 * Phải chờ component gắn xong (`mounted`) mới vẽ icon theo theme: theme thật
 * nằm ở localStorage nên máy chủ không biết trước — vẽ ngay sẽ lệch giữa HTML
 * dựng sẵn và trình duyệt (hydration mismatch), gây nháy icon.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  const nhan = isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối";

  // Giữ đúng chỗ trống trước khi biết theme để header không bị giật
  if (!mounted) {
    return <div className="size-12 shrink-0 md:size-11 xl:size-10" aria-hidden />;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={nhan}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          />
        }
      >
        <span className="relative flex size-5 items-center justify-center">
          <SunMedium
            className="absolute size-5 scale-0 rotate-90 text-warning opacity-0 transition-all duration-200 ease-out dark:scale-100 dark:rotate-0 dark:opacity-100"
            aria-hidden
          />
          <MoonStar
            className="absolute size-5 scale-100 rotate-0 opacity-100 transition-all duration-200 ease-out dark:scale-0 dark:-rotate-90 dark:opacity-0"
            aria-hidden
          />
        </span>
      </TooltipTrigger>
      <TooltipContent>{nhan}</TooltipContent>
    </Tooltip>
  );
}
