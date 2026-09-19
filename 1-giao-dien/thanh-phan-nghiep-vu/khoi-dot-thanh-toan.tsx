"use client";

// ============================================================
// KHỐI "ĐỢT THANH TOÁN" — hàng con gập/mở dưới mỗi dòng PO của bảng Công nợ.
//
// ★★ Sếp 18/09/2026, yêu cầu ④: *"Mỗi PO sẽ được tạo thêm dòng để nhập số tiền thanh toán từng
// đợt (và có tính năng group lại theo tên PO)"*.
//
// 🔴 NHẬP NGAY TRONG BẢNG, ĐÚNG NGUYÊN VĂN YÊU CẦU. Bản thiết kế đầu của tôi định dời chỗ nhập
// sang trang chi tiết đơn hàng — một agent phản biện chỉ ra đó là **đổi yêu cầu của Sếp chứ không
// phải thực hiện nó**, và đúng. Đổi lại, đơn chưa nhận đủ hàng nhưng đã tạm ứng vẫn phải vào được
// bảng; việc đó xử ở `congNoTheoDonHang` (`2-quy-trinh/tuoi-no.ts`), không xử ở đây.
//
// 🔴 KHỐI NÀY CHỈ VẼ. Mọi luật (ai được ghi, số tiền hợp lệ chưa, cộng dồn thế nào) nằm ở
// `3-du-lieu/kho-du-lieu.tsx` và `2-quy-trinh/tuoi-no.ts` — quy ước 3.4b cấm để hàm tính nghiệp
// vụ trong tệp giao diện. Ở đây chỉ gọi và hiện lại câu lý do khi bị chặn.
// ============================================================

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Wallet } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { OChonNgay } from "@/1-giao-dien/thanh-phan-dung-chung/o-chon-ngay";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { formatCurrencyVnd, formatDate } from "@/6-tien-ich/dinh-dang";
import type { CongNoTheoDon } from "@/2-quy-trinh/tuoi-no";
import type { NgayISO } from "@/3-du-lieu/kieu-du-lieu";

/** Hôm nay dạng `yyyy-mm-dd`, theo giờ máy người dùng. */
function homNay(): NgayISO {
  const d = new Date();
  const hai = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`;
}

export function KhoiDotThanhToan({
  dong,
  ghiDuoc,
  onThem,
  onXoa,
}: {
  dong: CongNoTheoDon;
  /** Có được thêm/xoá đợt không. Chặn THẬT nằm ở tầng ghi — cờ này chỉ để không bày nút ra. */
  ghiDuoc: boolean;
  onThem: (dot: {
    poId: string;
    ngayChi: NgayISO;
    soTien: number;
    soChungTuChi?: string;
  }) => string | null;
  onXoa: (id: string) => string | null;
}) {
  const [dangThem, setDangThem] = useState(false);
  const [ngayChi, setNgayChi] = useState<string>(homNay());
  const [soTien, setSoTien] = useState("");
  const [soChungTu, setSoChungTu] = useState("");
  /** Đợt đang hỏi xoá — `null` là chưa hỏi ai. */
  const [hoiXoa, setHoiXoa] = useState<string | null>(null);

  function luu() {
    /* 🔴 BỎ DẤU PHÂN CÁCH TRƯỚC KHI ĐỔI SANG SỐ. Người dùng gõ tiền theo thói quen kế toán
       ("4.500.000" hoặc "4,500,000"); `Number("4.500.000")` cho `NaN`, và nếu để lọt thì tầng ghi
       từ chối với câu "số tiền phải lớn hơn 0" — người dùng đọc câu đó mà không hiểu vì sao, vì họ
       vừa gõ đúng số tiền thật. */
    const tien = Number(soTien.replace(/[.,\s]/g, ""));
    const loi = onThem({
      poId: dong.poId,
      ngayChi,
      soTien: tien,
      soChungTuChi: soChungTu.trim() || undefined,
    });
    if (loi) {
      toast.error(loi);
      return;
    }
    toast.success(`Đã ghi ${formatCurrencyVnd(tien)} cho đơn ${dong.maDonHang}`);
    setDangThem(false);
    setSoTien("");
    setSoChungTu("");
    setNgayChi(homNay());
  }

  return (
    /**
      * 🔴 BÁM MÉP TRÁI KHUNG CUỘN (`sticky left-0`) — sửa 19/09/2026 sau khi xem bản demo.
      *
      * Bảng ngoài rộng 1792px và cuộn ngang. Không có `sticky` thì khối này trôi theo, nên vừa
      * cuộn sang phải để xem cột "Còn phải trả" là ngày chi và số tiền của các đợt **trôi khuất
      * khỏi màn** — đúng lúc người ta cần đối chiếu hai thứ đó với nhau.
      *
      * 📌 `w-fit` + `max-w-[100vw]`: khối chỉ rộng bằng nội dung, không kéo bảng rộng thêm.
      */
    <div className="sticky left-0 flex w-fit max-w-[100vw] flex-col gap-2 border-l-2 border-primary/40 py-3 pr-3 pl-6">
      <div className="flex flex-wrap items-center gap-2">
        <Wallet className="size-4 shrink-0 text-text-desc" aria-hidden />
        <span className="text-sm font-semibold text-text-primary">
          Các đợt đã thanh toán — {dong.maDonHang}
        </span>
        <span className="text-xs text-text-desc">
          {dong.dotChi.length === 0
            ? "chưa có đợt nào"
            : `${dong.dotChi.length} đợt · đã trả ${formatCurrencyVnd(dong.daTra)} / ${formatCurrencyVnd(
                dong.tongCongNo,
              )}`}
        </span>
      </div>

      {dong.dotChi.length > 0 && (
        <ul className="flex flex-col gap-1">
          {dong.dotChi.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-card px-3 py-2 text-sm"
            >
              <span className="tabular-nums text-text-secondary">{formatDate(d.ngayChi)}</span>
              <span className="font-semibold tabular-nums text-text-primary">
                {formatCurrencyVnd(d.soTien)}
              </span>
              {d.soChungTuChi && (
                <span className="text-xs text-text-desc">chứng từ {d.soChungTuChi}</span>
              )}
              {/* Ai ghi — tiền thì phải truy lại được. */}
              <span className="text-xs text-text-desc">· {d.nguoiGhiTen}</span>
              {ghiDuoc && (
                <button
                  type="button"
                  onClick={() => setHoiXoa(d.id)}
                  title="Xoá đợt thanh toán này"
                  className="ml-auto inline-flex size-11 items-center justify-center rounded-lg text-text-desc transition-colors hover:bg-danger-bg hover:text-danger md:size-9"
                >
                  <Trash2 className="size-4" aria-hidden />
                  <span className="sr-only">Xoá đợt ngày {formatDate(d.ngayChi)}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 🔴 HỎI TRƯỚC KHI XOÁ. Xoá một dòng tiền là đổi số liệu công nợ — phải có một nhịp dừng,
          và nhật ký đơn hàng vẫn ghi lại ai xoá (xem `xoaDotThanhToan`). */}
      <HopXacNhan
        mo={hoiXoa !== null}
        onDong={() => setHoiXoa(null)}
        tieuDe="Xoá đợt thanh toán này?"
        moTa="Số tiền còn phải trả của đơn sẽ tăng lại tương ứng. Nhật ký đơn hàng vẫn ghi lại việc xoá."
        nhanDongY="Xoá đợt"
        nguyHiem
        onDongY={() => {
          const id = hoiXoa;
          setHoiXoa(null);
          if (!id) return;
          const loi = onXoa(id);
          if (loi) toast.error(loi);
        }}
      />

      {ghiDuoc &&
        (dangThem ? (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card p-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`ngay-chi-${dong.poId}`}>Ngày chi</Label>
              <OChonNgay
                id={`ngay-chi-${dong.poId}`}
                nhan="Ngày chi"
                giaTri={ngayChi}
                onDoi={setNgayChi}
                xoaDuoc={false}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`so-tien-${dong.poId}`}>Số tiền</Label>
              <Input
                id={`so-tien-${dong.poId}`}
                inputMode="numeric"
                value={soTien}
                onChange={(e) => setSoTien(e.target.value)}
                placeholder={`tối đa ${formatCurrencyVnd(dong.conLai)}`}
                className="w-44"
                onKeyDown={(e) => {
                  if (e.key === "Enter") luu();
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`so-ct-${dong.poId}`}>Số UNC / phiếu chi</Label>
              <Input
                id={`so-ct-${dong.poId}`}
                value={soChungTu}
                onChange={(e) => setSoChungTu(e.target.value)}
                placeholder="không bắt buộc"
                className="w-44"
              />
            </div>
            <Button onClick={luu}>Lưu đợt</Button>
            <Button variant="ghost" onClick={() => setDangThem(false)}>
              Huỷ
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDangThem(true)}
            className="inline-flex min-h-11 w-fit items-center gap-1 rounded-lg px-2 text-xs font-medium text-primary underline-offset-2 transition-colors hover:bg-primary-bg md:min-h-9"
          >
            <Plus className="size-4 shrink-0" aria-hidden />
            Thêm đợt thanh toán
          </button>
        ))}

      {!ghiDuoc && dong.dotChi.length === 0 && (
        /* Nói rõ vì sao không có nút, đừng để khối trống trơn — người đọc tưởng app hỏng. */
        <span className="text-xs text-text-desc">
          Chỉ Kế toán và Trưởng bộ phận ghi được số tiền đã thanh toán.
        </span>
      )}
    </div>
  );
}
