"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  NHAN_NHOM_MENU,
  THU_TU_NHOM,
  hrefDangChon,
  mucDieuHuongChoVaiTro,
} from "@/2-quy-trinh/dieu-huong";
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
  /**
   * 🔴 Mục đang chọn tính ở MỘT CHỖ (`hrefDangChon`), không tự so ở đây.
   * Tự so bằng `startsWith` làm HAI mục cùng sáng khi một href là tiền tố của href kia
   * (`/de-nghi` và `/de-nghi/nhan-moi`) — lỗi Ban lãnh đạo báo 12/08/2026.
   */
  const hrefChon = hrefDangChon(pathname, muc);

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

      {/* 🔴 KHÔNG ĐẶT KHỐI TÀI KHOẢN Ở ĐÂY.
          V1.1 Phần C: Sidebar chịu trách nhiệm ĐIỀU HƯỚNG TOÀN BỘ, còn tài khoản thuộc thanh
          trên cùng với tìm kiếm / thông báo / ngày giờ. Ngày 08/08/2026 khối tài khoản từng
          được dời vào đây; Ban lãnh đạo yêu cầu 10/08/2026 đưa lại đúng chuẩn — xem
          `khung-app/menu-tai-khoan.tsx`. */}

      {/* ★ NHÓM CÁC MỤC — Ban lãnh đạo 13/08/2026 gửi ảnh mẫu sidebar Base.vn và chốt:
          *"phần tên và avatar em giữ nguyên như cũ, chỉ nhóm các công việc lại theo hình"*.

          Tiêu đề nhóm in hoa nhỏ, ngăn giữa hai cụm: việc CÁ NHÂN (tôi cần làm gì, hạn khi
          nào) và việc theo QUY TRÌNH (hồ sơ đang ở đâu). Nhãn nhóm ở
          `2-quy-trinh/dieu-huong.ts` → `NHAN_NHOM_MENU`.

          📌 Nhóm chỉ để xếp cho dễ tìm, KHÔNG ảnh hưởng quyền: ai thấy mục nào vẫn do
          `duocThay` quyết, nên nhóm rỗng thì tự biến mất chứ không để lại tiêu đề trơ. */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3" aria-label="Điều hướng chính">
        {THU_TU_NHOM.map((nhom) => {
          const mucCuaNhom = muc.filter((m) => (m.nhom ?? "quy_trinh") === nhom);
          if (mucCuaNhom.length === 0) return null;
          return (
            <div key={nhom} className="flex flex-col gap-1">
              <p className="px-3 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-nav-foreground-muted uppercase">
                {NHAN_NHOM_MENU[nhom]}
              </p>
              {mucCuaNhom.map((m) => {
                const active = m.href === hrefChon;
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
            </div>
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
