"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { ChevronRight, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { ThanhTienDo } from "@/1-giao-dien/thanh-phan-nghiep-vu/thanh-tien-do";
import { NutXuatDonHangExcel } from "@/1-giao-dien/thanh-phan-nghiep-vu/nut-xuat-don-hang";
import { NutXuatTheoDoiDonHang } from "@/1-giao-dien/thanh-phan-nghiep-vu/nut-xuat-theo-doi-don-hang";
import { BangHangTrongDon, TheHangTrongDon } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-hang-trong-don";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { OChonNgay } from "@/1-giao-dien/thanh-phan-dung-chung/o-chon-ngay";
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
import {
  chuTheoDoiHan,
  chuTheoDoiWorkflow,
  dungDongTheoDoiDonHang,
  ngayNganTheoDoi,
  soNgayQuaHanChuaGiao,
} from "@/2-quy-trinh/theo-doi-don-hang";
import { phieuGocCua } from "@/2-quy-trinh/nhan-ban-de-nghi";
import { toast } from "sonner";

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
  const { donHang, phieuNhan, giaDonHang, deNghi, ghiNgayUpWorkflow } = useDuLieu();
  const { quyen, nguoiDung } = useNguoiDung();
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
          /* Các cột theo mẫu Excel "Bảng theo dõi đơn mua hàng" — Sếp 02/10/2026. */
          td: (() => {
            const dn = deNghi.find((d) => d.id === po.prId);
            return dungDongTheoDoiDonHang(
              po,
              dn,
              phieuNhan.filter((p) => p.poId === po.id),
              gia,
              dn ? phieuGocCua(dn, deNghi) : undefined,
            );
          })(),
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
    [donHang, phieuNhan, giaDonHang, deNghi],
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
    17 +
    (quyen.xemNhaCungCap ? 1 : 0) +
    (quyen.xemNguoiPhuTrach ? 1 : 0) +
    (quyen.xemGia ? 4 : 0);

  /* Ai ghi được Ngày up workflow — cùng luật tầng ghi (`ghiNgayUpWorkflow`); ô chỉ là lối vào. */
  const duocGhiWorkflow = (uidPhuTrach: string | undefined) =>
    quyen.lapPO && (quyen.suaPODaChot || uidPhuTrach === nguoiDung.uid);
  function doiNgayWorkflow(poId: string, ngay: string) {
    const loi = ghiNgayUpWorkflow(poId, ngay);
    if (loi) toast.error(loi);
  }
  /* STT chạy liền qua các nhóm, như cột STT của mẫu Excel. */
  let stt = 0;

  /* ★ Dòng cho nút "Xuất Excel" cả bảng (Sếp 02/10/2026) — ĐÚNG thứ tự đang hiện (theo nhóm), đã
     qua ô tìm ở thanh trên. Số liệu lấy nguyên `td` / `giaTri` của bảng, không tính lại. */
  const dongXuat = useMemo(
    () =>
      cacNhom.flatMap((n) =>
        n.muc.map(({ po, td, giaTri, conLai }) => ({
          po,
          td,
          giaTri,
          trangThai: nhanAnToan(NHAN_TRANG_THAI_PO, po.trangThai).nhan,
          quaHanChuaGiao: soNgayQuaHanChuaGiao(po, td, conLai),
        })),
      ),
    [cacNhom],
  );

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
          { label: "Theo dõi đơn hàng" },
        ]}
        title="Theo dõi đơn hàng"
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
          {/* Hàng công cụ: "Nhóm theo" (chỉ vai trò xem được NCC) bên trái, "Xuất Excel" bên phải. */}
          <div className="flex flex-wrap items-center justify-between gap-2">
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
            <span className="ml-auto">
              <NutXuatTheoDoiDonHang
                cacDong={dongXuat}
                quyen={{
                  xemGia: quyen.xemGia,
                  xemNhaCungCap: quyen.xemNhaCungCap,
                  xemNguoiPhuTrach: quyen.xemNguoiPhuTrach,
                }}
                nguoiXuat={nguoiDung.tenHienThi}
              />
            </span>
          </div>

          <Card>
            <CardContent>
              {/* `[&>[data-slot=table-container]]:overflow-visible`: div này là khung cuộn THẬT (cả hai chiều).
                  ★ Sếp 02/10/2026: *"fix lại thanh cuộn ngang, luôn hiện trên màn hình. và free panes
                  thanh tiêu đề"*. Trước đây khung chỉ cuộn NGANG và cao theo nội dung, nên thanh cuộn
                  ngang nằm tít đáy bảng — phải kéo trang xuống cuối mới thấy. Nay khung CAO TỐI ĐA bằng
                  phần màn còn lại và tự cuộn dọc: thanh ngang luôn nằm ở đáy màn hình, và hàng tiêu đề
                  `sticky` dính trên đỉnh khung khi cuộn (giống Freeze Panes của Excel).
                  📌 `16rem` = thanh trên (60px) + tiêu đề trang + hàng "Nhóm theo" + lề thẻ, đo trên màn
                  1080p. Khung ngắn hơn nội dung thì chỉ khung cuộn, trang không cuộn thêm. */}
              <div className="thanh-keo-ngang-ro hidden overflow-auto md:block md:max-h-[calc(100dvh-16rem)] [&>[data-slot=table-container]]:overflow-visible">
                {/* ★ Hàng tiêu đề chữ IN ĐẬM + đường kẻ ngăn từng ô — Sếp 02/10/2026 (khoanh đỏ cả hàng
                    tiêu đề): *"e dùng chữ in đậm và thêm boder ngăn cách các ô nha"*. Chỉ áp cho
                    `thead`; thân bảng giữ đường kẻ ngang giữa các dòng như cũ.
                    📌 Dùng `border-input` (30%) chứ không `border-border` (10%): đo trên màn, viền 10%
                    gần như không thấy được giữa các ô tiêu đề — tức kẻ mà như không kẻ. */}
                {/* ★ CỐ ĐỊNH TIÊU ĐỀ: mọi ô `thead` `sticky` (tầng 1 ở `top-0`, tầng 2 ở `top-12` = đúng
                    chiều cao 48px của tầng 1), có nền `bg-card` để thân bảng không lộ qua khi cuộn.
                    ★ GIÃN CỘT — Sếp 02/10/2026: *"Dãn chiều rộng cột ra. Do có thanh cuộn ngang nên ko
                    bị giới hạn chiều rộng cột"*. Bỏ khung cứng `min-w-[160rem]` (cột phải co lại chia
                    nhau 160rem), thay bằng BỀ RỘNG TỐI THIỂU TỪNG CỘT ở `TableHead` — bảng rộng bằng
                    tổng các cột, chữ vẫn xuống dòng trong cột.
                    🔴 ĐƯỜNG KẺ Ô TIÊU ĐỀ VẼ BẰNG `shadow inset`, KHÔNG BẰNG `border`: bảng dùng
                    `border-collapse` (preflight), mà Chrome vẽ viền gộp thuộc về BẢNG chứ không thuộc
                    ô — ô `sticky` dính lại còn viền thì trôi đi, đo trên màn: cuộn xuống là hàng tiêu
                    đề mất sạch đường kẻ. Bóng thuộc về ô nên đi theo ô. Mỗi ô vẽ cạnh PHẢI + DƯỚI;
                    tầng 1 vẽ thêm cạnh TRÊN, ô đầu bảng vẽ thêm cạnh TRÁI — không cạnh nào bị đôi. */}
                <Table className="[&_td]:text-center [&_td]:whitespace-normal [&_th]:text-center [&_th]:whitespace-normal [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-card [&_thead_th]:font-bold [&_thead_th]:shadow-[inset_-1px_-1px_0_0_var(--color-input)] [&_thead_tr:first-child_th]:shadow-[inset_-1px_-1px_0_0_var(--color-input),inset_0_1px_0_0_var(--color-input)] [&_thead_tr:first-child_th:first-child]:shadow-[inset_-1px_-1px_0_0_var(--color-input),inset_1px_1px_0_0_var(--color-input)] [&_thead_tr:nth-child(2)_th]:top-12">
                  {/* ★ HAI TẦNG TIÊU ĐỀ theo mẫu Excel (Sếp 02/10/2026): nhóm "Công trình" và "Nhà cung
                      cấp" mỗi nhóm ba cột ngày, mỗi nhóm có cột "Theo dõi" riêng. */}
                  <TableHeader>
                    <TableRow>
                      <TableHead rowSpan={2} className="min-w-14">STT</TableHead>
                      <TableHead rowSpan={2} className="min-w-28">Mã đề xuất</TableHead>
                      <TableHead rowSpan={2} className="min-w-40">Số đơn hàng</TableHead>
                      {quyen.xemNhaCungCap && <TableHead rowSpan={2} className="min-w-64">Nhà cung cấp</TableHead>}
                      <TableHead rowSpan={2} className="min-w-64">Mục đích sử dụng</TableHead>
                      <TableHead rowSpan={2} className="min-w-52">Nơi sử dụng</TableHead>
                      {quyen.xemGia && <TableHead rowSpan={2} className="min-w-32">Giá trị</TableHead>}
                      <TableHead colSpan={3}>Công trình</TableHead>
                      <TableHead rowSpan={2} className="min-w-20">Theo dõi</TableHead>
                      <TableHead colSpan={3}>Nhà cung cấp</TableHead>
                      <TableHead rowSpan={2} className="min-w-20">Theo dõi</TableHead>
                      <TableHead rowSpan={2} className="min-w-48">Người nhận</TableHead>
                      {quyen.xemNguoiPhuTrach && (
                        <TableHead rowSpan={2} className="min-w-48">Nhân viên thực hiện đơn hàng</TableHead>
                      )}
                      <TableHead rowSpan={2} className="min-w-40">Ghi chú</TableHead>
                      {quyen.xemGia && <TableHead rowSpan={2} className="min-w-32">Ngày hoá đơn / phiếu giao hàng</TableHead>}
                      <TableHead rowSpan={2} className="min-w-44">Ngày up workflow</TableHead>
                      {quyen.xemGia && <TableHead rowSpan={2} className="min-w-20">Theo dõi</TableHead>}
                      <TableHead rowSpan={2} className="min-w-36">Trạng thái</TableHead>
                      {/* Cột xuất file — chỉ có nghĩa với vai trò xem được giá. */}
                      {quyen.xemGia && <TableHead rowSpan={2} className="min-w-28">Xuất</TableHead>}
                    </TableRow>
                    <TableRow>
                      <TableHead className="min-w-28">Ngày lập đề nghị</TableHead>
                      <TableHead className="min-w-28">Ngày đề nghị cấp</TableHead>
                      <TableHead className="min-w-28">Ngày nhận hàng</TableHead>
                      <TableHead className="min-w-28">Ngày đặt hàng</TableHead>
                      <TableHead className="min-w-32">Ngày thoả thuận giao hàng</TableHead>
                      <TableHead className="min-w-32">Ngày giao hàng</TableHead>
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
                            n.muc.map(({ po, td, tienDo, conLai, giaTri, giaTheoDong }) => {
                              const tt = nhanAnToan(NHAN_TRANG_THAI_PO, po.trangThai);
                              const mo = dongMo.has(po.id);
                              stt += 1;
                              /* Chưa giao lần nào mà đã quá ngày thoả thuận — bảng cũ báo "Quá hạn N
                                 ngày", bố cục mới giữ lại ở ô "Ngày giao hàng" (phản biện 02/10/2026). */
                              const quaHanChuaGiao = soNgayQuaHanChuaGiao(po, td, conLai);
                              const doiMo = () => setDongMo(doiTrongSet(po.id));
                              return (
                                <Fragment key={po.id}>
                                  {/* 🔴 DÒNG KHÔNG CÒN TỰ XỔ KHI BẤM — Sếp 02/10/2026: *"tắt chức năng xổ dòng tự động…
                                      khi bấm zô mũi tên thì mới xổ. Hiện trạng chỉ cần click zô mục nào cũng
                                      tự xổ"*. Bảng giờ có ô nhập (Ngày up workflow) và nút Excel nằm ngay trên
                                      dòng; bấm nhầm một chỗ là bảng hàng bung ra đẩy cả bảng xuống. Chỉ còn
                                      MŨI TÊN đầu ô "Số đơn hàng" là chỗ xổ / gọn. */}
                                  <TableRow>
                                    <TableCell className="tabular-nums">{stt}</TableCell>
                                    <TableCell className="text-sm">{td.maDeXuat}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          type="button"
                                          onClick={doiMo}
                                          aria-expanded={mo}
                                          aria-label={mo ? "Ẩn hàng trong đơn" : "Xem hàng trong đơn"}
                                          title={mo ? "Ẩn hàng trong đơn" : "Xem hàng trong đơn"}
                                          /* size-8 thay size-6: nay là chỗ bấm DUY NHẤT để xổ, phải dễ trúng. */
                                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-muted"
                                        >
                                          <ChevronRight
                                            className={`size-4 shrink-0 transition-transform ${mo ? "rotate-90" : ""}`}
                                            aria-hidden
                                          />
                                        </button>
                                        <Link
                                          href={`/don-hang/${po.id}`}
                                          className="font-semibold text-primary hover:underline"
                                        >
                                          {po.code}
                                        </Link>
                                      </div>
                                    </TableCell>
                                    {quyen.xemNhaCungCap && (
                                      <TableCell className="text-sm text-left!">{po.supplierTen}</TableCell>
                                    )}
                                    <TableCell className="text-sm">{td.mucDichSuDung}</TableCell>
                                    <TableCell className="text-sm">{td.noiSuDung}</TableCell>
                                    {quyen.xemGia && (
                                      <TableCell className="font-semibold tabular-nums">
                                        {giaTri.toLocaleString("vi-VN")}
                                      </TableCell>
                                    )}
                                    <OTheoDoiNgay ngay={td.ngayLapDeNghi} />
                                    <OTheoDoiNgay ngay={td.ngayDeNghiCap} />
                                    <OTheoDoiNgay ngay={td.ngayNhanLanDau} />
                                    <OTheoDoi so={td.theoDoiCongTrinh} />
                                    <OTheoDoiNgay ngay={td.ngayDatHang} />
                                    <OTheoDoiNgay ngay={td.ngayThoaThuanGiao} />
                                    {quaHanChuaGiao !== null ? (
                                      <TableCell className="text-xs font-semibold text-danger-soft">
                                        Chưa giao · quá hạn {quaHanChuaGiao} ngày
                                      </TableCell>
                                    ) : (
                                      <OTheoDoiNgay ngay={td.ngayNhanLanDau} />
                                    )}
                                    <OTheoDoi so={td.theoDoiNCC} />
                                    <TableCell className="text-sm">{td.nguoiNhan}</TableCell>
                                    {quyen.xemNguoiPhuTrach && (
                                      <TableCell className="text-sm text-left!">{po.nguoiPhuTrachTen}</TableCell>
                                    )}
                                    <TableCell className="text-sm">{po.ghiChu}</TableCell>
                                    {quyen.xemGia && <OTheoDoiNgay ngay={td.ngayHoaDon} />}
                                    <TableCell className="text-sm tabular-nums">
                                      {duocGhiWorkflow(po.nguoiPhuTrachUid) && po.trangThai !== "huy" ? (
                                        <OChonNgay
                                          nhan={`Ngày up workflow của đơn ${po.code}`}
                                          giaTri={td.ngayUpWorkflow ?? ""}
                                          onDoi={(ngay) => doiNgayWorkflow(po.id, ngay)}
                                          className="mx-auto w-36"
                                        />
                                      ) : (
                                        ngayNganTheoDoi(td.ngayUpWorkflow)
                                      )}
                                    </TableCell>
                                    {quyen.xemGia && <OTheoDoi so={td.theoDoiWorkflow} kieu="sau_hoa_don" />}
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
                                      <TableCell>
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
                        n.muc.map(({ po, td, tienDo, phanTram, conLai, giaTheoDong }) => {
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
                              {td.maDeXuat && (
                                <span className="text-xs text-text-desc">Mã đề xuất {td.maDeXuat}</span>
                              )}
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-text-desc">Giao dự kiến</span>
                                <span className={quaHan ? "font-semibold text-danger-soft" : ""}>
                                  {new Date(po.ngayGiaoDuKien).toLocaleDateString("vi-VN")}
                                </span>
                              </div>
                              {/* ★ Các cột mới của bảng theo dõi (02/10/2026) — bản điện thoại cũng phải có,
                                  nhất là ô Ngày up workflow: không có ở đây là người đi công trình
                                  không ghi được (phản biện 02/10/2026). */}
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-text-desc">Ngày nhận hàng</span>
                                <span>{ngayNganTheoDoi(td.ngayNhanLanDau) || "Chưa nhận"}</span>
                              </div>
                              {(td.theoDoiCongTrinh !== null || td.theoDoiNCC !== null) && (
                                <div className="flex flex-col gap-0.5 text-sm">
                                  {td.theoDoiCongTrinh !== null && (
                                    <span className={td.theoDoiCongTrinh < 0 ? "font-semibold text-danger-soft" : ""}>
                                      Công trình: {chuTheoDoiHan(td.theoDoiCongTrinh)}
                                    </span>
                                  )}
                                  {td.theoDoiNCC !== null && (
                                    <span className={td.theoDoiNCC < 0 ? "font-semibold text-danger-soft" : ""}>
                                      Nhà cung cấp: {chuTheoDoiHan(td.theoDoiNCC)}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                <span className="text-text-desc">Ngày up workflow</span>
                                {duocGhiWorkflow(po.nguoiPhuTrachUid) && po.trangThai !== "huy" ? (
                                  <OChonNgay
                                    nhan={`Ngày up workflow của đơn ${po.code}`}
                                    giaTri={td.ngayUpWorkflow ?? ""}
                                    onDoi={(ngay) => doiNgayWorkflow(po.id, ngay)}
                                    className="w-40"
                                  />
                                ) : (
                                  <span>{ngayNganTheoDoi(td.ngayUpWorkflow) || "—"}</span>
                                )}
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

/** Ô ngày dạng `dd/mm/yy` như mẫu Excel. */
function OTheoDoiNgay({ ngay }: { ngay: string | undefined }) {
  return <TableCell className="text-sm tabular-nums">{ngayNganTheoDoi(ngay)}</TableCell>;
}

/**
 * Ô "Theo dõi" — số ngày chênh như mẫu Excel. Không tính được thì để trống.
 *
 * · `kieu="han"` (cột ① ②, mốc hẹn − ngày thật): âm là TRỄ → nền vàng + chữ đỏ như ô tô vàng
 *   của mẫu, và in thêm chữ "trễ" ngay dưới số — trạng thái phải có cả chữ, không chỉ màu (V1.1).
 * · `kieu="sau_hoa_don"` (cột ③, up workflow − hoá đơn): 🔴 CHIỀU NGƯỢC, không tô cảnh báo theo
 *   dấu — mẫu Excel không tô ô này, và số dương là up SAU hoá đơn (bình thường). Chữ giải thích
 *   ở `chuTheoDoiWorkflow`.
 */
function OTheoDoi({ so, kieu = "han" }: { so: number | null; kieu?: "han" | "sau_hoa_don" }) {
  if (so === null) return <TableCell />;
  const tre = kieu === "han" && so < 0;
  return (
    <TableCell
      title={kieu === "han" ? chuTheoDoiHan(so) : chuTheoDoiWorkflow(so)}
      className={`text-sm font-semibold tabular-nums ${tre ? "bg-warning-bg text-danger-soft" : "text-text-primary"}`}
    >
      {so}
      {tre && <span className="block text-xs font-medium">trễ</span>}
    </TableCell>
  );
}
