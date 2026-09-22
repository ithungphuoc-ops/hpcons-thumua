// ============================================================
// KHOÁ MỀM — cho mọi người thấy AI ĐANG SỬA cái gì (đợt 1, Sếp chốt 22/09/2026)
//
// 🔴 VẤN ĐỀ NÓ GIẢI: hai người mở cùng một đơn rồi cùng sửa, người lưu sau đè mất việc người
// lưu trước — im lặng, không ai hay. Đã mất 5 đơn thật (xem ghi chép sự cố 15/09/2026 trong
// `kho-du-lieu.tsx`). Khoá mềm KHÔNG chữa được gốc rễ đó; nó chỉ **ngăn va chạm xảy ra** bằng
// cách cho người thứ hai thấy trước khi họ bắt đầu gõ.
//
// ⚠️ ĐỪNG NHẦM ĐÂY LÀ BẢN VÁ. Chữa gốc là việc của đợt 2 (đổi mảng sang map, ghi từng phần) và
// đợt 3 (giao dịch). Khoá mềm chỉ làm giảm SỐ LẦN đụng, không làm mất khả năng đụng.
//
// ============================================================
// BA QUYẾT ĐỊNH THIẾT KẾ — mỗi cái một lý do thật
// ============================================================
//
// ① LƯU VÀO KHO RIÊNG `dang-sua`, KHÔNG lưu vào `chay-thu/du-lieu-chung`.
//    Kho chung đang bị ghi đè cả tài liệu mỗi lần lưu — nhét cờ "đang sửa" vào đó là vừa bị
//    xoá mất theo, vừa **tự sinh thêm một lượt ghi vào đúng chỗ đang nghẽn**. Đó là đổ thêm
//    dầu vào lửa, không phải chữa cháy.
//
// ② MỖI NGƯỜI MỖI BẢN GHI MỘT TÀI LIỆU RIÊNG (`{loai}__{id}__{uid}`), không phải một tài
//    liệu chung cho cả bản ghi. Nếu chung, hai người mở cùng lúc lại đè nhau ngay tại chính
//    cái cơ chế sinh ra để chống đè nhau.
//
// ③ TỰ HẾT HẠN BẰNG NHỊP TIM, không dựa vào lúc đóng màn hình. Người dùng tắt tab, mất mạng,
//    máy sập — không có gì bảo đảm lệnh "nhả khoá" chạy được. Nên mỗi máy tự đập nhịp đều
//    đặn; quá `HAN_SONG_MS` mà không thấy nhịp thì coi như người đó đã rời đi.
// ============================================================

import { moFirebase, daCauHinhFirebase } from "@/5-ket-noi/firebase-chung";

/** Kho riêng cho khoá mềm. KHÔNG dùng chung với dữ liệu nghiệp vụ — xem quyết định ① ở trên. */
export const KHO_DANG_SUA = "dang-sua";

/** Nhịp đập: 20 giây một lần. */
export const NHIP_DAP_MS = 20_000;

/**
 * Quá 60 giây không thấy nhịp thì coi như đã rời đi.
 *
 * ⚠️ PHẢI LỚN HƠN NHỊP ĐẬP ÍT NHẤT GẤP ĐÔI. Bằng hoặc sát nhịp đập thì chỉ cần mạng chậm một
 * nhịp là người đang ngồi đó bị coi như đã đi — cảnh báo nhấp nháy tắt bật, người dùng mất tin.
 */
export const HAN_SONG_MS = 60_000;

export interface NguoiDangSua {
  uid: string;
  ten: string;
  /** Mốc nhịp cuối, dạng ISO. Dùng để tính còn sống hay đã rời đi. */
  nhipCuoi: string;
}

/** Mã tài liệu khoá — ghép loại + bản ghi + người, để mỗi người một dòng riêng (quyết định ②). */
function maKhoa(loai: string, id: string, uid: string): string {
  return `${loai}__${id}__${uid}`;
}

/** Tiền tố để lọc mọi người đang sửa CÙNG một bản ghi. */
function tienTo(loai: string, id: string): string {
  return `${loai}__${id}__`;
}

/** Còn sống = nhịp cuối cách đây chưa quá `HAN_SONG_MS`. */
export function conDangSua(nhipCuoi: string, bayGio = Date.now()): boolean {
  const t = new Date(nhipCuoi).getTime();
  if (!Number.isFinite(t)) return false;
  return bayGio - t < HAN_SONG_MS;
}

async function moKho() {
  const app = await moFirebase();
  if (!app) return null;
  const fs = await import("firebase/firestore");
  return { db: fs.getFirestore(app), fs };
}

/**
 * Báo "tôi đang mở bản ghi này". Gọi lại đều đặn theo `NHIP_DAP_MS` để giữ nhịp.
 *
 * Nuốt lỗi có chủ ý: khoá mềm hỏng thì cùng lắm là mất cảnh báo — KHÔNG được chặn người dùng
 * làm việc. Đây là tính năng phụ trợ, không phải đường sống của quy trình.
 */
export async function dapNhip(loai: string, id: string, uid: string, ten: string): Promise<void> {
  if (!daCauHinhFirebase() || !uid || !id) return;
  try {
    const kn = await moKho();
    if (!kn) return;
    const { db, fs } = kn;
    await fs.setDoc(fs.doc(db, KHO_DANG_SUA, maKhoa(loai, id, uid)), {
      loai,
      banGhiId: id,
      uid,
      ten,
      nhipCuoi: new Date().toISOString(),
    });
  } catch {
    /* im lặng — xem chú thích trên */
  }
}

/** Nhả khoá khi rời màn hình. Không chắc chạy được (tắt tab đột ngột) nên nhịp tim mới là chốt thật. */
export async function nhaKhoa(loai: string, id: string, uid: string): Promise<void> {
  if (!daCauHinhFirebase() || !uid || !id) return;
  try {
    const kn = await moKho();
    if (!kn) return;
    const { db, fs } = kn;
    await fs.deleteDoc(fs.doc(db, KHO_DANG_SUA, maKhoa(loai, id, uid)));
  } catch {
    /* im lặng */
  }
}

/**
 * Lắng nghe xem AI KHÁC đang mở cùng bản ghi này.
 *
 * 🔴 LỌC BỎ CHÍNH MÌNH. Không lọc thì người dùng thấy cảnh báo "bạn đang sửa" của chính mình —
 * vừa vô nghĩa vừa làm họ tưởng có người thứ hai.
 *
 * Trả hàm huỷ; `null` khi chưa cấu hình được Firebase (máy lập trình viên chưa có `.env.local`).
 */
export async function ngheNguoiKhacDangSua(
  loai: string,
  id: string,
  uidCuaToi: string,
  khiDoi: (ds: NguoiDangSua[]) => void,
): Promise<(() => void) | null> {
  if (!daCauHinhFirebase() || !id) return null;
  try {
    const kn = await moKho();
    if (!kn) return null;
    const { db, fs } = kn;

    /* Lọc theo tiền tố mã tài liệu — rẻ hơn `where` trên trường vì không cần chỉ mục riêng. */
    const dau = tienTo(loai, id);
    const cuoi = dau + "";
    const truyVan = fs.query(
      fs.collection(db, KHO_DANG_SUA),
      fs.orderBy(fs.documentId()),
      fs.startAt(dau),
      fs.endAt(cuoi),
    );

    return fs.onSnapshot(
      truyVan,
      (anh) => {
        const bayGio = Date.now();
        const ds: NguoiDangSua[] = [];
        anh.forEach((d) => {
          const x = d.data() as Partial<NguoiDangSua>;
          if (!x.uid || x.uid === uidCuaToi) return;
          if (typeof x.nhipCuoi !== "string" || !conDangSua(x.nhipCuoi, bayGio)) return;
          ds.push({ uid: x.uid, ten: String(x.ten ?? ""), nhipCuoi: x.nhipCuoi });
        });
        khiDoi(ds);
      },
      () => khiDoi([]),
    );
  } catch {
    return null;
  }
}
