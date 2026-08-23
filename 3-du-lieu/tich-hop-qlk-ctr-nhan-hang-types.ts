// ============================================================
// HỢP ĐỒNG DỮ LIỆU — QLK CTR gọi sang App Thu mua khi thủ kho ghi nhận nhập kho
//
// Mirror đúng khuôn `DeNghiMoiTuAppRequest` (tich-hop-app-request-types.ts) — cùng cách làm:
// route mới, transaction an toàn, chống trùng theo khóa ngoài.
//
//   POST {THUMUA_URL}/api/qlk-ctr/phieu-nhan-moi
//   Header: x-api-key: <QLKCTR_PHIEU_NHAN_API_KEY nếu Thu mua đã cấu hình>
//   Body: PhieuNhanMoiTuQlkCtr (JSON)
//
// Mục tiêu: thủ kho ghi nhận nhập kho + tải ảnh MỘT LẦN DUY NHẤT ở QLK CTR — Thu mua tự có
// phiếu nhận hàng tương ứng, không ai phải ghi tay lần 2 ở đây.
//
// Ảnh: QLK CTR gửi THẲNG ĐƯỜNG LINK (không gửi nội dung file) — vì App Thu mua có kho tệp
// riêng (chia mảnh base64 trong Firestore, xem 3-du-lieu/kho-tep-firestore.ts) không có chỗ
// chứa link ngoài, và việc bắt QLK CTR tự ghi đúng định dạng chia mảnh đó là rủi ro không
// đáng — link do QLK CTR tự host, xem được trực tiếp qua /api/files/{key}, không cần đăng
// nhập (xác nhận đã có sẵn phía QLK CTR, 23/08/2026).
// ============================================================

export type DongNhanHangTuQlkCtr = {
  /** Khớp theo TÊN với DongPO.tenVatLieu trong đúng PO (không theo số thứ tự) — ổn định hơn
   *  vì cả 2 hệ thống đều có sẵn tên vật tư gốc từ cùng 1 đề nghị. */
  tenVatLieu: string;
  /** Của CHÍNH LẦN NÀY, không phải cộng dồn — khớp đúng quy ước PhieuNhanHang.lines. */
  khoiLuongThucNhan: number;
};

export type AnhTuQlkCtr = {
  ten: string;
  /** Link xem trực tiếp, do QLK CTR tự host — KHÔNG phải nội dung file. */
  url: string;
};

export type PhieuNhanMoiTuQlkCtr = {
  /** = DonDatHang.code — khóa tìm đúng PO. */
  poCode: string;
  /** Khóa chống trùng khi QLK CTR gọi lại (retry do mạng lỗi) — nên dùng id lần nhập kho
   *  bên QLK CTR (ổn định, không đổi). */
  maPhieuNhanQlkCtr: string;
  /** ISO "YYYY-MM-DD". */
  ngayNhanThucTe: string;
  nguoiNhanTen: string;
  soPhieuGiaoNCC?: string;
  lines: DongNhanHangTuQlkCtr[];
  anhQlkCtr?: AnhTuQlkCtr;
};

export type KetQuaNhanPhieuTuQlkCtr =
  | { ok: true; trangThai: "da_tao"; phieuId: string; phieuCode: string }
  | { ok: true; trangThai: "da_ton_tai"; phieuId: string; phieuCode: string }
  | { ok: false; error: string };
