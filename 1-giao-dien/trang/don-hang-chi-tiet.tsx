"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { AlertTriangle, BadgeCheck, FileWarning, Lock, Printer } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { TimelineProgress } from "@/1-giao-dien/thanh-phan-dung-chung/timeline-progress";
import { BangTienDoPO } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-tien-do-po";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/1-giao-dien/nen-tang-ui/table";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  poDaGiaoDu,
  tinhTienDonHang,
  tinhTienDoPO,
  vuongMacXacNhanKho,
} from "@/2-quy-trinh/tinh-toan";
import { nhanAnToan, NHAN_TRANG_THAI_PO } from "@/2-quy-trinh/trang-thai";
import { docSoTien } from "@/6-tien-ich/doc-so-tien";
import { NutXuatDonHangExcel } from "@/1-giao-dien/thanh-phan-nghiep-vu/nut-xuat-don-hang";

export default function TrangChiTietDonHang() {
  const params = useParams<{ id: string }>();
  const { donHang, phieuNhan, giaDonHang, xacNhanKho, xacNhanTruongBP } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  const po = donHang.find((x) => x.id === params.id);
  const gia = giaDonHang.find((g) => g.poId === params.id);

  const phieuCuaPO = useMemo(
    () => (po ? phieuNhan.filter((p) => p.poId === po.id) : []),
    [po, phieuNhan],
  );

  const tienDo = useMemo(() => (po ? tinhTienDoPO(po, phieuCuaPO) : []), [po, phieuCuaPO]);

  /** Còn phiếu nào chưa đính kèm phiếu giao nhận không — luật ở `2-quy-trinh/tinh-toan.ts`. */
  const vuongMacTep = vuongMacXacNhanKho(phieuCuaPO);

  if (!po) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Không tìm thấy đơn đặt hàng"
        description="Đơn hàng này không tồn tại hoặc bạn không có quyền xem."
      />
    );
  }

  const tt = nhanAnToan(NHAN_TRANG_THAI_PO, po.trangThai);
  const daGiaoDu = poDaGiaoDu(tienDo);
  const tien = tinhTienDonHang(po, gia);

  function bamXacNhanKho() {
    xacNhanKho(po!.id, {
      uid: nguoiDung.uid,
      ten: nguoiDung.tenHienThi,
      thoiDiem: new Date().toISOString().slice(0, 10),
    });
  }

  function bamXacNhanTruongBP() {
    xacNhanTruongBP(po!.id, {
      uid: nguoiDung.uid,
      ten: nguoiDung.tenHienThi,
      thoiDiem: new Date().toISOString().slice(0, 10),
    });
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Thu mua", href: "/tong-quan" },
          { label: "Đơn đặt hàng", href: "/don-hang" },
          { label: po.code },
        ]}
        title={po.code}
        description={`Từ đề nghị ${po.prCode}${quyen.xemNhaCungCap ? ` · ${po.supplierTen}` : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Chỉ vai trò xem được giá mới in được — đơn gửi NCC bắt buộc có đơn giá.
                Mở tab mới để người dùng không mất trang đang xem sau khi in. */}
            {/* 🔒 Cả hai nút đòi quyền xem giá: đơn gửi nhà cung cấp buộc phải có đơn giá,
                nên không có bản "ẩn giá" của đơn mua hàng — cùng nguyên tắc với trang in. */}
            {/* Nút xuất Excel dùng chung với màn danh sách — xem `nut-xuat-don-hang.tsx`.
                Component tự lo quyền `xemGia` và luật chặn nên ở đây không kiểm lại. */}
            <NutXuatDonHangExcel poId={po.id} />
            {quyen.xemGia && (
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/in/don-hang/${po.id}`} target="_blank" />}>
                <Printer className="size-4" aria-hidden />
                In đơn mua hàng
              </Button>
            )}
            <StatusBadge label={tt.nhan} tone={tt.tong} />
          </div>
        }
      />

      {/* Thông tin PO */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-(--hp-md-card-gap) md:grid-cols-4">
          <ThongTin nhan="Mã dự án" giaTri={po.maDuAn} />
          <ThongTin
            nhan="Đề nghị nguồn"
            giaTri={po.prCode}
            href={`/de-nghi/${po.prId}`}
          />
          {quyen.xemNguoiPhuTrach && <ThongTin nhan="Người phụ trách" giaTri={po.nguoiPhuTrachTen} />}
          <ThongTin nhan="Ngày lập PO" giaTri={new Date(po.ngayLapPO).toLocaleDateString("vi-VN")} />
          <ThongTin
            nhan="Ngày giao dự kiến"
            giaTri={new Date(po.ngayGiaoDuKien).toLocaleDateString("vi-VN")}
          />
          {quyen.xemNhaCungCap && <ThongTin nhan="Nhà cung cấp" giaTri={po.supplierTen} />}
          {po.dieuKienGiaoHang && <ThongTin nhan="Điều kiện giao hàng" giaTri={po.dieuKienGiaoHang} />}
          {/* Các ô dưới đây lấy đúng tên nhãn trên biểu mẫu giấy của công ty */}
          {po.diaDiemGiaoHang && <ThongTin nhan="Địa điểm giao hàng" giaTri={po.diaDiemGiaoHang} />}
          {po.nguoiNhanHangTen && <ThongTin nhan="Người nhận hàng" giaTri={po.nguoiNhanHangTen} />}
          {po.dieuKhoanKhac && <ThongTin nhan="Điều khoản khác" giaTri={po.dieuKhoanKhac} />}
        </CardContent>
      </Card>

      {/* Timeline thời gian — component chuẩn V1.1 Phần E2, tái sử dụng từ bản cũ */}
      <Card>
        <CardContent>
          <TimelineProgress
            startDate={po.ngayLapPO}
            endDate={po.ngayGiaoDuKien}
            completed={po.trangThai === "hoan_thanh"}
            mocThucTe={phieuNhan
              .filter((p) => p.poId === po.id && p.trangThai === "da_nhap_kho")
              .map((p) => ({ ngay: p.ngayNhanThucTe, nhan: `Lần ${p.lanGiaoThu} · ${p.code}` }))}
          />
        </CardContent>
      </Card>

      {/* M5 — Bảng tiến độ nhận hàng theo từng lần giao */}
      <BangTienDoPO po={po} />

      {/* Khối GIÁ — chỉ vai trò được xem giá thấy (collection tm_donhang_gia riêng) */}
      {quyen.xemGia ? (
        <section className="flex flex-col gap-(--hp-md-row-gap)">
          <h2 className="text-h3 text-text-primary">Giá trị đơn hàng</h2>
          <Card>
            <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
              <div className="overflow-x-auto">
                <Table>
                  {/* Thứ tự cột giữ đúng biểu mẫu 1. DON HANG HPCONS.xlsx để người quen
                      dùng bản giấy đọc ra ngay: STT · Mã hàng · Tên hàng · Thông số kỹ thuật
                      · ĐVT · SL · Đơn giá · Thành tiền · Mục đích sử dụng */}
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-right">STT</TableHead>
                      <TableHead>Mã hàng</TableHead>
                      <TableHead>Tên hàng</TableHead>
                      <TableHead>Thông số kỹ thuật</TableHead>
                      <TableHead className="text-right">SL</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                      <TableHead>Mục đích sử dụng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {po.items.map((d) => {
                      const g = gia?.lines.find((l) => l.sttDong === d.sttDong);
                      const donGia = g?.donGia ?? 0;
                      return (
                        <TableRow key={d.sttDong}>
                          <TableCell className="text-right text-text-desc">{d.sttDong}</TableCell>
                          <TableCell className="text-text-desc">{d.maHang ?? "—"}</TableCell>
                          <TableCell className="font-medium">{d.tenVatLieu}</TableCell>
                          <TableCell className="text-text-secondary">{d.thongSoKyThuat ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            {d.khoiLuongDat.toLocaleString("vi-VN")} {d.donViTinh}
                          </TableCell>
                          <TableCell className="text-right">{donGia.toLocaleString("vi-VN")} ₫</TableCell>
                          <TableCell className="text-right font-semibold">
                            {(donGia * d.khoiLuongDat).toLocaleString("vi-VN")} ₫
                          </TableCell>
                          <TableCell className="text-text-secondary">{d.mucDichSuDung ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Khối tổng — đúng trình tự biểu mẫu: cộng tiền hàng → CK → đã trừ CK
                  → thuế GTGT → tổng thanh toán → đọc thành chữ. */}
              <dl className="ml-auto flex w-full max-w-sm flex-col gap-1 text-sm">
                <DongTien nhan="Cộng tiền hàng (chưa trừ CK)" giaTri={tien.congTienHang} />
                <DongTien nhan="Số tiền CK" giaTri={tien.chietKhau} />
                <DongTien nhan="Cộng tiền hàng (đã trừ CK)" giaTri={tien.congTienHangSauCK} />
                <DongTien
                  nhan={`Tiền thuế GTGT (${tien.thueSuatGTGT}%)`}
                  giaTri={tien.tienThueGTGT}
                />
                <DongTien nhan="Tổng tiền thanh toán" giaTri={tien.tongThanhToan} tong />
              </dl>
              <p className="text-right text-xs italic text-text-desc">
                {docSoTien(tien.tongThanhToan)}
              </p>
              {gia?.dieuKhoanThanhToan && (
                <p className="text-sm text-text-secondary">
                  <span className="text-text-desc">Điều khoản thanh toán: </span>
                  {gia.dieuKhoanThanhToan}
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      ) : (
        <Card>
          <CardContent className="flex items-center gap-3 text-sm text-text-desc">
            <Lock className="size-4 shrink-0" aria-hidden />
            <span>
              Vai trò <strong className="text-text-secondary">{nguoiDung.chucDanh}</strong> không được xem
              giá. Đơn giá nằm ở collection riêng <code className="text-xs">tm_donhang_gia</code> — chặn ở
              tầng dữ liệu, không phải ẩn ở giao diện.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Điều kiện hoàn thành PO — 4 lớp (thêm phiếu giao nhận ngày 11/08/2026) */}
      <section className="flex flex-col gap-(--hp-md-row-gap)">
        <h2 className="text-h3 text-text-primary">Hoàn thành đơn hàng</h2>
        <Card>
          <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
            <ol className="flex flex-col gap-2">
              <DieuKien
                so={1}
                nhan="Đã giao đủ toàn bộ khối lượng"
                xong={daGiaoDu}
                moTa={daGiaoDu ? "Mọi dòng còn lại = 0" : "Còn dòng chưa nhận đủ"}
              />
              {/* 🔴 ĐIỀU KIỆN MỚI — chỉ đạo Ban lãnh đạo 11/08/2026: *"thủ kho khi nhận hàng
                  phải đính kèm file phiếu giao nhận thì mới được bấm hoàn thành"*.
                  Luật ở `2-quy-trinh/tinh-toan.ts` → `vuongMacXacNhanKho`, KHÔNG tính lại ở
                  đây — nút bấm bên dưới cũng gọi đúng hàm đó. */}
              <DieuKien
                so={2}
                nhan="Mọi lần giao đều có phiếu giao nhận đính kèm"
                xong={vuongMacTep === null}
                moTa={vuongMacTep ?? `Đủ ${phieuCuaPO.length} phiếu giao nhận`}
              />
              <DieuKien
                so={3}
                nhan="Thủ kho công trình xác nhận"
                xong={Boolean(po.xacNhanKho)}
                moTa={
                  po.xacNhanKho
                    ? `${po.xacNhanKho.ten} · ${new Date(po.xacNhanKho.thoiDiem).toLocaleDateString("vi-VN")}`
                    : "Chưa xác nhận"
                }
              />
              <DieuKien
                so={4}
                nhan="Trưởng bộ phận thu mua xác nhận"
                xong={Boolean(po.xacNhanTruongBP)}
                moTa={
                  po.xacNhanTruongBP
                    ? `${po.xacNhanTruongBP.ten} · ${new Date(po.xacNhanTruongBP.thoiDiem).toLocaleDateString("vi-VN")}`
                    : "Chưa xác nhận"
                }
              />
            </ol>

            <div className="flex flex-wrap items-center gap-2 border-t border-divider pt-4">
              {quyen.xacNhanKho && daGiaoDu && !po.xacNhanKho && (
                <>
                  {/* Nút KHÓA khi còn phiếu thiếu tệp — không giấu nút, vì giấu đi thì thủ
                      kho tưởng mình không có quyền. Khóa kèm lý do ngay bên cạnh. */}
                  <Button onClick={bamXacNhanKho} disabled={vuongMacTep !== null}>
                    <BadgeCheck className="size-4" aria-hidden />
                    Thủ kho xác nhận đã nhận đủ
                  </Button>
                  {vuongMacTep && (
                    <span className="flex items-start gap-1.5 text-sm text-warning-soft">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {vuongMacTep}
                    </span>
                  )}
                </>
              )}
              {quyen.xacNhanTruongBP && daGiaoDu && po.xacNhanKho && !po.xacNhanTruongBP && (
                <Button onClick={bamXacNhanTruongBP}>
                  <BadgeCheck className="size-4" aria-hidden />
                  Trưởng bộ phận xác nhận hoàn thành
                </Button>
              )}
              {po.trangThai === "hoan_thanh" && (
                <p className="rounded-lg bg-success-bg px-3 py-2 text-sm text-success-soft">
                  PO đã hoàn thành — hồ sơ chuyển sang app Kế toán, PO khóa không sửa được nữa.
                </p>
              )}
              {!daGiaoDu && (
                <p className="text-sm text-text-desc">
                  Chưa đủ điều kiện — phải giao đủ khối lượng trước khi xác nhận hoàn thành.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function ThongTin({ nhan, giaTri, href }: { nhan: string; giaTri: string; href?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-text-desc">{nhan}</span>
      {href ? (
        <Link href={href} className="text-sm font-medium text-primary hover:underline">
          {giaTri}
        </Link>
      ) : (
        <span className="text-sm font-medium text-text-primary">{giaTri}</span>
      )}
    </div>
  );
}

/** Một dòng của khối tổng tiền. `tong` = dòng Tổng tiền thanh toán, kẻ viền trên cho nổi. */
function DongTien({ nhan, giaTri, tong }: { nhan: string; giaTri: number; tong?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        tong ? "border-t border-divider pt-1.5" : ""
      }`}
    >
      <dt className={tong ? "font-bold text-text-primary" : "text-text-desc"}>{nhan}</dt>
      <dd className={tong ? "text-base font-bold text-primary" : "font-medium text-text-primary"}>
        {giaTri.toLocaleString("vi-VN")} ₫
      </dd>
    </div>
  );
}

function DieuKien({ so, nhan, xong, moTa }: { so: number; nhan: string; xong: boolean; moTa: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          xong ? "bg-success text-white" : "bg-muted text-text-desc"
        }`}
        aria-hidden
      >
        {xong ? "✓" : so}
      </span>
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${xong ? "text-text-primary" : "text-text-secondary"}`}>
          {nhan}
        </span>
        <span className={`text-xs ${xong ? "text-success-soft" : "text-text-desc"}`}>{moTa}</span>
      </div>
    </li>
  );
}
