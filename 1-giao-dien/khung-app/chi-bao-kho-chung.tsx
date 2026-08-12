"use client";

import { CloudOff } from "lucide-react";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";

/**
 * CHỈ BÁO KHO DỮ LIỆU CHUNG — chỉ hiện khi CÓ VẤN ĐỀ.
 *
 * 🔴 Vì sao chỉ báo lúc hỏng, không báo lúc chạy tốt: nối được là chuyện bình thường, dán
 * thêm một nhãn xanh lên thanh trên 60px chỉ tổ chật. Còn MẤT kết nối là chuyện người dùng
 * **bắt buộc phải biết ngay** — lúc đó việc họ nhập chỉ nằm trên máy họ, cả phòng không ai
 * thấy, mà nhìn giao diện thì không có gì khác. Im lặng ở đây là để người ta làm việc trong
 * ảo tưởng.
 *
 * ⚠️ Trạng thái `dang-noi` KHÔNG báo gì — mở app lần nào cũng đi qua trạng thái đó, báo
 * lên là mỗi lần vào app lại chớp một cảnh báo giả.
 *
 * Nhãn có cả biểu tượng và chữ, không chỉ dựa vào màu (Design System V1.1).
 */
export function ChiBaoKhoChung() {
  const { trangThaiKhoChung } = useDuLieu();

  if (trangThaiKhoChung !== "rieng") return null;

  return (
    // ⚠️ Chữ cho trình đọc màn hình để ở `aria-label`, KHÔNG dùng lớp `sr-only`: `sr-only`
    // là `position:absolute`, đặt trong thanh trên là nó thoát khỏi `overflow-x-hidden` và
    // kéo giãn cả trang trên điện thoại (bài học từ bảng Kanban, CLAUDE.md mục 5).
    <span
      role="status"
      aria-label="Không nối được kho dữ liệu chung, dữ liệu chỉ lưu trên máy này"
      title="Không nối được kho dữ liệu chung. Việc bạn nhập lúc này chỉ lưu trên máy này, người khác không thấy. Kiểm tra lại mạng rồi tải lại trang."
      className="flex items-center gap-1.5 rounded-md bg-warning-bg px-2 py-1 text-xs font-medium text-warning-soft"
    >
      <CloudOff className="size-4 shrink-0" aria-hidden />
      {/* Điện thoại chỉ còn biểu tượng — thanh trên 60px đã chật. */}
      <span className="hidden md:inline">Chưa nối kho chung</span>
    </span>
  );
}
