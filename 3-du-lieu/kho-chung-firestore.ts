// ============================================================
// KHO DỮ LIỆU CHUNG TRÊN FIRESTORE — để cả phòng cùng thấy một bộ dữ liệu
//
// 🔴 Chỉ đạo Ban lãnh đạo 12/08/2026: *"nối firebase để mọi người dùng chung dữ liệu để cùng
// test"*. Trước đó dữ liệu nằm trong `localStorage` của TỪNG trình duyệt trên TỪNG máy: mở
// hai trình duyệt khác nhau là hai thế giới tách biệt, trưởng bộ phận phân bổ ở Chrome thì
// nhân viên bên Edge không thấy gì.
//
// 📌 Project: `hpcons-thumua` (khóa Admin SDK Sếp để sẵn ở thư mục gốc dự án).
// ⚠️ KHÁC với `hpcons-portal` ghi trong CLAUDE.md mục 3.6 — công ty đã tạo project riêng cho
// app này. Khi App Tổng cấp quyền `hpcons-portal` thì chuyển sang, dữ liệu test không tiếc.
//
// 🔴 MỘT DOCUMENT CHỨA CẢ BỘ DỮ LIỆU, cố ý làm đơn giản như vậy:
//   · Giữ nguyên toàn bộ logic nghiệp vụ đang chạy tốt — chỉ thay chỗ CẤT dữ liệu, không
//     phải viết lại 1300 dòng kho dữ liệu và không đụng một dòng giao diện nào.
//   · Đủ cho bản chạy thử. Firestore cho tối đa 1MB/document; bộ dữ liệu test còn xa mức đó.
//   ⚠️ Đánh đổi phải biết: hai người sửa cùng lúc thì **người ghi sau đè lên người trước**.
//     Chấp nhận được khi cả phòng cùng test; lên bản thật phải tách từng chứng từ ra document
//     riêng để hai người sửa hai hồ sơ khác nhau không đụng nhau.
//
// ⚠️ localStorage VẪN GIỮ, làm bản dự phòng: mất mạng thì app vẫn mở ra được dữ liệu lần
// cuối. Firestore là nguồn chính, localStorage chỉ là bản sao đọc lúc chờ mạng.
// ============================================================

import type { DuLieuLuu } from "@/3-du-lieu/luu-tren-may";
import { daCauHinhFirebase, moFirebase } from "@/5-ket-noi/firebase-chung";

/** Tất cả người dùng bản chạy thử chung một "phòng" dữ liệu. */
const DUONG_DAN = { boSuuTap: "chay-thu", tep: "du-lieu-chung" } as const;

/** Đã khai đủ cấu hình Firebase chưa. Thiếu thì app chạy như cũ, chỉ lưu trên máy. */
export const daCauHinhFirestore = daCauHinhFirebase;

/**
 * Mở Firestore. Việc khởi tạo Firebase nằm ở `5-ket-noi/firebase-chung.ts` — dùng chung
 * với Authentication, vì `initializeApp()` gọi hai lần là hỏng cả hai bên.
 */
async function moKetNoi() {
  const app = await moFirebase();
  if (!app) return null;
  const { getFirestore, doc, onSnapshot, setDoc } = await import("firebase/firestore");
  return { db: getFirestore(app), doc, onSnapshot, setDoc };
}

/** Lọc từng mảng — bản trên máy chủ có thể thiếu mảng mới thêm sau này. */
function chuanHoa(d: Partial<DuLieuLuu>): DuLieuLuu {
  return {
    deNghi: Array.isArray(d.deNghi) ? d.deNghi : [],
    donHang: Array.isArray(d.donHang) ? d.donHang : [],
    giaDonHang: Array.isArray(d.giaDonHang) ? d.giaDonHang : [],
    phieuNhan: Array.isArray(d.phieuNhan) ? d.phieuNhan : [],
    baoGia: Array.isArray(d.baoGia) ? d.baoGia : [],
    thongBao: Array.isArray(d.thongBao) ? d.thongBao : [],
  };
}

/**
 * 🔴 Firestore KHÔNG nhận `undefined` trong dữ liệu ghi lên — nó ném lỗi và **mất cả lần
 * ghi**. Mà mô hình dữ liệu của app đầy trường tùy chọn (`maHopDongCDT?`, `ghiChu?`,
 * `tepPhieuGiao?`…), chỗ nào không có giá trị là `undefined`.
 *
 * Đi qua JSON để bỏ sạch `undefined` — đúng thứ localStorage vẫn làm, nên dữ liệu hai bên
 * giống hệt nhau.
 */
function bo0Undefined<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

export interface KetNoiKhoChung {
  /** Ngừng lắng nghe. Gọi khi rời trang. */
  dong: () => void;
  /** Đẩy bộ dữ liệu mới lên. */
  day: (d: DuLieuLuu) => Promise<void>;
}

/**
 * Lắng nghe kho chung và trả về cách đẩy dữ liệu lên.
 *
 * `khiCoDuLieu` được gọi mỗi lần dữ liệu trên máy chủ đổi — kể cả do người khác sửa. Đó
 * chính là thứ làm cho hai máy thấy chung một bộ dữ liệu.
 *
 * 🔴 Tham số là `DuLieuLuu | null`, và `null` KHÁC "bộ dữ liệu rỗng". `null` nghĩa là trên
 * máy chủ CHƯA CÓ tài liệu nào — lần đầu cả phòng dùng. Nếu gộp hai thứ này làm một thì máy
 * nào mở app cũng nhận về "rỗng" rồi đem cái rỗng đó ghi đè lên máy chủ, **xóa sạch việc
 * của người khác**. Người gọi phải phân biệt: `null` thì ĐẨY dữ liệu của mình lên, còn có
 * dữ liệu thật thì LẤY VỀ.
 */
export async function noiKhoChung(
  khiCoDuLieu: (d: DuLieuLuu | null) => void,
  khiLoi?: (e: unknown) => void,
): Promise<KetNoiKhoChung | null> {
  if (typeof window === "undefined" || !daCauHinhFirestore()) return null;

  try {
    const kn = await moKetNoi();
    if (!kn) return null;
    const { db, doc, onSnapshot, setDoc } = kn;
    const tep = doc(db, DUONG_DAN.boSuuTap, DUONG_DAN.tep);

    const huy = onSnapshot(
      tep,
      (anh) => {
        const du = anh.data() as Partial<DuLieuLuu> | undefined;
        khiCoDuLieu(du ? chuanHoa(du) : null);
      },
      (e) => khiLoi?.(e),
    );

    return {
      dong: huy,
      day: async (d) => {
        // `merge: false` — ghi đè cả document. Đúng ý: đây là ảnh chụp toàn bộ kho.
        await setDoc(tep, bo0Undefined(d));
      },
    };
  } catch (e) {
    khiLoi?.(e);
    return null;
  }
}
