// ============================================================
// GỬI PO CỦA KHO EQUI SANG APP EQUI — Liên kết mua hàng EQUI (Sếp duyệt 15/10/2026, "code đi")
//
// Hợp đồng kết nối mục 3: *"EQUI làm Y NHƯ luồng HPCons đang chạy"*. App EQUI đóng đúng vai "App
// Kho" cho các đề xuất nhóm "(EQUI)", nên khuôn dữ liệu dùng LẠI NGUYÊN VĂN khuôn đang gửi QLK CTR
// — chỉ khác ĐỊA CHỈ + KHOÁ. Đường đi:
//
//   trình duyệt Thu mua (kho EQUI) → route máy chủ CỦA CHÍNH THU MUA (/api/equi/gui-po*, giữ khoá)
//     → App EQUI (POST {EQUI_API_URL}/api/app-mua-hang/po-moi | po-doc-lap)
//
// Bốn hàm dưới đây CÙNG CHỮ KÝ, CÙNG LUẬT với bốn hàm trong `5-ket-noi/gui-po-qlk-ctr.ts`:
//   · chốt `maDeXuatAppRequest` (PO có đề nghị),
//   · chốt hồ sơ phòng ban qua `laHoSoPhongBan` / `laPOCuaHoSoPhongBan` (DÙNG LẠI hàm export của
//     tệp gốc, không viết lại phép nhận diện),
//   · payload y hệt, cắt lỗi y hệt (`catNganLoiQlkCtr`), phân loại lỗi y hệt (`phanLoaiLoiQlkCtr`).
// CHỈ KHÁC route đích: `/api/equi/gui-po` và `/api/equi/gui-po-doc-lap`.
//
// 🔴 KHÔNG SỬA `gui-po-qlk-ctr.ts` — tệp đó thuộc vùng cấm (BAN-DO-MA-NGUON.md §2b-bis, chỉ sửa khi
// Sếp cho phép). Vì `xayDungPayloadPO` / `xayDungPayloadPODocLap` / `xacNhanNhanHangCua` ở đó KHÔNG
// export, ba hàm đó được CHÉP NGUYÊN VĂN xuống đây. Bài kiểm `npm run kiem-kho-equi` gọi THẬT cả hai
// bản (bắt `fetch`) và đòi payload bằng nhau từng byte — một bên đổi mà bên kia không đổi là đỏ.
//
// Các trường đồng bộ trên PO (`qlkCtrSyncStatus`, `qlkCtrSyncedSnapshot`, `qlkCtrSyncError`, mốc thử
// lại…) giữ nguyên tên: hai kho là hai tài liệu tách hẳn, nên ở kho EQUI chúng nghĩa là "đồng bộ với
// App EQUI". Chọn bản nào theo kho: `5-ket-noi/gui-po-theo-kho.ts`.
// ============================================================

import type { DeNghiMuaHang, DonDatHang } from "@/3-du-lieu/kieu-du-lieu";
import { laDongHang } from "@/2-quy-trinh/tinh-toan";
import { laHoSoPhongBan } from "@/2-quy-trinh/ho-so-phong-ban";
import { phanLoaiLoiQlkCtr } from "@/2-quy-trinh/nhip-dong-bo-qlk-ctr";
import { catNganLoiQlkCtr, laPOCuaHoSoPhongBan, type KetQuaGuiQlkCtr } from "@/5-ket-noi/gui-po-qlk-ctr";

/** Route trung chuyển của chính Thu mua (giữ khoá `EQUI_API_KEY`) — xem `app/api/equi/`. */
export const ROUTE_GUI_PO_EQUI = "/api/equi/gui-po";
export const ROUTE_GUI_PO_DOC_LAP_EQUI = "/api/equi/gui-po-doc-lap";

/** Body route trung chuyển trả về (đã chuẩn hoá ở `app/api/equi/_trung-chuyen.ts`). */
type PhanHoiTrungChuyen = { ok?: boolean; error?: string; loaiLoi?: string };

async function docPhanHoi(res: Response): Promise<PhanHoiTrungChuyen> {
  try {
    return (await res.json()) as PhanHoiTrungChuyen;
  } catch {
    return {};
  }
}

// ------------------------------------------------------------
// 🔴🔴 BA HÀM DƯỚI ĐÂY CHÉP TỪ `gui-po-qlk-ctr.ts` (VÙNG CẤM) — HAI BẢN PHẢI GIỐNG HỆT.
// Sửa payload bên đó (có phép Sếp) thì sửa y hệt ở đây, rồi chạy `npm run kiem-kho-equi`: bài
// "payload EQUI = payload QLK CTR" so từng byte cho cả PO có đề nghị lẫn PO độc lập, có/không
// `xacNhanNhanHang`, có/không quy cách, đơn hủy. Lệch một trường là đỏ.
// Chú thích nghiệp vụ của từng trường: đọc ở tệp gốc, không chép lại cho khỏi lệch lời.
// ------------------------------------------------------------

/** Chép từ `gui-po-qlk-ctr.ts` (vùng cấm) — hai bản phải giống hệt. */
function xacNhanNhanHangCua(po: DonDatHang): { xacNhanNhanHang?: { luc: string; nguoi: string } } {
  return po.xacNhanKho ? { xacNhanNhanHang: { luc: po.xacNhanKho.thoiDiem, nguoi: po.xacNhanKho.ten } } : {};
}

/** Chép từ `gui-po-qlk-ctr.ts` (vùng cấm) — hai bản phải giống hệt. */
function xayDungPayloadPO(po: DonDatHang, maDeXuat: string) {
  return {
    maDeXuatAppRequest: maDeXuat,
    poIdThuMua: po.id,
    soPO: po.code,
    ncc: po.supplierTen,
    nccDiaChi: po.diaChiNCC,
    nccMST: po.maSoThueNCC,
    ngayLap: po.ngayLapPO,
    ngayGiao: po.ngayGiaoDuKien,
    ngayGiaoDenNgay: po.ngayGiaoDenNgay,
    canCuHopDong: po.maHopDongCDT,
    diaDiemGiao: po.diaDiemGiaoHang,
    dieuKhoanKhac: po.dieuKhoanKhac,
    nguoiNhan: po.nguoiNhanHangTen,
    nguoiLap: po.nguoiPhuTrachTen,
    daHuy: po.trangThai === "huy",
    ...xacNhanNhanHangCua(po),
    vatTu: po.items
      .filter(laDongHang)
      .map((d) => ({
        stt: d.sttDongDeNghi,
        tenVatTu: d.tenVatLieu,
        ...(d.thongSoKyThuat?.trim() ? { quyCach: d.thongSoKyThuat.trim() } : {}),
        dvt: d.donViTinh,
        soLuongDat: d.khoiLuongDat,
      })),
  };
}

/** Chép từ `gui-po-qlk-ctr.ts` (vùng cấm) — hai bản phải giống hệt. */
function xayDungPayloadPODocLap(po: DonDatHang) {
  return {
    poIdThuMua: po.id,
    maDuAn: po.maDuAn,
    tenCongTrinh: po.tenCongTrinh,
    soPO: po.code,
    ncc: po.supplierTen,
    nccDiaChi: po.diaChiNCC,
    nccMST: po.maSoThueNCC,
    ngayLap: po.ngayLapPO,
    ngayGiao: po.ngayGiaoDuKien,
    ngayGiaoDenNgay: po.ngayGiaoDenNgay,
    canCuHopDong: po.maHopDongCDT,
    diaDiemGiao: po.diaDiemGiaoHang,
    dieuKhoanKhac: po.dieuKhoanKhac,
    nguoiNhan: po.nguoiNhanHangTen,
    nguoiLap: po.nguoiPhuTrachTen,
    daHuy: po.trangThai === "huy",
    ...xacNhanNhanHangCua(po),
    vatTu: po.items
      .filter(laDongHang)
      .map((d) => ({
        tenVatTu: d.tenVatLieu,
        quyCach: d.thongSoKyThuat,
        dvt: d.donViTinh,
        soLuongDat: d.khoiLuongDat,
      })),
  };
}

/** Gửi payload qua route trung chuyển — khuôn y hệt phần thân của hai hàm gửi bên tệp gốc. */
async function guiQuaTrungChuyen(route: string, payload: unknown): Promise<KetQuaGuiQlkCtr> {
  try {
    const res = await fetch(route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await docPhanHoi(res);
    if (!res.ok || !data.ok) {
      return {
        apDung: true,
        thanhCong: false,
        loi: catNganLoiQlkCtr(data.error ?? `HTTP ${res.status}`),
        loaiLoi: phanLoaiLoiQlkCtr(res.status, data.loaiLoi),
      };
    }
    return { apDung: true, thanhCong: true, snapshot: JSON.stringify(payload) };
  } catch (e) {
    return {
      apDung: true,
      thanhCong: false,
      loi: catNganLoiQlkCtr(e instanceof Error ? e.message : "Lỗi không xác định."),
      loaiLoi: "tam_thoi",
    };
  }
}

/**
 * Gửi 1 PO (CÓ đề nghị) của kho EQUI sang App EQUI. Cùng chốt với `guiPOSangQlkCtr`: thiếu
 * `maDeXuatAppRequest` hoặc là hồ sơ phòng ban → `{ apDung: false }`, không gọi gì.
 */
export async function guiPOSangEqui(po: DonDatHang, deNghi: DeNghiMuaHang | undefined): Promise<KetQuaGuiQlkCtr> {
  const maDeXuat = deNghi?.maDeXuatAppRequest;
  if (!maDeXuat) return { apDung: false };
  if (laHoSoPhongBan(deNghi)) return { apDung: false };
  return guiQuaTrungChuyen(ROUTE_GUI_PO_EQUI, xayDungPayloadPO(po, maDeXuat));
}

/** Cặp của `guiPOSangEqui` — CHỐT PHẢI GIỐNG HỆT (lý do ở `canDongBoLaiPO` bên tệp gốc). */
export function canDongBoLaiPOEqui(po: DonDatHang, deNghi: DeNghiMuaHang | undefined): boolean {
  const maDeXuat = deNghi?.maDeXuatAppRequest;
  if (!maDeXuat) return false;
  if (laHoSoPhongBan(deNghi)) return false;
  return JSON.stringify(xayDungPayloadPO(po, maDeXuat)) !== po.qlkCtrSyncedSnapshot;
}

/** Gửi 1 PO ĐỘC LẬP (chưa có đề nghị) của kho EQUI sang App EQUI — cùng chốt với `guiPOSangQlkCtrDocLap`. */
export async function guiPOSangEquiDocLap(po: DonDatHang, deNghi?: DeNghiMuaHang): Promise<KetQuaGuiQlkCtr> {
  if (laPOCuaHoSoPhongBan(po, deNghi)) return { apDung: false };
  return guiQuaTrungChuyen(ROUTE_GUI_PO_DOC_LAP_EQUI, xayDungPayloadPODocLap(po));
}

/** Cặp của `guiPOSangEquiDocLap` — CHỐT PHẢI GIỐNG HỆT. */
export function canDongBoLaiPODocLapEqui(po: DonDatHang, deNghi?: DeNghiMuaHang): boolean {
  if (laPOCuaHoSoPhongBan(po, deNghi)) return false;
  return JSON.stringify(xayDungPayloadPODocLap(po)) !== po.qlkCtrSyncedSnapshot;
}
