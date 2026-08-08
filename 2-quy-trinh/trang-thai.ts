// ============================================================
// NHÃN HIỂN THỊ + TÔNG MÀU CHO TRẠNG THÁI
//
// Luật V1.1: trạng thái phải có CẢ MÀU VÀ CHỮ, không chỉ dùng màu.
// Vì vậy mọi trạng thái ở đây đều có `nhan` (chữ) đi kèm `tong` (màu).
// ============================================================

import type {
  TrangThaiDeNghi,
  TrangThaiDongDeNghi,
  TrangThaiPO,
  TrangThaiPhieuNhan,
  TrangThaiBaoGia,
  TrangThaiCongNo,
} from "@/3-du-lieu/kieu-du-lieu";

export type Tong = "primary" | "success" | "warning" | "danger" | "neutral";

export interface MoTaTrangThai {
  nhan: string;
  tong: Tong;
}

export const NHAN_TRANG_THAI_DE_NGHI: Record<TrangThaiDeNghi, MoTaTrangThai> = {
  da_duyet: { nhan: "Đã duyệt — chờ phân bổ", tong: "warning" },
  dang_phan_bo: { nhan: "Đang phân bổ", tong: "warning" },
  da_phan_bo_du: { nhan: "Đã phân bổ đủ", tong: "primary" },
  dang_thuc_hien: { nhan: "Đang thực hiện", tong: "primary" },
  hoan_thanh: { nhan: "Hoàn thành", tong: "success" },
  dong_do: { nhan: "Đóng dở", tong: "neutral" },
};

export const NHAN_TRANG_THAI_PO: Record<TrangThaiPO, MoTaTrangThai> = {
  nhap: { nhan: "Nháp", tong: "neutral" },
  da_chot: { nhan: "Đã chốt — chờ giao", tong: "primary" },
  dang_giao: { nhan: "Đang giao", tong: "primary" },
  cho_xac_nhan_hoan_thanh: { nhan: "Chờ xác nhận hoàn thành", tong: "warning" },
  hoan_thanh: { nhan: "Hoàn thành", tong: "success" },
  huy: { nhan: "Đã hủy", tong: "danger" },
};

export const NHAN_TRANG_THAI_DONG: Record<TrangThaiDongDeNghi, MoTaTrangThai> = {
  chua_phan_bo: { nhan: "Chưa phân bổ", tong: "danger" },
  da_phan_bo: { nhan: "Đã phân — chưa lên đơn", tong: "warning" },
  da_len_po: { nhan: "Đã lên đơn hàng", tong: "primary" },
  dang_giao: { nhan: "Đang giao", tong: "primary" },
  da_nhan_du: { nhan: "Đã nhận đủ", tong: "success" },
};

export const NHAN_TRANG_THAI_PHIEU: Record<TrangThaiPhieuNhan, MoTaTrangThai> = {
  cho_kiem_tra: { nhan: "Chờ kiểm tra — chưa tính", tong: "warning" },
  da_nhap_kho: { nhan: "Đã nhập kho", tong: "success" },
  tu_choi_nhan: { nhan: "Từ chối nhận", tong: "danger" },
};

/** Nhãn trạng thái dòng đề nghị dành cho Phòng thi công — bỏ chi tiết nội bộ. */
export const NHAN_TRANG_THAI_DONG_CHO_NGUOI_DE_NGHI: Record<TrangThaiDongDeNghi, MoTaTrangThai> = {
  chua_phan_bo: { nhan: "Chưa lên đơn hàng", tong: "neutral" },
  da_phan_bo: { nhan: "Chưa lên đơn hàng", tong: "neutral" },
  da_len_po: { nhan: "Đã lên đơn — chờ giao", tong: "primary" },
  dang_giao: { nhan: "Đang giao", tong: "primary" },
  da_nhan_du: { nhan: "Đã nhận đủ", tong: "success" },
};

export const NHAN_TRANG_THAI_BAO_GIA: Record<TrangThaiBaoGia, MoTaTrangThai> = {
  dang_thu_thap: { nhan: "Đang thu thập", tong: "warning" },
  da_so_sanh: { nhan: "Đã so sánh", tong: "primary" },
  da_chon_ncc: { nhan: "Đã chọn NCC", tong: "success" },
  huy: { nhan: "Đã hủy", tong: "danger" },
};

export const NHAN_TRANG_THAI_CONG_NO: Record<TrangThaiCongNo, MoTaTrangThai> = {
  chua_den_han: { nhan: "Chưa đến hạn", tong: "primary" },
  sap_den_han: { nhan: "Sắp đến hạn", tong: "warning" },
  qua_han: { nhan: "Quá hạn", tong: "danger" },
  da_thanh_toan: { nhan: "Đã thanh toán", tong: "success" },
};

export const NHAN_UU_TIEN: Record<"binh_thuong" | "gap", MoTaTrangThai> = {
  binh_thuong: { nhan: "Bình thường", tong: "neutral" },
  gap: { nhan: "Gấp", tong: "danger" },
};

export const NHAN_PHONG_BAN_NGUON: Record<"thi_cong", string> = {
  thi_cong: "Phòng Thi công",
};

/** Lớp CSS cho badge theo tông — dùng token, không hardcode màu. */
export const LOP_BADGE: Record<Tong, string> = {
  primary: "bg-primary-bg text-primary-soft",
  success: "bg-success-bg text-success-soft",
  warning: "bg-warning-bg text-warning-soft",
  danger: "bg-danger-bg text-danger-soft",
  neutral: "bg-neutral-bg text-neutral-soft",
};

export const LOP_THANH: Record<Tong, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-neutral",
};
