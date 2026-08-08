"use client";

import Link from "next/link";
import { Scale } from "lucide-react";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { DataTable, type ColumnDef } from "@/1-giao-dien/thanh-phan-dung-chung/data-table";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { NHAN_TRANG_THAI_BAO_GIA } from "@/2-quy-trinh/trang-thai";
import { formatDate } from "@/6-tien-ich/dinh-dang";
import type { BaoGia } from "@/3-du-lieu/kieu-du-lieu";

const columns: ColumnDef<BaoGia, unknown>[] = [
  {
    accessorKey: "code",
    header: "Mã",
    meta: { label: "Mã" },
    enableHiding: false,
    cell: ({ row }) => (
      <Link href={`/bao-gia/${row.original.id}`} className="font-medium text-primary hover:underline">
        {row.original.code}
      </Link>
    ),
  },
  {
    accessorKey: "tieuDe",
    header: "Tiêu đề",
    meta: { label: "Tiêu đề" },
    cell: ({ row }) => (
      <span className="block max-w-xl xl:max-w-2xl truncate" title={row.original.tieuDe}>
        {row.original.tieuDe}
      </span>
    ),
  },
  {
    accessorKey: "prCode",
    header: "Đề nghị liên kết",
    meta: { label: "Đề nghị liên kết" },
    cell: ({ row }) => (
      <Link href={`/de-nghi/${row.original.prId}`} className="text-text-desc hover:underline">
        {row.original.prCode}
      </Link>
    ),
  },
  {
    accessorKey: "hanNop",
    header: "Hạn nộp",
    meta: { label: "Hạn nộp" },
    cell: ({ row }) => formatDate(row.original.hanNop),
    sortingFn: (a, b) =>
      new Date(a.original.hanNop).getTime() - new Date(b.original.hanNop).getTime(),
  },
  {
    id: "nccDaChon",
    accessorFn: (r) => r.nccDaChonTen ?? "",
    header: "NCC đã chọn",
    meta: { label: "NCC đã chọn" },
    cell: ({ row }) => row.original.nccDaChonTen ?? "—",
  },
  {
    id: "trangThai",
    accessorFn: (r) => NHAN_TRANG_THAI_BAO_GIA[r.trangThai].nhan,
    header: "Trạng thái",
    meta: { label: "Trạng thái" },
    enableHiding: false,
    cell: ({ row }) => {
      const tt = NHAN_TRANG_THAI_BAO_GIA[row.original.trangThai];
      return <StatusBadge label={tt.nhan} tone={tt.tong} />;
    },
  },
];

export default function BaoGiaDanhSach() {
  const { baoGia } = useDuLieu();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Phòng Thu Mua", href: "/tong-quan" }, { label: "Báo giá & so sánh NCC" }]}
        title="Báo giá & so sánh nhà cung cấp"
        description="Thu thập báo giá nhiều nhà cung cấp cho từng đề nghị đã duyệt, so sánh và chọn NCC."
      />
      <Card>
        <CardContent>
          <DataTable<BaoGia>
            columns={columns}
            data={baoGia}
            getRowId={(r) => r.id}
            searchPlaceholder="Tìm mã báo giá, tiêu đề, nhà cung cấp..."
            filters={[
              {
                columnId: "trangThai",
                label: "Trạng thái",
                options: Object.values(NHAN_TRANG_THAI_BAO_GIA).map((s) => ({
                  value: s.nhan,
                  label: s.nhan,
                })),
              },
            ]}
            emptyIcon={Scale}
            emptyTitle="Chưa có bảng báo giá nào"
            emptyDescription="Bảng báo giá được tạo từ một đề nghị mua hàng đã duyệt."
            renderCard={(rfq) => (
              <Link
                href={`/bao-gia/${rfq.id}`}
                className="flex flex-col gap-2 rounded-lg border border-border p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-primary">{rfq.code}</span>
                  <StatusBadge
                    label={NHAN_TRANG_THAI_BAO_GIA[rfq.trangThai].nhan}
                    tone={NHAN_TRANG_THAI_BAO_GIA[rfq.trangThai].tong}
                  />
                </div>
                <p className="text-sm text-text-primary">{rfq.tieuDe}</p>
                <p className="text-xs text-text-desc">
                  {rfq.prCode} · Hạn nộp {formatDate(rfq.hanNop)}
                  {rfq.nccDaChonTen ? ` · Đã chọn ${rfq.nccDaChonTen}` : ""}
                </p>
              </Link>
            )}
          />
        </CardContent>
      </Card>
    </>
  );
}
