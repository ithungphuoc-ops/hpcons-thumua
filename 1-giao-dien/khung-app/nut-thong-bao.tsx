"use client";

import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { toast } from "sonner";
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
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { NHAN_GIAI_DOAN, type GiaiDoanMuaHang } from "@/2-quy-trinh/giai-doan-mua-hang";

const nhanBuoc = (ma?: string) =>
  ma ? (NHAN_GIAI_DOAN[ma as GiaiDoanMuaHang]?.nhan ?? ma) : "";

const gioPhut = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

/**
 * 🔔 CHUÔNG THÔNG BÁO CHUYỂN BƯỚC — sinh tự động khi một đề nghị đổi bước trên
 * bảng quy trình (kéo thả hay nghiệp vụ đều bắt được). Mỗi thông báo có nút
 * "Nhận công tác" để người phụ trách bước mới xác nhận tiếp quản — nhận xong
 * ghi cả vào nhật ký "Lịch sử" của đề nghị.
 * Mở chuông là toàn bộ thông báo được tính đã đọc.
 */
export function NutThongBao() {
  const router = useRouter();
  const { thongBao, danhDauDaDocThongBao, nhanCongTac } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  const chuaDoc = thongBao.filter((t) => !t.daDoc).length;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) danhDauDaDocThongBao();
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={chuaDoc > 0 ? `Thông báo — ${chuaDoc} chưa đọc` : "Thông báo"}
          />
        }
      >
        <Bell className="size-5" />
        {chuaDoc > 0 && (
          <span
            aria-hidden
            className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
          >
            {chuaDoc > 9 ? "9+" : chuaDoc}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 max-w-[92vw]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span>Thông báo chuyển bước</span>
            <span className="text-[11px] font-normal text-text-desc">
              Đề nghị đổi bước trên bảng quy trình là báo ở đây — bấm &quot;Nhận công tác&quot; để tiếp quản
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {thongBao.length === 0 ? (
            <p className="px-2 py-5 text-center text-xs text-text-desc">
              Chưa có thông báo nào. Kéo một thẻ trên bảng quy trình sang bước kế tiếp để thử.
            </p>
          ) : (
            thongBao.slice(0, 8).map((tb) => (
              <DropdownMenuItem
                key={tb.id}
                onClick={() => router.push(`/de-nghi/${tb.prId}`)}
                className="items-start"
              >
                <div className="flex w-full flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-primary">{tb.prCode}</span>
                    <span className="shrink-0 text-[11px] text-text-desc">{gioPhut(tb.thoiDiem)}</span>
                  </div>
                  <span className="text-xs text-text-primary">
                    {tb.tuBuoc
                      ? `${nhanBuoc(tb.tuBuoc)} → ${nhanBuoc(tb.denBuoc)}`
                      : `Đề nghị mới vào bước "${nhanBuoc(tb.denBuoc)}"`}
                  </span>
                  {tb.guiToi.length > 0 && (
                    <span className="text-[11px] text-text-desc">Gửi tới: {tb.guiToi.join(" · ")}</span>
                  )}
                  {tb.tiepNhan ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success-soft">
                      <Check className="size-3.5 shrink-0" aria-hidden />
                      {tb.tiepNhan.ten} đã nhận công tác lúc {gioPhut(tb.tiepNhan.thoiDiem)}
                    </span>
                  ) : quyen.lapPO ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="self-start"
                      onClick={(e) => {
                        e.stopPropagation();
                        nhanCongTac(tb.id, { uid: nguoiDung.uid, ten: nguoiDung.tenHienThi });
                        toast.success("Đã nhận công tác", {
                          description: `${tb.prCode} — bước "${nhanBuoc(tb.denBuoc)}"`,
                        });
                      }}
                    >
                      Nhận công tác
                    </Button>
                  ) : (
                    <span className="text-[11px] font-medium text-warning-soft">Chờ tiếp nhận</span>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
