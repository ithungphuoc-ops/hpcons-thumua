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
/**
 * 🔴🔴 HAI MẪU CÓ KHỐI ĐIỀU KHOẢN KHÁC NHAU — Ban lãnh đạo 26/08/2026: *"E làm form giống 100%
 * mẫu a gửi"*, kèm hai ảnh biểu mẫu chuẩn.
 *
 *   · **PO-02 (thỏa thuận)** — có ĐỦ: 2 dòng chung + **5 điều khoản** (khối nền vàng trên giấy)
 *   · **PO-01 (theo hợp đồng)** — CHỈ có **2 dòng chung**, KHÔNG có 5 điều khoản đó
 *
 * ⚠️ VÌ SAO KHÁC — không phải giấy in thiếu: 5 điều khoản kia nói về kiểm đếm, khiếu nại, đổi
 * trả, chi phí phát sinh. Với PO-01 thì **hợp đồng gốc đã quy định những việc đó**; in lại trên
 * đơn là hai văn bản cùng quy định một việc, và khi hai bản khác nhau thì không biết theo bản
 * nào. Đó cũng đúng tinh thần câu kết của PO-01: *"các điều khoản chưa nêu … áp dụng theo hợp
 * đồng trên"*.
 *
 * 🔴 TRƯỚC 26/08/2026 APP IN CHUNG MỘT BẢN cho cả hai mẫu — tức mọi đơn theo hợp đồng đều in
 * thừa 5 điều khoản. Đây là lệch NỘI DUNG PHÁP LÝ trên chứng từ gửi ra ngoài, không phải lệch
 * trình bày.
 */
const PHAN_CHUNG_GIAO_HANG = `Phương thức giao hàng:
- Bên bán chịu trách nhiệm: vận chuyển, cẩu hạ hàng, bốc xếp 1 đầu / 2 đầu, quấn PE sản phẩm ….
- Hàng hóa phải đảm bảo: đúng chủng loại, quy cách, hàng mới 100%, có chứng chỉ CO/CQ, bao bì nguyên vẹn / không trầy xước, cong vênh, …`;

/** Năm điều khoản của khối nền vàng — CHỈ có trên mẫu PO-02. */
const PHAN_RIENG_THOA_THUAN = `- Khi giao hàng, hai bên phải tiến hành kiểm đếm thực tế về số lượng, quy cách, nhãn hiệu và tình trạng hàng hóa và lập Biên bản giao nhận có chữ ký đại diện hai bên.
- Biên bản giao nhận là căn cứ xác nhận việc giao nhận hàng hóa. Mọi khiếu nại về sai lệch số lượng phải được ghi nhận tại thời điểm giao nhận.
- Trong vòng …… ngày kể từ ngày nhận hàng, nếu phát hiện hàng hóa không đạt chất lượng hoặc không đúng quy cách, Bên Mua phải thông báo bằng văn bản cho Bên Bán để kiểm tra và xử lý.
- Nếu xác định hàng hóa không đạt yêu cầu do lỗi của Bên Bán, Bên Bán phải thu hồi, đổi trả hàng và chịu toàn bộ chi phí phát sinh trong vòng 07 ngày. Ngược lại Bên Mua phải chịu toàn bộ chi phí đi lại phát sinh của Bên Bán.
- Hàng hóa bị lỗi phải được niêm phong và tách riêng, không đưa vào sử dụng cho đến khi hai bên thống nhất phương án xử lý.`;

/**
 * Bản chuẩn của mẫu **PO-02 — Đơn mua hàng kèm thỏa thuận**.
 *
 * ⚠️ GIỮ NGUYÊN TÊN HẰNG SỐ NÀY. Nó đang được dùng ở form lập đơn và ở phép so "đã sửa khác bản
 * chuẩn chưa"; đổi tên là phải sửa theo ở nhiều chỗ, mà giá trị thì không đổi.
 */
export const DIEU_KHOAN_GIAO_HANG_CHUAN = `${PHAN_CHUNG_GIAO_HANG}

${PHAN_RIENG_THOA_THUAN}`;

/** Bản chuẩn của mẫu **PO-01 — Đơn mua hàng theo hợp đồng**: chỉ hai dòng chung. */
export const DIEU_KHOAN_GIAO_HANG_THEO_HOP_DONG = PHAN_CHUNG_GIAO_HANG;

/**
 * ★ Bản chuẩn ĐÚNG THEO MẪU ĐANG CHỌN — dùng ở cả tờ in lẫn ô nhập của form.
 *
 * 🔴 MỘT CHỖ QUYẾT ĐỊNH DUY NHẤT. Nếu tờ in tự chọn một bản còn form chọn bản khác thì người lập
 * sửa điều khoản trên form mà tờ in ra nội dung khác — kiểu lệch không ai phát hiện cho tới lúc
 * đối chiếu chứng từ đã gửi đi.
 */
export function dieuKhoanGiaoHangChuanTheoMau(mau: "thoa_thuan" | "theo_hop_dong"): string {
  return mau === "theo_hop_dong"
    ? DIEU_KHOAN_GIAO_HANG_THEO_HOP_DONG
    : DIEU_KHOAN_GIAO_HANG_CHUAN;
}

/**
 * Hai câu cam kết cuối tờ — CHỈ in ở mẫu *Thỏa thuận mua bán*.
 *
 * 🔴 Đừng in vào mẫu *theo hợp đồng*: chúng nói "đơn này có giá trị như hợp đồng", mà đơn đặt
 * theo hợp đồng đã ký thì hợp đồng mới là văn bản gốc — in cả hai là hai văn bản cùng nhận vai
 * trò hợp đồng cho một giao dịch.
 *
 * 📌 GỌI TỜ CHỨNG TỪ LÀ **"ĐMH"** — Ban lãnh đạo 27/08/2026: *"Điều chỉnh ghi là ĐMH nhé"*.
 * Trước đó hai câu này gọi cùng một tờ giấy bằng HAI tên khác nhau (*"Đơn mua hàng"* ở câu trên,
 * *"Đơn đặt hàng"* ở câu dưới), mà mẫu PO-01 lại gọi là *"ĐMH"* — ba cách gọi cho một chứng từ.
 * Trên văn bản có giá trị như hợp đồng, tên gọi không nhất quán là chỗ để tranh cãi phạm vi áp
 * dụng: bên kia hỏi *"Đơn đặt hàng"* có phải chính tờ này không thì không có gì để trả lời.
 *
 * ⚠️ TIÊU ĐỀ TO GIỮA TỜ VẪN IN TÊN ĐẦY ĐỦ (`NHAN_MAU_PO[...].tieuDeIn`) — biểu mẫu chuẩn công ty
 * ghi vậy. Viết tắt chỉ dùng trong CÂU VĂN, sau khi tờ đã tự xưng tên đầy đủ ở đầu.
 */
export const CAM_KET_THOA_THUAN_CHUAN = `Các nội dung chưa được quy định tại ĐMH / Thỏa thuận mua bán này được thực hiện theo thỏa thuận giữa hai bên và quy định pháp luật hiện hành.
ĐMH này có giá trị như hợp đồng mua bán giữa hai bên khi được ký xác nhận.`;

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
 * ★★ DỰNG SẴN GHI CHÚ HỢP ĐỒNG cho ô "Theo hợp đồng" khi điền hộ từ phiếu đề nghị / dự án.
 *
 * 🔴 Ban lãnh đạo 27/08/2026: *"Thiếu ngày ký"*, khoanh ô đang hiện đúng mỗi mã `HDNT-HPC-THM`.
 *
 * VÌ SAO TRƯỚC ĐÓ THIẾU: phiếu đề nghị chỉ lưu **mã** hợp đồng (`maHopDongCDT`), KHÔNG có trường
 * ngày ký — nên app điền hộ được đúng phần nó biết. Người lập phải tự nhớ gõ thêm ngày, và
 * không có gì nhắc nên quên là chuyện đương nhiên.
 *
 * ✅ Nay điền sẵn CẢ KHUNG ngày ký. Người lập chỉ việc gõ số vào chỗ chấm — thấy ngay là còn
 * thiếu, thay vì phải nhớ ra là thiếu.
 *
 * ⚠️ KHÔNG PHẢI APP TỰ GHÉP KHI IN. Đây là chữ đặt sẵn TRONG Ô NHẬP, người lập xoá hoặc sửa
 * thoải mái — đúng chỉ đạo cùng ngày: *"Dòng theo hợp đồng sẽ nhập thủ công, e để sẵn ô để ghi
 * chú"*. Tờ in vẫn chép nguyên văn những gì trong ô, không thêm chữ nào.
 *
 * 📌 Để chỗ chấm chứ không để trống trơn: đơn ký ngoài hiện trường thì in ra vẫn có chỗ viết tay.
 *
 * 📌 MỘT CHỖ DUY NHẤT dựng chuỗi này. Form có BA đường điền hộ (từ phiếu đề nghị, khi dọn form,
 * khi chọn dự án) — mỗi chỗ tự ghép một kiểu là ba đơn ra ba cách viết.
 */
export function ghiChuHopDongTuMa(maHopDong: string | undefined): string {
  const ma = maHopDong?.trim();
  if (!ma) return "";
  return `${ma} ký ngày ……/……/…….`;
}

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

/**
 * ★ Bản điều khoản của đơn này có còn mang điều khoản RIÊNG CỦA MẪU PO-02 không?
 *
 * 🔴 VÌ SAO CẦN: người lập chọn mẫu PO-02, sửa vài mục (khối thành bản riêng của đơn), rồi ĐỔI
 * SANG MẪU PO-01. Bản riêng đó vẫn còn nguyên 5 điều khoản của PO-02, và tờ in ưu tiên bản riêng
 * hơn bản chuẩn — nên tờ PO-01 in ra thừa 5 điều khoản mà biểu mẫu PO-01 không có. Đây là lệch
 * NỘI DUNG PHÁP LÝ trên chứng từ gửi ra ngoài, không phải lệch trình bày.
 *
 * ⚠️ SO THEO ĐẦU CÂU, KHÔNG SO NGUYÊN VĂN CẢ DÒNG: người lập có quyền sửa chữ bên trong mỗi điều
 * khoản (điền số ngày vào chỗ `……`, thêm bớt vài từ). So nguyên văn thì họ vừa điền số ngày là
 * phép kiểm mù, đúng lúc cần nó nhất.
 *
 * 📌 Lấy 40 ký tự đầu là đủ dài để không đụng nhầm hai dòng chung, và đủ ngắn để chịu được việc
 * người lập sửa phần đuôi câu.
 */
export function conDieuKhoanRiengThoaThuan(vanBan: string | null | undefined): boolean {
  if (!vanBan) return false;
  const dauCau = (d: string) => d.trim().replace(/\s+/g, " ").slice(0, 40).toLowerCase();
  const dauCuaPhanRieng = PHAN_RIENG_THOA_THUAN.split("\n").map(dauCau).filter(Boolean);
  return vanBan
    .split(/\r?\n/)
    .map(dauCau)
    .some((d) => d.length > 0 && dauCuaPhanRieng.includes(d));
}

/** Bản điều khoản của đơn này có khác bản chuẩn không — để tờ in nói rõ. */
export function daSuaKhacBanChuan(vanBan: string | undefined, banChuan: string): boolean {
  if (vanBan === undefined) return false;
  const gon = (s: string) => s.replace(/\r?\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  return gon(vanBan) !== gon(banChuan);
}
