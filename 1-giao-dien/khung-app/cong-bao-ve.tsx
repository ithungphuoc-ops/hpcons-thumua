"use client";

import type { ReactNode } from "react";
import { ManDangNhap } from "@/1-giao-dien/khung-app/man-dang-nhap";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";

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
  const { daDangNhap } = useNguoiDung();

  // `null` = chưa đọc xong phiên cũ trong localStorage. Hiện khoảng trắng một nhịp,
  // KHÔNG hiện màn đăng nhập — nếu không thì người đã đăng nhập sẽ thấy nó chớp lên
  // rồi biến mất mỗi lần tải trang, trông như bị đăng xuất.
  if (daDangNhap === null) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }

  if (!daDangNhap) return <ManDangNhap />;

  return <>{children}</>;
}
