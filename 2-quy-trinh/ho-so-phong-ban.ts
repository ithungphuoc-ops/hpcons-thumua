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

/**
 * Hồ sơ này là của PHÒNG BAN (không gắn công trình) hay không.
 *
 * 🔴 NHẬN DIỆN BẰNG `tenCongTrinh` RỖNG, KHÔNG BẰNG `maDuAn` BẮT ĐẦU "PB-".
 *
 * Cả hai đều do cùng một chỗ sinh ra (`tich-hop-app-request.ts` → `xacDinhMaDuAnTamThoi`: không
 * có `congTrinhChuoi` thì `maDuAn = "PB-<mã phòng ban>"` và `tenCongTrinh = ""`), nhưng:
 *   · `tenCongTrinh` là trường **nghiệp vụ**, mọi hồ sơ đều có, và app đang dùng chính nó để ẩn
 *     nhãn công trình trên giao diện — tức đã là dấu hiệu "có/không công trình" trên thực tế.
 *   · `maDuAn` là mã **tạm thời** do bên tích hợp đặt, nằm trong vùng cấm sửa (CLAUDE.md §6.6).
 *     Bám vào định dạng chuỗi của người khác là tự buộc mình vào thứ họ có quyền đổi bất cứ lúc
 *     nào mà không phải báo ai.
 *
 * ⚠️ HỒ SƠ LẬP TAY TRONG APP (không qua App Request) mà để trống tên công trình cũng lọt vào
 * đây. Chấp nhận có chủ ý: xét về nghiệp vụ thì một hồ sơ không gắn công trình nào **đúng là**
 * không có kho công trình để nhận hàng — cùng một hoàn cảnh, nên cùng một đường đi.
 */
export function laHoSoPhongBan(
  deNghi: { tenCongTrinh?: string | null } | null | undefined,
): boolean {
  if (!deNghi) return false;
  return !(deNghi.tenCongTrinh ?? "").trim();
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
