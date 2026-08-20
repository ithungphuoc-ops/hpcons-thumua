// ============================================================
// HỢP ĐỒNG DỮ LIỆU — App Request gọi sang App Thu mua
//
// Tài liệu tham chiếu cho đội App Request khi họ code phần gọi sang (mirror đúng cấu trúc
// `DeNghiDuyetPayload` / `guiSangQlkCtr` họ đã viết cho QLK CTR — cùng đề xuất, gọi thêm một
// nhánh song song sang đây, KHÔNG thay nhánh gọi QLK CTR đang chạy).
//
//   POST {THUMUA_URL}/api/app-request/de-nghi-moi
//   Header: x-api-key: <APP_REQUEST_API_KEY nếu Thu mua đã cấu hình>
//   Body: DeNghiMoiTuAppRequest (JSON)
//
// Gọi cho MỌI đề xuất duyệt xong (status "approved"), có công trình hay không — khác nhánh
// gọi QLK CTR (chỉ có ý nghĩa khi có công trình). Bọc try/catch riêng ở App Request, lỗi ở
// đây không được làm hỏng việc duyệt đề xuất chính.
// ============================================================

export type VatTuTuAppRequest = {
  tenVatTu: string;
  quyCach?: string;
  dvt: string;
  soLuong: number;
  mucDichSuDung?: string;
};

export type TaiLieuTuAppRequest = {
  ten: string;
  url: string;
};

export type DeNghiMoiTuAppRequest = {
  /** Mã đề xuất 6 số App Request tự sinh (vd "01234") — KHÓA LIÊN KẾT chính, không đổi được. */
  requestCode: string;
  /** id kỹ thuật bên App Request — chỉ để đối chiếu khi cần tra ngược, không dùng để hiển thị. */
  requestId: string;
  tieuDe?: string;
  nguoiGuiTen: string;
  /**
   * 📌 Từ 20/08/2026: Thu mua đăng nhập qua SSO App Tổng (`account.hpcore.vn`), nên mã người
   * dùng ở đây CHÍNH LÀ `users/{uid}` của App Tổng — nếu App Request cũng đọc danh bạ từ
   * cùng App Tổng (đã thấy code họ gọi `getHpcoreDb()` để tra phòng ban/quản lý), thì đây
   * là mã DÙNG CHUNG thật, không phải khóa tạm. Ưu tiên trường này hơn `nguoiGuiEmail` nếu có.
   */
  nguoiGuiUid?: string;
  /** Dùng làm khóa định danh tạm cho `nguoiDeNghiUid` khi thiếu `nguoiGuiUid`. */
  nguoiGuiEmail: string;
  /** ISO "YYYY-MM-DD" — lúc BCH gửi đề xuất lần đầu (RequestInstance.submittedAt). */
  ngayGui: string;
  /** ISO "YYYY-MM-DD" — lúc duyệt xong hết các cấp. */
  ngayDuyet: string;
  /** ISO "YYYY-MM-DD" — nếu thiếu, Thu mua tự đặt = ngayDuyet + 7 ngày. */
  ngayCanGiao?: string;
  /**
   * Giá trị field "Tên đề xuất" bên App Request — chuỗi "Mã hợp đồng - Tên công trình".
   * RỖNG = đề xuất của một phòng ban, KHÔNG gắn công trình nào (Sếp xác nhận Thu mua vẫn
   * phải nhận, khác App Kho).
   */
  congTrinhChuoi?: string;
  /** Giá trị field "Chọn bộ phận" (department_select, tự động theo Nhóm thành viên) — Sếp xác nhận đây là nguồn đúng. */
  phongBan: string;
  vatTu: VatTuTuAppRequest[];
  taiLieuDinhKem?: TaiLieuTuAppRequest[];
};

export type KetQuaNhanDeNghiTuAppRequest =
  | { ok: true; trangThai: "da_tao"; deNghiId: string; maDeNghi: string }
  | { ok: true; trangThai: "da_ton_tai"; deNghiId: string; maDeNghi: string }
  | { ok: false; error: string };
