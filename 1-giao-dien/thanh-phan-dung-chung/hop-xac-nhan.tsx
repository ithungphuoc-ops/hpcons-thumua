"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
/**
 * ★★ LƯỚI AN TOÀN — gắn vào ĐÂY để phủ cả 20 nơi gọi `HopXacNhan`, thêm 14/09/2026.
 *
 * 🔴 TRƯỚC ĐÓ LƯỚI NÀY CHỈ PHỦ ĐÚNG **MỘT** HỘP (`hop-xem-tep.tsx`) trên tổng ~50 hộp thoại của
 * app. Đó là lý do bản vá 13/09 "đo sạch" mà Sếp vẫn gặp lỗi: hộp rò rỉ là một `HopXacNhan` ở
 * màn hình khác, và không có gì hẹn quét nên dấu vết nằm lại tới khi F5.
 *
 * 📌 Quét là thao tác rẻ và có 4 chốt bảo vệ (xem tệp đó) — hẹn dư vài lượt không hại gì, còn bỏ
 * sót một lượt là cả app đơ.
 */
import { useDonDepHopThoaiKet } from "@/1-giao-dien/thanh-phan-dung-chung/don-dep-hop-thoai-ket";

/**
 * HỘP XÁC NHẬN DÙNG CHUNG cho mọi việc bấm là xong, không lùi lại được.
 *
 * 🔴 NGUYÊN TẮC BAN LÃNH ĐẠO 10/08/2026: *"khi bấm nhận công tác phải có cửa sổ thông báo
 * xác nhận, nguyên tắc cho các cái khác luôn nha"*.
 *
 * Áp cho việc nào:
 *   ✅ Chuyển bước quy trình (trình xét duyệt, duyệt phương án, chốt nhà cung cấp)
 *   ✅ Gửi dữ liệu ra ngoài phòng (chốt đơn hàng → đẩy sang Kho và QLDA)
 *   ✅ Ghi tên mình vào hồ sơ (nhận công tác)
 *   ✅ Xóa dữ liệu
 *
 * KHÔNG áp cho việc sửa lại được ngay bằng một cú bấm khác — ví dụ nhập giá nhà cung cấp
 * (lưu lại là ghi đè). Hỏi cả những việc đó thì người dùng bấm "Đồng ý" theo phản xạ, và hộp
 * xác nhận mất hết tác dụng ở đúng chỗ cần nó.
 *
 * 📌 PHÂN BỔ CÔNG VIỆC ĐÃ CHUYỂN SANG DIỆN PHẢI HỎI — Ban lãnh đạo 12/08/2026: *"khi bấm
 * phân bổ công việc cho nhân viên, phải hiện cửa sổ xác nhận lại có giao việc không, và
 * được viết thêm ghi chú yêu cầu số lượng báo giá cần cung cấp"*. Trước đó chỗ này được
 * xếp vào diện "bấm lại là đổi người" nên không hỏi. Lý do đổi: hộp không chỉ để hỏi lại
 * mà còn là **chỗ duy nhất** trưởng bộ phận nêu yêu cầu số báo giá — bỏ hộp là mất luôn
 * chức năng đó.
 *
 * ⚠️ Cờ mở tách khỏi nội dung: component chỉ mở khi `mo === true`, còn phần thân do người
 * gọi giữ. Xóa nội dung cùng lúc với đóng sẽ tháo cây con giữa lúc hiệu ứng đóng đang chạy
 * và để lại lớp mờ kẹt trên màn hình — đã dính lỗi này khi làm hộp chọn người theo dõi.
 */
export function HopXacNhan({
  mo,
  tieuDe,
  moTa,
  /** Câu cảnh báo hệ quả — hiện trong khung vàng. Bỏ trống nếu việc này không có gì đáng lo. */
  canhBao,
  /** Nhãn nút đồng ý. Mặc định "Đồng ý" theo cách nói của Ban lãnh đạo. */
  nhanDongY = "Đồng ý",
  /** Nút đồng ý màu đỏ — dùng cho việc phá hủy dữ liệu. */
  nguyHiem = false,
  /**
   * Lý do KHÓA nút Đồng ý — `undefined` là mở. Hộp cần người dùng nhập gì đó trước khi bấm
   * (ví dụ lý do chọn nhà cung cấp) thì truyền câu giải thích vào đây.
   *
   * 🔴 Nhận CÂU GIẢI THÍCH chứ không nhận `boolean`: nút mờ mà không nói vì sao là kiểu bí
   * việc khó chịu nhất — người dùng bấm mãi không được và chẳng biết còn thiếu gì.
   */
  khoaDongY,
  children,
  onDong,
  onDongY,
}: {
  mo: boolean;
  tieuDe: string;
  moTa?: ReactNode;
  canhBao?: ReactNode;
  nhanDongY?: string;
  nguyHiem?: boolean;
  khoaDongY?: string;
  children?: ReactNode;
  onDong: () => void;
  onDongY: () => void;
}) {
  /* Lưới an toàn cho MỌI nơi gọi hộp này — xem chú thích ở dòng `import` phía trên. */
  useDonDepHopThoaiKet(mo);

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tieuDe}</DialogTitle>
          {moTa && <DialogDescription>{moTa}</DialogDescription>}
        </DialogHeader>

        {children}

        {canhBao && (
          <div className="flex items-start gap-2 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-soft" aria-hidden />
            <span>{canhBao}</span>
          </div>
        )}

        {/* Nút mờ PHẢI kèm lý do — xem chú thích ở `khoaDongY`. */}
        {khoaDongY && <p className="text-xs text-warning-soft">{khoaDongY}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Hủy
          </Button>
          <Button
            variant={nguyHiem ? "destructive" : "default"}
            disabled={khoaDongY !== undefined}
            /**
              * ★★ ĐÓNG TRƯỚC, LÀM VIỆC SAU — sửa 14/09/2026 sau khi Sếp báo lần thứ hai:
              * *"khi đính kèm file mới thì bị hỏng giao diện"* (cả app kẹt, phải F5).
              *
              * 🔴 TRƯỚC ĐÂY VIẾT `onDongY(); onDong();` LIỀN NHAU. Hai lời gọi nằm trong CÙNG một
              * trình xử lý sự kiện nên React gộp thành **MỘT commit**: `mo` về `false` đúng lúc
              * `onDongY` đổi dữ liệu. Nơi gọi nào mà việc đổi dữ liệu đó làm cây cha bị tháo —
              * xoá một phần tử khỏi mảng `.map()`, lật một nhánh `{x ? … : …}`, làm một điều kiện
              * `&&` thành `false` — là `<Dialog>` biến mất **giữa lúc đang chạy vòng đời đóng**.
              * base-ui gỡ khoá cuộn và `data-base-ui-inert` HOÀN TOÀN bằng hàm cleanup của
              * `useEffect`; bị tháo giữa chừng là nó không chạy được, và hai thứ đó kẹt lại trên
              * DOM **vĩnh viễn tới khi F5**.
              *
              * 🔴 LỖI NẰM Ở COMPONENT DÙNG CHUNG NÊN PHỦ CẢ **20 NƠI GỌI**. Đó là lý do vá từng
              * nơi gọi mãi không hết: 13/09 vá hộp "Xem tệp", 14/09 vá thêm 4 chỗ, Sếp vẫn gặp.
              * Một nơi đã phải tự vá riêng bằng đúng cú hoãn này (`o-chung-tu-bat-buoc.tsx`) —
              * nay đưa vào đây thì mọi nơi gọi đều được, kể cả nơi viết sau này.
              *
              * 📌 `setTimeout(…, 0)` là ĐỦ và cố ý không lớn hơn: nó đẩy `onDongY` sang nhịp sự
              * kiện kế tiếp, nên commit đóng hộp được chạy trọn vẹn trước. Để 150ms cho "chắc" thì
              * người dùng bấm Đồng ý xong thấy khựng — đổi một lỗi lấy một lỗi khác.
              *
              * ⚠️ ĐỪNG đảo lại thành `onDongY()` trước cho "tự nhiên". Thứ tự này là toàn bộ nội
              * dung của bản sửa.
              */
            onClick={() => {
              onDong();
              setTimeout(() => onDongY(), 0);
            }}
          >
            <Check className="size-4" aria-hidden />
            {nhanDongY}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
