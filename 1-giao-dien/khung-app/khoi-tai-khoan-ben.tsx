"use client";

import { LogOut } from "lucide-react";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { NHAN_CAP_QUYEN } from "@/4-phan-quyen/quyen";

/** Chữ viết tắt trên avatar, vd "Trần Thị B" → "TB". */
function vietTat(ten: string): string {
  const phan = ten.trim().split(/\s+/);
  const raw = phan.length === 1 ? phan[0].slice(0, 2) : `${phan[0][0]}${phan[phan.length - 1][0]}`;
  return raw.toUpperCase();
}

/**
 * THÔNG TIN NGƯỜI ĐANG ĐĂNG NHẬP — nằm trên THANH BÊN, ngay dưới tên app.
 *
 * Chỉ đạo Ban lãnh đạo 08/08/2026. Trước đây khối này là menu thả xuống trên thanh
 * trên; đưa xuống đây thì tên người dùng và cấp quyền LUÔN HIỂN THỊ, không phải bấm
 * mới thấy — người dùng biết ngay mình đang làm việc với tư cách ai.
 *
 * ⚠️ Nền thanh bên là màu tối (`bg-nav-base` #4B4F55) nên chữ phải dùng token
 * `text-nav-foreground*`, KHÔNG dùng `text-text-primary` như phần thân trang.
 */
export function KhoiTaiKhoanBen() {
  const { nguoiDung, quyen, dangXuat } = useNguoiDung();

  return (
    <div className="flex flex-col gap-2 border-b border-white/10 px-3 pb-3">
      <div className="flex items-center gap-2.5 rounded-lg bg-white/5 p-2">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-nav-foreground"
          aria-hidden
        >
          {vietTat(nguoiDung.tenHienThi)}
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold text-nav-foreground">
            {nguoiDung.tenHienThi}
          </span>
          <span className="truncate text-xs text-nav-foreground-muted">{nguoiDung.chucDanh}</span>
        </span>
      </div>

      <div className="flex flex-col gap-1 px-1 text-[11px] text-nav-foreground-muted">
        <span className="truncate">{NHAN_CAP_QUYEN[nguoiDung.capTM]}</span>
        {/* Trạng thái xem giá có cả biểu tượng khóa và chữ, không chỉ dựa vào màu (V1.1) */}
        <span className="truncate">
          Xem giá:{" "}
          <strong className={quyen.xemGia ? "text-success-soft" : "text-danger-soft"}>
            {quyen.xemGia ? "Được phép" : "🔒 Bị chặn"}
          </strong>
        </span>
      </div>

      <button
        type="button"
        onClick={dangXuat}
        className="flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium text-nav-foreground-muted transition-colors hover:bg-nav-hover hover:text-nav-foreground"
      >
        <LogOut className="size-4 shrink-0" aria-hidden />
        Đăng xuất
      </button>
    </div>
  );
}
