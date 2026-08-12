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
//   ② CHỈ HUY TRƯỞNG duyệt — người sát công trường, xác nhận đúng là cần món đó
//   ③ TRƯỞNG PHÒNG duyệt — chốt cuối
//   ④ Bấy giờ phiếu mới vào bảng quy trình của Phòng Thu mua
//
// ⚠️ THỨ TỰ LÀ BẮT BUỘC. Không cho trưởng phòng duyệt cấp 2 khi chỉ huy trưởng chưa duyệt
// cấp 1 — bỏ qua thứ tự thì cấp 1 thành trang trí, và người sát công trường mất tiếng nói.
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

  if (cap === 1) {
    return q.duyetCap1
      ? null
      : "Đề nghị đang chờ Chỉ huy trưởng duyệt. Bạn không có quyền duyệt bước này.";
  }
  return q.duyetCap2
    ? null
    : "Đề nghị đang chờ Trưởng phòng duyệt. Bạn không có quyền duyệt bước này.";
}
