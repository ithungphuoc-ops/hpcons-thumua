// ============================================================
// ★★ NHÁNH HỒ SƠ PHÒNG BAN — Sếp 14/09/2026
//
// Nguyên văn chỉ đạo: *"Các đề xuất từ phòng ban thì sẽ đi nhánh riêng, không cần lấy dữ liệu
// từ app kho công trình mà nhân viên mua hàng sẽ là người bấm hoàn thành và đính kèm phiếu
// giao hàng."*
//
// 🔴 VÌ SAO PHẢI CÓ NHÁNH RIÊNG — ĐO ĐƯỢC 15/09/2026, KHÔNG PHẢI SUY ĐOÁN:
// Hồ sơ phòng ban hiện đi CHUNG một đường với hồ sơ công trình, mà đường đó **bắt buộc** đi qua
// phiếu nhận hàng do app QLK CTR (kho công trình) gửi sang:
//   · `giai-doan-mua-hang.ts` — sang bước ⑦ đòi `khoiLuongConLai <= 0`, tức phải có phiếu nhận
//   · `chung-tu-cuoi-quy-trinh.ts` — `vuongMacHoanThanhQuyTrinh` đòi mọi mặt hàng nhận đủ
//   · và từ 30/08/2026 app **đã bỏ hẳn** đường ghi phiếu nhận thủ công (phiên tích hợp đóng,
//     về repo gốc ở commit `1e8a628`) — nguồn phiếu duy nhất còn lại là cửa API của QLK CTR.
// ⇒ Hồ sơ phòng ban KHÔNG có kho công trình nào gửi phiếu sang, nên `khoiLuongConLai` không bao
//   giờ về 0, thẻ **kẹt vĩnh viễn ở bước ⑥**, không ai bấm hoàn thành được.
//
// 🔴 ĐẶT RIÊNG MỘT TỆP, KHÔNG NHÉT VÀO `tinh-toan.ts`: đây là mắt nối dùng chung cho cả tầng
// luật, tầng ghi và tầng phân quyền. Để một chỗ duy nhất thì sau này muốn đổi cách nhận diện
// (ví dụ App Request bổ sung trường `loaiHoSo` thật) chỉ phải sửa đúng một hàm.
// ============================================================

import type { LoaiHoSoDeNghi } from "@/3-du-lieu/kieu-du-lieu";

/**
 * Hồ sơ này là của PHÒNG BAN (không gắn công trình) hay không.
 *
 * ════════════════════════════════════════════════════════════════════════════════════
 * ★★ HAI TẦNG — thêm 15/09/2026 (chiều), Sếp duyệt. Đọc kỹ thứ tự, đừng đảo:
 *
 *   ① `loaiHoSo` CÓ GIÁ TRỊ → **TIN NÓ, HẾT**. Đây là ô "Lựa chọn đề nghị" trên biểu mẫu App
 *      Request, do chính người đề nghị khai — nguồn chính thức, thắng mọi phép suy đoán. Đã đo
 *      trên kho `hpcons-request` (collection `requests`, 60 phiếu): **32 "Đề nghị công trình" ·
 *      7 "Đề nghị phòng ban"**. Cửa tiếp nhận chuẩn hoá giá trị này bằng `chuanHoaLoaiHoSo`
 *      (`2-quy-trinh/tich-hop-app-request.ts`) rồi mới lưu.
 *
 *   ② `loaiHoSo` TRỐNG → rơi về phép suy cũ: **`maHopDongCDT` rỗng**.
 *
 * 🔴 VÌ SAO BẮT BUỘC PHẢI CÒN TẦNG ②, ĐỪNG BAO GIỜ BỎ: **hồ sơ cũ KHÔNG BAO GIỜ có `loaiHoSo`**.
 * App chỉ bắt đầu lưu trường đó từ 15/09/2026, và chỉ lưu được khi App Request đã cập nhật phần
 * gửi sang (tính tới hôm nay họ CHƯA gửi). Mọi đề nghị đang nằm trên kho chung, cộng mọi đề nghị
 * lập tay trong app, đều trống trường này. Bỏ tầng ② là 3 hồ sơ phòng ban thật (`000000089`,
 * `000000090`, `000000091`) lập tức kẹt lại ở bước ⑥ đúng như sự cố đang chữa.
 *
 * ⚠️ TRỐNG = CHƯA BIẾT, KHÔNG PHẢI "công trình". Đó là lý do tầng ② vẫn phải suy, chứ không
 * `return false` cho xong.
 * ════════════════════════════════════════════════════════════════════════════════════
 *
 * 🔴🔴 TẦNG ② NHẬN DIỆN BẰNG `maHopDongCDT` RỖNG — **ĐÃ SỬA 15/09/2026 SAU KHI ĐO DỮ LIỆU THẬT**.
 *
 * ⚠️ BẢN ĐẦU DÙNG `tenCongTrinh` RỖNG VÀ NÓ SAI HOÀN TOÀN. Sếp báo *"a thấy nhánh phòng ban chưa
 * chạy"*; đo trên kho đang chạy (`hpcons-portal`, 16 đề nghị) thì hàm này nhận ra **0/16** hồ sơ
 * là phòng ban. Nguyên nhân: **App Request nhét TIÊU ĐỀ ĐỀ NGHỊ vào ô tên công trình** khi hồ sơ
 * không có công trình. Ví dụ đo được:
 *   · `000000089` (Phòng Pháp Lý) → `tenCongTrinh = "Đề nghị 2. Phòng Pháp lý (HP Cons)"`
 *   · `000000091` (Phòng Kỹ thuật) → `tenCongTrinh = "Phòng Kỹ thuật Thi công (HP Cons)"`
 * Nên `tenCongTrinh` **không bao giờ rỗng**, và nhánh phòng ban không bao giờ bật.
 *
 * ✅ `maHopDongCDT` mới là trường phân biệt được, đo ra **3/16** — đúng ba hồ sơ phòng ban thật
 * (`000000089`, `000000090`, `000000091`), khớp với điều Sếp chỉ ra. Hợp lý về nghiệp vụ: chỉ hồ
 * sơ gắn công trình mới có hợp đồng chủ đầu tư; đề nghị nội bộ của phòng ban thì không có.
 *
 * 🔴 ĐỪNG QUAY LẠI DÙNG `tenCongTrinh`. Nó đang chứa rác do App Request gửi sang — lỗi ở phía họ
 * (đã ghi trong SESSION-LOG: *"`tenCongTrinh` của đề nghị đang chứa mã hợp đồng"*), và nay đo
 * được là còn tệ hơn: chứa cả tiêu đề đề nghị. Sửa chỗ đó thuộc vùng cấm §6.6.
 *
 * 🔴 CŨNG ĐỪNG DÙNG `maDuAn` BẮT ĐẦU "PB-": đo ra **0/16**. Chú thích ở `tich-hop-app-request.ts`
 * nói `xacDinhMaDuAnTamThoi` sinh tiền tố đó, nhưng dữ liệu thật cho thấy `maDuAn` đang mang
 * nguyên tiêu đề đề nghị. Bám vào định dạng chuỗi của đội khác là tự buộc mình vào thứ họ đổi
 * lúc nào cũng được.
 *
 * ⚠️ HỒ SƠ LẬP TAY TRONG APP mà không khai hợp đồng chủ đầu tư cũng lọt vào đây. Chấp nhận có
 * chủ ý: xét nghiệp vụ thì hồ sơ không gắn công trình **đúng là** không có kho công trình để
 * nhận hàng — cùng hoàn cảnh thì cùng đường đi.
 */
export function laHoSoPhongBan(
  /* 📌 CHỮ KÝ GIỮ NGUYÊN HÌNH DẠNG CŨ, chỉ THÊM một trường tuỳ chọn — hơn 10 chỗ đang gọi hàm
     này (`quyen-theo-ho-so.ts`, `kho-du-lieu.tsx`, `giai-doan-mua-hang.ts`,
     `chung-tu-cuoi-quy-trinh.ts`, `gui-po-qlk-ctr.ts`, `de-nghi-chi-tiet.tsx`…) và không chỗ nào
     phải sửa. Nhận `null` bên cạnh `undefined` cho hợp dữ liệu đọc từ Firestore. */
  deNghi: { maHopDongCDT?: string | null; loaiHoSo?: LoaiHoSoDeNghi | null } | null | undefined,
): boolean {
  if (!deNghi) return false;

  /* ① NGUỒN CHÍNH THỨC — người đề nghị tự khai trên App Request. Tin tuyệt đối, kể cả khi mâu
     thuẫn với `maHopDongCDT`: hồ sơ phòng ban vẫn có thể được gắn một mã hợp đồng nào đó, và hồ
     sơ công trình vẫn có thể chưa kịp điền hợp đồng. Người khai biết rõ hơn phép suy. */
  if (deNghi.loaiHoSo === "phong_ban") return true;
  if (deNghi.loaiHoSo === "cong_trinh") return false;

  /* ② DỰ PHÒNG cho hồ sơ KHÔNG có trường trên — xem khối chú thích phía trên để biết vì sao tầng
     này không được phép bỏ. */
  return !(deNghi.maHopDongCDT ?? "").trim();
}

/**
 * Câu giải thích DÙNG CHUNG khi app nới một điều kiện cho hồ sơ phòng ban.
 *
 * 🔴 BẮT BUỘC NÓI RA, KHÔNG ĐƯỢC NỚI IM LẶNG. Người dùng thấy hồ sơ phòng ban làm được việc mà
 * hồ sơ công trình không làm được sẽ tưởng app lỗi hoặc tưởng luật đã đổi cho tất cả — rồi đi
 * đòi làm y vậy trên hồ sơ công trình. Nói rõ ngay tại chỗ là cách rẻ nhất chặn hiểu nhầm đó.
 */
export const LY_DO_NHANH_PHONG_BAN =
  "Hồ sơ của phòng ban (không gắn công trình) nên không có kho công trình xác nhận nhận hàng — " +
  "nhân viên mua hàng tự ghi nhận và đính kèm phiếu giao hàng.";
