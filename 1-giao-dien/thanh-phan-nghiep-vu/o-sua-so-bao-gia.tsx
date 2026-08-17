"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";

/**
 * Ô SỬA "SL BÁO GIÁ" ngay trong phần ĐẦU VÀO của bước ② — Ban lãnh đạo 17/08/2026:
 * *"phần đầu vào thêm chức năng sửa số lượng báo giá"*.
 *
 * Trước đó con số này chỉ đặt được MỘT LẦN, lúc trưởng bộ phận kéo phiếu sang bước ② (hộp
 * chuyển giai đoạn). Đặt xong không sửa được nữa — mà thực tế hay phải đổi: thị trường chỉ
 * còn hai nhà cung cấp bán mặt hàng đó, hoặc ngược lại hàng lớn cần hỏi thêm bên thứ tư.
 * Không sửa được thì con số trên phiếu sai so với việc đang làm thật.
 *
 * 🔴 KHÔNG cho sửa thành 0. Yêu cầu "lấy 0 báo giá" nghĩa là mua không so giá — muốn vậy thì
 * phải là một quyết định có người chịu trách nhiệm, không phải một ô nhập lặng lẽ về 0.
 */

/** Chặn trên cho số báo giá. Không phải luật công ty, chỉ là ngưỡng bắt lỗi gõ nhầm. */
const SO_BAO_GIA_TOI_DA = 20;

export function OSuaSoBaoGia({
  soHienTai,
  duocSua,
  onLuu,
}: {
  /** Số báo giá đang yêu cầu. `undefined` = chưa ai đặt. */
  soHienTai?: number;
  /** Đủ quyền và hồ sơ chưa đóng. Không đủ thì chỉ hiện con số. */
  duocSua: boolean;
  onLuu: (so: number) => void;
}) {
  const [dangSua, setDangSua] = useState(false);
  const [nhap, setNhap] = useState(String(soHienTai ?? ""));

  function luu() {
    const so = Number(nhap);
    if (!Number.isInteger(so) || so < 1) {
      toast.error("Số báo giá phải là số nguyên từ 1 trở lên");
      return;
    }
    if (so > SO_BAO_GIA_TOI_DA) {
      toast.error(`Số báo giá tối đa là ${SO_BAO_GIA_TOI_DA}`);
      return;
    }
    onLuu(so);
    setDangSua(false);
  }

  if (!duocSua) {
    return (
      <span className="text-sm font-medium text-text-primary">{soHienTai ?? "—"}</span>
    );
  }

  if (!dangSua) {
    return (
      <span className="flex items-center gap-1">
        <span className="text-sm font-medium text-text-primary">{soHienTai ?? "—"}</span>
        {/* Vùng chạm 44×44 theo Design System V1.1. */}
        <button
          type="button"
          onClick={() => {
            setNhap(String(soHienTai ?? ""));
            setDangSua(true);
          }}
          className="flex size-11 items-center justify-center rounded-lg text-text-desc transition-colors hover:bg-muted hover:text-primary"
          aria-label="Sửa số lượng báo giá cần lấy"
          title="Sửa số lượng báo giá"
        >
          <Pencil className="size-3.5" aria-hidden />
        </button>
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Input
        type="number"
        min={1}
        max={SO_BAO_GIA_TOI_DA}
        value={nhap}
        autoFocus
        onChange={(e) => setNhap(e.target.value)}
        // Enter để lưu, Esc để bỏ — người nhập liệu quen tay không phải rời bàn phím.
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            luu();
          }
          if (e.key === "Escape") setDangSua(false);
        }}
        className="h-11 w-20"
        aria-label="Số lượng báo giá cần lấy"
      />
      <Button size="sm" onClick={luu}>
        <Check className="size-4" aria-hidden />
        Lưu
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setDangSua(false)}>
        <X className="size-4" aria-hidden />
        Hủy
      </Button>
    </span>
  );
}
