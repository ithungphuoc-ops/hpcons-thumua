"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

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
 */

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
  onLuu,
}: {
  deNghi: DeNghiMuaHang;
  /** Đủ quyền và hồ sơ chưa đóng. Không đủ thì chỉ hiện con số. */
  duocSua: boolean;
  onLuu: (so: number) => void;
}) {
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
        title={`Mỗi dòng một số (${tongHop.soDong} dòng đã giao việc). Sửa ở bảng Phân bổ công việc — sửa ở đây sẽ ghi đè số của mọi dòng.`}
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

  const giamDuoc = so !== undefined && so > 1;
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
      <button
        type="button"
        onClick={() => setSo((v) => (v !== undefined && v > 1 ? v - 1 : v))}
        disabled={!giamDuoc}
        className="flex size-11 items-center justify-center rounded-md text-text-desc transition-colors hover:bg-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Bớt một báo giá"
        title={giamDuoc ? "Bớt một báo giá" : "Ít nhất phải lấy 1 báo giá"}
      >
        <Minus className="size-3.5" aria-hidden />
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
