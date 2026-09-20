"use client";

// ============================================================
// BẢNG HOÁ ĐƠN VAT — từng tờ một, nằm trong mục ⑥ của Bộ hồ sơ thanh toán.
//
// ★★ Sếp 19/09/2026 (ảnh chụp trang chi tiết đề nghị, khoanh đỏ mục ⑥): ***"Thêm các trường nhập
// liệu: 1. STT · 2. Số hoá đơn · 3. Ngày hoá đơn · 4. Số tiền trên hoá đơn · 5. Đính kèm"***.
//
// 🔴 VÌ SAO CẦN — ĐÂY LÀ LỚP TIỀN CỦA TỪNG LẦN GIAO. Bài toán Sếp đặt cùng ngày: *"đơn hàng khối
// lượng lớn như cát, đá, xi măng không thể giao trong 1 lần… mỗi lần giao nhỏ đó sẽ có hoá đơn
// thanh toán của đợt đó"*. Trước hôm nay app chỉ có MỘT ô số hoá đơn cho cả đơn, nên từ đợt thứ
// hai trở đi không còn chỗ ghi.
//
// 🔴 BẢNG NÀY LÀ NGUỒN DUY NHẤT của số hoá đơn và tiền hoá đơn — Sếp chốt 19/09/2026 khi được hỏi
// lại. Hai ô cùng tên bên màn Công nợ từ nay **tự cộng** từ đây và không gõ tay nữa (xem
// `tongTienHoaDonCuaDon` / `chuoiSoHoaDonCuaDon` ở `2-quy-trinh/tuoi-no.ts`). Để hai nơi cùng gõ
// tay thì cột "Còn phải trả" lấy theo số nào không ai biết, mà lệch thì không có gì báo.
//
// 🔴 KHỐI NÀY CHỈ VẼ. Mọi luật (ai được ghi, số tiền hợp lệ chưa, cộng dồn thế nào) nằm ở
// `3-du-lieu/kho-du-lieu.tsx` và `2-quy-trinh/tuoi-no.ts` — quy ước 3.4b cấm để hàm tính nghiệp
// vụ trong tệp giao diện. Ở đây chỉ gọi và hiện lại câu lý do khi bị chặn.
// ============================================================

import { useState } from "react";
import { toast } from "sonner";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { OChonNgay } from "@/1-giao-dien/thanh-phan-dung-chung/o-chon-ngay";
import { ODinhKemTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { formatCurrencyVnd, formatDate, homNayISO } from "@/6-tien-ich/dinh-dang";
import type { DongHoaDonVAT, MoTaTep } from "@/3-du-lieu/kieu-du-lieu";

export function BangHoaDonVAT({
  poId,
  poCode,
  dong,
  soDotGiao,
  ghiDuoc,
  xemGia,
  nguoiGhi,
  tepDaDinh,
  onThem,
  onXoa,
  onDinhTep,
  onGoTep,
}: {
  poId: string;
  poCode: string;
  dong: readonly DongHoaDonVAT[];
  /** Số lần giao của đơn — chỉ dùng để NHẮC, không dùng để chặn (xem chú thích dưới). */
  soDotGiao: number;
  ghiDuoc: boolean;
  /** Không được xem giá thì ẩn cột tiền, vẫn thấy số hoá đơn + ngày + tệp. */
  xemGia: boolean;
  /** Người đang thao tác — `ODinhKemTep` ghi lại ai đính kèm. */
  nguoiGhi: { uid: string; ten: string };
  /**
   * ★ TOÀN BỘ tệp hoá đơn đang có trong hồ sơ. Mỗi dòng tự tra tệp của mình theo `nhanTep`.
   *
   * 🔴 NHẬN TỪ NƠI GỌI, không tự đọc — khối này là thành phần thuần hiển thị, kéo `useDuLieu` vào
   * đây là nó không dùng lại được ở trang in và các nơi chỉ bày.
   */
  tepDaDinh: readonly MoTaTep[];
  onThem: (d: { soHoaDon: string; ngayHoaDon: string; soTien: number }) => string | null;
  onXoa: (id: string) => string | null;
  /** Đính bản chụp cho ĐÚNG tờ hoá đơn này. Trả câu lý do khi bị chặn, `null` là xong. */
  onDinhTep: (idDong: string, tep: MoTaTep) => string | null;
  /** Gỡ bản chụp khỏi tờ hoá đơn này (tệp vẫn nằm trong kho, chỉ rời khỏi hồ sơ). */
  onGoTep: (idDong: string) => string | null;
}) {
  const [dangThem, setDangThem] = useState(false);
  const [soHoaDon, setSoHoaDon] = useState("");
  const [ngayHoaDon, setNgayHoaDon] = useState<string>(homNayISO());
  const [soTien, setSoTien] = useState("");
  const [hoiXoa, setHoiXoa] = useState<string | null>(null);

  /* 📌 SẮP THEO NGÀY rồi mới đánh STT. STT là số thứ tự HIỂN THỊ, cố ý không lưu vào dữ liệu —
     lưu lại là sớm muộn có hai dòng cùng STT 3 sau một lần xoá, hoặc STT nhảy cóc 1-2-4. */
  const dsSapXep = [...dong].sort(
    (a, b) => String(a.ngayHoaDon).localeCompare(String(b.ngayHoaDon)) || a.id.localeCompare(b.id),
  );
  const tong = dsSapXep.reduce((s, d) => s + (Number(d.soTien) || 0), 0);

  function luu() {
    /* 🔴 BỎ DẤU PHÂN CÁCH TRƯỚC KHI ĐỔI SANG SỐ. Người dùng gõ tiền theo thói quen kế toán
       ("45.522.000"); `Number("45.522.000")` cho `NaN`, và nếu để lọt thì tầng ghi từ chối với
       câu "số tiền phải là số không âm" — người dùng đọc mà không hiểu vì sao, vì họ vừa gõ đúng
       số tiền thật. Cùng cách xử với khối Đợt thanh toán. */
    const tien = Number(soTien.replace(/[.,\s]/g, ""));
    const loi = onThem({ soHoaDon, ngayHoaDon, soTien: tien });
    if (loi) {
      toast.error(loi);
      return;
    }
    toast.success(`Đã ghi hoá đơn ${soHoaDon.trim()} cho đơn ${poCode}`);
    setDangThem(false);
    setSoHoaDon("");
    setSoTien("");
    setNgayHoaDon(homNayISO());
  }

  return (
    /**
      * 🔴 KHÔNG CÓ VIỀN VÀ NỀN RIÊNG — sửa 19/09/2026 sau khi Sếp xem bản thật.
      *
      * Bản đầu bọc khối này trong `rounded-lg border border-border bg-card p-3`. Mục ⑥ vốn đã là
      * một thẻ trắng có viền, nên thành **hộp lồng trong hộp**: trên màn hình nó trông như một
      * mục thứ 10 nằm tách hẳn ra, không dính gì tới Hoá đơn VAT. Sếp khoanh đỏ đúng mục ⑥ để
      * nói "các trường nhập liệu phải ở trong đây".
      *
      * 📌 `pl-7` là bậc thụt của RUỘT MỤC trong khối này (xem chú thích nhóm con ở
      * `khoi-bo-ho-so-thanh-toan.tsx`) — để bảng thẳng hàng với tên chứng từ và danh sách tệp
      * phía trên, thay vì bắt đầu từ mép trái nơi đặt số thứ tự.
      *
      * 📌 Đường kẻ mảnh phía trên chỉ để tách phần *nhập liệu* khỏi phần *đính kèm* — nhẹ hơn
      * một cái viền kín, đủ để mắt thấy là hai việc khác nhau mà vẫn cùng một mục.
      */
    <div className="flex flex-col gap-2 border-t border-border/60 pt-2 pl-7">
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="size-4 shrink-0 text-text-desc" aria-hidden />
        <span className="text-sm font-semibold text-text-primary">Hoá đơn của đơn {poCode}</span>
        <span className="text-xs text-text-desc">
          {dsSapXep.length === 0
            ? "chưa ghi tờ nào"
            : `${dsSapXep.length} tờ${xemGia ? ` · tổng ${formatCurrencyVnd(tong)}` : ""}`}
        </span>
      </div>

      {/**
        * 🔴 NHẮC, TUYỆT ĐỐI KHÔNG CHẶN — Sếp chốt 19/09/2026 khi được hỏi thẳng câu này.
        *
        * Nhà cung cấp thường xuất **gộp** cuối tháng. Ép mỗi đợt giao một hoá đơn thì đơn giao 3
        * lần mà NCC xuất 1 tờ sẽ **kẹt vĩnh viễn**, không có đường gỡ — và mọi hồ sơ đang mở bị
        * chặn đóng ngay hôm triển khai. Luật đóng hồ sơ giữ nguyên ở
        * `vuongMacDuyetHoanThanhDeNghi` (`2-quy-trinh/chung-tu-cuoi-quy-trinh.ts`): có ít nhất
        * một hoá đơn là đủ. Đừng "siết cho chặt" ở đây.
        */}
      {soDotGiao > 0 && dsSapXep.length > 0 && dsSapXep.length < soDotGiao && (
        <span className="text-xs text-warning-soft">
          Đã ghi {dsSapXep.length} hoá đơn cho {soDotGiao} đợt giao — kiểm lại xem nhà cung cấp đã
          xuất đủ chưa (hoặc họ xuất gộp một tờ cho nhiều đợt).
        </span>
      )}

      {dsSapXep.length > 0 && (
        <div className="flex flex-col gap-1">
          {dsSapXep.map((d, i) => (
            <div
              key={d.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-muted/40 px-2 py-1.5 text-sm"
            >
              <span className="w-5 shrink-0 tabular-nums text-xs text-text-desc">{i + 1}.</span>
              <span className="font-medium text-text-primary">{d.soHoaDon}</span>
              <span className="tabular-nums text-text-secondary">{formatDate(d.ngayHoaDon)}</span>
              {/* Ẩn CỘT TIỀN cho người không được xem giá — họ vẫn cần biết đã có hoá đơn nào. */}
              {xemGia && (
                <span className="font-semibold tabular-nums text-text-primary">
                  {formatCurrencyVnd(d.soTien)}
                </span>
              )}
              {/**
                * ★★ Ô ĐÍNH KÈM CỦA RIÊNG TỜ NÀY — Sếp 20/09/2026: *"tích hợp mục đính kèm hoá đơn
                * đó xuống mục dưới"*, và khi được hỏi lại thì chốt **mỗi tờ hoá đơn một tệp riêng**.
                *
                * 🔴 ĐẶT TRÊN DÒNG ĐÃ LƯU, TUYỆT ĐỐI KHÔNG ĐẶT TRONG FORM "ĐANG THÊM".
                * `ODinhKemTep` cất tệp vào kho **ngay khi chọn**, trước khi nơi gọi kịp lưu. Form
                * thêm có nút *Huỷ* — đặt ô ở đó thì bấm Huỷ là tệp đã nằm trong kho (và đã đẩy đủ
                * mảnh lên máy chủ) mà **không dòng nào trỏ tới**. Rác trên máy chủ, ăn hạn mức.
                *
                * 🔴 TRA TỆP THEO NHÃN, KHÔNG GIỮ BẢN SAO trong dòng — xem chú thích `nhanTep` ở
                * `3-du-lieu/kieu-du-lieu.ts`. Một tệp, một chỗ.
                */}
              {(() => {
                const tepCuaDong = d.nhanTep
                  ? tepDaDinh.find((t) => t.ghiChu === d.nhanTep)
                  : undefined;
                return (
                  <ODinhKemTep
                    tep={tepCuaDong}
                    nhanThem="Đính bản chụp"
                    nguoi={nguoiGhi}
                    khoa={!ghiDuoc}
                    dangGon
                    onXong={(t) => onDinhTep(d.id, t)}
                    onXoa={tepCuaDong ? () => onGoTep(d.id) : undefined}
                  />
                );
              })()}
              <span className="text-xs text-text-desc">· {d.nguoiGhiTen}</span>
              {ghiDuoc && (
                <button
                  type="button"
                  onClick={() => setHoiXoa(d.id)}
                  title="Xoá tờ hoá đơn này"
                  className="ml-auto inline-flex size-11 items-center justify-center rounded-lg text-text-desc transition-colors hover:bg-danger-bg hover:text-danger md:size-9"
                >
                  <Trash2 className="size-4" aria-hidden />
                  <span className="sr-only">Xoá hoá đơn {d.soHoaDon}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 🔴 HỎI TRƯỚC KHI XOÁ. Xoá một tờ hoá đơn là đổi số liệu công nợ của đơn — phải có một
          nhịp dừng, và nhật ký chứng từ giá vẫn ghi lại ai xoá (xem `xoaHoaDonVAT`). */}
      <HopXacNhan
        mo={hoiXoa !== null}
        onDong={() => setHoiXoa(null)}
        tieuDe="Xoá tờ hoá đơn này?"
        moTa="Tổng tiền theo hoá đơn của đơn sẽ giảm tương ứng, và cột Còn phải trả bên màn Công nợ đổi theo. Nhật ký vẫn ghi lại việc xoá."
        nhanDongY="Xoá hoá đơn"
        nguyHiem
        onDongY={() => {
          const id = hoiXoa;
          setHoiXoa(null);
          if (!id) return;
          const loi = onXoa(id);
          if (loi) toast.error(loi);
        }}
      />

      {ghiDuoc &&
        (dangThem ? (
          <div className="flex flex-wrap items-end gap-2 border-t border-border pt-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`so-hd-${poId}`}>Số hoá đơn</Label>
              <Input
                id={`so-hd-${poId}`}
                value={soHoaDon}
                onChange={(e) => setSoHoaDon(e.target.value)}
                placeholder="VD: 1C25TYY-0001234"
                className="w-48"
                onKeyDown={(e) => {
                  if (e.key === "Enter") luu();
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`ngay-hd-${poId}`}>Ngày hoá đơn</Label>
              <OChonNgay
                id={`ngay-hd-${poId}`}
                nhan="Ngày hoá đơn"
                giaTri={ngayHoaDon}
                onDoi={setNgayHoaDon}
                xoaDuoc={false}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`tien-hd-${poId}`}>Số tiền trên hoá đơn</Label>
              <Input
                id={`tien-hd-${poId}`}
                inputMode="numeric"
                value={soTien}
                onChange={(e) => setSoTien(e.target.value)}
                placeholder="VD: 45522000"
                className="w-44"
                onKeyDown={(e) => {
                  if (e.key === "Enter") luu();
                }}
              />
            </div>
            <Button onClick={luu}>Lưu hoá đơn</Button>
            <Button variant="ghost" onClick={() => setDangThem(false)}>
              Huỷ
            </Button>
            {/* 🔴 NÓI THẲNG CHỖ ĐÍNH TỆP, ĐỪNG ĐỂ NGƯỜI DÙNG ĐI TÌM. Ô nộp bản chụp hoá đơn nằm
                ngay dưới mục ⑥ (ô nộp chung của mục) — làm thêm một ô nữa ở đây là hai chỗ cùng
                nộp một tờ, đúng nếp dự án cấm. Khi nào cần buộc từng tệp vào đúng dòng hoá đơn
                thì mới thêm, và phải cấp ngăn đính kèm riêng vì trần hiện là 6 tệp chung cả
                Hoá đơn + UNC + Phiếu chi. */}
            <span className="basis-full text-xs text-text-desc">
              Lưu xong sẽ có nút đính bản chụp cho riêng tờ hoá đơn này.
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDangThem(true)}
            className="inline-flex min-h-11 w-fit items-center gap-1 rounded-lg px-2 text-xs font-medium text-primary underline-offset-2 transition-colors hover:bg-primary-bg md:min-h-9"
          >
            <Plus className="size-4 shrink-0" aria-hidden />
            Thêm hoá đơn
          </button>
        ))}

      {!ghiDuoc && dsSapXep.length === 0 && (
        /* Nói rõ vì sao không có nút, đừng để khối trống trơn — người đọc tưởng app hỏng. */
        <span className="text-xs text-text-desc">
          Chỉ người lập đơn mua hàng mới ghi được hoá đơn.
        </span>
      )}
    </div>
  );
}
