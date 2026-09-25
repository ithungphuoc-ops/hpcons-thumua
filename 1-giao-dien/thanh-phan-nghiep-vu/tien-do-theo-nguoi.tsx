"use client";

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
// ============================================================

/** Số bước thật để vẽ thanh — bỏ `that_bai` vì nó không nằm trên đường đi bình thường. */
const SO_BUOC = GIAI_DOAN_MUA_HANG.filter((g) => g.ma !== "that_bai").length;

export default function TienDoTheoNguoi({ tienDo }: { tienDo: TienDoPhieu }) {
  if (!nenHienTienDoTheoNguoi(tienDo)) return null;

  const uidCham = aiChamNhat(tienDo);

  return (
    <section
      className="mb-4 rounded-lg border"
      style={{ borderColor: "var(--hp-border)", backgroundColor: "var(--hp-surface)" }}
      aria-label="Tiến độ theo từng người phụ trách"
    >
      <header
        className="flex flex-wrap items-baseline gap-2 border-b px-4 py-2.5"
        style={{ borderColor: "var(--hp-border)", backgroundColor: "var(--hp-neutral-soft)" }}
      >
        <h3 className="text-[13.5px] font-semibold">Tiến độ theo người</h3>
        <span className="text-[12px]" style={{ color: "var(--hp-text-desc)" }}>
          {tienDo.nguoi.length} người phụ trách
          {tienDo.soDongChuaGiao > 0 && ` · còn ${tienDo.soDongChuaGiao} dòng chưa giao`}
        </span>
      </header>

      <div className="flex flex-col gap-3 px-4 py-3">
        {tienDo.nguoi.map((n) => {
          const laCham = n.uid === uidCham;
          const xong = daXongPhanMinh(n.giaiDoan);
          const viTri = viTriBuoc(n.giaiDoan);

          return (
            <div key={n.uid} className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-semibold">{n.ten}</span>
                  {laCham && (
                    <span
                      className="rounded-full border px-2 py-px text-[11px] font-semibold"
                      style={{
                        color: "#B26A00",
                        backgroundColor: "var(--hp-warning-bg)",
                        borderColor: "color-mix(in srgb, var(--hp-warning) 35%, transparent)",
                      }}
                    >
                      chậm nhất
                    </span>
                  )}
                  {xong && (
                    <span
                      className="rounded-full border px-2 py-px text-[11px] font-semibold"
                      style={{
                        color: "var(--hp-success)",
                        backgroundColor: "var(--hp-success-bg)",
                        borderColor: "color-mix(in srgb, var(--hp-success) 35%, transparent)",
                      }}
                    >
                      đã xong phần mình
                    </span>
                  )}
                  <span className="text-[11.5px]" style={{ color: "var(--hp-text-desc)" }}>
                    {n.sttDong.length} dòng
                  </span>
                </span>
                <span className="text-[12.5px] font-medium" style={{ color: "var(--hp-text-desc)" }}>
                  {NHAN_GIAI_DOAN[n.giaiDoan]?.nhan ?? n.giaiDoan}
                </span>
              </div>
              <ThanhNho den={viTri} mo={laCham} />
            </div>
          );
        })}

        {tienDo.soDongChuaGiao > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="flex items-center gap-2">
                <span
                  className="rounded-full border border-dashed px-2 py-px text-[12px]"
                  style={{ color: "var(--hp-text-desc)", borderColor: "var(--hp-border)" }}
                >
                  chưa giao cho ai
                </span>
                <span className="text-[11.5px]" style={{ color: "var(--hp-text-desc)" }}>
                  {tienDo.soDongChuaGiao} dòng
                </span>
              </span>
              <span className="text-[12.5px]" style={{ color: "var(--hp-text-desc)" }}>
                chờ phân bổ
              </span>
            </div>
            <ThanhNho den={-1} />
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Thanh tiến độ nhỏ.
 *
 * ⚠️ KHÔNG dùng màu riêng cho từng người — bảng màu của app chỉ có một màu nhấn, bịa thêm bốn
 * màu để phân biệt người là phá bộ màu chung (chỉ đạo đồng bộ giao diện 17/08/2026). Ai là ai
 * đã có tên ghi ngay bên trên; thanh chỉ cần nói *đi được bao xa*.
 */
function ThanhNho({ den, mo = false }: { den: number; mo?: boolean }) {
  return (
    <div className="flex gap-[3px]" aria-hidden="true">
      {Array.from({ length: SO_BUOC }, (_, i) => (
        <span
          key={i}
          className="h-[6px] flex-1 rounded-full"
          style={{
            backgroundColor: i <= den ? "var(--hp-primary)" : "var(--hp-border)",
            opacity: i <= den && mo ? 0.5 : 1,
          }}
        />
      ))}
    </div>
  );
}
