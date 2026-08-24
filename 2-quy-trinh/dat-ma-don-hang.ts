// ============================================================
// SINH SỐ ĐƠN MUA HÀNG — `DMH[năm 2 chữ số][STT 4 chữ số]`, ví dụ `DMH260001`
//
// 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 23/08/2026: *"Số đơn hàng này sẽ ký hiệu như sau: DMH + năm + số nhảy
//    tự động 0000"*. Đúng ký hiệu in trên biểu mẫu giấy của công ty — ô K7 của
//    `PO - DEMO 130826.xlsx` ghi sẵn `DMH.......`.
//
// ⚠️ ĐÂY LÀ THAY ĐỔI HỆ MÃ, PHẢI BIẾT RÕ MÌNH ĐANG ĐỔI GÌ.
//    Trước 23/08/2026 số đơn theo Thông báo 09/2026/TB-HPCS: `[Mã dự án gốc]-PO-[STT 3 chữ số]`
//    (vd `260001-HPCS-PO-001`). Ba khác biệt, không phải một:
//
//      ① Mã loại `PO` (đã có trong danh mục duyệt của Thông báo) → đổi thành `DMH`. Mã `DMH`
//         **chưa có trong danh mục mã loại** của Thông báo 09/2026, và quy tắc E-6 đòi mọi điều
//         chỉnh phải được đơn vị quản lý hệ thống phê duyệt. Việc xin bổ sung `DMH` vào danh mục
//         là việc CÒN NỢ — đã báo Ban lãnh đạo cùng ngày.
//      ② Số thứ tự trước chạy theo DỰ ÁN, nay chạy theo NĂM. Nghĩa là hai đơn của hai công
//         trình khác nhau nay dùng chung một dãy số.
//      ③ Mã không còn chứa mã dự án gốc, nên **nhìn số đơn không còn suy ra được công trình**.
//         Công trình vẫn nằm trong đơn (`maDuAn`, `tenCongTrinh`) và vẫn in trên tờ giấy ở dòng
//         "Mã đề xuất và tên công trình" — chỉ là không đọc được từ chính con số.
//
// 📌 ĐƠN CŨ GIỮ NGUYÊN MÃ. Hàm này chỉ cấp số cho đơn MỚI; những đơn đã mang mã
//    `260001-HPCS-PO-001` vẫn tra cứu và hiển thị bình thường. Đổi mã đơn đã phát hành là làm
//    lệch chứng từ giấy đã gửi nhà cung cấp.
//
// Hàm ở đây là hàm THUẦN, không đụng giao diện, không đụng kho dữ liệu.
// ============================================================

/**
 * Tiền tố số đơn mua hàng — một chỗ sửa duy nhất.
 *
 * 🔴 Đổi hằng số này là đổi ký hiệu của MỌI đơn cấp số về sau. Đơn đã cấp thì không đổi theo
 * (mã nằm trong `DonDatHang.code`), nên hai dãy mã sẽ cùng tồn tại — đó là chuyện bình thường
 * của việc đổi hệ mã, nhưng phải biết trước chứ đừng ngạc nhiên.
 */
export const TIEN_TO_DON_HANG = "DMH";

/**
 * Số chữ số của phần STT. `0000` theo đúng chỉ đạo, tức tối đa 9.999 đơn một năm.
 *
 * ⚠️ Vượt 9.999 thì mã tự dài ra thành 5 chữ số (`padStart` không cắt bớt) — thà mã dài hơn
 * khuôn còn hơn cấp trùng số. Không có chốt nào chặn ở đây vì chặn là app không lập được đơn.
 */
const SO_CHU_SO_STT = 4;

/** Mã loại cũ theo Thông báo 09/2026 — GIỮ LẠI để nhận ra đơn cấp số trước 23/08/2026. */
export const MA_LOAI_DON_HANG_CU = "PO";

/**
 * Năm dùng để cấp số, **HAI chữ số cuối**, lấy từ ngày lập đơn (chuỗi ISO `YYYY-MM-DD`).
 *
 * ★ HAI chữ số theo chỉ đạo Ban lãnh đạo 23/08/2026 (lượt hai): *"định dạng lại DMH260001"* —
 * tức `DMH` + `26` + `0001`, viết LIỀN, không dấu phân cách. Cùng lối với mã dự án gốc của
 * Thông báo 09/2026 (`YYUNNN-HPCS`, vd `260001-HPCS`) nên đọc quen mắt.
 *
 * 🔴 LẤY THEO NGÀY LẬP ĐƠN, KHÔNG LẤY `new Date()`:
 *   · Đơn lập bù cho tháng trước (chuyện thường vào đầu năm) phải mang số của năm ghi trên
 *     chứng từ, không phải năm hôm nay — nếu không, chứng từ ghi ngày 28/12/2026 mà số lại là
 *     `DMH270001`, kế toán không đối chiếu được.
 *   · Hàm thuần không được phụ thuộc thời điểm chạy, nếu không thì không kiểm thử được.
 *
 * Trả chuỗi rỗng khi ngày không đúng khuôn — bên gọi phải chặn trước, xem `themDonHang`.
 */
export function namCuaNgay(ngayISO: string): string {
  const khop = /^\d{2}(\d{2})-\d{2}-\d{2}/.exec(ngayISO.trim());
  return khop ? khop[1] : "";
}

/**
 * Sinh số đơn mua hàng tiếp theo của một NĂM.
 *
 * 🔴 LẤY SỐ LỚN NHẤT ĐÃ TỪNG DÙNG RỒI +1, **không đếm số đơn hiện có rồi +1**.
 * Đếm rồi +1 thì: lập 0001 · 0002 · 0003, bỏ 0002 → còn 2 đơn → đơn tiếp theo lại ra 0003,
 * trùng với đơn đang tồn tại. Hai chứng từ cùng một số là hỏng cả hệ mã — tra cứu ra nhầm đơn,
 * hồ sơ giấy lẫn lộn, công nợ cộng nhầm. (Đúng cái sai `dat-ten-de-nghi.ts` đã phải sửa ngày
 * 14/08/2026 cho mã đề nghị.)
 *
 * 📌 Vòng `while` cuối là chốt chặn cuối: dữ liệu có thể chứa mã không theo khuôn (nhập tay,
 * nhập từ Excel, đơn của bản chạy thử cũ, và cả dãy mã cũ `…-PO-001`), lúc đó `lonNhat` không
 * phản ánh hết thực tế.
 *
 * @param nam      Năm HAI chữ số, lấy bằng `namCuaNgay(ngayLapPO)`. Rỗng là lỗi lập trình —
 *                 bên gọi phải chặn trước, vì mã `DMH0001` đọc ra như năm 00 số 01.
 * @param maDaDung Số của MỌI đơn đang có (cả năm khác, cả dãy mã cũ) — để vòng `while` chống
 *                 trùng nhìn được toàn bộ.
 */
export function maDonHangTiepTheo(nam: string, maDaDung: readonly string[]): string {
  /* ⚠️ VIẾT LIỀN, KHÔNG DẤU PHÂN CÁCH (`DMH260001`) — chỉ đạo 23/08/2026 lượt hai. */
  const tienTo = `${TIEN_TO_DON_HANG}${nam.trim()}`;
  /* Neo cả hai đầu (`^…$`): thiếu `$` thì `DMH2600012` cũng khớp và bị đọc thành số 1, nên số
     lớn nhất tính ra sai và mã tiếp theo trùng.

     ⚠️ VÌ MÃ VIẾT LIỀN NÊN TIỀN TỐ PHẢI GỒM CẢ NĂM, không được chỉ là `DMH`: `^DMH(\\d+)$` sẽ
     ăn luôn cả phần năm vào số thứ tự (`DMH260001` → 260001), rồi đơn tiếp theo ra `DMH260002`
     một cách tình cờ đúng, nhưng đơn của năm 27 lại tính từ số 270001 — dãy số nhảy vọt và
     không bao giờ về 0001 đầu năm. */
  const cungNam = new RegExp(`^${tienTo}(\\d+)$`);

  let lonNhat = 0;
  for (const ma of maDaDung) {
    const khop = cungNam.exec(ma.trim());
    if (khop) lonNhat = Math.max(lonNhat, Number(khop[1]));
  }

  const daDung = new Set(maDaDung.map((m) => m.trim()));
  let so = lonNhat + 1;
  let ma = `${tienTo}${String(so).padStart(SO_CHU_SO_STT, "0")}`;
  while (daDung.has(ma)) {
    so += 1;
    ma = `${tienTo}${String(so).padStart(SO_CHU_SO_STT, "0")}`;
  }
  return ma;
}
