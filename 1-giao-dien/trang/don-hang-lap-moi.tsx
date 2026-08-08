"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { FileWarning, ShoppingCart } from "lucide-react";
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
import { tinhTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";

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

  const hopLe = chon.length > 0 && supplierId !== "" && ngayGiao !== "";

  function luu() {
    const ncc = nhaCungCap.find((n) => n.id === supplierId);
    if (!ncc || !dn) return;

    const items = chon.map((stt, i) => {
      const dong = tienDo.find((d) => d.stt === stt)!;
      const nhap = Number(khoiLuong[stt] ?? 0);
      return {
        sttDong: i + 1,
        sttDongDeNghi: stt,
        tenVatLieu: dong.tenVatLieu,
        donViTinh: dong.donViTinh,
        khoiLuongDat: nhap > 0 ? Math.min(nhap, dong.khoiLuongChuaLenPO) : dong.khoiLuongChuaLenPO,
      };
    });

    const giaTheoDong: Record<number, number> = {};
    items.forEach((it) => {
      giaTheoDong[it.sttDong] = Number(donGia[it.sttDongDeNghi] ?? 0);
    });

    themDonHang({
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
      items,
      donGia: giaTheoDong,
    });

    // Về danh sách chứ không mở trang chi tiết: trên hosting tĩnh, trang chi tiết chỉ
    // được sinh sẵn cho các đơn hàng có trong dữ liệu mẫu — đơn vừa tạo chưa có trang riêng.
    // Khi nối Firestore thật sẽ mở thẳng trang chi tiết.
    toast.success("Đã chốt đơn hàng", {
      description: "Đơn vừa lập đã xuất hiện trong danh sách đơn đặt hàng.",
    });
    router.push("/don-hang");
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
            Chốt đơn = đẩy PO sang app Kho và app QLDA. Đơn giá lưu riêng ở{" "}
            <code className="text-xs">tm_donhang_gia</code> nên thủ kho không đọc được.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
