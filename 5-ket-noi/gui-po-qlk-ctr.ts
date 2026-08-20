// ============================================================
// GỬI PO SANG QLK CTR — Việc 2 (20/08/2026)
//
// Ngược hướng Việc 1 (App Request gọi VÀO Thu mua): ở đây THU MUA là bên gọi ĐI. Nhưng PO được
// lập ở tầng TRÌNH DUYỆT (`kho-du-lieu.tsx` → `themDonHang`, chạy trong React, không phải route
// máy chủ) — gọi thẳng QLK CTR từ trình duyệt thì khóa API phải lộ ra client. Nên đường đi là:
//
//   trình duyệt Thu mua → route máy chủ CỦA CHÍNH THU MUA (/api/qlk-ctr/gui-po, giữ khóa)
//     → QLK CTR (POST /api/app-mua-hang/po-moi)
//
// File này chỉ là phần gọi từ trình duyệt sang route máy chủ của chính app — KHÔNG cầm khóa gì.
// ============================================================

import type { DeNghiMuaHang, DonDatHang } from "@/3-du-lieu/kieu-du-lieu";
import { laDongHang } from "@/2-quy-trinh/tinh-toan";

export type KetQuaGuiQlkCtr =
  | { apDung: false }
  | { apDung: true; thanhCong: true }
  | { apDung: true; thanhCong: false; loi: string };

/**
 * Gửi 1 PO sang QLK CTR — CHỈ gửi khi đề nghị gốc CÓ mã đề xuất App Request (nghĩa là đề nghị
 * đó có công trình và đã đồng bộ ở Việc 1). Đề nghị phòng ban / đơn lập tay trước khi nối Việc 1
 * không có `maDeXuatAppRequest` → trả `{ apDung: false }` NGAY, không gọi gì cả, không phải lỗi —
 * nơi gọi phải PHÂN BIỆT "không áp dụng" với "đã gửi thành công" (đừng gán `qlkCtrSyncStatus`
 * cho PO không liên quan việc này).
 */
export async function guiPOSangQlkCtr(po: DonDatHang, deNghi: DeNghiMuaHang | undefined): Promise<KetQuaGuiQlkCtr> {
  const maDeXuat = deNghi?.maDeXuatAppRequest;
  if (!maDeXuat) return { apDung: false };

  try {
    const res = await fetch("/api/qlk-ctr/gui-po", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        maDeXuatAppRequest: maDeXuat,
        poIdThuMua: po.id,
        soPO: po.code,
        ncc: po.supplierTen,
        nccDiaChi: po.diaChiNCC,
        nccMST: po.maSoThueNCC,
        ngayLap: po.ngayLapPO,
        ngayGiao: po.ngayGiaoDuKien,
        canCuHopDong: po.maHopDongCDT,
        diaDiemGiao: po.diaDiemGiaoHang,
        dieuKhoanKhac: po.dieuKhoanKhac,
        nguoiNhan: po.nguoiNhanHangTen,
        vatTu: po.items
          .filter(laDongHang) // bỏ dòng ghi chú — không có trong đề nghị gốc, QLK CTR tra theo stt sẽ hỏng
          .filter((d) => d.sttDongDeNghi != null)
          .map((d) => ({
            stt: d.sttDongDeNghi,
            tenVatTu: d.tenVatLieu,
            dvt: d.donViTinh,
            soLuongDat: d.khoiLuongDat,
          })),
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      return { apDung: true, thanhCong: false, loi: data.error ?? `HTTP ${res.status}` };
    }
    return { apDung: true, thanhCong: true };
  } catch (e) {
    return { apDung: true, thanhCong: false, loi: e instanceof Error ? e.message : "Lỗi không xác định." };
  }
}
