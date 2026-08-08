"use client";

import { useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type Row,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/1-giao-dien/nen-tang-ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/1-giao-dien/nen-tang-ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/1-giao-dien/nen-tang-ui/select";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { formatNumber } from "@/6-tien-ich/dinh-dang";
import type { LucideIcon } from "lucide-react";

export interface DataTableFilter {
  /** id của cột cần lọc. */
  columnId: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  /** Ô tìm kiếm chung — lọc trên toàn bộ dòng. */
  searchPlaceholder?: string;
  /** Các bộ lọc theo cột (trạng thái, ưu tiên...). */
  filters?: DataTableFilter[];
  /** Bật ô chọn nhiều dòng. */
  enableSelection?: boolean;
  /** Nút thao tác hiện khi có dòng được chọn. */
  renderBulkActions?: (rows: TData[]) => ReactNode;
  /**
   * Hiển thị dạng thẻ trên Mobile (<768px) — BẮT BUỘC theo Design System
   * (10-data-display/tables.md: mobile không ép bảng, chuyển sang Card List).
   */
  renderCard: (row: TData) => ReactNode;
  /** Khóa duy nhất cho mỗi dòng, dùng cho `key` của Card List. */
  getRowId: (row: TData) => string;
  pageSize?: number;
  /** Icon cho trạng thái trống — EmptyState của Design System bắt buộc có icon. */
  emptyIcon: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Bảng dữ liệu chuẩn HPCons trên nền TanStack Table.
 *
 * Đáp ứng 10-data-display/tables.md: tìm kiếm, lọc, sắp xếp, phân trang, chọn
 * nhiều dòng, ẩn cột; header 48px, dòng 44px; Tablet cuộn ngang; Mobile chuyển
 * hẳn sang Card List thay vì ép bảng.
 */
export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = "Tìm kiếm...",
  filters = [],
  enableSelection = false,
  renderBulkActions,
  renderCard,
  getRowId,
  pageSize = 10,
  emptyIcon,
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription = "Chưa có bản ghi nào phù hợp.",
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const selectionColumn: ColumnDef<TData, unknown> = {
    id: "chon",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        // base-ui tách "chọn một phần" thành prop riêng, không nhận
        // checked="indeterminate" như Radix
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(Boolean(v))}
        aria-label="Chọn tất cả dòng trên trang"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
        aria-label="Chọn dòng"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  };

  const table = useReactTable({
    data,
    columns: enableSelection ? [selectionColumn, ...columns] : columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize } },
  });

  const dongDaChon = table.getFilteredSelectedRowModel().rows.map((r) => r.original);
  const coLoc = globalFilter !== "" || columnFilters.length > 0;
  const tongDong = table.getFilteredRowModel().rows.length;

  /** Cột ẩn được — dùng cho menu "Cột hiển thị". */
  const cotAnDuoc = table.getAllColumns().filter((c) => c.getCanHide());

  return (
    <div className="flex flex-col gap-4">
      {/* ---- Thanh công cụ ---- */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-desc"
            aria-hidden
          />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-9"
          />
        </div>

        {filters.map((f) => {
          const col = table.getColumn(f.columnId);
          if (!col) return null;
          const giaTri = (col.getFilterValue() as string | undefined) ?? "";
          return (
            <Select
              key={f.columnId}
              value={giaTri || "tat-ca"}
              onValueChange={(v) => col.setFilterValue(v === "tat-ca" ? undefined : v)}
            >
              <SelectTrigger className="w-auto min-w-40" aria-label={f.label}>
                {/* base-ui hiển thị giá trị thô nếu không tự dựng nhãn — phải
                    ánh xạ về nhãn tiếng Việt, kẻo hiện ra "tat-ca". */}
                <SelectValue>
                  {(v) => (v === "tat-ca" ? `${f.label}: tất cả` : String(v))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tat-ca">{f.label}: tất cả</SelectItem>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}

        {coLoc && (
          <Button
            variant="ghost"
            onClick={() => {
              setGlobalFilter("");
              setColumnFilters([]);
            }}
          >
            <X aria-hidden />
            Bỏ lọc
          </Button>
        )}

        {/* Ẩn/hiện cột — chỉ có nghĩa khi đang xem dạng bảng */}
        {cotAnDuoc.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" className="ml-auto hidden md:inline-flex" />}
            >
              <Settings2 aria-hidden />
              Cột hiển thị
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hiện/ẩn cột</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {cotAnDuoc.map((col) => (
                <DropdownMenuItem
                  key={col.id}
                  closeOnClick={false}
                  onClick={() => col.toggleVisibility(!col.getIsVisible())}
                >
                  <Checkbox checked={col.getIsVisible()} aria-hidden tabIndex={-1} />
                  {typeof col.columnDef.meta === "object" &&
                  col.columnDef.meta &&
                  "label" in col.columnDef.meta
                    ? String(col.columnDef.meta.label)
                    : col.id}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* ---- Thao tác hàng loạt ---- */}
      {enableSelection && dongDaChon.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2">
          <span className="text-sm font-medium text-text-primary">
            Đã chọn {formatNumber(dongDaChon.length)} dòng
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {renderBulkActions?.(dongDaChon)}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => table.resetRowSelection()}
          >
            Bỏ chọn
          </Button>
        </div>
      )}

      {tongDong === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={coLoc ? "Không có kết quả phù hợp" : emptyTitle}
          description={
            coLoc
              ? "Thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc."
              : emptyDescription
          }
        />
      ) : (
        <>
          {/* ---- Bảng: từ Tablet trở lên, cuộn ngang khi hẹp ---- */}
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sorted = header.column.getIsSorted();
                      return (
                        <TableHead key={header.id} style={{ width: header.getSize() }}>
                          {header.isPlaceholder ? null : canSort ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="-mx-1 inline-flex items-center gap-1.5 rounded px-1 py-1 transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                              aria-label={`Sắp xếp theo ${String(header.column.columnDef.header)}`}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {sorted === "asc" ? (
                                <ArrowUp className="size-3.5 text-primary" aria-hidden />
                              ) : sorted === "desc" ? (
                                <ArrowDown className="size-3.5 text-primary" aria-hidden />
                              ) : (
                                <ChevronsUpDown className="size-3.5 opacity-40" aria-hidden />
                              )}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row: Row<TData>) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ---- Card List: Mobile ---- */}
          <div className="flex flex-col gap-3 md:hidden">
            {table.getRowModel().rows.map((row) => (
              <div key={getRowId(row.original)}>{renderCard(row.original)}</div>
            ))}
          </div>

          {/* ---- Phân trang ---- */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-text-desc">
              Hiển thị{" "}
              <strong className="text-text-secondary">
                {formatNumber(
                  table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1,
                )}
                –
                {formatNumber(
                  Math.min(
                    (table.getState().pagination.pageIndex + 1) *
                      table.getState().pagination.pageSize,
                    tongDong,
                  ),
                )}
              </strong>{" "}
              trên tổng <strong className="text-text-secondary">{formatNumber(tongDong)}</strong>
            </p>

            <div className="flex items-center gap-2">
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(v) => table.setPageSize(Number(v))}
              >
                <SelectTrigger size="sm" className="w-auto" aria-label="Số dòng mỗi trang">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} dòng/trang
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Trang trước"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <span className="px-2 text-xs text-text-desc">
                  Trang {table.getState().pagination.pageIndex + 1}/{table.getPageCount() || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Trang sau"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                >
                  <ChevronRight aria-hidden />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export type { ColumnDef };
