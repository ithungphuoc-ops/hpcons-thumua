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
// ★★★ SẾP 16/09/2026 — BA CHỈ ĐẠO CÙNG NGÀY, CẢ BA ĐỀU CHẠM VÀO TỆP NÀY:
//    ① ***"Tách làm 2 mục riêng"*** → mục 3 (Hợp đồng) và mục 4 (Đơn mua hàng) THÔI dùng chung một
//       tệp. Cách xử tệp đã đính ở ngăn chung TRƯỚC khi tách nằm ở `tepDonMuaHangCuaMuc4` — đọc
//       khối đó trước khi đụng vào mục 3 hay mục 4.
//    ② ***"Đúng, là điều kiện để đóng hồ sơ, nhưng phải có ghi chú và được link xuống mục 8"*** →
//       lời khai *"Không có Hợp đồng"* nay MỞ CỬA đóng hồ sơ. Luật ở
//       `chung-tu-cuoi-quy-trinh.ts` → `vuongMacHoanThanhQuyTrinh`; phần "ghi chú" ở
//       `loiKhaiThieuChungTu` dưới đây.
//    ③ ***"Cần thiết mở thêm để đính kèm tài liệu khác"*** → **MỤC 9 ĐÃ DỰNG**, xem ngay dưới.
//
// ✅ MỤC 9 "ĐÍNH KÈM KHÁC" ĐÃ LÀM 16/09/2026 — khối này trước đây ghi *"CHƯA LÀM, cố ý"*, chép lại
//    lý do cũ để thấy nó được gỡ bằng một chỉ đạo MỚI chứ không phải ai quên:
//    *"Bước ⑧ hiện KHÔNG có ô đính tệp tự do nào, nên dựng mục này ra là một dòng vĩnh viễn trống
//    mà không ai nộp được gì vào"* (CLAUDE.md §3.5).
//    👉 Điều kiện đó nay đã đủ: mục 9 có **ngăn riêng** `BUOC_DINH_KEM_KHAC` và một khu đính kèm
//       tự do thật ở bước ⑧. 🔴 TUYỆT ĐỐI KHÔNG đặt mục 9 lên ngăn `ho_so_thanh_toan` — ba hệ quả
//       đã đo, chép đủ ở chỗ khai `BUOC_DINH_KEM_KHAC` trong `chung-tu-cuoi-quy-trinh.ts`.
//    👉 `stt` nay chạy **1..9**, và `dungBoHoSoThanhToan` trả **9 mục**. Mọi chú thích cũ ghi
//       "8 mục" đã sửa theo; hợp đồng dữ liệu với app Kế toán đổi từ **8 → 9 khoá** ngày
//       16/09/2026 theo chỉ đạo ③ ở trên.
//
// 🔴 ĐÃ ĐỔI KHOÁ `MaMucHoSo` HAI LẦN — chép lại ở đây vì khoá là **hợp đồng dữ liệu** với app Kế
//    toán sau này (xem chú thích ngay trên `MaMucHoSo`):
//      · 15/09/2026 — `hoa_don_unc`  →  TÁCH thành `hoa_don_vat` và `unc`
//      · 16/09/2026 — **THÊM khoá thứ 9 `dinh_kem_khac`** (Sếp: *"Cần thiết mở thêm để đính kèm
//        tài liệu khác"*). Đây là **THÊM**, không phải đổi: 8 khoá cũ giữ nguyên từng chữ, nên bên
//        nhận cũ đọc được bản mới, chỉ là bỏ qua mục thứ 9 nếu chưa biết tới nó.
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
  cauNhacConNoChungTu,
  CHUNG_TU_DON_MUA_HANG,
  CHUNG_TU_HOP_DONG,
  type ChungTuCoLyDoThieu,
  lyDoThieuChungTuCua,
  nguoiKhaiKhongCoChungTu,
  tepDinhKemKhac,
  tepDonMuaHangNCCKy,
  tepHoaDonVAT,
  tepHopDong,
  tepPhieuChi,
  tepPhieuGiaoHangPhongBan,
  tepUNC,
  TEN_HIEN_DON_MUA_HANG,
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
  | "phieu_chi"
  /**
   * ★★ MỤC 9 — THÊM 16/09/2026 theo chỉ đạo Sếp (*"Cần thiết mở thêm để đính kèm tài liệu khác"*).
   * Khoá này là **mục "Nếu có"**: không bao giờ được đặt `batBuoc: true` cho nó, xem mục ⑨ trong
   * `dungBoHoSoThanhToan`.
   */
  | "dinh_kem_khac";

/**
 * ★★ BỐN MỤC CÓ Ô NỘP TỆP NGAY TRONG DÒNG CỦA CHÍNH NÓ — Sếp 15/09/2026 (lượt thứ tư trong ngày):
 * ***"Bố cục lại này theo đúng thứ tự a đã cung cấp, sao e làm nó lộn xộn vậy"***.
 *
 * 🔴🔴 HẰNG SỐ NÀY ĐÃ ĐỔI NGHĨA 15/09/2026 — ĐỌC KỸ, ĐỪNG DÙNG THEO NGHĨA CŨ.
 *   · **Nghĩa CŨ (sáng 15/09)**: "bốn mã cần LỌC BỎ khỏi phần hiển thị". Khối bộ hồ sơ khi ấy chỉ
 *     bày 4 mục đến từ bước khác, còn bốn ô nộp xếp rời bên dưới.
 *   · **Nghĩa MỚI (từ nay)**: "mục nào có Ô NỘP TỆP đặt ngay trong dòng của nó". Không lọc bỏ mục
 *     nào nữa — cả 9 mục đều bày (8 mục tới 15/09/2026, thêm mục 9 ngày 16/09/2026), theo đúng một dãy số liền mạch.
 *
 * 🔴 VÌ SAO PHẢI ĐỔI: nghĩa cũ làm số thứ tự trên màn hình nhảy cóc **1 · 2 · 4 · 5**, rồi 3 · 6 ·
 * 7 · 8 nằm rời bên dưới **không mang số nào**. Sếp đưa MỘT danh sách liền mạch 9 mục, app lại bẻ
 * làm hai cụm — đó chính là chỗ *"lộn xộn"* Sếp bắt. Nay mỗi chứng từ xuất hiện **đúng một lần, ở
 * đúng vị trí số của nó**, và mục nào nộp tệp tại bước ⑧ thì ô nộp nằm ngay trong dòng ấy.
 *
 * 🔴 VẪN LÀ DỮ KIỆN BỐ CỤC, KHÔNG PHẢI LUẬT NGHIỆP VỤ. Nó KHÔNG đổi mục nào bắt buộc, KHÔNG đổi
 * điều kiện đóng hồ sơ (`vuongMacDuyetHoanThanhDeNghi`, `vuongMacHoanThanhQuyTrinh` giữ nguyên
 * tuyệt đối) và KHÔNG bỏ mục nào khỏi `dungBoHoSoThanhToan` — hàm đó vẫn trả **đủ 9 mục** vì đó
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
  /**
   * ❌❌ MỤC 3 *Hợp đồng* ĐÃ **BỎ Ô NỘP Ở BƯỚC ⑧** — Sếp 16/09/2026, khoanh đỏ đúng nút vàng
   * *"⚠ Hợp đồng"* trong dòng số 3 và ghi ***"Bỏ nút đính kèm này, hợp đồng sẽ được link từ bước 3
   * xuống"***. ĐỌC HẾT TRƯỚC KHI ĐỊNH THÊM `"hop_dong"` TRỞ LẠI MẢNG NÀY.
   *
   * ✅ ĐÃ ĐO TRƯỚC KHI BỎ — KHÔNG LÀM MỒ CÔI CHỨC NĂNG (CLAUDE.md §3.4b): ô đính kèm hợp đồng
   * **vẫn còn nguyên ở bước ④ Lập đơn mua hàng** (`de-nghi-chi-tiet.tsx`, `OChungTuBatBuoc` với
   * `BUOC_DINH_KEM_HOP_DONG` + `NHAN_TEP_HOP_DONG`), kèm hai nút chọn lý do *"Bổ sung sau"* /
   * *"Không có Hợp đồng"*; và còn một ô nữa ở bước ⑤, cùng ngăn cùng nhãn. Bỏ ô ở bước ⑧ là bỏ
   * **đường thứ ba** tới cùng một tệp, không bỏ chức năng nào.
   *
   * 📌 Mục 3 ở bước ⑧ nay **chỉ đọc**: bày tệp, và khi chưa có thì vẫn nói rõ trạng thái — *"Bổ
   * sung sau"* → đỏ, *"Không có Hợp đồng"* → trung tính (`loiKhaiThieuChungTu`). Người dùng mất
   * cái nút, không mất thông tin nào.
   *
   * 🔴 CÂU CHẶN CỦA NÚT "Hoàn thành quy trình" ĐÃ ĐỔI THEO trong cùng lượt sửa — nó từng ghi *"Đính
   * kèm ngay ở ô Hợp đồng trong khối này"*. Ai thêm lại ô ở đây thì phải sửa ngược câu đó, và
   * ngược lại: hai thứ phải luôn chỉ về cùng một chỗ.
   */
  /**
   * ❌❌ MỤC 4 *Đơn mua hàng* CŨNG ĐÃ **BỎ Ô NỘP Ở BƯỚC ⑧** — Sếp 16/09/2026 (lần thứ hai trong
   * ngày), khoanh đỏ đúng nút vàng *"⚠ Đơn mua hàng"* ở dòng số 4 và ghi ***"Mục này cũng là link
   * từ bước lập đơn mua hàng xuống, chứ ko phải đính kèm ở đây · Làm tương tự như phần hợp đồng"***.
   *
   * ⚠️ SÁNG CÙNG NGÀY Ô NÀY VỪA ĐƯỢC THÊM VÀO ĐÂY, và chú thích lúc đó viết *"đừng đọc việc này
   * thành đổi chỗ ô hợp đồng sang mục 4"*. Không phải nó sai — lúc ấy Sếp thật sự yêu cầu ô riêng
   * ở dòng số 4. Nay Sếp xem giao diện thật rồi đổi ý: cả hai mục 3 và 4 đều **chỉ đọc**, mọi
   * đường nộp nằm ở bước sinh ra chứng từ. Ghi lại cả hai mốc để người sau không tưởng có ai làm
   * ẩu, và để biết luật hiện hành là mốc nào.
   *
   * ✅ ĐÃ ĐO TRƯỚC KHI BỎ — KHÔNG LÀM MỒ CÔI CHỨC NĂNG (CLAUDE.md §3.4b): ô đính kèm Đơn mua hàng
   * NCC ký **vẫn còn ở bước ⑤ Tiến hành đặt hàng** (`de-nghi-chi-tiet.tsx`, `OChungTuBatBuoc` với
   * `BUOC_DINH_KEM_DON_MUA_HANG` + `NHAN_TEP_DON_MUA_HANG`), kèm nút *"Bổ sung sau"*. Bỏ ô ở đây
   * là bỏ đường thứ hai tới cùng một tệp, không bỏ chức năng nào.
   *
   * 📌 Nay mục 4 chỉ đọc y như mục 3: bày tệp, chưa có thì nói rõ *"Bổ sung sau"* → đỏ. Riêng mục
   * 4 **không có** lời khai "Không có…" — *"PO là chắc chắn có, chỉ là bổ sung sau thôi"* (Sếp
   * 16/09/2026), nên nó không bao giờ chuyển sang trạng thái trung tính như mục 3.
   */
  "hoa_don_vat",
  "unc",
  "phieu_chi",
  /* ★★ THÊM 16/09/2026 — mục 9 *Đính kèm khác*. 🔴 Ô của nó KHÔNG phải `OChungTuBatBuoc` mà là khu
     đính kèm TỰ DO; xem `kieuONop` ngay dưới để biết vì sao phải phân biệt hai kiểu. */
  "dinh_kem_khac",
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

/**
 * ★★★ Ô NỘP CỦA MỤC NÀY THUỘC KIỂU NÀO — **QUYẾT ĐỊNH BỐ CỤC, ĐẶT Ở HÀM THUẦN CHỨ KHÔNG VIẾT `if`
 * TRONG JSX** (Sếp 16/09/2026, mục 9 *Đính kèm khác*).
 *
 * · `"khong"`      — mục chỉ đọc, chứng từ đến từ bước khác.
 * · `"o_co_ten"`   — `OChungTuBatBuoc`: **tự in tên chứng từ** kèm nhãn đỏ *"Bắt buộc"* / *"Nếu
 *   có"*. Nơi vẽ vì vậy KHÔNG được in `m.ten` lần nữa, nếu không tên hiện hai lần trong một dòng.
 * · `"khu_tu_do"`  — `KhuDinhKemGiaiDoan`: **không in tên gì cả**, nó chỉ là một dòng *"Đính kèm
 *   chứng từ khác"* rồi bung ô kéo thả. Nơi vẽ PHẢI tự in hàng nhãn như mọi mục thường, nếu không
 *   mục 9 hiện ra một cục không tên và không ai biết đó là mục mấy.
 *
 * 🔴 VÌ SAO KHÔNG GỘP HAI KIỂU LÀM MỘT: đã cân nhắc và bỏ. Cho `KhuDinhKemGiaiDoan` tự in tên thì
 * nó đang dùng ở **5 bước khác** trên trang chi tiết, thêm tiêu đề ở đó là đổi giao diện năm chỗ
 * không ai yêu cầu. Còn dựng mục 9 bằng `OChungTuBatBuoc` thì không được: ô đó đòi **một nhãn cố
 * định** cho tệp, mà mục 9 nhận tài liệu gì cũng được nên không có nhãn nào để đòi.
 */
export function kieuONop(ma: MaMucHoSo): "khong" | "o_co_ten" | "khu_tu_do" {
  /**
   * ★★ MỤC 9 ĐỔI TỪ `khu_tu_do` SANG `o_co_ten` — Sếp 16/09/2026, khoanh đỏ đúng mục đó:
   * ***"Đồng bộ lại giao diện đính kèm cho giống nhau, sao mục này đính kèm giao diện lại khác
   * các bước kia"***.
   *
   * 📌 GIỮ NGUYÊN BA NHÁNH của hàm này dù hiện không mục nào trả `khu_tu_do` nữa. Đây là **câu
   * trả lời cho một câu hỏi có thật** (*"ô nộp của mục này hình dạng nào"*), không phải phép đếm
   * — hôm nào mở một mục nhận tài liệu tự do thì có sẵn chỗ khai, và nơi vẽ đã chờ sẵn nhánh đó.
   *
   * ⚠️ Nơi vẽ (`khoi-bo-ho-so-thanh-toan.tsx`) đang bỏ qua `LienKetTep` cho `khu_tu_do` để tránh
   * bày tệp hai lần. Nay mục 9 là `o_co_ten` nên nó đi nhánh ô nộp — **kiểm lại bằng mắt xem có
   * bày đôi không** trước khi coi là xong.
   */
  return laMaCoONop(ma) ? "o_co_ten" : "khong";
}

export interface MucHoSoThanhToan {
  /**
   * Số thứ tự đúng như Sếp liệt kê ngày 15/09/2026 — chạy **1..9** từ 16/09/2026.
   *
   * 📌 Số 9 (*Đính kèm khác*) đã dựng ngày 16/09/2026 theo chỉ đạo Sếp (*"Cần thiết mở thêm để
   * đính kèm tài liệu khác"*). Trước hôm đó dãy chỉ chạy 1..8 và số 9 để trống có chủ ý.
   */
  stt: number;
  ma: MaMucHoSo;
  ten: string;
  /**
   * Mục này bắt buộc phải có mới đủ hồ sơ hay không.
   *
   * 📌 Theo đúng chữ Ban lãnh đạo: Hoá đơn / UNC / Phiếu chi ghi *"(nếu có)"* nên KHÔNG bắt buộc
   * — nay là mục 6, 7, 8 sau lần sắp lại 15/09/2026. Mục 9 *Đính kèm khác* (thêm 16/09/2026) cũng
   * KHÔNG bắt buộc — xem cảnh báo tại chỗ khai mục ⑨.
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
  /**
   * ★★ MỌI NHÓM ĐỀU PHẢI CÓ CHỨNG TỪ (`true`), hay chỉ cần MỘT nhóm có là đủ (mặc định).
   *
   * Bật cho mục ⑤ *Phiếu giao hàng*: mỗi lần giao là một tờ phiếu riêng (Ban lãnh đạo 11/08/2026),
   * nên thiếu một lần là thiếu cả mục. Xem chú thích đầy đủ ở `mucDaCo`.
   */
  moiNhomPhaiCo?: boolean;
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
  /**
   * ★ `bangChungNgoai` — nhóm này **đã có bằng chứng hợp lệ dù `tep` rỗng** (Sếp 18/09/2026).
   *
   * 🔴 SINH RA ĐỂ VÁ MỘT MÂU THUẪN CÓ THẬT: ảnh do QLK CTR gửi kèm nằm bên kho công trình chứ
   * không nằm trong kho tệp của Thu mua (hợp đồng dữ liệu của phiên tích hợp, 23/08/2026 —
   * `3-du-lieu/tich-hop-qlk-ctr-nhan-hang-types.ts`). `vuongMacXacNhanKho` **đã** coi ảnh đó là
   * bằng chứng giao nhận hợp lệ, nhưng bộ hồ sơ thanh toán chỉ đếm `tep` nên vẫn báo vàng
   * *"Chưa có phiếu giao nhận nào"* — app vừa **hiện** bằng chứng vừa **báo không có** bằng
   * chứng, trên cùng một khối. Sếp bắt được 18/09/2026.
   *
   * ⚠️ CỜ NÀY KHÔNG PHẢI "MIỄN CHỨNG TỪ". Chỉ bật khi có một bằng chứng thật ở nơi khác (ảnh QLK
   * CTR) hoặc khi luật không đòi chứng từ cho lần đó (`tu_choi_nhan`). Bật bừa là dựng lại đúng
   * lỗi "màn hình nói đủ, dữ liệu thì thiếu" mà chú thích `mucDaCo` bên dưới cấm.
   */
  nhom?: { ten: string; tep: MoTaTep[]; ghiChu?: string; bangChungNgoai?: boolean }[];
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
  if (m.tep.length > 0) return true;
  const nhom = m.nhom ?? [];
  /**
   * ★★ `moiNhomPhaiCo` — MỌI NHÓM ĐỀU PHẢI CÓ CHỨNG TỪ, không phải "có ít nhất một".
   *
   * 🔴 SỬA MỘT LỖI ĐO ĐƯỢC 18/09/2026, và nó có từ 15/09 chứ không phải mới: mục ⑤ *Phiếu giao
   * hàng* hỏi bằng `.some` trong khi luật gốc `vuongMacXacNhanKho` (`2-quy-trinh/tinh-toan.ts`)
   * hỏi bằng `.every` — **kiểm TỪNG phiếu**, đúng chỉ đạo Ban lãnh đạo 11/08/2026 *"mỗi lần giao
   * phải có phiếu giao nhận"*. Hai nơi lệch lượng từ nên sinh ca hỗn hợp:
   *
   *   lần 1 có ảnh QLK CTR (hoặc bị từ chối nhận) · lần 2 hàng vào kho nhưng CHƯA có phiếu
   *   → `vuongMacXacNhanKho` VƯỚNG (đúng), nhưng mục ⑤ hiện dấu ✓ xanh và không một câu cảnh báo
   *   ở cấp mục. Kế toán mở bảng kiểm thấy đủ, trong khi hồ sơ thật sự thiếu một tờ phiếu.
   *
   * 📌 Chính chú thích của mục ⑤ đã tự đặt luật *"HAI NƠI NÀY PHẢI LUÔN CÙNG MỘT CÂU TRẢ LỜI"* —
   * nên đây là mã nguồn mâu thuẫn với chú thích ngay trên nó, không phải hành vi cố ý.
   *
   * ⚠️ KHÔNG ĐỔI `.some` THÀNH `.every` CHO MỌI MỤC. Mục ② (bản báo giá · bảng so sánh) đang dựa
   * đúng vào `.some`: đổi hết là mọi hồ sơ chưa đính bảng so sánh mất dấu ✓. Vì vậy mới cần cờ
   * riêng, bật cho đúng mục `phieu_giao_hang`.
   *
   * ⚠️ `nhom.length > 0` là bắt buộc: `[].every(...)` trả `true`, nên bỏ điều kiện này là hồ sơ
   * **chưa giao lần nào** bỗng hiện đủ.
   */
  if (m.moiNhomPhaiCo) {
    return nhom.length > 0 && nhom.every((n) => n.tep.length > 0 || n.bangChungNgoai);
  }
  return nhom.some((n) => n.tep.length > 0 || n.bangChungNgoai);
}

/**
 * ★★★ DÒNG NÀY CÓ VẼ NHÃN XÁM *"Nếu có"* KHÔNG — Sếp 16/09/2026, khoanh đỏ đúng nhãn đó cạnh tiêu
 * đề **mục 1 · Phiếu đề nghị** và ghi ***"Bỏ ghi chú này"***.
 *
 * 🔴🔴 ĐÂY LÀ QUYẾT ĐỊNH **HIỂN THỊ**, TUYỆT ĐỐI KHÔNG ĐỤNG `batBuoc`. `batBuoc: false` của mục 1
 * là **dữ liệu thật**: nó quyết định mục có bị tính vào phép đếm đủ/thiếu hay không
 * (`tomTatBoHoSo`). Ai "dọn cho gọn" bằng cách sửa `batBuoc` để nhãn biến mất thì mục 1 thành BẮT
 * BUỘC, `tong` nhảy 4 → 5, và **mọi hồ sơ thật trong app đều báo còn thiếu một mục** — vì app
 * không giữ bản sao tệp phiếu đề nghị nên điều kiện đó không bao giờ đạt được (xem khối ★★ mục ①
 * trong `dungBoHoSoThanhToan`). Có bài kiểm máy canh đúng ca này.
 *
 * 📌 VÌ SAO NHÃN "Nếu có" VÔ NGHĨA Ở ĐÚNG MỤC 1 — ghi lại để người sau không thêm lại: *"Nếu có"*
 * nghĩa là *"tuỳ hồ sơ, có thì nộp, không có cũng được"*. Nhưng mục 1 **không phải thứ người dùng
 * nộp** — app KHÔNG giữ bản sao tệp phiếu đề nghị, bản gốc nằm bên App Request và ta chỉ trỏ liên
 * kết sang. Không có cái gì để "có hay không có" ở đây cả, nên nhãn ấy chỉ làm người đọc phân vân.
 *
 * 🔴 LOẠI TRỪ **THEO MÃ MỤC**, KHÔNG NỚI RA CẢ NHÓM. Mục 7 (Uỷ nhiệm chi) và mục 8 (Phiếu chi) —
 * và từ hôm nay cả mục 9 — vẫn mang nhãn "Nếu có": Sếp **không** khoanh chúng, và ở ba mục đó nhãn
 * này đúng nghĩa (đơn trả tiền mặt thì có phiếu chi, trả chuyển khoản thì không). Bỏ luôn cả ba là
 * dọn quá tay, và người dùng mất chỉ báo *"không đi tìm chứng từ không tồn tại"*.
 */
export function hienNhanNeuCo(m: MucHoSoThanhToan): boolean {
  if (m.ma === "phieu_de_nghi") return false;
  return !m.batBuoc;
}

/**
 * ★★★ LỜI KHAI "CHƯA CÓ CHỨNG TỪ" ĐƯỢC LINK XUỐNG BƯỚC ⑧ — Sếp 16/09/2026, nguyên văn:
 * ***"Ở bước 3, đang có nút chọn 'Bổ sung sau' và 'Không có HĐ' a muốn link cái này xuống mục 8
 * luôn. Nếu chọn 'Bổ sung sau' thì xuống mục 8 phải báo đỏ để nhắc đính kèm file, nếu mục 3 chọn
 * 'Không có HĐ' thì link ghi chú xuống là ko có hợp đồng. Làm tương tự như vậy cho bước 4"***.
 *
 * 📌 ĐỌC ĐÚNG SỐ MỤC: "bước 3" / "bước 4" trong câu Sếp là **mục 3 (Hợp đồng)** và **mục 4 (Đơn
 * mua hàng)** của bộ hồ sơ thanh toán ở bước ⑧, không phải bước ③/④ của quy trình 8 bước. Hai nút
 * Sếp nhắc là hộp *"Lý do chưa có"* ở khối bước ④ *Lập đơn mua hàng* (`de-nghi-chi-tiet.tsx`), ghi
 * vào `lyDoThieuChungTu[KHOA_LY_DO_THIEU_HOP_DONG]`.
 *
 * ✅ TỪ 16/09/2026 BẢNG NÀY ĐÃ PHÁT HUY ĐÚNG VIỆC NÓ SINH RA ĐỂ LÀM. Khối này trước đây ghi *"hôm
 * nay mục 3 và mục 4 cùng trỏ về `KHOA_LY_DO_THIEU_HOP_DONG`… ngày nào tách thật thì chỉ cần đổi
 * một dòng trong bảng dưới đây"*. Sếp cho tách (***"Tách làm 2 mục riêng"***) và đúng là **chỉ đổi
 * một dòng**: mục 4 nay trỏ sang `CHUNG_TU_DON_MUA_HANG` (khoá riêng
 * `KHOA_LY_DO_THIEU_DON_MUA_HANG`). Hai mục từ nay khai độc lập, không còn hiện giống hệt nhau.
 *
 * 🔴 TRA **THEO MÃ MỤC**, TUYỆT ĐỐI KHÔNG GÕ CỨNG MỘT KHOÁ ở nơi vẽ — đây vẫn là chỗ dễ làm ẩu
 * nhất, và nay còn nguy hơn: hai khoá tồn tại song song nên gõ cứng nhầm một khoá là dòng lời khai
 * của mục này hiện lời khai của mục kia, **không lỗi nào báo**.
 *
 * 🔴🔴 LUẬT ĐÓNG HỒ SƠ ĐÃ ĐỔI 16/09/2026 — KHỐI NÀY TỪNG GHI NGƯỢC LẠI, ĐỌC KỸ:
 *   · **Câu cũ ở đây** (đúng tới 15/09/2026): *"bấm 'Không có HĐ' vẫn KHÔNG đóng được hồ sơ —
 *     `vuongMacHoanThanhQuyTrinh` đòi có TỆP thật (Sếp 14/09/2026: '2 loại này đều phải đính kèm
 *     hợp đồng'). Đó là lý do dòng `ket_luan` chỉ ghi chú trung tính chứ không dám nói 'đã xong'"*.
 *   · **Luật mới thay thế — Sếp 16/09/2026**: ***"Đúng, là điều kiện để đóng hồ sơ, nhưng phải có
 *     ghi chú và được link xuống mục 8"***.
 * 👉 Nên dòng `ket_luan` **nay nói thẳng rằng đây là điều kiện đủ để đóng hồ sơ**, và nói rõ nó
 *    dựa trên **khai báo của người dùng** (kèm tên người khai nếu tra được). Đó chính là vế *"phải
 *    có ghi chú"* của chỉ đạo — mở cửa mà không ghi lại lời khai là đóng hồ sơ thiếu chứng từ
 *    không để lại dấu vết.
 *
 * 🔴 VẪN KHÔNG ĐỤNG `mucDaCo` / `tomTatBoHoSo`: hồ sơ khai *"Không có Hợp đồng"* vẫn **đếm là
 * thiếu** trong bảng kiểm chứng từ. Không mâu thuẫn — cửa mở vì có lời khai, còn trong tay thì
 * thật sự không có tờ nào (xem chú thích tại `LY_DO_KHONG_CO_HOP_DONG`).
 *
 * 🔴 `da_co` PHẢI XÉT TRƯỚC LỜI KHAI. Ca rất hay gặp: người dùng bấm *"Bổ sung sau"* rồi mấy hôm
 * sau đính tệp thật — trường lý do vẫn còn nguyên chuỗi cũ (app không tự xoá). Hỏi lời khai trước
 * là dòng đã đủ chứng từ vẫn bị tô đỏ vĩnh viễn, đúng kiểu chốt mất tin cậy.
 *
 * 📌 Chuỗi lạ (hồ sơ cũ gõ lý do tự do, trước 13/09/2026) rơi vào `con_no` → vẫn báo đỏ. Đúng: đó
 * là hồ sơ còn nợ chứng từ, chỉ khác cách ghi. Chỉ đúng chuỗi `LY_DO_KHONG_CO_HOP_DONG` mới là
 * lời khai dứt điểm.
 */
export const KHOA_LY_DO_THIEU_THEO_MUC: Partial<Record<MaMucHoSo, ChungTuCoLyDoThieu>> = {
  hop_dong: CHUNG_TU_HOP_DONG,
  /* 🔴 KHOÁ RIÊNG TỪ 16/09/2026 (trước đó dùng chung khoá của mục 3). Đây đúng là "một dòng" mà
     khối chú thích trên đã hẹn trước. */
  don_mua_hang: CHUNG_TU_DON_MUA_HANG,
  /* 📌 KHÔNG khai gì cho `dinh_kem_khac`: mục 9 là *"Nếu có"*, không có khái niệm "thiếu" nên cũng
     không có lý do thiếu để khai. Thêm nó vào đây là dựng một lời cảnh báo cho việc không ai phải
     làm. */
};

export interface LoiKhaiThieuChungTu {
  /**
   * · `khong_hoi`  — mục này không có cơ chế khai lý do (5 mục còn lại). Không vẽ gì.
   * · `da_co`      — đã có chứng từ. Không vẽ gì, **kể cả khi trường lý do còn chuỗi cũ**.
   * · `chua_khai`  — chưa có chứng từ, chưa chọn lý do nào. Giữ nguyên cách hiện có.
   * · `con_no`     — đã chọn "Bổ sung sau" (hoặc lý do tự do cũ) → **BÁO ĐỎ**.
   * · `ket_luan`   — đã khai dứt điểm "Không có <chứng từ>" → ghi chú **trung tính**, không đỏ.
   *   🔴 TỪ 16/09/2026 trạng thái này còn mang một nghĩa NẶNG HƠN nhiều so với màu sắc: với mục 3
   *   (Hợp đồng) nó là **điều kiện đủ để đóng hồ sơ** (Sếp: *"Đúng, là điều kiện để đóng hồ sơ"*).
   *   Luật thật nằm ở `vuongMacHoanThanhQuyTrinh`; ở đây chỉ là chỗ NÓI RA điều đó.
   */
  loai: "khong_hoi" | "da_co" | "chua_khai" | "con_no" | "ket_luan";
  /** Câu hiện trên màn hình. Rỗng với `khong_hoi` · `da_co` · `chua_khai`. */
  chu: string;
  /** Dòng này có tô đỏ không. Chỉ `con_no` mới đỏ. */
  baoDo: boolean;
}

export function loiKhaiThieuChungTu(
  deNghi: DeNghiMuaHang,
  m: MucHoSoThanhToan,
): LoiKhaiThieuChungTu {
  const ct = KHOA_LY_DO_THIEU_THEO_MUC[m.ma];
  if (ct === undefined) return { loai: "khong_hoi", chu: "", baoDo: false };
  /* 🔴 XÉT TRƯỚC LỜI KHAI — xem khối chú thích ở `KHOA_LY_DO_THIEU_THEO_MUC`. */
  if (mucDaCo(m)) return { loai: "da_co", chu: "", baoDo: false };

  const lyDo = lyDoThieuChungTuCua(deNghi, ct);
  if (lyDo === "") return { loai: "chua_khai", chu: "", baoDo: false };

  /* 📌 DÙNG LẠI ĐÚNG CHỮ ĐANG LƯU, không đặt câu mới: nhãn "Lý do chưa có" và chuỗi lý do đều lấy
     nguyên từ hộp chọn ở bước ④/⑤, nên hai màn hình không thể nói khác nhau về cùng một trạng thái. */
  /**
   * 🔴 `ct.lyDoKhongCo === null` ⇒ **KHÔNG BAO GIỜ có `ket_luan`** cho mục này. Đúng ca **Đơn mua
   * hàng**: Sếp 16/09/2026 — ***"PO là chắc chắn có, chỉ là bổ sung sau thôi. Kiểm tra lại và điều
   * chỉnh"***. Mọi lý do đã ghi ở mục đó rơi hết xuống `con_no` → **báo đỏ**, không có trạng thái
   * trung tính nào.
   *
   * 🔴 ĐÂY LÀ CHỖ SỬA MỘT LỖI THẬT SẾP BẮT ĐƯỢC, chép lại để không ai dựng lại: trước khi tách,
   * mục 4 dùng CHUNG trường lý do với mục 3, nên hồ sơ khai *"Không có HĐ"* làm **mục Đơn mua
   * hàng** hiện câu *"đơn này không có hợp đồng riêng, không phải thiếu sót"* — vừa sai chứng từ,
   * vừa tắt mất dấu đỏ của một tờ chắc chắn phải có.
   */
  if (ct.lyDoKhongCo !== null && lyDo === ct.lyDoKhongCo) {
    /**
     * ★★★ VẾ THỨ HAI CỦA CHỈ ĐẠO 16/09/2026 — ***"nhưng phải có ghi chú và được link xuống mục
     * 8"***. Câu dưới đây phải nói đủ BA điều, thiếu điều nào cũng hỏng theo một kiểu:
     *   ① **hồ sơ này không có chứng từ đó** — sự thật về bộ hồ sơ;
     *   ② **theo KHAI BÁO CỦA NGƯỜI DÙNG**, không phải app tự kết luận. Đây là chỗ quan trọng
     *      nhất: từ hôm nay lời khai này **mở cửa đóng hồ sơ**, nên Kế toán phải đọc ra ngay rằng
     *      cửa mở vì có người khai, chứ không phải vì app đã kiểm và thấy đủ;
     *   ③ **ai khai** — nếu tra được. `null` là KHÔNG TRA ĐƯỢC, và khi đó câu này im lặng về tên
     *      người thay vì đoán bừa (ba ca trả `null` đã ghi đủ ở `nguoiKhaiKhongCoChungTu`).
     *
     * 🔴 CÂU NÀY LÀ DỮ LIỆU CỦA BỘ HỒ SƠ, KHÔNG PHẢI TRANG TRÍ — nó đi cùng mục sang app Kế toán.
     * Rút gọn thành *"không có hợp đồng"* trơn là bên nhận không biết đó là kết luận của ai.
     */
    const nguoiKhai = nguoiKhaiKhongCoChungTu(deNghi, ct);
    const boSungTen = nguoiKhai === null ? "" : ` (do ${nguoiKhai} ghi chú)`;
    /* 🔴 CHỈ NÓI "ĐIỀU KIỆN ĐỦ ĐỂ ĐÓNG HỒ SƠ" KHI ĐÚNG LÀ VẬY — cờ `moCuaDongHoSo`. Hôm nay chỉ
       Hợp đồng có chốt ở `vuongMacHoanThanhQuyTrinh`; Đơn mua hàng chưa bao giờ có chốt nào, nên
       in câu đó cho nó là hứa một luật không tồn tại (CLAUDE.md §3.5). */
    const veDongHoSo = ct.moCuaDongHoSo
      ? " Ghi chú này là điều kiện đủ để đóng hồ sơ."
      : "";
    return {
      loai: "ket_luan",
      chu:
        /* `?? ct.lyDoKhongCo` — chữ hiển thị có thể khác chuỗi lưu (cặp hợp đồng), nhưng nếu ai
           quên khai `tenHienKhongCo` thì in chuỗi lưu còn hơn in "null" ra màn hình. */
        /* 🔴 DÙNG CHỮ "GHI CHÚ", KHÔNG DÙNG "KHAI" — Sếp 16/09/2026, khoanh đỏ đúng dòng này:
           *"Sửa lại mục này, thay từ 'khai' bằng từ 'ghi chú'"*. Chữ "khai"/"khai báo" nghe như
           thủ tục hành chính và như thể người dùng đang phải chịu trách nhiệm pháp lý; đây chỉ là
           một ghi chú nghiệp vụ trong hồ sơ.
           📌 CHỈ ĐỔI CHỮ VẼ. Tên hàm `nguoiKhaiKhongCoChungTu`, khoá lưu và mọi phép so sánh giữ
           nguyên — đổi chúng là đụng dữ liệu đã lưu, đúng cái suýt hỏng hôm 16/09 với chuỗi
           "Không có HĐ". */
        `Đã ghi chú “${ct.tenHienKhongCo ?? ct.lyDoKhongCo}”${boSungTen} — hồ sơ này KHÔNG CÓ ${ct.tenChungTu} ` +
        `theo ghi chú của người dùng, không phải thiếu sót.${veDongHoSo}`,
      baoDo: false,
    };
  }
  /* 🔴 CÂU CHỮ LẤY TỪ `cauNhacConNoChungTu`, KHÔNG gõ lại ở đây — bước ④ và bước ⑧ phải nói y hệt
     một câu về cùng một trạng thái (xem chú thích tại hàm đó). */
  return { loai: "con_no", chu: cauNhacConNoChungTu(lyDo), baoDo: true };
}

/**
 * ★ CHÍN MỤC CỦA BỘ HỒ SƠ THANH TOÁN — đúng danh sách Sếp liệt kê 15/09/2026, đủ cả mục 9 *Đính
 * kèm khác* từ 16/09/2026 (xem khối chú thích đầu tệp).
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
              ? "Chưa đọc được bản nào đã được chọn (hồ sơ duyệt từ trước không ghi lại) — đang bày tất cả, cần soát tay trước khi chuyển Kế toán."
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
  const nhomPhieuGiao: {
    ten: string;
    tep: MoTaTep[];
    ghiChu?: string;
    bangChungNgoai?: boolean;
  }[] = [...phieuCuaDeNghi]
    .sort((a, b) => a.poCode.localeCompare(b.poCode) || a.lanGiaoThu - b.lanGiaoThu)
    .map((p) => ({
      ten: `Lần giao thứ ${p.lanGiaoThu} — ${p.poCode}`,
      tep: p.tepPhieuGiao ? [p.tepPhieuGiao] : [],
      /**
       * 🔴 BẬT CỜ ĐÚNG HAI CA MÀ `vuongMacXacNhanKho` KHÔNG BẮT LỖI (`2-quy-trinh/tinh-toan.ts`):
       * ảnh QLK CTR gửi kèm, và lần giao bị từ chối nhận. Hai ca này **không thiếu chứng từ**, và
       * chú thích ngay dưới đây đã ghi luật đó từ 15/09/2026 — nhưng phép đếm `coPhieuGiao` lại
       * quên, nên câu vàng tổng vẫn báo thiếu. Đây chính là chỗ hai bên nói ngược nhau.
       *
       * ⚠️ HAI NƠI NÀY PHẢI LUÔN CÙNG MỘT CÂU TRẢ LỜI. Sửa điều kiện ở đây mà không sửa
       * `vuongMacXacNhanKho` (hoặc ngược lại) là dựng lại đúng mâu thuẫn vừa vá. Có bài kiểm
       * hai chiều ghim việc này trong `kiem-luat-dung-chung.mjs`.
       */
      bangChungNgoai: Boolean(p.anhQlkCtr) || p.trangThai === "tu_choi_nhan",
      /* 🔴 NHÓM RỖNG PHẢI NÓI RÕ VÌ SAO RỖNG — ba lý do khác hẳn nhau, gộp một câu là báo động sai.
         Hai lý do đầu KHÔNG phải thiếu chứng từ, và `vuongMacXacNhanKho` cũng không bắt lỗi chúng
         (`2-quy-trinh/tinh-toan.ts`) — viết "chưa đính" cho chúng là đuổi người dùng đi tìm một tờ
         giấy không tồn tại. */
      ghiChu: p.tepPhieuGiao
        ? undefined
        : p.anhQlkCtr
          ? `Đã có bằng chứng giao nhận: ảnh phiếu "${p.anhQlkCtr.ten}" do Kho công trình (QLK CTR) gửi kèm — mở khối "Tiến độ nhận hàng" ở bước Nhận hàng để xem và tải về. Lần giao này không phải đính thêm phiếu.`
          : p.trangThai === "tu_choi_nhan"
            ? "Lần giao bị từ chối nhận — không đòi phiếu giao nhận cho lần này."
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
  /**
   * 🔴 XÉT CẢ `bangChungNgoai` — nếu không thì hồ sơ có đủ ảnh QLK CTR cho mọi lần giao vẫn bị
   * báo vàng *"Chưa có phiếu giao nhận nào"*, trong khi ngay bên trên app vừa liệt kê đúng những
   * ảnh đó. Sếp 18/09/2026 hỏi *"có cách nào kéo nội dung này về app Thu mua không"* — hỏi vì
   * nhìn thấy app tự mâu thuẫn, không phải vì thiếu ảnh.
   */
  /**
   * 🔴 `every` CHỨ KHÔNG PHẢI `some` — sửa 18/09/2026, xem chú thích đầy đủ ở `mucDaCo`.
   * Luật gốc `vuongMacXacNhanKho` kiểm TỪNG phiếu (Ban lãnh đạo 11/08/2026); hỏi bằng `some` là
   * hồ sơ có 1 lần giao đủ và 1 lần giao thiếu vẫn hiện ✓ xanh, không một câu cảnh báo nào.
   */
  const nhomConThieu = nhomPhieuGiao.filter((n) => n.tep.length === 0 && !n.bangChungNgoai);
  const coPhieuGiao = nhomPhieuGiao.length > 0 && nhomConThieu.length === 0;

  /**
   * ★★★ ĐÃ TÁCH HAI CHỨNG TỪ — Sếp 16/09/2026: ***"Tách làm 2 mục riêng"***.
   *
   * · **Mục 3 (Hợp đồng)** đọc `tepHopDong` — NGĂN CŨ (`lap_don_mua_hang`, cộng khoá cũ hơn
   *   `dat_hang` của ba ngày 24–26/08/2026). Ngăn này KHÔNG ĐỔI MỘT CHỮ.
   * · **Mục 4 (Đơn mua hàng)** đọc ngăn MỚI `BUOC_DINH_KEM_DON_MUA_HANG` — xem
   *   `tepDonMuaHangCuaMuc4` ngay dưới, nơi giữ luật về dữ liệu cũ.
   */
  const tepHopDongDaKy = tepHopDong(deNghi);

  /**
   * ★★★ TỆP CỦA MỤC 4 — **CHỈ LẤY TỪ NGĂN RIÊNG CỦA ĐƠN MUA HÀNG. KHÔNG MƯỢN TỆP CỦA MỤC 3.**
   *
   * 🔴 ĐÃ SỬA 16/09/2026 SAU KHI SẾP BẮT LỖI, kèm ảnh mục 3 và mục 4 bày **y hệt một tệp**
   * (`…4f513b727cfe9590a2ceb6d558b60e39.jpg`, 303 KB): ***"Cái gì đây, Hợp đồng và đơn mua hàng
   * là riêng biệt mà"***.
   *
   * ⚠️ BẢN SÁNG CÙNG NGÀY LÀM SAI, VÀ SAI THEO KIỂU DỄ LẶP LẠI — ghi lại để không ai làm lại:
   * lúc tách hai chứng từ, mọi tệp cũ đều nằm chung ở `tepGiaiDoan.lap_don_mua_hang`, nên có ý
   * "cho tệp chung hiện ở CẢ HAI mục, kèm ghi chú giải thích" để hồ sơ cũ khỏi báo thiếu hàng
   * loạt. Nghe hợp lý, nhưng nó **phá đúng thứ Sếp vừa yêu cầu**: Sếp chốt *"Tách làm 2 mục
   * riêng"*, mà hai mục bày chung một tệp thì có tách gì đâu. Tệ hơn: bộ hồ sơ giao Kế toán có
   * hai dòng chứng từ khác tên trỏ vào cùng một tờ giấy — người đối chiếu không cách nào biết
   * tờ đó thật ra là hợp đồng hay là đơn mua hàng.
   *
   * 🔴 Ý ĐÓ CHƯA TỪNG ĐƯỢC SẾP DUYỆT. Chú thích cũ tại đây ghi *"LUẬT SẾP CHỐT"* — **không đúng**,
   * đó là đề xuất nội bộ được đưa thẳng vào mã nguồn rồi mới báo cáo sau. Việc đổi cách hiểu một
   * chứng từ phải hỏi trước, không phải làm trước.
   *
   * ✅ NAY: mục 4 chỉ hiện tệp ở ngăn riêng `BUOC_DINH_KEM_DON_MUA_HANG`. Chưa có thì **báo thiếu**
   * — và đó là sự thật: hồ sơ đó thật sự chưa nộp bản đơn NCC ký. Báo thiếu ở đây KHÔNG oan, nó
   * đúng tinh thần Sếp chốt cùng ngày: *"PO là chắc chắn có, chỉ là bổ sung sau thôi"*.
   *
   * 📌 Mục 3 (Hợp đồng) giữ nguyên ngăn chung cũ, nên hồ sơ cũ **không mất** tờ đã đính — nó vẫn
   * nằm đúng ở mục 3. Cái mất duy nhất là dấu ✓ mượn ở mục 4, mà dấu ✓ đó vốn sai.
   */
  const tepDonMuaHangCuaMuc4 = tepDonMuaHangNCCKy(deNghi);

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
      /* 🔴 CHỈ NGĂN RIÊNG, KHÔNG mượn tệp của mục 3 — đọc `tepDonMuaHangCuaMuc4` phía trên. */
      tep: tepDonMuaHangCuaMuc4,
      /**
       * 🔴 CHƯA CÓ TỆP THÌ PHẢI CHỈ ĐÚNG CHỖ ĐÍNH, đừng để trống trơn (CLAUDE.md §3.5).
       *
       * 📌 HAI CÂU CHO HAI TÌNH HUỐNG KHÁC HẲN NHAU — gộp một câu là chỉ sai việc phải làm:
       *   · chưa lập đơn nào       → việc phải làm là **lập đơn**, chưa có gì để đi xin bản ký;
       *   · đã lập, chưa có bản ký → việc phải làm là **đòi NCC gửi bản ký về rồi đính vào**.
       *
       * ⚠️ ĐÃ BỎ CÂU THỨ BA (*"đang dùng chung tệp với mục 3…"*) cùng lượt bỏ đường mượn tệp —
       * xem `tepDonMuaHangCuaMuc4`. Không còn ca nào mục 4 bày tệp của mục 3 nữa.
       */
      ghiChu: thieu(
        tepDonMuaHangCuaMuc4.length > 0,
        poCuaDeNghi.length === 0
          ? "Chưa lập đơn mua hàng nào cho đề nghị này."
          : `Đã lập ${poCuaDeNghi.map((po) => po.code).join(", ")} nhưng chưa đính bản đơn mua hàng đã ký, đóng mộc của nhà cung cấp — đính ở ô "${TEN_HIEN_DON_MUA_HANG}" của bước Tiến hành đặt hàng.`,
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
      /* Mỗi lần giao một tờ phiếu — thiếu một lần là thiếu cả mục. Xem `mucDaCo`. */
      moiNhomPhaiCo: true,
      /**
       * 🔴 CÂU CẢNH BÁO PHẢI NÓI ĐÚNG LẦN GIAO NÀO THIẾU (18/09/2026). Trước đó luôn in *"Chưa có
       * phiếu giao nhận nào"* — sai sự thật khi hồ sơ đã có phiếu cho lần 1 và chỉ thiếu lần 2,
       * và người đọc đi tìm nhầm chỗ. `vuongMacXacNhanKho` đã liệt kê *"lần N"* từ lâu; đây là
       * mượn đúng cách nói đó cho khớp hai nơi.
       */
      ghiChu: thieu(
        coPhieuGiao,
        nhomPhieuGiao.length === 0
          ? "Chưa có phiếu giao nhận nào — mỗi lần giao phải đính một phiếu."
          : `Còn ${nhomConThieu.length}/${nhomPhieuGiao.length} lần giao chưa có phiếu giao nhận: ${nhomConThieu
              .map((n) => n.ten)
              .join(" · ")}.`,
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
    /**
     * ★★★ ⑨ ĐÍNH KÈM KHÁC — Sếp 16/09/2026: ***"Cần thiết mở thêm để đính kèm tài liệu khác"***.
     *
     * 🔴 **KHÔNG BAO GIỜ ĐƯỢC `batBuoc: true`.** Mục này là *"Nếu có"* theo đúng danh sách 9 mục
     * Sếp đưa 15/09/2026. Bật lên là `tomTatBoHoSo().tong` nhảy từ 4 lên 5 và **mọi hồ sơ trong
     * app đột nhiên báo còn thiếu một mục** — một chốt lúc nào cũng đỏ thì người dùng bỏ qua cả
     * khối, mất luôn tác dụng của bốn chốt thật.
     *
     * 🔴 NGĂN RIÊNG `BUOC_DINH_KEM_KHAC`, KHÔNG PHẢI `ho_so_thanh_toan` — ba hệ quả đã đo, chép đủ
     * ở chỗ khai hằng số đó trong `chung-tu-cuoi-quy-trinh.ts`. Nặng nhất: nút *"Gỡ"* của khu tự do
     * sẽ **xoá được Hoá đơn VAT thật**, và mất hoá đơn là hồ sơ không đóng được nữa.
     *
     * 📌 KHÔNG CÓ `ghiChu` KHI TRỐNG — cố ý. Mục "Nếu có" mà in một câu "chưa có" vào mọi hồ sơ là
     * dựng lời nhắc cho việc không ai phải làm (cùng lý do đã ghi ở nhóm phiếu giao hàng phòng ban).
     */
    {
      stt: 9,
      ma: "dinh_kem_khac",
      ten: "Đính kèm khác",
      batBuoc: false,
      tep: tepDinhKemKhac(deNghi),
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
