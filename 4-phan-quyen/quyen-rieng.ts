// ============================================================
// QUYỀN TICK RIÊNG TỪNG NGƯỜI — lớp ĐÈ lên quyền theo chức danh
//
// 🔴 Sếp 26/09/2026, ba chỉ đạo nối tiếp (duyệt bản demo "Phân quyền tick chọn"):
//   ① *"khi chọn nhân viên A thì sẽ hiện 1 list quyền bên cạnh, a giao cho quyền gì thì chỉ cần
//      tick zô là được"*
//   ② *"Thêm chức năng được chọn nhiều người cùng lúc để phân quyền"*
//   ③ trưởng bộ phận là người tick phân quyền.
//
// ## THỨ TỰ ÁP (★ Sếp 06/10/2026 — Câu 1 = A "bấm thẳng vào bảng mẫu", Câu 3 = A "chỉ giữ ô cố ý khác")
//   ① CÔNG THỨC theo chức danh (`chucNang` + `vaiTro` + `capTM` + `capKho`) → `tinhQuyenTheoChucDanh`
//      ở `quyen.ts`. Chức danh VẪN PHẢI GIỮ: danh sách "giao việc cho ai" ở `bang-phan-bo.tsx` lọc
//      theo `chucNang`, bỏ chức danh là người đó biến khỏi danh sách giao việc.
//   ② MẪU CHỨC DANH Sếp tick trên bảng (`quyen-mau-chuc-danh/chung`, xem `mau-chuc-danh.ts`) — chỉ
//      các ô KHÁC công thức, bỏ qua mọi ô khoá (`DONG_KHOA_MAU`, cột Quản trị / Ngừng truy cập) →
//      `quyenTheoChucDanhCoMau`.
//   ③ NGOẠI LỆ RIÊNG của từng người (tệp này, `tm_quyen_rieng/{mã Firebase}`) — từ 06/10/2026 chỉ
//      cất những ô CỐ Ý khác "chức danh" (khuôn 2, `ngoaiLe`); ô vắng đi theo ① + ②, kể cả khi mẫu
//      đổi về sau. Bản ghi cũ (khuôn 1, đủ 18 ô) chuyển NGAY KHI ĐỌC — xem `quyenRiengHieuLuc`.
//   ④ Các chốt ①–⑥ của `apDungQuyenRieng` (giữ nguyên, không đổi một dòng).
// Máy chủ gộp sẵn ② + ③ thành ĐỦ 18 ô hiệu lực rồi gắn vào `NguoiDung.quyenRieng`, nên `tinhQuyen`
// và mọi chỗ gọi nó (tầng ghi, `quyen-theo-ho-so.ts`) không phải sửa.
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
 * NHỮNG CỜ TICK ĐƯỢC — 18 ô, dùng CHUNG cho khối tick từng người VÀ bảng mẫu chức danh (một nguồn).
 *
 * ★ Sếp 06/10/2026 (kế hoạch phân quyền GĐ3): đổi NHÃN, MÔ TẢ và THỨ TỰ cho nói đúng việc thật mà cờ
 * đang gác — đo chỗ đọc thật từng cờ trước khi viết câu, không hứa thêm. 🔴 KHÔNG đổi `khoa`: đổi khoá
 * là đỏ hàng loạt bài kiểm và hỏng mọi bản ghi `tm_quyen_rieng` / mẫu chức danh đã cất.
 *   · `lapPO` → "Làm việc thu mua": cờ này gác gần hết việc thu mua chứ không riêng lập đơn — nhãn cũ
 *     "Lập đơn mua hàng" làm người ta tưởng bỏ ô chỉ mất nút lập đơn.
 *   · `taoPoDoiLap` → "Xác nhận khớp PO chờ đề nghị": lập PO độc lập đang tạm ngưng, đây là việc thật
 *     duy nhất còn lại của cờ.
 *   · `ghiPhieuNhanHang` → "Đính / bổ sung phiếu giao nhận": số thực nhận nay do app Kho gửi sang,
 *     cờ chỉ còn mở việc đính tệp phiếu (`bang-tien-do-po.tsx`, `kho-du-lieu.tsx`).
 *   · `xacNhanKho` → "Vào Theo dõi đơn hàng (kho)": sau 17/09/2026 nút xác nhận nhận hàng là luật cố
 *     định của thu mua (dòng ghi chú G2 ở `mau-chuc-danh.ts`), cờ này chỉ còn mở menu + đường dẫn.
 *   · `xacNhanTruongBP` → "Duyệt báo giá & hoàn thành đơn, hồ sơ"; `xoaToanBoDuLieu` → "Xoá đề nghị".
 *   · Ba dòng KHÔNG tick được (Phân quyền · Nhật ký · Cài đặt quy trình; Xác nhận nhận hàng) nằm ở
 *     `DONG_GHI_CHU_MAU` (`mau-chuc-danh.ts`), CỐ Ý không đưa vào đây.
 *
 * ⚠️ Từ bản demo 26/09/2026 đã sửa cho đúng app thật:
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
    moTa:
      "Bỏ tick là người này không vào được màn nào và mất luôn mọi quyền bên dưới. Trên bảng mẫu: theo cấp (từ cấp 1), không sửa.",
  },
  {
    khoa: "xemQuyTrinhMuaHang",
    nhom: "Được xem",
    nhan: "Vào Quy trình mua hàng",
    moTa:
      "Tổng quan · Việc của tôi · Lịch · Quy trình mua hàng · Theo dõi đơn hàng · Danh mục nhà cung cấp (danh mục cần thêm ô Xem nhà cung cấp)",
  },
  {
    khoa: "xemMoiHoSo",
    nhom: "Được xem",
    nhan: "Xem mọi hồ sơ",
    moTa: "Không tick thì chỉ thấy hồ sơ mình được giao / theo dõi",
  },
  {
    khoa: "xemGia",
    nhom: "Được xem",
    nhan: "Xem giá",
    /* B-F10 (06/10/2026): nút "In đơn mua hàng" (`don-hang-chi-tiet.tsx`) và "Lưu và In" (form lập đơn)
       cũng gác bằng `quyen.xemGia` — bản in luôn có giá. */
    moTa:
      "Đơn giá, thành tiền trên báo giá và đơn hàng; nút xuất đơn hàng và In đơn mua hàng chỉ hiện khi có ô này",
  },
  {
    khoa: "xemNhaCungCap",
    nhom: "Được xem",
    nhan: "Xem nhà cung cấp",
    moTa: "Tên, MST, liên hệ nhà cung cấp; danh mục nhà cung cấp",
  },
  { khoa: "xemBaoGia", nhom: "Được xem", nhan: "Xem báo giá", moTa: "Bảng so sánh báo giá của đề nghị" },
  {
    khoa: "xemNguoiPhuTrach",
    nhom: "Được xem",
    nhan: "Xem người phụ trách",
    moTa: "Ai đang làm dòng nào",
  },
  { khoa: "xemCongNo", nhom: "Được xem", nhan: "Xem công nợ", moTa: "Màn Công nợ nhà cung cấp" },
  // ---- Được làm ----
  {
    khoa: "taoDeNghi",
    nhom: "Được làm",
    nhan: "Tạo đề nghị",
    /* B-F10: phụ thuộc — xem `phuThuocCuaO` ở `mau-chuc-danh.ts`. */
    moTa:
      "Hiện nút mở app Đề nghị (request.hpcore.vn) ở Việc của tôi — chỉ có tác dụng khi có ô “Vào Quy trình mua hàng”",
  },
  {
    khoa: "phanBoCongViec",
    nhom: "Được làm",
    nhan: "Giao việc",
    /* B-F10 (06/10/2026): BỎ "xoá dòng mặt hàng · tick việc bắt buộc" — hai việc đó còn gác bằng `lapPO`
       ở chỗ khác, Sếp chưa chốt cờ nào; không hứa ở ô này. */
    moTa:
      "Giao / chuyển / bỏ việc · hạ số báo giá · nhân bản · sửa hợp đồng từ bước ⑤ · lùi bước ②→① và ⑤→④",
  },
  {
    khoa: "lapPO",
    nhom: "Được làm",
    nhan: "Làm việc thu mua",
    /* B-F10 (06/10/2026): bỏ câu "Bỏ ô này là rút người đó khỏi việc thu mua" — SAI: người phụ trách một đơn
       vẫn sửa (`duocSuaDon` ở form lập đơn) và duyệt hoàn thành (`vuongMacQuyenXacNhanHoanThanhDon`) đơn
       của mình dù không có ô này. Viết đúng việc thật cờ đang gác. */
    moTa:
      "Phần lớn việc thu mua: sửa thông tin và thời hạn, kéo thẻ, người theo dõi, lập và trình báo giá, lập đơn, gắn đề nghị vào PO chờ, nhà cung cấp, thủ kho, điều khoản công nợ, hoá đơn VAT, chứng từ các bước; là điều kiện của Xác nhận nhận hàng (dòng ghi chú). Người phụ trách một đơn vẫn sửa và duyệt hoàn thành đơn của mình dù không có ô này.",
  },
  {
    khoa: "taoPoDoiLap",
    nhom: "Được làm",
    nhan: "Xác nhận khớp PO chờ đề nghị",
    moTa: "Xác nhận / huỷ khớp tự động PO \"chờ đề nghị\" với đề nghị (lập PO độc lập đang tạm ngưng)",
  },
  {
    khoa: "suaPODaChot",
    nhom: "Được làm",
    nhan: "Sửa đơn đã chốt",
    moTa: "Phải ghi lý do · ghi ngày workflow cho đơn người khác",
  },
  {
    khoa: "ghiPhieuNhanHang",
    nhom: "Được làm",
    nhan: "Đính / bổ sung phiếu giao nhận",
    /* B-F10 (06/10/2026): thêm việc thật thứ hai — `vuongMacGhiNhanGiaoHangPhongBan` (kho-du-lieu.tsx) →
       `duocGhiNhanGiaoHangCuaHoSo` (`quyen-theo-ho-so.ts`) cho qua ngay khi có cờ này. */
    moTa:
      "Đính tệp phiếu giao nhận cho từng lần giao (mỗi lần giao một phiếu); ghi nhận giao hàng ở hồ sơ phòng ban",
  },
  {
    khoa: "xacNhanKho",
    nhom: "Được làm",
    nhan: "Vào Theo dõi đơn hàng (kho)",
    moTa:
      "Mở mục Theo dõi đơn hàng cho thủ kho / kho tổng. Không phải nút xác nhận nhận hàng (xem dòng ghi chú)",
  },
  {
    khoa: "xacNhanTruongBP",
    nhom: "Được làm",
    nhan: "Duyệt báo giá & hoàn thành đơn, hồ sơ",
    moTa:
      "Duyệt / không duyệt / mở khoá báo giá (bước ③) · duyệt hoàn thành đơn, kể cả giao thiếu kèm lý do · hoàn thành hồ sơ (bước ⑧) · lùi bước ③→② và ④→③",
  },
  {
    khoa: "ghiThanhToan",
    nhom: "Được làm",
    nhan: "Ghi thanh toán",
    moTa: "Nhập / sửa / xoá đợt thanh toán đã trả nhà cung cấp",
  },
  /* `xuatHoSo` cố ý KHÔNG có ở đây — soát chéo lần 2 26/09/2026: không nút xuất/in nào đọc
     `quyen.xuatHoSo` (đo bằng quét mã nguồn, xem bài kiểm "mọi ô tick phải có chỗ đọc thật" trong
     `kiem-luat-dung-chung.mjs`). Để ô đó là giao diện hứa một việc app không làm. */
  // ---- Quản trị ---- (`phanQuyenNguoiDung` cố ý KHÔNG có ở đây — xem chú thích đầu danh sách)
  {
    khoa: "xoaToanBoDuLieu",
    nhom: "Quản trị",
    nhan: "Xoá đề nghị",
    /* B-F10: phụ thuộc — xem `phuThuocCuaO` ở `mau-chuc-danh.ts`. */
    moTa:
      "Chỉ Quản trị. Xoá đề nghị ở khối \"Vùng nguy hiểm\" (Cài đặt quy trình), không khôi phục được — nút xoá nằm trong Cài đặt quy trình, chỉ người có Phân quyền vào được",
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
 * ★ DÒNG KHOÁ TRÊN BẢNG MẪU CHỨC DANH — Sếp 06/10/2026 (kế hoạch phân quyền mục 4, "Ô khoá").
 *
 * · `xemDuocApp` — vào app theo CẤP (từ cấp 1, CLAUDE.md §3.6c). Mẫu bỏ "Vào app" của cả một chức danh
 *   là khoá cả nhóm người mà không ai thấy lý do; muốn chặn một người thì bỏ tick riêng hoặc hạ chức danh.
 * · `xoaToanBoDuLieu` — chỉ Quản trị; muốn trao thì Quản trị tick riêng TỪNG người (chốt
 *   `CO_CHI_QUAN_TRI_TRAO`). Bật ở mẫu là trao cho cả chức danh, kể cả người được gán về sau.
 *
 * 🔴 CHẶN HAI LỚP: máy chủ từ chối ghi các ô này (`lyDoOKhoaMau` ở `mau-chuc-danh.ts`), VÀ lúc áp mẫu
 * `quyenTheoChucDanhCoMau` cũng bỏ qua chúng — tài liệu mẫu có lỡ chứa ô khoá (sửa tay ở console) thì
 * vẫn không đi vào quyền của ai.
 */
export const DONG_KHOA_MAU: readonly (keyof Quyen)[] = ["xemDuocApp", "xoaToanBoDuLieu"];

/** Số ô đè DÙNG ĐƯỢC trong một cột mẫu (bỏ ô khoá, khoá lạ, giá trị không phải boolean). */
export function demODeDungDuoc(oDeMau: QuyenRieng | null | undefined): number {
  if (!oDeMau) return 0;
  return KHOA_TICK.filter((k) => !DONG_KHOA_MAU.includes(k) && typeof oDeMau[k] === "boolean").length;
}

/**
 * ★ CÔNG THỨC + MẪU CHỨC DANH (lớp ① + ② ở đầu tệp) — Sếp 06/10/2026, Câu 1 = A.
 *
 * `oDeMau` là các ô Sếp tick KHÁC công thức cho chức danh của người này (`oDeCuaHoSo` ở
 * `mau-chuc-danh.ts`). Ô khoá (`DONG_KHOA_MAU`) và khoá ngoài `KHOA_TICK` bị BỎ QUA — chặn lần hai.
 *
 * 🔴 `congThuc.xemDuocApp === false` (cấp 0: "Ngừng truy cập" / chưa xác định) → trả NGUYÊN công thức:
 * mẫu không mở lại được tài khoản đã ngừng, đúng tinh thần chốt ③ của `apDungQuyenRieng`.
 */
export function quyenTheoChucDanhCoMau(congThuc: Quyen, oDeMau: QuyenRieng | null | undefined): Quyen {
  if (!oDeMau || !congThuc.xemDuocApp) return congThuc;
  const ra: Quyen = { ...congThuc };
  for (const k of KHOA_TICK) {
    if (DONG_KHOA_MAU.includes(k)) continue;
    const v = oDeMau[k];
    if (typeof v === "boolean") ra[k] = v;
  }
  return ra;
}

/**
 * ★ RÚT NGOẠI LỆ — chỉ những ô mà quyền hiệu lực KHÁC "chức danh" (công thức + mẫu). Sếp 06/10/2026,
 * Câu 3 = A: *"chỉ giữ những ô Sếp hoặc Trưởng BP đã cố ý tick khác, các ô còn lại theo mẫu mới"*.
 *
 * Kết quả rỗng (`{}`) = người này y hệt chức danh → nơi gọi XOÁ bản ghi chứ không cất `{}`.
 */
export function rutNgoaiLe(hieuLuc: QuyenRieng, goc: Quyen): QuyenRieng {
  const ra: QuyenRieng = {};
  for (const k of KHOA_TICK) {
    const v = hieuLuc[k] === true;
    if (v !== (goc[k] === true)) ra[k] = v;
  }
  return ra;
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

/**
 * Một tài liệu `tm_quyen_rieng/{firebaseUid}`.
 *
 * ★ HAI KHUÔN — Sếp 06/10/2026, Câu 3 = A:
 *   · KHUÔN 1 (từ `278f775`, KHÔNG có trường `khuon`): `quyen` đủ 18 ô — bản chụp cả bộ lúc lưu.
 *   · KHUÔN 2 (`khuon: 2`): `ngoaiLe` CHỈ chứa ô cố ý khác "chức danh" (công thức + mẫu lúc lưu);
 *     `theoChucDanh` BẮT BUỘC. Vẫn ghi kèm `quyen` đủ 18 ô hiệu lực lúc lưu — CHỈ để bản mã cũ đọc đúng
 *     khi Instant Rollback; mã mới KHÔNG đọc `quyen` khi `khuon === 2`.
 * Chỉ đọc qua `chuanHoaBanGhiQuyenRieng`, tính hiệu lực qua `quyenRiengHieuLuc` (đừng tự đọc tay).
 *
 * 📌 Giữ là `interface` (không đổi sang `type`): `BanGhiQuyenRiengHienThi` kế thừa từ đây.
 */
export interface BanGhiQuyenRieng {
  quyen: QuyenRieng;
  /** Chức danh lúc lưu — xem `DauChucDanh`. Bản ghi thiếu dấu coi như LỆCH (chỉ giữ phần bỏ bớt). */
  theoChucDanh?: DauChucDanh;
  /** `2` = khuôn ngoại lệ (06/10/2026). Vắng = khuôn 1. */
  khuon?: 2;
  /** Khuôn 2: chỉ các ô cố ý khác chức danh. Vắng ô = theo chức danh + mẫu. */
  ngoaiLe?: QuyenRieng;
  /**
   * Khuôn 2: `phienBan` của mẫu chức danh LÚC LƯU (bổ sung đặc tả B-F8, 06/10/2026). Dấu vết để phát
   * hiện tài liệu mẫu bị XOÁ: mẫu vắng mà có bản ghi mang `phienBanMau ≥ 1` → mẫu HỎNG, không phải mẫu
   * trống (`docMauChucDanh` ở `mau-chuc-danh.ts`). Bản khuôn 2 ghi trước B-F8 (chỉ có ở kho demo / bài
   * kiểm) không có trường này → coi như không có dấu vết.
   */
  phienBanMau?: number;
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
 * ★ ĐỌC MỘT TÀI LIỆU `tm_quyen_rieng` TỪ DỮ LIỆU KHÔNG TIN ĐƯỢC — một chỗ duy nhất (Sếp 06/10/2026,
 * khuôn ngoại lệ). Trả `null` = SAI KHUÔN → nơi gọi NÉM LỖI (route GET 500 → trình duyệt chặn vào app),
 * KHÔNG được coi là "chưa có bản ghi" (chưa có = theo chức danh = quyền RỘNG hơn).
 *
 *   · KHÔNG có `khuon` → khuôn 1, đọc Y HỆT cách route đọc từ 26/09/2026: `quyen` phải là object; khoá
 *     lạ / giá trị không phải boolean thì LỜ ĐI (tức tính là tắt — hẹp hơn); dấu chức danh sai khuôn →
 *     coi như thiếu dấu (nhánh an toàn của `quyenRiengHieuLuc`).
 *   · `khuon === 2` → CHẶT: `ngoaiLe` phải là object, mọi khoá thuộc `KHOA_TICK`, mọi giá trị boolean,
 *     `theoChucDanh` hợp lệ. Sai một điều là `null`. 🔴 Lý do chặt hơn khuôn 1: ở khuôn 2 ô VẮNG nghĩa là
 *     "theo chức danh" — lờ đi một ô `false` hỏng là trả lại cho người đó đúng quyền vừa bị bỏ.
 *   · `khuon` có giá trị khác → `null` (khuôn lạ, có thể của bản mã mới hơn — không đoán).
 */
export function chuanHoaBanGhiQuyenRieng(raw: unknown): BanGhiQuyenRieng | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const d = raw as Record<string, unknown>;
  const capNhat = {
    capNhatLuc: typeof d.capNhatLuc === "string" ? d.capNhatLuc : "",
    capNhatBoi: typeof d.capNhatBoi === "string" ? d.capNhatBoi : "",
    capNhatBoiTen: typeof d.capNhatBoiTen === "string" ? d.capNhatBoiTen : undefined,
  };

  if (d.khuon === undefined) {
    const q = chuanHoaQuyenRieng(d.quyen);
    if (!q) return null;
    return { quyen: q.quyen, theoChucDanh: chuanHoaDauChucDanh(d.theoChucDanh), ...capNhat };
  }

  if (d.khuon !== 2) return null;
  const nl = chuanHoaQuyenRieng(d.ngoaiLe);
  if (!nl || nl.boQua.length > 0) return null;
  const dau = chuanHoaDauChucDanh(d.theoChucDanh);
  if (!dau) return null;
  /* `phienBanMau` (B-F8): VẮNG thì thôi (bản trước B-F8); CÓ MẶT mà sai khuôn → `null` như mọi lỗi khuôn
     khác của khuôn 2 — đọc sai dấu vết là mất khả năng phát hiện mẫu bị xoá. */
  const coPhienBanMau = d.phienBanMau !== undefined;
  if (
    coPhienBanMau &&
    !(typeof d.phienBanMau === "number" && Number.isInteger(d.phienBanMau) && d.phienBanMau >= 0)
  ) {
    return null;
  }
  /* `quyen` ở khuôn 2 chỉ để bản mã CŨ đọc khi rollback — mã mới không dùng, nên thiếu thì để rỗng. */
  const quyenCu = chuanHoaQuyenRieng(d.quyen);
  return {
    khuon: 2,
    ngoaiLe: nl.quyen,
    quyen: quyenCu?.quyen ?? {},
    theoChucDanh: dau,
    ...(coPhienBanMau ? { phienBanMau: d.phienBanMau as number } : {}),
    ...capNhat,
  };
}

/**
 * ★ NGOẠI LỆ ĐANG GIỮ của một bản ghi — các ô KHÔNG đi theo "chức danh + mẫu" hiện tại, kèm giá trị bị
 * ghim. MỘT chỗ suy ra cho cả phép tính hiệu lực (`quyenRiengHieuLuc`), phép tính lưu (bổ sung đặc tả
 * B-F2 — "chỉ GIỮ ô đã cố ý khác"), phép đếm ảnh hưởng khi đổi mẫu (B-F6) và dấu "(khác chức danh)" trên
 * màn Phân quyền (`k in ngoaiLe`). Mọi nhánh: hiệu lực ô k = `k ∈ ngoaiLe ? ngoaiLe[k] : goc[k]`.
 *
 *   · `khop: true` — dấu chức danh KHỚP hồ sơ hiện tại; `ngoaiLe` là ô CỐ Ý khác (giá trị bất kỳ):
 *       – khuôn 2: đúng `ngoaiLe` đã cất (kể cả ô đang TRÙNG mẫu hiện tại — B-F2, Câu 3 = A);
 *       – khuôn 1 có `gocCu`: ngoại lệ NGẦM = ô mà `(quyen[k] === true) ≠ gocCu[k]` (đặc tả 2.2);
 *       – khuôn 1 không có `gocCu` (chỉ khi gọi tay): cả 18 ô bị ghim như trước 06/10.
 *   · `khop: false` — dấu LỆCH / THIẾU / khuôn 2 hỏng: chỉ các ô bị ghim TẮT (`false`) — luật hẹp, không
 *     bao giờ mang ô `true` sang chức danh khác:
 *       – khuôn 2 lệch: ô `ngoaiLe[k] === false`;
 *       – khuôn 2 thiếu `ngoaiLe` (không qua `chuanHoaBanGhiQuyenRieng`): ô `quyen[k] !== true`;
 *       – khuôn 1 lệch có `gocCu`: ô `gocCu[k] && quyen[k] !== true` (cờ ĐÃ BỊ BỎ THẬT ở bản cũ);
 *       – khuôn 1 thiếu dấu: ô `quyen[k] !== true`.
 *
 * @param gocCu CÔNG THỨC (không mẫu) tại dấu chức danh lúc lưu — BẮT BUỘC truyền (`null` tường minh khi
 *              không có). Nơi gọi trong app dùng `ngoaiLeConHieuLuc` ở `quyen.ts` (tự tính `gocCu`).
 */
export function ngoaiLeCuaBanGhi(
  banGhi: Pick<BanGhiQuyenRieng, "quyen" | "theoChucDanh" | "khuon" | "ngoaiLe">,
  nd: Pick<NguoiDung, "chucNang" | "vaiTro" | "capTM" | "capKho">,
  gocCu: Quyen | null,
): { khop: boolean; ngoaiLe: QuyenRieng } {
  const khop = khopDauChucDanh(banGhi.theoChucDanh, dauChucDanhCua(nd));
  const ngoaiLe: QuyenRieng = {};
  const coKhoa = (o: QuyenRieng, k: keyof Quyen) => Object.prototype.hasOwnProperty.call(o, k);

  if (banGhi.khuon === 2) {
    const nl = banGhi.ngoaiLe;
    if (!nl || typeof nl !== "object") {
      /* Khuôn 2 không qua `chuanHoaBanGhiQuyenRieng` (thiếu `ngoaiLe`) → luật HẸP như thiếu dấu, không
         bao giờ rộng hơn chức danh. Đừng đổi thành "theo chức danh": đọc lỗi không được thành rộng hơn. */
      for (const k of KHOA_TICK) if (banGhi.quyen?.[k] !== true) ngoaiLe[k] = false;
      return { khop: false, ngoaiLe };
    }
    for (const k of KHOA_TICK) {
      if (khop) {
        if (coKhoa(nl, k)) ngoaiLe[k] = nl[k] === true;
      } else if (nl[k] === false) {
        ngoaiLe[k] = false;
      }
    }
    return { khop, ngoaiLe };
  }

  const cu = banGhi.theoChucDanh !== undefined ? gocCu : null;
  for (const k of KHOA_TICK) {
    const giaTri = banGhi.quyen[k] === true;
    if (khop) {
      /* Ô trùng công thức lúc lưu → đi theo chức danh + mẫu HIỆN TẠI (Câu 3 = A); ô khác → cố ý khác. */
      if (!(cu && giaTri === (cu[k] === true))) ngoaiLe[k] = giaTri;
    } else if (cu ? cu[k] === true && !giaTri : !giaTri) {
      ngoaiLe[k] = false;
    }
  }
  return { khop, ngoaiLe };
}

/**
 * ★ QUYỀN RIÊNG CÒN HIỆU LỰC của một bản ghi, đối chiếu với chức danh HIỆN TẠI — luôn trả ĐỦ 18 ô
 * (hoặc `null` = theo chức danh), nên `apDungQuyenRieng` (chốt ①–⑥) không phải đổi.
 *
 * `goc` = công thức của hồ sơ HIỆN TẠI + ô đè mẫu của chức danh hiện tại (`quyenTheoChucDanhCoMau`).
 * `gocCu` = CÔNG THỨC (không mẫu) tại dấu chức danh lúc lưu — chỉ dùng cho khuôn 1.
 *
 * ★ Sếp 06/10/2026, Câu 3 = A — bảng đầy đủ ở đặc tả 2.2:
 *   · Chưa có bản ghi → `null` khi chức danh không có ô đè mẫu (`coODeMau` false: y hệt trước 06/10);
 *     có ô đè → `rutQuyenRieng(goc)` đủ 18 ô (để mẫu đi được vào `tinhQuyen` qua `quyenRieng`).
 *   · KHUÔN 2, dấu KHỚP → `k ∈ ngoaiLe ? ngoaiLe[k] : goc[k]` (ngoại lệ thắng mẫu; ô vắng theo mẫu).
 *   · KHUÔN 2, dấu LỆCH (hoặc thiếu) → `goc[k] && ngoaiLe[k] !== false`: CHỈ mang ô `false` sang chức
 *     danh mới, KHÔNG BAO GIỜ mang ô `true` — không lách "chỉ trao cờ mình có" bằng đổi chức danh vòng.
 *   · KHUÔN 1, dấu KHỚP, có `gocCu` → ngoại lệ NGẦM = các k mà `(quyen[k]===true) ≠ gocCu[k]`, rồi tính
 *     như khuôn 2 khớp. Đây là bước "chuyển khi đọc", không ghi lại kho: chính xác vì công thức
 *     `tinhQuyenTheoChucDanh` không đổi từ `278f775` (đo lại 06/10/2026 bằng `git diff 278f775 HEAD`).
 *     🔴 AI ĐỔI CÔNG THỨC phải di trú khuôn 1 TRƯỚC — bài kiểm ảnh chụp ma trận canh chỗ này.
 *     Mẫu trống thì `goc = gocCu` → kết quả đúng bằng `quyen` như trước 06/10.
 *   · KHUÔN 1, dấu KHỚP, không có `gocCu` → `quyen[k] === true` (như trước).
 *   · KHUÔN 1, dấu LỆCH, có `gocCu` → chỉ mang sang những cờ ĐÃ BỊ BỎ THẬT ở bản cũ:
 *     `ra[k] = goc[k] && !(gocCu[k] && rieng[k] !== true)`. Cờ mới của chức danh mới được cấp; cờ chức
 *     danh mới không cho thì tắt; cờ từng được trao VƯỢT chức danh cũ không mang sang.
 *     🔴 Soát chéo lần 2 26/09/2026: bản trước dùng `goc[k] && rieng[k]` — người được NÂNG chức danh
 *     (NV → Trưởng BP) mất luôn các cờ mặc định MỚI của chức danh mới (vd "Giao việc") chỉ vì bản cũ
 *     thời NV không có cờ đó. Tức nâng mà không nâng.
 *   · KHUÔN 1 THIẾU dấu (bản rất cũ / dấu sai khuôn) → cách an toàn cũ `goc[k] && rieng[k] === true`
 *     (không biết cờ nào là "đã bỏ thật" thì coi mọi cờ vắng là đã bỏ). Không đoán chức danh lúc lưu.
 *
 * 📌 `gocCu` do NƠI GỌI tính (`tinhQuyenTheoDauChucDanh` ở `quyen.ts`) rồi truyền vào — tệp này không
 * được nạp `quyen.ts` (vòng nạp). Dùng qua `quyenRiengConHieuLuc` ở `quyen.ts` cho khỏi quên truyền.
 * Áp ở MỌI chỗ đọc bản ghi phía máy chủ (GET của mình, GET tất cả, bản cũ trong POST) và ở màn Phân
 * quyền khi xem trước lần đổi chức danh — cùng một hàm, không ai tự ghép.
 *
 * 🔴 Bổ sung đặc tả B-F1 (06/10/2026): `gocCu` và `coODeMau` BẮT BUỘC (truyền `null` / `false` tường
 * minh). Tham số tuỳ chọn là quên truyền mà TypeScript không báo — quên `coODeMau` là người chưa có bản
 * ghi bỏ qua mẫu, tức RỘNG hơn mẫu Sếp vừa siết.
 *
 * 📌 Thân hàm đọc ngoại lệ qua `ngoaiLeCuaBanGhi` (một chỗ suy ra cho cả phép tính lưu B-F2 và dấu "khác
 * chức danh"): hiệu lực ô k = `k ∈ ngoaiLe ? ngoaiLe[k] : goc[k]` — đúng từng dòng bảng ở trên.
 */
export function quyenRiengHieuLuc(
  banGhi: Pick<BanGhiQuyenRieng, "quyen" | "theoChucDanh" | "khuon" | "ngoaiLe"> | null | undefined,
  nd: Pick<NguoiDung, "chucNang" | "vaiTro" | "capTM" | "capKho">,
  goc: Quyen,
  gocCu: Quyen | null,
  coODeMau: boolean,
): QuyenRieng | null {
  if (!banGhi) return coODeMau ? rutQuyenRieng(goc) : null;
  const { ngoaiLe } = ngoaiLeCuaBanGhi(banGhi, nd, gocCu);
  const ra: QuyenRieng = {};
  for (const k of KHOA_TICK) {
    ra[k] = Object.prototype.hasOwnProperty.call(ngoaiLe, k) ? ngoaiLe[k] === true : goc[k] === true;
  }
  return ra;
}
