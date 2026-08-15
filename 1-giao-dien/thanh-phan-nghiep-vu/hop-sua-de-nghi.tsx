"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { formatDate } from "@/6-tien-ich/dinh-dang";
import type { DeNghiMuaHang, TruongBoSung } from "@/3-du-lieu/kieu-du-lieu";

/**
 * BA HỘP SỬA của menu ⋯ trên thẻ bảng quy trình (chỉ đạo Ban lãnh đạo 10/08/2026, theo menu
 * ngữ cảnh Base.vn): **thông tin chung** · **thời hạn** · **trường bổ sung**.
 *
 * 🔴 GOM VÀO MỘT FILE vì cả ba cùng một khuôn: mở từ menu ⋯ → nạp giá trị hiện tại → sửa →
 * lưu và ghi nhật ký. Tách ba file thì ba lần lặp cùng một đoạn nạp/hủy, sửa một chỗ quên
 * hai chỗ kia.
 *
 * ⚠️ Mỗi hộp **nạp lại giá trị mỗi lần mở** (`useEffect` theo `mo`): mở → sửa dở → hủy → mở
 * lại phải thấy giá trị THẬT của hồ sơ, không phải chữ đang gõ dở lần trước.
 */

/** Hộp sửa thông tin chung: tiêu đề · công trình · hợp đồng CĐT · mức độ ưu tiên. */
export function HopSuaThongTinChung({
  mo,
  deNghi,
  onDong,
  onLuu,
}: {
  mo: boolean;
  deNghi: DeNghiMuaHang;
  onDong: () => void;
  onLuu: (
    moi: Pick<DeNghiMuaHang, "tieuDe" | "tenCongTrinh" | "maHopDongCDT" | "mucDoUuTien">,
  ) => void;
}) {
  const [tieuDe, setTieuDe] = useState(deNghi.tieuDe);
  const [tenCongTrinh, setTenCongTrinh] = useState(deNghi.tenCongTrinh);
  const [maHopDongCDT, setMaHopDongCDT] = useState(deNghi.maHopDongCDT ?? "");
  const [gap, setGap] = useState(deNghi.mucDoUuTien === "gap");

  useEffect(() => {
    if (!mo) return;
    setTieuDe(deNghi.tieuDe);
    setTenCongTrinh(deNghi.tenCongTrinh);
    setMaHopDongCDT(deNghi.maHopDongCDT ?? "");
    setGap(deNghi.mucDoUuTien === "gap");
  }, [mo, deNghi]);

  const hopLe = tieuDe.trim() !== "" && tenCongTrinh.trim() !== "";

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sửa thông tin chung</DialogTitle>
          <DialogDescription>
            {deNghi.code} — mọi thay đổi được ghi vào nhật ký kèm giá trị cũ và người sửa.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-(--hp-md-card-gap)">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sua-tieu-de">Tiêu đề</Label>
            <Input
              id="sua-tieu-de"
              value={tieuDe}
              onChange={(e) => setTieuDe(e.target.value)}
              placeholder="Vật tư thi công phần thân đợt 4"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sua-cong-trinh">Tên công trình</Label>
            <Input
              id="sua-cong-trinh"
              value={tenCongTrinh}
              onChange={(e) => setTenCongTrinh(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sua-hd-cdt">Số hợp đồng CĐT</Label>
            <Input
              id="sua-hd-cdt"
              value={maHopDongCDT}
              onChange={(e) => setMaHopDongCDT(e.target.value)}
              placeholder="260001-HPCS-HDXD-001"
            />
          </div>

          {/* Mức độ ưu tiên: dùng hai nút thay ô tick — trạng thái hiện bằng cả màu và chữ. */}
          <div className="flex flex-col gap-2">
            <Label>Mức độ ưu tiên</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={gap ? "outline" : "default"}
                onClick={() => setGap(false)}
              >
                Bình thường
              </Button>
              <Button
                size="sm"
                variant={gap ? "destructive" : "outline"}
                onClick={() => setGap(true)}
              >
                Gấp
              </Button>
            </div>
          </div>

          {/* ⚠️ Nói rõ cái gì KHÔNG sửa được ở đây, để người dùng khỏi đi tìm. */}
          <p className="text-xs text-text-desc">
            Mã đề nghị, mã dự án, người đề nghị và danh sách vật tư do Phòng Thi công lập trên
            HPcore — thu mua không sửa. Ngày cần hàng sửa ở mục <strong>Chỉnh sửa thời hạn</strong>.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Hủy
          </Button>
          <Button
            disabled={!hopLe}
            onClick={() => {
              onLuu({
                tieuDe: tieuDe.trim(),
                tenCongTrinh: tenCongTrinh.trim(),
                maHopDongCDT: maHopDongCDT.trim() || undefined,
                mucDoUuTien: gap ? "gap" : "binh_thuong",
              });
              onDong();
            }}
          >
            <Check className="size-4" aria-hidden />
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hộp đổi thời hạn (ngày cần hàng).
 *
 * 🔴 BẮT GHI LÝ DO. Ngày cần hàng là cam kết với công trình; đổi mà không nói vì sao thì
 * người đề nghị chỉ thấy ngày tự nhiên lùi ra. Nút lưu khóa khi chưa điền lý do.
 */
export function HopSuaThoiHan({
  mo,
  deNghi,
  onDong,
  onLuu,
}: {
  mo: boolean;
  deNghi: DeNghiMuaHang;
  onDong: () => void;
  onLuu: (ngayMoi: string, lyDo: string) => void;
}) {
  const [ngay, setNgay] = useState(deNghi.ngayCanHang);
  const [lyDo, setLyDo] = useState("");

  useEffect(() => {
    if (!mo) return;
    setNgay(deNghi.ngayCanHang);
    setLyDo("");
  }, [mo, deNghi]);

  const doiNgay = ngay !== "" && ngay !== deNghi.ngayCanHang;
  const hopLe = doiNgay && lyDo.trim() !== "";

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thời hạn</DialogTitle>
          <DialogDescription>
            {deNghi.code} — ngày cần hàng hiện tại: <strong>{formatDate(deNghi.ngayCanHang)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-(--hp-md-card-gap)">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sua-ngay-can-hang">Ngày cần hàng mới</Label>
            <Input
              id="sua-ngay-can-hang"
              type="date"
              value={ngay}
              onChange={(e) => setNgay(e.target.value)}
              className="w-48"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ly-do-doi-han">Lý do đổi thời hạn</Label>
            <Input
              id="ly-do-doi-han"
              value={lyDo}
              onChange={(e) => setLyDo(e.target.value)}
              placeholder="Nhà cung cấp báo hết hàng, giao sớm nhất được ngày 25/8"
            />
            <span className="text-xs text-text-desc">
              Bắt buộc — ngày cần hàng là cam kết với công trình, đổi phải nói rõ vì sao.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Hủy
          </Button>
          <Button
            disabled={!hopLe}
            onClick={() => {
              onLuu(ngay, lyDo.trim());
              onDong();
            }}
          >
            <Check className="size-4" aria-hidden />
            Đổi thời hạn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Hộp sửa trường bổ sung — "dữ liệu tùy chỉnh" của Base. */
export function HopSuaTruongBoSung({
  mo,
  deNghi,
  onDong,
  onLuu,
}: {
  mo: boolean;
  deNghi: DeNghiMuaHang;
  onDong: () => void;
  onLuu: (truong: TruongBoSung[]) => void;
}) {
  const [ds, setDs] = useState<TruongBoSung[]>([]);

  useEffect(() => {
    if (!mo) return;
    // Luôn để sẵn MỘT dòng trống: mở ra là gõ được ngay, không phải bấm "Thêm dòng" trước.
    const cu = deNghi.truongBoSung ?? [];
    setDs(cu.length > 0 ? [...cu] : [{ nhan: "", giaTri: "" }]);
  }, [mo, deNghi]);

  function sua(i: number, phan: Partial<TruongBoSung>) {
    setDs((t) => t.map((x, k) => (k === i ? { ...x, ...phan } : x)));
  }

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa dữ liệu tùy chỉnh</DialogTitle>
          <DialogDescription>
            {deNghi.code} — các trường tự đặt thêm, hiện ở khối “Thông tin đề nghị” trang chi tiết.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {ds.map((t, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <Input
                value={t.nhan}
                onChange={(e) => sua(i, { nhan: e.target.value })}
                placeholder="Tên trường (vd Số điện thoại BCH)"
                aria-label={`Tên trường thứ ${i + 1}`}
                className="min-w-0 flex-1"
              />
              <Input
                value={t.giaTri}
                onChange={(e) => sua(i, { giaTri: e.target.value })}
                placeholder="Giá trị"
                aria-label={`Giá trị trường thứ ${i + 1}`}
                className="min-w-0 flex-1"
              />
              <button
                type="button"
                onClick={() => setDs((x) => x.filter((_, k) => k !== i))}
                aria-label={`Xóa trường ${t.nhan || i + 1}`}
                className="flex size-11 shrink-0 items-center justify-center rounded-lg text-text-desc transition-colors hover:bg-muted hover:text-danger"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setDs((t) => [...t, { nhan: "", giaTri: "" }])}
          >
            <Plus className="size-4" aria-hidden />
            Thêm dòng
          </Button>

          {/* ⚠️ Ranh giới sử dụng — nói trước để dữ liệu nghiệp vụ không lọt vào đây. */}
          <p className="text-xs text-text-desc">
            Chỉ dùng cho thông tin phụ. Khối lượng, đơn giá, ngày giao phải nhập ở đúng ô của
            chúng — trường bổ sung không được đưa vào tính toán hay đối chiếu.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Hủy
          </Button>
          <Button
            onClick={() => {
              onLuu(ds);
              onDong();
            }}
          >
            <Check className="size-4" aria-hidden />
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
