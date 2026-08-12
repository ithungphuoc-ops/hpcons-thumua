"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
// Chỉ dùng để SUY RA giai đoạn khi phát thông báo chuyển bước — import type-only
// chiều ngược lại nên không tạo vòng phụ thuộc runtime.
import {
  NHAN_GIAI_DOAN,
  nguoiCanXuLy,
  xacDinhGiaiDoan,
  type GiaiDoanMuaHang,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import { thoiDiemHienTai } from "@/6-tien-ich/dinh-dang";
import { tenTheoUid } from "@/3-du-lieu/danh-ba-nhan-su";
import {
  DE_NGHI_MAU,
  DON_HANG_MAU,
  GIA_DON_HANG_MAU,
  ID_BAO_GIA_GIA_LAP,
  ID_DE_NGHI_GIA_LAP,
  ID_DON_HANG_GIA_LAP,
  NHA_CUNG_CAP,
  PHIEU_NHAN_MAU,
  BAO_GIA_MAU,
  CONG_NO_MAU,
} from "@/3-du-lieu/du-lieu-mau";
import {
  docDuLieuDaLuu,
  ghiDuLieu,
  xoaDuLieuDaLuu,
  type DuLieuLuu,
} from "@/3-du-lieu/luu-tren-may";
import { noiKhoChung, type KetNoiKhoChung } from "@/3-du-lieu/kho-chung-firestore";
import type {
  DeNghiMuaHang,
  DongDeNghi,
  DongNhanHang,
  DonDatHang,
  GiaDonDatHang,
  NguoiTheoDoi,
  NhaCungCap,
  PhanBoNCC,
  PhieuNhanHang,
  ThongBaoChuyenBuoc,
  TrangThaiBaoGia,
  TruongBoSung,
  XacNhan,
  BaoGia,
  CongNo,
  TepBaoGiaNCC,
  MoTaTep,
} from "@/3-du-lieu/kieu-du-lieu";

/**
 * Yêu cầu trưởng bộ phận đặt ra khi giao việc (Ban lãnh đạo 12/08/2026:
 * *"phải hiện cửa sổ xác nhận... và được viết thêm ghi chú yêu cầu số lượng báo giá"*).
 */
export interface YeuCauPhanBo {
  /** Số báo giá tối thiểu phải lấy về. Trống = cứ theo ngưỡng giá trị của quy trình. */
  soBaoGia?: number;
  /** Lời dặn thêm cho người nhận việc. */
  ghiChu?: string;
}

/** Dữ liệu người dùng nhập ở màn giả lập. Mã và STT do kho dữ liệu tự sinh. */
export interface DauVaoDeNghiGiaLap {
  maDuAn: string;
  maHopDongCDT?: string;
  tenCongTrinh: string;
  tieuDe: string;
  nguoiDeNghiTen: string;
  ngayDeNghi: string;
  ngayDuyet: string;
  ngayCanHang: string;
  mucDoUuTien: "binh_thuong" | "gap";
  items: Omit<DongDeNghi, "stt">[];
  /** Người theo dõi chọn sẵn lúc lập phiếu (mục "Người theo dõi" trên phiếu đề nghị).
   *  Người đề nghị luôn được thêm tự động, không cần khai ở đây. */
  nguoiTheoDoi?: Pick<NguoiTheoDoi, "uid" | "ten" | "chucDanh">[];
}

/**
 * Dữ liệu lập một đơn mua hàng mới.
 *
 * 🔴 Cố ý tách làm hai phần vì chúng đi về HAI CHỨNG TỪ khác nhau:
 *  - phần còn lại → `tm_donhang` (mọi vai trò liên quan đọc được)
 *  - `donGia` + `phanTien` → `tm_donhang_gia` (chỉ vai trò được xem giá)
 */
export type DauVaoDonHangMoi = Omit<DonDatHang, "id" | "code" | "trangThai"> & {
  /** Đơn giá theo số thứ tự dòng PO. */
  donGia: Record<number, number>;
  /** Chiết khấu · thuế suất · loại tiền · điều khoản thanh toán — theo mẫu Excel công ty. */
  phanTien?: Pick<
    GiaDonDatHang,
    "loaiTien" | "chietKhau" | "thueSuatGTGT" | "dieuKhoanThanhToan"
  >;
};

/** Ngày (không giờ) — dùng cho các mốc NGHIỆP VỤ như ngày lập PO, ngày nhận hàng. */
const homNay = () => new Date().toISOString().slice(0, 10);

/**
 * 🔴 NHẬT KÝ DÙNG `thoiDiemHienTai()` CHỨ KHÔNG DÙNG `homNay()`
 * (chỉ đạo Ban lãnh đạo 10/08/2026: "phải ghi rõ ngày giờ cụ thể khi có chỉnh sửa").
 *
 * Chỉ ghi ngày thì trong cùng một ngày không biết việc nào xảy ra trước — mà nhật ký
 * sinh ra chính là để truy được thứ tự thao tác. Lưu ISO đầy đủ, hiển thị quy về
 * giờ Việt Nam bằng `formatDateTime` (xem `6-tien-ich/dinh-dang.ts`).
 */

interface GiaTriDuLieu {
  deNghi: DeNghiMuaHang[];
  donHang: DonDatHang[];
  /** ⚠️ Ở bản thật, mảng này chỉ tải được nếu quyền cho phép (collection tm_donhang_gia). */
  giaDonHang: GiaDonDatHang[];
  phieuNhan: PhieuNhanHang[];
  nhaCungCap: NhaCungCap[];
  baoGia: BaoGia[];
  congNo: CongNo[];

  // --- Thao tác ---
  // ⚠️ NHẬT KÝ CHỈNH SỬA (yêu cầu Ban lãnh đạo 07/08/2026): mọi thao tác ghi dữ liệu
  // đều thêm một dòng "ai làm · làm gì · lúc nào" vào `lichSu` của đề nghị liên quan.
  // Hiển thị ở khối "Lịch sử" trang chi tiết đề nghị.
  /**
   * GIẢ LẬP nhận một đề nghị đã duyệt từ Phòng Thi công.
   * Trả về id đề nghị vừa nhận, hoặc chuỗi rỗng nếu đã hết id dự phòng.
   *
   * ⚠️ Ở bản thật KHÔNG có hàm này — đề nghị do Phòng Thi công lập trên HPcore,
   * app Thu mua chỉ đọc. Xem `1-giao-dien/trang/de-nghi-nhan-moi.tsx`.
   */
  themDeNghiGiaLap: (dauVao: DauVaoDeNghiGiaLap) => string;
  phanBoDong: (
    prId: string,
    sttDong: number[],
    nguoiPhuTrachUid: string,
    nguoiPhanBoTen: string,
    yeuCau?: YeuCauPhanBo,
  ) => void;
  boPhanBoDong: (prId: string, sttDong: number, nguoiThucHien: string) => void;
  /** Lập PO mới từ các dòng đề nghị. Trả về id PO vừa tạo. */
  themDonHang: (dauVao: DauVaoDonHangMoi) => string;
  themPhieuNhan: (phieu: Omit<PhieuNhanHang, "id" | "code" | "lanGiaoThu">) => void;
  doiTrangThaiPhieu: (
    phieuId: string,
    trangThai: PhieuNhanHang["trangThai"],
    nguoiThucHien?: string,
  ) => void;
  /** Đính kèm / thay phiếu giao nhận cho một phiếu nhận hàng đã ghi. */
  dinhKemPhieuGiao: (phieuId: string, tep: MoTaTep, nguoiThucHien: string) => void;
  xacNhanKho: (poId: string, nguoi: XacNhan) => void;
  xacNhanTruongBP: (poId: string, nguoi: XacNhan) => void;
  /** Kéo thả ① Tiếp nhận → ② Yêu cầu báo giá: tạo bảng báo giá đang thu thập cho đề nghị. */
  taoBaoGiaGiaLap: (prId: string, nguoiThucHien: string) => string | null;
  /** Kéo thả ② → ③: chuyển mọi bảng báo giá của đề nghị từ trạng thái `tu` sang `sang`. */
  doiTrangThaiBaoGiaTheoDeNghi: (
    prId: string,
    tu: TrangThaiBaoGia,
    sang: TrangThaiBaoGia,
    nguoiThucHien: string,
  ) => void;
  /** Bước ③ → ④: chốt nhà cung cấp cho một bảng báo giá đã so sánh. */
  chonNCCChoBaoGia: (bgId: string, nccId: string, tenNCC: string, nguoiThucHien: string) => void;
  /**
   * TÁCH BÁO GIÁ: lưu phân bổ khối lượng từng dòng cho nhiều nhà cung cấp.
   * Khóa của `phanBoTheoDong` là `DongBaoGia.id`.
   */
  /** Bước ② — nhân viên nhập giá của một nhà cung cấp vào bảng báo giá. */
  nhapGiaNCC: (
    bgId: string,
    ncc: { nccId: string; tenNCC: string },
    giaTheoDong: Record<string, { donGia: number; thoiGianGiao: number }>,
    nguoiThucHien: string,
  ) => void;
  /** Bước ② — tải lên bản báo giá gốc nhà cung cấp gửi về. */
  dinhKemBaoGia: (bgId: string, tep: TepBaoGiaNCC, nguoiThucHien: string) => void;
  /** Bước ② → ③ — nhân viên trình trưởng bộ phận xem xét. */
  trinhXetDuyetBaoGia: (bgId: string, nguoiThucHien: string) => void;
  /** Duyệt phương án chia đơn cho nhiều NCC — bước ③ Xét duyệt → ④ Lập đơn mua hàng. */
  duyetPhuongAnTach: (bgId: string, nguoiThucHien: string) => void;
  luuPhanBoBaoGia: (
    bgId: string,
    phanBoTheoDong: Record<string, PhanBoNCC[]>,
    nguoiThucHien: string,
  ) => void;
  /** Kéo thả vào cột Thất bại: đóng dở đề nghị, ghi lịch sử. */
  dongDoDeNghi: (prId: string, nguoiThucHien: string) => void;

  // --- Thao tác trên đề nghị (menu ⋯ của thẻ bảng quy trình) ---
  /** Sửa tiêu đề / công trình / hợp đồng CĐT / mức độ ưu tiên. */
  suaThongTinChung: (
    prId: string,
    moi: Pick<DeNghiMuaHang, "tieuDe" | "tenCongTrinh" | "maHopDongCDT" | "mucDoUuTien">,
    nguoiThucHien: string,
  ) => void;
  /** Đổi ngày cần hàng — bắt ghi lý do vì đây là cam kết với công trình. */
  suaThoiHan: (prId: string, ngayCanHangMoi: string, lyDo: string, nguoiThucHien: string) => void;
  /** Lưu trữ / bỏ lưu trữ — chỉ ẩn khỏi bảng, không đổi trạng thái nghiệp vụ. */
  doiLuuTru: (prId: string, luuTru: boolean, nguoiThucHien: string) => void;
  /** Sửa danh sách trường bổ sung (dữ liệu tùy chỉnh). */
  suaTruongBoSung: (prId: string, truong: TruongBoSung[], nguoiThucHien: string) => void;
  /** Nhân bản đề nghị — trả về id bản mới, chuỗi rỗng nếu hết id dự phòng. */
  nhanBanDeNghi: (prId: string, nguoiThucHien: string) => string;
  /** Xóa hẳn (chỉ bản chạy thử). Trả lý do bị chặn, `null` nghĩa là đã xóa. */
  xoaDeNghi: (prId: string) => string | null;

  // --- Người theo dõi ---
  /** Thêm một người vào danh sách theo dõi đề nghị. Thêm trùng thì bỏ qua. */
  themNguoiTheoDoi: (
    prId: string,
    nguoi: Pick<NguoiTheoDoi, "uid" | "ten" | "chucDanh">,
    nguoiThemTen: string,
  ) => void;
  /** Bỏ một người khỏi danh sách theo dõi đề nghị. */
  boNguoiTheoDoi: (prId: string, uid: string) => void;

  /**
   * Trưởng bộ phận bấm "Chuyển tiếp": bàn giao đề nghị cho các nhân viên đã được
   * phân bổ, để họ làm tiếp các bước sau (lập đơn, chọn NCC...).
   * Trả về danh sách tên đã gửi tới — rỗng nghĩa là chưa phân bổ cho ai.
   */
  chuyenTiepChoNhanVien: (prId: string, nguoiChuyenTen: string, loiNhan?: string) => string[];

  // --- Thông báo chuyển bước + tiếp nhận công tác ---
  /** Thông báo chuyển bước, mới nhất đứng đầu (tự sinh khi đề nghị đổi bước). */
  thongBao: ThongBaoChuyenBuoc[];
  /** Đánh dấu toàn bộ thông báo là đã đọc — gọi khi người dùng mở chuông. */
  danhDauDaDocThongBao: () => void;
  /** Bấm "Nhận công tác": ghi người tiếp nhận vào thông báo + nhật ký đề nghị. */
  nhanCongTac: (thongBaoId: string, nguoi: { uid: string; ten: string }) => void;
  /**
   * Xóa sạch dữ liệu chạy thử rồi tải lại app. Chỉ dùng khi chạy thử.
   * ⚠️ Xóa cả trên kho chung → **mọi người đều mất**, không riêng máy đang bấm.
   */
  xoaDuLieuChayThu: () => Promise<void>;

  // --- Kho dữ liệu chung ---
  /**
   * Đang nối được kho chung trên máy chủ hay không.
   *
   * 🔴 Phải hiện ra giao diện, không được giấu. Nếu mất kết nối mà app im lặng, người dùng
   * cứ tưởng cả phòng đang thấy việc mình nhập — trong khi thực tế chỉ mình mình thấy.
   *
   * Cố ý có BA trạng thái chứ không phải đúng/sai: lúc mới mở app thì kết nối chưa xong,
   * nếu gộp vào "rieng" thì lần nào mở app cũng chớp một cảnh báo sai.
   *  · `dang-noi` — đang bắt liên lạc, chưa kết luận
   *  · `chung`    — đã nối, cả phòng thấy chung
   *  · `rieng`    — không nối được, dữ liệu chỉ nằm trên máy này
   */
  trangThaiKhoChung: "dang-noi" | "chung" | "rieng";
}

const Context = createContext<GiaTriDuLieu | null>(null);

/**
 * Kho dữ liệu chạy thử — giữ trong bộ nhớ để mọi thao tác (phân bổ, ghi nhận hàng,
 * xác nhận hoàn thành) đều hoạt động thật khi trình diễn.
 *
 * Dữ liệu được **lưu lại trên máy người dùng** (xem `luu-tren-may.ts`) nên tải lại trang
 * không mất. Chỉ nằm trên đúng máy đó, đúng trình duyệt đó — không phải cơ sở dữ liệu.
 *
 * Khi nối Firebase: thay các hàm bên dưới bằng lệnh ghi Firestore, giao diện giữ nguyên,
 * và **bỏ hẳn phần lưu trên máy** để tránh hai nguồn dữ liệu lệch nhau.
 */
export function DuLieuProvider({ children }: { children: ReactNode }) {
  const [deNghi, setDeNghi] = useState<DeNghiMuaHang[]>(DE_NGHI_MAU);
  const [donHang, setDonHang] = useState<DonDatHang[]>(DON_HANG_MAU);
  const [giaDonHang, setGiaDonHang] = useState<GiaDonDatHang[]>(GIA_DON_HANG_MAU);
  const [phieuNhan, setPhieuNhan] = useState<PhieuNhanHang[]>(PHIEU_NHAN_MAU);
  const [baoGia, setBaoGia] = useState<BaoGia[]>(BAO_GIA_MAU);
  const [thongBao, setThongBao] = useState<ThongBaoChuyenBuoc[]>([]);

  // ----------------------------------------------------------------
  // GIỮ DỮ LIỆU QUA MỖI LẦN TẢI LẠI TRANG
  //
  // 🔴 Nạp trong `useEffect` chứ KHÔNG đọc thẳng lúc khởi tạo state: trang được dựng sẵn
  // lúc build (hosting tĩnh) nên lần render đầu ở máy chủ không có `localStorage`. Đọc
  // lúc khởi tạo sẽ khiến bản dựng sẵn và bản trên máy khác nhau → React báo lỗi hydrate
  // và dựng lại cả cây, chớp giao diện.
  const [daNapTuMay, setDaNapTuMay] = useState(false);

  /**
   * ★ ẢNH CHỤP CUỐI CÙNG ĐÃ ĐỒNG BỘ — chìa khóa chống vòng lặp vô tận.
   *
   * 🔴 Không có nó thì: nhận dữ liệu từ máy chủ → `setState` → `useEffect` ghi → máy chủ đổi
   * → nhận lại → ghi tiếp… quay vòng không dứt, đốt sạch hạn mức Firestore trong vài phút.
   * Cách chặn: ghi nhớ chuỗi JSON vừa nhận/vừa gửi; lần ghi nào có nội dung y hệt thì bỏ qua.
   */
  const anhChupCuoi = useRef<string>("");
  const ketNoiChung = useRef<KetNoiKhoChung | null>(null);

  /**
   * 🔴 CHỐT AN TOÀN: chưa nghe được máy chủ nói gì thì TUYỆT ĐỐI không đẩy lên.
   *
   * Không có nó thì máy nào mở app lần đầu (chưa có gì trong bộ nhớ trình duyệt) sẽ đẩy
   * NGAY bộ dữ liệu rỗng lên máy chủ — **xóa sạch việc của cả phòng** chỉ vì có người mở
   * app bằng máy mới. Chỉ mở khóa sau khi đã biết trên máy chủ đang có gì.
   */
  const daNgheMayChu = useRef(false);
  /** Bộ dữ liệu mới nhất, để đẩy lên khi máy chủ báo "chưa có gì". */
  const duLieuHienTai = useRef<DuLieuLuu | null>(null);

  /**
   * Hàng chờ một chỗ: dữ liệu muốn đẩy khi kết nối chưa gán xong.
   *
   * ⚠️ `onSnapshot` có thể bắn ảnh chụp đầu tiên TRƯỚC khi `noiKhoChung()` kịp trả về —
   * hai việc bất đồng bộ khác nhau, không có thứ tự bảo đảm. Đẩy thẳng vào
   * `ketNoiChung.current` lúc đó là gặp `null` và **lần ghi đầu tiên rơi mất im lặng**.
   */
  const hangCho = useRef<DuLieuLuu | null>(null);

  const dayLenMayChu = useCallback((d: DuLieuLuu) => {
    if (!ketNoiChung.current) {
      hangCho.current = d;
      return;
    }
    void ketNoiChung.current.day(d).catch((e) => console.error("[kho chung] ghi hỏng:", e));
  }, []);
  const [trangThaiKhoChung, setTrangThaiKhoChung] =
    useState<GiaTriDuLieu["trangThaiKhoChung"]>("dang-noi");

  const apDung = useCallback((d: DuLieuLuu) => {
    setDeNghi(d.deNghi);
    setDonHang(d.donHang);
    setGiaDonHang(d.giaDonHang);
    setPhieuNhan(d.phieuNhan);
    setBaoGia(d.baoGia);
    setThongBao(d.thongBao);
  }, []);

  useEffect(() => {
    // ① Đọc bản trên máy trước — có ngay, không phải chờ mạng.
    const d = docDuLieuDaLuu();
    if (d) {
      apDung(d);
      anhChupCuoi.current = JSON.stringify(d);
    }
    setDaNapTuMay(true);

    // ② Rồi nối kho chung. Từ lúc này máy chủ là nguồn chính.
    let conSong = true;
    void noiKhoChung(
      (tuMayChu) => {
        if (!conSong) return;
        daNgheMayChu.current = true;
        setTrangThaiKhoChung("chung");

        // `null` = máy chủ CHƯA CÓ tài liệu (lần đầu cả phòng dùng). Lúc này phải ĐẨY
        // dữ liệu của mình lên làm bản gốc, chứ không phải lấy cái rỗng về rồi tự xóa mình.
        if (tuMayChu === null) {
          const d = duLieuHienTai.current;
          if (d) {
            anhChupCuoi.current = JSON.stringify(d);
            dayLenMayChu(d);
          }
          return;
        }

        const chuoi = JSON.stringify(tuMayChu);
        if (chuoi === anhChupCuoi.current) return; // Chính mình vừa gửi lên — bỏ qua.
        anhChupCuoi.current = chuoi;
        apDung(tuMayChu);
        ghiDuLieu(tuMayChu); // Giữ bản dự phòng trên máy để lần sau mở offline vẫn có.
      },
      (e) => {
        // Nói ra thay vì im lặng: người dùng phải biết mình đang làm việc một mình hay
        // chung với cả phòng. Im lặng thì họ tưởng đã chung dữ liệu.
        console.error("[kho chung] không nối được:", e);
        setTrangThaiKhoChung("rieng");
      },
    ).then((kn) => {
      if (!conSong) {
        kn?.dong();
        return;
      }
      ketNoiChung.current = kn;
      // `null` = chưa khai cấu hình Firebase → app chạy một mình, phải nói rõ.
      if (!kn) {
        setTrangThaiKhoChung("rieng");
        return;
      }
      // Đổ hàng chờ: dữ liệu muốn đẩy lúc kết nối chưa sẵn sàng.
      const cho = hangCho.current;
      hangCho.current = null;
      if (cho) dayLenMayChu(cho);
    });

    return () => {
      conSong = false;
      ketNoiChung.current?.dong();
      ketNoiChung.current = null;
    };
  }, [apDung, dayLenMayChu]);

  // ⚠️ Chờ nạp xong mới cho ghi. Bỏ điều kiện này là lần chạy đầu ghi đè bản lưu bằng
  // dữ liệu rỗng — tức xóa sạch việc người dùng đã nhập hôm trước.
  useEffect(() => {
    if (!daNapTuMay) return;
    const d = { deNghi, donHang, giaDonHang, phieuNhan, baoGia, thongBao };
    duLieuHienTai.current = d;

    const chuoi = JSON.stringify(d);
    if (chuoi === anhChupCuoi.current) return; // Không có gì đổi so với bản đã đồng bộ.

    // Bản dự phòng trên máy luôn ghi, kể cả khi chưa nối được máy chủ — mất mạng vẫn
    // không mất việc đang làm.
    ghiDuLieu(d);

    // 🔴 Chưa nghe máy chủ nói gì thì KHÔNG đẩy, và cũng KHÔNG ghi dấu `anhChupCuoi`:
    // ghi dấu ở đây là coi như đã đồng bộ, lần đẩy thật sau đó bị bỏ qua và thay đổi này
    // biến mất khỏi kho chung mà không ai hay.
    if (!daNgheMayChu.current) return;

    anhChupCuoi.current = chuoi;
    dayLenMayChu(d);
  }, [daNapTuMay, deNghi, donHang, giaDonHang, phieuNhan, baoGia, thongBao, dayLenMayChu]);

  const xoaDuLieuChayThu = useCallback(async () => {
    // 🔴 Từ 12/08/2026 dữ liệu nằm trên máy chủ dùng chung, nên xóa là XÓA CỦA CẢ PHÒNG.
    // Phải dọn kho chung TRƯỚC rồi mới tải lại trang: nếu chỉ xóa bản trên máy, lần
    // tải lại sẽ kéo nguyên dữ liệu cũ từ máy chủ về — nút bấm xong mà không xóa được gì.
    const rong: DuLieuLuu = {
      deNghi: [],
      donHang: [],
      giaDonHang: [],
      phieuNhan: [],
      baoGia: [],
      thongBao: [],
    };
    anhChupCuoi.current = JSON.stringify(rong);
    try {
      await ketNoiChung.current?.day(rong);
    } catch (e) {
      console.error("[kho chung] xóa hỏng:", e);
    }
    xoaDuLieuDaLuu();
    // Tải lại cả trang thay vì chỉ đặt state rỗng: dứt điểm mọi thứ đang giữ trong bộ
    // nhớ (form đang mở, bộ lọc, thông báo) — sạch đúng như mở app lần đầu.
    if (typeof window !== "undefined") window.location.href = "/de-nghi";
  }, []);

  // Đọc danh sách hiện có khi sinh mã mới, không cần đưa state vào deps.
  const donHangRef = useRef(donHang);
  donHangRef.current = donHang;
  const deNghiRef = useRef(deNghi);
  deNghiRef.current = deNghi;
  const baoGiaRef = useRef(baoGia);
  baoGiaRef.current = baoGia;
  const phieuNhanRef = useRef(phieuNhan);
  phieuNhanRef.current = phieuNhan;
  const thongBaoRef = useRef(thongBao);
  thongBaoRef.current = thongBao;

  // ------------------------------------------------------------
  // THÔNG BÁO CHUYỂN BƯỚC — theo dõi giai đoạn SUY RA của từng đề nghị.
  // Giai đoạn không lưu trong dữ liệu (nguyên tắc ở 2-quy-trinh/giai-doan-mua-hang)
  // nên cứ mỗi lần dữ liệu đổi thì so bước trước/sau: khác là báo. Nhờ vậy bắt được
  // MỌI đường chuyển bước — kéo thả, chọn NCC, lập đơn, ghi phiếu nhận, xác nhận...
  // ------------------------------------------------------------
  const giaiDoanTruocRef = useRef<Map<string, GiaiDoanMuaHang> | null>(null);
  const soThuTuThongBao = useRef(0);
  /**
   * Số kế tiếp cho id thông báo.
   *
   * 🔴 PHẢI NỐI TIẾP SỐ TRONG DANH SÁCH ĐÃ LƯU, không đếm từ 0 mỗi lần tải trang. Từ khi
   * thông báo được giữ trên máy (10/08/2026), tải lại trang là bộ đếm về 0 mà `tb-1`,
   * `tb-2`... cũ vẫn còn — thông báo mới sinh id trùng, React trùng key và vẽ sai danh
   * sách (đã gặp thật: hai thông báo cùng `tb-1` làm crash cả trang).
   */
  const soKeTiepThongBao = () => {
    const maxDaCo = thongBaoRef.current.reduce((max, t) => {
      const m = t.id.match(/(\d+)$/);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 0);
    soThuTuThongBao.current = Math.max(soThuTuThongBao.current, maxDaCo) + 1;
    return soThuTuThongBao.current;
  };
  useEffect(() => {
    const hienTai = new Map(
      deNghi.map((dn) => [dn.id, xacDinhGiaiDoan(dn, donHang, baoGia, phieuNhan)] as const),
    );
    const truoc = giaiDoanTruocRef.current;
    giaiDoanTruocRef.current = hienTai;
    if (!truoc) return; // Lần dựng đầu — dữ liệu mẫu không phải "vừa chuyển bước"

    const moi: ThongBaoChuyenBuoc[] = [];
    for (const dn of deNghi) {
      const buocMoi = hienTai.get(dn.id);
      const buocCu = truoc.get(dn.id);

      /**
       * 🔴 CHƯA TỪNG THẤY ĐỀ NGHỊ NÀY TRONG PHIÊN → KHÔNG PHẢI "vừa chuyển bước".
       *
       * Ban lãnh đạo bắt lỗi 11/08/2026: chuông đầy thông báo trùng, cùng một đề nghị hiện
       * *"Đề nghị mới vào bước Tiếp nhận và kiểm tra"* nhiều lần ở nhiều mốc giờ.
       *
       * Nguyên nhân: `giaiDoanTruocRef` chỉ nằm trong bộ nhớ, KHÔNG được lưu. Dữ liệu lại
       * nạp từ localStorage trong `useEffect` nên lần chạy đầu `deNghi` còn rỗng → ref thành
       * Map RỖNG (không phải null, nên không bị chặn bởi câu `if (!truoc) return`). Lần chạy
       * sau dữ liệu về, mọi đề nghị đều có `buocCu === undefined` ≠ `buocMoi` → sinh lại
       * thông báo "đề nghị mới vào bước…" cho TOÀN BỘ hồ sơ, mỗi lần tải trang một lượt.
       *
       * Hệ quả thật: chuông toàn rác, người dùng bỏ qua hết, rồi bỏ lỡ thông báo thật.
       *
       * ⚠️ Đổi lại: đề nghị mới tạo KHÔNG còn được useEffect này báo. Đúng chỗ để báo việc đó
       * là hàm tạo đề nghị (`themDeNghiGiaLap`) — nơi biết CHẮC hồ sơ vừa được thêm, chứ
       * không phải suy đoán từ chỗ "chưa từng thấy".
       */
      if (!buocMoi || buocCu === undefined || buocCu === buocMoi) continue;

      moi.push({
        id: `tb-${soKeTiepThongBao()}`,
        prId: dn.id,
        prCode: dn.code,
        tieuDe: dn.tieuDe,
        tuBuoc: buocCu,
        denBuoc: buocMoi,
        thoiDiem: new Date().toISOString(),
        // 🔴 "Gửi tới" là NGƯỜI CẦN HÀNH ĐỘNG, không phải người theo dõi — xem `nguoiCanXuLy`.
        guiToi: nguoiCanXuLy(dn, buocMoi),
        daDoc: false,
      });
    }
    // Giữ tối đa 30 thông báo gần nhất — đủ cho một phiên trình diễn.
    if (moi.length > 0) setThongBao((truocDo) => [...moi, ...truocDo].slice(0, 30));
  }, [deNghi, donHang, baoGia, phieuNhan]);

  /** Ghi một dòng nhật ký vào lịch sử của đề nghị — dùng cho MỌI thao tác sửa dữ liệu. */
  const ghiLichSuDeNghi = useCallback(
    (prId: string, nguoiThucHien: string, hanhDong: string) => {
      setDeNghi((truoc) =>
        truoc.map((dn) =>
          dn.id !== prId
            ? dn
            : { ...dn, lichSu: [...dn.lichSu, { thoiDiem: thoiDiemHienTai(), nguoiThucHien, hanhDong }] },
        ),
      );
    },
    [],
  );

  const themDeNghiGiaLap = useCallback((dauVao: DauVaoDeNghiGiaLap) => {
    const hienCo = deNghiRef.current;

    // Lấy id dự phòng đầu tiên chưa dùng — hosting tĩnh chỉ mở được địa chỉ đã sinh sẵn.
    const id = ID_DE_NGHI_GIA_LAP.find((x) => !hienCo.some((dn) => dn.id === x));
    if (!id) return "";

    // Số thứ tự chạy THEO DỰ ÁN, đúng quy tắc mã hồ sơ Thông báo 09/2026.
    const soHienCo = hienCo.filter((dn) => dn.maDuAn === dauVao.maDuAn).length;
    const code = `${dauVao.maDuAn}-PR-${String(soHienCo + 1).padStart(3, "0")}`;

    const moi: DeNghiMuaHang = {
      id,
      code,
      maDuAn: dauVao.maDuAn,
      maHopDongCDT: dauVao.maHopDongCDT || undefined,
      tenCongTrinh: dauVao.tenCongTrinh,
      tieuDe: dauVao.tieuDe,
      // Ver 1 chỉ nhận đề nghị từ Phòng Thi công (chỉ đạo Ban lãnh đạo 05/08/2026).
      phongBanNguon: "thi_cong",
      nguoiDeNghiUid: "u-tc",
      nguoiDeNghiTen: dauVao.nguoiDeNghiTen,
      ngayDeNghi: dauVao.ngayDeNghi,
      ngayDuyet: dauVao.ngayDuyet,
      ngayCanHang: dauVao.ngayCanHang,
      mucDoUuTien: dauVao.mucDoUuTien,
      // Đề nghị vào app luôn ở trạng thái ĐÃ DUYỆT — app Thu mua không duyệt đề nghị.
      trangThai: "da_duyet",
      items: dauVao.items.map((d, i) => ({ ...d, stt: i + 1 })),
      // Người đề nghị mặc định theo dõi tiến trình đề nghị của chính mình,
      // rồi tới những người được chọn thêm ở mục "Người theo dõi" của phiếu.
      nguoiTheoDoi: [
        {
          uid: "u-tc",
          ten: dauVao.nguoiDeNghiTen,
          chucDanh: "Chỉ huy trưởng công trình",
          nguoiThemTen: dauVao.nguoiDeNghiTen,
          thoiDiemThem: dauVao.ngayDeNghi,
        },
        ...(dauVao.nguoiTheoDoi ?? [])
          // Bỏ trùng với người đề nghị đã thêm ở trên.
          .filter((n) => n.uid !== "u-tc")
          .map((n) => ({
            ...n,
            nguoiThemTen: dauVao.nguoiDeNghiTen,
            thoiDiemThem: dauVao.ngayDeNghi,
          })),
      ],
      lichSu: [
        { thoiDiem: dauVao.ngayDeNghi, nguoiThucHien: dauVao.nguoiDeNghiTen, hanhDong: "Tạo đề nghị" },
        { thoiDiem: dauVao.ngayDuyet, nguoiThucHien: "Ban chỉ huy", hanhDong: "Duyệt đề nghị" },
        {
          thoiDiem: thoiDiemHienTai(),
          nguoiThucHien: "HPcore",
          hanhDong: "Chuyển sang Phòng Thu mua",
          ghiChu: "Bản chạy thử: đề nghị này do công cụ giả lập tạo ra",
        },
      ],
    };

    setDeNghi((truoc) => [...truoc, moi]);

    /**
     * 🔴 BÁO "ĐỀ NGHỊ MỚI" NGAY TẠI ĐÂY, không để `useEffect` so bước lo việc này.
     *
     * Chỗ này biết CHẮC hồ sơ vừa được thêm. Còn `useEffect` chỉ thấy "đề nghị chưa từng có
     * trong bản đồ giai đoạn" — mà điều đó cũng đúng với mọi hồ sơ vừa nạp từ localStorage
     * sau khi tải lại trang, nên nó sinh lại thông báo cho toàn bộ hồ sơ mỗi lần F5. Đó là
     * lỗi Ban lãnh đạo bắt được ngày 11/08/2026 (chuông đầy thông báo trùng).
     *
     * "Gửi tới" là Trưởng bộ phận Thu mua — người phải tiếp nhận, chứ không phải người theo
     * dõi hồ sơ.
     */
    setThongBao((truocDo) =>
      [
        {
          id: `tb-moi-${soKeTiepThongBao()}`,
          prId: id,
          prCode: code,
          tieuDe: moi.tieuDe,
          tuBuoc: undefined,
          denBuoc: "tiep_nhan" as const,
          thoiDiem: new Date().toISOString(),
          guiToi: nguoiCanXuLy(moi, "tiep_nhan"),
          daDoc: false,
        },
        ...truocDo,
      ].slice(0, 30),
    );

    return id;
  }, []);

  const phanBoDong = useCallback(
    (
      prId: string,
      sttDong: number[],
      nguoiPhuTrachUid: string,
      nguoiPhanBoTen: string,
      yeuCau?: YeuCauPhanBo,
    ) => {
      // 🔴 Tra tên từ DANH BẠ, không giữ bảng ánh xạ riêng ở đây. Bảng cũ viết cứng 3 người
      // và **thiếu `u-tm4`** — phân bổ cho người đó thì màn hình hiện tên là "u-tm4" (mã thô).
      // Danh bạ là nguồn duy nhất; thêm người chỉ phải sửa một chỗ.
      const ten = tenTheoUid(nguoiPhuTrachUid);

      // Dựng câu nhật ký: nêu luôn yêu cầu giao việc để sau này tra lại biết trưởng bộ phận
      // đã dặn gì, khỏi cãi nhau "anh có bảo lấy 3 báo giá đâu".
      const phanThem: string[] = [];
      if (yeuCau?.soBaoGia) phanThem.push(`yêu cầu ${yeuCau.soBaoGia} báo giá`);
      if (yeuCau?.ghiChu?.trim()) phanThem.push(`ghi chú: ${yeuCau.ghiChu.trim()}`);
      const hanhDong =
        `Phân bổ dòng ${sttDong.join(", ")} cho ${ten}` +
        (phanThem.length > 0 ? ` — ${phanThem.join("; ")}` : "");

      setDeNghi((truoc) =>
        truoc.map((dn) =>
          dn.id !== prId
            ? dn
            : {
                ...dn,
                items: dn.items.map((d) =>
                  sttDong.includes(d.stt)
                    ? {
                        ...d,
                        nguoiPhuTrachUid,
                        nguoiPhuTrachTen: ten,
                        nguoiPhanBoTen,
                        thoiDiemPhanBo: homNay(),
                        soBaoGiaYeuCau: yeuCau?.soBaoGia,
                        ghiChuPhanBo: yeuCau?.ghiChu?.trim() || undefined,
                      }
                    : d,
                ),
                // Nhật ký: ghi trong CÙNG lần cập nhật để dữ liệu và lịch sử không lệch nhau
                lichSu: [
                  ...dn.lichSu,
                  {
                    thoiDiem: thoiDiemHienTai(),
                    nguoiThucHien: nguoiPhanBoTen,
                    hanhDong,
                  },
                ],
              },
        ),
      );
    },
    [],
  );

  const boPhanBoDong = useCallback((prId: string, stt: number, nguoiThucHien: string) => {
    setDeNghi((truoc) =>
      truoc.map((dn) =>
        dn.id !== prId
          ? dn
          : {
              ...dn,
              items: dn.items.map((d) =>
                d.stt === stt
                  ? {
                      ...d,
                      nguoiPhuTrachUid: undefined,
                      nguoiPhuTrachTen: undefined,
                      nguoiPhanBoTen: undefined,
                      thoiDiemPhanBo: undefined,
                    }
                  : d,
              ),
              lichSu: [
                ...dn.lichSu,
                { thoiDiem: thoiDiemHienTai(), nguoiThucHien, hanhDong: `Bỏ phân bổ dòng ${stt}` },
              ],
            },
      ),
    );
  }, []);

  const themDonHang = useCallback(
    (dauVao: DauVaoDonHangMoi) => {
      const { donGia, phanTien, ...po } = dauVao;
      // Số thứ tự PO chạy theo DỰ ÁN, đúng quy tắc mã hồ sơ Thông báo 09/2026.
      const soHienCo = donHangRef.current.filter((p) => p.maDuAn === po.maDuAn).length;
      const stt = String(soHienCo + 1).padStart(3, "0");
      const code = `${po.maDuAn}-PO-${stt}`;

      // Lấy id dự phòng ĐÃ SINH SẴN TRANG — hosting tĩnh chỉ mở được địa chỉ có sẵn.
      // Trước đây dùng id tự nghĩ (`po-moi-...`) nên bấm vào đơn vừa lập là ra 404.
      const id = ID_DON_HANG_GIA_LAP.find(
        (x) => !donHangRef.current.some((p) => p.id === x),
      );
      if (!id) return ""; // Hết chỗ — trang gọi tự báo cho người dùng.

      setDonHang((truoc) => [...truoc, { ...po, id, code, trangThai: "da_chot" }]);
      setGiaDonHang((truoc) => [
        ...truoc,
        {
          poId: id,
          poCode: code,
          maDuAn: po.maDuAn,
          lines: po.items.map((d) => ({ sttDong: d.sttDong, donGia: donGia[d.sttDong] ?? 0 })),
          // Chiết khấu / thuế / điều khoản thanh toán đi cùng GIÁ, không đi cùng PO —
          // nếu để trong PO thì cho thủ kho đọc PO là hở luôn phần thương mại.
          ...phanTien,
        },
      ]);
      // Không ghi tên NCC vào nhật ký — lịch sử đề nghị hiện cho cả vai trò không được xem NCC.
      ghiLichSuDeNghi(po.prId, po.nguoiPhuTrachTen, `Lập và chốt đơn hàng ${code}`);
      return id;
    },
    [ghiLichSuDeNghi],
  );

  const themPhieuNhan = useCallback(
    (phieu: Omit<PhieuNhanHang, "id" | "code" | "lanGiaoThu">) => {
      const lanGiaoThu = phieuNhanRef.current.filter((p) => p.poId === phieu.poId).length + 1;
      const id = `grn-${phieu.poId}-${lanGiaoThu}`;
      const code = `${phieu.poCode}-DO${String(lanGiaoThu).padStart(2, "0")}`;
      setPhieuNhan((truoc) => [...truoc, { ...phieu, id, code, lanGiaoThu }]);
      // PO chuyển sang "đang giao" ngay khi có phiếu nhận đầu tiên
      setDonHang((truoc) =>
        truoc.map((po) =>
          po.id === phieu.poId && po.trangThai === "da_chot" ? { ...po, trangThai: "dang_giao" } : po,
        ),
      );
      const po = donHangRef.current.find((p) => p.id === phieu.poId);
      if (po) {
        ghiLichSuDeNghi(po.prId, phieu.nguoiNhanTen, `Ghi phiếu nhận hàng lần ${lanGiaoThu} — ${phieu.poCode}`);
      }
    },
    [ghiLichSuDeNghi],
  );

  const doiTrangThaiPhieu = useCallback(
    (phieuId: string, trangThai: PhieuNhanHang["trangThai"], nguoiThucHien?: string) => {
      setPhieuNhan((truoc) => truoc.map((p) => (p.id === phieuId ? { ...p, trangThai } : p)));
      if (nguoiThucHien) {
        const phieu = phieuNhanRef.current.find((p) => p.id === phieuId);
        const po = phieu && donHangRef.current.find((p) => p.id === phieu.poId);
        if (phieu && po) {
          const nhan =
            trangThai === "da_nhap_kho"
              ? "Duyệt nhập kho"
              : trangThai === "tu_choi_nhan"
                ? "Từ chối nhận"
                : "Chuyển chờ kiểm tra";
          ghiLichSuDeNghi(po.prId, nguoiThucHien, `${nhan} phiếu ${phieu.code}`);
        }
      }
    },
    [ghiLichSuDeNghi],
  );

  /**
   * Đính kèm (hoặc thay) phiếu giao nhận của một phiếu nhận hàng ĐÃ GHI.
   *
   * 🔴 Phải có đường bổ sung này, không chỉ bắt buộc lúc ghi phiếu mới. Những phiếu ghi
   * trước ngày 11/08/2026 không có tệp; nếu chỉ chặn mà không cho bổ sung thì các đơn đó
   * KẸT VĨNH VIỄN, không bao giờ bấm hoàn thành được.
   */
  const dinhKemPhieuGiao = useCallback(
    (phieuId: string, tep: MoTaTep, nguoiThucHien: string) => {
      setPhieuNhan((truoc) =>
        truoc.map((p) => (p.id === phieuId ? { ...p, tepPhieuGiao: tep } : p)),
      );
      const phieu = phieuNhanRef.current.find((p) => p.id === phieuId);
      const po = phieu && donHangRef.current.find((x) => x.id === phieu.poId);
      if (phieu && po) {
        // 🔴 Ghi TÊN TỆP, không ghi tên nhà cung cấp — khối Lịch sử hiện cho cả vai trò
        // không được xem NCC (quy ước phiên 04).
        ghiLichSuDeNghi(
          po.prId,
          nguoiThucHien,
          `Đính kèm phiếu giao nhận cho ${phieu.code}: ${tep.tenTep}`,
        );
      }
    },
    [ghiLichSuDeNghi],
  );

  const xacNhanKho = useCallback(
    (poId: string, nguoi: XacNhan) => {
      setDonHang((truoc) =>
        truoc.map((po) =>
          po.id === poId ? { ...po, xacNhanKho: nguoi, trangThai: "cho_xac_nhan_hoan_thanh" } : po,
        ),
      );
      const po = donHangRef.current.find((p) => p.id === poId);
      if (po) ghiLichSuDeNghi(po.prId, nguoi.ten, `Thủ kho xác nhận đã nhận đủ — ${po.code}`);
    },
    [ghiLichSuDeNghi],
  );

  const xacNhanTruongBP = useCallback(
    (poId: string, nguoi: XacNhan) => {
      setDonHang((truoc) =>
        truoc.map((po) => (po.id === poId ? { ...po, xacNhanTruongBP: nguoi, trangThai: "hoan_thanh" } : po)),
      );
      const po = donHangRef.current.find((p) => p.id === poId);
      if (po) {
        ghiLichSuDeNghi(po.prId, nguoi.ten, `Trưởng bộ phận xác nhận hoàn thành — ${po.code}, chuyển hồ sơ Kế toán`);
      }
    },
    [ghiLichSuDeNghi],
  );

  const taoBaoGiaGiaLap = useCallback(
    (prId: string, nguoiThucHien: string) => {
      const dn = deNghiRef.current.find((d) => d.id === prId);
      if (!dn) return null;
      const daDung = new Set(baoGiaRef.current.map((b) => b.id));
      const id = ID_BAO_GIA_GIA_LAP.find((x) => !daDung.has(x));
      if (!id) return null;

      const soHienCo = baoGiaRef.current.filter((b) => b.code.startsWith(`${dn.maDuAn}-BG-`)).length;
      const code = `${dn.maDuAn}-BG-${String(soHienCo + 1).padStart(3, "0")}`;
      const ngay = homNay();

      const moi: BaoGia = {
        id,
        code,
        prId,
        prCode: dn.code,
        tieuDe: `Báo giá ${dn.tieuDe}`,
        trangThai: "dang_thu_thap",
        // Mỗi dòng đề nghị thành một dòng cần hỏi giá; cột NCC trống chờ giá gửi về.
        items: dn.items.map((d) => ({
          id: `bg-${id}-${d.stt}`,
          // 🔴 Giữ số thứ tự dòng đề nghị — khóa truy vết khi lập đơn từ phân bổ. Không có
          // nó thì phải khớp theo tên vật liệu, mà hai dòng cùng tên khác quy cách sẽ bị
          // dồn về một dòng và dòng kia mất khối lượng.
          sttDongDeNghi: d.stt,
          tenVatLieu: d.tenVatLieu,
          donViTinh: d.donViTinh,
          khoiLuong: d.khoiLuongDeNghi,
          baoGiaNCC: [],
        })),
        hanNop: dn.ngayCanHang,
        ngayTao: ngay,
        ngayCapNhat: ngay,
      };
      setBaoGia((truoc) => [...truoc, moi]);
      ghiLichSuDeNghi(prId, nguoiThucHien, `Tạo bảng báo giá ${code}, gửi nhà cung cấp chào giá`);
      return id;
    },
    [ghiLichSuDeNghi],
  );

  const doiTrangThaiBaoGiaTheoDeNghi = useCallback(
    (prId: string, tu: TrangThaiBaoGia, sang: TrangThaiBaoGia, nguoiThucHien: string) => {
      const ngay = homNay();
      setBaoGia((truoc) =>
        truoc.map((b) => {
          if (b.prId !== prId || b.trangThai !== tu) return b;
          // Sang bước "đã so sánh" mà dòng nào chưa có giá thì điền GIÁ MẪU — mô phỏng
          // NCC gửi giá về, để bảng so sánh và nút "Chọn NCC này" bấm thử được.
          // Giá tính theo công thức cố định (không ngẫu nhiên), chỉ dùng khi chạy thử.
          const items =
            sang === "da_so_sanh"
              ? b.items.map((d, iDong) =>
                  d.baoGiaNCC.length > 0
                    ? d
                    : {
                        ...d,
                        baoGiaNCC: NHA_CUNG_CAP.slice(0, 3).map((ncc, k) => ({
                          nccId: ncc.id,
                          tenNCC: ncc.ten,
                          donGia: 50_000 + iDong * 10_000 + k * 2_500,
                          thoiGianGiao: 2 + k,
                        })),
                      },
                )
              : b.items;
          return { ...b, items, trangThai: sang, ngayCapNhat: ngay };
        }),
      );
      if (sang === "da_so_sanh") {
        ghiLichSuDeNghi(prId, nguoiThucHien, "Chốt đủ báo giá, chuyển sang so sánh và trình duyệt");
      }
    },
    [ghiLichSuDeNghi],
  );

  const chonNCCChoBaoGia = useCallback(
    (bgId: string, nccId: string, tenNCC: string, nguoiThucHien: string) => {
      const ngay = homNay();
      setBaoGia((truoc) =>
        truoc.map((b) =>
          b.id === bgId
            ? { ...b, trangThai: "da_chon_ncc", nccDaChonId: nccId, nccDaChonTen: tenNCC, ngayCapNhat: ngay }
            : b,
        ),
      );
      const bg = baoGiaRef.current.find((b) => b.id === bgId);
      // Không ghi tên NCC vào nhật ký — lịch sử đề nghị hiện cho cả vai trò không được xem NCC.
      if (bg) ghiLichSuDeNghi(bg.prId, nguoiThucHien, `Chốt nhà cung cấp cho bảng báo giá ${bg.code}`);
    },
    [ghiLichSuDeNghi],
  );

  /**
   * BƯỚC ② YÊU CẦU NCC BÁO GIÁ — nhân viên thu mua nhập giá của một nhà cung cấp.
   *
   * 🔴 Chỉ đạo Ban lãnh đạo 10/08/2026: bước ② phải có tiến trình thật — *"nv tm sẽ up báo
   * giá của các nhà cung cấp lên để trưởng bộ phận xem xét"*. Trước đây giá chỉ được điền
   * GIẢ LẬP khi kéo thẻ sang cột ③, nên bước ② không có việc gì để làm.
   *
   * `giaTheoDong` khóa là `DongBaoGia.id`. Dòng nào để trống thì XÓA báo giá của nhà cung
   * cấp đó ở dòng ấy — nhà cung cấp không báo giá mọi mặt hàng là chuyện thường, và bảng so
   * sánh dựa vào chỗ trống này để biết ai báo thiếu dòng (`baoDuDong`).
   */
  const nhapGiaNCC = useCallback(
    (
      bgId: string,
      ncc: { nccId: string; tenNCC: string },
      giaTheoDong: Record<string, { donGia: number; thoiGianGiao: number }>,
      nguoiThucHien: string,
    ) => {
      const ngay = homNay();
      setBaoGia((truoc) =>
        truoc.map((b) => {
          if (b.id !== bgId) return b;
          return {
            ...b,
            ngayCapNhat: ngay,
            items: b.items.map((d) => {
              const moi = giaTheoDong[d.id];
              // Bỏ báo giá cũ của NCC này rồi thêm lại — tránh trùng khi sửa giá nhiều lần.
              const khac = d.baoGiaNCC.filter((q) => q.nccId !== ncc.nccId);
              if (!moi || moi.donGia <= 0) return { ...d, baoGiaNCC: khac };
              return {
                ...d,
                baoGiaNCC: [
                  ...khac,
                  {
                    nccId: ncc.nccId,
                    tenNCC: ncc.tenNCC,
                    donGia: moi.donGia,
                    thoiGianGiao: moi.thoiGianGiao,
                  },
                ],
              };
            }),
          };
        }),
      );
      const bg = baoGiaRef.current.find((b) => b.id === bgId);
      // Không ghi tên NCC vào nhật ký — khối Lịch sử hiện cho cả vai trò không được xem NCC.
      if (bg) ghiLichSuDeNghi(bg.prId, nguoiThucHien, `Nhập báo giá một nhà cung cấp vào ${bg.code}`);
    },
    [ghiLichSuDeNghi],
  );

  /** Đính kèm bản báo giá gốc nhà cung cấp gửi về. Xem `TepBaoGiaNCC` về giới hạn bản chạy thử. */
  const dinhKemBaoGia = useCallback(
    (bgId: string, tep: TepBaoGiaNCC, nguoiThucHien: string) => {
      const ngay = homNay();
      setBaoGia((truoc) =>
        truoc.map((b) =>
          b.id === bgId
            ? { ...b, ngayCapNhat: ngay, tepBaoGia: [...(b.tepBaoGia ?? []), tep] }
            : b,
        ),
      );
      const bg = baoGiaRef.current.find((b) => b.id === bgId);
      if (bg) {
        ghiLichSuDeNghi(bg.prId, nguoiThucHien, `Tải lên bản báo giá “${tep.tenTep}” vào ${bg.code}`);
        // 🔴 Câu này CHỈ ĐÚNG kể từ 11/08/2026, khi tệp được lưu thật qua `kho-tep.ts`.
        // Trước đó nó nói dối: nhật ký ghi "Tải lên" trong khi nội dung tệp bị vứt đi.
        // Đừng đưa dòng này về lại chỗ nào không lưu tệp thật.
      }
    },
    [ghiLichSuDeNghi],
  );

  /**
   * TRÌNH TRƯỞNG BỘ PHẬN XEM XÉT — bước ② Yêu cầu báo giá → ③ Xét duyệt báo giá.
   *
   * Thay cho nút "Nhận đủ báo giá (giả lập)": nhân viên chủ động chốt là đã thu thập xong.
   */
  const trinhXetDuyetBaoGia = useCallback(
    (bgId: string, nguoiThucHien: string) => {
      const ngay = homNay();
      setBaoGia((truoc) =>
        truoc.map((b) =>
          b.id === bgId && b.trangThai === "dang_thu_thap"
            ? { ...b, trangThai: "da_so_sanh", ngayCapNhat: ngay }
            : b,
        ),
      );
      const bg = baoGiaRef.current.find((b) => b.id === bgId);
      if (!bg) return;
      const soNCC = new Set(bg.items.flatMap((d) => d.baoGiaNCC.map((q) => q.nccId))).size;
      ghiLichSuDeNghi(
        bg.prId,
        nguoiThucHien,
        `Trình trưởng bộ phận xem xét ${bg.code} — đã thu thập báo giá của ${soNCC} nhà cung cấp`,
      );
    },
    [ghiLichSuDeNghi],
  );

  /**
   * DUYỆT PHƯƠNG ÁN TÁCH — bước ③ Xét duyệt báo giá → ④ Lập đơn mua hàng.
   *
   * 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 10/08/2026: *"Phải có bước xét duyệt báo giá thì mới qua bước
   * lập PO"*. Trước đây chia khối lượng xong là lập đơn được ngay từ trạng thái
   * `da_so_sanh`, tức bỏ qua hẳn bước xét duyệt — người lập tự so giá rồi tự đặt hàng.
   *
   * Khác `chonNCCChoBaoGia` ở chỗ KHÔNG ghi một nhà cung cấp duy nhất: phương án tách có
   * nhiều nhà cung cấp nên `nccDaChonId` để trống, danh sách nằm ở `items[].phanBo`.
   *
   * ⚠️ KHÔNG ghi tên nhà cung cấp vào nhật ký — khối "Lịch sử" hiện cho cả vai trò không
   * được xem NCC (thủ kho, Phòng Thi công). Chỉ ghi SỐ nhà cung cấp.
   */
  const duyetPhuongAnTach = useCallback(
    (bgId: string, nguoiThucHien: string) => {
      const ngay = homNay();
      setBaoGia((truoc) =>
        truoc.map((b) =>
          b.id === bgId ? { ...b, trangThai: "da_chon_ncc", ngayCapNhat: ngay } : b,
        ),
      );
      const bg = baoGiaRef.current.find((b) => b.id === bgId);
      if (!bg) return;
      const soNCC = new Set(
        bg.items.flatMap((d) => (d.phanBo ?? []).filter((p) => p.khoiLuong > 0).map((p) => p.nccId)),
      ).size;
      ghiLichSuDeNghi(
        bg.prId,
        nguoiThucHien,
        `Duyệt phương án chia đơn cho ${soNCC} nhà cung cấp trên bảng báo giá ${bg.code}`,
      );
    },
    [ghiLichSuDeNghi],
  );

  /**
   * TÁCH BÁO GIÁ — lưu phân bổ khối lượng cho nhiều nhà cung cấp.
   *
   * 🔴 KHÔNG ghi tên nhà cung cấp vào nhật ký đề nghị: khối "Lịch sử" hiện cho cả vai
   * trò không được xem NCC (thủ kho, Phòng Thi công), ghi vào là rò rỉ qua đường nhật ký.
   * Chỉ ghi SỐ nhà cung cấp đã tách.
   */
  const luuPhanBoBaoGia = useCallback(
    (bgId: string, phanBoTheoDong: Record<string, PhanBoNCC[]>, nguoiThucHien: string) => {
      const ngay = homNay();
      setBaoGia((truoc) =>
        truoc.map((b) => {
          if (b.id !== bgId) return b;
          return {
            ...b,
            ngayCapNhat: ngay,
            items: b.items.map((d) => {
              const moi = phanBoTheoDong[d.id];
              if (!moi) return d;
              // Bỏ dòng khối lượng 0 — giữ lại chỉ làm rác dữ liệu và đếm nhầm số NCC.
              const loc = moi.filter((p) => p.khoiLuong > 0);
              return { ...d, phanBo: loc.length > 0 ? loc : undefined };
            }),
          };
        }),
      );

      const bg = baoGiaRef.current.find((b) => b.id === bgId);
      if (!bg) return;
      const soNCC = new Set(
        Object.values(phanBoTheoDong)
          .flat()
          .filter((p) => p.khoiLuong > 0)
          .map((p) => p.nccId),
      ).size;
      ghiLichSuDeNghi(
        bg.prId,
        nguoiThucHien,
        `Tách bảng báo giá ${bg.code} cho ${soNCC} nhà cung cấp`,
      );
    },
    [ghiLichSuDeNghi],
  );

  const danhDauDaDocThongBao = useCallback(() => {
    setThongBao((truoc) =>
      truoc.some((t) => !t.daDoc) ? truoc.map((t) => (t.daDoc ? t : { ...t, daDoc: true })) : truoc,
    );
  }, []);

  const nhanCongTac = useCallback(
    (thongBaoId: string, nguoi: { uid: string; ten: string }) => {
      const tb = thongBaoRef.current.find((t) => t.id === thongBaoId);
      if (!tb || tb.tiepNhan) return; // đã có người nhận thì thôi

      const tiepNhan: XacNhan = { ...nguoi, thoiDiem: new Date().toISOString() };
      setThongBao((truoc) => truoc.map((t) => (t.id === thongBaoId ? { ...t, tiepNhan } : t)));

      // Ghi cả vào nhật ký đề nghị — bàn giao phải có dấu vết hai chiều.
      const nhan = NHAN_GIAI_DOAN[tb.denBuoc as GiaiDoanMuaHang]?.nhan ?? tb.denBuoc;
      ghiLichSuDeNghi(tb.prId, nguoi.ten, `Tiếp nhận công tác bước "${nhan}"`);
    },
    [ghiLichSuDeNghi],
  );

  const dongDoDeNghi = useCallback((prId: string, nguoiThucHien: string) => {
    setDeNghi((truoc) =>
      truoc.map((dn) =>
        dn.id !== prId
          ? dn
          : {
              ...dn,
              trangThai: "dong_do",
              lichSu: [
                ...dn.lichSu,
                { thoiDiem: thoiDiemHienTai(), nguoiThucHien, hanhDong: "Đóng dở đề nghị" },
              ],
            },
      ),
    );
  }, []);


  // ------------------------------------------------------------
  // THAO TÁC TRÊN ĐỀ NGHỊ — menu ⋯ của thẻ bảng quy trình
  // Chỉ đạo Ban lãnh đạo 10/08/2026 (theo menu ngữ cảnh Base.vn).
  //
  // 🔴 MỌI hàm ở đây ghi nhật ký trong CÙNG một lần cập nhật state — không tách thành hai
  // lần `setDeNghi`, vì tách ra thì lần thứ hai lỗi là dữ liệu đã đổi mà nhật ký trống,
  // không ai truy được ai sửa.
  // ------------------------------------------------------------

  /** Sửa thông tin chung: tiêu đề · công trình · hợp đồng CĐT · mức độ ưu tiên. */
  const suaThongTinChung = useCallback(
    (
      prId: string,
      moi: Pick<DeNghiMuaHang, "tieuDe" | "tenCongTrinh" | "maHopDongCDT" | "mucDoUuTien">,
      nguoiThucHien: string,
    ) => {
      setDeNghi((truoc) =>
        truoc.map((dn) => {
          if (dn.id !== prId) return dn;
          // Ghi RÕ đổi trường nào, từ giá trị nào sang giá trị nào. Nhật ký chỉ nói "đã sửa"
          // thì sau này tranh cãi không ai biết sửa cái gì.
          const doi: string[] = [];
          if (moi.tieuDe !== dn.tieuDe) doi.push(`tiêu đề: “${dn.tieuDe}” → “${moi.tieuDe}”`);
          if (moi.tenCongTrinh !== dn.tenCongTrinh)
            doi.push(`công trình: “${dn.tenCongTrinh}” → “${moi.tenCongTrinh}”`);
          if ((moi.maHopDongCDT ?? "") !== (dn.maHopDongCDT ?? ""))
            doi.push(`hợp đồng CĐT: “${dn.maHopDongCDT ?? "—"}” → “${moi.maHopDongCDT ?? "—"}”`);
          if (moi.mucDoUuTien !== dn.mucDoUuTien)
            doi.push(
              `ưu tiên: ${dn.mucDoUuTien === "gap" ? "Gấp" : "Bình thường"} → ${moi.mucDoUuTien === "gap" ? "Gấp" : "Bình thường"}`,
            );
          if (doi.length === 0) return dn; // Không đổi gì thì đừng ghi nhật ký rác
          return {
            ...dn,
            ...moi,
            maHopDongCDT: moi.maHopDongCDT?.trim() || undefined,
            lichSu: [
              ...dn.lichSu,
              {
                thoiDiem: thoiDiemHienTai(),
                nguoiThucHien,
                hanhDong: "Sửa thông tin chung",
                ghiChu: doi.join(" · "),
              },
            ],
          };
        }),
      );
    },
    [],
  );

  /**
   * Đổi ngày cần hàng.
   *
   * ⚠️ Tách riêng khỏi `suaThongTinChung` là CỐ Ý: ngày cần hàng do công trình đặt ra, thu
   * mua sửa tức là **đổi cam kết với công trình** — nên bắt ghi lý do và ghi riêng một dòng
   * nhật ký, để khi công trình hỏi "sao lùi ngày" thì tra ra ngay.
   */
  const suaThoiHan = useCallback(
    (prId: string, ngayCanHangMoi: string, lyDo: string, nguoiThucHien: string) => {
      setDeNghi((truoc) =>
        truoc.map((dn) =>
          dn.id !== prId
            ? dn
            : {
                ...dn,
                ngayCanHang: ngayCanHangMoi,
                lichSu: [
                  ...dn.lichSu,
                  {
                    thoiDiem: thoiDiemHienTai(),
                    nguoiThucHien,
                    hanhDong: `Đổi ngày cần hàng ${dn.ngayCanHang} → ${ngayCanHangMoi}`,
                    ghiChu: lyDo.trim() || undefined,
                  },
                ],
              },
        ),
      );
    },
    [],
  );

  /** Lưu trữ / bỏ lưu trữ — CHỈ ẩn khỏi bảng, không đụng tới trạng thái nghiệp vụ. */
  const doiLuuTru = useCallback((prId: string, luuTru: boolean, nguoiThucHien: string) => {
    setDeNghi((truoc) =>
      truoc.map((dn) =>
        dn.id !== prId
          ? dn
          : {
              ...dn,
              luuTru,
              lichSu: [
                ...dn.lichSu,
                {
                  thoiDiem: thoiDiemHienTai(),
                  nguoiThucHien,
                  hanhDong: luuTru ? "Lưu trữ đề nghị (ẩn khỏi bảng)" : "Bỏ lưu trữ đề nghị",
                },
              ],
            },
      ),
    );
  }, []);

  /** Sửa danh sách trường bổ sung (dữ liệu tùy chỉnh). */
  const suaTruongBoSung = useCallback(
    (prId: string, truong: TruongBoSung[], nguoiThucHien: string) => {
      // Bỏ dòng nhãn rỗng — không tra cứu được, giữ lại chỉ làm rác dữ liệu.
      const loc = truong
        .map((t) => ({ nhan: t.nhan.trim(), giaTri: t.giaTri.trim() }))
        .filter((t) => t.nhan !== "");
      setDeNghi((truoc) =>
        truoc.map((dn) =>
          dn.id !== prId
            ? dn
            : {
                ...dn,
                truongBoSung: loc.length > 0 ? loc : undefined,
                lichSu: [
                  ...dn.lichSu,
                  {
                    thoiDiem: thoiDiemHienTai(),
                    nguoiThucHien,
                    hanhDong: `Cập nhật ${loc.length} trường bổ sung`,
                    ghiChu: loc.map((t) => t.nhan).join(" · ") || undefined,
                  },
                ],
              },
        ),
      );
    },
    [],
  );

  /**
   * Nhân bản đề nghị — tạo hồ sơ MỚI, chép nội dung nhưng KHÔNG chép tiến trình.
   *
   * 🔴 Bản sao phải SẠCH: bỏ hết phân bổ người phụ trách, nhật ký, người theo dõi, cờ lưu
   * trữ. Chép cả phân bổ sang thì bản mới trông như đã có người làm, và mọi con số "chưa
   * phân bổ" trên Tổng quan sai ngay. Nhật ký bản mới bắt đầu bằng đúng một dòng: nhân từ đâu.
   */
  const nhanBanDeNghi = useCallback((prId: string, nguoiThucHien: string): string => {
    const goc = deNghiRef.current.find((d) => d.id === prId);
    if (!goc) return "";
    const idMoi = ID_DE_NGHI_GIA_LAP.find((id) => !deNghiRef.current.some((d) => d.id === id));
    if (!idMoi) return ""; // Hết id dự phòng — người gọi phải báo cho người dùng
    const soHienCo = deNghiRef.current.filter((d) => d.maDuAn === goc.maDuAn).length;
    const code = `${goc.maDuAn}-PR-${String(soHienCo + 1).padStart(3, "0")}`;
    const ngay = homNay();

    setDeNghi((truoc) => [
      ...truoc,
      {
        ...goc,
        id: idMoi,
        code,
        tieuDe: `${goc.tieuDe} (bản sao)`,
        ngayDeNghi: ngay,
        ngayDuyet: ngay,
        trangThai: "da_duyet",
        luuTru: undefined,
        nguoiTheoDoi: undefined,
        items: goc.items.map((d) => ({
          ...d,
          nguoiPhuTrachUid: undefined,
          nguoiPhuTrachTen: undefined,
          nguoiPhanBoTen: undefined,
          thoiDiemPhanBo: undefined,
        })),
        lichSu: [
          { thoiDiem: thoiDiemHienTai(), nguoiThucHien, hanhDong: `Nhân bản từ ${goc.code}` },
        ],
      },
    ]);
    return idMoi;
  }, []);

  /**
   * XÓA HẲN đề nghị.
   *
   * 🔴 CHỈ CÓ Ý NGHĨA Ở BẢN CHẠY THỬ. Khi nối Firestore thật, xóa hồ sơ phải bị Security
   * Rules chặn: đề nghị là chứng từ nhận từ HPcore, app Thu mua không phải chủ sở hữu. Cách
   * kết thúc đúng nghiệp vụ là "Đánh dấu thất bại" (`dongDoDeNghi`) — giữ dấu vết để thống kê.
   *
   * ⚠️ Chặn xóa khi đã phát sinh chứng từ con: xóa đề nghị mà còn bảng báo giá / đơn hàng trỏ
   * về nó thì các chứng từ đó thành mồ côi, mọi phép tính khối lượng hỏng theo.
   */
  const xoaDeNghi = useCallback((prId: string): string | null => {
    const coBaoGia = baoGiaRef.current.some((b) => b.prId === prId && b.trangThai !== "huy");
    const coDonHang = donHangRef.current.some((p) => p.prId === prId && p.trangThai !== "huy");
    if (coBaoGia || coDonHang) {
      return "Đề nghị đã phát sinh bảng báo giá hoặc đơn đặt hàng nên không xóa được — xóa sẽ làm các chứng từ đó mồ côi. Dùng “Đánh dấu thất bại” để đóng dở.";
    }
    setDeNghi((truoc) => truoc.filter((d) => d.id !== prId));
    // Dọn luôn thông báo của đề nghị đã xóa, tránh bấm vào ra trang trống.
    setThongBao((truoc) => truoc.filter((t) => t.prId !== prId));
    return null;
  }, []);

  // ------------------------------------------------------------
  // NGƯỜI THEO DÕI
  // Nhật ký ghi trong CÙNG lần cập nhật (như `phanBoDong`) để danh sách và
  // lịch sử không bao giờ lệch nhau nếu một trong hai lần ghi thất bại.
  // ------------------------------------------------------------
  const themNguoiTheoDoi = useCallback(
    (
      prId: string,
      nguoi: Pick<NguoiTheoDoi, "uid" | "ten" | "chucDanh">,
      nguoiThemTen: string,
    ) => {
      setDeNghi((truoc) =>
        truoc.map((dn) => {
          if (dn.id !== prId) return dn;
          const ds = dn.nguoiTheoDoi ?? [];
          if (ds.some((n) => n.uid === nguoi.uid)) return dn; // đã có thì thôi
          return {
            ...dn,
            nguoiTheoDoi: [...ds, { ...nguoi, nguoiThemTen, thoiDiemThem: homNay() }],
            lichSu: [
              ...dn.lichSu,
              {
                thoiDiem: thoiDiemHienTai(),
                nguoiThucHien: nguoiThemTen,
                hanhDong: `Thêm ${nguoi.ten} vào danh sách theo dõi`,
              },
            ],
          };
        }),
      );
    },
    [],
  );

  const boNguoiTheoDoi = useCallback((prId: string, uid: string) => {
    setDeNghi((truoc) =>
      truoc.map((dn) => {
        if (dn.id !== prId) return dn;
        const ds = dn.nguoiTheoDoi ?? [];
        const bi = ds.find((n) => n.uid === uid);
        if (!bi) return dn;
        return {
          ...dn,
          nguoiTheoDoi: ds.filter((n) => n.uid !== uid),
          lichSu: [
            ...dn.lichSu,
            {
              thoiDiem: thoiDiemHienTai(),
              nguoiThucHien: bi.nguoiThemTen,
              hanhDong: `Bỏ ${bi.ten} khỏi danh sách theo dõi`,
            },
          ],
        };
      }),
    );
  }, []);

  /**
   * CHUYỂN TIẾP — trưởng bộ phận bàn giao việc cho nhân viên đã phân bổ.
   *
   * 🔴 Không đụng tới giai đoạn của đề nghị. Giai đoạn vẫn suy ra từ chứng từ
   * (nguyên tắc ở `2-quy-trinh/giai-doan-mua-hang`); chuyển tiếp chỉ là BÀN GIAO
   * NGƯỜI LÀM, không phải bước nghiệp vụ mới. Vì vậy `tuBuoc` = `denBuoc`.
   *
   * Dùng lại đúng cơ chế thông báo + nút "Nhận công tác" đã có, nên nhân viên
   * nhận việc theo cùng một thói quen thao tác.
   */
  const chuyenTiepChoNhanVien = useCallback(
    (prId: string, nguoiChuyenTen: string, loiNhan?: string) => {
      const dn = deNghiRef.current.find((x) => x.id === prId);
      if (!dn) return [];

      // Người nhận = các nhân viên đang phụ trách ít nhất một dòng, không trùng lặp.
      const nguoiNhan = [
        ...new Set(
          dn.items.map((d) => d.nguoiPhuTrachTen).filter((x): x is string => Boolean(x)),
        ),
      ];
      if (nguoiNhan.length === 0) return [];

      const buocHienTai = xacDinhGiaiDoan(
        dn,
        donHangRef.current,
        baoGiaRef.current,
        phieuNhanRef.current,
      );

      setThongBao((truoc) =>
        [
          {
            id: `tb-ct-${soKeTiepThongBao()}`,
            prId: dn.id,
            prCode: dn.code,
            tieuDe: dn.tieuDe,
            tuBuoc: buocHienTai,
            denBuoc: buocHienTai,
            thoiDiem: new Date().toISOString(),
            guiToi: nguoiNhan,
            daDoc: false,
            laChuyenTiep: true,
            loiNhan: loiNhan?.trim() || undefined,
          },
          ...truoc,
        ].slice(0, 30),
      );

      ghiLichSuDeNghi(
        prId,
        nguoiChuyenTen,
        `Chuyển tiếp cho ${nguoiNhan.join(", ")}${loiNhan?.trim() ? ` — “${loiNhan.trim()}”` : ""}`,
      );
      return nguoiNhan;
    },
    [ghiLichSuDeNghi],
  );

  const value = useMemo<GiaTriDuLieu>(
    () => ({
      deNghi,
      donHang,
      giaDonHang,
      phieuNhan,
      nhaCungCap: NHA_CUNG_CAP,
      baoGia,
      congNo: CONG_NO_MAU,
      themDeNghiGiaLap,
      phanBoDong,
      boPhanBoDong,
      themDonHang,
      themPhieuNhan,
      doiTrangThaiPhieu,
      dinhKemPhieuGiao,
      xacNhanKho,
      xacNhanTruongBP,
      taoBaoGiaGiaLap,
      doiTrangThaiBaoGiaTheoDeNghi,
      chonNCCChoBaoGia,
      luuPhanBoBaoGia,
      nhapGiaNCC,
      dinhKemBaoGia,
      trinhXetDuyetBaoGia,
      duyetPhuongAnTach,
      dongDoDeNghi,
      suaThongTinChung,
      suaThoiHan,
      doiLuuTru,
      suaTruongBoSung,
      nhanBanDeNghi,
      xoaDeNghi,
      themNguoiTheoDoi,
      boNguoiTheoDoi,
      chuyenTiepChoNhanVien,
      thongBao,
      danhDauDaDocThongBao,
      nhanCongTac,
      xoaDuLieuChayThu,
      trangThaiKhoChung,
    }),
    [
      deNghi,
      donHang,
      giaDonHang,
      phieuNhan,
      baoGia,
      themDeNghiGiaLap,
      phanBoDong,
      boPhanBoDong,
      themDonHang,
      themPhieuNhan,
      doiTrangThaiPhieu,
      dinhKemPhieuGiao,
      xacNhanKho,
      xacNhanTruongBP,
      taoBaoGiaGiaLap,
      doiTrangThaiBaoGiaTheoDeNghi,
      chonNCCChoBaoGia,
      luuPhanBoBaoGia,
      nhapGiaNCC,
      dinhKemBaoGia,
      trinhXetDuyetBaoGia,
      duyetPhuongAnTach,
      dongDoDeNghi,
      suaThongTinChung,
      suaThoiHan,
      doiLuuTru,
      suaTruongBoSung,
      nhanBanDeNghi,
      xoaDeNghi,
      themNguoiTheoDoi,
      boNguoiTheoDoi,
      chuyenTiepChoNhanVien,
      thongBao,
      danhDauDaDocThongBao,
      nhanCongTac,
      xoaDuLieuChayThu,
      trangThaiKhoChung,
    ],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDuLieu(): GiaTriDuLieu {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useDuLieu phải nằm trong <DuLieuProvider>.");
  return ctx;
}

/** Mảng dòng nhận hàng rỗng để khởi tạo form — tránh tạo lại mỗi lần render. */
export const DONG_NHAN_RONG: DongNhanHang[] = [];
