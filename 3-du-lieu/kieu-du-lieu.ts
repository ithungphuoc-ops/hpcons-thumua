// ============================================================
// MÔ HÌNH DỮ LIỆU — APP THU MUA (mã app "tm")
// Ánh xạ đúng Phần 3 của đặc tả:
//   ../../2. THIET KE/01-DAC-TA-APP-THU-MUA-v0.2.md
//
// Quy ước Firestore (khi nối thật):
//   projects/{projectId}/tm_denghi/{prId}
//   projects/{projectId}/tm_donhang/{poId}
//   projects/{projectId}/tm_donhang/{poId}/nhanhang/{grnId}
//   projects/{projectId}/tm_donhang_gia/{poId}      ← GIÁ TÁCH RIÊNG
//   tm_ncc/{supplierId}
// ============================================================

/** Ngày tháng lưu dạng ISO string trong bản chạy thử; Firestore dùng Timestamp. */
export type NgayISO = string;

/** Mô tả tệp đính kèm — nội dung tệp nằm ở `3-du-lieu/kho-tep.ts`, đây chỉ là phần tra cứu. */
export type { MoTaTep } from "@/3-du-lieu/kho-tep";
import type { MoTaTep } from "@/3-du-lieu/kho-tep";

// ------------------------------------------------------------
// DỰ ÁN — đọc từ App Tổng, app thu mua KHÔNG tự sinh mã
// ------------------------------------------------------------

export interface DuAn {
  id: string;
  /** Mã dự án gốc theo Thông báo 09/2026/TB-HPCS, vd 260001-HPCS.
   *  Được cung cấp kèm Đề nghị vì Đề nghị là đề xuất thật từ công trình. */
  maDuAn: string;
  tenCongTrinh: string;
  /** Mã hợp đồng CĐT — thuộc tính của dự án, không phải khóa liên kết. */
  maHopDongCDT?: string;
  chuDauTu?: string;
}

// ------------------------------------------------------------
// ĐỀ NGHỊ MUA HÀNG (PR)
// ------------------------------------------------------------

export type TrangThaiDeNghi =
  | "da_duyet"
  | "dang_phan_bo"
  | "da_phan_bo_du"
  | "dang_thuc_hien"
  | "hoan_thanh"
  | "dong_do";

export type TrangThaiDongDeNghi =
  | "chua_phan_bo"
  | "da_phan_bo"
  | "da_len_po"
  | "dang_giao"
  | "da_nhan_du";

import type { MaPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";

/**
 * Phòng ban gửi đề nghị.
 *
 * 🔴 Từ 12/08/2026 nhận đề xuất từ MỌI phòng ban của công ty (chỉ đạo Ban lãnh đạo).
 * Danh mục 16 phòng ban thật nằm ở `3-du-lieu/danh-muc-phong-ban.ts` — file đó là chỗ
 * duy nhất sửa khi công ty đổi cơ cấu, và là chỗ sẽ nối vào App Tổng sau này.
 *
 * ⚠️ Là chuỗi tự do, KHÔNG phải union đóng — xem lý do ở `MaPhongBan`. Muốn hiện tên
 * phòng ban thì gọi `nhanPhongBan()`, đừng tra Record trực tiếp.
 */
export type PhongBanNguon = MaPhongBan;

export interface DongDeNghi {
  /** ★ KHÓA ĐỐI CHIẾU KHỐI LƯỢNG — dòng PO và dòng nhận hàng đều trỏ về đây.
   *  Dùng thay cho mã vật tư (mã vật tư làm ở ver sau). */
  stt: number;
  tenVatLieu: string;
  quyCach?: string;
  donViTinh: string;
  khoiLuongDeNghi: number;
  /** Cột "Mục đích sử dụng" trên phiếu đề nghị của công ty — dùng cho hạng mục nào.
   *  Chuyển tiếp sang `DongPO.mucDichSuDung` khi lập đơn để in ra đơn mua hàng. */
  mucDichSuDung?: string;
  ghiChu?: string;
  /** Cờ cảnh báo QLDA. Ver 1 gán tay; ver sau lấy từ danh mục vật tư. */
  vatTuKiemSoatDinhMuc?: boolean;

  // --- PHÂN BỔ (Trưởng bộ phận thu mua) ---
  /** Trống = CHƯA PHÂN BỔ. */
  nguoiPhuTrachUid?: string;
  nguoiPhuTrachTen?: string;
  nguoiPhanBoTen?: string;
  thoiDiemPhanBo?: NgayISO;
  /**
   * Số báo giá trưởng bộ phận YÊU CẦU nhân viên phải lấy về cho dòng này
   * (Ban lãnh đạo 12/08/2026). Trống = không nêu yêu cầu riêng, cứ theo ngưỡng giá trị
   * trong `2-quy-trinh/nguong-gia-tri.ts`.
   *
   * ⚠️ Đây là YÊU CẦU GIAO VIỆC, khác với số báo giá quy trình bắt buộc theo giá trị đơn.
   * Trưởng bộ phận có thể đòi nhiều hơn mức tối thiểu; app không lấy con số này thay cho
   * việc soát ngưỡng.
   */
  soBaoGiaYeuCau?: number;
  /** Lời dặn kèm theo khi giao việc — hiện cho người được phân bổ đọc. */
  ghiChuPhanBo?: string;
}

export interface DeNghiMuaHang {
  id: string;
  /** vd 260001-HPCS-PR-001 (mã loại PR đang chờ phê duyệt danh mục). */
  code: string;
  maDuAn: string;
  maHopDongCDT?: string;
  tenCongTrinh: string;
  tieuDe: string;
  phongBanNguon: PhongBanNguon;
  nguoiDeNghiUid: string;
  nguoiDeNghiTen: string;
  ngayDeNghi: NgayISO;
  ngayDuyet: NgayISO;
  ngayCanHang: NgayISO;
  mucDoUuTien: "binh_thuong" | "gap";
  trangThai: TrangThaiDeNghi;
  items: DongDeNghi[];
  /** Nhật ký thao tác — MỌI hành động sửa nội dung đều ghi thêm một dòng vào đây
   *  (ai làm · làm gì · lúc nào). Hiển thị ở khối "Lịch sử" trang chi tiết đề nghị. */
  lichSu: MocLichSu[];
  /** Người được thêm vào để nắm tiến trình. Trống = chưa có ai theo dõi. */
  nguoiTheoDoi?: NguoiTheoDoi[];
  /* 📌 12/08/2026 (chiều): ĐÃ GỠ các trường duyệt hai cấp (`duyetCap1/2`,
     `nguoiDuyetCap1/2`, `duyetBoPhan`). Ban lãnh đạo chốt: việc duyệt đề nghị nằm ở APP
     KHÁC của bộ phận đề xuất — phiếu vào app Thu mua là ĐÃ duyệt (`ngayDuyet` luôn có).
     Dữ liệu cũ trên kho chung còn mang mấy khóa đó thì cứ nằm im, app không đọc nữa. */

  /**
   * ★ ĐÃ LƯU TRỮ — ẩn khỏi bảng quy trình nhưng KHÔNG xóa dữ liệu.
   *
   * Chỉ đạo Ban lãnh đạo 10/08/2026 (menu ⋯ theo Base.vn). Khác "Đóng dở" (`dong_do`):
   * đóng dở là **kết luận nghiệp vụ** — không mua nữa, có ghi lý do, vẫn nằm ở cột "Thất
   * bại" để thống kê. Lưu trữ chỉ là **dọn bảng cho đỡ rối**, hồ sơ vẫn nguyên trạng thái
   * và bỏ lưu trữ là quay lại đúng cột cũ.
   */
  luuTru?: boolean;
  /**
   * ★ TRƯỜNG BỔ SUNG — cặp nhãn/giá trị do người dùng tự đặt, tương ứng "dữ liệu tùy chỉnh"
   * của Base.vn.
   *
   * ⚠️ CHỈ DÙNG CHO THÔNG TIN PHỤ. Đừng đưa số liệu nghiệp vụ (khối lượng, đơn giá, ngày
   * giao) vào đây — những thứ đó phải có trường riêng để tính toán và đối chiếu được. Trường
   * bổ sung không ai tính toán trên nó, chỉ để đọc.
   */
  truongBoSung?: TruongBoSung[];
  /**
   * ★ TÀI LIỆU ĐÍNH KÈM lúc lập phiếu — catalogue, bản vẽ, chứng chỉ; tối đa 10 theo
   * biểu mẫu Base (Ban lãnh đạo 12/08/2026). Đây chỉ là phần MÔ TẢ; nội dung tệp nằm
   * ở kho tệp (`3-du-lieu/kho-tep.ts` → Firestore) nên máy khác mở xem được.
   */
  taiLieu?: MoTaTep[];
}

/** Một cặp nhãn/giá trị người dùng tự thêm vào đề nghị. */
export interface TruongBoSung {
  nhan: string;
  giaTri: string;
}

/**
 * Người theo dõi một đề nghị — người muốn nắm tiến trình nhưng KHÔNG làm gì trên đó.
 * Tương đương "người theo dõi" của một nhiệm vụ trên Base.vn.
 *
 * ⚠️ ĐỪNG NHẦM với màn "Theo dõi đề nghị" (`/theo-doi`) — màn đó là chỗ Phòng Thi công
 * xem tiến trình đề nghị DO CHÍNH HỌ gửi. Còn đây là danh sách người được thêm vào.
 *
 * 🔴 Có tên trong danh sách này KHÔNG mở khóa việc xem giá. Đơn giá nằm ở chứng từ riêng
 * `tm_donhang_gia`, chặn bằng Security Rule của chứng từ đó — đúng nguyên tắc dữ liệu số 3.
 */
export interface NguoiTheoDoi {
  uid: string;
  ten: string;
  chucDanh: string;
  /** Ai đã thêm người này vào — để truy được trách nhiệm. */
  nguoiThemTen: string;
  thoiDiemThem: NgayISO;
}

export interface MocLichSu {
  thoiDiem: NgayISO;
  nguoiThucHien: string;
  hanhDong: string;
  ghiChu?: string;
}

// ------------------------------------------------------------
// NHÀ CUNG CẤP
// ------------------------------------------------------------

export interface NhaCungCap {
  id: string;
  ten: string;
  dienThoai?: string;
  diaChi?: string;
  /** Ô "Mã số thuế" trên mẫu đơn mua hàng của công ty. */
  maSoThue?: string;
}

// ------------------------------------------------------------
// ĐƠN ĐẶT HÀNG (PO) — KHÔNG CHỨA GIÁ
// ------------------------------------------------------------

export type TrangThaiPO =
  | "nhap"
  | "da_chot"
  | "dang_giao"
  | "cho_xac_nhan_hoan_thanh"
  | "hoan_thanh"
  | "huy";

/**
 * Một dòng trên đơn mua hàng.
 *
 * 📄 Các trường dưới đây ánh xạ 1-1 với cột của biểu mẫu công ty
 *    `1. INPUT/Bieu mau/1. DON HANG HPCONS.xlsx` (dòng tiêu đề bảng, ô A11:J11):
 *    STT · Mã hàng · Tên hàng · Thông số kỹ thuật · ĐVT · SL · Đơn giá · Thành tiền · Mục đích sử dụng
 *
 * 🔴 Đơn giá và Thành tiền KHÔNG nằm ở đây — chúng ở `GiaDonDatHang` (chứng từ riêng),
 *    vì Firestore chặn quyền theo document chứ không theo trường (nguyên tắc dữ liệu số 3).
 */
export interface DongPO {
  sttDong: number;
  /** ★ Trỏ về DongDeNghi.stt — khóa truy vết khối lượng. */
  sttDongDeNghi: number;
  /**
   * Mã hàng trong danh mục vật tư, vd `VT00027` (thấy trên ĐMH0875-25 của công ty).
   * ⚠️ Ver 1 để TRỐNG được: quyết định 1 của dự án là "đặt mã vật tư làm sau",
   * đối chiếu khối lượng vẫn dựa vào `sttDongDeNghi`. Có mã thì in ra đơn cho khớp mẫu.
   */
  maHang?: string;
  tenVatLieu: string;
  /** Cột "Thông số kỹ thuật" — quy cách, mác, tiêu chuẩn. */
  thongSoKyThuat?: string;
  donViTinh: string;
  khoiLuongDat: number;
  /** Cột "Mục đích sử dụng" — dùng cho hạng mục nào của công trình. */
  mucDichSuDung?: string;
}

export interface XacNhan {
  uid: string;
  ten: string;
  thoiDiem: NgayISO;
}

export interface DonDatHang {
  id: string;
  /** vd 260001-HPCS-PO-001 */
  code: string;
  maDuAn: string;
  maHopDongCDT?: string;
  prId: string;
  prCode: string;
  supplierId: string;
  supplierTen: string;
  nguoiPhuTrachUid: string;
  nguoiPhuTrachTen: string;
  ngayLapPO: NgayISO;
  /** 1 ngày cho cả PO — KHÔNG nhập kế hoạch từng đợt (chỉ đạo Ban lãnh đạo). */
  ngayGiaoDuKien: NgayISO;
  dieuKienGiaoHang?: string;
  /** Ô "Địa điểm giao hàng" trên mẫu đơn — thường là chân công trình. */
  diaDiemGiaoHang?: string;
  /** Ô "Người Nhận" trên mẫu đơn — người BÊN MUA đứng ra nhận hàng. */
  nguoiNhanHangTen?: string;
  /** Ô "Điều khoản khác" trên mẫu đơn (bảo hành, bốc xếp, chứng chỉ chất lượng...). */
  dieuKhoanKhac?: string;
  ghiChu?: string;
  trangThai: TrangThaiPO;
  items: DongPO[];
  /** Điều kiện ② hoàn thành PO. */
  xacNhanKho?: XacNhan;
  /** Điều kiện ③ hoàn thành PO. */
  xacNhanTruongBP?: XacNhan;
  lyDoHuyHoacDongDo?: string;
}

// ------------------------------------------------------------
// GIÁ — TÁCH RIÊNG khỏi PO
// Lý do: Firestore Security Rules chặn ở mức DOCUMENT, không chặn theo TRƯỜNG.
// Để giá trong PO thì cho thủ kho đọc PO là thủ kho đọc luôn cả giá.
// ------------------------------------------------------------

export interface DongGiaPO {
  sttDong: number;
  donGia: number;
}

/**
 * Phần TIỀN của một đơn mua hàng — tách hẳn khỏi `DonDatHang`.
 *
 * 🔴 MỌI thứ dính tới tiền đều để ở đây, kể cả chiết khấu, thuế suất và điều khoản
 * thanh toán. Lý do: Security Rule chỉ chặn được cả document. Nếu để thuế suất hay
 * điều khoản thanh toán trong PO thì cho thủ kho đọc PO là hở luôn phần thương mại.
 *
 * 📄 Ánh xạ khối tổng của biểu mẫu `1. DON HANG HPCONS.xlsx`:
 *    Cộng tiền hàng (chưa trừ CK) → Số tiền CK → Cộng tiền hàng (đã trừ CK)
 *    → Thuế suất GTGT + Tiền thuế GTGT → Tổng tiền thanh toán → Số tiền bằng chữ.
 *    Các con số này KHÔNG lưu, mà tính lại ở `2-quy-trinh/tinh-toan.ts` → `tinhTienDonHang`,
 *    để không bao giờ có hai chỗ giữ hai kết quả khác nhau.
 */
export interface GiaDonDatHang {
  /** = DonDatHang.id */
  poId: string;
  poCode: string;
  maDuAn: string;
  lines: DongGiaPO[];
  /** Ô "Loại tiền". Trống = VND. */
  loaiTien?: string;
  /** Ô "Số tiền CK" — chiết khấu tính bằng SỐ TIỀN, không phải phần trăm (đúng mẫu công ty). */
  chietKhau?: number;
  /** Ô "Thuế suất thuế GTGT", đơn vị phần trăm. vd 8 hoặc 10. Trống = không chịu thuế. */
  thueSuatGTGT?: number;
  /** Ô "Điều khoản thanh toán" — vd "Thanh toán 100% trong 30 ngày sau khi nhận đủ hàng". */
  dieuKhoanThanhToan?: string;
}

// ------------------------------------------------------------
// PHIẾU NHẬN HÀNG — thủ kho công trình lập, MỖI LẦN GIAO MỘT PHIẾU
// Đây là thứ bản thumua-next KHÔNG có (chỉ cộng dồn receivedQuantity).
// ------------------------------------------------------------

export type TrangThaiPhieuNhan = "cho_kiem_tra" | "da_nhap_kho" | "tu_choi_nhan";

export interface DongNhanHang {
  /** Trỏ về DongPO.sttDong. */
  sttDongPO: number;
  /** Khối lượng của CHÍNH LẦN NÀY, không phải cộng dồn. */
  khoiLuongThucNhan: number;
  khoiLuongTuChoi?: number;
  lyDoTuChoi?: string;
}

export interface PhieuNhanHang {
  id: string;
  /** vd 260001-HPCS-PO-001-DO01 */
  code: string;
  poId: string;
  poCode: string;
  lanGiaoThu: number;
  ngayNhanThucTe: NgayISO;
  nguoiNhanUid: string;
  nguoiNhanTen: string;
  soPhieuGiaoNCC?: string;
  /**
   * ★ BẢN CHỤP / BẢN QUÉT PHIẾU GIAO NHẬN của nhà cung cấp cho LẦN GIAO NÀY.
   *
   * 🔴 Chỉ đạo Ban lãnh đạo 11/08/2026: *"thủ kho khi nhận hàng phải đính kèm file phiếu
   * giao nhận thì mới được bấm hoàn thành"*. Đây là chứng từ gốc chứng minh hàng đã về
   * thật — không có nó thì con số khối lượng trong app không đối chiếu được với giấy tờ.
   *
   * Để `?` vì phiếu ghi TRƯỚC ngày 11/08/2026 chưa có trường này. Phiếu cũ vẫn đọc được,
   * chỉ là phải bổ sung tệp thì đơn mới hoàn thành được — xem `vuongMacXacNhanKho`.
   *
   * ⚠️ Chỉ là phần MÔ TẢ. Nội dung tệp nằm ở kho riêng (`3-du-lieu/kho-tep.ts`), tra theo
   * `id`. Đừng nhét nội dung tệp vào đây — dữ liệu nghiệp vụ lưu ở localStorage, nhét vào
   * là tràn và mất sạch.
   */
  tepPhieuGiao?: MoTaTep;
  /** ★ CHỈ trạng thái da_nhap_kho mới được tính vào khối lượng đã nhận. */
  trangThai: TrangThaiPhieuNhan;
  ghiChuTinhTrangHang?: string;
  lines: DongNhanHang[];
}

// ------------------------------------------------------------
// THÔNG BÁO CHUYỂN BƯỚC + TIẾP NHẬN CÔNG TÁC
// Sinh tự động khi một đề nghị ĐỔI BƯỚC trên bảng quy trình (bất kể chuyển
// bằng kéo thả hay bằng nghiệp vụ).
// để xác nhận đã tiếp quản — ghi cả vào lịch sử đề nghị.
// Bản chạy thử giữ trong bộ nhớ; bản thật sẽ là collection tm_thongbao.
// ------------------------------------------------------------

export interface ThongBaoChuyenBuoc {
  id: string;
  prId: string;
  prCode: string;
  tieuDe: string;
  /** Mã giai đoạn (GiaiDoanMuaHang) — nhãn tra ở `2-quy-trinh/giai-doan-mua-hang`.
   *  Trống = đề nghị MỚI vào bảng, không phải chuyển bước. */
  tuBuoc?: string;
  denBuoc: string;
  /** ISO đầy đủ giờ phút — thông báo cần biết "lúc mấy giờ". */
  thoiDiem: string;
  /** Người nên nhận thông báo (người theo dõi đề nghị). Bản chạy thử hiển thị chung. */
  guiToi: string[];
  daDoc: boolean;
  /** Ai đã bấm "Nhận công tác" cho bước mới — trống là còn chờ tiếp nhận. */
  tiepNhan?: XacNhan;
  /**
   * `true` = thông báo do TRƯỞNG BỘ PHẬN BẤM "CHUYỂN TIẾP", không phải hệ thống tự
   * sinh khi đề nghị đổi bước (chỉ đạo Ban lãnh đạo 08/08/2026).
   *
   * Vì sao cần phân biệt: trưởng bộ phận phân bổ xong thì việc còn lại là của nhân
   * viên. Lúc đó đề nghị CHƯA đổi bước (vẫn đang ở "Lập đơn mua hàng") nên không có
   * thông báo tự động nào — nhân viên không biết đã tới lượt mình. Nút "Chuyển tiếp"
   * lấp đúng khoảng trống đó; `tuBuoc` và `denBuoc` khi ấy bằng nhau.
   */
  laChuyenTiep?: boolean;
  /** Lời nhắn kèm khi chuyển tiếp — trưởng bộ phận dặn thêm gì thì ghi ở đây. */
  loiNhan?: string;
}

// ------------------------------------------------------------
// KIỂU TỔNG HỢP DÙNG CHO GIAO DIỆN (tính runtime, không lưu)
// ------------------------------------------------------------

export interface TienDoDongPO extends DongPO {
  khoiLuongDaNhan: number;
  khoiLuongConLai: number;
  phanTram: number;
  /** Khối lượng nhận theo từng lần, để dựng cột động trong bảng tiến độ. */
  theoLanGiao: { lanGiaoThu: number; ngayNhan: NgayISO; khoiLuong: number }[];
}

export interface TienDoDongDeNghi extends DongDeNghi {
  khoiLuongDaLenPO: number;
  khoiLuongChuaLenPO: number;
  khoiLuongDaNhan: number;
  khoiLuongConLai: number;
  phanTram: number;
  trangThaiDong: TrangThaiDongDeNghi;
  /** Các PO có dòng trỏ về dòng đề nghị này. */
  maPOLienQuan: string[];
  /** Ngày giao dự kiến sớm nhất trong các PO liên quan. */
  ngayGiaoDuKien?: NgayISO;
}

// ------------------------------------------------------------
// BÁO GIÁ (RFQ) — so sánh giá từ nhiều NCC cho một Đề nghị
// Firestore: projects/{projectId}/tm_baogia/{rfqId}
// ------------------------------------------------------------

export type TrangThaiBaoGia = "dang_thu_thap" | "da_so_sanh" | "da_chon_ncc" | "huy";

export interface DongBaoGiaNCC {
  nccId: string;
  tenNCC: string;
  donGia: number;
  thoiGianGiao: number;
  ghiChu?: string;
}

/**
 * BẢN BÁO GIÁ NHÀ CUNG CẤP GỬI VỀ — nhân viên thu mua tải lên làm bằng chứng.
 *
 * 🔴 Chỉ đạo Ban lãnh đạo 10/08/2026: bước ② *"nv tm sẽ up báo giá của các nhà cung cấp lên
 * để trưởng bộ phận xem xét"*. Trưởng bộ phận duyệt giá thì phải xem được bản gốc nhà cung
 * cấp gửi, không chỉ tin con số nhân viên gõ vào.
 *
 * ✅ TỪ 11/08/2026 ĐÃ LƯU NỘI DUNG THẬT và mở xem lại được — qua kho tệp
 * `3-du-lieu/kho-tep.ts`. Trước đó chỉ giữ tên tệp rồi vứt nội dung đi, trong khi nhật ký
 * vẫn ghi *"Tải lên bản báo giá X"* — người dùng có mọi lý do tin là đã lưu vào hệ thống,
 * và hồ sơ thiếu chứng từ mà không ai biết. Đó là lỗi, đã sửa.
 *
 * ⚠️ Tệp nằm trong trình duyệt của MÁY ĐÃ TẢI LÊN, chưa lên máy chủ. Máy khác thấy tên tệp
 * nhưng bấm xem thì báo không còn nội dung. Khi nối Firebase Storage thì chỉ thay ruột
 * `kho-tep.ts`, kiểu dữ liệu này không phải sửa.
 *
 * ⚠️ Bản ghi tạo TRƯỚC 11/08/2026 thiếu `id` nên không mở xem được — đúng như thực tế, vì
 * nội dung tệp lúc đó chưa từng được lưu.
 */
export interface TepBaoGiaNCC extends MoTaTep {
  nccId: string;
  tenNCC: string;
}

export interface DongBaoGia {
  id: string;
  /**
   * ★ Số thứ tự dòng của ĐỀ NGHỊ mà dòng báo giá này ứng với.
   *
   * 🔴 KHÓA TRUY VẾT, không phải trường trang trí. Khi lập đơn từ phân bổ, phải biết phần
   * khối lượng này thuộc dòng đề nghị nào. Trước đây không có nên phải khớp theo
   * `tenVatLieu`, và hai dòng đề nghị cùng tên khác quy cách ("Thép hộp" 40×40 và 50×50)
   * bị dồn về một dòng — dòng kia mất khối lượng. Tên vật liệu do người dùng gõ tự do nên
   * trùng tên là chuyện thường.
   *
   * ⚠️ Không bắt buộc để đọc được dữ liệu cũ chưa có trường này; chỗ dùng phải có đường lùi
   * về khớp theo tên.
   */
  sttDongDeNghi?: number;
  tenVatLieu: string;
  donViTinh: string;
  khoiLuong: number;
  baoGiaNCC: DongBaoGiaNCC[];
  /**
   * ★ TÁCH BÁO GIÁ — chia khối lượng của DÒNG NÀY cho nhiều nhà cung cấp.
   *
   * Chỉ đạo Ban lãnh đạo 10/08/2026: *"một mặt hàng có thể phải chia nhỏ PO do 1 nhà
   * cung cấp thì không cung cấp hết được số lượng hàng cần đặt"*. Ví dụ cần 2.400 kg
   * thép: NCC B giao được 1.500, NCC G giao 900 → hai đơn đặt hàng riêng.
   *
   * Trống = chưa tách, cả dòng về một nhà cung cấp (`BaoGia.nccDaChonId`).
   *
   * ⚠️ Tổng `khoiLuong` phân bổ KHÔNG được vượt `khoiLuong` của dòng — kiểm bằng
   * `kiemPhanBoDong` trong `2-quy-trinh/so-sanh-bao-gia.ts`, đừng tự tính lại nơi khác.
   */
  phanBo?: PhanBoNCC[];
}

/** Một phần khối lượng của dòng báo giá giao cho một nhà cung cấp. */
export interface PhanBoNCC {
  nccId: string;
  tenNCC: string;
  khoiLuong: number;
}

export interface BaoGia {
  id: string;
  code: string;
  prId: string;
  prCode: string;
  tieuDe: string;
  trangThai: TrangThaiBaoGia;
  items: DongBaoGia[];
  nccDaChonId?: string;
  nccDaChonTen?: string;
  /** Bản báo giá gốc nhà cung cấp gửi về, nhân viên thu mua tải lên — xem `TepBaoGiaNCC`. */
  tepBaoGia?: TepBaoGiaNCC[];
  hanNop: NgayISO;
  ngayTao: NgayISO;
  ngayCapNhat: NgayISO;
}

// ------------------------------------------------------------
// CÔNG NỢ NHÀ CUNG CẤP — theo dõi thanh toán từng hóa đơn
// Dữ liệu lấy trực tiếp từ PO (user yêu cầu 05/08/2026)
// Firestore: projects/{projectId}/tm_congno/{id}
// ------------------------------------------------------------

export type TrangThaiCongNo = "chua_den_han" | "sap_den_han" | "qua_han" | "da_thanh_toan";

export interface CongNo {
  id: string;
  poId: string;
  poCode: string;
  nccId: string;
  tenNCC: string;
  soHoaDon: string;
  soTien: number;
  daTra: number;
  hanThanhToan: NgayISO;
  trangThai: TrangThaiCongNo;
  congTrinh?: string;
  ghiChu?: string;
}
