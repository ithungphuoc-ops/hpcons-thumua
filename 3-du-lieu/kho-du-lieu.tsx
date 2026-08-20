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
import { toast } from "sonner";
// Chỉ dùng để SUY RA giai đoạn khi phát thông báo chuyển bước — import type-only
// chiều ngược lại nên không tạo vòng phụ thuộc runtime.
import {
  NHAN_GIAI_DOAN,
  giaiDoanDaKetThuc,
  nguoiCanXuLy,
  vuongMacLapDonHang,
  xacDinhGiaiDoan,
  type GiaiDoanMuaHang,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import { thoiDiemHienTai } from "@/6-tien-ich/dinh-dang";
import { boDau } from "@/6-tien-ich/bo-dau";
import { coCongThucTuDong, dungTenDeNghi, maDeNghiTiepTheo } from "@/2-quy-trinh/dat-ten-de-nghi";
import { maDonHangTiepTheo } from "@/2-quy-trinh/dat-ma-don-hang";
import {
  CAU_HINH_MAC_DINH,
  gopCauHinhVoiMacDinh,
  loiCauHinh,
  soSanhCauHinh,
  type CauHinhQuyTrinh,
  type CongViecGiaiDoan,
  type VetDoiCauHinh,
} from "@/2-quy-trinh/cau-hinh-quy-trinh";
import {
  maBanSaoTiepTheo,
  phieuGocCua,
  tinhPhuongAnTach,
} from "@/2-quy-trinh/nhan-ban-de-nghi";
import {
  tinhTienDoPO,
  vuongMacGhiThemPhieuNhan,
  vuongMacKhoiLuongNhan,
  vuongMacSoPhieuNCC,
} from "@/2-quy-trinh/tinh-toan";
import { nhanSuDangLamViec, tenTheoUid } from "@/3-du-lieu/danh-ba-nhan-su";
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
  ThongTinThuongMaiNCC,
  LanSuaBinhLuan,
  MoTaTep,
  PhongBanNguon,
  NhomDeXuat,
} from "@/3-du-lieu/kieu-du-lieu";
// Nhãn tiếng Việt để ghi nhật ký đọc được: nhật ký ghi mã thô (`thi_cong`, `mm_ccdc`) thì
// người tra hồ sơ sau này không biết đó là gì.
import { NHAN_NHOM_DE_XUAT } from "@/3-du-lieu/kieu-du-lieu";
import { nhanPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";

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
  /** Mã nghiệp vụ của người lập — để màn "Theo dõi đề nghị" lọc đúng phiếu của họ. */
  nguoiDeNghiUid: string;
  nguoiDeNghiChucDanh: string;
  /** Phòng ban gửi đề xuất — từ 12/08/2026 nhận từ MỌI phòng ban. */
  phongBanNguon: PhongBanNguon;
  /** Nhóm đề xuất: Vật tư · Dịch vụ · MM-CCDC · Khác (trường của thẻ Base, 14/08/2026). */
  nhomDeXuat?: NhomDeXuat;
  ngayDeNghi: string;
  ngayDuyet: string;
  ngayCanHang: string;
  mucDoUuTien: "binh_thuong" | "gap";
  items: Omit<DongDeNghi, "stt">[];
  /** Người theo dõi chọn sẵn lúc lập phiếu (mục "Người theo dõi" trên phiếu đề nghị).
   *  Người đề nghị luôn được thêm tự động, không cần khai ở đây. */
  nguoiTheoDoi?: Pick<NguoiTheoDoi, "uid" | "ten" | "chucDanh">[];
  /** Tài liệu đính kèm lúc lập phiếu (tối đa 10) — phần mô tả, nội dung ở kho tệp. */
  taiLieu?: MoTaTep[];
}

/**
 * Dữ liệu lập một đơn mua hàng mới.
 *
 * 🔴 Cố ý tách làm hai phần vì chúng đi về HAI CHỨNG TỪ khác nhau:
 *  - phần còn lại → `tm_donhang` (mọi vai trò liên quan đọc được)
 *  - `donGia` + `phanTien` → `tm_donhang_gia` (chỉ vai trò được xem giá)
 *
 * ⚠️ `lichSu` BỊ LOẠI khỏi đầu vào (từ 18/08/2026): nhật ký do kho dữ liệu tự ghi, nơi gọi
 * không được đặt sẵn — xem `ghiNhatKyDonHang`.
 *
 * 🔴 `prId` / `prCode` khai TÙY CHỌN theo kiểu dữ liệu, nhưng `themDonHang` **TỪ CHỐI CẤT khi
 * `prId` rỗng** (siết lại chiều 18/08/2026 — xem chú thích ở hàm đó). Sáng cùng ngày từng cho
 * cất đơn không gắn đề nghị; Ban lãnh đạo đã chốt module đó *"chỉ cần tạo mẫu PO thôi, chưa cần
 * lưu"* nên đường cất ấy không còn. Để kiểu vẫn tùy chọn vì `DonDatHang` cũ có thể thiếu trường.
 *
 * ⚠️ `maDuAn` VẪN BẮT BUỘC và `themDonHang` từ chối khi rỗng — mã đơn `260001-HPCS-PO-001` lấy
 * phần đầu từ đó.
 */
export type DauVaoDonHangMoi = Omit<DonDatHang, "id" | "code" | "trangThai" | "lichSu"> & {
  /** Đơn giá theo số thứ tự dòng PO. */
  donGia: Record<number, number>;
  /**
   * ★ Thuế suất RIÊNG của từng dòng (%), theo số thứ tự dòng PO — cột "% Thuế GTGT" của màn
   * Đơn mua hàng MISA (chỉ đạo Ban lãnh đạo 17/08/2026).
   *
   * Dòng không có mặt ở đây thì dùng `phanTien.thueSuatGTGT` (thuế suất chung). Để trống cả
   * bảng là chuyện thường — hầu hết đơn chỉ có một mức thuế.
   */
  thueSuatDong?: Record<number, number>;
  /** Chiết khấu · thuế suất · loại tiền · điều khoản thanh toán — theo mẫu Excel công ty. */
  phanTien?: Pick<
    GiaDonDatHang,
    | "loaiTien"
    | "chietKhau"
    | "kieuChietKhau"
    | "tyLeChietKhau"
    | "thueSuatGTGT"
    | "dieuKhoanThanhToan"
    | "soNgayDuocNo"
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
  /**
   * Thêm một nhà cung cấp vào danh mục (Ban lãnh đạo 20/08/2026).
   * Trả lý do bị chặn (trùng mã / trùng tên / thiếu mã, tên), `null` là đã thêm.
   */
  themNhaCungCap: (n: {
    maNCC: string;
    ten: string;
    maSoThue?: string;
    diaChi?: string;
    dienThoai?: string;
    nguoiLienHe?: string;
  }) => string | null;
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
    /** Tên người nhận việc. Bỏ trống thì tra danh bạ — chỉ đúng với tài khoản mẫu. */
    tenNguoiPhuTrach?: string,
  ) => void;
  boPhanBoDong: (prId: string, sttDong: number, nguoiThucHien: string) => void;
  /**
   * Lùi đề nghị về MỘT bước trước bằng cách hủy chứng từ tương ứng.
   * Luật "được lùi hay không" ở `2-quy-trinh/giai-doan-mua-hang.ts` → `quyetDinhLui`.
   */
  /**
   * `traLai` = lùi vì **trưởng bộ phận KHÔNG DUYỆT** bảng báo giá (Ban lãnh đạo 19/08/2026),
   * kèm lý do bắt buộc. Bỏ trống = lùi thường (kéo thẻ trên bảng quy trình).
   */
  luiVeBuoc: (
    prId: string,
    ve: GiaiDoanMuaHang,
    nguoiThucHien: string,
    traLai?: { lyDo: string },
  ) => void;
  /**
   * Chuyển việc sang người khác khi người được giao không thực hiện được
   * (Ban lãnh đạo 12/08/2026). Giữ nguyên yêu cầu số báo giá và ghi chú giao việc.
   */
  chuyenViecDong: (
    prId: string,
    sttDong: number[],
    nguoiMoi: { uid: string; ten: string },
    lyDo: string,
    nguoiThucHien: string,
  ) => void;
  /** Lập PO mới từ các dòng đề nghị. Trả về id PO vừa tạo. */
  /**
   * Lập đơn đặt hàng. Trả `{ id }` khi lập được, `{ loi }` kèm lý do khi bị chặn.
   *
   * 🔴 KIỂU TRẢ VỀ CỐ Ý BẮT NƠI GỌI PHẢI XỬ LÝ LỖI. Bản cũ trả chuỗi id, hết chỗ thì trả
   * chuỗi rỗng — một giá trị "giả" rất dễ bị bỏ qua. Nay đơn có thể bị chặn vì lý do NGHIỆP VỤ
   * (chưa duyệt báo giá), mà lý do đó phải tới được mắt người dùng.
   */
  themDonHang: (dauVao: DauVaoDonHangMoi) => { id: string } | { loi: string };
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
  /**
   * Chốt nhà cung cấp cho bảng báo giá.
   * `lyDo` = lý do / dẫn chứng vì sao chọn bên này (Ban lãnh đạo 13/08/2026) — lưu vào bảng
   * báo giá, KHÔNG vào nhật ký đề nghị vì nhật ký hiện cho cả vai trò không xem được NCC.
   */
  chonNCCChoBaoGia: (
    bgId: string,
    nccId: string,
    tenNCC: string,
    nguoiThucHien: string,
    lyDo?: string,
    /** Tài liệu dẫn chứng cho quyết định — xem `tepChonNCC` ở `kieu-du-lieu.ts`. */
    tep?: MoTaTep[],
  ) => void;
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
  /**
   * Nhân viên ghi ĐỀ XUẤT chọn nhà cung cấp kèm dẫn chứng (bước ②).
   * ⚠️ Chỉ là kiến nghị — không chốt NCC, không đổi trạng thái bảng.
   */
  luuDeXuatNCC: (
    bgId: string,
    deXuat: { nccId: string; tenNCC: string; lyDo: string },
    nguoiThucHien: string,
  ) => void;
  /** Lưu hình thức thanh toán / thời gian giao / ghi chú của một nhà cung cấp. */
  luuThongTinNCC: (bgId: string, tt: ThongTinThuongMaiNCC, nguoiThucHien: string) => void;
  trinhXetDuyetBaoGia: (bgId: string, nguoiThucHien: string) => void;
  /**
   * Ghi đề xuất chọn nhà cung cấp theo ĐỀ NGHỊ — tự lập hồ sơ xét duyệt nếu đề nghị chưa có.
   *
   * 🔴 DÙNG HÀM NÀY Ở GIAO DIỆN BƯỚC ②, không dùng `luuDeXuatNCC`: đề nghị vào bước ② bằng đường
   * phân bổ hết dòng thì KHÔNG có hồ sơ báo giá nào, nên giao diện không có `bgId` để truyền —
   * và trước 20/08/2026 điều đó làm cả khối đề xuất lẫn nút trình **không hiện**, người dùng
   * không có đường chuyển bước.
   *
   * Trả lý do bị chặn, `null` là đã ghi.
   */
  luuDeXuatNCCChoDeNghi: (
    prId: string,
    deXuat: { nccId: string; tenNCC: string; lyDo: string },
    nguoiThucHien: string,
  ) => string | null;
  /** Trình xét duyệt theo ĐỀ NGHỊ. Trả lý do bị chặn, `null` là đã trình. */
  trinhXetDuyetBaoGiaChoDeNghi: (prId: string, nguoiThucHien: string) => string | null;
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
  /**
   * Sửa tiêu đề / công trình / hợp đồng CĐT / mức độ ưu tiên / bộ phận / nhóm đề xuất /
   * link phiếu đề nghị.
   *
   * ⚠️ `Partial<>`: chỉ gửi những trường THẬT SỰ muốn đổi. Trường `undefined` được giữ nguyên,
   * khác hẳn gửi chuỗi rỗng (nghĩa là xóa). Hộp "Sửa thông tin chung" gửi 4 trường của nó, hộp
   * "Chỉnh sửa các trường dữ liệu tùy chỉnh" gửi bộ khác — cùng một đường ghi, cùng một chỗ
   * ghi nhật ký.
   */
  suaThongTinChung: (
    prId: string,
    moi: Partial<
      Pick<
        DeNghiMuaHang,
        | "tieuDe"
        | "tenCongTrinh"
        | "maHopDongCDT"
        | "mucDoUuTien"
        | "phongBanNguon"
        | "nhomDeXuat"
        | "linkPhieuDeNghi"
      >
    >,
    nguoiThucHien: string,
  ) => void;
  /** Đổi ngày cần hàng — bắt ghi lý do vì đây là cam kết với công trình. */
  suaThoiHan: (prId: string, ngayCanHangMoi: string, lyDo: string, nguoiThucHien: string) => void;
  /** Lưu trữ / bỏ lưu trữ — chỉ ẩn khỏi bảng, không đổi trạng thái nghiệp vụ. */
  doiLuuTru: (prId: string, luuTru: boolean, nguoiThucHien: string) => void;
  /** Sửa danh sách trường bổ sung (dữ liệu tùy chỉnh). */
  suaTruongBoSung: (prId: string, truong: TruongBoSung[], nguoiThucHien: string) => void;
  /** Nhân bản đề nghị — trả về id bản mới, chuỗi rỗng nếu hết id dự phòng. */
  /**
   * Nhân bản đề nghị để TÁCH PHIẾU giao cho nhiều nhân viên.
   * `sttGiuLai` = số thứ tự các dòng vật tư giữ lại; bỏ trống thì giữ hết.
   * Trả về id phiếu mới, hoặc "" nếu hết mã dự phòng / không giữ dòng nào.
   */
  /**
   * Sửa danh sách mặt hàng: thêm dòng, sửa dòng, bớt dòng trong một lần lưu.
   * Trả về câu giải thích nếu không lưu được, `null` nếu xong.
   */
  suaMatHangDeNghi: (prId: string, dongMoi: DongDeNghi[], nguoiThucHien: string) => string | null;
  /**
   * Tách phiếu. `duocPhep` là hàm kiểm quyền theo TỪNG hồ sơ — truyền vào để hàm tự chặn,
   * đừng chỉ dựa vào việc giao diện đã ẩn nút.
   */
  nhanBanDeNghi: (
    prId: string,
    /** Người bấm nhân bản — nhận luôn phần việc của bản mới (Ban lãnh đạo 15/08/2026). */
    nguoi: { uid: string; ten: string },
    sttGiuLai?: number[],
    duocPhep?: (deNghi: DeNghiMuaHang) => boolean,
  ) => string;
  /**
   * Tách phiếu thành nhiều phiếu con theo phân công của trưởng bộ phận — mỗi người nhận
   * đúng những dòng mình được giao (Ban lãnh đạo 15/08/2026).
   *
   * Trả `null` khi không tách (chỉ một người phụ trách, còn dòng chưa giao, hết mã dự phòng,
   * hoặc phiếu này vốn đã là bản tách).
   */
  tachTheoPhanBo: (
    prId: string,
    nguoiThucHienTen: string,
  ) => { soPhieu: number; ten: string[] } | null;
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
  boNguoiTheoDoi: (prId: string, uid: string, nguoiBoTen: string) => void;

  // --- Công việc bắt buộc của giai đoạn (mục "Danh sách công việc" trên Base) ---
  /**
   * Tích / bỏ tích một công việc bắt buộc của giai đoạn. Bỏ tích được (tích nhầm sửa lại
   * được), mọi lần đổi đều vào nhật ký đề nghị.
   */
  /**
   * Ghi một dòng vào nhật ký đề nghị.
   *
   * 🔴 KHÔNG ghi tên nhà cung cấp qua đây — khối Lịch sử hiện cho cả vai trò không được xem
   * NCC (quy ước ở CLAUDE.md mục 7).
   */
  ghiLichSuDeNghi: (prId: string, nguoiThucHien: string, hanhDong: string) => void;

  /**
   * Đặt số báo giá cần lấy cho MỌI dòng của phiếu — dùng ở hộp chuyển sang bước ②
   * (trường bắt buộc "SL Báo giá" theo mẫu Base).
   */
  datSoBaoGiaChoPhieu: (prId: string, soBaoGia: number, nguoiThucHien: string) => void;

  danhDauCongViecGiaiDoan: (
    prId: string,
    congViec: CongViecGiaiDoan,
    giaiDoan: string,
    xong: boolean,
    nguoiTen: string,
  ) => void;

  // --- Tệp đính kèm của từng bước (Ban lãnh đạo 17/08/2026) ---
  /**
   * Gắn thêm tệp vào MỘT BƯỚC của đề nghị. `tepMoi` là phần mô tả các tệp ĐÃ cất xong ở
   * kho tệp — hàm này chỉ ghi vào hồ sơ, không đụng tới nội dung tệp.
   *
   * Trả lý do bị chặn, `null` là đã ghi.
   */
  themTepGiaiDoan: (
    prId: string,
    maGiaiDoan: string,
    tepMoi: MoTaTep[],
    nguoiThucHienTen: string,
  ) => string | null;
  /**
   * Đặt một tệp vào "ô có tên" của một bước — THÊM TỆP VÀ GẮN NHÃN TRONG MỘT LẦN GHI.
   *
   * 🔴 LUÔN DÙNG HÀM NÀY khi cần tệp mang nhãn, KHÔNG gọi `themTepGiaiDoan` rồi
   * `datGhiChuTepGiaiDoan` nối tiếp — lý do đầy đủ ở phần cài đặt, tóm lại: hàm thứ hai đọc
   * `deNghiRef.current` mà ref chỉ cập nhật lúc render, nên nó không thấy tệp vừa thêm và
   * **nhãn rơi mất im lặng**.
   *
   * Ô đã có tệp mang cùng nhãn thì bản cũ bị GỠ (đây là hành vi "thay tệp").
   * Trả lý do bị chặn, `null` là đã ghi.
   */
  datTepVaoOGiaiDoan: (
    prId: string,
    maGiaiDoan: string,
    tepMoi: MoTaTep,
    nhanO: string,
    nguoiThucHienTen: string,
  ) => string | null;
  /**
   * Gỡ một tệp khỏi một bước. Trả lý do bị chặn, `null` là đã gỡ.
   *
   * ⚠️ CHỈ GỠ KHỎI HỒ SƠ, KHÔNG xóa nội dung khỏi kho tệp — giống cách khối bình luận đang
   * làm. Gỡ nhầm thì chứng từ vẫn còn để tìm lại; xóa thẳng là mất hẳn.
   */
  goTepGiaiDoan: (
    prId: string,
    maGiaiDoan: string,
    tepId: string,
    nguoiThucHienTen: string,
  ) => string | null;
  /**
   * Đặt / sửa / bỏ GHI CHÚ của một tệp đã đính kèm vào một bước.
   * Trả lý do bị chặn, `null` là đã ghi.
   *
   * 🔴 Ghi chú là NHÃN NGƯỜI ĐỌC ĐƯỢC thay cho tên tệp máy sinh — xem `MoTaTep.ghiChu`.
   *
   * ⚠️ `ghiChu` rỗng (hoặc chỉ toàn khoảng trắng) nghĩa là XÓA ghi chú, không lưu chuỗi rỗng
   * vào hồ sơ. Có như vậy thì chỗ hiển thị chỉ cần hỏi `t.ghiChu` là đủ, không phải nhớ kiểm
   * thêm chuỗi rỗng ở từng nơi.
   */
  datGhiChuTepGiaiDoan: (
    prId: string,
    maGiaiDoan: string,
    tepId: string,
    ghiChu: string,
    nguoiThucHienTen: string,
  ) => string | null;

  // --- Bình luận trao đổi (Ban lãnh đạo 15/08/2026) ---
  /**
   * Viết một lời bình vào hồ sơ. `tep` là phần mô tả ảnh/tài liệu đã cất xong ở kho tệp.
   *
   * 🔴 KHÔNG ghi bình luận vào `lichSu`. Nhật ký là thứ app tự ghi để truy trách nhiệm; chen
   * chữ người dùng gõ tay vào đó là làm hỏng giá trị làm bằng chứng của nó.
   */
  vietBinhLuan: (
    prId: string,
    nguoi: { uid: string; ten: string },
    noiDung: string,
    tep?: MoTaTep[],
    traLoiChoId?: string,
  ) => void;
  /**
   * Sửa một lời bình. Trả lý do bị chặn, `null` là sửa xong.
   *
   * ⚠️ CHỈ NGƯỜI VIẾT sửa được bài của mình — chốt chặn nằm trong hàm, không chỉ ở giao diện.
   */
  suaBinhLuan: (
    prId: string,
    binhLuanId: string,
    nguoi: { uid: string; ten: string },
    noiDungMoi: string,
    tepThem?: MoTaTep[],
    /** Id các tệp gỡ khỏi bài — nội dung tệp KHÔNG bị xóa, chỉ gỡ khỏi bài. */
    idTepGo?: string[],
  ) => string | null;

  /**
   * Trưởng bộ phận bấm "Chuyển tiếp": bàn giao đề nghị cho các nhân viên đã được
   * phân bổ, để họ làm tiếp các bước sau (lập đơn, chọn NCC...).
   * Trả về danh sách tên đã gửi tới — rỗng nghĩa là chưa phân bổ cho ai.
   */
  chuyenTiepChoNhanVien: (prId: string, nguoiChuyenTen: string, loiNhan?: string) => string[];

  // --- Thông báo chuyển bước + tiếp nhận công tác ---
  /** Thông báo chuyển bước, mới nhất đứng đầu (tự sinh khi đề nghị đổi bước). */
  thongBao: ThongBaoChuyenBuoc[];
  /** Cấu hình quy trình đang áp dụng — xem `2-quy-trinh/cau-hinh-quy-trinh.ts`. */
  cauHinh: CauHinhQuyTrinh;
  /** Vết đổi cấu hình, mới nhất lên đầu — dùng để giải thích vì sao hồ sơ cũ hiện khác. */
  lichSuCauHinh: VetDoiCauHinh[];
  /**
   * Lưu cấu hình mới. Trả về danh sách lỗi (mảng rỗng = đã lưu).
   * ⚠️ Cấu hình dùng chung cả phòng — sửa là đổi luật cho mọi người.
   */
  luuCauHinhQuyTrinh: (moi: CauHinhQuyTrinh, nguoiThucHien: string) => string[];
  /** Đánh dấu toàn bộ thông báo là đã đọc — gọi khi người dùng mở chuông. */
  /** Đánh dấu đã đọc CHỈ các thông báo có mã trong danh sách — xem ghi chú ở hàm. */
  danhDauDaDocThongBao: (ids: string[]) => void;
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

// ------------------------------------------------------------
// LUẬT BÌNH LUẬN (Ban lãnh đạo 16/08/2026: chỉ sửa, không xóa, có lưu vết)
//
// 🔴 Ba con số dưới đây tồn tại vì KHO DỮ LIỆU CẢ PHÒNG NẰM TRONG MỘT DOCUMENT FIRESTORE,
// mà Firestore giới hạn 1MB mỗi document. Lưu vết sửa nghĩa là mỗi lần sửa lại nhân đôi phần
// chữ của bài đó — không chặn thì tới lúc nào đó lần ghi bị từ chối và CẢ PHÒNG mất dữ liệu
// vừa nhập, chứ không riêng bình luận.
// ------------------------------------------------------------

/** Số ký tự tối đa một bình luận. Chặn ở tầng dữ liệu, không chỉ ở ô nhập. */
const DAI_TOI_DA_BINH_LUAN = 1000;
/** Sửa quá số lần này thì khóa — nên viết bình luận bổ sung thay vì sửa mãi một bài. */
const SO_LAN_SUA_BINH_LUAN_TOI_DA = 10;
/** Số mốc sửa giữ lại. Vượt thì bỏ mốc cũ nhất (trừ bản gốc — xem `catLichSuSua`). */
const SO_MOC_SUA_GIU_LAI = 10;

/**
 * Số tệp tối đa đính kèm cho MỘT BƯỚC của đề nghị.
 *
 * 📌 Lấy đúng con số của khối bình luận (`khoi-trao-doi.tsx` → `TOI_DA_TEP = 5`): đủ cho một
 * bộ ảnh chụp chứng từ mà không làm hồ sơ phình. Cỡ mỗi tệp dùng `CO_TOI_DA` chung của kho
 * tệp (10MB), không đặt riêng.
 *
 * 🔴 EXPORT ĐỂ GIAO DIỆN DÙNG LẠI, đừng chép số ra file giao diện. Khối bình luận đang chép
 * (`DAI_TOI_DA` viết lại ở `khoi-trao-doi.tsx`) — hai chỗ giữ cùng một con số là sớm muộn
 * lệch nhau, mà lệch kiểu đó không có lỗi nào báo: ô nhập cho chọn 5 tệp còn tầng dữ liệu
 * chặn ở 3, người dùng chỉ thấy tệp "biến mất".
 */
export const TOI_DA_TEP_MOI_BUOC = 5;

/**
 * Số lượt "không duyệt" giữ lại trên một bảng báo giá (`BaoGia.lanTraLai`).
 *
 * 📌 20 chứ không phải 5: đây là SỔ KIỂM TOÁN của bước xét duyệt, cắt ngắn là mất đúng thứ sinh
 * ra nó. Ước lượng: 20 lượt × 12 phiếu ≈ vài chục KB — không đáng kể so với hạn 1MB của document
 * dùng chung, trong khi `lichSu` hiện KHÔNG có trần nào và mới là chỗ phình thật.
 */
const SO_LAN_TRA_LAI_GIU_LAI = 20;

/**
 * Số ký tự tối đa của một ghi chú tệp — Ban lãnh đạo 17/08/2026.
 *
 * 🔴 CHẶN Ở TẦNG DỮ LIỆU, không chỉ ở ô nhập. Kho dữ liệu cả phòng nằm trong MỘT document
 * Firestore mà Firestore chỉ cho 1MB mỗi document; mỗi bước 5 tệp × 6 bước × 12 đề nghị, thả
 * cho gõ tự do là ăn dần vào đúng cái hạn mức đó, và lần ghi bị từ chối thì CẢ PHÒNG mất dữ
 * liệu vừa nhập chứ không riêng ghi chú.
 *
 * 📌 200 ký tự là đủ cho một nhãn kiểu *"Báo giá công ty A, đã có dấu, giao hàng 15 ngày"* —
 * ghi chú là NHÃN của chứng từ, cần dài hơn thì viết vào khối Trao đổi (1000 ký tự).
 *
 * 🔴 EXPORT ĐỂ GIAO DIỆN DÙNG LẠI, đừng chép số ra file giao diện — cùng lý do đã ghi ở
 * `TOI_DA_TEP_MOI_BUOC` ngay trên.
 */
export const DAI_TOI_DA_GHI_CHU_TEP = 200;

/**
 * Tên tệp rút ngắn để ghi vào MỘT DÒNG NHẬT KÝ.
 *
 * 🔴 KHÔNG gọi `rutGonTenTep` của giao diện: tầng `3-du-lieu` không được nhập từ
 * `1-giao-dien` (phụ thuộc ngược tầng). Việc cũng khác nhau — bên kia rút cho VỪA Ô trên màn
 * hình, còn đây rút để dòng nhật ký không phình: tên ảnh tải từ Zalo dài 88 ký tự, cộng thêm
 * 200 ký tự ghi chú là một dòng nhật ký gần 300 ký tự, mà nhật ký nằm chung trong document
 * Firestore 1MB của cả phòng.
 *
 * Giữ lại phần đuôi vì đó là thứ cho biết chứng từ là ảnh hay PDF.
 */
function tenTepChoNhatKy(ten: string, toiDa = 32): string {
  if (ten.length <= toiDa) return ten;
  const cham = ten.lastIndexOf(".");
  // Không có đuôi, hoặc "đuôi" dài bất thường (không phải phần mở rộng thật) → cắt bình thường.
  if (cham <= 0 || ten.length - cham > 8) return `${ten.slice(0, toiDa - 1)}…`;
  const duoi = ten.slice(cham);
  return `${ten.slice(0, Math.max(1, toiDa - duoi.length - 1))}…${duoi}`;
}

/**
 * Tên bước để ghi vào nhật ký.
 *
 * 📌 Nhật ký là thứ NGƯỜI ĐỌC, nên ghi *"bước Yêu cầu NCC báo giá"* chứ không ghi mã máy
 * `yeu_cau_bao_gia`. Mã lạ chỉ có người lập trình hiểu.
 *
 * ⚠️ Nhận `string` chứ không nhận `GiaiDoanMuaHang`: khóa của `tepGiaiDoan` để kiểu chuỗi
 * (xem chú thích ở `kieu-du-lieu.ts`), và dữ liệu cũ trên kho chung có thể mang mã đã bỏ.
 * Tra không ra thì trả về chính mã đó, còn hơn ghi "undefined" vào hồ sơ.
 */
function tenBuoc(maGiaiDoan: string): string {
  return NHAN_GIAI_DOAN[maGiaiDoan as GiaiDoanMuaHang]?.nhan ?? maGiaiDoan;
}

/**
 * Cắt bớt lịch sử sửa cho khỏi phình, theo hai nguyên tắc:
 *
 *   1. **BẢN GỐC KHÔNG BAO GIỜ MẤT NỘI DUNG.** Đây là thứ có giá trị nhất khi đối chất: bài
 *      lúc đầu viết gì. Bỏ nó đi thì cả cơ chế lưu vết mất ý nghĩa.
 *   2. Hai lần sửa gần nhất giữ nguyên nội dung; các lần ở giữa chỉ giữ MỐC (ai · lúc nào),
 *      bỏ phần chữ. Vẫn thấy đủ "bài này bị sửa mấy lần, ai sửa", chỉ không đọc lại được
 *      từng bản trung gian.
 *
 * ⚠️ Chỗ nào không còn nội dung thì giao diện phải NÓI THẲNG *"không còn lưu nội dung bản
 * này"*, đừng để trống cho người đọc tưởng bản đó rỗng.
 */
function catLichSuSua(ds: LanSuaBinhLuan[]): LanSuaBinhLuan[] {
  const giu = ds.length > SO_MOC_SUA_GIU_LAI ? [ds[0], ...ds.slice(-(SO_MOC_SUA_GIU_LAI - 1))] : ds;
  return giu.map((m, i) => {
    const laGoc = i === 0;
    const laHaiLanCuoi = i >= giu.length - 2;
    if (laGoc || laHaiLanCuoi) return m;
    // Giữ mốc (ai · lúc nào), bỏ phần chữ — vẫn thấy bài bị sửa mấy lần và ai sửa.
    return { thoiDiem: m.thoiDiem, nguoiSuaUid: m.nguoiSuaUid, nguoiSuaTen: m.nguoiSuaTen };
  });
}

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
  /**
   * Nhà cung cấp do bộ phận thu mua tự thêm — Ban lãnh đạo 20/08/2026.
   *
   * 📌 CHỈ giữ phần NGƯỜI DÙNG THÊM. Danh mục mẫu `NHA_CUNG_CAP` vẫn nằm trong mã nguồn và được
   * gộp vào lúc đọc ra (`nhaCungCap` trong giá trị context). Làm vậy thì bản chạy thử không phải
   * chép 4 dòng mẫu lên kho chung của cả phòng, và sau này bỏ dữ liệu mẫu đi cũng không mất gì.
   */
  const [nhaCungCapThem, setNhaCungCapThem] = useState<NhaCungCap[]>([]);
  /**
   * ★ CẤU HÌNH QUY TRÌNH — Ban lãnh đạo 13/08/2026: *"thêm chức năng cài đặt quy trình, có
   * thể chỉnh sửa các điều kiện trong quy trình"*.
   *
   * ⚠️ Khởi tạo bằng MẶC ĐỊNH, không phải `undefined`. Để `undefined` thì mọi chỗ đọc cấu
   * hình phải tự lo trường hợp thiếu, và sớm muộn có một chỗ quên — khi đó ngưỡng duyệt
   * thành `NaN` và app so sánh giá trị đơn với `NaN` (luôn sai) mà không báo gì.
   */
  const [cauHinh, setCauHinh] = useState<CauHinhQuyTrinh>(CAU_HINH_MAC_DINH);
  /** Vết đổi cấu hình — mới nhất lên đầu. Xem lý do bắt buộc ghi ở `VetDoiCauHinh`. */
  const [lichSuCauHinh, setLichSuCauHinh] = useState<VetDoiCauHinh[]>([]);
  /**
   * ⚠️ Cần REF để `luuCauHinhQuyTrinh` đọc được cấu hình CŨ mà không phải phụ thuộc `cauHinh`
   * — phụ thuộc thì hàm dựng lại mỗi lần cấu hình đổi, và mọi component nhận nó qua context
   * lại vẽ lại theo.
   */
  const cauHinhRef = useRef(cauHinh);
  cauHinhRef.current = cauHinh;

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
    /**
     * 🔴 ĐÁNH DẤU "thay đổi này ĐẾN TỪ NƠI KHÁC, không phải việc máy này vừa làm".
     *
     * Effect suy giai đoạn bên dưới báo chuông mỗi khi thấy đề nghị đổi bước. Nó không phân
     * biệt được thay đổi do người ngồi máy này làm hay do kho chung đẩy về — nên trước
     * 14/08/2026, một người chuyển bước là CẢ PHÒNG mỗi máy tự sinh thêm một thông báo y
     * hệt. Chuông đầy dòng lặp, người dùng bỏ qua hết rồi lỡ thông báo thật; danh sách lại
     * cắt ở 30 dòng nên thông báo thật bị đẩy rơi sớm hơn.
     *
     * Người tạo ra thay đổi đã sinh thông báo và đẩy lên kho chung rồi, các máy khác chỉ
     * việc nhận — không tự sinh thêm bản của mình.
     */
    dangNhanTuNoiKhac.current = true;
    setDeNghi(d.deNghi);
    setDonHang(d.donHang);
    setGiaDonHang(d.giaDonHang);
    setPhieuNhan(d.phieuNhan);
    setBaoGia(d.baoGia);
    setThongBao(d.thongBao);
    /* 🔴 THIẾU KHÓA ≠ "danh mục rỗng" — cùng loại bẫy với `cauHinh` ngay dưới. Bản lưu cũ không
       có `nhaCungCapThem`; ghi `[]` vào lúc đó là xóa mất nhà cung cấp người khác vừa thêm khi
       một máy chưa cập nhật nhận dữ liệu về. */
    if (Array.isArray(d.nhaCungCapThem)) setNhaCungCapThem(d.nhaCungCapThem);
    /**
     * 🔴 THIẾU KHÓA `cauHinh` ≠ "cấu hình là mặc định" — GIỮ NGUYÊN cái đang có.
     *
     * Đã dính lỗi thật ngày 13/08/2026: lưu ngưỡng 15 triệu xong, mở lại trang là về 10 triệu.
     * Nguyên nhân: bản dữ liệu trên kho chung được tạo TRƯỚC khi có tính năng cài đặt nên
     * không có khóa `cauHinh`; `?? CAU_HINH_MAC_DINH` biến "máy chủ chưa biết gì về cấu hình"
     * thành "cấu hình là mặc định", rồi effect ghi đẩy giá trị mặc định đó lên đè mất cài đặt
     * vừa lưu. Đúng cái bẫy CLAUDE.md mục 3.6b đã ghi: `null` khác bộ dữ liệu rỗng.
     *
     * ⚠️ Trạng thái khởi tạo đã là `CAU_HINH_MAC_DINH` nên bỏ qua ở đây là an toàn: lần nạp
     * đầu tiên vẫn có cấu hình mặc định, không bao giờ `undefined`.
     *
     * 🔴 CÓ cấu hình thì phải GỘP VỚI MẶC ĐỊNH, đừng gán thẳng. Cấu hình lưu nguyên khối nên
     * mỗi lần thêm tham số mới là mọi bản lưu trước đó thiếu khóa đó; gán thẳng thì khóa mới
     * thành `undefined` và chỗ đọc `cauHinh.<bảng>[bước]` **sập cả trang** (màn hình trắng,
     * không phải sai số liệu). Thực tế: cấu hình lưu 13/08/2026, khóa `congViecTheoBuoc`
     * thêm 14/08/2026. Xem `gopCauHinhVoiMacDinh`.
     */
    if (d.cauHinh) setCauHinh(gopCauHinhVoiMacDinh(d.cauHinh));
    if (d.lichSuCauHinh) setLichSuCauHinh(d.lichSuCauHinh);
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
    const d = {
      deNghi,
      donHang,
      giaDonHang,
      phieuNhan,
      baoGia,
      thongBao,
      cauHinh,
      lichSuCauHinh,
      nhaCungCapThem,
    };
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
  }, [daNapTuMay, deNghi, donHang, giaDonHang, phieuNhan, baoGia, thongBao, cauHinh, lichSuCauHinh, nhaCungCapThem, dayLenMayChu]);

  /**
   * ★ THÊM NHÀ CUNG CẤP VÀO DANH MỤC — Ban lãnh đạo 20/08/2026: *"tạo danh mục NCC do bộ phận thu
   * mua điền thông tin"*.
   *
   * Trả câu giải thích khi bị chặn, `null` là đã thêm.
   *
   * 🔴 CHẶN TRÙNG THEO MÃ **VÀ** THEO TÊN. Trùng mã thì hai bên khác nhau mang cùng mã, mọi chứng
   * từ sau đó không truy được về đúng đối tượng. Trùng tên thì danh sách có hai dòng nhìn y hệt,
   * người lập đơn chọn bừa một cái — và công nợ của một nhà cung cấp bị chia làm hai.
   *
   * ⚠️ So tên KHÔNG PHÂN BIỆT hoa thường và dấu cách thừa: *"Công ty TNHH  A"* và *"CÔNG TY TNHH
   * A"* là một bên. So chuỗi thô là để lọt đúng loại trùng hay gặp nhất.
   *
   * 📌 `id` sinh từ mã người dùng đặt, không dùng thời điểm: mã là thứ họ nhìn thấy và tra cứu,
   * nên khóa kỹ thuật bám theo nó thì về sau đối chiếu dễ hơn.
   */
  const themNhaCungCap = useCallback(
    (n: {
      maNCC: string;
      ten: string;
      maSoThue?: string;
      diaChi?: string;
      dienThoai?: string;
      nguoiLienHe?: string;
    }): string | null => {
      const ma = n.maNCC.trim();
      const ten = n.ten.trim();
      if (ma === "") return "Chưa có mã nhà cung cấp.";
      if (ten === "") return "Chưa có tên nhà cung cấp.";

      const chuanHoaTen = (s: string) => boDau(s).replace(/\s+/g, " ").trim().toLowerCase();
      const daCo = [...NHA_CUNG_CAP, ...nhaCungCapThem];
      if (daCo.some((x) => (x.maNCC ?? "").trim().toLowerCase() === ma.toLowerCase())) {
        return `Mã ${ma} đã có trong danh mục — dùng lại nhà cung cấp đó, hoặc đặt mã khác.`;
      }
      if (daCo.some((x) => chuanHoaTen(x.ten) === chuanHoaTen(ten))) {
        return `Đã có nhà cung cấp tên “${ten}” trong danh mục.`;
      }

      const moi: NhaCungCap = {
        id: `ncc-them-${ma.toLowerCase().replace(/\s+/g, "-")}`,
        ten,
        maNCC: ma,
        ...(n.maSoThue?.trim() ? { maSoThue: n.maSoThue.trim() } : {}),
        ...(n.diaChi?.trim() ? { diaChi: n.diaChi.trim() } : {}),
        ...(n.dienThoai?.trim() ? { dienThoai: n.dienThoai.trim() } : {}),
        ...(n.nguoiLienHe?.trim() ? { nguoiLienHe: n.nguoiLienHe.trim() } : {}),
      };
      setNhaCungCapThem((truoc) => [...truoc, moi]);
      return null;
    },
    [nhaCungCapThem],
  );

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
  /**
   * Cầu nối tới `tachTheoPhanBo` — hàm đó khai báo phía dưới nên effect ở trên không gọi
   * thẳng được. Dùng ref thay vì dời hàm lên: dời lên là phải kéo theo cả cụm `homNay`,
   * `ID_DE_NGHI_GIA_LAP`, làm rối thứ tự đọc của file.
   */
  const tachTheoPhanBoRef = useRef<
    ((prId: string, nguoiThucHienTen: string) => { soPhieu: number; ten: string[] } | null) | null
  >(null);

  // ------------------------------------------------------------
  // THÔNG BÁO CHUYỂN BƯỚC — theo dõi giai đoạn SUY RA của từng đề nghị.
  // Giai đoạn không lưu trong dữ liệu (nguyên tắc ở 2-quy-trinh/giai-doan-mua-hang)
  // nên cứ mỗi lần dữ liệu đổi thì so bước trước/sau: khác là báo. Nhờ vậy bắt được
  // MỌI đường chuyển bước — kéo thả, chọn NCC, lập đơn, ghi phiếu nhận, xác nhận...
  // ------------------------------------------------------------
  const giaiDoanTruocRef = useRef<Map<string, GiaiDoanMuaHang> | null>(null);
  const soThuTuThongBao = useRef(0);
  /**
   * Cờ: lượt cập nhật state sắp tới là do nhận dữ liệu từ nơi khác (kho chung / bản lưu trên
   * máy), không phải do người ngồi máy này vừa thao tác. Đặt trong `apDung`, hạ ngay trong
   * effect suy giai đoạn. Xem giải thích đầy đủ ở `apDung`.
   */
  const dangNhanTuNoiKhac = useRef(false);
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

    /**
     * 🔴 THAY ĐỔI ĐẾN TỪ NƠI KHÁC THÌ KHÔNG SINH THÔNG BÁO — người tạo ra nó đã sinh rồi.
     *
     * ⚠️ Vẫn phải cập nhật `giaiDoanTruocRef` (đã làm ngay ở trên, TRƯỚC câu này) rồi mới
     * thoát. Thoát sớm hơn là mốc so sánh đứng yên, lần đổi bước kế tiếp sẽ so với mốc cũ
     * và báo nhầm cả những bước đã đi qua từ lâu.
     */
    if (dangNhanTuNoiKhac.current) {
      dangNhanTuNoiKhac.current = false;
      return;
    }

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

    /**
     * ★ TỰ TÁCH PHIẾU KHI VÀO BƯỚC ② — Ban lãnh đạo 15/08/2026: *"Khi trưởng phòng giao việc
     * cho nhân viên khác nhau thì ở bước 2 sẽ tự copy đề nghị đó ra và công việc ứng với các
     * tích chọn của trưởng phòng"*.
     *
     * 🔴 ĐẶT TRONG CHÍNH EFFECT NÀY, không tách ra effect riêng. Effect này là chỗ duy nhất
     * biết bước TRƯỚC và bước SAU, và quan trọng hơn: nó giữ cờ `dangNhanTuNoiKhac` rồi hạ
     * xuống ngay khi dùng xong. Một effect thứ hai đọc cờ đó sẽ luôn thấy cờ đã hạ, nên khi
     * kho chung đẩy về một phiếu vừa được MÁY KHÁC tách, máy này sẽ tách thêm một lần nữa —
     * cùng một phiếu bị chia hai lần, khối lượng bốc hơi.
     *
     * 📌 Không sợ lặp vô hạn: tách xong mỗi phiếu chỉ còn một người phụ trách, mà một người
     * thì `tinhPhuongAnTach` trả `tach: false`.
     *
     * ⚠️ Người thực hiện ghi là "Hệ thống" vì đúng là app tự làm, không ai bấm nút. Muốn biết
     * ai gây ra thì đọc dòng nhật ký phân bổ ngay phía trên — nó có tên trưởng bộ phận.
     */
    for (const dn of deNghi) {
      if (truoc.get(dn.id) !== "tiep_nhan" || hienTai.get(dn.id) !== "yeu_cau_bao_gia") continue;
      const kq = tachTheoPhanBoRef.current?.(dn.id, "Hệ thống");
      if (kq) {
        toast.info(`Đã tách ${dn.code} thành ${kq.soPhieu} phiếu`, {
          description: `Mỗi người một phiếu theo phân công: ${kq.ten.join(", ")}.`,
        });
      }
    }
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

  /**
   * ★ GHI NHẬT KÝ CHO MỘT THAO TÁC TRÊN ĐƠN ĐẶT HÀNG — MỘT CHỖ ĐỊNH TUYẾN DUY NHẤT.
   *
   * 🔴 VÌ SAO CÓ (18/08/2026): từ khi đơn được phép KHÔNG gắn đề nghị (module "Lập đơn mua
   * hàng (PO)" độc lập), gọi thẳng `ghiLichSuDeNghi(po.prId, …)` là **ghi rơi mất im lặng** —
   * hàm trên `map` qua danh sách đề nghị tìm `dn.id === undefined`, không khớp dòng nào, không
   * một dòng báo lỗi. Sáu thao tác (lập đơn · ghi phiếu nhận · duyệt/từ chối phiếu · đính kèm
   * phiếu giao · thủ kho xác nhận · trưởng bộ phận xác nhận hoàn thành) sẽ không để lại dấu
   * vết nào.
   *
   * Luật định tuyến:
   *   · Đơn CÓ `prId`  → ghi vào `DeNghiMuaHang.lichSu` **y như cũ**, không đổi một ly.
   *   · Đơn KHÔNG có   → ghi vào `DonDatHang.lichSu` của chính đơn đó.
   *
   * 🔴 KHÔNG ghi cả hai chỗ, và KHÔNG chuyển đơn có đề nghị sang ghi vào đơn: một hồ sơ chỉ
   * được có MỘT dòng thời gian, tách làm hai là người đọc phải ghép tay rồi bỏ sót một nửa.
   *
   * ⚠️ Không ghi tên nhà cung cấp vào nhật ký (quy ước phiên 04) — chỗ gọi phải tự lo, hàm
   * này chỉ nhận chuỗi đã dựng sẵn.
   */
  const ghiNhatKyDonHang = useCallback(
    (po: Pick<DonDatHang, "id" | "prId">, nguoiThucHien: string, hanhDong: string) => {
      if (po.prId) {
        ghiLichSuDeNghi(po.prId, nguoiThucHien, hanhDong);
        return;
      }
      setDonHang((truoc) =>
        truoc.map((p) =>
          p.id !== po.id
            ? p
            : {
                ...p,
                lichSu: [
                  ...(p.lichSu ?? []),
                  { thoiDiem: thoiDiemHienTai(), nguoiThucHien, hanhDong },
                ],
              },
        ),
      );
    },
    [ghiLichSuDeNghi],
  );

  const themDeNghiGiaLap = useCallback((dauVao: DauVaoDeNghiGiaLap) => {
    const hienCo = deNghiRef.current;

    // Lấy id dự phòng đầu tiên chưa dùng — hosting tĩnh chỉ mở được địa chỉ đã sinh sẵn.
    const id = ID_DE_NGHI_GIA_LAP.find((x) => !hienCo.some((dn) => dn.id === x));
    if (!id) return "";

    // Số thứ tự chạy THEO DỰ ÁN, đúng quy tắc mã hồ sơ Thông báo 09/2026.
    // 🔴 Luật sinh mã ở `2-quy-trinh/dat-ten-de-nghi.ts` — KHÔNG đếm số phiếu hiện có rồi +1,
    // vì xóa một phiếu là mã tiếp theo trùng với phiếu đang tồn tại. Xem chú thích ở đó.
    const code = maDeNghiTiepTheo(
      dauVao.maDuAn,
      hienCo.map((dn) => dn.code),
    );

    const moi: DeNghiMuaHang = {
      id,
      code,
      maDuAn: dauVao.maDuAn,
      maHopDongCDT: dauVao.maHopDongCDT || undefined,
      tenCongTrinh: dauVao.tenCongTrinh,
      /**
       * ★ TÊN ĐỀ NGHỊ theo công thức của quy trình mua hàng — Ban lãnh đạo 13/08/2026:
       * *"đây là công thức đặt tên của quy trình mua hàng, e setup theo"*.
       *
       *     mã đề xuất  -  tên hợp đồng,  TÊN CÔNG TRÌNH
       *
       * 🔴 SINH Ở ĐÂY chứ không ở màn nhập, vì công thức cần MÃ ĐỀ NGHỊ mà mã chỉ có sau khi
       * biết phiếu này là phiếu thứ mấy của dự án — tức chỉ có tại đúng chỗ này.
       *
       * ⚠️ Chỉ áp cho phòng ban CÓ công thức (hiện là Phòng Thi công). Phòng khác giữ tên
       * người lập tự gõ — xem `coCongThucTuDong`.
       */
      tieuDe: coCongThucTuDong(dauVao.phongBanNguon)
        ? dungTenDeNghi({
            maDeNghi: code,
            maHopDongCDT: dauVao.maHopDongCDT,
            tenCongTrinh: dauVao.tenCongTrinh,
          })
        : dauVao.tieuDe,
      // 🔴 Từ 12/08/2026 nhận đề xuất từ MỌI phòng ban (chỉ đạo Ban lãnh đạo) — bỏ
      // khóa cứng Phòng Thi công của ver đầu.
      phongBanNguon: dauVao.phongBanNguon,
      // Nhóm đề xuất (Vật tư · Dịch vụ · MM-CCDC · Khác) — trường của thẻ Base, thêm
      // 14/08/2026. Phiếu cũ không có thì chỗ hiển thị tự đọc là "Khác".
      nhomDeXuat: dauVao.nhomDeXuat,
      /**
       * 🔴 LẤY MÃ NGƯỜI ĐANG ĐĂNG NHẬP, không gán cứng nữa.
       *
       * Trước 12/08/2026 mọi đề nghị đều ghi `nguoiDeNghiUid: "u-tc"` — nghĩa là dù ai lập
       * thì hồ sơ cũng ghi tên một người duy nhất. Hậu quả: màn "Theo dõi đề nghị" lọc theo
       * mã người nên **người thật lập phiếu lại không thấy phiếu của mình**, còn quyền
       * "chỉ xem request mình đề xuất" thì vô nghĩa vì ai cũng là `u-tc`.
       */
      nguoiDeNghiUid: dauVao.nguoiDeNghiUid,
      nguoiDeNghiTen: dauVao.nguoiDeNghiTen,
      ngayDeNghi: dauVao.ngayDeNghi,
      // Phiếu vào app là ĐÃ DUYỆT (việc duyệt diễn ra ở app của bộ phận đề xuất —
      // Ban lãnh đạo chốt 12/08/2026), nên ngày duyệt luôn có.
      ngayDuyet: dauVao.ngayDuyet,
      ngayCanHang: dauVao.ngayCanHang,
      mucDoUuTien: dauVao.mucDoUuTien,
      taiLieu: dauVao.taiLieu,
      // Đề nghị vào app luôn ở trạng thái ĐÃ DUYỆT — app Thu mua không duyệt đề nghị.
      trangThai: "da_duyet",
      items: dauVao.items.map((d, i) => ({ ...d, stt: i + 1 })),
      // Người đề nghị mặc định theo dõi tiến trình đề nghị của chính mình,
      // rồi tới những người được chọn thêm ở mục "Người theo dõi" của phiếu.
      nguoiTheoDoi: [
        {
          uid: dauVao.nguoiDeNghiUid,
          ten: dauVao.nguoiDeNghiTen,
          chucDanh: dauVao.nguoiDeNghiChucDanh,
          nguoiThemTen: dauVao.nguoiDeNghiTen,
          thoiDiemThem: dauVao.ngayDeNghi,
        },
        ...(dauVao.nguoiTheoDoi ?? [])
          // Bỏ trùng với người đề nghị đã thêm ở trên.
          .filter((n) => n.uid !== dauVao.nguoiDeNghiUid)
          .map((n) => ({
            ...n,
            nguoiThemTen: dauVao.nguoiDeNghiTen,
            thoiDiemThem: dauVao.ngayDeNghi,
          })),
        /**
         * ★ BÁO CHO BAN QLDA khi phiếu có vật tư kiểm soát định mức — Ban lãnh đạo
         * 15/08/2026: *"gặp các vật tư này sẽ tự động hiện dòng thông báo định mức và báo
         * cho bộ phận QLDA"*.
         *
         * Cách báo: thêm người QLDA vào danh sách THEO DÕI. App không có kênh gửi ra ngoài
         * (bản xuất tĩnh, không máy chủ), nhưng người theo dõi thì nhận thông báo mỗi lần
         * hồ sơ chuyển bước và mở xem được tiến trình — đó là cách báo THẬT trong phạm vi
         * app làm được, thay vì hiện một dòng chữ "đã báo QLDA" mà chẳng gửi đi đâu.
         *
         * ⚠️ Chỉ thêm khi THẬT SỰ có dòng được đánh dấu; phiếu không có vật tư định mức mà
         * cũng kéo QLDA vào thì họ ngập trong hồ sơ không liên quan rồi bỏ qua hết.
         */
        ...(dauVao.items.some((d) => d.vatTuKiemSoatDinhMuc)
          ? nhanSuDangLamViec()
              .filter((n) => n.department === "quan_ly_du_an")
              .filter(
                (n) =>
                  n.uid !== dauVao.nguoiDeNghiUid &&
                  !(dauVao.nguoiTheoDoi ?? []).some((x) => x.uid === n.uid),
              )
              .map((n) => ({
                uid: n.uid,
                ten: n.displayName,
                chucDanh: n.title,
                nguoiThemTen: "Hệ thống",
                thoiDiemThem: dauVao.ngayDeNghi,
              }))
          : []),
      ],
      lichSu: [
        { thoiDiem: dauVao.ngayDeNghi, nguoiThucHien: dauVao.nguoiDeNghiTen, hanhDong: "Tạo đề nghị" },
        {
          thoiDiem: thoiDiemHienTai(),
          nguoiThucHien: dauVao.nguoiDeNghiTen,
          hanhDong: "Chuyển sang Phòng Thu mua",
          ghiChu: "Việc duyệt đề nghị nằm ở app của bộ phận đề xuất — phiếu vào đây là đã duyệt",
        },
        // Ghi vết việc app tự kéo QLDA vào — sau này đọc nhật ký biết ngay vì sao họ có tên
        // trong phiếu, thay vì tưởng ai đó thêm nhầm.
        ...(dauVao.items.some((d) => d.vatTuKiemSoatDinhMuc)
          ? [
              {
                thoiDiem: thoiDiemHienTai(),
                nguoiThucHien: "Hệ thống",
                hanhDong: "Báo Ban QLDA — phiếu có vật tư kiểm soát định mức",
                ghiChu: dauVao.items
                  .filter((d) => d.vatTuKiemSoatDinhMuc)
                  .map((d) => d.tenVatLieu)
                  .join(", "),
              },
            ]
          : []),
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
      tenNguoiPhuTrach?: string,
    ) => {
      /**
       * Tên người nhận việc: LẤY TỪ NƠI GỌI trước, danh bạ chỉ là phương án dự phòng.
       *
       * 🔴 Từ 12/08/2026 người dùng là tài khoản THẬT đọc từ máy chủ, còn `DANH_BA_NHAN_SU`
       * là mảng viết cứng chỉ có tên giả định. Tra danh bạ cho một mã không có trong đó thì
       * hàm trả lại **chính chuỗi mã** — màn hình phân bổ sẽ hiện "u-tm-01" thay vì tên
       * người, và nhật ký ghi vĩnh viễn cái mã thô đó. Không sai lệch dữ liệu, nhưng hồ sơ
       * đọc không ra ai làm gì.
       *
       * Nơi gọi (bảng phân bổ) LUÔN biết tên vì nó vừa hiện tên đó lên nút bấm — dùng lại
       * là chắc chắn đúng.
       */
      const ten = tenNguoiPhuTrach?.trim() || tenTheoUid(nguoiPhuTrachUid);

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

      /**
       * 🔔 BÁO CHO NGƯỜI VỪA ĐƯỢC GIAO VIỆC — Ban lãnh đạo 18/08/2026: *"cài đặt thêm tính năng
       * thông báo khi có công việc mới"*.
       *
       * 🔴 KHOẢNG TRỐNG ĐƯỢC LẤP: trước đây hàm này chỉ ghi dữ liệu và ghi nhật ký, KHÔNG sinh
       * thông báo. Chuông chỉ báo khi cả phiếu đổi bước, mà bước chỉ đổi khi **mọi dòng** đã
       * phân bổ — nên giao 2 trong 5 dòng thì người nhận không biết gì. Xem `laViecMoi` trong
       * `3-du-lieu/kieu-du-lieu.ts`.
       *
       * 🔴 GỬI ĐÍCH DANH `[ten]`, không gửi theo vai trò: `thongBaoDanhChoToi` so khớp bằng tên,
       * nên chỉ đúng người đó thấy. Gửi nhãn vai trò là cả phòng lại thấy việc của nhau — đúng
       * lỗi Ban lãnh đạo đã bắt ngày 12/08/2026.
       *
       * ⚠️ CÓ THỂ TRÙNG với tin đổi bước khi dòng cuối cùng được phân bổ (phiếu ① → ②). Giữ cả
       * hai là CỐ Ý: một tin nói *"bạn được giao 3 dòng vật tư"*, tin kia nói *"hồ sơ đã sang
       * bước Yêu cầu NCC báo giá"*. Gộp lại thì mất một trong hai thông tin.
       *
       * ⚠️ Đặt NGOÀI `setDeNghi` chứ không nhét vào trong: hàm cập nhật của `setState` phải
       * thuần, gọi `setThongBao` bên trong nó là React có thể chạy hai lần (StrictMode) và sinh
       * hai thông báo cho một lần giao việc.
       */
      if (sttDong.length > 0) {
        const dn = deNghiRef.current.find((x) => x.id === prId);
        if (dn) {
          const buoc = xacDinhGiaiDoan(
            dn,
            donHangRef.current,
            baoGiaRef.current,
            phieuNhanRef.current,
          );
          setThongBao((truoc) =>
            [
              {
                id: `tb-vm-${soKeTiepThongBao()}`,
                prId: dn.id,
                prCode: dn.code,
                tieuDe: dn.tieuDe,
                /* `tuBuoc` = `denBuoc`: giao việc KHÔNG phải một bước nghiệp vụ mới (bước suy ra
                   từ chứng từ). Để trống `tuBuoc` thì chuông sẽ viết "Đề nghị mới vào bước …" —
                   sai nghĩa.

                   ⚠️ ĐÂY LÀ BƯỚC Ở ĐÚNG KHOẢNH KHẮC BẤM GIAO, tức TRƯỚC khi dòng vừa giao kịp
                   ghi vào dữ liệu (`setDeNghi` chưa áp xong nên `deNghiRef` vẫn là bản cũ). Giao
                   nốt dòng cuối cùng thì hồ sơ sẽ sang bước sau ngay sau đó, nên con số này có
                   thể là bước TRƯỚC ĐÓ MỘT NHỊP. Vì vậy chuông **không in tên bước** cho loại tin
                   này — giữ trường lại chỉ để tra cứu, đừng đem ra chỉ đường cho người dùng. */
                tuBuoc: buoc,
                denBuoc: buoc,
                thoiDiem: new Date().toISOString(),
                guiToi: [ten],
                daDoc: false,
                laViecMoi: true,
                soDongViec: sttDong.length,
                /* Chỉ mang GHI CHÚ giao việc sang, không mang số báo giá: số báo giá đã hiện
                   thành một trường riêng ở khối ĐẦU VÀO của bước ②, nhắc lại trong lời nhắn là
                   hai chỗ cùng nói một con số rồi lệch nhau khi sửa. */
                loiNhan: yeuCau?.ghiChu?.trim() || undefined,
              },
              ...truoc,
            ].slice(0, 30),
          );
        }
      }
    },
    [],
  );

  /**
   * ★ LÙI ĐỀ NGHỊ VỀ MỘT BƯỚC TRƯỚC — Ban lãnh đạo 13/08/2026: *"chức năng kéo thả chuyển
   * bước chỉ cho tiến hoặc lùi trong phạm vi 1 bước"*.
   *
   * 🔴 GIAI ĐOẠN KHÔNG PHẢI MỘT TRƯỜNG. Nó suy ra từ chứng từ (`xacDinhGiaiDoan`), nên lùi
   * bước = HỦY ĐÚNG CHỨNG TỪ đang giữ đề nghị ở bước hiện tại. Đổi một trường trạng thái
   * nào đó rồi coi như xong thì lần vẽ lại bảng tiếp theo thẻ tự nhảy về chỗ cũ.
   *
   * ⚠️ Hàm này CHỈ THỰC THI. Việc *có được lùi hay không* do `quyetDinhLui` trong
   * `2-quy-trinh/giai-doan-mua-hang.ts` quyết — một luật, một chỗ. Đừng thêm điều kiện chặn
   * ở đây, nếu không hai nơi sẽ nói khác nhau và người dùng không biết tin bên nào.
   */
  const luiVeBuoc = useCallback(
    (
      prId: string,
      ve: GiaiDoanMuaHang,
      nguoiThucHien: string,
      /** Có = trưởng bộ phận KHÔNG DUYỆT bảng báo giá, kèm lý do bắt buộc. */
      traLai?: { lyDo: string },
    ): void => {
      const ngay = thoiDiemHienTai();

      if (ve === "tiep_nhan") {
        // Bỏ hết phân bổ + hủy bảng báo giá trống.
        setDeNghi((truoc) =>
          truoc.map((dn) =>
            dn.id !== prId
              ? dn
              : {
                  ...dn,
                  items: dn.items.map((d) => ({
                    ...d,
                    nguoiPhuTrachUid: undefined,
                    nguoiPhuTrachTen: undefined,
                    nguoiPhanBoTen: undefined,
                    thoiDiemPhanBo: undefined,
                    soBaoGiaYeuCau: undefined,
                    ghiChuPhanBo: undefined,
                  })),
                },
          ),
        );
        setBaoGia((truoc) =>
          truoc.map((b) =>
            b.prId === prId && b.trangThai !== "huy"
              ? { ...b, trangThai: "huy", ngayCapNhat: ngay }
              : b,
          ),
        );
      } else if (ve === "yeu_cau_bao_gia") {
        /* Mở lại bảng để thu thập tiếp — GIỮ NGUYÊN giá đã nhập.
           🔴 KHÔNG HỦY BẢNG: lý do bị trả thường chỉ là thiếu một báo giá hoặc đề xuất chưa đủ
           thuyết phục. Hủy là nhân viên phải gõ lại giá của mọi nhà cung cấp từ đầu.
           📌 Có `traLai` = trưởng bộ phận KHÔNG DUYỆT → ghi thêm một lượt vào `lanTraLai`. Ghi
           NỐI VÀO MẢNG chứ không ghi đè: phiếu đi đi về lại ②↔③ nhiều vòng, để một chuỗi thì
           lần bác sau xóa lần trước và nhân viên lặp lại đúng cái sai cũ. */
        setBaoGia((truoc) =>
          truoc.map((b) =>
            b.prId === prId && b.trangThai === "da_so_sanh"
              ? {
                  ...b,
                  trangThai: "dang_thu_thap",
                  ngayCapNhat: ngay,
                  ...(traLai
                    ? {
                        lanTraLai: [
                          ...(b.lanTraLai ?? []),
                          {
                            thoiDiem: thoiDiemHienTai(),
                            nguoiTuChoiTen: nguoiThucHien,
                            lyDo: traLai.lyDo.trim(),
                          },
                        ].slice(-SO_LAN_TRA_LAI_GIU_LAI),
                      }
                    : {}),
                }
              : b,
          ),
        );
      } else if (ve === "xet_duyet_bao_gia") {
        /* Bỏ nhà cung cấp đã chốt, đưa bảng về trạng thái chờ duyệt.
           🔴 XÓA ĐỦ CẢ SÁU TRƯỜNG CỦA QUYẾT ĐỊNH, không chỉ hai trường tên nhà cung cấp.
           Bản trước chỉ xóa `nccDaChonId`/`nccDaChonTen` mà để nguyên lý do chốt, tệp dẫn chứng
           và tên người chốt — nên sau khi lùi, màn bảng báo giá vẫn hiện nguyên **lý do duyệt
           của một quyết định đã bị hủy**, kèm tên người chịu trách nhiệm, trong khi không còn
           nhà cung cấp nào được chọn. Người đọc hồ sơ không cách nào biết đó là dấu vết cũ. */
        setBaoGia((truoc) =>
          truoc.map((b) =>
            b.prId === prId && b.trangThai === "da_chon_ncc"
              ? {
                  ...b,
                  trangThai: "da_so_sanh",
                  nccDaChonId: undefined,
                  nccDaChonTen: undefined,
                  lyDoChonNCC: undefined,
                  tepChonNCC: undefined,
                  nguoiChonTen: undefined,
                  thoiDiemChon: undefined,
                  ngayCapNhat: ngay,
                }
              : b,
          ),
        );
      } else if (ve === "lap_don_mua_hang") {
        // Đưa đơn đã chốt về nháp để sửa lại.
        setDonHang((truoc) =>
          truoc.map((po) =>
            po.prId === prId && po.trangThai === "da_chot"
              ? { ...po, trangThai: "nhap" }
              : po,
          ),
        );
      }

      ghiLichSuDeNghi(
        prId,
        nguoiThucHien,
        /* 🔴 Câu nhật ký phải nói ĐÚNG chuyện đã xảy ra. Ghi cứng "kéo thẻ trên bảng quy trình"
           cho cả lượt trưởng bộ phận bấm "Không duyệt" là ghi sai hồ sơ.
           ⚠️ TUYỆT ĐỐI KHÔNG chép `traLai.lyDo` vào đây — lý do hay nhắc tên nhà cung cấp, mà
           nhật ký hiện cho cả vai trò không được xem NCC. Lý do nằm ở `BaoGia.lanTraLai`. */
        traLai
          ? `Không duyệt bảng báo giá — trả lại bước "${NHAN_GIAI_DOAN[ve].nhan}"`
          : `Lùi một bước về "${NHAN_GIAI_DOAN[ve].nhan}" — kéo thẻ trên bảng quy trình`,
      );
    },
    [ghiLichSuDeNghi],
  );

  /**
   * ★ LƯU CẤU HÌNH QUY TRÌNH — Ban lãnh đạo 13/08/2026.
   *
   * 🔴 KIỂM TRƯỚC KHI LƯU, trả về danh sách lỗi thay vì lưu bừa. Luật kiểm ở
   * `2-quy-trinh/cau-hinh-quy-trinh.ts` → `loiCauHinh`, MỘT CHỖ DUY NHẤT — giao diện gọi nó
   * để khóa nút, hàm này gọi lại lần nữa lúc lưu. Chỉ chặn ở giao diện là hở: cấu hình còn
   * đi qua kho chung, và bản lưu cũ trên máy khác có thể mang giá trị lạ.
   *
   * ⚠️ Cấu hình dùng CHUNG CẢ PHÒNG (kho chung Firestore). Sửa là đổi luật cho mọi người,
   * nên phải ghi rõ ai sửa — người gọi truyền `nguoiThucHien`.
   */
  const luuCauHinhQuyTrinh = useCallback(
    (moi: CauHinhQuyTrinh, nguoiThucHien: string): string[] => {
      const loi = loiCauHinh(moi);
      if (loi.length > 0) return loi;
      const thayDoi = soSanhCauHinh(cauHinhRef.current, moi);
      setCauHinh(moi);
      // Không đổi gì thì không ghi vết — một dòng "đã đổi: (không có gì)" chỉ làm nhiễu.
      if (thayDoi.length > 0) {
        setLichSuCauHinh((truoc) =>
          [{ thoiDiem: thoiDiemHienTai(), nguoiDoi: nguoiThucHien, thayDoi }, ...truoc].slice(0, 50),
        );
      }
      return [];
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

  /**
   * CHUYỂN VIỆC MỘT SỐ DÒNG SANG NGƯỜI KHÁC.
   *
   * 🔴 Chỉ đạo Ban lãnh đạo 12/08/2026: *"Chỉ thêm tính năng chuyển công việc cho nhân viên
   * khác khi nhân viên được giao việc không thể thực hiện"*. Đây là thứ THAY THẾ cho bước
   * "Nhận công tác" vừa bỏ: không cần xác nhận có làm hay không, nhưng phải có đường thoát
   * khi người được giao thật sự không làm được (nghỉ, đi công trường, quá tải).
   *
   * ⚠️ TÁCH KHỎI `phanBoDong` dù cùng ghi một trường, vì hai việc khác nhau về NGHĨA:
   * phân bổ là giao việc mới, chuyển là bàn giao việc đang chạy. Nhật ký phải phân biệt được
   * — nếu không thì đọc lại hồ sơ không biết dòng này đổi người mấy lần và vì sao.
   *
   * ⚠️ GIỮ NGUYÊN yêu cầu số báo giá và ghi chú giao việc: đổi người làm chứ không đổi
   * yêu cầu công việc. Xóa đi là người nhận mới không biết trưởng bộ phận đã dặn gì.
   */
  const chuyenViecDong = useCallback(
    (
      prId: string,
      sttDong: number[],
      nguoiMoi: { uid: string; ten: string },
      lyDo: string,
      nguoiThucHien: string,
    ) => {
      const luc = thoiDiemHienTai();
      setDeNghi((truoc) =>
        truoc.map((dn) => {
          if (dn.id !== prId) return dn;

          // Ghi tên người CŨ vào nhật ký trước khi ghi đè — sau khi đè là không tra lại được.
          const tenCu = [
            ...new Set(
              dn.items
                .filter((d) => sttDong.includes(d.stt))
                .map((d) => d.nguoiPhuTrachTen)
                .filter((x): x is string => Boolean(x)),
            ),
          ].join(", ");

          return {
            ...dn,
            items: dn.items.map((d) =>
              sttDong.includes(d.stt)
                ? {
                    ...d,
                    nguoiPhuTrachUid: nguoiMoi.uid,
                    nguoiPhuTrachTen: nguoiMoi.ten,
                    nguoiPhanBoTen: nguoiThucHien,
                    thoiDiemPhanBo: homNay(),
                  }
                : d,
            ),
            lichSu: [
              ...dn.lichSu,
              {
                thoiDiem: luc,
                nguoiThucHien,
                hanhDong:
                  `Chuyển việc dòng ${sttDong.join(", ")}` +
                  (tenCu ? ` từ ${tenCu}` : "") +
                  ` sang ${nguoiMoi.ten}`,
                ghiChu: lyDo.trim() || undefined,
              },
            ],
          };
        }),
      );

      /**
       * 🔔 BÁO CHO NGƯỜI NHẬN VIỆC MỚI — cùng lý do như ở `phanBoDong`.
       *
       * 🔴 Việc bàn giao còn cần báo hơn cả giao mới: người nhận KHÔNG hề chờ đợi việc này, họ
       * không có lý do gì để đi mở phiếu đó ra xem. Không báo thì dòng vật tư đứng im dưới tên
       * một người không biết mình đang giữ nó.
       *
       * 📌 CHỈ báo cho người NHẬN, không báo cho người bị chuyển đi: họ không còn việc để làm
       * nữa, và nhật ký hồ sơ đã ghi đủ ai chuyển của ai (kèm lý do) cho việc tra cứu sau này.
       */
      if (sttDong.length > 0) {
        const dn = deNghiRef.current.find((x) => x.id === prId);
        if (dn) {
          const buoc = xacDinhGiaiDoan(
            dn,
            donHangRef.current,
            baoGiaRef.current,
            phieuNhanRef.current,
          );
          setThongBao((truoc) =>
            [
              {
                id: `tb-cv-${soKeTiepThongBao()}`,
                prId: dn.id,
                prCode: dn.code,
                tieuDe: dn.tieuDe,
                tuBuoc: buoc,
                denBuoc: buoc,
                thoiDiem: new Date().toISOString(),
                guiToi: [nguoiMoi.ten],
                daDoc: false,
                laViecMoi: true,
                soDongViec: sttDong.length,
                // Lý do chuyển việc chính là điều người nhận cần biết nhất.
                loiNhan: lyDo.trim() || undefined,
              },
              ...truoc,
            ].slice(0, 30),
          );
        }
      }
    },
    [],
  );

  const themDonHang = useCallback(
    (dauVao: DauVaoDonHangMoi) => {
      const { donGia, thueSuatDong, phanTien, ...po } = dauVao;

      /**
       * 🔴 CHẶN LẬP ĐƠN KHI CHƯA QUA XÉT DUYỆT BÁO GIÁ — Ban lãnh đạo 15/08/2026: *"bước này
       * sao trưởng phòng chưa duyệt đã đẩy qua tiến hành đặt hàng rồi"*.
       *
       * Trước đây hàm này tạo đơn thẳng ở `da_chot` mà không kiểm gì, nên `260001-HPCS-PR-001`
       * nhảy từ bước ② lên thẳng bước ⑤, hai cột giữa trống trơn. Đơn hàng là cam kết trả
       * tiền — lập được đơn mà không ai duyệt giá là hở kiểm soát chi tiêu, không phải lỗi
       * hiển thị.
       *
       * ⚠️ CHẶN Ở ĐÂY chứ không chỉ khóa nút. Trang lập đơn mở được bằng URL trực tiếp
       * (`/don-hang/tao-moi?prId=…`), nhập Excel cũng gọi thẳng vào hàm này — khóa nút chỉ che
       * một đường trong ba.
       *
       * Trả về chuỗi lý do (khác id là chuỗi rỗng khi hết chỗ) để nơi gọi báo cho người dùng.
       *
       * ---
       *
       * ★ DIỄN BIẾN NGÀY 18/08/2026 — ĐỌC CẢ HAI ĐOẠN, ĐỪNG DỰNG LẠI BẢN SÁNG:
       *
       * · SÁNG: module "Lập đơn mua hàng (PO)" thành module độc lập (không gắn đề nghị), và
       *   chốt này được cho **bỏ qua** với đơn không có `prId` — vì bảng báo giá luôn thuộc về
       *   một đề nghị nên đơn độc lập không có gì để đối chiếu, chạy luật cũ là từ chối 100%.
       *   Hệ quả đã báo lên Ban lãnh đạo: đơn ra đời mà KHÔNG qua bước ③ Xét duyệt báo giá,
       *   tức **đi vòng qua chốt kiểm soát chi tiêu** mà chỉ đạo 15/08/2026 sinh ra để vá.
       *
       * · CHIỀU: Ban lãnh đạo trả lời *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*. Module độc lập
       *   nay **không cất đơn nữa**, chỉ in / xuất mẫu (`2-quy-trinh/don-hang-mau.ts`). Không
       *   còn đường cất nào thiếu `prId`, nên chốt được **siết lại: thiếu `prId` là TỪ CHỐI**.
       *
       * 🔴 VÌ SAO PHẢI CHẶN Ở ĐÂY, KHÔNG CHỈ BỎ NÚT (chính là nguyên tắc ghi ở trên):
       *  1. Bỏ nút chỉ đóng một đường. Hàm này còn mở cho mọi nơi gọi khác — nay là dòng lệnh
       *     gỡ lỗi, mai là một tính năng mới ai đó thêm vào.
       *  2. Có một đường đua thật: hộp xác nhận Cất vẽ NGOÀI nhánh điều kiện, nên nếu phiếu đề
       *     nghị biến mất khỏi kho chung (người khác xóa, hoặc kho chung đồng bộ lại) đúng lúc
       *     hộp đang mở, `dn` thành `null` và `luu()` vẫn gọi vào đây với `prId` rỗng.
       *  3. Nguyên tắc "thiếu thông tin thì chọn mức chặt nhất" (CLAUDE.md 3.6c). Mã chết mà
       *     CHẶN thì vô hại; mã chết mà CHO QUA là một lỗ hổng chi tiêu đang chờ người vô tình
       *     mở lại.
       *
       * 📌 Muốn cho phép cất đơn không gắn đề nghị thì phải nghĩ ra luật xét duyệt giá THAY THẾ
       *    rồi thay vào đây — đừng chỉ xóa khối `if` này.
       */
      if (!po.prId) {
        return {
          loi: "Đơn mua hàng phải gắn một phiếu đề nghị đã có bảng báo giá được duyệt. Module “Lập đơn mua hàng (PO)” chỉ tạo MẪU để in / xuất Excel, không cất vào hệ thống — muốn cất đơn thật thì mở phiếu đề nghị trong Quy trình mua hàng rồi bấm “Lập đơn đặt hàng”.",
        };
      }
      const chan = vuongMacLapDonHang(baoGiaRef.current.filter((b) => b.prId === po.prId));
      if (chan) return { loi: chan };

      /**
       * 🔴 MÃ DỰ ÁN RỖNG THÌ TỪ CHỐI HẲN, không cấp mã `-PO-001`.
       *
       * Đường cũ luôn có `maDuAn` từ phiếu đề nghị nên chuyện này không xảy ra được. Đường độc
       * lập thì người lập tự chọn / tự gõ, nên phải chặn tại tầng dữ liệu: một mã hồ sơ mất
       * phần mã dự án gốc là **sai Thông báo 09/2026/TB-HPCS**, tra cứu không ra và không sửa
       * lại được sau khi đơn đã gửi nhà cung cấp.
       */
      if (!po.maDuAn.trim()) {
        return {
          loi: "Chưa có mã dự án gốc nên chưa cấp được số đơn hàng. Chọn dự án đã có hoặc nhập mã dự án theo Thông báo 09/2026/TB-HPCS (vd 260001-HPCS).",
        };
      }

      // Số thứ tự PO chạy theo DỰ ÁN, đúng quy tắc mã hồ sơ Thông báo 09/2026.
      // 🔴 Luật ở `2-quy-trinh/dat-ma-don-hang.ts` — KHÔNG đếm số đơn hiện có rồi +1 (bỏ một
      // đơn là mã tiếp theo trùng với đơn đang tồn tại). Xem chú thích ở file đó.
      const code = maDonHangTiepTheo(
        po.maDuAn,
        donHangRef.current.map((p) => p.code),
      );

      // Lấy id dự phòng ĐÃ SINH SẴN TRANG — hosting tĩnh chỉ mở được địa chỉ có sẵn.
      // Trước đây dùng id tự nghĩ (`po-moi-...`) nên bấm vào đơn vừa lập là ra 404.
      const id = ID_DON_HANG_GIA_LAP.find(
        (x) => !donHangRef.current.some((p) => p.id === x),
      );
      if (!id) {
        return {
          loi: "Bản chạy thử chỉ lập được 20 đơn và đã dùng hết. Tải lại trang để về dữ liệu gốc.",
        };
      }

      /**
       * ⚠️ KHÔNG gắn sẵn `lichSu` cho đơn mới. Mọi đơn cất được đều gắn một phiếu đề nghị (chốt
       * ngay trên), nên dòng nhật ký lập đơn ghi vào **lịch sử của đề nghị** ở ngay dưới — một
       * hồ sơ chỉ có một dòng thời gian. `lichSu` riêng của đơn dành cho các thao tác về sau,
       * do `ghiNhatKyDonHang` ghi.
       *
       * 📌 Sáng 18/08/2026 chỗ này có nhánh gắn sẵn `lichSu` cho "đơn không gắn đề nghị". Chiều
       * cùng ngày đường đó bị bỏ (Ban lãnh đạo: *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*) nên
       * nhánh ấy không bao giờ chạy được nữa — xóa chứ không để lại mã chết. Lấy lại ở git nếu
       * sau này cho cất đơn không gắn đề nghị.
       */
      setDonHang((truoc) => [...truoc, { ...po, id, code, trangThai: "da_chot" }]);
      setGiaDonHang((truoc) => [
        ...truoc,
        {
          poId: id,
          poCode: code,
          maDuAn: po.maDuAn,
          // Thuế suất riêng của dòng chỉ ghi khi người lập thật sự nhập — để `undefined` thì
          // `tinhTienChiTiet` tự lấy thuế suất chung, và chứng từ nói đúng "dòng này không có
          // thỏa thuận thuế riêng" thay vì chép cứng một con số rồi sau đổi thuế suất chung
          // mà dòng cũ vẫn giữ mức cũ.
          lines: po.items.map((d) => ({
            sttDong: d.sttDong,
            donGia: donGia[d.sttDong] ?? 0,
            thueSuatGTGT: thueSuatDong?.[d.sttDong],
          })),
          // Chiết khấu / thuế / điều khoản thanh toán đi cùng GIÁ, không đi cùng PO —
          // nếu để trong PO thì cho thủ kho đọc PO là hở luôn phần thương mại.
          ...phanTien,
        },
      ]);
      // Không ghi tên NCC vào nhật ký — lịch sử đề nghị hiện cho cả vai trò không được xem NCC.
      if (po.prId) {
        ghiLichSuDeNghi(po.prId, po.nguoiPhuTrachTen, `Lập và chốt đơn hàng ${code}`);
      }
      return { id };
    },
    [ghiLichSuDeNghi],
  );

  const themPhieuNhan = useCallback(
    (phieu: Omit<PhieuNhanHang, "id" | "code" | "lanGiaoThu">) => {
      const cuaPO = phieuNhanRef.current.filter((p) => p.poId === phieu.poId);

      /**
       * 🔴 CHỐT CHẶN Ở TẦNG DỮ LIỆU — Ban lãnh đạo 15/08/2026: không ghi thêm phiếu khi đã
       * nhận đủ, và số phiếu giao nhận không được trùng.
       *
       * Giao diện đã khóa nút và báo lý do, nhưng khóa nút KHÔNG PHẢI LÀ CHẶN: form vẫn có thể
       * đang mở sẵn từ trước lúc phiếu cuối được ghi (hai người cùng làm trên kho chung), và
       * còn đường gọi khác về sau. Kiểm lại ở đây thì mọi đường đều bị chặn như nhau.
       *
       * ⚠️ Chặn bằng cách KHÔNG GHI và trả về — hàm này vốn không trả lỗi cho nơi gọi, mà đổi
       * chữ ký thì phải sửa cả luồng. Nơi gọi duy nhất đã kiểm đúng ba luật này trước khi gọi,
       * nên tới được đây mà vẫn vướng nghĩa là có đường vòng — thà mất một lần ghi còn hơn ghi
       * một phiếu sai vào chứng từ kho.
       */
      const poDangGhi = donHangRef.current.find((p) => p.id === phieu.poId);
      if (poDangGhi) {
        const tienDo = tinhTienDoPO(poDangGhi, cuaPO);
        if (
          vuongMacGhiThemPhieuNhan(tienDo) ||
          vuongMacKhoiLuongNhan(tienDo, phieu.lines) ||
          vuongMacSoPhieuNCC(phieu.soPhieuGiaoNCC ?? "", cuaPO)
        ) {
          return;
        }
      }

      const lanGiaoThu = cuaPO.length + 1;
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
        // Đơn không gắn đề nghị thì nhật ký vào chính đơn — xem `ghiNhatKyDonHang`.
        ghiNhatKyDonHang(po, phieu.nguoiNhanTen, `Ghi phiếu nhận hàng lần ${lanGiaoThu} — ${phieu.poCode}`);
      }
    },
    [ghiNhatKyDonHang],
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
          ghiNhatKyDonHang(po, nguoiThucHien, `${nhan} phiếu ${phieu.code}`);
        }
      }
    },
    [ghiNhatKyDonHang],
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
        ghiNhatKyDonHang(
          po,
          nguoiThucHien,
          `Đính kèm phiếu giao nhận cho ${phieu.code}: ${tep.tenTep}`,
        );
      }
    },
    [ghiNhatKyDonHang],
  );

  const xacNhanKho = useCallback(
    (poId: string, nguoi: XacNhan) => {
      setDonHang((truoc) =>
        truoc.map((po) =>
          po.id === poId ? { ...po, xacNhanKho: nguoi, trangThai: "cho_xac_nhan_hoan_thanh" } : po,
        ),
      );
      const po = donHangRef.current.find((p) => p.id === poId);
      if (po) ghiNhatKyDonHang(po, nguoi.ten, `Thủ kho xác nhận đã nhận đủ — ${po.code}`);
    },
    [ghiNhatKyDonHang],
  );

  const xacNhanTruongBP = useCallback(
    (poId: string, nguoi: XacNhan) => {
      setDonHang((truoc) =>
        truoc.map((po) => (po.id === poId ? { ...po, xacNhanTruongBP: nguoi, trangThai: "hoan_thanh" } : po)),
      );
      const po = donHangRef.current.find((p) => p.id === poId);
      if (po) {
        ghiNhatKyDonHang(po, nguoi.ten, `Trưởng bộ phận xác nhận hoàn thành — ${po.code}, chuyển hồ sơ Kế toán`);
      }
    },
    [ghiNhatKyDonHang],
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
          /**
           * 🔴 ĐÃ BỎ VIỆC TỰ ĐIỀN "GIÁ MẪU" (20/08/2026).
           *
           * Bản trước: mỗi lần ai kéo thẻ sang cột ③, app tự ghi vào từng dòng vật tư ba mức
           * đơn giá theo công thức `50.000 + dòng×10.000 + cột×2.500`, **kèm tên ba nhà cung cấp
           * thật trong danh mục**, để bảng so sánh có gì mà bấm thử.
           *
           * Vì sao phải bỏ:
           *   · Đó là **giá bịa ghi vào dữ liệu thật** của cả phòng (`chay-thu/du-lieu-chung`),
           *     không phải dữ liệu mẫu nằm yên trong mã nguồn. Người sau mở hồ sơ ra không có
           *     cách nào biết con số đó là giá bịa hay giá nhà cung cấp gửi thật.
           *   · Nó gán giá cho **nhà cung cấp có tên thật**, tức tạo ra chứng cứ sai về một đối
           *     tác — hỏng hơn nhiều so với việc bảng so sánh trống.
           *   · Ban lãnh đạo đã chốt bỏ hẳn bảng so sánh nhập tay (19/08 và 20/08/2026), nên
           *     không còn chỗ nào cần những con số này để "bấm thử".
           *
           * Nay chỉ đổi trạng thái, không đụng vào `items`.
           */
          return { ...b, trangThai: sang, ngayCapNhat: ngay };
        }),
      );
      if (sang === "da_so_sanh") {
        ghiLichSuDeNghi(prId, nguoiThucHien, "Chốt đủ báo giá, chuyển sang so sánh và trình duyệt");
      }
    },
    [ghiLichSuDeNghi],
  );

  const chonNCCChoBaoGia = useCallback(
    (
      bgId: string,
      nccId: string,
      tenNCC: string,
      nguoiThucHien: string,
      lyDo?: string,
      /** Tài liệu dẫn chứng đính kèm — văn bản TGĐ duyệt, email NCC, báo giá gốc… */
      tep?: MoTaTep[],
    ) => {
      const ngay = homNay();
      setBaoGia((truoc) =>
        truoc.map((b) =>
          b.id === bgId
            ? {
                ...b,
                trangThai: "da_chon_ncc",
                nccDaChonId: nccId,
                nccDaChonTen: tenNCC,
                // ★ Lý do / dẫn chứng chọn NCC — căn cứ của quyết định chi tiền, xem
                // `lyDoChonNCC` trong `kieu-du-lieu.ts`.
                lyDoChonNCC: lyDo?.trim() || undefined,
                ...((tep ?? []).length > 0 ? { tepChonNCC: tep } : {}),
                nguoiChonTen: nguoiThucHien,
                thoiDiemChon: thoiDiemHienTai(),
                ngayCapNhat: ngay,
              }
            : b,
        ),
      );
      const bg = baoGiaRef.current.find((b) => b.id === bgId);
      // Không ghi tên NCC vào nhật ký — lịch sử đề nghị hiện cho cả vai trò không được xem NCC.
      if (bg) ghiLichSuDeNghi(bg.prId, nguoiThucHien, `Chốt nhà cung cấp cho bảng báo giá ${bg.code}`);
    },
    [ghiLichSuDeNghi],
  );

  /* 📌 KHÔNG có hàm "không duyệt" riêng — việc đó đi qua `luiVeBuoc(prId, "yeu_cau_bao_gia", …,
     { lyDo })`. Bản đầu tôi viết một hàm `khongDuyetBaoGia` riêng, nhưng `luiVeBuoc` đã làm
     đúng y nghiệp vụ đó (hạ `da_so_sanh` → `dang_thu_thap`, giữ nguyên giá đã nhập); hai hàm
     cùng hạ một trạng thái là sớm muộn lệch nhau, và lệch kiểu đó không có lỗi nào báo. */

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
  /**
   * ★ NHÂN VIÊN GHI ĐỀ XUẤT CHỌN NHÀ CUNG CẤP — Ban lãnh đạo 13/08/2026: *"nhân viên phải đưa
   * ra đề xuất lựa chọn NCC nào và phải có dẫn chứng cụ thể"*.
   *
   * ⚠️ Đây là KIẾN NGHỊ, không phải quyết định. Không đổi trạng thái bảng báo giá, không chốt
   * nhà cung cấp — trưởng bộ phận vẫn là người chốt ở bước ③ (`chonNCCChoBaoGia`).
   */
  const luuDeXuatNCC = useCallback(
    (
      bgId: string,
      deXuat: { nccId: string; tenNCC: string; lyDo: string },
      nguoiThucHien: string,
    ) => {
      const ngay = homNay();
      setBaoGia((truoc) =>
        truoc.map((b) =>
          b.id === bgId
            ? {
                ...b,
                deXuatNCCId: deXuat.nccId,
                deXuatNCCTen: deXuat.tenNCC,
                lyDoDeXuat: deXuat.lyDo.trim() || undefined,
                nguoiDeXuatTen: nguoiThucHien,
                thoiDiemDeXuat: thoiDiemHienTai(),
                ngayCapNhat: ngay,
              }
            : b,
        ),
      );
      const bg = baoGiaRef.current.find((b) => b.id === bgId);
      // 🔒 KHÔNG ghi tên nhà cung cấp vào nhật ký đề nghị — nhật ký hiện cho cả vai trò không
      // được xem NCC (quy ước ở `ghiLichSuDeNghi`).
      if (bg) ghiLichSuDeNghi(bg.prId, nguoiThucHien, `Ghi đề xuất chọn NCC cho bảng ${bg.code}`);
    },
    [ghiLichSuDeNghi],
  );

  /**
   * Lưu thông tin thương mại của một nhà cung cấp: hình thức thanh toán · thời gian giao ·
   * ghi chú. Theo mẫu "SO SÁNH GIÁ" của công ty — xem `ThongTinThuongMaiNCC`.
   */
  const luuThongTinNCC = useCallback(
    (bgId: string, tt: ThongTinThuongMaiNCC, nguoiThucHien: string) => {
      setBaoGia((truoc) =>
        truoc.map((b) => {
          if (b.id !== bgId) return b;
          const ds = b.thongTinNCC ?? [];
          const co = ds.some((x) => x.nccId === tt.nccId);
          return {
            ...b,
            // Đã có thì THAY, chưa có thì thêm — không để hai dòng cùng một nhà cung cấp.
            thongTinNCC: co ? ds.map((x) => (x.nccId === tt.nccId ? tt : x)) : [...ds, tt],
            ngayCapNhat: homNay(),
          };
        }),
      );
      const bg = baoGiaRef.current.find((b) => b.id === bgId);
      // 🔒 KHÔNG ghi tên nhà cung cấp vào nhật ký — khối Lịch sử hiện cho cả vai trò không
      // được xem NCC. Ghi bảng nào là đủ để truy vết (quy ước ở `ghiLichSuDeNghi`).
      if (bg) {
        ghiLichSuDeNghi(bg.prId, nguoiThucHien, `Ghi thông tin thương mại NCC cho bảng ${bg.code}`);
      }
    },
    [ghiLichSuDeNghi],
  );

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

  /**
   * Đánh dấu đã đọc — CHỈ những thông báo được nêu đích danh.
   *
   * 🔴 Từ 12/08/2026 dữ liệu nằm trên kho DÙNG CHUNG, nên `daDoc` là của cả phòng chứ
   * không riêng ai. Bản cũ đánh dấu TẤT CẢ: trưởng phòng mở chuông một cái là **xóa sạch
   * chấm đỏ của mọi nhân viên**, việc mới giao không ai còn thấy nổi bật nữa.
   *
   * Nay nơi gọi phải truyền đúng danh sách mình nhìn thấy.
   *
   * ⚠️ Đây mới là giảm nhẹ, chưa phải cách đúng hẳn: hai người cùng nhận một thông báo thì
   * người mở trước vẫn tắt chấm đỏ của người kia. Muốn dứt điểm phải lưu "đã đọc" theo
   * TỪNG NGƯỜI (`daDocBoi: string[]`) — việc còn lại, phải chuyển đổi dữ liệu cũ.
   */
  const danhDauDaDocThongBao = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const bo = new Set(ids);
    setThongBao((truoc) =>
      truoc.some((t) => !t.daDoc && bo.has(t.id))
        ? truoc.map((t) => (t.daDoc || !bo.has(t.id) ? t : { ...t, daDoc: true }))
        : truoc,
    );
  }, []);



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
      moi: Partial<
        Pick<
          DeNghiMuaHang,
          | "tieuDe"
          | "tenCongTrinh"
          | "maHopDongCDT"
          | "mucDoUuTien"
          | "phongBanNguon"
          | "nhomDeXuat"
          | "linkPhieuDeNghi"
        >
      >,
      nguoiThucHien: string,
    ) => {
      setDeNghi((truoc) =>
        truoc.map((dn) => {
          if (dn.id !== prId) return dn;
          // Ghi RÕ đổi trường nào, từ giá trị nào sang giá trị nào. Nhật ký chỉ nói "đã sửa"
          // thì sau này tranh cãi không ai biết sửa cái gì.
          const doi: string[] = [];
          if (moi.tieuDe !== undefined && moi.tieuDe !== dn.tieuDe)
            doi.push(`tiêu đề: “${dn.tieuDe}” → “${moi.tieuDe}”`);
          if (moi.tenCongTrinh !== undefined && moi.tenCongTrinh !== dn.tenCongTrinh)
            doi.push(`công trình: “${dn.tenCongTrinh}” → “${moi.tenCongTrinh}”`);
          if (moi.maHopDongCDT !== undefined && moi.maHopDongCDT !== (dn.maHopDongCDT ?? ""))
            doi.push(`hợp đồng CĐT: “${dn.maHopDongCDT ?? "—"}” → “${moi.maHopDongCDT || "—"}”`);
          if (moi.mucDoUuTien !== undefined && moi.mucDoUuTien !== dn.mucDoUuTien)
            doi.push(
              `ưu tiên: ${dn.mucDoUuTien === "gap" ? "Gấp" : "Bình thường"} → ${moi.mucDoUuTien === "gap" ? "Gấp" : "Bình thường"}`,
            );
          /* ★ BA TRƯỜNG THÊM 18/08/2026 cho hộp "Chỉnh sửa các trường dữ liệu tùy chỉnh".
             🔴 ĐI CHUNG MỘT HÀM, không mở hàm ghi mới: mỗi đường ghi mới là một chỗ nữa có thể
             quên ghi nhật ký. Đổi sang `Partial<>` để hộp nào chỉ sửa vài trường thì gửi vài
             trường — hàm bỏ qua trường `undefined`, khác hẳn "gửi chuỗi rỗng để xóa". */
          if (moi.phongBanNguon !== undefined && moi.phongBanNguon !== dn.phongBanNguon)
            doi.push(
              `bộ phận: “${nhanPhongBan(dn.phongBanNguon)}” → “${nhanPhongBan(moi.phongBanNguon)}”`,
            );
          if (moi.nhomDeXuat !== undefined && moi.nhomDeXuat !== dn.nhomDeXuat)
            doi.push(
              `nhóm đề xuất: “${NHAN_NHOM_DE_XUAT[dn.nhomDeXuat ?? "khac"]}” → “${NHAN_NHOM_DE_XUAT[moi.nhomDeXuat]}”`,
            );
          if (
            moi.linkPhieuDeNghi !== undefined &&
            moi.linkPhieuDeNghi !== (dn.linkPhieuDeNghi ?? "")
          )
            doi.push(
              `link phiếu đề nghị: “${dn.linkPhieuDeNghi ?? "—"}” → “${moi.linkPhieuDeNghi || "—"}”`,
            );
          if (doi.length === 0) return dn; // Không đổi gì thì đừng ghi nhật ký rác
          return {
            ...dn,
            ...moi,
            maHopDongCDT:
              moi.maHopDongCDT === undefined
                ? dn.maHopDongCDT
                : moi.maHopDongCDT.trim() || undefined,
            linkPhieuDeNghi:
              moi.linkPhieuDeNghi === undefined
                ? dn.linkPhieuDeNghi
                : moi.linkPhieuDeNghi.trim() || undefined,
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
   * SỬA DANH SÁCH MẶT HÀNG của đề nghị — thêm dòng, sửa dòng, bớt dòng, trong MỘT lần lưu.
   *
   * 🔴 Ban lãnh đạo 13/08/2026: *"việc thêm bớt công việc phải click vào đề xuất để chỉnh
   * sửa"*. Vì vậy đây là một thao tác **sửa hồ sơ trọn vẹn** (mở phiếu → sửa bảng → lưu),
   * không phải xóa lắt nhắt từng dòng ngay trên bảng theo dõi.
   *
   * ⚠️ CHỐT AN TOÀN — trả về câu giải thích thay vì im lặng không làm gì:
   *   1. Không được bỏ dòng ĐÃ LÊN ĐƠN ĐẶT HÀNG. Dòng PO trỏ về `stt` của đề nghị; bỏ đi
   *      là dòng PO mồ côi, mọi phép đối chiếu khối lượng hỏng theo.
   *   2. Phải còn ít nhất một dòng. Phiếu không có vật tư là hồ sơ chết — muốn bỏ cả phiếu
   *      thì dùng "Xóa hẳn đề nghị" hoặc "Đánh dấu thất bại", hai việc đó có cảnh báo riêng.
   *
   * 📌 GIỮ NGUYÊN `stt` CỦA DÒNG CŨ, chỉ đánh số mới cho dòng vừa thêm. Đánh số lại toàn bộ
   * thì dòng PO và phiếu nhận hàng đang trỏ về `stt` cũ sẽ **trỏ nhầm sang mặt hàng khác** —
   * sai âm thầm, tệ hơn nhiều so với mồ côi vì không có gì báo lỗi.
   */
  const suaMatHangDeNghi = useCallback(
    (prId: string, dongMoi: DongDeNghi[], nguoiThucHien: string): string | null => {
      const dn = deNghiRef.current.find((d) => d.id === prId);
      if (!dn) return "Không tìm thấy đề nghị.";

      /**
       * 🔴 HỒ SƠ ĐÃ ĐÓNG THÌ KHÔNG SỬA NỘI DUNG NỮA — Ban lãnh đạo 15/08/2026: *"sao hoàn
       * thành rồi mà vẫn được thêm vật tư"*.
       *
       * Ảnh cho thấy `260001-HPCS-PR-001` đứng ở bước ⑦ *Hoàn thành* (đã nhận đủ, kho và
       * trưởng bộ phận đều đã xác nhận) mà bảng vẫn mời *"Thêm vật tư mới"*.
       *
       * Thêm một dòng vào lúc này là hồ sơ đang "hoàn thành" bỗng có phần chưa mua: giai đoạn
       * được suy ra từ chứng từ nên thẻ lập tức rơi ngược về bước ①, mọi xác nhận đã ký trở
       * thành xác nhận cho một nội dung khác với nội dung hiện tại. Cần mua thêm thì lập đề
       * nghị mới, không sửa vào hồ sơ đã chốt.
       */
      const giaiDoanHienTai = xacDinhGiaiDoan(
        dn,
        donHangRef.current,
        baoGiaRef.current,
        phieuNhanRef.current,
      );
      if (giaiDoanHienTai === "hoan_thanh") {
        return "Đề nghị đã hoàn thành nên không sửa được danh sách vật tư. Cần mua thêm thì lập một đề nghị mới — thêm vào hồ sơ đã chốt sẽ làm hỏng các xác nhận đã ký.";
      }
      if (giaiDoanHienTai === "that_bai") {
        return "Đề nghị đã đóng dở nên không sửa được danh sách vật tư. Muốn mua tiếp thì lập đề nghị mới.";
      }

      if (dongMoi.length === 0) {
        return "Phiếu phải còn ít nhất một mặt hàng. Phiếu không có vật tư thì không đi tiếp được bước nào — dùng “Xóa hẳn đề nghị” hoặc “Đánh dấu thất bại” nếu muốn bỏ cả phiếu.";
      }

      const sttConLai = new Set(dongMoi.map((d) => d.stt));
      const daBo = dn.items.filter((d) => !sttConLai.has(d.stt));
      const vuongPO = daBo.filter((d) =>
        donHangRef.current.some(
          (p) =>
            p.prId === prId &&
            p.trangThai !== "huy" &&
            p.items.some((x) => x.sttDongDeNghi === d.stt),
        ),
      );
      if (vuongPO.length > 0) {
        return `Không bỏ được ${vuongPO.map((d) => `“${d.tenVatLieu}”`).join(", ")} vì đã lên đơn đặt hàng — bỏ sẽ làm dòng đơn hàng mồ côi và sai khối lượng đối chiếu. Hủy dòng trên đơn hàng trước.`;
      }

      // Số thứ tự lớn nhất từng dùng — dòng mới nối tiếp từ đây, KHÔNG lấp vào chỗ trống
      // của dòng vừa bị bỏ (lấp chỗ trống là dùng lại một `stt` mà chứng từ cũ có thể còn nhớ).
      let ke = Math.max(0, ...dn.items.map((d) => d.stt));
      const items = dongMoi.map((d) => (d.stt > 0 ? d : { ...d, stt: ++ke }));

      const themVao = items.length - (dn.items.length - daBo.length);
      const phanMoTa = [
        themVao > 0 ? `thêm ${themVao}` : "",
        daBo.length > 0 ? `bỏ ${daBo.length}` : "",
      ]
        .filter(Boolean)
        .join(" · ");

      setDeNghi((truoc) =>
        truoc.map((d) =>
          d.id !== prId
            ? d
            : {
                ...d,
                items,
                lichSu: [
                  ...d.lichSu,
                  {
                    thoiDiem: thoiDiemHienTai(),
                    nguoiThucHien,
                    hanhDong: "Sửa danh sách mặt hàng",
                    ghiChu: `${phanMoTa || "sửa nội dung dòng"} · còn ${items.length} mặt hàng${
                      daBo.length > 0
                        ? ` · đã bỏ: ${daBo.map((x) => x.tenVatLieu).join(", ")}`
                        : ""
                    }`,
                  },
                ],
              },
        ),
      );
      return null;
    },
    [],
  );

  /**
   * Nhân bản đề nghị — tạo hồ sơ MỚI, GIỮ NGUYÊN thông tin, chỉ thêm "(copy)" vào tên.
   *
   * 🔴 Ban lãnh đạo 13/08/2026: *"nhân bản sẽ giữ nguyên toàn bộ thông tin chỉ thêm chữ
   * (copy) phía sau và có chức năng xóa bớt mặt hàng để giao cho nhân viên phù hợp"*.
   *
   * Đây là cách **TÁCH PHIẾU**: một đề nghị 10 mặt hàng, nhân bản vài lần, mỗi bản giữ
   * phần mặt hàng của một nhân viên rồi giao riêng. Vì vậy `sttGiuLai` là danh sách số
   * thứ tự dòng được giữ — bỏ trống nghĩa là giữ hết.
   *
   * ⚠️ PHÂN BIỆT "thông tin" và "tiến trình":
   *   · Thông tin (dự án, công trình, mặt hàng, ngày cần hàng, mức ưu tiên, **người theo
   *     dõi**, **tài liệu đính kèm**) → CHÉP HẾT, đúng chữ "giữ nguyên toàn bộ".
   *   · Tiến trình (nhật ký, cờ lưu trữ, chứng từ) → KHÔNG chép. Bản mới bắt đầu vòng mua
   *     hàng của riêng nó.
   *   · Người phụ trách → **GÁN CHO NGƯỜI BẤM NHÂN BẢN** (Ban lãnh đạo 15/08/2026), xem
   *     giải thích đầy đủ ở chỗ dựng `items` bên dưới.
   */
  const nhanBanDeNghi = useCallback(
    (
      prId: string,
      /**
       * Người bấm nhân bản — cần CẢ uid lẫn tên vì họ nhận luôn phần việc này (Ban lãnh đạo
       * 15/08/2026). Chỉ có tên thì không gán được người phụ trách, và thẻ lại rơi về bước ①.
       */
      nguoi: { uid: string; ten: string },
      sttGiuLai?: number[],
      /**
       * 🔴 CHẶN Ở TẦNG DỮ LIỆU, không chỉ ẩn nút.
       *
       * Ban lãnh đạo 15/08/2026: nhân viên chỉ tách được phiếu **mình phụ trách**. Giao diện
       * đã ẩn mục "Nhân bản" với phiếu không phụ trách, nhưng ẩn nút KHÔNG PHẢI là chặn —
       * còn đường khác gọi tới hàm này (menu ở trang khác, phím tắt, mã viết sau). Kiểm lại
       * ở đây thì mọi đường đều bị chặn như nhau.
       *
       * Truyền `undefined` = nơi gọi đã tự kiểm (giữ tương thích cho chỗ gọi cũ).
       */
      duocPhep?: (deNghi: DeNghiMuaHang) => boolean,
    ): string => {
      const goc = deNghiRef.current.find((d) => d.id === prId);
      if (!goc) return "";
      if (duocPhep && !duocPhep(goc)) return "";
      const idMoi = ID_DE_NGHI_GIA_LAP.find((id) => !deNghiRef.current.some((d) => d.id === id));
      if (!idMoi) return ""; // Hết id dự phòng — người gọi phải báo cho người dùng
      const ngay = homNay();

      const giu = sttGiuLai && sttGiuLai.length > 0 ? new Set(sttGiuLai) : null;
      const dongGiuLai = giu ? goc.items.filter((d) => giu.has(d.stt)) : goc.items;
      // Không còn dòng nào thì không tạo phiếu rỗng — phiếu không có vật tư là hồ sơ chết,
      // không đi tiếp được bước nào mà vẫn chiếm một trong 12 mã dự phòng.
      if (dongGiuLai.length === 0) return "";

      /**
       * ★ MÃ BẢN SAO và PHIẾU GỐC — luật ở `2-quy-trinh/nhan-ban-de-nghi.ts`, MỘT CHỖ DUY
       * NHẤT. Hộp nhân bản trên giao diện gọi đúng hai hàm này để hiện mã trước cho người
       * dùng xem; tự tính lại ở đây là hai chỗ lệch nhau (đã dính lỗi đó ngày 13/08/2026).
       */
      const goc1 = phieuGocCua(goc, deNghiRef.current);
      const code = maBanSaoTiepTheo(goc, deNghiRef.current);

      setDeNghi((truoc) => [
        ...truoc,
        {
          ...goc,
          id: idMoi,
          code,
          // 🔴 TIÊU ĐỀ GIỮ NGUYÊN TUYỆT ĐỐI. Ban lãnh đạo 13/08/2026 làm rõ bằng ví dụ
          // *"26001-HPCS-PR-001 (copy)"*: dấu "(copy)" nằm ở MÃ, không nằm ở tiêu đề. Các
          // phần tách của cùng một đề xuất mang cùng một tiêu đề là đúng — chúng là một
          // việc, chỉ chia ra cho nhiều người làm.
          tieuDe: goc1.tieuDe,
          // ★ Quan hệ cha–con để TỔNG HỢP LẠI được các bản tách (xem `deNghiGocId`).
          deNghiGocId: goc1.id,
          maDeNghiGoc: goc1.code,
          ngayDeNghi: ngay,
          ngayDuyet: ngay,
          trangThai: "da_duyet",
          luuTru: undefined,
          /**
           * ⚠️ ĐÁNH SỐ LẠI TỪ 1. `stt` là KHÓA ĐỐI CHIẾU khối lượng — dòng đơn hàng và dòng
           * nhận hàng đều trỏ về nó. Giữ số cũ (ví dụ chỉ còn dòng 3, 7) thì phiếu mới có
           * dòng số 3 và 7 mà không có 1, 2 — người đọc tưởng mất dòng, và mọi chỗ đếm
           * "dòng thứ mấy" đều lệch.
           */
          /**
           * 🔴 NGƯỜI NHÂN BẢN NHẬN LUÔN PHẦN VIỆC NÀY — Ban lãnh đạo 15/08/2026: *"nhân viên
           * nào nhân bản thì sẽ do người đó thực hiện, và hiện ngay tại bước đang nhân bản,
           * chứ không đẩy về bước 1"*.
           *
           * ⚠️ Trước 15/08/2026 chỗ này XÓA hết phân bổ với lý do "để giao lại cho người phù
           * hợp". Giả định đó sai với cách phòng đang làm: người tách phiếu chính là người
           * nhận việc. Hậu quả thấy rõ trên bảng — bản `(copy 3)` rơi về cột ① *"Tiếp nhận và
           * kiểm tra"* kèm *"Chưa được giao · Thiếu 1 dòng chưa phân bổ"*, trong khi phiếu
           * gốc và hai bản copy khác đã ở cột ②. Người tách vừa mất công tách, vừa phải nhờ
           * trưởng bộ phận phân bổ lại cho chính mình.
           *
           * 📌 VÌ SAO GÁN NGƯỜI LÀ ĐỦ ĐỂ THẺ Ở ĐÚNG BƯỚC: giai đoạn được SUY RA từ chứng từ,
           * và "phân bổ đủ mọi dòng" chính là điều kiện sang bước ②. Gán người xong là bản
           * copy tự đứng cùng cột với phiếu gốc, không cần lưu thêm trường giai đoạn nào —
           * giữ đúng nguyên tắc "giai đoạn không lưu thành trường".
           *
           * ⚠️ Bản copy KHÔNG nhảy được tới bước ③ trở đi dù phiếu gốc đang ở đó: những bước
           * ấy đòi chứng từ riêng (bảng báo giá, đơn hàng) mà bản mới chưa có. Đó là đúng —
           * nói thẻ đã ở bước ⑤ khi chưa có đơn hàng nào là báo tiến độ ảo.
           */
          /**
           * 🔴 CHỈ GÁN NGƯỜI CHO DÒNG GỐC ĐÃ CÓ NGƯỜI — Ban lãnh đạo 16/08/2026: *"nhân bản ở
           * bước nào thì sẽ trả nhân bản ở đúng bước đó"*.
           *
           * ⚠️ Bản trước gán người cho MỌI dòng, kể cả dòng gốc chưa ai nhận. Hậu quả thấy
           * ngay trên bảng: phiếu `PR-002` đứng ở cột ① *"Chưa được giao · Thiếu 3 công việc
           * chưa phân bổ"*, nhân bản ra thì bản `(copy)` lại nhảy sang cột ② — vì giai đoạn
           * suy ra từ chứng từ, mà "phân bổ đủ mọi dòng" chính là điều kiện sang bước ②.
           * Bản sao đi trước bản gốc một bước, không ai hiểu vì sao.
           *
           * 📌 VẪN GIỮ chỉ đạo 15/08/2026 (*"nhân viên nào nhân bản thì do người đó thực hiện,
           * hiện ngay tại bước đang nhân bản"*): dòng gốc ĐÃ có người thì bản copy sang tên
           * người nhân bản. Hai chỉ đạo không mâu thuẫn — cái sau nói VỀ AI, cái này nói CÓ
           * GÁN HAY KHÔNG.
           */
          items: dongGiuLai.map((d, i) => {
            const goc = Boolean(d.nguoiPhuTrachUid);
            return {
              ...d,
              stt: i + 1,
              ...(goc
                ? {
                    nguoiPhuTrachUid: nguoi.uid,
                    nguoiPhuTrachTen: nguoi.ten,
                    // Người tách tự nhận việc, nên người phân bổ cũng chính là họ.
                    nguoiPhanBoTen: nguoi.ten,
                    thoiDiemPhanBo: thoiDiemHienTai(),
                  }
                : {
                    // Dòng gốc chưa ai nhận thì bản copy cũng để trống — trưởng bộ phận phân
                    // bổ như với mọi dòng mới.
                    nguoiPhuTrachUid: undefined,
                    nguoiPhuTrachTen: undefined,
                    nguoiPhanBoTen: undefined,
                    thoiDiemPhanBo: undefined,
                  }),
            };
          }),
          lichSu: [
            {
              thoiDiem: thoiDiemHienTai(),
              nguoiThucHien: nguoi.ten,
              hanhDong: `Nhân bản từ ${goc.code}`,
              ghiChu:
                (giu
                  ? `Giữ ${dongGiuLai.length}/${goc.items.length} mặt hàng của phiếu gốc`
                  : `Giữ nguyên toàn bộ ${goc.items.length} mặt hàng`) +
                // Nói đúng số dòng thật sự được giao — dòng gốc chưa ai nhận thì bản copy
                // cũng để trống, nên câu cũ ("nhận phụ trách toàn bộ") có thể sai.
                (dongGiuLai.some((d) => d.nguoiPhuTrachUid)
                  ? `. Người tách nhận ${
                      dongGiuLai.filter((d) => d.nguoiPhuTrachUid).length
                    } công việc đã được giao ở phiếu gốc.`
                  : ". Các công việc chưa phân bổ, giữ nguyên như phiếu gốc."),
            },
          ],
        },
      ]);
      return idMoi;
    },
    [],
  );

  /**
   * ★ TÁCH PHIẾU THEO PHÂN CÔNG — Ban lãnh đạo 15/08/2026: *"Khi trưởng phòng giao việc cho
   * nhân viên khác nhau thì ở bước 2 sẽ tự copy đề nghị đó ra và công việc ứng với các tích
   * chọn của trưởng phòng"*.
   *
   * Người có dòng đầu tiên giữ phiếu gốc (chỉ còn dòng của mình), mỗi người còn lại nhận một
   * phiếu `(copy)` chứa đúng dòng được giao. Luật ở `2-quy-trinh/nhan-ban-de-nghi.ts`.
   *
   * 🔴 LÀM TRỌN GÓI TRONG MỘT LẦN `setDeNghi`. Gọi `nhanBanDeNghi` nhiều lần rồi sửa phiếu
   * gốc sau là nhiều lần ghi liên tiếp: lần ghi giữa chừng có thể đẩy lên kho chung một trạng
   * thái nửa vời (phiếu gốc còn đủ dòng nhưng đã có phiếu con) — máy khác đọc được đúng lúc
   * đó là thấy khối lượng bị đếm hai lần.
   *
   * Trả về mô tả kết quả để nơi gọi báo cho người dùng; `null` nghĩa là không tách gì.
   */
  const tachTheoPhanBo = useCallback(
    (prId: string, nguoiThucHienTen: string): { soPhieu: number; ten: string[] } | null => {
      const goc = deNghiRef.current.find((d) => d.id === prId);
      if (!goc) return null;

      const maTrong = ID_DE_NGHI_GIA_LAP.filter(
        (id) => !deNghiRef.current.some((d) => d.id === id),
      );
      const pa = tinhPhuongAnTach(goc, maTrong.length);
      if (!pa.tach) return null;

      const luc = thoiDiemHienTai();
      const ngay = homNay();
      const gocDau = phieuGocCua(goc, deNghiRef.current);
      const tenMoiNguoi = [pa.giuPhieuGoc, ...pa.canTaoPhieu].map((n) => n.ten);

      /* Mã bản sao phải tính DẦN theo danh sách đang lớn lên: tính hết một lượt trên danh
         sách cũ thì hai phiếu tách cùng lúc nhận cùng một mã "(copy)". */
      const dangCo = [...deNghiRef.current];
      const phieuMoi: DeNghiMuaHang[] = [];
      pa.canTaoPhieu.forEach((nhom, i) => {
        const giu = new Set(nhom.stt);
        const dong = goc.items.filter((d) => giu.has(d.stt));
        const p: DeNghiMuaHang = {
          ...goc,
          id: maTrong[i],
          code: maBanSaoTiepTheo(goc, dangCo),
          tieuDe: gocDau.tieuDe,
          deNghiGocId: gocDau.id,
          maDeNghiGoc: gocDau.code,
          ngayDeNghi: ngay,
          ngayDuyet: ngay,
          trangThai: "da_duyet",
          luuTru: undefined,
          // Chứng từ và trao đổi KHÔNG chép sang: chúng thuộc về phiếu gốc. Chép bình luận
          // sang mọi phiếu con là mỗi người đọc lại một bản y hệt, trả lời vào bản nào cũng
          // không ai thấy.
          binhLuan: undefined,
          congViecDaXong: undefined,
          // Đánh số lại từ 1 — `stt` là khóa đối chiếu khối lượng (xem `nhanBanDeNghi`).
          items: dong.map((d, k) => ({ ...d, stt: k + 1 })),
          lichSu: [
            {
              thoiDiem: luc,
              nguoiThucHien: nguoiThucHienTen,
              hanhDong: `Tách tự động từ ${goc.code} theo phân công`,
              ghiChu: `Nhận ${dong.length}/${goc.items.length} mặt hàng, do ${nhom.ten} phụ trách.`,
            },
          ],
        };
        phieuMoi.push(p);
        dangCo.push(p);
      });

      const sttGiuLai = new Set(pa.giuPhieuGoc.stt);
      setDeNghi((truoc) => [
        ...truoc.map((d) =>
          d.id !== prId
            ? d
            : {
                ...d,
                items: d.items
                  .filter((x) => sttGiuLai.has(x.stt))
                  .map((x, k) => ({ ...x, stt: k + 1 })),
                lichSu: [
                  ...d.lichSu,
                  {
                    thoiDiem: luc,
                    nguoiThucHien: nguoiThucHienTen,
                    hanhDong: `Tách thành ${tenMoiNguoi.length} phiếu theo phân công`,
                    ghiChu: `Mỗi người một phiếu: ${tenMoiNguoi.join(", ")}. Phiếu này giữ ${sttGiuLai.size}/${d.items.length} mặt hàng của ${pa.giuPhieuGoc.ten}.`,
                  },
                ],
              },
        ),
        ...phieuMoi,
      ]);

      return { soPhieu: tenMoiNguoi.length, ten: tenMoiNguoi };
    },
    [],
  );
  // Nối vào ref để effect theo dõi chuyển bước (khai báo phía trên) gọi được.
  tachTheoPhanBoRef.current = tachTheoPhanBo;

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

  /**
   * ★ ĐẶT SỐ BÁO GIÁ CẦN LẤY CHO MỌI DÒNG CỦA PHIẾU.
   *
   * 🔴 Dùng khi chuyển sang bước ② — Base có trường bắt buộc *"SL Báo giá"* ngay trong hộp
   * chuyển giai đoạn (ảnh Ban lãnh đạo 15/08/2026). Yêu cầu này phải nằm sẵn trong phiếu lúc
   * nhân viên mở ra, vì đi hỏi giá là việc đầu tiên của bước đó.
   *
   * ⚠️ ĐẶT CHO MỌI DÒNG, kể cả dòng đã có số riêng: người chuyển bước đang ra một yêu cầu
   * chung cho cả phiếu. Muốn mỗi dòng một số khác nhau thì sửa ở bảng Phân bổ công việc —
   * chỗ đó vốn cho đặt theo từng dòng.
   */
  const datSoBaoGiaChoPhieu = useCallback(
    (prId: string, soBaoGia: number, nguoiThucHien: string) => {
      setDeNghi((truoc) =>
        truoc.map((dn) =>
          dn.id !== prId
            ? dn
            : {
                ...dn,
                items: dn.items.map((d) => ({ ...d, soBaoGiaYeuCau: soBaoGia })),
                lichSu: [
                  ...dn.lichSu,
                  {
                    thoiDiem: thoiDiemHienTai(),
                    nguoiThucHien,
                    hanhDong: `Yêu cầu lấy ${soBaoGia} báo giá cho mọi mặt hàng`,
                  },
                ],
              },
        ),
      );
    },
    [],
  );

  const danhDauCongViecGiaiDoan = useCallback(
    (prId: string, congViec: CongViecGiaiDoan, giaiDoan: string, xong: boolean, nguoiTen: string) => {
      setDeNghi((truoc) =>
        truoc.map((dn) => {
          if (dn.id !== prId) return dn;
          const ds = dn.congViecDaXong ?? [];
          const daCo = ds.some((x) => x.maCongViec === congViec.ma);
          if (xong === daCo) return dn; // không đổi gì thì đừng ghi nhật ký rác
          return {
            ...dn,
            congViecDaXong: xong
              ? [
                  ...ds,
                  {
                    maCongViec: congViec.ma,
                    giaiDoan,
                    nguoiXongTen: nguoiTen,
                    thoiDiem: thoiDiemHienTai(),
                  },
                ]
              : ds.filter((x) => x.maCongViec !== congViec.ma),
            lichSu: [
              ...dn.lichSu,
              {
                thoiDiem: thoiDiemHienTai(),
                nguoiThucHien: nguoiTen,
                hanhDong: xong
                  ? `Hoàn thành công việc "${congViec.ten}"`
                  : `Bỏ tích hoàn thành công việc "${congViec.ten}"`,
              },
            ],
          };
        }),
      );
    },
    [],
  );

  /**
   * Câu chặn khi hồ sơ đã đóng — `null` là được làm tiếp.
   *
   * 🔴 SUY GIAI ĐOẠN TỪ CHỨNG TỪ, KHÔNG đọc trường `trangThai`. Giai đoạn không phải một
   * trường lưu sẵn (xem `2-quy-trinh/giai-doan-mua-hang.ts`); đọc `trangThai` là đọc một con
   * số có thể đã cũ so với chứng từ thật.
   *
   * 📌 Tách thành hàm riêng để mọi việc "sửa nội dung đề nghị" chặn bằng cùng MỘT luật —
   * viết lại điều kiện ở từng hàm là kiểu để hai chỗ lệch nhau mà không ai phát hiện.
   */
  const loiKhiHoSoDaDong = useCallback(
    (dn: DeNghiMuaHang, viecDangLam: string): string | null => {
      const giaiDoanHienTai = xacDinhGiaiDoan(
        dn,
        donHangRef.current,
        baoGiaRef.current,
        phieuNhanRef.current,
      );
      if (!giaiDoanDaKetThuc(giaiDoanHienTai)) return null;
      return giaiDoanHienTai === "hoan_thanh"
        ? `Đề nghị đã hoàn thành nên không ${viecDangLam} được nữa. Hồ sơ đã được kho và trưởng bộ phận xác nhận — sửa thêm sẽ làm các xác nhận đã ký không còn khớp với nội dung hồ sơ.`
        : `Đề nghị đã đóng dở nên không ${viecDangLam} được nữa. Muốn mua tiếp thì lập một đề nghị mới.`;
    },
    [],
  );

  /**
   * ★ TỆP ĐÍNH KÈM CỦA TỪNG BƯỚC — Ban lãnh đạo 17/08/2026: khoanh đỏ khối "Bảng báo giá"
   * ở bước ② và ghi *"mục đính kèm file"*.
   *
   * 🔴 HỒ SƠ ĐÃ ĐÓNG THÌ KHÔNG GẮN THÊM ĐƯỢC, cùng luật với `suaMatHangDeNghi`: giai đoạn
   * suy ra từ chứng từ, nên bồi thêm chứng từ vào hồ sơ đã hoàn thành / đã đóng dở là làm
   * lệch cái mà kho và trưởng bộ phận đã ký xác nhận. XEM thì vẫn xem được bình thường.
   *
   * 📌 Trả về CÂU GIẢI THÍCH thay vì im lặng không làm gì — nếp chung của các hàm ghi trong
   * file này (`suaMatHangDeNghi`, `suaBinhLuan`).
   */
  /**
   * ★ GHI ĐỀ XUẤT CHỌN NHÀ CUNG CẤP THEO **ĐỀ NGHỊ** — tự lập hồ sơ xét duyệt nếu chưa có.
   *
   * 🔴 VÌ SAO PHẢI CÓ HÀM NÀY — bế tắc thật, Ban lãnh đạo báo 20/08/2026:
   * *"đang không có nút chuyển tiếp quy trình"*.
   *
   * Khối đề xuất + nút "Trình xét duyệt" ở bước ② vốn chỉ hiện khi đề nghị **đã có một bảng báo
   * giá** ở trạng thái `dang_thu_thap`. Bảng đó được sinh khi kéo thẻ từ cột ① sang ②. Nhưng phiếu
   * còn một đường khác để vào bước ②: **phân bổ hết dòng thì tự chuyển bước**. Đi đường đó thì
   * không có bảng nào — và người dùng đứng ở bước ② **không thấy nút nào để đi tiếp**, phải tự
   * biết đi tìm menu ⋯ trên thẻ ở màn Quy trình mua hàng để "lập bảng báo giá". Không ai đoán ra.
   *
   * Từ khi Ban lãnh đạo chốt *"chỉ đính kèm file và trưởng bộ phận chọn duyệt thôi"* (20/08/2026),
   * việc bắt người dùng lập một "bảng báo giá" trống rỗng càng vô nghĩa: bảng đó nay chỉ còn vai
   * trò **hồ sơ xét duyệt** (giữ đề xuất, lý do duyệt, các lần bị trả lại). Nên app tự lập nó khi
   * nhân viên ghi đề xuất, thay vì đòi người dùng làm một thao tác họ không hiểu để làm gì.
   *
   * ⚠️ TẠO KÈM ĐỀ XUẤT TRONG MỘT LẦN GHI. Không gọi `taoBaoGiaGiaLap` rồi `luuDeXuatNCC` nối tiếp
   * — hàm thứ hai đọc `baoGiaRef.current` để ghi nhật ký, mà ref chỉ cập nhật lúc render nên dòng
   * nhật ký rơi mất. Cùng loại lỗi đã mất cả ngày 20/08 với nhãn ô báo giá.
   *
   * Trả lý do bị chặn, `null` là đã ghi.
   */
  const luuDeXuatNCCChoDeNghi = useCallback(
    (
      prId: string,
      deXuat: { nccId: string; tenNCC: string; lyDo: string },
      nguoiThucHien: string,
    ): string | null => {
      const dn = deNghiRef.current.find((d) => d.id === prId);
      if (!dn) return "Không tìm thấy đề nghị.";

      const loi = loiKhiHoSoDaDong(dn, "ghi đề xuất chọn nhà cung cấp");
      if (loi) return loi;

      const ngay = homNay();
      const phanDeXuat = {
        deXuatNCCId: deXuat.nccId,
        deXuatNCCTen: deXuat.tenNCC,
        lyDoDeXuat: deXuat.lyDo.trim() || undefined,
        nguoiDeXuatTen: nguoiThucHien,
        thoiDiemDeXuat: thoiDiemHienTai(),
        ngayCapNhat: ngay,
      };

      const dangCo = baoGiaRef.current.find(
        (b) => b.prId === prId && b.trangThai === "dang_thu_thap",
      );

      if (dangCo) {
        setBaoGia((truoc) =>
          truoc.map((b) => (b.id === dangCo.id ? { ...b, ...phanDeXuat } : b)),
        );
        /* 🔴 KHÔNG ghi tên nhà cung cấp vào nhật ký — khối Lịch sử hiện cho cả vai trò không
           được xem NCC (quy ước CLAUDE.md mục 7). */
        ghiLichSuDeNghi(prId, nguoiThucHien, `Ghi đề xuất chọn nhà cung cấp cho ${dangCo.code}`);
        return null;
      }

      /* Chưa có hồ sơ xét duyệt → lập ngay, kèm luôn đề xuất. */
      const daDung = new Set(baoGiaRef.current.map((b) => b.id));
      const id = ID_BAO_GIA_GIA_LAP.find((x) => !daDung.has(x));
      if (!id) {
        return `Bản chạy thử chỉ giữ được ${ID_BAO_GIA_GIA_LAP.length} hồ sơ báo giá. Xóa bớt dữ liệu cũ rồi thử lại.`;
      }
      const soHienCo = baoGiaRef.current.filter((b) =>
        b.code.startsWith(`${dn.maDuAn}-BG-`),
      ).length;

      const moi: BaoGia = {
        id,
        code: `${dn.maDuAn}-BG-${String(soHienCo + 1).padStart(3, "0")}`,
        prId,
        prCode: dn.code,
        tieuDe: `Báo giá ${dn.tieuDe}`,
        trangThai: "dang_thu_thap",
        items: dn.items.map((d) => ({
          id: `bg-${id}-${d.stt}`,
          /* Giữ số thứ tự dòng đề nghị — khóa truy vết khi lập đơn từ phân bổ. */
          sttDongDeNghi: d.stt,
          tenVatLieu: d.tenVatLieu,
          donViTinh: d.donViTinh,
          khoiLuong: d.khoiLuongDeNghi,
          baoGiaNCC: [],
        })),
        hanNop: dn.ngayCanHang,
        ngayTao: ngay,
        ...phanDeXuat,
      };
      setBaoGia((truoc) => [...truoc, moi]);
      ghiLichSuDeNghi(
        prId,
        nguoiThucHien,
        `Lập hồ sơ xét duyệt báo giá ${moi.code} và ghi đề xuất chọn nhà cung cấp`,
      );
      return null;
    },
    [ghiLichSuDeNghi, loiKhiHoSoDaDong],
  );

  /**
   * ★ TRÌNH XÉT DUYỆT THEO **ĐỀ NGHỊ** — không cần biết trước mã hồ sơ báo giá.
   *
   * Đi cặp với `luuDeXuatNCCChoDeNghi`: giao diện chỉ biết đề nghị đang mở, hồ sơ xét duyệt do
   * app tự lập nên nơi gọi không có `bgId` trong tay.
   *
   * ⚠️ Chưa có hồ sơ thì KHÔNG tự lập ở đây — luồng bắt ghi đề xuất trước khi trình, nên tới bước
   * này hồ sơ chắc chắn đã tồn tại. Tự lập một hồ sơ RỖNG rồi trình đi là đẩy sang trưởng bộ phận
   * một thứ không có đề xuất nào để xét.
   */
  const trinhXetDuyetBaoGiaChoDeNghi = useCallback(
    (prId: string, nguoiThucHien: string): string | null => {
      const dn = deNghiRef.current.find((d) => d.id === prId);
      if (!dn) return "Không tìm thấy đề nghị.";

      const loi = loiKhiHoSoDaDong(dn, "trình xét duyệt báo giá");
      if (loi) return loi;

      const ngay = homNay();
      const bg = baoGiaRef.current.find(
        (b) => b.prId === prId && b.trangThai === "dang_thu_thap",
      );

      if (bg) {
        setBaoGia((truoc) =>
          truoc.map((b) =>
            b.id === bg.id && b.trangThai === "dang_thu_thap"
              ? { ...b, trangThai: "da_so_sanh", ngayCapNhat: ngay }
              : b,
          ),
        );
        ghiLichSuDeNghi(
          prId,
          nguoiThucHien,
          `Trình trưởng bộ phận xét duyệt ${bg.code} — bản báo giá nằm trong tệp đính kèm bước “Yêu cầu NCC báo giá”`,
        );
        return null;
      }

      /**
       * 🔴 CHƯA CÓ HỒ SƠ THÌ TỰ LẬP RỒI TRÌNH LUÔN (20/08/2026).
       *
       * Trước đó hàm này trả *"Chưa có đề xuất nào để trình"* vì hồ sơ được lập lúc nhân viên
       * lưu đề xuất. Nay Ban lãnh đạo đã **bỏ khối đề xuất** — nhân viên chỉ đính kèm rồi bấm
       * trình — nên không còn bước nào lập hồ sơ trước. Giữ nguyên câu lỗi cũ là nút trình bấm
       * mãi không được, đúng cái bế tắc vừa sửa sáng nay.
       */
      const daDung = new Set(baoGiaRef.current.map((b) => b.id));
      const id = ID_BAO_GIA_GIA_LAP.find((x) => !daDung.has(x));
      if (!id) {
        return `Bản chạy thử chỉ giữ được ${ID_BAO_GIA_GIA_LAP.length} hồ sơ báo giá. Xóa bớt dữ liệu cũ rồi thử lại.`;
      }
      const soHienCo = baoGiaRef.current.filter((b) =>
        b.code.startsWith(`${dn.maDuAn}-BG-`),
      ).length;
      const moi: BaoGia = {
        id,
        code: `${dn.maDuAn}-BG-${String(soHienCo + 1).padStart(3, "0")}`,
        prId,
        prCode: dn.code,
        tieuDe: `Báo giá ${dn.tieuDe}`,
        /* Lập ra là đã ở trạng thái chờ trưởng bộ phận duyệt — không qua `dang_thu_thap`, vì
           chính lúc này người dùng đang bấm trình. */
        trangThai: "da_so_sanh",
        items: dn.items.map((d) => ({
          id: `bg-${id}-${d.stt}`,
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
      ghiLichSuDeNghi(
        prId,
        nguoiThucHien,
        `Trình trưởng bộ phận xét duyệt ${moi.code} — bản báo giá nằm trong tệp đính kèm bước “Yêu cầu NCC báo giá”`,
      );
      return null;
    },
    [ghiLichSuDeNghi, loiKhiHoSoDaDong],
  );
  const themTepGiaiDoan = useCallback(
    (
      prId: string,
      maGiaiDoan: string,
      tepMoi: MoTaTep[],
      nguoiThucHienTen: string,
    ): string | null => {
      if (tepMoi.length === 0) return null;
      const dn = deNghiRef.current.find((d) => d.id === prId);
      if (!dn) return "Không tìm thấy đề nghị.";

      const loi = loiKhiHoSoDaDong(dn, "đính kèm thêm tệp");
      if (loi) return loi;

      /**
       * 🔴 CHẶN SỐ TỆP Ở ĐÂY chứ không chỉ ở ô chọn tệp. Giao diện ẩn nút là để người dùng
       * khỏi bấm nhầm; còn chốt chặn thật phải nằm cùng chỗ ghi dữ liệu, nếu không thì hai
       * người cùng gắn một lúc là vượt mức mà không ai biết.
       */
      const daCo = dn.tepGiaiDoan?.[maGiaiDoan] ?? [];
      if (daCo.length + tepMoi.length > TOI_DA_TEP_MOI_BUOC) {
        return `Mỗi bước chỉ nhận tối đa ${TOI_DA_TEP_MOI_BUOC} tệp. Bước này đang có ${daCo.length} tệp nên chỉ gắn thêm được ${Math.max(0, TOI_DA_TEP_MOI_BUOC - daCo.length)} tệp nữa — gỡ bớt tệp cũ rồi thử lại.`;
      }

      setDeNghi((truoc) =>
        truoc.map((d) =>
          d.id !== prId
            ? d
            : {
                ...d,
                tepGiaiDoan: {
                  ...(d.tepGiaiDoan ?? {}),
                  [maGiaiDoan]: [...(d.tepGiaiDoan?.[maGiaiDoan] ?? []), ...tepMoi],
                },
              },
        ),
      );

      /**
       * 🔴 Ghi TÊN BƯỚC và TÊN TỆP — người đọc nhật ký cần biết chứng từ nào vào bước nào.
       * 🔴 KHÔNG ghi tên nhà cung cấp: khối Lịch sử hiện cho cả vai trò không được xem NCC
       *    (quy ước CLAUDE.md mục 7). Tên tệp do người dùng đặt nên vẫn có thể lộ — nhưng đó
       *    là chữ họ tự gõ, khác với việc app tự lôi tên NCC trong dữ liệu ra.
       */
      ghiLichSuDeNghi(
        prId,
        nguoiThucHienTen,
        `Đính kèm ${tepMoi.length} tệp ở bước ${tenBuoc(maGiaiDoan)}: ${tepMoi
          .map((t) => t.tenTep)
          .join(", ")}`,
      );
      return null;
    },
    [ghiLichSuDeNghi, loiKhiHoSoDaDong],
  );

  /**
   * ★ ĐẶT MỘT TỆP VÀO "Ô CÓ TÊN" CỦA MỘT BƯỚC — thêm tệp VÀ gắn nhãn trong CÙNG MỘT lần ghi.
   *
   * 🔴 VÌ SAO PHẢI GỘP LÀM MỘT HÀM — lỗi thật, mất cả ngày 20/08/2026 mới thấy.
   * Cách cũ ở giao diện là gọi `themTepGiaiDoan` rồi gọi tiếp `datGhiChuTepGiaiDoan`. Sai ở chỗ:
   * `themTepGiaiDoan` chỉ **xếp lịch** `setDeNghi`, còn `datGhiChuTepGiaiDoan` đọc
   * `deNghiRef.current` — mà ref chỉ được gán **lúc render**. Nên tệp vừa thêm CHƯA tồn tại
   * trong bản mà hàm thứ hai nhìn thấy → nó trả *"Tệp này không còn trong hồ sơ"* và **không ghi
   * nhãn**. Chỗ gọi lại không bắt giá trị trả về, nên không ai biết.
   * Hậu quả trên giao diện: ô báo giá **luôn trống** dù người dùng đã đính tệp, app **luôn báo
   * thiếu bản báo giá**, và nút "Trình xét duyệt" khóa vĩnh viễn.
   *
   * 👉 Nhãn được gắn thẳng vào đối tượng tệp TRƯỚC khi thêm, nên không phải đọc lại state.
   *
   * 🔴 THAY TỆP THÌ GỠ BẢN CŨ. Nếu ô đã có tệp mang đúng nhãn này, bản cũ bị gỡ khỏi bước.
   * Không làm vậy thì hai tệp cùng nhãn, mà chỗ hiển thị chỉ lấy được một cái — bản kia **vô
   * hình** dù vẫn nằm trong hồ sơ. Đây đúng là điều đã xảy ra với nút "Thay tệp".
   *
   * Trả câu giải thích, `null` là đã ghi.
   */
  const datTepVaoOGiaiDoan = useCallback(
    (
      prId: string,
      maGiaiDoan: string,
      tepMoi: MoTaTep,
      nhanO: string,
      nguoiThucHienTen: string,
    ): string | null => {
      const dn = deNghiRef.current.find((d) => d.id === prId);
      if (!dn) return "Không tìm thấy đề nghị.";

      const loi = loiKhiHoSoDaDong(dn, "đính kèm tệp vào ô");
      if (loi) return loi;

      const nhan = nhanO.trim();
      if (nhan === "") return "Thiếu nhãn ô — đây là lỗi lập trình, báo lại người phát triển.";
      if (nhan.length > DAI_TOI_DA_GHI_CHU_TEP) {
        return `Nhãn ô dài quá ${DAI_TOI_DA_GHI_CHU_TEP} ký tự.`;
      }

      const daCo = dn.tepGiaiDoan?.[maGiaiDoan] ?? [];
      const tepCu = daCo.find((t) => (t.ghiChu ?? "").trim() === nhan);

      /* Hạn mức tính SAU khi trừ bản cũ sắp gỡ — thay tệp thì tổng số không tăng, nên không
         được để nó bị hạn mức chặn oan. */
      const soSauKhiGhi = daCo.length + 1 - (tepCu ? 1 : 0);
      if (soSauKhiGhi > TOI_DA_TEP_MOI_BUOC) {
        return `Mỗi bước chỉ nhận tối đa ${TOI_DA_TEP_MOI_BUOC} tệp. Bước này đang có ${daCo.length} tệp — gỡ bớt tệp cũ rồi thử lại.`;
      }

      setDeNghi((truoc) =>
        truoc.map((d) =>
          d.id !== prId
            ? d
            : {
                ...d,
                tepGiaiDoan: {
                  ...(d.tepGiaiDoan ?? {}),
                  [maGiaiDoan]: [
                    ...(d.tepGiaiDoan?.[maGiaiDoan] ?? []).filter((t) => t.id !== tepCu?.id),
                    { ...tepMoi, ghiChu: nhan },
                  ],
                },
              },
        ),
      );

      /* Một dòng nhật ký cho một việc người dùng làm. Ghi hai dòng (thêm tệp + đặt nhãn) làm
         khối Lịch sử dài gấp đôi mà không nói thêm gì.
         🔴 KHÔNG ghi tên nhà cung cấp — nhãn ô là "Báo giá NCC 1", không phải tên hãng. */
      ghiLichSuDeNghi(
        prId,
        nguoiThucHienTen,
        tepCu
          ? `Thay tệp ở ô “${nhan}” (bước ${tenBuoc(maGiaiDoan)}): ${tepCu.tenTep} → ${tepMoi.tenTep}`
          : `Đính kèm tệp vào ô “${nhan}” ở bước ${tenBuoc(maGiaiDoan)}: ${tepMoi.tenTep}`,
      );
      return null;
    },
    [ghiLichSuDeNghi, loiKhiHoSoDaDong],
  );

  /**
   * Gỡ một tệp khỏi một bước.
   *
   * ⚠️ KHÔNG gọi `xoaTep` — nội dung tệp vẫn nằm trong kho. Gỡ chứng từ là việc dễ làm nhầm
   * (bấm nhầm dấu ×), mà chứng từ mất là mất hẳn; giữ nội dung lại thì còn đường tìm về.
   * Đây cũng đúng cách khối bình luận đang làm với tệp bị gỡ khỏi bài.
   */
  const goTepGiaiDoan = useCallback(
    (
      prId: string,
      maGiaiDoan: string,
      tepId: string,
      nguoiThucHienTen: string,
    ): string | null => {
      const dn = deNghiRef.current.find((d) => d.id === prId);
      if (!dn) return "Không tìm thấy đề nghị.";

      const loi = loiKhiHoSoDaDong(dn, "gỡ tệp đính kèm");
      if (loi) return loi;

      const tep = (dn.tepGiaiDoan?.[maGiaiDoan] ?? []).find((t) => t.id === tepId);
      if (!tep) return "Tệp này không còn trong hồ sơ — có thể người khác vừa gỡ trước.";

      setDeNghi((truoc) =>
        truoc.map((d) => {
          if (d.id !== prId) return d;
          const conLai = (d.tepGiaiDoan?.[maGiaiDoan] ?? []).filter((t) => t.id !== tepId);
          const moi = { ...(d.tepGiaiDoan ?? {}) };
          // Bước không còn tệp nào thì bỏ hẳn khóa, đừng để lại mảng rỗng làm rác dữ liệu.
          if (conLai.length > 0) moi[maGiaiDoan] = conLai;
          else delete moi[maGiaiDoan];
          return { ...d, tepGiaiDoan: Object.keys(moi).length > 0 ? moi : undefined };
        }),
      );

      ghiLichSuDeNghi(
        prId,
        nguoiThucHienTen,
        `Gỡ tệp đính kèm ở bước ${tenBuoc(maGiaiDoan)}: ${tep.tenTep}`,
      );
      return null;
    },
    [ghiLichSuDeNghi, loiKhiHoSoDaDong],
  );

  /**
   * ★ GHI CHÚ CHO MỘT TỆP ĐÍNH KÈM — Ban lãnh đạo 17/08/2026: *"thêm chức năng ghi chú cho
   * mỗi tệp đính kèm thêm"*.
   *
   * 🔴 VÌ SAO CẦN: app KHÔNG đổi được tên tệp. Ảnh nhà cung cấp gửi qua Zalo về máy mang tên
   * máy sinh (`1785921139635_1967909016357413267_…jpg`). Ba tháng sau mở hồ sơ ra, cả năm tệp
   * đều mang tên như vậy thì không ai biết đâu là bản báo giá của nhà cung cấp nào, đâu là hóa
   * đơn, đâu là ảnh phiếu giao nhận. Ghi chú chính là NHÃN NGƯỜI ĐỌC ĐƯỢC thay cho cái tên đó.
   *
   * 🔴 CHẶN KHI HỒ SƠ ĐÃ ĐÓNG, cùng luật với `themTepGiaiDoan` / `goTepGiaiDoan`: nhãn của
   * chứng từ cũng là một phần nội dung hồ sơ mà kho và trưởng bộ phận đã ký xác nhận. XEM thì
   * vẫn xem được bình thường.
   */
  const datGhiChuTepGiaiDoan = useCallback(
    (
      prId: string,
      maGiaiDoan: string,
      tepId: string,
      ghiChu: string,
      nguoiThucHienTen: string,
    ): string | null => {
      const dn = deNghiRef.current.find((d) => d.id === prId);
      if (!dn) return "Không tìm thấy đề nghị.";

      const loi = loiKhiHoSoDaDong(dn, "ghi chú cho tệp đính kèm");
      if (loi) return loi;

      const tep = (dn.tepGiaiDoan?.[maGiaiDoan] ?? []).find((t) => t.id === tepId);
      if (!tep) return "Tệp này không còn trong hồ sơ — có thể người khác vừa gỡ trước.";

      /**
       * 🔴 CHẶN ĐỘ DÀI Ở ĐÂY chứ không chỉ ở ô nhập — xem lý do 1MB/document ở
       * `DAI_TOI_DA_GHI_CHU_TEP`. Giao diện chặn là để người dùng khỏi gõ thừa; còn chốt chặn
       * thật phải nằm cùng chỗ ghi dữ liệu.
       */
      const chu = ghiChu.trim();
      if (chu.length > DAI_TOI_DA_GHI_CHU_TEP) {
        return `Ghi chú dài quá ${DAI_TOI_DA_GHI_CHU_TEP} ký tự (đang ${chu.length}). Ghi chú chỉ là nhãn ngắn để tra cứu — nội dung dài thì viết vào khối Trao đổi.`;
      }

      /**
       * Không có gì đổi thì không ghi gì cả. Mở hộp ra rồi bấm Lưu mà chưa sửa chữ nào là
       * chuyện thường; ghi nhật ký lúc đó chỉ làm loãng đúng cái khối dùng để truy trách nhiệm.
       */
      if (chu === (tep.ghiChu ?? "")) return null;

      setDeNghi((truoc) =>
        truoc.map((d) => {
          if (d.id !== prId) return d;
          const dsMoi = (d.tepGiaiDoan?.[maGiaiDoan] ?? []).map((t) => {
            if (t.id !== tepId) return t;
            const sao: MoTaTep = { ...t };
            // Gõ rỗng = XÓA ghi chú. Bỏ hẳn khóa chứ không lưu chuỗi rỗng, để mọi chỗ hiển
            // thị chỉ cần hỏi `t.ghiChu` là đủ.
            if (chu) sao.ghiChu = chu;
            else delete sao.ghiChu;
            return sao;
          });
          return {
            ...d,
            tepGiaiDoan: { ...(d.tepGiaiDoan ?? {}), [maGiaiDoan]: dsMoi },
          };
        }),
      );

      /**
       * 🔴 GHI NHẬT KÝ — quy ước CLAUDE.md mục 7: mọi hàm ghi dữ liệu trong file này đều phải
       * gọi `ghiLichSuDeNghi`. Nhãn của chứng từ đổi mà không để lại vết thì hai người sửa qua
       * lại chẳng ai biết ai đã đặt lại tên cho cái gì.
       *
       * 🔴 KHÔNG ghi tên nhà cung cấp: khối Lịch sử hiện cho cả vai trò không được xem NCC.
       * Riêng phần ghi chú thì chép NGUYÊN VĂN — đó là chữ người dùng tự gõ, khác hẳn việc app
       * tự lôi tên NCC trong dữ liệu ra.
       */
      ghiLichSuDeNghi(
        prId,
        nguoiThucHienTen,
        chu
          ? `Ghi chú cho tệp ${tenTepChoNhatKy(tep.tenTep)} ở bước ${tenBuoc(maGiaiDoan)}: ${chu}`
          : `Bỏ ghi chú của tệp ${tenTepChoNhatKy(tep.tenTep)} ở bước ${tenBuoc(maGiaiDoan)}`,
      );
      return null;
    },
    [ghiLichSuDeNghi, loiKhiHoSoDaDong],
  );

  /**
   * BÌNH LUẬN — người dùng tự viết, khác hẳn nhật ký do app ghi.
   *
   * 📌 Không đụng tới `lichSu`: xem chú thích ở phần khai báo kiểu.
   */
  const vietBinhLuan = useCallback(
    (
      prId: string,
      nguoi: { uid: string; ten: string },
      noiDung: string,
      tep?: MoTaTep[],
      traLoiChoId?: string,
    ) => {
      const chu = noiDung.trim();
      // Không có chữ mà cũng không có tệp thì chẳng có gì để lưu.
      if (!chu && (tep ?? []).length === 0) return;
      setDeNghi((truoc) =>
        truoc.map((dn) => {
          if (dn.id !== prId) return dn;
          const cu = dn.binhLuan ?? [];
          /* Trả lời của trả lời quy về bài gốc — giữ đúng MỘT CẤP như đã khai ở kiểu dữ
             liệu. Nếu không quy về, cây bình luận lồng vô hạn, màn hẹp không đọc nổi. */
          const goc = traLoiChoId
            ? (cu.find((b) => b.id === traLoiChoId)?.traLoiChoId ?? traLoiChoId)
            : undefined;
          return {
            ...dn,
            binhLuan: [
              ...cu,
              {
                id: `bl-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
                nguoiVietUid: nguoi.uid,
                nguoiVietTen: nguoi.ten,
                thoiDiem: thoiDiemHienTai(),
                noiDung: chu,
                ...((tep ?? []).length > 0 ? { tep } : {}),
                ...(goc ? { traLoiChoId: goc } : {}),
              },
            ],
          };
        }),
      );
    },
    [],
  );

  /**
   * SỬA BÌNH LUẬN — thay cho việc xóa (Ban lãnh đạo 16/08/2026).
   *
   * Trả lý do bị chặn, `null` là sửa xong.
   *
   * 🔴 CHỐT CHẶN Ở TẦNG DỮ LIỆU, không chỉ ẩn nút: chỉ người viết mới sửa bài của mình.
   * Trưởng bộ phận thu hồi được bài người khác nhưng **không đổi được một chữ nào** — bài
   * mang tên anh A mà chữ do chị B viết là thứ không màn hình nào nhìn ra được.
   */
  const suaBinhLuan = useCallback(
    (
      prId: string,
      binhLuanId: string,
      nguoi: { uid: string; ten: string },
      noiDungMoi: string,
      tepThem?: MoTaTep[],
      idTepGo?: string[],
    ): string | null => {
      const dn = deNghiRef.current.find((d) => d.id === prId);
      if (!dn) return "Không tìm thấy đề nghị.";
      const bai = (dn.binhLuan ?? []).find((b) => b.id === binhLuanId);
      if (!bai) return "Không tìm thấy bình luận.";
      if (bai.nguoiVietUid !== nguoi.uid) return "Chỉ người viết mới sửa được bình luận này.";
      if (bai.thuHoi) return "Bình luận đã thu hồi nên không sửa được nữa.";

      const giaiDoanHienTai = xacDinhGiaiDoan(
        dn,
        donHangRef.current,
        baoGiaRef.current,
        phieuNhanRef.current,
      );
      // Hồ sơ đã đóng thì giữ nguyên để đối chiếu — cùng tinh thần với `suaMatHangDeNghi`.
      if (giaiDoanHienTai === "hoan_thanh" || giaiDoanHienTai === "that_bai") {
        return "Hồ sơ đã đóng nên không sửa được bình luận nữa. Viết một bình luận mới nếu cần bổ sung.";
      }

      const daSua = (bai.lichSuSua ?? []).length;
      if (daSua >= SO_LAN_SUA_BINH_LUAN_TOI_DA) {
        return `Bình luận này đã sửa ${daSua} lần — viết một bình luận bổ sung thay vì sửa tiếp.`;
      }

      const chuMoi = noiDungMoi.trim().slice(0, DAI_TOI_DA_BINH_LUAN);
      const goSet = new Set(idTepGo ?? []);
      const tepConLai = (bai.tep ?? []).filter((t) => !goSet.has(t.id));
      const tepMoi = [...tepConLai, ...(tepThem ?? [])];
      const coDoiChu = chuMoi !== bai.noiDung;
      const coDoiTep = goSet.size > 0 || (tepThem ?? []).length > 0;
      // Bấm Lưu mà không đổi gì thì đừng đẻ ra một vết sửa rác.
      if (!coDoiChu && !coDoiTep) return null;
      if (!chuMoi && tepMoi.length === 0) {
        return "Bình luận phải còn nội dung hoặc ít nhất một tệp đính kèm.";
      }

      const luc = thoiDiemHienTai();
      setDeNghi((truoc) =>
        truoc.map((d) => {
          if (d.id !== prId) return d;
          return {
            ...d,
            binhLuan: (d.binhLuan ?? []).map((b) => {
              if (b.id !== binhLuanId) return b;
              const goRa = (b.tep ?? []).filter((t) => goSet.has(t.id));
              return {
                ...b,
                noiDung: chuMoi,
                ...(tepMoi.length > 0 ? { tep: tepMoi } : { tep: undefined }),
                ...(goRa.length > 0
                  ? {
                      tepDaGo: [
                        ...(b.tepDaGo ?? []),
                        ...goRa.map((t) => ({
                          tep: t,
                          nguoiGoUid: nguoi.uid,
                          nguoiGoTen: nguoi.ten,
                          thoiDiem: luc,
                        })),
                      ],
                    }
                  : {}),
                lichSuSua: catLichSuSua([
                  ...(b.lichSuSua ?? []),
                  {
                    thoiDiem: luc,
                    nguoiSuaUid: nguoi.uid,
                    nguoiSuaTen: nguoi.ten,
                    noiDungTruoc: b.noiDung,
                  },
                ]),
              };
            }),
          };
        }),
      );
      // 🔴 KHÔNG chép nội dung bình luận vào nhật ký — nhật ký hiện cho cả vai trò không
      // được xem nhà cung cấp (quy ước ở `ghiLichSuDeNghi`).
      ghiLichSuDeNghi(prId, nguoi.ten, "Sửa một bình luận");
      return null;
    },
    [ghiLichSuDeNghi],
  );


  /**
   * 🔴 `nguoiBoTen` LÀ NGƯỜI ĐANG BẤM BỎ, không phải người đã thêm.
   *
   * Trước 14/08/2026 chỗ này ghi `bi.nguoiThemTen` vào nhật ký — tức tên người ĐÃ THÊM người
   * theo dõi đó. Kết quả: anh A thêm chị B, sau đó anh C bỏ chị B, nhật ký lại ghi *"anh A bỏ
   * chị B khỏi danh sách theo dõi"*. Nhật ký đổ oan cho người không làm, mà đây chính là thứ
   * dùng để truy trách nhiệm (quyết định 25: ghi rõ **ai** · làm gì · lúc nào).
   */
  const boNguoiTheoDoi = useCallback((prId: string, uid: string, nguoiBoTen: string) => {
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
              nguoiThucHien: nguoiBoTen,
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
   * Dùng lại đúng cơ chế thông báo đã có, nên nhân viên
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
      /**
       * Danh mục nhà cung cấp = **mẫu trong mã nguồn + phần thu mua tự thêm**.
       *
       * 📌 Phần tự thêm để SAU danh mục mẫu: người dùng vừa thêm ai thì thấy ở cuối danh sách,
       * đúng thứ tự thời gian — dễ tìm hơn là chen vào giữa theo bảng chữ cái.
       */
      nhaCungCap: [...NHA_CUNG_CAP, ...nhaCungCapThem],
      themNhaCungCap,
      baoGia,
      congNo: CONG_NO_MAU,
      themDeNghiGiaLap,
      phanBoDong,
      boPhanBoDong,
      luiVeBuoc,
      suaMatHangDeNghi,
      chuyenViecDong,
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
      luuDeXuatNCC,
      luuThongTinNCC,
      trinhXetDuyetBaoGia,
      luuDeXuatNCCChoDeNghi,
      trinhXetDuyetBaoGiaChoDeNghi,
      duyetPhuongAnTach,
      dongDoDeNghi,
      suaThongTinChung,
      suaThoiHan,
      doiLuuTru,
      suaTruongBoSung,
      nhanBanDeNghi,
      tachTheoPhanBo,
      xoaDeNghi,
      themNguoiTheoDoi,
      boNguoiTheoDoi,
      ghiLichSuDeNghi,
      datSoBaoGiaChoPhieu,
      danhDauCongViecGiaiDoan,
      themTepGiaiDoan,
      datTepVaoOGiaiDoan,
      goTepGiaiDoan,
      datGhiChuTepGiaiDoan,
      vietBinhLuan,
      suaBinhLuan,
      chuyenTiepChoNhanVien,
      thongBao,
      cauHinh,
      lichSuCauHinh,
      luuCauHinhQuyTrinh,
      danhDauDaDocThongBao,
      xoaDuLieuChayThu,
      trangThaiKhoChung,
    }),
    [
      nhaCungCapThem,
      themNhaCungCap,
      deNghi,
      donHang,
      giaDonHang,
      phieuNhan,
      baoGia,
      themDeNghiGiaLap,
      phanBoDong,
      boPhanBoDong,
      luiVeBuoc,
      suaMatHangDeNghi,
      chuyenViecDong,
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
      luuDeXuatNCC,
      luuThongTinNCC,
      trinhXetDuyetBaoGia,
      luuDeXuatNCCChoDeNghi,
      trinhXetDuyetBaoGiaChoDeNghi,
      duyetPhuongAnTach,
      dongDoDeNghi,
      suaThongTinChung,
      suaThoiHan,
      doiLuuTru,
      suaTruongBoSung,
      nhanBanDeNghi,
      tachTheoPhanBo,
      xoaDeNghi,
      themNguoiTheoDoi,
      boNguoiTheoDoi,
      ghiLichSuDeNghi,
      datSoBaoGiaChoPhieu,
      danhDauCongViecGiaiDoan,
      themTepGiaiDoan,
      datTepVaoOGiaiDoan,
      goTepGiaiDoan,
      datGhiChuTepGiaiDoan,
      vietBinhLuan,
      suaBinhLuan,
      chuyenTiepChoNhanVien,
      thongBao,
      cauHinh,
      lichSuCauHinh,
      luuCauHinhQuyTrinh,
      danhDauDaDocThongBao,
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
