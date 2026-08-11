"use client";

import { useState } from "react";
import { AlertTriangle, BookOpen, Clock, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import {
  GIAI_DOAN_MUA_HANG,
  NHAN_GIAI_DOAN,
  type GiaiDoanMuaHang,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import {
  HUONG_DAN_GIAI_DOAN,
  type DoanHuongDan,
} from "@/2-quy-trinh/huong-dan-giai-doan";

/**
 * HƯỚNG DẪN SỬ DỤNG TỪNG BƯỚC — mở từ nút ⓘ ở đầu mỗi cột bảng quy trình và ở thanh
 * giai đoạn trên trang chi tiết.
 *
 * 🔴 Chỉ đạo Ban lãnh đạo 11/08/2026: *"đây là hình ảnh hướng dẫn các quy trình thu mua,
 * đọc kiểm tra và làm lại theo đúng quy trình này, thêm nút để bấm vô sẽ đọc được hướng
 * dẫn sử dụng"*.
 *
 * 🔴 CHỮ LẤY NGUYÊN VĂN TỪ `2-quy-trinh/huong-dan-giai-doan.ts`, KHÔNG viết lại trong này.
 * Đó là văn bản nghiệp vụ của công ty (bảng Base "TM-QT Mua hàng"); người dùng đối chiếu
 * với quy trình giấy nên lệch một chữ là mất tin. Component này chỉ lo phần trình bày.
 *
 * ⚠️ Khối "App chưa làm được" là phần BẮT BUỘC hiện. Đọc hướng dẫn ngay trong app rất dễ
 * làm người dùng tưởng app đã kiểm hộ mọi điều kiện (hợp đồng ≥20 triệu, tem hiệu chuẩn
 * QA-QC, danh mục NCC hàng năm) — thực tế vẫn phải làm tay ngoài app.
 */
export function NutHuongDanGiaiDoan({
  giaiDoan,
  /** `bieu_tuong` cho đầu cột (chật chỗ) · `nut_chu` cho trang chi tiết. */
  kieu = "bieu_tuong",
  className,
}: {
  giaiDoan: GiaiDoanMuaHang;
  kieu?: "bieu_tuong" | "nut_chu";
  className?: string;
}) {
  const [mo, setMo] = useState(false);
  const huongDan = HUONG_DAN_GIAI_DOAN[giaiDoan];

  // Hai cột kết thúc (Hoàn thành · Thất bại) không có hướng dẫn trên bảng Base — không
  // hiện nút còn hơn hiện một nút bấm vào chẳng có gì.
  if (!huongDan) return null;

  const nhan = NHAN_GIAI_DOAN[giaiDoan]?.nhan ?? giaiDoan;

  return (
    <>
      {kieu === "bieu_tuong" ? (
        <button
          type="button"
          onClick={() => setMo(true)}
          title={`Hướng dẫn bước "${nhan}"`}
          aria-label={`Xem hướng dẫn bước ${nhan}`}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-text-desc transition-colors hover:bg-card hover:text-primary"
        >
          <Info className="size-4" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setMo(true)}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary ${className ?? ""}`}
        >
          <BookOpen className="size-4 shrink-0" aria-hidden />
          Hướng dẫn bước này
        </button>
      )}

      <HopHuongDanGiaiDoan giaiDoan={giaiDoan} mo={mo} onDong={() => setMo(false)} />
    </>
  );
}

export function HopHuongDanGiaiDoan({
  giaiDoan,
  mo,
  onDong,
}: {
  giaiDoan: GiaiDoanMuaHang;
  mo: boolean;
  onDong: () => void;
}) {
  const huongDan = HUONG_DAN_GIAI_DOAN[giaiDoan];
  if (!huongDan) return null;

  // Số bước tính trên chuỗi 7 bước — "Thất bại" là nhánh dừng, không nằm trong chuỗi
  // (cùng cách đếm với `thanh-giai-doan.tsx`, đừng để hai chỗ ra hai con số khác nhau).
  const chuoi = GIAI_DOAN_MUA_HANG.filter((g) => g.ma !== "that_bai");
  const viTri = chuoi.findIndex((g) => g.ma === giaiDoan);

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      {/* Hướng dẫn dài hơn màn hình — cuộn BÊN TRONG hộp để nền trang đứng yên.
          ⚠️ PHẢI GHI `sm:max-w-2xl`, không phải `max-w-2xl`. `DialogContent` gốc đã có sẵn
          `sm:max-w-sm`; tailwind-merge chỉ bỏ được lớp CÙNG biến thể, nên `max-w-2xl` không
          hạ được `sm:max-w-sm` và hộp vẫn hẹp 384px trên màn to. */}
      <DialogContent className="max-h-[85vh] sm:max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8 leading-snug">
            {viTri >= 0 ? `Bước ${viTri + 1}. ` : ""}
            {huongDan.tenDayDu}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              {huongDan.khongCoTrenBase
                ? "Cách app xác định bước này"
                : "Hướng dẫn hoàn thành các nhiệm vụ trong giai đoạn"}
            </span>
            {huongDan.gioChuan !== undefined && (
              <span className="inline-flex items-center gap-1 text-text-secondary">
                <Clock className="size-3.5 shrink-0" aria-hidden />
                Thời lượng chuẩn {huongDan.gioChuan} giờ làm việc
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* 🔴 NÓI NGUỒN TRƯỚC KHI NÓI NỘI DUNG. Hai cột kết thúc không có hướng dẫn trên bảng
            quy trình của công ty; chữ bên dưới là mô tả kỹ thuật. Không phân biệt rõ thì người
            dùng sẽ trích chữ trong app ra tranh luận nghiệp vụ. */}
        {huongDan.khongCoTrenBase && (
          <p className="flex items-start gap-2 rounded-lg border border-border bg-muted p-(--hp-md-row-pad) text-sm text-text-secondary">
            <Info className="mt-0.5 size-4 shrink-0 text-text-desc" aria-hidden />
            <span>
              Bước này <strong>không có hướng dẫn trong quy trình giấy</strong> của công ty. Phần
              dưới đây là <strong>cách app xác định</strong>, viết ra để mọi người biết vì sao
              hồ sơ nằm ở đây — không phải văn bản nghiệp vụ.
            </span>
          </p>
        )}

        <div className="flex flex-col gap-3 text-sm leading-relaxed text-text-primary">
          {huongDan.noiDung.map((doan, i) => (
            <DoanNoiDung key={i} doan={doan} laMoTaCuaApp={huongDan.khongCoTrenBase} />
          ))}

          {huongDan.chuaLamDuoc && huongDan.chuaLamDuoc.length > 0 && (
            <section className="flex flex-col gap-1.5 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad)">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-warning-soft">
                <AlertTriangle className="size-4 shrink-0" aria-hidden />
                Phần app chưa làm thay được — vẫn phải làm tay
              </h3>
              <ul className="ml-5 list-disc space-y-1 text-sm text-text-secondary">
                {huongDan.chuaLamDuoc.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </section>
          )}

          <p className="border-t border-divider pt-2.5 text-xs text-text-desc">
            {huongDan.khongCoTrenBase ? (
              <>
                Mô tả cách app hoạt động, <strong>không nằm trong</strong> quy trình{" "}
                <strong>“TM-QT Mua hàng (HP CONS)”</strong>. Công ty ban hành hướng dẫn chính
                thức cho bước này thì thay bằng văn bản đó.
              </>
            ) : (
              <>
                Nội dung chép nguyên văn từ quy trình{" "}
                <strong>“TM-QT Mua hàng (HP CONS)”</strong> của công ty. Quy trình thay đổi thì
                phải sửa theo văn bản mới, không tự diễn giải lại.
              </>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DoanNoiDung({
  doan,
  /** Bước không có hướng dẫn trên bảng Base — chữ ở đây là mô tả app, không phải quy định. */
  laMoTaCuaApp,
}: {
  doan: DoanHuongDan;
  laMoTaCuaApp?: boolean;
}) {
  // Đoạn "Lưu ý" đứng riêng một khối viền — trên bảng Base nó cũng được tách khỏi thân bài,
  // và đây thường là câu người dùng hay bỏ sót nhất.
  if (doan.luuY) {
    return (
      <p className="rounded-lg border-l-4 border-primary bg-primary-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
        <strong className="text-primary-soft">Lưu ý: </strong>
        {doan.luuY}
      </p>
    );
  }

  // Đoạn nhấn mạnh = quy tắc có ngưỡng tiền / người duyệt / số lượng báo giá. Nền riêng để
  // mắt bắt được ngay, KÈM CHỮ "Quy định bắt buộc" — luật V1.1: không truyền tin chỉ bằng màu.
  const khungNhan = doan.nhanManh
    ? "rounded-lg border border-border bg-muted p-(--hp-md-row-pad)"
    : "";

  return (
    <div className={`flex flex-col gap-1.5 ${khungNhan}`}>
      {doan.nhanManh && (
        /* 🔴 Nhãn phải theo NGUỒN. Ở bước không có trong quy trình giấy mà vẫn in "Quy định
           bắt buộc" là tự mâu thuẫn với chính dòng cảnh báo phía trên, và tệ hơn: biến mô tả
           kỹ thuật thành quy định công ty trong mắt người đọc. */
        <span className="text-xs font-semibold tracking-wide text-text-desc uppercase">
          {laMoTaCuaApp ? "Điều kiện app kiểm" : "Quy định bắt buộc"}
        </span>
      )}
      {doan.van && <p>{doan.van}</p>}
      {doan.gach && (
        <ul className="ml-5 list-disc space-y-1">
          {doan.gach.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
