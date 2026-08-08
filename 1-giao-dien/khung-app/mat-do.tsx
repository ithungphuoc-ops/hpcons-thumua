"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type MatDo = "thoang" | "vua" | "gon";

/**
 * ✅ ĐÃ CHỐT 05/08/2026 (Ban lãnh đạo): mật độ **Vừa** là mặc định của app.
 * Đề nghị bổ sung mức này vào Design System — xem
 * `../../2. THIET KE/03-DE-XUAT-BO-SUNG-MAT-DO-V1.1.md`.
 * Không đổi giá trị này mà không có chỉ đạo mới.
 */
export const MAT_DO_MAC_DINH: MatDo = "vua";

export const MO_TA_MAT_DO: Record<MatDo, { nhan: string; moTa: string; ghiChu?: string }> = {
  thoang: {
    nhan: "Thoáng",
    moTa: "Lề 24px · khu vực 24px · đệm thẻ 16px · đệm dòng 12px",
    ghiChu: "V1.1 gốc",
  },
  vua: {
    nhan: "Vừa",
    moTa: "Lề 16px · khu vực 16px · đệm thẻ 12px · đệm dòng 10px",
    ghiChu: "đã chốt",
  },
  gon: {
    nhan: "Gọn",
    moTa: "Lề 12px · khu vực 12px · đệm thẻ 8px · đệm dòng 8px",
    ghiChu: "tùy chọn cá nhân",
  },
};

interface GiaTriMatDo {
  matDo: MatDo;
  doiMatDo: (m: MatDo) => void;
}

const Context = createContext<GiaTriMatDo | null>(null);

const KHOA_LUU = "hpcons-thumua-matdo";

/**
 * Mật độ hiển thị — đặt thuộc tính `data-matdo` trên <html>, các biến CSS trong
 * globals.css tự đổi theo. Lưu vào localStorage để giữ lựa chọn của người dùng.
 *
 * Vì giá trị thật nằm ở localStorage (máy chủ không biết trước), <html> được
 * render sẵn bằng MAT_DO_MAC_DINH rồi cập nhật sau khi gắn — tránh lệch nội dung
 * giữa HTML dựng sẵn và trình duyệt.
 */
export function MatDoProvider({ children }: { children: ReactNode }) {
  const [matDo, setMatDo] = useState<MatDo>(MAT_DO_MAC_DINH);

  useEffect(() => {
    const luu = window.localStorage.getItem(KHOA_LUU) as MatDo | null;
    if (luu && luu in MO_TA_MAT_DO) setMatDo(luu);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-matdo", matDo);
  }, [matDo]);

  const doiMatDo = useCallback((m: MatDo) => {
    setMatDo(m);
    window.localStorage.setItem(KHOA_LUU, m);
  }, []);

  const value = useMemo(() => ({ matDo, doiMatDo }), [matDo, doiMatDo]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useMatDo(): GiaTriMatDo {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useMatDo phải nằm trong <MatDoProvider>.");
  return ctx;
}
