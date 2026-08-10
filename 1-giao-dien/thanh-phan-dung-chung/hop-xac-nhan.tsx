"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";

/**
 * HỘP XÁC NHẬN DÙNG CHUNG cho mọi việc bấm là xong, không lùi lại được.
 *
 * 🔴 NGUYÊN TẮC BAN LÃNH ĐẠO 10/08/2026: *"khi bấm nhận công tác phải có cửa sổ thông báo
 * xác nhận, nguyên tắc cho các cái khác luôn nha"*.
 *
 * Áp cho việc nào:
 *   ✅ Chuyển bước quy trình (trình xét duyệt, duyệt phương án, chốt nhà cung cấp)
 *   ✅ Gửi dữ liệu ra ngoài phòng (chốt đơn hàng → đẩy sang Kho và QLDA)
 *   ✅ Ghi tên mình vào hồ sơ (nhận công tác)
 *   ✅ Xóa dữ liệu
 *
 * KHÔNG áp cho việc sửa lại được ngay bằng một cú bấm khác — ví dụ phân bổ dòng cho nhân
 * viên (bấm lại là đổi người), nhập giá nhà cung cấp (lưu lại là ghi đè). Hỏi cả những việc
 * đó thì người dùng bấm "Đồng ý" theo phản xạ, và hộp xác nhận mất hết tác dụng ở đúng chỗ
 * cần nó.
 *
 * ⚠️ Cờ mở tách khỏi nội dung: component chỉ mở khi `mo === true`, còn phần thân do người
 * gọi giữ. Xóa nội dung cùng lúc với đóng sẽ tháo cây con giữa lúc hiệu ứng đóng đang chạy
 * và để lại lớp mờ kẹt trên màn hình — đã dính lỗi này khi làm hộp chọn người theo dõi.
 */
export function HopXacNhan({
  mo,
  tieuDe,
  moTa,
  /** Câu cảnh báo hệ quả — hiện trong khung vàng. Bỏ trống nếu việc này không có gì đáng lo. */
  canhBao,
  /** Nhãn nút đồng ý. Mặc định "Đồng ý" theo cách nói của Ban lãnh đạo. */
  nhanDongY = "Đồng ý",
  /** Nút đồng ý màu đỏ — dùng cho việc phá hủy dữ liệu. */
  nguyHiem = false,
  children,
  onDong,
  onDongY,
}: {
  mo: boolean;
  tieuDe: string;
  moTa?: ReactNode;
  canhBao?: ReactNode;
  nhanDongY?: string;
  nguyHiem?: boolean;
  children?: ReactNode;
  onDong: () => void;
  onDongY: () => void;
}) {
  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tieuDe}</DialogTitle>
          {moTa && <DialogDescription>{moTa}</DialogDescription>}
        </DialogHeader>

        {children}

        {canhBao && (
          <div className="flex items-start gap-2 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-soft" aria-hidden />
            <span>{canhBao}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Hủy
          </Button>
          <Button
            variant={nguyHiem ? "destructive" : "default"}
            onClick={() => {
              onDongY();
              onDong();
            }}
          >
            <Check className="size-4" aria-hidden />
            {nhanDongY}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
