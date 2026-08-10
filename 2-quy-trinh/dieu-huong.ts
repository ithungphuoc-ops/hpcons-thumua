import {
  LayoutDashboard,
  FileText,
  Eye,
  Wallet,
  CircleUser,
  type LucideIcon,
} from "lucide-react";
import type { Quyen } from "@/4-phan-quyen/quyen";

export interface MucDieuHuong {
  nhan: string;
  /** Nhãn rút gọn cho Bottom Navigation trên mobile (10–12px, dễ tràn). */
  nhanNgan: string;
  href: string;
  icon: LucideIcon;
  /** Trả về true nếu vai trò hiện tại được thấy mục này. */
  duocThay: (q: Quyen) => boolean;
}

/**
 * Điều hướng App Thu mua — Sidebar chịu trách nhiệm điều hướng toàn bộ (V1.1 Phần C).
 *
 * 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 06/08/2026: việc nào đã nằm trong bảng quy trình 8 cột
 * thì KHÔNG để thành một mục menu riêng nữa. Vào bằng thẻ trên bảng, tra bằng mã hồ sơ
 * lấy từ Đề nghị. Ba mục đã bỏ khỏi menu:
 *
 *   · Phân bổ công việc  → cột "Tiếp nhận và kiểm tra"
 *   · Báo giá & so sánh  → cột "Yêu cầu NCC báo giá" + "Xét duyệt báo giá"
 *   · Đơn đặt hàng       → cột "Lập đơn mua hàng" → "Tiến hành đặt hàng" → "Tiến hành nhận hàng"
 *
 * ⚠️ Ba MÀN HÌNH đó VẪN CÒN, địa chỉ không đổi (`/phan-bo`, `/bao-gia`, `/don-hang`).
 * Chỉ bỏ lối vào từ menu. Đường vào hiện tại là trang chi tiết đề nghị `/de-nghi/[id]`:
 * ở đó có bảng phân bổ, danh sách bảng báo giá và danh sách đơn hàng đã tách.
 * Muốn trả mục nào về menu thì thêm lại vào mảng dưới đây, không phải dựng lại gì.
 */
export const MUC_DIEU_HUONG: MucDieuHuong[] = [
  {
    nhan: "Bảng điều khiển",
    nhanNgan: "Tổng quan",
    href: "/tong-quan",
    icon: LayoutDashboard,
    duocThay: () => true,
  },
  {
    // Màn hình CÁ NHÂN, theo ảnh Base.vn Ban lãnh đạo cung cấp 10/08/2026: lọc theo
    // "đến lượt tôi / quá hạn / tôi theo dõi / đã đánh dấu" để mỗi người biết ngay việc
    // đang tới tay mình, không phải lọc tay trong bảng quy trình 8 cột.
    //
    // ⚠️ KHÁC "Theo dõi đề nghị": màn đó cho NGƯỜI ĐỀ NGHỊ (Phòng Thi công) và ẩn giá +
    // nhà cung cấp. Màn này cho NGƯỜI LÀM THU MUA. Đừng gộp hai mục.
    nhan: "Việc của tôi",
    nhanNgan: "Của tôi",
    href: "/viec-cua-toi",
    icon: CircleUser,
    duocThay: () => true,
  },
  {
    nhan: "Đề nghị mua hàng",
    nhanNgan: "Đề nghị",
    href: "/de-nghi",
    icon: FileText,
    duocThay: (q) => q.xemMoiHoSo || q.lapPO || q.phanBoCongViec,
  },
  {
    nhan: "Theo dõi đề nghị",
    nhanNgan: "Theo dõi",
    href: "/theo-doi",
    icon: Eye,
    duocThay: () => true,
  },
  {
    nhan: "Công nợ nhà cung cấp",
    nhanNgan: "Công nợ",
    href: "/cong-no",
    icon: Wallet,
    duocThay: (q) => q.xemCongNo,
  },
];

export function mucDieuHuongChoVaiTro(q: Quyen): MucDieuHuong[] {
  return MUC_DIEU_HUONG.filter((m) => m.duocThay(q));
}
