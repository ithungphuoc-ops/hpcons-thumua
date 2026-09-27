"use client";

import { Search } from "lucide-react";
import { datTuKhoaBangQuyTrinh } from "@/1-giao-dien/khung-app/tu-khoa-bang-quy-trinh";

/**
 * ★ DẢI "ĐANG LỌC THEO …" — dùng chung cho mọi màn lọc bảng bằng ô tìm ở thanh trên (Quy trình mua
 * hàng · Theo dõi đề nghị · Đơn đặt hàng — Sếp 27/09/2026: *"A muốn khi bấm tìm kiếm mã đề nghị nào
 * thì trên màn hình chỉ hiển thị đúng đề nghị đó"*, *"Ở tab đơn hàng cũng vậy"*).
 *
 * Nói rõ đang lọc + nút bỏ lọc — đừng để người dùng tưởng mất hồ sơ. "Bỏ lọc" xoá từ khoá ở kho chung,
 * ô tìm trên thanh trên tự xoá theo (`o-tim-kiem.tsx`). Cao 44px trên điện thoại (V1.1).
 */
export function DaiDangLoc({
  tuKhoa,
  soKetQua,
  donVi,
}: {
  tuKhoa: string;
  soKetQua: number;
  /** "đề nghị" / "đơn" */
  donVi: string;
}) {
  if (!tuKhoa.trim()) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary-bg px-3 py-2 text-sm text-primary">
      <Search className="size-4 shrink-0" aria-hidden />
      <span>
        Đang lọc theo “<strong>{tuKhoa.trim()}</strong>” — {soKetQua} {donVi}
      </span>
      <button
        type="button"
        onClick={() => datTuKhoaBangQuyTrinh("")}
        className="ml-auto inline-flex min-h-11 items-center rounded-md px-2 font-medium underline-offset-2 hover:underline md:min-h-8"
      >
        Bỏ lọc
      </button>
    </div>
  );
}
