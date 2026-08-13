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
      {/* `max-w-4xl` + `max-h-[90vh]`: pop-up CĂN GIỮA màn hình (mặc định của Dialog) và
          rộng gần hết màn để đọc được chữ trên phiếu chụp bằng điện thoại. */}
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="min-w-0 truncate">{tep.tenTep}</DialogTitle>
          <DialogDescription>
            {coTep(tep.kichThuoc)} · {tep.nguoiTaiTen}
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[70vh] min-h-64 items-center justify-center overflow-auto rounded-lg border border-border bg-muted">
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
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={diaChi}
              alt={tep.tenTep}
              className="max-h-[70vh] w-auto max-w-full object-contain"
            />
          ) : diaChi ? (
            <iframe src={diaChi} title={tep.tenTep} className="h-[70vh] w-full" />
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
