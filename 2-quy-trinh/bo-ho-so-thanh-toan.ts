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

import type { DeNghiMuaHang, DonDatHang, MoTaTep, PhieuNhanHang } from "@/3-du-lieu/kieu-du-lieu";
import { tepBaoGiaDaCo, tepSoSanh } from "@/2-quy-trinh/bao-gia-dinh-kem";
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
  /** Câu nói rõ mục này đang thiếu gì / lấy ở bước nào. Rỗng khi đã đủ. */
  ghiChu?: string;
}

/** Mục đã có chứng từ chưa — tính CẢ tệp tải lên lẫn chứng từ app tự sinh. */
export function mucDaCo(m: MucHoSoThanhToan): boolean {
  return m.tep.length > 0 || (m.chungTuTrongApp?.length ?? 0) > 0;
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
): MucHoSoThanhToan[] {
  /* ① PHIẾU ĐỀ NGHỊ — hồ sơ đầu vào do bộ phận đề xuất gửi kèm (`taiLieu`).
     ⚠️ KHÔNG dùng `taiLieuNgoai`: đó là con trỏ tới bản gốc nằm NGOÀI app (thư mục chung của
     phòng), không phải bản sao trong app — đẩy sang Kế toán một đường dẫn họ không mở được thì
     vô ích. Xem chú thích ở `kieu-du-lieu.ts`. */
  const phieuDeNghi = deNghi.taiLieu ?? [];

  /* ② BÁO GIÁ NCC — gồm cả BẢNG SO SÁNH, vì đó là căn cứ chọn nhà cung cấp. Kế toán đối chiếu
     giá trên hóa đơn với giá đã duyệt thì cần cả hai. */
  const bangSoSanh = tepSoSanh(deNghi);
  const baoGia = [
    ...tepBaoGiaDaCo(deNghi),
    ...(bangSoSanh && !tepBaoGiaDaCo(deNghi).some((t) => t.id === bangSoSanh.id)
      ? [bangSoSanh]
      : []),
  ];

  /* ⑤ PHIẾU GIAO HÀNG — mỗi lần giao một phiếu riêng (luật 11/08/2026), nên gom TẤT CẢ.
     ⚠️ Không lọc theo trạng thái phiếu: phiếu còn chờ kiểm tra vẫn là chứng từ đã giao. Việc
     "chỉ tính khối lượng của phiếu đã nhập kho" là luật về KHỐI LƯỢNG, không phải về chứng từ. */
  const phieuGiao = phieuCuaDeNghi
    .map((p) => p.tepPhieuGiao)
    .filter((t): t is MoTaTep => Boolean(t));

  /* ⑥ HOÁ ĐƠN / UCN — Ban lãnh đạo viết "Hoá đơn / UCN"; trong app là Hóa đơn VAT và Ủy nhiệm
     chi, gộp lại đúng như bước ⑦ đang gộp. */
  const hoaDonUnc = [...tepHoaDonVAT(deNghi), ...tepUNC(deNghi)];

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
      tep: baoGia,
      ghiChu: thieu(baoGia.length > 0, "Chưa có bản báo giá nào — đính ở bước Yêu cầu NCC báo giá."),
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
      tep: hoaDonUnc,
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
