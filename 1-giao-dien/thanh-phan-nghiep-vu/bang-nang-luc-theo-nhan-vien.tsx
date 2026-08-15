"use client";

import { useMemo } from "react";
import { UserRound } from "lucide-react";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import {
  NHAN_GIAI_DOAN,
  giaiDoanDaKetThuc,
  hanXuLyDeNghi,
  xacDinhGiaiDoan,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import type {
  BaoGia,
  DeNghiMuaHang,
  DonDatHang,
  PhieuNhanHang,
} from "@/3-du-lieu/kieu-du-lieu";

/**
 * TỔNG HỢP CÔNG VIỆC THEO NHÂN VIÊN — trong một nhóm đề xuất (phiếu gốc + các phiếu con).
 *
 * 🔴 Ban lãnh đạo 15/08/2026: *"[phiếu] sẽ được tách thành công việc con, sau này tổng hợp
 * lại được các quy trình đó để cấp trưởng phòng có thể đánh giá năng lực nhân viên"*.
 *
 * Tách phiếu để chia việc chỉ có ích khi gom lại xem được: ai đang giữ phần nào, đi tới đâu,
 * có ai đang trễ. Không có bảng này thì trưởng bộ phận phải mở từng phiếu con một.
 *
 * ⚠️ ĐÂY LÀ SỐ LIỆU TRONG MỘT NHÓM ĐỀ XUẤT, không phải bảng đánh giá năng lực cả năm. Nhìn
 * một nhóm mà kết luận năng lực là oan cho người nhận phải phần việc khó (vật tư hiếm, nhà
 * cung cấp hay chậm). Chú thích dưới bảng nói thẳng điều đó với người xem.
 *
 * 📌 Đếm theo NGƯỜI PHỤ TRÁCH TỪNG DÒNG VẬT TƯ, không theo phiếu: một phiếu con có thể chia
 * cho hai người, tính cả phiếu cho mỗi người là thổi phồng số liệu.
 */
export function BangNangLucTheoNhanVien({
  nhom,
  donHang,
  baoGia,
  phieuNhan,
}: {
  /** Phiếu gốc + toàn bộ phiếu con đã tách ra từ nó. */
  nhom: DeNghiMuaHang[];
  donHang: DonDatHang[];
  baoGia: BaoGia[];
  phieuNhan: PhieuNhanHang[];
}) {
  const dong = useMemo(() => {
    /** uid → số liệu gom được. */
    const theoNguoi = new Map<
      string,
      {
        ten: string;
        soPhieu: number;
        soDong: number;
        soXong: number;
        soQuaHan: number;
        buocDangLam: string[];
      }
    >();

    for (const dn of nhom) {
      const giaiDoan = xacDinhGiaiDoan(dn, donHang, baoGia, phieuNhan);
      const xong = giaiDoanDaKetThuc(giaiDoan);
      const han = hanXuLyDeNghi(dn, giaiDoan);

      // Người phụ trách trong phiếu này, mỗi người tính MỘT lần dù giữ nhiều dòng.
      const trongPhieu = new Map<string, { ten: string; soDong: number }>();
      for (const d of dn.items) {
        if (!d.nguoiPhuTrachUid) continue;
        const cu = trongPhieu.get(d.nguoiPhuTrachUid);
        trongPhieu.set(d.nguoiPhuTrachUid, {
          ten: d.nguoiPhuTrachTen ?? d.nguoiPhuTrachUid,
          soDong: (cu?.soDong ?? 0) + 1,
        });
      }

      for (const [uid, x] of trongPhieu) {
        const cu = theoNguoi.get(uid) ?? {
          ten: x.ten,
          soPhieu: 0,
          soDong: 0,
          soXong: 0,
          soQuaHan: 0,
          buocDangLam: [] as string[],
        };
        cu.soPhieu += 1;
        cu.soDong += x.soDong;
        if (xong) cu.soXong += 1;
        else {
          if (han.quaHan) cu.soQuaHan += 1;
          const nhan = NHAN_GIAI_DOAN[giaiDoan]?.nhan ?? giaiDoan;
          if (!cu.buocDangLam.includes(nhan)) cu.buocDangLam.push(nhan);
        }
        theoNguoi.set(uid, cu);
      }
    }

    // Ai còn việc quá hạn lên trước — đó là thứ trưởng bộ phận cần xử lý ngay.
    return [...theoNguoi.values()].sort(
      (a, b) => b.soQuaHan - a.soQuaHan || b.soPhieu - a.soPhieu,
    );
  }, [nhom, donHang, baoGia, phieuNhan]);

  // Chưa giao ai thì không hiện bảng rỗng — thêm khung trống chỉ làm trang dài ra.
  if (dong.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <UserRound className="size-4 shrink-0 text-primary" aria-hidden />
        Ai đang làm phần nào
      </p>

      <ul className="flex flex-col gap-1.5">
        {dong.map((n) => (
          <li
            key={n.ten}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-border bg-card px-3 py-2"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-text-primary">{n.ten}</span>
              <span className="text-xs text-text-desc">
                {n.soPhieu} phiếu · {n.soDong} dòng vật tư
                {n.buocDangLam.length > 0 && ` · đang ở: ${n.buocDangLam.join(", ")}`}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              {n.soXong > 0 && <StatusBadge label={`Xong ${n.soXong}`} tone="success" />}
              {/* Quá hạn luôn có CẢ MÀU LẪN CHỮ (Design System V1.1) — không dùng mỗi màu đỏ. */}
              {n.soQuaHan > 0 && <StatusBadge label={`Quá hạn ${n.soQuaHan}`} tone="danger" />}
              {n.soXong === 0 && n.soQuaHan === 0 && (
                <StatusBadge label="Đang làm" tone="primary" />
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* 🔴 Nói rõ giới hạn của con số. Bảng này dễ bị đọc thành "bảng xếp hạng nhân viên",
          trong khi nó chỉ đếm việc trong MỘT nhóm đề xuất. */}
      <p className="text-xs text-text-desc">
        Số liệu của riêng nhóm đề xuất này, chưa tính độ khó từng phần việc — dùng để biết ai
        đang giữ phần nào và ai cần hỗ trợ, không phải bảng xếp hạng.
      </p>
    </div>
  );
}
