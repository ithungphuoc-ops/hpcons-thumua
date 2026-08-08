/**
 * Bỏ dấu tiếng Việt để tìm kiếm gõ không dấu vẫn ra.
 * "hue" tìm được "Huệ", "tran binh" tìm được "Trần Thị Bình", "de nghi" ra "Đề nghị".
 *
 * Để ở `6-tien-ich/` vì đây là hàm xử lý chuỗi thuần, không dính nghiệp vụ —
 * cả danh bạ nhân sự lẫn ô tìm kiếm trên thanh trên đều dùng chung.
 */
export function boDau(s: string): string {
  return s
    .normalize("NFD")
    // `\p{M}` = mọi dấu thanh / dấu mũ đã tách ra sau khi normalize("NFD").
    // Dùng ký hiệu này chứ KHÔNG viết dải ký tự thô — ký tự thô là dấu vô hình
    // trong mã nguồn, người sau mở file ra không thấy gì và dễ sửa hỏng.
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}
