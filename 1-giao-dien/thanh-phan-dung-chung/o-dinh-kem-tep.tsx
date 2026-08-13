"use client";

import { useState } from "react";
import { AlertTriangle, Download, Eye, Paperclip, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  CO_TOI_DA,
  KIEU_CHO_PHEP,
  catTep,
  coTep,
  moTep,
  type MoTaTep,
  taiTep,
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
      toast.error("Không mở được tệp", {
        description:
          "Không tải được nội dung tệp từ máy chủ. Kiểm tra lại mạng rồi thử lại; nếu vẫn không được thì nhờ người tải lên đính kèm lại.",
      });
    }
  }

  /** Tải chứng từ về máy — xem `taiTep`, khác "xem" ở chỗ ép trình duyệt lưu file xuống. */
  async function tai() {
    if (!tep) return;
    const duoc = await taiTep(tep);
    if (!duoc) {
      toast.error("Không tải được tệp", {
        description: "Không lấy được nội dung từ máy chủ. Kiểm tra mạng rồi thử lại.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {tep ? (
        /* Bố cục HAI DÒNG, nút neo bên phải và KHÔNG bao giờ xuống hàng.
           🔴 Bản cũ để tất cả trên một hàng `flex-wrap`: gặp tên tệp dài (ảnh chụp từ điện
           thoại có tên cả trăm ký tự) là tên chiếm trọn hàng, đẩy nút "Xem" xuống dòng
           dưới, và `ml-auto` mất tác dụng — mỗi lần giao một kiểu cao thấp khác nhau. */
        <div className="flex items-center gap-3 rounded-lg border border-success bg-success-bg p-(--hp-md-row-pad)">
          <Paperclip className="size-4 shrink-0 text-success-soft" aria-hidden />

          {/* `min-w-0` là bắt buộc để `truncate` bên trong hoạt động: mặc định ô flex
              không co nhỏ hơn nội dung, nên thiếu nó thì chữ vẫn tràn ra. */}
          <span className="flex min-w-0 flex-col">
            <span
              className="truncate text-sm font-medium text-text-primary"
              title={tep.tenTep}
            >
              {rutGonTenTep(tep.tenTep)}
            </span>
            <span className="truncate text-xs text-text-desc">
              {coTep(tep.kichThuoc)} · {tep.nguoiTaiTen} · {formatMocThoiGian(tep.thoiDiem)}
            </span>
          </span>

          <span className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={xem}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
            >
              <Eye className="size-3.5 shrink-0" aria-hidden />
              Xem
            </button>
            {/* ★ TẢI VỀ — Ban lãnh đạo 13/08/2026: *"thêm chức năng xem và tải chứng từ
                về"*. Xem chỉ đủ để kiểm tra trên màn hình; kế toán và người lưu hồ sơ cần
                bản tệp thật để in, gửi kèm email, nộp kiểm toán. */}
            <button
              type="button"
              onClick={tai}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
            >
              <Download className="size-3.5 shrink-0" aria-hidden />
              Tải về
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

      {/* ⚠️ HAI CÂU KHÁC NHAU CHO HAI TRẠNG THÁI, cố ý không dùng chung một câu dài.
          Bản cũ luôn in cả đoạn hướng dẫn + cảnh báo, nên màn có 2–3 lần giao là đoạn đó
          lặp lại 2–3 lần, dài hơn cả nội dung chính. Nay:
            · Chưa có tệp → hướng dẫn định dạng và dung lượng (lúc này mới cần).
            · Đã có tệp  → chỉ còn MỘT câu cảnh báo ngắn về chỗ lưu.
          Vẫn giữ cảnh báo khi đã có tệp vì đó đúng là lúc người dùng dễ tưởng nhầm đã lưu
          lên hệ thống — xem chú thích đầu file. */}
      {/* 🔴 BỎ CÂU "máy khác chưa mở xem được" — từ 12/08/2026 tệp ĐÃ lên máy chủ nên máy
          khác mở được. Giữ câu cũ là nói sai về chính thứ app vừa làm được, và người dùng sẽ
          vẫn gửi tệp cho nhau qua Zalo dù không cần nữa. */}
      {!tep && (
        <p className="text-xs text-text-desc">
          Nhận PDF, ảnh, Word, Excel · tối đa {CO_TOI_DA / 1024 / 1024}MB. Tệp được lưu lên máy
          chủ nên người khác mở xem được.
        </p>
      )}
    </div>
  );
}

/**
 * Rút gọn tên tệp quá dài, GIỮ LẠI PHẦN ĐUÔI.
 *
 * 🔴 Không dùng mỗi `truncate` của CSS: nó cắt cụt đuôi, mà đuôi mới là thứ cho biết đây là
 * ảnh hay PDF — người duyệt hồ sơ cần biết đang mở loại tệp gì. Ảnh chụp từ điện thoại có
 * tên kiểu `1785921223805_1967909016357413267_..._cf8460c5.jpg`, cắt cụt là mất luôn `.jpg`.
 *
 * Vẫn giữ `truncate` ở lớp CSS làm lưới an toàn cho màn hình rất hẹp.
 * Tên đầy đủ nằm ở thuộc tính `title` — rê chuột là xem được.
 */
export function rutGonTenTep(ten: string, toiDa = 48): string {
  if (ten.length <= toiDa) return ten;
  const cham = ten.lastIndexOf(".");
  // Không có đuôi, hoặc "đuôi" dài bất thường (không phải phần mở rộng thật) → cắt bình thường.
  if (cham <= 0 || ten.length - cham > 8) return `${ten.slice(0, toiDa - 1)}…`;
  const duoi = ten.slice(cham);
  const dau = ten.slice(0, Math.max(1, toiDa - duoi.length - 1));
  return `${dau}…${duoi}`;
}
