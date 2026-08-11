"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type DragEvent } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  Copy,
  Eye,
  ExternalLink,
  Forward,
  Layers,
  MoreHorizontal,
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
import {
  GIAI_DOAN_MUA_HANG,
  type CotBangQuyTrinh,
  type GiaiDoanMuaHang,
  type TheDeNghiTrenBang,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import type { Tong } from "@/2-quy-trinh/trang-thai";
import { NHAN_PHONG_BAN_NGUON } from "@/2-quy-trinh/trang-thai";
import type { ThongBaoChuyenBuoc } from "@/3-du-lieu/kieu-du-lieu";
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
  /** Thông báo chuyển bước MỚI NHẤT của từng đề nghị — để thẻ hiện
   *  "Chờ tiếp nhận" / "Đã nhận: [tên]" cho bước hiện tại. */
  tiepNhan?: ReadonlyMap<string, ThongBaoChuyenBuoc>;
  /** Bấm "Nhận công tác" ngay trên thẻ. Không truyền thì thẻ chỉ hiện nhãn "Chờ tiếp nhận". */
  onNhanCongTac?: (tb: ThongBaoChuyenBuoc) => void;
  /** Người đang đăng nhập có được nhận công tác này không — luật ở
   *  `4-phan-quyen/quyen-theo-ho-so.ts` → `lyDoKhongNhanCongTac`. Không truyền = được. */
  duocNhan?: (tb: ThongBaoChuyenBuoc) => boolean;
}

export function BangQuyTrinhMuaHang({
  cot,
  keoThaDuoc = false,
  onTha,
  tiepNhan,
  onNhanCongTac,
  duocNhan,
}: BangQuyTrinhMuaHangProps) {
  return (
    // Các cột nằm SÁT NHAU thành một bảng liền, ngăn nhau bằng đường kẻ mảnh
    // (`divide-x`) chứ không cách quãng — theo yêu cầu Ban lãnh đạo 06/08/2026.
    // Viền và bo góc nằm ở khung ngoài để cả bảng trông như một khối.
    // `flex-1 min-h-0`: bảng SỔ XUỐNG kín chiều cao còn lại của màn hình
    // (yêu cầu Ban lãnh đạo 07/08/2026) — cột dài quá thì cuộn bên trong cột.
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto rounded-xl border border-border">
      {/* `w-max min-w-full` + cột `grow`: màn hẹp thì giữ 272px/cột và cuộn ngang,
          màn rộng thì các cột TỰ DÀN ĐỀU kín bề ngang — yêu cầu Ban lãnh đạo 07/08/2026.
          `flex-1` (không dùng min-h-full vì cha bọc ngoài từng là block): cột ăn hết chiều cao bảng. */}
      <div className="flex min-h-0 w-max min-w-full flex-1 items-stretch divide-x divide-border">
        {cot.map((c) => (
          <CotQuyTrinh
            key={c.giaiDoan.ma}
            cot={c}
            keoThaDuoc={keoThaDuoc}
            onTha={onTha}
            tiepNhan={tiepNhan}
            onNhanCongTac={onNhanCongTac}
            duocNhan={duocNhan}
          />
        ))}
      </div>
    </div>
  );
}

function CotQuyTrinh({
  cot,
  keoThaDuoc,
  onTha,
  tiepNhan,
  onNhanCongTac,
  duocNhan,
}: {
  cot: CotBangQuyTrinh;
  keoThaDuoc: boolean;
  onTha?: (prId: string, dich: GiaiDoanMuaHang) => void;
  tiepNhan?: ReadonlyMap<string, ThongBaoChuyenBuoc>;
  /** Bấm "Nhận công tác" ngay trên thẻ. Không truyền thì thẻ chỉ hiện nhãn "Chờ tiếp nhận". */
  onNhanCongTac?: (tb: ThongBaoChuyenBuoc) => void;
  duocNhan?: (tb: ThongBaoChuyenBuoc) => boolean;
}) {
  const { giaiDoan, the, soQuaHan } = cot;
  // Sáng viền cột khi đang kéo thẻ ngang qua — người dùng biết mình sắp thả vào đâu.
  const [dangKeoQua, setDangKeoQua] = useState(false);

  const suKienKeoTha = keoThaDuoc
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
          const prId = e.dataTransfer.getData(KHOA_KEO_THA);
          if (prId) onTha?.(prId, giaiDoan.ma);
        },
      }
    : {};

  return (
    <section
      className={`flex min-w-[272px] shrink-0 grow basis-[272px] flex-col bg-muted ${
        dangKeoQua ? "ring-2 ring-primary ring-inset" : ""
      }`}
      {...suKienKeoTha}
    >
      {/* Đầu cột */}
      <header
        className={`flex flex-col gap-1 border-b border-border p-(--hp-md-row-pad) ${LOP_NEN_NHAT[giaiDoan.tong]}`}
      >
        <div className="flex items-start justify-between gap-2">
          {/* `title` để người mới rê chuột là hiểu cột này đang chờ việc gì. */}
          <h2
            title={giaiDoan.moTa}
            className={`text-sm font-semibold leading-tight ${LOP_CHU_DAM[giaiDoan.tong]}`}
          >
            {giaiDoan.nhan}
          </h2>
          <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-text-primary">
            {the.length}
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
              onTha={onTha}
              thongBaoMoiNhat={tiepNhan?.get(t.deNghi.id)}
              onNhanCongTac={onNhanCongTac}
              duocNhan={duocNhan}
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
  onTha,
  thongBaoMoiNhat,
  onNhanCongTac,
  duocNhan,
}: {
  the: TheDeNghiTrenBang;
  tongGiaiDoan: Tong;
  keoThaDuoc: boolean;
  /** Dùng lại cho menu ⋯ "Chuyển sang giai đoạn kế tiếp" — cùng luật với kéo thả. */
  onTha?: (prId: string, dich: GiaiDoanMuaHang) => void;
  thongBaoMoiNhat?: ThongBaoChuyenBuoc;
  onNhanCongTac?: (tb: ThongBaoChuyenBuoc) => void;
  duocNhan?: (tb: ThongBaoChuyenBuoc) => boolean;
}) {
  const { deNghi, han, nguoiPhuTrach, soDongChuaPhanBo, maPOLienQuan } = the;

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
            }
          : undefined
      }
      className={`flex flex-col gap-1.5 rounded-lg border border-border border-l-4 p-(--hp-md-row-pad) transition-colors hover:border-primary ${
        keoThaDuoc ? "cursor-grab active:cursor-grabbing" : ""
      } ${LOP_VIEN_TRAI[han.quaHan ? "danger" : tongGiaiDoan]} ${nenThe}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-tight text-primary">{deNghi.code}</span>
        <span className="flex shrink-0 items-center gap-1">
          {deNghi.mucDoUuTien === "gap" && <StatusBadge label="Gấp" tone="danger" />}
          <MenuThaoTacThe the={the} onTha={keoThaDuoc ? onTha : undefined} />
        </span>
      </div>

      <span className="text-xs font-medium leading-snug text-text-primary">
        {deNghi.maHopDongCDT ?? deNghi.maDuAn} — {deNghi.tenCongTrinh}
      </span>

      <span className="text-xs leading-snug text-text-desc">{deNghi.tieuDe}</span>

      {/* ⚠️ KHÔNG dùng nhãn `sr-only` ở đây. `sr-only` là position:absolute, nó
          thoát khỏi vùng cắt của khung cuộn ngang và kéo giãn cả trang — trên
          điện thoại làm toàn bộ màn hình trôi ngang. Chữ dưới đây tự nó đã đủ
          nghĩa nên không cần nhãn ẩn. */}
      <div className="flex flex-col gap-1 text-xs text-text-desc">
        <div className="flex items-center gap-1.5">
          <Layers className="size-3.5 shrink-0" aria-hidden />
          <span>
            {NHAN_PHONG_BAN_NGUON[deNghi.phongBanNguon]} · {deNghi.items.length} mặt hàng
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarClock className="size-3.5 shrink-0" aria-hidden />
          <span>Cần hàng {formatDate(deNghi.ngayCanHang)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <UserRound className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {nguoiPhuTrach.length > 0 ? nguoiPhuTrach.join(" · ") : "Chưa phân bổ"}
          </span>
        </div>
        {/* Người theo dõi — rê chuột để xem danh sách tên đầy đủ */}
        {deNghi.nguoiTheoDoi && deNghi.nguoiTheoDoi.length > 0 && (
          <div
            className="flex items-center gap-1.5"
            title={deNghi.nguoiTheoDoi.map((n) => n.ten).join(" · ")}
          >
            <Eye className="size-3.5 shrink-0" aria-hidden />
            <span>{deNghi.nguoiTheoDoi.length} người theo dõi</span>
          </div>
        )}
        {maPOLienQuan.length > 0 && (
          <span className="truncate">Đơn hàng: {maPOLienQuan.join(", ")}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <StatusBadge label={han.nhan} tone={han.tong} />
        {/* Bàn giao – tiếp nhận: chỉ hiện khi thẻ VỪA chuyển vào bước này trong phiên */}
        {thongBaoMoiNhat &&
          thongBaoMoiNhat.denBuoc === the.giaiDoan &&
          (thongBaoMoiNhat.tiepNhan ? (
            <StatusBadge label={`Đã nhận: ${thongBaoMoiNhat.tiepNhan.ten}`} tone="success" />
          ) : onNhanCongTac && (duocNhan?.(thongBaoMoiNhat) ?? true) ? (
            /* NÚT NHẬN NGAY TRÊN THẺ (chỉ đạo Ban lãnh đạo 10/08/2026: "thêm nút nhận trong
               mục quy trình"). Trước đây chỉ nhận được từ chuông thông báo, mà chuông thì
               người dùng ít mở — thẻ mới là nơi họ đang làm việc.

               🔴 Phải `preventDefault` + `stopPropagation`: thẻ là một thẻ <Link> và còn kéo
               thả được. Thiếu hai lệnh này thì bấm nút sẽ mở luôn trang chi tiết, hộp xác
               nhận vừa hiện đã bị trang mới thay chỗ. */
            <button
              type="button"
              draggable={false}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNhanCongTac(thongBaoMoiNhat);
              }}
              className="inline-flex min-h-7 items-center gap-1 rounded-md border border-warning bg-warning-bg px-2 text-xs font-medium text-warning-soft transition-colors hover:bg-warning hover:text-white"
            >
              <Check className="size-3.5 shrink-0" aria-hidden />
              Nhận công tác
            </button>
          ) : (
            <StatusBadge label="Chờ tiếp nhận" tone="warning" />
          ))}
        {soDongChuaPhanBo > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-danger-soft">
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
            Thiếu {soDongChuaPhanBo} dòng chưa phân bổ
          </span>
        )}
      </div>
    </Link>
  );
}


/**
 * MENU ⋯ TRÊN THẺ — các thao tác nhanh với một đề nghị, theo menu ngữ cảnh của Base.vn
 * (ảnh Ban lãnh đạo cung cấp 10/08/2026: *"thêm các chế độ này khi bấm vào chi tiết các bước"*).
 *
 * 🔴 CHUYỂN BƯỚC DÙNG CHUNG LUẬT VỚI KÉO THẢ (`onTha` → `quyetDinhKeoTha`): mục "Chuyển sang
 * giai đoạn kế tiếp" chỉ là cách bấm khác của việc kéo thẻ sang cột kế — mọi luật chặn (bước
 * trước chưa xong, nhảy cóc, kéo lùi) và hộp xác nhận đều đi qua đúng một đường. "Chuyển về
 * giai đoạn trước" vẫn hiện nhưng bấm sẽ nhận đúng lời giải thích của luật (*"muốn lùi phải
 * hủy chứng từ"*) — để người dùng học quy tắc, thay vì giấu mục đi khiến họ tưởng thiếu chức năng.
 *
 * ⚠️ CÁC MỤC CỦA BASE CỐ Ý KHÔNG ĐƯA VÀO, kèm lý do — đừng thêm lại khi chưa hỏi Ban lãnh đạo:
 *   · **Xóa** — đề nghị nhận từ HPcore, app Thu mua không được xóa hồ sơ nguồn; cách kết thúc
 *     đúng là "Đánh dấu thất bại" (đóng dở, có ghi nhật ký).
 *   · **Lưu trữ / Nhân bản / Sửa thời hạn / Dữ liệu tùy chỉnh / Webhook** — chưa có nghiệp vụ
 *     tương ứng; "ngày cần hàng" do người đề nghị đặt, thu mua không tự sửa.
 *   · **In** — trang in thuộc về ĐƠN HÀNG (`/in/don-hang/[id]`), vào từ trang chi tiết đơn.
 */
function MenuThaoTacThe({
  the,
  onTha,
}: {
  the: TheDeNghiTrenBang;
  onTha?: (prId: string, dich: GiaiDoanMuaHang) => void;
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
      // Trình duyệt chặn clipboard (HTTP thường / quyền) — nói thật thay vì im lặng.
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
            <DropdownMenuItem onClick={saoChepDuongDan}>
              <Copy className="size-4 shrink-0" aria-hidden />
              Sao chép đường dẫn
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Ba mục dưới đều mở trang chi tiết — bảng phân bổ, khối người theo dõi và nút
                Chuyển tiếp đều nằm ở đó; trang chi tiết tự chặn theo quyền. */}
            <DropdownMenuItem onClick={() => router.push(duongDan)}>
              <UserRound className="size-4 shrink-0" aria-hidden />
              Giao việc / phân bổ lại
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(duongDan)}>
              <UsersRound className="size-4 shrink-0" aria-hidden />
              Thêm người theo dõi
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(duongDan)}>
              <Forward className="size-4 shrink-0" aria-hidden />
              Chuyển tiếp cho nhân viên
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

                <DropdownMenuSeparator />

                {/* Đi qua đúng luồng kéo-vào-Thất-bại: có hộp xác nhận + ghi nhật ký. */}
                <DropdownMenuItem
                  onClick={() => onTha(deNghi.id, "that_bai")}
                  className="text-danger-soft"
                >
                  <XCircle className="size-4 shrink-0" aria-hidden />
                  Đánh dấu thất bại
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}
