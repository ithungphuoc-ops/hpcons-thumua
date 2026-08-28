"use client";

import { useRouter } from "next/navigation";
import { ExternalLink, Maximize2 } from "lucide-react";
import { DropdownMenuItem } from "@/1-giao-dien/nen-tang-ui/dropdown-menu";

/**
 * ★ 2 MỤC MENU "LEO THANG SANG TRANG ĐẦY ĐỦ" — tách ra 28/08/2026 sau khi agent review độc
 * lập bắt đúng: cặp "Xem toàn màn hình"/"Xem trong tab mới" bị chép tay giống hệt nhau ở
 * 2 nơi (menu ⋯ trên thẻ Kanban ở `bang-quy-trinh-mua-hang.tsx`, và menu ⋯ bên TRONG pop-up
 * ở `de-nghi-danh-sach.tsx`) — cùng icon, cùng nhãn, cùng hành vi, chỉ khác biến chứa URL.
 * Chép tay 2 lần là mở đường cho 2 nơi lệch nhau dần (đổi icon/nhãn một chỗ quên chỗ kia) —
 * lỗi mà chính chú thích cũ đã cảnh báo bằng lời nhưng chưa gói lại thành code dùng chung.
 *
 * 🔴 CHỈ NHẬN `duongDan` — component không tự biết đề nghị nào, không đụng kho dữ liệu, để
 * dùng được ở BẤT KỲ đâu có "đường dẫn trang đầy đủ" (kể cả không phải đề nghị mua hàng).
 *
 * 📌 PHẢI ĐẶT TRONG MỘT `<DropdownMenuGroup>` CÓ SẴN — component này chỉ trả về các
 * `DropdownMenuItem`, không tự bọc `Group`/`Content`/`Trigger` (đúng luật base-nova: Item phải
 * nằm trong Group, thiếu là crash cả trang — nơi gọi tự lo phần khung).
 */
export function MucMenuXemDayDu({ duongDan }: { duongDan: string }) {
  const router = useRouter();
  return (
    <>
      <DropdownMenuItem onClick={() => router.push(duongDan)}>
        <Maximize2 className="size-4 shrink-0" aria-hidden />
        Xem toàn màn hình
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => window.open(duongDan, "_blank", "noopener")}>
        <ExternalLink className="size-4 shrink-0" aria-hidden />
        Xem trong tab mới
      </DropdownMenuItem>
    </>
  );
}
