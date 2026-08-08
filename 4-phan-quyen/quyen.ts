// ============================================================
// PHÂN QUYỀN — APP THU MUA (mã app "tm")
//
// ⚠️ Cấp quyền theo ĐÚNG chuẩn App Tổng HPCons:
//   ../12. APP TONG HPC/2. OUTPUT/firestore-design/CAU-TRUC-FIRESTORE.md §2.2
//   1 = Xem · 2 = Nhập liệu · 3 = Quản lý · 4 = Quản trị   (1 thấp nhất, 4 cao nhất)
//
// Bản thumua-next cũ ghi nhãn NGƯỢC ("Level 1 = Trưởng phòng toàn quyền") —
// KHÔNG dùng lại nhãn đó. Ở đây giữ pattern Capabilities của bản cũ (tốt), viết lại nội dung.
//
// 🔴 Lưu ý: cấp quyền KHÔNG đủ để chặn giá. Đơn giá nằm ở collection riêng
// tm_donhang_gia → phải chặn bằng Security Rule của collection đó. Xem quyen.xemGia.
// ============================================================

/** Vai trò toàn hệ thống (App Tổng §2.3). */
export type VaiTroHeThong = "admin" | "director" | "staff";

/** Cấp quyền trong một app con. 0 = không được truy cập. */
export type CapQuyen = 0 | 1 | 2 | 3 | 4;

export const NHAN_CAP_QUYEN: Record<CapQuyen, string> = {
  0: "Không truy cập",
  1: "Cấp 1 — Xem",
  2: "Cấp 2 — Nhập liệu",
  3: "Cấp 3 — Quản lý",
  4: "Cấp 4 — Quản trị",
};

/** Chức năng trong phòng thu mua / công trình — quyết định thấy giá hay không. */
export type ChucNang =
  | "truong_bo_phan_thu_mua"
  | "nhan_vien_thu_mua"
  | "thu_kho_cong_trinh"
  | "qlda"
  | "phong_thi_cong"
  | "ke_toan";

export interface NguoiDung {
  uid: string;
  tenHienThi: string;
  chucDanh: string;
  phongBan: string;
  chucNang: ChucNang;
  vaiTro: VaiTroHeThong;
  /** users/{uid}.apps.tm */
  capTM: CapQuyen;
  /** users/{uid}.apps.kh — dùng cho thủ kho lập phiếu nhận hàng */
  capKho?: CapQuyen;
}

/**
 * Những việc người dùng được phép làm. Tính MỘT LẦN từ (vaiTro, cấp quyền, chức năng)
 * rồi truyền xuống giao diện — component chỉ hỏi "được làm gì", không tự suy cấp bậc.
 */
export interface Quyen {
  xemDuocApp: boolean;
  xemMoiHoSo: boolean;
  /** 🔒 Đọc được tm_donhang_gia — đơn giá, thành tiền, tổng giá trị. */
  xemGia: boolean;
  /** Thấy tên nhà cung cấp. BCH/Phòng thi công KHÔNG thấy. */
  xemNhaCungCap: boolean;
  /** Thấy nhân viên thu mua nào phụ trách. Có thể bật/tắt cho BCH. */
  xemNguoiPhuTrach: boolean;
  /** Trưởng bộ phận phân bổ dòng đề nghị cho nhân viên. */
  phanBoCongViec: boolean;
  lapPO: boolean;
  suaPODaChot: boolean;
  /** Thủ kho lập phiếu nhận hàng từng lần. */
  ghiPhieuNhanHang: boolean;
  /** Điều kiện ② hoàn thành PO. */
  xacNhanKho: boolean;
  /** Điều kiện ③ hoàn thành PO. */
  xacNhanTruongBP: boolean;
  xuatHoSo: boolean;
  xemBaoGia: boolean;
  xemCongNo: boolean;
}

export function tinhQuyen(u: NguoiDung): Quyen {
  const laQuanTri = u.vaiTro === "admin";
  const laBGD = u.vaiTro === "director";
  const capTM = u.capTM;

  const laTruongBP = u.chucNang === "truong_bo_phan_thu_mua";
  const laNhanVienTM = u.chucNang === "nhan_vien_thu_mua";
  const laThuKho = u.chucNang === "thu_kho_cong_trinh";
  const laQLDA = u.chucNang === "qlda";
  const laKeToan = u.chucNang === "ke_toan";

  return {
    xemDuocApp: capTM >= 1,
    xemMoiHoSo: laQuanTri || laBGD || capTM >= 3 || laQLDA,

    // 🔒 Giá: chỉ thu mua, QLDA, kế toán, BGĐ. Thủ kho và Phòng thi công KHÔNG.
    xemGia: laQuanTri || laBGD || laTruongBP || laNhanVienTM || laQLDA || laKeToan,
    xemNhaCungCap: laQuanTri || laBGD || laTruongBP || laNhanVienTM || laQLDA || laThuKho || laKeToan,
    xemNguoiPhuTrach: laQuanTri || laBGD || laTruongBP || laNhanVienTM || laQLDA || laKeToan,

    phanBoCongViec: laQuanTri || (laTruongBP && capTM >= 3),
    lapPO: laQuanTri || ((laTruongBP || laNhanVienTM) && capTM >= 2),
    suaPODaChot: laQuanTri || (laTruongBP && capTM >= 3),

    ghiPhieuNhanHang: laQuanTri || (laThuKho && (u.capKho ?? 0) >= 2),
    xacNhanKho: laQuanTri || (laThuKho && (u.capKho ?? 0) >= 2),
    xacNhanTruongBP: laQuanTri || (laTruongBP && capTM >= 3),

    xuatHoSo: capTM >= 1,
    xemBaoGia: laQuanTri || laBGD || laTruongBP || laNhanVienTM || laQLDA || laKeToan,
    xemCongNo: laQuanTri || laBGD || laTruongBP || laNhanVienTM || laKeToan,
  };
}

/** Kiểm tra quyền vào một đường dẫn. */
export function duocVaoDuongDan(duongDan: string, q: Quyen): boolean {
  if (duongDan.startsWith("/phan-bo")) return q.phanBoCongViec;
  if (duongDan.startsWith("/don-hang/tao-moi")) return q.lapPO;
  return q.xemDuocApp;
}

// ------------------------------------------------------------
// VAI TRÒ MẪU ĐỂ CHẠY THỬ (khi chưa nối Firebase Auth)
// ------------------------------------------------------------

export interface VaiTroMau extends NguoiDung {
  moTa: string;
  /** Tên đăng nhập ở màn hình đăng nhập chạy thử. */
  tenDangNhap: string;
}

/**
 * 🔴 TÀI KHOẢN CHẠY THỬ — KHÔNG PHẢI TÀI KHOẢN THẬT.
 *
 * Dùng cho màn đăng nhập giả lập khi chưa nối Firebase Auth. Mật khẩu chung khai ở
 * `MAT_KHAU_CHAY_THU`. Khi nối thật: xóa cả mảng này, đọc `users/{uid}` và custom
 * claims từ project `hpcons-portal` — phần giao diện KHÔNG phải sửa.
 *
 * Danh sách phủ đủ 4 cấp quyền của App Tổng (1 Xem → 4 Quản trị) để kiểm chứng
 * phân quyền, đặc biệt là luật "Kho và Phòng Thi công KHÔNG thấy giá".
 */
export const VAI_TRO_MAU: VaiTroMau[] = [
  {
    uid: "u-admin",
    tenDangNhap: "quantri",
    tenHienThi: "Cao Văn X",
    chucDanh: "Quản trị hệ thống",
    phongBan: "Phòng Hành chính Nhân sự — IT",
    chucNang: "truong_bo_phan_thu_mua",
    vaiTro: "admin",
    capTM: 4,
    capKho: 4,
    moTa: "Cấp 4 — Quản trị: làm được mọi việc trong app",
  },
  {
    uid: "u-bgd",
    tenDangNhap: "bgd",
    tenHienThi: "Vũ Văn K",
    chucDanh: "Phó Tổng Giám đốc",
    phongBan: "Ban Giám đốc",
    chucNang: "truong_bo_phan_thu_mua",
    vaiTro: "director",
    capTM: 1,
    moTa: "Ban Giám đốc — xem toàn bộ có giá, không nhập liệu",
  },
  {
    uid: "u-tbp",
    tenDangNhap: "truongbp",
    tenHienThi: "Trần Thị B",
    chucDanh: "Trưởng bộ phận Thu mua",
    phongBan: "Phòng Thu mua",
    chucNang: "truong_bo_phan_thu_mua",
    vaiTro: "staff",
    capTM: 3,
    capKho: 1,
    moTa: "Cấp 3 — Quản lý: phân bổ · chuyển tiếp · xác nhận hoàn thành PO · thấy giá",
  },
  {
    uid: "u-tm1",
    tenDangNhap: "tm1",
    tenHienThi: "Nguyễn Văn A",
    chucDanh: "Nhân viên Thu mua (TM1)",
    phongBan: "Phòng Thu mua",
    chucNang: "nhan_vien_thu_mua",
    vaiTro: "staff",
    capTM: 2,
    moTa: "Cấp 2 — Nhập liệu: lập PO cho phần được phân bổ · thấy giá",
  },
  {
    uid: "u-kt",
    tenDangNhap: "ketoan",
    tenHienThi: "Nguyễn Thị Q",
    chucDanh: "Kế toán trưởng",
    phongBan: "Phòng Kế toán",
    chucNang: "ke_toan",
    vaiTro: "staff",
    capTM: 1,
    moTa: "Theo dõi công nợ · thấy giá · không lập đơn",
  },
  {
    uid: "u-kho",
    tenDangNhap: "thukho",
    tenHienThi: "Hoàng Văn E",
    chucDanh: "Thủ kho công trình",
    phongBan: "Kho công trình",
    chucNang: "thu_kho_cong_trinh",
    vaiTro: "staff",
    capTM: 1,
    capKho: 2,
    moTa: "Cấp 1 — Xem: lập phiếu nhận hàng từng lần · 🔒 KHÔNG thấy giá",
  },
  {
    uid: "u-tc",
    tenDangNhap: "thicong",
    tenHienThi: "Phạm Văn F",
    chucDanh: "Phòng Thi công (người đề nghị)",
    phongBan: "Phòng Thi công",
    chucNang: "phong_thi_cong",
    vaiTro: "staff",
    capTM: 1,
    moTa: "Cấp 1 — Xem: theo dõi đề nghị của mình · 🔒 KHÔNG thấy giá, không thấy NCC",
  },
  {
    uid: "u-qlda",
    tenDangNhap: "qlda",
    tenHienThi: "Vũ Văn G",
    chucDanh: "Ban Quản lý Dự án",
    phongBan: "QLDA",
    chucNang: "qlda",
    vaiTro: "staff",
    capTM: 1,
    moTa: "Cấp 1 — Xem: xem toàn bộ có giá · nhận cảnh báo vật tư kiểm soát định mức",
  },
];

/** Trưởng bộ phận Thu mua — vai trò mở app mặc định khi chưa chọn gì. */
export const VAI_TRO_MAC_DINH = VAI_TRO_MAU.find((v) => v.uid === "u-tbp") ?? VAI_TRO_MAU[0];

/**
 * 🔴 MẬT KHẨU CHUNG CỦA BẢN CHẠY THỬ — KHÔNG PHẢI BẢO MẬT THẬT.
 *
 * Cả app chạy trong trình duyệt nên mật khẩu này nằm sẵn trong mã nguồn tải về máy
 * người dùng: ai mở DevTools cũng đọc được. Nó chỉ để CHẶN NGƯỜI VÀO NHẦM và để dựng
 * sẵn khung đăng nhập, KHÔNG chống được người cố tình.
 *
 * Bảo mật thật đến từ hai thứ, cả hai đều nằm ở phía máy chủ:
 *   1. Firebase Authentication — xác minh danh tính
 *   2. Firestore Security Rules — chặn đọc/ghi dữ liệu (xem 5-ket-noi/firestore.rules)
 */
export const MAT_KHAU_CHAY_THU = "hpcons2026";

/** Tìm tài khoản chạy thử theo tên đăng nhập (không phân biệt hoa thường). */
export function timTaiKhoan(tenDangNhap: string): VaiTroMau | undefined {
  const k = tenDangNhap.trim().toLowerCase();
  return VAI_TRO_MAU.find((v) => v.tenDangNhap.toLowerCase() === k);
}
