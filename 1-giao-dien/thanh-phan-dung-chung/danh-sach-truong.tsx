"use client";

import type { ReactNode } from "react";

/**
 * DANH SÁCH TRƯỜNG THÔNG TIN — mỗi ô: số thứ tự · nhãn nhỏ · giá trị.
 *
 * Bám bố cục trang nhiệm vụ Base.vn (ảnh Ban lãnh đạo cung cấp 10/08/2026): nhãn nhỏ xám
 * ở trên, giá trị đậm ở dưới.
 *
 * 🔴 XẾP THÀNH LƯỚI NHIỀU CỘT, KHÔNG XẾP DỌC MỘT CỘT (chỉ đạo Ban lãnh đạo 10/08/2026:
 * *"để list vậy dài quá"*). 12 trường xếp dọc chiếm gần một màn hình, đẩy bảng phân bổ —
 * phần làm việc thật — xuống dưới tầm mắt. Xếp 3 cột thì còn 4 hàng.
 *
 * 🔴 VÌ SAO ĐÁNH SỐ: người dùng và người lập phiếu trao đổi qua điện thoại thường nói
 * *"ô số 4 điền gì"*. Có số thì chỉ nhau được ngay, khỏi phải đọc lại cả tên trường.
 * Số do THỨ TỰ trong mảng sinh ra, không gõ tay — thêm/bớt trường là số tự chạy lại.
 *
 * ⚠️ Số thứ tự chạy theo THỨ TỰ ĐỌC là ngang (01 02 03 rồi xuống hàng), giống cách người
 * ta đọc một trang giấy. Đừng đổi sang `grid-flow-col` — số sẽ chạy dọc và người dùng dò
 * mãi không thấy "ô số 4".
 *
 * ⚠️ Trường không có giá trị vẫn hiện, ghi dấu "—". Ẩn đi thì số thứ tự nhảy khoảng và
 * người dùng tưởng mất trường.
 */
export interface TruongThongTin {
  nhan: string;
  /** Giá trị hiển thị. Truyền `undefined`/rỗng thì hiện dấu "—". */
  giaTri?: ReactNode;
  /** Trường dài (tiêu đề, tên công trình, điều khoản) chiếm cả hàng để không bị cắt chữ. */
  daiCaHang?: boolean;
}

export function DanhSachTruong({ truong }: { truong: TruongThongTin[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
      {truong.map((t, i) => (
        <div
          key={t.nhan}
          className={`flex min-w-0 flex-col gap-0.5 border-b border-divider py-2 ${
            t.daiCaHang ? "sm:col-span-2 lg:col-span-3" : ""
          }`}
        >
          <dt className="flex items-baseline gap-2">
            {/* Số thứ tự dùng chữ số cố định bề rộng (tabular-nums) để các ô thẳng cột. */}
            <span className="shrink-0 font-mono text-[11px] text-text-desc tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="truncate text-xs text-text-desc">{t.nhan}</span>
          </dt>
          {/* Thụt vào bằng bề rộng số + khoảng cách, cho giá trị thẳng hàng với nhãn. */}
          <dd className="pl-[calc(1.25rem+0.125rem)] text-sm font-medium break-words text-text-primary">
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
