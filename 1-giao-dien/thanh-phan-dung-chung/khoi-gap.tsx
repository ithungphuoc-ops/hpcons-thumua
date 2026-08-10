"use client";

import { useState, type ReactNode } from "react";
import { ChevronUp } from "lucide-react";

/**
 * KHỐI GẬP ĐƯỢC — tiêu đề chữ hoa nhỏ, bấm vào là mở/gập phần thân.
 *
 * Bám bố cục trang nhiệm vụ Base.vn (ảnh Ban lãnh đạo cung cấp 10/08/2026): cột phải
 * xếp nhiều khối, khối nào ít dùng thì gập lại cho đỡ dài.
 *
 * ⚠️ Dùng `<button>` thật, KHÔNG dùng `<div onClick>` — bàn phím phải Tab tới và Enter
 * được. Trạng thái mở/gập báo qua `aria-expanded` để trình đọc màn hình biết.
 */
export function KhoiGap({
  tieuDe,
  moSan = false,
  soLuong,
  children,
}: {
  tieuDe: string;
  /** Mở sẵn khi vừa vào trang. Khối hay dùng thì để `true`. */
  moSan?: boolean;
  /** Con số hiện cạnh tiêu đề, vd số dòng lịch sử. Để trống thì không hiện. */
  soLuong?: number;
  children: ReactNode;
}) {
  const [mo, doiMo] = useState(moSan);

  return (
    <section className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => doiMo((v) => !v)}
        aria-expanded={mo}
        className="flex min-h-11 w-full items-center gap-2 px-(--hp-md-card-pad) py-3 text-left"
      >
        <span className="text-[11px] font-semibold tracking-wide text-text-desc uppercase">
          {tieuDe}
        </span>
        {soLuong !== undefined && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-text-secondary tabular-nums">
            {soLuong}
          </span>
        )}
        {/* Mũi tên quay 180° khi gập — dấu hiệu thị giác đi kèm aria-expanded. */}
        <ChevronUp
          className={`ml-auto size-4 shrink-0 text-text-desc transition-transform ${
            mo ? "" : "rotate-180"
          }`}
          aria-hidden
        />
      </button>
      {mo && (
        <div className="border-t border-divider px-(--hp-md-card-pad) py-(--hp-md-card-pad)">
          {children}
        </div>
      )}
    </section>
  );
}
