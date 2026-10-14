// Bảng chỉ đường cho KHO EQUI (Sếp duyệt demo 14/10/2026) — địa chỉ /equi/... dùng đúng màn hình của
// kho thường nhưng provider dữ liệu trỏ sang tài liệu EQUI (xem 1-giao-dien/khung-app/chon-kho-theo-duong-dan.tsx).
import ManHinh from "@/1-giao-dien/trang/don-hang-danh-sach";

/* Không export thẳng: màn nhận prop `boLocKho` (nút lọc) mà route Next không được có prop. */
export default function Trang() {
  return <ManHinh />;
}
