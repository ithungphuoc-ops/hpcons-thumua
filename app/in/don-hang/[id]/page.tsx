// Bảng chỉ đường — Next.js lấy tên thư mục làm địa chỉ URL nên file này phải ở đây.
// Toàn bộ code màn hình nằm ở: 1-giao-dien/trang/don-hang-in.tsx
//
// ⚠️ Đặt NGOÀI nhóm (app) là CỐ Ý: trang in không được có thanh bên và thanh trên.
// Provider dữ liệu nằm ở app/layout.tsx (gốc) nên trang này vẫn đọc được dữ liệu.
import ManHinh from "@/1-giao-dien/trang/don-hang-in";
import { DON_HANG_MAU, ID_DON_HANG_GIA_LAP } from "@/3-du-lieu/du-lieu-mau";

/** Hosting tĩnh cần biết trước danh sách địa chỉ — gộp cả id dự phòng cho đơn lập
 *  lúc đang chạy, nếu không thì in đơn vừa lập sẽ ra trang 404. */
export function generateStaticParams() {
  return [...DON_HANG_MAU.map((x) => x.id), ...ID_DON_HANG_GIA_LAP].map((id) => ({ id }));
}

export default function Trang() {
  return <ManHinh />;
}
