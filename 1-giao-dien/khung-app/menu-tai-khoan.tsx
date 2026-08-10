"use client";

import { useState } from "react";
import { LogOut, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/1-giao-dien/nen-tang-ui/dropdown-menu";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { NHAN_CAP_QUYEN } from "@/4-phan-quyen/quyen";

/** Chữ viết tắt trên avatar, vd "Nguyễn Văn A" → "NA". */
function vietTat(ten: string): string {
  const phan = ten.trim().split(/\s+/);
  const raw = phan.length === 1 ? phan[0].slice(0, 2) : `${phan[0][0]}${phan[phan.length - 1][0]}`;
  return raw.toUpperCase();
}

/**
 * MENU TÀI KHOẢN TRÊN THANH TRÊN — đúng Design System V1.1.
 *
 * 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 10/08/2026: *"đưa lại về theo file system v1.1"*.
 *
 * V1.1 Phần C quy định rõ:
 *   · Header 60px — CHỈ chức năng phụ: **tìm kiếm, thông báo, ngày giờ, tài khoản**
 *   · Sidebar 260px — chịu trách nhiệm **điều hướng TOÀN BỘ** hệ thống
 *
 * Nên tài khoản thuộc THANH TRÊN, còn thanh bên chỉ để điều hướng. Ngày 08/08/2026 khối này
 * từng được dời sang thanh bên cho "luôn hiển thị"; nay trả về đúng chuẩn.
 *
 * ⚠️ Nền thanh trên là màu SÁNG (`bg-surface`) nên chữ dùng token `text-text-*`, KHÔNG dùng
 * `text-nav-foreground*` như hồi ở thanh bên — token đó dành cho nền tối #4B4F55.
 */
export function MenuTaiKhoan() {
  const { nguoiDung, quyen, dangXuat } = useNguoiDung();
  const { deNghi, xoaDuLieuChayThu } = useDuLieu();
  const [hoiXoa, doiHoiXoa] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="h-9 gap-2 px-1.5"
              aria-label={`Tài khoản ${nguoiDung.tenHienThi}`}
            />
          }
        >
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white"
            aria-hidden
          >
            {vietTat(nguoiDung.tenHienThi)}
          </span>
          {/* Tên chỉ hiện từ Tablet trở lên — thanh trên 60px trên điện thoại đã chật. */}
          <span className="hidden max-w-32 truncate text-sm font-medium text-text-primary md:inline">
            {nguoiDung.tenHienThi}
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-text-primary">
                {nguoiDung.tenHienThi}
              </span>
              <span className="text-xs font-normal text-text-desc">{nguoiDung.chucDanh}</span>
            </span>
          </DropdownMenuLabel>

          <div className="flex flex-wrap items-center gap-1.5 px-2 pb-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-text-secondary">
              {NHAN_CAP_QUYEN[nguoiDung.capTM]}
            </span>
            {/* Trạng thái xem giá có CẢ màu, chữ và biểu tượng khóa — không chỉ dựa vào màu (V1.1). */}
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                quyen.xemGia ? "bg-success-bg text-success-soft" : "bg-danger-bg text-danger-soft"
              }`}
            >
              {quyen.xemGia ? "Xem được giá" : "🔒 Không xem giá"}
            </span>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={dangXuat}>
            <LogOut className="size-4 shrink-0" aria-hidden />
            Đăng xuất
          </DropdownMenuItem>

          {/* 🔴 BỎ CẢ MỤC NÀY khi nối Firestore thật — chỉ có nghĩa ở bản chạy thử. */}
          <DropdownMenuItem onClick={() => doiHoiXoa(true)}>
            <Trash2 className="size-4 shrink-0" aria-hidden />
            Xóa dữ liệu chạy thử
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <HopXacNhan
        mo={hoiXoa}
        tieuDe="Xóa toàn bộ dữ liệu chạy thử?"
        moTa="Xóa mọi đề nghị, báo giá, đơn đặt hàng và phiếu nhận hàng đã nhập trên máy này."
        canhBao={`Đang có ${deNghi.length} đề nghị mua hàng. Không khôi phục lại được — app sẽ về trạng thái trống như lần mở đầu tiên.`}
        nhanDongY="Xóa hết"
        nguyHiem
        onDong={() => doiHoiXoa(false)}
        onDongY={xoaDuLieuChayThu}
      />
    </>
  );
}
