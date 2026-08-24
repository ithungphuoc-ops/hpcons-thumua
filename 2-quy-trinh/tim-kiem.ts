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
// Luật quyền theo TỪNG hồ sơ — dùng chung với trang chi tiết báo giá, đừng viết lại ở đây.
import { duocXemBaoGiaCuaDeNghi } from "@/4-phan-quyen/quyen-theo-ho-so";
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

export function timHoSo(
  tuKhoa: string,
  nguon: NguonDuLieu,
  quyen: Quyen,
  uid: string,
): KetQuaTraVe {
  const k = boDau(tuKhoa.trim());
  if (k.length < SO_KY_TU_TOI_THIEU) return { ketQua: [], tongKhop: 0 };

  const khop = (...phan: (string | undefined)[]) =>
    boDau(phan.filter(Boolean).join(" ")).includes(k);

  const gom: KetQuaTimKiem[] = [];

  /**
   * --- Đề nghị mua hàng: mã · tiêu đề · công trình · mã dự án · tên vật liệu từng dòng ---
   *
   * ★ TÌM ĐƯỢC THEO **MÃ ĐỀ XUẤT APP REQUEST** — Ban lãnh đạo 21/08/2026: *"bố cục sao cho để
   * sau này có thể từ mã request để lọc lại dữ liệu"*.
   *
   * 🔴 Đây là khóa nối hai app. Đề nghị sinh tự động từ App Request mang mã đề xuất bên đó (vd
   * `000000032`); khi cần đối chiếu, người dùng có mã đó trên tay chứ không có mã hồ sơ Thu mua.
   * Không tìm được theo mã này thì phải mở từng phiếu ra dò — mà mã Thu mua lại do app tự đặt.
   *
   * 📌 Gõ không dấu, gõ một phần cũng ra (xem `khop`), nên `32` cũng tìm được `000000032`.
   */
  for (const dn of nguon.deNghi) {
    const tenVatLieu = dn.items.map((d) => d.tenVatLieu).join(" ");
    if (
      !khop(
        dn.code,
        dn.tieuDe,
        dn.tenCongTrinh,
        dn.maDuAn,
        dn.maHopDongCDT,
        dn.maDeXuatAppRequest,
        tenVatLieu,
      )
    )
      continue;
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
    /* `?? []` — ô tìm kiếm quét MỌI đơn; một đơn thiếu `items` (dữ liệu cũ / nhập từ Excel) là
       sập cả thanh tìm. Xem `dongHangCuaPO` trong `tinh-toan.ts`. */
    const tenVatLieu = (po.items ?? [])
      .map((d) => `${d.tenVatLieu} ${d.maHang ?? ""}`)
      .join(" ");
    const tenNCC = quyen.xemNhaCungCap ? po.supplierTen : undefined;
    /* `po.prCode` có thể trống (đơn không gắn đề nghị) — `khop` đã lọc `undefined` nên không
       vỡ. Thêm `tenCongTrinh` vào vùng đối chiếu: với đơn độc lập, tên công trình là thứ
       người dùng nhớ để tra, còn mã đề nghị thì không có. */
    if (!khop(po.code, po.prCode, po.maDuAn, po.tenCongTrinh, tenVatLieu, tenNCC)) continue;
    gom.push({
      loai: "don_hang",
      id: po.id,
      ma: po.code,
      tieuDe: po.items[0]?.tenVatLieu ?? "Đơn đặt hàng",
      /* Vai trò không xem được NCC thì dòng phụ là mã đề nghị nguồn. Đơn không gắn đề nghị
         (module Lập PO độc lập, 18/08/2026) thì lấy tên công trình, cuối cùng mới đến câu
         chung — tuyệt đối không để câu cụt "Từ đề nghị ". */
      moTaPhu: quyen.xemNhaCungCap
        ? po.supplierTen
        : po.prCode
          ? `Từ đề nghị ${po.prCode}`
          : (po.tenCongTrinh ?? "Đơn không gắn đề nghị"),
      duongDan: `/don-hang/${po.id}`,
    });
  }

  /**
   * --- Bảng báo giá: kiểm quyền theo TỪNG HỒ SƠ, không chỉ theo cấp ---
   *
   * 🔴 `quyen.xemBaoGia` mới là điều kiện cần. App còn một luật nữa: người không được chia
   * việc và không theo dõi đề nghị thì KHÔNG xem được bảng báo giá của đề nghị đó
   * (`duocXemBaoGiaCuaDeNghi`). Trang chi tiết báo giá đã chặn đúng như vậy, nhưng trước
   * 14/08/2026 ô tìm kiếm chỉ xét cấp — nên nhân viên vẫn dò ra được sự tồn tại, mã, tiêu
   * đề và mã đề nghị nguồn của mọi bảng báo giá trong phòng, bấm vào thì bị chặn.
   *
   * Vừa lộ thông tin vừa chỉ sai đường. Dùng chung một luật với trang chi tiết thì hai chỗ
   * không thể nói khác nhau.
   */
  if (quyen.xemBaoGia) {
    for (const bg of nguon.baoGia) {
      if (!khop(bg.code, bg.tieuDe, bg.prCode)) continue;
      // Không tra ra đề nghị nguồn thì KHÔNG cho hiện — thiếu thông tin thì chọn phía an toàn.
      const deNghiNguon = nguon.deNghi.find((d) => d.id === bg.prId);
      if (!deNghiNguon || !duocXemBaoGiaCuaDeNghi(deNghiNguon, uid, quyen)) continue;
      gom.push({
        loai: "bao_gia",
        id: bg.id,
        ma: bg.code,
        tieuDe: bg.tieuDe,
        moTaPhu: `Từ đề nghị ${bg.prCode}`,
        /* Màn Báo giá đã bỏ hẳn 20/08/2026 → dẫn về trang chi tiết đề nghị nguồn. Vẫn giữ kết
           quả tìm theo mã bảng báo giá vì người dùng có mã đó trên giấy tờ. */
        duongDan: `/de-nghi/${deNghiNguon.id}`,
      });
    }
  }

  // Khớp đúng mã hồ sơ thì cho lên đầu — người gõ cả mã là đang tìm đúng hồ sơ đó.
  gom.sort((a, b) => Number(boDau(b.ma) === k) - Number(boDau(a.ma) === k));

  return { ketQua: gom.slice(0, SO_KET_QUA_TOI_DA), tongKhop: gom.length };
}
