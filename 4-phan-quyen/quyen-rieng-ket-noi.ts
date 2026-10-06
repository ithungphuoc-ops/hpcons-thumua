// ============================================================
// GỌI CỬA `/api/quyen-rieng` TỪ TRÌNH DUYỆT — Sếp 26/09/2026 (phân quyền tick chọn)
//
// Tách khỏi `quyen-rieng.ts` vì tệp kia phải THUẦN (route máy chủ và `kiem-luat` cùng nạp nó), còn
// tệp này cần phiên đăng nhập Firebase của trình duyệt (`layIdTokenHienTai`).
//
// 📌 Đặt ở `4-phan-quyen/` thay vì `5-ket-noi/` vì các tệp nối máy chủ sẵn có ở `5-ket-noi/`
// (`ho-so-tai-khoan.ts`…) là vùng của phiên tích hợp (CLAUDE.md §6.6) — không thêm hàm vào đó.
//
// 🔴 PHÂN BIỆT RẠCH RÒI "CHƯA ĐƯỢC TICK" VỚI "KHÔNG ĐỌC ĐƯỢC" (soát chéo 26/09/2026):
//   · Máy chủ trả 200 + `ok: true` + `quyenRieng: null` → chưa được tick riêng → theo chức danh.
//   · MỌI thứ khác (mất mạng, quá hạn, mã khác 2xx, JSON hỏng, thiếu khoá) → `{ loi }`.
// Nơi gọi KHÔNG được coi `{ loi }` là "chưa tick": lúc tải trang, lỗi = không cho vào app (thiếu
// thông tin thì quyền THẤP NHẤT — CLAUDE.md §3.6c); ở màn phân quyền, lỗi = khoá phần tick kèm lý do.
// Bản đầu lấy lỗi làm "dùng quyền chức danh" — tức ai bị bỏ tick "Xem giá" chỉ cần rớt mạng một nhịp
// là thấy lại giá. Đã bỏ.
//
// ★ Sếp 06/10/2026 (mẫu chức danh sửa được — gói D, giao kèo HTTP ở đặc tả 2.5):
//   · Mọi lần LƯU gửi kèm `phienBanMau` (bản mẫu trang đang giữ). Lệch → máy chủ trả 409
//     `maLoi:"mau-doi"`; thiếu → 400 `maLoi:"ban-cu"`. Lỗi trả kèm `maLoi` để màn hình xử đúng ca.
//   · `?tatCa=1` trả thêm `mau` + `canhBaoMau`; mẫu hỏng → 500 `maLoi:"mau-hong"`.
//   · 🔴 MỘT bản ghi đọc không được → CẢ lượt đọc là `{ loi }`. Bản cũ `continue` bỏ qua bản hỏng,
//     khiến người đó hiện là "theo chức danh" — tức màn hình bày quyền RỘNG hơn thật.
// ============================================================

import { layIdTokenHienTai } from "@/5-ket-noi/xac-thuc-firebase";
import {
  chuanHoaBanGhiQuyenRieng,
  chuanHoaQuyenRieng,
  KHOA_TICK,
  type BanGhiQuyenRiengHienThi,
  type QuyenRieng,
} from "@/4-phan-quyen/quyen-rieng";
import { chuanHoaMauChucDanh, type MauChucDanh } from "@/4-phan-quyen/mau-chuc-danh";

/** Chờ tối đa bao lâu mỗi lượt gọi. Quá thì coi là LỖI (không phải "chưa tick"). */
const CHO_TOI_DA_MS = 8000;

/** Mã lỗi máy chủ gửi kèm (đặc tả 2.1) — màn hình xử riêng từng ca. */
export type MaLoiPhanQuyen = "mau-doi" | "ban-cu" | "mau-hong";

const docMaLoi = (x: unknown): MaLoiPhanQuyen | undefined =>
  x === "mau-doi" || x === "ban-cu" || x === "mau-hong" ? x : undefined;

/**
 * Gọi một cửa phân quyền của app (`/api/quyen-rieng`, `/api/quyen-mau-chuc-danh`). Có thân JSON thì
 * POST, không thì GET. Dùng CHUNG cho `mau-chuc-danh-ket-noi.ts` — một chỗ xử vé, hẹn giờ, JSON hỏng.
 */
export async function goiMayChuPhanQuyen(
  duong: string,
  thanJson?: unknown,
): Promise<
  | { ok: true; than: Record<string, unknown> }
  | { ok: false; loi: string; maLoi?: MaLoiPhanQuyen; mauHong?: boolean }
> {
  /* `AbortController` + `setTimeout` chứ không `AbortSignal.timeout` — trình duyệt cũ (Safari < 16)
     chưa có hàm đó, gọi vào là ném lỗi ngay, tức ai dùng máy cũ cũng bị chặn vào app. */
  const huy = new AbortController();
  const hen = setTimeout(() => huy.abort(), CHO_TOI_DA_MS);
  try {
    /* Lấy vé TRONG `try`: hỏng ở đây (Firebase chưa sẵn, mạng) cũng phải thành `{ loi }`, không được
       ném ra ngoài làm hỏng cả lượt tải trang. */
    const token = await layIdTokenHienTai();
    if (!token) {
      return { ok: false, loi: "Chưa đăng nhập, hoặc phiên đăng nhập đã hết hạn. Tải lại trang rồi thử lại." };
    }
    const res = await fetch(duong, {
      method: thanJson === undefined ? "GET" : "POST",
      headers:
        thanJson === undefined
          ? { Authorization: `Bearer ${token}` }
          : { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: thanJson === undefined ? undefined : JSON.stringify(thanJson),
      /* Không để một cửa treo giữ chân cả lượt tải trang — quá hạn thì báo lỗi rõ ràng. */
      signal: huy.signal,
      cache: "no-store",
    });
    let than: Record<string, unknown>;
    try {
      than = (await res.json()) as Record<string, unknown>;
    } catch {
      /* 🔴 JSON hỏng KHÔNG được coi là `{}` — `{}` đọc ra `quyenRieng` trống, tức "chưa tick". */
      return { ok: false, loi: `Máy chủ trả dữ liệu không đọc được (mã ${res.status}).` };
    }
    if (!res.ok) {
      const maLoi = docMaLoi(than?.maLoi);
      return {
        ok: false,
        loi: typeof than?.error === "string" ? than.error : `Máy chủ trả mã ${res.status}.`,
        ...(maLoi ? { maLoi } : {}),
        ...(maLoi === "mau-hong" ? { mauHong: true } : {}),
      };
    }
    if (!than || typeof than !== "object" || than.ok !== true) {
      return { ok: false, loi: "Máy chủ trả dữ liệu sai khuôn." };
    }
    return { ok: true, than };
  } catch (e) {
    console.warn("[phân quyền] gọi máy chủ hỏng:", e);
    return {
      ok: false,
      loi: huy.signal.aborted
        ? `Máy chủ không trả lời sau ${CHO_TOI_DA_MS / 1000} giây.`
        : "Không kết nối được máy chủ. Kiểm tra lại mạng rồi thử lại.",
    };
  } finally {
    clearTimeout(hen);
  }
}

/**
 * Quyền riêng CÒN HIỆU LỰC của chính người đang đăng nhập — máy chủ đã gộp mẫu chức danh + ngoại lệ
 * (đủ 18 ô). `quyenRieng: null` = chức danh không có ô đè mẫu VÀ chưa được tick riêng. Lỗi → `{ loi }`
 * (kèm `maLoi:"mau-hong"` khi mẫu chức danh hỏng), xem đầu tệp.
 */
export async function docQuyenRiengCuaToi(): Promise<
  { quyenRieng: QuyenRieng | null } | { loi: string; maLoi?: MaLoiPhanQuyen }
> {
  const kq = await goiMayChuPhanQuyen("/api/quyen-rieng");
  if (!kq.ok) return { loi: kq.loi, ...(kq.maLoi ? { maLoi: kq.maLoi } : {}) };
  if (!("quyenRieng" in kq.than)) return { loi: "Máy chủ trả thiếu thông tin quyền riêng." };
  if (kq.than.quyenRieng === null) return { quyenRieng: null };
  const q = chuanHoaQuyenRieng(kq.than.quyenRieng);
  if (!q) return { loi: "Máy chủ trả quyền riêng sai khuôn." };
  return { quyenRieng: q.quyen };
}

/**
 * ★ ĐỌC LẠI QUYỀN CỦA CHÍNH MÌNH GIỮA PHIÊN — bổ sung đặc tả D-F2 (06/10/2026). Hàm thuần quyết định làm
 * gì với kết quả `docQuyenRiengCuaToi()` khi đọc lại (tab hiện lại, hoặc ngay sau khi chính mình lưu
 * bảng mẫu / quyền riêng), KHÔNG phải lúc đăng nhập:
 *
 *   · Đọc được → `dat`: thay quyền riêng bằng kết quả máy chủ (kể cả `null` — máy chủ đã nói rõ "không
 *     có lớp đè nào", đó là câu trả lời thật, không phải lỗi).
 *   · Mẫu chức danh HỎNG (`maLoi:"mau-hong"`) → `chan`: xử Y NHƯ LÚC VÀO APP (không cho dùng tiếp, kèm lý
 *     do). Quản trị không gọi cửa này nên vẫn vào được để cứu mẫu.
 *   · Lỗi khác (mạng, quá hạn, máy chủ trả lỗi) → `giu`: GIỮ quyền đang có. 🔴 KHÔNG đặt `null` — `null`
 *     là "theo công thức chức danh", có thể RỘNG hơn quyền đang có (người vừa bị bỏ "Xem giá" mất mạng
 *     một nhịp là thấy lại giá). Giữ quyền đang có không nới thêm gì: nó là kết quả máy chủ trả ở lần
 *     đọc thành công gần nhất.
 */
export function ketQuaDocLaiQuyen(
  kq: { quyenRieng: QuyenRieng | null } | { loi: string; maLoi?: MaLoiPhanQuyen },
):
  | { loai: "dat"; quyenRieng: QuyenRieng | null }
  | { loai: "giu"; lyDo: string }
  | { loai: "chan"; lyDo: string } {
  if ("loi" in kq) {
    if (kq.maLoi === "mau-hong") {
      return {
        loai: "chan",
        lyDo: `Chưa đọc được phân quyền của bạn ở app Thu mua: ${kq.loi} Tải lại trang để thử lại.`,
      };
    }
    return { loai: "giu", lyDo: kq.loi };
  }
  return { loai: "dat", quyenRieng: kq.quyenRieng };
}

/** Kết quả đọc toàn bộ quyền riêng + mẫu chức danh (màn Phân quyền). */
export type KetQuaDocQuyenRiengTatCa =
  | { tatCa: Record<string, BanGhiQuyenRiengHienThi>; mau: MauChucDanh; canhBaoMau: string[] }
  | { loi: string; mauHong: boolean };

/**
 * ★ ĐỌC THÂN TRẢ VỀ CỦA `GET /api/quyen-rieng?tatCa=1` — hàm thuần (bài kiểm-luật gọi thật).
 *
 * 🔴 Mọi chỗ không đọc được đều là `{ loi }`, KHÔNG bỏ qua từng phần:
 *   · thiếu `mau` (máy chủ bản cũ, trước gói C) → lỗi, KHÔNG coi là mẫu trống (mẫu trống có thể rộng hơn
 *     mẫu đang cất);
 *   · một bản ghi sai khuôn (`chuanHoaBanGhiQuyenRieng` trả `null`) hoặc `quyenHieuLuc` thiếu ô → lỗi cả
 *     lượt — bỏ qua bản đó là màn hình bày người đó "theo chức danh", rộng hơn thật.
 */
export function chuanHoaKetQuaTatCa(than: Record<string, unknown>): KetQuaDocQuyenRiengTatCa {
  const raw = than.tatCa;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { loi: "Máy chủ trả thiếu danh sách quyền riêng.", mauHong: false };
  }
  if (!("mau" in than)) {
    return {
      loi: "Máy chủ chưa trả mẫu quyền theo chức danh (máy chủ bản cũ?) — tải lại trang sau ít phút.",
      mauHong: false,
    };
  }
  const docMau = chuanHoaMauChucDanh(than.mau);
  if ("loi" in docMau) return { loi: `Mẫu quyền theo chức danh trả về hỏng: ${docMau.loi}`, mauHong: true };
  const canhBaoMau = Array.isArray(than.canhBaoMau)
    ? than.canhBaoMau.filter((x): x is string => typeof x === "string")
    : [];

  const tatCa: Record<string, BanGhiQuyenRiengHienThi> = {};
  for (const [uid, b] of Object.entries(raw as Record<string, unknown>)) {
    const banGhi = chuanHoaBanGhiQuyenRieng(b);
    const d = (b ?? {}) as Record<string, unknown>;
    const hl = chuanHoaQuyenRieng(d.quyenHieuLuc);
    const du18 = hl !== null && hl.boQua.length === 0 && KHOA_TICK.every((k) => typeof hl.quyen[k] === "boolean");
    if (!banGhi || !hl || !du18) {
      return {
        loi: `Bản quyền riêng của một người (mã ${uid}) trả về sai khuôn — không hiện danh sách để khỏi bày quyền sai.`,
        mauHong: false,
      };
    }
    tatCa[uid] = { ...banGhi, quyenHieuLuc: hl.quyen, lechChucDanh: d.lechChucDanh === true };
  }
  return { tatCa, mau: docMau.mau, canhBaoMau: [...new Set([...canhBaoMau, ...docMau.canhBao])] };
}

/** Bản đồ quyền riêng của MỌI người (khoá = mã Firebase) + mẫu chức danh. Chỉ người có quyền phân quyền đọc được. */
export async function docQuyenRiengTatCa(): Promise<KetQuaDocQuyenRiengTatCa> {
  const kq = await goiMayChuPhanQuyen("/api/quyen-rieng?tatCa=1");
  if (!kq.ok) return { loi: kq.loi, mauHong: kq.mauHong === true };
  return chuanHoaKetQuaTatCa(kq.than);
}

/**
 * MÃ NGHIỆP VỤ của những người đang bị bỏ "Vào app" — cho danh sách "Giao việc cho ai" lọc họ ra
 * (Sếp 26/09/2026 *"Nối vào ô tíck"*). Người có quyền giao việc hoặc phân quyền đọc được.
 */
export async function docNguoiKhongVaoApp(): Promise<{ khongVaoApp: string[] } | { loi: string }> {
  const kq = await goiMayChuPhanQuyen("/api/quyen-rieng?biKhoa=1");
  if (!kq.ok) return { loi: kq.loi };
  const ds = kq.than.khongVaoApp;
  if (!Array.isArray(ds) || !ds.every((x) => typeof x === "string")) {
    return { loi: "Máy chủ trả danh sách người bị khoá sai khuôn." };
  }
  return { khongVaoApp: ds as string[] };
}

/** Kết quả một lần lưu quyền riêng. `loi: null` = xong. */
export type KetQuaLuuQuyenRiengNguoiDung =
  | { loi: string; maLoi?: MaLoiPhanQuyen }
  | { loi: null; soDaGhi: number; soDaXoa: number; soGiuNguyen: number };

const docKetQuaLuu = (than: Record<string, unknown>, soNguoi: number): KetQuaLuuQuyenRiengNguoiDung => ({
  loi: null,
  soDaGhi: typeof than.soDaGhi === "number" ? than.soDaGhi : soNguoi,
  soDaXoa: typeof than.soDaXoa === "number" ? than.soDaXoa : 0,
  soGiuNguyen: typeof than.soGiuNguyen === "number" ? than.soGiuNguyen : 0,
});

/**
 * Lưu PHẦN THAY ĐỔI cho nhiều người một lần.
 *
 * 📌 Máy chủ kiểm lại toàn bộ luật (`tinhLuuQuyenRieng` → `vuongMacTraoQuyen`) và tự ghép với bản đang
 * cất — giao diện kiểm trước chỉ để báo sớm, không phải chốt chặn.
 * 🔴 `phienBanMau` BẮT BUỘC (đặc tả 2.5): bản mẫu trang đang giữ. Máy chủ so với bản đang cất — lệch là
 * 409 `mau-doi`, không ghi gì (tab cũ dựng nháp theo mẫu cũ có thể trả lại quyền Sếp vừa bỏ ở mẫu).
 */
export async function luuQuyenRieng(
  targetUids: string[],
  thayDoi: QuyenRieng,
  phienBanMau: number,
): Promise<KetQuaLuuQuyenRiengNguoiDung> {
  const kq = await goiMayChuPhanQuyen("/api/quyen-rieng", { targetUids, phienBanMau, quyen: thayDoi });
  if (!kq.ok) return { loi: kq.loi, ...(kq.maLoi ? { maLoi: kq.maLoi } : {}) };
  return docKetQuaLuu(kq.than, targetUids.length);
}

/**
 * ★ "Bỏ quyền riêng — về theo chức danh" (Sếp 06/10/2026): XOÁ bản ghi của những người này, họ đi theo
 * mẫu chức danh. Đi bằng POST cùng cửa (đặc tả 2.1 — không thêm phương thức mới). Máy chủ vẫn hỏi
 * `vuongMacTraoQuyen`: xoá một bản đã bỏ ô chính là trao lại các cờ đó.
 */
export async function boQuyenRieng(
  targetUids: string[],
  phienBanMau: number,
): Promise<KetQuaLuuQuyenRiengNguoiDung> {
  const kq = await goiMayChuPhanQuyen("/api/quyen-rieng", { targetUids, phienBanMau, boQuyenRieng: true });
  if (!kq.ok) return { loi: kq.loi, ...(kq.maLoi ? { maLoi: kq.maLoi } : {}) };
  return docKetQuaLuu(kq.than, 0);
}
