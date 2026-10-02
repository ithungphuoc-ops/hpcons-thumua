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
// ★ Sếp 02/10/2026 (lượt 3): *"Thêm trường để nhân viên có thể tự thêm và nhóm được NCC theo mong
//   muốn. Ví dụ: NCC chuyên cung cấp VLXD, NCC chuyên cung cấp bê tông.."*. Sếp chốt: một NCC thuộc
//   được NHIỀU nhóm; nhập Excel vẫn bỏ qua nguyên dòng trùng — gán nhóm cho NCC đã có làm TẠI MÀN NÀY.
//   → cột "Nhóm", hàng LỌC theo nhóm (một NCC nhiều nhóm nên lọc, không gom khối), tick chọn nhiều
//   dòng rồi "Thêm vào nhóm" / "Bỏ khỏi nhóm", "Đổi tên nhóm" khi đang lọc một nhóm. Luật tách /
//   gộp / chuẩn hoá ở `2-quy-trinh/nhom-nha-cung-cap.ts`; ghi qua `datNhomNCC` / `doiTenNhomNCC`
//   (kiểm quyền `lapPO` ngay ở tầng ghi).
// 🔴 Toast chỉ nói SỐ LƯỢNG (và tên NHÓM, MST), không nói tên NCC (luật không ghi tên NCC ra chỗ
//    chung, §7).
// ============================================================

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  FileSpreadsheet,
  FolderMinus,
  FolderPlus,
  PencilLine,
  Plus,
  Tags,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
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
import {
  coTrongNhom,
  gonTenNhom,
  khoaNhom,
  LOC_TAT_CA,
  locNCCTheoNhom,
  lyDoTenNhomKhongHop,
  noiNhomNCC,
  tachNhomNCC,
  thongKeNhomNCC,
  type LocNhomNCC,
  type ThongKeNhom,
} from "@/2-quy-trinh/nhom-nha-cung-cap";
import type { NhaCungCap } from "@/3-du-lieu/kieu-du-lieu";

const NUT =
  "inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-primary-bg hover:text-primary disabled:opacity-50 md:min-h-9";

/** Nút của hàng lọc theo nhóm — có CHỮ và số lượng, đang chọn thì đổi viền + nền (không chỉ màu). */
function NutLoc({ dangChon, nhan, onClick }: { dangChon: boolean; nhan: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={dangChon}
      onClick={onClick}
      className={`inline-flex min-h-11 max-w-full items-center rounded-full border px-3 text-left text-sm font-medium transition-colors md:min-h-8 ${
        dangChon
          ? "border-primary bg-primary-bg font-semibold text-primary"
          : "border-border text-text-secondary hover:bg-muted"
      }`}
    >
      {nhan}
    </button>
  );
}

/** Nhãn nhóm của một NCC — mỗi nhóm một nhãn có chữ. */
function NhanNhom({ nhom }: { nhom?: readonly string[] }) {
  const ds = tachNhomNCC(nhom);
  if (ds.length === 0) return <span className="text-xs text-text-desc">Chưa phân nhóm</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {ds.map((t) => (
        <StatusBadge key={khoaNhom(t)} label={t} tone="neutral" className="h-auto whitespace-normal text-left" />
      ))}
    </div>
  );
}

export default function TrangNhaCungCap() {
  const { nhaCungCap, donHang, themNhieuNhaCungCap, xoaNhaCungCap, datNhomNCC, doiTenNhomNCC } = useDuLieu();
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
  /* ★ Nhóm NCC (Sếp 02/10/2026). */
  const [loc, setLoc] = useState<LocNhomNCC>(LOC_TAT_CA);
  const [chon, setChon] = useState<string[]>([]);
  const [oNhom, setONhom] = useState("");
  const [doiTen, setDoiTen] = useState<{ tenCu: string; tenMoi: string } | null>(null);

  const ds = useMemo(
    () => [...nhaCungCap].sort((a, b) => (a.maNCC ?? "").localeCompare(b.maNCC ?? "")),
    [nhaCungCap],
  );
  const soDonTheoNCC = useMemo(() => {
    const m = new Map<string, number>();
    for (const po of donHang) if (po.supplierId) m.set(po.supplierId, (m.get(po.supplierId) ?? 0) + 1);
    return m;
  }, [donHang]);

  const thongKe = useMemo(() => thongKeNhomNCC(ds), [ds]);
  /* Nhóm đang lọc vừa bị đổi tên / không còn NCC nào thì quay về "Tất cả" — không để màn lọc theo
     một nhóm đã biến mất (danh sách trống mà không biết vì sao). Danh mục hết sạch nhóm thì hàng lọc
     bị ẩn, nên mọi bộ lọc cũng quay về "Tất cả" — không để một bộ lọc không có nút nào gỡ được. */
  const nhomDangLoc: ThongKeNhom | undefined =
    loc.loai === "nhom" ? thongKe.nhom.find((n) => khoaNhom(n.ten) === khoaNhom(loc.ten)) : undefined;
  const locHieuLuc: LocNhomNCC =
    thongKe.nhom.length === 0 || (loc.loai === "nhom" && !nhomDangLoc) ? LOC_TAT_CA : loc;
  /* 🔴 ĐẶT LẠI STATE, không chỉ che bằng `locHieuLuc` (soát lỗi 02/10/2026): chỉ che thì màn hiện
     "Tất cả" nhưng vẫn nhớ nhóm cũ — lát sau nhóm đó có lại (người khác thêm, hoặc vừa "Thêm vào
     nhóm" với chữ cũ còn trong ô) là màn tự nhảy về lọc cũ, dòng đang tick bị ẩn. Điều chỉnh state
     ngay trong lúc vẽ (mẫu "adjusting state when props change" của React), có điều kiện nên không lặp. */
  if (locHieuLuc !== loc) {
    setLoc(LOC_TAT_CA);
    setONhom("");
    setChon([]);
  }
  const dsHien = useMemo(() => locNCCTheoNhom(ds, locHieuLuc), [ds, locHieuLuc]);

  /* Chỉ tính các dòng ĐANG HIỆN — đổi bộ lọc là bỏ chọn, nên thao tác hàng loạt không bao giờ
     chạm dòng người dùng không nhìn thấy. */
  const tapChon = useMemo(() => new Set(chon), [chon]);
  const chonDangHien = dsHien.filter((n) => tapChon.has(n.id));
  const daChonHet = dsHien.length > 0 && chonDangHien.length === dsHien.length;

  function doiChon(id: string, bat: boolean) {
    setChon((c) => (bat ? (c.includes(id) ? c : [...c, id]) : c.filter((x) => x !== id)));
  }
  function chonHetDangHien(bat: boolean) {
    setChon(bat ? dsHien.map((n) => n.id) : []);
  }
  function chonLoc(l: LocNhomNCC) {
    setLoc(l);
    setChon([]);
    /* Đang lọc một nhóm thì điền sẵn tên nhóm đó vào ô — "Bỏ khỏi nhóm" bấm được ngay. */
    setONhom(l.loai === "nhom" ? l.ten : "");
  }

  /** Cách viết đang dùng của một nhóm (gõ "vlxd" mà đã có "VLXD" thì toast nói "VLXD"). */
  const tenHienThiNhom = (ten: string) =>
    thongKe.nhom.find((n) => khoaNhom(n.ten) === khoaNhom(ten))?.ten ?? gonTenNhom(ten);

  function ganNhom(hanhDong: "them" | "bo") {
    const ten = gonTenNhom(oNhom);
    const loiTen = hanhDong === "them" ? lyDoTenNhomKhongHop(ten) : ten === "" ? "Chưa có tên nhóm." : null;
    if (loiTen) {
      toast.error(loiTen);
      return;
    }
    const hien = tenHienThiNhom(ten);
    const soDoi = chonDangHien.filter((n) => (hanhDong === "them" ? !coTrongNhom(n, ten) : coTrongNhom(n, ten))).length;
    if (soDoi === 0) {
      toast.info(
        hanhDong === "them"
          ? `Các nhà cung cấp đã chọn đều đã ở nhóm “${hien}”.`
          : `Không nhà cung cấp nào đã chọn đang ở nhóm “${hien}”.`,
      );
      return;
    }
    const loi = datNhomNCC(
      chonDangHien.map((n) => n.id),
      ten,
      hanhDong,
    );
    if (loi) {
      toast.error(loi);
      return;
    }
    /* Toast nêu SỐ LƯỢNG và TÊN NHÓM — không nêu tên NCC (§7). */
    toast.success(
      hanhDong === "them"
        ? `Đã thêm ${soDoi} nhà cung cấp vào nhóm “${hien}”`
        : `Đã bỏ ${soDoi} nhà cung cấp khỏi nhóm “${hien}”`,
    );
    setChon([]);
  }

  function xacNhanDoiTen() {
    if (!doiTen) return;
    const moi = gonTenNhom(doiTen.tenMoi);
    const gop = thongKe.nhom.some(
      (n) => khoaNhom(n.ten) === khoaNhom(moi) && khoaNhom(n.ten) !== khoaNhom(doiTen.tenCu),
    );
    const loi = doiTenNhomNCC(doiTen.tenCu, moi);
    if (loi) {
      toast.error(loi);
      return;
    }
    toast.success(
      gop ? `Đã gộp nhóm “${doiTen.tenCu}” vào nhóm “${moi}”` : `Đã đổi tên nhóm “${doiTen.tenCu}” thành “${moi}”`,
    );
    setLoc({ loai: "nhom", ten: moi });
    setONhom(moi);
    setChon([]);
    setDoiTen(null);
  }

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

  const dangLocChu =
    locHieuLuc.loai === "tat_ca"
      ? ""
      : ` · đang hiện ${dsHien.length} (${locHieuLuc.loai === "nhom" ? `nhóm “${nhomDangLoc?.ten ?? locHieuLuc.ten}”` : "chưa phân nhóm"})`;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Thu mua", href: duongDanGocTheoQuyen(quyen) }, { label: "Nhà cung cấp" }]}
        title="Danh mục nhà cung cấp"
        description={`${ds.length} nhà cung cấp${dangLocChu}`}
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
          <CardContent className="flex flex-col gap-3">
            {/* ===== Hàng lọc theo nhóm — một NCC nhiều nhóm nên LỌC, không gom khối ===== */}
            {thongKe.nhom.length > 0 ? (
              <div role="group" aria-label="Lọc theo nhóm nhà cung cấp" className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary">
                  <Tags className="size-4 shrink-0" aria-hidden />
                  Nhóm:
                </span>
                <NutLoc
                  dangChon={locHieuLuc.loai === "tat_ca"}
                  nhan={`Tất cả (${ds.length})`}
                  onClick={() => chonLoc(LOC_TAT_CA)}
                />
                {thongKe.nhom.map((n) => (
                  <NutLoc
                    key={khoaNhom(n.ten)}
                    dangChon={locHieuLuc.loai === "nhom" && khoaNhom(locHieuLuc.ten) === khoaNhom(n.ten)}
                    nhan={`${n.ten} (${n.soNCC})`}
                    onClick={() => chonLoc({ loai: "nhom", ten: n.ten })}
                  />
                ))}
                <NutLoc
                  dangChon={locHieuLuc.loai === "chua_phan_nhom"}
                  nhan={`Chưa phân nhóm (${thongKe.chuaPhanNhom})`}
                  onClick={() => chonLoc({ loai: "chua_phan_nhom" })}
                />
                {quyen.lapPO && nhomDangLoc && (
                  <button
                    type="button"
                    onClick={() => setDoiTen({ tenCu: nhomDangLoc.ten, tenMoi: nhomDangLoc.ten })}
                    className={NUT}
                  >
                    <PencilLine className="size-4 shrink-0" aria-hidden />
                    Đổi tên nhóm
                  </button>
                )}
              </div>
            ) : (
              quyen.lapPO && (
                <p className="text-sm text-text-desc">
                  Chưa có nhóm nào. Tick chọn nhà cung cấp rồi gõ tên nhóm (vd “VLXD”, “Bê tông”) để phân nhóm — một
                  nhà cung cấp thuộc được nhiều nhóm.
                </p>
              )
            )}

            {/* ===== Thanh thao tác hàng loạt — chỉ người lập PO (tầng ghi cũng chặn) ===== */}
            {quyen.lapPO && chonDangHien.length > 0 && (
              <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted p-(--hp-md-row-pad) md:flex-row md:flex-wrap md:items-center">
                <span className="text-sm font-semibold text-text-primary">
                  Đã chọn {chonDangHien.length} nhà cung cấp
                </span>
                <Input
                  list="goi-y-nhom-ncc"
                  value={oNhom}
                  onChange={(e) => setONhom(e.target.value)}
                  placeholder="Tên nhóm — vd VLXD, Bê tông"
                  aria-label="Tên nhóm"
                  maxLength={80}
                  className="h-11 bg-card md:h-9 md:w-64"
                />
                <datalist id="goi-y-nhom-ncc">
                  {thongKe.nhom.map((n) => (
                    <option key={khoaNhom(n.ten)} value={n.ten} />
                  ))}
                </datalist>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => ganNhom("them")}
                    disabled={gonTenNhom(oNhom) === ""}
                    className={`${NUT} bg-card`}
                  >
                    <FolderPlus className="size-4 shrink-0" aria-hidden />
                    Thêm vào nhóm
                  </button>
                  <button
                    type="button"
                    onClick={() => ganNhom("bo")}
                    disabled={gonTenNhom(oNhom) === ""}
                    className={`${NUT} bg-card`}
                  >
                    <FolderMinus className="size-4 shrink-0" aria-hidden />
                    Bỏ khỏi nhóm
                  </button>
                  <button type="button" onClick={() => setChon([])} className={`${NUT} bg-card`}>
                    <X className="size-4 shrink-0" aria-hidden />
                    Bỏ chọn
                  </button>
                </div>
              </div>
            )}

            {/* Chọn tất cả trên điện thoại — trên PC dùng ô tick ở đầu bảng. */}
            {quyen.lapPO && dsHien.length > 0 && (
              <button
                type="button"
                onClick={() => chonHetDangHien(!daChonHet)}
                className={`${NUT} w-fit md:hidden`}
              >
                {daChonHet ? "Bỏ chọn tất cả" : `Chọn tất cả ${dsHien.length} nhà cung cấp đang hiện`}
              </button>
            )}

            {dsHien.length === 0 && (
              <p className="text-sm text-text-desc">Không có nhà cung cấp nào trong lựa chọn này.</p>
            )}

            {dsHien.length > 0 && (
              <div className="thanh-keo-ngang-ro hidden overflow-x-auto md:block [&>[data-slot=table-container]]:overflow-visible">
                <Table className="min-w-[84rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
                  <TableHeader>
                    <TableRow>
                      {quyen.lapPO && (
                        <TableHead className="w-12 text-center">
                          <Checkbox
                            checked={daChonHet}
                            onCheckedChange={(v: boolean) => chonHetDangHien(Boolean(v))}
                            aria-label="Chọn tất cả nhà cung cấp đang hiện"
                            className="mx-auto"
                          />
                        </TableHead>
                      )}
                      <TableHead className="w-14 text-center">STT</TableHead>
                      <TableHead className="w-36 text-center">Mã số thuế</TableHead>
                      {/* Giãn cột chữ dài — cùng chỉ đạo Sếp 02/10/2026 ở bảng Theo dõi đơn hàng: *"có thanh
                          cuộn ngang nên ko bị giới hạn chiều rộng cột"*. Trước đây tên NCC xuống 4 dòng. */}
                      <TableHead className="min-w-64">Tên nhà cung cấp</TableHead>
                      <TableHead className="min-w-48">Nhóm</TableHead>
                      <TableHead className="min-w-72">Địa chỉ</TableHead>
                      <TableHead className="w-32 text-center">Điện thoại</TableHead>
                      <TableHead className="w-48">Người liên hệ</TableHead>
                      <TableHead className="w-56">Ghi chú</TableHead>
                      <TableHead className="w-20 text-center">Số đơn</TableHead>
                      {quyen.lapPO && <TableHead className="w-16 text-center">Xoá</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dsHien.map((n, i) => (
                      <TableRow key={n.id} data-state={tapChon.has(n.id) ? "selected" : undefined}>
                        {quyen.lapPO && (
                          <TableCell className="text-center">
                            <Checkbox
                              checked={tapChon.has(n.id)}
                              onCheckedChange={(v: boolean) => doiChon(n.id, Boolean(v))}
                              aria-label={`Chọn ${n.ten}`}
                              className="mx-auto"
                            />
                          </TableCell>
                        )}
                        <TableCell className="text-center tabular-nums">{i + 1}</TableCell>
                        <TableCell className="text-center text-sm tabular-nums">{n.maSoThue}</TableCell>
                        <TableCell className="text-sm font-medium">{n.ten}</TableCell>
                        <TableCell>
                          <NhanNhom nhom={n.nhomNCC} />
                        </TableCell>
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
            )}

            {/* Card List — Mobile */}
            <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
              {dsHien.map((n) => {
                const daChon = tapChon.has(n.id);
                return (
                  <div
                    key={n.id}
                    className={`flex flex-col gap-1 rounded-xl border bg-card p-4 ${daChon ? "border-primary" : "border-border"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {quyen.lapPO ? (
                        /* Cả dòng tên là vùng bấm — vùng chạm ≥44px (Design System). */
                        <label className="-m-2 flex min-h-11 min-w-0 flex-1 cursor-pointer items-start gap-3 p-2">
                          <Checkbox
                            checked={daChon}
                            onCheckedChange={(v: boolean) => doiChon(n.id, Boolean(v))}
                            aria-label={`Chọn ${n.ten}`}
                            className="mt-0.5 shrink-0"
                          />
                          <span className="text-sm font-semibold text-text-primary">{n.ten}</span>
                        </label>
                      ) : (
                        <span className="text-sm font-semibold text-text-primary">{n.ten}</span>
                      )}
                      {n.maSoThue && <span className="shrink-0 text-xs text-text-desc">MST {n.maSoThue}</span>}
                    </div>
                    <NhanNhom nhom={n.nhomNCC} />
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
                );
              })}
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

      <HopDoiTenNhom
        doiTen={doiTen}
        cacNhom={thongKe.nhom}
        onDoiChu={(tenMoi) => setDoiTen((d) => (d ? { ...d, tenMoi } : d))}
        onDong={() => setDoiTen(null)}
        onDongY={xacNhanDoiTen}
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

/**
 * ★ HỘP "ĐỔI TÊN NHÓM" — Sếp 02/10/2026. Đổi ở MỌI NCC trong nhóm; tên mới trùng một nhóm khác thì
 * nói rõ là GỘP trước khi bấm (`doiTenNhomTrongDanhMuc`).
 */
function HopDoiTenNhom({
  doiTen,
  cacNhom,
  onDoiChu,
  onDong,
  onDongY,
}: {
  doiTen: { tenCu: string; tenMoi: string } | null;
  cacNhom: readonly ThongKeNhom[];
  onDoiChu: (tenMoi: string) => void;
  onDong: () => void;
  onDongY: () => void;
}) {
  const mo = doiTen !== null;
  useDonDepHopThoaiKet(mo);
  const tenCu = doiTen?.tenCu ?? "";
  const moi = gonTenNhom(doiTen?.tenMoi ?? "");
  const nhomCu = cacNhom.find((n) => khoaNhom(n.ten) === khoaNhom(tenCu));
  const trungNhom = cacNhom.find((n) => khoaNhom(n.ten) === khoaNhom(moi) && khoaNhom(n.ten) !== khoaNhom(tenCu));
  const loiTen = moi === "" ? null : lyDoTenNhomKhongHop(moi);
  const khongDoi = moi === gonTenNhom(tenCu);
  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Đổi tên nhóm nhà cung cấp</DialogTitle>
          <DialogDescription>
            Nhóm <strong>“{tenCu}”</strong> đang có {nhomCu?.soNCC ?? 0} nhà cung cấp. Đổi tên ở đây là đổi ở mọi nhà
            cung cấp trong nhóm.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="doi-ten-nhom-ncc">Tên mới</Label>
          <Input
            id="doi-ten-nhom-ncc"
            value={doiTen?.tenMoi ?? ""}
            onChange={(e) => onDoiChu(e.target.value)}
            maxLength={80}
            className="h-11 md:h-9"
          />
          {loiTen && <p className="text-xs text-danger-soft">{loiTen}</p>}
        </div>
        {trungNhom && !loiTen && (
          <p className="rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
            Đã có nhóm <strong>“{trungNhom.ten}”</strong> ({trungNhom.soNCC} nhà cung cấp) — hai nhóm sẽ{" "}
            <strong>gộp làm một</strong>, tên chung là “{moi}”.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Hủy
          </Button>
          <Button onClick={onDongY} disabled={moi === "" || loiTen !== null || khongDoi}>
            {trungNhom ? "Gộp vào nhóm" : "Đổi tên"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  /* Dòng TRÙNG có ghi nhóm: nói rõ nhóm đó KHÔNG được áp (Sếp chốt 02/10/2026: bỏ qua nguyên dòng). */
  const soTrungCoNhom =
    xemTruoc?.ketQua.filter((k) => k.loai === "trung" && tachNhomNCC(k.dong.nhomNCC).length > 0).length ?? 0;
  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Nhập nhà cung cấp từ file Excel</DialogTitle>
          {xemTruoc && (
            <DialogDescription>
              Tệp <strong>{xemTruoc.tenTep}</strong>: {xemTruoc.ketQua.length} dòng — <strong>{soMoi}</strong>{" "}
              thêm mới, {xemTruoc.ketQua.length - soMoi} bỏ qua. Dòng trùng mã số thuế hoặc trùng tên với danh
              mục được bỏ qua nguyên dòng (kể cả cột Nhóm NCC), không ghi đè thông tin đang có.
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
            {soTrungCoNhom > 0 && (
              <p className="rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
                <strong>{soTrungCoNhom} dòng trùng có ghi nhóm</strong> — nhóm của dòng trùng KHÔNG được áp. Muốn
                gán nhóm cho nhà cung cấp đã có: tick chọn ngay trên màn danh mục rồi bấm “Thêm vào nhóm”.
              </p>
            )}
            <div className="thanh-keo-ngang-ro max-h-80 overflow-y-auto rounded-lg border border-border">
              <Table className="[&_td]:whitespace-normal">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">Dòng</TableHead>
                    <TableHead>Tên nhà cung cấp</TableHead>
                    <TableHead className="w-36">Mã số thuế</TableHead>
                    <TableHead className="w-44">Nhóm NCC</TableHead>
                    <TableHead className="w-48">Kết quả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {xemTruoc.ketQua.map((k) => (
                    <TableRow key={k.dong.dongTrongFile}>
                      <TableCell className="text-center text-sm tabular-nums">{k.dong.dongTrongFile}</TableCell>
                      <TableCell className="text-sm">{k.dong.ten || "—"}</TableCell>
                      <TableCell className="text-sm tabular-nums">{k.dong.maSoThue}</TableCell>
                      <TableCell className="text-sm">
                        {noiNhomNCC(k.dong.nhomNCC) || "—"}
                        {k.loai === "trung" && tachNhomNCC(k.dong.nhomNCC).length > 0 && (
                          <span className="block text-xs text-text-desc">Không áp — dòng trùng</span>
                        )}
                      </TableCell>
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

const NCC_TRONG = { ten: "", maSoThue: "", diaChi: "", dienThoai: "", nguoiLienHe: "", ghiChu: "", nhom: "" };

/**
 * ★ HỘP "THÊM NHÀ CUNG CẤP" — Sếp 02/10/2026: *"Thêm nút thêm thông tin NCC khác"*.
 *
 * 📌 Soát trùng bằng ĐÚNG luật của nhập Excel (`phanLoaiNhapNCC`: trùng MST / trùng tên / MST sai
 * dạng / tên nhóm sai) trước khi ghi — thêm tay và thêm bằng file phải chặn như nhau, nếu không một
 * đường thành lối né đường kia. Ghi qua `themNhaCungCap` (cùng tầng ghi với form lập PO), mã
 * `NC0000` cấp ở đó.
 * ★ Ô "Nhóm NCC" (Sếp 02/10/2026): nhiều nhóm cách nhau dấu ";" hoặc ","; bấm nhãn nhóm đang có để
 * thêm / bỏ nhanh (datalist chỉ gợi ý được nhóm ĐẦU của một ô nhiều nhóm).
 */
function HopThemNCC({ mo, onDong }: { mo: boolean; onDong: () => void }) {
  const { nhaCungCap, themNhaCungCap } = useDuLieu();
  const [ncc, setNcc] = useState(NCC_TRONG);
  const [dangLuu, setDangLuu] = useState(false);
  useDonDepHopThoaiKet(mo);
  const cacNhom = useMemo(() => thongKeNhomNCC(nhaCungCap).nhom, [nhaCungCap]);
  const nhomDangGo = tachNhomNCC(ncc.nhom);

  const dong = () => {
    if (dangLuu) return;
    setNcc(NCC_TRONG);
    onDong();
  };

  function batTatNhom(ten: string) {
    const co = nhomDangGo.some((x) => khoaNhom(x) === khoaNhom(ten));
    const sau = co ? nhomDangGo.filter((x) => khoaNhom(x) !== khoaNhom(ten)) : [...nhomDangGo, ten];
    setNcc((c) => ({ ...c, nhom: noiNhomNCC(sau) }));
  }

  async function luu() {
    const [kq] = phanLoaiNhapNCC(
      [
        {
          ten: ncc.ten,
          maSoThue: ncc.maSoThue,
          diaChi: ncc.diaChi,
          dienThoai: ncc.dienThoai,
          nguoiLienHe: ncc.nguoiLienHe,
          ghiChu: ncc.ghiChu,
          nhomNCC: tachNhomNCC(ncc.nhom),
          dongTrongFile: 1,
        },
      ],
      nhaCungCap,
    );
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
          <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="ncc-them-nhom">Nhóm NCC</Label>
            <Input
              id="ncc-them-nhom"
              list="goi-y-nhom-ncc-them"
              value={ncc.nhom}
              placeholder="Ví dụ: VLXD; Bê tông — nhiều nhóm cách nhau dấu ; hoặc ,"
              onChange={(e) => setNcc((c) => ({ ...c, nhom: e.target.value }))}
              className="h-11 md:h-9"
            />
            <datalist id="goi-y-nhom-ncc-them">
              {cacNhom.map((n) => (
                <option key={khoaNhom(n.ten)} value={n.ten} />
              ))}
            </datalist>
            {cacNhom.length > 0 && (
              <div role="group" aria-label="Nhóm đang có — bấm để thêm hoặc bỏ" className="flex flex-wrap gap-1.5">
                {cacNhom.map((n) => (
                  <NutLoc
                    key={khoaNhom(n.ten)}
                    dangChon={nhomDangGo.some((x) => khoaNhom(x) === khoaNhom(n.ten))}
                    nhan={n.ten}
                    onClick={() => batTatNhom(n.ten)}
                  />
                ))}
              </div>
            )}
          </div>
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
