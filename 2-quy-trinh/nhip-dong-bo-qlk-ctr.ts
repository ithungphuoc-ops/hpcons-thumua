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
  /** ★ (04/10/2026, L11/L12) Lần thử ĐẦU TIÊN của nội dung này — để tính hạn 1 ngày. Mốc cũ (trước
   *  04/10) không có trường này → chỉ áp trần số lần. */
  lanDau?: number;
  /** ★ (04/10/2026, L11/L12) Vân tay nội dung PO lúc thử (`vanTayNoiDungPO`). Nội dung đổi = mốc
   *  này không còn đúng → coi như chưa thử, gửi NGAY. Mốc cũ không có trường này → BỎ, tính lại từ
   *  đầu (QA 04/10: giữ mốc cũ làm dừng oan lần gửi đầu của nội dung vừa sửa). */
  vanTay?: string;
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
  vanTay?: string,
): MocThuLaiQlkCtr {
  const ra: MocThuLaiQlkCtr = { soLanDaThu: (moc?.soLanDaThu ?? 0) + 1, lanCuoi: bayGio, lanDau: moc?.lanDau ?? bayGio };
  const vt = vanTay ?? moc?.vanTay;
  if (vt !== undefined) ra.vanTay = vt;
  return ra;
}

// ============================================================
// ★★ GIỚI HẠN TỰ GỬI LẠI — L11/L12 "liên kết 4 app" (Sếp 04/10/2026: "sửa lại không cho gửi mãi như vậy")
//
// 🔴 TRƯỚC ĐÂY: một PO gửi sang QLK CTR hỏng thì app tự gửi lại MÃI (bậc trần 2 giờ, không điểm dừng),
// mỗi máy đang mở app tự gửi riêng; PO đã từng gửi được rồi bị sửa mà gửi hỏng thì còn tệ hơn — mỗi lần
// mở trang lại gửi NGAY, không qua bậc chờ nào (`canDongBoLaiPO` luôn thấy "nội dung khác bản đã gửi").
//
// ✅ BÂY GIỜ — đúng luật chung Sếp chốt 03/10/2026 cho cả 4 app:
//   · Cùng MỘT nội dung PO (vân tay `vanTayNoiDungPO`): thử tối đa 5 lần HOẶC trong 1 ngày, giữa các
//     lần vẫn qua bậc chờ 1 phút · 5 phút · 30 phút · 2 giờ.
//   · Quá giới hạn → DỪNG trên mọi máy (dấu `DonDatHang.qlkCtrDungTuGui` = vân tay lúc dừng) + BÁO
//     người lập PO và trưởng bộ phận. Không im lặng — dải cảnh báo trên đơn có nút "Gửi lại ngay".
//   · Sửa đơn (nội dung đổi → vân tay đổi) thì tính lại từ đầu và gửi NGAY, y như cũ.
//
// 📌 KHÔNG ĐỔI `duocThuLaiQlkCtr`: hàm đó chỉ trả lời "đã qua bậc chờ chưa" và bài kiểm chiều nghịch
// của nó vẫn đúng. Điểm dừng nằm ở hàm RIÊNG `lyDoDungTuGuiLaiQlkCtr` dưới đây — dừng có báo, có nút
// gửi lại, nên không rơi vào ca "kẹt vĩnh viễn mà không ai biết" bài kiểm kia canh.
// ============================================================

export const SO_LAN_TU_GUI_TOI_DA_QLK_CTR = 5;
export const HAN_TU_GUI_LAI_QLK_CTR_MS = 24 * 60 * 60 * 1000;

/**
 * Vân tay NỘI DUNG của một PO — chuỗi ngắn, giống nhau trên mọi máy cho cùng một dữ liệu.
 *
 * Lấy TOÀN BỘ đơn (trừ các trường `qlkCtr*` do chính vòng đồng bộ ghi và `lichSu`), chứ không chép lại
 * danh sách trường trong payload (`5-ket-noi/gui-po-qlk-ctr.ts`, vùng cấm): thừa thì chỉ làm "tính lại
 * từ đầu" thêm vài lần khi người dùng sửa đơn; thiếu thì một lần sửa thật bị coi là gửi lại y nguyên.
 * Thừa an toàn hơn thiếu. Khoá sắp theo thứ tự chữ cái để máy nào tính cũng ra cùng một chuỗi.
 *
 * 📌 NGOẠI LỆ DUY NHẤT: `qlkCtrLuotGuiLai` (số lần bấm "Gửi lại ngay") ĐƯỢC tính vào — bấm nút là
 * mở một lượt mới cho MỌI máy (mốc thử lại lưu riêng từng máy, không có cách nào xoá hộ máy khác).
 *
 * @param maDeXuat `maDeXuatAppRequest` của đề nghị gốc (payload PO có đề nghị dùng nó).
 */
export function vanTayNoiDungPO(po: object, maDeXuat?: string): string {
  const goc: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(po as Record<string, unknown>)) {
    if ((k.startsWith("qlkCtr") && k !== "qlkCtrLuotGuiLai") || k === "lichSu") continue;
    goc[k] = v;
  }
  goc.__maDeXuat = maDeXuat ?? null;
  const s = chuoiOnDinh(goc);
  // FNV-1a 32 bit — đủ để phân biệt các bản sửa của CÙNG một đơn, không cần chống giả mạo.
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0") + s.length.toString(36);
}

function chuoiOnDinh(x: unknown): string {
  if (x === null || typeof x !== "object") return JSON.stringify(x) ?? "null";
  if (Array.isArray(x)) return `[${x.map((p) => (p === undefined ? "null" : chuoiOnDinh(p))).join(",")}]`;
  const khoa = Object.keys(x as Record<string, unknown>)
    .filter((k) => (x as Record<string, unknown>)[k] !== undefined)
    .sort();
  return `{${khoa.map((k) => `${JSON.stringify(k)}:${chuoiOnDinh((x as Record<string, unknown>)[k])}`).join(",")}}`;
}

/**
 * Mốc thử lại CHỈ còn giá trị khi cùng nội dung — nội dung đã đổi thì coi như chưa thử lần nào.
 *
 * 🔴 Mốc KHÔNG có vân tay (ghi trước 04/10/2026) cũng bỏ: không biết nó thuộc nội dung nào, giữ lại là
 * có thể dừng oan lần gửi đầu của một nội dung vừa sửa (QA 04/10, ca mốc cũ 12 lần của PO kẹt tháng 9).
 * Cái giá: lúc vừa lên bản mới, PO đang lỗi được thử thêm một lượt mới — có giới hạn 5 lần / 1 ngày.
 */
export function mocCuaNoiDung(moc: MocThuLaiQlkCtr | undefined, vanTay: string): MocThuLaiQlkCtr | undefined {
  if (!moc || moc.vanTay !== vanTay) return undefined;
  return moc;
}

/**
 * Đã tới lúc DỪNG tự gửi lại chưa — trả lý do (để ghi vào đơn + tin báo), `null` = còn được thử.
 *
 * 🔴 `moc` rỗng (chưa thử lần nào với nội dung này) PHẢI trả `null`: lần gửi đầu tiên không bao giờ
 * bị chặn.
 */
export function lyDoDungTuGuiLaiQlkCtr(moc: MocThuLaiQlkCtr | undefined, bayGio: number): string | null {
  if (!moc) return null;
  if (moc.soLanDaThu >= SO_LAN_TU_GUI_TOI_DA_QLK_CTR) return `Đã tự gửi ${moc.soLanDaThu} lần vẫn lỗi`;
  if (moc.lanDau !== undefined) {
    const troiQua = bayGio - moc.lanDau;
    if (Number.isFinite(troiQua) && troiQua >= HAN_TU_GUI_LAI_QLK_CTR_MS) return "Quá 1 ngày tự gửi lại vẫn lỗi";
  }
  return null;
}

// ============================================================
// ★★ PHÂN LOẠI LỖI TỪ QLK CTR — VĨNH VIỄN hay TẠM THỜI (Sếp 15/09/2026, đêm — vá P0 chặn vòng lặp)
//
// 🔴 VÌ SAO CẦN: sự cố 13–15/09 có MỘT PO của đề nghị 000000085 — đề nghị đó chưa từng sang được
// QLK CTR (App Request gọi Kho đúng lúc Kho hết hạn mức Firestore, không thử lại). Kho trả "không
// tìm thấy đề nghị" — lỗi này gửi lại một triệu lần cũng không đổi, nhưng app vẫn xếp nó cùng hàng
// với lỗi mạng và thử lại mãi. Mỗi lần thử là một lần ghi lên kho chung → dội về mọi máy.
//
// Từ nay chỉ lỗi TẠM THỜI (Kho sập, hết hạn mức, mạng, timeout — 5xx/408/429/không tới được) mới
// vào hàng tự thử lại. Lỗi VĨNH VIỄN (4xx: đề nghị không có, sai dữ liệu, không khớp vật tư…) ghi
// MỘT LẦN thành `can_xu_ly_tay` rồi đứng yên — sửa lại đơn (đổi nội dung) là cách duy nhất để gửi
// lại, và đó là hành động có người chịu trách nhiệm.
// ============================================================

export type LoaiLoiQlkCtr = "vinh_vien" | "tam_thoi";

/**
 * Phân loại một lần gửi hỏng. Ưu tiên lời khai của chính QLK CTR (`loaiLoi` trong body trả về,
 * có từ bản vá cùng đêm); không có thì suy từ mã HTTP.
 *
 * 🔴 KHÔNG BIẾT THÌ COI LÀ TẠM THỜI. Xếp nhầm lỗi tạm thời thành vĩnh viễn là PO kẹt không tự hồi
 * phục; xếp nhầm chiều ngược lại chỉ tốn vài lượt thử theo bậc chờ. Chiều an toàn là tạm thời.
 */
export function phanLoaiLoiQlkCtr(
  httpStatus: number | undefined,
  loaiLoiTuMayChu?: string,
): LoaiLoiQlkCtr {
  if (loaiLoiTuMayChu === "vinh_vien" || loaiLoiTuMayChu === "tam_thoi") return loaiLoiTuMayChu;
  if (httpStatus === undefined || !Number.isFinite(httpStatus)) return "tam_thoi";
  if (httpStatus === 408 || httpStatus === 429) return "tam_thoi";
  if (httpStatus >= 400 && httpStatus < 500) return "vinh_vien";
  return "tam_thoi";
}

/** Trạng thái ghi vào PO sau một lần gửi hỏng. */
export function trangThaiSauLoiQlkCtr(loai: LoaiLoiQlkCtr): "failed" | "can_xu_ly_tay" {
  return loai === "vinh_vien" ? "can_xu_ly_tay" : "failed";
}

/**
 * PO mang trạng thái này có được vòng tự đồng bộ đem ra thử lại không.
 *
 * 🔴 CHỈ `"failed"`. `"can_xu_ly_tay"` đứng ngoài hàng thử lại — đó chính là điểm cắt vòng lặp.
 * `"synced"`/rỗng thì không có gì để thử; nội dung đổi đi đường `canDongBoLaiPO`, không qua đây.
 */
export function coTuThuLaiQlkCtr(trangThai: string | undefined): boolean {
  return trangThai === "failed";
}
