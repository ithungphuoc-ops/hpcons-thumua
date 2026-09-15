// ============================================================
// GIỮ BẢN GHI VỪA TẠO CHO TỚI KHI THẤY NÓ TRÊN MÁY CHỦ — HÀM THUẦN, GỌI THẬT ĐƯỢC
//
// 🔴🔴 SINH RA TỪ MỘT SỰ CỐ MẤT DỮ LIỆU CÓ THẬT, ĐO ĐƯỢC — 15/09/2026.
//
// Sếp lập một đơn mua hàng lúc **19:33 ngày 15/09/2026**. App nhận, sinh id
// `po-b1e884d9-0c60-490a-a8da-c4f84da64d8e`, điều hướng sang trang chi tiết → màn hình báo
// *"Không tìm thấy đơn đặt hàng"*.
//
// ĐO TRÊN KHO CHUNG THẬT (`hpcons-portal`, `chay-thu/du-lieu-chung`):
//   · Đơn đó **KHÔNG tồn tại** trên máy chủ.
//   · Tài liệu mới 162.928 byte — **không** chạm trần 1 MiB, nên loại trừ ca tràn dung lượng.
//   · Bảy đơn còn lại: DMH260002, **05**, 06, 07, 08, 09, 10 — **thiếu 260001, 260003, 260004**.
//     App KHÔNG có chức năng xoá từng đơn ⇒ **ít nhất 3 đơn khác đã mất y hệt từ trước**.
//     Đây là lỗi LẶP LẠI, không phải sự cố một lần.
//
// BA CHỖ CÙNG GÓP VÀO (đã điều tra xong, đường lưu tại máy thì LÀNH):
//   ① `dayLenMayChu` ghi hỏng chỉ `console.error` rồi thôi — **không thử lại lần nào**.
//   ② Đẩy lên bằng `setDoc(..., merge:false)` — ai ghi sau đè sạch người ghi trước.
//   ③ `apDung` dùng setter **không-hàm** (`setDonHang(d.donHang)`) — **thay trọn mảng**, nên bản
//      ghi chỉ có ở máy mình bị ảnh chụp từ máy khác xoá sạch.
//
// Tệp này lo phần ②+③: **giữ bản ghi máy này vừa tạo cho tới khi chính máy chủ gửi nó về**.
//
// ════════════════════════════════════════════════════════════════════
// 🔴🔴 CÂU HỎI SỐNG CÒN: PHÂN BIỆT "BẢN MỚI CHƯA LÊN SERVER" VỚI "BẢN BỊ NGƯỜI KHÁC XOÁ"
//
// Nếu ghép lại bừa thì bản vá này biến thành một lỗi NẶNG HƠN lỗi nó đang chữa: xoá một đề nghị
// ở máy A, máy B dựng nó sống lại, xoá bao nhiêu lần cũng vô ích.
//
// Cách phân biệt — MỘT BẤT BIẾN DUY NHẤT, và nó là cửa MỘT CHIỀU:
//
//   > Chỉ giữ những id mà **máy này tự tạo ra trong phiên này** VÀ **chưa từng xuất hiện trong
//   > bất kỳ ảnh chụp nào từ máy chủ**. Thấy một lần rồi thì thôi theo dõi VĨNH VIỄN.
//
// Vì sao bất biến đó đủ chặt:
//   · Người khác muốn xoá bản ghi X thì họ phải **nhìn thấy** X, tức X đã từng nằm trên máy chủ.
//     Mà X đã từng trên máy chủ thì ảnh chụp chứa X đã về tới máy này → X đã bị **gỡ khỏi sổ theo
//     dõi** từ lúc đó → lần xoá của họ đi qua trót lọt, không bị hồi sinh. ✅
//   · Ngược lại, bản ghi chưa từng lên máy chủ thì **không một ai khác từng thấy nó**, nên không
//     thể có chuyện "người khác cố ý xoá" — chỉ có thể là lần ghi của mình chưa tới nơi. ✅
//
// 🔴 VÌ SAO PHẢI CÓ VẾ "TRONG PHIÊN NÀY", KHÔNG ĐƯỢC BỎ: nếu chỉ dựa vào sổ "đã thấy trên máy
// chủ" (sổ này rỗng mỗi lần mở app), thì ca sau sẽ hồi sinh dữ liệu thật: máy A có X trong bản
// lưu localStorage từ hôm trước → trong lúc A tắt máy, B xoá X → A mở lại, sổ "đã thấy" rỗng,
// ảnh chụp không có X → A dựng X sống lại. Đúng cái phải tránh. Vế "máy này vừa tạo trong phiên
// này" cắt hẳn ca đó: X nạp từ localStorage lúc khởi động **không** được đánh dấu.
// ════════════════════════════════════════════════════════════════════
//
// ⚠️ TỆP NÀY KHÔNG `import` GÌ CẢ. Nó phải dựng được độc lập bằng esbuild cho
// `kiem-luat-dung-chung.mjs`, và phải là hàm thuần — không `Date.now()`, không `localStorage`,
// không đụng React. Cùng lý do với `2-quy-trinh/nhip-dong-bo-qlk-ctr.ts`; xem CLAUDE.md §6.6:
// *"luật nằm trong hook thì không bài kiểm nào bắt được"*.
// ============================================================

/** Vết theo dõi MỘT bản ghi máy này vừa tạo mà chưa thấy trên máy chủ. */
export interface VetBanGhiMoi {
  /** Đã nhận bao nhiêu ảnh chụp từ máy chủ mà vẫn KHÔNG thấy id này. */
  soAnhChupVang: number;
}

/**
 * ★ SAU BAO NHIÊU ẢNH CHỤP VẮNG MẶT THÌ COI LÀ "CHƯA LÊN ĐƯỢC MÁY CHỦ" và nói ra với người dùng.
 *
 * 📌 Ở nhịp bình thường một bản ghi lên tới máy chủ và dội về trong **một** ảnh chụp. Vắng tới
 * 10 ảnh chụp liên tiếp nghĩa là đường ghi đang thật sự hỏng, không phải chậm.
 */
export const SO_ANH_CHUP_TRUOC_KHI_BAO = 10;

/**
 * 🔴🔴 ĐỌC KỸ TRƯỚC KHI ĐỔI — VÌ SAO QUÁ HẠN VẪN **GIỮ** BẢN GHI, CHỈ ĐỔI SANG BÁO ĐỘNG.
 *
 * Phương án đầu tiên nghĩ tới là *"quá N ảnh chụp thì thôi giữ"*. Cân nhắc rồi **không làm**, vì
 * thôi giữ chính là **mất dữ liệu lần thứ hai** — đúng thứ tệp này sinh ra để chặn. Bản ghi đó
 * là việc người dùng đã làm thật, và nó là bản DUY NHẤT còn tồn tại (máy chủ không có).
 *
 * Thứ bảo đảm "không hồi sinh vĩnh viễn" KHÔNG phải cái trần này, mà là **cửa một chiều** ở
 * `soSauAnhChup`: thấy trên máy chủ một lần là gỡ khỏi sổ, không bao giờ theo dõi lại. Bản ghi
 * chưa từng lên máy chủ thì không ai từng thấy để mà xoá — nên giữ mãi cũng không đè lên ý muốn
 * của ai cả.
 *
 * Cái trần này chỉ đổi **lời app nói**: từ *"đang đồng bộ"* sang *"chưa lên được kho chung"*.
 * Đúng CLAUDE.md §3.5 — chức năng chưa làm được thì nói rõ, không làm giả cảm giác đã xong.
 */
export function quaHanDongBo(vet: VetBanGhiMoi | undefined): boolean {
  if (!vet) return false;
  return vet.soAnhChupVang >= SO_ANH_CHUP_TRUOC_KHI_BAO;
}

/**
 * ★ ① NHỮNG ID VỪA MỌC RA Ở MÁY NÀY MÀ MÁY CHỦ CHƯA TỪNG GỬI VỀ.
 *
 * Gọi ở chỗ chuẩn bị đẩy lên kho chung: so bộ id kỳ này với bộ id kỳ trước của **chính máy này**.
 * Id nào mới xuất hiện mà không nằm trong sổ "đã thấy trên máy chủ" thì đúng là do người ngồi máy
 * này vừa tạo ra.
 *
 * 🔴 VẾ `daThayTrenMayChu` LÀ BẮT BUỘC. Không có nó thì mọi bản ghi do **máy khác** tạo (về qua
 * ảnh chụp, cũng là "mới xuất hiện" so với kỳ trước) đều bị máy này nhận vơ là của mình rồi giữ
 * khư khư — và từ đó máy này sẽ hồi sinh mọi bản ghi mà người khác xoá.
 *
 * @param idKyTruoc        Bộ id của kỳ trước. Rỗng ở lần chạy đầu tiên.
 * @param idKyNay          Bộ id hiện có trong state máy này.
 * @param daThayTrenMayChu Sổ tích luỹ: mọi id từng xuất hiện trong ảnh chụp từ máy chủ.
 */
export function idVuaTaoTaiMay(
  idKyTruoc: ReadonlySet<string>,
  idKyNay: readonly string[],
  daThayTrenMayChu: ReadonlySet<string>,
): string[] {
  const ra: string[] = [];
  for (const id of idKyNay) {
    if (idKyTruoc.has(id)) continue;
    if (daThayTrenMayChu.has(id)) continue;
    ra.push(id);
  }
  return ra;
}

/**
 * ★ ② ẢNH CHỤP NÀY THIẾU NHỮNG ID NÀO MÀ MÁY MÌNH ĐANG GIỮ.
 *
 * Đây đúng là câu hỏi Sếp đặt ra: *"ảnh chụp này thiếu id nào máy mình đang giữ"*.
 */
export function idCanGhepLai(
  dangGiu: ReadonlyMap<string, VetBanGhiMoi>,
  idTrongAnhChup: ReadonlySet<string>,
): string[] {
  const ra: string[] = [];
  for (const id of dangGiu.keys()) {
    if (!idTrongAnhChup.has(id)) ra.push(id);
  }
  return ra;
}

/**
 * ★ ③ GHÉP LẠI: lấy danh sách từ máy chủ làm gốc, đắp thêm những bản ghi máy này đang giữ mà ảnh
 * chụp không có.
 *
 * 🔴🔴 CHIỀU NGHỊCH QUAN TRỌNG NHẤT CỦA CẢ TỆP: **sổ theo dõi rỗng thì hàm này phải trả về đúng
 * danh sách của máy chủ, không thêm một dòng nào.** Ai sửa thành "luôn gộp hai danh sách" thì mọi
 * lần xoá của mọi người đều bị hồi sinh, và không có một dòng nào báo. `kiem-luat-dung-chung.mjs`
 * canh đúng điều này.
 *
 * ⚠️ Bản ghi được đắp thêm lấy từ **state máy này** (`taiMay`), tức bản mới nhất người dùng đang
 * nhìn thấy — không phải bản chụp cũ nào cả.
 *
 * 📌 Đắp vào CUỐI danh sách, giữ nguyên thứ tự của máy chủ. Thứ tự hiển thị do màn hình tự sắp,
 * nên chỗ này chỉ cần ổn định.
 *
 * @param tuMayChu Danh sách máy chủ vừa gửi về.
 * @param taiMay   Danh sách đang có trong state máy này.
 * @param dangGiu  Sổ theo dõi các bản ghi máy này vừa tạo mà chưa thấy trên máy chủ.
 * @param layId    Cách lấy khoá của một bản ghi (`donHang` dùng `id`, `giaDonHang` dùng `poId`).
 */
export function ghepBanChuaLenMayChu<T>(
  tuMayChu: readonly T[],
  taiMay: readonly T[],
  dangGiu: ReadonlyMap<string, VetBanGhiMoi>,
  layId: (x: T) => string,
): T[] {
  // Sổ rỗng = không giữ gì = trả nguyên bản của máy chủ. Đường thoát nhanh, và cũng là chiều
  // nghịch mà bài kiểm canh.
  if (dangGiu.size === 0) return [...tuMayChu];

  const coTrenMayChu = new Set<string>();
  for (const x of tuMayChu) coTrenMayChu.add(layId(x));

  const ra = [...tuMayChu];
  const daDap = new Set<string>();
  for (const x of taiMay) {
    const id = layId(x);
    if (coTrenMayChu.has(id)) continue; // máy chủ có rồi — bản của máy chủ thắng
    if (!dangGiu.has(id)) continue; // KHÔNG theo dõi ⇒ đây là bản người khác xoá, để nó mất
    if (daDap.has(id)) continue; // phòng dữ liệu trùng id ở state máy này
    daDap.add(id);
    ra.push(x);
  }
  return ra;
}

/**
 * ★ ④ CẬP NHẬT SỔ THEO DÕI SAU MỖI ẢNH CHỤP TỪ MÁY CHỦ.
 *
 * Ba việc, đúng ba đường thoát của cơ chế:
 *   · **Thấy trong ảnh chụp** → gỡ khỏi sổ. Đây là cửa MỘT CHIỀU và là thứ ngăn hồi sinh vĩnh
 *     viễn: từ giây đó, người khác xoá bản ghi này thì máy mình để cho nó mất.
 *   · **Không còn trong state máy này** → gỡ khỏi sổ. Ca chính người ngồi máy này xoá bản ghi
 *     của mình trước khi nó kịp lên máy chủ; giữ tiếp là chống lại ý muốn của họ.
 *   · **Vẫn vắng mặt** → tăng đếm, để `quaHanDongBo` biết lúc nào phải nói thật với người dùng.
 *
 * 🔴 KHÔNG BAO GIỜ THÊM ID MỚI Ở ĐÂY. Thêm mới chỉ xảy ra ở `idVuaTaoTaiMay`, tức chỗ biết chắc
 * bản ghi do máy này tạo ra. Nới chỗ này là mất luôn bất biến của cả tệp.
 *
 * @param dangGiu        Sổ hiện tại.
 * @param idTrongAnhChup Bộ id máy chủ vừa gửi về.
 * @param idConTaiMay    Bộ id còn trong state máy này.
 */
export function soSauAnhChup(
  dangGiu: ReadonlyMap<string, VetBanGhiMoi>,
  idTrongAnhChup: ReadonlySet<string>,
  idConTaiMay: ReadonlySet<string>,
): Map<string, VetBanGhiMoi> {
  const ra = new Map<string, VetBanGhiMoi>();
  for (const [id, vet] of dangGiu) {
    if (idTrongAnhChup.has(id)) continue; // ✅ đã lên máy chủ — thôi theo dõi, VĨNH VIỄN
    if (!idConTaiMay.has(id)) continue; // ✅ chính máy này đã bỏ nó đi
    ra.set(id, { soAnhChupVang: vet.soAnhChupVang + 1 });
  }
  return ra;
}

// ════════════════════════════════════════════════════════════════════
// NHỊP THỬ LẠI KHI GHI LÊN KHO CHUNG HỎNG — phần ① của bản vá 15/09/2026
//
// Trước bản vá: `ketNoiChung.current.day(d).catch(...)` chỉ ghi `console.error`, gỡ dấu rồi
// đổi badge. **Không thử lại lần nào** ⇒ mạng chập một nhịp là mất luôn việc vừa làm.
// ════════════════════════════════════════════════════════════════════

/**
 * ★ CÁC BẬC CHỜ TRƯỚC KHI TỰ GHI LẠI LÊN KHO CHUNG.
 *
 * Chỉ số của mảng = **số lần ghi đã hỏng liên tiếp**. Phần tử đầu là `0`: chưa hỏng lần nào thì
 * ghi ngay, không bắt chờ.
 *
 * 3 giây → 10 giây → 30 giây → 60 giây (trần).
 *
 * 📌 Vì sao bắt đầu từ 3 giây chứ không phải vài trăm mili-giây: ca hỏng hay gặp nhất là Firestore
 * đang backoff hoặc hàng đợi ghi tràn (`resource-exhausted`, đã gặp thật 15/09/2026). Bắn lại ngay
 * lập tức chỉ làm hàng đợi tràn thêm.
 */
export const BAC_CHO_GHI_LAI_MS: readonly number[] = [
  0,
  3_000, // 3 giây
  10_000, // 10 giây
  30_000, // 30 giây
  60_000, // 60 giây — trần
];

/**
 * ★ SỐ LẦN THỬ GHI LẠI TỐI ĐA cho một chuỗi hỏng liên tiếp.
 *
 * 12 lần ≈ hơn 9 phút cố gắng. Quá đó thì dừng hẳn để khỏi đốt hạn mức Firestore — dữ liệu vẫn
 * an toàn ở hai chỗ: bản lưu trên máy (`ghiDuLieu`, ghi ngay không gom nhịp) và sổ giữ bản ghi
 * mới ở đầu tệp này. Và bất kỳ thao tác nào sau đó cũng khởi động lại một lượt ghi mới.
 */
export const SO_LAN_GHI_LAI_TOI_DA = 12;

/**
 * Phải chờ bao lâu trước lần ghi lại, khi đã hỏng `soLanHong` lần liên tiếp.
 *
 * 🔴 `soLanHong = 0` PHẢI TRẢ `0` — chưa hỏng lần nào thì không có gì để chờ. Ai sửa thành "luôn
 * có khoảng chờ" là làm chậm mọi lần ghi bình thường.
 */
export function khoangChoGhiLai(soLanHong: number): number {
  if (!Number.isFinite(soLanHong) || soLanHong <= 0) return 0;
  const i = Math.min(Math.floor(soLanHong), BAC_CHO_GHI_LAI_MS.length - 1);
  return BAC_CHO_GHI_LAI_MS[i];
}

/**
 * ★ CÒN ĐƯỢC THỬ GHI LẠI NỮA KHÔNG?
 *
 * 🔴 KHÔNG BAO GIỜ ĐƯỢC TRẢ `false` VÔ ĐIỀU KIỆN. Cả cơ chế thử lại sinh ra cho đúng ca "mạng
 * chập một nhịp"; chặn tuyệt đối là quay về đúng lỗi 15/09/2026 — ghi hỏng một lần là mất luôn.
 */
export function conDuocGhiLai(soLanHong: number): boolean {
  if (!Number.isFinite(soLanHong) || soLanHong < 0) return true;
  return soLanHong < SO_LAN_GHI_LAI_TOI_DA;
}
