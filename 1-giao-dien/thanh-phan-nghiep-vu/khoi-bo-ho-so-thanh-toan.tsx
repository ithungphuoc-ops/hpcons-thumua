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
// 🔴 ĐÃ BỎ PHẦN LIỆT KÊ, KHÔNG BỎ Ô NỘP — và đây là chỗ dễ làm ngược nhất. Khối này **chỉ đọc**
//    (`LienKetTep`, không có đường ghi nào), còn ô nộp mới là chỗ làm việc thật: nộp · thay · gỡ ·
//    thêm bản. Riêng **Phiếu chi** thì ô ở bước ⑧ là chỗ DUY NHẤT trong cả app. Bỏ ô nộp để giữ
//    phần liệt kê là chức năng mồ côi (CLAUDE.md §3.4b).
//
// 🔴 KHỐI NÀY NAY CHỈ GOM CHỨNG TỪ **ĐẾN TỪ BƯỚC KHÁC** — đó là giá trị riêng của nó: người làm
//    hồ sơ thanh toán không phải mở lại từng bước để gom. Bốn mã bị lọc ra khai ở
//    `MA_MUC_NOP_TAI_BUOC_HO_SO_THANH_TOAN` (`2-quy-trinh/bo-ho-so-thanh-toan.ts`), có kiểu chặt
//    nên đổi khoá là không biên dịch được.
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
// 🔴 CHỈ BÀY, KHÔNG CHO ĐÍNH KÈM Ở ĐÂY. Mỗi mục trỏ tới chứng từ đã đính ở bước của nó. Cho đính
//    lại tại đây là cùng một chứng từ có hai bản trong hồ sơ, và khi hai bản khác nhau thì không
//    ai biết bản nào đúng.
//
// 🔴 DANH SÁCH MỤC VÀ ĐIỀU KIỆN ĐỦ/THIẾU NẰM Ở `2-quy-trinh/bo-ho-so-thanh-toan.ts`, không
//    viết lại ở đây. Cửa API đẩy sang app Kế toán sau này gọi CÙNG hàm đó, nên màn hình và dữ
//    liệu đẩy đi không thể lệch nhau.
// ============================================================

import { Check, ExternalLink, FileText, Minus } from "lucide-react";
import Link from "next/link";
/* 🔴 DÙNG `LienKetTep`, KHÔNG dùng `ODinhKemTep`: ô đính kèm cần `onXong` / `nguoi` để GHI, mà
   khối này chỉ XEM. Truyền prop giả cho một ô đính kèm rồi khóa lại là mời người sau mở khóa —
   `LienKetTep` không có đường ghi nào nên không thể lỡ tay. */
import { LienKetTep } from "@/1-giao-dien/thanh-phan-dung-chung/lien-ket-tep";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import {
  dungBoHoSoThanhToan,
  MA_MUC_NOP_TAI_BUOC_HO_SO_THANH_TOAN,
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
  /** Vai trò có được xem giá — chỉ để quyết định có cho mở tờ PO in hay không. */
  xemGia,
}: {
  deNghi: DeNghiMuaHang;
  poCuaDeNghi: DonDatHang[];
  phieuCuaDeNghi: PhieuNhanHang[];
  baoGiaCuaDeNghi: BaoGia[];
  xemGia: boolean;
}) {
  /* ĐỦ TÁM MỤC — giữ nguyên để bộ đẩy sang app Kế toán không hụt khoá nào. */
  const muc = dungBoHoSoThanhToan(deNghi, poCuaDeNghi, phieuCuaDeNghi, baoGiaCuaDeNghi);

  /**
   * ★★ TÁCH LÀM HAI: mục ĐẾN TỪ BƯỚC KHÁC (bày ở đây) và mục CÓ Ô NỘP NGAY TẠI BƯỚC ⑧ (không bày
   * lại).
   *
   * 🔴 LỌC Ở TẦNG VẼ, KHÔNG LỌC Ở TẦNG DỮ LIỆU — `muc` khai ở trên vẫn đủ 8. Xem lý do đầy đủ ở
   * khối chú thích đầu tệp và ở `MA_MUC_NOP_TAI_BUOC_HO_SO_THANH_TOAN`.
   *
   * 📌 TÊN BIẾN KHÔNG CHỈ HƯỚNG — trước 15/09/2026 tên là `mucCoONopONgayTren`, rồi khối này được
   * dời lên trên các ô nộp nên cái tên hoá ra chỉ ngược. Tên theo BƯỚC thì đổi bố cục bao nhiêu
   * lần cũng không sai.
   */
  const mucBay = muc.filter((m) => !MA_MUC_NOP_TAI_BUOC_HO_SO_THANH_TOAN.includes(m.ma));
  const mucCoONopTaiBuocNay = muc.filter((m) =>
    MA_MUC_NOP_TAI_BUOC_HO_SO_THANH_TOAN.includes(m.ma),
  );

  /**
   * 🔴 HUY HIỆU ĐẾM ĐÚNG THỨ ĐANG BÀY (`mucBay`), KHÔNG ĐẾM CẢ TÁM MỤC.
   *
   * Đếm cả bộ rồi chỉ bày một phần là huy hiệu ghi *"còn thiếu 1/4"* trong khi bên dưới có bốn
   * dòng khác hẳn — người đọc không có cách nào đối chiếu, tệ hơn cả việc trùng lặp ban đầu.
   *
   * ⚠️ HỆ QUẢ PHẢI BIẾT: **Hợp đồng** là mục BẮT BUỘC nhưng nay không nằm trong con số này nữa
   * (tổng tụt 4 → 3). KHÔNG mất chốt nào — việc thiếu hợp đồng vẫn được báo đủ ba chỗ, và cả ba
   * đều nói to hơn một dòng trong danh sách:
   *   · ô "Hợp đồng" của bước ⑧ (ngay dưới khối này) mang nhãn đỏ *"Bắt buộc"*, ô trống cũng
   *     gắn cờ bắt buộc;
   *   · nút *"Hoàn thành quy trình"* bị KHÓA kèm lý do (`vuongMacHoanThanhQuyTrinh` — 14/09/2026);
   *   · viền khối bước chuyển đỏ kèm chữ *"Còn thiếu"* (`conThieu`).
   * 👉 Luật nghiệp vụ KHÔNG đổi một dòng nào; chỉ chỗ đếm để hiển thị là đổi.
   */
  const tomTat = tomTatBoHoSo(mucBay);

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
            Lý do bỏ đúng chữ đó: khối này nay chỉ bày 4 mục đến từ bước khác, 4 mục còn lại nộp
            ngay ở các ô của bước ⑧. Giữ chữ "đầy đủ" là nhãn hứa một thứ nội dung bên dưới không
            làm (CLAUDE.md §3.5).
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
      {/* 📌 "các bước TRƯỚC" chứ không phải "các bước trên": từ 15/09/2026 khối này đứng ở ĐẦU
          bước ⑧ nên chữ "trên" dễ bị đọc thành vị trí trên màn hình. Ở đây muốn nói thứ tự quy
          trình — các bước ①→⑦ đã đi qua. */}
      <p className="text-xs text-text-desc">
        Gom từ các bước trước, không đính kèm lại ở đây. Sửa thì về đúng bước của chứng từ.
      </p>
      {/**
        * ★★ NÓI RÕ BỐN MỤC KIA ĐI ĐÂU — Sếp 15/09/2026, khi bỏ phần liệt kê trùng.
        *
        * 🔴 BẮT BUỘC PHẢI CÓ CÂU NÀY, KHÔNG PHẢI CHO ĐẸP. Khối giữ nguyên số mục gốc (1 · 2 ·
        * 4 · 5) nên trên màn hình có chỗ hụt số 3 · 6 · 7 · 8. Không giải thích thì người đọc
        * tưởng app làm mất mục — đúng loại hiểu nhầm §3.5 cấm. Câu này biến chỗ hụt số thành
        * thông tin: mục nào, ở đâu.
        *
        * 🔴 CHỮ CHỈ HƯỚNG PHẢI KHỚP BỐ CỤC — Sếp 15/09/2026 dời khối này LÊN TRƯỚC các ô nộp tệp,
        * nên câu cũ *"nộp ở các ô đính kèm ngay phía TRÊN"* đã thành SAI HƯỚNG và được sửa thành
        * *"ngay phía DƯỚI"*. 👉 Ngày nào đổi lại thứ tự hai cụm thì phải sửa chữ này cùng lúc:
        * câu chỉ sai hướng khiến người dùng cuộn ngược tìm mãi không thấy, mà không có lỗi nào báo.
        *
        * 🔴 GIỮ SỐ GỐC chứ không đánh lại 1..4: số mục là cách Sếp gọi tên từng chứng từ
        * (danh sách 9 mục ngày 15/09/2026) và là thứ tự dùng khi đối chiếu với app Kế toán.
        * Đánh lại số là hai bên nói "mục 3" mà chỉ hai chứng từ khác nhau.
        *
        * 📌 Tên và số lấy thẳng từ dữ liệu, không gõ tay — thêm/bớt ô nộp ở bước ⑧ thì câu này
        * tự đúng theo.
        */}
      {mucCoONopTaiBuocNay.length > 0 && (
        <p className="text-xs text-text-desc">
          {mucCoONopTaiBuocNay.length} mục còn lại của bộ hồ sơ nộp ở các ô đính kèm ngay phía dưới,
          không liệt kê lại ở đây:{" "}
          {mucCoONopTaiBuocNay.map((m) => `${m.stt}. ${m.ten}`).join(" · ")}. Bộ chuyển sang app Kế
          toán vẫn đủ {muc.length} mục.
        </p>
      )}

      <ol className="flex flex-col gap-2">
        {mucBay.map((m) => {
          const co = mucDaCo(m);
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
                  * Chứng từ app tự sinh (đơn mua hàng) — mở tờ in A4.
                  *
                  * 🔴 GÁC QUYỀN XEM GIÁ: tờ PO in có đơn giá. Vai trò không được xem giá thì chỉ
                  * thấy MÃ ĐƠN, không có đường mở tờ in — trang in cũng tự chặn bên trong, đây là
                  * lớp thứ hai để không bày một liên kết bấm vào rồi bị từ chối.
                  */}
                {(m.chungTuTrongApp ?? []).map((c) =>
                  xemGia ? (
                    <Link
                      key={c.ma}
                      href={c.duongDanIn}
                      target="_blank"
                      className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-medium text-primary underline-offset-2 hover:underline md:min-h-9"
                    >
                      <ExternalLink className="size-4 shrink-0" aria-hidden />
                      {c.ma}
                    </Link>
                  ) : (
                    <span key={c.ma} className="text-sm text-text-secondary">
                      {c.ma}{" "}
                      <span className="text-xs text-text-desc">
                        (không có quyền xem giá nên không mở được tờ in)
                      </span>
                    </span>
                  ),
                )}

                {m.ghiChu && <span className="text-xs text-warning-soft">{m.ghiChu}</span>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
