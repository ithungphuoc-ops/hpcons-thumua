"use client";

import { useState } from "react";
import { Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { HopXemTep } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xem-tep";
import { ODinhKemNhieuTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-nhieu-tep";
import { rutGonTenTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
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
 * 🔴 NỘI DUNG TỆP KHÔNG NẰM Ở ĐÂY. `ODinhKemNhieuTep` cất tệp vào kho tệp
 * (`3-du-lieu/kho-tep.ts` → IndexedDB + Firestore) NGAY LÚC CHỌN rồi mới trả phần mô tả về;
 * hồ sơ chỉ giữ phần mô tả. Cất hỏng thì nó báo lỗi tại chỗ và KHÔNG trả tệp đó về, nên
 * không bao giờ có chuyện tên tệp hiện lên như đã lưu xong mà nội dung chưa đi đâu cả.
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
          dụng chuyên nghiệp nên không cần các cảnh báo kiểu này"*. Nút "Đính kèm tệp cho bước
          này" ngay bên dưới đã nói đủ việc phải làm. */}
      {daCo.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {daCo.map((t) => (
            <li
              key={t.id}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface pr-1 pl-2.5"
            >
              <button
                type="button"
                onClick={() => setXemTep(t)}
                className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-sm text-text-secondary transition-colors hover:text-primary"
              >
                <Paperclip className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate" title={t.tenTep}>
                  {rutGonTenTep(t.tenTep, 40)}
                </span>
                <span className="shrink-0 text-xs text-text-desc">{coTep(t.kichThuoc)}</span>
              </button>
              {/* Ai gắn, lúc nào — cần để truy khi hai bên nói khác nhau về chứng từ. Ẩn trên
                  màn hẹp vì tên tệp mới là thứ phải đọc được trước. */}
              <span className="hidden shrink-0 text-xs text-text-desc sm:inline">
                {t.nguoiTaiTen} · {formatMocThoiGian(t.thoiDiem)}
              </span>
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
          ))}
        </ul>
      )}

      {duocThemGo &&
        (conNhan > 0 ? (
          /* 📌 DÙNG LẠI `ODinhKemNhieuTep`, không dựng ô chọn tệp mới: nó đã lo phần khó nhất
             (cất tệp ngay lúc chọn, báo lỗi từng tệp, lọc đúng kiểu tệp cho phép).

             ⚠️ Truyền `tep={[]}` là CỐ Ý. Component đó tự vẽ danh sách kèm nút × KHÔNG hỏi
             lại — mà gỡ chứng từ thì phải hỏi. Nên ở đây nó chỉ đóng vai Ô CHỌN TỆP, còn
             danh sách và việc gỡ do khu này tự lo. `toiDa` vì vậy truyền SỐ CÒN NHẬN THÊM,
             không phải tổng. */
          <ODinhKemNhieuTep
            tep={[]}
            toiDa={conNhan}
            nhan="Đính kèm tệp cho bước này"
            nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
            onDoi={(moi) => {
              if (moi.length === 0) return;
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
          <p className="text-sm text-text-desc">
            Đã đủ {TOI_DA_TEP_MOI_BUOC} tệp cho bước này. Gỡ bớt một tệp nếu cần đính kèm tệp
            khác.
          </p>
        ))}

      {/* 📌 ĐÃ BỎ dòng nhắc giới hạn ở đây (Ban lãnh đạo 17/08/2026: *"bỏ phần này"*).
          Nó lặp lại đúng thứ nút chọn tệp đã ghi sẵn — trên màn hình hiện hai lần
          "tối đa 5 tệp, 10MB" cạnh nhau. Giới hạn vẫn được chặn thật ở
          `themTepGiaiDoan`, không phải chỉ nhắc bằng chữ. */}
      {/* Hồ sơ đóng thì nói vì sao nút biến mất — người vốn có quyền sẽ đi tìm nút. Người
          không có quyền thì không hiện gì, khỏi mời gọi một việc họ không làm được. */}
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
