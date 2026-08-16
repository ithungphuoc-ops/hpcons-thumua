"use client";

import { useState } from "react";
import { Eye, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { HopXemTep } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xem-tep";
import { rutGonTenTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { CO_TOI_DA, KIEU_CHO_PHEP, catTep, coTep, type MoTaTep } from "@/3-du-lieu/kho-tep";

/**
 * Ô ĐÍNH KÈM NHIỀU TỆP — dùng chung cho mọi chỗ cần gắn một BỘ chứng từ.
 *
 * Khác `ODinhKemTep` (một tệp, dùng cho phiếu giao nhận): ở đây một quyết định thường có
 * nhiều giấy tờ đi kèm — văn bản duyệt, email, báo giá gốc.
 *
 * 🔴 CẤT TỆP NGAY LÚC CHỌN, KHÔNG ĐỢI BẤM LƯU. Đẩy hỏng thì báo lỗi tại chỗ và không hiện tên
 * tệp. Làm ngược lại (hiện tên trước, đẩy sau) là lặp đúng cái bẫy của chỗ tải báo giá cũ:
 * người dùng thấy tên tệp, tin là đã lưu, mà nội dung chưa đi đâu cả.
 */
export function ODinhKemNhieuTep({
  tep,
  onDoi,
  nguoi,
  toiDa = 5,
  nhan = "Đính kèm",
}: {
  tep: MoTaTep[];
  onDoi: (moi: MoTaTep[]) => void;
  nguoi: { uid: string; ten: string };
  toiDa?: number;
  nhan?: string;
}) {
  const [dangCat, setDangCat] = useState(false);
  const [xemTep, setXemTep] = useState<MoTaTep | null>(null);

  async function themTep(ds: FileList) {
    const conNhan = toiDa - tep.length;
    if (conNhan <= 0) {
      toast.error("Đã đủ tệp", { description: `Tối đa ${toiDa} tệp.` });
      return;
    }
    setDangCat(true);
    const moi: MoTaTep[] = [];
    // Từng tệp một: một tệp quá cỡ không được làm hỏng cả lượt chọn.
    for (const f of Array.from(ds).slice(0, conNhan)) {
      try {
        moi.push(await catTep(f, nguoi));
      } catch (e) {
        toast.error(`Không đính kèm được ${f.name}`, {
          description: e instanceof Error ? e.message : "Không lưu được tệp.",
        });
      }
    }
    if (moi.length > 0) onDoi([...tep, ...moi]);
    setDangCat(false);
  }

  return (
    <div className="flex flex-col gap-2">
      {tep.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {tep.map((t) => (
            <li
              key={t.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-surface py-1 pr-1 pl-2.5"
            >
              <button
                type="button"
                onClick={() => setXemTep(t)}
                className="inline-flex min-w-0 items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-primary"
              >
                <Eye className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate" title={t.tenTep}>
                  {rutGonTenTep(t.tenTep, 30)}
                </span>
                <span className="shrink-0 text-text-desc">{coTep(t.kichThuoc)}</span>
              </button>
              <button
                type="button"
                onClick={() => onDoi(tep.filter((x) => x.id !== t.id))}
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-text-desc transition-colors hover:bg-danger-bg hover:text-danger"
                aria-label={`Bỏ tệp ${t.tenTep}`}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition-colors ${
            dangCat
              ? "pointer-events-none opacity-60"
              : "cursor-pointer hover:border-primary hover:bg-muted"
          }`}
        >
          <input
            type="file"
            multiple
            accept={KIEU_CHO_PHEP}
            className="sr-only"
            disabled={dangCat}
            onChange={(e) => {
              const ds = e.target.files;
              // Chép ra rồi xóa ô ngay, để chọn lại đúng tệp vừa bỏ vẫn kích hoạt onChange.
              const chep = ds ? new DataTransfer() : null;
              if (ds && chep) for (const f of Array.from(ds)) chep.items.add(f);
              e.target.value = "";
              if (chep && chep.files.length > 0) void themTep(chep.files);
            }}
          />
          <Paperclip className="size-4 shrink-0" aria-hidden />
          {dangCat ? "Đang lưu tệp…" : nhan}
        </label>
        {/* Giới hạn dung lượng là thông tin CẦN — ảnh chụp từ điện thoại rất dễ vượt cỡ, và
            không có cách nào tự đoán ra mức cho phép. */}
        <span className="text-xs text-text-desc">
          Tối đa {CO_TOI_DA / 1024 / 1024}MB mỗi tệp, {toiDa} tệp
        </span>
      </div>

      {xemTep && <HopXemTep tep={xemTep} mo onDong={() => setXemTep(null)} />}
    </div>
  );
}
