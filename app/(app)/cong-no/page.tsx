// Bảng chỉ đường — bọc màn bằng nút lọc Thường/EQUI (Sếp duyệt demo EQUI v2 14/10/2026), xem 1-giao-dien/thanh-phan-nghiep-vu/vo-loc-kho.tsx.
"use client";

import { VoLocKho } from "@/1-giao-dien/thanh-phan-nghiep-vu/vo-loc-kho";
import Trang from "@/1-giao-dien/trang/cong-no";

export default function ManHinh() {
  return <VoLocKho Trang={Trang} />;
}
