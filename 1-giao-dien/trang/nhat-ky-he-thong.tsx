"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/1-giao-dien/nen-tang-ui/table";
import {
  dangNgheNhatKyHeThong,
  type MucNhatKyHeThong,
} from "@/3-du-lieu/nhat-ky-he-thong";
import { formatDateTime } from "@/6-tien-ich/dinh-dang";

/**
 * ★ TRANG NHẬT KÝ HỆ THỐNG — thêm 29/08/2026.
 *
 * Ra đời sau sự cố sáng cùng ngày: "Quy trình mua hàng" trống trơn, không ai biết ai đã bấm
 * "Xóa dữ liệu chạy thử" lúc nào — tra thẳng Firestore chỉ biết được `updateTime` của
 * document, không biết AI. Xem chú thích đầy đủ ở `3-du-lieu/nhat-ky-he-thong.ts`.
 *
 * 🔴 CHỈ HIỂN THỊ, KHÔNG SỬA/XÓA ĐƯỢC GÌ Ở ĐÂY — đúng bản chất "chỉ ghi thêm" của nhật ký
 * (xem `firestore-chay-thu.rules`). Trang này không có nút xóa dòng nào, kể cả cho quản trị.
 */
export default function TrangNhatKyHeThong() {
  const [muc, setMuc] = useState<MucNhatKyHeThong[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    const huy = dangNgheNhatKyHeThong(
      (d) => {
        setMuc(d);
        setDangTai(false);
      },
      (e) => {
        console.error("[nhat ky he thong] không nối được:", e);
        setLoi("Không tải được nhật ký hệ thống. Kiểm tra kết nối mạng rồi tải lại trang.");
        setDangTai(false);
      },
    );
    return huy;
  }, []);

  return (
    <div className="flex flex-col gap-(--hp-md-card-gap)">
      <PageHeader
        crumbs={[{ label: "Thu mua", href: "/tong-quan" }, { label: "Nhật ký hệ thống" }]}
        title="Nhật ký hệ thống"
        description="Ai đã làm gì, lúc nào — cho những hành động quan trọng và không thể hoàn tác của app. Tách riêng khỏi dữ liệu chạy thử nên không bị xóa theo khi ai đó bấm “Xóa dữ liệu chạy thử”."
      />

      <Card>
        <CardContent className="p-0">
          {dangTai ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-text-desc">
              <History className="size-4 animate-pulse" aria-hidden />
              Đang tải nhật ký…
            </div>
          ) : loi ? (
            <EmptyState icon={History} title="Không tải được nhật ký" description={loi} />
          ) : muc.length === 0 ? (
            <EmptyState
              icon={History}
              title="Chưa có dòng nhật ký nào"
              description="Nhật ký sẽ tự ghi khi có ai thực hiện một hành động quan trọng, ví dụ xóa dữ liệu chạy thử hoặc xóa một đề nghị."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Thời điểm</TableHead>
                    <TableHead className="whitespace-nowrap">Người thực hiện</TableHead>
                    <TableHead>Mô tả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {muc.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap align-top text-text-desc">
                        {formatDateTime(m.thoiDiem.toISOString())}
                      </TableCell>
                      <TableCell className="whitespace-nowrap align-top font-medium">
                        {m.nguoiThucHienTen || m.nguoiThucHienUid || "—"}
                      </TableCell>
                      <TableCell className="align-top">{m.moTa}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
