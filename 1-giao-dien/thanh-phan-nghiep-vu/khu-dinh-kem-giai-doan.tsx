"use client";

import { useState } from "react";
import { Eye, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  bieuTuongTheoLoaiTep,
  tenLoaiTep,
} from "@/1-giao-dien/thanh-phan-dung-chung/bieu-tuong-tep";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { HopXemTep } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xem-tep";
import { rutGonTenTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { VungThaTep } from "@/1-giao-dien/thanh-phan-dung-chung/vung-tha-tep";
import { NhanPhanTrongGiaiDoan } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-dau-vao-theo-giai-doan";
import { TOI_DA_TEP_MOI_BUOC, useDuLieu } from "@/3-du-lieu/kho-du-lieu";
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
  const { themTepGiaiDoan, goTepGiaiDoan } = useDuLieu();
  const { nguoiDung } = useNguoiDung();
  const [xemTep, setXemTep] = useState<MoTaTep | null>(null);
  /** Tệp đang hỏi gỡ — `null` là chưa hỏi ai. */
  const [hoiGo, setHoiGo] = useState<MoTaTep | null>(null);

  const daCo = deNghi.tepGiaiDoan?.[maGiaiDoan] ?? [];
  const duocThemGo = duocSua && !khoa;
  const conNhan = TOI_DA_TEP_MOI_BUOC - daCo.length;

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
                     đó — người không nhìn màn hình sẽ không biết ai gắn tệp, gắn lúc nào. */
                  aria-label={`Xem ${loai}: ${t.tenTep} · ${coTep(t.kichThuoc)} · ${t.nguoiTaiTen} · ${formatMocThoiGian(t.thoiDiem)}`}
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
        moTa={
          hoiGo
            ? `“${hoiGo.tenTep}” sẽ không còn nằm trong bước này của hồ sơ ${deNghi.code}.`
            : undefined
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
    </section>
  );
}
