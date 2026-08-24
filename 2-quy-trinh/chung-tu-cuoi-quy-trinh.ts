// ============================================================
// BA CHỨNG TỪ BẮT BUỘC Ở CUỐI QUY TRÌNH — MỘT CHỖ DUY NHẤT
//
// ★ Chỉ đạo Ban lãnh đạo 22/08/2026:
//   ① *"Ở bước lập đơn mua hàng, thêm cho 1 trường đính kèm Hợp đồng ở mục kết quả và phải có
//      đính kèm thì mới cho chuyển bước"*
//   ② *"Hoá đơn VAT - bắt buộc phải có thì trưởng bộ phận mới duyệt hoàn thành được"*
//   ③ *"UNC (nếu có) - Nếu có, nhưng bắt buộc phải hoàn thành bước 1 thì mới được tích hoàn
//      thành"*
//
// 🔴 VÌ SAO GOM VÀO MỘT FILE HÀM THUẦN: mỗi luật dưới đây bị hỏi ở BA NƠI —
//   ① khu đính kèm của bước (vẽ ô nào, khóa hay mở),
//   ② nút chuyển bước / nút duyệt hoàn thành (khóa hay mở, kèm lý do),
//   ③ tầng ghi dữ liệu (chặn thật, vì nút luôn có thể bị đi vòng: kéo thả, URL trực tiếp).
// Chép điều kiện ra ba chỗ là kiểu lỗi tệ nhất của dự án này: nút mở mà tầng ghi từ chối, hoặc
// nút khóa mà đường khác vẫn đi được — và không có gì báo cho tới khi hồ sơ đã trôi qua.
// Cùng cách đã làm cho `bao-gia-dinh-kem.ts`.
//
// 📌 PHÂN BIỆT BẮT BUỘC / TÙY CHỌN — đừng làm lẫn:
//   · Hợp đồng   → BẮT BUỘC để rời bước "Lập đơn mua hàng"
//   · Hóa đơn VAT → BẮT BUỘC để duyệt hoàn thành
//   · UNC        → **TÙY CHỌN**. Có thì đính kèm, không có thì vẫn đi tiếp được. Điều duy nhất
//     bị chặn là *tích xong bước UNC trước khi có hóa đơn VAT* — vì ủy nhiệm chi là lệnh trả
//     tiền, ký lệnh trả trước khi có hóa đơn là chi tiền không có chứng từ đối chiếu.
// ============================================================

import type { DeNghiMuaHang, MoTaTep } from "@/3-du-lieu/kieu-du-lieu";

/** Bước giữ tệp hợp đồng — chính bước lập đơn, nơi hợp đồng được ký kèm đơn. */
export const BUOC_DINH_KEM_HOP_DONG = "lap_don_mua_hang";

/**
 * ★ Bước giữ CẢ hóa đơn VAT VÀ ủy nhiệm chi — Ban lãnh đạo 23/08/2026: *"Gộp 2 mục này lại thành
 * 1 'Hồ sơ thanh toán'"*.
 */
export const BUOC_DINH_KEM_HO_SO_THANH_TOAN = "ho_so_thanh_toan";

/**
 * 🔴 HAI KHÓA CŨ — PHẢI ĐỌC TIẾP, KHÔNG ĐƯỢC BỎ.
 *
 * Từ 22 đến 23/08/2026 app có hai bước riêng (`hoa_don_vat`, `unc`), và tệp đính kèm được cất
 * theo đúng hai khóa đó trong `DeNghiMuaHang.tepGiaiDoan`. Nay gộp bước thành một khóa mới; nếu
 * chỉ đọc khóa mới thì **mọi hóa đơn VAT đã đính trong hai ngày đó biến mất khỏi hồ sơ** — app sẽ
 * báo "chưa có hóa đơn VAT" và chặn duyệt hoàn thành, trong khi tệp vẫn nằm trong dữ liệu.
 *
 * Rẻ hơn nhiều so với việc viết mã chuyển đổi dữ liệu: chỉ cần đọc cả ba khóa.
 */
const BUOC_CU_HOA_DON_VAT = "hoa_don_vat";
const BUOC_CU_UNC = "unc";

/**
 * Nhãn ghi chú đánh dấu từng loại tệp.
 *
 * 📌 App giữ tệp mỗi bước thành MỘT DANH SÁCH, không có khái niệm "ô số 1, ô số 2" — nên mỗi ô
 * đánh dấu tệp của mình bằng **ghi chú tệp**, đúng cách `bao-gia-dinh-kem.ts` đang làm.
 */
export const NHAN_TEP_HOP_DONG = "Hợp đồng";
export const NHAN_TEP_HOA_DON_VAT = "Hóa đơn VAT";
export const NHAN_TEP_UNC = "Ủy nhiệm chi";

/**
 * ★ TÊN HIỂN THỊ của ô hợp đồng — Ban lãnh đạo 23/08/2026: *"Sửa tên: Hợp đồng/Đơn mua hàng"*.
 *
 * 🔴 ĐÂY LÀ HAI THỨ KHÁC NHAU, ĐỪNG GỘP:
 *   · `NHAN_TEP_HOP_DONG` = **khóa lưu** trong `ghiChu` của tệp. Đổi nó là mọi hợp đồng đã đính
 *     kèm trước hôm nay **không được nhận ra nữa** — đơn đang ở bước sau bị đẩy về "chưa có hợp
 *     đồng", và người dùng không hiểu vì sao tệp còn đó mà app báo thiếu.
 *   · `TEN_HIEN_HOP_DONG` = chữ in trên màn hình. Đổi tự do.
 */
export const TEN_HIEN_HOP_DONG = "Hợp đồng/Đơn mua hàng";

/**
 * ★ KHÓA GHI LÝ DO CHƯA CÓ CHỨNG TỪ — Ban lãnh đạo 23/08/2026: *"Thêm hàm bắt buộc có file đính
 * kèm hoặc ghi chú lý do không đính kèm file thì mới cho chuyển bước và phải tô màu đỏ lại. Để
 * biết là còn thiếu hồ sơ để bổ sung sau"*.
 *
 * 🔴 VÌ SAO PHẢI CÓ ĐƯỜNG THỨ HAI: thực tế hợp đồng thường ký sau khi đặt hàng vài ngày. Chốt
 * cứng "không có tệp thì không đi" làm hồ sơ **kẹt ở bước ④** dù việc mua đã chạy — rồi người
 * dùng sẽ tìm cách đính một tệp bất kỳ cho qua, tức app tự dạy nhau làm giả chứng từ.
 *
 * 🔴 NHƯNG ĐI BẰNG LÝ DO KHÔNG PHẢI LÀ ĐỦ HỒ SƠ. Vì vậy `thieuChungTuDaGhiLyDo` còn đó để giao
 * diện **tô đỏ** — hồ sơ đi tiếp được nhưng vẫn mang dấu "còn nợ chứng từ", không biến mất khỏi
 * tầm nhìn của người quản lý.
 */
export const KHOA_LY_DO_THIEU_HOP_DONG = "lap_don_mua_hang|hop_dong";

/**
 * Mã công việc "đã xong bước UNC" trong `congViecDaXong`.
 *
 * 🔴 UNC cần một CÁI TÍCH RIÊNG, không suy ra từ việc có tệp hay không: phần lớn đơn **không có**
 * ủy nhiệm chi, và những đơn đó vẫn phải đi tiếp được. Nếu lấy "có tệp UNC" làm điều kiện xong
 * thì mọi đơn trả tiền ngay sẽ kẹt vĩnh viễn ở bước này, không đường ra.
 */
export const VIEC_UNC_XONG = "unc_xong";

/** Tệp của một bước, lọc theo nhãn ghi chú. */
function tepTheoNhan(deNghi: DeNghiMuaHang, buoc: string, nhan: string): MoTaTep[] {
  const ds = deNghi.tepGiaiDoan?.[buoc] ?? [];
  /* So sánh CHÍNH XÁC nhãn: nới thành "có chứa" là ghi chú người dùng tự gõ ("chờ hóa đơn VAT
     bên A gửi") bị đếm thành chứng từ thật, và app báo đủ hồ sơ khi hồ sơ còn thiếu. */
  return ds.filter((t) => (t.ghiChu ?? "").trim() === nhan);
}

export function tepHopDong(deNghi: DeNghiMuaHang): MoTaTep[] {
  return tepTheoNhan(deNghi, BUOC_DINH_KEM_HOP_DONG, NHAN_TEP_HOP_DONG);
}

/**
 * Gộp tệp của khóa MỚI và khóa CŨ, bỏ trùng theo id — xem `BUOC_CU_HOA_DON_VAT`.
 *
 * ⚠️ Phải khử trùng: một tệp có thể được ghi ở cả hai khóa nếu ai đó đính lại sau khi gộp bước.
 * Đếm hai lần thì ô đính kèm vẽ hai dòng cho cùng một tệp.
 */
function gopTepHaiKhoa(deNghi: DeNghiMuaHang, buocCu: string, nhan: string): MoTaTep[] {
  const moi = tepTheoNhan(deNghi, BUOC_DINH_KEM_HO_SO_THANH_TOAN, nhan);
  const cu = tepTheoNhan(deNghi, buocCu, nhan);
  const daCo = new Set(moi.map((t) => t.id));
  return [...moi, ...cu.filter((t) => !daCo.has(t.id))];
}

export function tepHoaDonVAT(deNghi: DeNghiMuaHang): MoTaTep[] {
  return gopTepHaiKhoa(deNghi, BUOC_CU_HOA_DON_VAT, NHAN_TEP_HOA_DON_VAT);
}
export function tepUNC(deNghi: DeNghiMuaHang): MoTaTep[] {
  return gopTepHaiKhoa(deNghi, BUOC_CU_UNC, NHAN_TEP_UNC);
}

export function coHopDong(deNghi: DeNghiMuaHang): boolean {
  return tepHopDong(deNghi).length > 0;
}
export function coHoaDonVAT(deNghi: DeNghiMuaHang): boolean {
  return tepHoaDonVAT(deNghi).length > 0;
}

/** Bước UNC đã được tích xong chưa. */
export function daTichXongUNC(deNghi: DeNghiMuaHang): boolean {
  return (deNghi.congViecDaXong ?? []).some((v) => v.maCongViec === VIEC_UNC_XONG);
}

/** Lý do người dùng đã ghi cho việc chưa đính kèm hợp đồng. Chuỗi rỗng = chưa ghi. */
export function lyDoThieuHopDong(deNghi: DeNghiMuaHang): string {
  return (deNghi.lyDoThieuChungTu?.[KHOA_LY_DO_THIEU_HOP_DONG] ?? "").trim();
}

/**
 * ★ CÒN NỢ HỢP ĐỒNG NHƯNG ĐÃ GHI LÝ DO — giao diện dùng cờ này để TÔ ĐỎ (23/08/2026).
 *
 * 📌 Khác hẳn `coHopDong`: hồ sơ này **đi tiếp được**, nhưng vẫn thiếu chứng từ. Ba trạng thái,
 * đừng gộp thành hai:
 *   ① có tệp                → đủ hồ sơ, không tô gì
 *   ② không tệp + có lý do  → đi được, TÔ ĐỎ, phải bổ sung sau   ← cờ này
 *   ③ không tệp + không lý do → chặn chuyển bước
 */
export function thieuHopDongDaGhiLyDo(deNghi: DeNghiMuaHang): boolean {
  return !coHopDong(deNghi) && lyDoThieuHopDong(deNghi) !== "";
}

/**
 * ① Vướng mắc khi rời bước "Lập đơn mua hàng" — trả về câu lý do, `null` là đi được.
 *
 * 🔴 Đòi TỆP HỢP ĐỒNG, không đòi "có đơn hàng". Đơn hàng đã là điều kiện cũ; cái Ban lãnh đạo
 * thêm là bản hợp đồng đã ký — thứ duy nhất chứng minh hai bên đã cam kết giá và điều khoản.
 *
 * ★ TỪ 23/08/2026 CHẤP NHẬN ĐƯỜNG THỨ HAI: chưa có tệp thì phải **ghi lý do**. Xem
 * `KHOA_LY_DO_THIEU_HOP_DONG` để biết vì sao — và vì sao đi kiểu này thì hồ sơ bị tô đỏ.
 */
export function vuongMacRoiBuocLapDon(deNghi: DeNghiMuaHang): string | null {
  if (coHopDong(deNghi)) return null;
  if (lyDoThieuHopDong(deNghi) !== "") return null;
  return `Chưa đính kèm ${TEN_HIEN_HOP_DONG}, và cũng chưa ghi lý do chưa có. Làm một trong hai việc đó ở khối kết quả của bước Lập đơn mua hàng.`;
}

/**
 * ② Vướng mắc khi tích xong bước UNC — `null` là tích được.
 *
 * ⚠️ Chỉ chặn ĐÚNG MỘT điều kiện: phải có hóa đơn VAT trước. Không đòi phải có tệp UNC, vì bước
 * này tùy chọn (xem `VIEC_UNC_XONG`).
 */
export function vuongMacTichXongUNC(deNghi: DeNghiMuaHang): string | null {
  if (coHoaDonVAT(deNghi)) return null;
  return "Chưa có Hóa đơn VAT. Ủy nhiệm chi là lệnh trả tiền — phải có hóa đơn trước mới ký lệnh trả.";
}

/**
 * ③ Vướng mắc khi trưởng bộ phận duyệt hoàn thành đề nghị — `null` là duyệt được.
 *
 * 🔴 ĐÂY LÀ CHỖ DUY NHẤT giữ luật "phải có hóa đơn VAT mới hoàn thành". Mọi nút và mọi tầng ghi
 * đều phải hỏi hàm này, đừng chép điều kiện đi nơi khác.
 *
 * ⚠️ KHÔNG đòi UNC: bước đó tùy chọn. Đòi cả UNC là chặn mọi đơn trả tiền ngay.
 */
export function vuongMacDuyetHoanThanhDeNghi(deNghi: DeNghiMuaHang): string | null {
  if (coHoaDonVAT(deNghi)) return null;
  return "Chưa đính kèm Hóa đơn VAT ở bước Hóa đơn VAT — bắt buộc phải có mới duyệt hoàn thành được.";
}

/**
 * ★ ĐỦ ĐIỀU KIỆN BẤM "HOÀN THÀNH QUY TRÌNH" CHƯA — `null` là bấm được (22/08/2026).
 *
 * 🔴 VÌ SAO CẦN NÚT NÀY: trước đây **không có hàm nào** đặt `deNghi.trangThai = "hoan_thanh"`.
 * Hồ sơ chỉ sang cột Hoàn thành gián tiếp, khi mọi đơn hàng của nó đều được xác nhận xong. Nghĩa
 * là nhánh `if (deNghi.trangThai === "hoan_thanh")` trong `xacDinhGiaiDoan` chưa bao giờ chạy —
 * mã có mà không đường tới. Nay trưởng bộ phận có một nút đóng hồ sơ tường minh.
 *
 * 🔴 KIỂM ĐỦ NĂM ĐIỀU KIỆN, THEO ĐÚNG THỨ TỰ NÀY. Mỗi câu trả về nói đúng việc còn thiếu; gộp
 * lại thành một câu chung ("chưa đủ điều kiện") là người dùng không biết phải làm gì tiếp.
 *
 * ⚠️ Nhận `tienDo` từ nơi gọi chứ không tự tính: luật đối chiếu khối lượng chỉ được có MỘT chỗ
 * (`tinh-toan.ts` → `tinhTienDoDeNghi`). Hai chỗ cùng cộng là sớm muộn lệch nhau.
 */
export function vuongMacHoanThanhQuyTrinh(
  deNghi: DeNghiMuaHang,
  tienDo: { khoiLuongChuaLenPO: number; khoiLuongConLai: number }[],
): string | null {
  if (tienDo.length === 0) {
    return "Phiếu đề nghị này chưa có mặt hàng nào để hoàn thành.";
  }

  const chuaLenDon = tienDo.filter((d) => d.khoiLuongChuaLenPO > 0).length;
  if (chuaLenDon > 0) {
    return `Còn ${chuaLenDon} mặt hàng chưa lên đơn hàng. Đóng hồ sơ lúc này là bỏ rơi phần vật tư chưa ai mua.`;
  }

  const chuaVeDu = tienDo.filter((d) => d.khoiLuongConLai > 0).length;
  if (chuaVeDu > 0) {
    return `Còn ${chuaVeDu} mặt hàng chưa nhận đủ hàng. Ghi nốt phiếu nhận hàng trước khi hoàn thành.`;
  }

  /* Hai điều kiện chứng từ — dùng lại đúng hai hàm ở trên, không viết lại điều kiện. */
  const thieuVAT = vuongMacDuyetHoanThanhDeNghi(deNghi);
  if (thieuVAT !== null) return thieuVAT;

  if (!daTichXongUNC(deNghi)) {
    return 'Chưa tích xong việc "Đã xử lý ủy nhiệm chi" ở bước UNC. Đơn không cần ủy nhiệm chi thì vẫn phải tích để xác nhận đã xem.';
  }

  return null;
}
