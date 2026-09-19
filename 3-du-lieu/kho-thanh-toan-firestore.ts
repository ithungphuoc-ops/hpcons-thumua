// ============================================================
// KHO ĐỢT THANH TOÁN — MỘT TÀI LIỆU RIÊNG, KHÔNG NẰM TRONG `chay-thu/du-lieu-chung`
//
// ★★ Sếp 18/09/2026, yêu cầu ③+④ của màn Công nợ: ghi được số tiền đã trả từng đợt cho mỗi đơn.
//
// 🔴🔴 VÌ SAO TÁCH HẲN RA MỘT TÀI LIỆU — ĐỌC HẾT TRƯỚC KHI GỘP LẠI CHO "GỌN".
//
// Kho chung (`kho-chung-firestore.ts`) có hai tính chất, mỗi cái hợp lý riêng nhưng cộng lại
// thành một cái bẫy:
//   ① đẩy lên bằng `setDoc(..., merge:false)` — mỗi lượt ghi là **đè cả tài liệu**;
//   ② nhận về thì lọc qua `chuanHoa` — một **danh sách trắng** các khoá đã biết.
//
// Hệ quả: **một tab đang mở bản deploy CŨ** (chưa biết khoá mới) sẽ đẩy lên một ảnh chụp không
// có khoá đó, và **xoá sạch dữ liệu của cả phòng — im lặng, không một dòng lỗi**. Đây không phải
// lo xa: đúng ca này đã nổ ngày 13/08/2026 với `cauHinh` (cấu hình quy trình bị lột mỗi lần một
// máy cũ ghi). Lần này thứ bị xoá sẽ là **TIỀN**, nên không được phép chấp nhận.
//
// ✅ Tài liệu riêng cắt hẳn ca đó: máy chạy bản cũ **không biết tài liệu này tồn tại**, nên không
// thể ghi đè nó. Đổi lại, phải tự lo phần nghe/ghi ở đây — đó là cái giá đáng trả cho dữ liệu tiền.
//
// 🔴 VẪN GIỮ NGUYÊN BA CHỐT AN TOÀN của kho chung (CLAUDE.md §3.6b), vì chúng sinh ra từ sự cố
// mất dữ liệu thật, không phải lý thuyết:
//   · **chưa nghe máy chủ nói gì thì không được đẩy lên** — bỏ chốt này là máy mới mở app đẩy bộ
//     rỗng lên và xoá sạch việc cả phòng;
//   · **`null` (máy chủ chưa có tài liệu) KHÁC danh sách rỗng** — gộp hai thứ này dẫn tới đúng
//     cách xoá sạch ở trên;
//   · **phải có hàng chờ** — `onSnapshot` có thể bắn trước khi kết nối kịp trả về, đẩy thẳng lúc
//     đó là lần ghi đầu tiên rơi mất im lặng.
//   (Ba chốt này thực thi ở `kho-du-lieu.tsx`, tệp này chỉ cung cấp đường nghe/ghi.)
//
// ⚠️ TỆP NÀY KHÔNG BAO GIỜ ĐƯỢC GỌI TỪ MÁY CHỦ. Đường ghi phía Admin SDK (route handler) hiện
// không đụng tới đợt thanh toán; nếu về sau cần, hãy trỏ đúng `DUONG_DAN_THANH_TOAN` dưới đây
// thay vì gõ lại chuỗi — gõ lại là hai nơi trỏ hai tài liệu khác nhau mà không ai biết.
// ============================================================

import { daCauHinhFirebase, moFirebase } from "@/5-ket-noi/firebase-chung";
import { bo0Undefined } from "@/3-du-lieu/kho-chung-firestore";
import type { DotThanhToanPO } from "@/3-du-lieu/kieu-du-lieu";

/**
 * Tài liệu giữ toàn bộ đợt thanh toán của bản chạy thử.
 *
 * 📌 CÙNG BỘ SƯU TẬP `chay-thu` với kho chung để rules hiện hành (`firestore-gop-tach.rules`,
 * khối `match /chay-thu/{id}`) phủ luôn — không phải publish rules mới thì tính năng mới chạy
 * được. Khi bật cấu trúc tách document thì mới cần khối riêng, xem `DUONG_DAN_TACH`.
 */
export const DUONG_DAN_THANH_TOAN = { boSuuTap: "chay-thu", tep: "thanh-toan" } as const;

/** Hình dạng tài liệu trên máy chủ. Để dạng object (không phải mảng trần) cho dễ thêm khoá sau. */
export interface KhoThanhToan {
  dotThanhToan: DotThanhToanPO[];
}

export interface KetNoiThanhToan {
  dong: () => void;
  day: (d: KhoThanhToan) => Promise<void>;
}

/**
 * 🔴 DANH SÁCH TRẮNG, CÙNG LÝ DO VỚI `chuanHoa` CỦA KHO CHUNG — nhưng ở đây nó **an toàn** vì
 * tài liệu này chỉ có đúng một khoá. Vẫn giữ hàm để: ① tài liệu cũ/hỏng không làm app sập;
 * ② thêm khoá sau này thì có đúng một chỗ phải sửa.
 *
 * ⚠️ LỌC TỪNG BẢN GHI, không chỉ kiểm mảng. Một phần tử thiếu `id` hoặc `poId` là bản ghi không
 * truy ngược được về đơn nào — giữ lại chỉ làm số liệu tiền sai mà không ai lần ra nguồn.
 */
function chuanHoa(d: Partial<KhoThanhToan> | undefined): KhoThanhToan {
  const ds = Array.isArray(d?.dotThanhToan) ? d.dotThanhToan : [];
  return {
    dotThanhToan: ds.filter(
      (x): x is DotThanhToanPO =>
        !!x && typeof x.id === "string" && !!x.id && typeof x.poId === "string" && !!x.poId,
    ),
  };
}

export function daCauHinhKhoThanhToan(): boolean {
  return daCauHinhFirebase();
}

/**
 * Nối tài liệu đợt thanh toán. Trả `null` khi chưa cấu hình Firebase — app vẫn chạy, chỉ lưu
 * trên máy, y như kho chung.
 *
 * 🔴 CHỜ FIREBASE AUTH ỔN ĐỊNH RỒI MỚI LẮNG NGHE — chép đúng cách làm của `noiKhoChung`, và đây
 * KHÔNG phải sao chép thừa: Security Rules đòi đăng nhập mới đọc được, mà Auth khôi phục phiên cũ
 * bất đồng bộ. Nghe ngay là lần gọi đầu đi khi chưa có danh tính → máy chủ trả "không có quyền" →
 * app tưởng chưa nối được kho dù người dùng đã đăng nhập. Đã dính thật 12/08/2026 với kho chung.
 */
export async function noiKhoThanhToan(
  khiCoDuLieu: (d: KhoThanhToan | null) => void,
  khiLoi?: (e: unknown) => void,
): Promise<KetNoiThanhToan | null> {
  if (typeof window === "undefined" || !daCauHinhKhoThanhToan()) return null;

  try {
    const app = await moFirebase();
    if (!app) return null;
    const { getFirestore, doc, onSnapshot, setDoc } = await import("firebase/firestore");
    const db = getFirestore(app);
    const tep = doc(db, DUONG_DAN_THANH_TOAN.boSuuTap, DUONG_DAN_THANH_TOAN.tep);

    const { getAuth, onAuthStateChanged } = await import("firebase/auth");
    const auth = getAuth(app);

    let huyNghe: (() => void) | null = null;
    const nghe = () => {
      huyNghe = onSnapshot(
        tep,
        (anh) => {
          const du = anh.data() as Partial<KhoThanhToan> | undefined;
          /* 🔴 `null` = MÁY CHỦ CHƯA CÓ TÀI LIỆU, khác hẳn "có tài liệu nhưng rỗng". Nơi gọi dựa
             vào phân biệt này để quyết định có được đẩy lên hay không — gộp hai thứ là mở đúng
             đường xoá sạch dữ liệu mà ba chốt an toàn sinh ra để chặn. */
          khiCoDuLieu(anh.exists() ? chuanHoa(du) : null);
        },
        (e) => khiLoi?.(e),
      );
    };

    const huyAuth = onAuthStateChanged(auth, () => {
      huyNghe?.();
      huyNghe = null;
      nghe();
    });

    return {
      dong: () => {
        huyNghe?.();
        huyAuth();
      },
      day: async (d) => {
        /* `merge:false` — tài liệu này CHỈ chứa đợt thanh toán, nên đè cả tài liệu là đúng ý
           "ảnh chụp toàn bộ danh sách". Rủi ro bản-cũ-đè đã được cắt bằng chính việc tách tài
           liệu (xem khối chú thích đầu tệp). */
        await setDoc(tep, bo0Undefined(d));
      },
    };
  } catch (e) {
    khiLoi?.(e);
    return null;
  }
}
