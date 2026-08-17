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

import {
  dayTepLenMayChu,
  taiTepTuMayChu,
  xoaTepTrenMayChu,
} from "@/3-du-lieu/kho-tep-firestore";

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

/**
 * Giới hạn cỡ tệp. Ảnh chụp phiếu bằng điện thoại thường 2–5MB nên 10MB là đủ rộng.
 *
 * ⚠️ GIẢM TỪ 15MB XUỐNG 10MB (12/08/2026) khi chuyển sang lưu trên Firestore. Firestore chỉ
 * cho 1MB mỗi tài liệu nên tệp phải cắt thành nhiều mảnh — 10MB đã là ~23 mảnh, mỗi mảnh một
 * lần gọi mạng. Để 15MB thì người dùng ngồi chờ rất lâu mà không biết có xong hay không.
 */
export const CO_TOI_DA = 10 * 1024 * 1024;

export const KIEU_CHO_PHEP = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx";

/**
 * Phần đuôi tệp, viết thường, KHÔNG kèm dấu chấm. Không có đuôi thì trả chuỗi rỗng.
 *
 * 📌 Để ở tầng dữ liệu chứ không nằm trong file giao diện: cả việc CHỌN BIỂU TƯỢNG theo loại
 * tệp lẫn việc CHẶN kiểu tệp đều hỏi đúng câu hỏi này. Tách ra hai nơi thì sau này sửa một
 * chỗ, chỗ kia lệch mà không ai soi ra.
 */
export function duoiTep(tenTep: string): string {
  const cham = tenTep.lastIndexOf(".");
  // `cham <= 0` gạt luôn tên kiểu ".gitignore" — đó là tên tệp ẩn, không phải đuôi.
  if (cham <= 0 || cham === tenTep.length - 1) return "";
  return tenTep.slice(cham + 1).toLowerCase();
}

/** Tên tệp có nằm trong danh mục `KIEU_CHO_PHEP` không. */
export function laKieuTepChoPhep(tenTep: string): boolean {
  const duoi = duoiTep(tenTep);
  if (!duoi) return false;
  return KIEU_CHO_PHEP.split(",").includes(`.${duoi}`);
}

/** Danh mục đuôi tệp viết cách nhau bằng dấu trắng — để báo cho người dùng app nhận những gì. */
export function chuoiKieuChoPhep(): string {
  return KIEU_CHO_PHEP.split(",").join(" ");
}

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
  /**
   * 🔴 CHẶN KIỂU TỆP Ở ĐÂY, không chỉ ở ô chọn tệp — thêm 17/08/2026 khi khu đính kèm của
   * từng bước có thao tác KÉO THẢ.
   *
   * Thuộc tính `accept` chỉ lọc trong hộp thoại chọn tệp của hệ điều hành; tệp kéo thẳng từ
   * màn hình nền vào KHÔNG đi qua nó, không bị lọc gì cả. Chốt chặn thật phải nằm cùng chỗ
   * ghi dữ liệu, nếu không thì mỗi nơi gọi lại phải tự nhớ kiểm — rồi sẽ có nơi quên.
   */
  if (!laKieuTepChoPhep(tep.name)) {
    throw new Error(`Không nhận loại tệp này. Chỉ nhận: ${chuoiKieuChoPhep()}.`);
  }

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

  const mt: MoTaTep = {
    id,
    tenTep: tep.name,
    kieuMime: tep.type || "application/octet-stream",
    kichThuoc: tep.size,
    nguoiTaiUid: nguoi.uid,
    nguoiTaiTen: nguoi.ten,
    thoiDiem: new Date().toISOString(),
  };

  /**
   * 🔴 ĐẨY LÊN MÁY CHỦ để máy khác mở được — Ban lãnh đạo 12/08/2026: *"lưu vào firestore"*.
   *
   * ⚠️ ĐẨY KHÔNG ĐƯỢC THÌ PHẢI NÉM LỖI, không được im lặng. Tệp vẫn nằm trong máy này nên
   * người tải lên bấm Xem vẫn thấy — họ sẽ tin là đã lưu vào hệ thống, trong khi trưởng bộ
   * phận ở máy khác chẳng thấy gì. Đúng cái bẫy CLAUDE.md mục 3.5 cấm: *"đừng để giao diện
   * hứa một việc app không làm"*.
   */
  const len = await dayTepLenMayChu(id, tep, {
    tenTep: mt.tenTep,
    kieuMime: mt.kieuMime,
    kichThuoc: mt.kichThuoc,
    soManh: 0, // hàm đẩy tự tính rồi ghi lại
    nguoiTaiUid: mt.nguoiTaiUid,
    nguoiTaiTen: mt.nguoiTaiTen,
    thoiDiem: mt.thoiDiem,
  });
  if (!len) {
    throw new Error(
      "Đã lưu trên máy này nhưng KHÔNG đưa được lên máy chủ — máy khác sẽ không mở xem được. Kiểm tra lại mạng rồi đính kèm lại.",
    );
  }

  return mt;
}

/**
 * Lấy lại nội dung tệp.
 *
 * Hai lớp, theo đúng thứ tự:
 *   1. **IndexedDB của máy này** — có sẵn thì mở tức thì, không phải chờ mạng. Đây là lý do
 *      giữ IndexedDB lại chứ không bỏ hẳn khi chuyển sang Firestore.
 *   2. **Firestore** — máy khác (hoặc máy này sau khi xóa bộ nhớ trình duyệt) tải về, rồi
 *      **cất lại vào IndexedDB** để lần sau mở ngay.
 *
 * Trả `null` khi cả hai đều không có.
 */
export async function layTep(id: string): Promise<Blob | null> {
  const db = await moKho();
  const trongMay = await new Promise<Blob | null>((nhan, loi) => {
    const gd = db.transaction(TEN_BANG, "readonly");
    const yc = gd.objectStore(TEN_BANG).get(id);
    yc.onsuccess = () => nhan((yc.result as Blob | undefined) ?? null);
    yc.onerror = () => loi(yc.error ?? new Error("Không đọc được tệp"));
  });
  db.close();
  if (trongMay) return trongMay;

  const tuMayChu = await taiTepTuMayChu(id);
  if (!tuMayChu) return null;

  // Cất lại để lần sau khỏi tải: một tệp 5MB là hơn 10 lần gọi mạng, mở lại lần nào cũng
  // tải lại thì người dùng tưởng app chậm.
  try {
    const db2 = await moKho();
    await new Promise<void>((nhan) => {
      const gd = db2.transaction(TEN_BANG, "readwrite");
      gd.objectStore(TEN_BANG).put(tuMayChu, id);
      gd.oncomplete = () => nhan();
      // Cất không được thì thôi — vẫn trả tệp về cho người dùng xem.
      gd.onerror = () => nhan();
    });
    db2.close();
  } catch {
    // Bỏ qua: không cất được bộ đệm không phải lý do để chặn việc xem tệp.
  }
  return tuMayChu;
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

/**
 * TẢI TỆP VỀ MÁY — Ban lãnh đạo 13/08/2026: *"thêm chức năng xem và tải chứng từ về"*.
 *
 * 🔴 KHÁC `moTep`: mở chỉ xem được trên màn hình, còn kế toán và người lưu hồ sơ cần bản
 * tệp thật để in, gửi kèm email, nộp cho kiểm toán. Trình duyệt lại tự mở PDF/ảnh trong
 * tab thay vì tải, nên phải dùng thẻ `<a download>` mới ép tải xuống được.
 *
 * 📌 Đặt lại tên tệp theo tên gốc người dùng đã tải lên. Không đặt thì tệp về máy mang cái
 * tên máy sinh (`1785921185922_1967909...jpg`) — mở thư mục Downloads ra không biết cái nào
 * là phiếu giao nhận của đơn nào.
 */
export async function taiTep(mt: MoTaTep): Promise<boolean> {
  const blob = await layTep(mt.id);
  if (!blob) return false;
  const diaChi = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = diaChi;
  a.download = mt.tenTep;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Thu hồi ngay được vì trình duyệt đã bắt đầu tải trước khi hàm này trả về.
  setTimeout(() => URL.revokeObjectURL(diaChi), 1_000);
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
  // Dọn cả trên máy chủ, nếu không thì mảnh base64 nằm lại vĩnh viễn và ăn dần hạn mức.
  await xoaTepTrenMayChu(id);
}

/** Đổi số byte thành chữ dễ đọc: "1,2 MB" / "340 KB". */
export function coTep(byte: number): string {
  if (byte >= 1024 * 1024) return `${(byte / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(byte / 1024))} KB`;
}
