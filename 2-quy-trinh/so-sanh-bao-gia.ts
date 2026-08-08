// ============================================================
// SO SÁNH BÁO GIÁ — dựng ma trận "vật tư × nhà cung cấp" từ một bảng báo giá
//
// Giao diện chỉ việc đổ ra bảng; mọi phép cộng và so sánh nằm ở đây để
// không có hai chỗ cùng tính một con số rồi lệch nhau.
// ============================================================

import type { BaoGia, DongBaoGia } from "@/3-du-lieu/kieu-du-lieu";

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
