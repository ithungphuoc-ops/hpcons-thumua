"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { vuongMacXuatPO } from "@/2-quy-trinh/xuat-don-hang-excel";

/**
 * NÚT XUẤT ĐƠN MUA HÀNG RA EXCEL — dùng chung cho trang chi tiết VÀ danh sách đơn hàng.
 *
 * 🔴 VÌ SAO CÓ Ở HAI CHỖ (bài học 11/08/2026): lúc đầu nút chỉ nằm ở trang chi tiết đơn hàng.
 * Ban lãnh đạo báo *"a chưa thấy nút xuất file excel"* — hoá ra không phải nút lỗi, mà là
 * **không tới được**: menu cố ý không có mục "Đơn đặt hàng" (xem BAN-DO-MA-NGUON mục 2b), nên
 * muốn tới trang chi tiết phải đi qua chi tiết đề nghị rồi bấm vào mã PO. Chức năng đặt ở chỗ
 * người dùng không tìm ra thì coi như chưa có.
 *
 * 🔴 TÁCH THÀNH MỘT COMPONENT, KHÔNG CHÉP HAI LẦN. Nút này gánh cả luật quyền (`xemGia`) và
 * luật chặn (`vuongMacXuatPO`); chép sang chỗ thứ hai là sớm muộn một chỗ hở quyền hoặc hở
 * luật — đúng cái đã xảy ra với luật "nhận công tác" hồi phiên trước.
 *
 * 🔒 Không có quyền xem giá thì KHÔNG hiện nút. Đơn gửi nhà cung cấp buộc phải có đơn giá nên
 * không có bản ẩn giá.
 */
export function NutXuatDonHangExcel({
  poId,
  /** `nut` = nút có chữ (trang chi tiết) · `gon` = nút nhỏ trong bảng danh sách. */
  kieu = "nut",
}: {
  poId: string;
  kieu?: "nut" | "gon";
}) {
  const { donHang, deNghi, giaDonHang, nhaCungCap } = useDuLieu();
  const { quyen } = useNguoiDung();
  const [dangXuat, setDangXuat] = useState(false);

  const po = donHang.find((x) => x.id === poId);
  if (!po || !quyen.xemGia) return null;

  const gia = giaDonHang.find((g) => g.poId === poId);
  const ncc = nhaCungCap.find((n) => n.id === po.supplierId);
  /**
   * Tên công trình in vào ô "Mã đề xuất và tên công trình :" của file Excel.
   *
   * 🔴 ƯU TIÊN TRƯỜNG TRÊN CHÍNH ĐƠN. `DonDatHang.tenCongTrinh` có từ 17/08/2026 (chép sang
   * đơn là cố ý: chứng từ gửi ra ngoài phải đứng yên kể cả khi đề nghị bị sửa tên), nhưng chỗ
   * này vẫn tra ngược đề nghị — và chú thích cũ *"`DonDatHang` không có trường này"* đã lỗi
   * thời. Với đơn KHÔNG gắn đề nghị (18/08/2026) thì tra ngược cho ra `undefined` và file
   * Excel mất luôn tên công trình.
   *
   * Vẫn giữ đường lùi tra đề nghị cho đơn cũ lập trước 17/08/2026 (chưa có trường trên đơn).
   */
  const tenCongTrinh =
    po.tenCongTrinh ?? (po.prId ? deNghi.find((d) => d.id === po.prId)?.tenCongTrinh : undefined);

  const vuongMac = vuongMacXuatPO({ po, gia });

  async function tai() {
    setDangXuat(true);
    try {
      const { xuatDonHangExcel, tenFileDonHang } = await import("@/2-quy-trinh/xuat-don-hang-excel");

      // Logo lấy từ `public/` để file có nhận diện như biểu mẫu giấy. Không tải được thì vẫn
      // xuất — thiếu logo đỡ hơn là không xuất được đơn.
      let logo: ArrayBuffer | undefined;
      try {
        const r = await fetch("/logo-hpc.png");
        if (r.ok) logo = await r.arrayBuffer();
      } catch {
        // Bỏ qua, xuất không logo.
      }

      const blob = await xuatDonHangExcel({ po: po!, gia, ncc, tenCongTrinh, logo });
      const diaChi = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = diaChi;
      a.download = tenFileDonHang(po!.code);
      a.click();
      // Thu hồi địa chỉ tạm, nếu không mỗi lần bấm lại giữ thêm một bản trong bộ nhớ.
      setTimeout(() => URL.revokeObjectURL(diaChi), 10_000);
      toast.success("Đã tải đơn mua hàng", { description: tenFileDonHang(po!.code) });
    } catch (e) {
      // Nói ra lỗi thay vì im lặng — bấm mà không thấy gì thì người dùng tưởng app hỏng.
      toast.error("Không tạo được file Excel", {
        description: e instanceof Error ? e.message : "Thử lại, hoặc dùng nút In đơn mua hàng.",
      });
    } finally {
      setDangXuat(false);
    }
  }

  // Khóa kèm `title` nói rõ lý do — nút mờ không lời giải thích là kiểu bí việc khó chịu nhất.
  const nhacKhi = vuongMac ?? "Tải đơn mua hàng ra Excel theo biểu mẫu công ty";

  if (kieu === "gon") {
    return (
      <button
        type="button"
        onClick={(e) => {
          // Dòng trong bảng có thể nằm trong thẻ liên kết — chặn để không nhảy trang.
          e.preventDefault();
          e.stopPropagation();
          void tai();
        }}
        disabled={dangXuat || vuongMac !== null}
        title={nhacKhi}
        aria-label={`Xuất Excel đơn ${po.code}`}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-50"
      >
        <FileSpreadsheet className="size-3.5 shrink-0" aria-hidden />
        {dangXuat ? "Đang tạo…" : "Excel"}
      </button>
    );
  }

  return (
    // 🔴 Khi bị khóa thì IN LÝ DO THÀNH CHỮ, không chỉ nhét vào `title`. Trên điện thoại
    // không rê chuột được nên tooltip là câm lặng hoàn toàn — người dùng chỉ thấy một nút mờ
    // và kết luận "chức năng không có". Đúng cái đã xảy ra ngày 11/08/2026.
    <span className="flex flex-col items-start gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => void tai()}
        disabled={dangXuat || vuongMac !== null}
        title={nhacKhi}
      >
        <FileSpreadsheet className="size-4" aria-hidden />
        {dangXuat ? "Đang tạo file…" : "Xuất Excel"}
      </Button>
      {vuongMac && (
        <span className="max-w-64 text-xs leading-snug text-warning-soft">{vuongMac}</span>
      )}
    </span>
  );
}
