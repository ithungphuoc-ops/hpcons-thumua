"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, X, RotateCw, ExternalLink, Home, type LucideIcon } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";

const NHIEM_VU_URL = "https://quacuatoi.hpcore.vn/nhiem-vu";

/**
 * 🎁 "QUÀ CỦA TÔI" — popup khung điện thoại nhúng iframe app hpcons-quacuatoi (chuỗi nhiệm
 * vụ đổi điểm UrBox), port theo đúng chuẩn đã hoàn thiện ở hpcons-portal
 * (`components/layout/GiftPopup.tsx`) và đã nhân ra ITAsset (`src/components/GiftPopup.tsx`).
 *
 * Thích ứng cho ThuMua:
 * - Bezel/chrome NGOÀI iframe dùng token màu của app này (`var(--hp-primary)`, `bg-surface`,
 *   `border-border`...) thay vì màu cứng — đổi màu chủ đạo tương lai thì popup tự đổi theo,
 *   không phải sửa lại đây. Bên TRONG khung (iframe) vẫn nền trắng vì đó là giao diện app
 *   hpcons-quacuatoi, không sửa được từ đây.
 * - ThuMua CHƯA có route "Thông báo" hay "Tôi" riêng (chuông thông báo là dropdown ngay trên
 *   thanh trên, hồ sơ cá nhân cũng vậy — xem `nut-thong-bao.tsx` + `menu-tai-khoan.tsx`) nên
 *   thanh điều hướng đáy popup chỉ còn 3 mục CÓ CHỨC NĂNG THẬT: Trang chủ, Làm mới, Mở tab —
 *   giống hệt cách ITAsset đã rút gọn, không bịa thêm mục trỏ vào route không tồn tại.
 * - Giữ đúng quy tắc gốc: CHỈ nút ✕ hoặc "Trang chủ" mới đóng được popup, không đóng khi bấm
 *   ra ngoài; giữ khung điện thoại giả ở màn hình lớn (≥1280px, breakpoint `xl` chuẩn hệ sinh
 *   thái) và phóng to hết màn hình dưới ngưỡng đó (điện thoại/tablet thật).
 *
 * Tự quản lý state đóng/mở bên trong (không cần `AppHeader` biến thành client component) —
 * dùng y hệt cách `NutThongBao`/`MenuTaiKhoan` đã làm ở file cạnh bên.
 */
function MucDieuHuong({
  icon: Icon,
  label,
  title,
  onClick,
  noiBat,
}: {
  icon: LucideIcon;
  label: string;
  title?: string;
  onClick: () => void;
  noiBat?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors active:scale-95 ${
        noiBat ? "text-primary" : "text-text-desc hover:text-text-primary"
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
}

function QuaCuaToiPopup({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Focus khung dialog (không phải 1 nút ✕ cụ thể) — có 2 nút đóng khác nhau tuỳ breakpoint,
  // nút bị ẩn bằng `hidden` không nhận được focus.
  const dialogRef = useRef<HTMLDivElement>(null);

  const veTrangChu = () => {
    onClose();
    router.push("/tong-quan");
  };

  useEffect(() => {
    dialogRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      // CHỈ nút ✕ (hoặc "Trang chủ") mới đóng được popup — không đóng khi bấm ra nền tối,
      // tránh tắt nhầm lúc đang thao tác trong popup (đúng chuẩn hpcons-portal).
      className="fixed inset-0 z-[60] flex items-center justify-center xl:p-4"
      style={{ background: "rgba(10, 14, 22, 0.6)", backdropFilter: "blur(3px)" }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Quà của tôi"
        tabIndex={-1}
        className="relative w-full h-full rounded-none p-0 shadow-2xl outline-none xl:h-[min(800px,88vh)] xl:w-[380px] xl:rounded-[3rem] xl:p-3.5"
        style={{ background: "linear-gradient(155deg, var(--hp-primary), #0b1220)" }}
      >
        {/* Nút đóng nổi ngoài khung — chỉ hợp lý khi có khung (desktop) */}
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="hidden xl:flex absolute -top-3.5 -right-3.5 size-10 items-center justify-center rounded-full border border-border bg-white text-text-primary shadow-lg transition-transform hover:scale-105"
        >
          <X size={18} />
        </button>

        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-none bg-white xl:rounded-[2.25rem]">
          {/* Thanh trên cùng — chỉ hiện ở chế độ toàn màn hình (điện thoại/tablet thật):
              tên popup + nút đóng thật sự dùng được. Nút "Trang chủ" đã dời xuống thanh điều
              hướng đáy (dùng chung cho cả 2 chế độ), tránh trùng lặp. */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-white px-4 py-3 xl:hidden">
            <span className="text-sm font-bold text-gray-800">🎁 Quà của tôi</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tai thỏ — chỉ hiện ở khung điện thoại giả (desktop) */}
          <div className="relative hidden h-11 shrink-0 bg-white xl:block">
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[118px] h-[26px] rounded-full bg-[#0b1220] flex items-center justify-end pr-2.5">
              <span className="size-2 rounded-full" style={{ background: "var(--hp-primary)" }} />
            </div>
          </div>

          <iframe
            ref={iframeRef}
            src={NHIEM_VU_URL}
            title="Quà của tôi — nhiệm vụ đổi điểm"
            className="flex-1 w-full border-0"
            loading="lazy"
            // Giới hạn tối thiểu quyền của iframe (CodeRabbit khuyến nghị 25/08/2026, PR #5
            // base-request-app): allow-same-origin để đọc được cookie phiên .hpcore.vn (bắt
            // buộc, không thì mất đăng nhập SSO), allow-scripts để chạy app React, allow-popups
            // (+ allow-popups-to-escape-sandbox) vì bấm nhiệm vụ mở tab mới, allow-forms cho màn
            // đăng nhập lúc chưa có phiên. CỐ Ý bỏ allow-top-navigation.
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />

          {/* Thanh điều hướng đáy — 3 mục CÓ CHỨC NĂNG THẬT (ThuMua không có route Thông báo/
              Tôi riêng để trỏ tới, khác hpcons-portal). "Mở tab" tô màu primary vì là hành động
              thoát hẳn ra ngoài — quan trọng hơn, cần nổi bật hơn 2 mục còn lại. */}
          <div className="grid grid-cols-3 shrink-0 border-t border-gray-100 bg-white">
            <MucDieuHuong icon={Home} label="Trang chủ" onClick={veTrangChu} />
            <MucDieuHuong
              icon={RotateCw}
              label="Làm mới"
              onClick={() => {
                if (iframeRef.current) iframeRef.current.src = NHIEM_VU_URL;
              }}
            />
            <MucDieuHuong
              icon={ExternalLink}
              label="Mở tab"
              title="Mở tab đầy đủ"
              noiBat
              onClick={() => window.open(NHIEM_VU_URL, "_blank", "noopener,noreferrer")}
            />
          </div>

          {/* Home indicator — trang trí, chỉ có ý nghĩa ở khung điện thoại giả (desktop) */}
          <div className="relative hidden h-5 shrink-0 bg-white xl:block">
            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[120px] h-1 rounded-full bg-gray-900/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Nút mở popup "Quà của tôi", đặt cạnh chuông thông báo trên thanh trên (`thanh-tren.tsx`) —
 * đúng vị trí quy ước của hệ sinh thái (cạnh thông báo/tài khoản). */
export function NutQuaCuaToi() {
  const [mo, doiMo] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Quà của tôi"
        title="Quà của tôi"
        onClick={() => doiMo(true)}
      >
        <Gift className="size-5" />
      </Button>
      {mo && <QuaCuaToiPopup onClose={() => doiMo(false)} />}
    </>
  );
}
