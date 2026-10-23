// ============================================================
// MÓN MUA THEO FILE ĐÍNH KÈM — Sếp 22/10/2026 chọn "Đề xuất A" (demo https://claude.ai/artifact/WxRMsaPPQumLhDppG3C7WH):
// *"code đi e"*.
//
// Đề nghị có dòng "theo file đính kèm" (vd "Vật tư thi công tạm — File đính kèm — 1 File"): danh sách món nằm trong file,
// Thu mua mua từng món. Món gõ đè lên dòng file đã mang sẵn "Đề nghị dòng N"; món thứ hai trở đi thêm bằng nút [+] ngay
// dưới dòng file thì nay cũng mang số dòng file đó (`DongPO.sttDongFile`) để App Kho xếp món ngay dưới dòng file.
//
// 🔴 `sttDongFile` KHÔNG trừ khối lượng, KHÔNG tính vượt — chỉ là dấu "món này thuộc file nào" gửi sang Kho. Phần khối
// lượng / lý do vượt của dòng file giữ y như cũ (Sếp 22/10/2026 câu B: *"phải ghi lý do"*).
// ============================================================

// Cùng luật với App Kho (QLK CTR `lib/de-nghi-types.ts` → `laDongTheoFile`) để hai app hiểu "dòng file" như nhau:
// chữ "file / đính kèm" ở ĐVT là dòng file bất kể SL ("File", "Theo file đính kèm", "Slot (Theo file đính kèm)"); chữ đó ở
// tên / quy cách hay ĐVT "lô" chỉ tính khi SL = 1. KHÁC `laDongTheoFile` của nhan-ban-chia-cot.ts (luật chia cột nhân bản,
// rộng hơn) — cố ý không dùng chung: dòng Thu mua coi là file mà Kho không coi là file thì món sẽ bị Kho gắn nhầm.
const CHU_THEO_FILE = /theo file|đính kèm|dinh kem|\bfile\b/;

export function laDongDeNghiTheoFile(d: {
  tenVatLieu?: string;
  quyCach?: string;
  donViTinh?: string;
  khoiLuongDeNghi?: number;
}): boolean {
  // NFC: chữ gõ kiểu dấu tách rời (máy Mac) vẫn nhận ra.
  const dvt = (d.donViTinh ?? "").normalize("NFC").trim().toLowerCase();
  if (CHU_THEO_FILE.test(dvt)) return true;
  if (Number(d.khoiLuongDeNghi) !== 1) return false;
  return dvt === "lô" || CHU_THEO_FILE.test(`${d.tenVatLieu ?? ""} ${d.quyCach ?? ""}`.normalize("NFC").toLowerCase());
}

// Chuẩn hoá CHÉP ĐÚNG App Kho (`chuanHoaChuoi`, QLK CTR lib/cong-trinh-matching.ts) — Kho dùng nó để quyết định dòng PO
// nào là "tiêu đề nhóm" (`laDongPOTieuDeFile`). Lệch nhau (vd giữ dấu ở đây, bỏ dấu ở Kho) là NV gõ lại tên không dấu sẽ
// lọt chốt bên này mà Kho vẫn coi là tiêu đề (QA lần 5).
const chuanHoa = (s: string | undefined) =>
  (s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/[–—/]/g, "-")
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/**
 * ★ Sếp 23/10/2026 (phương án 1 — *"tiếp tục đi e"* theo đề xuất): dòng file của đề nghị đang để NGUYÊN trên đơn
 * (cùng tên + ĐVT với dòng đề nghị, vd "Vật tư thi công tạm · 1 File") mà bên dưới đã có món của chính file đó
 * (`sttDongFile`, chưa bỏ liên kết) → KHÔNG cho lưu: người lập phải gõ món đầu tiên ĐÈ lên dòng file.
 *
 * 🔴 VÌ SAO: App Kho coi dòng để nguyên đó là TIÊU ĐỀ NHÓM (không phải nhập), còn Thu mua vẫn coi là một món phải giao
 * về — PO mãi "chưa giao đủ", không bấm Hoàn thành được, lại bị bắt đơn giá cho một dòng không phải hàng. Gõ đè thì
 * hai app hiểu như nhau. Trả về số dòng (theo phiếu đang lập đơn) của các dòng file vướng.
 */
export function dongFileConNguyenCoMon(
  dong: readonly { laGhiChu?: boolean; sttDeNghi?: number; sttDongFile?: number; boFile?: boolean; tenHang: string; dvt: string }[],
  dongDeNghi: (stt: number) => { tenVatLieu: string; donViTinh: string } | undefined,
  laSttDongFile: (stt: number) => boolean,
): number[] {
  const coMon = new Set(
    dong
      .filter((d) => !d.laGhiChu && d.sttDeNghi === undefined && typeof d.sttDongFile === "number" && !d.boFile && d.tenHang.trim())
      .map((d) => d.sttDongFile as number),
  );
  const ra: number[] = [];
  for (const d of dong) {
    if (d.laGhiChu || typeof d.sttDeNghi !== "number" || d.sttDeNghi <= 0 || !coMon.has(d.sttDeNghi)) continue;
    if (!laSttDongFile(d.sttDeNghi)) continue;
    const goc = dongDeNghi(d.sttDeNghi);
    if (!goc) continue;
    if (chuanHoa(d.tenHang) === chuanHoa(goc.tenVatLieu) && chuanHoa(d.dvt) === chuanHoa(goc.donViTinh) && !ra.includes(d.sttDeNghi)) {
      ra.push(d.sttDeNghi);
    }
  }
  return ra;
}

/**
 * Dòng chèn bằng [+] ngay dưới `dongTren` thuộc dòng file nào (số dòng của phiếu đang lập đơn) — `undefined` = không.
 *   · `dongTren` là dòng nối đề nghị mà dòng đề nghị đó là dòng file → số dòng đó;
 *   · `dongTren` là món của file (đã mang `sttDongFile`, chưa bị bỏ liên kết) → cùng dòng file (chèn nối tiếp nhiều món);
 *   · còn lại (dòng thường, dòng ghi chú, dòng đã bỏ liên kết, chèn ở đơn độc lập) → không thuộc file.
 */
export function sttDongFileKhiChen(
  dongTren: { laGhiChu?: boolean; sttDeNghi?: number; sttDongFile?: number; boFile?: boolean } | undefined,
  laSttDongFile: (stt: number) => boolean,
): number | undefined {
  if (!dongTren || dongTren.laGhiChu) return undefined;
  if (typeof dongTren.sttDeNghi === "number" && dongTren.sttDeNghi > 0) {
    return laSttDongFile(dongTren.sttDeNghi) ? dongTren.sttDeNghi : undefined;
  }
  return !dongTren.boFile && typeof dongTren.sttDongFile === "number" ? dongTren.sttDongFile : undefined;
}
