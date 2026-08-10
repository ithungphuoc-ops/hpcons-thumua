// ============================================================
// ĐÁNH DẤU HỒ SƠ (ngôi sao) — RIÊNG CHO TỪNG NGƯỜI DÙNG
//
// Chỉ đạo Ban lãnh đạo 10/08/2026: dựng màn hình cá nhân giống Base.vn, trong đó mỗi dòng
// có ngôi sao để tự ghim hồ sơ mình đang bám, và có bộ lọc "Đã đánh dấu".
//
// 🔴 ĐÂY LÀ DỮ LIỆU CÁ NHÂN, KHÔNG PHẢI DỮ LIỆU NGHIỆP VỤ.
// Người khác không thấy và không bị ảnh hưởng. Vì vậy nó nằm riêng ở đây chứ không nhét
// vào chứng từ đề nghị — nhét vào đó là mỗi lần một người ghim thì cả phòng thấy hồ sơ
// "vừa được sửa", và nhật ký chỉnh sửa đầy những dòng vô nghĩa.
//
// ⚠️ Lưu trên máy nên chỉ theo đúng máy đó, đúng trình duyệt đó. Khi nối Firestore thì
// chuyển sang `users/{uid}/tm_danhdau` — vẫn tách khỏi chứng từ, cùng lý do trên.
//
// 📌 Khóa lưu có kèm uid: hai người dùng chung một máy (chuyện thường ở công trường) thì
// ngôi sao của người này không hiện ở người kia.
// ============================================================

const TIEN_TO_KHOA = "hpcons-thumua-danhdau-";

function khoa(uid: string): string {
  return `${TIEN_TO_KHOA}${uid}`;
}

/** Đọc danh sách id hồ sơ người này đã ghim. Lỗi hoặc chưa có thì trả mảng rỗng. */
export function docDanhDau(uid: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const tho = window.localStorage.getItem(khoa(uid));
    if (!tho) return [];
    const d: unknown = JSON.parse(tho);
    return Array.isArray(d) ? d.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Ghi lại danh sách ghim. Trình duyệt chặn localStorage thì bỏ qua, không làm treo app. */
export function ghiDanhDau(uid: string, ds: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(khoa(uid), JSON.stringify(ds));
  } catch {
    /* Hết dung lượng hoặc bị chặn — không làm gì. */
  }
}
