"use client";

import { createContext } from "react";
import type { KhoId } from "@/3-du-lieu/kho-id";

/**
 * KHO ĐANG ĐƯỢC XEM, khi nó KHÁC với kho suy ra từ địa chỉ trang — Sếp duyệt demo EQUI v2 14/10/2026.
 *
 * Ba màn dùng chung cho cả công ty (Theo dõi đơn hàng, Theo dõi đề nghị, Công nợ) nằm ở địa chỉ KHÔNG có
 * `/equi`, nhưng có nút lọc EQUI: bấm vào thì chính màn đó vẽ dữ liệu của kho EQUI (qua một
 * `DuLieuProvider kho="equi"` lồng bên trong — xem `vo-loc-kho.tsx`). Lúc ấy địa chỉ vẫn là `/don-hang`,
 * nên `useKhoHienTai` (`lien-ket-kho.tsx`) phải ưu tiên giá trị này thì link trong màn mới dẫn tới
 * `/equi/don-hang/…` chứ không về kho thường.
 *
 * `null` (mặc định) = không ghi đè, suy theo địa chỉ như trước.
 */
export const KhoNguCanh = createContext<KhoId | null>(null);
