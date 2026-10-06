// ============================================================
// MẪU QUYỀN THEO CHỨC DANH — bảng "chức danh nào mặc định làm được gì" SỬA ĐƯỢC
//
// 🔴 Sếp chốt 06/10/2026 (kế hoạch phân quyền, mục 6 — bốn câu):
//   · Câu 1 = A — bấm thẳng vào bảng mẫu để đổi mặc định cho CẢ chức danh, áp luôn cho người được
//     gán chức danh đó về sau.
//   · Câu 2 = B — cả Trưởng bộ phận sửa được bảng mẫu, GIỚI HẠN ở cột của chức danh mình gán được và
//     dòng (cờ) mình đang có. Quản trị sửa mọi ô không khoá.
//   · Câu 3 = A — người đã có quyền riêng chỉ giữ những ô cố ý tick khác; ô còn lại theo mẫu mới
//     (khuôn ngoại lệ ở `quyen-rieng.ts`).
//   · Câu 4 = B — duyệt hoàn thành đơn giao thiếu kèm lý do (phần tầng ghi, không ở tệp này).
//
// ## LƯU GÌ
// Một tài liệu `quyen-mau-chuc-danh/chung` (KHÔNG tiền tố `tm_`; chỉ Admin SDK ghi):
//   `{ khuon: 1, phienBan, de: { [mã chức danh]: { [khoá tick]: boolean } }, capNhat… }`
// `de` CHỈ chứa ô KHÁC công thức của cột (`quyenCuaVaiTro`). Đặt một ô về đúng công thức là XOÁ ô đó.
// 🔴 Bắt buộc lưu kiểu "chỉ ô lệch": hàm khớp chức danh (`vaiTroKhopVoiHoSo`) không so `capKho` — lưu
// giá trị tuyệt đối thì thủ kho có `capKho = 0` sẽ nhận nhầm cờ kho của cột Thủ kho.
// Tài liệu CHƯA CÓ = mẫu trống bản 0 → app chạy Y HỆT trước 06/10/2026.
//
// ## Ô KHOÁ (máy chủ từ chối kể cả Quản trị) — `lyDoOKhoaMau`
// Cột Quản trị (chốt ② `apDungQuyenRieng`) · cột Ngừng truy cập (chốt ③) · dòng "Vào app" · dòng
// "Xoá đề nghị". Ba dòng không tick (Phân quyền/Nhật ký/Cài đặt quy trình; Xác nhận nhận hàng) chỉ là
// dòng ghi chú `DONG_GHI_CHU_MAU`.
//
// 📌 HÀM THUẦN. Chỉ nạp `quyen`, `quyen-rieng`, `vai-tro-chuan`, `luat-phan-quyen`, `quyen-theo-ho-so` —
// KHÔNG tệp nào trong số đó được nạp ngược tệp này (vòng nạp → `undefined` lúc dựng esbuild cho
// `kiem-luat`). Không nạp gì kéo theo Firebase / React: route máy chủ, kho demo trình duyệt và bài kiểm
// cùng gọi được.
// ============================================================

import {
  ngoaiLeConHieuLuc,
  tinhQuyen,
  type NguoiDung,
  type Quyen,
} from "@/4-phan-quyen/quyen";
import {
  CO_TICK_DUOC,
  DONG_KHOA_MAU,
  KHOA_TICK,
  nhanCoTick,
  quyenTheoChucDanhCoMau,
  rutQuyenRieng,
  type BanGhiQuyenRieng,
  type QuyenRieng,
} from "@/4-phan-quyen/quyen-rieng";
import {
  VAI_TRO_CHUAN,
  quyenCuaVaiTro,
  timVaiTroChuan,
  vaiTroGanDuocBoi,
  vaiTroKhopVoiHoSo,
  type MaVaiTroChuan,
  type VaiTroChuan,
} from "@/4-phan-quyen/vai-tro-chuan";
/* ★ B-F3 (06/10/2026): `coQuyenPhanQuyen` + `duocSuaMauChucDanh` sống ở `luat-phan-quyen.ts` (một chỗ). */
import { capDatDuocToiDa, coQuyenPhanQuyen, duocSuaMauChucDanh } from "@/4-phan-quyen/luat-phan-quyen";
import { duocXacNhanNhanDuHangCuaHoSo } from "@/4-phan-quyen/quyen-theo-ho-so";

/** Collection + mã tài liệu. Mã KHÁC `nhanhang`: rules mở tài liệu con tên đó cho người đã đăng nhập. */
export const BO_SUU_TAP_MAU_CHUC_DANH = "quyen-mau-chuc-danh";
export const MA_TAI_LIEU_MAU_CHUC_DANH = "chung";

/** Ô đè theo từng cột chức danh — chỉ ô KHÁC công thức. */
export type DeMau = Partial<Record<MaVaiTroChuan, QuyenRieng>>;

export interface MauChucDanh {
  khuon: 1;
  /** Tăng 1 mỗi lần lưu, trong giao dịch. Tài liệu chưa có = 0. */
  phienBan: number;
  de: DeMau;
  capNhatLuc?: string;
  /** Mã Firebase người lưu. */
  capNhatBoi?: string;
  capNhatBoiTen?: string;
}

/** Phần thay đổi trình duyệt gửi lên. `null` = đưa ô đó về mặc định gốc (công thức). */
export type ThayDoiMau = Partial<Record<MaVaiTroChuan, Partial<Record<keyof Quyen, boolean | null>>>>;

/** Mẫu trống — tài liệu chưa có. ⚠️ Đừng sửa trực tiếp object này (dùng chung). */
export const MAU_TRONG: MauChucDanh = { khuon: 1, phienBan: 0, de: {} };

/** Hai cột khoá cả cột. */
export const COT_KHOA_MAU: readonly MaVaiTroChuan[] = ["quan_tri", "ngung_truy_cap"];

const tenCot = (ma: string): string => timVaiTroChuan(ma)?.ten ?? ma;

/**
 * Lý do một ô của bảng mẫu bị KHOÁ với MỌI người (kể cả Quản trị), hoặc `null`.
 * Máy chủ từ chối ghi các ô này; `quyenTheoChucDanhCoMau` / `oDeCot` cũng bỏ qua chúng (chặn hai lớp).
 */
export function lyDoOKhoaMau(ma: MaVaiTroChuan, khoa: keyof Quyen): string | null {
  if (!timVaiTroChuan(ma)) return `Không có chức danh mã “${ma}”.`;
  if (ma === "quan_tri") {
    return "Cột “Quản trị hệ thống” khoá: Quản trị luôn đủ mọi quyền, không sửa trên bảng mẫu.";
  }
  if (ma === "ngung_truy_cap") {
    return "Cột “Ngừng truy cập” khoá: tài khoản ngừng truy cập không vào được app, mẫu không mở lại được.";
  }
  if (!KHOA_TICK.includes(khoa)) {
    return `“${String(khoa)}” không phải ô tick được — theo cấp / chức danh, không sửa trên bảng mẫu.`;
  }
  if (khoa === "xemDuocApp") {
    return `Dòng “${nhanCoTick(khoa)}” khoá trên bảng mẫu: theo cấp (từ cấp 1). Muốn chặn một người thì bỏ tick riêng người đó hoặc hạ chức danh về Ngừng truy cập.`;
  }
  if (khoa === "xoaToanBoDuLieu") {
    return `Dòng “${nhanCoTick(khoa)}” khoá trên bảng mẫu: chỉ Quản trị — muốn trao thì Quản trị tick riêng từng người.`;
  }
  return null;
}

/**
 * ★ ĐỌC TÀI LIỆU MẪU từ dữ liệu KHÔNG TIN ĐƯỢC.
 *
 * · `undefined` (tài liệu chưa có) → mẫu trống bản 0.
 * · BÁO LỖI (`{ loi }` → route trả 500 `maLoi:"mau-hong"`) khi: không phải object · `khuon ≠ 1` ·
 *   `phienBan` không phải số nguyên ≥ 0 · `de` hoặc một cột không phải object · khoá thuộc `KHOA_TICK`
 *   mà giá trị không phải boolean. 🔴 Lý do không "bỏ qua cho xong": một ô `false` bị bỏ qua là trả lại
 *   cho cả chức danh đúng quyền Sếp vừa bỏ — đọc lỗi không được thành rộng hơn.
 * · BỎ QUA KÈM CẢNH BÁO (`canhBao[]`): ô lạ mang `true` (cột lạ / khoá lạ) · ô khoá (cột Quản trị /
 *   Ngừng, dòng Vào app / Xoá đề nghị — mang giá trị GÌ cũng bỏ: ô khoá theo công thức, bỏ không làm ai
 *   rộng hơn) · ô trùng công thức.
 * · 🔴 Bổ sung đặc tả B-F5 (06/10/2026): Ô LẠ mang giá trị KHÁC `true` (nhất là `false`) = HỎNG, không bỏ
 *   qua. Lý do: về sau đổi tên khoá / mã chức danh thì ô `false` cất dưới tên CŨ trở thành "ô lạ" — bỏ qua
 *   nó là trả lại im lặng đúng quyền Sếp đã bỏ. Chỉ ô lạ mang `true` là bỏ được (bỏ thì hẹp lại, không
 *   rộng ra).
 */
export function chuanHoaMauChucDanh(
  raw: unknown,
): { mau: MauChucDanh; canhBao: string[] } | { loi: string } {
  if (raw === undefined) return { mau: { ...MAU_TRONG, de: {} }, canhBao: [] };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { loi: "Tài liệu mẫu chức danh không phải object." };
  }
  const d = raw as Record<string, unknown>;
  if (d.khuon !== 1) return { loi: `Khuôn mẫu chức danh lạ (khuon = ${String(d.khuon)}).` };
  if (typeof d.phienBan !== "number" || !Number.isInteger(d.phienBan) || d.phienBan < 0) {
    return { loi: "phienBan của mẫu chức danh không phải số nguyên ≥ 0." };
  }
  if (!d.de || typeof d.de !== "object" || Array.isArray(d.de)) {
    return { loi: "Trường de của mẫu chức danh không phải object." };
  }

  const tick = new Set<string>(KHOA_TICK);
  const de: DeMau = {};
  const canhBao: string[] = [];
  for (const [ma, cotRaw] of Object.entries(d.de as Record<string, unknown>)) {
    if (!cotRaw || typeof cotRaw !== "object" || Array.isArray(cotRaw)) {
      return { loi: `Cột “${ma}” của mẫu chức danh không phải object.` };
    }
    const cot = cotRaw as Record<string, unknown>;
    const vt = timVaiTroChuan(ma);
    /* ① CỘT KHOÁ (Quản trị / Ngừng truy cập): mọi ô là ô khoá → bỏ hết, giá trị gì cũng vậy (B-F5). */
    if (vt && COT_KHOA_MAU.includes(vt.ma)) {
      if (Object.keys(cot).length > 0) canhBao.push(`Bỏ qua cột khoá “${vt.ten}” trong mẫu chức danh.`);
      continue;
    }
    const tenHien = vt?.ten ?? ma;
    const congThuc = vt ? quyenCuaVaiTro(vt) : null;
    const ra: QuyenRieng = {};
    for (const [k, v] of Object.entries(cot)) {
      /* ② DÒNG KHOÁ (Vào app / Xoá đề nghị) ở bất kỳ cột nào → bỏ, giá trị gì cũng vậy (B-F5). */
      if (DONG_KHOA_MAU.includes(k as keyof Quyen)) {
        canhBao.push(`Bỏ qua ô khoá “${nhanCoTick(k as keyof Quyen)}” ở cột “${tenHien}”.`);
        continue;
      }
      /* ③ Ô LẠ (cột lạ hoặc khoá lạ): chỉ bỏ được khi mang `true`; khác `true` là HỎNG (B-F5). */
      if (!congThuc || !tick.has(k)) {
        const viTri = congThuc ? `khoá lạ “${k}” ở cột “${tenHien}”` : `ô “${k}” của cột lạ “${ma}”`;
        if (v !== true) {
          return {
            loi: `Mẫu chức danh có ${viTri} mang giá trị ${JSON.stringify(v)} — ô lạ chỉ được mang true; khác true có thể là quyền Sếp đã bỏ dưới tên cũ, không bỏ qua được.`,
          };
        }
        canhBao.push(`Bỏ qua ${viTri} (đang mang true — bỏ qua không làm ai rộng quyền hơn).`);
        continue;
      }
      /* ④ Ô ĐÃ BIẾT: giá trị phải là boolean — hỏng là dấu hiệu tài liệu bị ghi hỏng, không đọc tiếp. */
      const khoa = k as keyof Quyen;
      if (typeof v !== "boolean") {
        return { loi: `Ô “${ma}.${k}” của mẫu chức danh không phải true/false.` };
      }
      if (v === congThuc[khoa]) {
        canhBao.push(`Bỏ qua ô “${nhanCoTick(khoa)}” ở cột “${tenHien}” vì trùng mặc định gốc.`);
        continue;
      }
      ra[khoa] = v;
    }
    if (vt && Object.keys(ra).length > 0) de[vt.ma] = ra;
  }

  const mau: MauChucDanh = { khuon: 1, phienBan: d.phienBan, de };
  if (typeof d.capNhatLuc === "string") mau.capNhatLuc = d.capNhatLuc;
  if (typeof d.capNhatBoi === "string") mau.capNhatBoi = d.capNhatBoi;
  if (typeof d.capNhatBoiTen === "string") mau.capNhatBoiTen = d.capNhatBoiTen;
  return { mau, canhBao };
}

/**
 * ★ ĐỌC MẪU KÈM DẤU VẾT TỪ BẢN GHI QUYỀN RIÊNG — bổ sung đặc tả B-F8 (06/10/2026). Máy chủ (gói C) và
 * kho demo đọc mẫu QUA HÀM NÀY, không gọi thẳng `chuanHoaMauChucDanh`.
 *
 * 🔴 Tài liệu mẫu VẮNG chưa chắc là "chưa ai sửa mẫu": ai đó xoá tài liệu ở console thì đọc thành mẫu
 * trống → mọi chức danh về công thức → RỘNG hơn mẫu Sếp đã siết, không một dòng báo. Bản ghi khuôn 2 cất
 * `phienBanMau` lúc lưu: mẫu vắng mà có bản ghi mang `phienBanMau ≥ 1` → mẫu đã từng có → coi như HỎNG
 * (`{ loi }` → route 500 `mau-hong`, người không phải Quản trị bị chặn vào app; Quản trị cứu được).
 *
 * Mẫu vắng và không có dấu vết nào → mẫu trống bản 0 (như đặc tả 2.3). ⚠️ Giới hạn: mẫu bị xoá khi chưa
 * có bản ghi khuôn 2 nào mang `phienBanMau ≥ 1` thì không phát hiện được bằng dấu vết này.
 *
 * @param banGhi Các bản ghi quyền riêng nơi gọi ĐÃ ĐỌC trong cùng lượt (GET của mình: bản của mình;
 *               `?tatCa=1` / POST: mọi bản đã đọc). BẮT BUỘC truyền — `[]` tường minh khi chưa đọc bản nào.
 */
export function docMauChucDanh(
  raw: unknown,
  banGhi: readonly (Pick<BanGhiQuyenRieng, "phienBanMau"> | null | undefined)[],
): { mau: MauChucDanh; canhBao: string[] } | { loi: string } {
  if (raw === undefined) {
    const vet = banGhi.reduce((m, b) => Math.max(m, typeof b?.phienBanMau === "number" ? b.phienBanMau : 0), 0);
    if (vet >= 1) {
      return {
        loi: `Không thấy tài liệu mẫu quyền theo chức danh, nhưng có bản quyền riêng lưu theo mẫu bản ${vet} — mẫu có thể đã bị xoá. Không đọc thành mẫu trống (sẽ rộng quyền hơn mẫu đã lưu).`,
      };
    }
  }
  return chuanHoaMauChucDanh(raw);
}

/**
 * `phienBan` cho ĐƯỜNG CỨU MẪU HỎNG — bổ sung đặc tả B-F9 (06/10/2026): `phienBan` CHỈ TĂNG.
 *
 * = max(`phienBan` thô + 1 nếu là số nguyên ≥ 0, số GIÂY epoch của `luc`). Lý do: mẫu hỏng/bị xoá thì
 * không biết bản cuối là mấy; đặt lại 1 là tab cũ đang giữ bản 5 có thể trùng số với bản sau cứu vài lần
 * lưu và LỌT chốt 409 — gửi bản nháp dựng theo mẫu cũ. Số giây epoch luôn lớn hơn mọi bản lưu tay.
 *
 * @param luc Thời điểm máy chủ (ISO). Không đọc được thì chỉ còn vế `phienBan` thô + 1 (hoặc 1).
 */
export function phienBanCuuMauHong(raw: unknown, luc: string): number {
  const tho =
    raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>).phienBan : undefined;
  const tuTho = typeof tho === "number" && Number.isInteger(tho) && tho >= 0 ? tho + 1 : 1;
  const giay = Math.floor(Date.parse(luc) / 1000);
  return Number.isFinite(giay) && giay > tuTho ? giay : tuTho;
}

/** Ô đè DÙNG ĐƯỢC của một cột (bỏ cột khoá, ô khoá, khoá lạ). Không có ô nào → `null`. */
export function oDeCot(mau: MauChucDanh, ma: MaVaiTroChuan): QuyenRieng | null {
  if (COT_KHOA_MAU.includes(ma)) return null;
  const cot = mau.de[ma];
  if (!cot) return null;
  const ra: QuyenRieng = {};
  for (const k of KHOA_TICK) {
    if (DONG_KHOA_MAU.includes(k)) continue;
    const v = cot[k];
    if (typeof v === "boolean") ra[k] = v;
  }
  return Object.keys(ra).length > 0 ? ra : null;
}

/**
 * Ô đè mẫu áp cho MỘT HỒ SƠ. Khớp chức danh bằng ĐÚNG hàm gắn nhãn của màn Phân quyền
 * (`vaiTroKhopVoiHoSo`, ba trường `chucNang + vaiTro + capTM`).
 *
 * → `null` khi: Quản trị (`vaiTro === "admin"` — chốt ②) · hồ sơ "Tùy chỉnh" (không khớp chức danh nào:
 * theo công thức trong mã) · cột khoá · cột không có ô đè.
 */
export function oDeCuaHoSo(
  mau: MauChucDanh,
  nd: Pick<NguoiDung, "chucNang" | "vaiTro" | "capTM">,
): QuyenRieng | null {
  if (nd.vaiTro === "admin") return null;
  const vt = vaiTroKhopVoiHoSo(nd);
  if (!vt) return null;
  return oDeCot(mau, vt.ma);
}

/** Quyền của MỘT CỘT sau khi gộp mẫu (công thức + ô đè). Bảng mẫu và mô tả chức danh dùng hàm này. */
export function quyenCuaVaiTroCoMau(v: VaiTroChuan, mau: MauChucDanh): Quyen {
  return quyenTheoChucDanhCoMau(quyenCuaVaiTro(v), oDeCot(mau, v.ma));
}

/** Câu chặn khi người có quyền phân quyền nhưng không được sửa bảng mẫu (B-F3) — màn hình và máy chủ dùng chung. */
export const LY_DO_KHONG_SUA_MAU =
  "Bảng mẫu quyền theo chức danh chỉ Quản trị hoặc Trưởng bộ phận Thu mua sửa được — hồ sơ của bạn không khớp chức danh Trưởng bộ phận Thu mua.";

/**
 * ★ AI SỬA ĐƯỢC Ô NÀO CỦA BẢNG MẪU — Sếp 06/10/2026, Câu 2 = B. MỘT HÀM DUY NHẤT: màn hình hỏi để khoá ô,
 * máy chủ hỏi lại qua `tinhLuuMauChucDanh` trước khi ghi. Sếp muốn nới thì sửa ĐÚNG hàm này.
 *
 * @param nguoiGoi Hồ sơ người sửa, ĐÃ GỘP mẫu + ngoại lệ (`ganQuyenRiengHieuLuc`) — "cờ mình có" là cờ
 *                 HIỆU LỰC, không phải công thức trơn.
 *
 * Thứ tự:
 *   ① Ô khoá (`lyDoOKhoaMau`) → lý do khoá, kể cả Quản trị.
 *   ② Không có quyền phân quyền → chặn. ②b ★ B-F3 (06/10/2026): có quyền phân quyền nhưng không phải
 *      Quản trị và hồ sơ không khớp chức danh Trưởng bộ phận Thu mua (hồ sơ cấp 3 "Tùy chỉnh") → chặn —
 *      luật ở `duocSuaMauChucDanh` (`luat-phan-quyen.ts`).
 *   ③ Quản trị → sửa mọi ô không khoá.
 *   ④ Cột không thuộc `vaiTroGanDuocBoi(capDatDuocToiDa(nguoiGoi))` → "chỉ Quản trị sửa được".
 *      🔴 BẪY: phải gọi đúng `capDatDuocToiDa(nguoiGoi)` (Trưởng BP = 2). Viết cứng `vaiTroGanDuocBoi(3)`
 *      là cột Trưởng BP lọt vào → Trưởng BP tự sửa mẫu của CHÍNH MÌNH.
 *   ⑤ Người sửa không có cờ đó → chặn CẢ HAI CHIỀU (bật lẫn tắt). ✅ **Sếp XÁC NHẬN 06/10/2026: "Giữ
 *      vậy"** (hỏi: Trưởng BP bị khoá cả bật lẫn tắt ở dòng quyền mình không có?). Lý do gốc: chỉ chặn
 *      bật thì Trưởng BP tắt được "Đính phiếu giao nhận" của cả cột Thủ kho và kho đứng việc. KHÁC luật
 *      tick từng người (`vuongMacTraoQuyen` ⑤ chỉ chặn bật) — cố ý. Đây là chỉ đạo đã chốt: đừng "nới
 *      cho đồng bộ với khối tick" khi chưa có chỉ đạo mới.
 */
export function lyDoKhongSuaOMau(
  nguoiGoi: NguoiDung,
  ma: MaVaiTroChuan,
  khoa: keyof Quyen,
): string | null {
  const khoaO = lyDoOKhoaMau(ma, khoa);
  if (khoaO) return khoaO;
  if (!coQuyenPhanQuyen(nguoiGoi)) return "Bạn không có quyền phân quyền người dùng.";
  if (!duocSuaMauChucDanh(nguoiGoi)) return LY_DO_KHONG_SUA_MAU;
  if (nguoiGoi.vaiTro === "admin") return null;
  const ganDuoc = vaiTroGanDuocBoi(capDatDuocToiDa(nguoiGoi));
  if (!ganDuoc.some((v) => v.ma === ma)) {
    return `Cột “${tenCot(ma)}” chỉ Quản trị sửa được — bạn chỉ sửa được cột của chức danh mình gán được.`;
  }
  // ⑤ — khoá cả hai chiều (xem chú thích trên hàm).
  if (!tinhQuyen(nguoiGoi)[khoa]) {
    return `Bạn không có quyền “${nhanCoTick(khoa)}” nên không sửa được dòng này ở bảng mẫu (cả bật lẫn tắt).`;
  }
  return null;
}

/**
 * ★ LEO QUYỀN QUA GÁN CHỨC DANH — liệt kê MỌI ô của bản mẫu `de` mà Trưởng bộ phận chỉ cần gán chức danh
 * là trao được quyền mình không có.
 *
 * Trưởng bộ phận gán được chức danh `v` cho người khác (`vaiTroGanDuocBoi`, `/api/phan-quyen` gác theo
 * cấp tĩnh). Nếu mẫu cho cột `v` một cờ mà cột Trưởng BP (sau khi gộp mẫu) KHÔNG có, thì Trưởng BP chỉ
 * cần gán `v` là trao được quyền mình không có — đúng lỗ hổng 18/08/2026 (`chiQuanTriGan` ở
 * `vai-tro-chuan.ts`), chỉ đổi đường vào.
 *
 * · Chỉ xét ô BẬT NHỜ MẪU (công thức của cột không có). Cờ công thức đã cho sẵn thì miễn — vd "Đính
 *   phiếu giao nhận" của Thủ kho: đó là hiện trạng trước 06/10.
 * · Xét cả khi Quản trị chỉ BỚT một cờ ở cột Trưởng BP (cột khác đang được thêm cờ đó → có trong danh sách).
 *
 * ★ Bổ sung đặc tả B-F4 (06/10/2026, Sếp *"Quản trị sửa tất"*): danh sách này KHÔNG chặn Quản trị — với
 * Quản trị nó thành CẢNH BÁO trong hộp xác nhận (`tinhLuuMauChucDanh` → `canhBao`). Với Trưởng BP chỉ chặn
 * ô MỚI sinh ra ở lần lưu đó (ô Quản trị đã chấp nhận từ trước không làm Trưởng BP kẹt) — xem chú thích ở
 * `tinhLuuMauChucDanh`.
 * ⚠️ Chỗ hở còn lại nằm ở `/api/phan-quyen` (vùng cấm, phiên tích hợp): Trưởng BP có ngoại lệ riêng
 * thiếu cờ vẫn gán chức danh được — phải nhắn phiên tích hợp.
 */
export function danhSachLeoQuyenQuaGanChucDanh(
  de: DeMau,
): { ma: MaVaiTroChuan; khoa: keyof Quyen; cau: string }[] {
  const mau: MauChucDanh = { khuon: 1, phienBan: 0, de };
  const tbp = timVaiTroChuan("truong_bo_phan_thu_mua");
  /* Không tìm thấy cột Trưởng BP thì không đối chiếu được → coi MỌI ô bật nhờ mẫu là leo quyền (hẹp). */
  const qTBP = tbp ? quyenCuaVaiTroCoMau(tbp, mau) : null;
  /* Cấp Trưởng BP đặt được — lấy bằng CHÍNH `capDatDuocToiDa`, để Sếp nới luật cấp ở đó thì chốt này
     tự đi theo, không lệch. */
  const capTBP = tbp
    ? capDatDuocToiDa({
        uid: "",
        tenHienThi: "",
        chucDanh: "",
        phongBan: "",
        chucNang: tbp.chucNang,
        vaiTro: tbp.vaiTro,
        capTM: tbp.capTM,
        capKho: tbp.capKho,
      })
    : 2;
  const ra: { ma: MaVaiTroChuan; khoa: keyof Quyen; cau: string }[] = [];
  for (const v of vaiTroGanDuocBoi(capTBP)) {
    if (COT_KHOA_MAU.includes(v.ma)) continue;
    const congThuc = quyenCuaVaiTro(v);
    const coMau = quyenCuaVaiTroCoMau(v, mau);
    for (const k of KHOA_TICK) {
      if (coMau[k] && !congThuc[k] && !(qTBP?.[k] ?? false)) {
        const nhan = nhanCoTick(k);
        ra.push({
          ma: v.ma,
          khoa: k,
          cau: `Cột “${v.ten}” đang được thêm “${nhan}” mà cột Trưởng bộ phận không có — Trưởng bộ phận gán chức danh “${v.ten}” là trao được quyền “${nhan}” mà Trưởng bộ phận không có.`,
        });
      }
    }
  }
  return ra;
}

/**
 * Có ô leo quyền nào không (câu của ô đầu tiên, hoặc `null`) — dạng gọn của
 * `danhSachLeoQuyenQuaGanChucDanh`. ★ B-F4: hàm này CHỈ BÁO, không quyết định chặn ai — chặn hay cảnh báo
 * là việc của `tinhLuuMauChucDanh`.
 */
export function vuongMacLeoQuyenQuaGanChucDanh(de: DeMau): string | null {
  return danhSachLeoQuyenQuaGanChucDanh(de)[0]?.cau ?? null;
}

/** Ba việc bắt buộc của quy trình — mẫu bỏ hết khỏi mọi chức danh thì cảnh báo (không chặn). */
const VIEC_BAT_BUOC: readonly (keyof Quyen)[] = ["phanBoCongViec", "xacNhanTruongBP", "lapPO"];

/** Cảnh báo khi một việc bắt buộc không còn chức danh nào (ngoài Quản trị, Ngừng) làm được. */
export function canhBaoViecKhongAiLam(mau: MauChucDanh): string[] {
  const ra: string[] = [];
  for (const k of VIEC_BAT_BUOC) {
    const coAi = VAI_TRO_CHUAN.some(
      (v) => !COT_KHOA_MAU.includes(v.ma) && quyenCuaVaiTroCoMau(v, mau)[k],
    );
    if (!coAi) {
      ra.push(
        `Không còn chức danh nào ngoài Quản trị có “${nhanCoTick(k)}” — việc này sẽ chỉ Quản trị làm được.`,
      );
    }
  }
  return ra;
}

/** Hai dòng CHỈ ĐỂ XEM trên bảng mẫu (không tick được). CỐ Ý không nằm trong `CO_TICK_DUOC`. */
export const DONG_GHI_CHU_MAU: readonly { ma: "G1" | "G2"; nhan: string; moTa: string }[] = [
  {
    ma: "G1",
    nhan: "Phân quyền · Nhật ký hệ thống · Cài đặt quy trình",
    moTa:
      "Theo cấp Quản lý (từ cấp 3) hoặc Quản trị. Không tick được. Muốn thu hồi thì hạ chức danh.",
  },
  {
    ma: "G2",
    nhan: "Xác nhận nhận hàng (bước ⑥)",
    /* ★ B-F10 (06/10/2026): nói rõ "cũng từ cấp 2" cho người được chia việc — `laNguoiThuMuaGhiNhanDuoc`
       (`quyen-theo-ho-so.ts`) chặn cấp < 2 TRƯỚC khi xét chia việc. */
    moTa:
      "Luật cố định theo chỉ đạo 17/09/2026: nhân viên hoặc Trưởng bộ phận Thu mua từ cấp 2 có ô “Làm việc thu mua”; hoặc người được chia việc trong chính hồ sơ đó, cũng từ cấp 2. Không tick được.",
  },
];

/**
 * ★ Ô PHỤ THUỘC — bổ sung đặc tả B-F10 (06/10/2026). Ô chỉ có tác dụng khi người đó có thêm một ô khác;
 * giao diện hiện ô mờ kèm câu khi cột / người đang thiếu ô `can`. Mỗi dòng đã đo đường vào thật:
 *   · `taoDeNghi` — nút mở app Đề nghị ở màn Việc của tôi (`viec-cua-toi.tsx`, `quyen.taoDeNghi`); màn đó
 *     gác bằng `xemQuyTrinhMuaHang` (`duocVaoDuongDan` ở `quyen.ts`, tiền tố `/viec-cua-toi`).
 *   · `xoaToanBoDuLieu` — nút xoá đề nghị nằm trong Cài đặt quy trình (`KhoiXoaDuLieuChayThu` ở
 *     `cai-dat-quy-trinh.tsx`); trang đó gác bằng `phanQuyenNguoiDung` (`duocVaoDuongDan`, GĐ2 06/10/2026).
 * Bài kiểm-luật gọi thật `duocVaoDuongDan` và đọc mã hai trang trên để canh hai câu này còn đúng.
 */
const PHU_THUOC_O: Partial<Record<keyof Quyen, { can: keyof Quyen; cau: string }>> = {
  taoDeNghi: {
    can: "xemQuyTrinhMuaHang",
    cau: "Chỉ có tác dụng khi có ô “Vào Quy trình mua hàng”: nút mở app Đề nghị nằm ở màn Việc của tôi, màn đó cần ô này.",
  },
  xoaToanBoDuLieu: {
    can: "phanQuyenNguoiDung",
    cau: "Nút xoá nằm trong Cài đặt quy trình — chỉ người có Phân quyền (cấp Quản lý từ cấp 3, hoặc Quản trị) vào được.",
  },
};

/** Ô `khoa` cần thêm ô nào mới có tác dụng (kèm câu hiện trên màn), hoặc `null` khi không phụ thuộc. */
export function phuThuocCuaO(khoa: keyof Quyen): { can: keyof Quyen; cau: string } | null {
  return PHU_THUOC_O[khoa] ?? null;
}

/** Mã giả để hỏi luật G2 — không trùng mã người thật nào. */
const UID_THU_G2 = "__dong-ghi-chu-g2__";

/**
 * Giá trị một dòng ghi chú ở một cột — TÍNH TỪ LUẬT THẬT, không chép tay.
 *
 * · G1 = `quyenCuaVaiTro(v).phanQuyenNguoiDung` (cờ không tick được, mẫu không đổi được).
 * · G2 = gọi THẬT `duocXacNhanNhanDuHangCuaHoSo` hai lần với hồ sơ giả: không chia việc → "duoc";
 *   chỉ khi được chia việc → "khi-duoc-chia-viec"; không bao giờ → "khong". Người giả mang
 *   `quyenRieng = oDe ? rutQuyenRieng(gocMau) : null` — khớp cách máy chủ gộp, nên mẫu bỏ "Làm việc thu
 *   mua" ở một cột thì dòng G2 cột đó đổi theo. ⚠️ Hàm luật chỉ đọc `items[].nguoiPhuTrachUid` của hồ sơ
 *   (bài kiểm canh): đổi luật mà đọc thêm trường khác thì phải dựng hồ sơ giả đủ hơn.
 */
export function giaTriDongGhiChu(
  ma: "G1" | "G2",
  v: VaiTroChuan,
  mau: MauChucDanh,
): "duoc" | "khi-duoc-chia-viec" | "khong" {
  if (ma === "G1") return quyenCuaVaiTro(v).phanQuyenNguoiDung ? "duoc" : "khong";
  const oDe = oDeCot(mau, v.ma);
  const nd: NguoiDung = {
    uid: UID_THU_G2,
    tenHienThi: "",
    chucDanh: "",
    phongBan: "",
    chucNang: v.chucNang,
    vaiTro: v.vaiTro,
    capTM: v.capTM,
    capKho: v.capKho,
    quyenRieng: oDe ? rutQuyenRieng(quyenCuaVaiTroCoMau(v, mau)) : null,
  };
  type HoSo = Parameters<typeof duocXacNhanNhanDuHangCuaHoSo>[0];
  const khongChia = { items: [], nguoiTheoDoi: [] } as unknown as HoSo;
  const coChia = { items: [{ stt: 1, nguoiPhuTrachUid: UID_THU_G2 }], nguoiTheoDoi: [] } as unknown as HoSo;
  if (duocXacNhanNhanDuHangCuaHoSo(khongChia, nd)) return "duoc";
  if (duocXacNhanNhanDuHangCuaHoSo(coChia, nd)) return "khi-duoc-chia-viec";
  return "khong";
}

/**
 * Ba luật bảng mẫu KHÔNG đổi được — hiện thành dòng ghi chú cố định dưới bảng, để người sửa mẫu không
 * tưởng tick ô là đổi được chúng.
 */
export const GHI_CHU_LUAT_CO_DINH: readonly string[] = [
  `Danh sách “Giao việc cho ai” lọc theo CHỨC DANH, không theo ô tick: việc mua hàng giao cho NV Thu mua; việc xuất kho cho Thủ kho công trình và NV Kho tổng; việc nhân sự cho NV Nhân sự. Tick thêm ô không biến chức danh khác thành người nhận việc.`,
  `Xác nhận nhận hàng (bước ⑥) theo luật cố định — chỉ đạo 17/09/2026: nhân viên hoặc Trưởng bộ phận Thu mua từ cấp 2 có ô “${nhanCoTick("lapPO")}”; hoặc người được chia việc trong chính hồ sơ đó, cũng từ cấp 2.`,
  `Người phụ trách một đơn (hoặc phụ trách một phần việc của đề nghị gốc) luôn duyệt hoàn thành được đơn đó, kể cả khi không có ô “${nhanCoTick("xacNhanTruongBP")}”.`,
];

/**
 * Câu chỉ đạo gắn với một dòng — hiện khi người sửa định đổi ô đó. 🔴 CHỈ chép ngày và câu ĐÃ CÓ trong
 * chú thích khai báo cờ ở `quyen.ts` (taoDeNghi · ghiThanhToan · xemQuyTrinhMuaHang), không tự đặt thêm.
 *
 * ★ B-F10 (06/10/2026): thêm `xemGia` · `xemNhaCungCap` — câu LUẬT đã có trong mã `quyen.ts` (công thức
 * `xemGia` trong `tinhQuyenTheoChucDanh`; khai báo cờ `xemNhaCungCap` trong `Quyen`), kèm đường dẫn mã.
 * Mã KHÔNG ghi ngày chốt cho hai câu này nên ở đây cũng KHÔNG ghi ngày (không bịa). Bài kiểm-luật đọc
 * `quyen.ts` và đòi câu trong ngoặc “…” còn nguyên văn ở đó.
 */
export const CHI_DAO_THEO_DONG: Partial<Record<keyof Quyen, string>> = {
  taoDeNghi:
    "Ban lãnh đạo 12/08/2026: “chức năng đề nghị này hãy tạo cho TOÀN BỘ các tài khoản hiện có” — mọi tài khoản vào được app đều lập được đề nghị.",
  ghiThanhToan:
    "Sếp 18/09/2026 chốt Kế toán + Trưởng phòng; Sếp 19/09/2026 mở thêm cho nhân viên Thu mua từ cấp Nhập liệu: “Vì đa phần công việc này sẽ do nhân viên làm”. Vẫn không mở cho QLDA, Phòng Thi công.",
  xemQuyTrinhMuaHang:
    "Ban lãnh đạo 16/08/2026: “ở tk thủ kho và tk của phòng ban khác thì không được phép thấy quy trình mua hàng, chỉ thấy tiến độ đơn hàng ở tab theo dõi đơn hàng thôi”.",
  xemGia:
    "Luật ghi trong mã (4-phan-quyen/quyen.ts, công thức xemGia trong tinhQuyenTheoChucDanh): “Giá: chỉ thu mua, QLDA, kế toán, BGĐ. Thủ kho và Phòng thi công KHÔNG.” — mã không ghi ngày chốt.",
  xemNhaCungCap:
    "Luật ghi trong mã (4-phan-quyen/quyen.ts, khai báo cờ xemNhaCungCap): “Thấy tên nhà cung cấp. BCH/Phòng thi công KHÔNG thấy.” — mã không ghi ngày chốt.",
};

/**
 * Cột mà BẬT dòng đó lên là đi ngược câu luật ở `CHI_DAO_THEO_DONG` (B-F10). Chỉ cảnh báo khi ô BẬT NHỜ
 * MẪU (công thức của cột không có) — vd Thủ kho vốn thấy nhà cung cấp theo công thức, bật lại không phải
 * đi ngược luật nào.
 */
const COT_CANH_BAO_KHI_BAT: Partial<Record<keyof Quyen, readonly MaVaiTroChuan[]>> = {
  xemGia: ["thu_kho", "phong_thi_cong"],
  xemNhaCungCap: ["thu_kho", "phong_thi_cong"],
};

/**
 * ★ CẢNH BÁO CHỈ ĐẠO KHI ĐỔI MẪU — B-F10 (06/10/2026). Bật "Xem giá" / "Xem nhà cung cấp" cho cột Thủ
 * kho / Phòng Thi công → câu cảnh báo kèm câu luật trong mã, hiện trong hộp xác nhận (`tinhLuuMauChucDanh`
 * gộp vào `canhBao`). CHỈ BÁO, không chặn — Quản trị sửa tất (Câu 2 = B).
 */
export function canhBaoChiDaoKhiDoiMau(mauCu: MauChucDanh, mauMoi: MauChucDanh): string[] {
  const ra: string[] = [];
  for (const [k, cot] of Object.entries(COT_CANH_BAO_KHI_BAT) as [keyof Quyen, readonly MaVaiTroChuan[]][]) {
    for (const ma of cot) {
      const v = timVaiTroChuan(ma);
      if (!v) continue;
      const truoc = quyenCuaVaiTroCoMau(v, mauCu)[k];
      const sau = quyenCuaVaiTroCoMau(v, mauMoi)[k];
      if (!truoc && sau && !quyenCuaVaiTro(v)[k]) {
        ra.push(`Cột “${v.ten}”: bật “${nhanCoTick(k)}” — ${CHI_DAO_THEO_DONG[k] ?? ""}`);
      }
    }
  }
  return ra;
}

/** Mô tả chức danh SINH TỪ QUYỀN THẬT (thay `moTa` viết cứng — mẫu đổi thì mô tả đổi theo). */
export function tomTatQuyenCuaVaiTro(v: VaiTroChuan, mau: MauChucDanh): string {
  if (v.ma === "quan_tri") return "Đủ mọi quyền";
  if (v.ma === "ngung_truy_cap") return "Không vào được app";
  const q = quyenCuaVaiTroCoMau(v, mau);
  const bat = CO_TICK_DUOC.filter((c) => q[c.khoa]).map((c) => c.nhan);
  return `${bat.length}/${KHOA_TICK.length} ô${bat.length > 0 ? `: ${bat.join(", ")}` : ""}`;
}

/**
 * ★ ẢNH HƯỞNG KHI ĐỔI MẪU — để hộp xác nhận nói thật "đổi gì, bao nhiêu người".
 *
 * ★ Bổ sung đặc tả B-F6 (06/10/2026): đếm theo TỪNG Ô đổi, không theo cột. Mỗi cột có ô đổi trả một dòng
 * `{ ma, doi[] }`, mỗi phần tử `doi[]`:
 *   · `soNguoi` — số hồ sơ đang khớp chức danh đó (Quản trị và "Tùy chỉnh" không tính: không nhận mẫu).
 *   · `soGiuNgoaiLe` — trong số đó, bao nhiêu người đang giữ NGOẠI LỆ ĐÚNG Ô NÀY (`k in ngoaiLe` theo
 *     `ngoaiLeConHieuLuc`) — họ KHÔNG đi theo thay đổi ở ô này (Câu 3 = A); ô khác của họ vẫn theo mẫu.
 * 📌 Bản đầu gói B đếm "người có ngoại lệ ở BẤT KỲ ô nào" theo cột — hộp xác nhận nói "1 người giữ ngoại
 * lệ" cho một ô mà người đó thật ra vẫn đi theo. Đã bỏ cách đếm theo cột (giao diện chỉ dùng số theo ô).
 */
export function anhHuongKhiDoiMau(
  mauCu: MauChucDanh,
  mauMoi: MauChucDanh,
  ds: readonly { nd: NguoiDung; banGhi: BanGhiQuyenRieng | null }[],
): {
  ma: MaVaiTroChuan;
  doi: { khoa: keyof Quyen; tu: boolean; sang: boolean; soNguoi: number; soGiuNgoaiLe: number }[];
}[] {
  const ra: ReturnType<typeof anhHuongKhiDoiMau> = [];
  for (const v of VAI_TRO_CHUAN) {
    if (COT_KHOA_MAU.includes(v.ma)) continue;
    const qCu = quyenCuaVaiTroCoMau(v, mauCu);
    const qMoi = quyenCuaVaiTroCoMau(v, mauMoi);
    const khoaDoi = KHOA_TICK.filter((k) => qCu[k] !== qMoi[k]);
    if (khoaDoi.length === 0) continue;
    const nguoi = ds.filter((x) => x.nd.vaiTro !== "admin" && vaiTroKhopVoiHoSo(x.nd)?.ma === v.ma);
    const ngoaiLe = nguoi.map((x) => (x.banGhi ? ngoaiLeConHieuLuc(x.banGhi, x.nd).ngoaiLe : {}));
    const doi = khoaDoi.map((k) => ({
      khoa: k,
      tu: qCu[k],
      sang: qMoi[k],
      soNguoi: nguoi.length,
      soGiuNgoaiLe: ngoaiLe.filter((nl) => Object.prototype.hasOwnProperty.call(nl, k)).length,
    }));
    ra.push({ ma: v.ma, doi });
  }
  return ra;
}
