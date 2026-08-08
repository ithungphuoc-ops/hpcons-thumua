// Bảng chỉ đường — Next.js lấy tên thư mục làm địa chỉ URL nên file này phải ở đây.
// Toàn bộ code màn hình nằm ở: 1-giao-dien/trang/bao-gia-chi-tiet.tsx
import ManHinh from "@/1-giao-dien/trang/bao-gia-chi-tiet";
import { BAO_GIA_MAU, ID_BAO_GIA_GIA_LAP } from "@/3-du-lieu/du-lieu-mau";

/** Hosting tĩnh cần biết trước danh sách địa chỉ — sinh từ danh sách báo giá trong dữ liệu mẫu,
 *  CỘNG THÊM 12 địa chỉ dự phòng cho bảng báo giá tạo bằng kéo thả trên bảng quy trình.
 *  Khi nối Firestore thật sẽ bỏ hàm này và cho máy chủ dựng trang theo yêu cầu. */
export function generateStaticParams() {
  return [...BAO_GIA_MAU.map((x) => x.id), ...ID_BAO_GIA_GIA_LAP].map((id) => ({ id }));
}

export default function Trang() {
  return <ManHinh />;
}
