"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

/**
 * Ô SỬA "SL BÁO GIÁ" ngay trong phần ĐẦU VÀO của bước ② — Ban lãnh đạo 17/08/2026:
 * *"phần đầu vào thêm chức năng sửa số lượng báo giá"*.
 *
 * Trước đó con số này chỉ đặt được MỘT LẦN, lúc trưởng bộ phận kéo phiếu sang bước ② (hộp
 * chuyển giai đoạn). Đặt xong không sửa được nữa — mà thực tế hay phải đổi: thị trường chỉ
 * còn hai nhà cung cấp bán mặt hàng đó, hoặc ngược lại hàng lớn cần hỏi thêm bên thứ tư.
 *
 * ---
 * 🔴 NÚT − / + HIỆN SẴN, KHÔNG CÒN BÚT SỬA — Ban lãnh đạo 18/08/2026: *"hiện nút tăng giảm
 * luôn, bỏ icon bút đi"*.
 *
 * Bản trước phải bấm bút → hiện ô nhập → gõ → bấm Lưu: bốn thao tác cho một con số chỉ chạy
 * từ 1 đến 20, và hai thao tác đầu chẳng làm gì ngoài việc mở đường.
 */

/** Chặn trên cho số báo giá. Không phải luật công ty, chỉ là ngưỡng bắt lỗi gõ nhầm. */
const SO_BAO_GIA_TOI_DA = 20;

/**
 * Chờ bao lâu sau cú bấm cuối mới ghi vào hồ sơ.
 *
 * 🔴 VÌ SAO PHẢI CHỜ: `datSoBaoGiaChoPhieu` ghi một dòng nhật ký mỗi lần gọi. Bấm + năm lần
 * để đi từ 1 lên 6 mà ghi ngay thì hồ sơ có năm dòng "Yêu cầu lấy N báo giá" liên tiếp — đúng
 * kiểu làm loãng khối Lịch sử mà Ban lãnh đạo đã bắt lỗi ở ô tích công việc (sáu dòng trong
 * một phút). Gom lại: bấm bao nhiêu lần cũng chỉ ghi MỘT dòng, với con số cuối cùng.
 */
const CHO_TRUOC_KHI_GHI = 800;

export function OSuaSoBaoGia({
  soHienTai,
  duocSua,
  onLuu,
}: {
  /** Số báo giá đang yêu cầu. `undefined` = chưa ai đặt. */
  soHienTai?: number;
  /** Đủ quyền và hồ sơ chưa đóng. Không đủ thì chỉ hiện con số. */
  duocSua: boolean;
  onLuu: (so: number) => void;
}) {
  /**
   * Con số đang hiện trên màn — đổi NGAY khi bấm, không chờ ghi xong.
   *
   * Không làm vậy thì nút bấm có cảm giác trễ 0,8 giây và người dùng bấm thêm mấy lần nữa.
   */
  const [so, setSo] = useState<number | undefined>(soHienTai);

  /** Giá trị đã ghi vào hồ sơ — để biết còn gì cần ghi hay không. */
  const daGhi = useRef(soHienTai);

  /**
   * Người khác sửa con số này (kho dữ liệu dùng chung cả phòng) thì màn phải theo.
   *
   * ⚠️ Chỉ đồng bộ khi giá trị máy chủ KHÁC cái mình vừa ghi — nếu không, mỗi lần dữ liệu
   * quay về sẽ đè lên con số người dùng đang bấm dở.
   */
  useEffect(() => {
    if (soHienTai !== daGhi.current) {
      daGhi.current = soHienTai;
      setSo(soHienTai);
    }
  }, [soHienTai]);

  /**
   * 🔴 GIỮ `onLuu` QUA REF, KHÔNG ĐỂ NÓ TRONG DANH SÁCH PHỤ THUỘC.
   *
   * Trang cha truyền vào một hàm viết thẳng tại chỗ, nên mỗi lần trang vẽ lại là một hàm mới.
   * Để nó trong `deps` thì hẹn giờ bị hủy và đặt lại sau mỗi lần vẽ — mà trang này vẽ lại mỗi
   * khi kho dữ liệu chung có tin mới, tức con số có thể KHÔNG BAO GIỜ được ghi. Người dùng
   * bấm xong thấy số đổi trên màn, đóng trang, và hồ sơ vẫn giữ số cũ.
   */
  const luuRef = useRef(onLuu);
  useEffect(() => {
    luuRef.current = onLuu;
  }, [onLuu]);

  // Gom nhiều cú bấm thành một lần ghi — xem `CHO_TRUOC_KHI_GHI`.
  useEffect(() => {
    if (so === undefined || so === daGhi.current) return;
    const hen = setTimeout(() => {
      daGhi.current = so;
      luuRef.current(so);
    }, CHO_TRUOC_KHI_GHI);
    return () => clearTimeout(hen);
  }, [so]);

  if (!duocSua) {
    return <span className="text-sm font-medium text-text-primary">{so ?? "—"}</span>;
  }

  /**
   * 🔴 SÀN LÀ 1, KHÔNG PHẢI 0. "Lấy 0 báo giá" nghĩa là mua không so giá — việc đó phải là
   * một quyết định có người chịu trách nhiệm, không phải hệ quả của việc bấm nút trừ thêm
   * một cái.
   */
  const giamDuoc = so !== undefined && so > 1;
  const tangDuoc = (so ?? 0) < SO_BAO_GIA_TOI_DA;

  return (
    <span className="flex w-fit items-center gap-1 rounded-lg border border-border bg-card p-0.5">
      {/* Vùng chạm 44×44 theo Design System V1.1 — nút nhỏ hơn thì trên máy tính bảng bấm trượt. */}
      <button
        type="button"
        onClick={() => setSo((v) => (v !== undefined && v > 1 ? v - 1 : v))}
        disabled={!giamDuoc}
        className="flex size-11 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Bớt một báo giá"
        title={giamDuoc ? "Bớt một báo giá" : "Ít nhất phải lấy 1 báo giá"}
      >
        <Minus className="size-4" aria-hidden />
      </button>

      {/* `tabular-nums` + bề rộng cố định: con số không nhảy ngang khi đổi từ 9 sang 10.
          `aria-live` để trình đọc màn hình đọc lên con số mới sau mỗi lần bấm. */}
      <span
        className="min-w-8 text-center text-sm font-semibold text-text-primary tabular-nums"
        aria-live="polite"
      >
        {so ?? "—"}
      </span>

      <button
        type="button"
        onClick={() => setSo((v) => (v === undefined ? 1 : Math.min(v + 1, SO_BAO_GIA_TOI_DA)))}
        disabled={!tangDuoc}
        className="flex size-11 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Thêm một báo giá"
        title={tangDuoc ? "Thêm một báo giá" : `Tối đa ${SO_BAO_GIA_TOI_DA} báo giá`}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </span>
  );
}
