"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import {
  CHU_KY_HOI_BAN_MOI_MS,
  HAN_NHAC_GAP_MS,
  cauDemNguocTaiLai,
  cauNhacBanMoi,
  coBanMoi,
  daDenLucNhacGap,
  giayConLai,
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
 * 🔴🔴 CÓ TỰ TẢI LẠI — SẾP CHỐT 16/09/2026. ĐÂY LÀ QUYẾT ĐỊNH ĐÃ ĐỔI MỘT LẦN.
 * ════════════════════════════════════════════════════════════════════════════════════════
 * Bản đầu (sáng 16/09) CỐ Ý không tự tải lại. Lý lẽ khi đó vẫn đúng và vẫn cần biết:
 * `form-lap-don-mua-hang.tsx` là biểu mẫu dài hàng chục trường, người ta điền cả chục phút mới
 * xong, và nội dung đang gõ KHÔNG được cất tạm ở đâu cả — tải lại giữa chừng là xoá sạch việc họ
 * vừa làm.
 *
 * Chiều 16/09 Sếp cân lại và chọn mạnh tay hơn, nguyên văn:
 *   *"Cứ vầy đi tại chạy test không sao, chạy thật thì sẽ deploy vào khung giờ ít người vào app"*
 *
 * ⇒ Đánh đổi được chấp nhận CÓ ĐIỀU KIỆN: bản vá quan trọng phải tới tay mọi máy nhanh hơn là
 *   giữ một biểu mẫu đang gõ dở. **Điều kiện đi kèm là deploy vào giờ vắng khi chạy thật** —
 *   ai đổi chỗ này sau đừng quên vế đó, nó là một nửa của quyết định.
 *
 * 📌 BA THỨ GIỮ LẠI ĐỂ KHÔNG THÀNH THÔ BẠO:
 *   ① Đếm ngược 30 giây, hiện SỐ GIÂY trên dải — ai đang gõ dở kịp chép nội dung ra chỗ khác.
 *   ② Nói THẲNG ở đầu câu là trang sẽ tự tải lại, không giấu xuống cuối.
 *   ③ Có nút "Tải lại ngay" cho ai không muốn chờ hết 30 giây.
 *
 * ⚠️ Nếu sau này biểu mẫu tự lưu nháp được thì hạ 30 giây xuống bao nhiêu cũng an toàn. Chừng
 * nào chưa có, ĐỪNG HẠ THÊM.
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
  /** Số giây còn lại trước khi tự tải lại. `null` = chưa đếm. */
  const [giay, setGiay] = useState<number | null>(null);

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

  /**
   * ★★ HẸN GIỜ ĐỔI SANG GIỌNG GẤP — TÁCH KHỎI LẦN GỌI MÁY CHỦ (CodeRabbit bắt, PR #22).
   *
   * 🔴 LỖI CỦA BẢN ĐẦU: `setGap` chỉ chạy BÊN TRONG `hoi()`, sau khi lấy dữ liệu thành công. Mạng
   * hỏng sau lúc đã phát hiện bản mới thì mọi lần hỏi sau đều `return` sớm, và dải báo **mãi ở
   * mức nhã nhặn** dù đã quá 30 phút — đúng lúc cần nói thật thì lại im.
   *
   * ✅ Hẹn giờ này chạy độc lập, không cần mạng. Việc đổi giọng là chuyện của ĐỒNG HỒ, không phải
   * chuyện của máy chủ.
   *
   * 📌 GIỮ NGUYÊN phép kiểm `daDenLucNhacGap` trong `hoi()` — hai lớp lo hai ca khác nhau, không
   * thừa: hẹn giờ lo ca MẠNG HỎNG; phép kiểm trong `hoi()` lo ca TRÌNH DUYỆT GIÃN BỘ HẸN GIỜ khi
   * tab bị ẩn lâu (Chrome giãn timer của tab nền tới hàng phút). Bỏ lớp nào cũng hở một ca.
   *
   * 🔴 Tính phần thời gian CÒN LẠI chứ không hẹn cứng 30 phút: nếu tab vừa hiện lại sau khi ẩn
   * lâu, `coMoi` mới bật nhưng `lucPhatHien` đã cũ — hẹn cứng là bắt người dùng chờ thêm 30 phút
   * nữa từ đầu. `Math.max(0, …)` cho trường hợp đã quá hạn từ lâu: đổi giọng ngay.
   */
  useEffect(() => {
    if (!coMoi || gap) return;
    const conLai = Math.max(0, HAN_NHAC_GAP_MS - (Date.now() - lucPhatHien.current));
    const id = setTimeout(() => setGap(true), conLai);
    return () => clearTimeout(id);
  }, [coMoi, gap]);

  /**
   * ★★ ĐẾM NGƯỢC RỒI TỰ TẢI LẠI — Sếp chốt 16/09/2026, xem khối chú thích đầu tệp.
   *
   * 🔴 ĐẾM MỖI GIÂY CHỨ KHÔNG PHẢI HẸN MỘT LẦN 30 GIÂY. Người dùng phải THẤY con số lùi dần thì
   * mới tin là trang sắp tải lại thật và kịp chép nội dung ra. Hẹn một lần rồi im lặng thì họ
   * không biết gì cho tới lúc trang nhảy — đúng thứ làm người ta tưởng app hỏng.
   *
   * 🔴 TÍNH LẠI TỪ ĐỒNG HỒ MỖI NHỊP (`giayConLai`), KHÔNG TỰ TRỪ MỘT. Trình duyệt giãn bộ đếm
   * của tab nền tới hàng chục giây; tự trừ một thì con số lệch hẳn khỏi thời gian thật, và trang
   * tải lại lúc dải báo vẫn đang ghi "còn 18 giây".
   *
   * 📌 Dọn bộ đếm khi component bị tháo — tải lại trang mà bộ đếm còn chạy là gọi `reload()` hai
   * lần chồng nhau.
   */
  useEffect(() => {
    if (!coMoi) return;
    const nhip = () => {
      const conLai = giayConLai(lucPhatHien.current, Date.now());
      setGiay(conLai);
      if (conLai <= 0) window.location.reload();
    };
    nhip();
    const id = setInterval(nhip, 1000);
    return () => clearInterval(id);
  }, [coMoi]);

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
        <strong className="font-semibold">{tieuDe}.</strong>{" "}
        {giay === null ? chiDan : cauDemNguocTaiLai(giay)}
      </span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className={`ml-auto inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white transition-colors ${
          gap ? "bg-danger hover:bg-danger/90" : "bg-warning hover:bg-warning/90"
        }`}
      >
        <RefreshCw className="size-3.5 shrink-0" aria-hidden />
        Tải lại ngay
      </button>
    </div>
  );
}
