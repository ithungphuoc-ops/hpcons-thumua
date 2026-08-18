"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Coins, Plus, Search, StickyNote, Trash2 } from "lucide-react";
import { NhanPhanTrongGiaiDoan } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-dau-vao-theo-giai-doan";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/1-giao-dien/nen-tang-ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/1-giao-dien/nen-tang-ui/table";
import { dongTuDoDuVaoDon } from "@/2-quy-trinh/don-hang-mau";
import type { KetQuaTienDonHang } from "@/2-quy-trinh/tinh-toan";
import type { KieuChietKhau } from "@/3-du-lieu/kieu-du-lieu";
import { boDau } from "@/6-tien-ich/bo-dau";

/**
 * BẢNG "HÀNG TIỀN" của màn Đơn mua hàng — bám bố cục MISA.
 *
 * 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 17/08/2026: *"cấu hình cho a bước lập đơn mua hàng có chức năng
 * giống này 100% và được import được file excel"*, kèm ảnh chụp màn "Đơn mua hàng DMH0532-26"
 * của MISA. Bảng này là phần giữa của màn đó.
 *
 * Cột giữ ĐÚNG THỨ TỰ của MISA:
 *   # · Mã hàng · Tên hàng · Thông số kỹ thuật · ĐVT · Số lượng · Đơn giá · Thành tiền ·
 *   % Thuế GTGT · Tiền thuế GTGT · Trường mở rộng 1 · [Mục đích sử dụng] · (nút xóa dòng)
 *
 * ⚠️ "Mục đích sử dụng" KHÔNG có trên màn MISA — đây là cột THÊM của công ty, đặt sau cùng để
 * không phá thứ tự MISA. Không được bỏ: biểu mẫu giấy đang lưu hành
 * `1. INPUT/Bieu mau/1. DON HANG HPCONS.xlsx` có cột này và trang in `/in/don-hang/[id]` đang
 * in nó ra. Bỏ đi là đơn gửi nhà cung cấp mất một cột so với bản giấy.
 *
 * 🔴 BẢNG NÀY KHÔNG TỰ TÍNH MỘT CON SỐ TIỀN NÀO. Mọi số Thành tiền / Tiền thuế / dòng TỔNG
 * CỘNG đều nhận sẵn qua `tien`, do `2-quy-trinh/tinh-toan.ts` → `tinhTienChiTiet` tính. Đây là
 * quy tắc 3.4b của dự án: để hàm tính tiền trong file giao diện là có hai chỗ cùng tính một
 * con số rồi lệch nhau — mà lệch tiền giữa màn hình và bản in là mất uy tín với nhà cung cấp.
 *
 * 🔴 CỘT TIỀN CHỈ HIỆN VỚI NGƯỜI CÓ `quyen.xemGia`. Ẩn cột KHÔNG phải là bảo mật (nguyên tắc
 * dữ liệu số 3 của dự án: chặn thật nằm ở chỗ tách `tm_donhang_gia` ra document riêng), nhưng
 * vẫn phải ẩn để người không có phần việc về giá không nhìn thấy giá trên màn hình chung.
 * Bảng vẫn dựng đủ dòng hàng, chỉ mất mấy cột tiền.
 *
 * ---
 *
 * ★★ 18/08/2026 — BAN LÃNH ĐẠO: *"giao diện phần PO e chỉnh lại giống 100% như vậy"* ★★
 *
 * Hai thứ của MISA trước đây bị BỎ với lý do "app không có sẵn", nay ĐÃ LÀM THẬT:
 *
 *  1. **Phân trang "20 bản ghi trên 1 trang" + Trước · N · Sau** — xem khối `dongTrang`.
 *     🔴 CÁI BẪY ĐÃ XỬ: bảng tra tiền của từng dòng bằng CHỈ SỐ trong mảng `dong`
 *     (`tienCuaDong(viTri)`), và cột `#` cũng là `viTri + 1`. Cắt trang bằng `dong.slice()`
 *     rồi `.map((d, i) => …)` là chỉ số về 0 → **tiền của trang 2 nhảy về dòng của trang 1 và
 *     cột `#` đánh lại từ 1**. Nên ở đây cắt trang trên mảng CẶP `{ d, viTri }` (`dongCoViTri`),
 *     `viTri` luôn là chỉ số THẬT trong `dong` dù đang ở trang nào hay đang lọc.
 *     🔴 Dòng TỔNG CỘNG và mọi con số tiền vẫn tính trên TOÀN BỘ đơn, không theo trang —
 *     tổng theo trang là một con số không có nghĩa trên chứng từ. Có câu nói rõ điều đó.
 *
 *  2. **"F3 - Tìm nhanh"** — F3 nay đưa con trỏ vào ô tìm ngay trên bảng, lọc theo Mã hàng /
 *     Tên hàng / Thông số / ĐVT / Trường mở rộng / Mục đích (bỏ dấu, không phân biệt hoa
 *     thường). Trước đây F3 bị bỏ vì "màn không có ô tìm nào để mở" — nay có ô thật.
 *     🔴 CHỈ BẮT PHÍM KHI `batPhimTat` (tức chỉ ở trang riêng), cùng lý do đã áp cho F9: nhúng
 *     trong trang chi tiết đề nghị thì F3 sẽ cướp phím của ô bình luận và bảng phân bổ.
 *
 * ⚠️ THÊM DÒNG KHI ĐANG LỌC / ĐANG Ở TRANG 1: dòng mới nằm ở CUỐI mảng nên có thể rơi ra ngoài
 * trang đang xem hoặc không khớp bộ lọc — người dùng bấm [Thêm dòng] mà không thấy gì hiện ra,
 * bấm tiếp mấy lần rồi sinh ra một loạt dòng trắng. Vì vậy hễ số dòng TĂNG là tự xóa bộ lọc và
 * nhảy tới trang cuối (xem hiệu ứng `soDongTruoc`).
 */

/** Một dòng đang nhập trên bảng — kể cả dòng ghi chú. */
export interface DongNhapDonHang {
  /**
   * Khóa nội bộ của dòng, KHÔNG phải số thứ tự.
   *
   * ⚠️ Dùng chỉ số mảng làm `key` thì xóa dòng giữa bảng sẽ khiến React gán lại ô nhập cho
   * dòng khác — chữ đang gõ nhảy sang dòng bên cạnh. Đã là lỗi kinh điển của bảng sửa tại chỗ.
   */
  id: string;
  /** Dòng ghi chú chèn giữa bảng (nút "Thêm ghi chú" của MISA), không phải hàng hóa. */
  laGhiChu: boolean;
  /**
   * Số thứ tự dòng trên PHIẾU ĐỀ NGHỊ mà dòng này lấy khối lượng ra — khóa truy vết.
   *
   *   · số ≥ 1     → dòng hàng trừ khối lượng vào đúng dòng đó của phiếu đề nghị
   *   · `0`        → dòng ghi chú
   *   · `undefined`→ dòng hàng của ĐƠN KHÔNG GẮN ĐỀ NGHỊ (18/08/2026), gõ tự do
   *
   * 🔴 QUY TẮC CŨ VẪN NGUYÊN KHI ĐƠN CÓ ĐỀ NGHỊ: không dòng hàng nào được đứng ngoài đề nghị,
   * vì khối lượng đặt phải trừ vào một dòng đã được phân bổ — đặt ngoài là mua hàng không ai
   * duyệt. Dòng gõ tự do chỉ có ở module "Lập đơn mua hàng (PO)", mà module đó **không cất đơn
   * vào hệ thống** (Ban lãnh đạo chiều 18/08/2026: *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"* —
   * `themDonHang` từ chối đơn thiếu `prId`). Nên dòng `undefined` chỉ tồn tại trong bản mẫu để
   * in / xuất Excel, không bao giờ nằm trong dữ liệu, và không đi vòng qua chốt nào.
   *
   * ⚠️ Đừng dùng `0` cho dòng độc lập: `0` đã mang nghĩa dòng ghi chú.
   */
  sttDeNghi?: number;
  maHang: string;
  tenHang: string;
  thongSo: string;
  dvt: string;
  soLuong: string;
  donGia: string;
  /** % thuế GTGT riêng của dòng. Để trống = theo thuế suất chung của đơn. */
  thueSuat: string;
  truongMoRong1: string;
  mucDich: string;
}

/** Phần còn được đặt của một dòng đề nghị — để nhắc và cảnh báo khi nhập vượt. */
export interface ConLaiDeNghi {
  conLai: number;
  donViTinh: string;
}

export function BangHangTien({
  dong,
  tien,
  xemGia,
  conLai,
  kieuChietKhau,
  tyLeChietKhau,
  chietKhau,
  onDoiDong,
  onXoaDong,
  onThemDong,
  onThemGhiChu,
  onXoaHetDong,
  onDoiKieuChietKhau,
  onDoiTyLeChietKhau,
  onDoiChietKhau,
  /** Còn mặt hàng nào của đề nghị chưa đưa vào bảng không — khóa nút "Thêm dòng" khi hết. */
  conMatHangDeThem,
  /**
   * ★ ĐƠN KHÔNG GẮN ĐỀ NGHỊ — nút "Thêm dòng" chèn một DÒNG TRẮNG gõ tay (18/08/2026).
   *
   * 🔴 CHỈ ĐỔI CHỮ, KHÔNG ĐỔI LUẬT. Việc chèn dòng gì là của chỗ gọi (`onThemDong`); cờ này
   * chỉ để bảng nói đúng sự thật với người dùng: câu "Bấm Thêm dòng để chọn mặt hàng của đề
   * nghị" là SAI trong chế độ độc lập, và câu "Đã đưa hết mặt hàng lập được đơn của đề nghị
   * này vào bảng" thì vô nghĩa vì không có đề nghị nào.
   */
  nhapTuDo = false,
  /**
   * Bảng đang nằm TRONG khối một bước của trang chi tiết đề nghị (chỉ đạo 17/08/2026: phần
   * nhập liệu phải nằm trong khối) → hạ cỡ tiêu đề "Hàng tiền" xuống bằng các nhãn khác của
   * khối bước.
   *
   * 🔴 KHÔNG chép class ra đây mà dùng `NhanPhanTrongGiaiDoan`: bốn nhãn trong một khối bước
   * bắt buộc luôn bằng nhau. Ban lãnh đạo 16/08/2026 đã khoanh đỏ đúng lỗi này — tiêu đề con
   * 18px to hơn tiêu đề khối cha 11px, ngược thứ bậc.
   */
  tieuDeTrongKhoiGiaiDoan = false,
  /**
   * ★ CÓ ĐƯỢC BẮT PHÍM TẮT F3 TRÊN CẢ CỬA SỔ KHÔNG (18/08/2026).
   *
   * 🔴 CỜ RIÊNG, KHÔNG dùng lại `tieuDeTrongKhoiGiaiDoan` dù hai giá trị hiện đang ngược nhau:
   * cờ kia nói về CỠ CHỮ tiêu đề. Gộp hai việc vào một cờ thì lần sau ai đổi cỡ chữ sẽ vô tình
   * bật/tắt phím tắt của cả trang mà không hề biết.
   *
   * `false` (mặc định) = KHÔNG bắt phím: ô tìm vẫn bấm được bằng chuột, chỉ không chiếm phím F3
   * của cả cửa sổ. Đúng lý do đã áp cho F9 — nhúng trong trang chi tiết đề nghị thì bên cạnh
   * còn ô bình luận và bảng phân bổ.
   */
  batPhimTat = false,
}: {
  dong: DongNhapDonHang[];
  tien: KetQuaTienDonHang;
  xemGia: boolean;
  conLai: Record<number, ConLaiDeNghi>;
  kieuChietKhau: KieuChietKhau;
  tyLeChietKhau: string;
  chietKhau: string;
  onDoiDong: (id: string, phan: Partial<DongNhapDonHang>) => void;
  onXoaDong: (id: string) => void;
  onThemDong: () => void;
  onThemGhiChu: () => void;
  onXoaHetDong: () => void;
  onDoiKieuChietKhau: (k: KieuChietKhau) => void;
  onDoiTyLeChietKhau: (v: string) => void;
  onDoiChietKhau: (v: string) => void;
  conMatHangDeThem: boolean;
  tieuDeTrongKhoiGiaiDoan?: boolean;
  nhapTuDo?: boolean;
  batPhimTat?: boolean;
}) {
  /**
   * Số cột của phần giữa (từ "Mã hàng" đến "Mục đích sử dụng") — dòng ghi chú gộp hết phần
   * này thành một ô chữ, đúng cách MISA vẽ dòng ghi chú.
   */
  const soCotGiua = 7 + (xemGia ? 4 : 0);
  /** Tổng số cột thật của bảng — dùng cho `colSpan` của các dòng chiếm cả bề ngang. */
  const soCotCaBang = soCotGiua + 2;

  /** Tra kết quả tiền của một dòng. `sttDong` chính là CHỈ SỐ dòng trong `dong` — xem trang lập đơn. */
  const tienCuaDong = (viTri: number) => tien.dong.find((t) => t.sttDong === viTri);

  // ---------------------------------------------------------------------------
  // ★ TÌM NHANH (F3) + PHÂN TRANG — hai thành phần của MISA, làm thật 18/08/2026
  // ---------------------------------------------------------------------------
  const [tuKhoaTim, setTuKhoaTim] = useState("");
  const oTim = useRef<HTMLInputElement>(null);
  /** Số bản ghi trên một trang — MISA mặc định 20, giữ đúng con số đó. */
  const [soDongTrang, setSoDongTrang] = useState(20);
  const [trang, setTrang] = useState(1);

  /**
   * 🔴 GHÉP SẴN CHỈ SỐ THẬT VÀO TỪNG DÒNG — chốt an toàn của cả khối này.
   *
   * Mọi thứ phía sau (lọc, cắt trang) chỉ thao tác trên mảng cặp này, nên `viTri` đi theo dòng
   * và không bao giờ bị đánh lại. Nếu ai đó về sau đổi sang `dong.slice(...).map((d, i) => …)`
   * thì tiền và số `#` của trang 2 trở đi sẽ lệch — xem khối chú thích đầu file.
   */
  const dongCoViTri = useMemo(() => dong.map((d, viTri) => ({ d, viTri })), [dong]);

  /** Từ khóa đã bỏ dấu, hạ chữ thường — `""` nghĩa là không lọc gì. */
  const tuTim = boDau(tuKhoaTim).trim().toLowerCase();

  const dongLoc = useMemo(() => {
    if (tuTim === "") return dongCoViTri;
    /* Tìm trên đúng những ô người dùng NHÌN THẤY trên bảng. Không tìm theo số tiền: số tiền do
       `tinhTienChiTiet` tính ra và định dạng lại theo tiếng Việt, gõ "1.000" hay "1000" ra hai
       kết quả khác nhau — một ô tìm lúc trúng lúc không còn tệ hơn không có. */
    return dongCoViTri.filter(({ d }) =>
      [d.maHang, d.tenHang, d.thongSo, d.dvt, d.truongMoRong1, d.mucDich].some((v) =>
        boDau(v).toLowerCase().includes(tuTim),
      ),
    );
  }, [dongCoViTri, tuTim]);

  /* Trang hiện tại LUÔN được kẹp lại theo số trang thật, thay vì sửa `trang` bằng một hiệu ứng:
     xóa bớt dòng khi đang ở trang cuối sẽ làm số trang giảm, mà hiệu ứng chạy SAU khi vẽ nên sẽ
     có một nhịp bảng trống trơn. Kẹp ngay lúc tính thì không bao giờ có nhịp đó. */
  const soTrang = Math.max(1, Math.ceil(dongLoc.length / soDongTrang));
  const trangHienTai = Math.min(Math.max(1, trang), soTrang);
  const batDau = (trangHienTai - 1) * soDongTrang;
  const dongTrang = dongLoc.slice(batDau, batDau + soDongTrang);

  /**
   * ⚠️ THÊM DÒNG PHẢI THẤY ĐƯỢC NGAY. Dòng mới luôn nối vào CUỐI mảng `dong`, nên nếu đang lọc
   * hoặc đang đứng ở trang 1 của một bảng dài thì bấm [Thêm dòng] / F9 / đổ Excel xong **không
   * thấy gì hiện ra** — người dùng bấm tiếp mấy lần rồi sinh ra một loạt dòng trắng.
   *
   * Vì vậy hễ số dòng TĂNG thì xóa bộ lọc và nhảy tới trang cuối. Giảm thì không làm gì (đã có
   * phép kẹp `trangHienTai` lo).
   */
  const soDongTruoc = useRef(dong.length);
  useEffect(() => {
    if (dong.length > soDongTruoc.current) {
      setTuKhoaTim("");
      setTrang(Math.max(1, Math.ceil(dong.length / soDongTrang)));
    }
    soDongTruoc.current = dong.length;
  }, [dong.length, soDongTrang]);

  /**
   * PHÍM F3 — "Tìm nhanh" của MISA, đưa con trỏ vào ô tìm của bảng.
   *
   * 🔴 `preventDefault` là BẮT BUỘC: F3 là phím mở hộp tìm kiếm của chính trình duyệt. Không
   * chặn thì bấm F3 mở cả hai thứ một lúc, và hộp của trình duyệt chiếm luôn bàn phím.
   */
  useEffect(() => {
    if (!batPhimTat) return;
    function bamPhim(e: KeyboardEvent) {
      if (e.key !== "F3") return;
      e.preventDefault();
      oTim.current?.focus();
      oTim.current?.select();
    }
    window.addEventListener("keydown", bamPhim);
    return () => window.removeEventListener("keydown", bamPhim);
  }, [batPhimTat]);

  return (
    /* `min-w-0` ở ngay khối ngoài cùng: khối này là con của một khung flex, mà con flex mặc
       định không chịu co nhỏ hơn nội dung — bảng rộng sẽ đẩy giãn cả thẻ thay vì cuộn bên trong. */
    <section className="flex min-w-0 flex-col gap-(--hp-md-card-gap)">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {tieuDeTrongKhoiGiaiDoan ? (
          <NhanPhanTrongGiaiDoan the="h2" icon={Coins}>
            Hàng tiền
          </NhanPhanTrongGiaiDoan>
        ) : (
          <h2 className="text-h3 text-text-primary">Hàng tiền</h2>
        )}

        <div className="flex flex-wrap items-center gap-3">
        {/* ===== Ô TÌM NHANH (F3) — thành phần THẬT, không phải chỗ trống =====
            🔴 Không có ô này thì dòng chữ "F3 - Tìm nhanh" ở cuối form là lời hứa suông. Ô lọc
            trên đúng các cột đang hiện; dòng TỔNG CỘNG vẫn là tổng của cả đơn (có câu nói rõ
            ngay dưới bảng khi đang lọc).
            📌 Nhãn dùng `aria-label` chứ KHÔNG dùng `sr-only` — `sr-only` là `position:absolute`,
            đặt gần khung cuộn ngang là mầm lỗi trôi ngang cả trang (bài học bảng Kanban). */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-desc"
            aria-hidden
          />
          <Input
            ref={oTim}
            value={tuKhoaTim}
            onChange={(e) => {
              setTuKhoaTim(e.target.value);
              // Đổi từ khóa thì về trang 1: giữ nguyên trang 5 rồi lọc còn 3 dòng là bảng trống.
              setTrang(1);
            }}
            placeholder={batPhimTat ? "Tìm nhanh trong bảng (F3)" : "Tìm nhanh trong bảng"}
            aria-label="Tìm nhanh trong bảng Hàng tiền"
            className="w-56 pl-9"
          />
        </div>

        {/* ===== Ô CHỌN CHIẾT KHẤU — MISA đặt ở góc phải bảng, giữ nguyên chỗ =====
            🔴 Chỉ hiện với người xem được giá: chiết khấu là điều kiện thương mại. */}
        {xemGia && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-text-secondary">Chiết khấu</span>
            <Select
              value={kieuChietKhau}
              /* base-ui trả `string | null` (null = bỏ chọn). Không có nhánh "bỏ chọn" ở đây
                 nên quy về "không chiết khấu" — để `null` lọt xuống là kiểu chiết khấu thành
                 rỗng và `tienChietKhau` đọc ra một thứ không phải ba giá trị đã định. */
              onValueChange={(v) => onDoiKieuChietKhau((v ?? "khong") as KieuChietKhau)}
            >
              <SelectTrigger className="min-w-44" aria-label="Cách tính chiết khấu">
                <SelectValue>
                  {(v) =>
                    v === "ty_le"
                      ? "Theo tỷ lệ %"
                      : v === "so_tien"
                        ? "Theo số tiền"
                        : "Không chiết khấu"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="khong">Không chiết khấu</SelectItem>
                <SelectItem value="ty_le">Theo tỷ lệ %</SelectItem>
                <SelectItem value="so_tien">Theo số tiền</SelectItem>
              </SelectContent>
            </Select>

            {/* Ô nhập chỉ hiện đúng kiểu đang chọn — bày cả hai ô là mời người dùng điền cả
                hai rồi tự hỏi cái nào có tác dụng. */}
            {kieuChietKhau === "ty_le" && (
              <Input
                type="number"
                min={0}
                max={100}
                value={tyLeChietKhau}
                onChange={(e) => onDoiTyLeChietKhau(e.target.value)}
                className="w-24"
                aria-label="Tỷ lệ chiết khấu (%)"
                placeholder="%"
              />
            )}
            {kieuChietKhau === "so_tien" && (
              <Input
                type="number"
                min={0}
                value={chietKhau}
                onChange={(e) => onDoiChietKhau(e.target.value)}
                className="w-36"
                aria-label="Số tiền chiết khấu (₫)"
                placeholder="0 ₫"
              />
            )}
          </div>
        )}
        </div>
      </div>

      {/* 🔴 `min-w-0` BẮT BUỘC. Con của flex mặc định `min-width:auto` nên bảng rộng sẽ đẩy
          giãn cả cột cha thay vì cuộn bên trong — điện thoại trôi ngang cả trang. `Table` đã
          tự bọc một lớp `overflow-x-auto`, nhưng lớp đó chỉ có tác dụng khi cha chịu co lại. */}
      <div className="min-w-0">
        <Table>
          <TableHeader>
            {/* 🔴 NỀN Ở HÀNG TIÊU ĐỀ — MISA tô nền hàng này, app tô theo, nhưng bằng TOKEN CỦA
                CÔNG TY chứ không lấy tông xanh ngọc của MISA (Ban lãnh đạo 16/08/2026: *"Về màu
                sắc thì vẫn theo design system"*). `bg-primary-bg` =
                `color-mix(--hp-primary 12%, transparent)` ở Sáng và `20%` ở Tối, mà
                `--hp-primary` = #096AA7 → ra xanh DƯƠNG nhạt, đúng V1.1. Dùng độ mờ của chính
                token primary nên tự đúng ở cả hai chế độ sáng/tối, không phải khai hai màu.

                ⚠️ PHẢI GHI CẢ `hover:bg-primary-bg`. Lớp gốc của `TableRow` có
                `hover:bg-muted/50`; tailwind-merge chỉ bỏ được lớp CÙNG biến thể, nên nếu không
                khai lại thì rê chuột lên hàng tiêu đề là nền nhảy sang xám.

                📌 Sửa tại ĐÂY, không sửa `nen-tang-ui/table.tsx`: thư mục đó là thư viện nền
                tảng dùng chung (quy tắc 3.4b — KHÔNG SỬA), và chỉ riêng bảng Hàng tiền cần nền
                này, các bảng khác của app giữ nguyên. */}
            <TableRow className="bg-primary-bg hover:bg-primary-bg">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Mã hàng</TableHead>
              <TableHead>Tên hàng</TableHead>
              <TableHead>Thông số kỹ thuật</TableHead>
              <TableHead>ĐVT</TableHead>
              <TableHead className="text-right">Số lượng</TableHead>
              {xemGia && (
                <>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                  {/* MISA để tiêu đề này XUỐNG 2 DÒNG. `TableHead` gốc có `whitespace-nowrap`
                      nên phải khai `whitespace-normal` kèm bề rộng, không thì chữ vẫn một dòng. */}
                  <TableHead className="w-20 text-right whitespace-normal">% Thuế GTGT</TableHead>
                  <TableHead className="text-right">Tiền thuế GTGT</TableHead>
                </>
              )}
              {/* "Trường mở rộng 1" của MISA cũng xuống 2 dòng. */}
              <TableHead className="w-28 whitespace-normal">Trường mở rộng 1</TableHead>
              <TableHead>Mục đích sử dụng</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {dong.length === 0 && (
              <TableRow>
                <TableCell colSpan={soCotCaBang} className="h-16 text-center text-text-desc">
                  Chưa có dòng nào. Bấm <strong>Thêm dòng</strong>{" "}
                  {nhapTuDo ? "để nhập một mặt hàng" : "để chọn mặt hàng của đề nghị"}, hoặc nhập
                  từ file Excel.
                </TableCell>
              </TableRow>
            )}

            {/* Bảng có dòng nhưng bộ lọc không khớp gì — phải nói ra và cho đường quay lại, đừng
                để một bảng trống làm người dùng tưởng mất hết dữ liệu vừa nhập. */}
            {dong.length > 0 && dongLoc.length === 0 && (
              <TableRow>
                <TableCell colSpan={soCotCaBang} className="h-16 text-center text-text-desc">
                  Không có dòng nào khớp “<strong>{tuKhoaTim}</strong>”. Bảng vẫn còn đủ{" "}
                  <strong>{dong.length} dòng</strong> —{" "}
                  <button
                    type="button"
                    onClick={() => setTuKhoaTim("")}
                    className="font-medium text-primary hover:underline"
                  >
                    bỏ tìm nhanh
                  </button>{" "}
                  để xem lại hết.
                </TableCell>
              </TableRow>
            )}

            {/* 🔴 LẶP TRÊN `dongTrang` (mảng cặp), và `viTri` là CHỈ SỐ THẬT trong `dong` — không
                phải chỉ số trong trang. Đây là chốt giữ cho tiền và cột `#` không lệch khi sang
                trang 2 hoặc khi đang lọc. Xem khối chú thích đầu file. */}
            {dongTrang.map(({ d, viTri }) => {
              const t = tienCuaDong(viTri);
              /* `undefined` = dòng của đơn không gắn đề nghị → không có "phần còn lại" nào để
                 nhắc, và cũng không cảnh báo vượt. Tra bằng `?? -1` cho tường minh: `conLai`
                 chỉ có khóa là số thứ tự thật (≥ 1) nên `-1` chắc chắn không trúng. */
              const con = conLai[d.sttDeNghi ?? -1];

              /* ===== DÒNG GHI CHÚ =====
                 Nút "Thêm ghi chú" của MISA chèn một DÒNG vào giữa bảng chứ không mở ô ghi chú
                 riêng bên ngoài — dùng để tách nhóm vật tư hoặc dặn nhà cung cấp ngay tại chỗ.
                 Dòng này không có khối lượng, không có tiền, và mọi hàm tính đã loại nó ra
                 (`laDongHang` ở `2-quy-trinh/tinh-toan.ts`). */
              if (d.laGhiChu) {
                return (
                  <TableRow key={d.id} className="bg-muted/40">
                    <TableCell className="text-center text-text-desc">{viTri + 1}</TableCell>
                    <TableCell colSpan={soCotGiua}>
                      <div className="flex items-center gap-2">
                        {/* Trạng thái có CẢ màu lẫn chữ — biểu tượng ghi chú kèm chữ "Ghi chú",
                            không chỉ dựa vào nền xám để phân biệt với dòng hàng. */}
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-neutral-bg px-2 py-0.5 text-xs font-medium text-neutral-soft">
                          <StickyNote className="size-3.5" aria-hidden />
                          Ghi chú
                        </span>
                        <Input
                          value={d.tenHang}
                          onChange={(e) => onDoiDong(d.id, { tenHang: e.target.value })}
                          placeholder="Nội dung ghi chú in kèm trên đơn gửi nhà cung cấp…"
                          className="min-w-64 flex-1"
                          aria-label={`Nội dung ghi chú dòng ${viTri + 1}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <NutXoaDong nhan={`ghi chú dòng ${viTri + 1}`} onXoa={() => onXoaDong(d.id)} />
                    </TableCell>
                  </TableRow>
                );
              }

              /* ===== DÒNG HÀNG ===== */
              const soLuongNhap = Number(d.soLuong);
              const vuot = con !== undefined && soLuongNhap > con.conLai;

              /* 🔴 DÒNG GÕ TỰ DO CHƯA ĐỦ Ô THÌ APP TÍNH TIỀN BẰNG 0 — PHẢI NÓI RA TẠI DÒNG ĐÓ.
                 (Lỗi thật, phát hiện 18/08/2026 khi soi lại chế độ "chỉ tạo mẫu".)

                 LỖI ĐÃ XẢY RA: người lập gõ Tên hàng "Xi măng PCB40", Số lượng 5, Đơn giá 2.000
                 nhưng bỏ trống ĐVT. Trên màn hình hai ô số vẫn hiện đúng 5 và 2.000, nhưng cột
                 "Thành tiền" ra **0**, dòng TỔNG CỘNG ra **0**, và "Tổng tiền thanh toán" cỡ lớn
                 ở đầu form cũng **0 ₫** — KHÔNG một chữ nào giải thích. Đo trên trình duyệt:
                 ô Số lượng = "5", ô Đơn giá = "2000", cột Thành tiền = "0", TỔNG CỘNG = "0".
                 Dòng đó còn bị BỎ HẲN khỏi tờ PO in ra và khỏi file Excel gửi nhà cung cấp
                 (`2-quy-trinh/don-hang-mau.ts` → `dungDonHangMau` lọc bằng `dongTuDoDuVaoDon`).

                 Trước đây chỉ có câu chung "Cần … ít nhất một dòng hàng có đủ tên hàng, ĐVT và
                 số lượng" ở cạnh nút — câu đó KHÔNG chỉ ra dòng nào, ô nào, mà bảng có thể dài
                 hơn hai mươi dòng và trải nhiều trang. Người lập thấy số 0 mà không hiểu vì sao,
                 đúng kiểu "giao diện hứa một việc app không làm" mà quy ước dự án cấm.

                 🔴 DÙNG LẠI `dongTuDoDuVaoDon`, KHÔNG chép tay điều kiện. Đó là cùng một luật mà
                 `hopLe`, khối tính tiền và `dungDonHangMau` đang dùng; chép tay bản thứ tư là sớm
                 muộn bảng cảnh báo một dòng mà chứng từ lại nhận nó (hoặc ngược lại).

                 📌 CHỈ NHẮC KHI NGƯỜI LẬP ĐÃ GÕ SỐ MÀ APP ĐANG BỎ QUA (`Số lượng` hoặc `Đơn giá`
                 > 0). Dòng vừa bấm [Thêm dòng] còn trắng trơn thì cũng "chưa đủ", nhưng gắn cảnh
                 báo lên nó là mỗi lần thêm dòng lại hiện một dòng chữ vàng — nhắc mọi lúc thì
                 chẳng còn ai đọc. */
              const thieuOBatBuoc =
                nhapTuDo && !dongTuDoDuVaoDon(d)
                  ? [
                      d.tenHang.trim() === "" ? "tên hàng" : null,
                      d.dvt.trim() === "" ? "ĐVT" : null,
                      !(soLuongNhap > 0) ? "số lượng" : null,
                    ].filter((v): v is string => v !== null)
                  : [];
              const boQuaSoDaGo =
                thieuOBatBuoc.length > 0 && (soLuongNhap > 0 || Number(d.donGia) > 0);

              return (
                <TableRow key={d.id}>
                  <TableCell className="text-center text-text-desc">{viTri + 1}</TableCell>

                  <TableCell>
                    <Input
                      value={d.maHang}
                      onChange={(e) => onDoiDong(d.id, { maHang: e.target.value })}
                      placeholder="VT00027"
                      className="w-28"
                      aria-label={`Mã hàng dòng ${viTri + 1}`}
                    />
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Input
                        value={d.tenHang}
                        onChange={(e) => onDoiDong(d.id, { tenHang: e.target.value })}
                        className="w-56"
                        aria-label={`Tên hàng dòng ${viTri + 1}`}
                      />
                      {/* 🔴 PHẢI NÓI DÒNG NÀY TRỪ KHỐI LƯỢNG VÀO ĐÂU. Tên trên đơn sửa được
                          (chỉ đạo 10/08/2026: đơn là nguồn sự thật), nên nếu không ghi rõ nó
                          nối về dòng nào của đề nghị thì người lập sửa tên xong không còn biết
                          khối lượng đang trừ vào đâu. */}
                      {con && (
                        <span className="text-xs text-text-desc">
                          Đề nghị dòng {d.sttDeNghi} · còn {con.conLai.toLocaleString("vi-VN")}{" "}
                          {con.donViTinh}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Input
                      value={d.thongSo}
                      onChange={(e) => onDoiDong(d.id, { thongSo: e.target.value })}
                      placeholder="Mác, tiêu chuẩn, quy cách"
                      className="w-48"
                      aria-label={`Thông số kỹ thuật dòng ${viTri + 1}`}
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      value={d.dvt}
                      onChange={(e) => onDoiDong(d.id, { dvt: e.target.value })}
                      className="w-20"
                      aria-label={`Đơn vị tính dòng ${viTri + 1}`}
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={con?.conLai}
                        value={d.soLuong}
                        onChange={(e) => onDoiDong(d.id, { soLuong: e.target.value })}
                        className="w-28 text-right"
                        aria-label={`Số lượng dòng ${viTri + 1}`}
                      />
                      {/* Cảnh báo vượt: CẢ màu lẫn chữ, và nói luôn hệ quả để người lập tự
                          quyết sửa file hay sửa số — không tự cắt số rồi im lặng. */}
                      {vuot && (
                        <span className="text-xs text-danger-soft">
                          Vượt phần còn lại — sẽ cắt về {con.conLai.toLocaleString("vi-VN")}
                        </span>
                      )}
                      {/* 🔴 NÓI RÕ SỐ VỪA GÕ ĐANG KHÔNG ĐƯỢC TÍNH, VÀ THIẾU Ô NÀO.
                          Nhắc CẢ màu lẫn chữ (V1.1 — trạng thái không được chỉ dựa vào màu), và
                          nói luôn hệ quả "không in ra đơn" để người lập biết đây không phải lỗi
                          hiển thị mà là dòng sẽ mất khỏi chứng từ gửi nhà cung cấp.
                          ⚠️ Không bao giờ hiện cùng lúc với cảnh báo "Vượt phần còn lại": cảnh báo
                          kia chỉ có ở dòng nối về một dòng đề nghị, dòng đó không gõ tự do. */}
                      {boQuaSoDaGo && (
                        <span className="text-xs text-warning-soft">
                          Chưa tính vào đơn và không in ra — còn thiếu{" "}
                          {thieuOBatBuoc.join(", ")}.
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {xemGia && (
                    <>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          value={d.donGia}
                          onChange={(e) => onDoiDong(d.id, { donGia: e.target.value })}
                          className="w-32 text-right"
                          placeholder="0"
                          aria-label={`Đơn giá dòng ${viTri + 1}`}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium text-text-primary tabular-nums">
                        {(t?.thanhTien ?? 0).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={d.thueSuat}
                          onChange={(e) => onDoiDong(d.id, { thueSuat: e.target.value })}
                          /* Bỏ trống là dùng thuế suất chung của đơn — hầu hết đơn chỉ một
                             mức thuế nên đây mới là cách dùng thường ngày. */
                          placeholder={String(tien.thueSuatGTGT)}
                          className="w-24 text-right"
                          aria-label={`Phần trăm thuế GTGT dòng ${viTri + 1}`}
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-text-secondary">
                        {(t?.tienThueGTGT ?? 0).toLocaleString("vi-VN")}
                      </TableCell>
                    </>
                  )}

                  <TableCell>
                    <Input
                      value={d.truongMoRong1}
                      onChange={(e) => onDoiDong(d.id, { truongMoRong1: e.target.value })}
                      className="w-40"
                      aria-label={`Trường mở rộng 1 dòng ${viTri + 1}`}
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      value={d.mucDich}
                      onChange={(e) => onDoiDong(d.id, { mucDich: e.target.value })}
                      placeholder="Hạng mục nào của công trình"
                      className="w-48"
                      aria-label={`Mục đích sử dụng dòng ${viTri + 1}`}
                    />
                  </TableCell>

                  <TableCell>
                    <NutXoaDong
                      nhan={`${d.tenHang || `dòng ${viTri + 1}`}`}
                      onXoa={() => onXoaDong(d.id)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>

          {/* ===== DÒNG TỔNG CỘNG =====
              🔴 Cộng Số lượng / Thành tiền / Tiền thuế GTGT đúng như MISA. Con số lấy thẳng từ
              `tien`, KHÔNG cộng lại ở đây: `tinhTienChiTiet` đã chia phần thuế về từng dòng
              bằng `chiaTheoTyLe` để cộng cột luôn khớp dòng này. Tự cộng ở giao diện là mở
              đường cho hai kết quả lệch nhau vài đồng. */}
          {dong.length > 0 && (
            <TableFooter>
              <TableRow className="bg-muted">
                <TableCell colSpan={5} className="font-bold text-text-primary">
                  TỔNG CỘNG
                </TableCell>
                <TableCell className="text-right font-bold tabular-nums text-text-primary">
                  {tien.dong
                    .reduce((s, x) => s + x.soLuong, 0)
                    .toLocaleString("vi-VN")}
                </TableCell>
                {xemGia && (
                  <>
                    <TableCell />
                    <TableCell className="text-right font-bold tabular-nums text-text-primary">
                      {tien.congTienHang.toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-right font-bold tabular-nums text-text-primary">
                      {tien.tienThueGTGT.toLocaleString("vi-VN")}
                    </TableCell>
                  </>
                )}
                <TableCell colSpan={3} />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* ===================================================================
          DƯỚI BẢNG — bám đúng bố cục MISA:
            hàng 1: "Tổng số: N bản ghi" bên TRÁI · ô chọn số bản ghi/trang + Trước · N · Sau
                    bên PHẢI
            hàng 2: [Thêm dòng] [Thêm ghi chú] [Xóa hết dòng] bên TRÁI
          (Trước 18/08/2026 ba nút này nằm bên phải cùng dòng với "Tổng số".)
          =================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          Tổng số: <strong className="text-text-primary">{dong.length} bản ghi</strong>
        </p>

        {/* ===== PHÂN TRANG THẬT — chạy được, không phải bộ phân trang trang trí =====
            🔴 Ba nút/ô ở đây đều làm việc thật: đổi số bản ghi/trang thì bảng cắt lại ngay,
            Trước/Sau đổi trang thật, và số trang hiện đúng. Khi cả bảng chỉ vừa MỘT trang thì
            Trước/Sau mờ đi — đó là trạng thái ĐÚNG của một bộ phân trang thật, không phải nút
            chết. */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <select
              value={soDongTrang}
              onChange={(e) => {
                setSoDongTrang(Number(e.target.value));
                // Đổi cỡ trang thì về trang 1 — giữ số trang cũ là nhảy tới một chỗ vô nghĩa.
                setTrang(1);
              }}
              aria-label="Số bản ghi trên một trang"
              className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none"
            >
              {[20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} bản ghi trên 1 trang
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => setTrang(trangHienTai - 1)}
              disabled={trangHienTai <= 1}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Trước
            </Button>
            {/* Số trang hiện tại — MISA chỉ hiện một con số giữa hai nút. Ghi thêm "/ N" để
                người dùng biết còn bao nhiêu trang nữa, thông tin có thật. */}
            <span className="min-w-14 text-center text-sm tabular-nums text-text-primary">
              {trangHienTai}
              <span className="text-text-desc"> / {soTrang}</span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => setTrang(trangHienTai + 1)}
              disabled={trangHienTai >= soTrang}
            >
              Sau
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>

      {/* 🔴 NÓI RÕ DÒNG TỔNG CỘNG KHÔNG THEO TRANG / KHÔNG THEO BỘ LỌC.
          Cắt trang mà để người đọc tự đoán phạm vi của dòng TỔNG CỘNG là mời họ hiểu sai một con
          số tiền trên chứng từ. Tổng của đơn LUÔN là tổng của cả bảng — đó mới là con số đem đi
          ký duyệt và in ra. */}
      {(tuTim !== "" || soTrang > 1) && (
        <p className="text-xs text-text-desc">
          {tuTim !== "" && (
            <>
              Đang tìm nhanh: hiện <strong>{dongLoc.length}</strong> trong{" "}
              <strong>{dong.length}</strong> dòng.{" "}
            </>
          )}
          {soTrang > 1 && (
            <>
              Đang xem trang {trangHienTai}/{soTrang}.{" "}
            </>
          )}
          Dòng <strong>TỔNG CỘNG</strong> và số tiền của đơn vẫn tính trên toàn bộ{" "}
          {dong.length} dòng.
        </p>
      )}

      {/* Ba nút thao tác — MISA đặt bên TRÁI, dưới phân trang. */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={onThemDong}
          disabled={!conMatHangDeThem}
        >
          <Plus className="size-4" aria-hidden />
          Thêm dòng
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={onThemGhiChu}>
          <StickyNote className="size-4" aria-hidden />
          Thêm ghi chú
        </Button>
        {/* 🔴 "Xóa hết dòng" HỎI LẠI trước khi làm — việc hỏi do trang lập đơn lo qua
            `HopXacNhan`. Bấm nhầm nút này là mất sạch công nhập liệu, không có nút hoàn lại. */}
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={onXoaHetDong}
          disabled={dong.length === 0}
        >
          <Trash2 className="size-4" aria-hidden />
          Xóa hết dòng
        </Button>
      </div>

      {/* Câu này chỉ đúng khi đơn CÓ đề nghị — đơn độc lập thêm bao nhiêu dòng cũng được nên
          không bao giờ "hết mặt hàng". */}
      {!nhapTuDo && !conMatHangDeThem && dong.length > 0 && (
        <p className="text-xs text-text-desc">
          Đã đưa hết mặt hàng lập được đơn của đề nghị này vào bảng.
        </p>
      )}
    </section>
  );
}

/**
 * Nút xóa một dòng — vùng chạm 44×44 theo Design System V1.1.
 *
 * ⚠️ KHÔNG dùng lớp `sr-only` cho nhãn ở đây. `sr-only` là `position:absolute`; đặt nó trong
 * khung cuộn ngang của bảng thì nó bám vào khung chứa gốc, thoát khỏi `overflow-x-hidden` của
 * vùng nội dung và kéo giãn cả trang (đã dính khi làm bảng Kanban). Dùng `aria-label` là đủ.
 */
function NutXoaDong({ nhan, onXoa }: { nhan: string; onXoa: () => void }) {
  return (
    <button
      type="button"
      onClick={onXoa}
      className="flex size-11 items-center justify-center rounded-lg text-text-desc transition-colors hover:bg-danger-bg hover:text-danger"
      aria-label={`Xóa ${nhan}`}
      title="Xóa dòng"
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  );
}
