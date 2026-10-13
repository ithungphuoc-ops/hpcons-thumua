// ============================================================
// "BỔ SUNG SAU" PHIẾU GIAO HÀNG — chốt chặn nút + cảnh báo trên thẻ (Sếp duyệt demo Bản 5,
// 12/10/2026). Luật chung và hằng số ở `2-quy-trinh/phieu-giao-thu-mua.ts` (tệp lá).
//
// Tách khỏi tệp lá vì hai hàm dưới cần `tinhTienDoPO` (tinh-toan.ts), mà tinh-toan.ts lại đọc tệp
// lá — để chung một tệp là vòng import.
// ============================================================

import type { DeNghiMuaHang, DonDatHang, PhieuNhanHang } from "@/3-du-lieu/kieu-du-lieu";
import { laHoSoPhongBan } from "@/2-quy-trinh/ho-so-phong-ban";
import { poDaGiaoDu, tinhTienDoPO } from "@/2-quy-trinh/tinh-toan";
import { poDaBoSungSau } from "@/2-quy-trinh/phieu-giao-thu-mua";

/**
 * Đơn này bấm "Bổ sung sau" được không — trả lý do bị chặn, `null` là được.
 *
 * 🔴 MỘT HÀM CHO CẢ NÚT LẪN TẦNG GHI (`boSungSauPhieuGiao` ở `3-du-lieu/kho-du-lieu.tsx`), đúng nếp
 * `vuongMacDonXacNhanNhanHang`: nút hiện mà tầng ghi từ chối (hoặc ngược lại) là bế tắc im lặng.
 *
 * Các ca chặn:
 *   · hồ sơ PHÒNG BAN — không có kho công trình, thu mua tự ghi nhận giao hàng; nút này vô nghĩa;
 *   · đơn đã xác nhận nhận hàng / đã bổ sung sau rồi;
 *   · đơn chưa chốt (`nhap`), chờ gắn đề nghị (`cho_de_nghi`), đã huỷ, đã hoàn thành;
 *   · kho ĐÃ nhập đủ — lúc đó việc đúng là "Xác nhận nhận hàng" (luật ①), không phải bổ sung sau.
 */
export function vuongMacBoSungSau(
  po: DonDatHang,
  deNghi: DeNghiMuaHang | undefined,
  phieuCuaPO: PhieuNhanHang[],
): string | null {
  if (!deNghi) return "Đơn chưa gắn đề nghị mua hàng — gắn đề nghị xong mới bổ sung sau được.";
  if (laHoSoPhongBan(deNghi)) {
    return "Hồ sơ phòng ban không dùng “Bổ sung sau” — thu mua ghi nhận giao hàng kèm phiếu giao.";
  }
  if (po.xacNhanKho) return "Đơn đã được xác nhận nhận hàng rồi.";
  if (po.boSungSauPhieuGiao) return "Đơn đã bấm “Bổ sung sau” rồi.";
  if (po.trangThai === "nhap") return "Đơn còn là bản nháp — chốt đơn rồi mới bổ sung sau được.";
  if (po.trangThai === "cho_de_nghi") {
    return "Đơn đang chờ gắn đề nghị mua hàng — gắn xong đề nghị rồi mới bổ sung sau được.";
  }
  if (po.trangThai === "huy") return "Đơn đã huỷ.";
  if (po.trangThai === "hoan_thanh") return "Đơn đã hoàn thành.";
  if (poDaGiaoDu(tinhTienDoPO(po, phieuCuaPO))) {
    return "Kho đã nhập đủ hàng của đơn này — bấm “Xác nhận nhận hàng” thay cho “Bổ sung sau”.";
  }
  return null;
}

export type CanhBaoKhoBoSungSau = {
  loai: "chua_nhap" | "nhap_mot_phan" | "cho_xac_nhan";
  /** Chữ in trên thẻ bảng quy trình (và khối Hồ sơ thanh toán). */
  chu: string;
};

const so = (n: number) => n.toLocaleString("vi-VN");

/**
 * Cảnh báo "kho chưa xong" của hồ sơ đã đi tiếp nhờ "Bổ sung sau" — Sếp 12/10/2026: thẻ ở cột
 * Hoàn thành hiện "Kho chưa nhập kho" ở dưới cùng; kho nhập xong thì mất. Sếp chốt tắt bằng BẤM TAY:
 * cảnh báo còn cho tới khi thu mua bấm "Xác nhận nhận hàng" (giữ bước Khớp số liệu, và App Kho chỉ
 * chuyển "Đã cấp" sau xác nhận).
 *
 * Chỉ xét đơn ĐÃ bổ sung sau mà CHƯA xác nhận nhận hàng; không có đơn nào như vậy → `null`.
 *   · chưa có lần giao nào được tính → "Kho chưa nhập kho"
 *   · có hàng về nhưng chưa đủ        → "Kho mới nhập X/Y <ĐVT>" (cùng ĐVT) hoặc "đủ a/b dòng"
 *   · đủ hết                           → "Kho đã nhập — chờ xác nhận nhận hàng"
 */
export function canhBaoKhoBoSungSau(
  poCuaDeNghi: DonDatHang[],
  tatCaPhieu: PhieuNhanHang[],
): CanhBaoKhoBoSungSau | null {
  const poCho = poCuaDeNghi.filter((po) => poDaBoSungSau(po) && !po.xacNhanKho);
  if (poCho.length === 0) return null;
  const tienDo = poCho.flatMap((po) => tinhTienDoPO(po, tatCaPhieu.filter((p) => p.poId === po.id)));
  if (tienDo.length === 0) return { loai: "chua_nhap", chu: "Kho chưa nhập kho" };

  const daNhan = tienDo.reduce((s, d) => s + d.khoiLuongDaNhan, 0);
  if (tienDo.every((d) => d.khoiLuongConLai <= 0)) {
    return { loai: "cho_xac_nhan", chu: "Kho đã nhập — chờ xác nhận nhận hàng" };
  }
  if (daNhan <= 0) return { loai: "chua_nhap", chu: "Kho chưa nhập kho" };

  /* Một phần: cùng một ĐVT thì cộng được ("8/16 bộ"); khác ĐVT thì cộng là vô nghĩa → đếm dòng. */
  const dsDvt = [...new Set(tienDo.map((d) => d.donViTinh))];
  if (dsDvt.length === 1) {
    const dat = tienDo.reduce((s, d) => s + d.khoiLuongDat, 0);
    return { loai: "nhap_mot_phan", chu: `Kho mới nhập ${so(daNhan)}/${so(dat)} ${dsDvt[0]}` };
  }
  const dongDu = tienDo.filter((d) => d.khoiLuongConLai <= 0).length;
  return { loai: "nhap_mot_phan", chu: `Kho mới nhập đủ ${dongDu}/${tienDo.length} dòng` };
}
