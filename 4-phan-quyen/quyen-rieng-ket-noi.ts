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
// ============================================================

import { layIdTokenHienTai } from "@/5-ket-noi/xac-thuc-firebase";
import {
  chuanHoaDauChucDanh,
  chuanHoaQuyenRieng,
  type BanGhiQuyenRiengHienThi,
  type QuyenRieng,
} from "@/4-phan-quyen/quyen-rieng";

/** Chờ tối đa bao lâu mỗi lượt gọi. Quá thì coi là LỖI (không phải "chưa tick"). */
const CHO_TOI_DA_MS = 8000;

async function goi(
  duong: string,
  /** Có thân JSON thì gửi POST, không thì GET. */
  thanJson?: unknown,
): Promise<{ ok: true; than: Record<string, unknown> } | { ok: false; loi: string }> {
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
      return { ok: false, loi: typeof than.error === "string" ? than.error : `Máy chủ trả mã ${res.status}.` };
    }
    if (!than || typeof than !== "object" || than.ok !== true) {
      return { ok: false, loi: "Máy chủ trả dữ liệu sai khuôn." };
    }
    return { ok: true, than };
  } catch (e) {
    console.warn("[quyền riêng] gọi máy chủ hỏng:", e);
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
 * Quyền riêng CÒN HIỆU LỰC của chính người đang đăng nhập (máy chủ đã đối chiếu dấu chức danh).
 * `quyenRieng: null` = chưa được tick riêng. Lỗi → `{ loi }`, xem đầu tệp.
 */
export async function docQuyenRiengCuaToi(): Promise<{ quyenRieng: QuyenRieng | null } | { loi: string }> {
  const kq = await goi("/api/quyen-rieng");
  if (!kq.ok) return { loi: kq.loi };
  if (!("quyenRieng" in kq.than)) return { loi: "Máy chủ trả thiếu thông tin quyền riêng." };
  if (kq.than.quyenRieng === null) return { quyenRieng: null };
  const q = chuanHoaQuyenRieng(kq.than.quyenRieng);
  if (!q) return { loi: "Máy chủ trả quyền riêng sai khuôn." };
  return { quyenRieng: q.quyen };
}

/** Bản đồ quyền riêng của MỌI người, khoá = mã Firebase. Chỉ người có quyền phân quyền đọc được. */
export async function docQuyenRiengTatCa(): Promise<
  { tatCa: Record<string, BanGhiQuyenRiengHienThi> } | { loi: string }
> {
  const kq = await goi("/api/quyen-rieng?tatCa=1");
  if (!kq.ok) return { loi: kq.loi };
  const raw = kq.than.tatCa;
  if (!raw || typeof raw !== "object") return { loi: "Máy chủ trả thiếu danh sách quyền riêng." };
  const tatCa: Record<string, BanGhiQuyenRiengHienThi> = {};
  for (const [uid, b] of Object.entries(raw as Record<string, unknown>)) {
    const d = (b ?? {}) as Record<string, unknown>;
    const q = chuanHoaQuyenRieng(d.quyen);
    const hl = chuanHoaQuyenRieng(d.quyenHieuLuc);
    if (!q || !hl) continue;
    tatCa[uid] = {
      quyen: q.quyen,
      theoChucDanh: chuanHoaDauChucDanh(d.theoChucDanh),
      quyenHieuLuc: hl.quyen,
      lechChucDanh: d.lechChucDanh === true,
      capNhatLuc: typeof d.capNhatLuc === "string" ? d.capNhatLuc : "",
      capNhatBoi: typeof d.capNhatBoi === "string" ? d.capNhatBoi : "",
      capNhatBoiTen: typeof d.capNhatBoiTen === "string" ? d.capNhatBoiTen : undefined,
    };
  }
  return { tatCa };
}

/**
 * MÃ NGHIỆP VỤ của những người đang bị bỏ "Vào app" — cho danh sách "Giao việc cho ai" lọc họ ra
 * (Sếp 26/09/2026 *"Nối vào ô tíck"*). Người có quyền giao việc hoặc phân quyền đọc được.
 */
export async function docNguoiKhongVaoApp(): Promise<{ khongVaoApp: string[] } | { loi: string }> {
  const kq = await goi("/api/quyen-rieng?biKhoa=1");
  if (!kq.ok) return { loi: kq.loi };
  const ds = kq.than.khongVaoApp;
  if (!Array.isArray(ds) || !ds.every((x) => typeof x === "string")) {
    return { loi: "Máy chủ trả danh sách người bị khoá sai khuôn." };
  }
  return { khongVaoApp: ds as string[] };
}

/**
 * Lưu PHẦN THAY ĐỔI cho nhiều người một lần. `loi: null` = xong, chuỗi = lý do hỏng để hiện thẳng.
 *
 * 📌 Máy chủ kiểm lại toàn bộ luật (`vuongMacTraoQuyen`) và tự ghép với bản đang cất — giao diện kiểm
 * trước chỉ để báo sớm, không phải chốt chặn.
 */
export async function luuQuyenRieng(
  targetUids: string[],
  thayDoi: QuyenRieng,
): Promise<{ loi: string } | { loi: null; soDaGhi: number; soGiuNguyen: number }> {
  const kq = await goi("/api/quyen-rieng", { targetUids, quyen: thayDoi });
  if (!kq.ok) return { loi: kq.loi };
  return {
    loi: null,
    soDaGhi: typeof kq.than.soDaGhi === "number" ? kq.than.soDaGhi : targetUids.length,
    soGiuNguyen: typeof kq.than.soGiuNguyen === "number" ? kq.than.soGiuNguyen : 0,
  };
}
