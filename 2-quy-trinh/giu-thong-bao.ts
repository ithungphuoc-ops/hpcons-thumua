// ============================================================
// GIỮ 30 THÔNG BÁO GẦN NHẤT — một luật, một chỗ (23/09/2026)
//
// 🔴 VÌ SAO TÁCH RA: app chỉ giữ 30 tin gần nhất, và việc cắt được viết lặp ở SÁU đường thêm
// thông báo khác nhau trong `kho-du-lieu.tsx`. Cả sáu đều cắt theo VỊ TRÍ trong mảng
// (`.slice(0, 30)`), tức ngầm tin rằng vị trí phản ánh thứ tự thời gian.
//
// ⚠️ ĐIỀU ĐÓ ĐÚNG MỘT CÁCH TÌNH CỜ, và chỉ đúng khi kho còn là mảng. Từ khi kho chuyển sang
// map (đợt 2), `tuMap` trả theo thứ tự KHOÁ — "tb-187" đứng trước "tb-vm-223" vì chữ cái, không
// vì thời gian. Đo thật trên production 23/09 ngay sau lần test đầu: app giữ lại tin ngày 19/09
// và đẩy mất `tb-vm-223` ngày 21/09 — người dùng mất đúng tin MỚI.
//
// Sửa một chỗ rồi bỏ sót năm chỗ kia là chuyện đã xảy ra thật ở PR #36 (CodeRabbit chỉ ra).
// Nên gom về một hàm: thêm đường thêm thông báo mới thì gọi hàm này, khỏi nhớ luật.
// ============================================================

/** Số tin giữ lại. Đủ cho chuông và trang thông báo; nhiều hơn chỉ tốn dung lượng tài liệu. */
export const SO_THONG_BAO_GIU = 30;

/**
 * Giữ lại `SO_THONG_BAO_GIU` tin MỚI NHẤT theo `thoiDiem`.
 *
 * 🔴 SẮP RỒI MỚI CẮT, KHÔNG BAO GIỜ CẮT THEO VỊ TRÍ. Đó là toàn bộ lý do hàm này tồn tại.
 *
 * ⚠️ Tin thiếu `thoiDiem` bị xếp xuống cuối (coi như cũ nhất) chứ không bị loại — mất tin vì
 * thiếu một trường là tệ hơn hiển thị nó sai chỗ. Không có tin nào như vậy trên dữ liệu thật
 * hôm nay, nhưng dữ liệu cũ thì không ai bảo đảm được.
 */
export function giuThongBaoGanNhat<T extends { thoiDiem?: string }>(ds: readonly T[]): T[] {
  return [...ds]
    .sort((a, b) => String(b.thoiDiem ?? "").localeCompare(String(a.thoiDiem ?? "")))
    .slice(0, SO_THONG_BAO_GIU);
}
