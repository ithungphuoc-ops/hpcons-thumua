"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  KHONG_QUYEN,
  MAT_KHAU_CHAY_THU,
  VAI_TRO_MAC_DINH,
  VAI_TRO_MAU,
  timTaiKhoan,
  tinhQuyen,
  type NguoiDung,
  type Quyen,
} from "@/4-phan-quyen/quyen";
import {
  dangNhapEmail,
  dangXuatFirebase,
  theoDoiPhien,
  type NguoiDaDangNhap,
} from "@/5-ket-noi/xac-thuc-firebase";
import {
  docHoSoTaiKhoan,
  docTatCaTaiKhoan,
  thanhNguoiDung,
} from "@/5-ket-noi/ho-so-tai-khoan";

/** Khóa lưu phiên đăng nhập trong trình duyệt — CHỈ dùng ở chế độ tài khoản mẫu. */
const KHOA_PHIEN = "hpcons-tm-phien-dang-nhap";

/**
 * HAI CHẾ ĐỘ ĐĂNG NHẬP, chọn bằng biến môi trường `NEXT_PUBLIC_XAC_THUC`.
 *
 * 🔴 CỐ Ý DÙNG CÔNG TẮC RÕ RÀNG, không tự đoán. App có thể đã cấu hình Firebase nhưng
 * Authentication chưa được bật, hoặc đã bật mà chưa kịp tạo tài khoản cho ai. Nếu app tự
 * "phát hiện rồi chuyển chế độ" thì có lúc **cả phòng bị khóa ngoài app** giữa buổi chạy
 * thử mà không ai hiểu vì sao. Có công tắc thì việc chuyển là một quyết định có người bấm,
 * và bấm ngược lại được ngay.
 *
 *   · `mau`      (mặc định) — tài khoản mẫu, mật khẩu chung nằm trong mã nguồn
 *   · `firebase` — tài khoản thật, mật khẩu do máy chủ Google giữ
 *
 * Thứ tự chuyển sang `firebase`, làm sai thứ tự là khóa người dùng ngoài app:
 *   ① Bật Authentication → Email/Password trong Firebase Console
 *   ② Tạo tài khoản + hồ sơ `nguoi-dung/{uid}` cho TỪNG người
 *   ③ Mới đặt `NEXT_PUBLIC_XAC_THUC=firebase` rồi deploy
 */
const CHE_DO: "mau" | "firebase" =
  process.env.NEXT_PUBLIC_XAC_THUC === "firebase" ? "firebase" : "mau";

interface GiaTriNguoiDung {
  nguoiDung: NguoiDung;
  quyen: Quyen;
  /** Đã đăng nhập chưa. `null` = chưa đọc xong (đang dựng trang / đang hỏi máy chủ). */
  daDangNhap: boolean | null;
  /**
   * Đăng nhập. Chế độ `mau` nhận tên đăng nhập, chế độ `firebase` nhận email.
   * `ghiNho` = true thì phiên sống qua lần đóng trình duyệt, false thì chỉ sống trong tab
   * đang mở — hợp với máy dùng chung ở công trường, đóng trình duyệt là tự thoát.
   * Trả `null` nếu thành công, hoặc câu báo lỗi để hiện lên màn hình.
   */
  dangNhap: (tenHoacEmail: string, matKhau: string, ghiNho: boolean) => Promise<string | null>;
  dangXuat: () => void;
  /** Đổi vai trò — CHỈ có tác dụng ở chế độ tài khoản mẫu. */
  doiVaiTro: (uid: string) => void;
  /** true khi đang chạy bằng tài khoản mẫu (mật khẩu chung nằm trong mã nguồn). */
  cheDoThu: boolean;
  /**
   * Mọi người CÓ TÀI KHOẢN ĐĂNG NHẬP ĐƯỢC.
   *
   * 🔴 Bảng phân bổ phải lấy từ đây, đừng lấy từ danh bạ nhân sự: danh bạ có cả người
   * không có tài khoản, phân bổ cho họ là việc treo vĩnh viễn — không ai nhận công tác,
   * không ai lập được đơn, và dòng đó biến mất khỏi lịch của mọi người.
   */
  danhSachTaiKhoan: NguoiDung[];
  /**
   * Lý do đăng nhập ĐÚNG mật khẩu mà vẫn không vào được app (chưa được cấp hồ sơ, hồ sơ
   * thiếu trường, tài khoản tạm ngưng). `null` khi không có vấn đề gì.
   *
   * 🔴 Tách hẳn khỏi lỗi sai mật khẩu. Gộp làm một thì người bị thiếu hồ sơ nhận câu
   * "sai mật khẩu" và sẽ gõ lại mật khẩu đúng đó hàng chục lần — tới khi Firebase khóa
   * tạm tài khoản vì thử quá nhiều.
   */
  loiHoSo: string | null;
}

const Context = createContext<GiaTriNguoiDung | null>(null);

/**
 * NGƯỜI DÙNG HIỆN TẠI + ĐĂNG NHẬP.
 *
 * ⚠️ Chế độ `mau` KHÔNG PHẢI BẢO MẬT. Toàn bộ việc kiểm tra chạy trong trình duyệt, mật
 * khẩu nằm sẵn trong mã nguồn tải về máy người dùng. Nó chặn được người vào nhầm, KHÔNG
 * chặn được người cố tình.
 *
 * Chế độ `firebase` mới là thật: mật khẩu do máy chủ Google giữ, app không hề biết mật
 * khẩu của ai. Nhưng nhớ rằng xác thực chỉ là một nửa — nửa còn lại là Security Rules
 * chặn ở tầng dữ liệu (`5-ket-noi/firestore*.rules`). Thiếu nửa sau thì người ta vẫn đọc
 * thẳng được dữ liệu mà không cần mở app.
 */
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  // ---------- Chế độ tài khoản mẫu ----------
  const [uidMau, setUidMau] = useState<string>(VAI_TRO_MAC_DINH.uid);

  // ---------- Chế độ Firebase ----------
  const [nguoiFirebase, setNguoiFirebase] = useState<NguoiDung | null>(null);
  const [danhSachMayChu, setDanhSachMayChu] = useState<NguoiDung[]>([]);

  // `null` = chưa biết. Phải phân biệt với `false` (đã biết, chưa đăng nhập) — gộp làm một
  // thì màn đăng nhập chớp lên một nhịp trước mắt người đã đăng nhập.
  const [daDangNhap, setDaDangNhap] = useState<boolean | null>(null);

  /**
   * Lỗi hồ sơ giữ riêng khỏi lỗi đăng nhập: đăng nhập ĐÚNG mật khẩu nhưng chưa được cấp
   * quyền vào app là chuyện hoàn toàn khác, và người dùng phải đọc được lý do chứ không
   * phải nhìn màn hình trống.
   */
  const [loiHoSo, setLoiHoSo] = useState<string | null>(null);

  // ============================================================
  // CHẾ ĐỘ TÀI KHOẢN MẪU — đọc phiên cũ trong máy
  // ============================================================
  useEffect(() => {
    if (CHE_DO !== "mau") return;
    try {
      // Đọc CẢ HAI kho: `sessionStorage` (không tick "Duy trì đăng nhập") và
      // `localStorage` (có tick — sống qua lần đóng trình duyệt).
      const luu =
        window.sessionStorage.getItem(KHOA_PHIEN) ?? window.localStorage.getItem(KHOA_PHIEN);
      if (luu && VAI_TRO_MAU.some((v) => v.uid === luu)) {
        setUidMau(luu);
        setDaDangNhap(true);
        return;
      }
    } catch {
      // Trình duyệt chặn bộ nhớ cục bộ (chế độ riêng tư) — coi như chưa đăng nhập.
    }
    setDaDangNhap(false);
  }, []);

  // ============================================================
  // CHẾ ĐỘ FIREBASE — theo dõi phiên do máy chủ giữ
  // ============================================================
  useEffect(() => {
    if (CHE_DO !== "firebase") return;
    let conSong = true;
    let ngung: (() => void) | null = null;

    async function xuLy(u: NguoiDaDangNhap | null) {
      if (!conSong) return;
      if (!u) {
        setNguoiFirebase(null);
        setLoiHoSo(null);
        setDaDangNhap(false);
        return;
      }
      // Đăng nhập được rồi vẫn phải đọc hồ sơ: Firebase chỉ biết "người này là ai",
      // không biết họ là trưởng bộ phận hay thủ kho, cấp mấy.
      const kq = await docHoSoTaiKhoan(u.firebaseUid);
      if (!conSong) return;
      if (!kq.hoSo) {
        setNguoiFirebase(null);
        setLoiHoSo(kq.loi);
        setDaDangNhap(false);
        return;
      }
      setNguoiFirebase(thanhNguoiDung(kq.hoSo));
      setLoiHoSo(null);
      setDaDangNhap(true);
      // Danh sách người có tài khoản — cho bảng phân bổ. Đọc SAU khi đã đăng nhập vì
      // Security Rules chặn người chưa đăng nhập.
      const ds = await docTatCaTaiKhoan();
      if (conSong) setDanhSachMayChu(ds.map(thanhNguoiDung));
    }

    void theoDoiPhien(xuLy).then((huy) => {
      if (!conSong) {
        huy?.();
        return;
      }
      ngung = huy;
      // `null` = chưa cấu hình Firebase mà lại đang ở chế độ firebase → hỏng cấu hình.
      // Nói ra thay vì để người dùng ngồi nhìn màn hình chờ mãi.
      if (!huy) {
        setLoiHoSo(
          "App đang đặt chế độ đăng nhập bằng Firebase nhưng thiếu cấu hình kết nối. Báo phòng IT.",
        );
        setDaDangNhap(false);
      }
    });

    return () => {
      conSong = false;
      ngung?.();
    };
  }, []);

  const luuPhienMau = useCallback((uidLuu: string, ghiNho: boolean) => {
    try {
      // Xóa ở kho kia trước, tránh còn sót phiên cũ gây lẫn lộn khi đổi lựa chọn.
      window.localStorage.removeItem(KHOA_PHIEN);
      window.sessionStorage.removeItem(KHOA_PHIEN);
      (ghiNho ? window.localStorage : window.sessionStorage).setItem(KHOA_PHIEN, uidLuu);
    } catch {
      // Không lưu được thì vẫn cho vào, chỉ là tải lại trang phải đăng nhập lại.
    }
  }, []);

  const dangNhap = useCallback(
    async (tenHoacEmail: string, matKhau: string, ghiNho: boolean): Promise<string | null> => {
      if (CHE_DO === "firebase") {
        const kq = await dangNhapEmail(tenHoacEmail, matKhau, ghiNho);
        // Thành công thì KHÔNG đặt state ở đây — `theoDoiPhien` sẽ bắn và lo phần đó.
        // Đặt hai nơi là có lúc lệch nhau, và lệch ở đúng chỗ phân quyền thì rất khó lần.
        return kq.loi;
      }

      const tk = timTaiKhoan(tenHoacEmail);
      // Báo lỗi CHUNG cho cả sai tên lẫn sai mật khẩu — nói rõ "tên này không tồn tại"
      // là chỉ điểm cho người dò tài khoản.
      if (!tk || matKhau !== MAT_KHAU_CHAY_THU) {
        return "Tên đăng nhập hoặc mật khẩu không đúng.";
      }
      setUidMau(tk.uid);
      setDaDangNhap(true);
      luuPhienMau(tk.uid, ghiNho);
      return null;
    },
    [luuPhienMau],
  );

  const dangXuat = useCallback(() => {
    if (CHE_DO === "firebase") {
      void dangXuatFirebase();
      return; // `theoDoiPhien` sẽ bắn và dọn state.
    }
    setDaDangNhap(false);
    setUidMau(VAI_TRO_MAC_DINH.uid);
    try {
      window.localStorage.removeItem(KHOA_PHIEN);
      window.sessionStorage.removeItem(KHOA_PHIEN);
    } catch {
      // Bỏ qua — trạng thái trong bộ nhớ đã xóa nên vẫn coi như đã đăng xuất.
    }
  }, []);

  const doiVaiTro = useCallback(
    (uidMoi: string) => {
      // Chế độ thật thì đổi vai trò là chuyện vô nghĩa — và nguy hiểm nếu lỡ để lọt.
      if (CHE_DO === "firebase") return;
      setUidMau(uidMoi);
      // Giữ nguyên kho đang dùng: phiên ở localStorage thì ghi tiếp vào đó.
      let dangGhiNho = false;
      try {
        dangGhiNho = window.localStorage.getItem(KHOA_PHIEN) !== null;
      } catch {
        // Bỏ qua.
      }
      luuPhienMau(uidMoi, dangGhiNho);
    },
    [luuPhienMau],
  );

  const value = useMemo<GiaTriNguoiDung>(() => {
    // 🔴 Chế độ thật: chưa đọc được hồ sơ thì là `KHONG_QUYEN` (cấp 0), TUYỆT ĐỐI KHÔNG
    // rơi về `VAI_TRO_MAC_DINH`. Mặc định đó là Trưởng bộ phận **cấp 3** — người lạ sẽ âm
    // thầm có quyền phân bổ công việc, xác nhận hoàn thành đơn và xem giá, không một dòng
    // báo lỗi. Đừng tin rằng màn chặn ở giao diện đỡ hộ: quyền được tính TRƯỚC khi màn đó
    // kịp dựng, và bất kỳ khối nào vẽ sớm hơn cũng lộ dữ liệu.
    const nguoiDung =
      CHE_DO === "firebase"
        ? (nguoiFirebase ?? KHONG_QUYEN)
        : (VAI_TRO_MAU.find((v) => v.uid === uidMau) ?? VAI_TRO_MAC_DINH);

    return {
      nguoiDung,
      quyen: tinhQuyen(nguoiDung),
      daDangNhap,
      dangNhap,
      dangXuat,
      doiVaiTro,
      cheDoThu: CHE_DO === "mau",
      danhSachTaiKhoan: CHE_DO === "firebase" ? danhSachMayChu : VAI_TRO_MAU,
      loiHoSo,
    };
  }, [uidMau, nguoiFirebase, danhSachMayChu, daDangNhap, dangNhap, dangXuat, doiVaiTro, loiHoSo]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useNguoiDung(): GiaTriNguoiDung {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useNguoiDung phải nằm trong <CurrentUserProvider>.");
  return ctx;
}

/** Chế độ xác thực đang chạy — để màn đăng nhập biết hỏi email hay tên đăng nhập. */
export const CHE_DO_XAC_THUC = CHE_DO;
