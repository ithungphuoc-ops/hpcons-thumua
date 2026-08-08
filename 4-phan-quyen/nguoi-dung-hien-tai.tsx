"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  VAI_TRO_MAC_DINH,
  VAI_TRO_MAU,
  tinhQuyen,
  type NguoiDung,
  type Quyen,
} from "@/4-phan-quyen/quyen";

interface GiaTriNguoiDung {
  nguoiDung: NguoiDung;
  quyen: Quyen;
  /** Đổi vai trò — chỉ có tác dụng ở chế độ chạy thử (chưa nối Firebase Auth). */
  doiVaiTro: (uid: string) => void;
  /** true khi đang chạy bằng vai trò mẫu. */
  cheDoThu: boolean;
}

const Context = createContext<GiaTriNguoiDung | null>(null);

/**
 * Chế độ chạy thử: chưa nối Firebase Auth nên dùng vai trò mẫu, đổi được trên Header
 * để xem app dưới góc nhìn từng phòng ban (đặc biệt để kiểm chứng thủ kho và Phòng
 * thi công KHÔNG thấy giá).
 *
 * Khi nối Firebase thật: đọc `users/{uid}` + custom claims `apps.tm` từ project
 * `hpcons-portal`, thay phần dữ liệu mẫu bên dưới, giao diện không phải sửa.
 */
export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [uid, setUid] = useState(VAI_TRO_MAC_DINH.uid);

  const value = useMemo<GiaTriNguoiDung>(() => {
    const nguoiDung = VAI_TRO_MAU.find((v) => v.uid === uid) ?? VAI_TRO_MAC_DINH;
    return { nguoiDung, quyen: tinhQuyen(nguoiDung), doiVaiTro: setUid, cheDoThu: true };
  }, [uid]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useNguoiDung(): GiaTriNguoiDung {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useNguoiDung phải nằm trong <CurrentUserProvider>.");
  return ctx;
}
