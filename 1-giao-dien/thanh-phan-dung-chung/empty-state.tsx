import type { LucideIcon } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { cn } from "@/6-tien-ich/gop-lop";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * Empty State // trạng thái trống — HPCons Design System V1.1 Phần E3.
 * Bắt buộc khi màn hình chưa có dữ liệu — cấm để khoảng trắng lớn.
 * Đủ 4 phần: icon + tiêu đề + mô tả + hành động (nếu có).
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-text-desc" aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-h3 text-text-primary">{title}</p>
        <p className="max-w-sm text-sm text-text-desc">{description}</p>
      </div>
      {action ? (
        <Button onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
