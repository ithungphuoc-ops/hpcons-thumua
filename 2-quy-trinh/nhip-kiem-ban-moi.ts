// ============================================================
// NHỊP KIỂM "APP ĐÃ CÓ BẢN MỚI CHƯA" — HÀM THUẦN, GỌI THẬT ĐƯỢC
//
// 🔴 SINH RA TỪ MỘT SỰ CỐ THẬT, ĐO ĐƯỢC — 15 và 16/09/2026.
//
// Ngày 15/09 app dính một vòng lặp ghi vô tận. Vá xong, deploy xong, **vòng lặp vẫn chạy** —
// tới khi Sếp tắt hết máy trong phòng thì mới dừng. Lý do: trình duyệt của mỗi người vẫn đang
// chạy bản JavaScript tải về từ lúc họ mở trang, có khi từ hôm trước. Deploy không đẩy mã mới
// sang những tab đang mở.
//
// Hôm sau còn đo được bằng chứng cụ thể: ba đơn `DMH260011`, `DMH260012`, `DMH260013` lập ngày
// 16/09 mang dấu `qlkCtrSyncStatus: "failed"` **không kèm mốc thời gian** — dấu vân tay của một
// bản app từ TRƯỚC 14/09 (mốc thời gian mới được thêm vào nhánh thất bại hôm đó). Tức là vẫn có
// người đang dùng bản cũ, và máy đó **ghi đè được lên dữ liệu của bản mới**.
//
// ⚠️ TỆP NÀY KHÔNG ĐƯỢC `import` GÌ CẢ. Nó phải dựng được độc lập bằng esbuild cho
// `kiem-luat-dung-chung.mjs`, và phải là hàm thuần — không đọc `Date.now()`, không đụng
// `window`, không đụng React. Mọi thứ "bây giờ là mấy giờ" đều truyền vào qua tham số.
// Chỉ đạo Sếp 15/09/2026: *"luật nằm trong hook thì không bài kiểm nào bắt được"*.
// ============================================================

/**
 * ★ BAO LÂU HỎI MÁY CHỦ MỘT LẦN — 3 phút.
 *
 * Vì sao 3 phút chứ không phải 30 giây hay 30 phút:
 *   · Câu hỏi này **rất rẻ** — một `GET` trả về đúng một chuỗi, không đụng Firestore, không đọc
 *     dữ liệu nghiệp vụ. Nên không cần tiết kiệm tới mức 30 phút.
 *   · Nhưng nó vẫn là một lượt gọi hàm trên Vercel, nhân với số người và số giờ mở app. Tài khoản
 *     đã vượt hạn mức CPU ngày 16/09 (8h32m so với trần 4h), nên đừng hào phóng.
 *   · 3 phút nghĩa là chậm nhất 3 phút sau khi deploy là người dùng biết. Đủ nhanh cho một bản vá
 *     khẩn, và đủ thưa để không đáng kể về chi phí.
 */
export const CHU_KY_HOI_BAN_MOI_MS = 180_000;

/**
 * ★ BAO LÂU THÌ DẢI BÁO CHUYỂN SANG GIỌNG GẤP — 30 phút.
 *
 * 🔴 VÌ SAO CẦN HAI MỨC: một dải báo màu vàng nhã nhặn rất dễ bị lờ đi, mà lờ đi thì đúng bằng
 * không làm gì cả — máy đó vẫn chạy mã cũ và vẫn phá dữ liệu được. Sau nửa tiếng vẫn chưa tải
 * lại thì đổi giọng, vì lúc đó chuyện đã không còn là "tiện thì tải".
 *
 * 📌 KHÔNG tự tải lại thay người dùng — xem `ChiBaoBanMoi` để biết vì sao.
 */
export const HAN_NHAC_GAP_MS = 1_800_000;

/**
 * Máy chủ có bản khác bản máy này đang chạy không.
 *
 * 🔴 SO SÁNH VỚI BẢN ĐỌC ĐƯỢC LẦN ĐẦU, KHÔNG PHẢI VỚI MỘT HẰNG SỐ LÚC DỰNG. Đây là điểm dễ làm
 * sai nhất: nếu nhúng mã bản vào lúc dựng (`process.env...` đọc ở phía client) thì mỗi lần dựng
 * lại là một con số mới, kể cả khi mã nguồn không đổi — và mọi máy sẽ bị báo "có bản mới" oan.
 * Cách đúng: lúc mở trang, hỏi máy chủ một lần và **nhớ lấy câu trả lời đó** làm mốc. Về sau chỉ
 * so với mốc ấy.
 *
 * ⚠️ `banDangChay` rỗng nghĩa là CHƯA hỏi được lần đầu (mạng hỏng, máy chủ bận). Lúc đó **không
 * được coi là có bản mới** — thiếu thông tin thì im lặng, đừng bày cảnh báo giả. Cùng luật
 * "thiếu thông tin thì cho mức thấp nhất" ở CLAUDE.md §3.6c.
 *
 * ⚠️ `banTrenMayChu` rỗng cũng vậy: lần hỏi đó hỏng, không phải bằng chứng có bản mới.
 */
export function coBanMoi(banDangChay: string, banTrenMayChu: string): boolean {
  if (!banDangChay.trim()) return false;
  if (!banTrenMayChu.trim()) return false;
  return banDangChay !== banTrenMayChu;
}

/**
 * Đã tới lúc đổi dải báo sang giọng gấp chưa.
 *
 * @param luucPhatHien Mốc `Date.now()` lúc PHÁT HIỆN ra bản mới (không phải lúc deploy).
 * @param bayGio       Mốc `Date.now()` hiện tại.
 *
 * 📌 Đếm từ lúc phát hiện chứ không từ lúc deploy: người mới mở app sau khi deploy 2 tiếng thì
 * với họ tin này vẫn là mới tinh, không có lý gì quát họ ngay từ giây đầu.
 */
export function daDenLucNhacGap(luucPhatHien: number, bayGio: number): boolean {
  if (!Number.isFinite(luucPhatHien) || !Number.isFinite(bayGio)) return false;
  if (luucPhatHien <= 0) return false;
  return bayGio - luucPhatHien >= HAN_NHAC_GAP_MS;
}

/**
 * Câu nhắc hiện trên dải báo, theo mức gấp.
 *
 * 🔴 HAI CÂU KHÁC HẲN NHAU VỀ GIỌNG, KHÔNG PHẢI CÙNG MỘT CÂU TÔ ĐẬM HƠN. Mức thường chỉ mời;
 * mức gấp phải nói **hậu quả**, vì tới lúc đó lời mời đã thất bại một lần rồi.
 *
 * ⚠️ ĐỪNG viết "phiên bản", "deploy", "build" vào câu cho người dùng. Người dùng là nhân viên
 * thu mua và thủ kho — họ cần biết **phải làm gì**, không cần biết chuyện mã nguồn.
 */
export function cauNhacBanMoi(gap: boolean): { tieuDe: string; chiDan: string } {
  return gap
    ? {
        tieuDe: "Bản đang dùng đã cũ",
        chiDan:
          "Máy này vẫn chạy bản cũ nên có thể ghi sai dữ liệu chung của cả phòng. " +
          "Tải lại trang giúp — việc đang làm không mất, chỉ mất nội dung đang gõ dở.",
      }
    : {
        tieuDe: "Đã có bản mới",
        chiDan: "Tải lại trang để dùng bản mới nhất.",
      };
}
