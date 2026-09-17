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
 * ★★ NÂNG 5 → 6 NGÀY 17/09/2026 THEO CHỈ ĐẠO SẾP: *"Đang chỉ cho tạo tối đa 4 báo giá NCC… E kiểm
 * tra xem nếu tăng được 5 NCC thì nâng hạng lên 5 nha"*.
 *
 * Bước ② giữ CHUNG một ngăn cho bản báo giá và bảng so sánh bắt buộc, nên số ô báo giá luôn là
 * `TOI_DA_TEP_MOI_BUOC - 1` (xem `TOI_DA_O_BAO_GIA` ở `2-quy-trinh/bao-gia-dinh-kem.ts`). Muốn 5
 * nhà cung cấp thì con số này phải là 6 — **không có cách nào tách riêng trần cho bước báo giá**:
 * tầng ghi đếm TỔNG tệp của ngăn, nên đặt trần riêng 5 mà không nâng trần ngăn là bản thứ 5 bị từ
 * chối, điều kiện chuyển bước không bao giờ thoả và phiếu **kẹt vĩnh viễn**.
 *
 * 📌 ĐÃ ĐO TRƯỚC KHI ĐỔI, con số 5 cũ **không phải chỉ đạo của ai**: chú thích cũ tự khai nó được
 * *"lấy đúng con số của khối bình luận (`khoi-trao-doi.tsx` → `TOI_DA_TEP = 5`)"*, tức chép từ hạn
 * mức tệp của ô bình luận — một con số kỹ thuật tự đặt. `git log -S` cũng không ra commit nào gắn
 * con số này với chỉ đạo Ban lãnh đạo. Nên nâng lên 6 không đạp lên quyết định nào.
 *
 * 📌 SỨC CHỨA KHÔNG PHẢI VẤN ĐỀ: nội dung tệp nằm ở kho tệp riêng (`kho-tep.ts`), document Firestore
 * chỉ giữ **mô tả** (~250–400 byte/tệp). Thêm 1 tệp mỗi bước cho cả 12 phiếu ≈ 30KB trên trần 1MB.
 *
 * 🔴 DÙNG LẠI HẰNG SỐ NÀY, ĐỪNG CHÉP CON SỐ. Hai chỗ giữ cùng một con số là sớm muộn lệch nhau,
 * mà lệch kiểu đó không có lỗi nào báo: ô nhập cho chọn 5 tệp còn tầng dữ liệu chặn ở 3, người
 * dùng chỉ thấy tệp "biến mất". Đúng ngày nâng con số này đã phải đi sửa **ba** chỗ chép cứng —
 * một trong đó là câu hiện thẳng ra màn cho Trưởng bộ phận đọc.
 *
 * ⚠️ Cỡ mỗi tệp vẫn dùng `CO_TOI_DA` chung của kho tệp (10MB), không đặt riêng.
 */
export const TOI_DA_TEP_MOI_BUOC = 6;
