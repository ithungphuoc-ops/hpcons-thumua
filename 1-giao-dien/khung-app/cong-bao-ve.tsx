"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { ManDangNhap } from "@/1-giao-dien/khung-app/man-dang-nhap";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { duocVaoDuongDan } from "@/4-phan-quyen/quyen";

/**
 * CỔNG BẢO VỆ — chưa đăng nhập thì không thấy gì trong app.
 *
 * Bọc NGOÀI `AppShell` (xem `app/(app)/layout.tsx`) chứ không bọc trong: nếu bọc trong
 * thì thanh bên và thanh trên vẫn hiện ra sau lưng màn đăng nhập, để lộ danh sách chức
 * năng và tên người dùng.
 *
 * ⚠️ Đây là chặn Ở GIAO DIỆN. Trang được sinh sẵn dạng tĩnh nên mã HTML/JS vẫn tải về
 * máy người dùng — chặn thật phải nằm ở tầng dữ liệu (Firestore Security Rules).
 * Xem `5-ket-noi/firestore.rules` và ghi chú ở `4-phan-quyen/nguoi-dung-hien-tai.tsx`.
 */
export function CongBaoVe({ children }: { children: ReactNode }) {
  const { daDangNhap, quyen } = useNguoiDung();
  const duongDan = usePathname();

  // `null` = chưa đọc xong phiên cũ trong localStorage. Hiện khoảng trắng một nhịp,
  // KHÔNG hiện màn đăng nhập — nếu không thì người đã đăng nhập sẽ thấy nó chớp lên
  // rồi biến mất mỗi lần tải trang, trông như bị đăng xuất.
  if (daDangNhap === null) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }

  if (!daDangNhap) return <ManDangNhap />;

  /**
   * ★ CHẶN THEO TRANG — Ban lãnh đạo 16/08/2026: thủ kho và các phòng ban khác không được vào
   * màn "Quy trình mua hàng".
   *
   * 🔴 ẨN MỤC MENU KHÔNG PHẢI LÀ CHẶN. Địa chỉ `/de-nghi` gõ thẳng vào thanh địa chỉ vẫn vào
   * được, và người từng có quyền còn nguyên trong lịch sử trình duyệt. Đặt ở đây — nơi bọc
   * ngoài MỌI trang — thì mọi đường vào đều bị chặn như nhau.
   *
   * ⚠️ Đây vẫn là chặn Ở GIAO DIỆN, giống cảnh báo ở đầu file: trang sinh sẵn dạng tĩnh nên mã
   * vẫn tải về máy. Chặn thật nằm ở Firestore Security Rules.
   *
   * 📌 Luật ở `4-phan-quyen/quyen.ts` → `duocVaoDuongDan`, MỘT CHỖ DUY NHẤT — hàm đó trước đây
   * viết ra rồi không ai gọi, nên luật chặn nằm im trong khi màn hình vẫn mở.
   */
  if (duongDan && !duocVaoDuongDan(duongDan, quyen)) {
    return (
      <div className="min-h-screen bg-background p-(--hp-md-section)">
        <EmptyState
          icon={Lock}
          title="Bạn không có quyền vào mục này"
          description="Tài khoản của bạn không được mở màn hình này. Theo dõi tiến độ hồ sơ ở mục “Theo dõi đề nghị”."
        />
      </div>
    );
  }

  return <>{children}</>;
}
