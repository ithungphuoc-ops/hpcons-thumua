"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Wallet,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  Lock,
  Search,
} from "lucide-react";
import { toast } from "sonner";
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
  /* `tinhTuoiNo` KHÔNG còn được trang này nhập — khối "Phân tích tuổi nợ" đã bỏ 28/08/2026.
     🔴 Hàm vẫn GIỮ NGUYÊN trong `2-quy-trinh/tuoi-no.ts`, đừng xóa: đó là luật chia 5 khoảng
     tuổi nợ, và `nhomTuoiNoTheoNCC` ngay dưới gọi tới nó. */
  nhomTuoiNoTheoNCC,
  soTienConLai,
  MUC_TUOI_NO,
  type MaMucTuoiNo,
} from "@/2-quy-trinh/tuoi-no";
import { formatCurrencyVnd, formatDate } from "@/6-tien-ich/dinh-dang";
import { boDau } from "@/6-tien-ich/bo-dau";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import {
  NutLichSuCongNo,
  ONgayToiHan,
  OSoNgayDuocNo,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/o-dieu-khoan-cong-no";
import type { CongNo } from "@/3-du-lieu/kieu-du-lieu";

/** Chuẩn hóa chuỗi để so khi tìm kiếm: bỏ dấu, thường hóa, gộp khoảng trắng. */
function chuanHoaTim(s: string): string {
  return boDau(s).toLowerCase().replace(/\s+/g, " ").trim();
}

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
  const { congNo, donHang, giaDonHang, phieuNhan, datDieuKhoanCongNo } = useDuLieu();
  const { quyen, nguoiDung } = useNguoiDung();

  /**
   * ★★ Ô TÌM THEO TÊN NHÀ CUNG CẤP — Ban lãnh đạo 28/08/2026.
   *
   * 🔴 KHAI HOOK Ở ĐÂY, TRƯỚC `if (!quyen.xemCongNo) return`. Đặt sau early return là vi phạm
   * Rules of Hooks: người không có quyền thì React chỉ chạy tới câu `return` nên số hook gọi ra
   * ít hơn lần vẽ trước, và app chết với *"Rendered fewer hooks than expected"* — lỗi chỉ hiện
   * với đúng nhóm người dùng đó, nên rất dễ lọt khi thử bằng tài khoản Thu mua.
   */
  const [timNCC, setTimNCC] = useState("");

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

  /* `mucTuoiNo` · `tongDuNo` · `tongQuaHan` đã bỏ cùng khối "Phân tích tuổi nợ" (28/08/2026) —
     xem chú thích tại chỗ khối đó từng đứng, phía dưới trong phần vẽ. */
  const theoNCC = nhomTuoiNoTheoNCC(congNo);

  /* Bảng 8 cột theo từng đơn hàng — luật tính nằm hết ở `2-quy-trinh/tuoi-no.ts`, ở đây chỉ
     gọi và vẽ. Quy tắc 3.4b: không để hàm tính nghiệp vụ trong tệp giao diện. */
  const theoDonTatCa = congNoTheoDonHang(donHang, giaDonHang, phieuNhan);

  /**
   * Lọc theo tên nhà cung cấp (Ban lãnh đạo 28/08/2026).
   *
   * 📌 BỎ DẤU TIẾNG VIỆT trước khi so, và so cả MÃ ĐƠN. Gõ "tan hoang minh" phải ra được
   * "Tân Hoàng Minh" — bắt người dùng gõ đủ dấu là ô tìm kiếm gần như vô dụng trên thực tế.
   *
   * ⚠️ Dùng `theoDonTatCa` để đếm tổng, `theoDon` để vẽ — nếu lấy nhầm bản đã lọc đi đếm thì
   * dòng "đang lọc N/M đơn" luôn nói N/N và người dùng không biết mình đang giấu bao nhiêu đơn.
   */
  /**
   * ★★ AI ĐƯỢC SỬA ĐIỀU KHOẢN CÔNG NỢ.
   *
   * 🔴 DÙNG `quyen.lapPO`, KHÔNG dùng `quyen.xemCongNo`. Xem và sửa là hai việc khác nhau: Kế
   * toán cần ĐỌC công nợ nhưng điều kiện thanh toán là thứ Thu mua đàm phán với nhà cung cấp.
   * Cho cả hai bên cùng sửa là hai phòng đổi qua đổi lại một con số mà không ai chịu trách nhiệm.
   *
   * ⚠️ Đây vẫn là chặn ở trình duyệt. Chặn thật phải bằng Firestore Rules trên `tm_donhang_gia`.
   */
  const suaDuocDieuKhoan = quyen.lapPO;

  /**
   * Ghi một thay đổi điều khoản công nợ.
   *
   * 🔴 BÁO KHI BỊ CHẶN, KHÔNG NUỐT LỖI. `datDieuKhoanCongNo` trả câu lý do khi đơn chưa có
   * chứng từ giá; im lặng ở đây là người dùng gõ xong, ô nhảy về giá trị cũ, và họ không hiểu
   * vì sao — rồi gõ lại lần nữa.
   *
   * 📌 KHÔNG báo "đã lưu" khi hàm trả `null` do KHÔNG CÓ GÌ ĐỔI (rời ô mà không sửa gì) — toast
   * xanh mỗi lần bấm ra bấm vào một ô là nhiễu. Hàm ghi tự lo việc đó: nó chỉ ghi khi có khác biệt.
   */
  function luuDieuKhoan(
    poId: string,
    thayDoi: { soNgayDuocNo?: number | null; ngayToiHanThanhToan?: string | null },
  ) {
    const loi = datDieuKhoanCongNo(poId, thayDoi, nguoiDung.tenHienThi);
    if (loi) toast.error("Chưa lưu được điều khoản công nợ", { description: loi });
  }

  const chuTim = chuanHoaTim(timNCC);
  const theoDon = chuTim
    ? theoDonTatCa.filter(
        (r) => chuanHoaTim(r.tenNCC).includes(chuTim) || chuanHoaTim(r.maDonHang).includes(chuTim),
      )
    : theoDonTatCa;

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

      {/**
        * ❌ ĐÃ BỎ KHỐI "PHÂN TÍCH TUỔI NỢ (30 - 60 - 90 NGÀY)" — Ban lãnh đạo 28/08/2026 khoanh đỏ
        * nguyên khối và chốt *"bỏ tính năng này đi"*.
        *
        * Khối đó gồm: một thanh tỷ lệ 5 màu + 5 thẻ (Trong hạn · Quá hạn 1-30 · 31-60 · 61-90 ·
        * trên 90 ngày) + dòng "Tổng dư nợ".
        *
        * 📌 VÌ SAO NÓ LUÔN HIỆN 0 ₫: nó đọc `congNo`, mà `congNo` là hằng số `CONG_NO_MAU = []`
        * gán cứng trong kho dữ liệu — không `useState`, không hàm ghi, không có mặt trong
        * `kho-chung-firestore.ts` lẫn `luu-tren-may.ts`. Nghĩa là khối này **không bao giờ** có
        * được một con số nào, chứ không phải "chưa có dữ liệu chạy thử".
        *
        * ⚠️ BA KHỐI KHÁC TRÊN TRANG NÀY CŨNG ĐỌC CÙNG NGUỒN RỖNG ĐÓ và cùng luôn hiện 0: bốn thẻ
        * KPI ở đầu trang · bảng "Tuổi nợ theo nhà cung cấp" · bảng "Danh sách hóa đơn phải trả".
        * CỐ Ý GIỮ LẠI vì Sếp chỉ khoanh một khối — đã báo để Sếp quyết, không tự bỏ thêm.
        *
        * 🔴 KHÔNG XÓA `tinhTuoiNo` / `nhomTuoiNoTheoNCC` / `MUC_TUOI_NO` trong `2-quy-trinh/tuoi-no.ts`.
        * `nhomTuoiNoTheoNCC` và `MUC_TUOI_NO` còn nuôi bảng "Tuổi nợ theo nhà cung cấp" ngay dưới.
        */}

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
          {/* ★★ Ô TÌM THEO TÊN NHÀ CUNG CẤP (Ban lãnh đạo 28/08/2026). Dựng theo đúng mẫu ô tìm
              của `data-table.tsx`: icon Search đặt tuyệt đối trong ô, `pl-9` chừa chỗ cho icon. */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="relative w-full sm:w-80">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-desc"
                aria-hidden
              />
              <Input
                value={timNCC}
                onChange={(e) => setTimNCC(e.target.value)}
                placeholder="Tìm theo tên nhà cung cấp hoặc mã đơn..."
                aria-label="Tìm theo tên nhà cung cấp"
                className="pl-9"
              />
            </div>
            {/* 🔴 ĐANG LỌC THÌ PHẢI NÓI RÕ ĐANG GIẤU BAO NHIÊU ĐƠN. Không có dòng này thì người
                dùng gõ tìm rồi quên xóa, hôm sau mở lại thấy bảng thiếu đơn mà tưởng mất dữ liệu. */}
            {chuTim !== "" && (
              <span className="text-xs text-text-desc">
                Đang lọc: {theoDon.length}/{theoDonTatCa.length} đơn
              </span>
            )}
          </div>
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
                  <TableHead className="text-center">Lịch sử</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {theoDon.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-6 text-center text-sm text-text-desc">
                      {/* 🔴 NÓI ĐÚNG LÝ DO BẢNG RỖNG. Đang lọc mà vẫn in "chưa phát sinh công nợ"
                          là app nói sai: người dùng tưởng mất dữ liệu trong khi chỉ là ô tìm kiếm
                          còn chữ. */}
                      {chuTim !== ""
                        ? `Không có đơn nào khớp "${timNCC.trim()}". Xóa ô tìm kiếm để xem lại ${theoDonTatCa.length} đơn.`
                        : "Chưa có đơn hàng nào nhận đủ hàng — chưa phát sinh công nợ."}
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
                      {/* ★★ SỬA ĐƯỢC TẠI CHỖ (Ban lãnh đạo 28/08/2026). Ô trống vẫn nói rõ là
                          trống — số 0 nghĩa "phải trả ngay", khác hẳn "chưa ai điền". */}
                      <TableCell className="w-28 text-center tabular-nums">
                        <OSoNgayDuocNo
                          giaTri={r.soNgayDuocNo}
                          suaDuoc={suaDuocDieuKhoan}
                          onLuu={(soNgay) => luuDieuKhoan(r.poId, { soNgayDuocNo: soNgay })}
                        />
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {r.ngayBatDau ? (
                          formatDate(r.ngayBatDau)
                        ) : (
                          <span className="text-text-desc">—</span>
                        )}
                      </TableCell>
                      {/* ★★ NHẬP TAY ĐÈ LÊN TỰ TÍNH (Ban lãnh đạo 28/08/2026). Ô hiện rõ con số
                          đang đến từ đâu — xem `ONgayToiHan`. */}
                      <TableCell className="w-40 text-center font-medium tabular-nums text-text-primary">
                        <ONgayToiHan
                          giaTri={r.ngayToiHan}
                          nhapTay={r.toiHanNhapTay}
                          /* Mốc để lịch cộng hộ "+N ngày" — đúng mốc app đang dùng để tự tính,
                             nên nút lối tắt và con số tự tính không bao giờ lệch nhau. */
                          ngayBatDau={r.ngayBatDau}
                          soNgayDuocNo={r.soNgayDuocNo}
                          suaDuoc={suaDuocDieuKhoan}
                          onLuu={(ngay) => luuDieuKhoan(r.poId, { ngayToiHanThanhToan: ngay })}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge label={r.canhBao.nhan} tone={r.canhBao.tong} />
                      </TableCell>
                      {/* ★★ Cột ⑨ — nhật ký sửa điều khoản (Ban lãnh đạo 28/08/2026: *"có ghi
                          lại lịch sử"*).
                          📌 Ai VÀO được trang này đều xem được sổ, kể cả vai trò không sửa được:
                          trang đã chặn sẵn bằng `quyen.xemCongNo` ngay đầu hàm, nên tới đây thì
                          người đọc vốn đã được phép thấy giá. Che thêm một lớp nữa chỉ làm kế
                          toán không tra được ai đổi điều khoản. */}
                      <TableCell className="w-16 text-center">
                        <NutLichSuCongNo
                          maDonHang={r.maDonHang}
                          lichSu={giaDonHang.find((g) => g.poId === r.poId)?.lichSuDieuKhoanCongNo}
                        />
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
