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

/**
 * ★★ GIÁ TRỊ Ô "LỰA CHỌN ĐỀ NGHỊ" trên biểu mẫu App Request — thêm 15/09/2026.
 *
 * 🔴🔴 TỆP NÀY THUỘC VÙNG CẤM SỬA CỦA PHIÊN TÍCH HỢP APP TỔNG (CLAUDE.md §6.6, chỉ đạo Sếp
 * 20/08/2026). Khối này do PHIÊN NGHIỆP VỤ THU MUA thêm, **có phép riêng của Sếp ngày
 * 15/09/2026** (*"A đã báo rồi, e sửa đi"* — Sếp đã báo phiên tích hợp trước). Ghi lại để phiên
 * tích hợp đọc ra là CÓ PHÉP, không phải bị đè code. THUẦN THÊM: không đổi, không xoá trường nào.
 *
 * 📌 Union hẹp thay vì `string` là CỐ Ý — đây là ô chọn (select), không phải ô gõ tự do. Liệt kê
 * hết những cách viết đã ĐO ĐƯỢC trên kho `hpcons-request` (collection `requests`, 60 phiếu):
 *   · `"Đề nghị công trình"` và `"Đề nghị Công trình"` — **hai cách viết hoa cùng tồn tại**
 *   · `"Đề nghị phòng ban"`
 * cộng hai mã rút gọn để App Request gửi thẳng mã máy nếu họ muốn (`"cong_trinh"`/`"phong_ban"`).
 *
 * ⚠️ UNION CHỈ CHẶT LÚC BIÊN DỊCH, KHÔNG CHẶT LÚC CHẠY — body JSON được ép kiểu, App Request đổi
 * nhãn lúc nào cũng được. Nên cửa tiếp nhận PHẢI chuẩn hoá lại bằng `chuanHoaLoaiHoSo`
 * (`2-quy-trinh/tich-hop-app-request.ts`): bỏ dấu cách thừa, bỏ dấu tiếng Việt, không phân biệt
 * hoa thường. Không nhận ra thì **để trống**, tuyệt đối không đoán bừa.
 */
export type LoaiDeNghiTuAppRequest =
  | "Đề nghị công trình"
  | "Đề nghị Công trình"
  | "Đề nghị phòng ban"
  | "cong_trinh"
  | "phong_ban";

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
  /**
   * ★★ Giá trị ô **"Lựa chọn đề nghị"** — đề nghị này của CÔNG TRÌNH hay của PHÒNG BAN.
   * Thêm 15/09/2026, có phép riêng của Sếp (xem `LoaiDeNghiTuAppRequest` ở trên).
   *
   * 🔴 VÌ SAO XIN THÊM TRƯỜNG NÀY: App Thu mua phải cho hồ sơ phòng ban đi **nhánh riêng** (Sếp
   * duyệt 15/09/2026) — không có kho công trình nào gửi phiếu nhận sang, nên nhân viên mua hàng
   * tự bấm hoàn thành kèm phiếu giao hàng. Hai phép suy gián tiếp đều SAI trên dữ liệu thật:
   * `tenCongTrinh` rỗng → 0/16, `maDuAn` bắt đầu `"PB-"` → 0/16 (App Request đang nhét tiêu đề đề
   * nghị vào cả hai ô đó). Ô "Lựa chọn đề nghị" là nguồn chính thức duy nhất đúng.
   *
   * ⚠️ TUỲ CHỌN, và Thu mua KHÔNG đoán khi thiếu: payload không có trường này (App Request chưa
   * cập nhật, hoặc phiếu đời cũ) thì hồ sơ để trống loại và app rơi về phép suy dự phòng cũ.
   * Gửi được thì gửi NGUYÊN VĂN giá trị người dùng chọn, không cần tự quy đổi.
   */
  loaiDeNghi?: LoaiDeNghiTuAppRequest;
  /** Giá trị field "Chọn bộ phận" (department_select, tự động theo Nhóm thành viên) — Sếp xác nhận đây là nguồn đúng. */
  phongBan: string;
  vatTu: VatTuTuAppRequest[];
  taiLieuDinhKem?: TaiLieuTuAppRequest[];
};

export type KetQuaNhanDeNghiTuAppRequest =
  | { ok: true; trangThai: "da_tao"; deNghiId: string; maDeNghi: string }
  | { ok: true; trangThai: "da_ton_tai"; deNghiId: string; maDeNghi: string }
  | { ok: false; error: string };
