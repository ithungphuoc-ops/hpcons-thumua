// ============================================================
// GHI CHÚ CÔNG VIỆC CẦN GIẢI QUYẾT — RIÊNG CHO TỪNG NGƯỜI
//
// 🔴 Chỉ đạo Ban lãnh đạo 10/08/2026: *"Thêm mục ghi chú công việc, các công việc cần giải
// quyết"* trên màn "Công việc của tôi".
//
// Vì sao cần: nhiều việc thu mua không sinh ra chứng từ nào để app tự biết — "gọi lại NCC B
// hỏi giá thép", "xin duyệt tạm ứng", "hẹn thủ kho nghiệm thu sáng thứ 5". Người làm vẫn phải
// ghi ra giấy hoặc nhớ trong đầu; ghi vào đây thì nó nằm cạnh danh sách hồ sơ đang làm.
//
// ⚠️ ĐÂY LÀ SỔ TAY CÁ NHÂN, KHÔNG PHẢI GIAO VIỆC. Người khác không thấy và không nhận được
// thông báo gì. Muốn giao việc cho người khác thì dùng "Chuyển tiếp" ở trang chi tiết đề nghị.
// Cùng lý do như ngôi sao ghim (`danh-dau-ca-nhan.ts`): nhét vào chứng từ thì mỗi lần ghi chú
// là cả phòng thấy hồ sơ "vừa được sửa" và nhật ký đầy dòng vô nghĩa.
//
// 📌 Lưu trên máy nên chỉ theo đúng máy đó, đúng trình duyệt đó. Khi nối Firestore thì chuyển
// sang `users/{uid}/tm_ghichu` — vẫn tách khỏi chứng từ.
// ============================================================

const TIEN_TO_KHOA = "hpcons-thumua-ghichu-";

export interface GhiChuCongViec {
  id: string;
  noiDung: string;
  /** Đã làm xong chưa. Việc xong vẫn giữ lại để người dùng tự xóa, không tự biến mất. */
  xong: boolean;
  /** ISO đầy đủ giờ phút — biết ghi lúc nào để tự sắp thứ tự ưu tiên. */
  thoiDiem: string;
  /** Mã hồ sơ liên quan, nếu ghi chú này gắn với một đề nghị cụ thể. Không bắt buộc. */
  maHoSo?: string;
}

function khoa(uid: string): string {
  return `${TIEN_TO_KHOA}${uid}`;
}

/** Đọc sổ tay của người này. Lỗi hoặc chưa có thì trả mảng rỗng. */
export function docGhiChu(uid: string): GhiChuCongViec[] {
  if (typeof window === "undefined") return [];
  try {
    const tho = window.localStorage.getItem(khoa(uid));
    if (!tho) return [];
    const d: unknown = JSON.parse(tho);
    if (!Array.isArray(d)) return [];
    // Lọc từng phần tử: bản lưu cũ hoặc bị sửa tay có thể thiếu trường, thiếu thì bỏ phần tử
    // đó chứ không bỏ cả sổ — mất trắng ghi chú của người dùng là điều tệ nhất ở đây.
    return d.filter(
      (x): x is GhiChuCongViec =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as GhiChuCongViec).id === "string" &&
        typeof (x as GhiChuCongViec).noiDung === "string",
    );
  } catch {
    return [];
  }
}

/** Ghi lại sổ tay. Trình duyệt chặn localStorage thì bỏ qua, không làm treo app. */
export function ghiGhiChu(uid: string, ds: GhiChuCongViec[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(khoa(uid), JSON.stringify(ds));
  } catch {
    /* Hết dung lượng hoặc bị chặn — không làm gì. */
  }
}
