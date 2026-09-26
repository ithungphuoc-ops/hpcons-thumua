import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/1-giao-dien/khung-app/che-do-mau";
import { CurrentUserProvider } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { DuLieuProvider } from "@/3-du-lieu/kho-du-lieu";
import { MatDoProvider, MAT_DO_MAC_DINH } from "@/1-giao-dien/khung-app/mat-do";
import { MauChuDaoProvider, MAU_MAC_DINH } from "@/1-giao-dien/khung-app/mau-chu-dao";
import { TooltipProvider } from "@/1-giao-dien/nen-tang-ui/tooltip";
import { Toaster } from "@/1-giao-dien/nen-tang-ui/sonner";

// Font chính theo HPCons Design System V1.1 Phần D — Inter, subset latin + vietnamese.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  /**
   * ★ TÊN TAB TRÌNH DUYỆT — Sếp chốt 17/09/2026: **"HP CONS Thu mua"**.
   *
   * Trước đó là *"Phòng Thu mua // HPCons"*. Dấu `//` không có căn cứ nào trong quy chuẩn
   * công ty và không app anh em nào dùng — Sếp mở 4 tab cạnh nhau (`HP CONS Portal`,
   * `QLK CTR`, `Nhà Thầu…`) thì tab này lạc lõng.
   *
   * 📌 Tab bị co hẹp khi mở nhiều app, nên **chữ đứng đầu mới là chữ đọc được**. Để
   * `HP CONS` trước thì dù bị cắt vẫn nhận ra là app nội bộ công ty, giống `HP CONS Portal`.
   */
  title: "HP CONS Thu mua",
  description:
    "Đề nghị mua hàng, phân bổ công việc, đơn đặt hàng và theo dõi giao nhận — module Thu mua trong hệ sinh thái HPcore.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} h-full antialiased`}
      data-matdo={MAT_DO_MAC_DINH}
      data-mau={MAU_MAC_DINH}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <MatDoProvider>
            <MauChuDaoProvider>
              <CurrentUserProvider>
                <DuLieuProvider>
                  <TooltipProvider>
                    {children}
                    {/**
                      * ★★ THÔNG BÁO ĐƯA LÊN GIỮA MÀN HÌNH — Sếp 16/09/2026, kèm ảnh một toast báo
                      * *"Không chuyển được"* nằm lọt thỏm ở góc dưới phải: *"những thông báo kiểu
                      * này hãy đưa lên giữa màn hình để người dùng ko bị nhìn sót"*.
                      *
                      * 🔴 VÌ SAO GÓC DƯỚI PHẢI KHÔNG ĂN: bảng quy trình là một dải cột cuộn ngang
                      * kín màn hình, mắt người dùng đang ở giữa bảng — góc dưới phải nằm ngoài
                      * vùng nhìn, lại hay bị nút "Góp ý" che. Câu bị bỏ lỡ ở đây không phải câu
                      * trang trí: nó là **lý do app từ chối một thao tác** và **chỉ đường phải làm
                      * gì thay thế**. Bỏ lỡ nó thì người dùng tưởng app hỏng.
                      *
                      * 📌 `top-center` chứ không phải `bottom-center`: thông báo trồi từ mép trên
                      * xuống, nằm trong vùng mắt đang đọc, và **không che** cụm nút thao tác ở đáy
                      * màn hình (Lưu / Xác nhận / Hoàn thành) — che nút là đổi một lỗi lấy một lỗi
                      * khó chịu hơn.
                      *
                      * ⚠️ ĐẶT MỘT CHỖ CHO CẢ APP, đừng truyền `position` lẻ ở từng lời gọi `toast`.
                      * App có hàng trăm lời gọi; mỗi chỗ một vị trí là người dùng không bao giờ
                      * biết phải nhìn đâu, và người viết mới cũng không biết theo lệ nào.
                      */}
                    {/* (26/09/2026) `offset` 72px: nằm dưới thanh trên cùng (60px), không bị che — Sếp: *"fit giữa màn hình"*. */}
                    <Toaster position="top-center" offset={72} />
                  </TooltipProvider>
                </DuLieuProvider>
              </CurrentUserProvider>
            </MauChuDaoProvider>
          </MatDoProvider>
        </ThemeProvider>
        {/* Bong bóng góp ý/báo lỗi xuyên suốt hệ sinh thái — file phục vụ từ app tổng, đọc
            cookie SSO .hpcore.vn có sẵn để xác thực, không cần code riêng ở đây ngoài đúng
            1 dòng này (đúng mẫu đã dùng ở PKD/Đấu Thầu...). */}
        <script src="https://account.hpcore.vn/feedback-widget.js" data-app="HPC Thu Mua" async />
      </body>
    </html>
  );
}
