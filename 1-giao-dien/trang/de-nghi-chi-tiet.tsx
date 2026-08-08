"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { FileWarning, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { BangPhanBo } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-phan-bo";
import { KhoiNguoiTheoDoi } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-nguoi-theo-doi";
import { TimelineDeNghi } from "@/1-giao-dien/thanh-phan-nghiep-vu/timeline-de-nghi";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { tinhTienDoDeNghi, tomTatTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import {
  NHAN_PHONG_BAN_NGUON,
  NHAN_TRANG_THAI_BAO_GIA,
  NHAN_TRANG_THAI_DE_NGHI,
  NHAN_TRANG_THAI_PO,
} from "@/2-quy-trinh/trang-thai";

export default function TrangChiTietDeNghi() {
  const params = useParams<{ id: string }>();
  const { deNghi, donHang, phieuNhan, baoGia } = useDuLieu();
  const { quyen } = useNguoiDung();

  const dn = deNghi.find((x) => x.id === params.id);
  const poLienQuan = useMemo(
    () => donHang.filter((po) => po.prId === params.id),
    [donHang, params.id],
  );
  const baoGiaLienQuan = useMemo(
    () => baoGia.filter((bg) => bg.prId === params.id),
    [baoGia, params.id],
  );

  const tienDo = useMemo(
    () => (dn ? tinhTienDoDeNghi(dn, donHang, phieuNhan) : []),
    [dn, donHang, phieuNhan],
  );

  if (!dn) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Không tìm thấy đề nghị"
        description="Đề nghị này không tồn tại hoặc bạn không có quyền xem."
      />
    );
  }

  const tomTat = tomTatTienDoDeNghi(tienDo);
  const tt = NHAN_TRANG_THAI_DE_NGHI[dn.trangThai];

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Thu mua", href: "/tong-quan" },
          { label: "Đề nghị mua hàng", href: "/de-nghi" },
          { label: dn.code },
        ]}
        title={dn.tieuDe}
        description={`${dn.code} · ${dn.tenCongTrinh} · ${NHAN_PHONG_BAN_NGUON[dn.phongBanNguon]}`}
        actions={<StatusBadge label={tt.nhan} tone={tt.tong} />}
      />

      {/* Thông tin đề nghị */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-(--hp-md-card-gap) md:grid-cols-4">
          <ThongTin nhan="Mã dự án" giaTri={dn.maDuAn} />
          <ThongTin nhan="Mã hợp đồng CĐT" giaTri={dn.maHopDongCDT ?? "—"} />
          <ThongTin nhan="Người đề nghị" giaTri={dn.nguoiDeNghiTen} />
          <ThongTin nhan="Ngày duyệt" giaTri={new Date(dn.ngayDuyet).toLocaleDateString("vi-VN")} />
          <ThongTin nhan="Ngày cần hàng" giaTri={new Date(dn.ngayCanHang).toLocaleDateString("vi-VN")} />
        </CardContent>
      </Card>

      {/* Người theo dõi — chọn từ danh bạ nhân sự công ty, xem `khoi-nguoi-theo-doi.tsx`.
          Có tên ở đây KHÔNG mở khóa xem giá (nguyên tắc dữ liệu số 3). */}
      <KhoiNguoiTheoDoi deNghi={dn} />

      {/* Timeline tổng */}
      <Card>
        <CardContent>
          <TimelineDeNghi
            ngayDuyet={dn.ngayDuyet}
            ngayCanHang={dn.ngayCanHang}
            soDongDaNhanDu={tomTat.soDongDaNhanDu}
            tongSoDong={tomTat.tongSoDong}
            soDongDaPhanBo={tienDo.filter((d) => d.trangThaiDong !== "chua_phan_bo").length}
            soDongDaLenPO={tienDo.filter((d) => d.maPOLienQuan.length > 0).length}
          />
        </CardContent>
      </Card>

      {/* M3 — Phân bổ */}
      <section className="flex flex-col gap-(--hp-md-row-gap)">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-h3 text-text-primary">
            {quyen.phanBoCongViec ? "Phân bổ công việc" : "Chi tiết mặt hàng"}
          </h2>
          {quyen.lapPO && (
            <Button size="sm" nativeButton={false} render={<Link href={`/don-hang/tao-moi?prId=${dn.id}`} />}>
              <ShoppingCart className="size-4" aria-hidden />
              Lập đơn đặt hàng
            </Button>
          )}
        </div>
        <BangPhanBo deNghi={dn} />
      </section>

      {/* Bảng báo giá — từ 06/08/2026 menu không còn mục "Báo giá & so sánh NCC",
          nên đây là lối vào duy nhất tới module đó. Bỏ khối này là module thành mồ côi. */}
      {quyen.xemBaoGia && (
        <section className="flex flex-col gap-(--hp-md-row-gap)">
          <h2 className="text-h3 text-text-primary">Bảng báo giá ({baoGiaLienQuan.length})</h2>
          <Card>
            <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
              {baoGiaLienQuan.length === 0 && (
                <p className="text-sm text-text-desc">Chưa lập bảng báo giá nào cho đề nghị này.</p>
              )}
              {baoGiaLienQuan.map((bg) => {
                const ttBG = NHAN_TRANG_THAI_BAO_GIA[bg.trangThai];
                return (
                  <Link
                    key={bg.id}
                    href={`/bao-gia/${bg.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-surface p-(--hp-md-row-pad) transition-colors hover:border-primary/40"
                  >
                    <span className="text-sm font-semibold text-text-primary">{bg.code}</span>
                    <span className="text-xs text-text-desc">{bg.tieuDe}</span>
                    <span className="text-xs text-text-desc">
                      {bg.items.length} vật tư · hạn nộp{" "}
                      {new Date(bg.hanNop).toLocaleDateString("vi-VN")}
                    </span>
                    {bg.nccDaChonTen && (
                      <span className="text-xs text-text-desc">Đã chọn: {bg.nccDaChonTen}</span>
                    )}
                    <StatusBadge label={ttBG.nhan} tone={ttBG.tong} className="ml-auto" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Đơn hàng đã tách */}
      <section className="flex flex-col gap-(--hp-md-row-gap)">
        <h2 className="text-h3 text-text-primary">Đơn đặt hàng đã tách ({poLienQuan.length})</h2>
        <Card>
          <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
            {poLienQuan.length === 0 && <p className="text-sm text-text-desc">Chưa tách đơn hàng nào.</p>}
            {poLienQuan.map((po) => {
              const ttPO = NHAN_TRANG_THAI_PO[po.trangThai];
              return (
                <Link
                  key={po.id}
                  href={`/don-hang/${po.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-surface p-(--hp-md-row-pad) transition-colors hover:border-primary/40"
                >
                  <span className="text-sm font-semibold text-text-primary">{po.code}</span>
                  {quyen.xemNguoiPhuTrach && (
                    <span className="text-xs text-text-desc">{po.nguoiPhuTrachTen}</span>
                  )}
                  {quyen.xemNhaCungCap && (
                    <span className="text-xs text-text-desc">{po.supplierTen}</span>
                  )}
                  <span className="text-xs text-text-desc">
                    {po.items.length} dòng · giao dự kiến {new Date(po.ngayGiaoDuKien).toLocaleDateString("vi-VN")}
                  </span>
                  <StatusBadge label={ttPO.nhan} tone={ttPO.tong} className="ml-auto" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {/* Lịch sử */}
      <section className="flex flex-col gap-(--hp-md-row-gap)">
        <h2 className="text-h3 text-text-primary">Lịch sử</h2>
        <Card>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {dn.lichSu.map((m, i) => (
                <li key={i} className="flex flex-wrap items-center gap-x-3 text-sm">
                  <span className="text-text-desc">{new Date(m.thoiDiem).toLocaleDateString("vi-VN")}</span>
                  <span className="font-medium text-text-primary">{m.nguoiThucHien}</span>
                  <span className="text-text-secondary">{m.hanhDong}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function ThongTin({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-text-desc">{nhan}</span>
      <span className="text-sm font-medium text-text-primary">{giaTri}</span>
    </div>
  );
}
