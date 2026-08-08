"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mucDieuHuongChoVaiTro } from "@/2-quy-trinh/dieu-huong";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { cn } from "@/6-tien-ich/gop-lop";

/**
 * Bottom Navigation — CHỈ hiện trên Mobile (<768px). Cao 60px, tối đa 5 mục,
 * nhãn 11px, vùng chạm >= 44x44px (V1.1 Phần F + 08-navigation).
 */
export function BottomNav() {
  const pathname = usePathname();
  const { quyen } = useNguoiDung();
  const muc = mucDieuHuongChoVaiTro(quyen).slice(0, 5);

  return (
    <nav
      aria-label="Điều hướng nhanh"
      className="fixed inset-x-0 bottom-0 z-30 flex h-(--hp-bottom-nav-height) items-stretch border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {muc.map((m) => {
        const active = pathname === m.href || pathname.startsWith(`${m.href}/`);
        const Icon = m.icon;
        return (
          <Link
            key={m.href}
            href={m.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-11 flex-1 flex-col items-center justify-center gap-1 px-1 transition-colors",
              active ? "text-primary" : "text-text-desc",
            )}
          >
            <Icon className="size-5.5 shrink-0" aria-hidden />
            <span className="w-full truncate text-center text-[11px] leading-tight font-medium">
              {m.nhanNgan}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
