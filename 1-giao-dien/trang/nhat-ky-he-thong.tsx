"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { History } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Skeleton } from "@/1-giao-dien/nen-tang-ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/1-giao-dien/nen-tang-ui/table";
import {
  dangNgheNhatKyHeThong,
  type MucNhatKyHeThong,
} from "@/3-du-lieu/nhat-ky-he-thong";
import { CHE_DO_XAC_THUC } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { formatDateTime } from "@/6-tien-ich/dinh-dang";

/**
 * ★ BỘ LỌC THEO `?loc=` — Sếp 06/10/2026 (gói D phân quyền). Bảng mẫu chức danh có nút "Xem lịch sử" dẫn
 * về `/nhat-ky-he-thong?loc=phan_quyen`: mọi lần lưu phân quyền (tick riêng, bỏ quyền riêng, sửa mẫu, đưa
 * mẫu về mặc định) ghi MỘT dòng với `hanhDong` tiền tố chung `phan_quyen_` (đặc tả 2.1 — mã ở
 * `HANH_DONG_NHAT_KY`, `4-phan-quyen/tinh-luu-phan-quyen.ts`; bài kiểm-luật canh mọi mã đều mang tiền tố này).
 *
 * ⚠️ CHỈ LỌC TRONG 200 DÒNG MỚI NHẤT mà trang đang nghe (`dangNgheNhatKyHeThong`) — không truy vấn lại
 * Firestore theo `hanhDong` (cần chỉ mục ghép, chưa đo). Màn hình nói rõ điều này.
 */
const BO_LOC: Record<string, { nhan: string; tienTo: string }> = {
  phan_quyen: { nhan: "Phân quyền", tienTo: "phan_quyen_" },
};

/**
 * ★ TRANG NHẬT KÝ HỆ THỐNG — thêm 29/08/2026.
 *
 * Ra đời sau sự cố sáng cùng ngày: "Quy trình mua hàng" trống trơn, không ai biết ai đã bấm
 * "Xóa dữ liệu chạy thử" lúc nào — tra thẳng Firestore chỉ biết được `updateTime` của
 * document, không biết AI. Xem chú thích đầy đủ ở `3-du-lieu/nhat-ky-he-thong.ts`.
 *
 * 🔴 CHỈ HIỂN THỊ, KHÔNG SỬA/XÓA ĐƯỢC GÌ Ở ĐÂY — đúng bản chất "chỉ ghi thêm" của nhật ký
 * (xem `firestore-chay-thu.rules`). Trang này không có nút xóa dòng nào, kể cả cho quản trị.
 *
 * 📌 `useSearchParams` bắt buộc nằm trong `Suspense` (bổ sung đặc tả D-F7, tiền lệ
 * `don-hang-lap-moi.tsx`), nếu không `next build` báo "missing-suspense-with-csr-bailout" và dừng.
 */
export default function TrangNhatKyHeThong() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <NoiDungNhatKyHeThong />
    </Suspense>
  );
}

function NoiDungNhatKyHeThong() {
  const thamSo = useSearchParams();
  const maLoc = thamSo.get("loc") ?? "";
  const loc = BO_LOC[maLoc] ?? null;
  /* Chế độ tài khoản mẫu: không có Firebase → không có nhật ký. Trước đây trang kẹt "Đang tải…" mãi. */
  const laDemo = CHE_DO_XAC_THUC === "mau";

  const [muc, setMuc] = useState<MucNhatKyHeThong[]>([]);
  const [dangTai, setDangTai] = useState(!laDemo);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    if (laDemo) return;
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
  }, [laDemo]);

  const mucHien = loc ? muc.filter((m) => m.hanhDong.startsWith(loc.tienTo)) : muc;

  return (
    <div className="flex flex-col gap-(--hp-md-card-gap)">
      <PageHeader
        crumbs={[{ label: "Thu mua", href: "/tong-quan" }, { label: "Nhật ký hệ thống" }]}
        title="Nhật ký hệ thống"
        description="Ai đã làm gì, lúc nào — cho những hành động quan trọng và không thể hoàn tác của app. Tách riêng khỏi dữ liệu chạy thử nên không bị xóa theo khi ai đó bấm “Xóa dữ liệu chạy thử”."
      />

      {/* ---- Bộ lọc: luôn có CHỮ nói đang lọc gì, và lọc trong phạm vi nào ---- */}
      <nav aria-label="Lọc nhật ký" className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href="/nhat-ky-he-thong"
          aria-current={loc ? undefined : "page"}
          className={`inline-flex min-h-11 items-center rounded-lg border px-3 transition-colors ${
            loc ? "border-border text-text-secondary hover:bg-muted" : "border-primary bg-primary-bg text-primary"
          }`}
        >
          Tất cả
        </Link>
        {Object.entries(BO_LOC).map(([ma, l]) => (
          <Link
            key={ma}
            href={`/nhat-ky-he-thong?loc=${ma}`}
            aria-current={maLoc === ma ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-lg border px-3 transition-colors ${
              maLoc === ma ? "border-primary bg-primary-bg text-primary" : "border-border text-text-secondary hover:bg-muted"
            }`}
          >
            {l.nhan}
          </Link>
        ))}
        {loc && (
          <span className="text-xs text-text-desc">
            Đang lọc “{loc.nhan}” — chỉ trong 200 dòng nhật ký mới nhất ({mucHien.length} dòng khớp).
          </span>
        )}
      </nav>

      <Card>
        <CardContent className="p-0">
          {laDemo ? (
            <EmptyState
              icon={History}
              title="Bản demo không có Nhật ký hệ thống"
              description="Chế độ tài khoản mẫu không nối máy chủ nên không có nhật ký. Lịch sử phân quyền của bản demo xem ở màn Phân quyền → bảng mẫu theo chức danh → “Xem lịch sử demo”."
            />
          ) : dangTai ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-text-desc">
              <History className="size-4 animate-pulse" aria-hidden />
              Đang tải nhật ký…
            </div>
          ) : loi ? (
            <EmptyState icon={History} title="Không tải được nhật ký" description={loi} />
          ) : mucHien.length === 0 ? (
            <EmptyState
              icon={History}
              title={loc ? `Chưa có dòng “${loc.nhan}” nào trong 200 dòng mới nhất` : "Chưa có dòng nhật ký nào"}
              description={
                loc
                  ? "Bộ lọc chỉ xét 200 dòng nhật ký mới nhất. Dòng cũ hơn (nếu có) không hiện ở đây."
                  : "Nhật ký sẽ tự ghi khi có ai thực hiện một hành động quan trọng, ví dụ xóa dữ liệu chạy thử hoặc xóa một đề nghị."
              }
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
                  {mucHien.map((m) => (
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
