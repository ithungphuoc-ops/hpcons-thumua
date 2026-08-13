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

/**
 * CHỨC VỤ trong bộ phận — bậc quản lý, KHÁC với `chucNang` (làm việc gì) và `capTM` (được
 * đọc/ghi tới đâu).
 *
 * ⚠️ 12/08/2026 (chiều): HIỆN APP KHÔNG DÙNG TRƯỜNG NÀY ĐỂ QUYẾT ĐỊNH QUYỀN GÌ. Nó sinh ra
 * cho việc duyệt đề nghị hai cấp, mà việc đó đã chuyển sang app của bộ phận đề xuất.
 *
 * 📌 Vẫn giữ vì hồ sơ tài khoản trên Firestore (`nguoi-dung/{uid}.chucVu`) đã có sẵn dữ
 * liệu này cho cả 8 nhân sự — xóa khỏi mã nguồn thì lần sau cần lại phải đi tạo lại. Nếu
 * định dùng nó để phân quyền, nhớ rằng nó CHƯA được App Tổng xác nhận là trường chính thức.
 */
export type ChucVu = "nhan_vien" | "chi_huy_truong" | "truong_phong" | "tong_giam_doc";

export const NHAN_CHUC_VU: Record<ChucVu, string> = {
  nhan_vien: "Nhân viên",
  chi_huy_truong: "Chỉ huy trưởng",
  truong_phong: "Trưởng phòng / Quản lý",
  tong_giam_doc: "Tổng Giám đốc / Phó TGĐ",
};

export interface NguoiDung {
  uid: string;
  tenHienThi: string;
  chucDanh: string;
  phongBan: string;
  chucNang: ChucNang;
  /** Bậc quản lý. Trống = nhân viên. */
  chucVu?: ChucVu;
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
  /**
   * Lập đề nghị mua hàng mới.
   *
   * 🔴 Ban lãnh đạo 12/08/2026, HAI chỉ đạo nối tiếp:
   *   ① *"Thêm chức năng tạo đề nghị cho Tô Trọng Hoài"* (kỹ sư hiện trường)
   *   ② *"chức năng đề nghị này hãy tạo cho TOÀN BỘ các tài khoản hiện có"*
   *
   * Nên: **mọi tài khoản vào được app đều lập được đề nghị**.
   *
   * ⚠️ Ban đầu bản này chỉ mở cho Phòng Thi công và QLDA, với lập luận "đề nghị là việc
   * của bên có nhu cầu, thu mua tự đề nghị rồi tự đi mua là mất khâu kiểm soát". Ban lãnh
   * đạo quyết định mở cho tất cả — ghi lại đây để người sau biết đó là **lựa chọn có chủ
   * đích**, không phải sơ suất, và đừng tự siết lại.
   *
   * ⚠️ Khâu kiểm soát KHÔNG nằm trong app này. Đề nghị được duyệt ở app của bộ phận đề
   * xuất rồi mới đẩy sang đây (Ban lãnh đạo chốt 12/08/2026 chiều) — nên `taoDeNghi` chỉ
   * trả lời câu *"ai gõ được phiếu"*, không phải *"phiếu nào được đi tiếp"*.
   */
  taoDeNghi: boolean;
  /* 📌 12/08/2026 (chiều): ĐÃ GỠ `duyetCap1` / `duyetCap2`. Ban lãnh đạo chốt: việc duyệt
     đề nghị diễn ra ở APP KHÁC của bộ phận đề xuất và sẽ đẩy phiếu ĐÃ DUYỆT sang đây —
     app Thu mua không giữ luật duyệt nào nữa. Đừng thêm lại vào file này: hai app cùng
     giữ một luật duyệt là kiểu chắc chắn lệch nhau, và người dùng sẽ không biết tin bên nào. */
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

/**
 * NHÂN VIÊN THU MUA NHẬN ĐƯỢC PHÂN BỔ — lọc từ chính danh sách TÀI KHOẢN.
 *
 * 🔴 CỐ Ý LỌC TỪ `VAI_TRO_MAU`, KHÔNG lọc từ danh bạ nhân sự. Danh bạ có cả người **không có
 * tài khoản đăng nhập**; phân bổ cho họ thì việc treo vĩnh viễn — không ai nhận công tác,
 * không ai lập được đơn, và dòng đó **biến mất khỏi lịch của mọi người** (lịch lọc theo uid,
 * còn cảnh báo "Chờ phân bổ" chỉ hiện khi dòng CHƯA có người). Việc rơi vào vùng mù, chỉ vỡ
 * ra khi trễ ngày cần hàng.
 *
 * Đó đúng là tình trạng trước 11/08/2026: bảng phân bổ cho chọn `u-tm2`/`u-tm3` trong khi chỉ
 * `u-tm1` có tài khoản. Lọc từ đây thì **không thể** phân bổ cho người không đăng nhập được.
 *
 * ⚠️ Đừng đổi sang nhận diện bằng chuỗi chức danh — ghi "Chuyên viên Thu mua" thay vì "Nhân
 * viên Thu mua" là người đó biến mất khỏi bảng phân bổ, im lặng, không báo gì.
 *
 * 📌 Trưởng bộ phận KHÔNG có trong danh sách: chị ấy *phân bổ*, không *nhận phần việc*.
 */
export function nhanVienThuMuaCoTaiKhoan(): VaiTroMau[] {
  return VAI_TRO_MAU.filter((v) => v.chucNang === "nhan_vien_thu_mua");
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

    // MỌI tài khoản vào được app đều lập được đề nghị — chỉ đạo Ban lãnh đạo 12/08/2026.
    // Xem chú thích đầy đủ ở khai báo `taoDeNghi`.
    taoDeNghi: capTM >= 1,

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
    chucVu: "truong_phong",
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
  /**
   * 🔴 BỐN NHÂN VIÊN THU MUA — phải KHỚP `DANH_BA_NHAN_SU` (uid và tên).
   *
   * Ban lãnh đạo yêu cầu 11/08/2026: *"Tạo đủ tài khoản nhân viên TM để a test"*.
   * Trước đó chỉ có `u-tm1` đăng nhập được, trong khi bảng phân bổ lại cho chọn `u-tm2` và
   * `u-tm3` — phân bổ xong thì **không ai vào nhận việc được**, vì họ không có tài khoản.
   *
   * ⚠️ SỬA TÊN Ở ĐÂY PHẢI SỬA CẢ `3-du-lieu/danh-ba-nhan-su.ts`. Hai nơi gọi một người bằng
   * hai tên là màn phân bổ ghi một đằng, khối Lịch sử ghi một nẻo.
   * ⚠️ `u-tm5` (Đoàn Văn L) đã nghỉ việc — CỐ Ý không tạo tài khoản.
   */
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
    uid: "u-tm2",
    tenDangNhap: "tm2",
    tenHienThi: "Trần Văn C",
    chucDanh: "Nhân viên Thu mua (TM2)",
    phongBan: "Phòng Thu mua",
    chucNang: "nhan_vien_thu_mua",
    vaiTro: "staff",
    capTM: 2,
    moTa: "Cấp 2 — Nhập liệu: lập PO cho phần được phân bổ · thấy giá",
  },
  {
    uid: "u-tm3",
    tenDangNhap: "tm3",
    tenHienThi: "Lê Thị D",
    chucDanh: "Nhân viên Thu mua (TM3)",
    phongBan: "Phòng Thu mua",
    chucNang: "nhan_vien_thu_mua",
    vaiTro: "staff",
    capTM: 2,
    moTa: "Cấp 2 — Nhập liệu: lập PO cho phần được phân bổ · thấy giá",
  },
  {
    uid: "u-tm4",
    tenDangNhap: "tm4",
    tenHienThi: "Hoàng Văn I",
    chucDanh: "Nhân viên Thu mua (TM4)",
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
 * 🔴 NGƯỜI CHƯA XÁC ĐỊNH — CẤP 0, KHÔNG ĐƯỢC GÌ HẾT.
 *
 * Dùng khi chưa đăng nhập, hoặc đăng nhập rồi mà KHÔNG đọc được hồ sơ phân quyền.
 *
 * ⚠️ TUYỆT ĐỐI KHÔNG lấy `VAI_TRO_MAC_DINH` làm giá trị dự phòng cho hai trường hợp trên.
 * `VAI_TRO_MAC_DINH` là Trưởng bộ phận **cấp 3** — người lạ sẽ âm thầm chạy dưới quyền
 * phân bổ công việc, xác nhận hoàn thành đơn và **xem được giá**, mà không có một dòng
 * báo lỗi nào. Đây là kiểu lỗi tự nó không bao giờ lộ ra: app trông vẫn chạy đúng.
 *
 * Nguyên tắc: thiếu thông tin thì cho quyền THẤP NHẤT, đừng cho quyền tiện nhất.
 *
 * `capTM: 0` + `vaiTro: "staff"` làm `tinhQuyen()` trả về sai cho MỌI quyền, kể cả
 * `xemDuocApp` — nên người này không vào được app.
 *
 * ⚠️ Không ghi con số cụ thể ở đây. Bản trước ghi "toàn bộ 14 quyền", rồi danh sách quyền
 * thay đổi vài lần trong ngày và con số thành sai mà không ai để ý — chú thích sai còn tệ
 * hơn không có chú thích, vì người đọc tin nó.
 */
export const KHONG_QUYEN: NguoiDung = {
  uid: "",
  tenHienThi: "Chưa đăng nhập",
  chucDanh: "—",
  phongBan: "—",
  chucNang: "phong_thi_cong",
  vaiTro: "staff",
  capTM: 0,
  capKho: 0,
};

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
