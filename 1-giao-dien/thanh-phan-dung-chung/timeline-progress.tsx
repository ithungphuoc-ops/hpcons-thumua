import { formatDate, daysUntil } from "@/6-tien-ich/dinh-dang";
import { cn } from "@/6-tien-ich/gop-lop";

export interface TimelineProgressProps {
  startDate: string;
  endDate: string;
  /** true khi đơn hàng/công việc đã hoàn thành — luôn hiện màu success bất kể thời gian. */
  completed?: boolean;
  /** Các mốc thực tế đánh dấu trên thanh (vd: từng lần nhận hàng). */
  mocThucTe?: { ngay: string; nhan: string }[];
  className?: string;
}

/**
 * Timeline Progress // thanh tiến độ thời gian — HPCons Design System V1.1 Phần E2.
 * Dùng thống nhất cho mọi màn hình có thời hạn (Mua hàng, Dự án, Hợp đồng, Công việc...).
 * Hiển thị: ngày bắt đầu, ngày kết thúc, % thời gian đã dùng, số ngày còn lại/quá hạn.
 * Màu: primary → warning (>=70%) → danger (>=90% hoặc quá hạn); hoàn thành = success.
 *
 * ⚠️ Khác bản thumua-next: bản cũ dùng <Progress> của shadcn và truyền Track/Indicator
 * làm children, nhưng chính <Progress> lại TỰ vẽ thêm một Track nữa → hiện HAI thanh
 * chồng nhau và không đổi được màu theo trạng thái. Ở đây vẽ thanh trực tiếp bằng token.
 * Bề rộng phải đặt qua `style` vì là giá trị động — đây là ngoại lệ được phép của
 * luật "không inline style".
 */
export function TimelineProgress({
  startDate,
  endDate,
  completed = false,
  mocThucTe,
  className,
}: TimelineProgressProps) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
  const remaining = daysUntil(endDate);
  const elapsedDays = totalDays - Math.max(remaining, 0);
  const rawPercent = completed ? 100 : Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  const overdue = !completed && remaining < 0;
  const percent = overdue ? 100 : rawPercent;

  const tone = completed
    ? "success"
    : overdue || percent >= 90
      ? "danger"
      : percent >= 70
        ? "warning"
        : "primary";

  const barClass = { success: "bg-success", danger: "bg-danger", warning: "bg-warning", primary: "bg-primary" }[tone];
  const textClass = {
    success: "text-success-soft",
    danger: "text-danger-soft",
    warning: "text-warning-soft",
    primary: "text-primary",
  }[tone];

  const label = completed
    ? "Đã hoàn thành"
    : overdue
      ? `Quá hạn ${Math.abs(remaining)} ngày`
      : `Còn ${remaining} ngày`;

  /**
   * Vị trí % của một mốc thực tế trên trục thời gian.
   *
   * 🔴 Chặn hai trường hợp làm ra `NaN%` — trình duyệt nhận `left: NaN%` thì bỏ qua thuộc
   * tính, mốc rơi về mép trái và người đọc tưởng hàng về từ ngày đầu:
   *   · `end === start` (đơn đặt và cần hàng trong cùng một ngày) → chia cho 0.
   *   · `ngay` rỗng hoặc sai định dạng → `getTime()` trả `NaN`.
   * Đơn trong ngày thì mọi mốc nằm ở 100% — đúng nghĩa "trục thời gian dài 0 ngày".
   */
  function viTri(ngay: string): number {
    const t = new Date(ngay).getTime();
    if (Number.isNaN(t)) return 0;
    const doDai = end.getTime() - start.getTime();
    if (!Number.isFinite(doDai) || doDai <= 0) return t >= start.getTime() ? 100 : 0;
    return Math.min(100, Math.max(0, ((t - start.getTime()) / doDai) * 100));
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between text-xs text-text-desc">
        <span>{formatDate(startDate)}</span>
        <span className={cn("font-semibold", textClass)}>{label}</span>
        <span>{formatDate(endDate)}</span>
      </div>

      <div
        className="relative h-2 w-full overflow-visible rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Tiến độ thời gian"
      >
        <div className={cn("h-full rounded-full transition-all", barClass)} style={{ width: `${percent}%` }} />
        {mocThucTe?.map((m) => (
          <span
            key={m.ngay + m.nhan}
            title={m.nhan}
            className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-success"
            style={{ left: `${viTri(m.ngay)}%` }}
          />
        ))}
      </div>

      <p className="text-right text-xs text-text-desc">{Math.round(percent)}% thời gian đã sử dụng</p>
    </div>
  );
}
