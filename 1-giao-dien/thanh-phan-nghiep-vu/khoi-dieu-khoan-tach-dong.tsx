"use client";

// ============================================================
// KHỐI ĐIỀU KHOẢN — MỖI ĐẦU MỤC MỘT Ô, SỬA / THÊM / XOÁ TỪNG MỤC
//
// ★ Ban lãnh đạo 24/08/2026: *"1. Tách từng đầu mục riêng và được phép chỉnh sửa.
//   2. Bố cục dàn trang nhìn cho cân đối"*.
//
// 🔴 TRƯỚC ĐÓ LÀ MỘT Ô CHỮ 10 DÒNG chứa cả trang điều khoản. Sửa một gạch đầu dòng phải cuộn
// trong ô, đếm dòng bằng mắt, và rất dễ xoá lẹm sang mục bên cạnh mà không biết. Tách ra thì
// mỗi mục là một ô riêng — sửa mục nào chỉ đụng mục đó.
//
// 🔴🔴 GIÁ TRỊ LƯU VẪN LÀ MỘT CHUỖI, KHÔNG ĐỔI SANG MẢNG. Đây là chốt quan trọng nhất của tệp
// này. `dieuKhoanGiaoHang` trong `3-du-lieu/kieu-du-lieu.ts` là `string | undefined`, và tờ in
// A4 lẫn tệp Excel đều đọc kiểu đó. Đổi sang mảng là phải sửa cả hai chỗ in + mọi đơn đã lưu
// trước đây thành dữ liệu sai kiểu. Nên ở đây CHỈ đổi cách BÀY: tách chuỗi ra để sửa, rồi nối
// lại bằng `\n` trước khi cất.
//
// 🔴 BA TRẠNG THÁI KHÁC NHAU, ĐỪNG GỘP:
//   · `null`  = CHƯA AI SỬA → tờ in dùng bản chuẩn của công ty. Công ty đổi điều khoản thì đơn
//               này tự nhận bản mới.
//   · `""`    = CỐ Ý BỎ HẲN khối điều khoản (đơn không cần in điều khoản nào).
//   · chuỗi   = bản riêng của đơn này.
// Gộp `null` với `""` là mọi đơn mang một bản copy đóng băng — đúng cái đã cảnh báo ở
// `kieu-du-lieu.ts`.
// ============================================================

import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";

/** Số dòng của ô nhập, tính theo độ dài chữ để ô không bị cuộn ngầm. */
function soDongCanCho(chu: string): number {
  /* ~92 ký tự một dòng ở cỡ chữ 12px trên khối rộng cả trang. Tối thiểu 1, tối đa 6 — dài hơn
     nữa thì để ô tự cuộn, chứ một ô cao 10 dòng lại thành đúng cái vừa bỏ. */
  return Math.min(6, Math.max(1, Math.ceil(chu.length / 92)));
}

export function KhoiDieuKhoanTachDong({
  id,
  nhan,
  moTa,
  /** `null` = chưa ai sửa (dùng bản chuẩn). Xem chú thích ba trạng thái ở đầu tệp. */
  giaTri,
  banChuan,
  khoa = false,
  onDoi,
}: {
  id: string;
  nhan: string;
  moTa?: string;
  giaTri: string | null;
  banChuan: string;
  khoa?: boolean;
  onDoi: (giaTriMoi: string | null) => void;
}) {
  const daSua = giaTri !== null;
  /* Bày bản chuẩn khi chưa ai sửa — người lập cần sửa vài chỗ bỏ trống trong đó (số ngày khiếu
     nại `……`, phạm vi bốc xếp), không phải gõ lại cả trang. */
  const cacDong = (giaTri ?? banChuan).split(/\r?\n/);

  /** Ghi lại cả khối từ mảng dòng. Nối bằng `\n` — xem chốt "giá trị lưu vẫn là chuỗi". */
  function ghi(dongMoi: string[]) {
    onDoi(dongMoi.join("\n"));
  }

  function suaDong(i: number, chu: string) {
    ghi(cacDong.map((d, k) => (k === i ? chu : d)));
  }

  function xoaDong(i: number) {
    ghi(cacDong.filter((_, k) => k !== i));
  }

  /**
   * 🔴 DÒNG TIÊU ĐỀ TRÙNG NHÃN KHỐI THÌ KHÔNG BÀY THÀNH Ô NHẬP — Ban lãnh đạo 27/08/2026:
   * *"Bỏ ô này đang dư"*, chỉ đúng ô số 1 ghi *"Phương thức giao hàng:"* nằm ngay dưới cái nhãn
   * cũng ghi *"Phương thức giao hàng"*. Đọc hai lần cùng một chữ, mà ô đó chẳng có gì để sửa.
   *
   * 🔴🔴 ẨN Ô NHẬP, TUYỆT ĐỐI KHÔNG XOÁ DÒNG KHỎI DỮ LIỆU. Dòng đó là **tiêu đề in đậm trên tờ
   * giấy gửi nhà cung cấp** (biểu mẫu chuẩn có nó). Xoá khỏi bản chuẩn cho "gọn form" là tờ in
   * mất hẳn dòng tiêu đề — sửa một chỗ trên màn hình, hỏng một chỗ trên chứng từ.
   *
   * ⚠️ So sau khi bỏ dấu hai chấm và chuẩn hoá khoảng trắng, không phân biệt hoa thường: nhãn
   * khối và dòng tiêu đề do hai người khác nhau viết ở hai tệp khác nhau, đòi khớp từng ký tự là
   * đổi một dấu cách cũng hết ẩn.
   */
  const chuGon = (s: string) =>
    s.trim().replace(/:$/, "").replace(/\s+/g, " ").toLowerCase();
  const anDongDau = cacDong.length > 0 && chuGon(cacDong[0]) === chuGon(nhan);

  /** Các dòng ĐEM RA BÀY, kèm chỉ số GỐC để `suaDong`/`xoaDong` vẫn trỏ đúng dòng trong chuỗi. */
  const dongBay = cacDong
    .map((chu, iGoc) => ({ chu, iGoc }))
    .filter((_, k) => !(anDongDau && k === 0));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* `nhan-hai-cham`: dấu hai chấm cuối nhãn do CSS thêm, đúng lối biểu mẫu giấy — xem chú
            thích của lớp đó trong `app/globals.css`. Khối này không dùng `.muc-ngang` (nhãn phải
            đứng trên vì các ô bên dưới là textarea nhiều dòng), nên khai riêng. */}
        <Label htmlFor={`${id}-0`} className="nhan-hai-cham">
          {nhan}
        </Label>
        {daSua && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDoi(null)}
            disabled={khoa}
            className="min-h-11 md:min-h-9"
          >
            <RotateCcw className="size-4" aria-hidden />
            Khôi phục bản chuẩn
          </Button>
        )}
      </div>

      {/**
        * 🔴 `max-w-none!` — DẤU `!` LÀ BẮT BUỘC, KHÔNG PHẢI CHO CHẮC.
        *
        * Khối cha (khối ④ của form PO) khai `[&_textarea]:max-w-xl` cho mọi ô chữ bên trong. Hai
        * lớp `max-w-none` và `max-w-xl` có **cùng độ ưu tiên CSS**, nên cái nào thắng phụ thuộc
        * thứ tự Tailwind xếp trong tệp CSS — không phụ thuộc thứ tự DOM. Đã ĐO trên trình duyệt:
        * viết `max-w-none` trơn thì ô vẫn kẹt **576px** (= 36rem = `max-w-xl`), tức lớp của cha
        * thắng. Không lỗi lint, không lỗi build — chỉ là ô không rộng ra, đúng kiểu hỏng im lặng
        * mà `CLAUDE.md` đã cảnh báo với `sm:max-w-…` của hộp thoại.
        *
        * 📌 Chỉ cởi giới hạn cho khối điều khoản này; các ô khác của khối ④ vẫn giữ `max-w-xl`
        * (ô trải hết bề ngang màn 27 inch thì mắt phải rê rất xa từ nhãn tới chỗ gõ).
        */}
      <div className="flex flex-col gap-1.5 [&_textarea]:max-w-none!">
        {dongBay.map(({ chu: dong, iGoc }, viTri) => {
          const laTieuDe = dong.trim().endsWith(":");
          const laDongTrong = dong.trim() === "";
          /* Đánh số theo thứ tự NGƯỜI DÙNG NHÌN THẤY, không theo chỉ số trong chuỗi: ẩn dòng đầu
             mà vẫn đánh số từ 2 thì họ đi tìm "mục 1" không có thật. */
          const soHien = dongBay.slice(0, viTri + 1).filter((d) => d.chu.trim() !== "").length;
          return (
            <div key={iGoc} className="flex items-start gap-1.5">
              {/* Số thứ tự để nói chuyện được với nhau ("mục 5 sửa lại") — dòng trống thì không
                  đánh số, nó chỉ là khoảng cách trên tờ in. */}
              <span className="w-6 shrink-0 pt-2.5 text-right text-xs tabular-nums text-text-desc">
                {laDongTrong ? "" : soHien}
              </span>

              {laDongTrong ? (
                /* Dòng trống = khoảng cách giữa hai nhóm trên tờ in. Bày thành một vạch mờ có
                   nhãn, chứ không bày ô nhập rỗng: ô rỗng làm người lập tưởng mình bỏ sót chưa
                   điền, rồi gõ vào đó và mất khoảng cách của tờ in. */
                <span className="flex min-h-11 flex-1 items-center gap-2 rounded-lg border border-dashed border-divider px-3 text-xs text-text-desc md:min-h-9">
                  — khoảng cách giữa hai nhóm —
                </span>
              ) : (
                <Textarea
                  id={`${id}-${iGoc}`}
                  rows={soDongCanCho(dong)}
                  value={dong}
                  disabled={khoa}
                  onChange={(e) => suaDong(iGoc, e.target.value)}
                  aria-label={`${nhan} — mục ${soHien}`}
                  className={`flex-1 text-xs ${laTieuDe ? "font-semibold" : ""}`}
                />
              )}

              {/**
                * 📌 CHỈ CÒN NÚT XOÁ — Ban lãnh đạo 27/08/2026: *"Tính năng dấu + này bỏ luôn"*.
                *
                * Nút [+] trước đây chèn một mục TRẮNG vào giữa khối. Nhưng khối này là **điều
                * khoản chuẩn của công ty**, không phải chỗ soạn văn bản tự do: mục người lập tự
                * thêm sẽ in thẳng lên chứng từ gửi ra ngoài mà không ai duyệt nội dung.
                *
                * ⚠️ VẪN CÒN ĐƯỜNG VỀ khi lỡ xoá nhầm: nút **Khôi phục bản chuẩn** ở góc phải nhãn
                * khối (hiện ngay khi khối đã bị sửa) lấy lại nguyên bản của mẫu đang chọn. Đừng bỏ
                * nốt nút đó — bỏ là xoá nhầm một mục thì mất vĩnh viễn.
                */}
              <span className="flex shrink-0 flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => xoaDong(iGoc)}
                  disabled={khoa}
                  title="Xoá mục này"
                  aria-label={`Xoá mục ${soHien}`}
                  className="rounded-md p-1.5 text-text-desc transition-colors hover:bg-danger-bg hover:text-danger disabled:opacity-40"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </span>
            </div>
          );
        })}
      </div>

      {/**
        * Xoá hết mục thì phải có đường quay lại, nếu không khối chết hẳn và người lập chỉ còn
        * cách tải lại trang.
        *
        * 📌 Từ 27/08/2026 nút này lấy lại BẢN CHUẨN chứ không chèn một mục trắng — Ban lãnh đạo
        * bỏ tính năng thêm mục tự do (*"Tính năng dấu + này bỏ luôn"*), mà một ô trắng cũng chính
        * là mục tự do. Lấy lại bản chuẩn còn đúng hơn: khối này vốn là điều khoản của công ty.
        */}
      {cacDong.every((d) => d.trim() === "") && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onDoi(null)}
          disabled={khoa}
          className="w-fit"
        >
          <RotateCcw className="size-4" aria-hidden />
          Lấy lại bản chuẩn
        </Button>
      )}

      {moTa && <p className="text-xs text-text-desc">{moTa}</p>}
      {daSua && (
        <p className="text-xs text-warning-soft">
          Đơn này đang dùng bản đã sửa — tờ in sẽ ghi rõ là khác bản chuẩn của công ty.
        </p>
      )}
    </div>
  );
}
