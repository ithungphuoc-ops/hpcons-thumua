"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hrefDangChon, mucDieuHuongChoVaiTro } from "@/2-quy-trinh/dieu-huong";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { cn } from "@/6-tien-ich/gop-lop";

/**
 * Bottom Navigation — CHỈ hiện trên Mobile (<768px). Cao 60px, nhãn 11px,
 * vùng chạm >= 44x44px (V1.1 Phần F + 08-navigation).
 *
 * 🔴 KHÔNG CẮT DANH SÁCH MỤC Ở ĐÂY. Trước 11/08/2026 chỗ này có `.slice(0, 5)`, nên thêm mục
 * thứ 6 vào menu là **âm thầm mất một mục** trên điện thoại — người dùng không hiểu vì sao
 * mục đó biến mất, mà lập trình viên sửa `dieu-huong.ts` cũng không biết mình vừa làm gì. Cắt
 * ngầm ở tầng hiển thị là kiểu lỗi khó tìm nhất.
 *
 * Muốn giới hạn số mục thì giới hạn ở `dieu-huong.ts` (nơi khai báo), và phải nói rõ ra.
 * Hiện 6 mục vẫn vừa màn 375px: mỗi mục tối thiểu 44px → 6 × 44 = 264px < 375px. `flex-1` +
 * `truncate` lo phần chia đều và cắt chữ dài.
 */
export function BottomNav() {
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
    <nav
      aria-label="Điều hướng nhanh"
      className="fixed inset-x-0 bottom-0 z-30 flex h-(--hp-bottom-nav-height) items-stretch border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {muc.map((m) => {
        const active = m.href === hrefChon;
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
