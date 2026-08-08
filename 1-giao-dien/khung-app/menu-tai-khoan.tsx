"use client";

import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/1-giao-dien/nen-tang-ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/1-giao-dien/nen-tang-ui/dropdown-menu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { NHAN_CAP_QUYEN } from "@/4-phan-quyen/quyen";

/** Chữ viết tắt trên avatar, vd "Nguyễn Văn A" → "NA". */
function vietTat(ten: string): string {
  const phan = ten.trim().split(/\s+/);
  const raw = phan.length === 1 ? phan[0].slice(0, 2) : `${phan[0][0]}${phan[phan.length - 1][0]}`;
  return raw.toUpperCase();
}

export function AccountMenu() {
  const { nguoiDung, quyen, cheDoThu, dangXuat } = useNguoiDung();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Tài khoản"
            className="flex h-11 min-w-11 items-center gap-2 rounded-lg px-1.5 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none xl:h-10"
          />
        }
      >
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="bg-primary-bg text-xs font-bold text-primary">
            {vietTat(nguoiDung.tenHienThi)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden flex-col items-start justify-center text-left leading-snug md:flex">
          <span className="max-w-[160px] truncate text-xs font-semibold text-text-primary xl:max-w-[220px]">
            {nguoiDung.tenHienThi}
          </span>
          <span className="max-w-[160px] truncate text-[11px] text-text-desc xl:max-w-[220px]">
            {nguoiDung.chucDanh}
          </span>
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-text-primary">{nguoiDung.tenHienThi}</span>
            <span className="text-xs text-text-desc">
              {nguoiDung.chucDanh} · {nguoiDung.phongBan}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="flex flex-col gap-1 px-2 py-1.5 text-xs text-text-desc">
            <span>
              Quyền app Thu mua: <strong className="text-text-secondary">{NHAN_CAP_QUYEN[nguoiDung.capTM]}</strong>
            </span>
            <span>
              Xem giá:{" "}
              <strong className={quyen.xemGia ? "text-success-soft" : "text-danger-soft"}>
                {quyen.xemGia ? "Được phép" : "🔒 Bị chặn"}
              </strong>
            </span>
            {cheDoThu && (
              <span className="mt-1 border-t border-border pt-1 text-[11px]">
                Chế độ chạy thử — dữ liệu mẫu, chưa nối Firebase
              </span>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={dangXuat} className="text-danger">
            <LogOut className="size-4" aria-hidden />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
