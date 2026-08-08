import { Badge } from "@/1-giao-dien/nen-tang-ui/badge";
import { cn } from "@/6-tien-ich/gop-lop";

export type StatusTone = "primary" | "success" | "warning" | "danger" | "neutral";

const toneClasses: Record<StatusTone, string> = {
  primary: "bg-primary-bg text-primary border-transparent",
  success: "bg-success-bg text-success-soft border-transparent",
  warning: "bg-warning-bg text-warning-soft border-transparent",
  danger: "bg-danger-bg text-danger-soft border-transparent",
  neutral: "bg-neutral-bg text-neutral-soft border-transparent",
};

export interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
  className?: string;
}

/**
 * Badge trạng thái — HPCons Design System V1.1 Phần E4.
 * Luôn hiển thị CẢ màu và chữ (không được chỉ dùng màu để biểu đạt trạng thái).
 */
export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return <Badge className={cn(toneClasses[tone], className)}>{label}</Badge>;
}
