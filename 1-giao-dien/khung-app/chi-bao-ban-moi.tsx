"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import {
  CHU_KY_HOI_BAN_MOI_MS,
  cauNhacBanMoi,
  coBanMoi,
  daDenLucNhacGap,
} from "@/2-quy-trinh/nhip-kiem-ban-moi";

/**
 * DẢI BÁO "ĐÃ CÓ BẢN MỚI, TẢI LẠI TRANG GIÚP" — thêm 16/09/2026.
 *
 * ════════════════════════════════════════════════════════════════════════════════════════
 * 🔴 VÌ SAO CẦN — KHÔNG PHẢI CHO TIỆN, LÀ VÁ MỘT LỖ ĐÃ GÂY SỰ CỐ THẬT
 * ════════════════════════════════════════════════════════════════════════════════════════
 * Deploy KHÔNG đẩy mã mới sang những tab đang mở. Trình duyệt vẫn chạy bản JavaScript tải về từ
 * lúc người dùng mở trang — có khi từ hôm trước.
 *
 * Ngày 15/09/2026, app dính vòng lặp ghi vô tận. Vá xong, deploy xong, vòng lặp **vẫn chạy** cho
 * tới khi Sếp tắt hết máy trong phòng. Hôm sau còn đo được bằng chứng cụ thể: ba đơn `DMH260011`,
 * `DMH260012`, `DMH260013` lập ngày 16/09 mang dấu hỏng **không kèm mốc thời gian** — dấu vân tay
 * của một bản app từ trước 14/09.
 *
 * ⇒ Máy chạy bản cũ **ghi đè được lên dữ liệu của bản mới**. Mọi bản vá đều có thể bị vô hiệu hoá
 *   bởi một tab ai đó quên đóng.
 *
 * ════════════════════════════════════════════════════════════════════════════════════════
 * 🔴🔴 VÌ SAO KHÔNG TỰ TẢI LẠI HỘ NGƯỜI DÙNG — ĐỌC KỸ TRƯỚC KHI ĐỊNH "CẢI TIẾN"
 * ════════════════════════════════════════════════════════════════════════════════════════
 * Bản thiết kế đầu có ý tự gọi `location.reload()` khi tab bị ẩn hoặc khi người dùng rảnh vài
 * phút. **Đã bỏ, cố ý.**
 *
 * App này có `form-lap-don-mua-hang.tsx` — biểu mẫu dài hàng chục trường, người ta điền cả chục
 * phút mới xong, và nội dung đang gõ KHÔNG được cất tạm ở đâu cả. Tự tải lại giữa chừng là **xoá
 * sạch việc họ vừa làm**, mà lại còn không hiểu vì sao trang tự nhảy.
 *
 * "Tab đang ẩn" cũng không cứu được: người ta mở tab khác tra giá nhà cung cấp rồi quay lại điền
 * tiếp — đó là thao tác BÌNH THƯỜNG của nghề này, không phải dấu hiệu bỏ máy.
 *
 * ⇒ Cái giá của việc báo mà người ta lờ đi: một máy chạy bản cũ thêm một lúc.
 *   Cái giá của việc tự tải lại nhầm lúc: một người mất nguyên một đơn hàng đang lập.
 *   Không cân xứng. Nên chỉ báo.
 *
 * 📌 BÙ LẠI BẰNG CÁCH ĐỔI GIỌNG: sau 30 phút mà vẫn chưa tải lại thì dải đổi sang màu cảnh báo và
 * nói thẳng hậu quả (xem `cauNhacBanMoi`). Nhã nhặn một lần, rồi nói thật.
 *
 * ⚠️ Nếu sau này muốn tự tải lại, ĐIỀU KIỆN TỐI THIỂU là app phải cất tạm được nội dung biểu mẫu
 * đang gõ dở. Chưa có thứ đó thì đừng bật.
 *
 * ════════════════════════════════════════════════════════════════════════════════════════
 * 📌 LUẬT NẰM Ở `2-quy-trinh/nhip-kiem-ban-moi.ts`, KHÔNG NẰM TRONG COMPONENT NÀY
 * ════════════════════════════════════════════════════════════════════════════════════════
 * Chỉ đạo Sếp 15/09/2026: *"luật nằm trong hook thì không bài kiểm nào bắt được"*.
 * `kiem-luat-dung-chung.mjs` gọi THẬT `coBanMoi` và `daDenLucNhacGap`.
 */
export function ChiBaoBanMoi() {
  const [coMoi, setCoMoi] = useState(false);
  const [gap, setGap] = useState(false);

  /**
   * Mã bản đọc được ở LẦN HỎI ĐẦU TIÊN — đây là mốc để so, không phải hằng số lúc dựng.
   *
   * 🔴 PHẢI LÀ `useRef`, KHÔNG phải state: đổi nó không được làm vẽ lại. Và nó chỉ được đặt đúng
   * một lần — đặt lại là mốc trôi theo, dải báo sẽ không bao giờ hiện.
   */
  const banDauTien = useRef<string>("");
  /** Mốc lúc PHÁT HIỆN có bản mới, để biết khi nào đổi sang giọng gấp. */
  const lucPhatHien = useRef<number>(0);

  const hoi = useCallback(async () => {
    try {
      /* `cache: "no-store"` ở phía trình duyệt, cộng với `Cache-Control` ở phía máy chủ.
         Thiếu một trong hai là câu trả lời có thể bị đệm lại và dải báo không bao giờ hiện. */
      const res = await fetch("/api/phien-ban", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { ban?: unknown };
      const ban = typeof data.ban === "string" ? data.ban : "";
      if (!ban) return;

      if (!banDauTien.current) {
        banDauTien.current = ban;
        return;
      }

      if (coBanMoi(banDauTien.current, ban)) {
        if (!lucPhatHien.current) lucPhatHien.current = Date.now();
        setCoMoi(true);
        setGap(daDenLucNhacGap(lucPhatHien.current, Date.now()));
      }
    } catch {
      /* Mạng hỏng hay máy chủ bận thì im lặng bỏ qua. Đây là tiện ích phụ — nó không được phép
         làm phiền người dùng bằng lỗi của chính nó, và càng không được làm đổ app. */
    }
  }, []);

  useEffect(() => {
    hoi();
    const id = setInterval(hoi, CHU_KY_HOI_BAN_MOI_MS);

    /* Quay lại tab thì hỏi ngay, không đợi hết chu kỳ — người vừa rời máy nửa tiếng quay lại đúng
       là lúc khả năng có bản mới cao nhất. */
    const khiHien = () => {
      if (document.visibilityState === "visible") hoi();
    };
    document.addEventListener("visibilitychange", khiHien);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", khiHien);
    };
  }, [hoi]);

  if (!coMoi) return null;

  const { tieuDe, chiDan } = cauNhacBanMoi(gap);

  return (
    /* `role="status"` chứ không phải `alert`: `alert` cắt ngang lời trình đọc màn hình đang đọc,
       quá hung hăng cho một lời mời tải lại trang. */
    <div
      role="status"
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-(--hp-md-pad) py-2.5 text-sm ${
        gap
          ? "border-danger bg-danger-bg text-danger-soft"
          : "border-border bg-warning-bg text-warning-soft"
      }`}
    >
      {/* Có cả biểu tượng lẫn chữ, không chỉ dựa vào màu — Design System V1.1. */}
      {gap ? (
        <TriangleAlert className="size-4 shrink-0" aria-hidden />
      ) : (
        <RefreshCw className="size-4 shrink-0" aria-hidden />
      )}
      <span className="min-w-0">
        <strong className="font-semibold">{tieuDe}.</strong> {chiDan}
      </span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className={`ml-auto inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white transition-colors ${
          gap ? "bg-danger hover:bg-danger/90" : "bg-warning hover:bg-warning/90"
        }`}
      >
        <RefreshCw className="size-3.5 shrink-0" aria-hidden />
        Tải lại
      </button>
    </div>
  );
}
