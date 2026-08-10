// Bảng chỉ đường — Next.js lấy tên thư mục làm địa chỉ URL nên file này phải ở đây.
// Toàn bộ code màn hình nằm ở: 1-giao-dien/trang/don-hang-chi-tiet.tsx
import ManHinh from "@/1-giao-dien/trang/don-hang-chi-tiet";
import { DON_HANG_MAU, ID_DON_HANG_GIA_LAP } from "@/3-du-lieu/du-lieu-mau";

/**
 * Hosting tĩnh cần biết trước danh sách địa chỉ.
 *
 * 🔴 Phải gộp CẢ `ID_DON_HANG_GIA_LAP` — id dự phòng cho đơn lập lúc đang chạy.
 * Chỉ sinh từ dữ liệu mẫu thì đơn vừa lập bấm vào là ra trang 404.
 *
 * Khi nối Firestore thật sẽ bỏ hàm này và cho máy chủ dựng trang theo yêu cầu.
 */
export function generateStaticParams() {
  return [...DON_HANG_MAU.map((x) => x.id), ...ID_DON_HANG_GIA_LAP].map((id) => ({ id }));
}

export default function Trang() {
  return <ManHinh />;
}
