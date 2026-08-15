// ============================================================
// LUẬT NHÂN BẢN / TÁCH ĐỀ NGHỊ
//
// 🔴 Ban lãnh đạo 13/08/2026: *"tên của đề xuất giữ nguyên chỉ thêm chữ copy phía sau, để
// sau này có thể tổng hợp lại các đề xuất con của cái đề xuất lớn đó"*.
//
// ⚠️ FILE NÀY SINH RA VÌ MỘT LỖI THẬT. Trước đó luật đặt tên nằm ở kho dữ liệu, còn hộp
// nhân bản tự ghép `${tên} (copy)` để hiện lên màn hình. Hai chỗ cùng tính một thứ nên
// lệch nhau: nhân bản từ một bản copy thì hộp báo *"... (copy) (copy)"* trong khi app lưu
// *"... (copy 2)"*. Người dùng đọc hộp rồi tin vào con số sai.
//
// 👉 Hàm ở đây là HÀM THUẦN, không đụng React. Mọi nơi cần biết tên bản sao hay quan hệ
// cha–con đều gọi qua đây — đừng tự tính lại ở file giao diện.
// ============================================================

import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * Phiếu GỐC ĐẦU TIÊN của một đề nghị.
 *
 * Nhân bản từ một bản copy vẫn trả về phiếu lớn ban đầu — quan hệ cha–con **chỉ một cấp**,
 * để mọi phần tách của cùng một đề xuất gom được bằng một phép lọc, không phải lần ngược
 * từng đời. Phiếu không phải bản sao thì chính nó là gốc.
 */
export function phieuGocCua(dn: DeNghiMuaHang, tatCa: DeNghiMuaHang[]): DeNghiMuaHang {
  if (!dn.deNghiGocId) return dn;
  return tatCa.find((d) => d.id === dn.deNghiGocId) ?? dn;
}

/** Các bản đã tách ra từ một phiếu gốc. Lọc theo id, KHÔNG theo tên. */
export function cacBanTachCua(gocId: string, tatCa: DeNghiMuaHang[]): DeNghiMuaHang[] {
  return tatCa.filter((d) => d.deNghiGocId === gocId);
}

/**
 * MÃ của bản sao sắp tạo ra khi nhân bản `dn` — ví dụ `260001-HPCS-PR-001 (copy)`.
 *
 * 🔴 Ban lãnh đạo 13/08/2026 nói rõ bằng ví dụ: *"ý a là 26001-HPCS-PR-001 (copy)"*. Tức
 * bản tách **giữ nguyên mã của đề xuất lớn**, chỉ thêm "(copy)" — nhìn mã là biết ngay nó
 * thuộc đề xuất nào, không cần mở ra tra. Đó chính là cách "tổng hợp lại các đề xuất con".
 *
 * ⚠️ KHÔNG cấp mã PR mới cho bản tách. Cấp mã mới (PR-002, PR-003…) là mỗi phần tách trông
 * như một đề nghị độc lập, và trên bảng quy trình không còn dấu hiệu nào nói chúng cùng
 * một gốc.
 *
 * 📌 Luôn bám mã của PHIẾU GỐC ĐẦU TIÊN, không nối vào mã phiếu đang nhân bản. Tách 3 lần
 * mà lần nào cũng nối thì bản thứ ba thành *"…PR-001 (copy) (copy) (copy)"*. Nay: bản đầu
 * "(copy)", các bản sau "(copy 2)", "(copy 3)"…
 */
export function maBanSaoTiepTheo(dn: DeNghiMuaHang, tatCa: DeNghiMuaHang[]): string {
  const goc = phieuGocCua(dn, tatCa);
  /**
   * ⚠️ ĐẾM KHÔNG ĐỦ, PHẢI DÒ CHO TỚI KHI KHÔNG TRÙNG.
   *
   * Đếm số bản đang có rồi +1 nghe hợp lý nhưng sai khi có bản bị xóa: còn "(copy)" và
   * "(copy 2)", xóa "(copy)" đi thì số bản còn 1 → bản mới lại mang tên "(copy 2)", **trùng
   * mã với bản đang tồn tại**. Hai hồ sơ cùng mã là chuyện không được phép xảy ra.
   */
  const daDung = new Set(tatCa.map((d) => d.code));
  let ma = `${goc.code} (copy)`;
  let lan = 1;
  while (daDung.has(ma)) {
    lan += 1;
    ma = `${goc.code} (copy ${lan})`;
  }
  return ma;
}

// ============================================================
// TÁCH TỰ ĐỘNG THEO PHÂN CÔNG CỦA TRƯỞNG BỘ PHẬN
//
// 🔴 Ban lãnh đạo 15/08/2026: *"Khi trưởng phòng giao việc cho nhân viên khác nhau thì ở
// bước 2 sẽ tự copy đề nghị đó ra và công việc ứng với các tích chọn của trưởng phòng"*.
//
// Nghĩa là: ở bước ① trưởng bộ phận tích chọn dòng nào cho ai; khi phiếu đủ điều kiện sang
// bước ②, mỗi người nhận một phiếu riêng chứa **đúng những dòng mình được giao**.
//
// 👉 Hàm ở đây chỉ TÍNH RA phương án tách. Việc tạo phiếu nằm ở `kho-du-lieu.tsx` — tách đôi
// như vậy để luật kiểm được bằng mắt mà không phải chạy React.
// ============================================================

/** Một phần tách: người phụ trách và những dòng (theo `stt`) thuộc về họ. */
export interface PhanTachTheoNguoi {
  uid: string;
  ten: string;
  /** `stt` của các dòng người này phụ trách, theo đúng thứ tự trong phiếu gốc. */
  stt: number[];
}

/**
 * Nhóm các dòng của phiếu theo NGƯỜI PHỤ TRÁCH.
 *
 * Trả về mảng rỗng khi phiếu chưa phân bổ đủ — chưa đủ thì chưa sang bước ②, mà chưa sang
 * bước ② thì chưa tới lúc tách.
 *
 * ⚠️ Thứ tự trả về bám theo `stt` NHỎ NHẤT của mỗi người, không phải thứ tự ngẫu nhiên của
 * `Map`. Nhờ vậy người giữ phiếu gốc luôn là một người xác định, chạy lại bao nhiêu lần cũng
 * ra cùng kết quả — nếu để thứ tự đổi lung tung thì cùng một phiếu, hai máy tách ra hai kiểu.
 */
export function nhomDongTheoNguoiPhuTrach(dn: DeNghiMuaHang): PhanTachTheoNguoi[] {
  if (dn.items.length === 0) return [];
  // Còn dòng chưa giao cho ai → chưa phải lúc tách.
  if (dn.items.some((d) => !d.nguoiPhuTrachUid)) return [];

  const theoNguoi = new Map<string, PhanTachTheoNguoi>();
  for (const d of dn.items) {
    const uid = d.nguoiPhuTrachUid as string;
    const da = theoNguoi.get(uid);
    if (da) da.stt.push(d.stt);
    else theoNguoi.set(uid, { uid, ten: d.nguoiPhuTrachTen ?? uid, stt: [d.stt] });
  }
  return [...theoNguoi.values()].sort((a, b) => Math.min(...a.stt) - Math.min(...b.stt));
}

/** Kết quả tính phương án tách — nói rõ tách được hay không và vì sao. */
export type PhuongAnTach =
  | { tach: false; lyDo: string }
  | {
      tach: true;
      /** Người giữ nguyên phiếu gốc (nhóm có dòng đầu tiên). */
      giuPhieuGoc: PhanTachTheoNguoi;
      /** Các nhóm cần tạo phiếu mới. */
      canTaoPhieu: PhanTachTheoNguoi[];
    };

/**
 * Quyết định có tách phiếu hay không.
 *
 * 🔴 NGƯỜI CÓ DÒNG ĐẦU TIÊN GIỮ PHIẾU GỐC, các người còn lại nhận phiếu copy. Vì sao không
 * tạo phiếu mới cho tất cả rồi bỏ phiếu gốc: bản chạy thử chỉ có **12 mã dự phòng**
 * (`generateStaticParams`), tạo dư một phiếu mỗi lần tách là rất nhanh hết mã. Giữ phiếu gốc
 * cũng đúng nghiệp vụ hơn — mã `PR-001` vẫn tồn tại thay vì biến mất thành ba mã "(copy)".
 *
 * ⚠️ KIỂM ĐỦ MÃ TRƯỚC KHI TÁCH, đây là lý do hàm nhận `soMaConTrong`. Tách được 1 trong 2
 * phiếu rồi hết mã là tệ hơn không tách: phiếu gốc đã bị lấy mất dòng của người thứ hai,
 * mà phiếu của người đó thì không tồn tại — khối lượng biến mất khỏi hệ thống.
 */
export function tinhPhuongAnTach(dn: DeNghiMuaHang, soMaConTrong: number): PhuongAnTach {
  // Bản đã là copy thì không tách tiếp — quan hệ cha–con chỉ một cấp (xem `deNghiGocId`).
  if (dn.deNghiGocId) return { tach: false, lyDo: "Phiếu này đã là một bản tách." };

  const nhom = nhomDongTheoNguoiPhuTrach(dn);
  if (nhom.length === 0) {
    return { tach: false, lyDo: "Còn công việc chưa phân bổ người phụ trách." };
  }
  if (nhom.length === 1) {
    return { tach: false, lyDo: "Cả phiếu giao cho một người nên không cần tách." };
  }
  const canTao = nhom.length - 1;
  if (soMaConTrong < canTao) {
    return {
      tach: false,
      lyDo: `Cần ${canTao} mã hồ sơ để tách cho ${nhom.length} người nhưng chỉ còn ${soMaConTrong}. Bản chạy thử giới hạn 12 đề nghị — xóa bớt phiếu cũ rồi thử lại.`,
    };
  }
  return { tach: true, giuPhieuGoc: nhom[0], canTaoPhieu: nhom.slice(1) };
}
