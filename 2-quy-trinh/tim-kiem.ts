// ============================================================
// TÌM KIẾM HỒ SƠ THEO MÃ — luật tìm, KHÔNG có giao diện ở đây.
//
// Vì sao cần: chỉ đạo Ban lãnh đạo 06/08/2026 bỏ 3 mục menu (Phân bổ · Đơn đặt hàng
// · Báo giá) với lý do "tra bằng mã hồ sơ lấy từ Đề nghị". Ô tìm kiếm này chính là
// đường vào thay cho 3 mục đó — thiếu nó thì kế hoạch kia chưa trọn vẹn.
//
// 🔴 KẾT QUẢ PHẢI LỌC THEO QUYỀN. Ô tìm kiếm là một đường vòng rất dễ bị bỏ quên:
// giấu khối Báo giá trên trang chi tiết mà vẫn cho tìm ra bảng báo giá thì coi như
// không giấu. Mọi loại hồ sơ thêm mới sau này đều phải khai quyền ở đây.
//
// ⚠️ Tên nhà cung cấp CHỈ được đem ra đối chiếu khi vai trò được xem NCC —
// nếu không, gõ tên một NCC là đoán được đơn nào của ai.
// ============================================================

import type { BaoGia, DeNghiMuaHang, DonDatHang } from "@/3-du-lieu/kieu-du-lieu";
import type { Quyen } from "@/4-phan-quyen/quyen";
import { boDau } from "@/6-tien-ich/bo-dau";

export type LoaiHoSo = "de_nghi" | "don_hang" | "bao_gia";

export const NHAN_LOAI_HO_SO: Record<LoaiHoSo, string> = {
  de_nghi: "Đề nghị mua hàng",
  don_hang: "Đơn đặt hàng",
  bao_gia: "Bảng báo giá",
};

export interface KetQuaTimKiem {
  loai: LoaiHoSo;
  id: string;
  /** Mã hồ sơ theo Thông báo 09/2026, vd 260001-HPCS-PO-001. */
  ma: string;
  tieuDe: string;
  /** Dòng phụ: công trình, nhà cung cấp, hoặc lý do khớp. */
  moTaPhu: string;
  duongDan: string;
}

export interface KetQuaTraVe {
  ketQua: KetQuaTimKiem[];
  /** Tổng số khớp TRƯỚC khi cắt bớt — để giao diện nói rõ "còn N kết quả nữa". */
  tongKhop: number;
}

/** Số kết quả hiện tối đa trong hộp gợi ý. Cắt bớt thì phải nói cho người dùng biết. */
export const SO_KET_QUA_TOI_DA = 8;

/** Gõ ít hơn ngần này ký tự thì chưa tìm — 1 ký tự khớp gần như mọi hồ sơ, chỉ gây nhiễu. */
export const SO_KY_TU_TOI_THIEU = 2;

interface NguonDuLieu {
  deNghi: DeNghiMuaHang[];
  donHang: DonDatHang[];
  baoGia: BaoGia[];
}

export function timHoSo(tuKhoa: string, nguon: NguonDuLieu, quyen: Quyen): KetQuaTraVe {
  const k = boDau(tuKhoa.trim());
  if (k.length < SO_KY_TU_TOI_THIEU) return { ketQua: [], tongKhop: 0 };

  const khop = (...phan: (string | undefined)[]) =>
    boDau(phan.filter(Boolean).join(" ")).includes(k);

  const gom: KetQuaTimKiem[] = [];

  // --- Đề nghị mua hàng: mã · tiêu đề · công trình · mã dự án · tên vật liệu từng dòng ---
  for (const dn of nguon.deNghi) {
    const tenVatLieu = dn.items.map((d) => d.tenVatLieu).join(" ");
    if (!khop(dn.code, dn.tieuDe, dn.tenCongTrinh, dn.maDuAn, dn.maHopDongCDT, tenVatLieu)) continue;
    gom.push({
      loai: "de_nghi",
      id: dn.id,
      ma: dn.code,
      tieuDe: dn.tieuDe,
      moTaPhu: dn.tenCongTrinh,
      duongDan: `/de-nghi/${dn.id}`,
    });
  }

  // --- Đơn đặt hàng: mã · mã đề nghị nguồn · tên và mã vật tư · (tên NCC nếu được xem) ---
  for (const po of nguon.donHang) {
    const tenVatLieu = po.items.map((d) => `${d.tenVatLieu} ${d.maHang ?? ""}`).join(" ");
    const tenNCC = quyen.xemNhaCungCap ? po.supplierTen : undefined;
    if (!khop(po.code, po.prCode, po.maDuAn, tenVatLieu, tenNCC)) continue;
    gom.push({
      loai: "don_hang",
      id: po.id,
      ma: po.code,
      tieuDe: po.items[0]?.tenVatLieu ?? "Đơn đặt hàng",
      moTaPhu: quyen.xemNhaCungCap ? po.supplierTen : `Từ đề nghị ${po.prCode}`,
      duongDan: `/don-hang/${po.id}`,
    });
  }

  // --- Bảng báo giá: chỉ vai trò được xem báo giá ---
  if (quyen.xemBaoGia) {
    for (const bg of nguon.baoGia) {
      if (!khop(bg.code, bg.tieuDe, bg.prCode)) continue;
      gom.push({
        loai: "bao_gia",
        id: bg.id,
        ma: bg.code,
        tieuDe: bg.tieuDe,
        moTaPhu: `Từ đề nghị ${bg.prCode}`,
        duongDan: `/bao-gia/${bg.id}`,
      });
    }
  }

  // Khớp đúng mã hồ sơ thì cho lên đầu — người gõ cả mã là đang tìm đúng hồ sơ đó.
  gom.sort((a, b) => Number(boDau(b.ma) === k) - Number(boDau(a.ma) === k));

  return { ketQua: gom.slice(0, SO_KET_QUA_TOI_DA), tongKhop: gom.length };
}
