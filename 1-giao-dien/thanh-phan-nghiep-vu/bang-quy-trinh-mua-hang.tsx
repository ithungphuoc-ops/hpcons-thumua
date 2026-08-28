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
  Link2 as LinkIcon,
  ListPlus,
  SlidersHorizontal,
  Maximize2,
  MoreHorizontal,
  Pencil,
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
/* 📌 KHÔNG còn import gì từ `chung-tu-cuoi-quy-trinh` ở đây (23/08/2026): câu "bước này còn
   thiếu gì" nay do `conNoCuaBuoc` sinh sẵn và đi theo thẻ ở trường `conNo`. Thẻ chỉ bày, không
   tự tra luật chứng từ — một chỗ tính, mọi chỗ đọc. */
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
/**
 * ★ NỀN ĐẶC (không pha trong suốt) — dùng cho phần đã chạy của thanh tiến độ đầu cột.
 *
 * 🔴 KHÔNG DÙNG `LOP_NEN_NHAT` cho việc này. Các token `*-bg` là màu pha với trong suốt
 * (`color-mix(… 14%, transparent)`), nên vẽ lên rãnh xám thì phần đã chạy gần như không phân biệt
 * được với phần chưa chạy — thanh tiến độ thành một vệt xám vô nghĩa. Đây đúng là cái bẫy đã làm
 * đầu cột `sticky` bị nhìn xuyên qua hôm 23/08/2026, chỉ khác chỗ áp dụng.
 */
const LOP_NEN_DAC: Record<Tong, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-neutral",
};

export interface BangQuyTrinhMuaHangProps {
  cot: CotBangQuyTrinh[];
  /** Bật kéo thả thẻ giữa các cột — chỉ vai trò được thao tác nghiệp vụ. */
  keoThaDuoc?: boolean;
  /** Gọi khi thả thẻ vào một cột. Trang chứa bảng quyết định làm gì tiếp. */
  onTha?: (prId: string, dich: GiaiDoanMuaHang) => void;
  /** Các thao tác của menu ⋯ trên thẻ. Không truyền thì menu chỉ còn mục xem/sao chép. */
  thaoTac?: ThaoTacThe;
  /**
   * ★★★ BẤM THẺ → MỞ POP-UP ĐÈ LÊN BOARD — chốt lần 3 (28/08/2026), Sếp xem lại video Base.vn
   * thật lần hai và quyết định đảo lại lần chốt trước đó cùng ngày. Lịch sử đủ 3 lần trong
   * một ngày, ghi lại để người sau khỏi hoang mang:
   *
   *   1. Chỉ đạo 27/08/2026: bấm thẻ mở `HopChuyenGiaiDoan` (hộp bước hiện tại).
   *   2. Sếp xem video Base.vn lần 1 (28/08/2026): bấm thẻ phải ra thẳng TRANG ĐẦY ĐỦ, cùng
   *      tab — pop-up chỉ mở qua menu ⋯ → "Xem trong pop-up".
   *   3. Sếp xem video Base.vn lần 2 (28/08/2026, cùng ngày): xem kỹ URL đổi ra sao trong
   *      video, thấy Base bấm thẻ ra `?show=job&id=` (pop-up đè lên board) TRƯỚC, "trang đầy
   *      đủ cùng tab" (`/job/id` trần) chỉ tới khi bấm "Xem toàn màn hình" — ĐÚNG BẢN NÀY.
   *
   * Trang chứa (`de-nghi-danh-sach.tsx`) giờ truyền hàm MỞ POP-UP vào prop này (không còn
   * `HopChuyenGiaiDoan`, không còn `undefined`). `HopChuyenGiaiDoan` vẫn giữ đường vào riêng
   * qua menu ⋯ mục "Chuyển sang giai đoạn kế tiếp" (xem `onTha`), không đụng gì ở đây.
   *
   * 🔴 SAO KHÔNG TỰ GỌI THẲNG DIALOG Ở ĐÂY: pop-up bọc nguyên trang chi tiết
   * (`TrangChiTietDeNghi`), component đó gọi `useDuLieu()` — bảng này là "component hiển thị
   * thuần" (xem chú thích đầu file), không được đụng vào kho dữ liệu. Trang chứa đứng ra dựng
   * `Dialog`, chỉ đưa xuống đây một hàm "mở".
   *
   * 📌 GIỮ NGUYÊN `href` trên thẻ: Ctrl+click / chuột giữa vẫn mở trang đầy đủ ở tab mới —
   * `preventDefault` trong `onClick` chỉ ăn với cú bấm thường, xem chỗ dùng ở `TheDeNghi`.
   */
  onXemNhanh?: (prId: string) => void;
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
  /** Mở hộp "Chỉnh sửa các trường dữ liệu tùy chỉnh" (bám ảnh Base, 18/08/2026). */
  onSuaTruongTuyChinh: (prId: string) => void;
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
  onXemNhanh,
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
    /* `thanh-keo-ngang-ro`: thanh cuộn ngang LUÔN HIỆN (Ban lãnh đạo 22/08/2026 — xem
       `app/globals.css`). Từ khi có 9 bước, bảng rộng hơn màn hình ở mọi cỡ máy thường dùng,
       mà thanh cuộn mặc định của Chrome tự mờ đi nên không ai thấy chỗ để kéo.

       🔴 CHIỀU CAO TỐI ĐA — Ban lãnh đạo 22/08/2026: *"nút kéo trang vẫn chưa hiển thị, phải kéo
       hết xuống trang mới thấy"*.

       📌 CON SỐ TÍNH TỪ CLASS THẬT, không ước lượng (rà lại 23/08/2026 — bản đầu tôi viết `13rem`
       cho mọi cỡ máy và nó THIẾU phần dưới):

         Phần TRÊN bảng   = thanh trên 60 + đệm main + tiêu đề trang 68 + gap 12 + thanh tab + gap 16
         Phần DƯỚI bảng   = đệm dưới của `main`

         · Từ 768px  : đáy thanh tab **192** + gap 16 + đệm dưới **16** = 224px → **14rem**
         · Dưới 768px: đáy thanh tab **197** + gap 16 + đệm dưới **76** = 289px → **18rem**
           (đệm dưới mobile = thanh điều hướng dưới 60 + safe-area + 16 — xem `khung-tong.tsx`)

       ✅ HAI CON SỐ IN ĐẬM LÀ ĐO THẬT trên trình duyệt (`getBoundingClientRect().bottom` của thanh
       tab và `paddingBottom` của `main`), ở 1280×720 và 375×812 — không phải cộng nhẩm từ class.
       Phép cộng từ class ra 208/273; đo thật ra 192/197 và 224/289. Lệch đủ để thanh kéo vẫn bị
       thanh điều hướng dưới che trên điện thoại, nên phải đo chứ đừng tin phép cộng.

       🔴 VÌ SAO PHẢI TRỪ CẢ PHẦN DƯỚI: `13rem` trùng khít phần trên, nên đáy bảng dán đúng mép
       dưới khung nhìn — trên máy tính thì thanh kéo còn thấy nhưng không dư một pixel, còn trên
       điện thoại **thanh điều hướng dưới (`fixed bottom-0`, cao 60px) phủ lên đúng chỗ đó**, tức
       thanh kéo nằm hẳn sau nó. Đó là lý do vẫn phải cuộn mới thấy.

       Nguyên nhân: thanh cuộn ngang của một vùng nằm ở ĐÁY chính vùng đó. Khung app dùng
       `min-h-screen` (`khung-app/khung-tong.tsx`) — cao TỐI THIỂU bằng màn hình nhưng **được
       phép cao hơn** — nên cột nào nhiều thẻ là bảng đẩy cả trang dài ra, và cái thanh kéo trôi
       xuống dưới đáy màn hình. Làm thanh dày hơn không chữa được, vì nó không nằm trong khung
       nhìn để mà thấy.

       Chặn chiều cao vùng bảng thì đáy vùng — chỗ đặt thanh kéo — luôn ở trong khung nhìn. Cột
       dài quá thì cuộn dọc BÊN TRONG thân cột, thứ đã có sẵn `overflow-y-auto`.

       ⚠️ `dvh` chứ không phải `vh`: trên điện thoại thanh địa chỉ co giãn làm `vh` sai, `dvh`
       theo đúng phần thấy được. Trừ `13rem` cho thanh trên + tiêu đề trang + khoảng đệm.
       ⚠️ `min-h-[420px]` ở khung cha (`de-nghi-danh-sach.tsx`) vẫn thắng khi màn hình rất thấp —
       thà bảng cao hơn khung nhìn một chút còn hơn bóp còn vài chục pixel không đọc được gì. */
    /* 🔴 `overflow-y-hidden` LÀ BẮT BUỘC, KHÔNG PHẢI TRANG TRÍ — Ban lãnh đạo 23/08/2026 khoanh
       đúng dải lạ chen giữa cột "Hoàn thành" và cột "Thất bại".

       Nguyên nhân theo spec CSS: khi MỘT trục đặt `auto` mà trục kia để mặc định (`visible`), thì
       trục `visible` **bị xử lý như `auto`**. Nên chỉ khai `overflow-x-auto` thôi là trình duyệt
       tự bật luôn cuộn dọc — và từ lúc thêm `max-h` ở trên, nội dung cao hơn khung nên nó vẽ ra
       một thanh cuộn dọc thật, ăn 15px và cắt mất cột cuối.

       Đã đo tại chỗ trên trình duyệt: không khai `overflow-y` → `overflowY` tính ra `auto`, thanh
       dọc rộng **15px**; khai `hidden` → rộng **0px**, thanh ngang vẫn 15px như mong muốn.

       ⚠️ `hidden` KHÔNG làm mất nội dung: thân mỗi cột đã có `overflow-y-auto` riêng (dòng ~344)
       và chuỗi `flex-1 min-h-0` liền mạch, nên cột dài tự cuộn bên trong đúng như thiết kế. */
    <div className="thanh-keo-ngang-ro flex max-h-[calc(100dvh-18rem)] min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-muted md:max-h-[calc(100dvh-14rem)]">
      {/* 🔴 `w-full` CHỨ KHÔNG PHẢI `w-max` — sửa 15/08/2026.
          `w-max` là `max-content`: bề ngang hàng cột bằng TỔNG bề rộng nội dung tự nhiên của
          chúng, nên một mã hồ sơ dài (`260001-HPCS-PR-001 (copy 2) - NHÀ XƯỞNG ABC — GIAI
          ĐOẠN 2`) tự kéo cột phình ra 264px, bất chấp `basis` đã đặt 176px. Kết quả: bảng
          rộng 2.108px trong khung 1.626px và luôn phải cuộn ngang, dù cột đã được thu nhỏ.
          `w-full` thì cột nghe theo `basis`/`grow`; cột nào không đủ chỗ vẫn tràn ra và khung
          cha `overflow-x-auto` cho cuộn — đúng hành vi cần cho màn nhỏ.

          🔴 BỎ `flex-1 min-h-0` (23/08/2026) — Ban lãnh đạo: *"cố định nội dung trong khung màn
          hình máy và thêm thanh kéo"*, và ảnh cho thấy **cột rỗng bị cắt ngắn giữa bảng**.

          `flex-1 min-h-0` khóa chiều cao hàng cột **bằng chiều cao khung**, còn cột nhiều thẻ thì
          tràn ra ngoài hàng. Hệ quả: cột dài vẫn hiện (nhờ khung cuộn) nhưng NỀN và VẠCH CHIA của
          các cột khác dừng ở đáy hàng — cuộn xuống là thấy bảng như bị cắt ngang.

          Đã đo ba phương án, cùng một cột 900px trong khung 250px:
            · `flex-1 min-h-0`                  → hàng 235, cột ngắn 235 ✗ (bị cắt)
            · `height:max-content;min-h-full`   → hàng 235 ✗ (vẫn bị khóa)
            · để chiều cao TỰ NHIÊN (bỏ cả hai) → hàng **940**, cột ngắn **940** ✓, cuộn dọc vẫn được

          `items-stretch` khi đó kéo mọi cột cao bằng cột dài nhất, nên nền và vạch chia liền mạch
          suốt chiều dài bảng. */}
      <div className="flex w-full items-stretch divide-x divide-border">
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
            onXemNhanh={onXemNhanh}
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
  onXemNhanh,
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
  onXemNhanh?: (prId: string) => void;
}) {
  const { giaiDoan, the, soQuaHan } = cot;

  /**
   * ★ SỐ HỒ SƠ ĐÃ CÓ NGƯỜI PHỤ TRÁCH — nguồn của thanh tiến độ đầu cột (23/08/2026).
   *
   * 📌 Đọc thẳng `nguoiPhuTrach` của từng thẻ, đúng cái mà dòng chữ trên thẻ đang hiện
   * ("Chưa được giao" khi mảng rỗng — xem `TheDeNghi`). Một nguồn cho hai chỗ, nên con số ở đầu
   * cột không bao giờ nói khác những thẻ nằm ngay dưới nó.
   *
   * ⚠️ Cột trống thì để 0 chứ KHÔNG để 100%: chia cho `the.length = 0` ra `NaN`, mà `width: NaN%`
   * bị trình duyệt bỏ qua — thanh giữ nguyên bề rộng của lần vẽ trước, tức cột trống có thể hiện
   * một thanh đầy. Sai kiểu này không có lỗi nào báo.
   */
  const soDaGiao = the.filter((t) => t.nguoiPhuTrach.length > 0).length;
  const tyLeDaGiao = the.length === 0 ? 0 : Math.round((soDaGiao / the.length) * 100);
  /* Số hồ sơ trong cột còn nợ chứng từ / công việc — nguồn của con số đỏ ở đầu cột. Luật ở
     `2-quy-trinh/giai-doan-mua-hang.ts` → `conNoCuaBuoc`, thẻ chỉ mang sẵn kết quả. */
  const soConThieu = the.filter((t) => Boolean(t.conNo)).length;

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
      {/**
        * Đầu cột — DÁN LẠI KHI CUỘN (`sticky`).
        *
        * 🔴 Cần từ 23/08/2026, khi chuyển sang **cuộn dọc chung cho cả bảng** (Ban lãnh đạo:
        * *"Đưa ra ngoài cùng"*). Cuộn chung thì đầu cột trôi lên mất, người dùng cuộn xuống giữa
        * bảng là không còn biết thẻ đang thuộc bước nào.
        *
        * 🔴🔴 HAI LỚP NỀN LÀ BẮT BUỘC — Ban lãnh đạo báo *"khi kéo xuống thì nội dung header và
        * nội dung bị đè lên nhau"*.
        *
        * Vì sao lần đầu tôi làm sai: tôi đặt `bg-muted` cùng chỗ với `LOP_NEN_NHAT`, tưởng thế là
        * có nền đục. Nhưng các token `*-bg` của Design System là **màu pha với trong suốt**
        * (`--hp-warning-bg: color-mix(in srgb, var(--hp-warning) 14%, transparent)`) — tức nền chỉ
        * 14% màu, **86% nhìn xuyên qua**. Và hai lớp `bg-*` trên CÙNG một thẻ thì không cộng vào
        * nhau: cái nào định nghĩa sau trong tệp CSS sẽ thắng, ta không kiểm soát được thứ tự đó.
        * Kết quả: thẻ cuộn qua hiện xuyên qua chữ tên cột, đúng như ảnh.
        *
        * Nay tách làm hai thẻ lồng nhau: thẻ ngoài giữ nền ĐỤC (`bg-surface`) để chặn hẳn nội
        * dung phía sau, thẻ trong vẽ màu nhạt của bước lên trên. `shadow-sm` tạo một gờ mỏng để
        * mắt thấy đầu cột đang nổi trên nội dung đang cuộn.
        */}
      <header className="sticky top-0 z-20 flex flex-col bg-surface shadow-sm">
        <div
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
          {/**
            * ★ THANH TIẾN ĐỘ ĐẦU CỘT — Ban lãnh đạo 23/08/2026: *"thêm thanh tiến độ giống vậy
            * trên header"*, kèm ảnh bảng Base thật (`TM-QT Mua hàng (HP CONS)`): dưới tên bước là
            * một thanh ngang mảnh, rồi một dòng thống kê nhỏ.
            *
            * 🔴 THANH ĐO CÁI GÌ — CHỌN THEO DỮ LIỆU APP CÓ THẬT, không bắt chước con số của Base.
            * Base ghi `10/10 NV · 3 Q.hạn · ⏱ 4.00h`; app này KHÔNG có giờ định mức cho từng bước
            * nên không có gì để điền vào chỗ `⏱ 4.00h`. Bịa ra một con số giờ để trông giống ảnh
            * là dựng số liệu không có nguồn — thứ nặng hơn hẳn việc thiếu một cụm chữ.
            *
            * 👉 Thanh chạy theo **số hồ sơ đã có người phụ trách / tổng số hồ sơ trong cột** —
            * đúng câu hỏi người quản lý nhìn đầu cột để trả lời: *"việc ở bước này đã giao hết
            * chưa"*. Cùng nghĩa với `10/10 NV` của Base (nhiệm vụ đã nhận / tổng).
            *
            * 🔴 MÀU ĐỎ KHI CÓ HỒ SƠ QUÁ HẠN, đúng như thanh đỏ trong ảnh. Nhưng con số quá hạn
            * VẪN ĐƯỢC VIẾT RA CHỮ ở dòng dưới — Design System V1.1 buộc trạng thái phải có cả màu
            * lẫn chữ, người không phân biệt được màu vẫn phải đọc ra.
            *
            * ⚠️ CỘT TRỐNG: vẽ rãnh xám và không tô gì, kèm chữ "0 đề nghị". Không ẩn thanh đi —
            * ẩn thì tám cột cao thấp lệch nhau, đúng lỗi "thụt lên xuống không đều" Ban lãnh đạo
            * đã bắt ngày 15/08/2026.
            *
            * 📌 `role="progressbar"` + `aria-*`: thanh này chở thông tin thật nên trình đọc màn
            * hình phải đọc được, không chỉ là một vệt màu trang trí.
            */}
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={the.length}
            aria-valuenow={soDaGiao}
            aria-label={`${giaiDoan.nhan}: đã giao ${soDaGiao} trên ${the.length} hồ sơ`}
            className="h-1.5 w-full overflow-hidden rounded-full bg-neutral/25"
          >
            <div
              className={`h-full rounded-full transition-[width] ${
                soQuaHan > 0 ? LOP_NEN_DAC.danger : LOP_NEN_DAC[giaiDoan.tong]
              }`}
              /* Bề rộng là SỐ TÍNH RA nên buộc phải đặt qua `style` — Tailwind chỉ sinh được lớp
                 cho những giá trị viết sẵn trong mã, `w-[${…}%]` động sẽ không có lớp nào cả và
                 thanh im lặng mất luôn phần đã chạy. */
              style={{ width: `${tyLeDaGiao}%` }}
            />
          </div>
          <p className="text-xs text-text-desc">
            {the.length === 0
              ? "0 đề nghị"
              : `${soDaGiao}/${the.length} đã giao${soQuaHan > 0 ? ` · ${soQuaHan} quá hạn` : ""}`}
            {/* ★ SỐ HỒ SƠ CÒN THIẾU Ở NGAY ĐẦU CỘT (23/08/2026) — Ban lãnh đạo: *"cần hiển thị đỏ
                để biết đang thiếu ở bước nào"*. Đọc đầu cột là biết bước nào có hồ sơ còn nợ, không
                phải rà từng thẻ; thẻ nào nợ thì đã có viền đỏ để tìm ra ngay. */}
            {soConThieu > 0 && (
              <span className="font-semibold text-danger"> · {soConThieu} còn thiếu</span>
            )}
          </p>
        </div>
      </header>

      {/* Thân cột — `flex-1 min-h-0` để mọi cột cao bằng nhau và kín đáy bảng;
          nội dung vượt chiều cao thì cuộn dọc BÊN TRONG cột, trang không dài ra. */}
      {/**
        * Thân cột — KHÔNG CÒN CUỘN RIÊNG từ 23/08/2026.
        *
        * 🔴 Ban lãnh đạo chỉ mũi tên ra mép phải bảng: *"Đưa ra ngoài cùng"*. Trước đây mỗi cột
        * tự cuộn dọc, nên cột nào nhiều thẻ là mọc một thanh cuộn **giữa lòng bảng**, chen ngay
        * cạnh vạch chia hai cột — ba lần tôi chỉnh bề dày và đệm đều không chữa được, vì cái sai
        * là CHỖ ĐẶT chứ không phải hình dáng.
        *
        * Nay cả bảng cuộn dọc một lần, thanh nằm ở mép phải ngoài cùng (`overflow-auto` ở khung
        * ngoài), và đầu cột `sticky` nên tên bước không trôi mất.
        *
        * ⚠️ Bỏ `min-h-0` cùng lúc với bỏ `overflow-y-auto`: `min-h-0` chỉ có nghĩa khi phần tử
        * phải co lại để cuộn bên trong. Giữ lại mà không còn cuộn thì cột cao nhất không kéo được
        * các cột khác cao theo, bảng thành so le.
        */}
      {/* ★ ĐỆM NGANG = 0 (Ban lãnh đạo 23/08/2026: *"khoảng cách chỗ này thu nhỏ lại hoặc bỏ luôn
          đi, để full viền luôn"* — ảnh khoanh đỏ đúng hai dải trống hai bên thẻ).

          Thẻ nay chạy sát vạch chia cột, nên bề rộng dùng được cho nội dung thẻ tăng thêm 2 ×
          12px = 24px trên mỗi cột — chính là chỗ đang làm tiêu đề hồ sơ gãy thành 3–4 dòng.

          Lượt sau Ban lãnh đạo chỉ tiếp dải trống phía TRÊN thẻ đầu: *"Bỏ khoảng cách này luôn"*
          → đệm dọc cũng về 0. Thẻ đầu dán ngay dưới vạch chân đầu cột.

          ★ LƯỢT BA (`"vẫn còn khoảng cách"`, ảnh khoanh đúng dải xám GIỮA hai thẻ): `gap` cũng về
          0. Nay cột là một khối thẻ xếp liền, không còn một milimét nền xám nào lọt giữa.

          🔴 `gap-0` MỘT MÌNH THÌ RA HAI ĐƯỜNG VIỀN SÁT NHAU (viền dưới thẻ trên + viền trên thẻ
          dưới = vạch dày 2px, đậm hơn mọi vạch khác trên bảng). Vì vậy thẻ phải kéo lên 1px để
          hai viền chồng thành một — xử ở `TheDeNghi` bằng `-mb-px`, xem chú thích ở đó. Sửa một
          chỗ mà bỏ chỗ kia là bảng có vạch đôi, nhìn như lỗi kẻ bảng. */}
      <div className="flex flex-1 flex-col gap-0 p-0">
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
              onXemNhanh={onXemNhanh}
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
  onXemNhanh,
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
  /** Bấm thẻ mở pop-up đè lên board — xem `BangQuyTrinhMuaHangProps`. */
  onXemNhanh?: (prId: string) => void;
}) {
  /* `soDongChuaPhanBo` không lấy ra nữa — số đó đã nằm trong câu `the.conNo`. Trường vẫn còn
     trên `TheDeNghiTrenBang` cho nơi khác dùng, chỉ thẻ này thôi đọc trực tiếp. */
  const { deNghi, han, nguoiPhuTrach, maPOLienQuan } = the;
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
      /**
       * ★★★ BẤM THƯỜNG → MỞ POP-UP ĐÈ LÊN BOARD — "cách 3" trong 3 cách xem, chốt LẦN BA cùng
       * ngày 28/08/2026 (xem lịch sử đủ 3 lần ở JSDoc `onXemNhanh` trong `BangQuyTrinhMuaHangProps`
       * đầu file — đừng đọc mỗi đoạn này rồi tưởng "bấm thẻ = trang đầy đủ" như trước, đã đổi).
       *
       * Trang chứa giờ LUÔN truyền `onXemNhanh` (hàm mở `Dialog` pop-up), nên nhánh dưới luôn
       * chạy — không còn rơi về `<Link>` điều hướng thẳng như bản giữa ngày nữa.
       *
       * 📌 `href` VẪN GIỮ ĐÚNG, KHÔNG BỎ: Ctrl+click / chuột giữa (được `e.metaKey` v.v. cho qua,
       * không gọi `preventDefault`) vẫn phải mở được trang đầy đủ ở tab mới — trình duyệt tự lo
       * phần đó dựa vào `href`, không cần code thêm.
       */
      onClick={
        onXemNhanh
          ? (e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              onXemNhanh(deNghi.id);
            }
          : undefined
      }
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
      /**
        * ★ THẺ XẾP LIỀN, KHÔNG BO GÓC (23/08/2026 — Ban lãnh đạo: *"vẫn còn khoảng cách"*, khoanh
        * đúng dải xám giữa hai thẻ). Thân cột đã về `gap-0`, nên:
        *
        *   · `rounded-none` thay `rounded-lg`: góc bo mà thẻ dán nhau thì hai góc cong quay vào
        *     nhau, hở ra bốn mẩu nền xám hình tam giác — đúng thứ vừa được yêu cầu bỏ, chỉ nhỏ
        *     hơn. Xếp liền thì phải vuông góc.
        *   · `-mb-px` kéo mỗi thẻ lên 1px để viền dưới thẻ trên và viền trên thẻ dưới CHỒNG
        *     thành một vạch 1px, thay vì cộng lại thành vạch đôi 2px đậm hơn mọi vạch khác.
        *
        * ⚠️ `-mb-px` áp cho CẢ thẻ cuối (Tailwind không có biến thể `not-last` gọn ở đây). Hệ quả
        * duy nhất: cột ngắn đi 1px ở đáy — không thấy được, vì thân cột đã hết đệm và viền đáy
        * bảng nằm ở khung ngoài.
        */
      /**
        * ★ VIỀN ĐỎ KHI BƯỚC ĐANG ĐỨNG CÒN NỢ — Ban lãnh đạo 23/08/2026: *"ở quy trình này cũng
        * cần hiển thị đỏ để biết đang thiếu ở bước nào"*.
        *
        * 📌 Thẻ nằm ở cột nào = bước hiện tại của nó, nên tô thẻ là đã trả lời đúng câu *"thiếu ở
        * bước nào"* — không cần thêm dấu gì ở cột.
        *
        * ⚠️ Chỉ đổi VIỀN NGOÀI, giữ nguyên `border-l-4` màu bước ở lề trái: dải màu đó là cái để
        * mắt nhận ra thẻ thuộc bước nào khi cuộn ngang, đổi nó sang đỏ là mất luôn thông tin đó.
        * Nhãn hạn (`Còn 6 ngày` / viền đỏ khi quá hạn) cũng giữ — hai việc khác nhau: quá hạn là
        * chuyện THỜI GIAN, còn nợ chứng từ là chuyện HỒ SƠ.
        */
      className={`-mb-px flex flex-col gap-1.5 rounded-none border border-l-4 p-(--hp-md-row-pad) transition-colors hover:border-primary ${
        the.conNo ? "border-danger" : "border-border"
      } ${
        keoThaDuoc ? "cursor-grab active:cursor-grabbing" : ""
      } ${LOP_VIEN_TRAI[han.quaHan ? "danger" : tongGiaiDoan]} ${nenThe}`}
    >
      {/**
        * ★ TIÊU ĐỀ MỘT DÒNG THEO ĐÚNG MẪU BASE — Ban lãnh đạo 21/08/2026 gửi ảnh bảng Base thật
        * (`TM-QT Mua hàng (HP CONS)`) kèm chú giải, và ghi *"bố cục giống vậy"*:
        *
        *     2975818 - 01/2026/HĐXD-HPCS - NHÀ MÁY HOWELL
        *     └ mã đề xuất   └ số hợp đồng      └ tên công trình
        *
        * 🔴 LẦN NÀY GHÉP ĐƯỢC, LẦN 20/08 THÌ KHÔNG — khác nhau ở PHẦN ĐẦU:
        *   · 20/08 phần đầu là **mã đề nghị của app** (`29/2025/HĐXD-HPCS-MẠNH TƯỚI-PR-001`), mà
        *     mã đó **chứa luôn số hợp đồng ở đầu**. Ghép vào là đọc ra *"…MẠNH TƯỚI-PR-001 -
        *     29/2025/HĐXD-HPCS-MẠNH TƯỚI"* — như in lặp một chuỗi, nên Sếp yêu cầu tách ra.
        *   · Nay phần đầu là **mã đề xuất App Request** (`2975818` — số ngắn, không chứa gì của
        *     công trình), nên ba phần rời nhau rõ ràng, không lặp một ký tự nào.
        * 👉 Đừng đổi phần đầu về `deNghi.code`: làm vậy là quay lại đúng cái đã bị bác.
        *
        * 📌 Phiếu LẬP TAY trong app không có mã đề xuất — lúc đó phần đầu lùi về mã đề nghị, vì
        * thẻ vẫn phải có một mã để gọi tên. Không bỏ trống.
        */}
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-semibold leading-tight text-text-primary">
            {/* Mã đứng đầu tô màu chủ đạo để mắt bắt được ngay trong một cột dài các thẻ. */}
            <span className="text-primary select-all">
              {deNghi.maDeXuatAppRequest || deNghi.code}
            </span>
            {deNghi.maHopDongCDT ? ` - ${deNghi.maHopDongCDT}` : ""}
            {deNghi.tenCongTrinh ? ` - ${deNghi.tenCongTrinh.toUpperCase()}` : ""}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {deNghi.mucDoUuTien === "gap" && <StatusBadge label="Gấp" tone="danger" />}
          <MenuThaoTacThe
            the={the}
            /**
             * ★★ HẾT GẮN VỚI `keoThaDuoc` — sửa 28/08/2026. Trước đây dòng này viết
             * `keoThaDuoc ? onTha : undefined`, nên lúc kéo thả bị tắt (`keoThaDuoc={false}`,
             * đang vậy từ 27/08/2026) thì 2 mục menu "Chuyển sang giai đoạn kế tiếp"/"Chuyển về
             * giai đoạn trước" cũng biến mất theo — dù 2 mục đó KHÔNG kéo thả gì cả, chỉ gọi lại
             * `onTha` để mở đúng `HopChuyenGiaiDoan` (xem `de-nghi-danh-sach.tsx` → `xuLyTha`).
             *
             * 🔴 Đây chính là đường vào mới của hộp đó sau khi bấm thẻ đổi sang mở thẳng trang
             * đầy đủ ("cách 1") — không phục hồi lại thì `HopChuyenGiaiDoan` thành mồ côi, xem
             * CLAUDE.md mục 3.4b.
             *
             * ⚠️ `draggable`/`onDragStart`/`onDragEnd` của thẻ (phía trên) vẫn khoá riêng theo
             * `keoThaDuoc` như cũ — tắt gate ở ĐÂY không bật lại kéo thả.
             */
            onTha={onTha}
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
        {/* 📌 ĐÃ BỎ "Mã hồ sơ" khỏi dòng này (21/08/2026) — Ban lãnh đạo khoanh đỏ đúng dòng này
            và ghi *"bố cục hiển thị giống vậy"*, mà Base chỉ có: Bộ phận · Nhóm đề xuất · Ngày
            đề nghị cấp · Chi tiết · Link phiếu đề nghị.
            ⚠️ Mã hồ sơ của app KHÔNG mất: vẫn ở menu ⋯ (*"Sao chép mã đề nghị"*), ở trang chi
            tiết, và tìm kiếm vẫn ra. Chỉ bỏ khỏi thẻ cho gọn đúng mẫu. */}
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
        {/* ★ LINK PHIẾU ĐỀ NGHỊ — thành phần cuối của dòng meta trong Base (*"Link phiếu đề …"*).
            🔴 BẤM ĐƯỢC, không chỉ là chữ: Base cắt cụt thành "Link phiếu đề…" nên bên đó phải mở
            thẻ ra mới dùng được. Ở đây bấm là mở luôn phiếu gốc — đó mới là việc người ta cần khi
            đọc thẻ.
            ⚠️ `stopPropagation` là bắt buộc: cả thẻ là một <Link> và kéo-thả được, thiếu nó thì
            bấm vào đây là mở trang chi tiết thay vì mở phiếu gốc. */}
        {deNghi.linkPhieuDeNghi && (
          <>
            {" · "}
            <a
              href={deNghi.linkPhieuDeNghi}
              target="_blank"
              rel="noopener noreferrer"
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-primary underline decoration-dotted hover:decoration-solid"
            >
              Link phiếu đề nghị
            </a>
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
      {/**
        * ★ MỘT DÒNG ĐỎ DUY NHẤT, NÓI ĐỦ BƯỚC NÀY CÒN THIẾU GÌ (23/08/2026).
        *
        * 🔴 GỘP TỪ HAI DÒNG RỜI: trước đây thẻ có "Thiếu N công việc chưa phân bổ" và "Còn nợ Hợp
        * đồng/Đơn mua hàng" viết tay riêng. Hai dòng đó nay nằm trong `conNo` — một hàm
        * (`conNoCuaBuoc`) sinh ra cả câu, nên thẻ trên bảng, viền đỏ ở trang chi tiết và hộp kéo
        * thả **không bao giờ nói khác nhau**. Thêm loại thiếu mới thì sửa đúng một chỗ.
        *
        * 🔴 ĐÂY LÀ SỐ LIỆU NGHIỆP VỤ, KHÔNG PHẢI CÂU GIẢI THÍCH CÁCH APP CHẠY — nên KHÔNG rơi vào
        * chỉ đạo 16/08/2026 (*"bỏ hết các ghi chú kiểu này đi"*). Nếu chỉ hiện ở trang chi tiết thì
        * phải mở từng phiếu mới biết, tức là sẽ quên.
        *
        * 🔴 HIỆN ĐỦ MỌI MỤC, MỖI MỤC MỘT DÒNG — Ban lãnh đạo 23/08/2026: *"Thiếu những mục gì thì
        * hiển thị đủ luôn"*.
        *
        * ⚠️ BẢN TRƯỚC CẮT BỚT BẰNG `line-clamp-2` và đó là sai: thẻ kanban rộng ~240px nên một câu
        * gộp *"còn 1 công việc chưa hoàn thành … · chưa đính kèm Hóa đơn VAT"* bị cắt ngay ở mục
        * thứ hai — người đọc tưởng chỉ thiếu một thứ, mà thứ bị giấu lại chính là chứng từ. Thẻ cao
        * thêm vài dòng là cái giá rẻ hơn nhiều so với giấu mất một mục thiếu.
        */}
      {(the.dsConNo?.length ?? 0) > 0 && (
        <span className="flex flex-col gap-0.5 text-xs font-medium text-danger">
          {the.dsConNo!.map((muc) => (
            <span key={muc} className="flex items-start gap-1">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {/* Viết hoa chữ đầu từng dòng — `dsConNoCuaBuoc` trả các mảnh chữ thường để nối
                  thành câu, đứng riêng một dòng thì phải đọc ra như một câu. */}
              <span>{muc.charAt(0).toUpperCase() + muc.slice(1)}</span>
            </span>
          ))}
        </span>
      )}

      {/**
        * ★ CỘT THẤT BẠI: BÀY LÝ DO, KHÔNG BÀY NỢ CHỨNG TỪ — Ban lãnh đạo 24/08/2026: *"Ở bước
        * thất bại chỉ cần ghi lý do thất bại. Không cần ghi các thông tin thiếu này"*.
        *
        * 🔴 PHẦN "KHÔNG BÀY NỢ" nằm ở tầng quy trình (`mucConNoToanHoSo` trả mảng rỗng khi giai
        * đoạn là `that_bai`), KHÔNG lọc ở đây. Lọc ở giao diện thì bảng, danh sách và trang chi
        * tiết mỗi chỗ phải tự nhớ lọc — sớm muộn một chỗ quên.
        *
        * ⚠️ Hồ sơ đóng dở TRƯỚC 24/08/2026 không có lý do (hàm `dongDoDeNghi` khi đó chưa nhận
        * lý do), nên phải chịu được `undefined`: khi đó thẻ chỉ có nhãn trạng thái "Thất bại".
        * Không bịa một câu thay thế — nói "không rõ lý do" thì người đọc tưởng app mất dữ liệu.
        */}
      {the.giaiDoan === "that_bai" && the.deNghi.lyDoThatBai && (
        <span className="flex items-start gap-1 text-xs font-medium text-danger">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>Lý do: {the.deNghi.lyDoThatBai}</span>
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

  /**
   * ★ SAO CHÉP RIÊNG MÃ ĐỀ NGHỊ — Ban lãnh đạo 20/08/2026: *"sau này các app khác sẽ link từ mã
   * đề nghị"*.
   *
   * 🔴 KHÁC "sao chép đường dẫn": đường dẫn là địa chỉ web của app Thu mua, dùng để mở trang.
   * Còn app Kho và app QLDA nối hồ sơ với nhau bằng **mã hồ sơ** (theo Thông báo 09/2026), nên
   * người dùng cần chép được đúng cái mã đó để dán sang app khác — không phải cả một URL.
   */
  async function saoChepMa() {
    try {
      await navigator.clipboard.writeText(deNghi.code);
      toast.success("Đã sao chép mã đề nghị", { description: deNghi.code });
    } catch {
      toast.error("Trình duyệt không cho sao chép", {
        description: `Tự chép tay: ${deNghi.code}`,
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
            {/**
              * ★★★ "XEM TOÀN MÀN HÌNH" THAY CHO "XEM TRONG POP-UP" — sửa 28/08/2026, chốt lần
              * 3 cùng ngày. Từ giờ bấm thẻ TRỰC TIẾP đã mở pop-up rồi (xem `onXemNhanh` ở
              * `<Link>` bên trên) — giữ thêm một mục menu làm ĐÚNG Y HỆT việc đó là thừa, hai
              * đường tới cùng một kết quả chỉ gây rối. Mục menu này giờ đứng vai "leo thang" ra
              * trang đầy đủ, CÙNG TAB — đối xứng đúng 2 mục của menu "•••" bên TRONG pop-up
              * (`de-nghi-danh-sach.tsx` → "Xem toàn màn hình"/"Xem trong tab mới"), để người
              * dùng học một lần dùng được ở cả hai chỗ.
              */}
            <DropdownMenuItem onClick={() => router.push(duongDan)}>
              <Maximize2 className="size-4 shrink-0" aria-hidden />
              Xem toàn màn hình
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(duongDan, "_blank", "noopener")}>
              <ExternalLink className="size-4 shrink-0" aria-hidden />
              Xem trong tab mới
            </DropdownMenuItem>
            {/* Mã đứng TRƯỚC đường dẫn: dán mã sang app khác là việc dùng nhiều hơn. */}
            <DropdownMenuItem onClick={saoChepMa}>
              <Copy className="size-4 shrink-0" aria-hidden />
              Sao chép mã đề nghị
            </DropdownMenuItem>
            <DropdownMenuItem onClick={saoChepDuongDan}>
              <LinkIcon className="size-4 shrink-0" aria-hidden />
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
                {/* ★ HAI MỤC KHÁC NHAU, ĐỪNG GỘP — Ban lãnh đạo 18/08/2026 gửi ảnh hộp của Base
                    và yêu cầu *"cấu hình giống 100%"*.
                    · "Chỉnh sửa các trường dữ liệu tùy chỉnh" = bày ĐÚNG các trường của quy
                      trình, xếp theo từng bước (bám ảnh Base).
                    · "Trường tự thêm" = bảng cặp tên/giá trị người dùng tự đặt, cho thông tin
                      quy trình chưa có ô nào.
                    🔴 Mục cũ đã đổi nhãn từ "Chỉnh sửa dữ liệu tùy chỉnh" thành "Trường tự thêm":
                    để nguyên hai nhãn gần y nhau thì không ai đoán được bấm cái nào ra cái gì. */}
                <DropdownMenuItem onClick={() => thaoTac.onSuaTruongTuyChinh(deNghi.id)}>
                  <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
                  Chỉnh sửa các trường dữ liệu tùy chỉnh
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => thaoTac.onSuaTruongBoSung(deNghi.id)}>
                  <ListPlus className="size-4 shrink-0" aria-hidden />
                  Trường tự thêm
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
