// ============================================================
// DỮ LIỆU MẪU — chỉ dùng khi chưa nối Firebase (isFirebaseConfigured === false)
//
// 🔴 ĐÃ DỌN SẠCH NGÀY 10/08/2026 theo chỉ đạo Ban lãnh đạo: *"xoá toàn bộ các ví dụ
// đang chạy sẵn, để tự thêm 1 đề xuất mới test thử"*. App mở lên là trống trơn, người
// dùng tự đi trọn vòng nghiệp vụ từ đầu.
//
// Bắt đầu thế nào: vào **Đề nghị mua hàng → Nhận đề nghị mới (giả lập)**, lập một đề
// nghị rồi kéo thẻ qua từng cột trên bảng quy trình.
//
// ⚠️ CÒN GIỮ LẠI hai thứ, đừng xóa nhầm:
//   1. `NHA_CUNG_CAP` — danh sách nhà cung cấp để chọn khi lập đơn. Xóa cái này là
//      không lập được đơn hàng nào.
//   2. Ba mảng `ID_*_GIA_LAP` — id dự phòng đã sinh sẵn trang. Xóa là mọi hồ sơ tạo
//      lúc chạy đều ra trang 404 (xem giải thích ngay dưới).
//
// 📌 Muốn dựng lại dữ liệu mẫu cũ: `git show <commit trước 10/08/2026> -- thumua-v1/3-du-lieu/du-lieu-mau.ts`
// ============================================================

import type {
  DeNghiMuaHang,
  DonDatHang,
  GiaDonDatHang,
  NhaCungCap,
  PhieuNhanHang,
  BaoGia,
  CongNo,
} from "@/3-du-lieu/kieu-du-lieu";

/**
 * ID DỰ PHÒNG cho đề nghị lập bằng công cụ giả lập lúc chạy thử.
 *
 * 🔴 Vì sao phải khai trước: bản trên mạng là **hosting tĩnh** — mọi địa chỉ phải được
 * sinh sẵn lúc build. Đề nghị tạo lúc đang chạy mà lấy id tự nghĩ thì bấm vào thẻ sẽ ra
 * trang 404. Khai sẵn 12 id ở đây để `generateStaticParams` sinh sẵn 12 trang trống,
 * lúc chạy thử điền dữ liệu vào là mở được ngay.
 *
 * ⚠️ Khi nối Firestore thật thì BỎ HẲN cả cơ chế này — máy chủ dựng trang theo yêu cầu,
 * không cần biết trước id.
 */
export const ID_DE_NGHI_GIA_LAP: string[] = Array.from(
  { length: 12 },
  (_, i) => `pr-thu-${String(i + 1).padStart(2, "0")}`,
);

/** Như trên, dành cho bảng báo giá tạo bằng thao tác kéo thả trên bảng quy trình. */
export const ID_BAO_GIA_GIA_LAP: string[] = Array.from(
  { length: 12 },
  (_, i) => `rfq-thu-${String(i + 1).padStart(2, "0")}`,
);

/**
 * Như trên, dành cho ĐƠN ĐẶT HÀNG lập lúc đang chạy.
 *
 * 🔴 Thiếu danh sách này là một lỗi thật đã tồn tại: `themDonHang` từng sinh id động
 * kiểu `po-moi-260001-HPCS-001`, mà `generateStaticParams` chỉ sinh trang cho các đơn
 * trong dữ liệu mẫu — nên **bấm vào đơn vừa lập là ra trang 404**. Trước đây lỗi bị
 * che đi vì sau khi lập đơn app quay về danh sách chứ không mở trang chi tiết.
 */
export const ID_DON_HANG_GIA_LAP: string[] = Array.from(
  { length: 20 },
  (_, i) => `po-thu-${String(i + 1).padStart(2, "0")}`,
);

// ------------------------------------------------------------
// NHÀ CUNG CẤP — GIỮ LẠI, cần để chọn khi lập đơn hàng
//
// ⚠️ Tên, địa chỉ, mã số thuế và người liên hệ đều là GIẢ ĐỊNH (quyết định 23). Mã số
//    thuế đặt theo đúng định dạng 10 chữ số của Việt Nam để kiểm được cách hiển thị
//    trên đơn in.
//
// 🐛 SỬA LỖI THẬT 18/08/2026 — BỔ SUNG `maNCC` VÀ `nguoiLienHe`.
//    Hai trường này được thêm vào kiểu `NhaCungCap` khi làm màn lập đơn theo MISA, nhưng
//    KHÔNG bản ghi mẫu nào được điền. Hệ quả: ô "Mã nhà cung cấp" ở
//    `thanh-phan-nghiep-vu/form-lap-don-mua-hang.tsx` tra theo `n.maNCC` nên **không bao
//    giờ tra ra được gì** — gõ đúng mã nào cũng không điền hộ được tên / MST / địa chỉ,
//    và câu trạng thái dưới ô luôn báo "Chưa có trong danh mục". Một ô nhập bày ra mà
//    không làm được việc nó hứa, đúng thứ quy ước dự án mục 3.5 cấm.
//
// ⚠️ `maNCC` KHÁC `id`: `id` là khóa kỹ thuật (đừng đổi, đổi là mồ côi dữ liệu cũ),
//    `maNCC` là mã nghiệp vụ in trên chứng từ. Không bám hệ mã `DMH…` của MISA — mã hồ sơ
//    của công ty theo Thông báo 09/2026/TB-HPCS.
// ------------------------------------------------------------
export const NHA_CUNG_CAP: NhaCungCap[] = [
  { id: "ncc-01", maNCC: "NCC0001", ten: "Công ty TNHH VLXD A", dienThoai: "028 3822 1234", diaChi: "Lô A1, KCN Mỹ Phước 3, TP. Hồ Chí Minh", maSoThue: "0300000001", nguoiLienHe: "Nguyễn Văn A · 090 000 0001" },
  { id: "ncc-02", maNCC: "NCC0002", ten: "Công ty CP Thép B", dienThoai: "028 3899 5678", diaChi: "Số 12 Đường số 5, TP. Hồ Chí Minh", maSoThue: "0300000002", nguoiLienHe: "Trần Thị B · 090 000 0002" },
  { id: "ncc-03", maNCC: "NCC0003", ten: "Công ty TNHH Cát Đá C", dienThoai: "0274 3745 000", diaChi: "Ấp 4, Xã Tân Thành, Tỉnh Bình Dương", maSoThue: "0300000003", nguoiLienHe: "Lê Văn C · 090 000 0003" },
  { id: "ncc-04", maNCC: "NCC0004", ten: "Công ty CP Gạch D", dienThoai: "0251 3888 222", diaChi: "KCN Long Thành, Tỉnh Đồng Nai", maSoThue: "0300000004", nguoiLienHe: "Phạm Thị D · 090 000 0004" },
];

// ------------------------------------------------------------
// CÁC CHỨNG TỪ — ĐỂ TRỐNG, người dùng tự tạo khi chạy thử
// ------------------------------------------------------------

/** Đề nghị mua hàng. Tạo bằng màn "Nhận đề nghị mới (giả lập)". */
export const DE_NGHI_MAU: DeNghiMuaHang[] = [];

/** Đơn đặt hàng. Tạo từ trang chi tiết đề nghị → "Lập đơn đặt hàng". */
export const DON_HANG_MAU: DonDatHang[] = [];

/** Đơn giá của đơn hàng — chứng từ RIÊNG để chặn quyền xem giá (nguyên tắc dữ liệu số 3). */
export const GIA_DON_HANG_MAU: GiaDonDatHang[] = [];

/** Phiếu nhận hàng từng lần giao. Thủ kho ghi ở trang chi tiết đơn hàng. */
export const PHIEU_NHAN_MAU: PhieuNhanHang[] = [];

/** Bảng báo giá. Tạo bằng cách kéo thẻ từ cột ① sang cột ② trên bảng quy trình. */
export const BAO_GIA_MAU: BaoGia[] = [];

/**
 * Công nợ nhà cung cấp.
 *
 * ⚠️ Màn Công nợ hiện đọc thẳng mảng này chứ chưa sinh từ đơn hàng, nên để trống thì
 * màn đó trống theo. Khi nối Firestore sẽ dựng công nợ từ chứng từ thật.
 */
export const CONG_NO_MAU: CongNo[] = [];
