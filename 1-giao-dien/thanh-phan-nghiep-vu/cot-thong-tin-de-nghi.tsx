"use client";

import { Check } from "lucide-react";
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
  hanGioTheoBuoc = {},
}: {
  deNghi: DeNghiMuaHang;
  giaiDoan: GiaiDoanMuaHang;
  soNgayConLai: number;
  moc?: MocGiaiDoan;
  /**
   * Thời hạn CHUẨN từng bước (giờ), lấy từ cấu hình quy trình — Base gọi là "Kỳ vọng"
   * và "DURATION". 0 = bước không đặt hạn.
   */
  hanGioTheoBuoc?: Record<string, number>;
}) {
  const chuoi = GIAI_DOAN_MUA_HANG.filter((g) => g.ma !== "that_bai");
  const viTri = chuoi.findIndex((g) => g.ma === giaiDoan);
  const moTa = NHAN_GIAI_DOAN[giaiDoan];
  /** Bước kế tiếp — Base hiện ngay trong khối giai đoạn hiện tại ("» GIAI ĐOẠN KẾ TIẾP"). */
  const buocKeTiep = viTri >= 0 ? chuoi[viTri + 1] : undefined;
  const ketThuc = giaiDoan === "hoan_thanh" || giaiDoan === "that_bai";

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
      {/* ================= GIAI ĐOẠN HIỆN TẠI =================
          Ban lãnh đạo 15/08/2026 gửi ảnh trang chi tiết job trên Base: khối này là thứ NỔI
          NHẤT ở đầu cột phải, nền xanh, ghi "[1/6] Tên bước" kèm thời hạn và bước kế tiếp.

          🔴 Vì sao đáng đặt lên đầu: câu hỏi số một khi mở một hồ sơ là "đang ở đâu, ai phải
          làm gì tiếp". Trước đây phải đọc thanh giai đoạn ở cột trái rồi tự đếm. */}
      <section className="rounded-xl bg-primary p-(--hp-md-card-pad) text-white">
        <span className="text-xs font-semibold tracking-wide text-white/80 uppercase">
          Giai đoạn hiện tại
        </span>
        <p className="mt-1 text-sm font-semibold leading-snug">
          {viTri >= 0 && !ketThuc && (
            <span className="tabular-nums">[{viTri + 1}/{chuoi.length - 1}] </span>
          )}
          {moTa?.nhan ?? giaiDoan}
        </p>

        {/* MÔ TẢ BƯỚC — dời từ danh sách "Tiến trình của các giai đoạn" lên đây (16/08/2026).
            Ở danh sách bên dưới, đây là dòng DUY NHẤT dài 2–3 dòng trong khi mọi giai đoạn
            khác chỉ 1 dòng, nên nó làm các dòng cao thấp so le — đúng chỗ Ban lãnh đạo
            khoanh đỏ. Khối này mới là chỗ nói về bước đang đứng, lại đủ bề ngang để đọc.
            🔴 DỜI chứ không bỏ: bỏ hẳn là mất lời giải thích bước đang làm, không còn chỗ
            nào khác trong app nói câu đó. */}
        {moTa?.moTa && <p className="mt-1 text-sm leading-snug text-white/90">{moTa.moTa}</p>}

        {/* Hạn chuẩn của bước — Base gọi là "KỲ VỌNG". 0 giờ = bước không đặt hạn. */}
        {!ketThuc && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/25 pt-2 text-sm">
            <span className="text-white/80">Thời hạn chuẩn của bước</span>
            <span className="font-semibold tabular-nums">
              {hanGioTheoBuoc[giaiDoan] ? `${hanGioTheoBuoc[giaiDoan]} giờ` : "Không đặt hạn"}
            </span>
          </div>
        )}

        {/* Bước kế tiếp — người dùng biết trước phải chuẩn bị gì. */}
        {buocKeTiep && (
          <p className="mt-1.5 text-sm text-white/90">
            » Bước kế tiếp: <strong className="font-semibold">{buocKeTiep.nhan}</strong>
            {hanGioTheoBuoc[buocKeTiep.ma] ? ` (${hanGioTheoBuoc[buocKeTiep.ma]} giờ)` : ""}
          </p>
        )}

        {/* 📌 ĐÃ BỎ câu "App chưa đếm được số giờ đã ở bước này…" (Ban lãnh đạo 16/08/2026).
            App tự kể giới hạn kỹ thuật của mình ngay giữa màn làm việc; người dùng đọc xong
            cũng không làm gì khác đi. Thời hạn thật đã hiện ở khối Tổng thời gian ngay dưới. */}
      </section>

      {/* ================= THÔNG TIN NHIỆM VỤ =================
          Theo khối cùng tên trong ảnh Base: mã, ai tạo, tạo lúc nào, cập nhật gần nhất. */}
      <section className="rounded-xl border border-border bg-surface p-(--hp-md-card-pad)">
        <span className="text-xs font-semibold tracking-wide text-text-desc uppercase">
          Thông tin nhiệm vụ
        </span>
        <dl className="mt-2 flex flex-col gap-1.5 text-sm">
          {/**
            * ★★ "MÃ ĐỀ NGHỊ" = MÃ BÊN APP REQUEST, KHÔNG PHẢI `deNghi.code`.
            *
            * 🔴 Ban lãnh đạo 27/08/2026 nói dứt khoát: *"Sao mã đề nghị lại là số hợp đồng + tên
            * công trình. Mã đề nghị là 0000046 lấy từ mã request"*.
            *
            * VÌ SAO `deNghi.code` KHÔNG PHẢI MÃ ĐỀ NGHỊ: với phiếu đến từ App Request, `code` được
            * dựng theo công thức đặt tên của quy trình mua hàng — *mã đề xuất · mã hợp đồng · TÊN
            * CÔNG TRÌNH* — nên nó ra một chuỗi dài kiểu `26001/HDXD-Công trình HOWELL-PR-001`.
            * Đó là TÊN HỒ SƠ để đọc cho biết đây là việc gì, không phải cái mã người ta đọc cho
            * nhau qua điện thoại.
            *
            * ✅ Mã người dùng thật sự dùng để đối chiếu hằng ngày là `maDeXuatAppRequest`
            * (`000000046`) — cùng một mã với ô "Mã đề nghị" ở form lập đơn, nên hai màn hình nói
            * cùng một con số.
            *
            * 📌 `?? deNghi.code` là ĐƯỜNG LUI THẬT: phiếu lập TAY trong app không đi qua App
            * Request nên không có mã đó — để trống là dòng rỗng vĩnh viễn.
            *
            * 📌 `deNghi.code` chuyển vào `title`: vẫn tra được khi cần đối chiếu nội bộ, mà không
            * chiếm một dòng trên khối thông tin.
            */}
          <DongTin
            nhan="Mã đề nghị"
            giaTri={deNghi.maDeXuatAppRequest ?? deNghi.code}
            ghiChu={`Mã hồ sơ trong app Thu mua: ${deNghi.code}`}
          />
          <DongTin
            nhan="Người đề nghị"
            giaTri={`${deNghi.nguoiDeNghiTen} · ${formatMocThoiGian(deNghi.ngayDeNghi)}`}
          />
          {/* Mốc mới nhất trong nhật ký = lần cuối có người đụng vào hồ sơ. Suy ra, không
              lưu thêm trường — tránh hai chỗ cùng giữ một sự thật rồi lệch nhau. */}
          {deNghi.lichSu.length > 0 && (
            <DongTin
              nhan="Cập nhật gần nhất"
              giaTri={formatMocThoiGian(deNghi.lichSu[deNghi.lichSu.length - 1].thoiDiem)}
            />
          )}
          <DongTin nhan="Giai đoạn hiện tại" giaTri={moTa?.nhan ?? giaiDoan} />
        </dl>
      </section>

      {/* ================= TỔNG THỜI GIAN ================= */}
      <section className="rounded-xl border border-border bg-surface p-(--hp-md-card-pad)">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-xs font-semibold tracking-wide text-text-desc uppercase">
            Tổng thời gian
          </span>
          <span className="text-sm text-text-secondary tabular-nums">
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
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-text-desc">Ngày cần hàng</span>
          <span className="font-semibold text-text-primary">
            {formatDate(deNghi.ngayCanHang)}
          </span>
        </div>
        {/* `mt-2` bằng đúng dòng "Ngày cần hàng" ngay trên — hai dòng cùng loại mà một dòng
            cách 8px, một dòng cách 4px thì nhìn như xếp lệch. */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
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
        <span className="text-xs font-semibold tracking-wide text-text-desc uppercase">
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
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
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
                      className={`text-sm leading-tight ${
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
                      <span className="shrink-0 font-mono text-xs text-text-desc tabular-nums">
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

                  {/* 🔴 MỖI GIAI ĐOẠN MỘT DÒNG NGẮN BẰNG NHAU — Ban lãnh đạo 16/08/2026:
                      *"kiểm tra xem chiều cao chữ đang ko đồng đều"*.
                      Trước đây giai đoạn ĐANG LÀM lấy nguyên câu mô tả dài (66 ký tự) trong
                      khi các giai đoạn khác chỉ 7–22 ký tự, nên riêng ô đó xuống 2–3 dòng và
                      danh sách bị gồ lên giữa chừng. Cỡ chữ vốn đã bằng nhau ở cả ba trạng
                      thái; cái làm lệch là ĐỘ DÀI CHỮ, nên phải nắn ở đây.
                      Trạng thái vẫn phân biệt bằng ĐỘ ĐẬM + MÀU của dòng tên phía trên và
                      màu số tròn, không phân biệt bằng cỡ chữ. Câu mô tả dài đã dời lên khối
                      "Giai đoạn hiện tại" ở đầu cột. */}
                  <span className="text-xs leading-tight text-text-desc">
                    {chuaToi ? "Chờ đến lượt" : hienTai ? "Đang làm bước này" : "Đã xong"}
                    {/* Hạn chuẩn của bước — Base ghi "DURATION: 4.00h" ở mỗi dòng giai đoạn.
                        Bỏ qua bước Hoàn thành / Thất bại: chúng là điểm dừng, không có hạn. */}
                    {hanGioTheoBuoc[g.ma] ? ` · ${hanGioTheoBuoc[g.ma]} giờ` : ""}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        {/* 📌 ĐÃ BỎ câu "Giai đoạn được suy ra từ chứng từ thật…" (Ban lãnh đạo 16/08/2026):
            cách app tính giai đoạn là chuyện bên trong, không phải thứ người dùng cần đọc. */}
      </section>

      {/* 📌 ĐÃ BỎ khối "Hoạt động chính" (Ban lãnh đạo 15/08/2026: *"mục này đang bị dư"*).
          Mọi thứ trong đó đã có chỗ khác nói rồi:
            · "Đã phân bổ / Đã lên đơn / Đã nhận đủ" → bảng Phân bổ công việc ở cột trái hiện
              chi tiết hơn, tới từng dòng vật tư
            · "Người đề nghị" → khối Thông tin nhiệm vụ ngay trên
          🔴 Hai NÚT trong khối đó (Chuyển tiếp · Lập đơn đặt hàng) KHÔNG mất — đã dời lên
          đầu trang cạnh tiêu đề, đúng chỗ Base đặt chúng. Bỏ khối mà quên nút là người dùng
          mất đường làm việc. */}

      {/* 📌 LỊCH SỬ HOẠT ĐỘNG ĐÃ DỜI sang `khoi-trao-doi.tsx` (Ban lãnh đạo 15/08/2026), nơi
          nó thành một thẻ nằm cạnh thẻ Bình luận, ngay dưới khối Người theo dõi.
          🔴 Dời chứ KHÔNG nhân đôi: để lại bản cũ ở đây thì hai chỗ cùng hiện một danh sách,
          sửa cách hiển thị ở một chỗ là lệch ngay. */}
    </div>
  );
}

/** Một dòng "nhãn — giá trị" trong khối Thông tin nhiệm vụ. */
/**
 * @param ghiChu Chữ hiện khi rê chuột — chỗ để thông tin tra cứu ít dùng (vd mã hồ sơ nội bộ)
 *   mà không phải thêm hẳn một dòng vào khối. Bỏ trống thì không gắn `title`.
 */
function DongTin({
  nhan,
  giaTri,
  ghiChu,
}: {
  nhan: string;
  giaTri: string;
  ghiChu?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
      <dt className="text-text-desc">{nhan}</dt>
      <dd className="min-w-0 text-right font-medium text-text-primary" title={ghiChu}>
        {giaTri}
      </dd>
    </div>
  );
}

/* 📌 Đã bỏ `DongSo` cùng khối "Hoạt động chính" (15/08/2026) — bảng Phân bổ công việc ở cột
   trái đã hiện các con số đó chi tiết tới từng dòng vật tư. */

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
