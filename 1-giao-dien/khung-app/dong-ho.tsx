"use client";

import { useEffect, useState } from "react";

/** Ngày giờ hiện tại trên Header (Phần C: Header chỉ chứa chức năng phụ, gồm cả ngày giờ). */
export function HeaderClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Tránh lệch nội dung SSR/CSR (giờ máy chủ khác giờ trình duyệt) — chỉ render sau khi mount.
  if (!now) return <span className="hidden text-sm text-text-desc md:inline" />;

  const date = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(now);
  const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(now);

  return (
    <span className="hidden whitespace-nowrap text-sm text-text-desc md:inline">
      {date} · {time}
    </span>
  );
}
