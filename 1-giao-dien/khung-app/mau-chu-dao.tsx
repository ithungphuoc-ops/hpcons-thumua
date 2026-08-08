"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type MauChuDao = "xanh-duong" | "xanh-ngoc" | "xanh-la" | "tim" | "cam-dat";

/**
 * ⚠️ V1.1 quy định primary cố định #096AA7 — nên mặc định LUÔN là "xanh-duong".
 * Các màu khác là tùy chọn cá nhân (giống 3 mức mật độ), lưu riêng máy người dùng.
 * Muốn đổi chuẩn chung phải trình Design System, không đổi giá trị này.
 */
export const MAU_MAC_DINH: MauChuDao = "xanh-duong";

export const MO_TA_MAU: Record<MauChuDao, { nhan: string; lopCham: string; ghiChu?: string }> = {
  "xanh-duong": { nhan: "Xanh dương", lopCham: "bg-mau-xanh-duong", ghiChu: "chuẩn V1.1" },
  "xanh-ngoc": { nhan: "Xanh ngọc", lopCham: "bg-mau-xanh-ngoc" },
  "xanh-la": { nhan: "Xanh lá", lopCham: "bg-mau-xanh-la" },
  tim: { nhan: "Tím", lopCham: "bg-mau-tim" },
  "cam-dat": { nhan: "Cam đất", lopCham: "bg-mau-cam-dat" },
};

interface GiaTriMau {
  mau: MauChuDao;
  doiMau: (m: MauChuDao) => void;
}

const Context = createContext<GiaTriMau | null>(null);

const KHOA_LUU = "hpcons-thumua-mau";

/**
 * Màu chủ đạo — đặt thuộc tính `data-mau` trên <html>, biến `--hp-primary` trong
 * globals.css đổi theo; mọi tông phái sinh (nút, badge, sidebar active, ring...)
 * đều color-mix từ biến đó nên đổi một chỗ là đổi cả app, cả Light lẫn Dark.
 * Cách lưu và cách gắn thuộc tính giống hệt MatDoProvider.
 */
export function MauChuDaoProvider({ children }: { children: ReactNode }) {
  const [mau, setMau] = useState<MauChuDao>(MAU_MAC_DINH);

  useEffect(() => {
    const luu = window.localStorage.getItem(KHOA_LUU) as MauChuDao | null;
    if (luu && luu in MO_TA_MAU) setMau(luu);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-mau", mau);
  }, [mau]);

  const doiMau = useCallback((m: MauChuDao) => {
    setMau(m);
    window.localStorage.setItem(KHOA_LUU, m);
  }, []);

  const value = useMemo(() => ({ mau, doiMau }), [mau, doiMau]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useMauChuDao(): GiaTriMau {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useMauChuDao phải nằm trong <MauChuDaoProvider>.");
  return ctx;
}
