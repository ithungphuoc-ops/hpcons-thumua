// ============================================================
// SỐ DÒNG ĐỀ NGHỊ GỐC của 1 dòng PO — Sếp 22/10/2026 (demo minh hoạ "số dòng phiếu con",
// https://claude.ai/artifact/RYNTHEEnCXUkZwtfAXg9w3): *"các file đính kèm như hqa làm, nếu thu mua mua
// hàng trong file đính kèm như vậy, thì e dùng cách để bên kho mình gắn đúng"*.
//
// 🔴 LỖI ĐO ĐƯỢC (PDN-000000268, 21/10/2026): phiếu con tách khi giao việc (`tach-khi-giao-viec.ts`) và bản
// nhân bản (`nhan-ban-de-nghi.ts`) ĐÁNH SỐ DÒNG LẠI TỪ 1. PO lập từ phiếu con mang `sttDongDeNghi` = số dòng
// CỦA PHIẾU CON, gửi nguyên sang App Kho → Kho hiểu là số dòng của đề nghị gốc → gắn nhầm (Cống bi lập từ
// dòng 1 của phiếu con = "Vật tư thi công tạm", dòng 3 gốc — Kho cộng vào dòng 1 gốc = Cát).
//
// Hàm này đổi về số dòng của PHIẾU GỐC (= số dòng App Request / App Kho đang dùng), CHỈ dựa vào dữ liệu có
// sẵn trên chính phiếu của PO (không cần cả danh sách phiếu):
//   · Phiếu gốc (không `deNghiChaId`): giữ nguyên; dòng "chia khối lượng" (`sttChiaTu`) trỏ về dòng ban đầu.
//   · Dòng mang `sttDongGoc` (bản nhân bản — luôn trỏ phiếu gốc đầu tiên): dùng luôn.
//   · Phiếu con TRỰC TIẾP của phiếu gốc (`deNghiChaId === deNghiGocId`, vd phiếu con tách khi giao việc):
//     `sttDongCha` chính là số dòng ở phiếu gốc.
//   · Còn lại (dòng thêm thẳng trên phiếu con, phiếu cháu thiếu dấu vết…): `undefined` — KHÔNG đoán. App Kho
//     thiếu số dòng thì khớp theo tên + ĐVT, không khớp thì thành dòng riêng — an toàn hơn gửi một số sai.
//   · Bản nhân bản CŨ (15–17/09/2026) có `deNghiGocId` mà chưa có `deNghiChaId` (QA A-3): KHÔNG phải phiếu gốc —
//     dùng `sttDongGoc` nếu có, không thì không gửi số.
//
// ⚠️ GIỚI HẠN ĐÃ BIẾT (QA A-1): dòng CHIA KHỐI LƯỢNG ở phiếu gốc (vd dòng 5 tách từ dòng 2) rồi mới giao sang phiếu
// con → gửi 5 (số của nửa chia ở phiếu gốc, Kho không có dòng 5) chứ không phải 2. Muốn đúng phải tra phiếu gốc (đổi cả
// 7 chỗ gọi trong `kho-du-lieu.tsx`) — chưa làm. Kho không gắn nhầm: thiếu dòng 5 thì khớp theo tên + ĐVT như thường.
// ============================================================

import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

type PhieuDeTra = Pick<DeNghiMuaHang, "deNghiChaId" | "deNghiGocId"> & {
  items: readonly { stt: number; sttDongCha?: number; sttDongGoc?: number; sttChiaTu?: number }[];
};

export function sttDongDeNghiGoc(phieu: PhieuDeTra | undefined, stt: number | undefined): number | undefined {
  if (typeof stt !== "number" || !phieu) return stt;
  // Chịu được phiếu thiếu `items` (dữ liệu dở / bài kiểm dựng tắt) — không làm hỏng việc gửi PO.
  const dong = (Array.isArray(phieu.items) ? phieu.items : []).find((d) => d.stt === stt);
  if (!phieu.deNghiChaId && !phieu.deNghiGocId) {
    // Phiếu gốc — số dòng đã đúng; nửa "chia khối lượng" (stt nối tiếp) trỏ về dòng ban đầu.
    return typeof dong?.sttChiaTu === "number" ? dong.sttChiaTu : stt;
  }
  if (!dong) return undefined;
  if (typeof dong.sttDongGoc === "number") return dong.sttDongGoc;
  if (phieu.deNghiChaId === phieu.deNghiGocId && typeof dong.sttDongCha === "number") return dong.sttDongCha;
  return undefined;
}
