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

import { useSyncExternalStore } from "react";

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
