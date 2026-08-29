// ============================================================
// NHẬT KÝ HỆ THỐNG — ghi lại AI làm gì, LÚC NÀO, cho những hành động quan trọng/không thể
// hoàn tác của app (khác hẳn "Lịch sử hoạt động" của TỪNG đề nghị, vốn nằm ngay trong
// chính hồ sơ đề nghị đó).
//
// 🔴 VÌ SAO TÁCH RIÊNG KHỎI `chay-thu/du-lieu-chung` — phát hiện sáng 29/08/2026: Sếp báo
// "Quy trình mua hàng" trống trơn, không còn đề nghị mẫu (990001) từng tạo hôm trước. Tra
// thẳng Firestore mới biết: TOÀN BỘ dữ liệu nghiệp vụ nằm chung MỘT document
// (`chay-thu/du-lieu-chung`), và nút "Xóa dữ liệu chạy thử" (`xoaDuLieuChayThu`) ghi ĐÈ cả
// document đó — kể cả `lichSuCauHinh` (nhật ký cấu hình) cũng nằm CÙNG document nên biến
// mất theo. Đúng lúc cần biết ai đã xóa thì thứ có thể trả lời câu đó cũng bị xóa cùng lượt.
// Không có cách nào tra ngược lại được ai đã bấm, lúc nào — chỉ biết qua `updateTime` của
// chính document là 28/08/2026 18:54, không hơn.
//
// Nhật ký này nằm ở COLLECTION RIÊNG (`nhat-ky-he-thong`), KHÔNG bị đụng tới bởi
// `xoaDuLieuChayThu()` hay bất kỳ hành động ghi nào khác lên `chay-thu/du-lieu-chung` — dù
// dữ liệu nghiệp vụ có bị xóa sạch bao nhiêu lần, nhật ký vẫn còn nguyên.
//
// 🔴 CHỈ GHI THÊM (create), KHÔNG SỬA/XÓA ĐƯỢC — xem quy tắc tương ứng trong
// `firestore-chay-thu.rules`. Nhật ký mà tự sửa/xóa được thì mất hết ý nghĩa tồn tại (ai xóa
// dữ liệu xong tiện tay xóa luôn đúng dòng nhật ký tố cáo chính mình).
//
// 📌 GHI KHÔNG CHỜ Ở NƠI GỌI (`void ghiNhatKyHeThong(...)`): ghi nhật ký lỗi (mất mạng, v.v.)
// không được phép làm hỏng hành động chính người dùng đang chờ — vd bấm "Xóa dữ liệu chạy
// thử" vẫn phải chạy dù dòng ghi log bị rớt mạng giữa chừng.
// ============================================================

import type { NguoiDung } from "@/4-phan-quyen/quyen";
import { moFirebase } from "@/5-ket-noi/firebase-chung";

export const TEN_COLLECTION_NHAT_KY = "nhat-ky-he-thong";

export interface MucNhatKyHeThong {
  id: string;
  thoiDiem: Date;
  nguoiThucHienUid: string;
  nguoiThucHienTen: string;
  /** Mã hành động ngắn, ví dụ "xoa_du_lieu_chay_thu" — dùng để lọc/thống kê sau này. */
  hanhDong: string;
  /** Câu mô tả đầy đủ, hiện thẳng ra màn hình — không cần tra thêm bảng nào khác để hiểu. */
  moTa: string;
}

/**
 * Ghi 1 dòng nhật ký hệ thống.
 *
 * ⚠️ GỌI TRƯỚC KHI LÀM HÀNH ĐỘNG CHÍNH, không phải sau — nếu hành động chính (vd xóa dữ
 * liệu) làm trang tải lại ngay (xem `xoaDuLieuChayThu`), gọi log SAU thì request ghi log có
 * thể chưa kịp gửi đi đã bị hủy giữa chừng bởi `window.location.href`.
 */
export async function ghiNhatKyHeThong(
  nguoiDung: Pick<NguoiDung, "uid" | "tenHienThi">,
  hanhDong: string,
  moTa: string,
): Promise<void> {
  const app = await moFirebase();
  // Chưa cấu hình Firebase (máy dev chưa có .env.local) — bỏ qua, không phải lỗi thật.
  if (!app) return;
  const { getFirestore, collection, addDoc, serverTimestamp } = await import(
    "firebase/firestore"
  );
  const db = getFirestore(app);
  await addDoc(collection(db, TEN_COLLECTION_NHAT_KY), {
    thoiDiem: serverTimestamp(),
    nguoiThucHienUid: nguoiDung.uid,
    nguoiThucHienTen: nguoiDung.tenHienThi,
    hanhDong,
    moTa,
  });
}

/**
 * Lắng nghe nhật ký hệ thống theo thời gian thực, MỚI NHẤT LÊN ĐẦU. Trả về hàm hủy lắng
 * nghe — gọi khi component gỡ bỏ, giống mọi `onSnapshot` khác trong app.
 *
 * 📌 GIỚI HẠN 200 DÒNG MỚI NHẤT: đủ dùng cho việc tra cứu "vừa xảy ra chuyện gì", không cần
 * tải cả lịch sử vô hạn về trình duyệt mỗi lần mở trang.
 */
export function dangNgheNhatKyHeThong(
  khiCoDuLieu: (muc: MucNhatKyHeThong[]) => void,
  khiLoi?: (e: unknown) => void,
): () => void {
  let huyThat: (() => void) | null = null;
  let daHuy = false;
  void (async () => {
    const app = await moFirebase();
    if (!app || daHuy) return;
    const { getFirestore, collection, query, orderBy, limit, onSnapshot } = await import(
      "firebase/firestore"
    );
    const db = getFirestore(app);
    const q = query(
      collection(db, TEN_COLLECTION_NHAT_KY),
      orderBy("thoiDiem", "desc"),
      limit(200),
    );
    huyThat = onSnapshot(
      q,
      (snap) => {
        khiCoDuLieu(
          snap.docs.map((d) => {
            const v = d.data() as Record<string, unknown>;
            const moc = v.thoiDiem as { toDate?: () => Date } | undefined;
            return {
              id: d.id,
              thoiDiem: moc?.toDate?.() ?? new Date(),
              nguoiThucHienUid: (v.nguoiThucHienUid as string) ?? "",
              nguoiThucHienTen: (v.nguoiThucHienTen as string) ?? "",
              hanhDong: (v.hanhDong as string) ?? "",
              moTa: (v.moTa as string) ?? "",
            };
          }),
        );
      },
      (e) => khiLoi?.(e),
    );
    // `duocVao()` ở phía server cần lúc Auth ổn định — nếu bị hủy TRƯỚC khi effect này chạy
    // xong (component gỡ bỏ rất nhanh), gỡ luôn listener vừa tạo, đừng để nó treo lại.
    if (daHuy) huyThat();
  })();
  return () => {
    daHuy = true;
    huyThat?.();
  };
}
