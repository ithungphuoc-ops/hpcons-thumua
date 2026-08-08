"use client";

import { Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/1-giao-dien/nen-tang-ui/dropdown-menu";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { MAU_MAC_DINH, MO_TA_MAU, useMauChuDao, type MauChuDao } from "@/1-giao-dien/khung-app/mau-chu-dao";

const THU_TU: MauChuDao[] = ["xanh-duong", "xanh-ngoc", "xanh-la", "tim", "cam-dat"];

/**
 * Chọn màu chủ đạo của theme — đổi màu là toàn bộ nút bấm, badge, sidebar active
 * đổi theo (cả Light + Dark) vì mọi tông phái sinh đều tính từ một token.
 * Mặc định là Xanh dương #096AA7 đúng chuẩn V1.1; các màu khác là tùy chọn cá nhân.
 */
export function MauChuDaoSwitcher() {
  const { mau, doiMau } = useMauChuDao();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="Chọn màu chủ đạo" />}
      >
        <Palette className="size-5" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span>Màu chủ đạo</span>
            <span className="text-[11px] font-normal text-text-desc">
              Chuẩn V1.1 là <strong className="font-semibold">Xanh dương</strong>; màu khác là tùy chọn cá nhân
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {THU_TU.map((m) => {
            const dangDung = m === mau;
            const laChuan = m === MAU_MAC_DINH;
            return (
              <DropdownMenuItem
                key={m}
                onClick={() => doiMau(m)}
                className={dangDung ? "bg-accent font-medium text-primary" : ""}
              >
                <div className="flex w-full items-center gap-2">
                  <span className={`size-4 shrink-0 rounded-full ${MO_TA_MAU[m].lopCham}`} aria-hidden />
                  <span className="text-sm font-medium">{MO_TA_MAU[m].nhan}</span>
                  {laChuan && (
                    <span className="rounded bg-success-bg px-1.5 py-0.5 text-[10px] font-semibold text-success-soft">
                      {MO_TA_MAU[m].ghiChu}
                    </span>
                  )}
                  {dangDung && <span className="ml-auto text-xs text-primary">đang dùng</span>}
                </div>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => doiMau(MAU_MAC_DINH)}>
            <span className="text-xs text-text-secondary">Về lại màu chuẩn (Xanh dương)</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
