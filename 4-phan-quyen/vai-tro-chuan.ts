// ============================================================
// DANH MỤC VAI TRÒ ĐÓNG GÓI SẴN — cách phân quyền dùng được cho người không rành kỹ thuật
//
// 🔴 Ban lãnh đạo 18/08/2026: *"tạo cách phân quyền chuyên nghiệp và dễ cài đặt"*.
//
// ## VÌ SAO PHẢI CÓ FILE NÀY — bản trước KHÓ DÙNG VÀ DỄ SAI
//
// Màn phân quyền bản đầu chỉ cho đổi **cấp 1→4**. Nhưng quyền trong app KHÔNG chỉ do cấp quyết
// định: `tinhQuyen` đọc cả `chucNang` (làm việc gì) và `vaiTro` (admin / director / staff). Hệ quả
// thật: nâng một **thủ kho** từ cấp 1 lên cấp 3 thì họ VẪN không phân bổ được công việc và VẪN
// không thấy giá — vì `phanBoCongViec` đòi `laTruongBP`, `xemGia` đòi đúng nhóm chức năng.
//
// Người phân quyền nhìn màn hình sẽ tưởng đã trao quyền, mà thực tế không có gì đổi. Đó là kiểu
// sai tệ nhất: **im lặng và tin được nhầm**.
//
// ## CÁCH LÀM: GÁN MỘT VAI TRÒ, KHÔNG GHÉP TAY BỐN TRƯỜNG
// Mỗi vai trò dưới đây là một bộ `chucNang + vaiTro + capTM + capKho` đã khớp nhau. Người phân
// quyền chọn *"Nhân viên Thu mua"* là xong — không phải hiểu bốn trường đó nghĩa gì.
//
// 🔴 BẢNG "VAI TRÒ NÀY LÀM ĐƯỢC GÌ" SINH TỰ ĐỘNG TỪ `tinhQuyen`, KHÔNG CHÉP TAY.
// Xem `quyenCuaVaiTro()` bên dưới. Chép tay một bảng mô tả quyền là sớm muộn nó lệch với luật
// thật — và lúc đó màn phân quyền nói dối người đang phân quyền, đúng thứ nguy hiểm nhất ở đây.
//
// 📌 Số liệu từng vai trò lấy ĐÚNG từ `VAI_TRO_MAU` trong `quyen.ts` (bộ tài khoản mẫu đã chạy
// thử từ 11/08/2026), không tự đặt ra bộ mới. Hai nơi lệch nhau thì tài khoản thật và tài khoản
// mẫu hành xử khác nhau, mà chỉ lộ ra khi nối Firebase.
// ============================================================

import {
  tinhQuyen,
  type CapQuyen,
  type ChucNang,
  type NguoiDung,
  type Quyen,
  type VaiTroHeThong,
} from "@/4-phan-quyen/quyen";

/** Mã vai trò — lưu vào hồ sơ để biết người này được gán khuôn nào. */
export type MaVaiTroChuan =
  | "quan_tri"
  | "ban_giam_doc"
  | "truong_bo_phan_thu_mua"
  | "nhan_vien_thu_mua"
  | "ke_toan"
  | "thu_kho"
  | "phong_thi_cong"
  | "qlda"
  | "ngung_truy_cap";

export interface VaiTroChuan {
  ma: MaVaiTroChuan;
  /** Tên hiện trên ô chọn. Viết như cách gọi trong công ty, không dùng từ kỹ thuật. */
  ten: string;
  /** Một câu nói rõ vai trò này để làm gì — hiện ngay dưới ô chọn. */
  moTa: string;
  chucNang: ChucNang;
  vaiTro: VaiTroHeThong;
  capTM: CapQuyen;
  capKho?: CapQuyen;
  /**
   * 🔴 CHỈ QUẢN TRỊ (cấp 4) GÁN ĐƯỢC VAI TRÒ NÀY — không phụ thuộc `capTM` của nó.
   *
   * ⚠️ CHỐT NÀY SINH RA TỪ MỘT LỖ HỔNG THẬT, bắt được lúc soát lại danh mục ngày 18/08/2026:
   * luật gốc cho trưởng bộ phận (cấp 3) gán mọi vai trò có `capTM <= 2`. Mà **"Ban Giám đốc" có
   * `capTM = 1`** — thấp hơn 2 — nên trưởng bộ phận gán được vai trò đó cho bất kỳ ai, và người
   * nhận lập tức **xem được MỌI hồ sơ toàn công ty kèm giá** (`xemMoiHoSo` và `xemGia` bật theo
   * `vaiTro === "director"`, không theo cấp).
   *
   * Bài học để lại: **cấp số KHÔNG đo được mức nguy hiểm của một vai trò.** `tinhQuyen` mở quyền
   * theo cả `vaiTro` và `chucNang`, nên một vai trò "cấp 1" vẫn có thể rộng hơn một vai trò
   * "cấp 3". Thêm vai trò mới vào danh mục thì phải tự hỏi: *người cấp 3 gán vai trò này cho
   * người khác có sinh ra quyền vượt tầm họ không?* — nếu có, bật cờ này.
   */
  chiQuanTriGan?: boolean;
}

/**
 * Chín vai trò gán được.
 *
 * ⚠️ THỨ TỰ CÓ Ý NGHĨA: xếp từ quyền cao xuống thấp, "Ngừng truy cập" đứng cuối. Người phân quyền
 * đọc từ trên xuống là thấy ngay thang bậc, khỏi phải tự sắp.
 */
export const VAI_TRO_CHUAN: VaiTroChuan[] = [
  {
    ma: "quan_tri",
    ten: "Quản trị hệ thống",
    moTa: "Làm được mọi việc trong app, kể cả phân quyền cho người khác.",
    chucNang: "truong_bo_phan_thu_mua",
    vaiTro: "admin",
    capTM: 4,
    capKho: 4,
    chiQuanTriGan: true,
  },
  {
    ma: "ban_giam_doc",
    ten: "Ban Giám đốc",
    moTa: "Xem toàn bộ hồ sơ kèm giá để nắm tình hình. Không nhập liệu, không lập đơn.",
    chucNang: "truong_bo_phan_thu_mua",
    vaiTro: "director",
    capTM: 1,
    /* 🔴 Cấp 1 nhưng QUYỀN XEM RẤT RỘNG: `xemMoiHoSo` + `xemGia` bật theo `vaiTro === "director"`
       chứ không theo cấp. Xem giải thích đầy đủ ở khai báo `chiQuanTriGan`. */
    chiQuanTriGan: true,
  },
  {
    ma: "truong_bo_phan_thu_mua",
    ten: "Trưởng bộ phận Thu mua",
    moTa: "Phân bổ công việc cho nhân viên, xác nhận hoàn thành đơn, xem giá và sửa đơn đã chốt.",
    chucNang: "truong_bo_phan_thu_mua",
    vaiTro: "staff",
    capTM: 3,
    capKho: 1,
  },
  {
    ma: "nhan_vien_thu_mua",
    ten: "Nhân viên Thu mua",
    moTa: "Lấy báo giá và lập đơn mua hàng cho phần việc được giao. Xem được giá.",
    chucNang: "nhan_vien_thu_mua",
    vaiTro: "staff",
    capTM: 2,
  },
  {
    ma: "ke_toan",
    ten: "Kế toán",
    moTa: "Theo dõi công nợ nhà cung cấp, xem được giá. Không lập đơn.",
    chucNang: "ke_toan",
    vaiTro: "staff",
    capTM: 1,
  },
  {
    ma: "thu_kho",
    ten: "Thủ kho công trình",
    moTa: "Lập phiếu nhận hàng từng lần và xác nhận đã nhập kho. 🔒 Không thấy giá.",
    chucNang: "thu_kho_cong_trinh",
    vaiTro: "staff",
    capTM: 1,
    capKho: 2,
  },
  {
    ma: "phong_thi_cong",
    ten: "Phòng Thi công (người đề nghị)",
    moTa: "Gửi đề nghị mua hàng và theo dõi tiến độ đề nghị của mình. 🔒 Không thấy giá, không thấy nhà cung cấp.",
    chucNang: "phong_thi_cong",
    vaiTro: "staff",
    capTM: 1,
  },
  {
    ma: "qlda",
    ten: "Ban Quản lý Dự án",
    moTa: "Xem toàn bộ hồ sơ và giá để kiểm soát định mức. Không lập đơn.",
    chucNang: "qlda",
    vaiTro: "staff",
    capTM: 1,
  },
  {
    /**
     * 🔴 KHÓA BẰNG CÁCH HẠ CẤP VỀ 0, KHÔNG XÓA TÀI KHOẢN.
     *
     * Người nghỉ việc mà xóa hồ sơ thì mọi dòng phân bổ, nhật ký và lịch việc mang tên họ thành
     * mồ côi — tra lại hồ sơ cũ không biết ai đã làm gì. Hạ về cấp 0 thì họ không vào được app
     * nữa mà dữ liệu lịch sử vẫn nguyên chủ.
     */
    ma: "ngung_truy_cap",
    ten: "Ngừng truy cập",
    moTa: "Không vào được app nữa. Dùng cho người chuyển bộ phận hoặc nghỉ việc — hồ sơ và nhật ký cũ vẫn giữ nguyên tên họ.",
    chucNang: "phong_thi_cong",
    vaiTro: "staff",
    capTM: 0,
  },
];

export function timVaiTroChuan(ma: string): VaiTroChuan | undefined {
  return VAI_TRO_CHUAN.find((v) => v.ma === ma);
}

/**
 * Những vai trò MỘT NGƯỜI GÁN ĐƯỢC — hai điều kiện, thiếu một là hở.
 *
 * ① Cấp của vai trò không vượt tầm người gán (`capDatDuocToiDa`).
 * ② Vai trò không mang cờ `chiQuanTriGan`, trừ khi người gán là cấp 4.
 *
 * 🔴 ĐỂ Ở ĐÂY CHỨ KHÔNG LỌC TRONG MÀN HÌNH. Màn hình dùng danh sách này để dựng ô chọn, và tầng
 * xác nhận trước khi ghi cũng hỏi lại chính nó — một luật, một chỗ. Lọc trong file giao diện là
 * sớm muộn có chỗ thứ hai lọc kiểu khác.
 */
export function vaiTroGanDuocBoi(capToiDaGanDuoc: CapQuyen): VaiTroChuan[] {
  return VAI_TRO_CHUAN.filter(
    (v) => v.capTM <= capToiDaGanDuoc && (!v.chiQuanTriGan || capToiDaGanDuoc >= 4),
  );
}

/**
 * Vai trò nào KHỚP với hồ sơ hiện tại của một người.
 *
 * ⚠️ Trả `undefined` khi hồ sơ không khớp khuôn nào — chuyện có thật với hồ sơ tạo bằng script
 * trước khi có danh mục này. Màn hình phải chịu được: hiện "Tùy chỉnh" chứ đừng im lặng chọn đại
 * một vai trò, vì chọn đại rồi bấm Lưu là đổi quyền người ta mà không ai định làm vậy.
 */
export function vaiTroKhopVoiHoSo(hs: {
  chucNang: ChucNang;
  vaiTro: VaiTroHeThong;
  capTM: CapQuyen;
}): VaiTroChuan | undefined {
  return VAI_TRO_CHUAN.find(
    (v) => v.chucNang === hs.chucNang && v.vaiTro === hs.vaiTro && v.capTM === hs.capTM,
  );
}

/**
 * 🔴 QUYỀN THẬT CỦA MỘT VAI TRÒ — tính bằng CHÍNH `tinhQuyen`, không chép tay.
 *
 * Đây là điểm mấu chốt của cả file. Bảng "vai trò này làm được gì" trên màn phân quyền lấy dữ
 * liệu từ đây, nên nó **không thể** nói khác luật thật: sửa `tinhQuyen` là bảng tự đổi theo.
 *
 * 📌 Dựng một `NguoiDung` giả chỉ để hỏi luật — các trường không ảnh hưởng quyền (tên, phòng ban)
 * để rỗng. `tinhQuyen` là hàm thuần nên gọi bao nhiêu lần cũng được.
 */
export function quyenCuaVaiTro(v: VaiTroChuan): Quyen {
  const nguoiGia: NguoiDung = {
    uid: "",
    tenHienThi: "",
    chucDanh: "",
    phongBan: "",
    chucNang: v.chucNang,
    vaiTro: v.vaiTro,
    capTM: v.capTM,
    capKho: v.capKho,
  };
  return tinhQuyen(nguoiGia);
}

/**
 * Các việc đưa lên bảng đối chiếu, kèm nhãn tiếng Việt.
 *
 * ⚠️ CỐ Ý KHÔNG LIỆT KÊ HẾT mọi cờ trong `Quyen`. Bảng này để người phân quyền **quyết định**,
 * nên chỉ giữ những việc họ thật sự cân nhắc khi trao quyền. Bày cả `xuatHoSo` hay `taoDeNghi`
 * (vốn mở cho mọi tài khoản) chỉ làm bảng dài ra mà không giúp quyết định gì.
 *
 * 🔴 Xếp việc NHẠY CẢM lên đầu: xem giá và xem nhà cung cấp là hai thứ Ban lãnh đạo đã chốt phải
 * chặn với thủ kho và Phòng Thi công. Người phân quyền phải nhìn thấy chúng trước tiên.
 */
export const VIEC_TREN_BANG_DOI_CHIEU: { khoa: keyof Quyen; nhan: string }[] = [
  { khoa: "xemGia", nhan: "Xem giá" },
  { khoa: "xemNhaCungCap", nhan: "Xem nhà cung cấp" },
  { khoa: "xemQuyTrinhMuaHang", nhan: "Vào Quy trình mua hàng" },
  { khoa: "phanBoCongViec", nhan: "Phân bổ công việc" },
  { khoa: "lapPO", nhan: "Lập đơn mua hàng" },
  /* Thêm 29/08/2026 cùng tính năng "PO chờ đề nghị" — cùng mức nhạy cảm với `suaPODaChot`/
     `xacNhanTruongBP` (lập được PO thật, tính công nợ ngay, KHÔNG cần đề nghị nào trước), nên
     phải hiện trong bảng đối chiếu để người phân quyền thấy rõ ai đang có quyền này. */
  { khoa: "taoPoDoiLap", nhan: "Lập PO độc lập (chờ đề nghị)" },
  { khoa: "suaPODaChot", nhan: "Sửa đơn đã chốt" },
  { khoa: "ghiPhieuNhanHang", nhan: "Ghi phiếu nhận hàng" },
  { khoa: "xacNhanKho", nhan: "Xác nhận nhập kho" },
  { khoa: "xacNhanTruongBP", nhan: "Xác nhận hoàn thành đơn" },
  { khoa: "xemCongNo", nhan: "Xem công nợ" },
  { khoa: "phanQuyenNguoiDung", nhan: "Phân quyền người dùng" },
];
