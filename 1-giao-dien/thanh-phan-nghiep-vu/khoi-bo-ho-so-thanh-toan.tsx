"use client";

// ============================================================
// KHỐI "KẾT QUẢ" CỦA BƯỚC ⑦ — BỘ HỒ SƠ THANH TOÁN ĐẦY ĐỦ, BẢY MỤC
//
// ★★ Ban lãnh đạo 26/08/2026: *"Tạo thêm 1 trường 'Kết quả'. Sẽ được link kết quả từ các bước
//    trên"*, kèm mục đích *"để sau này có thể lấy dữ liệu này đẩy qua app kế toán"*.
//
// 🔴 CHỈ BÀY, KHÔNG CHO ĐÍNH KÈM Ở ĐÂY. Mỗi mục trỏ tới chứng từ đã đính ở bước của nó. Cho đính
//    lại tại đây là cùng một chứng từ có hai bản trong hồ sơ, và khi hai bản khác nhau thì không
//    ai biết bản nào đúng.
//
// 🔴 DANH SÁCH BẢY MỤC VÀ ĐIỀU KIỆN ĐỦ/THIẾU NẰM Ở `2-quy-trinh/bo-ho-so-thanh-toan.ts`, không
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
  const muc = dungBoHoSoThanhToan(deNghi, poCuaDeNghi, phieuCuaDeNghi, baoGiaCuaDeNghi);
  const tomTat = tomTatBoHoSo(muc);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="size-4 shrink-0 text-text-desc" aria-hidden />
        <span className="text-sm font-semibold text-text-primary">
          Bộ hồ sơ thanh toán đầy đủ
        </span>
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
      <p className="text-xs text-text-desc">
        Gom từ các bước trên, không đính kèm lại ở đây. Đây là bộ chứng từ sẽ chuyển sang app Kế
        toán.
      </p>

      <ol className="flex flex-col gap-2">
        {muc.map((m) => {
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

              {/* Tệp của mục — chỉ XEM và TẢI, không gỡ được từ đây (sửa ở bước của nó). */}
              {m.tep.map((t) => (
                <LienKetTep key={t.id} tep={t} />
              ))}

              {/**
                * ★★ NHÓM BÊN TRONG MỤC — Ban lãnh đạo 26/08/2026: *"Tạo group lại nhé"*.
                * Mục 2 (bản được chọn / bảng so sánh) và mục 6 (hóa đơn / ủy nhiệm chi) dùng nhóm.
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
