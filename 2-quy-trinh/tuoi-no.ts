// ============================================================
// TUỔI NỢ (AGING) — phân tích công nợ phải trả theo số ngày quá hạn
//
// Quy ước: chỉ tính phần CÒN PHẢI TRẢ (soTien - daTra). Hóa đơn đã tất toán
// không đưa vào biểu đồ để tránh thổi phồng dư nợ.
// ============================================================

import type {
  CongNo,
  DonDatHang,
  DongHoaDonVAT,
  DotThanhToanPO,
  GiaDonDatHang,
  NgayISO,
  PhieuNhanHang,
} from "@/3-du-lieu/kieu-du-lieu";
import type { MoTaTrangThai } from "@/2-quy-trinh/trang-thai";
import { poDaGiaoDu, tinhTienChiTietPO, tinhTienDoPO } from "@/2-quy-trinh/tinh-toan";

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

// ════════════════════════════════════════════════════════════════════
// CÔNG NỢ THEO TỪNG ĐƠN HÀNG — Ban lãnh đạo 27/08/2026
//
// *"bố cục lại thông tin của tab theo dõi công nợ"*, kèm ảnh ghi rõ 8 cột:
//   STT · Tên đơn hàng (PO) · Tên NCC · Tổng công nợ · Thời gian C.Nợ ·
//   Ngày bắt đầu tính công nợ · Ngày tới hạn · Cảnh báo tới hạn
//
// 🔴 VÌ SAO PHẢI VIẾT MỚI CHỨ KHÔNG BỐ CỤC LẠI BẢNG CŨ: trước ngày này màn Công nợ
// KHÔNG CÓ MỘT DÒNG DỮ LIỆU NÀO VÀ KHÔNG THỂ CÓ. `congNo` trong kho dữ liệu là hằng
// số `CONG_NO_MAU = []` gán cứng — không `useState`, không hàm ghi, và không nằm
// trong `kho-chung-firestore.ts` lẫn `luu-tren-may.ts`. Tức kể cả có ai nhét được
// dữ liệu vào bộ nhớ thì tải lại trang là mất sạch.
//
// Bố cục lại một cái bảng vĩnh viễn trống là đúng thứ quy ước dự án cấm ở mục 3.5:
// *"Đừng để giao diện hứa một việc app không làm"*.
//
// ✅ CÔNG NỢ LÀ THỨ SUY RA ĐƯỢC, KHÔNG CẦN LƯU RIÊNG. Mọi mảnh đều đã có thật trong
// app: tiền từ đơn + bảng giá, ngày nhận từ phiếu nhận kho, số ngày được nợ từ chứng
// từ giá. Suy ra thì không bao giờ lệch với đơn gốc; lưu một bản sao thì sớm muộn hai
// chỗ nói hai con số.
// ════════════════════════════════════════════════════════════════════

/**
 * ★ Mốc bắt đầu tính công nợ: NGÀY NHẬN HÀNG LẦN CUỐI của đơn.
 *
 * 📌 CĂN CỨ: chú thích của chính trường `soNgayDuocNo` (`kieu-du-lieu.ts`) ghi *"số ngày nhà
 * cung cấp cho nợ **kể từ ngày nhận hàng**"*. Đó là bằng chứng duy nhất về ý định trong mã
 * nguồn — trước 27/08/2026 không có một dòng code nào thực hiện nó.
 *
 * 🔴 LẤY LẦN CUỐI, KHÔNG LẤY LẦN ĐẦU. Đơn giao nhiều đợt thì nợ chỉ nên chạy khi bên mua đã
 * nhận đủ hàng — lấy lần đầu là đơn giao rải ba tháng bị tính quá hạn trong khi hàng còn chưa
 * về hết. Dự án đã có tiền lệ chọn đúng chiều này: `de-nghi-chi-tiet.tsx` lấy ngày MUỘN NHẤT
 * cho mốc hoàn thành, và ngày sớm nhất cho mốc bắt đầu nhận hàng.
 *
 * ⚠️ CHỈ ĐẾM PHIẾU ĐÃ NHẬP KHO. Phiếu còn chờ kiểm tra thì hàng chưa thuộc về mình — đúng
 * nguyên tắc dữ liệu số 4 của dự án. Phiếu `tu_choi_nhan` đương nhiên không tính.
 *
 * 📌 Trả `undefined` khi chưa có lần giao nào được nhập kho — nơi gọi phải tự quyết hiển thị,
 * đừng bịa ra một ngày để bảng trông có vẻ đầy đủ.
 */
export function ngayBatDauTinhNo(phieuCuaPO: PhieuNhanHang[]): NgayISO | undefined {
  const daNhap = phieuCuaPO
    .filter((p) => p.trangThai === "da_nhap_kho")
    .map((p) => p.ngayNhanThucTe)
    .filter(Boolean)
    .sort();
  return daNhap.length > 0 ? daNhap[daNhap.length - 1] : undefined;
}

/**
 * ★ Cộng thêm N ngày vào một ngày ISO.
 *
 * ⚠️ DỰNG BẰNG `new Date(y, m, d)` RỒI CỘNG VÀO PHẦN NGÀY, không cộng bằng mili-giây. Cộng
 * `n * 86_400_000` vào timestamp là lệch một ngày ở các mốc đổi giờ; còn `setDate` thì trình
 * duyệt tự xử lý tràn tháng và năm nhuận.
 */
function congNgay(ngay: NgayISO, soNgay: number): NgayISO {
  const d = new Date(ngay);
  const moc = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  moc.setDate(moc.getDate() + soNgay);
  const hai = (n: number) => String(n).padStart(2, "0");
  return `${moc.getFullYear()}-${hai(moc.getMonth() + 1)}-${hai(moc.getDate())}`;
}

/**
 * ★ Ngưỡng "SẮP đến hạn" — còn từng này ngày trở xuống thì cảnh báo.
 *
 * 📌 Con số 7 lấy theo đúng chữ ĐANG HIỆN trên thẻ KPI của trang: *"Cần bố trí thanh toán
 * trong tuần"*. Trước 27/08/2026 câu đó chỉ là chữ tĩnh — trong mã nguồn không có số nào, nên
 * thẻ nói một đằng còn app không đếm gì cả.
 *
 * ⚠️ ĐỔI SỐ NÀY THÌ PHẢI ĐỔI CẢ CÂU TRÊN THẺ KPI, nếu không lại quay về cảnh chữ và số nói
 * hai chuyện khác nhau.
 */
export const NGAY_SAP_DEN_HAN = 7;

/**
 * ★★★ MỘT TỜ HOÁ ĐƠN KÈM HẠN NỢ RIÊNG — Sếp 20/09/2026: ***"Thêm trường nhập thông tin giống mục
 * theo dõi công nợ"***, sau khi đã yêu cầu *"theo dõi công nợ theo từng hoá đơn"*.
 *
 * 🔴 `daTra` CHỈ CỘNG ĐỢT CHI ĐÃ GẮN ĐÚNG TỜ (`DotThanhToanPO.hoaDonId`). TUYỆT ĐỐI KHÔNG chia
 * đều, KHÔNG suy "trả tờ cũ trước" — hai cách đó đều sai với cách trả thật, mà app lại in con số
 * đoán ra như sự thật, đúng thứ CLAUDE.md §3.5 cấm.
 *
 * 🔴 TIỀN CHƯA GẮN TỜ NÀO KHÔNG BIẾN MẤT: nó được đếm riêng ở `tienChuaGanHoaDon` và giao diện
 * **bắt buộc** hiện ra. Bất biến phải luôn đúng:
 *   Σ(daTra của các tờ) + (tiền chưa gắn) = tổng đã trả của đơn
 * Bài kiểm "CHIEU NGHICH — them lop hoa don KHONG duoc lam lech TONG cua don" ghim đúng phép này,
 * kèm một đợt chi trỏ tới tờ **đã bị xoá** — ca đó từng làm 5 triệu bốc hơi khỏi cả hai phép cộng.
 *
 * 📌 Sếp chốt 20/09/2026 làm hai nhịp: nhịp 1 là hạn nợ từng tờ, nhịp 2 (khối này) là tiền.
 */
export interface CongNoTheoHoaDon {
  id: string;
  soHoaDon: string;
  ngayHoaDon: NgayISO;
  soTien: number;
  nhanTep?: string;
  nguoiGhiTen: string;
  /** Tổng tiền các đợt chi ĐÃ GẮN cho đúng tờ này (Sếp 20/09/2026). */
  daTra: number;
  /** `soTien − daTra`, kẹp ở 0 — trả dư không hiện số âm. */
  conLai: number;
  /** Đã trả đủ tờ này chưa. `soTien` = 0 thì không tính là tất toán (đó là tờ chưa có số liệu). */
  daTatToan: boolean;
  /** Số ngày được nợ đang có hiệu lực — của riêng tờ, hoặc kế thừa từ đơn. */
  soNgayDuocNo?: number;
  /** Có phải người dùng gõ đè số ngày cho riêng tờ này không (để giao diện nói rõ). */
  soNgayRieng: boolean;
  ngayBatDau?: NgayISO;
  /** Ngày bắt đầu là do gõ tay, hay tự lấy theo ngày hoá đơn. */
  batDauNhapTay: boolean;
  ngayToiHan?: NgayISO;
  canhBao: MoTaTrangThai;
  soNgayConLai?: number;
}

/** Một dòng của bảng "Công nợ theo đơn hàng" — đúng 8 cột Ban lãnh đạo yêu cầu. */
export interface CongNoTheoDon {
  poId: string;
  /** Cột ②. Mã đơn + tên công trình nếu có — xem chú thích ở `congNoTheoDonHang`. */
  tenDonHang: string;
  maDonHang: string;
  tenCongTrinh?: string;
  /**
   * ★ MÃ SỐ ĐỀ NGHỊ — Sếp 19/09/2026: ***"Thêm cho a trường thông tin Mã số đề nghị"***.
   *
   * 📌 LẤY THẲNG `po.prCode` ĐÃ CÓ SẴN TRÊN ĐƠN, KHÔNG tra ngược qua `prId` sang bảng đề nghị.
   * Bản chép là **cố ý** (xem chú thích cặp `prId`/`prCode` ở `kieu-du-lieu.ts`): đơn là chứng từ
   * đã phát hành, phải đứng yên kể cả khi đề nghị nguồn đổi tên hay bị xoá.
   *
   * ⚠️ `undefined` với đơn KHÔNG gắn đề nghị (bản mẫu in / dữ liệu cũ) — giao diện phải chịu được,
   * đừng in chữ "undefined" ra bảng.
   */
  maDeNghi?: string;
  /**
   * ★ SỐ HOÁ ĐƠN của nhà cung cấp cho đơn này — Sếp 18/09/2026 (yêu cầu 2 của màn Công nợ).
   *
   * 🔴 ĐẶT Ở CẤP ĐƠN, KHÔNG ĐẶT Ở TỪNG ĐỢT CHI. Hoá đơn tồn tại **trước** lần chi: gắn nó vào đợt
   * thì đơn đã nhận hoá đơn mà chưa trả đồng nào sẽ có cột trống — đúng dòng Kế toán cần nhìn nhất.
   *
   * 📌 Lưu trong chứng từ GIÁ (`GiaDonDatHang`), cùng cụm với `soNgayDuocNo` và `ngayBatDauTinhNoTay`
   * — cả ba đều là điều kiện thanh toán, và chú thích ở `kieu-du-lieu.ts` CẤM tách cụm đó sang
   * chứng từ khác vì lộ thế đàm phán (nguyên tắc dữ liệu số 3).
   */
  soHoaDon?: string;
  /**
   * ★★ TỔNG TIỀN GHI TRÊN HOÁ ĐƠN — Sếp 19/09/2026. `undefined` = **chưa nhập**, khác hẳn `0`.
   * Cột "Tổng tiền theo PO" (`tongCongNo`) là cam kết mua; con số này là thứ Kế toán trả tiền
   * theo. Hai số thường lệch nhau (giao thiếu, phụ phí, xuất gộp) — đó chính là lý do phải có cả hai.
   */
  tongTienHoaDon?: number;
  /**
   * Số TỜ hoá đơn đã ghi trong danh sách của đơn (Sếp 19/09/2026).
   * `0` = chưa nhập tờ nào — khi đó hai ô ở màn Công nợ vẫn cho gõ tay như cũ, để đơn cũ không
   * bị khoá cứng chỉ vì tính năng mới chưa được dùng tới.
   */
  soToHoaDon: number;
  /**
   * ★★ DANH SÁCH TỪNG TỜ HOÁ ĐƠN của đơn — Sếp 20/09/2026: ***"Link thông tin các đợt hoá đơn
   * sang đây để theo dõi công nợ theo từng hoá đơn"*** (ảnh khoanh khối gập/mở của dòng PO).
   *
   * 🔴 CHỈ ĐỂ ĐỌC Ở MÀN CÔNG NỢ. Chỗ nhập/sửa/đính kèm là mục ⑥ trong hồ sơ đề nghị — một chỗ
   * duy nhất. Dựng thêm ô nhập ở đây là hai nơi cùng ghi một tờ hoá đơn, đúng cái vừa phải dẹp
   * hôm qua với hai ô số hoá đơn.
   */
  hoaDon: readonly CongNoTheoHoaDon[];
  /**
   * Tiền đã chi cho đơn này nhưng CHƯA gắn cho tờ hoá đơn nào (Sếp 20/09/2026).
   * `0` = mọi đợt chi đều đã gắn. Khác 0 thì giao diện **bắt buộc** hiện ra — xem
   * `tienChuaGanHoaDon`.
   */
  tienChuaGan: number;
  /**
   * ★★ Căn cứ tính nợ CỦA RIÊNG ĐƠN NÀY — Sếp 19/09/2026. `"po"` là mặc định khi chưa ai chọn.
   * Là thuộc tính của đơn (lưu ở `GiaDonDatHang.canCuCongNo`), không phải cách đọc của cả bảng.
   */
  canCu: CanCuCongNo;
  /** ★ Tổng đã trả của đơn — cộng từ các đợt (Sếp 18/09/2026). `0` khi chưa trả đợt nào. */
  daTra: number;
  /** ★ Còn phải trả = tổng − đã trả, kẹp ở 0. Xem `conLaiCuaPO`. */
  conLai: number;
  /** ★ Các đợt đã chi của đơn này, xếp theo ngày chi tăng dần — hàng con gập/mở của bảng. */
  dotChi: DotThanhToanPO[];
  /**
   * ★ ĐÃ TẤT TOÁN — trả đủ (hoặc dư). Sếp 18/09/2026 chốt: đơn trả hết **ở lại bảng** với nhãn
   * trung tính, KHÔNG biến mất và KHÔNG báo đỏ quá hạn nữa.
   *
   * 🔴 Nếu không có cờ này thì đơn đã trả xong vẫn đội nhãn *"Quá hạn N ngày"* — app tự nói dối
   * trên đúng cột người ta nhìn để đi đòi/đi trả.
   */
  daTatToan: boolean;
  /** Cột ③. */
  tenNCC: string;
  /** Cột ④ — tổng phải trả của đơn (đã gồm thuế, đã trừ chiết khấu). */
  tongCongNo: number;
  /** Cột ⑤ — số ngày được nợ; `undefined` = đơn không ghi. */
  soNgayDuocNo?: number;
  /**
   * Cột ⑥ — ngày bắt đầu tính nợ.
   *
   * Lấy theo thứ tự: NGÀY NHẬP TAY trước (`GiaDonDatHang.ngayBatDauTinhNoTay`), không có thì suy
   * ra *ngày nhận hàng lần cuối*. `undefined` = chưa gõ tay và chưa lần giao nào được nhập kho.
   */
  ngayBatDau?: NgayISO;
  /**
   * ★★ Ngày bắt đầu này do người dùng GÕ TAY hay do app tự suy ra (Ban lãnh đạo 06/09/2026).
   *
   * 🔴 GIAO DIỆN PHẢI PHÂN BIỆT ĐƯỢC HAI THỨ. Cùng hiện một ngày mà không nói cái nào là tay,
   * cái nào là tính, thì người dùng không biết đơn nào đã chốt mốc tính nợ thật — và cũng không
   * biết đơn nào sẽ TỰ ĐỔI ngày (kéo theo ngày tới hạn đổi) khi có thêm một lần giao hàng nữa.
   */
  batDauNhapTay: boolean;
  /**
   * Cột ⑦ — ngày phải trả tiền. CỐ ĐỊNH tự tính = ngày bắt đầu + số ngày được nợ (Ban lãnh đạo
   * 06/09/2026: *"cố định ngày này và tự tính"*). `undefined` khi thiếu một trong hai vế.
   */
  ngayToiHan?: NgayISO;
  /** Cột ⑧ — nhãn + tông màu, dùng thẳng cho `StatusBadge`. */
  canhBao: MoTaTrangThai;
  /** Âm = đã quá hạn từng này ngày. `undefined` khi chưa tính được hạn. */
  soNgayConLai?: number;
}

/**
 * ★ Cảnh báo tới hạn của MỘT đơn — cột ⑧.
 *
 * 🔴 BỐN TRẠNG THÁI, VÀ MỖI CÁI PHẢI NÓI ĐƯỢC LÝ DO. Gộp "chưa tính được" vào "trong hạn" là
 * bảng báo an toàn cho một đơn mà app còn chưa biết hạn là ngày nào.
 *
 * 📌 Dùng lại đúng bốn tông của Design System (V1.1 chỉ có 4 tông ngữ nghĩa), và LUÔN kèm chữ
 * — quy ước dự án: trạng thái không bao giờ chỉ dùng màu.
 */
function canhBaoToiHan(ngayToiHan: NgayISO | undefined, moc: Date): {
  canhBao: MoTaTrangThai;
  soNgayConLai?: number;
} {
  if (!ngayToiHan) {
    return { canhBao: { nhan: "Chưa tính được hạn", tong: "neutral" } };
  }
  const con = Math.round(
    (new Date(ngayToiHan).getTime() -
      new Date(moc.getFullYear(), moc.getMonth(), moc.getDate()).getTime()) /
      MOT_NGAY,
  );
  if (con < 0) {
    return { canhBao: { nhan: `Quá hạn ${Math.abs(con)} ngày`, tong: "danger" }, soNgayConLai: con };
  }
  if (con <= NGAY_SAP_DEN_HAN) {
    return {
      canhBao: { nhan: con === 0 ? "Đến hạn hôm nay" : `Còn ${con} ngày`, tong: "warning" },
      soNgayConLai: con,
    };
  }
  return { canhBao: { nhan: `Còn ${con} ngày`, tong: "success" }, soNgayConLai: con };
}

/**
 * ★★ TỔNG ĐÃ TRẢ CỦA MỘT ĐƠN — cộng các đợt thanh toán.
 *
 * 🔴 CỘNG TẠI CHỖ, KHÔNG LƯU SẴN MỘT CON SỐ TỔNG trên đơn. Lưu sẵn là hai chỗ cùng giữ một con
 * số: xoá một đợt mà quên trừ tổng thì bảng báo đã trả nhiều hơn thực tế, và không ai phát hiện
 * vì hai chỗ đều "có vẻ" đúng.
 *
 * ⚠️ `|| 0` chống `NaN`: một bản ghi hỏng (số tiền là chuỗi, hoặc `undefined` do dữ liệu cũ) mà
 * lọt vào phép cộng thì CẢ cột "Còn lại" của đơn đó thành `NaN` — hiện ra màn hình là chữ "NaN đ",
 * và người đọc không biết đơn đó đã trả bao nhiêu.
 */
export function daTraCuaPO(poId: string, dotThanhToan: readonly DotThanhToanPO[]): number {
  return dotThanhToan.reduce((s, d) => (d.poId === poId ? s + (Number(d.soTien) || 0) : s), 0);
}

/**
 * ★★ CÒN PHẢI TRẢ = tổng công nợ − đã trả. **KHÔNG BAO GIỜ ÂM.**
 *
 * 📌 Kẹp ở 0 là cố ý: trả dư (chuyển nhầm, hoặc trả gộp nhiều đơn vào một lệnh) vẫn có thật, nhưng
 * hiện số âm ở cột "Còn lại" thì người đọc hiểu thành "nhà cung cấp nợ lại mình" — sai hẳn nghĩa.
 * Muốn theo dõi phần trả dư thì phải là một việc riêng, có chỗ nói rõ, chứ không nhét vào cột này.
 */
export function conLaiCuaPO(tongCongNo: number, daTra: number): number {
  return Math.max(0, (Number(tongCongNo) || 0) - (Number(daTra) || 0));
}

/**
 * ★★ CĂN CỨ TÍNH CÔNG NỢ — Sếp 19/09/2026: ***"mục tính toán số liệu của cột Còn phải trả sẽ có
 * thêm nút Lựa chọn tổng tiền theo hoá đơn hoặc tổng tiền theo PO"***.
 *
 * 📌 `"po"` là mặc định vì mọi đơn đều có giá trị PO, còn hoá đơn thì phải chờ NCC xuất.
 */
export type CanCuCongNo = "po" | "hoa_don";

/**
 * ★★ SỐ TIỀN LÀM CĂN CỨ TÍNH NỢ của một đơn, theo lựa chọn của người xem.
 *
 * 🔴 TRẢ `undefined` KHI CHỌN "THEO HOÁ ĐƠN" MÀ CHƯA NHẬP HOÁ ĐƠN — và nơi gọi PHẢI hiện ra điều
 * đó thay vì in một con số. Rơi về giá trị PO cho "đỡ trống" là nói dối: người đọc tưởng đang
 * nhìn số của hoá đơn trong khi đó là số của đơn mua hàng, và hai số này thường lệch nhau thật.
 * Rơi về `0` còn tệ hơn — đơn chưa có hoá đơn sẽ trông như đã trả xong.
 */
export function tienLamCanCu(
  r: Pick<CongNoTheoDon, "tongCongNo" | "tongTienHoaDon">,
  canCu: CanCuCongNo,
): number | undefined {
  if (canCu === "po") return r.tongCongNo;
  return typeof r.tongTienHoaDon === "number" ? r.tongTienHoaDon : undefined;
}

/**
 * ★★★ TỔNG TIỀN HOÁ ĐƠN CỦA MỘT ĐƠN — **một chỗ duy nhất**, Sếp chốt 19/09/2026.
 *
 * Sếp duyệt phương án *"bảng là nguồn duy nhất, ô Công nợ tự cộng"*. Hàm này là hiện thân của
 * quyết định đó: có danh sách hoá đơn thì **cộng danh sách**, không có thì mới rơi về con số gõ
 * tay cũ.
 *
 * 🔴 THỨ TỰ ƯU TIÊN KHÔNG ĐƯỢC ĐẢO. Ưu tiên `tongTienHoaDon` trước là người dùng nhập bảng xong
 * mà cột "Còn phải trả" vẫn giữ số cũ — đúng thứ hai-chỗ-một-số mà Sếp yêu cầu dẹp.
 *
 * 🔴 DANH SÁCH RỖNG ≠ ĐÃ NHẬP 0 ĐỒNG. Mảng trống thì coi như CHƯA nhập và rơi về trường cũ; nếu
 * trả `0` thì mọi đơn chưa nhập hoá đơn sẽ trông như **đã trả xong** khi người xem chọn căn cứ
 * "theo hoá đơn". Đây đúng cái bẫy chú thích `tienLamCanCu` ngay trên đã cảnh báo.
 *
 * 📌 Bỏ qua dòng có `soTien` không phải số hữu hạn — dữ liệu từ kho chung không qua phép kiểm
 * từng phần tử, một dòng rác là cả cột hiện "NaN đ".
 */
export function tongTienHoaDonCuaDon(
  gia: { hoaDonVAT?: readonly { soTien: number }[]; tongTienHoaDon?: number } | undefined,
): number | undefined {
  const ds = gia?.hoaDonVAT;
  if (Array.isArray(ds) && ds.length > 0) {
    let tong = 0;
    let coDongHopLe = false;
    for (const d of ds) {
      const n = Number(d?.soTien);
      if (Number.isFinite(n)) {
        tong += n;
        coDongHopLe = true;
      }
    }
    if (coDongHopLe) return tong;
  }
  return typeof gia?.tongTienHoaDon === "number" ? gia.tongTienHoaDon : undefined;
}

/**
 * ★★★ HẠN NỢ CỦA TỪNG TỜ HOÁ ĐƠN — Sếp 20/09/2026.
 *
 * 🔴 DÙNG LẠI ĐÚNG HAI HÀM MÀ DÒNG PO ĐANG DÙNG (`congNgay`, `canhBaoToiHan`). Viết lại phép
 * tính ngày tới hạn ở đây là hai chỗ cùng trả lời một câu hỏi — sửa ngưỡng cảnh báo một bên thì
 * bảng con và dòng cha nói hai chuyện khác nhau về cùng một đơn.
 *
 * 🔴 BA TẦNG MỐC BẮT ĐẦU, Sếp chốt *"Từ ngày hoá đơn, nhưng cho sửa tay"*:
 *   ① `d.ngayBatDauTinhNoTay` — gõ đè cho riêng tờ
 *   ② `d.ngayHoaDon` — mặc định
 *   ③ `ngayBatDauCuaDon` — khi tờ chưa có ngày hoá đơn hợp lệ
 * Giữ đúng nếp "tay thắng tự tính" của cấp đơn.
 *
 * 📌 SỐ NGÀY NỢ KẾ THỪA TỪ ĐƠN khi tờ không khai riêng: đó là điều khoản thương mại đàm phán ở
 * cấp đơn, không phải thuộc tính của từng tờ giấy.
 */
export function hanNoTungToHoaDon(
  gia: { hoaDonVAT?: readonly DongHoaDonVAT[]; soNgayDuocNo?: number } | undefined,
  ngayBatDauCuaDon: NgayISO | undefined,
  moc: Date = new Date(),
  /**
   * ★ Đợt chi của ĐƠN NÀY — để cộng ra tiền đã trả của từng tờ (Sếp 20/09/2026).
   *
   * 📌 Bỏ trống thì mọi tờ hiện `daTra = 0` — mặc định an toàn cho nơi gọi chưa có dữ liệu đợt
   * chi trong tay (hiện chỉ có bài kiểm dùng tới đường này). Không phải mặc định sai, chỉ là
   * chưa hỏi.
   */
  dotChiCuaDon: readonly DotThanhToanPO[] = [],
): CongNoTheoHoaDon[] {
  const ds = Array.isArray(gia?.hoaDonVAT) ? gia.hoaDonVAT : [];
  /* Đơn có tiền đã chi mà chưa gắn tờ nào — quyết định nhãn cảnh báo, xem khối ba mức bên dưới. */
  const coTienChuaGan = tienChuaGanHoaDon(dotChiCuaDon, ds.map((x) => x?.id)) > 0;
  return [...ds]
    .sort(
      (x, y) =>
        String(x?.ngayHoaDon).localeCompare(String(y?.ngayHoaDon)) ||
        String(x?.id).localeCompare(String(y?.id)),
    )
    .map((d) => {
      const soNgayRieng = typeof d.soNgayDuocNo === "number";
      const soNgayDuocNo = soNgayRieng ? d.soNgayDuocNo : gia?.soNgayDuocNo;
      const batDauGoTay = d.ngayBatDauTinhNoTay?.trim() || undefined;
      /* ⚠️ Chỉ nhận ngày hoá đơn đúng khuôn — chuỗi rác lọt vào là `congNgay` cho "Invalid Date"
         và cả cột ngày tới hạn của bảng con hỏng theo. */
      const batDauTheoHoaDon = /^\d{4}-\d{2}-\d{2}$/.test(String(d.ngayHoaDon))
        ? d.ngayHoaDon
        : undefined;
      const ngayBatDau = batDauGoTay ?? batDauTheoHoaDon ?? ngayBatDauCuaDon;
      const ngayToiHan =
        ngayBatDau && typeof soNgayDuocNo === "number" && Number.isFinite(soNgayDuocNo)
          ? congNgay(ngayBatDau, soNgayDuocNo)
          : undefined;
      /**
       * ★ TIỀN ĐÃ TRẢ CHO RIÊNG TỜ NÀY — chỉ cộng đợt chi ĐÃ GẮN đúng tờ (Sếp 20/09/2026).
       *
       * 🔴 KHÔNG CHIA ĐỀU, KHÔNG SUY "TRẢ TỜ CŨ TRƯỚC". Đợt chi chưa gắn tờ nào thì **không**
       * được gán bừa cho tờ nào cả — nơi gọi phải hiện riêng một dòng *"còn N đ chưa gán"*.
       */
      const daTraTo = dotChiCuaDon.reduce(
        (s, x) => (x?.hoaDonId === d.id ? s + (Number(x.soTien) || 0) : s),
        0,
      );
      const tienTo = Number(d.soTien) || 0;
      const conLaiTo = Math.max(0, tienTo - daTraTo);
      /* 🔴 `tienTo > 0` là bắt buộc: tờ ghi 0 đồng mà coi là "đã tất toán" thì nó hiện xanh
         trong khi thực ra là tờ **chưa có số liệu** — cùng luật với cấp đơn (`daTatToan`). */
      const { canhBao, soNgayConLai } = canhBaoToiHan(ngayToiHan, moc);
      const daTatToan = tienTo > 0 && conLaiTo === 0;
      return {
        id: d.id,
        soHoaDon: d.soHoaDon,
        ngayHoaDon: d.ngayHoaDon,
        soTien: d.soTien,
        nhanTep: d.nhanTep,
        nguoiGhiTen: d.nguoiGhiTen,
        daTra: daTraTo,
        conLai: conLaiTo,
        daTatToan,
        soNgayDuocNo,
        soNgayRieng,
        ngayBatDau,
        batDauNhapTay: batDauGoTay !== undefined,
        ngayToiHan,
        /* 🔴 ĐÃ TẤT TOÁN THÌ THÔI CẢNH BÁO HẠN — trả xong rồi mà thẻ vẫn kêu "Quá hạn 3 ngày"
           là app đuổi người dùng đi làm một việc đã xong. Cùng thứ tự ưu tiên với cấp đơn:
           trạng thái tất toán ĐÈ LÊN cảnh báo thời gian. */
        /**
          * 🔴🔴 BA MỨC, ĐỌC ĐỦ TRƯỚC KHI RÚT GỌN:
          *   ① đã trả đủ tờ này → **Đã tất toán** (xanh), đè lên cảnh báo hạn. Trả xong rồi mà
          *      vẫn kêu *"Quá hạn 3 ngày"* là app đuổi người dùng đi làm việc đã xong.
          *   ② CHƯA có đồng nào gắn vào tờ này, MÀ đơn lại đang có tiền chi chưa gắn tờ nào →
          *      **"Chưa gán tiền"** (xám), KHÔNG đỏ.
          *   ③ còn lại → cảnh báo hạn bình thường.
          *
          * 🔴 VÌ SAO PHẢI CÓ MỨC ②: mọi đợt chi ghi TRƯỚC 20/09/2026 đều chưa gắn tờ. Không có
          * mức này thì sáng hôm triển khai, một đơn **đã trả xong** vẫn hiện bảng con đỏ rực
          * "Quá hạn" ở từng tờ — app báo động về một khoản nợ không còn tồn tại. Một agent phản
          * biện 20/09 đo ra đúng ca này trên dữ liệu thật.
          *
          * ⚠️ VẪN KHÔNG TỰ SUY "chắc là đã trả tờ này". Xám nghĩa là *chưa biết*, không phải
          * *đã xong* — người dùng phải vào gắn tiền cho từng tờ thì app mới nói chắc được.
          */
        canhBao: daTatToan
          ? { nhan: "Đã tất toán", tong: "success" as const }
          : daTraTo === 0 && coTienChuaGan
            ? { nhan: "Chưa gán tiền", tong: "neutral" as const }
            : canhBao,
        soNgayConLai: daTatToan ? undefined : soNgayConLai,
      };
    });
}

/**
 * ★★ TIỀN ĐÃ CHI NHƯNG CHƯA GẮN CHO TỜ HOÁ ĐƠN NÀO — Sếp 20/09/2026.
 *
 * 🔴 PHẢI HIỆN RA, TUYỆT ĐỐI KHÔNG GIẤU. Mọi đợt chi ghi trước hôm nay đều chưa gắn tờ; nếu
 * giao diện im lặng bỏ qua chúng thì tổng tiền các tờ cộng lại **không khớp** tổng đã trả của
 * đơn, và người đối chiếu không hiểu tiền đi đâu. Hiện thẳng con số là cách duy nhất thật thà.
 */
export function tienChuaGanHoaDon(
  dotChiCuaDon: readonly DotThanhToanPO[],
  /**
   * ★ Mã của các tờ hoá đơn CÓ THẬT trong đơn. Bỏ trống = không kiểm (giữ hành vi cũ).
   *
   * 🔴🔴 THAM SỐ NÀY LÀ THỨ CHẶN TIỀN BIẾN MẤT — đọc kỹ trước khi bỏ.
   * Đợt chi giữ `hoaDonId` trỏ tới một tờ **đã bị xoá** thì: `hanNoTungToHoaDon` không tờ nào
   * khớp mã nên không cộng nó, mà phép đếm "chưa gán" cũng bỏ qua vì trường vẫn có giá trị ⇒
   * **tiền rơi khỏi cả hai chỗ**, trong khi tổng của đơn vẫn cộng nó. Đo được 20/09/2026 trên
   * bộ thử: 5.000.000 đ bốc hơi, mà bài kiểm khi đó vẫn xanh vì bộ thử toàn dữ liệu sạch.
   *
   * 📌 `xoaHoaDonVAT` đã gỡ mối nối khi xoá tờ QUA APP. Lớp này là phòng thủ thứ hai, cho dữ
   * liệu đã hỏng từ trước hoặc bị sửa bằng đường khác — nó **tự lành**, không cần ai đi dọn.
   */
  idToHopLe?: readonly string[],
): number {
  const hopLe = idToHopLe ? new Set(idToHopLe) : undefined;
  return dotChiCuaDon.reduce((s, x) => {
    const gan = x?.hoaDonId;
    /* Mã trỏ hụt được coi là CHƯA GÁN — tiền quay về chỗ nhìn thấy được, thay vì biến mất. */
    const daGanThat = gan ? (hopLe ? hopLe.has(gan) : true) : false;
    return daGanThat ? s : s + (Number(x?.soTien) || 0);
  }, 0);
}

/**
 * ★★★ CĂN CỨ TÍNH NỢ ĐANG CÓ HIỆU LỰC cho một đơn — **một chỗ duy nhất**, Sếp 20/09/2026.
 *
 * Sếp báo: *"hoá đơn này chưa thấy link tự động qua chức năng công nợ"*, rồi khi được hỏi có muốn
 * app **tự** chuyển sang căn cứ hoá đơn ngay khi đơn có hoá đơn không, Sếp chốt: ***"E SỬA ĐI"***.
 *
 * Hai tầng, đúng thứ tự, đừng đảo:
 *   ① Người dùng ĐÃ bấm chọn (`gia.canCuCongNo` có giá trị) → **tôn trọng tuyệt đối**, kể cả khi
 *      họ chọn "theo PO" trong lúc đơn đã có hoá đơn. Đó vẫn là chỉ đạo 19/09 (*"Có cái sẽ dùng
 *      theo PO, cái dùng theo hoá đơn"*) — nút vẫn còn, quyền quyết vẫn của người dùng.
 *   ② Chưa ai bấm → **suy**: có hoá đơn thì lấy hoá đơn, chưa có thì lấy PO.
 *
 * 🔴 CHỈ ĐỔI GIÁ TRỊ MẶC ĐỊNH, KHÔNG ĐỔI QUYỀN QUYẾT. Trước hôm nay mặc định cứng là `"po"`, nên
 * người dùng ghi hoá đơn xong vẫn thấy cột "Còn phải trả" giữ nguyên số của PO và tưởng app
 * không nhận — đúng thứ Sếp vừa gặp. Sau khi sửa, đơn chưa ai đụng vào sẽ tự dùng con số hoá đơn.
 *
 * ⚠️ VẪN KHÔNG TỰ GHI `canCuCongNo` VÀO DỮ LIỆU. Đây là phép suy lúc đọc, không phải một lượt
 * ghi: ghi tự động là app tự quyết thay người dùng rồi khoá luôn lựa chọn đó, và mỗi máy đang mở
 * app sẽ đẩy một lượt ghi lên kho chung cho cùng một việc.
 */
export function canCuHieuLuc(
  gia: { canCuCongNo?: CanCuCongNo; hoaDonVAT?: readonly unknown[]; tongTienHoaDon?: number } | undefined,
): CanCuCongNo {
  /* 🔴 25/09/2026 — Sếp: *"Bỏ chữ năng đánh dấu này đi"* (nút PO / Hoá đơn dưới cột "Còn phải
     trả"). BỎ NÚT THÌ PHẢI BỎ LUÔN TẦNG ①: lựa chọn tay đã lưu (`gia.canCuCongNo`) nay KHÔNG CÒN
     được đọc. Giữ lại là đơn nào từng bấm "theo PO" sẽ kẹt vĩnh viễn ở PO mà không còn nút nào để
     đổi — người dùng ghi hoá đơn xong vẫn thấy số PO và không có cách gì sửa. Dữ liệu cũ không xoá
     (đọc lịch sử còn thấy ai từng chọn gì), chỉ thôi dùng để tính. Chỉ đạo 19/09 ("có cái theo PO,
     có cái theo hoá đơn") vẫn đúng — nay app tự quyết theo việc đơn đã có hoá đơn hay chưa. */
  const coHoaDon =
    (Array.isArray(gia?.hoaDonVAT) && gia.hoaDonVAT.length > 0) ||
    typeof gia?.tongTienHoaDon === "number";
  return coHoaDon ? "hoa_don" : "po";
}

/**
 * Chuỗi số hoá đơn hiện trên màn Công nợ — nối từ danh sách, hoặc trường cũ nếu chưa có danh sách.
 * Cùng luật ưu tiên với `tongTienHoaDonCuaDon`; hai thứ phải luôn nói về cùng một nguồn.
 */
export function chuoiSoHoaDonCuaDon(
  gia: { hoaDonVAT?: readonly { soHoaDon: string }[]; soHoaDon?: string } | undefined,
): string | undefined {
  const ds = gia?.hoaDonVAT;
  if (Array.isArray(ds) && ds.length > 0) {
    const cac = ds.map((d) => String(d?.soHoaDon ?? "").trim()).filter(Boolean);
    if (cac.length > 0) return cac.join(" · ");
  }
  return gia?.soHoaDon;
}

/**
 * ★★ BỐN CON SỐ KPI ĐẦU TRANG CÔNG NỢ — Sếp 25/09/2026 (hỏi bảng "Danh sách hóa đơn phải trả" có
 * trùng không). Trước ngày này 4 thẻ KPI đọc `congNo` = hằng số `CONG_NO_MAU = []` nên LUÔN hiện 0,
 * dù bảng "Theo dõi công nợ theo đơn hàng" ngay dưới có nợ thật. Nay tính từ CHÍNH các dòng của
 * bảng đó — một nguồn duy nhất, thẻ và bảng không thể nói ngược nhau.
 *
 * 📌 Đọc `soNgayConLai` / `daTatToan` mà `congNoTheoDonHang` đã tính — không tính hạn lần thứ hai.
 */
export interface TongHopCongNo {
  tongConLai: number;
  soDon: number;
  soChuaTatToan: number;
  quaHan: { so: number; tien: number };
  sapDenHan: { so: number; tien: number };
  soDaTatToan: number;
}

export function tongHopCongNo(
  ds: readonly Pick<CongNoTheoDon, "conLai" | "daTatToan" | "soNgayConLai">[],
): TongHopCongNo {
  const kq: TongHopCongNo = {
    tongConLai: 0,
    soDon: ds.length,
    soChuaTatToan: 0,
    quaHan: { so: 0, tien: 0 },
    sapDenHan: { so: 0, tien: 0 },
    soDaTatToan: 0,
  };
  for (const r of ds) {
    const con = Number(r.conLai) || 0;
    if (r.daTatToan) {
      kq.soDaTatToan += 1;
      continue;
    }
    kq.soChuaTatToan += 1;
    kq.tongConLai += con;
    if (r.soNgayConLai === undefined) continue;
    if (r.soNgayConLai < 0) {
      kq.quaHan.so += 1;
      kq.quaHan.tien += con;
    } else if (r.soNgayConLai <= NGAY_SAP_DEN_HAN) {
      kq.sapDenHan.so += 1;
      kq.sapDenHan.tien += con;
    }
  }
  return kq;
}

/**
 * ★★ DỰNG BẢNG CÔNG NỢ TỪ ĐƠN HÀNG THẬT — một dòng một đơn.
 *
 * 🔴 CHỈ LẤY ĐƠN ĐÃ NHẬN ĐỦ HÀNG. Đơn còn đang giao thì chưa phát sinh nghĩa vụ trả tiền cho
 * phần chưa về; đưa vào bảng là thổi phồng dư nợ bằng tiền của hàng chưa nhận.
 *
 * 🔴 KHÔNG ĐỌC `DonDatHang.trangThai === "hoan_thanh"` để lọc. Từ 27/08/2026 đơn được xác nhận
 * hoàn thành ngay khi có phiếu giao hàng, KHÔNG chờ hóa đơn VAT — nên "hoàn thành" không còn
 * nói gì về việc đã trả tiền hay chưa. Điều kiện đúng là hàng đã về đủ.
 *
 * ⚠️ ĐÂY LÀ CÔNG NỢ SUY RA, CHƯA PHẢI SỔ CÔNG NỢ ĐẦY ĐỦ. App chưa theo dõi từng lần thanh
 * toán, nên cột "Tổng công nợ" là TOÀN BỘ giá trị đơn, chưa trừ phần đã trả. Muốn trừ thì phải
 * có chứng từ chi — việc đó cần Ban lãnh đạo chốt trước, đừng tự bịa một trường `daTra`.
 *
 * 📌 Sắp xếp: đơn gấp lên trước — quá hạn nặng nhất đứng đầu, rồi tới sắp đến hạn. Đơn chưa
 * tính được hạn xuống cuối vì chưa làm gì được với nó.
 */
export function congNoTheoDonHang(
  donHang: DonDatHang[],
  giaDonHang: GiaDonDatHang[],
  phieuNhan: PhieuNhanHang[],
  moc: Date = new Date(),
  /**
   * ★ Các đợt đã chi (Sếp 18/09/2026). Để TUỲ CHỌN và mặc định rỗng: nơi gọi cũ chưa truyền thì
   * bảng chạy y như trước (đã trả 0, còn lại = tổng), không vỡ.
   */
  dotThanhToan: readonly DotThanhToanPO[] = [],
): CongNoTheoDon[] {
  const ra: CongNoTheoDon[] = [];
  for (const po of donHang) {
    if (po.trangThai === "huy") continue;
    const phieuCuaPO = phieuNhan.filter((p) => p.poId === po.id);
    const dotChi = dotThanhToan
      .filter((d) => d.poId === po.id)
      .slice()
      .sort((a, b) => (a.ngayChi < b.ngayChi ? -1 : a.ngayChi > b.ngayChi ? 1 : 0));
    /**
     * 🔴 NỚI BỘ LỌC 18/09/2026: đơn **đã có ít nhất một đợt chi** cũng vào bảng, dù hàng chưa về đủ.
     *
     * Trước đó bảng chỉ nhận đơn đã nhận đủ hàng — đúng cho việc tính dư nợ, nhưng nó tạo một
     * VÙNG MÙ: tiền **tạm ứng / trả trước** cho đơn đang giao (chuyện thường với vật tư xây dựng)
     * ghi vào rồi **không hiện ở bất cứ đâu**. Tiền đã ra khỏi tài khoản mà không màn nào thấy là
     * lỗi nặng hơn hẳn việc bảng có thêm một dòng.
     *
     * ⚠️ Đơn kiểu đó vẫn phải NHÌN RA ĐƯỢC là hàng chưa về đủ — xem `hangChuaVeDu` bên dưới và
     * nhãn ở cột cảnh báo. Trộn nó lẫn với đơn đã giao đủ là thổi phồng dư nợ thật.
     */
    const daGiaoDu = poDaGiaoDu(tinhTienDoPO(po, phieuCuaPO));
    if (!daGiaoDu && dotChi.length === 0) continue;

    const gia = giaDonHang.find((g) => g.poId === po.id);
    const tien = tinhTienChiTietPO(po, gia);
    const daTra = daTraCuaPO(po.id, dotChi);
    /* Căn cứ của RIÊNG đơn này — chưa ai chọn thì theo PO. */
    const canCu: CanCuCongNo = canCuHieuLuc(gia);
    /**
     * 🔴 `conLai` VÀ `daTatToan` TÍNH THEO ĐÚNG CĂN CỨ CỦA ĐƠN, không phải luôn theo PO.
     *
     * Chọn "theo hoá đơn" mà chưa nhập hoá đơn thì **chưa có căn cứ**: lúc đó `conLai` giữ theo PO
     * để các phép cộng khác không vỡ, nhưng `daTatToan` phải là `false` và giao diện phải nói rõ
     * *"chưa nhập hoá đơn"* — xem `tienLamCanCu`. Không được coi đơn đó là đã trả xong.
     */
    /* ★ Từ 19/09/2026 (chiều) con số hoá đơn lấy qua `tongTienHoaDonCuaDon` — nó cộng danh sách
       từng tờ hoá đơn (nguồn duy nhất, Sếp chốt), chỉ rơi về trường gõ tay cũ khi đơn chưa có
       danh sách. Đọc thẳng `gia.tongTienHoaDon` ở đây là bảng Công nợ **không thấy** hoá đơn vừa
       nhập ở mục ⑥ — đúng kiểu hai chỗ nói hai số. */
    const tienCanCu = canCu === "hoa_don" ? tongTienHoaDonCuaDon(gia) : tien.tongThanhToan;
    const conLai = conLaiCuaPO(tienCanCu ?? tien.tongThanhToan, daTra);
    /* 🔴 `> 0` chứ không phải `>= 0`: đơn chưa trả đồng nào mà tổng công nợ bằng 0 (đơn 0 đồng,
       hoặc chưa nhập giá) KHÔNG phải "đã tất toán" — nó là đơn chưa có số liệu. */
    const daTatToan = daTra > 0 && conLai === 0 && tienCanCu !== undefined;
    const soNgayDuocNo = gia?.soNgayDuocNo;
    /**
     * ★★ ĐẢO VAI HAI CỘT NGÀY (Ban lãnh đạo 06/09/2026):
     *   · "Ngày bắt đầu tính" → CHO NHẬP TAY, đè lên ngày nhận hàng lần cuối app tự suy ra.
     *   · "Ngày tới hạn"      → CỐ ĐỊNH, LUÔN tự tính = ngày bắt đầu + số ngày được nợ.
     *
     * 📌 ĐỔI so với chỉ đạo 28/08/2026 (khi đó ngày tới hạn mới là ô nhập tay). Lý do đổi hợp
     * nghiệp vụ hơn: mốc bắt đầu tính nợ có thể lệch với ngày nhập kho (VD tính từ ngày xuất hóa
     * đơn), nên nó là thứ cần sửa; còn ngày tới hạn chỉ là mốc bắt đầu cộng số ngày được nợ —
     * để người dùng gõ tay nó là mở đường cho hạn không khớp với điều khoản đã ghi.
     *
     * 🔴 NGÀY BẮT ĐẦU: NHẬP TAY THẮNG TỰ TÍNH. `ngayBatDauTinhNo` (ngày nhận hàng lần cuối) chỉ
     * là NỀN — có người gõ tay thì lấy tay. Không thì mỗi lần thêm một phiếu nhập kho, ngày bắt
     * đầu tự nhảy sang ngày giao mới nhất kéo theo ngày tới hạn nhảy; gõ tay để chốt cứng.
     *
     * ⚠️ Chuỗi rỗng phải coi như KHÔNG CÓ: ô ngày bị xóa trắng trả về `""`, mà `"" ?? x` cho ra
     * `""` chứ không rơi về `x`. Để lọt là ngày bắt đầu thành rỗng → `new Date("")` = Invalid
     * Date → cột cảnh báo hiện `NaN`.
     */
    const batDauGoTay = gia?.ngayBatDauTinhNoTay?.trim() || undefined;
    const batDauTuNhan = ngayBatDauTinhNo(phieuCuaPO);
    /**
     * ★★ NỀN CUỐI CÙNG: NGÀY LẬP PO — Sếp 19/09/2026: ***"Ngày mặc định thì sẽ lấy theo PO"***.
     *
     * 🔴 ĐỨNG SAU CÙNG TRONG BA NGUỒN, KHÔNG ĐƯỢC ĐẢO THỨ TỰ:
     *   ① ngày **gõ tay** — người dùng đã chốt mốc, phải thắng tất cả (Ban lãnh đạo 06/09/2026);
     *   ② ngày **nhận hàng lần cuối** — mốc đúng nhất về nghiệp vụ, nợ tính từ lúc hàng về;
     *   ③ ngày **lập PO** — chỉ dùng khi hai cái trên đều trống.
     *
     * 📌 VÌ SAO CẦN ③: từ 18/09 bảng nhận cả đơn **đã tạm ứng mà hàng chưa về đủ**. Những đơn đó
     * chưa có phiếu nhập kho nào nên ② trống, và trước hôm nay chúng hiện *"Thiếu số ngày nợ"* —
     * tức có tiền đã chi mà không mốc nào để tính hạn. Lấy ngày lập PO làm nền thì bảng luôn có
     * một mốc đọc được, và người dùng vẫn gõ tay đè lên được bất cứ lúc nào.
     *
     * ⚠️ KHÔNG dùng `ngayGiaoDuKien`: đó là dự kiến, đổi được và thường lùi — lấy nó làm mốc tính
     * nợ là hạn thanh toán tự trôi theo mỗi lần sửa đơn.
     */
    const ngayBatDau = batDauGoTay ?? batDauTuNhan ?? po.ngayLapPO;
    /* Ngày tới hạn CỐ ĐỊNH tự tính từ ngày bắt đầu (dù ngày bắt đầu là tay hay tự suy ra).
       Thiếu một trong hai vế (chưa có ngày bắt đầu / chưa ghi số ngày được nợ) thì để trống,
       KHÔNG bịa ngày. */
    const ngayToiHan =
      ngayBatDau !== undefined && soNgayDuocNo !== undefined
        ? congNgay(ngayBatDau, soNgayDuocNo)
        : undefined;
    const { canhBao, soNgayConLai } = canhBaoToiHan(ngayToiHan, moc);

    ra.push({
      poId: po.id,
      /* Cột ② "Tên đơn hàng": app KHÔNG có trường nào tên vậy — chỉ có MÃ (`po.code`). Ghép
         thêm tên công trình cho người đọc nhận ra ngay đơn của công trình nào, giữ mã đứng
         trước để vẫn tra cứu được. Đơn không gắn công trình thì chỉ hiện mã. */
      maDonHang: po.code,
      tenCongTrinh: po.tenCongTrinh,
      /**
       * 🔴 ƯU TIÊN MÃ ĐỀ XUẤT (`000000097`), KHÔNG PHẢI MÃ ĐỀ NGHỊ NỘI BỘ — Sếp 20/09/2026 chỉ
       * đúng cột này và ghi ***"Mã này đang sai"***.
       *
       * Đo trên kho thật: `prCode` của hồ sơ phòng ban là
       * `"Phòng Kỹ thuật Thi công (HP Cons)-PR-001"` — vì mã đề nghị nội bộ được ghép từ ô mã
       * hợp đồng, mà App Request nhét **tên phòng** vào ô đó với hồ sơ không có công trình. Nên
       * cột "Mã số đề nghị" in ra một cái tên, không phải một cái mã.
       *
       * 📌 `maDeXuatAppRequest` mới là mã người dùng nhận ra — chính là con số thẻ kanban đang
       * hiện (`000000121 - 30-2025-HĐXD…`). Lấy thẳng từ PO, không tra ngược sang bảng đề nghị:
       * `DonDatHang` đã chép sẵn trường này, và bản chép là cố ý để đơn đứng yên kể cả khi đề
       * nghị nguồn đổi.
       *
       * ⚠️ VẪN RƠI VỀ `prCode` khi đơn chưa có mã đề xuất (hồ sơ lập tay trong app, dữ liệu cũ) —
       * thà hiện mã nội bộ còn hơn để trống một cột người ta dùng để đối chiếu.
       */
      maDeNghi: po.maDeXuatAppRequest?.trim() || po.prCode,
      /* ★ Cùng một nguồn với `tienCanCu` ở trên — xem `chuoiSoHoaDonCuaDon` / `tongTienHoaDonCuaDon`. */
      soHoaDon: chuoiSoHoaDonCuaDon(gia),
      tongTienHoaDon: tongTienHoaDonCuaDon(gia),
      /* Số tờ hoá đơn đã ghi — nơi vẽ cần để biết ô còn sửa tay được không, và để so với số đợt
         giao mà nhắc bằng chữ vàng (Sếp chốt 19/09: nhắc, KHÔNG chặn). */
      soToHoaDon: Array.isArray(gia?.hoaDonVAT) ? gia.hoaDonVAT.length : 0,
      /* Sắp theo ngày ngay tại tầng quy trình để mọi nơi bày ra đều cùng một thứ tự. */
      /* ★ Hạn nợ RIÊNG cho từng tờ — Sếp 20/09/2026. Tính ở tầng quy trình, giao diện chỉ bày:
         quy ước 3.4b cấm để hàm tính nghiệp vụ trong tệp giao diện, và để hai chỗ cùng tính một
         ngày tới hạn là sớm muộn lệch nhau. */
      hoaDon: hanNoTungToHoaDon(gia, ngayBatDau, moc, dotChi),
      /* ★ Tiền đã chi mà chưa gắn cho tờ nào — phải hiện ra, xem `tienChuaGanHoaDon`. */
      tienChuaGan: tienChuaGanHoaDon(
        dotChi,
        Array.isArray(gia?.hoaDonVAT) ? gia.hoaDonVAT.map((x) => x?.id) : [],
      ),
      canCu,
      daTra,
      conLai,
      dotChi,
      daTatToan,
      tenDonHang: [po.code, po.tenCongTrinh].filter(Boolean).join(" — "),
      tenNCC: po.supplierTen,
      tongCongNo: tien.tongThanhToan,
      soNgayDuocNo,
      ngayBatDau,
      batDauNhapTay: batDauGoTay !== undefined,
      ngayToiHan,
      /**
       * ★★ BA TRẠNG THÁI ĐÈ LÊN CẢNH BÁO HẠN, theo đúng thứ tự ưu tiên — Sếp 18/09/2026.
       *
       * ① **Đã tất toán** thắng tất cả: trả xong rồi thì hạn thanh toán hết ý nghĩa. Để nguyên
       *    *"Quá hạn N ngày"* là app nói dối trên chính cột người ta nhìn để đi trả tiền.
       * ② **Hàng chưa về đủ** (đơn chỉ vào bảng vì đã tạm ứng): chưa phát sinh nghĩa vụ trả nốt,
       *    nên không tính hạn — nhưng PHẢI nói rõ lý do, không để trống.
       * ③ Còn lại: giữ nguyên cảnh báo theo hạn như trước.
       *
       * 🔴 LUÔN CÓ CẢ MÀU LẪN CHỮ (Design System V1.1) — `neutral` cho ①② vì chúng không phải
       * việc phải làm gấp, nhưng chữ thì nói rõ tình trạng.
       */
      canhBao: daTatToan
        ? { nhan: "Đã tất toán", tong: "success" }
        : !daGiaoDu
          ? { nhan: "Mới tạm ứng", tong: "neutral" }
          : canhBao,
      /* Đã tất toán thì bỏ hẳn số ngày còn lại: mọi phép đếm quá hạn ở nơi khác đọc trường này. */
      soNgayConLai: daTatToan ? undefined : soNgayConLai,
    });
  }
  /* Đơn chưa tính được hạn (`undefined`) xuống cuối; còn lại xếp theo số ngày còn lại tăng
     dần — số âm (quá hạn) lên đầu. */
  return ra.sort((a, b) => {
    if (a.soNgayConLai === undefined) return b.soNgayConLai === undefined ? 0 : 1;
    if (b.soNgayConLai === undefined) return -1;
    return a.soNgayConLai - b.soNgayConLai;
  });
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
