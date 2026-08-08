import { Menu } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/1-giao-dien/nen-tang-ui/sheet";
import { OTimKiem } from "@/1-giao-dien/khung-app/o-tim-kiem";
import { SidebarNav } from "@/1-giao-dien/khung-app/thanh-ben-noi-dung";
import { HeaderClock } from "@/1-giao-dien/khung-app/dong-ho";
import { ThemeToggle } from "@/1-giao-dien/khung-app/nut-sang-toi";
import { MatDoSwitcher } from "@/1-giao-dien/khung-app/nut-mat-do";
import { MauChuDaoSwitcher } from "@/1-giao-dien/khung-app/nut-mau-chu-dao";
import { NutThongBao } from "@/1-giao-dien/khung-app/nut-thong-bao";
import { VaiTroSwitcher } from "@/1-giao-dien/khung-app/nut-vai-tro";
import { AccountMenu } from "@/1-giao-dien/khung-app/menu-tai-khoan";

/**
 * Header cao 60px — CHỈ chứa chức năng phụ: mở Drawer điều hướng (dưới Desktop),
 * tìm kiếm, ngày giờ, đổi theme, tài khoản. Điều hướng chính thuộc Sidebar (V1.1 Phần C).
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-(--hp-header-height) items-center gap-3 border-b border-border bg-surface px-4 md:px-5 xl:px-6">
      <Sheet>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="xl:hidden" aria-label="Mở menu điều hướng" />}
        >
          <Menu className="size-5" />
        </SheetTrigger>
        {/* Drawer mobile 85% màn hình, tối đa 320px; từ Tablet dùng đúng bề rộng Sidebar 260px. */}
        <SheetContent side="left" className="w-[min(85vw,320px)] p-0 md:w-(--hp-sidebar-width)">
          <SheetTitle className="sr-only">Điều hướng</SheetTitle>
          <SidebarNav />
        </SheetContent>
      </Sheet>

      <OTimKiem />

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <HeaderClock />
        <NutThongBao />
        <VaiTroSwitcher />
        <MatDoSwitcher />
        <MauChuDaoSwitcher />
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  );
}
