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
   * 📌 Theo đúng chữ Ban lãnh đạo: mục 6 và 7 ghi *"(nếu có)"* nên KHÔNG bắt buộc. Bốn mục đầu
   * và phiếu giao hàng là bắt buộc — đó là chứng từ chứng minh việc mua đã diễn ra thật.
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
      batBuoc: true,
      tep: phieuDeNghi,
      ghiChu: thieu(
        phieuDeNghi.length > 0,
        "Chưa có tệp hồ sơ đầu vào — bộ phận đề xuất gửi kèm khi tạo đề nghị.",
      ),
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
 * ★ Câu tóm tắt cho nhãn khối — "đủ 5/5 mục bắt buộc" hoặc "còn thiếu …".
 *
 * 📌 Chỉ đếm mục BẮT BUỘC. Đếm cả mục "(nếu có)" thì hồ sơ nào cũng hiện thiếu, và người dùng
 * sẽ bỏ qua lời nhắc — chốt mất tin cậy còn tệ hơn không có chốt.
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
