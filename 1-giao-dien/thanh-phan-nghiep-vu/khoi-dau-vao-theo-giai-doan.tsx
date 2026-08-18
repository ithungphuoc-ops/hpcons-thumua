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
  /**
   * KHU ĐÍNH KÈM TỆP của riêng bước này — xem `khu-dinh-kem-giai-doan.tsx`.
   *
   * 🔴 Ban lãnh đạo 17/08/2026 khoanh đỏ khối "Bảng báo giá (0)" ở bước ② và ghi *"mục đính
   * kèm file"*. Trước đó bước ② không có chỗ nào bỏ tệp vào: bản báo giá nhà cung cấp gửi
   * về qua Zalo/email chỉ gắn được sau khi đã lập bảng báo giá.
   *
   * 📌 Nhận `ReactNode` chứ không nhận `MoTaTep[]`: khu đính kèm còn phải ghi dữ liệu và
   * kiểm quyền, mà khối này chỉ biết BÀY. Để nó tự đi lấy dữ liệu là kéo cả kho dữ liệu và
   * phân quyền vào một component vốn thuần hiển thị.
   */
  khuDinhKem?: React.ReactNode;
  /**
   * GẬP KHỐI THÌ CHỈ ẨN, KHÔNG THÁO KHỎI CÂY REACT.
   *
   * 🔴 BẮT BUỘC BẬT CHO BƯỚC CÓ FORM NHẬP LIỆU (từ 17/08/2026, khi form lập đơn mua hàng
   * chuyển vào trong khối bước ④ theo chỉ đạo *"phần nhập liệu phải nằm trong khối"*).
   *
   * Mặc định khối gập là `{dangMo && …}` — React THÁO nội dung, nên mọi thứ người dùng đang gõ
   * biến mất không có nút hoàn lại: gõ nửa cái đơn 20 dòng, bấm gập khối (hay chỉ mở khối khác
   * rồi gập khối này) là mất sạch. Tháo rồi gắn lại còn làm các chốt "chỉ điền sẵn một lần"
   * chạy lại từ đầu và ghi đè số người dùng đã sửa tay.
   *
   * ⚠️ Đánh đổi: nội dung của khối bật cờ này LUÔN được dựng, kể cả lúc đang gập — nặng hơn
   * một chút. Vì vậy CHỈ bật cho khối có form; các khối chỉ bày dữ liệu thì cứ để mặc định để
   * trang nhẹ.
   */
  giuNoiDungKhiGap?: boolean;
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
   * Giai đoạn nào đang mở. **Mặc định GẬP HẾT** — mỗi lần vào trang, hoặc F5, đều về gập.
   *
   * 🔴 Ban lãnh đạo nhắc HAI LẦN (18/08/2026): *"chỗ này sửa lại, khi F5 là tự group lại"*, rồi
   * *"mục này sao F5 vẫn chưa chịu group lại"*.
   *
   * 🔴 LẦN ĐẦU TÔI HIỂU NGƯỢC Ý và làm sai hẳn: tưởng đây là lời phàn nàn *"F5 là bị gập mất"*
   * nên đi lưu trạng thái đang mở vào `localStorage` để giữ qua F5 — tức làm đúng cái trái
   * ngược với yêu cầu. Yêu cầu là: **F5 thì gập lại**. Nay đã bỏ hết phần lưu đó.
   *
   * 🔴 CŨNG BỎ luôn nếp "tự mở giai đoạn đang đứng". Khối trong ảnh Ban lãnh đạo khoanh đỏ
   * (*Yêu cầu NCC báo giá*) CHÍNH LÀ giai đoạn hiện tại, nên chỉ bỏ `localStorage` thôi thì F5
   * nó vẫn bung ra — vẫn đúng lỗi vừa bị nhắc. Muốn "F5 là gập lại" thật thì trạng thái đầu
   * phải là RỖNG.
   *
   * 📌 Không mất thông tin: nhãn phải mỗi khối vẫn ghi số trường bên trong (*"THU GỌN · 4"*),
   * nên gập hết vẫn đọc được khối nào có gì mà không phải mở ra.
   */
  const [mo, setMo] = useState<string[]>([]);

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
         * Phân bổ chẳng hạn) hoặc CÓ khu đính kèm thì bỏ luôn con số trên nhãn gập.
         *
         * Ghi "THU GỌN · 0" là nói dối người xem: họ đọc số 0 rồi bỏ qua khối, trong khi
         * bên trong là đúng cái bảng họ cần làm việc. Con số chỉ đếm TRƯỜNG ĐẦU VÀO, cố
         * cộng thêm phần làm việc vào cũng sai vì đó không phải trường đánh số.
         *
         * 🔴 TÍNH CẢ `khuDinhKem` từ 17/08/2026. Bước ⑤ chẳng hạn có thể không có trường nào
         * mà vẫn đang giữ ba tệp hợp đồng — nhãn "THU GỌN · 0" khiến người dùng đọc số 0 rồi
         * bỏ qua, đúng cái bẫy khối chú thích này sinh ra để tránh. Không cộng số tệp vào con
         * số ấy được: nó đếm TRƯỜNG ĐẦU VÀO đánh số 01→N, tệp không nằm trong dãy đó.
         *
         * ⚠️ Không biết được khu đính kèm có thật sự vẽ ra gì không (nó trả `null` khi trống
         * và không được sửa) — nên ở đây chọn IM LẶNG về con số thay vì đoán. Nói ít mà đúng
         * hơn là nói một con số có thể sai.
         */
        const anSoTruong =
          g.truong.length === 0 && (Boolean(g.noiDungNghiepVu) || Boolean(g.khuDinhKem));
        const nhanKhiMo = anSoTruong ? "" : `${g.truong.length} trường`;
        const nhanKhiGap = anSoTruong ? "THU GỌN" : `THU GỌN · ${g.truong.length}`;
        const nhanGap = dangMo ? nhanKhiMo : nhanKhiGap;

        return (
          /* 🔴 KHỐI BƯỚC CÓ VIỀN MÀU NHẬN DIỆN — Ban lãnh đạo 17/08/2026: *"các mục chính này
             e đánh màu lên cho dễ nhận dạng, đánh màu đường border và đổ nền nhạt thôi"*.

             VÌ SAO CẦN: sáu khối bước và các khối phụ (Thông tin đề nghị, Danh sách công việc,
             Trao đổi) trước đây dùng CÙNG một viền xám + nền `bg-surface`, nên nhìn cả trang
             là một dãy hộp giống hệt nhau — không đọc ra đâu là mốc chính của quy trình.

             📌 CHỈ đổi viền và nền, đúng chữ *"thôi"* của Ban lãnh đạo: không đổi cỡ chữ,
             không thêm biểu tượng, không đổi khoảng cách. `border-primary/30` + `bg-primary-bg`
             đều là token có sẵn (dùng ở khối "Đã tách thành N đề xuất con"), tự đổi theo
             Sáng/Tối, không có mã màu viết cứng.

             ⚠️ Chỉ tô DÒNG TIÊU ĐỀ, không tô cả thân khối: tô hết thì phần nội dung bên trong
             (bảng phân bổ, form lập đơn, danh sách tệp) chìm vào nền xanh và mất chỗ nghỉ mắt. */
          <section key={g.ma} className="overflow-hidden rounded-xl border border-primary/30 bg-surface">
            <button
              type="button"
              onClick={() =>
                setMo((cu) => (cu.includes(g.ma) ? cu.filter((x) => x !== g.ma) : [...cu, g.ma]))
              }
              aria-expanded={dangMo}
              className="flex min-h-11 w-full items-center gap-2 bg-primary-bg px-(--hp-md-card-pad) py-3 text-left transition-colors hover:bg-primary/10"
            >
              <ChevronRight
                className={`size-4 shrink-0 text-primary transition-transform ${dangMo ? "rotate-90" : ""}`}
                aria-hidden
              />
              {/* 🔴 DÙNG ĐÚNG KIỂU CHỮ CỦA `KhoiGap` (Ban lãnh đạo 16/08/2026: *"đưa cỡ chữ và
                  font chữ về giống nhau"*). Khối "Thông tin đề nghị" ngay phía trên là một
                  `KhoiGap`, nên hai khối nằm cạnh nhau mà lệch cỡ chữ là thấy ngay. Nếu sau
                  này đổi kiểu tiêu đề gập thì phải đổi cả hai chỗ.

                  📌 Màu chữ nâng từ `text-text-desc` lên `text-primary`: trên nền xanh nhạt,
                  chữ xám mờ tụt tương phản xuống dưới ngưỡng đọc được. */}
              <span className="text-[11px] font-semibold tracking-wide text-primary uppercase">
                {g.nhan}
              </span>
              {/* Nhãn trạng thái gập bên phải — Base ghi "COLLAPSED" / "THU GỌN". Kèm số
                  trường để biết khối có gì mà không phải mở ra. Nhãn rỗng thì không vẽ ô,
                  một ô xám trống trơn còn khó hiểu hơn là không có gì. */}
              {/* Nền `bg-card` chứ không `bg-muted`: dòng tiêu đề giờ là nền xanh nhạt, mà
                  `--color-muted` trong `app/globals.css` đúng bằng `--hp-surface` nên ô nhãn
                  sẽ lẫn vào nền xanh thay vì nổi lên như khi nền còn trắng. */}
              {nhanGap && (
                <span className="ml-auto shrink-0 rounded-md bg-card px-1.5 py-0.5 text-[11px] font-medium text-text-secondary tabular-nums">
                  {nhanGap}
                </span>
              )}
            </button>

            {/* 🔴 HAI CÁCH GẬP, tùy khối có form nhập liệu hay không — xem `giuNoiDungKhiGap`.
                · Khối thường: gập là THÁO khỏi cây React (nhẹ trang, không có gì để mất).
                · Khối có form (bước ④ từ 17/08/2026): gập chỉ ẩn bằng `hidden` (display:none),
                  giữ nguyên mọi ô người dùng đang gõ. `display:none` cũng đưa nội dung ra khỏi
                  thứ tự Tab và khỏi trình đọc màn hình, nên vẫn đúng nghĩa "đã thu gọn". */}
            {(dangMo || g.giuNoiDungKhiGap) && (
              <div className={dangMo ? undefined : "hidden"}>
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

              {/* ★ TỆP ĐÍNH KÈM CỦA BƯỚC — Ban lãnh đạo 17/08/2026: *"mục đính kèm file"*.

                  Đứng SAU cả "ĐẦU VÀO" lẫn phần làm việc, ngăn bằng cùng một đường kẻ và
                  cùng cỡ chữ, vì nó là phần thứ ba NGANG HÀNG với hai phần kia: cái đã nhập
                  vào · việc phải làm · chứng từ kèm theo.

                  🔴 NẰM NGOÀI nhánh "chưa có dữ liệu nhập vào" của phần ĐẦU VÀO — bước ②
                  chỉ có đúng một trường "SL Báo giá" và bước ③ có thể không có trường nào,
                  nhưng đó lại chính là hai bước cần chỗ dán báo giá nhất. Gộp vào nhánh ấy
                  là khu đính kèm biến mất đúng lúc cần nó nhất.

                  ⚠️ `empty:hidden` là CỐ Ý: `KhuDinhKemGiaiDoan` trả `null` khi bước chưa có
                  tệp và người xem không được thêm — lúc đó thẻ này rỗng và phải tự ẩn, nếu
                  không sẽ để lại một dải kẻ ngang cùng khoảng đệm trống trơn. Không thể kiểm
                  bằng `g.khuDinhKem && …` vì một phần tử React luôn "có thật" dù nó vẽ ra
                  `null`. */}
              {g.khuDinhKem && (
                <div className="border-t border-divider p-(--hp-md-card-pad) text-sm empty:hidden">
                  {g.khuDinhKem}
                </div>
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
