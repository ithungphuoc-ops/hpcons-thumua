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
  nguoiCanXuLy,
  vuongMacLapDonHang,
  xacDinhGiaiDoan,
  type GiaiDoanMuaHang,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import { thoiDiemHienTai } from "@/6-tien-ich/dinh-dang";
import { coCongThucTuDong, dungTenDeNghi, maDeNghiTiepTheo } from "@/2-quy-trinh/dat-ten-de-nghi";
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
  MoTaTep,
  PhongBanNguon,
  NhomDeXuat,
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
    /** Tên người nhận việc. Bỏ trống thì tra danh bạ — chỉ đúng với tài khoản mẫu. */
    tenNguoiPhuTrach?: string,
  ) => void;
  boPhanBoDong: (prId: string, sttDong: number, nguoiThucHien: string) => void;
  /**
   * Lùi đề nghị về MỘT bước trước bằng cách hủy chứng từ tương ứng.
   * Luật "được lùi hay không" ở `2-quy-trinh/giai-doan-mua-hang.ts` → `quyetDinhLui`.
   */
  luiVeBuoc: (prId: string, ve: GiaiDoanMuaHang, nguoiThucHien: string) => void;
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
   * Xóa một lời bình.
   *
   * ⚠️ Chỉ xóa được bài của CHÍNH MÌNH — chốt chặn nằm ngay trong hàm này chứ không chỉ ở
   * giao diện, để không ai gọi vòng qua nút bấm mà xóa được lời người khác.
   */
  xoaBinhLuan: (prId: string, binhLuanId: string, nguoiXoaUid: string) => void;

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
    const d = { deNghi, donHang, giaDonHang, phieuNhan, baoGia, thongBao, cauHinh, lichSuCauHinh };
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
  }, [daNapTuMay, deNghi, donHang, giaDonHang, phieuNhan, baoGia, thongBao, cauHinh, lichSuCauHinh, dayLenMayChu]);

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
    (prId: string, ve: GiaiDoanMuaHang, nguoiThucHien: string): void => {
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
        // Mở lại bảng để thu thập tiếp — GIỮ NGUYÊN giá đã nhập.
        setBaoGia((truoc) =>
          truoc.map((b) =>
            b.prId === prId && b.trangThai === "da_so_sanh"
              ? { ...b, trangThai: "dang_thu_thap", ngayCapNhat: ngay }
              : b,
          ),
        );
      } else if (ve === "xet_duyet_bao_gia") {
        // Bỏ nhà cung cấp đã chốt, đưa bảng về trạng thái chờ duyệt.
        setBaoGia((truoc) =>
          truoc.map((b) =>
            b.prId === prId && b.trangThai === "da_chon_ncc"
              ? {
                  ...b,
                  trangThai: "da_so_sanh",
                  nccDaChonId: undefined,
                  nccDaChonTen: undefined,
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
        `Lùi một bước về "${NHAN_GIAI_DOAN[ve].nhan}" — kéo thẻ trên bảng quy trình`,
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
    },
    [],
  );

  const themDonHang = useCallback(
    (dauVao: DauVaoDonHangMoi) => {
      const { donGia, phanTien, ...po } = dauVao;

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
       */
      const chan = vuongMacLapDonHang(baoGiaRef.current.filter((b) => b.prId === po.prId));
      if (chan) return { loi: chan };

      // Số thứ tự PO chạy theo DỰ ÁN, đúng quy tắc mã hồ sơ Thông báo 09/2026.
      const soHienCo = donHangRef.current.filter((p) => p.maDuAn === po.maDuAn).length;
      const stt = String(soHienCo + 1).padStart(3, "0");
      const code = `${po.maDuAn}-PO-${stt}`;

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
          items: dongGiuLai.map((d, i) => ({
            ...d,
            stt: i + 1,
            nguoiPhuTrachUid: nguoi.uid,
            nguoiPhuTrachTen: nguoi.ten,
            // Người tách tự nhận việc, nên người phân bổ cũng chính là họ.
            nguoiPhanBoTen: nguoi.ten,
            thoiDiemPhanBo: thoiDiemHienTai(),
          })),
          lichSu: [
            {
              thoiDiem: thoiDiemHienTai(),
              nguoiThucHien: nguoi.ten,
              hanhDong: `Nhân bản từ ${goc.code}`,
              ghiChu:
                (giu
                  ? `Giữ ${dongGiuLai.length}/${goc.items.length} mặt hàng của phiếu gốc`
                  : `Giữ nguyên toàn bộ ${goc.items.length} mặt hàng`) +
                // Ghi rõ người tách nhận luôn việc — sau này đọc nhật ký biết vì sao phiếu
                // này có người phụ trách ngay từ lúc sinh ra.
                `. Người tách nhận phụ trách toàn bộ ${dongGiuLai.length} dòng.`,
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

  const xoaBinhLuan = useCallback((prId: string, binhLuanId: string, nguoiXoaUid: string) => {
    setDeNghi((truoc) =>
      truoc.map((dn) => {
        if (dn.id !== prId) return dn;
        const cu = dn.binhLuan ?? [];
        const bai = cu.find((b) => b.id === binhLuanId);
        // 🔴 Chốt chặn ở TẦNG DỮ LIỆU, không chỉ ẩn nút trên giao diện.
        if (!bai || bai.nguoiVietUid !== nguoiXoaUid) return dn;
        return {
          ...dn,
          /* Xóa luôn các trả lời của bài đó — để lại thì chúng thành mồ côi, người đọc
             thấy câu trả lời mà không biết đang trả lời cái gì. */
          binhLuan: cu.filter((b) => b.id !== binhLuanId && b.traLoiChoId !== binhLuanId),
        };
      }),
    );
  }, []);

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
      nhaCungCap: NHA_CUNG_CAP,
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
      vietBinhLuan,
      xoaBinhLuan,
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
      vietBinhLuan,
      xoaBinhLuan,
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
