"use client";

// ============================================================
// Ô NHẬP "ĐÃ TRẢ" NGAY TRÊN DÒNG TỜ HOÁ ĐƠN — bảng Công nợ.
//
// ★ Sếp 25/09/2026: ***"Tạo trường có thể nhập liệu trực tiếp. Số tiền nhập phải có dấu ngăn
// cách đơn vị"*** (khoanh cột "Đã trả" của dòng tờ hoá đơn).
//
// 🔴 KHÔNG MỞ SỔ TIỀN THỨ HAI. Ô này KHÔNG ghi đè một con số "đã trả" nào — nó TẠO MỘT ĐỢT THANH
// TOÁN (ngày chi = hôm nay) GẮN ĐÚNG TỜ NÀY, qua chính `themDotThanhToan` mà khối "Các đợt đã thanh
// toán" dùng. Tiền vẫn nằm trong một sổ duy nhất, nên tổng đã trả của đơn không bao giờ đếm hai
// lần, và đợt vừa ghi hiện ngay trong khối đợt bên dưới (sửa / xoá ở đó).
//
// 🔴 CHỈ LƯU KHI BẤM NÚT HOẶC ENTER, KHÔNG LƯU KHI RỜI Ô. Đây là ghi TIỀN: lưu lúc rời ô thì người
// dùng gõ thử rồi bấm chỗ khác là đã sinh một khoản chi thật trong sổ.
//
// 📌 Chỉ VẼ và gọi hàm ghi — luật kiểm (số tiền > 0, tờ thuộc đúng đơn, ai được ghi) nằm ở tầng
// ghi `kho-du-lieu.tsx`. Ở đây chỉ hiện lại câu lỗi.
// ============================================================

import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { chamNganCachNghin, formatCurrencyVnd, homNayISO } from "@/6-tien-ich/dinh-dang";
import type { NgayISO } from "@/3-du-lieu/kieu-du-lieu";

export function ONhapDaTra({
  poId,
  hoaDonId,
  soHoaDon,
  daTra,
  onThem,
}: {
  poId: string;
  hoaDonId: string;
  soHoaDon: string;
  /** Đã trả hiện có của tờ — hiện ngay dưới ô để người nhập biết đang cộng thêm vào đâu. */
  daTra: number;
  onThem: (dot: {
    poId: string;
    ngayChi: NgayISO;
    soTien: number;
    hoaDonId?: string;
  }) => string | null;
}) {
  const [chuoi, setChuoi] = useState("");

  function luu() {
    const soTien = Number(chuoi.replace(/\D/g, ""));
    if (!soTien) return;
    const loi = onThem({ poId, ngayChi: homNayISO() as NgayISO, soTien, hoaDonId });
    if (loi) {
      toast.error("Chưa ghi được số tiền đã trả", { description: loi });
      return;
    }
    toast.success(`Đã ghi ${formatCurrencyVnd(soTien)} cho hoá đơn ${soHoaDon}`, {
      description: "Ghi thành một đợt thanh toán hôm nay — sửa hoặc xoá ở khối “Các đợt đã thanh toán”.",
    });
    setChuoi("");
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-1">
        <input
          id={`da-tra-${hoaDonId}`}
          inputMode="numeric"
          aria-label={`Số tiền trả thêm cho hoá đơn ${soHoaDon}`}
          placeholder="+ số tiền"
          value={chuoi}
          onChange={(e) => setChuoi(chamNganCachNghin(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") luu();
            if (e.key === "Escape") setChuoi("");
          }}
          className="h-11 w-full min-w-0 rounded-lg border border-input bg-card px-2 text-right text-sm tabular-nums outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 md:h-9"
        />
        {chuoi && (
          <button
            type="button"
            onClick={luu}
            aria-label="Lưu số tiền đã trả"
            title="Lưu (hoặc bấm Enter)"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary/90 md:size-9"
          >
            <Check className="size-4" aria-hidden />
          </button>
        )}
      </div>
      {/* Chỉ hiện khi ĐÃ có tiền — chữ "chưa trả" dưới ô làm dòng cao lệch khỏi các ô bên cạnh
          (Sếp 25/09/2026: *"Canh dòng thẳng hàng ngay ngắn"*); ô trống đã tự nói là chưa trả. */}
      {daTra > 0 && (
        <span className="text-xs tabular-nums text-text-desc">đã trả {formatCurrencyVnd(daTra)}</span>
      )}
    </div>
  );
}
