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
  dangNhapBangCustomToken,
  dangXuatFirebase,
  hpcoreLoginUrl,
  layPhienSSO,
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
 * 🔴 CỐ Ý DÙNG CÔNG TẮC RÕ RÀNG, không tự đoán — máy có thể đã cấu hình Firebase nhưng
 * chưa bật SSO. Có công tắc thì việc chuyển là một quyết định có người bấm.
 *
 *   · `mau` (mặc định) — tài khoản mẫu, mật khẩu chung nằm trong mã nguồn. CHỈ dùng để
 *     xem thử giao diện trên máy chưa cấu hình Firebase.
 *   · `sso` — đăng nhập thật qua App Tổng (account.hpcore.vn). Đây là chế độ CHÍNH THỨC
 *     từ 20/08/2026 — thay hẳn cách cũ (8 tài khoản email/mật khẩu tạo tay).
 */
function docCheDo(): "mau" | "sso" {
  // ⚠️ `.trim().toLowerCase()` là bắt buộc — xem lịch sử lỗi thật ngày 12/08/2026 (biến môi
  // trường dính ký tự xuống dòng khiến app lặng lẽ chạy chế độ tài khoản mẫu).
  const gt = (process.env.NEXT_PUBLIC_XAC_THUC ?? "").trim().toLowerCase();
  // 🔴 Chấp nhận CẢ hai giá trị "sso" (tên mới) và "firebase" (tên cũ, trước khi đổi ý
  // nghĩa biến 20/08/2026) — máy nào chưa kịp cập nhật biến môi trường vẫn phải chạy đúng
  // chế độ thật, không được lặng lẽ rơi về chế độ mẫu.
  return gt === "sso" || gt === "firebase" ? "sso" : "mau";
}

const CHE_DO: "mau" | "sso" = docCheDo();

interface GiaTriNguoiDung {
  nguoiDung: NguoiDung;
  quyen: Quyen;
  /** Đã đăng nhập chưa. `null` = chưa đọc xong (đang dựng trang / đang hỏi máy chủ). */
  daDangNhap: boolean | null;
  /** Đăng nhập ở CHẾ ĐỘ MẪU — nhận tên đăng nhập mẫu, KHÔNG dùng ở chế độ `sso` (SSO tự
   *  chuyển hướng, không có biểu mẫu). Trả `null` nếu thành công. */
  dangNhapMau: (tenDangNhap: string, matKhau: string, ghiNho: boolean) => string | null;
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
   * Lý do đăng nhập ĐÚNG (App Tổng xác nhận là đúng người) mà vẫn không vào được app
   * (chưa được cấp hồ sơ, hồ sơ thiếu trường, tài khoản tạm ngưng). `null` khi không có
   * vấn đề gì.
   */
  loiHoSo: string | null;
  /** Đang chờ máy chủ trả lời trong lúc xử lý SSO — màn đăng nhập dùng để hiện spinner. */
  dangXuLySSO: boolean;
}

const Context = createContext<GiaTriNguoiDung | null>(null);

/**
 * NGƯỜI DÙNG HIỆN TẠI + ĐĂNG NHẬP.
 *
 * ⚠️ Chế độ `mau` KHÔNG PHẢI BẢO MẬT. Toàn bộ việc kiểm tra chạy trong trình duyệt, mật
 * khẩu nằm sẵn trong mã nguồn tải về máy người dùng. Nó chặn được người vào nhầm, KHÔNG
 * chặn được người cố tình.
 *
 * Chế độ `sso` mới là thật: xác thực do App Tổng (account.hpcore.vn) đảm nhiệm, app này
 * không hề biết mật khẩu của ai. Nhưng nhớ rằng xác thực chỉ là một nửa — nửa còn lại là
 * Security Rules chặn ở tầng dữ liệu (`5-ket-noi/firestore*.rules`). Thiếu nửa sau thì
 * người ta vẫn đọc thẳng được dữ liệu mà không cần mở app.
 */
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  // ---------- Chế độ tài khoản mẫu ----------
  const [uidMau, setUidMau] = useState<string>(VAI_TRO_MAC_DINH.uid);

  // ---------- Chế độ SSO ----------
  const [nguoiSSO, setNguoiSSO] = useState<NguoiDung | null>(null);
  const [danhSachMayChu, setDanhSachMayChu] = useState<NguoiDung[]>([]);
  const [dangXuLySSO, setDangXuLySSO] = useState(CHE_DO === "sso");

  // `null` = chưa biết. Phải phân biệt với `false` (đã biết, chưa đăng nhập) — gộp làm một
  // thì màn đăng nhập chớp lên một nhịp trước mắt người đã đăng nhập.
  const [daDangNhap, setDaDangNhap] = useState<boolean | null>(null);

  /**
   * Lỗi hồ sơ giữ riêng khỏi lỗi đăng nhập: đăng nhập ĐÚNG nhưng chưa được cấp quyền vào
   * app là chuyện hoàn toàn khác, và người dùng phải đọc được lý do chứ không phải nhìn
   * màn hình trống hoặc bị đá lòng vòng về màn đăng nhập App Tổng.
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
  // CHẾ ĐỘ SSO — xin Custom Token từ App Tổng rồi đọc hồ sơ riêng của app này
  // ============================================================
  useEffect(() => {
    if (CHE_DO !== "sso") return;
    let conSong = true;

    async function chay() {
      // Luôn hỏi lại cầu nối SSO mỗi lần tải trang (KHÔNG chỉ dựa vào phiên Firebase cũ
      // trong máy) — đơn giản và tránh kẹt quyền cũ: Sếp đổi vai trò bên App Tổng thì
      // trang tải lại kế tiếp phải thấy ngay, không phải chờ phiên Firebase hết hạn.
      const kq = await layPhienSSO();
      if (!conSong) return;

      if (kq.trangThai === "chua-dang-nhap-app-tong") {
        window.location.href = hpcoreLoginUrl(window.location.href);
        return; // Đang điều hướng đi — không cần đổi state gì thêm.
      }
      if (kq.trangThai === "loi") {
        setNguoiSSO(null);
        setLoiHoSo(kq.thongDiep);
        setDaDangNhap(false);
        setDangXuLySSO(false);
        return;
      }

      let firebaseUid: string;
      try {
        firebaseUid = await dangNhapBangCustomToken(kq.token);
      } catch (e) {
        if (!conSong) return;
        console.error("[SSO] đăng nhập Firebase bằng Custom Token hỏng:", e);
        setNguoiSSO(null);
        setLoiHoSo("Không đăng nhập được vào Firebase. Thử tải lại trang.");
        setDaDangNhap(false);
        setDangXuLySSO(false);
        return;
      }
      if (!conSong) return;

      const hoSoKq = await docHoSoTaiKhoan(firebaseUid, kq.vaiTroToanCuc, {
        email: kq.email,
        tenHienThi: kq.tenHienThi,
      });
      if (!conSong) return;
      if (!hoSoKq.hoSo) {
        setNguoiSSO(null);
        setLoiHoSo(hoSoKq.loi);
        setDaDangNhap(false);
        setDangXuLySSO(false);
        return;
      }
      setNguoiSSO(thanhNguoiDung(hoSoKq.hoSo));
      setLoiHoSo(null);
      setDaDangNhap(true);
      setDangXuLySSO(false);
      // Danh sách người có tài khoản — cho bảng phân bổ. Đọc SAU khi đã đăng nhập vì
      // Security Rules chặn người chưa đăng nhập.
      const ds = await docTatCaTaiKhoan();
      if (conSong) setDanhSachMayChu(ds.map(thanhNguoiDung));
    }

    void chay();
    return () => {
      conSong = false;
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

  const dangNhapMau = useCallback(
    (tenDangNhap: string, matKhau: string, ghiNho: boolean): string | null => {
      const tk = timTaiKhoan(tenDangNhap);
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
    if (CHE_DO === "sso") {
      void dangXuatFirebase().then(() => {
        // Đăng xuất Firebase của RIÊNG app này không đăng xuất App Tổng — cố ý: người vẫn
        // có thể đang dùng app khác cùng phiên hpcore.vn. Đưa về trang chủ App Tổng, không
        // đưa lại vào /login (vì có thể vẫn còn phiên hpcore hợp lệ → SSO sẽ đăng nhập lại
        // ngay tức khắc, người dùng tưởng nút "Đăng xuất" không hoạt động).
        window.location.href = "https://hpcore.vn";
      });
      return;
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
      // Chế độ SSO thì đổi vai trò là chuyện vô nghĩa — và nguy hiểm nếu lỡ để lọt.
      if (CHE_DO === "sso") return;
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
    // 🔴 Chế độ SSO: chưa đọc được hồ sơ thì là `KHONG_QUYEN` (cấp 0), TUYỆT ĐỐI KHÔNG
    // rơi về `VAI_TRO_MAC_DINH`. Mặc định đó là Trưởng bộ phận **cấp 3** — người lạ sẽ âm
    // thầm có quyền phân bổ công việc, xác nhận hoàn thành đơn và xem giá, không một dòng
    // báo lỗi. Đừng tin rằng màn chặn ở giao diện đỡ hộ: quyền được tính TRƯỚC khi màn đó
    // kịp dựng, và bất kỳ khối nào vẽ sớm hơn cũng lộ dữ liệu.
    const nguoiDung =
      CHE_DO === "sso"
        ? (nguoiSSO ?? KHONG_QUYEN)
        : (VAI_TRO_MAU.find((v) => v.uid === uidMau) ?? VAI_TRO_MAC_DINH);

    return {
      nguoiDung,
      quyen: tinhQuyen(nguoiDung),
      daDangNhap,
      dangNhapMau,
      dangXuat,
      doiVaiTro,
      cheDoThu: CHE_DO === "mau",
      danhSachTaiKhoan: CHE_DO === "sso" ? danhSachMayChu : VAI_TRO_MAU,
      loiHoSo,
      dangXuLySSO,
    };
  }, [uidMau, nguoiSSO, danhSachMayChu, daDangNhap, dangNhapMau, dangXuat, doiVaiTro, loiHoSo, dangXuLySSO]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useNguoiDung(): GiaTriNguoiDung {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useNguoiDung phải nằm trong <CurrentUserProvider>.");
  return ctx;
}

/** Chế độ xác thực đang chạy — để màn đăng nhập biết hiện biểu mẫu mẫu hay màn chờ SSO. */
export const CHE_DO_XAC_THUC = CHE_DO;
