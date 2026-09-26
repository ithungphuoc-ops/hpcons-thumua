// ============================================================
// QUYỀN TICK RIÊNG TỪNG NGƯỜI — lớp ĐÈ lên quyền theo chức danh
//
// 🔴 Sếp 26/09/2026, ba chỉ đạo nối tiếp (duyệt bản demo "Phân quyền tick chọn"):
//   ① *"khi chọn nhân viên A thì sẽ hiện 1 list quyền bên cạnh, a giao cho quyền gì thì chỉ cần
//      tick zô là được"*
//   ② *"Thêm chức năng được chọn nhiều người cùng lúc để phân quyền"*
//   ③ trưởng bộ phận là người tick phân quyền.
//
// ## HAI LỚP, KHÔNG THAY NHAU
// · Lớp 1 — CHỨC DANH (`chucNang` + `vaiTro` + `capTM`, gán ở `app/api/phan-quyen`) → `tinhQuyen`
//   ra bộ quyền GỐC. Chức danh VẪN PHẢI GIỮ: danh sách "giao việc cho ai" ở `bang-phan-bo.tsx`
//   lọc theo `chucNang`, bỏ chức danh là người đó biến khỏi danh sách giao việc.
// · Lớp 2 — QUYỀN RIÊNG (tệp này) → tick thêm / bỏ bớt từng cờ cho riêng người đó.
//
// ## 🔴 MẶC ĐỊNH AN TOÀN: CHƯA CÓ QUYỀN RIÊNG = GIỮ NGUYÊN QUYỀN THEO CHỨC DANH
// Bản demo ghi *"Mặc định mọi người không xem được gì"*. Làm đúng như vậy ngay hôm deploy là CẢ
// PHÒNG mất quyền cùng lúc (chưa ai được tick gì). Nên `rieng === null` → trả nguyên `goc`.
// ★ Sếp chốt 26/09/2026: *"Tạm giữ theo chức danh"* — chưa chuyển "mặc định trắng".
//
// 📌 HÀM THUẦN, KHÔNG `import` GÌ CHẠY ĐƯỢC từ `quyen.ts`. Chỉ `import type`. Lý do: `quyen.ts` gọi
// `apDungQuyenRieng` ngay trong `tinhQuyen`, nên tệp này mà nạp ngược `quyen.ts` là vòng nạp — dựng
// bằng esbuild cho `kiem-luat` sẽ ra `undefined` lúc khởi tạo. Luật "ai được trao quyền cho ai"
// (`vuongMacTraoQuyen`) vì vậy đặt ở `luat-phan-quyen.ts`, đúng nhà của luật phân quyền.
//
// ⚠️ ĐÂY VẪN CHỈ LÀ CHẶN GIAO DIỆN + tầng ghi trong trình duyệt. Toàn bộ dữ liệu chạy thử vẫn tải
// về máy người dùng (CLAUDE.md §3.6b) — bỏ tick "Xem giá" không làm giá biến khỏi bộ nhớ trình
// duyệt. Bảo mật thật cần tách document khi lên bản chính thức.
// ============================================================

import type { CapQuyen, ChucNang, NguoiDung, Quyen, VaiTroHeThong } from "@/4-phan-quyen/quyen";

/** Quyền tick riêng. Chỉ các cờ tick được; thiếu khoá = `false` khi áp (xem `apDungQuyenRieng`). */
export type QuyenRieng = Partial<Record<keyof Quyen, boolean>>;

export type NhomQuyenTick = "Được xem" | "Được làm" | "Quản trị";

export interface CoTickDuoc {
  khoa: keyof Quyen;
  nhom: NhomQuyenTick;
  /** Nhãn hiện cạnh ô tích — cách gọi trong công ty, không dùng từ kỹ thuật. */
  nhan: string;
  /** Một câu nói rõ tick vào thì mở ra cái gì. */
  moTa: string;
}

/**
 * NHỮNG CỜ TRƯỞNG BỘ PHẬN TICK ĐƯỢC — bám nhãn bản demo Sếp duyệt 26/09/2026.
 *
 * ⚠️ Vài câu mô tả SỬA LẠI cho đúng app thật, không chép nguyên demo:
 *   · `taoDeNghi` — demo ghi "Lập đề nghị tay trong app", nhưng từ 23/08/2026 nút đó mở app Đề
 *     nghị bên ngoài (xem chú thích `duocVaoDuongDan` ở `quyen.ts`).
 *   · `xemQuyTrinhMuaHang` — cờ này gác cả Tổng quan · Công việc của tôi · Lịch, không chỉ bảng 8 cột.
 *
 * 🔴 `phanQuyenNguoiDung` KHÔNG TICK ĐƯỢC — rút khỏi danh sách theo soát chéo 26/09/2026 (bản đầu có
 * trong demo và từng tick được). Lý do: đường gán chức danh `app/api/phan-quyen` (phiên tích hợp,
 * không sửa được) gác theo CẤP (`capDatDuocToiDa(capTM)`), không đọc quyền tick. Bỏ tick ở đây chỉ
 * ẩn màn hình — người cấp Quản lý trở lên vẫn gọi thẳng cửa đó gán chức danh được. Để ô đó là giao
 * diện hứa một việc app không làm. Nên cờ này LUÔN theo chức danh (`laQuanTri || capTM >= 3`); muốn
 * thu hồi thì hạ chức danh. Cùng lý do, "Vào app" của người cấp ≥ 3 không bỏ được — xem
 * `vuongMacTraoQuyen` ở `luat-phan-quyen.ts`.
 *
 * 📌 Cờ nào có trong `Quyen` mà KHÔNG có trong danh sách này thì luôn giữ theo chức danh — thêm
 * cờ mới vào `Quyen` không tự biến nó thành tick được.
 */
export const CO_TICK_DUOC: readonly CoTickDuoc[] = [
  // ---- Được xem ----
  {
    khoa: "xemDuocApp",
    nhom: "Được xem",
    nhan: "Vào app Thu mua",
    moTa: "Bỏ tick là người này không vào được màn nào và mất luôn mọi quyền bên dưới",
  },
  {
    khoa: "xemQuyTrinhMuaHang",
    nhom: "Được xem",
    nhan: "Xem Quy trình mua hàng",
    moTa: "Bảng quy trình ở /de-nghi, kèm Tổng quan · Công việc của tôi · Lịch",
  },
  {
    khoa: "xemMoiHoSo",
    nhom: "Được xem",
    nhan: "Xem mọi hồ sơ",
    moTa: "Không tick thì chỉ thấy hồ sơ mình được giao / theo dõi",
  },
  { khoa: "xemGia", nhom: "Được xem", nhan: "Xem giá", moTa: "Đơn giá, thành tiền trên báo giá và đơn hàng" },
  { khoa: "xemNhaCungCap", nhom: "Được xem", nhan: "Xem nhà cung cấp", moTa: "Tên, MST, liên hệ nhà cung cấp" },
  { khoa: "xemBaoGia", nhom: "Được xem", nhan: "Xem báo giá", moTa: "Bảng so sánh báo giá của đề nghị" },
  { khoa: "xemCongNo", nhom: "Được xem", nhan: "Xem công nợ", moTa: "Màn Công nợ nhà cung cấp" },
  {
    khoa: "xemNguoiPhuTrach",
    nhom: "Được xem",
    nhan: "Xem người phụ trách",
    moTa: "Ai đang làm dòng nào",
  },
  // ---- Được làm ----
  {
    khoa: "phanBoCongViec",
    nhom: "Được làm",
    nhan: "Giao việc cho nhân viên",
    moTa: "Phân bổ, chuyển việc, chia khối lượng",
  },
  {
    khoa: "taoDeNghi",
    nhom: "Được làm",
    nhan: "Tạo đề nghị",
    moTa: "Hiện nút mở app Đề nghị (request.hpcore.vn)",
  },
  { khoa: "lapPO", nhom: "Được làm", nhan: "Lập đơn mua hàng", moTa: "PO-01 / PO-02 / PO-03" },
  {
    khoa: "taoPoDoiLap",
    nhom: "Được làm",
    nhan: "Lập đơn độc lập",
    moTa: "Đơn chưa gắn đề nghị (chờ đề nghị)",
  },
  { khoa: "suaPODaChot", nhom: "Được làm", nhan: "Sửa đơn đã chốt", moTa: "Phải ghi lý do" },
  {
    khoa: "ghiPhieuNhanHang",
    nhom: "Được làm",
    nhan: "Ghi phiếu nhận hàng",
    moTa: "Nhập số lượng thực nhận",
  },
  { khoa: "xacNhanKho", nhom: "Được làm", nhan: "Xác nhận kho", moTa: "Xác nhận hàng đã nhập kho" },
  {
    khoa: "xacNhanTruongBP",
    nhom: "Được làm",
    nhan: "Xác nhận của trưởng bộ phận",
    moTa: "Lớp xác nhận cuối khi hoàn thành đơn",
  },
  { khoa: "ghiThanhToan", nhom: "Được làm", nhan: "Ghi thanh toán", moTa: "Nhập số đã trả cho nhà cung cấp" },
  /* `xuatHoSo` cố ý KHÔNG có ở đây — soát chéo lần 2 26/09/2026: không nút xuất/in nào đọc
     `quyen.xuatHoSo` (đo bằng quét mã nguồn, xem bài kiểm "mọi ô tick phải có chỗ đọc thật" trong
     `kiem-luat-dung-chung.mjs`). Để ô đó là giao diện hứa một việc app không làm. */
  // ---- Quản trị ---- (`phanQuyenNguoiDung` cố ý KHÔNG có ở đây — xem chú thích đầu danh sách)
  {
    khoa: "xoaToanBoDuLieu",
    nhom: "Quản trị",
    nhan: "Xoá toàn bộ dữ liệu",
    moTa: "Chỉ Quản trị trao được. Xoá sạch dữ liệu chạy thử của cả phòng, không khôi phục được",
  },
];

/** Danh sách khoá tick được, đúng thứ tự trên màn hình. */
export const KHOA_TICK: readonly (keyof Quyen)[] = CO_TICK_DUOC.map((c) => c.khoa);

/** Ba nhóm theo đúng thứ tự hiện. */
export const NHOM_QUYEN_TICK: readonly NhomQuyenTick[] = ["Được xem", "Được làm", "Quản trị"];

/**
 * Cờ CHỈ QUẢN TRỊ trao được, dù người trao đang có chúng.
 *
 * 🔴 `xoaToanBoDuLieu` xoá sạch dữ liệu cả phòng (xem chú thích ở `quyen.ts`).
 * 📌 `phanQuyenNguoiDung` từng nằm ở đây; nay KHÔNG tick được nữa (theo chức danh), nên bỏ khỏi
 * danh sách — soát chéo 26/09/2026.
 */
export const CO_CHI_QUAN_TRI_TRAO: readonly (keyof Quyen)[] = ["xoaToanBoDuLieu"];

export function nhanCoTick(khoa: keyof Quyen): string {
  return CO_TICK_DUOC.find((c) => c.khoa === khoa)?.nhan ?? String(khoa);
}

/**
 * ★ ÁP QUYỀN RIÊNG LÊN QUYỀN GỐC — một chỗ duy nhất, `tinhQuyen` gọi ở dòng cuối.
 *
 * Luật (theo thứ tự):
 *   ① `rieng` null/undefined → giữ nguyên `goc` (MẶC ĐỊNH AN TOÀN, xem đầu tệp).
 *   ② Quản trị (`vaiTro === "admin"`) → luôn giữ `goc` đầy đủ. Không để một cú tick tự khoá tài
 *      khoản quản trị ra ngoài — mất quản trị cuối cùng là phải nhờ khoá Admin SDK.
 *   ③ `goc.xemDuocApp === false` (cấp 0: "Ngừng truy cập" / chưa xác định) → giữ `goc`.
 *      🔴 Quyền riêng KHÔNG mở khoá được tài khoản đã ngừng. Nếu không có chốt này, người nghỉ
 *      việc mà còn sót quyền riêng "Vào app" thì hạ về "Ngừng truy cập" cũng không chặn được họ.
 *   ④ Còn lại: mỗi cờ tick được lấy ĐÚNG theo `rieng` (thiếu khoá = false); cờ không tick được giữ
 *      `goc`.
 *   ⑤ Chức danh cho quyền phân quyền (`goc.phanQuyenNguoiDung` — tức cấp ≥ 3) → ÉP "Vào app" bật.
 *      🔴 Soát chéo lần 2 26/09/2026: người bị bỏ "Vào app" lúc còn cấp 2 rồi được NÂNG lên cấp ≥ 3
 *      thì dây chuyền ⑥ tắt luôn `phanQuyenNguoiDung` trên giao diện, trong khi `/api/phan-quyen`
 *      (phiên tích hợp) vẫn cho họ gán chức danh theo cấp. Giao diện nói "khoá" mà máy chủ vẫn mở.
 *      Luật chặn BỎ mới ở `vuongMacTraoQuyen` ④b không đủ — bản ghi cũ đã tắt sẵn từ trước khi nâng.
 *   ⑥ Rồi nếu `xemDuocApp` ra `false` thì MỌI cờ khác cũng `false`.
 */
export function apDungQuyenRieng(
  goc: Quyen,
  rieng: QuyenRieng | null | undefined,
  laQuanTri: boolean,
): Quyen {
  /* ① ★ SẾP CHỐT 26/09/2026: người CHƯA có bản ghi quyền riêng TẠM GIỮ quyền theo chức danh, chưa
     chuyển "mặc định trắng". Nguyên văn Sếp: *"Tạm giữ theo chức danh"*. Đổi dòng này là đổi chỉ đạo —
     và phải đóng băng quyền hiện tại của mọi người vào `tm_quyen_rieng` TRƯỚC (xem `canGhiQuyenRieng`). */
  if (!rieng) return goc;
  if (laQuanTri) return goc;
  if (!goc.xemDuocApp) return goc;

  const ketQua: Quyen = { ...goc };
  for (const k of KHOA_TICK) ketQua[k] = rieng[k] === true;

  // ⑤ — phải đứng TRƯỚC dây chuyền ⑥.
  if (goc.phanQuyenNguoiDung) ketQua.xemDuocApp = true;

  if (!ketQua.xemDuocApp) {
    for (const k of Object.keys(ketQua) as (keyof Quyen)[]) ketQua[k] = false;
  }
  return ketQua;
}

/** Rút các cờ tick được từ một bộ quyền → bản ghi quyền riêng ĐỦ khoá. */
export function rutQuyenRieng(q: Quyen): QuyenRieng {
  const ra: QuyenRieng = {};
  for (const k of KHOA_TICK) ra[k] = q[k] === true;
  return ra;
}

/**
 * Ghép phần THAY ĐỔI vào NỀN → bản ghi quyền riêng ĐỦ khoá để cất.
 *
 * 📌 `thayDoi` chỉ chứa cờ người dùng ĐÃ CHẠM (chọn nhiều người mà mỗi người một kiểu thì chỉ ghi
 * cờ đã chạm, cờ còn lại giữ của từng người). Khoá có trong `thayDoi` thắng; khoá vắng lấy từ `nen`.
 *
 * ⚠️ Bỏ "Vào app" là bỏ hết — y như `apDungQuyenRieng`, để thứ cất xuống và thứ hiện lên khớp nhau.
 */
export function ghepQuyenRieng(nen: QuyenRieng, thayDoi: QuyenRieng): QuyenRieng {
  const ra: QuyenRieng = {};
  for (const k of KHOA_TICK) {
    ra[k] = k in thayDoi ? thayDoi[k] === true : nen[k] === true;
  }
  if (!ra.xemDuocApp) for (const k of KHOA_TICK) ra[k] = false;
  return ra;
}

/** Hai bản ghi có giống nhau trên mọi cờ tick được không. */
export function quyenRiengGiongNhau(a: QuyenRieng, b: QuyenRieng): boolean {
  return KHOA_TICK.every((k) => (a[k] === true) === (b[k] === true));
}

/**
 * Lần lưu này có cần GHI quyền riêng cho người này không.
 *
 * · Không chạm cờ nào → không ghi.
 * · Đã có quyền riêng → chỉ ghi khi kết quả khác bản đang cất (bỏ lượt ghi vô nghĩa).
 * · CHƯA có quyền riêng mà kết quả y hệt mẫu chức danh (vd chỉ đổi chức danh rồi để nguyên mẫu) →
 *   KHÔNG ghi, để người đó tiếp tục "theo chức danh": sau này luật chức danh trong `tinhQuyen` đổi
 *   thì họ nhận luôn, không bị đóng băng ở bản chụp hôm nay.
 *
 * ⚠️ NẾU SẾP CHUYỂN SANG "MẶC ĐỊNH TRẮNG" (chưa tick = không có quyền): phải ĐÓNG BĂNG quyền hiện tại
 * của mọi người vào `tm_quyen_rieng` TRƯỚC, rồi mới đổi `apDungQuyenRieng` — nếu không, đúng những
 * người được giữ "theo chức danh" ở đây sẽ mất sạch quyền.
 *
 * @param gocSau Quyền theo chức danh SAU lần lưu (đã tính chức danh mới nếu lần lưu có đổi).
 */
export function canGhiQuyenRieng(
  riengCu: QuyenRieng | null,
  gocSau: Quyen,
  thayDoi: QuyenRieng,
): boolean {
  if (Object.keys(thayDoi).length === 0) return false;
  const nen = riengCu ?? rutQuyenRieng(gocSau);
  return !quyenRiengGiongNhau(ghepQuyenRieng(nen, thayDoi), nen);
}

export interface TruocSauKhiLuu {
  /** Bản ghi ĐỦ khoá sẽ cất xuống `tm_quyen_rieng`. */
  riengMoi: QuyenRieng;
  /** Quyền hiệu lực trước khi lưu. */
  quyenTruoc: Quyen;
  /** Quyền hiệu lực sau khi lưu. */
  quyenSau: Quyen;
  /** Có cần ghi không — xem `canGhiQuyenRieng`. */
  canGhi: boolean;
  /**
   * Lần lưu này TẮT ô "Vào app" trong BẢN GHI (trước bật → sau tắt). So trên bản ghi chứ không trên
   * quyền hiệu lực, vì với người cấp ≥ 3 `apDungQuyenRieng` ⑤ ép hiệu lực luôn bật — so hiệu lực thì
   * `vuongMacTraoQuyen` ④b không bao giờ thấy việc bỏ, và bản ghi lặng lẽ tắt sạch mọi cờ khác.
   */
  boVaoApp: boolean;
}

/**
 * ★ MỘT PHÉP TÍNH CHO CẢ HAI PHÍA: route `app/api/quyen-rieng` (trước khi ghi thật) và màn Phân quyền
 * (báo trước, khoá nút). Hai nơi tự ghép tay là sớm muộn màn hình nói "được" mà máy chủ nói "không".
 *
 * @param goc      Quyền theo chức danh (SAU lần lưu, nếu lần lưu có đổi chức danh).
 * @param riengCu  Quyền riêng đang cất, `null` = chưa có.
 * @param thayDoi  Chỉ các cờ đã chạm.
 */
export function tinhTruocSauKhiLuu(
  goc: Quyen,
  riengCu: QuyenRieng | null,
  laQuanTri: boolean,
  thayDoi: QuyenRieng,
): TruocSauKhiLuu {
  const nen = riengCu ?? rutQuyenRieng(goc);
  const riengMoi = ghepQuyenRieng(nen, thayDoi);
  return {
    riengMoi,
    quyenTruoc: apDungQuyenRieng(goc, riengCu, laQuanTri),
    quyenSau: apDungQuyenRieng(goc, riengMoi, laQuanTri),
    canGhi: canGhiQuyenRieng(riengCu, goc, thayDoi),
    boVaoApp: nen.xemDuocApp === true && riengMoi.xemDuocApp !== true,
  };
}

/** Trần số người mỗi lần lưu — dùng chung cho route (chặn 400) và màn hình (khoá nút Lưu). */
export const TOI_DA_NGUOI_MOI_LAN = 50;

/** Đếm số cờ tick được đang bật. */
export function demCoBat(q: Quyen | QuyenRieng): number {
  return KHOA_TICK.filter((k) => q[k] === true).length;
}

/**
 * Đọc bản ghi quyền riêng từ dữ liệu KHÔNG TIN ĐƯỢC (thân yêu cầu, tài liệu Firestore).
 *
 * Trả `null` khi không phải object. `boQua` liệt kê khoá lạ / giá trị không phải boolean — route dùng
 * nó để TỪ CHỐI thân yêu cầu có khoá lạ (bắt lỗi gửi nhầm), còn chỗ đọc dữ liệu đã cất thì chỉ lấy
 * `quyen` và lờ phần lạ đi.
 */
export function chuanHoaQuyenRieng(raw: unknown): { quyen: QuyenRieng; boQua: string[] } | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const quyen: QuyenRieng = {};
  const boQua: string[] = [];
  const hopLe = new Set<string>(KHOA_TICK);
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!hopLe.has(k) || typeof v !== "boolean") {
      boQua.push(k);
      continue;
    }
    quyen[k as keyof Quyen] = v;
  }
  return { quyen, boQua };
}

/** Tên collection cất quyền riêng — Admin SDK ghi, trình duyệt KHÔNG đọc/ghi thẳng. */
export const BO_SUU_TAP_QUYEN_RIENG = "tm_quyen_rieng";

/**
 * DẤU CHỨC DANH — chức danh của người nhận ĐÚNG LÚC bản quyền riêng được lưu.
 *
 * 🔴 Soát chéo 26/09/2026: không có dấu này thì bản quyền riêng lưu cho chức danh CŨ vẫn áp nguyên
 * lên chức danh MỚI. Hai hệ quả thật:
 *   · Hạ chức danh (Thủ kho → Nhân viên) mà "Ghi phiếu nhận hàng" trong bản cũ vẫn bật — hạ mà
 *     không hạ.
 *   · LÁCH "chỉ trao cờ mình có" bằng đổi chức danh vòng: trưởng bộ phận đổi NV sang Thủ kho, lưu
 *     quyền riêng (cờ thủ kho được miễn vì chức danh cho sẵn), rồi đổi lại NV — cờ đó ở lại.
 * Route POST ghi dấu này TỪ HỒ SƠ ĐỌC Ở MÁY CHỦ lúc lưu, không nhận từ trình duyệt.
 */
export interface DauChucDanh {
  chucNang: ChucNang;
  vaiTro: VaiTroHeThong;
  capTM: CapQuyen;
  capKho: CapQuyen;
}

/** Một tài liệu `tm_quyen_rieng/{firebaseUid}`. */
export interface BanGhiQuyenRieng {
  quyen: QuyenRieng;
  /** Chức danh lúc lưu — xem `DauChucDanh`. Bản ghi thiếu dấu coi như LỆCH (chỉ giữ phần bỏ bớt). */
  theoChucDanh?: DauChucDanh;
  /** ISO 8601. */
  capNhatLuc: string;
  /** Mã Firebase của người bấm Lưu. */
  capNhatBoi: string;
  /** Tên người bấm Lưu — để màn hình nói "lưu bởi ai" mà không phải tra thêm. */
  capNhatBoiTen?: string;
}

/**
 * Bản ghi trả về cho màn Phân quyền: bản gốc đã cất + kết quả đã đối chiếu dấu ở máy chủ.
 * `quyenHieuLuc` / `lechChucDanh` KHÔNG được cất xuống — chỉ có trong kết quả GET.
 */
export interface BanGhiQuyenRiengHienThi extends BanGhiQuyenRieng {
  quyenHieuLuc: QuyenRieng;
  lechChucDanh: boolean;
}

/** Dấu chức danh hiện tại của một người. `capKho` vắng = 0, để hai cách ghi không bị coi là lệch. */
export function dauChucDanhCua(
  nd: Pick<NguoiDung, "chucNang" | "vaiTro" | "capTM" | "capKho">,
): DauChucDanh {
  return { chucNang: nd.chucNang, vaiTro: nd.vaiTro, capTM: nd.capTM, capKho: nd.capKho ?? 0 };
}

/** Hai dấu có khớp không. `undefined` (bản ghi cũ không có dấu) luôn là KHÔNG khớp. */
export function khopDauChucDanh(a: DauChucDanh | undefined, b: DauChucDanh): boolean {
  return (
    a !== undefined &&
    a.chucNang === b.chucNang &&
    a.vaiTro === b.vaiTro &&
    a.capTM === b.capTM &&
    (a.capKho ?? 0) === (b.capKho ?? 0)
  );
}

/**
 * Đọc dấu chức danh từ dữ liệu không tin được. Sai khuôn → `undefined` (tức coi như THIẾU dấu → nhánh
 * an toàn của `quyenRiengHieuLuc`).
 *
 * 📌 `capKho` VẮNG = 0 (cùng quy ước với `dauChucDanhCua` ở đầu ghi và `khopDauChucDanh` ở đầu so).
 * `capKho` CÓ MẶT mà sai khuôn → cả dấu `undefined`, KHÔNG quy về 0 (soát chéo lần 2 26/09/2026): quy
 * về 0 là đoán, mà đoán trúng một chức danh khác thì dấu "khớp" nhầm và bản riêng áp nguyên.
 */
export function chuanHoaDauChucDanh(raw: unknown): DauChucDanh | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const d = raw as Record<string, unknown>;
  const cap = (x: unknown) => typeof x === "number" && Number.isInteger(x) && x >= 0 && x <= 4;
  if (typeof d.chucNang !== "string" || typeof d.vaiTro !== "string" || !cap(d.capTM)) return undefined;
  if (d.capKho !== undefined && d.capKho !== null && !cap(d.capKho)) return undefined;
  return {
    chucNang: d.chucNang as ChucNang,
    vaiTro: d.vaiTro as VaiTroHeThong,
    capTM: d.capTM as CapQuyen,
    capKho: (cap(d.capKho) ? d.capKho : 0) as CapQuyen,
  };
}

/**
 * ★ QUYỀN RIÊNG CÒN HIỆU LỰC của một bản ghi, đối chiếu với chức danh HIỆN TẠI.
 *
 *   · Chưa có bản ghi → `null` (theo chức danh).
 *   · Dấu KHỚP → dùng nguyên `banGhi.quyen`.
 *   · Dấu LỆCH, có `gocCu` (quyền theo chức danh LÚC LƯU, tính từ dấu) → chỉ mang sang những cờ ĐÃ
 *     BỊ BỎ THẬT ở bản cũ: `ra[k] = goc[k] && !(gocCu[k] && rieng[k] !== true)`. Cờ mới của chức danh
 *     mới được cấp; cờ chức danh mới không cho thì tắt; cờ từng được trao VƯỢT chức danh cũ không mang
 *     sang (không bao giờ vượt chức danh mới).
 *     🔴 Soát chéo lần 2 26/09/2026: bản trước dùng `goc[k] && rieng[k]` — người được NÂNG chức danh
 *     (NV → Trưởng BP) mất luôn các cờ mặc định MỚI của chức danh mới (vd "Giao việc") chỉ vì bản cũ
 *     thời NV không có cờ đó. Tức nâng mà không nâng.
 *   · THIẾU dấu (bản rất cũ / dấu sai khuôn), hoặc không có `gocCu` → cách an toàn cũ
 *     `goc[k] && rieng[k] === true` (không biết cờ nào là "đã bỏ thật" thì coi mọi cờ vắng là đã bỏ).
 *
 * 📌 `gocCu` do NƠI GỌI tính (`tinhQuyenTheoDauChucDanh` ở `quyen.ts`) rồi truyền vào — tệp này không
 * được nạp `quyen.ts` (vòng nạp). Dùng qua `quyenRiengConHieuLuc` ở `quyen.ts` cho khỏi quên truyền.
 * Áp ở MỌI chỗ đọc bản ghi phía máy chủ (GET của mình, GET tất cả, bản cũ trong POST) và ở màn Phân
 * quyền khi xem trước lần đổi chức danh — cùng một hàm, không ai tự ghép.
 */
export function quyenRiengHieuLuc(
  banGhi: Pick<BanGhiQuyenRieng, "quyen" | "theoChucDanh"> | null | undefined,
  nd: Pick<NguoiDung, "chucNang" | "vaiTro" | "capTM" | "capKho">,
  goc: Quyen,
  gocCu?: Quyen | null,
): QuyenRieng | null {
  if (!banGhi) return null;
  if (khopDauChucDanh(banGhi.theoChucDanh, dauChucDanhCua(nd))) return banGhi.quyen;
  const ra: QuyenRieng = {};
  const cu = banGhi.theoChucDanh !== undefined ? (gocCu ?? null) : null;
  for (const k of KHOA_TICK) {
    ra[k] = cu ? goc[k] && !(cu[k] && banGhi.quyen[k] !== true) : goc[k] && banGhi.quyen[k] === true;
  }
  return ra;
}
