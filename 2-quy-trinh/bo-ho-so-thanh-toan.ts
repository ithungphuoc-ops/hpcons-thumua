// ============================================================
// BỘ HỒ SƠ THANH TOÁN — tám mục, gom từ MỌI bước của quy trình
//
// ★★ Ban lãnh đạo 26/08/2026: *"Tạo thêm 1 trường 'Kết quả'. Sẽ được link kết quả từ các bước
//    trên. Bộ hồ sơ đầy đủ gồm: 1. Phiếu đề nghị · 2. Báo giá NCC · 3. Đơn mua hàng (PO) ·
//    4. Hợp đồng mua bán/thoả thuận mua hàng · 5. Phiếu giao hàng · 6. Hoá đơn/UCN (nếu có) ·
//    7. Phiếu chi (nếu có)"* — và nói rõ mục đích: *"để sau này có thể lấy dữ liệu này đẩy qua
//    app kế toán"*.
//
// ★★ SẾP 15/09/2026 — SẮP LẠI THỨ TỰ VÀ TÁCH MỤC. Ảnh chụp bước ⑧ "Hồ sơ thanh toán" kèm chữ
//    *"Bố cục và kiểm tra nếu chưa có thì thêm các trường thông tin sau"*, liệt kê 9 mục:
//      1. Link phiếu đề nghị (ở bước 1) · 2. Link file báo giá được duyệt (bước 3) · 3. Hợp đồng ·
//      4. Link file đơn mua hàng (kết quả bước 4) · 5. Link phiếu giao hàng · 6. Hoá đơn VAT ·
//      7. Uỷ nhiệm chi · 8. Phiếu chi · 9. Đính kèm khác
//    Khác danh sách 26/08/2026 ở ba chỗ: (a) **Hợp đồng đứng TRƯỚC Đơn mua hàng** — trước đây
//    ngược lại; (b) **Hoá đơn VAT và Uỷ nhiệm chi tách thành HAI mục** — trước đây chung một mục
//    `hoa_don_unc`, chỉ chia hai `nhom` bên trong; (c) thêm mục 9 *Đính kèm khác*.
//
// 🔴 MỤC 9 "ĐÍNH KÈM KHÁC" CHƯA LÀM — CỐ Ý, KHÔNG PHẢI QUÊN. Bước ⑧ hiện KHÔNG có ô đính tệp tự
//    do nào, nên dựng mục này ra là một dòng vĩnh viễn trống mà không ai nộp được gì vào — đúng
//    loại "giao diện hứa một việc app không làm" mà CLAUDE.md §3.5 cấm. Chờ Sếp quyết có mở ô
//    đính kèm ở bước ⑧ hay không rồi mới thêm.
//    👉 Vì vậy `stt` chỉ chạy **1..8**, và **số 9 để trống có chủ ý** — thấy thiếu số 9 thì đọc
//    đoạn này, đừng tưởng lỗi đánh số.
//
// 🔴 ĐÃ ĐỔI KHOÁ `MaMucHoSo` NGÀY 15/09/2026 — chép lại ở đây vì khoá là **hợp đồng dữ liệu** với
//    app Kế toán sau này (xem chú thích ngay trên `MaMucHoSo`):
//      · `hoa_don_unc`  →  TÁCH thành `hoa_don_vat` và `unc`
//    Đổi được rẻ vì tại thời điểm đổi, khoá này **chưa có nơi tiêu thụ nào ngoài giao diện** (đã
//    grep toàn dự án: chỉ `1-giao-dien/thanh-phan-nghiep-vu/khoi-bo-ho-so-thanh-toan.tsx` đọc).
//    ⚠️ Khi đã có cửa API đẩy sang Kế toán thì **không được đổi lặng lẽ nữa** — đổi khoá lúc đó là
//    bên nhận mất một mục mà không có gì báo; phải hỏi bên nhận trước.
//
// ★★ SẾP 15/09/2026 (LẦN THỨ HAI TRONG NGÀY) — MỤC 4 TRỎ TỚI **TỆP**, KHÔNG PHẢI TỜ IN.
//    Nguyên văn, khoanh đỏ đúng mục 4: ***"Đây ko phải là link PO in. mà là file PO ký đính kèm
//    đã đính kèm ở bước 4, chỉ cần link xuống thôi"***.
//    👉 Trường `chungTuTrongApp` (và liên kết `/in/don-hang/{id}`) đã BỎ HẲN. Mục 4 nay đọc
//       `tepHopDong()` — cùng tệp với mục 3, vì app hiện dùng MỘT ô cho cả bước ④ và ⑤. Ba chỗ
//       phải đọc trước khi đụng vào: khối ❌ ở `MucHoSoThanhToan`, `tepHopDongDaKy` trong
//       `dungBoHoSoThanhToan`, và `TEN_HIEN_HOP_DONG_BUOC_DAT_HANG` ở `chung-tu-cuoi-quy-trinh.ts`.
//
// 🔴 GOM BẰNG THAM CHIẾU, KHÔNG SAO CHÉP TỆP. Mỗi mục dưới đây trỏ tới đúng những tệp đã đính ở
//    bước của nó. Nếu ở đây lại cho đính kèm lần nữa thì cùng một chứng từ có hai bản trong hồ
//    sơ, và không ai biết bản nào là bản đúng khi hai bản khác nhau.
//
// 🔴 HÀM THUẦN — không đọc kho dữ liệu, không đụng giao diện. Đó là điều kiện để sau này cửa API
//    đẩy sang app Kế toán gọi được cùng một hàm mà giao diện đang dùng: hai bên KHÔNG THỂ lệch
//    nhau. Nếu tính lại ở tầng API thì sớm muộn màn hình nói một bộ, dữ liệu đẩy đi một bộ khác.
//
// ⚠️ DANH SÁCH MỤC LÀ CỦA BAN LÃNH ĐẠO, không phải suy ra từ dữ liệu app đang có. Mục Phiếu chi
//    trước 26/08/2026 app CHƯA CÓ chỗ đính — đã thêm ô mới ở bước ⑦, xem `NHAN_TEP_PHIEU_CHI`
//    trong `chung-tu-cuoi-quy-trinh.ts`. Đừng bỏ mục nào vì "app chưa có": thiếu mục thì bộ hồ sơ
//    đẩy sang Kế toán hụt chứng từ mà không có gì báo.
// ============================================================

import type { BaoGia, DeNghiMuaHang, DonDatHang, MoTaTep, PhieuNhanHang } from "@/3-du-lieu/kieu-du-lieu";
import { tepBaoGiaDaCo, tepBaoGiaDaDuyet, tepSoSanh } from "@/2-quy-trinh/bao-gia-dinh-kem";
import {
  tepHoaDonVAT,
  tepHopDong,
  tepPhieuChi,
  tepPhieuGiaoHangPhongBan,
  tepUNC,
  TEN_HIEN_HOP_DONG,
  TEN_HIEN_HOP_DONG_BUOC_DAT_HANG,
} from "@/2-quy-trinh/chung-tu-cuoi-quy-trinh";
/* 📌 DÙNG LẠI hàm dựng đường dẫn App Request thay vì tự `trim()` lại ở đây: chỉ cần biết hồ sơ
   này có tra được bản gốc bên đó hay không. Hai chỗ cùng tự đoán một câu hỏi là hai câu trả lời
   — và chỗ này sẽ lặng lẽ lệch với ô "Đường dẫn đề nghị" ở trang chi tiết. */
import { duongDanHoSoAppRequest } from "@/6-tien-ich/dia-chi-app-de-nghi";

/**
 * Mã máy đọc được của từng mục — dùng làm khóa khi đẩy sang app Kế toán.
 *
 * 🔴 ĐÂY LÀ KHOÁ, KHÔNG PHẢI NHÃN. Đổi một khoá là đổi hợp đồng dữ liệu với bên nhận. Lần đổi gần
 * nhất: 15/09/2026 tách `hoa_don_unc` thành `hoa_don_vat` + `unc` — lý do và điều kiện đầy đủ ở
 * khối chú thích đầu tệp. Lần sau muốn đổi thì ghi tiếp vào đó, đừng đổi lặng lẽ.
 */
export type MaMucHoSo =
  | "phieu_de_nghi"
  | "bao_gia_ncc"
  | "hop_dong"
  | "don_mua_hang"
  | "phieu_giao_hang"
  | "hoa_don_vat"
  | "unc"
  | "phieu_chi";

/**
 * ★★ BỐN MỤC CÓ Ô NỘP TỆP NGAY TRONG DÒNG CỦA CHÍNH NÓ — Sếp 15/09/2026 (lượt thứ tư trong ngày):
 * ***"Bố cục lại này theo đúng thứ tự a đã cung cấp, sao e làm nó lộn xộn vậy"***.
 *
 * 🔴🔴 HẰNG SỐ NÀY ĐÃ ĐỔI NGHĨA 15/09/2026 — ĐỌC KỸ, ĐỪNG DÙNG THEO NGHĨA CŨ.
 *   · **Nghĩa CŨ (sáng 15/09)**: "bốn mã cần LỌC BỎ khỏi phần hiển thị". Khối bộ hồ sơ khi ấy chỉ
 *     bày 4 mục đến từ bước khác, còn bốn ô nộp xếp rời bên dưới.
 *   · **Nghĩa MỚI (từ nay)**: "mục nào có Ô NỘP TỆP đặt ngay trong dòng của nó". Không lọc bỏ mục
 *     nào nữa — cả 8 mục đều bày, theo đúng một dãy số liền mạch.
 *
 * 🔴 VÌ SAO PHẢI ĐỔI: nghĩa cũ làm số thứ tự trên màn hình nhảy cóc **1 · 2 · 4 · 5**, rồi 3 · 6 ·
 * 7 · 8 nằm rời bên dưới **không mang số nào**. Sếp đưa MỘT danh sách liền mạch 9 mục, app lại bẻ
 * làm hai cụm — đó chính là chỗ *"lộn xộn"* Sếp bắt. Nay mỗi chứng từ xuất hiện **đúng một lần, ở
 * đúng vị trí số của nó**, và mục nào nộp tệp tại bước ⑧ thì ô nộp nằm ngay trong dòng ấy.
 *
 * 🔴 VẪN LÀ DỮ KIỆN BỐ CỤC, KHÔNG PHẢI LUẬT NGHIỆP VỤ. Nó KHÔNG đổi mục nào bắt buộc, KHÔNG đổi
 * điều kiện đóng hồ sơ (`vuongMacDuyetHoanThanhDeNghi`, `vuongMacHoanThanhQuyTrinh` giữ nguyên
 * tuyệt đối) và KHÔNG bỏ mục nào khỏi `dungBoHoSoThanhToan` — hàm đó vẫn trả **đủ 8 mục** vì đó
 * là hợp đồng dữ liệu với app Kế toán (xem cảnh báo đầu tệp).
 *
 * 🔴 Ô NỘP KHÔNG BAO GIỜ ĐƯỢC BỎ, chỉ được DỜI CHỖ. Khối bộ hồ sơ **chỉ đọc** (dùng `LienKetTep`,
 * không có đường ghi nào); ô nộp mới là chỗ làm việc thật: xem · tải · nộp · thay · gỡ · thêm bản.
 * Riêng **Phiếu chi** thì ô ở bước ⑧ là chỗ DUY NHẤT trong cả app — bỏ đi là chức năng mồ côi
 * (CLAUDE.md §3.4b).
 *
 * ⚠️ `as const satisfies` LÀ CỐ Ý, ĐỪNG HẠ VỀ `readonly MaMucHoSo[]`:
 *   · `satisfies` giữ nguyên phép kiểm — gõ sai một mã là **không biên dịch được**;
 *   · `as const` giữ lại kiểu chữ cụ thể để sinh ra `MaMucCoONop` bên dưới, nhờ đó nơi vẽ **buộc
 *     phải truyền đủ bốn ô nộp**. Hạ về `readonly MaMucHoSo[]` thì `MaMucCoONop` nở ra cả 8 mã và
 *     mất sạch cái chốt ấy.
 *
 * ⚠️ THÊM Ô NỘP MỚI Ở BƯỚC ⑧ thì thêm mã vào đây — TypeScript sẽ bắt nơi vẽ truyền thêm ô tương
 * ứng. Ngược lại, dời một ô nộp sang bước khác thì bỏ mã đó ra, nếu không dòng ấy hiện một ô nộp
 * ghi vào bước khác mà không ai biết.
 */
export const MA_MUC_NOP_TAI_BUOC_HO_SO_THANH_TOAN = [
  "hop_dong",
  "hoa_don_vat",
  "unc",
  "phieu_chi",
] as const satisfies readonly MaMucHoSo[];

/** Mã của những mục có ô nộp tệp ngay tại bước ⑧ — sinh từ hằng số trên, đừng khai lại bằng tay. */
export type MaMucCoONop = (typeof MA_MUC_NOP_TAI_BUOC_HO_SO_THANH_TOAN)[number];

/**
 * Mục này có ô nộp tệp ngay trong dòng của nó không.
 *
 * 📌 Viết thành **type guard** chứ không phải `includes` trần: nơi vẽ nhờ đó tra thẳng vào bảng ô
 * nộp mà không phải ép kiểu. Ép kiểu ở nơi vẽ là chỗ một ngày nào đó tra bằng mã không có trong
 * bảng rồi nhận `undefined` — dòng đó mất ô nộp, không lỗi nào báo.
 */
export function laMaCoONop(ma: MaMucHoSo): ma is MaMucCoONop {
  return (MA_MUC_NOP_TAI_BUOC_HO_SO_THANH_TOAN as readonly MaMucHoSo[]).includes(ma);
}

export interface MucHoSoThanhToan {
  /**
   * Số thứ tự đúng như Sếp liệt kê ngày 15/09/2026 — chạy **1..8**.
   *
   * 📌 Số 9 (*Đính kèm khác*) **để trống có chủ ý**: bước ⑧ chưa có ô đính tệp tự do nên chưa dựng
   * mục đó. Xem khối chú thích đầu tệp trước khi "sửa cho liền số".
   */
  stt: number;
  ma: MaMucHoSo;
  ten: string;
  /**
   * Mục này bắt buộc phải có mới đủ hồ sơ hay không.
   *
   * 📌 Theo đúng chữ Ban lãnh đạo: Hoá đơn / UNC / Phiếu chi ghi *"(nếu có)"* nên KHÔNG bắt buộc
   * — nay là mục 6, 7, 8 sau lần sắp lại 15/09/2026.
   *
   * 📌 Mục 1 (Phiếu đề nghị) THÔI bắt buộc từ 13/09/2026 — Ban lãnh đạo: *"Ko cần đề xuất, vì đã
   * có link tới đề xuất rồi, nên mục này ko cần báo đỏ"*. Lý do đầy đủ ở khối ★★ mục ① trong
   * `dungBoHoSoThanhToan` — đọc trước khi định bật lại.
   *
   * 👉 Còn BẮT BUỘC bốn mục: 2 (báo giá NCC), 3 (hợp đồng), 4 (đơn mua hàng), 5 (phiếu giao
   * hàng) — đó là chứng từ chứng minh việc mua đã diễn ra thật.
   *
   * ⚠️ Lần sắp lại 15/09/2026 **không đổi mục nào bắt buộc**, chỉ đổi số thứ tự: vẫn đúng bốn mục
   * trên, nên `tomTatBoHoSo().tong` vẫn là 4. Tách `hoa_don_unc` thành hai mục cũng không thêm
   * ràng buộc nào — cả hai đều "(nếu có)".
   */
  batBuoc: boolean;
  /** Tệp của mục này — MẢNG RỖNG nghĩa là chưa có. */
  tep: MoTaTep[];
  /**
   * ❌ ĐÃ BỎ TRƯỜNG `chungTuTrongApp` — Sếp 15/09/2026. ĐỌC TRƯỚC KHI ĐỊNH DỰNG LẠI.
   *
   * Ở đây từng có `chungTuTrongApp?: { ma: string; duongDanIn: string }[]`, và mục 4 dùng nó để
   * trỏ tới **tờ PO in dựng động** (`/in/don-hang/{id}`). Sếp khoanh đỏ đúng mục 4 và ghi nguyên
   * văn: ***"Đây ko phải là link PO in. mà là file PO ký đính kèm đã đính kèm ở bước 4, chỉ cần
   * link xuống thôi"***.
   *
   * 🔴 VÌ SAO SẾP ĐÚNG VỀ NGHIỆP VỤ: bộ hồ sơ thanh toán là tập **chứng từ có thật trong tay** để
   * giao Kế toán. Tờ in dựng động không phải chứng từ — nó là bản app tự vẽ lại từ dữ liệu, không
   * có chữ ký, không có mộc, và nội dung đổi theo dữ liệu tại thời điểm mở. Thứ chứng minh việc
   * đặt hàng đã diễn ra là **bản đơn mua hàng NCC ký đóng mộc gửi về** — xem `tepHopDong` ở mục 4.
   *
   * ✅ TỜ IN KHÔNG MỒ CÔI (đã đo 15/09/2026, CLAUDE.md §3.4b): `/in/don-hang/[id]` còn HAI đường
   * vào sống —
   *   · `1-giao-dien/trang/don-hang-chi-tiet.tsx` → nút *"In đơn mua hàng"* (đã gác `quyen.xemGia`)
   *   · `1-giao-dien/trang/don-hang-lap-moi.tsx`  → nút *"Cất và In"*
   * Bỏ liên kết ở đây chỉ bỏ MỘT đường vào thừa, không xoá chức năng nào.
   *
   * 🔴 AI DỰNG LẠI LIÊN KẾT IN Ở KHỐI BỘ HỒ SƠ thì **bắt buộc gác lại quyền `xemGia`** — tờ in có
   * đơn giá. Đó là lý do prop `xemGia` vẫn còn trên `KhoiBoHoSoThanhToan`.
   */
  /**
   * ★★ LIÊN KẾT SANG APP KHÁC — mục 1 (Phiếu đề nghị), Sếp 15/09/2026: *"Link phiếu đề nghị"*.
   *
   * 🔴 KHÁC HẲN `chungTuTrongApp`: trường kia là đường dẫn NỘI BỘ tới trang in của chính app này
   * (`/in/...`) và bị gác quyền xem giá. Trường này là địa chỉ đầy đủ sang app khác — nơi vẽ phải
   * mở bằng `<a>` thường + tab mới, không dùng `next/link`.
   *
   * 🔴 CHỈ ĐẶT KHI ĐỊA CHỈ CHẮC CHẮN MỞ ĐÚNG HỒ SƠ — ba điều cấm đã đo thật, đừng thử lại:
   *   · `duongDanHoSoAppRequest` trả `null` khi thiếu `idHoSoAppRequest` (hồ sơ trước 13/09/2026
   *     và hồ sơ lập tay). Lúc đó **để trống trường này**, đừng vẽ một nút chết.
   *   · KHÔNG ghép địa chỉ từ `maDeXuatAppRequest` (mã 6 số) — đo 13/09/2026: ra một địa chỉ mở
   *     được nhưng SAI hồ sơ, loại lỗi không ai phát hiện tới lúc đối chiếu chứng từ.
   *   · KHÔNG dựng liên kết từ `taiLieuAppRequest[].duongDan` — đó là khóa R2 cần chữ ký, không
   *     phải địa chỉ mở được (xem `kieu-du-lieu.ts`).
   *
   * ⚠️ Liên kết KHÔNG được tính là "đã có chứng từ" — xem `mucDaCo`.
   */
  lienKetNgoai?: { nhan: string; url: string }[];
  /**
   * ★★ NHÓM BÊN TRONG MỘT MỤC — Ban lãnh đạo 26/08/2026: *"Tạo group lại nhé"*.
   *
   * 🔴 VÌ SAO CẦN: mục 2 phải phân biệt **bản báo giá được chọn** với **bảng so sánh** — hai thứ
   * khác hẳn nhau về vai trò khi Kế toán đối chiếu (một là giá đã cam kết, một là căn cứ chọn).
   * Đổ chung một danh sách thì họ phải tự đoán tệp nào là tệp nào, mà tên tệp là dãy số do máy
   * sinh nên đoán không nổi.
   *
   * 📌 TỪ 15/09/2026 mục 5 (Phiếu giao hàng) cũng dùng `nhom` — mỗi lần giao một nhóm, vì luật
   * 11/08/2026 kiểm TỪNG lần giao chứ không phải "có ít nhất một tệp". Đổi lại, mục 6 (Hoá đơn /
   * UNC) thôi dùng `nhom`: nó đã được tách hẳn thành hai mục riêng.
   *
   * 📌 Có `nhom` thì `tep` để RỖNG — nơi vẽ đọc `nhom` trước. Không nhồi cả hai để tránh cùng
   * một tệp hiện hai lần.
   */
  nhom?: { ten: string; tep: MoTaTep[]; ghiChu?: string }[];
  /** Câu nói rõ mục này đang thiếu gì / lấy ở bước nào. Rỗng khi đã đủ. */
  ghiChu?: string;
}

/**
 * Mục đã có chứng từ chưa — tính CẢ tệp tải lên VÀ tệp trong các nhóm.
 *
 * ⚠️ Phải đếm cả `nhom`: mục 2 (báo giá) từ 26/08/2026 và mục 5 (phiếu giao hàng) từ 15/09/2026
 * đều để tệp trong nhóm và `tep` rỗng. Quên nhánh này là hai mục đó luôn hiện "chưa có" dù đã đủ
 * chứng từ.
 *
 * ★★ THÔI ĐẾM `chungTuTrongApp` — Sếp 15/09/2026 (trường đó đã bỏ hẳn, xem chú thích tại chỗ khai
 * báo cũ trong `MucHoSoThanhToan`).
 * 🔴 ĐÂY LÀ MỘT THAY ĐỔI HÀNH VI THẬT, NÓI RA ĐỂ KHÔNG AI TƯỞNG LÀ LỖI: trước hôm nay mục 4 hiện
 * dấu ✓ **ngay khi đơn mua hàng được lập trong app**. Nay mục 4 chỉ ✓ khi **có bản đơn mua hàng
 * NCC ký gửi về**. Nên hồ sơ đã lập PO mà chưa nhận bản ký sẽ hiện "còn thiếu" — đúng sự thật, vì
 * bộ giao Kế toán khi đó thật sự chưa có tờ chứng từ nào cho mục này.
 *
 * 🔴 CỐ Ý KHÔNG ĐẾM `lienKetNgoai`. Liên kết sang App Request chứng minh **tra được bản gốc**,
 * không chứng minh **app đang giữ chứng từ**. Đếm nó là mục 1 hiện dấu tích trong khi bộ hồ sơ
 * đẩy sang Kế toán không kèm được tệp nào — đúng kiểu "màn hình nói đủ, dữ liệu thì thiếu".
 * 📌 Không ảnh hưởng `tomTatBoHoSo`: mục 1 không bắt buộc, và không mục bắt buộc nào có liên kết
 * ngoài.
 */
export function mucDaCo(m: MucHoSoThanhToan): boolean {
  return m.tep.length > 0 || (m.nhom ?? []).some((n) => n.tep.length > 0);
}

/**
 * ★ TÁM MỤC CỦA BỘ HỒ SƠ THANH TOÁN — theo thứ tự Sếp liệt kê 15/09/2026 (mục 9 *Đính kèm khác*
 * chưa dựng, xem khối chú thích đầu tệp).
 *
 * @param deNghi          Hồ sơ đề nghị.
 * @param poCuaDeNghi     Đơn hàng của đề nghị này — nơi gọi tự lọc, và **nên bỏ đơn đã hủy**:
 *                        đơn hủy không thuộc bộ hồ sơ thanh toán.
 *                        📌 TỪ 15/09/2026 tham số này KHÔNG còn quyết định mục 4 "đã có hay chưa"
 *                        (mục đó nay đếm tệp NCC ký). Nó chỉ còn dùng để viết câu nhắc cho đúng
 *                        việc: chưa lập đơn nào, hay đã lập mà chưa có bản ký. Đừng bỏ tham số —
 *                        bỏ là câu nhắc chỉ sai việc phải làm.
 * @param phieuCuaDeNghi  Phiếu nhận hàng của các đơn nói trên.
 */
export function dungBoHoSoThanhToan(
  deNghi: DeNghiMuaHang,
  poCuaDeNghi: DonDatHang[],
  phieuCuaDeNghi: PhieuNhanHang[],
  /**
   * Bang bao gia cua de nghi — CHI de tra ra ban bao gia DA DUOC CHON (Ban lanh dao 26/08/2026).
   *
   * 📌 Cang de tuy chon: noi goi cu (neu con) van chay, chi la muc 2 lui ve bay toan bo bao gia
   * kem cau canh bao. Bat buoc tham so nay la moi noi goi truyen mang rong cho qua duoc TypeScript,
   * roi mat im lang dung cai loc vua them.
   */
  baoGiaCuaDeNghi: BaoGia[] = [],
): MucHoSoThanhToan[] {
  /* ① PHIẾU ĐỀ NGHỊ — hồ sơ đầu vào do bộ phận đề xuất gửi kèm (`taiLieu`).
     ⚠️ KHÔNG dùng `taiLieuNgoai`: đó là con trỏ tới bản gốc nằm NGOÀI app (thư mục chung của
     phòng), không phải bản sao trong app — đẩy sang Kế toán một đường dẫn họ không mở được thì
     vô ích. Xem chú thích ở `kieu-du-lieu.ts`. */
  const phieuDeNghi = deNghi.taiLieu ?? [];

  /**
   * ★★ MỤC ① THÔI LÀ MỤC BẮT BUỘC — Ban lãnh đạo 13/09/2026, nguyên văn: *"Ko cần đề xuất, vì đã
   * có link tới đề xuất rồi, nên mục này ko cần báo đỏ"*.
   *
   * 🔴 VÌ SAO ĐÚNG, KHÔNG PHẢI NỚI LUẬT CHO DỄ SỐNG: App Request là **nơi duy nhất lập phiếu đề
   * nghị** (chốt 23/08/2026, xem `6-tien-ich/dia-chi-app-de-nghi.ts`). Tệp người đề nghị đính
   * nằm trong kho R2 của App Request, app Thu mua KHÔNG có khóa để tải về nên chỉ giữ được DANH
   * MỤC TÊN (`taiLieuAppRequest`, xem `kieu-du-lieu.ts`). Còn `deNghi.taiLieu` — đúng thứ mục này
   * đếm — chỉ được ghi bởi `themDeNghiGiaLap`, tức **chỉ có ở dữ liệu chạy thử**.
   * 👉 Với mọi hồ sơ THẬT, mục ① là điều kiện KHÔNG BAO GIỜ đạt được: nó báo thiếu vĩnh viễn, và
   * một chốt lúc nào cũng đỏ thì người dùng bỏ qua cả khối — chốt mất tin cậy còn tệ hơn không
   * có chốt.
   *
   * 🔴 GIỮ MỤC, CHỈ BỎ TÍNH BẮT BUỘC — KHÔNG xoá khỏi danh sách. Mã `phieu_de_nghi` là khóa khi
   * đẩy sang app Kế toán; xoá mục là bộ hồ sơ hụt một khóa mà không có gì báo (xem cảnh báo ở
   * đầu tệp). Hồ sơ nào có `taiLieu` thật thì vẫn bày tệp và vẫn được tính "đã có" như trước.
   *
   * ⚠️ CÁI GIÁ PHẢI TRẢ: từ nay không còn gì nhắc khi một hồ sơ thiếu phiếu đề nghị. Chấp nhận
   * được vì app KHÔNG có chỗ nào nộp phiếu đề nghị — nhắc cũng không ai sửa được. Đổi lại phải
   * NÓI THẬT bản gốc nằm ở đâu (câu dưới), chứ không im lặng để người đọc tưởng app làm mất hồ
   * sơ (CLAUDE.md §3.5).
   *
   * ⚠️ NẾU sau này app mở chỗ nộp phiếu đề nghị TRONG app thì xem lại mục này — lúc đó lý do
   * "không bao giờ đạt được" hết hiệu lực, nhưng chỉ đạo của Sếp thì vẫn còn, nên phải hỏi lại.
   */
  /**
   * ★★ ĐƯỜNG DẪN THẬT TỚI HỒ SƠ BÊN APP REQUEST — Sếp 15/09/2026: *"Link phiếu đề nghị (ở bước
   * 1)"*.
   *
   * 🔴 TRƯỚC HÔM NAY MỤC NÀY CHỈ IN MỘT CÂU CHỈ ĐƯỜNG, KHÔNG BẤM ĐƯỢC — người đọc phải tự cuộn
   * lên khối Thông tin đề nghị tìm ô "Đường dẫn đề nghị". Nay bày thẳng liên kết tại đây.
   *
   * ⚠️ `null` = hồ sơ KHÔNG có `idHoSoAppRequest` (về trước 13/09/2026, hoặc lập tay trong app).
   * Khi đó **giữ nguyên câu chữ** như cũ, tuyệt đối không vẽ nút chết và không ghép địa chỉ từ
   * `maDeXuatAppRequest` — ba điều cấm đã ghi đủ tại `lienKetNgoai` phía trên.
   */
  const duongDanAppRequest = duongDanHoSoAppRequest(deNghi.idHoSoAppRequest);

  /**
   * ❌❌ ĐÃ BỎ NHÓM CHỈ ĐƯỜNG CỦA MỤC ① — Sếp 16/09/2026, khoanh đỏ đúng hai dòng chữ nhỏ dưới
   * liên kết của mục 1 và ghi ***"Bỏ những ghi chú này đi"***. ĐỌC HẾT KHỐI NÀY TRƯỚC KHI ĐỊNH
   * VIẾT LẠI MỘT CÂU TƯƠNG TỰ.
   *
   * Hai dòng bị bỏ, chép nguyên văn để nhận ra mà đừng dựng lại:
   *   ① tên nhóm  — *"Bản gốc phiếu đề nghị"*
   *   ② câu ghi chú — *"App không giữ bản sao tệp — bấm liên kết trên để mở bản gốc bên App
   *      Request."*
   * Mục ① nay chỉ còn hàng nhãn và (nếu tra ra) liên kết `lienKetNgoai`; `nhom` bỏ hẳn.
   *
   * 🔴 KIẾN THỨC TRONG ĐÓ VẪN ĐÚNG VÀ VẪN LÀ THỨ NGƯỜI SỬA MÃ CẦN BIẾT — giữ nguyên ở đây:
   *   · **App Thu mua KHÔNG giữ bản sao tệp phiếu đề nghị.** Tệp người đề nghị đính nằm trong kho
   *     R2 của App Request; app này không có khóa để tải về nên chỉ giữ được DANH MỤC TÊN
   *     (`deNghi.taiLieuAppRequest`). Vì vậy mục ① mang dấu "chưa có" ngay cả khi liên kết bấm
   *     được — đó là sự thật, không phải lỗi hiển thị (xem `mucDaCo`, nó cố ý không đếm
   *     `lienKetNgoai`).
   *   · `deNghi.taiLieu` — đúng thứ mục này đếm — chỉ được ghi bởi `themDeNghiGiaLap`, tức **chỉ
   *     có ở dữ liệu chạy thử**. Đó cũng là lý do mục ① thôi bắt buộc từ 13/09/2026.
   *   · Hồ sơ THIẾU `idHoSoAppRequest` (về trước 13/09/2026, hoặc lập tay trong app) thì
   *     `duongDanHoSoAppRequest` trả `null` → mục ① không có liên kết nào. TUYỆT ĐỐI đừng ghép địa
   *     chỉ từ `maDeXuatAppRequest` để "cho có nút": đo 13/09/2026, cách đó ra một địa chỉ mở được
   *     nhưng SAI hồ sơ.
   *
   * 📌 BA BIẾN ĐÃ BỎ THEO (chỉ phục vụ hai dòng chữ trên, không luật nào dùng):
   * `coDuongDanAppRequest`, `soTepBenAppRequest`, `denTuAppRequest` — biến cuối nhận ra "hồ sơ đến
   * từ App Request" bằng cả ba dấu vết (`idHoSoAppRequest` · `maDeXuatAppRequest` ·
   * `taiLieuAppRequest`), cần lại thì dựng lại đủ cả ba, đừng chỉ xét một.
   *
   * ⚠️ `deNghi.taiLieuAppRequest[].duongDan` là khóa R2 cần chữ ký, KHÔNG phải địa chỉ mở được —
   * ghép thành liên kết là ra một nút bấm báo lỗi (xem `kieu-du-lieu.ts`).
   */

  /**
   * ② BÁO GIÁ NCC — HAI NHÓM: bản ĐƯỢC CHỌN, và bảng so sánh.
   *
   * ★★ Ban lãnh đạo 26/08/2026: *"Chỗ báo giá chỉ links file báo giá được chọn. Và bảng so sánh
   * báo giá (nếu có)"*.
   *
   * 🔴 SỬA ĐÚNG CHỖ SAI: bản đầu (cùng ngày) đổ **toàn bộ** báo giá vào một danh sách — hồ sơ hỏi
   * 3 nhà cung cấp thì Kế toán nhận 3 tệp mà không biết bản nào là bản đã cam kết giá. Hai bản
   * kia là báo giá của nhà cung cấp KHÔNG được chọn: đưa vào bộ hồ sơ thanh toán là mời người đối
   * chiếu lấy sai giá.
   *
   * 📌 DÙNG `tepBaoGiaDaDuyet` — hàm đã có sẵn từ chỉ đạo 20/08/2026 (*"tạo đường link tới báo giá
   * được chọn"*), đọc tiền tố `[Báo giá NCC n]` trong căn cứ duyệt của trưởng bộ phận. Không tự
   * đoán lại bằng cách khác: hai chỗ đoán khác nhau là hai câu trả lời cho một câu hỏi.
   *
   * ⚠️ CÓ THỂ KHÔNG TRA RA (`undefined`): hồ sơ duyệt TRƯỚC 20/08/2026 không có tiền tố đó. Khi đó
   * lùi về **toàn bộ** báo giá kèm câu nói rõ vì sao — thà bày thừa còn hơn để mục 2 trống trơn
   * trong khi hồ sơ có báo giá.
   */
  const bangSoSanh = tepSoSanh(deNghi);
  const bgDaChon = baoGiaCuaDeNghi
    .map((bg) => tepBaoGiaDaDuyet(deNghi, bg.lyDoChonNCC))
    .find((x) => x !== undefined);
  const moiBaoGia = tepBaoGiaDaCo(deNghi).filter((t) => t.id !== bangSoSanh?.id);
  const nhomBaoGia: { ten: string; tep: MoTaTep[]; ghiChu?: string }[] = [
    bgDaChon
      ? { ten: `Bản được chọn — ${bgDaChon.nhanO}`, tep: [bgDaChon.tep] }
      : {
          ten: "Bản báo giá",
          tep: moiBaoGia,
          ghiChu:
            moiBaoGia.length > 1
              ? "Chưa đọc được bản nào đã được chọn (hồ sơ duyệt trước 20/08/2026 không ghi lại) — đang bày tất cả, cần soát tay trước khi chuyển Kế toán."
              : undefined,
        },
    {
      ten: "Bảng so sánh báo giá",
      tep: bangSoSanh ? [bangSoSanh] : [],
      ghiChu: bangSoSanh ? undefined : "Chưa đính bảng so sánh.",
    },
  ];

  /**
   * ⑤ PHIẾU GIAO HÀNG — MỘT NHÓM CHO MỖI LẦN GIAO (Sếp 15/09/2026).
   *
   * 🔴 VÌ SAO KHÔNG ĐỔ PHẲNG NHƯ TRƯỚC: luật 11/08/2026 là **mỗi lần giao một tờ phiếu riêng**, và
   * `vuongMacXacNhanKho` kiểm TỪNG phiếu chứ không phải "có ít nhất một tệp". Đổ chung một danh
   * sách thì hồ sơ giao 3 lần mà chỉ có 2 tờ trông y hệt hồ sơ đủ, và Kế toán không có cách nào
   * biết tờ nào thuộc lần nào — tên tệp là dãy số do máy sinh nên đoán không nổi.
   *
   * 📌 ĐẶT TÊN NHÓM THEO ĐÚNG CÁCH KHỐI BƯỚC ⑥ ĐANG GỌI (`de-nghi-chi-tiet.tsx`: *"Phiếu giao nhận
   * lần N"*), thêm mã PO vì một đề nghị có thể có nhiều đơn và `lanGiaoThu` đếm lại từ 1 cho mỗi
   * đơn (xem `kho-du-lieu.tsx` → `lanGiaoThu = cuaPO.length + 1`). Bỏ mã PO là hai lần giao khác
   * đơn cùng hiện "Lần giao thứ 1".
   *
   * ⚠️ Không lọc theo trạng thái phiếu: phiếu còn chờ kiểm tra vẫn là chứng từ đã giao. Việc "chỉ
   * tính khối lượng của phiếu đã nhập kho" là luật về KHỐI LƯỢNG, không phải về chứng từ.
   */
  const nhomPhieuGiao: { ten: string; tep: MoTaTep[]; ghiChu?: string }[] = [...phieuCuaDeNghi]
    .sort((a, b) => a.poCode.localeCompare(b.poCode) || a.lanGiaoThu - b.lanGiaoThu)
    .map((p) => ({
      ten: `Lần giao thứ ${p.lanGiaoThu} — ${p.poCode}`,
      tep: p.tepPhieuGiao ? [p.tepPhieuGiao] : [],
      /* 🔴 NHÓM RỖNG PHẢI NÓI RÕ VÌ SAO RỖNG — ba lý do khác hẳn nhau, gộp một câu là báo động sai.
         Hai lý do đầu KHÔNG phải thiếu chứng từ, và `vuongMacXacNhanKho` cũng không bắt lỗi chúng
         (`2-quy-trinh/tinh-toan.ts`) — viết "chưa đính" cho chúng là đuổi người dùng đi tìm một tờ
         giấy không tồn tại. */
      ghiChu: p.tepPhieuGiao
        ? undefined
        : p.anhQlkCtr
          ? `Kho công trình (QLK CTR) gửi kèm ảnh phiếu "${p.anhQlkCtr.ten}" — ảnh nằm bên QLK CTR, xem ở bước Nhận hàng. App Thu mua không giữ bản sao.`
          : p.trangThai === "tu_choi_nhan"
            ? "Lần giao bị từ chối nhận — luật 11/08/2026 không đòi phiếu giao nhận cho lần này."
            : "Chưa đính phiếu giao nhận cho lần giao này.",
    }));

  /**
   * 📌 GOM THÊM PHIẾU GIAO HÀNG CỦA NHÁNH HỒ SƠ PHÒNG BAN.
   *
   * Hồ sơ phòng ban không có kho công trình gửi phiếu, nên nhân viên mua hàng tự đính tệp ở khu
   * bước ⑥ (khóa `nhan_hang`, xem `tepPhieuGiaoHangPhongBan`). Ô riêng cho việc đó **đã bị Sếp bỏ
   * chiều 15/09/2026**, nhưng hồ sơ CŨ đã đính qua đường ấy thì tệp vẫn còn — không gom vào đây là
   * bộ hồ sơ thanh toán của cả nhánh phòng ban mất đúng bằng chứng giao nhận.
   *
   * 🔴 KHỬ TRÙNG THEO `MoTaTep.id`: cùng một tờ có thể vừa nằm trong `tepPhieuGiao` của phiếu nhận,
   * vừa nằm ở khu đính kèm bước ⑥. Không khử là nó hiện hai lần và người đối chiếu tưởng có hai
   * chứng từ khác nhau.
   *
   * ⚠️ CHỈ THÊM NHÓM KHI CÒN TỆP SAU KHI KHỬ. Thêm một nhóm rỗng ghi "Chưa có" vào MỌI hồ sơ công
   * trình là dựng một lời cảnh báo cho việc không ai phải làm.
   */
  const idPhieuGiaoDaBay = new Set(nhomPhieuGiao.flatMap((n) => n.tep.map((t) => t.id)));
  const tepGiaoPhongBan = tepPhieuGiaoHangPhongBan(deNghi).filter(
    (t) => !idPhieuGiaoDaBay.has(t.id),
  );
  if (tepGiaoPhongBan.length > 0) {
    nhomPhieuGiao.push({
      ten: "Do nhân viên mua hàng đính (hồ sơ phòng ban)",
      tep: tepGiaoPhongBan,
    });
  }
  const coPhieuGiao = nhomPhieuGiao.some((n) => n.tep.length > 0);

  /**
   * ★★ MỘT TỆP DUY NHẤT CHO CẢ MỤC 3 VÀ MỤC 4 — Sếp 15/09/2026, nguyên văn ở mục 4: ***"Đây ko
   * phải là link PO in. mà là file PO ký đính kèm đã đính kèm ở bước 4, chỉ cần link xuống
   * thôi"***.
   *
   * 🔴 ĐỌC KỸ, ĐÂY LÀ CHỖ TRÔNG NHƯ LỖI MÀ KHÔNG PHẢI LỖI. App hiện có **MỘT ô, MỘT tệp** dùng
   * chung cho bước ④ và bước ⑤ (`chung-tu-cuoi-quy-trinh.ts` → `TEN_HIEN_HOP_DONG_BUOC_DAT_HANG`:
   * *"VẪN LÀ MỘT Ô, MỘT TỆP — chỉ khác chữ in ra"*). Ô đó mang tên **"Hợp đồng"** ở bước ④ và
   * **"Đơn mua hàng"** ở bước ⑤, nhưng cất vào cùng `tepGiaiDoan.lap_don_mua_hang` với cùng nhãn
   * `NHAN_TEP_HOP_DONG`. Vì vậy `tepHopDong()` là đường đọc đúng cho CẢ hai mục.
   *
   * 🔴 HỆ QUẢ PHẢI BIẾT: trong DỮ LIỆU trả về, mục 3 và mục 4 nay trỏ tới **cùng danh sách tệp**,
   * nên bộ đẩy sang app **Kế toán** thấy một tờ nằm ở hai khoá.
   *
   * ⚠️ TỪ 15/09/2026 (lượt thứ tư) CHUYỆN NÀY **NHÌN THẤY ĐƯỢC TRÊN MÀN HÌNH** — nói trước để
   * không ai tưởng là lỗi mới. Trước đó mục 3 bị lọc khỏi phần liệt kê nên trùng lặp bị che đi;
   * nay Sếp yêu cầu bày đủ một dãy 1→8 liền mạch, nên cùng một tờ hiện ở **dòng 3** (trong ô nộp)
   * và **dòng 4** (chỉ đọc). Đó là ảnh phản chiếu trung thực của việc app CHƯA TÁCH hai chứng từ,
   * không phải lỗi vẽ.
   * 👉 Gốc rễ là app CHƯA TÁCH hai chứng từ này — việc tách (thêm khoá tệp mới, sửa 4 hàm, xử lý
   *    dữ liệu cũ) đã mô tả ở `TEN_HIEN_HOP_DONG_BUOC_DAT_HANG` và **chưa được Sếp duyệt**. Ngày
   *    nào tách thật thì mục 4 đổi sang đọc khoá mới, mục 3 giữ `tepHopDong` — sửa đúng một dòng
   *    dưới đây. Đừng "chữa" bằng cách bỏ tệp khỏi một trong hai mục: làm vậy là một trong hai
   *    chứng từ biến mất khỏi bộ giao Kế toán mà không có gì báo.
   */
  const tepHopDongDaKy = tepHopDong(deNghi);

  const thieu = (co: boolean, cau: string) => (co ? undefined : cau);

  return [
    {
      stt: 1,
      ma: "phieu_de_nghi",
      ten: "Phiếu đề nghị",
      /* 🔴 KHÔNG bắt buộc từ 13/09/2026 (Sếp) — lý do đầy đủ ở khối ★★ mục ① phía trên. */
      batBuoc: false,
      tep: phieuDeNghi,
      /* ★★ LIÊN KẾT MỞ ĐÚNG HỒ SƠ BÊN APP REQUEST — Sếp 15/09/2026. Thiếu `idHoSoAppRequest` thì
         `duongDanHoSoAppRequest` trả `null` và ở đây để TRỐNG: người đọc vẫn còn câu chỉ đường
         `cauBanGocPhieuDeNghi` bên dưới, còn hơn một cái nút bấm vào ra sai hồ sơ. */
      lienKetNgoai: duongDanAppRequest
        ? [{ nhan: "Mở phiếu đề nghị bên App Request", url: duongDanAppRequest }]
        : undefined,
      /**
       * ❌ KHÔNG CÒN `nhom` — Sếp 16/09/2026 cho bỏ hai dòng chữ nhỏ của mục này; lý do đầy đủ và
       * nguyên văn hai dòng nằm ở khối ❌❌ ngay trên `duongDanAppRequest`.
       *
       * ⚠️ MỤC NÀY VẪN HIỆN DẤU "CHƯA CÓ" với mọi hồ sơ thật (app không giữ bản sao tệp), và nay
       * KHÔNG còn câu nào giải thích vì sao. Đó là cái giá của chỉ đạo, không phải sót — đừng
       * "chữa" bằng cách nhét một `MoTaTep` giả vào `tep` cho "xanh": `MoTaTep.id` là khóa tra nội
       * dung trong `3-du-lieu/kho-tep.ts`, khóa giả thì bấm ra tệp rỗng và người dùng tưởng hệ
       * thống làm mất chứng từ.
       */
    },
    {
      stt: 2,
      ma: "bao_gia_ncc",
      ten: "Báo giá NCC",
      batBuoc: true,
      /* `tep` RỖNG vì mục này dùng `nhom` — xem chú thích ở khai báo `nhom`. */
      tep: [],
      nhom: nhomBaoGia,
      ghiChu: thieu(
        nhomBaoGia.some((n) => n.tep.length > 0),
        "Chưa có bản báo giá nào — đính ở bước Yêu cầu NCC báo giá.",
      ),
    },
    /* 🔴 HỢP ĐỒNG ĐỨNG TRƯỚC ĐƠN MUA HÀNG — Sếp 15/09/2026 (trước đó ngược lại). Đây là thứ tự
       người ta đọc hồ sơ: ký thoả thuận rồi mới phát hành đơn. Đổi lại là đổi ngược chỉ đạo. */
    {
      stt: 3,
      ma: "hop_dong",
      ten: `${TEN_HIEN_HOP_DONG} / thoả thuận mua hàng`,
      batBuoc: true,
      tep: tepHopDongDaKy,
      ghiChu: thieu(
        tepHopDongDaKy.length > 0,
        "Chưa đính hợp đồng / thoả thuận — đính ở bước Lập đơn mua hàng.",
      ),
    },
    /**
     * ★★ MỤC 4 TRỎ TỚI **TỆP ĐƠN MUA HÀNG ĐÃ KÝ**, KHÔNG PHẢI TỜ IN — Sếp 15/09/2026, nguyên văn:
     * ***"Đây ko phải là link PO in. mà là file PO ký đính kèm đã đính kèm ở bước 4, chỉ cần link
     * xuống thôi"***.
     *
     * 🔴 ĐÃ BỎ HẲN liên kết `/in/don-hang/{id}` khỏi mục này (cùng trường `chungTuTrongApp`). Lý
     * do, bằng chứng "không mồ côi", và điều kiện nếu ai muốn dựng lại: xem khối chú thích ❌ ở
     * `MucHoSoThanhToan`.
     *
     * 🔴 KHÔNG CÒN GÁC `xemGia` Ở MỤC NÀY — và đây là chỗ dễ hiểu nhầm thành "nới quyền". Đo
     * 15/09/2026: **đúng tệp này đang được bày và tải ngay trên cùng trang chi tiết đề nghị mà
     * KHÔNG qua một lớp quyền nào** — ba ô `OChungTuBatBuoc` ở bước ④, ⑤ và ⑧ (`de-nghi-chi-tiet
     * .tsx`) đều cùng `BUOC_DINH_KEM_HOP_DONG` + `NHAN_TEP_HOP_DONG`, và trong cả tệp đó chữ
     * `xemGia` chỉ xuất hiện đúng MỘT lần: dòng truyền prop xuống khối bộ hồ sơ này.
     * 👉 Gác ở đây là **gác hình thức**: người không được xem giá chỉ cần cuộn xuống vài trăm pixel
     *    là mở được cùng tờ đó. Lớp gác thật của tệp đính kèm là quyền vào hồ sơ, không phải
     *    `xemGia`. Gác hờ còn tệ hơn không gác, vì nó tạo cảm giác đã được canh (CLAUDE.md §6.6).
     * ⚠️ Cái ĐÃ gác và VẪN gác là **tờ PO in** — nút *"In đơn mua hàng"* ở `don-hang-chi-tiet.tsx`
     *    vẫn nằm sau `quyen.xemGia`, và bản thân trang in còn tự chặn bên trong. Bỏ liên kết in
     *    khỏi đây KHÔNG mở thêm đường nào tới giá.
     * 🔴 NẾU MAI MỐT MUỐN THẬT SỰ CHẶN GIÁ Ở TỆP ĐÍNH KÈM thì phải làm ở tầng dữ liệu (tách
     *    document, CLAUDE.md §3.5 nguyên tắc 3), không phải bằng cách bật lại một `if` ở đây.
     */
    {
      stt: 4,
      ma: "don_mua_hang",
      ten: "Đơn mua hàng (PO)",
      batBuoc: true,
      /* CÙNG MỘT TỆP với mục 3 — app chưa tách hai chứng từ; xem `tepHopDongDaKy` phía trên. */
      tep: tepHopDongDaKy,
      /**
       * 🔴 CHƯA CÓ TỆP THÌ PHẢI CHỈ ĐÚNG CHỖ ĐÍNH, đừng để trống trơn (CLAUDE.md §3.5).
       *
       * 📌 TÁCH HAI CÂU CHO HAI TÌNH HUỐNG KHÁC HẲN NHAU — gộp một câu là chỉ sai việc:
       *   · chưa lập đơn nào  → việc phải làm là **lập đơn**, chưa có gì để đi xin bản ký
       *   · đã lập, chưa có bản ký → việc phải làm là **đòi NCC gửi bản ký về rồi đính vào**
       *
       * 📌 Nói cả hai bước ④/⑤ vì đó thật sự là **một ô dùng chung**, đính ở bước nào cũng vào
       * đúng chỗ. Tên ô lấy từ hằng số nên đổi chữ hiển thị thì câu này tự đúng theo.
       */
      ghiChu: thieu(
        tepHopDongDaKy.length > 0,
        poCuaDeNghi.length === 0
          ? "Chưa lập đơn mua hàng nào cho đề nghị này."
          : `Đã lập ${poCuaDeNghi.map((po) => po.code).join(", ")} nhưng chưa đính bản đơn mua hàng đã ký, đóng mộc của nhà cung cấp — đính ở ô "${TEN_HIEN_HOP_DONG_BUOC_DAT_HANG}" của bước Tiến hành đặt hàng, hoặc ô "${TEN_HIEN_HOP_DONG}" của bước Lập đơn mua hàng (cùng một ô, cùng một tệp).`,
      ),
    },
    {
      stt: 5,
      ma: "phieu_giao_hang",
      ten: "Phiếu giao hàng",
      batBuoc: true,
      /* `tep` RỖNG vì mục này dùng `nhom` (từ 15/09/2026) — xem chú thích ở khai báo `nhom`. */
      tep: [],
      nhom: nhomPhieuGiao,
      ghiChu: thieu(
        coPhieuGiao,
        "Chưa có phiếu giao nhận nào — mỗi lần giao phải đính một phiếu.",
      ),
    },
    /* 🔴 TÁCH HAI MỤC (Sếp 15/09/2026) — trước đây là MỘT mục `hoa_don_unc` chia hai `nhom`.
       Hóa đơn VAT là chứng từ thuế, ủy nhiệm chi là lệnh trả tiền: hai chứng từ khác bản chất,
       và bên Kế toán đối chiếu chúng ở hai chỗ khác nhau. Khoá cũ `hoa_don_unc` KHÔNG còn — việc
       đổi khoá đã ghi ở khối chú thích đầu tệp. */
    {
      stt: 6,
      ma: "hoa_don_vat",
      ten: "Hoá đơn VAT",
      /* Ban lãnh đạo ghi "(nếu có)" nên KHÔNG bắt buộc ở đây.
         ⚠️ Riêng HÓA ĐƠN VAT vẫn là điều kiện BẮT BUỘC để duyệt hoàn thành — luật đó nằm ở
         `vuongMacDuyetHoanThanhDeNghi`, đừng đọc dòng này thành "hóa đơn không cần thiết". */
      batBuoc: false,
      tep: tepHoaDonVAT(deNghi),
    },
    {
      stt: 7,
      ma: "unc",
      ten: "Ủy nhiệm chi",
      batBuoc: false,
      tep: tepUNC(deNghi),
    },
    {
      stt: 8,
      ma: "phieu_chi",
      ten: "Phiếu chi",
      batBuoc: false,
      tep: tepPhieuChi(deNghi),
    },
  ];
}

/**
 * ★ Câu tóm tắt cho nhãn khối — "đủ 4/4 mục bắt buộc" hoặc "còn thiếu …".
 *
 * 📌 Chỉ đếm mục BẮT BUỘC. Đếm cả mục "(nếu có)" thì hồ sơ nào cũng hiện thiếu, và người dùng
 * sẽ bỏ qua lời nhắc — chốt mất tin cậy còn tệ hơn không có chốt.
 *
 * ⚠️ `tong` KHÔNG PHẢI SỐ CỐ ĐỊNH — nó đếm `batBuoc` tại lúc chạy. Từ 13/09/2026 là **4** (trước
 * đó 5, vì mục ① Phiếu đề nghị thôi bắt buộc theo chỉ đạo của Sếp). Nơi vẽ phải in `tong`, tuyệt
 * đối đừng viết cứng con số vào câu chữ — viết cứng là một ngày nào đó màn hình nói "5" trong
 * khi hàm này đếm "4", và không có gì báo.
 */
export function tomTatBoHoSo(muc: MucHoSoThanhToan[]): {
  daCo: number;
  tong: number;
  thieu: string[];
} {
  const batBuoc = muc.filter((m) => m.batBuoc);
  const chuaCo = batBuoc.filter((m) => !mucDaCo(m));
  return {
    daCo: batBuoc.length - chuaCo.length,
    tong: batBuoc.length,
    thieu: chuaCo.map((m) => m.ten),
  };
}
