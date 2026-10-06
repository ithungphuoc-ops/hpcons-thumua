// ============================================================
// GỌI CỬA `/api/quyen-mau-chuc-danh` TỪ TRÌNH DUYỆT — Sếp 06/10/2026 (mẫu chức danh sửa được, Câu 1 = A)
//
// Cùng nếp `quyen-rieng-ket-noi.ts` (đặt ở `4-phan-quyen/` vì `5-ket-noi/ho-so-tai-khoan.ts`… là vùng
// của phiên tích hợp) và dùng CHUNG một hàm gọi `goiMayChuPhanQuyen` — một chỗ xử vé, hẹn giờ, JSON hỏng.
//
// Giao kèo HTTP (đặc tả 2.5, gói C làm phía máy chủ):
//   · `POST { phienBan, thayDoi }` hoặc `POST { veMacDinhToanBo: true, phienBan? }`. Không có GET — đọc
//     mẫu đi cùng `GET /api/quyen-rieng?tatCa=1`.
//   · Thành công: `{ ok: true, phienBan, soODoi, canhBao[] }`.
//   · Lỗi: 400 · 401 · 403 · 409 `maLoi:"mau-doi"` · 500 `maLoi:"mau-hong"`.
//
// 🔴 LUÔN GỬI `phienBan` (bản mẫu trang đang giữ) khi lưu mẫu thường. Tab cũ gửi bản nháp dựng theo mẫu
// cũ là trả lại đúng ô Sếp vừa bỏ — máy chủ so `phienBan` và trả 409. Chỉ ĐƯỜNG CỨU mẫu hỏng (Quản trị,
// mẫu không đọc được) mới được bỏ `phienBan` — không đọc được bản đang cất thì không có gì để so.
// ============================================================

import { goiMayChuPhanQuyen, type MaLoiPhanQuyen } from "@/4-phan-quyen/quyen-rieng-ket-noi";
import type { ThayDoiMau } from "@/4-phan-quyen/mau-chuc-danh";

/** Kết quả một lần lưu mẫu. `loi: null` = xong. */
export type KetQuaLuuMauNguoiDung =
  | { loi: string; maLoi?: MaLoiPhanQuyen }
  | { loi: null; phienBan: number; soODoi: number; canhBao: string[] };

function docKetQua(than: Record<string, unknown>): KetQuaLuuMauNguoiDung {
  if (typeof than.phienBan !== "number") return { loi: "Máy chủ trả thiếu phiên bản mẫu mới." };
  return {
    loi: null,
    phienBan: than.phienBan,
    soODoi: typeof than.soODoi === "number" ? than.soODoi : 0,
    canhBao: Array.isArray(than.canhBao) ? than.canhBao.filter((x): x is string => typeof x === "string") : [],
  };
}

/** Lưu các ô đổi của bảng mẫu. `null` ở một ô = đưa ô đó về mặc định gốc (công thức). */
export async function luuMauChucDanh(phienBan: number, thayDoi: ThayDoiMau): Promise<KetQuaLuuMauNguoiDung> {
  const kq = await goiMayChuPhanQuyen("/api/quyen-mau-chuc-danh", { phienBan, thayDoi });
  if (!kq.ok) return { loi: kq.loi, ...(kq.maLoi ? { maLoi: kq.maLoi } : {}) };
  return docKetQua(kq.than);
}

/**
 * Đưa CẢ bảng mẫu về mặc định gốc — chỉ Quản trị (máy chủ kiểm lại).
 *
 * @param phienBan Bản mẫu trang đang giữ. Bỏ trống CHỈ ở đường cứu mẫu hỏng (mẫu không đọc được nên không
 *                 có bản nào để so) — máy chủ chỉ nhận ca đó khi mẫu đang hỏng thật.
 */
export async function veMacDinhMauToanBo(phienBan?: number): Promise<KetQuaLuuMauNguoiDung> {
  const kq = await goiMayChuPhanQuyen(
    "/api/quyen-mau-chuc-danh",
    phienBan === undefined ? { veMacDinhToanBo: true } : { veMacDinhToanBo: true, phienBan },
  );
  if (!kq.ok) return { loi: kq.loi, ...(kq.maLoi ? { maLoi: kq.maLoi } : {}) };
  return docKetQua(kq.than);
}
