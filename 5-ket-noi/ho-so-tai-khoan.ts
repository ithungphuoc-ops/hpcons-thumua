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
// 📌 20/08/2026 — ĐÃ NỐI APP TỔNG (SSO): `docHoSoTaiKhoan` giờ nhận thêm vai trò toàn cục
// (`users/{uid}.role` của account.hpcore.vn). CHỈ MỘT trường hợp đặc biệt: `"owner"` được
// toàn quyền ngay, không cần hồ sơ `nguoi-dung/{uid}` nào — xem khối "OWNER TOÀN QUYỀN"
// bên dưới. Mọi vai trò toàn cục khác (`admin`/`manager`/`employee`) KHÔNG có gì đặc biệt,
// vẫn phải có hồ sơ riêng ở app này như trước — phần còn lại của app KHÔNG phải sửa, vì
// mọi màn hình chỉ hỏi `quyen`.
// ============================================================

import { moFirebase } from "@/5-ket-noi/firebase-chung";
import { layIdTokenHienTai } from "@/5-ket-noi/xac-thuc-firebase";
import { VAI_TRO_CHUAN } from "@/4-phan-quyen/vai-tro-chuan";
import type {
  CapQuyen,
  ChucNang,
  ChucVu,
  NguoiDung,
  VaiTroHeThong,
  VaiTroToanCucAppTong,
} from "@/4-phan-quyen/quyen";

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
  /**
   * Bậc quản lý trong bộ phận — quyết định duyệt được cấp nào.
   * Trống = nhân viên. Xem `ChucVu` trong `4-phan-quyen/quyen.ts`.
   */
  chucVu?: ChucVu;
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
    chucVu: h.chucVu,
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
/** Xuất công khai để API route (`app/api/phan-quyen`) tự kiểm hồ sơ đọc bằng Admin SDK — cùng
 *  một luật kiểm, không viết lại lần hai để tránh hai nơi lệch nhau. */
export function hopLe(d: Partial<HoSoTaiKhoan> | undefined): d is HoSoTaiKhoan {
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
 *
 * ============================================================
 * OWNER TOÀN QUYỀN — Ban lãnh đạo 20/08/2026: *"owner là quyền được vào app toàn quyền"*.
 *
 * `vaiTroToanCuc === "owner"` (App Tổng) → trả thẳng hồ sơ Quản trị (`VAI_TRO_CHUAN` mã
 * `quan_tri`), KHÔNG đọc `nguoi-dung/{uid}` — owner toàn quyền BẤT KỂ có hồ sơ riêng ở app
 * này hay không, đúng quy ước chung toàn hệ sinh thái HPcore (owner luôn full quyền app
 * con). Đây là NGOẠI LỆ DUY NHẤT — `admin`/`manager`/`employee` không có gì đặc biệt, vẫn
 * rơi xuống nhánh đọc `nguoi-dung/{uid}` như cũ, chờ Sếp gán vai trò cụ thể sau.
 * ============================================================
 */
export async function docHoSoTaiKhoan(
  firebaseUid: string,
  vaiTroToanCuc: VaiTroToanCucAppTong | null,
  thongTinSSO?: { email: string; tenHienThi: string },
): Promise<KetQuaHoSo> {
  if (vaiTroToanCuc === "owner") {
    const quanTri = VAI_TRO_CHUAN.find((v) => v.ma === "quan_tri")!;
    return {
      hoSo: {
        uidNghiepVu: firebaseUid,
        email: thongTinSSO?.email ?? "",
        tenHienThi: thongTinSSO?.tenHienThi || thongTinSSO?.email || "Chủ sở hữu hệ thống",
        chucDanh: "Chủ sở hữu hệ thống (App Tổng)",
        phongBan: "—",
        chucNang: quanTri.chucNang,
        vaiTro: quanTri.vaiTro,
        capTM: quanTri.capTM,
        capKho: quanTri.capKho,
        dangLamViec: true,
      },
      loi: null,
    };
  }

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
/** Một hồ sơ kèm MÃ FIREBASE của nó — mã đó chính là id tài liệu, cần để ghi lại. */
export interface HoSoKemMa {
  /** Mã Firebase = id tài liệu `nguoi-dung/{firebaseUid}`. */
  firebaseUid: string;
  hoSo: HoSoTaiKhoan;
}

/**
 * Đọc TOÀN BỘ hồ sơ cho MÀN PHÂN QUYỀN — khác `docTatCaTaiKhoan` ở hai điểm quan trọng.
 *
 * 🔴 ① GIỮ CẢ NGƯỜI ĐANG TẠM NGƯNG (`dangLamViec === false`). Hàm kia lọc họ ra vì nó phục vụ
 * bảng phân bổ — giao việc cho người đã nghỉ là việc treo. Nhưng màn phân quyền thì ngược lại:
 * lọc mất người tạm ngưng là **không còn đường nào bật họ trở lại**, phải nhờ khóa Admin SDK.
 *
 * 🔴 ② TRẢ KÈM `firebaseUid`. `data()` không chứa id tài liệu, mà id đó chính là khóa để ghi.
 * Thiếu nó thì đọc được danh sách nhưng không sửa được ai — lỗi chỉ lộ ra lúc bấm Lưu.
 */
export async function docHoSoDePhanQuyen(): Promise<HoSoKemMa[]> {
  const app = await moFirebase();
  if (!app) return [];

  const { getFirestore, collection, getDocs } = await import("firebase/firestore");
  try {
    const ds = await getDocs(collection(getFirestore(app), BO_SUU_TAP_NGUOI_DUNG));
    return ds.docs
      .map((d) => ({ firebaseUid: d.id, hoSo: d.data() as Partial<HoSoTaiKhoan> }))
      .filter((x): x is HoSoKemMa => hopLe(x.hoSo));
  } catch (e) {
    console.error("[hồ sơ] đọc danh sách phân quyền hỏng:", e);
    return [];
  }
}

/** Kết quả ghi: `null` là xong, có chuỗi là LÝ DO hỏng để hiện thẳng cho người dùng. */
export type LoiGhiHoSo = string | null;

/**
 * Gán một VAI TRÒ ĐÓNG GÓI (mã trong `4-phan-quyen/vai-tro-chuan.ts`) cho một người, qua API
 * route `app/api/phan-quyen` — route đó tự kiểm đủ luật rồi ghi bằng Admin SDK.
 *
 * 📌 20/08/2026 — Ban lãnh đạo: *"thiết lập phân quyền trực tiếp trên app luôn... không cần
 * làm ngoài app tổng"*. TRƯỚC ĐÓ hàm này gọi thẳng `updateDoc` từ trình duyệt và luôn bị chặn
 * (`allow write: if false`) — đã đổi hẳn sang gọi API, không còn đường ghi trực tiếp nào nữa.
 *
 * Dùng CHUNG cho cả "thêm người dùng mới" lẫn "đổi vai trò người đã có hồ sơ" — cùng một API,
 * cùng một luật kiểm, không có hai đường ghi lệch nhau.
 */
export async function ganVaiTro(firebaseUid: string, maVaiTro: string): Promise<LoiGhiHoSo> {
  const token = await layIdTokenHienTai();
  if (!token) return "Chưa đăng nhập, hoặc phiên đăng nhập đã hết hạn. Tải lại trang rồi thử lại.";

  try {
    const res = await fetch("/api/phan-quyen", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetUid: firebaseUid, maVaiTro }),
    });
    const kq = await res.json().catch(() => ({}));
    if (!res.ok) return kq.error || `Không gán được quyền (mã ${res.status}).`;
    return null;
  } catch (e) {
    console.error("[hồ sơ] gọi API phân quyền hỏng:", e);
    return "Không kết nối được máy chủ. Kiểm tra lại mạng rồi thử lại.";
  }
}

/** Một người trong danh bạ công ty (App Tổng) — dùng để chọn người "thêm quyền mới". */
export interface ThanhVienDanhBa {
  uid: string;
  hoTen: string;
  email: string;
  phongBan: string;
  chucDanh: string;
  daCoHoSoThuMua: boolean;
}

/**
 * Đọc danh bạ TOÀN CÔNG TY từ App Tổng (qua API `/api/directory`, tự đọc `users`/`departments`
 * bằng Admin SDK phía máy chủ) — để màn "Phân quyền người dùng" chọn người thêm quyền, không
 * cần biết trước mã Firebase của họ.
 */
export async function docDanhBaCongTy(): Promise<ThanhVienDanhBa[]> {
  const token = await layIdTokenHienTai();
  if (!token) return [];
  try {
    const res = await fetch("/api/directory", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const body = await res.json();
    return (body.danhBa ?? []) as ThanhVienDanhBa[];
  } catch (e) {
    console.error("[hồ sơ] đọc danh bạ công ty hỏng:", e);
    return [];
  }
}

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
