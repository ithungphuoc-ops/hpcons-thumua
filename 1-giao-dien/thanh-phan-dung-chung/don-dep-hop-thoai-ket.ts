"use client";

import { useEffect } from "react";

/**
 * ============================================================================
 * GỠ DẤU VẾT CỦA HỘP THOẠI ĐÓNG KHÔNG SẠCH — lưới an toàn lớp cuối
 * ============================================================================
 *
 * 🐛 TRIỆU CHỨNG (Sếp báo 13/09/2026): đang ở bước ③, khối *"KẾT QUẢ › BẢNG BÁO GIÁ (0)"*,
 *    sau khi ĐÍNH KÈM FILE thì cả app đơ — một mảng trắng che kín cả sidebar, bấm chỗ nào
 *    cũng không ăn, trang không cuộn được. F5 là về bình thường (vì F5 dựng lại DOM mới).
 *
 * 🔬 BẰNG CHỨNG F12 SẾP CHỤP — đây là thứ DUY NHẤT chứng minh nguyên nhân, chép nguyên văn
 *    để phiên sau không phải đoán lại:
 *
 *      <body class="min-h-full bg-background text-foreground" style="overflow: hidden;">
 *        <div hidden aria-hidden="true" data-base-ui-inert></div>
 *        <script>...</script>
 *        <div class="min-h-screen bg-background" aria-hidden="true" data-base-ui-inert>...</div>
 *        <section aria-label="Notifications alt+T" ... data-base-ui-inert></section>
 *      </body>
 *
 *    và trong bảng Styles:  element.style { overflow: hidden; }
 *
 * 🔎 ĐỌC RA ĐƯỢC GÌ TỪ ẢNH ĐÓ (đã đối chiếu thẳng với mã nguồn thư viện trong node_modules):
 *
 *    · `overflow: hidden` trên <body> là của `@base-ui/utils/useScrollLock.js` →
 *      `preventScrollOverlayScrollbars` (dòng 55-76). Nhánh này CHỈ ghi `overflowY` +
 *      `overflowX`, không ghi `position/height/width` — khớp đúng ảnh chụp. Nó được chọn khi
 *      trang không có thanh cuộn riêng, đúng với app này (khung `khung-tong` tự cuộn bên trong).
 *      Khóa cuộn do `Dialog.Root` giữ (`dialog/root/useDialogRoot.js` dòng 79:
 *      `useScrollLock(open && modal === true, popupElement)`).
 *
 *    · `data-base-ui-inert` + `aria-hidden="true"` là của
 *      `@base-ui/react/floating-ui-react/utils/markOthers.js`, gọi từ `FloatingFocusManager.js`
 *      (hai lượt: một lượt đặt `aria-hidden`, một lượt đặt `data-base-ui-inert`).
 *      🔴 DẤU VÂN TAY KHÔNG THỂ NHẦM: trong `applyAttributeToOthers` (dòng 93-95), phần tử có
 *      `aria-live` được đưa vào danh sách "giữ lại" nên KHÔNG bị `aria-hidden`, nhưng lượt đánh
 *      dấu `data-base-ui-inert` thì KHÔNG loại trừ nó. Ảnh F12 cho thấy đúng vậy: khung toast
 *      của sonner (`<section aria-label="Notifications alt+T">`, có `aria-live`) CHỈ dính
 *      `data-base-ui-inert`, còn `div.min-h-screen.bg-background` thì dính CẢ HAI.
 *      → Ba thứ kẹt lại đúng là của base-ui, không phải do code nào khác của app đặt vào.
 *
 *    · `<div hidden aria-hidden data-base-ui-inert>` RỖNG đứng đầu <body>, ngay trước một
 *      `<script>`: đó là thẻ streaming của React/Next (`<div hidden id="S:0">…</div><script>`),
 *      vốn vẫn luôn nằm đó — nó chỉ tình cờ bị `markOthers` đánh dấu. KHÔNG phải portal sót.
 *
 * 🔴 CƠ CHẾ DỌN CỦA base-ui HOÀN TOÀN DỰA VÀO CLEANUP CỦA REACT:
 *      - `markOthers()` trả về hàm dọn, chỉ được gọi trong `return () => {...}` của `useEffect`
 *        ở `FloatingFocusManager.js` (dòng 351-354).
 *      - `useScrollLock` trả `SCROLL_LOCKER.acquire(...)` làm cleanup của `useIsoLayoutEffect`.
 *    Cây React chứa `<Dialog>` bị THÁO trong lúc `open` vẫn còn `true` là base-ui không đi qua
 *    vòng đời đóng bình thường, và ba thứ trên kẹt lại trên DOM. F5 xóa sạch DOM nên "tự khỏi".
 *
 * ⚠️ VÀ ĐÂY LÀ CÁI BẪY TỰ KHÓA, đọc thẳng từ `useScrollLock.js` dòng 232-251: khi mở hộp thoại
 *    mới mà trang ĐÃ bị khóa cuộn sẵn (`isPageScrollLocked`), base-ui chỉ gắn một
 *    MutationObserver rồi đặt `restore = () => observer.disconnect()` — tức nó KHÔNG BAO GIỜ gỡ
 *    `overflow:hidden` đó, vì không phải nó đặt. Rò rỉ MỘT lần là kẹt vĩnh viễn tới khi F5 —
 *    đúng như Sếp tả.
 *
 * ----------------------------------------------------------------------------
 * 🔴 ĐÂY LÀ LỚP PHÒNG THỦ, KHÔNG PHẢI GỐC RỄ — ĐỌC KỸ TRƯỚC KHI SỬA
 * ----------------------------------------------------------------------------
 *
 * Gốc rễ là CHỖ GỌI tháo `<Dialog>` ngay trong lúc `open` còn `true`. Kiểu viết sai:
 *
 *      {xemTep && <HopXemTep tep={xemTep} mo onDong={() => setXemTep(null)} />}
 *
 * sai ở HAI điểm cộng lại: `mo` viết trơn (= luôn `true`, prop `open` không bao giờ về `false`)
 * và `{xemTep && ...}` (bấm đóng là cả `<Dialog>` biến mất khỏi cây React ngay trong cùng một
 * lần commit). Chính dự án đã ghi cảnh báo này ở `hop-xac-nhan.tsx` dòng 38-40:
 * *"Xóa nội dung cùng lúc với đóng sẽ tháo cây con giữa lúc hiệu ứng đóng đang chạy và để lại
 * lớp mờ kẹt trên màn hình"*.
 *
 * Kiểu viết ĐÚNG (giữ mount, chỉ đổi `open`):
 *
 *      <HopXemTep tep={xemTep} mo={xemTep !== null} onDong={() => setXemTep(null)} />
 *
 * ⚠️ Còn 3 chỗ gọi sai mà phiên này KHÔNG được sửa (tệp của agent khác đang giữ):
 *      · `thanh-phan-dung-chung/o-dinh-kem-nhieu-tep.tsx`  (~dòng 124)
 *      · `thanh-phan-nghiep-vu/khoi-trao-doi.tsx`          (~dòng 654)
 *      · `thanh-phan-nghiep-vu/khoi-dau-vao-theo-giai-doan.tsx` (~dòng 605)
 *    Cộng thêm ca `o-dinh-kem-tep.tsx`: `<HopXemTep>` và `<HopXacNhan>` nằm BÊN TRONG nhánh
 *    `{tep ? ... : ...}`, nên bấm "Bỏ tệp" là cả hai bị tháo cùng nhịp.
 *    👉 Chừng nào 4 chỗ đó còn nguyên thì gốc rễ vẫn còn — lớp này chỉ LAU DỌN hậu quả.
 *
 * 🔴 BỐN ĐIỀU KIỆN BẢO VỆ, THIẾU MỘT CÁI LÀ HỎNG NẶNG HƠN LỖI BAN ĐẦU. Dọn bừa lúc còn hộp
 *    thoại thật đang mở = trang sau lưng cuộn được, trình đọc màn hình đọc cả phần lẽ ra bị
 *    che, và bẫy focus của hộp thoại hỏng:
 *      ① Còn BẤT KỲ cổng portal nào của base-ui (`[data-base-ui-portal]`) → KHÔNG đụng vào.
 *         Dialog · Popover · Select · Menu · Tooltip đều portal, và portal chỉ biến mất SAU khi
 *         hiệu ứng đóng chạy xong — nên đây là tín hiệu "còn bận" mạnh nhất.
 *      ② Còn `[role="dialog"]` / `[role="alertdialog"]` → KHÔNG đụng. Bắt cả hộp thoại KHÔNG
 *         phải base-ui, cụ thể popup *"Quà của tôi"* (`khung-app/qua-cua-toi.tsx` dòng 77) TỰ
 *         khóa cuộn bằng `document.body.style.overflow`. Đó là khóa HỢP LỆ của phiên tích hợp —
 *         gỡ nó là phá code của họ (CLAUDE.md §6.6).
 *      ③ CHỈ dọn khi CÓ DẤU VẾT RÒ RỈ THẬT của base-ui (`data-base-ui-inert` trên con trực tiếp
 *         của <body>, hoặc `data-base-ui-scroll-locked` trên <html>). Không có dấu vết thì
 *         `overflow:hidden` kia là của người khác — để nguyên. Đây là chốt khiến popup
 *         *"Quà của tôi"* an toàn tuyệt đối: nó không bao giờ đặt `data-base-ui-inert`.
 *      ④ CHỈ quét CON TRỰC TIẾP của <body> — đúng phạm vi `collectOutsideElements` của
 *         `markOthers` (nó duyệt từ `body`). KHÔNG quét toàn trang: `InternalBackdrop` của
 *         base-ui TỰ mang `data-base-ui-inert` cho chính nó (`utils/InternalBackdrop.js`), gỡ
 *         là hỏng cơ chế bấm-ra-ngoài-để-đóng của thư viện.
 *
 * 📌 VÌ SAO LÀ MODULE CẤP FILE CHỨ KHÔNG PHẢI STATE TRONG COMPONENT: hẹn giờ phải SỐNG SÓT
 *    QUA VIỆC COMPONENT BỊ THÁO — chính lúc bị tháo mới là lúc rò rỉ. Một `setTimeout` ở tầng
 *    module không phụ thuộc React nên vẫn chạy sau khi cây con đã biến mất.
 *
 * ⚠️ RỦI RO CÒN LẠI, PHẢI BIẾT: điều kiện ①③ dựa vào thuộc tính NỘI BỘ của base-ui
 *    (`data-base-ui-portal`, `data-base-ui-inert`). Nâng phiên bản thư viện là chúng có thể đổi
 *    tên, và lớp này sẽ IM LẶNG hỏng — không lint nào bắt được. Bản đang dùng: `@base-ui/react`
 *    1.7.0 · `@base-ui/utils` 0.3.2. Nâng bản thì phải mở lại `markOthers.js` + `useScrollLock.js`
 *    kiểm hai tên thuộc tính này.
 */

/** Thuộc tính `markOthers` đặt lên mọi khối NGOÀI popup. Xem `markOthers.js` dòng 16. */
const DAU_INERT = "data-base-ui-inert";

/** Cờ `preventScrollInsetScrollbars` đặt lên <html>. Xem `useScrollLock.js` dòng 166. */
const DAU_KHOA_CUON = "data-base-ui-scroll-locked";

/**
 * Thuộc tính của CỔNG PORTAL base-ui, sinh bởi `createAttribute('portal')` trong
 * `floating-ui-react/utils/createAttribute.js` (trả về `data-base-ui-${name}`).
 * Còn phần tử này trong DOM = còn popup đang mở hoặc đang chạy hiệu ứng đóng.
 */
const DAU_PORTAL = "data-base-ui-portal";

/**
 * Chờ trước khi quét.
 *
 * 🔴 ĐỪNG HẠ XUỐNG 0. Phải để base-ui tự dọn TRƯỚC — nó dọn qua `setTimeout(fn, 0)`
 * (`ScrollLocker.release` → `timeoutUnlock`), và hiệu ứng đóng của `DialogContent` là
 * `duration-100`. Quét sớm hơn là cướp việc của thư viện rồi hai bên đánh nhau.
 */
const CHO_TRUOC_KHI_QUET = 350;

/** Gặp "còn bận" thì hoãn lại, nhưng có trần — không để treo một vòng lặp vô tận. */
const SO_LAN_HOAN_TOI_DA = 10;

let hen: ReturnType<typeof setTimeout> | null = null;
let soLanHoan = 0;

/**
 * Còn hộp thoại / popup nào ĐANG MỞ THẬT không? Đúng là điều kiện bảo vệ ① và ②.
 *
 * Trả `true` nghĩa là "còn bận, đừng đụng vào" — và khi không chắc thì LUÔN trả `true`,
 * vì bỏ sót một lần lau dọn chỉ là phiền, còn dọn nhầm lúc là hỏng hộp thoại thật.
 */
export function conHopThoaiDangMo(): boolean {
  if (typeof document === "undefined") return true;
  if (document.querySelector(`[${DAU_PORTAL}]`)) return true;
  if (document.querySelector('[role="dialog"],[role="alertdialog"]')) return true;
  return false;
}

/** Điều kiện bảo vệ ③ — có đúng dấu vết base-ui để lại hay không. */
function conDauVetRoRi(): boolean {
  if (document.documentElement.hasAttribute(DAU_KHOA_CUON)) return true;
  for (const el of Array.from(document.body.children)) {
    if (el.hasAttribute(DAU_INERT)) return true;
  }
  return false;
}

/** Gỡ đúng ba thứ đã thấy trong ảnh F12, không gỡ gì thêm. */
function goDauVetRoRi(): void {
  const html = document.documentElement;
  const body = document.body;

  // ① Cờ vô hiệu hóa nội dung — thứ làm "bấm không ăn" và làm trình đọc màn hình câm.
  //    Điều kiện bảo vệ ④: chỉ con TRỰC TIẾP của <body>.
  for (const el of Array.from(body.children)) {
    if (!el.hasAttribute(DAU_INERT)) continue;
    el.removeAttribute(DAU_INERT);
    /* Chỉ gỡ `aria-hidden` trên phần tử ĐÃ mang dấu của base-ui. Tập bị `aria-hidden` là TẬP
       CON của tập bị đánh dấu (phần tử `aria-live` bị đánh dấu nhưng không bị `aria-hidden`),
       nên ràng buộc này không bỏ sót cái nào, mà lại không bao giờ động vào `aria-hidden` do
       người khác tự đặt. */
    if (el.getAttribute("aria-hidden") === "true") el.removeAttribute("aria-hidden");
  }

  // ② Khóa cuộn nhánh "overlay scrollbars" — nhánh khớp ảnh F12: CHỈ có overflowY + overflowX.
  for (const el of [html, body]) {
    if (el.style.overflowY === "hidden" && el.style.overflowX === "hidden") {
      el.style.overflowY = "";
      el.style.overflowX = "";
    }
  }

  // ③ Khóa cuộn nhánh "inset scrollbars" — ghi thêm position/height/width lên <body>.
  //    Ảnh F12 lần này KHÔNG rơi vào nhánh này, nhưng cửa sổ có thanh cuộn chiếm chỗ thì rơi,
  //    nên vẫn phải dọn. Danh sách thuộc tính lấy đúng theo `useScrollLock.js` dòng 101-167.
  if (html.hasAttribute(DAU_KHOA_CUON)) {
    html.removeAttribute(DAU_KHOA_CUON);
    html.style.scrollbarGutter = "";
    html.style.overflowY = "";
    html.style.overflowX = "";
    html.style.scrollBehavior = "";
    body.style.position = "";
    body.style.height = "";
    body.style.width = "";
    body.style.boxSizing = "";
    body.style.overflowY = "";
    body.style.overflowX = "";
    body.style.scrollBehavior = "";
  }
}

function quet(): void {
  hen = null;
  if (typeof document === "undefined") return;

  if (conHopThoaiDangMo()) {
    // Còn bận: hoãn chứ không bỏ — hộp thoại kia đóng xong thì dấu vết vẫn cần được dọn.
    if (soLanHoan < SO_LAN_HOAN_TOI_DA) {
      soLanHoan += 1;
      hen = setTimeout(quet, CHO_TRUOC_KHI_QUET);
    } else {
      soLanHoan = 0;
    }
    return;
  }

  soLanHoan = 0;
  if (!conDauVetRoRi()) return;
  goDauVetRoRi();
}

/**
 * Hẹn một lượt quét CÓ BẢO VỆ. Gọi được từ bất cứ đâu, gọi nhiều lần cũng chỉ thành một lượt.
 *
 * 📌 Cố ý KHÔNG làm gì ngay lập tức: base-ui phải được quyền tự dọn trước (xem
 * `CHO_TRUOC_KHI_QUET`).
 */
export function henDonDepHopThoai(): void {
  if (typeof document === "undefined") return;
  if (hen !== null) clearTimeout(hen);
  soLanHoan = 0;
  hen = setTimeout(quet, CHO_TRUOC_KHI_QUET);
}

/**
 * Gắn lưới an toàn vào một hộp thoại.
 *
 * @param dangMo Hộp thoại này có đang mở không.
 *
 * Hẹn quét ở HAI thời điểm, và cả hai đều cần thiết:
 *   ① `dangMo` chuyển `true → false`, HOẶC component bị tháo GIỮA LÚC đang mở — đây đúng là
 *      hai lúc rò rỉ xảy ra.
 *   ② Component bị tháo, kể cả khi đang đóng — để bắt ca hộp thoại ANH EM cùng bị tháo một
 *      nhịp. Cụ thể: ở `o-dinh-kem-tep.tsx`, bấm "Bỏ tệp" làm cả `HopXemTep` (đang đóng) lẫn
 *      `HopXacNhan` (vừa đóng) biến mất cùng lúc; `HopXacNhan` là cái rò rỉ, nhưng tệp đó
 *      phiên này không được sửa — nên phải mượn chính cú tháo của `HopXemTep` để hẹn quét.
 *
 * ⚠️ Quét là thao tác rẻ và có bảo vệ (thường chỉ là 2 câu `querySelector` rồi thoát), nên
 * hẹn dư vài lượt không sao. Ngược lại, bỏ sót một lượt là cả app đơ tới khi F5.
 */
export function useDonDepHopThoaiKet(dangMo: boolean): void {
  useEffect(() => {
    if (!dangMo) return undefined;
    return henDonDepHopThoai;
  }, [dangMo]);

  useEffect(() => henDonDepHopThoai, []);
}
