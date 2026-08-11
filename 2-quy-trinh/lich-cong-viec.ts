// ============================================================
// LỊCH CÔNG VIỆC — suy ra việc phải làm theo NGÀY từ chứng từ có thật
//
// 🔴 Chỉ đạo Ban lãnh đạo 11/08/2026: *"Thêm chức năng lịch ghi chú cho các tài khoản của bộ
// phận này, và sẽ tự động cập nhật công việc vào lịch khi có nhiệm vụ"*.
// Sếp chốt 4 mốc tự động: ngày cần hàng · hạn giao đơn hàng · hạn NCC nộp báo giá ·
// hạn thanh toán công nợ.
//
// 🔴 NGUYÊN TẮC QUAN TRỌNG NHẤT: VIỆC TỰ ĐỘNG ĐƯỢC SUY RA, KHÔNG LƯU BẢN SAO.
// Mỗi lần mở lịch, hàm dưới đây đọc chứng từ hiện có rồi tính ra danh sách — đúng cách
// `xacDinhGiaiDoan` suy giai đoạn từ chứng từ (`giai-doan-mua-hang.ts`). Lý do:
//
//   1. Lưu bản sao là tạo nguồn sự thật thứ hai. `suaThoiHan` cho phép đổi `ngayCanHang`
//      (có bắt ghi lý do); nếu lịch giữ bản sao thì đổi hạn xong lịch vẫn treo ngày cũ.
//      Đúng loại lỗi CLAUDE.md mục 3.4b đã cảnh báo: hai chỗ cùng tính một con số rồi lệch.
//   2. Không có chỗ để lưu. Dữ liệu nghiệp vụ đang ở localStorage (~5MB cho cả tên miền),
//      nhân bản thông tin đã có sẵn là ăn dung lượng vô ích.
//   3. Bản sao sinh việc mồ côi: đề nghị bị đóng dở mà mục lịch còn treo.
//   4. Nếu là bản sao, người dùng sẽ tưởng xóa được mục "Hạn giao hàng" — mà xóa nó không
//      làm đơn hết hạn. Suy ra thì mục tự động KHÔNG có nút xóa, đúng bản chất.
//
// ⚠️ HỆ QUẢ PHẢI NHẬN: lịch không giữ được trạng thái riêng cho việc tự động (không có "tôi
// đã xử lý mục này"). Xong hay chưa phải đọc từ chứng từ — hồ sơ đã kết thúc thì mục tự rụng
// khỏi lịch. Muốn ghi chú riêng thì dùng ghi chú tay (`3-du-lieu/ghi-chu-ca-nhan.ts`).
//
// 📌 Ghi chú tay là SỔ TAY RIÊNG TƯ (Sếp chốt 11/08/2026). Không ai khác đọc được, kể cả
// trưởng bộ phận. Muốn giao việc thì dùng phân bổ dòng đề nghị hoặc Chuyển tiếp.
// ============================================================

import type {
  BaoGia,
  CongNo,
  DeNghiMuaHang,
  DonDatHang,
  NgayISO,
} from "@/3-du-lieu/kieu-du-lieu";
import type { Quyen } from "@/4-phan-quyen/quyen";
import type { Tong } from "@/2-quy-trinh/trang-thai";
import { deNghiConDangChay } from "@/2-quy-trinh/giai-doan-mua-hang";
import type { GhiChuCongViec } from "@/3-du-lieu/ghi-chu-ca-nhan";

/** Loại mục trên lịch — quyết định màu, chữ và đường bấm vào. */
export type LoaiMucLich =
  | "can_hang"
  | "cho_phan_bo"
  | "han_bao_gia"
  | "han_giao"
  | "han_thanh_toan"
  | "ghi_chu";

export interface MucLich {
  /** Khóa dựng từ loại + mã hồ sơ, KHÔNG phải id lưu trong dữ liệu (mục tự động không được lưu). */
  khoa: string;
  loai: LoaiMucLich;
  /** Ngày mục này thuộc về, dạng `YYYY-MM-DD`. */
  ngay: NgayISO;
  /** Chữ chính hiện trên ô ngày. */
  nhan: string;
  /** Dòng phụ: mã hồ sơ, số lượng, tên nhà cung cấp (nếu vai trò được xem). */
  moTa?: string;
  /** Bấm vào thì đi đâu. Ghi chú tay không có đường đi. */
  duongDan?: string;
  /** Ghi chú tay mới cho xóa/đánh dấu xong; mục tự động thì không. */
  laGhiChuTay: boolean;
  /** Ghi chú tay đã đánh dấu xong. */
  xong?: boolean;
}

export const NHAN_LOAI_MUC: Record<LoaiMucLich, { nhan: string; tong: Tong }> = {
  can_hang: { nhan: "Cần hàng", tong: "primary" },
  cho_phan_bo: { nhan: "Chờ phân bổ", tong: "danger" },
  han_bao_gia: { nhan: "Hạn nộp báo giá", tong: "warning" },
  han_giao: { nhan: "Hạn giao hàng", tong: "primary" },
  han_thanh_toan: { nhan: "Hạn thanh toán", tong: "warning" },
  ghi_chu: { nhan: "Ghi chú", tong: "neutral" },
};

export interface NguonLich {
  deNghi: DeNghiMuaHang[];
  donHang: DonDatHang[];
  baoGia: BaoGia[];
  congNo: CongNo[];
  ghiChu: GhiChuCongViec[];
}

/** Cắt phần giờ để so ngày — mọi mốc trong app đều lưu `YYYY-MM-DD`. */
function chiNgay(iso: string | undefined): NgayISO | null {
  if (!iso) return null;
  const s = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

/**
 * Dựng danh sách mục lịch CỦA MỘT NGƯỜI.
 *
 * 🔴 LỌC THEO NGƯỜI PHỤ TRÁCH, không đổ hết mọi hồ sơ lên lịch của mọi người. Lịch mà hiện
 * cả việc của người khác thì nó thành bảng quy trình thứ hai, mất hẳn công dụng "hôm nay TÔI
 * phải làm gì".
 *
 * ⚠️ Một đề nghị có thể lên lịch của NHIỀU người: mỗi dòng vật tư có người phụ trách riêng.
 * Mỗi người chỉ thấy phần dòng của mình, và `moTa` đếm đúng số dòng đó.
 */
export function dungLichCuaToi(
  nguon: NguonLich,
  uid: string,
  quyen: Quyen,
): MucLich[] {
  const ra: MucLich[] = [];

  // ---- ① Ngày cần hàng của đề nghị (theo dòng mình phụ trách) ----
  for (const dn of nguon.deNghi) {
    if (!deNghiConDangChay(dn) || dn.luuTru) continue;
    const ngay = chiNgay(dn.ngayCanHang);
    if (!ngay) continue;

    const dongCuaToi = dn.items.filter((d) => d.nguoiPhuTrachUid === uid);
    if (dongCuaToi.length > 0) {
      ra.push({
        khoa: `can_hang|${dn.id}`,
        loai: "can_hang",
        ngay,
        nhan: `Cần hàng — ${dn.code}`,
        moTa: `${dongCuaToi.length}/${dn.items.length} dòng vật tư của bạn`,
        duongDan: `/de-nghi/${dn.id}`,
        laGhiChuTay: false,
      });
    }

    // ---- ② Còn dòng chưa phân bổ — chỉ người có quyền phân bổ mới thấy ----
    // Đây là việc CỦA TRƯỞNG BỘ PHẬN, không phải của nhân viên: dòng chưa ai nhận thì
    // không ai đi hỏi giá cho nó, để lâu là trễ ngày cần hàng.
    const chuaPhanBo = dn.items.filter((d) => !d.nguoiPhuTrachUid).length;
    if (chuaPhanBo > 0 && quyen.phanBoCongViec) {
      ra.push({
        khoa: `cho_phan_bo|${dn.id}`,
        loai: "cho_phan_bo",
        ngay,
        nhan: `Chờ phân bổ — ${dn.code}`,
        moTa: `${chuaPhanBo} dòng chưa có người phụ trách`,
        duongDan: `/de-nghi/${dn.id}`,
        laGhiChuTay: false,
      });
    }
  }

  // ---- ③ Hạn nhà cung cấp nộp báo giá ----
  for (const bg of nguon.baoGia) {
    // Đã chốt nhà cung cấp hoặc đã hủy thì hết việc chờ giá.
    if (bg.trangThai === "da_chon_ncc" || bg.trangThai === "huy") continue;
    const ngay = chiNgay(bg.hanNop);
    if (!ngay) continue;
    // Của người phụ trách các dòng của đề nghị gốc — bảng báo giá không có người phụ trách riêng.
    const dn = nguon.deNghi.find((d) => d.id === bg.prId);
    if (!dn || !dn.items.some((d) => d.nguoiPhuTrachUid === uid)) continue;
    ra.push({
      khoa: `han_bao_gia|${bg.id}`,
      loai: "han_bao_gia",
      ngay,
      nhan: `Hạn nộp báo giá — ${bg.code}`,
      moTa: dn.code,
      duongDan: `/bao-gia/${bg.id}`,
      laGhiChuTay: false,
    });
  }

  // ---- ④ Hạn giao hàng của đơn đặt hàng ----
  for (const po of nguon.donHang) {
    if (po.trangThai === "hoan_thanh" || po.trangThai === "huy") continue;
    if (po.nguoiPhuTrachUid !== uid) continue;
    const ngay = chiNgay(po.ngayGiaoDuKien);
    if (!ngay) continue;
    ra.push({
      khoa: `han_giao|${po.id}`,
      loai: "han_giao",
      ngay,
      nhan: `Hạn giao hàng — ${po.code}`,
      // 🔒 Tên nhà cung cấp chỉ hiện với vai trò được xem — cùng luật với mọi chỗ khác.
      moTa: quyen.xemNhaCungCap ? po.supplierTen : undefined,
      duongDan: `/don-hang/${po.id}`,
      laGhiChuTay: false,
    });
  }

  // ---- ⑤ Hạn thanh toán công nợ ----
  // 🔒 Chỉ vai trò xem được công nợ. Công nợ là số tiền phải trả nhà cung cấp, không phải
  // việc của thủ kho hay phòng thi công.
  if (quyen.xemCongNo) {
    for (const cn of nguon.congNo) {
      if (cn.trangThai === "da_thanh_toan") continue;
      const ngay = chiNgay(cn.hanThanhToan);
      if (!ngay) continue;
      ra.push({
        khoa: `han_thanh_toan|${cn.id}`,
        loai: "han_thanh_toan",
        ngay,
        nhan: `Hạn thanh toán — HĐ ${cn.soHoaDon}`,
        moTa: quyen.xemNhaCungCap ? cn.tenNCC : cn.poCode,
        duongDan: "/cong-no",
        laGhiChuTay: false,
      });
    }
  }

  // ---- ⑥ Ghi chú tay CÓ NGÀY ----
  // Ghi chú không có ngày thì không lên lịch — vẫn nằm ở sổ tay tại màn "Công việc của tôi".
  for (const gc of nguon.ghiChu) {
    const ngay = chiNgay(gc.ngayHan);
    if (!ngay) continue;
    ra.push({
      khoa: `ghi_chu|${gc.id}`,
      loai: "ghi_chu",
      ngay,
      nhan: gc.noiDung,
      moTa: gc.maHoSo,
      laGhiChuTay: true,
      xong: gc.xong,
    });
  }

  return ra;
}

/** Gom mục lịch theo ngày để vẽ ô — khóa là `YYYY-MM-DD`. */
export function gomTheoNgay(muc: MucLich[]): Map<NgayISO, MucLich[]> {
  const m = new Map<NgayISO, MucLich[]>();
  for (const x of muc) {
    const ds = m.get(x.ngay);
    if (ds) ds.push(x);
    else m.set(x.ngay, [x]);
  }
  // Trong một ngày: việc chưa xong lên trước, rồi theo loại để thứ tự ổn định giữa các lần vẽ.
  for (const ds of m.values()) {
    ds.sort((a, b) => Number(a.xong ?? false) - Number(b.xong ?? false) || a.loai.localeCompare(b.loai));
  }
  return m;
}

// ------------------------------------------------------------
// LƯỚI THÁNG
// ------------------------------------------------------------

export interface ONgay {
  /** `YYYY-MM-DD` */
  ngay: NgayISO;
  /** Ngày trong tháng, 1–31. */
  soNgay: number;
  /** Thuộc tháng đang xem, hay là ngày đệm của tháng trước/sau. */
  trongThang: boolean;
  laHomNay: boolean;
  /** Thứ Bảy hoặc Chủ nhật — tô nhạt cho dễ đọc. */
  cuoiTuan: boolean;
}

/** Ghép `YYYY-MM-DD` từ các số, không qua `toISOString` để không bị lệch múi giờ. */
function ghepNgay(nam: number, thang0: number, ngay: number): NgayISO {
  return `${nam}-${String(thang0 + 1).padStart(2, "0")}-${String(ngay).padStart(2, "0")}`;
}

/**
 * Dựng lưới tháng, TUẦN BẮT ĐẦU TỪ THỨ HAI (lịch Việt Nam).
 *
 * ⚠️ KHÔNG dùng `toISOString()` để lấy chuỗi ngày. `toISOString` trả về giờ UTC nên ở UTC+7
 * mọi mốc trước 07:00 sáng sẽ lùi về hôm trước — lịch lệch một ngày. Ghép chuỗi bằng
 * `getFullYear/getMonth/getDate` như dưới đây là luôn đúng theo giờ máy.
 */
export function dungLuoiThang(nam: number, thang0: number, homNay: Date = new Date()): ONgay[] {
  const dauThang = new Date(nam, thang0, 1);
  // getDay(): 0=CN … 6=T7. Đổi sang 0=T2 … 6=CN.
  const lech = (dauThang.getDay() + 6) % 7;
  const chuoiHomNay = ghepNgay(homNay.getFullYear(), homNay.getMonth(), homNay.getDate());

  const o: ONgay[] = [];
  // 6 hàng × 7 cột = 42 ô, đủ cho mọi tháng và giữ chiều cao lưới không nhảy giữa các tháng.
  for (let i = 0; i < 42; i++) {
    const d = new Date(nam, thang0, 1 - lech + i);
    const ngay = ghepNgay(d.getFullYear(), d.getMonth(), d.getDate());
    const thu = d.getDay();
    o.push({
      ngay,
      soNgay: d.getDate(),
      trongThang: d.getMonth() === thang0 && d.getFullYear() === nam,
      laHomNay: ngay === chuoiHomNay,
      cuoiTuan: thu === 0 || thu === 6,
    });
  }
  return o;
}

export const TEN_THU = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function tenThang(thang0: number): string {
  return `Tháng ${thang0 + 1}`;
}

/**
 * Đếm việc CHƯA XONG đến hạn trong khoảng [từ hôm nay, hôm nay + `soNgay`], kèm số quá hạn.
 * Dùng cho dòng tóm tắt đầu màn lịch và huy hiệu ở menu.
 */
export function tomTatSapToi(
  muc: MucLich[],
  soNgay = 7,
  homNay: Date = new Date(),
): { quaHan: number; homNayCo: number; trongKhoang: number } {
  const chuoi = (d: Date) => ghepNgay(d.getFullYear(), d.getMonth(), d.getDate());
  const nay = chuoi(homNay);
  const het = chuoi(new Date(homNay.getFullYear(), homNay.getMonth(), homNay.getDate() + soNgay));
  const conViec = muc.filter((m) => !m.xong);
  return {
    quaHan: conViec.filter((m) => m.ngay < nay).length,
    homNayCo: conViec.filter((m) => m.ngay === nay).length,
    trongKhoang: conViec.filter((m) => m.ngay > nay && m.ngay <= het).length,
  };
}
