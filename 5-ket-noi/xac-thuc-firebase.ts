// ============================================================
// XÁC THỰC THẬT BẰNG FIREBASE AUTHENTICATION
//
// 🔴 Chỉ đạo Ban lãnh đạo 12/08/2026: *"Tạo tài khoản chạy thử, thông tin đăng nhập riêng,
// phân quyền riêng cho các thành viên để a test, chứ dùng tài khoản dùng thử này test
// không chính xác"*. Sếp chọn **Firebase Auth thật**, không chọn cách gắn mật khẩu vào mã.
//
// KHÁC BIỆT SO VỚI CÁCH CŨ — đây là lý do phải đổi:
//   · Cũ: mật khẩu chung `hpcons2026` nằm trong mã nguồn tải về máy. Ai bấm F12 cũng đọc
//     được, và màn đăng nhập còn IN SẴN danh sách tài khoản. Ai cũng vào được vai bất kỳ,
//     nên thử phân quyền không có ý nghĩa.
//   · Mới: mật khẩu do máy chủ Google giữ, app **không hề biết** mật khẩu của ai. Sếp cấp
//     lại / khóa được từng người. Vào nhầm vai là không thể.
//
// ============================================================
// 🔴 HAI LỚP DANH TÍNH — HIỂU SAI CHỖ NÀY LÀ MẤT HẾT DỮ LIỆU CŨ
// ============================================================
//
// Firebase sinh mã người dùng NGẪU NHIÊN (vd `kQ7xW2...`), trong khi dữ liệu nghiệp vụ
// đang có đã ghi mã của app (`u-tm1`, `u-tbp`…) vào khắp nơi: người phụ trách từng dòng
// vật tư, người theo dõi, người nhận công tác, lịch công việc, nhật ký.
//
// Nếu lấy thẳng mã Firebase làm danh tính nghiệp vụ thì:
//   · Mọi dòng đã phân bổ thành **mồ côi** — không ai còn là người phụ trách
//   · Lịch công việc lọc theo mã nên **việc biến mất khỏi lịch của tất cả mọi người**
//   · Nhật ký cũ trỏ tới người không còn tồn tại
//
// Nên tách hai lớp:
//   · **Firebase uid** — danh tính đăng nhập, do Google quản, ngẫu nhiên
//   · **`uidNghiepVu`** — danh tính trong hồ sơ (`u-tm1`…), do app quản, BỀN VỮNG
//
// Hồ sơ `nguoi-dung/{firebaseUid}` nối hai lớp lại. Đổi mật khẩu, xóa rồi tạo lại tài
// khoản, thậm chí đổi cả email — `uidNghiepVu` giữ nguyên thì dữ liệu cũ vẫn đúng chủ.
// ============================================================

import { moFirebase, daCauHinhFirebase } from "@/5-ket-noi/firebase-chung";

/** Kết quả một lần đăng nhập. `null` ở `loi` nghĩa là thành công. */
export interface KetQuaDangNhap {
  loi: string | null;
}

/**
 * Trạng thái của tầng xác thực — phải phân biệt đủ BỐN, đừng gộp.
 *
 * ⚠️ Gộp `dang-doc` vào `chua-dang-nhap` là mỗi lần tải trang màn đăng nhập lại chớp lên
 * một nhịp trước mắt người đã đăng nhập. Gộp `khong-co-auth` vào `chua-dang-nhap` là máy
 * chưa cấu hình Firebase sẽ kẹt ở màn đăng nhập, không vào app được.
 */
export type TrangThaiXacThuc =
  | "dang-doc" // Chưa biết — đang hỏi Firebase xem có phiên cũ không
  | "chua-dang-nhap"
  | "da-dang-nhap"
  | "khong-co-auth"; // Chưa cấu hình Firebase → app chạy chế độ tài khoản mẫu

export interface NguoiDaDangNhap {
  firebaseUid: string;
  email: string;
}

/**
 * Chuyển mã lỗi của Firebase thành câu tiếng Việt người dùng hiểu được.
 *
 * 🔴 Sai tên và sai mật khẩu phải trả về **CÙNG MỘT CÂU**. Nói rõ "email này không tồn
 * tại" là chỉ điểm cho người dò tài khoản: họ thử email cho tới khi hết báo lỗi đó, thế là
 * biết ai có tài khoản trong hệ thống. Firebase mới cũng gộp thành `invalid-credential`
 * vì lý do này, nhưng bản cũ còn trả `user-not-found` nên phải gộp lại ở đây.
 */
function dichLoi(ma: string): string {
  switch (ma) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Email hoặc mật khẩu không đúng.";
    case "auth/user-disabled":
      return "Tài khoản này đã bị khóa. Liên hệ phòng IT.";
    case "auth/too-many-requests":
      return "Nhập sai quá nhiều lần nên tài khoản tạm bị chặn. Chờ ít phút rồi thử lại.";
    case "auth/network-request-failed":
      return "Không kết nối được máy chủ. Kiểm tra lại mạng rồi thử lại.";
    case "auth/operation-not-allowed":
      // Câu này nói thẳng việc phải làm, vì nó là lỗi CẤU HÌNH chứ không phải lỗi người dùng.
      return "Đăng nhập bằng email chưa được bật trên Firebase. Báo phòng IT bật mục Authentication → Email/Password.";
    default:
      return `Không đăng nhập được (${ma}).`;
  }
}

async function moAuth() {
  const app = await moFirebase();
  if (!app) return null;
  const auth = await import("firebase/auth");
  return { auth: auth.getAuth(app), ...auth };
}

/**
 * Theo dõi phiên đăng nhập. Gọi `khiDoi` mỗi lần trạng thái đổi — kể cả lần đầu khi
 * Firebase đọc xong phiên cũ trong máy.
 *
 * Trả về hàm ngừng theo dõi, hoặc `null` khi chưa cấu hình Firebase.
 */
export async function theoDoiPhien(
  khiDoi: (nguoi: NguoiDaDangNhap | null) => void,
): Promise<(() => void) | null> {
  if (!daCauHinhFirebase()) return null;
  const m = await moAuth();
  if (!m) return null;

  return m.onAuthStateChanged(m.auth, (u) => {
    khiDoi(u ? { firebaseUid: u.uid, email: u.email ?? "" } : null);
  });
}

/**
 * Đăng nhập bằng email + mật khẩu.
 *
 * `ghiNho` quyết định phiên sống bao lâu — đúng nguyên tắc đã có từ bản chạy thử:
 *   · true  → sống qua lần đóng trình duyệt
 *   · false → chỉ sống trong tab đang mở, đóng trình duyệt là thoát
 *
 * 🔴 Cái sau quan trọng với máy dùng chung ở công trường: người trước quên đăng xuất thì
 * người sau không vào được bằng tài khoản của họ.
 *
 * ⚠️ Phải đặt kiểu lưu phiên TRƯỚC khi gọi đăng nhập. Đặt sau thì lần đăng nhập đó đã ghi
 * vào kho mặc định (sống lâu) rồi, lựa chọn "không duy trì" chỉ có tác dụng từ lần sau.
 */
export async function dangNhapEmail(
  email: string,
  matKhau: string,
  ghiNho: boolean,
): Promise<KetQuaDangNhap> {
  const m = await moAuth();
  if (!m) return { loi: "Chưa cấu hình kết nối máy chủ nên chưa đăng nhập được." };

  try {
    await m.setPersistence(m.auth, ghiNho ? m.browserLocalPersistence : m.browserSessionPersistence);
    await m.signInWithEmailAndPassword(m.auth, email.trim(), matKhau);
    return { loi: null };
  } catch (e) {
    const ma = (e as { code?: string }).code ?? "khong-ro";
    return { loi: dichLoi(ma) };
  }
}

export async function dangXuatFirebase(): Promise<void> {
  const m = await moAuth();
  if (!m) return;
  await m.signOut(m.auth);
}

/**
 * Gửi thư đặt lại mật khẩu.
 *
 * 📌 Có hàm này để Sếp KHÔNG phải giữ mật khẩu của nhân viên. Người quên mật khẩu tự bấm,
 * Google gửi thư — không ai phải đọc mật khẩu của ai qua tin nhắn.
 *
 * 🔴 Luôn trả về THÀNH CÔNG kể cả khi email không tồn tại: báo "email này không có trong
 * hệ thống" là để lộ ai có tài khoản, cùng lý do với `dichLoi` ở trên.
 */
export async function guiThuDatLaiMatKhau(email: string): Promise<KetQuaDangNhap> {
  const m = await moAuth();
  if (!m) return { loi: "Chưa cấu hình kết nối máy chủ." };
  try {
    await m.sendPasswordResetEmail(m.auth, email.trim());
  } catch (e) {
    const ma = (e as { code?: string }).code ?? "";
    // Chỉ nói thật với lỗi hạ tầng; lỗi "không tìm thấy người dùng" thì im lặng coi như xong.
    if (ma === "auth/network-request-failed" || ma === "auth/operation-not-allowed") {
      return { loi: dichLoi(ma) };
    }
  }
  return { loi: null };
}
