// ============================================================
// CHUYỂN BẢN MẪU ĐƠN MUA HÀNG SANG TAB IN — chỗ cất TẠM, không phải kho dữ liệu
//
// 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 18/08/2026: *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*.
//
// VIỆC DUY NHẤT CỦA FILE NÀY: form lập đơn (`/don-hang/tao-moi`) dựng một đơn tạm trong bộ nhớ
// rồi mở tab in `/in/don-hang-mau`. Hai tab là hai ngữ cảnh JavaScript khác nhau nên không
// truyền thẳng biến sang được — phải đi qua chỗ cất tạm của trình duyệt.
//
// 🔴 ĐÂY KHÔNG PHẢI DỮ LIỆU NGHIỆP VỤ. Bản mẫu không được cất vào hệ thống, không có mã hồ sơ,
//    không ai tra cứu lại. Nó chỉ sống đủ lâu để tab in đọc xong rồi bị xóa ngay.
//
// ⚠️ VÌ SAO KHÔNG MỞ TAB IN THEO ID NHƯ ĐƠN THẬT: `/in/don-hang/[id]` là trang TĨNH, chỉ sinh
//    sẵn cho danh sách id khai trong `generateStaticParams`. Bịa một id tạm là ra 404. Bản mẫu
//    vì vậy dùng một địa chỉ CỐ ĐỊNH không có tham số, và dữ liệu đi qua đây.
//
// ⚠️ VÌ SAO KHÔNG ĐIỀU HƯỚNG NGAY TRONG TAB ĐANG GÕ: rời khỏi `/don-hang/tao-moi` là form bị
//    tháo khỏi cây React, **mất sạch mọi ô người lập vừa gõ** và không có nút hoàn lại. Mở tab
//    mới thì form vẫn nguyên, in xong đóng tab là quay lại chỗ cũ.
//
// 🔴 VÌ SAO GHI CẢ HAI CHỖ (`sessionStorage` VÀ `localStorage`) — mỗi chỗ hụt một kiểu:
//    · `sessionStorage` là chỗ ĐÚNG NGHĨA (bản nháp một phiên, tự mất khi đóng trình duyệt, và
//      KHÔNG ăn vào hạn mức ~5MB của `localStorage` đang giữ toàn bộ dữ liệu nghiệp vụ). Trình
//      duyệt chép nó sang tab mở bằng `window.open` — nhưng đó là hành vi phụ thuộc trình duyệt
//      và mất khi có `rel="noopener"`.
//    · `localStorage` thì chắc chắn chung cho mọi tab, nhưng ghi vào đó lúc gần đầy sẽ ném
//      `QuotaExceededError`.
//    Ghi cả hai, đọc theo thứ tự `sessionStorage` → `localStorage`: hụt chỗ nào vẫn còn chỗ kia.
//    Chỉ báo hỏng khi CẢ HAI đều ghi không được — và lúc đó phải nói ra, không nuốt lỗi.
// ============================================================

import type { DonDatHang, GiaDonDatHang, NhaCungCap } from "@/3-du-lieu/kieu-du-lieu";

/** Khóa cất tạm. Đặt tiền tố `tm-` như mọi khóa khác của app để không đụng app anh em. */
const KHOA = "tm-ban-mau-don-mua-hang";

/**
 * Bản mẫu quá hạn thì coi như không có.
 *
 * 🔴 VÌ SAO CẦN: không có chốt này thì mở thẳng `/in/don-hang-mau` bằng dấu trang, hoặc mở lại
 * tab in cũ, sẽ in ra bản mẫu của **lần trước** — người dùng tưởng đang in cái vừa gõ. In nhầm
 * một chứng từ có giá là chuyện không sửa được sau khi đã gửi đi.
 *
 * 10 phút là rộng rãi cho việc bấm nút rồi tab mới tải xong, mà vẫn đủ ngắn để không ai kịp
 * quay lại nhầm.
 */
const HAN_MS = 10 * 60 * 1000;

export interface BanMauDonMuaHang {
  po: DonDatHang;
  gia: GiaDonDatHang;
  ncc?: NhaCungCap;
  /** Thời điểm cất, `Date.now()`. Dùng để bỏ bản mẫu quá hạn — xem `HAN_MS`. */
  luc: number;
}

/**
 * Cất bản mẫu để tab in đọc. Trả `false` khi KHÔNG cất được ở cả hai chỗ.
 *
 * 🔴 PHẢI XEM GIÁ TRỊ TRẢ VỀ. Cất hỏng mà vẫn mở tab in thì tab đó hiện "không tìm thấy bản
 * mẫu" — người dùng không hiểu vì sao và tưởng app hỏng. Nơi gọi phải báo lỗi tại chỗ.
 */
export function catBanMauDonMuaHang(ban: Omit<BanMauDonMuaHang, "luc">): boolean {
  if (typeof window === "undefined") return false;
  const chu = JSON.stringify({ ...ban, luc: Date.now() } satisfies BanMauDonMuaHang);

  let daCat = false;
  for (const kho of [window.sessionStorage, window.localStorage]) {
    try {
      kho.setItem(KHOA, chu);
      daCat = true;
    } catch (loi) {
      // 🔴 GHI RA CONSOLE, không nuốt. Nguyên nhân hay gặp nhất là hết dung lượng
      // `localStorage`; nuốt lỗi thì không cách nào chẩn đoán khi người dùng báo hỏng.
      console.error("[bản mẫu PO] không cất được vào một kho tạm:", loi);
    }
  }
  return daCat;
}

/**
 * Đọc bản mẫu rồi **XÓA NGAY**.
 *
 * 🔴 XÓA LÀ CỐ Ý, không phải dọn dẹp cho gọn. Để lại thì lần sau mở `/in/don-hang-mau` (bấm
 * nhầm dấu trang, hoặc F5 tab in cũ) sẽ in lại bản mẫu cũ mà không ai biết. Người dùng đọc
 * xong tab in thì bản mẫu đã hoàn thành nhiệm vụ; muốn in lại thì bấm nút trên form lần nữa.
 *
 * ⚠️ Hệ quả: **F5 tab in là mất bản mẫu**, màn hình chuyển sang câu "không tìm thấy". Đó là
 * đánh đổi có chủ đích — thà bắt bấm lại còn hơn in nhầm chứng từ của lần trước.
 */
export function layBanMauDonMuaHang(): BanMauDonMuaHang | null {
  if (typeof window === "undefined") return null;

  let chu: string | null = null;
  for (const kho of [window.sessionStorage, window.localStorage]) {
    try {
      chu ??= kho.getItem(KHOA);
      kho.removeItem(KHOA);
    } catch (loi) {
      console.error("[bản mẫu PO] không đọc được kho tạm:", loi);
    }
  }
  if (chu === null) return null;

  try {
    const ban = JSON.parse(chu) as BanMauDonMuaHang;
    // Dữ liệu hỏng hoặc của bản app cũ — thà báo "không tìm thấy" còn hơn vẽ ra một tờ giấy
    // thiếu ô mà người dùng tưởng là đủ.
    if (!ban || typeof ban.luc !== "number" || !ban.po || !ban.gia) return null;
    if (Date.now() - ban.luc > HAN_MS) return null;
    return ban;
  } catch (loi) {
    console.error("[bản mẫu PO] nội dung kho tạm không đọc được:", loi);
    return null;
  }
}
