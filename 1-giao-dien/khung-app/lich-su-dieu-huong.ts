"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * ★ NÚT "QUAY LẠI" VỀ ĐÚNG TRANG VỪA XEM — Sếp 09/10/2026: *"kiểm tra lại chức năng back lại bước
 * trước của các tab. khi bấm back lại trang thì phải hiện đúng trang trước chứ không phải về trang
 * tổng như hiện tại"* (Sếp chốt: nút "Quay lại …" trong app).
 *
 * Trước đây nút "Quay lại" là liên kết CỐ ĐỊNH (`/de-nghi`, `/theo-doi`): mở hồ sơ từ Việc của tôi,
 * Lịch hay Tổng quan rồi bấm "Quay lại" là bị đưa về danh sách khác hẳn chỗ vừa đứng.
 *
 * Cách làm: ghi CHỒNG các đường dẫn đã đi QUA TRONG APP ở tab này (sessionStorage — mỗi tab một
 * chồng, F5 không mất). Có trang trước trong app → `router.back()` (đúng như nút Back trình duyệt,
 * giữ cả vị trí cuộn và bộ lọc trên URL). Không có (mở thẳng bằng đường dẫn, tab mới) →
 * `router.push(duPhong)` — KHÔNG gọi `back()` lúc đó, vì sẽ lùi ra khỏi app (vd về hpcore.vn).
 */

const KHOA = "hpcons-tm-lich-su-dieu-huong";
/** Giữ tối đa bấy nhiêu mục — chỉ cần biết "có trang trước không", không cần cả lịch sử. */
const TOI_DA = 50;

/**
 * Cập nhật chồng khi đường dẫn đổi — hàm thuần (bài kiểm gọi thật).
 * · trùng đỉnh → tải lại cùng trang, giữ nguyên;
 * · `laLui` (trình duyệt vừa bắn `popstate` = Back/Forward) và trùng mục ngay dưới đỉnh → bỏ đỉnh;
 * · còn lại = đi tới → thêm vào đỉnh.
 * 📌 Chỉ đoán "Back" khi có `popstate` — đi tới đúng trang của hai bước trước (A → B → A) là đi TỚI,
 *    không phải lùi; đoán theo đường dẫn thôi thì sẽ nhầm.
 */
export function capNhatChongDieuHuong(chong: readonly string[], moi: string, laLui: boolean): string[] {
  const n = chong.length;
  if (n > 0 && chong[n - 1] === moi) return [...chong];
  if (laLui && n > 1 && chong[n - 2] === moi) return chong.slice(0, n - 1);
  return [...chong, moi].slice(-TOI_DA);
}

/** Lần đổi trang sắp tới có phải do Back/Forward của trình duyệt không (đặt ở `popstate`). */
let vuaLui = false;

function docChong(): string[] {
  try {
    const raw = sessionStorage.getItem(KHOA);
    const v: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function ghiChong(chong: string[]): void {
  try {
    sessionStorage.setItem(KHOA, JSON.stringify(chong));
  } catch {
    /* Trình duyệt chặn bộ nhớ phiên → nút Quay lại rơi về đường dự phòng, vẫn dùng được. */
  }
}

/** Gọi MỘT lần ở khung app (`khung-tong.tsx`): ghi mỗi lần đổi trang. */
export function useGhiLichSuDieuHuong(): void {
  const duongDan = usePathname();
  useEffect(() => {
    const khiLui = () => {
      vuaLui = true;
    };
    window.addEventListener("popstate", khiLui);
    return () => window.removeEventListener("popstate", khiLui);
  }, []);
  useEffect(() => {
    if (!duongDan) return;
    ghiChong(capNhatChongDieuHuong(docChong(), duongDan, vuaLui));
    vuaLui = false;
  }, [duongDan]);
}

/**
 * Trả về hàm bấm cho nút "Quay lại": về trang vừa xem trong app; không có thì về `duPhong`.
 */
export function useQuayLai(duPhong: string): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (docChong().length > 1) router.back();
    else router.push(duPhong);
  }, [router, duPhong]);
}
