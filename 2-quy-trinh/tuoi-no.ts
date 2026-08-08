// ============================================================
// TUỔI NỢ (AGING) — phân tích công nợ phải trả theo số ngày quá hạn
//
// Quy ước: chỉ tính phần CÒN PHẢI TRẢ (soTien - daTra). Hóa đơn đã tất toán
// không đưa vào biểu đồ để tránh thổi phồng dư nợ.
// ============================================================

import type { CongNo } from "@/3-du-lieu/kieu-du-lieu";
import type { MoTaTrangThai } from "@/2-quy-trinh/trang-thai";

export type MaMucTuoiNo = "trong_han" | "d1_30" | "d31_60" | "d61_90" | "tren_90";

export interface DinhNghiaMucTuoiNo {
  ma: MaMucTuoiNo;
  nhan: string;
  /** Nhãn rút gọn cho tiêu đề cột bảng ma trận. */
  nhanNgan: string;
}

/** 5 mức tuổi nợ theo thông lệ kế toán 30-60-90. */
export const MUC_TUOI_NO: DinhNghiaMucTuoiNo[] = [
  { ma: "trong_han", nhan: "Trong hạn", nhanNgan: "Trong hạn" },
  { ma: "d1_30", nhan: "Quá hạn 1-30 ngày", nhanNgan: "1-30 ngày" },
  { ma: "d31_60", nhan: "Quá hạn 31-60 ngày", nhanNgan: "31-60 ngày" },
  { ma: "d61_90", nhan: "Quá hạn 61-90 ngày", nhanNgan: "61-90 ngày" },
  { ma: "tren_90", nhan: "Quá hạn trên 90 ngày", nhanNgan: "> 90 ngày" },
];

export interface MucTuoiNo extends DinhNghiaMucTuoiNo {
  soHoaDon: number;
  soTien: number;
}

export interface TuoiNoTheoNCC {
  nccId: string;
  tenNCC: string;
  tongNo: number;
  soHoaDon: number;
  theoMuc: Record<MaMucTuoiNo, number>;
  rui: MoTaTrangThai;
}

const MOT_NGAY = 86_400_000;

export function soTienConLai(p: CongNo): number {
  return p.soTien - p.daTra;
}

/** Hóa đơn còn nợ thật sự — bỏ hóa đơn đã tất toán và hóa đơn trả đủ. */
function conNo(p: CongNo): boolean {
  return p.trangThai !== "da_thanh_toan" && soTienConLai(p) > 0;
}

function mucCuaHoaDon(p: CongNo, moc: Date): MaMucTuoiNo {
  const soNgay = Math.floor((moc.getTime() - new Date(p.hanThanhToan).getTime()) / MOT_NGAY);
  if (soNgay <= 0) return "trong_han";
  if (soNgay <= 30) return "d1_30";
  if (soNgay <= 60) return "d31_60";
  if (soNgay <= 90) return "d61_90";
  return "tren_90";
}

/** Tổng hợp toàn bộ công nợ về 5 mức tuổi nợ. */
export function tinhTuoiNo(danhSach: CongNo[], moc: Date = new Date()): MucTuoiNo[] {
  const ket = new Map<MaMucTuoiNo, MucTuoiNo>(
    MUC_TUOI_NO.map((m) => [m.ma, { ...m, soHoaDon: 0, soTien: 0 }]),
  );
  for (const p of danhSach) {
    if (!conNo(p)) continue;
    const muc = ket.get(mucCuaHoaDon(p, moc))!;
    muc.soHoaDon += 1;
    muc.soTien += soTienConLai(p);
  }
  return MUC_TUOI_NO.map((m) => ket.get(m.ma)!);
}

function danhGiaRuiRo(theoMuc: Record<MaMucTuoiNo, number>): MoTaTrangThai {
  if (theoMuc.tren_90 > 0 || theoMuc.d61_90 > 0) return { nhan: "Quá hạn nặng", tong: "danger" };
  if (theoMuc.d31_60 > 0 || theoMuc.d1_30 > 0) return { nhan: "Cần theo dõi", tong: "warning" };
  return { nhan: "Trong hạn", tong: "success" };
}

/** Ma trận tuổi nợ theo từng nhà cung cấp, sắp giảm dần theo tổng nợ. */
export function nhomTuoiNoTheoNCC(danhSach: CongNo[], moc: Date = new Date()): TuoiNoTheoNCC[] {
  const bang = new Map<string, TuoiNoTheoNCC>();
  for (const p of danhSach) {
    if (!conNo(p)) continue;
    let dong = bang.get(p.nccId);
    if (!dong) {
      dong = {
        nccId: p.nccId,
        tenNCC: p.tenNCC,
        tongNo: 0,
        soHoaDon: 0,
        theoMuc: { trong_han: 0, d1_30: 0, d31_60: 0, d61_90: 0, tren_90: 0 },
        rui: { nhan: "Trong hạn", tong: "success" },
      };
      bang.set(p.nccId, dong);
    }
    const conLai = soTienConLai(p);
    dong.tongNo += conLai;
    dong.soHoaDon += 1;
    dong.theoMuc[mucCuaHoaDon(p, moc)] += conLai;
  }
  return Array.from(bang.values())
    .map((d) => ({ ...d, rui: danhGiaRuiRo(d.theoMuc) }))
    .sort((a, b) => b.tongNo - a.tongNo);
}
