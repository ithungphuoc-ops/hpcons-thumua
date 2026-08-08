"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Eye } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { TimelineDeNghi } from "@/1-giao-dien/thanh-phan-nghiep-vu/timeline-de-nghi";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { tinhTienDoDeNghi, tomTatTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import { NHAN_TRANG_THAI_DE_NGHI } from "@/2-quy-trinh/trang-thai";

/**
 * M6 — Người đề nghị (Phòng Thi công) theo dõi tiến trình đề nghị của mình.
 * Màn hình MỚI, bản thumua-next cũ không có.
 * 🔒 Không hiển thị: đơn giá, thành tiền, nhà cung cấp, tên nhân viên thu mua.
 */
export default function TrangTheoDoi() {
  const { deNghi, donHang, phieuNhan } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  /** Người đề nghị chỉ thấy đề nghị của mình; vai trò quản lý thấy hết. */
  const danhSach = useMemo(() => {
    const nguon = quyen.xemMoiHoSo
      ? deNghi
      : deNghi.filter((dn) => dn.nguoiDeNghiUid === nguoiDung.uid);
    return nguon.map((dn) => {
      const tienDo = tinhTienDoDeNghi(dn, donHang, phieuNhan);
      return { dn, tienDo, tomTat: tomTatTienDoDeNghi(tienDo) };
    });
  }, [deNghi, donHang, phieuNhan, nguoiDung.uid, quyen.xemMoiHoSo]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Thu mua", href: "/tong-quan" }, { label: "Theo dõi đề nghị" }]}
        title="Theo dõi đề nghị"
        description="Tiến trình hồ sơ đề nghị mua hàng — không hiển thị giá và nhà cung cấp"
      />

      {danhSach.length === 0 ? (
        <EmptyState
          icon={Eye}
          title="Chưa có đề nghị nào để theo dõi"
          description="Đề nghị bạn lập trên HPcore sau khi được duyệt sẽ hiện ở đây."
        />
      ) : (
        <div className="flex flex-col gap-(--hp-md-card-gap)">
          {danhSach.map(({ dn, tienDo, tomTat }) => {
            const tt = NHAN_TRANG_THAI_DE_NGHI[dn.trangThai];
            return (
              <Card key={dn.id}>
                <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/theo-doi/${dn.id}`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {dn.code}
                      </Link>
                      <span className="text-sm text-text-primary">{dn.tieuDe}</span>
                      <span className="text-xs text-text-desc">{dn.tenCongTrinh}</span>
                    </div>
                    <StatusBadge label={tt.nhan} tone={tt.tong} />
                  </div>

                  <TimelineDeNghi
                    ngayDuyet={dn.ngayDuyet}
                    ngayCanHang={dn.ngayCanHang}
                    soDongDaNhanDu={tomTat.soDongDaNhanDu}
                    tongSoDong={tomTat.tongSoDong}
                    soDongDaPhanBo={tienDo.filter((d) => d.trangThaiDong !== "chua_phan_bo").length}
                    soDongDaLenPO={tienDo.filter((d) => d.maPOLienQuan.length > 0).length}
                  />

                  <Link
                    href={`/theo-doi/${dn.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Xem chi tiết từng mặt hàng →
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
