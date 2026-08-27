// ============================================================
// TUỔI NỢ (AGING) — phân tích công nợ phải trả theo số ngày quá hạn
//
// Quy ước: chỉ tính phần CÒN PHẢI TRẢ (soTien - daTra). Hóa đơn đã tất toán
// không đưa vào biểu đồ để tránh thổi phồng dư nợ.
// ============================================================

import type {
  CongNo,
  DonDatHang,
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

/** Một dòng của bảng "Công nợ theo đơn hàng" — đúng 8 cột Ban lãnh đạo yêu cầu. */
export interface CongNoTheoDon {
  poId: string;
  /** Cột ②. Mã đơn + tên công trình nếu có — xem chú thích ở `congNoTheoDonHang`. */
  tenDonHang: string;
  maDonHang: string;
  tenCongTrinh?: string;
  /** Cột ③. */
  tenNCC: string;
  /** Cột ④ — tổng phải trả của đơn (đã gồm thuế, đã trừ chiết khấu). */
  tongCongNo: number;
  /** Cột ⑤ — số ngày được nợ; `undefined` = đơn không ghi. */
  soNgayDuocNo?: number;
  /** Cột ⑥ — `undefined` = chưa lần giao nào được nhập kho. */
  ngayBatDau?: NgayISO;
  /** Cột ⑦ — `undefined` khi thiếu một trong hai vế của phép cộng. */
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
): CongNoTheoDon[] {
  const ra: CongNoTheoDon[] = [];
  for (const po of donHang) {
    if (po.trangThai === "huy") continue;
    const phieuCuaPO = phieuNhan.filter((p) => p.poId === po.id);
    if (!poDaGiaoDu(tinhTienDoPO(po, phieuCuaPO))) continue;

    const gia = giaDonHang.find((g) => g.poId === po.id);
    const tien = tinhTienChiTietPO(po, gia);
    const ngayBatDau = ngayBatDauTinhNo(phieuCuaPO);
    const soNgayDuocNo = gia?.soNgayDuocNo;
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
      tenDonHang: [po.code, po.tenCongTrinh].filter(Boolean).join(" — "),
      tenNCC: po.supplierTen,
      tongCongNo: tien.tongThanhToan,
      soNgayDuocNo,
      ngayBatDau,
      ngayToiHan,
      canhBao,
      soNgayConLai,
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
