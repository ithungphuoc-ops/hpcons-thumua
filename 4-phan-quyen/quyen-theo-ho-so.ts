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
 * 🔴 Chỉ đạo Ban lãnh đạo 12/08/2026: *"Chỉ thêm tính năng chuyển công việc cho nhân viên
 * khác khi nhân viên được giao việc không thể thực hiện"*.
 *
 * Hai người được chuyển:
 *   1. Trưởng bộ phận (`phanBoCongViec`) — chuyển được mọi dòng, họ là người điều phối.
 *   2. **Chính người đang phụ trách dòng đó** — đây là điểm mới. Người biết mình không làm
 *      được là chính họ; bắt phải chờ trưởng bộ phận rảnh mới chuyển được thì việc nằm đó,
 *      và họ sẽ gọi điện nhờ chuyển — đúng thứ app sinh ra để bỏ.
 *
 * ⚠️ KHÔNG cho người ngoài chuyển việc của người khác. Không có ràng buộc này thì bất kỳ
 * nhân viên nào cũng đẩy được việc của đồng nghiệp đi, không ai chịu trách nhiệm.
 */
export function duocChuyenViecDong(
  dong: { nguoiPhuTrachUid?: string },
  uid: string,
  quyen: Quyen,
): boolean {
  if (quyen.phanBoCongViec) return true;
  return Boolean(dong.nguoiPhuTrachUid) && dong.nguoiPhuTrachUid === uid;
}

/** Có bị giấu bớt dòng nào không — để giao diện nói rõ "đang chỉ hiện phần của bạn". */
export function coLocTheoPhanViec(
  deNghi: DeNghiMuaHang,
  uid: string,
  quyen: Quyen,
): boolean {
  return sttDongDuocXem(deNghi, uid, quyen).length < deNghi.items.length;
}

/**
 * AI ĐƯỢC BẤM "NHẬN CÔNG TÁC" — trả về lý do bị chặn, `null` nghĩa là được nhận.
 *
 * 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 10/08/2026: *"sao trưởng bộ phận chưa duyệt mà nhân viên tự bấm
 * nhận việc được"*. Trước đây nút chỉ đòi `quyen.lapPO` (cấp 2 trở lên) nên nhân viên nhận
 * được cả việc CHƯA ĐƯỢC CHIA cho mình — tên họ ghi vào nhật ký như người tiếp quản một
 * việc không ai giao.
 *
 * Luật theo đúng phân vai của quy trình:
 *   · Bước ① "Tiếp nhận và kiểm tra" — việc của TRƯỞNG BỘ PHẬN (kiểm tra + phân bổ người
 *     phụ trách). Nhân viên chưa có vai gì ở bước này nên không nhận được.
 *   · Các bước sau — nhân viên chỉ nhận khi ĐÃ ĐƯỢC CHIA VIỆC trong đề nghị (trưởng bộ
 *     phận phân bổ xong mới tới lượt họ). Trưởng bộ phận luôn nhận được.
 *
 * ⚠️ Dùng ở CẢ chuông thông báo lẫn thẻ trên bảng quy trình — một luật, mọi đường dùng
 * chung, cùng lý do với `vuongMacSangBuocSau`.
 */
export function lyDoKhongNhanCongTac(
  deNghi: DeNghiMuaHang,
  denBuoc: string,
  uid: string,
  quyen: Quyen,
): string | null {
  if (denBuoc === "tiep_nhan") {
    return quyen.phanBoCongViec
      ? null
      : "Bước “Tiếp nhận và kiểm tra” là việc của trưởng bộ phận — kiểm tra đề nghị và phân bổ người phụ trách. Bạn sẽ nhận việc sau khi được phân bổ.";
  }
  if (!quyen.lapPO) {
    return "Cấp quyền của bạn không thao tác được nghiệp vụ thu mua.";
  }
  if (quyen.phanBoCongViec || duocChiaViec(deNghi, uid)) return null;
  return "Bạn chưa được phân bổ dòng vật tư nào trong đề nghị này. Trưởng bộ phận phân bổ xong bạn mới nhận việc được.";
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
