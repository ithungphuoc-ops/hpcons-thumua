// ============================================================
// HẠN MỨC TỆP ĐÍNH KÈM — TÁCH RA TỆP RIÊNG ĐỂ CẮT VÒNG TRÒN IMPORT
//
// 🔴 VÌ SAO PHẢI TÁCH (24/08/2026): hằng số này trước đây nằm trong `3-du-lieu/kho-du-lieu.tsx`,
// mà `kho-du-lieu.tsx` là một React context — nó `import` cả tầng quy trình. Còn
// `2-quy-trinh/bao-gia-dinh-kem.ts` lại phải `import` hằng số này từ `kho-du-lieu`, tạo thành
// vòng tròn:
//
//     kho-du-lieu.tsx  →  giai-doan-mua-hang.ts
//     bao-gia-dinh-kem.ts  →  kho-du-lieu.tsx
//
// Hậu quả THẬT, không phải lo xa: vì vòng tròn đó mà `kho-du-lieu.tsx` **không thể** gọi
// `vuongMacTrinhXetDuyet`. Chú thích đầu `bao-gia-dinh-kem.ts` từ lâu ghi luật số bản báo giá
// được hỏi ở BA nơi, trong đó *"③ tầng ghi (chặn thật, vì nút có thể bị đi vòng)"* — nhưng lớp ③
// **chưa bao giờ tồn tại**. Luật sống hoàn toàn ở tầng giao diện suốt nhiều ngày, và đúng như
// chú thích lo, nút đã bị đi vòng thật: kéo thả lách được luật "đủ 3 bản báo giá".
//
// 📌 Một tệp hằng số KHÔNG import gì cả thì ai cũng dùng được mà không tạo phụ thuộc vòng.
// ============================================================

/**
 * Số tệp tối đa đính kèm cho MỘT BƯỚC của đề nghị.
 *
 * 📌 Lấy đúng con số của khối bình luận (`khoi-trao-doi.tsx` → `TOI_DA_TEP = 5`): đủ cho một bộ
 * ảnh chụp chứng từ mà không làm hồ sơ phình. Cỡ mỗi tệp dùng `CO_TOI_DA` chung của kho tệp
 * (10MB), không đặt riêng.
 *
 * 🔴 DÙNG LẠI HẰNG SỐ NÀY, ĐỪNG CHÉP CON SỐ. Hai chỗ giữ cùng một con số là sớm muộn lệch nhau,
 * mà lệch kiểu đó không có lỗi nào báo: ô nhập cho chọn 5 tệp còn tầng dữ liệu chặn ở 3, người
 * dùng chỉ thấy tệp "biến mất".
 */
export const TOI_DA_TEP_MOI_BUOC = 5;
