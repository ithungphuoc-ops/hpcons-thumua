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
// ✅ NAY: **KHÔNG LỌC MỤC NÀO NỮA.** Cả 9 mục bày thành một dãy 1→9 liền mạch (8 mục tới
//    15/09/2026, thêm mục 9 ngày 16/09/2026), mỗi chứng từ xuất
//    hiện **đúng một lần ở đúng vị trí số của nó**. Mục nào nộp tệp tại bước ⑧ (nay là 4 · 6 · 7 ·
//    8 · 9 — mục 3 đã bỏ ô nộp ngày 16/09/2026; khai ở `MA_MUC_NOP_TAI_BUOC_HO_SO_THANH_TOAN`) thì **ô nộp nằm NGAY TRONG dòng ấy** — nơi gọi
//    truyền xuống qua `oNopTheoMuc`, đủ cả xem · tải · nộp · thay · gỡ · thêm bản và nhãn đỏ
//    "Bắt buộc" / "Nếu có".
//
// 🔴 Ô NỘP CHỈ ĐƯỢC DỜI CHỖ, KHÔNG BAO GIỜ ĐƯỢC BỎ — đây là chỗ dễ làm ngược nhất. Phần khối này
//    tự vẽ là **chỉ đọc** (`LienKetTep`, không có đường ghi nào); ô nộp mới là chỗ làm việc thật.
//    Riêng **Phiếu chi** thì ô ở bước ⑧ là chỗ DUY NHẤT trong cả app (CLAUDE.md §3.4b).
//
// ✅ MỤC 9 *Đính kèm khác* ĐÃ DỰNG 16/09/2026 — Sếp: ***"Cần thiết mở thêm để đính kèm tài liệu
//    khác"***. Khối này trước đây ghi *"VẪN CHƯA DỰNG… CHƯA ĐƯỢC SẾP DUYỆT"*; nay đã được duyệt.
// 🔴 ĐIỀU KIỆN SỐNG CÒN GIỮ NGUYÊN — mục 9 phải có **NGĂN RIÊNG** (`BUOC_DINH_KEM_KHAC`), TUYỆT
//    ĐỐI KHÔNG dùng `maGiaiDoan="ho_so_thanh_toan"`. Ba hệ quả đã đo 15/09/2026, chép lại vì chúng
//    vẫn đúng: ① Hoá đơn VAT · UNC · Phiếu chi hiện LẠI lần nữa trong mục 9 (đúng chỗ trùng vừa bị
//    bắt bỏ); ② nút "Gỡ" của khu đó **xoá được Hoá đơn VAT thật**, làm
//    `vuongMacDuyetHoanThanhDeNghi` chặn đóng hồ sơ; ③ hạn mức `TOI_DA_TEP_MOI_BUOC` = 5 tính CHUNG
//    cho cả ngăn, nên mục 9 chỉ còn 1–2 chỗ rồi báo "Đã đủ 5 tệp cho bước này".
//
// ★★★ BA CHỈ ĐẠO SẾP 16/09/2026 CHẠM VÀO KHỐI NÀY, ngoài mục 9 ở trên:
//    ① ***"Tách làm 2 mục riêng"*** — mục 3 (Hợp đồng) và mục 4 (Đơn mua hàng) thôi dùng chung một
//       tệp. Tệp đính ở ngăn chung TRƯỚC khi tách hiện ở CẢ HAI mục; luật ở
//       `bo-ho-so-thanh-toan.ts` → `tepDonMuaHangCuaMuc4`.
//    ② ***"Bỏ nút đính kèm này, hợp đồng sẽ được link từ bước 3 xuống"*** — mục 3 THÔI có ô nộp,
//       chỉ còn bày tệp. Ô nộp thật nằm ở bước ④ *Lập đơn mua hàng* (và bước ⑤).
//    ③ ***"Bỏ ghi chú này"*** (khoanh nhãn xám "Nếu có" cạnh mục 1) — xem `hienNhanNeuCo`.
//
// ⚠️ TẦNG DỮ LIỆU: `dungBoHoSoThanhToan` trả **đủ 9 mục** (8 khoá cũ y nguyên + `dinh_kem_khac`
//    thêm 16/09/2026), nên bộ đẩy sang app
//    Kế toán vẫn nguyên vẹn. Đây thuần là việc BỐ CỤC. Đừng "dọn cho gọn" bằng cách xoá mục ở
//    tầng dữ liệu — xoá là bên nhận hụt một khoá mà không có gì báo.
//
// ★★ Ban lãnh đạo 26/08/2026: *"Tạo thêm 1 trường 'Kết quả'. Sẽ được link kết quả từ các bước
//    trên"*, kèm mục đích *"để sau này có thể lấy dữ liệu này đẩy qua app kế toán"*.
//
// ★★ Sếp 15/09/2026: *"Bố cục và kiểm tra nếu chưa có thì thêm các trường thông tin sau"* — đã sắp
//    lại thứ tự (Hợp đồng trước Đơn mua hàng), tách Hoá đơn VAT / Uỷ nhiệm chi thành hai mục, nhóm
//    Phiếu giao hàng theo từng lần giao, và biến mục 1 thành liên kết bấm được sang App Request.
//    ✅ Mục 9 *Đính kèm khác* nay ĐÃ dựng (16/09/2026) — dòng này trước đây ghi "CHƯA dựng"; xem
//    khối ✅ ở trên và `2-quy-trinh/bo-ho-so-thanh-toan.ts`.
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
import { AlertTriangle, Check, ExternalLink, FileText, Info, Minus } from "lucide-react";
/* 📌 ĐÃ BỎ `import Link from "next/link"` ngày 15/09/2026 — nó chỉ phục vụ liên kết tờ PO in mà
   Sếp cho bỏ khỏi mục 4. Cần lại thì thêm lại, nhưng đọc khối ❌ ở nhánh vẽ mục 4 trước. */
/* 🔴 DÙNG `LienKetTep`, KHÔNG dùng `ODinhKemTep`: ô đính kèm cần `onXong` / `nguoi` để GHI, mà
   khối này chỉ XEM. Truyền prop giả cho một ô đính kèm rồi khóa lại là mời người sau mở khóa —
   `LienKetTep` không có đường ghi nào nên không thể lỡ tay. */
import { LienKetTep } from "@/1-giao-dien/thanh-phan-dung-chung/lien-ket-tep";
/* 📌 ĐÃ BỎ `import { StatusBadge }` và `import { tomTatBoHoSo }` ngày 16/09/2026 — cả hai chỉ phục
   vụ huy hiệu đếm mà Sếp cho bỏ (xem khối ❌❌ ngay trên thẻ `<section>`). `tomTatBoHoSo` VẪN CÒN
   NGUYÊN ở `2-quy-trinh/bo-ho-so-thanh-toan.ts` và vẫn là hàm luật — chỉ khối này thôi gọi tới. */
import {
  dungBoHoSoThanhToan,
  hienNhanNeuCo,
  kieuONop,
  laMaCoONop,
  loiKhaiThieuChungTu,
  type MaMucCoONop,
  mucDaCo,
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
   * cấp"*). Khối này bày cả 9 mục thành một dãy liền mạch; mục nào nộp tệp ngay tại bước ⑧ thì
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
  /* ĐỦ CHÍN MỤC (từ 16/09/2026) — giữ nguyên để bộ đẩy sang app Kế toán không hụt khoá nào. */
  const muc = dungBoHoSoThanhToan(deNghi, poCuaDeNghi, phieuCuaDeNghi, baoGiaCuaDeNghi);

  /**
   * ❌ ĐÃ BỎ PHÉP LỌC `mucBay` — Sếp 15/09/2026 (lượt thứ tư): *"Bố cục lại này theo đúng thứ tự a
   * đã cung cấp, sao e làm nó lộn xộn vậy"*. ĐỌC TRƯỚC KHI ĐỊNH LỌC LẠI.
   *
   * Ở đây từng có `muc.filter((m) => !MA_MUC_NOP_TAI_BUOC_HO_SO_THANH_TOAN.includes(m.ma))` để
   * giấu bốn mục có ô nộp riêng bên dưới. Hậu quả trên màn hình: số nhảy cóc **1 · 2 · 4 · 5**,
   * còn 3 · 6 · 7 · 8 nằm rời bên dưới **không mang số**. Nay bày đủ 9 mục theo một dãy liền
   * mạch, và ô nộp đi vào đúng dòng của nó — xem `oNopTheoMuc`.
   *
   * 📌 HUY HIỆU ĐẾM ĐÃ BỎ KHỎI MÀN HÌNH 16/09/2026 — xem khối ❌❌ ngay trên thẻ `<section>`.
   * Phép đếm ở tầng luật (`tomTatBoHoSo`) thì GIỮ NGUYÊN, chỉ khối này thôi gọi tới.
   */

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
   * ⚠️ DÒNG NÀY TỪNG GHI *"Huy hiệu 'Đủ n/n mục bắt buộc' GIỮ — nó là THÔNG TIN, không phải nút"*.
   * Ngày 16/09/2026 Sếp cho bỏ luôn huy hiệu đó; chép lại đây để thấy nó bị bỏ vì một chỉ đạo
   * MỚI, không phải vì ai quên. Lý do đầy đủ ở khối ❌❌ ngay trên thẻ `<section>`.
   */

  /**
   * ❌❌ ĐÃ BỎ HUY HIỆU ĐẾM CẠNH TIÊU ĐỀ — Sếp 16/09/2026, khoanh đỏ đúng huy hiệu đó trong ảnh
   * chụp khối "Bộ hồ sơ thanh toán" và ghi ***"Bỏ những ghi chú này đi"***. ĐỌC HẾT KHỐI NÀY
   * TRƯỚC KHI ĐỊNH DỰNG LẠI MỘT HUY HIỆU TƯƠNG TỰ.
   *
   * Thứ bị bỏ, chép nguyên văn để nhận ra mà đừng dựng lại: một `StatusBadge` ghi
   *   · `Đủ {tong}/{tong} mục bắt buộc`  (tone `success`, khi không thiếu mục nào)
   *   · `Còn thiếu {n}/{tong} mục`      (tone `warning`)
   * dựng từ `const tomTat = tomTatBoHoSo(muc)`.
   *
   * 🔴 CHỈ BỎ PHẦN HIỂN THỊ — PHÉP ĐẾM Ở TẦNG LUẬT GIỮ NGUYÊN TUYỆT ĐỐI. `tomTatBoHoSo` và
   * `mucDaCo` trong `2-quy-trinh/bo-ho-so-thanh-toan.ts` **không đổi một dòng**: chúng là dữ liệu
   * cho bộ đẩy sang app Kế toán sau này, và có bài kiểm trong `kiem-luat-dung-chung.mjs` canh.
   * Ai "dọn cho gọn" bằng cách xoá hai hàm đó là bên nhận hụt phép đếm mà không có gì báo.
   *
   * 📌 KIẾN THỨC CỦA HUY HIỆU VẪN ĐÚNG, GIỮ LẠI Ở ĐÂY: `tong` KHÔNG phải số cố định — nó đếm
   * `batBuoc` tại lúc chạy (từ 13/09/2026 là **4**: mục 2 báo giá · 3 hợp đồng · 4 đơn mua hàng ·
   * 5 phiếu giao hàng). Ai dựng lại huy hiệu thì phải in `tong`, tuyệt đối đừng viết cứng số 4.
   *
   * ✅ BỎ HUY HIỆU KHÔNG LÀM MẤT CHỈ BÁO THIẾU/ĐỦ TRÊN MÀN HÌNH: từng dòng vẫn mang dấu ✓ / – ,
   * vẫn đổi nền (`border-warning/40 bg-warning-bg` khi mục bắt buộc còn thiếu) và vẫn in câu
   * `ghiChu` nói rõ thiếu gì. Tức là trạng thái vẫn có CẢ màu lẫn chữ đúng Design System V1.1 —
   * huy hiệu chỉ là bản tóm tắt lặp lại của những dấu ấy.
   */
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="size-4 shrink-0 text-text-desc" aria-hidden />
        {/* 🔴 THÔI GỌI LÀ "ĐẦY ĐỦ" — Sếp 15/09/2026 chốt: *"bỏ chữ đầy đủ"*, giữ nguyên tên
            "Bộ hồ sơ thanh toán".
            📌 Lý do bỏ chữ đó lúc ấy là khối chỉ bày 4/8 mục. Nay khối bày **đủ 9 mục**, kể cả
            mục 9 *Đính kèm khác* (16/09/2026) — **VẪN KHÔNG THÊM CHỮ "đầy đủ" VÀO**: Sếp đã chốt
            tên khối, và tên khối là chữ người dùng quen mắt.
            📌 Bản dựng trước tôi đặt là "Chứng từ gom từ các bước trước" — Sếp không chọn tên đó.
            Đừng đổi lại: tên khối là chữ người dùng quen mắt, và Sếp đã chốt. */}
        <span className="text-sm font-semibold text-text-primary">Bộ hồ sơ thanh toán</span>
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
        *      app Kế toán vẫn đủ 8 mục."* (con số đó nay là **9** — xem khối đầu tệp)
        *
        * 🔴 CHỈ BỎ PHẦN HIỂN THỊ — KIẾN THỨC THÌ GIỮ NGUYÊN Ở ĐÂY, vì nó vẫn đúng và vẫn là thứ
        * người sửa mã cần biết:
        *   · Phần khối này **tự vẽ** là chỉ đọc, không có đường ghi nào. Đường ghi duy nhất là các
        *     ô nộp do nơi gọi truyền xuống (`oNopTheoMuc`); sửa chứng từ của mục KHÔNG có ô nộp
        *     thì phải về đúng bước của nó.
        *   · `dungBoHoSoThanhToan` **trả đủ 9 mục** (từ 16/09/2026), nên bộ đẩy sang app Kế toán
        *     không hụt gì.
        *
        * ✅ CÁI GIÁ CŨ ĐÃ HẾT (15/09/2026, lượt thứ tư): trước đó số thứ tự nhảy cóc **1 · 2 · 4 ·
        * 5** mà không còn chỗ nào giải thích — Sếp bắt đúng chỗ đó (*"sao e làm nó lộn xộn vậy"*).
        * Nay danh sách chạy liền 1→9 nên **không còn gì phải giải thích**, và đó chính là lý do
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
          /**
           * ★★ HAI KIỂU Ô NỘP — Sếp 16/09/2026 (mục 9 *Đính kèm khác*). Quyết định nằm ở hàm thuần
           * `kieuONop` (`2-quy-trinh/bo-ho-so-thanh-toan.ts`), KHÔNG viết `if` ở đây — nhờ vậy
           * `kiem-luat-dung-chung.mjs` gọi thật được (CLAUDE.md §6.6).
           *
           * 🔴 VÌ SAO PHẢI PHÂN BIỆT: `OChungTuBatBuoc` **tự in tên chứng từ**, còn
           * `KhuDinhKemGiaiDoan` thì không in gì. Vẽ mục 9 bằng nhánh gọn (dành cho ô có tên) là
           * dòng đó hiện ra một cục không tên, không số — người đọc không biết đó là mục mấy.
           */
          const kieu = kieuONop(m.ma);
          /**
           * ★★★ LỜI KHAI "CHƯA CÓ CHỨNG TỪ" LINK TỪ BƯỚC ④ XUỐNG ĐÂY — Sếp 16/09/2026:
           * ***"Ở bước 3, đang có nút chọn 'Bổ sung sau' và 'Không có HĐ' a muốn link cái này
           * xuống mục 8 luôn… Làm tương tự như vậy cho bước 4"***.
           *
           * 🔴 QUYẾT ĐỊNH NẰM Ở HÀM THUẦN `loiKhaiThieuChungTu` (`2-quy-trinh/bo-ho-so-thanh-toan
           * .ts`), KHÔNG viết `if` ở đây — nhờ vậy `kiem-luat-dung-chung.mjs` gọi thật được và chỉ
           * đạo này không thể bị xoá lặng lẽ (CLAUDE.md §6.6: `grep` dấu mốc không bắt được).
           *
           * ⚠️ HÔM NAY MỤC 3 VÀ MỤC 4 HIỆN GIỐNG HỆT NHAU — không phải lỗi vẽ. App đang dùng MỘT
           * ô, MỘT tệp và MỘT trường lý do cho cả hai chứng từ; bảng `KHOA_LY_DO_THIEU_THEO_MUC`
           * đã dựng sẵn theo mã mục nên ngày tách thật thì hai dòng tự chạy độc lập.
           */
          const khai = loiKhaiThieuChungTu(deNghi, m);
          return (
            <li
              key={m.ma}
              className={`flex flex-col gap-1.5 rounded-lg border p-(--hp-md-row-pad) ${
                co
                  ? "border-border bg-card"
                  : khai.baoDo
                    ? /* "Bổ sung sau" → ĐỎ, đúng chữ Sếp *"phải báo đỏ để nhắc đính kèm file"*.
                         Cùng cặp token với hộp "Lý do chưa có" ở bước ④ để hai màn hình nhìn
                         giống nhau về cùng một trạng thái. */
                      "border-danger bg-danger-bg"
                    : khai.loai === "ket_luan"
                      ? /* 🔴 "Không có HĐ" là KẾT LUẬN HỢP LỆ của người dùng, không phải thiếu
                           sót → hạ về nền trung tính, KHÔNG đỏ và cũng không vàng. Tô cảnh báo ở
                           đây là app cãi lại quyết định vừa được ghi (Sếp 13/09/2026: *"Khi chọn
                           vào nút 'Không có HĐ' thì mới ko báo đỏ"*).
                           ⚠️ Chỉ đổi MÀU DÒNG. Mục vẫn `batBuoc`, `mucDaCo` vẫn false và
                           `tomTatBoHoSo` vẫn đếm là thiếu — luật đóng hồ sơ không đổi một dòng. */
                        "border-border bg-muted"
                      : m.batBuoc
                        ? "border-warning/40 bg-warning-bg"
                        : "border-border bg-muted"
              }`}
            >
              {kieu === "o_co_ten" && oNop ? (
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
                {/**
                  * Nói rõ mục nào "nếu có" — để người dùng không đi tìm chứng từ không tồn tại.
                  *
                  * ❌ TRỪ MỤC 1 *Phiếu đề nghị* — Sếp 16/09/2026 khoanh đỏ đúng nhãn xám đó và ghi
                  * ***"Bỏ ghi chú này"***. Mục 1 không phải thứ người dùng nộp (app không giữ bản
                  * sao, bản gốc nằm bên App Request), nên "có hay không có" là câu hỏi vô nghĩa ở
                  * đấy.
                  *
                  * 🔴 ĐIỀU KIỆN ĐỌC TỪ HÀM THUẦN `hienNhanNeuCo`, KHÔNG viết `m.ma !== ...` ở đây,
                  * và **TUYỆT ĐỐI KHÔNG** chữa bằng cách sửa `m.batBuoc` — sửa `batBuoc` là đổi dữ
                  * liệu thật, mục 1 thành bắt buộc và mọi hồ sơ đều báo thiếu. Lý do đầy đủ + bài
                  * kiểm máy: xem `hienNhanNeuCo`.
                  *
                  * 📌 Mục 7 · 8 · 9 GIỮ NGUYÊN nhãn này — Sếp không khoanh chúng, và ở đó nhãn đúng
                  * nghĩa (đơn trả tiền mặt có phiếu chi, trả chuyển khoản thì không).
                  */}
                {hienNhanNeuCo(m) && (
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

                {/**
                  * Tệp của mục — chỉ XEM và TẢI, không gỡ được từ đây (sửa ở bước của nó).
                  *
                  * 🔴 BỎ QUA MỤC CÓ **KHU ĐÍNH KÈM TỰ DO** (mục 9) — Sếp 16/09/2026, khoanh đỏ hai
                  * khối cùng bày một tệp trong mục 9: *"Chọn 1 trong 2 cách hiển thị thôi"*.
                  *
                  * Mục 9 nhận ô nộp kiểu `khu_tu_do`, mà khu đó **tự bày danh sách tệp của chính
                  * nó** (kèm cỡ tệp, người tải, ngày giờ, nút xem). Vẽ thêm `LienKetTep` ở đây là
                  * cùng một tệp hiện hai lần, và người đọc bộ hồ sơ tưởng có hai bản.
                  *
                  * 📌 ĐÃ ĐO LẠI 16/09/2026 (đêm) — chú thích này lúc đầu nói chưa chính xác, sửa
                  * cho đúng: khối `m.tep` nằm **bên trong nhánh CHỈ ĐỌC** của ternary phía trên
                  * (mở ở `) : (`, đóng ở `)}` cuối khối). Mục kiểu `o_co_ten` đi nhánh ô nộp nên
                  * **không bao giờ chạy tới đây** — tệp của nó do chính ô nộp bày. Vì vậy chỉ mục
                  * chỉ đọc (2 · 3 · 4 · 5) và `khu_tu_do` mới qua dòng này.
                  *
                  * ⚠️ TỪ 16/09/2026 (đêm) KHÔNG MỤC NÀO CÒN LÀ `khu_tu_do` — mục 9 đã đổi sang ô
                  * có tên để đồng bộ giao diện (Sếp: *"sao mục này đính kèm giao diện lại khác các
                  * bước kia"*). Điều kiện dưới đây vì thế hiện **luôn đúng**. Cố ý giữ: nó là chốt
                  * chặn cho lần sau có ai mở lại một mục kiểu tự do, và đã có bài kiểm canh.
                  *
                  * ⚠️ Hỏi qua hàm thuần `kieuONop`, đừng viết `m.ma === "dinh_kem_khac"` tại chỗ.
                  */}
                {kieu !== "khu_tu_do" &&
                  m.tep.map((t) => <LienKetTep key={t.id} tep={t} />)}

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
                    {/**
                      * ★★ TÔ MÀU THEO LÝ DO — sửa 18/09/2026.
                      *
                      * 🔴 Ba lý do nhóm rỗng KHÁC HẲN NHAU về nghĩa, trước đó dùng CHUNG một màu
                      * xám: ① kho gửi kèm ảnh (đủ chứng từ, lành tính) · ② lần giao bị từ chối
                      * nhận (không đòi phiếu, lành tính) · ③ **thật sự thiếu một tờ phiếu**.
                      * Cái thứ ba là việc phải đi làm, mà lại hiện y hệt hai cái kia — trái quy
                      * ước *"trạng thái luôn có cả màu lẫn chữ"* (Design System V1.1).
                      *
                      * 📌 `bangChungNgoai` chính là cờ phân biệt: bật = đã có bằng chứng ở nơi
                      * khác (xem `mucDaCo` ở `2-quy-trinh/bo-ho-so-thanh-toan.ts`).
                      */}
                    {n.tep.length === 0 && (
                      <span
                        className={`text-xs ${n.bangChungNgoai ? "text-text-desc" : "text-warning-soft"}`}
                      >
                        {n.ghiChu ?? "Chưa có."}
                      </span>
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

                {/**
                  * ★★★ KHU ĐÍNH KÈM TỰ DO CỦA MỤC 9 — Sếp 16/09/2026: ***"Cần thiết mở thêm để
                  * đính kèm tài liệu khác"***.
                  *
                  * 🔴 ĐẶT TRONG RUỘT MỤC, SAU danh sách tệp: dòng vẫn có hàng nhãn *"9. Đính kèm
                  * khác"* và dấu ✓/– như mọi mục khác, rồi mới tới chỗ nộp. Đưa lên nhánh gọn (dành
                  * cho `OChungTuBatBuoc`) là mục 9 mất tên và mất số.
                  *
                  * 🔴 KHU NÀY GHI VÀO **NGĂN RIÊNG** `BUOC_DINH_KEM_KHAC` — nơi gọi truyền xuống,
                  * xem `de-nghi-chi-tiet.tsx`. TUYỆT ĐỐI không để nó trỏ vào ngăn
                  * `ho_so_thanh_toan`: nút "Gỡ" của khu tự do sẽ xoá được **Hoá đơn VAT thật**, và
                  * mất hoá đơn là hồ sơ không đóng được nữa. Ba hệ quả đã đo, chép đủ ở chỗ khai
                  * hằng số trong `chung-tu-cuoi-quy-trinh.ts`.
                  */}
                {kieu === "khu_tu_do" && oNop}
              </div>
                </>
              )}

              {/**
                * ★★★ CÂU `ghiChu` CỦA MỤC — DỜI LÊN CẤP `<li>` NGÀY 16/09/2026. ĐỌC TRƯỚC KHI ĐẨY
                * NÓ TRỞ LẠI VÀO RUỘT MỤC.
                *
                * 🔴 TRƯỚC HÔM NAY NÓ NẰM TRONG NHÁNH CHỈ-ĐỌC, và điều đó **im lặng nuốt mất câu
                * ghi chú của mọi mục có ô nộp**. Chưa lộ ra chỉ vì tới 15/09/2026 không mục nào vừa
                * có ô nộp vừa có `ghiChu`. Nay mục 4 có cả hai: nó vừa mang ô nộp *Đơn mua hàng*,
                * vừa phải nói câu *"đang dùng chung tệp với mục 3 — tệp này đính trước khi tách"*.
                * Để nguyên chỗ cũ là người đối chiếu thấy mục 3 và mục 4 cùng một tờ mà **không có
                * một chữ nào giải thích**, rồi tưởng hồ sơ có hai chứng từ khác nhau.
                *
                * 📌 KHÔNG SINH RA DÒNG THỪA: `ghiChu` chỉ được đặt khi có chuyện phải nói (mục
                * thiếu chứng từ, hoặc mục 4 đang mượn tệp chung) — xem `dungBoHoSoThanhToan`.
                */}
              {m.ghiChu && (
                <span className="pl-7 text-xs text-warning-soft">{m.ghiChu}</span>
              )}

              {/**
                * ★★★ DÒNG LỜI KHAI — Sếp 16/09/2026. Vẽ Ở CẤP `<li>`, NGOÀI cả hai nhánh, cố ý:
                * mục 4 có ô nộp (đi nhánh trên) còn mục 3 chỉ đọc (nhánh dưới). Nhét vào một
                * nhánh là đúng một trong hai mục im lặng mất lời khai — mà Sếp yêu cầu **cả hai**.
                *
                * 🔴 TRẠNG THÁI CÓ CẢ MÀU LẪN CHỮ (Design System V1.1 §3.2): nền dòng đổi màu, và
                * ở đây luôn có icon + câu chữ nói rõ lý do. Đừng rút gọn thành mỗi màu nền.
                *
                * 📌 `text-xs` = 12px, đúng mức sàn cho phép; `pl-7` thẳng cột với ruột mục.
                */}
              {khai.chu !== "" && (
                <div className="flex items-start gap-1.5 pl-7">
                  {khai.baoDo ? (
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden />
                  ) : (
                    <Info className="mt-0.5 size-3.5 shrink-0 text-text-desc" aria-hidden />
                  )}
                  <span
                    className={`text-xs ${khai.baoDo ? "font-medium text-danger" : "text-text-secondary"}`}
                  >
                    {khai.chu}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
