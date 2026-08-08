import type { ReactNode } from "react";
import { AppShell } from "@/1-giao-dien/khung-app/khung-tong";
import { CongBaoVe } from "@/1-giao-dien/khung-app/cong-bao-ve";

/**
 * `CongBaoVe` bọc NGOÀI `AppShell` là cố ý: chưa đăng nhập thì không dựng cả thanh bên
 * lẫn thanh trên, tránh để lộ danh sách chức năng và tên người dùng sau lưng màn đăng nhập.
 */
export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <CongBaoVe>
      <AppShell>{children}</AppShell>
    </CongBaoVe>
  );
}
