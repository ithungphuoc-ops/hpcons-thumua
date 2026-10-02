// ============================================================
// BẢNG THEO DÕI ĐƠN HÀNG — một dòng cho một đơn, cột theo mẫu Excel của phòng
//
// ★ Sếp 02/10/2026: *"Bố cục lại bảng theo dõi đơn hàng theo mẫu hình a đính kèm"* — mẫu
// "BẢNG THEO DÕI ĐƠN MUA HÀNG THÁNG … NĂM …" (STT · Mã đề xuất · Số đơn hàng · NCC · Mục đích
// sử dụng · Nơi sử dụng · Giá trị · [Công trình] · Theo dõi · [Nhà cung cấp] · Theo dõi · Người
// nhận · NV thực hiện · Ghi chú · Ngày hoá đơn · Ngày up workflow · Theo dõi).
//
// Sếp chốt cùng ngày:
//   · Đơn giao nhiều lần → lấy NGÀY GIAO LẦN ĐẦU.
//   · "Ngày nhận hàng" (Công trình) và "Ngày giao hàng" (NCC) cùng dùng ngày kho nhận — app chỉ
//     có một ngày thực nhận, do kho ghi (nguyên tắc dữ liệu số 2).
//   · "Mục đích sử dụng" lấy từ phiếu đề nghị.
//   · "Ngày up workflow" là ô NHẬP TAY trên đơn (`DonDatHang.ngayUpWorkflow`).
//
// 📌 Ba cột "Theo dõi" theo đúng cách tính của mẫu (đối chiếu hai dòng mẫu Sếp gửi):
//   ① Ngày đề nghị cấp − Ngày nhận hàng   (28/03 − 01/04 = −4 → âm là TRỄ)
//   ② Ngày thoả thuận giao − Ngày giao     (02/04 − 01/04 = 1)
//   ③ Ngày up workflow − Ngày hoá đơn      (02/04 − 01/04 = 1)
// Thiếu một trong hai ngày thì để TRỐNG, không tính ra số — một con số bịa từ ô trống còn tệ hơn
// không có số.
// ============================================================

import { khongCanHopDongHoaDon } from "@/2-quy-trinh/chung-tu-cuoi-quy-trinh";
import type {
  DeNghiMuaHang,
  DonDatHang,
  GiaDonDatHang,
  NgayISO,
  PhieuNhanHang,
} from "@/3-du-lieu/kieu-du-lieu";

/** Lấy phần ngày `yyyy-mm-dd` của một mốc ISO (có hoặc không có giờ). Không đọc được → `null`. */
function phanNgay(ngay: string | undefined | null): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec((ngay ?? "").trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/**
 * Số ngày `a − b`, tính theo NGÀY LỊCH (bỏ giờ phút). Thiếu một bên → `null`.
 *
 * ⚠️ Đổi cả hai về `Date.UTC` trước khi trừ: `new Date("yyyy-mm-dd")` ra 00:00 UTC còn mốc có giờ
 * lại theo giờ máy — trừ lẫn hai kiểu là lệch một ngày quanh nửa đêm.
 */
export function soNgayChenh(a: string | undefined | null, b: string | undefined | null): number | null {
  const x = phanNgay(a);
  const y = phanNgay(b);
  if (!x || !y) return null;
  const doi = (s: string) => {
    const [n, t, d] = s.split("-").map(Number);
    return Date.UTC(n, t - 1, d);
  };
  return Math.round((doi(x) - doi(y)) / 86_400_000);
}

/** Ngày sớm nhất trong danh sách (bỏ ô trống). */
function ngaySomNhat(ds: readonly (string | undefined)[]): NgayISO | undefined {
  const co = ds.map(phanNgay).filter((x): x is string => x !== null).sort();
  return co[0];
}

export interface DongTheoDoiDonHang {
  maDeXuat: string;
  mucDichSuDung: string;
  noiSuDung: string;
  ngayLapDeNghi?: NgayISO;
  ngayDeNghiCap?: NgayISO;
  /** Ngày kho nhận LẦN ĐẦU — dùng cho cả cột "Ngày nhận hàng" lẫn "Ngày giao hàng". */
  ngayNhanLanDau?: NgayISO;
  ngayDatHang?: NgayISO;
  ngayThoaThuanGiao?: NgayISO;
  nguoiNhan: string;
  /**
   * Cột "Ngày hoá đơn / phiếu giao hàng": tờ hoá đơn SỚM NHẤT. Hồ sơ xuất kho / nhân sự không có
   * hoá đơn (`khongCanHopDongHoaDon`) thì lấy ngày PHIẾU GIAO (lần nhận đầu) — đúng nghĩa tiêu
   * đề cột của mẫu Excel, và là chứng từ cuối của loại hồ sơ đó.
   */
  ngayHoaDon?: NgayISO;
  ngayUpWorkflow?: NgayISO;
  theoDoiCongTrinh: number | null;
  theoDoiNCC: number | null;
  theoDoiWorkflow: number | null;
}

/**
 * Dựng một dòng của bảng theo dõi.
 *
 * @param phieuCuaPO phiếu nhận của RIÊNG đơn này. Chỉ phiếu `da_nhap_kho` mới tính (nguyên tắc dữ
 *   liệu số 4) — hàng còn chờ kiểm tra chưa phải là đã nhận.
 */
export function dungDongTheoDoiDonHang(
  po: DonDatHang,
  dn: DeNghiMuaHang | undefined,
  phieuCuaPO: readonly PhieuNhanHang[],
  gia: GiaDonDatHang | undefined,
  /**
   * Phiếu GỐC của `dn` (`phieuGocCua`) — đơn lập từ phiếu con (tách khi giao việc / nhân bản) thì
   * phiếu con mang ngày GIAO VIỆC ở `ngayDeNghi`, còn "Ngày lập đề nghị" phải là ngày công trình
   * lập phiếu (phản biện 02/10/2026). Không truyền thì dùng `dn`.
   */
  dnGoc?: DeNghiMuaHang,
): DongTheoDoiDonHang {
  /* Mục đích: lấy ở DÒNG ĐỀ NGHỊ tương ứng (Sếp: "cột mục đích sử dụng có trong phiếu đề nghị"),
     dòng PO không trỏ được về đề nghị thì dùng bản chép trên dòng PO. Gộp các mục đích KHÁC nhau. */
  const mucDich = new Set<string>();
  for (const d of po.items ?? []) {
    if (d.laDongGhiChu) continue;
    const tuDeNghi = dn?.items.find((x) => x.stt === d.sttDongDeNghi)?.mucDichSuDung;
    const md = (tuDeNghi ?? d.mucDichSuDung ?? "").trim();
    if (md) mucDich.add(md);
  }

  const ngayNhanLanDau = ngaySomNhat(
    phieuCuaPO.filter((p) => p.trangThai === "da_nhap_kho").map((p) => p.ngayNhanThucTe),
  );
  const ngayHoaDon =
    ngaySomNhat((gia?.hoaDonVAT ?? []).map((h) => h.ngayHoaDon)) ??
    (dn && khongCanHopDongHoaDon(dn) ? ngayNhanLanDau : undefined);
  const ngayDeNghiCap = phanNgay(dn?.ngayCanHang) ?? undefined;
  const ngayThoaThuanGiao = phanNgay(po.ngayGiaoDuKien) ?? undefined;
  const ngayUpWorkflow = phanNgay(po.ngayUpWorkflow) ?? undefined;
  const nguoiNhan = [po.nguoiNhanHangTen, po.nguoiNhanHangSdt]
    .map((x) => (x ?? "").trim())
    .filter(Boolean)
    .join(" · ");

  return {
    maDeXuat: (po.maDeXuatAppRequest ?? dn?.maDeXuatAppRequest ?? "").trim(),
    mucDichSuDung: [...mucDich].join("; "),
    noiSuDung: ((po.tenCongTrinh ?? "").trim() || (dn?.tenCongTrinh ?? "").trim()),
    ngayLapDeNghi: phanNgay((dnGoc ?? dn)?.ngayDeNghi) ?? undefined,
    ngayDeNghiCap,
    ngayNhanLanDau,
    ngayDatHang: phanNgay(po.ngayLapPO) ?? undefined,
    ngayThoaThuanGiao,
    nguoiNhan,
    ngayHoaDon,
    ngayUpWorkflow,
    theoDoiCongTrinh: soNgayChenh(ngayDeNghiCap, ngayNhanLanDau),
    theoDoiNCC: soNgayChenh(ngayThoaThuanGiao, ngayNhanLanDau),
    theoDoiWorkflow: soNgayChenh(ngayUpWorkflow, ngayHoaDon),
  };
}

/**
 * Chữ của hai cột Theo dõi ① ② (mốc hẹn − ngày thật): âm = TRỄ. Dùng cho chữ hiện kèm số và
 * bản điện thoại — trạng thái phải có cả chữ, không chỉ màu (V1.1).
 */
export function chuTheoDoiHan(so: number | null): string {
  if (so === null) return "";
  return so < 0 ? `Trễ ${-so} ngày` : so === 0 ? "Đúng hạn" : `Sớm ${so} ngày`;
}

/**
 * Chữ của cột Theo dõi ③ (ngày up workflow − ngày hoá đơn). 🔴 CHIỀU NGƯỢC hai cột trên: số
 * dương là up SAU hoá đơn N ngày (bình thường), số âm là up TRƯỚC ngày hoá đơn. Dùng chung chữ
 * "Sớm/Trễ" với ① ② là đọc ngược nghĩa (phản biện 02/10/2026).
 */
export function chuTheoDoiWorkflow(so: number | null): string {
  if (so === null) return "";
  return so > 0
    ? `Up workflow ${so} ngày sau hoá đơn`
    : so === 0
      ? "Up workflow cùng ngày hoá đơn"
      : `Up workflow trước hoá đơn ${-so} ngày`;
}

/**
 * ★ SỐ NGÀY "CHƯA GIAO · QUÁ HẠN" — đơn chưa nhận lần nào mà đã quá ngày thoả thuận giao.
 * `null` = không phải ca đó (đã giao, chưa tới hạn, đơn đã xong / đã huỷ).
 *
 * 🔴 MỘT CHỖ cho cả bảng trên màn lẫn file Excel (phản biện 02/10/2026: file từng để trống ô này,
 * trong khi đây là loại đơn trễ NẶNG NHẤT — cột Theo dõi ② không tính được vì chưa có ngày giao).
 *
 * @param conLai `soNgayConLai(po.ngayGiaoDuKien)` — số ngày còn lại tới ngày thoả thuận (âm = đã qua).
 */
export function soNgayQuaHanChuaGiao(
  po: Pick<DonDatHang, "trangThai">,
  td: Pick<DongTheoDoiDonHang, "ngayNhanLanDau">,
  conLai: number,
): number | null {
  if (td.ngayNhanLanDau || conLai >= 0) return null;
  if (po.trangThai === "hoan_thanh" || po.trangThai === "huy") return null;
  return -conLai;
}

/** Ngày `yyyy-mm-dd` → `dd/mm/yy` như mẫu Excel. Rỗng → chuỗi rỗng. */
export function ngayNganTheoDoi(ngay: string | undefined): string {
  const x = phanNgay(ngay);
  if (!x) return "";
  const [n, t, d] = x.split("-");
  return `${d}/${t}/${n.slice(2)}`;
}
