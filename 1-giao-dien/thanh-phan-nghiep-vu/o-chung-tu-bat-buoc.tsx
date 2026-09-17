"use client";

// ============================================================
// Ô ĐÍNH KÈM MỘT CHỨNG TỪ CÓ TÊN — dùng cho Hợp đồng · Hóa đơn VAT · Ủy nhiệm chi
//
// ★ Chỉ đạo Ban lãnh đạo 22/08/2026 (xem `2-quy-trinh/chung-tu-cuoi-quy-trinh.ts`).
//
// 🔴 VÌ SAO KHÔNG DÙNG `KhuDinhKemGiaiDoan` CÓ SẴN: khu đó là một DANH SÁCH TỆP KHÔNG TÊN — bỏ
// bao nhiêu tệp cũng được, không tệp nào là bắt buộc, và không cách nào biết tệp nào là hợp đồng.
// Mà ba chứng từ này phải trả lời được câu "đã có chưa" để chặn chuyển bước. Nên cần ô CÓ TÊN,
// đúng cách khu báo giá đang làm: nhãn nằm trong `ghiChu` của tệp.
//
// 🔴 GHI BẰNG `datTepVaoOGiaiDoan`, KHÔNG PHẢI `themTepGiaiDoan` + đặt ghi chú:
// hai lần ghi liên tiếp thì lần sau đọc `deNghiRef.current` trước khi React vẽ lại, nên nhãn
// **rơi mất im lặng** — đã dính đúng lỗi này ngày 20/08/2026 với các ô báo giá, tệp đính vào rồi
// mà app coi như chưa có gì.
// ============================================================

import { useState } from "react";
import { FileCheck2 } from "lucide-react";
import { ODinhKemTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import type { DeNghiMuaHang, MoTaTep } from "@/3-du-lieu/kieu-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";

export function OChungTuBatBuoc({
  deNghi,
  maGiaiDoan,
  nhanO,
  tieuDe,
  moTa,
  batBuoc = false,
  duocSua,
  khoa = false,
  /** Tệp đã có của ô này — nơi gọi tự lọc bằng hàm thuần ở `chung-tu-cuoi-quy-trinh.ts`. */
  tepDaCo,
  /**
   * ★★ NÚT PHỤ ĐỨNG NGAY CẠNH NÚT CHỌN TỆP — vị trí hiện tại Sếp chốt 17/09/2026. Chỗ VẼ nằm ở
   * cuối `return` (không phải ở hàng tiêu đề), xem khối chú thích tại đó để biết vì sao đã dời hai
   * lần và đừng trả về chỗ cũ.
   *
   * 🔴 TUỲ CHỌN, và mặc định KHÔNG vẽ gì. Component này dùng chung cho 8 chỗ (Hợp đồng · Đơn mua
   * hàng · Hoá đơn VAT · UNC · Phiếu chi · và hộp "Gỡ vướng" trên Kanban). Bắt buộc phải là prop
   * tuỳ chọn — để mặc định đổi bố cục là kéo theo cả 7 ô kia, mà Sếp chỉ khoanh đúng một ô.
   *
   * ⚠️ NƠI GỌI TỰ QUYẾT KHI NÀO VẼ. Ô này không biết gì về "lý do chưa có": điều kiện hiện nút
   * (chưa có tệp, đủ quyền, hồ sơ chưa đóng) nằm ở chỗ gọi. Nhét điều kiện vào đây là ô chứng từ
   * phải biết luật của một chứng từ cụ thể — sai tầng, và 7 ô kia không dùng tới.
   */
  nutPhu,
}: {
  deNghi: DeNghiMuaHang;
  maGiaiDoan: string;
  nhanO: string;
  tieuDe: string;
  moTa?: string;
  batBuoc?: boolean;
  duocSua: boolean;
  khoa?: boolean;
  tepDaCo: MoTaTep[];
  nutPhu?: React.ReactNode;
}) {
  const { datTepVaoOGiaiDoan, goTepGiaiDoan } = useDuLieu();
  const { nguoiDung } = useNguoiDung();
  /* Nhiều bản của cùng một loại chứng từ là chuyện thường: đơn tách cho hai nhà cung cấp thì có
     hai hóa đơn VAT. Nên ô này cho thêm bản nữa, không chỉ một tệp. */
  const [themBanNua, setThemBanNua] = useState(false);

  const nguoi = { uid: nguoiDung.uid, ten: nguoiDung.tenHienThi };

  function luu(tep: MoTaTep, thayBanCu: MoTaTep | undefined): string | null {
    /* `datTepVaoOGiaiDoan` tự gỡ bản cũ CÙNG NHÃN — nên khi muốn giữ nhiều bản, phải đặt nhãn
       khác nhau cho từng bản (`Hợp đồng`, `Hợp đồng (2)`…). Đó là lý do có tham số `thayBanCu`:
       thay thì dùng đúng nhãn cũ, thêm mới thì sinh nhãn tiếp theo. */
    const nhan = thayBanCu
      ? (thayBanCu.ghiChu ?? nhanO)
      : tepDaCo.length === 0
        ? nhanO
        : `${nhanO} (${tepDaCo.length + 1})`;
    const loi = datTepVaoOGiaiDoan(deNghi.id, maGiaiDoan, tep, nhan, nguoiDung.tenHienThi);
    if (loi === null) setThemBanNua(false);
    return loi;
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <FileCheck2 className="size-4 shrink-0 text-text-desc" aria-hidden />
        <span className="text-sm font-semibold text-text-primary">{tieuDe}</span>
        {batBuoc && (
          <span className="rounded-md bg-danger/10 px-1.5 py-0.5 text-xs font-medium text-danger">
            Bắt buộc
          </span>
        )}
        {!batBuoc && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-text-secondary">
            Nếu có
          </span>
        )}
      </div>
      {moTa && <p className="text-xs text-text-desc">{moTa}</p>}

      {/* Các bản đã có — mỗi bản một ô, thay được từng bản. */}
      {tepDaCo.map((t) => (
        <ODinhKemTep
          key={t.id}
          tep={t}
          nhanThem={tieuDe}
          nguoi={nguoi}
          onXong={(moi) => luu(moi, t)}
          khoa={khoa || !duocSua}
          anHuongDan
          onXoa={
            duocSua && !khoa
              ? () => {
                  /* 🐛 SỬA LỖI THẬT 13/09/2026 — "hộp thoại đóng không sạch, cả app đơ phải F5".
                     🔴 HOÃN MỘT NHỊP LÀ CỐ Ý, ĐỪNG GỌI THẲNG `goTepGiaiDoan(...)` Ở ĐÂY.

                     `onXoa` được `ODinhKemTep` gọi từ trong `onDongY` của `HopXacNhan`, ngay
                     cạnh `setHoiXoa(false)`. Gọi thẳng thì React gộp cả hai vào MỘT nhịp:
                     hộp xác nhận vừa nhận `mo=false`, thì cùng lúc `tepDaCo` mất một phần tử
                     → `<ODinhKemTep key={t.id}>` bị tháo → `<HopXacNhan>` bên trong nó biến
                     mất GIỮA LÚC đang đóng.

                     base-ui dọn dẹp HOÀN TOÀN bằng hàm cleanup của `useEffect`
                     (`markOthers.js` gỡ `data-base-ui-inert` + `aria-hidden`,
                     `useScrollLock.js` gỡ `overflow:hidden`). Bị tháo giữa chừng là ba thứ đó
                     KẸT LẠI trên DOM — đúng những gì Sếp chụp được trong F12 ngày 13/09/2026:

                         <body ... style="overflow: hidden;">
                           <div class="min-h-screen bg-background"
                                aria-hidden="true" data-base-ui-inert>...</div>

                     Hậu quả người dùng thấy: mảng trắng che cả sidebar, bấm không ăn, trang
                     không cuộn được, phải F5 (F5 dựng lại DOM nên "tự khỏi").

                     ✅ `setTimeout(..., 0)` cho React commit xong lần đổi `mo=false` trước —
                     lúc đó base-ui đã đi vào vòng đời đóng bình thường (nhả khóa cuộn, gỡ dấu
                     inert), nên nhịp sau tháo cây con là vô hại.

                     ⚠️ Không sửa được tận gốc ở đây vì gốc nằm trong
                     `thanh-phan-dung-chung/o-dinh-kem-tep.tsx` (hai `<Dialog>` nằm BÊN TRONG
                     nhánh `{tep ? ... : ...}`) — tệp đó phiên này KHÔNG được sửa. Khi nào
                     được phép thì nhấc hai hộp thoại đó ra NGOÀI nhánh ternary, rồi mới bỏ
                     được cú hoãn này. */
                  setTimeout(() => {
                    goTepGiaiDoan(deNghi.id, maGiaiDoan, t.id, nguoiDung.tenHienThi);
                  }, 0);
                }
              : undefined
          }
        />
      ))}

      {/* Ô trống để thêm bản mới. Chưa có bản nào thì luôn hiện; đã có rồi thì chỉ hiện khi người
          dùng bấm "Thêm bản nữa" — bày sẵn ô trống dưới mỗi bản làm khối dài ra vô ích. */}
      {/**
       * ★★ NÚT PHỤ ĐỨNG NGAY CẠNH NÚT CHỌN TỆP — Sếp 17/09/2026: ***"Đưa về vị trí này cho dễ
       * quan sát"***, mũi tên vẽ từ nút *"Bổ sung sau"* (đang ở góc phải trên cùng của khối) xuống
       * ngang nút vàng *"Đơn mua hàng"*.
       *
       * 🔴 ĐÂY LÀ LẦN DỜI THỨ HAI, VÀ NGƯỢC VỚI LẦN ĐẦU — ghi lại để người sau đừng "trả về chỗ cũ":
       *   · 16/09/2026 Sếp bảo *"Đưa nút này lên"* → dời từ dưới cùng (dưới dòng "Nhận PDF, ảnh…")
       *     lên ngang TIÊU ĐỀ ô.
       *   · 17/09/2026 Sếp bảo đưa về ngang NÚT CHỌN TỆP. Lên tiêu đề thì nút nằm cách chỗ người
       *     dùng đang nhìn (nút đính kèm) gần một khối chữ, mắt phải nhảy lên mới thấy.
       * Cả hai lần đều là chỉ đạo trực tiếp kèm ảnh, không phải ai đó tuỳ tiện đổi.
       *
       * 🔴 `items-start` CHỨ KHÔNG `items-center`: `ODinhKemTep` cao hai dòng (nút + câu hướng dẫn
       * *"Nhận PDF, ảnh, Word, Excel…"*). Canh giữa thì nút phụ tụt xuống lưng chừng, không thẳng
       * hàng với nút vàng — đúng chỗ Sếp khoanh.
       *
       * ⚠️ NÚT PHỤ CÒN ĐƯỜNG VẼ THỨ HAI ngay dưới. Ô trống chỉ hiện khi **chưa có tệp nào** (hoặc
       * người dùng bấm "Thêm bản nữa"); nếu chỉ vẽ ở đây thì hồ sơ đã đính tệp rồi là nút biến mất
       * im lặng. Nơi gọi hiện đang tự ẩn nút khi đã có tệp, nhưng đó là luật của NƠI GỌI — ô này
       * không được phép nuốt mất thứ người ta truyền vào.
       */}
      {tepDaCo.length === 0 || themBanNua ? (
        <ODinhKemTep
          nhanThem={tieuDe}
          nguoi={nguoi}
          onXong={(moi) => luu(moi, undefined)}
          batBuoc={batBuoc && tepDaCo.length === 0}
          khoa={khoa || !duocSua}
          anHuongDan={tepDaCo.length > 0}
          /* 🔴 TRUYỀN XUỐNG TẬN NÚT, không bọc flex ở ngoài — Sếp 17/09/2026 *"Đưa gần lại, sao
             phải để cách xa nhau vậy"*. Bọc flex ở đây thì nút phụ đứng cạnh CẢ Ô, mà ô rộng bằng
             câu hướng dẫn dài gần 500px bên dưới nó. Xem `nutKemTheo` ở `o-dinh-kem-tep.tsx`. */
          nutKemTheo={nutPhu}
        />
      ) : (
        nutPhu && <span className="flex flex-wrap items-center gap-2">{nutPhu}</span>
      )}

      {tepDaCo.length > 0 && !themBanNua && duocSua && !khoa && (
        <button
          type="button"
          onClick={() => setThemBanNua(true)}
          className="min-h-11 w-fit text-left text-xs font-medium text-primary underline-offset-2 hover:underline md:min-h-9"
        >
          + Thêm bản nữa
        </button>
      )}
    </section>
  );
}
