// ============================================================
// DUYỆT HAI CẤP CỦA BỘ PHẬN ĐỀ XUẤT
//
// 🔴 Chỉ đạo Ban lãnh đạo 12/08/2026, nguyên văn:
//    *"Tô Trọng Hoài đề xuất => Chỉ huy trưởng duyệt => Trưởng phòng duyệt mới đẩy qua cho
//    phòng thu mua"*
//
// Đi kèm chỉ đạo *"chức năng đề nghị này hãy tạo cho toàn bộ các tài khoản hiện có"*. Hai
// cái là MỘT CẶP: mở cho ai cũng lập được đề nghị thì phải có hai cấp duyệt chặn lại, nếu
// không Thu mua sẽ nhận cả những phiếu chưa ai trong bộ phận gật đầu.
//
//   ① Kỹ sư / nhân viên đề xuất
//   ② TRƯỞNG PHÒNG / QUẢN LÝ của bộ phận duyệt
//   ③ TỔNG GIÁM ĐỐC hoặc PHÓ TGĐ duyệt — chốt cuối
//   ④ Bấy giờ phiếu mới vào bảng quy trình của Phòng Thu mua
//
// 📌 Lấy ĐÚNG bảng Base của công ty — Ban lãnh đạo chốt 12/08/2026: *"e theo base nhé,
// Trưởng phòng/quản lý"*. Khối lưu ý trên Base ghi: *"Luồng duyệt (duyệt lần lượt):
// TP/QL → Tổng Giám đốc hoặc Các Phó Tổng Giám đốc"*.
//
// ⚠️ THỨ TỰ LÀ BẮT BUỘC. Không cho duyệt cấp 2 khi cấp 1 chưa duyệt — bỏ qua thứ tự thì
// cấp 1 thành trang trí, và quản lý trực tiếp mất tiếng nói về nhu cầu bộ phận mình.
// ============================================================

import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/** Cấp duyệt đang chờ, hoặc `null` khi đã duyệt xong cả hai. */
export type CapDangCho = 1 | 2 | null;

/**
 * Đề nghị đã qua ĐỦ hai cấp duyệt chưa — tức Thu mua đã được phép xử lý.
 *
 * 🔴 BA ĐƯỜNG ĐỀU TÍNH LÀ ĐÃ DUYỆT, và điều đó là cố ý:
 *
 *   1. Đủ `duyetCap1` + `duyetCap2` — luồng hai cấp hiện hành.
 *   2. `duyetBoPhan` — bản duyệt MỘT cấp làm sáng 12/08/2026, có thể còn phiếu đã dùng.
 *   3. `ngayDuyet` — đề nghị nhận từ HPcore, vốn đã duyệt ngoài app.
 *
 * ⚠️ BỎ ĐƯỜNG 2 HOẶC 3 LÀ HỎNG TO. Phiếu cũ không có `duyetCap1`/`duyetCap2`; coi chúng là
 * "chưa duyệt" thì chúng **biến mất khỏi bảng quy trình của Thu mua** — đơn đang chạy dở,
 * báo giá đang thu thập, tự nhiên mất tăm mà không một dòng báo lỗi. Người dùng sẽ tưởng
 * mất dữ liệu và mất niềm tin vào app.
 *
 * 📌 Đây là câu hỏi phải đặt ra MỖI LẦN thêm trường bắt buộc vào dữ liệu đã có: "bản ghi cũ
 * chưa có trường này thì sao?"
 */
export function daDuyetBoPhan(dn: DeNghiMuaHang): boolean {
  if (dn.duyetCap1 && dn.duyetCap2) return true;
  if (dn.duyetBoPhan) return true;
  return Boolean(dn.ngayDuyet);
}

/**
 * Đang chờ cấp nào duyệt. `null` = xong cả hai (hoặc là phiếu cũ đã duyệt từ trước).
 */
export function capDangCho(dn: DeNghiMuaHang): CapDangCho {
  if (daDuyetBoPhan(dn)) return null;
  if (!dn.duyetCap1) return 1;
  return 2;
}

/** Đề nghị còn nằm ở bộ phận đề xuất — Thu mua CHƯA phải xử lý. */
export function choDuyetBoPhan(dn: DeNghiMuaHang): boolean {
  return !daDuyetBoPhan(dn);
}

/**
 * Lọc danh sách cho người làm THU MUA: bỏ phiếu bộ phận đề xuất chưa duyệt xong.
 *
 * 🔴 Dùng ở MỌI chỗ Thu mua nhìn vào danh sách đề nghị (bảng quy trình, việc của tôi, lịch,
 * tổng quan). Lọc ở một màn mà quên màn khác thì cùng một phiếu lúc thấy lúc không — kiểu
 * lỗi rất khó lần ra vì mỗi người mô tả một khác.
 */
export function locDaDuyet(ds: DeNghiMuaHang[]): DeNghiMuaHang[] {
  return ds.filter(daDuyetBoPhan);
}

export interface QuyenDuyet {
  duyetCap1: boolean;
  duyetCap2: boolean;
  /**
   * Quản trị hệ thống — duyệt thay được ở CẢ HAI cấp.
   *
   * 🔴 Không có cờ này thì: phiếu chỉ định trưởng phòng A duyệt cấp 2, A nghỉ việc → **không
   * ai gỡ được phiếu đó**, vì đường duyệt thay chỉ mở cho cấp 1. Quản trị là chốt cuối để
   * hồ sơ không bao giờ kẹt vĩnh viễn vì một con người.
   */
  laQuanTri?: boolean;
}

/**
 * Danh sách người được chọn làm người duyệt cho từng cấp.
 *
 * Cấp 1: chỉ huy trưởng và trưởng phòng. Cấp 2: chỉ trưởng phòng.
 * ⚠️ Lọc theo `chucVu`, KHÔNG lọc theo chuỗi chức danh — chức danh là chữ người ta gõ, đổi
 * một chữ là danh sách trống mà không báo gì.
 */
export function nguoiDuyetDuocChon<T extends { chucVu?: string }>(
  danhSach: T[],
  cap: 1 | 2,
): T[] {
  if (cap === 2) return danhSach.filter((n) => n.chucVu === "tong_giam_doc");
  return danhSach.filter(
    (n) => n.chucVu === "chi_huy_truong" || n.chucVu === "truong_phong",
  );
}

/**
 * Lý do KHÔNG bấm duyệt được ở cấp đang chờ. `null` nghĩa là duyệt được.
 *
 * Trả về câu nói thẳng việc phải làm, để giao diện hiện cạnh nút mờ. 🔴 Nút mờ không kèm lý
 * do là kiểu bí việc khó chịu nhất — người dùng bấm mãi không được mà chẳng biết vì sao.
 */
export function lyDoKhongDuyetDuoc(
  dn: DeNghiMuaHang,
  q: QuyenDuyet,
  uid: string,
): string | null {
  const cap = capDangCho(dn);
  if (cap === null) return "Đề nghị này đã được duyệt đủ hai cấp.";

  /**
   * 🔴 KHÔNG TỰ DUYỆT PHIẾU CỦA CHÍNH MÌNH.
   *
   * Người vừa đề xuất vừa duyệt thì bước duyệt chỉ là hình thức — mất hẳn ý nghĩa kiểm soát
   * mà Ban lãnh đạo đặt ra.
   *
   * ⚠️ Chỉ chặn ĐÚNG NGƯỜI LẬP. Chỉ huy trưởng tự lập phiếu thì cấp 1 do trưởng phòng duyệt
   * thay (họ có cả `duyetCap1`), rồi trưởng phòng duyệt cấp 2 — vẫn còn một người ngoài xem
   * qua, và phiếu không bị kẹt.
   */
  if (dn.nguoiDeNghiUid === uid) {
    return "Không tự duyệt đề nghị do chính mình lập. Nhờ cấp trên trong bộ phận duyệt.";
  }

  const coQuyenCap = cap === 1 ? q.duyetCap1 : q.duyetCap2;
  if (!coQuyenCap) {
    return cap === 1
      ? "Đề nghị đang chờ Trưởng phòng / Quản lý duyệt. Bạn không có quyền duyệt bước này."
      : "Đề nghị đang chờ Tổng Giám đốc duyệt. Bạn không có quyền duyệt bước này.";
  }

  /**
   * ★ TÔN TRỌNG NGƯỜI ĐƯỢC CHỈ ĐỊNH trên phiếu (Ban lãnh đạo 12/08/2026).
   *
   * Có chỉ định mà mình không phải người đó → không duyệt. Nếu bỏ điều kiện này thì bất kỳ
   * chỉ huy trưởng nào cũng duyệt được phiếu của công trình mình không phụ trách.
   *
   * ⚠️ TRỪ TRƯỞNG PHÒNG Ở CẤP 1: chỉ huy trưởng được chỉ định có thể đi công trường, nghỉ
   * phép, đổi công trình. Không cho trưởng phòng duyệt thay thì phiếu treo tới khi người kia
   * quay lại — và người ta sẽ lách bằng cách gọi điện, app thành vô dụng.
   *
   * ⚠️ Không chỉ định (phiếu cũ, phiếu từ HPcore) → xét theo chức vụ như trên, để phiếu
   * không bao giờ kẹt vì thiếu một trường mới thêm.
   */
  const chiDinh = cap === 1 ? dn.nguoiDuyetCap1 : dn.nguoiDuyetCap2;
  if (chiDinh && chiDinh.uid !== uid) {
    // Trưởng phòng duyệt thay cấp 1; quản trị duyệt thay CẢ HAI cấp (xem `laQuanTri`).
    const duyetThayDuoc = (cap === 1 && q.duyetCap2) || q.laQuanTri === true;
    if (!duyetThayDuoc) {
      return `Đề nghị này chỉ định ${chiDinh.ten} duyệt cấp ${cap}. Bạn không phải người được chỉ định.`;
    }
  }

  return null;
}
