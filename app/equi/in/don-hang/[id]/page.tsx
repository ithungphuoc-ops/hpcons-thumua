// Bảng chỉ đường cho KHO EQUI (Sếp duyệt demo 14/10/2026) — địa chỉ /equi/... dùng đúng màn hình của
// kho thường nhưng provider dữ liệu trỏ sang tài liệu EQUI (xem 1-giao-dien/khung-app/chon-kho-theo-duong-dan.tsx).
// ⚠️ NGOÀI nhóm (app) là CỐ Ý, giống app/in/: trang in không có thanh bên / thanh trên.
import ManHinh from "@/1-giao-dien/trang/don-hang-in";

export function generateStaticParams() {
  return [];
}

export default function Trang() {
  return <ManHinh />;
}
