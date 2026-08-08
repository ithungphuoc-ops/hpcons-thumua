import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { cn } from "@/6-tien-ich/gop-lop";

type Tone = "primary" | "success" | "warning" | "danger" | "neutral";

const toneClasses: Record<Tone, { icon: string; iconBg: string }> = {
  primary: { icon: "text-primary", iconBg: "bg-primary-bg" },
  success: { icon: "text-success-soft", iconBg: "bg-success-bg" },
  warning: { icon: "text-warning-soft", iconBg: "bg-warning-bg" },
  danger: { icon: "text-danger-soft", iconBg: "bg-danger-bg" },
  neutral: { icon: "text-neutral-soft", iconBg: "bg-neutral-bg" },
};

export interface KpiCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  meta: string;
  tone?: Tone;
  className?: string;
}

/**
 * KPI Card // thẻ thống kê — HPCons Design System V1.1 Phần E1.
 * Bắt buộc đủ 4 thành phần: Icon + Tiêu đề + Giá trị chính + Thông tin phụ/trạng thái.
 * Cấm dùng card rỗng hoặc chỉ có biểu tượng.
 */
export function KpiCard({
  icon: Icon,
  title,
  value,
  meta,
  tone = "primary",
  className,
}: KpiCardProps) {
  const t = toneClasses[tone];
  return (
    <Card className={cn(className)}>
      <CardContent className="flex items-start gap-4">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", t.iconBg)}>
          <Icon className={cn("size-5", t.icon)} aria-hidden />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm text-text-secondary">{title}</p>
          <p className="text-2xl font-bold leading-tight text-text-primary">{value}</p>
          <p className="text-xs text-text-desc">{meta}</p>
        </div>
      </CardContent>
    </Card>
  );
}
