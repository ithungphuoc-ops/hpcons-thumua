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
 * ★★ BỐN MỤC CÓ Ô NỘP TỆP NẰM NGAY TRONG BƯỚC ⑧ — Sếp 15/09/2026: *"Bố cục lại bước 8, đang bị
 * trùng lặp bộ hồ sơ đầy đủ của thanh toán"*.
 *
 * 🔴 ĐÂY LÀ DỮ KIỆN BỐ CỤC, KHÔNG PHẢI LUẬT NGHIỆP VỤ. Nó KHÔNG đổi mục nào bắt buộc, KHÔNG đổi
 * điều kiện đóng hồ sơ (`vuongMacDuyetHoanThanhDeNghi`, `vuongMacHoanThanhQuyTrinh` giữ nguyên
 * tuyệt đối) và KHÔNG bỏ mục nào khỏi `dungBoHoSoThanhToan` — hàm đó vẫn trả **đủ 8 mục** vì đó
 * là hợp đồng dữ liệu với app Kế toán (xem cảnh báo đầu tệp).
 *
 * 🔴 DÙNG ĐỂ LÀM GÌ: bốn chứng từ này có ô nộp tệp đặt ngay trong khối bước ⑧, phía TRÊN khối
 * "Bộ hồ sơ thanh toán". Khối bộ hồ sơ liệt kê lại chúng là cùng một tệp hiện hai lần trên cùng
 * một màn hình — đúng chỗ trùng Sếp chỉ ra. Nơi vẽ lọc bốn mã này ra khỏi phần HIỂN THỊ, còn dữ
 * liệu thì không đụng tới.
 *
 * 🔴 VÌ SAO KHÔNG BỎ Ô NỘP MÀ LẠI BỎ PHẦN LIỆT KÊ: khối bộ hồ sơ **chỉ đọc** (dùng `LienKetTep`,
 * không có đường ghi nào). Bỏ ô nộp là mất hẳn đường đính kèm — riêng **Phiếu chi** thì ô ở bước
 * ⑧ là chỗ DUY NHẤT trong cả app, bỏ đi là chức năng mồ côi (CLAUDE.md §3.4b).
 *
 * ⚠️ KHAI KIỂU `MaMucHoSo` LÀ CỐ Ý: đổi/xoá một khoá ở trên thì dòng này **không biên dịch được**.
 * Viết `string[]` là danh sách lặng lẽ lạc hậu, rồi một chứng từ lại hiện hai lần mà không ai báo.
 *
 * ⚠️ THÊM Ô NỘP MỚI Ở BƯỚC ⑧ thì thêm mã vào đây; ngược lại, dời một ô nộp sang bước khác thì bỏ
 * mã đó ra — nếu không khối bộ hồ sơ giấu mất một chứng từ mà không còn ô nào bày nó.
 */
export const MA_MUC_NOP_TAI_BUOC_HO_SO_THANH_TOAN: readonly MaMucHoSo[] = [
  "hop_dong",
  "hoa_don_vat",
  "unc",
  "phieu_chi",
];

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
   * Chứng từ nằm TRONG app, không phải tệp tải lên (mục 4 — Đơn mua hàng).
   *
   * 🔴 VÌ SAO PHẢI CÓ TRƯỜNG NÀY: tờ PO do app sinh ra, không ai tải nó lên. Nếu chỉ đếm `tep`
   * thì mục Đơn mua hàng luôn hiện "chưa có" dù đơn đã lập xong — và bộ hồ sơ đẩy sang Kế toán sẽ
   * thiếu đúng chứng từ trung tâm.
   */
  chungTuTrongApp?: { ma: string; duongDanIn: string }[];
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
 * Mục đã có chứng từ chưa — tính CẢ tệp tải lên, chứng từ app tự sinh, VÀ tệp trong các nhóm.
 *
 * ⚠️ Phải đếm cả `nhom`: mục 2 (báo giá) từ 26/08/2026 và mục 5 (phiếu giao hàng) từ 15/09/2026
 * đều để tệp trong nhóm và `tep` rỗng. Quên nhánh này là hai mục đó luôn hiện "chưa có" dù đã đủ
 * chứng từ.
 *
 * 🔴 CỐ Ý KHÔNG ĐẾM `lienKetNgoai`. Liên kết sang App Request chứng minh **tra được bản gốc**,
 * không chứng minh **app đang giữ chứng từ**. Đếm nó là mục 1 hiện dấu tích trong khi bộ hồ sơ
 * đẩy sang Kế toán không kèm được tệp nào — đúng kiểu "màn hình nói đủ, dữ liệu thì thiếu".
 * 📌 Không ảnh hưởng `tomTatBoHoSo`: mục 1 không bắt buộc, và không mục bắt buộc nào có liên kết
 * ngoài.
 */
export function mucDaCo(m: MucHoSoThanhToan): boolean {
  return (
    m.tep.length > 0 ||
    (m.chungTuTrongApp?.length ?? 0) > 0 ||
    (m.nhom ?? []).some((n) => n.tep.length > 0)
  );
}

/**
 * ★ TÁM MỤC CỦA BỘ HỒ SƠ THANH TOÁN — theo thứ tự Sếp liệt kê 15/09/2026 (mục 9 *Đính kèm khác*
 * chưa dựng, xem khối chú thích đầu tệp).
 *
 * @param deNghi          Hồ sơ đề nghị.
 * @param poCuaDeNghi     Đơn hàng của đề nghị này — nơi gọi tự lọc, và **nên bỏ đơn đã hủy**:
 *                        đơn hủy không thuộc bộ hồ sơ thanh toán.
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
  const coDuongDanAppRequest = duongDanAppRequest !== null;
  const soTepBenAppRequest = deNghi.taiLieuAppRequest?.length ?? 0;
  /* 🔴 NHẬN RA "ĐẾN TỪ APP REQUEST" BẰNG CẢ BA DẤU VẾT, không chỉ một: hồ sơ về trước 13/09/2026
     thiếu `idHoSoAppRequest`, và vẫn còn khả năng một hồ sơ chỉ còn lại danh mục tệp. Nhận nhầm
     hồ sơ bên đó thành "lập tay trong app" là in ra một câu chỉ SAI CHỖ tìm bản gốc — tệ hơn
     không nói gì, vì người đọc sẽ tin. */
  const denTuAppRequest =
    coDuongDanAppRequest || Boolean(deNghi.maDeXuatAppRequest) || soTepBenAppRequest > 0;
  const cauBanGocPhieuDeNghi = [
    coDuongDanAppRequest
      ? /* Có liên kết ngay trên rồi thì đừng chỉ người ta đi tìm ô khác nữa. Câu này giải thích
           luôn vì sao mục vẫn mang dấu "chưa có" dù bấm được — app không giữ bản sao tệp. */
        "App không giữ bản sao tệp — bấm liên kết trên để mở bản gốc bên App Request."
      : denTuAppRequest
        ? `Bản gốc nằm bên App Request${
            deNghi.maDeXuatAppRequest ? `, tra theo mã đề xuất ${deNghi.maDeXuatAppRequest}` : ""
          } — hồ sơ này không kèm đường dẫn trực tiếp (app chỉ bắt đầu lưu từ 13/09/2026).`
        : "Đề nghị này không đến từ App Request, và app cũng chưa nhận tệp hồ sơ đầu vào nào.",
    /* Nói luôn số tệp bên kia: người đọc biết có chứng từ để đi lấy, chứ không phải "trống rỗng".
       KHÔNG bày tên/đường dẫn từng tệp ở đây — `duongDan` là khóa R2 cần chữ ký, ghép thành liên
       kết là ra một nút bấm báo lỗi (xem `taiLieuAppRequest` trong `kieu-du-lieu.ts`). */
    soTepBenAppRequest > 0
      ? `Người đề nghị đính ${soTepBenAppRequest} tệp bên đó — app chỉ giữ danh mục tên, tải bản gốc bên App Request.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

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
       * 📌 VÌ SAO CÂU CHỈ ĐƯỜNG ĐI TRONG `nhom` CHỨ KHÔNG PHẢI `ghiChu`: nơi vẽ đang tô `ghiChu`
       * của mục bằng màu cảnh báo (`text-warning-soft`), còn câu của một nhóm rỗng thì tô màu
       * chữ phụ trung tính. Sếp bảo mục này *"ko cần báo đỏ"*, nên câu này phải trông như lời chỉ
       * đường, không như lời cảnh báo.
       *
       * ✅ KHÔNG PHẠM quy ước ở khai báo `nhom` ("có `nhom` thì `tep` để RỖNG"): `nhom` ở đây CHỈ
       * xuất hiện đúng lúc `tep` rỗng, nên không có tệp nào bị hiện hai lần.
       *
       * ⚠️ Nhóm rỗng nên `mucDaCo` vẫn trả `false` → vẫn hiện dấu "chưa có". Đó là CỐ Ý và là chỗ
       * nói thật: app thật sự không giữ tệp nào cho mục này. Đừng nhét một `MoTaTep` giả vào cho
       * "xanh" — `MoTaTep.id` là khóa tra nội dung trong `3-du-lieu/kho-tep.ts`, khóa giả thì bấm
       * ra tệp rỗng và người dùng tưởng hệ thống làm mất chứng từ.
       */
      nhom:
        phieuDeNghi.length > 0
          ? undefined
          : [{ ten: "Bản gốc phiếu đề nghị", tep: [], ghiChu: cauBanGocPhieuDeNghi }],
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
      tep: tepHopDong(deNghi),
      ghiChu: thieu(
        tepHopDong(deNghi).length > 0,
        "Chưa đính hợp đồng / thoả thuận — đính ở bước Lập đơn mua hàng.",
      ),
    },
    {
      stt: 4,
      ma: "don_mua_hang",
      ten: "Đơn mua hàng (PO)",
      batBuoc: true,
      /* Đơn hàng không phải tệp tải lên — xem `chungTuTrongApp`. */
      tep: [],
      chungTuTrongApp: poCuaDeNghi.map((po) => ({
        ma: po.code,
        duongDanIn: `/in/don-hang/${po.id}`,
      })),
      ghiChu: thieu(poCuaDeNghi.length > 0, "Chưa lập đơn mua hàng nào cho đề nghị này."),
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
