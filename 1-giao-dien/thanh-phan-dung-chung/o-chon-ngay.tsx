"use client";

import { useState } from "react";
import { vi } from "date-fns/locale";
import { CalendarDays, X } from "lucide-react";
import { Calendar } from "@/1-giao-dien/nen-tang-ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/1-giao-dien/nen-tang-ui/popover";
import { formatDate } from "@/6-tien-ich/dinh-dang";
import type { NgayISO } from "@/3-du-lieu/kieu-du-lieu";

/**
 * ★★ Ô CHỌN NGÀY DÙNG CHUNG — luôn hiện **dd/mm/yyyy**.
 *
 * 🔴 VÌ SAO KHÔNG DÙNG `<input type="date">` NỮA — Sếp 18/09/2026 khoanh đỏ ô *"Thời gian nhận
 * hàng"* đang hiện `09/21/2026`: ***"Kiểm tra lại định dạng ngày giờ. cần hiển thị dd/mm/yyyy"***.
 *
 * Đã ĐO trên trình duyệt thật (`thumua.hpcore.vn`), không phải suy đoán:
 *   · `document.documentElement.lang` = **"vi"** — trang đã khai tiếng Việt từ trước
 *   · `navigator.language` = **"en-US"** → Chrome vẫn vẽ ô ngày theo **MM/DD/YYYY**
 *
 * 👉 Chrome lấy định dạng từ **ngôn ngữ trình duyệt**, KHÔNG đọc thuộc tính `lang` của trang. Nên
 * mọi mẹo kiểu thêm `lang="vi-VN"` đều vô ích — đừng mất thời gian thử lại. Cách duy nhất là app
 * tự vẽ lấy chữ ngày, và đó là việc của tệp này.
 *
 * 🔴 KHÔNG DỰNG LẠI BẰNG `<input type="text">` + `showPicker()`. Agent phản biện 18/09/2026 đo ra
 * bốn thứ mất đi so với cách dùng lịch popover dưới đây, và tôi đã kiểm lại từng cái:
 *   · điện thoại mất bánh xe chọn ngày của hệ điều hành, phải gõ 8 chữ số trên bàn phím ảo
 *   · mất `min`/`max` của ô native (chốt chặn ngày kết thúc trước ngày bắt đầu)
 *   · mất điều hướng bàn phím và ngữ nghĩa cho trình đọc màn hình
 *   · `showPicker()` phụ thuộc trình duyệt, còn lịch popover thì không
 *
 * 📌 RUỘT LẤY TỪ `ONgayBatDau` (`thanh-phan-nghiep-vu/o-dieu-khoan-cong-no.tsx`) — màn Công nợ đã
 * chạy cách này từ 28/08/2026. Đây là **tách ra dùng chung**, không phải viết mới: giữ nguyên
 * `doiSangDate`/`sangISO` cùng lời cảnh báo múi giờ của bản gốc.
 *
 * ⚠️ GIÁ TRỊ VÀO/RA VẪN LÀ CHUỖI ISO `yyyy-mm-dd`, y hệt `<input type="date">` cũ. Tầng dữ liệu
 * không đổi một dòng nào — đổi cách hiển thị thì đừng đụng cách lưu.
 */

/**
 * Đổi chuỗi `YYYY-MM-DD` thành `Date` theo GIỜ ĐỊA PHƯƠNG.
 *
 * 🔴 KHÔNG DÙNG `new Date("2026-10-11")`. Chuẩn JS parse chuỗi đó theo **UTC**, nên ở múi giờ âm
 * nó lùi về ngày 10 — lịch tô sáng sai một ngày. Tách tay rồi dựng bằng `new Date(y, m, d)` là
 * cách duy nhất chắc chắn đúng ngày người dùng nhìn thấy. (Chép nguyên lời cảnh báo của bản gốc
 * ở `o-dieu-khoan-cong-no.ts`, vì đây đúng là chỗ dễ sinh lỗi lệch một ngày nhất.)
 */
function doiSangDate(ngay: string): Date | undefined {
  /**
   * 🔴 CẮT PHẦN GIỜ TRƯỚC — sửa 18/09/2026. Đề nghị về từ App Request mang ngày dạng đầy đủ
   * `"2026-10-01T00:00:00.000Z"` (cửa API nhận thẳng, không cắt). Tách bằng `split("-")` trên
   * chuỗi đó cho ra `d = NaN` ⇒ lịch không tô ngày nào và mở nhầm về tháng hiện tại, trong khi
   * nút bên ngoài vẫn hiện đúng ngày (`formatDate` tự cắt được). Dự án đã có tiền lệ đúng ca này:
   * `chiNgay()` trong `2-quy-trinh/lich-cong-viec.ts`.
   */
  const [y, m, d] = ngay.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return undefined;
  const ra = new Date(y, m - 1, d);
  return Number.isNaN(ra.getTime()) ? undefined : ra;
}

/** Đổi `Date` thành `YYYY-MM-DD` theo giờ địa phương — cùng lý do với `doiSangDate`. */
function sangISO(d: Date): NgayISO {
  const hai = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`;
}

export function OChonNgay({
  giaTri,
  onDoi,
  toiThieu,
  toiDa,
  nhan,
  id,
  choTrong = "Chọn ngày",
  xoaDuoc = true,
  khoa = false,
  className,
}: {
  /** Chuỗi ISO `yyyy-mm-dd`, hoặc rỗng khi chưa chọn. */
  giaTri: string;
  onDoi: (ngay: string) => void;
  /** Chặn chọn trước ngày này (ISO) — thay cho `min` của ô native. */
  toiThieu?: string;
  /** Chặn chọn sau ngày này (ISO) — thay cho `max` của ô native. */
  toiDa?: string;
  /** Nhãn cho trình đọc màn hình. Ô nào cũng phải có, vì nút chỉ hiện con số ngày. */
  nhan: string;
  id?: string;
  choTrong?: string;
  /** Cho phép xoá về trống. Ô bắt buộc thì truyền `false`. */
  xoaDuoc?: boolean;
  khoa?: boolean;
  className?: string;
}) {
  const [mo, setMo] = useState(false);
  const ngayChon = giaTri ? doiSangDate(giaTri) : undefined;
  /**
   * ⚠️ `disabled` của react-day-picker nhận MỘT matcher hoặc MẢNG matcher, và **không nhận
   * `{before: undefined}`** — nhét `undefined` vào là lỗi kiểu. Nên dựng mảng, chỉ thêm vế nào
   * thật sự có giới hạn.
   */
  const truoc = toiThieu ? doiSangDate(toiThieu) : undefined;
  const sau = toiDa ? doiSangDate(toiDa) : undefined;
  const chan = [
    ...(truoc ? [{ before: truoc }] : []),
    ...(sau ? [{ after: sau }] : []),
  ];
  /* Hôm nay có nằm trong khoảng cho phép không — quyết định có vẽ nút "Hôm nay". */
  const homNay = new Date();
  const homNayHopLe =
    (!truoc || homNay >= truoc) && (!sau || homNay <= new Date(sau.getTime() + 86_400_000 - 1));

  /**
   * 🔴 CAO 44px TRÊN ĐIỆN THOẠI (`min-h-11`), thu về 36px từ `sm:` trở lên — Design System V1.1
   * dòng 154 đòi vùng chạm tối thiểu 44×44px. Giữ đúng như bản gốc ở màn Công nợ.
   */
  /**
   * ⚠️ NGƯỠNG THU NHỎ LÀ `md:` (768px), KHÔNG PHẢI `sm:` (640px) — sửa 18/09/2026.
   * Máy tính bảng và điện thoại xoay ngang nằm đúng dải 640–767px: vẫn là màn CẢM ỨNG, thu về
   * 36px ở đó là mất chuẩn 44px đúng nhóm thiết bị cần nó nhất. Ô "Ngày nhận hàng thực tế" trước
   * 18/09 dùng `md:` và đã đúng; đổi sang `sm:` là một bước lùi lặng lẽ.
   */
  const lopNut =
    "inline-flex min-h-11 w-44 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors hover:bg-muted focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 md:min-h-9";

  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ""}`}>
      <Popover open={mo} onOpenChange={setMo}>
        <PopoverTrigger
          /**
           * 🔴 `aria-label` PHẢI KÈM GIÁ TRỊ NGÀY — sửa 18/09/2026. Thuộc tính này ĐÈ nội dung
           * bên trong nút theo chuẩn tính tên của trình duyệt, nên đặt mỗi tên ô là trình đọc
           * màn hình đọc *"Ngày phải làm, nút"* và **mất hẳn con số ngày** — thua cả ô ngày
           * native trước đây (nó đọc cả nhãn lẫn giá trị).
           */
          render={
            <button
              type="button"
              id={id}
              aria-label={giaTri ? `${nhan}: ${formatDate(giaTri)}` : `${nhan}: chưa chọn`}
              disabled={khoa}
              className={lopNut}
            />
          }
        >
          <CalendarDays className="size-4 shrink-0 text-text-desc" aria-hidden />
          {/* Nút LUÔN hiện một ngày đọc được theo `formatDate` (Intl `vi-VN`, múi giờ khoá
              Asia/Ho_Chi_Minh) — đây chính là chỗ bảo đảm dd/mm/yyyy bất kể máy cài ngôn ngữ gì. */}
          {giaTri ? (
            <span className="tabular-nums">{formatDate(giaTri)}</span>
          ) : (
            <span className="text-text-desc">{choTrong}</span>
          )}
        </PopoverTrigger>

        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            locale={vi}
            captionLayout="dropdown"
            /**
             * ★★ Ô NGÀY 44px TRÊN ĐIỆN THOẠI — sửa 18/09/2026.
             *
             * 🔴 Nút MỞ lịch đã đúng 44px, nhưng chỗ người dùng THẬT SỰ bấm là 42 ô ngày bên
             * trong, mà mặc định của thư viện chỉ **28×28px** và các ô sát nhau — dưới xa chuẩn
             * ≥44×44px của Design System V1.1. Thủ kho đứng ở kho ghi ngày nhận hàng bằng điện
             * thoại là ca dễ bấm nhầm nhất, mà ghi sai ngày nhận thì hỏng số liệu nghiệp vụ.
             *
             * 📌 ĐÈ BẰNG BIẾN CSS TỪ NGOÀI, KHÔNG SỬA `nen-tang-ui/calendar.tsx` — thư mục đó là
             * thư viện ngoài, quy ước dự án §3.4b cấm sửa. Thu về 36px từ `sm:` trở lên cho gọn
             * trên máy tính, đúng nếp `min-h-11 sm:min-h-9` của các ô khác.
             */
            className="[--cell-size:--spacing(11)] md:[--cell-size:--spacing(9)]"
            /* Đi lùi/tiến vài năm quanh hôm nay — đủ rộng, mà không để người bấm nhầm ô chọn năm
               lạc sang 1990. Giữ đúng khoảng của bản gốc. */
            startMonth={new Date(new Date().getFullYear() - 2, 0)}
            endMonth={new Date(new Date().getFullYear() + 3, 11)}
            selected={ngayChon}
            defaultMonth={ngayChon}
            /* ★ THAY CHO `min`/`max` CỦA Ô NATIVE — bỏ chỗ này là mất chốt chặn "ngày kết thúc
               trước ngày bắt đầu", thứ đang canh ở ô Thời gian nhận hàng. */
            disabled={chan.length > 0 ? chan : undefined}
            onSelect={(d) => {
              if (d) {
                onDoi(sangISO(d));
                setMo(false);
                return;
              }
              /**
               * ★★ BẤM LẠI ĐÚNG NGÀY ĐANG CHỌN = XÁC NHẬN, KHÔNG PHẢI XOÁ — sửa 18/09/2026.
               *
               * 🔴 react-day-picker trả `undefined` khi người dùng bấm lại ô ngày đang được chọn.
               * Bản đầu coi đó là lệnh xoá, nên thao tác rất tự nhiên *"mở lịch xem lại cho chắc
               * rồi bấm vào ngày đang sáng"* làm ô **trắng trơn** mà không hỏi một câu — và với ô
               * bắt buộc thì người dùng chỉ thấy ngày biến mất.
               *
               * 📌 Muốn xoá thì đã có nút ✕ riêng bên cạnh, rõ ràng hơn nhiều. Nay bấm lại chỉ
               * đóng lịch, giữ nguyên giá trị.
               */
              setMo(false);
            }}
          />
          <div className="flex items-center justify-end gap-2 border-t border-divider p-2">
            {/**
              * ★ NÚT "HÔM NAY" PHẢI TÔN TRỌNG `toiThieu`/`toiDa` — sửa 18/09/2026.
              *
              * 🔴 Bản đầu đặt thẳng ngày hôm nay, đi vòng qua đúng chốt mà lịch đang chặn: ô
              * *"Nhận hàng đến ngày"* tô mờ mọi ngày trước ngày bắt đầu, nhưng bấm "Hôm nay" là
              * ghi được một khoảng KHÔNG TỒN TẠI (kết thúc trước lúc bắt đầu). Chặn ở lịch mà
              * không chặn ở nút thì chốt chỉ là hình thức — đúng bài học §6.6 *"nút có thể bị đi
              * vòng"*.
              *
              * 📌 Ngoài khoảng cho phép thì ẩn hẳn nút, không vẽ nút mờ: người dùng không cần
              * biết có một nút họ không bao giờ bấm được.
              */}
            {homNayHopLe && (
              <button
                type="button"
                onClick={() => {
                  onDoi(sangISO(new Date()));
                  setMo(false);
                }}
                className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-medium text-primary transition-colors hover:bg-primary-bg md:min-h-9"
              >
                Hôm nay
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Nút xoá đứng NGOÀI nút mở lịch: lồng nút trong nút là HTML không hợp lệ, và bấm nhầm
          sẽ vừa xoá vừa mở lịch. */}
      {xoaDuoc && giaTri && !khoa ? (
        <button
          type="button"
          onClick={() => onDoi("")}
          aria-label={`Xoá ${nhan}`}
          title="Xoá ngày"
          className="inline-flex size-11 items-center justify-center rounded-lg text-text-desc transition-colors hover:bg-muted hover:text-danger md:size-9"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </span>
  );
}
