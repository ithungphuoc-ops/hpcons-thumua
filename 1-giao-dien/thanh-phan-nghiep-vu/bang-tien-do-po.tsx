"use client";

import { useMemo, useState } from "react";
import { PackageCheck, Plus } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/1-giao-dien/nen-tang-ui/table";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { ThanhTienDo } from "@/1-giao-dien/thanh-phan-nghiep-vu/thanh-tien-do";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { tinhTienDoPO } from "@/2-quy-trinh/tinh-toan";
import { NHAN_TRANG_THAI_PHIEU } from "@/2-quy-trinh/trang-thai";
import type { DonDatHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * M5 — Bảng tiến độ nhận hàng của một PO, có CỘT ĐỘNG theo từng lần giao.
 *
 * Đây là thứ bản thumua-next cũ KHÔNG có: bản cũ chỉ cộng dồn `receivedQuantity`
 * trên dòng PO nên mất ngày nhận từng lần. Yêu cầu số 1 của Ban lãnh đạo:
 * "ngày 06/08 nhận 10/20 bao xi măng".
 *
 * Quy tắc: CHỈ phiếu ở trạng thái "đã nhập kho" được tính vào khối lượng đã nhận.
 */
export function BangTienDoPO({ po }: { po: DonDatHang }) {
  const { phieuNhan, themPhieuNhan } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  const [moForm, setMoForm] = useState(false);
  const [ngayNhan, setNgayNhan] = useState(new Date().toISOString().slice(0, 10));
  const [soPhieuNCC, setSoPhieuNCC] = useState("");
  const [khoiLuong, setKhoiLuong] = useState<Record<number, string>>({});

  const phieuCuaPO = useMemo(
    () => phieuNhan.filter((p) => p.poId === po.id).sort((a, b) => a.lanGiaoThu - b.lanGiaoThu),
    [phieuNhan, po.id],
  );
  const tienDo = useMemo(() => tinhTienDoPO(po, phieuCuaPO), [po, phieuCuaPO]);

  /** Các lần giao ĐÃ NHẬP KHO — thành cột động trong bảng. */
  const lanGiaoDaTinh = phieuCuaPO.filter((p) => p.trangThai === "da_nhap_kho");
  const phieuChoKiemTra = phieuCuaPO.filter((p) => p.trangThai === "cho_kiem_tra");

  function luuPhieu() {
    const lines = po.items
      .map((d) => ({ sttDongPO: d.sttDong, khoiLuongThucNhan: Number(khoiLuong[d.sttDong] ?? 0) }))
      .filter((l) => l.khoiLuongThucNhan > 0);
    if (lines.length === 0) return;

    themPhieuNhan({
      poId: po.id,
      poCode: po.code,
      ngayNhanThucTe: ngayNhan,
      nguoiNhanUid: nguoiDung.uid,
      nguoiNhanTen: nguoiDung.tenHienThi,
      soPhieuGiaoNCC: soPhieuNCC || undefined,
      trangThai: "da_nhap_kho",
      lines,
    });
    setKhoiLuong({});
    setSoPhieuNCC("");
    setMoForm(false);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-h3 text-text-primary">Tiến độ nhận hàng</h2>
          {quyen.ghiPhieuNhanHang && po.trangThai !== "hoan_thanh" && po.trangThai !== "huy" && (
            <Button size="sm" onClick={() => setMoForm((v) => !v)}>
              <Plus className="size-4" aria-hidden />
              Ghi phiếu nhận hàng lần {phieuCuaPO.length + 1}
            </Button>
          )}
        </div>

        {/* Form ghi phiếu nhận hàng — chỉ thủ kho (apps.kh >= 2) */}
        {moForm && (
          <div className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-primary-bg/40 p-4">
            <p className="text-sm font-semibold text-text-primary">
              Phiếu nhận hàng lần {phieuCuaPO.length + 1} — nhập khối lượng CỦA LẦN NÀY, không phải cộng dồn
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ngay-nhan">Ngày nhận thực tế</Label>
                <Input
                  id="ngay-nhan"
                  type="date"
                  value={ngayNhan}
                  onChange={(e) => setNgayNhan(e.target.value)}
                  className="w-44"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="so-phieu-ncc">Số phiếu giao của NCC</Label>
                <Input
                  id="so-phieu-ncc"
                  value={soPhieuNCC}
                  onChange={(e) => setSoPhieuNCC(e.target.value)}
                  placeholder="HT-2026-08-0412"
                  className="w-56"
                />
              </div>
            </div>
            <div className="flex flex-col gap-(--hp-md-row-gap)">
              {tienDo.map((d) => (
                <div key={d.sttDong} className="flex flex-wrap items-end gap-4">
                  <div className="flex min-w-56 flex-col gap-2">
                    <Label htmlFor={`kl-${d.sttDong}`}>
                      {d.tenVatLieu} ({d.donViTinh})
                    </Label>
                    <Input
                      id={`kl-${d.sttDong}`}
                      type="number"
                      min={0}
                      max={d.khoiLuongConLai}
                      value={khoiLuong[d.sttDong] ?? ""}
                      onChange={(e) => setKhoiLuong((t) => ({ ...t, [d.sttDong]: e.target.value }))}
                      placeholder="0"
                      className="w-40"
                    />
                  </div>
                  <span className="pb-2 text-xs text-text-desc">
                    còn lại {d.khoiLuongConLai.toLocaleString("vi-VN")} {d.donViTinh}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={luuPhieu}>
                <PackageCheck className="size-4" aria-hidden />
                Lưu phiếu &amp; nhập kho
              </Button>
              <Button variant="ghost" onClick={() => setMoForm(false)}>
                Hủy
              </Button>
            </div>
          </div>
        )}

        {/* Bảng tiến độ — Desktop/Tablet */}
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-right">Dòng</TableHead>
                <TableHead>Vật liệu</TableHead>
                <TableHead>ĐVT</TableHead>
                <TableHead className="text-right">Đặt</TableHead>
                {lanGiaoDaTinh.map((p) => (
                  <TableHead key={p.id} className="text-right whitespace-nowrap">
                    {new Date(p.ngayNhanThucTe).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                  </TableHead>
                ))}
                <TableHead className="text-right">Đã nhận</TableHead>
                <TableHead className="text-right">Còn lại</TableHead>
                <TableHead>Tiến độ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tienDo.map((d) => (
                <TableRow key={d.sttDong}>
                  <TableCell className="text-right text-text-desc">{d.sttDong}</TableCell>
                  <TableCell className="font-medium">{d.tenVatLieu}</TableCell>
                  <TableCell>{d.donViTinh}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {d.khoiLuongDat.toLocaleString("vi-VN")}
                  </TableCell>
                  {lanGiaoDaTinh.map((p) => {
                    const line = p.lines.find((l) => l.sttDongPO === d.sttDong);
                    return (
                      <TableCell key={p.id} className="text-right">
                        {line ? line.khoiLuongThucNhan.toLocaleString("vi-VN") : "—"}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right font-semibold">
                    {d.khoiLuongDaNhan.toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${d.khoiLuongConLai > 0 ? "text-warning-soft" : "text-success-soft"}`}
                  >
                    {d.khoiLuongConLai.toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <ThanhTienDo
                      phanTram={d.phanTram}
                      tong={d.khoiLuongConLai === 0 ? "success" : "primary"}
                      nhan={
                        d.khoiLuongConLai === 0 ? "Đã nhận đủ" : `${Math.round(d.phanTram)}% — còn thiếu`
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Card List — Mobile */}
        <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
          {tienDo.map((d) => (
            <div key={d.sttDong} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
              <span className="text-sm font-semibold text-text-primary">
                {d.sttDong}. {d.tenVatLieu}
              </span>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-desc">Đặt</span>
                <span className="font-semibold">
                  {d.khoiLuongDat.toLocaleString("vi-VN")} {d.donViTinh}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-desc">Đã nhận</span>
                <span className="font-semibold">{d.khoiLuongDaNhan.toLocaleString("vi-VN")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-desc">Còn lại</span>
                <span className={d.khoiLuongConLai > 0 ? "font-semibold text-warning-soft" : "font-semibold text-success-soft"}>
                  {d.khoiLuongConLai.toLocaleString("vi-VN")}
                </span>
              </div>
              <ThanhTienDo
                phanTram={d.phanTram}
                tong={d.khoiLuongConLai === 0 ? "success" : "primary"}
                nhan={d.khoiLuongConLai === 0 ? "Đã nhận đủ" : `${Math.round(d.phanTram)}%`}
              />
              {d.theoLanGiao.length > 0 && (
                <ul className="flex flex-col gap-0.5 border-t border-divider pt-2 text-xs text-text-desc">
                  {d.theoLanGiao.map((l) => (
                    <li key={l.lanGiaoThu}>
                      Lần {l.lanGiaoThu} · {new Date(l.ngayNhan).toLocaleDateString("vi-VN")} ·{" "}
                      {l.khoiLuong.toLocaleString("vi-VN")} {d.donViTinh}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Lịch sử phiếu nhận hàng */}
        <div className="flex flex-col gap-2 border-t border-divider pt-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Phiếu nhận hàng ({phieuCuaPO.length} lần giao)
          </h3>
          {phieuCuaPO.length === 0 ? (
            <p className="text-sm text-text-desc">Chưa có lần giao nào.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {phieuCuaPO.map((p) => {
                const tt = NHAN_TRANG_THAI_PHIEU[p.trangThai];
                return (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-surface p-(--hp-md-row-pad)"
                  >
                    <span className="text-sm font-medium text-text-primary">Lần {p.lanGiaoThu}</span>
                    <span className="text-sm text-text-secondary">
                      {new Date(p.ngayNhanThucTe).toLocaleDateString("vi-VN")}
                    </span>
                    <span className="text-xs text-text-desc">{p.code}</span>
                    {p.soPhieuGiaoNCC && (
                      <span className="text-xs text-text-desc">Phiếu NCC: {p.soPhieuGiaoNCC}</span>
                    )}
                    <StatusBadge label={tt.nhan} tone={tt.tong} className="ml-auto" />
                    {p.ghiChuTinhTrangHang && (
                      <p className="w-full text-xs text-warning-soft">{p.ghiChuTinhTrangHang}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {phieuChoKiemTra.length > 0 && (
            <p className="rounded-lg bg-warning-bg px-3 py-2 text-xs text-warning-soft">
              Có {phieuChoKiemTra.length} phiếu đang chờ kiểm tra — khối lượng CHƯA được tính vào &quot;đã
              nhận&quot; để tránh báo tiến độ ảo.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
