"use client";

import { Coins, Plus, StickyNote, Trash2 } from "lucide-react";
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
import type { KetQuaTienDonHang } from "@/2-quy-trinh/tinh-toan";
import type { KieuChietKhau } from "@/3-du-lieu/kieu-du-lieu";

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
   * duyệt. Chỉ module "Lập đơn mua hàng (PO)" độc lập mới được gõ tự do, và chính vì thế nó
   * ĐI VÒNG QUA chốt kiểm soát đó (Ban lãnh đạo 18/08/2026 đã được báo và vẫn quyết làm).
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
}) {
  /**
   * Số cột của phần giữa (từ "Mã hàng" đến "Mục đích sử dụng") — dòng ghi chú gộp hết phần
   * này thành một ô chữ, đúng cách MISA vẽ dòng ghi chú.
   */
  const soCotGiua = 7 + (xemGia ? 4 : 0);

  /** Tra kết quả tiền của một dòng. `sttDong` chính là CHỈ SỐ dòng trong `dong` — xem trang lập đơn. */
  const tienCuaDong = (viTri: number) => tien.dong.find((t) => t.sttDong === viTri);

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

      {/* 🔴 `min-w-0` BẮT BUỘC. Con của flex mặc định `min-width:auto` nên bảng rộng sẽ đẩy
          giãn cả cột cha thay vì cuộn bên trong — điện thoại trôi ngang cả trang. `Table` đã
          tự bọc một lớp `overflow-x-auto`, nhưng lớp đó chỉ có tác dụng khi cha chịu co lại. */}
      <div className="min-w-0">
        <Table>
          <TableHeader>
            <TableRow>
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
                  <TableHead className="text-right">% Thuế GTGT</TableHead>
                  <TableHead className="text-right">Tiền thuế GTGT</TableHead>
                </>
              )}
              <TableHead>Trường mở rộng 1</TableHead>
              <TableHead>Mục đích sử dụng</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {dong.length === 0 && (
              <TableRow>
                <TableCell colSpan={soCotGiua + 2} className="h-16 text-center text-text-desc">
                  Chưa có dòng nào. Bấm <strong>Thêm dòng</strong>{" "}
                  {nhapTuDo ? "để nhập một mặt hàng" : "để chọn mặt hàng của đề nghị"}, hoặc nhập
                  từ file Excel.
                </TableCell>
              </TableRow>
            )}

            {dong.map((d, viTri) => {
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* 📌 MISA có "Tổng số: N bản ghi" + ô chọn "20 bản ghi trên 1 trang" + phân trang.
            ĐÃ BỎ PHẦN PHÂN TRANG (xem README thư mục): một đơn mua hàng thực tế chỉ vài chục
            dòng, và app chưa có bộ phân trang cho bảng sửa tại chỗ. Dựng một bộ phân trang
            giả không chạy còn tệ hơn không có. Con số tổng thì giữ vì nó có thật. */}
        <p className="text-sm text-text-secondary">
          Tổng số: <strong className="text-text-primary">{dong.length} bản ghi</strong>
        </p>

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
