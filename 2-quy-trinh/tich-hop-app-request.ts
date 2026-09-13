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
 * ★ DẤU PHÂN CÁCH GIỮA "Mã hợp đồng CĐT" VÀ "Tên công trình" trong chuỗi App Request gửi.
 *
 * 🔴 VÌ SAO CÓ NHIỀU DẤU (13/09/2026 — SỰ CỐ ĐO ĐƯỢC, không phải phòng xa):
 * App Request gửi sang đề nghị `000000078` với chuỗi `"26002/HDXD | Nhà xưởng Howell"` — dùng
 * THANH ĐỨNG chứ không phải gạch ngang. Bản cũ chỉ biết `" - "` nên không tách được, dồn NGUYÊN
 * CẢ CHUỖI vào "Tên công trình" và để "Số hợp đồng CĐT" trống. Ban lãnh đạo phát hiện trên giao
 * diện: *"chỗ này sao lại bị gộp tên hđ với tên công trình vậy"*.
 *
 * 📌 CHỈ HAI DẤU, mỗi dấu một luật riêng, cố ý:
 *   · `|` — tách kể cả khi KHÔNG có khoảng trắng (`"A|B"`). Thanh đứng gần như không bao giờ là
 *     một phần của mã hợp đồng hay tên công trình, nên nhận rộng là an toàn.
 *   · `-` — BẮT BUỘC có khoảng trắng hai bên. Đây là luật gốc của phiên tích hợp và PHẢI GIỮ:
 *     mã hợp đồng thật có gạch ngang bên trong (`UNICE-HPCS`), nhận dấu `-` trần là cắt nhầm
 *     giữa mã.
 *
 * 🔴 KHÔNG NHẬN `–` (en dash) VÀ `—` (em dash) — ĐÃ THỬ RỒI BỎ, ngày 13/09/2026. Lý do thêm
 * chúng là "Word/Excel tự đổi `-` thành chúng"; lý do bỏ mạnh hơn hẳn: gạch dài là dấu NGẮT CÂU
 * thông dụng trong tên tiếng Việt. Quét dữ liệu thật cùng ngày bắt được ngay một ca:
 *     "Nhà xưởng ABC — Giai đoạn 2"
 * nhận `—` là cắt thành mã hợp đồng `"Nhà xưởng ABC"` + tên công trình `"Giai đoạn 2"` — sai
 * hoàn toàn, và sai IM LẶNG. Chưa từng thấy App Request gửi gạch dài làm dấu ngăn; đừng thêm
 * lại khi chưa có ca thật.
 *
 * ⚠️ Lấy dấu xuất hiện SỚM NHẤT trong chuỗi, bất kể là dấu nào — vì mã hợp đồng luôn đứng trước.
 * `"26002/HDXD | Nhà xưởng - Howell"` phải tách ở `|` (vị trí 11), không phải ở `" - "`.
 */
const DAU_PHAN_CACH_CONG_TRINH = /\s*\|\s*|\s+-\s+/;

/**
 * Tách chuỗi công trình App Request gửi (quy ước "Mã hợp đồng - Tên công trình", vd
 * `"30/2025/HĐXD/UNICE-HPCS - UNICE QUẢNG NGÃI"`, hoặc "Mã hợp đồng | Tên công trình" như
 * `"26002/HDXD | Nhà xưởng Howell"`) thành 2 phần.
 *
 * Trả `null` nếu chuỗi rỗng — đây CHÍNH LÀ dấu hiệu "đề xuất của một phòng ban, không gắn
 * công trình nào" mà Sếp mô tả, KHÔNG coi là lỗi.
 *
 * ⚠️ KHÔNG tách theo dấu `-` trần, vì mã hợp đồng thật có thể chứa dấu gạch ngang riêng (vd
 * `UNICE-HPCS`), và KHÔNG tách theo gạch dài `–` `—` vì đó là dấu ngắt câu trong tên. Chỉ tách ở
 * lần gặp dấu phân cách ĐẦU TIÊN — tên công trình phía sau vẫn được giữ nguyên dù có chứa dấu
 * phân cách khác. Xem `DAU_PHAN_CACH_CONG_TRINH` ngay trên.
 *
 * ⚠️ Không tách được thì DỒN CẢ CHUỖI vào `tenCongTrinh` (giữ nguyên hành vi cũ) — thà để tên
 * dài còn hơn đoán bừa ra một mã hợp đồng không có thật.
 */
export function tachCongTrinhTuChuoi(congTrinhChuoi: string | undefined | null): CongTrinhTuChuoi | null {
  const chuoi = congTrinhChuoi?.trim();
  if (!chuoi) return null;

  const khop = chuoi.match(DAU_PHAN_CACH_CONG_TRINH);
  if (!khop || khop.index === undefined) return { tenCongTrinh: chuoi };

  const maHopDongCDT = chuoi.slice(0, khop.index).trim();
  const tenCongTrinh = chuoi.slice(khop.index + khop[0].length).trim();
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
