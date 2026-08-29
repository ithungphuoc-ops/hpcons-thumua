"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ShoppingCart } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { ThanhTienDo } from "@/1-giao-dien/thanh-phan-nghiep-vu/thanh-tien-do";
import { NutXuatDonHangExcel } from "@/1-giao-dien/thanh-phan-nghiep-vu/nut-xuat-don-hang";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/1-giao-dien/nen-tang-ui/table";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { phanTramPO, soNgayConLai, tinhTienDoPO, tongGiaTriPO } from "@/2-quy-trinh/tinh-toan";
import { nhanAnToan, NHAN_TRANG_THAI_PO } from "@/2-quy-trinh/trang-thai";
import { BadgeChoDeNghi } from "@/1-giao-dien/thanh-phan-nghiep-vu/badge-cho-de-nghi";

export default function TrangDanhSachDonHang() {
  const { donHang, phieuNhan, giaDonHang } = useDuLieu();
  const { quyen } = useNguoiDung();

  const danhSach = useMemo(
    () =>
      donHang.map((po) => {
        const tienDo = tinhTienDoPO(
          po,
          phieuNhan.filter((p) => p.poId === po.id),
        );
        return {
          po,
          tienDo,
          phanTram: phanTramPO(tienDo),
          conLai: soNgayConLai(po.ngayGiaoDuKien),
          giaTri: tongGiaTriPO(po, giaDonHang.find((g) => g.poId === po.id)),
        };
      }),
    [donHang, phieuNhan, giaDonHang],
  );

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Thu mua", href: "/tong-quan" }, { label: "Đơn đặt hàng" }]}
        title="Đơn đặt hàng"
        description={
          quyen.xemGia
            ? "Toàn bộ PO đã chốt — bao gồm giá (vai trò được xem giá)"
            : "Toàn bộ PO đã chốt — 🔒 vai trò của bạn không xem được giá"
        }
      />

      {danhSach.length === 0 ? (
        /* 🔴 Chỉ đường TỪNG BƯỚC, không chỉ nói "lập đơn từ màn chi tiết đề nghị".
            Ban lãnh đạo tưởng nút Xuất Excel bị thiếu (11/08/2026), thật ra là chưa có đơn nào
            nên trang chi tiết không mở được. Màn trống là chỗ duy nhất để nói cho người dùng
            biết họ đang thiếu bước nào. */
        <EmptyState
          icon={ShoppingCart}
          title="Chưa có đơn đặt hàng nào"
          /* 🔴 PHẢI NÊU CẢ HAI ĐƯỜNG (sửa 18/08/2026). Câu cũ chỉ nói *"Đơn đặt hàng sinh ra
             từ đề nghị"* và chỉ một đường đi qua Quy trình mua hàng — từ 18/08/2026 Ban lãnh
             đạo đã mở thêm mục menu "Lập đơn mua hàng (PO)" lập được đơn KHÔNG gắn đề nghị.
             Để nguyên câu cũ là màn hình trống chỉ sai đường: người dùng đi phân bổ, hỏi giá,
             chờ duyệt báo giá... trong khi việc họ cần chỉ là bấm một mục menu. */
          description={
            "Chưa có đơn nào. Hai đường lập đơn: (1) mục menu “Lập đơn mua hàng (PO)” — đơn lập riêng, " +
            "không gắn phiếu đề nghị, hiện ngay các ô nhập liệu; (2) đơn GẮN với một phiếu đề nghị: " +
            "mở Quy trình mua hàng → bấm vào một đề nghị → phân bổ người phụ trách cho mọi dòng vật tư " +
            "→ nhập giá nhà cung cấp → trưởng bộ phận chốt nhà cung cấp → Lập đơn đặt hàng. " +
            "Có đơn rồi mới in và xuất Excel được."
          }
        />
      ) : (
        <Card>
          <CardContent>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã PO</TableHead>
                    <TableHead>Đề nghị</TableHead>
                    {quyen.xemNhaCungCap && <TableHead>Nhà cung cấp</TableHead>}
                    {quyen.xemNguoiPhuTrach && <TableHead>Phụ trách</TableHead>}
                    <TableHead>Giao dự kiến</TableHead>
                    {quyen.xemGia && <TableHead className="text-right">Giá trị</TableHead>}
                    <TableHead>Tiến độ nhận</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    {/* Cột xuất file — chỉ có nghĩa với vai trò xem được giá. */}
                    {quyen.xemGia && <TableHead className="text-right">Xuất</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {danhSach.map(({ po, tienDo, phanTram, conLai, giaTri }) => {
                    const tt = nhanAnToan(NHAN_TRANG_THAI_PO, po.trangThai);
                    const quaHan = conLai < 0 && po.trangThai !== "hoan_thanh";
                    return (
                      <TableRow key={po.id}>
                        <TableCell>
                          <Link href={`/don-hang/${po.id}`} className="font-semibold text-primary hover:underline">
                            {po.code}
                          </Link>
                        </TableCell>
                        {/* Đơn không gắn đề nghị (module Lập PO độc lập, 18/08/2026) thì nói
                            rõ bằng CHỮ, không để ô trống — ô trống trong bảng đọc ra là "dữ
                            liệu thiếu", còn đây là chuyện cố ý. */}
                        <TableCell className="text-sm text-text-desc">
                          {po.prCode
                            ? po.trangThai === "cho_de_nghi"
                              ? `${po.prCode} (chờ xác nhận)`
                              : po.prCode
                            : "Không gắn đề nghị"}
                        </TableCell>
                        {quyen.xemNhaCungCap && <TableCell className="text-sm">{po.supplierTen}</TableCell>}
                        {quyen.xemNguoiPhuTrach && (
                          <TableCell className="text-sm">{po.nguoiPhuTrachTen}</TableCell>
                        )}
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <span>{new Date(po.ngayGiaoDuKien).toLocaleDateString("vi-VN")}</span>
                            <span
                              className={`text-xs font-semibold ${quaHan ? "text-danger-soft" : conLai <= 3 ? "text-warning-soft" : "text-text-desc"}`}
                            >
                              {po.trangThai === "hoan_thanh"
                                ? "Đã hoàn thành"
                                : quaHan
                                  ? `Quá hạn ${Math.abs(conLai)} ngày`
                                  : `Còn ${conLai} ngày`}
                            </span>
                          </div>
                        </TableCell>
                        {quyen.xemGia && (
                          <TableCell className="text-right font-semibold">
                            {giaTri.toLocaleString("vi-VN")} ₫
                          </TableCell>
                        )}
                        <TableCell>
                          <ThanhTienDo
                            phanTram={phanTram}
                            tong={phanTram === 100 ? "success" : quaHan ? "danger" : "primary"}
                            nhan={`${tienDo.filter((d) => d.khoiLuongConLai === 0).length}/${tienDo.length} dòng đã nhận đủ`}
                          />
                        </TableCell>
                        <TableCell>
                          {/* PO "chờ đề nghị" (29/08/2026) dùng badge tím riêng, KHÔNG phải
                              StatusBadge chuẩn — xem `badge-cho-de-nghi.tsx` vì sao. */}
                          {po.trangThai === "cho_de_nghi" ? (
                            <BadgeChoDeNghi />
                          ) : (
                            <StatusBadge label={tt.nhan} tone={tt.tong} />
                          )}
                        </TableCell>
                        {/* Xuất Excel ngay tại danh sách — không phải mở chi tiết mới xuất được. */}
                        {quyen.xemGia && (
                          <TableCell className="text-right">
                            <NutXuatDonHangExcel poId={po.id} kieu="gon" />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Card List — Mobile */}
            <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
              {danhSach.map(({ po, tienDo, phanTram, conLai }) => {
                const tt = nhanAnToan(NHAN_TRANG_THAI_PO, po.trangThai);
                const quaHan = conLai < 0 && po.trangThai !== "hoan_thanh";
                return (
                  <Link
                    key={po.id}
                    href={`/don-hang/${po.id}`}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-primary">{po.code}</span>
                      {po.trangThai === "cho_de_nghi" ? (
                        <BadgeChoDeNghi />
                      ) : (
                        <StatusBadge label={tt.nhan} tone={tt.tong} />
                      )}
                    </div>
                    {quyen.xemNhaCungCap && <span className="text-sm text-text-secondary">{po.supplierTen}</span>}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-desc">Giao dự kiến</span>
                      <span className={quaHan ? "font-semibold text-danger-soft" : ""}>
                        {new Date(po.ngayGiaoDuKien).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <ThanhTienDo
                      phanTram={phanTram}
                      tong={phanTram === 100 ? "success" : quaHan ? "danger" : "primary"}
                      nhan={`${tienDo.filter((d) => d.khoiLuongConLai === 0).length}/${tienDo.length} dòng đã nhận đủ`}
                    />
                    {/* Thẻ cả dòng là <Link>; component tự chặn nổi bọt nên bấm nút không nhảy trang. */}
                    {quyen.xemGia && (
                      <span className="pt-1">
                        <NutXuatDonHangExcel poId={po.id} kieu="gon" />
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
