"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Clock, Eye, UserCheck } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { TimelineDeNghi } from "@/1-giao-dien/thanh-phan-nghiep-vu/timeline-de-nghi";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { tinhTienDoDeNghi, tomTatTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import { NHAN_TRANG_THAI_DE_NGHI } from "@/2-quy-trinh/trang-thai";
import {
  NHAN_GIAI_DOAN,
  tinhTrangTiepNhan,
  xacDinhGiaiDoan,
  type TinhTrangTiepNhan,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import { formatMocThoiGian } from "@/6-tien-ich/dinh-dang";

/**
 * M6 — Người đề nghị (Phòng Thi công) theo dõi tiến trình đề nghị của mình.
 * Màn hình MỚI, bản thumua-next cũ không có.
 * 🔒 Không hiển thị: đơn giá, thành tiền, nhà cung cấp, tên nhân viên thu mua.
 */
export default function TrangTheoDoi() {
  const { deNghi, donHang, baoGia, phieuNhan, thongBao } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  /** Người đề nghị chỉ thấy đề nghị của mình; vai trò quản lý thấy hết. */
  const danhSach = useMemo(() => {
    const nguon = quyen.xemMoiHoSo
      ? deNghi
      : deNghi.filter((dn) => dn.nguoiDeNghiUid === nguoiDung.uid);
    return nguon.map((dn) => {
      const tienDo = tinhTienDoDeNghi(dn, donHang, phieuNhan);
      return {
        dn,
        tienDo,
        tomTat: tomTatTienDoDeNghi(tienDo),
        // 🔴 Chỉ đạo Ban lãnh đạo 11/08/2026: trưởng bộ phận bấm tiếp nhận thì màn này phải
        // tự cập nhật. Cả hai đều SUY RA từ chứng từ / thông báo, không thêm trường mới —
        // xem `tinhTrangTiepNhan` và `xacDinhGiaiDoan`.
        giaiDoan: xacDinhGiaiDoan(dn, donHang, baoGia, phieuNhan),
        tiepNhan: tinhTrangTiepNhan(dn.id, thongBao),
      };
    });
  }, [deNghi, donHang, baoGia, phieuNhan, thongBao, nguoiDung.uid, quyen.xemMoiHoSo]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Thu mua", href: "/tong-quan" }, { label: "Theo dõi đề nghị" }]}
        title="Theo dõi đề nghị"
        description="Tiến trình hồ sơ đề nghị mua hàng — không hiển thị giá và nhà cung cấp"
      />

      {danhSach.length === 0 ? (
        <EmptyState
          icon={Eye}
          title="Chưa có đề nghị nào để theo dõi"
          description="Đề nghị bạn lập trên HPcore sau khi được duyệt sẽ hiện ở đây."
        />
      ) : (
        <div className="flex flex-col gap-(--hp-md-card-gap)">
          {danhSach.map(({ dn, tienDo, tomTat, giaiDoan, tiepNhan }) => {
            const tt = NHAN_TRANG_THAI_DE_NGHI[dn.trangThai];
            const buoc = NHAN_GIAI_DOAN[giaiDoan];
            return (
              <Card key={dn.id}>
                <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/theo-doi/${dn.id}`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {dn.code}
                      </Link>
                      <span className="text-sm text-text-primary">{dn.tieuDe}</span>
                      <span className="text-xs text-text-desc">{dn.tenCongTrinh}</span>
                    </div>
                    {/* Bước hiện tại đứng cạnh trạng thái: người đề nghị cần biết hồ sơ
                        đang nằm ở đâu, không chỉ "đã duyệt" hay "hoàn thành". */}
                    <span className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge label={buoc.nhan} tone={buoc.tong} />
                      <StatusBadge label={tt.nhan} tone={tt.tong} />
                    </span>
                  </div>

                  {/* ---- Đã có người thu mua tiếp nhận chưa ---- */}
                  {/* 🔒 Giấu TÊN người tiếp nhận với vai trò không được xem người phụ trách
                      (Phòng Thi công). Họ chỉ cần biết "đã có người nhận việc lúc nào" —
                      đủ để thôi phải gọi điện hỏi, mà không lộ nhân sự nội bộ phòng thu mua. */}
                  <DongTiepNhan tiepNhan={tiepNhan} hienTen={quyen.xemNguoiPhuTrach} />

                  <TimelineDeNghi
                    ngayDuyet={dn.ngayDuyet}
                    ngayCanHang={dn.ngayCanHang}
                    soDongDaNhanDu={tomTat.soDongDaNhanDu}
                    tongSoDong={tomTat.tongSoDong}
                    soDongDaPhanBo={tienDo.filter((d) => d.trangThaiDong !== "chua_phan_bo").length}
                    soDongDaLenPO={tienDo.filter((d) => d.maPOLienQuan.length > 0).length}
                  />

                  <Link
                    href={`/theo-doi/${dn.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Xem chi tiết từng mặt hàng →
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

/**
 * Một dòng cho biết đề nghị đã có người thu mua tiếp nhận chưa.
 *
 * 🔴 Tách thành component vì màn danh sách và màn chi tiết đều dùng — chép hai lần thì sửa
 * một chỗ là chỗ kia lệch, mà đây là câu trả lời cho đúng thứ người đề nghị muốn biết nhất.
 */
export function DongTiepNhan({
  tiepNhan,
  /** Vai trò được xem tên nhân viên thu mua hay không. */
  hienTen,
}: {
  tiepNhan: TinhTrangTiepNhan;
  hienTen: boolean;
}) {
  if (!tiepNhan.daNhan) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
        <Clock className="size-4 shrink-0 text-warning-soft" aria-hidden />
        <span>
          <strong>Chờ Phòng Thu mua tiếp nhận.</strong> Khi có người nhận việc, dòng này sẽ tự
          đổi — không cần gọi hỏi.
        </span>
      </p>
    );
  }
  return (
    <p className="flex items-center gap-2 rounded-lg border border-success bg-success-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
      <UserCheck className="size-4 shrink-0 text-success-soft" aria-hidden />
      <span>
        <strong>Phòng Thu mua đã tiếp nhận</strong>
        {hienTen && tiepNhan.ten ? ` — ${tiepNhan.ten}` : ""}
        {tiepNhan.thoiDiem ? ` · ${formatMocThoiGian(tiepNhan.thoiDiem)}` : ""}
        {tiepNhan.buoc ? ` · bước "${NHAN_GIAI_DOAN[tiepNhan.buoc]?.nhan ?? tiepNhan.buoc}"` : ""}
      </span>
    </p>
  );
}
