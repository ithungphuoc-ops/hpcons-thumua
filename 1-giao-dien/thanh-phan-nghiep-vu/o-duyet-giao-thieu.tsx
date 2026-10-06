"use client";

// ============================================================
// Ô "DUYỆT HOÀN THÀNH GIAO THIẾU" — lý do (bắt buộc) + nút duyệt.
//
// ★ Sếp 06/10/2026: đơn giao thiếu, sau khi thu mua đã "Xác nhận nhận hàng", Trưởng bộ phận ĐƯỢC duyệt
// hoàn thành nhưng PHẢI ghi lý do. Luật ở `3-du-lieu/kho-du-lieu.tsx` → `vuongMacDuyetGiaoThieu`
// (tầng ghi kiểm lại, ô này chỉ là lối vào).
//
// 🔴 DÙNG Ở HAI CHỖ, phải giống hệt nhau: trang chi tiết đề nghị (bước ⑥) và trang chi tiết đơn hàng.
// Cùng một việc mà hai màn bày hai kiểu là người dùng tưởng có hai chức năng.
// ============================================================

import { useState } from "react";
import { AlertTriangle, BadgeCheck } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";

export function ODuyetGiaoThieu({
  maDon,
  vuongMac,
  onDuyet,
}: {
  maDon: string;
  /**
   * Còn lần giao thiếu phiếu giao nhận (`vuongMacXacNhanKho`) thì KHOÁ nút và in lý do — tầng ghi
   * cũng chặn (06/10/2026), khoá ở đây để người bấm không phải gõ lý do rồi mới biết.
   */
  vuongMac?: string | null;
  /** Gọi tầng ghi; trả câu lỗi (`string`) hoặc `null` khi đã duyệt. */
  onDuyet: (lyDo: string) => string | null;
}) {
  const [lyDo, setLyDo] = useState("");
  const [loi, setLoi] = useState<string | null>(null);
  const trong = lyDo.trim() === "";

  function duyet() {
    const kq = onDuyet(lyDo.trim());
    setLoi(kq);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad)">
      <p className="flex items-start gap-1.5 text-sm text-text-secondary">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-soft" aria-hidden />
        <span>
          <strong>Đơn {maDon} giao thiếu.</strong> Trưởng bộ phận được duyệt hoàn thành, nhưng phải ghi lý
          do giao thiếu — lý do lưu vào đơn và nhật ký hồ sơ.
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label={`Lý do giao thiếu của đơn ${maDon} (bắt buộc)`}
          placeholder="Lý do giao thiếu (bắt buộc) — vd: NCC hết hàng, công trình đã đủ dùng"
          value={lyDo}
          onChange={(e) => {
            setLyDo(e.target.value);
            setLoi(null);
          }}
          className="h-11 min-w-60 flex-1 text-sm md:h-9"
        />
        <Button size="sm" onClick={duyet} disabled={trong || Boolean(vuongMac)}>
          <BadgeCheck className="size-4" aria-hidden />
          Duyệt hoàn thành (giao thiếu)
        </Button>
      </div>
      {vuongMac && <span className="text-xs text-warning-soft">{vuongMac}</span>}
      {trong && !vuongMac && (
        <span className="text-xs text-text-desc">Ghi lý do thì nút duyệt mới bấm được.</span>
      )}
      {loi && <span className="text-xs text-danger-soft">{loi}</span>}
    </div>
  );
}
