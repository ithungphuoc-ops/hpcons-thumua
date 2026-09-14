// ============================================================
// BỘ HỒ SƠ THANH TOÁN — bảy mục, gom từ MỌI bước của quy trình
//
// ★★ Ban lãnh đạo 26/08/2026: *"Tạo thêm 1 trường 'Kết quả'. Sẽ được link kết quả từ các bước
//    trên. Bộ hồ sơ đầy đủ gồm: 1. Phiếu đề nghị · 2. Báo giá NCC · 3. Đơn mua hàng (PO) ·
//    4. Hợp đồng mua bán/thoả thuận mua hàng · 5. Phiếu giao hàng · 6. Hoá đơn/UCN (nếu có) ·
//    7. Phiếu chi (nếu có)"* — và nói rõ mục đích: *"để sau này có thể lấy dữ liệu này đẩy qua
//    app kế toán"*.
//
// 🔴 GOM BẰNG THAM CHIẾU, KHÔNG SAO CHÉP TỆP. Mỗi mục dưới đây trỏ tới đúng những tệp đã đính ở
//    bước của nó. Nếu ở đây lại cho đính kèm lần nữa thì cùng một chứng từ có hai bản trong hồ
//    sơ, và không ai biết bản nào là bản đúng khi hai bản khác nhau.
//
// 🔴 HÀM THUẦN — không đọc kho dữ liệu, không đụng giao diện. Đó là điều kiện để sau này cửa API
//    đẩy sang app Kế toán gọi được cùng một hàm mà giao diện đang dùng: hai bên KHÔNG THỂ lệch
//    nhau. Nếu tính lại ở tầng API thì sớm muộn màn hình nói một bộ, dữ liệu đẩy đi một bộ khác.
//
// ⚠️ BẢY MỤC NÀY LÀ DANH SÁCH CỦA BAN LÃNH ĐẠO, không phải suy ra từ dữ liệu app đang có. Mục 7
//    (Phiếu chi) trước 26/08/2026 app CHƯA CÓ chỗ đính — đã thêm ô mới ở bước ⑦, xem
//    `NHAN_TEP_PHIEU_CHI` trong `chung-tu-cuoi-quy-trinh.ts`. Đừng bỏ mục nào vì "app chưa có":
//    thiếu mục thì bộ hồ sơ đẩy sang Kế toán hụt chứng từ mà không có gì báo.
// ============================================================

import type { BaoGia, DeNghiMuaHang, DonDatHang, MoTaTep, PhieuNhanHang } from "@/3-du-lieu/kieu-du-lieu";
import { tepBaoGiaDaCo, tepBaoGiaDaDuyet, tepSoSanh } from "@/2-quy-trinh/bao-gia-dinh-kem";
import {
  tepHoaDonVAT,
  tepHopDong,
  tepPhieuChi,
  tepUNC,
  TEN_HIEN_HOP_DONG,
} from "@/2-quy-trinh/chung-tu-cuoi-quy-trinh";
/* 📌 DÙNG LẠI hàm dựng đường dẫn App Request thay vì tự `trim()` lại ở đây: chỉ cần biết hồ sơ
   này có tra được bản gốc bên đó hay không. Hai chỗ cùng tự đoán một câu hỏi là hai câu trả lời
   — và chỗ này sẽ lặng lẽ lệch với ô "Đường dẫn đề nghị" ở trang chi tiết. */
import { duongDanHoSoAppRequest } from "@/6-tien-ich/dia-chi-app-de-nghi";

/** Mã máy đọc được của từng mục — dùng làm khóa khi đẩy sang app Kế toán. */
export type MaMucHoSo =
  | "phieu_de_nghi"
  | "bao_gia_ncc"
  | "don_mua_hang"
  | "hop_dong"
  | "phieu_giao_hang"
  | "hoa_don_unc"
  | "phieu_chi";

export interface MucHoSoThanhToan {
  /** Số thứ tự đúng như Ban lãnh đạo liệt kê (1..7) — giữ để đối chiếu với chỉ đạo. */
  stt: number;
  ma: MaMucHoSo;
  ten: string;
  /**
   * Mục này bắt buộc phải có mới đủ hồ sơ hay không.
   *
   * 📌 Theo đúng chữ Ban lãnh đạo: mục 6 và 7 ghi *"(nếu có)"* nên KHÔNG bắt buộc.
   *
   * 📌 Mục 1 (Phiếu đề nghị) THÔI bắt buộc từ 13/09/2026 — Ban lãnh đạo: *"Ko cần đề xuất, vì đã
   * có link tới đề xuất rồi, nên mục này ko cần báo đỏ"*. Lý do đầy đủ ở khối ★★ mục ① trong
   * `dungBoHoSoThanhToan` — đọc trước khi định bật lại.
   *
   * 👉 Còn BẮT BUỘC bốn mục: 2 (báo giá NCC), 3 (đơn mua hàng), 4 (hợp đồng), 5 (phiếu giao
   * hàng) — đó là chứng từ chứng minh việc mua đã diễn ra thật.
   */
  batBuoc: boolean;
  /** Tệp của mục này — MẢNG RỖNG nghĩa là chưa có. */
  tep: MoTaTep[];
  /**
   * Chứng từ nằm TRONG app, không phải tệp tải lên (mục 3 — Đơn mua hàng).
   *
   * 🔴 VÌ SAO PHẢI CÓ TRƯỜNG NÀY: tờ PO do app sinh ra, không ai tải nó lên. Nếu chỉ đếm `tep`
   * thì mục 3 luôn hiện "chưa có" dù đơn đã lập xong — và bộ hồ sơ đẩy sang Kế toán sẽ thiếu
   * đúng chứng từ trung tâm.
   */
  chungTuTrongApp?: { ma: string; duongDanIn: string }[];
  /**
   * ★★ NHÓM BÊN TRONG MỘT MỤC — Ban lãnh đạo 26/08/2026: *"Tạo group lại nhé"*.
   *
   * 🔴 VÌ SAO CẦN: mục 2 phải phân biệt **bản báo giá được chọn** với **bảng so sánh** — hai thứ
   * khác hẳn nhau về vai trò khi Kế toán đối chiếu (một là giá đã cam kết, một là căn cứ chọn).
   * Đổ chung một danh sách thì họ phải tự đoán tệp nào là tệp nào, mà tên tệp là dãy số do máy
   * sinh nên đoán không nổi.
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
 * ⚠️ Phải đếm cả `nhom`: từ 26/08/2026 mục 2 và mục 6 để tệp trong nhóm và `tep` rỗng. Quên
 * nhánh này là hai mục đó luôn hiện "chưa có" dù đã đủ chứng từ.
 */
export function mucDaCo(m: MucHoSoThanhToan): boolean {
  return (
    m.tep.length > 0 ||
    (m.chungTuTrongApp?.length ?? 0) > 0 ||
    (m.nhom ?? []).some((n) => n.tep.length > 0)
  );
}

/**
 * ★ BẢY MỤC CỦA BỘ HỒ SƠ THANH TOÁN.
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
  const coDuongDanAppRequest = duongDanHoSoAppRequest(deNghi.idHoSoAppRequest) !== null;
  const soTepBenAppRequest = deNghi.taiLieuAppRequest?.length ?? 0;
  /* 🔴 NHẬN RA "ĐẾN TỪ APP REQUEST" BẰNG CẢ BA DẤU VẾT, không chỉ một: hồ sơ về trước 13/09/2026
     thiếu `idHoSoAppRequest`, và vẫn còn khả năng một hồ sơ chỉ còn lại danh mục tệp. Nhận nhầm
     hồ sơ bên đó thành "lập tay trong app" là in ra một câu chỉ SAI CHỖ tìm bản gốc — tệ hơn
     không nói gì, vì người đọc sẽ tin. */
  const denTuAppRequest =
    coDuongDanAppRequest || Boolean(deNghi.maDeXuatAppRequest) || soTepBenAppRequest > 0;
  const cauBanGocPhieuDeNghi = [
    coDuongDanAppRequest
      ? 'Bản gốc nằm bên App Request — mở bằng ô "Đường dẫn đề nghị" ở khối Thông tin đề nghị.'
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

  /* ⑤ PHIẾU GIAO HÀNG — mỗi lần giao một phiếu riêng (luật 11/08/2026), nên gom TẤT CẢ.
     ⚠️ Không lọc theo trạng thái phiếu: phiếu còn chờ kiểm tra vẫn là chứng từ đã giao. Việc
     "chỉ tính khối lượng của phiếu đã nhập kho" là luật về KHỐI LƯỢNG, không phải về chứng từ. */
  const phieuGiao = phieuCuaDeNghi
    .map((p) => p.tepPhieuGiao)
    .filter((t): t is MoTaTep => Boolean(t));

  /**
   * ⑥ HOÁ ĐƠN / UCN — TÁCH HAI NHÓM (Ban lãnh đạo 26/08/2026: *"Tạo group lại nhé"*).
   *
   * 🔴 Ban lãnh đạo viết *"Hoá đơn / UCN"* thành một mục, nhưng đó là **hai chứng từ khác bản
   * chất**: hóa đơn VAT là chứng từ thuế, ủy nhiệm chi là lệnh trả tiền. Gộp thành một danh sách
   * thì Kế toán phải mở từng tệp mới biết đâu là đâu — tên tệp là dãy số do máy sinh.
   */
  const nhomHoaDon: { ten: string; tep: MoTaTep[]; ghiChu?: string }[] = [
    { ten: "Hóa đơn VAT", tep: tepHoaDonVAT(deNghi) },
    { ten: "Ủy nhiệm chi", tep: tepUNC(deNghi) },
  ];

  const thieu = (co: boolean, cau: string) => (co ? undefined : cau);

  return [
    {
      stt: 1,
      ma: "phieu_de_nghi",
      ten: "Phiếu đề nghị",
      /* 🔴 KHÔNG bắt buộc từ 13/09/2026 (Sếp) — lý do đầy đủ ở khối ★★ mục ① phía trên. */
      batBuoc: false,
      tep: phieuDeNghi,
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
    {
      stt: 3,
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
      stt: 4,
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
      stt: 5,
      ma: "phieu_giao_hang",
      ten: "Phiếu giao hàng",
      batBuoc: true,
      tep: phieuGiao,
      ghiChu: thieu(
        phieuGiao.length > 0,
        "Chưa có phiếu giao nhận nào — mỗi lần giao phải đính một phiếu.",
      ),
    },
    {
      stt: 6,
      ma: "hoa_don_unc",
      ten: "Hoá đơn / Ủy nhiệm chi",
      /* Ban lãnh đạo ghi "(nếu có)" nên KHÔNG bắt buộc ở đây.
         ⚠️ Riêng HÓA ĐƠN VAT vẫn là điều kiện BẮT BUỘC để duyệt hoàn thành — luật đó nằm ở
         `vuongMacDuyetHoanThanhDeNghi`, đừng đọc dòng này thành "hóa đơn không cần thiết". */
      batBuoc: false,
      /* `tep` rong vi dung `nhom` — xem chu thich o khai bao `nhom`. */
      tep: [],
      nhom: nhomHoaDon,
    },
    {
      stt: 7,
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
