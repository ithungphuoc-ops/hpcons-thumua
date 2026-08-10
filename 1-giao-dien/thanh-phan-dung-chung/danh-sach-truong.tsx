"use client";

import type { ReactNode } from "react";

/**
 * DANH SÁCH TRƯỜNG THÔNG TIN — mỗi dòng: số thứ tự · nhãn nhỏ · giá trị.
 *
 * Bám đúng bố cục trang nhiệm vụ Base.vn (ảnh Ban lãnh đạo cung cấp 10/08/2026):
 * `02  Tên công trình` ở trên, giá trị `DCSFGBV` ở dưới, cách nhau bằng đường kẻ mảnh.
 *
 * 🔴 VÌ SAO ĐÁNH SỐ: người dùng và người lập phiếu trao đổi qua điện thoại thường nói
 * *"ô số 4 điền gì"*. Có số thì chỉ nhau được ngay, khỏi phải đọc lại cả tên trường.
 * Số do THỨ TỰ trong mảng sinh ra, không gõ tay — thêm/bớt trường là số tự chạy lại.
 *
 * ⚠️ Trường không có giá trị vẫn hiện, ghi dấu "—". Ẩn đi thì số thứ tự nhảy khoảng và
 * người dùng tưởng mất trường.
 */
export interface TruongThongTin {
  nhan: string;
  /** Giá trị hiển thị. Truyền `undefined`/rỗng thì hiện dấu "—". */
  giaTri?: ReactNode;
  /** Cho trường dài (tên công trình, điều khoản) chiếm cả hàng trên màn rộng. */
  daiCaHang?: boolean;
}

export function DanhSachTruong({ truong }: { truong: TruongThongTin[] }) {
  return (
    <dl className="flex flex-col">
      {truong.map((t, i) => (
        <div
          key={t.nhan}
          className="flex flex-col gap-0.5 border-b border-divider py-2.5 last:border-b-0"
        >
          <dt className="flex items-baseline gap-2.5">
            {/* Số thứ tự dùng chữ số cố định bề rộng (tabular-nums) để các dòng thẳng cột. */}
            <span className="shrink-0 font-mono text-[11px] text-text-desc tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-xs text-text-desc">{t.nhan}</span>
          </dt>
          {/* Thụt vào bằng bề rộng số + khoảng cách, cho giá trị thẳng hàng với nhãn. */}
          <dd className="pl-[calc(1.5rem+0.125rem)] text-sm font-medium break-words text-text-primary">
            {t.giaTri === undefined || t.giaTri === "" ? (
              <span className="text-text-desc">—</span>
            ) : (
              t.giaTri
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
