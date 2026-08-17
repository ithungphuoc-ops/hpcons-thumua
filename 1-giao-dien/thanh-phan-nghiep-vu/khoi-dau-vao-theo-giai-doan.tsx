"use client";

import { useState } from "react";
import { ChevronRight, LogIn, type LucideIcon } from "lucide-react";
import { HopXemTep } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xem-tep";
import { rutGonTenTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { coTep, type MoTaTep } from "@/3-du-lieu/kho-tep";
import { cn } from "@/6-tien-ich/gop-lop";

/**
 * KHỐI "ĐẦU VÀO THEO GIAI ĐOẠN" — dựng theo trang chi tiết job của Base.
 *
 * 🔴 Ban lãnh đạo 16/08/2026: *"đây là quy trình thu mua khi mở trên 1 trang, e bố cục giống
 * 100% như vậy"* (4 ảnh chụp `workflow.base.vn/job/3898671`).
 *
 * Điểm khác biệt lớn nhất so với bố cục cũ: Base gom dữ liệu **theo GIAI ĐOẠN** — mỗi giai
 * đoạn một khối gập, bên trong là đúng những thứ được nhập vào ở giai đoạn ấy. App trước đây
 * gom **theo LOẠI CHỨNG TỪ** (bảng báo giá một chỗ, đơn hàng một chỗ), nên muốn biết "bước ③
 * đã nộp những gì" thì phải đi tìm khắp trang.
 *
 * 📌 CÁC TRƯỜNG ĐÁNH SỐ LIÊN TỤC xuyên suốt cả trang (01, 02, … 13) đúng như Base — nhờ vậy
 * hai người trao đổi qua điện thoại nói "trường 07" là hiểu nhau ngay.
 */

/** Một trường đầu vào — giá trị là chữ hoặc danh sách tệp. */
export interface TruongDauVao {
  nhan: string;
  /** Giá trị dạng chữ. Bỏ trống nếu dùng `tep`. */
  giaTri?: string;
  /** Tệp đính kèm — hiện nút xem, không phải chữ trơn. */
  tep?: MoTaTep[];
  /** Nội dung tự do (bảng chi tiết mặt hàng chẳng hạn). */
  noiDung?: React.ReactNode;
}

/** Một giai đoạn và phần đầu vào của nó. */
export interface GiaiDoanDauVao {
  ma: string;
  nhan: string;
  truong: TruongDauVao[];
  /** Giai đoạn đang đứng — mở sẵn, các giai đoạn khác gập lại. */
  dangODay?: boolean;
  /**
   * Phần LÀM VIỆC thật của giai đoạn này (bảng phân bổ, bảng báo giá, đơn hàng…).
   *
   * 🔴 Ban lãnh đạo 16/08/2026 — về ba khối app có mà Base không có: *"những mục này base
   * ko có, e kiểm tra xem nó đang trùng ở bước nào thì thêm nó vào bước đó"*. Tức là KHÔNG
   * bỏ ba khối đó, mà đưa vào đúng giai đoạn của chúng, để trang vẫn gom theo GIAI ĐOẠN
   * như Base. Nhờ vậy đứng ở bước nào là thấy đủ cả *dữ liệu đã nhập* lẫn *việc phải làm*
   * của bước đó, không phải cuộn xuống cuối trang tìm bảng tương ứng.
   */
  noiDungNghiepVu?: React.ReactNode;
}

/**
 * NHÃN CỦA MỘT PHẦN BÊN TRONG KHỐI GIAI ĐOẠN.
 *
 * Một khối giai đoạn có hai phần NGANG HÀNG nhau: *dữ liệu đã nhập vào* ("ĐẦU VÀO") và
 * *việc phải làm* (Phân bổ công việc · Bảng báo giá · Đơn đặt hàng). Hai phần ngang hàng
 * thì phải cùng một cỡ chữ.
 *
 * 🔴 Ban lãnh đạo 16/08/2026 nhìn màn chi tiết và nói *"kiểm tra xem chiều cao chữ đang
 * ko đồng đều"*, khoanh đỏ đúng hai tiêu đề "Phân bổ công việc" và "Bảng báo giá". Nguyên
 * do: ba khối nghiệp vụ vốn đứng RỜI ngoài trang nên có tiêu đề `text-h3` 18px; cùng ngày
 * chúng được đưa VÀO trong khối giai đoạn (tiêu đề khối chỉ 11px) mà cỡ chữ giữ nguyên —
 * thành ra tiêu đề con to hơn tiêu đề cha 7px, ngược thứ bậc.
 *
 * 🔴 VÌ SAO PHẢI LÀ MỘT COMPONENT DÙNG CHUNG, không chép class ra bốn nơi: bốn nhãn này
 * bắt buộc phải luôn bằng nhau. Chép ra rồi lần sau ai đó chỉnh một nơi là lệch lại đúng
 * cái lỗi hôm nay, mà lệch 1–2px thì không ai soi ra khi đọc code.
 */
export function NhanPhanTrongGiaiDoan({
  icon: BieuTuong,
  the = "p",
  className,
  children,
}: {
  icon: LucideIcon;
  /**
   * Thẻ ngữ nghĩa. "ĐẦU VÀO" chỉ là nhãn của danh sách trường nên để `p`; còn ba khối
   * nghiệp vụ là tiêu đề thật của một vùng nội dung nên giữ `h2` cho trình đọc màn hình
   * và mục lục trang — đổi kiểu chữ KHÔNG được kéo theo hạ cấp ngữ nghĩa.
   */
  the?: "p" | "h2";
  className?: string;
  children: React.ReactNode;
}) {
  const lop = cn(
    "flex items-center gap-1.5 text-xs font-semibold text-text-desc uppercase",
    className,
  );
  const noiDung = (
    <>
      <BieuTuong className="size-3.5 shrink-0" aria-hidden />
      {children}
    </>
  );
  // Viết tách hai nhánh thay vì dựng thẻ động: TypeScript kiểm được đúng thuộc tính của
  // từng thẻ, và người đọc thấy ngay component này chỉ sinh ra p hoặc h2, không gì khác.
  return the === "h2" ? <h2 className={lop}>{noiDung}</h2> : <p className={lop}>{noiDung}</p>;
}

export function KhoiDauVaoTheoGiaiDoan({ giaiDoan }: { giaiDoan: GiaiDoanDauVao[] }) {
  /**
   * Giai đoạn nào đang mở.
   *
   * 📌 Mặc định mở giai đoạn ĐANG ĐỨNG, gập các giai đoạn khác — Base cũng vậy. Mở hết thì
   * trang dài mấy màn hình; gập hết thì người vào phải bấm mới thấy việc đang làm.
   */
  const [mo, setMo] = useState<string[]>(() =>
    giaiDoan.filter((g) => g.dangODay).map((g) => g.ma),
  );

  const [xemTep, setXemTep] = useState<MoTaTep | null>(null);

  // Đánh số liên tục qua MỌI giai đoạn, không đánh lại từ 01 ở mỗi khối.
  let so = 0;

  return (
    <div className="flex flex-col gap-(--hp-md-row-gap)">
      {giaiDoan.map((g) => {
        const dangMo = mo.includes(g.ma);
        // Tính số thứ tự trước khi vẽ, kể cả khi khối đang gập — số phải giữ nguyên dù
        // người dùng gập mở khối nào.
        const truongCoSo = g.truong.map((t) => ({ ...t, so: ++so }));

        /**
         * Giai đoạn KHÔNG có trường nhập nào nhưng CÓ phần làm việc (bước ① chỉ có bảng
         * Phân bổ chẳng hạn) thì bỏ luôn con số trên nhãn gập.
         *
         * Ghi "THU GỌN · 0" là nói dối người xem: họ đọc số 0 rồi bỏ qua khối, trong khi
         * bên trong là đúng cái bảng họ cần làm việc. Con số chỉ đếm TRƯỜNG ĐẦU VÀO, cố
         * cộng thêm phần làm việc vào cũng sai vì đó không phải trường đánh số.
         */
        const anSoTruong = g.truong.length === 0 && Boolean(g.noiDungNghiepVu);
        const nhanKhiMo = anSoTruong ? "" : `${g.truong.length} trường`;
        const nhanKhiGap = anSoTruong ? "THU GỌN" : `THU GỌN · ${g.truong.length}`;
        const nhanGap = dangMo ? nhanKhiMo : nhanKhiGap;

        return (
          /* Nền và khoảng đệm cũng lấy đúng của `KhoiGap` — hai khối xếp liền nhau, lệch nền
             một chút là nhìn ra ngay. */
          <section key={g.ma} className="rounded-xl border border-border bg-surface">
            <button
              type="button"
              onClick={() =>
                setMo((cu) => (cu.includes(g.ma) ? cu.filter((x) => x !== g.ma) : [...cu, g.ma]))
              }
              aria-expanded={dangMo}
              className="flex min-h-11 w-full items-center gap-2 px-(--hp-md-card-pad) py-3 text-left"
            >
              <ChevronRight
                className={`size-4 shrink-0 text-text-desc transition-transform ${dangMo ? "rotate-90" : ""}`}
                aria-hidden
              />
              {/* 🔴 DÙNG ĐÚNG KIỂU CHỮ CỦA `KhoiGap` (Ban lãnh đạo 16/08/2026: *"đưa cỡ chữ và
                  font chữ về giống nhau"*). Khối "Thông tin đề nghị" ngay phía trên là một
                  `KhoiGap`, nên hai khối nằm cạnh nhau mà lệch cỡ chữ là thấy ngay. Nếu sau
                  này đổi kiểu tiêu đề gập thì phải đổi cả hai chỗ. */}
              <span className="text-[11px] font-semibold tracking-wide text-text-desc uppercase">
                {g.nhan}
              </span>
              {/* Nhãn trạng thái gập bên phải — Base ghi "COLLAPSED" / "THU GỌN". Kèm số
                  trường để biết khối có gì mà không phải mở ra. Nhãn rỗng thì không vẽ ô,
                  một ô xám trống trơn còn khó hiểu hơn là không có gì. */}
              {nhanGap && (
                <span className="ml-auto shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-text-secondary tabular-nums">
                  {nhanGap}
                </span>
              )}
            </button>

            {dangMo && (
              <>
              {/* `text-sm` khai rõ ở đây để chữ nào quên khai cỡ cũng ra 14px như phần còn
                  lại của trang, chứ không rơi về 16px mặc định của trình duyệt rồi to hơn
                  cả nội dung xung quanh. */}
              <div className="border-t border-divider p-(--hp-md-card-pad) text-sm">
                <NhanPhanTrongGiaiDoan icon={LogIn} className="mb-2">
                  ĐẦU VÀO
                </NhanPhanTrongGiaiDoan>

                {g.truong.length === 0 ? (
                  <p className="text-sm text-text-desc">Giai đoạn này chưa có dữ liệu nhập vào.</p>
                ) : (
                  <dl className="flex flex-col gap-(--hp-md-row-gap)">
                    {truongCoSo.map((t) => (
                      <div key={t.nhan} className="flex gap-3">
                        {/* Số thứ tự cột trái, đúng kiểu Base — `tabular-nums` để 01 và 12
                            thẳng hàng nhau. */}
                        <dt className="w-6 shrink-0 pt-0.5 text-xs text-text-disabled tabular-nums">
                          {String(t.so).padStart(2, "0")}
                        </dt>
                        <dd className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="text-xs text-text-desc">{t.nhan}</span>

                          {t.giaTri !== undefined && (
                            <span className="text-sm font-medium text-text-primary">
                              {t.giaTri || "—"}
                            </span>
                          )}

                          {t.noiDung}

                          {(t.tep ?? []).length > 0 && (
                            <ul className="flex flex-wrap gap-1.5">
                              {(t.tep ?? []).map((tp) => (
                                <li key={tp.id}>
                                  <button
                                    type="button"
                                    onClick={() => setXemTep(tp)}
                                    className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary"
                                  >
                                    <span className="truncate" title={tp.tenTep}>
                                      {rutGonTenTep(tp.tenTep, 34)}
                                    </span>
                                    <span className="shrink-0 text-text-desc">
                                      {coTep(tp.kichThuoc)}
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>

              {/* PHẦN LÀM VIỆC của giai đoạn — nằm NGOÀI nhánh "chưa có dữ liệu nhập vào"
                  ở trên, vì hai thứ độc lập nhau: bước ① chưa nhập trường nào nhưng vẫn
                  phải phân bổ người phụ trách. Gộp vào nhánh đó là khối làm việc biến mất
                  đúng lúc cần nó nhất.
                  Đường kẻ ngang tách bạch "cái đã nhập vào" với "cái phải làm". */}
              {g.noiDungNghiepVu && (
                /* Cũng khai `text-sm` như phần ĐẦU VÀO — hai phần nằm trong cùng một khối
                   thì nền cỡ chữ phải giống nhau, không để một bên 14px một bên 16px. */
                <div className="border-t border-divider p-(--hp-md-card-pad) text-sm">
                  {g.noiDungNghiepVu}
                </div>
              )}
              </>
            )}
          </section>
        );
      })}

      {xemTep && <HopXemTep tep={xemTep} mo onDong={() => setXemTep(null)} />}
    </div>
  );
}
