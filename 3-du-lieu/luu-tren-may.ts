// ============================================================
// GIỮ DỮ LIỆU CHẠY THỬ TRÊN MÁY NGƯỜI DÙNG (localStorage)
//
// 🔴 Vì sao cần: từ 10/08/2026 app không còn dữ liệu mẫu. Kho dữ liệu chỉ nằm trong bộ
// nhớ trình duyệt, nên lỡ tải lại trang (F5, bấm nút Quay lại, mở link in ở tab mới) là
// **mất sạch việc vừa nhập** — người dùng phải lập lại đề nghị từ đầu. File này giữ lại
// giúp, để đi trọn một vòng nghiệp vụ nhiều ngày cũng không sao.
//
// ⚠️ Đây KHÔNG phải cơ sở dữ liệu:
//   • Chỉ nằm trên đúng một máy, đúng một trình duyệt. Máy khác mở ra là trống.
//   • Xóa lịch sử duyệt web / dùng chế độ ẩn danh là mất.
//   • Chỉ dùng cho giai đoạn chạy thử. Khi nối Firestore thì **bỏ hẳn**, đừng để hai
//     nguồn dữ liệu song song rồi lệch nhau.
//
// 📌 Đổi cấu trúc dữ liệu (thêm/bớt trường trong kieu-du-lieu.ts) thì **tăng số ở KHOA**.
// Không tăng thì bản cũ trên máy người dùng vẫn được nạp vào và gây lỗi khó tìm.
// ============================================================

import type {
  DeNghiMuaHang,
  DonDatHang,
  GiaDonDatHang,
  PhieuNhanHang,
  BaoGia,
  ThongBaoChuyenBuoc,
} from "@/3-du-lieu/kieu-du-lieu";

/** Tên ngăn chứa trên máy. Tăng số cuối mỗi khi đổi cấu trúc dữ liệu. */
const KHOA = "hpcons-thumua-du-lieu-v1";

/** Đúng bộ dữ liệu người dùng tạo ra khi chạy thử. Nhà cung cấp không lưu vì cố định. */
export interface DuLieuLuu {
  deNghi: DeNghiMuaHang[];
  donHang: DonDatHang[];
  giaDonHang: GiaDonDatHang[];
  phieuNhan: PhieuNhanHang[];
  baoGia: BaoGia[];
  thongBao: ThongBaoChuyenBuoc[];
}

/**
 * Đọc dữ liệu đã lưu. Trả `null` khi chưa có gì, khi chạy phía máy chủ, hoặc khi bản lưu
 * hỏng — người gọi cứ dùng dữ liệu gốc, không cần bắt lỗi.
 */
export function docDuLieuDaLuu(): DuLieuLuu | null {
  if (typeof window === "undefined") return null;
  try {
    const tho = window.localStorage.getItem(KHOA);
    if (!tho) return null;
    const d = JSON.parse(tho) as Partial<DuLieuLuu>;
    // Bản lưu cũ có thể thiếu mảng mới thêm sau này — thiếu thì cho mảng rỗng, đừng bỏ
    // cả bản lưu, vì như vậy là mất trắng việc người dùng đã nhập.
    return {
      deNghi: Array.isArray(d.deNghi) ? d.deNghi : [],
      donHang: Array.isArray(d.donHang) ? d.donHang : [],
      giaDonHang: Array.isArray(d.giaDonHang) ? d.giaDonHang : [],
      phieuNhan: Array.isArray(d.phieuNhan) ? d.phieuNhan : [],
      baoGia: Array.isArray(d.baoGia) ? d.baoGia : [],
      thongBao: Array.isArray(d.thongBao) ? d.thongBao : [],
    };
  } catch {
    // JSON hỏng hoặc trình duyệt chặn localStorage → coi như chưa có gì.
    return null;
  }
}

/** Ghi đè bản lưu. Lỗi hết dung lượng thì bỏ qua — mất bản lưu còn hơn treo app. */
export function ghiDuLieu(d: DuLieuLuu): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KHOA, JSON.stringify(d));
  } catch {
    /* Hết dung lượng hoặc trình duyệt chặn — không làm gì. */
  }
}

/** Xóa sạch để chạy thử lại từ đầu. Dùng cho nút "Xóa dữ liệu chạy thử". */
export function xoaDuLieuDaLuu(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KHOA);
  } catch {
    /* Không xóa được thì thôi. */
  }
}
