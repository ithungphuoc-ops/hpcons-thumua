"use client";

import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";
import type { GhiChuCongViec } from "@/3-du-lieu/ghi-chu-ca-nhan";

/**
 * HỘP VIẾT GHI CHÚ TRÊN LỊCH — dùng chung cho THÊM MỚI và SỬA.
 *
 * 🔴 Chỉ đạo Ban lãnh đạo 11/08/2026: *"thêm chức năng viết ghi chú trong lịch"*.
 *
 * Trước đó ô nhập ghi chú CÓ, nhưng chỉ hiện sau khi bấm vào một ô ngày — mở màn Lịch ra
 * không thấy chữ "ghi chú" nào nên coi như không có. Đúng lỗi vừa mắc với nút Xuất Excel:
 * đặt chức năng sau một hành động mà người dùng không biết phải làm.
 *
 * ⚠️ Ô nhập là TEXTAREA nhiều dòng, không phải một dòng. Ghi chú công việc thật thường dài
 * hơn một dòng ("gọi NCC B hỏi giá thép, nếu trên 16k thì xin ý kiến trưởng phòng trước khi
 * chốt") — ô một dòng khiến người dùng phải viết tắt rồi sau không hiểu mình ghi gì.
 *
 * 🔒 Ghi chú là SỔ TAY RIÊNG TƯ (Sếp chốt 11/08/2026). Hộp này phải nhắc lại điều đó ngay lúc
 * người dùng đang gõ — đó là lúc họ cần biết cái mình viết có ai đọc không.
 */
export function HopGhiChuLich({
  /** `null` = đóng. Có giá trị = mở, với ngày mặc định này (`YYYY-MM-DD`). */
  ngay,
  /** Truyền vào để SỬA; bỏ trống là thêm mới. */
  dangSua,
  onDong,
  onLuu,
}: {
  ngay: string | null;
  dangSua?: GhiChuCongViec;
  onDong: () => void;
  onLuu: (noiDung: string, ngayHan: string) => void;
}) {
  const [noiDung, setNoiDung] = useState("");
  const [ngayHan, setNgayHan] = useState("");

  /**
   * Nạp lại giá trị mỗi lần hộp mở.
   *
   * ⚠️ Phải theo dõi cả `ngay` và `dangSua`: mở hộp cho ngày khác, hoặc chuyển từ "thêm mới"
   * sang "sửa", đều phải đổi nội dung ô. Thiếu cái này thì bấm Sửa sẽ thấy ô trống, hoặc
   * thêm mới lại thấy nội dung ghi chú vừa sửa.
   */
  useEffect(() => {
    if (ngay === null) return;
    setNoiDung(dangSua?.noiDung ?? "");
    setNgayHan(dangSua?.ngayHan ?? ngay);
  }, [ngay, dangSua]);

  const luuDuoc = noiDung.trim() !== "" && ngayHan !== "";

  return (
    // Cờ mở tách khỏi nội dung: đóng thì nội dung còn nguyên tới lúc hiệu ứng chạy xong.
    <Dialog open={ngay !== null} onOpenChange={(v: boolean) => !v && onDong()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dangSua ? "Sửa ghi chú" : "Viết ghi chú"}</DialogTitle>
          <DialogDescription className="flex items-start gap-1.5">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              Ghi chú lưu trong trình duyệt máy này và <strong>chỉ bạn đọc được</strong>. Muốn
              giao việc cho người khác thì dùng bảng phân bổ hoặc nút Chuyển tiếp ở trang chi
              tiết đề nghị.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gc-noi-dung">Nội dung</Label>
            <Textarea
              id="gc-noi-dung"
              value={noiDung}
              onChange={(e) => setNoiDung(e.target.value)}
              rows={4}
              placeholder={
                "vd Gọi NCC hỏi giá thép D14, nếu trên 16.000/kg thì xin ý kiến trưởng phòng trước khi chốt"
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gc-ngay">Ngày phải làm</Label>
            <Input
              id="gc-ngay"
              type="date"
              value={ngayHan}
              onChange={(e) => setNgayHan(e.target.value)}
              className="w-48"
            />
            {/* Cho đổi ngày ngay trong hộp: việc bị hoãn là chuyện thường, không nên bắt
                người dùng xóa rồi viết lại ở ngày khác. */}
            <p className="text-xs text-text-desc">
              Đổi ngày ở đây là ghi chú chuyển sang ô ngày đó trên lịch.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Hủy
          </Button>
          <Button
            disabled={!luuDuoc}
            onClick={() => {
              if (!luuDuoc) return;
              onLuu(noiDung.trim(), ngayHan);
              onDong();
            }}
          >
            <Check className="size-4" aria-hidden />
            {dangSua ? "Lưu thay đổi" : "Thêm ghi chú"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
