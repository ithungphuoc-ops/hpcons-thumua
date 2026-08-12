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
  return <CongBaoVe>{children}</CongBaoVe>;
}
