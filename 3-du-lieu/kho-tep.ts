// ============================================================
// KHO TỆP — nơi duy nhất giữ NỘI DUNG các tệp người dùng tải lên
//
// 🔴 Chỉ đạo Ban lãnh đạo 11/08/2026: *"thủ kho khi nhận hàng phải đính kèm file phiếu giao
// nhận thì mới được bấm hoàn thành"*. Trước đó app KHÔNG lưu được nội dung tệp ở đâu cả —
// chỗ tải báo giá ở bước ② chỉ ghi lại TÊN tệp rồi bỏ nội dung đi.
//
// 🔴 VÌ SAO KHÔNG DÙNG localStorage: toàn bộ dữ liệu nghiệp vụ đang nằm ở đó
// (`luu-tren-may.ts`), mà localStorage chỉ chứa được khoảng 5MB cho CẢ TÊN MIỀN và chỉ nhận
// chuỗi. Một ảnh chụp phiếu giao nhận đã 2–5MB; nhét vào là vừa tràn vừa kéo theo mất sạch
// dữ liệu nghiệp vụ đang lưu chung chỗ. IndexedDB chứa được hàng trăm MB và lưu thẳng Blob,
// không phải mã hóa base64 (base64 làm phình thêm ~33%).
//
// 🔴 TÁCH RIÊNG MODULE NÀY LÀ CỐ Ý. Khi nối Firebase Storage thật thì chỉ thay ruột 4 hàm
// dưới đây — giao diện và nghiệp vụ không phải sửa dòng nào. Đừng gọi thẳng IndexedDB ở chỗ
// khác, nếu không sẽ có hai nơi cùng quản tệp rồi lệch nhau.
//
// ⚠️ TỆP NẰM TRÊN MÁY NGƯỜI DÙNG, KHÔNG PHẢI TRÊN MẠNG. Máy khác mở lên sẽ thấy tên tệp
// nhưng bấm mở thì báo không còn nội dung. Đây là giới hạn của bản chạy thử, phải nói thẳng
// cho người dùng biết chứ không được để họ tưởng đã lưu lên hệ thống.
// ============================================================

const TEN_KHO = "hpcons-thumua-tep";
const TEN_BANG = "tep";
const PHIEN_BAN = 1;

/** Thông tin mô tả tệp — cái này lưu cùng dữ liệu nghiệp vụ, KHÔNG chứa nội dung. */
export interface MoTaTep {
  /** Khóa tra nội dung trong kho tệp. */
  id: string;
  tenTep: string;
  /** vd "application/pdf", "image/jpeg" — để mở đúng kiểu khi xem lại. */
  kieuMime: string;
  /** Byte. */
  kichThuoc: number;
  nguoiTaiUid: string;
  nguoiTaiTen: string;
  /** ISO đầy đủ giờ phút. */
  thoiDiem: string;
}

/** Giới hạn cỡ tệp. Ảnh chụp phiếu bằng điện thoại thường 2–5MB nên 15MB là rộng rãi. */
export const CO_TOI_DA = 15 * 1024 * 1024;

export const KIEU_CHO_PHEP = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx";

function moKho(): Promise<IDBDatabase> {
  return new Promise((nhan, loi) => {
    const yc = indexedDB.open(TEN_KHO, PHIEN_BAN);
    yc.onupgradeneeded = () => {
      const db = yc.result;
      if (!db.objectStoreNames.contains(TEN_BANG)) db.createObjectStore(TEN_BANG);
    };
    yc.onsuccess = () => nhan(yc.result);
    yc.onerror = () => loi(yc.error ?? new Error("Không mở được kho tệp"));
  });
}

/**
 * Cất nội dung tệp, trả về phần mô tả để gắn vào hồ sơ.
 *
 * ⚠️ Ném lỗi khi tệp quá cỡ — người gọi phải bắt và báo cho người dùng. Nuốt lỗi ở đây thì
 * người dùng tưởng đã đính kèm xong trong khi chẳng có gì được lưu.
 */
export async function catTep(
  tep: File,
  nguoi: { uid: string; ten: string },
): Promise<MoTaTep> {
  if (tep.size > CO_TOI_DA) {
    throw new Error(
      `Tệp ${(tep.size / 1024 / 1024).toFixed(1)}MB, vượt mức cho phép ${CO_TOI_DA / 1024 / 1024}MB.`,
    );
  }

  // Khóa gồm cả thời điểm để hai lần tải cùng một tên tệp không đè lên nhau.
  const id = `tep-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const db = await moKho();
  await new Promise<void>((nhan, loi) => {
    const gd = db.transaction(TEN_BANG, "readwrite");
    gd.objectStore(TEN_BANG).put(tep, id);
    gd.oncomplete = () => nhan();
    gd.onerror = () => loi(gd.error ?? new Error("Không ghi được tệp vào kho"));
  });
  db.close();

  return {
    id,
    tenTep: tep.name,
    kieuMime: tep.type || "application/octet-stream",
    kichThuoc: tep.size,
    nguoiTaiUid: nguoi.uid,
    nguoiTaiTen: nguoi.ten,
    thoiDiem: new Date().toISOString(),
  };
}

/** Lấy lại nội dung tệp. Trả `null` khi kho không còn (VD mở ở máy khác). */
export async function layTep(id: string): Promise<Blob | null> {
  const db = await moKho();
  const blob = await new Promise<Blob | null>((nhan, loi) => {
    const gd = db.transaction(TEN_BANG, "readonly");
    const yc = gd.objectStore(TEN_BANG).get(id);
    yc.onsuccess = () => nhan((yc.result as Blob | undefined) ?? null);
    yc.onerror = () => loi(yc.error ?? new Error("Không đọc được tệp"));
  });
  db.close();
  return blob;
}

/**
 * Mở tệp ra tab mới để xem.
 *
 * ⚠️ Phải thu hồi địa chỉ tạm sau khi mở, nếu không mỗi lần xem lại giữ thêm một bản trong
 * bộ nhớ trình duyệt cho tới lúc đóng tab. Hẹn 60 giây vì thu hồi ngay thì tab mới chưa kịp
 * tải xong đã mất nguồn.
 */
export async function moTep(mt: MoTaTep): Promise<boolean> {
  const blob = await layTep(mt.id);
  if (!blob) return false;
  const diaChi = URL.createObjectURL(blob);
  window.open(diaChi, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(diaChi), 60_000);
  return true;
}

/** Xóa nội dung tệp khỏi kho. Gọi khi hồ sơ chứa nó bị xóa, để không bỏ rác lại. */
export async function xoaTep(id: string): Promise<void> {
  const db = await moKho();
  await new Promise<void>((nhan) => {
    const gd = db.transaction(TEN_BANG, "readwrite");
    gd.objectStore(TEN_BANG).delete(id);
    gd.oncomplete = () => nhan();
    // Xóa không được thì thôi — sót một tệp rác không đáng để chặn việc người dùng đang làm.
    gd.onerror = () => nhan();
  });
  db.close();
}

/** Đổi số byte thành chữ dễ đọc: "1,2 MB" / "340 KB". */
export function coTep(byte: number): string {
  if (byte >= 1024 * 1024) return `${(byte / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(byte / 1024))} KB`;
}
