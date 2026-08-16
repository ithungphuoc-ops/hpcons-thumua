"use client";

import { useState } from "react";
import { ChevronRight, LogIn } from "lucide-react";
import { HopXemTep } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xem-tep";
import { rutGonTenTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { coTep, type MoTaTep } from "@/3-du-lieu/kho-tep";

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

        return (
          <section key={g.ma} className="rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() =>
                setMo((cu) => (cu.includes(g.ma) ? cu.filter((x) => x !== g.ma) : [...cu, g.ma]))
              }
              aria-expanded={dangMo}
              className="flex min-h-11 w-full items-center gap-2 px-(--hp-md-card-pad) py-2.5 text-left"
            >
              <ChevronRight
                className={`size-4 shrink-0 text-text-desc transition-transform ${dangMo ? "rotate-90" : ""}`}
                aria-hidden
              />
              <span className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
                {g.nhan}
              </span>
              {/* Số trường bên trong — biết khối có gì mà không phải mở ra. */}
              <span className="ml-auto shrink-0 text-xs text-text-desc">
                {g.truong.length} trường
              </span>
            </button>

            {dangMo && (
              <div className="border-t border-divider p-(--hp-md-card-pad)">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-text-desc">
                  <LogIn className="size-3.5 shrink-0" aria-hidden />
                  ĐẦU VÀO
                </p>

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
            )}
          </section>
        );
      })}

      {xemTep && <HopXemTep tep={xemTep} mo onDong={() => setXemTep(null)} />}
    </div>
  );
}
