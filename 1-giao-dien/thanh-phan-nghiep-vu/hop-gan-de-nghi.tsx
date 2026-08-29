"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { cn } from "@/6-tien-ich/gop-lop";
import { boDau } from "@/6-tien-ich/bo-dau";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { tongGiaTriBaoGiaDaChot } from "@/2-quy-trinh/tinh-toan";
import type { DonDatHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * ★ HỘP THOẠI "+ GẮN ĐỀ NGHỊ" — thêm 29/08/2026, cho PO trạng thái `"cho_de_nghi"` (module
 * "Lập đơn mua hàng (PO)" độc lập — xem `form-lap-don-mua-hang.tsx`).
 *
 * 🔴 LIỆT KÊ THEO BẢNG BÁO GIÁ ĐÃ CHỐT (`BaoGia.trangThai === "da_chon_ncc"`), KHÔNG PHẢI
 * theo đề nghị. Đề nghị (và request App Request gốc) KHÔNG hề mang thông tin nhà cung cấp —
 * NCC chỉ xuất hiện SAU, ở bước "Xét duyệt báo giá" nội bộ Thu mua, ghi trên `BaoGia.nccDaChonId`.
 * Một đề nghị có thể có NHIỀU bảng báo giá (nhiều NCC khác nhau cho các phần khác nhau — đúng
 * cơ chế "Tách thêm đơn" đã có sẵn), nên có thể thấy cùng một mã đề nghị xuất hiện nhiều dòng.
 *
 * 🔴 SO KHỚP NCC LÀ GỢI Ý, KHÔNG PHẢI CHỐT CHẶN. `po.supplierId` có thể là mã tự sinh từ MST/tên
 * khi NCC không nằm trong danh mục (xem `luu()` trong `form-lap-don-mua-hang.tsx`), nên so
 * thẳng ID có thể trật dù cùng một NCC thật — vì vậy so thêm cả tên đã chuẩn hoá làm phương án
 * dự phòng. Khác NCC vẫn cho gắn (người lập có thể biết rõ hơn máy tại sao khác), chỉ cảnh báo.
 *
 * Điều kiện "đủ để gắn" CHẠY LẠI đúng `vuongMacLapDonHang` — xem `ganDeNghiVaoPO` trong
 * `kho-du-lieu.tsx` — nên bảng báo giá chưa đủ điều kiện (đề nghị chưa có hợp đồng, báo giá
 * chưa duyệt…) vẫn có thể hiện ở đây rồi bị chặn khi bấm gắn; ô tìm kiếm không tự lọc trước để
 * người lập biết đề nghị đó tồn tại và vì sao chưa gắn được (thông báo lỗi nói rõ lý do).
 */
export function HopGanDeNghi({ po }: { po: DonDatHang }) {
  const { baoGia, deNghi, donHang, ganDeNghiVaoPO } = useDuLieu();
  const [mo, setMo] = useState(false);
  const [tuKhoa, setTuKhoa] = useState("");
  const [daChon, setDaChon] = useState<string | null>(null);

  const ungVien = useMemo(() => {
    const daChot = baoGia.filter((bg) => bg.trangThai === "da_chon_ncc");
    const ds = daChot.map((bg) => {
      const dnGoc = deNghi.find((d) => d.id === bg.prId);
      const khopNCC =
        !!bg.nccDaChonId &&
        (bg.nccDaChonId === po.supplierId ||
          boDau(bg.nccDaChonTen ?? "").trim() === boDau(po.supplierTen ?? "").trim());
      /**
       * ★ CẢNH BÁO MỀM (không chặn) — thêm sau review PR: đề nghị này đã có MỘT PO khác trỏ
       * `prId` về nó rồi. KHÔNG chặn — "Tách thêm đơn" (nhiều PO cho cùng 1 đề nghị, chia khối
       * lượng/nhà cung cấp khác nhau) là cơ chế hợp lệ đã có sẵn trong app. Chỉ báo để người lập
       * biết mà tự kiểm tra khối lượng, tránh gắn nhầm PO không liên quan vào đúng đề nghị đã đủ.
       */
      const daCoPOKhac = !!dnGoc && donHang.some((p) => p.id !== po.id && p.prId === dnGoc.id);
      return { bg, dnGoc, khopNCC, daCoPOKhac, tongGiaTri: tongGiaTriBaoGiaDaChot(bg) };
    });
    // Cùng mã dự án với PO lên đầu — đỡ phải kéo cả danh sách để tìm.
    const sapXep = [...ds].sort((a, b) => {
      const aCung = a.dnGoc?.maDuAn === po.maDuAn ? 0 : 1;
      const bCung = b.dnGoc?.maDuAn === po.maDuAn ? 0 : 1;
      return aCung - bCung;
    });
    if (!tuKhoa.trim()) return sapXep;
    const kt = boDau(tuKhoa).trim();
    return sapXep.filter((u) =>
      [u.bg.prCode, u.dnGoc?.tenCongTrinh, u.bg.nccDaChonTen]
        .filter(Boolean)
        .some((s) => boDau(String(s)).includes(kt)),
    );
  }, [baoGia, deNghi, donHang, po.id, po.maDuAn, po.supplierId, po.supplierTen, tuKhoa]);

  function dong() {
    setMo(false);
    setTuKhoa("");
    setDaChon(null);
  }

  function ganNgay() {
    if (!daChon) return;
    const loi = ganDeNghiVaoPO(po.id, daChon);
    if (loi) {
      toast.error("Chưa gắn được đề nghị", { description: loi });
      return;
    }
    toast.success("Đã gắn đề nghị vào đơn hàng", {
      description: `${po.code} giờ là PO chính thức.`,
    });
    dong();
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setMo(true)}>
        <Plus className="size-4" aria-hidden />
        Gắn đề nghị
      </Button>

      <Dialog open={mo} onOpenChange={(v: boolean) => !v && dong()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gắn đề nghị cho {po.code}</DialogTitle>
            <DialogDescription>
              Chỉ hiện bảng báo giá đã chốt nhà cung cấp — đề nghị chưa qua bước Xét duyệt báo
              giá thì chưa đủ điều kiện gắn.
            </DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Tìm theo mã đề nghị, công trình, nhà cung cấp…"
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
          />

          {ungVien.length === 0 ? (
            <p className="text-sm text-text-desc">
              Chưa có bảng báo giá nào đã chốt nhà cung cấp trong toàn hệ thống. Đợi đề nghị về
              và qua bước Xét duyệt báo giá rồi quay lại.
            </p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
              {ungVien.map(({ bg, dnGoc, khopNCC, daCoPOKhac, tongGiaTri }) => (
                <li key={bg.id}>
                  <label
                    className={cn(
                      "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-2.5",
                      daChon === bg.id ? "border-primary bg-primary-bg" : "border-border",
                    )}
                  >
                    <input
                      type="radio"
                      name="bao-gia-chon"
                      className="mt-1"
                      checked={daChon === bg.id}
                      onChange={() => setDaChon(bg.id)}
                      aria-label={`Chọn ${bg.prCode ?? bg.code}`}
                    />
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="text-sm font-semibold text-text-primary">
                        {dnGoc?.code ?? bg.prCode ?? "—"} · {bg.code}
                      </span>
                      <span className="text-xs text-text-desc">
                        {dnGoc?.tenCongTrinh ? `${dnGoc.tenCongTrinh} · ` : ""}
                        NCC đã chốt: {bg.nccDaChonTen ?? "—"}
                        {tongGiaTri > 0 ? ` · ${tongGiaTri.toLocaleString("vi-VN")} ₫` : ""}
                      </span>
                      {daCoPOKhac && (
                        <span className="text-xs font-medium text-warning-soft">
                          ⚠ Đề nghị này đã có đơn hàng khác gắn vào — kiểm tra lại khối lượng
                          trước khi gắn thêm (nếu là tách đơn cho nhiều NCC thì cứ tiếp tục).
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
                        khopNCC ? "bg-success-bg text-success-soft" : "bg-warning-bg text-warning-soft",
                      )}
                    >
                      {khopNCC ? "✓ Khớp NCC" : "⚠ Khác NCC"}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={dong}>
              Hủy
            </Button>
            <Button disabled={!daChon} onClick={ganNgay}>
              Gắn đề nghị này
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
