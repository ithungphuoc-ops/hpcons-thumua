// ============================================================
// CHỌN ĐÍCH GỬI PO THEO KHO — Liên kết mua hàng EQUI (Sếp duyệt 15/10/2026)
//
// Kho thường → QLK CTR (bốn hàm gốc trong `gui-po-qlk-ctr.ts`, KHÔNG đổi gì).
// Kho EQUI   → App EQUI (bốn hàm cùng chữ ký trong `gui-po-equi.ts`).
//
// 🔴 MỘT CHỖ DUY NHẤT QUYẾT ĐỊNH "PO CỦA KHO NÀO ĐI ĐÂU". `3-du-lieu/kho-du-lieu.tsx` lấy bộ hàm ở
// đây theo prop `kho` của `DuLieuProvider` rồi gọi y như trước — không chỗ nào trong kho dữ liệu
// tự viết `kho === "equi" ? … : …` cho việc gửi PO. Hợp đồng chốt: nhóm "(EQUI)" KHÔNG BAO GIỜ gửi
// sang QLK CTR, nên kho EQUI không có đường nào chạm `gui-po-qlk-ctr.ts` để gửi.
//
// 📌 HAI BỘ LÀ HẰNG Ở CẤP MODULE → tham chiếu hàm KHÔNG ĐỔI giữa các lần vẽ. Quan trọng: `apDung`
// trong kho dữ liệu nằm trong danh sách phụ thuộc của effect nối kho chung — hàm gửi đổi tham chiếu
// là app ngắt rồi nối lại kho chung mỗi lần vẽ.
//
// Bài kiểm: `npm run kiem-kho-equi` (gọi thật, bắt `fetch`, đòi đúng route theo kho).
// ============================================================

import type { KhoId } from "@/3-du-lieu/kho-id";
import {
  guiPOSangQlkCtr,
  canDongBoLaiPO,
  guiPOSangQlkCtrDocLap,
  canDongBoLaiPODocLap,
} from "@/5-ket-noi/gui-po-qlk-ctr";
import {
  guiPOSangEqui,
  canDongBoLaiPOEqui,
  guiPOSangEquiDocLap,
  canDongBoLaiPODocLapEqui,
} from "@/5-ket-noi/gui-po-equi";

/** Bộ bốn hàm gửi PO — tên trường giữ đúng tên hàm gốc để nơi gọi không phải đổi chữ nào. */
export interface BoGuiPO {
  guiPOSangQlkCtr: typeof guiPOSangQlkCtr;
  canDongBoLaiPO: typeof canDongBoLaiPO;
  guiPOSangQlkCtrDocLap: typeof guiPOSangQlkCtrDocLap;
  canDongBoLaiPODocLap: typeof canDongBoLaiPODocLap;
}

const BO_GUI_PO_THUONG: BoGuiPO = {
  guiPOSangQlkCtr,
  canDongBoLaiPO,
  guiPOSangQlkCtrDocLap,
  canDongBoLaiPODocLap,
};

const BO_GUI_PO_EQUI: BoGuiPO = {
  guiPOSangQlkCtr: guiPOSangEqui,
  canDongBoLaiPO: canDongBoLaiPOEqui,
  guiPOSangQlkCtrDocLap: guiPOSangEquiDocLap,
  canDongBoLaiPODocLap: canDongBoLaiPODocLapEqui,
};

/** Kho EQUI → bộ gửi App EQUI; mọi giá trị khác (kể cả thiếu) → bộ gốc QLK CTR, đúng hành vi cũ. */
export function boGuiPOTheoKho(kho: KhoId | undefined): BoGuiPO {
  return kho === "equi" ? BO_GUI_PO_EQUI : BO_GUI_PO_THUONG;
}
