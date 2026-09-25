"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import {
  Wallet,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Lock,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { KhoiDotThanhToan } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-dot-thanh-toan";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { duongDanGocTheoQuyen } from "@/2-quy-trinh/dieu-huong";
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
/**
 * 🔴 TRANG NÀY CHỈ CÒN NHẬP HAI THỨ TỪ `tuoi-no.ts` — Ban lãnh đạo 28/08/2026 bỏ cả hai khối
 * dựa trên tuổi nợ (*"Phân tích tuổi nợ 30-60-90"* rồi *"Tuổi nợ theo nhà cung cấp"*).
 *
 * ⚠️ `tinhTuoiNo` · `nhomTuoiNoTheoNCC` · `MUC_TUOI_NO` · `MaMucTuoiNo` VẪN CÒN NGUYÊN trong
 * `2-quy-trinh/tuoi-no.ts`, chỉ là trang này thôi gọi. **Đừng xóa chúng khỏi tệp gốc**: đó là
 * luật chia 5 khoảng tuổi nợ, sẽ cần lại đầy đủ khi app có sổ công nợ thật (theo dõi từng lần
 * chi). Xóa đi rồi dựng lại là dựng lại một luật tài chính từ trí nhớ.
 */
import { congNoTheoDonHang, soTienConLai, tienLamCanCu } from "@/2-quy-trinh/tuoi-no";
import { laDonHangCuaToi } from "@/4-phan-quyen/quyen-theo-ho-so";
import { formatCurrencyVnd, formatDate } from "@/6-tien-ich/dinh-dang";
import { boDau } from "@/6-tien-ich/bo-dau";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import {
  NutLichSuCongNo,
  ONgayBatDau,
  OSoHoaDon,
  OTongTienHoaDon,
  OSoNgayDuocNo,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/o-dieu-khoan-cong-no";
import type { CongNo } from "@/3-du-lieu/kieu-du-lieu";

/** Chuẩn hóa chuỗi để so khi tìm kiếm: bỏ dấu, thường hóa, gộp khoảng trắng. */
function chuanHoaTim(s: string): string {
  return boDau(s).toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * ❌ ĐÃ BỎ `SAC_DO_MUC` — bảng sắc độ 5 mức tuổi nợ, cùng lúc với hai khối dùng nó (28/08/2026).
 *
 * 📌 Ghi lại quy ước ở đây phòng khi dựng lại: 5 bậc đó KHÔNG dùng 5 mã màu mới, mà dùng **độ mờ
 * của cùng một token** — `bg-success` → `bg-warning` → `bg-danger/50` → `bg-danger/75` →
 * `bg-danger`. Design System V1.1 chỉ có 4 tông ngữ nghĩa, nên thêm mã màu thứ năm là phá chuẩn.
 */

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
/**
 * ★★ LƯỚI CỘT CỦA BẢNG HOÁ ĐƠN TỪNG TỜ — Sếp 20/09/2026 yêu cầu "đầy đủ trường theo cách
 * theo dõi tổng", nên bảng con nay có đúng bộ cột của bảng tổng: số · ngày · tiền · đã trả ·
 * còn phải trả · số ngày nợ · bắt đầu tính · tới hạn · cảnh báo.
 *
 * ⚠️ MỘT HẰNG SỐ DÙNG CHUNG cho hàng tiêu đề và các dòng. Viết lặp hai nơi là sớm muộn sửa
 * một chỗ quên chỗ kia, rồi tiêu đề lệch khỏi cột nó đặt tên.
 */
const LUOI_HOA_DON =
  "grid grid-cols-[1.5rem_minmax(7rem,1fr)_6.5rem_minmax(7.5rem,1fr)_minmax(7rem,1fr)_minmax(7.5rem,1fr)_5.5rem_8rem_6.5rem_minmax(7rem,auto)_auto]";

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
  const {
    congNo,
    deNghi,
    donHang,
    giaDonHang,
    phieuNhan,
    datDieuKhoanCongNo,
    /* ★ Điều khoản công nợ của RIÊNG từng tờ hoá đơn — Sếp 20/09/2026. */
    datDieuKhoanHoaDon,
    dotThanhToan,
    themDotThanhToan,
    ganHoaDonChoDot,
    xoaDotThanhToan,
  } = useDuLieu();
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
   * Dòng PO đang mở danh sách đợt chi — `null` là chưa mở dòng nào.
   *
   * 🔴 PHẢI KHAI Ở ĐÂY, TRƯỚC MỌI `return` SỚM. Màn này có một cổng quyền trả về sớm khi người
   * dùng không được xem công nợ; đặt `useState` sau cổng đó là hook gọi có điều kiện — React đổi
   * thứ tự hook giữa các lần vẽ và app hỏng theo kiểu rất khó lần. `npm run verify` bắt được
   * (rule `react-hooks/rules-of-hooks`), nhưng đừng để nó phải bắt.
   */
  const [moDotChi, setMoDotChi] = useState<string | null>(null);
  /**
   * ★ Tờ hoá đơn mà form "Thêm đợt thanh toán" sẽ gắn sẵn — Sếp 20/09/2026.
   *
   * 🔴 ĐỂ Ở TRANG, KHÔNG ĐỂ TRONG KHỐI ĐỢT CHI: nút bấm nằm ở bảng hoá đơn (khối trên), còn form
   * nhận nó nằm ở khối đợt chi (khối dưới) — hai khối anh em, nên state phải ở cha chung.
   * `null` = ghi đợt chi không gắn tờ nào, đúng cách người dùng vẫn làm từ trước.
   */
  const [ganHoaDon, setGanHoaDon] = useState<{ id: string; lan: number } | null>(null);
  /**
   * ★★ BỘ LỌC "PO CỦA TÔI" — Sếp 19/09/2026: *"Tạo thêm nút lọc để nhân viên có thể chọn chỉ
   * hiển thị các PO do mình làm hoặc được theo dõi"*.
   *
   * 🔴 MẶC ĐỊNH `"tat_ca"`, KHÔNG mặc định "của tôi". Màn này là sổ công nợ của cả phòng; mở lên
   * mà đã giấu sẵn phần lớn đơn thì người dùng tưởng dữ liệu bị mất — và họ không có cách nào
   * biết mình đang bị lọc nếu không để ý dải tab. Ai muốn thu hẹp thì tự bấm.
   *
   * 📌 Cũng khai trước cổng quyền, cùng lý do Rules of Hooks đã ghi ở hai state trên.
   */
  const [locNguoi, setLocNguoi] = useState<"tat_ca" | "cua_toi">("tat_ca");
  /* ❌ ĐÃ BỎ state căn cứ chung cho cả bảng — Sếp 19/09/2026: *"Nút này đưa vào các DMH, vì số liệu
     mỗi DMH sẽ khác nhau"*. Nay căn cứ là thuộc tính của TỪNG đơn, lưu ở `GiaDonDatHang.canCuCongNo`. */

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

  /* Đã bỏ cùng hai khối tuổi nợ (28/08/2026): `mucTuoiNo` · `tongDuNo` · `tongQuaHan` · `theoNCC`.
     Xem chú thích tại chỗ hai khối đó từng đứng, phía dưới trong phần vẽ. */

  /* Bảng 8 cột theo từng đơn hàng — luật tính nằm hết ở `2-quy-trinh/tuoi-no.ts`, ở đây chỉ
     gọi và vẽ. Quy tắc 3.4b: không để hàm tính nghiệp vụ trong tệp giao diện. */
  /* ★ Truyền đợt chi vào để hàm tính ra "đã trả / còn lại / đã tất toán" — Sếp 18/09/2026. */
  const theoDonTatCa = congNoTheoDonHang(donHang, giaDonHang, phieuNhan, new Date(), dotThanhToan);

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
   * ★ AI GHI ĐƯỢC TIỀN ĐÃ TRẢ — cờ RIÊNG, không dùng chung với điều khoản công nợ.
   * Sếp 18/09/2026 duyệt: **Kế toán và Trưởng phòng**. Chặn thật nằm ở tầng ghi
   * (`vuongMacQuyenGhiThanhToan`), cờ này chỉ để không bày nút ra.
   */
  const ghiDuocThanhToan = quyen.ghiThanhToan;

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
    thayDoi: { soNgayDuocNo?: number | null; ngayBatDauTinhNoTay?: string | null },
  ) {
    const loi = datDieuKhoanCongNo(poId, thayDoi, nguoiDung.tenHienThi);
    if (loi) toast.error("Chưa lưu được điều khoản công nợ", { description: loi });
  }

  const chuTim = chuanHoaTim(timNCC);
  /**
   * ★ Hai bộ lọc CHỒNG NHAU: tên NCC (28/08) và người làm (19/09). Người dùng gõ tên NCC rồi bấm
   * "PO của tôi" thì phải còn đúng giao của hai tập — làm loại trừ nhau là bấm cái này mất cái kia
   * mà không có gì báo.
   *
   * 📌 Luật "PO này của tôi không" nằm ở `4-phan-quyen/quyen-theo-ho-so.ts` → `laDonHangCuaToi`,
   * không viết tại đây (quy ước 3.4b). Ở đây chỉ tra PO gốc theo `poId` rồi hỏi hàm đó.
   */
  const locCuaToi = (r: { poId: string }) => {
    const po = donHang.find((p) => p.id === r.poId);
    return po ? laDonHangCuaToi(po, deNghi, nguoiDung.uid) : false;
  };
  const theoDon = theoDonTatCa.filter((r) => {
    if (chuTim && !(chuanHoaTim(r.tenNCC).includes(chuTim) || chuanHoaTim(r.maDonHang).includes(chuTim)))
      return false;
    if (locNguoi === "cua_toi" && !locCuaToi(r)) return false;
    return true;
  });
  /* Đếm trên bản CHƯA lọc theo người để hiện được "N/M" — xem cảnh báo ở chú thích ô tìm. */
  const soCuaToi = theoDonTatCa.filter(locCuaToi).length;

  return (
    <>
      <PageHeader
        /* Người ngoài phòng Thu mua (Kế toán) không vào được `/tong-quan` từ 18/09/2026 —
           breadcrumb phải trỏ về màn gốc CỦA HỌ, xem `duongDanGocTheoQuyen`. */
        crumbs={[
          { label: "Phòng Thu Mua", href: duongDanGocTheoQuyen(quyen) },
          { label: "Công nợ nhà cung cấp" },
        ]}
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
        * 🔴 ĐÃ BỎ CÂU CHÚ DƯỚI TIÊU ĐỀ ngày 19/09/2026 (Sếp: *"Bỏ dòng ghi chú này đi"*). Câu đó
        * viết ngày 27/08 khi app **chưa** theo dõi từng lần chi: *"Số tiền là toàn bộ giá trị đơn
        * — app chưa theo dõi từng lần chi"*. Từ 19/09/2026 đã có đợt thanh toán (`dotChi`) và cột
        * "Còn phải trả" trừ đúng phần đã trả, nên câu đó **thành sai** — giữ lại là app tự nói
        * sai về chính mình. ⚠️ Đừng viết lại một câu chú tương tự ở đây: đầu bảng đã có 14 tiêu
        * đề cột, mỗi cột khó hiểu thì chú ngay tại cột đó, không nhồi thành đoạn văn trên đầu.
        */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="size-4 text-primary" aria-hidden />
            Theo dõi công nợ theo đơn hàng
          </CardTitle>
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
            {/**
              * ★★ DẢI LỌC THEO NGƯỜI LÀM — Sếp 19/09/2026: *"Tạo thêm nút lọc để nhân viên có thể
              * chọn chỉ hiển thị các PO do mình làm hoặc được theo dõi"*.
              *
              * 📌 Dựng theo đúng khuôn dải tab của `trang/viec-cua-toi.tsx` (nút bo tròn, nền đậm
              * khi đang chọn, có số đếm) để hai màn trông như một app — đừng tự chế kiểu khác.
              *
              * ⚠️ Vùng chạm `min-h-11` (44px) theo Design System V1.1 cho màn điện thoại.
              */}
            <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Lọc theo người làm">
              {(
                [
                  ["tat_ca", "Tất cả", theoDonTatCa.length],
                  ["cua_toi", "PO của tôi", soCuaToi],
                ] as const
              ).map(([ma, nhan, so]) => (
                <button
                  key={ma}
                  type="button"
                  onClick={() => setLocNguoi(ma)}
                  aria-pressed={locNguoi === ma}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors md:min-h-9 ${
                    locNguoi === ma
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:bg-primary-bg hover:text-primary"
                  }`}
                >
                  {nhan}
                  <span
                    className={`tabular-nums text-xs ${
                      locNguoi === ma ? "text-white/80" : "text-text-desc"
                    }`}
                  >
                    {so}
                  </span>
                </button>
              ))}
            </div>
            {/* 🔴 ĐANG LỌC THÌ PHẢI NÓI RÕ ĐANG GIẤU BAO NHIÊU ĐƠN. Không có dòng này thì người
                dùng gõ tìm rồi quên xóa, hôm sau mở lại thấy bảng thiếu đơn mà tưởng mất dữ liệu. */}
            {(chuTim !== "" || locNguoi !== "tat_ca") && (
              <span className="text-xs text-text-desc">
                Đang lọc: {theoDon.length}/{theoDonTatCa.length} đơn
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/**
            * 🔴 VÌ SAO PHẢI `table-fixed` + BỀ RỘNG THEO PHẦN TRĂM (Ban lãnh đạo 15/09/2026:
            * *"bố cục lại giao diện này cho cân đối"*, khoanh đỏ một VÙNG TRỐNG lớn nằm giữa
            * cột "Tên NCC" và cột "Tổng công nợ").
            *
            * 📌 VÙNG TRỐNG ĐÓ KHÔNG PHẢI MỘT CỘT. Bảng khai đúng 9 `TableHead` và mỗi dòng đúng
            * 9 `TableCell`, `colSpan={9}` cũng khớp — không có cột ma, không lệch colSpan.
            *
            * Nguyên nhân thật là CÁCH CHIA BỀ RỘNG của bảng `auto layout`:
            * `TableCell` trong `nen-tang-ui/table.tsx` có `whitespace-nowrap`, nên tên nhà cung
            * cấp dài ("CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ XÂY DỰNG NAM HƯNG") KHÔNG xuống dòng được
            * → cột đó có bề rộng nội tại lớn nhất bảng. Trình duyệt chia phần dư của `w-full`
            * theo tỷ lệ bề rộng nội tại, nên cột NCC nuốt gần hết chỗ thừa; chữ căn trái nên
            * chỗ thừa hiện ra thành một dải trắng bên PHẢI tên NCC — đúng chỗ Sếp khoanh.
            *
            * ✅ `table-fixed` + 9 bề rộng phần trăm (tổng đúng 100) làm chỗ thừa được chia ĐỀU
            * theo tỷ lệ cho cả 9 cột thay vì dồn vào một cột. `min-w-[78rem]` giữ sàn bề rộng để
            * ô ngày và nhãn cảnh báo không bị bóp; hẹp hơn thì bảng cuộn ngang trong khung riêng.
            *
            * ⚠️ `table-fixed` CHỈ ĐỌC BỀ RỘNG Ở HÀNG ĐẦU TIÊN — tức các `TableHead` dưới đây.
            * Đặt `w-…` ở `TableCell` của thân bảng là vô nghĩa (đã gỡ các `w-28` / `w-40` / `w-16`
            * cũ để không ai tưởng chúng còn tác dụng).
            *
            * ⚠️ `table-fixed` cũng khiến chữ `nowrap` quá dài TRÀN sang ô bên cạnh thay vì nong
            * cột ra. Vì vậy hai cột chữ tự do (Tên đơn hàng · Tên NCC) bắt buộc phải `truncate`
            * kèm `title` để vẫn đọc được đầy đủ khi rê chuột.
            *
            * 📌 `thanh-keo-ngang-ro`: thanh cuộn ngang luôn hiện (Ban lãnh đạo 22/08/2026).
            * `Table` tự bọc sẵn một khung `overflow-x-auto` bên trong, nên phải tắt khung đó
            * (`overflow-visible`) thì div này mới là khung cuộn thật và mới ăn lớp thanh cuộn.
            */}
          {/* `@container` (Sếp 25/09/2026): khối mở rộng của từng PO đo bề rộng KHUNG NHÌN bằng
              `100cqw` — xem chú thích ở khối "Hoá đơn của đơn". */}
          <div className="@container thanh-keo-ngang-ro overflow-x-auto [&>[data-slot=table-container]]:overflow-visible">
            {/**
              * ★★ BẢNG NỚI TỪ 9 → 12 CỘT — Sếp 18–19/09/2026: thêm **Tên công trình**, **Mã số đề
              * nghị**, **Số hoá đơn**.
              *
              * 🔴 SÀN NÂNG 78rem → 92rem. `table-fixed` chia bề rộng theo phần trăm của bảng, nên
              * giữ nguyên sàn cũ mà thêm ba cột là mỗi cột hụt đi ~25%: cột tiền (“1.234.567.890 đ”
              * ≈ 115px) và nhãn cảnh báo (`whitespace-nowrap` trong `StatusBadge`) sẽ **tràn đè ô
              * bên cạnh** chứ không xuống dòng. Bảng này Sếp đã bắt lỗi bố cục nhiều lần — thà cuộn
              * ngang (đã có thanh cuộn luôn hiện) còn hơn vỡ chữ.
              *
              * ⚠️ TỔNG PHẦN TRĂM PHẢI ĐÚNG 100 — đây là chốt của cả cách chia: 3 + 12 + 8 + 9 + 11 + 9
              * + 8 + 7 + 9 + 8 + 12 + 4 = 100. Sai một ly là trình duyệt tự co kéo lại theo tỷ lệ
              * và mọi tính toán bên trên thành vô nghĩa.
              *
              * 🔴🔴 CỘT CHỮ TỰ DO NAY **XUỐNG DÒNG**, KHÔNG CẮT CỤT NỮA — Sếp 20/09/2026:
              * ***"Chữ đang bị mất, thêm tính năng Wrap text cho các thông tin dài kiểu này"***.
              *
              * Trước đó các cột này dùng `truncate`, nên `CÔNG TY TNHH TÂN HOÀNG…` chỉ hiện một
              * nửa và người đọc phải rê chuột mới biết là nhà cung cấp nào — trên bảng công nợ
              * thì đó là thông tin người ta cần đọc lướt, không phải tra từng dòng.
              *
              * ⚠️ PHẢI ĐẶT `whitespace-normal` TRÊN CHÍNH THẺ CHỮ. `TableCell` của thư viện có
              * `whitespace-nowrap` mặc định (`1-giao-dien/nen-tang-ui/table.tsx`), nên chỉ thêm
              * `break-words` thôi thì chữ **vẫn không xuống dòng** — nó chỉ thôi tràn. Thuộc tính
              * `white-space` kế thừa từ ô cha, con đặt lại mới thắng.
              *
              * 📌 `title` vẫn giữ: chữ rê chuột không thừa, nó là cách đọc nhanh khi hàng cao.
              */}
            <Table className="min-w-[112rem] table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[3%] px-1 text-center">STT</TableHead>
                  <TableHead className="w-[9%]">Tên đơn hàng (PO)</TableHead>
                  {/* ★ Sếp 19/09/2026: *"Thêm cho a trường thông tin Mã số đề nghị"*. Lấy thẳng
                      `po.prCode` đã có trên đơn — xem `maDeNghi` ở `2-quy-trinh/tuoi-no.ts`. */}
                  <TableHead className="w-[7%] leading-tight whitespace-normal">
                    Mã số đề nghị
                  </TableHead>
                  {/* ★ Sếp 18/09/2026 — TÁCH khỏi dòng chữ xám dưới mã PO, KHÔNG nhân bản: để cả
                      hai là hai chỗ cùng nói một chuyện, đúng nếp dự án cấm. */}
                  <TableHead className="w-[7%] leading-tight whitespace-normal">
                    Tên công trình
                  </TableHead>
                  <TableHead className="w-[8%]">Tên NCC</TableHead>
                  {/* ★ Sếp 18/09/2026 — ô SỬA TẠI CHỖ, đặt ở cấp ĐƠN (hoá đơn có trước lần chi). */}
                  <TableHead className="w-[7%] leading-tight whitespace-normal">
                    Số hoá đơn
                  </TableHead>
                  {/* Cột tiền rộng hơn một nhịp: số tiền đơn hàng có thể lên hàng tỷ
                      ("1.234.567.890 đ" ≈ 115px), hụt chỗ là số bị cắt hoặc tràn cột. */}
                  {/* ★ ĐỔI TÊN 19/09/2026 — Sếp: *"Sửa tên cột Tổng công nợ thành Tổng tiền theo PO"*.
                      Tên cũ mơ hồ từ khi có thêm con số của hoá đơn: "công nợ" không nói rõ đang
                      lấy theo cam kết mua hay theo chứng từ NCC xuất. */}
                  <TableHead className="w-[7%] text-right leading-tight whitespace-normal">
                    Tổng tiền theo PO
                  </TableHead>
                  {/* ★ CỘT MỚI 19/09/2026 — ô SỬA TẠI CHỖ. Hoá đơn thường lệch PO (giao thiếu,
                      phụ phí, xuất gộp nhiều lần giao), nên phải có cả hai để đối chiếu. */}
                  <TableHead className="w-[7%] text-right leading-tight whitespace-normal">
                    Tổng tiền theo hoá đơn
                  </TableHead>
                  {/**
                    * ★★★ CỘT "ĐÃ TRẢ" RIÊNG — Sếp 20/09/2026: ***"Sẽ thêm cột số tiền đã trả, vì
                    * có trường hợp hoá đơn 10 triệu nhưng sẽ trả 2 lần, mỗi lần 5tr"***.
                    *
                    * 📌 ĐÂY LÀ SẾP ĐẢO QUYẾT ĐỊNH CỦA CHÍNH MÌNH NGÀY 18/09, VÀ ĐẢO CÓ LÝ. Chú
                    * thích cũ ở đúng chỗ này từng ghi *"KHÔNG làm thêm cột Đã trả riêng: bảng đã
                    * 13 cột, thêm nữa là vỡ"* — số đã trả khi đó nằm thành một dòng chữ nhỏ bên
                    * dưới con số Còn phải trả. Nhưng đơn trả làm nhiều đợt thì "đã trả bao nhiêu"
                    * là con số người ta **đọc lướt cả cột** để đối chiếu, không phải thứ đi tìm
                    * trong từng ô. Đổi lại bảng gánh thêm một cột — chấp nhận được.
                    */}
                  <TableHead className="w-[7%] text-right leading-tight whitespace-normal">
                    Đã trả
                  </TableHead>
                  {/* ★★ CÒN LẠI = Tổng − đã trả (Sếp 18/09/2026, yêu cầu ③). Tự tính, không gõ. */}
                  <TableHead className="w-[8%] text-right leading-tight whitespace-normal">
                    Còn phải trả
                  </TableHead>
                  {/* ⚠️ Bốn tiêu đề giữa dài hơn bề rộng cột đã khai. Lớp gốc của `TableHead` là
                      `whitespace-nowrap`, mà `table-fixed` KHÔNG nong cột ra cho vừa chữ nữa —
                      nên phải cho tiêu đề xuống dòng, bằng không nó tràn đè sang cột bên cạnh. */}
                  <TableHead className="w-[5%] text-center leading-tight whitespace-normal">
                    Thời gian C.Nợ
                  </TableHead>
                  <TableHead className="w-[7%] text-center leading-tight whitespace-normal">
                    Ngày bắt đầu tính
                  </TableHead>
                  <TableHead className="w-[7%] text-center leading-tight whitespace-normal">
                    Ngày tới hạn
                  </TableHead>
                  <TableHead className="w-[8%] text-center leading-tight whitespace-normal">
                    Cảnh báo tới hạn
                  </TableHead>
                  <TableHead className="w-[3%] px-1 text-center">Lịch sử</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {theoDon.length === 0 ? (
                  <TableRow>
                    {/* `whitespace-normal`: bảng đã `table-fixed`, câu giải thích dài mà giữ
                        `nowrap` (lớp gốc của TableCell) thì nó tràn ra ngoài khung cuộn. */}
                    <TableCell
                      colSpan={15}
                      className="py-6 text-center text-sm whitespace-normal text-text-desc"
                    >
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
                    <Fragment key={r.poId}>
                    {/* ★ Viền gói dòng PO + khối mở rộng thành MỘT khung — Sếp 25/09/2026: ***"tạo
                        màu boder để dễ nhận diện cho từng PO"***. Khối hoá đơn / đợt chi nằm sát
                        dòng PO kế tiếp nên trước đây không rõ nó thuộc đơn nào. Dòng cha giữ cạnh
                        trên + hai bên, dòng con giữ hai bên + cạnh dưới (bảng `border-collapse`
                        nên hai viền nối liền). Chỉ một đơn mở một lúc nên một màu primary là đủ —
                        Design System không cho thêm mã màu. */}
                    <TableRow
                      className={
                        moDotChi === r.poId ? "border-x-2 border-t-2 border-b-0 border-primary" : undefined
                      }
                    >
                      {/**
                        * ★★ Ô STT KIÊM NÚT GẬP/MỞ danh sách đợt chi — Sếp 18/09/2026 (yêu cầu ④:
                        * *"group lại theo tên PO"*).
                        *
                        * 🔴 GỘP VÀO Ô STT, không thêm một cột thứ 14: bảng đã 13 cột và Sếp đã bắt
                        * lỗi bố cục nhiều lần. Số thứ tự vẫn đọc được, chỉ thêm mũi tên khi dòng đó
                        * CÓ đợt chi hoặc người dùng được phép thêm đợt.
                        *
                        * 🔴 VÙNG CHẠM 44px (`size-11`) theo Design System V1.1 — ô này nhỏ nên rất
                        * dễ bấm trượt trên máy tính bảng.
                        */}
                      <TableCell className="px-1 text-center tabular-nums text-text-desc">
                        {r.dotChi.length > 0 || ghiDuocThanhToan ? (
                          <button
                            type="button"
                            onClick={() => setMoDotChi(moDotChi === r.poId ? null : r.poId)}
                            aria-expanded={moDotChi === r.poId}
                            title={
                              moDotChi === r.poId
                                ? "Thu gọn các đợt thanh toán"
                                : `Xem ${r.dotChi.length} đợt thanh toán của đơn này`
                            }
                            className="inline-flex size-11 items-center justify-center rounded-lg transition-colors hover:bg-muted md:size-9"
                          >
                            <ChevronRight
                              className={`size-4 shrink-0 transition-transform ${
                                moDotChi === r.poId ? "rotate-90" : ""
                              }`}
                              aria-hidden
                            />
                            <span className="sr-only">{i + 1}</span>
                          </button>
                        ) : (
                          i + 1
                        )}
                      </TableCell>
                      <TableCell>
                        {/* Mã đơn bấm được sang chính đơn đó — dùng lại lối đi đã có ở bảng hóa
                            đơn bên dưới, đừng bày một mã chết rồi bắt người dùng tự đi tìm.
                            🔴 `block truncate` + `title`: bảng đã `table-fixed` nên chữ dài không
                            nong cột ra nữa mà TRÀN sang ô bên cạnh nếu không cắt. */}
                        <Link
                          href={`/don-hang/${r.poId}`}
                          className="block break-words whitespace-normal font-medium text-primary hover:underline"
                          title={r.maDonHang}
                        >
                          {r.maDonHang}
                        </Link>
                        {/* ❌ ĐÃ BỎ dòng chữ xám "tên công trình" ở đây — Sếp 18/09/2026 yêu cầu
                            tên công trình thành CỘT RIÊNG. Giữ cả hai là hai chỗ cùng nói một
                            chuyện, đúng nếp dự án cấm. Xem cột ngay bên phải. */}
                      </TableCell>
                      {/* ★ MÃ SỐ ĐỀ NGHỊ — Sếp 19/09/2026. Bấm được sang chính đề nghị đó nếu đơn
                          có gắn; đơn KHÔNG gắn đề nghị (bản mẫu in, dữ liệu cũ) thì in gạch ngang
                          chứ không để trống trơn — ô trống làm người đọc tưởng bảng lỗi. */}
                      <TableCell className="text-text-primary">
                        {r.maDeNghi ? (
                          <span className="block break-words whitespace-normal tabular-nums" title={r.maDeNghi}>
                            {r.maDeNghi}
                          </span>
                        ) : (
                          <span className="text-text-desc">—</span>
                        )}
                      </TableCell>
                      {/* ★ TÊN CÔNG TRÌNH — cột riêng từ 18/09/2026 (trước là dòng chữ xám dưới mã PO). */}
                      <TableCell className="text-text-primary">
                        {r.tenCongTrinh ? (
                          <span className="block break-words whitespace-normal" title={r.tenCongTrinh}>
                            {r.tenCongTrinh}
                          </span>
                        ) : (
                          <span className="text-text-desc">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-text-primary">
                        <span className="block break-words whitespace-normal" title={r.tenNCC}>
                          {r.tenNCC}
                        </span>
                      </TableCell>
                      {/* ★★ SỐ HOÁ ĐƠN — Sếp 18/09/2026. Ô SỬA TẠI CHỖ, cùng nếp với hai ô điều
                          khoản công nợ bên phải (`OSoNgayDuocNo`, `ONgayBatDau`): người đang so
                          chứng từ trên chính dòng này gõ luôn, không phải mở màn khác. */}
                      <TableCell>
                        {/**
                          * 🔴 KHOÁ Ô KHI ĐƠN ĐÃ CÓ BẢNG HOÁ ĐƠN — Sếp chốt 19/09/2026: *"bảng là
                          * nguồn duy nhất, ô Công nợ tự cộng"*.
                          *
                          * Đơn đã ghi hoá đơn ở mục ⑥ thì con số ở đây là **tổng/chuỗi suy ra**
                          * (xem `tongTienHoaDonCuaDon` · `chuoiSoHoaDonCuaDon`). Cho gõ đè lên nó
                          * là hai chỗ cùng giữ một số: người sửa ở đây rồi thêm một tờ hoá đơn ở
                          * mục ⑥ là số bị ghi đè lại, và ngược lại — cột "Còn phải trả" lấy theo
                          * số nào thì không ai biết, mà lệch thì **không có gì báo**.
                          *
                          * 📌 Đơn CHƯA có tờ hoá đơn nào (`soToHoaDon === 0`) vẫn gõ tay được như
                          * cũ — hàng chục đơn cũ đã nhập theo đường này, khoá cứng hết là chúng
                          * mất luôn chỗ sửa.
                          */}
                        <OSoHoaDon
                          giaTri={r.soHoaDon}
                          suaDuoc={suaDuocDieuKhoan && r.soToHoaDon === 0}
                          onLuu={(so) => {
                            const loi = datDieuKhoanCongNo(r.poId, { soHoaDon: so }, "");
                            if (loi) toast.error(loi);
                          }}
                        />
                      </TableCell>
                      {/* 🔴 CỘT TIỀN: căn PHẢI + `tabular-nums`. Không có `tabular-nums` thì chữ
                          số rộng hẹp khác nhau, hàng nghìn của dòng trên lệch hàng nghìn của dòng
                          dưới và người đọc so nhầm bậc số tiền. */}
                      <TableCell className="text-right font-bold tabular-nums text-text-primary">
                        {formatCurrencyVnd(r.tongCongNo)}
                      </TableCell>
                      {/* ★ TỔNG TIỀN THEO HOÁ ĐƠN — ô sửa tại chỗ, Sếp 19/09/2026. */}
                      <TableCell className="text-right">
                        {/* 🔴 Cùng luật khoá với ô Số hoá đơn bên trái — đọc chú thích tại đó.
                            Hai ô phải khoá/mở CÙNG LÚC: mở một ô thôi là người dùng sửa được
                            tổng tiền mà không sửa được số hoá đơn, hai thứ vốn của cùng một tờ. */}
                        <OTongTienHoaDon
                          giaTri={r.tongTienHoaDon}
                          suaDuoc={suaDuocDieuKhoan && r.soToHoaDon === 0}
                          onLuu={(so) => {
                            const loi = datDieuKhoanCongNo(r.poId, { tongTienHoaDon: so }, "");
                            if (loi) toast.error(loi);
                          }}
                        />
                      </TableCell>
                      {/**
                        * ★★ CÒN PHẢI TRẢ — Sếp 18/09/2026 (yêu cầu ③).
                        *
                        * 🔴 SỐ ĐÃ TRẢ LÀM DÒNG PHỤ, không làm cột riêng: bảng đã 13 cột, thêm nữa
                        * là vỡ ở màn hẹp — mà bảng này Sếp đã bắt lỗi bố cục nhiều lần.
                        *
                        * 🔴 TRẠNG THÁI CÓ CẢ MÀU LẪN CHỮ (Design System V1.1): trả hết thì số 0
                        * hiện tông success kèm chữ *"đã trả đủ"*, chứ không để một số 0 trơ trọi —
                        * 0 có thể là "trả hết" mà cũng có thể là "đơn chưa có giá".
                        */}
                      {/**
                        * ★★★ CỘT "ĐÃ TRẢ" — Sếp 20/09/2026: ***"Sẽ thêm cột số tiền đã trả, vì có
                        * trường hợp hoá đơn 10 triệu nhưng sẽ trả 2 lần, mỗi lần 5tr"***.
                        *
                        * 🔴 CỘNG TỪ CÁC ĐỢT CHI, KHÔNG GÕ TAY. `r.daTra` do `tuoi-no.ts` cộng từ
                        * khối Đợt thanh toán — một nguồn duy nhất. Cho gõ tay ở đây là hai chỗ
                        * cùng giữ một con số rồi lệch nhau mà không gì báo.
                        *
                        * 📌 Chưa trả đồng nào thì in dấu gạch, KHÔNG in "0 đ": số không trong cột
                        * tiền dễ bị đọc lướt thành "đã đối chiếu, bằng không", còn gạch thì đọc
                        * ngay ra là chưa có đợt chi nào.
                        */}
                      <TableCell className="text-right tabular-nums">
                        {r.daTra > 0 ? (
                          <span className="font-semibold text-text-primary">
                            {formatCurrencyVnd(r.daTra)}
                          </span>
                        ) : (
                          <span className="text-text-desc">—</span>
                        )}
                      </TableCell>
                      {/**
                        * 🔴 TÍNH THEO CĂN CỨ ĐANG CHỌN (Sếp 19/09/2026). Chọn "theo hoá đơn" mà đơn
                        * CHƯA nhập hoá đơn thì phải NÓI RA, tuyệt đối không rơi về số của PO cho
                        * "đỡ trống": người đọc tưởng đang nhìn số hoá đơn trong khi đó là số PO, mà
                        * hai con số này lệch nhau là chuyện thường. Rơi về 0 còn tệ hơn — đơn chưa
                        * có hoá đơn sẽ trông như đã trả xong.
                        */}
                      <TableCell className="text-right tabular-nums">
                        {(() => {
                          const canCuTien = tienLamCanCu(r, r.canCu);
                          if (canCuTien === undefined) {
                            return (
                              <span className="text-xs font-normal text-warning-soft">
                                chưa nhập hoá đơn
                              </span>
                            );
                          }
                          const conLaiTheoCanCu = Math.max(0, canCuTien - r.daTra);
                          const traDu = r.daTra > 0 && conLaiTheoCanCu === 0;
                          return (
                            <>
                              {traDu ? (
                                <span className="font-semibold text-success-soft">đã trả đủ</span>
                              ) : (
                                <span className="font-bold text-text-primary">
                                  {formatCurrencyVnd(conLaiTheoCanCu)}
                                </span>
                              )}
                              {/* 🔴 ĐÃ BỎ dòng phụ *"đã trả …"* ở đây — từ 20/09/2026 con số đó có
                                  CỘT RIÊNG ngay bên trái. Để cả hai là hai chỗ cùng nói một
                                  chuyện, đúng nếp dự án cấm; và khi một bên đổi cách tính thì
                                  cùng một hàng in ra hai con số khác nhau. */}
                            </>
                          );
                        })()}
                        {/**
                          * ★★ NÚT CHỌN CĂN CỨ CỦA RIÊNG DÒNG NÀY — Sếp 19/09/2026: *"Nút này đưa
                          * vào các DMH, vì số liệu mỗi DMH sẽ khác nhau. Có cái sẽ dùng theo PO,
                          * cái dùng theo hoá đơn"*.
                          *
                          * 📌 Chữ rất nhỏ và nằm ngay dưới con số nó quyết định — người đọc thấy
                          * ngay con số này đang tính theo căn cứ nào, không phải đi tra chỗ khác.
                          */}
                        {suaDuocDieuKhoan && (
                          <span className="mt-1 flex items-center justify-end gap-0.5 text-[11px]">
                            {(
                              [
                                ["po", "PO"],
                                ["hoa_don", "Hoá đơn"],
                              ] as const
                            ).map(([ma, nhan]) => (
                              <button
                                key={ma}
                                type="button"
                                onClick={() => {
                                  const loi = datDieuKhoanCongNo(r.poId, { canCuCongNo: ma }, "");
                                  if (loi) toast.error(loi);
                                }}
                                aria-pressed={r.canCu === ma}
                                title={
                                  ma === "po"
                                    ? "Tính nợ của đơn này theo tổng tiền PO"
                                    : "Tính nợ của đơn này theo tổng tiền trên hoá đơn"
                                }
                                className={`rounded px-1.5 py-0.5 font-medium transition-colors ${
                                  r.canCu === ma
                                    ? "bg-primary text-white"
                                    : "text-text-desc hover:bg-muted"
                                }`}
                              >
                                {nhan}
                              </button>
                            ))}
                          </span>
                        )}
                      </TableCell>
                      {/* ★★ SỬA ĐƯỢC TẠI CHỖ (Ban lãnh đạo 28/08/2026). Ô trống vẫn nói rõ là
                          trống — số 0 nghĩa "phải trả ngay", khác hẳn "chưa ai điền". */}
                      <TableCell className="text-center tabular-nums">
                        <OSoNgayDuocNo
                          giaTri={r.soNgayDuocNo}
                          suaDuoc={suaDuocDieuKhoan}
                          onLuu={(soNgay) => luuDieuKhoan(r.poId, { soNgayDuocNo: soNgay })}
                        />
                      </TableCell>
                      {/* ★★ NGÀY BẮT ĐẦU: NHẬP TAY ĐÈ LÊN NGÀY NHẬN HÀNG LẦN CUỐI (Ban lãnh đạo
                          06/09/2026: *"ngày này được phép điều chỉnh"*). Ô hiện rõ ngày đến từ
                          đâu — xem `ONgayBatDau`. */}
                      <TableCell className="text-center tabular-nums">
                        <ONgayBatDau
                          giaTri={r.ngayBatDau}
                          nhapTay={r.batDauNhapTay}
                          suaDuoc={suaDuocDieuKhoan}
                          onLuu={(ngay) => luuDieuKhoan(r.poId, { ngayBatDauTinhNoTay: ngay })}
                        />
                      </TableCell>
                      {/* ★★ NGÀY TỚI HẠN: CỐ ĐỊNH, LUÔN TỰ TÍNH = ngày bắt đầu + số ngày được nợ
                          (Ban lãnh đạo 06/09/2026: *"cố định ngày này và tự tính"*). Hiện TĨNH,
                          không cho sửa — sửa được là mở đường cho hạn lệch với điều khoản. */}
                      <TableCell className="text-center font-medium tabular-nums text-text-primary">
                        {r.ngayToiHan ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span>{formatDate(r.ngayToiHan)}</span>
                            <span className="text-xs text-text-desc">Tự tính</span>
                          </div>
                        ) : (
                          /* 🔴 Ô TRỐNG PHẢI NÓI VÌ SAO NÓ TRỐNG (CLAUDE.md 3.5 — không để giao
                             diện bày một dấu "—" trơ rồi bắt người dùng đoán). Hạn = ngày bắt đầu
                             + số ngày được nợ, thiếu vế nào thì nói thẳng vế đó, để người dùng
                             biết phải điền vào ô nào ngay bên trái.
                             📌 Chỉ ĐỌC hai trường đã có sẵn trên dòng để diễn giải — luật tính
                             hạn vẫn nằm nguyên ở `2-quy-trinh/tuoi-no.ts`, đây không tính gì. */
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-normal text-text-desc">—</span>
                            <span className="text-xs leading-tight whitespace-normal text-text-desc">
                              {r.ngayBatDau === undefined
                                ? "Thiếu ngày bắt đầu"
                                : "Thiếu số ngày nợ"}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      {/* Nhãn cảnh báo có thể dài ("Quá hạn 123 ngày"); bảng đã `table-fixed` nên
                          cho nhãn xuống dòng trong ô thay vì tràn sang cột Lịch sử. Trạng thái
                          vẫn đủ CẢ MÀU VÀ CHỮ theo Design System V1.1. */}
                      <TableCell className="text-center whitespace-normal">
                        <StatusBadge label={r.canhBao.nhan} tone={r.canhBao.tong} />
                      </TableCell>
                      {/* ★★ Cột ⑨ — nhật ký sửa điều khoản (Ban lãnh đạo 28/08/2026: *"có ghi
                          lại lịch sử"*).
                          📌 Ai VÀO được trang này đều xem được sổ, kể cả vai trò không sửa được:
                          trang đã chặn sẵn bằng `quyen.xemCongNo` ngay đầu hàm, nên tới đây thì
                          người đọc vốn đã được phép thấy giá. Che thêm một lớp nữa chỉ làm kế
                          toán không tra được ai đổi điều khoản. */}
                      <TableCell className="px-1 text-center">
                        <NutLichSuCongNo
                          maDonHang={r.maDonHang}
                          lichSu={giaDonHang.find((g) => g.poId === r.poId)?.lichSuDieuKhoanCongNo}
                        />
                      </TableCell>
                    </TableRow>

                    {/**
                      * ★★★ HÀNG CON — CÁC ĐỢT THANH TOÁN CỦA ĐƠN NÀY. Sếp 18/09/2026, yêu cầu ④:
                      * ***"Mỗi PO sẽ được tạo thêm dòng để nhập số tiền thanh toán từng đợt (và có
                      * tính năng group lại theo tên PO)"***.
                      *
                      * 🔴 MỘT `TableCell colSpan` DUY NHẤT, KHÔNG chia lại thành 15 ô con. Bảng ngoài
                      * là `table-fixed` với bề rộng phần trăm của 15 cột tiêu đề; nhồi ô con vào đó
                      * là chúng bị ép theo bề rộng của cột nói chuyện khác — dòng con nằm lệch hẳn
                      * so với tiêu đề phía trên, đúng kiểu vỡ bố cục Sếp đã bắt nhiều lần.
                      *
                      * 🔴 `table-fixed` KHÔNG áp cho bảng lồng bên trong, nên bên trong dùng lưới
                      * thường (`grid`) là an toàn và tự co theo nội dung.
                      */}
                    {moDotChi === r.poId && (
                      <TableRow className="border-x-2 border-b-2 border-primary hover:bg-transparent">
                        <TableCell colSpan={15} className="bg-muted/40 p-0 whitespace-normal">
                          {/**
                            * ★★ DANH SÁCH TỪNG TỜ HOÁ ĐƠN — Sếp 20/09/2026: ***"Link thông tin các
                            * đợt hoá đơn sang đây để theo dõi công nợ theo từng hoá đơn"***.
                            *
                            * 🔴 CHỈ ĐỂ ĐỌC. Chỗ nhập / sửa / đính kèm là mục ⑥ trong hồ sơ đề
                            * nghị — một chỗ duy nhất. Dựng thêm ô nhập ở đây là hai nơi cùng ghi
                            * một tờ hoá đơn, đúng cái vừa phải dẹp hôm qua với hai ô số hoá đơn.
                            *
                            * 📌 ĐẶT TRÊN khối đợt thanh toán, cố ý theo đúng trình tự nghiệp vụ:
                            * nhà cung cấp **xuất hoá đơn trước**, mình **chi tiền sau**. Người đối
                            * chiếu đọc từ trên xuống là đi đúng dòng thời gian.
                            *
                            * 🔴 `sticky left-0 w-fit` — bảng ngoài rộng và cuộn ngang; không có nó
                            * thì cuộn sang phải là danh sách hoá đơn trôi khuất khỏi màn, đúng lúc
                            * cần đối chiếu với cột "Còn phải trả". Cùng cách xử với khối đợt chi.
                            *
                            * ★ `w-[100cqw]` THAY `w-fit` — Sếp 25/09/2026: ***"Dãn cột qua đây"***
                            * (khối chỉ chiếm ~60% bề ngang, nửa phải bỏ trống). `100cqw` = đúng bề
                            * rộng KHUNG NHÌN của vùng cuộn (`@container` ở thẻ bao bảng), không phải
                            * bề rộng bảng 1792px — nên vẫn giữ được `sticky`: cuộn ngang thì khối
                            * không trôi khuất. Viết `w-full` là rộng bằng cả bảng, mất tác dụng
                            * sticky. Lưới `LUOI_HOA_DON` có cột `1fr` nên tự dãn theo.
                            */}
                          {r.hoaDon.length > 0 && (
                            <div className="sticky left-0 flex w-[calc(100cqw-4px)] flex-col gap-1 border-l-2 border-primary/40 px-3 pt-3 pb-1 pl-6">
                              <div className="flex flex-wrap items-center gap-2">
                                <FileText className="size-4 shrink-0 text-text-desc" aria-hidden />
                                <span className="text-sm font-semibold text-text-primary">
                                  Hoá đơn của đơn {r.maDonHang}
                                </span>
                                <span className="text-xs text-text-desc">
                                  {r.hoaDon.length} tờ · tổng{" "}
                                  {formatCurrencyVnd(r.tongTienHoaDon ?? 0)}
                                </span>
                              </div>
                              {/**
                                * 🔴🔴 NÓI RÕ KHI TỔNG HOÁ ĐƠN ≠ TỔNG PO — nếu không thì dòng cha
                                * và bảng con **nói ngược nhau** trên cùng một màn hình.
                                *
                                * Ca đo được: PO 108tr, nhà cung cấp xuất một tờ 80tr, Kế toán trả
                                * đủ 80tr và gắn vào tờ đó ⇒ bảng con ghi *"Đã tất toán"* trong khi
                                * dòng cha vẫn ghi *"còn 28tr · Quá hạn 25 ngày"*. Cả hai đều đúng
                                * theo căn cứ của mình: tờ tính theo tiền hoá đơn, đơn tính theo
                                * tiền PO — mà chú thích `tongTienHoaDon` đã ghi hai số **thường
                                * lệch nhau là chuyện bình thường** (giao thiếu/thừa, phụ phí, NCC
                                * xuất gộp).
                                *
                                * 📌 KHÔNG ẨN CỘT "CÒN PHẢI TRẢ" của tờ — Sếp yêu cầu đủ trường.
                                * Thay vào đó nói thẳng nó là số của TỜ GIẤY, không phải phần dư
                                * nợ của đơn. Một agent phản biện 20/09 bắt đúng chỗ này.
                                */}
                              {typeof r.tongTienHoaDon === "number" &&
                                r.tongTienHoaDon !== r.tongCongNo && (
                                  <span className="text-xs text-text-desc">
                                    Tổng hoá đơn {formatCurrencyVnd(r.tongTienHoaDon)} khác tổng PO{" "}
                                    {formatCurrencyVnd(r.tongCongNo)} — cột “Còn phải trả” dưới đây
                                    là của <strong>từng tờ hoá đơn</strong>, không phải phần dư nợ
                                    của đơn
                                    {r.canCu === "po"
                                      ? " (đơn này đang tính nợ theo PO)."
                                      : "."}
                                  </span>
                                )}
                              {/**
                                * ★★ BỐN TRƯỜNG THEO DÕI CÔNG NỢ CHO TỪNG TỜ — Sếp 20/09/2026:
                                * ***"Thêm trường nhập thông tin giống mục theo dõi công nợ"***.
                                *
                                * 🔴 DÙNG LẠI ĐÚNG HAI Ô CỦA DÒNG PO (`OSoNgayDuocNo`,
                                * `ONgayBatDau`). Dựng ô riêng cho bảng con là hai kiểu nhập cho
                                * cùng một loại dữ liệu, và luật "để trống = tự suy" sẽ phải chép
                                * lại lần nữa.
                                *
                                * 🔴 KHÔNG CÓ CỘT "CÒN PHẢI TRẢ" — đợt chi tiền hiện gắn theo ĐƠN,
                                * không trỏ tới tờ nào, nên app KHÔNG biết tờ này đã trả bao nhiêu.
                                * Sếp chốt 20/09 làm hai nhịp; nhịp này chỉ trả lời *"tờ nào sắp
                                * tới hạn"*. Đừng thêm cột đó bằng cách đoán.
                                */}
                              {/**
                                * ★★ ĐỦ CỘT NHƯ BẢNG TỔNG — Sếp 20/09/2026: ***"Đang quản lý theo
                                * từng hoá đơn, thì phải có đầy đủ trường theo cách theo dõi
                                * tổng"***, sau khi hỏi ***"Trường nhập số tiền đã thanh toán
                                * đâu / Để như vậy thì sao hoàn thành được"***.
                                *
                                * 🔴 CỘT "ĐÃ TRẢ" CHỈ ĐẾM ĐỢT CHI ĐÃ GẮN ĐÚNG TỜ. Không chia đều,
                                * không suy "trả tờ cũ trước" — xem `hanNoTungToHoaDon` ở
                                * `2-quy-trinh/tuoi-no.ts`. Tiền chưa gắn tờ nào hiện thành một
                                * dòng riêng ngay dưới bảng, **không được giấu**.
                                */}
                              <div className={LUOI_HOA_DON + " items-center gap-x-3 px-3 text-[11px] font-medium text-text-desc"}>
                                <span>#</span>
                                <span>Số hoá đơn</span>
                                <span>Ngày HĐ</span>
                                <span className="text-right">Số tiền</span>
                                <span className="text-right">Đã trả</span>
                                <span className="text-right">Còn phải trả</span>
                                <span>Số ngày nợ</span>
                                <span>Bắt đầu tính</span>
                                <span>Tới hạn</span>
                                <span>Cảnh báo</span>
                                <span />
                              </div>
                              <ul className="flex flex-col gap-0.5">
                                {r.hoaDon.map((h, i) => (
                                  <li
                                    key={h.id}
                                    className={LUOI_HOA_DON + " items-center gap-x-3 rounded-md bg-card px-3 py-1.5 text-sm"}
                                  >
                                    <span className="tabular-nums text-xs text-text-desc">
                                      {i + 1}.
                                    </span>
                                    <span
                                      className="truncate font-medium text-text-primary"
                                      title={`${h.soHoaDon} — ghi bởi ${h.nguoiGhiTen}`}
                                    >
                                      {h.soHoaDon}
                                    </span>
                                    <span className="tabular-nums text-text-secondary">
                                      {formatDate(h.ngayHoaDon)}
                                    </span>
                                    <span className="text-right font-semibold tabular-nums text-text-primary">
                                      {formatCurrencyVnd(h.soTien)}
                                    </span>
                                    <span className="text-right tabular-nums text-text-secondary">
                                      {h.daTra > 0 ? formatCurrencyVnd(h.daTra) : "—"}
                                    </span>
                                    {/* Trả xong thì tô xanh — người đọc lướt cột này để biết tờ
                                        nào còn phải lo, không phải đọc từng nhãn cảnh báo. */}
                                    <span
                                      className={`text-right font-semibold tabular-nums ${
                                        h.daTatToan ? "text-success" : "text-text-primary"
                                      }`}
                                    >
                                      {h.daTatToan ? "Đã trả đủ" : formatCurrencyVnd(h.conLai)}
                                    </span>
                                    {/* Trống = kế thừa điều khoản của đơn — `OSoNgayDuocNo` tự in
                                        dấu "—" cho ca đó, không cần thêm chữ. */}
                                    <OSoNgayDuocNo
                                      giaTri={h.soNgayRieng ? h.soNgayDuocNo : undefined}
                                      suaDuoc={suaDuocDieuKhoan}
                                      onLuu={(so) => {
                                        const loi = datDieuKhoanHoaDon(r.poId, h.id, {
                                          soNgayDuocNo: so,
                                        });
                                        if (loi) toast.error(loi);
                                      }}
                                    />
                                    <ONgayBatDau
                                      giaTri={h.ngayBatDau}
                                      nhapTay={h.batDauNhapTay}
                                      suaDuoc={suaDuocDieuKhoan}
                                      onLuu={(ngay) => {
                                        const loi = datDieuKhoanHoaDon(r.poId, h.id, {
                                          ngayBatDauTinhNoTay: ngay,
                                        });
                                        if (loi) toast.error(loi);
                                      }}
                                    />
                                    <span className="tabular-nums text-text-secondary">
                                      {h.ngayToiHan ? formatDate(h.ngayToiHan) : "—"}
                                    </span>
                                    <span>
                                      <StatusBadge label={h.canhBao.nhan} tone={h.canhBao.tong} />
                                    </span>
                                    {/**
                                      * ★★ NÚT GHI TIỀN CỦA RIÊNG TỜ NÀY — Sếp 20/09/2026:
                                      * ***"Trường nhập số tiền đã thanh toán đâu"***.
                                      *
                                      * 🔴 KHÔNG DỰNG MỘT SỔ TIỀN THỨ HAI. Nút này mở đúng form
                                      * "Thêm đợt thanh toán" có sẵn ngay dưới, chỉ **gắn sẵn tờ
                                      * hoá đơn**. Tiền vẫn ghi vào một sổ duy nhất, nên tổng đã
                                      * trả của đơn không bao giờ đếm hai lần.
                                      */}
                                    <span>
                                      {ghiDuocThanhToan && !h.daTatToan && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setMoDotChi(r.poId);
                                            /* 🔴 MANG THEO SỐ LẦN BẤM. Chỉ truyền id thì bấm
                                               "Ghi tiền" tờ A → tự đổi select về "chưa gắn" →
                                               bấm lại tờ A: giá trị không đổi nên form KHÔNG mở
                                               lại, người dùng tưởng đã gắn. Một agent phản biện
                                               20/09 bắt đúng ca này. */
                                            setGanHoaDon((cu) => ({
                                              id: h.id,
                                              lan: (cu?.lan ?? 0) + 1,
                                            }));
                                          }}
                                          className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-medium text-primary transition-colors hover:bg-primary-bg md:min-h-8"
                                        >
                                          <Plus className="size-3.5 shrink-0" aria-hidden />
                                          Ghi tiền
                                        </button>
                                      )}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              {/**
                                * 🔴🔴 TIỀN ĐÃ CHI MÀ CHƯA GẮN TỜ NÀO — HIỆN THẲNG, KHÔNG GIẤU.
                                *
                                * Mọi đợt chi ghi trước 20/09/2026 đều chưa gắn tờ. Giấu chúng đi
                                * thì tổng các tờ cộng lại **không khớp** tổng đã trả của đơn, và
                                * người đối chiếu không hiểu tiền đi đâu — đúng loại lỗi im lặng
                                * mà dự án này phải chữa nhiều lần.
                                */}
                              {r.tienChuaGan > 0 && (
                                <span className="text-xs text-warning-soft">
                                  Còn {formatCurrencyVnd(r.tienChuaGan)} đã chi nhưng chưa gắn cho
                                  tờ hoá đơn nào — mở khối “Các đợt đã thanh toán” bên dưới để
                                  chọn tờ cho từng đợt.
                                </span>
                              )}
                              {/* Nói rõ sửa ở đâu — đừng để người dùng đi tìm nút không tồn tại. */}
                              <span className="text-xs text-text-desc">
                                Số hoá đơn, số tiền và bản chụp sửa ở mục ⑥ trong hồ sơ đề nghị.
                                Số ngày nợ để trống là dùng theo điều khoản của đơn.
                              </span>
                            </div>
                          )}
                          <KhoiDotThanhToan
                            dong={r}
                            ghiDuoc={ghiDuocThanhToan}
                            /* ★ Tờ hoá đơn gắn sẵn khi người dùng bấm "Ghi tiền" ở bảng trên
                               (Sếp 20/09/2026). `null` = ghi đợt chi chung như trước. */
                            ganSanHoaDon={ganHoaDon}
                            onXongGan={() => setGanHoaDon(null)}
                            onThem={themDotThanhToan}
                            onXoa={xoaDotThanhToan}
                            onGanHoaDon={ganHoaDonChoDot}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/**
        * ❌ ĐÃ BỎ KHỐI "TUỔI NỢ THEO NHÀ CUNG CẤP" — Ban lãnh đạo 28/08/2026 khoanh đỏ và chốt
        * *"bỏ này luôn"*, ngay sau khi bỏ khối "Phân tích tuổi nợ (30-60-90 ngày)" cùng ngày.
        *
        * Khối đó là ma trận: mỗi dòng một nhà cung cấp, các cột là 5 khoảng tuổi nợ + mức rủi ro.
        *
        * 📌 CÙNG MỘT NGUYÊN NHÂN với khối trước: nó đọc `congNo` — hằng số `CONG_NO_MAU = []` gán
        * cứng trong kho dữ liệu, không có hàm ghi, không nằm trong cả hai lớp lưu trữ. Nên nó luôn
        * hiện *"Không còn công nợ tồn đọng"* dù đơn hàng có nợ thật.
        *
        * ⚠️ CÒN HAI KHỐI NỮA TRÊN TRANG NÀY CÙNG ĐỌC `congNo` và cùng luôn rỗng: bốn thẻ KPI ở
        * đầu trang · bảng "Danh sách hóa đơn phải trả" ở cuối. Đã hỏi Sếp, chưa có chỉ đạo nên
        * GIỮ NGUYÊN — không tự bỏ thêm.
        *
        * 🔴 `nhomTuoiNoTheoNCC` và `MUC_TUOI_NO` trong `2-quy-trinh/tuoi-no.ts` VẪN GIỮ NGUYÊN,
        * chỉ là trang này thôi gọi. Xóa hàm gốc là mất luật chia 5 khoảng tuổi nợ, mà luật đó sẽ
        * cần lại nguyên vẹn khi app có sổ công nợ thật.
        */}

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
