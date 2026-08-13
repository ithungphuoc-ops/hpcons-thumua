// ============================================================
// LUẬT NHÂN BẢN / TÁCH ĐỀ NGHỊ
//
// 🔴 Ban lãnh đạo 13/08/2026: *"tên của đề xuất giữ nguyên chỉ thêm chữ copy phía sau, để
// sau này có thể tổng hợp lại các đề xuất con của cái đề xuất lớn đó"*.
//
// ⚠️ FILE NÀY SINH RA VÌ MỘT LỖI THẬT. Trước đó luật đặt tên nằm ở kho dữ liệu, còn hộp
// nhân bản tự ghép `${tên} (copy)` để hiện lên màn hình. Hai chỗ cùng tính một thứ nên
// lệch nhau: nhân bản từ một bản copy thì hộp báo *"... (copy) (copy)"* trong khi app lưu
// *"... (copy 2)"*. Người dùng đọc hộp rồi tin vào con số sai.
//
// 👉 Hàm ở đây là HÀM THUẦN, không đụng React. Mọi nơi cần biết tên bản sao hay quan hệ
// cha–con đều gọi qua đây — đừng tự tính lại ở file giao diện.
// ============================================================

import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * Phiếu GỐC ĐẦU TIÊN của một đề nghị.
 *
 * Nhân bản từ một bản copy vẫn trả về phiếu lớn ban đầu — quan hệ cha–con **chỉ một cấp**,
 * để mọi phần tách của cùng một đề xuất gom được bằng một phép lọc, không phải lần ngược
 * từng đời. Phiếu không phải bản sao thì chính nó là gốc.
 */
export function phieuGocCua(dn: DeNghiMuaHang, tatCa: DeNghiMuaHang[]): DeNghiMuaHang {
  if (!dn.deNghiGocId) return dn;
  return tatCa.find((d) => d.id === dn.deNghiGocId) ?? dn;
}

/** Các bản đã tách ra từ một phiếu gốc. Lọc theo id, KHÔNG theo tên. */
export function cacBanTachCua(gocId: string, tatCa: DeNghiMuaHang[]): DeNghiMuaHang[] {
  return tatCa.filter((d) => d.deNghiGocId === gocId);
}

/**
 * MÃ của bản sao sắp tạo ra khi nhân bản `dn` — ví dụ `260001-HPCS-PR-001 (copy)`.
 *
 * 🔴 Ban lãnh đạo 13/08/2026 nói rõ bằng ví dụ: *"ý a là 26001-HPCS-PR-001 (copy)"*. Tức
 * bản tách **giữ nguyên mã của đề xuất lớn**, chỉ thêm "(copy)" — nhìn mã là biết ngay nó
 * thuộc đề xuất nào, không cần mở ra tra. Đó chính là cách "tổng hợp lại các đề xuất con".
 *
 * ⚠️ KHÔNG cấp mã PR mới cho bản tách. Cấp mã mới (PR-002, PR-003…) là mỗi phần tách trông
 * như một đề nghị độc lập, và trên bảng quy trình không còn dấu hiệu nào nói chúng cùng
 * một gốc.
 *
 * 📌 Luôn bám mã của PHIẾU GỐC ĐẦU TIÊN, không nối vào mã phiếu đang nhân bản. Tách 3 lần
 * mà lần nào cũng nối thì bản thứ ba thành *"…PR-001 (copy) (copy) (copy)"*. Nay: bản đầu
 * "(copy)", các bản sau "(copy 2)", "(copy 3)"…
 */
export function maBanSaoTiepTheo(dn: DeNghiMuaHang, tatCa: DeNghiMuaHang[]): string {
  const goc = phieuGocCua(dn, tatCa);
  /**
   * ⚠️ ĐẾM KHÔNG ĐỦ, PHẢI DÒ CHO TỚI KHI KHÔNG TRÙNG.
   *
   * Đếm số bản đang có rồi +1 nghe hợp lý nhưng sai khi có bản bị xóa: còn "(copy)" và
   * "(copy 2)", xóa "(copy)" đi thì số bản còn 1 → bản mới lại mang tên "(copy 2)", **trùng
   * mã với bản đang tồn tại**. Hai hồ sơ cùng mã là chuyện không được phép xảy ra.
   */
  const daDung = new Set(tatCa.map((d) => d.code));
  let ma = `${goc.code} (copy)`;
  let lan = 1;
  while (daDung.has(ma)) {
    lan += 1;
    ma = `${goc.code} (copy ${lan})`;
  }
  return ma;
}
