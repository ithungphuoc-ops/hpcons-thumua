// ============================================================
// HỒ SƠ NHÂN SỰ TỪ APP TỔNG — `users/{uid}` của Firestore `hpcons-portal`
//
// 🔴 Chỉ đạo Ban lãnh đạo 10/08/2026: *"tích hợp sẵn để sau này lấy thông tin từ app tổng
// qua, bấm vào avatar này sẽ ra các thông tin cá nhân"*.
//
// "Tích hợp sẵn" nghĩa là: kiểu dữ liệu dưới đây khớp ĐÚNG TỪNG TRƯỜNG với cấu trúc
// `users/{uid}` trong tài liệu bắt buộc của App Tổng
// (`12. APP TONG HPC/2. OUTPUT/firestore-design/CAU-TRUC-FIRESTORE.md`, mục 3.1).
// Giao diện viết trên kiểu này thì khi nối Firebase chỉ thay RUỘT hàm `layHoSoNhanSu`
// bằng `getDoc(doc(db, "users", uid))` — không phải sửa giao diện.
//
// 🔴 CÁC APP KHÔNG ĐẨY DỮ LIỆU QUA NHAU (kiến trúc HPcore): App Tổng là nơi duy nhất
// GHI hồ sơ nhân sự; app Thu mua chỉ ĐỌC. Đừng viết hàm sửa hồ sơ ở đây — sửa hồ sơ
// làm trên App Tổng.
// ============================================================

import { VAI_TRO_MAU } from "@/4-phan-quyen/quyen";

/** Khớp đúng từng trường của `users/{uid}` — xem CAU-TRUC-FIRESTORE.md mục 3.1. */
export interface HoSoNhanSu {
  displayName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  /** Mã nhân viên nội bộ, vd "HPC-025". */
  employeeCode?: string;
  /** Phòng ban chính (slug của App Tổng, vd "thu-mua"). Bản chạy thử để tên đầy đủ. */
  department: string;
  title: string;
  role: "admin" | "director" | "staff";
  /** Quyền từng app con — khóa là mã app (`tm`, `tk`, `dt`...), giá trị 1–4. */
  apps: Record<string, number>;
  status: "active" | "inactive";
}

/** Nhãn tiếng Việt cho các app con — để màn hồ sơ hiện "Thu mua" thay vì mã "tm". */
export const TEN_APP_CON: Record<string, string> = {
  tm: "Thu mua",
  tk: "Thiết kế",
  dt: "Đấu thầu",
  tc: "Thi công",
  kho: "Kho",
  kt: "Kế toán",
  ns: "Nhân sự",
};

/**
 * Đọc hồ sơ nhân sự của một người.
 *
 * ⚠️ BẢN CHẠY THỬ: dựng hồ sơ từ tài khoản mẫu (`VAI_TRO_MAU`), email và mã nhân viên là
 * GIẢ ĐỊNH suy từ tên đăng nhập — không phải dữ liệu thật.
 *
 * 🔴 KHI NỐI FIREBASE: thay ruột hàm này bằng
 *     const snap = await getDoc(doc(db, "users", uid));
 *     return snap.exists() ? (snap.data() as HoSoNhanSu) : null;
 * và XÓA phần dựng từ VAI_TRO_MAU. Chữ ký hàm giữ nguyên nên giao diện không phải sửa.
 * (Để `async` sẵn từ bây giờ cũng vì lý do đó.)
 */
export async function layHoSoNhanSu(uid: string): Promise<HoSoNhanSu | null> {
  const tk = VAI_TRO_MAU.find((v) => v.uid === uid);
  if (!tk) return null;
  return {
    displayName: tk.tenHienThi,
    // Email giả định theo quy ước <tênđăngnhập>@hpcons.com.vn — chỉ để xem bố cục màn hồ sơ.
    email: `${tk.tenDangNhap}@hpcons.com.vn`,
    phone: undefined, // Tài khoản mẫu không bịa số điện thoại — trống thì màn hồ sơ ghi "—".
    employeeCode: `HPC-${tk.tenDangNhap.toUpperCase()}`,
    department: tk.phongBan,
    title: tk.chucDanh,
    // `VaiTroHeThong` của app này trùng đúng kiểu `role` của App Tổng — gán thẳng.
    role: tk.vaiTro,
    // Bản chạy thử chỉ biết quyền hai app; hồ sơ thật trên App Tổng có đủ mọi app.
    // `capKho` không bắt buộc trong tài khoản mẫu — không có thì đừng đưa khóa "kho" vào,
    // để màn hồ sơ khỏi hiện "Kho: cấp undefined".
    apps: { tm: tk.capTM, ...(tk.capKho !== undefined && { kho: tk.capKho }) },
    status: "active",
  };
}
