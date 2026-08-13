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
import type { DeNghiMuaHang, DongDeNghi, TruongBoSung } from "@/3-du-lieu/kieu-du-lieu";

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
      <DialogContent className="max-w-lg">
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
      <DialogContent className="max-w-md">
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
      <DialogContent className="max-w-lg">
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

/**
 * ★ HỘP SỬA DANH SÁCH MẶT HÀNG — thêm, sửa, bớt mặt hàng của một đề nghị.
 *
 * 🔴 Ban lãnh đạo 13/08/2026: *"việc thêm bớt công việc phải click vào đề xuất để chỉnh
 * sửa"*. Trước đó app để một nút thùng rác nhỏ ngay trên bảng theo dõi — sai cách: bỏ một
 * mặt hàng khỏi chứng từ là SỬA HỒ SƠ, phải mở phiếu ra sửa rồi bấm Lưu, thấy được toàn
 * cảnh trước khi quyết định và hủy được nếu đổi ý.
 *
 * ⚠️ HAI LOẠI DÒNG khác nhau, đừng gộp:
 *   · Dòng ĐÃ CÓ (`stt > 0`) — chứng từ khác có thể đang trỏ về `stt` của nó, nên `stt`
 *     phải giữ nguyên tuyệt đối.
 *   · Dòng MỚI THÊM (`stt = 0`) — kho dữ liệu cấp số khi lưu, nối tiếp số lớn nhất từng
 *     dùng chứ không lấp vào chỗ trống của dòng vừa bỏ.
 *
 * 📌 Chặn bỏ ngay tại giao diện kèm lý do, nhưng kho dữ liệu vẫn chặn lần nữa khi lưu —
 * chặn ở đây chỉ là phép lịch sự, luật thật nằm ở `suaMatHangDeNghi`.
 */
export function HopSuaMatHang({
  mo,
  deNghi,
  /** `stt` các dòng đã lên đơn đặt hàng — không cho bỏ. */
  sttDaLenDon,
  onDong,
  onLuu,
}: {
  mo: boolean;
  deNghi: DeNghiMuaHang;
  sttDaLenDon: number[];
  onDong: () => void;
  onLuu: (dongMoi: DongDeNghi[]) => void;
}) {
  const [ds, setDs] = useState<DongDeNghi[]>([]);

  useEffect(() => {
    if (!mo) return;
    setDs(deNghi.items.map((d) => ({ ...d })));
  }, [mo, deNghi]);

  function sua(i: number, phan: Partial<DongDeNghi>) {
    setDs((t) => t.map((x, k) => (k === i ? { ...x, ...phan } : x)));
  }

  /** Lý do KHÔNG bỏ được dòng này — `null` là bỏ được. Nút mờ luôn kèm lời giải thích. */
  function lyDoKhongBoDuoc(d: DongDeNghi): string | null {
    if (d.stt > 0 && sttDaLenDon.includes(d.stt)) return "Đã lên đơn đặt hàng";
    if (ds.length <= 1) return "Phải còn ít nhất một mặt hàng";
    return null;
  }

  const hopLe =
    ds.length > 0 &&
    ds.every(
      (d) => d.tenVatLieu.trim() !== "" && d.donViTinh.trim() !== "" && d.khoiLuongDeNghi > 0,
    );

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sửa danh sách mặt hàng</DialogTitle>
          <DialogDescription>
            {deNghi.code} — thêm hoặc bớt mặt hàng để giao đúng phần việc cho từng người. Mọi
            thay đổi được ghi vào nhật ký kèm tên người sửa.
          </DialogDescription>
        </DialogHeader>

        {/* Cuộn trong hộp: phiếu nhiều mặt hàng thì danh sách dài hơn màn hình, mà nút Lưu
            phải luôn nhìn thấy — đẩy nút xuống dưới màn là người dùng tưởng hộp hỏng. */}
        <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto">
          {ds.map((d, i) => {
            const vuong = lyDoKhongBoDuoc(d);
            return (
              <div
                key={d.stt > 0 ? `cu-${d.stt}` : `moi-${i}`}
                className="flex flex-col gap-2 rounded-lg border border-border p-(--hp-md-row-pad)"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-text-desc">
                    {d.stt > 0 ? `Dòng ${d.stt}` : "Dòng mới"}
                    {d.nguoiPhuTrachTen ? ` · đang giao ${d.nguoiPhuTrachTen}` : ""}
                  </span>
                  <span className="flex items-center gap-2">
                    {vuong && <span className="text-xs text-warning-soft">{vuong}</span>}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-text-desc hover:text-danger"
                      disabled={vuong !== null}
                      aria-label={`Bỏ mặt hàng ${d.tenVatLieu || "dòng mới"}`}
                      onClick={() => setDs((t) => t.filter((_, k) => k !== i))}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label htmlFor={`ten-mh-${i}`}>Tên mặt hàng *</Label>
                    <Input
                      id={`ten-mh-${i}`}
                      value={d.tenVatLieu}
                      onChange={(e) => sua(i, { tenVatLieu: e.target.value })}
                      placeholder="Xi măng PCB40"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`qc-mh-${i}`}>Quy cách / chủng loại</Label>
                    <Input
                      id={`qc-mh-${i}`}
                      value={d.quyCach ?? ""}
                      onChange={(e) => sua(i, { quyCach: e.target.value })}
                      placeholder="bao 50kg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`kl-mh-${i}`}>Số lượng *</Label>
                      <Input
                        id={`kl-mh-${i}`}
                        type="number"
                        min={0}
                        value={d.khoiLuongDeNghi || ""}
                        onChange={(e) => sua(i, { khoiLuongDeNghi: Number(e.target.value) })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`dvt-mh-${i}`}>ĐVT *</Label>
                      <Input
                        id={`dvt-mh-${i}`}
                        value={d.donViTinh}
                        onChange={(e) => sua(i, { donViTinh: e.target.value })}
                        placeholder="Bao"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <Label htmlFor={`md-mh-${i}`}>Mục đích sử dụng</Label>
                    <Input
                      id={`md-mh-${i}`}
                      value={d.mucDichSuDung ?? ""}
                      onChange={(e) => sua(i, { mucDichSuDung: e.target.value })}
                      placeholder="Đổ bê tông móng"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() =>
            setDs((t) => [
              ...t,
              {
                // `stt: 0` = dòng mới, kho dữ liệu cấp số thật khi lưu.
                stt: 0,
                tenVatLieu: "",
                quyCach: "",
                donViTinh: "",
                khoiLuongDeNghi: 0,
                mucDichSuDung: "",
                trangThaiDong: "chua_phan_bo",
                maPOLienQuan: [],
              },
            ])
          }
        >
          <Plus className="size-4" aria-hidden />
          Thêm mặt hàng
        </Button>

        {!hopLe && (
          <p className="text-xs text-warning-soft">
            Mỗi mặt hàng phải có tên, số lượng lớn hơn 0 và đơn vị tính.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Hủy
          </Button>
          <Button
            disabled={!hopLe}
            onClick={() => {
              onLuu(ds);
              onDong();
            }}
          >
            <Check className="size-4" aria-hidden />
            Lưu {ds.length} mặt hàng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
