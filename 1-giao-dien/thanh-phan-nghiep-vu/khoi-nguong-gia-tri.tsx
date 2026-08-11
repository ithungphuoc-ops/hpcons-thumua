"use client";

import { AlertTriangle, Info, ShieldCheck } from "lucide-react";
import {
  NHAN_CAP_DUYET,
  soatNguongBaoGia,
  soNhaCungCapDaBao,
} from "@/2-quy-trinh/nguong-gia-tri";
import type { BaoGia } from "@/3-du-lieu/kieu-du-lieu";
import { formatCurrencyVnd } from "@/6-tien-ich/dinh-dang";

/**
 * NGƯỠNG GIÁ TRỊ ĐƠN HÀNG — nhắc đúng lúc người dùng sắp trình / sắp duyệt báo giá.
 *
 * 🔴 Luật nằm ở `2-quy-trinh/nguong-gia-tri.ts`, KHÔNG tính lại trong này. Ba ngưỡng
 * 5 / 10 / 20 triệu là quy trình thật của công ty (bảng Base "TM-QT Mua hàng"), Ban lãnh
 * đạo cung cấp ảnh 11/08/2026.
 *
 * 🔴 CỐ Ý CHỈ NHẮC, KHÔNG CHẶN. Quy trình cho phép 01 báo giá trong vài trường hợp mà app
 * KHÔNG nhìn thấy được (nhà cung cấp có trong danh mục hàng năm, Ban Giám đốc chỉ định,
 * trưởng phòng đề nghị chỉ định). Chặn cứng theo một luật mình không đủ dữ liệu để xét thì
 * người dùng sẽ nhập báo giá ma cho đủ số — hỏng dữ liệu còn tệ hơn thiếu kiểm.
 */
export function KhoiNguongGiaTri({ baoGia }: { baoGia: BaoGia }) {
  const soat = soatNguongBaoGia(baoGia);
  const soNCC = soNhaCungCapDaBao(baoGia);

  // Chưa có giá của ai thì chưa xét được ngưỡng — hiện khối rỗng chỉ làm rối.
  if (soNCC === 0) return null;

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-(--hp-md-card-pad)">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
          <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
          Soát theo ngưỡng giá trị của quy trình
        </h3>
        <span className="text-xs text-text-desc">
          Giá trị xét ngưỡng:{" "}
          <strong className="text-text-primary">{formatCurrencyVnd(soat.giaTri)}</strong> — lấy
          phương án <strong>đắt nhất</strong> trong {soNCC} nhà cung cấp đã báo
        </span>
      </div>

      <p className="flex items-start gap-1.5 text-sm text-text-secondary">
        <Info className="mt-0.5 size-4 shrink-0 text-text-desc" aria-hidden />
        <span>
          Cấp xét duyệt theo quy trình: <strong>{NHAN_CAP_DUYET[soat.capDuyet]}</strong>
        </span>
      </p>

      {soat.batBuoc.map((x, i) => (
        <p
          key={i}
          className="flex items-start gap-2 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-sm text-text-secondary"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-soft" aria-hidden />
          <span>{x}</span>
        </p>
      ))}

      {soat.nhacNgoaiApp.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-divider pt-2">
          <span className="text-xs font-semibold tracking-wide text-text-desc uppercase">
            Việc phải làm ngoài app
          </span>
          <ul className="ml-5 list-disc space-y-1 text-sm text-text-secondary">
            {soat.nhacNgoaiApp.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
