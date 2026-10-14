// ============================================================
// KHO DỮ LIỆU — "THƯỜNG" HAY "EQUI" (Sếp duyệt demo 14/10/2026)
//
// App có HAI kho tách hẳn nhau, cùng khuôn dữ liệu, cùng luật, cùng giao diện:
//   • `thuong` — kho hiện có, dùng cho mọi đề xuất không thuộc EQUI. KHÔNG ĐỔI GÌ so với trước.
//   • `equi`   — kho riêng, bắt đầu TRỐNG, chỉ nhận đề xuất thuộc các nhóm EQUI được cấu hình.
//
// 🔴 MỌI NƠI CHỌN ĐƯỜNG DẪN LƯU (Firestore, localStorage) PHẢI ĐI QUA TỆP NÀY. Hai kho dùng chung
// một bộ sưu tập `chay-thu` nên rules hiện hành phủ luôn (không phải publish rules mới); chỉ khác
// tên tài liệu. Nơi nào còn viết cứng `du-lieu-chung` là nơi đó chỉ biết kho thường.
// ============================================================

export type KhoId = "thuong" | "equi";

export const KHO_MAC_DINH: KhoId = "thuong";

/** Tiền tố địa chỉ web của kho EQUI: `/equi/de-nghi`, `/equi/don-hang/…`. */
export const TIEN_TO_EQUI = "/equi";

export function laKhoId(x: unknown): x is KhoId {
  return x === "thuong" || x === "equi";
}

/**
 * Nhận giá trị lạ (thân yêu cầu API, tham số…) và trả về kho hợp lệ. Thiếu → kho thường — đúng
 * hành vi trước khi có EQUI, nên nơi gọi cũ không truyền gì vẫn chạy y như cũ.
 */
export function chuanHoaKhoId(x: unknown): KhoId {
  return laKhoId(x) ? x : KHO_MAC_DINH;
}

/** Tài liệu kho chung (đề nghị, đơn, phiếu nhận, cấu hình…). */
export function duongDanKhoChung(kho: KhoId): { boSuuTap: string; tep: string } {
  return { boSuuTap: "chay-thu", tep: kho === "equi" ? "du-lieu-equi" : "du-lieu-chung" };
}

/** Tài liệu đợt thanh toán — tách riêng khỏi kho chung, xem `kho-thanh-toan-firestore.ts`. */
export function duongDanKhoThanhToan(kho: KhoId): { boSuuTap: string; tep: string } {
  return { boSuuTap: "chay-thu", tep: kho === "equi" ? "thanh-toan-equi" : "thanh-toan" };
}

/**
 * Hậu tố gắn vào khoá `localStorage`. Kho thường để TRỐNG — giữ nguyên khoá cũ để người đang dùng
 * không mất bản dự phòng trên máy.
 */
export function hauToKhoaMay(kho: KhoId): string {
  return kho === "equi" ? "-equi" : "";
}

/**
 * Địa chỉ nào thuộc kho nào. `/equi` và `/equi/…` → EQUI; mọi địa chỉ khác → kho thường.
 *
 * 📌 So khớp theo ĐOẠN (`/equi` hoặc `/equi/`), không `startsWith("/equi")` trần — để một địa chỉ
 * tương lai kiểu `/equipment` không bị nhận nhầm là kho EQUI.
 */
export function khoTheoDuongDan(duongDan: string | null | undefined): KhoId {
  const d = duongDan ?? "";
  return d === TIEN_TO_EQUI || d.startsWith(TIEN_TO_EQUI + "/") ? "equi" : "thuong";
}

/**
 * Thêm tiền tố `/equi` vào một địa chỉ NỘI BỘ nếu địa chỉ đó là màn hình CỦA KHO — để link trong
 * một trang EQUI dẫn tới trang EQUI chứ không nhảy sang kho thường.
 *
 * 🔴 CHỈ TIỀN TỐ NHỮNG ĐỊA CHỈ CÓ BẢN `/equi/...` THẬT (xem `app/(app)/equi/` và `app/equi/in/`):
 *   `/de-nghi…`, `/don-hang…`, `/phan-bo`, `/theo-doi/<id>`, `/in/don-hang/<id>`.
 * Các màn dùng chung cho cả công ty (`/tong-quan`, `/cong-no`, `/viec-cua-toi`, `/lich`,
 * `/cai-dat-quy-trinh`, `/theo-doi` danh sách…) KHÔNG tiền tố — tiền tố vào đó là ra 404.
 *
 * Kho thường: trả NGUYÊN địa chỉ, không đụng gì (hành vi cũ). Địa chỉ ngoài app, địa chỉ chỉ có
 * `#neo`, địa chỉ đã mang `/equi`: trả nguyên.
 */
export function themTienToKho(href: string, kho: KhoId): string {
  if (kho !== "equi" || !href.startsWith("/") || href.startsWith("//")) return href;
  const m = /^([^?#]*)(.*)$/.exec(href);
  const duong = m?.[1] ?? href;
  const duoi = m?.[2] ?? "";
  const doan = duong.split("/").filter(Boolean);
  if (doan[0] === "equi") return href;

  const laManCuaKho =
    doan[0] === "de-nghi" ||
    doan[0] === "don-hang" ||
    (doan[0] === "phan-bo" && doan.length === 1) ||
    (doan[0] === "theo-doi" && doan.length >= 2) ||
    (doan[0] === "in" && doan[1] === "don-hang" && doan.length >= 3);

  return laManCuaKho ? `${TIEN_TO_EQUI}${duong}${duoi}` : href;
}
