// ============================================================
// SINH MÃ ĐƠN ĐẶT HÀNG — `[mã dự án gốc]-PO-[STT 3 chữ số]`
//
// 🔴 BÁM THÔNG BÁO 09/2026/TB-HPCS (TGĐ ký 11/07/2026). Mã hồ sơ =
//     [Mã dự án gốc]-[Mã loại]-[STT], ví dụ `260001-HPCS-PO-001`.
//     KHÔNG tự bịa hệ mã mới, KHÔNG lấy kiểu `DMH0532-26` của MISA.
//
// ✅ `PO` LÀ MÃ LOẠI ĐÃ ĐƯỢC DUYỆT, nằm trong danh mục chính thức của Thông báo 09/2026 cùng
//    với HDXD · HDTK · HDMH · HDTC · BBNT · BG · HSTK · TT · PL · QD · CV · TB. Ba mã ĐANG
//    CHỜ duyệt là `PR` · `DO` · `GRN` (quy tắc E-6), KHÔNG phải `PO` — đừng chép nhầm sang
//    đây, vì một dòng ghi sai tình trạng phê duyệt sẽ khiến người sau đi xin lại một thứ đã
//    có, hoặc coi mã đơn hàng là tạm bợ mà đổi đi.
//
// 📌 Chuỗi `PO` vẫn để ở HẰNG SỐ `MA_LOAI_DON_HANG` dưới đây — một chỗ duy nhất, đổi được
//    bằng một dòng nếu Thông báo có bản sửa. (Mã đề nghị `PR` thì hiện còn viết thẳng trong
//    `dat-ten-de-nghi.ts`, chưa tách hằng số — chỗ đó mới là chỗ đang chờ duyệt.)
//
// 🔴 VÌ SAO TÁCH THÀNH HÀM THUẦN NGÀY 18/08/2026: mã đơn trước nay sinh THẲNG trong
//    `3-du-lieu/kho-du-lieu.tsx` → `themDonHang` bằng công thức **đếm số đơn hiện có rồi +1**.
//    Công thức đó sinh mã TRÙNG ngay khi có một đơn bị bỏ đi — đúng cái sai mà
//    `dat-ten-de-nghi.ts` → `maDeNghiTiepTheo` đã phải sửa ngày 14/08/2026 cho mã đề nghị,
//    nhưng mã đơn hàng thì chưa được sửa theo.
//
//    Từ 18/08/2026 việc này thành cấp bách hơn: module "Lập đơn mua hàng (PO)" độc lập cho
//    người lập TỰ CHỌN / TỰ GÕ mã dự án, nên một mã dự án có thể nhận đơn từ nhiều đường khác
//    nhau và khả năng đụng số cao hơn hẳn.
//
// Hàm ở đây là hàm THUẦN, không đụng giao diện, không đụng kho dữ liệu.
// ============================================================

/**
 * Mã loại của đơn đặt hàng theo Thông báo 09/2026/TB-HPCS — **đã có trong danh mục duyệt**.
 *
 * Để ở đây làm một chỗ sửa duy nhất, phòng khi Thông báo có bản sửa.
 */
export const MA_LOAI_DON_HANG = "PO";

/**
 * Sinh mã đơn đặt hàng tiếp theo của một dự án.
 *
 * 🔴 LẤY SỐ LỚN NHẤT ĐÃ TỪNG DÙNG RỒI +1, **không đếm số đơn hiện có rồi +1**.
 * Đếm rồi +1 thì: lập PO-001 · PO-002 · PO-003, bỏ PO-002 → còn 2 đơn → đơn tiếp theo lại ra
 * PO-003, trùng với đơn đang tồn tại. Hai chứng từ cùng một mã là hỏng cả hệ mã của Thông báo
 * 09/2026 — tra cứu ra nhầm đơn, hồ sơ giấy lẫn lộn, công nợ cộng nhầm.
 *
 * 📌 Vòng `while` cuối là chốt chặn cuối: dữ liệu có thể chứa mã không theo khuôn (nhập tay,
 * nhập từ Excel, đơn của bản chạy thử cũ), lúc đó `lonNhat` không phản ánh hết thực tế.
 *
 * @param maDuAn  Mã dự án gốc, vd `260001-HPCS`. Gọi hàm phải bảo đảm KHÔNG rỗng — mã rỗng
 *                cho ra `-PO-001`, một mã hồ sơ vô nghĩa. Chốt chặn ở `themDonHang`.
 * @param maDaDung Mã của MỌI đơn đang có (không chỉ đơn cùng dự án) — để vòng `while` chống
 *                trùng nhìn được toàn bộ.
 */
export function maDonHangTiepTheo(maDuAn: string, maDaDung: readonly string[]): string {
  const duAn = maDuAn.trim();
  // Thoát ký tự đặc biệt: mã dự án là chuỗi người dùng gõ, có thể chứa `.`, `(`, `+`…
  const cungDuAn = new RegExp(
    `^${duAn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-${MA_LOAI_DON_HANG}-(\\d+)`,
  );

  let lonNhat = 0;
  for (const ma of maDaDung) {
    const khop = cungDuAn.exec(ma.trim());
    if (khop) lonNhat = Math.max(lonNhat, Number(khop[1]));
  }

  const daDung = new Set(maDaDung.map((m) => m.trim()));
  let so = lonNhat + 1;
  let ma = `${duAn}-${MA_LOAI_DON_HANG}-${String(so).padStart(3, "0")}`;
  while (daDung.has(ma)) {
    so += 1;
    ma = `${duAn}-${MA_LOAI_DON_HANG}-${String(so).padStart(3, "0")}`;
  }
  return ma;
}
