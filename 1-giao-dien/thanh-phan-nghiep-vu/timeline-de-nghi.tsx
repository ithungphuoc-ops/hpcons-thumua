import { Check } from "lucide-react";
import { soNgayConLai } from "@/2-quy-trinh/tinh-toan";
import { cn } from "@/6-tien-ich/gop-lop";

export interface TimelineDeNghiProps {
  /** Ngày dạng ISO (yyyy-mm-dd) — component tự định dạng để hiển thị. */
  ngayDuyet: string;
  /** Ngày dạng ISO (yyyy-mm-dd). */
  ngayCanHang: string;
  soDongDaNhanDu: number;
  tongSoDong: number;
  soDongDaPhanBo: number;
  soDongDaLenPO: number;
}

/**
 * Timeline tiến trình Đề nghị — 5 mốc, gộp tiến độ của nhiều PO về một thanh.
 * Đây là màn hình cho người đề nghị (Phòng thi công) theo dõi hồ sơ của mình.
 *
 * Quy tắc %: số dòng đã nhận đủ / tổng số dòng (Phần 6.2 đặc tả) — dùng chung
 * cho mọi nhóm người xem để không ai thấy số khác ai.
 */
export function TimelineDeNghi({
  ngayDuyet,
  ngayCanHang,
  soDongDaNhanDu,
  tongSoDong,
  soDongDaPhanBo,
  soDongDaLenPO,
}: TimelineDeNghiProps) {
  const conLai = soNgayConLai(ngayCanHang);
  const quaHan = conLai < 0;
  const xong = tongSoDong > 0 && soDongDaNhanDu === tongSoDong;

  const moc = [
    { nhan: "Duyệt", xong: true },
    { nhan: "Đã phân bổ", xong: soDongDaPhanBo === tongSoDong },
    { nhan: "Đã lên đơn", xong: soDongDaLenPO === tongSoDong },
    { nhan: "Đang giao", xong: soDongDaNhanDu > 0 },
    { nhan: "Nhận đủ", xong: xong },
  ];

  const phanTram = tongSoDong > 0 ? (soDongDaNhanDu / tongSoDong) * 100 : 0;
  const tongMau = xong ? "bg-success" : quaHan ? "bg-danger" : conLai <= 3 ? "bg-warning" : "bg-primary";
  const chuHan = xong
    ? "Đã nhận đủ"
    : quaHan
      ? `Quá hạn ${Math.abs(conLai)} ngày`
      : `Còn ${conLai} ngày`;
  const lopChuHan = xong
    ? "text-success-soft"
    : quaHan
      ? "text-danger-soft"
      : conLai <= 3
        ? "text-warning-soft"
        : "text-primary";

  return (
    <div className="flex flex-col gap-4">
      {/* Dải mốc */}
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
        {moc.map((m, i) => (
          <li key={m.nhan} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                m.xong
                  ? "border-transparent bg-success text-white"
                  : "border-border bg-muted text-text-desc",
              )}
              aria-hidden
            >
              {m.xong ? <Check className="size-3" /> : i + 1}
            </span>
            <span className={cn("text-xs font-medium", m.xong ? "text-text-primary" : "text-text-desc")}>
              {m.nhan}
            </span>
            {i < moc.length - 1 && <span className="h-px w-4 bg-divider md:w-8" aria-hidden />}
          </li>
        ))}
      </ol>

      {/* Thanh tiến độ theo số mặt hàng */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-text-desc">
            Duyệt {new Date(ngayDuyet).toLocaleDateString("vi-VN")}
          </span>
          <span className={cn("font-semibold", lopChuHan)}>{chuHan}</span>
          <span className="text-text-desc">
            Cần hàng {new Date(ngayCanHang).toLocaleDateString("vi-VN")}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full transition-all", tongMau)} style={{ width: `${phanTram}%` }} />
        </div>
        <p className="text-right text-xs font-semibold text-text-secondary">
          {soDongDaNhanDu}/{tongSoDong} mặt hàng đã nhận đủ
        </p>
      </div>
    </div>
  );
}
