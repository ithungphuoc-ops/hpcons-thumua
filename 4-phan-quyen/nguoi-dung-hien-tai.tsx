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
  MAT_KHAU_CHAY_THU,
  VAI_TRO_MAC_DINH,
  VAI_TRO_MAU,
  timTaiKhoan,
  tinhQuyen,
  type NguoiDung,
  type Quyen,
} from "@/4-phan-quyen/quyen";

/** Khóa lưu phiên đăng nhập trong trình duyệt. */
const KHOA_PHIEN = "hpcons-tm-phien-dang-nhap";

interface GiaTriNguoiDung {
  nguoiDung: NguoiDung;
  quyen: Quyen;
  /** Đã đăng nhập chưa. `null` = chưa đọc xong localStorage (đang dựng trang). */
  daDangNhap: boolean | null;
  /**
   * Đăng nhập bằng tên đăng nhập + mật khẩu.
   * `ghiNho` = true thì phiên sống qua lần đóng trình duyệt (localStorage),
   * false thì chỉ sống trong tab đang mở (sessionStorage) — hợp với máy dùng chung
   * ở công trường, đóng trình duyệt là tự thoát.
   * Trả về `null` nếu thành công, hoặc câu báo lỗi để hiện lên màn hình.
   */
  dangNhap: (tenDangNhap: string, matKhau: string, ghiNho: boolean) => string | null;
  dangXuat: () => void;
  /** Đổi vai trò — chỉ có tác dụng ở chế độ chạy thử (chưa nối Firebase Auth). */
  doiVaiTro: (uid: string) => void;
  /** true khi đang chạy bằng tài khoản mẫu. */
  cheDoThu: boolean;
}

const Context = createContext<GiaTriNguoiDung | null>(null);

/**
 * NGƯỜI DÙNG HIỆN TẠI + ĐĂNG NHẬP.
 *
 * Chế độ chạy thử: chưa nối Firebase Auth nên xác thực bằng danh sách tài khoản mẫu
 * trong `quyen.ts`. Phiên lưu ở `localStorage` để tải lại trang không phải đăng nhập lại.
 *
 * 🔴 ĐÂY KHÔNG PHẢI BẢO MẬT THẬT. Toàn bộ việc kiểm tra chạy trong trình duyệt, mật khẩu
 * nằm sẵn trong mã nguồn tải về máy người dùng. Nó chặn được người vào nhầm, KHÔNG chặn
 * được người cố tình. Bảo mật thật cần hai thứ phía máy chủ:
 *   1. Firebase Authentication — xác minh danh tính
 *   2. Firestore Security Rules — chặn đọc/ghi dữ liệu (xem `5-ket-noi/firestore.rules`)
 *
 * Khi nối Firebase thật: thay `dangNhap` bằng `signInWithEmailAndPassword`, đọc
 * `users/{uid}` + custom claims `apps.tm` từ project `hpcons-portal`.
 * **Giao diện không phải sửa** — mọi màn hình chỉ hỏi `quyen`, không tự suy cấp bậc.
 */
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [uid, setUid] = useState<string>(VAI_TRO_MAC_DINH.uid);
  // `null` = chưa đọc xong localStorage. Phải phân biệt với `false` (đã đọc, chưa đăng
  // nhập) — nếu gộp làm một thì màn đăng nhập sẽ chớp lên một nhịp ở người đã đăng nhập.
  const [daDangNhap, setDaDangNhap] = useState<boolean | null>(null);

  // Đọc phiên cũ khi mở trang. Chạy trong useEffect vì localStorage chỉ có ở trình duyệt,
  // đọc lúc dựng trang sẽ vỡ khi Next.js sinh trang tĩnh lúc build.
  //
  // Đọc CẢ HAI kho: `sessionStorage` (không tick "Duy trì đăng nhập" — chỉ sống trong
  // tab đang mở) và `localStorage` (có tick — sống qua lần đóng trình duyệt).
  useEffect(() => {
    try {
      const luu =
        window.sessionStorage.getItem(KHOA_PHIEN) ?? window.localStorage.getItem(KHOA_PHIEN);
      if (luu && VAI_TRO_MAU.some((v) => v.uid === luu)) {
        setUid(luu);
        setDaDangNhap(true);
        return;
      }
    } catch {
      // Trình duyệt chặn bộ nhớ cục bộ (chế độ riêng tư) — coi như chưa đăng nhập.
    }
    setDaDangNhap(false);
  }, []);

  /** Ghi phiên vào đúng kho theo lựa chọn "Duy trì đăng nhập". */
  const luuPhien = useCallback((uidLuu: string, ghiNho: boolean) => {
    try {
      // Xóa ở kho kia trước, tránh còn sót phiên cũ gây lẫn lộn khi đổi lựa chọn.
      window.localStorage.removeItem(KHOA_PHIEN);
      window.sessionStorage.removeItem(KHOA_PHIEN);
      const kho = ghiNho ? window.localStorage : window.sessionStorage;
      kho.setItem(KHOA_PHIEN, uidLuu);
    } catch {
      // Không lưu được thì vẫn cho vào, chỉ là tải lại trang phải đăng nhập lại.
    }
  }, []);

  const dangNhap = useCallback(
    (tenDangNhap: string, matKhau: string, ghiNho: boolean) => {
      const tk = timTaiKhoan(tenDangNhap);
      // Báo lỗi CHUNG cho cả hai trường hợp sai tên và sai mật khẩu — nói rõ
      // "tên này không tồn tại" là chỉ điểm cho người dò tài khoản.
      if (!tk || matKhau !== MAT_KHAU_CHAY_THU) {
        return "Tên đăng nhập hoặc mật khẩu không đúng.";
      }
      setUid(tk.uid);
      setDaDangNhap(true);
      luuPhien(tk.uid, ghiNho);
      return null;
    },
    [luuPhien],
  );

  const dangXuat = useCallback(() => {
    setDaDangNhap(false);
    setUid(VAI_TRO_MAC_DINH.uid);
    try {
      window.localStorage.removeItem(KHOA_PHIEN);
      window.sessionStorage.removeItem(KHOA_PHIEN);
    } catch {
      // Bỏ qua — trạng thái trong bộ nhớ đã bị xóa nên vẫn coi như đã đăng xuất.
    }
  }, []);

  const doiVaiTro = useCallback(
    (uidMoi: string) => {
      setUid(uidMoi);
      // Giữ nguyên kho đang dùng: nếu phiên nằm ở localStorage thì ghi tiếp vào đó.
      let dangGhiNho = false;
      try {
        dangGhiNho = window.localStorage.getItem(KHOA_PHIEN) !== null;
      } catch {
        // Bỏ qua.
      }
      luuPhien(uidMoi, dangGhiNho);
    },
    [luuPhien],
  );

  const value = useMemo<GiaTriNguoiDung>(() => {
    const nguoiDung = VAI_TRO_MAU.find((v) => v.uid === uid) ?? VAI_TRO_MAC_DINH;
    return {
      nguoiDung,
      quyen: tinhQuyen(nguoiDung),
      daDangNhap,
      dangNhap,
      dangXuat,
      doiVaiTro,
      cheDoThu: true,
    };
  }, [uid, daDangNhap, dangNhap, dangXuat, doiVaiTro]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useNguoiDung(): GiaTriNguoiDung {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useNguoiDung phải nằm trong <CurrentUserProvider>.");
  return ctx;
}
