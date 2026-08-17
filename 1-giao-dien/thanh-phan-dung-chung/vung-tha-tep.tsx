"use client";

import { useEffect, useState } from "react";
import { CloudUpload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  CO_TOI_DA,
  KIEU_CHO_PHEP,
  catTep,
  chuoiKieuChoPhep,
  laKieuTepChoPhep,
  type MoTaTep,
} from "@/3-du-lieu/kho-tep";
import { cn } from "@/6-tien-ich/gop-lop";

/**
 * 🔴 CHỐT CHẶN THẢ TỆP RA NGOÀI VÙNG — thêm 17/08/2026.
 *
 * VÌ SAO PHẢI CÓ: mời người dùng kéo tệp là chấp nhận việc họ thả lệch. Mà hành vi MẶC ĐỊNH
 * của trình duyệt khi nhận một tệp thả vào trang là **mở tệp đó và thay luôn cả trang app** —
 * đang xem hồ sơ, thả trượt 20px là màn hình biến thành cái tệp PDF vừa kéo, mọi hộp thoại
 * đang mở và ô đang nhập dở mất sạch. Trước 17/08/2026 app không có chỗ nào mời kéo thả nên
 * chưa gặp; đúng lần này mới sinh ra nguy cơ, nên chốt chặn phải đi kèm luôn.
 *
 * Cách chặn: nghe ở mức `document`, nhưng chỉ ra tay khi vùng thả CHƯA nhận sự kiện.
 * `e.defaultPrevented` là chỗ phân biệt — vùng thả đã gọi `preventDefault` thì nghĩa là con
 * trỏ đang ở trong vùng, để yên cho nó (giữ con trỏ "copy"). Ngoài vùng thì đặt
 * `dropEffect = "none"` cho con trỏ báo KHÔNG THẢ ĐƯỢC, rồi `preventDefault` để trình duyệt
 * không mở tệp.
 *
 * ⚠️ CHỈ CHẶN DRAG CÓ MANG TỆP (`types` chứa `"Files"`). Kéo thả THẺ trên bảng quy trình mua
 * hàng (`bang-quy-trinh-mua-hang.tsx`, chỉ đạo Ban lãnh đạo phiên 04) mang dữ liệu chữ chứ
 * không mang tệp, nên không bị chốt này chạm tới. Thêm nữa listener chỉ tồn tại khi có ít nhất
 * một vùng thả đang hiển thị — bảng quy trình nằm ở trang danh sách, nơi không có vùng thả nào.
 */
let soVungDangMo = 0;

function chanThaRaNgoaiVung(e: DragEvent) {
  if (!e.dataTransfer) return;
  if (!Array.from(e.dataTransfer.types).includes("Files")) return;
  // Vùng thả đã nhận sự kiện này rồi (nó gọi `preventDefault`) — không giành lại.
  if (e.defaultPrevented) return;
  e.dataTransfer.dropEffect = "none";
  e.preventDefault();
}

/**
 * Đếm số vùng đang hiển thị thay vì mỗi vùng tự gắn một listener: trang chi tiết đề nghị có
 * SÁU bước, tức sáu vùng thả cùng lúc — sáu listener làm cùng một việc là thừa, và tháo không
 * khớp thì còn sót lại sau khi rời trang.
 */
function ganChotChanTha() {
  soVungDangMo += 1;
  if (soVungDangMo > 1) return;
  document.addEventListener("dragover", chanThaRaNgoaiVung);
  document.addEventListener("drop", chanThaRaNgoaiVung);
}

function thaoChotChanTha() {
  soVungDangMo = Math.max(0, soVungDangMo - 1);
  if (soVungDangMo > 0) return;
  document.removeEventListener("dragover", chanThaRaNgoaiVung);
  document.removeEventListener("drop", chanThaRaNgoaiVung);
}

/**
 * VÙNG THẢ TỆP — một khung viền đứt nhận tệp bằng KÉO THẢ hoặc bấm để chọn.
 *
 * 🔴 Ban lãnh đạo 17/08/2026, ảnh chụp màn chi tiết đề nghị khoanh đỏ khu đính kèm:
 * *"thiết kế lại giao diện này chuyên nghiệp hơn"*.
 *
 * VÌ SAO DỰNG MỚI chứ không sửa `ODinhKemNhieuTep`: chỗ cũ là một cái NÚT nhỏ đứng cạnh một
 * DÒNG CHỮ ghi giới hạn — hai mảnh chắp vào nhau, và khi bước chưa có tệp nào thì cả khu chỉ
 * còn mỗi cái nút lửng lơ. Ở đây giới hạn nằm BÊN TRONG vùng, nên vùng tự nó là một khối
 * hoàn chỉnh, tự nói đủ việc phải làm mà không cần thêm câu hướng dẫn nào.
 *
 * ⚠️ `ODinhKemNhieuTep` VẪN CÒN NGUYÊN và vẫn đang dùng ở trang báo giá chi tiết và trang lập
 * đơn hàng — không xóa, không sửa nó trong lần này để khỏi đụng hai màn hình khác.
 *
 * 🔴 KÉO THẢ Ở ĐÂY LÀ THẬT, không phải chữ suông. Dự án đã từng dính lỗi "giao diện hứa một
 * việc app không làm" (chỗ tải báo giá cũ hiện tên tệp trong khi nội dung bị vứt đi), nên
 * dòng chữ *"Kéo thả tệp vào đây"* chỉ được viết khi các sự kiện `dragover`/`drop` phía dưới
 * làm việc thật. Ai bỏ phần xử lý kéo thả đi thì phải bỏ luôn câu chữ đó.
 */

export function VungThaTep({
  conNhan,
  onThem,
  nguoi,
}: {
  /**
   * Số tệp CÒN NHẬN THÊM được (không phải tổng cho phép).
   *
   * 🔴 Người gọi tự trừ ra từ chốt chặn thật ở tầng dữ liệu rồi truyền vào — vùng này không
   * tự biết luật của nghiệp vụ nào. Truyền `<= 0` thì đừng vẽ nó ra nữa.
   */
  conNhan: number;
  /** Gọi khi đã CẤT XONG tệp vào kho tệp. Danh sách rỗng thì không gọi. */
  onThem: (moi: MoTaTep[]) => void;
  nguoi: { uid: string; ten: string };
}) {
  /** `null` = đang rảnh. Có giá trị = đang cất, kèm số tệp đã xong / tổng số phải cất. */
  const [dangCat, setDangCat] = useState<{ xong: number; tong: number } | null>(null);
  /** Có tệp đang được rê ngang qua vùng này không — chỉ để đổi màu cho thấy sẽ thả được. */
  const [dangKeo, setDangKeo] = useState(false);

  // Còn một vùng thả nào đang hiển thị thì còn chốt chặn thả ra ngoài — xem chú thích ở trên.
  useEffect(() => {
    ganChotChanTha();
    return thaoChotChanTha;
  }, []);

  /**
   * Chuột đang rê có mang TỆP không.
   *
   * ⚠️ Trong `dragover` trình duyệt KHÔNG cho đọc nội dung `dataTransfer` (chống trang web
   * đọc trộm tệp khi người dùng mới chỉ rê qua). Chỉ đọc được `types`. Nên ở đây không thể
   * biết tên hay cỡ tệp trước khi thả — mọi việc kiểm tra phải đợi tới lúc `drop`.
   */
  function keoTheoTep(e: React.DragEvent<HTMLElement>): boolean {
    return Array.from(e.dataTransfer.types).includes("Files");
  }

  async function nhanTep(ds: File[]) {
    if (dangCat) return;

    /**
     * 🔴 Lọc kiểu tệp Ở ĐÂY VÌ KÉO THẢ KHÔNG ĐI QUA `accept`. Thuộc tính `accept` của ô chọn
     * tệp chỉ lọc trong hộp thoại của hệ điều hành. `catTep` cũng chặn lần nữa ở tầng dữ
     * liệu; lọc sớm ở đây chỉ để nói gọn "bỏ qua N tệp" thay vì bắn N thông báo lỗi.
     */
    const dungLoai = ds.filter((f) => laKieuTepChoPhep(f.name));
    if (dungLoai.length < ds.length) {
      toast.error(`Bỏ qua ${ds.length - dungLoai.length} tệp không đúng định dạng`, {
        description: `Bước này chỉ nhận: ${chuoiKieuChoPhep()}.`,
      });
    }
    if (dungLoai.length === 0) return;

    /**
     * 🔴 THỪA TỆP THÌ PHẢI NÓI RA. Cắt bớt im lặng là người dùng kéo 8 tệp vào, thấy 3 tệp
     * hiện lên, tưởng 5 tệp kia đang tải — rồi đóng trang. Hồ sơ thiếu chứng từ mà không ai
     * biết, đúng cái bẫy CLAUDE.md mục 3.5 cấm.
     */
    const nhan = dungLoai.slice(0, conNhan);
    if (nhan.length < dungLoai.length) {
      toast.error(`Bước này chỉ nhận thêm được ${conNhan} tệp`, {
        description: `${dungLoai.length - nhan.length} tệp chưa được đính kèm. Gỡ bớt tệp cũ rồi thêm lại.`,
      });
    }

    setDangCat({ xong: 0, tong: nhan.length });
    const moi: MoTaTep[] = [];
    // Từng tệp một: một tệp quá cỡ hoặc đứt mạng giữa chừng không được làm hỏng cả lượt.
    for (const f of nhan) {
      try {
        moi.push(await catTep(f, nguoi));
      } catch (e) {
        // 🔴 Cất hỏng thì KHÔNG đẩy tệp đó ra ngoài — tên tệp không bao giờ được hiện lên
        // như đã lưu xong trong khi nội dung chưa đi đâu cả.
        toast.error(`Không đính kèm được ${f.name}`, {
          description: e instanceof Error ? e.message : "Không lưu được tệp.",
        });
      }
      setDangCat((truoc) => (truoc ? { xong: truoc.xong + 1, tong: truoc.tong } : truoc));
    }
    setDangCat(null);
    if (moi.length > 0) onThem(moi);
  }

  const dongChinh = dangCat
    ? `Đang lưu lên máy chủ… ${dangCat.xong}/${dangCat.tong} tệp`
    : dangKeo
      ? "Thả tệp vào đây"
      : "Kéo thả tệp vào đây hoặc bấm để chọn";

  const dongPhu = dangCat
    ? "Tệp đang được đưa lên máy chủ, đừng rời trang cho tới khi xong."
    : `Còn nhận thêm ${conNhan} tệp · tối đa ${CO_TOI_DA / 1024 / 1024}MB mỗi tệp · ${chuoiKieuChoPhep()}`;

  return (
    /**
     * 🔴 `relative` LÀ BẮT BUỘC, không phải để trang trí. Ô chọn tệp bên trong mang lớp
     * `sr-only` (`position:absolute`); không có tổ tiên nào `position:relative` thì nó bám
     * vào khung chứa gốc, thoát khỏi `overflow-x-hidden` của vùng nội dung và kéo giãn cả
     * trang trên điện thoại. Dự án đã dính đúng lỗi này ở bảng Kanban.
     *
     * 📌 Vẫn dùng `sr-only` chứ không `hidden`: ô `display:none` thì bàn phím không tab tới
     * được, người không dùng chuột mất luôn đường đính kèm tệp.
     */
    <label
      className={cn(
        /* 🔴 THẤP LẠI — Ban lãnh đạo 17/08/2026: *"phạm vi này thì hẹp lại"*. Bản đầu để
           `min-h-24` (96px) + `py-4`; khối giai đoạn có tới sáu khu đính kèm nên sáu ô cao
           như vậy đẩy phần việc thật xuống quá sâu. Nay `min-h-16` (64px) + `py-3` — vẫn
           thừa vùng chạm 44px và vẫn đủ rộng để thả tệp trúng. */
        "relative flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed px-4 py-3 text-center transition-colors",
        "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary",
        dangCat
          ? // Khóa vùng trong lúc cất: bấm thêm lượt nữa lúc này là chồng chéo, và
            // `pointer-events-none` cũng chặn luôn thả tệp vào giữa chừng.
            "pointer-events-none border-border bg-muted"
          : dangKeo
            ? "cursor-copy border-primary bg-primary-bg"
            : "cursor-pointer border-border bg-card hover:border-primary hover:bg-primary-bg",
      )}
      onDragEnter={(e) => {
        if (!keoTheoTep(e)) return;
        e.preventDefault();
        setDangKeo(true);
      }}
      onDragOver={(e) => {
        if (!keoTheoTep(e)) return;
        // 🔴 PHẢI `preventDefault` Ở MỖI LẦN `dragover`, không chỉ lần đầu. Thiếu nó thì
        // trình duyệt coi đây là chỗ không nhận được và sự kiện `drop` KHÔNG BAO GIỜ chạy.
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setDangKeo(true);
      }}
      onDragLeave={(e) => {
        // Rê qua chữ hay biểu tượng bên trong cũng bắn `dragleave`; kiểm xem con trỏ có thật
        // sự ra khỏi vùng chưa, nếu không thì viền nhấp nháy liên tục lúc đang rê.
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setDangKeo(false);
      }}
      onDrop={(e) => {
        if (!keoTheoTep(e)) return;
        // Thiếu dòng này thì trình duyệt tự mở tệp vừa thả và thay luôn cả trang app.
        e.preventDefault();
        setDangKeo(false);
        const ds = Array.from(e.dataTransfer.files);
        if (ds.length > 0) void nhanTep(ds);
      }}
    >
      <input
        type="file"
        multiple
        accept={KIEU_CHO_PHEP}
        className="sr-only"
        disabled={dangCat !== null}
        onChange={(e) => {
          const ds = e.target.files ? Array.from(e.target.files) : [];
          // Chép danh sách ra rồi xóa ô ngay, để chọn lại đúng tệp vừa bỏ vẫn kích hoạt
          // `onChange` (trình duyệt bỏ qua khi giá trị ô không đổi).
          e.target.value = "";
          if (ds.length > 0) void nhanTep(ds);
        }}
      />

      {dangCat ? (
        <Loader2 className="size-6 shrink-0 animate-spin text-primary" aria-hidden />
      ) : (
        <CloudUpload
          className={cn(
            "size-6 shrink-0 transition-colors",
            dangKeo ? "text-primary" : "text-text-desc",
          )}
          aria-hidden
        />
      )}

      {/* `aria-live` để trình đọc màn hình đọc lên tiến trình cất tệp — người không nhìn màn
          hình vẫn biết app đang chạy chứ không phải treo. */}
      <span className="text-sm font-medium text-text-primary" aria-live="polite">
        {dongChinh}
      </span>
      {/* 🔴 CHỮ NGHIÊNG — Ban lãnh đạo 17/08/2026: *"cái ghi chú nên dùng chữ in nghiêng"*.
          Dòng này là ghi chú về giới hạn, không phải việc phải làm; nghiêng nó thì mắt đọc
          dòng chính trước, đúng thứ bậc. */}
      <span className="text-xs text-text-desc italic">{dongPhu}</span>
    </label>
  );
}
