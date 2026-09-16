"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, Minus, Plus } from "lucide-react";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";

/**
 * Ô "SL BÁO GIÁ" trong phần ĐẦU VÀO của bước ②.
 *
 * ---
 * 🔴 SỐ NÀY LINK TỪ BƯỚC GIAO VIỆC — Ban lãnh đạo 18/08/2026: *"số liệu báo giá này phải tự
 * động link từ bước giao việc cho nhân viên"*.
 *
 * Nguồn thật: khi trưởng bộ phận phân bổ dòng vật tư cho nhân viên (bước ①), hộp xác nhận có
 * ô *"yêu cầu số lượng báo giá"* — số đó ghi vào `items[].soBaoGiaYeuCau` của **từng dòng
 * được giao**, kèm một dòng nhật ký. Đó là chỗ con số sinh ra.
 *
 * 🔴 HAI LỖI CỦA BẢN TRƯỚC, chính là lý do phải viết lại:
 *
 * 1. **Đọc sai**: bản trước lấy `items.find(d => d.soBaoGiaYeuCau)` — tức DÒNG ĐẦU TIÊN có số.
 *    Trưởng bộ phận giao dòng 1 lấy 2 báo giá, dòng 3 lấy 4 báo giá thì ô này chỉ hiện "2",
 *    người đọc tưởng cả phiếu chỉ cần 2.
 *
 * 2. **Ghi đè mất dữ liệu**: `datSoBaoGiaChoPhieu` đặt số cho MỌI dòng. Bấm nút + ở đây là
 *    XÓA SẠCH số riêng của từng dòng mà trưởng bộ phận vừa giao — mà không có gì báo, và
 *    không hoàn lại được. Nay chỉ cho bấm khi mọi dòng đang CÙNG một số; các dòng khác nhau
 *    thì ô này chỉ đọc và chỉ đường sang bảng Phân bổ — nơi con số thuộc về.
 *
 * ---
 * # 🔴 NHÂN VIÊN CHỈ ĐƯỢC TĂNG, KHÔNG ĐƯỢC HẠ (13/09/2026)
 *
 * Ban lãnh đạo 13/09/2026, chữ viết tay trên ảnh: *"ở tài khoản nhân viên — 1. Chỉ được tăng số
 * lượng báo giá, ko được bấm giảm số lượng"*.
 *
 * **VÌ SAO.** Con số này không phải tùy chọn của người đang thao tác — nó là **yêu cầu trưởng bộ
 * phận giao cho nhân viên** lúc phân bổ ở bước ① (*"đi lấy đủ 3 báo giá rồi hãy trình"*). Cho
 * nhân viên tự hạ xuống là để người thi hành tự nới cái luật đang chấm chính mình: hồ sơ trở nên
 * "đủ điều kiện trình xét duyệt" trong khi thực tế chỉ có một nhà cung cấp chào giá, và nhật ký
 * chỉ ghi *"đã đổi thành 1 báo giá"* chứ không hề nói rằng một chốt kiểm soát vừa bị gỡ. Người
 * duyệt sau đó không có cách nào nhìn ra.
 *
 * ⚠️ **KHÓA ĐÚNG MỘT CHIỀU — chiều TĂNG phải để nguyên.** Số ô đính kèm báo giá chạy theo chính
 * con số này (`khu-bao-gia-theo-so-luong.tsx`), nên khóa cả hai chiều là nhân viên **không mở
 * thêm được ô** khi có nhiều nhà cung cấp cùng chào giá — chặn đúng việc cần làm. Lấy được nhiều
 * báo giá hơn yêu cầu là việc tốt, không có gì phải chặn.
 *
 * 📌 **CÁI GIÁ, chấp nhận có chủ đích:** nhân viên bấm nhầm lên 9 thì **tự sửa lại không được**,
 * phải nhờ trưởng bộ phận (hoặc quản trị) hạ giúp. Đây đúng là điều chỉ đạo yêu cầu, không phải
 * sơ suất — đừng "chữa" bằng cách mở lại nút trừ khi số vừa tăng trong phiên này.
 *
 * ⚠️ `chiTangDuoc` **không bắt buộc, và khi không truyền thì ô này TỰ TRA QUYỀN** từ
 * `useNguoiDung()`. Cố ý như vậy: nếu để mặc định là "cho hạ như cũ" thì chốt chặn chỉ có hiệu
 * lực sau khi có người nhớ truyền prop ở nơi gọi (`de-nghi-chi-tiet.tsx`) — tức chỉ đạo trên
 * **chưa được thi hành mà không có một dấu hiệu nào báo**, đúng kiểu hỏng im lặng mà dự án này
 * đã dính nhiều lần. Nơi gọi vẫn truyền prop tường minh được, và prop sẽ được ưu tiên.
 */

/**
 * Lý do khóa nút trừ — dùng cho cả `title` (rê chuột) lẫn `aria-label` (trình đọc màn hình).
 *
 * 🔴 PHẢI NÓI RA AI MỞ ĐƯỢC, không chỉ nói "không được phép". Nhân viên gặp nút xám mà không
 * biết đi hỏi ai thì sẽ đi hỏi vòng quanh, hoặc tệ hơn là tưởng app lỗi.
 */
const LY_DO_KHOA_HA =
  "Chỉ trưởng bộ phận (hoặc quản trị) mới hạ được số báo giá. " +
  "Tài khoản nhân viên chỉ được tăng.";

/** Chặn trên cho số báo giá. Không phải luật công ty, chỉ là ngưỡng bắt lỗi gõ nhầm. */
const SO_BAO_GIA_TOI_DA = 20;

/**
 * Chờ bao lâu sau cú bấm cuối mới ghi vào hồ sơ.
 *
 * 🔴 `datSoBaoGiaChoPhieu` ghi một dòng nhật ký mỗi lần gọi. Bấm + năm lần mà ghi ngay thì hồ
 * sơ có năm dòng liên tiếp — đúng kiểu làm loãng khối Lịch sử mà Ban lãnh đạo đã bắt lỗi ở ô
 * tích công việc (sáu dòng trong một phút 19:29).
 */
const CHO_TRUOC_KHI_GHI = 800;

/**
 * Tổng hợp số báo giá từ CÁC DÒNG ĐÃ GIAO VIỆC.
 *
 * Trả về:
 * · `chuaGiao`  — chưa dòng nào được giao kèm số báo giá
 * · `chung`     — mọi dòng đã giao cùng một số → sửa được
 * · `khacNhau`  — mỗi dòng một số → CHỈ ĐỌC, vì sửa là ghi đè hết
 */
export function tongHopSoBaoGia(deNghi: DeNghiMuaHang):
  | { loai: "chuaGiao" }
  | { loai: "chung"; so: number; soDong: number }
  | { loai: "khacNhau"; nhoNhat: number; lonNhat: number; soDong: number } {
  const so = deNghi.items
    .map((d) => d.soBaoGiaYeuCau)
    .filter((x): x is number => typeof x === "number" && x > 0);
  if (so.length === 0) return { loai: "chuaGiao" };
  const nhoNhat = Math.min(...so);
  const lonNhat = Math.max(...so);
  return nhoNhat === lonNhat
    ? { loai: "chung", so: nhoNhat, soDong: so.length }
    : { loai: "khacNhau", nhoNhat, lonNhat, soDong: so.length };
}

export function OSuaSoBaoGia({
  deNghi,
  duocSua,
  chiTangDuoc,
  onLuu,
}: {
  deNghi: DeNghiMuaHang;
  /** Đủ quyền và hồ sơ chưa đóng. Không đủ thì chỉ hiện con số. */
  duocSua: boolean;
  /**
   * Chỉ cho TĂNG — khóa nút "−". **Bỏ trống thì tự tra quyền `phanBoCongViec`** (xem khối chú
   * thích *"nhân viên chỉ được tăng"* ở đầu file, và lý do vì sao mặc định không phải là "cho hạ").
   */
  chiTangDuoc?: boolean;
  onLuu: (so: number) => void;
}) {
  /**
   * 🔴 TRA QUYỀN NGAY TẠI ĐÂY khi nơi gọi không nói gì.
   *
   * `phanBoCongViec` = trưởng bộ phận thu mua cấp ≥3 và quản trị — đúng những người ĐẶT ra con số
   * này lúc phân bổ công việc, nên cũng là những người được hạ nó xuống. Nhân viên thu mua chỉ có
   * `lapPO`, không có cờ này.
   *
   * ⚠️ `useNguoiDung()` NÉM LỖI nếu nằm ngoài `<CurrentUserProvider>`. Ô này chỉ được dựng trong
   * `de-nghi-chi-tiet.tsx` — trang đó tự nó đã gọi `useNguoiDung()` nên provider chắc chắn có.
   * Nếu sau này đem ô này ra dùng ở chỗ khác (trang in A4 chẳng hạn) thì phải truyền `chiTangDuoc`
   * tường minh, đừng để nó tự tra.
   */
  const { quyen } = useNguoiDung();
  const chiTang = chiTangDuoc ?? !quyen.phanBoCongViec;

  const tongHop = tongHopSoBaoGia(deNghi);
  /** Số đang áp cho cả phiếu — chỉ có khi mọi dòng cùng một số. */
  const soChung = tongHop.loai === "chung" ? tongHop.so : undefined;

  /** Con số đang hiện — đổi NGAY khi bấm, không chờ ghi xong (nếu chờ thì nút có cảm giác trễ). */
  const [so, setSo] = useState<number | undefined>(soChung);
  /** Giá trị đã ghi vào hồ sơ — để biết còn gì cần ghi hay không. */
  const daGhi = useRef(soChung);

  /**
   * Người khác sửa (kho dữ liệu dùng chung cả phòng) thì màn phải theo.
   * ⚠️ Chỉ đồng bộ khi giá trị máy chủ KHÁC cái mình vừa ghi — nếu không, mỗi lần dữ liệu quay
   * về sẽ đè lên con số người dùng đang bấm dở.
   */
  useEffect(() => {
    if (soChung !== daGhi.current) {
      daGhi.current = soChung;
      setSo(soChung);
    }
  }, [soChung]);

  /**
   * 🔴 GIỮ `onLuu` QUA REF, KHÔNG để nó trong danh sách phụ thuộc.
   * Trang cha truyền hàm viết thẳng tại chỗ nên mỗi lần vẽ lại là một hàm mới; để trong `deps`
   * thì hẹn giờ bị đặt lại sau mỗi lần vẽ, mà trang này vẽ lại mỗi khi kho dữ liệu chung có tin
   * mới — tức con số có thể KHÔNG BAO GIỜ được ghi.
   */
  const luuRef = useRef(onLuu);
  useEffect(() => {
    luuRef.current = onLuu;
  }, [onLuu]);

  useEffect(() => {
    if (so === undefined || so === daGhi.current) return;
    const hen = setTimeout(() => {
      daGhi.current = so;
      luuRef.current(so);
    }, CHO_TRUOC_KHI_GHI);
    return () => clearTimeout(hen);
  }, [so]);

  /**
   * 🔴 KHÔNG IN CÂU GIẢI THÍCH RA MÀN — Ban lãnh đạo 18/08/2026: *"bỏ ghi chú kiểu này đi và
   * điều chỉnh lại font chữ, cỡ chữ đồng nhất"*, cùng tinh thần chỉ đạo 16/08/2026: *"đây là
   * ứng dụng chuyên nghiệp nên không cần các cảnh báo kiểu này"*.
   *
   * 📌 Giải thích chuyển hết vào `title` (rê chuột là thấy): màn gọn mà thông tin không mất.
   * Bỏ hẳn thì người mở phiếu không hiểu vì sao ô trống, hoặc vì sao "2–4" không sửa được.
   *
   * 🔴 CỠ CHỮ DÙNG ĐÚNG `text-sm font-medium text-text-primary` — y hệt mọi giá trị trường
   * khác trong khối ĐẦU VÀO (xem `khoi-dau-vao-theo-giai-doan.tsx`). Bản trước để
   * `font-semibold` nên riêng ô này đậm hơn các trường bên cạnh, đúng lỗi "cỡ chữ không đồng
   * đều" Ban lãnh đạo đã bắt hai lần.
   */
  const LOP_GIA_TRI = "text-sm font-medium text-text-primary tabular-nums";

  if (tongHop.loai === "chuaGiao") {
    return (
      <span
        className={LOP_GIA_TRI}
        title="Chưa giao việc. Số báo giá được đặt khi phân bổ công việc ở bước ① Tiếp nhận và kiểm tra."
      >
        —
      </span>
    );
  }

  /* Mỗi dòng một số: CHỈ ĐỌC. Xem lý do ở khối chú thích đầu file (bấm ± là ghi đè hết). */
  if (tongHop.loai === "khacNhau") {
    return (
      <span
        className={LOP_GIA_TRI}
        title={`Mỗi dòng một số (${tongHop.soDong} dòng đã giao việc).`}
      >
        {tongHop.nhoNhat}–{tongHop.lonNhat}
      </span>
    );
  }

  if (!duocSua) {
    return (
      <span
        className={LOP_GIA_TRI}
        title={`Theo phân bổ công việc ở bước ① (${tongHop.soDong} dòng).`}
      >
        {so ?? "—"}
      </span>
    );
  }

  /**
   * Khóa vì QUYỀN — khác hẳn "đang ở mức 1 nên không trừ được nữa". Hai lý do khác nhau thì phải
   * nói ra hai câu khác nhau: bị chặn vì mức sàn thì lát nữa tăng lên là trừ lại được, còn bị
   * chặn vì quyền thì bấm bao nhiêu lần cũng vậy, người dùng cần biết ngay để đi nhờ đúng người.
   */
  const khoaHaVaiTro = chiTang;
  const giamDuoc = !khoaHaVaiTro && so !== undefined && so > 1;
  const tangDuoc = (so ?? 0) < SO_BAO_GIA_TOI_DA;

  /**
   * 🔴 GỌN LẠI — Ban lãnh đạo 18/08/2026: *"điều chỉnh nhìn gọn gàng và chuyên nghiệp hơn"*.
   *
   * Bản trước bọc cả cụm trong một hộp có viền + nền, ba ô 44px xếp ngang: khối cao 48px, đè
   * lên nhãn "SL Báo giá" ngay trên nó (thấy rõ trong ảnh Ban lãnh đạo gửi).
   *
   * Nay: bỏ hộp viền, hai nút trong suốt chỉ hiện viền khi rê chuột, và `-my-1.5` kéo lại phần
   * cao vượt ra.
   * 📌 VÙNG CHẠM VẪN 44×44 (`size-11`) theo Design System V1.1 — chỉ giảm phần NHÌN THẤY, không
   * giảm phần bấm được. Thu nút xuống 32px cho "gọn" là bấm trượt trên máy tính bảng.
   */
  return (
    <span className="-my-1.5 flex w-fit items-center gap-0.5">
      {/* 🔴 NÚT TRỪ — khóa cứng với tài khoản nhân viên (chỉ đạo 13/09/2026, xem đầu file).
          ĐỔI HẲN BIỂU TƯỢNG SANG Ổ KHÓA, không chỉ làm mờ nút trừ: Design System V1.1 đòi trạng
          thái phải đọc ra được bằng cả hình lẫn chữ, chứ không chỉ bằng độ mờ — mà nút này vốn
          ĐÃ có một trạng thái mờ khác (đang ở mức 1). Hai thứ mờ giống hệt nhau thì người dùng
          không phân biệt được "hết trừ được" với "không có quyền trừ", và sẽ ngồi đợi số tăng
          lên để trừ lại — việc không bao giờ xảy ra.
          📌 Lý do đầy đủ nằm ở `title` + `aria-label`, KHÔNG in thành câu trên màn: ô này nằm
          trong lưới trường "ĐẦU VÀO" một dòng, và Ban lãnh đạo 18/08/2026 đã yêu cầu bỏ chú
          thích in kèm ở đúng chỗ này (*"bỏ ghi chú kiểu này đi"*). Câu giải thích đầy đủ có mặt
          ở hộp "Chỉnh sửa các trường dữ liệu tùy chỉnh", nơi có chỗ cho chữ. */}
      <button
        type="button"
        onClick={() => setSo((v) => (v !== undefined && v > 1 ? v - 1 : v))}
        disabled={!giamDuoc}
        className={
          khoaHaVaiTro
            ? /* Khóa vì quyền: KHÔNG dùng `opacity-40` — ổ khóa mờ tịt thì nhìn không ra là ổ
                 khóa, mất luôn thứ duy nhất phân biệt nó với nút trừ đang hết lượt. */
              "flex size-11 cursor-not-allowed items-center justify-center rounded-md text-text-desc"
            : "flex size-11 items-center justify-center rounded-md text-text-desc transition-colors hover:bg-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        }
        aria-label={khoaHaVaiTro ? LY_DO_KHOA_HA : "Bớt một báo giá"}
        title={
          khoaHaVaiTro
            ? LY_DO_KHOA_HA
            : giamDuoc
              ? "Bớt một báo giá"
              : "Ít nhất phải lấy 1 báo giá"
        }
      >
        {khoaHaVaiTro ? (
          <Lock className="size-3.5" aria-hidden />
        ) : (
          <Minus className="size-3.5" aria-hidden />
        )}
      </button>

      {/* `tabular-nums` + bề rộng cố định: con số không nhảy ngang khi đổi từ 9 sang 10.
          Cỡ chữ dùng đúng `LOP_GIA_TRI` — bằng mọi giá trị trường khác trong khối ĐẦU VÀO. */}
      <span
        className={`min-w-6 text-center ${LOP_GIA_TRI}`}
        aria-live="polite"
        title={`Theo phân bổ công việc ở bước ① (${tongHop.soDong} dòng). Sửa ở đây áp cho mọi dòng của phiếu.`}
      >
        {so ?? "—"}
      </span>

      <button
        type="button"
        onClick={() => setSo((v) => (v === undefined ? 1 : Math.min(v + 1, SO_BAO_GIA_TOI_DA)))}
        disabled={!tangDuoc}
        className="flex size-11 items-center justify-center rounded-md text-text-desc transition-colors hover:bg-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Thêm một báo giá"
        title={tangDuoc ? "Thêm một báo giá" : `Tối đa ${SO_BAO_GIA_TOI_DA} báo giá`}
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </span>
  );
}
