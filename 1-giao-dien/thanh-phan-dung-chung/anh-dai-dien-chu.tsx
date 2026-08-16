/**
 * ẢNH ĐẠI DIỆN BẰNG CHỮ TẮT — dùng cho dòng bình luận, danh sách người, menu tài khoản.
 *
 * 🔴 LẤY HAI TỪ CUỐI CỦA TÊN, không lấy chữ cái đầu. Tên Việt Nam phần lớn bắt đầu bằng
 * "Nguyễn", "Trần", "Lê" — lấy chữ đầu thì nửa phòng cùng một chữ N, avatar mất tác dụng phân
 * biệt. "Nguyễn Lâm Đỗ Quyên" → `ĐQ`, "Trần Thị B" → `TB`.
 *
 * ⚠️ Màu nền chọn trong BỐN token có sẵn của Design System, không sinh mã màu mới (V1.1 cấm
 * hardcode màu). Bỏ `danger-bg` ra ngoài: nền đỏ ở avatar dễ bị đọc thành cảnh báo.
 */

const NEN = [
  { o: "bg-primary-bg", chu: "text-primary" },
  { o: "bg-success-bg", chu: "text-success-soft" },
  { o: "bg-warning-bg", chu: "text-warning-soft" },
  { o: "bg-muted", chu: "text-text-secondary" },
] as const;

/** Chữ tắt từ tên người. */
export function vietTatTen(ten: string): string {
  const tu = ten.trim().split(/\s+/).filter(Boolean);
  if (tu.length === 0) return "?";
  if (tu.length === 1) return tu[0].slice(0, 2).toUpperCase();
  return (tu[tu.length - 2][0] + tu[tu.length - 1][0]).toUpperCase();
}

/**
 * Chọn màu nền theo tên — cùng một người luôn ra cùng một màu.
 *
 * 📌 Hash đơn giản là đủ: mục đích chỉ để mắt phân biệt được hai người cạnh nhau, không phải
 * để bảo đảm không trùng.
 */
function chonNen(ten: string) {
  let h = 0;
  for (let i = 0; i < ten.length; i++) h = (h * 31 + ten.charCodeAt(i)) % 9973;
  return NEN[h % NEN.length];
}

export function AnhDaiDienChu({
  ten,
  co = 32,
  laToi = false,
}: {
  ten: string;
  /** 32 cho bài gốc, 24 cho bài trả lời. */
  co?: 24 | 32;
  /** Viền xanh quanh ảnh của chính người đang xem. */
  laToi?: boolean;
}) {
  const nen = chonNen(ten);
  return (
    <span
      // `aria-hidden`: tên người đã nằm ngay cạnh dưới dạng chữ, đọc lại chữ tắt là thừa.
      aria-hidden
      title={ten}
      className={`flex shrink-0 select-none items-center justify-center rounded-full font-semibold ${nen.o} ${nen.chu} ${
        co === 24 ? "size-6 text-[10px]" : "size-8 text-xs"
      } ${laToi ? "ring-1 ring-primary" : ""}`}
    >
      {vietTatTen(ten)}
    </span>
  );
}
