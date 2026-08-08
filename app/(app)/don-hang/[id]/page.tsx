// Bảng chỉ đường — Next.js lấy tên thư mục làm địa chỉ URL nên file này phải ở đây.
// Toàn bộ code màn hình nằm ở: 1-giao-dien/trang/don-hang-chi-tiet.tsx
import ManHinh from "@/1-giao-dien/trang/don-hang-chi-tiet";
import { DON_HANG_MAU } from "@/3-du-lieu/du-lieu-mau";

/** Hosting tĩnh cần biết trước danh sách địa chỉ — sinh từ danh sách đơn đặt hàng trong dữ liệu mẫu.
 *  Khi nối Firestore thật sẽ bỏ hàm này và cho máy chủ dựng trang theo yêu cầu. */
export function generateStaticParams() {
  return DON_HANG_MAU.map((x) => ({ id: x.id }));
}

export default function Trang() {
  return <ManHinh />;
}
