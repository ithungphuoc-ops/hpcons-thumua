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

import { Check, ChevronDown, ChevronUp, ExternalLink, FileText, Minus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
   * ★★ TÁCH LÀM HAI: mục ĐẾN TỪ BƯỚC KHÁC (bày ở đây) và mục CÓ Ô NỘP NGAY TRÊN (không bày lại).
   *
   * 🔴 LỌC Ở TẦNG VẼ, KHÔNG LỌC Ở TẦNG DỮ LIỆU — `muc` bên trên vẫn đủ 8. Xem lý do đầy đủ ở khối
   * chú thích đầu tệp và ở `MA_MUC_NOP_TAI_BUOC_HO_SO_THANH_TOAN`.
   */
  const mucBay = muc.filter((m) => !MA_MUC_NOP_TAI_BUOC_HO_SO_THANH_TOAN.includes(m.ma));
  const mucCoONopONgayTren = muc.filter((m) =>
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
   *   · ô "Hợp đồng" ngay phía trên mang nhãn đỏ *"Bắt buộc"* và ô trống cũng gắn cờ bắt buộc;
   *   · nút *"Hoàn thành quy trình"* bị KHÓA kèm lý do (`vuongMacHoanThanhQuyTrinh` — 14/09/2026);
   *   · viền khối bước chuyển đỏ kèm chữ *"Còn thiếu"* (`conThieu`).
   * 👉 Luật nghiệp vụ KHÔNG đổi một dòng nào; chỉ chỗ đếm để hiển thị là đổi.
   */
  const tomTat = tomTatBoHoSo(mucBay);

  /**
   * ★ THU GỌN ĐƯỢC — Ban lãnh đạo 27/08/2026: *"Mục này thêm nút group lại cho a"*.
   *
   * 🔴 MẶC ĐỊNH MỞ KHI CÒN THIẾU, THU LẠI KHI ĐÃ ĐỦ. Đây là điểm chính, không phải chi tiết
   * trang trí: người dùng chỉ cần đọc khối này khi CÒN THIẾU chứng từ. Hồ sơ đã đủ thì một dãy
   * dấu tích chỉ đẩy nút "Hoàn thành quy trình" xuống khỏi tầm mắt.
   *
   * 📌 Đọc `tomTat` của `mucBay` — tức mở ra khi thiếu thứ khối này BÀY được. Thiếu hợp đồng /
   * hóa đơn VAT thì ô nộp ngay trên đã tự báo, mở thêm khối này cũng không giúp gì.
   *
   * ⚠️ ĐỪNG mặc định thu gọn cả khi còn thiếu: người lập mở trang ra phải thấy ngay mình thiếu
   * gì, chứ không phải bấm thêm một cái mới biết.
   */
  const [moRong, setMoRong] = useState(tomTat.thieu.length > 0);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="size-4 shrink-0 text-text-desc" aria-hidden />
        {/* 🔴 THÔI GỌI LÀ "ĐẦY ĐỦ" — Sếp 15/09/2026 chốt: *"bỏ chữ đầy đủ"*, giữ nguyên tên
            "Bộ hồ sơ thanh toán".
            Lý do bỏ đúng chữ đó: khối này nay chỉ bày 4 mục đến từ bước khác, 4 mục còn lại nộp
            ngay ở các ô phía trên. Giữ chữ "đầy đủ" là nhãn hứa một thứ nội dung bên dưới không
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
        {/* 📌 Nút đẩy sang phải bằng `ml-auto` — cùng hàng với tiêu đề, không chiếm thêm dòng.
            Vùng chạm 44px theo V1.1; `md:min-h-9` cho gọn lại trên máy tính. */}
        <button
          type="button"
          onClick={() => setMoRong((v) => !v)}
          aria-expanded={moRong}
          className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-medium text-primary transition-colors hover:bg-primary-bg md:min-h-9"
        >
          {moRong ? (
            <ChevronUp className="size-4" aria-hidden />
          ) : (
            <ChevronDown className="size-4" aria-hidden />
          )}
          {/* 🔴 `mucBay.length` — số dòng THẬT SỰ bấm ra, không phải `muc.length` (8, gồm cả mục
              đã lọc) và cũng không phải `tomTat.tong` (chỉ mục bắt buộc). Trước 15/09/2026 chỗ này
              in `tomTat.tong` nên nút ghi "Xem 4 mục" trong khi bấm ra bảy dòng — con số trên nút
              phải khớp đúng thứ người dùng thấy sau khi bấm. */}
          {moRong ? "Thu gọn" : `Xem ${mucBay.length} mục`}
        </button>
      </div>
      {moRong && (
        <>
          <p className="text-xs text-text-desc">
            Gom từ các bước trên, không đính kèm lại ở đây. Sửa thì về đúng bước của chứng từ.
          </p>
          {/**
            * ★★ NÓI RÕ BỐN MỤC KIA ĐI ĐÂU — Sếp 15/09/2026, khi bỏ phần liệt kê trùng.
            *
            * 🔴 BẮT BUỘC PHẢI CÓ CÂU NÀY, KHÔNG PHẢI CHO ĐẸP. Khối giữ nguyên số mục gốc (1 · 2 ·
            * 4 · 5) nên trên màn hình có chỗ hụt số 3 · 6 · 7 · 8. Không giải thích thì người đọc
            * tưởng app làm mất mục — đúng loại hiểu nhầm §3.5 cấm. Câu này biến chỗ hụt số thành
            * thông tin: mục nào, ở đâu.
            *
            * 🔴 GIỮ SỐ GỐC chứ không đánh lại 1..4: số mục là cách Sếp gọi tên từng chứng từ
            * (danh sách 9 mục ngày 15/09/2026) và là thứ tự dùng khi đối chiếu với app Kế toán.
            * Đánh lại số là hai bên nói "mục 3" mà chỉ hai chứng từ khác nhau.
            *
            * 📌 Tên và số lấy thẳng từ dữ liệu, không gõ tay — thêm/bớt ô nộp ở bước ⑧ thì câu này
            * tự đúng theo.
            */}
          {mucCoONopONgayTren.length > 0 && (
            <p className="text-xs text-text-desc">
              {mucCoONopONgayTren.length} mục còn lại của bộ hồ sơ nộp ở các ô đính kèm ngay phía
              trên, không liệt kê lại ở đây:{" "}
              {mucCoONopONgayTren.map((m) => `${m.stt}. ${m.ten}`).join(" · ")}. Bộ chuyển sang app
              Kế toán vẫn đủ {muc.length} mục.
            </p>
          )}
        </>
      )}

      {/* 🔴 KHI THU GỌN VẪN PHẢI NÓI THIẾU GÌ. Thu gọn để đỡ dài, không phải để giấu việc còn
          nợ chứng từ — nêu tên mục thiếu ngay trên một dòng. */}
      {!moRong && tomTat.thieu.length > 0 && (
        <p className="text-xs text-warning-soft">Còn thiếu: {tomTat.thieu.join(" · ")}.</p>
      )}

      <ol className={`flex flex-col gap-2 ${moRong ? "" : "hidden"}`}>
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
              <div className="flex flex-wrap items-center gap-2">
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
                * ★★ LIÊN KẾT SANG APP KHÁC — mục 1 "Phiếu đề nghị", Sếp 15/09/2026.
                *
                * 🔴 DÙNG `<a>` THƯỜNG, KHÔNG `next/link`: đây là địa chỉ đầy đủ sang App Request,
                * không phải một tuyến trong app này. `rel="noopener noreferrer"` vì mở tab mới.
                *
                * 🔴 VẼ TRƯỚC câu ghi chú bên dưới — câu đó nói *"bấm liên kết trên"*, đảo chỗ là
                * câu chỉ sai hướng.
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
                * Mục 2 (bản được chọn / bảng so sánh) và — từ 15/09/2026 — mục 5 (Phiếu giao hàng,
                * mỗi lần giao một nhóm) dùng nhóm. Mục Hoá đơn / UNC nay đã tách hẳn thành hai mục
                * riêng nên không còn dùng nhóm.
                *
                * 📌 Nhóm RỖNG vẫn hiện tên kèm câu "chưa có" — người đọc phải thấy là *đã kiểm và
                * chưa có*, khác hẳn với *không biết có hay không*. Ẩn nhóm rỗng đi là bộ hồ sơ
                * trông đủ trong khi thiếu.
                */}
              {(m.nhom ?? []).map((n) => (
                <div key={n.ten} className="flex flex-col gap-1 pl-6">
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
            </li>
          );
        })}
      </ol>
    </section>
  );
}
