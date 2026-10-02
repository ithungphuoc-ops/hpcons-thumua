"use client";

// ============================================================
// Ô PHIẾU CHI + Ô TICK "GỠ ỨNG" — một bản duy nhất cho mọi chỗ bày mục Phiếu chi.
//
// ★ Sếp 02/10/2026: *"Thêm nút gỡ ứng, có chức năng: Tích zô thì hiện nút đính kèm 'Phiếu chi'.
// Không tích thì phải ghi lý do thì mới được qua bước"*.
//
// 🔴 DÙNG Ở HAI CHỖ, phải giống hệt nhau: bộ hồ sơ thanh toán trên trang chi tiết đề nghị, và hộp
// "Gỡ vướng" khi kéo thẻ ⑦ → ⑧ (`hop-chuyen-giai-doan.tsx`, mã `thieu_phieu_chi`). Hai bản chép tay
// là sớm muộn một nơi cho tick mà nơi kia không.
// 📌 Luật (có chặn hay không, bỏ tick được không) ở `2-quy-trinh/chung-tu-cuoi-quy-trinh.ts`
//    (`coGoUng` · `lyDoKhongBoTickGoUng` · `vuongMacPhieuChi`). Ô này chỉ VẼ và gọi tầng ghi.
// ============================================================

import { toast } from "sonner";
import { OChungTuBatBuoc } from "@/1-giao-dien/thanh-phan-nghiep-vu/o-chung-tu-bat-buoc";
import { OGhiLyDo } from "@/1-giao-dien/thanh-phan-nghiep-vu/o-ghi-ly-do";
import {
  BUOC_DINH_KEM_HO_SO_THANH_TOAN,
  KHOA_LY_DO_KHONG_GO_UNG,
  NHAN_TEP_PHIEU_CHI,
  coGoUng,
  khongCanHopDongHoaDon,
  lyDoKhongBoTickGoUng,
  lyDoKhongGoUng,
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
  const { datTickChungTu, ghiLyDoThieuChungTu } = useDuLieu();
  const { nguoiDung } = useNguoiDung();
  /* Hồ sơ xuất kho / nhân sự miễn luật này (`vuongMacPhieuChi`) nên không vẽ ô tick — ô về y như cũ. */
  const mien = khongCanHopDongHoaDon(deNghi);
  const co = coGoUng(deNghi);
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
      /* Tick rồi thì tệp là BẮT BUỘC (`vuongMacPhieuChi`) — nhãn "Bắt buộc" phải nói đúng điều đó. */
      batBuoc={!mien && co}
      moTa={
        mien
          ? "Phiếu chi của khoản trả bằng tiền mặt. Đơn chuyển khoản thì để trống — chứng từ là ủy nhiệm chi ở trên."
          : "Có gỡ ứng (khoản chi tiền mặt / tạm ứng) thì tick “Gỡ ứng” và đính kèm phiếu chi. Không có thì ghi lý do — bắt buộc một trong hai mới hoàn thành được hồ sơ."
      }
      duocSua={duocSua}
      khoa={khoa}
      tepDaCo={tepPhieuChi(deNghi)}
      congTac={
        mien
          ? undefined
          : {
              bat: co,
              nhan: "Gỡ ứng",
              khiTat: (
                <OGhiLyDo
                  /* Đổi `key` theo lý do đang lưu: máy khác vừa sửa thì ô nạp lại bản mới, không
                     giữ bản cũ để người này bấm Lưu đè mất. */
                  key={lyDoKhongGoUng(deNghi)}
                  giaTri={lyDoKhongGoUng(deNghi)}
                  nhan="Lý do không có phiếu chi (bắt buộc)"
                  khoa={lyDoKhoa}
                  onLuu={(lyDo) =>
                    ghiLyDoThieuChungTu(
                      deNghi.id,
                      KHOA_LY_DO_KHONG_GO_UNG,
                      lyDo,
                      nguoiDung.tenHienThi,
                      "Phiếu chi",
                    )
                  }
                />
              ),
              khoa: lyDoKhoa ?? (co ? (lyDoKhongBoTickGoUng(deNghi) ?? undefined) : undefined),
              onDoi: (bat) => {
                const loi = datTickChungTu(deNghi.id, "go_ung", bat, nguoiDung.tenHienThi);
                if (loi) toast.error(loi);
              },
            }
      }
    />
  );
}
