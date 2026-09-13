"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, ExternalLink, FileWarning, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { coTep, layTep, taiTep, type MoTaTep } from "@/3-du-lieu/kho-tep";

/**
 * HỘP XEM CHỨNG TỪ — Ban lãnh đạo 13/08/2026: *"chức năng xem trong pop-up, e cài mặc định
 * căn giữa màn hình nha"*.
 *
 * 🔴 Trước đó bấm tên tệp là MỞ TAB MỚI. Xem một phiếu giao nhận mà phải nhảy tab, xem xong
 * đóng tab quay lại — mỗi lần đối chiếu 5 phiếu là 5 lần nhảy, và dễ mất chỗ đang làm. Nay
 * xem ngay trong pop-up giữa màn hình, đóng lại là về đúng chỗ cũ.
 *
 * ⚠️ KHÔNG PHẢI LOẠI TỆP NÀO CŨNG XEM ĐƯỢC TRONG TRÌNH DUYỆT. Ảnh và PDF thì được; Word,
 * Excel thì không — trình duyệt không đọc được chúng. Với những loại đó phải nói thẳng và
 * mời tải về, chứ không hiện khung trống để người dùng ngồi chờ một thứ không bao giờ tới.
 *
 * 📌 Thu hồi địa chỉ tạm khi đóng hộp. Không thu hồi thì mỗi lần xem giữ thêm một bản tệp
 * trong bộ nhớ trình duyệt cho tới lúc đóng tab — xem 20 ảnh phiếu giao nhận là hơn 50MB.
 */
export function HopXemTep({
  tep,
  mo,
  onDong,
}: {
  /** `null` khi chưa chọn tệp nào — hộp vẫn dựng để hiệu ứng đóng chạy hết. */
  tep: MoTaTep | null;
  mo: boolean;
  onDong: () => void;
}) {
  const [diaChi, setDiaChi] = useState<string | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  const kieu = tep?.kieuMime ?? "";
  const laAnh = kieu.startsWith("image/");
  const laPdf = kieu === "application/pdf";
  const xemDuoc = laAnh || laPdf;

  useEffect(() => {
    if (!mo || !tep || !xemDuoc) return;
    let huy = false;
    let dc: string | null = null;
    setDangTai(true);
    setLoi(null);
    void layTep(tep.id)
      .then((blob) => {
        if (huy) return;
        if (!blob) {
          setLoi("Không lấy được nội dung tệp từ máy chủ. Kiểm tra mạng rồi thử lại.");
          return;
        }
        dc = URL.createObjectURL(blob);
        setDiaChi(dc);
      })
      .catch(() => {
        if (!huy) setLoi("Không đọc được tệp. Có thể tệp đã bị xóa khỏi máy chủ.");
      })
      .finally(() => {
        if (!huy) setDangTai(false);
      });

    return () => {
      huy = true;
      // Thu hồi ngay khi đóng hộp / đổi tệp — xem chú thích đầu component.
      if (dc) URL.revokeObjectURL(dc);
      setDiaChi(null);
    };
  }, [mo, tep?.id, xemDuoc]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tep) return null;

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      {/* Pop-up CĂN GIỮA màn hình (mặc định của Dialog) và rộng gần hết màn để đọc được chữ trên
          phiếu chụp bằng điện thoại.

          🐛 SỬA LỖI THẬT 13/09/2026 — CHÚ THÍCH CŨ NÓI DỐI. Nó ghi *"`max-w-4xl` + `max-h-[90vh]`"*
          nhưng className thực tế CHỈ có `sm:max-w-4xl` — `max-h-[90vh]` **chưa bao giờ được viết**.
          Hậu quả: lớp gốc (`nen-tang-ui/dialog.tsx`) căn giữa bằng `top-1/2` + `-translate-y-1/2`
          và KHÔNG khai `max-h` lẫn `overflow`, nên khi khung ảnh `max-h-[70vh]` cộng thêm tiêu đề +
          hàng nút + `p-4` + `gap-4` thì tổng vượt quá chiều cao màn hình — phần trên và phần dưới
          TRÀN RA NGOÀI MÀN, không cuộn tới được. Cửa sổ càng thấp càng nặng.

          🔴 `grid-rows-[auto_minmax(0,1fr)_auto]` là mấu chốt, đừng bỏ: lớp gốc là `grid` (KHÔNG
          phải flex), và hộp có đúng 3 phần con — tiêu đề · khung xem · hàng nút. `minmax(0,1fr)`
          cho hàng giữa co lại được tới 0 nên nó nhận phần cao còn thừa và tự cuộn bên trong, thay
          vì tự đặt `70vh` rồi đẩy hai hàng kia ra khỏi màn.

          ⚠️ `max-w` PHẢI giữ tiền tố `sm:` (lớp gốc đã có `sm:max-w-sm`, viết trơn là bị đè im
          lặng — luật CLAUDE.md §5). Còn `max-h` viết trơn ĐƯỢC vì lớp gốc không khai `max-h` nào. */}
      <DialogContent className="grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="min-w-0 truncate">{tep.tenTep}</DialogTitle>
          <DialogDescription>
            {coTep(tep.kichThuoc)} · {tep.nguoiTaiTen}
          </DialogDescription>
        </DialogHeader>

        {/* 🐛 SỬA 13/09/2026: bỏ `max-h-[70vh] min-h-64`, thay bằng `min-h-0`.
            · `max-h-[70vh]` là chiều cao TỰ ĐẶT, không biết gì về tiêu đề và hàng nút phía trên
              dưới — chính nó làm tổng vượt màn hình. Nay hàng giữa ăn theo chiều cao hộp
              (`minmax(0,1fr)` ở `DialogContent`), nên bỏ đi là đủ.
            · `min-h-0` BẮT BUỘC: mặc định ô lưới có `min-height:auto`, tức KHÔNG co nhỏ hơn nội
              dung — ảnh cao 3000px sẽ đẩy hộp phình ra thay vì cuộn bên trong. Đây đúng mắt xích
              mà CLAUDE.md §7 nhắc ("thân cột cần `min-h-0` để cuộn được bên trong cột").
            · Bỏ `min-h-64`: nó xung khắc với `min-h-0`. Khung rỗng vẫn đủ cao nhờ `p-8` của các
              nhánh thông báo bên trong. */}
        <div className="flex min-h-0 items-center justify-center overflow-auto rounded-lg border border-border bg-muted">
          {!xemDuoc ? (
            /* Nói THẲNG loại tệp này không xem được trong trình duyệt, kèm đường tải về —
               thay vì để khung trống rồi người dùng tưởng app hỏng. */
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <FileWarning className="size-8 text-text-desc" aria-hidden />
              <p className="text-sm font-medium text-text-primary">
                Loại tệp này không xem trực tiếp được
              </p>
              <p className="max-w-sm text-xs text-text-desc">
                Trình duyệt chỉ mở được ảnh và PDF. Tệp Word / Excel phải tải về máy rồi mở
                bằng ứng dụng tương ứng.
              </p>
            </div>
          ) : dangTai ? (
            <span className="flex items-center gap-2 p-8 text-sm text-text-desc">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Đang tải nội dung tệp…
            </span>
          ) : loi ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <FileWarning className="size-8 text-danger-soft" aria-hidden />
              <p className="max-w-sm text-sm text-text-secondary">{loi}</p>
            </div>
          ) : diaChi && laAnh ? (
            /* 🐛 SỬA 13/09/2026: `max-h-[70vh]` → `max-h-full`. Ảnh nay bị bó trong khung chứ
               không tự đo theo màn hình — khung đã bó theo hộp rồi.
               📌 Vẫn KHÔNG khai `width`/`height` cố định vì ảnh phiếu mỗi cái một cỡ; `object-contain`
               giữ đúng tỉ lệ. Chuyện "ảnh tải xong mới bung làm hộp nhảy cỡ" nay hết, vì chiều cao
               hộp do `max-h-[90vh]` quyết định chứ không do ảnh.
               ⚠️ Dòng `eslint-disable-next-line` phải nằm SÁT thẻ `<img>` — chèn chú thích vào giữa
               là nó mất tác dụng và lint kêu lại. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={diaChi}
              alt={tep.tenTep}
              className="max-h-full w-auto max-w-full object-contain"
            />
          ) : diaChi ? (
            /* 🐛 SỬA 13/09/2026: `h-[70vh]` → `h-full`, cùng lý do với ảnh — PDF lấp đầy khung
               chứ không tự đặt chiều cao theo màn hình. */
            <iframe src={diaChi} title={tep.tenTep} className="h-full w-full" />
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {/* Vẫn giữ đường mở tab mới: xem PDF nhiều trang trong pop-up chật, có người muốn
              mở hẳn ra để phóng to và cuộn thoải mái. */}
          {diaChi && (
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href={diaChi} target="_blank" rel="noreferrer" />}
            >
              <ExternalLink className="size-4" aria-hidden />
              Mở tab mới
            </Button>
          )}
          <Button
            onClick={() =>
              void taiTep(tep).then((duoc) => {
                if (!duoc) {
                  toast.error("Không tải được tệp", {
                    description: "Không lấy được nội dung từ máy chủ. Kiểm tra mạng rồi thử lại.",
                  });
                }
              })
            }
          >
            <Download className="size-4" aria-hidden />
            Tải về máy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
