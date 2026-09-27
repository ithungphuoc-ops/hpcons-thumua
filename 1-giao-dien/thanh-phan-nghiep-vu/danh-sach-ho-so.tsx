"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { TableCell, TableHead, TableRow } from "@/1-giao-dien/nen-tang-ui/table";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { nhanPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";
import { NHAN_NHOM_DE_XUAT } from "@/3-du-lieu/kieu-du-lieu";
import { formatMocThoiGian } from "@/6-tien-ich/dinh-dang";
import {
  GIAI_DOAN_MUA_HANG,
  NHAN_GIAI_DOAN,
  type TheDeNghiTrenBang,
} from "@/2-quy-trinh/giai-doan-mua-hang";

// ============================================================
// DẠNG "DANH SÁCH" — MỘT DÒNG / MỘT THẺ CHO MỘT HỒ SƠ
//
// ★ Ban lãnh đạo 23/08/2026: *"Bố cục lại phần hiển thị dạng danh sách giống vậy"*, kèm ảnh tab
//   **Danh sách** của bảng Base `TM-QT Mua hàng (HP CONS)`.
// ★ DỜI RA TỆP RIÊNG 27/09/2026 — Sếp duyệt bản demo *"cửa sổ theo dõi đề nghị có hiển thị tương
//   tự vậy"*. Hai màn (Quy trình mua hàng · Theo dõi đề nghị) dùng CHUNG một chỗ vẽ, nên không bao
//   giờ hiện khác nhau cho cùng một hồ sơ. Khác nhau chỉ ở ba tuỳ chọn: đường dẫn khi bấm tên, có
//   hiện tên người phụ trách không, và có nút xổ nội dung phụ dưới dòng không.
//
// 🔴 CHỈ NHẬN `TheDeNghiTrenBang` VÀ BÀY — không tự tính gì. Mọi con số (giai đoạn, hạn, người
//    phụ trách, chứng từ còn nợ) do `dungBangQuyTrinh` sinh ra một lần, nên chuyển tab / chuyển màn
//    không bao giờ thấy hai bộ số khác nhau. Đây chính là lỗi của bản cũ: tab Danh sách tự tính lấy
//    nên không biết gì về giai đoạn hay chứng từ còn nợ.
//
// ⚠️ CÓ HAI THỨ CỦA BASE APP NÀY KHÔNG LÀM ĐƯỢC, đã thay bằng thứ tương đương — đừng "sửa cho
//    giống" mà không đọc lý do:
//   · **Ảnh đại diện người dùng** → app không lưu ảnh, nên dùng chữ viết tắt trong vòng tròn, đúng
//     cách thanh trên đang làm ("TM").
//   · **Cột "Công việc" của Base là một icon tròn** không rõ nghĩa → thay bằng SỐ MỤC CÒN THIẾU
//     (đỏ), thứ người quản lý thật sự cần đọc ở cột đó.
// ============================================================

/** Chuỗi bước để tính "[n/8]" — bỏ "Thất bại" vì nó không nằm trong chuỗi chạy. */
const CHUOI_BUOC_DS = GIAI_DOAN_MUA_HANG.filter((g) => g.ma !== "that_bai").map((g) => g.ma);

/** Số cột của bảng — dòng nhóm / dòng xổ phụ dùng `colSpan` bằng đúng số này. */
export const SO_COT_DANH_SACH_HO_SO = 9;

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

function TenNhiemVu({ the, duongDan }: { the: TheDeNghiTrenBang; duongDan: string }) {
  const dn = the.deNghi;
  return (
    <Link href={duongDan} className="text-sm font-semibold text-primary hover:underline">
      {dn.maDeXuatAppRequest || dn.code}
      {dn.tenCongTrinh ? ` - ${dn.tenCongTrinh}` : ""}
    </Link>
  );
}

function HuyHieuTrangThai({ the }: { the: TheDeNghiTrenBang }) {
  if (the.giaiDoan === "hoan_thanh") return <StatusBadge label="Hoàn thành" tone="success" />;
  if (the.giaiDoan === "that_bai") return <StatusBadge label="Thất bại" tone="danger" />;
  return <StatusBadge label="Đang xử lý" tone="primary" />;
}

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

/**
 * Ô "Đã giao cho".
 *
 * 🔒 `hienTen = false` (màn Theo dõi, vai trò không có `xemNguoiPhuTrach`): KHÔNG in tên nhân viên
 * thu mua — cam kết của màn Theo dõi với người ngoài phòng Thu mua. Chỉ nói đã có người lo hay chưa,
 * cùng ý với `DongPhanCong` ở màn Theo dõi.
 */
function ONguoiPhuTrach({
  the,
  hienTen,
  gon = false,
  canhGiua = false,
}: {
  the: TheDeNghiTrenBang;
  hienTen: boolean;
  gon?: boolean;
  canhGiua?: boolean;
}) {
  if (the.nguoiPhuTrach.length === 0) {
    return <span className="text-xs text-text-desc">Chưa được giao</span>;
  }
  if (!hienTen) return <span className="text-xs text-success-soft">Đã phân công</span>;
  if (gon) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-text-primary">
        <VongTronTen ten={the.nguoiPhuTrach[0] ?? ""} />
        {the.nguoiPhuTrach.join(" · ")}
      </span>
    );
  }
  return (
    <span className={`flex flex-col gap-1 ${canhGiua ? "items-center" : ""}`}>
      {the.nguoiPhuTrach.map((ten) => (
        <span key={ten} className="flex items-center gap-1.5 text-xs text-text-primary">
          <VongTronTen ten={ten} />
          <span className="truncate">{ten}</span>
        </span>
      ))}
    </span>
  );
}

function capNhatGanNhat(the: TheDeNghiTrenBang): string {
  const ls = the.deNghi.lichSu ?? [];
  const cuoi = ls[ls.length - 1];
  return cuoi ? formatMocThoiGian(cuoi.thoiDiem) : "—";
}

/** Nút mũi tên xổ / thu nội dung phụ dưới dòng — chỉ vẽ khi nơi dùng truyền `onDoiMoRong`. */
function NutMoRong({ moRong, onDoi, nhan }: { moRong: boolean; onDoi: () => void; nhan: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onDoi();
      }}
      aria-expanded={moRong}
      /* `aria-label`, KHÔNG dùng `sr-only`: nút nằm trong khung cuộn ngang, `sr-only` là
         `position:absolute` sẽ thoát `overflow` và kéo giãn cả trang (CLAUDE.md §5). */
      aria-label={nhan}
      title={nhan}
      className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-muted"
    >
      <ChevronRight
        className={`size-4 shrink-0 transition-transform ${moRong ? "rotate-90" : ""}`}
        aria-hidden
      />
    </button>
  );
}

export interface TuyChonDongHoSo {
  the: TheDeNghiTrenBang;
  /** Đường dẫn khi bấm tên hồ sơ — Quy trình: `/de-nghi/…`, Theo dõi: `/theo-doi/…`. */
  duongDan: string;
  /** Có in tên người phụ trách không — xem `ONguoiPhuTrach`. */
  hienNguoiPhuTrach: boolean;
  /** Có thì dòng có nút mũi tên + bấm dòng để xổ `noiDungMoRong` ngay bên dưới. */
  onDoiMoRong?: () => void;
  moRong?: boolean;
  noiDungMoRong?: ReactNode;
  /** Nhãn nút xổ (đọc bằng trình đọc màn hình + chữ trên nút ở thẻ điện thoại). */
  nhanMoRong?: string;
  /** Canh giữa mọi cột trừ "Nhiệm vụ" — màn Theo dõi (Sếp 27/09/2026: *"Canh giữa dòng"*). */
  canhGiua?: boolean;
  /** Ẩn dòng mô tả phụ dưới tên — màn Theo dõi (Sếp 27/09/2026: *"Không cần hiển thị"*). */
  anMoTaPhu?: boolean;
}

/**
 * Hàng tiêu đề — nhãn cột lấy ĐÚNG CHỮ của Base để người đang dùng Base đọc ra ngay.
 *
 * 🔴 `w-full` Ở CỘT CUỐI — Ban lãnh đạo 25/08/2026: *"Sao này có khoảng trống"*, khoanh vùng trống
 * giữa cột "Nhiệm vụ" và "Giai đoạn".
 *
 * NGUYÊN NHÂN (đo được, không đoán): `TableCell` có sẵn `whitespace-nowrap` nên mọi cột co về đúng
 * nội dung; bảng lại là `w-full`, nên phần dư giữa bề rộng bảng và tổng nội dung **dồn hết vào cột
 * rộng nhất** — chính là cột "Nhiệm vụ". Đo ở khung 1790px: cột đó **664px** trong khi nội dung chỉ
 * **598px** → thừa 66px nằm ngay giữa bảng, đọc ra như một cột rỗng.
 *
 * `w-full` ở đây nghĩa là *"cột này xin 100%"*, nên nó hút toàn bộ phần dư và các cột khác co sát
 * nội dung. Đo lại: "Nhiệm vụ" về **598px** (vừa khít), phần dư chuyển sang "Cập nhật" — tức ra
 * **rìa phải**, nơi không kẹp giữa hai cột có chữ.
 *
 * ⚠️ Khoảng trống KHÔNG BIẾN MẤT được: bảng rộng hơn tổng nội dung thì chỗ dư phải nằm đâu đó. Việc
 * chọn được là **nằm ở đâu**. Muốn bảng co sát nội dung thì bỏ `w-full` của `Table` — nhưng khi đó
 * viền bảng ngắn hơn khung, trông cụt.
 */
export function DauBangDanhSachHoSo({ canhGiua = false }: { canhGiua?: boolean }) {
  const g = canhGiua ? "text-center" : "";
  return (
    <TableRow>
      <TableHead>Nhiệm vụ</TableHead>
      <TableHead className={`w-48 ${g}`}>Giai đoạn</TableHead>
      <TableHead className={g}>Trạng thái</TableHead>
      {/* Cột TÊN NGƯỜI luôn căn trái — Sếp 27/09/2026: *"Căn trái mục tên nhân sự này"*. */}
      <TableHead>Đã giao cho</TableHead>
      <TableHead className={g}>Thời hạn</TableHead>
      <TableHead className={g}>Còn lại</TableHead>
      <TableHead className={g}>Công việc</TableHead>
      <TableHead>Người tạo</TableHead>
      {/* ★ Bảng canh giữa (màn Theo dõi) KHÔNG dồn phần dư vào cột cuối — Sếp 27/09/2026: *"Cân đối lại
          giao diện này nhé, khoảng trống còn khá nhiều"* (khoảng trắng lớn trước "Cập nhật"). Chữ đã canh
          giữa nên để trình duyệt chia phần dư cho MỌI cột; bảng quy trình (canh trái) giữ `w-full`. */}
      <TableHead className={canhGiua ? g : "w-full"}>Cập nhật</TableHead>
    </TableRow>
  );
}

export function DongDanhSachHoSo({
  the,
  duongDan,
  hienNguoiPhuTrach,
  onDoiMoRong,
  moRong = false,
  noiDungMoRong,
  nhanMoRong = "Xem thêm",
  canhGiua = false,
  anMoTaPhu = false,
}: TuyChonDongHoSo) {
  const dn = the.deNghi;
  const coMoRong = Boolean(onDoiMoRong);
  const g = canhGiua ? "text-center" : "";
  return (
    <>
      <TableRow
        onClick={coMoRong ? onDoiMoRong : undefined}
        className={coMoRong ? "cursor-pointer" : undefined}
      >
        <TableCell className="min-w-72 align-top">
          <div className="flex items-start gap-2">
            {onDoiMoRong && <NutMoRong moRong={moRong} onDoi={onDoiMoRong} nhan={nhanMoRong} />}
            {/* `stopPropagation`: bấm TÊN là mở hồ sơ, không phải xổ dòng. */}
            <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
              <TenNhiemVu the={the} duongDan={duongDan} />
              {!anMoTaPhu && <MoTaPhu the={the} />}
            </div>
          </div>
        </TableCell>
        <TableCell className={`align-top ${g}`}>
          <OGiaiDoan the={the} />
        </TableCell>
        <TableCell className={`align-top ${g}`}>
          <HuyHieuTrangThai the={the} />
        </TableCell>
        {/* Hai cột tên người (Đã giao cho · Người tạo) luôn căn trái, kể cả khi bảng canh giữa. */}
        <TableCell className="align-top">
          <ONguoiPhuTrach the={the} hienTen={hienNguoiPhuTrach} />
        </TableCell>
        <TableCell className={`align-top text-xs whitespace-nowrap text-text-primary ${g}`}>
          {new Date(dn.ngayCanHang).toLocaleDateString("vi-VN")}
        </TableCell>
        <TableCell className={`align-top ${g}`}>
          <StatusBadge label={the.han.nhan} tone={the.han.tong} />
        </TableCell>
        <TableCell className={`align-top ${g}`}>
          <OConThieu the={the} />
        </TableCell>
        <TableCell className="align-top">
          <span className="flex items-center gap-1.5 text-xs text-text-primary">
            <VongTronTen ten={dn.nguoiDeNghiTen} />
            <span className="truncate">{dn.nguoiDeNghiTen}</span>
          </span>
        </TableCell>
        <TableCell className={`align-top text-xs whitespace-nowrap text-text-desc ${g}`}>
          {capNhatGanNhat(the)}
        </TableCell>
      </TableRow>
      {coMoRong && moRong && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={SO_COT_DANH_SACH_HO_SO} className="pt-1 pb-3 whitespace-normal">
            {noiDungMoRong}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function TheDanhSachHoSo({
  the,
  duongDan,
  hienNguoiPhuTrach,
  onDoiMoRong,
  moRong = false,
  noiDungMoRong,
  nhanMoRong = "Xem thêm",
  anMoTaPhu = false,
}: TuyChonDongHoSo) {
  const dn = the.deNghi;
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border bg-card p-(--hp-md-card-pad) ${
        the.conNo ? "border-danger" : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <TenNhiemVu the={the} duongDan={duongDan} />
        <HuyHieuTrangThai the={the} />
      </div>
      {!anMoTaPhu && <MoTaPhu the={the} />}
      <OGiaiDoan the={the} />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <ONguoiPhuTrach the={the} hienTen={hienNguoiPhuTrach} gon />
        <StatusBadge label={the.han.nhan} tone={the.han.tong} />
      </div>
      <OConThieu the={the} />
      <span className="text-xs text-text-desc">
        Người tạo: {dn.nguoiDeNghiTen} · Cập nhật: {capNhatGanNhat(the)}
      </span>
      {onDoiMoRong && (
        <>
          {/* Vùng chạm 44px (V1.1) — trên điện thoại nút phải đủ to để bấm trúng. */}
          <button
            type="button"
            onClick={onDoiMoRong}
            aria-expanded={moRong}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary/30 bg-primary-bg px-3 text-sm font-medium text-primary"
          >
            <ChevronRight
              className={`size-4 shrink-0 transition-transform ${moRong ? "rotate-90" : ""}`}
              aria-hidden
            />
            {nhanMoRong}
          </button>
          {moRong && noiDungMoRong}
        </>
      )}
    </div>
  );
}
