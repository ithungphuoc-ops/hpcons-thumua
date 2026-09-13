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
 *
 * ════════════════════════════════════════════════════════════════════════════════════
 * ★ PHẦN MỞ RỘNG 13/09/2026 — NHẬN THÊM DẤU THANH ĐỨNG `|`
 *
 * 🔴 CHỈ THÊM, KHÔNG XOÁ. Chỉ đạo Sếp 13/09/2026: *"không được xoá dòng của phiên tích
 * hợp, e chỉ được mở rộng thôi"*. Nên mọi dòng của phiên tích hợp phía trên và phía dưới
 * đều còn nguyên từng ký tự; phần thêm là một khối `if` đứng TRƯỚC, và khi không khớp thì
 * rơi xuống đúng mã gốc của họ.
 *
 * VÌ SAO CẦN: App Request gửi đề nghị `000000078` với chuỗi
 *     "26002/HDXD | Nhà xưởng Howell"
 * — dùng THANH ĐỨNG chứ không phải gạch ngang. Mã gốc chỉ biết `" - "` nên không tách
 * được, dồn NGUYÊN CẢ CHUỖI vào "Tên công trình" và để "Số hợp đồng CĐT" trống. Ban lãnh
 * đạo phát hiện trên màn hình: *"chỗ này sao lại bị gộp tên hđ với tên công trình vậy"*.
 *
 * 📌 `|` tách kể cả khi KHÔNG có khoảng trắng (`"A|B"`) — khác luật của `" - "`, và cố ý:
 * thanh đứng gần như không bao giờ nằm trong mã hợp đồng hay tên công trình, nên nhận rộng
 * là an toàn. Còn dấu `-` thì vẫn phải có khoảng trắng hai bên — **luật đó là của phiên
 * tích hợp, không đụng tới**, vì mã hợp đồng thật có gạch ngang bên trong (`UNICE-HPCS`).
 *
 * ⚠️ Vẫn lấy dấu xuất hiện SỚM NHẤT — điều kiện `viTriOng < viTriGachCu` ở dưới giữ đúng
 * điều đó, vì mã hợp đồng luôn đứng trước. `"A - B | C"` vẫn tách ở `" - "` như cũ.
 *
 * 🔴 KHÔNG NHẬN `–` (en dash) VÀ `—` (em dash) — ĐÃ THỬ RỒI BỎ cùng ngày. Lý do thêm chúng
 * là "Word/Excel tự đổi `-` thành chúng"; lý do bỏ mạnh hơn hẳn: gạch dài là dấu NGẮT CÂU
 * thông dụng trong tên tiếng Việt. Quét dữ liệu thật bắt được ngay một ca:
 *     "Nhà xưởng ABC — Giai đoạn 2"
 * nhận `—` là cắt thành mã hợp đồng `"Nhà xưởng ABC"` + tên `"Giai đoạn 2"` — sai hoàn
 * toàn, và sai IM LẶNG. Chưa từng thấy App Request gửi gạch dài làm dấu ngăn; đừng thêm
 * lại khi chưa có ca thật.
 * ════════════════════════════════════════════════════════════════════════════════════
 */
export function tachCongTrinhTuChuoi(congTrinhChuoi: string | undefined | null): CongTrinhTuChuoi | null {
  const chuoi = congTrinhChuoi?.trim();
  if (!chuoi) return null;

  /* ★ THÊM 13/09/2026 — nhánh dấu `|`. Không khớp thì rơi xuống mã gốc bên dưới, nguyên vẹn. */
  const viTriOng = chuoi.indexOf("|");
  const viTriGachCu = chuoi.indexOf(" - ");
  if (viTriOng !== -1 && (viTriGachCu === -1 || viTriOng < viTriGachCu)) {
    const maTheoOng = chuoi.slice(0, viTriOng).trim();
    const tenTheoOng = chuoi.slice(viTriOng + 1).trim();
    return { maHopDongCDT: maTheoOng || undefined, tenCongTrinh: tenTheoOng || chuoi };
  }

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
