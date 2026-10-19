"use client";

// ============================================================
// Ô PHIẾU CHI + Ô TICK "GỠ ỨNG" — mục 8 bộ hồ sơ thanh toán trên trang chi tiết đề nghị.
//
// ★ Sếp 02/10/2026: *"Thêm nút gỡ ứng, có chức năng: Tích zô thì hiện nút đính kèm 'Phiếu chi'.
// Không tích thì phải ghi lý do thì mới được qua bước"*.
//
// ★★ ĐỔI CHỨC NĂNG — Sếp 17/10/2026 (demo 5 vấn đề, tab 5): *"gở ứng chỉ cần tick hoặc ko tick, còn
// file đính kèm vẫn hiện, dạng ko bắt buộc (trường hợp có phiếu chi vẫn không gở ứng)"* và *"ô đánh
// tích vẫn giống như hiện tại k sửa đổi chỉ sửa chức năng"*. Nên:
//   · ô tick "Gỡ ứng" đứng đúng chỗ cũ nhưng CHỈ ĐỂ ĐÁNH DẤU (`congTac.chiDanhDau`);
//   · nút đính kèm phiếu chi LUÔN hiện, nhãn "Nếu có", không chặn qua bước / hoàn thành;
//   · bỏ ô "Lý do không có phiếu chi (bắt buộc)" và luật chặn `vuongMacPhieuChi`.
// 📌 Trước 17/10 ô này còn nằm trong hộp "Gỡ vướng" khi kéo thẻ ⑦ → ⑧ (mã `thieu_phieu_chi`) — mã đó
//    đã bỏ cùng luật chặn, nên giờ chỉ còn một chỗ dùng.
// 📌 Luật đọc ô tick ở `2-quy-trinh/chung-tu-cuoi-quy-trinh.ts` (`coGoUng`). Ô này chỉ VẼ và gọi tầng ghi.
// ============================================================

import { toast } from "sonner";
import { OChungTuBatBuoc } from "@/1-giao-dien/thanh-phan-nghiep-vu/o-chung-tu-bat-buoc";
import {
  BUOC_DINH_KEM_HO_SO_THANH_TOAN,
  NHAN_TEP_PHIEU_CHI,
  coGoUng,
  khongCanHopDongHoaDon,
  tepPhieuChi,
} from "@/2-quy-trinh/chung-tu-cuoi-quy-trinh";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";

export function OPhieuChiGoUng({
  deNghi,
  duocSua,
  khoa = false,
  dangGon,
}: {
  deNghi: DeNghiMuaHang;
  /** Quyền sửa chứng từ của bước — cùng `duocSuaTepBuoc` ở trang chi tiết. */
  duocSua: boolean;
  /** Hồ sơ đã đóng. */
  khoa?: boolean;
  dangGon?: boolean;
}) {
  const { datTickChungTu } = useDuLieu();
  const { nguoiDung } = useNguoiDung();
  /* Hồ sơ xuất kho / nhân sự: hàng có sẵn trong kho, không có khoản chi nào để gỡ ứng — không vẽ ô tick. */
  const mien = khongCanHopDongHoaDon(deNghi);
  const lyDoKhoa = khoa
    ? "Hồ sơ đã đóng."
    : !duocSua
      ? "Bạn không có quyền sửa chứng từ của bước này."
      : undefined;

  return (
    <OChungTuBatBuoc
      deNghi={deNghi}
      maGiaiDoan={BUOC_DINH_KEM_HO_SO_THANH_TOAN}
      nhanO={NHAN_TEP_PHIEU_CHI}
      dangGon={dangGon}
      tieuDe="Phiếu chi"
      moTa={
        mien
          ? "Phiếu chi của khoản trả bằng tiền mặt. Đơn chuyển khoản thì để trống — chứng từ là ủy nhiệm chi ở trên."
          : "Có gỡ ứng (khoản chi tiền mặt / tạm ứng) thì tick “Gỡ ứng”. Có phiếu chi thì đính kèm, kể cả khi không gỡ ứng. Không bắt buộc."
      }
      duocSua={duocSua}
      khoa={khoa}
      tepDaCo={tepPhieuChi(deNghi)}
      congTac={
        mien
          ? undefined
          : {
              bat: coGoUng(deNghi),
              nhan: "Gỡ ứng",
              chiDanhDau: true,
              khoa: lyDoKhoa,
              onDoi: (bat) => {
                const loi = datTickChungTu(deNghi.id, "go_ung", bat, nguoiDung.tenHienThi);
                if (loi) toast.error(loi);
              },
            }
      }
    />
  );
}
