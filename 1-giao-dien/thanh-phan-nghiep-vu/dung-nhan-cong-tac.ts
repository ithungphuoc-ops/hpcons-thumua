"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { lyDoKhongNhanCongTac } from "@/4-phan-quyen/quyen-theo-ho-so";
import { vuongMacSangBuocSau } from "@/2-quy-trinh/giai-doan-mua-hang";
import type { ThongBaoChuyenBuoc } from "@/3-du-lieu/kieu-du-lieu";

/**
 * NHẬN CÔNG TÁC — toàn bộ luật và hệ quả, gom vào MỘT chỗ.
 *
 * 🔴 VÌ SAO TÁCH RA HOOK: có BA nơi bấm nhận công tác — chuông thông báo, thẻ trên bảng quy
 * trình, và trang chi tiết đề nghị (thêm 11/08/2026 theo chỉ đạo Ban lãnh đạo *"chưa có nút
 * nhận công việc"*). Ba chỗ chép cùng một đoạn thì sửa một chỗ là hai chỗ kia lệch — mà đoạn
 * này quyết định hai việc nặng: **ai được nhận** và **có tự chuyển bước hay không**.
 *
 * Luồng đầy đủ khi bấm đồng ý:
 *   1. Kiểm quyền nhận (`lyDoKhongNhanCongTac`) — lớp chặn thứ hai, dù nút đã bị ẩn
 *   2. Ghi người tiếp nhận vào thông báo + nhật ký đề nghị
 *   3. Nếu đang ở bước ① và bước ① đã xong → lập bảng báo giá, tức tự sang bước ②
 *      (giai đoạn suy ra từ chứng từ nên phải tạo chứng từ thật, không gán nhãn chay)
 */
export function useNhanCongTac() {
  const router = useRouter();
  const { deNghi, baoGia, thongBao, nhanCongTac, taoBaoGiaGiaLap } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  /** Thông báo đang chờ người dùng xác nhận. `null` = hộp đóng. */
  const [hoiNhan, doiHoiNhan] = useState<ThongBaoChuyenBuoc | null>(null);

  /** Lý do KHÔNG được nhận việc này; `null` nghĩa là được nhận. */
  function lyDoKhongNhan(tb: ThongBaoChuyenBuoc): string | null {
    const dn = deNghi.find((d) => d.id === tb.prId);
    if (!dn) return "Không tìm thấy đề nghị của thông báo này.";
    return lyDoKhongNhanCongTac(dn, tb.denBuoc, nguoiDung.uid, quyen);
  }

  /**
   * Thông báo đang CHỜ NHẬN của một đề nghị — dùng để biết có hiện nút hay không.
   *
   * Lấy thông báo mới nhất của đề nghị đó mà **chưa ai tiếp nhận**. Thông báo đã có người
   * nhận thì không cần nút nữa; thẻ và trang chi tiết hiện "Đã nhận: [tên]".
   */
  function thongBaoChoNhan(prId: string): ThongBaoChuyenBuoc | undefined {
    return thongBao.find((t) => t.prId === prId && !t.tiepNhan);
  }

  /** Có nên hiện nút "Nhận công tác" cho đề nghị này không. */
  function coTheNhan(prId: string): boolean {
    if (!quyen.lapPO) return false;
    const tb = thongBaoChoNhan(prId);
    return tb !== undefined && lyDoKhongNhan(tb) === null;
  }

  /**
   * Nhận xong có tự chuyển sang bước ② hay không — để hộp xác nhận nói TRƯỚC hệ quả.
   * Chỉ đúng khi đang ở bước ① và đề nghị chưa có bảng báo giá nào.
   */
  function seTuChuyenBuoc(tb: ThongBaoChuyenBuoc | null): boolean {
    if (!tb || tb.denBuoc !== "tiep_nhan") return false;
    return !baoGia.some((b) => b.prId === tb.prId && b.trangThai !== "huy");
  }

  function xacNhanNhan(tb: ThongBaoChuyenBuoc) {
    // 🔴 Lớp chặn thứ hai, cố ý trùng với lớp ẩn nút: nút bị ẩn vẫn có thể bị gọi qua đường
    // khác, mà đây là chỗ ghi TÊN NGƯỜI vào nhật ký — sai là sai vĩnh viễn.
    const lyDo = lyDoKhongNhan(tb);
    if (lyDo) {
      toast.error("Chưa nhận việc này được", { description: lyDo });
      return;
    }
    nhanCongTac(tb.id, { uid: nguoiDung.uid, ten: nguoiDung.tenHienThi });

    if (tb.denBuoc !== "tiep_nhan") {
      toast.success("Đã nhận công tác", { description: tb.prCode });
      return;
    }

    // Bước trước phải xong mới chuyển bước — dùng chung luật với kéo thả và menu ⋯.
    const dn = deNghi.find((d) => d.id === tb.prId);
    const vuongMac = dn
      ? vuongMacSangBuocSau(
          dn,
          "tiep_nhan",
          baoGia.filter((b) => b.prId === tb.prId),
        )
      : null;
    if (vuongMac) {
      toast.warning("Đã nhận công tác nhưng chưa chuyển bước", { description: vuongMac });
      return;
    }
    if (baoGia.some((b) => b.prId === tb.prId && b.trangThai !== "huy")) {
      toast.success("Đã nhận công tác", { description: tb.prCode });
      return;
    }

    const id = taoBaoGiaGiaLap(tb.prId, nguoiDung.tenHienThi);
    if (id) {
      toast.success("Đã nhận công tác", {
        description: `${tb.prCode} chuyển sang bước “Yêu cầu NCC báo giá” — đã lập bảng báo giá.`,
        action: { label: "Mở bảng báo giá", onClick: () => router.push(`/bao-gia/${id}`) },
      });
    } else {
      // Nói thật khi không chuyển được bước, đừng báo thành công cho xong việc.
      toast.warning("Đã nhận công tác nhưng chưa chuyển bước", {
        description: "Không lập được bảng báo giá: đã hết mã dự phòng của bản chạy thử.",
      });
    }
  }

  return {
    hoiNhan,
    moHoiNhan: doiHoiNhan,
    dongHoiNhan: () => doiHoiNhan(null),
    lyDoKhongNhan,
    thongBaoChoNhan,
    coTheNhan,
    seTuChuyenBuoc,
    xacNhanNhan,
  };
}
