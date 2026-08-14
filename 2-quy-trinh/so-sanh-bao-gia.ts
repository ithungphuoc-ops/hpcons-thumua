// ============================================================
// SO SÁNH BÁO GIÁ — dựng ma trận "vật tư × nhà cung cấp" từ một bảng báo giá
//
// Giao diện chỉ việc đổ ra bảng; mọi phép cộng và so sánh nằm ở đây để
// không có hai chỗ cùng tính một con số rồi lệch nhau.
// ============================================================

import type { BaoGia, DongBaoGia, PhanBoNCC } from "@/3-du-lieu/kieu-du-lieu";

export interface CotNCC {
  nccId: string;
  tenNCC: string;
  /** Tổng thành tiền của NCC này. */
  tongTien: number;
  /** NCC có báo giá đủ mọi dòng vật tư hay không. */
  baoDuDong: boolean;
  /** Tổng thấp nhất trong số các NCC báo đủ dòng. */
  laTongThapNhat: boolean;
}

export interface ODongBaoGia {
  donGia: number;
  thoiGianGiao: number;
  thanhTien: number;
  laGiaThapNhat: boolean;
}

export interface DongSoSanh {
  dong: DongBaoGia;
  /** Khóa là nccId; thiếu khóa nghĩa là NCC đó không báo giá dòng này. */
  o: Record<string, ODongBaoGia>;
}

export interface BangSoSanh {
  cot: CotNCC[];
  dong: DongSoSanh[];
}

export function dungBangSoSanh(bg: BaoGia): BangSoSanh {
  const tenTheoNCC = new Map<string, string>();
  for (const item of bg.items) {
    for (const q of item.baoGiaNCC) tenTheoNCC.set(q.nccId, q.tenNCC);
  }

  const tongTheoNCC = new Map<string, number>();
  const soDongDaBao = new Map<string, number>();

  const dong: DongSoSanh[] = bg.items.map((item) => {
    // Chỉ đánh dấu "thấp nhất" khi có từ 2 báo giá trở lên — một mình thì không so với ai.
    const coDeSo = item.baoGiaNCC.length > 1;
    const giaThapNhat = item.baoGiaNCC.reduce(
      (min, q) => Math.min(min, q.donGia),
      Number.POSITIVE_INFINITY,
    );
    const o: Record<string, ODongBaoGia> = {};
    for (const q of item.baoGiaNCC) {
      const thanhTien = q.donGia * item.khoiLuong;
      o[q.nccId] = {
        donGia: q.donGia,
        thoiGianGiao: q.thoiGianGiao,
        thanhTien,
        laGiaThapNhat: coDeSo && q.donGia === giaThapNhat,
      };
      tongTheoNCC.set(q.nccId, (tongTheoNCC.get(q.nccId) ?? 0) + thanhTien);
      soDongDaBao.set(q.nccId, (soDongDaBao.get(q.nccId) ?? 0) + 1);
    }
    return { dong: item, o };
  });

  const cotTho = Array.from(tenTheoNCC, ([nccId, tenNCC]) => ({
    nccId,
    tenNCC,
    tongTien: tongTheoNCC.get(nccId) ?? 0,
    baoDuDong: (soDongDaBao.get(nccId) ?? 0) === bg.items.length,
  }));

  // Chỉ so tổng giữa các NCC báo đủ dòng — NCC báo thiếu luôn rẻ hơn một cách giả tạo.
  const duSoSanh = cotTho.filter((c) => c.baoDuDong);
  const tongThapNhat = duSoSanh.reduce(
    (min, c) => Math.min(min, c.tongTien),
    Number.POSITIVE_INFINITY,
  );

  const cot: CotNCC[] = cotTho.map((c) => ({
    ...c,
    laTongThapNhat: duSoSanh.length > 1 && c.baoDuDong && c.tongTien === tongThapNhat,
  }));

  return { cot, dong };
}

// ============================================================
// TÁCH BÁO GIÁ — chia khối lượng một dòng cho nhiều nhà cung cấp
//
// Chỉ đạo Ban lãnh đạo 10/08/2026: một nhà cung cấp có thể không giao đủ số lượng
// cần đặt, nên phải chia dòng đó ra cho nhiều nhà cung cấp, mỗi phần sẽ thành một
// đơn đặt hàng riêng.
//
// Mọi phép cộng và kiểm tra để ở đây; giao diện chỉ hỏi kết quả.
// ============================================================

export interface KetQuaKiemPhanBo {
  /** Tổng khối lượng đã chia cho các nhà cung cấp. */
  daChia: number;
  /** Còn lại chưa chia. Âm nghĩa là chia vượt. */
  conLai: number;
  /** Chia vượt khối lượng của dòng — phải chặn, không cho lưu. */
  vuot: boolean;
  /** Đã chia hết, không thừa không thiếu. */
  chiaDu: boolean;
  /** Nhà cung cấp bị chia trùng (xuất hiện hai lần trong cùng một dòng). */
  nccTrung: string[];
}

/**
 * Kiểm một danh sách phân bổ của MỘT dòng báo giá.
 *
 * 🔴 Chia VƯỢT là lỗi phải chặn: đặt nhiều hơn khối lượng đề nghị thì kho nhận thừa,
 * quyết toán lệch với hợp đồng. Còn chia THIẾU thì cho phép — nhiều khi cố ý đặt
 * trước một phần, phần còn lại tìm nhà cung cấp sau.
 */
export function kiemPhanBoDong(khoiLuongDong: number, phanBo: PhanBoNCC[]): KetQuaKiemPhanBo {
  const daChia = phanBo.reduce((t, p) => t + (Number.isFinite(p.khoiLuong) ? p.khoiLuong : 0), 0);
  const conLai = khoiLuongDong - daChia;

  const dem = new Map<string, number>();
  for (const p of phanBo) dem.set(p.nccId, (dem.get(p.nccId) ?? 0) + 1);
  const nccTrung = phanBo
    .filter((p) => (dem.get(p.nccId) ?? 0) > 1)
    .map((p) => p.tenNCC)
    .filter((ten, i, ds) => ds.indexOf(ten) === i);

  return {
    daChia,
    conLai,
    /**
     * ⚠️ PHẢI DÙNG CÙNG SAI SỐ VỚI `chiaDu` NGAY DƯỚI, nếu không hai cờ chửi nhau.
     *
     * Máy tính cộng số lẻ không bao giờ tròn tuyệt đối: chia 12,5 tấn thành 4,1 + 4,2 + 4,2
     * cho ra 12,500000000000002 — lớn hơn 12,5 một chút xíu. So thẳng `>` là app báo "chia
     * vượt" và chặn lưu, trong khi người dùng chia đúng tuyệt đối theo số trên đề nghị và
     * không có cách nào gõ khác đi cho đúng. Số lẻ kiểu này rất thường gặp với tấn / m³.
     */
    vuot: conLai < -0.000001,
    // So bằng số thực có thể lệch ở hàng thập phân — chấp nhận sai số rất nhỏ.
    chiaDu: Math.abs(conLai) < 0.000001,
    nccTrung,
  };
}

/** Một dòng đơn hàng suy ra từ phân bổ, gom theo nhà cung cấp. */
export interface DongTheoNCC {
  dongBaoGiaId: string;
  tenVatLieu: string;
  donViTinh: string;
  khoiLuong: number;
  /** Đơn giá NCC đó đã báo cho dòng này; `undefined` nghĩa là họ không báo giá dòng này. */
  donGia?: number;
}

export interface NhomTheoNCC {
  nccId: string;
  tenNCC: string;
  dong: DongTheoNCC[];
  /** Tổng tiền phần của nhà cung cấp này — bỏ qua dòng họ không báo giá. */
  tongTien: number;
  /** Có dòng nào NCC này chưa báo giá không — cảnh báo trước khi lập đơn. */
  thieuGia: boolean;
}

/**
 * Gom phân bổ của cả bảng báo giá thành từng nhóm theo nhà cung cấp —
 * mỗi nhóm sẽ thành MỘT đơn đặt hàng.
 */
export function gomTheoNCC(bg: BaoGia): NhomTheoNCC[] {
  const nhom = new Map<string, NhomTheoNCC>();

  for (const item of bg.items) {
    for (const p of item.phanBo ?? []) {
      if (p.khoiLuong <= 0) continue;
      const donGia = item.baoGiaNCC.find((q) => q.nccId === p.nccId)?.donGia;
      const cu = nhom.get(p.nccId) ?? {
        nccId: p.nccId,
        tenNCC: p.tenNCC,
        dong: [],
        tongTien: 0,
        thieuGia: false,
      };
      cu.dong.push({
        dongBaoGiaId: item.id,
        tenVatLieu: item.tenVatLieu,
        donViTinh: item.donViTinh,
        khoiLuong: p.khoiLuong,
        donGia,
      });
      cu.tongTien += (donGia ?? 0) * p.khoiLuong;
      if (donGia === undefined) cu.thieuGia = true;
      nhom.set(p.nccId, cu);
    }
  }

  return [...nhom.values()];
}

/** Bảng báo giá này đã tách cho nhiều nhà cung cấp chưa. */
export function daTachBaoGia(bg: BaoGia): boolean {
  return bg.items.some((d) => (d.phanBo ?? []).some((p) => p.khoiLuong > 0));
}
