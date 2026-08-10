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
    <div className="px-3 pb-3">
      {/* GỘP TẤT CẢ VÀO MỘT THẺ (chỉ đạo Ban lãnh đạo 10/08/2026): trước đây cấp quyền,
          trạng thái xem giá và nút Đăng xuất nằm rời bên ngoài, trông lộn xộn và không
          rõ chúng thuộc về ai. */}
      <div className="flex flex-col gap-2 rounded-lg bg-white/5 p-2.5">
        <div className="flex items-center gap-2.5">
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
            <span className="truncate text-xs text-nav-foreground-muted">
              {nguoiDung.chucDanh}
            </span>
          </span>
        </div>

        {/* Hai nhãn nhỏ cùng một hàng cho gọn. Trạng thái xem giá có cả biểu tượng khóa
            và chữ, không chỉ dựa vào màu (V1.1). */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-nav-foreground-muted">
            {NHAN_CAP_QUYEN[nguoiDung.capTM]}
          </span>
          {/* ⚠️ CHỮ TRẮNG, KHÔNG dùng `text-success-soft` / `text-danger-soft`:
              hai token đó là biến thể dành cho NỀN SÁNG (đo được #3A742B — xanh đậm),
              đặt lên nền thanh bên tối #4B4F55 thì chìm nghỉm, gần như không đọc nổi.
              Vẫn phân biệt được bằng cả màu nền LẪN chữ + biểu tượng khóa (V1.1). */}
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium text-white ${
              quyen.xemGia ? "bg-success/70" : "bg-danger/70"
            }`}
          >
            {quyen.xemGia ? "Xem được giá" : "🔒 Không xem giá"}
          </span>
        </div>

        <button
          type="button"
          onClick={dangXuat}
          className="flex min-h-9 items-center justify-center gap-2 rounded-lg border border-white/15 text-xs font-medium text-nav-foreground-muted transition-colors hover:bg-nav-hover hover:text-nav-foreground"
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
