// ============================================================
// CẤT SỔ "BẢN GHI CHƯA LÊN KHO CHUNG" XUỐNG MÁY — sự cố mất đơn LẦN THỨ HAI, 15/09/2026 ~20:35
//
// Tệp này CHỈ lo phần chạm `localStorage`. Toàn bộ phần QUYẾT ĐỊNH (đọc chuỗi, lọc hạn dùng,
// dựng chuỗi) nằm ở `2-quy-trinh/giu-ban-ghi-moi.ts` để `kiem-luat-dung-chung.mjs` gọi thật
// được — chú thích không chạy được nên không lừa được phép kiểm (CLAUDE.md §6.6).
//
// 🔴 VÌ SAO PHẢI CÓ TỆP NÀY: cuốn sổ trước đây nằm trong `useRef` của `DuLieuProvider`, tức
// **chết theo mỗi document trình duyệt**. Tải lại trang, mở trang in ở tab mới
// (`<Link target="_blank">` ở `trang/don-hang-chi-tiet.tsx`), hay một lần điều hướng cứng của
// Next.js là sổ bốc hơi — trong khi bản ghi vẫn nằm trong `localStorage` và ảnh chụp kế tiếp sẽ
// xoá nó rồi ghi đè `localStorage` bằng bộ đã thiếu. Lý do đầy đủ ở khối ⑤ của tệp quy trình.
//
// 🔴 MỌI LỐI ĐỌC/GHI BỌC `try/catch`, HỎNG THÌ RƠI VỀ HÀNH VI CŨ (không giữ gì) — không được
// làm chết `DuLieuProvider`. localStorage ném lỗi thật trong chế độ riêng tư, khi hết chỗ, hoặc
// khi trình duyệt chặn dữ liệu trang. Đây chỉ là **lưới an toàn**; lưới rách thì vẫn phải đi
// tiếp, không được đổ cả app.
//
// ⚠️ NGĂN CHỨA RIÊNG, KHÔNG NHÉT VÀO `hpcons-thumua-du-lieu-v1`. Sổ này phải đọc được ĐỘC LẬP
// với bộ dữ liệu nghiệp vụ, và phải sống sót cả khi bộ dữ liệu kia bị ghi đè — nhét chung là
// mất cùng nhau, đúng lúc cần nhau nhất.
//
// 📌 Sổ chỉ chứa chuỗi khoá (`po:<id>`, `pr:<id>`…) + hai con số ⇒ vài trăm byte, không đáng lo
// về hạn ~5MB của localStorage (CLAUDE.md §3.5 — tệp đính kèm mới là thứ tuyệt đối không nhét
// vào đây, và chúng đã nằm ở `3-du-lieu/kho-tep.ts`).
// ============================================================

import {
  docSoDaLuuTuChuoi,
  ghiSoRaChuoi,
  type VetBanGhiMoi,
} from "@/2-quy-trinh/giu-ban-ghi-moi";

/** Ngăn chứa riêng — xem chú thích đầu tệp. */
const KHOA = "hpcons-thumua-so-giu-ban-ghi-moi-v1";

/**
 * Đọc sổ đã cất, đã lọc bỏ mục quá hạn (24 giờ, xem `HAN_GIU_BAN_GHI_MS`).
 *
 * Trả về Map RỖNG khi: chạy phía máy chủ, chưa cất gì, dữ liệu hỏng, hoặc localStorage ném lỗi.
 * Map rỗng = quay về đúng hành vi trước bản vá, mất một lớp bảo vệ nhưng không mất gì thêm.
 */
export function docSoGiuBanGhiMoi(): Map<string, VetBanGhiMoi> {
  if (typeof window === "undefined") return new Map();
  try {
    return docSoDaLuuTuChuoi(window.localStorage.getItem(KHOA), Date.now());
  } catch {
    return new Map();
  }
}

/**
 * Ghi đè cả cuốn sổ.
 *
 * 🔴 GHI ĐÈ, KHÔNG TRỘN. Cuốn sổ trong bộ nhớ là bản đúng duy nhất: mục bị gỡ ra khỏi nó là mục
 * đã **thấy trên máy chủ** — tức cửa một chiều đã đóng lại vĩnh viễn. Trộn với bản cũ dưới đĩa
 * là mở lại đúng cái cửa đó, và từ giây ấy máy này hồi sinh mọi bản ghi người khác xoá.
 *
 * 📌 Sổ rỗng thì **xoá hẳn khoá** thay vì cất `"{}"` — để một máy đã đồng bộ xong không để lại
 * rác trong localStorage của người dùng.
 */
export function ghiSoGiuBanGhiMoi(so: ReadonlyMap<string, VetBanGhiMoi>): void {
  if (typeof window === "undefined") return;
  try {
    if (so.size === 0) {
      window.localStorage.removeItem(KHOA);
      return;
    }
    window.localStorage.setItem(KHOA, ghiSoRaChuoi(so));
  } catch (e) {
    // Nuốt có chủ đích, nhưng NÓI RA. Mất sổ chỉ làm mất lớp giữ bản ghi mới, không làm hỏng
    // dữ liệu đang có — nhưng im lặng thì lần sau không ai lần ra được vì sao nó không giữ.
    console.warn("[sổ giữ bản ghi mới] không cất được sổ xuống máy:", e);
  }
}
