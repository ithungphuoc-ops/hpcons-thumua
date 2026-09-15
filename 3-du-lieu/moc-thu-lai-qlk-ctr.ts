// ============================================================
// MỐC THỬ LẠI QLK CTR — CẤT TRÊN TỪNG MÁY (localStorage), CỐ Ý KHÔNG CẤT LÊN KHO CHUNG
//
// 🔴 VÌ SAO KHÔNG CẤT LÊN KHO CHUNG — đây là quyết định quan trọng nhất của tệp này.
//
// Kho chung là MỘT tài liệu Firestore cho cả công ty. Ghi mốc thử lại lên đó nghĩa là: mỗi lần
// thử gửi một PO lại sinh thêm **một lần ghi toàn bộ tài liệu**, rồi `onSnapshot` dội về mọi máy
// đang mở app, rồi mọi máy lại quét lại danh sách PO lỗi… Tức là dùng đúng cơ chế đang gây sự cố
// để chữa sự cố đó. Vòng lặp 15/09/2026 (1565 lỗi console, Firestore trả *"Write stream exhausted
// maximum allowed queued writes"*) sinh ra chính xác theo kiểu này — xem chú thích
// `daThuDongBoQlkCtrPhienNay` trong `kho-du-lieu.tsx`.
//
// 📌 ĐÁNH ĐỔI PHẢI BIẾT: mỗi máy đếm riêng. Năm người cùng mở app thì trong giờ đầu có thể có
// năm lượt thử cho cùng một PO thay vì một. Chấp nhận được, vì:
//   · 5 lượt/giờ so với "mỗi thao tác của bất kỳ ai × mỗi máy, không giới hạn" là khác nhau về
//     bậc, không phải về mức độ;
//   · chốt ② (một lượt gửi tại một thời điểm) chặn dội **trong** từng máy;
//   · và cái giá của lựa chọn kia là quay lại đúng vòng lặp vừa vá.
//
// ⚠️ Xóa lịch sử duyệt web / mở chế độ ẩn danh là mất mốc → máy đó thử lại từ đầu. Không sao:
// mất mốc chỉ dẫn tới **thử sớm hơn**, không dẫn tới mất dữ liệu.
//
// 🔴 MỌI LẦN ĐỌC/GHI ĐỀU BỌC `try/catch`. localStorage có thể ném lỗi (chế độ riêng tư, hết chỗ,
// trình duyệt chặn). Mốc thử lại là thứ phụ trợ — hỏng thì phải rơi về "cho thử" chứ TUYỆT ĐỐI
// không được làm sập đường gửi PO.
// ============================================================

import type { MocThuLaiQlkCtr } from "@/2-quy-trinh/nhip-dong-bo-qlk-ctr";

/** Ngăn chứa riêng, không đụng `hpcons-thumua-du-lieu-v1` của `luu-tren-may.ts`. */
const KHOA = "hpcons-thumua-moc-thu-lai-qlk-ctr-v1";

type BangMoc = Record<string, MocThuLaiQlkCtr>;

/**
 * Đọc cả bảng mốc. Hỏng / chưa có / không phải object → trả bảng rỗng.
 *
 * 📌 Bảng rỗng nghĩa là "chưa PO nào có mốc", mà `duocThuLaiQlkCtr(undefined, …)` trả `true` —
 * tức hỏng thì app CHO thử. Đó là chiều an toàn đúng: thà thử thừa một lượt còn hơn một PO lỗi
 * tạm thời kẹt vĩnh viễn.
 */
export function docBangMocThuLai(): BangMoc {
  if (typeof window === "undefined") return {};
  try {
    const s = window.localStorage.getItem(KHOA);
    if (!s) return {};
    const x: unknown = JSON.parse(s);
    if (!x || typeof x !== "object" || Array.isArray(x)) return {};
    const ra: BangMoc = {};
    for (const [id, m] of Object.entries(x as Record<string, unknown>)) {
      if (!m || typeof m !== "object") continue;
      const { soLanDaThu, lanCuoi } = m as Partial<MocThuLaiQlkCtr>;
      if (typeof soLanDaThu !== "number" || typeof lanCuoi !== "number") continue;
      ra[id] = { soLanDaThu, lanCuoi };
    }
    return ra;
  } catch {
    return {};
  }
}

function ghiBang(bang: BangMoc): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KHOA, JSON.stringify(bang));
  } catch (e) {
    // Nuốt có chủ đích, nhưng NÓI RA — mất mốc chỉ làm app thử lại sớm hơn, không mất dữ liệu.
    console.warn("[moc thu lai QLK CTR] không ghi được mốc lên máy:", e);
  }
}

/** Ghi đè mốc của một PO. */
export function ghiMocThuLai(poId: string, moc: MocThuLaiQlkCtr): void {
  const bang = docBangMocThuLai();
  bang[poId] = moc;
  ghiBang(bang);
}

/**
 * Xóa mốc của một PO — gọi khi gửi THÀNH CÔNG.
 *
 * 🔴 KHÔNG ĐƯỢC BỎ BƯỚC NÀY. Giữ lại mốc cũ sau một lần thành công nghĩa là lần sau PO đó hỏng
 * thật thì đã đứng sẵn ở bậc 2 giờ, tức gần như không còn tự thử lại nữa.
 */
export function xoaMocThuLai(poId: string): void {
  const bang = docBangMocThuLai();
  if (!(poId in bang)) return;
  delete bang[poId];
  ghiBang(bang);
}
