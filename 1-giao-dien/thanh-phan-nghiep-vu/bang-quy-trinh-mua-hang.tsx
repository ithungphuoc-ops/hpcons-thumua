"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type DragEvent } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Copy,
  CopyPlus,
  Eye,
  ExternalLink,
  Forward,
  History,
  ListPlus,
  MoreHorizontal,
  Pencil,
  PictureInPicture2,
  Printer,
  Split,
  Trash2,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/1-giao-dien/nen-tang-ui/dropdown-menu";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { nhanPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";
import { NHAN_NHOM_DE_XUAT, type DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";
import { NutHuongDanGiaiDoan } from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-huong-dan-giai-doan";
import {
  GIAI_DOAN_MUA_HANG,
  type CotBangQuyTrinh,
  type GiaiDoanMuaHang,
  type TheDeNghiTrenBang,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import type { Tong } from "@/2-quy-trinh/trang-thai";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { formatDate } from "@/6-tien-ich/dinh-dang";

/**
 * BẢNG QUY TRÌNH MUA HÀNG — dạng cột (Kanban), dựng theo bảng
 * "TM-QT Mua hàng (HP CONS)" đang chạy trên Base.vn của công ty.
 *
 * Component này CHỈ hiển thị. Việc xác định thẻ thuộc cột nào nằm ở
 * `2-quy-trinh/giai-doan-mua-hang.ts` — không tính lại ở đây. Kéo thả cũng vậy:
 * component chỉ báo "thẻ X được thả vào cột Y" qua `onTha`, còn được phép hay
 * không và làm gì tiếp là việc của `quyetDinhKeoTha` + trang gọi bảng.
 *
 * Quy chuẩn V1.1 được giữ:
 *  · Màu lấy hết từ token, không có mã màu viết cứng
 *  · Trạng thái luôn có CẢ MÀU VÀ CHỮ — thẻ đỏ luôn kèm chữ "Quá hạn N ngày"
 *  · Vùng chạm của thẻ vượt 44×44px
 */

/** Khóa dữ liệu kéo thả — chỉ nhận thẻ do chính bảng này kéo. */
const KHOA_KEO_THA = "text/plain";

const LOP_VIEN_TRAI: Record<Tong, string> = {
  primary: "border-l-primary",
  success: "border-l-success",
  warning: "border-l-warning",
  danger: "border-l-danger",
  neutral: "border-l-neutral",
};

const LOP_NEN_NHAT: Record<Tong, string> = {
  primary: "bg-primary-bg",
  success: "bg-success-bg",
  warning: "bg-warning-bg",
  danger: "bg-danger-bg",
  neutral: "bg-neutral-bg",
};

const LOP_CHU_DAM: Record<Tong, string> = {
  primary: "text-primary-soft",
  success: "text-success-soft",
  warning: "text-warning-soft",
  danger: "text-danger-soft",
  neutral: "text-neutral-soft",
};

export interface BangQuyTrinhMuaHangProps {
  cot: CotBangQuyTrinh[];
  /** Bật kéo thả thẻ giữa các cột — chỉ vai trò được thao tác nghiệp vụ. */
  keoThaDuoc?: boolean;
  /** Gọi khi thả thẻ vào một cột. Trang chứa bảng quyết định làm gì tiếp. */
  onTha?: (prId: string, dich: GiaiDoanMuaHang) => void;
  /** Các thao tác của menu ⋯ trên thẻ. Không truyền thì menu chỉ còn mục xem/sao chép. */
  thaoTac?: ThaoTacThe;
}

/**
 * Các thao tác menu ⋯ cần tới kho dữ liệu — trang chứa bảng truyền xuống.
 *
 * 🔴 Bảng KHÔNG tự gọi kho dữ liệu: nó là component hiển thị thuần (xem chú thích đầu file),
 * mọi việc ghi đều do trang quyết định. Giữ đúng ranh giới này thì bảng còn dùng lại được ở
 * màn khác mà không kéo theo kho dữ liệu.
 */
export interface ThaoTacThe {
  onSuaThongTin: (prId: string) => void;
  onSuaThoiHan: (prId: string) => void;
  onSuaTruongBoSung: (prId: string) => void;
  onNhanBan: (prId: string) => void;
  onDoiLuuTru: (prId: string, luuTru: boolean) => void;
  onXoa: (prId: string) => void;
  /**
   * Phiếu NÀY có được người đang đăng nhập nhân bản không.
   *
   * 🔴 Hỏi theo TỪNG THẺ chứ không phải một cờ chung: Ban lãnh đạo 15/08/2026 chốt nhân viên
   * chỉ tách được phiếu **mình phụ trách**, mà mỗi thẻ trên bảng là một phiếu khác nhau.
   * Luật thật ở `4-phan-quyen/quyen-theo-ho-so.ts` → `duocNhanBanDeNghi`.
   */
  duocNhanBan: (deNghi: DeNghiMuaHang) => boolean;
  /**
   * Lập bảng báo giá cho phiếu này.
   *
   * 🔴 ĐƯỜNG VÀO DUY NHẤT BẤM ĐƯỢC TRÊN ĐIỆN THOẠI — Ban lãnh đạo 17/08/2026 bảo bỏ nút
   * "Lập bảng báo giá" khỏi trang chi tiết. Đường còn lại là kéo thẻ từ cột ① sang ②, mà
   * điện thoại không kéo được; trước 10/08/2026 app đã tắc đúng kiểu này. Bỏ mục này khỏi
   * menu là module Báo giá thành mồ côi — xem CLAUDE.md mục 3.4b.
   */
  onLapBaoGia: (prId: string) => void;
  /** Phiếu NÀY có lập được bảng báo giá không (đúng bước, chưa có bảng, đủ quyền). */
  duocLapBaoGia: (deNghi: DeNghiMuaHang) => boolean;
}

export function BangQuyTrinhMuaHang({
  cot,
  keoThaDuoc = false,
  onTha,
  thaoTac,
}: BangQuyTrinhMuaHangProps) {
  /**
   * ★ GIAI ĐOẠN CỦA THẺ ĐANG KÉO — `null` là không kéo gì.
   *
   * 🔴 Ban lãnh đạo 13/08/2026: *"khi kéo thả này chỉ hiện 1 ô phía trước hoặc phía sau,
   * không cho kéo sang ô thứ 2"*.
   *
   * Trước đó MỌI cột đều sáng viền khi kéo ngang qua và đều nhận thả — luật chặn nằm ở
   * `quyetDinhKeoTha` nên thả xa vẫn bị từ chối, nhưng người dùng chỉ biết SAU KHI đã thả.
   * Giao diện mời gọi một việc rồi từ chối chính việc đó.
   *
   * ⚠️ Phải giữ ở CHA, không đọc từ `dataTransfer` trong `dragover`: trình duyệt chặn đọc dữ
   * liệu kéo trong lúc đang kéo (chỉ cho đọc khi thả) vì lý do bảo mật.
   */
  const [giaiDoanDangKeo, setGiaiDoanDangKeo] = useState<GiaiDoanMuaHang | null>(null);
  const thuTu = cot.map((c) => c.giaiDoan.ma);

  /**
   * Cột này có nhận thả không: chỉ LIỀN TRƯỚC hoặc LIỀN SAU cột đang kéo.
   *
   * 📌 Cột "Thất bại" LUÔN nhận — đóng dở là nhánh dừng, gọi được từ bất cứ bước nào; nó
   * không nằm trong dãy tiến/lùi nên đo khoảng cách theo thứ tự cột là vô nghĩa.
   */
  function nhanDuocTha(ma: GiaiDoanMuaHang): boolean {
    if (!keoThaDuoc || giaiDoanDangKeo === null) return keoThaDuoc;
    if (ma === "that_bai") return true;
    if (giaiDoanDangKeo === "that_bai") return false;
    const iTu = thuTu.indexOf(giaiDoanDangKeo);
    const iDich = thuTu.indexOf(ma);
    if (iTu < 0 || iDich < 0) return false;
    /**
     * `<= 1` chứ không `=== 1`: tính cả CHÍNH CỘT ĐANG CHỨA THẺ.
     *
     * Kéo thẻ ra rồi đổi ý, thả về chỗ cũ là thao tác bình thường của mọi bảng kéo thả —
     * `quyetDinhKeoTha` trả `null` cho trường hợp này nên không có gì xảy ra. Làm mờ cột
     * nguồn thì người dùng thấy chính cột mình vừa nhấc thẻ lên bị chặn, trông như app lỗi.
     */
    return Math.abs(iDich - iTu) <= 1;
  }

  return (
    // Các cột nằm SÁT NHAU thành một bảng liền, ngăn nhau bằng đường kẻ mảnh
    // (`divide-x`) chứ không cách quãng — theo yêu cầu Ban lãnh đạo 06/08/2026.
    // Viền và bo góc nằm ở khung ngoài để cả bảng trông như một khối.
    // `flex-1 min-h-0`: bảng SỔ XUỐNG kín chiều cao còn lại của màn hình
    // (yêu cầu Ban lãnh đạo 07/08/2026) — cột dài quá thì cuộn bên trong cột.
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto rounded-xl border border-border">
      {/* 🔴 `w-full` CHỨ KHÔNG PHẢI `w-max` — sửa 15/08/2026.
          `w-max` là `max-content`: bề ngang hàng cột bằng TỔNG bề rộng nội dung tự nhiên của
          chúng, nên một mã hồ sơ dài (`260001-HPCS-PR-001 (copy 2) - NHÀ XƯỞNG ABC — GIAI
          ĐOẠN 2`) tự kéo cột phình ra 264px, bất chấp `basis` đã đặt 176px. Kết quả: bảng
          rộng 2.108px trong khung 1.626px và luôn phải cuộn ngang, dù cột đã được thu nhỏ.
          `w-full` thì cột nghe theo `basis`/`grow`; cột nào không đủ chỗ vẫn tràn ra và khung
          cha `overflow-x-auto` cho cuộn — đúng hành vi cần cho màn nhỏ.
          `flex-1` (không dùng min-h-full vì cha bọc ngoài từng là block): cột ăn hết chiều cao bảng. */}
      <div className="flex min-h-0 w-full flex-1 items-stretch divide-x divide-border">
        {cot.map((c) => (
          <CotQuyTrinh
            key={c.giaiDoan.ma}
            cot={c}
            keoThaDuoc={keoThaDuoc}
            nhanDuocTha={nhanDuocTha(c.giaiDoan.ma)}
            dangKeoTrenBang={giaiDoanDangKeo !== null}
            onBatDauKeo={setGiaiDoanDangKeo}
            onKetThucKeo={() => setGiaiDoanDangKeo(null)}
            onTha={onTha}
            thaoTac={thaoTac}
          />
        ))}
      </div>
    </div>
  );
}

function CotQuyTrinh({
  cot,
  keoThaDuoc,
  nhanDuocTha,
  dangKeoTrenBang,
  onBatDauKeo,
  onKetThucKeo,
  onTha,
  thaoTac,
}: {
  cot: CotBangQuyTrinh;
  keoThaDuoc: boolean;
  /** Cột này có nhận thả không — cha tính theo khoảng cách tới cột đang kéo. */
  nhanDuocTha: boolean;
  /** Đang có thẻ nào được kéo trên bảng hay không (để làm mờ cột không nhận). */
  dangKeoTrenBang: boolean;
  onBatDauKeo: (tu: GiaiDoanMuaHang) => void;
  onKetThucKeo: () => void;
  onTha?: (prId: string, dich: GiaiDoanMuaHang) => void;
  thaoTac?: ThaoTacThe;
}) {
  const { giaiDoan, the, soQuaHan } = cot;
  // Sáng viền cột khi đang kéo thẻ ngang qua — người dùng biết mình sắp thả vào đâu.
  const [dangKeoQua, setDangKeoQua] = useState(false);

  /**
   * 🔴 CỘT KHÔNG NHẬN THÌ KHÔNG GẮN SỰ KIỆN NÀO. Thiếu `onDragOver` + `preventDefault` là
   * trình duyệt tự hiện con trỏ "không cho phép" — người dùng biết ngay khi còn đang kéo,
   * không phải thả xong mới đọc thông báo lỗi (Ban lãnh đạo 13/08/2026).
   */
  const suKienKeoTha =
    keoThaDuoc && nhanDuocTha
      ? {
          onDragOver: (e: DragEvent<HTMLElement>) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDangKeoQua(true);
          },
          onDragLeave: (e: DragEvent<HTMLElement>) => {
            // Kéo qua thẻ con cũng bắn dragleave — chỉ tắt khi rời hẳn cột.
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDangKeoQua(false);
          },
          onDrop: (e: DragEvent<HTMLElement>) => {
            e.preventDefault();
            setDangKeoQua(false);
            onKetThucKeo();
            const prId = e.dataTransfer.getData(KHOA_KEO_THA);
            if (prId) onTha?.(prId, giaiDoan.ma);
          },
        }
      : {};

  // Cột ngoài phạm vi một bước: làm mờ để mắt thấy ngay chỗ nào thả được, chỗ nào không.
  const moDi = dangKeoTrenBang && !nhanDuocTha;

  return (
    <section
      /**
       * ★ BỀ RỘNG CỘT — Ban lãnh đạo 15/08/2026, qua ba lần chỉnh:
       *   1. *"thu gọn lại các ô này để hiển thị đủ trong 1 màn hình"* → bóp xuống 176px
       *   2. *"dãn cột rộng hơn chút nữa, này hẹp quá"* → 200px
       *   3. *"tăng bề rộng cột, a đã nói e sửa cho này rồi mà"* → 240px
       *
       * 🔴 ĐÂY LÀ MỘT ĐÁNH ĐỔI KHÔNG THỂ TRÁNH, ghi lại để người sau khỏi "sửa lại cho vừa
       * màn" rồi đi hết một vòng. Chỗ trống cho bảng ≈ bề ngang màn − 260px thanh bên − lề.
       * Muốn 8 cột cùng nằm gọn trên màn 1650px thì mỗi cột chỉ được ~169px — hẹp tới mức
       * mã hồ sơ vỡ làm ba dòng. Không có bề rộng nào vừa lòng cả hai yêu cầu.
       *
       * 👉 Đã chốt theo hướng ĐỌC ĐƯỢC: cột 240px, màn không đủ thì cuộn ngang. Cuộn là thao
       * tác quen thuộc của bảng Kanban (Trello để 272px và luôn cuộn); chữ vỡ thì không đọc
       * được, không có cách nào bù.
       *
       * `grow` vẫn giữ: màn đủ rộng thì phần dư chia đều, không để khoảng trống bên phải.
       */
      className={`flex min-w-[272px] shrink-0 grow basis-[272px] flex-col bg-muted transition-opacity xl:min-w-[248px] xl:basis-[248px] 2xl:min-w-[240px] 2xl:basis-[240px] ${
        dangKeoQua ? "ring-2 ring-primary ring-inset" : ""
      } ${moDi ? "opacity-40" : ""}`}
      {...suKienKeoTha}
    >
      {/* Đầu cột */}
      <header
        className={`flex flex-col gap-1 border-b border-border p-(--hp-md-row-pad) ${LOP_NEN_NHAT[giaiDoan.tong]}`}
      >
        <div className="flex items-start justify-between gap-2">
          {/* `title` để người mới rê chuột là hiểu cột này đang chờ việc gì. */}
          {/* 🔴 `min-h-[2.25rem]` = CHỖ CHO ĐÚNG HAI DÒNG — Ban lãnh đạo 15/08/2026: *"sao thụt
              lên xuống không đều vậy"*.

              Tên các bước dài ngắn khác nhau ("Tiếp nhận và kiểm tra" xuống 2 dòng, "Hoàn
              thành" chỉ 1 dòng), nên đầu cột cao thấp lệch nhau và dòng "N đề nghị" bên dưới
              chạy thành bậc thang. Đặt sẵn chỗ cho hai dòng thì mọi cột bằng nhau bất kể tên
              dài bao nhiêu — cùng cách đã dùng cho `min-h-7` ở hàng nút bên phải. */}
          <h2
            title={giaiDoan.moTa}
            className={`min-h-[2.25rem] text-sm font-semibold leading-tight ${LOP_CHU_DAM[giaiDoan.tong]}`}
          >
            {giaiDoan.nhan}
          </h2>
          {/* 🔴 `min-h-7` GIỮ CHIỀU CAO CHO CẢ HÀNG ĐẦU CỘT. Nút ⓘ cao 28px còn viên số chỉ
              ~20px; cột nào thiếu nút là đầu cột thấp hơn hẳn, đường kẻ ngang dưới header gãy
              thành bậc thang — Ban lãnh đạo bắt lỗi này ngày 11/08/2026. Đặt chiều cao tối
              thiểu ở đây thì về sau thêm hay bớt nút gì hàng vẫn thẳng. */}
          <span className="flex min-h-7 shrink-0 items-center gap-0.5">
            {/* ⓘ Hướng dẫn bước — chỉ đạo Ban lãnh đạo 11/08/2026 ("thêm nút để bấm vô sẽ
                đọc được hướng dẫn sử dụng"). Đặt ở ĐẦU CỘT vì đó là chỗ người dùng nhìn khi
                phân vân "cột này phải làm gì thì mới qua được cột sau". */}
            <NutHuongDanGiaiDoan giaiDoan={giaiDoan.ma} />
            <span className="rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-text-primary">
              {the.length}
            </span>
          </span>
        </div>
        <p className="text-xs text-text-desc">
          {soQuaHan > 0 ? `${the.length} đề nghị · ${soQuaHan} quá hạn` : `${the.length} đề nghị`}
        </p>
      </header>

      {/* Thân cột — `flex-1 min-h-0` để mọi cột cao bằng nhau và kín đáy bảng;
          nội dung vượt chiều cao thì cuộn dọc BÊN TRONG cột, trang không dài ra. */}
      <div className="flex min-h-0 flex-1 flex-col gap-(--hp-md-row-gap) overflow-y-auto p-(--hp-md-row-pad)">
        {the.length === 0 ? (
          <p className="py-4 text-center text-xs text-text-disabled">Không có đề nghị nào</p>
        ) : (
          the.map((t) => (
            <TheDeNghi
              key={t.deNghi.id}
              the={t}
              tongGiaiDoan={giaiDoan.tong}
              keoThaDuoc={keoThaDuoc}
              onBatDauKeo={() => onBatDauKeo(giaiDoan.ma)}
              onKetThucKeo={onKetThucKeo}
              onTha={onTha}
              thaoTac={thaoTac}
            />
          ))
        )}
      </div>
    </section>
  );
}

function TheDeNghi({
  the,
  tongGiaiDoan,
  keoThaDuoc,
  onBatDauKeo,
  onKetThucKeo,
  onTha,
  thaoTac,
}: {
  the: TheDeNghiTrenBang;
  tongGiaiDoan: Tong;
  keoThaDuoc: boolean;
  /** Báo cha biết thẻ này bắt đầu được kéo (để cha tính cột nào nhận thả). */
  onBatDauKeo: () => void;
  /** Kéo xong — dù thả được hay bỏ giữa đường, phải xóa trạng thái kéo ở cha. */
  onKetThucKeo: () => void;
  /** Dùng lại cho menu ⋯ "Chuyển sang giai đoạn kế tiếp" — cùng luật với kéo thả. */
  onTha?: (prId: string, dich: GiaiDoanMuaHang) => void;
  thaoTac?: ThaoTacThe;
}) {
  const { deNghi, han, nguoiPhuTrach, soDongChuaPhanBo, maPOLienQuan } = the;
  const { nguoiDung } = useNguoiDung();
  /**
   * Thẻ này có phải việc của chính người đang xem không.
   *
   * 🔴 SO BẰNG UID chứ không so tên hiển thị — hai người trùng tên là chuyện có thật, và so
   * tên thì thẻ của người khác sẽ đeo nhãn "Việc của bạn" mà không có cách nào phát hiện.
   */
  const laViecCuaToi = the.uidPhuTrach.includes(nguoiDung.uid);

  // Nền thẻ: đỏ nhạt khi quá hạn, xanh nhạt khi đã kết thúc tốt — giống cách đọc
  // bảng Base hiện tại. Luôn có chữ đi kèm nên không vi phạm luật "không chỉ dùng màu".
  const nenThe = han.quaHan
    ? LOP_NEN_NHAT.danger
    : tongGiaiDoan === "success"
      ? LOP_NEN_NHAT.success
      : "bg-card";

  return (
    <Link
      href={`/de-nghi/${deNghi.id}`}
      draggable={keoThaDuoc}
      onDragStart={
        keoThaDuoc
          ? (e) => {
              e.dataTransfer.setData(KHOA_KEO_THA, deNghi.id);
              e.dataTransfer.effectAllowed = "move";
              onBatDauKeo();
            }
          : undefined
      }
      /* ⚠️ `onDragEnd` BẮN CẢ KHI BỎ GIỮA ĐƯỜNG (nhả chuột ngoài cột, bấm Esc). Không dọn ở
         đây thì các cột ngoài phạm vi bị mờ vĩnh viễn cho tới lần kéo sau. */
      onDragEnd={keoThaDuoc ? onKetThucKeo : undefined}
      className={`flex flex-col gap-1.5 rounded-lg border border-border border-l-4 p-(--hp-md-row-pad) transition-colors hover:border-primary ${
        keoThaDuoc ? "cursor-grab active:cursor-grabbing" : ""
      } ${LOP_VIEN_TRAI[han.quaHan ? "danger" : tongGiaiDoan]} ${nenThe}`}
    >
      {/* ★ TIÊU ĐỀ MỘT DÒNG — Ban lãnh đạo 14/08/2026 gửi ảnh bảng Base thật và chốt bố cục
          thẻ: *"hiển thị các trường thông tin cơ bản vậy là đủ"*.

          Base ghép `mã - hợp đồng - CÔNG TRÌNH` thành MỘT dòng tiêu đề, không tách ba dòng
          như app làm trước 14/08. Gộp lại vừa đúng mẫu vừa hạ chiều cao thẻ, nên một cột
          nhìn được nhiều việc hơn — thứ quan trọng nhất ở màn này. */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-tight text-text-primary">
          <span className="text-primary">{deNghi.code}</span>
          {deNghi.maHopDongCDT ? ` - ${deNghi.maHopDongCDT}` : ""}
          {deNghi.tenCongTrinh ? ` - ${deNghi.tenCongTrinh.toUpperCase()}` : ""}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {deNghi.mucDoUuTien === "gap" && <StatusBadge label="Gấp" tone="danger" />}
          <MenuThaoTacThe
            the={the}
            onTha={keoThaDuoc ? onTha : undefined}
            thaoTac={thaoTac}
          />
        </span>
      </div>

      {/* ★ KHỐI TRƯỜNG CƠ BẢN — đúng các trường trong ô Ban lãnh đạo khoanh đỏ:
          Bộ phận · Nhóm đề xuất · Ngày đề nghị cấp · Chi tiết · Link phiếu.

          Base viết liền một mạch nối bằng dấu ·, có NHÃN đứng trước giá trị. Nhãn quan
          trọng hơn icon: "Vật tư" đứng trơ thì không ai biết đó là nhóm đề xuất hay tên
          hàng. Vì vậy bỏ icon, dùng chữ.

          ⚠️ KHÔNG dùng nhãn `sr-only` ở đây. `sr-only` là position:absolute, nó thoát khỏi
          vùng cắt của khung cuộn ngang và kéo giãn cả trang — trên điện thoại làm toàn bộ
          màn hình trôi ngang. */}
      <p className="text-xs leading-snug text-text-desc">
        <span className="text-text-secondary">Bộ phận:</span>{" "}
        {nhanPhongBan(deNghi.phongBanNguon)}
        {" · "}
        <span className="text-text-secondary">Nhóm đề xuất:</span>{" "}
        {NHAN_NHOM_DE_XUAT[deNghi.nhomDeXuat ?? "khac"]}
        {" · "}
        <span className="text-text-secondary">Ngày đề nghị cấp:</span>{" "}
        {formatDate(deNghi.ngayCanHang)}
        {" · "}
        <span className="text-text-secondary">Chi tiết:</span> {deNghi.items.length} mặt hàng
        {/* Chỉ nói tới tài liệu khi CÓ tài liệu. Base luôn hiện "Link phiếu đề..." vì bên đó
            phiếu nào cũng đính kèm; app này cho phép lập phiếu không kèm tệp, hiện nhãn trơ
            là hứa một thứ không có. */}
        {deNghi.taiLieu && deNghi.taiLieu.length > 0 && (
          <>
            {" · "}
            <span className="text-text-secondary">Tài liệu:</span> {deNghi.taiLieu.length} tệp
          </>
        )}
      </p>

      {/* Thông tin phụ chỉ hiện khi CÓ — thêm hàng trống vào mọi thẻ thì bảng dài ra mà
          không nói thêm được gì. */}
      {(maPOLienQuan.length > 0 ||
        (deNghi.nguoiTheoDoi && deNghi.nguoiTheoDoi.length > 0)) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-desc">
          {maPOLienQuan.length > 0 && (
            <span className="truncate">Đơn hàng: {maPOLienQuan.join(", ")}</span>
          )}
          {deNghi.nguoiTheoDoi && deNghi.nguoiTheoDoi.length > 0 && (
            <span
              className="flex items-center gap-1.5"
              title={deNghi.nguoiTheoDoi.map((n) => n.ten).join(" · ")}
            >
              <Eye className="size-3.5 shrink-0" aria-hidden />
              {deNghi.nguoiTheoDoi.length} người theo dõi
            </span>
          )}
        </div>
      )}

      {/* ★ CHÂN THẺ — người phụ trách bên trái, hạn bên phải, đúng như Base.
          Base ghi "Chưa được giao" khi chưa có ai; app dùng đúng chữ đó thay cho "Chưa phân
          bổ" để người đã quen bảng Base đọc không phải dịch lại trong đầu. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-divider pt-1.5 text-xs">
        <span
          className={`flex min-w-0 items-center gap-1.5 ${
            laViecCuaToi ? "font-medium text-primary" : "text-text-desc"
          }`}
        >
          <UserRound className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {nguoiPhuTrach.length > 0 ? nguoiPhuTrach.join(" · ") : "Chưa được giao"}
          </span>
          {/* ★ NÓI RÕ VÌ SAO THẺ NÀY NẰM TRÊN — Ban lãnh đạo 15/08/2026 yêu cầu ưu tiên việc
              của chính người đang xem. Đổi thứ tự mà không có dấu hiệu gì thì người dùng
              không biết bảng đang sắp theo luật nào, và tưởng thẻ tự nhảy lung tung.
              ⚠️ Có CẢ chữ lẫn màu, không chỉ tô màu (Design System V1.1). */}
          {laViecCuaToi && (
            <span className="shrink-0 rounded-full bg-primary-bg px-1.5 py-0.5 text-[11px] font-semibold text-primary">
              Việc của bạn
            </span>
          )}
        </span>
        {/* Hạn nằm CÙNG DÒNG với người phụ trách, dồn về phải — đúng mẫu Base. Vẫn là
            StatusBadge nên trạng thái luôn có cả màu lẫn chữ (Design System V1.1). */}
        <StatusBadge label={han.nhan} tone={han.tong} />
      </div>

      {/* 📌 ĐÃ BỎ dòng "Chưa chuyển bước được" khỏi thẻ (Ban lãnh đạo 16/08/2026: *"bỏ hết các
          ghi chú kiểu này đi, đây là ứng dụng chuyên nghiệp"*).

          Thẻ chỉ còn dữ liệu nghiệp vụ. Lý do không chuyển bước được vẫn nói ra ĐÚNG LÚC người
          dùng cần: hộp xác nhận hiện lý do khi kéo thẻ, và trang chi tiết đề nghị ghi rõ ở
          khối tương ứng — cả hai gọi cùng một hàm với chỗ thật sự chặn.

          🔴 Vẫn GIỮ dòng "Thiếu N công việc chưa phân bổ": đó là SỐ LIỆU nghiệp vụ (còn bao
          nhiêu đầu việc chưa ai nhận), không phải câu giải thích cách app hoạt động. */}
      {soDongChuaPhanBo > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-danger-soft">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
          Thiếu {soDongChuaPhanBo} công việc chưa phân bổ
        </span>
      )}
    </Link>
  );
}


/**
 * MENU ⋯ TRÊN THẺ — các thao tác nhanh với một đề nghị, dựng theo menu ngữ cảnh của Base.vn
 * (ảnh Ban lãnh đạo cung cấp 10/08/2026).
 *
 * 🔴 CHUYỂN BƯỚC DÙNG CHUNG LUẬT VỚI KÉO THẢ (`onTha` → `quyetDinhKeoTha`): mục "Chuyển sang
 * giai đoạn kế tiếp" chỉ là cách bấm khác của việc kéo thẻ sang cột kế — mọi luật chặn (bước
 * trước chưa xong, nhảy cóc, kéo lùi) và hộp xác nhận đều đi qua đúng một đường. "Chuyển về
 * giai đoạn trước" vẫn hiện nhưng bấm sẽ nhận đúng lời giải thích của luật (*"muốn lùi phải
 * hủy chứng từ"*) — để người dùng học quy tắc, thay vì giấu mục đi khiến họ tưởng thiếu chức năng.
 *
 * ⚠️ HAI MỤC CỦA BASE KHÔNG LÀM ĐƯỢC Y NGUYÊN, đã thay bằng thứ tương đương — đừng "sửa lại
 * cho giống" mà không đọc lý do:
 *   · **In** → app in ĐƠN HÀNG (`/in/don-hang/[id]`), không in đề nghị: đề nghị là chứng từ
 *     của Phòng Thi công lập trên HPcore, bản in chính thức thuộc về họ. Mục ở đây mở trang
 *     chi tiết để in đơn hàng đã tách.
 *   · **Lịch sử webhook** → app không tích hợp webhook. Thay bằng "Xem nhật ký", mở đúng khối
 *     Lịch sử của hồ sơ (ai · làm gì · lúc nào) — thứ người dùng thật sự cần khi bấm mục đó.
 */
function MenuThaoTacThe({
  the,
  onTha,
  thaoTac,
}: {
  the: TheDeNghiTrenBang;
  onTha?: (prId: string, dich: GiaiDoanMuaHang) => void;
  thaoTac?: ThaoTacThe;
}) {
  const router = useRouter();
  const { deNghi, giaiDoan } = the;
  const duongDan = `/de-nghi/${deNghi.id}`;

  // Bước kế / bước trước tính trên chuỗi 7 bước (bỏ "Thất bại" — nó không nằm trong chuỗi).
  const chuoi = GIAI_DOAN_MUA_HANG.filter((g) => g.ma !== "that_bai").map((g) => g.ma);
  const viTri = chuoi.indexOf(giaiDoan);
  const daKetThuc = giaiDoan === "hoan_thanh" || giaiDoan === "that_bai";
  const buocKe = !daKetThuc && viTri >= 0 && viTri < chuoi.length - 1 ? chuoi[viTri + 1] : undefined;
  const buocTruoc = !daKetThuc && viTri > 0 ? chuoi[viTri - 1] : undefined;

  async function saoChepDuongDan() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${duongDan}`);
      toast.success("Đã sao chép đường dẫn", { description: deNghi.code });
    } catch {
      // Trình duyệt chặn clipboard (HTTP thường / thiếu quyền) — nói thật thay vì im lặng.
      toast.error("Trình duyệt không cho sao chép", {
        description: `Tự chép tay: ${window.location.origin}${duongDan}`,
      });
    }
  }

  return (
    /* 🔴 Chặn cả click lẫn kéo NGAY Ở VỎ BỌC: thẻ cha là <Link> và kéo-thả được. Thiếu
       preventDefault/stopPropagation thì bấm ⋯ là mở luôn trang chi tiết; thiếu draggable=false
       thì đè chuột lên nút rồi rê là kéo cả thẻ đi. */
    <span
      draggable={false}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={`Thao tác với ${deNghi.code}`}
              className="flex size-7 items-center justify-center rounded-md text-text-desc transition-colors hover:bg-muted hover:text-text-primary"
            />
          }
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          {/* ⚠️ base-nova bắt buộc Item nằm trong Group — thiếu là crash cả trang. */}
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => window.open(duongDan, "_blank", "noopener")}>
              <ExternalLink className="size-4 shrink-0" aria-hidden />
              Xem trong tab mới
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                window.open(
                  duongDan,
                  "_blank",
                  "noopener,width=1100,height=860,scrollbars=yes,resizable=yes",
                )
              }
            >
              <PictureInPicture2 className="size-4 shrink-0" aria-hidden />
              Xem trong pop-up
            </DropdownMenuItem>
            <DropdownMenuItem onClick={saoChepDuongDan}>
              <Copy className="size-4 shrink-0" aria-hidden />
              Sao chép đường dẫn
            </DropdownMenuItem>

            {thaoTac && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => thaoTac.onSuaThongTin(deNghi.id)}>
                  <Pencil className="size-4 shrink-0" aria-hidden />
                  Chỉnh sửa thông tin chung
                </DropdownMenuItem>
                {/* Chỉ hiện với phiếu người này được tách — xem `duocNhanBanDeNghi`. */}
                {thaoTac.duocNhanBan(deNghi) && (
                  <DropdownMenuItem onClick={() => thaoTac.onNhanBan(deNghi.id)}>
                    <CopyPlus className="size-4 shrink-0" aria-hidden />
                    Nhân bản
                  </DropdownMenuItem>
                )}
                {/* 🔴 Xem chú thích `onLapBaoGia` ở `ThaoTacThe`: đây là đường vào module Báo
                    giá bấm được trên điện thoại, sau khi nút ở trang chi tiết bị bỏ. */}
                {thaoTac.duocLapBaoGia(deNghi) && (
                  <DropdownMenuItem onClick={() => thaoTac.onLapBaoGia(deNghi.id)}>
                    <Split className="size-4 shrink-0" aria-hidden />
                    Lập bảng báo giá
                  </DropdownMenuItem>
                )}
              </>
            )}

            <DropdownMenuSeparator />

            {/* Ba mục dưới đều mở trang chi tiết — bảng phân bổ, khối người theo dõi và nút
                Chuyển tiếp đều nằm ở đó; trang chi tiết tự chặn theo quyền. */}
            <DropdownMenuItem onClick={() => router.push(duongDan)}>
              <UserRound className="size-4 shrink-0" aria-hidden />
              Giao lại cho người khác
            </DropdownMenuItem>
            {thaoTac && (
              <>
                <DropdownMenuItem onClick={() => thaoTac.onSuaThoiHan(deNghi.id)}>
                  <CalendarClock className="size-4 shrink-0" aria-hidden />
                  Chỉnh sửa thời hạn
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => thaoTac.onSuaTruongBoSung(deNghi.id)}>
                  <ListPlus className="size-4 shrink-0" aria-hidden />
                  Chỉnh sửa dữ liệu tùy chỉnh
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={() => router.push(duongDan)}>
              <UsersRound className="size-4 shrink-0" aria-hidden />
              Thêm nhiều người theo dõi
            </DropdownMenuItem>

            {onTha && !daKetThuc && (
              <>
                <DropdownMenuSeparator />
                {buocKe && (
                  <DropdownMenuItem onClick={() => onTha(deNghi.id, buocKe)}>
                    <ArrowRight className="size-4 shrink-0" aria-hidden />
                    Chuyển sang giai đoạn kế tiếp
                  </DropdownMenuItem>
                )}
                {buocTruoc && (
                  <DropdownMenuItem onClick={() => onTha(deNghi.id, buocTruoc)}>
                    <ArrowLeft className="size-4 shrink-0" aria-hidden />
                    Chuyển về giai đoạn trước
                  </DropdownMenuItem>
                )}
              </>
            )}

            <DropdownMenuSeparator />

            {/* In: app in ĐƠN HÀNG, không in đề nghị — xem chú thích đầu component. */}
            <DropdownMenuItem onClick={() => router.push(duongDan)}>
              <Printer className="size-4 shrink-0" aria-hidden />
              In đơn hàng của đề nghị
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(duongDan)}>
              <Forward className="size-4 shrink-0" aria-hidden />
              Chuyển tiếp
            </DropdownMenuItem>
            {/* Thay cho "Lịch sử webhook" của Base — app không có webhook. */}
            <DropdownMenuItem onClick={() => router.push(duongDan)}>
              <History className="size-4 shrink-0" aria-hidden />
              Xem nhật ký hồ sơ
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {thaoTac && (
              <DropdownMenuItem onClick={() => thaoTac.onDoiLuuTru(deNghi.id, !deNghi.luuTru)}>
                <Archive className="size-4 shrink-0" aria-hidden />
                {deNghi.luuTru ? "Bỏ lưu trữ" : "Lưu trữ"}
              </DropdownMenuItem>
            )}
            {onTha && !daKetThuc && (
              <DropdownMenuItem
                onClick={() => onTha(deNghi.id, "that_bai")}
                className="text-danger-soft"
              >
                <XCircle className="size-4 shrink-0" aria-hidden />
                Đánh dấu thất bại
              </DropdownMenuItem>
            )}
            {thaoTac && (
              <DropdownMenuItem
                onClick={() => thaoTac.onXoa(deNghi.id)}
                className="text-danger-soft"
              >
                <Trash2 className="size-4 shrink-0" aria-hidden />
                Xóa
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}
