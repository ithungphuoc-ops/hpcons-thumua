/**
 * MÀN BÁO LỖI CỦA CÁC TRANG IN.
 *
 * 🔴 KHÔNG dùng `EmptyState` của app: trang in nền trắng cố định, không theo Dark Mode và
 * không theo tùy chọn màu cá nhân (quy ước phiên 04). Vì vậy màu ở đây viết cứng, đúng như
 * `to-don-mua-hang-a4.tsx` và `print-toolbar.tsx`.
 *
 * 📌 Tách ra thành file dùng chung ngày 18/08/2026, khi trang in bản mẫu chưa lưu
 * (`/in/don-hang-mau`) ra đời và cần đúng màn báo lỗi này. Trước đó nó nằm riêng trong
 * `trang/don-hang-in.tsx`; để nguyên là chép tay bản thứ hai.
 */
export function ThongBaoTrangIn({ tieuDe, moTa }: { tieuDe: string; moTa: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-8">
      <div className="max-w-md text-center">
        <p className="text-lg font-semibold text-[#101828]">{tieuDe}</p>
        <p className="mt-2 text-sm text-[#475467]">{moTa}</p>
      </div>
    </div>
  );
}
