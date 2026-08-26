import type { ReactNode } from "react";
import { CongBaoVe } from "@/1-giao-dien/khung-app/cong-bao-ve";

/**
 * CỔNG BẢO VỆ CHO TRANG IN.
 *
 * 🔴 Bịt một lỗ có thật: trang in nằm NGOÀI nhóm `(app)` (cố ý, để không có thanh bên và
 * thanh trên khi in), nên nó cũng nằm ngoài `CongBaoVe` của `app/(app)/layout.tsx`. Ai
 * biết địa chỉ `/in/don-hang/<mã đơn>` là **mở thẳng ra xem được đơn hàng mà không cần
 * đăng nhập** — kèm đơn giá, thành tiền và tên nhà cung cấp.
 *
 * Phân quyền chỉ có nghĩa khi bịt hết mọi đường vào. Chặn cửa chính mà để ngỏ cửa sau thì
 * việc thủ kho "không được xem giá" chỉ là hình thức: họ mở trang in là thấy hết.
 *
 * ⚠️ Vẫn chỉ là chặn Ở GIAO DIỆN, giống `cong-bao-ve.tsx`. Chặn thật nằm ở Security Rules
 * — không đăng nhập thì không đọc được dữ liệu, nên trang này có mở ra cũng trống.
 *
 * 📌 Layout này KHÔNG thêm thanh bên / thanh trên, giữ đúng ý đồ ban đầu của trang in.
 */
export default function BoCucTrangIn({ children }: { children: ReactNode }) {
  return (
    <>
      {/**
        * ★★ BỎ HAI DÒNG TRÌNH DUYỆT TỰ IN — Ban lãnh đạo 26/08/2026: *"Bỏ 2 mục này"*, khoanh
        * đúng dòng trên (ngày giờ + tên tab) và dòng dưới (địa chỉ web + số trang) của tờ in.
        *
        * 🔴 HAI DÒNG ĐÓ KHÔNG PHẢI NỘI DUNG CỦA APP. Chrome tự in chúng vào lề giấy khi tùy chọn
        * *Headers and footers* đang bật — nên không có cách nào xóa bằng cách sửa tờ đơn.
        * Cách duy nhất từ phía web: đặt `@page { margin: 0 }`. Chrome không còn chỗ trong lề để
        * viết nên bỏ luôn cả hai dòng.
        *
        * 🔴 VÌ THẾ PHẢI TỰ LO LỀ GIẤY. Lề trang nay bằng 0, nếu tờ đơn không có phần đệm riêng
        * thì chữ chạy sát mép giấy và máy in cắt mất. Phần đệm nằm ở `to-don-mua-hang-a4.tsx`
        * (`px-[15mm] py-[12mm]`) — trước đây bị bỏ khi in (`print:px-0`), nay giữ lại.
        * ⚠️ Sửa một trong hai chỗ mà quên chỗ kia là tờ in mất lề hoặc lề gấp đôi.
        *
        * 📌 ĐẶT Ở LAYOUT CỦA `/in`, KHÔNG đặt vào `globals.css`: `@page` là quy tắc cấp tài liệu,
        * không giới hạn được theo vùng. Để ở CSS chung thì mọi trang app bấm Ctrl+P đều mất lề.
        *
        * 📌 Người dùng vẫn bật lại được hai dòng đó trong hộp thoại in nếu cần (tuỳ chọn
        * *Headers and footers*) — app không khoá tay họ, chỉ đổi mặc định.
        */}
      <style>{`@page { size: A4; margin: 0; }`}</style>
      <CongBaoVe>{children}</CongBaoVe>
    </>
  );
}
