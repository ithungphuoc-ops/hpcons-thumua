"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Inbox, Plus, Trash2, Wand2 } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";

/**
 * CÔNG CỤ GIẢ LẬP — nhận một đề nghị mua hàng đã duyệt từ Phòng Thi công.
 *
 * 🔴 ĐÂY KHÔNG PHẢI NGHIỆP VỤ THẬT. Theo kiến trúc đã chốt, đề nghị do Phòng Thi công
 * lập và Ban chỉ huy duyệt trên HPcore; app Thu mua CHỈ ĐỌC, không tự tạo đề nghị.
 * Màn này chỉ để chạy thử được trọn vòng khi chưa nối Firebase.
 * Khi nối dữ liệu thật: XÓA màn này và xóa `themDeNghiGiaLap` trong kho dữ liệu.
 */

interface DongNhap {
  tenVatLieu: string;
  quyCach: string;
  donViTinh: string;
  khoiLuong: string;
  vatTuKiemSoatDinhMuc: boolean;
}

const DONG_TRONG: DongNhap = {
  tenVatLieu: "",
  quyCach: "",
  donViTinh: "",
  khoiLuong: "",
  vatTuKiemSoatDinhMuc: false,
};

function homNay(): string {
  return new Date().toISOString().slice(0, 10);
}

function congNgay(soNgay: number): string {
  const d = new Date();
  d.setDate(d.getDate() + soNgay);
  return d.toISOString().slice(0, 10);
}

export default function TrangNhanDeNghiMoi() {
  const router = useRouter();
  const { deNghi, themDeNghiGiaLap } = useDuLieu();

  const [maDuAn, setMaDuAn] = useState("");
  const [tenCongTrinh, setTenCongTrinh] = useState("");
  const [maHopDongCDT, setMaHopDongCDT] = useState("");
  const [tieuDe, setTieuDe] = useState("");
  const [nguoiDeNghiTen, setNguoiDeNghiTen] = useState("Phạm Văn F");
  const [ngayDeNghi, setNgayDeNghi] = useState(homNay);
  const [ngayDuyet, setNgayDuyet] = useState(homNay);
  const [ngayCanHang, setNgayCanHang] = useState("");
  const [gap, setGap] = useState(false);
  const [dong, setDong] = useState<DongNhap[]>([{ ...DONG_TRONG }]);

  /** Các dự án đã có trong hệ thống — bấm để điền nhanh, khỏi gõ lại. */
  const duAnDaCo = useMemo(() => {
    const map = new Map<string, { maDuAn: string; tenCongTrinh: string; maHopDongCDT?: string }>();
    for (const dn of deNghi) {
      if (!map.has(dn.maDuAn)) {
        map.set(dn.maDuAn, {
          maDuAn: dn.maDuAn,
          tenCongTrinh: dn.tenCongTrinh,
          maHopDongCDT: dn.maHopDongCDT,
        });
      }
    }
    return [...map.values()];
  }, [deNghi]);

  const dongHopLe = dong.filter(
    (d) => d.tenVatLieu.trim() !== "" && d.donViTinh.trim() !== "" && Number(d.khoiLuong) > 0,
  );
  const hopLe =
    maDuAn.trim() !== "" &&
    tenCongTrinh.trim() !== "" &&
    tieuDe.trim() !== "" &&
    ngayCanHang !== "" &&
    dongHopLe.length > 0;

  function chonDuAn(d: { maDuAn: string; tenCongTrinh: string; maHopDongCDT?: string }) {
    setMaDuAn(d.maDuAn);
    setTenCongTrinh(d.tenCongTrinh);
    setMaHopDongCDT(d.maHopDongCDT ?? "");
  }

  /** Điền sẵn một đề nghị đủ dữ liệu để Sếp bấm thử nhanh, khỏi gõ tay. */
  function dienNhanh() {
    const mau = duAnDaCo[0];
    setMaDuAn(mau?.maDuAn ?? "260001-HPCS");
    setTenCongTrinh(mau?.tenCongTrinh ?? "Nhà xưởng ABC — Giai đoạn 2");
    setMaHopDongCDT(mau?.maHopDongCDT ?? "");
    setTieuDe("Vật tư thử nghiệm — tạo lúc " + new Date().toLocaleTimeString("vi-VN"));
    setNguoiDeNghiTen("Phạm Văn F");
    setNgayDeNghi(homNay());
    setNgayDuyet(homNay());
    setNgayCanHang(congNgay(10));
    setGap(false);
    setDong([
      { tenVatLieu: "Xi măng PCB40", quyCach: "bao 50kg", donViTinh: "Bao", khoiLuong: "150", vatTuKiemSoatDinhMuc: false },
      { tenVatLieu: "Thép thanh vằn D14", quyCach: "CB400-V", donViTinh: "Kg", khoiLuong: "2400", vatTuKiemSoatDinhMuc: true },
      { tenVatLieu: "Cát xây tô", quyCach: "", donViTinh: "m³", khoiLuong: "60", vatTuKiemSoatDinhMuc: false },
    ]);
    toast.info("Đã điền sẵn một đề nghị mẫu", { description: "Sếp sửa lại tùy ý rồi bấm Nhận đề nghị." });
  }

  function suaDong(i: number, thayDoi: Partial<DongNhap>) {
    setDong((truoc) => truoc.map((d, idx) => (idx === i ? { ...d, ...thayDoi } : d)));
  }

  function nhanDeNghi() {
    const id = themDeNghiGiaLap({
      maDuAn: maDuAn.trim(),
      maHopDongCDT: maHopDongCDT.trim() || undefined,
      tenCongTrinh: tenCongTrinh.trim(),
      tieuDe: tieuDe.trim(),
      nguoiDeNghiTen: nguoiDeNghiTen.trim() || "Phòng Thi công",
      ngayDeNghi,
      ngayDuyet,
      ngayCanHang,
      mucDoUuTien: gap ? "gap" : "binh_thuong",
      items: dongHopLe.map((d) => ({
        tenVatLieu: d.tenVatLieu.trim(),
        quyCach: d.quyCach.trim() || undefined,
        donViTinh: d.donViTinh.trim(),
        khoiLuongDeNghi: Number(d.khoiLuong),
        vatTuKiemSoatDinhMuc: d.vatTuKiemSoatDinhMuc || undefined,
      })),
    });

    if (!id) {
      toast.error("Đã hết chỗ cho đề nghị thử", {
        description: "Bản chạy thử chỉ nhận được 12 đề nghị giả lập. Tải lại trang để về dữ liệu gốc.",
      });
      return;
    }

    toast.success("Đã nhận đề nghị từ Phòng Thi công", {
      description: "Thẻ mới nằm ở cột đầu tiên — Tiếp nhận và kiểm tra.",
    });
    router.push("/de-nghi");
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Thu mua", href: "/tong-quan" },
          { label: "Đề nghị mua hàng", href: "/de-nghi" },
          { label: "Nhận đề nghị mới" },
        ]}
        title="Nhận đề nghị mới (giả lập)"
        description="Mô phỏng việc Phòng Thi công gửi một đề nghị ĐÃ DUYỆT sang Phòng Thu mua qua HPcore"
        actions={
          <Button variant="outline" size="sm" onClick={dienNhanh}>
            <Wand2 className="size-4" aria-hidden />
            Điền nhanh mẫu
          </Button>
        }
      />

      {/* Cảnh báo: đây không phải nghiệp vụ thật */}
      <Card className="border-warning/40 bg-warning-bg">
        <CardContent className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-warning-soft">Đây là công cụ chạy thử</p>
          <p className="text-xs text-text-secondary">
            Ở bản thật, app Thu mua <strong>không tạo được đề nghị</strong> — đề nghị do Phòng Thi công
            lập và Ban chỉ huy duyệt trên HPcore, app này chỉ đọc. Màn này chỉ để Sếp bấm thử trọn vòng
            khi chưa nối Firebase. Dữ liệu nhập vào <strong>mất khi tải lại trang</strong>.
          </p>
        </CardContent>
      </Card>

      {/* Thông tin chung */}
      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          <h2 className="text-h3 text-text-primary">Thông tin đề nghị</h2>

          {duAnDaCo.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Chọn nhanh dự án đã có</Label>
              <div className="flex flex-wrap gap-2">
                {duAnDaCo.map((d) => (
                  <Button
                    key={d.maDuAn}
                    variant={maDuAn === d.maDuAn ? "default" : "outline"}
                    size="sm"
                    onClick={() => chonDuAn(d)}
                  >
                    {d.maDuAn}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-(--hp-md-card-gap) md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ma-du-an">Mã dự án gốc *</Label>
              <Input
                id="ma-du-an"
                placeholder="260001-HPCS"
                value={maDuAn}
                onChange={(e) => setMaDuAn(e.target.value)}
              />
              <span className="text-xs text-text-desc">
                Theo Thông báo 09/2026. Mã đề nghị sẽ tự sinh: {maDuAn.trim() || "[mã dự án]"}-PR-00x
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ten-cong-trinh">Tên công trình *</Label>
              <Input
                id="ten-cong-trinh"
                placeholder="Nhà xưởng ABC — Giai đoạn 2"
                value={tenCongTrinh}
                onChange={(e) => setTenCongTrinh(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ma-hd">Mã hợp đồng chủ đầu tư</Label>
              <Input
                id="ma-hd"
                placeholder="260001-HPCS-HDXD-001"
                value={maHopDongCDT}
                onChange={(e) => setMaHopDongCDT(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nguoi-de-nghi">Người đề nghị</Label>
              <Input
                id="nguoi-de-nghi"
                value={nguoiDeNghiTen}
                onChange={(e) => setNguoiDeNghiTen(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="tieu-de">Nội dung đề nghị *</Label>
              <Input
                id="tieu-de"
                placeholder="Vật tư thi công phần thân đợt 4"
                value={tieuDe}
                onChange={(e) => setTieuDe(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-(--hp-md-card-gap)">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ngay-de-nghi">Ngày đề nghị</Label>
              <Input
                id="ngay-de-nghi"
                type="date"
                value={ngayDeNghi}
                onChange={(e) => setNgayDeNghi(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ngay-duyet">Ngày duyệt</Label>
              <Input
                id="ngay-duyet"
                type="date"
                value={ngayDuyet}
                onChange={(e) => setNgayDuyet(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ngay-can-hang">Ngày cần hàng *</Label>
              <Input
                id="ngay-can-hang"
                type="date"
                value={ngayCanHang}
                onChange={(e) => setNgayCanHang(e.target.value)}
                className="w-44"
              />
              <span className="text-xs text-text-desc">Mốc tính &quot;Quá hạn / Còn N ngày&quot; trên bảng</span>
            </div>
            <label className="flex min-h-11 items-center gap-2">
              <Checkbox
                checked={gap}
                onCheckedChange={(c) => setGap(c === true)}
                aria-label="Đánh dấu đề nghị gấp"
              />
              <span className="text-sm text-text-primary">Đánh dấu Gấp</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Danh sách mặt hàng */}
      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-h3 text-text-primary">Mặt hàng đề nghị ({dongHopLe.length} dòng hợp lệ)</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDong((t) => [...t, { ...DONG_TRONG }])}
            >
              <Plus className="size-4" aria-hidden />
              Thêm dòng
            </Button>
          </div>

          <div className="flex flex-col gap-(--hp-md-row-gap)">
            {dong.map((d, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-text-primary">Dòng {i + 1}</span>
                  {dong.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDong((t) => t.filter((_, idx) => idx !== i))}
                      aria-label={`Xóa dòng ${i + 1}`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Xóa
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor={`ten-${i}`}>Tên vật liệu *</Label>
                    <Input
                      id={`ten-${i}`}
                      placeholder="Xi măng PCB40"
                      value={d.tenVatLieu}
                      onChange={(e) => suaDong(i, { tenVatLieu: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`qc-${i}`}>Quy cách</Label>
                    <Input
                      id={`qc-${i}`}
                      placeholder="bao 50kg"
                      value={d.quyCach}
                      onChange={(e) => suaDong(i, { quyCach: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`dvt-${i}`}>ĐVT *</Label>
                      <Input
                        id={`dvt-${i}`}
                        placeholder="Bao"
                        value={d.donViTinh}
                        onChange={(e) => suaDong(i, { donViTinh: e.target.value })}
                        className="w-24"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`kl-${i}`}>Khối lượng *</Label>
                      <Input
                        id={`kl-${i}`}
                        type="number"
                        min={0}
                        placeholder="0"
                        value={d.khoiLuong}
                        onChange={(e) => suaDong(i, { khoiLuong: e.target.value })}
                        className="w-28"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex min-h-11 items-center gap-2">
                  <Checkbox
                    checked={d.vatTuKiemSoatDinhMuc}
                    onCheckedChange={(c) => suaDong(i, { vatTuKiemSoatDinhMuc: c === true })}
                    aria-label={`Vật tư kiểm soát định mức, dòng ${i + 1}`}
                  />
                  <span className="text-sm text-text-primary">
                    Vật tư kiểm soát định mức{" "}
                    <span className="text-xs text-text-desc">— Ban QLDA sẽ nhận cảnh báo</span>
                  </span>
                </label>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-divider pt-4">
            <Button disabled={!hopLe} onClick={nhanDeNghi}>
              <Inbox className="size-4" aria-hidden />
              Nhận đề nghị
            </Button>
            <Button variant="ghost" onClick={() => router.push("/de-nghi")}>
              Quay lại bảng
            </Button>
            {!hopLe && (
              <span className="text-xs text-text-desc">
                Cần: mã dự án · tên công trình · nội dung · ngày cần hàng · ít nhất 1 dòng có tên, ĐVT và khối lượng.
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
