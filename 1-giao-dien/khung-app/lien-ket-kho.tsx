"use client";

import { useContext, useMemo, type ComponentProps } from "react";
import NextLink from "next/link";
import { usePathname, useRouter as useRouterNext } from "next/navigation";
import { khoTheoDuongDan, themTienToKho, type KhoId } from "@/3-du-lieu/kho-id";
import { KhoNguCanh } from "@/1-giao-dien/khung-app/kho-ngu-canh";

// ============================================================
// LIÊN KẾT VÀ ĐIỀU HƯỚNG BIẾT KHO — Sếp duyệt demo 14/10/2026
//
// Màn hình của kho EQUI dùng chung code với kho thường. Mã nguồn có hàng trăm chỗ viết địa chỉ
// như `/de-nghi/123`, `/don-hang/…`; thay từng chỗ bằng địa chỉ có tiền tố là sai sót chắc chắn
// xảy ra. Thay vào đó, ba thứ dưới đây **thêm tiền tố ở nơi tiêu thụ**: đang ở `/equi/…` thì
// địa chỉ nào là màn hình của kho tự được thêm `/equi`. Luật chọn nằm ở `themTienToKho`
// (`3-du-lieu/kho-id.ts`) — một chỗ duy nhất.
//
// 📌 Ở kho thường mọi thứ chạy y như `next/link` và `useRouter` gốc.
// ⚠️ CHỈ dùng cho màn hình nghiệp vụ của kho. Thanh bên / thanh dưới điện thoại cố ý vẫn dùng
// `next/link` gốc: menu phải dẫn tới ĐÚNG địa chỉ ghi trong `MUC_DIEU_HUONG`, kể cả khi đang ở EQUI.
// ============================================================

/**
 * Kho của trang đang mở: suy từ địa chỉ, TRỪ khi màn đang xem kho khác qua nút lọc EQUI (`KhoNguCanh`,
 * xem `vo-loc-kho.tsx`) — lúc đó ngữ cảnh thắng, để link trong màn dẫn tới đúng kho.
 */
export function useKhoHienTai(): KhoId {
  const tuNguCanh = useContext(KhoNguCanh);
  const tuDiaChi = khoTheoDuongDan(usePathname());
  return tuNguCanh ?? tuDiaChi;
}

/** Dùng thay `next/link` ở màn hình nghiệp vụ của kho. */
export default function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  const kho = useKhoHienTai();
  const dich =
    typeof href === "string"
      ? themTienToKho(href, kho)
      : href.pathname
        ? { ...href, pathname: themTienToKho(href.pathname, kho) }
        : href;
  return <NextLink href={dich} {...rest} />;
}

/** Địa chỉ đã thêm tiền tố theo kho hiện tại — cho chỗ không đi qua `Link`/`router` (vd `window.open`). */
export function useDuongDanKho(): (href: string) => string {
  const kho = useKhoHienTai();
  return useMemo(() => (href: string) => themTienToKho(href, kho), [kho]);
}

/**
 * Dùng thay `useRouter` của `next/navigation`. `push`/`replace`/`prefetch` tự thêm tiền tố;
 * `back`/`forward`/`refresh` giữ nguyên.
 *
 * 📌 Trả về đối tượng ỔN ĐỊNH (chỉ đổi khi router hoặc kho đổi) vì nhiều nơi để `router` trong
 * danh sách phụ thuộc của effect — đổi mỗi lần vẽ là effect chạy lại không dừng.
 */
export function useRouter(): ReturnType<typeof useRouterNext> {
  const router = useRouterNext();
  const kho = useKhoHienTai();
  return useMemo(
    () => ({
      ...router,
      push: (href: string, o?: Parameters<typeof router.push>[1]) =>
        router.push(themTienToKho(href, kho), o),
      replace: (href: string, o?: Parameters<typeof router.replace>[1]) =>
        router.replace(themTienToKho(href, kho), o),
      prefetch: (href: string, o?: Parameters<typeof router.prefetch>[1]) =>
        router.prefetch(themTienToKho(href, kho), o),
    }),
    [router, kho],
  );
}
