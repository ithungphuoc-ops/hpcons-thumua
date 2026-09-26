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

import {
  laHoSoPhongBan,
  LY_DO_NHANH_PHONG_BAN,
} from "@/2-quy-trinh/ho-so-phong-ban";
import { hauDueCua, locTienDoConPhaiMua } from "@/2-quy-trinh/nhan-ban-de-nghi";
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
 * ★★★ NGĂN RIÊNG CỦA **ĐƠN MUA HÀNG NCC KÝ** — Sếp 16/09/2026, nguyên văn: ***"Tách làm 2 mục
 * riêng"*** (Hợp đồng và Đơn mua hàng).
 *
 * 🔴🔴 ĐÂY LÀ NGĂN MỚI TINH, KHÔNG PHẢI ĐỔI TÊN NGĂN CŨ. `BUOC_DINH_KEM_HOP_DONG`
 * (`"lap_don_mua_hang"`) **không được đụng một chữ** — đó là chỗ đang chứa TOÀN BỘ tệp đã đính từ
 * trước tới nay. Đổi nó là mọi hồ sơ cũ mất sạch chứng từ, im lặng, không lỗi nào báo.
 *
 * 🔴 VÌ SAO KHÔNG PHẢI MÃ GIAI ĐOẠN: `DeNghiMuaHang.tepGiaiDoan` khai kiểu
 * `Record<string, MoTaTep[]>` (xem `3-du-lieu/kieu-du-lieu.ts`) — khóa là **chuỗi tự do**, không
 * có danh sách trắng nào ở tầng ghi (`themTepGiaiDoan` / `datTepVaoOGiaiDoan` / `goTepGiaiDoan`
 * đều nhận `maGiaiDoan: string`). Đã đo 16/09/2026 trước khi đặt khóa này. Cố ý đặt tên KHÁC mọi
 * mã giai đoạn để đọc ra ngay đây là ngăn của một CHỨNG TỪ, không phải của một bước.
 *
 * ⚠️ KHÔNG CÓ KHÓA CŨ NÀO ĐỂ GỘP — ngăn này sinh ra hôm nay, mọi tệp trước đó nằm ở ngăn chung
 * (`BUOC_DINH_KEM_HOP_DONG`). Cách app xử tệp chung cũ nằm ở `bo-ho-so-thanh-toan.ts` mục 4
 * (`tepDonMuaHangCuaMuc4`), KHÔNG xử ở đây — hàm này chỉ trả lời *"ngăn riêng có gì"*.
 */
export const BUOC_DINH_KEM_DON_MUA_HANG = "don_mua_hang_ncc_ky";

/**
 * ★★ NGĂN RIÊNG CỦA MỤC 9 *Đính kèm khác* — Sếp 16/09/2026: ***"Cần thiết mở thêm để đính kèm tài
 * liệu khác"***.
 *
 * 🔴🔴 TUYỆT ĐỐI KHÔNG DÙNG LẠI `BUOC_DINH_KEM_HO_SO_THANH_TOAN` CHO VIỆC NÀY. Đã đo 15/09/2026 và
 * đo lại 16/09/2026 — ba hệ quả, cái nào cũng thật:
 *   ① Ngăn đó đang chứa **Hoá đơn VAT · UNC · Phiếu chi**, nên khu đính kèm tự do sẽ bày lại cả ba
 *      ở mục 9 — đúng chỗ trùng lặp Sếp vừa bắt bỏ 15/09/2026.
 *   ② Nút *"Gỡ"* của khu tự do xoá được **Hoá đơn VAT thật**, và mất hoá đơn là
 *      `vuongMacDuyetHoanThanhDeNghi` chặn đóng hồ sơ vĩnh viễn.
 *   ③ Hạn mức `TOI_DA_TEP_MOI_BUOC` = 5 tính CHUNG cả ngăn, nên mục 9 chỉ còn 1–2 chỗ rồi báo
 *      *"Đã đủ 5 tệp cho bước này"*.
 * 👉 Ngăn riêng gỡ sạch cả ba, và mục 9 có trọn 5 chỗ của riêng nó.
 *
 * 📌 KHÔNG LỌC THEO NHÃN — khác hẳn ba chứng từ có tên ở trên. Mục 9 là *"Nếu có"*, tài liệu gì
 * cũng nhận (CO/CQ, biên bản nghiệm thu, thư xác nhận…), nên không có nhãn nào để so.
 */
export const BUOC_DINH_KEM_KHAC = "dinh_kem_khac";

/**
 * ★ TÊN HIỂN THỊ của mục 9, dùng cho cả tiêu đề ô lẫn nhãn ghi vào tệp — thêm 16/09/2026 khi Sếp
 * cho mục 9 dùng chung giao diện với các ô chứng từ khác (*"Đồng bộ lại giao diện đính kèm cho
 * giống nhau"*).
 *
 * 📌 Khác với Hợp đồng, ở đây **chữ vẽ và chữ lưu là một** — mục 9 chưa từng có nhãn lưu riêng nên
 * không có dữ liệu cũ nào để giữ tương thích. Nếu về sau đổi chữ hiển thị thì phải tách làm hai
 * hằng như cặp `NHAN_TEP_HOP_DONG` / `TEN_HIEN_HOP_DONG`, đừng đổi thẳng chuỗi này.
 */
export const TEN_HIEN_DINH_KEM_KHAC = "Đính kèm khác";

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
/**
 * ★★ NHÃN LƯU CỦA TỆP **ĐƠN MUA HÀNG NCC KÝ** — Sếp 16/09/2026 (*"Tách làm 2 mục riêng"*).
 *
 * 🔴 CHỮ NÀY GIỐNG `NHAN_TEP_HOP_DONG` Ở CHỖ NÓ LÀ **KHÓA LƯU**, đừng đổi khi chỉ muốn đổi chữ in
 * ra màn hình — dùng `TEN_HIEN_DON_MUA_HANG` cho việc đó.
 *
 * 📌 KHÔNG VA CHẠM với nhãn "Hợp đồng" dù hai ô trông giống nhau: nhãn chỉ có nghĩa **bên trong
 * một ngăn**, mà hai ô nằm ở hai ngăn khác nhau (`BUOC_DINH_KEM_DON_MUA_HANG` vs
 * `BUOC_DINH_KEM_HOP_DONG`). Đó chính là điều làm phép tách này an toàn.
 */
export const NHAN_TEP_DON_MUA_HANG = "Đơn mua hàng";
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
 * ★★ PHIẾU GIAO HÀNG DO NHÂN VIÊN MUA HÀNG TỰ ĐÍNH — **CHỈ DÙNG CHO HỒ SƠ PHÒNG BAN**.
 *
 * ★ Chỉ đạo Sếp 14/09/2026, nguyên văn: *"Các đề xuất từ phòng ban thì sẽ đi nhánh riêng, không
 * cần lấy dữ liệu từ app kho công trình mà nhân viên mua hàng sẽ là người bấm hoàn thành và đính
 * kèm phiếu giao hàng."*
 *
 * 🔴 ĐỌC CHO ĐÚNG CHỮ SẾP: câu đó **ĐỔI NGUỒN bằng chứng, KHÔNG BỎ bằng chứng**. Hồ sơ phòng ban
 * vẫn phải có tờ phiếu giao hàng nằm trong hồ sơ; khác duy nhất là người đính là **nhân viên mua
 * hàng** chứ không phải thủ kho / app QLK CTR. Ai đọc thành "phòng ban thì thôi không cần gì" là
 * đã nới trắng một chốt kiểm soát chứng từ — xem `vuongMacHoanThanhQuyTrinh` bên dưới.
 *
 * 🔴 VÌ SAO KHÔNG MƯỢN `PhieuNhanHang.tepPhieuGiao` NHƯ HỒ SƠ CÔNG TRÌNH: bằng chứng giao nhận của
 * hồ sơ công trình nằm trên TỪNG phiếu nhận hàng (`3-du-lieu/kieu-du-lieu.ts` → `PhieuNhanHang`),
 * và luật 11/08/2026 (`tinh-toan.ts` → `vuongMacXacNhanKho`) kiểm từng phiếu một. Nhưng phiếu nhận
 * hàng **chỉ do app QLK CTR gửi sang** — từ 30/08/2026 app đã bỏ hẳn đường ghi phiếu nhận thủ
 * công. Hồ sơ phòng ban không có kho công trình nào gửi phiếu, nên KHÔNG có bản ghi `PhieuNhanHang`
 * nào để móc tệp vào. Đòi bằng chứng ở chỗ không bao giờ có bản ghi = đúng cái kẹt vĩnh viễn đang
 * phải gỡ, chỉ đổi chỗ kẹt.
 * 👉 Nên chỗ chứa bằng chứng của nhánh phòng ban là **tệp đính kèm của bước ⑥**, đúng cơ chế mà ba
 * chứng từ cuối quy trình (Hợp đồng · Hóa đơn VAT · UNC) trong chính tệp này đang dùng.
 *
 * 📌 KHÓA LƯU LÀ `"nhan_hang"` — cùng khóa với khu đính kèm bước ⑥ *Tiến hành nhận hàng* đã có sẵn
 * trên trang chi tiết (`de-nghi-chi-tiet.tsx`, `<KhuDinhKemGiaiDoan maGiaiDoan="nhan_hang">`). Cố ý
 * dùng lại khóa cũ chứ không đẻ khóa mới: nhờ vậy **hôm nay đã có đường đính thật** — nhân viên
 * đính tệp ở khu đó rồi ghi chú đúng chữ "Phiếu giao hàng" là qua được, không phải chờ ai dựng
 * thêm giao diện. Không có chuyện app đòi một thứ mà màn hình chưa cho làm (CLAUDE.md §3.5).
 *
 * ════════════════════════════════════════════════════════════════════════════════════
 * 🔴🔴 ĐÃ BỎ Ô RIÊNG Ở BƯỚC ⑥ — Sếp 15/09/2026 (CHIỀU). ĐỌC TRƯỚC KHI ĐỊNH DỰNG LẠI NÓ.
 *
 * Khối chú thích này **trước đây ghi ngược lại**: nó dặn người sau hãy dựng một ô có tên
 * (`<OChungTuBatBuoc maGiaiDoan={BUOC_DINH_KEM_PHIEU_GIAO_HANG} …>`) trong khối bước ⑥. Ô đó
 * **đã được dựng thật** sáng 15/09/2026, rồi **Sếp cho bỏ ngay chiều cùng ngày**: ảnh chụp bản chạy
 * thật (hồ sơ `DMH260009`) khoanh đỏ đúng ô ấy kèm chữ ***"trường này đang bị dư => bỏ"***.
 *
 * 🔴 VÌ SAO SẾP ĐÚNG: giữa hai thời điểm đó, hộp **"Ghi nhận giao hàng"**
 * (`hop-ghi-nhan-giao-hang.tsx` → `themPhieuNhanPhongBan`) ra đời và **đã bắt buộc** đính kèm phiếu
 * giao hàng cho TỪNG lần giao (`vuongMacGhiNhanGiaoHangPhongBan` điều kiện ④). Tờ phiếu vào hồ sơ
 * qua đường đó rồi, nên ô này bắt nộp **lần thứ hai cùng một tờ** — và tệ hơn: ô gom mọi lần giao
 * vào một danh sách chung, không nói được tờ nào thuộc lần giao nào, trong khi
 * `PhieuNhanHang.tepPhieuGiao` gắn đúng từng lần (đúng tinh thần luật 11/08/2026).
 *
 * ✅ BA HẰNG SỐ / HÀM DƯỚI ĐÂY **KHÔNG BỊ XOÁ** vì vẫn có nơi gọi thật, không phải để "cho chắc":
 *   · `coPhieuGiaoHangPhongBan` → `vuongMacHoanThanhQuyTrinh` (ngay trong tệp này, nhánh phòng ban)
 *   · `coPhieuGiaoHangPhongBan` → `xacDinhGiaiDoan` (`giai-doan-mua-hang.ts`, biến `phongBanDaGiao`)
 *   · `tepPhieuGiaoHangPhongBan` → hàm trên
 * Chúng nay đóng vai **đường đọc dữ liệu cũ**: hồ sơ đã đính tệp qua ô kia (hoặc qua khu đính kèm
 * chung, tự gõ ghi chú) vẫn được nhận ra y như trước. Xoá đi là những hồ sơ đó mất bằng chứng và
 * kẹt lại — đúng loại lỗi cả tệp này sinh ra để tránh.
 *
 * 🔴 NẾU AI ĐỊNH DỰNG LẠI Ô: phải trả lời được *"tờ phiếu này khác tờ trong `tepPhieuGiao` của phiếu
 * nhận hàng ở chỗ nào"*. Không trả lời được thì đó là ô dư, và Sếp đã bỏ nó một lần rồi.
 * ════════════════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ TUYỆT ĐỐI KHÔNG đem nhãn này áp cho hồ sơ công trình. Khối chú thích ở bước ⑥ trong
 * `de-nghi-chi-tiet.tsx` đã ghi rõ: tệp đính kèm của bước **không thay được** tệp phiếu giao nhận
 * của từng lần giao, và **không được để nó gỡ** luật `vuongMacXacNhanKho` — nếu không luật
 * 11/08/2026 thành vô nghĩa với toàn bộ hồ sơ công trình.
 */
export const BUOC_DINH_KEM_PHIEU_GIAO_HANG = "nhan_hang";
export const NHAN_TEP_PHIEU_GIAO_HANG = "Phiếu giao hàng";

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
 * ✅ ĐÃ TÁCH THẬT 16/09/2026 — khối cảnh báo ở đây trước đây ghi *"việc tách… chưa làm, chưa được
 * Sếp duyệt"*. Sếp duyệt và ra lệnh ngày 16/09/2026: ***"Tách làm 2 mục riêng"***. Từ nay
 * **"Hợp đồng" và "Đơn mua hàng" là HAI chứng từ, HAI ngăn, HAI ô nộp, HAI lý do thiếu riêng**:
 *   · Hợp đồng      → `BUOC_DINH_KEM_HOP_DONG` (ngăn CŨ, giữ nguyên) + `NHAN_TEP_HOP_DONG`
 *   · Đơn mua hàng  → `BUOC_DINH_KEM_DON_MUA_HANG` (ngăn MỚI) + `NHAN_TEP_DON_MUA_HANG`
 * 👉 Cách app xử **tệp đã đính ở ngăn chung TRƯỚC khi tách** nằm ở `bo-ho-so-thanh-toan.ts` →
 *    `tepDonMuaHangCuaMuc4`. Đọc khối đó trước khi đụng vào bất cứ đường đọc nào dưới đây.
 */
export const TEN_HIEN_HOP_DONG = "Hợp đồng";

/**
 * ★★ CHỮ IN RA MÀN HÌNH của ô **Đơn mua hàng NCC ký** — Sếp 16/09/2026 (*"Tách làm 2 mục riêng"*).
 *
 * 📌 Tách khỏi `NHAN_TEP_DON_MUA_HANG` (khóa lưu) đúng cùng lý do đã ghi cho cặp
 * `NHAN_TEP_HOP_DONG` / `TEN_HIEN_HOP_DONG`: chữ hiển thị đổi tự do, khóa lưu thì không.
 */
export const TEN_HIEN_DON_MUA_HANG = "Đơn mua hàng";

/**
 * ❌❌ ĐÃ XOÁ `TEN_HIEN_HOP_DONG_BUOC_DAT_HANG` — 16/09/2026, KHI TÁCH THẬT HAI CHỨNG TỪ.
 * ĐỌC HẾT KHỐI NÀY TRƯỚC KHI ĐỊNH DỰNG LẠI MỘT MẸO TƯƠNG TỰ.
 *
 * Thứ bị xoá: `export const TEN_HIEN_HOP_DONG_BUOC_DAT_HANG = "Đơn mua hàng"` — một **mẹo đổi tên
 * hiển thị theo bước**, thêm 15/09/2026 khi Sếp ghi *"mục đổi tên e chỉnh lại là 'Đơn mua hàng' ở
 * bước tiến hành đặt hàng nha"*. Nó làm **một ô, một tệp** mang **hai tên** tuỳ bước người dùng
 * đang đứng: "Hợp đồng" ở bước ④, "Đơn mua hàng" ở bước ⑤.
 *
 * 🔴 VÌ SAO PHẢI XOÁ CHỨ KHÔNG ĐỂ LẠI CHO CHẮC: sau khi tách, bước ⑤ có **ô Đơn mua hàng THẬT**
 * (ngăn `BUOC_DINH_KEM_DON_MUA_HANG`) đứng ngay cạnh ô Hợp đồng. Giữ mẹo cũ thì trên cùng một
 * khối có HAI ô cùng mang chữ "Đơn mua hàng" mà ghi vào HAI ngăn khác nhau — người dùng đính vào
 * ô sai, chứng từ rơi vào mục sai, và **không một dòng nào báo**. Đó là hiểu nhầm nguy hơn hẳn
 * cái bất tiện mà mẹo này từng gỡ.
 *
 * ✅ CHỈ ĐẠO 15/09/2026 KHÔNG BỊ ĐẢO, NÓ ĐƯỢC THOẢ MÃN ĐÚNG HƠN: Sếp muốn thấy chữ "Đơn mua hàng"
 * ở bước ⑤ vì đó là nơi đính **bản đơn NCC ký đóng mộc gửi về**. Nay ở bước ⑤ vẫn có đúng chữ ấy —
 * khác ở chỗ nó là một chứng từ riêng thật, không phải cái nhãn dán lên tệp hợp đồng.
 *
 * 📌 Chữ hiển thị mới: `TEN_HIEN_DON_MUA_HANG` (ngay trên). Ô ở bước ④ và bước ⑤ nay đều gọi tệp
 * hợp đồng là `TEN_HIEN_HOP_DONG` — một tệp, một tên, ở mọi bước.
 */

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
 * 📌 Chỗ KHÔNG bị ảnh hưởng (cố ý): `bo-ho-so-thanh-toan.ts` — mục 3 vẫn **đếm là thiếu** trong
 * `mucDaCo` / `tomTatBoHoSo`, vì đó là **bảng kiểm bộ hồ sơ giao Kế toán**: nó liệt kê tờ nào có /
 * không có trong tay, không phải bảng nhắc việc. Hai câu hỏi khác nhau, đừng gộp.
 *
 * ⚠️ TỪ 16/09/2026 CHUYỆN NÀY NHÌN CÓ VẺ MÂU THUẪN — nói trước để không ai "chữa": hồ sơ khai
 * *"Không có Hợp đồng"* thì **đóng được** (Sếp 16/09) nhưng mục 3 vẫn mang dấu *"–"*. Đúng cả hai:
 * cửa đã mở vì có lời khai, còn trong tay thì thật sự không có tờ nào. Dòng ghi chú `ket_luan`
 * dưới mục 3 là chỗ nói ra sự thật đó, kèm tên người khai.
 */
export const LY_DO_KHONG_CO_HOP_DONG = "Không có HĐ";

/**
 * ★★ CHỮ HIỆN RA MÀN HÌNH CHO LỰA CHỌN TRÊN — Sếp 16/09/2026: *"Sửa ghi chú 'Không có HĐ' thành
 * 'Không có Hợp đồng'"*.
 *
 * 🔴🔴 VÌ SAO PHẢI TÁCH LÀM HAI HẰNG THAY VÌ SỬA THẲNG CHỮ Ở TRÊN — ĐÂY LÀ CHỖ SUÝT HỎNG DỮ LIỆU:
 * `LY_DO_KHONG_CO_HOP_DONG` **vừa là nhãn vừa là GIÁ TRỊ LƯU**. Chú thích ở ngay trên ghi rõ *"LƯU
 * ĐÚNG CHUỖI NHÃN, không lưu mã"*, và `daKhaiKhongCoHopDong` so sánh **thẳng chuỗi đó** với thứ đã
 * nằm trong `deNghi.lyDoThieuChungTu`. Sửa chữ ở đó là:
 *   · mọi hồ sơ đã chọn "Không có HĐ" từ 13/09/2026 tới nay **đọc ra không khớp nữa**,
 *   · app coi như họ **chưa khai gì cả**, và
 *   · không một lỗi nào báo — hỏng im lặng, đúng loại nguy nhất.
 *
 * ✅ Nên: **giá trị lưu giữ nguyên `"Không có HĐ"`**, chỉ đổi thứ VẼ RA. Hồ sơ cũ không mất trạng
 * thái, hồ sơ mới ghi cùng một giá trị với hồ sơ cũ — không sinh hai thế hệ dữ liệu.
 *
 * ⚠️ AI SAU NÀY MUỐN "DỌN CHO GỌN" BẰNG CÁCH GỘP LẠI MỘT HẰNG: đọc lại đoạn trên. Muốn giá trị lưu
 * thành mã sạch (vd `"khong_co_hop_dong"`) thì phải có bước chuyển dữ liệu cũ — đó là việc đụng kho
 * chung của cả phòng, phải xin Sếp duyệt riêng.
 *
 * 📌 Chỉ dùng hằng này ở chỗ HIỂN THỊ (nút chọn, câu ghi chú bước ⑧). Mọi phép SO SÁNH vẫn dùng
 * `LY_DO_KHONG_CO_HOP_DONG`.
 */
export const TEN_HIEN_LY_DO_KHONG_CO_HOP_DONG = "Không có Hợp đồng";

/** Chữ hiện ra màn hình cho một lựa chọn lý do — dùng ở MỌI nơi vẽ, để hai màn hình không nói khác nhau. */
export function tenHienLyDoThieuHopDong(lyDo: string): string {
  return lyDo === LY_DO_KHONG_CO_HOP_DONG ? TEN_HIEN_LY_DO_KHONG_CO_HOP_DONG : lyDo;
}

/**
 * ⚠️ THỨ TỰ TRONG MẢNG = THỨ TỰ HAI NÚT TRÊN MÀN HÌNH (`de-nghi-chi-tiet.tsx` map qua mảng này),
 * và đúng thứ tự trong ảnh Sếp gửi 13/09/2026. Đảo là đổi giao diện.
 */
export const LY_DO_THIEU_HOP_DONG_CHON: readonly string[] = [
  LY_DO_BO_SUNG_SAU,
  LY_DO_KHONG_CO_HOP_DONG,
];

/**
 * ★★★ KHÓA GHI LÝ DO CHƯA CÓ **ĐƠN MUA HÀNG NCC KÝ** — Sếp 16/09/2026: ***"Tách làm 2 mục
 * riêng"*** + ***"Làm tương tự như vậy cho bước 4"*** (tức mục 4 của bộ hồ sơ).
 *
 * 🔴 KHÓA RIÊNG, KHÔNG DÙNG CHUNG `KHOA_LY_DO_THIEU_HOP_DONG`. Trước 16/09/2026 hai mục dùng chung
 * một trường lý do nên trên màn hình chúng hiện **giống hệt nhau** — khai "Không có Hợp đồng" là
 * mục Đơn mua hàng cũng tự nhận câu đó. Nay mỗi mục khai độc lập.
 *
 * ⚠️ KHÔNG CÓ DỮ LIỆU CŨ Ở KHÓA NÀY, và đó là điều TỐT: hồ sơ cũ chỉ khai lý do cho hợp đồng, nên
 * sau khi tách mục 4 của chúng ở trạng thái `chua_khai` — đúng sự thật, không phải suy diễn hộ
 * người dùng rằng họ cũng muốn khai như vậy cho đơn mua hàng.
 */
export const KHOA_LY_DO_THIEU_DON_MUA_HANG = "dat_hang|don_mua_hang";

/**
 * ★★★ ĐƠN MUA HÀNG **CHỈ CÓ MỘT LỰA CHỌN: "Bổ sung sau"** — Sếp 16/09/2026, nguyên văn: ***"PO là
 * chắc chắn có, chỉ là bổ sung sau thôi. Kiểm tra lại và điều chỉnh"***.
 *
 * 🔴🔴 ĐÂY LÀ KHÁC BIỆT BẢN CHẤT GIỮA HAI CHỨNG TỪ, VÀ LÀ LÝ DO SẾP BẢO TÁCH CHÚNG RA:
 *   · **Hợp đồng** — có thể **thật sự không có** (đơn nhỏ, mua lẻ, mẫu PO-02 mà chính tờ đơn là
 *     thoả thuận). Nên *"Không có Hợp đồng"* là một **kết luận hợp lệ**, và từ 16/09/2026 nó đủ
 *     điều kiện đóng hồ sơ.
 *   · **Đơn mua hàng (PO)** — **LUÔN LUÔN PHẢI CÓ**, vì chính app sinh ra nó. Không bao giờ tồn tại
 *     ca *"đơn này không có PO"*; chỉ có ca **chưa đính bản NCC ký đóng mộc**, tức *"Bổ sung sau"*.
 *
 * 🔴 VÌ VẬY **KHÔNG CÓ HẰNG `LY_DO_KHONG_CO_DON_MUA_HANG`** — và đừng thêm vào. Bản dựng đầu ngày
 * 16/09/2026 có hằng đó (chép cho "đối xứng" với hợp đồng) và Sếp bắt đúng lỗi này: màn hình hiện
 * câu *"đơn này không có hợp đồng riêng, không phải thiếu sót"* ngay dưới mục **Đơn mua hàng** —
 * sai hoàn toàn với PO.
 *
 * ⚠️ HỆ QUẢ PHẢI GIỮ: mục 4 chưa có tệp thì **luôn báo đỏ**, không có trạng thái trung tính nào.
 * Mở một lời khai dứt điểm cho nó là mở đường đóng hồ sơ mà **không có chứng từ gốc của cả đơn
 * hàng** — xem `moCuaDongHoSo` và bài kiểm chiều nghịch trong `kiem-luat-dung-chung.mjs`.
 */
export const LY_DO_THIEU_DON_MUA_HANG_CHON: readonly string[] = [LY_DO_BO_SUNG_SAU];

/**
 * ★★★ MỘT MÔ TẢ DUY NHẤT CHO MỘT CHỨNG TỪ CÓ CƠ CHẾ KHAI LÝ DO — Sếp 16/09/2026.
 *
 * 🔴 VÌ SAO GOM THÀNH BẢNG THAY VÌ CHÉP ĐÔI MỌI HẰNG SỐ: sau khi tách, **bốn thứ** phải đi cùng
 * nhau cho mỗi chứng từ (khóa lưu lý do · tên chứng từ · chuỗi "không có" · chữ hiện ra). Để rời
 * bốn hằng rồi tra tay ở từng nơi vẽ là sớm muộn có chỗ tra khóa của hợp đồng mà in tên đơn mua
 * hàng — và không lỗi kiểu nào báo vì cả bốn đều là `string`.
 *
 * 📌 `bo-ho-so-thanh-toan.ts` → `KHOA_LY_DO_THIEU_THEO_MUC` tra thẳng vào bảng này theo **mã mục**,
 * nên thêm một chứng từ có lý do riêng thì khai ở đây một lần là đủ.
 */
export interface ChungTuCoLyDoThieu {
  /** Khóa lưu trong `DeNghiMuaHang.lyDoThieuChungTu`. */
  khoa: string;
  /** Tên chứng từ, dùng cho câu chữ và cho việc tra người khai trong nhật ký. */
  tenChungTu: string;
  /**
   * Chuỗi LƯU của lời khai dứt điểm "không có chứng từ này".
   *
   * 🔴 `null` NGHĨA LÀ **CHỨNG TỪ NÀY KHÔNG BAO GIỜ VẮNG MẶT HỢP LỆ** — không có lời khai dứt điểm
   * nào cả, chỉ có "đã có" hoặc "còn nợ". Đúng ca của **Đơn mua hàng**: Sếp 16/09/2026 — ***"PO là
   * chắc chắn có, chỉ là bổ sung sau thôi"***.
   *
   * ⚠️ `null` là một khẳng định nghiệp vụ, không phải "chưa khai xong". Đổi nó thành một chuỗi là
   * mở ra ca *"đơn này không có PO"* — chuyện không tồn tại — rồi mở luôn đường đóng hồ sơ mà thiếu
   * chứng từ gốc của cả đơn hàng.
   */
  lyDoKhongCo: string | null;
  /** Chữ HIỆN RA cho lời khai đó (có thể khác chuỗi lưu — xem cặp hợp đồng). `null` khi không có. */
  tenHienKhongCo: string | null;
  /** Hai lựa chọn hiện thành nút, đúng thứ tự trên màn hình. */
  cacLyDoChon: readonly string[];
  /**
   * ★★★ LỜI KHAI "không có <chứng từ này>" CÓ MỞ CỬA ĐÓNG HỒ SƠ KHÔNG.
   *
   * 🔴 CHỈ **HỢP ĐỒNG** = `true`, và chỉ vì Sếp nói đúng câu đó ngày 16/09/2026 (***"Đúng, là điều
   * kiện để đóng hồ sơ"***). Chốt thật nằm ở `vuongMacHoanThanhQuyTrinh`.
   *
   * 🔴 **ĐƠN MUA HÀNG = `false`, CÓ LÝ DO, ĐỪNG "SỬA CHO ĐỐI XỨNG"**: `vuongMacHoanThanhQuyTrinh`
   * **chưa bao giờ** đòi tệp đơn mua hàng NCC ký — không có chốt nào để mở. Bật cờ này lên `true`
   * mà không có chốt tương ứng là câu chữ **hứa một luật không tồn tại** (CLAUDE.md §3.5); còn
   * thêm chốt đó thì là **đặt ra một luật Sếp chưa duyệt**, và nó sẽ chặn hàng loạt hồ sơ đang
   * chạy. Muốn đổi thì hỏi Sếp trước.
   *
   * 📌 Cờ này CHỈ điều khiển CÂU CHỮ ở `bo-ho-so-thanh-toan.ts` → `loiKhaiThieuChungTu`. Nó không
   * tự chặn hay tự mở gì cả — để một chỗ duy nhất giữ luật, đúng nếp của cả tệp này.
   */
  moCuaDongHoSo: boolean;
}

export const CHUNG_TU_HOP_DONG: ChungTuCoLyDoThieu = {
  khoa: KHOA_LY_DO_THIEU_HOP_DONG,
  tenChungTu: TEN_HIEN_HOP_DONG,
  lyDoKhongCo: LY_DO_KHONG_CO_HOP_DONG,
  tenHienKhongCo: TEN_HIEN_LY_DO_KHONG_CO_HOP_DONG,
  cacLyDoChon: LY_DO_THIEU_HOP_DONG_CHON,
  moCuaDongHoSo: true,
};

export const CHUNG_TU_DON_MUA_HANG: ChungTuCoLyDoThieu = {
  khoa: KHOA_LY_DO_THIEU_DON_MUA_HANG,
  tenChungTu: TEN_HIEN_DON_MUA_HANG,
  /* 🔴🔴 `null` × 2 — Sếp 16/09/2026: ***"PO là chắc chắn có, chỉ là bổ sung sau thôi"***. Không có
     lời khai "không có PO", nên mục Đơn mua hàng chưa có tệp thì LUÔN báo đỏ. Đọc khối chú thích ở
     `LY_DO_THIEU_DON_MUA_HANG_CHON` trước khi định điền chuỗi vào đây. */
  lyDoKhongCo: null,
  tenHienKhongCo: null,
  cacLyDoChon: LY_DO_THIEU_DON_MUA_HANG_CHON,
  /* 🔴 `false` CÓ CHỦ Ý — đọc khối chú thích ở `moCuaDongHoSo` trước khi đổi. */
  moCuaDongHoSo: false,
};

/** Lý do đã ghi cho MỘT chứng từ bất kỳ. Chuỗi rỗng = chưa khai. */
export function lyDoThieuChungTuCua(deNghi: DeNghiMuaHang, ct: ChungTuCoLyDoThieu): string {
  return (deNghi.lyDoThieuChungTu?.[ct.khoa] ?? "").trim();
}

/**
 * ★★★ ĐÃ KHAI DỨT ĐIỂM "KHÔNG CÓ <chứng từ này>" CHƯA.
 *
 * 🔴🔴 HÀM NÀY NAY LÀ MỘT **ĐIỀU KIỆN ĐÓNG HỒ SƠ**, không còn chỉ là chuyện tô màu — xem
 * `vuongMacHoanThanhQuyTrinh`. Vì vậy nó phải **so BẰNG NHAU với đúng chuỗi đã khai**, tuyệt đối
 * không nới thành "có ghi lý do gì đó": nới ra là ai bỏ trống, ai bấm *"Bổ sung sau"*, ai gõ một
 * câu tự do cũng đóng được hồ sơ — tức **bỏ chốt**, không phải nới chốt.
 */
export function daKhaiKhongCoChungTu(deNghi: DeNghiMuaHang, ct: ChungTuCoLyDoThieu): boolean {
  /* 🔴 CHỨNG TỪ KHÔNG CÓ LỜI KHAI DỨT ĐIỂM (Đơn mua hàng) thì câu trả lời LUÔN là "chưa khai".
     Bỏ dòng này đi thì `lyDoThieuChungTuCua` trả "" và `ct.lyDoKhongCo` là `null` — hai thứ khác
     nhau nên vẫn `false`, nhưng đó là **đúng do may**, không do luật. Viết ra tường minh để ai đổi
     kiểu dữ liệu sau này không vô tình mở cửa. */
  if (ct.lyDoKhongCo === null) return false;
  return lyDoThieuChungTuCua(deNghi, ct) === ct.lyDoKhongCo;
}

/**
 * ★★ HỒ SƠ ĐÃ KHAI "KHÔNG CÓ HĐ" — Sếp 13/09/2026: *"Khi chọn vào nút 'Không có HĐ' thì mới ko
 * báo đỏ, còn nếu chọn nút 'Bổ sung sau' thì báo đỏ để nhắc việc"*.
 *
 * 🔴🔴 TỪ 16/09/2026 HÀM NÀY KHÔNG CÒN CHỈ LÀ CHUYỆN MÀU SẮC — nó là **điều kiện đóng hồ sơ**
 * (Sếp: ***"Đúng, là điều kiện để đóng hồ sơ"***). Sửa nó là sửa luật, không phải sửa giao diện.
 *
 * 🔴 MỘT CHỖ DUY NHẤT trả lời câu *"người dùng đã khai dứt điểm là không có hợp đồng chưa"*. BA
 * nơi đang hỏi:
 *   ① `thieuHopDongDaGhiLyDo` (ngay dưới) → viền/nền đỏ hộp "Lý do chưa có" ở trang chi tiết
 *   ② `mucConNoCuaBuoc` trong `giai-doan-mua-hang.ts` → viền đỏ khối bước, nhãn "Còn thiếu", và
 *      chữ "thiếu HĐ" trên thẻ kanban
 *   ③ `vuongMacHoanThanhQuyTrinh` (cuối tệp này) → **mở/khoá nút "Hoàn thành quy trình"** ← thêm
 *      16/09/2026, và đây là nơi nặng nhất
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
  return daKhaiKhongCoChungTu(deNghi, CHUNG_TU_HOP_DONG);
}

/**
 * ❌ CỐ Ý **KHÔNG CÓ** `daKhaiKhongCoDonMuaHang` — Sếp 16/09/2026: ***"PO là chắc chắn có, chỉ là
 * bổ sung sau thôi"***. Không tồn tại ca "đơn này không có PO", nên không có câu hỏi ấy để trả lời.
 * Bản dựng đầu ngày có hàm đó (chép cho đối xứng) và đã bị bỏ — xem
 * `LY_DO_THIEU_DON_MUA_HANG_CHON`.
 */

/**
 * ★★★ ĐÃ BỎ HẲN CÁI TÍCH "ĐÃ XỬ LÝ ỦY NHIỆM CHI" — Sếp 15/09/2026.
 *
 * Ở đây từng có hằng `VIEC_UNC_XONG = "unc_xong"` cùng hai hàm `daTichXongUNC` và
 * `vuongMacTichXongUNC`. Cả ba đã bị xóa, không phải lỡ tay:
 *
 * · **Luật cũ** — Ban lãnh đạo 23/08/2026: bước ⑧ có một việc BẮT BUỘC *"Đã xử lý ủy nhiệm chi
 *   (hoặc đơn này không cần)"*; chưa tích thì `vuongMacHoanThanhQuyTrinh` chặn đóng hồ sơ. Và
 *   Ban lãnh đạo 22/08/2026 thêm chốt *"bắt buộc phải hoàn thành bước 1 thì mới được tích hoàn
 *   thành"* — tức chưa có Hóa đơn VAT thì chưa tích được (đó là việc của `vuongMacTichXongUNC`).
 * · **Luật mới thay thế** — Sếp 15/09/2026, khoanh đỏ đúng khối đó trên bản chạy thật:
 *   ***"bỏ mục này, ko cần thiết"***, và sau khi được báo đây là việc bắt buộc chứ không phải
 *   ghi chú: ***"bỏ và thiết lập lại luật mới"***.
 *
 * 🔴 KHÔNG CÒN CÁI TÍCH THÌ KHÔNG CÒN GÌ ĐỂ CHẶN — nên xóa hẳn ba thứ đó thay vì để lại hàm không
 * ai gọi. Hàm mồ côi trong tệp này nguy hơn bình thường: người sau đọc thấy `vuongMacTichXongUNC`
 * sẽ tưởng luật còn sống và đi gọi lại, làm sống lại một chốt Sếp đã bỏ.
 *
 * ⚠️ HAI CHỐT KHÔNG ĐƯỢC NỚI THEO, đây là chỗ dễ sai nhất khi dọn: bước ⑧ **vẫn đòi đủ Hợp đồng
 * (`coHopDong`) và Hóa đơn VAT (`coHoaDonVAT` → `vuongMacDuyetHoanThanhDeNghi`)**. Sếp chỉ bỏ cái
 * tích, không bỏ chứng từ. Có bài kiểm máy khóa cả hai chiều trong `kiem-luat-dung-chung.mjs`.
 *
 * 📌 Ô đính kèm Ủy nhiệm chi và Phiếu chi ở trang chi tiết **VẪN CÒN**, vẫn là *"Nếu có"* —
 * xem `tepUNC` / `tepPhieuChi` ngay dưới. Bỏ cái tích không phải bỏ chỗ nộp tệp.
 *
 * 📌 Mã `"unc_xong"` nay chỉ còn sống ở một chỗ duy nhất: `MA_CONG_VIEC_DA_BO` trong
 * `2-quy-trinh/cau-hinh-quy-trinh.ts` — danh sách "bia mộ" dùng để lọc cấu hình cũ đã lưu trên
 * kho chung (bản lưu đó ĐANG mang `unc_xong`, đo được 15/09/2026).
 */

/** Tệp của một bước, lọc theo nhãn ghi chú. */
function tepTheoNhan(deNghi: DeNghiMuaHang, buoc: string, nhan: string): MoTaTep[] {
  const ds = deNghi.tepGiaiDoan?.[buoc] ?? [];
  /**
   * 🔴 NHẬN CẢ BẢN THỨ HAI TRỞ ĐI — Sếp báo lỗi 17/09/2026: ***"Trường này đang ko hoạt
   * động"***, khoanh đỏ nút *"+ Thêm bản nữa"* ở ô Hóa đơn VAT.
   *
   * ĐÃ ĐO RA GỐC: `OChungTuBatBuoc` đặt nhãn bản thứ hai là `"Hóa đơn VAT (2)"` (phải khác
   * nhãn bản đầu, vì `datTepVaoOGiaiDoan` tự gỡ bản cũ CÙNG NHÃN). Nhưng phép lọc này so
   * CHÍNH XÁC `=== nhan`, nên bản thứ hai **không bao giờ được nhận**: tệp đã lưu thật vào hồ sơ
   * mà màn hình không hiện gì — đúng loại lỗi `CLAUDE.md` §3.5 cấm.
   *
   * 🔴 VÀ NÓ KHÔNG CHỈ LÀ LỖI HIỂN THỊ: `coHoaDonVAT` dựa trên chính phép lọc này, nên đơn tách
   * cho hai nhà cung cấp (hai hoá đơn) mà bỏ bản đầu đi thì hồ sơ bị coi là **thiếu hoá đơn** dù đang
   * còn một bản — và không đóng được hồ sơ.
   *
   * ⚠️ VẪN KHÔNG NỚI THÀNH "CÓ CHỨA" — lý do cũ còn nguyên: ghi chú người dùng tự gõ
   * (*"chờ hóa đơn VAT bên A gửi"*) sẽ bị đếm thành chứng từ thật, và app báo đủ hồ sơ khi còn
   * thiếu. Chỉ nhận thêm **đúng một dạng**: nhãn + khoảng trắng + `(số)` ở cuối — đúng cái
   * `OChungTuBatBuoc` sinh ra, không hơn.
   */
  return ds.filter((t) => {
    const g = (t.ghiChu ?? "").trim();
    if (g === nhan) return true;
    if (!g.startsWith(`${nhan} (`) || !g.endsWith(")")) return false;
    return /^\d+$/.test(g.slice(nhan.length + 2, -1));
  });
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
 * ★★★ TỆP **ĐƠN MUA HÀNG NCC KÝ** NẰM Ở NGĂN RIÊNG — Sếp 16/09/2026 (*"Tách làm 2 mục riêng"*).
 *
 * 🔴 CHỈ ĐỌC NGĂN MỚI, KHÔNG GỘP NGĂN CHUNG CŨ — khác hẳn `tepHopDong` (hàm đó gộp hai khóa vì
 * bước từng bị dời thật). Gộp ở đây là **mọi hồ sơ có hợp đồng tự nhiên cũng "có đơn mua hàng"**,
 * tức phép tách vừa làm thành vô nghĩa ngay tại hàm đọc.
 *
 * 📌 Việc *"tệp chung cũ vẫn phải hiện ở mục 4"* là luật của **BỘ HỒ SƠ**, không phải của hàm đọc
 * này — nó nằm ở `bo-ho-so-thanh-toan.ts` → `tepDonMuaHangCuaMuc4`, một chỗ duy nhất, có bài kiểm
 * máy canh cả hai chiều. Đừng kéo nó xuống đây.
 *
 * 📌 Ngăn riêng nên cũng là ngăn **sửa được**: `OChungTuBatBuoc` xoá tệp bằng `maGiaiDoan` cố định,
 * mà ở đây chỉ có đúng một khóa — không có cảnh "bày tệp khóa cũ rồi xoá báo sai" như `tepHopDong`
 * / `tepHopDongSuaDuoc` phải tách đôi.
 */
export function tepDonMuaHangNCCKy(deNghi: DeNghiMuaHang): MoTaTep[] {
  return tepTheoNhan(deNghi, BUOC_DINH_KEM_DON_MUA_HANG, NHAN_TEP_DON_MUA_HANG);
}

export function coDonMuaHangNCCKy(deNghi: DeNghiMuaHang): boolean {
  return tepDonMuaHangNCCKy(deNghi).length > 0;
}

/**
 * ★★ TỆP CỦA MỤC 9 *Đính kèm khác* — Sếp 16/09/2026: ***"Cần thiết mở thêm để đính kèm tài liệu
 * khác"***.
 *
 * 🔴 KHÔNG LỌC NHÃN — lấy TẤT CẢ tệp trong ngăn riêng. Mục 9 là chỗ để tài liệu không thuộc tám
 * mục kia (CO/CQ, biên bản nghiệm thu, thư xác nhận…), nên đòi nhãn là đòi người dùng gõ đúng một
 * chữ họ không biết trước, rồi tệp họ đính lặng lẽ không hiện ra ở đâu cả.
 *
 * ⚠️ AN TOÀN VÌ NGĂN RIÊNG: không một chứng từ bắt buộc nào nằm trong `BUOC_DINH_KEM_KHAC`, nên
 * lấy hết cũng không thể lôi nhầm Hoá đơn VAT / UNC / Phiếu chi vào đây — xem khối cảnh báo ở chỗ
 * khai hằng số đó.
 */
export function tepDinhKemKhac(deNghi: DeNghiMuaHang): MoTaTep[] {
  return deNghi.tepGiaiDoan?.[BUOC_DINH_KEM_KHAC] ?? [];
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

/**
 * ★★ CÁC TỆP PHIẾU GIAO HÀNG của nhánh hồ sơ phòng ban — Sếp 14/09/2026.
 *
 * 🔴 SO NHÃN THEO **TIỀN TỐ**, KHÔNG SO BẰNG NHAU — đây là chỗ khác `tepTheoNhan` và khác có chủ ý.
 * `OChungTuBatBuoc` đặt tên bản thứ hai trở đi là `"<nhãn> (2)"`, `"<nhãn> (3)"`… (xem hàm `luu`
 * trong `o-chung-tu-bat-buoc.tsx`). Mà **mỗi lần giao là một tờ phiếu riêng** — đúng tinh thần luật
 * 11/08/2026 — nên hồ sơ phòng ban có nhiều bản là chuyện thường. So bằng nhau thì bản `(2)` không
 * được đếm; gỡ mất bản đầu là hồ sơ còn đủ phiếu mà app vẫn báo thiếu.
 *
 * ⚠️ CÁI GIÁ CỦA TIỀN TỐ, NÓI TRƯỚC: ghi chú tự gõ kiểu *"Phiếu giao hàng bên A hẹn gửi sau"* cũng
 * lọt. Chấp nhận, vì ở đây người gõ chính là người chịu trách nhiệm đính (nhân viên mua hàng), và
 * cái giá ngược lại nặng hơn nhiều — so bằng nhau là hồ sơ có đủ phiếu vẫn kẹt, tức đẻ lại đúng ca
 * kẹt mà nhánh này sinh ra để gỡ. 📌 Ba ô chứng từ kia vẫn so BẰNG NHAU (`tepTheoNhan`) vì chúng
 * đều chỉ cần MỘT bản, không có chuyện đánh số.
 *
 * 📌 Chỉ đọc MỘT khóa `nhan_hang`, không gộp khóa cũ nào: ô này mới có từ 15/09/2026 nên không có
 * dữ liệu cũ nằm ở khóa khác (khác hẳn `tepHopDong` / `tepHoaDonVAT` — hai hàm đó gộp khóa cũ vì
 * bước từng bị dời thật).
 */
export function tepPhieuGiaoHangPhongBan(deNghi: DeNghiMuaHang): MoTaTep[] {
  const ds = deNghi.tepGiaiDoan?.[BUOC_DINH_KEM_PHIEU_GIAO_HANG] ?? [];
  return ds.filter((t) => (t.ghiChu ?? "").trim().startsWith(NHAN_TEP_PHIEU_GIAO_HANG));
}

/**
 * Hồ sơ đã có ít nhất một tờ phiếu giao hàng do nhân viên mua hàng đính chưa.
 *
 * 🔴 HÀM NÀY KHÔNG TỰ HỎI `laHoSoPhongBan`. Nó chỉ trả lời đúng một câu *"có tệp hay không"*; việc
 * quyết định **ai bị hỏi câu này** nằm ở `vuongMacHoanThanhQuyTrinh`. Nhét phép nhận diện vào đây
 * là có hai chỗ cùng quyết định phạm vi, rồi sớm muộn lệch nhau — đúng kiểu lỗi mà cả tệp này sinh
 * ra để tránh (xem khối chú thích đầu tệp).
 */
export function coPhieuGiaoHangPhongBan(deNghi: DeNghiMuaHang): boolean {
  return tepPhieuGiaoHangPhongBan(deNghi).length > 0;
}

/**
 * ★ QUY TRÌNH NHÂN SỰ KHÔNG CẦN HỢP ĐỒNG VÀ HOÁ ĐƠN — Sếp 26/09/2026: *"Quy trình nhân sự cũng sẽ
 * giống xuất kho, sẽ tới bước lập PO rồi chạy tiếp theo quy trình hiện tại nhưng sẽ khác ở hồ sơ
 * thanh toán, là ko cần hợp đồng và hoá đơn, vì hàng có sẵn trong kho"*.
 *
 * 🔴 MỘT CHỖ DUY NHẤT trả lời câu này — mọi nơi đòi Hợp đồng / Hoá đơn VAT hỏi hàm này trước
 * (chặn chuyển bước, dấu "Thiếu hợp đồng" trên thẻ, bộ hồ sơ thanh toán, nút Hoàn thành quy trình).
 *
 * ★ XUẤT KHO CŨNG VẬY — Sếp 26/09/2026 trả lời câu hỏi: *"Đúng, xuất kho thì ko cần hợp đồng và hoá
 * đơn"*. Nên áp cho cả `nhan_su` lẫn `xuat_kho`.
 *
 * 📌 ĐÒI MỌI DÒNG ĐỀU LÀ VIỆC LẤY TỪ KHO (`nhan_su` / `xuat_kho`). Phiếu lẫn dòng mua ngoài vẫn phải
 * đủ hợp đồng + hoá đơn — nới cả phiếu vì một dòng là đóng được hồ sơ mua ngoài không chứng từ.
 */
export function khongCanHopDongHoaDon(deNghi: DeNghiMuaHang): boolean {
  /* 🔴 (26/09/2026, Sếp: *"xuất kho thì ko cần báo giá… và cả mục hoá đơn nữa"*) CHỈ XÉT DÒNG CÒN
     LÀM VIỆC: dòng đã tách sang phiếu con bị xoá cả người phụ trách lẫn loại việc trên phiếu gốc
     (`apDungGiaoViec`) — xét cả nó thì phiếu gốc còn toàn dòng xuất kho vẫn bị đòi hoá đơn. Dòng
     mua ngoài luôn có người phụ trách khi tới các bước đòi chứng từ nên vẫn bị bắt. */
  const ds = (deNghi.items ?? []).filter((d) => d.nguoiPhuTrachUid || d.loaiViecGiao);
  return (
    ds.length > 0 && ds.every((d) => d.loaiViecGiao === "nhan_su" || d.loaiViecGiao === "xuat_kho")
  );
}

export function coHopDong(deNghi: DeNghiMuaHang): boolean {
  return tepHopDong(deNghi).length > 0;
}
export function coHoaDonVAT(deNghi: DeNghiMuaHang): boolean {
  return tepHoaDonVAT(deNghi).length > 0;
}

/** Lý do người dùng đã ghi cho việc chưa đính kèm hợp đồng. Chuỗi rỗng = chưa ghi. */
export function lyDoThieuHopDong(deNghi: DeNghiMuaHang): string {
  return (deNghi.lyDoThieuChungTu?.[KHOA_LY_DO_THIEU_HOP_DONG] ?? "").trim();
}

/**
 * Lý do đã ghi cho việc chưa có **bản đơn mua hàng NCC ký**. Chuỗi rỗng = chưa ghi.
 *
 * 📌 Chỉ có thể là `LY_DO_BO_SUNG_SAU` (hoặc rỗng) — xem `LY_DO_THIEU_DON_MUA_HANG_CHON`.
 */
export function lyDoThieuDonMuaHang(deNghi: DeNghiMuaHang): string {
  return lyDoThieuChungTuCua(deNghi, CHUNG_TU_DON_MUA_HANG);
}

/**
 * ★★★ CÂU GHI VÀO NHẬT KÝ khi người dùng khai lý do chưa có một chứng từ — **MỘT NGUỒN CHỮ DUY
 * NHẤT cho cả bên GHI lẫn bên ĐỌC** (Sếp 16/09/2026).
 *
 * 🔴 VÌ SAO PHẢI LÀ HÀM CHỨ KHÔNG PHẢI CHUỖI GÕ TAY Ở HAI NƠI: `kho-du-lieu.tsx` ghi câu này vào
 * `lichSu`, còn `nguoiKhaiKhongCoChungTu` (ngay dưới) **đọc ngược lại** để tra ra ai đã khai. Hai
 * chỗ gõ tay hai câu là chỗ đọc không bao giờ khớp chỗ ghi, và nó hỏng **im lặng** — màn hình chỉ
 * mất chữ "(do … khai)", không lỗi nào báo.
 *
 * 🔴 CÓ TÊN CHỨNG TỪ TRONG CÂU LÀ BẮT BUỘC TỪ 16/09/2026. Trước hôm nay app dùng CHUNG một trường
 * lý do cho Hợp đồng và Đơn mua hàng nên câu nhật ký không cần phân biệt. Nay hai mục khai độc lập
 * mà câu nhật ký lại giống hệt nhau thì không cách nào biết dòng đó nói về chứng từ nào.
 */
export function cauNhatKyGhiLyDoThieu(tenChungTu: string, lyDo: string): string {
  return lyDo === ""
    ? `Xóa lý do chưa có chứng từ bắt buộc (${tenChungTu})`
    : `Ghi lý do chưa có chứng từ bắt buộc (${tenChungTu}): ${lyDo}`;
}

/**
 * ★★★ AI ĐÃ KHAI "KHÔNG CÓ <chứng từ>" — `null` nghĩa là **không tra được**, không phải "không ai".
 *
 * ★ Sếp 16/09/2026, nguyên văn: ***"Đúng, là điều kiện để đóng hồ sơ, nhưng phải có ghi chú và
 * được link xuống mục 8"***. Lời khai nay **mở cửa đóng hồ sơ**, nên bộ hồ sơ giao Kế toán phải nói
 * rõ đây là *khai báo của người dùng*, và nếu tra được thì **ai** đã khai.
 *
 * 🔴 TRẢ `null` THAY VÌ ĐOÁN BỪA — đây là chỗ dễ làm sai nhất. Hai ca trả `null`, cả hai đều thật:
 *   · **Hồ sơ khai TRƯỚC 16/09/2026** — nhật ký hồi đó ghi câu KHÔNG có tên chứng từ
 *     (*"Ghi lý do chưa có chứng từ bắt buộc: Không có HĐ"*), mà hồi đó Hợp đồng và Đơn mua hàng
 *     **dùng chung một trường lý do**, nên gán câu ấy cho một trong hai mục là **đoán**. Ghi sai
 *     tên người vào bộ hồ sơ giao Kế toán nặng hơn hẳn việc không ghi tên ai.
 *   · Nhật ký đã bị cắt bớt, hoặc hồ sơ nhân bản (`nhanBanDeNghi` không chép nhật ký của bản gốc).
 *
 * 📌 LẤY MỐC MỚI NHẤT (duyệt ngược): người dùng có thể bấm đi bấm lại — bỏ chọn rồi chọn lại. Người
 * chịu trách nhiệm là người khai **lần cuối**, không phải lần đầu.
 */
export function nguoiKhaiKhongCoChungTu(
  deNghi: DeNghiMuaHang,
  ct: ChungTuCoLyDoThieu,
): string | null {
  /* Chứng từ không có lời khai dứt điểm thì không có gì để tra người khai. */
  if (ct.lyDoKhongCo === null) return null;
  const cau = cauNhatKyGhiLyDoThieu(ct.tenChungTu, ct.lyDoKhongCo);
  /* ⚠️ `?? []` LÀ CỐ Ý dù kiểu khai `lichSu` là bắt buộc: hàm này chạy cả trên **dữ liệu đã lưu
     trên kho chung** (hồ sơ cũ có thể thiếu trường) và trong `kiem-luat-dung-chung.mjs` (dữ liệu
     dựng tay). Ném lỗi ở tầng hàm thuần là cả khối bộ hồ sơ trắng màn, chỉ vì một cái tên không
     tra ra. */
  const ds = deNghi.lichSu ?? [];
  for (let i = ds.length - 1; i >= 0; i -= 1) {
    const moc = ds[i];
    if (moc.hanhDong === cau) return moc.nguoiThucHien.trim() || null;
  }
  return null;
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
  if (coHopDong(deNghi) || khongCanHopDongHoaDon(deNghi)) return false;
  /* Khai "Không có HĐ" là chốt dứt điểm, không phải việc còn treo → thôi đỏ. */
  if (daKhaiKhongCoHopDong(deNghi)) return false;
  return lyDoThieuHopDong(deNghi) !== "";
}

/**
 * ★★★ CÂU NHẮC "CÒN NỢ CHỨNG TỪ" — MỘT NGUỒN CHỮ DUY NHẤT CHO MỌI MÀN HÌNH.
 *
 * ★ Sếp 16/09/2026, hai chỉ đạo cùng ngày và cùng một trạng thái:
 *   ① *"Nếu chọn 'Bổ sung sau' thì xuống mục 8 phải báo đỏ để nhắc đính kèm file"*
 *   ② *"Ở bước Lập đơn mua hàng, thêm nút chọn 'Bổ sung sau' và phải báo đỏ để nhắc"*
 *
 * 🔴 VÌ SAO PHẢI LÀ MỘT HÀM CHỨ KHÔNG PHẢI HAI CÂU GÕ TAY: cùng một trạng thái nay hiện ở **hai
 * màn hình** (hộp "Lý do chưa có" ở bước ④, và mục 3/4 của bộ hồ sơ ở bước ⑧). Gõ hai câu là sớm
 * muộn hai nơi nói khác nhau về cùng một việc — đúng tiền lệ đã phải sửa ở `NHAN_BUOC_KHONG_HAN`.
 *
 * 🔴 IN RA **ĐÚNG CHUỖI ĐANG LƯU** (`lyDo`), không viết cứng "Bổ sung sau": hồ sơ cũ gõ lý do tự
 * do (trước 13/09/2026) cũng đi qua đây, và người đọc phải thấy đúng chữ mình đã ghi.
 */
export function cauNhacConNoChungTu(lyDo: string): string {
  return `Lý do chưa có: “${lyDo}” — còn nợ chứng từ, phải đính kèm tệp vào hồ sơ.`;
}

/**
 * ★ Câu nhắc cho ô Hợp đồng ở bước ④ — `null` nghĩa là không có gì phải nhắc.
 *
 * 🔴 ĐÂY LÀ LỜI NHẮC, KHÔNG PHẢI CHỐT CHẶN (Sếp 16/09/2026: *"báo đỏ để nhắc"*). Nó KHÔNG được
 * gọi ở `vuongMacRoiBuocLapDon` / `vuongMacLapDonHang` và không đổi điều kiện lập đơn một dòng
 * nào: chọn "Bổ sung sau" vẫn lập được đơn y như trước, chỉ thêm dấu đỏ và câu chữ.
 *
 * 📌 Dùng lại nguyên `thieuHopDongDaGhiLyDo` — cùng cờ đang tô nền đỏ cho hộp đó. Nhờ vậy màu và
 * chữ **không thể lệch nhau**: hết đỏ thì câu cũng biến mất, và ngược lại.
 */
export function cauNhacConNoHopDong(deNghi: DeNghiMuaHang): string | null {
  if (!thieuHopDongDaGhiLyDo(deNghi)) return null;
  return cauNhacConNoChungTu(lyDoThieuHopDong(deNghi));
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
  if (coHopDong(deNghi) || khongCanHopDongHoaDon(deNghi)) return null;
  if (lyDoThieuHopDong(deNghi) !== "") return null;
  /* 📌 Câu chỉ về bước ④ "Lập đơn mua hàng" — nơi ô đính kèm hợp đồng đã quay lại (Ban lãnh đạo
     26/08/2026). Chỉ sai chỗ là người dùng đi tìm ô ở khối không có nó; đã từng xảy ra khi ô dời
     sang ⑤ mà câu này còn chỉ về ④. */
  return `Chưa đính kèm ${TEN_HIEN_HOP_DONG}, và cũng chưa ghi lý do chưa có. Làm một trong hai việc đó ở khối kết quả của bước Lập đơn mua hàng.`;
}

/**
 * ★★ ĐÃ RỜI ĐƯỢC BƯỚC ⑤ "Tiến hành đặt hàng" CHƯA — `null` là rời được.
 *
 * Sếp 16/09/2026, nguyên văn trên ảnh chụp bước ⑤: ***"Điều kiện để chuyển bước 5 sang 6: Phải
 * đính kèm file PO ký đóng mộc hoặc phải bấm tích chọn 'Bổ sung sau'"***, kèm một câu trước đó:
 * *"khi chọn này rồi thì chuyển bước này sang bước tiếp theo"*.
 *
 * 🔴 VÌ SAO CẦN: trước hôm nay bước ⑥ chỉ mở khi **đã có phiếu nhận hàng** (`xacDinhGiaiDoan`).
 * Nên người thu mua đặt hàng xong, đính bản đơn nhà cung cấp ký — phần việc của họ đã hết — mà
 * thẻ vẫn nằm ở ⑤ đội dòng đỏ *"Còn 1/1 dòng chưa nhận đủ hàng"*, một việc họ không làm gì được.
 * Thẻ chỉ rời ⑤ khi Kho gửi phiếu, tức **chờ người khác làm mới xong bước của mình**.
 *
 * 📌 CÙNG KHUÔN với `vuongMacRoiBuocLapDon` ngay trên (tệp HOẶC lý do), cố ý: hai bước liền nhau
 * mà đòi kiểu khác nhau thì người dùng không đoán được app muốn gì.
 *
 * 🔴 MỘT CHỖ DUY NHẤT trả lời câu *"đã rời được bước ⑤ chưa"*. `xacDinhGiaiDoan` gọi vào đây, chứ
 * không tự so `tepDonMuaHangNCCKy` tại chỗ — đúng bài học đã ghi ở `vuongMacRoiBuocLapDon`: hai
 * nơi cùng trả lời một câu hỏi thì sớm muộn nói khác nhau, và lúc đó **thẻ đứng im mà không một
 * dòng lỗi nào báo**.
 *
 * ⚠️ "Bổ sung sau" KHÔNG xoá món nợ. Nó chỉ cho thẻ đi tiếp; mục 4 của bộ hồ sơ thanh toán vẫn
 * **báo đỏ** cho tới khi có tệp thật (`CHUNG_TU_DON_MUA_HANG.lyDoKhongCo = null` — Sếp:
 * *"PO là chắc chắn có, chỉ là bổ sung sau thôi"*). Nợ chuyển theo chứng từ, không biến mất.
 */
export function vuongMacRoiBuocDatHang(deNghi: DeNghiMuaHang): string | null {
  if (tepDonMuaHangNCCKy(deNghi).length > 0) return null;
  if (lyDoThieuChungTuCua(deNghi, CHUNG_TU_DON_MUA_HANG).trim() !== "") return null;
  return `Chưa đính kèm ${TEN_HIEN_DON_MUA_HANG} (bản nhà cung cấp ký, đóng mộc), và cũng chưa bấm "Bổ sung sau". Làm một trong hai việc đó ở khối Tiến hành đặt hàng.`;
}

/* ② ĐÃ XÓA `vuongMacTichXongUNC` — Sếp 15/09/2026 bỏ cái tích mà nó canh. Lý do đầy đủ ở khối
   chú thích ★★★ phía trên (chỗ `VIEC_UNC_XONG` cũ). */

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
  if (coHoaDonVAT(deNghi) || khongCanHopDongHoaDon(deNghi)) return null;
  return "Chưa đính kèm Hóa đơn VAT ở bước Hóa đơn VAT — bắt buộc phải có mới duyệt hoàn thành được.";
}

/**
 * ★★ HỒ SƠ ĐÃ CHỐT XONG CHƯA — dùng để hỏi *"bản con còn dở không"* (Sếp 15/09/2026).
 *
 * 🔴 HAI trạng thái tính là XONG, không phải một:
 *   · `hoan_thanh` — mua xong, đóng hồ sơ.
 *   · `dong_do`    — **kết luận nghiệp vụ: không mua nữa**, đã ghi lý do thất bại (xem
 *     `dongDoDeNghi` trong `kho-du-lieu.tsx`). Việc trên bản con đó đã hết, không ai làm tiếp.
 *
 * 🔴 BỎ SÓT `dong_do` LÀ ĐẺ RA MỘT NGÕ CỤT MỚI: bản con bị đóng dở thì **vĩnh viễn** không bao giờ
 * sang `hoan_thanh` được nữa (đường duy nhất tới đó là `hoanThanhQuyTrinh`, mà hàm đó từ chối ngay
 * hồ sơ `dong_do`). Chỉ nhận mỗi `hoan_thanh` là phiếu gốc kẹt mãi mãi vì một bản con đã có kết
 * luận rõ ràng — đúng loại lỗi "chốt kiểm soát hoá ngõ cụt" mà nhánh phòng ban vừa phải gỡ ở ngay
 * hàm dưới.
 *
 * ⚠️ `luuTru` KHÔNG tính là xong, cố ý. Lưu trữ chỉ là **dọn bảng cho đỡ rối**, trạng thái hồ sơ
 * giữ nguyên (xem `DeNghiMuaHang.luuTru`). Cho nó qua là mở một cửa né chốt bằng đúng một cú bấm:
 * lưu trữ bản con rồi đóng phiếu gốc. Cái giá đã biết: bản con đang ẩn khỏi bảng vẫn chặn phiếu
 * gốc — nên câu chặn ở dưới **đọc tên mã ra**, để người dùng tìm được nó mà bỏ lưu trữ.
 */
export function hoSoDaChotXong(deNghi: DeNghiMuaHang): boolean {
  return deNghi.trangThai === "hoan_thanh" || deNghi.trangThai === "dong_do";
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
 * ★★ ĐIỀU KIỆN ĐỨNG ĐẦU THÊM 15/09/2026: còn bản con (nhân bản / tách theo phân công) chưa xong
 * thì chưa đóng được phiếu gốc — Sếp: ***"e làm đúng ý rồi"***. Lý do đầy đủ ở ngay chỗ kiểm; nó
 * phải đứng trước vì bốn chốt kia chỉ nhìn phần việc còn lại của RIÊNG phiếu này, mà phần đã nhân
 * bản đi thì theo chốt của Sếp là "không cần mua" nên không chốt nào thấy.
 *
 * ★★★ TRƯỚC 15/09/2026 CÓ SÁU ĐIỀU KIỆN — chốt thứ sáu là *"đã tích xong việc Đã xử lý ủy nhiệm
 * chi"* (Ban lãnh đạo 23/08/2026). Sếp 15/09/2026 bỏ hẳn cái tích đó (*"bỏ mục này, ko cần
 * thiết"* → *"bỏ và thiết lập lại luật mới"*), nên chốt ấy cũng đi theo. **Không phải ai đó lỡ
 * tay xóa** — xem khối ★★★ ở đầu tệp và `MA_CONG_VIEC_DA_BO` trong `cau-hinh-quy-trinh.ts`.
 *
 * ⚠️ Nhận `tienDo` từ nơi gọi chứ không tự tính: luật đối chiếu khối lượng chỉ được có MỘT chỗ
 * (`tinh-toan.ts` → `tinhTienDoDeNghi`). Hai chỗ cùng cộng là sớm muộn lệch nhau.
 *
 * ★★ TỪ 15/09/2026 ĐIỀU KIỆN THỨ HAI RẼ LÀM HAI NHÁNH (Sếp 14/09/2026): hồ sơ CÔNG TRÌNH giữ
 * nguyên phép đòi nhận đủ khối lượng; hồ sơ PHÒNG BAN đổi sang đòi tệp phiếu giao hàng do nhân
 * viên mua hàng đính. Ba điều kiện còn lại (chưa lên đơn · hợp đồng · hóa đơn VAT) **áp y hệt cho
 * cả hai loại**, không nhánh nào được nới. Xem khối chú thích tại chỗ rẽ.
 */
export function vuongMacHoanThanhQuyTrinh(
  deNghi: DeNghiMuaHang,
  /**
   * ⚠️ `stt` TÙY CHỌN, thêm 17/09/2026. Nơi gọi thật luôn truyền `TienDoDongDeNghi[]` (có `stt`),
   * còn `kiem-luat-dung-chung.mjs` dựng mảng tay chỉ hai con số — đòi `stt` bắt buộc là mọi bài
   * kiểm cũ gãy cùng lúc. Dòng thiếu `stt` được GIỮ LẠI, không phải bỏ đi (xem `locTienDoConPhaiMua`).
   */
  tienDo: { stt?: number; khoiLuongChuaLenPO: number; khoiLuongConLai: number }[],
  /**
   * ★★ TOÀN BỘ đề nghị đang có — **THÊM 15/09/2026, THAM SỐ TÙY CHỌN, ĐỨNG CUỐI**.
   *
   * 🔴 VÌ SAO TÙY CHỌN VÀ VÌ SAO PHẢI ĐỨNG CUỐI: hàm này có nhiều nơi gọi (nút trên
   * `de-nghi-chi-tiet.tsx`, tầng ghi trong `kho-du-lieu.tsx`, và `kiem-luat-dung-chung.mjs` gọi
   * THẬT). Chen tham số vào giữa hoặc bắt buộc là mọi nơi gọi cũ gãy cùng lúc.
   *
   * 🔴 THIẾU THAM SỐ THÌ **KHÔNG CHẶN**, tuyệt đối không chặn mù. Nơi gọi chưa cập nhật mà đã chặn
   * là kẹt hàng loạt hồ sơ chẳng liên quan gì tới nhân bản — đổi một lỗ hổng lấy một sự cố nặng
   * hơn nhiều. Chốt thật nằm ở tầng ghi (`hoanThanhQuyTrinh` trong `kho-du-lieu.tsx`), nơi có sẵn
   * `deNghiRef.current`; nút bấm chỉ là lớp nhắc.
   */
  tatCaDeNghi?: DeNghiMuaHang[],
): string | null {
  /**
   * ★★ ① CÒN BẢN CON CHƯA XONG THÌ KHÔNG ĐÓNG ĐƯỢC PHIẾU GỐC — Sếp chốt 15/09/2026.
   *
   * Sếp yêu cầu làm mờ các dòng đã nhân bản đi *"để ko bị quên"*, và chốt tiếp rằng phiếu gốc
   * **không cần mua** phần đã nhân bản. Khi được báo hệ quả — *"nhân bản hết mọi dòng thì phiếu gốc
   * thành 'không còn gì phải mua' và đóng lại được ngay trong khi chưa mua gì cả"* — và được đề
   * nghị chặn đóng phiếu gốc khi còn bản copy chưa xong, Sếp trả lời: ***"e làm đúng ý rồi"***.
   *
   * 🔴 VÌ SAO PHẢI ĐỨNG **TRƯỚC MỌI PHÉP KIỂM KHÁC**: bốn chốt dưới đây đều hỏi về khối lượng và
   * chứng từ **của riêng phiếu này**. Phiếu gốc đã nhân bản hết dòng đi thì theo đúng chữ Sếp
   * (*"không cần mua"*) nó không còn vướng gì cả — mọi chốt dưới đều xanh, và hồ sơ đóng lại trong
   * khi việc mua thật sự nằm nguyên ở các bản con chưa ai làm xong. Đặt xuống dưới là câu chặn
   * đầu tiên người dùng đọc được lại nói về hoá đơn hay khối lượng, chẳng dính gì tới việc đang kẹt.
   *
   * 📌 ÁP CHO CẢ HAI ĐƯỜNG SINH BẢN CON, cố ý: `cacBanTachCua` lọc theo `deNghiGocId` nên gom cả
   * bản do người dùng **nhân bản tay** (`nhanBanDeNghi`) lẫn bản do app **tự tách theo phân công**
   * (`tachTheoPhanBo`). Hai đường khác nhau ở chỗ có cắt dòng khỏi phiếu gốc hay không, nhưng câu
   * hỏi nghiệp vụ thì y hệt: *đề xuất lớn đã xong hết các phần chưa*. Lọc riêng một đường là đường
   * kia thành lối né.
   *
   * 📌 LIỆT KÊ ĐỦ MỌI MÃ, không rút gọn thành con số — cùng lý do đã ghi ở `ghiChuDaNhanBan`
   * (`nhan-ban-de-nghi.ts`): cả tính năng này sinh ra *"để không bị quên"*, giấu bớt một bản là đi
   * ngược đúng mục đích đó. Sếp đã được hỏi và chọn cách liệt kê đủ.
   *
   * ⚠️ KHÔNG chặn theo chiều ngược lại (bản con không bị phiếu gốc chặn). Bản con là phần việc độc
   * lập của một người, đóng xong lúc nào là quyền của họ; bắt chờ phiếu gốc là dựng vòng tròn.
   */
  if (tatCaDeNghi) {
    /* ★ Sếp 26/09/2026 (nhân bản theo NCC, mục (4)): nhìn CẢ CÂY hậu duệ (`hauDueCua` = hợp của
       `cacBanTachCua` theo `deNghiGocId` và `cayHauDue` theo `deNghiChaId`). Trước đây chỉ lọc
       `deNghiGocId`, nên phiếu con giao việc `…__A` không thấy bản A nhân bản tiếp theo NCC (bản cháu
       mang `deNghiGocId` = phiếu gốc) → `…__A` đóng được trong khi phần tách đi còn đang mua. */
    const conDangDo = hauDueCua(deNghi.id, tatCaDeNghi).filter((c) => !hoSoDaChotXong(c));
    if (conDangDo.length > 0) {
      return `Phiếu này đã tách ra ${conDangDo.length} hồ sơ con còn dở: ${conDangDo
        .map((c) => c.code)
        .join(", ")}. Xong hết các hồ sơ đó rồi mới đóng được phiếu gốc — phần vật tư đã nhân bản đi vẫn đang được mua ở đấy.`;
    }
  }

  if (tienDo.length === 0) {
    return "Phiếu đề nghị này chưa có mặt hàng nào để hoàn thành.";
  }

  /**
   * ★★ ② BỎ DÒNG ĐÃ NHÂN BẢN ĐI KHỎI HAI PHÉP ĐẾM KHỐI LƯỢNG — Sếp 17/09/2026.
   *
   * Sếp chốt 15/09: phần đã nhân bản đi thì phiếu gốc *"không cần mua"*. Nhưng hai chốt dưới
   * (`chuaLenDon`, `chuaVeDu`) vẫn đếm trên cả những dòng đó, nên phiếu gốc đã giao việc đi
   * **không bao giờ bấm hoàn thành được** — người giữ phiếu gốc không sai gì mà hồ sơ kẹt.
   *
   * 🔴 ĐẶT SAU CHỐT ① LÀ BẮT BUỘC, ĐỪNG ĐẢO. Chốt ① ("còn bản con dở") mới là thứ giữ cho phiếu
   * gốc không đóng sớm. Trừ dòng trước khi hỏi ① là mở đúng lỗ hổng mà ① sinh ra để bịt.
   *
   * 🔴 VÀ ĐẶT SAU `tienDo.length === 0` cũng là cố ý: câu đó nói về **phiếu không có mặt hàng
   * nào** — hồ sơ hỏng. Phiếu đã nhân bản đi hết dòng thì mảng lọc rỗng nhưng phiếu KHÔNG hỏng,
   * nó chỉ đã giao hết việc; lúc đó chốt ① đã trả lời xong và hai phép đếm dưới đều bằng 0, tức
   * đóng được — đúng ý Sếp.
   */
  const conPhaiMua = locTienDoConPhaiMua(deNghi, tatCaDeNghi, tienDo);

  const chuaLenDon = conPhaiMua.filter((d) => d.khoiLuongChuaLenPO > 0).length;
  if (chuaLenDon > 0) {
    return `Còn ${chuaLenDon} mặt hàng chưa lên đơn hàng. Đóng hồ sơ lúc này là bỏ rơi phần vật tư chưa ai mua.`;
  }

  /**
   * ★★ NHÁNH RIÊNG CHO HỒ SƠ PHÒNG BAN — Sếp 14/09/2026, nguyên văn: *"Các đề xuất từ phòng ban
   * thì sẽ đi nhánh riêng, không cần lấy dữ liệu từ app kho công trình mà nhân viên mua hàng sẽ
   * là người bấm hoàn thành và đính kèm phiếu giao hàng."*
   *
   * 🔴 VÌ SAO PHẢI NỚI — ĐO ĐƯỢC 15/09/2026, KHÔNG PHẢI SUY ĐOÁN: `khoiLuongConLai` chỉ tụt về 0
   * khi có phiếu nhận hàng `da_nhap_kho` (xem `tinh-toan.ts` → `tinhTienDoDongPO`), mà từ
   * 30/08/2026 nguồn phiếu duy nhất còn lại là cửa API của app QLK CTR. Hồ sơ phòng ban không gắn
   * công trình nào nên **không kho nào gửi phiếu sang** ⇒ điều kiện dưới đây không bao giờ thỏa ⇒
   * thẻ **kẹt vĩnh viễn**, không ai bấm hoàn thành được. Đó không phải chốt kiểm soát, đó là ngõ
   * cụt.
   *
   * 🔴🔴 NHƯNG KHÔNG NỚI TRẮNG — ĐỔI NGUỒN BẰNG CHỨNG, KHÔNG BỎ BẰNG CHỨNG. Chữ Sếp nói rõ nhân
   * viên mua hàng *"đính kèm phiếu giao hàng"*. Nên hồ sơ phòng ban **vẫn phải có tờ phiếu giao
   * hàng trong hồ sơ** mới đóng được, chỉ khác người đính. Bỏ luôn cả hai điều kiện là hồ sơ phòng
   * ban đóng được mà **không một mẩu bằng chứng nào chứng minh hàng đã về** — trong khi hồ sơ công
   * trình phải có phiếu cho TỪNG lần giao (luật Ban lãnh đạo 11/08/2026). Hai chuẩn lệch nhau tới
   * mức đó thì phòng ban thành đường vòng để né chứng từ, và ai cũng sẽ đi đường đó.
   *
   * 🔴 KHÓA CHẶT BẰNG `laHoSoPhongBan`, MỘT PHÉP NHẬN DIỆN DUY NHẤT (`2-quy-trinh/ho-so-phong-ban.ts`).
   * Rò sang hồ sơ công trình là mất chốt đối chiếu khối lượng của TOÀN BỘ app — hồ sơ công trình
   * phải giữ nguyên **mọi** điều kiện cũ, không một dòng nào được nới. Đừng chép lại phép nhận diện
   * ở đây, và đừng đổi nó thành `maDuAn.startsWith("PB-")`: lý do đã ghi đủ trong tệp kia.
   *
   * 📌 CÂU HỎI CỦA CHỐT NÀY KHÔNG ĐỔI: *"đã có bằng chứng hàng về đủ chưa"*. Chỉ **NGUỒN** bằng
   * chứng được phép khác nhau, và chỉ khác cho đúng hồ sơ phòng ban:
   *   · Công trình → giữ y nguyên câu cũ: mọi mặt hàng `khoiLuongConLai = 0`, tức phiếu nhận hàng
   *     do QLK CTR gửi sang đã phủ hết khối lượng. **Không một ly nào được nới.**
   *   · Phòng ban  → nguồn đó không tồn tại, nên chấp nhận **tệp phiếu giao hàng nhân viên mua
   *     hàng tự đính** thay vào chỗ đó.
   *
   * 🔴 VÌ SAO PHÉP THAY THẾ NẰM **BÊN TRONG** NHÁNH `chuaVeDu > 0` chứ không đứng riêng ngoài:
   * `chuaVeDu === 0` nghĩa là **đã có phiếu nhận `da_nhap_kho` phủ hết khối lượng** — bằng chứng
   * giao nhận đã có sẵn theo đường thường, và đường đó còn bị luật 11/08/2026 canh từng phiếu
   * (`tinh-toan.ts` → `vuongMacXacNhanKho`). Đòi thêm một tờ nữa lúc đó là bắt đính kèm hai lần cho
   * cùng một lần giao — đúng cái mà chú thích của `vuongMacXacNhanKho` đã cấm khi nhận ảnh QLK CTR.
   * 👉 Trên thực tế hồ sơ phòng ban **luôn** rơi vào `chuaVeDu > 0` (không kho nào gửi phiếu), nên
   * tờ phiếu giao hàng là BẮT BUỘC ở mọi hồ sơ phòng ban thật. Nhánh `chuaVeDu === 0` chỉ là lối
   * thoát cho hồ sơ đã có bằng chứng bằng đường khác, không phải cửa né chứng từ.
   *
   * ⚠️ VIẾT BA TẦNG `if` LỒNG NHAU LÀ CỐ Ý, đừng "dọn cho gọn" thành một biểu thức
   * `(A && !B) || (B && C)`. Mỗi tầng trả lời đúng một câu và câu chặn nói đúng việc còn thiếu;
   * gộp lại thì lần sau ai sửa cũng phải giải mã, mà sửa nhầm một dấu là im lặng nới cho **cả hai**
   * loại hồ sơ — không lỗi kiểu nào báo vì cả hai nhánh đều trả `string | null`.
   */
  const chuaVeDu = conPhaiMua.filter((d) => d.khoiLuongConLai > 0).length;
  if (chuaVeDu > 0) {
    if (!laHoSoPhongBan(deNghi)) {
      return `Còn ${chuaVeDu} mặt hàng chưa nhận đủ hàng. Ghi nốt phiếu nhận hàng trước khi hoàn thành.`;
    }
    /* 🔴 ĐÂY LÀ CHỖ GIỮ CHỮ CỦA SẾP. Hồ sơ phòng ban thôi bị đòi khối lượng, NHƯNG phải nộp tờ
       phiếu giao hàng vào đúng chỗ đó. Gỡ dòng này đi là "phòng ban thì bấm hoàn thành được luôn" —
       Sếp đã nói riêng một câu để chặn đúng cách hiểu đó (15/09/2026: *"nhân viên thu mua tự hoàn
       thành, NHƯNG phải đính kèm phiếu giao hàng"*).

       📌 KHÔNG KẸT ĐƯỢC — và từ chiều 15/09/2026 ĐƯỜNG CHÍNH ĐÃ ĐỔI, câu chặn phải chỉ đúng chỗ:
       Sếp cho bỏ ô riêng "Phiếu giao hàng" ở bước ⑥ (*"trường này đang bị dư => bỏ"*) vì hộp
       **"Ghi nhận giao hàng"** đã bắt buộc đính kèm phiếu cho từng lần giao. Nên câu dưới đây mời
       người dùng đi đường đó TRƯỚC; khu đính kèm chung của bước ⑥ vẫn còn và vẫn được hàm này nhận
       ra (ghi chú tệp bắt đầu bằng "Phiếu giao hàng"), giữ làm đường bổ sung cho hồ sơ cũ.
       🔴 Chỉ về một ô KHÔNG CÒN TRÊN MÀN HÌNH là đúng lỗi CLAUDE.md §3.5 — app bảo làm một việc mà
       không có chỗ nào làm được. Đổi giao diện thì phải đổi câu chặn theo. */
    if (!coPhieuGiaoHangPhongBan(deNghi)) {
      return `Chưa có ${NHAN_TEP_PHIEU_GIAO_HANG} nào trong hồ sơ — bắt buộc phải có mới đóng được. ${LY_DO_NHANH_PHONG_BAN} Bấm “Ghi nhận giao hàng” ở bảng tiến độ đơn (bước “Tiến hành nhận hàng”) và đính kèm phiếu giao hàng của lần giao đó.`;
    }
  }

  /**
   * ★★ ĐIỀU KIỆN HỢP ĐỒNG ĐỂ ĐÓNG HỒ SƠ — **có TỆP, HOẶC đã khai dứt điểm "Không có Hợp đồng"**
   * (Sếp 16/09/2026; trước đó 14/09/2026 chỉ chấp nhận tệp — hai mốc chép nguyên văn ở khối ★★★
   * ngay dưới).
   *
   * 🔴 TUYỆT ĐỐI KHÔNG "DỌN CHO GỌN" THÀNH `vuongMacRoiBuocLapDon` — cái bẫy này vẫn còn nguyên
   * sau khi luật đổi, chỉ đổi lý do. Hàm kia nhận **tệp HOẶC BẤT KỲ lý do nào**, tức nuốt luôn
   * *"Bổ sung sau"* và lý do gõ tay. Dùng nhầm ở đây là hồ sơ **còn nợ chứng từ** cũng đóng được —
   * đúng cái Sếp KHÔNG cho phép, vì Sếp chỉ mở cửa cho lời khai *đã kết luận là không có*.
   *
   * 📌 HAI CHỐT VẪN KHÁC NHAU LÀ CỐ Ý, ĐỪNG "DỌN CHO THỐNG NHẤT":
   *   · Bước ④ (`vuongMacRoiBuocLapDon`) — *tệp HOẶC lý do BẤT KỲ*. Nới ở đây là đúng: lúc lập đơn
   *     thì hợp đồng thường CHƯA ký xong, chặn cứng là cả phòng đứng lại.
   *   · Bước ⑧ (dòng dưới) — *tệp HOẶC ĐÚNG MỘT lời khai dứt điểm*. "Bổ sung sau" đi qua được bước
   *     ④ nhưng **không** đi qua được cửa này: đóng hồ sơ là lúc giao bộ chứng từ cho Kế toán,
   *     không còn chỗ cho một món nợ đang treo.
   * Cùng một câu hỏi "có hợp đồng chưa" nhưng hỏi ở hai thời điểm khác nhau nên đòi khác nhau —
   * y hệt cặp `vuongMacDuyetHoanThanhDeNghi` (⑦ không đòi hóa đơn · ⑧ đòi) ngay trên.
   *
   * ════════════════════════════════════════════════════════════════════════════════════
   * ★★★ LUẬT NÀY ĐÃ ĐỔI 16/09/2026 — GHI ĐỦ HAI MỐC, NGUYÊN VĂN CẢ HAI CÂU.
   *
   * · **LUẬT CŨ — Sếp 14/09/2026**: ***"2 loại này đều phải đính kèm hợp đồng… E chỉ cần tạo nút
   *   đính kèm HĐ bắt buộc là được"***. Khi đó `coHopDong` (CHỈ đếm tệp) là điều kiện duy nhất, và
   *   hồ sơ bấm *"Không có HĐ"* **không đóng được** cho tới khi đính tệp thật.
   *
   * · **LUẬT MỚI THAY THẾ — Sếp 16/09/2026**, trả lời đúng câu hỏi *"khai không có hợp đồng thì có
   *   được coi là đủ điều kiện đóng hồ sơ không"*: ***"Đúng, là điều kiện để đóng hồ sơ, nhưng
   *   phải có ghi chú và được link xuống mục 8"***.
   *
   * 👉 LUẬT CŨ **KHÔNG BỊ AI LỠ TAY XOÁ** — nó được thay bằng chỉ đạo mới. Bài kiểm máy của luật
   *    14/09 trong `kiem-luat-dung-chung.mjs` đã được **viết lại chứ không xoá**, và ghi đủ hai
   *    mốc này để phiên sau đọc là biết mình đang định sửa chỉ đạo của ai.
   *
   * 🔴🔴 CHỈ **LỜI KHAI DỨT ĐIỂM** MỚI ĐƯỢC TÍNH — đây là ranh giới sống còn của cả lượt sửa này.
   * Ba ca dưới đây vẫn **CHẶN**, và phải luôn chặn:
   *   · **bỏ trống** (chưa khai gì)          → chặn
   *   · **"Bổ sung sau"**                     → chặn (chính nghĩa của nó là *còn nợ chứng từ*)
   *   · **lý do gõ tay** (hồ sơ trước 13/09)  → chặn
   * Nới bất kỳ ca nào trong ba ca đó là **bỏ chốt, không phải nới chốt**: ai quên đính kèm cũng
   * đóng được hồ sơ, và Kế toán nhận một bộ thiếu chứng từ mà không có gì báo.
   * 👉 Vì vậy phải dùng `daKhaiKhongCoHopDong` (so BẰNG NHAU với đúng chuỗi đã khai), TUYỆT ĐỐI
   *    không dùng `vuongMacRoiBuocLapDon` hay `lyDoThieuHopDong(...) !== ""` — hai thứ đó nhận
   *    **mọi** lý do, tức nuốt trọn cả ba ca trên.
   *
   * 📌 "PHẢI CÓ GHI CHÚ VÀ ĐƯỢC LINK XUỐNG MỤC 8" — vế thứ hai của chỉ đạo nằm ở
   * `bo-ho-so-thanh-toan.ts` → `loiKhaiThieuChungTu` (dòng `ket_luan`), nơi bộ hồ sơ nói rõ hồ sơ
   * này **không có hợp đồng theo khai báo của người dùng** và ai đã khai. Hai vế là MỘT chỉ đạo:
   * mở cửa mà không ghi lại lời khai là đóng hồ sơ thiếu chứng từ không dấu vết.
   * ════════════════════════════════════════════════════════════════════════════════════
   *
   * 📌 XÉT TRƯỚC hóa đơn VAT: hợp đồng thuộc bước ④/⑤, hóa đơn thuộc ⑦. Nhắc theo đúng thứ tự
   * thời gian thì người dùng đi ngược dòng hồ sơ một lượt, không nhảy qua nhảy lại.
   *
   * ⚠️ KHÔNG NỚI GÌ KHÁC THEO: Hoá đơn VAT vẫn bắt buộc (dòng ngay dưới), khối lượng vẫn phải về
   * đủ (hai chốt phía trên), mọi lần giao vẫn phải có phiếu giao nhận (`vuongMacXacNhanKho`,
   * `tinh-toan.ts`). Sếp mở đúng MỘT cửa, không mở cả hàng rào.
   */
  if (!coHopDong(deNghi) && !daKhaiKhongCoHopDong(deNghi) && !khongCanHopDongHoaDon(deNghi)) {
    /* 🔴 CÂU NÀY PHẢI CHỈ ĐÚNG CHỖ CÒN LÀM ĐƯỢC VIỆC (CLAUDE.md §3.5). Tới 15/09/2026 nó ghi
       *"Đính kèm ngay ở ô Hợp đồng trong khối này"* — đúng lúc đó, vì bước ⑧ có ô nộp hợp đồng.
       Sếp 16/09/2026 cho bỏ ô ấy (***"Bỏ nút đính kèm này, hợp đồng sẽ được link từ bước 3
       xuống"***), nên câu phải đổi theo, nếu không nó đuổi người dùng đi tìm một cái nút không
       còn trên màn hình. Ô nộp thật (và hai nút chọn lý do) nằm ở bước **Lập đơn mua hàng**. */
    return `Chưa đính kèm ${TEN_HIEN_HOP_DONG} — bắt buộc phải có bản đã ký mới đóng được hồ sơ. Đính kèm ở ô “${TEN_HIEN_HOP_DONG}” của bước Lập đơn mua hàng, hoặc khai “${TEN_HIEN_LY_DO_KHONG_CO_HOP_DONG}” ngay tại đó nếu đơn này không có hợp đồng riêng.`;
  }

  /**
   * ★ ĐIỀU KIỆN CHỨNG TỪ CUỐI CÙNG — dùng lại đúng hàm ở trên, không viết lại điều kiện.
   *
   * 🔴 ĐÂY LÀ CHỐT PHẢI GIỮ BẰNG MỌI GIÁ. Không có Hóa đơn VAT thì Kế toán không hạch toán và
   * không thanh toán được — đóng hồ sơ lúc đó là đẩy sang Kế toán một bộ hồ sơ vô dụng.
   *
   * ⚠️ NGAY DƯỚI ĐÂY TỪNG CÓ PHÉP KIỂM THỨ SÁU `daTichXongUNC` (Ban lãnh đạo 23/08/2026) — **đã
   * xóa theo chỉ đạo Sếp 15/09/2026** (*"bỏ mục này, ko cần thiết"* → *"bỏ và thiết lập lại luật
   * mới"*). Xóa cái tích KHÔNG được kéo theo hai dòng Hợp đồng / Hóa đơn VAT phía trên: Sếp bỏ
   * một cái tích xác nhận, không bỏ chứng từ. Có bài kiểm máy canh cả hai chiều.
   */
  const thieuVAT = vuongMacDuyetHoanThanhDeNghi(deNghi);
  if (thieuVAT !== null) return thieuVAT;

  return null;
}
