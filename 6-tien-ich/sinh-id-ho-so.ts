// ============================================================
// SINH ID KỸ THUẬT CHO CHỨNG TỪ MỚI
//
// ★ Ban lãnh đạo 22/08/2026: *"mở khoá chỗ này"* — app đang chặn ở hồ sơ báo giá thứ 13 với câu
// *"Bản chạy thử chỉ giữ được 12 hồ sơ báo giá"*.
//
// 🔴 VÌ SAO TRƯỚC ĐÂY PHẢI KHAI TRƯỚC 12 ID: app từng xuất tĩnh (`output: "export"`), nên mọi
// trang có tham số `[id]` phải được sinh sẵn lúc build qua `generateStaticParams` — id không nằm
// trong danh sách khai trước là mở ra 404. Vì vậy `du-lieu-mau.ts` khai sẵn `rfq-thu-01…12`.
//
// ✅ LÝ DO ĐÓ ĐÃ HẾT: `output: "export"` bị bỏ ngày 20/08/2026 (app cần route máy chủ cho SSO),
// nên Next.js dựng trang theo yêu cầu. Bằng chứng chạy thật: đề nghị do App Request đẩy sang mang
// id dạng UUID (`553ad264-100a-…`) — hoàn toàn ngoài danh sách khai trước — mà vẫn mở được.
// Riêng bảng báo giá thì còn dễ hơn: từ 20/08/2026 nó **không còn trang riêng nào**, chỉ hiện
// trong khối bước ở trang chi tiết đề nghị.
//
// 🔴 ĐÒI HỎI THẬT SỰ CỦA ID: không trùng nhau, kể cả khi HAI NGƯỜI TẠO CÙNG LÚC trên hai máy —
// cả phòng đang dùng chung một document Firestore, nên hai id trùng là một hồ sơ đè hồ sơ kia.
// Đếm số hồ sơ đang có rồi +1 KHÔNG đủ (đã có bài học ở `maBanSaoTiepTheo`): xóa một hồ sơ giữa
// dãy là số tiếp theo trùng với hồ sơ đang tồn tại.
// ============================================================

/**
 * Sinh một id kỹ thuật mới, không trùng.
 *
 * 📌 `crypto.randomUUID()` là chuẩn của trình duyệt và Node ≥ 19 — đủ ngẫu nhiên để hai máy tạo
 * cùng lúc vẫn không trùng.
 *
 * ⚠️ Có nhánh dự phòng vì `crypto.randomUUID` chỉ tồn tại trên **ngữ cảnh bảo mật** (https hoặc
 * localhost). Bản thật chạy https nên luôn có, nhưng ai mở app qua địa chỉ IP nội bộ (http) thì
 * hàm đó `undefined` — thiếu nhánh dự phòng là app **chết ngay lúc lập hồ sơ**, đúng chỗ không
 * được phép chết. Nhánh dự phòng ghép thời điểm với hai lần random, đủ dùng cho vài chục hồ sơ
 * một ngày của một phòng.
 *
 * 🔴 KHÔNG dùng id này làm MÃ HỒ SƠ hiển thị. Mã hồ sơ bám Thông báo 09/2026 và do
 * `2-quy-trinh/dat-ma-don-hang.ts` / `dat-ten-de-nghi.ts` sinh ra. Đây chỉ là khóa kỹ thuật,
 * người dùng không bao giờ đọc tới.
 */
export function sinhIdHoSo(tienTo: string): string {
  const rieng =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random()
          .toString(36)
          .slice(2, 10)}`;
  return `${tienTo}-${rieng}`;
}
