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
  NhaCungCap,
  ThuKhoCongTrinh,
} from "@/3-du-lieu/kieu-du-lieu";

/** Tên ngăn chứa trên máy. Tăng số cuối mỗi khi đổi cấu trúc dữ liệu. */
const KHOA = "hpcons-thumua-du-lieu-v1";

/** Đúng bộ dữ liệu người dùng tạo ra khi chạy thử. Nhà cung cấp không lưu vì cố định. */
import type { CauHinhQuyTrinh, VetDoiCauHinh } from "@/2-quy-trinh/cau-hinh-quy-trinh";

export interface DuLieuLuu {
  deNghi: DeNghiMuaHang[];
  /**
   * Cấu hình quy trình (ngưỡng giá trị, hạn từng bước…) — Ban lãnh đạo 13/08/2026.
   * ⚠️ TÙY CHỌN: bản lưu cũ không có khóa này, đọc ra `undefined` và app phải rơi về
   * `CAU_HINH_MAC_DINH` chứ không được coi là "cấu hình rỗng".
   */
  cauHinh?: CauHinhQuyTrinh;
  /** Vết đổi cấu hình — mới nhất lên đầu. Tùy chọn vì bản lưu cũ không có. */
  lichSuCauHinh?: VetDoiCauHinh[];
  donHang: DonDatHang[];
  giaDonHang: GiaDonDatHang[];
  phieuNhan: PhieuNhanHang[];
  baoGia: BaoGia[];
  thongBao: ThongBaoChuyenBuoc[];
  /**
   * ★ DANH MỤC NHÀ CUNG CẤP do bộ phận thu mua tự thêm — Ban lãnh đạo 20/08/2026: *"tạo danh mục
   * NCC do bộ phận thu mua điền thông tin"*.
   *
   * ⚠️ TÙY CHỌN: bản lưu cũ không có khóa này. Đọc ra `undefined` thì app dùng **danh mục mẫu**
   * (`NHA_CUNG_CAP`), KHÔNG được coi là "danh mục rỗng" — coi là rỗng thì ô chọn nhà cung cấp
   * trắng trơn trong khi dữ liệu mẫu vẫn còn đó.
   *
   * 📌 Chỉ chứa nhà cung cấp NGƯỜI DÙNG THÊM. Danh mục mẫu vẫn nằm trong mã nguồn và được gộp
   * vào lúc đọc — như vậy bản chạy thử không phải chép sẵn 4 dòng mẫu lên kho chung của cả phòng.
   */
  nhaCungCapThem?: NhaCungCap[];
  /**
   * ★ DANH MỤC THỦ KHO CÔNG TRÌNH — Ban lãnh đạo 22/08/2026: *"Thêm trường nhập liệu thông tin
   * thủ kho công trình và cho lưu lại"*.
   *
   * ⚠️ TÙY CHỌN như `nhaCungCapThem`: bản lưu cũ không có khóa này. `undefined` = chưa ai thêm ai,
   * và app chỉ còn danh bạ nhân sự bộ phận Kho để chọn — KHÔNG phải lỗi.
   *
   * 🔴 PHẢI KHAI Ở CẢ HAI CHỖ: đây (`docDuLieuDaLuu`, đọc từ máy) **và** `chuanHoa` trong
   * `kho-chung-firestore.ts` (đọc từ kho chung). Hai hàm đó dựng lại dữ liệu theo **danh sách
   * trắng**; quên khai một bên là dữ liệu biến mất **không một dòng lỗi** — đã dính thật với khóa
   * `cauHinh` ngày 13/08/2026.
   */
  thuKhoThem?: ThuKhoCongTrinh[];
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
      /**
       * 🔴 THÊM KHÓA MỚI VÀO ĐÂY, KHÔNG ĐƯỢC QUÊN. Hàm này dựng lại object theo danh sách
       * trắng, nên khóa nào không liệt kê ở đây thì **bị bỏ rơi khi đọc** — dù đã ghi xuống
       * localStorage đầy đủ.
       *
       * Đã dính lỗi thật ngày 13/08/2026: lưu ngưỡng 15 triệu, tải lại trang là về 10 triệu.
       * Bản lưu có `cauHinh` đúng, nhưng hàm này trả về object không có nó → state rơi về mặc
       * định → effect ghi đẩy mặc định xuống, đè mất cài đặt. Không một dòng lỗi nào hiện ra.
       *
       * ⚠️ Chỉ nhận khi có giá trị: `undefined` giữ nguyên `undefined` để bên gọi phân biệt
       * được "chưa từng cấu hình" với "cấu hình rỗng" — xem `apDung` trong `kho-du-lieu.tsx`.
       */
      ...(d.cauHinh ? { cauHinh: d.cauHinh } : {}),
      ...(Array.isArray(d.lichSuCauHinh) ? { lichSuCauHinh: d.lichSuCauHinh } : {}),
      /* Nhà cung cấp người dùng tự thêm — giữ `undefined` khi chưa có, đừng thay bằng `[]`:
         bên gọi phân biệt "chưa từng thêm ai" với "đã thêm rồi xóa hết". */
      ...(Array.isArray(d.nhaCungCapThem) ? { nhaCungCapThem: d.nhaCungCapThem } : {}),
      ...(Array.isArray(d.thuKhoThem) ? { thuKhoThem: d.thuKhoThem } : {}),
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
