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

/**
 * ★ TRA NHÃN AN TOÀN — dùng cho MỌI chỗ tra bảng nhãn bằng giá trị đến từ DỮ LIỆU ĐÃ LƯU.
 *
 * 🔴 VÌ SAO CẦN: `bang[khoa].nhan` sập **trắng cả trang** khi dữ liệu có trạng thái không nằm
 * trong bảng — không phải hiện sai chữ, mà là màn hình trắng kèm "Application error". Đã gặp
 * thật ngày 14/08/2026 với một đề nghị có `trangThai` lạ.
 *
 * ⚠️ Chuyện này SẼ xảy ra trên bản chạy thật: cả phòng dùng chung một kho dữ liệu, mà mỗi máy
 * có thể đang chạy bản app khác nhau (Vercel giữ bản cũ trong bộ nhớ đệm, người dùng chưa
 * tải lại trang). Máy chạy bản mới ghi một trạng thái mới xuống kho chung, máy chạy bản cũ
 * đọc lên và không có trong bảng → sập. Hiện chữ thô còn dùng được; sập trắng thì không.
 *
 * 📌 Trả về đúng mã làm chữ để người dùng và người hỗ trợ vẫn đọc được app đang thấy gì.
 */
export function nhanAnToan(
  bang: Record<string, MoTaTrangThai>,
  khoa: string | undefined | null,
): MoTaTrangThai {
  if (khoa && bang[khoa]) return bang[khoa];
  return { nhan: khoa ? `Không rõ (${khoa})` : "Không rõ", tong: "neutral" };
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

/* 📌 12/08/2026: bảng nhãn phòng ban đã CHUYỂN sang `3-du-lieu/danh-muc-phong-ban.ts`
   (Ban lãnh đạo cung cấp danh sách 16 phòng ban thật). Dùng `nhanPhongBan(ma)` để lấy
   tên — hàm đó chịu được cả mã lạ do App Tổng đẩy sang, còn tra Record thì trả
   `undefined` và giao diện hiện chữ "undefined" giữa hồ sơ. */

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
