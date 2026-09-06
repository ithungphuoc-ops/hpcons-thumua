"use client";

// ============================================================
// HAI Ô SỬA TẠI CHỖ CỦA BẢNG CÔNG NỢ + NÚT XEM LỊCH SỬ
//
// ★★ Ban lãnh đạo 28/08/2026: *"cột thời gian công nợ được phép sửa và có ghi lại lịch sử"*.
//    06/09/2026 đảo hai cột ngày: *"ngày bắt đầu tính được phép điều chỉnh"*, *"ngày tới hạn
//    cố định và tự tính"* — nên ô lịch nay là của NGÀY BẮT ĐẦU (`ONgayBatDau`), ngày tới hạn
//    hiện tĩnh ở `cong-no.tsx`.
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
import { CalendarDays, History, Lock, PenLine, RotateCcw } from "lucide-react";
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
 * ★ Ô "Ngày bắt đầu tính" — nhập tay, đè lên ngày nhận hàng lần cuối app tự suy ra (Ban lãnh đạo
 * 06/09/2026: *"ngày này được phép điều chỉnh"*).
 *
 * 🔴 ĐỔI VAI so với 28/08/2026 (khi đó ô lịch là của "ngày tới hạn"). Nay ngày tới hạn cố định
 * tự tính (hiện tĩnh ở `cong-no.tsx`), còn ô lịch chuyển sang cột NGÀY BẮT ĐẦU.
 *
 * 🔴 KHÔNG CÓ LỐI TẮT "+N NGÀY". Lối tắt đó hợp với ngày tới hạn (cộng số ngày được nợ từ một
 * mốc); ngày bắt đầu là một MỐC CỤ THỂ người dùng chọn thẳng (ngày nhận hàng, ngày xuất hóa
 * đơn...), cộng thêm gì vào nó là vô nghĩa.
 *
 * 🔴 PHẢI PHÂN BIỆT TAY VỚI TỰ SUY. Ngày tự suy (theo ngày nhận hàng lần cuối) hiện chữ mờ kèm
 * chú "Theo ngày nhận"; ngày gõ tay hiện đậm kèm biểu tượng bút. Không phân biệt thì người dùng
 * không biết đơn nào đã chốt mốc thật, và không ngờ ngày tự suy sẽ đổi khi có thêm lần giao.
 */
export function ONgayBatDau({
  giaTri,
  nhapTay,
  suaDuoc,
  onLuu,
}: {
  giaTri?: NgayISO;
  nhapTay: boolean;
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

  /* Ngày đang chọn — chỉ tô sáng trên lịch khi là ngày GÕ TAY. Tô cả ngày tự suy là người dùng
     tưởng đơn đã được chốt mốc, trong khi nó chỉ là ngày nhận hàng và sẽ đổi khi có thêm lần giao. */
  const ngayChon = nhapTay && giaTri ? doiSangDate(giaTri) : undefined;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <Popover open={mo} onOpenChange={setMo}>
        <PopoverTrigger
          render={
            <button
              type="button"
              aria-label="Chọn ngày bắt đầu tính nợ"
              className={`${LOP_O} inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-transparent px-2 transition-colors hover:bg-muted`}
            />
          }
        >
          <CalendarDays className="size-4 shrink-0 text-text-desc" aria-hidden />
          {/* 🔴 NÚT LUÔN HIỆN MỘT NGÀY ĐỌC ĐƯỢC. Ô chưa gõ tay thì bày luôn ngày nhận hàng lần
              cuối app tự suy — không để trống "dd-mm-yyyy" khiến người dùng tưởng đơn chưa có mốc. */}
          {giaTri ? (
            <span className={nhapTay ? "font-medium" : "font-normal text-text-secondary"}>
              {formatDate(giaTri)}
            </span>
          ) : (
            <span className="font-normal text-text-desc">Chọn ngày</span>
          )}
        </PopoverTrigger>

        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="single"
            locale={vi}
            captionLayout="dropdown"
            /* Cho đi lùi/tiến vài năm quanh hôm nay — đủ rộng, mà vẫn không để người dùng lạc sang
               năm 1990 khi bấm nhầm ô chọn năm. */
            startMonth={new Date(new Date().getFullYear() - 2, 0)}
            endMonth={new Date(new Date().getFullYear() + 3, 11)}
            selected={ngayChon}
            defaultMonth={ngayChon ?? (giaTri ? doiSangDate(giaTri) : undefined)}
            onSelect={(d) => {
              /* `undefined` = người dùng bấm lại đúng ngày đang chọn (react-day-picker bỏ chọn).
                 Coi đó là XÓA về tự suy — cùng nghĩa với nút "Theo ngày nhận hàng" bên dưới. */
              onLuu(d ? sangISO(d) : null);
              setMo(false);
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-divider p-2">
            {/* 🔴 LUÔN CÓ ĐƯỜNG VỀ TỰ SUY. Không có nút này thì người lỡ chọn nhầm một ngày sẽ
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
              Theo ngày nhận hàng
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

      {/* Dòng chú dưới ô: cho biết ngày đang hiện đến từ đâu. */}
      {nhapTay ? (
        <span className="flex items-center gap-1 text-xs text-primary">
          <PenLine className="size-3 shrink-0" aria-hidden />
          Nhập tay
        </span>
      ) : giaTri ? (
        <span className="text-xs text-text-desc">Theo ngày nhận</span>
      ) : (
        <span className="text-xs text-text-desc">Chưa nhận hàng</span>
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
