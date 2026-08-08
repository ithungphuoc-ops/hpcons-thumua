"use client";

import { UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/1-giao-dien/nen-tang-ui/dropdown-menu";
import { Badge } from "@/1-giao-dien/nen-tang-ui/badge";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { VAI_TRO_MAU } from "@/4-phan-quyen/quyen";

/**
 * Nút đổi vai trò — CHỈ có ở chế độ chạy thử (chưa nối Firebase Auth).
 * Dùng để kiểm chứng phân quyền, đặc biệt: thủ kho và Phòng thi công KHÔNG thấy giá.
 */
export function VaiTroSwitcher() {
  const { nguoiDung, doiVaiTro, cheDoThu } = useNguoiDung();

  if (!cheDoThu) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Đổi vai trò thử nghiệm"
            className="flex h-11 min-w-11 items-center gap-2 rounded-lg border border-primary/30 bg-primary-bg px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 xl:h-10"
          />
        }
      >
        <UserCheck className="size-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">
          Vai trò: <strong className="font-semibold">{nguoiDung.tenHienThi}</strong>
        </span>
        <Badge variant="outline" className="border-primary/40 text-[10px] text-primary">
          tm{nguoiDung.capTM}
        </Badge>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span>Chạy thử theo vai trò</span>
            <span className="text-[11px] font-normal text-text-desc">
              Cấp quyền theo chuẩn App Tổng: 1 Xem · 2 Nhập liệu · 3 Quản lý · 4 Quản trị
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {VAI_TRO_MAU.map((v) => (
            <DropdownMenuItem
              key={v.uid}
              onClick={() => doiVaiTro(v.uid)}
              className={v.uid === nguoiDung.uid ? "bg-accent font-medium text-primary" : ""}
            >
              <div className="flex w-full flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{v.tenHienThi}</span>
                  <span className="text-xs text-text-desc">tm{v.capTM}</span>
                </div>
                <span className="text-xs text-text-desc">{v.chucDanh}</span>
                <span className="text-[11px] text-text-desc italic">{v.moTa}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
