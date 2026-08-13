"use client";

import { useEffect, useState } from "react";
import { Copy, ListChecks } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import { formatNumber } from "@/6-tien-ich/dinh-dang";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * HỘP NHÂN BẢN ĐỀ NGHỊ — chép phiếu rồi bỏ bớt mặt hàng ngay trong một thao tác.
 *
 * 🔴 Ban lãnh đạo 13/08/2026: *"nhân bản sẽ giữ nguyên toàn bộ thông tin chỉ thêm chữ
 * (copy) phía sau và có chức năng xóa bớt mặt hàng để giao cho nhân viên phù hợp"*.
 *
 * Đây là cách TÁCH PHIẾU: một đề nghị 10 mặt hàng cần hai người đi hỏi giá hai nhóm vật
 * tư khác nhau → nhân bản hai lần, mỗi lần giữ phần của một người, rồi giao riêng.
 *
 * 📌 Vì sao chọn ngay trong hộp nhân bản chứ không "nhân bản xong rồi vào sửa": tách phiếu
 * là một ý định trọn vẹn của người dùng. Bắt họ làm hai bước rời nhau thì bước hai dễ bị
 * quên, và một bản copy nguyên xi 10 mặt hàng nằm lại trong bảng trông y hệt phiếu gốc —
 * không ai biết cái nào là cái nào.
 *
 * ⚠️ Mặc định TÍCH HẾT. Người dùng chỉ muốn copy nguyên thì bấm thẳng nút, không phải đi
 * tick 10 dòng; còn muốn tách thì bỏ tick vài dòng. Mặc định trống sẽ khiến thao tác
 * thường gặp nhất thành thao tác tốn công nhất.
 */
export function HopNhanBanDeNghi({
  deNghi,
  mo,
  onDong,
  onXacNhan,
}: {
  /** Phiếu gốc. `null` khi chưa chọn phiếu nào — hộp vẫn dựng để hiệu ứng đóng chạy hết. */
  deNghi: DeNghiMuaHang | null;
  mo: boolean;
  onDong: () => void;
  /** Nhận danh sách `stt` các dòng được giữ lại. */
  onXacNhan: (sttGiuLai: number[]) => void;
}) {
  const [chon, setChon] = useState<Set<number>>(new Set());

  /**
   * Mở hộp cho phiếu nào thì tích hết dòng của phiếu đó.
   * ⚠️ Phải phụ thuộc `deNghi?.id` chứ không phải `deNghi`: đối tượng dựng lại mỗi lần kho
   * dữ liệu đổi, để `deNghi` là lựa chọn của người dùng bị xóa sạch giữa chừng khi có
   * người khác trong phòng sửa một phiếu bất kỳ.
   */
  useEffect(() => {
    if (mo && deNghi) setChon(new Set(deNghi.items.map((d) => d.stt)));
  }, [mo, deNghi?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!deNghi) return null;

  const tatCa = deNghi.items;
  const soChon = chon.size;

  function doiDong(stt: number) {
    setChon((truoc) => {
      const s = new Set(truoc);
      if (s.has(stt)) s.delete(stt);
      else s.add(stt);
      return s;
    });
  }

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nhân bản đề nghị {deNghi.code}</DialogTitle>
          <DialogDescription>
            Bản sao giữ nguyên dự án, công trình, ngày cần hàng, người theo dõi và tài liệu
            đính kèm. Tên phiếu thành “{deNghi.tieuDe} (copy)”.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
              <ListChecks className="size-4 shrink-0 text-text-desc" aria-hidden />
              Mặt hàng giữ lại ({soChon}/{tatCa.length})
            </span>
            {/* Hai nút này để tách phiếu nhanh: bỏ hết rồi tick vài dòng cần, thay vì bỏ
                tick từng dòng trong phiếu 20 mặt hàng. */}
            <span className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChon(new Set(tatCa.map((d) => d.stt)))}
              >
                Chọn hết
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setChon(new Set())}>
                Bỏ hết
              </Button>
            </span>
          </div>

          {/* Cuộn trong hộp: phiếu 20 mặt hàng thì danh sách dài hơn màn hình, mà nút xác
              nhận phải luôn nhìn thấy — đẩy nút xuống dưới màn là người dùng tưởng hộp hỏng. */}
          <ul className="flex max-h-64 flex-col divide-y divide-divider overflow-y-auto rounded-lg border border-border">
            {tatCa.map((d) => {
              const dangChon = chon.has(d.stt);
              return (
                <li key={d.stt}>
                  <label
                    className={`flex min-w-0 cursor-pointer items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-muted ${
                      dangChon ? "" : "opacity-55"
                    }`}
                  >
                    <Checkbox
                      checked={dangChon}
                      onCheckedChange={() => doiDong(d.stt)}
                      className="mt-0.5 shrink-0"
                      aria-label={`Giữ lại ${d.tenVatLieu}`}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-text-primary">
                        {d.stt}. {d.tenVatLieu}
                      </span>
                      <span className="truncate text-xs text-text-desc">
                        {d.quyCach ? `${d.quyCach} · ` : ""}
                        {formatNumber(d.khoiLuongDeNghi)} {d.donViTinh}
                        {/* Dòng đã có người phụ trách ở phiếu GỐC — nói rõ để người tách
                            biết mình đang cắt phần việc của ai ra. Bản sao thì bỏ trống
                            phân bổ, vì tách phiếu chính là để giao lại. */}
                        {d.nguoiPhuTrachTen ? ` · đang giao ${d.nguoiPhuTrachTen}` : ""}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          {/* 🔴 Nút mờ PHẢI kèm lý do — nút mờ không giải thích là kiểu bí việc khó chịu
              nhất: người dùng bấm mãi không được mà chẳng biết vì sao. */}
          {soChon === 0 && (
            <p className="text-xs text-warning-soft">
              Chưa giữ mặt hàng nào. Phiếu không có vật tư thì không đi tiếp được bước nào —
              chọn ít nhất một dòng.
            </p>
          )}
          {soChon > 0 && soChon < tatCa.length && (
            <p className="text-xs text-text-desc">
              Phiếu gốc <strong>{deNghi.code}</strong> vẫn giữ đủ {tatCa.length} mặt hàng. Muốn
              tách hẳn thì sau khi nhân bản, vào phiếu gốc bỏ những dòng đã chuyển sang bản
              mới.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Hủy
          </Button>
          <Button
            disabled={soChon === 0}
            onClick={() => {
              onXacNhan([...chon]);
              onDong();
            }}
          >
            <Copy className="size-4" aria-hidden />
            Nhân bản {soChon} mặt hàng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
