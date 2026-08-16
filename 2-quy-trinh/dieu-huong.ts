import {
  LayoutDashboard,
  FileText,
  Eye,
  Wallet,
  CircleUser,
  CalendarDays,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Quyen } from "@/4-phan-quyen/quyen";

/**
 * Nhóm hiển thị trên sidebar — Ban lãnh đạo 13/08/2026 gửi ảnh mẫu sidebar Base.vn có tiêu
 * đề nhóm in hoa ngăn giữa các cụm mục.
 *
 * 📌 Chỉ có ý nghĩa HIỂN THỊ, không ảnh hưởng quyền. Mục nào thuộc nhóm nào là chuyện xếp
 * cho dễ tìm, còn ai thấy mục nào vẫn do `duocThay` quyết.
 */
export type NhomMenu = "quan_trong" | "quy_trinh" | "quan_tri";

/** Nhãn nhóm — in hoa nhỏ trên sidebar, theo đúng dáng mẫu Base. */
export const NHAN_NHOM_MENU: Record<NhomMenu, string> = {
  quan_trong: "Quan trọng",
  quy_trinh: "Quy trình thu mua",
  quan_tri: "Quản trị",
};

/**
 * Thứ tự nhóm trên sidebar. Việc CÁ NHÂN lên trước việc theo QUY TRÌNH — mở app ra là thấy
 * ngay "tôi phải làm gì", chưa cần đi tìm trong bảng 8 cột.
 */
export const THU_TU_NHOM: NhomMenu[] = ["quan_trong", "quy_trinh", "quan_tri"];

export interface MucDieuHuong {
  nhan: string;
  /** Nhãn rút gọn cho Bottom Navigation trên mobile (10–12px, dễ tràn). */
  nhanNgan: string;
  href: string;
  icon: LucideIcon;
  /** Trả về true nếu vai trò hiện tại được thấy mục này. */
  duocThay: (q: Quyen) => boolean;
  /** Nhóm trên sidebar. Thiếu thì xếp vào "Quy trình thu mua". */
  nhom?: NhomMenu;
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
 * 🔴 MỤC "Tạo đề nghị mua hàng" ĐÃ BỎ KHỎI MENU — Ban lãnh đạo 12/08/2026:
 * *"bỏ mục này ra khỏi tab trái nha, không cần hiển thị"*.
 *
 * ⚠️ MÀN HÌNH VẪN CÒN và VẪN CÓ ĐƯỜNG VÀO, đã kiểm trước khi bỏ (đúng luật CLAUDE.md mục
 * 3.4b — phiên 03 suýt làm module Báo giá thành mồ côi vì bỏ menu mà không kiểm):
 *   · Nút "Tạo đề nghị" ở màn **Công việc của tôi** — mục này hiện cho MỌI vai trò, và nút
 *     xét `quyen.taoDeNghi` nên ai lập được đề nghị đều thấy. Đây là đường vào chính.
 *   · Nút "Nhận đề nghị mới" ở màn Quy trình mua hàng — chỉ người làm thu mua thấy.
 *
 * ⚠️ Ba MÀN HÌNH đó VẪN CÒN, địa chỉ không đổi (`/phan-bo`, `/bao-gia`, `/don-hang`).
 * Chỉ bỏ lối vào từ menu. Đường vào hiện tại là trang chi tiết đề nghị `/de-nghi/[id]`:
 * ở đó có bảng phân bổ, danh sách bảng báo giá và danh sách đơn hàng đã tách.
 * Muốn trả mục nào về menu thì thêm lại vào mảng dưới đây, không phải dựng lại gì.
 */
export const MUC_DIEU_HUONG: MucDieuHuong[] = [
  {
    // Nhãn "Tổng quan" theo chỉ đạo Ban lãnh đạo 10/08/2026 (trước là "Bảng điều khiển").
    nhan: "Tổng quan",
    nhanNgan: "Tổng quan",
    href: "/tong-quan",
    nhom: "quan_trong",
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
    // Nhãn "Công việc của tôi" theo chỉ đạo Ban lãnh đạo 10/08/2026 (trước là "Việc của tôi").
    // `nhanNgan` giữ "Của tôi" vì thanh dưới trên điện thoại chỉ vừa 10–12px, tên dài sẽ tràn.
    nhan: "Công việc của tôi",
    nhanNgan: "Của tôi",
    href: "/viec-cua-toi",
    nhom: "quan_trong",
    icon: CircleUser,
    duocThay: () => true,
  },
  {
    // Chỉ đạo Ban lãnh đạo 11/08/2026: *"Thêm chức năng lịch ghi chú cho các tài khoản của bộ
    // phận này, và sẽ tự động cập nhật công việc vào lịch khi có nhiệm vụ"*.
    //
    // 📌 VỊ TRÍ NGAY DƯỚI "Công việc của tôi" theo chỉ đạo Ban lãnh đạo 11/08/2026. Hai mục
    // này là cặp: một cái trả lời "việc nào đang tới tay tôi", một cái trả lời "việc nào tới
    // hạn ngày nào". Đặt cạnh nhau thì người dùng quét mắt một lần là thấy cả hai.
    //
    // 📌 MỌI VAI TRÒ ĐỀU CÓ LỊCH, không lọc theo bộ phận. Thủ kho cũng có hạn ghi phiếu nhận,
    // kế toán cũng có hạn thanh toán — chặn họ khỏi lịch không được lợi gì mà lại sinh trường
    // hợp ngoại lệ phải nhớ. Lịch tự lọc theo NGƯỜI PHỤ TRÁCH nên mỗi người chỉ thấy việc của
    // mình; vai trò không được phân việc gì thì mở ra thấy lịch trống, đúng thực tế.
    nhan: "Lịch công việc",
    nhanNgan: "Lịch",
    href: "/lich",
    nhom: "quan_trong",
    icon: CalendarDays,
    duocThay: () => true,
  },
  {
    // Nhãn "Quy trình mua hàng" theo chỉ đạo Ban lãnh đạo 10/08/2026 (trước là "Đề nghị mua
    // hàng") — màn này là bảng quy trình 8 cột, tên cũ làm tưởng chỉ là danh sách đề nghị.
    nhan: "Quy trình mua hàng",
    nhanNgan: "Quy trình",
    href: "/de-nghi",
    icon: FileText,
    /**
     * 🔴 CHỈ NGƯỜI LÀM THU MUA (Ban lãnh đạo 16/08/2026: *"ở tk thủ kho và tk của phòng ban
     * khác thì không được phép thấy quy trình mua hàng, chỉ thấy tiến độ đơn hàng ở tab theo
     * dõi đơn hàng thôi"*).
     *
     * ⚠️ CHỈ ĐẠO NÀY ĐẢO NGƯỢC QUYẾT ĐỊNH 12/08/2026 — lúc đó Ban lãnh đạo yêu cầu *"cho tài
     * khoản thủ kho được thấy quy trình thu mua, để biết request đang ở bước nào"*. Ghi lại cả
     * hai để người sau không tưởng là bỏ sót rồi mở lại.
     *
     * 📌 Thủ kho, QLDA, kế toán, các phòng ban đề xuất vẫn theo dõi được tiến độ ở mục "Theo
     * dõi đề nghị" — mục đó mở cho mọi vai trò, chỉ không hiện giá và nhà cung cấp.
     */
    duocThay: (q) => q.xemQuyTrinhMuaHang,
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
  {
    /**
     * ★ CÀI ĐẶT QUY TRÌNH — Ban lãnh đạo 13/08/2026: *"em thêm chức năng cài đặt quy trình,
     * có thể chỉnh sửa các điều kiện trong quy trình"*.
     *
     * 🔴 CHỈ TRƯỞNG BỘ PHẬN VÀ QUẢN TRỊ THẤY. Cấu hình dùng chung cả phòng: một người sửa là
     * đổi luật cho mọi người. Dùng `suaPODaChot` làm mốc vì đó đã là quyền "được sửa thứ đã
     * chốt" — cùng một mức trách nhiệm, khỏi sinh thêm một cờ quyền chỉ dùng một chỗ.
     */
    nhan: "Cài đặt quy trình",
    nhanNgan: "Cài đặt",
    href: "/cai-dat-quy-trinh",
    nhom: "quan_tri",
    icon: Settings,
    duocThay: (q) => q.suaPODaChot,
  },
];

export function mucDieuHuongChoVaiTro(q: Quyen): MucDieuHuong[] {
  return MUC_DIEU_HUONG.filter((m) => m.duocThay(q));
}

/**
 * MỤC NÀO ĐANG ĐƯỢC CHỌN — trả về `href` của đúng MỘT mục, hoặc `null`.
 *
 * 🔴 Ban lãnh đạo 12/08/2026: *"mục này tick chọn bị dính"*. Hai mục cùng sáng một lúc.
 *
 * Nguyên nhân: cả thanh bên và thanh dưới đều tự tính
 * `pathname === href || pathname.startsWith(href + "/")`. Ở địa chỉ `/de-nghi/nhan-moi` thì
 * điều kiện đó ĐÚNG với cả hai mục — "Quy trình mua hàng" (`/de-nghi`) và "Tạo đề nghị mua
 * hàng" (`/de-nghi/nhan-moi`) — nên cả hai cùng đổi màu.
 *
 * Luật đúng: **khớp cụ thể nhất thì thắng**. Chọn mục có `href` khớp và DÀI NHẤT.
 *
 * ⚠️ ĐẶT Ở ĐÂY, KHÔNG để mỗi thanh tự tính. Hai nơi cùng tính một luật là kiểu sửa được một
 * chỗ quên chỗ kia — đúng điều vừa xảy ra: thanh bên và thanh dưới sai y như nhau.
 */
export function hrefDangChon(duongDan: string, muc: MucDieuHuong[]): string | null {
  let chon: string | null = null;
  for (const m of muc) {
    const khop = duongDan === m.href || duongDan.startsWith(`${m.href}/`);
    if (khop && (chon === null || m.href.length > chon.length)) chon = m.href;
  }
  return chon;
}
