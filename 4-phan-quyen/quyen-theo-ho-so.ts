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

/**
 * ★ CÓ ĐƯỢC NHÂN BẢN (TÁCH) ĐỀ NGHỊ NÀY KHÔNG.
 *
 * 🔴 Ban lãnh đạo 15/08/2026: *"nhân viên được phép nhân bản phiếu đề nghị **mà mình phụ
 * trách**"*.
 *
 * Hai đường được tách:
 *   1. Cấp quản lý (`xemMoiHoSo` — trưởng bộ phận, quản trị): tách được mọi phiếu, vì họ là
 *      người chia việc cho cả phòng.
 *   2. Nhân viên ĐƯỢC CHIA VIỆC trong chính phiếu đó — tự tách phần việc của mình ra để giao
 *      lại cho người phù hợp, không phải chờ trưởng bộ phận làm hộ.
 *
 * ⚠️ Trước 15/08/2026 chỉ xét cấp (`lapPO`), nên một nhân viên tách được cả phiếu của người
 * khác — phiếu đang chạy tự nhiên mọc thêm bản sao mà người phụ trách không hay.
 *
 * ⚠️ Vẫn phải qua `quyen.lapPO`: vai trò chỉ được xem (thủ kho, Phòng Thi công, Kế toán)
 * thì không tạo được hồ sơ mới dưới bất kỳ hình thức nào.
 */
export function duocNhanBanDeNghi(
  deNghi: DeNghiMuaHang,
  uid: string,
  quyen: Quyen,
): boolean {
  if (!quyen.lapPO) return false;
  if (quyen.xemMoiHoSo) return true;
  return duocChiaViec(deNghi, uid);
}

/**
 * NHỮNG DÒNG VẬT TƯ NGƯỜI NÀY ĐƯỢC NHÌN THẤY trong một đề nghị.
 *
 * 🔴 Chỉ đạo Ban lãnh đạo 12/08/2026: *"chỉ cần hiện công việc được phân công, không cần
 * hiển thị toàn bộ danh mục request"*.
 *
 * Trước đó nhân viên được giao 1 dòng vẫn nhìn thấy **cả 3 dòng** của đề nghị và nhập được
 * giá cho cả 3 — vừa lộ phần việc của đồng nghiệp, vừa dễ nhập nhầm vào dòng người khác
 * đang phụ trách.
 *
 * Luật:
 *   · Cấp quản lý trở lên (`xemMoiHoSo`) → thấy hết. Trưởng bộ phận phải nhìn toàn cảnh
 *     mới phân bổ và duyệt được.
 *   · Còn lại → chỉ thấy dòng ghi tên mình phụ trách.
 *
 * ⚠️ Người CHƯA được giao dòng nào sẽ nhận về danh sách RỖNG. Nơi gọi phải hiện câu giải
 * thích tử tế, đừng để màn hình trắng trơn — người dùng sẽ tưởng app hỏng.
 *
 * 📌 Trả về mảng số thứ tự dòng (`stt`) để nơi gọi tự lọc theo cấu trúc của mình: bảng
 * phân bổ lọc `deNghi.items`, còn bảng báo giá lọc theo `sttDongDeNghi`.
 */
export function sttDongDuocXem(
  deNghi: DeNghiMuaHang,
  uid: string,
  quyen: Quyen,
): number[] {
  if (quyen.xemMoiHoSo) return deNghi.items.map((d) => d.stt);
  return deNghi.items.filter((d) => d.nguoiPhuTrachUid === uid).map((d) => d.stt);
}

/**
 * AI ĐƯỢC CHUYỂN VIỆC của một dòng vật tư sang người khác.
 *
 * 🔴 SIẾT LẠI 15/08/2026 — Ban lãnh đạo: *"tài khoản của nhân viên thì không được có chức
 * năng này, chỉ cấp quản lý và cấp quản trị mới có quyền giao lại việc cho người khác"*.
 *
 * Chỉ `quyen.phanBoCongViec` (Trưởng bộ phận cấp 3 trở lên · Quản trị hệ thống).
 *
 * ⚠️ ĐỔI SO VỚI CHỈ ĐẠO 12/08/2026. Trước đó **chính người đang phụ trách** cũng tự chuyển
 * được, với lý lẽ "người biết mình không làm được là chính họ". Ban lãnh đạo cân nhắc lại và
 * quyết theo hướng chặt hơn: giao việc cho ai là quyết định của người điều phối, để nhân
 * viên tự đẩy việc qua lại thì trưởng bộ phận không còn nắm được ai đang làm gì.
 *
 * 📌 Nhân viên không làm được thì báo trưởng bộ phận — họ có nút này. Đường đi dài hơn một
 * nhịp, nhưng người chịu trách nhiệm phân công vẫn là người quyết.
 *
 * ⚠️ Tham số `dong` và `uid` GIỮ LẠI dù không còn dùng để xét: chữ ký hàm là chỗ mọi nơi gọi
 * đang bám vào, và nếu Ban lãnh đạo mở lại quyền cho người phụ trách thì chỉ sửa đúng thân
 * hàm này. Đổi chữ ký chỉ để bớt hai tham số là đụng vào mọi nơi gọi, lợi bất cập hại.
 */
export function duocChuyenViecDong(
  _dong: { nguoiPhuTrachUid?: string },
  _uid: string,
  quyen: Quyen,
): boolean {
  return quyen.phanBoCongViec;
}

/** Có bị giấu bớt dòng nào không — để giao diện nói rõ "đang chỉ hiện phần của bạn". */
export function coLocTheoPhanViec(
  deNghi: DeNghiMuaHang,
  uid: string,
  quyen: Quyen,
): boolean {
  return sttDongDuocXem(deNghi, uid, quyen).length < deNghi.items.length;
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
