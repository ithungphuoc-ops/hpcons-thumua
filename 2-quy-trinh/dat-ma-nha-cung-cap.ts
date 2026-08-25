// ============================================================
// SINH MÃ NHÀ CUNG CẤP — `NC[STT 4 chữ số]`, ví dụ `NC0001`
//
// 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 25/08/2026: *"Mã NCC sẽ tự động sinh ra sau khi nhập thông tin NCC.
//    Theo cấu trúc: NC+0000. Và mục này sẽ không được sửa"*.
//
// ⚠️ ĐÂY LÀ MÃ DANH MỤC NỘI BỘ, KHÔNG PHẢI MÃ HỒ SƠ theo Thông báo 09/2026/TB-HPCS. Quy tắc
//    "không tự đặt mã loại mới" ở CLAUDE.md mục 3.1 nói về **mã hồ sơ** (`HDXD`, `PO`, `BBNT`…)
//    — những mã in lên chứng từ và phải được đơn vị quản lý hệ thống phê duyệt. Mã nhà cung cấp
//    chỉ để tra danh mục trong app, không in lên tờ đơn gửi ra ngoài. Cấu trúc do Ban lãnh đạo
//    chỉ định trực tiếp.
//
// 📌 NHÀ CUNG CẤP CŨ GIỮ NGUYÊN MÃ. Danh mục hiện có mã dạng `NCC0001` (ba chữ C); hàm này chỉ
//    cấp mã cho bản ghi MỚI. Hai dãy mã cùng tồn tại là chuyện bình thường của việc đổi hệ mã —
//    đổi mã của nhà cung cấp đã có đơn hàng là làm mất đường tra cứu của chứng từ đã phát hành.
//
// 🔴 VÌ SAO `^NC(\d+)$` KHÔNG ĂN NHẦM `NCC0001`: sau `NC` phải là CHỮ SỐ ngay, mà `NCC0001` có
//    chữ `C` thứ ba nên không khớp. Nhờ vậy hai dãy mã đếm độc lập, và dãy mới bắt đầu từ
//    `NC0001` chứ không nhảy theo dãy cũ. Vòng `while` chống trùng vẫn nhìn CẢ HAI dãy.
//
// Hàm ở đây là hàm THUẦN — không đụng giao diện, không đụng kho dữ liệu.
// ============================================================

/**
 * Tiền tố mã nhà cung cấp — một chỗ sửa duy nhất.
 *
 * 🔴 Đổi hằng số này là đổi ký hiệu của MỌI mã cấp về sau. Mã đã cấp không đổi theo (nó nằm
 * trong `NhaCungCap.maNCC`), nên sẽ có hai dãy cùng tồn tại — biết trước để không ngạc nhiên.
 */
export const TIEN_TO_NHA_CUNG_CAP = "NC";

/**
 * Số chữ số của phần STT. `0000` theo đúng chỉ đạo, tức tối đa 9.999 nhà cung cấp.
 *
 * ⚠️ Vượt 9.999 thì mã tự dài ra thành 5 chữ số (`padStart` không cắt bớt) — thà mã dài hơn
 * khuôn còn hơn cấp trùng mã. Không chặn ở đây vì chặn là app không thêm được nhà cung cấp.
 */
const SO_CHU_SO_STT = 4;

/**
 * Sinh mã nhà cung cấp tiếp theo.
 *
 * 🔴 LẤY SỐ LỚN NHẤT ĐÃ TỪNG DÙNG RỒI +1, **không đếm số bản ghi hiện có rồi +1**.
 * Đếm rồi +1 thì: thêm NC0001 · NC0002 · NC0003, xóa NC0002 → còn 2 bản ghi → bản tiếp theo lại
 * ra NC0003, trùng với bản đang tồn tại. Hai nhà cung cấp cùng mã là hỏng đường tra cứu: đơn
 * hàng lưu mã, tra ra nhầm bên bán, công nợ cộng nhầm.
 * (Đúng cái sai `dat-ten-de-nghi.ts` đã phải sửa 14/08/2026 và `dat-ma-don-hang.ts` tránh sẵn.)
 *
 * 📌 Danh mục nhà cung cấp CÓ chức năng xóa (`xoaNhaCungCap`), nên ca "xóa rồi thêm lại" là
 * chuyện có thật ở đây, không phải ca biên.
 *
 * @param maDaDung Mã của MỌI nhà cung cấp đang có — cả dãy cũ `NCC…` lẫn mã nhập tay, để vòng
 *                 `while` chống trùng nhìn được toàn bộ.
 */
export function maNhaCungCapTiepTheo(maDaDung: readonly string[]): string {
  /* Neo cả hai đầu (`^…$`): thiếu `$` thì `NC00012` cũng khớp và bị đọc thành 12, nên số lớn
     nhất tính sai và mã tiếp theo trùng. */
  const cungDay = new RegExp(`^${TIEN_TO_NHA_CUNG_CAP}(\\d+)$`);

  let lonNhat = 0;
  for (const ma of maDaDung) {
    const khop = cungDay.exec(ma.trim());
    if (khop) lonNhat = Math.max(lonNhat, Number(khop[1]));
  }

  /* So sánh KHÔNG phân biệt hoa thường: mã cũ nhập tay có thể là `nc0001`. Để nguyên chữ hoa
     rồi so thẳng thì `NC0001` lọt qua và thành mã thứ hai cùng nghĩa. */
  const daDung = new Set(maDaDung.map((m) => m.trim().toLowerCase()));
  let so = lonNhat + 1;
  const dungMa = (n: number) =>
    `${TIEN_TO_NHA_CUNG_CAP}${String(n).padStart(SO_CHU_SO_STT, "0")}`;
  let ma = dungMa(so);
  while (daDung.has(ma.toLowerCase())) {
    so += 1;
    ma = dungMa(so);
  }
  return ma;
}
