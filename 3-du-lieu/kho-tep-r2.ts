// ============================================================
// NỘI DUNG TỆP TRÊN CLOUDFLARE R2 — thay cho cách cắt mảnh base64 trong Firestore
//
// 🔴 Sếp chốt 21/09/2026. Đo được trước khi đổi: 457 tệp hoá thành 1.207 tài liệu Firestore
// (457 mô tả + 750 mảnh), tổng ~274 MB. Firestore tính tiền theo LƯỢT ĐỌC TÀI LIỆU nên mỗi
// lần mở một tệp là đọc hàng loạt mảnh — đây là gốc của ~160.000 lượt đọc/ngày. R2 tính theo
// dung lượng lưu, lượt đọc gần như miễn phí.
//
// 📌 GIỮ NGUYÊN BA HÀM của `kho-tep-firestore.ts` (`dayTepLenMayChu` · `taiTepTuMayChu` ·
// `xoaTepTrenMayChu`) — đúng như người viết tệp đó đã dặn trước từ 12/08/2026: *"Khi công ty
// bật Storage thì chỉ thay ruột file này, giao diện không phải sửa."* Năm màn hình dùng tệp
// đính kèm không phải đụng một dòng.
//
// ============================================================
// BA BƯỚC KHI TẢI LÊN — VÀ VÌ SAO PHẢI ĐỦ BA
// ============================================================
//
//   ① Xin link ký sẵn  (`/api/tep/ky-link`, việc `tai-len`)
//   ② PUT THẲNG lên R2 — KHÔNG đi qua máy chủ app
//   ③ Hỏi lại máy chủ xem tệp có thật trong kho chưa (việc `xac-nhan`)
//
// 🔴 Bước ② đi thẳng vì Vercel chặn 4,5 MB mỗi lần gọi Route Handler, mà bản scan hợp đồng
// thường vượt xa. App Đề xuất đã vấp đúng trần này ngày 13/09/2026.
//
// 🔴 Bước ③ là bước dễ bỏ nhất và cũng nguy hiểm nhất nếu bỏ. Không hỏi lại thì mọi thứ dựa
// vào lời khai của trình duyệt: mạng đứt giữa chừng là app ghi nhận "đã lưu" cho một tệp
// rỗng. Đúng kiểu lỗi đã đốt cả tuần 13–17/09/2026 ở đường Đề xuất → Kho — báo thành công
// trong khi thực tế không có gì.
// ============================================================

import { moFirebase } from "@/5-ket-noi/firebase-chung";
import type { MoTaTepMayChu } from "@/3-du-lieu/kho-tep-firestore";

/** Vé đăng nhập hiện tại — mọi lần gọi cửa cấp link đều phải kèm, không có thì máy chủ từ chối. */
async function layVe(): Promise<string | null> {
  const app = await moFirebase();
  if (!app) return null;
  const { getAuth } = await import("firebase/auth");
  const nguoi = getAuth(app).currentUser;
  return nguoi ? nguoi.getIdToken() : null;
}

async function goiCuaLink(
  than: { viec: "tai-len" | "doc" | "xac-nhan"; tepId: string; kieuMime?: string },
): Promise<Record<string, unknown> | null> {
  const ve = await layVe();
  if (!ve) return null;
  const res = await fetch("/api/tep/ky-link", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ve}` },
    body: JSON.stringify(than),
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Đưa nội dung tệp lên kho R2. Trả `false` khi không đẩy được — nơi gọi PHẢI báo cho người
 * dùng, đừng nuốt lỗi (giữ đúng giao ước của bản Firestore trước đây).
 *
 * 📌 `mt` (mô tả tệp) KHÔNG ghi ở đây. Bản ghi mô tả vẫn nằm trong dữ liệu nghiệp vụ như cũ
 * — R2 chỉ giữ ruột tệp. Tách vậy để giao diện không phải đổi cách đọc danh sách đính kèm.
 */
export async function dayTepLenMayChuR2(
  id: string,
  blob: Blob,
  _mt: MoTaTepMayChu,
): Promise<boolean> {
  try {
    const xin = await goiCuaLink({ viec: "tai-len", tepId: id, kieuMime: blob.type || "application/octet-stream" });
    const link = xin?.link as string | undefined;
    if (!link) return false;

    const day = await fetch(link, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": blob.type || "application/octet-stream" },
    });
    if (!day.ok) return false;

    /* Hỏi lại máy chủ — xem khối chú thích đầu tệp, bước ③. */
    const xac = await goiCuaLink({ viec: "xac-nhan", tepId: id });
    return Boolean(xac?.coTrongKho);
  } catch {
    return false;
  }
}

/** Tải tệp về. Trả `null` khi không lấy được — giao diện phải hiểu là "chưa có", không được
 *  bày ra một tệp rỗng. */
export async function taiTepTuMayChuR2(id: string): Promise<Blob | null> {
  try {
    const xin = await goiCuaLink({ viec: "doc", tepId: id });
    const link = xin?.link as string | undefined;
    if (!link) return null;
    const res = await fetch(link);
    if (!res.ok) return null;
    return res.blob();
  } catch {
    return null;
  }
}

/**
 * Xoá tệp khỏi kho.
 *
 * 📌 Đi qua cửa `/api/tep/xoa` chứ không ký link xoá: link ký sẵn để xoá là thứ nguy hiểm —
 * rơi vào tay ai là người đó xoá được chứng từ mà không cần đăng nhập.
 */
export async function xoaTepTrenMayChuR2(id: string): Promise<boolean> {
  try {
    const ve = await layVe();
    if (!ve) return false;
    const res = await fetch("/api/tep/xoa", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ve}` },
      body: JSON.stringify({ tepId: id }),
    });
    if (!res.ok) {
      console.warn(`[kho tệp R2] Xoá ${id} không thành công (mã ${res.status}) — tệp còn nằm lại trong kho.`);
      return false;
    }
    return true;
  } catch (e) {
    /* 🔴 KHÔNG NÉM RA NGOÀI, nhưng cũng KHÔNG im lặng. Ném là chặn người dùng xoá dòng đính
       kèm khỏi hồ sơ — việc của họ đứng lại vì một lỗi kho. Im lặng thì tệp nằm lại vĩnh viễn
       mà không ai biết. Nên: báo về `false` cho nơi gọi quyết định, kèm một dòng trong Console
       để còn lần ra khi cần dọn. */
    console.warn(`[kho tệp R2] Xoá ${id} lỗi:`, e);
    return false;
  }
}
