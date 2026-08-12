// ============================================================
// NỘI DUNG TỆP TRÊN FIRESTORE — để máy khác mở xem được
//
// 🔴 Chỉ đạo Ban lãnh đạo 12/08/2026: *"lưu vào firestore nhé"*.
//
// Trước đó nội dung tệp chỉ nằm trong IndexedDB của máy đã tải lên. Trưởng bộ phận mở bằng
// máy khác thấy TÊN tệp nhưng bấm Xem thì không có gì — đúng lỗi Sếp báo: *"sao tk trưởng bộ
// phận ko xem được hình ảnh file này"*.
//
// ⚠️ VÌ SAO KHÔNG DÙNG CLOUD STORAGE (đúng chuẩn hơn): Storage chưa bật trên project và
// nhiều khả năng đòi nâng gói Blaze (phải gắn thẻ). Sếp chọn Firestore để chạy được ngay.
// Khi công ty bật Storage thì chỉ thay ruột file này, giao diện không phải sửa.
//
// ============================================================
// CÁCH LƯU: CẮT TỆP THÀNH NHIỀU MẢNH
// ============================================================
//
// 🔴 Firestore giới hạn **1MB cho MỘT tài liệu**, mà mã hóa base64 làm dữ liệu phình thêm
// ~33%. Nên không thể nhét cả tệp vào một tài liệu:
//
//   tep/{tepId}            → phần mô tả (tên, kiểu, cỡ, số mảnh)
//   tep/{tepId}/manh/{i}   → từng mảnh base64
//
// ⚠️ `CO_MANH` phải chừa biên an toàn. Một tài liệu Firestore tính cả tên trường, khóa và
// phần đầu, không chỉ nội dung — sát 1MB là gặp lỗi "document too large" ở đúng những tệp
// lớn, tức là lúc người dùng cần nhất.
// ============================================================

import { moFirebase, daCauHinhFirebase } from "@/5-ket-noi/firebase-chung";

const BO_SUU_TAP = "tep";
const BO_MANH = "manh";

/**
 * Số ký tự base64 mỗi mảnh ≈ 600KB, tương ứng ~450KB dữ liệu gốc.
 * Chừa hơn 40% biên so với giới hạn 1MB của Firestore.
 */
const CO_MANH = 600_000;

export interface MoTaTepMayChu {
  tenTep: string;
  kieuMime: string;
  kichThuoc: number;
  soManh: number;
  nguoiTaiUid: string;
  nguoiTaiTen: string;
  thoiDiem: string;
}

async function moFirestore() {
  const app = await moFirebase();
  if (!app) return null;
  const fs = await import("firebase/firestore");
  return { db: fs.getFirestore(app), fs };
}

/** Blob → base64 (không kèm phần `data:...;base64,` ở đầu). */
function sangBase64(blob: Blob): Promise<string> {
  return new Promise((nhan, loi) => {
    const doc = new FileReader();
    doc.onload = () => {
      const kq = String(doc.result);
      const dau = kq.indexOf(",");
      nhan(dau >= 0 ? kq.slice(dau + 1) : kq);
    };
    doc.onerror = () => loi(doc.error ?? new Error("Không đọc được tệp"));
    doc.readAsDataURL(blob);
  });
}

/** base64 → Blob. */
function tuBase64(b64: string, kieuMime: string): Blob {
  const nhiPhan = atob(b64);
  const byte = new Uint8Array(nhiPhan.length);
  for (let i = 0; i < nhiPhan.length; i++) byte[i] = nhiPhan.charCodeAt(i);
  return new Blob([byte], { type: kieuMime });
}

/**
 * Đưa nội dung tệp lên máy chủ.
 *
 * 🔴 GHI CÁC MẢNH TRƯỚC, GHI PHẦN MÔ TẢ SAU CÙNG. Nếu ghi mô tả trước rồi mất mạng giữa lúc
 * đẩy mảnh, máy khác sẽ đọc thấy mô tả (có `soManh`) nhưng thiếu mảnh — tệp hỏng mà app lại
 * tưởng có. Ghi mô tả cuối thì tệp chưa xong coi như CHƯA TỒN TẠI, an toàn hơn hẳn.
 *
 * Trả `false` khi không đẩy được — nơi gọi phải báo cho người dùng, đừng nuốt lỗi.
 */
export async function dayTepLenMayChu(
  id: string,
  blob: Blob,
  mt: MoTaTepMayChu,
): Promise<boolean> {
  if (!daCauHinhFirebase()) return false;
  const kn = await moFirestore();
  if (!kn) return false;
  const { db, fs } = kn;

  try {
    const b64 = await sangBase64(blob);
    const soManh = Math.max(1, Math.ceil(b64.length / CO_MANH));

    for (let i = 0; i < soManh; i++) {
      await fs.setDoc(fs.doc(db, BO_SUU_TAP, id, BO_MANH, String(i)), {
        b64: b64.slice(i * CO_MANH, (i + 1) * CO_MANH),
      });
    }

    // Mô tả ghi CUỐI CÙNG — xem lý do ở chú thích trên.
    await fs.setDoc(fs.doc(db, BO_SUU_TAP, id), { ...mt, soManh });
    return true;
  } catch (e) {
    console.error("[kho tệp] đẩy lên máy chủ hỏng:", e);
    return false;
  }
}

/**
 * Tải nội dung tệp từ máy chủ. Trả `null` khi không có hoặc không đọc được.
 *
 * ⚠️ Thiếu một mảnh thì trả `null` chứ KHÔNG ghép phần còn lại: một tệp PDF thiếu ruột vẫn
 * mở ra được nhưng nội dung sai lệch — với chứng từ thì đó là thứ tệ hơn cả không mở được.
 */
export async function taiTepTuMayChu(id: string): Promise<Blob | null> {
  if (!daCauHinhFirebase()) return null;
  const kn = await moFirestore();
  if (!kn) return null;
  const { db, fs } = kn;

  try {
    const anh = await fs.getDoc(fs.doc(db, BO_SUU_TAP, id));
    if (!anh.exists()) return null;
    const mt = anh.data() as MoTaTepMayChu;

    const phan: string[] = [];
    for (let i = 0; i < mt.soManh; i++) {
      const m = await fs.getDoc(fs.doc(db, BO_SUU_TAP, id, BO_MANH, String(i)));
      if (!m.exists()) {
        console.error(`[kho tệp] thiếu mảnh ${i}/${mt.soManh} của ${id}`);
        return null;
      }
      phan.push((m.data() as { b64: string }).b64);
    }
    return tuBase64(phan.join(""), mt.kieuMime);
  } catch (e) {
    console.error("[kho tệp] tải từ máy chủ hỏng:", e);
    return null;
  }
}

/** Xóa tệp khỏi máy chủ — cả mô tả và mọi mảnh. */
export async function xoaTepTrenMayChu(id: string): Promise<void> {
  if (!daCauHinhFirebase()) return;
  const kn = await moFirestore();
  if (!kn) return;
  const { db, fs } = kn;

  try {
    const anh = await fs.getDoc(fs.doc(db, BO_SUU_TAP, id));
    // Xóa MẢNH TRƯỚC rồi mới xóa mô tả: mất mô tả trước là không còn biết có bao nhiêu
    // mảnh để dọn, và các mảnh đó nằm lại vĩnh viễn không ai tìm ra.
    if (anh.exists()) {
      const soManh = (anh.data() as MoTaTepMayChu).soManh ?? 0;
      for (let i = 0; i < soManh; i++) {
        await fs.deleteDoc(fs.doc(db, BO_SUU_TAP, id, BO_MANH, String(i)));
      }
    }
    await fs.deleteDoc(fs.doc(db, BO_SUU_TAP, id));
  } catch (e) {
    // Xóa không được thì thôi — sót một tệp rác không đáng để chặn việc người dùng đang làm.
    console.error("[kho tệp] xóa trên máy chủ hỏng:", e);
  }
}
