"use client";

// ============================================================
// HỒ SƠ NÀY NGƯỜI ĐANG XEM CÓ ĐƯỢC THẤY KHÔNG — theo ô tick "Xem bước quy trình"
//
// ★ Sếp 07/10/2026: *"Điều chỉnh này thành chức năng phân quyền, và được tick chọn cho xem bước nào"*.
// Hồ sơ đang ở bước người xem không được tick thì KHÔNG hiện ở mọi màn ngoài bảng (Tổng quan · Việc của
// tôi · Lịch · chuông · ô tìm · Phân bổ) và không mở được. Hook này là MỘT chỗ cho các màn đó hỏi.
//
// 📌 LUẬT KHÔNG Ở ĐÂY. Hook chỉ nối dữ liệu: bước của hồ sơ do `boTraGiaiDoanTheoId`
// (`2-quy-trinh/giai-doan-mua-hang.ts`, cùng phép tính với bảng Quy trình) trả lời; được xem hay không do
// `hoSoDuocXemTheoBuoc` / `lyDoKhongXemBuoc` / `poDuocXemTheoBuoc` (`4-phan-quyen/quyen.ts`) quyết.
// Đừng viết điều kiện quyền mới trong tệp này — hai chỗ cùng trả lời một câu là lệch nhau.
//
// 📌 BỘ ĐỆM LƯỜI: chỉ tính bước của hồ sơ ĐƯỢC HỎI, nhớ lại tới khi một trong bốn mảng dữ liệu đổi
// (`useMemo` tạo hàm tra mới = xoá đệm). Lý do: chuông, ô tìm, hộp "Bạn có việc mới" cùng nằm trên thanh
// trên và chạy ở mọi trang. ⚠️ Lợi ích hiệu năng là SUY ĐOÁN, CHƯA ĐO.
//
// ⚠️ CHỈ ẨN HIỂN THỊ, không phải bảo mật dữ liệu — toàn bộ dữ liệu chạy thử vẫn tải về trình duyệt
// (CLAUDE.md §3.6b).
// ============================================================

import { useCallback, useMemo } from "react";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import type { DonDatHang } from "@/3-du-lieu/kieu-du-lieu";
import { boTraGiaiDoanTheoId, type GiaiDoanMuaHang } from "@/2-quy-trinh/giai-doan-mua-hang";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  hoSoDuocXemTheoBuoc,
  lyDoKhongVaoBangQuyTrinh,
  lyDoKhongXemBuoc,
  poDuocXemTheoBuoc,
} from "@/4-phan-quyen/quyen";

export interface XemBuocHoSo {
  /** Bước hồ sơ đang đứng — `undefined` khi mã không có trong kho. */
  giaiDoanCua: (prId: string) => GiaiDoanMuaHang | undefined;
  /** Hồ sơ hiện / mở được không. Hồ sơ không có trong kho → theo `vaoDuocBangQuyTrinh`. */
  duocXemHoSo: (prId: string) => boolean;
  /** `null` = xem được; ngược lại câu lý do (hiện ở màn chặn, liên kết bị khoá…). */
  lyDoKhongXemHoSo: (prId: string) => string | null;
  /**
   * Một đơn hàng có hiện không (Tổng quan · Lịch): PO có `prId` → theo hồ sơ của nó; PO độc lập (chờ đề
   * nghị) → theo ô ④ Lập đơn mua hàng. Luật ở `poDuocXemTheoBuoc` (`quyen.ts`).
   */
  duocXemPO: (po: Pick<DonDatHang, "prId">) => boolean;
}

/**
 * ★ Hỏi "hồ sơ này người đang xem có được thấy không" — theo ô tick "Xem bước quy trình".
 *
 * 📌 Mọi hàm trả về ổn định giữa các lần vẽ cho tới khi dữ liệu hoặc quyền đổi — đặt vào danh sách phụ
 * thuộc của `useMemo` / `useEffect` được.
 * 🔴 Gọi hook này TRƯỚC mọi lệnh `return` sớm của component (quy tắc hook React).
 */
export function useXemBuocHoSo(): XemBuocHoSo {
  const { deNghi, donHang, baoGia, phieuNhan } = useDuLieu();
  const { quyen } = useNguoiDung();

  /* Hàm tra mới mỗi khi một mảng đổi = bộ đệm cũ bị bỏ. */
  const traGiaiDoan = useMemo(
    () => boTraGiaiDoanTheoId(deNghi, donHang, baoGia, phieuNhan),
    [deNghi, donHang, baoGia, phieuNhan],
  );

  const giaiDoanCua = useCallback((prId: string) => traGiaiDoan(prId), [traGiaiDoan]);

  const duocXemHoSo = useCallback(
    (prId: string) => hoSoDuocXemTheoBuoc(quyen, traGiaiDoan(prId)),
    [quyen, traGiaiDoan],
  );

  const lyDoKhongXemHoSo = useCallback(
    (prId: string) => {
      const g = traGiaiDoan(prId);
      return g === undefined ? lyDoKhongVaoBangQuyTrinh(quyen) : lyDoKhongXemBuoc(quyen, g);
    },
    [quyen, traGiaiDoan],
  );

  const duocXemPO = useCallback(
    (po: Pick<DonDatHang, "prId">) => poDuocXemTheoBuoc(quyen, po.prId, duocXemHoSo),
    [quyen, duocXemHoSo],
  );

  return useMemo(
    () => ({ giaiDoanCua, duocXemHoSo, lyDoKhongXemHoSo, duocXemPO }),
    [giaiDoanCua, duocXemHoSo, lyDoKhongXemHoSo, duocXemPO],
  );
}
