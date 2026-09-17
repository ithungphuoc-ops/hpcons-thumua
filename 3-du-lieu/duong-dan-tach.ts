// ============================================================
// TÊN COLLECTION CỦA CẤU TRÚC TÁCH — DÙNG CHUNG CHO CẢ TRÌNH DUYỆT LẪN MÁY CHỦ
//
// 🔴 TỆP NÀY KHÔNG ĐƯỢC `import` GÌ CẢ, và đó là toàn bộ lý do nó tồn tại.
//
// Trước 17/09/2026 bộ tên này nằm trong `3-du-lieu/kho-chung-tach.ts`. Nhưng tệp đó `import`
// `5-ket-noi/firebase-chung.ts` — tức SDK Firebase **bản trình duyệt**. Ba route máy chủ
// (`app/api/...`) chạy bằng Admin SDK và cũng cần đúng bộ tên này; import từ tệp kia là kéo cả
// SDK trình duyệt vào bundle máy chủ chỉ để lấy mấy chuỗi hằng — thừa, và là loại phụ thuộc
// chéo dễ đẻ lỗi lúc dựng.
//
// 👉 Tách riêng ra đây. Trình duyệt và máy chủ cùng đọc MỘT nguồn tên, không ai chép lại lần hai.
//
// ⚠️ ĐÂY LÀ CHỐT AN TOÀN THẬT: nếu hai bên có hai bản danh sách tên riêng, chỉ cần một bên sửa
// mà bên kia quên là **app ghi vào chỗ này rồi đọc ở chỗ khác** — dữ liệu không mất nhưng không
// ai thấy, và triệu chứng trông y hệt "mất dữ liệu". Một nguồn duy nhất thì không thể lệch.
// ============================================================

/**
 * ★ TÊN COLLECTION — LẤY ĐÚNG THEO `5-ket-noi/firestore.rules` ĐÃ THIẾT KẾ SẴN TRONG REPO.
 *
 * 🔴 ĐỪNG TỰ ĐẶT TÊN KIỂU KHÁC (`tm-don-hang` gạch ngang chẳng hạn). Rules đã viết theo đúng mấy
 * cái tên này; lệch một chữ là Firestore từ chối mọi lượt ghi — hỏng ngay nhưng rất khó đoán ra,
 * vì thông báo chỉ là "thiếu quyền" chứ không nói tên sai.
 *
 * ⚠️ TÔI ĐÃ SUÝT ĐẶT SAI. Ngày 16/09/2026 tôi tự nghĩ ra bộ tên gạch ngang rồi mới đọc thấy
 * `firestore.rules` có sẵn thiết kế. Đọc trước, đừng sáng tác.
 *
 * 📌 `tm_caidat` KHÔNG có trong rules gốc — thiết kế đó chưa tính tới cấu hình quy trình. Đặt theo
 * cùng lối cho nhất quán; rules cho nó phải thêm tay lúc deploy.
 *
 * ⚠️ `tm_caidat` là NGOẠI LỆ CỐ Ý, chỉ một tài liệu tên `chung`. Cấu hình quy trình, danh mục nhà
 * cung cấp, danh mục thủ kho — mỗi thứ chỉ có đúng một bản cho cả công ty, không phải chứng từ.
 */
export const DUONG_DAN_TACH = {
  deNghi: "tm_denghi",
  donHang: "tm_donhang",
  giaDonHang: "tm_donhang_gia",
  baoGia: "tm_baogia",
  thongBao: "tm_thongbao",
  /** Subcollection của `tm_donhang/{poId}` — Sếp chốt 16/09/2026, xem quyết định ③ đầu tệp. */
  phieuNhanTrongDon: "nhanhang",
  caiDat: "tm_caidat",
  tepCaiDat: "chung",
} as const;
