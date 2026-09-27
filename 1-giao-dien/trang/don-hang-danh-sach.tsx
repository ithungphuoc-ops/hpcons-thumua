"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { ChevronRight, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { ThanhTienDo } from "@/1-giao-dien/thanh-phan-nghiep-vu/thanh-tien-do";
import { NutXuatDonHangExcel } from "@/1-giao-dien/thanh-phan-nghiep-vu/nut-xuat-don-hang";
import { BangHangTrongDon, TheHangTrongDon } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-hang-trong-don";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/1-giao-dien/nen-tang-ui/table";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { duongDanGocTheoQuyen } from "@/2-quy-trinh/dieu-huong";
import { gomTheoCongTrinh, tenCongTrinhCuaPO } from "@/2-quy-trinh/gom-cong-trinh";
import { khopTimDonHang } from "@/2-quy-trinh/tim-kiem";
import { useTuKhoaBangQuyTrinh } from "@/1-giao-dien/khung-app/tu-khoa-bang-quy-trinh";
import { DaiDangLoc } from "@/1-giao-dien/thanh-phan-dung-chung/dai-dang-loc";
import {
  phanTramPO,
  soNgayConLai,
  tinhTienChiTietPO,
  tinhTienDoPO,
  tongGiaTriPO,
} from "@/2-quy-trinh/tinh-toan";
import { nhanAnToan, NHAN_TRANG_THAI_PO } from "@/2-quy-trinh/trang-thai";
import { BadgeChoDeNghi } from "@/1-giao-dien/thanh-phan-nghiep-vu/badge-cho-de-nghi";

/**
 * ★★ MÀN ĐƠN ĐẶT HÀNG DẠNG NHÓM + XỔ "HÀNG TRONG ĐƠN" — Sếp 27/09/2026 duyệt bản demo (artifact
 * "Demo Đơn đặt hàng"): *"cửa sổ theo dõi đơn hàng cũng làm tương tự"* màn Theo dõi đề nghị, rồi
 * *"Đưa đơn đặt hàng lên app"*.
 *
 * · Nhóm theo CÔNG TRÌNH (mặc định) hoặc NHÀ CUNG CẤP — nhóm NCC chỉ có khi vai trò xem được NCC.
 *   Dòng nhóm mở sẵn, bấm để gọn (cùng kiểu màn Theo dõi / Công nợ).
 * · Bấm một đơn (hoặc mũi tên đầu dòng) → xổ bảng hàng trong đơn ngay bên dưới (`BangHangTrongDon`).
 * · Canh giữa, chữ luôn xuống dòng (Sếp chốt cho các bảng từ 26–27/09/2026).
 */
type CachNhom = "cong_trinh" | "nha_cung_cap";

export default function TrangDanhSachDonHang() {
  const { donHang, phieuNhan, giaDonHang, deNghi } = useDuLieu();
  const { quyen } = useNguoiDung();
  const [nhomTheo, setNhomTheo] = useState<CachNhom>("cong_trinh");
  /** Nhóm đang GỌN — giữ danh sách "đang gọn" để nhóm mới xuất hiện tự mở. */
  const [nhomDong, setNhomDong] = useState<Set<string>>(new Set());
  /** Đơn đang xổ bảng hàng. */
  const [dongMo, setDongMo] = useState<Set<string>>(new Set());
  const doiTrongSet = (id: string) => (truoc: Set<string>) => {
    const moi = new Set(truoc);
    if (moi.has(id)) moi.delete(id);
    else moi.add(id);
    return moi;
  };

  const danhSach = useMemo(
    () =>
      donHang.map((po) => {
        const tienDo = tinhTienDoPO(
          po,
          phieuNhan.filter((p) => p.poId === po.id),
        );
        const gia = giaDonHang.find((g) => g.poId === po.id);
        return {
          po,
          tienDo,
          phanTram: phanTramPO(tienDo),
          conLai: soNgayConLai(po.ngayGiaoDuKien),
          giaTri: tongGiaTriPO(po, gia),
          /* Đơn giá / thành tiền từng dòng — cùng hàm trang chi tiết đơn dùng. `giaDonHang` chỉ có
             dữ liệu với vai trò được xem giá; bảng hàng còn chặn thêm bằng `quyen.xemGia`. */
          giaTheoDong: new Map(
            tinhTienChiTietPO(po, gia).dong.map((t) => [
              t.sttDong,
              { donGia: t.donGia, thanhTien: t.thanhTien },
            ]),
          ),
        };
      }),
    [donHang, phieuNhan, giaDonHang],
  );

  /* Nhóm NCC chỉ có nghĩa với vai trò xem được NCC — vai trò khác luôn gom theo công trình. */
  const cachNhom: CachNhom = quyen.xemNhaCungCap ? nhomTheo : "cong_trinh";
  /* ★ Lọc theo ô tìm ở thanh trên — Sếp 27/09/2026 *"Ở tab đơn hàng cũng vậy"*: gõ mã đề nghị nào thì
     chỉ hiện đơn của đề nghị đó. Luật khớp ở `2-quy-trinh/tim-kiem.ts` → `khopTimDonHang`. */
  const tuKhoaBang = useTuKhoaBangQuyTrinh();
  const danhSachLoc = useMemo(
    () =>
      danhSach.filter((m) =>
        khopTimDonHang(
          m.po,
          deNghi.find((d) => d.id === m.po.prId),
          tuKhoaBang,
          quyen.xemNhaCungCap,
        ),
      ),
    [danhSach, deNghi, tuKhoaBang, quyen.xemNhaCungCap],
  );
  const cacNhom = useMemo(
    () =>
      gomTheoCongTrinh(danhSachLoc, (m) =>
        cachNhom === "nha_cung_cap" ? m.po.supplierTen ?? "" : tenCongTrinhCuaPO(m.po, deNghi),
      ),
    [danhSachLoc, cachNhom, deNghi],
  );

  /* Số cột — dòng nhóm và dòng xổ dùng `colSpan` bằng đúng số này (cột ẩn theo quyền). */
  const soCot =
    6 +
    (quyen.xemNhaCungCap ? 1 : 0) +
    (quyen.xemNguoiPhuTrach ? 1 : 0) +
    (quyen.xemGia ? 2 : 0);

  function doiCachNhom(c: CachNhom) {
    setNhomTheo(c);
    setNhomDong(new Set());
  }

  return (
    <>
      <PageHeader
        /* Thủ kho vào được màn này nhưng KHÔNG vào được `/tong-quan` — xem `duongDanGocTheoQuyen`. */
        crumbs={[
          { label: "Thu mua", href: duongDanGocTheoQuyen(quyen) },
          { label: "Đơn đặt hàng" },
        ]}
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
            biết họ đang thiếu bước nào.
            🔴 TẠM NGƯNG 08/09/2026: bỏ nhánh "mục menu Lập đơn mua hàng (PO)" — mục đó đã ẩn
            khỏi menu (xem `2-quy-trinh/dieu-huong.ts`), PO độc lập không tạo được nữa. Chỉ còn
            đúng MỘT đường: qua đề nghị. Xem lịch sử git nếu sau này mở lại PO độc lập. */
        <EmptyState
          icon={ShoppingCart}
          title="Chưa có đơn đặt hàng nào"
          description={
            "Chưa có đơn nào. Lập đơn từ một phiếu đề nghị: mở Quy trình mua hàng → bấm vào một " +
            "đề nghị → phân bổ người phụ trách cho mọi dòng vật tư → nhập giá nhà cung cấp → " +
            "trưởng bộ phận chốt nhà cung cấp → Lập đơn đặt hàng. Có đơn rồi mới in và xuất Excel được."
          }
        />
      ) : (
        <div className="flex flex-col gap-(--hp-md-card-gap)">
          <DaiDangLoc tuKhoa={tuKhoaBang} soKetQua={danhSachLoc.length} donVi="đơn" />
          {quyen.xemNhaCungCap && (
            <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Cách gom nhóm đơn">
              <span className="text-xs font-semibold tracking-wide text-text-desc uppercase">Nhóm theo</span>
              {(
                [
                  ["cong_trinh", "Công trình"],
                  ["nha_cung_cap", "Nhà cung cấp"],
                ] as const
              ).map(([ma, nhan]) => (
                <button
                  key={ma}
                  type="button"
                  role="tab"
                  aria-selected={cachNhom === ma}
                  onClick={() => doiCachNhom(ma)}
                  className={`inline-flex min-h-11 items-center rounded-lg border px-3 text-sm font-medium transition-colors ${
                    cachNhom === ma
                      ? "border-primary bg-primary-bg text-primary"
                      : "border-border text-text-secondary hover:border-primary hover:text-primary"
                  }`}
                >
                  {nhan}
                </button>
              ))}
            </div>
          )}

          <Card>
            <CardContent>
              {/* `[&>[data-slot=table-container]]:overflow-visible`: div này là khung cuộn ngang thật. */}
              <div className="thanh-keo-ngang-ro hidden overflow-x-auto md:block [&>[data-slot=table-container]]:overflow-visible">
                <Table className="[&_td]:text-center [&_td]:whitespace-normal [&_th]:text-center [&_th]:whitespace-normal">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã PO</TableHead>
                      <TableHead>Đề nghị</TableHead>
                      {quyen.xemNhaCungCap && <TableHead>Nhà cung cấp</TableHead>}
                      {quyen.xemNguoiPhuTrach && <TableHead>Phụ trách</TableHead>}
                      <TableHead>Giao dự kiến</TableHead>
                      {quyen.xemGia && <TableHead>Giá trị</TableHead>}
                      <TableHead>Tiến độ nhận</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      {/* Cột xuất file — chỉ có nghĩa với vai trò xem được giá. */}
                      {quyen.xemGia && <TableHead>Xuất</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cacNhom.map((n) => {
                      const gon = nhomDong.has(n.khoa);
                      const tongGiaTri = n.muc.reduce((s, m) => s + m.giaTri, 0);
                      return (
                        <Fragment key={n.khoa}>
                          <TableRow className="border-t-2 border-t-primary/40 hover:bg-transparent has-aria-expanded:bg-transparent">
                            {/* Nền đặt ở Ô — dòng có nút `aria-expanded` nên lớp gốc
                                `has-aria-expanded:bg-muted/50` của TableRow sẽ đè mất nền xanh. */}
                            <TableCell
                              colSpan={soCot}
                              className="border-l-4 border-l-primary bg-primary/15 py-1.5 text-left!"
                            >
                              <button
                                type="button"
                                aria-expanded={!gon}
                                onClick={() => setNhomDong(doiTrongSet(n.khoa))}
                                className="sticky left-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-left text-sm md:min-h-9"
                              >
                                <ChevronRight
                                  className={`size-4 shrink-0 text-primary transition-transform ${gon ? "" : "rotate-90"}`}
                                  aria-hidden
                                />
                                <span className="text-base font-bold text-primary uppercase">{n.ten}</span>
                                <span className="text-xs text-text-desc">
                                  {n.muc.length} đơn
                                  {quyen.xemGia && (
                                    <>
                                      {" "}
                                      · giá trị{" "}
                                      <span className="font-semibold tabular-nums text-text-primary">
                                        {tongGiaTri.toLocaleString("vi-VN")} ₫
                                      </span>
                                    </>
                                  )}
                                </span>
                              </button>
                            </TableCell>
                          </TableRow>
                          {!gon &&
                            n.muc.map(({ po, tienDo, phanTram, conLai, giaTri, giaTheoDong }) => {
                              const tt = nhanAnToan(NHAN_TRANG_THAI_PO, po.trangThai);
                              const quaHan = conLai < 0 && po.trangThai !== "hoan_thanh";
                              const mo = dongMo.has(po.id);
                              const doiMo = () => setDongMo(doiTrongSet(po.id));
                              return (
                                <Fragment key={po.id}>
                                  <TableRow onClick={doiMo} className="cursor-pointer">
                                    <TableCell>
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            doiMo();
                                          }}
                                          aria-expanded={mo}
                                          aria-label="Xem hàng trong đơn"
                                          title="Xem hàng trong đơn"
                                          className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-muted"
                                        >
                                          <ChevronRight
                                            className={`size-4 shrink-0 transition-transform ${mo ? "rotate-90" : ""}`}
                                            aria-hidden
                                          />
                                        </button>
                                        <Link
                                          href={`/don-hang/${po.id}`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="font-semibold text-primary hover:underline"
                                        >
                                          {po.code}
                                        </Link>
                                      </div>
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
                                      <div className="flex flex-col items-center">
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
                                      <TableCell className="font-semibold tabular-nums">
                                        {giaTri.toLocaleString("vi-VN")} ₫
                                      </TableCell>
                                    )}
                                    <TableCell>
                                      <ThanhTienDo
                                        phanTram={phanTram}
                                        tong={phanTram === 100 ? "success" : quaHan ? "danger" : "primary"}
                                        nhan={`${tienDo.filter((d) => d.khoiLuongConLai === 0).length}/${tienDo.length} dòng đã nhận đủ`}
                                        className="mx-auto min-w-36"
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
                                      <TableCell onClick={(e) => e.stopPropagation()}>
                                        <NutXuatDonHangExcel poId={po.id} kieu="gon" />
                                      </TableCell>
                                    )}
                                  </TableRow>
                                  {mo && (
                                    <TableRow className="hover:bg-transparent">
                                      <TableCell colSpan={soCot} className="pt-1 pb-3 text-left!">
                                        <BangHangTrongDon
                                          tienDo={tienDo}
                                          giaTheoDong={quyen.xemGia ? giaTheoDong : undefined}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </Fragment>
                              );
                            })}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Card List — Mobile */}
              <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
                {cacNhom.map((n) => {
                  const gon = nhomDong.has(n.khoa);
                  return (
                    <Fragment key={n.khoa}>
                      <button
                        type="button"
                        aria-expanded={!gon}
                        onClick={() => setNhomDong(doiTrongSet(n.khoa))}
                        className="flex min-h-11 w-full items-center gap-2 rounded-lg border-l-4 border-l-primary bg-primary/15 px-3 py-2 text-left"
                      >
                        <ChevronRight
                          className={`size-4 shrink-0 text-primary transition-transform ${gon ? "" : "rotate-90"}`}
                          aria-hidden
                        />
                        <span className="text-sm font-bold text-primary uppercase">{n.ten}</span>
                        <span className="text-xs text-text-desc">{n.muc.length} đơn</span>
                      </button>
                      {!gon &&
                        n.muc.map(({ po, tienDo, phanTram, conLai, giaTheoDong }) => {
                          const tt = nhanAnToan(NHAN_TRANG_THAI_PO, po.trangThai);
                          const quaHan = conLai < 0 && po.trangThai !== "hoan_thanh";
                          const mo = dongMo.has(po.id);
                          return (
                            <div
                              key={po.id}
                              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <Link href={`/don-hang/${po.id}`} className="text-sm font-semibold text-primary">
                                  {po.code}
                                </Link>
                                {po.trangThai === "cho_de_nghi" ? (
                                  <BadgeChoDeNghi />
                                ) : (
                                  <StatusBadge label={tt.nhan} tone={tt.tong} />
                                )}
                              </div>
                              {quyen.xemNhaCungCap && (
                                <span className="text-sm text-text-secondary">{po.supplierTen}</span>
                              )}
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
                              {quyen.xemGia && (
                                <span className="pt-1">
                                  <NutXuatDonHangExcel poId={po.id} kieu="gon" />
                                </span>
                              )}
                              {/* Vùng chạm 44px (V1.1). */}
                              <button
                                type="button"
                                aria-expanded={mo}
                                onClick={() => setDongMo(doiTrongSet(po.id))}
                                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary/30 bg-primary-bg px-3 text-sm font-medium text-primary"
                              >
                                <ChevronRight
                                  className={`size-4 shrink-0 transition-transform ${mo ? "rotate-90" : ""}`}
                                  aria-hidden
                                />
                                {mo ? "Ẩn hàng trong đơn" : `Xem ${tienDo.length} mặt hàng`}
                              </button>
                              {mo && (
                                <TheHangTrongDon
                                  tienDo={tienDo}
                                  giaTheoDong={quyen.xemGia ? giaTheoDong : undefined}
                                />
                              )}
                            </div>
                          );
                        })}
                    </Fragment>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
