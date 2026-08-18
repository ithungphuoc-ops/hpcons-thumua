// Bảng chỉ đường — Next.js lấy tên thư mục làm địa chỉ URL nên file này phải ở đây.
// Toàn bộ code màn hình nằm ở: 1-giao-dien/trang/don-hang-mau-in.tsx
//
// ⚠️ Đặt NGOÀI nhóm (app) là CỐ Ý: trang in không được có thanh bên và thanh trên.
// Provider dữ liệu nằm ở app/layout.tsx (gốc) nên trang này vẫn đọc được người dùng và quyền.
//
// 🔴 ĐỊA CHỈ CỐ ĐỊNH, KHÔNG CÓ THAM SỐ `[id]` — và đó chính là lý do trang này tồn tại.
// Bản mẫu đơn mua hàng CHƯA ĐƯỢC LƯU (chỉ đạo Ban lãnh đạo 18/08/2026: *"chỉ cần tạo mẫu PO
// thôi, chưa cần lưu"*) nên không có id nào để tra. Mà `/in/don-hang/[id]` là trang tĩnh, chỉ
// sinh sẵn cho danh sách id khai trong `generateStaticParams` — bịa một id tạm là ra 404.
// Vì không có tham số nên trang này KHÔNG cần `generateStaticParams`.
//
// Dữ liệu đi từ form sang đây qua kho tạm: 3-du-lieu/ban-mau-don-mua-hang.ts
import ManHinh from "@/1-giao-dien/trang/don-hang-mau-in";

export default function Trang() {
  return <ManHinh />;
}
