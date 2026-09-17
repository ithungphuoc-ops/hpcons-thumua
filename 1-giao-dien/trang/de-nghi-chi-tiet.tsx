"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  BadgeCheck,
  Check,
  Copy,
  ListChecks,
  ListPlus,
  MoreHorizontal,
  Paperclip,
  SlidersHorizontal,
  ClipboardCheck,
  Send,
  ClipboardList,
  FileWarning,
  GitBranch,
  Forward,
  Package,
  ScanSearch,
  ShoppingCart,
  X,
} from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { nhanPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";
import { NHAN_NHOM_DE_XUAT } from "@/3-du-lieu/kieu-du-lieu";
import type { BaoGia } from "@/3-du-lieu/kieu-du-lieu";
import type { Quyen } from "@/4-phan-quyen/quyen";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { LienKetTep } from "@/1-giao-dien/thanh-phan-dung-chung/lien-ket-tep";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { DanhSachTruong } from "@/1-giao-dien/thanh-phan-dung-chung/danh-sach-truong";
import { KhoiGap } from "@/1-giao-dien/thanh-phan-dung-chung/khoi-gap";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import type { CongViecGiaiDoan } from "@/2-quy-trinh/cau-hinh-quy-trinh";
import { BangPhanBo } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-phan-bo";
import { KhoiDeXuatCon } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-de-xuat-con";
import { OSuaSoBaoGia } from "@/1-giao-dien/thanh-phan-nghiep-vu/o-sua-so-bao-gia";
import { KhoiNguoiTheoDoi } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-nguoi-theo-doi";
import { KhoiTraoDoi } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-trao-doi";
import {
  KhoiDauVaoTheoGiaiDoan,
  NhanPhanTrongGiaiDoan,
  type GiaiDoanDauVao,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-dau-vao-theo-giai-doan";
import { KhuDinhKemGiaiDoan } from "@/1-giao-dien/thanh-phan-nghiep-vu/khu-dinh-kem-giai-doan";
import { ThanhGiaiDoan } from "@/1-giao-dien/thanh-phan-nghiep-vu/thanh-giai-doan";
import {
  CotThongTinDeNghi,
  type MocGiaiDoan,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/cot-thong-tin-de-nghi";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
/* Dựng đường dẫn mở hồ sơ bên App Request — Ban lãnh đạo 13/09/2026, xem ô "Đường dẫn đề nghị". */
import { duongDanHoSoAppRequest } from "@/6-tien-ich/dia-chi-app-de-nghi";
/* Menu ⋯ gom 4 việc của khối "Thông tin đề nghị" — Ban lãnh đạo 13/09/2026, xem chỗ dùng. */
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/1-giao-dien/nen-tang-ui/dropdown-menu";
/* Hai hộp sửa trường — dời từ `de-nghi-danh-sach.tsx` sang 12/09/2026, xem chỗ dựng ở cuối file. */
import { HopSuaTruongBoSung } from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-sua-de-nghi";
import { HopSuaTruongTuyChinh } from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-sua-truong-tuy-chinh";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Badge } from "@/1-giao-dien/nen-tang-ui/badge";
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";
/* Khối ĐỀ XUẤT + TRÌNH XÉT DUYỆT của bước ② — KHÔNG có phần nhập số liệu giá (chỉ đạo Ban lãnh
   đạo 19/08/2026). Xem chú thích đầy đủ tại chỗ nhúng. */
/* N ô đính kèm báo giá theo đúng SL Báo giá đã yêu cầu (Ban lãnh đạo 20/08/2026). */
import { KhuBaoGiaTheoSoLuong } from "@/1-giao-dien/thanh-phan-nghiep-vu/khu-bao-gia-theo-so-luong";
import {
  danhSachNCCDaBaoGia,
  NHAN_O_SO_SANH,
  tenNCCCuaO,
  tepBaoGiaDaCo,
  tepBaoGiaDaDuyet,
  tepSoSanh,
  vuongMacTrinhXetDuyet,
} from "@/2-quy-trinh/bao-gia-dinh-kem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  duocXemBaoGiaCuaDeNghi,
  duocXacNhanNhanDuHangCuaHoSo,
} from "@/4-phan-quyen/quyen-theo-ho-so";
/* 📌 KHÔNG còn `LY_DO_NHANH_PHONG_BAN` ở tệp này từ 15/09/2026 — câu giải thích đó là `moTa` của ô
   "Phiếu giao hàng" ở bước ⑥, mà ô đó đã bỏ theo chỉ đạo Sếp (*"trường này đang bị dư => bỏ"*).
   Hằng số vẫn sống trong `ho-so-phong-ban.ts` và vẫn được `vuongMacHoanThanhQuyTrinh` dùng để giải
   thích lúc chặn — đừng xoá nó ở đó. */
import { laHoSoPhongBan } from "@/2-quy-trinh/ho-so-phong-ban";
// Quyền theo TỪNG hồ sơ: ai đang phụ trách dòng nào của đề nghị này.
import { laViecCuaToi } from "@/2-quy-trinh/sap-xep-uu-tien";
import {
  poDaGiaoDu,
  soNgayConLai,
  tinhTienDoDeNghi,
  nhacDoiChieuThuMua,
  tinhTienDoPO,
  vuongMacXacNhanKho,
} from "@/2-quy-trinh/tinh-toan";
import { BangTienDoPO } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-tien-do-po";
import { formatMocThoiGian } from "@/6-tien-ich/dinh-dang";
import {
  GIAI_DOAN_MUA_HANG,
  giaiDoanDaKetThuc,
  NHAN_GIAI_DOAN,
  xacDinhGiaiDoan,
  duocDinhDonMuaHangNCCKy,
  duocSuaHopDongTheoGiaiDoan,
  giaiDoanDaToiLuot,
  conNoCuaBuoc,
  congViecConTreoCacBuocTruoc,
  /* 📌 BỎ `vuongMacXoKhoiTiepNhan` ngày 14/09/2026 — Sếp chỉ ra vòng luẩn quẩn: khoá khối bước ①
     là khoá luôn bảng vật tư nằm trong đó, mà phải xem bảng đó mới biết cần kiểm vật tư gì để
     checkin kho. Lý do đầy đủ ghi tại chỗ cũ trong khối bước ①. Hàm vẫn còn trong
     `2-quy-trinh/giai-doan-mua-hang.ts` — đừng xoá, xem ghi chú ở đó. */
  type GiaiDoanMuaHang,
} from "@/2-quy-trinh/giai-doan-mua-hang";
// Ba chứng từ bắt buộc cuối quy trình — luật ở một chỗ, xem chú thích đầu file đó.
import {
  BUOC_DINH_KEM_HO_SO_THANH_TOAN,
  BUOC_DINH_KEM_HOP_DONG,
  /* Câu nhắc "còn nợ chứng từ" — dùng CHUNG với mục 3/4 ở bước ⑧ (Sếp 16/09/2026). */
  cauNhacConNoHopDong,
  coHopDong,
  KHOA_LY_DO_THIEU_HOP_DONG,
  /* Hai lý do chọn sẵn thay ô gõ tự do — Ban lãnh đạo 13/09/2026. */
  LY_DO_THIEU_HOP_DONG_CHON,
  lyDoThieuHopDong,
  /* Chữ hiện ra màn hình cho lựa chọn lý do — KHÁC giá trị lưu, xem chú thích tại chỗ khai. */
  tenHienLyDoThieuHopDong,
  /* Chốt "có tệp HỢP ĐỒNG **hoặc** có lý do" — dùng để khóa nút Lập đơn đặt hàng (13/09/2026).
     🔴 KHÔNG thay bằng `coHopDong`: hàm đó chỉ hỏi có tệp, dùng nhầm là khóa cứng đơn mẫu PO-02. */
  vuongMacRoiBuocLapDon,
  NHAN_TEP_HOA_DON_VAT,
  NHAN_TEP_HOP_DONG,
  NHAN_TEP_PHIEU_CHI,
  NHAN_TEP_UNC,
  tepPhieuChi,
  /* 📌 ĐÃ BỎ `BUOC_DINH_KEM_PHIEU_GIAO_HANG`, `NHAN_TEP_PHIEU_GIAO_HANG`,
     `tepPhieuGiaoHangPhongBan` khỏi tệp này ngày 15/09/2026 — chúng chỉ phục vụ ô "Phiếu giao hàng"
     ở bước ⑥, mà Sếp đã cho bỏ ô đó (*"trường này đang bị dư => bỏ"*). Ba thứ đó **vẫn còn** trong
     `chung-tu-cuoi-quy-trinh.ts` vì tầng luật còn dùng — xem chú thích tại chỗ khai báo. */
  TEN_HIEN_HOP_DONG,
  /* ★★ TÁCH HAI CHỨNG TỪ — Sếp 16/09/2026 (*"Tách làm 2 mục riêng"*). Đơn mua hàng NCC ký nay có
     NGĂN RIÊNG, NHÃN RIÊNG, LÝ DO THIẾU RIÊNG. 🔴 `TEN_HIEN_HOP_DONG_BUOC_DAT_HANG` (mẹo đổi tên
     hiển thị theo bước) đã bị XOÁ trong cùng lượt — xem bia mộ tại chỗ khai cũ. */
  BUOC_DINH_KEM_DON_MUA_HANG,
  BUOC_DINH_KEM_KHAC,
  TEN_HIEN_DINH_KEM_KHAC,
  tepDinhKemKhac,
  cauNhacConNoChungTu,
  KHOA_LY_DO_THIEU_DON_MUA_HANG,
  LY_DO_THIEU_DON_MUA_HANG_CHON,
  lyDoThieuDonMuaHang,
  NHAN_TEP_DON_MUA_HANG,
  tepDonMuaHangNCCKy,
  TEN_HIEN_DON_MUA_HANG,
  tepHoaDonVAT,
  tepHopDongSuaDuoc,
  tepUNC,
  thieuHopDongDaGhiLyDo,
  vuongMacHoanThanhQuyTrinh,
} from "@/2-quy-trinh/chung-tu-cuoi-quy-trinh";
import { OChungTuBatBuoc } from "@/1-giao-dien/thanh-phan-nghiep-vu/o-chung-tu-bat-buoc";
/* Khối "Kết quả" của bước ⑦ — bộ hồ sơ thanh toán 7 mục (Ban lãnh đạo 26/08/2026). */
import { KhoiBoHoSoThanhToan } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-bo-ho-so-thanh-toan";
import {
  nhanAnToan,
  NHAN_TRANG_THAI_PO,
} from "@/2-quy-trinh/trang-thai";

/**
 * ★★ CÔNG TẮC HIỆN/ẨN MENU ⋯ CỦA KHỐI "THÔNG TIN ĐỀ NGHỊ".
 *
 * 🔴 Ban lãnh đạo 13/09/2026, khoanh đỏ đúng nút ⋯ ở góc phải khối: *"ẩn luôn này đi, nhưng vẫn
 * giữ code. a sẽ sửa sau"*. Nên đây là ẨN HIỂN THỊ, KHÔNG phải xóa chức năng — toàn bộ mã của
 * bốn việc bên dưới giữ nguyên từng dòng, đổi cờ này thành `true` là hiện lại y như cũ.
 *
 * 🔴🔴 BIẾT RÕ CÁI GIÁ CỦA VIỆC ẨN, ĐỪNG ĐỂ PHIÊN SAU TƯỞNG LÀ VÔ HẠI. Đây là LỐI VÀO CUỐI CÙNG
 * của bốn chức năng (menu ⋯ trên thẻ đã bỏ ngày 12/09/2026, hàng 4 nút đã gom vào đây 13/09).
 * Ẩn đi thì trong lúc này KHÔNG CÒN CÁCH NÀO trong app để:
 *   · Sao chép mã hồ sơ bằng một cú bấm
 *   · **Chỉnh sửa trường dữ liệu** — chỗ DUY NHẤT sửa được nội dung một dòng mặt hàng đã nhập
 *     (bảng Phân bổ chỉ thêm/xóa), và dòng đã lên đơn thì xóa bị chặn → gõ nhầm là kẹt
 *   · Sửa cặp tên–giá trị ở "Trường tự thêm"
 *   · Lưu trữ / bỏ lưu trữ hồ sơ
 * Sếp đã được báo trước điều này khi gom vào menu hôm nay và vẫn chọn ẩn, kèm câu *"a sẽ sửa
 * sau"* — tức đây là trạng thái TẠM, chờ Sếp chốt chỗ ở mới cho bốn việc.
 *
 * 📌 Cố ý khai kiểu `boolean` chứ không để TypeScript thu về kiểu chữ `false`: để `{cờ && (...)}`
 * không bị coi là điều kiện hằng, và để đổi `true` sau này không sinh lỗi kiểu nào.
 */
const HIEN_MENU_THONG_TIN_DE_NGHI: boolean = false;

/**
 * ★★ THẺ CỦA MỘT BẢNG BÁO GIÁ TRONG KHỐI "XÉT DUYỆT PHƯƠNG ÁN GIÁ" CÒN GÌ ĐỂ HIỆN KHÔNG?
 *
 * Sếp 15/09/2026, khoanh đỏ đúng thẻ *"…-BG-002 · Đã duyệt"*: *"bỏ ghi chú này, không cần thiết"*.
 *
 * 📌 KHI ĐÃ DUYỆT, THẺ TỰ RỖNG NGHĨA: cặp nút Duyệt/Không duyệt gác `!daDuyet`, khối "Nhân viên đề
 * xuất" cũng gác `!daDuyet`. Còn lại đúng mã bảng + huy hiệu "Đã duyệt" — mà khối KẾT QUẢ phía trên
 * đã ghi *"Bản báo giá được chọn — Báo giá NCC n"* kèm chính tệp đó.
 *
 * 🔴 VÌ SAO KHÔNG ẨN BẰNG `daDuyet` TRƠN. Hai thứ vẫn có thể còn nội dung sau khi duyệt, và cả hai
 * KHÔNG hiện ở bất kỳ đâu khác trong app:
 *   · `lanTraLai` — lịch sử Trưởng bộ phận trả lại. Màn `bao-gia-chi-tiet.tsx` từng hiện nó đã bị
 *     xóa, nên mất ở đây là mất khỏi app. Phiếu đi vài vòng rồi mới được duyệt là ca có thật, và
 *     đó đúng là lúc lịch sử đáng đọc nhất.
 *   · `nccDaChonTen` — tên nhà cung cấp được duyệt, chỉ cho vai trò được xem NCC.
 *
 * ⚠️ ĐẶT NGOÀI COMPONENT ĐỂ HAI NƠI HỎI CÙNG MỘT CÂU: thẻ tự ẩn, và `<section>` bao ngoài cũng
 * phải biết để không trơ lại mỗi cái tiêu đề. Hai nơi tự kiểm là hai nơi sớm muộn nói khác nhau.
 */
function conHienTheXetDuyet(bg: BaoGia, quyen: Pick<Quyen, "xemNhaCungCap">): boolean {
  if (bg.trangThai !== "da_chon_ncc") return true; // chưa duyệt — còn nút, còn huy hiệu chờ
  if ((bg.lanTraLai ?? []).length > 0) return true;
  return Boolean(quyen.xemNhaCungCap && bg.nccDaChonTen);
}

export default function TrangChiTietDeNghi({
  id: idTruyenVao,
  onDongPopup,
}: {
  /**
   * ★ CHO PHÉP GHI ĐÈ ID — thêm 28/08/2026, phục vụ mục "Xem trong pop-up" ở menu ⋯ của thẻ
   * Kanban (`MenuThaoTacThe`). Màn đó nhúng NGUYÊN component này vào một `Dialog`, KHÔNG đổi
   * URL (`/de-nghi` vẫn đứng nguyên) — nên không có đoạn `[id]` nào trong địa chỉ để
   * `useParams()` đọc ra.
   *
   * 📌 Route thật `/de-nghi/[id]/page.tsx` (xem file đó) KHÔNG truyền prop này — nó vẫn để
   * `useParams()` tự đọc như cũ, đúng hành vi gốc. Toàn bộ ~30 chỗ dùng `params.id` bên dưới
   * không cần sửa gì: `params` ở đây chỉ là một object gộp, ưu tiên prop khi có.
   */
  id?: string;
  /**
   * ★★ ĐÓNG POP-UP thay vì điều hướng — thêm 28/08/2026, vá lỗi thật bắt được lúc review:
   * nút "Quay lại danh sách đề nghị" vốn là `<Link href="/de-nghi">`. Khi nhúng trong Dialog
   * ở `/de-nghi`, bấm vào đó là điều hướng tới ĐÚNG URL đang đứng — Next.js coi là no-op, Dialog
   * không đóng, người dùng tưởng nút chết.
   *
   * 📌 CHỈ ảnh hưởng nút "Quay lại" chính — không đổi các đường breadcrumb khác (chúng dẫn tới
   * nơi khác, điều hướng thật vẫn đúng, chỉ tiện thể đóng Dialog theo vì unmount).
   */
  onDongPopup?: () => void;
} = {}) {
  const routeParams = useParams<{ id: string }>();
  const params = { id: idTruyenVao ?? routeParams.id };
  const {
    deNghi,
    donHang,
    phieuNhan,
    baoGia,
    chuyenTiepChoNhanVien,
    cauHinh,
    danhDauCongViecGiaiDoan,
    hoanThanhQuyTrinh,
    vietBinhLuan,
    suaBinhLuan,
    datSoBaoGiaChoPhieu,
    /* Hàm cho nút trình ở bước ② và cặp Duyệt / Không duyệt ở bước ③.
       📌 Không còn `luuDeXuatNCCChoDeNghi`: khối nhân viên tự đề xuất đã bỏ 20/08/2026, nay trưởng
       bộ phận chọn nhà cung cấp ngay khi duyệt. Hàm đó thành mồ côi trong `kho-du-lieu.tsx` —
       đừng gọi lại, xem `BAN-DO-MA-NGUON.md` mục mã chết. */
    trinhXetDuyetBaoGiaChoDeNghi,
    chonNCCChoBaoGia,
    xacNhanKho,
    xacNhanTruongBP,
    luiVeBuoc,
    ghiLyDoThieuChungTu,
    /* ★ Ba hàm dưới đây phục vụ các LỐI VÀO VỪA DỜI TỪ MENU ⋯ SANG ĐÂY (Ban lãnh đạo 12/09/2026:
       *"chỉ bỏ ở mục hiển thị thôi, còn chức năng thì vẫn phải giữ lại"*). Xem khối nút ở đầu
       "Thông tin đề nghị" bên dưới. */
    doiLuuTru,
    suaTruongBoSung,
  } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  /**
   * ★ HỘP SỬA TRƯỜNG ĐANG MỞ — dời từ menu ⋯ của thẻ sang đây (Ban lãnh đạo 12/09/2026).
   *
   * `null` = không mở hộp nào. Hai hộp CỐ Ý GIỮ RIÊNG, không gộp: chỉ đạo 18/08/2026
   * (*"cấu hình giống 100%"* theo ảnh Base) vẫn còn hiệu lực — "trường dữ liệu tùy chỉnh" bày
   * đúng các trường của quy trình, còn "trường tự thêm" là bảng cặp tên/giá trị người dùng tự đặt.
   */
  const [hopSuaTruong, setHopSuaTruong] = useState<"tuy_chinh" | "bo_sung" | null>(null);
  const [moChuyenTiep, setMoChuyenTiep] = useState(false);
  const [loiNhan, setLoiNhan] = useState("");
  /** Bảng báo giá đang chờ xác nhận trình xét duyệt — `null` là chưa hỏi ai. */
  const [hoiTrinhXetDuyet, setHoiTrinhXetDuyet] = useState<string | null>(null);
  /** Bảng đang chờ trưởng bộ phận xác nhận duyệt / không duyệt (bước ③). */
  /**
   * Nhà cung cấp trưởng bộ phận chọn để duyệt — lấy từ tên ghi ở các ô báo giá bước ②.
   * Rỗng = chưa chọn, và khi đó nút Duyệt bị khóa kèm lý do.
   */
  const [nccDuyet, setNccDuyet] = useState("");
  /**
   * Trưởng bộ phận / quản trị đã mở khóa khu báo giá để sửa sau khi duyệt.
   *
   * 🔴 CHỈ TRONG PHIÊN, không ghi vào hồ sơ: mở khóa là ngoại lệ, không phải trạng thái mới của
   * chứng từ. Ghi vào hồ sơ thì có phiếu nằm ở trạng thái "đang mở" hàng tuần mà không ai để ý.
   */
  const [moKhoaBaoGia, setMoKhoaBaoGia] = useState(false);
  const [hoiDuyet, setHoiDuyet] = useState<{
    bgId: string;
    loai: "duyet" | "khong_duyet";
    /** Bản báo giá được bấm Duyệt (vd "Báo giá NCC 2") — chỉ có khi bấm từ nút trên chính bản đó. */
    nhanO?: string;
  } | null>(null);
  /**
   * Lý do duyệt / không duyệt — BẮT BUỘC cả hai chiều (Ban lãnh đạo 19/08/2026: *"phải có ghi
   * chú bắt buộc lý do vì sao duyệt hoặc không duyệt"*).
   */
  const [lyDoDuyet, setLyDoDuyet] = useState("");
  /**
   * Việc bắt buộc đang chờ xác nhận tích / bỏ tích — `null` là chưa hỏi ai.
   * Xem lý do ở chỗ dùng: cụm "Danh sách công việc", nay dựng ở `cumCongViecCuaKhoi` và nằm
   * TRONG khối của chính bước đó (Sếp 15/09/2026), không còn là một Card riêng đầu trang.
   */
  const [hoiTichViec, setHoiTichViec] = useState<{
    cv: CongViecGiaiDoan;
    /** `true` = đang muốn tích xong, `false` = đang muốn bỏ tích. */
    tich: boolean;
    /**
     * 🔴 MÃ BƯỚC CỦA CHÍNH VIỆC NÀY — bắt buộc, thêm 25/08/2026.
     *
     * Từ hôm nay khối "Danh sách công việc" bày cả việc còn treo của các bước TRƯỚC, nên việc
     * đang tích **không nhất thiết** thuộc bước đang đứng. `danhDauCongViecGiaiDoan` dùng mã bước
     * để biết cất cái tích vào đâu; truyền bước đang đứng cho một việc của bước trước là ghi sai
     * chỗ — người dùng thấy đã tích mà việc đó vẫn treo, và chốt chuyển bước vẫn chặn.
     */
    buoc: GiaiDoanMuaHang;
  } | null>(null);

  /** Hộp xác nhận trước khi đóng hồ sơ — `true` là đang hỏi. */
  const [hoiHoanThanh, setHoiHoanThanh] = useState(false);

  const dn = deNghi.find((x) => x.id === params.id);
  /**
   * ★ TỔNG SỐ TỆP ĐÍNH KÈM CỦA HỒ SƠ — gộp HAI NGUỒN, thêm 13/09/2026.
   *
   * 🔴 Hai nguồn cố ý giữ riêng ở tầng dữ liệu (xem `taiLieuAppRequest` trong `kieu-du-lieu.ts`):
   * `taiLieu` là tệp nộp TRONG app, mở xem được ngay; `taiLieuAppRequest` là tệp người đề nghị
   * đính kèm BÊN App Request, app này chỉ biết tên. Nhưng với người đọc ô 13 thì cả hai đều là
   * "tài liệu đính kèm của hồ sơ", nên con số phải cộng cả hai — trước đó chỉ đếm nguồn đầu nên
   * mọi hồ sơ từ App Request đều hiện "—" dù có tệp thật.
   */
  const soTepDinhKem = (dn?.taiLieu?.length ?? 0) + (dn?.taiLieuAppRequest?.length ?? 0);
  const poLienQuan = useMemo(
    () => donHang.filter((po) => po.prId === params.id),
    [donHang, params.id],
  );
  /**
   * Tiến độ từng dòng của đề nghị — cần cho nút "Hoàn thành quy trình".
   *
   * 📌 Dùng `tinhTienDoDeNghi` chứ không tự cộng: luật đối chiếu khối lượng chỉ có MỘT chỗ.
   */
  const tienDoDong = useMemo(
    () => (dn ? tinhTienDoDeNghi(dn, donHang, phieuNhan) : []),
    [dn, donHang, phieuNhan],
  );
  const baoGiaLienQuan = useMemo(
    /* 🔴 LOC BO HỒ SƠ ĐÃ HỦY (21/08/2026): hồ sơ hủy vẫn nằm trong dữ liệu, mà điều kiện bày nút
       ở bước ② xét "có hồ sơ nào KHÁC dang_thu_thap không" — một hồ sơ hủy cũng tính, nên
       cả cụm nút biến mất mà không một dòng giải thích. `xacDinhGiaiDoan` cũng lọc `huy`. */
    () => baoGia.filter((bg) => bg.prId === params.id && bg.trangThai !== "huy"),
    [baoGia, params.id],
  );
  /**
   * Trưởng bộ phận đã duyệt chọn nhà cung cấp cho phiếu này chưa.
   *
   * 📌 `da_chon_ncc` là trạng thái đánh dấu ĐÃ DUYỆT (xem `chonNCCChoBaoGia`) — dùng để khóa khu
   * báo giá, vì từ lúc này bản báo giá là căn cứ của một quyết định đã ký.
   */
  const daDuyetBaoGia = baoGiaLienQuan.some((bg) => bg.trangThai === "da_chon_ncc");
  /**
   * Các đề xuất con đã tách ra từ phiếu này — để "tổng hợp lại các đề xuất con của cái đề
   * xuất lớn" (Ban lãnh đạo 13/08/2026). Lọc theo `deNghiGocId`, KHÔNG theo tên.
   */
  const deNghiCon = useMemo(
    () => deNghi.filter((d) => d.deNghiGocId === params.id),
    [deNghi, params.id],
  );
  /** Phiếu nhận của mọi đơn thuộc đề nghị này — dùng để lấy mốc thời gian giai đoạn nhận hàng. */
  const phieuLienQuan = useMemo(() => {
    const idDon = new Set(poLienQuan.map((po) => po.id));
    return phieuNhan.filter((p) => idDon.has(p.poId));
  }, [phieuNhan, poLienQuan]);

  /* 📌 Không còn tính `tienDo` ở trang này (15/08/2026): khối "Hoạt động chính" và timeline
     ngang — hai chỗ duy nhất dùng nó — đã bỏ theo yêu cầu Ban lãnh đạo. Bảng Phân bổ tự tính
     lấy phần của nó, nên tính lại ở đây là thừa. */

  if (!dn) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Không tìm thấy đề nghị"
        description="Đề nghị này không tồn tại hoặc bạn không có quyền xem."
      />
    );
  }


  // Giai đoạn KHÔNG lưu thành trường — suy ra từ chứng từ thật, đúng nguyên tắc ở
  // `2-quy-trinh/giai-doan-mua-hang.ts`. Tính một lần rồi truyền xuống, tránh mỗi
  // component tự tính lại rồi lệch nhau.
  /* ★★ THAM SỐ THỨ 5 `deNghi` — BẮT BUỘC PHẢI CÓ (Sếp 15/09/2026): dòng đã nhân bản sang phiếu
     khác thì phiếu gốc *"không cần mua"* và **không tính là chưa phân bổ**.

     🔴 THIẾU NÓ LÀ HAI MÀN HÌNH NÓI HAI GIAI ĐOẠN KHÁC NHAU CHO CÙNG MỘT HỒ SƠ. Bảng quy trình đã
     truyền danh sách này (`dungBangQuyTrinh` → `xacDinhGiaiDoan`), nên thẻ nằm ở cột ② còn trang
     chi tiết lại vẽ hồ sơ đang ở bước ① — không lỗi nào báo, chỉ là người dùng thấy hai câu
     trả lời. Đây cũng là nguồn của `giaiDoan` dùng cho cả trang, nên sai ở đây là sai dây chuyền.

     🔴 `deNghi` lấy thẳng từ `useDuLieu()` — danh sách ĐẦY ĐỦ, chưa lọc lưu trữ. Không dùng
     `cacBanTach` ở ngay dưới: đó là bản đã lọc, luật sẽ không thấy hết các bản con. */
  const giaiDoan = xacDinhGiaiDoan(dn, donHang, baoGia, phieuNhan, deNghi);
  const conLai = soNgayConLai(dn.ngayCanHang);

  /* 📌 KHÔNG còn tính `chanLapDon` ở trang này (17/08/2026). Lý do "chưa cất được đơn" giờ do
     chính `FormLapDonMuaHang` tính và hiện ngay trên thanh nút Cất — một chỗ duy nhất, dùng
     chung `vuongMacLapDonHang` với chốt chặn thật trong `themDonHang`. Trước đó ô cảnh báo ở
     đây ghi *"vào màn lập đơn thì nhập liệu vẫn dùng được"*, câu đó nói về MỘT MÀN KHÁC nên
     sai văn cảnh khi form đã nằm ngay tại chỗ. */

  /**
   * Công việc bắt buộc của bước ĐANG ĐỨNG — mục "Danh sách công việc" của bảng Base.
   * Bước không khai việc nào thì mảng rỗng (ảnh Base ghi "Không có công việc").
   */
  const congViecCuaBuoc = cauHinh.congViecTheoBuoc?.[giaiDoan] ?? [];

  /**
   * ★★ DANH SÁCH CÔNG VIỆC, XẾP THEO NHÓM BƯỚC — sửa 25/08/2026 để gỡ một NGÕ CỤT.
   *
   * 🔴 Ban lãnh đạo báo *"sao ko còn kéo qua bước được"*. Đo ra thì lý do thật không phải cái chốt
   * chặn, mà là: hồ sơ đã sang bước ② thì việc bắt buộc còn treo của bước ① **không còn ô nào để
   * tích trong toàn app** — khối này trước đây chỉ bày việc của bước ĐANG ĐỨNG. Trong khi câu chặn
   * lại bảo *"mở khối bước đó ở trang chi tiết, tích hoàn thành rồi làm tiếp"*, tức app chỉ người
   * dùng tới một chỗ không tồn tại.
   *
   * 📌 Nhóm của bước đang đứng luôn đứng ĐẦU, rồi tới các bước trước theo đúng thứ tự quy trình —
   * người đọc thấy việc của mình trước, việc còn nợ sau.
   *
   * ⚠️ Nhóm bước trước CHỈ bày việc CÒN TREO (`congViecConTreoCacBuocTruoc` đã lọc), không bày
   * việc đã xong: bước trước đã qua rồi, bày lại cả danh sách chỉ làm trang dài mà không giúp gì.
   * Nhóm bước đang đứng thì bày ĐỦ cả việc đã xong — đó là danh sách việc của chính bước này.
   */
  const nhomCongViec: {
    buoc: GiaiDoanMuaHang;
    nhanBuoc: string;
    viec: CongViecGiaiDoan[];
    laBuocTruoc: boolean;
  }[] = [
    ...(congViecCuaBuoc.length > 0
      ? [
          {
            buoc: giaiDoan,
            nhanBuoc: NHAN_GIAI_DOAN[giaiDoan]?.nhan ?? giaiDoan,
            viec: congViecCuaBuoc,
            laBuocTruoc: false,
          },
        ]
      : []),
    ...congViecConTreoCacBuocTruoc(dn, giaiDoan, cauHinh).map((n) => ({
      ...n,
      laBuocTruoc: true,
    })),
  ];

  /**
   * ★ BƯỚC NÀY CÒN THIẾU GÌ — nguồn của VIỀN ĐỎ trên khối bước (Ban lãnh đạo 23/08/2026:
   * *"Các border này cần hiển thị màu đỏ nếu như công việc trong các mục này chưa hoàn thành
   * hoặc thiếu đính kèm file"*).
   *
   * 🔴 GỌI `conNoCuaBuoc`, KHÔNG GỌI `vuongMacSangBuocSau` — hai câu hỏi khác nhau, xem chú thích
   * dài ở khai báo `conNoCuaBuoc`. Bản đầu tôi dùng hàm kia và **đo được trên trình duyệt** rằng
   * hồ sơ đang ở bước ④ bị tô đỏ cả *"Tiếp nhận và kiểm tra"* lẫn *"Yêu cầu NCC báo giá"* — hai
   * bước đã xong đúng quy trình. Đỏ ba trong bốn khối thì cảnh báo mất hết tác dụng.
   *
   * 🔴 CHỈ TÔ BƯỚC ĐANG LÀM VÀ BƯỚC ĐÃ QUA — không tô bước chưa tới lượt: bước chưa tới thì
   * đương nhiên chưa có gì, tô đỏ là đỏ cả tám khối.
   *
   * ⚠️ Bước ĐÃ QUA mà còn nợ thì PHẢI tô — đó đúng là *"còn thiếu hồ sơ để bổ sung sau"*: hồ sơ
   * đi tiếp được nhờ ghi lý do, và nếu không tô thì không còn chỗ nào nhắc.
   */
  const chuoiBuoc = GIAI_DOAN_MUA_HANG.filter((g) => g.ma !== "that_bai").map((g) => g.ma);
  const viTriHienTai = chuoiBuoc.indexOf(giaiDoan);
  /* ⚠️ Gán ra biến riêng: `dn` đã qua `if (!dn) return` phía trên, nhưng TypeScript KHÔNG giữ
     phép thu hẹp kiểu đó vào trong thân một hàm khai báo (hàm có thể được gọi ở lúc khác). */
  const hoSo = dn;
  function conThieuCuaBuoc(ma: GiaiDoanMuaHang): string | undefined {
    const viTri = chuoiBuoc.indexOf(ma);
    if (viTri < 0 || viTriHienTai < 0 || viTri > viTriHienTai) return undefined;
    /* Dấu đỏ "thiếu báo giá" ở bước ② — cùng luật với nút "Trình xét duyệt báo giá" ngay trong
       khối đó, nên viền đỏ và nút không bao giờ nói khác nhau (Ban lãnh đạo 24/08/2026). */
    /* ★★ Tham số cuối `deNghi` — trừ dòng đã nhân bản đi (Sếp 15/09/2026). Thiếu nó thì khối bước
       ① ở trang này còn VIỀN ĐỎ *"chưa phân bổ"* cho đúng những dòng đã chuyển sang phiếu khác,
       trong khi thẻ trên bảng quy trình đã hết đỏ (`dungBangQuyTrinh` truyền đủ). Hai chỗ cùng
       trả lời *"bước này còn thiếu gì"* mà nói khác nhau là kiểu lệch đã phải sửa nhiều lần. */
    return (
      conNoCuaBuoc(
        hoSo,
        ma,
        cauHinh,
        donHang,
        phieuNhan,
        vuongMacTrinhXetDuyet(hoSo, cauHinh),
        deNghi,
      ) ?? undefined
    );
  }

  /**
   * ★★★ CỤM "DANH SÁCH CÔNG VIỆC" CỦA MỘT BƯỚC — dựng MỘT LẦN, dùng cho cả bảy khối bước.
   *
   * 🔴 SẾP 15/09/2026, nguyên văn: *"mục này đưa vào trong bước hồ sơ thanh toán"* (ảnh khoanh
   * đỏ khối "Danh sách công việc" đang đứng riêng ngay trên cụm khối giai đoạn, hồ sơ ở bước ⑦).
   *
   * 🔴 ĐÂY LÀ ĐẢO CHỈ ĐẠO 14/09/2026 BẰNG CHỈ ĐẠO MỚI 15/09/2026 CỦA SẾP — không phải ai đó tự
   * tiện đổi. Chỉ đạo 14/09 (*"Di chuyển lên trên"*) yêu cầu dời khối này LÊN TRÊN cụm khối giai
   * đoạn nhưng vẫn để nó ĐỨNG RIÊNG; chỉ đạo 15/09 yêu cầu ĐƯA HẲN VÀO TRONG khối của chính bước
   * đó. Ý nghĩa tổng quát Sếp nêu: việc bắt buộc của một bước phải nằm bên trong khối của bước
   * ấy, mở khối nào là thấy việc của khối đó — không còn một mục rời ở đầu trang.
   *
   * ✅ LÝ DO CỦA 14/09 VẪN ĐƯỢC THOẢ (đã kiểm chứng trong mã nguồn, không tin theo lời):
   * việc bắt buộc của bước ① là *"Checkin hàng tồn kho"*, phải làm trước tiên; để nó ở cuối
   * trang thì phải cuộn đi tìm. Nay ô tích nằm NGAY TRONG khối bước ① — cùng chỗ với bảng vật
   * tư cần kiểm, tức còn gần hơn cả bản 14/09.
   *
   * ⚠️ NHƯNG MỘT GIẢ ĐỊNH TRONG YÊU CẦU LÀ SAI, PHẢI GHI RA ĐÂY: khối bước đang đứng **KHÔNG**
   * tự xổ sẵn. `KhoiDauVaoTheoGiaiDoan` khai `dangODay` trong kiểu dữ liệu nhưng **không dùng
   * tới nó một lần nào**; trạng thái mở khởi tạo là `useState<string[]>([])`, tức GẬP HẾT sau
   * mỗi lần vào trang và mỗi lần F5 — đó là chỉ đạo Ban lãnh đạo 18/08/2026 (*"F5 là tự group
   * lại"*), nhắc hai lần, nên không được lách. Hệ quả: sau thay đổi này người dùng phải bấm mở
   * khối bước mới thấy ô tích.
   * 👉 Bù lại bằng hai thứ đã có sẵn, KHÔNG phải tự nghĩ ra: khối bước còn việc chưa tích thì
   * `conThieuCuaBuoc` trả câu vướng mắc → khối tô VIỀN ĐỎ + nhãn *"Còn thiếu"* ngay lúc đang
   * gập, và `mucConNoCuaBuoc` liệt kê đúng tên từng việc vào câu đó. Người dùng thấy đỏ ở đâu
   * thì mở đúng khối đó.
   *
   * @param nhom       Các nhóm việc thuộc về khối này (thường đúng 1, xem `nhomCongViec`).
   * @param maKhoi     Mã bước của khối đang vẽ — dùng để biết có phải in lại tên bước không.
   * @param laKhoiDangDung Khối này có phải bước hồ sơ đang đứng không — chỉ khối đó mới treo
   *   dòng chỉ đường tới bước trước còn nợ việc.
   */
  function cumCongViecCuaKhoi(
    nhom: typeof nhomCongViec,
    maKhoi: string,
    laKhoiDangDung: boolean,
  ): React.ReactNode {
    /**
     * 🔴 VIỆC CÒN TREO CỦA BƯỚC TRƯỚC — CHỈ ĐƯỜNG, TUYỆT ĐỐI KHÔNG NHÂN BẢN Ô TÍCH.
     *
     * Ô tích thật của nhóm `laBuocTruoc` nằm trong khối của CHÍNH bước đó (khối đang viền đỏ).
     * Đã cân nhắc vẽ thêm một ô tích thứ hai ngay tại bước đang đứng cho tiện, và LOẠI: hai ô
     * tích cho cùng một việc là hai chỗ cùng nói một chuyện, đúng cái nếp dự án này cấm — người
     * dùng tích ở một chỗ rồi nhìn sang chỗ kia sẽ ngờ mình bấm nhầm.
     *
     * 📌 Câu chữ ở đây bám sát câu chặn chuyển bước trong `giai-doan-mua-hang.ts` (*"Mở khối
     * bước đó ở trang chi tiết đề nghị, tích hoàn thành rồi làm tiếp"*). Từ hôm nay câu đó mới
     * ĐÚNG THEO NGHĨA ĐEN: trước đây nó chỉ người dùng tới "khối bước", mà ô tích lại nằm trong
     * một Card riêng ở đầu trang — app chỉ đường tới một chỗ không có thật.
     */
    const treoBuocTruoc = laKhoiDangDung ? nhomCongViec.filter((n) => n.laBuocTruoc) : [];
    if (nhom.length === 0 && treoBuocTruoc.length === 0) return null;

    return (
      <section className="flex flex-col gap-(--hp-md-row-gap)">
        {/* 🔴 GIỮ NGUYÊN CHỮ "Danh sách công việc" — chữ bám đúng bảng Base mà cả phòng đã quen
            (Ban lãnh đạo 16/08/2026). Chỉ đổi KIỂU CHỮ sang `NhanPhanTrongGiaiDoan`, vì nay nó
            là một tiêu đề con NẰM TRONG khối bước: giữ `text-h3` 18px ở đây là lặp lại đúng lỗi
            Ban lãnh đạo khoanh đỏ 16/08/2026 (*"chiều cao chữ đang ko đồng đều"* — tiêu đề con
            to hơn tiêu đề khối cha 7px, ngược thứ bậc). */}
        <NhanPhanTrongGiaiDoan the="h2" icon={ListChecks}>
          Danh sách công việc
        </NhanPhanTrongGiaiDoan>

        {nhom.map((n) => (
          <div key={n.buoc} className="flex flex-col gap-2">
            {/* Hàng tiêu đề nhóm chỉ vẽ khi có gì để nói — xem hai điều kiện ngay dưới. */}
            {(n.buoc !== maKhoi || n.laBuocTruoc) && (
              <div className="flex flex-wrap items-center gap-2">
                {/* 📌 TÊN BƯỚC CHỈ IN KHI NHÓM KHÔNG THUỘC KHỐI ĐANG VẼ. Nhóm nằm đúng khối của
                    nó thì dòng tiêu đề khối ở ngay trên đã ghi tên bước rồi — in lại là ba lần
                    cùng một cái tên cho đúng một ô tích. Nhóm "lạc" (bước không có khối riêng
                    trên trang này) thì vẫn phải in, nếu không người đọc không biết việc của bước
                    nào. */}
                {n.buoc !== maKhoi && (
                  <p className="text-xs font-semibold tracking-wide text-text-desc uppercase">
                    {n.nhanBuoc}
                  </p>
                )}
                {/* 🔴 NÓI RÕ ĐÂY LÀ VIỆC CÒN NỢ TỪ BƯỚC TRƯỚC. Không có nhãn này thì người dùng
                    tưởng bước đang đứng đòi thêm việc, rồi đi tìm xem mình bỏ sót gì. */}
                {n.laBuocTruoc && (
                  <span className="rounded-md bg-danger/10 px-1.5 py-0.5 text-xs font-medium text-danger">
                    Bước trước còn treo — phải xong mới đi tiếp
                  </span>
                )}
              </div>
            )}
            <ul className="flex flex-col gap-2">
              {n.viec.map((cv) => {
                /* Dùng `hoSo` chứ không `dn`: TypeScript KHÔNG giữ phép thu hẹp kiểu của
                   `if (!dn) return` vào trong thân một hàm khai báo — cùng lý do đã ghi ở
                   chỗ khai báo `hoSo`. */
                const xong = (hoSo.congViecDaXong ?? []).find((x) => x.maCongViec === cv.ma);
                return (
                  <li
                    key={cv.ma}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5">
                      {/* Vùng chạm ≥44px theo Design System V1.1 — ô tích nhỏ nhưng cả nhãn
                          bấm được nên vùng thật rộng hơn nhiều. */}
                      {/* 🔴 HỎI XÁC NHẬN TRƯỚC KHI TÍCH — Ban lãnh đạo 17/08/2026: *"mục này
                          khi bấm xác nhận phải hiện thông báo xác nhận có tick hay ko"*, đúng
                          nguyên tắc chung đã chốt 10/08/2026 cho mọi việc bấm-là-xong.

                          VÌ SAO CẦN THẬT: ô tích này quyết định bước có được đi tiếp hay không
                          (`vuongMacSangBuocSau` chặn khi việc bắt buộc chưa xong). Nhật ký hồ sơ
                          260001-HPCS-PR-001 ghi SÁU lần "Hoàn thành" / "Bỏ tích" trong đúng một
                          phút 19:29 — bấm nhầm quá dễ, và mỗi lần đều để lại một dòng nhật ký
                          nên khối Lịch sử bị loãng đúng chỗ dùng để truy trách nhiệm.

                          📌 `onChange` KHÔNG ghi dữ liệu nữa, chỉ mở hộp. Trạng thái ô tích vẫn
                          lấy từ dữ liệu thật (`checked={Boolean(xong)}`) nên khi hộp bị hủy, ô
                          tự về đúng trạng thái cũ — không cần tự đặt lại bằng tay. */}
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 accent-primary"
                        checked={Boolean(xong)}
                        disabled={!quyen.phanBoCongViec}
                        onChange={(e) => {
                          /* `buoc` lấy từ CHÍNH NHÓM đang vẽ, không lấy `giaiDoan` — việc của
                             bước trước phải ghi vào đúng bước của nó. */
                          const buoc = n.buoc;

                          /**
                           * ★★ TÍCH THÌ GHI NGAY, BỎ TÍCH THÌ VẪN HỎI — Ban lãnh đạo 13/09/2026:
                           * *"Khi bấm tick check tồn kho thì ko cần hiện bảng thông báo này nữa"*,
                           * và khi được hỏi phạm vi thì Sếp chốt bỏ ở chiều TÍCH, giữ ở chiều BỎ
                           * TÍCH, áp cho mọi công việc bắt buộc.
                           *
                           * 🔴 VÌ SAO HAI CHIỀU KHÁC NHAU: tích là việc thuận (xác nhận đã làm
                           * xong), bấm nhầm thì bỏ tích lại được. Còn BỎ TÍCH là CHẶN hồ sơ đi
                           * tiếp — kể cả khi hồ sơ đã ở bước xa hơn — nên một cú bấm nhầm có thể
                           * khoá cả quy trình mà không ai kịp can. Việc nguy hiểm hơn thì vẫn hỏi.
                           *
                           * 🔴 VẪN PHẢI ĐỌC KẾT QUẢ TRẢ VỀ. Tầng ghi có thể TỪ CHỐI (việc "đã xử
                           * lý ủy nhiệm chi" đòi có Hóa đơn VAT trước — luật 22/08/2026). Bỏ hộp
                           * hỏi mà quên chuyển phần kiểm lỗi sang đây là app báo thành công giả,
                           * đúng lỗi CLAUDE.md §3.5 cấm và đã dính thật ngày 22/08.
                           *
                           * 📌 Việc ghi nhật ký hồ sơ kèm tên người tích GIỮ NGUYÊN — Sếp chỉ bỏ
                           * bảng hỏi lại, không bỏ dấu vết ai đã tích.
                           */
                          if (!e.target.checked) {
                            setHoiTichViec({ cv, tich: false, buoc });
                            return;
                          }

                          const loi = danhDauCongViecGiaiDoan(
                            hoSo.id,
                            cv,
                            buoc,
                            true,
                            nguoiDung.tenHienThi,
                          );
                          if (loi !== null) {
                            toast.error("Chưa tích được việc này", { description: loi });
                            return;
                          }
                          toast.success(`Đã xác nhận xong: ${cv.ten}`);
                        }}
                      />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-medium text-text-primary">
                          {cv.ten}
                          {cv.batBuoc && <span className="text-danger"> *</span>}
                        </span>
                        {cv.moTa && <span className="text-xs text-text-desc">{cv.moTa}</span>}
                        {/* Ai tích, lúc nào — cùng thông tin đã vào nhật ký đề nghị. */}
                        {xong && (
                          <span className="text-xs text-success-soft">
                            {xong.nguoiXongTen} · {formatMocThoiGian(xong.thoiDiem)}
                          </span>
                        )}
                      </span>
                    </label>
                    <StatusBadge
                      label={xong ? "Đã xong" : "Chưa xong"}
                      tone={xong ? "success" : "neutral"}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Nói rõ ai được tích, thay vì để ô mờ không lời giải thích. */}
        {!quyen.phanBoCongViec && nhom.length > 0 && (
          <p className="text-xs text-text-desc">
            Chỉ Trưởng bộ phận Thu mua tích được các việc này.
          </p>
        )}

        {/* ★ DÒNG CHỈ ĐƯỜNG TỚI BƯỚC TRƯỚC CÒN NỢ VIỆC — xem chú thích `treoBuocTruoc` ở trên.
            Chỉ vẽ ở khối của bước hồ sơ ĐANG ĐỨNG: đó là khối người dùng mở ra để làm việc, nên
            phải là chỗ nói cho họ biết vì sao hồ sơ chưa đi tiếp được. */}
        {treoBuocTruoc.length > 0 && (
          <p className="flex items-start gap-2 rounded-lg border border-danger bg-danger-bg p-(--hp-md-row-pad) text-xs font-medium text-danger">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Bước trước còn công việc bắt buộc chưa xong nên hồ sơ chưa đi tiếp được:{" "}
              {treoBuocTruoc.map((n) => n.nhanBuoc).join(" · ")}. Mở đúng khối bước đó ngay trên
              trang này (khối đang viền đỏ) rồi tích hoàn thành.
            </span>
          </p>
        )}
      </section>
    );
  }

  /**
   * ★★★ GẮN CỤM "DANH SÁCH CÔNG VIỆC" VÀO ĐÚNG KHỐI BƯỚC — Sếp 15/09/2026, xem chú thích dài ở
   * `cumCongViecCuaKhoi`.
   *
   * 🔴 VÌ SAO XỬ LÝ Ở ĐÂY CHỨ KHÔNG SỬA `noiDungNghiepVu` CỦA TỪNG KHỐI: bảy khối khai
   * `noiDungNghiepVu` theo ba dạng khác nhau (JSX trần, `dieuKien && (…)`, và IIFE có `return`
   * sớm). Sửa tay vào trong từng cái là bảy chỗ có thể sai, mà hai khối ② ③ còn nguy hơn — biểu
   * thức của chúng ra `false` với người không được xem giá, nhét cụm việc vào trong là danh sách
   * công việc **biến mất im lặng** đúng với những người vẫn phải tích việc. Bọc từ ngoài thì
   * không đụng một dòng nào của bảy biểu thức đó.
   *
   * 🔴 TRẢ `null` KHI KHÔNG CÓ VIỆC, KHÔNG TRẢ FRAGMENT RỖNG. `KhoiDauVaoTheoGiaiDoan` dùng chính
   * độ "thật/giả" của `noiDungNghiepVu` để quyết định có vẽ khối KẾT QUẢ hay không; một fragment
   * rỗng là truthy nên sẽ mọc ra khung xanh "KẾT QUẢ" trống trơn ở mọi bước.
   *
   * 📌 CỤM VIỆC ĐẶT TRƯỚC PHẦN NGHIỆP VỤ — giữ đúng tinh thần chỉ đạo 14/09/2026: việc bắt buộc
   * của bước là thứ phải làm trước tiên, không được nằm dưới cùng phải cuộn đi tìm.
   *
   * ⚠️ PHẢI GỌI SAU `.filter(giaiDoanDaToiLuot…)`, không gọi trước: khối chưa tới lượt bị lọc bỏ,
   * mà nhóm "lạc" lại được gửi về khối CUỐI CÙNG của danh sách — tính trên mảng chưa lọc thì khối
   * cuối đó có thể chính là khối vừa bị bỏ đi, và việc rơi vào hư không.
   */
  function themDanhSachCongViec(dsKhoi: GiaiDoanDauVao[]): GiaiDoanDauVao[] {
    const maCoKhoi = new Set(dsKhoi.map((k) => k.ma));
    /* Khối đại diện cho bước hồ sơ đang đứng. `hoan_thanh` và `that_bai` KHÔNG có khối riêng
       trên trang này (mảng chỉ dựng 7 bước làm việc), nên khi hồ sơ ở hai trạng thái đó thì lấy
       khối cuối cùng làm chỗ đứng — thà bày ở chỗ gần nhất còn hơn mất hẳn dòng chỉ đường. */
    const maKhoiDangDung = maCoKhoi.has(giaiDoan)
      ? giaiDoan
      : (dsKhoi[dsKhoi.length - 1]?.ma ?? "");

    return dsKhoi.map((k, i) => {
      /* Nhóm "lạc" = việc của một bước KHÔNG có khối riêng trên trang (hồ sơ cũ, hoặc cấu hình
         khai việc cho bước `hoan_thanh`). Gom hết về khối cuối thay vì để rơi mất — cùng nguyên
         tắc "thà bày thừa còn hơn giấu mất dữ liệu" đã ghi ở `giaiDoanDaToiLuot`. */
      const laKhoiCuoi = i === dsKhoi.length - 1;
      const nhom = nhomCongViec.filter(
        (n) => n.buoc === k.ma || (laKhoiCuoi && !maCoKhoi.has(n.buoc)),
      );
      const cum = cumCongViecCuaKhoi(nhom, k.ma, k.ma === maKhoiDangDung);
      if (cum === null) return k;
      return {
        ...k,
        noiDungNghiepVu: k.noiDungNghiepVu ? (
          <div className="flex flex-col gap-(--hp-md-row-gap)">
            {cum}
            {k.noiDungNghiepVu}
          </div>
        ) : (
          cum
        ),
      };
    });
  }

  /**
   * MỐC THỜI GIAN của từng giai đoạn, lấy từ CHỨNG TỪ THẬT.
   *
   * 🔴 Chỉ điền mốc cho giai đoạn nào có chứng từ tương ứng. Giai đoạn được suy ra từ
   * chứng từ chứ không lưu lịch sử chuyển bước, nên không có cách nào biết chính xác lúc
   * nào đề nghị rời giai đoạn "xét duyệt báo giá" nếu không có bảng báo giá. Thà để trống
   * còn hơn hiện một mốc không có gì bảo đảm — cột phải đã ghi rõ điều này cho người xem.
   */
  const mocGiaiDoan: MocGiaiDoan = {
    // Thu mua tiếp nhận khi đề nghị được duyệt xong.
    tiep_nhan: dn.ngayDuyet,
    ...(baoGiaLienQuan.length > 0 && {
      yeu_cau_bao_gia: [...baoGiaLienQuan].sort((a, b) => a.ngayTao.localeCompare(b.ngayTao))[0]
        .ngayTao,
    }),
    /* Chỉ tính là đã xét duyệt khi bảng báo giá thực sự ĐÃ ĐƯỢC DUYỆT.
       🔴 Xét `trangThai === "da_chon_ncc"`, KHÔNG xét `nccDaChonId` (sửa 23/08/2026): từ hôm nay
       việc duyệt không đòi gõ tên nhà cung cấp nữa (Ban lãnh đạo: bản báo giá được tích chọn đã
       tự link sang bước sau), nên `nccDaChonId` có thể trống ở hồ sơ duyệt đúng quy trình. Xét
       trường đó là mốc "Xét duyệt báo giá" biến mất khỏi tiến trình dù bước đã xong. */
    ...(baoGiaLienQuan.some((bg) => bg.trangThai === "da_chon_ncc") && {
      xet_duyet_bao_gia: [...baoGiaLienQuan]
        .filter((bg) => bg.trangThai === "da_chon_ncc")
        .sort((a, b) => b.ngayCapNhat.localeCompare(a.ngayCapNhat))[0].ngayCapNhat,
    }),
    ...(poLienQuan.length > 0 && {
      lap_don_mua_hang: [...poLienQuan].sort((a, b) =>
        a.ngayLapPO.localeCompare(b.ngayLapPO),
      )[0].ngayLapPO,
      // Đặt hàng = đơn đã chốt và gửi đi. Dùng luôn ngày lập của đơn đầu tiên.
      dat_hang: [...poLienQuan].sort((a, b) => a.ngayLapPO.localeCompare(b.ngayLapPO))[0]
        .ngayLapPO,
    }),
    ...(phieuLienQuan.length > 0 && {
      nhan_hang: [...phieuLienQuan].sort((a, b) =>
        a.ngayNhanThucTe.localeCompare(b.ngayNhanThucTe),
      )[0].ngayNhanThucTe,
    }),
    // Hoàn thành: lấy lần nhận cuối cùng, chỉ khi đề nghị thật sự đã ở giai đoạn này.
    ...(giaiDoan === "hoan_thanh" &&
      phieuLienQuan.length > 0 && {
        hoan_thanh: [...phieuLienQuan].sort((a, b) =>
          b.ngayNhanThucTe.localeCompare(a.ngayNhanThucTe),
        )[0].ngayNhanThucTe,
      }),
  };

  /**
   * HỒ SƠ ĐÃ ĐÓNG (hoàn thành / đóng dở) — khóa mọi thao tác đổi nội dung.
   *
   * 📌 Tính một lần rồi dùng chung cho bảng Phân bổ và các khu đính kèm của sáu bước, để
   * hai chỗ không bao giờ chặn theo hai luật khác nhau.
   */
  const hoSoDaDong = giaiDoanDaKetThuc(giaiDoan);

  /**
   * ★ AI ĐƯỢC GẮN / GỠ TỆP CỦA TỪNG BƯỚC (Ban lãnh đạo 17/08/2026).
   *
   * 🔴 KHÔNG BỊA CỜ QUYỀN MỚI. `4-phan-quyen/quyen.ts` không có cờ nào mang nghĩa "được sửa
   * nội dung đề nghị này" — đã tra hết 16 cờ. Nên dùng lại đúng luật đã có sẵn cho khối
   * **Người theo dõi** ở cột phải trang này (`khoi-nguoi-theo-doi.tsx`): *"Chỉ Thu mua được
   * sửa danh sách. Vai trò khác vẫn xem được, chỉ không thêm/bỏ."*
   *
   * Vì sao đúng cho việc này:
   *   · `lapPO` mở cho **nhân viên thu mua cấp ≥2** — chính người nhận báo giá nhà cung cấp
   *     gửi về qua Zalo/email, tức người mà tính năng này sinh ra để phục vụ.
   *   · `phanBoCongViec` là trưởng bộ phận và quản trị.
   *   · Vai trò chỉ đọc (thủ kho, kế toán, QLDA, Phòng Thi công) **xem được nhưng không gỡ
   *     được** — gỡ chứng từ khỏi hồ sơ là làm mất bằng chứng, không phải việc của họ.
   *
   * ⚠️ Đây CHƯA phải bảo mật thật, chỉ chặn ở giao diện. Chốt chặn hồ sơ đã đóng nằm ở tầng
   * dữ liệu (`themTepGiaiDoan` / `goTepGiaiDoan`); còn chặn theo vai trò thì phải làm bằng
   * Firestore Security Rules khi lên bản thật.
   */
  const duocSuaTepBuoc = quyen.phanBoCongViec || quyen.lapPO;

  /**
   * ★ QUYỀN SỬA RIÊNG CHO Ô "HỢP ĐỒNG/ĐƠN MUA HÀNG" — Sếp 01/09/2026: ô này giờ hiện Ở CẢ HAI
   * bước ④ và ⑤ (cùng đọc/ghi đúng một tệp, xem 2 khối `khuDinhKem` bên dưới), CẢ hộp "Gỡ vướng"
   * trên Kanban (`hop-chuyen-giai-doan.tsx`, kéo thẻ gặp `thieu_hop_dong`) cũng hiện đúng ô này —
   * người được sửa PHẢI GIỐNG NHAU ở MỌI nơi, nếu không "siết quyền ở ⑤" chỉ là ảo: ai bị chặn ở
   * một nơi vẫn còn nơi khác (đã render, hoặc chưa tới lượt ẩn) để sửa đúng tệp đó.
   *
   * 🔴 GỌI THẲNG `duocSuaHopDongTheoGiaiDoan` (2-quy-trinh/giai-doan-mua-hang.ts) — KHÔNG tự tính
   * lại `giaiDoanDaToiLuot(...)` ở đây. Hàm đó là MỘT LUẬT DÙNG CHUNG với `hop-chuyen-giai-doan.tsx`;
   * tự tính riêng ở từng nơi là hai nơi có thể lệch nhau khi sau này ai đó sửa một chỗ mà quên
   * chỗ kia — xem chú thích đầy đủ ở nơi khai báo hàm.
   */
  const duocSuaHopDong = duocSuaHopDongTheoGiaiDoan(quyen, giaiDoan);
  /* ★ Bản PO nhà cung cấp ký có cờ RIÊNG — Sếp 16/09/2026: "Nhân viên là người đính kèm file PO
     ký". Xem `duocDinhDonMuaHangNCCKy` để biết vì sao không dùng chung cờ với Hợp đồng. */
  const duocDinhPOKy = duocDinhDonMuaHangNCCKy(quyen);

  /**
   * ★ AI ĐƯỢC DUYỆT HOÀN THÀNH ĐƠN Ở BƯỚC ⑥ — Ban lãnh đạo 22/08/2026: *"Bước này sẽ để nhân viên
   * phụ trách [của] đề nghị này duyệt"*.
   *
   * 🔴 NỚI THÊM, KHÔNG THAY THẾ. Trước đây chỉ vai trò `xacNhanTruongBP` (trưởng bộ phận / quản
   * trị) thấy nút, nên nhân viên đi trọn quy trình vẫn phải chờ trưởng bộ phận bấm hộ một việc
   * mà chính họ mới biết hàng đã về đủ chưa. Nay người **đang phụ trách ít nhất một dòng của đề
   * nghị này** cũng duyệt được; trưởng bộ phận vẫn giữ nguyên quyền — cắt quyền của họ là chặn
   * đường xử lý khi nhân viên nghỉ phép.
   *
   * ⚠️ Đây là quyền theo TỪNG HỒ SƠ, không phải theo cấp. `laViecCuaToi` là hàm dùng chung đã
   * quyết định "việc của tôi" ở mọi màn khác — dùng lại nó để một người không thấy hồ sơ này ở
   * màn "Công việc của tôi" mà lại duyệt được nó ở đây.
   *
   * ⚠️ Chốt chặn ĐIỀU KIỆN NGHIỆP VỤ (đủ hàng, đủ phiếu giao, có hóa đơn VAT) nằm ở tầng ghi
   * `xacNhanTruongBP`, không phải ở đây. Biến này chỉ quyết định AI THẤY NÚT.
   */
  const duocDuyetHoanThanhDon =
    !!dn && (quyen.xacNhanTruongBP || laViecCuaToi(dn, nguoiDung.uid));

  /** Ai sẽ nhận khi bấm "Chuyển tiếp" — các nhân viên đang phụ trách ít nhất một dòng. */
  const nguoiSeNhan = [
    ...new Set(dn.items.map((d) => d.nguoiPhuTrachTen).filter((x): x is string => Boolean(x))),
  ];
  const soDongChuaPhanBo = dn.items.filter((d) => !d.nguoiPhuTrachUid).length;

  return (
    <>
      {/* NÚT QUAY LẠI — chỉ đạo Ban lãnh đạo 10/08/2026. Breadcrumb ở dưới vẫn còn,
          nhưng người dùng quen bấm một nút "quay lại" rõ ràng hơn là dò chữ nhỏ. */}
      {/* BỐ CỤC HAI CỘT (theo trang nhiệm vụ của Base): nội dung làm việc bên trái,
          thông tin tra cứu bên phải. Dưới 1024px cột phải tự xuống dưới. */}
      {/* Cột phải rộng THEO TỶ LỆ ~27% chứ không cố định 320px: vùng làm việc đã bỏ
          giới hạn 1440px nên trải kín màn hình — cột phải cố định sẽ càng ngày càng
          lép so với cột trái trên màn rộng, mất cân đối như ảnh Ban lãnh đạo gửi
          16/08/2026. Tỷ lệ ~27% lấy theo ảnh mẫu Base.vn trong cùng đợt phản hồi đó.
          Hai chỗ minmax đều có lý do sống còn:
          · Cột trái minmax(0,1fr): không có sàn 0 thì bảng rộng bên trong lấy min-content
            làm sàn, đẩy vỡ grid và tràn ngang cả trang.
          · Cột phải minmax(320px,27%): sàn 320px giữ cho các khối tra cứu không bị bóp
            nát trên màn hẹp (1280px trở xuống, khi 27% chỉ còn ~260px). */}
      <div className="grid gap-(--hp-md-section) lg:grid-cols-[minmax(0,1fr)_minmax(320px,27%)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-(--hp-md-section)">
          {/* 🔴 NÚT QUAY LẠI · TIÊU ĐỀ · DẢI BƯỚC NẰM TRONG CỘT TRÁI — Ban lãnh đạo 17/08/2026:
              *"kéo tịnh tiến lên trên"* (mũi tên chỉ vào khoảng trống góc trên phải).

              Trước đó ba khối này chiếm hết bề ngang phía trên lưới, nên cột phải chỉ bắt đầu
              được từ dưới dải bước — để lại một vùng trắng cao gần 200px ở góc trên phải, đúng
              chỗ Ban lãnh đạo khoanh. Đưa vào cột trái thì cột phải kéo lên sát dòng đầu trang,
              giống trang nhiệm vụ Base.

              ⚠️ Dải 7 bước giờ chỉ còn ~73% bề ngang. Nó vốn đã có khung cuộn ngang riêng nên
              không tràn trang, nhưng nếu sau này thêm bước thì kiểm lại trên màn 1280px. */}
          {/**
            * ★★ NÚT ĐÓNG POP-UP, KHÔNG PHẢI LINK — khi có `onDongPopup` (đang nhúng trong
            * Dialog ở "cách 3"). Xem chú thích ở tham số `onDongPopup` đầu file: `<Link
            * href="/de-nghi">` lúc đó điều hướng tới ĐÚNG URL đang đứng nên trình duyệt coi là
            * no-op, nút trông như chết. Route thật (`/de-nghi/[id]/page.tsx`) không truyền
            * `onDongPopup` nên vẫn giữ nguyên `<Link>` — Ctrl+click/chuột giữa vẫn mở tab mới
            * được, đúng hành vi cũ.
            */}
          {onDongPopup ? (
            <Button variant="ghost" size="sm" className="w-fit -ml-2" onClick={onDongPopup}>
              <ArrowLeft className="size-4" aria-hidden />
              Quay lại danh sách đề nghị
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-fit -ml-2"
              nativeButton={false}
              render={<Link href="/de-nghi" />}
            >
              <ArrowLeft className="size-4" aria-hidden />
              Quay lại danh sách đề nghị
            </Button>
          )}

          <PageHeader
            crumbs={[
              { label: "Thu mua", href: "/tong-quan" },
              { label: "Quy trình mua hàng", href: "/de-nghi" },
              { label: dn.code },
            ]}
            title={dn.tieuDe}
            description={`${dn.code} · ${dn.tenCongTrinh} · ${nhanPhongBan(dn.phongBanNguon)}`}
            /* 📌 ĐÃ BỎ nhóm nút góc trên phải (Ban lãnh đạo 16/08/2026: *"bỏ các mục này"*):
               huy hiệu trạng thái · nút "Chuyển tiếp" · nút "Lập đơn đặt hàng".

               🔴 ĐÃ KIỂM CẢ BA CÒN ĐƯỜNG VÀO KHÁC trước khi bỏ (quy ước CLAUDE.md 3.4b —
               phiên 03 suýt làm module Báo giá thành mồ côi):
                 · Chuyển tiếp → menu ⋯ trên thẻ ở bảng quy trình
                 · Lập đơn đặt hàng → nút ở khối "Đơn đặt hàng" ngay trong trang này
                 · Trạng thái → khối "Giai đoạn hiện tại" ở cột phải, chi tiết hơn */
          />

          {/* Dải mũi tên 7 bước — nhìn ra ngay đề nghị đang đứng ở đâu trong quy trình */}
          <ThanhGiaiDoan giaiDoan={giaiDoan} />
          {/* ===== THÔNG TIN ĐỀ NGHỊ — danh sách trường đánh số =====
              Bố cục theo trang nhiệm vụ Base.vn (ảnh Ban lãnh đạo cung cấp 10/08/2026):
              trường nào cũng có số thứ tự để trao đổi qua điện thoại chỉ nhau được ngay
              (*"ô số 4 điền gì"*).

              🔴 MỞ SẴN từ 13/09/2026 — Ban lãnh đạo: *"mục này luôn bung ra, không group lại"*.

              ⚠️ ĐÂY LÀ ĐẢO NGƯỢC MỘT CHỈ ĐẠO CŨ CỦA CHÍNH BAN LÃNH ĐẠO, ghi lại để phiên sau
              đừng tưởng ai lỡ tay rồi "sửa về như cũ": ngày 15/08/2026 chính Ban lãnh đạo yêu cầu
              *"hãy luôn group này lại"*, lý do lúc đó là phần lớn thông tin ở đây đã có ở tiêu đề
              trang và khối "Thông tin nhiệm vụ" bên phải, mở sẵn thì đẩy phần việc thật (phân bổ,
              báo giá, đơn hàng) xuống dưới màn hình.

              📌 Vì sao đổi ý là hợp lý: từ 15/08 tới nay khối này đã khác hẳn — nay có thêm ô 05
              "Đường dẫn đề nghị" và menu ⋯ gom 4 việc (sao chép mã · sửa trường dữ liệu · trường
              tự thêm · lưu trữ). Gập sẵn thì bốn việc đó nằm sau một cú bấm mà không có dấu hiệu
              nào cho biết chúng tồn tại.

              👉 Vẫn GẬP ĐƯỢC bằng tay — chỉ đổi trạng thái MẶC ĐỊNH lúc vào trang, không khoá. */}
          <KhoiGap tieuDe="Thông tin đề nghị" moSan>
            {/* ★★ BỐN LỐI VÀO DỜI TỪ MENU ⋯ CỦA THẺ SANG ĐÂY — Ban lãnh đạo 12/09/2026 yêu cầu bỏ
                chúng khỏi menu, và nói rõ: *"chỉ bỏ ở mục hiển thị thôi, còn chức năng thì vẫn
                phải giữ lại"*. Nên đây KHÔNG phải nút mới, mà là chỗ ở mới của đúng bốn chức năng
                cũ. Đặt tại khối "Thông tin đề nghị" vì cả bốn đều thao tác trên chính thông tin
                người dùng đang đọc ở ngay dưới.

                🔴 MỖI NÚT LÀ LỐI VÀO DUY NHẤT CÒN LẠI của chức năng đó trong toàn app (đã đo
                bằng grep trước khi dời). Bỏ nút nào ở đây là chức năng đó CHẾT — xem CLAUDE.md
                §3.4b. Cụ thể:
                  · Sao chép mã   → chỗ duy nhất gọi `navigator.clipboard` cho mã hồ sơ
                  · Trường dữ liệu → chỗ duy nhất SỬA được nội dung một dòng mặt hàng đã nhập
                                     (bảng Phân bổ chỉ thêm/xóa), và sửa Bộ phận / Nhóm / Link phiếu
                  · Trường tự thêm → chỗ duy nhất sửa cặp tên–giá trị tự đặt
                  · Lưu trữ        → lối thoát thay cho nút Xóa; hộp Xóa còn đang khuyên dùng nó

                📌 Gác `quyen.lapPO` cho ba nút ghi — đúng mức quyền menu ⋯ đang gác (`thaoTac`
                chỉ được truyền khi `quyen.lapPO`). Nút "Sao chép mã" KHÔNG gác: đọc mã là việc
                ai xem được hồ sơ cũng làm được, và trước đây mục đó cũng nằm ngoài khối `thaoTac`. */}
            {/* 🔴 GOM VÀO MENU ⋯ — Ban lãnh đạo 13/09/2026: *"ẩn luôn mục này đi"*, chỉ vào hàng
                4 nút từng nằm ở đây.
                📌 GOM chứ KHÔNG BỎ. Ẩn hẳn là cả 4 chức năng chết — đây là lối vào cuối cùng của
                chúng sau khi bỏ khỏi menu ⋯ của thẻ hôm 12/09. Nặng nhất là "Chỉnh sửa trường dữ
                liệu": chỗ DUY NHẤT sửa được nội dung một dòng mặt hàng đã nhập (bảng Phân bổ chỉ
                thêm/xóa), mà dòng đã lên đơn thì xóa bị chặn → gõ nhầm là kẹt vĩnh viễn.
                Sếp đã cân nhắc và chọn phương án gom.

                🔴 CẬP NHẬT CÙNG NGÀY 13/09/2026: Sếp yêu cầu ẩn luôn cả nút ⋯ này — *"ẩn luôn
                này đi, nhưng vẫn giữ code. a sẽ sửa sau"*. Nên toàn bộ khối dưới đây được gói
                trong cờ `HIEN_MENU_THONG_TIN_DE_NGHI` (khai ở đầu tệp, đang là `false`), KHÔNG
                xóa một dòng nào. Đọc chú thích của cờ đó để biết bốn chức năng nào đang tạm
                không có lối vào. */}
            {HIEN_MENU_THONG_TIN_DE_NGHI && (
            <div className="mb-(--hp-md-row-gap) flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      aria-label={`Thao tác với thông tin đề nghị ${dn.code}`}
                      className="flex size-8 items-center justify-center rounded-md text-text-desc transition-colors hover:bg-muted hover:text-text-primary"
                    />
                  }
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </DropdownMenuTrigger>
                {/* ⚠️ base-nova bắt buộc Item nằm trong Group — thiếu là crash cả trang. */}
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(dn.code);
                          toast.success("Đã sao chép mã đề nghị", { description: dn.code });
                        } catch {
                          /* Trình duyệt chặn clipboard (HTTP thường / thiếu quyền) — nói thật và in
                             nguyên mã ra để người dùng chép tay, không nuốt lỗi im lặng. */
                          toast.error("Trình duyệt không cho sao chép", {
                            description: `Tự chép tay: ${dn.code}`,
                          });
                        }
                      }}
                    >
                      <Copy className="size-4 shrink-0" aria-hidden />
                      Sao chép mã
                    </DropdownMenuItem>
                    {/* Gác `quyen.lapPO` cho ba mục GHI — đúng mức quyền menu ⋯ của thẻ đang gác.
                        "Sao chép mã" không gác: đọc mã là việc ai xem được hồ sơ cũng làm được. */}
                    {quyen.lapPO && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setHopSuaTruong("tuy_chinh")}>
                          <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
                          Chỉnh sửa trường dữ liệu
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setHopSuaTruong("bo_sung")}>
                          <ListPlus className="size-4 shrink-0" aria-hidden />
                          Trường tự thêm
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* 🔴 CÓ CẢ HAI CHIỀU, khác hẳn menu ⋯ của thẻ. Menu đó chỉ mọc trên thẻ của
                            bảng, mà bảng đã lọc bỏ hồ sơ `luuTru` — nên nhãn luôn là "Lưu trữ" và
                            lưu trữ thành CỬA MỘT CHIỀU. Trang này vào được kể cả khi hồ sơ đã ẩn
                            khỏi bảng, nên đây là chỗ đầu tiên bỏ lưu trữ được. */}
                        <DropdownMenuItem
                          onClick={() => {
                            doiLuuTru(dn.id, !dn.luuTru, nguoiDung.tenHienThi);
                            toast.success(dn.luuTru ? "Đã bỏ lưu trữ" : "Đã lưu trữ", {
                              description: dn.luuTru
                                ? "Hồ sơ quay lại đúng cột trên bảng quy trình."
                                : "Hồ sơ ẩn khỏi bảng quy trình nhưng giữ nguyên trạng thái. Bỏ lưu trữ ngay tại đây.",
                            });
                          }}
                        >
                          <Archive className="size-4 shrink-0" aria-hidden />
                          {dn.luuTru ? "Bỏ lưu trữ" : "Lưu trữ"}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            )}
            <DanhSachTruong
              truong={[
                // `daiCaHang` cho hai trường chữ dài — để trong một ô hẹp thì bị cắt mất.
                /* ★★★ THỨ TỰ 13 TRƯỜNG — Ban lãnh đạo 13/09/2026 (*"bố cục mục này lại cho a"*),
                   đánh số tay trên ảnh chụp màn hình. ĐỪNG SẮP LẠI khi không có chỉ đạo mới:
                   số ô sinh theo CHỈ SỐ MẢNG, nên đảo thứ tự là đổi luôn con số mà cả phòng đang
                   dùng để chỉ nhau qua điện thoại (*"ô số 4 điền gì"*).

                   🔴 HAI TRƯỜNG ĐÃ BỎ trong lần sắp này, Sếp được hỏi trước và đã chọn bỏ:
                     · "Mã dự án" — ⚠️ ĐÂY TỪNG LÀ CHỖ DUY NHẤT hiển thị mã dự án của một đề nghị
                       (thẻ trên bảng không có, cột phải không có). Hệ quả đã báo Sếp: khi app chặn
                       *"đề nghị X thuộc dự án A, khác mã dự án B trên đơn hàng"* lúc gắn đơn, người
                       dùng KHÔNG còn chỗ nào mở ra xem mã dự án của đề nghị để hiểu vì sao bị chặn.
                       Dữ liệu `dn.maDuAn` KHÔNG mất — mọi luật vẫn đọc nó, chỉ là thôi hiển thị.
                     · "Mức độ ưu tiên" — vẫn còn thấy được qua badge "Gấp" trên thẻ ở bảng quy trình.

                   📌 Sáng 13/09/2026 Sếp từng bảo GIỮ "Mã dự án"; chiều cùng ngày bố cục mới bỏ nó
                   và Sếp xác nhận bỏ. Ghi cả hai lần ở đây để phiên sau không tưởng ai lỡ tay xóa. */
                /* 🔴 KHÔNG ĐẶT `daiCaHang` CHO HAI Ô NÀY — Ban lãnh đạo 13/09/2026:
                   *"mục 1.2.3 cùng dòng mà"*.

                   `daiCaHang` cho ô chiếm TRỌN CẢ HÀNG (`lg:col-span-3`), nên "Tên đề xuất" và
                   "Tên công trình" mỗi cái nuốt một hàng và đẩy ô 03 xuống dòng dưới — đúng cái
                   Ban lãnh đạo vừa báo sai. Bỏ cờ đi thì lưới 3 cột xếp 01·02·03 cùng một hàng,
                   khớp đúng ảnh Ban lãnh đạo đánh số.

                   ⚠️ Đánh đổi đã biết: hai trường này là chữ DÀI (tiêu đề đề xuất thường kèm số
                   hợp đồng + tên công trình). Trong ô hẹp chúng sẽ XUỐNG NHIỀU DÒNG chứ không bị
                   cắt — `DanhSachTruong` đã có `break-words` ở ô giá trị, nên không mất chữ. Đó là
                   lý do giữ được bố cục 3 cột mà vẫn đọc đủ. */
                { nhan: "Tên đề xuất", giaTri: dn.tieuDe },
                { nhan: "Tên công trình", giaTri: dn.tenCongTrinh },
                { nhan: "Số hợp đồng CĐT", giaTri: dn.maHopDongCDT },
                { nhan: "Người đề nghị", giaTri: dn.nguoiDeNghiTen },
                { nhan: "Phòng ban đề nghị", giaTri: nhanPhongBan(dn.phongBanNguon) },
                // Nhóm đề xuất — trường của thẻ Base (14/08/2026). Phiếu cũ không có thì đọc
                // là "Khác", KHÔNG đoán ngược từ nội dung vật tư.
                { nhan: "Nhóm đề xuất", giaTri: NHAN_NHOM_DE_XUAT[dn.nhomDeXuat ?? "khac"] },
                /**
                 * ★ MÃ ĐỀ XUẤT APP REQUEST — Ban lãnh đạo 21/08/2026: *"để sau này có thể từ mã
                 * request để lọc lại dữ liệu"*. Khóa nối hai app: phiếu sinh tự động từ App Request
                 * mang mã bên đó (vd `000000032`).
                 *
                 * ⚠️ CHÚ THÍCH CŨ Ở ĐÂY GHI SAI, đã sửa 13/09/2026: nó ghi *"`DanhSachTruong` tự
                 * bỏ trường `undefined`, nên không hiện nhãn trống"*. KHÔNG ĐÚNG — component vẽ
                 * MỌI trường và hiện dấu "—" khi thiếu giá trị (xem `danh-sach-truong.tsx`).
                 * Để nguyên câu sai thì người sau đọc nhầm rồi đi "dọn" mảng trường, mà dọn là
                 * LỆCH SỐ Ô của mọi trường phía sau.
                 */
                { nhan: "Mã đề xuất", giaTri: dn.maDeXuatAppRequest },
                { nhan: "Số mặt hàng", giaTri: `${dn.items.length} dòng vật tư` },
                /**
                 * ★★ Ô 05 — ĐƯỜNG DẪN ĐỀ NGHỊ — Ban lãnh đạo 12–13/09/2026: *"Điều chỉnh lại tên
                 * trường — Đường dẫn đề nghị: đính kèm link của mã đề nghị vào đây"*, và *"chuyển
                 * vị trí mục 3 sang mục số 5"*.
                 *
                 * Trước đây đây là ô 03 *"Mã đề nghị"* hiện `dn.code` dưới dạng CHỮ TRƠN. Nay dời
                 * xuống vị trí 05 và biến thành liên kết bấm được, nhãn là chính mã hồ sơ.
                 *
                 * 🔴 BẮT BUỘC `target="_blank"` — KHÔNG được dùng `<Link>` điều hướng cùng tab.
                 * Đã đo trước khi làm, có HAI lý do, bỏ cái nào cũng sinh lỗi thật:
                 *   ① Ở TRANG ĐẦY ĐỦ, địa chỉ này TRÙNG đúng URL đang đứng → Next.js coi là no-op,
                 *      bấm vào KHÔNG có gì xảy ra. Không lỗi lint, không lỗi build, chỉ là một nút
                 *      chết — đúng thứ CLAUDE.md §3.5 cấm. Dự án đã dính lỗi này một lần với nút
                 *      "Quay lại danh sách đề nghị" (xem chú thích `onDongPopup` ở đầu file).
                 *   ② Trong POP-UP xem nhanh (trang này được nhúng nguyên vẹn vào `de-nghi-danh-sach.tsx`,
                 *      cố ý KHÔNG đổi URL), điều hướng cùng tab sẽ THÁO cả bảng quy trình — mất bộ
                 *      lọc và vị trí cuộn, đúng thứ pop-up sinh ra để giữ.
                 * Mở tab mới gỡ được cả hai: trang đầy đủ vẫn mở ra hồ sơ thật, pop-up thì bảng phía
                 * sau còn nguyên.
                 *
                 * 📌 KHÁC "Link phiếu đề nghị" (`dn.linkPhieuDeNghi`) ở khối bước ① — cái đó là địa
                 * chỉ NGOÀI app do người dùng tự dán. Ô này là đường dẫn NỘI BỘ tới chính hồ sơ, để
                 * dán sang app Kho / QLDA (Ban lãnh đạo 20/08/2026: *"các app khác sẽ link từ mã đề nghị"*).
                 *
                 * ⚠️ `giaTri` là `ReactNode` nên truyền JSX vào chạy được, NHƯNG nhánh hiện dấu "—"
                 * khi thiếu dữ liệu sẽ không còn áp cho ô này — JSX không bao giờ bằng `undefined`.
                 * `dn.code` luôn có nên không cần chặn thêm.
                 */
                {
                  nhan: "Đường dẫn đề nghị",
                  /**
                   * ★★ TRỎ SANG APP ĐỀ XUẤT — Ban lãnh đạo 13/09/2026: *"phải link api tới app
                   * đề xuất chứ"*. Trước đó ô này trỏ nội bộ `/de-nghi/<id>`.
                   *
                   * 🔴 HAI NHÁNH, CỐ Ý KHÁC ĐÍCH:
                   *   · Hồ sơ ĐẾN TỪ App Request (có `idHoSoAppRequest`) → mở đúng hồ sơ bên App
                   *     Request. Đó mới là "nhà" của tờ đề nghị; app Thu mua chỉ là nơi xử lý.
                   *   · Hồ sơ LẬP TAY trong app (không có id đó) → giữ liên kết nội bộ. Bên App
                   *     Request KHÔNG có hồ sơ nào để mở, trỏ sang là ra trang trống.
                   *   Cả hai đều đúng nghĩa "đường dẫn tới đề nghị" nên dùng chung một nhãn.
                   *
                   * ⚠️ HỒ SƠ CŨ (về trước 13/09/2026) cũng rơi vào nhánh hai, vì lúc đó app chưa
                   * lưu `idHoSoAppRequest`. Không phải lỗi — chỉ là dữ liệu cũ thiếu trường.
                   *
                   * 🔴 `target="_blank"` giữ nguyên cho CẢ HAI nhánh, xem chú thích ở trên: nhánh
                   * nội bộ mà điều hướng cùng tab thì ở trang đầy đủ là no-op (bấm không đi đâu),
                   * còn trong pop-up thì tháo mất cả bảng quy trình.
                   */
                  /**
                   * ★★ CHỮ HIỆN PHẢI NÓI ĐÚNG NƠI LIÊN KẾT DẪN TỚI — Sếp 14/09/2026:
                   * *"Sao đề nghị này a bấm zô mà đường link ko xem được thông tin trong đề nghị"*.
                   *
                   * 🔴 TRƯỚC ĐÂY IN `dn.code` CHO CẢ HAI NHÁNH, và đó là chỗ gây hiểu nhầm: ô ghi
                   * `260001-HPCS-HDXD-001-PR-004` — **mã nội bộ của app Thu mua** — trong khi
                   * `href` lại trỏ sang App Request. Người đọc thấy mã nội bộ thì đinh ninh liên
                   * kết dẫn tới chính trang này, bấm vào thấy màn hình lạ nên tưởng liên kết hỏng.
                   *
                   * ✅ Nay chữ đi theo đích: sang App Request thì in **mã đề xuất bên đó**
                   * (`maDeXuatAppRequest`, vd `000000087`) — đúng con số người dùng tra được trên
                   * App Request. Liên kết nội bộ thì vẫn in mã nội bộ như cũ.
                   *
                   * 📌 `maDeXuatAppRequest` có thể trống ở vài hồ sơ cũ → lùi về `dn.code`, đừng để
                   * ra một liên kết không có chữ nào.
                   */
                  giaTri: (
                    <a
                      href={duongDanHoSoAppRequest(dn.idHoSoAppRequest) ?? `/de-nghi/${dn.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
                    >
                      {duongDanHoSoAppRequest(dn.idHoSoAppRequest)
                        ? (dn.maDeXuatAppRequest?.trim() || dn.code)
                        : dn.code}
                    </a>
                  ),
                },
                { nhan: "Ngày đề nghị", giaTri: formatMocThoiGian(dn.ngayDeNghi) },
                {
                  nhan: "Ngày duyệt",
                  // ⚠️ Phiếu lập trong "thời kỳ duyệt hai cấp" (sáng 12/08/2026) có thể còn
                  // `ngayDuyet` rỗng — format chuỗi rỗng ra "Invalid Date" nên phải chặn.
                  giaTri: dn.ngayDuyet ? formatMocThoiGian(dn.ngayDuyet) : "—",
                },
                { nhan: "Ngày cần hàng", giaTri: formatMocThoiGian(dn.ngayCanHang) },
                {
                  /**
                   * ★ Ô 13 — TÀI LIỆU ĐÍNH KÈM, thêm 13/09/2026 theo bố cục Ban lãnh đạo vẽ.
                   *
                   * 📌 Hiện SỐ ĐẾM, không liệt kê tên tệp: đây là khối TRA CỨU NHANH, còn chỗ mở
                   * và tải tệp là khu đính kèm của từng bước ở dưới. Nhồi danh sách tệp vào một ô
                   * của lưới 3 cột thì vỡ hàng, và trùng việc với khu đính kèm.
                   *
                   * ⚠️ Không có tệp thì để `undefined` cho `DanhSachTruong` tự hiện dấu "—", đừng
                   * ghi "0 tệp": ô trống và ô có số 0 đọc ra hai nghĩa khác nhau, mà ở đây chúng
                   * cùng nghĩa là "chưa đính gì".
                   */
                  nhan: "Tài liệu đính kèm",
                  /* ★ ĐẾM CẢ HAI NGUỒN (13/09/2026): tệp nộp trong app (`taiLieu`) và tệp người
                     đề nghị đính kèm bên App Request (`taiLieuAppRequest`). Trước đó chỉ đếm
                     nguồn đầu, nên hồ sơ đến từ App Request luôn hiện "—" dù có tệp thật. */
                  giaTri: soTepDinhKem > 0 ? `${soTepDinhKem} tệp` : undefined,
                },
              ]}
            />

            {/* ★ NHÓM ĐỀ XUẤT — Ban lãnh đạo 13/08/2026: *"để sau này có thể tổng hợp lại
                các đề xuất con của cái đề xuất lớn đó"*.

                Hiện ở CẢ HAI chiều: đứng ở phiếu con thì thấy đường về phiếu lớn, đứng ở
                phiếu lớn thì thấy đủ các phần đã tách ra. Thiếu một chiều là người dùng
                phải nhớ trong đầu mình đã tách những gì — đúng thứ app sinh ra để bỏ.

                📌 Quan hệ dựa trên `deNghiGocId` chứ không dựa vào tên: sửa tên một bản
                copy vẫn không làm đứt nhóm. */}
            {dn.deNghiGocId && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary-bg p-(--hp-md-row-pad) text-sm">
                <GitBranch className="size-4 shrink-0 text-primary" aria-hidden />
                <span className="text-text-secondary">Tách ra từ đề xuất</span>
                <Link
                  href={`/de-nghi/${dn.deNghiGocId}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {dn.maDeNghiGoc ?? dn.deNghiGocId}
                </Link>
              </div>
            )}
            {/* 🔴 GẬP LẠI ĐƯỢC — Ban lãnh đạo 17/08/2026: *"thêm nút group này lại"*.
                Khối này (danh sách phiếu con + bảng "Ai đang làm phần nào") từng bung hết
                và chiếm gần nửa màn hình ngay đầu trang, đẩy các bước của quy trình xuống
                dưới. Ruột dời sang `KhoiDeXuatCon` — xem chú thích trong file đó. */}
            {deNghiCon.length > 0 && (
              <KhoiDeXuatCon
                deNghi={dn}
                deNghiCon={deNghiCon}
                donHang={donHang}
                baoGia={baoGia}
                phieuNhan={phieuNhan}
                hienBangNangLuc={quyen.phanBoCongViec}
              />
            )}

            {/* Tài liệu đính kèm lúc lập phiếu — nội dung nằm trên máy chủ (kho tệp),
                bấm tên tệp để mở. Không có thì không hiện, đừng chiếm chỗ bằng khối rỗng. */}
            {dn.taiLieu && dn.taiLieu.length > 0 && (
              /* Khai `text-sm` ở lớp bọc, lý do như hộp đề xuất con phía trên. */
              <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-(--hp-md-row-pad) text-sm">
                <p className="font-semibold text-text-primary">
                  Tài liệu đính kèm ({dn.taiLieu.length})
                </p>
                <ul className="flex flex-col gap-1">
                  {dn.taiLieu.map((t) => (
                    <li key={t.id} className="flex min-w-0 items-center gap-2 text-sm">
                      <LienKetTep tep={t} />
                      <span className="shrink-0 text-xs text-text-desc">{t.nguoiTaiTen}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ★★ TỆP NGƯỜI ĐỀ NGHỊ ĐÍNH KÈM BÊN APP REQUEST — Ban lãnh đạo 13/09/2026.
                Trước đó app nhận rồi vứt, nên ô 13 luôn hiện "—" dù người đề nghị có nộp thật.

                🔴 KHỐI RIÊNG, KHÔNG TRỘN vào khối trên — hai loại tệp KHÁC NHAU về chỗ ở:
                khối trên mở xem được ngay trong app; khối này thì app KHÔNG có nội dung tệp,
                phải sang App Request mới tải được.

                🔴 KHÔNG DỰNG THẺ `<a href>` TỪ `duongDan`. Đó là đường dẫn trong kho R2 của App
                Request, cần chữ ký mới tải (link họ gửi kèm có `X-Amz-Expires=300`, sống 5 phút),
                mà app Thu mua không có khóa R2. Ghép ra `<a>` là một liên kết bấm vào báo lỗi —
                đúng thứ CLAUDE.md §3.5 cấm: *"đừng để giao diện hứa một việc app không làm"*.
                👉 Nên nói THẲNG là tệp nằm bên App Request, và đưa đúng một lối đi có thật. */}
            {dn.taiLieuAppRequest && dn.taiLieuAppRequest.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-(--hp-md-row-pad) text-sm">
                <p className="font-semibold text-text-primary">
                  Tài liệu người đề nghị đính kèm ({dn.taiLieuAppRequest.length})
                </p>
                <ul className="flex flex-col gap-1">
                  {dn.taiLieuAppRequest.map((t, i) => (
                    <li
                      key={`${t.duongDan ?? t.ten}-${i}`}
                      className="flex min-w-0 items-center gap-2 text-sm"
                    >
                      <Paperclip className="size-4 shrink-0 text-text-desc" aria-hidden />
                      <span className="min-w-0 truncate text-text-primary">{t.ten}</span>
                      {t.kichThuoc !== undefined && (
                        <span className="shrink-0 text-xs text-text-desc">
                          {Math.max(1, Math.round(t.kichThuoc / 1024))} KB
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {/* Một lối đi CÓ THẬT, không phải lời hứa: mở đúng hồ sơ bên App Request. Hồ sơ
                    thiếu `idHoSoAppRequest` (lập tay trong app) thì không vẽ nút, chỉ nói lý do. */}
                {duongDanHoSoAppRequest(dn.idHoSoAppRequest) ? (
                  <p className="text-xs text-text-desc">
                    Nội dung tệp nằm ở App Request —{" "}
                    <a
                      href={duongDanHoSoAppRequest(dn.idHoSoAppRequest) ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
                    >
                      mở hồ sơ bên đó để tải
                    </a>
                    .
                  </p>
                ) : (
                  <p className="text-xs text-text-desc">
                    Nội dung tệp nằm ở App Request. Hồ sơ này chưa có đường dẫn sang đó nên phải
                    tự tra theo mã đề xuất {dn.maDeXuatAppRequest ?? "—"}.
                  </p>
                )}
              </div>
            )}
          </KhoiGap>

          {/* ★ ĐẦU VÀO THEO GIAI ĐOẠN — Ban lãnh đạo 16/08/2026: *"đây là quy trình thu mua
              khi mở trên 1 trang, e bố cục giống 100% như vậy"*.

              🔴 Base gom dữ liệu theo GIAI ĐOẠN, app trước gom theo LOẠI CHỨNG TỪ. Muốn biết
              "bước ③ đã nộp những gì" thì trước đây phải đi tìm khắp trang; nay mở đúng khối
              của bước đó là thấy. Trường đánh số liên tục 01→N như Base.

              🔴 BA KHỐI NGHIỆP VỤ NẰM TRONG GIAI ĐOẠN — cùng chỉ đạo 16/08/2026. Khi được
              báo là app có ba khối Base không có (Phân bổ công việc · Bảng báo giá · Đơn đặt
              hàng), Ban lãnh đạo trả lời: *"những mục này base ko có, e kiểm tra xem nó đang
              trùng ở bước nào thì thêm nó vào bước đó"*.

              Nghĩa là KHÔNG bỏ ba khối (bỏ là mất chức năng chính của app), mà xếp mỗi khối
              vào đúng bước sinh ra nó, qua prop `noiDungNghiepVu`:
                · Phân bổ công việc  → ① Tiếp nhận        (giao người phụ trách là việc bước ①)
                · Bảng báo giá       → ② Yêu cầu NCC báo giá (bảng được LẬP ở bước ② để đi hỏi giá)
                · Đơn đặt hàng       → ④ Lập đơn mua hàng  (đơn được LẬP ở bước ④)

              ⚠️ Chỉ ĐỔI CHỖ, không đổi hành vi: mọi điều kiện hiện/ẩn, mọi prop, mọi lý do
              khóa nút của ba khối giữ y nguyên như khi chúng còn nằm rời ở cuối trang.

              ★★★ "DANH SÁCH CÔNG VIỆC" NAY CŨNG NẰM TRONG ĐÂY — Sếp 15/09/2026, nguyên văn:
              *"mục này đưa vào trong bước hồ sơ thanh toán"* (ảnh khoanh đỏ khối "Danh sách công
              việc" đang đứng riêng ngay trên cụm khối này, hồ sơ ở bước ⑦).

              🔴 ĐÂY LÀ ĐẢO CHỈ ĐẠO 14/09/2026 BẰNG CHỈ ĐẠO MỚI 15/09/2026, KHÔNG PHẢI AI ĐÓ TỰ
              TIỆN SỬA. Chỗ này trước đây ghi: *"Danh sách công việc CỐ Ý đứng riêng, không nhét
              vào đây — Base cũng để nó thành mục ngang hàng với khối giai đoạn. Từ 14/09/2026 nó
              nằm NGAY TRÊN khối này (Sếp: 'Di chuyển lên trên')"*. Câu đó nay HẾT HIỆU LỰC: chỉ
              đạo 14/09 giữ nó ĐỨNG RIÊNG (chỉ đổi vị trí trên/dưới), chỉ đạo 15/09 đưa hẳn VÀO
              TRONG khối của chính bước sinh ra việc đó.

              Lý do Sếp nêu, áp cho mọi bước chứ không riêng bước ⑦: mở khối bước nào thì thấy
              việc bắt buộc của bước ấy ngay tại đó, không còn một mục rời ở đầu trang.

              📌 Cách gắn: hàm `themDanhSachCongViec` bọc từ NGOÀI mảng này, không sửa vào trong
              `noiDungNghiepVu` của từng khối — xem chú thích đầy đủ ở khai báo hàm đó và ở
              `cumCongViecCuaKhoi` (kèm phần đã đo được: khối bước **không** tự xổ sẵn). */}
          <KhoiDauVaoTheoGiaiDoan
            giaiDoan={themDanhSachCongViec([
              {
                ma: "tiep_nhan",
                nhan: NHAN_GIAI_DOAN.tiep_nhan.nhan,
                dangODay: giaiDoan === "tiep_nhan",
                conThieu: conThieuCuaBuoc("tiep_nhan"),
                /**
                 * ❌❌ ĐÃ BỎ KHOÁ XỔ KHỐI — Sếp 14/09/2026, nguyên văn: *"bước này đang bị lỗi
                 * logic, nếu như ko xem được các mặt hàng được đề xuất thì đâu biết cần vật tư gì
                 * để check kho, e kiểm tra lại"*.
                 *
                 * Dòng cũ: `khoaMoRong: vuongMacXoKhoiTiepNhan(dn, cauHinh) ?? undefined`
                 * (Ban lãnh đạo 12/09/2026 — khoá xổ tới khi tích xong "Checkin hàng tồn kho").
                 *
                 * 🔴 SẾP CHỈ ĐÚNG MỘT VÒNG LUẨN QUẨN: bảng vật tư (`BangPhanBo`) nằm BÊN TRONG
                 * chính khối này. Khoá khối lại nghĩa là:
                 *     muốn checkin kho → phải biết cần kiểm vật tư gì → phải xem bảng vật tư
                 *     → nhưng bảng đó nằm trong khối đang bị khoá → chỉ mở khi đã checkin xong.
                 * Không có đường ra. Người dùng buộc phải tích bừa cho khối mở, tức cái chốt tự
                 * biến thành thứ dạy người ta khai gian.
                 *
                 * 🔴 APP CÒN TỰ MÂU THUẪN: câu chặn chuyển bước ở `giai-doan-mua-hang.ts` bảo
                 * *"Mở khối bước đó ở trang chi tiết đề nghị, tích hoàn thành rồi làm tiếp"* —
                 * trong khi chính khối đó bị khoá không cho mở.
                 *
                 * ✅ BỎ KHOÁ NÀY KHÔNG MẤT LUẬT NÀO. Việc "Checkin hàng tồn kho" vẫn được SÁU chốt
                 * khác giữ, đều trong `2-quy-trinh/giai-doan-mua-hang.ts` và đều gọi
                 * `congViecChuaXongCuaBuoc`: chặn chuyển bước · chặn rời bước · chặn giao việc
                 * (phân bổ) · và các nhánh kéo thả. Chốt đứng ở CỬA RA là đúng chỗ; đứng ở CỬA VÀO
                 * thì chặn luôn cả việc đọc dữ liệu cần để làm.
                 *
                 * 📌 Hàm `vuongMacXoKhoiTiepNhan` GIỮ NGUYÊN trong `2-quy-trinh/`, nay không ai
                 * gọi. Đừng xoá: nó là bản ghi của chỉ đạo 12/09, và ngày nào bố cục đổi (bảng vật
                 * tư ra ngoài khối) thì khoá xổ lại dùng được mà không vướng vòng luẩn quẩn trên.
                 */
                truong: [
                  /* ❌ ĐÃ BỎ 4 TRƯỜNG — Sếp 14/09/2026: *"Bỏ thông tin này, không cần hiển thị"*
                     (ảnh khoanh đúng khối ĐẦU VÀO của bước ①):
                       · Bộ phận           → trùng ô 05 khối "Thông tin đề nghị" phía trên
                       · Nhóm đề xuất      → trùng ô 06
                       · Ngày đề nghị cấp  → trùng ô 12 "Ngày cần hàng"
                       · Chi tiết (N mặt hàng) → chỉ là con số, mà bảng vật tư đầy đủ nằm ngay
                         dưới trong khối KẾT QUẢ
                     🔴 ĐÃ KIỂM §3.4b trước khi bỏ: cả bốn đều còn đọc được ở chỗ khác trên CÙNG
                     trang này, nên không mục nào thành mồ côi. */
                  /* ★ LINK PHIẾU ĐỀ NGHỊ — thêm 18/08/2026 cùng hộp "Chỉnh sửa các trường dữ
                     liệu tùy chỉnh".

                     🔴 GIỮ LẠI DÙ SẾP BẢO BỎ CẢ KHỐI — đã kiểm §3.4b: trên TRANG CHI TIẾT thì đây
                     là chỗ DUY NHẤT đọc được `linkPhieuDeNghi`. Ngoài đây nó chỉ còn ở thẻ kanban
                     và trong hộp sửa. Bỏ nốt là người dùng nhập một địa chỉ rồi không bao giờ đọc
                     lại được ở trang chi tiết.
                     📌 Trường này CÓ ĐIỀU KIỆN — hồ sơ nào không nhập thì không hiện, nên khối vẫn
                     trống đúng như ảnh Sếp gửi. Sếp thấy thừa thì nhắn, em bỏ nốt.

                     🔴 PHẢI HIỆN Ở ĐÂY, không chỉ có ô để nhập: trường mà nhập được nhưng không
                     chỗ nào đọc lại là người dùng gõ vào rồi tưởng mất, hoặc gõ mỗi lần một chỗ.
                     📌 Chỉ dựng thành liên kết bấm được khi chuỗi là địa chỉ web — người dùng có
                     thể dán đường dẫn thư mục nội bộ, mà `<a href>` với chuỗi đó thì bấm vào
                     không đi đâu cả. */
                  ...(dn.linkPhieuDeNghi
                    ? [
                        {
                          nhan: "Link phiếu đề nghị",
                          noiDung: /^https?:\/\//i.test(dn.linkPhieuDeNghi) ? (
                            <a
                              href={dn.linkPhieuDeNghi}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
                            >
                              Mở phiếu gốc
                            </a>
                          ) : (
                            <span className="text-sm font-medium break-all text-text-primary">
                              {dn.linkPhieuDeNghi}
                            </span>
                          ),
                        },
                      ]
                    : []),
                  /* ❌ ĐÃ BỎ "Tài liệu đính kèm" khỏi khối này — Sếp 14/09/2026.
                     ✅ An toàn: cùng trang đã có khối riêng *"Tài liệu người đề nghị đính kèm (N)"*
                     bày đủ từng tệp và mở xem được, cộng ô 13 khối "Thông tin đề nghị" hiện số
                     đếm. Ở đây chỉ là bản thứ ba của cùng một thứ. */
                ],
                /* M3 — PHÂN BỔ, thuộc bước ① (chỉ đạo 16/08/2026, xem chú thích đầu khối).
                   Giao ai làm dòng vật tư nào là việc đầu tiên Thu mua phải làm sau khi nhận
                   phiếu, nên nó đứng cùng chỗ với dữ liệu tiếp nhận chứ không rời xuống cuối
                   trang như trước.
                   Các nút hành động đã dời sang cột phải theo bố cục Base.vn (10/08/2026) —
                   mọi việc bấm được gom một chỗ, không rải rác cạnh từng tiêu đề. */
                noiDungNghiepVu: (
                  <section className="flex flex-col gap-(--hp-md-row-gap)">
                    {/* Tiêu đề dùng chung kiểu chữ với nhãn "ĐẦU VÀO" ngay phía trên —
                        xem `NhanPhanTrongGiaiDoan`. Ban lãnh đạo 16/08/2026 khoanh đỏ chỗ
                        này vì tiêu đề con (18px) đang to hơn tiêu đề khối cha (11px). */}
                    <NhanPhanTrongGiaiDoan the="h2" icon={ClipboardList}>
                      {quyen.phanBoCongViec ? "Phân bổ công việc" : "Chi tiết mặt hàng"}
                    </NhanPhanTrongGiaiDoan>
                    {/* Công cụ phân bổ hàng loạt chỉ bày ở bước ①, HOẶC khi còn dòng chưa ai
                        nhận (thêm vật tư mới ở bước sau) — Ban lãnh đạo 15/08/2026. Xem
                        `dangOBuocPhanBo`. */}
                    <BangPhanBo
                      deNghi={dn}
                      dangOBuocPhanBo={giaiDoan === "tiep_nhan" || soDongChuaPhanBo > 0}
                      // Hồ sơ đã chốt (hoàn thành / đóng dở) thì khóa mọi thao tác đổi nội
                      // dung — Ban lãnh đạo 15/08/2026. Dùng `giaiDoanDaKetThuc` cho khớp
                      // với luật chung.
                      hoSoDaDong={hoSoDaDong}
                    />
                  </section>
                ),
                /* ★ ĐÍNH KÈM CHO CẢ SÁU BƯỚC — Ban lãnh đạo 17/08/2026: ảnh khoanh đỏ khối
                   "Bảng báo giá (0)" ở bước ② kèm chữ *"mục đính kèm file"*.

                   🔴 KHÔNG làm riêng bước ②. Việc đang chờ trong danh sách ("thêm chỗ đính
                   kèm cho hợp đồng, đơn có chữ ký, hóa đơn NCC") chính là cùng một nhu cầu;
                   làm lẻ từng chỗ là sau này app có 5 cơ chế đính kèm khác nhau, mỗi chỗ một
                   kiểu. Bước ① nhận biên bản họp, phiếu kiểm tồn kho… */
                /**
                 * ❌❌ ĐÃ BỎ Ô "Đính kèm chứng từ khác" CỦA RIÊNG BƯỚC ① — Sếp 14/09/2026:
                 * *"Bỏ thông tin này, không cần hiển thị"* (ảnh khoanh đúng nút đó).
                 *
                 * ⚠️ CÁI GIÁ, ĐÃ BÁO SẾP: bước ① nay KHÔNG CÒN chỗ đính kèm riêng. Chú thích cũ
                 * ghi bước này dùng để nhận *"biên bản họp, phiếu kiểm tồn kho…"* — những tệp đó
                 * từ nay không có chỗ nộp ở bước ①.
                 *
                 * ✅ KHÔNG MẤT TỆP CŨ: hồ sơ nào đã đính kèm ở bước ① thì tệp vẫn nằm nguyên trong
                 * `tepGiaiDoan["tiep_nhan"]`, và `bo-ho-so-thanh-toan.ts` vẫn đọc được. Chỉ là màn
                 * hình không bày ra nữa.
                 * 👉 Sếp cần lại thì nhắn một câu — dựng lại `<KhuDinhKemGiaiDoan maGiaiDoan=
                 * "tiep_nhan" …>` đúng chỗ này là xong, không phải viết lại gì.
                 *
                 * 📌 Năm bước còn lại GIỮ NGUYÊN ô đính kèm của chúng — chỉ bỏ ở bước ①.
                 */
              },
              {
                ma: "yeu_cau_bao_gia",
                nhan: NHAN_GIAI_DOAN.yeu_cau_bao_gia.nhan,
                dangODay: giaiDoan === "yeu_cau_bao_gia",
                conThieu: conThieuCuaBuoc("yeu_cau_bao_gia"),
                truong: [
                  {
                    nhan: "SL Báo giá",
                    /* ★ SỬA ĐƯỢC NGAY TẠI ĐÂY — Ban lãnh đạo 17/08/2026: *"phần đầu vào thêm
                       chức năng sửa số lượng báo giá"*. Trước đó con số chỉ đặt được một lần
                       lúc kéo phiếu sang bước ②, đặt xong là kẹt.

                       📌 Dùng `noiDung` chứ không dùng `giaTri`: `giaTri` chỉ nhận chữ. */
                    noiDung: (
                      <OSuaSoBaoGia
                        /* 🔴 TRUYỀN CẢ PHIẾU, không truyền một con số — Ban lãnh đạo
                           18/08/2026: *"số liệu báo giá này phải tự động link từ bước giao
                           việc cho nhân viên"*. Con số sinh ra ở lúc PHÂN BỔ (bước ①) và
                           nằm trên TỪNG DÒNG, nên ô này phải tự tổng hợp lại; đọc dòng đầu
                           tiên như bản trước là hiện sai khi mỗi dòng một số. Xem
                           `tongHopSoBaoGia` trong `o-sua-so-bao-gia.tsx`. */
                        deNghi={dn}
                        duocSua={duocSuaTepBuoc && !hoSoDaDong}
                        onLuu={(so) => {
                          /* ★ Cờ quyền: chỉ Trưởng bộ phận mới dời mốc sàn của nút giảm —
                             Sếp 16/09/2026. Xem `soBaoGiaTPGiao`. */
                          datSoBaoGiaChoPhieu(dn.id, so, nguoiDung.tenHienThi, quyen.phanBoCongViec);
                          toast.success(`Đã đổi thành ${so} báo giá cho mọi mặt hàng`);
                        }}
                      />
                    ),
                  },
                ],
                /* BẢNG BÁO GIÁ, thuộc bước ② (chỉ đạo 16/08/2026, xem chú thích đầu khối):
                   bảng được LẬP ở chính bước này để đi mời nhà cung cấp chào giá, nên đứng
                   ngay cạnh trường "SL Báo giá" của bước.

                   🔴 Từ 06/08/2026 menu không còn mục "Báo giá & so sánh NCC", nên đây là lối
                   vào DUY NHẤT tới module đó. Bỏ khối này là module thành mồ côi.

                   🔴 Dùng CHUNG luật với trang bảng báo giá (chỉ đạo 10/08/2026): chỉ người
                   được chia việc hoặc người theo dõi mới thấy. Chặn ngay ở đây để không lộ mã
                   bảng báo giá và tên nhà cung cấp đã chọn cho người không có quyền. */
                /* 📌 CHƯA CÓ BẢNG NÀO THÌ CẢ KHỐI BIẾN MẤT — Ban lãnh đạo 17/08/2026 khoanh nút
                   "Lập bảng báo giá" và ghi *"bỏ nút này"*. Bỏ nút xong thì khối chỉ còn trơ
                   một dòng tiêu đề "BẢNG BÁO GIÁ (0)" không dẫn đi đâu, nên ẩn luôn cả khối.

                   🔴 MODULE BÁO GIÁ KHÔNG BỊ MỒ CÔI — nhưng CÂU NÀY ĐÃ PHẢI VIẾT LẠI 12/09/2026.
                   Bản cũ ghi lối vào là mục "Lập bảng báo giá" trong menu ⋯ trên thẻ. Mục đó đã bỏ
                   (Ban lãnh đạo 12/09/2026), và nó vốn ĐANG HỎNG: với thẻ đứng ở cột ② thì đích
                   truyền vào trùng cột hiện tại nên `xuLyTha` thoát im lặng.
                   HAI lối vào còn sống, đã đo:
                     · mục "Chuyển sang giai đoạn kế tiếp" trong chính menu ⋯ (cùng quyền `lapPO`)
                     · nút "Trình xét duyệt báo giá" ở ngay bước ② bên dưới — từ 20/08/2026 nút đó
                       TỰ LẬP bảng nếu hồ sơ chưa có bảng nào (xem `trinhXetDuyetBaoGiaChoDeNghi`)
                   Cả hai đều bấm được trên điện thoại, nên yêu cầu "phải có lối vào bấm được trên
                   điện thoại" vẫn đạt. Xem CLAUDE.md mục 3.4b. */
                /**
                 * 🔴 HIỆN CẢ KHI CHƯA CÓ BẢNG NÀO — Ban lãnh đạo 19/08/2026: *"2 mục này sao
                 * chưa có kết quả"* (ảnh khoanh bước ② và ③ không có cụm KẾT QUẢ).
                 *
                 * ⚠️ ĐẢO LẠI quyết định 17/08/2026, và đây là lý do chính đáng chứ không phải
                 * tôi quên: hồi đó khối rỗng bị ẩn vì sau khi bỏ nút "Lập bảng báo giá" nó *"chỉ
                 * còn trơ một dòng tiêu đề BẢNG BÁO GIÁ (0) không dẫn đi đâu"*. Nay đã có nhãn
                 * **KẾT QUẢ**, nên một khối rỗng KHÔNG còn vô nghĩa — nó trả lời đúng câu *"bước
                 * này đẻ ra cái gì, và hiện đã có chưa"*. Bước ④ vốn đã làm vậy (*"Chưa có đơn
                 * đặt hàng nào"*), để ② ③ im lặng biến mất là ba bước nói ba kiểu.
                 *
                 * 📌 VÀ VẪN KHÔNG THÊM LẠI NÚT — đúng chỉ đạo 17/08/2026. Thay vào đó nhánh rỗng
                 * **chỉ đường** tới chỗ lập bảng, tức chữa đúng cái lỗi "không dẫn đi đâu" mà
                 * chỉ đạo ấy nêu ra.
                 */
                noiDungNghiepVu: duocXemBaoGiaCuaDeNghi(dn, nguoiDung.uid, quyen) && (
                  <section className="flex flex-col gap-(--hp-md-row-gap)">
                    {/**
                     * ❌ ĐÃ BỎ TOÀN BỘ PHẦN HIỂN THỊ "BẢNG BÁO GIÁ (n)" Ở KHỐI KẾT QUẢ BƯỚC ②
                     *    — Sếp 15/09/2026, hai ảnh chú thích: *"bỏ thông tin này, nó đang bị trùng
                     *    lặp và ko có giá trị"* (thẻ mã bảng) và *"bỏ dòng ghi chú này"* (câu hướng
                     *    dẫn khi chưa có bảng nào).
                     *
                     * 🔴 TRÙNG LẶP Ở ĐÂU: cùng một mã bảng báo giá được in ở HAI khối trên cùng một
                     *    màn — ở đây (KẾT QUẢ bước ②) và ở "XÉT DUYỆT PHƯƠNG ÁN GIÁ" của bước ③.
                     *    Bước ③ mới là chỗ người dùng thao tác thật (duyệt / không duyệt), nên bản
                     *    ở đây chỉ là bản chép lại, đọc xong không làm được gì.
                     *
                     * 📌 BỎ CẢ TIÊU ĐỀ, không chỉ bỏ ruột. Để lại một dòng "Bảng báo giá (0)" trống
                     *    trơn là tái lập đúng cái Ban lãnh đạo đã than ngày 17/08/2026 (*"chỉ còn
                     *    trơ một dòng tiêu đề không dẫn đi đâu"*).
                     *
                     * ✅ KHÔNG LÀM MODULE BÁO GIÁ THÀNH MỒ CÔI — chú thích cũ ở đầu khối cảnh báo
                     *    điều đó, nhưng cảnh báo ấy nay đã hết hiệu lực: màn Báo giá `/bao-gia/[id]`
                     *    **đã bị bỏ hẳn** (Ban lãnh đạo 20/08/2026) và thẻ này từ đó cũng không còn
                     *    là liên kết. Bỏ đi không cắt đường vào của ai.
                     *
                     * 🔴 PHẦN ĐỀ XUẤT + NÚT "TRÌNH XÉT DUYỆT BÁO GIÁ" NGAY DƯỚI THÌ GIỮ NGUYÊN —
                     *    đó mới là chỗ làm việc của bước ②, bỏ nhầm là hồ sơ không đi tiếp được.
                     */}

                    {/**
                     * ★ ĐỀ XUẤT CHỌN BÁO GIÁ + TRÌNH XÉT DUYỆT — NGAY TRONG KHỐI BƯỚC ②.
                     *
                     * 🔴 Ban lãnh đạo 19/08/2026: *"đã đính kèm được file rồi, nhưng chưa có chức
                     * năng đề xuất lấy báo giá nào để trình trưởng bộ phận"*.
                     *
                     * VÌ SAO TRƯỚC ĐÓ KHÔNG THẤY: khối này (`KhoiThuThapBaoGia`) vốn ĐÃ CÓ đầy đủ
                     * — nhập giá từng nhà cung cấp, ô *"Đề xuất của bạn: chọn nhà cung cấp nào?"*,
                     * và nút *"Trình xét duyệt"*. Nhưng nó chỉ được vẽ ở **màn bảng báo giá**
                     * (`/bao-gia/[id]`), nên đứng ở trang đề nghị thì không có đường tới. Nay nhúng
                     * thẳng vào bước ② — đúng chỉ đạo 17/08/2026 *"phần nhập liệu phải nằm trong
                     * khối"*.
                     *
                     * 🔴 KHÔNG CÓ PHẦN NHẬP SỐ LIỆU GIÁ — Ban lãnh đạo 19/08/2026: *"chưa cần chức
                     * năng nhập số liệu NCC, chỉ cần đính kèm file báo giá là được"*.
                     *
                     * Vì vậy dùng `KhoiDeXuatBaoGia` (gọn: đề xuất + trình) chứ KHÔNG dùng
                     * `KhoiThuThapBaoGia` của màn bảng báo giá. Khối đó làm việc khác — nhập đơn giá
                     * từng dòng để dựng bảng so sánh — và cả phần đề xuất lẫn nút trình của nó đều
                     * đòi *"đã nhập giá ít nhất một nhà cung cấp"*. Bỏ điều kiện ấy là phá luật của
                     * chính nó; đây là hai chế độ làm việc khác nhau, không phải hai bản chép tay.
                     *
                     * 📌 Tệp báo giá bỏ vào **khu đính kèm của bước ②** ngay phía trên, không dựng
                     * chỗ bỏ tệp thứ hai trong cùng một bước.
                     *
                     * ⚠️ CHỈ HIỆN KHI CÓ BẢNG Ở TRẠNG THÁI `dang_thu_thap`. Trình xong bảng sang
                     * `da_so_sanh` thì khối tự biến mất — không sửa đề xuất sau khi đã trình.
                     *
                     * 🔴 Đòi `quyen.lapPO`: người chỉ được xem không đề xuất, không trình.
                     */}
                    {/**
                      * 🔴 LUÔN HIỆN KHỐI NÀY Ở BƯỚC ②, KHÔNG ĐÒI PHẢI CÓ HỒ SƠ BÁO GIÁ TRƯỚC
                      * (sửa 20/08/2026 — Ban lãnh đạo báo *"đang không có nút chuyển tiếp quy
                      * trình"*).
                      *
                      * Bản trước lọc `baoGiaLienQuan.filter(dang_thu_thap).map(...)`, nên đề nghị
                      * chưa có hồ sơ báo giá nào thì mảng rỗng → **không vẽ gì cả**: không ô đề
                      * xuất, không nút trình, không một câu giải thích. Người dùng đứng ở bước ②
                      * không có đường nào đi tiếp.
                      *
                      * Vì sao đề nghị lại không có hồ sơ báo giá: hồ sơ đó chỉ được sinh khi **kéo
                      * thẻ** từ cột ① sang ②. Nhưng phiếu còn một đường khác vào bước ② —
                      * **phân bổ hết dòng thì tự chuyển bước** — và đường đó không sinh gì.
                      *
                      * Nay hồ sơ do `luuDeXuatNCCChoDeNghi` tự lập khi nhân viên lưu đề xuất. Từ
                      * lúc Ban lãnh đạo chốt *"chỉ đính kèm file và trưởng bộ phận chọn duyệt
                      * thôi"*, việc bắt người dùng tự đi "lập bảng báo giá" từ menu ⋯ đã hết lý do
                      * tồn tại — bảng đó nay chỉ là **hồ sơ xét duyệt** (giữ đề xuất, lý do duyệt,
                      * các lần bị trả lại), không còn bảng so sánh giá nào.
                      *
                      * 🔴 Đòi `quyen.lapPO`: người chỉ được xem không đề xuất, không trình.
                      */}
                    {/**
                      * 🔴 ĐÃ BỎ KHỐI NHÂN VIÊN TỰ ĐỀ XUẤT NHÀ CUNG CẤP (20/08/2026 — Ban lãnh đạo
                      * khoanh đỏ hai ô *"Đề xuất chọn nhà cung cấp nào?"* và *"Dẫn chứng cụ thể"*,
                      * ghi **"bỏ mục này"**).
                      *
                      * Vì sao hợp lý: tên nhà cung cấp nay ghi **ngay cạnh từng ô đính kèm** ở khu
                      * báo giá phía dưới, nên ô đề xuất là chỗ thứ hai hỏi cùng một thứ. Và theo
                      * chỉ đạo *"trưởng bộ phận chọn duyệt"*, người quyết chọn nhà cung cấp là
                      * trưởng bộ phận ở bước ③ — không phải nhân viên đề xuất trước.
                      *
                      * 👉 Nhân viên ở bước ② chỉ còn làm ĐÚNG MỘT việc: đính kèm đủ bản báo giá
                      * rồi bấm trình. Điều kiện chặn vẫn nguyên: đủ số bản mới trình được.
                      */}
                    {/**
                      * 🔴🔴 BỎ QUA BẢNG ĐÃ HỦY — SỬA LỖI MẤT NÚT SAU KHI LÙI BƯỚC (23/08/2026).
                      *
                      * Ban lãnh đạo: *"lỗi khi lùi bước, bị mất chức năng trình duyệt báo giá đính
                      * kèm lại"*, ảnh cho thấy bước ② có đủ 3 tệp, dòng chữ *"Đã đủ 2 bản báo giá
                      * theo yêu cầu — trình xét duyệt được"* vẫn hiện, mà **không có nút nào để
                      * trình**.
                      *
                      * NGUYÊN NHÂN: lùi bước làm `luiVeBuoc` HỦY hồ sơ báo giá cũ (BG-004 →
                      * `huy`) rồi lập hồ sơ mới (BG-005 → `dang_thu_thap`). Điều kiện cũ viết
                      * `!baoGiaLienQuan.some(bg => bg.trangThai !== "dang_thu_thap")` — tức "không
                      * có bảng nào khác `dang_thu_thap`". Bảng đã HỦY cũng khác `dang_thu_thap`,
                      * nên điều kiện thành sai và **nút không được vẽ ra**. Càng lùi nhiều lần
                      * càng chắc chắn kẹt, vì mỗi lần lùi để lại thêm một bảng hủy.
                      *
                      * 🔴 KHÔNG PHẢI LỖI HIỂN THỊ: hồ sơ kẹt hẳn ở bước ②, không đường nào trình
                      * lại, và app không nói một câu nào về lý do.
                      *
                      * 📌 Ý NGHĨA GỐC của điều kiện vẫn giữ: chỉ cho trình khi **mọi hồ sơ CÒN
                      * SỐNG** đều đang thu thập (chưa trình, chưa duyệt). Bảng đã hủy không còn là
                      * hồ sơ sống nên không được có tiếng nói ở đây.
                      *
                      * ⚠️ Ở file này còn nhiều chỗ khác dùng `baoGiaLienQuan` — chúng lọc theo
                      * trạng thái CỤ THỂ (`da_chon_ncc`, `da_so_sanh`) nên bảng hủy tự loại. Chỉ
                      * phép so "khác `dang_thu_thap`" mới dính bẫy này.
                      */}
                    {quyen.lapPO &&
                      !baoGiaLienQuan
                        .filter((bg) => bg.trangThai !== "huy")
                        .some((bg) => bg.trangThai !== "dang_thu_thap") &&
                      (() => {
                        const vuongMac = vuongMacTrinhXetDuyet(dn, cauHinh);
                        return (
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Nút khóa KÈM LÝ DO, không khóa im lặng — nút mờ mà không nói còn
                                thiếu gì là kiểu bí việc khó chịu nhất. */}
                            <Button
                              size="sm"
                              disabled={vuongMac !== null}
                              title={vuongMac ?? undefined}
                              onClick={() => setHoiTrinhXetDuyet(dn.id)}
                            >
                              <Send className="size-4" aria-hidden />
                              Trình xét duyệt báo giá
                            </Button>
                            {vuongMac !== null && (
                              <span className="text-xs text-warning-soft">{vuongMac}</span>
                            )}
                          </div>
                        );
                      })()}
                  </section>
                ),
                /**
                 * ★ BƯỚC ② CÓ KHU ĐÍNH KÈM TRỞ LẠI — Ban lãnh đạo 19/08/2026: *"Nhân viên gửi
                 * đính kèm file báo giá và ghi rõ thông tin đề xuất báo giá chọn → bấm trình xét
                 * duyệt"*, và hỏi lại *"nút để đính kèm tài liệu vào đâu"*.
                 *
                 * ⚠️ ĐÂY LÀ ĐẢO LẠI CHỈ ĐẠO 17/08/2026 (*"bước này không cần thêm chức năng đính
                 * kèm file"*) — ghi rõ ra đây để người sau không tưởng tôi bỏ sót rồi lại gỡ đi.
                 * Chỉ đạo 19/08 mới hơn và nói cụ thể việc nhân viên phải làm ở bước này, nên
                 * theo chỉ đạo mới.
                 *
                 * 🔴 LO NGẠI CŨ VẪN CÒN GIÁ TRỊ, và đây là cách nó được xử lý: hồi 17/08 tôi bỏ
                 * khu này vì sợ *"cùng một bản báo giá nằm hai chỗ, sau này không ai biết bản nào
                 * là bản đã xét duyệt"*. Ranh giới nay rõ hơn:
                 *   · Khu ở ĐÂY = **bản báo giá thô nhà cung cấp gửi về** (ảnh Zalo, PDF, email),
                 *     nhân viên thu được bao nhiêu thì dán vào bấy nhiêu.
                 *   · `tepBaoGia` TRONG bảng báo giá = bản gắn với **đúng một nhà cung cấp** đã
                 *     được nhập giá vào bảng so sánh.
                 *   · `tepChonNCC` ở bước ③ = **dẫn chứng cho quyết định duyệt**.
                 * Ba thứ khác nhau về vai trò, không phải ba bản sao của một thứ.
                 *
                 * 📌 Tệp đính vào đây trước 17/08 vẫn còn nguyên trong
                 * `deNghi.tepGiaiDoan.yeu_cau_bao_gia` — gỡ giao diện hồi đó KHÔNG xóa dữ liệu,
                 * nên trả prop về là chúng hiện lại đủ.
                 */
                /**
                 * 🔴 SỐ Ô ĐÍNH KÈM BẰNG ĐÚNG SL BÁO GIÁ — Ban lãnh đạo 20/08/2026: *"khi yêu cầu
                 * 2 báo giá thì phải có 2 mục đính kèm báo giá, và đó là quy tắc bắt buộc để được
                 * chuyển bước"*.
                 *
                 * ⚠️ THAY `KhuDinhKemGiaiDoan` (danh sách tệp không tên) bằng `KhuBaoGiaTheoSoLuong`
                 * (N ô có tên). Lý do: danh sách không tên KHÔNG đếm được *"đã có mấy bản báo giá"*
                 * — dán 3 ảnh của cùng một nhà cung cấp cũng ra 3 tệp, mà thực chất vẫn một bản.
                 * Không đếm được thì không chặn chuyển bước được, tức không làm nổi cái luật vừa
                 * được chốt.
                 *
                 * 📌 Tệp đã đính trước đây vẫn còn nguyên trong `tepGiaiDoan.yeu_cau_bao_gia`;
                 * chúng không mang nhãn ô nào nên hiện ở mục "Tệp khác của bước này" — không tệp
                 * nào biến mất.
                 */
                khuDinhKem: (
                  <KhuBaoGiaTheoSoLuong
                    deNghi={dn}
                    duocSua={duocSuaTepBuoc}
                    /**
                     * 🔴 KHÓA SAU KHI DUYỆT — Ban lãnh đạo 20/08/2026: *"khi đã duyệt thì khoá
                     * chức năng thay đổi báo giá và xoá sửa. Chỉ có cấp trưởng phòng và quản trị
                     * được mở lại"*.
                     *
                     * Vì sao cần: bản báo giá là căn cứ của quyết định duyệt. Sửa hay bỏ nó sau
                     * khi đã duyệt là làm hồ sơ không còn khớp với thứ trưởng bộ phận đã ký —
                     * người kiểm tra sau không đối chiếu được.
                     *
                     * 📌 Mở khóa chỉ có tác dụng TRONG PHIÊN đang mở (state, không ghi vào hồ
                     * sơ): người mở sửa xong rời trang là khóa lại, không để hồ sơ ở trạng thái
                     * "đang mở" vô thời hạn mà không ai biết.
                     */
                    khoa={hoSoDaDong || (daDuyetBaoGia && !moKhoaBaoGia)}
                    lyDoKhoa={
                      hoSoDaDong || !daDuyetBaoGia
                        ? undefined
                        : moKhoaBaoGia
                          ? "Đang mở khóa: THAY tệp được, BỎ tệp thì không — hồ sơ đã duyệt nên không được để trống chỗ nào. Thay xong nhớ kiểm lại quyết định duyệt còn đúng không."
                          : "Đã duyệt nên bản báo giá bị khóa: không thay, không bỏ tệp. Xem và tải về vẫn được. Cần bỏ hẳn thì bấm “Không duyệt” ở bước Xét duyệt báo giá để trả hồ sơ về bước trước."
                    }
                    onMoKhoa={
                      daDuyetBaoGia && !moKhoaBaoGia && quyen.xacNhanTruongBP && !hoSoDaDong
                        ? () => setMoKhoaBaoGia(true)
                        : undefined
                    }
                    /**
                     * 🔴 ĐÃ DUYỆT THÌ KHÔNG BỎ TỆP, KỂ CẢ ĐÃ MỞ KHÓA — Ban lãnh đạo hỏi lại
                     * *"sao vẫn xoá được"* (20/08/2026).
                     *
                     * Mở khóa nay chỉ cho **thay tệp** (hồ sơ vẫn có chứng từ, chỉ là bản khác).
                     * Bỏ tệp thì không: bỏ là hồ sơ trống chỗ đó trong khi quyết định duyệt vẫn
                     * còn — người kiểm tra sau không đối chiếu được, và không có cách nào biết
                     * trước kia có gì.
                     *
                     * 👉 Thật sự cần bỏ thì bấm "Không duyệt" ở bước ③ để trả hồ sơ về bước ②;
                     * lúc đó quyết định duyệt bị hủy theo, nên không bao giờ có hồ sơ "đã duyệt
                     * mà thiếu chứng từ".
                     */
                    chanXoaTep={daDuyetBaoGia}
                    /**
                     * ★★ NÚT "DUYỆT BẢN NÀY" ĐÃ DỜI KHỎI ĐÂY — Sếp chốt 17/09/2026.
                     *
                     * Nút nay nằm trong khối KẾT QUẢ *"Xét duyệt phương án giá"* của bước ③, ngay
                     * cạnh danh sách các bản báo giá. Xem khối chú thích lớn ở đó để biết đủ lý do.
                     *
                     * 🔴 ĐỪNG TRUYỀN LẠI `onDuyetO` Ở ĐÂY. Sếp chụp được cảnh Trưởng bộ phận đứng ở
                     * bước ③ mà khối ② đang gập: không thấy bản báo giá nào, cũng không thấy nút
                     * duyệt. Trả nút về đây là dựng lại đúng bế tắc đó — hoặc tệ hơn, để cả hai nơi
                     * cùng có nút, tức hai chỗ làm một việc.
                     *
                     * 📌 LỊCH SỬ ĐỦ BA MỐC, để người sau không tưởng ai tự ý đổi:
                     *   · 20/08/2026 Ban lãnh đạo: *"bố cục thêm nút Duyệt"* → nút sinh ra ở đây.
                     *   · 13/09/2026 Ban lãnh đạo: *"Đã duyệt ở mục này"* (chỉ vào nút này) và
                     *     *"Mục này bỏ"* (chỉ vào cặp nút bước ③) → giữ nút ở đây, bỏ ở bước ③.
                     *   · 17/09/2026 Sếp xem demo so ba trạng thái và **chốt ngược lại**.
                     */
                    /* Tên nhà cung cấp cho từng ô báo giá (Ban lãnh đạo 20/08/2026) — gác
                       `xemNhaCungCap` như mọi chỗ hiện tên NCC. Gõ tự do, KHÔNG truyền danh mục
                       gợi ý (chỉ đạo 20/08/2026: *"bỏ danh mục gợi ý NCC đi"*). */
                    hienTenNCC={quyen.xemNhaCungCap}
                  />
                ),
              },
              {
                ma: "xet_duyet_bao_gia",
                nhan: NHAN_GIAI_DOAN.xet_duyet_bao_gia.nhan,
                dangODay: giaiDoan === "xet_duyet_bao_gia",
                conThieu: conThieuCuaBuoc("xet_duyet_bao_gia"),
                /**
                 * ★ ĐẦU VÀO CỦA BƯỚC ③ = BẢN BÁO GIÁ ĐƯỢC CHỌN — Ban lãnh đạo 20/08/2026:
                 * *"hãy tạo đường link tới báo giá được chọn"*.
                 *
                 * Trước đó khối này ghi *"Giai đoạn này chưa có dữ liệu nhập vào"*, trong khi đầu
                 * vào thật của bước xét duyệt chính là bản báo giá mà trưởng bộ phận chọn. Người
                 * đọc hồ sơ (kể cả Ban Giám đốc) phải mở lại bước ② rồi tự đoán bản nào — mà sau
                 * khi duyệt thì căn cứ chỉ còn là dòng chữ `[Báo giá NCC 2]` trong phần giải trình.
                 *
                 * Nay hiện thẳng **tệp của bản được chọn**, xem và tải về được ngay tại bước ③.
                 *
                 * ⚠️ `tepBaoGiaDaDuyet` trả `undefined` với hồ sơ duyệt TRƯỚC 20/08/2026 (căn cứ
                 * duyệt hồi đó không ghi kèm số hiệu ô) — khi đó vẫn giữ dòng cũ, không bịa ra
                 * một bản nào.
                 */
                truong: baoGiaLienQuan.flatMap((bg) => {
                  const daChon = tepBaoGiaDaDuyet(dn, bg.lyDoChonNCC);
                  return [
                    ...(daChon
                      ? [
                          {
                            nhan: `Bản báo giá được chọn — ${daChon.nhanO}`,
                            tep: [daChon.tep],
                          },
                        ]
                      : []),
                    /* Bảng so sánh cũng là căn cứ trưởng bộ phận đọc để quyết — đưa luôn vào đây
                       thay vì buộc mở lại bước ②. */
                    ...(tepSoSanh(dn) ? [{ nhan: NHAN_O_SO_SANH, tep: [tepSoSanh(dn)!] }] : []),
                    ...((bg.tepBaoGia ?? []).length > 0
                      ? [{ nhan: `Tệp gắn trong hồ sơ ${bg.code}`, tep: bg.tepBaoGia }]
                      : []),
                  ];
                }),
                /**
                 * ★ KHỐI XÉT DUYỆT — Ban lãnh đạo 19/08/2026: *"chưa có chức năng duyệt báo
                 * giá"*, kèm ảnh khối này trống trơn.
                 *
                 * 🔴 LUẬT DUYỆT VỐN ĐÃ CÓ VÀ ĐANG CHẠY, thứ thiếu là ĐƯỜNG VÀO. Việc duyệt nằm
                 * ở màn bảng báo giá (`bao-gia-chi-tiet.tsx`): nút chốt nhà cung cấp chỉ hiện
                 * với người có `xacNhanTruongBP`, và hộp xác nhận **khóa nút Đồng ý cho tới khi
                 * ghi xong giải trình**. Chưa chốt thì `vuongMacLapDonHang` chặn lập đơn.
                 *
                 * Nhưng đứng ở trang đề nghị thì khối này chỉ ghi "chưa có dữ liệu nhập vào" —
                 * không biết đang chờ ai, không biết đã duyệt chưa, không có đường sang chỗ
                 * duyệt. Người dùng kết luận "chức năng chưa có" là hoàn toàn hợp lý.
                 *
                 * 📌 Ban lãnh đạo 19/08/2026 chốt thêm: **trưởng bộ phận duyệt và giải trình với
                 * Ban lãnh đạo**. Nên khối này hiện luôn NỘI DUNG GIẢI TRÌNH ngay tại hồ sơ —
                 * Ban Giám đốc xem được mọi hồ sơ, đọc thẳng ở đây, không phải đi tìm sang màn
                 * bảng báo giá.
                 *
                 * 🔴 GÁC QUYỀN XEM NHÀ CUNG CẤP. Khối bước hiện cho cả vai trò KHÔNG được thấy
                 * NCC (Phòng Thi công). Cùng lý do đã ghi ở khối Lịch sử: đừng để tên nhà cung
                 * cấp rò ra qua một khối phụ.
                 */
                noiDungNghiepVu: duocXemBaoGiaCuaDeNghi(dn, nguoiDung.uid, quyen) &&
                  /* 🔴 KHÔNG ĐỂ LẠI CÁI TIÊU ĐỀ TRƠ. Mọi bảng đều đã duyệt xong và không còn gì để
                     hiện thì giữ `<section>` lại là màn hình còn đúng dòng chữ "XÉT DUYỆT PHƯƠNG ÁN
                     GIÁ" rồi hết — trông như app vừa mất nội dung, tức chỉ đổi cái Sếp bảo bỏ sang
                     một hình khó chịu hơn.
                     📌 VẪN HIỆN KHI CHƯA CÓ BẢNG NÀO: câu bên trong lúc đó nói rõ bước này chưa tới
                     lượt và bảng được lập ở bước ② — đó là thông tin, không phải khung rỗng. */
                  (baoGiaLienQuan.length === 0 ||
                    baoGiaLienQuan.some((bg) => conHienTheXetDuyet(bg, quyen))) && (
                  <section className="flex flex-col gap-(--hp-md-row-gap)">
                    <NhanPhanTrongGiaiDoan the="h2" icon={ClipboardCheck}>
                      Xét duyệt phương án giá
                    </NhanPhanTrongGiaiDoan>

                    {/* Chưa có bảng thì nói rõ đang chờ bước nào, thay vì ẩn cả cụm — người đọc
                        hồ sơ cần biết bước này chưa tới lượt, không phải app thiếu chức năng. */}
                    {baoGiaLienQuan.length === 0 && (
                      <p className="text-sm text-text-secondary">
                        Chưa có bảng báo giá nào để duyệt. Bảng được lập và nhập giá ở bước{" "}
                        <strong>{NHAN_GIAI_DOAN.yeu_cau_bao_gia.nhan}</strong>, nhân viên trình lên
                        thì mới có việc duyệt ở đây.
                      </p>
                    )}

                    {baoGiaLienQuan.map((bg) => {
                      const daDuyet = bg.trangThai === "da_chon_ncc";
                      /* ★★ Duyệt xong thì thẻ này rỗng nghĩa — Sếp 15/09/2026: *"bỏ ghi chú này,
                         không cần thiết"*. Lý do đầy đủ ở `conHienTheXetDuyet`, đầu tệp này. */
                      if (!conHienTheXetDuyet(bg, quyen)) return null;
                      return (
                        <Card key={bg.id}>
                          <CardContent className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-medium text-text-primary">
                                {bg.code}
                              </span>
                              {/* Trạng thái có CẢ MÀU LẪN CHỮ — Design System V1.1. */}
                              <Badge
                                className={
                                  daDuyet
                                    ? "border-transparent bg-success-bg text-success-soft"
                                    : "border-transparent bg-warning-bg text-warning-soft"
                                }
                              >
                                {daDuyet ? "Đã duyệt" : "Chờ Trưởng bộ phận duyệt"}
                              </Badge>
                            </div>

                            {daDuyet ? (
                              <>
                                {/* ❌ ĐÃ BỎ KHỐI "Giải trình của Trưởng bộ phận" — Ban lãnh đạo
                                    13/09/2026 khoanh đúng ô chữ này trong khối "Xét duyệt phương
                                    án giá" và yêu cầu bỏ. Cùng lần đó bỏ luôn câu thay thế
                                    *"Bảng này được duyệt trước khi app bắt ghi giải trình…"* —
                                    giữ lại là vẫn còn một dòng nói về giải trình, đúng thứ Sếp
                                    muốn dọn khỏi màn hình.

                                    🔴 CHỈ BỎ PHẦN HIỂN THỊ. DỮ LIỆU GIỮ NGUYÊN, KHÔNG ĐƯỢC DỌN.
                                    Trường `bg.lyDoChonNCC` vẫn được ghi khi duyệt
                                    (`chonNCCChoBaoGia` trong `3-du-lieu/kho-du-lieu.tsx`) và vẫn
                                    được đọc ở HAI chỗ để tra ra BẢN BÁO GIÁ NÀO ĐÃ ĐƯỢC DUYỆT:
                                      · `tepBaoGiaDaDuyet(dn, bg.lyDoChonNCC)` ở ngay phía trên
                                        (đầu vào bước ③ — dòng "Bản báo giá được chọn"). Hàm này
                                        đọc dấu `[Báo giá NCC n]` mà hộp duyệt ghép vào đầu căn
                                        cứ duyệt, chứ không đọc nghĩa của câu chữ;
                                      · `2-quy-trinh/bo-ho-so-thanh-toan.ts` khi gom bộ hồ sơ
                                        thanh toán.
                                    Vì vậy tuyệt đối không đụng vào `2-quy-trinh/bao-gia-dinh-kem.ts`
                                    (`tepBaoGiaDaDuyet`): dọn "cho sạch" ở đó là app mất đường tra
                                    bản báo giá được duyệt, mà không có lỗi nào báo.

                                    ⚠️ CÁI GIÁ CỦA VIỆC BỎ — đã grep toàn dự án ngày 13/09/2026:
                                    ĐÂY LÀ CHỖ DUY NHẤT app hiện nội dung căn cứ / giải trình cho
                                    người đọc. Nhật ký hồ sơ cố ý không chép lại (`ghiLichSuDeNghi`
                                    chỉ ghi *"Chốt nhà cung cấp cho bảng báo giá …"* để không rò
                                    tên NCC sang vai trò không được xem).

                                    ✅ ĐÃ CHỐT XONG, KHÔNG CÒN TREO (13/09/2026): sau khi bỏ khối
                                    hiển thị này, ô nhập "Căn cứ duyệt" trong hộp xác nhận thành
                                    chỗ gõ vào rồi không ai đọc được — đúng kiểu "giao diện hứa một
                                    việc app không làm" mà CLAUDE.md §3.5 cấm. Đã báo Sếp và Sếp
                                    chốt: **BỎ LUÔN Ô NHẬP** (chứ không mở lại chỗ đọc). Ô đó nay
                                    chỉ còn hiện ở chiều "Không đồng ý" — xem chú thích tại hộp
                                    thoại duyệt, cuối tệp này.

                                    👉 Vì vậy đừng khôi phục khối hiển thị này "cho cân": cả hai
                                    nửa đều đã được Sếp cho bỏ trong cùng một ngày, có chủ đích. */}
                                {quyen.xemNhaCungCap && bg.nccDaChonTen && (
                                  <p className="text-sm text-text-secondary">
                                    Nhà cung cấp được duyệt:{" "}
                                    <strong className="text-text-primary">
                                      {bg.nccDaChonTen}
                                    </strong>
                                  </p>
                                )}
                              </>
                            ) : (
                              /* ❌ ĐÃ BỎ câu *"Bảng đã so sánh xong, đang chờ Trưởng bộ phận Thu mua
                                 duyệt phương án và ghi giải trình."* — Sếp 15/09/2026: *"Bỏ dòng ghi
                                 chú này"*.

                                 🔴 VÌ SAO BỎ ĐƯỢC MÀ KHÔNG MẤT THÔNG TIN: câu đó chỉ đọc lại thứ
                                 người dùng đã thấy — huy hiệu trạng thái **"Chờ Trưởng bộ phận
                                 duyệt"** nằm ngay cùng dòng với mã bảng, ngay phía trên.

                                 ✅ GIỮ LẠI câu sau, vì nó nói một điều KHÔNG hiện ở đâu khác: chưa
                                 duyệt thì bước ④ bị chặn. Đó là hệ quả, không phải trạng thái. */
                              <p className="text-sm text-text-secondary">
                                <strong>Chưa duyệt thì chưa lập được đơn mua hàng.</strong>
                              </p>
                            )}

                            {/* 🔴 NÚT DẪN SANG CHỖ DUYỆT — chính là thứ đang thiếu.
                                Chữ trên nút đổi theo vai trò: người duyệt được thì mời họ duyệt,
                                người khác thì nói rõ là chỉ xem. Bày nút "Duyệt" cho người không
                                duyệt được là hứa một việc họ bấm vào sẽ không làm được. */}
                            {/**
                             * 🔴 DUYỆT / KHÔNG DUYỆT NGAY TẠI ĐÂY — bắt buộc phải có từ 19/08/2026.
                             *
                             * Ban lãnh đạo chốt *"chưa cần chức năng nhập số liệu NCC, chỉ cần đính
                             * kèm file báo giá"*. Hệ quả: bảng báo giá KHÔNG có cột giá nào, mà nút
                             * chốt nhà cung cấp ở màn bảng so sánh lại nằm **trên đầu từng cột NCC**
                             * — không có cột thì không có nút, và **luồng tắc hẳn ở bước ③**.
                             *
                             * Vì vậy trưởng bộ phận duyệt ngay trong khối này, theo **đề xuất của
                             * nhân viên**: đó chính là thứ họ cần xét (tên nhà cung cấp + dẫn chứng),
                             * còn bản báo giá thì nằm trong tệp đính kèm của bước ②.
                             *
                             * ⚠️ Chưa có đề xuất thì KHÔNG cho duyệt — duyệt mà không biết duyệt cho
                             * nhà cung cấp nào thì đơn hàng sau đó không có đối tượng.
                             */}
                            {/**
                              * ★ TRƯỞNG BỘ PHẬN CHỌN NHÀ CUNG CẤP RỒI DUYỆT — Ban lãnh đạo
                              * 20/08/2026: *"chỉ đính kèm file và trưởng bộ phận chọn duyệt thôi"*,
                              * và bỏ khối nhân viên tự đề xuất.
                              *
                              * 🔴 Danh sách chọn LẤY TỪ TÊN GHI Ở TỪNG Ô ĐÍNH KÈM bước ② (hàm
                              * `danhSachNCCDaBaoGia`), không phải từ danh mục nhà cung cấp: người
                              * duyệt chỉ được chọn giữa những bên **đã thật sự gửi báo giá** cho
                              * phiếu này. Cho chọn ngoài danh sách đó là duyệt cho một bên không
                              * có bản báo giá nào trong hồ sơ.
                              */}
                            {/* 🔴🔴 CHỈ CÒN HIỆN KHI NÚT TẮT KHÔNG DÙNG ĐƯỢC — Ban lãnh đạo
                                13/09/2026: *"Đã duyệt ở mục này"* (chỉ vào nút "Duyệt bản này" ở
                                bước ②) và *"Mục này bỏ"* (chỉ vào cặp nút Duyệt / Không duyệt ở đây).

                                📌 Ý Sếp ĐÚNG cho ca thường: hai nút gọi CÙNG một `setHoiDuyet`, mở
                                CÙNG một hộp thoại, và hộp đó gọi `chonNCCChoBaoGia` tại đúng MỘT
                                dòng (xem `onDongY` của hộp duyệt) — không rẽ nhánh theo đường vào.
                                Nên khi có đúng 1 hồ sơ chờ duyệt, cặp nút này là thừa thật.
                                Nút tắt còn MẠNH HƠN: nó truyền `nhanO` nên căn cứ duyệt ghi kèm
                                `[Báo giá NCC n]` — thứ tạo ra đường link "Bản báo giá được chọn".

                                🔴 NHƯNG KHÔNG BỎ HẲN, vì nút tắt TỰ KHÓA khi có từ 2 hồ sơ chờ
                                duyệt trở lên (điều kiện `.length === 1` ở bước ②). Lý do khóa đã
                                ghi ở đó: ô "Báo giá NCC n" gắn với ĐỀ NGHỊ chứ không gắn với từng
                                bảng, nên có 2 bảng thì không biết ô thuộc bảng nào — bấm nút tắt sẽ
                                ghi quyết định vào NHẦM hồ sơ mà không có gì báo.
                                Bỏ hẳn cặp nút này là ca ≥2 bảng MẤT HẲN đường duyệt, hồ sơ kẹt
                                vĩnh viễn ở bước ③ — đúng lỗi mồ côi CLAUDE.md §3.4b cấm.

                                👉 Nên: đúng 1 hồ sơ → ẩn cặp nút (dùng nút tắt).
                                   Từ 2 hồ sơ → hiện lại, vì lúc đó nút tắt không hiện.

                                ⚠️ CHỈ BỎ CẶP NÚT, TUYỆT ĐỐI KHÔNG XÓA CẢ KHỐI. Khối "Xét duyệt
                                phương án giá" còn là nơi hiển thị DUY NHẤT của: badge trạng thái ·
                                tên NCC được duyệt · toàn bộ lịch sử "Trưởng bộ phận đã trả lại"
                                (`lanTraLai`). Màn `bao-gia-chi-tiet.tsx` từng hiện chúng ĐÃ BỊ XÓA,
                                nên mất ở đây là mất khỏi app.

                                📌 SỬA DANH SÁCH TRÊN NGÀY 13/09/2026: trước đây dòng này còn kể cả
                                *"Giải trình của Trưởng bộ phận" (chốt 19/08/2026)*. Ban lãnh đạo đã
                                cho bỏ phần hiển thị đó (xem chú thích tại chỗ bỏ, phía trên trong
                                cùng khối này). Phải sửa danh sách cho khớp thực tế, nếu không phiên
                                sau đọc thấy "hiển thị duy nhất" rồi đi khôi phục lại đúng cái Sếp
                                vừa yêu cầu bỏ.

                                🔴🔴 SỬA 14/09/2026 — CÂU DƯỚI ĐÂY TỪNG ĐÚNG, NAY KHÔNG CÒN ĐÚNG:
                                *"Không duyệt KHÔNG mồ côi: hộp thoại chung có ô sổ xuống Quyết định
                                của trưởng bộ phận…"*. Sếp đã cho **bỏ ô sổ xuống đó** (*"Bỏ nội
                                dung này, không cần thiết"*). Nếu vẫn ẩn cặp nút khi có đúng 1 bảng
                                thì hồ sơ đó KHÔNG CÒN ĐƯỜNG NÀO để trả lại — mà đây là đường lùi
                                DUY NHẤT còn sống của cả quy trình (mọi bước khác bị chặn cứng từ
                                26/08/2026).

                                ✅ CÁCH XỬ: **luôn hiện nút "Không duyệt"**; còn nút "Duyệt" thì vẫn
                                ẩn khi có đúng 1 bảng, vì lúc đó nút tắt "Duyệt bản này" trên ô báo
                                giá đã làm việc đó — giữ nguyên chủ ý ban đầu là không bày hai nút
                                Duyệt cạnh nhau.
                                👉 Đây và việc bỏ ô sổ xuống là MỘT VIỆC. Hoàn tác một nửa là mất
                                đường lùi. */}
                            {quyen.xacNhanTruongBP &&
                              !daDuyet &&
                              !hoSoDaDong && (() => {
                              /* 🔴 CỜ `anNutDuyet` ĐÃ BỎ 17/09/2026 cùng lần dời nút duyệt về đây.
                                 Nó từng đếm "đúng 1 bảng đã trình" để ẩn nút Duyệt, vì lúc đó nút
                                 thật nằm trên ô báo giá của bước ②. Nay nút nằm ngay dưới, gắn đúng
                                 `bg.id` của khối này, nên phép đếm đó không còn nghĩa gì — và giữ
                                 lại là một điều kiện chết mà người sau phải đoán. */
                              /**
                               * ★ TRƯỞNG BỘ PHẬN GÕ TÊN NHÀ CUNG CẤP KHI DUYỆT — Ban lãnh đạo
                               * 20/08/2026, sau khi bỏ ô ghi tên ở bước ②
                               * (*"bỏ mục này và kéo dài thanh đính kèm qua"*).
                               *
                               * 🔴 GÕ TỰ DO, KHÔNG CHỌN TỪ DANH SÁCH. Bản trước liệt kê các nhà
                               * cung cấp lấy từ tên ghi ở từng ô đính kèm — nay bước ② không thu
                               * tên nữa nên danh sách đó **luôn rỗng**, và nút Duyệt sẽ khóa vĩnh
                               * viễn. Đây là chỗ duy nhất còn thu tên, nên nó phải nhập được.
                               *
                               * 📌 Hồ sơ cũ có tên ghi ở ô báo giá thì điền sẵn vào đây, đỡ phải
                               * gõ lại — nhưng vẫn sửa được, vì người quyết là trưởng bộ phận.
                               */
                              /**
                               * ❌ ĐÃ BỎ Ô "Duyệt cho nhà cung cấp nào?" VÀ CHỐT KHÓA NÚT THEO NÓ
                               * (Ban lãnh đạo 23/08/2026 — xem chú thích đầy đủ ở hộp thoại duyệt).
                               *
                               * Duyệt là chốt BẢN BÁO GIÁ; tên bên bán được gõ ở bước ④ khi lập
                               * đơn mua hàng. Vì vậy cặp nút dưới đây không còn điều kiện nào.
                               *
                               * 📌 Vẫn điền hộ tên nếu tra ra được từ ô báo giá của hồ sơ cũ — có
                               * thì `chonNCCChoBaoGia` ghi lại, không có thì bỏ trống, không chặn.
                               */
                              const goiY = danhSachNCCDaBaoGia(dn)[0]?.tenNCC ?? "";
                              return (
                                <div className="flex flex-col gap-3">
                                  {/**
                                    * ★★ BÀY CÁC BẢN BÁO GIÁ NGAY TẠI CHỖ QUYẾT + NÚT DUYỆT TỪNG
                                    * BẢN — Sếp 17/09/2026, sau khi xem demo so ba trạng thái.
                                    *
                                    * 🔴 SẾP CHỤP ĐƯỢC ĐÚNG BẾ TẮC: khối bước ② gập lại (mặc định,
                                    * và F5 là gập hết theo luật 18/08/2026) thì Trưởng bộ phận
                                    * đứng ở đây **vừa không thấy bản báo giá nào, vừa không thấy
                                    * nút Duyệt** — vì từ 13/09/2026 nút duyệt đã dời sang ô báo giá
                                    * của bước ②. Nguyên văn Sếp: *"nếu như group bước yêu cầu NCC
                                    * báo giá thì TP ko biết duyệt báo giá nào"*.
                                    *
                                    * 🔴 ĐẢO CHỈ ĐẠO 13/09/2026, CÓ SẾP CHỐT LẠI 17/09/2026. Hôm
                                    * 13/09 Ban lãnh đạo chỉ vào nút ở bước ② (*"Đã duyệt ở mục
                                    * này"*) và bảo bỏ cặp nút ở bước ③ (*"Mục này bỏ"*). Nay Sếp
                                    * xem demo và chọn ngược lại. **Ghi cả hai mốc để người sau
                                    * không tưởng ai đó tự ý đổi.**
                                    *
                                    * 🔴 KHÔNG BÀY HAI LẦN: nút ở bước ② đã **bỏ hẳn** cùng lần sửa
                                    * này (`onDuyetO` không còn được truyền). Giữ cả hai mới là
                                    * hai chỗ cùng làm một việc — đúng thứ dự án cấm.
                                    *
                                    * ⚠️ PHẢI TRUYỀN `nhanO`, ĐỪNG BỎ CHO GỌN. Đó là thứ `chonNCCChoBaoGia`
                                    * ghi vào căn cứ duyệt, và `tepBaoGiaDaDuyet` đọc lại để dựng
                                    * dòng *"Bản báo giá được chọn"* ở đầu vào bước ③. Bỏ đi là hồ
                                    * sơ duyệt xong không còn biết đã chọn bản nào.
                                    */}
                                  {(() => {
                                    const banBaoGia = tepBaoGiaDaCo(dn);
                                    if (banBaoGia.length === 0) return null;
                                    return (
                                      <div className="flex flex-col gap-2">
                                        <p className="text-xs font-semibold text-text-desc uppercase">
                                          Các bản báo giá đang chờ duyệt
                                        </p>
                                        {banBaoGia.map((t) => {
                                          const nhanO = (t.ghiChu ?? "").trim();
                                          const tenNCC = tenNCCCuaO(t.ghiChu);
                                          return (
                                            <div
                                              key={t.id}
                                              className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted p-(--hp-md-row-pad)"
                                            >
                                              <span className="text-sm font-semibold text-text-primary">
                                                {nhanO || "Bản báo giá"}
                                              </span>
                                              {tenNCC !== "" && quyen.xemNhaCungCap && (
                                                <span className="text-sm text-text-secondary">
                                                  · {tenNCC}
                                                </span>
                                              )}
                                              <span className="ml-auto flex flex-wrap items-center gap-2">
                                                <LienKetTep tep={t} />
                                                <Button
                                                  size="sm"
                                                  onClick={() => {
                                                    /* Điền hộ tên NCC: ưu tiên tên ghi ở chính ô
                                                       vừa bấm, sau đó tới hồ sơ cũ. Tra không ra
                                                       thì để trống, người duyệt gõ trong hộp. */
                                                    const ten = tenNCC !== "" ? tenNCC : goiY;
                                                    if (ten !== "") setNccDuyet(ten);
                                                    setHoiDuyet({
                                                      bgId: bg.id,
                                                      loai: "duyet",
                                                      nhanO: nhanO || undefined,
                                                    });
                                                  }}
                                                >
                                                  <Check className="size-4" aria-hidden />
                                                  Duyệt bản này
                                                </Button>
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  })()}

                                  <div className="flex flex-wrap items-center gap-2">
                                  {/**
                                    * 🔴 NÚT "DUYỆT" TRƠN CHỈ CÒN LÀ ĐƯỜNG LUI CHO HỒ SƠ KHÔNG CÓ
                                    * BẢN NÀO ĐỂ BẤM — ví dụ hồ sơ cũ mà tệp báo giá không mang
                                    * nhãn ô, hoặc quy trình cho bỏ qua báo giá kèm lý do. Bỏ hẳn
                                    * nút này là những hồ sơ đó **không còn đường duyệt nào**, kẹt
                                    * vĩnh viễn ở bước ③.
                                    *
                                    * ⚠️ Duyệt bằng nút này KHÔNG ghi được `nhanO`, nên về sau đầu
                                    * vào bước ③ không dựng được dòng "Bản báo giá được chọn". Chấp
                                    * nhận, vì ca này vốn không có bản nào để chỉ tên.
                                    */}
                                  {tepBaoGiaDaCo(dn).length === 0 && (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        if (nccDuyet === "" && goiY !== "") setNccDuyet(goiY);
                                        setHoiDuyet({ bgId: bg.id, loai: "duyet" });
                                      }}
                                    >
                                      <Check className="size-4" aria-hidden />
                                      Duyệt
                                    </Button>
                                  )}
                                  {/* 🔴 LUÔN HIỆN — đây là đường trả lại DUY NHẤT sau khi bỏ ô sổ
                                      xuống trong hộp duyệt (Sếp 14/09/2026). Đừng gắn điều kiện
                                      nào lên nút này. */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setHoiDuyet({ bgId: bg.id, loai: "khong_duyet" })
                                    }
                                  >
                                    <X className="size-4" aria-hidden />
                                    Không duyệt
                                  </Button>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Đề xuất của nhân viên — thứ trưởng bộ phận cần đọc để quyết.
                                Gác `xemNhaCungCap` như mọi chỗ hiện tên NCC. */}
                            {bg.deXuatNCCTen && !daDuyet && quyen.xemNhaCungCap && (
                              <div className="rounded-lg border border-border bg-muted p-(--hp-md-row-pad)">
                                <p className="text-xs font-semibold text-text-desc uppercase">
                                  Nhân viên đề xuất
                                </p>
                                <p className="mt-1 text-sm text-text-primary">
                                  {bg.deXuatNCCTen}
                                </p>
                                {bg.lyDoDeXuat && (
                                  <p className="mt-1 text-sm text-text-secondary">
                                    {bg.lyDoDeXuat}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* ★ BỊ TRẢ LẠI — DỜI VỀ ĐÂY 20/08/2026 khi bỏ hẳn màn Báo giá.
                                🔴 ĐÂY LÀ NỬA CÒN LẠI CỦA CHỨC NĂNG "KHÔNG DUYỆT". Ghi được lý do
                                mà không hiện ra thì nhân viên chỉ thấy phiếu tự nhảy ngược về
                                bước ② — không biết vì sao, không biết sửa gì, và sẽ trình lại y
                                nguyên. Trước đây khối này nằm ở `bao-gia-chi-tiet.tsx`, là chỗ
                                hiển thị DUY NHẤT; bỏ màn đó mà không dời khối này là làm mất
                                hẳn lý do trả lại khỏi app.
                                📌 Hiện MỌI lượt, mới nhất lên đầu: phiếu đi lại nhiều vòng thì
                                phải đọc được cả quá trình, nếu không lần bác thứ ba vẫn lặp lại
                                đúng cái sai của lần đầu. */}
                            {(bg.lanTraLai ?? []).length > 0 && (
                              <div className="flex flex-col gap-2 rounded-lg border border-danger/40 bg-danger-bg/30 p-(--hp-md-row-pad)">
                                <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                                  <X className="size-4 shrink-0 text-danger-soft" aria-hidden />
                                  Trưởng bộ phận đã trả lại{" "}
                                  {(bg.lanTraLai ?? []).length > 1 &&
                                    `${(bg.lanTraLai ?? []).length} lần`}
                                </span>
                                {[...(bg.lanTraLai ?? [])].reverse().map((l, i) => (
                                  <div
                                    key={i}
                                    className="rounded-lg border border-border bg-card p-(--hp-md-row-pad)"
                                  >
                                    <p className="text-sm text-text-primary">{l.lyDo}</p>
                                    <p className="mt-1 text-xs text-text-desc">
                                      {l.nguoiTuChoiTen} · {formatMocThoiGian(l.thoiDiem)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </section>
                ),
                /* Bước ③ nhận biên bản xét duyệt, tờ trình so sánh giá. Khu này đứng riêng
                   với trường "Báo giá NCC" ở trên: trường đó là tệp gắn TRONG bảng báo giá
                   (chỉ đọc ở đây), còn khu này là chứng từ gắn thẳng vào bước. */
                khuDinhKem: (
                  <KhuDinhKemGiaiDoan
                    deNghi={dn}
                    maGiaiDoan="xet_duyet_bao_gia"
                    duocSua={duocSuaTepBuoc}
                    khoa={hoSoDaDong}
                  />
                ),
              },
              {
                ma: "lap_don_mua_hang",
                nhan: NHAN_GIAI_DOAN.lap_don_mua_hang.nhan,
                dangODay: giaiDoan === "lap_don_mua_hang",
                conThieu: conThieuCuaBuoc("lap_don_mua_hang"),
                truong: baoGiaLienQuan.flatMap((bg) =>
                  (bg.tepChonNCC ?? []).length > 0
                    ? [{ nhan: "Căn cứ chọn nhà cung cấp", tep: bg.tepChonNCC }]
                    : [],
                ),
                /* ĐƠN ĐẶT HÀNG, thuộc bước ④ (chỉ đạo 16/08/2026, xem chú thích đầu khối):
                   đơn được LẬP ở chính bước này, ngay sau khi đã có căn cứ chọn nhà cung cấp
                   nằm phía trên.

                   📌 Tiêu đề gọi thẳng là "Đơn đặt hàng" (Ban lãnh đạo 15/08/2026). Chữ "đã
                   tách" là cách nói của người làm hệ thống — với người dùng thì đây đơn giản
                   là danh sách đơn của đề nghị này, dù tách cho nhiều nhà cung cấp hay chỉ
                   một đơn duy nhất. */
                noiDungNghiepVu: (
                  <section className="flex flex-col gap-(--hp-md-row-gap)">
                    {/* 📌 ĐÃ BỎ NÚT "Lập đơn đặt hàng / Tách thêm đơn" (17/08/2026).

                        Từ nay phần nhập liệu nằm NGAY TRONG khối này — khối "Nhập đơn đặt hàng
                        mới" phía dưới — theo chỉ đạo Ban lãnh đạo *"a cần phần nhập liệu phải
                        nằm trong khối"*. Một cái nút dẫn sang trang khác giờ chỉ là đường vào
                        THỨ HAI tới cùng một việc, mà bấm vào là rời khỏi trang đang làm.

                        🔴 ĐÃ KIỂM `/don-hang/tao-moi` KHÔNG THÀNH MỒ CÔI trước khi bỏ nút (quy
                        ước CLAUDE.md 3.4b — phiên 03 suýt làm module Báo giá thành mồ côi). Hai
                        đường vào còn nguyên:
                          · `trang/bao-gia-chi-tiet.tsx` — nút "Lập đơn" của từng nhà cung cấp
                            trong bảng phân bổ. Đây là đường DUY NHẤT truyền `rfqId` + `nccId`,
                            tức chức năng TÁCH PO theo phân bổ báo giá; khối nhúng ở đây không
                            có hai tham số đó nên không làm được việc ấy.
                          · `2-quy-trinh/giai-doan-mua-hang.ts` → `quyetDinhKeoTha` trả
                            `mo_trang` tới địa chỉ đó khi kéo thẻ từ bước ④ sang ⑤ trên bảng
                            quy trình. */}
                    {/* Cùng kiểu chữ với "ĐẦU VÀO" — xem `NhanPhanTrongGiaiDoan`. */}
                    <NhanPhanTrongGiaiDoan the="h2" icon={Package}>
                      Đơn đặt hàng ({poLienQuan.length})
                    </NhanPhanTrongGiaiDoan>
                    <Card>
                      <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
                        {/* 📌 Ô cảnh báo "Chưa cất được đơn đặt hàng" ĐÃ DỜI vào trong
                            `FormLapDonMuaHang`, đứng ngay trên nút Cất (17/08/2026). Để ở đây
                            thì nó nằm trên danh sách đơn ĐÃ CÓ — nói về một việc khác — và câu
                            cũ *"vào màn lập đơn thì nhập liệu vẫn dùng được"* thành sai văn
                            cảnh khi form đã ở ngay tại chỗ. Một lý do, một chỗ hiện. */}
                        {poLienQuan.length === 0 && (
                          <p className="text-sm text-text-desc">
                            Chưa có đơn đặt hàng nào. Một đề nghị tách được thành nhiều đơn khi
                            chia hàng cho nhiều nhà cung cấp.
                          </p>
                        )}
                        {poLienQuan.map((po) => {
                          const ttPO = nhanAnToan(NHAN_TRANG_THAI_PO, po.trangThai);
                          return (
                            <Link
                              key={po.id}
                              href={`/don-hang/${po.id}`}
                              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-surface p-(--hp-md-row-pad) transition-colors hover:border-primary/40"
                            >
                              <span className="text-sm font-semibold text-text-primary">
                                {po.code}
                              </span>
                              {quyen.xemNguoiPhuTrach && (
                                <span className="text-xs text-text-desc">
                                  {po.nguoiPhuTrachTen}
                                </span>
                              )}
                              {quyen.xemNhaCungCap && (
                                <span className="text-xs text-text-desc">{po.supplierTen}</span>
                              )}
                              <span className="text-xs text-text-desc">
                                {(po.items ?? []).length} dòng · giao dự kiến{" "}
                                {new Date(po.ngayGiaoDuKien).toLocaleDateString("vi-VN")}
                              </span>
                              <StatusBadge
                                label={ttPO.nhan}
                                tone={ttPO.tong}
                                className="ml-auto"
                              />
                            </Link>
                          );
                        })}
                      </CardContent>
                    </Card>

                    {/* ★★ ĐƯỜNG SANG MÀN NHẬP LIỆU — KHÔNG NHÚNG FORM Ở ĐÂY ★★
                        🔴 Ban lãnh đạo 18/08/2026: *"e đưa mục này ra thành 1 mục riêng bên tab
                        trái"*, rồi nói rõ lại: *"sai ý a rồi, a cần e đưa CẢ mục import này ra"*.

                        Tức là **CHUYỂN HẲN**, không phải để hai chỗ. Bản 17/08/2026 nhúng cả
                        form vào đây theo chỉ đạo hôm đó; nay phần nhập liệu về đúng một chỗ là
                        mục menu **"Lập đơn mua hàng (PO)"** → `/don-hang/tao-moi`.

                        📌 Khối này giờ chỉ còn việc của nó: LIỆT KÊ đơn đã có + một đường sang
                        màn nhập. Nhờ vậy khối ④ ngắn lại gần 1.900px.

                        🔴 VÌ SAO VẪN PHẢI CÓ NÚT: bỏ luôn nút thì đứng ở phiếu này không có
                        đường nào sang lập đơn cho CHÍNH nó — phải ra menu rồi tự tìm lại phiếu
                        trong danh sách. Đó là bắt người dùng làm việc của app. Nút mang sẵn
                        `?prId=` nên sang là vào thẳng form của đúng phiếu này, không qua bước
                        chọn.

                        🔴 CHỈ NGƯỜI CÓ QUYỀN THẤY: dùng đúng cờ `quyen.lapPO` — cùng cờ mà
                        `4-phan-quyen/quyen.ts` → `duocVaoDuongDan` gác `/don-hang/tao-moi`.
                        Hồ sơ đã đóng thì không hiện nút.

                        🔴 KHÔNG khóa nút theo `vuongMacLapDonHang` nữa: luật đó chặn lúc CẤT,
                        và ô cảnh báo trong form đã nói rõ còn thiếu gì. Khóa ở đây là dựng lại
                        đúng ngõ cụt đã phải gỡ hôm 17/08 — app bảo "phải lập bảng báo giá" rồi
                        đứng im không cho đường nào đi tiếp. */}
                    {/**
                      * ★★ NÚT LẬP ĐƠN KHÔNG CÒN BỊ ẨN VÌ THIẾU HỢP ĐỒNG — Ban lãnh đạo
                      * 24/08/2026 chuyển hợp đồng sang bước ⑤ *Tiến hành đặt hàng*.
                      *
                      * 🔴 ĐÂY LÀ CHỖ VÒNG TRÒN ĐƯỢC THÁO. Chỉ đạo 23/08 (*"chưa có đính kèm file
                      * hoặc chưa có ghi chú thì nút lập đơn đặt hàng sẽ bị ẩn đi"*) đúng khi hợp
                      * đồng còn là chứng từ của bước ④. Nhưng **hợp đồng mua bán thường ghi số đơn
                      * hàng**, mà số đơn chỉ sinh ra khi cất đơn — nên đòi hợp đồng TRƯỚC khi cho
                      * lập đơn là bắt người dùng làm việc bất khả thi. App chỉ thoát được nhờ đường
                      * "ghi lý do thay cho tệp", tức một lối vòng.
                      *
                      * Nay hợp đồng thuộc bước ⑤ nên thứ tự thành thuận: lập đơn (có số đơn) → ký
                      * hợp đồng theo số đơn đó → đặt hàng. Nút mở lại đúng nghĩa.
                      *
                      * 📌 KHÔNG MẤT CHỐT NÀO: `vuongMacRoiBuocLapDon` vẫn chặn **rời bước ⑤** khi
                      * chưa có tệp lẫn lý do, và thẻ vẫn bị tô đỏ "thiếu HĐ" ở bước ⑤. Nợ chứng từ
                      * đi theo chứng từ, chỉ dời chỗ chứ không biến mất.
                      */}
                    {/* ★★ KHÓA LẠI NÚT KHI CHƯA CÓ HỢP ĐỒNG LẪN LÝ DO — Ban lãnh đạo 13/09/2026:
                        *"mục này phải đính kèm HĐ hoặc ghi thì mới mở nút lập đơn đặt hàng"*.

                        ⚠️ ĐÂY LÀ KHÔI PHỤC MỘT LUẬT ĐÃ TỪNG BỊ GỠ, đọc kỹ trước khi đụng vào:
                        chỉ đạo 23/08/2026 đặt đúng luật này, rồi nó bị gỡ vì một vòng tròn có thật —
                        *"hợp đồng mua bán thường ghi số đơn hàng, mà số đơn chỉ sinh ra khi cất đơn,
                        nên đòi hợp đồng TRƯỚC khi cho lập đơn là bắt người dùng làm việc bất khả thi"*.

                        🔴 VÒNG TRÒN ĐÓ NAY ĐÃ THÁO ĐƯỢC, và chính Ban lãnh đạo tháo trong cùng ngày:
                        ô lý do vừa đổi thành HAI NÚT BẤM MỘT CÁI ("Bổ sung sau" / "Không có HĐ").
                        Trước đây lối thoát là gõ một câu tự nghĩ — đủ phiền để người ta coi như bị
                        chặn cứng. Nay bấm một cái là đi tiếp, nên khóa nút không còn là bẫy.
                        👉 NẾU SAU NÀY AI BỎ HAI NÚT ĐÓ thì PHẢI bỏ luôn khóa này, nếu không vòng
                        tròn quay lại y nguyên.

                        🔴 KHÓA KÈM LÝ DO, KHÔNG ẨN NÚT. Chỉ đạo 23/08 ghi "ẩn đi", nhưng ẩn thì người
                        dùng không biết app có làm được việc đó hay không, và đi tìm vòng quanh. Hiện
                        nút ở trạng thái khóa kèm câu nói rõ thiếu gì là họ gỡ được ngay tại chỗ —
                        cùng nếp với mọi chốt khác trong app.

                        📌 DÙNG `vuongMacRoiBuocLapDon`, TUYỆT ĐỐI KHÔNG dùng `coHopDong`: hàm kia
                        chấp nhận **tệp HOẶC lý do** (đúng ý Sếp "đính kèm HĐ hoặc ghi"), còn
                        `coHopDong` chỉ hỏi có tệp — dùng nhầm là khóa cứng mọi đơn mẫu PO-02. Đây
                        đúng bài học đã ghi ở `xacDinhGiaiDoan` và `vuongMacLapDonHang`. */}
                    {quyen.lapPO &&
                      !hoSoDaDong &&
                      (() => {
                        /**
                         * ★★★ MỘT ĐỀ NGHỊ CHỈ MỘT ĐƠN — Ban lãnh đạo 13/09/2026.
                         *
                         * Sếp khoanh đỏ nút "Tách thêm đơn" và yêu cầu bỏ. Em đã báo trước đây là
                         * LỐI VÀO DUY NHẤT còn lại để lập đơn thứ hai (mục menu "Lập đơn mua hàng
                         * (PO)" đã tắt từ 08/09/2026), và Sếp chốt: **bỏ hẳn, một đề nghị chỉ một
                         * đơn**. Đây là ĐỔI LUẬT NGHIỆP VỤ, không phải dọn giao diện.
                         *
                         * 🔴 HỆ QUẢ ĐÃ BÁO SẾP, ghi lại để phiên sau không tưởng là lỗi: đề nghị
                         * đã có đơn thì phần khối lượng CÒN LẠI không mua tiếp được bằng đường
                         * thường — phải huỷ đơn cũ rồi lập lại cho đủ.
                         *
                         * 📌 KHÔNG XOÁ MÃ, chỉ chặn ở đây. `/don-hang/tao-moi?prId=…` vẫn sống và
                         * vẫn còn hai đường vào khác (nút "Lập đơn" theo từng NCC ở trang báo giá
                         * chi tiết — đường DUY NHẤT truyền `rfqId`+`nccId`; và `quyetDinhKeoTha`
                         * khi kéo thẻ ④→⑤). Muốn bật lại chỉ cần bỏ khối `if` này.
                         *
                         * 🔴 NÓI RÕ LÝ DO, KHÔNG ĐỂ NÚT BIẾN MẤT IM LẶNG. Nút tự dưng không còn
                         * thì người dùng đi tìm vòng quanh rồi tưởng app hỏng — cùng nếp với mọi
                         * chốt khác trong app (xem chú thích "KHÓA KÈM LÝ DO" ngay trên).
                         */
                        if (poLienQuan.length > 0) {
                          return (
                            <p className="text-xs text-text-desc">
                              Đề nghị này đã có đơn mua hàng. Mỗi đề nghị chỉ lập một đơn — cần đổi
                              nội dung thì sửa hoặc huỷ đơn hiện có ở danh sách trên.
                            </p>
                          );
                        }

                        const vuong = vuongMacRoiBuocLapDon(dn);
                        const nhan = "Lập đơn đặt hàng";
                        if (vuong) {
                          return (
                            <div className="flex w-fit flex-col gap-1">
                              <Button variant="outline" className="w-fit" disabled title={vuong}>
                                <ShoppingCart className="size-4" aria-hidden />
                                {nhan}
                              </Button>
                              {/* V1.1 buộc trạng thái phải có cả màu lẫn CHỮ — nút mờ không thôi thì
                                  người dùng không biết thiếu gì mà gỡ. */}
                              <span className="text-xs text-warning-soft">{vuong}</span>
                            </div>
                          );
                        }
                        return (
                          <Button
                            variant="outline"
                            className="w-fit"
                            nativeButton={false}
                            render={<Link href={`/don-hang/tao-moi?prId=${dn.id}`} />}
                          >
                            <ShoppingCart className="size-4" aria-hidden />
                            {nhan}
                          </Button>
                        );
                      })()}
                  </section>
                ),
                /* 📌 KHÔNG CẦN `giuNoiDungKhiGap` NỮA (18/08/2026): cờ đó sinh ra để form nhập
                   liệu nhúng trong khối không bị tháo khỏi cây React khi gập — gõ nửa cái đơn
                   rồi gập là mất sạch. Nay form đã dời sang trang riêng, trong khối chỉ còn
                   danh sách đơn và một cái nút, không có gì để mất. Bật cờ này khi không cần
                   là dựng sẵn nội dung ẩn cho mọi lượt mở phiếu, không được gì. */
                /**
                 * ★★ Ô HỢP ĐỒNG QUAY VỀ BƯỚC ④ — Ban lãnh đạo 26/08/2026: *"Phải có hợp đồng hoặc
                 * thoả thuận mua bán thì mới tiến hành lập PO được, vậy nên hãy kéo bước đính kèm
                 * hợp đồng về bước này"*.
                 *
                 * ⚠️ Từ 24 đến 26/08 ô này nằm ở bước ⑤. Tệp đính trong ba ngày đó vẫn còn trong dữ
                 * liệu (khóa cũ `BUOC_CU_HOP_DONG`) nhưng KHÔNG hiện ở hộp sửa được này nữa — xem
                 * `tepHopDongSuaDuoc` (chỉ đọc khóa canonical). Xem/xóa tệp cũ đó thì đúng chỗ là
                 * khối đọc-only `KhuDinhKemGiaiDoan maGiaiDoan="dat_hang"` ở bước ⑤ bên dưới.
                 *
                 * 🔴 Luật chặn ở `2-quy-trinh/chung-tu-cuoi-quy-trinh.ts` → `vuongMacRoiBuocLapDon`,
                 * và `vuongMacLapDonHang` gọi nó để **chặn cất đơn khi chưa có hợp đồng**. Hàm đó
                 * vẫn dùng `tepHopDong` (gộp cả khóa cũ) cho câu hỏi "có hợp đồng chưa" — không
                 * viết lại điều kiện ở đây.
                 *
                 * 📌 TỪ 01/09/2026: Ô Y HỆT (cùng `tepHopDongSuaDuoc`) CŨNG hiện ở bước ⑤ (khối
                 * `dat_hang` bên dưới) để cập nhật bản đã ký đóng mộc ngay khi NCC gửi về. Đây
                 * KHÔNG PHẢI một tệp khác; sửa ở đâu cũng ghi vào đúng một chỗ — nên dùng CHUNG
                 * `duocSuaHopDong` ở CẢ HAI khối (không phải `duocSuaTepBuoc` cố định ở đây), nếu
                 * không thì "siết quyền ở ⑤" chỉ là ảo: ai bị chặn ở ⑤ vẫn mở khối này (luôn hiện,
                 * không ẩn theo bước hiện tại) để sửa đúng tệp đó. Xem `duocSuaHopDong` để biết
                 * luật đầy đủ.
                 */
                khuDinhKem: (
                  <div className="flex flex-col gap-(--hp-md-card-gap)">
                    <OChungTuBatBuoc
                      deNghi={dn}
                      maGiaiDoan={BUOC_DINH_KEM_HOP_DONG}
                      nhanO={NHAN_TEP_HOP_DONG}
                      /* ★ Tên hiển thị đổi theo chỉ đạo 23/08/2026; NHÃN LƯU (`nhanO`) giữ nguyên
                         "Hợp đồng" để hợp đồng đã đính kèm trước đó vẫn được nhận ra.
                         📌 BƯỚC ④ GIỮ TÊN "Hợp đồng" — Sếp 15/09/2026 chỉnh lại: tên "Đơn mua hàng"
                         đặt ở **bước ⑤ Tiến hành đặt hàng**, không phải ở đây. */
                      tieuDe={TEN_HIEN_HOP_DONG}
                      moTa="Bản hợp đồng mua bán / thoả thuận đã ký với nhà cung cấp."
                      batBuoc
                      duocSua={duocSuaHopDong}
                      khoa={hoSoDaDong}
                      tepDaCo={tepHopDongSuaDuoc(dn)}
                    />

                    {/* ★ Ô GHI LÝ DO — chỉ đạo 23/08/2026, GIỮ NGUYÊN khi dời bước.
                        🔴 Đây là lối thoát cho mẫu **PO-02 — Đơn mua hàng kèm thoả thuận**: ở mẫu
                        đó chính tờ đơn là thoả thuận, không có hợp đồng riêng để đính. Bỏ ô này là
                        khoá cứng mọi đơn dùng mẫu PO-02.
                        🔴 Chỉ hiện khi CHƯA có tệp — đã có rồi mà vẫn hỏi "vì sao chưa có" là mời
                        người dùng ghi một lý do sai vào hồ sơ. */}
                    {!coHopDong(dn) && (
                      <div
                        className={`flex flex-col gap-1.5 rounded-lg border p-(--hp-md-row-pad) ${
                          thieuHopDongDaGhiLyDo(dn)
                            ? "border-danger bg-danger-bg"
                            : "border-border bg-muted"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                        <Label
                          className="shrink-0"
                          title={`Chưa có ${TEN_HIEN_HOP_DONG} thì chọn một lý do`}
                        >
                          Lý do chưa có <span className="text-danger">*</span>
                        </Label>
                        {/* ★★ HAI NÚT CHỌN SẴN thay ô gõ tự do — Ban lãnh đạo 13/09/2026:
                            *"Thay vì tự nhập lý do, hãy tạo cho a 2 nút này"*.

                            🔴 BẤM LẠI NÚT ĐANG CHỌN = BỎ CHỌN (ghi chuỗi rỗng). Không có đường bỏ
                            chọn thì người bấm nhầm bị kẹt: hồ sơ mang vĩnh viễn một lý do sai mà
                            không xoá được, vì ô gõ tự do — chỗ duy nhất xoá được trước đây — vừa bị
                            thay bằng hai nút này.

                            🔴 GHI THẲNG khi bấm (khác ô cũ ghi lúc `onBlur`): một cú bấm là một ý
                            định rõ ràng, không có trạng thái "đang gõ dở" để chờ.

                            📌 Danh sách hai chữ nằm ở `LY_DO_THIEU_HOP_DONG_CHON`
                            (2-quy-trinh/chung-tu-cuoi-quy-trinh.ts) — chữ nghiệp vụ để một chỗ, xem
                            chú thích ở đó về việc hồ sơ cũ gõ tay vẫn chạy bình thường. */}
                        {LY_DO_THIEU_HOP_DONG_CHON.map((lyDo) => {
                          const dangChon = lyDoThieuHopDong(dn) === lyDo;
                          return (
                            <Button
                              key={lyDo}
                              size="sm"
                              variant={dangChon ? "default" : "outline"}
                              disabled={!duocSuaHopDong || hoSoDaDong}
                              onClick={() => {
                                /* 🔴 THAM SỐ THỨ NĂM (tên chứng từ) THÊM 16/09/2026 — nó làm dòng
                                   nhật ký nói rõ lời khai này thuộc chứng từ nào, và đó là thứ duy
                                   nhất giúp mục 3 ở bước ⑧ tra ra **ai đã khai "Không có Hợp
                                   đồng"** (Sếp: *"phải có ghi chú và được link xuống mục 8"*). Bỏ
                                   nó đi thì câu ghi chú mất tên người, không lỗi nào báo. */
                                const loi = ghiLyDoThieuChungTu(
                                  dn.id,
                                  KHOA_LY_DO_THIEU_HOP_DONG,
                                  dangChon ? "" : lyDo,
                                  nguoiDung.tenHienThi,
                                  TEN_HIEN_HOP_DONG,
                                );
                                if (loi) {
                                  toast.error("Chưa ghi được lý do", { description: loi });
                                  return;
                                }
                                toast.success(
                                  dangChon
                                    ? "Đã bỏ chọn lý do"
                                    : `Đã ghi: ${tenHienLyDoThieuHopDong(lyDo)}`,
                                );
                              }}
                            >
                              {/* 🔴 VẼ bằng `tenHienLyDoThieuHopDong`, SO SÁNH vẫn bằng `lyDo` gốc —
                                  Sếp 16/09/2026: *"Sửa ghi chú 'Không có HĐ' thành 'Không có Hợp
                                  đồng'"*. Giá trị LƯU giữ nguyên chuỗi cũ, nếu không thì mọi hồ sơ
                                  đã chọn từ 13/09 tới nay đọc ra không khớp và app coi như họ chưa
                                  khai gì — hỏng im lặng. Lý do đầy đủ ở chỗ khai hằng số. */}
                              {tenHienLyDoThieuHopDong(lyDo)}
                            </Button>
                          );
                        })}
                        {/* Hồ sơ CŨ gõ lý do tự do thì vẫn phải đọc được — nếu không người dùng
                            tưởng lý do mình ghi đã mất. Chỉ hiện khi chuỗi đang lưu KHÁC cả hai nút. */}
                        {lyDoThieuHopDong(dn) !== "" &&
                          !LY_DO_THIEU_HOP_DONG_CHON.includes(lyDoThieuHopDong(dn)) && (
                            <span className="text-sm text-text-secondary italic">
                              Lý do đã ghi trước đây: {lyDoThieuHopDong(dn)}
                            </span>
                          )}
                        </div>

                        {/**
                          * ★★★ CÂU NHẮC KÈM DẤU ĐỎ — Sếp 16/09/2026: *"Ở bước Lập đơn mua hàng,
                          * thêm nút chọn 'Bổ sung sau' và phải báo đỏ để nhắc"*.
                          *
                          * 📌 ĐO TRƯỚC KHI LÀM (16/09/2026): nút *"Bổ sung sau"* và nền đỏ **đã
                          * có sẵn** ở đúng khối này từ 13/09/2026 — không dựng cơ chế thứ hai,
                          * vẫn đúng `KHOA_LY_DO_THIEU_HOP_DONG` và vẫn đúng cờ
                          * `thieuHopDongDaGhiLyDo`. Thứ THIẾU là **chữ**: trước hôm nay trạng
                          * thái này chỉ được nói bằng màu nền, trái Design System V1.1 §3.2
                          * (*"trạng thái luôn có cả màu và chữ"*) — người không phân biệt được
                          * màu thì không biết hồ sơ đang còn nợ chứng từ.
                          *
                          * 🔴 CHỮ LẤY TỪ HÀM THUẦN `cauNhacConNoHopDong`, dùng chung với mục 3/4
                          * ở bước ⑧ — hai màn hình không thể nói khác nhau về cùng một trạng
                          * thái.
                          *
                          * 🔴 CHỈ LÀ LỜI NHẮC, KHÔNG PHẢI CHỐT CHẶN. Không đụng
                          * `vuongMacRoiBuocLapDon` / `vuongMacLapDonHang`: chọn "Bổ sung sau" vẫn
                          * lập được đơn y như trước.
                          */}
                        {cauNhacConNoHopDong(dn) !== null && (
                          <div className="flex items-start gap-1.5">
                            <AlertTriangle
                              className="mt-0.5 size-3.5 shrink-0 text-danger"
                              aria-hidden
                            />
                            <span className="text-xs font-medium text-danger">
                              {cauNhacConNoHopDong(dn)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 🔴 Khu tệp tự do CHỈ hiện khi có tệp KHÔNG mang nhãn hợp đồng — nếu không,
                        hợp đồng vừa đính sẽ hiện HAI LẦN trên cùng một khối. */}
                    {(dn.tepGiaiDoan?.lap_don_mua_hang ?? []).some(
                      (t) => (t.ghiChu ?? "").trim() !== NHAN_TEP_HOP_DONG,
                    ) && (
                      <KhuDinhKemGiaiDoan
                        deNghi={dn}
                        maGiaiDoan="lap_don_mua_hang"
                        duocSua={duocSuaTepBuoc}
                        khoa={hoSoDaDong}
                      />
                    )}
                  </div>
                ),
              },
              {
                ma: "dat_hang",
                nhan: NHAN_GIAI_DOAN.dat_hang.nhan,
                dangODay: giaiDoan === "dat_hang",
                conThieu: conThieuCuaBuoc("dat_hang"),
                truong: poLienQuan.map((po) => ({
                  nhan: "Đơn mua hàng",
                  giaTri: po.code,
                })),
                /**
                 * ❌❌ BẢNG "TIẾN ĐỘ NHẬN HÀNG" ĐÃ DỜI SANG BƯỚC ⑥ — Sếp 16/09/2026, khoanh đỏ khối
                 * KẾT QUẢ của bước ⑤: ***"Và mục này hiển thị ở bước tiếp chứ ko phải ở bước này"***.
                 *
                 * 🔴 ĐÚNG VỀ NGHIỆP VỤ: bảng đó nói chuyện **nhận hàng**, mà bước ⑤ là *đặt hàng*.
                 * Hồ sơ chưa giao lần nào vẫn phải bày một bảng toàn số 0 kèm dòng đỏ *"Còn 1/1
                 * dòng chưa nhận đủ hàng"* ngay giữa bước đặt hàng — một việc người thu mua không
                 * làm gì được ở bước này.
                 *
                 * 📌 LÝ DO CŨ ĐÃ HẾT HIỆU LỰC, ghi lại để không ai tưởng là xoá nhầm: bảng được
                 * đưa vào đây ngày 21/08/2026 vì *"bước này đang bị treo"* — hồi đó điều kiện rời
                 * bước ⑤ là **có phiếu nhận hàng**, mà nút ghi phiếu chỉ có ở màn Đơn hàng, nên
                 * người đứng ở trang đề nghị không thấy đường nào và hồ sơ đứng mãi. Từ 16/09/2026
                 * bước ⑤ khép bằng chính việc của người thu mua (đính bản PO ký hoặc bấm "Bổ sung
                 * sau" — xem `vuongMacRoiBuocDatHang`), nên bế tắc đó không còn, và bảng không cần
                 * nằm ở đây nữa.
                 *
                 * ✅ KHÔNG MỒ CÔI: bảng nhúng nguyên vẹn vào `noiDungNghiepVu` của bước ⑥, kèm cả
                 * nút "Ghi nhận giao hàng" của nó. Đã đo trước khi dời.
                 */
                noiDungNghiepVu: undefined,
                /**
                 * Bước ⑤ nhận đơn đã gửi đi có xác nhận của nhà cung cấp, chứng từ tạm ứng.
                 *
                 * ❌❌ Ô **HỢP ĐỒNG** ĐÃ BỎ KHỎI BƯỚC ⑤ — Sếp 16/09/2026, khoanh đỏ trọn cụm (nhãn
                 * *Hợp đồng · Bắt buộc* + dòng mô tả + nút vàng + dòng "Nhận PDF, ảnh…") và ghi
                 * ***"ko cần hiển thị thông tin này"***. Hỏi lại phạm vi trước khi làm vì đây là
                 * đảo một chỉ đạo có ngày tháng; Sếp chốt ***"Bỏ cả ô"***.
                 *
                 * 📌 CHỈ ĐẠO BỊ THAY THẾ, GHI LẠI ĐỂ KHÔNG AI TƯỞNG LÀ XOÁ NHẦM: ngày 01/09/2026
                 * Sếp cho mở ô này ở bước ⑤ với lý do *bản nhà cung cấp ký và đóng mộc thường chỉ
                 * gửi về sau khi đã đặt hàng*, nên cần thay được ngay tại đây thay vì quay lại
                 * bước ④. Lý do đó nay **không còn đứng**: từ 16/09 Đơn mua hàng NCC ký đã tách
                 * thành chứng từ riêng và **có ô riêng ngay bên dưới** — tức đúng thứ mà chỉ đạo
                 * 01/09 cần, nay có chỗ đúng nghĩa của nó. Ô hợp đồng ở đây chỉ còn là bản sao
                 * thứ ba trỏ vào cùng một tệp.
                 *
                 * ✅ ĐÃ ĐO TRƯỚC KHI BỎ — KHÔNG MỒ CÔI CHỨC NĂNG (CLAUDE.md §3.4b): Hợp đồng vẫn
                 * đính và sửa được ở **bước ④** (`OChungTuBatBuoc` cùng `BUOC_DINH_KEM_HOP_DONG`
                 * + `NHAN_TEP_HOP_DONG`, kèm hai nút lý do) và ở **hộp chuyển giai đoạn**
                 * (`hop-chuyen-giai-doan.tsx`). Bỏ ở đây là bỏ đường thứ ba.
                 *
                 * ⚠️ CÁI GIÁ, NÓI THẲNG: Trưởng bộ phận nhận bản hợp đồng ký muộn nay phải mở
                 * ngược lên khối bước ④ để thay. Khối ④ **luôn hiện** trên cùng trang này (không
                 * ẩn theo bước đang đứng) nên không ai bị kẹt, chỉ là thêm một lượt cuộn.
                 *
                 * 📌 Phép siết quyền `duocSuaHopDong` GIỮ NGUYÊN, không dọn theo — nó vẫn đang áp
                 * cho ô Đơn mua hàng ngay dưới, và cho chính khối ④ (xem nơi khai báo).
                 */
                khuDinhKem: (
                  <div className="flex flex-col gap-(--hp-md-card-gap)">
                    {/**
                      * ★★★ Ô **ĐƠN MUA HÀNG NCC KÝ** — Sếp 16/09/2026: ***"Tách làm 2 mục riêng"***,
                      * và ô riêng của nó đặt ở **bước ⑤ Tiến hành đặt hàng**.
                      *
                      * ✅ ĐÚNG BƯỚC: bản đơn NCC **ký và đóng mộc** chỉ gửi về SAU khi đã đặt hàng —
                      * đó chính là lý do 01/09/2026 Sếp yêu cầu mở đường sửa tệp tại bước này.
                      *
                      * 🔴 NGĂN KHÁC HẲN Ô TRÊN: `BUOC_DINH_KEM_DON_MUA_HANG` + `NHAN_TEP_DON_MUA_HANG`.
                      * Đính vào đây KHÔNG đụng tới tệp hợp đồng, và ngược lại. Đừng "dọn cho gọn"
                      * bằng cách cho hai ô cùng `maGiaiDoan` — làm vậy là quay về đúng cảnh một ô
                      * hai tên mà cả lượt sửa này sinh ra để gỡ.
                      *
                      * 🔴🔴 `duocSua={duocDinhPOKy}` — **CỜ RIÊNG, KHÔNG dùng chung với ô hợp đồng**.
                      * Sếp 16/09/2026: ***"Nhân viên là người đính kèm file PO ký"***.
                      *
                      * ⚠️ CHÚ THÍCH CŨ TẠI ĐÂY NÓI NGƯỢC — chép lại để không ai khôi phục: nó viết
                      * *"CÙNG cờ quyền với ô hợp đồng ở trên, cố ý… cho ô này dùng cờ rộng hơn là
                      * siết quyền bên kia thành vô nghĩa"*. Câu đó **sai về căn cứ**: chỉ đạo
                      * 01/09/2026 siết quyền cho **tệp hợp đồng**, chưa bao giờ nói về bản PO nhà
                      * cung cấp ký — ô này mới tách ra sáng 16/09, và nó chỉ **chép cờ cho tiện**.
                      *
                      * 🔴 Cờ chép đó còn đá ngược chính lý do 01/09: hôm đó Sếp mở ô ở bước ⑤ vì
                      * *bản NCC ký thường gửi về sau khi đã đặt hàng* — để người đang làm ở bước ⑤
                      * đính vào. Nhưng `phanBoCongViec` chỉ Trưởng bộ phận cấp ≥3 mới có, nên chính
                      * nhân viên cầm bản ký trong tay lại không đính được.
                      *
                      * 📌 Ô Hợp đồng ngay trên GIỮ NGUYÊN `duocSuaHopDong` — siết 01/09 còn hiệu lực.
                      */}
                    <OChungTuBatBuoc
                      deNghi={dn}
                      maGiaiDoan={BUOC_DINH_KEM_DON_MUA_HANG}
                      nhanO={NHAN_TEP_DON_MUA_HANG}
                      tieuDe={TEN_HIEN_DON_MUA_HANG}
                      /* 🔴 MÔ TẢ Ô CHỈ NÓI CHỨNG TỪ ĐÓ LÀ GÌ — Sếp 16/09/2026, khoanh đỏ đúng vế
                         giải thích cơ chế của ô hợp đồng (*"cùng tệp với bước ④, sửa ở đây bước ⑤
                         cũng thấy ngay. Chỉ Trưởng bộ phận/quản trị sửa được ở bước này"*) và ghi
                         *"bỏ những dòng ghi chú có nội dung kiểu này đi"*.
                         👉 Vế *"Đây là chứng từ riêng, KHÁC tệp hợp đồng ở ô trên"* vừa bị bỏ ở đây
                         cũng đúng loại đó: nó kể chuyện app lưu vào ngăn nào, một chuyện nội bộ.
                         Người thu mua cần biết PHẢI NỘP GIẤY GÌ — tên hai ô đã đủ phân biệt.
                         📌 Giữ lại vế nói chứng từ là gì và khi nào có: đó là thông tin nghiệp vụ.
                         Cùng tiêu chí này, các mô tả còn lại (Hoá đơn VAT, UNC, Phiếu chi) được
                         GIỮ NGUYÊN — chúng chỉ việc phải làm, không kể cơ chế. */
                      moTa="Bản đơn mua hàng đã ký, đóng mộc từ nhà cung cấp gửi về khi đặt hàng."
                      batBuoc
                      duocSua={duocDinhPOKy}
                      khoa={hoSoDaDong}
                      tepDaCo={tepDonMuaHangNCCKy(dn)}
                      /**
                        * ★★ NÚT "Bổ sung sau" ĐỨNG NGAY ĐÂY — Sếp 16/09/2026: ***"Đưa nút này lên"***.
                        * Trước đó nó nằm trong một khối riêng bên dưới, sau cả dòng *"Nhận PDF, ảnh,
                        * Word, Excel…"* — xa hẳn thứ nó nói về.
                        *
                        * 🔴 ĐIỀU KIỆN HIỆN NẰM Ở ĐÂY, KHÔNG nhét vào `OChungTuBatBuoc`: ô chứng từ
                        * dùng chung cho 8 chỗ và không biết gì về "lý do chưa có". Chưa có tệp thì
                        * mới hỏi lý do — đã đính rồi mà còn bày nút là mời người dùng khai "chưa có"
                        * cho một tệp đang nằm đó.
                        */
                      nutPhu={
                        tepDonMuaHangNCCKy(dn).length === 0
                          ? LY_DO_THIEU_DON_MUA_HANG_CHON.map((lyDo) => {
                              const dangChon = lyDoThieuDonMuaHang(dn) === lyDo;
                              return (
                                <Button
                                  key={lyDo}
                                  size="sm"
                                  variant={dangChon ? "default" : "outline"}
                                  /* Cùng cờ với ô nộp: ai đính được bản PO ký thì cũng khai được lý
                                     do chưa có. Lệch hai cờ là nhân viên đính được tệp nhưng không
                                     bấm được "Bổ sung sau" — một ngõ cụt vô nghĩa. */
                                  disabled={!duocDinhPOKy || hoSoDaDong}
                                  onClick={() => {
                                    /* 🔴 BẤM LẠI NÚT ĐANG CHỌN = BỎ CHỌN — cùng cơ chế với hai nút ở
                                       bước ④. Không có đường bỏ chọn thì người bấm nhầm kẹt vĩnh
                                       viễn với một lý do sai trong hồ sơ. */
                                    const loi = ghiLyDoThieuChungTu(
                                      dn.id,
                                      KHOA_LY_DO_THIEU_DON_MUA_HANG,
                                      dangChon ? "" : lyDo,
                                      nguoiDung.tenHienThi,
                                      TEN_HIEN_DON_MUA_HANG,
                                    );
                                    if (loi) {
                                      toast.error("Chưa ghi được lý do", { description: loi });
                                      return;
                                    }
                                    toast.success(dangChon ? "Đã bỏ chọn lý do" : `Đã ghi: ${lyDo}`);
                                  }}
                                >
                                  {lyDo}
                                </Button>
                              );
                            })
                          : undefined
                      }
                    />

                    {/**
                      * ★★★ LÝ DO CHƯA CÓ BẢN ĐƠN NCC KÝ — **CHỈ MỘT NÚT: "Bổ sung sau"**.
                      *
                      * ★ Sếp 16/09/2026, nguyên văn: ***"PO là chắc chắn có, chỉ là bổ sung sau
                      * thôi. Kiểm tra lại và điều chỉnh"***.
                      *
                      * 🔴 KHÁC HẲN Ô HỢP ĐỒNG Ở BƯỚC ④ (có HAI nút). Hợp đồng có thể **thật sự
                      * không có** — đơn nhỏ, mua lẻ, mẫu PO-02 mà chính tờ đơn là thoả thuận. Còn
                      * **PO thì app tự sinh ra, luôn luôn có**; chỉ có thể chưa nhận được bản ký.
                      * Thêm nút *"Không có Đơn mua hàng"* vào đây là mở đường khai một chuyện không
                      * tồn tại, rồi tắt luôn dấu đỏ của tờ chứng từ gốc của cả đơn hàng.
                      *
                      * 🔴 DANH SÁCH NÚT LẤY TỪ `LY_DO_THIEU_DON_MUA_HANG_CHON`, KHÔNG gõ cứng ở
                      * đây — chữ nghiệp vụ để một chỗ (`chung-tu-cuoi-quy-trinh.ts`).
                      *
                      * 📌 GHI VÀO KHOÁ RIÊNG `KHOA_LY_DO_THIEU_DON_MUA_HANG`. Dùng nhầm khoá của
                      * hợp đồng là hai mục lại hiện giống hệt nhau — đúng lỗi Sếp vừa bắt.
                      *
                      * 🔴 CHỈ LÀ LỜI NHẮC, KHÔNG PHẢI CHỐT CHẶN: không hàm luật nào đọc khoá này,
                      * nên chọn hay không chọn cũng KHÔNG đổi điều kiện chuyển bước hay đóng hồ sơ.
                      * Ai muốn biến nó thành chốt thì phải hỏi Sếp — thêm một điều kiện đóng hồ sơ
                      * là chặn hàng loạt hồ sơ đang chạy.
                      */}
                    {/**
                      * ❌❌ HÀNG NÚT ĐÃ DỜI LÊN NGANG TIÊU ĐỀ Ô — Sếp 16/09/2026, vẽ mũi tên từ nút
                      * *"Bổ sung sau"* lên cạnh nút đính kèm: ***"Đưa nút này lên"***.
                      *
                      * 🔴 VÌ SAO NÓ TỪNG NẰM DƯỚI: khối này là một `<div>` riêng đặt SAU
                      * `<OChungTuBatBuoc>`, mà bên trong ô đó còn một dòng chữ *"Nhận PDF, ảnh,
                      * Word, Excel…"* — nên nút bị đẩy xuống tận đáy, xa hẳn thứ nó nói về.
                      * Nay nút đi qua prop `nutPhu` của ô chứng từ (xem `o-chung-tu-bat-buoc.tsx`).
                      *
                      * 📌 KHỐI NÀY VẪN CÒN, nhưng chỉ còn **dòng nhắc nợ** khi đã chọn lý do —
                      * câu đó dài, đặt ngang tiêu đề là vỡ hàng. Chưa chọn gì thì không vẽ gì.
                      */}
                    {/* 🔴 TRẠNG THÁI CÓ CẢ MÀU LẪN CHỮ (Design System V1.1 §3.2). Câu lấy từ hàm
                        thuần `cauNhacConNoChungTu` — cùng câu mục 4 ở bước ⑧ đang in, nên hai màn
                        hình không thể nói khác nhau. Câu này dài nên vẫn ở dưới, không lên ngang
                        tiêu đề cùng nút. */}
                    {tepDonMuaHangNCCKy(dn).length === 0 && lyDoThieuDonMuaHang(dn) !== "" && (
                      <div className="flex items-start gap-1.5 rounded-lg border border-danger bg-danger-bg p-(--hp-md-row-pad)">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden />
                        <span className="text-xs font-medium text-danger">
                          {cauNhacConNoChungTu(lyDoThieuDonMuaHang(dn))}
                        </span>
                      </div>
                    )}

                    {/* 🔴 Tệp mồ côi từ 3 ngày 24→26/08/2026 khi ô hợp đồng từng nằm hẳn ở bước ⑤
                        (khóa lưu khác, xem chú thích gốc ở `chung-tu-cuoi-quy-trinh.ts`) — vẫn chỉ
                        để xem, không phải nơi sửa hợp đồng chính (đã có khối ở trên). */}
                    {(dn.tepGiaiDoan?.dat_hang ?? []).length > 0 && (
                      <KhuDinhKemGiaiDoan
                        deNghi={dn}
                        maGiaiDoan="dat_hang"
                        duocSua={false}
                        khoa
                      />
                    )}
                  </div>
                ),
              },
              {
                ma: "nhan_hang",
                nhan: NHAN_GIAI_DOAN.nhan_hang.nhan,
                dangODay: giaiDoan === "nhan_hang" || giaiDoan === "hoan_thanh",
                conThieu: conThieuCuaBuoc("nhan_hang"),
                truong: phieuLienQuan.flatMap((p) =>
                  p.tepPhieuGiao
                    ? [{ nhan: `Phiếu giao nhận lần ${p.lanGiaoThu}`, tep: [p.tepPhieuGiao] }]
                    : [],
                ),
                /**
                 * ★ XÁC NHẬN HOÀN THÀNH CỦA TRƯỞNG BỘ PHẬN — Ban lãnh đạo 20/08/2026: *"đang chưa
                 * có bước xác nhận của trưởng bộ phận ở bước này"*.
                 *
                 * 🔴 VÌ SAO TRƯỚC ĐÂY KHÔNG THẤY: việc xác nhận VỐN ĐÃ CÓ, nhưng chỉ nằm ở màn
                 * **Đơn hàng chi tiết**. Trưởng bộ phận đứng ở trang đề nghị — nơi họ theo dõi cả
                 * quy trình — thì bước ⑥ chỉ có tệp đính kèm, không một nút nào. Họ phải tự biết
                 * mở sang từng đơn hàng mới xác nhận được.
                 *
                 * 🔴 GÁC ĐÚNG LUẬT ĐÃ CHỐT, KHÔNG NỚI: `vuongMacXacNhanKho` — *"mỗi lần giao phải
                 * có tệp phiếu giao nhận đính kèm mới được xác nhận hoàn thành"* (Ban lãnh đạo
                 * 11/08/2026, quy tắc dữ liệu số 5 ở CLAUDE.md). Luật ở `2-quy-trinh/tinh-toan.ts`,
                 * gọi lại đúng hàm đó chứ không kiểm lại theo cách khác.
                 *
                 * 📌 Thứ tự hai lớp giữ nguyên: **kho xác nhận trước**, trưởng bộ phận sau. Bỏ thứ
                 * tự là trưởng bộ phận chốt xong mà kho chưa nhận đủ hàng.
                 */
                noiDungNghiepVu: (() => {
                  /**
                   * 🔴 SỬA LỖI NGHIÊM TRỌNG (21/08/2026) — bản tôi làm ngày 20/08 **cho xác nhận
                   * hoàn thành khi hàng chưa về đủ**, và cả khi đơn còn là bản nháp.
                   *
                   * Hai chỗ thiếu so với màn Đơn hàng chi tiết (`don-hang-chi-tiet.tsx:288` và
                   * `:304`, cả hai đều có `daGiaoDu &&`):
                   *   ① Không gác `poDaGiaoDu` → bấm được dù mới nhận 1/10 khối lượng.
                   *   ② Không loại đơn `nhap` → đơn chưa gửi nhà cung cấp cũng hiện nút "đã nhận
                   *      đủ hàng".
                   * Nguy hiểm vì xác nhận hoàn thành là **căn cứ thanh toán**: xác nhận sớm là
                   * trả tiền cho hàng chưa nhận, và chứng từ đã ký thì không sửa lại được.
                   *
                   * ⚠️ `vuongMacXacNhanKho([])` trả `null` (mảng rỗng thì không có phiếu nào
                   * thiếu tệp), nên MỘT MÌNH nó KHÔNG chặn được ca "chưa giao gì cả". Phải có
                   * `poDaGiaoDu` đứng cùng.
                   *
                   * 📌 Dùng lại `tinhTienDoPO` + `poDaGiaoDu` ở `2-quy-trinh/tinh-toan.ts` — đúng
                   * hai hàm màn Đơn hàng đang dùng, để hai chỗ không thể nói khác nhau.
                   */
                  const poChoXacNhan = poLienQuan.filter(
                    (po) =>
                      po.trangThai !== "hoan_thanh" &&
                      po.trangThai !== "huy" &&
                      po.trangThai !== "nhap",
                  );

                  /**
                   * ★★ BẢNG "TIẾN ĐỘ NHẬN HÀNG" NAY NẰM Ở ĐÂY — Sếp 16/09/2026: *"mục này hiển thị
                   * ở bước tiếp chứ ko phải ở bước này"* (dời từ khối KẾT QUẢ của bước ⑤ sang).
                   *
                   * 📌 NHÚNG LẠI `BangTienDoPO`, KHÔNG viết bảng thứ hai — nó đang giữ luật ghi
                   * phiếu (đối chiếu khối lượng, chặn ghi vượt, **bắt buộc tệp phiếu giao nhận**).
                   * Dựng bảng riêng là có hai chỗ cùng ghi phiếu theo hai bộ luật, sớm muộn lệch.
                   *
                   * 🔴 DANH SÁCH RIÊNG `poDaChot`, KHÔNG dùng lại `poChoXacNhan`: đơn đã hoàn thành
                   * vẫn phải xem lại được tiến độ và chứng từ giao nhận của nó. `poChoXacNhan` cố
                   * ý loại `hoan_thanh` vì phần **nút xác nhận** bên dưới không còn việc gì với
                   * đơn đã xong — hai câu hỏi khác nhau, đừng gộp.
                   *
                   * ⚠️ Chỉ đơn ĐÃ CHỐT trở đi — đơn còn nháp thì chưa gửi nhà cung cấp, chưa thể
                   * có hàng về.
                   */
                  const poDaChot = poLienQuan.filter(
                    (po) => po.trangThai !== "nhap" && po.trangThai !== "huy",
                  );
                  const bangTienDo =
                    poDaChot.length === 0 ? null : (
                      <div className="flex flex-col gap-(--hp-md-card-gap)">
                        {poDaChot.map((po) => (
                          <div key={po.id} className="flex flex-col gap-2">
                            <p className="text-xs font-semibold text-text-desc uppercase">
                              {po.code}
                            </p>
                            <BangTienDoPO po={po} />
                          </div>
                        ))}
                      </div>
                    );

                  /* Không có đơn nào chờ xác nhận thì vẫn phải bày bảng tiến độ (đơn đã hoàn thành
                     chẳng hạn) — trả `undefined` ở đây là giấu mất chứng từ giao nhận của hồ sơ. */
                  if (poChoXacNhan.length === 0) return bangTienDo ?? undefined;
                  /**
                   * ★★ HỒ SƠ PHÒNG BAN — Sếp 15/09/2026, nguyên văn: *"Đề nghị phòng ban thì ko
                   * cần nút này"* (ảnh chụp production: hồ sơ DMH260007 đã "Đã nhận hàng", tiến độ
                   * 5/5 "Đã nhận đủ", đã có phiếu giao nhận — mà vẫn còn badge "Chờ kho xác nhận"
                   * và nút xanh "Kho xác nhận nhận đủ hàng").
                   *
                   * 🔴 ẨN NÚT MÀ KHÔNG LÀM HỒ SƠ KẸT — đọc kỹ chỗ này trước khi nghĩ tới việc bỏ:
                   * nút không bị *giấu đi*, nó THỪA THẬT. Tầng ghi ở `3-du-lieu/kho-du-lieu.tsx`
                   * (`tuChotXacNhanKhoPhongBan`) tự ghi `po.xacNhanKho` ngay trong lần "Ghi nhận
                   * giao hàng" làm đơn đủ khối lượng, mang tên và ngày của chính người vừa ghi
                   * nhận. Hai điều kiện mà nút này đang gác — `daGiaoDu` và `vuongMacTep === null`
                   * — được giữ nguyên ở tầng ghi, tức là CHUYỂN NGƯỜI BẤM chứ không hạ hàng rào.
                   *
                   * ⚠️ VÌ VẬY, KHI HỒ SƠ PHÒNG BAN VẪN CHƯA CÓ `po.xacNhanKho` thì chắc chắn còn
                   * vướng một điều kiện — và người dùng PHẢI đọc được câu vướng đó tại chỗ, chứ
                   * không phải nhìn một khoảng trắng rồi ngồi chờ ai đó bấm hộ. Khối cảnh báo bên
                   * dưới lo đúng việc này.
                   */
                  const hoSoPhongBan = laHoSoPhongBan(dn);
                  return (
                    <div className="flex flex-col gap-(--hp-md-row-gap)">
                      {/* Bảng tiến độ đứng TRƯỚC cụm nút xác nhận: phải nhìn số lượng đã nhận rồi
                          mới quyết định bấm "đã nhận đủ hàng", không phải ngược lại. */}
                      {bangTienDo}
                      {poChoXacNhan.map((po) => {
                        const phieuCuaPO = phieuNhan.filter((p) => p.poId === po.id);
                        const vuongMacTep = vuongMacXacNhanKho(phieuCuaPO);
                        const daGiaoDu = poDaGiaoDu(tinhTienDoPO(po, phieuCuaPO));
                        const daKhoXacNhan = Boolean(po.xacNhanKho);
                        return (
                          <div
                            key={po.id}
                            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-(--hp-md-row-pad)"
                          >
                            <p className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="font-semibold text-text-primary">{po.code}</span>
                              {/* ★★ CHỮ PHẢI NÓI ĐÚNG VIỆC ĐANG CHỜ — Sếp 15/09/2026.
                                  Hồ sơ phòng ban KHÔNG có kho công trình nào, nên chữ "kho" trong
                                  nhãn là sai sự thật: người đọc đi tìm thủ kho để hỏi, trong khi
                                  chẳng có thủ kho nào trong quy trình này. Đổi sang chữ nói thẳng
                                  cái sự việc — hàng đã nhận đủ hay chưa.
                                  📌 Giữ nguyên `tone` success/warning: Design System V1.1 bắt buộc
                                  trạng thái có CẢ màu lẫn chữ, không được chỉ đổi chữ. */}
                              <StatusBadge
                                label={
                                  hoSoPhongBan
                                    ? daKhoXacNhan
                                      ? "Đã nhận đủ hàng"
                                      : "Chờ nhận đủ hàng"
                                    : daKhoXacNhan
                                      ? "Kho đã xác nhận"
                                      : "Chờ kho xác nhận"
                                }
                                tone={daKhoXacNhan ? "success" : "warning"}
                              />
                            </p>

                            {/**
                              * ★★ NHẮC VIỆC ĐỐI CHIẾU CỦA PHÒNG THU MUA — Sếp 17/09/2026.
                              *
                              * 🔴 NHẮC, KHÔNG CHẶN. Tuyệt đối đừng đem câu này vào `disabled` của
                              * nút bên dưới: hàng về đủ, chứng từ đủ mà đơn không đóng được chỉ vì
                              * thiếu một dấu tích nội bộ thì app tự dựng bế tắc cho chính mình.
                              *
                              * 🔴 NHƯNG PHẢI CÓ. Dấu đối chiếu mà không ai đọc là nghi thức rỗng —
                              * người ta bấm cho xong hoặc bỏ luôn, rồi cả tính năng thành vô nghĩa.
                              * Đặt đúng chỗ người duyệt đang nhìn là cách rẻ nhất để nó có người
                              * dùng thật. Luật ở `2-quy-trinh/tinh-toan.ts` → `nhacDoiChieuThuMua`,
                              * một chỗ duy nhất.
                              */}
                            {(() => {
                              const nhac = nhacDoiChieuThuMua(phieuCuaPO);
                              if (!nhac) return null;
                              const lech = nhac.includes("LỆCH");
                              return (
                                <p
                                  className={`flex items-start gap-1.5 rounded-lg px-3 py-2 text-xs ${
                                    lech ? "bg-danger-bg text-danger" : "bg-muted text-text-secondary"
                                  }`}
                                >
                                  <ScanSearch className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                                  <span>{nhac}</span>
                                </p>
                              );
                            })()}

                            {/* Kho xác nhận trước — nút chỉ hiện cho người có quyền kho, và CHỈ CHO
                                HỒ SƠ CÔNG TRÌNH.

                                ★★ 15/09/2026 (sáng) — Sếp: *"E mở cho nhánh phòng ban"* và *"nhân
                                viên thu mua tự hoàn thành, nhưng phải đính kèm phiếu giao hàng"*.
                                Lúc đó cách mở là cho nhân viên thu mua bấm chính cái nút này, nên
                                điều kiện đổi từ cờ toàn cục sang `duocXacNhanNhanDuHangCuaHoSo`.

                                ★★ 15/09/2026 (chiều) — Sếp xem bản production và chốt lại:
                                *"Đề nghị phòng ban thì ko cần nút này"*. Hồ sơ DMH260007 đã "Đã nhận
                                hàng", tiến độ 5/5, đã có phiếu giao nhận đính kèm — mà vẫn còn một nút
                                xanh đòi bấm thêm. Đó là bắt người dùng xác nhận lại việc họ vừa làm.

                                🔴 NÊN THÊM `!hoSoPhongBan`. VÀ ĐÂY KHÔNG PHẢI ẨN GIAO DIỆN CHO GỌN —
                                nút THỪA THẬT: `tuChotXacNhanKhoPhongBan` trong
                                `3-du-lieu/kho-du-lieu.tsx` đã tự ghi `po.xacNhanKho` ngay trong lần
                                "Ghi nhận giao hàng" làm đơn đủ khối lượng, mang tên và ngày của chính
                                người vừa ghi nhận. Hồ sơ đi tiếp được mà không cần ai bấm.
                                ⚠️ Nếu về sau tầng tự chốt đó bị gỡ thì PHẢI bỏ luôn `!hoSoPhongBan`
                                ở đây, nếu không hồ sơ phòng ban kẹt vĩnh viễn ở bước ⑥ — đúng sự cố mà
                                nhánh phòng ban sinh ra để chữa.

                                📌 KHÔNG nới điều kiện chứng từ ở bất kỳ nhánh nào: `vuongMacTep` vẫn
                                khoá nút với hồ sơ công trình, và vẫn chặn tầng tự chốt với hồ sơ phòng
                                ban — đổi người ghi nhận chứ không bỏ bằng chứng. */}
                            {!daKhoXacNhan &&
                              daGiaoDu &&
                              !hoSoPhongBan &&
                              duocXacNhanNhanDuHangCuaHoSo(dn, nguoiDung, quyen) && (
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  size="sm"
                                  disabled={vuongMacTep !== null}
                                  title={vuongMacTep ?? undefined}
                                  onClick={() => {
                                    /* 🔴 Từ 24/08/2026 tầng ghi có thể TỪ CHỐI (hàng chưa về đủ,
                                       hoặc còn phiếu thiếu tệp giao nhận) — cùng nếp với
                                       `xacNhanTruongBP`. Bỏ qua giá trị trả về là nút bấm không
                                       có gì xảy ra mà người dùng vẫn thấy toast xanh. */
                                    const loiKho = xacNhanKho(po.id, {
                                      uid: nguoiDung.uid,
                                      ten: nguoiDung.tenHienThi,
                                      thoiDiem: new Date().toISOString().slice(0, 10),
                                    });
                                    if (loiKho) {
                                      toast.error("Chưa xác nhận được", { description: loiKho });
                                      return;
                                    }
                                    toast.success("Kho đã xác nhận nhận đủ hàng", {
                                      description: `${po.code} chuyển sang chờ trưởng bộ phận xác nhận.`,
                                    });
                                  }}
                                >
                                  <Check className="size-4" aria-hidden />
                                  Kho xác nhận nhận đủ hàng
                                </Button>
                                {vuongMacTep !== null && (
                                  <span className="text-xs text-warning-soft">{vuongMacTep}</span>
                                )}
                              </div>
                            )}

                            {/**
                              * ★★ HỒ SƠ PHÒNG BAN: ĐÃ ẨN NÚT THÌ PHẢI NÓI VÌ SAO CHƯA XONG —
                              * Sếp 15/09/2026.
                              *
                              * 🔴 ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT CỦA LẦN SỬA NÀY, đừng dọn đi cho gọn.
                              * Với hồ sơ phòng ban, `po.xacNhanKho` do tầng ghi tự chốt
                              * (`tuChotXacNhanKhoPhongBan`). Chưa chốt được thì chỉ có hai lý do, và
                              * cả hai đều là việc người dùng tự làm được:
                              *   ① còn lần giao chưa đính kèm phiếu giao hàng → `vuongMacTep` nói rõ
                              *      thiếu phiếu nào;
                              *   ② hàng chưa về đủ khối lượng → còn phải ghi nhận giao hàng tiếp.
                              * Không in ra thì người dùng nhìn thấy MỘT KHOẢNG TRẮNG: không nút, không
                              * lý do, tưởng app hỏng hoặc tưởng mình thiếu quyền rồi đi hỏi vòng
                              * quanh. Đúng cái bẫy CLAUDE.md §3.5 đã ghi — chức năng chưa xong thì
                              * khoá lại và NÓI RÕ LÝ DO, không để trống.
                              *
                              * 📌 Cỡ chữ `text-xs` (12px) là mức sàn Design System V1.1 cho phép, và
                              * đi kèm icon + màu `warning-soft` nên trạng thái có cả màu lẫn chữ.
                              */}
                            {hoSoPhongBan && !daKhoXacNhan && (
                              <p className="flex items-start gap-1.5 text-xs text-warning-soft">
                                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                                <span>
                                  {vuongMacTep !== null ? (
                                    <>
                                      {vuongMacTep} Vào bảng “Phiếu nhận hàng” phía trên, bổ sung phiếu
                                      giao hàng cho lần giao còn thiếu — xong là đơn tự chuyển sang
                                      “Đã nhận đủ hàng”, không phải bấm thêm nút nào.
                                    </>
                                  ) : (
                                    <>
                                      Hàng chưa về đủ khối lượng. Ghi nhận tiếp các lần giao ở bảng
                                      “Phiếu nhận hàng” phía trên (mỗi lần giao kèm một phiếu giao
                                      hàng) — lần giao làm đơn đủ khối lượng sẽ tự chốt “Đã nhận đủ
                                      hàng”.
                                    </>
                                  )}
                                </span>
                              </p>
                            )}

                            {daKhoXacNhan && daGiaoDu && !po.xacNhanTruongBP && duocDuyetHoanThanhDon && (
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    /* 🔴 Từ 22/08/2026 phải có Hóa đơn VAT mới duyệt được — đọc
                                       kết quả trả về, đừng báo thành công vô điều kiện. */
                                    const loi = xacNhanTruongBP(po.id, {
                                      uid: nguoiDung.uid,
                                      ten: nguoiDung.tenHienThi,
                                      thoiDiem: new Date().toISOString().slice(0, 10),
                                    });
                                    if (loi !== null) {
                                      toast.error("Chưa duyệt hoàn thành được", { description: loi });
                                      return;
                                    }
                                    toast.success("Đã xác nhận hoàn thành", {
                                      description: `${po.code} hoàn thành — đề nghị chuyển sang bước “${NHAN_GIAI_DOAN.hoan_thanh.nhan}”.`,
                                    });
                                  }}
                                >
                                  <BadgeCheck className="size-4" aria-hidden />
                                  {/**
                                    * ★★ NHÃN NÓI TÊN CỦA VIỆC, KHÔNG NÓI TÊN NGƯỜI BẤM — Ban lãnh
                                    * đạo 26/08/2026: *"Bước này là nhân viên phụ trách đơn hàng
                                    * xác nhận"*, chỉ đúng vào nút này.
                                    *
                                    * 🔴 VÌ SAO BẢN CŨ SAI: nó đổi nhãn theo VAI TRÒ NGƯỜI ĐANG XEM
                                    * — trưởng bộ phận mở ra thì đọc *"Trưởng bộ phận xác nhận hoàn
                                    * thành"*. Đúng về ai đang bấm, nhưng **che mất** việc bước này
                                    * thuộc trách nhiệm của nhân viên phụ trách đơn: trưởng bộ phận
                                    * tưởng đây là việc của mình, còn nhân viên thì không biết mình
                                    * là người phải làm.
                                    *
                                    * 📌 Nay một nhãn cho mọi vai trò, và câu dưới nút nói rõ ai
                                    * chịu trách nhiệm chính. Quyền KHÔNG đổi (Sếp chốt 26/08: *"chỉ
                                    * sửa nhãn nút"*) — trưởng bộ phận vẫn bấm được, vì cắt quyền họ
                                    * là đơn kẹt khi nhân viên nghỉ phép (lý do đã ghi 22/08/2026).
                                    */}
                                  Xác nhận hoàn thành đơn
                                </Button>
                                {/* Một dòng, chữ nhỏ — nói đúng trách nhiệm mà không kéo dài khối
                                    (Ban lãnh đạo 24/08 đã yêu cầu tối giản chữ ở khu này). */}
                                <span className="text-xs text-text-desc">
                                  Nhân viên phụ trách đơn xác nhận. Trưởng bộ phận bấm thay khi cần.
                                </span>
                              </div>
                            )}

            {/* 📌 ĐÃ BỎ câu cảnh báo "Chưa đính kèm Hóa đơn VAT…" ở cạnh nút này — Ban lãnh đạo
                27/08/2026: *"Phần xác nhận đơn hàng này chỉ cần có đính kèm phiếu giao hàng là
                được xác nhận hoàn thành"*. Nút không còn đòi hóa đơn nên câu cảnh báo cũng phải
                đi theo; để lại là báo một điều kiện không còn tồn tại.

                ⚠️ Luật hóa đơn VAT vẫn còn, chỉ ở bước sau: nút **Hoàn thành quy trình** (⑧). */}

                            {/* 🔴 CHƯA GIAO ĐỦ thì nói rõ, đừng để khối trống không giải thích —
                                người dùng thấy không có nút sẽ tưởng mình thiếu quyền. */}
                            {!daGiaoDu && (
                              <p className="text-xs text-warning-soft">
                                Chưa nhận đủ khối lượng của đơn này nên chưa xác nhận hoàn thành
                                được. Ghi phiếu nhận hàng ở bước “Tiến hành đặt hàng” cho tới khi
                                đủ.
                              </p>
                            )}

                            {/* Không có quyền thì nói rõ đang chờ ai, đừng để khối trống. */}
                            {daGiaoDu &&
                              ((!daKhoXacNhan &&
                                /* Phải hỏi CÙNG một hàm với nút ở trên. Dùng cờ toàn cục ở đây là
                                   người thu mua của hồ sơ phòng ban vừa thấy nút bấm được, vừa đọc
                                   câu "đang chờ thủ kho xác nhận" — hai thứ trái nhau trên một màn. */
                                !duocXacNhanNhanDuHangCuaHoSo(dn, nguoiDung, quyen)) ||
                                (daKhoXacNhan &&
                                  !po.xacNhanTruongBP &&
                                  !duocDuyetHoanThanhDon)) && (
                                <p className="text-xs text-text-desc">
                                  {daKhoXacNhan
                                    ? /* Từ 22/08/2026 người duyệt có thể là nhân viên phụ trách,
                                         nên câu chờ không được chỉ nêu trưởng bộ phận. */
                                      "Đang chờ nhân viên phụ trách hoặc trưởng bộ phận xác nhận hoàn thành."
                                    : "Đang chờ kho xác nhận đã nhận đủ hàng."}
                                </p>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })(),
                /* Bước ⑥ nhận hóa đơn nhà cung cấp, chứng chỉ chất lượng, biên bản nghiệm thu.
                   ⚠️ KHÔNG thay cho tệp phiếu giao nhận. Luật "mỗi lần giao phải có phiếu mới
                   được xác nhận hoàn thành" (`vuongMacXacNhanKho`) kiểm TỪNG phiếu nhận hàng
                   qua `tepPhieuGiao`, gắn tệp ở đây không gỡ được vướng mắc đó — và không được
                   để nó gỡ, nếu không luật thành vô nghĩa. */
                /**
                  * ❌ ĐÃ BỎ Ô "Phiếu giao hàng · Bắt buộc" CỦA NHÁNH PHÒNG BAN — Sếp 15/09/2026,
                  * ảnh chụp bản chạy thật (hồ sơ `DMH260009`, hồ sơ phòng ban), khoanh đỏ đúng ô
                  * này và ghi: ***"trường này đang bị dư => bỏ"***.
                  *
                  * 🔴 SẾP ĐÚNG, VÀ ĐÂY LÀ LÝ DO ĐO ĐƯỢC CHỨ KHÔNG PHẢI SUY ĐOÁN: ô này sinh ra
                  * sáng 15/09/2026, khi nhánh phòng ban **chưa có** đường ghi phiếu nhận hàng nào —
                  * lúc đó nó là chỗ duy nhất để tờ phiếu giao hàng vào được hồ sơ. Chiều cùng ngày
                  * hộp **"Ghi nhận giao hàng"**
                  * (`1-giao-dien/thanh-phan-nghiep-vu/hop-ghi-nhan-giao-hang.tsx`) ra đời và đã
                  * **bắt buộc** đính kèm phiếu giao hàng cho TỪNG lần giao
                  * (`vuongMacGhiNhanGiaoHangPhongBan` điều kiện ④, `3-du-lieu/kho-du-lieu.tsx`).
                  * Từ giây phút đó ô này bắt người dùng nộp **lần thứ hai cùng một tờ phiếu** — đúng
                  * chữ "dư" của Sếp. Ảnh Sếp gửi cho thấy rõ: khối ĐẦU VÀO đã hiện *"Phiếu giao
                  * nhận lần 1 · <tệp>.jpg"* và bảng phiếu nhận đã hiện *"Có phiếu giao nhận"*.
                  *
                  * ✅ ĐƯỜNG CÒN LẠI ĐỂ TỆP PHIẾU GIAO HÀNG VÀO APP — bỏ ô KHÔNG làm mất bằng chứng:
                  *   ① **Hộp "Ghi nhận giao hàng"** ở bảng tiến độ PO (bước ⑥) — đường CHÍNH. Tệp
                  *      gắn vào `PhieuNhanHang.tepPhieuGiao` của đúng lần giao đó, và luật
                  *      11/08/2026 (`tinh-toan.ts` → `vuongMacXacNhanKho`) canh từng phiếu một.
                  *      Đây là chỗ đúng hơn hẳn ô cũ: ô cũ gom mọi lần giao vào một danh sách
                  *      chung, không nói được tờ nào của lần giao nào.
                  *   ② **Ô đính kèm bổ sung** trên từng phiếu đã ghi (`dinhKemPhieuGiao`) — dành cho
                  *      phiếu cũ còn thiếu tệp.
                  *   ③ **Khu đính kèm chung của bước ⑥** ngay dưới đây — vẫn ghi được ghi chú
                  *      "Phiếu giao hàng", nên hồ sơ lỡ đi đường cũ vẫn được `coPhieuGiaoHangPhongBan`
                  *      nhận ra. Không hồ sơ nào đang chạy bị kẹt vì lần bỏ ô này.
                  *
                  * 📌 KHÔNG XOÁ `BUOC_DINH_KEM_PHIEU_GIAO_HANG` / `NHAN_TEP_PHIEU_GIAO_HANG` /
                  * `tepPhieuGiaoHangPhongBan` / `coPhieuGiaoHangPhongBan` trong
                  * `2-quy-trinh/chung-tu-cuoi-quy-trinh.ts`: `vuongMacHoanThanhQuyTrinh` và
                  * `xacDinhGiaiDoan` vẫn gọi, và chúng còn là đường đọc dữ liệu cũ (đường ③). Xem
                  * khối chú thích tại chỗ khai báo.
                  */
                khuDinhKem: (
                  <KhuDinhKemGiaiDoan
                    deNghi={dn}
                    maGiaiDoan="nhan_hang"
                    duocSua={duocSuaTepBuoc}
                    khoa={hoSoDaDong}
                  />
                ),
              },

              /**
               * ★ BƯỚC "HỒ SƠ THANH TOÁN" — gộp từ hai bước cũ.
               *
               * 📌 Ban lãnh đạo 22/08/2026 đặt ra hai bước riêng (*Hóa đơn VAT* và *UNC (nếu có)*),
               * rồi 23/08/2026 chốt: *"Gộp 2 mục này lại thành 1 'Hồ sơ thanh toán'"*. Luật giữ
               * nguyên, chỉ gộp chỗ hiển thị — hai chứng từ này thuộc cùng một việc.
               *
               * ★★★ BƯỚC NÀY KHÔNG CÒN CÔNG VIỆC BẮT BUỘC NÀO — Sếp 15/09/2026.
               *
               * Trước đó bước ⑧ có một ô tích bắt buộc *"Đã xử lý ủy nhiệm chi (hoặc đơn này không
               * cần)"* (`unc_xong`, Ban lãnh đạo 23/08/2026). Sếp khoanh đỏ đúng khối
               * `KẾT QUẢ → DANH SÁCH CÔNG VIỆC` ở đây và ghi ***"bỏ mục này, ko cần thiết"***, rồi
               * sau khi được báo đó là việc bắt buộc: ***"bỏ và thiết lập lại luật mới"***.
               *
               * 👉 HỆ QUẢ TRÊN MÀN HÌNH: `themDanhSachCongViec` trả `null` cho khối này (không còn
               * việc nào), nên `noiDungNghiepVu` để trống và **cả khối KẾT QUẢ tự không vẽ ra** —
               * đúng luật "rỗng thì không vẽ cả nhãn" ở `khoi-dau-vao-theo-giai-doan.tsx`.
               * ⚠️ Trừ khi bước TRƯỚC còn việc treo: khi ấy cụm việc vẫn hiện ở đây làm dòng chỉ
               * đường, và đó là hành vi đúng — đừng chặn nó.
               *
               * 🔴 ĐIỀU KIỆN ĐÓNG HỒ SƠ KHÔNG ĐỔI: vẫn phải có **Hợp đồng** và **Hóa đơn VAT**
               * (`vuongMacHoanThanhQuyTrinh`). Hai ô đính kèm đó ngay bên dưới, và hai ô Ủy nhiệm
               * chi / Phiếu chi vẫn còn nguyên ở dạng *"Nếu có"*.
               */
              {
                ma: "ho_so_thanh_toan",
                nhan: NHAN_GIAI_DOAN.ho_so_thanh_toan.nhan,
                dangODay: giaiDoan === "ho_so_thanh_toan",
                conThieu: conThieuCuaBuoc("ho_so_thanh_toan"),
                /**
                 * ❌ ĐÃ BỎ DANH SÁCH TRƯỜNG ĐẦU VÀO — Sếp 15/09/2026: *"Bố cục lại bước 8, đang bị
                 * trùng lặp bộ hồ sơ đầy đủ của thanh toán"*.
                 *
                 * Trước đây chỗ này liệt kê tệp **Hóa đơn VAT** rồi **Ủy nhiệm chi**, làm hai
                 * chứng từ đó hiện BA lần trên cùng một màn: ở đây · ở ô nộp tệp bên dưới · trong
                 * khối "Bộ hồ sơ thanh toán".
                 *
                 * 🔴 ĐÃ ĐO TRƯỚC KHI BỎ — bỏ được vì nó là TẬP CON THẬT SỰ của ô nộp tệp, không
                 * mất thông tin nào:
                 *   · ở đây: nhãn + tên tệp, in bằng `giaTri` nên là **CHỮ TRƠN, bấm không được**;
                 *   · ô nộp (`OChungTuBatBuoc` → `ODinhKemTep`): tên tệp + **kích thước + người
                 *     tải + thời điểm**, bấm XEM được, TẢI được, thay / gỡ / thêm bản được.
                 * 👉 Giữ lại chính là cái bẫy `lien-ket-tep.tsx` đã ghi: in tên tệp dạng chữ
                 *    thường khiến người dùng tưởng app chưa lưu nội dung.
                 *
                 * 🔴 CÒN MỘT LÝ DO NGHĨA: bước ⑧ là nơi hai chứng từ đó được NỘP VÀO, nên chúng là
                 * KẾT QUẢ của bước, không phải ĐẦU VÀO. Xếp vào khối "ĐẦU VÀO" là nói sai vai trò.
                 *
                 * 📌 Mảng rỗng là trạng thái ĐÃ CÓ SẴN trong app, không phải ca lạ: bước ⑥ cũng ra
                 * rỗng khi chưa phiếu giao nào có tệp. Khối sẽ ghi *"Giai đoạn này chưa có dữ liệu
                 * nhập vào"* và nhãn gập bỏ con số (`anSoTruong` trong
                 * `khoi-dau-vao-theo-giai-doan.tsx`) — đúng như các bước khác.
                 *
                 * 📌 KHÔNG ảnh hưởng số thứ tự 01→N của cả trang: các trường đánh số liên tục theo
                 * thứ tự mảng, mà bước ⑧ là khối CUỐI CÙNG — không còn bước nào sau để bị dồn số.
                 */
                truong: [],
                khuDinhKem: (
                  <div className="flex flex-col gap-(--hp-md-card-gap)">
                    {/**
                      * ❌ ĐÃ BỎ BẢN THỨ HAI CỦA NÚT "HOÀN THÀNH QUY TRÌNH" — Sếp 15/09/2026:
                      * *"Bỏ nút này vì ở dưới đã có rồi"* (ảnh khoanh đỏ cả hai nút trên một màn).
                      *
                      * 🔴 ĐÂY LÀ LỖI LẶP THẬT, KHÔNG PHẢI HAI CHỨC NĂNG KHÁC NHAU: bản bị bỏ và bản
                      * còn lại ở cuối khối giống nhau từng chi tiết — cùng điều kiện hiện
                      * (`quyen.xacNhanTruongBP && !hoSoDaDong`), cùng điều kiện khoá
                      * (`vuongMacHoanThanhQuyTrinh`), cùng `onClick={() => setHoiHoanThanh(true)}`,
                      * cùng câu lý do. Người dùng thấy hai nút giống hệt nhau trong một khối sẽ
                      * ngờ mình bấm nhầm cái nào.
                      *
                      * ⚠️ ĐẢO MỘT PHẦN chỉ đạo 27/08/2026 (*"nút hoàn thành quy trình đưa ra vị trí
                      * dễ nhìn"*) — lúc đó nút được THÊM lên đầu khối, nhưng bản ở cuối **không
                      * được bỏ đi**, nên thành hai. Nay giữ bản CUỐI theo đúng chỉ đạo mới của Sếp:
                      * người dùng đọc xong bộ chứng từ đã gom, nộp nốt các tệp còn thiếu, rồi mới
                      * bấm đóng hồ sơ — đúng thứ tự làm việc.
                      *
                      * 📌 Cập nhật 15/09/2026: khối "Bộ hồ sơ thanh toán" đã dời LÊN ĐẦU bước ⑧,
                      * nên nút này không còn đứng ngay sau nó nữa — giữa hai thứ là bốn ô nộp tệp.
                      * Thứ tự đọc–làm–đóng vẫn đúng, chỉ câu mô tả vị trí là phải sửa theo.
                      */}

                    {/* ★★ TRƯỜNG "KẾT QUẢ" — CHỨNG TỪ GOM TỪ CÁC BƯỚC TRƯỚC (Ban lãnh đạo
                        26/08/2026: *"Tạo thêm 1 trường Kết quả. Sẽ được link kết quả từ các bước
                        trên"*).

                        ★★★ Sếp 15/09/2026 (LƯỢT THỨ TƯ TRONG NGÀY): ***"Bố cục lại này theo đúng
                        thứ tự a đã cung cấp, sao e làm nó lộn xộn vậy"***.

                        🔴 CHỖ ĐÃ LÀM SAI — ĐỌC ĐỂ KHÔNG DỰNG LẠI: Sếp đưa MỘT danh sách liền mạch.
                        Bản trước bẻ làm hai cụm — khối bộ hồ sơ bày 1 · 2 · 4 · 5, rồi BỐN ô nộp
                        tệp (Hợp đồng · Hóa đơn VAT · Ủy nhiệm chi · Phiếu chi) đứng RỜI ngay dưới
                        đây, không mang số nào. Trên màn hình số nhảy cóc rồi cụt.

                        ✅ NAY BỐN Ô NỘP ĐÓ ĐI VÀO ĐÚNG DÒNG SỐ CỦA CHÚNG, truyền xuống qua
                        `oNopTheoMuc`. Chúng **KHÔNG BỊ BỎ**, chỉ đổi chỗ đứng — mọi prop (quyền,
                        khóa, tệp đã có, nhãn Bắt buộc/Nếu có) giữ nguyên từng chữ.
                        🔴 Riêng *Phiếu chi* thì đây là chỗ nộp DUY NHẤT trong cả app (§3.4b) — bỏ
                        nó khỏi bảng này là chức năng mồ côi.

                        📌 Kiểu của `oNopTheoMuc` là `Record` ĐẦY ĐỦ, nên thiếu một ô là không biên
                        dịch được. Đừng hạ xuống `Partial` cho "dễ sửa".

                        📌 ĐÃ BỎ `<div className="border-b border-divider pb-3">` bọc ngoài: vạch
                        ấy sinh ra để ngăn hai cụm, mà nay chỉ còn MỘT cụm. Đừng để lại vạch mồ côi.

                        📌 Khối vẫn đứng TRƯỚC nút "Hoàn thành quy trình" ở cuối — thứ tự
                        đọc → làm → đóng hồ sơ giữ nguyên như chỉ đạo 15/09/2026 buổi trước. */}
                    <KhoiBoHoSoThanhToan
                      deNghi={dn}
                      poCuaDeNghi={poLienQuan}
                      phieuCuaDeNghi={phieuLienQuan}
                      baoGiaCuaDeNghi={baoGiaLienQuan}
                      xemGia={quyen.xemGia}
                      oNopTheoMuc={{
                        /**
                         * ❌❌ ĐÃ BỎ Ô ĐÍNH KÈM **HỢP ĐỒNG** Ở BƯỚC ⑧ — Sếp 16/09/2026, khoanh đỏ
                         * đúng nút vàng *"⚠ Hợp đồng"* trong dòng số 3 của khối "Bộ hồ sơ thanh
                         * toán" và ghi ***"Bỏ nút đính kèm này, hợp đồng sẽ được link từ bước 3
                         * xuống"***. ĐỌC HẾT KHỐI NÀY TRƯỚC KHI ĐỊNH DỰNG LẠI Ô ĐÓ.
                         *
                         * Thứ bị bỏ: một `<OChungTuBatBuoc maGiaiDoan={BUOC_DINH_KEM_HOP_DONG}
                         * nhanO={NHAN_TEP_HOP_DONG} tieuDe={TEN_HIEN_HOP_DONG} batBuoc … />` —
                         * thêm 14/09/2026 để người đứng ở trạm cuối khỏi phải mò ngược hai khối
                         * mới thấy chỗ đính.
                         *
                         * ✅ ĐÃ ĐO TRƯỚC KHI BỎ — KHÔNG LÀM MỒ CÔI CHỨC NĂNG (CLAUDE.md §3.4b):
                         * ô hợp đồng **vẫn còn ở bước ④ Lập đơn mua hàng** (cùng ngăn, cùng nhãn,
                         * kèm hai nút chọn lý do), và **còn một ô nữa ở bước ⑤**. Bỏ ô ở đây là bỏ
                         * đường THỨ BA tới cùng một tệp, không bỏ chức năng nào.
                         *
                         * 🔴 ĐÃ SỬA KÈM CÂU CHẶN CỦA NÚT "Hoàn thành quy trình" trong cùng lượt.
                         * Nó từng ghi *"Đính kèm ngay ở ô Hợp đồng trong khối này"* — để nguyên là
                         * đuổi người dùng đi tìm một cái nút không còn trên màn hình (CLAUDE.md
                         * §3.5). Nay câu đó chỉ về bước Lập đơn mua hàng. **Hai thứ phải luôn chỉ
                         * cùng một chỗ**: ai dựng lại ô ở đây thì phải sửa ngược câu chặn.
                         *
                         * 📌 KIẾN THỨC CỦA KHỐI CŨ VẪN ĐÚNG, GIỮ LẠI ĐỂ KHÔNG AI HIỂU NHẦM:
                         *   · Ba ô hợp đồng (bước ④, ⑤, và ô vừa bỏ ở ⑧) **cùng nhìn vào MỘT tệp**,
                         *     ghi vào cùng `BUOC_DINH_KEM_HOP_DONG` + `NHAN_TEP_HOP_DONG`.
                         *   · **Hợp đồng vẫn là điều kiện đóng hồ sơ**, nhưng từ 16/09/2026 lời khai
                         *     *"Không có Hợp đồng"* cũng đủ (Sếp: *"Đúng, là điều kiện để đóng hồ
                         *     sơ"*). Luật ở `vuongMacHoanThanhQuyTrinh`, không ở câu chữ nào tại
                         *     đây — bỏ ô này KHÔNG nới luật một chút nào, và `kiem-luat-dung-chung
                         *     .mjs` vẫn canh cả hai chiều.
                         *   · Mục 3 ở bước ⑧ nay **chỉ đọc**: bày tệp, và khi chưa có thì vẫn nói
                         *     rõ trạng thái (*"Bổ sung sau"* → đỏ · *"Không có Hợp đồng"* → trung
                         *     tính, kèm tên người khai). Mất cái nút, không mất thông tin nào.
                         *
                         * ⚠️ Ba ô `hoa_don_vat` · `unc` · `phieu_chi` bên dưới GIỮ NGUYÊN — Sếp
                         * không khoanh chúng. Riêng **Phiếu chi** thì đây là chỗ nộp DUY NHẤT trong
                         * cả app, bỏ là chức năng mồ côi.
                         */
                        /**
                         * ❌❌ Ô **ĐƠN MUA HÀNG** Ở DÒNG SỐ 4 CŨNG ĐÃ BỎ — Sếp 16/09/2026 (lần thứ
                         * hai trong ngày), khoanh đỏ đúng nút vàng *"⚠ Đơn mua hàng"* và ghi
                         * ***"Mục này cũng là link từ bước lập đơn mua hàng xuống, chứ ko phải đính
                         * kèm ở đây · Làm tương tự như phần hợp đồng"***.
                         *
                         * ⚠️ Ô NÀY VỪA ĐƯỢC THÊM SÁNG CÙNG NGÀY theo yêu cầu *"ô nộp riêng ở bước ⑤
                         * và ở bước ⑧ (dòng số 4)"*. Không phải ai làm ẩu — Sếp xem giao diện thật
                         * rồi đổi ý. Ghi lại cả hai mốc để người sau biết luật hiện hành là mốc nào.
                         *
                         * ✅ ĐÃ ĐO TRƯỚC KHI BỎ — KHÔNG MỒ CÔI: ô đính kèm Đơn mua hàng NCC ký vẫn
                         * còn ở **bước ⑤ Tiến hành đặt hàng** (cùng ngăn `BUOC_DINH_KEM_DON_MUA_HANG`,
                         * kèm nút *"Bổ sung sau"*). Bỏ ở đây là bỏ đường thứ hai tới cùng một tệp.
                         *
                         * 📌 Nay dòng 4 chỉ đọc y hệt dòng 3: bày tệp, chưa có thì báo đỏ *"Bổ sung
                         * sau"*. Khác dòng 3 đúng một điểm — mục 4 **không có** lời khai "Không
                         * có…", vì *"PO là chắc chắn có, chỉ là bổ sung sau thôi"* (Sếp 16/09/2026).
                         *
                         * ⚠️ Ba ô `hoa_don_vat` · `unc` · `phieu_chi` bên dưới GIỮ NGUYÊN — Sếp
                         * không khoanh chúng, và **Phiếu chi** thì đây là chỗ nộp DUY NHẤT trong cả
                         * app, bỏ là chức năng mồ côi.
                         */
                        hoa_don_vat: (
                          <OChungTuBatBuoc
                            deNghi={dn}
                            maGiaiDoan={BUOC_DINH_KEM_HO_SO_THANH_TOAN}
                            nhanO={NHAN_TEP_HOA_DON_VAT}
                            tieuDe="Hóa đơn VAT"
                            moTa="Hóa đơn GTGT nhà cung cấp xuất cho đơn hàng này. Bắt buộc phải có mới duyệt hoàn thành được. Đơn tách cho nhiều nhà cung cấp thì thêm từng bản."
                            batBuoc
                            duocSua={duocSuaTepBuoc}
                            khoa={hoSoDaDong}
                            tepDaCo={tepHoaDonVAT(dn)}
                          />
                        ),
                        unc: (
                          <OChungTuBatBuoc
                            deNghi={dn}
                            maGiaiDoan={BUOC_DINH_KEM_HO_SO_THANH_TOAN}
                            nhanO={NHAN_TEP_UNC}
                            tieuDe="Ủy nhiệm chi"
                            /* 🔴 CÂU CŨ GHI *"chỉ cần tích xong việc của bước này"* — đã sửa
                               15/09/2026 vì cái tích đó không còn tồn tại (Sếp bỏ). Để nguyên là
                               chỉ người dùng đi làm một việc không có chỗ nào làm được — đúng lỗi
                               CLAUDE.md §3.5. */
                            moTa="Đơn nào cần chuyển khoản qua ngân hàng thì đính kèm ủy nhiệm chi. Đơn trả tiền ngay thì để trống — ô này không bắt buộc."
                            duocSua={duocSuaTepBuoc}
                            khoa={hoSoDaDong}
                            tepDaCo={tepUNC(dn)}
                          />
                        ),
                        /* ★★ PHIẾU CHI — mục 8 của bộ hồ sơ thanh toán (Ban lãnh đạo 26/08/2026,
                           số thứ tự đổi thành 8 theo danh sách Sếp 15/09/2026).
                           📌 TÙY CHỌN đúng chữ Sếp *"(Nếu có)"*: đơn trả qua ngân hàng thì chứng
                           từ là ủy nhiệm chi ở trên, phiếu chi là của khoản trả bằng tiền mặt. */
                        phieu_chi: (
                          <OChungTuBatBuoc
                            deNghi={dn}
                            maGiaiDoan={BUOC_DINH_KEM_HO_SO_THANH_TOAN}
                            nhanO={NHAN_TEP_PHIEU_CHI}
                            tieuDe="Phiếu chi"
                            moTa="Phiếu chi của khoản trả bằng tiền mặt. Đơn chuyển khoản thì để trống — chứng từ là ủy nhiệm chi ở trên."
                            duocSua={duocSuaTepBuoc}
                            khoa={hoSoDaDong}
                            tepDaCo={tepPhieuChi(dn)}
                          />
                        ),
                        /**
                         * ★★★ MỤC ⑨ *ĐÍNH KÈM KHÁC* — Sếp 16/09/2026: ***"Cần thiết mở thêm để đính
                         * kèm tài liệu khác"***.
                         *
                         * 🔴🔴 `maGiaiDoan={BUOC_DINH_KEM_KHAC}` — **NGĂN RIÊNG, TUYỆT ĐỐI KHÔNG
                         * PHẢI `BUOC_DINH_KEM_HO_SO_THANH_TOAN`.** Đã đo 15/09 và 16/09/2026, ba hệ
                         * quả nếu dùng chung ngăn với ba ô trên:
                         *   ① Hoá đơn VAT · UNC · Phiếu chi hiện LẠI lần nữa trong mục 9;
                         *   ② nút *"Gỡ"* của khu tự do **xoá được Hoá đơn VAT thật** → hồ sơ không
                         *      đóng được nữa (`vuongMacDuyetHoanThanhDeNghi`);
                         *   ③ hạn mức 5 tệp tính CHUNG cả ngăn, mục 9 còn 1–2 chỗ rồi báo đầy.
                         *
                         * ★★ ĐỔI SANG `OChungTuBatBuoc` NGÀY 16/09/2026 — Sếp, khoanh đỏ đúng mục 9:
                         * ***"Đồng bộ lại giao diện đính kèm cho giống nhau, sao mục này đính kèm
                         * giao diện lại khác các bước kia"***.
                         *
                         * ⚠️ CHÚ THÍCH CŨ TẠI ĐÂY NÓI NGƯỢC, chép lại để không ai khôi phục: nó viết
                         * *"DÙNG `KhuDinhKemGiaiDoan` CHỨ KHÔNG PHẢI `OChungTuBatBuoc`: ô có tên đòi
                         * một nhãn cố định, mà mục 9 nhận tài liệu gì cũng được"*. Lý lẽ đó **không
                         * sai về kỹ thuật** — nhưng cái giá của nó là mục 9 bày ra một giao diện
                         * thứ hai giữa một danh sách 9 mục, và đó mới là thứ người dùng nhìn thấy.
                         *
                         * 📌 "Nhãn cố định" hoá ra không phải vấn đề: `OChungTuBatBuoc` tự đánh số
                         * bản thứ hai trở đi (*"Đính kèm khác (2)"*), y như Hoá đơn VAT khi đơn tách
                         * cho nhiều nhà cung cấp. Tài liệu gì cũng đính được như cũ.
                         *
                         * 🔴 `batBuoc` KHÔNG truyền ⇒ nhãn *"Nếu có"*, giữ đúng trạng thái cũ của
                         * mục 9. Truyền `batBuoc` là biến tài liệu phụ thành điều kiện đóng hồ sơ.
                         *
                         * 📌 `duocSuaTepBuoc` (không phải `duocSuaHopDong`): đây là tài liệu phụ
                         * *"Nếu có"*, không phải chứng từ có chữ ký, nên không siết quyền như hợp
                         * đồng / đơn mua hàng.
                         */
                        dinh_kem_khac: (
                          <OChungTuBatBuoc
                            deNghi={dn}
                            maGiaiDoan={BUOC_DINH_KEM_KHAC}
                            nhanO={TEN_HIEN_DINH_KEM_KHAC}
                            tieuDe={TEN_HIEN_DINH_KEM_KHAC}
                            duocSua={duocSuaTepBuoc}
                            khoa={hoSoDaDong}
                            tepDaCo={tepDinhKemKhac(dn)}
                          />
                        ),
                      }}
                    />
                    {/* ★★★ ĐÃ BỎ Ô CẢNH BÁO "chưa có Hóa đơn VAT nên chưa tích được UNC" — Sếp
                        15/09/2026 bỏ hẳn cái tích mà nó giải thích (*"bỏ mục này, ko cần thiết"*
                        → *"bỏ và thiết lập lại luật mới"*). Giữ lại là một dòng cảnh báo nói về
                        một ô tích không còn trên màn hình.
                        📌 Việc thiếu Hóa đơn VAT vẫn được báo đủ chỗ: viền đỏ khối bước, nút
                        "Hoàn thành quy trình" khóa kèm lý do ngay dưới đây. */}

                    {/**
                      * ★ NÚT "HOÀN THÀNH QUY TRÌNH" — Ban lãnh đạo 22/08/2026: *"Thêm nút bấm hoàn
                      * thành quy trình"*.
                      *
                      * 📌 ĐẶT Ở ĐÂY vì đây là trạm cuối trước cột Hoàn thành — mọi chứng từ đã đủ
                      * ở đúng chỗ này. Đặt ở cột Hoàn thành thì phải vào được cột đó mới bấm được,
                      * mà vào cột đó chính là việc nút này làm.
                      *
                      * 🔴 Chỉ vai trò xác nhận hoàn thành mới thấy nút. Điều kiện thật do
                      * `vuongMacHoanThanhQuyTrinh` giữ (tầng ghi cũng hỏi lại hàm đó) — ở đây chỉ
                      * hiện lý do cho người dùng đọc trước khi bấm.
                      */}
                    {quyen.xacNhanTruongBP && !hoSoDaDong && (
                      <div className="flex flex-col gap-2 border-t border-divider pt-3">
                        {/* 🔴 PHẢI TRUYỀN `deNghi` (tham số thứ 3) — Sếp 15/09/2026 chốt: phiếu gốc
                            KHÔNG đóng được khi còn bản nhân bản chưa xong. Thiếu tham số thì hàm cư
                            xử y như trước (cố ý, để nơi gọi cũ không vỡ), nghĩa là nút vẫn SÁNG và
                            người dùng chỉ biết bị chặn sau khi đã bấm.
                            📌 Không lọt được — tầng ghi hỏi lại đúng hàm này với đủ tham số. Nhưng
                            khoá nút kèm lý do ngay tại chỗ mới là cách nói thật với người dùng. */}
                        {vuongMacHoanThanhQuyTrinh(dn, tienDoDong, deNghi) !== null ? (
                          <p className="text-xs text-warning-soft">
                            Chưa hoàn thành được:{" "}
                            {vuongMacHoanThanhQuyTrinh(dn, tienDoDong, deNghi)}
                          </p>
                        ) : (
                          <p className="text-xs text-text-desc">
                            Mọi mặt hàng đã nhận đủ, chứng từ đã đủ. Bấm để đóng hồ sơ và chuyển
                            sang bước “{NHAN_GIAI_DOAN.hoan_thanh.nhan}”.
                          </p>
                        )}
                        <Button
                          size="sm"
                          className="w-fit"
                          disabled={vuongMacHoanThanhQuyTrinh(dn, tienDoDong, deNghi) !== null}
                          onClick={() => setHoiHoanThanh(true)}
                        >
                          <BadgeCheck className="size-4" aria-hidden />
                          Hoàn thành quy trình
                        </Button>
                      </div>
                    )}
                  </div>
                ),
              },
              /**
               * 🔴 CHỈ HIỆN BƯỚC ĐÃ TỚI LƯỢT — Ban lãnh đạo 19/08/2026: *"Bước 1 thì chỉ hiện
               * trường thông tin của bước 1. Tương tự cho các bước sau"*.
               *
               * Trước đó trang bày cả sáu khối, kể cả bước còn trống trơn vì chưa tới lượt —
               * người xem phải cuộn qua một dãy khối rỗng mới tới bước đang làm.
               *
               * 📌 GIỮ CẢ BƯỚC ĐÃ ĐI QUA, chỉ ẩn bước CHƯA TỚI. Đây là chỗ tôi hiểu rộng hơn câu
               * chữ một chút, và có lý do: bước đã qua đang GIỮ DỮ LIỆU THẬT (bảng báo giá đã
               * duyệt, đơn hàng đã lập, tệp chứng từ). Ẩn hẳn là hồ sơ mất đường tra cứu — đứng ở
               * bước ⑤ thì không cách nào xem lại căn cứ duyệt giá ở bước ③. Bước chưa tới lượt
               * thì ngược lại: chắc chắn rỗng, hiện ra chỉ làm rối.
               *
               * ⚠️ Nếu Ban lãnh đạo muốn ĐÚNG MỘT bước duy nhất thì đổi `giaiDoanDaToiLuot(...)`
               * thành `g.ma === giaiDoan` — một dòng, và luật thứ tự vẫn nằm ở `2-quy-trinh/`.
               */
            ].filter((g) => giaiDoanDaToiLuot(g.ma, giaiDoan)))}
          />

          {/* 📌 15/08/2026 — Ban lãnh đạo:
                · *"bố cục lại sang tab phải"* → khối **Người theo dõi** đã dời sang cột phải
                · *"mục này đã có trong tab theo dõi đề nghị thì ở đây ko cần hiển thị"* →
                  **Timeline ngang** (Duyệt → Đã phân bổ → Đã lên đơn → Đang giao → Nhận đủ)
                  đã BỎ, vì màn "Theo dõi đề nghị" đã vẽ đúng thứ đó.

             📌 16/08/2026: ba khối làm việc (phân bổ · báo giá · đơn hàng) không còn xếp
             rời ở đây nữa — đã vào trong đúng giai đoạn của chúng ở khối ngay phía trên.
             Cột trái giờ còn: thông tin đề nghị · các giai đoạn (kèm phần làm việc) ·
             danh sách công việc của bước đang đứng · trao đổi. */}


      {/* ★ TRAO ĐỔI — thẻ Bình luận + thẻ Lịch sử hoạt động, đặt ở CỘT GIỮA (Ban lãnh đạo
          15/08/2026: *"mục bình luận này e kéo ra tab giữa luôn"*).

          🔴 Ban đầu đặt ở cột phải cùng khối Người theo dõi, nhưng cột đó chỉ rộng ~300px:
          ô soạn bị bóp còn hai chữ một dòng, nút "Gửi bình luận" tràn ra ngoài khung, câu
          hướng dẫn dài hơn cả ô nhập. Bình luận là chỗ NGƯỜI TA GÕ, không phải thông tin tra
          cứu — nó thuộc vùng làm việc chính. */}
      <KhoiTraoDoi
        deNghi={dn}
        nguoiDung={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
        onGui={(noiDung, tep, traLoiChoId) =>
          vietBinhLuan(
            dn.id,
            { uid: nguoiDung.uid, ten: nguoiDung.tenHienThi },
            noiDung,
            tep,
            traLoiChoId,
          )
        }
        onSua={(binhLuanId, noiDungMoi, tepThem, idTepGo) => {
          const loi = suaBinhLuan(
            dn.id,
            binhLuanId,
            { uid: nguoiDung.uid, ten: nguoiDung.tenHienThi },
            noiDungMoi,
            tepThem,
            idTepGo,
          );
          // Bị chặn thì nói ĐÚNG LÝ DO — luật ở tầng dữ liệu, không đoán lại ở đây.
          if (loi) toast.error("Chưa sửa được bình luận", { description: loi });
        }}
        // Trưởng bộ phận xem lại được nội dung của bài đã thu hồi từ trước.
        duocXemBaiThuHoi={quyen.xacNhanTruongBP}
      />
        </div>

        {/* Cột phải — thời hạn tổng, tiến trình từng giai đoạn, hoạt động chính, lịch sử.
            ⚠️ KHÔNG dùng `sticky` nữa: cột này giờ dài (có cả lịch sử) nên dán cứng vào
            đầu trang sẽ bị cắt mất phần dưới, cuộn không tới. */}
        <aside className="flex min-w-0 flex-col gap-(--hp-md-section)">
          <CotThongTinDeNghi
            deNghi={dn}
            giaiDoan={giaiDoan}
            soNgayConLai={conLai}
            moc={mocGiaiDoan}
            // Hạn chuẩn từng bước lấy từ cấu hình quy trình (sửa được ở trang Cài đặt),
            // KHÔNG viết cứng trong component hiển thị.
            hanGioTheoBuoc={cauHinh.hanGioTheoBuoc}
          />

          {/* ★ NGƯỜI THEO DÕI — cột phải, NGAY TRÊN khối trao đổi (Ban lãnh đạo 15/08/2026:
              *"mục người theo dõi này đưa xuống dưới, trên mục lịch sử hoạt động"*).
              Hợp lý: "ai đang nắm hồ sơ" đứng liền trên chỗ những người đó trao đổi và chỗ
              ghi lại họ đã làm gì.
              ⚠️ Có tên ở đây KHÔNG mở khóa xem giá (nguyên tắc dữ liệu số 3). */}
          <KhoiNguoiTheoDoi deNghi={dn} />
        </aside>
      </div>

      {/* HỘP CHUYỂN TIẾP — trưởng bộ phận bàn giao việc cho nhân viên đã phân bổ */}
      <Dialog open={moChuyenTiep} onOpenChange={setMoChuyenTiep}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chuyển tiếp {dn.code}</DialogTitle>
            <DialogDescription>
              Báo cho nhân viên đã được phân bổ biết đã tới lượt họ làm các bước sau.
            </DialogDescription>
          </DialogHeader>

          {nguoiSeNhan.length === 0 ? (
            <p className="rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
              Chưa phân bổ dòng nào cho ai nên chưa chuyển tiếp được. Phân bổ ít nhất một
              dòng vật tư ở bảng bên dưới trước.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1 rounded-lg bg-muted p-(--hp-md-row-pad) text-sm">
                <span className="text-xs text-text-desc">Chuyển tiếp cho</span>
                <span className="font-medium text-text-primary">{nguoiSeNhan.join(", ")}</span>
              </div>

              {/* Cảnh báo mềm, KHÔNG chặn — giống hộp xác nhận kéo thả ở màn danh sách */}
              {soDongChuaPhanBo > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-soft" aria-hidden />
                  <span>
                    Còn <strong>{soDongChuaPhanBo} dòng</strong> chưa phân bổ cho ai — những
                    dòng đó sẽ không có người làm tiếp.
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="loi-nhan">Lời nhắn kèm theo (không bắt buộc)</Label>
                <Input
                  id="loi-nhan"
                  
                  value={loiNhan}
                  onChange={(e) => setLoiNhan(e.target.value)}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMoChuyenTiep(false)}>
              Hủy
            </Button>
            <Button
              disabled={nguoiSeNhan.length === 0}
              onClick={() => {
                const daGui = chuyenTiepChoNhanVien(dn.id, nguoiDung.tenHienThi, loiNhan);
                setMoChuyenTiep(false);
                setLoiNhan("");
                if (daGui.length > 0) {
                  toast.success("Đã chuyển tiếp", {
                    description: `${dn.code} đã báo tới ${daGui.join(", ")}.`,
                  });
                }
              }}
            >
              <Forward className="size-4" aria-hidden />
              Chuyển tiếp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 📌 ĐÃ BỎ hộp "Lập bảng báo giá cho đề nghị này?" (Ban lãnh đạo 17/08/2026 khoanh nút
          mở nó và ghi *"bỏ nút này"*). Bỏ nút mà để hộp lại là mã chết — đúng thứ đang phải
          dọn ở hộp "Chuyển tiếp".

          🔴 CHỐT KIỂM KHÔNG MẤT THEO: việc lập bảng báo giá chuyển sang menu ⋯ trên thẻ ở
          bảng quy trình, và ở đó nó gọi `xuLyTha` — cùng đường với kéo thả, nên vẫn qua
          `quyetDinhKeoTha` (kiểm bước đang đứng đã xong chưa) và vẫn mở hộp xác nhận. */}

      {/* Hỏi trước khi tích / bỏ tích công việc bắt buộc — xem lý do ở khối "Danh sách công
          việc". Cờ mở tách khỏi nội dung (`mo` riêng, `hoiTichViec` riêng) đúng cách
          `HopXacNhan` yêu cầu: xóa nội dung cùng lúc với đóng sẽ tháo cây con giữa lúc hiệu
          ứng đóng đang chạy và để lại lớp mờ kẹt trên màn hình. */}
      {/* ★ TỪ 13/09/2026 HỘP NÀY CHỈ CÒN CHẠY Ở CHIỀU **BỎ TÍCH**. Chiều tích ghi thẳng, không
          hỏi (Ban lãnh đạo chốt phạm vi — xem chú thích tại ô tick ở trên).
          📌 CỐ Ý GIỮ NGUYÊN cả hai nhánh `tich` / không `tich` trong hộp: bật lại chiều tích chỉ
          là đổi một dòng ở ô tick, không phải dựng lại hộp. Các nhánh `hoiTichViec.tich === true`
          bên dưới hiện không chạy — đừng đọc nhầm là mã hỏng rồi dọn đi. */}
      <HopXacNhan
        mo={hoiTichViec !== null}
        /* ⚠️ Viết `!hoiTichViec.tich` chứ KHÔNG viết `hoiTichViec?.tich === false`: dạng so
           sánh nghiêm ngặt kia cho ra `false` khi `hoiTichViec` là `null` (lúc hộp đóng) —
           đúng — nhưng đã đo thật trên máy và nút vẫn ra nền xanh đặc của biến thể mặc định
           thay vì tông cảnh báo. Bỏ tích là việc CHẶN đề nghị đi tiếp, nút phải mang tông
           nguy hiểm. */
        nguyHiem={hoiTichViec !== null && !hoiTichViec.tich}
        tieuDe={
          hoiTichViec?.tich ? "Xác nhận công việc đã xong?" : "Bỏ tích công việc này?"
        }
        moTa={
          hoiTichViec ? (
            <>
              <span className="font-medium text-text-primary">{hoiTichViec.cv.ten}</span> —{" "}
              bước {NHAN_GIAI_DOAN[giaiDoan]?.nhan ?? giaiDoan} của hồ sơ {dn.code}.
            </>
          ) : undefined
        }
        /* Nói HỆ QUẢ THẬT, không nói chung chung: việc bắt buộc chưa xong thì
           `vuongMacSangBuocSau` chặn không cho đề nghị đi tiếp. Đó mới là lý do phải hỏi. */
        canhBao={
          hoiTichViec?.cv.batBuoc
            ? hoiTichViec.tich
              ? "Đây là công việc bắt buộc. Tích xong thì đề nghị mới chuyển sang bước sau được, và việc này vào nhật ký hồ sơ kèm tên bạn."
              : "Đây là công việc bắt buộc. Bỏ tích thì đề nghị KHÔNG chuyển sang bước sau được nữa, kể cả khi đã ở bước xa hơn."
            : "Việc này vào nhật ký hồ sơ kèm tên bạn."
        }
        nhanDongY={hoiTichViec?.tich ? "Xác nhận đã xong" : "Bỏ tích"}
        onDong={() => setHoiTichViec(null)}
        onDongY={() => {
          if (!hoiTichViec) return;
          /* 🔴 PHẢI ĐỌC KẾT QUẢ TRẢ VỀ (22/08/2026). Từ nay tầng ghi có thể TỪ CHỐI — việc "đã
             xử lý ủy nhiệm chi" đòi có Hóa đơn VAT trước. Báo thành công vô điều kiện là hứa hộ
             một việc chưa xảy ra, đúng lỗi mà quy ước dự án §3.5 cấm. */
          const loi = danhDauCongViecGiaiDoan(
            dn.id,
            hoiTichViec.cv,
            /* 🔴 Bước CỦA CHÍNH VIỆC ĐÓ, không phải bước đang đứng — xem chú thích ở `hoiTichViec`. */
            hoiTichViec.buoc,
            hoiTichViec.tich,
            nguoiDung.tenHienThi,
          );
          if (loi !== null) {
            toast.error("Chưa tích được việc này", { description: loi });
            return;
          }
          toast.success(
            hoiTichViec.tich
              ? `Đã xác nhận xong: ${hoiTichViec.cv.ten}`
              : `Đã bỏ tích: ${hoiTichViec.cv.ten}`,
          );
        }}
      />

      {/* ★ HỎI TRƯỚC KHI ĐÓNG HỒ SƠ — Ban lãnh đạo 22/08/2026 (*"Thêm nút bấm hoàn thành quy
          trình"*). Đóng hồ sơ là việc không lùi lại được bằng đường thường, nên phải hỏi. */}
      <HopXacNhan
        mo={hoiHoanThanh}
        tieuDe="Hoàn thành quy trình mua hàng?"
        moTa={`Đề nghị ${dn.code} sẽ chuyển sang bước “${NHAN_GIAI_DOAN.hoan_thanh.nhan}” và hồ sơ đóng lại.`}
        canhBao="Sau khi hoàn thành, hồ sơ không nhận thêm chứng từ và không sửa được nữa."
        nhanDongY="Hoàn thành quy trình"
        onDong={() => setHoiHoanThanh(false)}
        onDongY={() => {
          setHoiHoanThanh(false);
          /* Đọc kết quả: tầng ghi kiểm lại đủ năm điều kiện, có thể từ chối. */
          const loi = hoanThanhQuyTrinh(dn.id, nguoiDung.tenHienThi);
          if (loi !== null) {
            toast.error("Chưa hoàn thành được", { description: loi });
            return;
          }
          toast.success("Đã hoàn thành quy trình", {
            description: `${dn.code} — hồ sơ đóng lại và chuyển sang bước “${NHAN_GIAI_DOAN.hoan_thanh.nhan}”.`,
          });
        }}
      />

      {/* ★ HỎI TRƯỚC KHI TRÌNH XÉT DUYỆT — chuyển bước là việc không lùi lại được
          (nguyên tắc Ban lãnh đạo 10/08/2026), và sau khi trình thì không nhập thêm giá được. */}
      <HopXacNhan
        mo={hoiTrinhXetDuyet !== null}
        tieuDe="Trình trưởng bộ phận xét duyệt?"
        /* 🔴 `hoiTrinhXetDuyet` nay giữ **id ĐỀ NGHỊ**, không phải id hồ sơ báo giá (sửa
           20/08/2026): giao diện không còn cần biết mã hồ sơ, vì hồ sơ do app tự lập. */
        moTa={`Đề nghị ${dn.code} sẽ chuyển sang bước “${NHAN_GIAI_DOAN.xet_duyet_bao_gia.nhan}”, chờ trưởng bộ phận duyệt hoặc trả lại.`}
        canhBao="Sau khi trình, bạn không sửa đề xuất chọn nhà cung cấp được nữa. Bản báo giá đính kèm vẫn xem lại được."
        nhanDongY="Trình xét duyệt"
        onDong={() => setHoiTrinhXetDuyet(null)}
        onDongY={() => {
          if (!hoiTrinhXetDuyet) return;
          const loi = trinhXetDuyetBaoGiaChoDeNghi(hoiTrinhXetDuyet, nguoiDung.tenHienThi);
          setHoiTrinhXetDuyet(null);
          /* Tầng ghi có thể từ chối (hồ sơ đã đóng, chưa có đề xuất) — nói ra thay vì đóng hộp
             rồi báo thành công như cũ. */
          if (loi) {
            toast.error("Chưa trình được", { description: loi });
            return;
          }
          toast.success("Đã trình trưởng bộ phận xem xét", {
            description: `${dn.code} chuyển sang bước “${NHAN_GIAI_DOAN.xet_duyet_bao_gia.nhan}”.`,
          });
        }}
      />

      {/* ★ DUYỆT / KHÔNG DUYỆT — BẮT GHI LÝ DO CẢ HAI CHIỀU (Ban lãnh đạo 19/08/2026). */}
      <HopXacNhan
        mo={hoiDuyet !== null}
        tieuDe={hoiDuyet?.loai === "duyet" ? "Duyệt phương án giá?" : "Không duyệt bảng báo giá?"}
        /**
         * ★ RÚT GỌN CÒN MỘT CÂU XÁC NHẬN — Ban lãnh đạo 13/09/2026 khoanh cả hộp này và ghi
         * *"bỏ các ghi chú"*. Đã bỏ: vế "Phiếu chuyển sang bước …" ở chiều duyệt, vế "Tệp đính
         * kèm và đề xuất vẫn giữ nguyên" ở chiều trả lại, và toàn bộ `canhBao` (khung vàng).
         *
         * 🔴 GIỮ LẠI ĐÚNG MỘT THỨ TRONG CÂU NÀY: **tên ô báo giá đang duyệt** (`hoiDuyet.nhanO`).
         * Đây không phải câu diễn giải mà là thứ duy nhất cho biết ĐANG DUYỆT BẢN NÀO — hộp mở
         * từ nút tắt "Duyệt bản này" ở bước ②, và hồ sơ có nhiều bản đính kèm thì bỏ dòng này đi
         * là người duyệt bấm Duyệt mà không biết mình vừa chốt bản nào. Cùng chuỗi `nhanO` đó
         * được ghép vào căn cứ duyệt ở `onDongY` để sau này tra ngược ra tệp được chọn.
         *
         * 📌 Bỏ vế "Phiếu chuyển sang bước …" KHÔNG làm mất thông tin: toast sau khi duyệt vẫn
         * báo đúng bước kế tiếp, và cột bước trên trang tự đổi ngay.
         *
         * ⚠️ Vế `— chọn ${nccDuyet}` cũng đi theo. Ô nhập tên nhà cung cấp đã bị bỏ từ
         * 23/08/2026 nên `nccDuyet` gần như luôn rỗng; biến vẫn được dùng ở `onDongY` bên dưới
         * (hồ sơ cũ còn tên thì điền hộ), đừng tưởng nó thành thừa rồi xóa.
         */
        moTa={
          hoiDuyet?.loai === "duyet"
            ? hoiDuyet.nhanO
              ? `Duyệt ${hoiDuyet.nhanO} của đề nghị ${dn.code}.`
              : `Duyệt phương án giá của đề nghị ${dn.code}.`
            : hoiDuyet
              ? `Trả bảng báo giá của đề nghị ${dn.code} về bước “${NHAN_GIAI_DOAN.yeu_cau_bao_gia.nhan}”.`
              : undefined
        }
        /* 🔴 KHÔNG TRUYỀN `canhBao` NỮA = KHÔNG CÒN KHUNG VÀNG (Ban lãnh đạo 13/09/2026).
           Chốt chặn KHÔNG mất theo: chiều "Không đồng ý" vẫn bắt buộc ghi lý do qua `khoaDongY`
           bên dưới, và câu khóa đó vẫn hiện ra nói rõ còn thiếu gì. Ở đây chỉ bỏ lời nhắc nhở,
           không bỏ luật. */
        nhanDongY={hoiDuyet?.loai === "duyet" ? "Duyệt" : "Không duyệt, trả lại"}
        nguyHiem={hoiDuyet?.loai === "khong_duyet"}
        /**
         * 🔴 Khóa kèm CÂU GIẢI THÍCH, không khóa im lặng.
         *
         * ★ 23/08/2026 — Ban lãnh đạo: *"Bỏ bắt buộc ghi chú khi đồng ý duyệt chọn NCC"*. Chiều
         * ĐỒNG Ý nay không đòi lý do nữa (thay bằng đòi TÊN nhà cung cấp — thứ thật sự bắt buộc,
         * xem dưới). Chiều KHÔNG ĐỒNG Ý vẫn đòi, và đó là chủ ý: nhân viên phải đọc được mình
         * cần bổ sung gì, chứ phiếu bị trả về trắng thì họ trình lại y nguyên rồi lại bị trả.
         *
         * 🔴 ĐỔI ĐIỀU KIỆN KHÓA CHIỀU ĐỒNG Ý, KHÔNG BỎ KHÓA: trước đây chỉ ô lý do bị kiểm, nên
         * bỏ nó đi là hộp thoại **hết chốt** — bấm Duyệt với ô nhà cung cấp trống sẽ chốt một nhà
         * cung cấp tên rỗng, sinh khóa `ncc-tu-go-` và mọi chứng từ sau (đơn hàng, công nợ) nối
         * về một đối tượng vô danh. Ô tên nhà cung cấp trước giờ chỉ bị chặn ở NÚT MỞ hộp thoại
         * (dòng ~1155), mà trong hộp người duyệt vẫn xóa trắng lại được.
         */
        /**
         * 🔴 CHIỀU ĐỒNG Ý KHÔNG CÒN CHỐT NÀO — và đó là chủ ý, không phải sót.
         *
         * Ban lãnh đạo 23/08/2026 bỏ cả hai thứ từng khóa nút này: ghi chú lý do, rồi tên nhà
         * cung cấp. Bấm "Duyệt bản này" là đã xác định đủ (bản nào được duyệt), nên không còn gì
         * để đòi. Chiều KHÔNG ĐỒNG Ý vẫn đòi lý do: nhân viên phải đọc được mình cần bổ sung gì,
         * chứ phiếu bị trả về trắng thì họ trình lại y nguyên rồi lại bị trả.
         */
        khoaDongY={
          hoiDuyet?.loai === "khong_duyet" && lyDoDuyet.trim() === ""
            ? "Phải ghi rõ vì sao không duyệt để nhân viên biết cần bổ sung gì."
            : undefined
        }
        onDong={() => {
          setHoiDuyet(null);
          setLyDoDuyet("");
        }}
        onDongY={() => {
          if (!hoiDuyet) return;
          const bg = baoGiaLienQuan.find((b) => b.id === hoiDuyet.bgId);
          if (!bg) return;
          if (hoiDuyet.loai === "duyet") {
            /**
             * ★ DUYỆT LÀ CHỐT **BẢN BÁO GIÁ**, KHÔNG BẮT GÕ TÊN NHÀ CUNG CẤP (23/08/2026).
             *
             * `nccDuyet` nay gần như luôn rỗng vì ô nhập đã bỏ (xem chú thích ở hộp thoại). Khi
             * rỗng thì truyền **chuỗi rỗng cho cả hai tham số**, để `chonNCCChoBaoGia` ghi
             * `undefined`.
             *
             * 🔴 TUYỆT ĐỐI KHÔNG GHÉP `ncc-tu-go-${tên}` KHI TÊN RỖNG: kết quả là khóa cụt
             * `"ncc-tu-go-"` — một chuỗi KHÁC RỖNG nên mọi chỗ kiểm `if (bg.nccDaChonId)` sẽ tin
             * là đã chọn được một nhà cung cấp, và mọi bảng báo giá duyệt kiểu này đều mang **cùng
             * một khóa**, tức bị gom thành một đối tượng duy nhất trong bất kỳ phép nhóm nào.
             *
             * 📌 Còn tên (hồ sơ cũ, hoặc ô báo giá có ghi tên) thì vẫn sinh khóa như trước — có
             * khóa thì chứng từ sau còn nối về một đối tượng, thay vì so chuỗi tên mà hoa/thường
             * lệch một chữ là thành hai bên khác nhau.
             */
            /**
             * 🔴 ĐỌC KẾT QUẢ RỒI MỚI BÁO — sửa 24/08/2026.
             *
             * Bản trước gọi hàm rồi hiện toast xanh *"Đã duyệt"* **vô điều kiện**. Khi tầng ghi
             * chặn (bước trước còn treo việc bắt buộc) thì nó `return` không ghi gì, mà người
             * dùng vẫn thấy "Đã duyệt" và hộp đóng lại. Họ báo lại là *"app treo, bấm duyệt không
             * được"* chứ không biết bị chặn vì lý do gì, nên không ai đi tích việc còn treo và hồ
             * sơ kẹt vô thời hạn. Đúng điều `CLAUDE.md` §3.5 cấm.
             */
            const loiDuyet = chonNCCChoBaoGia(
              bg.id,
              nccDuyet.trim() === ""
                ? ""
                : `ncc-tu-go-${nccDuyet.trim().toLowerCase().replace(/\s+/g, "-")}`,
              nccDuyet.trim(),
              nguoiDung.tenHienThi,
              /**
               * ★ CHỈ CÒN GHI TIỀN TỐ `[Báo giá NCC n]`, KHÔNG GHI CHỮ NGƯỜI DÙNG GÕ NỮA —
               * Ban lãnh đạo 13/09/2026 cho bỏ ô "Căn cứ duyệt" ở chiều đồng ý (xem chú thích
               * đầy đủ tại chỗ bỏ ô, phía dưới trong cùng hộp thoại này).
               *
               * 🔴 VÌ SAO KHÔNG GHÉP `lyDoDuyet` VÀO NỮA — ĐÂY LÀ CÁI BẪY THẬT, đọc kỹ: ô nhập
               * chỉ bị ẩn ở chiều "Đồng ý", còn biến `lyDoDuyet` thì DÙNG CHUNG cho cả hai chiều
               * và KHÔNG tự xóa khi đổi ô sổ xuống "Quyết định của trưởng bộ phận". Nên nếu người
               * duyệt chọn "Không đồng ý", gõ nửa câu bác bỏ, rồi đổi ý quay lại "Đồng ý" và bấm
               * Duyệt, thì câu bác bỏ đó sẽ bị ghi vào hồ sơ như là CĂN CỨ DUYỆT — ghi ngược hẳn
               * ý người dùng, mà không có gì báo vì ô đã ẩn nên họ không nhìn thấy chữ còn đó.
               *
               * 🔴 TIỀN TỐ THÌ BẮT BUỘC PHẢI GIỮ, KHÔNG ĐƯỢC TRUYỀN RỖNG CHO GỌN: đây là thứ duy
               * nhất cho biết BẢN BÁO GIÁ NÀO đã được duyệt. `tepBaoGiaDaDuyet`
               * (`2-quy-trinh/bao-gia-dinh-kem.ts`) đọc đúng dấu `[Báo giá NCC n]` này để dựng
               * dòng "Bản báo giá được chọn" ở đầu vào bước ③ và để gom bộ hồ sơ thanh toán
               * (`bo-ho-so-thanh-toan.ts`). Bỏ nó là hai chỗ đó lặng lẽ mất đường link, không lỗi.
               *
               * 📌 Không có `nhanO` (duyệt qua cặp nút Duyệt/Không duyệt ở khối bước ③, đường này
               * không biết ô báo giá nào) thì truyền chuỗi rỗng — `chonNCCChoBaoGia` quy về
               * `undefined`, đúng như trước, không sinh dữ liệu rác.
               */
              hoiDuyet.nhanO ? `[${hoiDuyet.nhanO}]` : "",
            );
            if (loiDuyet) {
              toast.error("Chưa duyệt được", { description: loiDuyet });
              return;
            }
            toast.success("Đã duyệt", {
              description: `${dn.code} chuyển sang bước “${NHAN_GIAI_DOAN.lap_don_mua_hang.nhan}”.`,
            });
          } else {
            /* Trả lại = lùi bước, dùng lại `luiVeBuoc` kèm lý do (ghi vào `lanTraLai`).
               🔴 ĐỌC KẾT QUẢ RỒI MỚI BÁO — sửa 11/09/2026 (cùng lý do nhánh "Đồng ý" ở trên).
               `luiVeBuoc` trả `{ loi }` khi chưa có bảng nào đã trình để trả lại; báo xanh vô điều
               kiện là "báo thành công giả" kèm một dòng nhật ký sai. */
            const kqTra = luiVeBuoc(dn.id, "yeu_cau_bao_gia", nguoiDung.tenHienThi, {
              lyDo: lyDoDuyet,
            });
            if (kqTra && "loi" in kqTra) {
              toast.error("Chưa trả lại được", { description: kqTra.loi });
              return;
            }
            toast.success("Đã trả lại bước Yêu cầu NCC báo giá", {
              description: "Nhân viên phụ trách sẽ đọc được lý do.",
            });
          }
          setHoiDuyet(null);
          setLyDoDuyet("");
          setNccDuyet("");
        }}
      >
        {/* ★ NÚT SỔ XUỐNG CHỌN ĐỒNG Ý / KHÔNG ĐỒNG Ý — Ban lãnh đạo 20/08/2026: *"thêm nút sổ
            xuống lựa chọn: 1. Đồng ý · 2. Không đồng ý và phải ghi lý do"*.

            🔴 GỘP HAI QUYẾT ĐỊNH VÀO MỘT HỘP. Trước đây phải đóng hộp này rồi đi tìm nút "Không
            duyệt" ở khối bước ③ — hai đường cho một việc, mà người đang đọc bản báo giá thì đang ở
            đây. Nay quyết định ngay tại chỗ: đổi lựa chọn là tiêu đề, nhãn ô lý do, chữ trên nút
            và màu nút đều đổi theo, nên không ai bấm nhầm.

            📌 Lý do CHỈ CÒN BẮT BUỘC Ở CHIỀU KHÔNG ĐỒNG Ý (Ban lãnh đạo 23/08/2026 bỏ bắt buộc ở
            chiều đồng ý). Dấu `*` trên nhãn ô cũng phải đổi theo — để `*` mà nút vẫn bấm được là
            nhãn nói dối, người dùng gõ cho có rồi thành nhật ký rác. */}
        {/**
          * ❌❌ ĐÃ BỎ Ô SỔ XUỐNG "Quyết định của trưởng bộ phận" — Sếp 14/09/2026, nguyên văn:
          * *"Bỏ nội dung này, không cần thiết"* (ảnh chụp đúng ô này).
          *
          * Sếp đúng: hộp chỉ mở được từ MỘT trong hai nút đã nói rõ ý định — "Duyệt" / "Duyệt bản
          * này" (`loai: "duyet"`) hoặc "Không duyệt" (`loai: "khong_duyet"`). Hỏi lại đúng câu vừa
          * bấm là bắt người dùng trả lời hai lần cho một quyết định.
          *
          * 🔴🔴 NHƯNG BỎ Ô NÀY SUÝT LÀM MẤT ĐƯỜNG TRẢ LẠI — ĐỌC KỸ TRƯỚC KHI ĐỘNG VÀO TIẾP.
          * Cặp nút "Duyệt / Không duyệt" ở khối bước ③ **bị ẩn khi hồ sơ có ĐÚNG MỘT bảng báo giá
          * đã trình** (điều kiện `.length !== 1`, xem chú thích tại đó). Trong đúng ca đó, ô sổ
          * xuống này từng là **đường DUY NHẤT** để chọn "Không đồng ý — trả lại để làm lại" — và
          * chú thích cũ ở khối bước ③ nói thẳng điều đó: *"Không duyệt KHÔNG mồ côi: hộp thoại
          * chung có ô sổ xuống…"*.
          * 👉 Vì vậy cùng lúc bỏ ô này, nút **"Không duyệt" đã được cho hiện lại cả khi chỉ có một
          * bảng** (xem chỗ sửa điều kiện ở khối bước ③). Hai thay đổi đó là MỘT VIỆC, đừng tách:
          * hoàn tác một nửa là app mất đường lùi ③ → ② — đường lùi DUY NHẤT còn sống của cả quy
          * trình (mọi bước khác đang bị chặn cứng từ 26/08/2026).
          *
          * 📌 `hoiDuyet.loai` VẪN GIỮ NGUYÊN và vẫn là thứ quyết định mọi thứ trong hộp (tiêu đề,
          * nhãn ô lý do, chữ và màu nút, có bắt buộc ghi lý do hay không). Chỉ bỏ CÁI Ô CHO ĐỔI —
          * muốn đổi ý thì đóng hộp rồi bấm nút kia, một thao tác, rõ ràng hơn hẳn.
          */}

        {/**
          * ❌ ĐÃ BỎ Ô "Duyệt cho nhà cung cấp nào?" (Ban lãnh đạo 23/08/2026: *"Sao lại có thêm
          * mục này. Đã tích chọn báo giá nào thì báo giá đó sẽ tự động links qua bước sau rồi mà"*).
          *
          * Đúng: bấm "Duyệt bản này" ở một ô báo giá là đã xác định **bản nào** được duyệt, và
          * bản đó được link sang khối ĐẦU VÀO của bước ③ (dòng *"Bản báo giá được chọn — Báo giá
          * NCC 1"*). Bắt gõ lại tên nhà cung cấp là hỏi một thứ hồ sơ đã có câu trả lời.
          *
          * 🔴 TÊN NHÀ CUNG CẤP KHÔNG MẤT KHỎI HỒ SƠ — nó được gõ ở BƯỚC ④, ô "Tên nhà cung cấp"
          * của form lập đơn mua hàng, và chính đơn hàng mới là chứng từ mang tên bên bán ra ngoài
          * công ty. Đã kiểm: không luật nghiệp vụ nào đòi `nccDaChonId` — chuyển bước xét theo
          * `trangThai === "da_chon_ncc"`, còn công nợ nối theo nhà cung cấp của ĐƠN HÀNG.
          *
          * ⚠️ Vì vậy `chonNCCChoBaoGia` nay có thể nhận tên rỗng. Chỗ gọi phải truyền khóa RỖNG
          * chứ không phải `ncc-tu-go-` cụt đuôi — xem chú thích ở `onDongY` bên dưới.
          *
          * 📌 Giữ lại câu chuyện cũ để người sau khỏi "thêm lại cho chắc": ô này từng nằm ở khối
          * bước ③ ngoài hộp thoại, tôi đưa vào hộp sáng 23/08 để chữa việc nút Duyệt bị khóa mà
          * không có chỗ gỡ. Nay bỏ hẳn cả hai chỗ thì không còn khóa nào để gỡ.
          *
          * 🔴 CHUYỆN ĐÃ XẢY RA: bỏ bắt buộc ghi chú ở chiều đồng ý (đúng chỉ đạo), tôi chuyển điều
          * kiện khóa nút sang ô TÊN NHÀ CUNG CẤP. Nhưng ô đó nằm ở khối bước ③ **bên ngoài hộp
          * thoại**, còn nút "Duyệt bản này" ở bước ② thì mở hộp thoại ngay — và nó chỉ điền hộ tên
          * khi tệp báo giá có ghi tên, mà bước ② đã bỏ chỗ ghi tên từ 20/08/2026 nên gần như luôn
          * rỗng. Kết quả: hộp mở ra với nút Duyệt bị khóa và **không có ô nào trong hộp để gỡ khóa**
          * — Ban lãnh đạo báo *"Chức năng này sao không còn hoạt động"*. Đúng: tôi làm tắc.
          *
          * ✅ Nay ô tên nằm NGAY TRONG HỘP. Người duyệt đọc bản báo giá, bấm "Duyệt bản này", gõ
          * tên bên được chọn rồi bấm Duyệt — xong trong một hộp, không phải đi tìm ô ở khối khác.
          *
          * 🔴 VÌ SAO KHÔNG BỎ LUÔN ĐÒI HỎI NÀY cho nhanh: tên nhà cung cấp là thứ `chonNCCChoBaoGia`
          * dùng để sinh khóa `ncc-tu-go-…`. Để trống là chốt một nhà cung cấp **tên rỗng**, và mọi
          * chứng từ sau (đơn đặt hàng, công nợ) nối về một đối tượng vô danh — hỏng dữ liệu, không
          * chỉ hỏng giao diện. Đây là ô bắt buộc THẬT, khác hẳn ô ghi chú mà Ban lãnh đạo cho bỏ.
          *
          */}

        {/**
          * ❌ ĐÃ BỎ Ô "Căn cứ duyệt" Ở CHIỀU ĐỒNG Ý — Ban lãnh đạo chốt 13/09/2026.
          *
          * 📌 CHUYỆN GÌ ĐÃ XẢY RA (viết cho người chưa biết gì): cùng ngày 13/09/2026 Sếp cho bỏ
          * khối hiển thị *"Giải trình của Trưởng bộ phận"* ở khối "Xét duyệt phương án giá" (xem
          * chú thích tại chỗ bỏ, quãng dòng 1628). Một lượt soát chéo sau đó phát hiện: ô nhập
          * "Căn cứ duyệt" trong hộp này VẪN CÒN, người duyệt vẫn gõ được, chữ vẫn được lưu vào
          * `BaoGia.lyDoChonNCC` — nhưng KHÔNG CÒN MỘT CHỖ NÀO TRÊN GIAO DIỆN ĐỌC NÓ RA. Đó đúng
          * là kiểu "giao diện hứa một việc app không làm" mà CLAUDE.md §3.5 cấm. Sếp chốt: bỏ ô
          * nhập, chứ không mở lại chỗ đọc.
          *
          * 🔴 CHỈ BỎ Ở CHIỀU "ĐỒNG Ý". CHIỀU "KHÔNG ĐỒNG Ý" GIỮ NGUYÊN VÀ VẪN BẮT BUỘC — đừng
          * gộp hai chiều làm một rồi bỏ cả hai. Lý do không duyệt đi theo đường khác hẳn: nó vào
          * `luiVeBuoc(..., { lyDo })` → `BaoGia.lanTraLai`, và ĐƯỢC HIỆN RA thật trong khối
          * "Trưởng bộ phận đã trả lại" (quãng dòng 1827). Bỏ nốt ô này là nhân viên chỉ thấy
          * phiếu tự nhảy ngược về bước ②, không biết vì sao, rồi trình lại y nguyên.
          *
          * ⚠️ CÁI GIÁ CỦA VIỆC BỎ — nói thẳng để sau này không ai tưởng là lỗi: từ nay người
          * duyệt KHÔNG còn chỗ ghi lại vì sao mình chọn bản báo giá này. Hồ sơ chỉ còn lưu BẢN
          * NÀO được duyệt, không lưu LÝ LẼ. Muốn có lại thì phải mở lại cả hai thứ cùng lúc — ô
          * nhập VÀ chỗ đọc — chứ mở mỗi ô nhập là quay về đúng lỗi vừa sửa.
          *
          * 🔴 TUYỆT ĐỐI KHÔNG XÓA TRƯỜNG `lyDoChonNCC` "cho sạch": app vẫn ghi vào đó tiền tố
          * `[Báo giá NCC n]` và ĐỌC LẠI ở hai chỗ qua `tepBaoGiaDaDuyet`
          * (`2-quy-trinh/bao-gia-dinh-kem.ts`) để tra ra TỆP BÁO GIÁ NÀO ĐÃ ĐƯỢC DUYỆT — một là
          * dòng "Bản báo giá được chọn" ở đầu vào bước ③, hai là `bo-ho-so-thanh-toan.ts`. Xóa
          * trường là mất đường link đó mà không có lỗi nào báo. Xem thêm `onDongY` phía trên:
          * chiều đồng ý nay chỉ truyền đúng tiền tố, không truyền chữ người dùng gõ.
          */}
        {hoiDuyet?.loai === "khong_duyet" && (
          <div className="flex flex-col gap-1.5">
            {/* ★★ NÓI TRƯỚC LÀ SẼ XOÁ TỆP — Sếp 16/09/2026: *"Sao bấm lùi về mà vẫn còn các file
                đính kèm, các file này phải được xoá sạch"*, chốt *"Xóa hết tệp của bước báo giá"*.
                Từ đó `luiVeBuoc` xoá sạch tệp bước ② mỗi lượt trả lại.

                🔴 ĐƯỜNG NÀY KHÔNG ĐI QUA HỘP KÉO THẢ nên KHÔNG hiện câu `viec` của
                `quyetDinhLui` — chỗ duy nhất mô tả việc sắp làm. Không thêm dòng này thì trưởng
                bộ phận bấm một nút xoá chứng từ mà không hề biết, đúng cái §3.5 cấm. Câu chữ bám
                sát câu `viec` bên `2-quy-trinh/giai-doan-mua-hang.ts` case `xet_duyet_bao_gia` —
                sửa một bên thì sửa cả hai.

                📌 Chỉ hiện khi THẬT SỰ CÓ TỆP: hồ sơ chưa đính gì mà vẫn doạ "sẽ xoá" là làm
                người duyệt ngại bấm cho một việc không xảy ra. */}
            {tepBaoGiaDaCo(dn).length > 0 && (
              <p className="flex items-start gap-1.5 rounded-lg bg-warning/10 p-2 text-xs text-text-secondary">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
                <span>
                  Trả lại sẽ <strong>xoá sạch {tepBaoGiaDaCo(dn).length} tệp</strong> đang đính kèm
                  ở bước “Yêu cầu NCC báo giá” (bản báo giá nhà cung cấp và bảng so sánh) — nhân
                  viên phải đính kèm lại bản mới. Giá đã nhập trong bảng thì giữ nguyên.
                </span>
              </p>
            )}
            <Label htmlFor="ly-do-duyet-bao-gia">Vì sao không đồng ý *</Label>
            {/* ★ ĐÃ BỎ CHỮ GỢI Ý TRONG Ô (placeholder) — Ban lãnh đạo 13/09/2026 *"bỏ các ghi
                chú"*. Câu cũ là ví dụ dài, thuộc diện câu diễn giải Sếp muốn dọn.

                ⚠️ Chiều "Không đồng ý" vẫn BẮT BUỘC có lý do — luật nằm ở `khoaDongY` phía trên,
                không nằm ở chữ gợi ý này. */}
            <Textarea
              id="ly-do-duyet-bao-gia"
              rows={3}
              value={lyDoDuyet}
              onChange={(e) => setLyDoDuyet(e.target.value)}
            />
          </div>
        )}
      </HopXacNhan>

      {/* ===== HAI HỘP SỬA TRƯỜNG — DỜI TỪ `trang/de-nghi-danh-sach.tsx` SANG ĐÂY 12/09/2026 =====
          Ban lãnh đạo bỏ hai mục tương ứng khỏi menu ⋯ của thẻ, kèm chỉ đạo *"chỉ bỏ ở mục hiển
          thị thôi, còn chức năng thì vẫn phải giữ lại"*. Hai hộp là component dùng chung, không
          bị sửa gì — chỉ đổi nơi dựng và nơi mở.

          📌 Trang này còn được nhúng NGUYÊN VẸN vào pop-up xem nhanh trên bảng quy trình
          (`de-nghi-danh-sach.tsx`), nên dời về đây là hai hộp vào được từ cả hai chỗ. */}
      <HopSuaTruongTuyChinh
        mo={hopSuaTruong === "tuy_chinh"}
        deNghi={dn}
        onDong={() => setHopSuaTruong(null)}
      />
      {/* 📌 Hộp này cần `onLuu` vì nó trả về cả mảng trường; hộp trên thì gọi thẳng từng hàm ghi
          của kho dữ liệu (mỗi trường một hàm, mỗi hàm giữ luật riêng). */}
      <HopSuaTruongBoSung
        mo={hopSuaTruong === "bo_sung"}
        deNghi={dn}
        onDong={() => setHopSuaTruong(null)}
        onLuu={(truong) => {
          suaTruongBoSung(dn.id, truong, nguoiDung.tenHienThi);
          toast.success("Đã lưu trường tự thêm", { description: dn.code });
        }}
      />
    </>
  );
}
