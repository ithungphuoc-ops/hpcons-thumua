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
//
// ★★ SỬA CÓ PHÉP CỦA SẾP — 08/10/2026 ("Sửa lần nhập", Sếp duyệt demo rồi "code đi"): thêm
// `cheDo` / `maPhieuDuPhong` / `lanSua` để App Kho SỬA hoặc XOÁ phiếu đã gửi qua CÙNG cửa này —
// chỉ khi đơn chưa "Xác nhận nhận hàng". Vắng `cheDo` = "tao" — y hệt hành vi cũ.
// ============================================================

import type { LanSuaPhieuTuKho } from "@/3-du-lieu/kieu-du-lieu";

/**
 * - `tao` (mặc định): tạo phiếu mới, gửi lại thì trả `da_ton_tai` — hành vi từ 23/08/2026.
 * - `kiem_tra`: chỉ hỏi — đã có phiếu chưa, đơn đã "Xác nhận nhận hàng" chưa. Không ghi gì.
 * - `cap_nhat`: ghi đè phiếu đã có bằng bản Kho vừa sửa (chưa có thì tạo như `tao`).
 * - `xoa`: Kho xoá lần nhập → bỏ phiếu (không còn phiếu thì coi như xong).
 * `cap_nhat`/`xoa` bị TỪ CHỐI khi đơn đã "Xác nhận nhận hàng" (`loai: "da_xac_nhan"`).
 */
export type CheDoPhieuNhanTuQlkCtr = "tao" | "kiem_tra" | "cap_nhat" | "xoa";

export type DongNhanHangTuQlkCtr = {
  /** Khớp theo TÊN với DongPO.tenVatLieu trong đúng PO (không theo số thứ tự) — ổn định hơn
   *  vì cả 2 hệ thống đều có sẵn tên vật tư gốc từ cùng 1 đề nghị. */
  tenVatLieu: string;
  /** Của CHÍNH LẦN NÀY, không phải cộng dồn — khớp đúng quy ước PhieuNhanHang.lines. */
  khoiLuongThucNhan: number;
  /** Khớp DongPO.thongSoKyThuat — BẮT BUỘC dùng để phân biệt khi 1 PO có nhiều dòng CÙNG
   *  tenVatLieu nhưng khác quy cách (vd "Ống nước" D34 và D90). QLK CTR gửi kèm từ 29/08/2026
   *  sau sự cố PO DMH260002: so khớp chỉ theo tên gán nhầm khối lượng sang dòng khác, kích
   *  hoạt nhầm chặn "vượt quá số lượng" làm rollback cả phiếu. */
  thongSoKyThuat?: string;
  /** (28/09/2026) Khi kho quy đổi ĐVT lúc nhập (vd PO tính Cây, kho đếm Bó): số + ĐVT đã quy đổi
   *  — CHỈ để HIỂN THỊ tham khảo. Tiến độ/đã nhận của Thu mua vẫn tính theo khoiLuongThucNhan
   *  (ĐVT của PO). Vắng mặt = lần nhập không quy đổi. */
  soLuongQuyDoi?: number;
  dvtQuyDoi?: string;
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
  /** Bắt buộc có dòng với `tao`/`cap_nhat`; `kiem_tra`/`xoa` gửi mảng rỗng được. */
  lines: DongNhanHangTuQlkCtr[];
  anhQlkCtr?: AnhTuQlkCtr;
  /** (08/10/2026) Vắng = "tao". */
  cheDo?: CheDoPhieuNhanTuQlkCtr;
  /** (08/10/2026) Mã khác mà phiếu có thể đã mang — lần nhập cũ bên Kho gửi bằng 1 trong 2 kiểu mã
   *  (mã chuyến giao hoặc mã lần nhập). Dò trùng/tìm phiếu theo CẢ `maPhieuNhanQlkCtr` lẫn các mã này. */
  maPhieuDuPhong?: string[];
  /** (08/10/2026) Bắt buộc với `cap_nhat`/`xoa`: ai sửa, lúc nào, sửa gì, lý do. */
  lanSua?: LanSuaPhieuTuKho;
};

export type KetQuaNhanPhieuTuQlkCtr =
  | { ok: true; trangThai: "da_tao"; phieuId: string; phieuCode: string; maKhop?: string }
  | { ok: true; trangThai: "da_ton_tai"; phieuId: string; phieuCode: string; maKhop?: string }
  | { ok: true; trangThai: "da_cap_nhat"; phieuId: string; phieuCode: string; maKhop: string }
  | { ok: true; trangThai: "da_xoa"; phieuCode?: string }
  | {
      ok: true;
      trangThai: "kiem_tra";
      coPO: boolean;
      coPhieu: boolean;
      daXacNhan: boolean;
      maKhop?: string;
      phieuCode?: string;
    }
  | { ok: false; error: string; loai?: "da_xac_nhan" };
