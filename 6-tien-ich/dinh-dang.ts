/** Tiện ích định dạng dùng chung — tránh lặp lại logic hiển thị trong từng component. */

export function formatCurrencyVnd(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

/**
 * 🔴 MÚI GIỜ CỐ ĐỊNH GIỜ VIỆT NAM (UTC+7) — chỉ đạo Ban lãnh đạo 10/08/2026.
 *
 * Không để trình duyệt tự chọn múi giờ máy: máy cài sai múi giờ, hoặc người dùng ở
 * nước ngoài mở app, sẽ thấy nhật ký lệch vài tiếng. Chứng từ mua hàng phải đọc ra
 * cùng một mốc thời gian ở mọi máy.
 */
const MUI_GIO_VN = "Asia/Ho_Chi_Minh";

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: MUI_GIO_VN,
  }).format(d);
}

/** Giờ phút theo giờ Việt Nam, vd `14:05`. */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: MUI_GIO_VN,
  }).format(new Date(iso));
}

/**
 * Ngày giờ đầy đủ theo giờ Việt Nam, vd `10/08/2026 14:05`.
 *
 * Ghép thủ công NGÀY rồi tới GIỜ. Nếu để `Intl` tự dựng cả cụm thì locale vi-VN cho
 * ra `14:05 10/08/2026` — giờ đứng trước ngày, đọc ngược với thói quen ghi chứng từ.
 */
export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

/**
 * Mốc thời gian cho NHẬT KÝ — tự biết dữ liệu có giờ hay không.
 *
 * 🔴 Dữ liệu cũ (và dữ liệu mẫu) lưu chuỗi chỉ có ngày như `"2026-08-03"`. Ép hiển thị
 * kèm giờ thì `new Date()` hiểu đó là 00:00 UTC, quy sang giờ Việt Nam thành **07:00** —
 * một cái giờ KHÔNG CÓ THẬT, nhìn vào tưởng mọi việc trong hệ thống đều xảy ra lúc 7 giờ.
 * Nên: có giờ thì hiện đủ ngày giờ, không có thì chỉ hiện ngày.
 */
export function formatMocThoiGian(iso: string): string {
  return iso.includes("T") ? formatDateTime(iso) : formatDate(iso);
}

/**
 * Thời điểm hiện tại để GHI VÀO DỮ LIỆU — chuỗi ISO đầy đủ (có giờ, kèm mốc UTC).
 *
 * ⚠️ Lưu ở dạng ISO chuẩn chứ KHÔNG lưu chuỗi đã định dạng sẵn theo giờ VN: lưu ISO
 * thì luôn biết chính xác mốc thời gian tuyệt đối, muốn hiện theo múi giờ nào cũng
 * được. Lưu chuỗi "10/08/2026 14:05" là mất thông tin múi giờ, sau này không đối
 * chiếu được với dữ liệu của app khác trong hệ sinh thái.
 *
 * Hiển thị thì dùng `formatDateTime` — nó tự quy về giờ Việt Nam.
 */
export function thoiDiemHienTai(): string {
  return new Date().toISOString();
}

/** Số ngày còn lại tới `iso` tính từ `now` (âm nếu đã quá hạn). Làm tròn theo ngày lịch. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const target = new Date(iso);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffMs = startOfDay(target).getTime() - startOfDay(now).getTime();
  return Math.round(diffMs / 86_400_000);
}
