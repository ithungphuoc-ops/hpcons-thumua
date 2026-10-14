// Bảng chỉ đường cho KHO EQUI (Sếp duyệt demo 14/10/2026) — địa chỉ /equi/... dùng đúng màn hình của
// kho thường nhưng provider dữ liệu trỏ sang tài liệu EQUI (xem 1-giao-dien/khung-app/chon-kho-theo-duong-dan.tsx).
import ManHinh from "@/1-giao-dien/trang/theo-doi-chi-tiet";

/** Kho EQUI bắt đầu trống nên không có địa chỉ dựng sẵn; máy chủ dựng trang theo yêu cầu. */
export function generateStaticParams() {
  return [];
}

export default function Trang() {
  return <ManHinh />;
}
