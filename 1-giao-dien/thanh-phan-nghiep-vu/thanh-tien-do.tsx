import { LOP_THANH, type Tong } from "@/2-quy-trinh/trang-thai";
import { cn } from "@/6-tien-ich/gop-lop";

export interface ThanhTienDoProps {
  phanTram: number;
  tong?: Tong;
  /** Chữ đi kèm — luật V1.1: trạng thái phải có cả màu và chữ. */
  nhan?: string;
  className?: string;
}

/** Thanh tiến độ nhỏ dùng trong bảng và thẻ. Không hardcode màu — đi qua token. */
export function ThanhTienDo({ phanTram, tong = "primary", nhan, className }: ThanhTienDoProps) {
  const p = Math.min(100, Math.max(0, phanTram));
  return (
    <div className={cn("flex min-w-24 flex-col gap-1", className)}>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(p)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cn("h-full rounded-full transition-all", LOP_THANH[tong])} style={{ width: `${p}%` }} />
      </div>
      <span className="text-xs text-text-desc">{nhan ?? `${Math.round(p)}%`}</span>
    </div>
  );
}
