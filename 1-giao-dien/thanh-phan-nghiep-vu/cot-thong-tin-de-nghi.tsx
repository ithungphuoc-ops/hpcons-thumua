"use client";

import type { ReactNode } from "react";
import { Check, User } from "lucide-react";
import { KhoiGap } from "@/1-giao-dien/thanh-phan-dung-chung/khoi-gap";
import {
  GIAI_DOAN_MUA_HANG,
  NHAN_GIAI_DOAN,
  type GiaiDoanMuaHang,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import { formatDate, formatMocThoiGian } from "@/6-tien-ich/dinh-dang";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * Mốc thời gian THẬT của từng giai đoạn, do trang chi tiết tính từ chứng từ rồi truyền vào.
 *
 * 🔴 KHÔNG tự đoán mốc trong component này. Giai đoạn được **suy ra** từ chứng từ chứ
 * không lưu thành trường (xem `2-quy-trinh/giai-doan-mua-hang.ts`), nên chỉ những giai
 * đoạn có chứng từ tương ứng mới có thời điểm. Giai đoạn không có thì để trống — thà
 * trống còn hơn hiện một con số không có gì bảo đảm.
 */
export type MocGiaiDoan = Partial<Record<GiaiDoanMuaHang, string>>;

/**
 * CỘT THÔNG TIN BÊN PHẢI của trang chi tiết đề nghị.
 *
 * Bám bố cục trang nhiệm vụ của Base.vn (ảnh Ban lãnh đạo cung cấp 10/08/2026), theo
 * đúng thứ tự trong ảnh: thời hạn tổng → tiến trình từng giai đoạn → hoạt động chính →
 * lịch sử. Nội dung làm việc nằm cột trái, còn "hồ sơ này đang ở đâu, ai đụng vào" gom
 * hết về đây để tra nhanh mà không phải cuộn.
 *
 * Trên màn hẹp cột này tự xuống dưới (lớp lưới nằm ở trang gọi nó).
 */
export function CotThongTinDeNghi({
  deNghi,
  giaiDoan,
  soNgayConLai,
  moc = {},
  tomTat,
  hoatDongChinh,
}: {
  deNghi: DeNghiMuaHang;
  giaiDoan: GiaiDoanMuaHang;
  soNgayConLai: number;
  moc?: MocGiaiDoan;
  /** Mấy con số tóm tắt tiến độ, hiện trong khối "Hoạt động chính". */
  tomTat: { daPhanBo: number; daLenPO: number; daNhanDu: number; tongSoDong: number };
  /** Các nút hành động của trang, đặt trong khối "Hoạt động chính" như bố cục Base. */
  hoatDongChinh?: ReactNode;
}) {
  const chuoi = GIAI_DOAN_MUA_HANG.filter((g) => g.ma !== "that_bai");
  const viTri = chuoi.findIndex((g) => g.ma === giaiDoan);
  const moTa = NHAN_GIAI_DOAN[giaiDoan];

  // --- Thời hạn tổng: từ ngày duyệt tới ngày cần hàng ---
  // Base hiện "Đã sử dụng 115.73 của 15.00h". Của ta đơn vị là NGÀY, vì thu mua tính
  // theo ngày giao hàng chứ không bấm giờ từng việc.
  const tongSoNgay = soNgay(deNghi.ngayDuyet, deNghi.ngayCanHang);
  const daDung = Math.max(0, tongSoNgay - soNgayConLai);
  const quaHan = soNgayConLai < 0;
  // Quá hạn thì thanh đầy 100% và chuyển màu — không cho tràn ra ngoài khung.
  const phanTram = tongSoNgay > 0 ? Math.min(100, Math.round((daDung / tongSoNgay) * 100)) : 0;

  return (
    <div className="flex flex-col gap-(--hp-md-row-gap)">
      {/* ================= TỔNG THỜI GIAN ================= */}
      <section className="rounded-xl border border-border bg-surface p-(--hp-md-card-pad)">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-[11px] font-semibold tracking-wide text-text-desc uppercase">
            Tổng thời gian
          </span>
          <span className="text-xs text-text-secondary tabular-nums">
            Đã dùng <strong className="text-text-primary">{daDung}</strong> của {tongSoNgay}{" "}
            ngày
          </span>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${quaHan ? "bg-danger" : "bg-success"}`}
            style={{ width: `${phanTram}%` }}
          />
        </div>

        {/* Trạng thái thời hạn ghi bằng CẢ CHỮ, không chỉ dựa vào màu thanh (V1.1). */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-text-desc">Ngày cần hàng</span>
          <span className="font-semibold text-text-primary">
            {formatDate(deNghi.ngayCanHang)}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-text-desc">Thời hạn</span>
          <span
            className={`rounded px-1.5 py-0.5 font-semibold ${
              quaHan ? "bg-danger text-white" : "text-success-soft"
            }`}
          >
            {quaHan ? `Quá hạn ${-soNgayConLai} ngày` : `Còn ${soNgayConLai} ngày`}
          </span>
        </div>
      </section>

      {/* ============ TIẾN TRÌNH CỦA CÁC GIAI ĐOẠN ============ */}
      <section className="rounded-xl border border-border bg-surface p-(--hp-md-card-pad)">
        <span className="text-[11px] font-semibold tracking-wide text-text-desc uppercase">
          Tiến trình của các giai đoạn
        </span>

        <ol className="mt-2.5 flex flex-col gap-3">
          {chuoi.map((g, i) => {
            const daQua = viTri >= 0 && i < viTri;
            const hienTai = i === viTri;
            const chuaToi = !daQua && !hienTai;
            const thoiDiem = moc[g.ma];

            return (
              <li key={g.ma} className="flex items-start gap-2.5">
                {/* Số tròn: xong = xanh lá có dấu ✓ · đang làm = xanh chủ đạo ·
                    chưa tới = viền xám. Phân biệt bằng cả hình dạng lẫn màu. */}
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    hienTai
                      ? "bg-primary text-white"
                      : daQua
                        ? "bg-success text-white"
                        : "border border-border bg-surface text-text-desc"
                  }`}
                  aria-hidden
                >
                  {daQua ? <Check className="size-3" /> : i + 1}
                </span>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <span
                      className={`text-xs leading-tight ${
                        hienTai
                          ? "font-semibold text-text-primary"
                          : chuaToi
                            ? "text-text-desc"
                            : "text-text-secondary"
                      }`}
                    >
                      {g.nhan}
                    </span>
                    {thoiDiem && (
                      <span className="shrink-0 font-mono text-[11px] text-text-desc tabular-nums">
                        {formatMocThoiGian(thoiDiem)}
                      </span>
                    )}
                  </div>

                  {/* Thanh mảnh dưới mỗi giai đoạn — giống dải màu trong ảnh mẫu. */}
                  <div className="h-0.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        daQua ? "w-full bg-success" : hienTai ? "w-1/2 bg-primary" : "w-0"
                      }`}
                    />
                  </div>

                  <span className="text-[11px] leading-tight text-text-desc">
                    {chuaToi
                      ? "Giai đoạn chờ đến lượt"
                      : hienTai
                        ? (moTa?.moTa ?? "Đang ở bước này")
                        : "Đã xong"}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        {/* ⚠️ Nói thẳng chỗ chưa có dữ liệu, đừng để người xem tưởng app quên ghi. */}
        <p className="mt-2.5 border-t border-divider pt-2 text-[11px] text-text-desc">
          Giai đoạn được suy ra từ chứng từ thật, nên chỉ giai đoạn nào có chứng từ mới có
          mốc thời gian.
        </p>
      </section>

      {/* ================= HOẠT ĐỘNG CHÍNH ================= */}
      {/* Mở sẵn: đây là nơi đặt các nút làm việc, gập lại thì người dùng không thấy. */}
      <KhoiGap tieuDe="Hoạt động chính" moSan>
        <div className="flex flex-col gap-2.5">
          <DongSo nhan="Đã phân bổ" so={tomTat.daPhanBo} tong={tomTat.tongSoDong} />
          <DongSo nhan="Đã lên đơn hàng" so={tomTat.daLenPO} tong={tomTat.tongSoDong} />
          <DongSo nhan="Đã nhận đủ" so={tomTat.daNhanDu} tong={tomTat.tongSoDong} />

          <div className="flex flex-col gap-1 border-t border-divider pt-2 text-xs">
            <span className="text-text-desc">Người đề nghị</span>
            <span className="flex items-center gap-1.5 font-medium text-text-primary">
              <User className="size-3.5 shrink-0 text-text-desc" aria-hidden />
              {deNghi.nguoiDeNghiTen}
            </span>
          </div>

          {hoatDongChinh && (
            <div className="flex flex-col gap-2 border-t border-divider pt-2.5">
              {hoatDongChinh}
            </div>
          )}
        </div>
      </KhoiGap>

      {/* ================= LỊCH SỬ HOẠT ĐỘNG ================= */}
      {/* Gập sẵn như trong ảnh mẫu — dài và chỉ tra khi cần. */}
      <KhoiGap tieuDe="Lịch sử hoạt động" soLuong={deNghi.lichSu.length}>
        {deNghi.lichSu.length === 0 ? (
          <p className="text-xs text-text-desc">Chưa có thao tác nào được ghi lại.</p>
        ) : (
          <>
            {/* Mới nhất lên đầu — người xem thường quan tâm việc vừa xảy ra. */}
            <ul className="flex flex-col gap-2.5">
              {[...deNghi.lichSu].reverse().map((m, i) => (
                <li key={i} className="flex flex-col gap-0.5 text-xs leading-tight">
                  <span className="font-mono text-[11px] text-text-desc tabular-nums">
                    {formatMocThoiGian(m.thoiDiem)}
                  </span>
                  <span className="text-text-secondary">
                    <strong className="font-medium text-text-primary">
                      {m.nguoiThucHien}
                    </strong>{" "}
                    {m.hanhDong}
                  </span>
                  {m.ghiChu && <span className="text-text-desc italic">{m.ghiChu}</span>}
                </li>
              ))}
            </ul>
            <p className="mt-2.5 border-t border-divider pt-2 text-[11px] text-text-desc">
              Giờ theo múi giờ Việt Nam (UTC+7).
            </p>
          </>
        )}
      </KhoiGap>
    </div>
  );
}

/** Một dòng "nhãn — x/y" kèm thanh tiến độ mảnh. */
function DongSo({ nhan, so, tong }: { nhan: string; so: number; tong: number }) {
  const phanTram = tong > 0 ? Math.round((so / tong) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-text-desc">{nhan}</span>
        <span className="font-medium text-text-primary tabular-nums">
          {so}/{tong} dòng
        </span>
      </div>
      <div className="h-0.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${phanTram}%` }} />
      </div>
    </div>
  );
}

/**
 * Số ngày giữa hai mốc, tối thiểu 1 để không chia cho 0 khi ngày duyệt trùng ngày cần hàng.
 * Chỉ dùng cho thanh tiến độ trong component này nên để tại đây, không đưa vào tiện ích chung.
 */
function soNgay(tu: string, den: string): number {
  const a = new Date(tu).getTime();
  const b = new Date(den).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 1;
  return Math.max(1, Math.round((b - a) / 86_400_000));
}
