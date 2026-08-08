import { SidebarNav } from "@/1-giao-dien/khung-app/thanh-ben-noi-dung";

/**
 * Sidebar cố định rộng 260px — chỉ hiện từ Desktop (>=1280px).
 * Dưới ngưỡng đó điều hướng chuyển sang Drawer (xem app-header.tsx) — V1.1 Phần F.
 */
export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-(--hp-sidebar-width) xl:block">
      <SidebarNav />
    </aside>
  );
}
