"use client";

// ============================================================
// TỪ KHOÁ LỌC BẢNG QUY TRÌNH — chia sẻ giữa ô tìm ở thanh trên (`o-tim-kiem.tsx`) và màn Quy trình
// mua hàng (`trang/de-nghi-danh-sach.tsx`).
//
// ★ Sếp 26/09/2026: *"khi a nhập mã số đề nghị vào thanh tìm kiếm, thì trên quy trình mua hàng chỉ
// hiện đúng cái đề nghị đó thôi"*. Ô tìm nằm ở khung app, bảng nằm ở trang — hai cây component khác
// nhau, nên dùng một kho nhỏ `useSyncExternalStore` thay vì đẩy từ khoá lên URL (`useSearchParams`
// buộc bọc Suspense ở trang dựng tĩnh, và mỗi phím gõ là một lần đổi địa chỉ).
//
// 📌 Chỉ là trạng thái GIAO DIỆN trong phiên (tải lại trang là hết) — không lưu, không đồng bộ.
// ============================================================

import { useEffect, useSyncExternalStore } from "react";

let tuKhoa = "";
const nguoiNghe = new Set<() => void>();

export function datTuKhoaBangQuyTrinh(moi: string): void {
  if (moi === tuKhoa) return;
  tuKhoa = moi;
  nguoiNghe.forEach((f) => f());
}

export function useTuKhoaBangQuyTrinh(): string {
  return useSyncExternalStore(
    (f) => {
      nguoiNghe.add(f);
      return () => nguoiNghe.delete(f);
    },
    () => tuKhoa,
    () => "",
  );
}

/* ★ Màn Quy trình mua hàng CÒN ĐANG HIỆN — Sếp 02/10/2026: mở pop-up xem nhanh thì địa chỉ thành
   `/de-nghi/<mã>` dù bảng vẫn nằm phía sau. Ô tìm hỏi ở đây chứ không chỉ so địa chỉ, nếu không mở
   pop-up là mất bộ lọc (QA bắt được 02/10/2026). */
let soBangDangHien = 0;
const nguoiNgheBang = new Set<() => void>();

export function useDanhDauBangQuyTrinhDangHien(): void {
  useEffect(() => {
    soBangDangHien += 1;
    nguoiNgheBang.forEach((f) => f());
    return () => {
      soBangDangHien -= 1;
      nguoiNgheBang.forEach((f) => f());
    };
  }, []);
}

export function useBangQuyTrinhDangHien(): boolean {
  return useSyncExternalStore(
    (f) => {
      nguoiNgheBang.add(f);
      return () => nguoiNgheBang.delete(f);
    },
    () => soBangDangHien > 0,
    () => false,
  );
}
