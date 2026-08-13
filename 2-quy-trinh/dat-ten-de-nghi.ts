// ============================================================
// CÔNG THỨC ĐẶT TÊN ĐỀ NGHỊ MUA HÀNG
//
// 🔴 NGUỒN: Ban lãnh đạo cung cấp ảnh màn hình Base ngày 13/08/2026, chú thích rõ từng phần:
//
//     2989713  -  260001-HPCS-HDXD-001,  CÔNG TRÌNH CHIEN YI
//     └ mã đề xuất  └ tên hợp đồng          └ tên công trình
//
// Kèm lời chốt: *"đây là công thức đặt tên của quy trình mua hàng, e setup theo. Này là cách
// đặt tên đối với phòng thi công"*.
//
// ⚠️ CÂU CUỐI QUAN TRỌNG: công thức này là của PHÒNG THI CÔNG. Các phòng ban khác chưa có
// công thức riêng — xem `congThucTheoPhongBan` bên dưới, và chỗ đó ghi rõ đang chờ Ban lãnh
// đạo cho biết.
// ============================================================

import type { MaPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";

/** Ba phần dựng nên tên đề nghị. */
export interface PhanTenDeNghi {
  /**
   * Mã đề xuất.
   *
   * ⚠️ Trong ảnh Base là số `2989713` do Base sinh. App này có hệ mã riêng theo **Thông báo
   * 09/2026/TB-HPCS** (`260001-HPCS-PR-001`), nên dùng mã của app — hai hệ số không trộn
   * được, và mã theo Thông báo mới là mã hồ sơ chính thức của công ty.
   */
  maDeNghi: string;
  /** Tên hợp đồng = mã hợp đồng chủ đầu tư, ví dụ `260001-HPCS-HDXD-001`. */
  maHopDongCDT?: string;
  tenCongTrinh: string;
}

/**
 * Dựng tên đề nghị theo công thức: `mã đề xuất - tên hợp đồng, TÊN CÔNG TRÌNH`.
 *
 * 📌 Bỏ phần nào thiếu thay vì để dấu phân cách trơ. Phiếu chưa có mã hợp đồng CĐT (việc
 * thường gặp: công trình nội bộ, hoặc hợp đồng chưa ký) sẽ ra `PR-001, CÔNG TRÌNH X` — đọc
 * vẫn được, thay vì `PR-001 - , CÔNG TRÌNH X` trông như dữ liệu lỗi.
 *
 * 📌 Tên công trình IN HOA đúng như ảnh Base. In hoa cả câu là cố ý: tên công trình là thứ
 * người ta quét mắt tìm nhanh nhất trong một danh sách dài.
 */
export function dungTenDeNghi(phan: PhanTenDeNghi): string {
  const hopDong = phan.maHopDongCDT?.trim();
  const congTrinh = phan.tenCongTrinh.trim().toUpperCase();
  const dauCauNoi = [phan.maDeNghi.trim(), hopDong].filter(Boolean).join(" - ");
  return congTrinh ? `${dauCauNoi}, ${congTrinh}` : dauCauNoi;
}

/**
 * Phòng ban này có dùng công thức đặt tên tự động không.
 *
 * 🔴 CHỈ PHÒNG THI CÔNG. Ban lãnh đạo 13/08/2026 nói rõ *"này là cách đặt tên đối với phòng
 * thi công"* — nghĩa là các phòng khác có thể có công thức khác, hoặc không cần công thức.
 *
 * ⚠️ ĐỪNG TỰ ÁP CHO MỌI PHÒNG BAN. Đề nghị của Phòng Hành chính hay Kế toán thường không
 * gắn với hợp đồng chủ đầu tư nào; ép công thức vào là sinh ra tên như
 * `PR-005, CÔNG TRÌNH —` vô nghĩa. Phòng nào chưa có công thức thì để người lập tự gõ tên,
 * và khi Ban lãnh đạo cho công thức thì thêm vào đây.
 */
export function coCongThucTuDong(maPhongBan: MaPhongBan): boolean {
  return maPhongBan === "thi_cong";
}
