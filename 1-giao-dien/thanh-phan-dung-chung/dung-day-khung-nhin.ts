"use client";

// ============================================================
// KHUNG CUỘN DỪNG ĐÚNG ĐÁY MÀN HÌNH — để thanh cuộn ngang luôn nằm trong tầm nhìn.
//
// ★ Sếp 25/09/2026: ***"Thanh di chuyển này đang bị trôi xuống dưới danh sách, hãy cố định nó
// trong view nhìn"***, rồi sau lần sửa đầu: ***"e lại phá thanh cuộn ngang của mục quy trình mua
// hàng kiểu danh sách rồi"*** — ***"E tạo thanh cuộn giống dạng bảng đi"***.
//
// 🔴 VÌ SAO KHÔNG ĐẶT CỨNG `max-h-[calc(100dvh-Xrem)]` NHƯ DẠNG BẢNG. Lần sửa đầu của tôi đặt
// `10rem` theo ƯỚC LƯỢNG, trong khi phía trên bảng danh sách còn tiêu đề thẻ + dải lọc (xuống
// dòng khi màn hẹp) — khung cao hơn màn hình, thanh cuộn vẫn nằm ngoài tầm nhìn. Dạng bảng dùng
// được con số cứng vì phía trên nó cố định và đã ĐO THẬT (xem `bang-quy-trinh-mua-hang.tsx`).
// Ở đây phần phía trên đổi theo nội dung, nên phải ĐO LÚC CHẠY: chiều cao = đáy khung nhìn − mép
// trên của khung − đệm dưới của `main`.
//
// 📌 Đặt qua biến CSS `--cao-toi-da` (lớp `max-h-(--cao-toi-da)` ở nơi dùng), không viết
// `style={{}}` trong JSX — quy ước dự án cấm inline style.
// ============================================================

import { useEffect, type RefObject } from "react";

/** Không bóp khung thấp hơn mức này — màn quá thấp thì thà cuộn trang còn hơn bảng còn vài dòng. */
const CAO_TOI_THIEU = 320;

export function useDungDayKhungNhin(ref: RefObject<HTMLElement | null>, phuThuoc: unknown[] = []) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tinh = () => {
      const main = el.closest("main");
      const demDuoi = main ? parseFloat(getComputedStyle(main).paddingBottom) || 0 : 0;
      /* Mép trên TÍNH THEO TRANG (cộng scrollY), để cuộn trang một chút không làm khung co giãn. */
      const tren = el.getBoundingClientRect().top + window.scrollY;
      const cao = Math.max(CAO_TOI_THIEU, window.innerHeight - tren - demDuoi);
      el.style.setProperty("--cao-toi-da", `${Math.floor(cao)}px`);
    };
    tinh();
    window.addEventListener("resize", tinh);
    /* Phần phía trên (dải lọc) đổi cao khi xuống dòng — theo dõi thẻ cha để tính lại. */
    const quanSat = new ResizeObserver(tinh);
    if (el.parentElement) quanSat.observe(el.parentElement);
    return () => {
      window.removeEventListener("resize", tinh);
      quanSat.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, phuThuoc);
}
