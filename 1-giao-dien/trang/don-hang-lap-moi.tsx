"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FileWarning } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { Skeleton } from "@/1-giao-dien/nen-tang-ui/skeleton";
import { FormLapDonMuaHang } from "@/1-giao-dien/thanh-phan-nghiep-vu/form-lap-don-mua-hang";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";

/**
 * M4 — LẬP ĐƠN MUA HÀNG, bản MỘT TRANG RIÊNG (`/don-hang/tao-moi`).
 *
 * 🔴 TỪ 17/08/2026 TRANG NÀY CHỈ CÒN LÀ CÁI VỎ. Toàn bộ phần nhập liệu đã dời sang
 * `thanh-phan-nghiep-vu/form-lap-don-mua-hang.tsx` để **dùng chung** với khối bước ④ trong
 * trang chi tiết đề nghị.
 *
 * Vì sao: Ban lãnh đạo 17/08/2026 — *"a cần phần nhập liệu phải nằm trong khối, chỉ ai được
 * cấp quyền thì mới xem được phần nhập liệu đó"*. Trước đó phần nhập liệu chỉ có ở trang riêng
 * này (vì màn "Đơn mua hàng" của MISA là một CỬA SỔ RIÊNG nên tôi làm thành TRANG riêng), còn
 * ở khối bước ④ chỉ có đúng một cái nút dẫn sang — nên đứng ở khối bước không thấy phần nhập
 * liệu, và Ban lãnh đạo hỏi sáu lượt *"mục giao diện giống misa đâu"*.
 *
 * 🔴 VÌ SAO KHÔNG BỎ TRANG NÀY: nó vẫn là đường DUY NHẤT của chức năng **tách PO từ bảng báo
 * giá** — chỉ nó nhận được hai tham số `rfqId` + `nccId` (`trang/bao-gia-chi-tiet.tsx`), thứ
 * mà khối nhúng không có. Ngoài ra bảng quy trình (`quyetDinhKeoTha` → `mo_trang`) cũng mở
 * địa chỉ này. Bỏ là làm mồ côi cả hai đường.
 *
 * 🔴 MỘT FORM, MỘT CHỖ: tuyệt đối không chép ruột form về đây. Hai bản chép tay sẽ lệch nhau
 * sau vài lần sửa — lỗi dự án đã dính.
 */
export default function TrangLapDonHang() {
  /**
   * `useSearchParams` bắt buộc nằm trong Suspense, nếu không `next build` báo
   * "missing-suspense-with-csr-bailout" và dừng build.
   *
   * 📌 Chốt này là lý do form KHÔNG được tự đọc tham số địa chỉ: trang chi tiết đề nghị
   * (`/de-nghi/[id]`) không có `Suspense` nào và là trang tĩnh, nên form đọc `useSearchParams`
   * là build dừng ngay. Đề nghị nguồn phải TRUYỀN VÀO qua prop.
   */
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <NoiDungLapDonHang />
    </Suspense>
  );
}

function NoiDungLapDonHang() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prId = searchParams.get("prId");
  /**
   * TÁCH PO: hai tham số này đến từ màn Báo giá, khi người dùng đã chia khối lượng một mặt
   * hàng cho nhiều nhà cung cấp rồi bấm "Lập đơn" cho một nhà cung cấp cụ thể.
   *
   * 🔴 VÌ SAO KHÔNG SINH PO TỰ ĐỘNG TỪ MÀN BÁO GIÁ: đơn đặt hàng còn cần ngày giao, người
   * nhận, địa điểm, điều khoản — những thứ chỉ người lập đơn biết. Nên form lập đơn vẫn là NƠI
   * DUY NHẤT tạo PO (một nguồn sự thật), phân bổ chỉ ĐIỀN SẴN vào đó.
   */
  const rfqId = searchParams.get("rfqId");
  const nccIdTuBaoGia = searchParams.get("nccId");
  const { deNghi } = useDuLieu();

  const dn = deNghi.find((x) => x.id === prId);

  if (!dn) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Chưa chọn đề nghị"
        description="Mở một đề nghị mua hàng rồi lập đơn ngay trong bước “Lập đơn mua hàng”."
        action={{ label: "Xem danh sách đề nghị", onClick: () => router.push("/de-nghi") }}
      />
    );
  }

  /* 📌 Cổng gác quyền (`quyen.lapPO`) nằm TRONG form — xem chú thích ở đó. Ở đây không kiểm
     lại: hai chỗ kiểm hai kiểu là sớm muộn lệch nhau. */
  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Thu mua", href: "/tong-quan" },
          { label: "Quy trình mua hàng", href: "/de-nghi" },
          { label: dn.code, href: `/de-nghi/${dn.id}` },
          { label: "Lập đơn mua hàng" },
        ]}
        title="Lập đơn mua hàng"
        description={`Từ ${dn.code} · ${dn.tieuDe}`}
      />

      <FormLapDonMuaHang
        deNghi={dn}
        rfqId={rfqId}
        nccIdTuBaoGia={nccIdTuBaoGia}
        /* Ở trang riêng thì cất xong ĐI TIẾP đúng như cũ: "Cất và In" mở bản in A4, "Cất"
           thường mở trang chi tiết đơn vừa lập. Trang in tự chặn quyền `xemGia` bên trong. */
        onDaLuu={(poId, rangIn) =>
          router.push(rangIn ? `/in/don-hang/${poId}` : `/don-hang/${poId}`)
        }
        onHuy={() => router.back()}
      />
    </>
  );
}
