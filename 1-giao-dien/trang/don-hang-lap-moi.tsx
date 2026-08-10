"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, FileSpreadsheet, FileWarning, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { Skeleton } from "@/1-giao-dien/nen-tang-ui/skeleton";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { tinhKhoiTongTien, tinhTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import { docDonHangTuExcel, khopVoiDeNghi } from "@/2-quy-trinh/doc-don-hang-excel";
import { docSoTien } from "@/6-tien-ich/doc-so-tien";
import { boDau } from "@/6-tien-ich/bo-dau";

/**
 * M4 — Lập đơn đặt hàng.
 *
 * Chỉ chọn được dòng ĐÃ ĐƯỢC PHÂN BỔ và CÒN KHỐI LƯỢNG CHƯA LÊN PO.
 * Khối lượng đặt không được vượt phần còn lại của dòng đề nghị.
 * Đơn giá nhập ở đây được lưu sang collection RIÊNG tm_donhang_gia.
 */
/**
 * `useSearchParams` bắt buộc phải nằm trong Suspense, nếu không `next build`
 * sẽ báo "missing-suspense-with-csr-bailout" và dừng build.
 */
export default function TrangLapDonHang() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <NoiDungLapDonHang />
    </Suspense>
  );
}

function NoiDungLapDonHang() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prId = searchParams.get("prId");
  const { deNghi, donHang, phieuNhan, nhaCungCap, themDonHang } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  const [chon, setChon] = useState<number[]>([]);
  const [khoiLuong, setKhoiLuong] = useState<Record<number, string>>({});
  const [donGia, setDonGia] = useState<Record<number, string>>({});
  const [supplierId, setSupplierId] = useState<string>("");
  const [ngayGiao, setNgayGiao] = useState("");

  // --- Các ô có trên biểu mẫu giấy `1. DON HANG HPCONS.xlsx` ---
  // Theo từng dòng hàng:
  const [maHang, setMaHang] = useState<Record<number, string>>({});
  const [thongSo, setThongSo] = useState<Record<number, string>>({});
  const [mucDich, setMucDich] = useState<Record<number, string>>({});
  // Theo cả đơn:
  const [diaDiemGiao, setDiaDiemGiao] = useState("");
  const [nguoiNhanHang, setNguoiNhanHang] = useState("");
  const [dieuKhoanKhac, setDieuKhoanKhac] = useState("");
  // Phần TIỀN — lưu sang chứng từ riêng tm_donhang_gia, không nằm trong PO:
  const [chietKhau, setChietKhau] = useState("");
  const [thueSuat, setThueSuat] = useState("8");
  const [dieuKhoanThanhToan, setDieuKhoanThanhToan] = useState("");

  /** Kết quả lần nhập Excel gần nhất — hiện để người dùng soát, không tự ẩn đi. */
  const [ketQuaNhap, setKetQuaNhap] = useState<{
    daDien: number;
    khongKhop: string[];
    khongLapDuoc: string[];
    vuot: string[];
    canhBao: string[];
  } | null>(null);
  const [dangDocFile, setDangDocFile] = useState(false);

  const dn = deNghi.find((x) => x.id === prId);
  const tienDo = useMemo(
    () => (dn ? tinhTienDoDeNghi(dn, donHang, phieuNhan) : []),
    [dn, donHang, phieuNhan],
  );

  /** Dòng lập được PO: đã phân bổ cho mình (hoặc mình là trưởng BP) và còn KL chưa lên PO. */
  const dongLapDuoc = tienDo.filter(
    (d) =>
      d.khoiLuongChuaLenPO > 0 &&
      Boolean(d.nguoiPhuTrachUid) &&
      (quyen.phanBoCongViec || d.nguoiPhuTrachUid === nguoiDung.uid),
  );

  if (!quyen.lapPO) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Không có quyền lập đơn hàng"
        description="Cần cấp quyền apps.tm từ 2 (Nhập liệu) trở lên."
      />
    );
  }

  if (!dn) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Chưa chọn đề nghị"
        description="Mở một đề nghị mua hàng rồi bấm “Lập đơn đặt hàng”."
        action={{ label: "Xem danh sách đề nghị", onClick: () => router.push("/de-nghi") }}
      />
    );
  }

  /**
   * NHẬP TỪ FILE EXCEL theo biểu mẫu `1. DON HANG HPCONS.xlsx`.
   *
   * Chỉ ĐIỀN SẴN vào biểu mẫu trên màn hình, KHÔNG tự chốt đơn — người lập vẫn phải
   * soát rồi bấm "Chốt đơn hàng". File là nguồn nhập liệu, không phải lệnh mua.
   */
  async function nhapTuExcel(file: File) {
    setDangDocFile(true);
    try {
      const kq = await docDonHangTuExcel(await file.arrayBuffer());
      // Đối chiếu với TOÀN BỘ dòng của đề nghị (không chỉ dòng lập được) để báo đúng
      // lý do: "không có trong đề nghị" khác hẳn "có nhưng đã lên đơn hết".
      const { khop, khongKhop, khongLapDuoc } = khopVoiDeNghi(
        kq.dong,
        tienDo.map((d) => ({
          stt: d.stt,
          tenVatLieu: d.tenVatLieu,
          khoiLuongChuaLenPO: d.khoiLuongChuaLenPO,
          lapDuoc: dongLapDuoc.some((x) => x.stt === d.stt),
        })),
      );

      // Điền từng dòng khớp được
      const sttMoi: number[] = [];
      for (const k of khop) {
        const e = k.dongExcel;
        sttMoi.push(k.sttDeNghi);
        setKhoiLuong((t) => ({ ...t, [k.sttDeNghi]: String(e.soLuong) }));
        if (e.donGia !== undefined) setDonGia((t) => ({ ...t, [k.sttDeNghi]: String(e.donGia) }));
        if (e.maHang) setMaHang((t) => ({ ...t, [k.sttDeNghi]: e.maHang! }));
        if (e.thongSoKyThuat) setThongSo((t) => ({ ...t, [k.sttDeNghi]: e.thongSoKyThuat! }));
        if (e.mucDichSuDung) setMucDich((t) => ({ ...t, [k.sttDeNghi]: e.mucDichSuDung! }));
      }
      // Gộp với lựa chọn sẵn có, không xóa dòng người dùng đã tự tick.
      if (sttMoi.length > 0) setChon((t) => [...new Set([...t, ...sttMoi])]);

      // Thông tin chung
      const c = kq.thongTinChung;
      if (c.diaDiemGiaoHang) setDiaDiemGiao(c.diaDiemGiaoHang);
      if (c.nguoiNhan) setNguoiNhanHang(c.nguoiNhan);
      if (c.dieuKhoanKhac) setDieuKhoanKhac(c.dieuKhoanKhac);
      if (c.dieuKhoanThanhToan) setDieuKhoanThanhToan(c.dieuKhoanThanhToan);
      if (c.thueSuatGTGT !== undefined) setThueSuat(String(c.thueSuatGTGT));

      // Khớp tên nhà cung cấp với danh sách đang có — không khớp thì để người dùng tự chọn.
      if (c.tenNhaCungCap) {
        const ncc = nhaCungCap.find(
          (n) => boDau(n.ten).replace(/\s+/g, " ") === boDau(c.tenNhaCungCap!).replace(/\s+/g, " "),
        );
        if (ncc) setSupplierId(ncc.id);
      }

      setKetQuaNhap({
        daDien: khop.length,
        khongKhop: khongKhop.map((d) => d.tenHang),
        khongLapDuoc: khongLapDuoc.map((k) => `${k.dongExcel.tenHang} (${k.lyDo})`),
        vuot: khop.filter((k) => k.vuotKhoiLuong).map((k) => k.dongExcel.tenHang),
        canhBao: kq.canhBao,
      });

      if (khop.length > 0) {
        toast.success(`Đã điền ${khop.length} dòng từ file`, {
          description: "Soát lại số liệu rồi bấm Chốt đơn hàng.",
        });
      } else {
        toast.error("Không điền được dòng nào", {
          description: "Tên hàng trong file không khớp mặt hàng nào của đề nghị này.",
        });
      }
    } catch {
      toast.error("Không đọc được file", {
        description: "File phải là .xlsx theo biểu mẫu Đơn mua hàng của công ty.",
      });
    } finally {
      setDangDocFile(false);
    }
  }

  const hopLe = chon.length > 0 && supplierId !== "" && ngayGiao !== "";

  /** Xem trước khối tổng ngay khi đang nhập — dùng chung công thức với màn xem và trang in. */
  const congTienHang = chon.reduce((tong, stt) => {
    const dong = tienDo.find((d) => d.stt === stt);
    if (!dong) return tong;
    const nhap = Number(khoiLuong[stt] ?? 0);
    const kl = nhap > 0 ? Math.min(nhap, dong.khoiLuongChuaLenPO) : dong.khoiLuongChuaLenPO;
    return tong + kl * (Number(donGia[stt]) || 0);
  }, 0);
  const xemTruocTien = tinhKhoiTongTien(congTienHang, Number(chietKhau) || 0, Number(thueSuat) || 0);

  function luu() {
    const ncc = nhaCungCap.find((n) => n.id === supplierId);
    if (!ncc || !dn) return;

    const items = chon.map((stt, i) => {
      const dong = tienDo.find((d) => d.stt === stt)!;
      const nhap = Number(khoiLuong[stt] ?? 0);
      return {
        sttDong: i + 1,
        sttDongDeNghi: stt,
        // Ô trống thì để `undefined` chứ không lưu chuỗi rỗng — trang in dựa vào
        // `?? "—"` để biết ô nào chưa khai, chuỗi rỗng sẽ in ra ô trắng khó hiểu.
        maHang: maHang[stt]?.trim() || undefined,
        tenVatLieu: dong.tenVatLieu,
        // Chưa nhập thông số riêng thì lấy quy cách đã ghi ở dòng đề nghị.
        thongSoKyThuat: thongSo[stt]?.trim() || dong.quyCach || undefined,
        donViTinh: dong.donViTinh,
        khoiLuongDat: nhap > 0 ? Math.min(nhap, dong.khoiLuongChuaLenPO) : dong.khoiLuongChuaLenPO,
        // Chưa nhập riêng thì lấy mục đích người đề nghị đã ghi trên phiếu — thông tin
        // đó đi thẳng ra đơn mua hàng gửi nhà cung cấp, không phải gõ lại.
        mucDichSuDung: mucDich[stt]?.trim() || dong.mucDichSuDung || undefined,
      };
    });

    const giaTheoDong: Record<number, number> = {};
    items.forEach((it) => {
      giaTheoDong[it.sttDong] = Number(donGia[it.sttDongDeNghi] ?? 0);
    });

    const id = themDonHang({
      maDuAn: dn.maDuAn,
      maHopDongCDT: dn.maHopDongCDT,
      prId: dn.id,
      prCode: dn.code,
      supplierId: ncc.id,
      supplierTen: ncc.ten,
      nguoiPhuTrachUid: nguoiDung.uid,
      nguoiPhuTrachTen: nguoiDung.tenHienThi,
      ngayLapPO: new Date().toISOString().slice(0, 10),
      ngayGiaoDuKien: ngayGiao,
      diaDiemGiaoHang: diaDiemGiao.trim() || undefined,
      nguoiNhanHangTen: nguoiNhanHang.trim() || undefined,
      dieuKhoanKhac: dieuKhoanKhac.trim() || undefined,
      items,
      donGia: giaTheoDong,
      phanTien: {
        loaiTien: "VND",
        chietKhau: Number(chietKhau) || undefined,
        thueSuatGTGT: Number(thueSuat) || undefined,
        dieuKhoanThanhToan: dieuKhoanThanhToan.trim() || undefined,
      },
    });

    // Đơn mới giờ lấy id từ `ID_DON_HANG_GIA_LAP` (đã sinh sẵn trang) nên mở thẳng
    // được trang chi tiết. Trước đây phải quay về danh sách vì id tự nghĩ ra 404.
    if (!id) {
      toast.error("Đã hết chỗ cho đơn hàng thử", {
        description: "Bản chạy thử chỉ lập được 20 đơn. Tải lại trang để về dữ liệu gốc.",
      });
      return;
    }
    toast.success("Đã chốt đơn hàng", {
      description: "Đơn đã được đẩy sang app Kho và app QLDA.",
    });
    router.push(`/don-hang/${id}`);
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Thu mua", href: "/tong-quan" },
          { label: "Đề nghị mua hàng", href: "/de-nghi" },
          { label: dn.code, href: `/de-nghi/${dn.id}` },
          { label: "Lập đơn đặt hàng" },
        ]}
        title="Lập đơn đặt hàng"
        description={`Từ ${dn.code} · ${dn.tieuDe}. Mã PO sinh tự động theo mã dự án ${dn.maDuAn}`}
      />

      {/* ===== NHẬP TỪ FILE EXCEL =====
          Chỉ đạo Ban lãnh đạo 10/08/2026: dùng chính biểu mẫu đang lưu hành
          `1. INPUT/Bieu mau/1. DON HANG HPCONS.xlsx` để nhập, khỏi gõ tay từng dòng. */}
      <Card className="border-primary/30">
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-h3 text-text-primary">Nhập từ file Excel</h2>
              <p className="text-xs text-text-desc">
                Chọn file theo mẫu <strong>Đơn mua hàng HPCons</strong>. Hệ thống đọc bảng
                hàng rồi <strong>điền sẵn</strong> vào biểu mẫu bên dưới — vẫn phải soát lại
                trước khi chốt đơn.
              </p>
            </div>
            <label className="shrink-0">
              <input
                type="file"
                accept=".xlsx"
                className="sr-only"
                disabled={dangDocFile}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void nhapTuExcel(f);
                  // Xóa giá trị để chọn lại đúng file đó lần nữa vẫn kích hoạt onChange.
                  e.target.value = "";
                }}
              />
              <span
                className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:border-primary hover:bg-muted ${
                  dangDocFile ? "pointer-events-none opacity-60" : ""
                }`}
              >
                <FileSpreadsheet className="size-4" aria-hidden />
                {dangDocFile ? "Đang đọc file..." : "Chọn file Excel"}
              </span>
            </label>
          </div>

          {/* Báo cáo kết quả — nói rõ dòng nào không dùng được, KHÔNG lặng lẽ bỏ qua */}
          {ketQuaNhap && (
            <div className="flex flex-col gap-1.5 rounded-lg bg-muted p-(--hp-md-row-pad) text-xs">
              <p className="text-sm font-semibold text-text-primary">
                Đã điền {ketQuaNhap.daDien} dòng từ file
              </p>
              {ketQuaNhap.vuot.length > 0 && (
                <p className="flex items-start gap-1.5 text-warning-soft">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>
                    Số lượng vượt phần còn được đặt: <strong>{ketQuaNhap.vuot.join(", ")}</strong>.
                    Khi chốt đơn hệ thống sẽ tự cắt về phần còn lại.
                  </span>
                </p>
              )}
              {ketQuaNhap.khongKhop.length > 0 && (
                <p className="flex items-start gap-1.5 text-danger-soft">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>
                    Không có trong đề nghị nên bỏ qua:{" "}
                    <strong>{ketQuaNhap.khongKhop.join(", ")}</strong>. Đơn hàng chỉ được lập
                    từ mặt hàng đã có trong đề nghị.
                  </span>
                </p>
              )}
              {/* Tách riêng khỏi nhóm trên: mặt hàng NÀY CÓ trong đề nghị, chỉ là lúc
                  này chưa lập đơn được. Gộp chung sẽ làm người dùng tưởng app đọc sai file. */}
              {ketQuaNhap.khongLapDuoc.length > 0 && (
                <p className="flex items-start gap-1.5 text-warning-soft">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>
                    Có trong đề nghị nhưng chưa lập đơn được:{" "}
                    <strong>{ketQuaNhap.khongLapDuoc.join(", ")}</strong>.
                  </span>
                </p>
              )}
              {ketQuaNhap.canhBao.map((c) => (
                <p key={c} className="text-text-secondary">
                  · {c}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chọn nhà cung cấp + ngày giao */}
      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          <div className="flex flex-col gap-2">
            <Label>Nhà cung cấp</Label>
            <div className="flex flex-wrap gap-2">
              {nhaCungCap.map((n) => (
                <Button
                  key={n.id}
                  variant={supplierId === n.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSupplierId(n.id)}
                >
                  {n.ten}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-(--hp-md-card-gap) md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ngay-giao">Ngày giao dự kiến (1 ngày cho cả PO)</Label>
              <Input
                id="ngay-giao"
                type="date"
                value={ngayGiao}
                onChange={(e) => setNgayGiao(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nguoi-nhan">Người nhận hàng (bên mua)</Label>
              <Input
                id="nguoi-nhan"
                placeholder="Thủ kho công trình"
                value={nguoiNhanHang}
                onChange={(e) => setNguoiNhanHang(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="dia-diem">Địa điểm giao hàng</Label>
              <Input
                id="dia-diem"
                placeholder={dn.tenCongTrinh}
                value={diaDiemGiao}
                onChange={(e) => setDiaDiemGiao(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="dk-khac">Điều khoản khác</Label>
              <Input
                id="dk-khac"
                placeholder="Bảo hành, bốc xếp, chứng chỉ chất lượng kèm theo…"
                value={dieuKhoanKhac}
                onChange={(e) => setDieuKhoanKhac(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-text-desc">
            Các ô trên lấy đúng tên nhãn của biểu mẫu giấy đang dùng (
            <code className="text-xs">1. DON HANG HPCONS.xlsx</code>) để đơn in ra khớp bản giấy.
          </p>
        </CardContent>
      </Card>

      {/* Chọn dòng */}
      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          <h2 className="text-h3 text-text-primary">Chọn mặt hàng đưa vào đơn</h2>
          {dongLapDuoc.length === 0 ? (
            <p className="text-sm text-text-desc">
              Không còn dòng nào lập được đơn. Dòng phải được phân bổ cho bạn và còn khối lượng chưa lên đơn.
            </p>
          ) : (
            <div className="flex flex-col gap-(--hp-md-row-gap)">
              {dongLapDuoc.map((d) => {
                const daChon = chon.includes(d.stt);
                return (
                  <div
                    key={d.stt}
                    className="flex flex-col gap-3 rounded-lg border border-border p-3 md:flex-row md:items-end"
                  >
                    <label className="flex flex-1 items-start gap-3">
                      <Checkbox
                        checked={daChon}
                        onCheckedChange={(c) =>
                          setChon((t) => (c ? [...t, d.stt] : t.filter((x) => x !== d.stt)))
                        }
                        aria-label={`Chọn ${d.tenVatLieu}`}
                      />
                      <span className="flex flex-col">
                        <span className="text-sm font-medium text-text-primary">
                          {d.stt}. {d.tenVatLieu}
                        </span>
                        <span className="text-xs text-text-desc">
                          Còn chưa lên đơn: {d.khoiLuongChuaLenPO.toLocaleString("vi-VN")} {d.donViTinh}
                          {d.nguoiPhuTrachTen ? ` · phụ trách ${d.nguoiPhuTrachTen}` : ""}
                        </span>
                      </span>
                    </label>

                    {daChon && (
                      <div className="flex flex-wrap gap-3">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`mh-${d.stt}`}>Mã hàng</Label>
                          <Input
                            id={`mh-${d.stt}`}
                            placeholder="VT00027"
                            value={maHang[d.stt] ?? ""}
                            onChange={(e) => setMaHang((t) => ({ ...t, [d.stt]: e.target.value }))}
                            className="w-28"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`ts-${d.stt}`}>Thông số kỹ thuật</Label>
                          <Input
                            id={`ts-${d.stt}`}
                            placeholder={d.quyCach ?? "Mác, tiêu chuẩn, quy cách"}
                            value={thongSo[d.stt] ?? ""}
                            onChange={(e) => setThongSo((t) => ({ ...t, [d.stt]: e.target.value }))}
                            className="w-52"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`md-${d.stt}`}>Mục đích sử dụng</Label>
                          <Input
                            id={`md-${d.stt}`}
                            placeholder={d.mucDichSuDung ?? "Hạng mục nào của công trình"}
                            value={mucDich[d.stt] ?? ""}
                            onChange={(e) => setMucDich((t) => ({ ...t, [d.stt]: e.target.value }))}
                            className="w-52"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`kl-${d.stt}`}>Khối lượng đặt</Label>
                          <Input
                            id={`kl-${d.stt}`}
                            type="number"
                            min={0}
                            max={d.khoiLuongChuaLenPO}
                            placeholder={String(d.khoiLuongChuaLenPO)}
                            value={khoiLuong[d.stt] ?? ""}
                            onChange={(e) => setKhoiLuong((t) => ({ ...t, [d.stt]: e.target.value }))}
                            className="w-32"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`dg-${d.stt}`}>Đơn giá (₫)</Label>
                          <Input
                            id={`dg-${d.stt}`}
                            type="number"
                            min={0}
                            placeholder="0"
                            value={donGia[d.stt] ?? ""}
                            onChange={(e) => setDonGia((t) => ({ ...t, [d.stt]: e.target.value }))}
                            className="w-36"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* --- KHỐI TIỀN: chiết khấu · thuế · điều khoản thanh toán ---
              Cả khối này lưu sang chứng từ riêng tm_donhang_gia, không nằm trong PO. */}
          {chon.length > 0 && (
            <div className="flex flex-col gap-(--hp-md-card-gap) border-t border-divider pt-4">
              <h3 className="text-sm font-semibold text-text-primary">
                Chiết khấu · thuế · thanh toán
              </h3>
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ck">Số tiền CK (₫)</Label>
                  <Input
                    id="ck"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={chietKhau}
                    onChange={(e) => setChietKhau(e.target.value)}
                    className="w-36"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="vat">Thuế suất GTGT (%)</Label>
                  <Input
                    id="vat"
                    type="number"
                    min={0}
                    max={100}
                    value={thueSuat}
                    onChange={(e) => setThueSuat(e.target.value)}
                    className="w-32"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="dk-tt">Điều khoản thanh toán</Label>
                  <Input
                    id="dk-tt"
                    placeholder="Thanh toán 100% trong 30 ngày sau khi nhận đủ hàng"
                    value={dieuKhoanThanhToan}
                    onChange={(e) => setDieuKhoanThanhToan(e.target.value)}
                  />
                </div>
              </div>

              {/* Xem trước đúng trình tự của biểu mẫu giấy */}
              <dl className="ml-auto flex w-full max-w-sm flex-col gap-1 text-sm">
                <DongXemTruoc nhan="Cộng tiền hàng (chưa trừ CK)" giaTri={xemTruocTien.congTienHang} />
                <DongXemTruoc nhan="Số tiền CK" giaTri={xemTruocTien.chietKhau} />
                <DongXemTruoc
                  nhan="Cộng tiền hàng (đã trừ CK)"
                  giaTri={xemTruocTien.congTienHangSauCK}
                />
                <DongXemTruoc
                  nhan={`Tiền thuế GTGT (${xemTruocTien.thueSuatGTGT}%)`}
                  giaTri={xemTruocTien.tienThueGTGT}
                />
                <DongXemTruoc
                  nhan="Tổng tiền thanh toán"
                  giaTri={xemTruocTien.tongThanhToan}
                  tong
                />
              </dl>
              <p className="text-right text-xs italic text-text-desc">
                {docSoTien(xemTruocTien.tongThanhToan)}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-divider pt-4">
            <Button disabled={!hopLe} onClick={luu}>
              <ShoppingCart className="size-4" aria-hidden />
              Chốt đơn hàng
            </Button>
            <Button variant="ghost" onClick={() => router.back()}>
              Quay lại
            </Button>
            {!hopLe && (
              <span className="text-xs text-text-desc">
                Cần chọn nhà cung cấp, ngày giao dự kiến và ít nhất một mặt hàng.
              </span>
            )}
          </div>
          <p className="text-xs text-text-desc">
            Chốt đơn = đẩy PO sang app Kho và app QLDA. Đơn giá, chiết khấu, thuế và điều khoản
            thanh toán lưu riêng ở <code className="text-xs">tm_donhang_gia</code> nên thủ kho
            không đọc được.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

/** Một dòng của khối xem trước tổng tiền ở màn lập đơn. */
function DongXemTruoc({ nhan, giaTri, tong }: { nhan: string; giaTri: number; tong?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        tong ? "border-t border-divider pt-1.5" : ""
      }`}
    >
      <dt className={tong ? "font-bold text-text-primary" : "text-text-desc"}>{nhan}</dt>
      <dd className={tong ? "text-base font-bold text-primary" : "font-medium text-text-primary"}>
        {giaTri.toLocaleString("vi-VN")} ₫
      </dd>
    </div>
  );
}
