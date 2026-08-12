// ============================================================
// HỒ SƠ TÀI KHOẢN TRÊN MÁY CHỦ — collection `nguoi-dung`
//
// Firebase Authentication chỉ trả lời được MỘT câu: "người này là ai" (email + mã uid).
// Nó KHÔNG biết người đó là trưởng bộ phận hay thủ kho, cấp mấy, thấy giá hay không.
// Những thứ đó nằm ở đây, mỗi người một tài liệu `nguoi-dung/{firebaseUid}`.
//
// 🔴 Vì sao để trên Firestore chứ không nhét vào custom claims: claims chỉ đổi được bằng
// Admin SDK và người dùng phải đăng xuất/đăng nhập lại mới thấy thay đổi. Hồ sơ trên
// Firestore thì Sếp đổi cấp quyền là người đó thấy ngay ở lần tải trang kế tiếp.
//
// ⚠️ NHƯNG hồ sơ Firestore KHÔNG chặn được gì ở tầng dữ liệu. Security Rules không đọc
// được tài liệu này để quyết định (đọc chéo trong rules vừa chậm vừa tốn). Muốn chặn thật
// ở tầng dữ liệu thì vẫn phải dùng custom claims — việc đó để khi nối App Tổng.
// Hiện tại: hồ sơ quyết định GIAO DIỆN thấy gì, rules chỉ chặn ở mức "phải đăng nhập".
//
// 📌 Khi nối App Tổng thì đổi hàm trong file này sang đọc `users/{uid}` của HPcore —
// phần còn lại của app KHÔNG phải sửa, vì mọi màn hình chỉ hỏi `quyen`.
// ============================================================

import { moFirebase } from "@/5-ket-noi/firebase-chung";
import type { CapQuyen, ChucNang, NguoiDung, VaiTroHeThong } from "@/4-phan-quyen/quyen";

export const BO_SUU_TAP_NGUOI_DUNG = "nguoi-dung";

/**
 * Hồ sơ lưu trên máy chủ. So với `NguoiDung` thì có thêm phần quản trị tài khoản.
 *
 * 🔴 `uidNghiepVu` là mã BỀN VỮNG của người này trong dữ liệu nghiệp vụ (`u-tm1`…), KHÔNG
 * phải mã Firebase. Xem phần "hai lớp danh tính" ở `xac-thuc-firebase.ts`. Xóa tài khoản
 * rồi tạo lại mà giữ đúng `uidNghiepVu` thì mọi phân bổ, nhật ký, lịch việc cũ vẫn đúng chủ.
 */
export interface HoSoTaiKhoan {
  uidNghiepVu: string;
  email: string;
  tenHienThi: string;
  chucDanh: string;
  phongBan: string;
  chucNang: ChucNang;
  vaiTro: VaiTroHeThong;
  capTM: CapQuyen;
  capKho?: CapQuyen;
  /** `false` = tạm ngưng: còn đăng nhập được nhưng app từ chối cho vào. */
  dangLamViec: boolean;
}

/** Đổi hồ sơ máy chủ thành `NguoiDung` mà toàn bộ giao diện đang dùng. */
export function thanhNguoiDung(h: HoSoTaiKhoan): NguoiDung {
  return {
    uid: h.uidNghiepVu,
    tenHienThi: h.tenHienThi,
    chucDanh: h.chucDanh,
    phongBan: h.phongBan,
    chucNang: h.chucNang,
    vaiTro: h.vaiTro,
    capTM: h.capTM,
    capKho: h.capKho,
  };
}

/**
 * Kiểm dữ liệu đọc về có dùng được không.
 *
 * ⚠️ Hồ sơ do người tạo tài khoản ghi lên, gõ sai một trường là app hiểu sai quyền. Thà
 * từ chối cho vào còn hơn cho vào với cấp quyền đoán mò — đoán thấp thì người ta không làm
 * được việc, đoán cao thì thủ kho nhìn thấy giá.
 */
function hopLe(d: Partial<HoSoTaiKhoan> | undefined): d is HoSoTaiKhoan {
  if (!d) return false;
  const capOk = (x: unknown) => typeof x === "number" && x >= 0 && x <= 4;
  return (
    typeof d.uidNghiepVu === "string" &&
    d.uidNghiepVu.length > 0 &&
    typeof d.tenHienThi === "string" &&
    d.tenHienThi.length > 0 &&
    typeof d.chucNang === "string" &&
    typeof d.vaiTro === "string" &&
    capOk(d.capTM)
  );
}

/** Lý do không vào được app, hoặc `null` khi vào được. */
export type KetQuaHoSo =
  | { hoSo: HoSoTaiKhoan; loi: null }
  | { hoSo: null; loi: string };

/**
 * Đọc hồ sơ của người vừa đăng nhập.
 *
 * 🔴 Đăng nhập được KHÔNG có nghĩa là được vào app. Người có tài khoản Firebase mà chưa
 * được cấp hồ sơ thì phải bị chặn kèm lý do rõ ràng — nếu lặng lẽ cho vào với quyền mặc
 * định thì hoặc họ thấy thứ không được thấy, hoặc họ bơ vơ không hiểu vì sao app trống trơn.
 */
export async function docHoSoTaiKhoan(firebaseUid: string): Promise<KetQuaHoSo> {
  const app = await moFirebase();
  if (!app) return { hoSo: null, loi: "Chưa cấu hình kết nối máy chủ." };

  const { getFirestore, doc, getDoc } = await import("firebase/firestore");
  try {
    const anh = await getDoc(doc(getFirestore(app), BO_SUU_TAP_NGUOI_DUNG, firebaseUid));
    if (!anh.exists()) {
      return {
        hoSo: null,
        loi: "Tài khoản của bạn chưa được cấp quyền vào app Thu mua. Liên hệ phòng IT để được cấp.",
      };
    }
    const d = anh.data() as Partial<HoSoTaiKhoan>;
    if (!hopLe(d)) {
      return {
        hoSo: null,
        loi: "Hồ sơ tài khoản của bạn thiếu thông tin phân quyền. Liên hệ phòng IT để kiểm tra lại.",
      };
    }
    if (d.dangLamViec === false) {
      return { hoSo: null, loi: "Tài khoản này đã tạm ngưng. Liên hệ phòng IT." };
    }
    return { hoSo: d, loi: null };
  } catch (e) {
    console.error("[hồ sơ] đọc hỏng:", e);
    return { hoSo: null, loi: "Không đọc được hồ sơ tài khoản. Kiểm tra lại mạng rồi thử lại." };
  }
}

/**
 * Đọc TOÀN BỘ danh sách người có tài khoản.
 *
 * Dùng cho hai việc: bảng phân bổ (chỉ được phân cho người đăng nhập được) và tra tên
 * theo mã nghiệp vụ trong nhật ký.
 *
 * 🔴 Cùng một lý do với `nhanVienThuMuaCoTaiKhoan()` trong `quyen.ts`: phân bổ cho người
 * KHÔNG có tài khoản thì việc treo vĩnh viễn — không ai nhận, không ai lập được đơn, và
 * dòng đó biến mất khỏi lịch của mọi người.
 *
 * ⚠️ Đọc cả collection, chấp nhận được vì cả công ty chỉ vài chục tài khoản. Lên tới hàng
 * trăm thì phải lọc theo phòng ban.
 */
export async function docTatCaTaiKhoan(): Promise<HoSoTaiKhoan[]> {
  const app = await moFirebase();
  if (!app) return [];

  const { getFirestore, collection, getDocs } = await import("firebase/firestore");
  try {
    const ds = await getDocs(collection(getFirestore(app), BO_SUU_TAP_NGUOI_DUNG));
    return ds.docs
      .map((d) => d.data() as Partial<HoSoTaiKhoan>)
      .filter(hopLe)
      .filter((h) => h.dangLamViec !== false);
  } catch (e) {
    console.error("[hồ sơ] đọc danh sách hỏng:", e);
    return [];
  }
}
