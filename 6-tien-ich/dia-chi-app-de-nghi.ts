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
 * ★★ ĐƯỜNG DẪN MỞ ĐÚNG MỘT HỒ SƠ BÊN APP REQUEST.
 *
 * 🔴 KHUÔN ĐỊA CHỈ NÀY DO BAN LÃNH ĐẠO CUNG CẤP NGÀY 13/09/2026, chép từ thanh địa chỉ khi mở
 * hồ sơ thật:
 *     https://request.hpcore.vn/request/list?scope=all&id=fSH4lYLX63FaV4B1pcY1
 *
 * 🔴 THAM SỐ LÀ ID KỸ THUẬT, KHÔNG PHẢI MÃ 6 SỐ. Đã đo thật cùng ngày: thử cả ba cách
 * `?code=000000058`, `?id=000000058`, `?q=000000058` đều KHÔNG mở đúng hồ sơ. Nên tuyệt đối
 * đừng "tiện tay" truyền `maDeXuatAppRequest` vào đây — ra một địa chỉ mở được nhưng SAI hồ sơ,
 * loại lỗi không ai phát hiện cho tới lúc đối chiếu chứng từ.
 *
 * @param idHoSo `idHoSoAppRequest` của đề nghị. Rỗng/thiếu thì trả `null` — CHỖ GỌI PHẢI xử lý
 *   `null` bằng cách không vẽ liên kết, chứ đừng ghép chuỗi bừa. Hồ sơ lập tay trong app và hồ
 *   sơ về trước 13/09/2026 đều không có id này.
 */
export function duongDanHoSoAppRequest(idHoSo: string | undefined): string | null {
  const id = (idHoSo ?? "").trim();
  if (id === "") return null;
  return `${DIA_CHI_APP_DE_NGHI}/list?scope=all&id=${encodeURIComponent(id)}`;
}
