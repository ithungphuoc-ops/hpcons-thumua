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

/** Hiện khi không có ngày, hoặc ngày không đọc được. */
export const KHONG_CO_NGAY = "—";

/**
 * 🔴 CHẶN "Invalid time value" LÀM SẬP CẢ TRANG.
 *
 * `Intl.DateTimeFormat().format()` **NÉM RangeError** khi gặp `Invalid Date` — và vì hàm
 * định dạng được gọi ngay trong lúc dựng giao diện, một chuỗi ngày rỗng ở BẤT KỲ hồ sơ nào
 * là cả trang trắng với dòng chữ "Application error", không vào được nữa.
 *
 * Đã xảy ra thật ngày 12/08/2026: bước duyệt hai cấp để `ngayDuyet: ""` khi phiếu chưa duyệt
 * xong, và trang chi tiết đề nghị sập ngay khi mở.
 *
 * ⚠️ Bài học: hàm ĐỊNH DẠNG không bao giờ được ném lỗi. Nó nằm ở tầng cuối, dữ liệu xấu tới
 * đâu nó cũng phải trả về một chuỗi đọc được. Kiểm ở từng nơi gọi là không xuể — chỉ cần
 * quên MỘT chỗ là sập, mà lỗi lại không hiện ra lúc biên dịch.
 */
function ngayHopLe(iso: string | undefined | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(iso: string | undefined | null): string {
  const d = ngayHopLe(iso);
  if (!d) return KHONG_CO_NGAY;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: MUI_GIO_VN,
  }).format(d);
}

/** Giờ phút theo giờ Việt Nam, vd `14:05`. */
export function formatTime(iso: string | undefined | null): string {
  const d = ngayHopLe(iso);
  if (!d) return KHONG_CO_NGAY;
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: MUI_GIO_VN,
  }).format(d);
}

/**
 * Ngày giờ đầy đủ theo giờ Việt Nam, vd `10/08/2026 14:05`.
 *
 * Ghép thủ công NGÀY rồi tới GIỜ. Nếu để `Intl` tự dựng cả cụm thì locale vi-VN cho
 * ra `14:05 10/08/2026` — giờ đứng trước ngày, đọc ngược với thói quen ghi chứng từ.
 */
export function formatDateTime(iso: string | undefined | null): string {
  if (!ngayHopLe(iso)) return KHONG_CO_NGAY;
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
export function formatMocThoiGian(iso: string | undefined | null): string {
  if (!iso) return KHONG_CO_NGAY;
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

/**
 * Thời gian TƯƠNG ĐỐI cho dòng bình luận: "vừa xong", "3 giờ trước", "Hôm qua 14:20".
 *
 * 🔴 `moc` LÀ THAM SỐ BẮT BUỘC, không lấy `Date.now()` bên trong. App xuất trang tĩnh
 * (`generateStaticParams`), nên nếu hàm tự lấy giờ thì chuỗi sinh lúc dựng trang khác chuỗi
 * sinh trên máy người dùng → React báo lệch hydration và chữ nhảy một nhịp khi tải xong.
 * Nơi gọi phải lấy mốc trong `useEffect` (sau khi trang đã hiện) rồi truyền vào.
 *
 * 📌 Quá 7 ngày thì trả về ngày tháng tuyệt đối: "12 ngày trước" bắt người đọc tự tính ngược,
 * trong khi hồ sơ mua hàng cần mốc chính xác để đối chiếu chứng từ.
 */
export function formatThoiGianTuongDoi(
  iso: string | undefined | null,
  moc: number,
): string {
  if (!iso) return KHONG_CO_NGAY;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return KHONG_CO_NGAY;

  const giay = Math.round((moc - t) / 1000);
  // Đồng hồ hai máy lệch nhau vài giây là chuyện thường — thời điểm ở "tương lai gần"
  // vẫn coi là vừa xong, đừng hiện "-3 giây trước".
  if (giay < 60) return "vừa xong";
  const phut = Math.floor(giay / 60);
  if (phut < 60) return `${phut} phút trước`;
  const gio = Math.floor(phut / 60);
  if (gio < 24) return `${gio} giờ trước`;

  const ngay = Math.floor(gio / 24);
  if (ngay === 1) return `Hôm qua ${formatTime(iso)}`;
  if (ngay <= 7) return `${ngay} ngày trước`;
  return formatDateTime(iso);
}

/**
 * Nhãn dải phân cách ngày giữa các cụm bình luận: "Hôm nay", "Hôm qua", hoặc ngày đầy đủ.
 * Cùng lý do với hàm trên: `moc` truyền từ ngoài vào.
 */
export function nhanNgayPhanCach(iso: string | undefined | null, moc: number): string {
  if (!iso) return KHONG_CO_NGAY;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return KHONG_CO_NGAY;
  const hienTai = new Date(moc);
  // So theo NGÀY LỊCH chứ không theo số giờ chênh lệch: 23h hôm qua và 1h hôm nay chỉ cách
  // nhau 2 tiếng nhưng là hai ngày khác nhau, người đọc hồ sơ hiểu theo ngày.
  const cungNgay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (cungNgay(d, hienTai)) return "Hôm nay";
  const homQua = new Date(hienTai);
  homQua.setDate(homQua.getDate() - 1);
  if (cungNgay(d, homQua)) return "Hôm qua";
  return formatDate(iso);
}

/** Số ngày còn lại tới `iso` tính từ `now` (âm nếu đã quá hạn). Làm tròn theo ngày lịch. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const target = new Date(iso);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffMs = startOfDay(target).getTime() - startOfDay(now).getTime();
  return Math.round(diffMs / 86_400_000);
}

/**
 * ★ HÔM NAY dạng `yyyy-mm-dd` **theo giờ máy người dùng**.
 *
 * 🔴 KHÔNG DÙNG `new Date().toISOString().slice(0,10)`. `toISOString` trả giờ UTC, mà Việt Nam
 * lệch +7: từ 0h tới 7h sáng nó cho ra NGÀY HÔM QUA. Hệ quả cụ thể ở app này: người lập đơn lúc
 * 6h sáng sẽ thấy ô "Thời gian nhận hàng" khoá luôn cả ngày hôm nay — chặn đúng thứ vừa được
 * phép chọn, mà không một câu nào giải thích.
 *
 * 📌 Dùng chung một chỗ thay vì mỗi tệp tự viết lại: ba nơi cùng cần mốc "hôm nay" (khoá ngày
 * giao lùi, ngày chi mặc định của đợt thanh toán, nền ngày bắt đầu tính nợ), và chúng phải luôn
 * cho ra cùng một ngày.
 */
export function homNayISO(): string {
  const d = new Date();
  const hai = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`;
}

/**
 * ★★ CHẤM PHÂN CÁCH NGHÌN NGAY KHI ĐANG GÕ — Sếp 20/09/2026: ***"Thêm dấu ngăn cách ví dụ
 * 5.000.000 để người nhập ko bị nhầm"***.
 *
 * 🔴 VÌ SAO ĐÁNG LÀM: ô tiền của app nhận số trần (`50000000`). Đếm số 0 bằng mắt là việc người
 * ta làm sai thật — thừa một số 0 là **sai gấp mười lần**, mà nhìn vào ô thì không thấy gì bất
 * thường. Có dấu chấm thì `5.000.000` và `50.000.000` khác nhau ngay từ cái liếc.
 *
 * 🔴 CHỈ ĐỔI CHỮ TRONG Ô, KHÔNG ĐỔI SỐ ĐEM ĐI LƯU. Nơi gọi vẫn phải bỏ dấu trước khi đổi sang
 * số (`.replace(/[.,\s]/g, "")`) — `Number("5.000.000")` cho `NaN`, và nếu để lọt thì tầng ghi
 * từ chối bằng câu "số tiền phải là số không âm", người dùng đọc mà không hiểu vì sao.
 *
 * 📌 Giữ lại chuỗi rỗng và bỏ mọi ký tự không phải chữ số: người dùng dán "45.522.000 đ" vào ô
 * thì vẫn ra đúng số, thay vì báo lỗi.
 */
export function chamNganCachNghin(chuoi: string): string {
  const so = String(chuoi ?? "").replace(/\D/g, "");
  if (!so) return "";
  /* Bỏ số 0 ở đầu (trừ khi chỉ có mỗi "0") — "007" là do gõ nhầm, không phải mã. */
  const gon = so.replace(/^0+(?=\d)/, "");
  return gon.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
