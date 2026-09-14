"use client";

import { useEffect, type ReactNode } from "react";
import { batCanhDonDepToanCuc } from "@/1-giao-dien/thanh-phan-dung-chung/don-dep-hop-thoai-ket";
import { AppSidebar } from "@/1-giao-dien/khung-app/thanh-ben";
import { AppHeader } from "@/1-giao-dien/khung-app/thanh-tren";
import { BottomNav } from "@/1-giao-dien/khung-app/thanh-duoi-mobile";
import { BaoViecMoi } from "@/1-giao-dien/khung-app/bao-viec-moi";

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
  /**
   * ★★★ LỚP CANH DỌN DẤU VẾT HỘP THOẠI — bật MỘT LẦN cho cả app, thêm 14/09/2026.
   *
   * 🔴 ĐẶT Ở ĐÂY LÀ CỐ Ý, KHÔNG PHẢI CHO TIỆN. Sếp báo lỗi "cả app kẹt, phải F5" tới **lần thứ
   * tư**. Ba lượt sửa trước đều gắn lưới vào TỪNG hộp thoại, nên chỉ cứu được đúng những hộp đã
   * gắn. Nhưng cơ chế khoá nền của base-ui (`useScrollLock` + `markOthers`) dùng chung cho cả
   * `Popover`, `DropdownMenu`, `Select`, `Menu`, `Tooltip` — rò rỉ từ một trong số đó thì không
   * hộp thoại nào bị tháo, không lưới nào chạy.
   *
   * ⚠️ VÀ DẤU VẾT ĐI THEO SANG TRANG KHÁC: Next.js App Router điều hướng phía client nên DOM
   * không bị dựng lại. Người dùng thấy kẹt ở màn hình A trong khi thủ phạm ở màn hình B — đó là
   * lý do truy mãi không ra bằng cách đọc code từng màn.
   *
   * 📌 Lớp này theo dõi thẳng DẤU VẾT trên DOM chứ không đoán nguồn, và vẫn đi qua đủ bốn chốt
   * bảo vệ nên không dọn nhầm lúc còn hộp thoại mở thật. Chi tiết ở
   * `thanh-phan-dung-chung/don-dep-hop-thoai-ket.ts`.
   *
   * 🔴 ĐÂY LÀ LỚP PHÒNG THỦ, KHÔNG PHẢI GỐC RỄ. Giữ nó không có nghĩa là thôi tìm gốc — còn chỗ
   * nào tháo hộp thoại giữa lúc đang đóng thì vẫn phải sửa. Lớp này chỉ bảo đảm người dùng không
   * bao giờ phải F5 nữa trong lúc chờ.
   */
  useEffect(batCanhDonDepToanCuc, []);

  return (
    <div className="min-h-screen bg-background">
      {/* 🔔 Nghe thông báo việc mới rồi bật hộp nổi. Không vẽ gì ra màn hình.
          Đặt ở khung tổng để mọi trang trong app đều được báo — gắn vào một trang cụ thể thì
          người đang ở trang khác không nhận được tin, mà đó chính là lúc cần báo nhất. */}
      <BaoViecMoi />
      <AppSidebar />
      <div className="flex min-h-screen flex-col xl:ml-(--hp-sidebar-width)">
        <AppHeader />
        {/* `flex flex-col` + con `flex-1`: cho phép màn hình nào cần (vd bảng quy trình)
            tự sổ xuống kín chiều cao còn lại bằng flex-1 — trang khác không đổi gì. */}
        <main className="flex flex-1 flex-col overflow-x-hidden p-(--hp-md-pad) pb-[calc(var(--hp-bottom-nav-height)+env(safe-area-inset-bottom)+1rem)] md:pb-(--hp-md-pad)">
          {/* ★ VÙNG LÀM VIỆC TRẢI KÍN MÀN HÌNH — Ban lãnh đạo 16/08/2026: *"bố cục lại các
              trường thông tin full màn hình nhé"* (ảnh khoanh hai dải trống hai bên).

              🔴 BỎ giới hạn `--hp-be-rong-lam-viec` (1440px) đặt từ 08/08/2026 khi vùng làm
              việc còn bó theo khổ giấy A4. Trên màn 1900px, giới hạn đó chừa hai dải trống
              mỗi bên ~230px — đúng chỗ đang thiếu để bảng 8 cột và hai cột của trang chi tiết
              thở ra được.

              📌 Lối thoát `data-rong-toan-man` giữ nguyên: nó không còn tác dụng thu hẹp,
              nhưng các màn đang khai vẫn chạy đúng, và gỡ đi thì phải sửa nhiều file. */}
          <div className="mx-auto flex w-full flex-1 flex-col gap-(--hp-md-section)">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
