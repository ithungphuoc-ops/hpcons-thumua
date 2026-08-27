// ============================================================
// VĂN BẢN ĐIỀU KHOẢN CHUẨN IN TRÊN ĐƠN MUA HÀNG
//
// ★ Ban lãnh đạo 22/08/2026: *"mục đơn PO này hãy tạo thành trường có thể sửa được nội dung"*.
//
// 🔴 VÌ SAO PHẢI CÓ FILE RIÊNG: từ nay khối điều khoản có HAI nguồn — bản chuẩn (file này) và
// bản người lập tự sửa (lưu trên từng đơn). Nếu để chữ nằm rải trong tờ in và trong ô nhập của
// form thì hai chỗ sẽ lệch nhau ngay lần sửa đầu, và không ai biết đâu mới là bản công ty chốt.
// Một bản chuẩn, một chỗ duy nhất.
//
// ⚠️ ĐIỀU CẦN BIẾT KHI CHO SỬA: ô L32/L33 của biểu mẫu `PO - DEMO 130826.xlsx` ghi **"Cố định
// không sửa"**. Nay mở cho sửa theo chỉ đạo, nên mỗi đơn có thể mang một bản điều khoản khác
// nhau. Bù lại: đơn nào KHÔNG sửa thì in đúng bản chuẩn dưới đây, và tờ in luôn nói rõ khi bản
// điều khoản đã bị sửa khác bản chuẩn — để lúc đối chiếu hồ sơ còn nhận ra.
//
// 📌 Sửa văn bản chuẩn ở đây là đổi cho MỌI ĐƠN LẬP TỪ NAY (đơn cũ đã lưu bản riêng thì giữ bản
// của nó). Đó là chủ ý: cập nhật điều khoản công ty không được làm sai lệch chứng từ đã phát hành.
// ============================================================

/**
 * Khối "Phương thức giao hàng" — in trên MỌI mẫu đơn.
 *
 * Quy ước trình bày, cả tờ in và ô nhập đều theo:
 *   · dòng kết thúc bằng dấu hai chấm  → tiêu đề, in đậm
 *   · dòng trống                        → tách nhóm, tạo khoảng thở
 *   · các dòng khác                     → in nguyên văn
 *
 * ⚠️ Giữ nguyên các chỗ bỏ trống `……` — đó là chỗ người lập điền theo từng đơn (số ngày khiếu
 * nại, phạm vi bốc xếp). Trước đây chúng in ra dấu chấm lửng trơ vì không có đường nào để điền.
 */
export const DIEU_KHOAN_GIAO_HANG_CHUAN = `Phương thức giao hàng:
- Bên bán chịu trách nhiệm: vận chuyển, cẩu hạ hàng, bốc xếp 1 đầu / 2 đầu, quấn PE sản phẩm ….
- Hàng hóa phải đảm bảo: đúng chủng loại, quy cách, hàng mới 100%, có chứng chỉ CO/CQ, bao bì nguyên vẹn / không trầy xước, cong vênh, …

- Khi giao hàng, hai bên phải tiến hành kiểm đếm thực tế về số lượng, quy cách, nhãn hiệu và tình trạng hàng hóa và lập Biên bản giao nhận có chữ ký đại diện hai bên.
- Biên bản giao nhận là căn cứ xác nhận việc giao nhận hàng hóa. Mọi khiếu nại về sai lệch số lượng phải được ghi nhận tại thời điểm giao nhận.
- Trong vòng …… ngày kể từ ngày nhận hàng, nếu phát hiện hàng hóa không đạt chất lượng hoặc không đúng quy cách, Bên Mua phải thông báo bằng văn bản cho Bên Bán để kiểm tra và xử lý.
- Nếu xác định hàng hóa không đạt yêu cầu do lỗi của Bên Bán, Bên Bán phải thu hồi, đổi trả hàng và chịu toàn bộ chi phí phát sinh trong vòng 07 ngày. Ngược lại Bên Mua phải chịu toàn bộ chi phí đi lại phát sinh của Bên Bán.
- Hàng hóa bị lỗi phải được niêm phong và tách riêng, không đưa vào sử dụng cho đến khi hai bên thống nhất phương án xử lý.`;

/**
 * Hai câu cam kết cuối tờ — CHỈ in ở mẫu *Thỏa thuận mua bán*.
 *
 * 🔴 Đừng in vào mẫu *theo hợp đồng*: chúng nói "đơn này có giá trị như hợp đồng", mà đơn đặt
 * theo hợp đồng đã ký thì hợp đồng mới là văn bản gốc — in cả hai là hai văn bản cùng nhận vai
 * trò hợp đồng cho một giao dịch.
 */
export const CAM_KET_THOA_THUAN_CHUAN = `Các nội dung chưa được quy định tại Đơn mua hàng / Thỏa thuận mua bán này được thực hiện theo thỏa thuận giữa hai bên và quy định pháp luật hiện hành.
Đơn đặt hàng này có giá trị như hợp đồng mua bán giữa hai bên khi được ký xác nhận.`;

/**
 * ★★ CÂU KẾT CỦA MẪU **PO-01 — theo hợp đồng** (Ban lãnh đạo 26/08/2026, gửi kèm biểu mẫu chuẩn).
 *
 * 🔴 TRƯỚC ĐÂY MẪU PO-01 KHÔNG CÓ CÂU KẾT NÀO — thiếu hẳn so với giấy. Tờ đơn đặt theo hợp đồng
 * phải nói rõ những gì nó không nêu thì áp theo hợp đồng gốc; không có câu đó thì hai bên tranh
 * cãi về một điều khoản không có trên tờ đơn sẽ không biết căn cứ vào đâu.
 *
 * ⚠️ KHÁC HẲN `CAM_KET_THOA_THUAN_CHUAN`, ĐỪNG DÙNG LẪN: câu kia nói *"đơn này có giá trị như hợp
 * đồng"* (đơn LÀ hợp đồng), câu này nói *"áp dụng theo hợp đồng trên"* (đơn PHỤ THUỘC hợp đồng).
 * In nhầm là đảo ngược vai trò pháp lý của tờ chứng từ.
 */
export const CAM_KET_THEO_HOP_DONG_CHUAN =
  "Các điều khoản chưa nêu trong ĐMH này được áp dụng theo hợp đồng trên.";

/**
 * ★ Chữ MẪU IN SẴN của hai dòng điều khoản cuối tờ — chép đúng biểu mẫu chuẩn 26/08/2026.
 *
 * 📌 Đây là phần chữ có SẴN TRÊN GIẤY, in ra kể cả khi người lập chưa điền gì — khác với giá trị
 * người lập nhập. Trước đây tờ in chỉ in giá trị, nên đơn chưa điền ra một dòng cụt "Điều khoản
 * thanh toán: —", mất hẳn phần chữ mẫu mà nhà cung cấp cần đọc.
 */
export const GOI_Y_DIEU_KHOAN_THANH_TOAN =
  "kể từ khi Bên Bán giao đủ: số lượng hàng hóa (biên bản xác nhận), COCQ và Hóa đơn";
export const GOI_Y_DIEU_KHOAN_KHAC =
  "(bổ sung ghi chú về đơn giá, thông số kỹ thuật, bảo hành ….)";

/**
 * Cắt một khối văn bản thành từng dòng để in.
 *
 * 🔴 Dùng CHUNG cho tờ in A4 và mọi chỗ hiển thị khác — nếu mỗi nơi tự tách chuỗi theo cách
 * riêng thì cùng một đơn in ra hai kiểu trình bày.
 *
 * ⚠️ `\r\n` phải xử được: người lập có thể dán văn bản từ Word, và Windows kết thúc dòng bằng
 * `\r\n`. Không cắt `\r` thì dòng nào cũng dính một ký tự vô hình ở cuối, và phép kiểm "kết thúc
 * bằng dấu hai chấm" hỏng — tiêu đề mất chữ đậm mà không hiểu vì sao.
 */
export function tachDongDieuKhoan(
  vanBan: string,
): { chu: string; laTieuDe: boolean; laDongTrong: boolean }[] {
  return vanBan.split(/\r?\n/).map((d) => {
    const chu = d.trimEnd();
    return {
      chu,
      laTieuDe: chu.trim().endsWith(":"),
      laDongTrong: chu.trim() === "",
    };
  });
}

/** Bản điều khoản của đơn này có khác bản chuẩn không — để tờ in nói rõ. */
export function daSuaKhacBanChuan(vanBan: string | undefined, banChuan: string): boolean {
  if (vanBan === undefined) return false;
  const gon = (s: string) => s.replace(/\r?\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  return gon(vanBan) !== gon(banChuan);
}
