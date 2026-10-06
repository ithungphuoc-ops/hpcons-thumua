"use client";

import { useEffect, useRef } from "react";

/**
 * Ô tích ba trạng thái (bật / tắt / mỗi người một kiểu).
 *
 * 📌 Dời nguyên ruột từ `1-giao-dien/trang/phan-quyen.tsx` ngày 06/10/2026 (gói D phân quyền) — bảng
 * mẫu chức danh (`thanh-phan-nghiep-vu/bang-mau-chuc-danh.tsx`) và khối tick từng người cùng dùng MỘT
 * bản, không để hai bản sao trôi khác nhau.
 *
 * 📌 DÙNG `<input type="checkbox">` GỐC, KHÔNG dùng `nen-tang-ui/checkbox`: `Checkbox.Indicator` của
 * base-ui vẽ DẤU TÍCH cho cả trạng thái `indeterminate` (đo trong `CheckboxIndicator.js`:
 * `rendered = checked || indeterminate`), tức ô "mỗi người một kiểu" trông y như ô đã bật — đúng
 * thứ dễ khiến người phân quyền hiểu nhầm nhất. Ô gốc vẽ dấu gạch ngang và tự báo `aria-checked=
 * "mixed"` cho trình đọc màn hình. Thư viện `nen-tang-ui/` là thư viện ngoài, không sửa.
 *
 * ⚠️ Ô chỉ rộng 18px — nơi gọi phải bọc trong `<label>` có vùng chạm ≥ 44px (Design System V1.1).
 */
export function OTich({
  giaTri,
  onDoi,
  disabled,
  ariaLabel,
  ariaDescribedBy,
  className = "",
}: {
  giaTri: boolean | "mixed";
  onDoi: (bat: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = giaTri === "mixed";
  }, [giaTri]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={giaTri === true}
      disabled={disabled}
      onChange={(e) => onDoi(e.target.checked)}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`size-4.5 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed ${className}`}
    />
  );
}
