"use client";

import { useState } from "react";
import { ChevronRight, Users } from "lucide-react";
import { NHAN_GIAI_DOAN, GIAI_DOAN_MUA_HANG } from "@/2-quy-trinh/giai-doan-mua-hang";
import {
  aiChamNhat,
  daXongPhanMinh,
  nenHienTienDoTheoNguoi,
  viTriBuoc,
  type TienDoPhieu,
} from "@/2-quy-trinh/tien-do-theo-nguoi";

// ============================================================
// TIẾN ĐỘ THEO TỪNG NGƯỜI — Sếp chốt 25/09/2026
//
// 🔴 VẤN ĐỀ NÓ GIẢI: một phiếu chia cho nhiều người nhưng app chỉ có MỘT thanh bước, và thanh
// đó luôn chạy theo người nhanh nhất. Trưởng bộ phận nhìn thấy phiếu ở bước ⑤ trong khi một
// nửa phiếu còn ở bước ② — không có cách nào biết ai đang chậm.
//
// 📌 CHỈ THÊM PHẦN NHÌN. Không đổi cách app tính bước, không đụng dữ liệu, không đổi quyền.
// Sai ở đây thì cùng lắm hiện sai một dòng thông tin.
//
// ⚠️ ẨN VỚI NHÂN VIÊN. Họ chỉ thấy dòng của mình nên khối này với họ là một bảng nói về người
// khác — vừa vô nghĩa vừa tạo cảm giác bị đem ra so sánh. Nơi gọi khoá bằng `quyen.xemMoiHoSo`.
//
// ★ (26/09/2026) Sếp: *"Thu gọn mục này lại, và đổi màu header"*.
//   · GẬP SẴN — thanh tiêu đề vẫn nói đủ tóm tắt (số người, ai chậm nhất, còn mấy dòng chưa giao),
//     bấm mới mở chi tiết từng người.
//   · Header đổi từ nền xám đậm (`--hp-neutral-soft`, chữ tóm tắt gần như không đọc được) sang nền
//     xanh nhạt `bg-primary-bg` — cùng kiểu khối "Đã tách thành … đề xuất con" ngay dưới.
//   · Bỏ hết `style={{…}}` và mã màu cứng (#B26A00), chữ tối thiểu 12px (Design System V1.1).
// ============================================================

/** Số bước thật để vẽ thanh — bỏ `that_bai` vì nó không nằm trên đường đi bình thường. */
const SO_BUOC = GIAI_DOAN_MUA_HANG.filter((g) => g.ma !== "that_bai").length;

export default function TienDoTheoNguoi({ tienDo }: { tienDo: TienDoPhieu }) {
  const [mo, setMo] = useState(false);
  if (!nenHienTienDoTheoNguoi(tienDo)) return null;

  const uidCham = aiChamNhat(tienDo);
  const tenCham = tienDo.nguoi.find((n) => n.uid === uidCham)?.ten;

  return (
    <section
      className="overflow-hidden rounded-lg border border-primary/30 bg-card"
      aria-label="Tiến độ theo từng người phụ trách"
    >
      <button
        type="button"
        onClick={() => setMo((v) => !v)}
        aria-expanded={mo}
        className="flex min-h-11 w-full flex-wrap items-center gap-x-2 gap-y-1 bg-primary-bg px-4 py-2 text-left text-primary transition-colors hover:bg-primary-bg/70"
      >
        <ChevronRight
          className={`size-4 shrink-0 transition-transform ${mo ? "rotate-90" : ""}`}
          aria-hidden
        />
        <Users className="size-4 shrink-0" aria-hidden />
        <span className="text-sm font-semibold">Tiến độ theo người</span>
        <span className="text-xs text-text-secondary">
          {tienDo.nguoi.length} người phụ trách
          {tienDo.soDongChuaGiao > 0 && ` · còn ${tienDo.soDongChuaGiao} dòng chưa giao`}
        </span>
        {tenCham && (
          <span className="rounded-full border border-warning/35 bg-warning-bg px-2 text-xs font-semibold text-warning-soft">
            chậm nhất: {tenCham}
          </span>
        )}
        <span className="ml-auto text-xs text-text-desc">{mo ? "Thu gọn" : "Xem chi tiết"}</span>
      </button>

      {mo && (
        <div className="flex flex-col gap-2.5 px-4 py-3">
          {tienDo.nguoi.map((n) => {
            const laCham = n.uid === uidCham;
            const xong = daXongPhanMinh(n.giaiDoan);
            const viTri = viTriBuoc(n.giaiDoan);

            return (
              <div key={n.uid} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">{n.ten}</span>
                    {laCham && (
                      <span className="rounded-full border border-warning/35 bg-warning-bg px-2 text-xs font-semibold text-warning-soft">
                        chậm nhất
                      </span>
                    )}
                    {xong && (
                      <span className="rounded-full border border-success/35 bg-success-bg px-2 text-xs font-semibold text-success-soft">
                        đã xong phần mình
                      </span>
                    )}
                    <span className="text-xs text-text-desc">{n.sttDong.length} dòng</span>
                  </span>
                  <span className="text-xs font-medium text-text-desc">
                    {NHAN_GIAI_DOAN[n.giaiDoan]?.nhan ?? n.giaiDoan}
                  </span>
                </div>
                <ThanhNho den={n.giaiDoan === "that_bai" ? -1 : viTri} mo={laCham} />
              </div>
            );
          })}

          {tienDo.soDongChuaGiao > 0 && (
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="flex items-center gap-2">
                  <span className="rounded-full border border-dashed border-border px-2 text-xs text-text-desc">
                    chưa giao cho ai
                  </span>
                  <span className="text-xs text-text-desc">{tienDo.soDongChuaGiao} dòng</span>
                </span>
                <span className="text-xs text-text-desc">chờ phân bổ</span>
              </div>
              <ThanhNho den={-1} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Thanh bước thu nhỏ — mỗi ô một bước, tô tới bước người đó đang đứng.
 * `mo` = người chậm nhất: tô nhạt hơn để mắt dừng lại ở đó.
 */
function ThanhNho({ den, mo = false }: { den: number; mo?: boolean }) {
  return (
    <div className="flex gap-[3px]" aria-hidden="true">
      {Array.from({ length: SO_BUOC }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i <= den ? (mo ? "bg-primary/50" : "bg-primary") : "bg-divider"
          }`}
        />
      ))}
    </div>
  );
}
