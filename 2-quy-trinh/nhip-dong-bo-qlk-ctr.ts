// ============================================================
// NHỊP GHI KHO CHUNG & NHỊP THỬ LẠI QLK CTR — HÀM THUẦN, GỌI THẬT ĐƯỢC
//
// 🔴 SINH RA TỪ MỘT SỰ CỐ THẬT, CÓ BÊN THỨ BA PHÀN NÀN — 15/09/2026.
//
// Đội QLK CTR gửi phân tích (nguyên văn, rút gọn): *"App Thu Mua lưu TOÀN BỘ dữ liệu công ty
// trong ĐÚNG 1 tài liệu Firestore duy nhất. Bất kỳ thay đổi nào (dù không liên quan PO) đều ghi
// đè lại NGUYÊN cả tài liệu, khiến mọi máy đang mở App Thu Mua đồng loạt nhận được thay đổi và tự
// động quét lại toàn bộ đơn hàng đang 'lỗi' để gửi lại sang QLK CTR — không giới hạn, không có độ
// trễ. […] Cách sửa (bên App Thu Mua): thêm giới hạn/độ trễ giữa các lần tự động gửi lại, và/hoặc
// chỉ cho phép 1 lượt gửi lại tại 1 thời điểm."*
//
// Phân tích đó ĐÚNG. Ba đơn kẹt lúc đó: DMH260005, DMH260007, DMH260009.
//
// 🔴 VÌ SAO LUẬT NẰM Ở ĐÂY CHỨ KHÔNG NẰM TRONG HOOK: chỉ đạo Sếp 15/09/2026 — *"luật nằm trong
// hook thì không bài kiểm nào bắt được"*. `kiem-luat-dung-chung.mjs` gọi THẬT ba hàm dưới đây;
// chú thích không chạy được nên không lừa được phép kiểm. Xem CLAUDE.md §6.6.
//
// ⚠️ TỆP NÀY KHÔNG ĐƯỢC `import` GÌ CẢ (ngoài `type`). Nó phải dựng được độc lập bằng esbuild
// cho bài kiểm, và phải là hàm thuần — không đọc `Date.now()`, không đọc `localStorage`, không
// đụng React. Mọi thứ "bây giờ là mấy giờ" đều truyền vào qua tham số.
// ============================================================

/**
 * Mốc thử lại của MỘT đơn hàng (PO).
 *
 * 📌 Chỗ CẤT mốc này là `3-du-lieu/moc-thu-lai-qlk-ctr.ts` (localStorage của từng máy) —
 * cố ý KHÔNG cất lên kho chung, xem chú thích đầu tệp đó.
 */
export interface MocThuLaiQlkCtr {
  /** Đã thử gửi sang QLK CTR bao nhiêu lần mà vẫn lỗi. 0 = chưa từng thử. */
  soLanDaThu: number;
  /** Thời điểm lần thử gần nhất, tính bằng mili-giây (`Date.now()`). */
  lanCuoi: number;
}

/**
 * ★ NHỊP GOM CÁC LẦN GHI KHO CHUNG — 800 mili-giây.
 *
 * Vì sao 800 chứ không phải 0 (như trước) hay 5000:
 *
 *   · **Firestore khuyến cáo tối đa ~1 lần ghi mỗi giây cho MỘT tài liệu.** Cả app đang dùng
 *     đúng một tài liệu (`chay-thu/du-lieu-chung`), nên mỗi thao tác một lần ghi là vượt ngưỡng
 *     ngay khi có người gõ phím. 800ms giữ một máy ở mức tối đa ~1,25 lần ghi/giây trong ca xấu
 *     nhất, và gom trọn một tràng thao tác (gõ ô, tick liên tiếp, kéo thẻ) thành **một** lần ghi.
 *
 *   · **Cửa sổ rủi ro phải dưới một giây.** Kho chung là MỘT tài liệu, nên trong lúc lần ghi của
 *     mình còn đang chờ, ảnh chụp của người khác dội về sẽ đè lên state máy này. Nhịp càng dài
 *     thì cửa sổ đó càng rộng. 800ms là chỗ dừng: đủ để gom, chưa đủ để người dùng kịp làm việc
 *     thứ hai rồi mất việc thứ nhất.
 *
 * ⚠️ ĐÂY LÀ TRẦN TỐC ĐỘ, KHÔNG PHẢI ĐỘ TRỄ CỐ ĐỊNH. Một thao tác lẻ (đã im hơn 800ms) vẫn được
 * ghi NGAY — xem `tinhDoTreGhi`. Nếu làm thành "luôn chờ 800ms" thì mọi thao tác đều chậm đi mà
 * chẳng giảm được lượt ghi nào ở ca thường gặp nhất.
 */
export const NHIP_GOM_GHI_MS = 800;

/**
 * ★ CÁC BẬC CHỜ TRƯỚC KHI TỰ THỬ GỬI LẠI MỘT PO SANG QLK CTR.
 *
 * Chỉ số của mảng = **số lần đã thử mà vẫn lỗi**. Nên phần tử đầu là `0`: chưa thử lần nào thì
 * gửi ngay, không bắt chờ.
 *
 * 1 phút → 5 phút → 30 phút → 2 giờ, rồi dừng ở 2 giờ (trần).
 */
export const BAC_CHO_THU_LAI_MS: readonly number[] = [
  0,
  60_000, // 1 phút
  300_000, // 5 phút
  1_800_000, // 30 phút
  7_200_000, // 2 giờ — trần
];

/**
 * Phải chờ bao lâu kể từ lần thử gần nhất, khi đã thử `soLanDaThu` lần mà vẫn lỗi.
 *
 * 🔴 `soLanDaThu = 0` PHẢI TRẢ VỀ 0. Đây là chiều nghịch quan trọng nhất của cả cơ chế: một PO
 * chưa từng thử thì không có lý do gì bắt nó chờ. Ai sửa hàm này thành "luôn có khoảng chờ" là
 * chặn luôn lần gửi đầu tiên.
 */
export function khoangChoThuLai(soLanDaThu: number): number {
  if (!Number.isFinite(soLanDaThu) || soLanDaThu <= 0) return 0;
  const i = Math.min(Math.floor(soLanDaThu), BAC_CHO_THU_LAI_MS.length - 1);
  return BAC_CHO_THU_LAI_MS[i];
}

/**
 * ★ ĐÃ ĐƯỢC PHÉP TỰ THỬ GỬI LẠI PO NÀY CHƯA?
 *
 * 🔴🔴 HÀM NÀY KHÔNG BAO GIỜ ĐƯỢC TRẢ `false` VÔ ĐIỀU KIỆN — đây là chiều nghịch mà bài kiểm
 * canh gắt nhất. Toàn bộ cơ chế thử lại sinh ra để lo đúng ca *"PO lỗi tạm thời vì mạng chập
 * chờn"*; ai sửa thành chặn tuyệt đối thì những PO đó **không bao giờ tự hồi phục**, và không có
 * một dòng nào báo — thủ kho chỉ thấy đơn mãi không sang tới app Kho.
 *
 * Ba ca trả `true`:
 *   ① `moc` rỗng — chưa từng thử → gửi ngay.
 *   ② Đã qua đủ khoảng chờ của bậc hiện tại.
 *   ③ Đồng hồ máy bị chỉnh lùi (`bayGio < moc.lanCuoi`) → coi như hết hạn chờ. Thà thử sớm một
 *      lần còn hơn kẹt vĩnh viễn vì một mốc thời gian nằm ở tương lai.
 *
 * @param moc    Mốc đọc từ máy (có thể `undefined` = chưa từng thử).
 * @param bayGio `Date.now()` do bên gọi truyền vào — để bài kiểm dựng được thời gian giả.
 */
export function duocThuLaiQlkCtr(moc: MocThuLaiQlkCtr | undefined, bayGio: number): boolean {
  if (!moc) return true;
  const troiQua = bayGio - moc.lanCuoi;
  if (!Number.isFinite(troiQua) || troiQua < 0) return true; // ③ đồng hồ lùi
  return troiQua >= khoangChoThuLai(moc.soLanDaThu);
}

/**
 * ★ CÒN PHẢI CHỜ BAO LÂU NỮA MỚI ĐƯỢC GHI LÊN KHO CHUNG (mili-giây). `0` = ghi ngay.
 *
 * Đây là **trần tốc độ có đuôi** chứ không phải hoãn cứng: nếu lần ghi gần nhất đã lâu hơn một
 * nhịp thì trả `0` (thao tác lẻ vẫn tức thì); còn đang trong nhịp thì trả phần thời gian còn
 * thiếu, và bên gọi hẹn ghi **bản mới nhất** vào đúng lúc đó.
 *
 * 🔴 `mocGhiGanNhat = 0` (chưa ghi lần nào) PHẢI trả `0`. Bắt lần ghi đầu tiên chờ là đúng cái
 * làm người dùng tưởng app nuốt mất thao tác.
 *
 * @param mocGhiGanNhat Thời điểm lần ghi gần nhất (`Date.now()`), `0` nếu chưa ghi lần nào.
 * @param bayGio        `Date.now()` do bên gọi truyền vào.
 * @param nhip          Nhịp gom, mặc định `NHIP_GOM_GHI_MS`.
 */
export function tinhDoTreGhi(
  mocGhiGanNhat: number,
  bayGio: number,
  nhip: number = NHIP_GOM_GHI_MS,
): number {
  if (!mocGhiGanNhat) return 0;
  const troiQua = bayGio - mocGhiGanNhat;
  if (!Number.isFinite(troiQua) || troiQua < 0) return 0; // đồng hồ lùi → ghi ngay
  if (troiQua >= nhip) return 0;
  return nhip - troiQua;
}

/**
 * Bậc tiếp theo sau một lần thử THẤT BẠI.
 *
 * ⚠️ Chỉ tăng đếm, KHÔNG có trần ở đây — trần nằm ở `khoangChoThuLai`. Giữ số lần thử thật giúp
 * người đọc nhật ký biết đơn đã hỏng bao nhiêu lượt, còn khoảng chờ thì vẫn dừng ở 2 giờ.
 */
export function mocSauLanThuHong(
  moc: MocThuLaiQlkCtr | undefined,
  bayGio: number,
): MocThuLaiQlkCtr {
  return { soLanDaThu: (moc?.soLanDaThu ?? 0) + 1, lanCuoi: bayGio };
}
