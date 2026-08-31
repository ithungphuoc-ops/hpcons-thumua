"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Lock, Pencil, Plus, Trash2, Undo2 } from "lucide-react";
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
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";
import { useDuLieu, type ThayDoiDonHang } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { dongPOBiKhoaNoiDung, laDongHang } from "@/2-quy-trinh/tinh-toan";
import type { DongPO, DonDatHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * ★★★ HỘP "SỬA ĐƠN HÀNG" — thêm 31/08/2026, Sếp demo bằng Artifact rồi chốt qua nhiều vòng.
 *
 * 🔴 CHỈ BÀY 3 NHÓM TRƯỜNG ĐÚNG NHƯ `ThayDoiDonHang` NHẬN — xem chú thích đầy đủ ở đó
 * (`3-du-lieu/kho-du-lieu.tsx`). Nhóm 3 (mã PO, trạng thái, đề nghị nguồn, mã dự án) không có ô
 * nào ở đây — sửa những thứ đó qua đúng luồng riêng của nó ("+ Gắn đề nghị", v.v.), không trộn
 * vào hộp này.
 *
 * 🔴 KHÓA TỪNG DÒNG THEO PHIẾU NHẬN — component TỰ tính lại đúng luật `suaDonHang` đã kiểm ở
 * tầng ghi (dòng có phiếu nhận "da_nhap_kho" thì khóa nội dung/số lượng) để BÀY ĐÚNG trạng thái
 * khóa, không hứa sửa được rồi bị cửa ghi từ chối im lặng.
 */
export function HopSuaDonHang({ po }: { po: DonDatHang }) {
  const { phieuNhan, giaDonHang, suaDonHang } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  const [mo, setMo] = useState(false);

  const laQuanLy = quyen.suaPODaChot;
  const laNguoiPhuTrach = po.nguoiPhuTrachUid === nguoiDung.uid;
  const duocSua = laQuanLy || laNguoiPhuTrach;

  const giaHienTai = giaDonHang.find((g) => g.poId === po.id);

  /** Dòng đang có phiếu nhận tham chiếu — khóa nội dung/số lượng, đúng luật DÙNG CHUNG với
   *  tầng ghi `suaDonHang`. Xem chú thích đầy đủ ở `dongPOBiKhoaNoiDung`. */
  const dongDaNhan = useMemo(() => {
    return dongPOBiKhoaNoiDung(phieuNhan.filter((p) => p.poId === po.id));
  }, [phieuNhan, po.id]);

  // ------------------------------------------------------------
  // NHÓM 1
  // ------------------------------------------------------------
  const [nguoiLienHeNCC, setNguoiLienHeNCC] = useState(po.nguoiLienHeNCC ?? "");
  const [diaChiNCC, setDiaChiNCC] = useState(po.diaChiNCC ?? "");
  const [maSoThueNCC, setMaSoThueNCC] = useState(po.maSoThueNCC ?? "");
  const [nguoiNhanHangTen, setNguoiNhanHangTen] = useState(po.nguoiNhanHangTen ?? "");
  const [nguoiNhanHangSdt, setNguoiNhanHangSdt] = useState(po.nguoiNhanHangSdt ?? "");
  const [diaDiemGiaoHang, setDiaDiemGiaoHang] = useState(po.diaDiemGiaoHang ?? "");
  const [dieuKienGiaoHang, setDieuKienGiaoHang] = useState(po.dieuKienGiaoHang ?? "");
  const [ghiChuThoiGianGiao, setGhiChuThoiGianGiao] = useState(po.ghiChuThoiGianGiao ?? "");
  const [ghiChu, setGhiChu] = useState(po.ghiChu ?? "");
  const [dieuKhoanKhac, setDieuKhoanKhac] = useState(po.dieuKhoanKhac ?? "");
  const [thamChieu, setThamChieu] = useState(po.thamChieu ?? "");

  // ------------------------------------------------------------
  // NHÓM 2
  // ------------------------------------------------------------
  const [supplierTen, setSupplierTen] = useState(po.supplierTen);
  const [ngayGiaoDuKien, setNgayGiaoDuKien] = useState(po.ngayGiaoDuKien);
  const [items, setItems] = useState<DongPO[]>(po.items);
  const [gia, setGia] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {};
    for (const l of giaHienTai?.lines ?? []) m[l.sttDong] = String(l.donGia);
    return m;
  });

  const doiNgayGiao = ngayGiaoDuKien !== po.ngayGiaoDuKien;
  const doiNCC = supplierTen.trim() !== po.supplierTen && supplierTen.trim() !== "";
  const batBuocLyDo = !laQuanLy || doiNgayGiao || doiNCC;

  const [lyDo, setLyDo] = useState("");

  function moHop() {
    setNguoiLienHeNCC(po.nguoiLienHeNCC ?? "");
    setDiaChiNCC(po.diaChiNCC ?? "");
    setMaSoThueNCC(po.maSoThueNCC ?? "");
    setNguoiNhanHangTen(po.nguoiNhanHangTen ?? "");
    setNguoiNhanHangSdt(po.nguoiNhanHangSdt ?? "");
    setDiaDiemGiaoHang(po.diaDiemGiaoHang ?? "");
    setDieuKienGiaoHang(po.dieuKienGiaoHang ?? "");
    setGhiChuThoiGianGiao(po.ghiChuThoiGianGiao ?? "");
    setGhiChu(po.ghiChu ?? "");
    setDieuKhoanKhac(po.dieuKhoanKhac ?? "");
    setThamChieu(po.thamChieu ?? "");
    setSupplierTen(po.supplierTen);
    setNgayGiaoDuKien(po.ngayGiaoDuKien);
    setItems(po.items);
    const m: Record<number, string> = {};
    for (const l of giaHienTai?.lines ?? []) m[l.sttDong] = String(l.donGia);
    setGia(m);
    setLyDo("");
    setMo(true);
  }

  function themDongMoi() {
    const sttKeTiep = Math.max(0, ...items.map((d) => d.sttDong)) + 1;
    setItems((truoc) => [
      ...truoc,
      {
        sttDong: sttKeTiep,
        sttDongDeNghi: undefined,
        tenVatLieu: "",
        donViTinh: "",
        khoiLuongDat: 0,
      },
    ]);
  }

  function sua() {
    if (batBuocLyDo && lyDo.trim() === "") {
      toast.error("Chưa ghi lý do", {
        description: doiNgayGiao
          ? "Đổi ngày giao phải ghi lý do, dù là ai sửa."
          : doiNCC
            ? "Đổi nhà cung cấp phải ghi lý do, dù là ai sửa."
            : "Bạn không phải Trưởng bộ phận/quản trị — sửa đơn hàng phải ghi lý do.",
      });
      return;
    }

    const itemsConLai = items.filter((d) => d.tenVatLieu.trim() !== "");
    const thayDoi: ThayDoiDonHang = {
      nguoiLienHeNCC,
      diaChiNCC,
      maSoThueNCC,
      nguoiNhanHangTen,
      nguoiNhanHangSdt,
      diaDiemGiaoHang,
      dieuKienGiaoHang,
      ghiChuThoiGianGiao,
      ghiChu,
      dieuKhoanKhac,
      thamChieu,
      ngayGiaoDuKien,
      items: itemsConLai,
    };
    if (doiNCC) {
      thayDoi.supplierTen = supplierTen.trim();
      // ⚠️ Đổi tên tự do không tra ra `supplierId` mới trong danh mục — giữ nguyên id cũ để
      // không phá khóa gộp công nợ theo nhà cung cấp bằng một id rác tự sinh ở đây. Đổi hẳn
      // sang một NCC khác trong danh mục là việc lớn hơn, để riêng cho một tính năng khác.
    }
    if (quyen.xemGia && Object.keys(gia).length > 0) {
      /* 🔴 CHỈ giữ giá của dòng CÒN TRONG `itemsConLai` — nút "Xóa dòng" chỉ xóa khỏi `items`,
         `gia` (state riêng, xem NHÓM 2) không tự dọn theo. Gửi cả giá của dòng đã xóa lên là để
         lại một dòng giá "mồ côi", trỏ về `sttDong` không còn tồn tại trong PO nữa. */
      const sttConLai = new Set(itemsConLai.map((d) => d.sttDong));
      thayDoi.gia = {
        lines: Object.entries(gia)
          .filter(([sttDong]) => sttConLai.has(Number(sttDong)))
          .map(([sttDong, donGia]) => ({
            sttDong: Number(sttDong),
            donGia: Number(donGia) || 0,
          })),
      };
    }

    const loi = suaDonHang(po.id, thayDoi, lyDo);
    if (loi) {
      toast.error("Chưa sửa được", { description: loi });
      return;
    }
    toast.success("Đã lưu thay đổi");
    setMo(false);
  }

  if (!duocSua) return null;
  if (po.trangThai === "hoan_thanh" || po.trangThai === "huy") return null;

  return (
    <>
      <Button size="sm" variant="outline" onClick={moHop}>
        <Pencil className="size-4" aria-hidden />
        Sửa đơn hàng
      </Button>

      <Dialog open={mo} onOpenChange={(v: boolean) => !v && setMo(false)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sửa đơn hàng {po.code}</DialogTitle>
            <DialogDescription>
              {laQuanLy
                ? "Bạn là Trưởng bộ phận/quản trị — sửa xong lưu ngay, trừ ngày giao và đổi nhà cung cấp (luôn cần lý do)."
                : "Bạn là người phụ trách đơn này — mọi thay đổi phải ghi lý do để truy vết."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto pr-1">
            {/* NHÓM 1 */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-success-soft uppercase">
                Nhóm 1 — Thông tin hành chính
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-nguoi-lien-he-ncc">Người liên hệ NCC</Label>
                  <Input
                    id="sua-po-nguoi-lien-he-ncc"
                    value={nguoiLienHeNCC}
                    onChange={(e) => setNguoiLienHeNCC(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-dia-chi-ncc">Địa chỉ NCC</Label>
                  <Input id="sua-po-dia-chi-ncc" value={diaChiNCC} onChange={(e) => setDiaChiNCC(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-ma-so-thue-ncc">Mã số thuế NCC</Label>
                  <Input
                    id="sua-po-ma-so-thue-ncc"
                    value={maSoThueNCC}
                    onChange={(e) => setMaSoThueNCC(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-nguoi-nhan-hang">Người nhận hàng</Label>
                  <Input
                    id="sua-po-nguoi-nhan-hang"
                    value={nguoiNhanHangTen}
                    onChange={(e) => setNguoiNhanHangTen(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-sdt-nguoi-nhan">SĐT người nhận</Label>
                  <Input
                    id="sua-po-sdt-nguoi-nhan"
                    value={nguoiNhanHangSdt}
                    onChange={(e) => setNguoiNhanHangSdt(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-dia-diem-giao">Địa điểm giao hàng</Label>
                  <Input
                    id="sua-po-dia-diem-giao"
                    value={diaDiemGiaoHang}
                    onChange={(e) => setDiaDiemGiaoHang(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <Label htmlFor="sua-po-dieu-kien-giao">Điều kiện giao hàng</Label>
                  <Input
                    id="sua-po-dieu-kien-giao"
                    value={dieuKienGiaoHang}
                    onChange={(e) => setDieuKienGiaoHang(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <Label htmlFor="sua-po-ghi-chu-thoi-gian-giao">Ghi chú thời gian giao</Label>
                  <Input
                    id="sua-po-ghi-chu-thoi-gian-giao"
                    value={ghiChuThoiGianGiao}
                    onChange={(e) => setGhiChuThoiGianGiao(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <Label htmlFor="sua-po-ghi-chu-noi-bo">Ghi chú nội bộ</Label>
                  <Input id="sua-po-ghi-chu-noi-bo" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <Label htmlFor="sua-po-dieu-khoan-khac">Điều khoản khác</Label>
                  <Input
                    id="sua-po-dieu-khoan-khac"
                    value={dieuKhoanKhac}
                    onChange={(e) => setDieuKhoanKhac(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-tham-chieu">Tham chiếu</Label>
                  <Input id="sua-po-tham-chieu" value={thamChieu} onChange={(e) => setThamChieu(e.target.value)} />
                </div>
              </div>
            </div>

            {/* NHÓM 2 */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-warning-soft uppercase">
                Nhóm 2 — Sửa có điều kiện
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-ngay-giao">
                    Ngày giao dự kiến
                    {doiNgayGiao && (
                      <span className="ml-1.5 rounded-full bg-warning-bg px-2 py-0.5 text-[10px] font-semibold text-warning-soft">
                        đổi ngày — cần lý do
                      </span>
                    )}
                  </Label>
                  <Input
                    id="sua-po-ngay-giao"
                    type="date"
                    value={ngayGiaoDuKien}
                    onChange={(e) => setNgayGiaoDuKien(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-nha-cung-cap">
                    Nhà cung cấp
                    {doiNCC && (
                      <span className="ml-1.5 rounded-full bg-warning-bg px-2 py-0.5 text-[10px] font-semibold text-warning-soft">
                        đổi NCC — cần lý do
                      </span>
                    )}
                  </Label>
                  <Input
                    id="sua-po-nha-cung-cap"
                    value={supplierTen}
                    onChange={(e) => setSupplierTen(e.target.value)}
                  />
                </div>
              </div>

              <p className="mt-1 text-xs font-semibold text-text-secondary">Mặt hàng / số lượng</p>
              <div className="flex flex-col gap-1.5">
                {items.map((d, idx) => {
                  if (!laDongHang(d)) return null;
                  const khoa = dongDaNhan.has(d.sttDong);
                  return (
                    <div
                      key={d.sttDong}
                      className={`flex flex-col gap-1.5 rounded-lg border p-2 sm:flex-row sm:items-center sm:gap-2 ${
                        khoa ? "border-dashed border-border bg-muted/40" : "border-border"
                      }`}
                    >
                      <Input
                        className="sm:flex-1"
                        value={d.tenVatLieu}
                        disabled={khoa}
                        placeholder="Tên hàng"
                        aria-label={`Tên hàng dòng ${idx + 1}`}
                        onChange={(e) =>
                          setItems((truoc) =>
                            truoc.map((x, i) => (i === idx ? { ...x, tenVatLieu: e.target.value } : x)),
                          )
                        }
                      />
                      <Input
                        className="sm:w-24"
                        value={d.donViTinh}
                        disabled={khoa}
                        placeholder="ĐVT"
                        aria-label={`Đơn vị tính dòng ${idx + 1}`}
                        onChange={(e) =>
                          setItems((truoc) =>
                            truoc.map((x, i) => (i === idx ? { ...x, donViTinh: e.target.value } : x)),
                          )
                        }
                      />
                      <Input
                        className="sm:w-28"
                        type="number"
                        value={d.khoiLuongDat}
                        disabled={khoa}
                        placeholder="Số lượng"
                        aria-label={`Số lượng dòng ${idx + 1}`}
                        onChange={(e) =>
                          setItems((truoc) =>
                            truoc.map((x, i) =>
                              i === idx ? { ...x, khoiLuongDat: Number(e.target.value) || 0 } : x,
                            ),
                          )
                        }
                      />
                      {quyen.xemGia && (
                        <Input
                          className="sm:w-28"
                          type="number"
                          value={gia[d.sttDong] ?? ""}
                          placeholder="Đơn giá"
                          aria-label={`Đơn giá dòng ${idx + 1}`}
                          disabled={!!po.xacNhanTruongBP}
                          onChange={(e) =>
                            setGia((truoc) => ({ ...truoc, [d.sttDong]: e.target.value }))
                          }
                        />
                      )}
                      {!khoa && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="shrink-0 text-text-desc hover:bg-danger-bg hover:text-danger"
                          aria-label={`Xóa dòng ${idx + 1}`}
                          title="Xóa dòng"
                          onClick={() => {
                            setItems((truoc) => truoc.filter((_, i) => i !== idx));
                            /* 🔴 DỌN LUÔN `gia[sttDong]` — nếu không, "Thêm dòng mới" ngay sau đó
                               (sttKeTiep = max(sttDong còn lại) + 1) HOÀN TOÀN có thể trùng đúng
                               `sttDong` vừa xóa (vd xóa dòng có stt cao nhất rồi thêm dòng mới),
                               khi đó ô Đơn giá của dòng MẶT HÀNG MỚI sẽ tự hiện lại giá của dòng
                               ĐÃ XÓA (đọc `gia[d.sttDong]` ở ô Đơn giá bên dưới) — gán nhầm giá
                               sang một mặt hàng khác hẳn mà người dùng chưa hề gõ gì. Bộ lọc "giá
                               mồ côi" (sttConLai) ở `sua()`/`suaDonHang` KHÔNG bắt được ca này vì
                               sttDong đó vẫn hợp lệ, chỉ là đã đổi chủ. */
                            setGia((truoc) => {
                              const con = { ...truoc };
                              delete con[d.sttDong];
                              return con;
                            });
                          }}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      )}
                      {khoa && (
                        <span
                          className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-text-desc"
                          title="Đã có phiếu nhận hàng — khóa mặt hàng/số lượng dòng này"
                        >
                          <Lock className="size-3.5" aria-hidden />
                          đã nhận
                        </span>
                      )}
                    </div>
                  );
                })}
                <Button size="sm" variant="outline" className="w-fit" onClick={themDongMoi}>
                  <Plus className="size-4" aria-hidden />
                  Thêm dòng mới
                </Button>
                {po.xacNhanTruongBP && quyen.xemGia && (
                  <p className="text-xs text-text-desc">
                    Đã xác nhận hoàn thành — khóa sửa đơn giá.
                  </p>
                )}
              </div>
            </div>

            {/* NHÓM 3 */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-text-desc uppercase">
                Nhóm 3 — Không sửa qua đây
              </p>
              <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/40 p-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-ma-po" className="flex items-center gap-1.5">
                    Mã PO <Lock className="size-3" aria-hidden />
                  </Label>
                  <Input id="sua-po-ma-po" value={po.code} disabled />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-ma-du-an" className="flex items-center gap-1.5">
                    Mã dự án <Lock className="size-3" aria-hidden />
                  </Label>
                  <Input id="sua-po-ma-du-an" value={po.maDuAn} disabled />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-de-nghi-nguon" className="flex items-center gap-1.5">
                    Đề nghị nguồn <Lock className="size-3" aria-hidden />
                  </Label>
                  <Input id="sua-po-de-nghi-nguon" value={po.prCode ?? "Không gắn đề nghị"} disabled />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-trang-thai" className="flex items-center gap-1.5">
                    Trạng thái <Lock className="size-3" aria-hidden />
                  </Label>
                  <Input id="sua-po-trang-thai" value={po.trangThai} disabled />
                </div>
              </div>
            </div>

            {batBuocLyDo && (
              <div className="flex flex-col gap-1.5 rounded-lg border border-warning/40 bg-warning-bg/60 p-3">
                <Label htmlFor="ly-do-sua-po">Lý do sửa (bắt buộc)</Label>
                <Textarea
                  id="ly-do-sua-po"
                  value={lyDo}
                  onChange={(e) => setLyDo(e.target.value)}
                  placeholder="VD: NCC báo giá lại do biến động giá thép tuần này…"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMo(false)}>
              <Undo2 className="size-4" aria-hidden />
              Hủy
            </Button>
            <Button onClick={sua}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
