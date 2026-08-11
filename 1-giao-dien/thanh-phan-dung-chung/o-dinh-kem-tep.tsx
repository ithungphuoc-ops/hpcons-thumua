"use client";

import { useState } from "react";
import { AlertTriangle, Eye, Paperclip, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  CO_TOI_DA,
  KIEU_CHO_PHEP,
  catTep,
  coTep,
  moTep,
  type MoTaTep,
} from "@/3-du-lieu/kho-tep";
import { formatMocThoiGian } from "@/6-tien-ich/dinh-dang";

/**
 * Ô ĐÍNH KÈM MỘT TỆP — dùng chung cho mọi chỗ cần gắn chứng từ vào hồ sơ.
 *
 * 🔴 TÁCH RA DÙNG CHUNG NGAY TỪ ĐẦU. Đã có hai chỗ cần (phiếu giao nhận của thủ kho, bản báo
 * giá nhà cung cấp) và theo quy trình còn nhiều chỗ nữa: hợp đồng, đơn có chữ ký, hóa đơn.
 * Chép đi chép lại thì mỗi chỗ một kiểu báo lỗi, một cỡ tệp tối đa, rồi lệch nhau.
 *
 * ⚠️ NÓI THẬT VỀ CHỖ LƯU. Tệp nằm trong trình duyệt của chính máy này (`kho-tep.ts`), chưa
 * lên máy chủ. Máy khác mở lên thấy tên tệp nhưng bấm xem thì không có nội dung — component
 * này phải nói ra điều đó, không được để người dùng tưởng đã lưu lên hệ thống.
 */
export function ODinhKemTep({
  /** Tệp đã đính kèm, `undefined` là chưa có. */
  tep,
  /** Nhãn nút khi chưa có tệp, vd "Đính kèm phiếu giao nhận". */
  nhanThem,
  /** Người đang thao tác — ghi lại ai đính kèm. */
  nguoi,
  /** Gọi sau khi cất tệp xong. Nơi gọi tự lo việc lưu vào hồ sơ. */
  onXong,
  /** Bắt buộc phải có tệp — hiện viền cảnh báo khi còn trống. */
  batBuoc = false,
  /** Khóa không cho đổi (VD hồ sơ đã chốt). */
  khoa = false,
}: {
  tep?: MoTaTep;
  nhanThem: string;
  nguoi: { uid: string; ten: string };
  onXong: (tep: MoTaTep) => void;
  batBuoc?: boolean;
  khoa?: boolean;
}) {
  const [dangCat, setDangCat] = useState(false);

  async function chonTep(f: File) {
    setDangCat(true);
    try {
      const mt = await catTep(f, nguoi);
      onXong(mt);
      toast.success("Đã đính kèm", { description: `${mt.tenTep} · ${coTep(mt.kichThuoc)}` });
    } catch (e) {
      // 🔴 PHẢI BÁO RA. Nuốt lỗi ở đây thì người dùng tưởng đã đính kèm xong trong khi
      // chẳng có gì được lưu — đúng cái bẫy mà chỗ tải báo giá cũ đã mắc.
      toast.error("Không đính kèm được", {
        description: e instanceof Error ? e.message : "Trình duyệt không cho lưu tệp.",
      });
    } finally {
      setDangCat(false);
    }
  }

  async function xem() {
    if (!tep) return;
    const duoc = await moTep(tep);
    if (!duoc) {
      toast.error("Không còn nội dung tệp", {
        description:
          "Tệp được lưu trong trình duyệt của máy đã đính kèm. Máy này không có bản sao — nhờ người tải lên gửi lại.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {tep ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-success bg-success-bg p-(--hp-md-row-pad)">
          <Paperclip className="size-4 shrink-0 text-success-soft" aria-hidden />
          <span className="text-sm font-medium text-text-primary">{tep.tenTep}</span>
          <span className="text-xs text-text-desc">
            {coTep(tep.kichThuoc)} · {tep.nguoiTaiTen} · {formatMocThoiGian(tep.thoiDiem)}
          </span>
          <span className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={xem}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
            >
              <Eye className="size-3.5 shrink-0" aria-hidden />
              Xem
            </button>
            {!khoa && (
              <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary">
                <input
                  type="file"
                  accept={KIEU_CHO_PHEP}
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void chonTep(f);
                  }}
                />
                <RefreshCw className="size-3.5 shrink-0" aria-hidden />
                Thay tệp
              </label>
            )}
          </span>
        </div>
      ) : (
        <label
          className={`inline-flex w-fit min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors ${
            khoa || dangCat
              ? "pointer-events-none border-border opacity-60"
              : batBuoc
                ? "cursor-pointer border-warning bg-warning-bg text-warning-soft hover:bg-warning hover:text-white"
                : "cursor-pointer border-border hover:border-primary hover:bg-muted"
          }`}
        >
          <input
            type="file"
            accept={KIEU_CHO_PHEP}
            className="sr-only"
            disabled={khoa || dangCat}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void chonTep(f);
            }}
          />
          {batBuoc ? (
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
          ) : (
            <Paperclip className="size-4 shrink-0" aria-hidden />
          )}
          {dangCat ? "Đang lưu tệp…" : nhanThem}
        </label>
      )}

      <p className="text-xs text-text-desc">
        Nhận PDF, ảnh, Word, Excel · tối đa {CO_TOI_DA / 1024 / 1024}MB.{" "}
        {/* ⚠️ Câu này là bắt buộc, không phải rườm rà — xem chú thích đầu file. */}
        <strong>Bản chạy thử lưu tệp trong trình duyệt máy này</strong>, chưa đưa lên máy chủ nên
        máy khác chưa mở xem được.
      </p>
    </div>
  );
}
