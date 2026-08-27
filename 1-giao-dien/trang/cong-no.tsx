"use client";

import Link from "next/link";
import { Wallet, AlertTriangle, Clock, CheckCircle2, Building2, Lock } from "lucide-react";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { KpiCard } from "@/1-giao-dien/thanh-phan-dung-chung/kpi-card";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { DataTable, type ColumnDef } from "@/1-giao-dien/thanh-phan-dung-chung/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/1-giao-dien/nen-tang-ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/1-giao-dien/nen-tang-ui/table";
import { nhanAnToan, NHAN_TRANG_THAI_CONG_NO } from "@/2-quy-trinh/trang-thai";
import {
  congNoTheoDonHang,
  tinhTuoiNo,
  nhomTuoiNoTheoNCC,
  soTienConLai,
  MUC_TUOI_NO,
  type MaMucTuoiNo,
} from "@/2-quy-trinh/tuoi-no";
import { formatCurrencyVnd, formatDate } from "@/6-tien-ich/dinh-dang";
import type { CongNo } from "@/3-du-lieu/kieu-du-lieu";

/** Sắc độ 5 mức tuổi nợ — chỉ dùng token ngữ nghĩa, không hardcode mã màu (V1.1 Phần B). */
const SAC_DO_MUC: Record<MaMucTuoiNo, { thanh: string; the: string; chu: string }> = {
  trong_han: { thanh: "bg-success", the: "border-success/30 bg-success-bg", chu: "text-success-soft" },
  d1_30: { thanh: "bg-warning", the: "border-warning/30 bg-warning-bg", chu: "text-warning-soft" },
  d31_60: { thanh: "bg-danger/50", the: "border-danger/25 bg-danger-bg/60", chu: "text-danger-soft" },
  d61_90: { thanh: "bg-danger/75", the: "border-danger/40 bg-danger-bg", chu: "text-danger-soft" },
  tren_90: { thanh: "bg-danger", the: "border-danger/60 bg-danger-bg", chu: "text-danger-soft" },
};

const columns: ColumnDef<CongNo, unknown>[] = [
  {
    accessorKey: "soHoaDon",
    header: "Số hóa đơn",
    meta: { label: "Số hóa đơn" },
    enableHiding: false,
    cell: ({ row }) => <span className="font-medium">{row.original.soHoaDon}</span>,
  },
  {
    accessorKey: "tenNCC",
    header: "Nhà cung cấp",
    meta: { label: "Nhà cung cấp" },
    cell: ({ row }) => (
      <span className="block max-w-xs truncate xl:max-w-md" title={row.original.tenNCC}>
        {row.original.tenNCC}
      </span>
    ),
  },
  {
    accessorKey: "poCode",
    header: "Đơn hàng",
    meta: { label: "Đơn hàng" },
    cell: ({ row }) => (
      <Link href={`/don-hang/${row.original.poId}`} className="text-text-desc hover:underline">
        {row.original.poCode}
      </Link>
    ),
  },
  {
    accessorKey: "soTien",
    header: "Giá trị",
    meta: { label: "Giá trị" },
    cell: ({ row }) => (
      <span className="block text-right">{formatCurrencyVnd(row.original.soTien)}</span>
    ),
  },
  {
    id: "conLai",
    accessorFn: soTienConLai,
    header: "Còn lại",
    meta: { label: "Còn lại" },
    cell: ({ row }) => (
      <span className="block text-right font-medium">
        {formatCurrencyVnd(soTienConLai(row.original))}
      </span>
    ),
  },
  {
    accessorKey: "hanThanhToan",
    header: "Hạn thanh toán",
    meta: { label: "Hạn thanh toán" },
    cell: ({ row }) => formatDate(row.original.hanThanhToan),
    sortingFn: (a, b) =>
      new Date(a.original.hanThanhToan).getTime() - new Date(b.original.hanThanhToan).getTime(),
  },
  {
    id: "trangThai",
    accessorFn: (r) => nhanAnToan(NHAN_TRANG_THAI_CONG_NO, r.trangThai).nhan,
    header: "Trạng thái",
    meta: { label: "Trạng thái" },
    enableHiding: false,
    cell: ({ row }) => {
      const tt = nhanAnToan(NHAN_TRANG_THAI_CONG_NO, row.original.trangThai);
      return <StatusBadge label={tt.nhan} tone={tt.tong} />;
    },
  },
];

/** M8 — Công nợ nhà cung cấp: hóa đơn phải trả lấy từ PO và phân tích tuổi nợ 30-60-90. */
export default function TrangCongNo() {
  /**
   * 🔴 LẤY THÊM ĐƠN HÀNG · BẢNG GIÁ · PHIẾU NHẬN để DỰNG công nợ — Ban lãnh đạo 27/08/2026.
   *
   * Trước ngày này trang chỉ đọc `congNo`, mà `congNo` là hằng số `CONG_NO_MAU = []` gán cứng
   * trong kho dữ liệu: không `useState`, không hàm ghi, và không có mặt trong
   * `kho-chung-firestore.ts` lẫn `luu-tren-may.ts`. Nghĩa là màn này **không bao giờ** có được
   * một dòng nào, không phải "chưa có dữ liệu chạy thử".
   *
   * ✅ Nay công nợ được SUY RA từ đơn hàng thật (`congNoTheoDonHang` ở `2-quy-trinh/tuoi-no.ts`).
   * Suy ra thì không bao giờ lệch với đơn gốc; lưu một bản sao thì sớm muộn hai chỗ nói hai con
   * số khác nhau.
   *
   * ⚠️ `congNo` VẪN GIỮ: bảng "Danh sách hóa đơn phải trả" và màn Lịch công việc
   * (`lich-cong-viec.ts` sinh mốc "Hạn thanh toán") còn đọc nó. Đây là hai nguồn song song cho
   * tới khi có sổ công nợ thật — đừng bỏ cái nào khi chưa chuyển hết chỗ dùng.
   */
  const { congNo, donHang, giaDonHang, phieuNhan } = useDuLieu();
  const { quyen } = useNguoiDung();

  /**
   * 🔴 CHẶN NGAY TẠI TRANG, không chỉ ẩn mục menu.
   *
   * Menu đã ẩn mục này với người không có `xemCongNo` (`2-quy-trinh/dieu-huong.ts`), nhưng ẩn
   * menu KHÔNG phải là chặn: gõ thẳng `/cong-no` vào thanh địa chỉ là vào được. Màn này hiện
   * số tiền từng hóa đơn và tên nhà cung cấp — đúng hai thứ thủ kho và Phòng Thi công không
   * được xem (nguyên tắc dữ liệu số 3 và quyết định 8).
   *
   * Trước 14/08/2026 đây là trang DUY NHẤT trong 14 trang không tự kiểm quyền.
   *
   * ⚠️ Đây vẫn là chặn ở trình duyệt. Bảo mật thật phải bằng Firestore Security Rules — công
   * nợ chứa giá nên khi nối dữ liệu thật phải nằm ở document riêng như `tm_donhang_gia`.
   */
  if (!quyen.xemCongNo) {
    return (
      <EmptyState
        icon={Lock}
        title="Không có quyền xem công nợ nhà cung cấp"
        description="Màn này hiện số tiền từng hóa đơn và tên nhà cung cấp, chỉ dành cho Phòng Thu mua và Kế toán. Cần tra cứu thì nhờ Trưởng bộ phận Thu mua."
      />
    );
  }

  const quaHan = congNo.filter((p) => p.trangThai === "qua_han");
  const sapHan = congNo.filter((p) => p.trangThai === "sap_den_han");
  const daTraDu = congNo.filter((p) => p.trangThai === "da_thanh_toan");
  const tongConNo = congNo.reduce((s, p) => s + soTienConLai(p), 0);

  const mucTuoiNo = tinhTuoiNo(congNo);
  const tongDuNo = mucTuoiNo.reduce((s, m) => s + m.soTien, 0);
  const tongQuaHan = mucTuoiNo.slice(1).reduce((s, m) => s + m.soTien, 0);
  const theoNCC = nhomTuoiNoTheoNCC(congNo);

  /* Bảng 8 cột theo từng đơn hàng — luật tính nằm hết ở `2-quy-trinh/tuoi-no.ts`, ở đây chỉ
     gọi và vẽ. Quy tắc 3.4b: không để hàm tính nghiệp vụ trong tệp giao diện. */
  const theoDon = congNoTheoDonHang(donHang, giaDonHang, phieuNhan);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Phòng Thu Mua", href: "/tong-quan" }, { label: "Công nợ nhà cung cấp" }]}
        title="Công nợ nhà cung cấp"
        description="Hóa đơn phải trả lấy từ đơn đặt hàng · phân tích tuổi nợ 30-60-90 ngày theo từng nhà cung cấp."
      />

      <div className="grid grid-cols-1 gap-(--hp-md-card-gap) sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Wallet}
          title="Tổng công nợ còn lại"
          value={formatCurrencyVnd(tongConNo)}
          meta={`${congNo.length - daTraDu.length}/${congNo.length} hóa đơn chưa tất toán`}
          tone="primary"
        />
        <KpiCard
          icon={AlertTriangle}
          title="Hóa đơn quá hạn"
          value={String(quaHan.length)}
          meta={
            quaHan.length > 0
              ? `Còn nợ ${formatCurrencyVnd(quaHan.reduce((s, p) => s + soTienConLai(p), 0))}`
              : "Không có hóa đơn quá hạn"
          }
          tone="danger"
        />
        <KpiCard
          icon={Clock}
          title="Sắp đến hạn"
          value={String(sapHan.length)}
          meta="Cần bố trí thanh toán trong tuần"
          tone="warning"
        />
        <KpiCard
          icon={CheckCircle2}
          title="Đã thanh toán"
          value={String(daTraDu.length)}
          meta="Hóa đơn đã tất toán"
          tone="success"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-primary" aria-hidden />
              Phân tích tuổi nợ (30 - 60 - 90 ngày)
            </CardTitle>
            <p className="text-xs text-text-desc">
              Chỉ tính phần còn phải trả; hóa đơn đã tất toán không đưa vào biểu đồ.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-desc">Tổng nợ quá hạn</p>
            <p className="text-sm font-bold text-danger-soft">{formatCurrencyVnd(tongQuaHan)}</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full bg-muted p-0.5">
              {mucTuoiNo.map((m) => {
                if (m.soTien === 0) return null;
                const tyLe = tongDuNo > 0 ? (m.soTien / tongDuNo) * 100 : 0;
                return (
                  <div
                    key={m.ma}
                    style={{ width: `${Math.max(tyLe, 2)}%` }}
                    className={`h-full rounded-full ${SAC_DO_MUC[m.ma].thanh}`}
                    title={`${m.nhan}: ${formatCurrencyVnd(m.soTien)} (${tyLe.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-desc">
              <span>Trong hạn: {formatCurrencyVnd(mucTuoiNo[0].soTien)}</span>
              <span>Tổng dư nợ: {formatCurrencyVnd(tongDuNo)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-(--hp-md-card-gap) sm:grid-cols-3 xl:grid-cols-5">
            {mucTuoiNo.map((m) => {
              const tyLe = tongDuNo > 0 ? (m.soTien / tongDuNo) * 100 : 0;
              const sac = SAC_DO_MUC[m.ma];
              return (
                <div key={m.ma} className={`flex flex-col gap-1 rounded-lg border p-3 ${sac.the}`}>
                  <p className={`text-xs font-semibold ${sac.chu}`}>{m.nhan}</p>
                  <p className="text-sm font-bold text-text-primary">{formatCurrencyVnd(m.soTien)}</p>
                  <div className="flex items-center justify-between text-xs text-text-desc">
                    <span>{m.soHoaDon} hóa đơn</span>
                    <span className="font-medium">{tyLe.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/**
        * ★★ BẢNG THEO DÕI CÔNG NỢ — 8 CỘT THEO TỪNG ĐƠN HÀNG (Ban lãnh đạo 27/08/2026:
        * *"bố cục lại thông tin của tab theo dõi công nợ"*, kèm ảnh ghi rõ tên 8 cột).
        *
        * 🔴 ĐÂY LÀ ĐỔI TRỤC BẢNG, KHÔNG PHẢI ĐỔI CHỖ VÀI CỘT. Bảng cũ mỗi dòng là MỘT NHÀ CUNG
        * CẤP, các cột là 5 khoảng tuổi nợ. Bảng này mỗi dòng là MỘT ĐƠN HÀNG — trả lời đúng câu
        * người dùng hỏi hằng ngày: *"đơn này tới hạn trả chưa?"*
        *
        * 📌 BẢNG CŨ GIỮ NGUYÊN Ở NGAY DƯỚI, không xoá. Nó cho biết bốn thứ bảng này không nói
        * được: ma trận 5 khoảng tuổi nợ của từng NCC · số hoá đơn chưa tất toán mỗi NCC · mức rủi
        * ro CẤP NHÀ CUNG CẤP · và NCC nào đang nợ nhiều nhất. Thay hẳn là mất cả bốn.
        *
        * ⚠️ CHƯA PHẢI SỔ CÔNG NỢ ĐẦY ĐỦ — app chưa theo dõi từng lần chi, nên cột "Tổng công nợ"
        * là TOÀN BỘ giá trị đơn, chưa trừ phần đã trả. Câu chú ngay dưới tiêu đề nói rõ điều đó
        * với người dùng, không để họ tưởng đây là số dư thật.
        */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="size-4 text-primary" aria-hidden />
            Theo dõi công nợ theo đơn hàng
          </CardTitle>
          <p className="text-sm text-text-secondary">
            Đơn đã nhận đủ hàng · nợ tính từ <strong>ngày nhận hàng lần cuối</strong> cộng số ngày
            được nợ ghi trên đơn. Số tiền là toàn bộ giá trị đơn — app chưa theo dõi từng lần chi.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14 text-center">STT</TableHead>
                  <TableHead>Tên đơn hàng (PO)</TableHead>
                  <TableHead>Tên NCC</TableHead>
                  <TableHead className="text-right">Tổng công nợ</TableHead>
                  <TableHead className="text-center">Thời gian C.Nợ</TableHead>
                  <TableHead className="text-center">Ngày bắt đầu tính</TableHead>
                  <TableHead className="text-center">Ngày tới hạn</TableHead>
                  <TableHead className="text-center">Cảnh báo tới hạn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {theoDon.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-6 text-center text-sm text-text-desc">
                      Chưa có đơn hàng nào nhận đủ hàng — chưa phát sinh công nợ.
                    </TableCell>
                  </TableRow>
                ) : (
                  theoDon.map((r, i) => (
                    <TableRow key={r.poId}>
                      <TableCell className="text-center tabular-nums text-text-desc">
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        {/* Mã đơn bấm được sang chính đơn đó — dùng lại lối đi đã có ở bảng hóa
                            đơn bên dưới, đừng bày một mã chết rồi bắt người dùng tự đi tìm. */}
                        <Link
                          href={`/don-hang/${r.poId}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {r.maDonHang}
                        </Link>
                        {r.tenCongTrinh && (
                          <span className="block text-xs text-text-desc">{r.tenCongTrinh}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-text-primary">{r.tenNCC}</TableCell>
                      <TableCell className="text-right font-bold text-text-primary">
                        {formatCurrencyVnd(r.tongCongNo)}
                      </TableCell>
                      {/* 🔴 Ô TRỐNG PHẢI NÓI RÕ LÀ TRỐNG. Đơn không ghi số ngày được nợ thì in
                          "—" chứ không in "0 ngày" — số 0 nghĩa là phải trả ngay, khác hẳn
                          nghĩa "chưa ai điền". */}
                      <TableCell className="text-center tabular-nums">
                        {r.soNgayDuocNo !== undefined ? (
                          `${r.soNgayDuocNo} ngày`
                        ) : (
                          <span className="text-text-desc">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {r.ngayBatDau ? (
                          formatDate(r.ngayBatDau)
                        ) : (
                          <span className="text-text-desc">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-medium tabular-nums text-text-primary">
                        {r.ngayToiHan ? (
                          formatDate(r.ngayToiHan)
                        ) : (
                          <span className="font-normal text-text-desc">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge label={r.canhBao.nhan} tone={r.canhBao.tong} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-primary" aria-hidden />
            Tuổi nợ theo nhà cung cấp
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhà cung cấp</TableHead>
                  <TableHead className="text-right">Tổng nợ</TableHead>
                  {MUC_TUOI_NO.map((m) => (
                    <TableHead key={m.ma} className={`text-right ${SAC_DO_MUC[m.ma].chu}`}>
                      {m.nhanNgan}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Mức rủi ro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {theoNCC.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={MUC_TUOI_NO.length + 3}
                      className="py-6 text-center text-sm text-text-desc"
                    >
                      Không còn công nợ tồn đọng.
                    </TableCell>
                  </TableRow>
                ) : (
                  theoNCC.map((r) => (
                    <TableRow key={r.nccId}>
                      <TableCell>
                        <span className="font-medium text-text-primary">{r.tenNCC}</span>
                        <span className="block text-xs text-text-desc">
                          {r.soHoaDon} hóa đơn chưa tất toán
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-text-primary">
                        {formatCurrencyVnd(r.tongNo)}
                      </TableCell>
                      {MUC_TUOI_NO.map((m) => (
                        <TableCell key={m.ma} className={`text-right ${SAC_DO_MUC[m.ma].chu}`}>
                          {r.theoMuc[m.ma] > 0 ? formatCurrencyVnd(r.theoMuc[m.ma]) : "—"}
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <StatusBadge label={r.rui.nhan} tone={r.rui.tong} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách hóa đơn phải trả</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<CongNo>
            columns={columns}
            data={congNo}
            getRowId={(r) => r.id}
            searchPlaceholder="Tìm số hóa đơn, nhà cung cấp, mã đơn hàng..."
            filters={[
              {
                columnId: "trangThai",
                label: "Trạng thái",
                options: Object.values(NHAN_TRANG_THAI_CONG_NO).map((s) => ({
                  value: s.nhan,
                  label: s.nhan,
                })),
              },
            ]}
            emptyIcon={Wallet}
            emptyTitle="Chưa có công nợ nào"
            emptyDescription="Công nợ phát sinh khi đơn đặt hàng có hóa đơn từ nhà cung cấp."
            renderCard={(p) => (
              <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-text-primary">{p.soHoaDon}</span>
                  <StatusBadge
                    label={nhanAnToan(NHAN_TRANG_THAI_CONG_NO, p.trangThai).nhan}
                    tone={nhanAnToan(NHAN_TRANG_THAI_CONG_NO, p.trangThai).tong}
                  />
                </div>
                <p className="text-sm text-text-primary">{p.tenNCC}</p>
                <p className="text-xs text-text-desc">
                  {p.poCode} · Hạn {formatDate(p.hanThanhToan)}
                </p>
                <p className="text-sm font-medium text-text-primary">
                  Còn lại: {formatCurrencyVnd(soTienConLai(p))}
                </p>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </>
  );
}
