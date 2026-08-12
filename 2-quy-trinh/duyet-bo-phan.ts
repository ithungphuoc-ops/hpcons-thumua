// ============================================================
// DUYỆT CỦA QUẢN LÝ BỘ PHẬN ĐỀ XUẤT
//
// 🔴 Chỉ đạo Ban lãnh đạo 12/08/2026: *"đề nghị có thêm mục duyệt bởi quản lý bộ phận thi
// công"*, đi kèm *"Thêm chức năng tạo đề nghị cho Tô Trọng Hoài"*.
//
// Hai chỉ đạo này là MỘT CẶP, không tách được: mở cho kỹ sư hiện trường tự lập đề nghị mà
// không có ai duyệt thì Thu mua phải xử lý cả những phiếu cấp trên chưa gật đầu — vừa mất
// công vừa mất kiểm soát chi tiêu.
//
// Luồng: kỹ sư đề xuất → trưởng phòng bộ phận duyệt → Thu mua mới thấy trên bảng quy trình.
// ============================================================

import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * Đề nghị này đã được quản lý bộ phận đề xuất duyệt chưa.
 *
 * 🔴 HAI ĐƯỜNG ĐỀU TÍNH LÀ ĐÃ DUYỆT, và điều đó là cố ý:
 *
 *   1. `duyetBoPhan` — có người bấm duyệt trong app (từ 12/08/2026).
 *   2. `ngayDuyet` — đề nghị nhận từ HPcore vốn đã được duyệt ngoài app từ trước.
 *
 * ⚠️ BỎ ĐƯỜNG THỨ HAI LÀ HỎNG TO. Mọi đề nghị lập trước 12/08/2026 đều không có trường
 * `duyetBoPhan`; coi chúng là "chưa duyệt" thì chúng **biến mất khỏi bảng quy trình của
 * Thu mua** — đơn hàng đang chạy dở, báo giá đang thu thập, tự nhiên mất tăm mà không một
 * dòng báo lỗi. Người dùng sẽ tưởng mất dữ liệu.
 *
 * 📌 Đây là kiểu lỗi kinh điển khi thêm trường bắt buộc vào dữ liệu đã có: luôn phải hỏi
 * "bản ghi cũ chưa có trường này thì sao?" trước khi viết điều kiện.
 */
export function daDuyetBoPhan(dn: DeNghiMuaHang): boolean {
  if (dn.duyetBoPhan) return true;
  return Boolean(dn.ngayDuyet);
}

/**
 * Đề nghị đang chờ quản lý bộ phận duyệt — tức Thu mua CHƯA phải xử lý.
 */
export function choDuyetBoPhan(dn: DeNghiMuaHang): boolean {
  return !daDuyetBoPhan(dn);
}

/**
 * Lọc danh sách đề nghị cho người làm THU MUA: bỏ những phiếu bộ phận đề xuất chưa duyệt.
 *
 * 🔴 Dùng ở MỌI chỗ Thu mua nhìn vào danh sách đề nghị (bảng quy trình, việc của tôi, lịch,
 * tổng quan). Lọc ở một màn mà quên màn khác thì cùng một phiếu lúc thấy lúc không — kiểu
 * lỗi rất khó lần ra vì mỗi người mô tả một khác.
 */
export function locDaDuyet(ds: DeNghiMuaHang[]): DeNghiMuaHang[] {
  return ds.filter(daDuyetBoPhan);
}

/** Lý do không bấm duyệt được, `null` nghĩa là duyệt được. */
export function lyDoKhongDuyetDuoc(
  dn: DeNghiMuaHang,
  duocDuyet: boolean,
  uid: string,
): string | null {
  if (daDuyetBoPhan(dn)) return "Đề nghị này đã được duyệt rồi.";
  if (!duocDuyet) {
    return "Chỉ quản lý bộ phận đề xuất mới duyệt được đề nghị này.";
  }
  // 🔴 KHÔNG cho tự duyệt phiếu của chính mình. Người vừa đề xuất vừa duyệt thì bước duyệt
  // chỉ là hình thức — mất hẳn ý nghĩa kiểm soát mà Ban lãnh đạo đặt ra.
  // ⚠️ Trưởng phòng tự lập đề nghị thì phiếu được duyệt NGAY LÚC TẠO (xem `themDeNghiGiaLap`),
  // nên họ không rơi vào nhánh này — không ai bị kẹt.
  if (dn.nguoiDeNghiUid === uid) {
    return "Không tự duyệt đề nghị do chính mình lập. Nhờ quản lý khác trong bộ phận duyệt.";
  }
  return null;
}
