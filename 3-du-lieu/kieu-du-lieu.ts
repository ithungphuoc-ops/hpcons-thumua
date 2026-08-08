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

/**
 * Phòng ban nguồn gửi đề nghị.
 * Ver 1 CHỈ có Phòng Thi công (chỉ đạo Ban lãnh đạo 05/08/2026);
 * các nguồn khác để sẵn cho ver sau, chưa dùng.
 */
export type PhongBanNguon = "thi_cong";

export interface DongDeNghi {
  /** ★ KHÓA ĐỐI CHIẾU KHỐI LƯỢNG — dòng PO và dòng nhận hàng đều trỏ về đây.
   *  Dùng thay cho mã vật tư (mã vật tư làm ở ver sau). */
  stt: number;
  tenVatLieu: string;
  quyCach?: string;
  donViTinh: string;
  khoiLuongDeNghi: number;
  ghiChu?: string;
  /** Cờ cảnh báo QLDA. Ver 1 gán tay; ver sau lấy từ danh mục vật tư. */
  vatTuKiemSoatDinhMuc?: boolean;

  // --- PHÂN BỔ (Trưởng bộ phận thu mua) ---
  /** Trống = CHƯA PHÂN BỔ. */
  nguoiPhuTrachUid?: string;
  nguoiPhuTrachTen?: string;
  nguoiPhanBoTen?: string;
  thoiDiemPhanBo?: NgayISO;
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
  /** Người theo dõi tiến trình đề nghị (tên hiển thị). Ver chạy thử: chỉ hiển thị đếm trên thẻ. */
  nguoiTheoDoi?: string[];
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

export interface DongPO {
  sttDong: number;
  /** ★ Trỏ về DongDeNghi.stt — khóa truy vết khối lượng. */
  sttDongDeNghi: number;
  tenVatLieu: string;
  donViTinh: string;
  khoiLuongDat: number;
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

export interface GiaDonDatHang {
  /** = DonDatHang.id */
  poId: string;
  poCode: string;
  maDuAn: string;
  lines: DongGiaPO[];
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
  /** ★ CHỈ trạng thái da_nhap_kho mới được tính vào khối lượng đã nhận. */
  trangThai: TrangThaiPhieuNhan;
  ghiChuTinhTrangHang?: string;
  lines: DongNhanHang[];
}

// ------------------------------------------------------------
// THÔNG BÁO CHUYỂN BƯỚC + TIẾP NHẬN CÔNG TÁC
// Sinh tự động khi một đề nghị ĐỔI BƯỚC trên bảng quy trình (bất kể chuyển
// bằng kéo thả hay bằng nghiệp vụ). Người phụ trách bước mới bấm "Nhận công tác"
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

export interface DongBaoGia {
  id: string;
  tenVatLieu: string;
  donViTinh: string;
  khoiLuong: number;
  baoGiaNCC: DongBaoGiaNCC[];
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
