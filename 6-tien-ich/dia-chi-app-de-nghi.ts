// ============================================================
// ĐỊA CHỈ APP ĐỀ NGHỊ (App Request) — MỘT CHỖ DUY NHẤT
//
// 🔴 VÌ SAO TÁCH RA THÀNH TỆP RIÊNG (13/09/2026): trước đó địa chỉ này là một hằng số cục bộ
// nằm trong `1-giao-dien/trang/viec-cua-toi.tsx`. Nay có chỗ THỨ HAI cần dùng (ô "Đường dẫn đề
// nghị" ở trang chi tiết đề nghị), mà chép thêm một bản là hai chỗ cùng giữ một địa chỉ — đổi
// một chỗ quên chỗ kia thì một nửa app dẫn tới địa chỉ chết, và không có gì báo.
//
// 📌 Đặt ở `6-tien-ich/` theo đúng quy tắc 3.4b: đây là hàm dùng chung nhỏ, KHÔNG dính nghiệp
// vụ — nó không biết gì về đề nghị, báo giá hay đơn hàng, chỉ ghép chuỗi địa chỉ.
// ============================================================

/**
 * ★ ĐỊA CHỈ GỐC CỦA APP ĐỀ NGHỊ — nơi duy nhất lập phiếu đề nghị mua hàng (23/08/2026).
 *
 * 📌 Đổi được bằng biến môi trường `NEXT_PUBLIC_APP_DE_NGHI_URL`, cùng nếp với
 * `NEXT_PUBLIC_APP_TONG_URL` ở thanh bên. Mặc định là địa chỉ Ban lãnh đạo cho, để thiếu biến
 * cũng không ra một cái nút bấm chẳng đi đâu.
 *
 * ⚠️ Biến này CHƯA được khai trên Vercel (CLAUDE.md §6.6: mã nguồn đọc 14 biến, Vercel chỉ khai
 * 12 — thiếu `QLKCTR_PHIEU_NHAN_API_KEY` và `NEXT_PUBLIC_APP_DE_NGHI_URL`). Nên trên bản thật
 * app đang chạy bằng GIÁ TRỊ MẶC ĐỊNH dưới đây. Đổi địa chỉ App Request mà quên khai biến trên
 * Vercel thì phải sửa đúng dòng này.
 */
export const DIA_CHI_APP_DE_NGHI =
  process.env.NEXT_PUBLIC_APP_DE_NGHI_URL ?? "https://request.hpcore.vn/request";

/**
 * ★★ ĐƯỜNG DẪN MỞ ĐÚNG MỘT PHIẾU BÊN APP REQUEST THEO MÃ ĐỀ XUẤT — Sếp chốt 02/10/2026:
 * `request.hpcore.vn/request/000000162`. Trang `/request/<mã số>` của App Request có từ cùng ngày;
 * trước đó chỉ mở được bằng id kỹ thuật (`list?scope=all&id=…`), ghép mã vào `?id=` là SAI hồ sơ.
 * Đo kho App Request 02/10/2026: không mã nào trùng, không nhóm nào bật bộ đếm riêng.
 *
 * Mã thiếu / không phải chữ số → `null`: chỗ gọi không vẽ liên kết, đừng ghép chuỗi bừa.
 */
export function duongDanPhieuAppRequest(maDeXuat: string | undefined): string | null {
  const ma = (maDeXuat ?? "").trim();
  if (!/^\d+$/.test(ma)) return null;
  return `${DIA_CHI_APP_DE_NGHI}/${ma}`;
}

/** Chữ hiện trên nút = chính địa chỉ, bỏ `https://` — đọc là biết bấm vào đi tới đâu. */
export function chuDuongDanPhieuAppRequest(url: string): string {
  return url.replace(/^https?:\/\//, "");
}
