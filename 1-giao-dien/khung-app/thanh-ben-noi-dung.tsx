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

/**
 * Trang chủ App Tổng — nơi nút "Về trang chủ" ở cuối thanh bên dẫn tới.
 *
 * 🔴 PHẢI LÀ `account.hpcore.vn`, KHÔNG PHẢI `hpcore.vn` — Ban lãnh đạo 21/08/2026: *"bấm về
 * trang chủ là sẽ về trang đã đăng nhập"*.
 *
 * 🔴 ĐÚNG ĐỊA CHỈ LÀ `account.hpcore.vn/profile` — Ban lãnh đạo chỉ rõ bằng ảnh 21/08/2026
 * (*"bấm về trang chủ là sẽ về đây nhé"*). Đó là trang tài khoản trong portal, có thanh biểu
 * tượng bên trái để sang danh sách app · thông báo · thêm người.
 *
 * Hai lần trước tôi trỏ sai, ghi lại để người sau khỏi thử lại:
 *   · `hpcore.vn` → *"HP CONS – Nhà Thầu Công Nghiệp"* = **website giới thiệu công ty**, không có
 *     phiên đăng nhập, không có danh sách app.
 *   · `account.hpcore.vn` (gốc) → khi CHƯA có phiên thì chuyển hướng sang `/login`.
 *
 * 📌 Phiên KHÔNG mất khi bấm: cookie `session` đặt ở miền `.hpcore.vn` (xem
 * `5-ket-noi/hpcore-may-chu.ts`), nên portal nhận ra người dùng và vào thẳng.
 */
const APP_TONG_URL =
  process.env.NEXT_PUBLIC_APP_TONG_URL ?? "https://account.hpcore.vn/profile";

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

      {/* ★ NÚT VỀ TRANG CHỦ — Ban lãnh đạo 21/08/2026: *"sửa tên thành Về trang chủ, và sửa lại
          đường link dẫn tới trang chủ thật"*.
          🔴 DÙNG THẺ `<a>` CHỨ KHÔNG PHẢI `<Link>` của Next.js: đây là địa chỉ NGOÀI app. `Link`
          dùng cho điều hướng trong app — trỏ nó ra ngoài thì Next.js vẫn cố nạp trước như một
          route nội bộ, chậm và có thể trượt.
          📌 Địa chỉ lấy từ biến `NEXT_PUBLIC_APP_TONG_URL`, mặc định `https://hpcore.vn`. Đổi nơi
          chạy thì đổi biến, không phải sửa mã. */}
      <div className="border-t border-white/10 p-3">
        <a
          href={APP_TONG_URL}
          className="flex h-(--hp-menu-l2-height) items-center gap-2 rounded-lg px-3 text-xs font-medium text-nav-foreground-muted transition-colors hover:bg-nav-hover hover:text-nav-foreground"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          <span className="truncate">Về trang chủ</span>
        </a>
      </div>
    </div>
  );
}
