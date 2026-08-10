"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle, ClipboardList, FileText, PackageCheck, ShoppingCart, Timer } from "lucide-react";
import { KpiCard } from "@/1-giao-dien/thanh-phan-dung-chung/kpi-card";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { ThanhTienDo } from "@/1-giao-dien/thanh-phan-nghiep-vu/thanh-tien-do";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { phanTramPO, soNgayConLai, tinhTienDoDeNghi, tinhTienDoPO, tongGiaTriPO } from "@/2-quy-trinh/tinh-toan";
import { NHAN_TRANG_THAI_PO } from "@/2-quy-trinh/trang-thai";
import { deNghiConDangChay } from "@/2-quy-trinh/giai-doan-mua-hang";
import { cn } from "@/6-tien-ich/gop-lop";

export default function TrangTongQuan() {
  const { deNghi, donHang, phieuNhan, giaDonHang } = useDuLieu();
  const { quyen } = useNguoiDung();

  const soLieu = useMemo(() => {
    // Chỉ đếm đề nghị còn đang chạy — đề nghị đã hoàn thành hoặc đóng dở
    // mà vẫn tính vào việc tồn thì thẻ KPI báo nhiều hơn thực tế.
    const deNghiDangChay = deNghi.filter(deNghiConDangChay);
    const dongChuaPhanBo = deNghiDangChay.flatMap((dn) =>
      tinhTienDoDeNghi(dn, donHang, phieuNhan).filter((d) => d.trangThaiDong === "chua_phan_bo"),
    );
    const dongDaPhanChuaLenPO = deNghiDangChay.flatMap((dn) =>
      tinhTienDoDeNghi(dn, donHang, phieuNhan).filter((d) => d.trangThaiDong === "da_phan_bo"),
    );
    const poDangGiao = donHang.filter((po) => po.trangThai === "dang_giao" || po.trangThai === "da_chot");
    const poQuaHan = poDangGiao.filter((po) => soNgayConLai(po.ngayGiaoDuKien) < 0);
    const poChoXacNhan = donHang.filter((po) => po.trangThai === "cho_xac_nhan_hoan_thanh");

    return {
      deNghiChoPhanBo: deNghiDangChay.filter((dn) =>
        tinhTienDoDeNghi(dn, donHang, phieuNhan).some((d) => d.trangThaiDong === "chua_phan_bo"),
      ).length,
      dongChuaPhanBo: dongChuaPhanBo.length,
      dongDaPhanChuaLenPO: dongDaPhanChuaLenPO.length,
      poDangGiao: poDangGiao.length,
      poQuaHan: poQuaHan.length,
      poChoXacNhan: poChoXacNhan.length,
      tongGiaTri: giaDonHang.reduce((t, g) => {
        const po = donHang.find((p) => p.id === g.poId);
        return po ? t + tongGiaTriPO(po, g) : t;
      }, 0),
    };
  }, [deNghi, donHang, phieuNhan, giaDonHang]);

  const poCanChuY = useMemo(
    () =>
      donHang
        .filter((po) => po.trangThai !== "hoan_thanh" && po.trangThai !== "huy")
        .map((po) => ({ po, conLai: soNgayConLai(po.ngayGiaoDuKien) }))
        .sort((a, b) => a.conLai - b.conLai),
    [donHang],
  );

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Thu mua" }, { label: "Tổng quan" }]}
        title="Tổng quan"
        description="Đề nghị mua hàng, phân bổ công việc và tiến độ giao nhận"
      />

      {/* KPI Card — đủ 4 thành phần theo V1.1 Phần E1.
          Thẻ "Tổng giá trị" nằm CÙNG hàng (5 cột) thay vì chiếm riêng một hàng
          ngang — tiết kiệm một dải trống lớn trên màn hình. */}
      <section
        className={cn(
          "grid grid-cols-1 gap-(--hp-md-card-gap) sm:grid-cols-2 xl:grid-cols-4",
          quyen.xemGia && "xl:grid-cols-5",
        )}
      >
        <KpiCard
          icon={FileText}
          title="Đề nghị chờ phân bổ"
          value={String(soLieu.deNghiChoPhanBo)}
          meta={`${soLieu.dongChuaPhanBo} dòng chưa có người phụ trách`}
          tone={soLieu.dongChuaPhanBo > 0 ? "danger" : "success"}
        />
        <KpiCard
          icon={ClipboardList}
          title="Đã phân — chưa lên đơn"
          value={String(soLieu.dongDaPhanChuaLenPO)}
          meta="dòng đã phân nhưng chưa lập PO"
          tone={soLieu.dongDaPhanChuaLenPO > 0 ? "warning" : "success"}
        />
        <KpiCard
          icon={ShoppingCart}
          title="Đơn hàng đang giao"
          value={String(soLieu.poDangGiao)}
          meta={soLieu.poQuaHan > 0 ? `${soLieu.poQuaHan} đơn đã quá hạn giao` : "Chưa có đơn quá hạn"}
          tone={soLieu.poQuaHan > 0 ? "danger" : "primary"}
        />
        <KpiCard
          icon={PackageCheck}
          title="Chờ xác nhận hoàn thành"
          value={String(soLieu.poChoXacNhan)}
          meta="đã giao đủ, chờ kho / trưởng bộ phận"
          tone={soLieu.poChoXacNhan > 0 ? "warning" : "neutral"}
        />
        {quyen.xemGia && (
          <KpiCard
            icon={Timer}
            title="Tổng giá trị đang theo dõi"
            value={`${(soLieu.tongGiaTri / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr ₫`}
            meta="chỉ vai trò được xem giá thấy thẻ này"
            tone="primary"
          />
        )}
      </section>

      {/* Đơn hàng cần chú ý */}
      <section className="flex flex-col gap-(--hp-md-row-gap)">
        <h2 className="text-h3 text-text-primary">Đơn hàng cần chú ý</h2>
        <Card>
          <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
            {poCanChuY.length === 0 && <p className="text-sm text-text-desc">Không có đơn hàng đang mở.</p>}
            {poCanChuY.map(({ po, conLai }) => {
              const tienDo = tinhTienDoPO(
                po,
                phieuNhan.filter((p) => p.poId === po.id),
              );
              const pt = phanTramPO(tienDo);
              const tt = NHAN_TRANG_THAI_PO[po.trangThai];
              const quaHan = conLai < 0;
              return (
                <Link
                  key={po.id}
                  href={`/don-hang/${po.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-surface p-(--hp-md-row-pad) transition-colors hover:border-primary/40"
                >
                  <div className="flex min-w-56 flex-col">
                    <span className="text-sm font-semibold text-text-primary">{po.code}</span>
                    <span className="text-xs text-text-desc">
                      {quyen.xemNhaCungCap ? po.supplierTen : po.prCode}
                    </span>
                  </div>
                  <StatusBadge label={tt.nhan} tone={tt.tong} />
                  <span
                    className={`flex items-center gap-1 text-xs font-semibold ${quaHan ? "text-danger-soft" : conLai <= 3 ? "text-warning-soft" : "text-text-desc"}`}
                  >
                    {quaHan && <AlertTriangle className="size-3.5" aria-hidden />}
                    {quaHan ? `Quá hạn ${Math.abs(conLai)} ngày` : `Còn ${conLai} ngày`}
                  </span>
                  <ThanhTienDo
                    className="ml-auto max-w-40"
                    phanTram={pt}
                    tong={pt === 100 ? "success" : quaHan ? "danger" : "primary"}
                    nhan={`${tienDo.filter((d) => d.khoiLuongConLai === 0).length}/${tienDo.length} dòng đã nhận đủ`}
                  />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
