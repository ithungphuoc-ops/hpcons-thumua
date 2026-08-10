"use client";

import { Check } from "lucide-react";
import { GIAI_DOAN_MUA_HANG, type GiaiDoanMuaHang } from "@/2-quy-trinh/giai-doan-mua-hang";

/**
 * THANH TIẾN TRÌNH CÁC GIAI ĐOẠN — dải mũi tên nối tiếp nhau.
 *
 * Bám theo cách bảng "TM-QT Mua hàng" trên Base.vn đang hiển thị (Ban lãnh đạo cung
 * cấp ảnh 10/08/2026): nhìn một cái là biết đề nghị đang đứng ở bước mấy trên mấy,
 * đã qua những bước nào và còn bước nào phía trước.
 *
 * 🔴 CỐ Ý BỎ CỘT "THẤT BẠI" khỏi thanh này. Thất bại là NHÁNH DỪNG, không phải một
 * bước trong chuỗi — vẽ nó nối đuôi "Hoàn thành" sẽ khiến người đọc tưởng mọi đề nghị
 * đều phải đi qua Thất bại. Đề nghị bị đóng dở thì hiện riêng một dải màu đỏ.
 *
 * ⚠️ Giai đoạn KHÔNG lưu thành trường dữ liệu — nó suy ra từ chứng từ thật
 * (`2-quy-trinh/giai-doan-mua-hang.ts`). Component này chỉ vẽ, không tự tính.
 */
export function ThanhGiaiDoan({ giaiDoan }: { giaiDoan: GiaiDoanMuaHang }) {
  const chuoi = GIAI_DOAN_MUA_HANG.filter((g) => g.ma !== "that_bai");
  const viTri = chuoi.findIndex((g) => g.ma === giaiDoan);
  const daDong = giaiDoan === "that_bai";

  if (daDong) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-danger bg-danger-bg p-(--hp-md-row-pad)">
        <span className="text-sm font-semibold text-danger-soft">Đề nghị đã đóng dở</span>
        <span className="text-xs text-text-secondary">— không mua tiếp</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Cuộn ngang khi màn hẹp — 7 bước không nhét vừa điện thoại.
          `min-w-0` ở ngoài để khung cuộn không đẩy giãn cả trang. */}
      <div className="min-w-0 overflow-x-auto">
        <ol className="flex min-w-max items-stretch">
          {chuoi.map((g, i) => {
            const daQua = viTri >= 0 && i < viTri;
            const hienTai = i === viTri;
            return (
              <li
                key={g.ma}
                aria-current={hienTai ? "step" : undefined}
                title={g.moTa}
                className={[
                  "relative flex min-h-11 items-center gap-2 py-2 pr-5 pl-6 text-xs font-medium",
                  // Mũi tên: cắt vát cạnh phải, cạnh trái lõm vào cho khớp ô trước.
                  "[clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%,14px_50%)]",
                  i === 0 ? "[clip-path:polygon(0_0,calc(100%-14px)_0,100%_50%,calc(100%-14px)_100%,0_100%)]" : "-ml-3.5",
                  hienTai
                    ? "bg-primary text-white"
                    : daQua
                      ? "bg-success/85 text-white"
                      : "bg-muted text-text-desc",
                ].join(" ")}
              >
                {/* Bước đã qua hiện dấu tick, bước hiện tại hiện số thứ tự —
                    phân biệt bằng cả ký hiệu lẫn màu, không chỉ dựa vào màu (V1.1). */}
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {daQua ? (
                    <Check className="size-3.5" aria-hidden />
                  ) : (
                    <span className="text-[11px] font-bold">{i + 1}</span>
                  )}
                </span>
                <span className="whitespace-nowrap">{g.nhan}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {viTri >= 0 && (
        <p className="text-xs text-text-desc">
          Bước <strong className="text-text-primary">{viTri + 1}</strong> trên {chuoi.length} ·{" "}
          {chuoi[viTri].moTa}
        </p>
      )}
    </div>
  );
}
