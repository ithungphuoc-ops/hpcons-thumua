// ============================================================
// LIÊN KẾT VỚI APP REQUEST — QUY TẮC BIẾN ĐỔI DỮ LIỆU
//
// Việc 1 (Sếp chốt 19/08/2026): App Thu mua nhận TẤT CẢ đề xuất đã duyệt từ App Request —
// cả đề xuất gắn công trình VÀ đề xuất riêng của một phòng ban (không gắn công trình nào).
// Khác App Kho (QLK CTR): Thu mua KHÔNG so khớp/gate theo công trình, nhận nguyên trạng.
//
// Hàm ở đây đều là HÀM THUẦN (không đụng Firestore, không đụng giao diện) — để test được
// độc lập và để route handler (`app/api/app-request/de-nghi-moi/route.ts`) gọi vào.
// ============================================================

import { maPhongBanTuTen, type MaPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";

export interface CongTrinhTuChuoi {
  maHopDongCDT?: string;
  tenCongTrinh: string;
}

/**
 * Tách chuỗi công trình App Request gửi (quy ước "Mã hợp đồng - Tên công trình", vd
 * `"30/2025/HĐXD/UNICE-HPCS - UNICE QUẢNG NGÃI"`) thành 2 phần.
 *
 * Trả `null` nếu chuỗi rỗng — đây CHÍNH LÀ dấu hiệu "đề xuất của một phòng ban, không gắn
 * công trình nào" mà Sếp mô tả, KHÔNG coi là lỗi.
 *
 * ⚠️ Tách theo `" - "` (có khoảng trắng hai bên) — KHÔNG tách theo dấu `-` trần, vì mã hợp
 * đồng thật có thể chứa dấu gạch ngang riêng (vd `UNICE-HPCS`). Chỉ tách ở lần gặp `" - "`
 * ĐẦU TIÊN — tên công trình phía sau vẫn được giữ nguyên dù có chứa `" - "` khác.
 */
export function tachCongTrinhTuChuoi(congTrinhChuoi: string | undefined | null): CongTrinhTuChuoi | null {
  const chuoi = congTrinhChuoi?.trim();
  if (!chuoi) return null;

  const viTri = chuoi.indexOf(" - ");
  if (viTri === -1) return { tenCongTrinh: chuoi };

  const maHopDongCDT = chuoi.slice(0, viTri).trim();
  const tenCongTrinh = chuoi.slice(viTri + 3).trim();
  return { maHopDongCDT: maHopDongCDT || undefined, tenCongTrinh: tenCongTrinh || chuoi };
}

/**
 * ⚠️ ĐIỂM CÒN TREO, ĐÃ BÁO SẾP (chưa có câu trả lời khác): App Request không có danh mục
 * "mã dự án ngắn" chuẩn Thông báo 09/2026 (vd `260001-HPCS`) — chỉ có chuỗi tự do. Đang tạm
 * dùng THẲNG phần mã hợp đồng tách được (hoặc cả chuỗi, nếu không tách được) làm "mã dự án"
 * để app còn có cái đặt số hồ sơ. Sếp có nguồn mã dự án ngắn chuẩn ở đâu thì đổi lại chỗ NÀY
 * — một chỗ duy nhất, không phải sửa route handler.
 */
export function xacDinhMaDuAnTamThoi(congTrinh: CongTrinhTuChuoi | null, maPhongBan: MaPhongBan): string {
  if (!congTrinh) return `PB-${maPhongBan}`;
  return congTrinh.maHopDongCDT || congTrinh.tenCongTrinh;
}

/**
 * Quy đổi tên phòng ban tự do (từ field "Chọn bộ phận" bên App Request) sang mã phòng ban
 * chuẩn của Thu mua. Không khớp được thì GIỮ NGUYÊN chuỗi gốc — `MaPhongBan` là kiểu mở
 * (`string`), nên phòng ban lạ vẫn lưu được, chỉ là chưa có nhãn đẹp trong `nhanPhongBan()`.
 */
export function quyDoiPhongBan(tenPhongBanTuAppRequest: string | undefined | null): MaPhongBan {
  const ten = tenPhongBanTuAppRequest?.trim();
  if (!ten) return "";
  return maPhongBanTuTen(ten) ?? ten;
}
