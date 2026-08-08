"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, FileWarning } from "lucide-react";
import { toast } from "sonner";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/1-giao-dien/nen-tang-ui/card";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Badge } from "@/1-giao-dien/nen-tang-ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/1-giao-dien/nen-tang-ui/table";
import { NHAN_TRANG_THAI_BAO_GIA } from "@/2-quy-trinh/trang-thai";
import { dungBangSoSanh } from "@/2-quy-trinh/so-sanh-bao-gia";
import { formatCurrencyVnd, formatDate, formatNumber } from "@/6-tien-ich/dinh-dang";
import { cn } from "@/6-tien-ich/gop-lop";

/** M7b — So sánh báo giá nhiều nhà cung cấp cho một đề nghị đã duyệt. */
export default function TrangBaoGiaChiTiet() {
  const params = useParams<{ id: string }>();
  const { baoGia, chonNCCChoBaoGia } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  const bg = baoGia.find((b) => b.id === params.id);

  if (!bg) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Không tìm thấy bảng báo giá"
        description="Bảng báo giá có thể đã bị xóa hoặc đường dẫn không đúng."
      />
    );
  }

  const tt = NHAN_TRANG_THAI_BAO_GIA[bg.trangThai];
  const { cot, dong } = dungBangSoSanh(bg);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Phòng Thu Mua", href: "/tong-quan" },
          { label: "Báo giá", href: "/bao-gia" },
          { label: bg.code },
        ]}
        title={bg.tieuDe}
        description={`${bg.code} · Hạn nộp báo giá ${formatDate(bg.hanNop)}`}
        actions={<StatusBadge label={tt.nhan} tone={tt.tong} />}
      />

      <Card>
        <CardContent className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-text-desc">Đề nghị liên kết</p>
            <Link
              href={`/de-nghi/${bg.prId}`}
              className="font-medium text-primary hover:underline"
            >
              {bg.prCode}
            </Link>
          </div>
          <div>
            <p className="text-xs text-text-desc">Ngày tạo</p>
            <p className="font-medium text-text-primary">{formatDate(bg.ngayTao)}</p>
          </div>
          <div>
            <p className="text-xs text-text-desc">Cập nhật lần cuối</p>
            <p className="font-medium text-text-primary">{formatDate(bg.ngayCapNhat)}</p>
          </div>
          <div>
            <p className="text-xs text-text-desc">Nhà cung cấp đã chọn</p>
            <p className={cn("font-medium", bg.nccDaChonTen ? "text-success-soft" : "text-text-desc")}>
              {bg.nccDaChonTen ?? "Chưa chọn"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bảng so sánh giá nhà cung cấp</CardTitle>
          <p className="text-xs text-text-desc">
            Giá thấp nhất mỗi dòng được tô màu xanh và đánh dấu chữ &quot;thấp nhất&quot;.
            Cột nhà cung cấp báo thiếu dòng không được đưa vào so sánh tổng.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">STT</TableHead>
                  <TableHead>Vật tư</TableHead>
                  <TableHead>ĐVT</TableHead>
                  <TableHead className="text-right">Khối lượng</TableHead>
                  {cot.map((c) => (
                    <TableHead key={c.nccId} className="min-w-40 text-right">
                      <span className="flex flex-col items-end gap-1">
                        <span className="max-w-40 truncate" title={c.tenNCC}>
                          {c.tenNCC}
                        </span>
                        {bg.nccDaChonId === c.nccId && (
                          <Badge className="border-transparent bg-success-bg text-success-soft">
                            <Check aria-hidden /> Đã chọn
                          </Badge>
                        )}
                        {/* Chọn NCC — bước ③ Xét duyệt → ④ Lập đơn mua hàng của bảng quy trình */}
                        {bg.trangThai === "da_so_sanh" && quyen.lapPO && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              chonNCCChoBaoGia(bg.id, c.nccId, c.tenNCC, nguoiDung.tenHienThi);
                              toast.success("Đã chốt nhà cung cấp", {
                                description: `${c.tenNCC} — ${bg.prCode} chuyển sang "Lập đơn mua hàng".`,
                              });
                            }}
                          >
                            Chọn NCC này
                          </Button>
                        )}
                        {!c.baoDuDong && (
                          <span className="text-xs font-normal text-text-desc">Báo thiếu dòng</span>
                        )}
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dong.map((d, idx) => (
                  <TableRow key={d.dong.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium text-text-primary">
                      {d.dong.tenVatLieu}
                    </TableCell>
                    <TableCell>{d.dong.donViTinh}</TableCell>
                    <TableCell className="text-right">{formatNumber(d.dong.khoiLuong)}</TableCell>
                    {cot.map((c) => {
                      const o = d.o[c.nccId];
                      if (!o) {
                        return (
                          <TableCell key={c.nccId} className="text-right text-text-desc">
                            Không báo giá
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={c.nccId} className="text-right">
                          <span
                            className={cn(
                              "font-medium",
                              o.laGiaThapNhat ? "text-success-soft" : "text-text-primary",
                            )}
                          >
                            {formatCurrencyVnd(o.donGia)}
                            {o.laGiaThapNhat && " · thấp nhất"}
                          </span>
                          <span className="block text-xs text-text-desc">
                            Giao {o.thoiGianGiao} ngày · TT {formatCurrencyVnd(o.thanhTien)}
                          </span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={4} className="text-right">
                    Tổng giá trị
                  </TableCell>
                  {cot.map((c) => (
                    <TableCell
                      key={c.nccId}
                      className={cn(
                        "text-right",
                        c.laTongThapNhat ? "text-success-soft" : "text-text-primary",
                      )}
                    >
                      {formatCurrencyVnd(c.tongTien)}
                      {c.laTongThapNhat && (
                        <span className="block text-xs font-normal">Tổng thấp nhất</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div>
        <Button variant="outline" nativeButton={false} render={<Link href="/bao-gia" />}>
          <ArrowLeft aria-hidden /> Quay lại danh sách
        </Button>
      </div>
    </>
  );
}
