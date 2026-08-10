"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { mucDieuHuongChoVaiTro } from "@/2-quy-trinh/dieu-huong";
import { KhoiTaiKhoanBen } from "@/1-giao-dien/khung-app/khoi-tai-khoan-ben";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { cn } from "@/6-tien-ich/gop-lop";

const APP_TONG_URL = process.env.NEXT_PUBLIC_APP_TONG_URL ?? "https://hpcore.vn";

export interface SidebarNavProps {
  /** Gọi khi bấm một mục — dùng để đóng Drawer trên tablet/mobile. */
  onNavigate?: () => void;
}

/**
 * Nội dung điều hướng dùng chung cho Sidebar cố định (desktop) và Drawer (tablet/mobile).
 * V1.1 Phần C: menu cấp 1 cao 44px, khoảng cách giữa các mục 4–6px, sidebar màu #4B4F55.
 */
export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { quyen } = useNguoiDung();
  const muc = mucDieuHuongChoVaiTro(quyen);

  return (
    <div className="flex h-full flex-col bg-nav-base text-nav-foreground">
      <div className="flex h-(--hp-header-height) items-center gap-2 px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white p-1">
          <Image
            src="/logo-hpc.png"
            alt="HP Cons"
            width={28}
            height={24}
            className="h-auto w-full object-contain"
            priority
          />
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold">Phòng Thu mua</span>
          <span className="truncate text-xs text-nav-foreground-muted">HPCons</span>
        </div>
      </div>

      {/* Thông tin người đang đăng nhập — đặt ngay dưới tên app theo chỉ đạo 08/08/2026 */}
      <KhoiTaiKhoanBen />

      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4" aria-label="Điều hướng chính">
        {muc.map((m) => {
          const active = pathname === m.href || pathname.startsWith(`${m.href}/`);
          const Icon = m.icon;
          return (
            <Link
              key={m.href}
              href={m.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-(--hp-menu-l1-height) items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-nav-active text-white"
                  : "text-nav-foreground-muted hover:bg-nav-hover hover:text-nav-foreground",
              )}
            >
              <Icon className="size-4.5 shrink-0" aria-hidden />
              <span className="truncate">{m.nhan}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href={APP_TONG_URL}
          className="flex h-(--hp-menu-l2-height) items-center gap-2 rounded-lg px-3 text-xs font-medium text-nav-foreground-muted transition-colors hover:bg-nav-hover hover:text-nav-foreground"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          <span className="truncate">Về App Tổng HPcore</span>
        </Link>
      </div>
    </div>
  );
}
