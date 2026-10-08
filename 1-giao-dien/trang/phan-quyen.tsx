"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronRight, RefreshCw, Search, ShieldAlert, TriangleAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { StatusBadge, type StatusTone } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { AnhDaiDienChu } from "@/1-giao-dien/thanh-phan-dung-chung/anh-dai-dien-chu";
import { OTich } from "@/1-giao-dien/thanh-phan-dung-chung/o-tich-ba-trang-thai";
import { BangMauChucDanh, MoTaNhomQuyenTick } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-mau-chuc-danh";
import { Card } from "@/1-giao-dien/nen-tang-ui/card";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { useNguoiDung, yeuCauDocLaiQuyenCuaToi } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  CAP_KHONG_BO_VAO_APP,
  capDatDuocToiDa,
  duocDatCap,
  duocSuaMauChucDanh,
  lyDoKhongBatCoKhiTick,
  lyDoKhongBoVaoApp,
  NHAN_CAP_QUYEN,
  vuongMacTraoQuyen,
} from "@/4-phan-quyen/luat-phan-quyen";
import {
  timVaiTroChuan,
  vaiTroGanDuocBoi,
  vaiTroKhopVoiHoSo,
  VAI_TRO_CHUAN,
  type MaVaiTroChuan,
  type VaiTroChuan,
} from "@/4-phan-quyen/vai-tro-chuan";
import {
  ngoaiLeConHieuLuc,
  quyenRiengConHieuLuc,
  tinhQuyenTheoChucDanh,
  type NguoiDung,
  type Quyen,
} from "@/4-phan-quyen/quyen";
import {
  apDungQuyenRieng,
  CO_TICK_DUOC,
  demCoBat,
  KHOA_TICK,
  NHOM_QUYEN_TICK,
  nhanCoTick,
  quyenTheoChucDanhCoMau,
  rutQuyenRieng,
  tinhTruocSauKhiLuu,
  TOI_DA_NGUOI_MOI_LAN,
  type BanGhiQuyenRiengHienThi,
  type QuyenRieng,
  type TruocSauKhiLuu,
} from "@/4-phan-quyen/quyen-rieng";
import {
  anhHuongKhiDoiMau,
  canhBaoTatVaoManLamViec,
  canhBaoXemBuocKhiThieuGia,
  CHI_DAO_THEO_DONG,
  LY_DO_KHONG_SUA_MAU,
  MAU_TRONG,
  oDeCuaHoSo,
  quyenCuaVaiTroCoMau,
  tomTatQuyenCuaVaiTro,
  type MauChucDanh,
  type ThayDoiMau,
} from "@/4-phan-quyen/mau-chuc-danh";
import { ganQuyenRiengHieuLuc, tinhLuuMauChucDanh } from "@/4-phan-quyen/tinh-luu-phan-quyen";
import { layNguonPhanQuyen, LY_DO_DEMO_KHONG_DOI_CHUC_DANH } from "@/4-phan-quyen/nguon-phan-quyen";
import type { DongLichSuDemo } from "@/3-du-lieu/kho-phan-quyen-demo";
import { lamMoiNguoiKhongVaoApp } from "@/4-phan-quyen/dung-nguoi-khong-vao-app";
import {
  thanhNguoiDung,
  type HoSoKemMa,
  type ThanhVienDanhBa,
} from "@/5-ket-noi/ho-so-tai-khoan";
import { boDau } from "@/6-tien-ich/bo-dau";
import { formatDateTime } from "@/6-tien-ich/dinh-dang";

/**
 * Khóa cho nhóm người CHƯA khai bộ phận ở App Tổng.
 *
 * 🔴 Không dùng chuỗi rỗng làm khóa vì rỗng đã mang nghĩa "chưa chọn phòng ban nào" ở ô chọn.
 * Cũng không dùng tên đọc được (vd "Chưa gán") vì App Tổng có thể có phòng ban trùng đúng tên
 * đó, và khi ấy hai nhóm khác nhau bị trộn vào một mục.
 */
const CHUA_GAN_PHONG_BAN = "__chua-gan-phong-ban__";

const tenPhongBan = (pb: string) => (pb === CHUA_GAN_PHONG_BAN ? "Chưa gán phòng ban" : pb);

/**
 * ★ Cột "Nhân sự" kéo rộng/hẹp được — Sếp 26/09/2026: *"Thêm chức năng có thể tự động kéo tăng giảm
 * chiều rộng cột"*. Chỉ từ màn `lg`; dưới đó hai cột xếp chồng. Nhớ theo máy (localStorage).
 */
const RONG_COT_MAC_DINH = 420;
const RONG_COT_MIN = 300;
const RONG_COT_MAX = 700;
const BUOC_PHIM = 16;
const KHOA_LUU_RONG_COT = "hpcons-tm-phan-quyen-rong-cot";
const kepRongCot = (v: number) => Math.round(Math.min(RONG_COT_MAX, Math.max(RONG_COT_MIN, v)));

/** Một người trên danh sách phân quyền, đã tính sẵn mọi thứ màn hình cần. */
interface ThongTinNguoi {
  hs: HoSoKemMa;
  ten: string;
  phongBan: string;
  nd: NguoiDung;
  vtHienTai: VaiTroChuan | undefined;
  /** Quyền theo chức danh. */
  goc: Quyen;
  /** Bản ghi quyền riêng (gốc đã cất + phần máy chủ đã đối chiếu dấu chức danh). */
  rieng: BanGhiQuyenRiengHienThi | null;
  /** Quyền đang có hiệu lực (chức danh + quyền riêng CÒN HIỆU LỰC). */
  hieuLuc: Quyen;
  laQuanTri: boolean;
  /** Không sửa được người này — lý do. `null` = sửa được. */
  lyDoKhoa: string | null;
  /**
   * Mã đưa vào `vuongMacTraoQuyen`: mã Firebase của người này, TRỪ khi là chính mình (khớp ở một
   * trong hai lớp danh tính) thì dùng đúng mã của người gọi để chốt "không tự sửa" bắt được.
   */
  uidLuat: string;
  /**
   * ★ Người trong danh bạ App Tổng CHƯA có hồ sơ `nguoi-dung` ở app Thu mua (Sếp 26/09/2026 — gộp
   * khối "Thêm người dùng mới" vào đây). `hs` của họ là hồ sơ DỰNG TẠM từ danh bạ (cấp 0), chỉ để
   * màn hình dùng chung một khuôn — KHÔNG phải dữ liệu máy chủ. Phải chọn chức danh trước: lưu sẽ gọi
   * `/api/phan-quyen` tạo hồ sơ thật, rồi mới ghi quyền riêng (route quyền riêng đòi có hồ sơ).
   */
  chuaCoHoSo: boolean;
}

/** Dự kiến sau khi lưu, cho từng người đang chọn. */
interface DuKien {
  t: ThongTinNguoi;
  /** Quyền theo chức danh SAU lần lưu (chức danh mới nếu lần lưu có đổi). */
  goc: Quyen;
  laQT: boolean;
  capTM: NguoiDung["capTM"];
  vaiTro: NguoiDung["vaiTro"];
  /** Mã chức danh SAU lần lưu — để câu lý do gọi đúng tên ("Ngừng truy cập" hay "cấp Không quyền"). */
  maVaiTro: string | undefined;
  ts: TruocSauKhiLuu;
}

/**
 * Vì sao KHÔNG TICK ĐƯỢC cho một người, `null` = tick được. Một chỗ cho cả nút "Chọn tất cả đang
 * lọc" lẫn khung khoá tick (soát chéo 26/09/2026: nút chọn tất cả từng gom cả tài khoản Quản trị và
 * người cấp 0, làm khoá tick cả nhóm).
 *
 * @param sau Chức danh sau lần lưu — truyền khi đang đổi chức danh, để người "Ngừng truy cập" được
 *            chọn chức danh mới là tick được ngay. Bỏ trống = xét theo chức danh hiện tại.
 */
function lyDoKhongTickNguoi(
  t: ThongTinNguoi,
  sau?: { laQT: boolean; goc: Quyen; maVaiTro?: string },
): string | null {
  if (t.lyDoKhoa) return t.lyDoKhoa;
  /* Chưa có hồ sơ mà chưa chọn chức danh → chưa có gì để tick lên (route quyền riêng đòi hồ sơ). */
  if (t.chuaCoHoSo && !sau?.maVaiTro) {
    return `${t.ten} chưa có hồ sơ ở app Thu mua — chọn chức danh trước rồi mới tick quyền.`;
  }
  const laQT = sau ? sau.laQT : t.laQuanTri;
  const goc = sau ? sau.goc : t.goc;
  const ma = sau ? sau.maVaiTro : t.vtHienTai?.ma;
  if (laQT) {
    /* Nói đúng thời điểm: đang là Quản trị, hay SẼ thành Quản trị sau lần lưu này. */
    return t.laQuanTri
      ? `${t.ten} là tài khoản Quản trị — luôn đủ mọi quyền, tick không có tác dụng.`
      : `Sau khi lưu, ${t.ten} thành Quản trị — luôn đủ mọi quyền, không cần tick.`;
  }
  if (!goc.xemDuocApp) {
    /* Cấp 0 không phải lúc nào cũng là chức danh "Ngừng truy cập" — hồ sơ tạo tay/cũ có thể cấp 0
       với chức danh khác. Gọi sai tên là người phân quyền đi tìm nhầm chỗ. */
    return ma === "ngung_truy_cap"
      ? `${t.ten} đang ở chức danh "Ngừng truy cập" — chọn chức danh khác trước rồi mới tick quyền.`
      : `${t.ten} đang ở cấp Không quyền — chọn chức danh khác trước rồi mới tick quyền.`;
  }
  return null;
}

/** Tick được cho người này không (theo chức danh hiện tại). */
const tickDuoc = (t: ThongTinNguoi) => lyDoKhongTickNguoi(t) === null;

/** Nội dung hộp xác nhận — CHỤP LẠI lúc mở, bấm Đồng ý là lưu đúng thứ đã xem. */
interface TomTatLuu {
  uids: string[];
  ten: string[];
  vtMoi: VaiTroChuan | null;
  uidDoiChucDanh: string[];
  thayDoi: QuyenRieng;
  uidGhiQuyen: string[];
  bat: string[];
  tat: string[];
  soGiuTheoChucDanh: number;
  /** Lúc mở hộp chưa đọc được quyền riêng — lần lưu chỉ đổi chức danh. */
  chuaDocRieng: boolean;
  /** Số người CHƯA có hồ sơ được cấp quyền lần đầu trong lượt lưu này. */
  soCapMoi: number;
  /** Bản mẫu chức danh trang đang giữ lúc mở hộp — gửi kèm khi lưu (đặc tả 2.5), lệch là 409. */
  phienBanMau: number;
  /**
   * ★ Cảnh báo ô "Xem bước quy trình" (Sếp 07/10/2026) — CHỈ BÁO, không chặn, hiện trong khung vàng của hộp:
   *   · `canhBaoXemBuocKhiThieuGia` (`mau-chuc-danh.ts`, đặc tả D.2 "Tick riêng"): bật ô bước cho người không
   *     có "Xem giá" — tệp đính kèm ở trang chi tiết có thể chứa giá.
   *   · Bổ sung đặc tả 4.9: tắt ô "Vào màn làm việc" mà người đó còn ô bước → nói rõ vẫn vào bảng Quy trình.
   * Rỗng khi chưa đọc được quyền riêng (cùng lý do ẩn Bật/Tắt: tính như thể không ai có quyền riêng là có thể SAI).
   */
  canhBao: string[];
}

/** Nội dung hộp xác nhận LƯU BẢNG MẪU — chụp lúc mở (cùng nếp `hoiLuuCuoi`). */
interface TomTatLuuMau {
  thayDoi: ThayDoiMau;
  phienBan: number;
  /** Lỗi khi CHẠY THỬ `tinhLuuMauChucDanh` trên máy — có thì khoá nút Đồng ý kèm lý do. */
  loi: string | null;
  soODoi: number;
  /** Ảnh hưởng theo TỪNG Ô (`anhHuongKhiDoiMau`, B-F6): "NV Thu mua: tắt Xem công nợ — 4 người, 1 người giữ ngoại lệ". */
  dong: string[];
  canhBao: string[];
  /** Câu chỉ đạo gắn với dòng có ô đổi (`CHI_DAO_THEO_DONG`). */
  chiDao: string[];
}

/** Nội dung hộp xác nhận "BỎ QUYỀN RIÊNG — về theo chức danh" — chụp lúc mở. */
interface TomTatBoRieng {
  uids: string[];
  ten: string[];
  bat: string[];
  tat: string[];
  phienBanMau: number;
  /** Lý do máy chủ sẽ từ chối (hỏi trước bằng đúng `vuongMacTraoQuyen`) — có thì khoá nút Đồng ý. */
  loi: string | null;
}

/**
 * 🛡️ MÀN PHÂN QUYỀN NGƯỜI DÙNG — chọn người bên trái, tick quyền bên phải.
 *
 * ★★ Sếp 26/09/2026 (duyệt bản demo "Phân quyền tick chọn"):
 *   ① *"khi chọn nhân viên A thì sẽ hiện 1 list quyền bên cạnh, a giao cho quyền gì thì chỉ cần
 *      tick zô là được"*
 *   ② *"Thêm chức năng được chọn nhiều người cùng lúc để phân quyền"*
 *   ③ trưởng bộ phận là người tick phân quyền.
 *
 * ## HAI LỚP
 * · CHỨC DANH — vẫn gán qua `/api/phan-quyen` y như trước (route của phiên tích hợp, không sửa).
 *   PHẢI GIỮ: danh sách "giao việc cho ai" ở `bang-phan-bo.tsx` lọc theo chức danh.
 * · QUYỀN TICK RIÊNG — lớp đè, cất ở `tm_quyen_rieng` qua `/api/quyen-rieng`. Luật ở
 *   `4-phan-quyen/quyen-rieng.ts` (áp quyền) và `luat-phan-quyen.ts` → `vuongMacTraoQuyen` (ai
 *   trao được gì cho ai). Màn này CHỈ hỏi luật, không tự viết luật.
 *
 * ## 🔴 MẶC ĐỊNH AN TOÀN
 * Demo ghi "mặc định không xem được gì", nhưng làm vậy ngay hôm deploy là cả phòng mất quyền. Nên
 * người chưa được tick riêng GIỮ NGUYÊN quyền theo chức danh, và màn hình nói rõ điều đó.
 *
 * ## CHỌN NHIỀU NGƯỜI
 * Mỗi người một kiểu thì ô tích hiện trạng thái TRUNG GIAN, và chỉ những ô đã chạm mới được ghi —
 * ô chưa chạm giữ nguyên của từng người (máy chủ tự ghép với bản đang cất).
 *
 * ## ★ Sếp 06/10/2026 — MẪU CHỨC DANH SỬA ĐƯỢC (gói D · Câu 1 = A · Câu 2 = B · Câu 3 = A)
 * · Bảng "chức danh nào mặc định làm được gì" nay BẤM ĐƯỢC — `thanh-phan-nghiep-vu/bang-mau-chuc-danh.tsx`.
 * · Quyền gốc của mỗi người = công thức + MẪU (`quyenTheoChucDanhCoMau` / `quyenCuaVaiTroCoMau`) — không
 *   còn chỗ nào tính theo công thức trơn (bài kiểm-luật canh).
 * · Người có quyền riêng chỉ giữ ô cố ý khác (`ngoaiLeConHieuLuc`) — ô đó hiện "(khác chức danh)". Nút
 *   "Bỏ quyền riêng — về theo chức danh" thay nút "Áp mẫu theo chức danh" (hai nút cùng làm một việc).
 * · Mọi lần lưu gửi `phienBanMau`; 409 `mau-doi` → báo, bỏ nháp, đọc lại (tab cũ không trả lại quyền
 *   Sếp vừa bỏ ở mẫu).
 * · Đọc / ghi qua `layNguonPhanQuyen`: chế độ tài khoản mẫu chạy KHO DEMO (localStorage) bằng ĐÚNG phép
 *   tính máy chủ dùng — không còn màn trống ở chế độ mẫu.
 *
 * ## 📌 LỊCH SỬ (vẫn đúng)
 * · 18/08/2026 — gán theo VAI TRÒ đóng gói (`vai-tro-chuan.ts`), không bắt ghép tay bốn trường.
 * · 20/08/2026 — ghi thật qua API máy chủ; khối "Thêm người dùng mới" lấy thẳng danh bạ App Tổng.
 */
/** Giá trị ô lọc "Tất cả phòng ban" — khác "" (chưa chọn gì = chưa hiện danh sách). */
const TAT_CA_PHONG_BAN = "__tat_ca__";

/**
 * ★ Lọc theo CHỨC DANH (Sếp 06/10/2026, gói D). `""` = mọi chức danh; còn lại là mã `VAI_TRO_CHUAN` hoặc
 * hai giá trị riêng dưới — cùng nếp `CHUA_GAN_PHONG_BAN` (khoá không trùng được với mã thật).
 */
const LOC_TUY_CHINH = "__tuy-chinh__";
const LOC_CHUA_CO_HO_SO = "__chua-co-ho-so__";

export default function TrangPhanQuyen() {
  const { nguoiDung, quyen } = useNguoiDung();

  const [danhSach, setDanhSach] = useState<HoSoKemMa[] | null>(null);
  const [dangTai, setDangTai] = useState(false);
  /** Quyền riêng đang cất, khoá = mã Firebase. `null` = chưa đọc được. */
  const [banGhiRieng, setBanGhiRieng] = useState<Record<string, BanGhiQuyenRiengHienThi> | null>(null);
  const [loiRieng, setLoiRieng] = useState<string | null>(null);

  // ---------- ★ Mẫu chức danh (Sếp 06/10/2026, gói D) — mọi state đặt TRƯỚC `return` sớm (D-F9) ----------
  /** Mẫu đang cất (đọc cùng lượt với quyền riêng). `null` = chưa đọc được / hỏng — khoá tick và bảng mẫu. */
  const [mau, setMau] = useState<MauChucDanh | null>(null);
  const [canhBaoMau, setCanhBaoMau] = useState<string[]>([]);
  /** Lý do mẫu HỎNG (máy chủ trả `mau-hong`) — chỉ Quản trị thấy nút cứu. */
  const [mauHong, setMauHong] = useState<string | null>(null);
  /** Lọc theo chức danh ở khối Nhân sự (`""` = mọi chức danh). */
  const [chucDanhLoc, setChucDanhLoc] = useState("");
  /** Bản nháp của bảng mẫu — CHỈ ô định đổi; `null` ở một ô = về mặc định gốc. */
  const [nhapMau, setNhapMau] = useState<ThayDoiMau>({});
  const [hoiLuuMau, setHoiLuuMau] = useState(false);
  /** Bản chụp hộp xác nhận lưu mẫu — cùng nếp `hoiLuuCuoi` (chỉ cập nhật khi MỞ). */
  const [hoiLuuMauCuoi, setHoiLuuMauCuoi] = useState<TomTatLuuMau | null>(null);
  const [hoiBoRieng, setHoiBoRieng] = useState(false);
  const [hoiBoRiengCuoi, setHoiBoRiengCuoi] = useState<TomTatBoRieng | null>(null);
  const [hoiCuuMau, setHoiCuuMau] = useState(false);
  const [hoiXoaDemo, setHoiXoaDemo] = useState(false);
  const [dangLuuMau, setDangLuuMau] = useState(false);
  /** Lịch sử demo (chế độ tài khoản mẫu) — bản thật xem ở Nhật ký hệ thống. */
  const [lichSuDemo, setLichSuDemo] = useState<DongLichSuDemo[] | null>(null);
  /** Khối Nhân sự — bấm "N người…" ở đầu cột bảng mẫu thì cuộn lên đây. */
  const khoiNhanSuRef = useRef<HTMLDivElement>(null);

  // ---------- Chọn người + bản nháp ----------
  /** Mã Firebase của những người đang chọn. */
  const [chon, setChon] = useState<string[]>([]);
  /** CHỈ các ô đã chạm. Ô vắng mặt = giữ nguyên của từng người. */
  const [nhapQuyen, setNhapQuyen] = useState<QuyenRieng>({});
  /** Chức danh mới. `""` = giữ nguyên. */
  const [nhapVaiTro, setNhapVaiTro] = useState("");
  const [tuKhoaDs, setTuKhoaDs] = useState("");
  /** Nhóm quyền đang GẬP (Được xem / Được làm / Quản trị) — chỉ là cách xem. */
  const [nhomGap, setNhomGap] = useState<string[]>([]);
  const [phongBanDs, setPhongBanDs] = useState("");
  const [hoiLuu, setHoiLuu] = useState(false);
  /**
   * ★ BẢN SAO CUỐI của hộp xác nhận — giữ để hộp còn nội dung trong lúc chạy hiệu ứng đóng.
   *
   * 🔴 Hộp bọc bằng `{hoiLuu && …}` thì bấm Đồng ý/Hủy làm `<Dialog>` bị tháo khỏi cây NGAY trong lần
   * commit `open` chuyển sang `false`; base-ui không kịp gỡ khoá cuộn và `data-base-ui-inert`, cả app
   * bấm không ăn tới khi F5 (sự cố Sếp báo 13 và 14/09/2026). Chỉ cập nhật khi MỞ, không xoá khi đóng.
   */
  const [hoiLuuCuoi, setHoiLuuCuoi] = useState<TomTatLuu | null>(null);
  const [dangLuu, setDangLuu] = useState(false);

  /**
   * ★★ ẨN TÀI KHOẢN ĐÃ NGỪNG TRUY CẬP — Sếp 17/09/2026: ***"nếu như tài khoản nào đã bị đổi
   * ngừng truy cập thì phải ẩn khỏi giao diện này"***.
   *
   * 🔴 ẨN CHO GỌN, NHƯNG PHẢI CÓ ĐƯỜNG QUAY LẠI — vì thứ duy nhất mở lại quyền cho một người
   * chính là màn này. Ẩn hẳn mà không chừa cửa là người bị ngừng nhầm **không ai khôi phục được
   * nữa**. Mặc định ẩn (đúng ý Sếp), ô tích mở lại khi cần, và luôn nói đã ẩn bao nhiêu người.
   */
  // Ô tích bật lại đã bỏ 26/09/2026 — cửa quay lại nay là ô tìm (xem `dsHien`).

  /**
   * ★★ DANH BẠ CÔNG TY — GỘP VÀO KHỐI "NHÂN SỰ" (Sếp 26/09/2026).
   *
   * Sếp: *"Và sao danh sách nhân sự lại chưa kéo về hết được"*, rồi chỉ vào hai khối "Thêm người dùng
   * mới" và "Nhân sự": *"2 giao diện này có cùng chức năng không. Nếu cùng thì bỏ 1 cái đi"*. Hai khối
   * đúng là cùng một việc (gán quyền cho một người), chỉ khác là người đó đã có hồ sơ hay chưa — nên
   * GỘP: khối "Nhân sự" nay kéo TOÀN BỘ danh bạ App Tổng (cùng nguồn `/api/directory` qua
   * `docDanhBaCongTy` mà khối cũ dùng), người chưa có hồ sơ hiện nhãn "Chưa có quyền".
   *
   * ⚠️ ĐẢO NGƯỢC có chủ đích quyết định 20/08/2026 (commit e6f352f, Ban lãnh đạo: *"ẩn thông tin này
   * đi, để mục tìm kiếm theo phòng ban của app tổng"* — khi đó danh bạ KHÔNG bày sẵn). Nay Sếp muốn thấy
   * đủ. Danh sách cuộn trong khung nên ~100+ người không làm trang dài; mặc định "Tất cả phòng ban" +
   * ô tìm tên/email. Màn này chỉ mở cho Quản trị/Trưởng bộ phận (`quyen.phanQuyenNguoiDung`).
   *
   * 📌 Mọi thứ khối cũ có đều còn: lọc phòng ban (kể cả "Chưa gán phòng ban"), tìm tên/email, nút đọc
   * lại danh bạ (gộp vào nút "Đọc lại"), câu báo khi danh bạ đang đọc / đọc không được.
   */
  const [danhBa, setDanhBa] = useState<ThanhVienDanhBa[] | null>(null);
  const [dangTaiDanhBa, setDangTaiDanhBa] = useState(false);

  // ---------- ★ Bề rộng cột "Nhân sự" kéo được (Sếp 26/09/2026) ----------
  const [rongCot, setRongCot] = useState(RONG_COT_MAC_DINH);
  /** Đang kéo: điểm bắt đầu. `null` = không kéo. Ref để khỏi vẽ lại mỗi lần di chuột. */
  const keoRef = useRef<{ x: number; rong: number } | null>(null);

  /**
   * ★ NGUỒN DỮ LIỆU (Sếp 06/10/2026, gói D): máy chủ thật ở chế độ `sso`, KHO DEMO (localStorage) ở chế
   * độ tài khoản mẫu — một đối tượng, màn này không tự rẽ nhánh theo chế độ ở từng chỗ gọi.
   * 📌 Phụ thuộc ĐÚNG `nguoiDung.uid`: quyền của mình đổi (kho demo phát tin) KHÔNG được làm trang tự đọc
   * lại mẫu — tự đọc lại là bản nháp dựng theo mẫu cũ đi kèm phiên bản mẫu MỚI, lọt chốt 409.
   */
  const uidCuaToi = nguoiDung.uid;
  const nguon = useMemo(() => layNguonPhanQuyen({ uid: uidCuaToi }), [uidCuaToi]);
  const laDemo = nguon.laDemo;
  /* Đổi người đang đăng nhập (bản demo đổi tài khoản mẫu trên Header) → bỏ mọi bản nháp của người trước:
     nháp đó dựng theo quyền của người khác, lưu dưới tên người mới là sai người. */
  useEffect(() => {
    setNhapMau({});
    setNhapQuyen({});
    setNhapVaiTro("");
  }, [uidCuaToi]);

  /**
   * Đọc CẢ hồ sơ lẫn quyền riêng + MẪU một lượt — thứ hiện trên màn phải là thứ máy chủ THẬT SỰ đang giữ.
   *
   * ⚠️ Đọc quyền riêng hỏng thì GHI NHỚ LỖI (khoá ô tick), không coi như "chưa ai có quyền riêng":
   * coi nhầm vậy là màn hiện quyền theo chức danh trong khi người ta đang có quyền riêng khác hẳn.
   * Mẫu đọc cùng lượt (`?tatCa=1` trả kèm) — lỗi thì mẫu `null` (khoá cả tick lẫn bảng mẫu), hỏng thì nhớ
   * lý do để Quản trị thấy nút cứu. 🔴 KHÔNG rơi về mẫu trống (mẫu trống có thể rộng hơn mẫu đang cất).
   */
  /** Trả MẪU vừa đọc, hoặc `null` khi KHÔNG đọc được quyền riêng / mẫu — `docLai` dùng để dọn/dựng lại bản nháp tick. */
  const tai = useCallback(async (): Promise<MauChucDanh | null> => {
    setDangTai(true);
    try {
      const [ds, rieng] = await Promise.all([nguon.docHoSo(), nguon.docQuyenRiengTatCa()]);
      setDanhSach(ds);
      setLichSuDemo(nguon.lichSuDemo());
      if ("loi" in rieng) {
        setBanGhiRieng(null);
        setLoiRieng(rieng.loi);
        setMau(null);
        setCanhBaoMau([]);
        setMauHong(rieng.mauHong ? rieng.loi : null);
        return null;
      }
      setBanGhiRieng(rieng.tatCa);
      setLoiRieng(null);
      setMau(rieng.mau);
      setCanhBaoMau(rieng.canhBaoMau);
      setMauHong(null);
      return rieng.mau;
    } finally {
      setDangTai(false);
    }
  }, [nguon]);

  const taiDanhBa = useCallback(async () => {
    setDangTaiDanhBa(true);
    try {
      setDanhBa(await nguon.docDanhBa());
    } finally {
      setDangTaiDanhBa(false);
    }
  }, [nguon]);

  useEffect(() => {
    void tai();
    void taiDanhBa();
  }, [tai, taiDanhBa]);

  /* Bề rộng cột đã nhớ theo MÁY — đọc SAU khi dựng (trang dựng sẵn không có localStorage; đọc lúc dựng
     là lệch giữa máy chủ và trình duyệt). Lỗi / giá trị lạ → giữ mặc định. */
  useEffect(() => {
    try {
      const v = Number(window.localStorage.getItem(KHOA_LUU_RONG_COT));
      if (Number.isFinite(v) && v >= RONG_COT_MIN && v <= RONG_COT_MAX) setRongCot(v);
    } catch {
      // Chế độ riêng tư / bị chặn bộ nhớ — dùng mặc định.
    }
  }, []);

  function datRongCot(v: number, luu: boolean) {
    const r = kepRongCot(v);
    setRongCot(r);
    if (!luu) return;
    try {
      window.localStorage.setItem(KHOA_LUU_RONG_COT, String(r));
    } catch {
      // Không lưu được thì lần sau về mặc định — không sao.
    }
  }

  /**
   * 🔴 MÃ FIREBASE CỦA CHÍNH MÌNH — để chốt "không tự sửa mình" so CÙNG LỚP danh tính với danh sách
   * (khoá = mã Firebase). `nguoiDung.uid` là mã NGHIỆP VỤ (`u-tm1`…), so thẳng là lệch lớp và chốt
   * mất tác dụng mà không có gì báo. Owner thì hai mã trùng nhau nên đường lùi vẫn đúng.
   */
  const nguoiGoi = useMemo(() => {
    const uid = danhSach?.find((h) => h.hoSo.uidNghiepVu === nguoiDung.uid)?.firebaseUid ?? nguoiDung.uid;
    /* ★ 06/10/2026: quyền người gọi tính ĐÚNG như máy chủ dựng — hồ sơ + bản riêng của mình + MẪU ĐANG CẤT
       (`ganQuyenRiengHieuLuc`). Quyền trong phiên đăng nhập có thể là của mẫu cũ (đọc lúc vào app); dùng nó
       là màn hình nói "được" mà máy chủ nói "không", hoặc ngược lại. Chưa đọc được mẫu → giữ quyền phiên. */
    const ndHieuLuc =
      mau && banGhiRieng ? ganQuyenRiengHieuLuc(nguoiDung, banGhiRieng[uid] ?? null, mau) : nguoiDung;
    return { uid, nguoiDung: ndHieuLuc };
  }, [danhSach, nguoiDung, mau, banGhiRieng]);

  const tatCaNguoi = useMemo<ThongTinNguoi[]>(
    () =>
      (danhSach ?? []).map((hs) => {
        const nd = thanhNguoiDung(hs.hoSo);
        /* ★ Quyền gốc = công thức + MẪU chức danh (06/10/2026). Mẫu chưa đọc được (`null`) thì phần tick đã
           khoá và nhãn từng người ghi "Chưa rõ quyền riêng" — không bày số quyền đoán mò. */
        const goc = quyenTheoChucDanhCoMau(tinhQuyenTheoChucDanh(nd), mau ? oDeCuaHoSo(mau, nd) : null);
        const laQuanTri = nd.vaiTro === "admin";
        const rieng = banGhiRieng?.[hs.firebaseUid] ?? null;
        /* `quyenHieuLuc` = máy chủ đã đối chiếu dấu chức danh — bản lưu cho chức danh cũ chỉ mang sang
           những cờ đã bị bỏ thật. Đừng dùng `rieng.quyen` (bản thô) ở đây. */
        const hieuLuc = apDungQuyenRieng(goc, rieng?.quyenHieuLuc, laQuanTri);
        /* Hỏi đúng luật route dùng, với "sau = trước" (chưa trao gì) → chỉ còn các chốt về NGƯỜI:
           tự sửa mình · cấp cao hơn · tài khoản Quản trị/BGĐ · người gọi hết quyền phân quyền.
           🔴 Chốt "tự sửa mình" so CẢ HAI lớp danh tính (soát chéo lần 2 26/09/2026): mã nghiệp vụ và
           mã Firebase. So một lớp thì hồ sơ nào có `uidNghiepVu` lệch (tài khoản mẫu cũ `u-tmX`) là chốt
           không bắt được — màn cho tự sửa, chỉ tới lúc máy chủ từ chối mới lộ. */
        const laChinhMinh =
          hs.hoSo.uidNghiepVu === nguoiDung.uid || hs.firebaseUid === nguoiGoi.uid;
        const uidLuat = laChinhMinh ? nguoiGoi.uid : hs.firebaseUid;
        const lyDoKhoa = vuongMacTraoQuyen(nguoiGoi, [
          {
            uid: uidLuat,
            ten: nd.tenHienThi,
            vaiTro: nd.vaiTro,
            capTM: nd.capTM,
            quyenGoc: goc,
            quyenTruoc: hieuLuc,
            quyenSau: hieuLuc,
            boVaoApp: false,
          },
        ]);
        return {
          hs,
          ten: hs.hoSo.tenHienThi,
          phongBan: hs.hoSo.phongBan?.trim() || CHUA_GAN_PHONG_BAN,
          nd,
          vtHienTai: vaiTroKhopVoiHoSo(hs.hoSo),
          goc,
          rieng,
          hieuLuc,
          laQuanTri,
          lyDoKhoa,
          uidLuat,
          chuaCoHoSo: false,
        };
      }),
    [danhSach, banGhiRieng, nguoiGoi, nguoiDung.uid, mau],
  );

  /**
   * ★ NGƯỜI TRONG DANH BẠ CHƯA CÓ HỒ SƠ — gộp khối "Thêm người dùng mới" (xem chú thích ở `danhBa`).
   *
   * 📌 Lọc bằng CẢ cờ `daCoHoSoThuMua` của danh bạ LẪN danh sách hồ sơ vừa đọc: danh bạ máy chủ giữ bộ
   * nhớ 60 giây, người vừa được cấp quyền có thể vẫn mang cờ cũ — so thêm với `danhSach` thì không bày
   * một người hai lần. Hồ sơ DỰNG TẠM cấp 0 chỉ để dùng chung khuôn `ThongTinNguoi`; `vtHienTai` để
   * trống (khuôn cấp 0 trùng "Ngừng truy cập", mà người này chưa từng bị ngừng).
   */
  const nguoiChuaCoHoSo = useMemo<ThongTinNguoi[]>(() => {
    if (!danhBa || danhSach === null) return [];
    const daCo = new Set(danhSach.map((h) => h.firebaseUid));
    return danhBa
      .filter((tv) => !tv.daCoHoSoThuMua && !daCo.has(tv.uid))
      .sort((a, b) => a.hoTen.localeCompare(b.hoTen, "vi"))
      .map((tv) => {
        const hs: HoSoKemMa = {
          firebaseUid: tv.uid,
          hoSo: {
            uidNghiepVu: tv.uid,
            email: tv.email,
            tenHienThi: tv.hoTen,
            chucDanh: tv.chucDanh,
            phongBan: tv.phongBan,
            chucNang: "phong_thi_cong",
            vaiTro: "staff",
            capTM: 0,
            dangLamViec: true,
          },
        };
        const nd = thanhNguoiDung(hs.hoSo);
        /* Cấp 0 — mẫu không áp (`quyenTheoChucDanhCoMau` trả nguyên công thức khi không vào được app); viết
           cùng một biểu thức với `tatCaNguoi` để mọi chỗ tính quyền gốc đều qua mẫu. */
        const goc = quyenTheoChucDanhCoMau(tinhQuyenTheoChucDanh(nd), mau ? oDeCuaHoSo(mau, nd) : null);
        const laChinhMinh = tv.uid === nguoiGoi.uid;
        const uidLuat = laChinhMinh ? nguoiGoi.uid : tv.uid;
        const lyDoKhoa = vuongMacTraoQuyen(nguoiGoi, [
          {
            uid: uidLuat,
            ten: tv.hoTen,
            vaiTro: "staff",
            capTM: 0,
            quyenGoc: goc,
            quyenTruoc: goc,
            quyenSau: goc,
            boVaoApp: false,
          },
        ]);
        return {
          hs,
          ten: tv.hoTen,
          phongBan: tv.phongBan.trim() || CHUA_GAN_PHONG_BAN,
          nd,
          vtHienTai: undefined,
          goc,
          rieng: null,
          hieuLuc: goc,
          laQuanTri: false,
          lyDoKhoa,
          uidLuat,
          chuaCoHoSo: true,
        };
      });
  }, [danhBa, danhSach, nguoiGoi, mau]);

  const tatCaVaDanhBa = useMemo(() => [...tatCaNguoi, ...nguoiChuaCoHoSo], [tatCaNguoi, nguoiChuaCoHoSo]);

  /* Dùng `vaiTroKhopVoiHoSo` — đúng hàm ô chức danh dùng — để biết ai đang ngừng truy cập. Tự so
     tay `capTM` ở đây là hai chỗ cùng trả lời một câu, sớm muộn lệch nhau. */
  const laNgung = (t: ThongTinNguoi) => !t.chuaCoHoSo && t.vtHienTai?.ma === "ngung_truy_cap";
  /* ★ Sếp 26/09/2026 bỏ ô "Hiện cả N tài khoản đã ngừng truy cập". CỬA QUAY LẠI chuyển sang ô
     tìm: GÕ TÊN thì tài khoản ngừng truy cập vẫn hiện — không có đường này thì người bị ngừng
     nhầm không ai khôi phục được (lý do ở chú thích phía trên, Sếp 17/09/2026). */
  /* ★ 06/10/2026: lọc chức danh "Ngừng truy cập" cũng là một cửa quay lại — không có dòng này thì chọn
     chức danh đó luôn ra danh sách rỗng và báo "Không có ai khớp bộ lọc", tức nói sai. */
  const dsHien = tatCaVaDanhBa.filter(
    (t) => tuKhoaDs.trim() !== "" || chucDanhLoc === "ngung_truy_cap" || !laNgung(t),
  );

  const dsPhongBanDs = [...new Set(dsHien.map((t) => t.phongBan))].sort((a, b) =>
    a === CHUA_GAN_PHONG_BAN ? 1 : b === CHUA_GAN_PHONG_BAN ? -1 : a.localeCompare(b, "vi"),
  );

  const tuKhoaLoc = boDau(tuKhoaDs.trim());
  /* ★ Sếp 26/09/2026: *"Khi bấm chọn phòng ban thì mới hiện ra danh sách nhân sự của phòng ban đó"*,
     *"Mục này chưa cần hiển thị, chỉ khi nào chọn phòng ban hoặc tìm tên thì mới hiện"*. Chưa chọn
     phòng ban và chưa gõ tên → danh sách TRỐNG kèm lời nhắc. "Tất cả phòng ban" vẫn chọn được
     (giá trị riêng `TAT_CA_PHONG_BAN`). Người đang được chọn vẫn giữ nguyên ở cột phải. */
  const chuaLoc = phongBanDs === "" && tuKhoaLoc === "" && chucDanhLoc === "";
  /** Người có khớp ô lọc chức danh không (Sếp 06/10/2026). Dùng ĐÚNG nhãn chức danh của danh sách (`vtHienTai`). */
  const khopChucDanh = (t: ThongTinNguoi) =>
    chucDanhLoc === "" ||
    (chucDanhLoc === LOC_CHUA_CO_HO_SO
      ? t.chuaCoHoSo
      : chucDanhLoc === LOC_TUY_CHINH
        ? !t.chuaCoHoSo && !t.vtHienTai
        : !t.chuaCoHoSo && t.vtHienTai?.ma === chucDanhLoc);
  const dsLoc = dsHien.filter(
    (t) =>
      !chuaLoc &&
      (phongBanDs === "" || phongBanDs === TAT_CA_PHONG_BAN || t.phongBan === phongBanDs) &&
      khopChucDanh(t) &&
      (tuKhoaLoc === "" ||
        boDau(t.ten).includes(tuKhoaLoc) ||
        boDau(t.hs.hoSo.email ?? "").includes(tuKhoaLoc)),
  );

  const dsChon = useMemo(
    () => tatCaVaDanhBa.filter((t) => chon.includes(t.hs.firebaseUid)),
    [tatCaVaDanhBa, chon],
  );
  const vtMoi = timVaiTroChuan(nhapVaiTro);

  /** Mỗi người đang chọn: quyền trước/sau khi lưu — CÙNG phép tính route dùng. */
  const duKien = useMemo<DuKien[]>(
    () =>
      dsChon.map((t) => {
        /* Chỉ coi là ĐỔI chức danh khi khác chức danh hiện tại — trùng thì lần lưu không gọi
           `/api/phan-quyen`, hồ sơ giữ nguyên, nên dấu chức danh cũng giữ nguyên. */
        const doiCD = Boolean(vtMoi) && t.vtHienTai?.ma !== vtMoi?.ma;
        const ndSau =
          doiCD && vtMoi
            ? { chucNang: vtMoi.chucNang, vaiTro: vtMoi.vaiTro, capTM: vtMoi.capTM, capKho: vtMoi.capKho ?? 0 }
            : t.nd;
        const goc = doiCD && vtMoi ? quyenCuaVaiTroCoMau(vtMoi, mau ?? MAU_TRONG) : t.goc;
        const laQT = ndSau.vaiTro === "admin";
        /* 🔴 Bản riêng cũ đối chiếu với chức danh SAU lần lưu — đúng như route sẽ làm sau khi
           `/api/phan-quyen` đổi hồ sơ. Đổi chức danh thì chỉ mang sang những cờ đã bị bỏ thật.
           ★ 06/10/2026 (B-F1, gói D): tham số mẫu bắt buộc — ô đè mẫu của chức danh SAU lần lưu. Mẫu chưa
           đọc được thì phần tick đã khoá (`loiRieng`), `null` ở đây chỉ để xem trước lần đổi chức danh. */
        const riengCu = quyenRiengConHieuLuc(t.rieng, ndSau, mau ? oDeCuaHoSo(mau, ndSau) : null);
        return {
          t,
          goc,
          laQT,
          capTM: ndSau.capTM,
          vaiTro: ndSau.vaiTro,
          maVaiTro: doiCD && vtMoi ? vtMoi.ma : t.vtHienTai?.ma,
          ts: tinhTruocSauKhiLuu(goc, riengCu, laQT, nhapQuyen),
        };
      }),
    [dsChon, vtMoi, nhapQuyen, mau],
  );

  /** ★ Sếp 06/10/2026: số người theo chức danh cho đầu cột bảng mẫu ("N người · M có quyền riêng"). */
  const demNguoi = useCallback(
    (ma: MaVaiTroChuan) => {
      const ds = tatCaNguoi.filter((t) => t.vtHienTai?.ma === ma);
      return { soNguoi: ds.length, soCoRieng: ds.filter((t) => t.rieng).length };
    },
    [tatCaNguoi],
  );

  /* Lớp chặn thứ ba — hai lớp kia là mục menu và `duocVaoDuongDan`. Mỗi lớp che một đường vào
     khác nhau (menu · gõ URL · điều hướng trong app). */
  if (!quyen.phanQuyenNguoiDung) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Không có quyền vào mục này"
        description="Chỉ tài khoản Quản trị và Trưởng bộ phận mới xem được phân quyền người dùng."
      />
    );
  }

  const toiDa = capDatDuocToiDa(nguoiDung);
  /* Vai trò người này gán được — luật ở `vaiTroGanDuocBoi`, KHÔNG lọc tay ở đây. */
  const vaiTroGanDuoc = vaiTroGanDuocBoi(toiDa);

  // ---------- Trạng thái bảng quyền ----------
  const coNhapQuyen = Object.keys(nhapQuyen).length > 0;
  /* KHÔNG ghi quyền riêng khi:
     · hạ về "Ngừng truy cập" — quyền riêng vô hiệu (`apDungQuyenRieng` ③);
     · nâng lên "Quản trị hệ thống" — quản trị luôn đủ quyền (soát chéo 26/09/2026 ca D: trước đây
       vẫn ghi nên khung khoá tick báo "tài khoản Quản trị" và khoá luôn nút Lưu → không nâng được);
     · chưa đọc được quyền riêng đang lưu — vẫn cho ĐỔI CHỨC DANH (chỉ gọi `/api/phan-quyen`), chỉ khoá
       phần tick (ca E). An toàn nhờ dấu chức danh: bản riêng cũ lệch dấu chỉ mang sang những cờ đã
       bị bỏ thật, không mang cờ vượt chức danh (`quyenRiengHieuLuc`). */
  const ghiQuyen =
    coNhapQuyen && !loiRieng && !(vtMoi && (vtMoi.capTM === 0 || vtMoi.vaiTro === "admin"));
  const coNhap = coNhapQuyen || nhapVaiTro !== "";

  /** Vì sao ô tick đang khoá. `null` = tick được. Luật từng người ở `lyDoKhongTickNguoi`. */
  const lyDoKhongTick: string | null = (() => {
    if (dsChon.length === 0) return "Chọn ít nhất một người ở cột trái.";
    const khoa = dsChon.find((t) => t.lyDoKhoa);
    if (khoa) return khoa.lyDoKhoa;
    if (loiRieng) {
      return `Chưa đọc được quyền riêng đang lưu (${loiRieng}). Bấm "Đọc lại" — tạm khoá tick để không lưu đè sai. Vẫn đổi được chức danh.`;
    }
    for (const d of duKien) {
      const ly = lyDoKhongTickNguoi(d.t, { laQT: d.laQT, goc: d.goc, maVaiTro: d.maVaiTro });
      if (ly) return ly;
    }
    return null;
  })();

  /**
   * 🔴 Ô "Vào app" KHÔNG BỎ ĐƯỢC khi trong nhóm có người cấp ≥ 3 (soát chéo 26/09/2026) — máy chủ
   * `/api/phan-quyen` vẫn cho họ gán chức danh theo cấp, bỏ ô này chỉ khoá giao diện. Luật + câu lý do
   * ở `luat-phan-quyen.ts` (`vuongMacTraoQuyen` ④b). Vẫn TICK LÊN được (bản riêng cũ đã lỡ khoá).
   */
  const nguoiKhongBoVaoApp = duKien.find((d) => d.capTM >= CAP_KHONG_BO_VAO_APP);
  const lyDoKhoaVaoApp = nguoiKhongBoVaoApp ? lyDoKhongBoVaoApp(nguoiKhongBoVaoApp.t.ten) : null;

  /** Giá trị hiện của một ô: đã chạm thì theo nháp; chưa chạm thì theo quyền hiện tại của nhóm. */
  function giaTriCo(k: keyof Quyen): boolean | "mixed" {
    if (k in nhapQuyen) return nhapQuyen[k] === true;
    if (duKien.length === 0) return false;
    const bat = duKien.filter((d) => d.ts.quyenTruoc[k]).length;
    return bat === 0 ? false : bat === duKien.length ? true : "mixed";
  }

  /**
   * ★ Bổ sung đặc tả D-F3 (06/10/2026): KHOÁ CHIỀU BẬT ngay tại ô — bật là TRAO một cờ mà người tick không
   * có (luật ⑤). Hỏi ĐÚNG luật máy chủ dùng (`lyDoKhongBatCoKhiTick` ở `luat-phan-quyen.ts`, cùng thân với
   * `vuongMacTraoQuyen` ⑤), không viết luật ở đây. TẮT thì luôn được — khác bảng mẫu (khoá cả hai chiều).
   */
  const lyDoKhongBatO = (k: keyof Quyen): string | null =>
    lyDoKhongBatCoKhiTick(
      nguoiGoi,
      duKien.map((d) => ({ ten: d.t.ten, quyenGoc: d.goc, quyenTruoc: d.ts.quyenTruoc })),
      k,
    );

  /* Tick một ô "Được làm/Được xem" thì tự tick "Vào app"; bỏ "Vào app" là bỏ hết — y như luật áp
     quyền ở `quyen-rieng.ts`, để thứ nhìn thấy khớp thứ được cất. */
  function doiCo(k: keyof Quyen, bat: boolean) {
    if (k === "xemDuocApp" && !bat && lyDoKhoaVaoApp) {
      toast.error("Không bỏ được", { description: lyDoKhoaVaoApp });
      return;
    }
    /* D-F3: bấm ra BẬT mà là trao cờ mình không có → chặn kèm lý do. Riêng ô "mỗi người một kiểu" thì chiều
       duy nhất còn lại là TẮT cho cả nhóm — làm đúng chiều đó và nói rõ (hộp xác nhận vẫn liệt kê "Tắt"). */
    const chanBat = bat ? lyDoKhongBatO(k) : null;
    if (chanBat) {
      if (giaTriCo(k) !== "mixed") {
        toast.error("Không bật được", { description: chanBat });
        return;
      }
      toast.info("Không bật được cho cả nhóm — đã đặt TẮT cho cả nhóm", { description: chanBat });
      bat = false;
    }
    setNhapQuyen((c) => {
      const moi: QuyenRieng = { ...c, [k]: bat };
      if (k === "xemDuocApp" && !bat) for (const kk of KHOA_TICK) moi[kk] = false;
      if (k !== "xemDuocApp" && bat) moi.xemDuocApp = true;
      return moi;
    });
  }

  /**
   * "Bỏ hết": tắt mọi ô. Trong nhóm có người cấp ≥ 3 thì KHÔNG ĐƯA "Vào app" vào bản nháp (soát chéo
   * lần 2 26/09/2026) — mỗi người giữ "Vào app" của chính họ. Bản trước ghi `xemDuocApp: true` cho cả
   * nhóm, tức lặng lẽ BẬT "Vào app" cho người cấp thấp hơn trong nhóm vốn đang bị bỏ.
   */
  function boHet() {
    if (!lyDoKhoaVaoApp) {
      doiCo("xemDuocApp", false);
      return;
    }
    const moi: QuyenRieng = {};
    for (const kk of KHOA_TICK) if (kk !== "xemDuocApp") moi[kk] = false;
    setNhapQuyen(moi);
  }

  function datLaiNhap() {
    setNhapQuyen({});
    setNhapVaiTro("");
  }

  /** Bấm vào TÊN: chọn đúng một người. Bản nháp cũ bỏ đi — báo cho người dùng biết. */
  function chonMot(uid: string) {
    if (coNhap && !(chon.length === 1 && chon[0] === uid)) {
      toast.info("Đã bỏ thay đổi chưa lưu của lượt chọn trước.");
    }
    if (!(chon.length === 1 && chon[0] === uid)) datLaiNhap();
    setChon([uid]);
  }

  /** Bấm ô tích: thêm/bớt vào nhóm. GIỮ bản nháp — ô đã chạm áp cho cả nhóm mới. */
  function doiChonNhieu(uid: string, them: boolean) {
    setChon((c) => (them ? (c.includes(uid) ? c : [...c, uid]) : c.filter((x) => x !== uid)));
  }

  /* Chỉ gom người TICK ĐƯỢC (soát chéo 26/09/2026 ca F) — gom cả Quản trị / người cấp 0 là khoá tick
     cả nhóm. Muốn đổi chức danh cho họ thì chọn riêng từng người. */
  const dsLocSuaDuoc = dsLoc.filter(tickDuoc);
  /* Nói rõ đã bỏ qua ai — bỏ qua im lặng là người dùng tưởng "chọn tất cả" đã gom đủ. */
  const soBoQuaQtNgung = dsLoc.filter((t) => !t.lyDoKhoa && !t.chuaCoHoSo && !tickDuoc(t)).length;
  const soBoQuaChuaCo = dsLoc.filter((t) => !t.lyDoKhoa && t.chuaCoHoSo).length;
  const soChuaCoTrongLoc = dsLoc.filter((t) => t.chuaCoHoSo).length;
  const soBoQuaKhoa = dsLoc.filter((t) => t.lyDoKhoa).length;
  const soLocDaChon = dsLocSuaDuoc.filter((t) => chon.includes(t.hs.firebaseUid)).length;
  const giaTriChonTatCa: boolean | "mixed" =
    soLocDaChon === 0 ? false : soLocDaChon === dsLocSuaDuoc.length ? true : "mixed";

  function chonTatCaDangLoc(them: boolean) {
    const uids = dsLocSuaDuoc.map((t) => t.hs.firebaseUid);
    setChon((c) => (them ? [...new Set([...c, ...uids])] : c.filter((x) => !uids.includes(x))));
  }

  /* 📌 Nút "Áp mẫu theo chức danh" ĐÃ BỎ (06/10/2026): với khuôn ngoại lệ (Câu 3 = A), áp mẫu rồi lưu là
     không còn ô ngoại lệ nào → xoá bản ghi — đúng việc của nút "Bỏ quyền riêng — về theo chức danh" bên
     dưới. Giữ cả hai là hai chỗ cùng làm một việc. */

  // ---------- ★ BỎ QUYỀN RIÊNG — về theo chức danh (Sếp 06/10/2026) ----------
  const dsCoRieng = dsChon.filter((t) => t.rieng);
  /** Vì sao nút "Bỏ quyền riêng" mờ — `null` = bấm được. */
  const lyDoKhongBoRieng: string | null =
    dsCoRieng.length === 0
      ? "Không ai trong số đang chọn có quyền riêng."
      : coNhap
        ? "Đang có thay đổi chưa lưu ở khối tick — lưu hoặc hoàn tác trước."
        : nhapVaiTro !== ""
          ? "Đang đổi chức danh — lưu hoặc hoàn tác trước."
          : loiRieng || !mau
            ? "Chưa đọc được quyền riêng / mẫu chức danh — bấm “Đọc lại”."
            : Object.keys(nhapMau).length > 0
              ? "Đang có thay đổi chưa lưu ở bảng mẫu — lưu hoặc hoàn tác bảng mẫu trước."
              : null;

  function moHopBoRieng() {
    if (lyDoKhongBoRieng || !mau) return;
    /* Xem trước: quyền hiệu lực HIỆN TẠI → quyền theo chức danh (công thức + mẫu). Hỏi trước ĐÚNG luật máy
       chủ sẽ hỏi (`vuongMacTraoQuyen` — xoá bản đã bỏ ô là trao lại cờ đó). */
    const bat = KHOA_TICK.filter((k) => dsCoRieng.some((t) => !t.hieuLuc[k] && t.goc[k])).map(nhanCoTick);
    const tat = KHOA_TICK.filter((k) => dsCoRieng.some((t) => t.hieuLuc[k] && !t.goc[k])).map(nhanCoTick);
    const loi = vuongMacTraoQuyen(
      nguoiGoi,
      dsCoRieng.map((t) => ({
        uid: t.uidLuat,
        ten: t.ten,
        vaiTro: t.nd.vaiTro,
        capTM: t.nd.capTM,
        quyenGoc: t.goc,
        quyenTruoc: t.hieuLuc,
        quyenSau: t.goc,
        boVaoApp: false,
      })),
    );
    setHoiBoRiengCuoi({
      uids: dsCoRieng.map((t) => t.hs.firebaseUid),
      ten: dsCoRieng.map((t) => t.ten),
      bat,
      tat,
      phienBanMau: mau.phienBan,
      loi,
    });
    setHoiBoRieng(true);
  }

  async function boRiengThat(tom: TomTatBoRieng) {
    setDangLuu(true);
    try {
      const kq = await nguon.boQuyenRieng(tom.uids, tom.phienBanMau);
      if (kq.loi !== null) {
        toast.error(kq.maLoi === "mau-doi" ? "Mẫu chức danh vừa được sửa ở nơi khác" : "Chưa bỏ được quyền riêng", {
          description: kq.loi,
          duration: 12000,
        });
        await docLai();
        return;
      }
      toast.success("Đã bỏ quyền riêng", {
        description: `${kq.soDaXoa} người về theo chức danh · có hiệu lực khi họ tải lại trang hoặc quay lại tab.`,
      });
      lamMoiNguoiKhongVaoApp();
      yeuCauDocLaiQuyenCuaToi();
      await tai();
    } finally {
      setDangLuu(false);
    }
  }

  // ---------- ★ BẢNG MẪU CHỨC DANH (Sếp 06/10/2026 — Câu 1 = A, Câu 2 = B) ----------
  const coNhapMau = Object.keys(nhapMau).length > 0;
  /** Lý do khoá CẢ bảng mẫu (từng ô vẫn hỏi `lyDoKhongSuaOMau` trong bảng). */
  const khoaBangMau: string | null = !mau
    ? (loiRieng ?? "Đang đọc bảng mẫu…")
    : !duocSuaMauChucDanh(nguoiGoi.nguoiDung)
      ? LY_DO_KHONG_SUA_MAU
      : null;

  /**
   * Mở hộp xác nhận lưu mẫu. 🔴 CHẠY THỬ `tinhLuuMauChucDanh` (đúng phép tính máy chủ / kho demo chạy)
   * trước — lỗi thì hộp hiện lý do và khoá nút Đồng ý, không để người dùng bấm rồi mới biết.
   */
  function moHopLuuMau() {
    if (!mau || !coNhapMau) return;
    const thu = tinhLuuMauChucDanh({
      nguoiGoi,
      mauCu: mau,
      phienBanGui: mau.phienBan,
      thayDoi: nhapMau,
      luc: new Date().toISOString(),
      capNhatBoi: nguoiGoi.uid,
      capNhatBoiTen: nguoiDung.tenHienThi,
    });
    let dong: string[] = [];
    let chiDao: string[] = [];
    if (thu.ok) {
      const anhHuong = anhHuongKhiDoiMau(
        mau,
        thu.mauMoi,
        tatCaNguoi.map((t) => ({ nd: t.nd, banGhi: t.rieng })),
      );
      dong = anhHuong.flatMap((a) =>
        a.doi.map(
          (o) =>
            `${timVaiTroChuan(a.ma)?.ten ?? a.ma}: ${o.sang ? "bật" : "tắt"} “${nhanCoTick(o.khoa)}” — ${o.soNguoi} người${
              o.soGiuNgoaiLe > 0 ? `, ${o.soGiuNgoaiLe} người giữ ngoại lệ (không đổi theo)` : ""
            }`,
        ),
      );
      const khoaDoi = [...new Set(anhHuong.flatMap((a) => a.doi.map((o) => o.khoa)))];
      chiDao = khoaDoi.flatMap((k) => (CHI_DAO_THEO_DONG[k] ? [`${nhanCoTick(k)}: ${CHI_DAO_THEO_DONG[k]}`] : []));
    }
    setHoiLuuMauCuoi({
      thayDoi: nhapMau,
      phienBan: mau.phienBan,
      loi: thu.ok ? null : thu.error,
      soODoi: thu.ok ? thu.soODoi : 0,
      dong,
      canhBao: thu.ok ? thu.canhBao : [],
      chiDao,
    });
    setHoiLuuMau(true);
  }

  async function luuMauThat(tom: TomTatLuuMau) {
    setDangLuuMau(true);
    try {
      const kq = await nguon.luuMau(tom.phienBan, tom.thayDoi);
      if (kq.loi !== null) {
        if (kq.maLoi === "mau-doi") {
          /* Đặc tả 6 · D5: 409 → báo, XOÁ bản nháp (dựng theo mẫu cũ), đọc lại. */
          setNhapMau({});
          toast.error("Mẫu chức danh vừa được sửa ở nơi khác — đã bỏ bản nháp", { description: kq.loi, duration: 12000 });
        } else {
          toast.error("Chưa lưu được bảng mẫu", { description: kq.loi, duration: 12000 });
        }
        await tai();
        return;
      }
      toast.success(`Đã lưu bảng mẫu (bản ${kq.phienBan})`, {
        description: `${kq.soODoi} ô đổi · có hiệu lực khi người đó tải lại trang hoặc quay lại tab.${
          kq.canhBao.length > 0 ? ` Lưu ý: ${kq.canhBao.join(" ")}` : ""
        }`,
        duration: kq.canhBao.length > 0 ? 15000 : 6000,
      });
      setNhapMau({});
      lamMoiNguoiKhongVaoApp();
      yeuCauDocLaiQuyenCuaToi();
      await tai();
    } finally {
      setDangLuuMau(false);
    }
  }

  /** Cứu mẫu HỎNG — chỉ Quản trị, không gửi `phienBan` (mẫu không đọc được thì không có bản nào để so). */
  async function cuuMauThat() {
    setDangLuuMau(true);
    try {
      const kq = await nguon.veMacDinhMauToanBo();
      if (kq.loi !== null) {
        toast.error("Chưa cứu được bảng mẫu", { description: kq.loi, duration: 12000 });
      } else {
        toast.success(`Đã đưa cả bảng mẫu về mặc định gốc (bản ${kq.phienBan})`);
        setNhapMau({});
        yeuCauDocLaiQuyenCuaToi();
      }
      await tai();
    } finally {
      setDangLuuMau(false);
    }
  }

  /** Bấm "N người…" ở đầu cột bảng mẫu → lọc khối Nhân sự theo chức danh đó rồi cuộn lên (MỘT danh sách). */
  function xemNguoiCuaChucDanh(ma: MaVaiTroChuan) {
    setChucDanhLoc(ma);
    khoiNhanSuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function doiChucDanhNhap(ma: string) {
    setNhapVaiTro(ma);
    const vt = timVaiTroChuan(ma);
    /* Đổi chức danh = tick lại toàn bộ theo mẫu của chức danh đó (đúng bản demo), rồi thêm/bớt
       tiếp. Giữ nguyên chức danh = bỏ bản nháp do lần đổi trước sinh ra.
       ⚠️ Chưa đọc được quyền riêng (`loiRieng`) thì KHÔNG dựng bản nháp — lần lưu đó chỉ đổi chức
       danh, bày một bộ ô "đã đổi" mà không ghi là giao diện hứa việc app không làm. Ô tick khi đó
       tự hiện mẫu chức danh mới (xem `giaTriCo`). */
    /* Cùng lý do: chức danh Quản trị / Ngừng truy cập thì lần lưu cũng không ghi ô tick (xem `ghiQuyen`). */
    const khongGhiTick = !vt || loiRieng || !mau || vt.vaiTro === "admin" || vt.capTM === 0;
    /* ★ 06/10/2026: mẫu của chức danh = công thức + MẪU ĐANG CẤT (không còn công thức trơn). */
    setNhapQuyen(khongGhiTick ? {} : rutQuyenRieng(quyenCuaVaiTroCoMau(vt, mau)));
  }

  /**
   * ĐỌC LẠI + dọn/dựng lại bản nháp tick theo kết quả (soát chéo lần 2 26/09/2026, ca E):
   *   · Đọc quyền riêng HỎNG mà đang có bản nháp tick → XOÁ nháp + báo. Nháp đó dựng trên quyền riêng
   *     cũ; lưu lúc không biết quyền riêng hiện tại là lưu đè mù.
   *   · Đọc lại THÀNH CÔNG sau lúc hỏng, mà đang chọn một chức danh mới → dựng lại mẫu tick theo chức
   *     danh đó (lúc hỏng `doiChucDanhNhap` cố ý không dựng).
   * 📌 Giá trị `nhapQuyen`/`loiRieng`/`vtMoi` trong hàm là của lúc BẤM — đúng thứ cần so.
   */
  async function docLai() {
    /* Đọc lại CẢ danh bạ (gộp nút "Đọc lại danh bạ" của khối "Thêm người dùng mới" cũ). */
    const [mauVuaDoc] = await Promise.all([tai(), taiDanhBa()]);
    const coLoi = mauVuaDoc === null;
    if (coLoi && Object.keys(nhapQuyen).length > 0) {
      setNhapQuyen({});
      toast.warning("Đã bỏ các ô tick chưa lưu", {
        description: "Chưa đọc được quyền riêng đang lưu nên không lưu đè được. Chức danh đang chọn vẫn giữ.",
        duration: 10000,
      });
    }
    /* ★ 06/10/2026: dựng theo MẪU VỪA ĐỌC (`tai` trả về) — state `mau` của lượt vẽ này vẫn là bản cũ. */
    if (mauVuaDoc && loiRieng && vtMoi && vtMoi.vaiTro !== "admin" && vtMoi.capTM !== 0) {
      setNhapQuyen(rutQuyenRieng(quyenCuaVaiTroCoMau(vtMoi, mauVuaDoc)));
      toast.info(`Đã tick lại theo mẫu chức danh “${vtMoi.ten}”.`);
    }
  }

  // ---------- Lưu ----------
  const uidDoiChucDanh = vtMoi
    ? dsChon.filter((t) => t.vtHienTai?.ma !== vtMoi.ma).map((t) => t.hs.firebaseUid)
    : [];
  const uidGhiQuyen = ghiQuyen ? duKien.filter((d) => d.ts.canGhi).map((d) => d.t.hs.firebaseUid) : [];

  /** Vì sao nút Lưu đang khoá. `null` = lưu được. */
  const lyDoKhongLuu: string | null = (() => {
    if (dsChon.length === 0) return "Chưa chọn ai.";
    const khoa = dsChon.find((t) => t.lyDoKhoa);
    if (khoa) return khoa.lyDoKhoa;
    /* ★ Hai bản nháp LOẠI TRỪ NHAU (06/10/2026): bấm một nút Lưu mà tưởng đã lưu cả hai là mất việc. */
    if (coNhapMau) return "Đang có thay đổi chưa lưu ở bảng mẫu chức danh — lưu hoặc hoàn tác bảng mẫu trước.";
    /* Ghi ô tick mà mẫu chưa đọc được thì không gửi được `phienBanMau` (máy chủ trả 400) — nói trước. Chỉ
       ĐỔI CHỨC DANH (ca E, chưa đọc được quyền riêng) thì vẫn cho — lượt đó không gọi cửa quyền riêng. */
    if (ghiQuyen && !mau) return "Đang đọc mẫu chức danh…";
    /* ★ Người chưa có hồ sơ (gộp khối "Thêm người dùng mới", Sếp 26/09/2026): phải có chức danh mới
       tạo được hồ sơ — `/api/phan-quyen` tạo hồ sơ khi gán chức danh, route quyền riêng đòi hồ sơ. */
    const chuaCo = dsChon.filter((t) => t.chuaCoHoSo);
    if (chuaCo.length > 0) {
      const ai = chuaCo.length === 1 ? chuaCo[0].ten : `${chuaCo.length} người đang chọn`;
      if (!vtMoi) return `${ai} chưa có hồ sơ ở app Thu mua — chọn chức danh để cấp quyền.`;
      if (vtMoi.capTM === 0) {
        return `Không cấp “${vtMoi.ten}” cho người chưa có hồ sơ — họ vốn chưa vào được app.`;
      }
    }
    /* Cùng trần với route — báo trước ở đây thay vì để máy chủ trả 400 sau khi đã bấm. */
    if (uidGhiQuyen.length > TOI_DA_NGUOI_MOI_LAN) {
      return `Mỗi lần lưu quyền riêng tối đa ${TOI_DA_NGUOI_MOI_LAN} người (đang chọn ${uidGhiQuyen.length}) — bỏ bớt rồi lưu thành nhiều lượt.`;
    }
    if (vtMoi) {
      /* Hỏi lại đúng hai chốt `/api/phan-quyen` dùng — ô chọn đã lọc sẵn, đây là lưới thứ hai. */
      const xet = duocDatCap(nguoiDung, vtMoi.capTM);
      if (!xet.duoc) return xet.lyDo ?? "Không gán được chức danh này.";
      if (!vaiTroGanDuoc.some((x) => x.ma === vtMoi.ma)) {
        return `Chức danh “${vtMoi.ten}” chỉ tài khoản Quản trị mới gán được.`;
      }
    }
    if (ghiQuyen && lyDoKhongTick) return lyDoKhongTick;
    if (uidDoiChucDanh.length === 0 && uidGhiQuyen.length === 0) {
      return "Chưa có thay đổi nào so với hiện tại.";
    }
    if (ghiQuyen) {
      return vuongMacTraoQuyen(
        nguoiGoi,
        duKien.map((d) => ({
          uid: d.t.uidLuat,
          ten: d.t.ten,
          vaiTro: d.vaiTro,
          capTM: d.capTM,
          quyenGoc: d.goc,
          quyenTruoc: d.ts.quyenTruoc,
          quyenSau: d.ts.quyenSau,
          boVaoApp: d.ts.boVaoApp,
        })),
      );
    }
    return null;
  })();

  function moHopLuu() {
    if (lyDoKhongLuu) return;
    /* "Bật/Tắt" so với quyền ĐANG CÓ của từng người (trước cả lần đổi chức danh), để hộp nói đúng
       thứ người ta sẽ được thêm / bị mất — không phải so với bản nháp. Không ghi quyền riêng thì kết
       quả là chức danh sau lần lưu + bản riêng cũ ĐÃ đối chiếu dấu (`ts.quyenTruoc`). */
    const sau = (d: DuKien) => (ghiQuyen ? d.ts.quyenSau : d.ts.quyenTruoc);
    const bat = KHOA_TICK.filter((k) => duKien.some((d) => !d.t.hieuLuc[k] && sau(d)[k])).map(nhanCoTick);
    const tat = KHOA_TICK.filter((k) => duKien.some((d) => d.t.hieuLuc[k] && !sau(d)[k])).map(nhanCoTick);
    /* ★ Sếp 07/10/2026 — ô tick "Xem bước quy trình". CÙNG cặp trước/sau với Bật/Tắt ở trên (`d.t.hieuLuc` →
       `sau(d)`). Chưa đọc được quyền riêng thì KHÔNG tính (xem chú thích trường `canhBao`). */
    const truocSau = duKien.map((d) => ({ ten: d.t.ten, quyenTruoc: d.t.hieuLuc, quyenSau: sau(d) }));
    const canhBao = loiRieng ? [] : [...canhBaoXemBuocKhiThieuGia(truocSau), ...canhBaoTatVaoManLamViec(truocSau)];
    const tom: TomTatLuu = {
      uids: dsChon.map((t) => t.hs.firebaseUid),
      ten: dsChon.map((t) => t.ten),
      vtMoi: vtMoi ?? null,
      uidDoiChucDanh,
      thayDoi: { ...nhapQuyen },
      uidGhiQuyen,
      bat,
      tat,
      soGiuTheoChucDanh: ghiQuyen ? duKien.filter((d) => !d.ts.canGhi && !d.t.rieng).length : 0,
      chuaDocRieng: Boolean(loiRieng),
      soCapMoi: dsChon.filter((t) => t.chuaCoHoSo).length,
      /* Chụp CÙNG lúc với bản nháp: bản nháp dựng theo mẫu này — máy chủ so, lệch là 409 (đặc tả 2.5). */
      phienBanMau: mau?.phienBan ?? -1,
      canhBao,
    };
    setHoiLuuCuoi(tom);
    setHoiLuu(true);
  }

  async function luuThat(tom: TomTatLuu) {
    setDangLuu(true);
    try {
      /* ① CHỨC DANH TRƯỚC — route quyền riêng đọc lại hồ sơ, nên phải thấy chức danh mới. Hỏng ai là
         DỪNG, không ghi quyền riêng: ghi tiếp là ghép quyền theo chức danh cũ, sai người sai việc. */
      if (tom.vtMoi && tom.uidDoiChucDanh.length > 0) {
        const loi: string[] = [];
        for (const uid of tom.uidDoiChucDanh) {
          const l = await nguon.ganVaiTro(uid, tom.vtMoi.ma);
          if (l) loi.push(`${tatCaVaDanhBa.find((t) => t.hs.firebaseUid === uid)?.ten ?? uid}: ${l}`);
        }
        if (loi.length > 0) {
          toast.error("Chưa đổi được chức danh", { description: loi.join(" · "), duration: 12000 });
          await docLai();
          return;
        }
      }

      // ② QUYỀN RIÊNG — một lượt cho cả nhóm, máy chủ kiểm lại toàn bộ luật.
      if (tom.uidGhiQuyen.length > 0) {
        const kq = await nguon.luuQuyenRieng(tom.uidGhiQuyen, tom.thayDoi, tom.phienBanMau);
        if (kq.loi !== null) {
          /* ★ 409 `mau-doi` (đặc tả 6 · D5): bản nháp dựng theo mẫu cũ — báo, XOÁ nháp, đọc lại. */
          if (kq.maLoi === "mau-doi") datLaiNhap();
          toast.error(kq.maLoi === "mau-doi" ? "Mẫu chức danh vừa được sửa — đã bỏ thay đổi chưa lưu" : "Chưa lưu được quyền", {
            description: tom.uidDoiChucDanh.length > 0 ? `${kq.loi} (Chức danh đã đổi xong.)` : kq.loi,
            duration: 12000,
          });
          await docLai();
          return;
        }
      }

      toast.success("Đã lưu phân quyền", {
        description: `${tom.ten.length} người · có hiệu lực khi họ tải lại trang hoặc quay lại tab.`,
      });
      /* Bảng "Giao việc cho ai" giữ danh sách người bị khoá 60 giây — bỏ bộ nhớ để nó thấy ngay. */
      lamMoiNguoiKhongVaoApp();
      /* D-F2: chính mình vừa lưu → đọc lại quyền của mình (bản thật; demo kho tự phát tin). */
      yeuCauDocLaiQuyenCuaToi();
      datLaiNhap();
      /* Đọc lại từ máy chủ thay vì tự sửa danh sách trong bộ nhớ: ghi hỏng một phần mà màn vẫn
         xanh là thứ tệ nhất ở màn này. Đọc CẢ danh bạ: người vừa được cấp quyền lần đầu phải thôi
         hiện nhãn "Chưa có quyền". */
      await Promise.all([tai(), taiDanhBa()]);
    } finally {
      setDangLuu(false);
    }
  }

  const motNguoi = dsChon.length === 1 ? dsChon[0] : null;
  /**
   * ★ Ô người này đang GIỮ RIÊNG — không đi theo mẫu chức danh (Câu 3 = A; dấu "(khác chức danh)" hiện
   * theo `k in ngoaiLe` — bổ sung đặc tả B-F2). Một chỗ suy ra: `ngoaiLeConHieuLuc` (cùng hàm phép tính lưu
   * dùng). Đang đổi chức danh thì không hiện (ngoại lệ tính theo chức danh hiện tại).
   */
  const ngoaiLeMotNguoi: QuyenRieng | null =
    motNguoi?.rieng && !vtMoi && !loiRieng ? ngoaiLeConHieuLuc(motNguoi.rieng, motNguoi.nd).ngoaiLe : null;
  const soBatHien = KHOA_TICK.filter((k) => giaTriCo(k) === true).length;
  const soMixed = KHOA_TICK.filter((k) => giaTriCo(k) === "mixed").length;

  /**
   * Câu vàng SẴN CÓ của hộp xác nhận tick riêng — `null` = không có. Đứng chung khung với `hoiLuuCuoi.canhBao`
   * (ô "Xem bước quy trình", Sếp 07/10/2026).
   * Chưa đọc được quyền riêng thì danh sách Bật/Tắt KHÔNG tính được (không biết bản cũ có gì) — nói đúng công
   * thức sẽ áp thay vì bày một danh sách sai (soát chéo lần 2).
   */
  const cauCanhBaoLuu: string | null = !hoiLuuCuoi
    ? null
    : hoiLuuCuoi.chuaDocRieng && hoiLuuCuoi.uidDoiChucDanh.length > 0
      ? "Chưa đọc được quyền riêng đang lưu nên không tính được quyền nào bật/tắt. Sau khi đổi chức danh: ai chưa có quyền riêng thì theo đúng chức danh mới; ai có quyền riêng cũ thì nhận các cờ mặc định của chức danh mới, TRỪ những cờ đã bị bỏ ở quyền riêng cũ (vẫn bỏ). Cờ từng được tick thêm vượt chức danh cũ không mang sang."
      : hoiLuuCuoi.tat.length > 0 || hoiLuuCuoi.vtMoi?.capTM === 0
        ? "Có quyền bị TẮT — người được chọn mất các việc đó khi họ tải lại trang hoặc quay lại tab."
        : null;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Thu mua", href: "/tong-quan" }, { label: "Phân quyền người dùng" }]}
        title="Phân quyền người dùng"
        description={`Chọn người ở cột trái, tick quyền ở cột phải rồi bấm Lưu. Bạn gán chức danh được tới ${NHAN_CAP_QUYEN[toiDa]}.`}
      />

      {/* ★ BẢN DEMO (chế độ tài khoản mẫu, Sếp 06/10/2026) — toàn màn chạy được, dữ liệu chỉ trên trình
          duyệt này. Trước đây chế độ mẫu chỉ hiện một màn trống. */}
      {laDemo && (
        <div
          role="note"
          className="flex flex-col gap-3 rounded-xl border border-primary bg-primary-bg p-(--hp-md-card-pad) text-sm text-text-secondary md:flex-row md:items-center md:justify-between"
        >
          <p className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              <strong className="text-text-primary">
                Bản demo — chỉ lưu trên trình duyệt này, không ghi lên máy chủ.
              </strong>{" "}
              Đổi chức danh không làm được ở bản demo. Luật lưu chạy ĐÚNG hai phép tính máy chủ dùng; đổi tài
              khoản mẫu ở góc trên để thấy menu, nút đổi theo.
            </span>
          </p>
          <Button variant="outline" className="shrink-0" disabled={dangLuu || dangLuuMau} onClick={() => setHoiXoaDemo(true)}>
            Xoá dữ liệu demo phân quyền
          </Button>
        </div>
      )}

      <>
          {/* 🔴 NÓI ĐÚNG MẶC ĐỊNH ĐANG CHẠY. Demo ghi "mặc định không xem được gì" — app thật đang để
              an toàn: chưa tick riêng thì giữ quyền theo chức danh. Ghi sai ở đây là người phân quyền
              tưởng người chưa tick đang bị khoá hết, trong khi họ vẫn làm việc bình thường.
              ★ Sếp chốt 26/09/2026: *"Tạm giữ theo chức danh"*; ★ 06/10/2026 "theo chức danh" nghĩa là theo
              MẪU chức danh ở bảng dưới (Câu 1 = A), người có quyền riêng chỉ giữ ô cố ý khác (Câu 3 = A). */}
          <div
            role="note"
            className="flex items-start gap-3 rounded-xl border border-warning bg-warning-bg p-(--hp-md-card-pad) text-sm text-text-secondary"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-soft" aria-hidden />
            <p>
              Người chưa được tick riêng theo <strong className="text-text-primary">mẫu chức danh</strong> ở
              bảng dưới. Người có quyền riêng chỉ giữ những ô đã cố ý khác chức danh; các ô còn lại đi theo
              mẫu, kể cả khi mẫu đổi về sau (Sếp 06/10/2026). Danh sách &quot;Giao việc&quot; lấy theo{" "}
              <strong>chức danh</strong>; ai bị bỏ tick &quot;Vào app&quot; thì không có trong danh sách đó.{" "}
              <strong className="text-text-primary">
                Mẫu và quyền riêng có hiệu lực khi người đó tải lại trang hoặc quay lại tab.
              </strong>{" "}
              Lúc tải trang mà app không đọc được phân quyền thì người đó chưa vào được app cho tới khi đọc
              được. Đổi chức danh thì người đó nhận các quyền mặc định của chức danh mới, trừ những quyền đã
              bị bỏ ở quyền riêng cũ (vẫn bỏ); quyền từng được tick thêm vượt chức danh cũ không mang sang.
            </p>
          </div>

          {/* Sếp 26/09/2026: *"Mở rộng mục này ra 1 chút"* (cột Nhân sự, tên bị cắt) — 340px → 420px,
              tên được xuống dòng thay vì cắt "…". */}
          {/* ★ Bề rộng cột trái kéo được (Sếp 26/09/2026) — biến CSS `--rong-cot` là inline style DUY
              NHẤT ở đây, vì bề rộng đổi theo từng pixel khi kéo, không có lớp tiện ích cố định nào diễn
              tả được; màu/khoảng cách vẫn đều bằng token. Dưới `lg` hai cột xếp chồng, biến bị bỏ qua. */}
          <div
            className="grid grid-cols-1 items-start gap-(--hp-md-card-gap) lg:grid-cols-[var(--rong-cot)_auto_minmax(0,1fr)] lg:gap-x-0"
            style={{ "--rong-cot": `${rongCot}px` } as CSSProperties}
          >
            {/* ================= CỘT TRÁI — NHÂN SỰ ================= */}
            <Card ref={khoiNhanSuRef} className="scroll-mt-4 gap-0 py-0">
              <div className="flex items-center justify-between gap-2 border-b border-divider px-4 py-3">
                <div className="flex items-center gap-2">
                  <Users className="size-4 shrink-0 text-primary" aria-hidden />
                  <p className="text-h3 text-text-primary">Nhân sự</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-desc">
                    {danhSach === null
                      ? "Đang đọc…"
                      : `${dsLoc.length} người${soChuaCoTrongLoc > 0 ? ` · ${soChuaCoTrongLoc} chưa có quyền` : ""}`}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => void docLai()}
                    disabled={dangTai || dangTaiDanhBa}
                    aria-label="Đọc lại danh sách, danh bạ công ty và quyền riêng"
                    title="Đọc lại"
                  >
                    <RefreshCw
                      className={`size-4 ${dangTai || dangTaiDanhBa ? "animate-spin" : ""}`}
                      aria-hidden
                    />
                  </Button>
                </div>
              </div>

              {/* Danh bạ đang đọc / đọc không được — PHẢI nói ra (khối "Thêm người dùng mới" cũ có câu
                  này). `docDanhBaCongTy` trả mảng rỗng cả khi lỗi, nên rỗng = nghi lỗi, không = "không ai". */}
              {dangTaiDanhBa && danhBa === null && (
                <p className="border-b border-divider bg-muted px-4 py-2 text-xs text-text-secondary">
                  Đang đọc danh bạ công ty… (người chưa có quyền sẽ hiện thêm khi đọc xong)
                </p>
              )}
              {!dangTaiDanhBa && danhBa !== null && danhBa.length === 0 && (
                <p className="border-b border-divider bg-warning-bg px-4 py-2 text-xs text-text-secondary">
                  Chưa đọc được danh bạ công ty — đang chỉ hiện người đã có quyền ở app Thu mua. Bấm
                  &quot;Đọc lại&quot; để thử lại.
                </p>
              )}

              <div className="flex flex-col gap-2 border-b border-divider px-4 py-3">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-desc"
                    aria-hidden
                  />
                  <Input
                    value={tuKhoaDs}
                    onChange={(e) => setTuKhoaDs(e.target.value)}
                    placeholder="Gõ tên hoặc email…"
                    className="pl-9"
                    aria-label="Tìm người trong danh sách phân quyền"
                  />
                </div>
                <select
                  value={phongBanDs}
                  onChange={(e) => setPhongBanDs(e.target.value)}
                  aria-label="Lọc theo phòng ban"
                  className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors hover:border-primary focus:border-primary focus:outline-none"
                >
                  <option value="">— Chọn phòng ban —</option>
                  <option value={TAT_CA_PHONG_BAN}>Tất cả phòng ban</option>
                  {dsPhongBanDs.map((pb) => (
                    <option key={pb} value={pb}>
                      {tenPhongBan(pb)}
                    </option>
                  ))}
                </select>
                {/* ★ Lọc theo CHỨC DANH (Sếp 06/10/2026). Bấm "N người…" ở đầu cột bảng mẫu cũng đặt ô này —
                    MỘT danh sách người, không dựng danh sách thứ hai. */}
                <select
                  value={chucDanhLoc}
                  onChange={(e) => setChucDanhLoc(e.target.value)}
                  aria-label="Lọc theo chức danh"
                  className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors hover:border-primary focus:border-primary focus:outline-none"
                >
                  <option value="">Mọi chức danh</option>
                  {VAI_TRO_CHUAN.map((v) => (
                    <option key={v.ma} value={v.ma}>
                      {v.ten}
                    </option>
                  ))}
                  <option value={LOC_TUY_CHINH}>Tùy chỉnh (không khớp chức danh nào)</option>
                  <option value={LOC_CHUA_CO_HO_SO}>Chưa có quyền ở app Thu mua</option>
                </select>

                {/* ★ Chọn nhiều người (Sếp 26/09/2026 ②). Chỉ gom người SỬA ĐƯỢC — người bị khoá
                    (chính mình, cấp cao hơn, Quản trị) gom vào là cả lượt lưu bị từ chối. */}
                {!chuaLoc && (
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text-secondary has-disabled:cursor-not-allowed has-disabled:opacity-60">
                  <OTich
                    giaTri={giaTriChonTatCa}
                    onDoi={chonTatCaDangLoc}
                    disabled={dsLocSuaDuoc.length === 0}
                  />
                  <span>
                    Chọn tất cả đang lọc ({dsLocSuaDuoc.length})
                    {soBoQuaQtNgung > 0 && (
                      <span className="text-text-desc">
                        {" "}
                        · bỏ qua {soBoQuaQtNgung} người Quản trị/Ngừng truy cập
                      </span>
                    )}
                    {soBoQuaChuaCo > 0 && (
                      <span className="text-text-desc">
                        {" "}
                        · {soBoQuaChuaCo} người chưa có quyền (chọn từng người rồi gán chức danh)
                      </span>
                    )}
                    {soBoQuaKhoa > 0 && (
                      <span className="text-text-desc"> · {soBoQuaKhoa} người bạn không sửa được</span>
                    )}
                    {chon.length > 0 && (
                      <span className="text-text-desc"> · đang chọn {chon.length}</span>
                    )}
                  </span>
                </label>
                )}

              </div>

              {danhSach !== null && dsLoc.length === 0 && (
                <p className="px-4 py-6 text-sm text-text-desc">
                  {chuaLoc
                    ? "Chọn phòng ban, chức danh hoặc gõ tên để hiện danh sách nhân sự."
                    : dsHien.length === 0
                    ? "Không đọc được tài khoản nào. Kiểm tra lại kết nối máy chủ."
                    : "Không có ai khớp bộ lọc."}
                </p>
              )}

              {dsLoc.length > 0 && (
                <ul className="thanh-cuon-doc-ro max-h-[420px] overflow-y-auto lg:max-h-[640px]">
                  {dsLoc.map((t) => {
                    const uid = t.hs.firebaseUid;
                    const daChon = chon.includes(uid);
                    const tt = trangThaiNguoi(t, Boolean(loiRieng));
                    return (
                      <li
                        key={uid}
                        className={`flex min-h-14 items-stretch border-b border-l-4 border-divider ${
                          daChon ? "border-l-primary bg-primary-bg" : "border-l-transparent"
                        }`}
                      >
                        <label
                          className="flex w-11 shrink-0 cursor-pointer items-center justify-center has-disabled:cursor-not-allowed"
                          title={t.lyDoKhoa ?? `Chọn ${t.ten} để phân quyền cùng lúc`}
                        >
                          {/* Người bị khoá: không THÊM vào nhóm được, nhưng đã lỡ chọn (bấm vào tên)
                              thì vẫn BỎ ra được — khoá luôn là kẹt cả nhóm vì một người. */}
                          <OTich
                            giaTri={daChon}
                            onDoi={(b) => doiChonNhieu(uid, b)}
                            disabled={Boolean(t.lyDoKhoa) && !daChon}
                            ariaLabel={`Chọn ${t.ten} để phân quyền cùng lúc`}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => chonMot(uid)}
                          aria-pressed={daChon}
                          className="flex min-w-0 flex-1 items-center gap-3 py-2 pr-3 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        >
                          <AnhDaiDienChu ten={t.ten} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm leading-snug font-semibold break-words text-text-primary">
                              {t.ten}
                            </span>
                            <span className="block truncate text-xs text-text-desc">
                              {tenPhongBan(t.phongBan)} ·{" "}
                              {t.chuaCoHoSo
                                ? t.hs.hoSo.chucDanh || "Chưa có hồ sơ Thu mua"
                                : (t.vtHienTai?.ten ?? `Tùy chỉnh (${NHAN_CAP_QUYEN[t.nd.capTM]})`)}
                            </span>
                          </span>
                          <StatusBadge label={tt.label} tone={tt.tone} className="shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* ★ THANH KÉO đổi bề rộng cột "Nhân sự" — chỉ từ `lg`. Kéo chuột/chạm (pointer capture nên
                kéo ra ngoài thanh vẫn ăn) · nhấp đúp về mặc định · phím ←/→ (Shift = bước lớn),
                Home/End = hẹp nhất/rộng nhất. Lưu khi THẢ tay, không lưu từng pixel. */}
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Kéo để đổi bề rộng cột Nhân sự"
              aria-valuenow={rongCot}
              aria-valuemin={RONG_COT_MIN}
              aria-valuemax={RONG_COT_MAX}
              tabIndex={0}
              title="Kéo để đổi bề rộng · nhấp đúp để về mặc định"
              className="group hidden w-(--hp-md-card-gap) cursor-col-resize touch-none items-start justify-center self-stretch pt-24 outline-none select-none lg:flex"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                keoRef.current = { x: e.clientX, rong: rongCot };
              }}
              onPointerMove={(e) => {
                const k = keoRef.current;
                if (k) datRongCot(k.rong + e.clientX - k.x, false);
              }}
              onPointerUp={(e) => {
                const k = keoRef.current;
                keoRef.current = null;
                if (k) datRongCot(k.rong + e.clientX - k.x, true);
              }}
              onPointerCancel={() => {
                keoRef.current = null;
              }}
              onDoubleClick={() => datRongCot(RONG_COT_MAC_DINH, true)}
              onKeyDown={(e) => {
                const buoc = e.shiftKey ? BUOC_PHIM * 3 : BUOC_PHIM;
                if (e.key === "ArrowLeft") datRongCot(rongCot - buoc, true);
                else if (e.key === "ArrowRight") datRongCot(rongCot + buoc, true);
                else if (e.key === "Home") datRongCot(RONG_COT_MIN, true);
                else if (e.key === "End") datRongCot(RONG_COT_MAX, true);
                else return;
                e.preventDefault();
              }}
            >
              <span
                aria-hidden
                className="h-16 w-1 rounded-full bg-border transition-colors group-hover:bg-primary group-focus-visible:bg-primary group-active:bg-primary"
              />
            </div>

            {/* ================= CỘT PHẢI — QUYỀN ================= */}
            <Card className="gap-0 py-0">
              {dsChon.length === 0 ? (
                <div className="p-(--hp-md-card-pad)">
                  <EmptyState
                    icon={ShieldAlert}
                    title="Chưa chọn ai"
                    description="Bấm vào tên một người ở cột trái để xem và tick quyền. Muốn phân quyền cùng lúc cho nhiều người thì tích ô vuông cạnh tên từng người."
                  />
                </div>
              ) : (
                <>
                  {/* ---- Ai đang được phân quyền ---- */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-divider px-4 py-4">
                    {motNguoi ? (
                      <div className="flex min-w-0 items-center gap-3">
                        <AnhDaiDienChu ten={motNguoi.ten} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-text-primary">{motNguoi.ten}</p>
                          <p className="truncate text-xs text-text-desc">
                            {motNguoi.hs.hoSo.email} · {tenPhongBan(motNguoi.phongBan)}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {motNguoi.chuaCoHoSo ? (
                              <>
                                <StatusBadge label="Chưa có quyền" tone="danger" />
                                <span className="text-xs text-text-desc">
                                  Chưa có hồ sơ ở app Thu mua — chọn chức danh rồi Lưu để cấp quyền
                                  {motNguoi.hs.hoSo.chucDanh ? ` · App Tổng: ${motNguoi.hs.hoSo.chucDanh}` : ""}
                                </span>
                              </>
                            ) : loiRieng ? (
                              <StatusBadge label="Chưa đọc được quyền riêng" tone="warning" />
                            ) : motNguoi.rieng ? (
                              <>
                                {motNguoi.rieng.lechChucDanh ? (
                                  <StatusBadge label="Quyền riêng theo chức danh cũ" tone="warning" />
                                ) : (
                                  <StatusBadge label="Có quyền riêng" tone="success" />
                                )}
                                <span className="text-xs text-text-desc">
                                  lưu {formatDateTime(motNguoi.rieng.capNhatLuc)}
                                  {motNguoi.rieng.capNhatBoiTen
                                    ? ` bởi ${motNguoi.rieng.capNhatBoiTen}`
                                    : ""}
                                  {/* Nói rõ hệ quả của dấu chức danh lệch — xem `quyenRiengHieuLuc`. */}
                                  {motNguoi.rieng.lechChucDanh
                                    ? " · chức danh đã đổi từ lúc lưu: theo mẫu chức danh mới, chỉ giữ những quyền đã bị bỏ ở bản cũ"
                                    : ""}
                                </span>
                              </>
                            ) : (
                              <>
                                <StatusBadge label="Theo chức danh" tone="neutral" />
                                <span className="text-xs text-text-desc">
                                  Chưa có quyền riêng — đang theo chức danh
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <p className="font-semibold text-text-primary">
                          Đang chọn {dsChon.length} người
                        </p>
                        <p className="text-xs text-text-desc">
                          {dsChon
                            .slice(0, 6)
                            .map((t) => t.ten)
                            .join(", ")}
                          {dsChon.length > 6 ? ` và ${dsChon.length - 6} người nữa` : ""}
                        </p>
                        <p className="mt-1 text-xs text-text-desc">
                          {dsChon.filter((t) => t.rieng).length} người có quyền riêng ·{" "}
                          {dsChon.filter((t) => !t.rieng).length} người đang theo chức danh. Ô có
                          dấu gạch ngang là mỗi người một kiểu — chỉ ô bạn chạm mới được ghi.
                        </p>
                      </div>
                    )}
                    {!motNguoi && (
                      <Button variant="ghost" size="sm" onClick={() => setChon([])}>
                        Bỏ chọn tất cả
                      </Button>
                    )}
                  </div>

                  {/* ---- Chức danh + tick nhanh ---- */}
                  {/* Sếp 26/09/2026: *"Căn dòng ngay ngắn"* — nhãn ở trên, rồi MỘT HÀNG [ô chức danh | hai
                      nút] căn giữa theo chiều cao ô chọn, dòng gợi ý nằm dưới cả hàng. Trước đây hai nút
                      căn theo cả khối (nhãn + ô + gợi ý) nên lệch khỏi ô chọn. */}
                  <div className="flex flex-col gap-1.5 border-b border-divider px-4 py-4">
                    <label htmlFor="chuc-danh-phan-quyen" className="text-xs font-semibold text-text-secondary">
                      Chức danh (quyết định có trong danh sách Giao việc không)
                    </label>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                      <div className="min-w-0 flex-1">
                        <select
                          id="chuc-danh-phan-quyen"
                          value={nhapVaiTro}
                          onChange={(e) => doiChucDanhNhap(e.target.value)}
                          disabled={laDemo || dsChon.some((t) => t.lyDoKhoa) || dangLuu}
                          title={laDemo ? LY_DO_DEMO_KHONG_DOI_CHUC_DANH : undefined}
                          className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors hover:border-primary focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">
                            {motNguoi?.chuaCoHoSo
                              ? "— chọn chức danh để cấp quyền —"
                              : motNguoi
                                ? `Giữ nguyên: ${motNguoi.vtHienTai?.ten ?? `Tùy chỉnh (${NHAN_CAP_QUYEN[motNguoi.nd.capTM]})`}`
                                : "Giữ nguyên chức danh của từng người"}
                          </option>
                          {vaiTroGanDuoc.map((v) => (
                            <option key={v.ma} value={v.ma}>
                              {v.ten}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {/* ★ Sếp 06/10/2026: THAY nút "Áp mẫu theo chức danh" — với khuôn ngoại lệ hai nút làm
                            cùng một việc (xem chú thích ở `lyDoKhongBoRieng`). */}
                        <Button
                          variant="outline"
                          disabled={Boolean(lyDoKhongBoRieng) || dangLuu}
                          title={lyDoKhongBoRieng ?? "Xoá quyền riêng của người đang chọn — họ đi theo mẫu chức danh."}
                          onClick={moHopBoRieng}
                        >
                          Bỏ quyền riêng — về theo chức danh
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={Boolean(lyDoKhongTick) || dangLuu}
                          title={lyDoKhoaVaoApp ? "Giữ “Vào app” — người cấp Quản lý trở lên không bỏ được ô này." : undefined}
                          onClick={boHet}
                        >
                          Bỏ hết
                        </Button>
                      </div>
                    </div>
                      {/* ★ 06/10/2026: mô tả chức danh SINH TỪ QUYỀN THẬT (công thức + mẫu) — `tomTatQuyenCuaVaiTro`,
                          thay câu `moTa` viết cứng (mẫu đổi thì câu viết cứng nói sai). */}
                      <p className="text-xs text-text-desc">
                        {laDemo
                          ? LY_DO_DEMO_KHONG_DOI_CHUC_DANH
                          : vtMoi
                          ? loiRieng
                            ? `Đổi sang “${vtMoi.ten}”: lần lưu này CHỈ đổi chức danh (chưa đọc được quyền riêng nên không ghi ô tick). ${tomTatQuyenCuaVaiTro(vtMoi, mau ?? MAU_TRONG)}`
                            : vtMoi.vaiTro === "admin" || vtMoi.capTM === 0
                              ? `Đổi sang “${vtMoi.ten}”: lần lưu này chỉ đổi chức danh — ${vtMoi.vaiTro === "admin" ? "Quản trị luôn đủ mọi quyền" : "Ngừng truy cập thì ô tick không có tác dụng"}. ${tomTatQuyenCuaVaiTro(vtMoi, mau ?? MAU_TRONG)}`
                              : `Đổi sang “${vtMoi.ten}”: đã tick lại theo mẫu của chức danh này — thêm/bớt tiếp nếu cần. ${tomTatQuyenCuaVaiTro(vtMoi, mau ?? MAU_TRONG)}`
                          : "Đổi chức danh là tick lại toàn bộ theo mẫu của chức danh đó."}
                      </p>
                  </div>

                  {/* ---- Khoá tick thì PHẢI nói vì sao ---- */}
                  {lyDoKhongTick && (
                    <p className="border-b border-divider bg-muted px-4 py-3 text-sm text-text-secondary">
                      {lyDoKhongTick}
                    </p>
                  )}

                  {/* ---- Các nhóm quyền ---- */}
                  {NHOM_QUYEN_TICK.map((nhom) => {
                    const ds = CO_TICK_DUOC.filter((c) => c.nhom === nhom);
                    const soBat = ds.filter((c) => giaTriCo(c.khoa) === true).length;
                    return (
                      <fieldset key={nhom} className="border-b border-divider px-4 py-4">
                        <legend className="sr-only">{nhom}</legend>
                        {/* Sếp 26/09/2026: *"Tạo màu cho header này và chức năng group"* — thanh nhóm nền xanh
                            nhạt, bấm để gập/mở nhóm (gập chỉ ẩn ô tick, không đổi quyền nào). */}
                        <button
                          type="button"
                          onClick={() =>
                            setNhomGap((cu) => (cu.includes(nhom) ? cu.filter((x) => x !== nhom) : [...cu, nhom]))
                          }
                          aria-expanded={!nhomGap.includes(nhom)}
                          className="mb-2 flex min-h-10 w-full items-center justify-between gap-2 rounded-lg bg-primary-bg px-3 text-left text-primary transition-colors hover:bg-primary-bg/70"
                        >
                          <span className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                            <ChevronRight
                              className={`size-4 shrink-0 transition-transform ${nhomGap.includes(nhom) ? "" : "rotate-90"}`}
                              aria-hidden
                            />
                            {nhom}
                          </span>
                          <span className="text-xs text-text-secondary">
                            {soBat}/{ds.length}
                          </span>
                        </button>
                        {!nhomGap.includes(nhom) && (<>
                        {/* ★ Mô tả nhóm ngay dưới đầu nhóm (Sếp 07/10/2026 — nhóm "Xem bước quy trình"): CÙNG câu
                            với bảng mẫu bên dưới (`MoTaNhomQuyenTick` → `MO_TA_NHOM_XEM_BUOC`), không viết lại. */}
                        <MoTaNhomQuyenTick nhom={nhom} className="mb-2 px-2" />
                        <div className="grid grid-cols-1 gap-x-4 gap-y-1 md:grid-cols-2">
                          {ds.map((c) => {
                            const gt = giaTriCo(c.khoa);
                            const daDoi = c.khoa in nhapQuyen;
                            const idMoTa = `mo-ta-quyen-${c.khoa}`;
                            /* "Vào app" của người cấp ≥ 3: khoá khi ĐANG BẬT (không cho bỏ), vẫn mở
                               khi đang tắt / mỗi người một kiểu để tick lên được. */
                            const khoaBoVaoApp = c.khoa === "xemDuocApp" && Boolean(lyDoKhoaVaoApp) && gt === true;
                            /* ★ D-F3: chiều BẬT khoá khi bật là trao cờ mình không có. Ô đang tắt → khoá hẳn kèm
                               lý do; ô "mỗi người một kiểu" vẫn bấm được để TẮT cho cả nhóm (xem `doiCo`). */
                            const lyDoBat = gt !== true && !lyDoKhongTick ? lyDoKhongBatO(c.khoa) : null;
                            const khoaBat = gt === false && Boolean(lyDoBat);
                            /* ★ Câu 3 = A: ô người này đang GIỮ RIÊNG (không theo mẫu) — `k in ngoaiLe` (B-F2). */
                            const khacCD =
                              !daDoi && ngoaiLeMotNguoi !== null && Object.prototype.hasOwnProperty.call(ngoaiLeMotNguoi, c.khoa);
                            return (
                              <label
                                key={c.khoa}
                                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted has-disabled:cursor-not-allowed has-disabled:opacity-60"
                              >
                                <OTich
                                  giaTri={gt}
                                  onDoi={(b) => doiCo(c.khoa, b)}
                                  disabled={Boolean(lyDoKhongTick) || dangLuu || khoaBoVaoApp || khoaBat}
                                  ariaDescribedBy={idMoTa}
                                  className="mt-0.5"
                                />
                                <span className="min-w-0">
                                  <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-text-primary">
                                    {c.nhan}
                                    {/* Trạng thái luôn có CHỮ, không chỉ dấu gạch — V1.1. */}
                                    {gt === "mixed" && (
                                      <span className="text-xs font-normal text-text-desc">
                                        (mỗi người một kiểu)
                                      </span>
                                    )}
                                    {khacCD && (
                                      <span className="text-xs font-normal text-warning-soft">(khác chức danh)</span>
                                    )}
                                    {daDoi && <StatusBadge label="đã đổi" tone="primary" />}
                                  </span>
                                  <span id={idMoTa} className="block text-xs text-text-desc">
                                    {c.moTa}
                                    {/* Khoá thì PHẢI nói vì sao, ngay tại ô. */}
                                    {khoaBoVaoApp && lyDoKhoaVaoApp && (
                                      <span className="mt-0.5 block text-warning-soft">{lyDoKhoaVaoApp}</span>
                                    )}
                                    {lyDoBat && (
                                      <span className="mt-0.5 block text-warning-soft">
                                        {gt === "mixed" ? "Chỉ tắt được cho cả nhóm — " : "Không bật được — "}
                                        {lyDoBat}
                                      </span>
                                    )}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        {/* ★ Bổ sung đặc tả D-F4 (06/10/2026): ĐÃ BỎ hai ghi chú cũ ở đây — "Phân quyền người
                            dùng không tick được" (trùng dòng ghi chú G1 của bảng mẫu bên dưới) và "Xuất hồ sơ /
                            in chứng từ chưa gác theo quyền riêng" (đã SAI: In / Excel đơn hàng nay gác bằng
                            "Xem giá"). */}
                        </>)}
                      </fieldset>
                    );
                  })}

                  {/* ---- Chân: tổng + nút ---- */}
                  <div className="flex flex-col gap-3 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-text-secondary">
                        {motNguoi ? (
                          <>
                            Đang cấp <strong className="text-text-primary">{soBatHien}</strong>/
                            {KHOA_TICK.length} quyền
                          </>
                        ) : (
                          <>
                            {dsChon.length} người · <strong className="text-text-primary">{soBatHien}</strong>{" "}
                            ô chung đang bật{soMixed > 0 ? ` · ${soMixed} ô mỗi người một kiểu` : ""}
                          </>
                        )}
                        {coNhap && (
                          <span className="text-text-desc"> · có thay đổi chưa lưu</span>
                        )}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" disabled={!coNhap || dangLuu} onClick={datLaiNhap}>
                          Hoàn tác
                        </Button>
                        <Button disabled={Boolean(lyDoKhongLuu) || dangLuu} onClick={moHopLuu}>
                          {dangLuu ? "Đang lưu…" : "Lưu phân quyền"}
                        </Button>
                      </div>
                    </div>
                    {/* Nút mờ PHẢI kèm lý do — nhưng đừng nhắc lại lý do đã hiện ở khung khoá tick. */}
                    {lyDoKhongLuu && coNhap && lyDoKhongLuu !== lyDoKhongTick && (
                      <p className="text-xs text-warning-soft">{lyDoKhongLuu}</p>
                    )}
                    {/* Bổ sung đặc tả D-F3: nói rõ khác biệt chiều TẮT giữa khối này và bảng mẫu. */}
                    <p className="text-xs text-text-desc">
                      Ở khối này, ô của quyền bạn không có chỉ khoá chiều <strong>bật</strong> — tắt bớt cho một
                      người vẫn được. Ở bảng mẫu theo chức danh bên dưới, ô đó khoá cả bật lẫn tắt.
                    </p>
                  </div>
                </>
              )}
            </Card>
          </div>
      </>

      {/* ---------- ★ BẢNG MẪU QUYỀN THEO CHỨC DANH — bấm được (Sếp 06/10/2026, Câu 1 = A · Câu 2 = B) ---------- */}
      <BangMauChucDanh
        mau={mau}
        mauHong={mauHong}
        canhBaoMau={canhBaoMau}
        nguoiGoi={nguoiGoi.nguoiDung}
        nhap={nhapMau}
        onDoiNhap={setNhapMau}
        khoaVi={khoaBangMau}
        lyDoKhongLuu={
          coNhap ? "Đang có thay đổi chưa lưu ở khối tick quyền từng người — lưu hoặc hoàn tác ở đó trước." : null
        }
        demNguoi={demNguoi}
        onXemNguoi={xemNguoiCuaChucDanh}
        onLuu={moHopLuuMau}
        onHoanTac={() => setNhapMau({})}
        onVeMacDinhKhiHong={() => setHoiCuuMau(true)}
        dangLuu={dangLuuMau || dangLuu}
        laDemo={laDemo}
        lichSuDemo={lichSuDemo}
      />

      {/* 🔴 HỘP XÁC NHẬN LƯU BẢNG MẪU — chụp nội dung lúc mở (`hoiLuuMauCuoi`), KHÔNG bọc `{hoiLuuMau && …}`. */}
      {hoiLuuMauCuoi && (
        <HopXacNhan
          mo={hoiLuuMau}
          tieuDe="Lưu bảng mẫu quyền theo chức danh?"
          moTa={`${hoiLuuMauCuoi.soODoi} ô đổi. Áp cho mọi người thuộc chức danh đó, trừ ô ai đang giữ ngoại lệ riêng. Có hiệu lực khi người đó tải lại trang hoặc quay lại tab.`}
          canhBao={
            hoiLuuMauCuoi.canhBao.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {hoiLuuMauCuoi.canhBao.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            ) : undefined
          }
          khoaDongY={hoiLuuMauCuoi.loi ?? undefined}
          nhanDongY="Lưu bảng mẫu"
          nguyHiem={hoiLuuMauCuoi.dong.some((d) => d.includes(": tắt"))}
          onDongY={() => {
            const tom = hoiLuuMauCuoi;
            setHoiLuuMau(false);
            void luuMauThat(tom);
          }}
          onDong={() => setHoiLuuMau(false)}
        >
          <div className="flex flex-col gap-2 text-sm text-text-secondary">
            {hoiLuuMauCuoi.dong.length > 0 && (
              <ul className="thanh-cuon-doc-ro flex max-h-60 flex-col gap-1 overflow-y-auto">
                {hoiLuuMauCuoi.dong.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
            {hoiLuuMauCuoi.chiDao.length > 0 && (
              <div className="rounded-lg bg-muted p-2 text-xs">
                <p className="font-semibold text-text-primary">Chỉ đạo gắn với dòng đang đổi:</p>
                <ul className="flex flex-col gap-1">
                  {hoiLuuMauCuoi.chiDao.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs text-text-desc">Có hiệu lực từ lần tải trang kế tiếp (hoặc khi người đó quay lại tab).</p>
          </div>
        </HopXacNhan>
      )}

      {/* HỘP XÁC NHẬN "BỎ QUYỀN RIÊNG" — chụp lúc mở, cùng nếp. */}
      {hoiBoRiengCuoi && (
        <HopXacNhan
          mo={hoiBoRieng}
          tieuDe="Bỏ quyền riêng — về theo chức danh?"
          moTa={`Xoá quyền riêng của ${hoiBoRiengCuoi.ten.length} người: ${hoiBoRiengCuoi.ten.slice(0, 5).join(", ")}${
            hoiBoRiengCuoi.ten.length > 5 ? ` và ${hoiBoRiengCuoi.ten.length - 5} người nữa` : ""
          }. Họ đi theo mẫu chức danh (kể cả khi mẫu đổi về sau). Có hiệu lực khi họ tải lại trang hoặc quay lại tab.`}
          canhBao={hoiBoRiengCuoi.tat.length > 0 ? "Có quyền bị TẮT — người được chọn mất các việc đó." : undefined}
          khoaDongY={hoiBoRiengCuoi.loi ?? undefined}
          nhanDongY="Bỏ quyền riêng"
          nguyHiem={hoiBoRiengCuoi.tat.length > 0}
          onDongY={() => {
            const tom = hoiBoRiengCuoi;
            setHoiBoRieng(false);
            void boRiengThat(tom);
          }}
          onDong={() => setHoiBoRieng(false)}
        >
          <ul className="flex flex-col gap-1.5 text-sm text-text-secondary">
            {hoiBoRiengCuoi.bat.length > 0 && (
              <li>
                <span className="font-medium text-success-soft">Bật:</span> {hoiBoRiengCuoi.bat.join(", ")}
              </li>
            )}
            {hoiBoRiengCuoi.tat.length > 0 && (
              <li>
                <span className="font-medium text-danger-soft">Tắt:</span> {hoiBoRiengCuoi.tat.join(", ")}
              </li>
            )}
            {hoiBoRiengCuoi.bat.length === 0 && hoiBoRiengCuoi.tat.length === 0 && (
              <li className="text-xs text-text-desc">Quyền hiệu lực không đổi — chỉ bỏ bản ghi riêng.</li>
            )}
          </ul>
        </HopXacNhan>
      )}

      {/* HỘP XÁC NHẬN CỨU MẪU HỎNG — chỉ Quản trị (máy chủ / kho demo kiểm lại). */}
      <HopXacNhan
        mo={hoiCuuMau}
        tieuDe="Đưa cả bảng mẫu về mặc định gốc?"
        moTa="Bảng mẫu đang hỏng nên không đọc được. Cứu bằng cách đưa CẢ bảng về mặc định gốc (công thức trong mã) — mọi ô Sếp đã sửa ở mẫu mất, quyền riêng từng người giữ nguyên."
        canhBao="Sau khi cứu, kiểm lại bảng mẫu và sửa lại các ô cần thiết."
        nhanDongY="Đưa về mặc định gốc"
        nguyHiem
        onDongY={() => void cuuMauThat()}
        onDong={() => setHoiCuuMau(false)}
      />

      {/* HỘP XÁC NHẬN XOÁ DỮ LIỆU DEMO — chỉ bản demo. */}
      {laDemo && (
        <HopXacNhan
          mo={hoiXoaDemo}
          tieuDe="Xoá dữ liệu demo phân quyền?"
          moTa="Xoá bảng mẫu, quyền riêng và lịch sử demo trên trình duyệt này — mọi tài khoản mẫu về đúng mặc định gốc. Không đụng máy chủ."
          nhanDongY="Xoá dữ liệu demo"
          nguyHiem
          onDongY={() => {
            const loi = nguon.xoaDuLieuDemo();
            if (loi) {
              toast.error("Chưa xoá được", { description: loi });
              return;
            }
            setNhapMau({});
            datLaiNhap();
            toast.success("Đã xoá dữ liệu demo phân quyền");
            void tai();
          }}
          onDong={() => setHoiXoaDemo(false)}
        />
      )}

      {/* 🔴 HỎI TRƯỚC KHI LƯU. Đổi quyền ảnh hưởng ngay tới việc người ta làm được gì — tắt nhầm là
          họ mất việc giữa lúc đang làm, và không tự lấy lại được. */}
      {/* 🔴 KHÔNG bọc bằng `{hoiLuu && …}` — xem chú thích ở `hoiLuuCuoi`. */}
      {hoiLuuCuoi && (
        <HopXacNhan
          mo={hoiLuu}
          tieuDe="Lưu phân quyền?"
          moTa={`Áp cho ${hoiLuuCuoi.ten.length} người: ${hoiLuuCuoi.ten.slice(0, 5).join(", ")}${
            hoiLuuCuoi.ten.length > 5 ? ` và ${hoiLuuCuoi.ten.length - 5} người nữa` : ""
          }. Có hiệu lực khi họ tải lại trang hoặc quay lại tab — trang đang mở giữ quyền cũ tới lúc đó.`}
          canhBao={
            cauCanhBaoLuu || hoiLuuCuoi.canhBao.length > 0 ? (
              <span className="flex flex-col gap-1.5">
                {cauCanhBaoLuu && <span>{cauCanhBaoLuu}</span>}
                {/* ★ Cảnh báo ô "Xem bước quy trình" (Sếp 07/10/2026) — khung vàng của hộp = màu cảnh báo + chữ.
                    Chọn nhiều người thì mỗi người một dòng → khung cuộn, không đẩy nút Đồng ý ra khỏi màn. */}
                {hoiLuuCuoi.canhBao.length > 0 && (
                  <ul className="thanh-cuon-doc-ro flex max-h-48 flex-col gap-1 overflow-y-auto">
                    {hoiLuuCuoi.canhBao.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                )}
              </span>
            ) : undefined
          }
          nhanDongY="Lưu phân quyền"
          nguyHiem={
            hoiLuuCuoi.vtMoi?.capTM === 0 || (!hoiLuuCuoi.chuaDocRieng && hoiLuuCuoi.tat.length > 0)
          }
          onDongY={() => {
            const tom = hoiLuuCuoi;
            setHoiLuu(false);
            void luuThat(tom);
          }}
          onDong={() => setHoiLuu(false)}
        >
          <ul className="flex flex-col gap-1.5 text-sm text-text-secondary">
            {hoiLuuCuoi.vtMoi && hoiLuuCuoi.uidDoiChucDanh.length > 0 && (
              <li>
                Đổi chức danh → <strong className="text-text-primary">{hoiLuuCuoi.vtMoi.ten}</strong>{" "}
                ({hoiLuuCuoi.uidDoiChucDanh.length} người
                {hoiLuuCuoi.soCapMoi > 0 ? `, trong đó ${hoiLuuCuoi.soCapMoi} người được cấp quyền lần đầu` : ""})
              </li>
            )}
            {/* Ẩn Bật/Tắt khi chưa đọc được quyền riêng — hai danh sách đó tính như thể không ai có
                quyền riêng, tức có thể SAI (xem `canhBao` ngay trên). */}
            {!hoiLuuCuoi.chuaDocRieng && hoiLuuCuoi.bat.length > 0 && (
              <li>
                <span className="font-medium text-success-soft">Bật:</span> {hoiLuuCuoi.bat.join(", ")}
              </li>
            )}
            {!hoiLuuCuoi.chuaDocRieng && hoiLuuCuoi.tat.length > 0 && (
              <li>
                <span className="font-medium text-danger-soft">Tắt:</span> {hoiLuuCuoi.tat.join(", ")}
              </li>
            )}
            {hoiLuuCuoi.soGiuTheoChucDanh > 0 && (
              <li className="text-xs text-text-desc">
                {hoiLuuCuoi.soGiuTheoChucDanh} người có kết quả trùng mẫu chức danh — giữ &quot;theo
                chức danh&quot;, không lưu quyền riêng.
              </li>
            )}
            {/* Chưa đọc được quyền riêng: danh sách Bật/Tắt ở trên tính như thể không ai có quyền
                riêng — nói rõ để không ai tin nhầm (ca E, soát chéo 26/09/2026). */}
            {hoiLuuCuoi.chuaDocRieng && (
              <li className="text-xs text-warning-soft">
                Lần này chỉ đổi chức danh, không ghi ô tick nào.
              </li>
            )}
          </ul>
        </HopXacNhan>
      )}
    </>
  );
}

/** Nhãn trạng thái một người trên danh sách — luôn có CẢ chữ lẫn màu (V1.1). */
function trangThaiNguoi(t: ThongTinNguoi, chuaDocRieng: boolean): { label: string; tone: StatusTone } {
  /* ★ Người trong danh bạ chưa có hồ sơ ở app Thu mua (gộp khối "Thêm người dùng mới"). */
  if (t.chuaCoHoSo) return { label: "Chưa có quyền", tone: "danger" };
  if (t.hs.hoSo.dangLamViec === false) return { label: "Tạm ngưng", tone: "neutral" };
  if (t.vtHienTai?.ma === "ngung_truy_cap") return { label: "Ngừng truy cập", tone: "neutral" };
  if (t.laQuanTri) return { label: "Quản trị", tone: "primary" };
  /* Chưa đọc được quyền riêng thì KHÔNG đếm — đếm theo chức danh là nói sai với người đã được tick. */
  if (chuaDocRieng) return { label: "Chưa rõ quyền riêng", tone: "warning" };
  if (!t.hieuLuc.xemDuocApp) return { label: "Chưa có quyền", tone: "danger" };
  const so = demCoBat(t.hieuLuc);
  if (t.rieng?.lechChucDanh) return { label: `${so} quyền · riêng (chức danh cũ)`, tone: "warning" };
  return t.rieng
    ? { label: `${so} quyền · riêng`, tone: "success" }
    : { label: `${so} quyền · chức danh`, tone: "neutral" };
}

/* 📌 `OTich` (ô tích ba trạng thái) đã dời sang `thanh-phan-dung-chung/o-tich-ba-trang-thai.tsx` ngày
   06/10/2026 — bảng mẫu chức danh dùng chung, không để hai bản sao. */
