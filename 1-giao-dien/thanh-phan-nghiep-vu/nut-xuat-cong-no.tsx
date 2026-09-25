"use client";

// ============================================================
// NÚT "TẢI EXCEL" CỦA BẢNG CÔNG NỢ — chọn khung thời gian rồi tải.
//
// ★ Sếp 25/09/2026: ***"Thêm chức năng tải xuống danh sách công nợ (định dạng excel) có thể chọn
// theo khung thời gian"***.
//
// 🔴 CHỈ VẼ. Lọc theo khung + dựng tệp nằm ở `2-quy-trinh/xuat-cong-no-excel.ts`; các con số lấy
// nguyên từ các dòng bảng đang có (`congNoTheoDonHang`), không tính lại.
//
// 📌 Xuất trên danh sách ĐANG HIỆN (đã qua ô tìm NCC / "PO của tôi") — người dùng lọc gì trên
// màn thì tệp ra đúng như vậy, và hộp thoại nói rõ đang xuất bao nhiêu đơn.
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
import { locCongNoTheoKhung, xuatCongNoExcel } from "@/2-quy-trinh/xuat-cong-no-excel";
import { lamSachTenTep } from "@/2-quy-trinh/xuat-don-hang-excel";
import type { CongNoTheoDon } from "@/2-quy-trinh/tuoi-no";
import type { NgayISO } from "@/3-du-lieu/kieu-du-lieu";

/** Ngày đầu tháng hiện tại — mặc định "từ ngày" cho ca hay dùng nhất: đối chiếu công nợ tháng này. */
function dauThangNay(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function NutXuatCongNo({
  cacDong,
  ngayPOTheoId,
  nguoiXuat,
}: {
  cacDong: readonly CongNoTheoDon[];
  ngayPOTheoId: ReadonlyMap<string, string | undefined>;
  nguoiXuat: string;
}) {
  const [mo, setMo] = useState(false);
  const [tuNgay, setTuNgay] = useState(dauThangNay);
  const [denNgay, setDenNgay] = useState("");
  const [dangXuat, setDangXuat] = useState(false);

  const khung = { tuNgay: tuNgay as NgayISO | "", denNgay: denNgay as NgayISO | "" };
  const daLoc = useMemo(
    () => locCongNoTheoKhung(cacDong, khung, ngayPOTheoId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacDong, tuNgay, denNgay, ngayPOTheoId],
  );
  const soTo = daLoc.reduce((s, x) => s + x.cacTo.length, 0);
  const saiKhung = !!tuNgay && !!denNgay && tuNgay > denNgay;

  async function tai() {
    setDangXuat(true);
    try {
      const blob = await xuatCongNoExcel({ cacDong: daLoc, khung, nguoiXuat });
      const a = document.createElement("a");
      const diaChi = URL.createObjectURL(blob);
      a.href = diaChi;
      a.download = lamSachTenTep(`Cong-no-NCC_${tuNgay || "dau"}_${denNgay || "nay"}`) + ".xlsx";
      a.click();
      setTimeout(() => URL.revokeObjectURL(diaChi), 5000);
      toast.success(`Đã tải ${daLoc.length} đơn · ${soTo} tờ hoá đơn`);
      setMo(false);
    } catch (e) {
      /* 🔴 BÁO RA, ĐỪNG NUỐT — người dùng bấm tải mà không thấy tệp thì phải biết vì sao. */
      toast.error("Chưa tạo được tệp Excel", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setDangXuat(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMo(true)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-primary-bg hover:text-primary md:min-h-9"
      >
        <FileSpreadsheet className="size-4 shrink-0" aria-hidden />
        Tải Excel
      </button>
      <Dialog open={mo} onOpenChange={setMo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tải danh sách công nợ (Excel)</DialogTitle>
            <DialogDescription>
              Lọc theo <strong>ngày hoá đơn</strong> của từng tờ. Đơn chưa có hoá đơn thì theo ngày lập
              PO. Để trống một đầu là không giới hạn đầu đó.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Từ ngày</span>
              <OChonNgay id="xuat-cn-tu" nhan="Từ ngày" giaTri={tuNgay} onDoi={setTuNgay} toiDa={denNgay || undefined} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Đến ngày</span>
              <OChonNgay id="xuat-cn-den" nhan="Đến ngày" giaTri={denNgay} onDoi={setDenNgay} toiThieu={tuNgay || undefined} />
            </div>
          </div>
          <p className={`text-sm ${saiKhung || daLoc.length === 0 ? "text-warning" : "text-text-secondary"}`}>
            {saiKhung
              ? "“Từ ngày” đang sau “Đến ngày” — chọn lại khung."
              : daLoc.length === 0
                ? "Không có đơn nào trong khung này."
                : `Sẽ xuất ${daLoc.length} đơn · ${soTo} tờ hoá đơn (2 trang tính: theo đơn và theo từng tờ).`}
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
