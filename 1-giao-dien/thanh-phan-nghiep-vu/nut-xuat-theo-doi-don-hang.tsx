"use client";

// ============================================================
// NÚT "XUẤT EXCEL" CẢ BẢNG THEO DÕI ĐƠN HÀNG — chọn khoảng ngày đặt hàng rồi tải.
//
// ★ Sếp 02/10/2026: *"Thêm nút xuất excel bảng tổng của giao diện này"*.
//
// 🔴 CHỈ VẼ. Lọc khung + dựng tệp ở `2-quy-trinh/xuat-theo-doi-don-hang-excel.ts`; các dòng nhận
// nguyên từ bảng trên màn (đã qua ô tìm ở thanh trên), không tính lại số nào.
// 📌 Cùng dáng nút "Tải Excel" của màn Công nợ (`nut-xuat-cong-no.tsx`) — một app, một kiểu nút tải.
// ============================================================

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { OChonNgay } from "@/1-giao-dien/thanh-phan-dung-chung/o-chon-ngay";
import {
  locTheoKhungNgayDat,
  tenFileTheoDoiDonHang,
  tieuDeBangTheoDoi,
  xuatTheoDoiDonHangExcel,
  type DongXuatTheoDoi,
  type QuyenCotTheoDoi,
} from "@/2-quy-trinh/xuat-theo-doi-don-hang-excel";

/** Ngày đầu và cuối của tháng lệch `lech` so với tháng này (0 = tháng này, -1 = tháng trước). */
function khungThang(lech: number): { tuNgay: string; denNgay: string } {
  const h = new Date();
  const dau = new Date(h.getFullYear(), h.getMonth() + lech, 1);
  const cuoi = new Date(h.getFullYear(), h.getMonth() + lech + 1, 0);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { tuNgay: iso(dau), denNgay: iso(cuoi) };
}

export function NutXuatTheoDoiDonHang({
  cacDong,
  quyen,
  nguoiXuat,
}: {
  /** Dòng theo đúng thứ tự đang hiện trên màn (đã lọc theo ô tìm). */
  cacDong: readonly DongXuatTheoDoi[];
  quyen: QuyenCotTheoDoi;
  nguoiXuat: string;
}) {
  const [mo, setMo] = useState(false);
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");
  const [dangXuat, setDangXuat] = useState(false);

  const khung = { tuNgay, denNgay };
  const daLoc = useMemo(
    () => locTheoKhungNgayDat(cacDong, { tuNgay, denNgay }),
    [cacDong, tuNgay, denNgay],
  );
  const saiKhung = !!tuNgay && !!denNgay && tuNgay > denNgay;

  async function tai() {
    setDangXuat(true);
    try {
      const blob = await xuatTheoDoiDonHangExcel({ dong: daLoc, quyen, khung, nguoiXuat });
      const a = document.createElement("a");
      const diaChi = URL.createObjectURL(blob);
      a.href = diaChi;
      a.download = tenFileTheoDoiDonHang(khung);
      a.click();
      setTimeout(() => URL.revokeObjectURL(diaChi), 5000);
      toast.success(`Đã tải bảng theo dõi ${daLoc.length} đơn`);
      setMo(false);
    } catch (e) {
      /* 🔴 BÁO RA, ĐỪNG NUỐT — bấm tải mà không thấy tệp thì phải biết vì sao. */
      toast.error("Chưa tạo được tệp Excel", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setDangXuat(false);
    }
  }

  const chonThang = (lech: number) => {
    const k = khungThang(lech);
    setTuNgay(k.tuNgay);
    setDenNgay(k.denNgay);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMo(true)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-primary-bg hover:text-primary md:min-h-9"
      >
        <FileSpreadsheet className="size-4 shrink-0" aria-hidden />
        Xuất Excel
      </button>
      <Dialog open={mo} onOpenChange={setMo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xuất bảng theo dõi đơn hàng (Excel)</DialogTitle>
            <DialogDescription>
              Lọc theo <strong>ngày đặt hàng</strong>. Để trống là xuất toàn bộ đơn đang hiện trên màn (kể cả
              khi đang lọc bằng ô tìm phía trên).
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => chonThang(0)}>
              Tháng này
            </Button>
            <Button variant="outline" size="sm" onClick={() => chonThang(-1)}>
              Tháng trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTuNgay("");
                setDenNgay("");
              }}
            >
              Tất cả
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Từ ngày</span>
              <OChonNgay id="xuat-td-tu" nhan="Từ ngày" giaTri={tuNgay} onDoi={setTuNgay} toiDa={denNgay || undefined} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Đến ngày</span>
              <OChonNgay id="xuat-td-den" nhan="Đến ngày" giaTri={denNgay} onDoi={setDenNgay} toiThieu={tuNgay || undefined} />
            </div>
          </div>
          <p className={`text-sm ${saiKhung || daLoc.length === 0 ? "text-warning" : "text-text-secondary"}`}>
            {saiKhung
              ? "“Từ ngày” đang sau “Đến ngày” — chọn lại khung."
              : daLoc.length === 0
                ? "Không có đơn nào trong khung này."
                : `Sẽ xuất ${daLoc.length} đơn · tiêu đề: “${tieuDeBangTheoDoi(khung)}”.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMo(false)}>
              Hủy
            </Button>
            <Button onClick={tai} disabled={dangXuat || saiKhung || daLoc.length === 0}>
              <FileSpreadsheet aria-hidden />
              {dangXuat ? "Đang tạo tệp…" : "Tải xuống"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
