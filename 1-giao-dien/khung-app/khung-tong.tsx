import type { ReactNode } from "react";
import { AppSidebar } from "@/1-giao-dien/khung-app/thanh-ben";
import { AppHeader } from "@/1-giao-dien/khung-app/thanh-tren";
import { BottomNav } from "@/1-giao-dien/khung-app/thanh-duoi-mobile";

/**
 * Khung bố cục Hybrid (V1.1 Phần C): Sidebar 260px cố định bên trái (Desktop),
 * Header 60px phía trên. Mobile bổ sung Bottom Navigation — vùng nội dung chừa
 * đệm dưới để không bị che.
 *
 * Lề vùng nội dung và khoảng cách giữa các khu vực đi theo MẬT ĐỘ HIỂN THỊ
 * (biến `--hp-md-*` trong globals.css, đổi bằng nút mật độ trên Header):
 *   Thoáng = 24/24px (đúng V1.1) · Vừa = 16/16px · Gọn = 12/12px
 *
 * Lý do làm thành 3 chế độ thay vì bóp cứng: bản thumua-next cũ từng bị bóp
 * xuống 10–12px theo yêu cầu "thu gọn" và mất luôn tham chiếu về quy chuẩn.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="flex min-h-screen flex-col xl:ml-(--hp-sidebar-width)">
        <AppHeader />
        {/* `flex flex-col` + con `flex-1`: cho phép màn hình nào cần (vd bảng quy trình)
            tự sổ xuống kín chiều cao còn lại bằng flex-1 — trang khác không đổi gì. */}
        <main className="flex flex-1 flex-col overflow-x-hidden p-(--hp-md-pad) pb-[calc(var(--hp-bottom-nav-height)+env(safe-area-inset-bottom)+1rem)] md:pb-(--hp-md-pad)">
          <div className="flex w-full flex-1 flex-col gap-(--hp-md-section)">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
