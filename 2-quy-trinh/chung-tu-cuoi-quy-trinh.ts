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

/**
 * ★★ Bước giữ tệp hợp đồng — **bước ④ "Lập đơn mua hàng"** (Ban lãnh đạo 26/08/2026: *"Phải có
 * hợp đồng hoặc thoả thuận mua bán thì mới tiến hành lập PO được, vậy nên hãy kéo bước đính kèm
 * hợp đồng về bước này"*).
 *
 * 🔴 ĐÂY LÀ LẦN ĐỔI THỨ HAI — ĐỌC KỸ TRƯỚC KHI ĐỔI LẦN NỮA.
 *
 *   · tới 24/08/2026 : ở ④, và bị đòi TRƯỚC khi lập đơn
 *   · 24 → 26/08/2026: dời sang ⑤ "Tiến hành đặt hàng"
 *   · từ 26/08/2026  : **về lại ④**
 *
 * ⚠️ LẦN DỜI SANG ⑤ CÓ LÝ DO THẬT, và lý do đó nay đã được Ban lãnh đạo GỠ. Lý do cũ: hợp đồng
 * mua bán thường **ghi số đơn hàng**, mà số đơn chỉ sinh khi cất đơn → vòng tròn *"muốn có đơn
 * phải có hợp đồng, muốn có hợp đồng phải có số đơn"*.
 *
 * ✅ Vòng tròn đó **không còn**, vì cùng chỉ đạo 26/08 Ban lãnh đạo chốt: *"số HĐ ở PO sẽ được
 * nhập thủ công"*. Tức hợp đồng KHÔNG cần số đơn để lập; thứ tự nay là: ký hợp đồng → lập đơn và
 * **gõ tay** số hợp đồng vào ô "Hợp đồng - Ngày hợp đồng" của form PO.
 *
 * 🔴 Ai định dời lại sang ⑤ thì phải kiểm trước: ô số hợp đồng trên form PO còn cho gõ tay không.
 * Nếu ô đó quay lại kiểu tự sinh theo số đơn thì vòng tròn cũ sống dậy.
 */
export const BUOC_DINH_KEM_HOP_DONG = "lap_don_mua_hang";

/**
 * 🔴 KHÓA CŨ CỦA HỢP ĐỒNG — PHẢI ĐỌC TIẾP, KHÔNG ĐƯỢC BỎ.
 *
 * Từ 24 đến 26/08/2026 hợp đồng được cất theo khóa `"dat_hang"` (bước ⑤). Chỉ đọc khóa mới thì
 * **mọi hợp đồng đính kèm trong ba ngày đó biến mất khỏi hồ sơ**: app báo "chưa có Hợp đồng/Đơn
 * mua hàng", tô đỏ và chặn lập đơn, trong khi tệp vẫn nằm nguyên trong dữ liệu.
 *
 * 📌 Hai hằng số này vừa **hoán đổi cho nhau** (26/08) — trước đó khóa mới là `dat_hang`, khóa cũ
 * là `lap_don_mua_hang`. Vì `tepHopDong` đọc CẢ HAI nên không đợt tệp nào bị bỏ lại, dù hồ sơ
 * được đính ở đợt nào. Cùng cách đã xử với `BUOC_CU_HOA_DON_VAT`.
 */
const BUOC_CU_HOP_DONG = "dat_hang";

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
 * ★★ PHIẾU CHI — mục 7 của bộ hồ sơ thanh toán (Ban lãnh đạo 26/08/2026).
 *
 * 📌 TÙY CHỌN, đúng chữ Sếp: *"7. Phiếu chi (Nếu có)"*. Không phải đơn nào cũng có phiếu chi —
 * đơn trả qua ngân hàng thì chứng từ là ủy nhiệm chi, phiếu chi là của khoản trả bằng tiền mặt.
 *
 * ⚠️ ĐỪNG BẮT BUỘC nó chỉ vì "cho đủ bảy mục": đòi một chứng từ mà nghiệp vụ không sinh ra là
 * buộc người dùng đính bừa hoặc ghi lý do bừa, rồi cả hai thứ mất nghĩa.
 */
export const NHAN_TEP_PHIEU_CHI = "Phiếu chi";

/**
 * ★ TÊN HIỂN THỊ của ô hợp đồng.
 *
 * 🔴 ĐÂY LÀ HAI THỨ KHÁC NHAU, ĐỪNG GỘP:
 *   · `NHAN_TEP_HOP_DONG` = **khóa lưu** trong `ghiChu` của tệp. Đổi nó là mọi hợp đồng đã đính
 *     kèm trước hôm nay **không được nhận ra nữa** — đơn đang ở bước sau bị đẩy về "chưa có hợp
 *     đồng", và người dùng không hiểu vì sao tệp còn đó mà app báo thiếu.
 *   · `TEN_HIEN_HOP_DONG` = chữ in trên màn hình. Đổi tự do.
 *
 * ★★ ĐỔI 13/09/2026 — Sếp nguyên văn: *"Đổi tên, Vì mục hợp đồng và đơn mua hàng là 2 tài liệu
 * khác nhau"*. Trước đó là `"Hợp đồng/Đơn mua hàng"` (Ban lãnh đạo 23/08/2026).
 *
 * 🔴 CHỈ ĐỔI CHỮ HIỂN THỊ, KHÔNG ĐỔI `NHAN_TEP_HOP_DONG` — đó là khóa lưu, đổi nó là mọi hợp
 * đồng đã đính kèm trước hôm nay không được nhận ra nữa và hồ sơ đang chạy bị đẩy về "chưa có
 * hợp đồng" (xem đúng cảnh báo ở ngay trên).
 *
 * ⚠️ CÁI GIÁ CỦA VIỆC CHỈ ĐỔI TÊN — ĐANG CHỜ SẾP QUYẾT, ĐỪNG TƯỞNG ĐÃ XONG:
 * App hiện dùng **MỘT ô, MỘT tệp** cho cả hai bước ④ *Lập đơn mua hàng* và ⑤ *Tiến hành đặt
 * hàng* (Sếp chốt 01/09/2026: *"cùng tệp với bước ④, sửa ở đây bước ④ cũng thấy ngay"*). Ô ở
 * bước ⑤ là nơi đính **bản đơn mua hàng / hợp đồng đã ký đóng mộc NCC gửi về**. Sau lần đổi tên
 * này, ô đó mang tên "Hợp đồng" — **sai tên với thứ thật sự được đính vào đấy** khi đơn dùng mẫu
 * PO-02 (chính tờ đơn là thoả thuận, không có hợp đồng riêng).
 * 👉 Tách thật thành HAI chứng từ là việc lớn (thêm khóa tệp mới, sửa 4 hàm, xử lý dữ liệu cũ) —
 * đã mô tả cách tách trong báo cáo phiên, **chưa làm**. Ai đọc tới đây mà thấy vẫn còn một ô thì
 * nghĩa là Sếp chưa duyệt việc tách, không phải quên.
 */
export const TEN_HIEN_HOP_DONG = "Hợp đồng";

/**
 * ★★ TÊN HIỂN THỊ RIÊNG CHO Ô Ở BƯỚC ⑤ *Tiến hành đặt hàng* — Sếp 15/09/2026.
 *
 * Sếp khoanh đỏ ô tệp và ghi *"sửa tên trường này là Đơn mua hàng"*, rồi chỉnh lại cho chính xác:
 * *"mục đổi tên e chỉnh lại là 'Đơn mua hàng' ở bước tiến hành đặt hàng nha, không phải ở bước
 * lập đơn mua hàng"*. Nên bước ④ giữ nguyên "Hợp đồng", chỉ bước ⑤ đổi.
 *
 * ✅ ĐỔI Ở BƯỚC ⑤ MỚI LÀ ĐÚNG BẢN CHẤT, và khối cảnh báo ngay trên đã chỉ ra điều đó từ
 * 13/09/2026 mà chưa sửa được: ô ở bước ⑤ là nơi đính **bản đơn mua hàng đã ký đóng mộc do NCC
 * gửi về khi đặt hàng**. Gọi nó là "Hợp đồng" là sai tên với thứ thật sự được đính vào đấy,
 * nhất là đơn dùng mẫu PO-02 (chính tờ đơn là thoả thuận, không có hợp đồng riêng).
 *
 * 🔴 VẪN LÀ MỘT Ô, MỘT TỆP — chỉ khác chữ in ra. Cả ba chỗ (bước ④, ⑤, ⑧) đều dùng
 * `maGiaiDoan = BUOC_DINH_KEM_HOP_DONG` và `nhanO = NHAN_TEP_HOP_DONG`. Đính ở bước ⑤ thì bước ④
 * và ⑧ thấy ngay, và ngược lại. Đừng đọc hai cái tên rồi tưởng là hai chứng từ riêng.
 *
 * ⚠️ CÁI GIÁ, NÓI TRƯỚC ĐỂ KHÔNG AI TƯỞNG LÀ LỖI: cùng một tệp nay mang **hai tên** tùy bước đang
 * đứng — đính ở ô "Hợp đồng" bước ④ rồi sang bước ⑤ thấy nó nằm trong ô "Đơn mua hàng".
 * 👉 Muốn hết hẳn chuyện này thì phải TÁCH THẬT thành hai chứng từ (thêm khóa tệp mới, sửa 4 hàm,
 * xử lý dữ liệu cũ) — xem khối cảnh báo ngay trên, việc đó **chưa được duyệt**.
 */
export const TEN_HIEN_HOP_DONG_BUOC_DAT_HANG = "Đơn mua hàng";

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
/**
 * ⚠️ KHÓA NÀY **GIỮ NGUYÊN CHUỖI CŨ** dù hợp đồng đã chuyển sang bước ⑤ (24/08/2026).
 *
 * Đây là khóa **lưu dữ liệu** trong `lyDoThieuChungTu`, không phải tên bước. Đổi nó là mọi lý do
 * người dùng đã ghi trước hôm nay **không đọc ra được nữa** — hồ sơ đang đi tiếp bằng đường ghi
 * lý do sẽ đột ngột bị chặn lại, và người dùng thấy ô lý do trống trong khi mình đã điền. Cùng
 * bài học với `NHAN_TEP_HOP_DONG` ở trên: khóa lưu và chữ hiển thị là hai thứ khác nhau.
 */
export const KHOA_LY_DO_THIEU_HOP_DONG = "lap_don_mua_hang|hop_dong";

/**
 * ★★ HAI LÝ DO CHỌN SẴN cho việc chưa có hợp đồng — Ban lãnh đạo 13/09/2026: *"Thay vì tự nhập
 * lý do, hãy tạo cho a 2 nút này"*, kèm ảnh ghi rõ hai chữ **"Bổ sung sau"** và **"Không có HĐ"**.
 *
 * 🔴 VÌ SAO ĐỔI TỪ Ô GÕ TỰ DO SANG HAI NÚT: ô gõ tự do bắt người dùng nghĩ ra câu chữ cho một
 * việc chỉ có đúng hai tình huống thật — hoặc hợp đồng sẽ có nhưng chưa kịp, hoặc đơn này dùng
 * mẫu PO-02 (chính tờ đơn là thoả thuận) nên không bao giờ có hợp đồng riêng. Gõ tự do còn làm
 * mỗi người ghi một kiểu, sau này không thống kê được có bao nhiêu hồ sơ đang nợ hợp đồng thật.
 *
 * 🔴 LƯU ĐÚNG CHUỖI NHÃN, không lưu mã. Trường `lyDoThieuChungTu` là chữ NGƯỜI ĐỌC (hiện trên
 * hồ sơ và đi vào nhật ký), và mọi phép kiểm hiện có chỉ hỏi *"chuỗi này có rỗng không"* — xem
 * `lyDoThieuHopDong` / `thieuHopDongDaGhiLyDo`. Lưu mã thì nhật ký hiện `bo_sung_sau`, người đọc
 * không hiểu.
 *
 * 📌 TƯƠNG THÍCH NGƯỢC: hồ sơ cũ đã gõ lý do tự do vẫn chạy nguyên — chúng chỉ là một chuỗi khác
 * hai chuỗi này, và không phép kiểm nào đòi phải khớp danh sách. Đừng thêm phép kiểm "phải là một
 * trong hai" vào `vuongMacRoiBuocLapDon`: làm vậy là mọi hồ sơ cũ đột ngột bị chặn lại.
 */
/**
 * ★★ "BỔ SUNG SAU" — hợp đồng SẼ CÓ nhưng chưa kịp ký/chưa nhận được bản gốc.
 *
 * 🔴 Chọn chữ này thì hồ sơ **VẪN BỊ TÔ ĐỎ** — Sếp 13/09/2026: *"nếu chọn nút 'Bổ sung sau' thì
 * báo đỏ để nhắc việc"*. Đỏ ở đây không phải lỗi, là **lời nhắc còn nợ chứng từ**.
 */
export const LY_DO_BO_SUNG_SAU = "Bổ sung sau";

/**
 * ★★ "KHÔNG CÓ HĐ" — đơn này **KHÔNG BAO GIỜ** có hợp đồng riêng (điển hình là mẫu PO-02: chính
 * tờ đơn mua hàng đã là thoả thuận giữa hai bên).
 *
 * 🔴 Chọn chữ này thì hồ sơ **HẾT TÔ ĐỎ** — Sếp 13/09/2026: *"Khi chọn vào nút 'Không có HĐ' thì
 * mới ko báo đỏ"*. Đây là một **lời khai dứt điểm**, không phải việc còn treo: đỏ mãi một thứ
 * không bao giờ tới là dạy người dùng bỏ qua màu đỏ, đúng cái bẫy đã ghi ở `conNoCuaBuoc`
 * (*"đỏ ba trong bốn khối thì người dùng thôi để ý, đúng lúc cần để ý nhất"*).
 *
 * ⚠️ CÁI GIÁ — ĐÃ BÁO SẾP VÀ SẾP CHỐT CHỊU: hồ sơ chọn chữ này **BIẾN MẤT khỏi mọi danh sách
 * "còn nợ chứng từ"** do hai hàm `thieuHopDongDaGhiLyDo` và `mucConNoCuaBuoc` sinh ra. Ai bấm
 * nhầm nút này thì hồ sơ thiếu hợp đồng thật cũng lặng lẽ sạch dấu đỏ, không còn chỗ nào nhắc.
 * Lối thoát duy nhất là **bấm lại chính nút đó để bỏ chọn** — vì vậy cơ chế bỏ chọn ở
 * `de-nghi-chi-tiet.tsx` là bắt buộc phải còn, đừng gỡ.
 *
 * 📌 Chỗ KHÔNG bị ảnh hưởng (cố ý): `bo-ho-so-thanh-toan.ts` mục 4 vẫn đếm là thiếu, vì đó là
 * **bảng kiểm bộ hồ sơ giao Kế toán** — nó liệt kê tờ nào có/không có trong tay, không phải bảng
 * nhắc việc. Hai câu hỏi khác nhau, đừng gộp.
 */
export const LY_DO_KHONG_CO_HOP_DONG = "Không có HĐ";

/**
 * ⚠️ THỨ TỰ TRONG MẢNG = THỨ TỰ HAI NÚT TRÊN MÀN HÌNH (`de-nghi-chi-tiet.tsx` map qua mảng này),
 * và đúng thứ tự trong ảnh Sếp gửi 13/09/2026. Đảo là đổi giao diện.
 */
export const LY_DO_THIEU_HOP_DONG_CHON: readonly string[] = [
  LY_DO_BO_SUNG_SAU,
  LY_DO_KHONG_CO_HOP_DONG,
];

/**
 * ★★ HỒ SƠ ĐÃ KHAI "KHÔNG CÓ HĐ" — Sếp 13/09/2026: *"Khi chọn vào nút 'Không có HĐ' thì mới ko
 * báo đỏ, còn nếu chọn nút 'Bổ sung sau' thì báo đỏ để nhắc việc"*.
 *
 * 🔴 MỘT CHỖ DUY NHẤT trả lời câu *"lời khai này có tắt dấu đỏ không"*. HAI nơi đang hỏi:
 *   ① `thieuHopDongDaGhiLyDo` (ngay dưới) → viền/nền đỏ hộp "Lý do chưa có" ở trang chi tiết
 *   ② `mucConNoCuaBuoc` trong `giai-doan-mua-hang.ts` → viền đỏ khối bước, nhãn "Còn thiếu", và
 *      chữ "thiếu HĐ" trên thẻ kanban
 * Chép điều kiện ra hai chỗ là app **tự mâu thuẫn**: hộp hết đỏ mà thẻ vẫn kêu thiếu HĐ, hoặc
 * ngược lại — đúng kiểu lỗi mà cả tệp này sinh ra để tránh (xem khối chú thích đầu tệp).
 *
 * 🔴 SO VỚI HẰNG SỐ `LY_DO_KHONG_CO_HOP_DONG`, TUYỆT ĐỐI KHÔNG GÕ CỨNG CHUỖI "Không có HĐ" ở nơi
 * khác: đổi chữ trên nút mà quên một chỗ gõ cứng là dấu đỏ im lặng sai, không lỗi nào báo.
 *
 * 📌 KHÔNG hỏi `coHopDong` ở đây — hàm này chỉ đọc **lời khai**. Cả hai nơi gọi đều đã nằm trong
 * nhánh `!coHopDong(...)`, nên có tệp rồi thì không ai hỏi tới câu này.
 */
export function daKhaiKhongCoHopDong(deNghi: DeNghiMuaHang): boolean {
  return lyDoThieuHopDong(deNghi) === LY_DO_KHONG_CO_HOP_DONG;
}

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
  /* Đọc CẢ khóa mới (bước ⑤) và khóa cũ (bước ④) — xem `BUOC_CU_HOP_DONG`. Khử trùng theo id
     vì một tệp có thể nằm ở cả hai khóa nếu ai đó đính lại sau khi chuyển bước. */
  const moi = tepTheoNhan(deNghi, BUOC_DINH_KEM_HOP_DONG, NHAN_TEP_HOP_DONG);
  const cu = tepTheoNhan(deNghi, BUOC_CU_HOP_DONG, NHAN_TEP_HOP_DONG);
  const daCo = new Set(moi.map((t) => t.id));
  return [...moi, ...cu.filter((t) => !daCo.has(t.id))];
}

/**
 * ★ CHỈ TỆP Ở ĐÚNG KHÓA CANONICAL (`BUOC_DINH_KEM_HOP_DONG`) — dùng cho `tepDaCo` của MỌI hộp
 * `OChungTuBatBuoc` sửa/xóa hợp đồng (cả bước ④ lẫn bước ⑤ từ 01/09/2026), KHÔNG dùng `tepHopDong`
 * ở đây.
 *
 * 🔴 VÌ SAO PHẢI TÁCH RIÊNG — CodeRabbit bắt đúng ở PR thêm hộp bước ⑤: `OChungTuBatBuoc` xóa/thay
 * tệp bằng `goTepGiaiDoan(id, maGiaiDoan, tepId, ...)` với `maGiaiDoan` CỐ ĐỊNH là
 * `BUOC_DINH_KEM_HOP_DONG` — hàm đó chỉ tìm trong ĐÚNG khóa đó
 * (`dn.tepGiaiDoan?.[maGiaiDoan]`), không dò cả khóa cũ `BUOC_CU_HOP_DONG`. Đưa nguyên
 * `tepHopDong(dn)` (đã GỘP hai khóa) vào `tepDaCo` thì hộp vẽ ra cả tệp mồ côi cũ — bấm xóa/thay
 * đúng tệp đó sẽ báo sai *"Tệp này không còn trong hồ sơ"* vì tìm nhầm khóa.
 *
 * 📌 Chỗ nào chỉ hỏi "có hợp đồng chưa" (`coHopDong`, `vuongMacRoiBuocLapDon`...) thì VẪN dùng
 * `tepHopDong` (gộp) như cũ — tệp cũ vẫn tính là có hợp đồng, chỉ là không sửa/xóa được qua hộp
 * này. Xem tệp cũ, xóa tệp cũ thì đúng chỗ là khối đọc-only (`KhuDinhKemGiaiDoan maGiaiDoan="dat_hang"`).
 */
export function tepHopDongSuaDuoc(deNghi: DeNghiMuaHang): MoTaTep[] {
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

/**
 * ★★ Tệp PHIẾU CHI — mục 7 của bộ hồ sơ thanh toán (Ban lãnh đạo 26/08/2026).
 *
 * 📌 CHỈ ĐỌC MỘT KHÓA, không gộp khóa cũ như hai hàm trên: ô này mới có từ 26/08/2026 nên không
 * có dữ liệu cũ nào nằm ở khóa khác. Thêm khóa cũ cho "đối xứng" là mời người sau tin rằng từng
 * có một bước Phiếu chi riêng — chuyện chưa bao giờ xảy ra.
 */
export function tepPhieuChi(deNghi: DeNghiMuaHang): MoTaTep[] {
  return tepTheoNhan(deNghi, BUOC_DINH_KEM_HO_SO_THANH_TOAN, NHAN_TEP_PHIEU_CHI);
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
 * 📌 Khác hẳn `coHopDong`: hồ sơ này **đi tiếp được**, nhưng vẫn thiếu chứng từ. Nay có BỐN
 * trạng thái, đừng gộp lại:
 *   ① có tệp                          → đủ hồ sơ, không tô gì
 *   ② không tệp + "Bổ sung sau"        → đi được, TÔ ĐỎ, phải bổ sung sau   ← cờ này
 *   ③ không tệp + "Không có HĐ"        → đi được, KHÔNG tô đỏ (13/09/2026)  ← thêm mới
 *   ④ không tệp + không lý do          → chặn chuyển bước
 *
 * ★★ TRẠNG THÁI ③ THÊM 13/09/2026 — Sếp nguyên văn: *"Khi chọn vào nút 'Không có HĐ' thì mới ko
 * báo đỏ, còn nếu chọn nút 'Bổ sung sau' thì báo đỏ để nhắc việc"*.
 *
 * 🔴 VÌ SAO ĐÚNG VỀ NGHIỆP VỤ: đỏ = *"còn nợ, nhớ bổ sung"*. Đơn mẫu PO-02 không bao giờ có hợp
 * đồng riêng để bổ sung, nên tô đỏ nó là nhắc một việc không tồn tại — và nhắc sai hoài thì người
 * dùng thôi nhìn màu đỏ, kể cả lúc nó đúng.
 *
 * ⚠️ CÁI GIÁ — SẾP ĐÃ BIẾT VÀ CHỐT: hồ sơ chọn "Không có HĐ" **biến mất khỏi mọi danh sách còn
 * nợ chứng từ** (cả hộp lý do lẫn thẻ kanban). Bấm nhầm nút thì không còn chỗ nào nhắc nữa; chữa
 * bằng cách bấm lại chính nút đó để bỏ chọn. Xem đầy đủ ở `LY_DO_KHONG_CO_HOP_DONG`.
 *
 * 🔴 PHẢI SỬA KÈM `mucConNoCuaBuoc` (`giai-doan-mua-hang.ts`, nhánh `giaiDoan === "dat_hang"`) —
 * đó là nguồn của viền đỏ khối bước và chữ "thiếu HĐ" trên thẻ. Sửa một nơi là app tự mâu thuẫn.
 */
export function thieuHopDongDaGhiLyDo(deNghi: DeNghiMuaHang): boolean {
  if (coHopDong(deNghi)) return false;
  /* Khai "Không có HĐ" là chốt dứt điểm, không phải việc còn treo → thôi đỏ. */
  if (daKhaiKhongCoHopDong(deNghi)) return false;
  return lyDoThieuHopDong(deNghi) !== "";
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
  /* 📌 Câu chỉ về bước ④ "Lập đơn mua hàng" — nơi ô đính kèm hợp đồng đã quay lại (Ban lãnh đạo
     26/08/2026). Chỉ sai chỗ là người dùng đi tìm ô ở khối không có nó; đã từng xảy ra khi ô dời
     sang ⑤ mà câu này còn chỉ về ④. */
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
 * ③ Vướng mắc khi đóng HỒ SƠ ĐỀ NGHỊ (bước ⑧ "Hoàn thành quy trình") — `null` là duyệt được.
 *
 * 🔴 ĐÂY LÀ CHỖ DUY NHẤT giữ luật "phải có hóa đơn VAT mới hoàn thành". Mọi nút và mọi tầng ghi
 * đều phải hỏi hàm này, đừng chép điều kiện đi nơi khác.
 *
 * 🔴🔴 PHẠM VI ĐÃ THU HẸP 27/08/2026 — Ban lãnh đạo: *"Phần xác nhận đơn hàng này chỉ cần có
 * đính kèm phiếu giao hàng là được xác nhận hoàn thành"*.
 *
 * Trước ngày đó hàm này còn được gọi ở nút **Xác nhận hoàn thành ĐƠN** (bước ⑦, `xacNhanTruongBP`
 * trong `kho-du-lieu.tsx`). Nay KHÔNG còn. Phân biệt hai việc, đừng gộp lại:
 *
 *   · **Hoàn thành ĐƠN HÀNG** (⑦) — hàng về đủ + thủ kho xác nhận (tức mọi lần giao đều có tệp
 *     phiếu giao nhận, luật 11/08/2026). Việc mua bán đã xong. KHÔNG đòi hóa đơn.
 *   · **Hoàn thành QUY TRÌNH** (⑧) — đóng cả hồ sơ để đẩy sang Kế toán. ĐÒI hóa đơn VAT, vì
 *     không có hóa đơn thì Kế toán không hạch toán và không thanh toán được.
 *
 * ⚠️ ĐỪNG "DỌN CHO GỌN" bằng cách gọi lại hàm này ở nút ⑦. Nhà cung cấp thường xuất hóa đơn sau,
 * có khi cuối tháng — đòi hóa đơn ở ⑦ là giữ đơn dở dang hàng tuần dù thực tế không còn việc gì.
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

  /**
   * ★★ BẮT BUỘC CÓ TỆP HỢP ĐỒNG MỚI ĐÓNG ĐƯỢC HỒ SƠ — Sếp 14/09/2026, nguyên văn: *"2 loại này
   * đều phải đính kèm hợp đồng… E chỉ cần tạo nút đính kèm HĐ bắt buộc là được"*.
   *
   * 🔴 DÙNG `coHopDong` (CHỈ HỎI CÓ TỆP), TUYỆT ĐỐI KHÔNG DÙNG `vuongMacRoiBuocLapDon` — hàm kia
   * chấp nhận **tệp HOẶC lời khai**, dùng nhầm ở đây là hồ sơ bấm "Không có HĐ" đóng được mà
   * không có tờ hợp đồng nào, tức luật này thành vô hiệu ngay ngày đầu.
   *
   * 📌 HAI CHỐT NÀY KHÁC NHAU LÀ CỐ Ý, ĐỪNG "DỌN CHO THỐNG NHẤT":
   *   · Bước ④ (`vuongMacRoiBuocLapDon`) — *tệp HOẶC lý do*. Nới ở đây là đúng: lúc lập đơn thì
   *     hợp đồng thường CHƯA ký xong, chặn cứng là cả phòng đứng lại. Sếp 13/09/2026 còn thêm
   *     hai nút lý do ở chính chốt này.
   *   · Bước ⑧ (dòng dưới) — *BẮT BUỘC CÓ TỆP*. Đây là lúc đóng hồ sơ đẩy sang Kế toán, không
   *     còn "sẽ bổ sung sau" nữa. Lời khai không thay được chứng từ.
   * Cùng một câu hỏi "có hợp đồng chưa" nhưng hỏi ở hai thời điểm khác nhau nên đòi khác nhau —
   * y hệt cặp `vuongMacDuyetHoanThanhDeNghi` (⑦ không đòi hóa đơn · ⑧ đòi) ngay trên.
   *
   * ⚠️ HỆ QUẢ PHẢI BIẾT, ĐÃ BÁO SẾP: hồ sơ đã bấm **"Không có HĐ"** vẫn KHÔNG hoàn thành được
   * cho tới khi đính tệp thật. Dấu đỏ giữa chừng thì tắt (luật 13/09), nhưng cửa cuối vẫn đóng.
   * Đó đúng chữ Sếp *"2 loại này đều phải đính kèm hợp đồng"* — kể cả đơn mẫu PO-02.
   *
   * 📌 XÉT TRƯỚC hóa đơn VAT: hợp đồng thuộc bước ④/⑤, hóa đơn thuộc ⑦. Nhắc theo đúng thứ tự
   * thời gian thì người dùng đi ngược dòng hồ sơ một lượt, không nhảy qua nhảy lại.
   */
  if (!coHopDong(deNghi)) {
    return `Chưa đính kèm ${TEN_HIEN_HOP_DONG} — bắt buộc phải có bản đã ký mới đóng được hồ sơ. Đính kèm ngay ở ô “${TEN_HIEN_HOP_DONG}” trong khối này.`;
  }

  /* Hai điều kiện chứng từ — dùng lại đúng hai hàm ở trên, không viết lại điều kiện. */
  const thieuVAT = vuongMacDuyetHoanThanhDeNghi(deNghi);
  if (thieuVAT !== null) return thieuVAT;

  if (!daTichXongUNC(deNghi)) {
    return 'Chưa tích xong việc "Đã xử lý ủy nhiệm chi" ở bước UNC. Đơn không cần ủy nhiệm chi thì vẫn phải tích để xác nhận đã xem.';
  }

  return null;
}
