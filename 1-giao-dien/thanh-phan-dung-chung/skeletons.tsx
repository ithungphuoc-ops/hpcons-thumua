import { Skeleton } from "@/1-giao-dien/nen-tang-ui/skeleton";
import { Card, CardContent, CardHeader } from "@/1-giao-dien/nen-tang-ui/card";

/**
 * Bộ khung chờ (Skeleton) dùng chung — HPCons Design System 12-feedback.
 *
 * Nguyên tắc: khung chờ phải mô phỏng ĐÚNG hình dạng nội dung sắp hiện (cùng
 * chiều cao, cùng số cột) để trang không bị giật khi dữ liệu về.
 */

export function PageHeaderSkeleton({ hasActions = true }: { hasActions?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-56" /> {/* breadcrumb */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-72" /> {/* tiêu đề */}
          <Skeleton className="h-4 w-96 max-w-full" /> {/* mô tả */}
        </div>
        {hasActions && (
          <div className="flex shrink-0 gap-2">
            <Skeleton className="h-12 w-32 md:h-11 xl:h-10" />
            <Skeleton className="h-12 w-32 md:h-11 xl:h-10" />
          </div>
        )}
      </div>
    </div>
  );
}

/** Khung chờ cho hàng KPI Card — mặc định 4 thẻ như các trang hiện có. */
export function KpiRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-start gap-3">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Khung chờ cho bảng dữ liệu. Trên mobile (<768px) hiện dạng thẻ để khớp với
 * cách bảng thật chuyển sang Card List.
 */
export function TableSkeleton({
  columns = 5,
  rows = 6,
  hasToolbar = true,
}: {
  columns?: number;
  rows?: number;
  hasToolbar?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        {hasToolbar && (
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-12 w-full max-w-xs md:h-11 xl:h-10" />
            <Skeleton className="ml-auto h-12 w-28 md:h-11 xl:h-10" />
          </div>
        )}

        {/* Bảng — từ Tablet trở lên */}
        <div className="hidden flex-col md:flex">
          <div className="flex h-12 items-center gap-4 border-b border-border px-3">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-3.5 flex-1" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex h-11 items-center gap-4 border-b border-border px-3">
              {Array.from({ length: columns }).map((_, c) => (
                <Skeleton key={c} className="h-3.5 flex-1" />
              ))}
            </div>
          ))}
        </div>

        {/* Card List — mobile */}
        <div className="flex flex-col gap-3 md:hidden">
          {Array.from({ length: Math.min(rows, 4) }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Khung chờ cho một thẻ nội dung thường (chi tiết hồ sơ). */
export function CardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${100 - i * 8}%` }} />
        ))}
      </CardContent>
    </Card>
  );
}
