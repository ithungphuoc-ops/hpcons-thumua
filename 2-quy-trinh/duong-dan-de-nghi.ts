// ============================================================
// ĐƯỜNG DẪN ĐỀ NGHỊ THEO MÃ ĐỀ XUẤT — MỘT CHỖ DUY NHẤT (Sếp chốt 02/10/2026)
//   /de-nghi/000000162 · bản copy /de-nghi/000000162-copy1, -copy2 (đuôi đọc từ "(copy N)" của mã
//   hồ sơ — mã hồ sơ KHÔNG đổi, đổi là lệch `prCode` trên PO). Link cũ (mã kỹ thuật) vẫn mở được.
// ⚠️ Kho thật 02/10 có 5 cặp phiếu copy trùng y hệt mã (sót sự cố 24–25/09): link mới dẫn tới phiếu
//   còn chạy, phiếu thua giữ link mã kỹ thuật.
// ============================================================

import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";
import { deNghiConDangChay } from "@/2-quy-trinh/giai-doan-mua-hang";
import { soThuTuBanSao } from "@/2-quy-trinh/nhan-ban-de-nghi";

function maTrongLink(dn: Pick<DeNghiMuaHang, "maDeXuatAppRequest">): string | null {
  const ma = (dn.maDeXuatAppRequest ?? "").trim();
  return /^\d+$/.test(ma) ? ma : null;
}

/** So theo giá trị số để `162` và `000000162` là một. */
function cungLink(maSo: number, soBan: number, tatCa: readonly DeNghiMuaHang[]): DeNghiMuaHang[] {
  return tatCa.filter((d) => {
    const ma = maTrongLink(d);
    return ma !== null && Number(ma) === maSo && soThuTuBanSao(d.code) === soBan;
  });
}

/** Thứ tự ưu tiên cố định để nơi dựng link và nơi tìm phiếu luôn ra cùng một phiếu. */
function chonMotPhieu(ds: readonly DeNghiMuaHang[]): DeNghiMuaHang | undefined {
  const uuTien = (loc: (d: DeNghiMuaHang) => boolean, nguon: readonly DeNghiMuaHang[]) => {
    const ra = nguon.filter(loc);
    return ra.length > 0 ? ra : nguon;
  };
  let nhom = uuTien(deNghiConDangChay, ds);
  nhom = uuTien((d) => d.trangThai !== "dong_do", nhom);
  nhom = uuTien((d) => !d.luuTru, nhom);
  return nhom[nhom.length - 1];
}

/** Đoạn sau `/de-nghi/`: `000000162`, `000000162-copy2`… hoặc mã kỹ thuật khi không dựng được. */
export function duoiDuongDanDeNghi(dn: DeNghiMuaHang, tatCa: readonly DeNghiMuaHang[]): string {
  const ma = maTrongLink(dn);
  if (!ma) return dn.id;
  const soBan = soThuTuBanSao(dn.code);
  const thang = chonMotPhieu(cungLink(Number(ma), soBan, tatCa));
  if (thang && thang.id !== dn.id) return dn.id;
  return soBan === 0 ? ma : `${ma}-copy${soBan}`;
}

export function duongDanDeNghi(dn: DeNghiMuaHang, tatCa: readonly DeNghiMuaHang[]): string {
  return `/de-nghi/${encodeURIComponent(duoiDuongDanDeNghi(dn, tatCa))}`;
}

/** Link của MỌI đề nghị trong một lượt quét (id → link) — bảng quy trình vẽ hàng trăm thẻ. Cùng kết quả với `duongDanDeNghi`. */
export function bangDuongDanDeNghi(tatCa: readonly DeNghiMuaHang[]): Map<string, string> {
  const khoa = (d: DeNghiMuaHang, ma: string) => `${Number(ma)}#${soThuTuBanSao(d.code)}`;
  const nhom = new Map<string, DeNghiMuaHang[]>();
  for (const d of tatCa) {
    const ma = maTrongLink(d);
    if (!ma) continue;
    const k = khoa(d, ma);
    const ds = nhom.get(k);
    if (ds) ds.push(d);
    else nhom.set(k, [d]);
  }
  const thangCuaNhom = new Map([...nhom].map(([k, ds]) => [k, chonMotPhieu(ds)?.id]));
  const ra = new Map<string, string>();
  for (const d of tatCa) {
    const ma = maTrongLink(d);
    const soBan = soThuTuBanSao(d.code);
    const duoi = ma && thangCuaNhom.get(khoa(d, ma)) === d.id ? (soBan === 0 ? ma : `${ma}-copy${soBan}`) : d.id;
    ra.set(d.id, `/de-nghi/${encodeURIComponent(duoi)}`);
  }
  return ra;
}

/** Nhận cả link mới (`000000162`, `162`, `000000162-copy2`) lẫn link cũ (mã kỹ thuật). */
export function timDeNghiTheoDuongDan(
  thamSo: string | undefined,
  tatCa: readonly DeNghiMuaHang[],
): DeNghiMuaHang | undefined {
  let t = (thamSo ?? "").trim();
  try {
    t = decodeURIComponent(t);
  } catch {
    /* Chuỗi % hỏng — dùng nguyên văn. */
  }
  if (t === "") return undefined;
  const theoId = tatCa.find((d) => d.id === t);
  if (theoId) return theoId;
  const khop = t.match(/^(\d+)(?:-copy(\d*))?$/i);
  if (!khop) return undefined;
  const soBan = khop[2] === undefined ? 0 : khop[2] === "" ? 1 : Number(khop[2]);
  if (khop[2] !== undefined && soBan < 1) return undefined;
  return chonMotPhieu(cungLink(Number(khop[1]), soBan, tatCa));
}
