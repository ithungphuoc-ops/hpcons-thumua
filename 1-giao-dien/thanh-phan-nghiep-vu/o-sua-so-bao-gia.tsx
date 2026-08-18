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

  /* Chưa giao việc thì chưa có số nào để nói — và cũng không cho đặt ở đây, vì con số này
     thuộc về lúc giao việc. Nói rõ chỗ phải làm thay vì để một ô trống vô nghĩa. */
  if (tongHop.loai === "chuaGiao") {
    return (
      <span className="text-sm text-text-desc italic">
        Chưa giao việc — đặt số báo giá khi phân bổ ở bước ①
      </span>
    );
  }

  /* Mỗi dòng một số: CHỈ ĐỌC. Xem lý do ở khối chú thích đầu file (bấm ± là ghi đè hết). */
  if (tongHop.loai === "khacNhau") {
    return (
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm font-semibold text-text-primary tabular-nums">
          {tongHop.nhoNhat}–{tongHop.lonNhat}
        </span>
        <span className="text-xs text-text-desc italic">
          mỗi dòng một số ({tongHop.soDong} dòng) — sửa ở bảng Phân bổ công việc
        </span>
      </span>
    );
  }

  if (!duocSua) {
    return (
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm font-semibold text-text-primary tabular-nums">{so ?? "—"}</span>
        <span className="text-xs text-text-desc italic">theo phân bổ ở bước ①</span>
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

      {/* `tabular-nums` + bề rộng cố định: con số không nhảy ngang khi đổi từ 9 sang 10. */}
      <span
        className="min-w-6 text-center text-sm font-semibold text-text-primary tabular-nums"
        aria-live="polite"
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

      {/* Nói rõ con số đến từ đâu — chỉ đạo 18/08/2026. Không nói thì người đọc tưởng đây là ô
          nhập tự do, sửa xong không biết mình vừa đè lên yêu cầu của trưởng bộ phận. */}
      <span className="ml-1 text-xs text-text-desc italic">
        theo phân bổ ở bước ① ({tongHop.soDong} dòng)
      </span>
    </span>
  );
}
