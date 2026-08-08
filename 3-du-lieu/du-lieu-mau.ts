// ============================================================
// DỮ LIỆU MẪU — chỉ dùng khi chưa nối Firebase (isFirebaseConfigured === false)
//
// Dựng đúng tình huống trong lưu đồ của Ban lãnh đạo:
//   1 Đề nghị 10 mặt hàng → tách 4 PO cho 3 nhân viên (TM1, TM2, TM3)
//   PO-001 giao 3 lần · PO-002, PO-003, PO-004 giao 1 lần
//   Còn 1 đề nghị đang phân bổ dở để xem màn hình Phân bổ
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

// ⚠️ Tên, địa chỉ và mã số thuế đều là GIẢ ĐỊNH (quyết định 23). Mã số thuế đặt theo
//    đúng định dạng 10 chữ số của Việt Nam để kiểm được cách hiển thị trên đơn in.
export const NHA_CUNG_CAP: NhaCungCap[] = [
  { id: "ncc-01", ten: "Công ty TNHH VLXD A", dienThoai: "028 3822 1234", diaChi: "Lô A1, KCN Mỹ Phước 3, TP. Hồ Chí Minh", maSoThue: "0300000001" },
  { id: "ncc-02", ten: "Công ty CP Thép B", dienThoai: "028 3899 5678", diaChi: "Số 12 Đường số 5, TP. Hồ Chí Minh", maSoThue: "0300000002" },
  { id: "ncc-03", ten: "Công ty TNHH Cát Đá C", dienThoai: "0274 3745 000", diaChi: "Ấp 4, Xã Tân Thành, Tỉnh Bình Dương", maSoThue: "0300000003" },
  { id: "ncc-04", ten: "Công ty CP Gạch D", dienThoai: "0251 3888 222", diaChi: "KCN Long Thành, Tỉnh Đồng Nai", maSoThue: "0300000004" },
];

// ------------------------------------------------------------
// ĐỀ NGHỊ
// ------------------------------------------------------------

export const DE_NGHI_MAU: DeNghiMuaHang[] = [
  {
    id: "pr-001",
    code: "260001-HPCS-PR-001",
    maDuAn: "260001-HPCS",
    maHopDongCDT: "260001-HPCS-HDXD-001",
    tenCongTrinh: "Nhà xưởng ABC — Giai đoạn 2",
    tieuDe: "Vật tư thi công phần thân đợt 3",
    phongBanNguon: "thi_cong",
    nguoiDeNghiUid: "u-tc",
    nguoiDeNghiTen: "Phạm Văn F",
    ngayDeNghi: "2026-08-01",
    ngayDuyet: "2026-08-03",
    ngayCanHang: "2026-08-20",
    mucDoUuTien: "binh_thuong",
    trangThai: "dang_thuc_hien",
    nguoiTheoDoi: [
      { uid: "u-tc", ten: "Phạm Văn F", chucDanh: "Chỉ huy trưởng công trình", nguoiThemTen: "Phạm Văn F", thoiDiemThem: "2026-08-03" },
      { uid: "u-qlda", ten: "Vũ Văn G", chucDanh: "Ban Quản lý Dự án", nguoiThemTen: "Trần Thị B", thoiDiemThem: "2026-08-04" },
    ],
    items: [
      { stt: 1, tenVatLieu: "Xi măng PCB40", quyCach: "PCB40, bao 50kg", donViTinh: "Bao", khoiLuongDeNghi: 20, nguoiPhuTrachUid: "u-tm1", nguoiPhuTrachTen: "Nguyễn Văn A", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-03" },
      { stt: 2, tenVatLieu: "Thép thanh vằn D10", quyCach: "CB300-V", donViTinh: "Kg", khoiLuongDeNghi: 5000, vatTuKiemSoatDinhMuc: true, nguoiPhuTrachUid: "u-tm1", nguoiPhuTrachTen: "Nguyễn Văn A", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-03" },
      { stt: 3, tenVatLieu: "Thép thanh vằn D16", quyCach: "CB400-V", donViTinh: "Kg", khoiLuongDeNghi: 3200, vatTuKiemSoatDinhMuc: true, nguoiPhuTrachUid: "u-tm1", nguoiPhuTrachTen: "Nguyễn Văn A", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-03" },
      { stt: 4, tenVatLieu: "Cát san lấp", donViTinh: "m³", khoiLuongDeNghi: 200, nguoiPhuTrachUid: "u-tm2", nguoiPhuTrachTen: "Trần Văn C", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-03" },
      { stt: 5, tenVatLieu: "Đá 1x2", donViTinh: "m³", khoiLuongDeNghi: 150, nguoiPhuTrachUid: "u-tm2", nguoiPhuTrachTen: "Trần Văn C", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-03" },
      { stt: 6, tenVatLieu: "Gạch block bê tông", quyCach: "390x190x190", donViTinh: "Viên", khoiLuongDeNghi: 10000, nguoiPhuTrachUid: "u-tm3", nguoiPhuTrachTen: "Lê Thị D", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-03" },
      { stt: 7, tenVatLieu: "Lưới thép hàn D4 a150", donViTinh: "m²", khoiLuongDeNghi: 800, nguoiPhuTrachUid: "u-tm3", nguoiPhuTrachTen: "Lê Thị D", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-03" },
      { stt: 8, tenVatLieu: "Dây kẽm buộc 1mm", donViTinh: "Kg", khoiLuongDeNghi: 120, nguoiPhuTrachUid: "u-tm3", nguoiPhuTrachTen: "Lê Thị D", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-03" },
      { stt: 9, tenVatLieu: "Ván khuôn phủ phim 18mm", quyCach: "1220x2440", donViTinh: "Tấm", khoiLuongDeNghi: 60, nguoiPhuTrachUid: "u-tm3", nguoiPhuTrachTen: "Lê Thị D", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-03" },
      { stt: 10, tenVatLieu: "Cây chống thép đơn 3.0m", donViTinh: "Cây", khoiLuongDeNghi: 180 },
    ],
    lichSu: [
      { thoiDiem: "2026-08-01", nguoiThucHien: "Phạm Văn F", hanhDong: "Tạo đề nghị" },
      { thoiDiem: "2026-08-03", nguoiThucHien: "Ban chỉ huy", hanhDong: "Duyệt đề nghị" },
      { thoiDiem: "2026-08-03", nguoiThucHien: "Trần Thị B", hanhDong: "Phân bổ 9/10 dòng cho TM1, TM2, TM3" },
    ],
  },
  {
    id: "pr-002",
    code: "260001-HPCS-PR-002",
    maDuAn: "260001-HPCS",
    maHopDongCDT: "260001-HPCS-HDXD-001",
    tenCongTrinh: "Nhà xưởng ABC — Giai đoạn 2",
    tieuDe: "Vật tư hoàn thiện nhà điều hành",
    phongBanNguon: "thi_cong",
    nguoiDeNghiUid: "u-tc",
    nguoiDeNghiTen: "Phạm Văn F",
    ngayDeNghi: "2026-08-04",
    ngayDuyet: "2026-08-05",
    ngayCanHang: "2026-08-28",
    mucDoUuTien: "gap",
    trangThai: "da_duyet",
    nguoiTheoDoi: [
      { uid: "u-tc", ten: "Phạm Văn F", chucDanh: "Chỉ huy trưởng công trình", nguoiThemTen: "Phạm Văn F", thoiDiemThem: "2026-08-05" },
    ],
    items: [
      { stt: 1, tenVatLieu: "Sơn nước nội thất", quyCach: "thùng 18L", donViTinh: "Thùng", khoiLuongDeNghi: 24 },
      { stt: 2, tenVatLieu: "Gạch ceramic 600x600", donViTinh: "m²", khoiLuongDeNghi: 320 },
      { stt: 3, tenVatLieu: "Keo dán gạch", quyCach: "bao 25kg", donViTinh: "Bao", khoiLuongDeNghi: 80 },
      { stt: 4, tenVatLieu: "Tấm thạch cao 9mm", donViTinh: "Tấm", khoiLuongDeNghi: 150, nguoiPhuTrachUid: "u-tm2", nguoiPhuTrachTen: "Trần Văn C", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-05" },
      { stt: 5, tenVatLieu: "Khung xương trần chìm", donViTinh: "m²", khoiLuongDeNghi: 150 },
    ],
    lichSu: [
      { thoiDiem: "2026-08-04", nguoiThucHien: "Phạm Văn F", hanhDong: "Tạo đề nghị" },
      { thoiDiem: "2026-08-05", nguoiThucHien: "Ban chỉ huy", hanhDong: "Duyệt đề nghị" },
    ],
  },
  {
    id: "pr-003",
    code: "260002-HPCS-PR-001",
    maDuAn: "260002-HPCS",
    tenCongTrinh: "Khu đô thị Riverside — Block B",
    tieuDe: "Vật tư móng cọc",
    phongBanNguon: "thi_cong",
    nguoiDeNghiUid: "u-tc",
    nguoiDeNghiTen: "Bùi Văn H",
    ngayDeNghi: "2026-07-28",
    ngayDuyet: "2026-07-29",
    ngayCanHang: "2026-08-08",
    mucDoUuTien: "gap",
    trangThai: "dang_thuc_hien",
    nguoiTheoDoi: [
      { uid: "u-tc-02", ten: "Bùi Văn H", chucDanh: "Chỉ huy trưởng công trình", nguoiThemTen: "Bùi Văn H", thoiDiemThem: "2026-07-29" },
      { uid: "u-qlda", ten: "Vũ Văn G", chucDanh: "Ban Quản lý Dự án", nguoiThemTen: "Trần Thị B", thoiDiemThem: "2026-07-30" },
    ],
    items: [
      { stt: 1, tenVatLieu: "Bê tông thương phẩm M300", donViTinh: "m³", khoiLuongDeNghi: 450, vatTuKiemSoatDinhMuc: true, nguoiPhuTrachUid: "u-tm1", nguoiPhuTrachTen: "Nguyễn Văn A", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-07-29" },
      { stt: 2, tenVatLieu: "Cọc bê tông ly tâm D300", donViTinh: "m", khoiLuongDeNghi: 1200, nguoiPhuTrachUid: "u-tm2", nguoiPhuTrachTen: "Trần Văn C", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-07-29" },
    ],
    lichSu: [
      { thoiDiem: "2026-07-28", nguoiThucHien: "Bùi Văn H", hanhDong: "Tạo đề nghị" },
      { thoiDiem: "2026-07-29", nguoiThucHien: "Ban chỉ huy", hanhDong: "Duyệt đề nghị" },
    ],
  },

  // ----------------------------------------------------------------
  // Sáu đề nghị dưới đây dựng cho BẢNG QUY TRÌNH 8 CỘT (dạng Kanban).
  // Mỗi cái nằm ở một giai đoạn khác nhau để bảng có đủ cột có dữ liệu —
  // bảng mà 5/8 cột trống thì không kiểm chứng được gì.
  // Giai đoạn KHÔNG lưu trong dữ liệu, mà suy ra từ báo giá / đơn hàng /
  // phiếu nhận — xem 2-quy-trinh/giai-doan-mua-hang.ts
  // ----------------------------------------------------------------

  // → Cột ② Yêu cầu NCC báo giá (có báo giá đang thu thập, chưa lên đơn)
  {
    id: "pr-004",
    code: "260002-HPCS-PR-002",
    maDuAn: "260002-HPCS",
    tenCongTrinh: "Khu đô thị Riverside — Block B",
    tieuDe: "Vật tư điện nước tầng hầm",
    phongBanNguon: "thi_cong",
    nguoiDeNghiUid: "u-tc",
    nguoiDeNghiTen: "Bùi Văn H",
    ngayDeNghi: "2026-08-02",
    ngayDuyet: "2026-08-03",
    ngayCanHang: "2026-08-18",
    mucDoUuTien: "binh_thuong",
    trangThai: "da_phan_bo_du",
    nguoiTheoDoi: [
      { uid: "u-tc-02", ten: "Bùi Văn H", chucDanh: "Chỉ huy trưởng công trình", nguoiThemTen: "Bùi Văn H", thoiDiemThem: "2026-08-03" },
    ],
    items: [
      { stt: 1, tenVatLieu: "Ống nhựa uPVC D90", quyCach: "class 2, cây 4m", donViTinh: "Cây", khoiLuongDeNghi: 240, nguoiPhuTrachUid: "u-tm2", nguoiPhuTrachTen: "Trần Văn C", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-03" },
      { stt: 2, tenVatLieu: "Dây điện đơn Cu/PVC 2.5mm²", donViTinh: "m", khoiLuongDeNghi: 3000, nguoiPhuTrachUid: "u-tm2", nguoiPhuTrachTen: "Trần Văn C", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-03" },
      { stt: 3, tenVatLieu: "Máng cáp sơn tĩnh điện 200x100", donViTinh: "m", khoiLuongDeNghi: 180, nguoiPhuTrachUid: "u-tm2", nguoiPhuTrachTen: "Trần Văn C", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-03" },
    ],
    lichSu: [
      { thoiDiem: "2026-08-02", nguoiThucHien: "Bùi Văn H", hanhDong: "Tạo đề nghị" },
      { thoiDiem: "2026-08-03", nguoiThucHien: "Ban chỉ huy", hanhDong: "Duyệt đề nghị" },
      { thoiDiem: "2026-08-03", nguoiThucHien: "Trần Thị B", hanhDong: "Phân bổ 3/3 dòng cho TM2" },
      { thoiDiem: "2026-08-04", nguoiThucHien: "Trần Văn C", hanhDong: "Gửi yêu cầu báo giá tới 3 nhà cung cấp" },
    ],
  },

  // → Cột ③ Xét duyệt báo giá (báo giá đã so sánh, chờ chốt NCC) — ĐANG QUÁ HẠN
  {
    id: "pr-005",
    code: "260003-HPCS-PR-001",
    maDuAn: "260003-HPCS",
    maHopDongCDT: "260003-HPCS-HDXD-001",
    tenCongTrinh: "Trường Tiểu học Tân Phú — Khối lớp học",
    tieuDe: "Vật tư phần thô khối lớp học",
    phongBanNguon: "thi_cong",
    nguoiDeNghiUid: "u-tc",
    nguoiDeNghiTen: "Phạm Văn F",
    ngayDeNghi: "2026-07-25",
    ngayDuyet: "2026-07-27",
    ngayCanHang: "2026-08-04",
    mucDoUuTien: "gap",
    trangThai: "da_phan_bo_du",
    nguoiTheoDoi: [
      { uid: "u-tc", ten: "Phạm Văn F", chucDanh: "Chỉ huy trưởng công trình", nguoiThemTen: "Phạm Văn F", thoiDiemThem: "2026-07-27" },
      { uid: "u-qlda", ten: "Vũ Văn G", chucDanh: "Ban Quản lý Dự án", nguoiThemTen: "Trần Thị B", thoiDiemThem: "2026-07-28" },
    ],
    items: [
      { stt: 1, tenVatLieu: "Xi măng PCB40", quyCach: "bao 50kg", donViTinh: "Bao", khoiLuongDeNghi: 600, nguoiPhuTrachUid: "u-tm1", nguoiPhuTrachTen: "Nguyễn Văn A", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-07-27" },
      { stt: 2, tenVatLieu: "Thép thanh vằn D12", quyCach: "CB400-V", donViTinh: "Kg", khoiLuongDeNghi: 8500, vatTuKiemSoatDinhMuc: true, nguoiPhuTrachUid: "u-tm1", nguoiPhuTrachTen: "Nguyễn Văn A", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-07-27" },
      { stt: 3, tenVatLieu: "Gạch ống 8x8x18", donViTinh: "Viên", khoiLuongDeNghi: 45000, nguoiPhuTrachUid: "u-tm1", nguoiPhuTrachTen: "Nguyễn Văn A", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-07-27" },
    ],
    lichSu: [
      { thoiDiem: "2026-07-25", nguoiThucHien: "Phạm Văn F", hanhDong: "Tạo đề nghị" },
      { thoiDiem: "2026-07-27", nguoiThucHien: "Ban chỉ huy", hanhDong: "Duyệt đề nghị" },
      { thoiDiem: "2026-07-27", nguoiThucHien: "Trần Thị B", hanhDong: "Phân bổ 3/3 dòng cho TM1" },
      { thoiDiem: "2026-08-01", nguoiThucHien: "Nguyễn Văn A", hanhDong: "Nhận đủ báo giá 3 NCC, lập bảng so sánh" },
    ],
  },

  // → Cột ④ Lập đơn mua hàng (đã chốt NCC, chưa lên đơn đặt hàng)
  {
    id: "pr-006",
    code: "260001-HPCS-PR-003",
    maDuAn: "260001-HPCS",
    maHopDongCDT: "260001-HPCS-HDXD-001",
    tenCongTrinh: "Nhà xưởng ABC — Giai đoạn 2",
    tieuDe: "Vật tư cơ điện nhà điều hành",
    phongBanNguon: "thi_cong",
    nguoiDeNghiUid: "u-tc",
    nguoiDeNghiTen: "Phạm Văn F",
    ngayDeNghi: "2026-07-30",
    ngayDuyet: "2026-08-01",
    ngayCanHang: "2026-08-15",
    mucDoUuTien: "binh_thuong",
    trangThai: "da_phan_bo_du",
    items: [
      { stt: 1, tenVatLieu: "Tủ điện phân phối 3 pha", quyCach: "600x800x250", donViTinh: "Bộ", khoiLuongDeNghi: 4, nguoiPhuTrachUid: "u-tm3", nguoiPhuTrachTen: "Lê Thị D", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-01" },
      { stt: 2, tenVatLieu: "Cáp điện Cu/XLPE/PVC 4x25mm²", donViTinh: "m", khoiLuongDeNghi: 320, nguoiPhuTrachUid: "u-tm3", nguoiPhuTrachTen: "Lê Thị D", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-01" },
    ],
    lichSu: [
      { thoiDiem: "2026-07-30", nguoiThucHien: "Phạm Văn F", hanhDong: "Tạo đề nghị" },
      { thoiDiem: "2026-08-01", nguoiThucHien: "Ban chỉ huy", hanhDong: "Duyệt đề nghị" },
      { thoiDiem: "2026-08-01", nguoiThucHien: "Trần Thị B", hanhDong: "Phân bổ 2/2 dòng cho TM3" },
      { thoiDiem: "2026-08-05", nguoiThucHien: "Lê Thị D", hanhDong: "Chốt nhà cung cấp Công ty CP Thép B theo bảng so sánh" },
    ],
  },

  // → Cột ⑤ Tiến hành đặt hàng (đơn đã chốt, chưa có hàng về)
  {
    id: "pr-007",
    code: "260003-HPCS-PR-002",
    maDuAn: "260003-HPCS",
    maHopDongCDT: "260003-HPCS-HDXD-001",
    tenCongTrinh: "Trường Tiểu học Tân Phú — Khối lớp học",
    tieuDe: "Vật tư hoàn thiện mặt dựng",
    phongBanNguon: "thi_cong",
    nguoiDeNghiUid: "u-tc",
    nguoiDeNghiTen: "Phạm Văn F",
    ngayDeNghi: "2026-08-01",
    ngayDuyet: "2026-08-02",
    ngayCanHang: "2026-08-25",
    mucDoUuTien: "binh_thuong",
    trangThai: "dang_thuc_hien",
    nguoiTheoDoi: [
      { uid: "u-tc", ten: "Phạm Văn F", chucDanh: "Chỉ huy trưởng công trình", nguoiThemTen: "Phạm Văn F", thoiDiemThem: "2026-08-02" },
    ],
    items: [
      { stt: 1, tenVatLieu: "Gạch ceramic 300x600 ốp tường", donViTinh: "m²", khoiLuongDeNghi: 540, nguoiPhuTrachUid: "u-tm2", nguoiPhuTrachTen: "Trần Văn C", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-02" },
      { stt: 2, tenVatLieu: "Sơn nước ngoại thất", quyCach: "thùng 18L", donViTinh: "Thùng", khoiLuongDeNghi: 36, nguoiPhuTrachUid: "u-tm2", nguoiPhuTrachTen: "Trần Văn C", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-08-02" },
    ],
    lichSu: [
      { thoiDiem: "2026-08-01", nguoiThucHien: "Phạm Văn F", hanhDong: "Tạo đề nghị" },
      { thoiDiem: "2026-08-02", nguoiThucHien: "Ban chỉ huy", hanhDong: "Duyệt đề nghị" },
      { thoiDiem: "2026-08-02", nguoiThucHien: "Trần Thị B", hanhDong: "Phân bổ 2/2 dòng cho TM2" },
      { thoiDiem: "2026-08-05", nguoiThucHien: "Trần Văn C", hanhDong: "Chốt đơn đặt hàng 260003-HPCS-PO-001" },
    ],
  },

  // → Cột ⑦ Hoàn thành (đủ 3 lớp xác nhận theo quyết định số 6 của Ban lãnh đạo)
  {
    id: "pr-008",
    code: "260002-HPCS-PR-003",
    maDuAn: "260002-HPCS",
    tenCongTrinh: "Khu đô thị Riverside — Block B",
    tieuDe: "Vật tư san nền đợt 1",
    phongBanNguon: "thi_cong",
    nguoiDeNghiUid: "u-tc",
    nguoiDeNghiTen: "Bùi Văn H",
    ngayDeNghi: "2026-07-10",
    ngayDuyet: "2026-07-11",
    ngayCanHang: "2026-07-25",
    mucDoUuTien: "binh_thuong",
    trangThai: "hoan_thanh",
    items: [
      { stt: 1, tenVatLieu: "Cát san lấp", donViTinh: "m³", khoiLuongDeNghi: 800, nguoiPhuTrachUid: "u-tm1", nguoiPhuTrachTen: "Nguyễn Văn A", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-07-11" },
      { stt: 2, tenVatLieu: "Đá mi bụi", donViTinh: "m³", khoiLuongDeNghi: 260, nguoiPhuTrachUid: "u-tm1", nguoiPhuTrachTen: "Nguyễn Văn A", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-07-11" },
    ],
    lichSu: [
      { thoiDiem: "2026-07-10", nguoiThucHien: "Bùi Văn H", hanhDong: "Tạo đề nghị" },
      { thoiDiem: "2026-07-11", nguoiThucHien: "Ban chỉ huy", hanhDong: "Duyệt đề nghị" },
      { thoiDiem: "2026-07-11", nguoiThucHien: "Trần Thị B", hanhDong: "Phân bổ 2/2 dòng cho TM1" },
      { thoiDiem: "2026-07-22", nguoiThucHien: "Hoàng Văn E", hanhDong: "Xác nhận đã nhận đủ" },
      { thoiDiem: "2026-07-23", nguoiThucHien: "Trần Thị B", hanhDong: "Xác nhận hoàn thành, chuyển hồ sơ Kế toán" },
    ],
  },

  // → Cột ⑧ Thất bại (đóng dở — không mua tiếp)
  {
    id: "pr-009",
    code: "260001-HPCS-PR-004",
    maDuAn: "260001-HPCS",
    maHopDongCDT: "260001-HPCS-HDXD-001",
    tenCongTrinh: "Nhà xưởng ABC — Giai đoạn 2",
    tieuDe: "Vật tư chống thấm tầng mái",
    phongBanNguon: "thi_cong",
    nguoiDeNghiUid: "u-tc",
    nguoiDeNghiTen: "Phạm Văn F",
    ngayDeNghi: "2026-07-20",
    ngayDuyet: "2026-07-21",
    ngayCanHang: "2026-08-14",
    mucDoUuTien: "binh_thuong",
    trangThai: "dong_do",
    items: [
      { stt: 1, tenVatLieu: "Màng chống thấm khò nóng 3mm", donViTinh: "m²", khoiLuongDeNghi: 900, nguoiPhuTrachUid: "u-tm3", nguoiPhuTrachTen: "Lê Thị D", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-07-21" },
      { stt: 2, tenVatLieu: "Sơn lót gốc bitum", quyCach: "thùng 18L", donViTinh: "Thùng", khoiLuongDeNghi: 30, nguoiPhuTrachUid: "u-tm3", nguoiPhuTrachTen: "Lê Thị D", nguoiPhanBoTen: "Trần Thị B", thoiDiemPhanBo: "2026-07-21" },
    ],
    lichSu: [
      { thoiDiem: "2026-07-20", nguoiThucHien: "Phạm Văn F", hanhDong: "Tạo đề nghị" },
      { thoiDiem: "2026-07-21", nguoiThucHien: "Ban chỉ huy", hanhDong: "Duyệt đề nghị" },
      { thoiDiem: "2026-08-04", nguoiThucHien: "Ban chỉ huy", hanhDong: "Đóng dở đề nghị", ghiChu: "Đổi biện pháp thi công chống thấm, không mua vật tư này nữa" },
    ],
  },
];

// ------------------------------------------------------------
// ĐƠN ĐẶT HÀNG — không chứa giá
// ------------------------------------------------------------

export const DON_HANG_MAU: DonDatHang[] = [
  {
    id: "po-001",
    code: "260001-HPCS-PO-001",
    maDuAn: "260001-HPCS",
    maHopDongCDT: "260001-HPCS-HDXD-001",
    prId: "pr-001",
    prCode: "260001-HPCS-PR-001",
    supplierId: "ncc-01",
    supplierTen: "Công ty TNHH VLXD A",
    nguoiPhuTrachUid: "u-tm1",
    nguoiPhuTrachTen: "Nguyễn Văn A",
    ngayLapPO: "2026-08-04",
    ngayGiaoDuKien: "2026-08-12",
    dieuKienGiaoHang: "Giao tại chân công trình, 3 đợt",
    diaDiemGiaoHang: "Công trình Nhà xưởng ABC — KCN Mỹ Phước 3, TP. Hồ Chí Minh",
    nguoiNhanHangTen: "Hoàng Văn E",
    dieuKhoanKhac: "Hàng có chứng chỉ chất lượng (CO/CQ) kèm theo từng đợt giao. Bốc xếp do nhà cung cấp.",
    trangThai: "dang_giao",
    items: [
      {
        sttDong: 1,
        sttDongDeNghi: 1,
        maHang: "VT00027",
        tenVatLieu: "Xi măng PCB40",
        thongSoKyThuat: "PCB40, bao 50kg, TCVN 6260:2020",
        donViTinh: "Bao",
        khoiLuongDat: 20,
        mucDichSuDung: "Đổ bê tông móng trục 1-4",
      },
    ],
  },
  {
    id: "po-002",
    code: "260001-HPCS-PO-002",
    maDuAn: "260001-HPCS",
    maHopDongCDT: "260001-HPCS-HDXD-001",
    prId: "pr-001",
    prCode: "260001-HPCS-PR-001",
    supplierId: "ncc-02",
    supplierTen: "Công ty CP Thép B",
    nguoiPhuTrachUid: "u-tm1",
    nguoiPhuTrachTen: "Nguyễn Văn A",
    ngayLapPO: "2026-08-04",
    ngayGiaoDuKien: "2026-08-18",
    diaDiemGiaoHang: "Công trình Nhà xưởng ABC — KCN Mỹ Phước 3, TP. Hồ Chí Minh",
    nguoiNhanHangTen: "Hoàng Văn E",
    trangThai: "dang_giao",
    items: [
      {
        sttDong: 1,
        sttDongDeNghi: 2,
        maHang: "VT00105",
        tenVatLieu: "Thép thanh vằn D10",
        thongSoKyThuat: "CB400-V, cây 11,7m, TCVN 1651-2:2018",
        donViTinh: "Kg",
        khoiLuongDat: 5000,
        mucDichSuDung: "Cốt thép móng và đà kiềng",
      },
      {
        sttDong: 2,
        sttDongDeNghi: 3,
        maHang: "VT00106",
        tenVatLieu: "Thép thanh vằn D16",
        thongSoKyThuat: "CB400-V, cây 11,7m, TCVN 1651-2:2018",
        donViTinh: "Kg",
        khoiLuongDat: 3200,
        mucDichSuDung: "Cốt thép cột trục 1-4",
      },
    ],
  },
  {
    id: "po-003",
    code: "260001-HPCS-PO-003",
    maDuAn: "260001-HPCS",
    prId: "pr-001",
    prCode: "260001-HPCS-PR-001",
    supplierId: "ncc-03",
    supplierTen: "Công ty TNHH Cát Đá C",
    nguoiPhuTrachUid: "u-tm2",
    nguoiPhuTrachTen: "Trần Văn C",
    ngayLapPO: "2026-08-05",
    ngayGiaoDuKien: "2026-08-22",
    trangThai: "da_chot",
    items: [
      { sttDong: 1, sttDongDeNghi: 4, tenVatLieu: "Cát san lấp", donViTinh: "m³", khoiLuongDat: 200 },
      { sttDong: 2, sttDongDeNghi: 5, tenVatLieu: "Đá 1x2", donViTinh: "m³", khoiLuongDat: 150 },
    ],
  },
  {
    id: "po-004",
    code: "260001-HPCS-PO-004",
    maDuAn: "260001-HPCS",
    prId: "pr-001",
    prCode: "260001-HPCS-PR-001",
    supplierId: "ncc-04",
    supplierTen: "Công ty CP Gạch D",
    nguoiPhuTrachUid: "u-tm3",
    nguoiPhuTrachTen: "Lê Thị D",
    ngayLapPO: "2026-08-05",
    ngayGiaoDuKien: "2026-08-15",
    trangThai: "dang_giao",
    items: [
      { sttDong: 1, sttDongDeNghi: 6, tenVatLieu: "Gạch block bê tông", donViTinh: "Viên", khoiLuongDat: 10000 },
      { sttDong: 2, sttDongDeNghi: 7, tenVatLieu: "Lưới thép hàn D4 a150", donViTinh: "m²", khoiLuongDat: 800 },
      { sttDong: 3, sttDongDeNghi: 8, tenVatLieu: "Dây kẽm buộc 1mm", donViTinh: "Kg", khoiLuongDat: 120 },
    ],
  },
  {
    id: "po-005",
    code: "260002-HPCS-PO-001",
    maDuAn: "260002-HPCS",
    prId: "pr-003",
    prCode: "260002-HPCS-PR-001",
    supplierId: "ncc-01",
    supplierTen: "Công ty TNHH VLXD A",
    nguoiPhuTrachUid: "u-tm1",
    nguoiPhuTrachTen: "Nguyễn Văn A",
    ngayLapPO: "2026-07-30",
    ngayGiaoDuKien: "2026-08-04",
    trangThai: "dang_giao",
    items: [{ sttDong: 1, sttDongDeNghi: 1, tenVatLieu: "Bê tông thương phẩm M300", donViTinh: "m³", khoiLuongDat: 450 }],
  },
  {
    id: "po-006",
    code: "260002-HPCS-PO-002",
    maDuAn: "260002-HPCS",
    prId: "pr-003",
    prCode: "260002-HPCS-PR-001",
    supplierId: "ncc-03",
    supplierTen: "Công ty TNHH Cát Đá C",
    nguoiPhuTrachUid: "u-tm2",
    nguoiPhuTrachTen: "Trần Văn C",
    ngayLapPO: "2026-07-30",
    ngayGiaoDuKien: "2026-08-02",
    trangThai: "cho_xac_nhan_hoan_thanh",
    items: [{ sttDong: 1, sttDongDeNghi: 2, tenVatLieu: "Cọc bê tông ly tâm D300", donViTinh: "m", khoiLuongDat: 1200 }],
    xacNhanKho: { uid: "u-kho", ten: "Hoàng Văn E", thoiDiem: "2026-08-02" },
  },
  // Đơn của pr-007 — đã chốt, chưa có phiếu nhận nào → cột "Tiến hành đặt hàng"
  {
    id: "po-007",
    code: "260003-HPCS-PO-001",
    maDuAn: "260003-HPCS",
    maHopDongCDT: "260003-HPCS-HDXD-001",
    prId: "pr-007",
    prCode: "260003-HPCS-PR-002",
    supplierId: "ncc-04",
    supplierTen: "Công ty CP Gạch D",
    nguoiPhuTrachUid: "u-tm2",
    nguoiPhuTrachTen: "Trần Văn C",
    ngayLapPO: "2026-08-05",
    ngayGiaoDuKien: "2026-08-20",
    dieuKienGiaoHang: "Giao tại chân công trình, bốc xếp do NCC",
    trangThai: "da_chot",
    items: [
      { sttDong: 1, sttDongDeNghi: 1, tenVatLieu: "Gạch ceramic 300x600 ốp tường", donViTinh: "m²", khoiLuongDat: 540 },
      { sttDong: 2, sttDongDeNghi: 2, tenVatLieu: "Sơn nước ngoại thất", donViTinh: "Thùng", khoiLuongDat: 36 },
    ],
  },
  // Đơn của pr-008 — đã giao đủ + kho + trưởng BP đã xác nhận → cột "Hoàn thành"
  {
    id: "po-008",
    code: "260002-HPCS-PO-003",
    maDuAn: "260002-HPCS",
    prId: "pr-008",
    prCode: "260002-HPCS-PR-003",
    supplierId: "ncc-03",
    supplierTen: "Công ty TNHH Cát Đá C",
    nguoiPhuTrachUid: "u-tm1",
    nguoiPhuTrachTen: "Nguyễn Văn A",
    ngayLapPO: "2026-07-12",
    ngayGiaoDuKien: "2026-07-22",
    trangThai: "hoan_thanh",
    items: [
      { sttDong: 1, sttDongDeNghi: 1, tenVatLieu: "Cát san lấp", donViTinh: "m³", khoiLuongDat: 800 },
      { sttDong: 2, sttDongDeNghi: 2, tenVatLieu: "Đá mi bụi", donViTinh: "m³", khoiLuongDat: 260 },
    ],
    xacNhanKho: { uid: "u-kho", ten: "Hoàng Văn E", thoiDiem: "2026-07-22" },
    xacNhanTruongBP: { uid: "u-tbp", ten: "Trần Thị B", thoiDiem: "2026-07-23" },
  },
];

// ------------------------------------------------------------
// GIÁ — collection riêng tm_donhang_gia, quyền đọc hẹp
// ------------------------------------------------------------

export const GIA_DON_HANG_MAU: GiaDonDatHang[] = [
  // po-001 khai đủ khối tổng của biểu mẫu (CK + thuế + điều khoản) để kiểm trang in.
  {
    poId: "po-001",
    poCode: "260001-HPCS-PO-001",
    maDuAn: "260001-HPCS",
    lines: [{ sttDong: 1, donGia: 92_000 }],
    loaiTien: "VND",
    chietKhau: 40_000,
    thueSuatGTGT: 8,
    dieuKhoanThanhToan: "Thanh toán 100% trong 30 ngày kể từ ngày nhận đủ hàng và hóa đơn hợp lệ.",
  },
  {
    poId: "po-002",
    poCode: "260001-HPCS-PO-002",
    maDuAn: "260001-HPCS",
    lines: [{ sttDong: 1, donGia: 16_800 }, { sttDong: 2, donGia: 16_500 }],
    loaiTien: "VND",
    thueSuatGTGT: 10,
    dieuKhoanThanhToan: "Tạm ứng 30% khi ký đơn, thanh toán phần còn lại sau khi nhận đủ hàng.",
  },
  { poId: "po-003", poCode: "260001-HPCS-PO-003", maDuAn: "260001-HPCS", lines: [{ sttDong: 1, donGia: 185_000 }, { sttDong: 2, donGia: 420_000 }] },
  { poId: "po-004", poCode: "260001-HPCS-PO-004", maDuAn: "260001-HPCS", lines: [{ sttDong: 1, donGia: 3_200 }, { sttDong: 2, donGia: 68_000 }, { sttDong: 3, donGia: 32_000 }] },
  { poId: "po-005", poCode: "260002-HPCS-PO-001", maDuAn: "260002-HPCS", lines: [{ sttDong: 1, donGia: 1_320_000 }] },
  { poId: "po-006", poCode: "260002-HPCS-PO-002", maDuAn: "260002-HPCS", lines: [{ sttDong: 1, donGia: 315_000 }] },
  { poId: "po-007", poCode: "260003-HPCS-PO-001", maDuAn: "260003-HPCS", lines: [{ sttDong: 1, donGia: 168_000 }, { sttDong: 2, donGia: 1_450_000 }] },
  { poId: "po-008", poCode: "260002-HPCS-PO-003", maDuAn: "260002-HPCS", lines: [{ sttDong: 1, donGia: 185_000 }, { sttDong: 2, donGia: 240_000 }] },
];

// ------------------------------------------------------------
// PHIẾU NHẬN HÀNG — mỗi lần giao một phiếu, thủ kho lập
// ------------------------------------------------------------

export const PHIEU_NHAN_MAU: PhieuNhanHang[] = [
  // PO-001 xi măng 20 bao — giao 3 lần: 10 + 5 (đã nhập kho) + 5 (đang chờ kiểm tra)
  {
    id: "grn-001",
    code: "260001-HPCS-PO-001-DO01",
    poId: "po-001",
    poCode: "260001-HPCS-PO-001",
    lanGiaoThu: 1,
    ngayNhanThucTe: "2026-08-06",
    nguoiNhanUid: "u-kho",
    nguoiNhanTen: "Hoàng Văn E",
    soPhieuGiaoNCC: "HT-2026-08-0412",
    trangThai: "da_nhap_kho",
    lines: [{ sttDongPO: 1, khoiLuongThucNhan: 10 }],
  },
  {
    id: "grn-002",
    code: "260001-HPCS-PO-001-DO02",
    poId: "po-001",
    poCode: "260001-HPCS-PO-001",
    lanGiaoThu: 2,
    ngayNhanThucTe: "2026-08-09",
    nguoiNhanUid: "u-kho",
    nguoiNhanTen: "Hoàng Văn E",
    soPhieuGiaoNCC: "HT-2026-08-0518",
    trangThai: "da_nhap_kho",
    lines: [{ sttDongPO: 1, khoiLuongThucNhan: 5 }],
  },
  {
    id: "grn-003",
    code: "260001-HPCS-PO-001-DO03",
    poId: "po-001",
    poCode: "260001-HPCS-PO-001",
    lanGiaoThu: 3,
    ngayNhanThucTe: "2026-08-11",
    nguoiNhanUid: "u-kho",
    nguoiNhanTen: "Hoàng Văn E",
    soPhieuGiaoNCC: "HT-2026-08-0611",
    trangThai: "cho_kiem_tra",
    ghiChuTinhTrangHang: "Bao bì một số bao bị ẩm — đang chờ kiểm tra chất lượng",
    lines: [{ sttDongPO: 1, khoiLuongThucNhan: 5 }],
  },
  // PO-002 thép — giao 1 lần, D10 đủ, D16 mới một phần
  {
    id: "grn-004",
    code: "260001-HPCS-PO-002-DO01",
    poId: "po-002",
    poCode: "260001-HPCS-PO-002",
    lanGiaoThu: 1,
    ngayNhanThucTe: "2026-08-07",
    nguoiNhanUid: "u-kho",
    nguoiNhanTen: "Hoàng Văn E",
    soPhieuGiaoNCC: "HP-88231",
    trangThai: "da_nhap_kho",
    lines: [
      { sttDongPO: 1, khoiLuongThucNhan: 5000 },
      { sttDongPO: 2, khoiLuongThucNhan: 1500 },
    ],
  },
  // PO-004 gạch — giao 1 lần, có hàng bị từ chối
  {
    id: "grn-005",
    code: "260001-HPCS-PO-004-DO01",
    poId: "po-004",
    poCode: "260001-HPCS-PO-004",
    lanGiaoThu: 1,
    ngayNhanThucTe: "2026-08-08",
    nguoiNhanUid: "u-kho",
    nguoiNhanTen: "Hoàng Văn E",
    soPhieuGiaoNCC: "AP-2026-1180",
    trangThai: "da_nhap_kho",
    ghiChuTinhTrangHang: "Trả lại 400 viên nứt góc",
    lines: [
      { sttDongPO: 1, khoiLuongThucNhan: 4000, khoiLuongTuChoi: 400, lyDoTuChoi: "Nứt góc, không đạt" },
      { sttDongPO: 3, khoiLuongThucNhan: 120 },
    ],
  },
  // PO-005 bê tông — quá hạn giao, mới nhận một phần
  {
    id: "grn-006",
    code: "260002-HPCS-PO-001-DO01",
    poId: "po-005",
    poCode: "260002-HPCS-PO-001",
    lanGiaoThu: 1,
    ngayNhanThucTe: "2026-08-02",
    nguoiNhanUid: "u-kho",
    nguoiNhanTen: "Hoàng Văn E",
    trangThai: "da_nhap_kho",
    lines: [{ sttDongPO: 1, khoiLuongThucNhan: 180 }],
  },
  // PO-006 cọc — đã giao đủ, kho đã xác nhận, chờ trưởng BP
  {
    id: "grn-007",
    code: "260002-HPCS-PO-002-DO01",
    poId: "po-006",
    poCode: "260002-HPCS-PO-002",
    lanGiaoThu: 1,
    ngayNhanThucTe: "2026-08-01",
    nguoiNhanUid: "u-kho",
    nguoiNhanTen: "Hoàng Văn E",
    trangThai: "da_nhap_kho",
    lines: [{ sttDongPO: 1, khoiLuongThucNhan: 1200 }],
  },
  // PO-008 cát đá — giao đủ 1 lần, đã chốt xong cả hồ sơ
  {
    id: "grn-008",
    code: "260002-HPCS-PO-003-DO01",
    poId: "po-008",
    poCode: "260002-HPCS-PO-003",
    lanGiaoThu: 1,
    ngayNhanThucTe: "2026-07-21",
    nguoiNhanUid: "u-kho",
    nguoiNhanTen: "Hoàng Văn E",
    soPhieuGiaoNCC: "BDX-2026-0712",
    trangThai: "da_nhap_kho",
    lines: [
      { sttDongPO: 1, khoiLuongThucNhan: 800 },
      { sttDongPO: 2, khoiLuongThucNhan: 260 },
    ],
  },
];

// ------------------------------------------------------------
// BÁO GIÁ — so sánh giá từ nhiều NCC
// ------------------------------------------------------------

export const BAO_GIA_MAU: BaoGia[] = [
  {
    id: "rfq-001",
    code: "260001-HPCS-BG-001",
    prId: "pr-001",
    prCode: "260001-HPCS-PR-001",
    tieuDe: "Báo giá xi măng PCB40 — Nhà xưởng ABC GĐ2",
    trangThai: "da_chon_ncc",
    hanNop: "2026-08-03",
    items: [
      {
        id: "bg-i1",
        tenVatLieu: "Xi măng PCB40",
        donViTinh: "Bao",
        khoiLuong: 20,
        baoGiaNCC: [
          { nccId: "ncc-01", tenNCC: "Công ty TNHH VLXD A", donGia: 92_000, thoiGianGiao: 3 },
          { nccId: "ncc-05", tenNCC: "Công ty CP Xi Măng E", donGia: 95_000, thoiGianGiao: 5 },
          { nccId: "ncc-06", tenNCC: "Công ty TNHH Xi Măng F", donGia: 89_500, thoiGianGiao: 7 },
        ],
      },
    ],
    nccDaChonId: "ncc-01",
    nccDaChonTen: "Công ty TNHH VLXD A",
    ngayTao: "2026-08-02",
    ngayCapNhat: "2026-08-03",
  },
  {
    id: "rfq-002",
    code: "260001-HPCS-BG-002",
    prId: "pr-001",
    prCode: "260001-HPCS-PR-001",
    tieuDe: "Báo giá thép thanh vằn D10, D16 — Nhà xưởng ABC GĐ2",
    trangThai: "da_so_sanh",
    hanNop: "2026-08-05",
    items: [
      {
        id: "bg-i2",
        tenVatLieu: "Thép thanh vằn D10",
        donViTinh: "Kg",
        khoiLuong: 5000,
        baoGiaNCC: [
          { nccId: "ncc-02", tenNCC: "Công ty CP Thép B", donGia: 16_800, thoiGianGiao: 4 },
          { nccId: "ncc-07", tenNCC: "Công ty CP Thép G", donGia: 16_600, thoiGianGiao: 3 },
        ],
      },
      {
        id: "bg-i3",
        tenVatLieu: "Thép thanh vằn D16",
        donViTinh: "Kg",
        khoiLuong: 3200,
        baoGiaNCC: [
          { nccId: "ncc-02", tenNCC: "Công ty CP Thép B", donGia: 16_500, thoiGianGiao: 4 },
          { nccId: "ncc-07", tenNCC: "Công ty CP Thép G", donGia: 16_200, thoiGianGiao: 3 },
        ],
      },
    ],
    ngayTao: "2026-08-03",
    ngayCapNhat: "2026-08-04",
  },
  {
    id: "rfq-003",
    code: "260001-HPCS-BG-003",
    prId: "pr-001",
    prCode: "260001-HPCS-PR-001",
    tieuDe: "Báo giá cát đá — Nhà xưởng ABC GĐ2",
    trangThai: "dang_thu_thap",
    hanNop: "2026-08-08",
    items: [
      {
        id: "bg-i4",
        tenVatLieu: "Cát san lấp",
        donViTinh: "m³",
        khoiLuong: 200,
        baoGiaNCC: [
          { nccId: "ncc-03", tenNCC: "Công ty TNHH Cát Đá C", donGia: 185_000, thoiGianGiao: 2 },
        ],
      },
      {
        id: "bg-i5",
        tenVatLieu: "Đá 1x2",
        donViTinh: "m³",
        khoiLuong: 150,
        baoGiaNCC: [
          { nccId: "ncc-03", tenNCC: "Công ty TNHH Cát Đá C", donGia: 420_000, thoiGianGiao: 2 },
        ],
      },
    ],
    ngayTao: "2026-08-04",
    ngayCapNhat: "2026-08-04",
  },

  // ----------------------------------------------------------------
  // Ba bảng dưới đây là thứ đẩy pr-004 · pr-005 · pr-006 vào đúng cột
  // ② Yêu cầu NCC báo giá · ③ Xét duyệt báo giá · ④ Lập đơn mua hàng
  // ----------------------------------------------------------------
  {
    id: "rfq-004",
    code: "260002-HPCS-BG-001",
    prId: "pr-004",
    prCode: "260002-HPCS-PR-002",
    tieuDe: "Báo giá vật tư điện nước tầng hầm — Riverside Block B",
    trangThai: "dang_thu_thap",
    hanNop: "2026-08-10",
    items: [
      {
        id: "bg-i6",
        tenVatLieu: "Ống nhựa uPVC D90",
        donViTinh: "Cây",
        khoiLuong: 240,
        baoGiaNCC: [
          { nccId: "ncc-08", tenNCC: "Công ty TNHH Nhựa H", donGia: 148_000, thoiGianGiao: 5 },
        ],
      },
      {
        id: "bg-i7",
        tenVatLieu: "Dây điện đơn Cu/PVC 2.5mm²",
        donViTinh: "m",
        khoiLuong: 3000,
        baoGiaNCC: [
          { nccId: "ncc-08", tenNCC: "Công ty TNHH Nhựa H", donGia: 12_500, thoiGianGiao: 5 },
        ],
      },
    ],
    ngayTao: "2026-08-04",
    ngayCapNhat: "2026-08-05",
  },
  {
    id: "rfq-005",
    code: "260003-HPCS-BG-001",
    prId: "pr-005",
    prCode: "260003-HPCS-PR-001",
    tieuDe: "Báo giá vật tư phần thô — Trường Tiểu học Tân Phú",
    trangThai: "da_so_sanh",
    hanNop: "2026-08-01",
    items: [
      {
        id: "bg-i8",
        tenVatLieu: "Xi măng PCB40",
        donViTinh: "Bao",
        khoiLuong: 600,
        baoGiaNCC: [
          { nccId: "ncc-01", tenNCC: "Công ty TNHH VLXD A", donGia: 91_500, thoiGianGiao: 3 },
          { nccId: "ncc-05", tenNCC: "Công ty CP Xi Măng E", donGia: 90_800, thoiGianGiao: 6 },
          { nccId: "ncc-06", tenNCC: "Công ty TNHH Xi Măng F", donGia: 93_000, thoiGianGiao: 4 },
        ],
      },
      {
        id: "bg-i9",
        tenVatLieu: "Thép thanh vằn D12",
        donViTinh: "Kg",
        khoiLuong: 8500,
        baoGiaNCC: [
          { nccId: "ncc-02", tenNCC: "Công ty CP Thép B", donGia: 16_650, thoiGianGiao: 4 },
          { nccId: "ncc-07", tenNCC: "Công ty CP Thép G", donGia: 16_400, thoiGianGiao: 6 },
        ],
      },
      {
        id: "bg-i10",
        tenVatLieu: "Gạch ống 8x8x18",
        donViTinh: "Viên",
        khoiLuong: 45000,
        baoGiaNCC: [
          { nccId: "ncc-04", tenNCC: "Công ty CP Gạch D", donGia: 1_450, thoiGianGiao: 5 },
          { nccId: "ncc-07", tenNCC: "Công ty CP Thép G", donGia: 1_520, thoiGianGiao: 3 },
        ],
      },
    ],
    ngayTao: "2026-07-28",
    ngayCapNhat: "2026-08-01",
  },
  {
    id: "rfq-006",
    code: "260001-HPCS-BG-004",
    prId: "pr-006",
    prCode: "260001-HPCS-PR-003",
    tieuDe: "Báo giá vật tư cơ điện nhà điều hành — Nhà xưởng ABC GĐ2",
    trangThai: "da_chon_ncc",
    hanNop: "2026-08-04",
    items: [
      {
        id: "bg-i11",
        tenVatLieu: "Tủ điện phân phối 3 pha",
        donViTinh: "Bộ",
        khoiLuong: 4,
        baoGiaNCC: [
          { nccId: "ncc-02", tenNCC: "Công ty CP Thép B", donGia: 18_500_000, thoiGianGiao: 10 },
          { nccId: "ncc-09", tenNCC: "Công ty TNHH Cơ Điện I", donGia: 19_200_000, thoiGianGiao: 7 },
        ],
      },
      {
        id: "bg-i12",
        tenVatLieu: "Cáp điện Cu/XLPE/PVC 4x25mm²",
        donViTinh: "m",
        khoiLuong: 320,
        baoGiaNCC: [
          { nccId: "ncc-02", tenNCC: "Công ty CP Thép B", donGia: 385_000, thoiGianGiao: 10 },
          { nccId: "ncc-09", tenNCC: "Công ty TNHH Cơ Điện I", donGia: 392_000, thoiGianGiao: 7 },
        ],
      },
    ],
    nccDaChonId: "ncc-02",
    nccDaChonTen: "Công ty CP Thép B",
    ngayTao: "2026-08-01",
    ngayCapNhat: "2026-08-05",
  },
];

// ------------------------------------------------------------
// CÔNG NỢ — dữ liệu lấy trực tiếp từ PO (theo yêu cầu Sếp)
// Mỗi PO đã chốt → sinh 1 bản ghi công nợ
// ------------------------------------------------------------

export const CONG_NO_MAU: CongNo[] = [
  {
    id: "cn-001",
    poId: "po-001",
    poCode: "260001-HPCS-PO-001",
    nccId: "ncc-01",
    tenNCC: "Công ty TNHH VLXD A",
    soHoaDon: "HT-HD-2026-0412",
    soTien: 1_840_000,
    daTra: 0,
    hanThanhToan: "2026-08-26",
    trangThai: "chua_den_han",
    congTrinh: "Nhà xưởng ABC — Giai đoạn 2",
  },
  {
    id: "cn-002",
    poId: "po-002",
    poCode: "260001-HPCS-PO-002",
    nccId: "ncc-02",
    tenNCC: "Công ty CP Thép B",
    soHoaDon: "HP-HD-88231",
    soTien: 136_800_000,
    daTra: 0,
    hanThanhToan: "2026-08-18",
    trangThai: "sap_den_han",
    congTrinh: "Nhà xưởng ABC — Giai đoạn 2",
  },
  {
    id: "cn-003",
    poId: "po-004",
    poCode: "260001-HPCS-PO-004",
    nccId: "ncc-04",
    tenNCC: "Công ty CP Gạch D",
    soHoaDon: "AP-HD-2026-1180",
    soTien: 89_440_000,
    daTra: 89_440_000,
    hanThanhToan: "2026-08-15",
    trangThai: "da_thanh_toan",
    congTrinh: "Nhà xưởng ABC — Giai đoạn 2",
  },
  {
    id: "cn-004",
    poId: "po-005",
    poCode: "260002-HPCS-PO-001",
    nccId: "ncc-01",
    tenNCC: "Công ty TNHH VLXD A",
    soHoaDon: "HT-HD-2026-0398",
    soTien: 594_000_000,
    daTra: 200_000_000,
    hanThanhToan: "2026-07-25",
    trangThai: "qua_han",
    congTrinh: "Khu đô thị Riverside — Block B",
    ghiChu: "Đã thanh toán một phần, chờ nghiệm thu đợt cuối",
  },
  {
    id: "cn-005",
    poId: "po-006",
    poCode: "260002-HPCS-PO-002",
    nccId: "ncc-03",
    tenNCC: "Công ty TNHH Cát Đá C",
    soHoaDon: "BD-HD-2026-0055",
    soTien: 378_000_000,
    daTra: 378_000_000,
    hanThanhToan: "2026-08-10",
    trangThai: "da_thanh_toan",
    congTrinh: "Khu đô thị Riverside — Block B",
  },
];
