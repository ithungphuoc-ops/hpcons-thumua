"use client";

// ============================================================
// KHỐI "KẾT QUẢ" CỦA BƯỚC ⑧ — CHỨNG TỪ CỦA BỘ HỒ SƠ THANH TOÁN GOM TỪ CÁC BƯỚC TRƯỚC
//
// ★★ Sếp 15/09/2026 (chiều): *"Bố cục lại bước 8, đang bị trùng lặp bộ hồ sơ đầy đủ của thanh
//    toán"*.
//
// 🔴 CHỖ TRÙNG ĐÃ ĐO ĐƯỢC, CHÉP LẠI ĐÂY ĐỂ KHÔNG AI DỰNG LẠI: trên cùng một màn hình bước ⑧,
//    **Hóa đơn VAT** và **Ủy nhiệm chi** hiện BA lần (danh sách trường ĐẦU VÀO · ô nộp tệp ·
//    khối này), **Hợp đồng** và **Phiếu chi** hiện HAI lần (ô nộp tệp · khối này).
//
// ★★★ SẾP 15/09/2026 (LƯỢT THỨ TƯ TRONG NGÀY) — MỘT DANH SÁCH DUY NHẤT, SỐ LIỀN MẠCH.
//    Nguyên văn: ***"Bố cục lại này theo đúng thứ tự a đã cung cấp, sao e làm nó lộn xộn vậy"***.
//
// 🔴 CHỖ LÀM SAI, CHÉP LẠI ĐỂ KHÔNG AI DỰNG LẠI: Sếp đưa MỘT danh sách liền mạch 9 mục. Bản trước
//    lại **bẻ làm hai cụm** — khối này bày 1 · 2 · 4 · 5, rồi bốn ô nộp tệp (Hợp đồng · Hoá đơn
//    VAT · Uỷ nhiệm chi · Phiếu chi) xếp rời bên dưới **không mang số nào**. Trên màn hình số
//    nhảy cóc 1 · 2 · 4 · 5 rồi hết. Nhìn vào thấy lộn xộn là đúng.
//
// ✅ NAY: **KHÔNG LỌC MỤC NÀO NỮA.** Cả 8 mục bày thành một dãy 1→8 liền mạch, mỗi chứng từ xuất
//    hiện **đúng một lần ở đúng vị trí số của nó**. Mục nào nộp tệp tại bước ⑧ (3 · 6 · 7 · 8,
//    khai ở `MA_MUC_NOP_TAI_BUOC_HO_SO_THANH_TOAN`) thì **ô nộp nằm NGAY TRONG dòng ấy** — nơi gọi
//    truyền xuống qua `oNopTheoMuc`, đủ cả xem · tải · nộp · thay · gỡ · thêm bản và nhãn đỏ
//    "Bắt buộc" / "Nếu có".
//
// 🔴 Ô NỘP CHỈ ĐƯỢC DỜI CHỖ, KHÔNG BAO GIỜ ĐƯỢC BỎ — đây là chỗ dễ làm ngược nhất. Phần khối này
//    tự vẽ là **chỉ đọc** (`LienKetTep`, không có đường ghi nào); ô nộp mới là chỗ làm việc thật.
//    Riêng **Phiếu chi** thì ô ở bước ⑧ là chỗ DUY NHẤT trong cả app (CLAUDE.md §3.4b).
//
// 🔴 MỤC 9 *Đính kèm khác* VẪN CHƯA DỰNG — đã ĐO 15/09/2026 và kết luận **không dùng được**
//    `KhuDinhKemGiaiDoan maGiaiDoan="ho_so_thanh_toan"`, vì khoá `"ho_so_thanh_toan"` CHÍNH LÀ
//    `BUOC_DINH_KEM_HO_SO_THANH_TOAN` — cùng ngăn đang chứa Hoá đơn VAT · UNC · Phiếu chi. Đặt khu
//    đính kèm tự do lên khoá đó thì: ① ba chứng từ ấy hiện LẠI lần nữa trong mục 9 (đúng chỗ trùng
//    vừa bị bắt bỏ); ② nút "Gỡ" của khu đó xoá được Hoá đơn VAT thật, làm
//    `vuongMacDuyetHoanThanhDeNghi` chặn đóng hồ sơ; ③ hạn mức `TOI_DA_TEP_MOI_BUOC` = 5 tính CHUNG
//    cho cả ngăn, nên mục 9 chỉ còn 1–2 chỗ rồi báo "Đã đủ 5 tệp cho bước này".
//    👉 Muốn có mục 9 thì phải có **khoá ngăn riêng** — việc đó CHƯA ĐƯỢC SẾP DUYỆT. Đừng tự chế.
//
// ⚠️ DỮ LIỆU KHÔNG ĐỔI MỘT DÒNG: `dungBoHoSoThanhToan` vẫn trả **đủ 8 mục**, nên bộ đẩy sang app
//    Kế toán vẫn nguyên vẹn. Đây thuần là việc BỐ CỤC. Đừng "dọn cho gọn" bằng cách xoá mục ở
//    tầng dữ liệu — xoá là bên nhận hụt một khoá mà không có gì báo.
//
// ★★ Ban lãnh đạo 26/08/2026: *"Tạo thêm 1 trường 'Kết quả'. Sẽ được link kết quả từ các bước
//    trên"*, kèm mục đích *"để sau này có thể lấy dữ liệu này đẩy qua app kế toán"*.
//
// ★★ Sếp 15/09/2026: *"Bố cục và kiểm tra nếu chưa có thì thêm các trường thông tin sau"* — đã sắp
//    lại thứ tự (Hợp đồng trước Đơn mua hàng), tách Hoá đơn VAT / Uỷ nhiệm chi thành hai mục, nhóm
//    Phiếu giao hàng theo từng lần giao, và biến mục 1 thành liên kết bấm được sang App Request.
//    🔴 Mục 9 *Đính kèm khác* CHƯA dựng — bước ⑧ không có ô đính tệp tự do; lý do đầy đủ ở khối
//    chú thích đầu `2-quy-trinh/bo-ho-so-thanh-toan.ts`. Đừng thêm ô đính kèm ở đây để "cho đủ".
//
// ★★ Sếp 15/09/2026 (lượt thứ ba trong ngày) — HAI VIỆC, cả hai đều ở khối này:
//    ① ***"Bỏ ghi chú này"*** → bỏ hai dòng chữ dưới tiêu đề. Nguyên văn hai dòng và lý do vì sao
//       kiến thức trong đó vẫn phải được giữ lại (dạng chú thích) nằm ngay chỗ chúng từng đứng,
//       phía trên thẻ `<ol>`.
//    ② ***"Đây ko phải là link PO in. mà là file PO ký đính kèm đã đính kèm ở bước 4, chỉ cần link
//       xuống thôi"*** → mục 4 thôi trỏ tờ in `/in/don-hang/{id}`, nay bày TỆP như mục 2 và mục 5.
//       Nhánh vẽ cũ đã bỏ; xem khối ❌ trong phần vẽ ruột mục.
//
// 🔴 CHỈ BÀY, KHÔNG CHO ĐÍNH KÈM Ở ĐÂY. Mỗi mục trỏ tới chứng từ đã đính ở bước của nó. Cho đính
//    lại tại đây là cùng một chứng từ có hai bản trong hồ sơ, và khi hai bản khác nhau thì không
//    ai biết bản nào đúng.
//
// 🔴 DANH SÁCH MỤC VÀ ĐIỀU KIỆN ĐỦ/THIẾU NẰM Ở `2-quy-trinh/bo-ho-so-thanh-toan.ts`, không
//    viết lại ở đây. Cửa API đẩy sang app Kế toán sau này gọi CÙNG hàm đó, nên màn hình và dữ
//    liệu đẩy đi không thể lệch nhau.
// ============================================================

import type { ReactNode } from "react";
import { Check, ExternalLink, FileText, Minus } from "lucide-react";
/* 📌 ĐÃ BỎ `import Link from "next/link"` ngày 15/09/2026 — nó chỉ phục vụ liên kết tờ PO in mà
   Sếp cho bỏ khỏi mục 4. Cần lại thì thêm lại, nhưng đọc khối ❌ ở nhánh vẽ mục 4 trước. */
/* 🔴 DÙNG `LienKetTep`, KHÔNG dùng `ODinhKemTep`: ô đính kèm cần `onXong` / `nguoi` để GHI, mà
   khối này chỉ XEM. Truyền prop giả cho một ô đính kèm rồi khóa lại là mời người sau mở khóa —
   `LienKetTep` không có đường ghi nào nên không thể lỡ tay. */
import { LienKetTep } from "@/1-giao-dien/thanh-phan-dung-chung/lien-ket-tep";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import {
  dungBoHoSoThanhToan,
  laMaCoONop,
  type MaMucCoONop,
  mucDaCo,
  tomTatBoHoSo,
} from "@/2-quy-trinh/bo-ho-so-thanh-toan";
import type { BaoGia, DeNghiMuaHang, DonDatHang, PhieuNhanHang } from "@/3-du-lieu/kieu-du-lieu";

export function KhoiBoHoSoThanhToan({
  deNghi,
  poCuaDeNghi,
  phieuCuaDeNghi,
  /** Bảng báo giá của đề nghị — chỉ để tra ra bản báo giá ĐÃ ĐƯỢC CHỌN (Sếp 26/08/2026). */
  baoGiaCuaDeNghi,
  oNopTheoMuc,
}: {
  deNghi: DeNghiMuaHang;
  poCuaDeNghi: DonDatHang[];
  phieuCuaDeNghi: PhieuNhanHang[];
  baoGiaCuaDeNghi: BaoGia[];
  /**
   * ★★ Ô NỘP TỆP CỦA TỪNG MỤC — Sếp 15/09/2026 (*"Bố cục lại này theo đúng thứ tự a đã cung
   * cấp"*). Khối này bày cả 8 mục thành một dãy liền mạch; mục nào nộp tệp ngay tại bước ⑧ thì
   * nơi gọi truyền `<OChungTuBatBuoc>` của mục đó xuống đây, và nó được vẽ **ngay trong dòng**.
   *
   * 🔴 VÌ SAO NHẬN SẴN PHẦN TỬ CHỨ KHÔNG TỰ DỰNG `OChungTuBatBuoc` Ở ĐÂY: ô nộp cần `duocSua`,
   * `khoa`, `tepDaCo`, `maGiaiDoan`, `nhanO` — toàn thứ do trang chi tiết tính từ quyền và trạng
   * thái hồ sơ. Tính lại ở đây là hai chỗ cùng quyết định một câu hỏi, rồi sớm muộn lệch nhau.
   *
   * 🔴 KIỂU LÀ `Record` ĐẦY ĐỦ (không `Partial`): thiếu một ô là **không biên dịch được**. Đó là
   * chốt duy nhất ngăn việc thêm mã vào `MA_MUC_NOP_TAI_BUOC_HO_SO_THANH_TOAN` rồi quên truyền ô
   * — quên thì dòng đó lặng lẽ mất đường nộp tệp, không lỗi nào báo (riêng **Phiếu chi** thì đây
   * là chỗ nộp DUY NHẤT trong cả app, CLAUDE.md §3.4b).
   */
  oNopTheoMuc: Record<MaMucCoONop, ReactNode>;
  /**
   * ⚠️ VẪN NHẬN NHƯNG HIỆN KHÔNG ĐỌC TỚI — cố ý, không phải sót. Đọc trước khi "dọn cho gọn".
   *
   * Prop này sinh ra để gác **tờ PO in** (`/in/don-hang/{id}`) vì tờ đó có đơn giá. Sếp 15/09/2026
   * cho bỏ liên kết in khỏi mục 4 (*"Đây ko phải là link PO in…"*), nên trong khối này hiện không
   * còn gì phải gác.
   *
   * 🔴 GIỮ LẠI VÌ HAI LÝ DO, CẢ HAI ĐỀU THẬT:
   *   ① `trang/de-nghi-chi-tiet.tsx` vẫn truyền `xemGia={quyen.xemGia}`. Bỏ khỏi kiểu là tệp đó
   *      không biên dịch được, mà tệp đó đang do phiên khác sửa (CLAUDE.md §6.6).
   *   ② Ai dựng lại bất kỳ liên kết nào tới tờ in trong khối này thì **bắt buộc** gác lại bằng
   *      prop này — bỏ đi rồi thì người sau dựng liên kết mà không còn gì nhắc phải gác.
   *
   * ⚠️ ĐỪNG hiểu dòng này thành "tệp đính kèm không cần chặn giá". Tệp NCC ký thường CÓ giá, và
   * hiện nó không hề bị chặn — nhưng chặn ở đây là chặn hình thức (cùng tệp đó đang bày ngay bên
   * dưới ở ô nộp bước ⑧, không qua lớp quyền nào). Muốn chặn thật thì tách document ở tầng dữ
   * liệu, CLAUDE.md §3.5 nguyên tắc 3.
   */
  xemGia: boolean;
}) {
  /* ĐỦ TÁM MỤC — giữ nguyên để bộ đẩy sang app Kế toán không hụt khoá nào. */
  const muc = dungBoHoSoThanhToan(deNghi, poCuaDeNghi, phieuCuaDeNghi, baoGiaCuaDeNghi);

  /**
   * ❌ ĐÃ BỎ PHÉP LỌC `mucBay` — Sếp 15/09/2026 (lượt thứ tư): *"Bố cục lại này theo đúng thứ tự a
   * đã cung cấp, sao e làm nó lộn xộn vậy"*. ĐỌC TRƯỚC KHI ĐỊNH LỌC LẠI.
   *
   * Ở đây từng có `muc.filter((m) => !MA_MUC_NOP_TAI_BUOC_HO_SO_THANH_TOAN.includes(m.ma))` để
   * giấu bốn mục có ô nộp riêng bên dưới. Hậu quả trên màn hình: số nhảy cóc **1 · 2 · 4 · 5**,
   * còn 3 · 6 · 7 · 8 nằm rời bên dưới **không mang số**. Nay bày đủ 8 mục theo một dãy liền
   * mạch, và ô nộp đi vào đúng dòng của nó — xem `oNopTheoMuc`.
   *
   * 🔴 HUY HIỆU ĐẾM TRÊN ĐÚNG DANH SÁCH ĐANG BÀY (`muc`, cả 8 mục) — nay con số khớp đúng những
   * dòng người dùng nhìn thấy, không cần đối chiếu gì thêm.
   *
   * 📌 `tong` quay về **4** (mục 2 báo giá · 3 hợp đồng · 4 đơn mua hàng · 5 phiếu giao hàng).
   * Bản lọc trước đó đếm 3 vì Hợp đồng bị lọc mất. **Không luật nghiệp vụ nào đổi** — `batBuoc`
   * của từng mục giữ nguyên, `tomTatBoHoSo` giữ nguyên; chỉ danh sách đưa vào đếm là đổi.
   *
   * ⚠️ TUYỆT ĐỐI ĐỪNG VIẾT CỨNG SỐ 4 VÀO CÂU CHỮ — `tong` đếm tại lúc chạy (xem `tomTatBoHoSo`).
   */
  const tomTat = tomTatBoHoSo(muc);

  /**
   * ❌ ĐÃ BỎ NÚT "THU GỌN" VÀ STATE `moRong` — Sếp 15/09/2026: *"Đưa dữ liệu này lên, bỏ nút thu
   * gọn đi. Bố cục lại"*. Khối nay LUÔN MỞ.
   *
   * 🔴 CHÉP LẠI LÝ DO CŨ ĐỂ KHÔNG MẤT DẤU VẾT CHỈ ĐẠO: nút thu gọn có từ 27/08/2026 (*"Mục này
   * thêm nút group lại cho a"*), và nó mặc định MỞ khi còn thiếu vì *"người lập mở trang ra phải
   * thấy ngay mình thiếu gì, chứ không phải bấm thêm một cái mới biết"*.
   * 👉 Yêu cầu đó nay được thoả mãn MẠNH HƠN: luôn mở thì không còn trạng thái nào che danh sách
   *    thiếu, kể cả khi người dùng tự bấm thu lại. Nên đây không phải là đảo chỉ đạo cũ — chỉ là
   *    bỏ cái cơ chế từng có khả năng giấu nó.
   *
   * ⚠️ ĐỪNG DỰNG LẠI NÚT NÀY. Lo ngại duy nhất của việc luôn mở là danh sách đẩy nút "Hoàn thành
   * quy trình" xuống thấp — nay đã hết, vì khối này đứng TRƯỚC các ô nộp tệp (Sếp 15/09/2026),
   * còn nút "Hoàn thành quy trình" vẫn ở cuối khối bước ⑧.
   *
   * 📌 Huy hiệu "Đủ n/n mục bắt buộc" GIỮ — nó là THÔNG TIN, không phải nút.
   */

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="size-4 shrink-0 text-text-desc" aria-hidden />
        {/* 🔴 THÔI GỌI LÀ "ĐẦY ĐỦ" — Sếp 15/09/2026 chốt: *"bỏ chữ đầy đủ"*, giữ nguyên tên
            "Bộ hồ sơ thanh toán".
            📌 Lý do bỏ chữ đó lúc ấy là khối chỉ bày 4/8 mục. Nay khối bày **đủ 8 mục**, nên chữ
            "đầy đủ" về lý là đúng lại — **VẪN KHÔNG THÊM VÀO**: Sếp đã chốt tên khối, và mục 9
            *Đính kèm khác* thì chưa dựng nên vẫn chưa thật sự "đầy đủ".
            📌 Bản dựng trước tôi đặt là "Chứng từ gom từ các bước trước" — Sếp không chọn tên đó.
            Đừng đổi lại: tên khối là chữ người dùng quen mắt, và Sếp đã chốt. */}
        <span className="text-sm font-semibold text-text-primary">Bộ hồ sơ thanh toán</span>
        {/* Trạng thái có CẢ màu lẫn chữ (Design System V1.1) — không chỉ dựa vào màu. */}
        <StatusBadge
          label={
            tomTat.thieu.length === 0
              ? `Đủ ${tomTat.tong}/${tomTat.tong} mục bắt buộc`
              : `Còn thiếu ${tomTat.thieu.length}/${tomTat.tong} mục`
          }
          tone={tomTat.thieu.length === 0 ? "success" : "warning"}
        />
      </div>
      {/**
        * ❌❌ ĐÃ BỎ HAI DÒNG GHI CHÚ DƯỚI TIÊU ĐỀ — Sếp 15/09/2026, khoanh đỏ đúng hai dòng đó và
        * ghi ***"Bỏ ghi chú này"***. ĐỌC HẾT KHỐI NÀY TRƯỚC KHI ĐỊNH VIẾT LẠI MỘT CÂU TƯƠNG TỰ.
        *
        * Hai dòng bị bỏ, chép nguyên văn để nhận ra mà đừng dựng lại:
        *   ① *"Gom từ các bước trước, không đính kèm lại ở đây. Sửa thì về đúng bước của chứng
        *      từ."*
        *   ② *"{n} mục còn lại của bộ hồ sơ nộp ở các ô đính kèm ngay phía dưới, không liệt kê lại
        *      ở đây: 3. Hợp đồng · 6. Hoá đơn VAT · 7. Ủy nhiệm chi · 8. Phiếu chi. Bộ chuyển sang
        *      app Kế toán vẫn đủ 8 mục."*
        *
        * 🔴 CHỈ BỎ PHẦN HIỂN THỊ — KIẾN THỨC THÌ GIỮ NGUYÊN Ở ĐÂY, vì nó vẫn đúng và vẫn là thứ
        * người sửa mã cần biết:
        *   · Phần khối này **tự vẽ** là chỉ đọc, không có đường ghi nào. Đường ghi duy nhất là các
        *     ô nộp do nơi gọi truyền xuống (`oNopTheoMuc`); sửa chứng từ của mục KHÔNG có ô nộp
        *     thì phải về đúng bước của nó.
        *   · `dungBoHoSoThanhToan` **vẫn trả đủ 8 mục**, nên bộ đẩy sang app Kế toán không hụt gì.
        *
        * ✅ CÁI GIÁ CŨ ĐÃ HẾT (15/09/2026, lượt thứ tư): trước đó số thứ tự nhảy cóc **1 · 2 · 4 ·
        * 5** mà không còn chỗ nào giải thích — Sếp bắt đúng chỗ đó (*"sao e làm nó lộn xộn vậy"*).
        * Nay danh sách chạy liền 1→8 nên **không còn gì phải giải thích**, và đó chính là lý do
        * KHÔNG được viết lại hai dòng ghi chú trên: thêm chữ vào lúc này là vừa trái chỉ đạo *"Bỏ
        * ghi chú này"*, vừa giải thích một chuyện không còn tồn tại.
        *
        * ⚠️ SỐ MỤC LÀ SỐ CỦA SẾP, KHÔNG PHẢI SỐ DÒNG — giữ `m.stt` từ tầng dữ liệu, tuyệt đối đừng
        * đánh lại theo chỉ mục mảng. Số mục là cách Sếp gọi tên từng chứng từ và là thứ tự đối
        * chiếu với app Kế toán; đánh lại là hai bên cùng nói "mục 3" mà chỉ hai chứng từ khác nhau.
        */}

      <ol className="flex flex-col gap-2">
        {muc.map((m) => {
          const co = mucDaCo(m);
          /**
           * ★★ Ô NỘP CỦA CHÍNH DÒNG NÀY — Sếp 15/09/2026 (*"Bố cục lại này theo đúng thứ tự a đã
           * cung cấp"*). `null` nghĩa là mục chỉ đọc, chứng từ đến từ bước khác.
           *
           * 🔴 `laMaCoONop` là type guard nên KHÔNG phải ép kiểu ở đây — xem
           * `2-quy-trinh/bo-ho-so-thanh-toan.ts`. Đừng đổi thành `oNopTheoMuc[m.ma as ...]`: ép
           * kiểu là mở đường cho một mã không có trong bảng trả `undefined` lặng lẽ, và dòng đó
           * mất đường nộp tệp mà không lỗi nào báo.
           */
          const oNop = laMaCoONop(m.ma) ? oNopTheoMuc[m.ma] : null;
          return (
            <li
              key={m.ma}
              className={`flex flex-col gap-1.5 rounded-lg border p-(--hp-md-row-pad) ${
                co
                  ? "border-border bg-card"
                  : m.batBuoc
                    ? "border-warning/40 bg-warning-bg"
                    : "border-border bg-muted"
              }`}
            >
              {oNop ? (
                /**
                 * ★ DÒNG CÓ Ô NỘP — số thứ tự và dấu ✓/– ở cột trái, ô nộp chiếm phần còn lại.
                 *
                 * 🔴 CỐ Ý KHÔNG IN `m.ten` Ở ĐÂY: chính `OChungTuBatBuoc` đã in tên chứng từ kèm
                 * nhãn đỏ *"Bắt buộc"* / *"Nếu có"*. In thêm một lần nữa là tên hiện hai lần
                 * trong cùng một dòng — đúng kiểu lộn xộn vừa bị bắt bỏ.
                 * 📌 Tên của ô trùng đúng chữ Sếp dùng trong danh sách 9 mục (Hợp đồng · Hóa đơn
                 * VAT · Ủy nhiệm chi · Phiếu chi), nên không mất thông tin nào.
                 *
                 * ⚠️ DẤU ✓/– ĐỌC TỪ `mucDaCo(m)` — tức từ tầng dữ liệu, KHÔNG phải từ ô nộp. Với
                 * mục 3 hai nguồn này có thể lệch: dòng đọc `tepHopDong` (gộp cả khóa cũ
                 * `dat_hang`), còn ô nộp bày `tepHopDongSuaDuoc` (chỉ khóa canonical). Hồ sơ đính
                 * hợp đồng trong ba ngày 24–26/08/2026 sẽ hiện ✓ mà ô nộp trống. Đó là hành vi có
                 * sẵn của cả hai hàm, cố ý giữ — xem `tepHopDongSuaDuoc` ở
                 * `2-quy-trinh/chung-tu-cuoi-quy-trinh.ts`. Đừng "chữa" bằng cách cho ô nộp đọc
                 * `tepHopDong`: bấm xóa tệp khóa cũ sẽ báo sai *"Tệp này không còn trong hồ sơ"*.
                 *
                 * 📌 `min-h-6 items-center` cho cột trái để số và dấu ✓ nằm ngang hàng tiêu đề
                 * của ô nộp — cùng cách hàng nhãn của mục chỉ đọc đang canh.
                 */
                <div className="flex gap-2">
                  <div className="flex min-h-6 shrink-0 items-center gap-2">
                    <span className="min-w-5 text-xs tabular-nums text-text-desc">{m.stt}.</span>
                    {co ? (
                      <Check className="size-4 shrink-0 text-success" aria-hidden />
                    ) : (
                      <Minus className="size-4 shrink-0 text-text-desc" aria-hidden />
                    )}
                  </div>
                  {/* `min-w-0` bắt buộc: thiếu nó thì tên tệp dài trong ô nộp không co được và
                      đẩy cả dòng tràn ngang trên màn 375px. */}
                  <div className="min-w-0 flex-1">{oNop}</div>
                </div>
              ) : (
                <>
              {/* 📌 HÀNG NHÃN — `min-h-6` để mục CÓ tệp và mục KHÔNG tệp có hàng đầu cao bằng
                  nhau (Sếp 15/09/2026 *"bố cục lại"*). Không đặt chiều cao thì hàng có huy hiệu
                  "Nếu có" cao hơn hàng trơn, cả cột nhìn răng cưa. */}
              <div className="flex min-h-6 flex-wrap items-center gap-2">
                <span className="min-w-5 text-xs tabular-nums text-text-desc">{m.stt}.</span>
                {co ? (
                  <Check className="size-4 shrink-0 text-success" aria-hidden />
                ) : (
                  <Minus className="size-4 shrink-0 text-text-desc" aria-hidden />
                )}
                <span className="text-sm font-medium text-text-primary">{m.ten}</span>
                {/* Nói rõ mục nào "nếu có" — để người dùng không đi tìm chứng từ không tồn tại. */}
                {!m.batBuoc && (
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-text-secondary">
                    Nếu có
                  </span>
                )}
                {m.tep.length > 1 && (
                  <span className="text-xs text-text-desc">{m.tep.length} tệp</span>
                )}
              </div>

              {/**
                * ★ RUỘT CỦA MỤC GOM VÀO MỘT CỘT THỤT LỀ — Sếp 15/09/2026 *"bố cục lại"*.
                *
                * 📌 Trước đây liên kết và tệp bám sát mép trái, còn nhóm thì thụt `pl-6`: ba mức
                * lề khác nhau trong cùng một mục, mắt không lần được cái nào thuộc cái nào. Nay
                * mọi thứ của mục nằm chung một cột thụt `pl-7` — thẳng hàng với biểu tượng ✓/–
                * của hàng nhãn, nên vẫn đọc ra là "thuộc mục này".
                *
                * ⚠️ `pl-7` (28px) chứ không thụt tới chữ nhãn (52px): màn 375px còn lại ~280px cho
                * tên tệp, thụt sâu hơn là tên tệp xuống dòng liên tục.
                */}
              <div className="flex flex-col gap-1 pl-7">
                {/**
                  * ★★ LIÊN KẾT SANG APP KHÁC — mục 1 "Phiếu đề nghị", Sếp 15/09/2026.
                  *
                  * 🔴 DÙNG `<a>` THƯỜNG, KHÔNG `next/link`: đây là địa chỉ đầy đủ sang App Request,
                  * không phải một tuyến trong app này. `rel="noopener noreferrer"` vì mở tab mới.
                  *
                  * 🔴 VẼ TRƯỚC câu ghi chú bên dưới — câu đó nói *"bấm liên kết trên"*, đảo chỗ là
                  * câu chỉ sai hướng. (Câu đó nói về liên kết TRONG CÙNG MỤC này, không dính gì tới
                  * việc cả khối đã được dời lên đầu bước ⑧ ngày 15/09/2026 — vẫn đúng.)
                  *
                  * 📌 Tầng dữ liệu đã bỏ trống trường này khi không tra ra đúng hồ sơ, nên ở đây
                  * không thể vẽ ra một nút chết. Đừng thêm nhánh dự phòng tự ghép địa chỉ.
                  */}
                {(m.lienKetNgoai ?? []).map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-medium text-primary underline-offset-2 hover:underline md:min-h-9"
                  >
                    <ExternalLink className="size-4 shrink-0" aria-hidden />
                    {l.nhan}
                  </a>
                ))}

                {/* Tệp của mục — chỉ XEM và TẢI, không gỡ được từ đây (sửa ở bước của nó). */}
                {m.tep.map((t) => (
                  <LienKetTep key={t.id} tep={t} />
                ))}

                {/**
                  * ★★ NHÓM BÊN TRONG MỤC — Ban lãnh đạo 26/08/2026: *"Tạo group lại nhé"*.
                  * Mục 2 (bản được chọn / bảng so sánh) và — từ 15/09/2026 — mục 5 (Phiếu giao
                  * hàng, mỗi lần giao một nhóm) dùng nhóm. Mục Hoá đơn / UNC nay đã tách hẳn thành
                  * hai mục riêng nên không còn dùng nhóm.
                  *
                  * 📌 Nhóm RỖNG vẫn hiện tên kèm câu "chưa có" — người đọc phải thấy là *đã kiểm
                  * và chưa có*, khác hẳn với *không biết có hay không*. Ẩn nhóm rỗng đi là bộ hồ sơ
                  * trông đủ trong khi thiếu.
                  *
                  * 📌 `pl-3` (trước 15/09/2026 là `pl-6`): cả ruột mục nay đã thụt `pl-7` ở khung
                  * cha, nên nhóm chỉ cần thụt thêm một bậc nhỏ để thấy là cấp con.
                  */}
                {(m.nhom ?? []).map((n) => (
                  <div key={n.ten} className="flex flex-col gap-1 pl-3">
                    <span className="text-xs font-medium text-text-secondary">{n.ten}</span>
                    {n.tep.map((t) => (
                      <LienKetTep key={t.id} tep={t} />
                    ))}
                    {n.tep.length === 0 && (
                      <span className="text-xs text-text-desc">{n.ghiChu ?? "Chưa có."}</span>
                    )}
                    {n.tep.length > 0 && n.ghiChu && (
                      <span className="text-xs text-warning-soft">{n.ghiChu}</span>
                    )}
                  </div>
                ))}

                {/**
                  * ❌ ĐÃ BỎ NHÁNH VẼ TỜ IN ĐƠN MUA HÀNG (`chungTuTrongApp`) — Sếp 15/09/2026,
                  * khoanh đỏ mục 4: ***"Đây ko phải là link PO in. mà là file PO ký đính kèm đã
                  * đính kèm ở bước 4, chỉ cần link xuống thôi"***.
                  *
                  * Mục 4 nay bày **tệp** qua `LienKetTep` ở trên, y như mục 2 và mục 5 — "chỉ cần
                  * link xuống thôi". Trường `chungTuTrongApp` đã bỏ hẳn khỏi `MucHoSoThanhToan`.
                  *
                  * ✅ Tờ in `/in/don-hang/[id]` KHÔNG mồ côi: còn nút *"In đơn mua hàng"* ở
                  * `trang/don-hang-chi-tiet.tsx` (sau `quyen.xemGia`) và nút *"Cất và In"* ở
                  * `trang/don-hang-lap-moi.tsx`. Đã đo 15/09/2026.
                  *
                  * 🔴 AI DỰNG LẠI LIÊN KẾT IN Ở ĐÂY thì phải gác lại `xemGia` — tờ in có đơn giá.
                  * Đó là lý do prop `xemGia` vẫn nhận ở đầu tệp dù hiện không đọc tới.
                  */}

                {m.ghiChu && <span className="text-xs text-warning-soft">{m.ghiChu}</span>}
              </div>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
