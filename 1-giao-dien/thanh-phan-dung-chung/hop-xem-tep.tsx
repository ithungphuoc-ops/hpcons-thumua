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
import { useDonDepHopThoaiKet } from "@/1-giao-dien/thanh-phan-dung-chung/don-dep-hop-thoai-ket";
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
 *
 * ---
 * 🔴 CÁCH GỌI ĐÚNG — sai là cả app đơ phải F5 (sự cố 13/09/2026, xem chú thích trong thân hàm):
 *
 *     ✅ <HopXemTep tep={xemTep} mo={xemTep !== null} onDong={() => setXemTep(null)} />
 *     ❌ {xemTep && <HopXemTep tep={xemTep} mo onDong={() => setXemTep(null)} />}
 *
 * Cách ❌ sai ở HAI điểm cộng lại: `mo` viết trơn nên prop `open` KHÔNG BAO GIỜ về `false`, và
 * `{xemTep && ...}` làm cả `<Dialog>` biến mất khỏi cây React ngay trong cùng một lần commit —
 * base-ui không kịp chạy hàm dọn, để kẹt `overflow:hidden` trên `<body>` cùng
 * `data-base-ui-inert` / `aria-hidden` trên khối nội dung chính.
 */
export function HopXemTep({
  tep,
  mo,
  onDong,
}: {
  /**
   * `null` khi chưa chọn tệp nào — hộp VẪN DỰNG để hiệu ứng đóng chạy hết.
   *
   * 🔴 Lời hứa này TRƯỚC ĐÂY BỊ CHÍNH COMPONENT PHÁ: thân hàm có `if (!tep) return null`, làm
   * đúng cái việc dòng này nói là không làm. Đã bỏ ngày 13/09/2026 — đừng thêm lại.
   */
  tep: MoTaTep | null;
  mo: boolean;
  onDong: () => void;
}) {
  const [diaChi, setDiaChi] = useState<string | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  /**
   * 🐛 SỬA LỖI THẬT 13/09/2026 — "HỘP THOẠI ĐÓNG KHÔNG SẠCH, CẢ APP ĐƠ PHẢI F5".
   *
   * TRIỆU CHỨNG Sếp báo: sau khi đính kèm file ở khu báo giá / ô chứng từ, một mảng trắng che
   * kín cả sidebar, bấm chỗ nào cũng không ăn, trang không cuộn được; F5 mới về bình thường.
   *
   * BẰNG CHỨNG F12 Sếp chụp (chép nguyên văn — đây là thứ DUY NHẤT chứng minh nguyên nhân,
   * phân tích đầy đủ nằm ở `don-dep-hop-thoai-ket.ts`):
   *
   *     <body class="min-h-full bg-background text-foreground" style="overflow: hidden;">
   *       <div hidden aria-hidden="true" data-base-ui-inert></div>
   *       <script>...</script>
   *       <div class="min-h-screen bg-background" aria-hidden="true" data-base-ui-inert>...</div>
   *       <section aria-label="Notifications alt+T" ... data-base-ui-inert></section>
   *     </body>
   *
   * Ba thứ kẹt lại đều do base-ui đặt và đều CHỈ được gỡ trong hàm dọn của `useEffect`
   * (`markOthers.js` gỡ `data-base-ui-inert` + `aria-hidden`, `useScrollLock.js` gỡ
   * `overflow:hidden`). Cây React chứa `<Dialog>` bị THÁO trong lúc `open` còn `true` thì
   * base-ui không đi qua vòng đời đóng, và ba thứ đó nằm lại trên DOM.
   *
   * 🔴 DÒNG `if (!tep) return null` CŨ CHÍNH LÀ MỘT CÁI THÁO NHƯ VẬY, và nó còn MÂU THUẪN
   * thẳng với chú thích prop `tep` ngay phía trên (*"hộp vẫn dựng để hiệu ứng đóng chạy hết"*).
   * Nay giữ lại mô tả tệp gần nhất để `<Dialog>` LUÔN nằm trong cây, chỉ có `open` đổi giá trị.
   *
   * 📌 KHÔNG TỐN GÌ khi hộp đang đóng: `DialogPortal.js` (dòng 32-35) trả `null` khi chưa
   * `mounted` → không dựng một phần tử DOM nào. Chỗ này chỉ giữ thêm một object mô tả tệp
   * (vài trăm byte — TÊN và CỠ, không phải nội dung tệp).
   *
   * ⚠️ ĐỪNG đưa `if (!tep) return null` trở lại, và đừng để nơi gọi viết
   * `{xemTep && <HopXemTep mo .../>}` — cả hai đều tháo `<Dialog>` giữa chừng y như cũ.
   */
  const [tepGanNhat, setTepGanNhat] = useState<MoTaTep | null>(tep);
  useEffect(() => {
    if (tep) setTepGanNhat(tep);
  }, [tep]);
  /* Lúc đang đóng, `tep` có thể đã về `null` nhưng hiệu ứng đóng còn chạy → vẫn cần nội dung cũ. */
  const tepHienThi = tep ?? tepGanNhat;

  /** Chỉ mở thật khi có nội dung để bày — chưa từng chọn tệp nào thì hộp đứng im, không dựng DOM. */
  const moThat = mo && tepHienThi !== null;

  /**
   * LƯỚI AN TOÀN — xem `don-dep-hop-thoai-ket.ts`.
   *
   * 🔴 ĐẶT Ở ĐÂY LÀ CỐ Ý, không phải tiện tay. `HopXemTep` được dùng ở SÁU chỗ; phiên này chỉ
   * được sửa hai chỗ (`lien-ket-tep.tsx` vốn đã đúng, `khu-dinh-kem-giai-doan.tsx` vừa sửa).
   * BA chỗ còn lại vẫn đang viết sai kiểu `{xemTep && <HopXemTep mo .../>}` và nằm trong tệp
   * agent khác đang giữ:
   *     · `thanh-phan-dung-chung/o-dinh-kem-nhieu-tep.tsx`
   *     · `thanh-phan-nghiep-vu/khoi-trao-doi.tsx`
   *     · `thanh-phan-nghiep-vu/khoi-dau-vao-theo-giai-doan.tsx`
   * Gắn lưới vào chính component dùng chung là cách duy nhất phủ được cả ba chỗ đó mà không
   * đụng vào tệp của họ.
   *
   * ⚠️ Đây là chữa TRIỆU CHỨNG. Sửa xong hết chỗ gọi thì vẫn nên GIỮ, vì ca `HopXacNhan` bị
   * tháo cùng nhịp trong `o-dinh-kem-tep.tsx` cũng nhờ lưới này mới được dọn.
   */
  useDonDepHopThoaiKet(moThat);

  const kieu = tepHienThi?.kieuMime ?? "";
  const laAnh = kieu.startsWith("image/");
  const laPdf = kieu === "application/pdf";
  const xemDuoc = laAnh || laPdf;

  useEffect(() => {
    if (!moThat || !tepHienThi || !xemDuoc) return;
    let huy = false;
    let dc: string | null = null;
    setDangTai(true);
    setLoi(null);
    void layTep(tepHienThi.id)
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
  }, [moThat, tepHienThi?.id, xemDuoc]); // eslint-disable-line react-hooks/exhaustive-deps

  /* 🔴 KHÔNG có `if (!tep) return null` ở đây nữa — xem khối chú thích ở đầu component.
     Trả `null` là tháo `<Dialog>` khỏi cây React giữa lúc `open` còn `true`, và đó chính là
     cách `overflow:hidden` + `data-base-ui-inert` + `aria-hidden` kẹt lại trên DOM. */

  return (
    <Dialog open={moThat} onOpenChange={(v: boolean) => !v && onDong()}>
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
          {/* `tepHienThi` chỉ `null` ở lần dựng đầu khi chưa ai chọn tệp — lúc đó `moThat`
              cũng là `false` nên hộp không hiện. Vẫn viết an toàn để TypeScript không phải
              đoán, và để hộp không bao giờ đổ chữ "undefined" ra màn hình. */}
          <DialogTitle className="min-w-0 truncate">{tepHienThi?.tenTep ?? ""}</DialogTitle>
          <DialogDescription>
            {tepHienThi ? `${coTep(tepHienThi.kichThuoc)} · ${tepHienThi.nguoiTaiTen}` : ""}
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
              alt={tepHienThi?.tenTep ?? ""}
              className="max-h-full w-auto max-w-full object-contain"
            />
          ) : diaChi ? (
            /* 🐛 SỬA 13/09/2026: `h-[70vh]` → `h-full`, cùng lý do với ảnh — PDF lấp đầy khung
               chứ không tự đặt chiều cao theo màn hình. */
            <iframe src={diaChi} title={tepHienThi?.tenTep ?? ""} className="h-full w-full" />
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
            onClick={() => {
              if (!tepHienThi) return;
              void taiTep(tepHienThi).then((duoc) => {
                if (!duoc) {
                  toast.error("Không tải được tệp", {
                    description: "Không lấy được nội dung từ máy chủ. Kiểm tra mạng rồi thử lại.",
                  });
                }
              });
            }}
          >
            <Download className="size-4" aria-hidden />
            Tải về máy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
