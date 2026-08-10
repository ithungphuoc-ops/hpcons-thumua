// ============================================================
// QUYỀN THEO TỪNG HỒ SƠ — khác quyền theo CẤP
//
// `quyen.ts` trả lời "cấp này có được xem báo giá không". File này trả lời câu hẹp hơn:
// "người này có được xem báo giá CỦA ĐỀ NGHỊ NÀY không".
//
// 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 10/08/2026: *"Chỉ nhân viên nào được chia việc thì mới xem được
// báo giá, hoặc được thêm vào mục người theo dõi"*.
//
// Vì sao cần: báo giá chứa ĐƠN GIÁ của nhiều nhà cung cấp — thông tin thương mại nhạy cảm
// nhất của phòng thu mua. Cho cả phòng xem thì ai cũng biết giá của mọi công trình, kể cả
// việc mình không tham gia.
//
// ⚠️ ĐÂY CHƯA PHẢI BẢO MẬT THẬT. Nó chỉ chặn ở giao diện. Khi nối Firestore, phải chặn
// bằng Security Rules ở mức document (xem nguyên tắc dữ liệu số 3 trong CLAUDE.md) — ẩn
// trên giao diện thì người biết đường vẫn đọc được dữ liệu qua API.
// ============================================================

import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";
import type { Quyen } from "@/4-phan-quyen/quyen";

/** Người này có được chia việc trong đề nghị (phụ trách ít nhất một dòng vật tư) không. */
export function duocChiaViec(deNghi: DeNghiMuaHang, uid: string): boolean {
  return deNghi.items.some((d) => d.nguoiPhuTrachUid === uid);
}

/** Người này có tên trong danh sách người theo dõi của đề nghị không. */
export function laNguoiTheoDoi(deNghi: DeNghiMuaHang, uid: string): boolean {
  return deNghi.nguoiTheoDoi?.some((n) => n.uid === uid) ?? false;
}

/**
 * Có được xem bảng báo giá của đề nghị này không.
 *
 * Ba đường được xem:
 *   1. Cấp quản lý trở lên (`xemMoiHoSo`) — trưởng bộ phận phải xem hết để duyệt.
 *   2. Được chia việc trong đề nghị.
 *   3. Được thêm vào mục người theo dõi.
 *
 * ⚠️ Vẫn phải qua `quyen.xemBaoGia` trước: cấp không được xem báo giá thì dù có được chia
 * việc cũng không mở được (vd thủ kho, Phòng Thi công).
 */
export function duocXemBaoGiaCuaDeNghi(
  deNghi: DeNghiMuaHang,
  uid: string,
  quyen: Quyen,
): boolean {
  if (!quyen.xemBaoGia) return false;
  if (quyen.xemMoiHoSo) return true;
  return duocChiaViec(deNghi, uid) || laNguoiTheoDoi(deNghi, uid);
}

/** Lý do bị chặn, để nói cho người dùng biết phải làm gì. Trả `null` khi được xem. */
export function lyDoKhongXemBaoGia(
  deNghi: DeNghiMuaHang,
  uid: string,
  quyen: Quyen,
): string | null {
  if (duocXemBaoGiaCuaDeNghi(deNghi, uid, quyen)) return null;
  if (!quyen.xemBaoGia) {
    return "Cấp quyền của bạn không được xem bảng báo giá.";
  }
  return "Bảng báo giá chỉ mở cho người được chia việc trong đề nghị này, hoặc người được thêm vào mục người theo dõi. Đề nghị trưởng bộ phận phân bổ việc cho bạn hoặc thêm bạn vào người theo dõi.";
}
