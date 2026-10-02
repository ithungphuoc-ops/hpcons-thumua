"use client";

// ============================================================
// MÀN DANH MỤC NHÀ CUNG CẤP — xem, xuất Excel, nhập Excel
//
// ★ Sếp 02/10/2026: *"Thêm tab danh sách nhà cung cấp có chức năng xuất file excel và import file"*.
// Trước đó danh mục chỉ nằm trong ô sổ xuống của form lập PO — không có chỗ nào xem cả danh sách.
//
// 🔴 CHỈ VẼ. Đọc/ghi Excel và luật trùng ở `2-quy-trinh/danh-muc-ncc-excel.ts`; thêm hàng loạt ở
// `kho-du-lieu.tsx` → `themNhieuNhaCungCap` (tầng ghi phân loại lại, không tin bản xem trước này).
// 📌 Quyền: vào màn = `xemNhaCungCap` (chặn ở `quyen.ts` → `duocVaoDuongDan`); nhập / xoá =
//    `lapPO` — cùng người vốn thêm, xoá NCC được ở form lập PO.
// ★ Sếp 02/10/2026 (lượt 2): *"Mã này là MST, sửa lại"* (cột Mã NCC NC0001 → Mã số thuế), *"Thêm
//   cột ghi chú"*, *"Thêm nút thêm thông tin NCC khác"* — nút "Thêm nhà cung cấp" ngay tại màn này
//   (trước đó chỉ thêm được trong form lập PO). Cùng một tầng ghi `themNhaCungCap` với form đó, nên
//   mã `NC0000` vẫn cấp đúng một chỗ.
// 🔴 Toast chỉ nói SỐ LƯỢNG, không nói tên NCC (luật không ghi tên NCC ra chỗ chung, §7).
// ============================================================

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Building2, FileSpreadsheet, Plus, Trash2, Upload } from "lucide-react";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { useDonDepHopThoaiKet } from "@/1-giao-dien/thanh-phan-dung-chung/don-dep-hop-thoai-ket";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/1-giao-dien/nen-tang-ui/table";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { duongDanGocTheoQuyen } from "@/2-quy-trinh/dieu-huong";
import { lamSachTenTep } from "@/2-quy-trinh/xuat-don-hang-excel";
import {
  docNCCTuExcel,
  phanLoaiNhapNCC,
  xuatDanhMucNCCExcel,
  type KetQuaDongNhap,
} from "@/2-quy-trinh/danh-muc-ncc-excel";
import type { NhaCungCap } from "@/3-du-lieu/kieu-du-lieu";

const NUT =
  "inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-primary-bg hover:text-primary disabled:opacity-50 md:min-h-9";

export default function TrangNhaCungCap() {
  const { nhaCungCap, donHang, themNhieuNhaCungCap, xoaNhaCungCap } = useDuLieu();
  const [moThem, setMoThem] = useState(false);
  const { quyen, nguoiDung } = useNguoiDung();
  const chonTep = useRef<HTMLInputElement>(null);
  const [dangXuat, setDangXuat] = useState(false);
  const [xemTruoc, setXemTruoc] = useState<{
    tenTep: string;
    ketQua: KetQuaDongNhap[];
    cotDoc: string[];
    cotThieu: string[];
  } | null>(null);
  const [dangNhap, setDangNhap] = useState(false);
  const [hoiXoa, setHoiXoa] = useState<NhaCungCap | null>(null);

  const ds = useMemo(
    () => [...nhaCungCap].sort((a, b) => (a.maNCC ?? "").localeCompare(b.maNCC ?? "")),
    [nhaCungCap],
  );
  const soDonTheoNCC = useMemo(() => {
    const m = new Map<string, number>();
    for (const po of donHang) if (po.supplierId) m.set(po.supplierId, (m.get(po.supplierId) ?? 0) + 1);
    return m;
  }, [donHang]);

  async function xuat() {
    setDangXuat(true);
    try {
      const blob = await xuatDanhMucNCCExcel(ds, nguoiDung.tenHienThi);
      const a = document.createElement("a");
      const diaChi = URL.createObjectURL(blob);
      a.href = diaChi;
      a.download = lamSachTenTep(`Danh-muc-NCC_${new Date().toISOString().slice(0, 10)}`) + ".xlsx";
      a.click();
      setTimeout(() => URL.revokeObjectURL(diaChi), 5000);
      toast.success(`Đã tải danh mục ${ds.length} nhà cung cấp`);
    } catch (e) {
      toast.error("Chưa tạo được tệp Excel", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setDangXuat(false);
    }
  }

  async function docTep(tep: File) {
    try {
      const { dong, cotDoc, cotThieu } = await docNCCTuExcel(await tep.arrayBuffer());
      if (dong.length === 0) {
        toast.error("File không có dòng nhà cung cấp nào dưới dòng tiêu đề.");
        return;
      }
      setXemTruoc({ tenTep: tep.name, ketQua: phanLoaiNhapNCC(dong, nhaCungCap), cotDoc, cotThieu });
    } catch (e) {
      toast.error("Chưa đọc được file", { description: e instanceof Error ? e.message : String(e) });
    }
  }

  const soMoi = xemTruoc?.ketQua.filter((k) => k.loai === "moi").length ?? 0;

  async function xacNhanNhap() {
    if (!xemTruoc) return;
    setDangNhap(true);
    try {
      const { daThem, boQua, loi } = await themNhieuNhaCungCap(
        xemTruoc.ketQua.filter((k) => k.loai === "moi").map((k) => k.dong),
      );
      if (loi) {
        toast.error(loi);
        return;
      }
      const tongBoQua = xemTruoc.ketQua.length - soMoi + boQua;
      toast.success(`Đã thêm ${daThem} nhà cung cấp`, {
        description: tongBoQua > 0 ? `Bỏ qua ${tongBoQua} dòng trùng hoặc lỗi.` : undefined,
      });
      setXemTruoc(null);
    } finally {
      setDangNhap(false);
    }
  }

  function xoa() {
    if (!hoiXoa) return;
    const loi = xoaNhaCungCap(hoiXoa.id);
    if (loi) toast.error(loi);
    else toast.success("Đã xoá nhà cung cấp khỏi danh mục");
    setHoiXoa(null);
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Thu mua", href: duongDanGocTheoQuyen(quyen) }, { label: "Nhà cung cấp" }]}
        title="Danh mục nhà cung cấp"
        description={`${ds.length} nhà cung cấp`}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={xuat} disabled={dangXuat} className={NUT}>
              <FileSpreadsheet className="size-4 shrink-0" aria-hidden />
              {dangXuat ? "Đang tạo tệp…" : "Xuất Excel"}
            </button>
            {quyen.lapPO && (
              <>
                <button type="button" onClick={() => setMoThem(true)} className={NUT}>
                  <Plus className="size-4 shrink-0" aria-hidden />
                  Thêm nhà cung cấp
                </button>
                <button type="button" onClick={() => chonTep.current?.click()} className={NUT}>
                  <Upload className="size-4 shrink-0" aria-hidden />
                  Nhập Excel
                </button>
                <input
                  ref={chonTep}
                  type="file"
                  accept=".xlsx"
                  hidden
                  onChange={(e) => {
                    const tep = e.target.files?.[0];
                    e.target.value = "";
                    if (tep) void docTep(tep);
                  }}
                />
              </>
            )}
          </div>
        }
      />

      {ds.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Danh mục đang trống"
          description={
            quyen.lapPO
              ? "Bấm “Thêm nhà cung cấp” để thêm từng bên, hoặc “Xuất Excel” lấy tệp mẫu đúng cột, điền rồi bấm “Nhập Excel”."
              : "Chưa có nhà cung cấp nào trong danh mục."
          }
        />
      ) : (
        <Card>
          <CardContent>
            <div className="thanh-keo-ngang-ro hidden overflow-x-auto md:block [&>[data-slot=table-container]]:overflow-visible">
              <Table className="min-w-[72rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14 text-center">STT</TableHead>
                    <TableHead className="w-36 text-center">Mã số thuế</TableHead>
                    <TableHead>Tên nhà cung cấp</TableHead>
                    <TableHead>Địa chỉ</TableHead>
                    <TableHead className="w-32 text-center">Điện thoại</TableHead>
                    <TableHead className="w-48">Người liên hệ</TableHead>
                    <TableHead className="w-56">Ghi chú</TableHead>
                    <TableHead className="w-20 text-center">Số đơn</TableHead>
                    {quyen.lapPO && <TableHead className="w-16 text-center">Xoá</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ds.map((n, i) => (
                    <TableRow key={n.id}>
                      <TableCell className="text-center tabular-nums">{i + 1}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums">{n.maSoThue}</TableCell>
                      <TableCell className="text-sm font-medium">{n.ten}</TableCell>
                      <TableCell className="text-sm">{n.diaChi}</TableCell>
                      <TableCell className="text-center text-sm">{n.dienThoai}</TableCell>
                      <TableCell className="text-sm">{n.nguoiLienHe}</TableCell>
                      <TableCell className="text-sm">{n.ghiChu}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums">{soDonTheoNCC.get(n.id) ?? 0}</TableCell>
                      {quyen.lapPO && (
                        <TableCell className="text-center">
                          <button
                            type="button"
                            onClick={() => setHoiXoa(n)}
                            aria-label={`Xoá ${n.ten} khỏi danh mục`}
                            title="Xoá khỏi danh mục"
                            className="inline-flex size-9 items-center justify-center rounded-lg text-text-desc transition-colors hover:bg-danger-bg hover:text-danger-soft"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Card List — Mobile */}
            <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
              {ds.map((n) => (
                <div key={n.id} className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-text-primary">{n.ten}</span>
                    {n.maSoThue && <span className="shrink-0 text-xs text-text-desc">MST {n.maSoThue}</span>}
                  </div>
                  {n.diaChi && <span className="text-sm text-text-secondary">{n.diaChi}</span>}
                  {(n.dienThoai || n.nguoiLienHe) && (
                    <span className="text-sm text-text-secondary">
                      {[n.nguoiLienHe, n.dienThoai].filter(Boolean).join(" · ")}
                    </span>
                  )}
                  {n.ghiChu && <span className="text-sm text-text-desc italic">{n.ghiChu}</span>}
                  {quyen.lapPO && (
                    <button
                      type="button"
                      onClick={() => setHoiXoa(n)}
                      className="mt-1 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-text-secondary"
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Xoá khỏi danh mục
                    </button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== Xem trước khi nhập — chỉ đạo 17/08/2026: có bước xem trước, báo đúng dòng trong file =====
          🔴 KHÔNG dùng `HopXacNhan`: hộp đó ĐÓNG ngay khi bấm Đồng ý (rồi mới chạy việc), nên khoá
          "Đang thêm…" không bao giờ có tác dụng, và nó rộng có `sm:max-w-md` — bảng 4 cột chật cứng
          (phản biện 02/10/2026). Hộp này chỉ đóng SAU KHI nhập xong. */}
      <HopThemNCC mo={moThem} onDong={() => setMoThem(false)} />

      <HopXemTruocNhap
        xemTruoc={xemTruoc}
        soMoi={soMoi}
        dangNhap={dangNhap}
        onDong={() => !dangNhap && setXemTruoc(null)}
        onNhap={() => void xacNhanNhap()}
      />

      <HopXacNhan
        mo={hoiXoa !== null}
        tieuDe="Xoá nhà cung cấp khỏi danh mục?"
        moTa={
          hoiXoa && (
            <>
              <strong>{hoiXoa.ten}</strong> sẽ không còn trong ô chọn nhà cung cấp. Đơn đã lập không đổi.
            </>
          )
        }
        nhanDongY="Xoá"
        nguyHiem
        onDong={() => setHoiXoa(null)}
        onDongY={xoa}
      />
    </>
  );
}

function HopXemTruocNhap({
  xemTruoc,
  soMoi,
  dangNhap,
  onDong,
  onNhap,
}: {
  xemTruoc: { tenTep: string; ketQua: KetQuaDongNhap[]; cotDoc: string[]; cotThieu: string[] } | null;
  soMoi: number;
  dangNhap: boolean;
  onDong: () => void;
  onNhap: () => void;
}) {
  const mo = xemTruoc !== null;
  useDonDepHopThoaiKet(mo);
  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nhập nhà cung cấp từ file Excel</DialogTitle>
          {xemTruoc && (
            <DialogDescription>
              Tệp <strong>{xemTruoc.tenTep}</strong>: {xemTruoc.ketQua.length} dòng — <strong>{soMoi}</strong>{" "}
              thêm mới, {xemTruoc.ketQua.length - soMoi} bỏ qua. Dòng trùng mã số thuế hoặc trùng tên với danh
              mục được bỏ qua, không ghi đè thông tin đang có.
            </DialogDescription>
          )}
        </DialogHeader>

        {xemTruoc && (
          <>
            {/* Nói rõ cột nào đã nhận ra: tiêu đề cột lệch chữ thì dữ liệu cột đó im lặng thành trống
                (phản biện 02/10/2026) — người dùng phải thấy TRƯỚC khi bấm nhập. */}
            <p className="text-sm text-text-secondary">
              Đã nhận ra cột: {xemTruoc.cotDoc.join(" · ")}.
            </p>
            {xemTruoc.cotThieu.length > 0 && (
              <p className="rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
                Không thấy cột: <strong>{xemTruoc.cotThieu.join(" · ")}</strong> — các ô đó sẽ để trống. Nếu
                file có cột này dưới tên khác, đổi tiêu đề cho giống tệp “Xuất Excel” rồi nhập lại.
              </p>
            )}
            <div className="thanh-cuon-doc-ro max-h-80 overflow-y-auto rounded-lg border border-border">
              <Table className="[&_td]:whitespace-normal">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">Dòng</TableHead>
                    <TableHead>Tên nhà cung cấp</TableHead>
                    <TableHead className="w-36">Mã số thuế</TableHead>
                    <TableHead className="w-48">Kết quả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {xemTruoc.ketQua.map((k) => (
                    <TableRow key={k.dong.dongTrongFile}>
                      <TableCell className="text-center text-sm tabular-nums">{k.dong.dongTrongFile}</TableCell>
                      <TableCell className="text-sm">{k.dong.ten || "—"}</TableCell>
                      <TableCell className="text-sm tabular-nums">{k.dong.maSoThue}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <StatusBadge
                            label={k.loai === "moi" ? "Thêm mới" : k.loai === "trung" ? "Bỏ qua — trùng" : "Lỗi"}
                            tone={k.loai === "moi" ? "success" : k.loai === "trung" ? "warning" : "danger"}
                            className="w-fit"
                          />
                          {k.loai !== "moi" && <span className="text-xs text-text-desc">{k.lyDo}</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {soMoi === 0 && <p className="text-xs text-warning-soft">Không có dòng nào để thêm mới.</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onDong} disabled={dangNhap}>
            Hủy
          </Button>
          <Button onClick={onNhap} disabled={dangNhap || soMoi === 0}>
            {dangNhap ? "Đang thêm…" : `Thêm ${soMoi} nhà cung cấp`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const NCC_TRONG = { ten: "", maSoThue: "", diaChi: "", dienThoai: "", nguoiLienHe: "", ghiChu: "" };

/**
 * ★ HỘP "THÊM NHÀ CUNG CẤP" — Sếp 02/10/2026: *"Thêm nút thêm thông tin NCC khác"*.
 *
 * 📌 Soát trùng bằng ĐÚNG luật của nhập Excel (`phanLoaiNhapNCC`: trùng MST / trùng tên / MST sai
 * dạng) trước khi ghi — thêm tay và thêm bằng file phải chặn như nhau, nếu không một đường thành lối
 * né đường kia. Ghi qua `themNhaCungCap` (cùng tầng ghi với form lập PO), mã `NC0000` cấp ở đó.
 */
function HopThemNCC({ mo, onDong }: { mo: boolean; onDong: () => void }) {
  const { nhaCungCap, themNhaCungCap } = useDuLieu();
  const [ncc, setNcc] = useState(NCC_TRONG);
  const [dangLuu, setDangLuu] = useState(false);
  useDonDepHopThoaiKet(mo);

  const dong = () => {
    if (dangLuu) return;
    setNcc(NCC_TRONG);
    onDong();
  };

  async function luu() {
    const [kq] = phanLoaiNhapNCC([{ ...ncc, dongTrongFile: 1 }], nhaCungCap);
    if (kq.loai !== "moi") {
      toast.error("Chưa thêm được", { description: kq.lyDo });
      return;
    }
    setDangLuu(true);
    try {
      const r = await themNhaCungCap(kq.dong);
      if ("loi" in r) {
        toast.error("Chưa thêm được", { description: r.loi });
        return;
      }
      /* Toast không nêu tên NCC (luật §7) — nêu mã số thuế nếu có. */
      toast.success(kq.dong.maSoThue ? `Đã thêm nhà cung cấp MST ${kq.dong.maSoThue}` : "Đã thêm nhà cung cấp");
      setNcc(NCC_TRONG);
      onDong();
    } finally {
      setDangLuu(false);
    }
  }

  const o = (khoa: keyof typeof NCC_TRONG, nhan: string, goiY: string, rong = false) => (
    <div className={`flex min-w-0 flex-col gap-1.5 ${rong ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={`ncc-them-${khoa}`}>{nhan}</Label>
      <Input
        id={`ncc-them-${khoa}`}
        value={ncc[khoa]}
        placeholder={goiY}
        onChange={(e) => setNcc((c) => ({ ...c, [khoa]: e.target.value }))}
        className="h-11 md:h-9"
      />
    </div>
  );

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && dong()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm nhà cung cấp</DialogTitle>
          <DialogDescription>
            Trùng mã số thuế hoặc trùng tên với danh mục thì không thêm được. Mã nội bộ do app tự cấp.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {o("ten", "Tên nhà cung cấp *", "CÔNG TY TNHH …", true)}
          {o("maSoThue", "Mã số thuế", "0300000005")}
          {o("dienThoai", "Điện thoại", "0280000000")}
          {o("diaChi", "Địa chỉ", "Số nhà, đường, phường, tỉnh/thành", true)}
          {o("nguoiLienHe", "Người liên hệ", "Họ tên · số điện thoại")}
          {o("ghiChu", "Ghi chú", "Ví dụ: chỉ nhận chuyển khoản")}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={dong} disabled={dangLuu}>
            Hủy
          </Button>
          <Button onClick={() => void luu()} disabled={dangLuu || ncc.ten.trim() === ""}>
            {dangLuu ? "Đang thêm…" : "Thêm nhà cung cấp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
