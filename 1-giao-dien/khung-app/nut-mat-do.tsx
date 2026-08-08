"use client";

import { Rows3 } from "lucide-react";
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
import { MAT_DO_MAC_DINH, MO_TA_MAT_DO, useMatDo, type MatDo } from "@/1-giao-dien/khung-app/mat-do";

const THU_TU: MatDo[] = ["thoang", "vua", "gon"];

/**
 * Chọn mật độ hiển thị.
 * ✅ Ban lãnh đạo đã chốt 05/08/2026: **Vừa** là mức chuẩn của app (mặc định).
 * Giữ lại hai mức kia làm tùy chọn cá nhân — người dùng đổi thì lưu riêng máy họ,
 * không ảnh hưởng mức chuẩn.
 */
export function MatDoSwitcher() {
  const { matDo, doiMatDo } = useMatDo();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="Chọn mật độ hiển thị" />}
      >
        <Rows3 className="size-5" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span>Mật độ hiển thị</span>
            <span className="text-[11px] font-normal text-text-desc">
              Chuẩn của app là <strong className="font-semibold">Vừa</strong>; hai mức kia là tùy chọn cá nhân
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {THU_TU.map((m) => {
            const dangDung = m === matDo;
            const laChuan = m === MAT_DO_MAC_DINH;
            return (
              <DropdownMenuItem
                key={m}
                onClick={() => doiMatDo(m)}
                className={dangDung ? "bg-accent font-medium text-primary" : ""}
              >
                <div className="flex w-full flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{MO_TA_MAT_DO[m].nhan}</span>
                    {laChuan && (
                      <span className="rounded bg-success-bg px-1.5 py-0.5 text-[10px] font-semibold text-success-soft">
                        chuẩn app
                      </span>
                    )}
                    {dangDung && <span className="ml-auto text-xs text-primary">đang dùng</span>}
                  </div>
                  <span className="text-[11px] text-text-desc">{MO_TA_MAT_DO[m].moTa}</span>
                </div>
              </DropdownMenuItem>
            );
          })}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => doiMatDo(MAT_DO_MAC_DINH)}>
            <span className="text-xs text-text-secondary">Về lại mức chuẩn (Vừa)</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
