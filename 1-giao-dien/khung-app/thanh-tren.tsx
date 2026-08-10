import { Menu } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/1-giao-dien/nen-tang-ui/sheet";
import { OTimKiem } from "@/1-giao-dien/khung-app/o-tim-kiem";
import { SidebarNav } from "@/1-giao-dien/khung-app/thanh-ben-noi-dung";
import { HeaderClock } from "@/1-giao-dien/khung-app/dong-ho";
import { ThemeToggle } from "@/1-giao-dien/khung-app/nut-sang-toi";
import { NutThongBao } from "@/1-giao-dien/khung-app/nut-thong-bao";

/**
 * Header cao 60px — CHỈ chứa chức năng phụ: mở Drawer điều hướng (dưới Desktop),
 * tìm kiếm, ngày giờ, thông báo, đổi sáng/tối. Điều hướng chính thuộc Sidebar (V1.1 Phần C).
 *
 * 🔴 BA NÚT ĐÃ BỎ KHỎI ĐÂY — chỉ đạo Ban lãnh đạo 08/08/2026:
 *
 *  1. "Vai trò: …" (đổi vai trò thử nghiệm) — app ĐÃ CÓ ĐĂNG NHẬP thật nên không
 *     cần cửa sau đổi vai trò nữa; để lại là ai cũng tự nâng quyền được.
 *     Muốn xem app dưới góc nhìn phòng ban khác thì đăng xuất rồi đăng nhập tài
 *     khoản tương ứng (danh sách ở màn đăng nhập).
 *
 *  2. Chọn mật độ hiển thị — CHỐT MỘT MỨC "Vừa" cho cả app, không cho đổi nữa.
 *     Mức Vừa là chuẩn đã chốt từ 05/08/2026; ba mức song song làm mỗi máy một kiểu,
 *     khó thống nhất khi hướng dẫn nhau qua điện thoại.
 *
 *  3. Chọn màu chủ đạo — tạm bỏ, sẽ xây dựng lại sau.
 *
 * ⚠️ Hạ tầng của cả ba vẫn còn nguyên (`mat-do.tsx`, `mau-chu-dao.tsx`,
 * `nut-mat-do.tsx`, `nut-mau-chu-dao.tsx`, `nut-vai-tro.tsx`) — chỉ gỡ nút khỏi
 * giao diện. Muốn bật lại chỉ việc import vào đây, không phải dựng lại từ đầu.
 *
 * 📌 Thông tin người đăng nhập đã chuyển sang THANH BÊN (`khoi-tai-khoan-ben.tsx`),
 * ngay dưới tên app — luôn hiển thị, không phải bấm mới thấy.
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
        <ThemeToggle />
      </div>
    </header>
  );
}
