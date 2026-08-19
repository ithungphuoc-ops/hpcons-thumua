// ============================================================
// LUẬT PHÂN QUYỀN — AI ĐƯỢC ĐỔI QUYỀN CỦA AI, TỚI CẤP NÀO
//
// 🔴 Ban lãnh đạo 18/08/2026: *"thêm tính năng phân quyền cho tài khoản quản trị và tài khoản
// trưởng bộ phận"*.
//
// 🔴 HÀM THUẦN, MỘT CHỖ DUY NHẤT. Màn hình hỏi luật ở đây, tầng ghi cũng hỏi lại đúng ở đây.
// Chép điều kiện ra hai nơi là kiểu lỗi tệ nhất của phân quyền: nút bị khóa trên giao diện nhưng
// đường ghi vẫn nhận, hoặc ngược lại — và không có gì báo cho tới khi ai đó khai thác được.
//
// ⚠️ ĐÂY CHƯA PHẢI CHỐT CHẶN THẬT. Chốt thật phải nằm ở Firestore Security Rules, vì người dùng
// gọi thẳng Firestore được mà không đi qua app. Xem `5-ket-noi/firestore-phan-quyen-DE-XUAT.rules`
// — bộ rules đó **chưa được duyệt và chưa deploy**, nên hiện tại máy chủ vẫn TỪ CHỐI mọi lệnh ghi
// hồ sơ phân quyền. Không được coi file này là hàng rào bảo mật.
// ============================================================

/**
 * 🔴 NHÃN CẤP QUYỀN LẤY TỪ `quyen.ts`, KHÔNG KHAI LẠI.
 *
 * Bản đầu của file này tự khai một bảng `NHAN_CAP_QUYEN` riêng ({0:"Không quyền", 1:"Xem"…})
 * trong khi `quyen.ts` đã có sẵn một bảng khác chữ ({0:"Không truy cập", 1:"Cấp 1 — Xem"…}).
 * Hai bảng cùng nói một thứ bằng hai cách gọi khác nhau: người dùng đọc màn phân quyền thấy
 * "Nhập liệu", đọc chỗ khác thấy "Cấp 2 — Nhập liệu", và không ai biết có phải một thứ không.
 * Đã bỏ bản trùng, dùng chung một bảng.
 */
import { NHAN_CAP_QUYEN, type CapQuyen, type NguoiDung } from "@/4-phan-quyen/quyen";

export { NHAN_CAP_QUYEN };

/**
 * Cấp CAO NHẤT mà người này đặt được cho NGƯỜI KHÁC. `0` = không được phân quyền.
 *
 * 🔴 LUẬT NỀN: **không ai tạo ra được người ngang hoặc trên mình.** Đây là luật kinh điển của
 * phân quyền, và lý do rất cụ thể: nếu trưởng bộ phận (cấp 3) đặt được cấp 4 cho một tài khoản
 * bất kỳ, thì họ chỉ cần tạo/nhờ một tài khoản cấp 4 rồi dùng nó để tự nâng mình — vòng lách
 * quyền khép kín mà nhật ký nhìn vào vẫn "đúng quy trình".
 *
 * · Quản trị (4) → đặt được tới **4**: cấp 4 vốn đã "làm được mọi việc", cho tạo thêm quản trị
 *   khác là đúng vai trò, và công ty cần hơn một người giữ chìa khóa.
 * · Trưởng bộ phận (3) → đặt được tới **2** (Nhập liệu). Đủ để tự cấp quyền cho nhân viên trong
 *   bộ phận mà không phải nhờ IT, nhưng không đụng được vào cấp quản lý và quản trị.
 *
 * ⚠️ GIẢ ĐỊNH CỦA TÔI, CHƯA ĐƯỢC BAN LÃNH ĐẠO CHỐT. Đã hỏi ngày 18/08/2026 và chưa có trả lời,
 * nên chọn mức chặt nhất còn dùng được. Muốn nới cho trưởng bộ phận đặt tới cấp 3 thì sửa đúng
 * MỘT số ở dòng dưới — không phải sửa màn hình.
 */
export function capDatDuocToiDa(nguoiSua: NguoiDung): CapQuyen {
  if (nguoiSua.capTM >= 4) return 4;
  if (nguoiSua.capTM >= 3) return 2;
  return 0;
}

/** Người này có được vào màn phân quyền không. */
export function duocPhanQuyen(nguoiSua: NguoiDung): boolean {
  return capDatDuocToiDa(nguoiSua) > 0;
}

/**
 * Người này có được sửa hồ sơ của người kia không, kèm LÝ DO khi không được.
 *
 * 🔴 LUÔN TRẢ LÝ DO. Khóa một dòng mà không nói vì sao thì người dùng tưởng app hỏng, rồi đi hỏi
 * IT — mất thời gian của cả hai bên cho một luật vốn giải thích được bằng một câu.
 *
 * @param capNguoiBiSua Cấp hiện tại của người bị sửa.
 * @param laChinhMinh   Hồ sơ đang sửa có phải của chính người đang thao tác không.
 */
export function duocSuaHoSo(
  nguoiSua: NguoiDung,
  capNguoiBiSua: CapQuyen,
  laChinhMinh: boolean,
): { duoc: boolean; lyDo?: string } {
  if (capDatDuocToiDa(nguoiSua) === 0) {
    return { duoc: false, lyDo: "Bạn không có quyền phân quyền." };
  }

  /**
   * 🔴 KHÔNG AI TỰ SỬA HỒ SƠ CỦA CHÍNH MÌNH — kể cả quản trị.
   *
   * Hai lý do, cái thứ hai mới là cái quan trọng:
   *  ① Tự nâng cấp là vô nghĩa (đã cao nhất) còn tự hạ cấp là tự khóa mình ra ngoài — nếu đó là
   *     tài khoản quản trị duy nhất thì **không còn ai mở lại được**, phải dùng khóa Admin SDK.
   *  ② Mọi thay đổi quyền phải có người thứ hai nhìn thấy. Tự sửa mình là không ai đối chứng.
   */
  if (laChinhMinh) {
    return {
      duoc: false,
      lyDo: "Không tự sửa quyền của chính mình. Nhờ một tài khoản Quản trị khác đổi giúp.",
    };
  }

  /**
   * Không sửa được người có cấp CAO HƠN cấp mình đặt được.
   * Trưởng bộ phận (đặt tối đa 2) vì vậy không đụng được vào hồ sơ cấp 3 và cấp 4 — nếu không,
   * họ có thể HẠ một quản trị xuống rồi tự do làm phần còn lại.
   */
  const toiDa = capDatDuocToiDa(nguoiSua);
  if (capNguoiBiSua > toiDa) {
    return {
      duoc: false,
      lyDo: `Bạn chỉ đặt được tới cấp ${toiDa} (${NHAN_CAP_QUYEN[toiDa]}), không sửa được hồ sơ cấp ${capNguoiBiSua} (${NHAN_CAP_QUYEN[capNguoiBiSua]}).`,
    };
  }

  return { duoc: true };
}

/**
 * Kiểm một lần cuối trước khi ghi: cấp MỚI có nằm trong tầm của người sửa không.
 *
 * ⚠️ Tách khỏi `duocSuaHoSo` là cố ý: sửa được hồ sơ KHÔNG có nghĩa đặt được mọi cấp. Trưởng bộ
 * phận sửa được hồ sơ cấp 2, nhưng không được nâng nó lên cấp 3.
 */
export function duocDatCap(
  nguoiSua: NguoiDung,
  capMoi: CapQuyen,
): { duoc: boolean; lyDo?: string } {
  const toiDa = capDatDuocToiDa(nguoiSua);
  if (capMoi > toiDa) {
    return {
      duoc: false,
      lyDo: `Bạn chỉ đặt được tới cấp ${toiDa} (${NHAN_CAP_QUYEN[toiDa]}).`,
    };
  }
  return { duoc: true };
}

/** Các cấp mà người này chọn được trong ô chọn — dùng để dựng danh sách, khỏi bày rồi khóa. */
export function cacCapChonDuoc(nguoiSua: NguoiDung): CapQuyen[] {
  const toiDa = capDatDuocToiDa(nguoiSua);
  return ([0, 1, 2, 3, 4] as CapQuyen[]).filter((c) => c <= toiDa);
}
