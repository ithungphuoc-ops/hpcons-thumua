// ============================================================
// THỨ TỰ HIỂN THỊ HỒ SƠ — VIỆC CỦA MÌNH LÊN TRƯỚC
//
// 🔴 Ban lãnh đạo 15/08/2026: *"ở các tài khoản nhân viên, hãy ưu tiên hiển thị các công việc
// của nhân viên đó đảm nhiệm trước"*. Trước đó nhân viên mở bảng quy trình lên thì thẻ của
// đồng nghiệp nằm chen giữa, phải đọc hết cột mới thấy phần việc của mình.
//
// ⚠️ FILE NÀY SINH RA ĐỂ CHỐNG LỆCH. Cùng một luật đang cần cho BỐN màn hình (bảng quy trình,
// danh sách đề nghị, việc của tôi, theo dõi). Chép tay bốn lần thì sớm muộn mỗi màn xếp một
// kiểu, và người dùng chuyển qua lại giữa hai màn sẽ tưởng hồ sơ biến mất.
//
// 👉 Hàm ở đây là HÀM THUẦN. File giao diện chỉ được GỌI, không được tự viết lại điều kiện so
// sánh (quy ước CLAUDE.md mục 3.4b).
//
// 📌 KHÔNG import `giai-doan-mua-hang.ts` — file đó import ngược lại file này để dùng cho bảng
// quy trình, thêm chiều còn lại là vòng phụ thuộc.
// ============================================================

import type { DeNghiMuaHang, DonDatHang } from "@/3-du-lieu/kieu-du-lieu";
import { duocChiaViec } from "@/4-phan-quyen/quyen-theo-ho-so";

/**
 * Đề nghị này có phải việc của người đó không.
 *
 * 🔴 SO BẰNG UID, TUYỆT ĐỐI KHÔNG SO BẰNG TÊN. Công ty hoàn toàn có thể có hai người trùng
 * tên, mà so tên thì họ thấy việc của nhau nổi lên đầu bảng và không có dấu hiệu nào để phát
 * hiện. Dự án đã dính đúng kiểu lỗi này một lần ở dòng "Gửi tới" của thông báo.
 *
 * 📌 Gọi lại `duocChiaViec` bên `4-phan-quyen` chứ không viết lại điều kiện — "ai đang giữ
 * việc này" là câu hỏi về phân quyền, luật của nó phải nằm một chỗ.
 */
export function laViecCuaToi(deNghi: DeNghiMuaHang, uid: string): boolean {
  // Vai trò KHÔNG_QUYỀN có uid rỗng — không được coi mọi hồ sơ chưa phân bổ là "việc của họ".
  if (!uid) return false;
  return duocChiaViec(deNghi, uid);
}

/**
 * THỨ TỰ ĐỀ NGHỊ trong mọi danh sách. Truyền `uid` để đẩy việc của người đó lên đầu.
 *
 * Thứ tự xét:
 *   1. Việc MÌNH phụ trách lên trước (bỏ qua nếu không biết `uid`, VD trang in).
 *   2. Ngày cần hàng gần nhất — việc gấp nổi lên trên, giữ nguyên thói quen đọc bảng cũ.
 *   3. Mã hồ sơ, để PHÁ HÒA.
 *
 * ⚠️ BƯỚC 3 KHÔNG THỪA. Nhiều đề nghị cùng `ngayCanHang` là chuyện thường (cùng một đợt
 * duyệt). Thiếu tiêu chí phá hòa thì thứ tự phụ thuộc thuật toán sort của trình duyệt, và mỗi
 * lần dữ liệu đổi một chút là các thẻ ngang hàng lại đảo chỗ — người dùng đang nhìn thì thẻ
 * tự nhảy, tưởng mình bấm nhầm.
 *
 * 📌 `ngayCanHang` là chuỗi ISO `YYYY-MM-DD` nên so chuỗi là đủ và đúng thứ tự thời gian —
 * rẻ hơn dựng `new Date()` cho mỗi lần so sánh bên trong `.sort()`.
 *
 * ⚠️ Bên gọi nhớ `[...ds].sort(...)`: `sort` đổi mảng tại chỗ, sort thẳng mảng lấy từ
 * `useDuLieu()` là đảo luôn dữ liệu gốc mà mọi màn khác đang dùng chung.
 */
export function soSanhDeNghiUuTien(
  a: DeNghiMuaHang,
  b: DeNghiMuaHang,
  uid?: string,
): number {
  if (uid) {
    const cuaA = laViecCuaToi(a, uid) ? 0 : 1;
    const cuaB = laViecCuaToi(b, uid) ? 0 : 1;
    if (cuaA !== cuaB) return cuaA - cuaB;
  }
  if (a.ngayCanHang !== b.ngayCanHang) return a.ngayCanHang < b.ngayCanHang ? -1 : 1;
  return a.code.localeCompare(b.code, "vi");
}

/**
 * THỨ TỰ ĐƠN ĐẶT HÀNG — cùng tinh thần với đề nghị, nhưng mốc thời gian là ngày giao dự kiến.
 *
 * 📌 `nguoiPhuTrachUid` của PO là trường bắt buộc (một đơn chỉ một người phụ trách), nên ở đây
 * so trực tiếp chứ không cần duyệt qua từng dòng như đề nghị.
 */
export function soSanhDonHangUuTien(a: DonDatHang, b: DonDatHang, uid?: string): number {
  if (uid) {
    const cuaA = a.nguoiPhuTrachUid === uid ? 0 : 1;
    const cuaB = b.nguoiPhuTrachUid === uid ? 0 : 1;
    if (cuaA !== cuaB) return cuaA - cuaB;
  }
  if (a.ngayGiaoDuKien !== b.ngayGiaoDuKien) return a.ngayGiaoDuKien < b.ngayGiaoDuKien ? -1 : 1;
  return a.code.localeCompare(b.code, "vi");
}
