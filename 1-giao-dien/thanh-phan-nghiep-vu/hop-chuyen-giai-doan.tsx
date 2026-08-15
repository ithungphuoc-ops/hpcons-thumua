"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import {
  NHAN_CACH_GIAO_VIEC,
  caiDatCuaBuoc,
  type CauHinhQuyTrinh,
  type CongViecGiaiDoan,
} from "@/2-quy-trinh/cau-hinh-quy-trinh";
import { NHAN_GIAI_DOAN, type GiaiDoanMuaHang } from "@/2-quy-trinh/giai-doan-mua-hang";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * HỘP CHUYỂN NHIỆM VỤ SANG GIAI ĐOẠN TIẾP THEO — dựng theo ảnh Base Ban lãnh đạo gửi
 * 15/08/2026: *"điều chỉnh tính năng kéo thả sang bước tiếp theo, sẽ có cửa sổ thông báo
 * giống vậy và các trường nhập thông tin tương tự"*.
 *
 * Bố cục bám đúng ảnh:
 *   ① Câu dẫn: "Vui lòng hoàn thành các bước sau trước khi chuyển <mã> đến <bước đích>"
 *   ② ĐẦU VÀO CHO GIAI ĐOẠN <bước đích> — hai ô KHÓA (giao lại cho · thời hạn) đọc từ cấu
 *      hình, và ô ghi chú "Những việc đã hoàn thành?" cho người dùng gõ
 *   ③ CÔNG VIỆC ĐANG CHỜ XỬ LÝ Ở GIAI ĐOẠN TRƯỚC — việc bắt buộc chưa tích xong
 *   ④ Nút "Chuyển sang giai đoạn kế tiếp" · "Đóng lại"
 *
 * 🔴 HAI Ô KHÓA LÀ CỐ Ý, đúng như Base (biểu tượng ổ khóa): chúng hiện giá trị đang áp dụng
 * để người chuyển bước biết mình đang giao việc theo luật nào, nhưng sửa thì phải vào trang
 * Cài đặt quy trình — đổi ngay tại đây là mỗi hồ sơ một luật, không ai đối chiếu nổi.
 *
 * ⚠️ Ghi chú "Những việc đã hoàn thành" VÀO NHẬT KÝ đề nghị, không lưu thành trường riêng.
 * Nó là lời kể của người chuyển bước tại một thời điểm — đúng bản chất một dòng nhật ký.
 */
export function HopChuyenGiaiDoan({
  mo,
  deNghi,
  tuBuoc,
  denBuoc,
  cauHinh,
  seLam,
  canhBao,
  nhanNut,
  nguyHiem = false,
  congViecChuaXong,
  onDong,
  onXacNhan,
}: {
  mo: boolean;
  deNghi: DeNghiMuaHang | undefined;
  tuBuoc: GiaiDoanMuaHang;
  denBuoc: GiaiDoanMuaHang;
  cauHinh: CauHinhQuyTrinh;
  /** Điều app sẽ làm nếu bấm xác nhận — nói bằng lời người dùng hiểu. */
  seLam: string;
  /** Việc còn dang dở ở bước hiện tại (khác với công việc bắt buộc bên dưới). */
  canhBao: string[];
  nhanNut: string;
  nguyHiem?: boolean;
  /** Công việc bắt buộc của bước ĐANG ĐỨNG mà đề nghị này chưa tích xong. */
  congViecChuaXong: CongViecGiaiDoan[];
  onDong: () => void;
  /** `ghiChu` là nội dung ô "Những việc đã hoàn thành?" — rỗng thì không ghi nhật ký. */
  onXacNhan: (ghiChu: string) => void;
}) {
  const [ghiChu, setGhiChu] = useState("");

  // Mỗi lần mở lại là ô ghi chú trắng. Giữ nội dung cũ thì lần sau người dùng vô tình gửi
  // lại ghi chú của hồ sơ khác — nhật ký ghi sai mà không ai để ý.
  useEffect(() => {
    if (mo) setGhiChu("");
  }, [mo]);

  const nhanDich = NHAN_GIAI_DOAN[denBuoc]?.nhan ?? denBuoc;
  const nhanNguon = NHAN_GIAI_DOAN[tuBuoc]?.nhan ?? tuBuoc;
  const caiDatDich = caiDatCuaBuoc(cauHinh, denBuoc);
  const hanDich = cauHinh.hanGioTheoBuoc?.[denBuoc] ?? 0;
  /** Còn việc bắt buộc chưa xong thì KHÔNG cho chuyển — luật ở `congViecChuaXongCuaBuoc`. */
  const bikhoa = congViecChuaXong.length > 0;

  return (
    <Dialog open={mo} onOpenChange={(v) => !v && onDong()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chuyển nhiệm vụ sang giai đoạn tiếp theo</DialogTitle>
          <DialogDescription>
            Vui lòng hoàn thành các bước sau trước khi chuyển{" "}
            <strong className="text-text-primary">{deNghi?.code ?? "hồ sơ"}</strong> từ{" "}
            <strong className="text-text-primary">{nhanNguon}</strong> đến{" "}
            <strong className="text-text-primary">{nhanDich}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* ===== ② ĐẦU VÀO CHO GIAI ĐOẠN ===== */}
          <div className="flex flex-col gap-2 border-t border-divider pt-3">
            <p className="text-center text-xs font-semibold tracking-wide text-text-desc uppercase">
              Đầu vào cho giai đoạn{" "}
              <span className="rounded bg-muted px-1.5 py-0.5 normal-case text-text-primary">
                {nhanDich}
              </span>
            </p>

            {/* Ô KHÓA 1 — cách giao việc của bước đích. */}
            <OKhoa nhan="Giao lại cho" giaTri={NHAN_CACH_GIAO_VIEC[caiDatDich.cachGiaoViec]} />

            {/* Ô KHÓA 2 — thời hạn chuẩn của bước đích (Base ghi "DURATION"). */}
            <OKhoa
              nhan="Thời hạn của bước"
              giaTri={hanDich > 0 ? `${hanDich} giờ` : "Không đặt thời hạn"}
            />

            {/* Ô NHẬP — "Những việc đã hoàn thành?" đúng chữ trong ảnh Base. */}
            <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3">
              <Label htmlFor="ghi-chu-chuyen-buoc">Những việc đã hoàn thành?</Label>
              <textarea
                id="ghi-chu-chuyen-buoc"
                rows={3}
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                placeholder="Ghi nhanh những gì đã làm xong ở bước trước — sẽ vào nhật ký đề nghị."
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none"
              />
              {/* Nói rõ ghi chú đi đâu. Không nói thì người dùng ngại gõ vì sợ mất công vô ích. */}
              <p className="text-xs text-text-desc">
                Để trống cũng được. Có nội dung thì app ghi vào <strong>Lịch sử</strong> của đề
                nghị, người sau đọc lại biết bước trước đã làm những gì.
              </p>
            </div>
          </div>

          {/* ===== ③ CÔNG VIỆC ĐANG CHỜ Ở GIAI ĐOẠN TRƯỚC ===== */}
          {congViecChuaXong.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-divider pt-3">
              <p className="text-center text-xs font-semibold tracking-wide text-text-desc uppercase">
                Công việc đang chờ xử lý ở giai đoạn trước
              </p>
              <p className="text-xs text-text-desc">{nhanNguon}</p>
              <ul className="flex flex-col gap-1.5">
                {congViecChuaXong.map((cv) => (
                  <li
                    key={cv.ma}
                    className="flex items-start justify-between gap-2 rounded-lg border border-warning/40 bg-warning-bg px-3 py-2"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium text-text-primary">{cv.ten}</span>
                      {cv.moTa && <span className="text-xs text-text-desc">{cv.moTa}</span>}
                    </span>
                    <StatusBadge label="Chưa xong" tone="warning" />
                  </li>
                ))}
              </ul>
              {/* 🔴 Chỉ đường tới chỗ tích, đừng bắt người dùng tự mò. */}
              <p className="text-xs text-warning-soft">
                Phải tích hoàn thành các việc trên mới chuyển bước được. Tích ở khối{" "}
                <strong>“Công việc của bước”</strong> trong trang chi tiết đề nghị.
              </p>
            </div>
          )}

          {/* ===== Việc app sẽ làm + cảnh báo ===== */}
          <div className="flex flex-col gap-2 border-t border-divider pt-3">
            <p className="text-sm text-text-secondary">{seLam}</p>
            {canhBao.length > 0 && (
              <ul className="flex flex-col gap-1">
                {canhBao.map((c) => (
                  <li key={c} className="flex items-start gap-1.5 text-xs text-warning-soft">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            variant={nguyHiem ? "destructive" : "default"}
            disabled={bikhoa}
            onClick={() => onXacNhan(ghiChu.trim())}
          >
            {nhanNut}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onDong}>
            Đóng lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Ô chỉ đọc kèm biểu tượng ổ khóa — đúng cách Base thể hiện các giá trị lấy từ cài đặt quy
 * trình. Hiện để người chuyển bước BIẾT luật đang áp dụng, không phải để sửa tại chỗ.
 */
function OKhoa({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border border-border bg-muted px-3 py-2">
      <span className="flex min-w-0 flex-col">
        <span className="text-xs text-text-desc">{nhan}</span>
        <span className="text-sm text-text-primary">{giaTri}</span>
      </span>
      <Lock className="mt-0.5 size-3.5 shrink-0 text-text-desc" aria-hidden />
    </div>
  );
}
