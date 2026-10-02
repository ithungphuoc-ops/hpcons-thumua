"use client";

// ============================================================
// Ô GHI LÝ DO NGẮN — một ô chữ + nút Lưu, dùng khi một chứng từ "không có" phải kèm lý do.
//
// ★ Dùng đầu tiên cho mục 8 Phiếu chi (Sếp 02/10/2026): *"Không tích [Gỡ ứng] thì phải ghi lý do
// thì mới được qua bước"*. Ô chỉ VẼ; lưu đi đâu, chặn gì là việc của nơi gọi (`onLuu`).
// 📌 Lưu khi bấm nút hoặc Enter, KHÔNG lưu theo từng phím: mỗi lần lưu là một dòng nhật ký.
// ============================================================

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";

export function OGhiLyDo({
  giaTri,
  nhan,
  khoa,
  onLuu,
}: {
  /** Lý do đang lưu ("" = chưa ghi). */
  giaTri: string;
  /** Nhãn cho trình đọc màn hình và chữ gợi ý. */
  nhan: string;
  /** Lý do khoá ô — có thì ô chỉ đọc. */
  khoa?: string;
  /** Trả câu lý do bị chặn, `null` là đã lưu. */
  onLuu: (lyDo: string) => string | null;
}) {
  const [nhap, setNhap] = useState(giaTri);
  const doi = nhap.trim() !== giaTri.trim();

  function luu() {
    const loi = onLuu(nhap.trim());
    if (loi) toast.error("Chưa ghi được lý do", { description: loi });
    else toast.success(nhap.trim() ? "Đã ghi lý do" : "Đã xoá lý do");
  }

  /* Bị khoá thì nói rõ đang ghi gì và vì sao không sửa được — `title` trên ô mờ không hiện được
     trên điện thoại và nhiều trình duyệt không hiện cho phần tử disabled. */
  if (khoa !== undefined) {
    return (
      <span className="text-sm text-text-secondary">
        {giaTri ? `Lý do: ${giaTri}` : "Chưa ghi lý do."}{" "}
        <span className="text-xs text-text-desc">({khoa})</span>
      </span>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <Input
        aria-label={nhan}
        placeholder={nhan}
        value={nhap}
        onChange={(e) => setNhap(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && doi) luu();
        }}
        className="h-11 min-w-56 flex-1 text-sm md:h-9"
      />
      {doi && (
        <Button size="sm" onClick={luu}>
          Lưu lý do
        </Button>
      )}
    </div>
  );
}
