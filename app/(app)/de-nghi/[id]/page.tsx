// Bảng chỉ đường — Next.js lấy tên thư mục làm địa chỉ URL nên file này phải ở đây.
// Toàn bộ code màn hình nằm ở: 1-giao-dien/trang/de-nghi-chi-tiet.tsx
import ManHinh from "@/1-giao-dien/trang/de-nghi-chi-tiet";
import { DE_NGHI_MAU, ID_DE_NGHI_GIA_LAP } from "@/3-du-lieu/du-lieu-mau";

/** Hosting tĩnh cần biết trước danh sách địa chỉ — sinh từ danh sách đề nghị trong dữ liệu mẫu,
 *  CỘNG THÊM 12 địa chỉ dự phòng cho đề nghị lập bằng công cụ giả lập `/de-nghi/nhan-moi`.
 *  Không có phần dự phòng thì bấm vào thẻ vừa tạo sẽ ra trang 404.
 *  Khi nối Firestore thật sẽ bỏ hàm này và cho máy chủ dựng trang theo yêu cầu. */
export function generateStaticParams() {
  return [...DE_NGHI_MAU.map((x) => x.id), ...ID_DE_NGHI_GIA_LAP].map((id) => ({ id }));
}

export default function Trang() {
  return <ManHinh />;
}
