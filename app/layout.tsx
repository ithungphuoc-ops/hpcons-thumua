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
  title: "Phòng Thu mua // HPCons",
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
                    <Toaster />
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
