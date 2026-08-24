"use client";

import { useState } from "react";
import { AlertTriangle, Download, Eye, Paperclip, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  CO_TOI_DA,
  KIEU_CHO_PHEP,
  catTep,
  coTep,
  type MoTaTep,
  taiTep,
} from "@/3-du-lieu/kho-tep";
import { formatMocThoiGian } from "@/6-tien-ich/dinh-dang";
import { HopXemTep } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xem-tep";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";

/**
 * Ô ĐÍNH KÈM MỘT TỆP — dùng chung cho mọi chỗ cần gắn chứng từ vào hồ sơ.
 *
 * 🔴 TÁCH RA DÙNG CHUNG NGAY TỪ ĐẦU. Đã có hai chỗ cần (phiếu giao nhận của thủ kho, bản báo
 * giá nhà cung cấp) và theo quy trình còn nhiều chỗ nữa: hợp đồng, đơn có chữ ký, hóa đơn.
 * Chép đi chép lại thì mỗi chỗ một kiểu báo lỗi, một cỡ tệp tối đa, rồi lệch nhau.
 *
 * ⚠️ NÓI THẬT VỀ CHỖ LƯU. Tệp nằm trong trình duyệt của chính máy này (`kho-tep.ts`), chưa
 * lên máy chủ. Máy khác mở lên thấy tên tệp nhưng bấm xem thì không có nội dung — component
 * này phải nói ra điều đó, không được để người dùng tưởng đã lưu lên hệ thống.
 */
export function ODinhKemTep({
  /** Tệp đã đính kèm, `undefined` là chưa có. */
  tep,
  /** Nhãn nút khi chưa có tệp, vd "Đính kèm phiếu giao nhận". */
  nhanThem,
  /** Người đang thao tác — ghi lại ai đính kèm. */
  nguoi,
  /**
   * Gọi sau khi cất tệp xong. Nơi gọi tự lo việc lưu vào hồ sơ.
   *
   * 🔴 TRẢ VỀ CÂU LỖI nếu nơi gọi KHÔNG lưu được (`null`/`undefined` là đã lưu). Trước 20/08/2026
   * kiểu là `void`, nên ô này báo *"Đã đính kèm"* **vô điều kiện**: hồ sơ đủ 5 tệp thì tầng ghi
   * từ chối, nhưng người dùng vẫn đọc thấy dòng thành công (nó hiện SAU dòng lỗi) rồi đóng trang
   * — hồ sơ thiếu chứng từ mà không ai biết, và kho còn một tệp mồ côi.
   */
  onXong,
  /** Bắt buộc phải có tệp — hiện viền cảnh báo khi còn trống. */
  batBuoc = false,
  /** Khóa không cho đổi (VD hồ sơ đã chốt). */
  khoa = false,
  /**
   * ★ BỎ TỆP KHỎI Ô NÀY — Ban lãnh đạo 20/08/2026: *"thêm chức năng đổi file + xoá file"*.
   * Không truyền thì KHÔNG hiện nút, vì có chỗ dùng ô này mà việc bỏ tệp không hợp lệ.
   *
   * 🔴 HỎI LẠI MỘT CÂU NGAY TRONG ĐÂY, không để mỗi nơi gọi tự làm một kiểu: nơi thì hỏi, nơi
   * thì bỏ thẳng, rồi người dùng không đoán được bấm vào sẽ ra gì. Một chỗ duy nhất.
   */
  onXoa,
  /** Nút thêm/xem ở góc trái — dùng khi cần chú thích thêm về tệp ngoài các nút chuẩn. */
  nhanPhu,
  /**
   * Ẩn dòng hướng dẫn định dạng / dung lượng khi chưa có tệp.
   *
   * 🔴 DÙNG KHI CÓ NHIỀU Ô CẠNH NHAU — Ban lãnh đạo 20/08/2026 (*"bố cục lại giao diện này chuyên
   * nghiệp hơn"*): khu báo giá có N ô, mỗi ô in lại đúng một câu *"Nhận PDF, ảnh, Word, Excel ·
   * tối đa 10MB…"* thì 2 ô là 2 lần, 5 ô là 5 lần — chiếm nửa chiều cao khối mà không nói thêm
   * gì. Nơi gọi bật cờ này rồi tự in câu đó MỘT LẦN cho cả khu.
   *
   * ⚠️ Mặc định `false` để mọi chỗ dùng một ô đơn lẻ vẫn có hướng dẫn như cũ.
   */
  anHuongDan = false,
}: {
  tep?: MoTaTep;
  nhanThem: string;
  nguoi: { uid: string; ten: string };
  onXong: (tep: MoTaTep) => string | null | void;
  batBuoc?: boolean;
  khoa?: boolean;
  onXoa?: () => void;
  nhanPhu?: React.ReactNode;
  anHuongDan?: boolean;
}) {
  const [dangCat, setDangCat] = useState(false);
  const [hoiXoa, setHoiXoa] = useState(false);

  async function chonTep(f: File) {
    setDangCat(true);
    try {
      const mt = await catTep(f, nguoi);
      /* 🔴 CHỜ NƠI GỌI XÁC NHẬN ĐÃ LƯU rồi mới báo thành công. Tệp cắt xong nghĩa là nội dung đã
         vào kho, KHÔNG có nghĩa là hồ sơ đã nhận — tầng ghi còn chặn hạn mức tệp và hồ sơ đã
         đóng. Báo "Đã đính kèm" trước khi biết kết quả là hứa hộ một việc chưa xảy ra. */
      const loi = onXong(mt);
      if (typeof loi === "string" && loi !== "") {
        toast.error("Không lưu được tệp vào hồ sơ", { description: loi });
        return;
      }
      toast.success("Đã đính kèm", { description: `${mt.tenTep} · ${coTep(mt.kichThuoc)}` });
    } catch (e) {
      // 🔴 PHẢI BÁO RA. Nuốt lỗi ở đây thì người dùng tưởng đã đính kèm xong trong khi
      // chẳng có gì được lưu — đúng cái bẫy mà chỗ tải báo giá cũ đã mắc.
      toast.error("Không đính kèm được", {
        description: e instanceof Error ? e.message : "Trình duyệt không cho lưu tệp.",
      });
    } finally {
      setDangCat(false);
    }
  }

  /**
   * ★ XEM TRONG POP-UP CĂN GIỮA MÀN HÌNH — Ban lãnh đạo 13/08/2026, thay cho mở tab mới.
   * Luật ở `HopXemTep`, dùng chung với mọi chỗ khác có chứng từ đính kèm.
   */
  const [moXem, setMoXem] = useState(false);

  /** Tải chứng từ về máy — xem `taiTep`, khác "xem" ở chỗ ép trình duyệt lưu file xuống. */
  async function tai() {
    if (!tep) return;
    const duoc = await taiTep(tep);
    if (!duoc) {
      toast.error("Không tải được tệp", {
        description: "Không lấy được nội dung từ máy chủ. Kiểm tra mạng rồi thử lại.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {tep ? (
        /* Bố cục HAI DÒNG, nút neo bên phải và KHÔNG bao giờ xuống hàng.
           🔴 Bản cũ để tất cả trên một hàng `flex-wrap`: gặp tên tệp dài (ảnh chụp từ điện
           thoại có tên cả trăm ký tự) là tên chiếm trọn hàng, đẩy nút "Xem" xuống dòng
           dưới, và `ml-auto` mất tác dụng — mỗi lần giao một kiểu cao thấp khác nhau. */
        <div className="flex items-center gap-2 rounded-lg border border-success bg-success-bg px-2.5 py-1.5">
          <Paperclip className="size-4 shrink-0 text-success-soft" aria-hidden />

          {/* `min-w-0` là bắt buộc để `truncate` bên trong hoạt động: mặc định ô flex
              không co nhỏ hơn nội dung, nên thiếu nó thì chữ vẫn tràn ra. */}
          <span className="flex min-w-0 flex-col">
            <span
              className="truncate text-sm font-medium text-text-primary"
              title={tep.tenTep}
            >
              {rutGonTenTep(tep.tenTep)}
            </span>
            <span className="truncate text-xs text-text-desc">
              {coTep(tep.kichThuoc)} · {tep.nguoiTaiTen} · {formatMocThoiGian(tep.thoiDiem)}
            </span>
          </span>

          <span className="ml-auto flex shrink-0 items-center gap-2">
            {/* Nút riêng của nơi gọi (vd "gán vào ô báo giá nào") — đứng TRƯỚC các nút chuẩn
                vì đó là việc chính người dùng cần làm với tệp chưa được gán. */}
            {nhanPhu}
            {/* ★ BỐN NÚT CHỈ CÒN ICON — Ban lãnh đạo 20/08/2026: *"giữ lại icon thôi bỏ chữ đi"*.
                Hàng nút trước đây dài (Xem · Tải về · Thay tệp · Bỏ tệp đều có chữ) nên đẩy tên
                tệp co lại, và không còn chỗ cho nút Duyệt.

                🔴 BỎ CHỮ HIỂN THỊ NHƯNG KHÔNG BỎ NHÃN: mỗi nút giữ `title` (rê chuột là hiện chữ)
                và `sr-only` cho trình đọc màn hình. Nút icon trơ không nhãn là người dùng phải
                đoán, và trình đọc màn hình chỉ đọc được "button".
                🔴 KÍCH THƯỚC THEO THIẾT BỊ (sửa 21/08/2026 — Ban lãnh đạo: *"giảm chiều cao lại
                cho gọn, này đang lớn quá. Giảm luôn icon để không bị tràn"*):
                  · **44×44 trên cảm ứng** (`size-11`) — Design System V1.1 đòi vùng chạm ≥44px,
                    và nút chỉ có icon thì vùng bấm chính là cả nút, không còn phần chữ để bấm
                    trượt vào.
                  · **36×36 từ `md` trở lên** (`md:size-9`) — trên máy tính bấm bằng chuột nên
                    không cần 44px, mà bốn nút × 44px thì hàng tệp bị tràn đúng như đã thấy.
                ⚠️ ĐỪNG hạ `size-11` ở cỡ nhỏ: làm vậy là phá quy tắc vùng chạm trên điện thoại,
                nơi người dùng bấm bằng ngón tay. */}
            <button
              type="button"
              onClick={() => setMoXem(true)}
              title="Xem tệp"
              className="inline-flex size-11 items-center justify-center rounded-lg border border-border bg-card text-text-secondary transition-colors hover:border-primary hover:text-primary md:size-9"
            >
              <Eye className="size-4 shrink-0" aria-hidden />
              <span className="sr-only">Xem tệp</span>
            </button>
            {/* ★ TẢI VỀ — Ban lãnh đạo 13/08/2026: *"thêm chức năng xem và tải chứng từ
                về"*. Xem chỉ đủ để kiểm tra trên màn hình; kế toán và người lưu hồ sơ cần
                bản tệp thật để in, gửi kèm email, nộp kiểm toán. */}
            <button
              type="button"
              onClick={tai}
              title="Tải tệp về máy"
              className="inline-flex size-11 items-center justify-center rounded-lg border border-border bg-card text-text-secondary transition-colors hover:border-primary hover:text-primary md:size-9"
            >
              <Download className="size-4 shrink-0" aria-hidden />
              <span className="sr-only">Tải tệp về máy</span>
            </button>
            {!khoa && (
              <label
                title="Thay bằng tệp khác"
                className="inline-flex size-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-text-secondary transition-colors hover:border-primary hover:text-primary md:size-9"
              >
                <input
                  type="file"
                  accept={KIEU_CHO_PHEP}
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void chonTep(f);
                  }}
                />
                <RefreshCw className="size-4 shrink-0" aria-hidden />
                <span className="sr-only">Thay bằng tệp khác</span>
              </label>
            )}
            {/* ★ BỎ TỆP — chỉ hiện khi nơi gọi cho phép. Tô màu nguy hiểm để không lẫn với
                "Thay tệp" ngay bên cạnh: hai nút cạnh nhau mà cùng màu thì bấm trượt là mất
                chứng từ.
                🔴 KHÔNG phụ thuộc `khoa`: `khoa` nghĩa là "không cho THAY nội dung tệp", còn bỏ
                tệp là quyền khác. Có chỗ cần khóa thay nhưng vẫn phải bỏ được — khối "tệp chưa
                gán vào ô nào" ở khu báo giá đúng là ca đó. Muốn chặn bỏ thì nơi gọi đừng truyền
                `onXoa`, đó mới là công tắc đúng. */}
            {onXoa && (
              <button
                type="button"
                onClick={() => setHoiXoa(true)}
                title="Bỏ tệp khỏi hồ sơ"
                className="inline-flex size-11 items-center justify-center rounded-lg border border-border bg-card text-text-secondary transition-colors hover:border-danger hover:text-danger md:size-9"
              >
                <Trash2 className="size-4 shrink-0" aria-hidden />
                <span className="sr-only">Bỏ tệp khỏi hồ sơ</span>
              </button>
            )}
          </span>

          {/* Pop-up xem chứng từ — căn giữa màn hình (Ban lãnh đạo 13/08/2026). */}
          <HopXemTep tep={tep} mo={moXem} onDong={() => setMoXem(false)} />

          {/* ⚠️ Nói rõ tệp KHÔNG mất khỏi kho — `goTepGiaiDoan` chỉ gỡ khỏi hồ sơ. Người dùng
              cần biết mức độ nghiêm trọng thật của việc mình đang làm, không phóng đại cũng
              không giảm nhẹ. */}
          <HopXacNhan
            mo={hoiXoa}
            tieuDe="Bỏ tệp này khỏi hồ sơ?"
            moTa={
              <>
                Tệp <strong>{rutGonTenTep(tep.tenTep)}</strong> sẽ không còn nằm trong bước này.
                Nội dung tệp vẫn giữ trong kho nên tìm lại được, nhưng hồ sơ thì mất chứng từ
                cho tới khi đính kèm lại.
              </>
            }
            nhanDongY="Bỏ tệp"
            nguyHiem
            onDong={() => setHoiXoa(false)}
            onDongY={() => {
              setHoiXoa(false);
              onXoa?.();
            }}
          />
        </div>
      ) : (
        <label
          className={`inline-flex w-fit min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors md:min-h-9 ${
            khoa || dangCat
              ? "pointer-events-none border-border opacity-60"
              : batBuoc
                ? "cursor-pointer border-warning bg-warning-bg text-warning-soft hover:bg-warning hover:text-white"
                : "cursor-pointer border-border hover:border-primary hover:bg-muted"
          }`}
        >
          <input
            type="file"
            accept={KIEU_CHO_PHEP}
            className="sr-only"
            disabled={khoa || dangCat}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void chonTep(f);
            }}
          />
          {batBuoc ? (
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
          ) : (
            <Paperclip className="size-4 shrink-0" aria-hidden />
          )}
          {dangCat ? "Đang lưu tệp…" : nhanThem}
        </label>
      )}

      {/* ⚠️ HAI CÂU KHÁC NHAU CHO HAI TRẠNG THÁI, cố ý không dùng chung một câu dài.
          Bản cũ luôn in cả đoạn hướng dẫn + cảnh báo, nên màn có 2–3 lần giao là đoạn đó
          lặp lại 2–3 lần, dài hơn cả nội dung chính. Nay:
            · Chưa có tệp → hướng dẫn định dạng và dung lượng (lúc này mới cần).
            · Đã có tệp  → chỉ còn MỘT câu cảnh báo ngắn về chỗ lưu.
          Vẫn giữ cảnh báo khi đã có tệp vì đó đúng là lúc người dùng dễ tưởng nhầm đã lưu
          lên hệ thống — xem chú thích đầu file. */}
      {/* 🔴 BỎ CÂU "máy khác chưa mở xem được" — từ 12/08/2026 tệp ĐÃ lên máy chủ nên máy
          khác mở được. Giữ câu cũ là nói sai về chính thứ app vừa làm được, và người dùng sẽ
          vẫn gửi tệp cho nhau qua Zalo dù không cần nữa. */}
      {!tep && !anHuongDan && (
        <p className="text-xs text-text-desc">
          Nhận PDF, ảnh, Word, Excel · tối đa {CO_TOI_DA / 1024 / 1024}MB. Tệp được lưu lên máy
          chủ nên người khác mở xem được.
        </p>
      )}
    </div>
  );
}

/**
 * Rút gọn tên tệp quá dài, GIỮ LẠI PHẦN ĐUÔI.
 *
 * 🔴 Không dùng mỗi `truncate` của CSS: nó cắt cụt đuôi, mà đuôi mới là thứ cho biết đây là
 * ảnh hay PDF — người duyệt hồ sơ cần biết đang mở loại tệp gì. Ảnh chụp từ điện thoại có
 * tên kiểu `1785921223805_1967909016357413267_..._cf8460c5.jpg`, cắt cụt là mất luôn `.jpg`.
 *
 * Vẫn giữ `truncate` ở lớp CSS làm lưới an toàn cho màn hình rất hẹp.
 * Tên đầy đủ nằm ở thuộc tính `title` — rê chuột là xem được.
 */
export function rutGonTenTep(ten: string | undefined, toiDa = 48): string {
  /**
   * 🔴 CHỊU ĐƯỢC TÊN TRỐNG — thêm 24/08/2026 sau khi làm sập cả trang chi tiết đề nghị.
   *
   * Một bản ghi tệp thiếu `tenTep` (dữ liệu từ máy khác, từ bản app cũ, hay tay ai đó sửa kho
   * chung) làm hàm này ném `Cannot read properties of undefined (reading 'length')`, và vì nó
   * chạy trong lúc React vẽ nên **cả trang trắng** — người dùng chỉ thấy *"Application error"*,
   * không đọc được hồ sơ nào nữa.
   *
   * ⚠️ Cả phòng dùng chung MỘT tài liệu Firestore, nên một bản ghi lỗi của một người là mọi
   * người mất trang. Cái giá của một dòng phòng vệ ở đây rẻ hơn nhiều so với hậu quả đó.
   *
   * 📌 Trả "(không có tên tệp)" chứ không trả chuỗi rỗng: chuỗi rỗng thì ô đính kèm hiện một
   * dòng trắng, người dùng tưởng app lỗi vẽ. Nói thẳng là thiếu tên thì họ biết đi sửa.
   */
  if (!ten) return "(không có tên tệp)";
  if (ten.length <= toiDa) return ten;
  const cham = ten.lastIndexOf(".");
  // Không có đuôi, hoặc "đuôi" dài bất thường (không phải phần mở rộng thật) → cắt bình thường.
  if (cham <= 0 || ten.length - cham > 8) return `${ten.slice(0, toiDa - 1)}…`;
  const duoi = ten.slice(cham);
  const dau = ten.slice(0, Math.max(1, toiDa - duoi.length - 1));
  return `${dau}…${duoi}`;
}
