"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, ExternalLink, ImageIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { LienKetAnhQlkCtr } from "@/1-giao-dien/thanh-phan-dung-chung/lien-ket-anh-qlk-ctr";
import { useKhoHienTai } from "@/1-giao-dien/khung-app/lien-ket-kho";
import { TEN_APP_EQUI } from "@/2-quy-trinh/ten-app-kho";
import type { AnhTuQlkCtr } from "@/3-du-lieu/tich-hop-qlk-ctr-nhan-hang-types";

// ============================================================
// ẢNH PHIẾU GIAO DO APP KHO GỬI KÈM — CHỌN THEO KHO (Liên kết mua hàng EQUI, Sếp duyệt 15/10/2026)
//
// Kho thường → vẽ ĐÚNG component cũ `LienKetAnhQlkCtr` (chữ "từ QLK CTR"), không đổi một điểm ảnh.
// Kho EQUI   → bản dưới đây, cùng hành vi (bấm tên xem pop-up, mũi tên tải về), chữ nói "App EQUI".
//
// 🔴 VÌ SAO KHÔNG SỬA THẲNG `lien-ket-anh-qlk-ctr.tsx`: chú thích ở `khoi-bo-ho-so-thanh-toan.tsx` ghi
// component đó là CỦA PHIÊN TÍCH HỢP (vùng cấm sửa §6.6) — *"chỉ import và dùng lại, không đụng một
// ký tự nào bên trong nó"*. Nên tệp này BỌC nó cho kho thường, và chỉ kho EQUI dùng bản riêng.
// ⚠️ Bản EQUI là bản CHÉP thân component gốc (chỉ khác chữ) — sửa hành vi bên đó thì soi lại bên này.
// ============================================================

/** Dùng thay `LienKetAnhQlkCtr` ở màn nghiệp vụ của kho: tự chọn bản theo kho đang mở. */
export function LienKetAnhKho({ anh, className }: { anh: AnhTuQlkCtr; className?: string }) {
  const kho = useKhoHienTai();
  if (kho !== "equi") return <LienKetAnhQlkCtr anh={anh} className={className} />;
  return <LienKetAnhEqui anh={anh} className={className} />;
}

/** Bản kho EQUI — chép thân `LienKetAnhQlkCtr`, chỉ đổi chữ nói nguồn ảnh. */
function LienKetAnhEqui({ anh, className }: { anh: AnhTuQlkCtr; className?: string }) {
  const [dangTai, setDangTai] = useState(false);
  const [moXem, setMoXem] = useState(false);

  async function tai() {
    setDangTai(true);
    try {
      const res = await fetch(anh.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const diaChi = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = diaChi;
      a.download = anh.ten;
      a.click();
      URL.revokeObjectURL(diaChi);
    } catch {
      toast.error("Không tải được ảnh", {
        description: `Không lấy được nội dung từ ${TEN_APP_EQUI}. Kiểm tra mạng rồi thử lại.`,
      });
    } finally {
      setDangTai(false);
    }
  }

  return (
    <span className={`flex min-w-0 items-center gap-1.5 ${className ?? ""}`}>
      <ImageIcon className="size-3.5 shrink-0 text-text-desc" aria-hidden />
      <button
        type="button"
        onClick={() => setMoXem(true)}
        title={`Xem ${anh.ten}`}
        className="min-w-0 truncate text-left text-primary hover:underline"
      >
        {anh.ten}
      </button>
      <span className="shrink-0 text-xs text-text-desc">từ {TEN_APP_EQUI}</span>
      <button
        type="button"
        onClick={() => void tai()}
        disabled={dangTai}
        aria-label={`Tải ${anh.ten} về máy`}
        title="Tải về máy"
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-text-desc transition-colors hover:bg-muted hover:text-primary disabled:opacity-60"
      >
        {dangTai ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Download className="size-3.5" aria-hidden />
        )}
      </button>

      <Dialog open={moXem} onOpenChange={(v: boolean) => !v && setMoXem(false)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="min-w-0 truncate">{anh.ten}</DialogTitle>
            <DialogDescription>Ảnh phiếu giao — thủ kho tải lên qua {TEN_APP_EQUI}</DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[70vh] min-h-64 items-center justify-center overflow-auto rounded-lg border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={anh.url} alt={anh.ten} className="max-h-[70vh] w-auto max-w-full object-contain" />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" nativeButton={false} render={<a href={anh.url} target="_blank" rel="noreferrer" />}>
              <ExternalLink className="size-4" aria-hidden />
              Mở tab mới
            </Button>
            <Button onClick={() => void tai()} disabled={dangTai}>
              {dangTai ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
              Tải về máy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </span>
  );
}
