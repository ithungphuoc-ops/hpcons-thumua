"use client";

import { useParams } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { ChevronDown, FileWarning } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { TimelineDeNghi } from "@/1-giao-dien/thanh-phan-nghiep-vu/timeline-de-nghi";
import { ThanhTienDo } from "@/1-giao-dien/thanh-phan-nghiep-vu/thanh-tien-do";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/1-giao-dien/nen-tang-ui/table";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { tinhTienDoDeNghi, tomTatTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import { NHAN_TRANG_THAI_DONG_CHO_NGUOI_DE_NGHI } from "@/2-quy-trinh/trang-thai";

/** M6 — Chi tiết tiến trình từng mặt hàng cho người đề nghị. */
export default function TrangTheoDoiChiTiet() {
  const params = useParams<{ id: string }>();
  const { deNghi, donHang, phieuNhan } = useDuLieu();
  const [moDong, setMoDong] = useState<number | null>(null);

  const dn = deNghi.find((x) => x.id === params.id);
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

  /** Lịch sử nhận hàng của một dòng đề nghị — gộp từ mọi PO liên quan. */
  function lichSuNhan(sttDeNghi: number) {
    const ketQua: { ngay: string; khoiLuong: number; lan: number }[] = [];
    for (const po of donHang.filter((p) => p.prId === params.id)) {
      const dongPO = po.items.filter((d) => d.sttDongDeNghi === sttDeNghi);
      if (dongPO.length === 0) continue;
      for (const p of phieuNhan.filter((x) => x.poId === po.id && x.trangThai === "da_nhap_kho")) {
        for (const d of dongPO) {
          const line = p.lines.find((l) => l.sttDongPO === d.sttDong);
          if (line) ketQua.push({ ngay: p.ngayNhanThucTe, khoiLuong: line.khoiLuongThucNhan, lan: p.lanGiaoThu });
        }
      }
    }
    return ketQua.sort((a, b) => a.ngay.localeCompare(b.ngay));
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Thu mua", href: "/tong-quan" },
          { label: "Theo dõi đề nghị", href: "/theo-doi" },
          { label: dn.code },
        ]}
        title={dn.tieuDe}
        description={`${dn.code} · ${dn.tenCongTrinh} · cần hàng ${new Date(dn.ngayCanHang).toLocaleDateString("vi-VN")}`}
      />

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

      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          <h2 className="text-h3 text-text-primary">Chi tiết từng mặt hàng</h2>

          {/* Bảng — Desktop/Tablet */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mặt hàng</TableHead>
                  <TableHead>ĐVT</TableHead>
                  <TableHead className="text-right">Đề nghị</TableHead>
                  <TableHead className="text-right">Đã nhận</TableHead>
                  <TableHead className="text-right">Còn lại</TableHead>
                  <TableHead>Dự kiến giao</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tienDo.map((d) => {
                  const tt = NHAN_TRANG_THAI_DONG_CHO_NGUOI_DE_NGHI[d.trangThaiDong];
                  const ls = lichSuNhan(d.stt);
                  return (
                    <Fragment key={d.stt}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setMoDong(moDong === d.stt ? null : d.stt)}
                      >
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            <ChevronDown
                              className={`size-4 shrink-0 text-text-desc transition-transform ${moDong === d.stt ? "rotate-180" : ""}`}
                              aria-hidden
                            />
                            {d.tenVatLieu}
                          </span>
                        </TableCell>
                        <TableCell>{d.donViTinh}</TableCell>
                        <TableCell className="text-right">{d.khoiLuongDeNghi.toLocaleString("vi-VN")}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {d.khoiLuongDaNhan.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${d.khoiLuongConLai > 0 ? "text-warning-soft" : "text-success-soft"}`}
                        >
                          {d.khoiLuongConLai.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {d.ngayGiaoDuKien ? new Date(d.ngayGiaoDuKien).toLocaleDateString("vi-VN") : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <StatusBadge label={tt.nhan} tone={tt.tong} />
                            {d.khoiLuongDaNhan > 0 && d.khoiLuongConLai > 0 && (
                              <ThanhTienDo phanTram={d.phanTram} nhan={`${Math.round(d.phanTram)}%`} />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {moDong === d.stt && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-surface">
                            {ls.length === 0 ? (
                              <p className="text-sm text-text-desc">Chưa có lần nhận hàng nào.</p>
                            ) : (
                              <ul className="flex flex-col gap-1">
                                {ls.map((x, i) => (
                                  <li key={i} className="text-sm text-text-secondary">
                                    Lần {x.lan} · {new Date(x.ngay).toLocaleDateString("vi-VN")} · nhận{" "}
                                    <strong>{x.khoiLuong.toLocaleString("vi-VN")}</strong> {d.donViTinh}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Card List — Mobile: BCH hay xem ở công trường bằng điện thoại */}
          <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
            {tienDo.map((d) => {
              const tt = NHAN_TRANG_THAI_DONG_CHO_NGUOI_DE_NGHI[d.trangThaiDong];
              const ls = lichSuNhan(d.stt);
              return (
                <div key={d.stt} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-text-primary">{d.tenVatLieu}</span>
                    <StatusBadge label={tt.nhan} tone={tt.tong} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-desc">Đề nghị</span>
                    <span className="font-semibold">
                      {d.khoiLuongDeNghi.toLocaleString("vi-VN")} {d.donViTinh}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-desc">Đã nhận</span>
                    <span className="font-semibold">{d.khoiLuongDaNhan.toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-desc">Còn lại</span>
                    <span
                      className={d.khoiLuongConLai > 0 ? "font-semibold text-warning-soft" : "font-semibold text-success-soft"}
                    >
                      {d.khoiLuongConLai.toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-desc">Dự kiến giao</span>
                    <span>
                      {d.ngayGiaoDuKien ? new Date(d.ngayGiaoDuKien).toLocaleDateString("vi-VN") : "—"}
                    </span>
                  </div>
                  <ThanhTienDo
                    phanTram={d.phanTram}
                    tong={d.khoiLuongConLai === 0 ? "success" : "primary"}
                    nhan={d.khoiLuongConLai === 0 ? "Đã nhận đủ" : `${Math.round(d.phanTram)}%`}
                  />
                  {ls.length > 0 && (
                    <ul className="flex flex-col gap-0.5 border-t border-divider pt-2 text-xs text-text-desc">
                      {ls.map((x, i) => (
                        <li key={i}>
                          Lần {x.lan} · {new Date(x.ngay).toLocaleDateString("vi-VN")} ·{" "}
                          {x.khoiLuong.toLocaleString("vi-VN")} {d.donViTinh}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          <p className="border-t border-divider pt-3 text-xs text-text-desc">
            🔒 Màn hình này không hiển thị đơn giá, thành tiền, nhà cung cấp và tên nhân viên thu mua phụ trách.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
