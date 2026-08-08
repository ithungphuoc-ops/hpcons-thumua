"use client";

import { Printer, X } from "lucide-react";

/**
 * Thanh công cụ chỉ hiện trên màn hình, tự ẩn khi in (`print:hidden`).
 * Không dùng component Button của app vì trang in cố định nền sáng,
 * không theo theme sáng/tối.
 */
export function PrintToolbar() {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#E4E7EC] bg-[#F9FAFB] px-6 py-3 print:hidden">
      <p className="text-sm text-[#475467]">
        Bấm <strong>In / Lưu PDF</strong>, rồi chọn <strong>&ldquo;Lưu thành PDF&rdquo;</strong> trong
        hộp thoại in để xuất file PDF.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => window.close()}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#D0D5DD] bg-white px-4 text-sm font-medium text-[#344054] transition-colors hover:bg-[#F2F4F7] xl:h-10"
        >
          <X className="size-4" aria-hidden />
          Đóng
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#096AA7] px-4 text-sm font-medium text-white transition-colors hover:bg-[#0A5D91] xl:h-10"
        >
          <Printer className="size-4" aria-hidden />
          In / Lưu PDF
        </button>
      </div>
    </div>
  );
}
