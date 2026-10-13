// ============================================================
// PHIẾU GIAO HÀNG "BỔ SUNG SAU" + THU MUA TỰ IMPORT — Sếp duyệt demo Bản 5 ngày 12/10/2026
// (https://claude.ai/artifact/Kh228SH8uqUf3tFBqD87xJ), chỉ sửa app Thu mua, App Kho giữ nguyên.
//
// Bốn luật Sếp chốt:
//   ① Kho nhập đủ + up phiếu giao → Thu mua phải bấm "Xác nhận nhận hàng" thì hồ sơ mới sang ⑦
//      (bỏ cửa tự nhảy khi hàng về đủ). Hồ sơ đã về đủ TRƯỚC mốc thì giữ luật cũ — không lùi bước.
//   ② Kho chưa nhập (hoặc chưa đủ) → nút "Bổ sung sau" cạnh "Xác nhận nhận hàng" của TỪNG đơn.
//      Mọi đơn của hồ sơ đã xác nhận hoặc đã bổ sung sau thì hồ sơ sang ⑦. Bổ sung sau KHÔNG phải
//      xác nhận nhận hàng: không ghi `xacNhanKho`, nên App Kho vẫn sửa được lần nhập và số lượng
//      vẫn chỉ lấy từ kho.
//   ③ Hồ sơ thanh toán, mục 5 chia hai ô: (1) Kho — phiếu từng lần giao; (2) Thu mua — tích
//      "Import phiếu giao hàng" rồi đính tệp (nhiều tệp). Đã bổ sung sau + tích import + có tệp
//      → bộ hồ sơ dùng phiếu Thu mua; còn lại dùng phiếu Kho. Phiếu Thu mua CHỈ là chứng từ thanh
//      toán: không cộng số lượng, không đổi tiến độ (Sếp nhấn mạnh 12/10/2026).
//   ④ Hoàn thành KHÔNG bắt buộc kho nhập — đơn đã bổ sung sau thì chỉ cần mục 5 có phiếu (Thu mua
//      hoặc Kho). Thẻ trên bảng báo "Kho chưa nhập kho" → "Kho mới nhập X/Y" → "Kho đã nhập — chờ
//      xác nhận nhận hàng", mất khi Thu mua bấm "Xác nhận nhận hàng" (vẫn bấm được sau Hoàn thành).
//
// 🔴 TỆP LÁ — CHỈ `import type`. `tinh-toan.ts` (tệp gốc mọi phép tính, cũng chỉ import kiểu) cần
// đọc mấy hằng/hàm ở đây; thêm một `import` chạy thật vào đây là mở đường vòng import.
// ============================================================

import type { DeNghiMuaHang, DonDatHang, MoTaTep, NgayISO, PhieuNhanHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * Mốc áp luật ① — lần giao (ngày nhận thực tế) TỪ ngày này trở đi thì hàng về đủ KHÔNG còn tự
 * đưa hồ sơ sang ⑦. Sếp chốt 12/10/2026 (lên bản từ 13/10/2026).
 *
 * 🔴 VÌ SAO CÓ MỐC: hồ sơ đang đứng ở ⑦ nhờ luật cũ (hàng về đủ, chưa ai bấm xác nhận) mà áp luật
 * mới ngay thì chúng lùi về ⑥ hàng loạt — Sếp đã được báo trước "hồ sơ đang ở bước 7 giữ nguyên".
 */
export const MOC_PHAI_XAC_NHAN_NHAN_HANG: NgayISO = "2026-10-13";

/**
 * Ngăn tệp RIÊNG của phiếu giao Thu mua tự import (mục 5, ô (2)).
 *
 * 🔴 NGĂN MỚI TINH — không dùng chung `ho_so_thanh_toan` (đang chứa VAT/UNC/phiếu chi, nút "Gỡ" ở
 * đây sẽ xoá nhầm) và không dùng `nhan_hang` (khu đính kèm chung bước ⑥, nơi tệp mang nhãn "Phiếu
 * giao hàng" được tính là bằng chứng của nhánh PHÒNG BAN — `coPhieuGiaoHangPhongBan`). Khoá là chuỗi
 * tự do (`DeNghiMuaHang.tepGiaiDoan`), cùng nếp `BUOC_DINH_KEM_KHAC`.
 */
export const BUOC_PHIEU_GIAO_THU_MUA = "phieu_giao_thu_mua";

/** Nhãn ghi vào tệp + tiêu đề ô — chữ vẽ và chữ lưu là một (ngăn mới, chưa có dữ liệu cũ). */
export const NHAN_TEP_PHIEU_GIAO_THU_MUA = "Phiếu giao hàng (Thu mua import)";

/** Tệp phiếu giao Thu mua đã import (ô (2) của mục 5). */
export function tepPhieuGiaoThuMua(deNghi: Pick<DeNghiMuaHang, "tepGiaiDoan">): MoTaTep[] {
  return deNghi.tepGiaiDoan?.[BUOC_PHIEU_GIAO_THU_MUA] ?? [];
}

/** Đơn này đã bấm "Bổ sung sau" phiếu giao hàng chưa (đơn huỷ không tính). */
export function poDaBoSungSau(po: Pick<DonDatHang, "boSungSauPhieuGiao" | "trangThai">): boolean {
  return Boolean(po.boSungSauPhieuGiao) && po.trangThai !== "huy";
}

/**
 * Đơn đã qua bước nhận hàng chưa — Thu mua ĐÃ xác nhận nhận hàng, HOẶC đã bấm "Bổ sung sau".
 * Đây là điều kiện từng đơn để hồ sơ sang ⑦ theo luật mới.
 */
export function poDaQuaBuocNhanHang(po: Pick<DonDatHang, "xacNhanKho" | "boSungSauPhieuGiao">): boolean {
  return Boolean(po.xacNhanKho) || Boolean(po.boSungSauPhieuGiao);
}

/** Ô (2) mở được chưa — chỉ khi hồ sơ có ít nhất một đơn đã "Bổ sung sau". */
export function moOImportPhieuGiaoThuMua(poCuaDeNghi: Pick<DonDatHang, "boSungSauPhieuGiao" | "trangThai">[]): boolean {
  return poCuaDeNghi.some(poDaBoSungSau);
}

/**
 * Bộ hồ sơ dùng phiếu Thu mua import không — đủ BA điều kiện Sếp chốt: có đơn bổ sung sau, đã tích
 * "Import phiếu giao hàng", và ô (2) có ít nhất một tệp.
 */
export function dungPhieuGiaoThuMua(
  deNghi: Pick<DeNghiMuaHang, "tepGiaiDoan" | "importPhieuGiaoThuMua">,
  poCuaDeNghi: Pick<DonDatHang, "boSungSauPhieuGiao" | "trangThai">[],
): boolean {
  return (
    moOImportPhieuGiaoThuMua(poCuaDeNghi) &&
    Boolean(deNghi.importPhieuGiaoThuMua) &&
    tepPhieuGiaoThuMua(deNghi).length > 0
  );
}

/** Phiếu kho của lần giao này có chứng từ giao nhận (tệp đính kèm hoặc ảnh QLK CTR gửi kèm) không. */
export function phieuKhoCoChungTu(p: Pick<PhieuNhanHang, "tepPhieuGiao" | "anhQlkCtr">): boolean {
  return Boolean(p.tepPhieuGiao) || Boolean(p.anhQlkCtr);
}

/**
 * Hàng về đủ của hồ sơ này có xảy ra TRƯỚC mốc luật mới không (luật ①). Xét các lần giao ĐÃ được
 * tính khối lượng của mọi đơn trong hồ sơ: lần giao mới nhất trước mốc ⇒ hồ sơ đã về đủ dưới luật
 * cũ, giữ nguyên cửa tự sang ⑦.
 *
 * 📌 Không có lần giao nào ⇒ `false` (không có gì để giữ theo luật cũ).
 */
export function veDuTruocMocLuatMoi(phieuDuocTinhCuaHoSo: Pick<PhieuNhanHang, "ngayNhanThucTe">[]): boolean {
  return (
    phieuDuocTinhCuaHoSo.length > 0 &&
    phieuDuocTinhCuaHoSo.every((p) => (p.ngayNhanThucTe ?? "") < MOC_PHAI_XAC_NHAN_NHAN_HANG)
  );
}
