// ============================================================
// DANH BẠ NHÂN SỰ CÔNG TY
//
// Dùng cho ô chọn "Thêm người theo dõi" (và mọi chỗ sau này cần chọn người).
//
// 🔴 CẤU TRÚC BÁM ĐÚNG `users/{uid}` CỦA APP TỔNG HPcore:
//    ../../../12. APP TONG HPC/2. OUTPUT/firestore-design/CAU-TRUC-FIRESTORE.md §3.1
//    displayName · email · employeeCode · department · title · role · apps · status
//
// ⚠️ DỮ LIỆU DƯỚI ĐÂY LÀ DỮ LIỆU MẪU, TÊN NGƯỜI LÀ TÊN GIẢ ĐỊNH.
//    Không phải danh sách nhân sự thật của HP CONS.
//
// 🔴 KHI NỐI FIREBASE THẬT: xóa mảng `DANH_BA_NHAN_SU` và đọc collection `users`
//    của project `hpcons-portal` (lọc `status === "active"`). Kiểu `NhanSu` giữ nguyên,
//    giao diện KHÔNG phải sửa. Cần quyền truy cập — xem việc chờ số 11 ở README dự án.
// ============================================================

import { boDau } from "@/6-tien-ich/bo-dau";
import { nhanPhongBan, type MaPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";

/** Một dòng trong danh bạ — ánh xạ 1-1 với `users/{uid}` của App Tổng. */
export interface NhanSu {
  uid: string;
  displayName: string;
  /** Mã nhân viên nội bộ, vd HPC-025. */
  employeeCode: string;
  /** Mã phòng ban — xem `NHAN_PHONG_BAN`. */
  department: MaPhongBan;
  /** Chức danh hiển thị. */
  title: string;
  email?: string;
  /** Nghỉ việc thì `inactive` — KHÔNG được chọn làm người theo dõi. */
  status: "active" | "inactive";
}

/* 🔴 12/08/2026: file này TỪNG có một danh mục phòng ban RIÊNG (mã gạch nối `thi-cong`,
   tên "Phòng Thiết kế & Đấu thầu"…) song song với danh mục dùng cho đề nghị. Hai bảng
   lệch nhau cả mã lẫn tên — cùng một phòng mà chỗ này gọi "Phòng Thu mua", chỗ kia
   "Phòng Thu mua Cung ứng", và không ai biết bên nào đúng.

   Nay CHỈ CÒN MỘT danh mục: `3-du-lieu/danh-muc-phong-ban.ts` (16 phòng ban Ban lãnh đạo
   cung cấp). Đừng khai lại bảng nhãn phòng ban ở đây hay bất cứ file nào khác. */

/**
 * Thứ tự phòng ban khi hiển thị — phòng liên quan mua hàng để lên trên cho dễ tìm.
 *
 * ⚠️ Đây CHỈ là thứ tự ưu tiên, KHÔNG phải danh sách đầy đủ. Nơi dùng phải xếp những mã
 * không có ở đây xuống cuối chứ đừng lọc bỏ — lọc bỏ là người của phòng ban mới **biến
 * mất khỏi hộp chọn** mà không báo gì. Đã suýt dính khi đổi mã phòng ban ngày 12/08/2026.
 */
export const THU_TU_PHONG_BAN: MaPhongBan[] = [
  "thu_mua_cung_ung",
  "thi_cong",
  "kho",
  "quan_ly_du_an",
  "ke_toan_tai_chinh",
  "ban_giam_doc",
];

// 🔴 TÊN NGƯỜI ĐẶT THEO HỆ GIẢ ĐỊNH "Họ + Văn/Thị + MỘT CHỮ CÁI" (quyết định 23,
//    Ban lãnh đạo chốt 07/08/2026). Hệ này cố tình trông KHÔNG giống tên thật để
//    người xem bản chạy thử không nhầm đây là nhân sự thật của công ty.
//    8 người đầu trùng đúng tên đang dùng trong `du-lieu-mau.ts` — sửa tên ở đây
//    thì phải sửa cả bên đó, nếu không hai màn hình sẽ gọi một người bằng hai tên.
export const DANH_BA_NHAN_SU: NhanSu[] = [
  // --- Ban Giám đốc ---
  { uid: "u-bgd-01", displayName: "Vũ Văn K", employeeCode: "HPC-002", department: "ban_giam_doc", title: "Phó Tổng Giám đốc", status: "active" },

  // --- Phòng Thu mua (5 người + 1 đã nghỉ) ---
  { uid: "u-tbp", displayName: "Trần Thị B", employeeCode: "HPC-041", department: "thu_mua_cung_ung", title: "Trưởng bộ phận Thu mua", status: "active" },
  { uid: "u-tm1", displayName: "Nguyễn Văn A", employeeCode: "HPC-042", department: "thu_mua_cung_ung", title: "Nhân viên Thu mua (TM1)", status: "active" },
  { uid: "u-tm2", displayName: "Trần Văn C", employeeCode: "HPC-043", department: "thu_mua_cung_ung", title: "Nhân viên Thu mua (TM2)", status: "active" },
  { uid: "u-tm3", displayName: "Lê Thị D", employeeCode: "HPC-044", department: "thu_mua_cung_ung", title: "Nhân viên Thu mua (TM3)", status: "active" },
  { uid: "u-tm4", displayName: "Hoàng Văn I", employeeCode: "HPC-045", department: "thu_mua_cung_ung", title: "Nhân viên Thu mua (TM4)", status: "active" },
  // Người đã nghỉ việc — để kiểm chứng luật "không chọn được người inactive".
  { uid: "u-tm5", displayName: "Đoàn Văn L", employeeCode: "HPC-039", department: "thu_mua_cung_ung", title: "Nhân viên Thu mua (đã nghỉ)", status: "inactive" },

  // --- Phòng Thi công ---
  { uid: "u-tc", displayName: "Phạm Văn F", employeeCode: "HPC-061", department: "thi_cong", title: "Chỉ huy trưởng công trình", status: "active" },
  { uid: "u-tc-02", displayName: "Bùi Văn H", employeeCode: "HPC-062", department: "thi_cong", title: "Chỉ huy trưởng công trình", status: "active" },
  { uid: "u-tc-03", displayName: "Ngô Văn M", employeeCode: "HPC-063", department: "thi_cong", title: "Kỹ sư hiện trường", status: "active" },
  { uid: "u-tc-04", displayName: "Đặng Văn N", employeeCode: "HPC-064", department: "thi_cong", title: "Giám sát thi công", status: "active" },

  // --- Kho công trình ---
  { uid: "u-kho", displayName: "Hoàng Văn E", employeeCode: "HPC-071", department: "kho", title: "Thủ kho công trình", status: "active" },
  { uid: "u-kho-02", displayName: "Trịnh Văn O", employeeCode: "HPC-072", department: "kho", title: "Thủ kho công trình", status: "active" },

  // --- Ban Quản lý Dự án ---
  { uid: "u-qlda", displayName: "Vũ Văn G", employeeCode: "HPC-081", department: "quan_ly_du_an", title: "Ban Quản lý Dự án", status: "active" },
  { uid: "u-qlda-02", displayName: "Lý Thị P", employeeCode: "HPC-082", department: "quan_ly_du_an", title: "Chuyên viên QLDA", status: "active" },

  // --- Phòng Kế toán ---
  { uid: "u-kt-01", displayName: "Nguyễn Thị Q", employeeCode: "HPC-091", department: "ke_toan_tai_chinh", title: "Kế toán trưởng", status: "active" },
  { uid: "u-kt-02", displayName: "Phan Văn R", employeeCode: "HPC-092", department: "ke_toan_tai_chinh", title: "Kế toán thanh toán", status: "active" },

  // --- QA-QC ---
  { uid: "u-qc-01", displayName: "Hồ Văn S", employeeCode: "HPC-101", department: "qa_qc", title: "Trưởng bộ phận QA-QC", status: "active" },
  { uid: "u-qc-02", displayName: "Nguyễn Thị T", employeeCode: "HPC-102", department: "qa_qc", title: "Nhân viên QA-QC", status: "active" },

  // --- Bảo trì ---
  { uid: "u-bt-01", displayName: "Trương Văn U", employeeCode: "HPC-111", department: "bao_tri", title: "Trưởng bộ phận Bảo trì", status: "active" },

  // --- Hành chính Nhân sự — IT ---
  { uid: "u-hc-01", displayName: "Lê Thị V", employeeCode: "HPC-121", department: "hanh_chinh_nhan_su_it", title: "Trưởng phòng Hành chính Nhân sự", status: "active" },
  { uid: "u-hc-02", displayName: "Cao Văn X", employeeCode: "HPC-122", department: "hanh_chinh_nhan_su_it", title: "Chuyên viên IT", status: "active" },

  // --- Kinh doanh ---
  { uid: "u-kd-01", displayName: "Đinh Văn Y", employeeCode: "HPC-131", department: "kinh_doanh", title: "Trưởng phòng Kinh doanh", status: "active" },

  // --- Thiết kế & Đấu thầu ---
  // Hết chữ cái đơn nên dùng hai chữ — vẫn nằm trong hệ tên giả định.
  { uid: "u-tk-01", displayName: "Võ Văn AA", employeeCode: "HPC-141", department: "thiet_ke", title: "Trưởng phòng Thiết kế", status: "active" },
  { uid: "u-tk-02", displayName: "Phùng Văn AB", employeeCode: "HPC-142", department: "thiet_ke", title: "Chuyên viên Đấu thầu", status: "active" },
];

/** Chỉ người đang làm việc mới được chọn. Người đã nghỉ giữ lại để tra lịch sử. */
export function nhanSuDangLamViec(): NhanSu[] {
  return DANH_BA_NHAN_SU.filter((n) => n.status === "active");
}

/** Tên hiển thị của một người theo uid. Không tra ra thì trả lại chính uid — để lộ ra ngay
 *  là dữ liệu thiếu, thay vì hiện một cái tên bịa. */
export function tenTheoUid(uid: string): string {
  return DANH_BA_NHAN_SU.find((n) => n.uid === uid)?.displayName ?? uid;
}

/** Tìm theo tên, mã nhân viên, chức danh hoặc tên phòng ban — gõ có dấu hay không đều được. */
export function timNhanSu(danhSach: NhanSu[], tuKhoa: string): NhanSu[] {
  const k = boDau(tuKhoa.trim());
  if (k === "") return danhSach;
  return danhSach.filter((n) =>
    boDau(
      `${n.displayName} ${n.employeeCode} ${n.title} ${nhanPhongBan(n.department)}`,
    ).includes(k),
  );
}
