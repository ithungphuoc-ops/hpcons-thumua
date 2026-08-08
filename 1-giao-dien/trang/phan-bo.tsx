"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CheckCircle2, ListChecks } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { deNghiConDangChay } from "@/2-quy-trinh/giai-doan-mua-hang";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { tinhTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";

/**
 * M3 (danh sách việc) — Trưởng bộ phận thấy TOÀN BỘ dòng còn tồn ở mọi đề nghị:
 * dòng chưa phân bổ và dòng đã phân mà chưa lên đơn hàng.
 * Đây là chỗ hay bỏ sót nhất trong mua hàng thực tế.
 */
export default function TrangPhanBo() {
  const { deNghi, donHang, phieuNhan } = useDuLieu();
  const { quyen } = useNguoiDung();

  const congViec = useMemo(
    () =>
      deNghi
        // Đề nghị đã hoàn thành hoặc đã đóng dở không còn là việc phải phân bổ.
        .filter(deNghiConDangChay)
        .map((dn) => {
          const tienDo = tinhTienDoDeNghi(dn, donHang, phieuNhan);
          return {
            dn,
            chuaPhanBo: tienDo.filter((d) => d.trangThaiDong === "chua_phan_bo"),
            daPhanChuaLenPO: tienDo.filter((d) => d.trangThaiDong === "da_phan_bo"),
          };
        })
        .filter((x) => x.chuaPhanBo.length > 0 || x.daPhanChuaLenPO.length > 0),
    [deNghi, donHang, phieuNhan],
  );

  if (!quyen.phanBoCongViec) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Không có quyền phân bổ"
        description="Chỉ Trưởng bộ phận thu mua (apps.tm cấp 3 — Quản lý) được phân bổ công việc."
      />
    );
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Thu mua", href: "/tong-quan" }, { label: "Phân bổ công việc" }]}
        title="Phân bổ công việc"
        description="Dòng đề nghị chưa có người phụ trách, hoặc đã phân mà chưa lên đơn hàng"
      />

      {congViec.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Không còn việc tồn"
          description="Mọi dòng đề nghị đã được phân bổ và đã lên đơn hàng."
        />
      ) : (
        <div className="flex flex-col gap-(--hp-md-card-gap)">
          {congViec.map(({ dn, chuaPhanBo, daPhanChuaLenPO }) => (
            <Card key={dn.id}>
              <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-text-primary">{dn.code}</span>
                    <span className="text-sm text-text-secondary">{dn.tieuDe}</span>
                    <span className="text-xs text-text-desc">
                      {dn.tenCongTrinh} · cần hàng {new Date(dn.ngayCanHang).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <Button size="sm" nativeButton={false} render={<Link href={`/de-nghi/${dn.id}`} />}>
                    Mở bảng phân bổ
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {chuaPhanBo.length > 0 && (
                    <StatusBadge label={`${chuaPhanBo.length} dòng chưa phân bổ`} tone="danger" />
                  )}
                  {daPhanChuaLenPO.length > 0 && (
                    <StatusBadge label={`${daPhanChuaLenPO.length} dòng chưa lên đơn hàng`} tone="warning" />
                  )}
                </div>

                <ul className="flex flex-col gap-1 border-t border-divider pt-3">
                  {[...chuaPhanBo, ...daPhanChuaLenPO].map((d) => (
                    <li key={d.stt} className="flex flex-wrap items-center gap-x-3 text-sm">
                      <span className="text-text-desc">Dòng {d.stt}</span>
                      <span className="font-medium text-text-primary">{d.tenVatLieu}</span>
                      <span className="text-text-secondary">
                        {d.khoiLuongDeNghi.toLocaleString("vi-VN")} {d.donViTinh}
                      </span>
                      <span className="text-xs text-text-desc">
                        {d.nguoiPhuTrachTen ? `→ ${d.nguoiPhuTrachTen}` : "→ chưa phân"}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
