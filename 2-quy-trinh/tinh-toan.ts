// ============================================================
// QUY TẮC TÍNH TOÁN — Phần 6 của đặc tả v0.2
//
// Nguyên tắc bất di bất dịch:
//  1. CHỈ phiếu nhận hàng ở trạng thái "da_nhap_kho" được tính vào khối lượng đã nhận.
//     Hàng "cho_kiem_tra" không tính — tránh báo tiến độ ảo.
//  2. % của PO / Đề nghị = số dòng đã nhận đủ / tổng số dòng.
//     KHÔNG tính theo giá trị tiền, vì Kho và Phòng thi công không xem được giá —
//     tính theo tiền thì họ thấy số khác Thu mua và QLDA, dễ tranh cãi số liệu.
// ============================================================

import type {
  DeNghiMuaHang,
  DonDatHang,
  PhieuNhanHang,
  TienDoDongDeNghi,
  TienDoDongPO,
  TrangThaiDongDeNghi,
} from "@/3-du-lieu/kieu-du-lieu";

/** Chỉ phiếu đã nhập kho mới được tính. */
export function phieuDuocTinh(p: PhieuNhanHang): boolean {
  return p.trangThai === "da_nhap_kho";
}

// ------------------------------------------------------------
// TIẾN ĐỘ THEO PO
// ------------------------------------------------------------

export function tinhTienDoPO(po: DonDatHang, phieuCuaPO: PhieuNhanHang[]): TienDoDongPO[] {
  const phieuHopLe = phieuCuaPO
    .filter(phieuDuocTinh)
    .sort((a, b) => a.lanGiaoThu - b.lanGiaoThu);

  return po.items.map((dong) => {
    const theoLanGiao = phieuHopLe
      .map((p) => {
        const line = p.lines.find((l) => l.sttDongPO === dong.sttDong);
        return line
          ? { lanGiaoThu: p.lanGiaoThu, ngayNhan: p.ngayNhanThucTe, khoiLuong: line.khoiLuongThucNhan }
          : null;
      })
      .filter((x): x is { lanGiaoThu: number; ngayNhan: string; khoiLuong: number } => x !== null);

    const khoiLuongDaNhan = theoLanGiao.reduce((s, x) => s + x.khoiLuong, 0);
    const khoiLuongConLai = Math.max(0, dong.khoiLuongDat - khoiLuongDaNhan);
    const phanTram = dong.khoiLuongDat > 0 ? (khoiLuongDaNhan / dong.khoiLuongDat) * 100 : 0;

    return { ...dong, khoiLuongDaNhan, khoiLuongConLai, phanTram, theoLanGiao };
  });
}

/** % của PO = số dòng đã nhận đủ / tổng số dòng. */
export function phanTramPO(tienDo: TienDoDongPO[]): number {
  if (tienDo.length === 0) return 0;
  const duSo = tienDo.filter((d) => d.khoiLuongConLai === 0).length;
  return (duSo / tienDo.length) * 100;
}

export function poDaGiaoDu(tienDo: TienDoDongPO[]): boolean {
  return tienDo.length > 0 && tienDo.every((d) => d.khoiLuongConLai === 0);
}

/** Đủ cả 3 điều kiện mới được đánh dấu hoàn thành (Phần 4.3). */
export function poDuDieuKienHoanThanh(po: DonDatHang, tienDo: TienDoDongPO[]): boolean {
  return poDaGiaoDu(tienDo) && Boolean(po.xacNhanKho) && Boolean(po.xacNhanTruongBP);
}

// ------------------------------------------------------------
// TIẾN ĐỘ THEO ĐỀ NGHỊ — gộp từ nhiều PO
// ------------------------------------------------------------

export function tinhTienDoDeNghi(
  deNghi: DeNghiMuaHang,
  tatCaPO: DonDatHang[],
  tatCaPhieu: PhieuNhanHang[],
): TienDoDongDeNghi[] {
  const poCuaDeNghi = tatCaPO.filter((po) => po.prId === deNghi.id && po.trangThai !== "huy");

  return deNghi.items.map((dong) => {
    let khoiLuongDaLenPO = 0;
    let khoiLuongDaNhan = 0;
    const maPOLienQuan: string[] = [];
    const ngayGiao: string[] = [];

    for (const po of poCuaDeNghi) {
      const dongPOLienQuan = po.items.filter((d) => d.sttDongDeNghi === dong.stt);
      if (dongPOLienQuan.length === 0) continue;

      maPOLienQuan.push(po.code);
      ngayGiao.push(po.ngayGiaoDuKien);
      khoiLuongDaLenPO += dongPOLienQuan.reduce((s, d) => s + d.khoiLuongDat, 0);

      const phieuCuaPO = tatCaPhieu.filter((p) => p.poId === po.id).filter(phieuDuocTinh);
      for (const p of phieuCuaPO) {
        for (const d of dongPOLienQuan) {
          const line = p.lines.find((l) => l.sttDongPO === d.sttDong);
          if (line) khoiLuongDaNhan += line.khoiLuongThucNhan;
        }
      }
    }

    const khoiLuongChuaLenPO = Math.max(0, dong.khoiLuongDeNghi - khoiLuongDaLenPO);
    const khoiLuongConLai = Math.max(0, dong.khoiLuongDeNghi - khoiLuongDaNhan);
    const phanTram = dong.khoiLuongDeNghi > 0 ? (khoiLuongDaNhan / dong.khoiLuongDeNghi) * 100 : 0;

    let trangThaiDong: TrangThaiDongDeNghi;
    if (khoiLuongConLai === 0 && dong.khoiLuongDeNghi > 0) trangThaiDong = "da_nhan_du";
    else if (khoiLuongDaNhan > 0) trangThaiDong = "dang_giao";
    else if (maPOLienQuan.length > 0) trangThaiDong = "da_len_po";
    else if (dong.nguoiPhuTrachUid) trangThaiDong = "da_phan_bo";
    else trangThaiDong = "chua_phan_bo";

    return {
      ...dong,
      khoiLuongDaLenPO,
      khoiLuongChuaLenPO,
      khoiLuongDaNhan,
      khoiLuongConLai,
      phanTram,
      trangThaiDong,
      maPOLienQuan,
      ngayGiaoDuKien: ngayGiao.sort()[0],
    };
  });
}

/** "6/10 mặt hàng đã nhận đủ" — quy tắc dùng chung cho MỌI nhóm người xem. */
export function tomTatTienDoDeNghi(tienDo: TienDoDongDeNghi[]): {
  soDongDaNhanDu: number;
  tongSoDong: number;
  phanTram: number;
} {
  const tongSoDong = tienDo.length;
  const soDongDaNhanDu = tienDo.filter((d) => d.trangThaiDong === "da_nhan_du").length;
  return {
    soDongDaNhanDu,
    tongSoDong,
    phanTram: tongSoDong > 0 ? (soDongDaNhanDu / tongSoDong) * 100 : 0,
  };
}

// ------------------------------------------------------------
// TIỀN — chỉ dùng khi quyen.xemGia === true
// ------------------------------------------------------------

export function tongGiaTriPO(
  po: DonDatHang,
  gia: { lines: { sttDong: number; donGia: number }[] } | undefined,
): number {
  if (!gia) return 0;
  return po.items.reduce((tong, dong) => {
    const g = gia.lines.find((l) => l.sttDong === dong.sttDong);
    return tong + (g ? g.donGia * dong.khoiLuongDat : 0);
  }, 0);
}

// ------------------------------------------------------------
// THỜI GIAN
// ------------------------------------------------------------

export function soNgayConLai(denNgay: string, tuNgay: Date = new Date()): number {
  const den = new Date(denNgay);
  const moc = new Date(tuNgay.getFullYear(), tuNgay.getMonth(), tuNgay.getDate());
  return Math.round((den.getTime() - moc.getTime()) / 86_400_000);
}

/** Màu thanh tiến độ theo Design System V1.1 Phần E2. */
export type TongMau = "primary" | "warning" | "danger" | "success";

export function tongMauTheoThoiGian(
  ngayBatDau: string,
  ngayKetThuc: string,
  daHoanThanh: boolean,
): TongMau {
  if (daHoanThanh) return "success";
  const batDau = new Date(ngayBatDau).getTime();
  const ketThuc = new Date(ngayKetThuc).getTime();
  const tong = Math.max(1, ketThuc - batDau);
  const daDung = ((Date.now() - batDau) / tong) * 100;
  if (daDung >= 100) return "danger";
  if (daDung >= 90) return "danger";
  if (daDung >= 70) return "warning";
  return "primary";
}
