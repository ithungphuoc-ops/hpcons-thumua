"use client";

import Link from "next/link";
import NextDynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ExternalLink,
  FileText,
  LayoutGrid,
  List,
  Maximize2,
  MoreHorizontal,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/1-giao-dien/nen-tang-ui/dropdown-menu";
import { toast } from "sonner";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { nhanPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";
/* Nhãn nhóm đề xuất + định dạng mốc thời gian cho tab Danh sách (23/08/2026). */
import { NHAN_NHOM_DE_XUAT } from "@/3-du-lieu/kieu-du-lieu";
import { formatMocThoiGian } from "@/6-tien-ich/dinh-dang";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import {
  BangQuyTrinhMuaHang,
  type ThaoTacThe,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-quy-trinh-mua-hang";
import {
  HopSuaThongTinChung,
  HopSuaThoiHan,
  HopSuaTruongBoSung,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-sua-de-nghi";
import { HopSuaTruongTuyChinh } from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-sua-truong-tuy-chinh";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { HopNhanBanDeNghi } from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-nhan-ban-de-nghi";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/1-giao-dien/nen-tang-ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/1-giao-dien/nen-tang-ui/table";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { vuongMacTrinhXetDuyet } from "@/2-quy-trinh/bao-gia-dinh-kem";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { duocNhanBanDeNghi } from "@/4-phan-quyen/quyen-theo-ho-so";
/* 📌 KHÔNG còn import `tinhTienDoDeNghi` / `tomTatTienDoDeNghi` / `soSanhDeNghiUuTien` ở đây
   (23/08/2026): cả hai chế độ xem nay lấy dữ liệu từ `dungBangQuyTrinh`, nó đã tính sẵn tiến độ
   và đã sắp thứ tự. Import lại là mở đường cho một nguồn số thứ hai. */
import {
  congViecChuaXongCuaBuoc,
  dsDieuKienConVuong,
  dungBangQuyTrinh,
  giaiDoanDaKetThuc,
  GIAI_DOAN_MUA_HANG,
  NHAN_GIAI_DOAN,
  dungXacNhanKeoTha,
  quyetDinhKeoTha,
  soSanhTheTrenBang,
  xacDinhGiaiDoan,
  type TheDeNghiTrenBang,
  type GiaiDoanMuaHang,
  type HanhDongKeoTha,
  type XacNhanKeoTha,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import type { CongViecGiaiDoan } from "@/2-quy-trinh/cau-hinh-quy-trinh";
import { HopChuyenGiaiDoan } from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-chuyen-giai-doan";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Loader2 } from "lucide-react";
/**
 * ★★ NHÚNG NGUYÊN TRANG CHI TIẾT VÀO DIALOG — cho mục menu ⋯ "Xem trong pop-up" (28/08/2026,
 * "cách 3" trong 3 cách xem Sếp chốt). Trang chỉ nhận thêm `id` khi dùng kiểu này — route thật
 * `/de-nghi/[id]` vẫn gọi không tham số như cũ, xem chú thích ở đầu `de-nghi-chi-tiet.tsx`.
 *
 * 🔴 `next/dynamic`, KHÔNG PHẢI IMPORT TĨNH — vá theo góp ý lúc review. `TrangChiTietDeNghi` là
 * trang ~2600 dòng, kéo theo cả chục component nghiệp vụ (bảng phân bổ, khối đề xuất con, khu
 * báo giá, khối trao đổi...). Import tĩnh gói toàn bộ chỗ đó vào CHUNG gói JS của TRANG BOARD —
 * ai mở `/de-nghi` cũng tải về ngần ấy mã, kể cả người không bao giờ bấm "Xem trong pop-up".
 * `dynamic()` chỉ tải gói đó lúc THẬT SỰ mở pop-up lần đầu.
 */
const TrangChiTietDeNghi = NextDynamic(() => import("@/1-giao-dien/trang/de-nghi-chi-tiet"), {
  // Không cần SSR: chỉ hiện SAU một cú bấm của người dùng (mở pop-up), chưa từng có mặt lúc
  // trang board tải lần đầu — kể cả bản tĩnh (`○ /de-nghi`, prerender lúc build).
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center gap-2 p-8 text-sm text-text-desc">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      Đang tải nội dung đề nghị…
    </div>
  ),
});
/* 📌 KHÔNG còn import nhãn trạng thái đề nghị / mức ưu tiên: tab Danh sách nay suy trạng thái từ
   GIAI ĐOẠN (`HuyHieuTrangThai`) đúng như bảng Base — ba mức Đang xử lý · Hoàn thành · Thất bại. */

/** Hai cách xem cùng một dữ liệu — đặt tên giống bảng Base để anh em quen việc đọc ra ngay. */
type CachXem = "bang" | "danh_sach";

/**
 * Dải tab lọc của tab "Danh sách" — bám ảnh bảng Base Ban lãnh đạo gửi 23/08/2026:
 * *NHIỆM VỤ · HOÀN THÀNH · ĐANG XỬ LÝ · THẤT BẠI · QUÁ HẠN*.
 *
 * 📌 "Nhiệm vụ" của Base = TẤT CẢ, nên ở đây gọi thẳng `tat_ca` cho đỡ nhầm.
 */
type LocDanhSach = "tat_ca" | "hoan_thanh" | "dang_xu_ly" | "that_bai" | "qua_han";

const NHAN_LOC_DS: { ma: LocDanhSach; nhan: string }[] = [
  { ma: "tat_ca", nhan: "Tất cả" },
  { ma: "dang_xu_ly", nhan: "Đang xử lý" },
  { ma: "qua_han", nhan: "Quá hạn" },
  { ma: "hoan_thanh", nhan: "Hoàn thành" },
  { ma: "that_bai", nhan: "Thất bại" },
];

/** Chuỗi bước để tính "[n/8]" — bỏ "Thất bại" vì nó không nằm trong chuỗi chạy. */
const CHUOI_BUOC_DS = GIAI_DOAN_MUA_HANG.filter((g) => g.ma !== "that_bai").map((g) => g.ma);

export default function TrangDanhSachDeNghi() {
  const router = useRouter();
  const {
    deNghi,
    donHang,
    phieuNhan,
    baoGia,
    taoBaoGiaGiaLap,
    doiTrangThaiBaoGiaTheoDeNghi,
    dongDoDeNghi,
    suaThongTinChung,
    suaThoiHan,
    doiLuuTru,
    suaTruongBoSung,
    nhanBanDeNghi,
    xoaDeNghi,
    luiVeBuoc,
    cauHinh,
    ghiLichSuDeNghi,
    danhDauCongViecGiaiDoan,
    datSoBaoGiaChoPhieu,
  } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  const [cachXem, setCachXem] = useState<CachXem>("bang");

  /**
   * Hồ sơ đang mở hộp sửa nào — MỘT state cho cả ba hộp (thông tin chung · thời hạn · dữ
   * liệu tùy chỉnh) thay vì ba cờ riêng: gộp lại thì không có cách nào mở trùng hai hộp.
   */
  const [dangSua, setDangSua] = useState<{
    loai: "thong_tin" | "thoi_han" | "truong_bo_sung" | "truong_tuy_chinh";
    prId: string;
  } | null>(null);
  /** Đề nghị đang chờ xác nhận xóa — xóa là việc không lùi lại được nên phải hỏi. */
  const [hoiXoa, setHoiXoa] = useState<string | null>(null);
  /** Phiếu đang mở hộp nhân bản — `null` là hộp đóng. */
  const [hoiNhanBan, setHoiNhanBan] = useState<string | null>(null);
  /**
   * Phiếu đang xem nhanh dạng pop-up — menu ⋯ "Xem trong pop-up" ("cách 3", 28/08/2026).
   * `null` là đóng. KHÔNG đổi URL: `/de-nghi` vẫn đứng nguyên, board vẫn ở dưới lớp phủ —
   * đóng lại là về ngay đúng chỗ đang xem, không mất bộ lọc/vị trí cuộn.
   */
  const [xemPopupId, setXemPopupId] = useState<string | null>(null);

  const dnDangSua = dangSua ? deNghi.find((d) => d.id === dangSua.prId) : undefined;
  const dnHoiXoa = hoiXoa ? deNghi.find((d) => d.id === hoiXoa) : undefined;
  const dnHoiNhanBan = hoiNhanBan ? deNghi.find((d) => d.id === hoiNhanBan) : undefined;

  /**
   * Các thao tác của menu ⋯ trên thẻ.
   *
   * 🔴 Bảng quy trình KHÔNG tự gọi kho dữ liệu — nó là component hiển thị thuần. Mọi việc
   * ghi đều quyết định ở đây, đúng ranh giới đã đặt từ đầu (xem chú thích đầu
   * `bang-quy-trinh-mua-hang.tsx`).
   */
  const thaoTacThe: ThaoTacThe = {
    onSuaThongTin: (prId) => setDangSua({ loai: "thong_tin", prId }),
    onSuaThoiHan: (prId) => setDangSua({ loai: "thoi_han", prId }),
    onSuaTruongBoSung: (prId) => setDangSua({ loai: "truong_bo_sung", prId }),
    onSuaTruongTuyChinh: (prId) => setDangSua({ loai: "truong_tuy_chinh", prId }),
    // Mở hộp chọn mặt hàng trước, không nhân bản ngay — xem `hop-nhan-ban-de-nghi.tsx`.
    onNhanBan: (prId) => setHoiNhanBan(prId),
    onDoiLuuTru: (prId, luuTru) => {
      doiLuuTru(prId, luuTru, nguoiDung.tenHienThi);
      toast.success(luuTru ? "Đã lưu trữ" : "Đã bỏ lưu trữ", {
        description: luuTru
          ? "Hồ sơ ẩn khỏi bảng nhưng vẫn nguyên trạng thái. Xem lại ở tab Danh sách."
          : "Hồ sơ quay lại đúng cột trên bảng.",
      });
    },
    onXoa: (prId) => setHoiXoa(prId),
    // Nhân viên chỉ tách được phiếu mình phụ trách (Ban lãnh đạo 15/08/2026); trưởng bộ phận
    // và quản trị tách được mọi phiếu. Luật ở `4-phan-quyen/quyen-theo-ho-so.ts`.
    duocNhanBan: (dn) => duocNhanBanDeNghi(dn, nguoiDung.uid, quyen),
    /* 🔴 ĐƯỜNG VÀO MODULE BÁO GIÁ, thay cho nút đã bỏ ở trang chi tiết (Ban lãnh đạo
       17/08/2026: *"bỏ nút này"*). Xem chú thích `onLapBaoGia` ở `ThaoTacThe`.

       🔴 GỌI LẠI `xuLyTha` chứ KHÔNG gọi thẳng `taoBaoGiaGiaLap`. Lập bảng báo giá là việc
       CHUYỂN PHIẾU sang bước ②, nên phải đi qua đúng chốt của việc chuyển bước: kiểm bước
       đang đứng đã xong chưa (vd việc bắt buộc "Checkin hàng tồn kho"), rồi mở hộp xác nhận
       (nguyên tắc Ban lãnh đạo 10/08/2026).

       Bản đầu của mục menu này gọi thẳng hàm tạo, tức BỎ QUA cả hai chốt — nhân viên bấm menu
       là nhảy bước không ai kiểm. Đi qua `xuLyTha` thì luật nằm một chỗ duy nhất
       (`quyetDinhKeoTha`), menu và kéo thả không bao giờ nói khác nhau. */
    onLapBaoGia: (prId) => xuLyTha(prId, "yeu_cau_bao_gia"),
    /* Đủ quyền lập PO · phiếu chưa có bảng báo giá nào · hồ sơ chưa đóng.
       Đã có bảng thì thêm nhà cung cấp là việc làm BÊN TRONG bảng đó, không lập bảng thứ hai. */
    duocLapBaoGia: (dn) =>
      quyen.lapPO &&
      !giaiDoanDaKetThuc(xacDinhGiaiDoan(dn, donHang, baoGia, phieuNhan)) &&
      !baoGia.some((bg) => bg.prId === dn.id),
  };

  /**
   * Việc kéo thả đang chờ người dùng xác nhận.
   *
   * ⚠️ CỜ MỞ TÁCH RIÊNG khỏi nội dung là CỐ Ý. Nếu vừa xóa nội dung vừa đóng hộp trong
   * cùng một nhịp, cây con bị gỡ ngay giữa lúc hộp thoại đang chạy animation đóng —
   * kết quả là **hộp rỗng và lớp phủ kẹt lại trên màn hình**, người dùng không bấm được gì.
   * Đã dính lỗi này khi làm; giữ nội dung lại cho tới lần mở sau là hết.
   */
  const [xacNhan, setXacNhan] = useState<{
    prId: string;
    hanhDong: HanhDongKeoTha;
    noiDung: XacNhanKeoTha;
    /** Mã bước nguồn và bước đích — hộp cần để tra cài đặt của giai đoạn đích. */
    tuBuoc: GiaiDoanMuaHang;
    denBuoc: GiaiDoanMuaHang;
    /** Việc bắt buộc còn treo ở bước hiện tại — hộp hiện và KHÓA nút chuyển. */
    congViecChuaXong: CongViecGiaiDoan[];
  } | null>(null);
  const [moHopXacNhan, setMoHopXacNhan] = useState(false);

  /* 📌 12/08/2026 (chiều): BỎ bộ lọc "đã duyệt". Ban lãnh đạo chốt lại: việc duyệt đề
     nghị diễn ra ở APP KHÁC của bộ phận đề xuất — phiếu vào tới app này nghĩa là ĐÃ duyệt,
     nên bảng quy trình hiện thẳng, không giữ luật duyệt nào ở đây nữa. */

  /**
   * ❌ ĐÃ BỎ `danhSach` (23/08/2026) — tab "Danh sách" nay dùng CHUNG dữ liệu với bảng kanban
   * (`moiThe`, ghép từ `cot`). Xem chú thích ở `moiThe` bên dưới.
   *
   * 🔴 GIỮ LẠI MỘT NGUỒN THỨ HAI LÀ MỜI HAI CHẾ ĐỘ XEM NÓI KHÁC NHAU về cùng một hồ sơ — đúng lỗi
   * vừa phải sửa: bản cũ tự tính `tomTat` / `soChuaPhanBo` nên không biết gì về giai đoạn, hạn xử
   * lý, người phụ trách hay chứng từ còn nợ.
   */

  /**
   * ★ VIỆC CỦA NGƯỜI ĐANG XEM LÊN ĐẦU MỖI CỘT — Ban lãnh đạo 15/08/2026: *"ở các tài khoản
   * nhân viên, hãy ưu tiên hiển thị các công việc của nhân viên đó đảm nhiệm trước"*.
   *
   * 📌 Truyền uid cho MỌI vai trò, không chỉ nhân viên. Trưởng bộ phận cũng trực tiếp phụ
   * trách một số dòng, và việc của chính mình lên đầu thì cũng đúng với họ. Ai không phụ
   * trách dòng nào thì không thẻ nào được ưu tiên, bảng xếp y như cũ — không cần tách nhánh
   * theo vai trò, một luật chạy đúng cho tất cả.
   */
  const cot = useMemo(
    () =>
      dungBangQuyTrinh(
        deNghi,
        donHang,
        baoGia,
        phieuNhan,
        cauHinh,
        new Date(),
        nguoiDung.uid,
        /* Dấu đỏ "thiếu báo giá" ở bước ② — cùng luật với nút "Trình xét duyệt báo giá" nên thẻ
           và nút không bao giờ nói khác nhau (Ban lãnh đạo 24/08/2026).
           📌 Bọc lại vì từ 24/08 hàm này cần cả `cauHinh` (nó đọc `soBaoGiaToiThieu`), còn
           `dungBangQuyTrinh` chỉ truyền một tham số là đề nghị. */
        (dn) => vuongMacTrinhXetDuyet(dn, cauHinh),
      ),
    [deNghi, donHang, baoGia, phieuNhan, cauHinh, nguoiDung.uid],
  );

  /**
   * ★★ NGUỒN DỮ LIỆU CỦA TAB "DANH SÁCH" — GHÉP TỪ CHÍNH `cot` CỦA BẢNG KANBAN (23/08/2026).
   *
   * 🔴 Ban lãnh đạo: *"Bố cục lại phần hiển thị dạng danh sách giống vậy"* (ảnh bảng Base
   * `TM-QT Mua hàng (HP CONS)` → tab **Danh sách**).
   *
   * 🔴 VÌ SAO KHÔNG DỰNG NGUỒN RIÊNG: bảng và danh sách là **hai cách xem cùng một thứ**. Bản cũ
   * tự tính lấy (`danhSach`) nên không biết gì về giai đoạn, hạn xử lý, người phụ trách hay chứng
   * từ còn nợ — chuyển tab là thấy hai bộ thông tin khác nhau về cùng một hồ sơ. Ghép từ `cot` thì
   * mọi con số và mọi dấu đỏ đều do `dungBangQuyTrinh` sinh ra một lần.
   *
   * 📌 Phải sắp lại bằng `soSanhTheTrenBang`: `cot` đã sắp TRONG từng cột, ghép lại thì thứ tự
   * thành "theo cột" chứ không theo mức ưu tiên chung.
   */
  const moiThe = useMemo(
    () => [...cot.flatMap((c) => c.the)].sort((a, b) => soSanhTheTrenBang(a, b, nguoiDung.uid)),
    [cot, nguoiDung.uid],
  );

  const [locDS, setLocDS] = useState<LocDanhSach>("tat_ca");

  const theHienThi = useMemo(
    () =>
      moiThe.filter((t) => {
        if (locDS === "hoan_thanh") return t.giaiDoan === "hoan_thanh";
        if (locDS === "that_bai") return t.giaiDoan === "that_bai";
        if (locDS === "dang_xu_ly") return !giaiDoanDaKetThuc(t.giaiDoan);
        if (locDS === "qua_han") return t.han.quaHan;
        return true;
      }),
    [moiThe, locDS],
  );

  /** Đếm cho từng tab — Base ghi số ngay cạnh tên tab. */
  const demTheoLoc: Record<LocDanhSach, number> = useMemo(
    () => ({
      tat_ca: moiThe.length,
      hoan_thanh: moiThe.filter((t) => t.giaiDoan === "hoan_thanh").length,
      dang_xu_ly: moiThe.filter((t) => !giaiDoanDaKetThuc(t.giaiDoan)).length,
      that_bai: moiThe.filter((t) => t.giaiDoan === "that_bai").length,
      qua_han: moiThe.filter((t) => t.han.quaHan).length,
    }),
    [moiThe],
  );

  /**
   * Thả thẻ vào cột: hỏi `quyetDinhKeoTha` (2-quy-trinh) xem bước chuyển này ứng với
   * nghiệp vụ gì. Bước KHÔNG hợp lệ thì báo lý do luôn; bước hợp lệ thì MỞ HỘP XÁC NHẬN
   * chứ không làm ngay.
   *
   * 🔴 Vì sao phải hỏi lại (chỉ đạo Ban lãnh đạo 08/08/2026): kéo thả rất dễ trượt tay,
   * mà mỗi bước ở đây là một nghiệp vụ thật (tạo bảng báo giá, chốt so sánh, đóng dở).
   * Lỡ tay là sinh chứng từ thừa, và người sau đọc bảng tưởng bước trước đã xong.
   */
  function xuLyTha(
    prId: string,
    dich: GiaiDoanMuaHang,
    /**
     * ★★ GỌI TỪ CÚ BẤM THẺ (xem nhanh), không phải từ kéo thả — Ban lãnh đạo 27/08/2026.
     *
     * 🔴 Khác nhau đúng MỘT chỗ: ca `khong_the`. Kéo thả thì người dùng CHỦ Ý chuyển bước nên
     * toast đỏ *"Không chuyển được"* là câu trả lời đúng. Còn bấm thẻ thì họ chỉ muốn XEM —
     * bắn toast đỏ vào mặt là app tự tố cáo một việc người dùng chưa hề làm.
     */
    laXemNhanh = false,
  ) {
    const the = cot.flatMap((c) => c.the).find((t) => t.deNghi.id === prId);
    if (!the) return;

    const poCuaDeNghi = donHang.filter((po) => po.prId === prId && po.trangThai !== "huy");
    const baoGiaCuaDeNghi = baoGia.filter((b) => b.prId === prId && b.trangThai !== "huy");
    // Công việc bắt buộc của bước đang đứng — lấy từ cấu hình quy trình (sửa được ở trang
    // Cài đặt), KHÔNG viết cứng trong luật kéo thả.
    /**
     * 🔴 TRUYỀN CÂU VƯỚNG MẮC BƯỚC ② VÀO LUẬT KÉO THẢ — Ban lãnh đạo báo lệch 24/08/2026.
     *
     * `vuongMacTrinhXetDuyet` là luật *"đủ số bản báo giá + có bảng so sánh"* (chỉ đạo
     * 20/08/2026). Trước đây nó CHỈ được nút "Trình xét duyệt báo giá" ở trang chi tiết hỏi, nên
     * kéo thẻ ② → ③ lách được: hồ sơ mới có 1/3 bản báo giá vẫn sang cột ③ với toast xanh "Đã
     * chốt đủ báo giá".
     *
     * 📌 Tính Ở ĐÂY chứ không để `quyetDinhKeoTha` tự gọi: `bao-gia-dinh-kem.ts` import từ
     * `kho-du-lieu`, mà `kho-du-lieu` import ngược lại `giai-doan-mua-hang` — gọi thẳng trong
     * tầng quy trình là vòng tròn import. Tầng giao diện có sẵn cả hai nên tính hộ.
     */
    const hanhDong = quyetDinhKeoTha(
      the,
      dich,
      poCuaDeNghi,
      baoGiaCuaDeNghi,
      cauHinh,
      vuongMacTrinhXetDuyet(the.deNghi, cauHinh),
    );
    if (!hanhDong) {
      // Xem nhanh mà luật không dựng nổi hành động nào (bước cuối chuỗi) → mở trang đầy đủ.
      if (laXemNhanh) router.push(`/de-nghi/${prId}`);
      return;
    }

    /**
     * Bước không hợp lệ.
     *
     * · KÉO THẢ → chặn ngay bằng toast, không mở hộp: hỏi rồi vẫn không cho làm thì vô nghĩa.
     * · XEM NHANH → VẪN MỞ HỘP, nhưng khóa nút và in lý do (`chanCung`). Người dùng bấm thẻ là
     *   để XEM bước hiện tại đang vướng gì; bắn toast đỏ rồi không hiện gì là câu trả lời cho
     *   một câu hỏi họ không hỏi.
     *
     * 🔴 BẮT BUỘC TRUYỀN `chanCung` XUỐNG HỘP. `dungXacNhanKeoTha` trả nhãn nút mặc định
     * *"Xác nhận"* cho ca này (nhánh `default`), nên mở hộp mà không khóa là app cho bấm đúng
     * việc luật vừa từ chối.
     */
    if (hanhDong.loai === "khong_the") {
      if (!laXemNhanh) {
        toast.error("Không chuyển được", { description: hanhDong.lyDo });
        return;
      }
    }

    setXacNhan({
      prId,
      hanhDong,
      tuBuoc: the.giaiDoan,
      denBuoc: dich,
      // Việc bắt buộc còn treo — hỏi CHUNG một hàm với luật chặn, để hộp không bao giờ nói
      // khác với thứ app thật sự chặn.
      congViecChuaXong: congViecChuaXongCuaBuoc(the.deNghi, the.giaiDoan, cauHinh),
      noiDung: dungXacNhanKeoTha(
        the,
        dich,
        hanhDong,
        poCuaDeNghi,
        phieuNhan.filter((p) => poCuaDeNghi.some((po) => po.id === p.poId)),
      ),
    });
    setMoHopXacNhan(true);
  }

  /**
   * ★★ ĐÃ BỎ `xemNhanhThe` (28/08/2026) — hàm cũ này "bấm thẻ mở hộp bước hiện tại" (chỉ đạo
   * 27/08/2026), nay Sếp xem video Base.vn thật và chốt lại thành 3 cách xem riêng biệt:
   *
   *   1. Bấm thẳng vào thẻ → ra thẳng trang đầy đủ, cùng tab — không cần hàm nào ở đây nữa,
   *      `<Link href="/de-nghi/[id]">` trong `bang-quy-trinh-mua-hang.tsx` tự lo.
   *   2. Menu ⋯ → "Xem trong tab mới" → đã có sẵn từ trước (`window.open`), không đổi gì.
   *   3. Menu ⋯ → "Xem trong pop-up" → `onXemPopupThe` ngay dưới, mở `Dialog` tại chỗ.
   *
   * `HopChuyenGiaiDoan` (hộp gỡ vướng chuyển bước) KHÔNG mất đường vào — dời sang menu ⋯ mục
   * "Chuyển sang giai đoạn kế tiếp"/"Chuyển về giai đoạn trước", gọi lại đúng `xuLyTha` bên
   * dưới qua `onTha` (xem chú thích tại chỗ truyền `onTha` cho `<BangQuyTrinhMuaHang>`). Đây
   * vẫn là một đường vào thật, không phải bỏ hẳn — không vi phạm CLAUDE.md mục 3.4b.
   */
  function onXemPopupThe(prId: string) {
    setXemPopupId(prId);
  }

  /**
   * Thực thi sau khi người dùng đã bấm xác nhận trong hộp thoại.
   *
   * `ghiChu` là nội dung ô chữ tự do của hộp. Với hành động `dong_do` thì ô đó chính là **lý do
   * thất bại** (bắt buộc, xem `HopChuyenGiaiDoan`) — phải chuyển tiếp xuống tầng ghi, nếu không
   * hồ sơ vào cột Thất bại mà không ai biết vì sao.
   */
  function thucThiKeoTha(prId: string, hanhDong: HanhDongKeoTha, ghiChu = "") {
    const the = cot.flatMap((c) => c.the).find((t) => t.deNghi.id === prId);
    if (!the) return;

    switch (hanhDong.loai) {
      case "tao_bao_gia": {
        const id = taoBaoGiaGiaLap(prId, nguoiDung.tenHienThi);
        if (id) {
          /**
           * ★ CHỐT LUÔN KHI ĐANG KÉO ②→③ — thêm 25/08/2026 (xem cờ `chotLuon`).
           *
           * 🔴 Bảng vừa tạo mang trạng thái `dang_thu_thap`, mà `xacDinhGiaiDoan` suy trạng thái
           * đó về **cột ②**. Không chốt tiếp thì người dùng đính đủ báo giá, bấm nút, và thẻ
           * đứng nguyên chỗ cũ — đúng kiểu "bấm mà không thấy gì" Ban lãnh đạo đã báo nhiều lần.
           *
           * 📌 An toàn vì nhánh này chỉ chạy khi hồ sơ CHƯA có bảng `dang_thu_thap` nào, nên
           * `doiTrangThaiBaoGiaTheoDeNghi` chỉ đụng đúng bảng vừa tạo.
           *
           * ⚠️ Điều kiện đính kèm KHÔNG bị bỏ qua ở đây: hộp đã khoá nút cho tới khi đủ tệp
           * (`dieuKienConVuong`), nên tới được dòng này nghĩa là đã đủ.
           */
          if (hanhDong.chotLuon) {
            doiTrangThaiBaoGiaTheoDeNghi(prId, "dang_thu_thap", "da_so_sanh", nguoiDung.tenHienThi);
            toast.success("Đã chốt đủ báo giá", {
              description: `${the.deNghi.code} chuyển sang "Xét duyệt báo giá".`,
            });
            break;
          }
          toast.success("Đã tạo bảng báo giá", {
            description: `${the.deNghi.code} chuyển sang "Yêu cầu NCC báo giá".`,
          });
        } else {
          toast.error("Đã hết chỗ cho bảng báo giá thử", {
            description: "Bản chạy thử chỉ tạo được 12 bảng báo giá. Tải lại trang để về dữ liệu gốc.",
          });
        }
        break;
      }
      case "chot_so_sanh":
        doiTrangThaiBaoGiaTheoDeNghi(prId, "dang_thu_thap", "da_so_sanh", nguoiDung.tenHienThi);
        toast.success("Đã chốt đủ báo giá", {
          description: `${the.deNghi.code} chuyển sang "Xét duyệt báo giá".`,
        });
        break;
      case "dong_do":
        // Hộp xác nhận đã hỏi rồi (nút tông nguy hiểm) nên ở đây làm luôn,
        // không hỏi lại lần hai trên thông báo như trước.
        dongDoDeNghi(prId, nguoiDung.tenHienThi, ghiChu);
        toast.success("Đã đóng dở đề nghị", {
          /* Nhắc lại lý do vừa ghi: người bấm thấy ngay app đã nhận đúng chữ mình nhập. */
          description: ghiChu ? `${the.deNghi.code} — ${ghiChu}` : the.deNghi.code,
        });
        break;
      case "mo_trang":
        toast.info("Bước này cần thao tác nghiệp vụ", { description: hanhDong.thongBao });
        router.push(hanhDong.duongDan);
        break;
      case "lui_buoc": {
        // Hủy chứng từ tương ứng để thẻ thật sự về bước trước — xem `luiVeBuoc`.
        const gop = luiVeBuoc(prId, hanhDong.ve, nguoiDung.tenHienThi);
        /* 🔴 NÓI ĐÚNG CHUYỆN VỪA XẢY RA (22/08/2026). Lùi về bước ① có thể GỘP các bản tách trở
           lại phiếu gốc, và khi đó chính thẻ vừa kéo có thể không còn. Báo *"{mã} về Tiếp nhận"*
           cho một mã vừa bị gộp mất là nói sai với người dùng — họ đi tìm thẻ đó không thấy. */
        if (gop) {
          toast.success("Đã hoàn trả về phiếu đề nghị gốc", {
            description: `Gộp ${gop.soPhieuDaGop} phiếu tách trở lại ${gop.maGoc} — hồ sơ về "${NHAN_GIAI_DOAN[hanhDong.ve].nhan}".`,
          });
        } else {
          toast.success("Đã lùi một bước", {
            description: `${the.deNghi.code} về "${NHAN_GIAI_DOAN[hanhDong.ve].nhan}".`,
          });
        }
        break;
      }
      /**
       * ★★ ĐÃ GỠ XONG VƯỚNG MẮC TRONG HỘP → CHẠY ĐÚNG VIỆC ĐÃ ĐỊNH TỪ ĐẦU.
       * Ban lãnh đạo 25/08/2026: *"Phải được duyệt thì mới nhảy"* — nhánh này CHÍNH LÀ cái
       * "được duyệt": nó chỉ chạy khi người dùng bấm nút trong hộp, không chạy lúc đính tệp.
       *
       * 🔴 KHÔNG TÍNH LẠI HÀNH ĐỘNG Ở ĐÂY. `hanhDongSau` do `quyetDinhKeoTha` quyết một lần
       * lúc thả thẻ; hỏi lại lần hai ở tầng giao diện là mở đường cho hai câu trả lời khác nhau
       * cho cùng một cú kéo — đúng kiểu lệch đã phải sửa nhiều lần.
       *
       * ⚠️ TypeScript KHÔNG bắt được nếu quên nhánh này: `switch` không có `default` nhưng cũng
       * không có chốt `never`, nên thiếu một `case` là **rơi im lặng** — bấm nút, không có gì
       * xảy ra, không lỗi nào báo. Bài kiểm *"can_go_vuong phải mang theo HÀNH ĐỘNG SAU"* trong
       * `kiem-luat-dung-chung.mjs` canh đúng chỗ này.
       */
      case "can_go_vuong":
        thucThiKeoTha(prId, hanhDong.hanhDongSau, ghiChu);
        break;
      case "khong_the":
        // Đã chặn ở `xuLyTha` trước khi mở hộp xác nhận — nhánh này chỉ để đủ kiểu.
        toast.error("Không chuyển được", { description: hanhDong.lyDo });
        break;
    }
  }

  return (
    <>
      {/* Tiêu đề và thanh chọn cách xem gộp một khối, cách nhau hẹp — để thanh
          tab dính liền tiêu đề đúng như bảng Base, không hở một dải trống. */}
      <div className="flex flex-col gap-(--hp-md-card-gap)">
        <PageHeader
          crumbs={[{ label: "Thu mua", href: "/tong-quan" }, { label: "Quy trình mua hàng" }]}
          title="Quy trình mua hàng"
          description="Đề nghị mua hàng đã duyệt, nhận từ các phòng ban trong công ty"
          /**
           * 🔴 ĐÃ BỎ NÚT "Tạo đề nghị mới" (21/08/2026) — Ban lãnh đạo: *"chức năng này nay đã có
           * trong app request nên có thể bỏ nó đi"*.
           *
           * Từ 20/08/2026 đề nghị vào app bằng cửa tiếp nhận tự động
           * (`app/api/app-request/de-nghi-moi/route.ts`): App Request duyệt xong là đẩy sang, kèm
           * mã đề xuất để đối chiếu. Lập tay ở màn này là mở đường thứ hai sinh đề nghị **không
           * có mã đề xuất**, và về sau không ai tra được phiếu đó từ App Request.
           *
           * ⚠️ MÀN `/de-nghi/nhan-moi` VẪN CÒN VÀ VẪN CÓ ĐƯỜNG VÀO — nút "Tạo đề nghị" ở màn
           * **Công việc của tôi** (`trang/viec-cua-toi.tsx`). Đã kiểm trước khi bỏ, đúng luật
           * `BAN-DO-MA-NGUON.md` mục 2b (phiên 03 suýt làm module Báo giá thành mồ côi vì bỏ
           * đường vào mà không kiểm). Muốn bỏ hẳn chức năng lập tay thì phải bỏ cả nút đó —
           * việc này chờ Ban lãnh đạo chốt, không tự suy rộng từ một câu.
           */
        />

        {/* Cao 44px trên điện thoại cho đủ vùng chạm theo V1.1. */}
        <Tabs value={cachXem} onValueChange={(v) => setCachXem(v as CachXem)}>
          <TabsList variant="line" className="h-auto md:h-9">
            <TabsTrigger value="bang" className="h-11 px-3 md:h-[calc(100%-1px)]">
              <LayoutGrid aria-hidden />
              Dạng bảng
            </TabsTrigger>
            <TabsTrigger value="danh_sach" className="h-11 px-3 md:h-[calc(100%-1px)]">
              <List aria-hidden />
              Danh sách
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {deNghi.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Chưa có đề nghị nào"
          description="Đề nghị đã duyệt của các phòng ban sẽ hiện ở đây."
        />
      ) : cachXem === "bang" ? (
        // `flex-1` + `min-h-[420px]`: bảng chiếm trọn phần màn hình còn lại,
        // màn quá thấp thì vẫn giữ tối thiểu 420px rồi cuộn trang như thường.
        // `data-rong-toan-man`: xin khung tổng bỏ giới hạn bề rộng A4 cho riêng
        // màn này — 8 cột cần trải hết bề ngang mới chia đều được (xem `khung-tong.tsx`).
        <div data-rong-toan-man className="flex min-h-[420px] flex-1 flex-col gap-2">
          {/**
            * ★★★ KÉO THẢ ĐÃ TẮT HOÀN TOÀN — Ban lãnh đạo 27/08/2026 trả lời thẳng câu hỏi *"sao
            * vẫn còn chức năng kéo thả"*: **"Tắt hết"**.
            *
            * (26/08/2026 mới tắt kéo LÙI; kéo tiến vẫn chạy nên Ban lãnh đạo còn thấy hộp thoại
            * "Chuyển nhiệm vụ sang giai đoạn tiếp theo" khi kéo thẻ.)
            *
            * 🔴 VÌ SAO TẮT LÀ ĐÚNG: giai đoạn của hồ sơ được SUY RA TỪ CHỨNG TỪ CÓ THẬT
            * (`xacDinhGiaiDoan` đọc đơn hàng, bảng báo giá, phiếu nhận). Kéo thẻ không tạo ra
            * chứng từ nào, nên nó chỉ còn hai lựa chọn: mở hộp thoại bắt người dùng làm việc thật
            * — tức một đường ĐI VÒNG tới đúng cái nút đã có trong trang chi tiết; hoặc đổi nhãn
            * chay — mà nhãn chay thì lần vẽ bảng kế tiếp thẻ tự nhảy về chỗ cũ.
            *
            * 🔴🔴 TẮT Ở ĐÂY — TẦNG GIAO DIỆN — CHỨ KHÔNG CHẶN TRONG `quyetDinhKeoTha`.
            * Đã thử chặn ở tầng luật và ĐO ĐƯỢC HẬU QUẢ: **13/57 bài kiểm luật lập tức đỏ**, vì
            * `quyetDinhKeoTha` là nơi giữ toàn bộ điều kiện chuyển bước do Ban lãnh đạo chốt từ
            * 10/08 tới 25/08 (phải có đủ báo giá · phải có bảng so sánh · không nhảy cóc · ngoại
            * lệ cho lập bảng khi bước ② chưa có bảng…). Chặn ở đó là những luật ấy thành code
            * chết và **mất dấu vết chỉ đạo** — đúng thứ `CLAUDE.md` §6.6 cấm.
            *
            * ✅ Luật vẫn sống và vẫn được dùng: nút chuyển bước trong trang chi tiết đề nghị hỏi
            * cùng bộ điều kiện qua `dsDieuKienConVuong`.
            *
            * ✅ CÁCH BẬT LẠI: đổi lại thành `keoThaDuoc={quyen.lapPO}` và bỏ `onTha={undefined}`.
            * Không phải dựng lại gì — `xuLyTha` và toàn bộ luật vẫn còn nguyên.
            *
            * ⚠️ PHẢI TẮT CẢ HAI: `keoThaDuoc` bỏ `draggable` khỏi thẻ, `onTha` bỏ chỗ nhận thả.
            * Chỉ tắt một cái thì trình duyệt vẫn cho kéo (hoặc vẫn có cột nhận), và người dùng
            * kéo được một nửa quãng đường rồi thả xuống không có gì xảy ra — khó hiểu hơn là
            * không kéo được.
            *
            * 📌 CẬP NHẬT 28/08/2026: `onTha` bên dưới KHÔNG còn là `undefined` nữa — nó vẫn đúng
            * cho DRAG (thẻ vẫn không kéo được, `keoThaDuoc` vẫn `false`), nhưng giờ menu ⋯ cần
            * gọi lại `xuLyTha` cho 2 mục "Chuyển sang giai đoạn kế tiếp"/"Chuyển về giai đoạn
            * trước" (đường vào mới của `HopChuyenGiaiDoan`, xem `bang-quy-trinh-mua-hang.tsx` →
            * `MenuThaoTacThe`). Đừng đọc dòng `onTha={xuLyTha}` bên dưới là "đã bật lại kéo thả"
            * — hai việc đã tách rời hẳn nhau kể từ đây.
            */}
          <BangQuyTrinhMuaHang
            cot={cot}
            keoThaDuoc={false}
            /**
             * ★★ CHỈ CHO VAI TRÒ LÀM NGHIỆP VỤ — giữ đúng luật cũ của `onXemNhanh`: hộp
             * `HopChuyenGiaiDoan` có ô đính kèm và nút chuyển bước, người chỉ xem mà thấy 2 mục
             * "Chuyển sang giai đoạn kế tiếp"/"Chuyển về giai đoạn trước" thì bấm vào không ăn.
             *
             * 🔴 PHẢI GỌI VỚI `laXemNhanh = true` — vá lỗi thật bắt được lúc review (agent review
             * độc lập bắt được, kiểm lại đúng). Hàm `xemNhanhThe` đã bỏ LUÔN gọi
             * `xuLyTha(prId, buocKe, true)`; viết `onTha={xuLyTha}` trần ở đây bỏ mất tham số thứ
             * 3, `laXemNhanh` lặng lẽ rơi về mặc định `false` — bước bị chặn cứng (`khong_the`)
             * thì chỉ bắn toast đỏ rồi thôi, `HopChuyenGiaiDoan` (hộp giải thích lý do vướng)
             * KHÔNG mở — đúng lúc người dùng cần xem lý do nhất. Bọc lại đây để giữ nguyên hành
             * vi "xem nhanh" cũ khi hộp mở qua menu ⋯ (không phải kéo thả thật).
             *
             * ⚠️ NẾU SAU NÀY BẬT LẠI KÉO THẢ (`keoThaDuoc={true}`, xem chú thích phía trên): `onTha`
             * lúc đó CÒN được gọi từ chính việc kéo thả, mà kéo thả cần `laXemNhanh=false` (chặn
             * bằng toast, không mở hộp — xem chú thích ở `xuLyTha`). Khi đó phải TÁCH hai đường gọi
             * ra 2 hàm khác nhau, không dùng chung dòng này nữa.
             */
            onTha={quyen.lapPO ? (prId, dich) => xuLyTha(prId, dich, true) : undefined}
            // Menu ⋯ chỉ mở cho vai trò làm nghiệp vụ; người chỉ xem không thấy thao tác ghi.
            thaoTac={quyen.lapPO ? thaoTacThe : undefined}
            /**
             * ★★ 3 CÁCH XEM (chốt 28/08/2026, xem video Base.vn) — không còn `onXemNhanh`:
             *
             *   1. Bấm thẳng vào thẻ → `<Link href="/de-nghi/[id]">` trong bảng tự điều hướng,
             *      không cần gì thêm ở đây.
             *   2. Menu ⋯ → "Xem trong tab mới" → bảng tự `window.open`, cũng không cần gì thêm.
             *   3. Menu ⋯ → "Xem trong pop-up" → `onXemPopup` dưới đây, MỞ CHO MỌI VAI TRÒ (kể
             *      cả người chỉ xem) — đây là thao tác XEM, khác hẳn `thaoTac`/`onTha` ở trên.
             */
            onXemPopup={onXemPopupThe}
          />

          {/**
           * ★★ "CÁCH 3": XEM NHANH DẠNG POP-UP — 28/08/2026, đúng hành vi Sếp xem trong video
           * Base.vn: nội dung ĐẦY ĐỦ y hệt trang riêng, nhưng hiện dạng lớp phủ đè lên board
           * (board vẫn đứng nguyên phía sau, KHÔNG đổi URL) — đóng lại là về ngay đúng chỗ đang
           * xem, không mất bộ lọc/vị trí cuộn.
           *
           * 🔴 NHÚNG NGUYÊN `TrangChiTietDeNghi` — không viết lại nội dung lần hai. Trang đó đã
           * là bản "đầy đủ" đúng nghĩa (tiến trình các giai đoạn, người theo dõi, danh sách công
           * việc, thảo luận...); viết thêm một bản rút gọn ở đây là hai nguồn nói khác nhau về
           * cùng một hồ sơ — đúng lỗi đã sửa nhiều lần trong file này (xem `moiThe` ở trên).
           *
           * 📌 KHÔNG LẶP SIDEBAR CỦA APP: sidebar (`Phòng Thu mua`, menu trái) nằm ở
           * `app/(app)/layout.tsx`, dựng MỘT LẦN cho cả app — `TrangChiTietDeNghi` không tự vẽ
           * lại nó, nên nhúng vào Dialog tự động không bị lặp, không cần cắt/ẩn gì thêm.
           *
           * ⚠️ `sm:max-w-[94vw]`, KHÔNG PHẢI SỐ `rem` CỐ ĐỊNH. `DialogContent` mặc định có sẵn
           * `sm:max-w-sm` (384px) — cùng biến thể `sm:`, Tailwind xếp lớp SAU cùng breakpoint
           * theo thứ tự định nghĩa, không theo thứ tự trong `className`, nên một giá trị không
           * tiền tố `sm:` KHÔNG thắng nổi `sm:max-w-sm` từ 640px trở lên (đã dính lỗi này khi
           * làm: hộp co lại còn ~384px, chữ vỡ dòng từng chữ một, xem ảnh demo trước khi vá).
           *
           * 📌 GẦN TRÀN MÀN HÌNH — 2 lần chỉnh liên tiếp cùng ngày:
           *   1. `max-w-4xl` (896px) → `max-w-6xl` (1152px): Sếp thấy hộp còn hẹp so với board.
           *   2. `max-w-6xl` → `94vw`: Sếp gửi ảnh đúng hộp của Base.vn thật, chỉ ra Base để hộp
           *      GẦN TRÀN HẲN màn hình (chỉ chừa viền mờ mỏng), không phải một cỡ cố định vài
           *      trăm px giữa màn hình.
           *
           * 🔴 PHẢI DÙNG ĐƠN VỊ `vw` (theo % chiều rộng màn hình), KHÔNG PHẢI RÌA `rem` CỐ ĐỊNH
           * NHƯ TRƯỚC: `max-w-6xl` trên màn 1280px đã gần kín, nhưng trên màn 3840px (như ảnh
           * Base Sếp gửi, máy màn hình rất rộng) vẫn chỉ chiếm 1152px — một dải hẹp lọt thỏm giữa
           * màn hình, đúng thứ Sếp vừa chê. `94vw` luôn tỉ lệ đúng theo màn hình đang xem, không
           * phân biệt máy nhỏ hay màn hình rộng.
           *
           * ⚠️⚠️ `overflow-y-auto` PHẢI Ở DIV BỌC BÊN TRONG, KHÔNG ĐẶT THẲNG LÊN `DialogContent`
           * — vá lỗi thật bắt được lúc review đầu tiên: nút Đóng (×) mặc định của `DialogContent`
           * là `position: absolute` NẰM TRONG chính khối đó, đặt `overflow-y-auto` lên cùng khối
           * thì nút Đóng TRÔI THEO nội dung khi cuộn. Bản đầu chỉ tách khối cuộn ra một div con để
           * né lỗi này; bản này (28/08/2026, sau khi Sếp đối chiếu ảnh code thật với ảnh demo) đi
           * xa hơn — bỏ hẳn nút Đóng mặc định, dựng thanh xanh `shrink-0` (không cuộn, vì
           * `DialogContent` giờ là `flex flex-col`) chứa cả tiêu đề lẫn nút Đóng riêng, còn vùng
           * nội dung là `flex-1 overflow-y-auto` bên dưới — nguyên lý "tách khối cuộn khỏi khối
           * chứa nút Đóng" vẫn giữ, chỉ đổi CÁCH tách cho khớp luôn với bản demo đã duyệt.
           */}
          <Dialog open={xemPopupId !== null} onOpenChange={(mo) => !mo && setXemPopupId(null)}>
            {/**
              * ★★ THANH TIÊU ĐỀ XANH + NÚT ĐÓNG NỔI BẬT — thêm 28/08/2026, Sếp đối chiếu ảnh
              * code thật với ảnh demo đã duyệt và chỉ ra: bản code thiếu hẳn khối chrome này,
              * chỉ có nút × nhỏ mặc định của `DialogContent` (dễ lẫn với nút × của khối "GIAI
              * ĐOẠN HIỆN TẠI" bên trong trang, nhìn không giống 2 nút khác nhau). Không có thanh
              * này, hộp trông như "trang đầy đủ bị bóp hẹp lại" chứ không rõ đang xem PO-UP.
              *
              * 🔴 TẮT `showCloseButton` MẶC ĐỊNH của `DialogContent` — tự dựng nút Đóng riêng
              * trong thanh xanh (đúng vị trí/kiểu dáng bản demo), tránh 2 nút Đóng chồng nhau.
              */}
            {/* `flex flex-col` GHI ĐÈ HẲN `grid` mặc định của `DialogContent` — twMerge chỉ dedup
                trong đúng nhóm xung đột của nó; `flex-col` một mình (thiếu `flex`) không tắt được
                `display: grid` nền, thanh xanh + vùng cuộn bên dưới sẽ không tự chia đúng chiều
                cao cho nhau. */}
            <DialogContent
              showCloseButton={false}
              className="sm:max-w-[94vw] max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0"
            >
              {/**
                * ★★ ĐƠN GIẢN LẠI THANH TIÊU ĐỀ — 28/08/2026, video thứ hai Sếp quay: thanh của
                * Base.vn thật chỉ có "‹ Chi tiết nhiệm vụ" trơn (không có mã đề nghị, không có
                * mô tả "Pop-up đè lên board..."). Bỏ `DialogDescription` — `DialogTitle` một
                * mình vẫn đủ gán `aria-labelledby` cho Base UI, không cần cặp tiêu đề+mô tả nữa.
                *
                * 🔴 GIỮ `truncate` + `min-w-0`: mã đề nghị dài (đã thấy thực tế: mã hợp đồng +
                * tên công trình dài) vẫn phải nhường chỗ cho cụm nút bên phải, không đẩy tràn.
                */}
              <div className="flex shrink-0 items-center justify-between gap-3 bg-primary px-4 py-3 text-primary-foreground">
                <DialogTitle className="min-w-0 truncate text-sm font-semibold text-primary-foreground">
                  ‹ Chi tiết đề nghị
                </DialogTitle>
                <div className="flex shrink-0 items-center gap-1">
                  {/**
                    * ★★ MENU "•••" THỨ HAI, RIÊNG BÊN TRONG POP-UP — thêm 28/08/2026, đúng
                    * video Base.vn thật: pop-up đang mở có SẴN 1 menu "•••" của chính nó (khác
                    * menu ⋯ trên thẻ Kanban ở "cách 2"/"cách 3") để PHÓNG NGAY view đang xem
                    * thành to hơn — không cần đóng pop-up rồi mở lại đúng đề nghị đó từ đầu.
                    *
                    * 🔴 "Xem toàn màn hình" GỌI `router.push`, KHÔNG GỌI `setXemPopupId(null)`
                    * TRƯỚC: điều hướng làm unmount cả trang board (kèm Dialog) trong cùng một
                    * nhịp — gọi tắt state trước là thao tác thừa, có thể gây nháy giao diện
                    * (đóng Dialog rồi mới điều hướng) thay vì chuyển thẳng.
                    */}
                  {xemPopupId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                            aria-label="Thêm lựa chọn xem"
                          />
                        }
                      >
                        <MoreHorizontal className="size-4" aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => router.push(`/de-nghi/${xemPopupId}`)}>
                            <Maximize2 className="size-4 shrink-0" aria-hidden />
                            Xem toàn màn hình
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(`/de-nghi/${xemPopupId}`, "_blank", "noopener")
                            }
                          >
                            <ExternalLink className="size-4 shrink-0" aria-hidden />
                            Xem trong tab mới
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <DialogClose
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                        aria-label="Đóng"
                      />
                    }
                  >
                    <X className="size-4" aria-hidden />
                  </DialogClose>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {/**
                 * ★ `key={xemPopupId}` — mỗi đề nghị mở pop-up là MỘT PHIÊN COMPONENT MỚI, không
                 * tái dùng lại state cũ (state form dở dang, hộp xác nhận đang mở...) của đề nghị
                 * trước đó. Hiện tại luôn đóng hẳn (unmount, `xemPopupId=null`) trước khi mở đề
                 * nghị khác nên chưa có đường nào thật sự dính lỗi này — thêm sẵn để chặn trước,
                 * phòng khi sau này có nút "đề nghị liên quan" bấm thẳng sang pop-up khác.
                 */}
                {xemPopupId && (
                  <TrangChiTietDeNghi
                    key={xemPopupId}
                    id={xemPopupId}
                    onDongPopup={() => setXemPopupId(null)}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* ===== BA HỘP SỬA của menu ⋯ ===== */}
          {dnDangSua && (
            <>
              <HopSuaThongTinChung
                mo={dangSua?.loai === "thong_tin"}
                deNghi={dnDangSua}
                onDong={() => setDangSua(null)}
                onLuu={(moi) => {
                  suaThongTinChung(dnDangSua.id, moi, nguoiDung.tenHienThi);
                  toast.success("Đã lưu thông tin chung", { description: dnDangSua.code });
                }}
              />
              <HopSuaThoiHan
                mo={dangSua?.loai === "thoi_han"}
                deNghi={dnDangSua}
                onDong={() => setDangSua(null)}
                onLuu={(ngayMoi, lyDo) => {
                  suaThoiHan(dnDangSua.id, ngayMoi, lyDo, nguoiDung.tenHienThi);
                  toast.success("Đã đổi thời hạn", {
                    description: `${dnDangSua.code} — lý do đã ghi vào nhật ký.`,
                  });
                }}
              />
              <HopSuaTruongBoSung
                mo={dangSua?.loai === "truong_bo_sung"}
                deNghi={dnDangSua}
                onDong={() => setDangSua(null)}
                onLuu={(truong) => {
                  suaTruongBoSung(dnDangSua.id, truong, nguoiDung.tenHienThi);
                  toast.success("Đã lưu trường tự thêm", { description: dnDangSua.code });
                }}
              />
              {/* ✏️ HỘP BÁM THEO BASE — Ban lãnh đạo 18/08/2026 gửi ảnh và yêu cầu *"cấu hình
                  giống 100%"*. Khác hộp ngay trên: hộp trên cho gõ TỰ ĐẶT TÊN trường, hộp này bày
                  đúng các trường của quy trình theo từng bước.
                  📌 Không truyền `onLuu`: hộp này gọi thẳng các hàm ghi đã có của kho dữ liệu (mỗi
                  trường một hàm, mỗi hàm giữ luật riêng) — xem chú thích đầu file của nó. */}
              <HopSuaTruongTuyChinh
                mo={dangSua?.loai === "truong_tuy_chinh"}
                deNghi={dnDangSua}
                onDong={() => setDangSua(null)}
              />
            </>
          )}

          {/* ===== XÁC NHẬN XÓA =====
              🔴 Xóa hẳn hồ sơ là việc nặng nhất trong menu; kho dữ liệu còn chặn thêm một lớp
              nếu đề nghị đã phát sinh báo giá / đơn hàng (xem `xoaDeNghi`). */}
          <HopXacNhan
            mo={hoiXoa !== null}
            tieuDe="Xóa hẳn đề nghị này?"
            moTa={
              dnHoiXoa
                ? `${dnHoiXoa.code} — ${dnHoiXoa.tieuDe}, ${dnHoiXoa.items.length} dòng vật tư.`
                : undefined
            }
            canhBao="Xóa là mất hẳn, không khôi phục được. Muốn giữ dấu vết để thống kê thì dùng “Đánh dấu thất bại”; muốn dọn bảng cho gọn thì dùng “Lưu trữ”."
            nhanDongY="Xóa hẳn"
            nguyHiem
            onDong={() => setHoiXoa(null)}
            onDongY={() => {
              if (!hoiXoa) return;
              const lyDo = xoaDeNghi(hoiXoa);
              if (lyDo) {
                toast.error("Không xóa được", { description: lyDo });
                return;
              }
              toast.success("Đã xóa đề nghị");
            }}
          />

          {/* ===== NHÂN BẢN — chép phiếu rồi bỏ bớt mặt hàng ngay trong một thao tác.
              Ban lãnh đạo 13/08/2026: tách phiếu để giao cho nhân viên phù hợp. ===== */}
          <HopNhanBanDeNghi
            deNghi={dnHoiNhanBan ?? null}
            mo={hoiNhanBan !== null}
            onDong={() => setHoiNhanBan(null)}
            onXacNhan={(sttGiuLai) => {
              if (!hoiNhanBan) return;
              const goc = dnHoiNhanBan;
              // Truyền cả hàm kiểm quyền: kho dữ liệu tự chặn, không tin vào việc giao diện
              // đã ẩn nút (ẩn nút không phải là chặn).
              const id = nhanBanDeNghi(
                hoiNhanBan,
                { uid: nguoiDung.uid, ten: nguoiDung.tenHienThi },
                sttGiuLai,
                (dn) => duocNhanBanDeNghi(dn, nguoiDung.uid, quyen),
              );
              if (!id) {
                // Nói thật khi không tạo được, đừng im lặng để người dùng tưởng đã xong.
                toast.error("Không nhân bản được", {
                  description: "Đã hết mã dự phòng cho bản chạy thử (tối đa 12 đề nghị).",
                });
                return;
              }
              const tach = goc && sttGiuLai.length < goc.items.length;
              toast.success("Đã nhân bản", {
                description: tach
                  ? `Bản mới giữ ${sttGiuLai.length}/${goc.items.length} mặt hàng, chưa phân bổ cho ai — giao việc trước khi đi tiếp.`
                  : "Bản sao chưa phân bổ cho ai — phân bổ lại trước khi đi tiếp.",
                action: { label: "Mở bản copy", onClick: () => router.push(`/de-nghi/${id}`) },
              });
            }}
          />
          {/* 📌 ĐÃ BỎ đoạn hướng dẫn "Thẻ tự sang cột kế tiếp khi bước hiện tại làm xong…"
              (Ban lãnh đạo 16/08/2026: *"bỏ hết các ghi chú kiểu này đi, đây là ứng dụng chuyên
              nghiệp nên không cần các cảnh báo kiểu này"*).

              Cách app vận hành thì người dùng học một lần rồi thuộc; câu hướng dẫn nằm cố định
              dưới mọi màn hình chỉ chiếm chỗ. Muốn tra lại thì đã có nút ⓘ ở đầu mỗi cột
              (`NutHuongDanGiaiDoan`) — hướng dẫn nằm đúng chỗ người dùng đi tìm nó. */}
        </div>
      ) : (
        <Card>
          <CardContent className="flex min-w-0 flex-col gap-(--hp-md-card-gap)">
            {/**
              * ★★ DẢI TAB LỌC — bám ảnh bảng Base (Ban lãnh đạo 23/08/2026).
              *
              * 📌 `<button>` thật trong `role="tablist"` như dải "Nhóm theo" ở màn Theo dõi — bấm
              * bằng Tab/Enter được, `min-h-11` đủ vùng chạm 44px (V1.1 Phần F).
              */}
            <div
              className="-mx-(--hp-md-card-pad) flex gap-1 overflow-x-auto border-b border-divider px-(--hp-md-card-pad)"
              role="tablist"
              aria-label="Lọc danh sách hồ sơ"
            >
              {NHAN_LOC_DS.map((l) => {
                const dangChon = locDS === l.ma;
                return (
                  <button
                    key={l.ma}
                    type="button"
                    role="tab"
                    aria-selected={dangChon}
                    onClick={() => setLocDS(l.ma)}
                    className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-xs font-semibold tracking-wide uppercase transition-colors ${
                      dangChon
                        ? "border-primary text-primary"
                        : "border-transparent text-text-desc hover:text-text-primary"
                    }`}
                  >
                    {l.nhan}
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] tabular-nums ${
                        l.ma === "qua_han" && demTheoLoc[l.ma] > 0
                          ? "bg-danger-bg font-bold text-danger"
                          : "bg-muted text-text-secondary"
                      }`}
                    >
                      {demTheoLoc[l.ma]}
                    </span>
                  </button>
                );
              })}
            </div>

            {theHienThi.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-desc">
                Không có hồ sơ nào ở mục này.
              </p>
            ) : (
              <>
                {/* Bảng — Desktop/Tablet. `thanh-keo-ngang-ro`: 9 cột nên màn hẹp phải cuộn ngang,
                    dùng đúng thanh cuộn dày đã chỉnh cho bảng quy trình. */}
                <div className="thanh-keo-ngang-ro hidden overflow-x-auto md:block">
                  <Table>
                    <TableHeader>
                      {/* Nhãn cột lấy ĐÚNG CHỮ của Base để người đang dùng Base đọc ra ngay. */}
                      <TableRow>
                        <TableHead>Nhiệm vụ</TableHead>
                        <TableHead className="w-48">Giai đoạn</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Đã giao cho</TableHead>
                        <TableHead>Thời hạn</TableHead>
                        <TableHead>Còn lại</TableHead>
                        <TableHead>Công việc</TableHead>
                        <TableHead>Người tạo</TableHead>
                        {/**
                          * 🔴 `w-full` Ở CỘT CUỐI — Ban lãnh đạo 25/08/2026: *"Sao này có khoảng
                          * trống"*, khoanh vùng trống giữa cột "Nhiệm vụ" và "Giai đoạn".
                          *
                          * NGUYÊN NHÂN (đo được, không đoán): `TableCell` có sẵn `whitespace-nowrap`
                          * nên mọi cột co về đúng nội dung; bảng lại là `w-full`, nên phần dư giữa
                          * bề rộng bảng và tổng nội dung **dồn hết vào cột rộng nhất** — chính là
                          * cột "Nhiệm vụ". Đo ở khung 1790px: cột đó **664px** trong khi nội dung
                          * chỉ **598px** → thừa 66px nằm ngay giữa bảng, đọc ra như một cột rỗng.
                          *
                          * `w-full` ở đây nghĩa là *"cột này xin 100%"*, nên nó hút toàn bộ phần dư
                          * và các cột khác co sát nội dung. Đo lại: "Nhiệm vụ" về **598px** (vừa
                          * khít), phần dư chuyển sang "Cập nhật" — tức ra **rìa phải**, nơi không
                          * kẹp giữa hai cột có chữ.
                          *
                          * ⚠️ Khoảng trống KHÔNG BIẾN MẤT được: bảng rộng hơn tổng nội dung thì
                          * chỗ dư phải nằm đâu đó. Việc chọn được là **nằm ở đâu**. Muốn bảng co
                          * sát nội dung thì bỏ `w-full` của `Table` — nhưng khi đó viền bảng ngắn
                          * hơn khung, trông cụt.
                          */}
                        <TableHead className="w-full">Cập nhật</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {theHienThi.map((t) => (
                        <DongDanhSachHoSo key={t.deNghi.id} the={t} />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Card List — Mobile. V1.1: bảng nhiều cột trên màn hẹp phải đổi sang thẻ. */}
                <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
                  {theHienThi.map((t) => (
                    <TheDanhSachHoSo key={t.deNghi.id} the={t} />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* HỘP XÁC NHẬN CHUYỂN BƯỚC — chặn thao tác lỡ tay khi kéo thả.
          Chỉ đạo Ban lãnh đạo 08/08/2026. */}
      {/* ★ HỘP CHUYỂN GIAI ĐOẠN — dựng theo ảnh Base Ban lãnh đạo gửi 15/08/2026:
          *"điều chỉnh tính năng kéo thả sang bước tiếp theo, sẽ có cửa sổ thông báo giống
          vậy và các trường nhập thông tin tương tự"*.

          Thay cho hộp xác nhận gọn trước đây. Hộp mới hiện thêm: đầu vào của giai đoạn đích
          (cách giao việc + thời hạn, dạng ô KHÓA), ô ghi chú "Những việc đã hoàn thành?",
          và danh sách công việc bắt buộc còn treo ở bước hiện tại. */}
      {xacNhan && (
        <HopChuyenGiaiDoan
          mo={moHopXacNhan}
          deNghi={deNghi.find((d) => d.id === xacNhan.prId)}
          tuBuoc={xacNhan.tuBuoc}
          denBuoc={xacNhan.denBuoc}
          cauHinh={cauHinh}
          seLam={xacNhan.noiDung.seLam}
          canhBao={xacNhan.noiDung.canhBao}
          nhanNut={xacNhan.noiDung.nhanNut}
          nguyHiem={xacNhan.noiDung.nguyHiem}
          congViecChuaXong={xacNhan.congViecChuaXong}
          /* Đường ra trang đầy đủ — bắt buộc từ 27/08/2026 vì cú bấm thẻ nay dừng ở hộp này. */
          duongDanChiTiet={`/de-nghi/${xacNhan.prId}`}
          /* Lý do bước này không đi được → hộp in lý do và KHÓA nút. Xem `chanCung` ở hộp. */
          chanCung={
            xacNhan.hanhDong.loai === "khong_the" ? xacNhan.hanhDong.lyDo : undefined
          }
          /**
           * ★★ ĐIỀU KIỆN CÒN VƯỚNG — TÍNH LẠI MỖI LẦN VẼ, KHÔNG DÙNG ẢNH CHỤP LÚC THẢ THẺ.
           * Ban lãnh đạo 25/08/2026: *"hiển thị các trường nhập nhanh các điều kiện chuyển bước"*.
           *
           * 🔴 ĐÂY LÀ THỨ LÀM NÚT TỰ MỞ KHÓA. Nếu lấy `xacNhan.hanhDong.dieuKien` (chụp lúc thả
           * thẻ) thì người dùng đính đủ tệp xong danh sách vẫn y nguyên, nút vẫn khóa, phải đóng
           * hộp mở lại mới thấy đổi — và họ sẽ tưởng việc đính kèm không ăn.
           *
           * 📌 `congViecTheoBuoc: {}` — bỏ việc bắt buộc khỏi danh sách này vì chúng đã có khối
           * tích riêng ngay bên dưới trong hộp (chỉ đạo 16/08/2026). Để nguyên là một việc hiện
           * hai chỗ, tích một chỗ mà chỗ kia không đổi.
           */
          dieuKienConVuong={(() => {
            if (xacNhan.hanhDong.loai !== "can_go_vuong") return [];
            const dn = deNghi.find((d) => d.id === xacNhan.prId);
            if (!dn) return [];
            return dsDieuKienConVuong(
              dn,
              xacNhan.tuBuoc,
              baoGia.filter((b) => b.prId === xacNhan.prId && b.trangThai !== "huy"),
              { ...cauHinh, congViecTheoBuoc: {} },
              vuongMacTrinhXetDuyet(dn, cauHinh),
            );
          })()}
          /* Đọc từ dữ liệu THẬT nên tích xong là ô đổi màu và nút mở khóa ngay, không phải
             đóng hộp mở lại. */
          daXong={(deNghi.find((d) => d.id === xacNhan.prId)?.congViecDaXong ?? []).map(
            (x) => x.maCongViec,
          )}
          onTichCongViec={(congViec, xong) => {
            /* 🔴 ĐỌC KẾT QUẢ (22/08/2026): tầng ghi nay có thể từ chối — việc "đã xử lý ủy nhiệm
               chi" đòi có Hóa đơn VAT trước. Trả về mà không đọc là cái tích không ăn mà người
               dùng không biết vì sao. */
            const loi = danhDauCongViecGiaiDoan(
              xacNhan.prId,
              congViec,
              xacNhan.tuBuoc,
              xong,
              nguoiDung.tenHienThi,
            );
            if (loi !== null) toast.error("Chưa tích được việc này", { description: loi });
          }}
          onDong={() => setMoHopXacNhan(false)}
          onXacNhan={(ghiChu, soBaoGia) => {
            setMoHopXacNhan(false);
            // Số báo giá đặt TRƯỚC khi chuyển bước: bước ② bắt đầu bằng việc đi hỏi giá, nên
            // yêu cầu phải nằm sẵn trong phiếu lúc nhân viên mở ra.
            if (soBaoGia) {
              datSoBaoGiaChoPhieu(xacNhan.prId, soBaoGia, nguoiDung.tenHienThi);
            }
            /* 🔴 KHI ĐÓNG DỞ, `ghiChu` LÀ LÝ DO THẤT BẠI — không ghi thành dòng "Chuyển bước"
               nữa. Hộp đã đổi nhãn ô thành "Lý do thất bại" và bắt buộc nhập (Ban lãnh đạo
               24/08/2026), còn `dongDoDeNghi` tự ghi nhật ký kèm lý do. Ghi thêm ở đây là hai
               dòng nhật ký cho một việc, và dòng "Chuyển bước: …" nói sai bản chất. */
            if (ghiChu && xacNhan.hanhDong.loai !== "dong_do") {
              ghiLichSuDeNghi(
                xacNhan.prId,
                nguoiDung.tenHienThi,
                `Chuyển bước: ${ghiChu}`,
              );
            }
            thucThiKeoTha(xacNhan.prId, xacNhan.hanhDong, ghiChu);
          }}
        />
      )}
    </>
  );
}


// ============================================================
// TAB "DANH SÁCH" — MỘT DÒNG / MỘT THẺ CHO MỘT HỒ SƠ
//
// ★ Ban lãnh đạo 23/08/2026: *"Bố cục lại phần hiển thị dạng danh sách giống vậy"*, kèm ảnh tab
//   **Danh sách** của bảng Base `TM-QT Mua hàng (HP CONS)`.
//
// 🔴 CHỈ NHẬN `TheDeNghiTrenBang` VÀ BÀY — không tự tính gì. Mọi con số (giai đoạn, hạn, người
//    phụ trách, chứng từ còn nợ) do `dungBangQuyTrinh` sinh ra một lần cho CẢ hai chế độ xem, nên
//    chuyển tab không bao giờ thấy hai bộ số khác nhau. Đây chính là lỗi của bản cũ: tab Danh sách
//    tự tính lấy nên không biết gì về giai đoạn hay chứng từ còn nợ.
//
// ⚠️ CÓ HAI THỨ CỦA BASE APP NÀY KHÔNG LÀM ĐƯỢC, đã thay bằng thứ tương đương — đừng "sửa cho
//    giống" mà không đọc lý do:
//   · **Ảnh đại diện người dùng** → app không lưu ảnh, nên dùng chữ viết tắt trong vòng tròn, đúng
//     cách thanh trên đang làm ("TM").
//   · **Cột "Công việc" của Base là một icon tròn** không rõ nghĩa → thay bằng SỐ MỤC CÒN THIẾU
//     (đỏ), thứ người quản lý thật sự cần đọc ở cột đó.
// ============================================================

/** Nền đặc cho vạch đã qua — không dùng token `*-bg` vì chúng pha trong suốt, vạch sẽ mờ tịt. */
const LOP_NEN_VACH: Record<string, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-neutral",
};

/** Chữ viết tắt cho vòng tròn thay ảnh đại diện — lấy chữ đầu của hai từ cuối. */
function chuVietTat(ten: string): string {
  const tu = ten.trim().split(/\s+/).filter(Boolean);
  if (tu.length === 0) return "?";
  return tu
    .slice(-2)
    .map((x) => x.charAt(0).toUpperCase())
    .join("");
}

function VongTronTen({ ten }: { ten: string }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-bg text-[10px] font-bold text-primary">
      {chuVietTat(ten)}
    </span>
  );
}

/** Ô "Giai đoạn": thanh vạch theo từng bước + "[n/8] Tên bước", đúng như Base. */
function OGiaiDoan({ the }: { the: TheDeNghiTrenBang }) {
  const viTri = CHUOI_BUOC_DS.indexOf(the.giaiDoan);
  const tong = CHUOI_BUOC_DS.length;
  /* Thất bại không nằm trong chuỗi → `viTri = -1`. Hiện 0 vạch chứ không hiện số âm. */
  const soVachXong = viTri < 0 ? 0 : viTri + 1;
  const nhan = NHAN_GIAI_DOAN[the.giaiDoan];
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {/* Mỗi bước một vạch, đúng kiểu Base — nhìn là biết đang ở đoạn nào của cả quy trình. */}
      <span className="flex gap-0.5" aria-hidden>
        {CHUOI_BUOC_DS.map((ma, i) => (
          <span
            key={ma}
            className={`h-1.5 flex-1 rounded-full ${
              i < soVachXong ? LOP_NEN_VACH[nhan.tong] : "bg-neutral/25"
            }`}
          />
        ))}
      </span>
      <span className="truncate text-xs text-text-secondary">
        {viTri >= 0 ? `[${soVachXong}/${tong}] ` : ""}
        {nhan.nhan}
      </span>
    </div>
  );
}

/** Dòng phụ dưới tên nhiệm vụ — đúng bốn thông tin Base hiện. */
function MoTaPhu({ the }: { the: TheDeNghiTrenBang }) {
  const dn = the.deNghi;
  return (
    <span className="text-xs text-text-desc">
      Bộ phận: {nhanPhongBan(dn.phongBanNguon)} · Nhóm đề xuất:{" "}
      {NHAN_NHOM_DE_XUAT[dn.nhomDeXuat ?? "khac"]} · Ngày đề nghị cấp:{" "}
      {new Date(dn.ngayCanHang).toLocaleDateString("vi-VN")} · Chi tiết: {dn.items.length} mặt hàng
    </span>
  );
}

/** Tên nhiệm vụ: mã đề xuất (App Request nếu có) + tên công trình — đúng cách Base ghép. */
function TenNhiemVu({ the }: { the: TheDeNghiTrenBang }) {
  const dn = the.deNghi;
  return (
    <Link href={`/de-nghi/${dn.id}`} className="text-sm font-semibold text-primary hover:underline">
      {dn.maDeXuatAppRequest || dn.code}
      {dn.tenCongTrinh ? ` - ${dn.tenCongTrinh}` : ""}
    </Link>
  );
}

/** Huy hiệu trạng thái suy từ giai đoạn — Base có 3 mức, app suy ra đủ cả 3. */
function HuyHieuTrangThai({ the }: { the: TheDeNghiTrenBang }) {
  if (the.giaiDoan === "hoan_thanh") return <StatusBadge label="Hoàn thành" tone="success" />;
  if (the.giaiDoan === "that_bai") return <StatusBadge label="Thất bại" tone="danger" />;
  return <StatusBadge label="Đang xử lý" tone="primary" />;
}

/** Ô "Công việc": số mục còn thiếu — xem chú thích đầu khối về việc thay icon của Base. */
function OConThieu({ the }: { the: TheDeNghiTrenBang }) {
  const so = the.dsConNo?.length ?? 0;
  if (so === 0) return <span className="text-xs text-text-disabled">—</span>;
  return (
    <span
      title={the.conNo}
      className="inline-flex items-center gap-1 text-xs font-semibold text-danger"
    >
      <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
      {so} còn thiếu
    </span>
  );
}

/** Thời điểm cập nhật gần nhất — dòng nhật ký CUỐI, đúng cột "Thời gian cập nhật" của Base. */
function capNhatGanNhat(the: TheDeNghiTrenBang): string {
  const ls = the.deNghi.lichSu ?? [];
  const cuoi = ls[ls.length - 1];
  return cuoi ? formatMocThoiGian(cuoi.thoiDiem) : "—";
}

function DongDanhSachHoSo({ the }: { the: TheDeNghiTrenBang }) {
  const dn = the.deNghi;
  return (
    <TableRow>
      <TableCell className="min-w-72 align-top">
        <div className="flex flex-col gap-1">
          <TenNhiemVu the={the} />
          <MoTaPhu the={the} />
        </div>
      </TableCell>
      <TableCell className="align-top">
        <OGiaiDoan the={the} />
      </TableCell>
      <TableCell className="align-top">
        <HuyHieuTrangThai the={the} />
      </TableCell>
      <TableCell className="align-top">
        {the.nguoiPhuTrach.length === 0 ? (
          <span className="text-xs text-text-desc">Chưa được giao</span>
        ) : (
          <span className="flex flex-col gap-1">
            {the.nguoiPhuTrach.map((ten) => (
              <span key={ten} className="flex items-center gap-1.5 text-xs text-text-primary">
                <VongTronTen ten={ten} />
                <span className="truncate">{ten}</span>
              </span>
            ))}
          </span>
        )}
      </TableCell>
      <TableCell className="align-top text-xs whitespace-nowrap text-text-primary">
        {new Date(dn.ngayCanHang).toLocaleDateString("vi-VN")}
      </TableCell>
      <TableCell className="align-top">
        <StatusBadge label={the.han.nhan} tone={the.han.tong} />
      </TableCell>
      <TableCell className="align-top">
        <OConThieu the={the} />
      </TableCell>
      <TableCell className="align-top">
        <span className="flex items-center gap-1.5 text-xs text-text-primary">
          <VongTronTen ten={dn.nguoiDeNghiTen} />
          <span className="truncate">{dn.nguoiDeNghiTen}</span>
        </span>
      </TableCell>
      <TableCell className="align-top text-xs whitespace-nowrap text-text-desc">
        {capNhatGanNhat(the)}
      </TableCell>
    </TableRow>
  );
}

function TheDanhSachHoSo({ the }: { the: TheDeNghiTrenBang }) {
  const dn = the.deNghi;
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border bg-card p-(--hp-md-card-pad) ${
        the.conNo ? "border-danger" : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <TenNhiemVu the={the} />
        <HuyHieuTrangThai the={the} />
      </div>
      <MoTaPhu the={the} />
      <OGiaiDoan the={the} />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-text-primary">
          {the.nguoiPhuTrach.length === 0 ? (
            <span className="text-text-desc">Chưa được giao</span>
          ) : (
            <>
              <VongTronTen ten={the.nguoiPhuTrach[0] ?? ""} />
              {the.nguoiPhuTrach.join(" · ")}
            </>
          )}
        </span>
        <StatusBadge label={the.han.nhan} tone={the.han.tong} />
      </div>
      <OConThieu the={the} />
      <span className="text-xs text-text-desc">
        Người tạo: {dn.nguoiDeNghiTen} · Cập nhật: {capNhatGanNhat(the)}
      </span>
    </div>
  );
}