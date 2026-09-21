// ============================================================
// CHỌN NƠI LƯU RUỘT TỆP ĐÍNH KÈM — Firestore (cũ) hay Cloudflare R2 (mới)
//
// 🔴 CỐ Ý DÙNG CÔNG TẮC RÕ RÀNG, không tự đoán — đúng lệ đã dùng cho `NEXT_PUBLIC_XAC_THUC`.
// Máy có thể đã khai biến R2 nhưng chưa di trú tệp cũ; tự bật là mọi tệp đã có biến mất khỏi
// giao diện trong khi chúng vẫn nằm nguyên trong Firestore. Việc chuyển phải là một quyết
// định có người bấm, sau khi đã chạy công cụ di trú và đối chiếu.
//
//   · `firestore` (mặc định) — cắt mảnh base64 trong Firestore, cách đang chạy từ 12/08/2026
//   · `r2`                   — Cloudflare R2, bucket `hpcons-thumua` (Sếp chốt 21/09/2026)
//
// ⚠️ ĐƯỜNG LÙI: gỡ biến `NEXT_PUBLIC_KHO_TEP` là app quay lại đọc Firestore ngay, không phải
// sửa code. Dữ liệu cũ trong Firestore KHÔNG bị công cụ di trú xoá — giữ nguyên ít nhất một
// tuần làm đường lùi, đúng như cách đã làm khi tách project Firebase.
//
// ⚠️ NHƯNG ĐƯỜNG LÙI CHỈ SẠCH KHI CHƯA AI TẢI TỆP MỚI. Tệp tải lên trong lúc chạy R2 nằm ở
// R2 và KHÔNG tự theo về Firestore — lùi sau đó là những tệp mới đó không mở được nữa.
// ============================================================

import {
  dayTepLenMayChu as dayLenFirestore,
  taiTepTuMayChu as taiVeFirestore,
  xoaTepTrenMayChu as xoaTrenFirestore,
  type MoTaTepMayChu,
} from "@/3-du-lieu/kho-tep-firestore";
import {
  dayTepLenMayChuR2,
  taiTepTuMayChuR2,
  xoaTepTrenMayChuR2,
} from "@/3-du-lieu/kho-tep-r2";

export type { MoTaTepMayChu };

/**
 * ⚠️ `.trim().toLowerCase()` là bắt buộc — xem lịch sử lỗi thật ngày 12/08/2026: biến môi
 * trường dính ký tự xuống dòng khiến app lặng lẽ chạy nhánh sai mà không ai biết.
 */
function docKhoTep(): "firestore" | "r2" {
  return (process.env.NEXT_PUBLIC_KHO_TEP ?? "").trim().toLowerCase() === "r2" ? "r2" : "firestore";
}

export const KHO_TEP: "firestore" | "r2" = docKhoTep();

/** Đưa nội dung tệp lên máy chủ. `false` = không đẩy được, nơi gọi phải báo người dùng. */
export async function dayTepLenMayChu(
  id: string,
  blob: Blob,
  mt: MoTaTepMayChu,
): Promise<boolean> {
  return KHO_TEP === "r2" ? dayTepLenMayChuR2(id, blob, mt) : dayLenFirestore(id, blob, mt);
}

/**
 * Tải tệp về. `null` = không lấy được.
 *
 * 🔴 CHẠY R2 THÌ VẪN THỬ FIRESTORE KHI KHÔNG THẤY. Trong tuần chuyển tiếp, tệp cũ có thể
 * chưa di trú xong hoặc di trú sót; rơi về kho cũ thì người dùng vẫn mở được chứng từ thay vì
 * gặp ô trống. Không có nhánh này thì một tệp sót là một hồ sơ không mở được, mà lỗi lại
 * lặng lẽ — người dùng chỉ thấy "không có gì".
 */
export async function taiTepTuMayChu(id: string): Promise<Blob | null> {
  if (KHO_TEP !== "r2") return taiVeFirestore(id);
  const tuR2 = await taiTepTuMayChuR2(id);
  if (tuR2) return tuR2;
  return taiVeFirestore(id);
}

/**
 * Xoá tệp.
 *
 * 📌 Xoá ở CẢ HAI nơi khi đang chạy R2 — tệp cũ chưa di trú thì bản Firestore mới là bản
 * thật; xoá mỗi R2 là bản cũ nằm lại vĩnh viễn, và nhánh rơi về ở `taiTepTuMayChu` sẽ moi
 * nó lên lại sau khi người dùng tưởng đã xoá xong.
 */
export async function xoaTepTrenMayChu(id: string): Promise<void> {
  /* 🔴 DỌN FIRESTORE TRƯỚC, R2 SAU. Nếu R2 xoá hụt mà Firestore chưa dọn thì nhánh rơi về ở
     `taiTepTuMayChu` sẽ moi bản Firestore lên lại — người dùng xoá xong vẫn thấy tệp, tưởng
     app hỏng. Dọn Firestore trước thì trường hợp xấu nhất chỉ còn một tệp thừa nằm trong kho
     R2 mà không giao diện nào trỏ tới. */
  await xoaTrenFirestore(id);
  if (KHO_TEP !== "r2") return;
  const xong = await xoaTepTrenMayChuR2(id);
  if (!xong) {
    console.warn(`[kho tệp] Tệp ${id} đã gỡ khỏi hồ sơ nhưng CÒN NẰM trong kho R2 — cần dọn tay.`);
  }
}
