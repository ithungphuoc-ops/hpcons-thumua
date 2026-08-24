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

  function themDongSau(i: number) {
    const moi = [...cacDong];
    moi.splice(i + 1, 0, "");
    ghi(moi);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={`${id}-0`}>{nhan}</Label>
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
        {cacDong.map((dong, i) => {
          const laTieuDe = dong.trim().endsWith(":");
          const laDongTrong = dong.trim() === "";
          return (
            <div key={i} className="flex items-start gap-1.5">
              {/* Số thứ tự để nói chuyện được với nhau ("mục 5 sửa lại") — dòng trống thì không
                  đánh số, nó chỉ là khoảng cách trên tờ in. */}
              <span className="w-6 shrink-0 pt-2.5 text-right text-xs tabular-nums text-text-desc">
                {laDongTrong ? "" : i + 1}
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
                  id={`${id}-${i}`}
                  rows={soDongCanCho(dong)}
                  value={dong}
                  disabled={khoa}
                  onChange={(e) => suaDong(i, e.target.value)}
                  aria-label={`${nhan} — mục ${i + 1}`}
                  className={`flex-1 text-xs ${laTieuDe ? "font-semibold" : ""}`}
                />
              )}

              {/* Hai nút thao tác của TỪNG mục — xếp dọc để không kéo hàng rộng thêm. */}
              <span className="flex shrink-0 flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => themDongSau(i)}
                  disabled={khoa}
                  title="Thêm một mục ngay dưới"
                  aria-label={`Thêm mục dưới mục ${i + 1}`}
                  className="rounded-md p-1.5 text-text-desc transition-colors hover:bg-muted hover:text-primary disabled:opacity-40"
                >
                  <Plus className="size-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => xoaDong(i)}
                  disabled={khoa}
                  title="Xoá mục này"
                  aria-label={`Xoá mục ${i + 1}`}
                  className="rounded-md p-1.5 text-text-desc transition-colors hover:bg-danger-bg hover:text-danger disabled:opacity-40"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </span>
            </div>
          );
        })}
      </div>

      {/* Xoá hết mục thì không còn ô nào để bấm "+" — phải có đường quay lại, nếu không khối
          chết hẳn và người lập chỉ còn cách tải lại trang. */}
      {cacDong.length === 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => ghi([""])}
          disabled={khoa}
          className="w-fit"
        >
          <Plus className="size-4" aria-hidden />
          Thêm mục đầu tiên
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
