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

import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";
import {
  goiNgatDongTrongMuc,
  moNgatDongTrongMuc,
  NGAT_DONG_TRONG_MUC,
} from "@/3-du-lieu/dieu-khoan-chuan-don-mua-hang";

/** Số dòng của ô nhập, tính theo độ dài chữ để ô không bị cuộn ngầm. */
function soDongCanCho(chu: string): number {
  /* ~92 ký tự một dòng ở cỡ chữ 12px trên khối rộng cả trang. Tối thiểu 1, tối đa 6 — dài hơn
     nữa thì để ô tự cuộn, chứ một ô cao 10 dòng lại thành đúng cái vừa bỏ. */
  const theoDoDai = Math.ceil(chu.length / 92);
  /* 🔴 CỘNG CẢ SỐ LẦN NGƯỜI DÙNG BẤM ENTER (27/08/2026). Chỉ đếm độ dài thì một mục ngắn xuống
     dòng ba lần vẫn ra `rows=1`, ô cao đúng một dòng và hai dòng sau bị cuộn ngầm — người gõ
     tưởng chữ mình biến mất. */
  const soLanXuongDong = chu.split(NGAT_DONG_TRONG_MUC).length - 1;
  return Math.min(6, Math.max(1, theoDoDai + soLanXuongDong));
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

  /**
   * 🔴 GÓI XUỐNG DÒNG TRƯỚC KHI LƯU — Ban lãnh đạo 27/08/2026: *"xuống dòng trong trường đó chứ
   * không phải tạo thêm khoảng cách giữa 2 nhóm"*.
   *
   * Textarea trả về `\n` khi người dùng bấm Enter, mà `\n` ở đây là **dấu tách mục**. Để nguyên
   * là `join("\n")` rồi `split("\n")` cắt mục làm đôi ngay lần vẽ kế — chữ vừa gõ nhảy sang ô
   * dưới, hoặc sinh một mục rỗng hiện thành vạch "khoảng cách giữa hai nhóm".
   *
   * ✅ Đổi sang ký tự ngắt dòng riêng (`NGAT_DONG_TRONG_MUC`) thì `\n` chỉ còn một nghĩa duy
   * nhất, và mục giữ được nhiều dòng bên trong.
   */
  function suaDong(i: number, chu: string) {
    ghi(cacDong.map((d, k) => (k === i ? goiNgatDongTrongMuc(chu) : d)));
  }

  function xoaDong(i: number) {
    ghi(cacDong.filter((_, k) => k !== i));
  }

  /**
   * ★ Thêm một MỤC MỚI ngay dưới mục thứ `i` — nút [+], Ban lãnh đạo 27/08/2026.
   *
   * 📌 Chèn ngay dưới chứ không thêm vào cuối: người lập bấm [+] ở mục nào là muốn viết tiếp
   * ngay sau mục đó, không phải nhảy xuống cuối danh sách rồi tự kéo lên.
   */
  function themDongSau(i: number) {
    const moi = [...cacDong];
    moi.splice(i + 1, 0, "");
    ghi(moi);
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
                  đánh số, nó chưa có nội dung gì để gọi tên. */}
              <span className="w-6 shrink-0 pt-2.5 text-right text-xs tabular-nums text-text-desc">
                {laDongTrong ? "" : soHien}
              </span>

              {/**
                * 🔴 MỌI DÒNG ĐỀU LÀ Ô GÕ ĐƯỢC — kể cả dòng trống. Sửa 27/08/2026 (chiều).
                *
                * TRƯỚC ĐÂY dòng trống được bày thành một vạch mờ ghi *"— khoảng cách giữa hai nhóm
                * —"*, không phải ô nhập. Hai hậu quả, cả hai đều Ban lãnh đạo đã nói:
                *   ① *"tạo thêm khoảng cách giữa 2 nhóm, cái đó vô chi không có ích gì"* — vạch đó
                *      chiếm một dòng trên màn hình mà không làm được gì.
                *   ② Nút [+] chèn một dòng TRỐNG, nên bấm [+] ra đúng cái vạch vô ích đó chứ không
                *      ra ô để gõ. Đã đo: bấm [+] thì số ô nhập không tăng — nút như không chạy.
                *
                * ✅ Nay dòng trống là một ô rỗng, gõ vào được ngay. Người lập bấm [+] rồi gõ luôn.
                *
                * 📌 KHÔNG MẤT CHỨC NĂNG CỦA TỜ IN: dòng trống vẫn được lưu là dòng trống, và tờ in
                * vẫn dựng nó thành khoảng thở giữa hai nhóm điều khoản (`laDongTrong` ở
                * `to-don-mua-hang-a4.tsx`). Chỉ đổi cách BÀY trên form.
                */}
              <Textarea
                  id={`${id}-${iGoc}`}
                  rows={soDongCanCho(dong)}
                  /* Mở ngắt dòng về `\n` để Textarea hiển thị đúng nhiều dòng — chiều ngược của
                     `goiNgatDongTrongMuc` ở `suaDong`. */
                  value={moNgatDongTrongMuc(dong)}
                  disabled={khoa}
                  onChange={(e) => suaDong(iGoc, e.target.value)}
                  aria-label={`${nhan} — mục ${soHien}`}
                  placeholder={laDongTrong ? "Gõ nội dung mục mới…" : undefined}
                  className={`flex-1 text-xs ${laTieuDe ? "font-semibold" : ""}`}
              />

              {/**
                * ★★ NÚT [+] ĐÃ CÓ LẠI — Ban lãnh đạo 27/08/2026 (chiều): *"Thêm chức năng được
                * thêm dòng và dùng icon dấu +"*.
                *
                * 📌 SÁNG CÙNG NGÀY Ban lãnh đạo bảo bỏ nút này (*"Tính năng dấu + này bỏ luôn"*),
                * nay cần lại. Ghi cả hai mốc để người sau đọc lịch sử không tưởng là ai đó tự ý
                * thêm vào — đây là chỉ đạo mới đè chỉ đạo cũ trong cùng một ngày.
                *
                * 🔴 [+] KHÁC HẲN PHÍM ENTER, HAI VIỆC KHÁC NHAU CÙNG TỒN TẠI:
                *   · [+]   → thêm một MỤC MỚI (một gạch đầu dòng riêng, in thành dòng riêng)
                *   · Enter → xuống dòng BÊN TRONG mục đang gõ (không sinh mục mới)
                * Trước 27/08/2026 Enter bị hiểu thành "thêm mục" nên hai việc chồng nhau và không
                * ai làm được việc thứ hai — xem `NGAT_DONG_TRONG_MUC`.
                *
                * ⚠️ VẪN CÒN ĐƯỜNG VỀ khi lỡ xoá nhầm: nút **Khôi phục bản chuẩn** ở góc phải nhãn
                * khối lấy lại nguyên bản của mẫu đang chọn. Đừng bỏ nút đó.
                */}
              <span className="flex shrink-0 flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => themDongSau(iGoc)}
                  disabled={khoa}
                  title="Thêm một mục ngay dưới"
                  aria-label={`Thêm mục dưới mục ${soHien}`}
                  className="rounded-md p-1.5 text-text-desc transition-colors hover:bg-muted hover:text-primary disabled:opacity-40"
                >
                  <Plus className="size-3.5" aria-hidden />
                </button>
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
