"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { GIAI_DOAN_MUA_HANG, type GiaiDoanMuaHang } from "@/2-quy-trinh/giai-doan-mua-hang";
import { HUONG_DAN_GIAI_DOAN } from "@/2-quy-trinh/huong-dan-giai-doan";
import {
  HopHuongDanGiaiDoan,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-huong-dan-giai-doan";

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

  /**
   * Bước đang mở hướng dẫn. Bấm vào Ô BƯỚC NÀO là đọc hướng dẫn bước đó — kể cả bước đã qua
   * và bước chưa tới, vì người dùng hay cần xem trước "bước sau sẽ phải làm gì" để chuẩn bị
   * (chỉ đạo Ban lãnh đạo 11/08/2026 về nút xem hướng dẫn).
   */
  const [dangXem, setDangXem] = useState<GiaiDoanMuaHang | null>(null);

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
        {/* 🔴 DẢI BƯỚC TRẢI HẾT BỀ NGANG — Ban lãnh đạo 18/08/2026: *"cân đối kéo thêm thanh
            tiến độ này ra"* (ảnh khoanh khoảng trống bên phải dải mũi tên).

            Từ 17/08/2026 dải này nằm trong cột trái (~73% bề ngang) thay vì chiếm cả trang,
            nhưng nó chỉ rộng bằng nội dung (`min-w-max`) nên chừa một mảng trắng bên phải —
            nhìn như thanh bị cụt.

            `w-full` + `flex-1` ở từng ô: thừa chỗ thì bảy bước chia đều nhau. `min-w-max` GIỮ
            NGUYÊN vì nó là bề rộng TỐI THIỂU — màn hẹp thì chữ không bị bóp nát, khung ngoài
            cuộn ngang như cũ. Bỏ `min-w-max` là trên điện thoại các bước chồng chữ lên nhau. */}
        <ol className="flex w-full min-w-max items-stretch">
          {chuoi.map((g, i) => {
            const daQua = viTri >= 0 && i < viTri;
            const hienTai = i === viTri;
            const coHuongDan = HUONG_DAN_GIAI_DOAN[g.ma] !== undefined;
            return (
              <li
                key={g.ma}
                aria-current={hienTai ? "step" : undefined}
                title={coHuongDan ? `${g.moTa} — bấm để xem hướng dẫn` : g.moTa}
                className={[
                  // `flex-1` để bảy bước chia đều phần dư — xem chú thích ở thẻ <ol>.
                  "relative flex min-h-11 flex-1 items-center justify-center gap-2 py-2 pr-5 pl-6 text-xs font-medium",
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

                {/* Vùng bấm phủ kín ô bước. Đặt lớp phủ thay vì bọc nội dung trong <button>
                    vì hình mũi tên (`clip-path`) và phần lõm cạnh trái (`-ml-3.5`) nằm trên
                    chính thẻ <li> — bọc lại là vỡ dải mũi tên. Clip-path cắt luôn cả vùng
                    bấm nên không có chỗ bấm nào thò ra ngoài hình. */}
                {coHuongDan && (
                  <button
                    type="button"
                    onClick={() => setDangXem(g.ma)}
                    aria-label={`Xem hướng dẫn bước ${g.nhan}`}
                    className="absolute inset-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset focus-visible:outline-none"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {viTri >= 0 ? (
          <p className="text-xs text-text-desc">
            Bước <strong className="text-text-primary">{viTri + 1}</strong> trên {chuoi.length} ·{" "}
            {chuoi[viTri].moTa}
          </p>
        ) : (
          <span />
        )}
        {/* 📌 ĐÃ BỎ nút chữ "Hướng dẫn bước này" (Ban lãnh đạo 16/08/2026: *"bỏ các mục này"*).
            🔴 Hướng dẫn KHÔNG mồ côi: bấm thẳng vào ô bước trên dải mũi tên vẫn mở hộp hướng
            dẫn, và bảng quy trình có nút ⓘ ở đầu mỗi cột. */}
      </div>

      {/* Hộp hướng dẫn của ô bước vừa bấm (khác với nút chữ — nút đó tự quản hộp của nó). */}
      {dangXem && (
        <HopHuongDanGiaiDoan
          giaiDoan={dangXem}
          mo={dangXem !== null}
          onDong={() => setDangXem(null)}
        />
      )}
    </div>
  );
}
