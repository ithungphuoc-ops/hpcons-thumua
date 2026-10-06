// ============================================================
// NGUỒN DỮ LIỆU CỦA MÀN PHÂN QUYỀN — chọn MÁY CHỦ THẬT (sso) hay KHO DEMO (tài khoản mẫu)
//
// 🔴 Sếp 06/10/2026: bảng mẫu chức danh + tick quyền riêng phải DEMO ĐƯỢC TRÊN MÁY (chế độ tài khoản mẫu,
// localhost) trước khi đẩy lên. Màn `1-giao-dien/trang/phan-quyen.tsx` chỉ gọi đối tượng trả về từ
// `layNguonPhanQuyen` — KHÔNG tự rẽ nhánh theo chế độ ở từng chỗ gọi (rẽ ở mười chỗ là sớm muộn có chỗ
// quên, và chỗ quên đó ghi thẳng lên máy chủ thật từ máy lập trình, hoặc ngược lại).
//
//   · `sso` (bản thật)  → hồ sơ / danh bạ / gán chức danh qua `5-ket-noi/ho-so-tai-khoan.ts` (phiên tích
//     hợp — chỉ GỌI, không sửa), quyền riêng qua `quyen-rieng-ket-noi.ts`, mẫu qua
//     `mau-chuc-danh-ket-noi.ts`. Máy chủ xác định người gọi bằng vé đăng nhập.
//   · `mau` (tài khoản mẫu) → `3-du-lieu/kho-phan-quyen-demo.ts` (localStorage), CHUNG MỘT kho với
//     `nguoi-dung-hien-tai.tsx` (`layKhoDemo`). Kho tự dựng người gọi từ dữ liệu của nó, chỉ nhận MÃ.
//
// 📌 Ở demo KHÔNG đổi chức danh được (`ganVaiTro` trả câu lý do) — chức danh tài khoản mẫu viết sẵn
// trong mã (`VAI_TRO_MAU`); đổi nó cần ghi hồ sơ, việc của `/api/phan-quyen` (máy chủ thật).
// ============================================================

import { CHE_DO_XAC_THUC } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import type { NguoiDung } from "@/4-phan-quyen/quyen";
import type { QuyenRieng } from "@/4-phan-quyen/quyen-rieng";
import type { ThayDoiMau } from "@/4-phan-quyen/mau-chuc-danh";
import {
  boQuyenRieng as boQuyenRiengMayChu,
  docQuyenRiengTatCa as docQuyenRiengTatCaMayChu,
  luuQuyenRieng as luuQuyenRiengMayChu,
  type KetQuaDocQuyenRiengTatCa,
  type KetQuaLuuQuyenRiengNguoiDung,
} from "@/4-phan-quyen/quyen-rieng-ket-noi";
import {
  luuMauChucDanh as luuMauMayChu,
  veMacDinhMauToanBo as veMacDinhMayChu,
  type KetQuaLuuMauNguoiDung,
} from "@/4-phan-quyen/mau-chuc-danh-ket-noi";
import {
  docDanhBaCongTy,
  docHoSoDePhanQuyen,
  ganVaiTro as ganVaiTroMayChu,
  type HoSoKemMa,
  type LoiGhiHoSo,
  type ThanhVienDanhBa,
} from "@/5-ket-noi/ho-so-tai-khoan";
import { layKhoDemo, type DongLichSuDemo } from "@/3-du-lieu/kho-phan-quyen-demo";

/** Câu trả về khi định đổi chức danh ở bản demo (đặc tả 6 · D2). */
export const LY_DO_DEMO_KHONG_DOI_CHUC_DANH = "Bản demo không đổi chức danh — chỉ thử tick quyền và bảng mẫu.";

export interface NguonPhanQuyen {
  /** `true` = chế độ tài khoản mẫu: dữ liệu chỉ nằm trên trình duyệt này. */
  laDemo: boolean;
  docHoSo(): Promise<HoSoKemMa[]>;
  docDanhBa(): Promise<ThanhVienDanhBa[]>;
  docQuyenRiengTatCa(): Promise<KetQuaDocQuyenRiengTatCa>;
  luuQuyenRieng(uids: string[], thayDoi: QuyenRieng, phienBanMau: number): Promise<KetQuaLuuQuyenRiengNguoiDung>;
  boQuyenRieng(uids: string[], phienBanMau: number): Promise<KetQuaLuuQuyenRiengNguoiDung>;
  luuMau(phienBan: number, thayDoi: ThayDoiMau): Promise<KetQuaLuuMauNguoiDung>;
  /** `phienBan` bỏ trống CHỈ ở đường cứu mẫu hỏng (Quản trị). */
  veMacDinhMauToanBo(phienBan?: number): Promise<KetQuaLuuMauNguoiDung>;
  ganVaiTro(firebaseUid: string, maVaiTro: string): Promise<LoiGhiHoSo>;
  /** Lịch sử demo (mới nhất lên đầu); `null` ở bản thật — lịch sử thật ở Nhật ký hệ thống. */
  lichSuDemo(): DongLichSuDemo[] | null;
  /** Xoá sạch dữ liệu demo phân quyền. `null` = xong; chuỗi = lý do. Bản thật luôn từ chối. */
  xoaDuLieuDemo(): string | null;
}

/**
 * @param nguoiGoi CHỈ dùng `uid` (mã tài khoản mẫu ở demo). Bản thật không dùng: máy chủ đọc người gọi từ
 *                 vé đăng nhập, không tin gì trình duyệt khai.
 */
export function layNguonPhanQuyen(nguoiGoi: Pick<NguoiDung, "uid">): NguonPhanQuyen {
  const kho = CHE_DO_XAC_THUC === "mau" ? layKhoDemo(CHE_DO_XAC_THUC) : null;
  if (kho) {
    const uid = nguoiGoi.uid;
    return {
      laDemo: true,
      docHoSo: async () => kho.docHoSo(),
      docDanhBa: async () => kho.docDanhBa(),
      docQuyenRiengTatCa: async () => kho.docTatCa(uid),
      luuQuyenRieng: async (uids, thayDoi, phienBanMau) =>
        kho.luuQuyenRieng(uid, uids, { loai: "tick", thayDoi }, phienBanMau),
      boQuyenRieng: async (uids, phienBanMau) =>
        kho.luuQuyenRieng(uid, uids, { loai: "bo-quyen-rieng" }, phienBanMau),
      luuMau: async (phienBan, thayDoi) => kho.luuMau(uid, phienBan, thayDoi),
      veMacDinhMauToanBo: async (phienBan) => kho.luuMau(uid, phienBan, "ve-mac-dinh-toan-bo"),
      ganVaiTro: async () => LY_DO_DEMO_KHONG_DOI_CHUC_DANH,
      lichSuDemo: () => kho.lichSu(),
      xoaDuLieuDemo: () => kho.xoaHet(),
    };
  }
  return {
    laDemo: false,
    docHoSo: docHoSoDePhanQuyen,
    docDanhBa: docDanhBaCongTy,
    docQuyenRiengTatCa: docQuyenRiengTatCaMayChu,
    luuQuyenRieng: luuQuyenRiengMayChu,
    boQuyenRieng: boQuyenRiengMayChu,
    luuMau: luuMauMayChu,
    veMacDinhMauToanBo: veMacDinhMayChu,
    ganVaiTro: ganVaiTroMayChu,
    lichSuDemo: () => null,
    xoaDuLieuDemo: () => "Chỉ bản demo (tài khoản mẫu) mới có dữ liệu demo để xoá.",
  };
}
