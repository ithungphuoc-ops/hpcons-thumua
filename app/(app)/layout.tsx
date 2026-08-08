import type { ReactNode } from "react";
import { AppShell } from "@/1-giao-dien/khung-app/khung-tong";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
