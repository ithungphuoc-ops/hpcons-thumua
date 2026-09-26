import type { BaoGia, DeNghiMuaHang, DonDatHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * ★★ LUẬT XOÁ HẲN ĐỀ NGHỊ — một chỗ duy nhất, dùng cho cả xoá một phiếu lẫn xoá nhiều phiếu.
 *
 * Sếp 26/09/2026 chốt: *"nếu xoá thì sẽ cho chọn từng cái để xoá, ko được xoá toàn bộ"* — bỏ nút
 * "Xoá toàn bộ dữ liệu của cả phòng", thay bằng chọn từng đề nghị. Vì chọn được nhiều phiếu cùng
 * lúc nên luật phải xét CẢ TẬP đã chọn: phiếu cha và toàn bộ phiếu con cùng được chọn thì xoá
 * được cả cụm; chỉ chọn phiếu cha mà bỏ lại phiếu con thì chặn (bản con mất cha, dòng đã tách
 * hiện lại ở phiếu trên → mua trùng — lý do ghi ở `xoaDeNghi` trong `kho-du-lieu.tsx`).
 *
 * 🔴 Đã phát sinh báo giá / đơn hàng (không tính bản `huy`) thì KHÔNG xoá — chứng từ đó mồ côi,
 * mọi phép tính khối lượng hỏng theo. Cách đóng đúng nghiệp vụ là "Đánh dấu thất bại".
 *
 * @returns lý do không xoá được, hoặc `null` nếu xoá được.
 */
export function lyDoKhongXoaDeNghi(
  prId: string,
  duocChon: ReadonlySet<string>,
  tatCaDeNghi: readonly DeNghiMuaHang[],
  baoGia: readonly Pick<BaoGia, "prId" | "trangThai">[],
  donHang: readonly Pick<DonDatHang, "prId" | "trangThai">[],
): string | null {
  const dn = tatCaDeNghi.find((d) => d.id === prId);
  if (!dn) return "Đề nghị này không còn tồn tại.";
  const coBaoGia = baoGia.some((b) => b.prId === prId && b.trangThai !== "huy");
  const coDonHang = donHang.some((p) => p.prId === prId && p.trangThai !== "huy");
  if (coBaoGia || coDonHang) {
    return "Đã phát sinh bảng báo giá hoặc đơn đặt hàng — xoá sẽ làm các chứng từ đó mồ côi. Dùng “Đánh dấu thất bại” để đóng.";
  }
  const conBoLai = tatCaDeNghi.filter((d) => d.deNghiChaId === prId && !duocChon.has(d.id));
  if (conBoLai.length > 0) {
    return `Còn ${conBoLai.length} bản con chưa chọn xoá (${conBoLai.map((d) => d.code).join(", ")}) — xoá phiếu này sẽ làm các bản đó mất liên kết cha con.`;
  }
  return null;
}

/**
 * Tách tập đã chọn thành phần xoá được và phần bị chặn.
 *
 * ⚠️ LẶP TỚI KHI ỔN ĐỊNH: phiếu con bị chặn (vd đã có đơn hàng) thì phiếu cha của nó — dù được
 * chọn — cũng phải bị chặn theo, vì bản con đó sẽ ở lại. Xét một lượt là bỏ sót ca này.
 */
export function phanLoaiXoaDeNghi(
  ids: readonly string[],
  tatCaDeNghi: readonly DeNghiMuaHang[],
  baoGia: readonly Pick<BaoGia, "prId" | "trangThai">[],
  donHang: readonly Pick<DonDatHang, "prId" | "trangThai">[],
): { xoaDuoc: string[]; biChan: { id: string; lyDo: string }[] } {
  const conLai = new Set(ids);
  const biChan = new Map<string, string>();
  for (let doi = true; doi; ) {
    doi = false;
    for (const id of [...conLai]) {
      const lyDo = lyDoKhongXoaDeNghi(id, conLai, tatCaDeNghi, baoGia, donHang);
      if (lyDo) {
        conLai.delete(id);
        biChan.set(id, lyDo);
        doi = true;
      }
    }
  }
  return {
    xoaDuoc: ids.filter((id) => conLai.has(id)),
    biChan: [...biChan].map(([id, lyDo]) => ({ id, lyDo })),
  };
}
