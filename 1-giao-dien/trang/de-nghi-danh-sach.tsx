"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Inbox, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { ThanhTienDo } from "@/1-giao-dien/thanh-phan-nghiep-vu/thanh-tien-do";
import { BangQuyTrinhMuaHang } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-quy-trinh-mua-hang";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/1-giao-dien/nen-tang-ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/1-giao-dien/nen-tang-ui/table";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { tinhTienDoDeNghi, tomTatTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import {
  dungBangQuyTrinh,
  quyetDinhKeoTha,
  type GiaiDoanMuaHang,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import { NHAN_PHONG_BAN_NGUON, NHAN_TRANG_THAI_DE_NGHI, NHAN_UU_TIEN } from "@/2-quy-trinh/trang-thai";

/** Hai cách xem cùng một dữ liệu — đặt tên giống bảng Base để anh em quen việc đọc ra ngay. */
type CachXem = "bang" | "danh_sach";

export default function TrangDanhSachDeNghi() {
  const router = useRouter();
  const {
    deNghi,
    donHang,
    phieuNhan,
    baoGia,
    thongBao,
    taoBaoGiaGiaLap,
    doiTrangThaiBaoGiaTheoDeNghi,
    dongDoDeNghi,
  } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  const [cachXem, setCachXem] = useState<CachXem>("bang");

  const danhSach = useMemo(
    () =>
      deNghi.map((dn) => {
        const tienDo = tinhTienDoDeNghi(dn, donHang, phieuNhan);
        return {
          dn,
          tomTat: tomTatTienDoDeNghi(tienDo),
          soChuaPhanBo: tienDo.filter((d) => d.trangThaiDong === "chua_phan_bo").length,
        };
      }),
    [deNghi, donHang, phieuNhan],
  );

  const cot = useMemo(
    () => dungBangQuyTrinh(deNghi, donHang, baoGia, phieuNhan),
    [deNghi, donHang, baoGia, phieuNhan],
  );

  // Thông báo MỚI NHẤT của từng đề nghị (mảng đã xếp mới nhất đứng đầu) —
  // để thẻ trên bảng hiện "Chờ tiếp nhận" / "Đã nhận: [tên]" cho bước hiện tại.
  const tiepNhanTheoPr = useMemo(() => {
    const m = new Map<string, (typeof thongBao)[number]>();
    for (const tb of thongBao) if (!m.has(tb.prId)) m.set(tb.prId, tb);
    return m;
  }, [thongBao]);

  /**
   * Thả thẻ vào cột: hỏi `quyetDinhKeoTha` (2-quy-trinh) xem bước chuyển này ứng với
   * nghiệp vụ gì rồi thực thi — KHÔNG đổi cột "chay" vì giai đoạn suy ra từ chứng từ thật.
   */
  function xuLyTha(prId: string, dich: GiaiDoanMuaHang) {
    const the = cot.flatMap((c) => c.the).find((t) => t.deNghi.id === prId);
    if (!the) return;

    const poCuaDeNghi = donHang.filter((po) => po.prId === prId && po.trangThai !== "huy");
    const baoGiaCuaDeNghi = baoGia.filter((b) => b.prId === prId && b.trangThai !== "huy");
    const hanhDong = quyetDinhKeoTha(the, dich, poCuaDeNghi, baoGiaCuaDeNghi);
    if (!hanhDong) return;

    switch (hanhDong.loai) {
      case "tao_bao_gia": {
        const id = taoBaoGiaGiaLap(prId, nguoiDung.tenHienThi);
        if (id) {
          toast.success("Đã tạo bảng báo giá", {
            description: `${the.deNghi.code} chuyển sang "Yêu cầu NCC báo giá".`,
          });
        } else {
          toast.error("Đã hết chỗ cho bảng báo giá thử", {
            description: "Bản chạy thử chỉ tạo được 12 bảng báo giá. Tải lại trang để về dữ liệu gốc.",
          });
        }
        break;
      }
      case "chot_so_sanh":
        doiTrangThaiBaoGiaTheoDeNghi(prId, "dang_thu_thap", "da_so_sanh", nguoiDung.tenHienThi);
        toast.success("Đã chốt đủ báo giá", {
          description: `${the.deNghi.code} chuyển sang "Xét duyệt báo giá".`,
        });
        break;
      case "dong_do":
        // Đóng dở là quyết định nặng — hỏi lại một nhịp ngay trên thông báo.
        toast.warning(`Đóng dở ${the.deNghi.code}?`, {
          description: "Đề nghị sẽ chuyển vào cột Thất bại và không mua tiếp.",
          action: {
            label: "Đóng dở",
            onClick: () => {
              dongDoDeNghi(prId, nguoiDung.tenHienThi);
              toast.success("Đã đóng dở đề nghị", { description: the.deNghi.code });
            },
          },
        });
        break;
      case "mo_trang":
        toast.info("Bước này cần thao tác nghiệp vụ", { description: hanhDong.thongBao });
        router.push(hanhDong.duongDan);
        break;
      case "khong_the":
        toast.error("Không chuyển được", { description: hanhDong.lyDo });
        break;
    }
  }

  return (
    <>
      {/* Tiêu đề và thanh chọn cách xem gộp một khối, cách nhau hẹp — để thanh
          tab dính liền tiêu đề đúng như bảng Base, không hở một dải trống. */}
      <div className="flex flex-col gap-(--hp-md-card-gap)">
        <PageHeader
          crumbs={[{ label: "Thu mua", href: "/tong-quan" }, { label: "Đề nghị mua hàng" }]}
          title="Đề nghị mua hàng"
          description="Đề nghị đã duyệt, nhận từ Phòng Thi công qua HPcore"
          actions={
            /* Công cụ CHẠY THỬ — ở bản thật đề nghị tự vào từ HPcore, không có nút này.
               Xem 1-giao-dien/trang/de-nghi-nhan-moi.tsx */
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href="/de-nghi/nhan-moi" />}
            >
              <Inbox className="size-4" aria-hidden />
              Nhận đề nghị mới (giả lập)
            </Button>
          }
        />

        {/* Cao 44px trên điện thoại cho đủ vùng chạm theo V1.1. */}
        <Tabs value={cachXem} onValueChange={(v) => setCachXem(v as CachXem)}>
          <TabsList variant="line" className="h-auto md:h-9">
            <TabsTrigger value="bang" className="h-11 px-3 md:h-[calc(100%-1px)]">
              <LayoutGrid aria-hidden />
              Dạng bảng
            </TabsTrigger>
            <TabsTrigger value="danh_sach" className="h-11 px-3 md:h-[calc(100%-1px)]">
              <List aria-hidden />
              Danh sách
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {deNghi.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Chưa có đề nghị nào"
          description="Đề nghị đã duyệt từ HPcore sẽ tự xuất hiện ở đây."
        />
      ) : cachXem === "bang" ? (
        // `flex-1` + `min-h-[420px]`: bảng chiếm trọn phần màn hình còn lại,
        // màn quá thấp thì vẫn giữ tối thiểu 420px rồi cuộn trang như thường.
        <div className="flex min-h-[420px] flex-1 flex-col gap-2">
          <BangQuyTrinhMuaHang
            cot={cot}
            keoThaDuoc={quyen.lapPO}
            onTha={xuLyTha}
            tiepNhan={tiepNhanTheoPr}
          />
          {quyen.lapPO && (
            <p className="text-xs text-text-desc">
              Kéo thẻ sang cột kế tiếp để làm bước đó: bước làm ngay được thì thẻ tự chuyển, bước
              cần quyết định (chọn NCC, lập đơn, ghi phiếu nhận) sẽ mở đúng màn hình tương ứng.
            </p>
          )}
        </div>
      ) : (
        <Card>
          <CardContent>
            {/* Bảng — Desktop/Tablet */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đề nghị</TableHead>
                    <TableHead>Công trình</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Nguồn</TableHead>
                    <TableHead>Cần hàng</TableHead>
                    <TableHead className="text-right">Số dòng</TableHead>
                    <TableHead>Phân bổ</TableHead>
                    <TableHead>Tiến độ nhận</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {danhSach.map(({ dn, tomTat, soChuaPhanBo }) => {
                    const tt = NHAN_TRANG_THAI_DE_NGHI[dn.trangThai];
                    const ut = NHAN_UU_TIEN[dn.mucDoUuTien];
                    return (
                      <TableRow key={dn.id}>
                        <TableCell>
                          <Link
                            href={`/de-nghi/${dn.id}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {dn.code}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">{dn.tenCongTrinh}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-col gap-1">
                            <span>{dn.tieuDe}</span>
                            {dn.mucDoUuTien === "gap" && <StatusBadge label={ut.nhan} tone={ut.tong} />}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-text-desc">
                          {NHAN_PHONG_BAN_NGUON[dn.phongBanNguon]}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(dn.ngayCanHang).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right">{dn.items.length}</TableCell>
                        <TableCell>
                          {soChuaPhanBo > 0 ? (
                            <StatusBadge label={`Thiếu ${soChuaPhanBo} dòng`} tone="danger" />
                          ) : (
                            <StatusBadge label="Đủ" tone="success" />
                          )}
                        </TableCell>
                        <TableCell>
                          <ThanhTienDo
                            phanTram={tomTat.phanTram}
                            tong={tomTat.phanTram === 100 ? "success" : "primary"}
                            nhan={`${tomTat.soDongDaNhanDu}/${tomTat.tongSoDong} mặt hàng`}
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge label={tt.nhan} tone={tt.tong} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Card List — Mobile */}
            <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
              {danhSach.map(({ dn, tomTat, soChuaPhanBo }) => {
                const tt = NHAN_TRANG_THAI_DE_NGHI[dn.trangThai];
                return (
                  <Link
                    key={dn.id}
                    href={`/de-nghi/${dn.id}`}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-primary">{dn.code}</span>
                      <StatusBadge label={tt.nhan} tone={tt.tong} />
                    </div>
                    <span className="text-sm text-text-primary">{dn.tieuDe}</span>
                    <span className="text-xs text-text-desc">{dn.tenCongTrinh}</span>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-desc">Cần hàng</span>
                      <span>{new Date(dn.ngayCanHang).toLocaleDateString("vi-VN")}</span>
                    </div>
                    {soChuaPhanBo > 0 && <StatusBadge label={`Thiếu ${soChuaPhanBo} dòng chưa phân bổ`} tone="danger" />}
                    <ThanhTienDo
                      phanTram={tomTat.phanTram}
                      tong={tomTat.phanTram === 100 ? "success" : "primary"}
                      nhan={`${tomTat.soDongDaNhanDu}/${tomTat.tongSoDong} mặt hàng đã nhận đủ`}
                    />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
