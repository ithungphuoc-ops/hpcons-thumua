import { Clock } from "lucide-react";
import { Badge } from "@/1-giao-dien/nen-tang-ui/badge";
import { cn } from "@/6-tien-ich/gop-lop";

/**
 * ★ BADGE MÀU RIÊNG cho PO trạng thái `"cho_de_nghi"` — thêm 29/08/2026.
 *
 * 🔴 CỐ Ý KHÔNG dùng `StatusBadge` (5 tông chuẩn Design System V1.1) và KHÔNG thêm token màu
 * mới vào `app/globals.css` — trạng thái này chỉ tồn tại ở đúng module "Lập đơn mua hàng
 * (PO)", mở rộng bảng màu dùng chung cho cả hệ thống vì một trạng thái cục bộ là quá tay.
 * Dùng thẳng màu tím Tailwind mặc định (violet), có biến thể tối cho theme dark.
 *
 * Sếp chốt 29/08/2026: "1 màu sắc riêng" để nhận ra ngay PO nào còn thiếu đề nghị, và tự
 * quay về badge/màu chuẩn (`StatusBadge` bình thường) ngay khi gắn đề nghị xong — xem nơi
 * gọi component này, luôn có `if (po.trangThai === "cho_de_nghi") return <BadgeChoDeNghi />`
 * đứng TRƯỚC nhánh `StatusBadge` thường, không phải thay hẳn.
 */
export function BadgeChoDeNghi({ className }: { className?: string }) {
  return (
    <Badge
      className={cn(
        "border-transparent bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
        className,
      )}
    >
      <Clock className="size-3" aria-hidden />
      Chờ đề nghị
    </Badge>
  );
}
