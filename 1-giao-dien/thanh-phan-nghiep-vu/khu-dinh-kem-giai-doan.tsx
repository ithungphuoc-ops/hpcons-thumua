"use client";

import { useState } from "react";
import { Eye, NotebookPen, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";
import {
  bieuTuongTheoLoaiTep,
  tenLoaiTep,
} from "@/1-giao-dien/thanh-phan-dung-chung/bieu-tuong-tep";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { HopXemTep } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xem-tep";
import { rutGonTenTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { VungThaTep } from "@/1-giao-dien/thanh-phan-dung-chung/vung-tha-tep";
import { NhanPhanTrongGiaiDoan } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-dau-vao-theo-giai-doan";
import {
  DAI_TOI_DA_GHI_CHU_TEP,
  TOI_DA_TEP_MOI_BUOC,
  useDuLieu,
} from "@/3-du-lieu/kho-du-lieu";
import { coTep, type MoTaTep } from "@/3-du-lieu/kho-tep";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { formatMocThoiGian } from "@/6-tien-ich/dinh-dang";

/**
 * KHU ĐÍNH KÈM TỆP CỦA MỘT BƯỚC trong khối "Đầu vào theo giai đoạn".
 *
 * 🔴 Ban lãnh đạo 17/08/2026: ảnh chụp màn chi tiết đề nghị, khoanh đỏ khối *"Bảng báo giá
 * (0)"* ở bước ② và ghi *"mục đính kèm file"*.
 *
 * VÌ SAO CẦN: bước ② *Yêu cầu NCC báo giá* trước đó KHÔNG có chỗ nào bỏ tệp vào. Bản báo giá
 * nhà cung cấp gửi về qua Zalo/email chỉ gắn được sau khi đã vào trong trang bảng báo giá —
 * mà lúc chưa lập bảng nào thì nhân viên không biết cất vào đâu. Chứng từ nằm lại trong điện
 * thoại, hồ sơ thiếu mà không ai biết.
 *
 * 🔴 LÀM CHUNG CHO CẢ 6 BƯỚC, không làm riêng bước ②. Việc đang chờ trong danh sách ("thêm
 * chỗ đính kèm cho hợp đồng, đơn có chữ ký, hóa đơn NCC") chính là cùng một nhu cầu — làm lẻ
 * từng chỗ là sau này app có 5 cơ chế đính kèm khác nhau, mỗi chỗ một kiểu, sửa một lỗi phải
 * đi sửa năm nơi.
 *
 * 🔴 NỘI DUNG TỆP KHÔNG NẰM Ở ĐÂY. `VungThaTep` cất tệp vào kho tệp
 * (`3-du-lieu/kho-tep.ts` → IndexedDB + Firestore) NGAY LÚC CHỌN rồi mới trả phần mô tả về;
 * hồ sơ chỉ giữ phần mô tả. Cất hỏng thì nó báo lỗi tại chỗ và KHÔNG trả tệp đó về, nên
 * không bao giờ có chuyện tên tệp hiện lên như đã lưu xong mà nội dung chưa đi đâu cả.
 *
 * ---
 * 🔴 DỰNG LẠI GIAO DIỆN 17/08/2026 — Ban lãnh đạo chụp màn chi tiết đề nghị, khoanh đỏ đúng
 * khu này ở các bước và ghi *"thiết kế lại giao diện này chuyên nghiệp hơn"*.
 *
 * Ba thứ đã đổi, và VÌ SAO:
 *
 * 1. **Nút chọn tệp → `VungThaTep`.** Cũ là một cái NÚT nhỏ dính cạnh một NHÃN CHỮ ghi
 *    *"Tối đa 10MB mỗi tệp, 5 tệp"* — hai mảnh chắp vào nhau, và ở bước chưa có tệp nào thì
 *    cả khu chỉ còn mỗi cái nút lửng lơ. Nay giới hạn nằm bên trong vùng thả, nên khu này là
 *    một khối hoàn chỉnh ngay cả lúc trống. Kéo thả là THẬT, không phải chữ suông.
 * 2. **Dòng tệp có biểu tượng theo loại** (PDF · Ảnh · Word · Excel) thay cho một cái ghim
 *    giấy dùng chung cho mọi tệp, thêm tên loại bằng chữ và `title` xem tên đầy đủ.
 * 3. **Đang tải lên thì hiện ra.** Cất một tệp 5MB lên Firestore mất hơn chục lần gọi mạng;
 *    trước đây trong lúc đó giao diện đứng im nên người dùng bấm lại lần hai.
 *
 * ---
 * 🔴 GHI CHÚ CHO TỪNG TỆP 17/08/2026 — Ban lãnh đạo: *"thêm chức năng ghi chú cho mỗi tệp
 * đính kèm thêm"*, kèm chỉ đạo *"cái ghi chú nên dùng chữ in nghiêng"*.
 *
 * VÌ SAO ĐÂY KHÔNG PHẢI TRANG TRÍ: app **không đổi được tên tệp**. Ảnh nhà cung cấp gửi qua
 * Zalo về máy mang tên máy sinh, kiểu `1785921139635_1967909016357413267_…_bb904d0c.jpg`. Ba
 * tháng sau mở hồ sơ ra, năm tệp đều mang tên như vậy thì không ai biết đâu là bản báo giá của
 * nhà cung cấp nào, đâu là hóa đơn, đâu là ảnh phiếu giao nhận. Hồ sơ lưu chứng từ mà không
 * tra cứu được thì coi như không lưu. Ghi chú chính là **nhãn người đọc được** thay cho cái tên
 * máy sinh ấy — nên nó nằm ngay dưới tên tệp, và có cả trong `aria-label` của dòng.
 *
 * Ghi vào hồ sơ ở `3-du-lieu/kho-du-lieu.tsx` → `datGhiChuTepGiaiDoan`; giới hạn 200 ký tự
 * chặn ở chính hàm đó, giao diện chỉ bày đúng con số `DAI_TOI_DA_GHI_CHU_TEP`.
 */

/**
 * 📌 `TOI_DA_TEP_MOI_BUOC` (5 tệp) NHẬP TỪ TẦNG DỮ LIỆU, cố ý không khai lại ở đây — chỗ ghi
 * dữ liệu mới là chốt chặn thật, giao diện chỉ bày đúng con số ấy. Khối bình luận đang chép
 * số ra file giao diện, đó là cái nếp không nên lặp lại.
 */
export function KhuDinhKemGiaiDoan({
  deNghi,
  maGiaiDoan,
  duocSua = false,
  khoa = false,
}: {
  deNghi: DeNghiMuaHang;
  /** Mã giai đoạn — khóa tra trong `deNghi.tepGiaiDoan`. */
  maGiaiDoan: string;
  /**
   * Cấp quyền có được thêm/gỡ không. `false` = chỉ xem.
   *
   * 🔴 Chốt chặn THẬT nằm ở tầng dữ liệu (`themTepGiaiDoan` / `goTepGiaiDoan`); cờ này chỉ
   * để không bày nút ra. Bày nút rồi bấm vào mới báo lỗi là bắt người dùng phát hiện luật
   * bằng cách gặp lỗi.
   */
  duocSua?: boolean;
  /** Hồ sơ đã đóng (hoàn thành / đóng dở) — khóa thêm và gỡ, nhưng XEM thì vẫn xem được. */
  khoa?: boolean;
}) {
  const { themTepGiaiDoan, goTepGiaiDoan, datGhiChuTepGiaiDoan } = useDuLieu();
  const { nguoiDung } = useNguoiDung();
  const [xemTep, setXemTep] = useState<MoTaTep | null>(null);
  /** Tệp đang hỏi gỡ — `null` là chưa hỏi ai. */
  const [hoiGo, setHoiGo] = useState<MoTaTep | null>(null);
  /** Tệp đang mở hộp ghi chú — `null` là chưa mở hộp nào. */
  const [ghiChuTep, setGhiChuTep] = useState<MoTaTep | null>(null);
  /**
   * Chữ đang gõ trong hộp ghi chú.
   *
   * ⚠️ GIỮ Ở ĐÂY, KHÔNG giữ bên trong hộp thoại. Nếu hộp tự quản lấy chữ thì phải gắn `key`
   * theo id tệp cho nó nạp lại mỗi lần đổi tệp — mà lúc đóng hộp, `key` đổi làm cây con bị
   * tháo GIỮA LÚC hiệu ứng đóng đang chạy, đúng cái lỗi đã ghi ở `HopXacNhan`. Để ở đây thì
   * đóng hộp chỉ xóa `ghiChuTep`, chữ còn nguyên tới lần mở sau nên không có gì bị tháo dở.
   */
  const [chuGhiChu, setChuGhiChu] = useState("");

  const daCo = deNghi.tepGiaiDoan?.[maGiaiDoan] ?? [];
  const duocThemGo = duocSua && !khoa;
  const conNhan = TOI_DA_TEP_MOI_BUOC - daCo.length;

  /**
   * Lưu ghi chú rồi đóng hộp. Lỗi thì GIỮ HỘP MỞ để người dùng không mất câu vừa gõ — đây là
   * lý do không mượn `HopXacNhan` cho việc này (hộp đó luôn tự đóng sau khi bấm Đồng ý).
   */
  function luuGhiChu() {
    if (!ghiChuTep) return;
    const loi = datGhiChuTepGiaiDoan(
      deNghi.id,
      maGiaiDoan,
      ghiChuTep.id,
      chuGhiChu,
      nguoiDung.tenHienThi,
    );
    if (loi) {
      toast.error("Chưa lưu được ghi chú", { description: loi });
      return;
    }
    /* 🔴 BÁO ĐÃ LƯU — Ban lãnh đạo 17/08/2026: *"khi ghi vào nó lại ko hiển thị trên tệp,
       phải bấm vào nút ghi chú mới xem được nội dung"*.

       Ghi chú CÓ hiện dưới tên tệp, nhưng nó là chữ 12px xám in nghiêng nên lúc hộp vừa đóng
       mắt không kịp bắt được là đã lưu hay chưa — người dùng phải mở lại hộp để kiểm. Đóng
       hộp im lặng là không nói gì cả, mà đây là việc ghi vào hồ sơ.

       Đọc luôn ghi chú vừa lưu vào lời báo, để không phải mở lại hộp mới biết mình gõ gì. */
    toast.success(chuGhiChu.trim() ? "Đã lưu ghi chú" : "Đã bỏ ghi chú", {
      description: chuGhiChu.trim() || undefined,
    });
    setGhiChuTep(null);
  }

  /**
   * Chưa có tệp nào MÀ cũng không được thêm thì không vẽ gì cả.
   *
   * Một khối rỗng ghi "TỆP ĐÍNH KÈM (0)" ở cả sáu bước chỉ làm trang dài ra và loãng đúng
   * chỗ đang có việc phải làm.
   */
  if (daCo.length === 0 && !duocThemGo) return null;

  return (
    <section className="flex flex-col gap-(--hp-md-row-gap)">
      {/* 🔴 DÙNG ĐÚNG `NhanPhanTrongGiaiDoan` như "ĐẦU VÀO" và các khối nghiệp vụ. Ban lãnh
          đạo 16/08/2026 đã bắt lỗi *"chiều cao chữ đang ko đồng đều"* ở đúng khối này —
          chép class ra đây là làm lệch lại. */}
      <NhanPhanTrongGiaiDoan the="h2" icon={Paperclip}>
        TỆP ĐÍNH KÈM ({daCo.length})
      </NhanPhanTrongGiaiDoan>

      {/* 📌 Chưa có tệp thì KHÔNG viết câu hướng dẫn nào — Ban lãnh đạo 17/08/2026 khoanh đỏ
          đúng chỗ này và ghi *"bỏ phần này"*, cùng tinh thần chỉ đạo 16/08/2026: *"đây là ứng
          dụng chuyên nghiệp nên không cần các cảnh báo kiểu này"*. Vùng thả tệp ngay bên dưới
          đã nói đủ việc phải làm và cả giới hạn của nó. */}
      {daCo.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {daCo.map((t) => {
            /* 🔴 BIỂU TƯỢNG THEO LOẠI TỆP (17/08/2026). Trước đây năm dòng liền nhau đều mang
               chung một cái ghim giấy nên phải đọc hết tên tệp mới biết đâu là bản báo giá
               PDF, đâu là bảng tính Excel. */
            const BieuTuong = bieuTuongTheoLoaiTep(t.tenTep, t.kieuMime);
            const loai = tenLoaiTep(t.tenTep, t.kieuMime);
            return (
              <li
                key={t.id}
                /* `bg-card` chứ không `bg-surface`: khối giai đoạn bao ngoài đã là
                   `bg-surface`, để cùng màu thì các dòng tệp chìm hẳn vào nền.

                   🔴 RÊ CHUỘT ĐỔI VIỀN, KHÔNG ĐỔI NỀN — sửa 17/08/2026. Bản trước viết
                   `hover:bg-muted`, mà trong `app/globals.css` thì
                   `--color-muted: var(--hp-surface)` — tức `bg-muted` ĐÚNG BẰNG `bg-surface`
                   của khối giai đoạn bao ngoài (Sáng #f8fafc · Tối #131f2b). Rê chuột vào là
                   nền dòng trở thành y hệt nền khối, dòng CHÌM đi thay vì nổi lên; ở chế độ
                   Tối còn tệ hơn vì #182531 → #131f2b là TỐI ĐI, mắt đọc thành "đang bị khóa".
                   Nghịch hẳn lý lẽ của chính hai dòng chú thích ngay trên.

                   Đổi viền thì đúng cả hai chế độ (primary là màu nhận diện, không phái sinh
                   từ nền) và KHÔNG tranh chấp với nền khi rê hai nút con: nút Xem tô
                   `bg-primary-bg`, nút Gỡ tô `bg-danger-bg` — giữ nền dòng nguyên vẹn thì hai
                   màu đó mới đọc ra đúng nghĩa, chồng lên một lớp nền đã tô sẵn là ra màu lẫn.

                   📌 Đổi trạng thái khi rê chuột đặt Ở ĐÂY chứ không đặt trên nút bên trong:
                   nút chỉ chiếm nửa trái của dòng nên bo góc của nó không khớp bo góc dòng, rê
                   vào là thấy một mảng cắt ngang giữa dòng. */
                className="flex items-center gap-1 rounded-lg border border-border bg-card pr-1 transition-colors hover:border-primary"
              >
                <button
                  type="button"
                  onClick={() => setXemTep(t)}
                  className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 py-1.5 pl-2 text-left"
                  /* Gộp đủ thông tin của dòng vào nhãn: `aria-label` THAY THẾ nội dung bên
                     trong khi trình đọc màn hình đọc lên, nên thiếu chỗ nào là mất hẳn chỗ
                     đó — người không nhìn màn hình sẽ không biết ai gắn tệp, gắn lúc nào.

                     🔴 GHI CHÚ PHẢI CÓ TRONG NHÃN (17/08/2026). Với tệp tên máy sinh thì ghi
                     chú mới là thứ DUY NHẤT cho biết đây là chứng từ gì; bỏ nó ra khỏi nhãn
                     là người dùng trình đọc màn hình chỉ nghe được một dãy số vô nghĩa. */
                  aria-label={`Xem ${loai}: ${t.tenTep}${t.ghiChu ? ` · Ghi chú: ${t.ghiChu}` : ""} · ${coTep(t.kichThuoc)} · ${t.nguoiTaiTen} · ${formatMocThoiGian(t.thoiDiem)}`}
                >
                  {/* Ô biểu tượng dùng cặp token `bg-primary-bg` + `text-primary` — cả hai đều
                      tự đổi theo Sáng/Tối, không có mã màu nào viết cứng ở đây. */}
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-bg text-primary">
                    <BieuTuong className="size-4" aria-hidden />
                  </span>

                  {/* `min-w-0` là bắt buộc để `truncate` bên trong chạy được: mặc định ô flex
                      không co nhỏ hơn nội dung nên thiếu nó là tên tệp dài tràn ra ngoài. */}
                  <span className="flex min-w-0 flex-col">
                    {/* `title` để di chuột vào đọc được TÊN ĐẦY ĐỦ — tên tệp bị cắt gọn thì
                        hai bản báo giá cùng nhà cung cấp nhìn y hệt nhau. */}
                    <span
                      className="truncate text-sm font-medium text-text-primary"
                      title={t.tenTep}
                    >
                      {rutGonTenTep(t.tenTep, 40)}
                    </span>

                    {/* 🔴 GHI CHÚ NẰM NGAY DƯỚI TÊN TỆP — Ban lãnh đạo 17/08/2026: *"thêm
                        chức năng ghi chú cho mỗi tệp đính kèm thêm"*, và *"cái ghi chú nên
                        dùng chữ in nghiêng"*.

                        Đặt trên dòng cỡ tệp / người tải là cố ý: tên tệp máy sinh không đọc
                        được nghĩa gì, nên ghi chú mới là thứ người tra hồ sơ cần thấy ngay
                        sau tên — đẩy nó xuống cuối là lại phải dò từng dòng như cũ.

                        `line-clamp-2` chứ không `truncate`: ghi chú dài tới 200 ký tự, cắt
                        một dòng thì mất gần hết câu; hai dòng đủ đọc mà không kéo dòng tệp
                        cao lên mãi. Câu đầy đủ vẫn nằm ở `title`. */}
                    {/* 🔴 CỠ CHỮ 14px, KHÔNG PHẢI 12px — Ban lãnh đạo 17/08/2026:
                        *"e tăng cỡ chữ ghi chú đó lên"*.

                        Đúng về thứ bậc: tên tệp là chuỗi máy sinh không đọc ra nghĩa gì, còn
                        ghi chú mới là thứ người tra hồ sơ thật sự đọc. Để nó 12px xám mờ như
                        dòng "Ảnh · 266 KB · người tải" là xếp nó ngang hàng với chú thích phụ,
                        trong khi nó là NHÃN của chứng từ.

                        Màu cũng nâng lên `text-text-secondary` (đậm hơn `text-text-desc`):
                        tăng cỡ chữ mà vẫn để màu mờ nhất thì đọc vẫn khó, chưa giải quyết
                        đúng cái Ban lãnh đạo đang thấy. */}
                    {t.ghiChu && (
                      <span
                        className="line-clamp-2 text-sm text-text-secondary italic"
                        title={t.ghiChu}
                      >
                        {t.ghiChu}
                      </span>
                    )}

                    <span className="truncate text-xs text-text-desc">
                      {loai} · {coTep(t.kichThuoc)}
                      {/* Ai gắn, lúc nào — cần để truy khi hai bên nói khác nhau về chứng từ.
                          Ẩn trên màn hẹp vì tên tệp mới là thứ phải đọc được trước. */}
                      <span className="hidden sm:inline">
                        {" "}
                        · {t.nguoiTaiTen} · {formatMocThoiGian(t.thoiDiem)}
                      </span>
                    </span>
                  </span>
                </button>

                {/* Nút xem tách riêng cho người quen tìm nút bấm. Ẩn dưới `sm:` để màn hình
                    điện thoại không phải nuôi hai vùng chạm 44px cạnh nhau — ở đó bấm vào cả
                    dòng cũng mở xem được rồi. */}
                <button
                  type="button"
                  onClick={() => setXemTep(t)}
                  className="hidden size-11 shrink-0 items-center justify-center rounded-lg text-text-desc transition-colors hover:bg-primary-bg hover:text-primary sm:flex"
                  aria-label={`Xem ${t.tenTep}`}
                  title="Xem tệp"
                >
                  <Eye className="size-4" aria-hidden />
                </button>

                {duocThemGo && (
                  /* ★ NÚT GHI CHÚ — Ban lãnh đạo 17/08/2026.

                     📌 VÌ SAO DÙNG `NotebookPen` chứ không dùng biểu tượng bong bóng chat
                     (`MessageSquare`): app đã có khối Trao đổi (`khoi-trao-doi.tsx`) là chỗ
                     bình luận thật sự, nên bong bóng chat ở đây sẽ đọc thành "bình luận về
                     tệp" và mời người dùng vào nhầm chỗ. `NotebookPen` cũng đúng biểu tượng
                     mà app đang dùng cho THAO TÁC viết ghi chú ở màn Lịch công việc — một
                     việc thì giữ một biểu tượng, khỏi phải học hai lần.

                     Nhãn đổi theo trạng thái ("Thêm" / "Sửa") và tệp đã có ghi chú thì nút
                     mang màu nhận diện: trạng thái có CẢ màu LẪN chữ theo Design System
                     V1.1, không bắt người dùng đoán bằng riêng màu.

                     🔴 DÙNG `text-primary-soft`, KHÔNG dùng `text-primary` — sửa sau khi đo
                     thật trong Chế độ Tối. `--hp-primary` giữ nguyên #096AA7 ở CẢ hai chế độ,
                     nên đặt nó lên nền thẻ tối (#182531) chỉ được **2,69:1** — dưới mức 3:1
                     tối thiểu cho biểu tượng, tức dấu hiệu "tệp này đã có ghi chú" gần như
                     tàng hình đúng ở chế độ mà công trường hay dùng buổi tối. `-soft` là tông
                     Design System sinh riêng cho việc này (Tối: trộn 60% trắng → **5,87:1**;
                     Sáng: trộn 62% đen → **10,6:1**), và là tông app đã dùng cho biểu tượng
                     màu ở `bang-quy-trinh-mua-hang.tsx`, `kpi-card.tsx`, `status-badge.tsx`.

                     Màu khi rê chuột cũng phải `-soft`: nền `bg-primary-bg` ở chế độ Tối gần
                     như không sáng thêm (#182531 → #131E27), nên rê vào mà đổi về
                     `text-primary` là contrast TỤT xuống 2,93:1 — rê chuột làm mờ đi. */
                  <button
                    type="button"
                    onClick={() => {
                      setGhiChuTep(t);
                      setChuGhiChu(t.ghiChu ?? "");
                    }}
                    className={`flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-primary-bg hover:text-primary-soft ${
                      t.ghiChu ? "text-primary-soft" : "text-text-desc"
                    }`}
                    aria-label={
                      t.ghiChu
                        ? `Sửa ghi chú của tệp ${t.tenTep}`
                        : `Thêm ghi chú cho tệp ${t.tenTep}`
                    }
                    title={t.ghiChu ? "Sửa ghi chú" : "Thêm ghi chú"}
                  >
                    <NotebookPen className="size-4" aria-hidden />
                  </button>
                )}

                {duocThemGo && (
                  /* Vùng chạm 44×44 theo Design System V1.1 — nút này nằm cạnh nút mở tệp,
                     bấm nhầm là mất chứng từ khỏi hồ sơ. */
                  <button
                    type="button"
                    onClick={() => setHoiGo(t)}
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg text-text-desc transition-colors hover:bg-danger-bg hover:text-danger"
                    aria-label={`Gỡ tệp ${t.tenTep} khỏi bước này`}
                    title="Gỡ khỏi bước này"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {duocThemGo &&
        (conNhan > 0 ? (
          /* 🔴 VÙNG THẢ TỆP thay cho cái nút cũ (Ban lãnh đạo 17/08/2026: *"thiết kế lại giao
             diện này chuyên nghiệp hơn"*). Giới hạn nằm BÊN TRONG vùng chứ không còn là một
             nhãn chữ dính cạnh nút, nên khu này là một khối hoàn chỉnh kể cả khi chưa có tệp.

             ⚠️ `conNhan` là SỐ CÒN NHẬN THÊM, không phải tổng — trừ ra từ
             `TOI_DA_TEP_MOI_BUOC` của tầng dữ liệu. */
          <VungThaTep
            conNhan={conNhan}
            nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
            onThem={(moi) => {
              const loi = themTepGiaiDoan(deNghi.id, maGiaiDoan, moi, nguoiDung.tenHienThi);
              /* 🔴 Ghi vào hồ sơ hỏng thì PHẢI NÓI RA. Tệp đã nằm trong kho tệp nhưng chưa
                 gắn vào bước nào — im lặng ở đây là người dùng tin đã đính kèm xong trong
                 khi hồ sơ vẫn trống. */
              if (loi) {
                toast.error("Chưa đính kèm được vào bước này", { description: loi });
                return;
              }
              toast.success(`Đã đính kèm ${moi.length} tệp`, {
                description: "Tệp lưu lên máy chủ nên người khác mở xem được.",
              });
            }}
          />
        ) : (
          /* Đủ tệp rồi thì vùng thả biến mất — phải nói vì sao, nếu không người dùng đi tìm
             chỗ bấm. Giữ viền đứt để mắt nhận ra đây vẫn là chỗ của vùng thả tệp. */
          <p className="rounded-xl border-2 border-dashed border-border px-4 py-3 text-center text-xs text-text-desc">
            Đã đủ {TOI_DA_TEP_MOI_BUOC} tệp cho bước này. Gỡ bớt một tệp nếu cần đính kèm tệp
            khác.
          </p>
        ))}

      {/* Hồ sơ đóng thì nói vì sao vùng thả tệp biến mất — người vốn có quyền sẽ đi tìm chỗ
          bấm. Người không có quyền thì không hiện gì, khỏi mời gọi một việc họ không làm
          được. */}
      {khoa && duocSua && (
        <p className="text-xs text-text-desc">
          Hồ sơ đã đóng nên không gắn thêm hoặc gỡ tệp được nữa — các tệp cũ vẫn xem và tải về
          bình thường.
        </p>
      )}

      {xemTep && <HopXemTep tep={xemTep} mo onDong={() => setXemTep(null)} />}

      {/* 🔴 HỎI TRƯỚC KHI GỠ — gỡ chứng từ khỏi hồ sơ là mất bằng chứng, đúng diện phải hỏi
          theo nguyên tắc Ban lãnh đạo 10/08/2026 ở `HopXacNhan`. */}
      <HopXacNhan
        mo={hoiGo !== null}
        nguyHiem
        tieuDe="Gỡ tệp này khỏi bước?"
        /* 🔴 RÚT GỌN TÊN TỆP — Ban lãnh đạo 17/08/2026 chụp hộp này và bảo kiểm lại giao diện.
           Trước đó đổ NGUYÊN tên tệp ra: ảnh tải từ Zalo có tên kiểu
           `1785921139635_1967909016357413267_…_bb904d0c….jpg` dài 88 ký tự, tràn hai dòng và
           đẩy hộp thoại méo hẳn. Danh sách tệp phía trên vốn đã rút gọn, riêng chỗ này quên.
           `title` giữ tên đầy đủ để di chuột vào vẫn đọc được. */
        moTa={
          hoiGo ? (
            <>
              <span className="font-medium text-text-primary" title={hoiGo.tenTep}>
                {rutGonTenTep(hoiGo.tenTep, 42)}
              </span>{" "}
              sẽ không còn nằm trong bước này của hồ sơ {deNghi.code}.
            </>
          ) : undefined
        }
        canhBao="Hồ sơ mất một chứng từ. Nội dung tệp vẫn còn trong kho nên đính kèm lại được, nhưng phải tìm lại tệp gốc trên máy."
        nhanDongY="Gỡ khỏi bước"
        onDong={() => setHoiGo(null)}
        onDongY={() => {
          if (!hoiGo) return;
          const loi = goTepGiaiDoan(deNghi.id, maGiaiDoan, hoiGo.id, nguoiDung.tenHienThi);
          if (loi) toast.error("Chưa gỡ được tệp", { description: loi });
        }}
      />

      {/* ★ HỘP GHI CHÚ CHO TỆP — Ban lãnh đạo 17/08/2026.
          Esc để hủy do `Dialog` của base-nova lo sẵn; Enter để lưu gắn ở ô nhập bên dưới. */}
      <Dialog
        open={ghiChuTep !== null}
        onOpenChange={(v: boolean) => !v && setGhiChuTep(null)}
      >
        {/* 🔴 PHẢI VIẾT `sm:max-w-md`, KHÔNG được viết `max-w-md` trơn. Lớp gốc của
            `DialogContent` đã có sẵn `sm:max-w-sm`; class không có tiền tố `sm:` thua ở độ ưu
            tiên nên bị đè IM LẶNG — không lỗi lint, không lỗi build, hộp cứ kẹt 384px. */}
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ghi chú cho tệp</DialogTitle>
            {/* Hiện TÊN TỆP để biết đang ghi chú cho cái nào — rút gọn vì tên ảnh tải từ Zalo
                dài tới 88 ký tự, đổ nguyên ra là tràn hai dòng và đẩy hộp thoại méo hẳn.
                Tên đầy đủ nằm ở `title`, rê chuột là đọc được. */}
            <DialogDescription>
              {ghiChuTep ? (
                <span className="font-medium text-text-primary" title={ghiChuTep.tenTep}>
                  {rutGonTenTep(ghiChuTep.tenTep, 42)}
                </span>
              ) : undefined}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Textarea
              autoFocus
              value={chuGhiChu}
              // Cắt luôn khi dán một đoạn dài — `maxLength` chặn lúc gõ nhưng không chặn dán.
              onChange={(e) => setChuGhiChu(e.target.value.slice(0, DAI_TOI_DA_GHI_CHU_TEP))}
              maxLength={DAI_TOI_DA_GHI_CHU_TEP}
              rows={2}
              placeholder="Ví dụ: Báo giá công ty A, đã ký đóng dấu"
              aria-label="Nội dung ghi chú cho tệp"
              onKeyDown={(e) => {
                /* Enter LƯU chứ không xuống dòng — ghi chú là một NHÃN ngắn thay cho tên tệp,
                   không phải đoạn văn (đoạn văn thì viết vào khối Trao đổi). Vẫn chừa
                   Shift+Enter cho ai muốn tách hai ý. Dùng ô nhiều dòng thay vì ô một dòng chỉ
                   để 200 ký tự tự xuống hàng, đọc được hết mà không phải kéo ngang. */
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  luuGhiChu();
                }
              }}
            />

            {/* Chỉ đếm khi SẮP hết chỗ. Hiện số ngay từ ký tự đầu là bắt người dùng để mắt
                tới một con số họ chưa cần biết. */}
            {DAI_TOI_DA_GHI_CHU_TEP - chuGhiChu.length <= 30 && (
              <p className="text-right text-xs text-warning-soft">
                Còn {DAI_TOI_DA_GHI_CHU_TEP - chuGhiChu.length} ký tự
              </p>
            )}

            {/* Chỉ nói cách BỎ ghi chú khi tệp đang có ghi chú — lúc chưa có thì câu này thừa.
                Không có nút "Xóa" riêng: thêm một nút đỏ nữa vào hộp chỉ để làm việc mà xóa
                chữ đi là xong. */}
            {ghiChuTep?.ghiChu && (
              <p className="text-xs text-text-desc">Xóa hết chữ rồi bấm Lưu để bỏ ghi chú.</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGhiChuTep(null)}>
              Hủy
            </Button>
            <Button onClick={luuGhiChu}>
              <NotebookPen className="size-4" aria-hidden />
              Lưu ghi chú
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
