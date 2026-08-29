"use client";

import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import type { DonDatHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * ★ XÁC NHẬN ĐỀ NGHỊ TỰ ĐỘNG KHỚP — thêm 29/08/2026 (chiều), sau khi review PR (CodeRabbit +
 * nội bộ) chỉ ra: khớp chỉ dựa vào `maDuAn` rồi CHỐT LUÔN "da_chot" là rủi ro nếu hai công trình
 * khác nhau lỡ trùng mã dự án. Sếp chốt: thêm một bước NGƯỜI THẬT xác nhận trước khi chốt.
 *
 * Hiện khi PO đang `"cho_de_nghi"` MÀ ĐÃ CÓ `prId` — dấu hiệu route `app-request/de-nghi-moi`
 * vừa tự động điền đề nghị vào, còn chờ xác nhận (khác PO "chờ đề nghị" CHƯA có `prId`, nơi đó
 * dùng `HopGanDeNghi` để người dùng tự chọn tay).
 */
export function HopXacNhanTuDongGan({ po }: { po: DonDatHang }) {
  const { deNghi, xacNhanTuDongGanDeNghi, huyKhopTuDongDeNghi } = useDuLieu();
  const dnGoc = deNghi.find((d) => d.id === po.prId);

  function xacNhan() {
    const loi = xacNhanTuDongGanDeNghi(po.id);
    if (loi) {
      toast.error("Chưa xác nhận được", { description: loi });
      return;
    }
    toast.success("Đã xác nhận đề nghị", {
      description: `${po.code} giờ là PO chính thức.`,
    });
  }

  function huy() {
    const loi = huyKhopTuDongDeNghi(po.id);
    if (loi) {
      toast.error("Chưa gỡ được", { description: loi });
      return;
    }
    toast("Đã gỡ liên kết tự động", {
      description: `${po.code} quay về "Chờ đề nghị" — gắn lại đúng đề nghị bằng nút "+ Gắn đề nghị".`,
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-primary/40 bg-primary-bg p-2.5">
      <span className="text-xs text-text-secondary">
        Hệ thống tự động khớp đề nghị{" "}
        <span className="font-semibold text-text-primary">{po.prCode ?? "?"}</span>
        {dnGoc?.tenCongTrinh ? ` (${dnGoc.tenCongTrinh})` : ""} — cùng mã dự án{" "}
        <span className="font-semibold text-text-primary">{po.maDuAn}</span>. Đúng đề nghị này
        không?
      </span>
      <div className="flex gap-2">
        <Button size="sm" onClick={xacNhan}>
          <Check className="size-4" aria-hidden />
          Xác nhận
        </Button>
        <Button size="sm" variant="outline" onClick={huy}>
          <X className="size-4" aria-hidden />
          Không đúng, gỡ liên kết
        </Button>
      </div>
    </div>
  );
}
