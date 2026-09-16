"use client";

import { useEffect, useState } from "react";
import { CircleUser, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { DanhSachTruong } from "@/1-giao-dien/thanh-phan-dung-chung/danh-sach-truong";
import {
  layHoSoNhanSu,
  TEN_APP_CON,
  type HoSoNhanSu,
} from "@/5-ket-noi/ho-so-nhan-su";
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
  /**
   * `cheDoThu` = đang chạy bằng **tài khoản mẫu viết trong mã nguồn**, không phải Firebase Auth.
   *
   * 🔴 Ban lãnh đạo 20/08/2026: *"a đang dùng tk thật sao ở đây vẫn đang hiện tài khoản giả lập"*.
   * Hai chỗ trong menu này nói "bản chạy thử" **vô điều kiện**, nên người đăng nhập bằng tài
   * khoản thật vẫn bị app bảo là tài khoản giả lập. Nay hỏi đúng cờ này trước khi nói.
   */
  const { nguoiDung, quyen, dangXuat, cheDoThu } = useNguoiDung();

  /**
   * HỒ SƠ CÁ NHÂN TỪ APP TỔNG (chỉ đạo Ban lãnh đạo 10/08/2026: *"bấm vào avatar này sẽ ra
   * các thông tin cá nhân"*).
   *
   * Cờ mở và dữ liệu tách riêng: hồ sơ đọc BẤT ĐỒNG BỘ (khi nối Firebase là một chuyến mạng
   * thật), đóng hộp giữa chừng thì dữ liệu về sau vẫn không mở lại hộp.
   */
  const [moHoSo, doiMoHoSo] = useState(false);
  const [hoSo, setHoSo] = useState<HoSoNhanSu | null>(null);

  useEffect(() => {
    if (!moHoSo) return;
    let conHieuLuc = true;
    void layHoSoNhanSu(nguoiDung.uid).then((h) => {
      // Chặn ghi state sau khi đổi người đăng nhập / đóng hộp — tránh hiện hồ sơ người cũ.
      if (conHieuLuc) setHoSo(h);
    });
    return () => {
      conHieuLuc = false;
    };
  }, [moHoSo, nguoiDung.uid]);

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
          {/* ⚠️ base-nova bắt buộc Label/Item nằm trong Group — thiếu là
              "MenuGroupContext is missing" và crash cả trang khi mở menu. */}
          <DropdownMenuGroup>
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

          {/* Hồ sơ đầy đủ từ App Tổng — xem `5-ket-noi/ho-so-nhan-su.ts`. */}
          <DropdownMenuItem onClick={() => doiMoHoSo(true)}>
            <CircleUser className="size-4 shrink-0" aria-hidden />
            Thông tin cá nhân
          </DropdownMenuItem>

          <DropdownMenuItem onClick={dangXuat}>
            <LogOut className="size-4 shrink-0" aria-hidden />
            Đăng xuất
          </DropdownMenuItem>

          {/**
           * ❌❌ MỤC "Xóa toàn bộ dữ liệu" ĐÃ DỜI KHỎI ĐÂY — Sếp 16/09/2026: ***"Ẩn nút này ở mục
           * này, đưa vào mục cài đặt quy trình. Và chức năng này chỉ hiện ở tài khoản cấp quản
           * trị"***.
           *
           * 🔴 VÌ SAO CHỖ NÀY NGUY: mục xoá từng nằm **ngay dưới "Đăng xuất"** — một mục người ta
           * bấm hàng ngày, một mục xoá sạch dữ liệu cả phòng không khôi phục được, cách nhau đúng
           * một dòng. Bấm trượt là mất hết.
           *
           * ✅ KHÔNG MỒ CÔI CHỨC NĂNG (CLAUDE.md §3.4b): toàn bộ nút + hộp xác nhận chuyển nguyên
           * vẹn sang `1-giao-dien/thanh-phan-nghiep-vu/khoi-xoa-du-lieu-chay-thu.tsx`, dựng ở
           * trang Cài đặt quy trình. Lời cảnh báo (chỉ đạo Ban lãnh đạo 20/08/2026) giữ nguyên
           * từng chữ — lượt này chỉ đổi CHỖ ĐẶT và AI THẤY.
           *
           * ⚠️ ĐỪNG DỰNG LẠI MỤC NÀY Ở ĐÂY. Khối mới tự gác `quyen.xoaToanBoDuLieu` (chỉ quản
           * trị); thêm một đường vào từ menu này là mở lại đúng cửa vừa đóng.
           */}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ===== HỘP THÔNG TIN CÁ NHÂN =====
          Dữ liệu đọc qua `layHoSoNhanSu` — bản chạy thử dựng từ tài khoản mẫu; nối Firebase
          thì hàm đó đọc `users/{uid}` của App Tổng, hộp này KHÔNG phải sửa. */}
      <Dialog open={moHoSo} onOpenChange={(v: boolean) => !v && doiMoHoSo(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thông tin cá nhân</DialogTitle>
            <DialogDescription>
              Hồ sơ nhân sự do App Tổng HPcore quản lý. Cần sửa thì sửa trên App Tổng — app
              Thu mua chỉ đọc.
            </DialogDescription>
          </DialogHeader>

          {hoSo === null ? (
            <p className="text-sm text-text-desc">Đang đọc hồ sơ từ App Tổng...</p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-white"
                  aria-hidden
                >
                  {vietTat(hoSo.displayName)}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold text-text-primary">
                    {hoSo.displayName}
                  </span>
                  <span className="truncate text-xs text-text-desc">{hoSo.title}</span>
                </span>
                {/* Trạng thái có cả màu và chữ (V1.1). */}
                <span
                  className={`ml-auto rounded-md px-2 py-0.5 text-[11px] font-medium ${
                    hoSo.status === "active"
                      ? "bg-success-bg text-success-soft"
                      : "bg-danger-bg text-danger-soft"
                  }`}
                >
                  {hoSo.status === "active" ? "Đang làm việc" : "Đã khóa"}
                </span>
              </div>

              <DanhSachTruong
                truong={[
                  { nhan: "Email", giaTri: hoSo.email, daiCaHang: true },
                  { nhan: "Điện thoại", giaTri: hoSo.phone },
                  { nhan: "Mã nhân viên", giaTri: hoSo.employeeCode },
                  { nhan: "Phòng ban", giaTri: hoSo.department, daiCaHang: true },
                  {
                    nhan: "Quyền các app",
                    daiCaHang: true,
                    giaTri: Object.entries(hoSo.apps)
                      .map(([ma, cap]) => `${TEN_APP_CON[ma] ?? ma}: cấp ${cap}`)
                      .join(" · "),
                  },
                ]}
              />

              {/**
               * ⚠️ CHỈ NÓI "tài khoản mẫu" KHI THẬT SỰ ĐANG DÙNG TÀI KHOẢN MẪU.
               *
               * 🔴 Ban lãnh đạo 20/08/2026 bắt lỗi: câu này trước đây hiện vô điều kiện, nên người
               * đăng nhập bằng **tài khoản thật** (Firebase Auth) vẫn đọc thấy *"hồ sơ dựng từ tài
               * khoản mẫu, email và mã nhân viên là giả định"* — app tự nói dối về chính dữ liệu
               * của nó, và người dùng mất tin vào mọi thông tin còn lại trên màn hình.
               */}
              {cheDoThu ? (
                <p className="text-[11px] text-text-desc">
                  Bản chạy thử: hồ sơ dựng từ tài khoản mẫu, email và mã nhân viên là giả định.
                  Khi nối App Tổng sẽ hiện hồ sơ thật.
                </p>
              ) : (
                /* Tài khoản thật, nhưng vẫn phải nói rõ hồ sơ đọc từ ĐÂU — nó là project riêng
                   `hpcons-thumua`, chưa phải danh bạ của App Tổng (Ban lãnh đạo 20/08/2026 hỏi
                   đúng chỗ này). Nói nửa vời là người dùng tưởng đã nối App Tổng xong. */
                <p className="text-[11px] text-text-desc">
                  Tài khoản thật (Firebase Auth). Hồ sơ đọc từ máy chủ riêng của app Thu mua —
                  chưa lấy từ danh bạ App Tổng.
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

    </>
  );
}
