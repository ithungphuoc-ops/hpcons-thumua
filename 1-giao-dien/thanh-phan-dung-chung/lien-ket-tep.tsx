"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Paperclip } from "lucide-react";
import { HopXemTep } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xem-tep";
import { coTep, taiTep, type MoTaTep } from "@/3-du-lieu/kho-tep";

/**
 * MỘT CHỨNG TỪ ĐÍNH KÈM — bấm tên để XEM, bấm mũi tên để TẢI VỀ.
 *
 * 🔴 Ban lãnh đạo 13/08/2026: *"thêm chức năng xem và tải chứng từ về"*. Trước đó nhiều
 * chỗ chỉ in ra tên tệp dạng chữ thường — người dùng thấy *"Có phiếu giao nhận: 178592…jpg"*
 * mà không bấm được, tưởng app chưa lưu nội dung.
 *
 * 📌 GOM VÀO MỘT COMPONENT vì tệp đính kèm xuất hiện ở nhiều màn (phiếu giao nhận, bản báo
 * giá, tài liệu đề nghị). Mỗi nơi tự viết một kiểu thì chỗ mở được chỗ không, và câu báo
 * lỗi mỗi nơi một khác.
 *
 * ⚠️ Tệp nằm trên máy chủ nên tải về là việc CÓ THỂ HỎNG (mất mạng, mảnh thiếu). Phải báo
 * rõ khi hỏng — im lặng thì người dùng bấm mãi không thấy gì và không biết vì sao.
 */
export function LienKetTep({
  tep,
  /** Rút gọn tên dài cho khỏi vỡ khung. Trả về chính nó nếu nơi gọi không cần rút. */
  rutGon,
  className,
}: {
  tep: MoTaTep;
  rutGon?: (ten: string) => string;
  className?: string;
}) {
  const [dangTai, setDangTai] = useState(false);
  /**
   * ★ XEM TRONG POP-UP CĂN GIỮA MÀN HÌNH — Ban lãnh đạo 13/08/2026.
   *
   * 🔴 Trước đó bấm tên là mở TAB MỚI: xem xong phải đóng tab quay lại, đối chiếu 5 phiếu là
   * 5 lần nhảy tab và dễ mất chỗ đang làm. Nay xem tại chỗ, đóng lại là về đúng chỗ cũ.
   */
  const [moXem, setMoXem] = useState(false);

  async function tai() {
    setDangTai(true);
    try {
      const duoc = await taiTep(tep);
      if (!duoc) {
        toast.error("Không tải được tệp", {
          description: "Không lấy được nội dung từ máy chủ. Kiểm tra mạng rồi thử lại.",
        });
      }
    } finally {
      setDangTai(false);
    }
  }

  return (
    <span className={`flex min-w-0 items-center gap-1.5 ${className ?? ""}`}>
      <Paperclip className="size-3.5 shrink-0 text-text-desc" aria-hidden />
      <button
        type="button"
        onClick={() => setMoXem(true)}
        title={`Xem ${tep.tenTep}`}
        className="min-w-0 truncate text-left text-primary hover:underline"
      >
        {rutGon ? rutGon(tep.tenTep) : tep.tenTep}
      </button>
      <span className="shrink-0 text-xs text-text-desc">{coTep(tep.kichThuoc)}</span>
      <button
        type="button"
        onClick={() => void tai()}
        disabled={dangTai}
        aria-label={`Tải ${tep.tenTep} về máy`}
        title="Tải về máy"
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-text-desc transition-colors hover:bg-muted hover:text-primary disabled:opacity-60"
      >
        {dangTai ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Download className="size-3.5" aria-hidden />
        )}
      </button>

      <HopXemTep tep={tep} mo={moXem} onDong={() => setMoXem(false)} />
    </span>
  );
}
