"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, FileText, LayoutGrid, List } from "lucide-react";
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
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { duocNhanBanDeNghi } from "@/4-phan-quyen/quyen-theo-ho-so";
/* 📌 KHÔNG còn import `tinhTienDoDeNghi` / `tomTatTienDoDeNghi` / `soSanhDeNghiUuTien` ở đây
   (23/08/2026): cả hai chế độ xem nay lấy dữ liệu từ `dungBangQuyTrinh`, nó đã tính sẵn tiến độ
   và đã sắp thứ tự. Import lại là mở đường cho một nguồn số thứ hai. */
import {
  congViecChuaXongCuaBuoc,
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
      dungBangQuyTrinh(deNghi, donHang, baoGia, phieuNhan, cauHinh, new Date(), nguoiDung.uid),
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
  function xuLyTha(prId: string, dich: GiaiDoanMuaHang) {
    const the = cot.flatMap((c) => c.the).find((t) => t.deNghi.id === prId);
    if (!the) return;

    const poCuaDeNghi = donHang.filter((po) => po.prId === prId && po.trangThai !== "huy");
    const baoGiaCuaDeNghi = baoGia.filter((b) => b.prId === prId && b.trangThai !== "huy");
    // Công việc bắt buộc của bước đang đứng — lấy từ cấu hình quy trình (sửa được ở trang
    // Cài đặt), KHÔNG viết cứng trong luật kéo thả.
    const hanhDong = quyetDinhKeoTha(the, dich, poCuaDeNghi, baoGiaCuaDeNghi, cauHinh);
    if (!hanhDong) return;

    // Bước không hợp lệ: chặn ngay, không cần hỏi — hỏi rồi vẫn không cho làm thì vô nghĩa.
    if (hanhDong.loai === "khong_the") {
      toast.error("Không chuyển được", { description: hanhDong.lyDo });
      return;
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

  /** Thực thi sau khi người dùng đã bấm xác nhận trong hộp thoại. */
  function thucThiKeoTha(prId: string, hanhDong: HanhDongKeoTha) {
    const the = cot.flatMap((c) => c.the).find((t) => t.deNghi.id === prId);
    if (!the) return;

    switch (hanhDong.loai) {
      case "tao_bao_gia": {
        const id = taoBaoGiaGiaLap(prId, nguoiDung.tenHienThi);
        if (id) {
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
        dongDoDeNghi(prId, nguoiDung.tenHienThi);
        toast.success("Đã đóng dở đề nghị", { description: the.deNghi.code });
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
          <BangQuyTrinhMuaHang
            cot={cot}
            keoThaDuoc={quyen.lapPO}
            onTha={xuLyTha}
            // Menu ⋯ chỉ mở cho vai trò làm nghiệp vụ; người chỉ xem không thấy thao tác ghi.
            thaoTac={quyen.lapPO ? thaoTacThe : undefined}
          />

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
                        <TableHead>Cập nhật</TableHead>
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
            // Ghi chú của người chuyển bước vào NHẬT KÝ đề nghị — chỉ ghi khi có nội dung,
            // đừng làm bẩn lịch sử bằng những dòng trống.
            if (ghiChu) {
              ghiLichSuDeNghi(
                xacNhan.prId,
                nguoiDung.tenHienThi,
                `Chuyển bước: ${ghiChu}`,
              );
            }
            thucThiKeoTha(xacNhan.prId, xacNhan.hanhDong);
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