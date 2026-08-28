"use client";

// ============================================================
// HAI Ô SỬA TẠI CHỖ CỦA BẢNG CÔNG NỢ + NÚT XEM LỊCH SỬ
//
// ★★ Ban lãnh đạo 28/08/2026: *"cột thời gian công nợ được phép sửa và có ghi lại lịch sử,
//    ngày tới hạn cũng là trường nhập thủ công"*.
//
// 🔴 KHÔNG CÓ MỘT DÒNG TÍNH TOÁN NÀO Ở ĐÂY. Luật công nợ (ngày bắt đầu tính, ngày tới hạn,
//    cảnh báo) nằm hết ở `2-quy-trinh/tuoi-no.ts`; tệp này chỉ nhận giá trị đã tính, bày ra
//    và gọi ngược lên chỗ ghi. Quy tắc 3.4b của CLAUDE.md.
//
// 🔴 GHI KHI RỜI Ô (`onBlur`) + Enter, KHÔNG ghi theo từng phím. Gõ "45" mà ghi theo phím là
//    sinh hai dòng nhật ký ("→ 4" rồi "→ 45"), và dòng đầu là một điều khoản chưa bao giờ tồn
//    tại. Escape trả ô về giá trị cũ.
//
// ⚠️ KHÔNG dùng `defaultValue` cho ô nhập: người khác sửa cùng lúc thì ô này phải đổi theo.
//    Ô giữ state riêng để gõ dở không bị nhảy, và `useEffect` đồng bộ lại khi giá trị từ kho
//    dữ liệu đổi mà người dùng KHÔNG đang gõ (`dangGo`).
// ============================================================

import { useEffect, useRef, useState } from "react";
import { vi } from "date-fns/locale";
import { CalendarDays, Check, History, Lock, PenLine, RotateCcw } from "lucide-react";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Calendar } from "@/1-giao-dien/nen-tang-ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/1-giao-dien/nen-tang-ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { formatDate, formatMocThoiGian } from "@/6-tien-ich/dinh-dang";
import type { MocLichSu, NgayISO } from "@/3-du-lieu/kieu-du-lieu";

/**
 * Các mốc cho nợ hay gặp khi làm việc với nhà cung cấp vật liệu xây dựng.
 *
 * ⚠️ ĐÂY CHỈ LÀ LỐI TẮT BẤM CHO NHANH, KHÔNG PHẢI LUẬT. Luật tính hạn nằm ở
 * `2-quy-trinh/tuoi-no.ts`; sửa danh sách này không làm đổi một con số nào app tự tính.
 */
const LOI_TAT_NGAY = [15, 30, 45, 60, 90];

/**
 * Đổi chuỗi `YYYY-MM-DD` thành `Date` theo GIỜ ĐỊA PHƯƠNG.
 *
 * 🔴 KHÔNG DÙNG `new Date("2026-10-11")`. Chuẩn JS parse chuỗi đó theo **UTC**, nên ở múi giờ âm
 * nó lùi về ngày 10 — lịch sẽ tô sáng sai một ngày. Tách tay rồi dựng bằng `new Date(y, m, d)`
 * là cách duy nhất chắc chắn đúng ngày người dùng nhìn thấy.
 */
function doiSangDate(ngay: NgayISO): Date {
  const [y, m, d] = ngay.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Đổi `Date` thành `YYYY-MM-DD` theo giờ địa phương — cùng lý do với `doiSangDate`. */
function sangISO(d: Date): NgayISO {
  const hai = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`;
}

/**
 * Cộng ngày cho lối tắt "+N ngày".
 *
 * 🔴 CỘNG BẰNG `setDate`, KHÔNG cộng mili-giây (`n * 86_400_000`): cách kia lệch một ngày ở các
 * mốc đổi giờ. Đây đúng là cách `congNgay` trong `2-quy-trinh/tuoi-no.ts` đang làm, nên nút lối
 * tắt và con số app tự tính không bao giờ lệch nhau.
 */
function congNgayISO(ngay: NgayISO, soNgay: number): NgayISO {
  const d = doiSangDate(ngay);
  d.setDate(d.getDate() + soNgay);
  return sangISO(d);
}

/**
 * Cỡ chữ của ô phải BẰNG mọi ô chỉ-đọc khác trong bảng, nếu không dòng bị lệch cao thấp.
 *
 * 🔴 CAO 44px TRÊN ĐIỆN THOẠI (`h-11`), thu về 36px từ `sm:` trở lên. Design System V1.1 đòi
 * vùng chạm tối thiểu 44×44px — ô 36px trong một bảng cuộn ngang là chỗ dễ bấm trượt nhất, vì
 * ngón tay vừa chạm vừa kéo bảng.
 */
const LOP_O = "h-11 w-full text-center text-sm tabular-nums sm:h-9";

/**
 * ★ Ô "Thời gian C.Nợ" — số ngày nhà cung cấp cho nợ.
 *
 * ⚠️ Ô TRỐNG KHÁC SỐ 0. Trống = chưa ai điền (bảng in "—"); 0 = phải trả ngay. Xoá trắng ô này
 * ghi `null` để quay về "chưa điền", chứ không ép thành 0.
 */
export function OSoNgayDuocNo({
  giaTri,
  suaDuoc,
  onLuu,
}: {
  giaTri?: number;
  suaDuoc: boolean;
  onLuu: (soNgay: number | null) => void;
}) {
  const [chu, setChu] = useState(giaTri === undefined ? "" : String(giaTri));
  const dangGo = useRef(false);

  useEffect(() => {
    if (!dangGo.current) setChu(giaTri === undefined ? "" : String(giaTri));
  }, [giaTri]);

  if (!suaDuoc) {
    return giaTri !== undefined ? (
      <span className="tabular-nums">{giaTri} ngày</span>
    ) : (
      <span className="text-text-desc">—</span>
    );
  }

  /**
   * 🔴 ĐỌC THẲNG TỪ Ô, KHÔNG ĐỌC TỪ STATE `chu`. Hai thứ này lệch nhau đúng một khoảnh khắc:
   * React cập nhật state bất đồng bộ, nên nếu cú rời ô xảy ra trong cùng nhịp với lần gõ cuối
   * thì closure của `onBlur` vẫn giữ giá trị CŨ — và app lưu đúng cái người dùng vừa xoá đi.
   * Đã đo thấy: xóa trắng ô rồi rời ngay, giá trị cũ vẫn được ghi lại.
   */
  function ghi(giaTriO: string) {
    dangGo.current = false;
    const s = giaTriO.trim();
    if (s === "") {
      onLuu(null);
      return;
    }
    const n = Number(s);
    /* Số âm hoặc chữ → trả ô về giá trị cũ và KHÔNG ghi. Ghi bừa một con số vô nghĩa là ngày
       tới hạn tự tính ra sai, mà bảng vẫn trông bình thường. */
    if (!Number.isFinite(n) || n < 0) {
      setChu(giaTri === undefined ? "" : String(giaTri));
      return;
    }
    onLuu(Math.round(n));
  }

  return (
    <Input
      type="number"
      min={0}
      inputMode="numeric"
      value={chu}
      aria-label="Số ngày được nợ"
      placeholder="—"
      className={LOP_O}
      onChange={(e) => {
        dangGo.current = true;
        setChu(e.target.value);
      }}
      onBlur={(e) => ghi(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          dangGo.current = false;
          setChu(giaTri === undefined ? "" : String(giaTri));
          e.currentTarget.blur();
        }
      }}
    />
  );
}

/**
 * ★ Ô "Ngày tới hạn" — nhập tay, đè lên giá trị app tự tính.
 *
 * 🔴 PHẢI PHÂN BIỆT TAY VỚI TỰ TÍNH. Ngày tự tính hiện dạng chữ mờ kèm chú "tự tính"; ngày gõ
 * tay hiện đậm kèm biểu tượng bút. Cùng bày một con số mà không nói cái nào là tay thì người
 * dùng không biết đơn nào đã chốt hạn thật với nhà cung cấp — và cũng không ngờ ngày tự tính
 * sẽ TỰ ĐỔI khi có thêm một lần giao hàng nữa.
 */
export function ONgayToiHan({
  giaTri,
  nhapTay,
  ngayBatDau,
  soNgayDuocNo,
  suaDuoc,
  onLuu,
}: {
  giaTri?: NgayISO;
  nhapTay: boolean;
  /** Ngày nhận hàng lần cuối — mốc để tính các lối tắt "+N ngày". */
  ngayBatDau?: NgayISO;
  /** Số ngày được nợ đang ghi trên đơn — để đánh dấu lối tắt nào khớp với điều khoản. */
  soNgayDuocNo?: number;
  suaDuoc: boolean;
  onLuu: (ngay: NgayISO | null) => void;
}) {
  const [mo, setMo] = useState(false);

  if (!suaDuoc) {
    return giaTri ? (
      <span className={nhapTay ? "font-medium" : "font-normal text-text-secondary"}>
        {formatDate(giaTri)}
      </span>
    ) : (
      <span className="text-text-desc">—</span>
    );
  }

  /* Ngày đang chọn — chỉ tô sáng trên lịch khi là ngày GÕ TAY. Tô cả ngày tự tính là người dùng
     tưởng đơn đã được chốt hạn, trong khi nó chỉ là phép cộng và sẽ đổi khi có thêm lần giao. */
  const ngayChon = nhapTay && giaTri ? doiSangDate(giaTri) : undefined;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <Popover open={mo} onOpenChange={setMo}>
        <PopoverTrigger
          render={
            <button
              type="button"
              aria-label="Chọn ngày tới hạn thanh toán"
              className={`${LOP_O} inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-transparent px-2 transition-colors hover:bg-muted`}
            />
          }
        >
          <CalendarDays className="size-4 shrink-0 text-text-desc" aria-hidden />
          {/* 🔴 NÚT LUÔN HIỆN MỘT CON SỐ ĐỌC ĐƯỢC. Trước đây đây là `<input type="date">` và ô
              rỗng hiện "dd-mm-yyyy" — người dùng nhìn cả cột thấy toàn chữ đó, không biết đơn nào
              đã có hạn. Nay ô chưa gõ tay thì bày luôn ngày app tự tính. */}
          {giaTri ? (
            <span className={nhapTay ? "font-medium" : "font-normal text-text-secondary"}>
              {formatDate(giaTri)}
            </span>
          ) : (
            <span className="font-normal text-text-desc">Chọn ngày</span>
          )}
        </PopoverTrigger>

        <PopoverContent align="end" className="w-auto p-0">
          {/**
           * ★★ LỐI TẮT THEO ĐIỀU KHOẢN, ĐẶT TRÊN LỊCH — Ban lãnh đạo 28/08/2026: *"dùng loại
           * lịch thông minh hơn đi"*.
           *
           * 🔴 NGƯỜI LÀM CÔNG NỢ KHÔNG NGHĨ THEO "NGÀY 11 THÁNG 10". Họ nghĩ *"nhà cung cấp này
           * cho nợ 45 ngày"*. Một cuốn lịch trơn bắt họ tự cộng nhẩm từ ngày nhận hàng rồi dò
           * tìm ô ngày — đó chính là chỗ sai số. Các nút dưới đây cộng hộ từ ĐÚNG mốc app đang
           * dùng (`ngayBatDau` = ngày nhận hàng lần cuối).
           *
           * ⚠️ Không có `ngayBatDau` (chưa lần giao nào được nhập kho) thì KHÔNG bày lối tắt —
           * bày nút cộng từ một mốc không tồn tại là mời người dùng chốt một ngày vô căn cứ.
           */}
          {ngayBatDau && (
            <div className="flex flex-col gap-1.5 border-b border-divider p-2">
              <span className="text-xs text-text-desc">
                Kể từ ngày nhận hàng lần cuối {formatDate(ngayBatDau)}
              </span>
              <div className="flex flex-wrap gap-1">
                {LOI_TAT_NGAY.map((n) => {
                  const ngay = congNgayISO(ngayBatDau, n);
                  const dangChon = giaTri === ngay;
                  /* Đánh dấu lối tắt trùng với số ngày được nợ ghi trên đơn — người dùng thấy
                     ngay nút nào là "đúng điều khoản", các nút kia là đang phá lệ. */
                  const theoDon = soNgayDuocNo === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        onLuu(ngay);
                        setMo(false);
                      }}
                      title={`${formatDate(ngay)}${theoDon ? " — đúng số ngày được nợ trên đơn" : ""}`}
                      /* Vùng chạm 44px trên điện thoại, thu về 36px từ `sm:` — Design System V1.1. */
                      className={`inline-flex min-h-11 items-center gap-1 rounded-lg border px-2 text-xs font-medium transition-colors sm:min-h-9 ${
                        dangChon
                          ? "border-primary bg-primary text-white"
                          : theoDon
                            ? "border-primary/40 bg-primary-bg text-primary hover:bg-primary/10"
                            : "border-border text-text-secondary hover:bg-muted"
                      }`}
                    >
                      +{n} ngày
                      {theoDon && <Check className="size-3 shrink-0" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <Calendar
            mode="single"
            locale={vi}
            captionLayout="dropdown"
            /* Cho đi lùi/tiến 5 năm quanh hôm nay — đủ rộng cho hạn thanh toán, mà vẫn không để
               người dùng lạc sang năm 1990 khi bấm nhầm ô chọn năm. */
            startMonth={new Date(new Date().getFullYear() - 2, 0)}
            endMonth={new Date(new Date().getFullYear() + 3, 11)}
            selected={ngayChon}
            defaultMonth={ngayChon ?? (giaTri ? doiSangDate(giaTri) : undefined)}
            onSelect={(d) => {
              /* `undefined` = người dùng bấm lại đúng ngày đang chọn (react-day-picker bỏ chọn).
                 Coi đó là XÓA về tự tính — cùng nghĩa với nút "Xóa" bên dưới. */
              onLuu(d ? sangISO(d) : null);
              setMo(false);
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-divider p-2">
            {/* 🔴 LUÔN CÓ ĐƯỜNG VỀ TỰ TÍNH. Không có nút này thì người lỡ chọn nhầm một ngày sẽ
                mắc kẹt với nó — cuốn lịch không có cách nào bỏ chọn cho rõ ràng. */}
            <button
              type="button"
              onClick={() => {
                onLuu(null);
                setMo(false);
              }}
              className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-medium text-text-secondary transition-colors hover:bg-muted sm:min-h-9"
            >
              <RotateCcw className="size-3.5 shrink-0" aria-hidden />
              Để app tự tính
            </button>
            <button
              type="button"
              onClick={() => {
                onLuu(sangISO(new Date()));
                setMo(false);
              }}
              className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-medium text-primary transition-colors hover:bg-primary-bg sm:min-h-9"
            >
              Hôm nay
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Dòng chú dưới ô: cho biết con số đang hiện đến từ đâu. Ô trống mà app vẫn tính ra được
          ngày thì phải nói ngày đó là bao nhiêu — nếu không người dùng tưởng đơn không có hạn. */}
      {nhapTay ? (
        <span className="flex items-center gap-1 text-xs text-primary">
          <PenLine className="size-3 shrink-0" aria-hidden />
          Nhập tay
        </span>
      ) : giaTri ? (
        <span className="text-xs text-text-desc">Tự tính</span>
      ) : (
        <span className="text-xs text-text-desc">Chưa tính được</span>
      )}
    </div>
  );
}

/**
 * ★ Nút mở nhật ký sửa điều khoản công nợ của MỘT đơn.
 *
 * 🔴 NHẬT KÝ NÀY CẤT Ở CHỨNG TỪ GIÁ, KHÔNG Ở NHẬT KÝ ĐỀ NGHỊ — lý do bảo mật, xem chú thích
 * `lichSuDieuKhoanCongNo` trong `kieu-du-lieu.ts`. Vì vậy nó chỉ xem được từ màn công nợ (đã
 * chặn bằng `quyen.xemCongNo`), không hiện trên trang chi tiết đề nghị.
 */
export function NutLichSuCongNo({
  maDonHang,
  lichSu,
}: {
  maDonHang: string;
  lichSu?: MocLichSu[];
}) {
  const [mo, setMo] = useState(false);
  const ds = lichSu ?? [];

  return (
    <>
      <button
        type="button"
        onClick={() => setMo(true)}
        disabled={ds.length === 0}
        title={
          ds.length === 0
            ? "Chưa có lần sửa nào"
            : `Xem ${ds.length} lần sửa điều khoản công nợ`
        }
        aria-label={`Lịch sử sửa điều khoản công nợ của đơn ${maDonHang}`}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg text-xs font-medium text-primary transition-colors hover:bg-primary-bg disabled:cursor-default disabled:text-text-disabled disabled:hover:bg-transparent md:min-h-9 md:min-w-9"
      >
        <History className="size-4 shrink-0" aria-hidden />
        {/* Số lần sửa hiện ngay trên nút: nhìn cả bảng là biết đơn nào đã bị đổi điều khoản. */}
        {ds.length > 0 && <span className="tabular-nums">{ds.length}</span>}
      </button>

      <LichSuCongNo maDonHang={maDonHang} lichSu={ds} mo={mo} onDong={() => setMo(false)} />
    </>
  );
}

function LichSuCongNo({
  maDonHang,
  lichSu,
  mo,
  onDong,
}: {
  maDonHang: string;
  lichSu: MocLichSu[];
  mo: boolean;
  onDong: () => void;
}) {
  return (
    <Dialog open={mo} onOpenChange={(v) => !v && onDong()}>
      {/* 🔴 `sm:max-w-lg` chứ không phải `max-w-lg` — lớp gốc của DialogContent đã có
          `sm:max-w-sm`, class không có tiền tố `sm:` thua ở độ ưu tiên và bị đè IM LẶNG,
          hộp kẹt 384px. Xem CLAUDE.md mục 5. */}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-4 text-primary" aria-hidden />
            Lịch sử sửa điều khoản công nợ
          </DialogTitle>
          <DialogDescription>
            Đơn {maDonHang} · {lichSu.length} lần sửa. Chỉ vai trò được xem giá đọc được sổ này.
          </DialogDescription>
        </DialogHeader>

        <ol className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
          {/* Mới nhất lên đầu — người mở nhật ký gần như luôn hỏi "vừa rồi ai đổi gì". */}
          {[...lichSu].reverse().map((m, i) => (
            <li
              key={`${m.thoiDiem}-${i}`}
              className="flex flex-col gap-0.5 rounded-lg border border-border bg-card p-(--hp-md-row-pad)"
            >
              <span className="text-sm text-text-primary">{m.hanhDong}</span>
              <span className="text-xs text-text-desc">
                {m.nguoiThucHien} · {formatMocThoiGian(m.thoiDiem)}
              </span>
            </li>
          ))}
          {lichSu.length === 0 && (
            <li className="flex items-center gap-1.5 py-4 text-center text-sm text-text-desc">
              <Lock className="size-4 shrink-0" aria-hidden />
              Chưa có lần sửa nào.
            </li>
          )}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
