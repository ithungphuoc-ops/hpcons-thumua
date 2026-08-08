// Bảng chỉ đường — Next.js lấy tên thư mục làm địa chỉ URL nên file này phải ở đây.
// Toàn bộ code màn hình nằm ở: 1-giao-dien/trang/don-hang-in.tsx
//
// ⚠️ Đặt NGOÀI nhóm (app) là CỐ Ý: trang in không được có thanh bên và thanh trên.
// Provider dữ liệu nằm ở app/layout.tsx (gốc) nên trang này vẫn đọc được dữ liệu.
import ManHinh from "@/1-giao-dien/trang/don-hang-in";
import { DON_HANG_MAU } from "@/3-du-lieu/du-lieu-mau";

/** Hosting tĩnh cần biết trước danh sách địa chỉ — sinh từ danh sách đơn đặt hàng trong dữ liệu mẫu. */
export function generateStaticParams() {
  return DON_HANG_MAU.map((x) => ({ id: x.id }));
}

export default function Trang() {
  return <ManHinh />;
}
