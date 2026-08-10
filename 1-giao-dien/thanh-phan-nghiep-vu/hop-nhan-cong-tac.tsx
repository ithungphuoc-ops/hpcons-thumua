"use client";

import { AlertTriangle, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { NHAN_GIAI_DOAN, type GiaiDoanMuaHang } from "@/2-quy-trinh/giai-doan-mua-hang";
import type { ThongBaoChuyenBuoc } from "@/3-du-lieu/kieu-du-lieu";

const nhanBuoc = (ma?: string) =>
  ma ? (NHAN_GIAI_DOAN[ma as GiaiDoanMuaHang]?.nhan ?? ma) : "";

/**
 * HỘP XÁC NHẬN NHẬN CÔNG TÁC — dùng chung cho chuông thông báo VÀ thẻ trên bảng quy trình.
 *
 * 🔴 Chỉ đạo Ban lãnh đạo 10/08/2026: *"khi nhân viên bấm tiếp nhận thì phải hiện thông báo
 * có chắc chắn nhận hay không, hay do bấm nhầm"*, và *"thêm nút nhận trong mục quy trình"*.
 *
 * 🔴 TÁCH RA DÙNG CHUNG LÀ CỐ Ý: có hai chỗ bấm nhận (chuông và thẻ trên bảng). Copy hộp
 * thoại sang chỗ thứ hai thì sửa lời cảnh báo ở một chỗ là chỗ kia lệch ngay — mà đây là lời
 * cảnh báo về việc KHÔNG HOÀN LẠI ĐƯỢC, lệch là người dùng bấm mà không biết hệ quả.
 */
export function HopNhanCongTac({
  thongBao,
  /** Nhận xong có tự chuyển sang bước "Yêu cầu NCC báo giá" hay không — để nói trước hệ quả. */
  seTuChuyenBuoc,
  onDong,
  onDongY,
}: {
  thongBao: ThongBaoChuyenBuoc | null;
  seTuChuyenBuoc: boolean;
  onDong: () => void;
  onDongY: (tb: ThongBaoChuyenBuoc) => void;
}) {
  return (
    // Cờ mở tách khỏi nội dung: đóng thì nội dung còn nguyên tới lúc hiệu ứng chạy xong. Xóa
    // nội dung cùng lúc với đóng sẽ tháo cây con giữa lúc đang chuyển động và để lại lớp mờ.
    <Dialog open={thongBao !== null} onOpenChange={(v: boolean) => !v && onDong()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nhận công tác này?</DialogTitle>
          <DialogDescription>
            Tên bạn sẽ được ghi là người tiếp quản, kèm ngày giờ, vào nhật ký của đề nghị.
            <strong> Không hoàn lại được.</strong>
          </DialogDescription>
        </DialogHeader>

        {thongBao && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-0.5 rounded-lg bg-muted p-(--hp-md-row-pad) text-sm">
              <span className="font-semibold text-text-primary">{thongBao.prCode}</span>
              <span className="text-xs text-text-desc">{thongBao.tieuDe}</span>
              <span className="text-xs text-text-secondary">
                Bước: <strong>{nhanBuoc(thongBao.denBuoc)}</strong>
              </span>
            </div>

            {/* Nói TRƯỚC hệ quả, không để người dùng phát hiện sau khi đã bấm. */}
            {seTuChuyenBuoc && (
              <div className="flex items-start gap-2 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-soft" aria-hidden />
                <span>
                  Nhận xong, đề nghị <strong>tự chuyển sang bước “Yêu cầu NCC báo giá”</strong> và
                  hệ thống lập luôn bảng báo giá để bạn mời nhà cung cấp chào giá.
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Chưa nhận
          </Button>
          <Button
            onClick={() => {
              if (thongBao) onDongY(thongBao);
              onDong();
            }}
          >
            <Check className="size-4" aria-hidden />
            {/* Nhãn "Chấp nhận" theo chỉ đạo Ban lãnh đạo 10/08/2026 (trước là "Chắc chắn nhận"). */}
            Chấp nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
