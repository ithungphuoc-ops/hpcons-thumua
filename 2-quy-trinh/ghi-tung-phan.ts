// ============================================================
// GHI TỪNG PHẦN — chỉ gửi lên thứ mình vừa sửa (đợt 2, Sếp chốt 22/09/2026)
//
// 🔴 VẤN ĐỀ NÓ CHỮA: mỗi lần lưu, app đẩy TOÀN BỘ kho (312 KB) theo bản trong máy mình — kể cả
// những đơn mình không hề đụng tới. Hai người sửa HAI ĐƠN KHÁC NHAU vẫn đè mất việc của nhau,
// im lặng. Đã mất 5 đơn thật (ghi chép sự cố 15/09/2026 trong `kho-du-lieu.tsx`).
//
// ✅ ĐÃ THỬ THẬT trên Firestore ngày 22/09/2026, hai cách đặt cạnh nhau:
//
//     mảng + ghi đè cả tài liệu     A sửa đơn X → 50  ⇒ kết quả 10   ✗ MẤT
//     map  + ghi theo đường dẫn     A sửa đơn X → 50  ⇒ kết quả 50   ✓ GIỮ
//
// 🔴 VÌ SAO PHẢI ĐỔI MẢNG SANG MAP — không có đường vòng: Firestore KHÔNG cho ghi riêng một
// phần tử của mảng. Muốn sửa một đơn thì buộc ghi lại cả mảng, mà ghi cả mảng là đè lên mọi
// đơn trong đó. Chỉ khi dữ liệu ở dạng map (khoá = mã bản ghi) mới viết được
// `donHang.<id>.soLuong` — chạm đúng một ô.
//
// ⚠️ "Chỉ gửi ít hơn" KHÔNG ĐỦ. Phải đủ CẢ HAI: gửi ít, VÀ dữ liệu ở dạng ghi được từng phần.
// Thiếu vế sau thì vế trước vô nghĩa.
//
// ============================================================
// GIỮ NGUYÊN VỎ, CHỈ THAY RUỘT
// ============================================================
//
// Giao diện có 104 chỗ đọc mảng (`.map` `.filter` `.find`…). Đổi thẳng sang map là gãy cả 104
// chỗ đó. Nên chỉ TẦNG LƯU biết về map:
//
//     Firestore  ──lưu dạng MAP──┐
//                                ├─ khi đọc về: đổi thành MẢNG
//     Giao diện  ──vẫn thấy MẢNG─┘   (104 chỗ đọc không phải sửa một dòng)
//
// Cùng nguyên tắc đã dùng khi chuyển tệp đính kèm sang R2 hôm 21/09 — thay ruột, giữ vỏ, giao
// diện không đụng tới.
// ============================================================

/** Các khối dữ liệu lưu theo mảng, mỗi phần tử có `id` — đây là những khối chuyển sang map. */
export const KHOI_THEO_ID = ["deNghi", "donHang", "giaDonHang", "phieuNhan", "baoGia", "thongBao"] as const;
export type KhoiTheoId = (typeof KHOI_THEO_ID)[number];

/** Khoá của một bản ghi trong map. `giaDonHang` khoá theo `poId`, còn lại theo `id`. */
export function khoaBanGhi(khoi: KhoiTheoId, x: Record<string, unknown>): string {
  const k = khoi === "giaDonHang" ? x.poId : x.id;
  return typeof k === "string" ? k : "";
}

/**
 * Mảng → map, khoá là mã bản ghi.
 *
 * 🔴 BỎ BẢN GHI KHÔNG CÓ MÃ. Không có mã thì không có chỗ đứng trong map, mà cũng không ghi
 * riêng được — giữ lại là tạo một bản ghi ma không ai sửa được. Thà mất một bản ghi hỏng còn
 * hơn để nó nằm đó giả vờ bình thường.
 *
 * 🔴 TRÙNG MÃ THÌ BẢN SAU THẮNG — cùng quy ước với `ghepBanChuaLenMayChu`, để hai nơi không
 * cho ra kết quả khác nhau trên cùng dữ liệu.
 */
export function sangMap<T extends Record<string, unknown>>(
  khoi: KhoiTheoId,
  ds: readonly T[],
): Record<string, T> {
  const ra: Record<string, T> = {};
  for (const x of ds) {
    const k = khoaBanGhi(khoi, x);
    if (!k) continue;
    ra[k] = x;
  }
  return ra;
}

/**
 * Map → mảng. Dữ liệu cũ vẫn là mảng nên nhận CẢ HAI dạng — đây là điều bắt buộc để chuyển đổi
 * dần mà không cần ngừng dịch vụ: máy đã cập nhật đọc được dữ liệu cũ, máy chưa cập nhật vẫn
 * đọc được dữ liệu mới (vì bên kia cũng giữ đường rơi về).
 */
export function tuMap<T>(nguon: unknown): T[] {
  if (Array.isArray(nguon)) return nguon as T[];
  if (nguon && typeof nguon === "object") return Object.values(nguon as Record<string, T>);
  return [];
}

/** Một thay đổi cần ghi: đường dẫn trường trong tài liệu, và giá trị mới (`null` = xoá). */
export interface ThayDoi {
  duongDan: string;
  giaTri: unknown | null;
}

/** So hai bản ghi bằng chuỗi JSON ổn định — khoá sắp xếp để thứ tự trường không gây báo nhầm. */
export function chuoiOnDinh(x: unknown): string {
  if (x === null || typeof x !== "object") return JSON.stringify(x) ?? "";
  if (Array.isArray(x)) return "[" + x.map(chuoiOnDinh).join(",") + "]";
  const o = x as Record<string, unknown>;
  return "{" + Object.keys(o).sort().map((k) => JSON.stringify(k) + ":" + chuoiOnDinh(o[k])).join(",") + "}";
}

/**
 * Tính ra ĐÚNG những gì đã đổi giữa bản trên máy chủ và bản trong máy mình.
 *
 * 🔴 ĐÂY LÀ TOÀN BỘ GIÁ TRỊ CỦA ĐỢT 2. Bản ghi nào không đổi thì KHÔNG có mặt trong kết quả,
 * nên không được gửi lên, nên không thể đè lên bản người khác vừa sửa. Chính là dòng mà app
 * Đấu thầu đã có và Thu mua thì chưa:
 *     `if (cu.get(id) === json) continue;   // y hệt bản trên cloud → khỏi ghi`
 *
 * 🔴 XOÁ PHẢI BÁO RIÊNG BẰNG `giaTri: null`. Bỏ qua bản ghi biến mất thì người dùng xoá một
 * đơn xong nó vẫn nằm nguyên trên máy chủ, và lần đọc sau nó hiện về — người dùng tưởng app
 * hỏng. Nơi gọi đổi `null` thành `deleteField()` của Firestore.
 *
 * ⚠️ `cu` rỗng (chưa từng nhận ảnh chụp nào) thì trả về MẢNG RỖNG chứ không phải "ghi tất".
 * Chưa biết máy chủ đang có gì mà ghi đè tất là đúng cái sai đang muốn sửa — nơi gọi phải chờ
 * nhận được ảnh chụp đầu tiên rồi mới ghi.
 */
export function tinhThayDoi(
  khoi: KhoiTheoId,
  tuMayChu: Record<string, string> | null,
  taiMay: readonly Record<string, unknown>[],
): ThayDoi[] {
  if (!tuMayChu) return [];

  const ra: ThayDoi[] = [];
  const conLai = new Set(Object.keys(tuMayChu));

  for (const x of taiMay) {
    const k = khoaBanGhi(khoi, x);
    if (!k) continue;
    conLai.delete(k);
    const moi = chuoiOnDinh(x);
    if (tuMayChu[k] === moi) continue; // y hệt bản trên máy chủ → khỏi gửi
    ra.push({ duongDan: `${khoi}.${k}`, giaTri: x });
  }

  /* Còn sót trong ảnh chụp mà máy này không có nữa = đã bị xoá tại máy này. */
  for (const k of conLai) ra.push({ duongDan: `${khoi}.${k}`, giaTri: null });

  return ra;
}

/** Ảnh chụp theo từng bản ghi: khoá → chuỗi ổn định. Dùng để lần sau biết cái nào đã đổi. */
export function chupAnh(khoi: KhoiTheoId, ds: readonly Record<string, unknown>[]): Record<string, string> {
  const ra: Record<string, string> = {};
  for (const x of ds) {
    const k = khoaBanGhi(khoi, x);
    if (!k) continue;
    ra[k] = chuoiOnDinh(x);
  }
  return ra;
}

// ============================================================
// QUYẾT ĐỊNH GHI — tách riêng để KIỂM ĐƯỢC BẰNG CÁCH GỌI THẬT
//
// 🔴 VÌ SAO KHÔNG ĐỂ TRONG `kho-chung-firestore.ts`: file đó phải mở Firebase mới chạy được,
// nên bộ luật `kiem-luat-dung-chung.mjs` không gọi thật được, chỉ đọc chuỗi — mà đọc chuỗi thì
// một dòng chú thích cũng qua được. Phần dễ sai nhất của đợt 2 nằm ở đây, nên nó phải nằm chỗ
// luật sờ tới được. Bên kia chỉ còn việc THI HÀNH: `setDoc`, `updateDoc`, hay không làm gì.
// ============================================================

/** Các khoá KHÔNG theo mã bản ghi — so nguyên khối, đổi thì gửi cả khối. */
export const KHOA_NGUYEN_KHOI = ["cauHinh", "lichSuCauHinh", "nhaCungCapThem", "thuKhoThem"] as const;

/** Những gì đã biết về bản trên máy chủ, tại thời điểm sắp ghi. */
export interface TrangThaiKho {
  /** Đã nhận được lần đọc nào từ máy chủ chưa. */
  daNhanAnh: boolean;
  /** Ảnh chụp từng bản ghi. `null` = máy chủ CHƯA CÓ tài liệu (khác với "có mà rỗng"). */
  anhTheoKhoi: Partial<Record<KhoiTheoId, Record<string, string>>> | null;
  anhNguyenKhoi: Record<string, string>;
  /** Máy chủ còn để khối nào ở dạng mảng không. */
  conDangMang: boolean;
}

export type KetQuaGhi =
  | { kieu: "day-du"; ly: "chua-nhan-anh" | "chua-co-tai-lieu" | "con-dang-mang"; ban: Record<string, unknown> }
  | { kieu: "tung-phan"; thayDoi: ThayDoi[] }
  | { kieu: "bo-qua" };

/**
 * Đọc dữ liệu thô từ máy chủ ra trạng thái dùng cho lần ghi sau.
 *
 * 🔴 PHẢI ĐỌC TRÊN DỮ LIỆU THÔ, không đọc trên bản đã chuẩn hoá. `chuanHoa` đổi map thành mảng
 * hết rồi — hỏi nó thì lúc nào cũng thấy mảng, `conDangMang` luôn đúng, và app sẽ ghi đè cả kho
 * mãi mãi mà không ai biết. Đúng kiểu lỗi im lặng đã làm mất 5 đơn hồi 15/09.
 */
export function chupTrangThai(tho: Record<string, unknown> | undefined | null): TrangThaiKho {
  if (!tho) {
    return { daNhanAnh: true, anhTheoKhoi: null, anhNguyenKhoi: {}, conDangMang: false };
  }

  const anhTheoKhoi: Partial<Record<KhoiTheoId, Record<string, string>>> = {};
  for (const khoi of KHOI_THEO_ID) {
    anhTheoKhoi[khoi] = chupAnh(khoi, tuMap<Record<string, unknown>>(tho[khoi]));
  }

  const anhNguyenKhoi: Record<string, string> = {};
  for (const k of KHOA_NGUYEN_KHOI) {
    if (tho[k] !== undefined) anhNguyenKhoi[k] = chuoiOnDinh(tho[k]);
  }

  return {
    daNhanAnh: true,
    anhTheoKhoi,
    anhNguyenKhoi,
    conDangMang: KHOI_THEO_ID.some((khoi) => Array.isArray(tho[khoi])),
  };
}

/**
 * Lần lưu này nên ghi thế nào.
 *
 * 🔴 BA TRƯỜNG HỢP BUỘC GHI ĐẦY ĐỦ, mỗi cái một lý do khác hẳn nhau — đừng gộp:
 *   · `chua-nhan-anh`   — chưa biết máy chủ có gì. Hiếm (chỉ trong tích tắc giữa lúc mở app và
 *                         lúc nhận dữ liệu) và ở đây vẫn an toàn ngang cách cũ, không tệ hơn.
 *   · `chua-co-tai-lieu`— máy chủ chưa có tài liệu. Phải TẠO; `updateDoc` không tạo được, gọi
 *                         nó ở đây là ném lỗi và mất trắng lần lưu.
 *   · `con-dang-mang`   — máy chủ còn để mảng. Đây chính là lần CHUYỂN DẠNG, và nó tự chạy khi
 *                         người dùng lưu lần đầu sau khi bật công tắc — không cần công cụ di trú.
 *
 * 🔴 KHÔNG ĐỔI GÌ THÌ TRẢ `bo-qua`. Đây mới là chỗ chữa gốc: mở hồ sơ ra xem rồi đóng lại, hay
 * app tự lưu theo nhịp, trước đây đều đẩy nguyên cả kho lên đè lên tất cả. Không gửi thì không
 * đè được của ai.
 */
export function quyetDinhGhi(tt: TrangThaiKho, sach: Record<string, unknown>): KetQuaGhi {
  if (!tt.daNhanAnh) return { kieu: "day-du", ly: "chua-nhan-anh", ban: sangMapCaKho(sach) };
  if (tt.anhTheoKhoi === null) return { kieu: "day-du", ly: "chua-co-tai-lieu", ban: sangMapCaKho(sach) };
  if (tt.conDangMang) return { kieu: "day-du", ly: "con-dang-mang", ban: sangMapCaKho(sach) };

  const thayDoi: ThayDoi[] = [];
  for (const khoi of KHOI_THEO_ID) {
    thayDoi.push(
      ...tinhThayDoi(khoi, tt.anhTheoKhoi[khoi] ?? {}, tuMap<Record<string, unknown>>(sach[khoi])),
    );
  }

  for (const k of KHOA_NGUYEN_KHOI) {
    const v = sach[k];
    if (v === undefined) continue;
    if (tt.anhNguyenKhoi[k] === chuoiOnDinh(v)) continue;
    thayDoi.push({ duongDan: k, giaTri: v });
  }

  if (thayDoi.length === 0) return { kieu: "bo-qua" };
  return { kieu: "tung-phan", thayDoi };
}

/** Bản đầy đủ ở dạng map — dùng cho lần tạo mới và lần chuyển dạng. */
export function sangMapCaKho(sach: Record<string, unknown>): Record<string, unknown> {
  const ra: Record<string, unknown> = { ...sach };
  for (const khoi of KHOI_THEO_ID) {
    ra[khoi] = sangMap(khoi, tuMap<Record<string, unknown>>(sach[khoi]));
  }
  return ra;
}

// ============================================================
// ĐƯỜNG GHI PHÍA MÁY CHỦ — nhịp 3a (23/09/2026)
//
// 🔴 SỰ CỐ SUÝT XẢY RA, 23/09/2026. Hai route máy chủ (`app-request/de-nghi-moi`,
// `qlk-ctr/phieu-nhan-moi`) đọc dữ liệu bằng `Array.isArray(x) ? x : []`. Khi đợt 2 đổi kho
// sang dạng map, câu đó trả về RỖNG — rồi route ghi đè cả khối bằng đúng một bản ghi mới.
// Đo được lúc phát hiện: 76 đề nghị, 18 đơn hàng, 15 phiếu nhận đều nằm trong tầm ghi đè.
// Chưa nổ vì chưa ai bấm Lưu kể từ khi bật công tắc. Công tắc đợt 2 đã tắt ngay lúc đó.
//
// ✅ CÁCH CHỮA: route GHI THEO ĐÚNG DẠNG MÁY CHỦ ĐANG CÓ, không nhìn công tắc.
//
// 🔴 VÌ SAO KHÔNG NHÌN CÔNG TẮC: công tắc là biến của lúc BUILD, còn dạng dữ liệu là chuyện
// của lúc CHẠY. Hai thứ đó lệch nhau là bình thường — bật công tắc xong vẫn còn người dùng
// bản cũ trong trình duyệt, và ngày tắt công tắc thì dữ liệu vẫn đang ở dạng map. Hỏi thẳng
// dữ liệu thì không bao giờ sai; hỏi công tắc thì sai ngay lần lệch đầu tiên.
//
// ⚠️ XÉT TỪNG KHỐI RIÊNG, không xét cả kho. Trong lúc chuyển đổi, `deNghi` có thể đã sang map
// trong khi `donHang` còn là mảng — gộp lại mà xét là ghi sai một trong hai.
// ============================================================

/**
 * Trả về giá trị đem ghi cho một khối, đúng dạng mà máy chủ đang dùng.
 *
 * ⚠️ HAI DẠNG CÓ HÀNH VI KHÁC HẲN NHAU khi ghi kèm `{ merge: true }`:
 *   · mảng → Firestore **thay cả mảng**, bản ghi nào không có trong mảng là mất.
 *   · map  → Firestore **chỉ trộn thêm**, khoá nào không nhắc tới vẫn còn nguyên.
 * Nên nhánh map an toàn hơn hẳn; nhánh mảng giữ nguyên chỉ vì phải tương thích dữ liệu cũ.
 *
 * Khối CHƯA TỒN TẠI thì ghi dạng mảng — giữ đúng hành vi cũ. Đợt 2 sẽ chuyển sang map ở lần
 * người dùng bấm Lưu đầu tiên; route không tự ý chuyển dạng thay họ.
 */
export function ghiTheoDangHienCo<T>(
  khoi: KhoiTheoId,
  hienCoTho: unknown,
  danhSach: readonly T[],
): T[] | Record<string, T> {
  const laMap = hienCoTho != null && typeof hienCoTho === "object" && !Array.isArray(hienCoTho);
  if (!laMap) return danhSach as T[];
  /* Ép kiểu vì `interface` của TS không có chỉ mục ngầm — cùng lý do với `mangCua`. */
  return sangMap(khoi, danhSach as unknown as Record<string, unknown>[]) as unknown as Record<string, T>;
}

/**
 * Chọn bản GỐC trong một nhóm bản ghi trùng nhau — bản được tạo sớm nhất.
 *
 * 🔴 VÌ SAO CẦN: khi còn là mảng, thứ tự phần tử chính là thứ tự thêm vào, nên `.find(...)`
 * lấy được bản gốc một cách tình cờ. Đổi sang map thì `Object.values` trả theo thứ tự KHOÁ —
 * bản nào ra trước là chuyện của chữ cái, không còn liên quan đến thời gian. Chỗ nào đang
 * ngầm dựa vào thứ tự mảng phải nói rõ tiêu chí ra, nếu không nó đổi kết quả trong im lặng.
 *
 * ⚠️ CÓ THẬT, KHÔNG PHẢI LO XA: đo trên dữ liệu production 23/09/2026 — 12 mã đề xuất đang
 * có nhiều hơn một đề nghị, cao nhất là mã `000000098` với 7 đề nghị.
 *
 * Tiêu chí, theo đúng thứ tự: ngày sớm hơn thắng → mã nhỏ hơn thắng → id nhỏ hơn thắng.
 * Ba tầng để kết quả LUÔN xác định, kể cả khi hai bản cùng ngày cùng mã.
 */
export function chonBanSomNhat<T extends { id?: string; code?: string; ngayDeNghi?: string }>(
  ds: readonly T[],
): T | undefined {
  let tot: T | undefined;
  for (const x of ds) {
    if (!tot) { tot = x; continue; }
    const a = `${x.ngayDeNghi ?? ""}|${x.code ?? ""}|${x.id ?? ""}`;
    const b = `${tot.ngayDeNghi ?? ""}|${tot.code ?? ""}|${tot.id ?? ""}`;
    if (a < b) tot = x;
  }
  return tot;
}
