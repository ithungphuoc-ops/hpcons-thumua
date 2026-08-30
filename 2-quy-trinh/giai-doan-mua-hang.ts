// ============================================================
// GIAI ĐOẠN MUA HÀNG — 8 cột của bảng quy trình (dạng Kanban)
//
// Đặt theo đúng quy trình đang chạy thật trên Base.vn của công ty
// ("TM-QT Mua hàng (HP CONS)"), Ban lãnh đạo cung cấp ngày 06/08/2026:
//
//   1 Tiếp nhận và kiểm tra → 2 Yêu cầu NCC báo giá → 3 Xét duyệt báo giá
//   → 4 Lập đơn mua hàng → 5 Tiến hành đặt hàng → 6 Tiến hành nhận hàng
//   → 7 Hoàn thành   ·   Thất bại (nhánh dừng)
//
// 🔴 NGUYÊN TẮC: giai đoạn KHÔNG phải một trường lưu trong dữ liệu.
// Nó được SUY RA từ chứng từ có thật (báo giá · đơn đặt hàng · phiếu nhận hàng).
// Lưu thành trường riêng sẽ tạo ra nguồn sự thật thứ hai: kéo thẻ sang cột
// "Tiến hành nhận hàng" trong khi chưa có phiếu nhận nào thì bảng báo tiến độ ảo.
// Muốn thẻ sang cột mới thì phải làm đúng nghiệp vụ của cột đó.
// ============================================================

import type {
  BaoGia,
  DeNghiMuaHang,
  DonDatHang,
  PhieuNhanHang,
  TienDoDongDeNghi,
} from "@/3-du-lieu/kieu-du-lieu";
import type { Tong } from "@/2-quy-trinh/trang-thai";
import { soSanhDeNghiUuTien, soSanhDonHangUuTien } from "@/2-quy-trinh/sap-xep-uu-tien";
import {
  caiDatCuaBuoc,
  type CauHinhQuyTrinh,
  type CongViecGiaiDoan,
} from "@/2-quy-trinh/cau-hinh-quy-trinh";
// Luật đối chiếu khối lượng đã lên đơn — dùng lại, không tự cộng ở đây.
// (`tinh-toan.ts` chỉ import kiểu dữ liệu nên không tạo vòng import.)
import { tinhTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
// Luật ba chứng từ cuối quy trình (hợp đồng · hóa đơn VAT · UNC) — một chỗ duy nhất.
import {
  coHoaDonVAT,
  /**
   * ⚠️ `coHopDong` CHỈ ĐƯỢC DÙNG TRONG `conNoCuaBuoc` (viền đỏ "còn nợ chứng từ").
   *
   * 🔴 TUYỆT ĐỐI KHÔNG dùng nó để trả lời *"đã rời được bước ④ chưa"* — câu đó chỉ có MỘT nơi
   * trả lời là `vuongMacRoiBuocLapDon` (tệp HOẶC lý do). Dùng lẫn là dựng lại đúng cái bẫy ngày
   * 23/08/2026: thẻ kẹt lại cột ④ dù nút chuyển bước đã mở, không lỗi nào báo.
   */
  coHopDong,
  lyDoThieuHopDong,
  NHAN_TEP_HOA_DON_VAT,
  TEN_HIEN_HOP_DONG,
  vuongMacRoiBuocLapDon,
  vuongMacTichXongUNC,
} from "@/2-quy-trinh/chung-tu-cuoi-quy-trinh";
import { daysUntil } from "@/6-tien-ich/dinh-dang";

export type GiaiDoanMuaHang =
  | "tiep_nhan"
  | "yeu_cau_bao_gia"
  | "xet_duyet_bao_gia"
  | "lap_don_mua_hang"
  | "dat_hang"
  | "nhan_hang"
  /**
   * ★ HỒ SƠ THANH TOÁN — một bước, chèn NGAY SAU "Tiến hành nhận hàng".
   *
   * 📌 Ban lãnh đạo 22/08/2026 đặt ra hai bước riêng (`hoa_don_vat` và `unc`), rồi 23/08/2026
   * chốt **gộp lại một**: *"Gộp 2 mục này lại thành 1 'Hồ sơ thanh toán'"*. Hợp lý về nghiệp vụ —
   * hóa đơn VAT và ủy nhiệm chi là hai chứng từ của CÙNG một việc: hoàn tất hồ sơ để trả tiền.
   *
   * Luật bên trong KHÔNG đổi, chỉ gộp chỗ hiển thị:
   *   · hóa đơn VAT **bắt buộc** mới duyệt hoàn thành được;
   *   · ủy nhiệm chi **tùy có**, nhưng chỉ tích xong được sau khi đã có hóa đơn VAT.
   *
   * 📌 Vẫn đúng nguyên tắc "giai đoạn suy ra từ chứng từ có thật": bước này xong khi có TỆP hóa
   * đơn VAT đính kèm, không phải khi ai đó gõ một trạng thái.
   */
  | "ho_so_thanh_toan"
  | "hoan_thanh"
  | "that_bai";

export interface MoTaGiaiDoan {
  ma: GiaiDoanMuaHang;
  /** Nhãn cột — giữ nguyên chữ đang dùng trên Base để người quen việc không phải học lại. */
  nhan: string;
  /** Câu giải thích ngắn: đứng ở cột này nghĩa là đang chờ việc gì. */
  moTa: string;
  tong: Tong;
}

/** Thứ tự trong mảng này CHÍNH LÀ thứ tự cột trên bảng. */
export const GIAI_DOAN_MUA_HANG: MoTaGiaiDoan[] = [
  {
    ma: "tiep_nhan",
    nhan: "Tiếp nhận và kiểm tra",
    moTa: "Đề nghị đã duyệt, thu mua đang kiểm tra và phân bổ người phụ trách",
    tong: "neutral",
  },
  {
    ma: "yeu_cau_bao_gia",
    nhan: "Yêu cầu NCC báo giá",
    // Từ 13/08/2026 thẻ vào cột này ngay khi phân bổ đủ người, chưa cần có bảng báo giá —
    // nên câu mô tả phải nói đúng việc đang chờ: nhân viên đi hỏi giá.
    moTa: "Đã giao việc, nhân viên đang liên hệ nhà cung cấp lấy báo giá",
    tong: "warning",
  },
  {
    ma: "xet_duyet_bao_gia",
    nhan: "Xét duyệt báo giá",
    moTa: "Đã có đủ giá, đang so sánh và trình duyệt chọn nhà cung cấp",
    tong: "warning",
  },
  {
    ma: "lap_don_mua_hang",
    nhan: "Lập đơn mua hàng",
    moTa: "Đã chốt nhà cung cấp, đang lập đơn đặt hàng",
    tong: "primary",
  },
  {
    ma: "dat_hang",
    nhan: "Tiến hành đặt hàng",
    moTa: "Đơn đã chốt và gửi nhà cung cấp, chờ giao hàng",
    tong: "primary",
  },
  {
    ma: "nhan_hang",
    nhan: "Tiến hành nhận hàng",
    moTa: "Hàng đang về, thủ kho ghi nhận từng lần giao",
    tong: "primary",
  },
  {
    ma: "ho_so_thanh_toan",
    nhan: "Hồ sơ thanh toán",
    // Nói rõ cái nào bắt buộc, cái nào không — nếu không, người nhìn bảng tưởng mọi đơn đều phải
    // có ủy nhiệm chi mới xong được.
    moTa: "Đã nhận đủ hàng — chờ hóa đơn VAT (bắt buộc) và ủy nhiệm chi nếu đơn này cần",
    tong: "warning",
  },
  {
    ma: "hoan_thanh",
    nhan: "Hoàn thành",
    moTa: "Đã nhận đủ, có hóa đơn VAT, kho và trưởng bộ phận đã xác nhận",
    tong: "success",
  },
  {
    ma: "that_bai",
    nhan: "Thất bại",
    moTa: "Đề nghị bị đóng dở hoặc hủy, không mua tiếp",
    tong: "danger",
  },
];

export const NHAN_GIAI_DOAN: Record<GiaiDoanMuaHang, MoTaGiaiDoan> = Object.fromEntries(
  GIAI_DOAN_MUA_HANG.map((g) => [g.ma, g]),
) as Record<GiaiDoanMuaHang, MoTaGiaiDoan>;

// ------------------------------------------------------------
// SUY RA GIAI ĐOẠN
// ------------------------------------------------------------

/**
 * Đề nghị đang ở cột nào. Xét từ giai đoạn XA NHẤT trở về, vì một đề nghị
 * có thể vừa còn báo giá dở vừa đã có đơn hàng đang giao — khi đó nó thuộc
 * về giai đoạn đi xa nhất, đúng như cách bảng Base đang chạy.
 */
export function xacDinhGiaiDoan(
  deNghi: DeNghiMuaHang,
  tatCaPO: DonDatHang[],
  tatCaBaoGia: BaoGia[],
  tatCaPhieu: PhieuNhanHang[],
): GiaiDoanMuaHang {
  if (deNghi.trangThai === "dong_do") return "that_bai";

  const poCuaDeNghi = tatCaPO.filter((po) => po.prId === deNghi.id && po.trangThai !== "huy");

  /**
   * ⑧ HOÀN THÀNH — CHỈ KHI CÓ NGƯỜI BẤM NÚT "Hoàn thành quy trình". KHÔNG tự suy ra.
   *
   * 🔴🔴 SỬA 27/08/2026 — Ban lãnh đạo báo lỗi: *"Sao chỉ mới xác nhận nhận đủ hàng mà đã nhảy
   * qua bước này rồi. Việc xác nhận đó mới chỉ là hoàn thành công việc của bước tiến hành nhận
   * hàng thôi. Và chỉ được đẩy qua bước hồ sơ thanh toán. Khi nào bổ sung đủ điều kiện của bước
   * HSTT thì mới được đẩy qua hoàn thành"*.
   *
   * ĐÃ BỎ nhánh tự suy: *"mọi đơn của đề nghị đều `hoan_thanh` và không còn dòng nào chưa lên
   * đơn → trả `hoan_thanh`"*.
   *
   * 🔴 VÌ SAO NHÁNH ĐÓ THÀNH SAI — ĐÂY LÀ HẬU QUẢ DÂY CHUYỀN, GHI LẠI ĐỂ KHÔNG LẶP:
   * Nhánh đó vốn an toàn vì trước đây một đơn CHỈ hoàn thành được khi đã có hoá đơn VAT — điều
   * kiện nằm ở nút "Xác nhận hoàn thành đơn". Cùng ngày 27/08/2026, theo chỉ đạo *"Phần xác nhận
   * đơn hàng này chỉ cần có đính kèm phiếu giao hàng là được xác nhận hoàn thành"*, điều kiện hoá
   * đơn bị gỡ khỏi nút đó. Từ giây phút ấy `po.trangThai = "hoan_thanh"` chỉ còn nghĩa **hàng đã
   * về đủ và có phiếu giao nhận** — không còn nói gì về hồ sơ thanh toán. Nhánh tự suy vẫn đọc nó
   * như cũ, nên đề nghị nhảy thẳng sang cột Hoàn thành trong khi còn thiếu hoá đơn VAT, thiếu
   * hợp đồng và còn một việc chưa xong (đúng ba cờ đỏ trên thẻ Ban lãnh đạo chụp).
   *
   * 👉 BÀI HỌC: đổi Ý NGHĨA của một trạng thái thì phải soát MỌI nơi đọc trạng thái đó, không chỉ
   * nơi ghi. Sửa ở cổng ghi mà quên chỗ đọc thì lỗi hiện ra ở một màn hình khác hẳn.
   *
   * ✅ Nay chỉ còn MỘT đường vào cột Hoàn thành: `deNghi.trangThai === "hoan_thanh"`, do nút
   * "Hoàn thành quy trình" đặt — và nút đó đi qua `vuongMacHoanThanhQuyTrinh`, nơi vẫn đòi đủ
   * hoá đơn VAT, đã tích UNC, hàng về đủ, không còn dòng chưa lên đơn.
   *
   * 📌 Mọi đơn xong mà chưa ai bấm nút thì thẻ RƠI XUỐNG nhánh `ho_so_thanh_toan` ngay dưới —
   * đúng chỗ Ban lãnh đạo nói: *"chỉ được đẩy qua bước hồ sơ thanh toán"*.
   */
  if (deNghi.trangThai === "hoan_thanh") return "hoan_thanh";

  /**
   * ⑦ HỒ SƠ THANH TOÁN — hóa đơn VAT (bắt buộc) + ủy nhiệm chi (nếu có).
   *
   * 🔴 ĐIỀU KIỆN VÀO LÀ "HÀNG ĐÃ VỀ ĐỦ", KHÔNG PHẢI "ĐƠN ĐÃ HOÀN THÀNH". Đây là chỗ dễ làm sai
   * nhất và nếu sai thì kẹt vĩnh viễn:
   *   · Trưởng bộ phận chỉ được duyệt hoàn thành khi ĐÃ CÓ hóa đơn VAT (chỉ đạo của Sếp).
   *   · Mà hóa đơn VAT lại đính kèm ở chính hai cột này.
   *   → Nếu hai cột chỉ hiện SAU khi đơn hoàn thành thì không bao giờ có chỗ để bỏ hóa đơn vào,
   *     và không đơn nào hoàn thành được nữa. Vòng tròn khép kín.
   * Nên: hàng về đủ là hai cột mở ra ngay, người lập bỏ hóa đơn vào, rồi trưởng bộ phận mới duyệt.
   *
   * ⚠️ ĐỨNG TRƯỚC NHÁNH `nhan_hang` bên dưới. Đảo lại là `daCoPhieuNhan` bắt trước và thẻ nằm
   * mãi ở cột "Tiến hành nhận hàng" dù hàng đã về đủ — hai cột mới rỗng vĩnh viễn mà không một
   * dòng lỗi nào.
   *
   * 📌 Chứng từ xong cả mà đơn chưa được xác nhận thì thẻ ĐỨNG LẠI Ở CỘT "UNC": đó là trạm cuối
   * trước Hoàn thành, và nút duyệt hoàn thành nằm ở đó. Trả về `hoan_thanh` lúc này là báo xong
   * trước khi có ai duyệt.
   */
  if (poCuaDeNghi.length > 0) {
    const tienDoDong = tinhTienDoDeNghi(deNghi, tatCaPO, tatCaPhieu);
    const daVeDu =
      tienDoDong.length > 0 &&
      tienDoDong.every((d) => d.khoiLuongChuaLenPO <= 0 && d.khoiLuongConLai <= 0);
    if (daVeDu) {
      return "ho_so_thanh_toan";
    }
  }

  // ⑥ Tiến hành nhận hàng — đã có hàng về, hoặc đơn đã chuyển sang trạng thái đang giao.
  const daCoPhieuNhan = tatCaPhieu.some((p) => poCuaDeNghi.some((po) => po.id === p.poId));
  const dangGiao = poCuaDeNghi.some(
    (po) => po.trangThai === "dang_giao" || po.trangThai === "cho_xac_nhan_hoan_thanh",
  );
  if (daCoPhieuNhan || dangGiao) return "nhan_hang";

  /**
   * ⑤ Tiến hành đặt hàng — đơn đã chốt, chưa có hàng nào về.
   *
   * ★ TỪ 22/08/2026 PHẢI CÓ TỆP HỢP ĐỒNG MỚI RỜI ĐƯỢC BƯỚC ④ — Ban lãnh đạo: *"thêm cho 1 trường
   * đính kèm Hợp đồng ở mục kết quả và phải có đính kèm thì mới cho chuyển bước"*.
   *
   * ★ TỪ 23/08/2026 CHẤP NHẬN ĐƯỜNG THỨ HAI: chưa có tệp thì **ghi lý do** cũng đi tiếp được
   * (Ban lãnh đạo: *"bắt buộc có file đính kèm hoặc ghi chú lý do không đính kèm file thì mới cho
   * chuyển bước"*).
   *
   * 🔴🔴 GỌI `vuongMacRoiBuocLapDon`, TUYỆT ĐỐI KHÔNG GỌI `coHopDong` Ở ĐÂY.
   * Đây là lỗi tôi vừa gây ra và Ban lãnh đạo bắt được ngay trong ngày: sáng 23/08 tôi nới luật
   * trong `vuongMacRoiBuocLapDon` (tệp HOẶC lý do) nhưng **để nguyên `coHopDong` ở dòng này**. Hai
   * chỗ cùng trả lời một câu hỏi *"đã rời được bước ④ chưa"* mà nói khác nhau, nên: hộp xác nhận
   * cho kéo thẻ đi, nút chuyển bước mở, mà **thẻ vẫn nằm lại cột ④** — Ban lãnh đạo hỏi *"Sao đã
   * tạo PO xong vẫn chưa tự động chuyển qua bước đặt hàng"*. Không một dòng lỗi nào báo.
   *
   * 🔴🔴 TỪ 24/08/2026 KHÔNG GIỮ THẺ LẠI CỘT ④ VÌ THIẾU HỢP ĐỒNG NỮA — Ban lãnh đạo: *"Hợp đồng
   * mua hàng em đưa sang bước tiến hành đặt hàng"*.
   *
   * Hợp đồng nay là chứng từ của **bước ⑤**, nên đòi nó để RỜI bước ④ là vô nghĩa: đơn đã chốt
   * thì việc của bước ④ đã xong. Giữ lại là dựng đúng cái vòng tròn mà chú thích cũ (còn ở dưới)
   * đã cảnh báo — hợp đồng ghi số đơn hàng, mà số đơn chỉ sinh khi cất đơn.
   *
   * 📌 VẪN KHÔNG MẤT DẤU NỢ CHỨNG TỪ: thẻ sang cột ⑤ nhưng `mucConNoCuaBuoc` tô đỏ "thiếu HĐ" ở
   * đúng bước ⑤, và `vuongMacSangBuocSau` chặn rời ⑤ khi chưa có tệp lẫn lý do. Nợ chuyển theo
   * chứng từ, không biến mất.
   *
   * ⚠️ GHI LẠI BÀI HỌC CŨ ĐỂ KHÔNG TÁI DIỄN: sáng 23/08 tôi nới luật trong
   * `vuongMacRoiBuocLapDon` nhưng để nguyên `coHopDong` ở chính dòng này — hai chỗ cùng trả lời
   * *"đã rời được bước ④ chưa"* mà nói khác nhau, nên hộp xác nhận cho kéo đi, nút mở, mà thẻ vẫn
   * nằm lại cột ④. Ban lãnh đạo hỏi *"Sao đã tạo PO xong vẫn chưa tự động chuyển qua bước đặt
   * hàng"*, và không một dòng lỗi nào báo.
   *
   * ⚠️ Nhánh `nhan_hang` ở TRÊN vẫn thắng: hàng đã về thật thì thẻ phải sang cột nhận hàng dù
   * hồ sơ còn thiếu hợp đồng. Tiến độ thực tế không được giấu đi vì thiếu giấy tờ — thiếu giấy
   * thì nhắc, chứ không báo sai chỗ hàng đang ở đâu.
   */
  if (poCuaDeNghi.some((po) => po.trangThai === "da_chot")) return "dat_hang";

  // ④ Lập đơn mua hàng — đang có đơn nháp, hoặc đã chọn NCC mà chưa lên đơn.
  if (poCuaDeNghi.some((po) => po.trangThai === "nhap")) return "lap_don_mua_hang";

  const baoGiaCuaDeNghi = tatCaBaoGia.filter((bg) => bg.prId === deNghi.id && bg.trangThai !== "huy");
  if (baoGiaCuaDeNghi.some((bg) => bg.trangThai === "da_chon_ncc")) return "lap_don_mua_hang";

  // ③ Xét duyệt báo giá · ② Yêu cầu NCC báo giá
  if (baoGiaCuaDeNghi.some((bg) => bg.trangThai === "da_so_sanh")) return "xet_duyet_bao_gia";
  if (baoGiaCuaDeNghi.some((bg) => bg.trangThai === "dang_thu_thap")) return "yeu_cau_bao_gia";

  /**
   * ② PHÂN BỔ XONG CŨNG LÀ SANG BƯỚC 2 — Ban lãnh đạo 13/08/2026: *"các việc này trưởng bộ
   * phận đã giao việc xong nhưng vẫn chưa tự động nhảy qua bước 2"*.
   *
   * 🔴 Trước đó thẻ chỉ rời cột ① khi có bảng báo giá. Nhưng chính mô tả cột ① là *"thu mua
   * đang kiểm tra và **phân bổ người phụ trách**"* — phân bổ xong là hết việc của cột đó.
   * Để thẻ nằm lại là bảng nói sai: trưởng bộ phận nhìn vào tưởng còn phải giao việc, mà
   * việc đã giao rồi; còn nhân viên đang đi hỏi giá thì không thấy phần việc của mình ở
   * đâu trên bảng.
   *
   * ⚠️ PHẢI ĐỦ MỌI DÒNG. Phân bổ một phần thì trưởng bộ phận vẫn còn việc ở cột ① — nhảy
   * cột sớm là những dòng chưa ai làm biến mất khỏi tầm mắt người có trách nhiệm giao.
   *
   * 📌 Vẫn đúng nguyên tắc "suy ra từ chứng từ có thật": người phụ trách được ghi vào dòng
   * đề nghị khi trưởng bộ phận bấm giao việc, không phải một trường trạng thái gõ tay.
   */
  const daPhanBoDu =
    deNghi.items.length > 0 && deNghi.items.every((d) => Boolean(d.nguoiPhuTrachUid));
  if (daPhanBoDu) return "yeu_cau_bao_gia";

  // ① Chưa phát sinh chứng từ nào, và còn dòng chưa có người phụ trách.
  return "tiep_nhan";
}

/** Giai đoạn đã kết thúc thì không còn tính hạn xử lý nữa. */
export function giaiDoanDaKetThuc(giaiDoan: GiaiDoanMuaHang): boolean {
  return giaiDoan === "hoan_thanh" || giaiDoan === "that_bai";
}

/**
 * AI CẦN XỬ LÝ BƯỚC NÀY — dùng cho dòng "Gửi tới" của thông báo chuyển bước.
 *
 * 🔴 Ban lãnh đạo bắt lỗi 11/08/2026: *"sao cấp trưởng phòng giao việc lại hiện thông báo như
 * vậy"*. Chuông đang ghi *"Gửi tới: Phạm Văn F"* — mà Phạm Văn F là NGƯỜI ĐỀ NGHỊ bên Phòng
 * Thi công, không phải người thu mua. Nguyên nhân: chỗ sinh thông báo lấy thẳng
 * `dn.nguoiTheoDoi`, tức danh sách người THEO DÕI, gán vào ô "Gửi tới".
 *
 * Sai ở hai mặt: người cần hành động (trưởng bộ phận / nhân viên phụ trách) thì không có tên,
 * còn người không làm gì được lại bị nêu như thể việc của họ.
 *
 * 📌 Trả về NHÃN VAI TRÒ ở bước ① vì lúc đó chưa ai được phân công — không thể nêu tên cụ thể.
 * Từ bước ② trở đi thì nêu đúng tên người phụ trách các dòng.
 */
export function nguoiCanXuLy(deNghi: DeNghiMuaHang, buoc: GiaiDoanMuaHang): string[] {
  if (buoc === "tiep_nhan") return ["Trưởng bộ phận Thu mua"];
  if (giaiDoanDaKetThuc(buoc)) return [];
  const ten = [
    ...new Set(
      deNghi.items.map((d) => d.nguoiPhuTrachTen).filter((x): x is string => Boolean(x)),
    ),
  ];
  return ten.length > 0 ? ten : ["Chưa phân bổ người phụ trách"];
}

/** Nhãn `nguoiCanXuLy` trả về khi việc thuộc về trưởng bộ phận thu mua. */
export const NHAN_TRUONG_BO_PHAN = "Trưởng bộ phận Thu mua";
/** Nhãn khi chưa ai được phân bổ — việc vẫn thuộc trưởng bộ phận. */
export const NHAN_CHUA_PHAN_BO = "Chưa phân bổ người phụ trách";
/**
 * ★ Nhãn VAI TRÒ cho Ban lãnh đạo — thêm 29/08/2026, dùng cho van an toàn "PO chờ đề nghị
 * treo quá 7 ngày" (`kho-du-lieu.tsx` → hiệu ứng kiểm tra lúc tải app). Trước đây
 * `thongBaoDanhChoToi` chỉ biết vai trò Trưởng bộ phận (`NHAN_TRUONG_BO_PHAN`) — Ban Giám đốc
 * (`vaiTro === "director"`) không có `quyen.phanBoCongViec`, nên KHÔNG lọt qua nhánh đó,
 * cần nhãn + tham số riêng.
 */
export const NHAN_BAN_LANH_DAO = "Ban lãnh đạo";

/**
 * THÔNG BÁO NÀY CÓ PHẢI GỬI CHO TÔI KHÔNG.
 *
 * 🔴 Chỉ đạo Ban lãnh đạo 12/08/2026: *"cấp trưởng phòng đã giao việc sao còn thấy thông
 * báo này"*. Trước đó chuông hiện **toàn bộ** thông báo cho **mọi người**: trưởng phòng
 * nhìn thấy tin gửi cho ba nhân viên, kèm nút "Nhận công tác" — bấm vào là giành mất việc
 * của nhân viên và ghi tên mình vào nhật ký. Nhân viên cũng thấy tin của nhau.
 *
 * Luật:
 *   · Tin ghi đích danh tên mình → của mình.
 *   · Tin gửi "Trưởng bộ phận Thu mua" hoặc "Chưa phân bổ người phụ trách" → của người có
 *     quyền phân bổ. Hai nhãn này là VAI TRÒ chứ không phải tên người, nên phải xét riêng.
 *   · Tin không ghi người nhận (giai đoạn đã kết thúc) → tin chung, ai cũng xem được.
 *
 * ⚠️ So khớp bằng TÊN vì `guiToi` đang lưu tên, không lưu mã người. Đây là điểm yếu đã
 * biết: hai người trùng tên sẽ thấy tin của nhau. Sửa tận gốc là lưu thêm mã người vào
 * thông báo — việc còn lại, chưa làm vì phải chuyển đổi dữ liệu cũ.
 *
 * 📌 THAM SỐ `laBanLanhDao` — thêm 29/08/2026, MẶC ĐỊNH `false` để 2 nơi gọi cũ
 * (`nut-thong-bao.tsx`, `bao-viec-moi.tsx`) không phải sửa nếu chưa cần — nhưng van an toàn
 * "PO chờ đề nghị treo quá hạn" PHẢI truyền đúng giá trị này (`nguoiDung.vaiTro === "director"`)
 * thì Ban lãnh đạo mới thấy được cảnh báo gửi cho nhãn `NHAN_BAN_LANH_DAO`.
 */
export function thongBaoDanhChoToi(
  guiToi: string[],
  tenToi: string,
  laNguoiPhanBo: boolean,
  laBanLanhDao = false,
): boolean {
  if (guiToi.length === 0) return true;
  if (guiToi.includes(tenToi)) return true;
  if (
    laNguoiPhanBo &&
    (guiToi.includes(NHAN_TRUONG_BO_PHAN) || guiToi.includes(NHAN_CHUA_PHAN_BO))
  ) {
    return true;
  }
  if (laBanLanhDao && guiToi.includes(NHAN_BAN_LANH_DAO)) return true;
  return false;
}


/**
 * Đề nghị đã đóng sổ (hoàn thành hoặc đóng dở) thì KHÔNG được đếm vào việc còn phải làm.
 * Không có cái này thì đề nghị đã đóng dở vẫn nằm trong hàng chờ phân bổ và trong
 * thẻ KPI của Bảng điều khiển — trưởng bộ phận sẽ thấy việc tồn nhiều hơn thực tế.
 */
export function deNghiConDangChay(deNghi: DeNghiMuaHang): boolean {
  return deNghi.trangThai !== "hoan_thanh" && deNghi.trangThai !== "dong_do";
}

// ------------------------------------------------------------
// HẠN XỬ LÝ — mốc là NGÀY CẦN HÀNG của đề nghị
// ------------------------------------------------------------

export interface HanXuLy {
  nhan: string;
  tong: Tong;
  quaHan: boolean;
}

/**
 * Bảng Base hiển thị "Quá hạn 1 day" / "Đến hạn trong 21h47m" / "Không thời hạn".
 * App này chỉ có ngày cần hàng (không có giờ) nên tính theo ngày lịch.
 *
 * ⚠️ Dùng `new Date()` lúc dựng trang. Với hosting tĩnh, trang sinh ra ở thời điểm
 * build nên mốc quá hạn có thể lệch một bậc — đúng hiện trạng đã ghi ở SESSION-LOG
 * phiên 02, sẽ xử lý chung một lượt khi nối dữ liệu thật.
 */
export function hanXuLyDeNghi(
  deNghi: DeNghiMuaHang,
  giaiDoan: GiaiDoanMuaHang,
  moc: Date = new Date(),
): HanXuLy {
  if (giaiDoanDaKetThuc(giaiDoan)) {
    return { nhan: "Không còn thời hạn", tong: "neutral", quaHan: false };
  }

  const soNgay = daysUntil(deNghi.ngayCanHang, moc);
  if (soNgay < 0) return { nhan: `Quá hạn ${-soNgay} ngày`, tong: "danger", quaHan: true };
  if (soNgay === 0) return { nhan: "Đến hạn hôm nay", tong: "danger", quaHan: true };
  if (soNgay <= 3) return { nhan: `Còn ${soNgay} ngày`, tong: "warning", quaHan: false };
  return { nhan: `Còn ${soNgay} ngày`, tong: "primary", quaHan: false };
}

/**
 * ★ HẠN XỬ LÝ CHO PO ĐỘC LẬP "CHỜ ĐỀ NGHỊ" — thêm 30/08/2026, cùng lúc PO này được cho hiện
 * thẻ trên bảng Kanban (xem `TheDonHangDocLapTrenBang`). Y hệt `hanXuLyDeNghi` nhưng tính theo
 * `po.ngayGiaoDuKien` — PO không có khái niệm "giai đoạn đã kết thúc" nên bỏ nhánh đó.
 */
export function hanXuLyPODocLap(po: DonDatHang, moc: Date = new Date()): HanXuLy {
  const soNgay = daysUntil(po.ngayGiaoDuKien, moc);
  if (soNgay < 0) return { nhan: `Quá hạn ${-soNgay} ngày`, tong: "danger", quaHan: true };
  if (soNgay === 0) return { nhan: "Đến hạn hôm nay", tong: "danger", quaHan: true };
  if (soNgay <= 3) return { nhan: `Còn ${soNgay} ngày`, tong: "warning", quaHan: false };
  return { nhan: `Còn ${soNgay} ngày`, tong: "primary", quaHan: false };
}

// ------------------------------------------------------------
// GOM NHÓM CHO BẢNG
// ------------------------------------------------------------

export interface TheDeNghiTrenBang {
  deNghi: DeNghiMuaHang;
  giaiDoan: GiaiDoanMuaHang;
  han: HanXuLy;
  /** Người phụ trách lấy từ các dòng đã phân bổ, không trùng lặp. */
  nguoiPhuTrach: string[];
  /**
   * UID của những người phụ trách — dùng để biết thẻ này có phải việc của người đang xem không.
   *
   * 🔴 PHẢI SO BẰNG UID, KHÔNG SO BẰNG TÊN. `nguoiPhuTrach` chỉ có tên hiển thị, mà công ty
   * hoàn toàn có thể có hai người trùng tên — so tên là đẩy nhầm việc của người khác lên đầu
   * bảng của mình, mà không có dấu hiệu nào để phát hiện.
   */
  uidPhuTrach: string[];
  soDongChuaPhanBo: number;
  /**
   * ★ BƯỚC HIỆN TẠI CỦA THẺ CÒN NỢ GÌ — `undefined` là không nợ (23/08/2026).
   *
   * 🔴 Ban lãnh đạo: *"ở quy trình này cũng cần hiển thị đỏ để biết đang thiếu ở bước nào"*, sau
   * khi viền đỏ đã làm ở trang chi tiết đề nghị.
   *
   * 📌 Tính SẴN Ở ĐÂY, không để thẻ tự tính: thẻ là thành phần thuần hiển thị, còn `conNoCuaBuoc`
   * cần cả cấu hình quy trình. Đưa cấu hình xuống tận thẻ là kéo một tầng dữ liệu nữa vào chỗ chỉ
   * để bày — và hai chỗ cùng tính một câu trả lời thì sớm muộn lệch nhau.
   *
   * ⚠️ CHỈ tính cho BƯỚC ĐANG ĐỨNG. Bảng kanban đặt thẻ đúng cột của bước hiện tại, nên "thiếu ở
   * bước nào" trên bảng chính là "thiếu ở cột thẻ đang nằm" — không cần soát cả bảy bước như trang
   * chi tiết.
   */
  conNo?: string;
  /**
   * ★ TỪNG MỤC CÒN THIẾU, tách riêng để thẻ vẽ mỗi mục một dòng — Ban lãnh đạo 23/08/2026:
   * *"Thiếu những mục gì thì hiển thị đủ luôn"*.
   *
   * 🔴 Có `conNo` (một câu) rồi vẫn cần mảng này: thẻ kanban chỉ rộng ~240px, một câu dài phải cắt
   * bớt mới vừa — và cắt là giấu đúng mục thiếu thứ hai đi. Rỗng khi không nợ gì.
   */
  dsConNo?: string[];
  /* 📌 ĐÃ BỎ trường `vuongMac` (Ban lãnh đạo 16/08/2026 yêu cầu bỏ dòng cảnh báo trên thẻ).
     Không giữ lại trường không ai đọc: mỗi lần dựng bảng nó vẫn chạy `vuongMacSangBuocSau`
     cho từng hồ sơ, tốn công tính một chuỗi rồi vứt đi. Lý do chặn vẫn được tính ĐÚNG LÚC cần
     — ở hộp xác nhận kéo thả và ở trang chi tiết đề nghị. */
  /** Mã các đơn đặt hàng đã lập cho đề nghị này. */
  maPOLienQuan: string[];
}

/**
 * ★★ THẺ PO ĐỘC LẬP "CHỜ ĐỀ NGHỊ" TRÊN BẢNG KANBAN — thêm 30/08/2026 (Ban lãnh đạo demo bằng
 * Artifact, chốt: *"vẫn hiển thị trên bảng kanban luôn nhưng màu tím... để quản lý còn chia việc
 * làm cho nhân viên như bình thường, khi nào có đề nghị gắn vào thì chuyển sang màu khác"*).
 *
 * 🔴 CỐ Ý TÁCH RIÊNG KHỎI `TheDeNghiTrenBang`, KHÔNG NHÉT `deNghi` THÀNH TÙY CHỌN. PO này CHƯA
 * CÓ đề nghị nào để gắn — không có `items`/phân bổ/chứng từ còn nợ để tính `nguoiPhuTrach`,
 * `conNo`, `dsConNo`. Ép nó vào `TheDeNghiTrenBang` (làm `deNghi` optional) buộc `TheDeNghi`
 * (component vẽ thẻ, có kéo thả + pop-up xem nhanh theo `deNghi.id`) phải rẽ nhánh `deNghi` có
 * hay không ở HÀNG CHỤC chỗ — rủi ro cao hơn nhiều so với dựng một thẻ riêng, đơn giản hơn nhiều
 * (không kéo thả được, không có pop-up xem nhanh — bấm là điều hướng thẳng `/don-hang/{id}`).
 *
 * 📌 CHỈ CÓ Ở CỘT "Lập đơn mua hàng" (`ma: "lap_don_mua_hang"`) — PO chưa gắn đề nghị luôn dừng
 * ở đúng bước này cho tới khi được hợp thức hoá; mọi cột khác mảng này luôn rỗng.
 */
export interface TheDonHangDocLapTrenBang {
  po: DonDatHang;
  han: HanXuLy;
}

export interface CotBangQuyTrinh {
  giaiDoan: MoTaGiaiDoan;
  the: TheDeNghiTrenBang[];
  /** Rỗng ở mọi cột trừ "Lập đơn mua hàng" — xem chú thích ở `TheDonHangDocLapTrenBang`. */
  theDocLap: TheDonHangDocLapTrenBang[];
  soQuaHan: number;
}

/** Dựng đủ 8 cột theo đúng thứ tự, kể cả cột rỗng — cột rỗng cũng là thông tin. */
export function dungBangQuyTrinh(
  tatCaDeNghi: DeNghiMuaHang[],
  tatCaPO: DonDatHang[],
  tatCaBaoGia: BaoGia[],
  tatCaPhieu: PhieuNhanHang[],
  /**
   * Cấu hình quy trình — cần để biết bước đang đứng còn nợ công việc bắt buộc nào (`conNo`).
   *
   * ⚠️ BẮT BUỘC, cố ý không cho bỏ trống: để `?` thì nơi gọi nào quên truyền sẽ **mất sạch dấu
   * đỏ mà không một lỗi nào báo** — đúng kiểu hỏng đã dính nhiều lần trong dự án này. Thà
   * TypeScript báo đỏ ở mọi chỗ gọi để phải xử lý cho hết.
   *
   * ⚠️ ĐỨNG TRƯỚC `moc` và `uidNguoiXem` vì hai tham số đó có giá trị mặc định / không bắt buộc —
   * TypeScript không cho tham số bắt buộc nằm sau tham số tùy chọn.
   */
  cauHinh: CauHinhQuyTrinh,
  moc: Date = new Date(),
  /**
   * UID người đang xem bảng — việc của họ được đẩy lên đầu mỗi cột.
   *
   * Bỏ trống (nơi gọi không quan tâm ai đang xem, VD trang in) thì bảng xếp thuần theo ngày
   * cần hàng như trước.
   */
  uidNguoiXem?: string,
  /**
   * ★ Hàm tính câu vướng mắc bước ② cho MỘT đề nghị — thường là `vuongMacTrinhXetDuyet`.
   *
   * 🔴 NHẬN HÀM, KHÔNG NHẬN CHUỖI: câu này khác nhau theo từng hồ sơ (mỗi hồ sơ đặt số bản báo
   * giá riêng và đính kèm khác nhau), nên một chuỗi dùng chung cho cả bảng là sai ngay từ thiết
   * kế.
   *
   * 📌 Bỏ trống thì thẻ ở bước ② không có dấu đỏ "thiếu báo giá" — chấp nhận được ở những nơi
   * chỉ bày (trang in), vì thiếu một lời nhắc không cho lọt hành động sai nào.
   */
  tinhVuongMacBaoGia?: (dn: DeNghiMuaHang) => string | null,
): CotBangQuyTrinh[] {
  // 🔴 BỎ HỒ SƠ ĐÃ LƯU TRỮ khỏi bảng (chỉ đạo Ban lãnh đạo 10/08/2026, menu ⋯ theo Base).
  // Lưu trữ ≠ đóng dở: hồ sơ vẫn nguyên trạng thái nghiệp vụ, chỉ không hiện trên bảng cho
  // đỡ rối. Bỏ lưu trữ là nó quay lại đúng cột cũ, vì cột suy ra từ chứng từ chứ không lưu.
  const the: TheDeNghiTrenBang[] = tatCaDeNghi
    .filter((dn) => !dn.luuTru)
    .map((deNghi) => {
    const giaiDoan = xacDinhGiaiDoan(deNghi, tatCaPO, tatCaBaoGia, tatCaPhieu);
    return {
      deNghi,
      giaiDoan,
      han: hanXuLyDeNghi(deNghi, giaiDoan, moc),
      nguoiPhuTrach: [
        ...new Set(
          deNghi.items
            .map((d) => d.nguoiPhuTrachTen)
            .filter((x): x is string => Boolean(x)),
        ),
      ],
      uidPhuTrach: [
        ...new Set(
          deNghi.items
            .map((d) => d.nguoiPhuTrachUid)
            .filter((x): x is string => Boolean(x)),
        ),
      ],
      soDongChuaPhanBo: deNghi.items.filter((d) => !d.nguoiPhuTrachUid).length,
      /* Dấu đỏ trên thẻ — xem chú thích ở khai báo `conNo`. `?? undefined` vì hàm trả `null`
         khi không nợ gì, còn trường này khai kiểu `string | undefined`.

         🔴 DÙNG BẢN `...ToanHoSo`, KHÔNG DÙNG `conNoCuaBuoc`. Ban lãnh đạo báo lỗi 24/08/2026:
         hồ sơ ở bước ⑦ mà nợ ở bước ④ thì thẻ trắng trơn, trong khi trang chi tiết tô đỏ đúng
         khối ④. Vì bản `...CuaBuoc` chỉ soát ĐÚNG MỘT bước — bước thẻ đang đứng. */
      conNo:
        conNoToanHoSo(
          deNghi,
          giaiDoan,
          cauHinh,
          tatCaPO,
          tatCaPhieu,
          tinhVuongMacBaoGia?.(deNghi) ?? null,
        ) ?? undefined,
      dsConNo: dsConNoToanHoSo(
        deNghi,
        giaiDoan,
        cauHinh,
        tatCaPO,
        tatCaPhieu,
        tinhVuongMacBaoGia?.(deNghi) ?? null,
      ),
      maPOLienQuan: tatCaPO
        .filter((po) => po.prId === deNghi.id && po.trangThai !== "huy")
        .map((po) => po.code),
    };
  });

  /**
   * ★ THẺ PO ĐỘC LẬP "CHỜ ĐỀ NGHỊ" — chỉ đổ vào cột "Lập đơn mua hàng", xem chú thích ở
   * `TheDonHangDocLapTrenBang`. Sắp theo đúng luật ưu tiên của PO (`soSanhDonHangUuTien`, MỘT chỗ
   * duy nhất, cùng chỗ trang Tổng quan đang dùng) — không tự bịa thứ tự riêng ở đây.
   *
   * 🔴 PHẢI LOẠI PO ĐÃ CÓ `prId` — bắt bởi CodeRabbit review 30/08/2026. Route tự động khớp
   * (`app-request/de-nghi-moi`) điền `prId` vào PO nhưng CỐ Ý giữ `trangThai: "cho_de_nghi"`
   * cho tới khi người dùng xác nhận (`xacNhanTuDongGanDeNghi`, xem chú thích ở đó). Thiếu điều
   * kiện `!po.prId` thì PO này vừa lọt vào đây (thẻ tím) VỪA lọt vào `the` phía trên qua chính
   * đề nghị nó vừa gắn (`the` build từ TOÀN BỘ `tatCaDeNghi`, không quan tâm PO đã "chờ đề
   * nghị" hay "đã chốt") — HAI thẻ cho CÙNG một PO trên cùng một bảng.
   */
  const poDocLap = tatCaPO.filter((po) => po.trangThai === "cho_de_nghi" && !po.prId);
  const theDocLapDaSap: TheDonHangDocLapTrenBang[] = [...poDocLap]
    .sort((a, b) => soSanhDonHangUuTien(a, b, uidNguoiXem))
    .map((po) => ({ po, han: hanXuLyPODocLap(po, moc) }));

  return GIAI_DOAN_MUA_HANG.map((giaiDoan) => {
    const cuaCot = the.filter((t) => t.giaiDoan === giaiDoan.ma);
    const laCotLapDon = giaiDoan.ma === "lap_don_mua_hang";
    return {
      giaiDoan,
      the: [...cuaCot].sort((a, b) => soSanhTheTrenBang(a, b, uidNguoiXem)),
      theDocLap: laCotLapDon ? theDocLapDaSap : [],
      soQuaHan:
        cuaCot.filter((t) => t.han.quaHan).length +
        (laCotLapDon ? theDocLapDaSap.filter((t) => t.han.quaHan).length : 0),
    };
  });
}

/**
 * THỨ TỰ THẺ TRONG MỘT CỘT — một chỗ duy nhất, dùng cho cả bảng lẫn danh sách.
 *
 * 🔴 Ban lãnh đạo 15/08/2026: *"ở các tài khoản nhân viên, hãy ưu tiên hiển thị các công việc
 * của nhân viên đó đảm nhiệm trước"*. Trước đó nhân viên mở bảng lên thì thẻ của đồng nghiệp
 * nằm chen giữa, phải đọc hết cột mới thấy việc của mình.
 *
 * 👉 Luật thật nằm ở `2-quy-trinh/sap-xep-uu-tien.ts`, MỘT CHỖ DUY NHẤT. Hàm này chỉ là lớp
 * vỏ mỏng để bảng quy trình gọi cho tiện — đừng chép luật vào đây.
 */
export function soSanhTheTrenBang(
  a: TheDeNghiTrenBang,
  b: TheDeNghiTrenBang,
  uidNguoiXem?: string,
): number {
  return soSanhDeNghiUuTien(a.deNghi, b.deNghi, uidNguoiXem);
}


// ------------------------------------------------------------
// KÉO THẢ TRÊN BẢNG
//
// Giai đoạn được SUY RA từ chứng từ (nguyên tắc đầu file) nên kéo thẻ sang cột
// mới KHÔNG phải là "đổi nhãn" — nó phải LÀM ĐÚNG NGHIỆP VỤ của cột đó:
//   · Bước làm ngay được (tạo bảng báo giá, chốt so sánh, đóng dở) → làm luôn, thẻ tự chuyển
//   · Bước cần người quyết định (chọn NCC, lập PO, ghi phiếu nhận) → mở đúng màn hình đó
//   · Bước không hợp lệ (kéo lùi, nhảy cóc, ép hoàn thành) → giải thích lý do, thẻ đứng yên
// ------------------------------------------------------------

export type HanhDongKeoTha =
  /**
   * `chotLuon` — tạo bảng XONG thì chốt sang so sánh luôn, để thẻ sang cột ③ trong MỘT lần bấm.
   *
   * 🔴 THÊM 25/08/2026, vì nếu không thì người dùng lại gặp *"bấm mà không thấy gì"*.
   * Đo được: kéo thẻ ②→③ khi hồ sơ chưa có bảng báo giá thì hành động là `tao_bao_gia`, mà bảng
   * mới tạo mang trạng thái `dang_thu_thap` — và `xacDinhGiaiDoan` suy `dang_thu_thap` → cột ②.
   * Tức người dùng đính đủ tệp, bấm nút, rồi **thẻ vẫn đứng nguyên cột cũ**, phải kéo lần thứ hai.
   *
   * ⚠️ CHỈ đặt cờ khi kéo TỪ bước ② (ý định là sang ③). Kéo ①→② cũng trả `tao_bao_gia` nhưng ở
   * đó đích đến ĐÚNG LÀ cột ②, chốt luôn là đẩy thẻ vượt một bước không ai yêu cầu.
   */
  | { loai: "tao_bao_gia"; chotLuon?: boolean }
  | { loai: "chot_so_sanh" }
  | { loai: "dong_do" }
  | { loai: "mo_trang"; duongDan: string; thongBao: string }
  /**
   * ★ LÙI LẠI MỘT BƯỚC — Ban lãnh đạo 13/08/2026: *"chức năng kéo thả chuyển bước chỉ cho
   * tiến hoặc lùi trong phạm vi 1 bước"*.
   *
   * `ve` là giai đoạn đích, `viec` là câu tả việc app sẽ làm để lùi — hộp xác nhận in ra
   * câu này. Giai đoạn suy ra từ chứng từ nên lùi KHÔNG phải đổi nhãn: phải hủy đúng chứng
   * từ của bước đang đứng, và người dùng cần đọc trước mình sắp hủy cái gì.
   */
  | { loai: "lui_buoc"; ve: GiaiDoanMuaHang; viec: string }
  /**
   * ★★ CÒN VƯỚNG NHƯNG GỠ ĐƯỢC NGAY TRONG HỘP — Ban lãnh đạo 25/08/2026: *"Kéo qua bước phải
   * hiển thị các trường nhập nhanh các điều kiện chuyển bước"*.
   *
   * 🔴 ĐÂY KHÔNG PHẢI ĐƯỜNG ĐI TẮT, và phân biệt này là cốt lõi:
   *   · `khong_the` = chặn, báo lý do, hộp KHÔNG mở. Dành cho vướng mắc phải sang màn khác mới
   *     gỡ được (phân bổ người, duyệt bảng so sánh) — mở hộp ra chỉ để bày một câu mà trong hộp
   *     không có gì bấm được là làm người dùng bí thêm.
   *   · `can_go_vuong` = hộp MỞ RA kèm đúng ô để gỡ tại chỗ, **nút vẫn khóa** cho tới khi hết
   *     vướng. Người dùng đính tệp ngay trên bảng quy trình, không bị đuổi sang màn khác rồi
   *     phải quay về kéo lại.
   *
   * 🔴 THẺ KHÔNG TỰ NHẢY CỘT KHI ĐÍNH TỆP — Ban lãnh đạo 25/08/2026: *"Phải được duyệt thì mới
   * nhảy"*. Điều này đúng nhờ kiến trúc chứ không nhờ một chốt riêng: `xacDinhGiaiDoan` suy giai
   * đoạn từ **đơn hàng · phiếu nhận · trạng thái PO**, không đọc tệp đính kèm hay ô tích. Nên
   * đính tệp chỉ gỡ khóa nút; thẻ chuyển cột khi `hanhDongSau` chạy, tức khi có người bấm duyệt.
   * ⚠️ Ai về sau đưa "có tệp X" vào `xacDinhGiaiDoan` là phá luật này mà không có gì báo.
   *
   * `hanhDongSau` là việc app làm khi người dùng đã gỡ hết và bấm duyệt — giữ nguyên hành động
   * mà `hanhDongTienMotBuoc` đã quyết, không tính lại lần hai ở tầng giao diện.
   */
  | {
      loai: "can_go_vuong";
      dieuKien: DieuKienConVuong[];
      hanhDongSau: HanhDongKeoTha;
    }
  | { loai: "khong_the"; lyDo: string };

const THU_TU_GIAI_DOAN: GiaiDoanMuaHang[] = GIAI_DOAN_MUA_HANG.map((g) => g.ma);

/**
 * ★ GIAI ĐOẠN `ma` ĐÃ TỚI LƯỢT CHƯA, so với giai đoạn hiện tại của hồ sơ.
 *
 * 🔴 Ban lãnh đạo 19/08/2026: *"Bước 1 thì chỉ hiện trường thông tin của bước 1. Tương tự cho
 * các bước sau"* — trang chi tiết đang bày cả sáu khối bước, kể cả những bước còn trống trơn vì
 * chưa tới lượt, nên người xem phải cuộn qua một dãy khối rỗng để tới đúng bước đang làm.
 *
 * 📌 ĐỂ Ở TẦNG QUY TRÌNH, không để trong file giao diện (quy tắc 3.4b): đây là luật về thứ tự
 * các bước, và `THU_TU_GIAI_DOAN` là bản duy nhất giữ thứ tự đó. Giao diện tự dò thứ tự bằng
 * một mảng chép tay là sớm muộn lệch khi quy trình đổi.
 *
 * ⚠️ Mã lạ (hồ sơ cũ, hoặc dữ liệu từ máy khác đang chạy bản khác) → `indexOf` trả `-1`. Khi đó
 * trả `true` để **hiện ra** chứ không ẩn: thà bày thừa một khối còn hơn giấu mất dữ liệu của
 * người dùng mà không có gì báo.
 */
export function giaiDoanDaToiLuot(
  ma: string,
  giaiDoanHienTai: GiaiDoanMuaHang,
): boolean {
  const i = THU_TU_GIAI_DOAN.indexOf(ma as GiaiDoanMuaHang);
  const iHienTai = THU_TU_GIAI_DOAN.indexOf(giaiDoanHienTai);
  if (i === -1 || iHienTai === -1) return true;
  return i <= iHienTai;
}

/**
 * Quyết định điều gì xảy ra khi thả thẻ `the` vào cột `dich`.
 * Hàm thuần — không đụng dữ liệu; việc thực thi nằm ở trang gọi nó.
 * Trả về null khi thả về đúng cột cũ (không làm gì).
 */
/**
 * BƯỚC HIỆN TẠI ĐÃ LÀM XONG CHƯA — trả về lý do còn vướng, `null` nghĩa là đủ điều kiện
 * sang bước sau.
 *
 * 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 10/08/2026: *"sao chưa phân bổ công việc mà đã đi tới bước 4 rồi,
 * phải hoàn thành công việc ở các bước trước thì mới được thực hiện các bước tiếp theo"*.
 *
 * 🔴 ĐẶT Ở ĐÂY LÀ CỐ Ý — MỘT LUẬT, MỌI ĐƯỜNG DÙNG CHUNG. Đề nghị chuyển bước qua nhiều
 * đường khác nhau: kéo thả trên bảng, nút "Lập bảng báo giá"
 * ở trang chi tiết. Nếu mỗi đường tự kiểm riêng thì bịt được đường này lại hở đường khác —
 * đã xảy ra thật: bịt kéo thả nhưng một đường khác vẫn lập bảng báo giá khi chưa phân
 * bổ dòng nào, thế là đề nghị nhảy sang bước ② rồi ④ mà không ai được phân công.
 *
 * ⚠️ Đây là LUẬT CỨNG (chặn), khác `dungXacNhanKeoTha` là cảnh báo mềm (chỉ hỏi lại).
 */
/**
 * ★ CÔNG VIỆC BẮT BUỘC CỦA BƯỚC MÀ ĐỀ NGHỊ NÀY CHƯA TÍCH XONG.
 *
 * 🔴 MỘT CHỖ DUY NHẤT trả lời câu "còn vướng việc gì". Luật chặn chuyển bước, chữ hiện trên
 * hộp xác nhận, và khối "Công việc của bước" ở trang chi tiết đều gọi vào đây — nếu mỗi chỗ
 * tự lọc lấy thì sớm muộn có chỗ quên xét cờ `batBuocXongCongViec` và chặn (hoặc thả) sai.
 *
 * Trả về mảng rỗng khi: bước không khai việc nào · đã tích xong hết · hoặc cài đặt của bước
 * TẮT "bắt buộc hoàn thành công việc" (khi đó danh sách chỉ còn là lời nhắc).
 */
export function congViecChuaXongCuaBuoc(
  deNghi: DeNghiMuaHang,
  giaiDoan: GiaiDoanMuaHang,
  cauHinh: CauHinhQuyTrinh,
): CongViecGiaiDoan[] {
  if (!caiDatCuaBuoc(cauHinh, giaiDoan).batBuocXongCongViec) return [];
  const daXong = deNghi.congViecDaXong ?? [];
  return (cauHinh.congViecTheoBuoc?.[giaiDoan] ?? []).filter(
    (cv) => cv.batBuoc && !daXong.some((x) => x.maCongViec === cv.ma),
  );
}

/**
 * ★★ BƯỚC NÀY CÒN NỢ GÌ — nguồn của VIỀN ĐỎ trên khối bước (Ban lãnh đạo 23/08/2026:
 * *"Các border này cần hiển thị màu đỏ nếu như công việc trong các mục này chưa hoàn thành hoặc
 * thiếu đính kèm file"*). Trả câu mô tả, `null` là không nợ gì.
 *
 * 🔴🔴 KHÁC `vuongMacSangBuocSau`, VÀ ĐỪNG DÙNG LẪN — đây là hai câu hỏi khác nhau:
 *
 *   · `vuongMacSangBuocSau` = *"đã đủ để TIẾN sang bước sau chưa"*. Câu này **hết nghĩa khi bước
 *     đã qua**: bước ② hỏi *"có bảng báo giá đang thu thập không"*, mà bảng duyệt xong thì đổi
 *     sang `da_chon_ncc` — tức bước ② làm xong đúng quy trình lại bị báo là chưa xong.
 *   · `conNoCuaBuoc` (hàm này) = *"còn thiếu gì mà PHẢI BỔ SUNG"*. Chỉ gồm hai thứ Ban lãnh đạo
 *     nêu: **công việc bắt buộc chưa tích** và **chứng từ bắt buộc chưa có tệp**. Hai thứ đó nợ
 *     là nợ mãi, không tự hết khi hồ sơ đi tiếp.
 *
 * 🔴 ĐO ĐƯỢC LỖI NÀY TRÊN TRÌNH DUYỆT trước khi phát hành: bản đầu tôi dùng
 * `vuongMacSangBuocSau` cho viền đỏ, và hồ sơ đang ở bước ④ bị tô đỏ cả *"Tiếp nhận và kiểm
 * tra"* lẫn *"Yêu cầu NCC báo giá"* — hai bước đã xong. Đỏ ba trong bốn khối thì người dùng
 * thôi để ý, đúng lúc cần để ý nhất.
 *
 * 🔴 HỢP ĐỒNG: xét `coHopDong` (CÓ TỆP hay không), KHÔNG xét `vuongMacRoiBuocLapDon`. Đó là chủ
 * ý của Ban lãnh đạo cùng ngày: ghi lý do thì **cho đi tiếp** nhưng *"phải tô màu đỏ lại. Để biết
 * là còn thiếu hồ sơ để bổ sung sau"*. Dùng hàm kia thì ghi lý do là hết đỏ — mất đúng cái dấu
 * nhắc mà Ban lãnh đạo cần.
 */
export function conNoCuaBuoc(
  deNghi: DeNghiMuaHang,
  giaiDoan: GiaiDoanMuaHang,
  cauHinh: CauHinhQuyTrinh,
  tatCaPO: DonDatHang[],
  tatCaPhieu: PhieuNhanHang[],
  /** Chuyển tiếp xuống `mucConNoCuaBuoc` — xem chú thích cùng tham số ở đó. */
  vuongMacBaoGia?: string | null,
): string | null {
  const ds = dsConNoCuaBuoc(deNghi, giaiDoan, cauHinh, tatCaPO, tatCaPhieu, vuongMacBaoGia);
  return thanhCauConNo(ds);
}

/** Nối danh sách mục thiếu thành một câu, `null` khi không thiếu gì. Một chỗ duy nhất. */
function thanhCauConNo(ds: string[]): string | null {
  if (ds.length === 0) return null;
  /* Viết hoa chữ đầu để câu đọc lên thành một câu hoàn chỉnh trên giao diện. */
  const cau = ds.join(" · ");
  return cau.charAt(0).toUpperCase() + cau.slice(1) + ".";
}

/**
 * ★★ CẢ HỒ SƠ CÒN NỢ GÌ — gộp nợ của MỌI BƯỚC ĐÃ ĐI QUA, không chỉ bước đang đứng.
 *
 * 🔴 SINH RA TỪ LỖI BAN LÃNH ĐẠO BÁO 24/08/2026: *"Sao có bước chưa hoàn thành nhưng ở bảng
 * kanban lại không hiện thông báo"*. Hồ sơ đã ở bước ⑦ *Hồ sơ thanh toán*, trang chi tiết tô đỏ
 * khối ④ *Lập đơn mua hàng* kèm nhãn *"Còn thiếu"* — mà thẻ trên bảng thì **trắng trơn**.
 *
 * NGUYÊN NHÂN: `dungBangQuyTrinh` gọi `conNoCuaBuoc` với **đúng một bước** — bước thẻ đang đứng.
 * Thẻ ở ⑦ nên chỉ soát ⑦, không bao giờ thấy nợ của ④. Còn trang chi tiết vẽ sáu khối nên gọi
 * cho **từng bước** → thấy. Hai chỗ cùng trả lời một câu hỏi mà khác nhau, đúng cái nếp dự án
 * này cấm.
 *
 * 🔴 CHỈ GỘP CÁC BƯỚC **ĐÃ TỚI LƯỢT** (từ đầu tới bước hiện tại), TUYỆT ĐỐI KHÔNG GỘP BƯỚC CHƯA
 * TỚI. Hồ sơ đang ở bước ② thì chưa có tệp Hợp đồng/Đơn mua hàng là **bình thường**, không phải
 * nợ. Gộp cả bước chưa tới thì **mọi thẻ đều đỏ ngay từ bước ①** — rơi đúng vào cái bẫy đã ghi ở
 * `conNoCuaBuoc`: *"đỏ ba trong bốn khối thì người dùng thôi để ý, đúng lúc cần để ý nhất"*.
 *
 * 📌 CHỈ RÕ BƯỚC cho nợ của bước cũ. Thẻ kanban không bày tên bước, nên *"thiếu HĐ"* trơ trọi thì
 * người đọc không biết mở khối nào để bổ sung. Bản ngắn dùng **số bước khoanh tròn** (`④ thiếu
 * HĐ`) — Ban lãnh đạo 24/08/2026 yêu cầu tối giản ký tự, mà tên bước đầy đủ thì dài gấp năm lần
 * cả phần nội dung. Nợ của chính bước đang đứng không thêm tiền tố: cột đã nói bước nào rồi.
 */
export function mucConNoToanHoSo(
  deNghi: DeNghiMuaHang,
  giaiDoanHienTai: GiaiDoanMuaHang,
  cauHinh: CauHinhQuyTrinh,
  tatCaPO: DonDatHang[],
  tatCaPhieu: PhieuNhanHang[],
  /** Chuyển tiếp xuống `mucConNoCuaBuoc` — xem chú thích cùng tham số ở đó. */
  vuongMacBaoGia?: string | null,
): MucConNo[] {
  /**
   * 🔴 HỒ SƠ THẤT BẠI THÌ KHÔNG NHẮC NỢ CHỨNG TỪ — Ban lãnh đạo 24/08/2026: *"Ở bước thất bại
   * chỉ cần ghi lý do thất bại. Không cần ghi các thông tin thiếu này"*.
   *
   * Nợ chứng từ là lời nhắc **đi bổ sung**. Hồ sơ đã hủy/thất bại thì không ai bổ sung hợp đồng
   * hay hóa đơn cho nó nữa — bày bốn dòng "thiếu HĐ · thiếu hoá đơn · thiếu hàng 2/2 dòng" chỉ
   * làm người đọc tưởng còn việc phải làm, và che mất thứ duy nhất cần đọc ở cột này: **lý do
   * thất bại**.
   */
  if (giaiDoanHienTai === "that_bai") return [];

  const viTri = THU_TU_GIAI_DOAN.indexOf(giaiDoanHienTai);
  /* Mã lạ (hồ sơ cũ / máy khác chạy bản khác) → chỉ soát đúng bước đó, đừng đoán thứ tự. */
  const cacBuoc = viTri < 0 ? [giaiDoanHienTai] : THU_TU_GIAI_DOAN.slice(0, viTri + 1);

  const ra: MucConNo[] = [];
  for (const buoc of cacBuoc) {
    /* "Thất bại" không nằm trong chuỗi chạy — cùng cách xử như `vuongMacViecBatBuocCacBuocTruoc`. */
    if (buoc === "that_bai") continue;
    const cuaBuocNay = buoc === giaiDoanHienTai;
    for (const muc of mucConNoCuaBuoc(
      deNghi,
      buoc,
      cauHinh,
      tatCaPO,
      tatCaPhieu,
      vuongMacBaoGia,
    )) {
      ra.push(
        cuaBuocNay
          ? muc
          : {
              ngan: `${kyHieuNganCuaBuoc(buoc)} ${muc.ngan}`.trim(),
              day: `bước “${NHAN_GIAI_DOAN[buoc].nhan}” ${muc.day}`,
            },
      );
    }
  }
  return ra;
}

/** Bản NGẮN, bày trên thẻ kanban — mỗi mục một dòng. */
export function dsConNoToanHoSo(
  deNghi: DeNghiMuaHang,
  giaiDoanHienTai: GiaiDoanMuaHang,
  cauHinh: CauHinhQuyTrinh,
  tatCaPO: DonDatHang[],
  tatCaPhieu: PhieuNhanHang[],
  /** Chuyển tiếp xuống `mucConNoCuaBuoc` — xem chú thích cùng tham số ở đó. */
  vuongMacBaoGia?: string | null,
): string[] {
  return mucConNoToanHoSo(deNghi, giaiDoanHienTai, cauHinh, tatCaPO, tatCaPhieu, vuongMacBaoGia).map(
    (m) => m.ngan,
  );
}

/**
 * Bản ĐẦY ĐỦ, một câu — dùng cho chữ hiện khi rê chuột lên thẻ.
 *
 * 📌 Cố ý KHÔNG rút ngắn theo yêu cầu 24/08/2026: yêu cầu đó nói về chỗ BÀY trên thẻ. Người rê
 * chuột là người đang muốn biết chi tiết, cắt bớt ở đây là làm mất đường tra duy nhất còn lại.
 */
export function conNoToanHoSo(
  deNghi: DeNghiMuaHang,
  giaiDoanHienTai: GiaiDoanMuaHang,
  cauHinh: CauHinhQuyTrinh,
  tatCaPO: DonDatHang[],
  tatCaPhieu: PhieuNhanHang[],
  /** Chuyển tiếp xuống `mucConNoCuaBuoc` — xem chú thích cùng tham số ở đó. */
  vuongMacBaoGia?: string | null,
): string | null {
  return thanhCauConNo(
    mucConNoToanHoSo(deNghi, giaiDoanHienTai, cauHinh, tatCaPO, tatCaPhieu, vuongMacBaoGia).map(
      (m) => m.day,
    ),
  );
}

/**
 * ★ TỪNG MỤC CÒN THIẾU, TÁCH RIÊNG — Ban lãnh đạo 23/08/2026: *"Thiếu những mục gì thì hiển thị
 * đủ luôn"*.
 *
 * 🔴 VÌ SAO CẦN BẢN MẢNG bên cạnh `conNoCuaBuoc`: thẻ trên bảng kanban chỉ rộng ~240px. Một câu
 * nối bằng dấu "·" phải cắt bớt mới vừa (`line-clamp`), mà cắt là **giấu đúng cái mục thiếu thứ
 * hai** — người đọc tưởng chỉ thiếu một thứ. Có mảng thì vẽ mỗi mục một dòng, không mất mục nào.
 *
 * 📌 `conNoCuaBuoc` giữ nguyên và gọi vào đây — hai cách đọc, MỘT luật. Chỗ cần một câu (viền đỏ
 * khối bước, chữ hiện khi rê chuột) vẫn dùng bản câu.
 */
export function dsConNoCuaBuoc(
  deNghi: DeNghiMuaHang,
  giaiDoan: GiaiDoanMuaHang,
  cauHinh: CauHinhQuyTrinh,
  tatCaPO: DonDatHang[],
  tatCaPhieu: PhieuNhanHang[],
  /** Chuyển tiếp xuống `mucConNoCuaBuoc` — xem chú thích cùng tham số ở đó. */
  vuongMacBaoGia?: string | null,
): string[] {
  return mucConNoCuaBuoc(deNghi, giaiDoan, cauHinh, tatCaPO, tatCaPhieu, vuongMacBaoGia).map(
    (m) => m.day,
  );
}

/**
 * ★ MỘT MỤC CÒN NỢ — hai cách đọc, MỘT luật.
 *
 * 🔴 Ban lãnh đạo 24/08/2026: *"Tối giản ký tự thông báo lại. Ví dụ: Thiếu hoá đơn, thiếu HĐ…"*.
 * Trước đó thẻ kanban bày nguyên câu *"Bước “Lập đơn mua hàng” chưa có tệp Hợp đồng/Đơn mua hàng
 * (đã ghi lý do: bổ sung sau) — phải bổ sung bản đã ký"* — bốn dòng chữ trên một thẻ rộng 240px,
 * ba thẻ như vậy là hết cả cột, không còn đọc được cái gì.
 *
 * 🔴 KHÔNG XOÁ BẢN ĐẦY ĐỦ, chỉ đổi CHỖ BÀY nó. Câu đầy đủ vẫn cần ở hai nơi: chữ hiện khi rê
 * chuột lên thẻ, và viền đỏ + nhãn ở trang chi tiết (chỗ đó rộng, và người vào đó là người sắp
 * đi bổ sung — họ cần biết đủ lý do, kể cả lý do đã ghi trước đó).
 *
 * ⚠️ SINH CẢ HAI TỪ CÙNG MỘT CHỖ. Viết hai hàm riêng là sớm muộn lệch nhau: sửa luật một bên,
 * bên kia im lặng nói sai — đúng cái lỗi vừa phải chữa hôm nay (thẻ và trang chi tiết trả lời
 * khác nhau cho cùng một câu hỏi).
 */
export interface MucConNo {
  /** Bản NGẮN, bày trên thẻ kanban. Càng ít chữ càng tốt, nhưng phải nói được thiếu CÁI GÌ. */
  ngan: string;
  /** Bản ĐẦY ĐỦ, dùng cho chữ rê chuột và trang chi tiết. */
  day: string;
}

/** Số bước khoanh tròn (①②③…) — tiền tố cực ngắn để thẻ biết nợ nằm ở bước nào. */
const SO_KHOANH = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];

/** Ký hiệu ngắn của một bước, dùng làm tiền tố trên thẻ. Rỗng nếu không tra được thứ tự. */
export function kyHieuNganCuaBuoc(giaiDoan: GiaiDoanMuaHang): string {
  const i = THU_TU_GIAI_DOAN.indexOf(giaiDoan);
  return i >= 0 && i < SO_KHOANH.length ? SO_KHOANH[i] : "";
}

export function mucConNoCuaBuoc(
  deNghi: DeNghiMuaHang,
  giaiDoan: GiaiDoanMuaHang,
  cauHinh: CauHinhQuyTrinh,
  /**
   * Đơn hàng và phiếu nhận của TOÀN BỘ app — cần để biết hàng đã về đủ chưa.
   *
   * ⚠️ BẮT BUỘC, cố ý không cho bỏ trống: để `?` thì nơi gọi nào quên truyền sẽ **mất im lặng dấu
   * đỏ "chưa nhận đủ hàng"** — đúng kiểu hỏng đã dính nhiều lần trong dự án này.
   */
  tatCaPO: DonDatHang[],
  tatCaPhieu: PhieuNhanHang[],
  /**
   * ★ Câu vướng mắc của bước ② (đủ bản báo giá + bảng so sánh) — `null` là không thiếu.
   *
   * ⚠️ CÓ `?` ở đây (khác `quyetDinhKeoTha` để bắt buộc): hàm này được gọi từ **rất nhiều** chỗ
   * hiển thị, mà thiếu dấu đỏ ở bước ② chỉ làm mất một lời nhắc — không cho lọt một hành động
   * sai. Bắt buộc hoá sẽ làm mọi nơi bày thẻ phải import `vuongMacTrinhXetDuyet`, kéo theo
   * `kho-du-lieu` vào những tệp không cần nó.
   */
  vuongMacBaoGia?: string | null,
): MucConNo[] {
  const thieu: MucConNo[] = [];

  const viecChuaXong = congViecChuaXongCuaBuoc(deNghi, giaiDoan, cauHinh);
  if (viecChuaXong.length > 0) {
    thieu.push({
      /* Trên thẻ chỉ ghi SỐ việc, không liệt kê tên: tên việc do người dùng tự đặt, có thể dài
         cả dòng. Muốn biết việc nào thì rê chuột hoặc mở trang chi tiết. */
      ngan: `${viecChuaXong.length} việc chưa xong`,
      day: `còn ${viecChuaXong.length} công việc chưa hoàn thành: ${viecChuaXong
        .map((cv) => `“${cv.ten}”`)
        .join(", ")}`,
    });
  }

  /* Dòng chưa ai nhận là "công việc chưa hoàn thành" đúng nghĩa nhất của bước ①. */
  if (giaiDoan === "tiep_nhan") {
    const chuaPhanBo = deNghi.items.filter((d) => !d.nguoiPhuTrachUid).length;
    if (chuaPhanBo > 0) {
      thieu.push({
        ngan: `chưa phân bổ ${chuaPhanBo}/${deNghi.items.length}`,
        day: `còn ${chuaPhanBo}/${deNghi.items.length} công việc chưa phân bổ người phụ trách`,
      });
    }
  }

  /**
   * ★ BƯỚC ② THIẾU BẢN BÁO GIÁ / BẢNG SO SÁNH — thêm 24/08/2026.
   *
   * 🔴 Lệch đo được giữa THỨ APP BÀY RA và THỨ APP THẬT SỰ CHẶN: hồ sơ ở bước ② thiếu 2/3 bản
   * báo giá và chưa có bảng so sánh thì nút "Trình xét duyệt báo giá" MỜ, in rõ *"Quy trình yêu
   * cầu 3 bản báo giá, hiện còn thiếu 2 bản"* — nhưng thẻ trên bảng **không viền đỏ, không nhãn
   * "Còn thiếu"**, trông y như một hồ sơ sạch đang chờ xử lý.
   *
   * 📌 ĐÚNG PHẠM VI TỰ KHAI của hàm này (*"công việc bắt buộc chưa tích và chứng từ bắt buộc chưa
   * có tệp"*): bản báo giá và bảng so sánh LÀ chứng từ bắt buộc chưa có tệp. Nên đây là thiếu sót
   * thật, không phải chủ ý loại trừ như trường hợp "chưa nhận đủ hàng" ở bước ⑥.
   *
   * ⚠️ NHẬN QUA THAM SỐ, không import `vuongMacTrinhXetDuyet` — `bao-gia-dinh-kem.ts` import từ
   * `kho-du-lieu`, mà `kho-du-lieu` import ngược lại tệp này (vòng tròn). Nơi gọi tính hộ.
   */
  if (giaiDoan === "yeu_cau_bao_gia" && vuongMacBaoGia) {
    thieu.push({
      /* Nhãn ngắn KHÔNG nhồi con số: câu đầy đủ đã ghi thiếu mấy bản, còn thẻ chỉ cần nói
         thiếu CÁI GÌ (Ban lãnh đạo 24/08/2026 — tối giản ký tự). */
      ngan: "thiếu báo giá",
      day: vuongMacBaoGia,
    });
  }

  /* 🔴 GẮN VÀO BƯỚC ⑤, KHÔNG CÒN Ở ④ — Ban lãnh đạo 24/08/2026 chuyển hợp đồng sang bước
     "Tiến hành đặt hàng". Để nguyên ở ④ là tô đỏ một khối không còn chứa ô đính kèm đó, người
     dùng mở khối ④ đi tìm ô hợp đồng và không thấy. */
  if (giaiDoan === "dat_hang" && !coHopDong(deNghi)) {
    const lyDo = lyDoThieuHopDong(deNghi);
    thieu.push({
      /* 📌 CÙNG MỘT NHÃN NGẮN dù đã ghi lý do hay chưa — thiếu tệp là thiếu tệp. Lý do đã ghi
         là thông tin của người đi bổ sung, thuộc bản đầy đủ; nhồi vào thẻ chỉ làm dài mà
         không đổi việc phải làm. */
      ngan: `thiếu HĐ`,
      day: lyDo
        ? `chưa có tệp ${TEN_HIEN_HOP_DONG} (đã ghi lý do: ${lyDo}) — phải bổ sung bản đã ký`
        : `chưa đính kèm ${TEN_HIEN_HOP_DONG}`,
    });
  }

  /**
   * ★ CHƯA NHẬN ĐỦ HÀNG — Ban lãnh đạo 23/08/2026: *"Mục này nếu chưa nhận đủ hàng cũng phải có
   * hiển thị thông báo"*, khoanh đúng khối KẾT QUẢ của bước ⑤ *Tiến hành đặt hàng* (bảng tiến độ
   * ghi xi măng 150/200, con kê 50/500 mà khối vẫn viền xanh).
   *
   * 🔴 GẮN VÀO BƯỚC ⑤, KHÔNG GẮN VÀO ⑥: bảng "Tiến độ nhận hàng" nằm trong khối KẾT QUẢ của bước
   * ⑤ (đơn hàng là kết quả của bước đó, và hàng về theo đơn đó). Bước ⑥ thì việc CỦA NÓ là nhận
   * hàng — đang làm mà báo "còn thiếu" là nói một câu vô nghĩa, và sẽ tô đỏ mọi hồ sơ đang nhận.
   *
   * 📌 Đếm theo SỐ DÒNG chưa về đủ, không đọc từng con số khối lượng: thẻ kanban không đủ chỗ, mà
   * bảng tiến độ ngay dưới đã ghi rõ từng dòng thiếu bao nhiêu.
   */
  if (giaiDoan === "dat_hang") {
    const tienDo = tinhTienDoDeNghi(deNghi, tatCaPO, tatCaPhieu);
    const dongChuaDu = tienDo.filter((d) => d.khoiLuongConLai > 0).length;
    if (dongChuaDu > 0) {
      thieu.push({
        ngan: `thiếu hàng ${dongChuaDu}/${tienDo.length} dòng`,
        day: `còn ${dongChuaDu}/${tienDo.length} dòng chưa nhận đủ hàng`,
      });
    }
  }

  if (giaiDoan === "ho_so_thanh_toan" && !coHoaDonVAT(deNghi)) {
    thieu.push({
      ngan: `thiếu hoá đơn`,
      day: `chưa đính kèm ${NHAN_TEP_HOA_DON_VAT}`,
    });
  }

  return thieu;
}

/**
 * ★★ CÔNG VIỆC BẮT BUỘC CỦA CÁC BƯỚC TRƯỚC CÒN TREO KHÔNG — CHỐT CHẶN Ở CỬA GHI DỮ LIỆU.
 *
 * 🔴 Ban lãnh đạo 23/08/2026 phát hiện lỗ hổng: hồ sơ đã ở **bước ⑥** mà bước ① vẫn treo việc
 * *"Checkin hàng tồn kho"* — *"Nếu chưa check in hàng tồn kho sao lại đi tới được bước này rồi"*.
 * Sếp chốt cách xử: **chặn ở cửa ghi dữ liệu**.
 *
 * VÌ SAO TRƯỚC ĐÂY LỌT: giai đoạn được **suy ra từ chứng từ**, còn chốt công việc bắt buộc chỉ
 * nằm trên đường KÉO THẢ (`vuongMacSangBuocSau`). Mọi đường khác đi vòng qua nó:
 *   · phân bổ đủ người → tự sang bước ②
 *   · lập bảng báo giá · trình · duyệt → sang ③, ④
 *   · lập đơn hàng · ghi phiếu nhận → sang ⑤, ⑥
 * Đây cùng họ với lỗ hổng ngày 15/08/2026 (*"trưởng phòng chưa duyệt đã đẩy qua đặt hàng"*), và
 * cách chữa cũng cùng một kiểu: chặn ở **hàm ghi**, không chặn ở chỗ hiển thị.
 *
 * 🔴 CHẶN Ở CỬA GHI, KHÔNG CHẶN Ở `xacDinhGiaiDoan`. Nếu bắt giai đoạn phải lùi lại vì giấy tờ
 * còn treo thì bảng báo **sai chỗ hàng đang ở đâu** — hàng đã về mà thẻ vẫn nằm cột ①. Nguyên
 * tắc đã ghi ở nhánh `nhan_hang`: *"thiếu giấy thì nhắc, chứ không báo sai chỗ hàng đang ở"*.
 *
 * 🔴 CHỈ SOÁT CÁC BƯỚC **TRƯỚC** BƯỚC HIỆN TẠI. Việc của bước đang làm thì đương nhiên còn treo —
 * soát cả nó là không ai làm được gì ở bước mình đang đứng.
 *
 * ⚠️ ÁP CHO CẢ HỒ SƠ CŨ. Sếp đã cân nhắc và chọn phương án này khi biết rõ hệ quả: hồ sơ đang
 * chạy mà chưa tích việc bắt buộc sẽ **kẹt ngay** cho tới khi có người vào tích bù. Vì vậy câu lỗi
 * phải nói ĐÚNG tên việc và ĐÚNG chỗ tích — người bị chặn phải biết đi đâu, không được để họ đoán.
 *
 * @returns Câu lý do bị chặn, `null` là đi được.
 */
export function vuongMacViecBatBuocCacBuocTruoc(
  deNghi: DeNghiMuaHang,
  giaiDoanHienTai: GiaiDoanMuaHang,
  cauHinh: CauHinhQuyTrinh,
): string | null {
  const viTriHienTai = THU_TU_GIAI_DOAN.indexOf(giaiDoanHienTai);
  if (viTriHienTai <= 0) return null;

  for (const buoc of THU_TU_GIAI_DOAN.slice(0, viTriHienTai)) {
    /* "Thất bại" không nằm trong chuỗi chạy — bỏ qua, nếu không hồ sơ nào cũng vướng. */
    if (buoc === "that_bai") continue;
    const treo = congViecChuaXongCuaBuoc(deNghi, buoc, cauHinh);
    if (treo.length > 0) {
      const ds = treo.map((cv) => `“${cv.ten}”`).join(", ");
      return `Bước “${NHAN_GIAI_DOAN[buoc].nhan}” còn ${treo.length} công việc bắt buộc chưa hoàn thành: ${ds}. Mở khối bước đó ở trang chi tiết đề nghị, tích hoàn thành rồi làm tiếp.`;
    }
  }
  return null;
}

/**
 * ★★ VIỆC BẮT BUỘC CÒN TREO Ở CÁC BƯỚC **TRƯỚC** — kèm tên bước, để giao diện bày ra cho tích.
 *
 * 🔴 SINH RA TỪ MỘT NGÕ CỤT ĐO ĐƯỢC NGÀY 25/08/2026.
 *
 * Khi hồ sơ đã sang bước ②, khối "Danh sách công việc" ở trang chi tiết chỉ bày việc của **bước
 * đang đứng** (`cauHinh.congViecTheoBuoc[giaiDoan]`). Việc bắt buộc còn treo của bước ① vì vậy
 * **không còn một ô nào để tích trong toàn app**.
 *
 * Trong khi đó chốt chuyển bước lại chặn kèm câu *"Mở khối bước đó ở trang chi tiết đề nghị, tích
 * hoàn thành rồi làm tiếp"* — app chỉ người dùng tới một chỗ **không tồn tại**. Ban lãnh đạo báo
 * *"sao ko còn kéo qua bước được"*, và đây mới là lý do thật, chứ không phải bản thân cái chốt.
 *
 * ⚠️ TRẢ KÈM `buoc` LÀ BẮT BUỘC, không chỉ để hiện nhãn. Hàm ghi `danhDauCongViecGiaiDoan` nhận
 * mã bước để biết cất cái tích vào đâu; truyền bước ĐANG ĐỨNG cho một việc thuộc bước trước là ghi
 * sai chỗ, và việc đó vẫn treo mãi dù người dùng đã tích.
 */
export function congViecConTreoCacBuocTruoc(
  deNghi: DeNghiMuaHang,
  giaiDoanHienTai: GiaiDoanMuaHang,
  cauHinh: CauHinhQuyTrinh,
): { buoc: GiaiDoanMuaHang; nhanBuoc: string; viec: CongViecGiaiDoan[] }[] {
  const viTri = THU_TU_GIAI_DOAN.indexOf(giaiDoanHienTai);
  if (viTri <= 0) return [];

  const ra: { buoc: GiaiDoanMuaHang; nhanBuoc: string; viec: CongViecGiaiDoan[] }[] = [];
  for (const buoc of THU_TU_GIAI_DOAN.slice(0, viTri)) {
    /* "Thất bại" không nằm trong chuỗi chạy — cùng cách xử như `vuongMacViecBatBuocCacBuocTruoc`. */
    if (buoc === "that_bai") continue;
    const treo = congViecChuaXongCuaBuoc(deNghi, buoc, cauHinh);
    if (treo.length > 0) ra.push({ buoc, nhanBuoc: NHAN_GIAI_DOAN[buoc].nhan, viec: treo });
  }
  return ra;
}

/**
 * ★★★ ĐƯỢC RỜI BƯỚC NÀY CHƯA — HÀM DÙNG CHUNG CHO **CẢ HAI** ĐƯỜNG CHUYỂN BƯỚC.
 *
 * 🔴 Ban lãnh đạo báo LẦN THỨ HAI ngày 24/08/2026: *"Các điều kiện chuyển bước khi kéo ở bảng
 * kanban chưa được sửa đồng nhất với điều kiện khi thao tác trực tiếp"*.
 *
 * VÌ SAO LẦN SỬA TRƯỚC CHƯA ĐỦ: hôm 23/08 tôi thêm `vuongMacViecBatBuocCacBuocTruoc` vào bốn
 * cửa ghi. Hàm đó **cố ý chỉ soát các bước TRƯỚC**, nên việc bắt buộc của **chính bước đang
 * đứng** vẫn không ai hỏi ở đường thao tác trực tiếp — trong khi hộp kéo thả thì khóa nút theo
 * đúng danh sách đó. Đo được: hồ sơ ở bước ③ còn treo việc "Đối chiếu đơn giá với dự toán";
 * kéo thẻ ③→④ bị khóa nút, còn bấm "Duyệt" trên khối báo giá thì đi được.
 *
 * 🔴 PHÂN BIỆT HAI CÂU HỎI KHÁC NHAU — đây là chỗ dễ sai nhất:
 *   · `vuongMacViecBatBuocCacBuocTruoc` = *"đứng ở bước X, các bước TRƯỚC còn nợ việc không"*.
 *     Dùng cho mọi thao tác ghi trong lòng một bước. KHÔNG soát bước X, vì việc của bước đang
 *     làm đương nhiên còn treo — soát cả nó thì không ai làm được gì.
 *   · `vuongMacRoiBuoc` (hàm này) = *"được RỜI bước X sang bước sau chưa"*. Soát cả bước X.
 *     Chỉ dùng ở thao tác **làm hồ sơ rời bước** (chốt bảng báo giá, duyệt chọn NCC, ghi phiếu
 *     nhận đầu tiên…).
 *
 * 🔴 KHÔNG DÙNG `vuongMacSangBuocSau` CHO CỬA GHI — đã cân nhắc và loại. Hàm đó gồm cả điều
 * kiện CHỨNG TỪ của bước, mà chính cửa ghi là hành động tạo ra chứng từ đó: gọi nó trước khi
 * ghi thì `chonNCCChoBaoGia` bị chặn bởi câu *"Bảng báo giá chưa được duyệt"* — tức app chặn
 * đúng cái hành động duyệt. Vòng tròn không thoát.
 *
 * @param buocDangRoi Bước mà thao tác này làm hồ sơ RỜI KHỎI. Nơi gọi biết rõ (mỗi cửa ghi
 *   phục vụ đúng một bước), nên truyền tường minh thay vì để hàm tự suy — suy từ dữ liệu thì
 *   sau khi ghi giai đoạn đã đổi, hỏi muộn mất một bước.
 * @returns Câu lý do bị chặn, `null` là được rời.
 */
export function vuongMacRoiBuoc(
  deNghi: DeNghiMuaHang,
  buocDangRoi: GiaiDoanMuaHang,
  cauHinh: CauHinhQuyTrinh,
): string | null {
  const truoc = vuongMacViecBatBuocCacBuocTruoc(deNghi, buocDangRoi, cauHinh);
  if (truoc) return truoc;

  const treo = congViecChuaXongCuaBuoc(deNghi, buocDangRoi, cauHinh);
  if (treo.length > 0) {
    const ds = treo.map((cv) => `“${cv.ten}”`).join(", ");
    return `Bước “${NHAN_GIAI_DOAN[buocDangRoi].nhan}” còn ${treo.length} công việc bắt buộc chưa hoàn thành: ${ds}. Tích hoàn thành ở khối bước đó trong trang chi tiết đề nghị rồi làm tiếp.`;
  }
  return null;
}

/**
 * ★★★ MỘT ĐIỀU KIỆN CÒN VƯỚNG — có mã để giao diện biết bày ô gì cho người dùng gỡ tại chỗ.
 *
 * 🔴 Ban lãnh đạo 25/08/2026: *"Kéo qua bước phải hiển thị các trường nhập nhanh các điều kiện
 * chuyển bước"*, kèm ảnh mẫu hộp chuyển bước của Base — trong đó các ô *"Báo giá NCC 1 (PDF) *"*,
 * *"Báo giá NCC 2 (PDF) *"* nằm ngay trong hộp.
 *
 * 🔴 VÌ SAO PHẢI CÓ `ma`, KHÔNG CHỈ MỘT CÂU CHỮ: giao diện cần biết vướng mắc này gỡ bằng **ô
 * nào**. Đoán bằng cách dò chữ trong câu (`cau.includes("báo giá")`) là kiểu ràng buộc mong manh
 * nhất — sửa một chữ trong câu thông báo là ô biến mất, và không có gì báo.
 *
 * 🔴 VÌ SAO PHẢI CÓ `goDuocTaiCho`: không phải điều kiện nào cũng nhập nhanh được. *"Chưa nhận đủ
 * hàng"* thì phải ghi phiếu nhận thật ở màn đơn hàng — bày một ô trong hộp cho nó là hứa một việc
 * hộp không làm được, đúng thứ `CLAUDE.md` §3.5 cấm.
 */
export interface DieuKienConVuong {
  /** Mã để giao diện tra ra ô cần bày. */
  ma:
    | "cong_viec_bat_buoc"
    | "chua_phan_bo"
    | "chua_lap_bang_bao_gia"
    | "thieu_ban_bao_gia"
    | "chua_duyet_bao_gia"
    | "thieu_hop_dong"
    | "thieu_hoa_don_vat"
    | "chua_tich_unc";
  /** Câu nói cho người dùng — giữ nguyên chữ của các hàm luật đang dùng. */
  cau: string;
  /**
   * Gỡ được ngay trong hộp chuyển bước không.
   *
   * `false` = phải sang màn khác làm việc thật (lập đơn hàng, ghi phiếu nhận hàng). Giao diện khi
   * đó bày một dòng dẫn đường, KHÔNG bày ô nhập.
   */
  goDuocTaiCho: boolean;
}

/**
 * ★★★ TẤT CẢ điều kiện còn vướng để rời bước — bản DANH SÁCH của `vuongMacSangBuocSau`.
 *
 * 🔴 VÌ SAO PHẢI CÓ BẢN DANH SÁCH: mọi hàm luật trong app tới nay chỉ trả **một** câu vướng rồi
 * thoát. Nếu nhúng ô vào hộp mà vẫn dùng bản một câu thì hồ sơ vướng ba thứ sẽ cho người dùng gỡ
 * từng cái một — gỡ xong cái này hộp lòi ra cái khác, ba vòng liên tiếp, mỗi vòng lòi một yêu cầu
 * trước đó họ không hề thấy. Khó chịu hơn hiện nay, vì hôm nay ít nhất mở trang chi tiết là thấy
 * hết mọi ô cùng lúc.
 *
 * 📌 `vuongMacSangBuocSau` GIỮ NGUYÊN và gọi vào đây, lấy mục đầu tiên — hai cách đọc, MỘT luật.
 * Nhờ vậy mọi nơi đang dùng bản một câu (chốt kéo thả, chốt tầng ghi) không phải sửa gì.
 *
 * ⚠️ THỨ TỰ CÓ Ý NGHĨA: xếp theo đúng thứ tự người dùng phải làm. Bản một câu lấy mục đầu, nên
 * đảo thứ tự ở đây là đổi luôn câu mà chốt chặn nói ra.
 */
export function dsDieuKienConVuong(
  deNghi: DeNghiMuaHang,
  giaiDoan: GiaiDoanMuaHang,
  baoGiaCuaDeNghi: BaoGia[],
  cauHinh: CauHinhQuyTrinh,
  vuongMacBaoGia: string | null,
): DieuKienConVuong[] {
  const ra: DieuKienConVuong[] = [];
  const conSong = baoGiaCuaDeNghi.filter((b) => b.trangThai !== "huy");

  /* ① Công việc bắt buộc của bước — tích ngay trong hộp được (khối đó đã chạy từ 16/08/2026). */
  const conViecChuaXong = congViecChuaXongCuaBuoc(deNghi, giaiDoan, cauHinh);
  if (conViecChuaXong.length > 0) {
    const ds = conViecChuaXong.map((cv) => `“${cv.ten}”`).join(", ");
    ra.push({
      ma: "cong_viec_bat_buoc",
      cau: `Còn ${conViecChuaXong.length} công việc bắt buộc của bước này chưa hoàn thành: ${ds}.`,
      goDuocTaiCho: true,
    });
  }

  switch (giaiDoan) {
    case "tiep_nhan": {
      const chuaPhanBo = deNghi.items.filter((d) => !d.nguoiPhuTrachUid).length;
      if (chuaPhanBo > 0) {
        ra.push({
          ma: "chua_phan_bo",
          cau: `Còn ${chuaPhanBo} trong ${deNghi.items.length} công việc chưa phân bổ người phụ trách.`,
          /* Phân bổ cần chọn người cho từng dòng — bảng phân bổ có bộ lọc, chọn nhiều dòng, ô
             yêu cầu số báo giá. Nhồi cả bảng đó vào hộp thì hộp thành một màn hình thứ hai. */
          goDuocTaiCho: false,
        });
      }
      break;
    }

    case "yeu_cau_bao_gia":
      /**
       * 🔴🔴 HAI ĐIỀU KIỆN NÀY ĐỘC LẬP — TRƯỚC ĐÂY VIẾT `else` VÀ ĐÓ LÀ LỖI (sửa 25/08/2026).
       *
       * Ban lãnh đạo báo: kéo thẻ ②→③ mà hộp **không hề hiện ô đính kèm nào**, chỉ có nút
       * *"Tạo bảng báo giá"*. Đo lại đúng ca đó:
       *   hồ sơ CHƯA có bảng báo giá  →  danh sách chỉ trả `chua_lap_bang_bao_gia`
       *   → mục đó `goDuocTaiCho: false` → không mở khối ô → hộp trống trơn.
       *
       * ⚠️ Nguyên nhân là chữ `else`: chưa có bảng thì hàm **không thèm hỏi** có thiếu bản báo
       * giá hay không — trong khi thực tế thiếu CẢ HAI. Hai thứ này không loại trừ nhau: bảng là
       * chứng từ nội bộ app, còn bản báo giá là tệp nhà cung cấp gửi. Thiếu tệp thì vẫn phải nói
       * ra, bất kể đã lập bảng hay chưa.
       *
       * 📌 THỨ TỰ CÓ CHỦ Ý: nói việc NGƯỜI DÙNG phải làm (đính tệp) trước việc APP tự làm (lập
       * bảng). `vuongMacSangBuocSau` lấy mục đầu, nên câu chặn ngắn cũng nói đúng việc cần làm.
       */
      if (vuongMacBaoGia) {
        ra.push({ ma: "thieu_ban_bao_gia", cau: vuongMacBaoGia, goDuocTaiCho: true });
      }
      if (!conSong.some((b) => b.trangThai === "dang_thu_thap")) {
        ra.push({
          ma: "chua_lap_bang_bao_gia",
          cau: "Chưa có bảng báo giá nào đang thu thập giá cho đề nghị này.",
          /* Lập bảng báo giá chính là hành động của nút xác nhận trong hộp — không cần ô riêng.
             Vì vậy `quyetDinhKeoTha` LỌC BỎ mục này khi hành động sắp làm là `tao_bao_gia`:
             giữ lại thì nó kéo cả danh sách xuống "không gỡ được tại chỗ" và hộp lại trống. */
          goDuocTaiCho: false,
        });
      }
      break;

    case "xet_duyet_bao_gia":
      if (conSong.some((b) => b.trangThai === "da_so_sanh")) {
        ra.push({
          ma: "chua_duyet_bao_gia",
          cau: "Bảng báo giá chưa được duyệt. Trưởng bộ phận phải chốt nhà cung cấp (hoặc duyệt phương án chia đơn) trước khi lập đơn đặt hàng.",
          /* Duyệt chọn NCC cần đọc bảng so sánh và ghi căn cứ — việc cân nhắc, không phải một ô. */
          goDuocTaiCho: false,
        });
      }
      break;

    /**
     * ★★ HỢP ĐỒNG CHUYỂN TỪ BƯỚC ⑤ VỀ BƯỚC ④ — Ban lãnh đạo 26/08/2026: *"Phải có hợp đồng hoặc
     * thoả thuận mua bán thì mới tiến hành lập PO được, vậy nên hãy kéo bước đính kèm hợp đồng về
     * bước này"*.
     *
     * 🔴 PHẢI ĐỔI CẢ CHỖ NÀY, không chỉ đổi hằng số `BUOC_DINH_KEM_HOP_DONG`. Ô đính kèm mà nằm ở
     * ④ trong khi điều kiện chuyển bước vẫn treo ở ⑤ thì: kéo thẻ ④→⑤ đi lọt dù chưa có hợp đồng,
     * rồi tới ⑤ mới bị chặn — mà lúc đó ô để gỡ lại nằm ngược về ④. Đúng kiểu "hai chỗ cùng trả
     * lời một câu hỏi mà nói khác nhau" đã phải sửa nhiều lần ở dự án này.
     *
     * 📌 `goDuocTaiCho: true` nên kéo thẻ ④→⑤ khi thiếu hợp đồng sẽ **mở hộp kèm ô đính kèm ngay
     * tại chỗ**, không phải toast đỏ ngõ cụt (chỉ đạo 25/08/2026).
     */
    case "lap_don_mua_hang": {
      const vuong = vuongMacRoiBuocLapDon(deNghi);
      if (vuong) ra.push({ ma: "thieu_hop_dong", cau: vuong, goDuocTaiCho: true });
      break;
    }

    case "ho_so_thanh_toan":
      if (!coHoaDonVAT(deNghi)) {
        ra.push({
          ma: "thieu_hoa_don_vat",
          cau: "Chưa đính kèm Hóa đơn VAT ở khối kết quả của bước này.",
          goDuocTaiCho: true,
        });
      } else {
        const vuongUNC = vuongMacTichXongUNC(deNghi);
        if (vuongUNC) ra.push({ ma: "chua_tich_unc", cau: vuongUNC, goDuocTaiCho: true });
      }
      break;

    default:
      /* Các bước còn lại chặn bằng chứng từ thật (đơn hàng, phiếu nhận, 3 lớp xác nhận). */
      break;
  }

  return ra;
}

export function vuongMacSangBuocSau(
  deNghi: DeNghiMuaHang,
  giaiDoan: GiaiDoanMuaHang,
  baoGiaCuaDeNghi: BaoGia[],
  /**
   * Cấu hình quy trình đang áp dụng — hàm tự tra danh sách công việc và các cờ của bước.
   *
   * 🔴 NHẬN CẢ CẤU HÌNH thay vì nhận rời từng mảnh: nơi gọi chỉ việc đưa `cauHinh` vào, không
   * phải tự quyết "có bắt buộc hay không" — quyết định đó là luật nghiệp vụ, để ở giao diện
   * là sớm muộn hai màn hình xử khác nhau.
   */
  cauHinh: CauHinhQuyTrinh,
  /**
   * ★ Câu vướng mắc của bước ② — nơi gọi tính bằng `vuongMacTrinhXetDuyet` rồi truyền vào.
   * BẮT BUỘC, không cho `?`. Xem chú thích cùng tham số ở `quyetDinhKeoTha` để biết vì sao
   * không import thẳng (vòng tròn import qua `kho-du-lieu`).
   */
  vuongMacBaoGia: string | null,
): string | null {
  /**
   * 🔴 GỌI VÀO BẢN DANH SÁCH, KHÔNG CHÉP LẠI ĐIỀU KIỆN — sửa 25/08/2026.
   *
   * Trước đây thân hàm này tự xét từng bước rồi trả một câu. Nay `dsDieuKienConVuong` giữ toàn
   * bộ luật, còn hàm này chỉ lấy MỤC ĐẦU TIÊN. Hai chỗ cùng trả lời một câu hỏi mà mỗi chỗ giữ
   * một bản điều kiện riêng là kiểu lệch đã phải sửa nhiều lần trong dự án này.
   *
   * 📌 Lấy mục đầu chứ không nối hết: nơi gọi hàm này là các CHỐT CHẶN, chúng cần một câu ngắn
   * nói việc phải làm trước nhất. Muốn thấy đủ điều kiện thì gọi thẳng `dsDieuKienConVuong`.
   */
  const ds = dsDieuKienConVuong(deNghi, giaiDoan, baoGiaCuaDeNghi, cauHinh, vuongMacBaoGia);
  return ds.length === 0 ? null : ds[0].cau;
}

/**
 * ★ CÓ ĐƯỢC LẬP ĐƠN ĐẶT HÀNG CHƯA — trả lý do bị chặn, `null` là được phép.
 *
 * 🔴 Ban lãnh đạo 15/08/2026 bắt lỗi: *"bước này sao trưởng phòng chưa duyệt đã đẩy qua tiến
 * hành đặt hàng rồi"*. Thẻ `260001-HPCS-PR-001` đang ở cột ⑤ *Tiến hành đặt hàng* kèm
 * `260001-HPCS-PO-001`, trong khi cột ③ *Xét duyệt báo giá* và cột ④ *Lập đơn mua hàng* đều
 * trống — tức đơn hàng ra đời mà **không ai duyệt giá**.
 *
 * Nguyên nhân: `themDonHang` tạo đơn thẳng ở trạng thái `da_chot` mà không kiểm điều kiện gì.
 * Giai đoạn thì SUY RA từ chứng từ (nguyên tắc đầu file), nên có đơn đã chốt là thẻ nhảy
 * thẳng lên bước ⑤, bỏ qua hai bước giữa. Luật chặn cũ chỉ nằm ở đường KÉO THẢ
 * (`vuongMacSangBuocSau`), còn nút "Lập đơn đặt hàng" đi đường khác nên lọt hết.
 *
 * 🔴 ĐÂY LÀ LỖ HỔNG KIỂM SOÁT CHI TIÊU, không phải lỗi hiển thị. Đơn hàng là cam kết trả tiền
 * cho nhà cung cấp; lập được đơn mà không qua duyệt giá nghĩa là một người có thể tự chọn nhà
 * cung cấp và tự chốt giá, không ai đối chiếu.
 *
 * 📌 Đòi bảng báo giá ở trạng thái `da_chon_ncc` chính là đòi bước ③ đã xong: trạng thái đó
 * chỉ được đặt khi trưởng bộ phận chốt nhà cung cấp hoặc duyệt phương án chia đơn.
 *
 * ---
 *
 * 🔴 HÀM NÀY CHỈ NHẬN BẢNG BÁO GIÁ CỦA MỘT ĐỀ NGHỊ — nó không biết gì về việc "đơn có gắn đề
 * nghị hay không", và **đừng chuyển việc kiểm đó vào đây**: hàm thuộc `2-quy-trinh/` nên chỉ
 * được biết về bảng báo giá. Nơi gọi tự lo phần đó.
 *
 * 📌 DIỄN BIẾN 18/08/2026, ghi lại để không ai dựng lại bản sáng:
 *  · SÁNG — module "Lập đơn mua hàng (PO)" cất được đơn KHÔNG gắn đề nghị. Đơn đó không có bảng
 *    báo giá nào để đối chiếu (gọi hàm này với mảng rỗng là chặn 100%), nên `themDonHang` được
 *    cho **bỏ qua** chốt. Tức đường đó **đi vòng qua đúng lỗ hổng kiểm soát chi tiêu** mà chỉ
 *    đạo 15/08/2026 ở trên sinh ra để vá. Rủi ro đã báo lên Ban lãnh đạo.
 *  · CHIỀU — Ban lãnh đạo trả lời *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*: module đó không cất
 *    đơn nữa, chỉ in / xuất mẫu. `themDonHang` vì vậy đã **siết lại — thiếu `prId` là từ chối
 *    cất**, rồi mới chạy hàm này. Nghĩa là **mọi đơn nằm trong hệ thống đều đã qua chốt này.**
 */
export function vuongMacLapDonHang(
  baoGiaCuaDeNghi: BaoGia[],
  /**
   * ★★ Đề nghị — CHỈ để kiểm điều kiện HỢP ĐỒNG (Ban lãnh đạo 26/08/2026: *"Phải có hợp đồng
   * hoặc thoả thuận mua bán thì mới tiến hành lập PO được"*).
   *
   * 🔴 CỐ Ý ĐỂ TÙY CHỌN. Chế độ lập đơn MẪU (`/don-hang/tao-moi` không kèm `?prId=`) không có đề
   * nghị nào, mà nó cũng **không cất đơn** nên không có gì để chặn. Bắt buộc tham số này là chế
   * độ mẫu hết dùng được.
   */
  deNghi?: DeNghiMuaHang,
): string | null {
  const conSong = baoGiaCuaDeNghi.filter((b) => b.trangThai !== "huy");
  if (conSong.length === 0) {
    return "Chưa có bảng báo giá nào cho đề nghị này. Phải lập bảng báo giá, thu thập giá rồi trình trưởng bộ phận duyệt trước khi lập đơn đặt hàng.";
  }
  if (conSong.some((b) => b.trangThai === "da_chon_ncc")) {
    /**
     * ★★ HỢP ĐỒNG PHẢI CÓ TRƯỚC KHI LẬP ĐƠN — Ban lãnh đạo 26/08/2026.
     *
     * 🔴 XÉT SAU CÙNG, khi mọi điều kiện báo giá đã xong: nói cái nặng trước (chưa duyệt báo
     * giá) thì người dùng đi làm đúng việc cần làm, không nhảy qua nhảy lại giữa hai lời nhắc.
     *
     * 🔴 GỌI `vuongMacRoiBuocLapDon`, TUYỆT ĐỐI KHÔNG GỌI `coHopDong` — cùng bài học đã ghi ở
     * `xacDinhGiaiDoan`: `vuongMacRoiBuocLapDon` chấp nhận **tệp HOẶC lý do** (chỉ đạo
     * 23/08/2026), còn `coHopDong` chỉ hỏi có tệp. Dùng lẫn là hai chỗ cùng trả lời một câu hỏi
     * mà nói khác nhau — đúng lỗi đã phải sửa ngày 23/08.
     *
     * 📌 Đường "ghi lý do" VẪN GIỮ, và đó là chủ ý: mẫu **PO-02 — Đơn mua hàng kèm thoả thuận**
     * thì chính tờ đơn là thoả thuận, không có hợp đồng riêng để đính. Bỏ đường đó là khoá cứng
     * mọi đơn dùng mẫu PO-02.
     */
    return deNghi ? vuongMacRoiBuocLapDon(deNghi) : null;
  }
  if (conSong.some((b) => b.trangThai === "da_so_sanh")) {
    return "Bảng báo giá đã trình nhưng trưởng bộ phận CHƯA DUYỆT. Phải chốt nhà cung cấp (hoặc duyệt phương án chia đơn) ở bước Xét duyệt báo giá trước khi lập đơn đặt hàng.";
  }
  return "Bảng báo giá còn đang thu thập giá, chưa trình duyệt. Nhập đủ giá rồi bấm trình xét duyệt, trưởng bộ phận duyệt xong mới lập được đơn đặt hàng.";
}

/**
 * ★ DÒNG NÀO CỦA ĐỀ NGHỊ MÀ NGƯỜI NÀY LẬP ĐƯỢC ĐƠN — hàm thuần, MỘT CHỖ DUY NHẤT.
 *
 * Ba điều kiện, cả ba đều bắt buộc:
 *   ① Còn khối lượng chưa lên đơn — hết rồi thì đặt thêm là mua vượt phần đã duyệt.
 *   ② Dòng đã có người phụ trách — dòng chưa phân bổ thuộc bước ①, chưa tới lượt lập đơn.
 *   ③ Là người phụ trách chính dòng đó, HOẶC là người có quyền phân bổ (trưởng bộ phận /
 *      quản trị) — trưởng bộ phận lập đơn thay được cho cả nhóm.
 *
 * 📌 Tách ra khỏi file giao diện ngày 18/08/2026, lúc đó có HAI chỗ cần đúng luật này: form
 * lập đơn (`thanh-phan-nghiep-vu/form-lap-don-mua-hang.tsx` → `dongLapDuoc`) và bước CHỌN ĐỀ
 * NGHỊ của `/don-hang/tao-moi`. **Bước chọn đó đã bị bỏ ngay chiều 18/08/2026** (Ban lãnh đạo:
 * mục menu là module lập đơn ĐỘC LẬP, không hỏi đề nghị nữa), nên nay chỉ còn một nơi gọi.
 * Vẫn giữ ở đây chứ không nhét ngược vào file giao diện: `2-quy-trinh/` là chỗ của luật, và
 * quy tắc 3.4b của dự án cấm để hàm nghiệp vụ trong file giao diện.
 *
 * ⚠️ Ở CHẾ ĐỘ ĐƠN ĐỘC LẬP hàm này không được gọi tới (không có đề nghị nào để lọc dòng) —
 * mặt hàng lúc đó do người lập gõ tự do. Xem bảng hai chế độ ở đầu `form-lap-don-mua-hang.tsx`.
 *
 * ⚠️ Nhận `laNguoiPhanBo` là BOOLEAN, không nhận cả đối tượng `Quyen`: `2-quy-trinh/` là quy
 * tắc nghiệp vụ thuần, không được phụ thuộc vào `4-phan-quyen/`. Chỗ gọi truyền
 * `quyen.phanBoCongViec` vào.
 */
export function dongLapDuocDonHang(
  tienDo: TienDoDongDeNghi[],
  uidNguoiLap: string,
  laNguoiPhanBo: boolean,
): TienDoDongDeNghi[] {
  return tienDo.filter(
    (d) =>
      d.khoiLuongChuaLenPO > 0 &&
      Boolean(d.nguoiPhuTrachUid) &&
      (laNguoiPhanBo || d.nguoiPhuTrachUid === uidNguoiLap),
  );
}

/*
 * 📌 ĐÃ XÓA `dongThuocVeNguoi` NGÀY 18/08/2026 (chiều).
 *
 * Hàm đó sinh ra sáng cùng ngày, chỉ phục vụ **bước chọn đề nghị** của `/don-hang/tao-moi`:
 * nó phân biệt *"đề nghị này chưa phân bổ dòng nào cho bạn"* với *"dòng của bạn đã lên đơn đủ
 * rồi"*. Chiều 18/08/2026 Ban lãnh đạo bỏ hẳn bước chọn (mục menu là module lập đơn ĐỘC LẬP),
 * nên hàm không còn nơi gọi.
 *
 * 🔴 XÓA CHỨ KHÔNG ĐỂ LẠI: một hàm xuất khẩu không ai gọi trông y như đang có chức năng, và
 * người sau sẽ mất công dò xem nó chạy ở đâu. Cần lại thì lấy ở lịch sử git.
 */

/**
 * ★ KÉO LÙI MỘT BƯỚC — quyết định app phải hủy chứng từ nào.
 *
 * 🔴🔴 HÀM NÀY HIỆN KHÔNG AI GỌI, VÀ ĐÓ LÀ CỐ Ý — ĐỪNG XÓA.
 *
 * ⚠️ Khối chú thích ngay phía trên nói *"hàm không ai gọi thì xóa"* — câu đó nói về
 * `dongThuocVeNguoi`, **KHÔNG áp cho hàm này**. Đây là ngoại lệ có lý do:
 *
 * Ban lãnh đạo 26/08/2026: *"e tạm đóng gói chức năng kéo lùi bước trong bảng kanban, tính năng
 * này sẽ xử lý sau"* — chữ **"tạm"** và **"xử lý sau"**, tức sẽ bật lại. Nên chốt chặn đặt ở
 * `quyetDinhKeoTha` (một khối `if`, xóa đi là bật lại), còn toàn bộ luật hủy chứng từ theo từng
 * bước thì giữ nguyên tại đây. Luật đó là chỉ đạo 13/08/2026 và có những ca đã xử riêng: bảng
 * báo giá đã có giá thì chặn lùi · đơn nháp phải hủy trước · phiếu nhận của Kho thì Thu mua
 * không được xóa. Xóa hàm là lúc bật lại phải viết lại từ đầu và **mất sạch các ca đó**.
 *
 * 🔴 Ban lãnh đạo 13/08/2026: *"chỉ cho tiến hoặc lùi trong phạm vi 1 bước"*.
 *
 * ⚠️ LÙI KHÔNG PHẢI ĐỔI NHÃN. Giai đoạn được SUY RA từ chứng từ có thật, nên muốn thẻ về
 * cột trước thì phải hủy đúng chứng từ đang giữ nó ở cột này. Nếu chỉ đổi nhãn thì lần vẽ
 * lại bảng tiếp theo thẻ tự nhảy về chỗ cũ — người dùng tưởng app hỏng.
 *
 * 🔒 CHẶN LÙI TỪ "NHẬN HÀNG": phiếu nhận là chứng từ của KHO, và theo nguyên tắc dữ liệu số
 * 2 thì Kho là nguồn duy nhất của số lượng thực nhận — Thu mua không được xóa phiếu của họ.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- xem khối chú thích ngay trên
function quyetDinhLui(
  tu: GiaiDoanMuaHang,
  ve: GiaiDoanMuaHang,
  poCuaDeNghi: DonDatHang[],
  baoGiaCuaDeNghi: BaoGia[],
): HanhDongKeoTha {
  switch (tu) {
    case "yeu_cau_bao_gia": {
      // Về ①: bỏ hết phân bổ, và hủy bảng báo giá nếu đã lập.
      const bg = baoGiaCuaDeNghi.filter((b) => b.trangThai !== "huy");
      const coGia = bg.some((b) => b.items.some((d) => d.baoGiaNCC.length > 0));
      if (coGia) {
        return {
          loai: "khong_the",
          lyDo: "Bảng báo giá đã có giá của nhà cung cấp — lùi về bước ① sẽ mất số liệu đó. Hủy bảng báo giá ở trang chi tiết nếu thật sự muốn làm lại.",
        };
      }
      return {
        loai: "lui_buoc",
        ve,
        viec:
          bg.length > 0
            ? "Hủy bảng báo giá trống và bỏ toàn bộ phân bổ người phụ trách."
            : "Bỏ toàn bộ phân bổ người phụ trách — đề nghị về lại bước tiếp nhận.",
      };
    }

    case "xet_duyet_bao_gia":
      // Về ②: mở lại bảng báo giá cho nhân viên thu thập tiếp. KHÔNG mất giá đã nhập.
      return {
        loai: "lui_buoc",
        ve,
        viec: "Mở lại bảng báo giá để thu thập tiếp. Giá đã nhập vẫn giữ nguyên.",
      };

    case "lap_don_mua_hang": {
      // Về ③: bỏ nhà cung cấp đã chốt. Còn đơn nháp thì phải hủy đơn trước.
      if (poCuaDeNghi.some((po) => po.trangThai === "nhap")) {
        return {
          loai: "khong_the",
          lyDo: "Đã có đơn đặt hàng nháp cho đề nghị này. Hủy đơn nháp trước rồi mới lùi được về bước xét duyệt báo giá.",
        };
      }
      return {
        loai: "lui_buoc",
        ve,
        viec: "Bỏ nhà cung cấp đã chốt — bảng báo giá về trạng thái chờ duyệt.",
      };
    }

    case "dat_hang":
      // Về ④: đưa đơn đã chốt về nháp để sửa lại.
      return {
        loai: "lui_buoc",
        ve,
        viec: "Đưa các đơn đã chốt về trạng thái nháp để sửa lại. Đơn chưa gửi nhà cung cấp thì làm được; đã gửi rồi thì phải thông báo cho họ.",
      };

    case "nhan_hang":
      return {
        loai: "khong_the",
        lyDo: "Đã có phiếu nhận hàng của Kho. Phiếu nhận là chứng từ của Kho — Thu mua không xóa được. Nhờ thủ kho hủy phiếu trước.",
      };

    default:
      return {
        loai: "khong_the",
        lyDo: "Bước này không lùi được.",
      };
  }
}

export function quyetDinhKeoTha(
  the: TheDeNghiTrenBang,
  dich: GiaiDoanMuaHang,
  poCuaDeNghi: DonDatHang[],
  baoGiaCuaDeNghi: BaoGia[],
  /** Cấu hình quy trình — hàm tự tra công việc bắt buộc và cài đặt của bước đang đứng. */
  cauHinh: CauHinhQuyTrinh,
  /**
   * ★ Câu vướng mắc của bước ② (đủ số bản báo giá + bảng so sánh) — `null` là không vướng.
   *
   * 🔴 NHẬN VÀO CHỨ KHÔNG TỰ TÍNH, và là tham số **BẮT BUỘC**. Luật đó nằm ở
   * `2-quy-trinh/bao-gia-dinh-kem.ts` → `vuongMacTrinhXetDuyet`, mà tệp đó `import` từ
   * `3-du-lieu/kho-du-lieu` (một hằng số), còn `kho-du-lieu` thì `import` ngược lại tệp này —
   * gọi thẳng là tạo **vòng tròn import**. Nên nơi gọi (tầng giao diện, chỗ đã có cả hai) tính
   * hộ rồi truyền vào.
   *
   * ⚠️ CỐ Ý KHÔNG cho `?`: để trống được thì nơi gọi nào quên truyền sẽ **mất im lặng** đúng
   * cái chốt vừa phải đi sửa. Thà TypeScript báo đỏ ngay.
   */
  vuongMacBaoGia: string | null,
): HanhDongKeoTha | null {
  const tu = the.giaiDoan;
  if (tu === dich) return null;

  if (giaiDoanDaKetThuc(tu)) {
    return { loai: "khong_the", lyDo: "Đề nghị đã kết thúc — không kéo được nữa." };
  }

  /**
   * 🔴 ĐÓNG DỞ KHÔNG BỊ CHẶN BỞI BẤT KỲ ĐIỀU KIỆN NÀO — cố ý, và đây là chủ ý mới 24/08/2026.
   *
   * Đo được trước đó: hồ sơ ở bước ① còn treo việc "Checkin hàng tồn kho"; công trình hủy nhu
   * cầu vật tư nên chẳng ai cần kiểm tồn kho nữa, nhưng hộp kéo thả **khóa nút** cho tới khi
   * tích việc đó. Tức app buộc người dùng **ghi một dữ liệu SAI** (báo đã kiểm tồn kho khi
   * không kiểm) chỉ để hủy một hồ sơ. Xem thêm chốt bỏ khóa nút ở `hop-chuyen-giai-doan.tsx`.
   */
  if (dich === "that_bai") return { loai: "dong_do" };


  const buocTu = THU_TU_GIAI_DOAN.indexOf(tu);
  const buocDich = THU_TU_GIAI_DOAN.indexOf(dich);

  /**
   * ★ PHẠM VI KÉO THẢ: ĐÚNG MỘT BƯỚC, cả tiến lẫn lùi — Ban lãnh đạo 13/08/2026.
   * Bản trước chặn lùi hoàn toàn; nay lùi được nhưng chỉ một bước.
   */
  if (buocDich < buocTu - 1 || buocDich > buocTu + 1) {
    return {
      loai: "khong_the",
      /* Câu này không nhắc "lùi một bước" nữa — kéo lùi đang tạm tắt, xem khối ngay dưới. */
      lyDo: "Chỉ kéo được sang bước LIỀN KỀ phía sau, không nhảy cóc.",
    };
  }

  /**
   * ★★ KÉO LÙI ĐANG TẠM TẮT — Ban lãnh đạo 26/08/2026: *"e tạm đóng gói chức năng kéo lùi bước
   * trong bảng kanban, tính năng này sẽ xử lý sau"*.
   *
   * 🔴 CHẶN Ở ĐÂY, KHÔNG XOÁ `quyetDinhLui`. Hàm đó giữ nguyên toàn bộ luật hủy chứng từ tương
   * ứng từng bước (chỉ đạo 13/08/2026) — xoá đi thì lúc bật lại phải viết lại từ đầu, và viết
   * lại thì mất những ca đã xử: bảng báo giá đã có giá thì chặn lùi, đơn nháp phải hủy trước,
   * phiếu nhận của Kho thì Thu mua không được xoá.
   *
   * ✅ CÁCH BẬT LẠI: xoá đúng khối `if` này. Một dòng, không cần dựng lại gì.
   *
   * ⚠️ TẮT KÉO LÙI KHÔNG PHẢI LÀ KHÔNG LÙI ĐƯỢC. Hồ sơ đi nhầm bước vẫn sửa được bằng cách hủy
   * chứng từ đang giữ nó ở bước đó (hủy đơn nháp, hủy bảng báo giá…) — giai đoạn suy ra từ chứng
   * từ nên thẻ tự về. Câu dưới nói đúng đường đó, đừng để người dùng tưởng hồ sơ kẹt vĩnh viễn.
   */
  if (buocDich === buocTu - 1) {
    return {
      loai: "khong_the",
      lyDo: "Chức năng kéo lùi bước đang tạm tắt. Hồ sơ đi nhầm bước thì hủy chứng từ đang giữ nó ở bước đó (đơn nháp, bảng báo giá…) — thẻ sẽ tự về bước trước.",
    };
  }

  /**
   * 🔴 KHỐI NÀY PHẢI ĐỨNG **SAU** PHÉP KIỂM NHẢY CÓC — sửa 25/08/2026.
   *
   * Ngày 24/08 tôi đặt nó ở ĐẦU hàm, trước cả phép kiểm "chỉ kéo được sang bước liền kề". Hậu
   * quả đo được: kéo thẻ từ bước ① (hoặc ④) thẳng sang cột **Hoàn thành** thì app trả về câu
   * *"Hồ sơ đã đủ điều kiện hoàn thành"* — trong khi hồ sơ mới ở bước đầu, chưa có báo giá,
   * chưa có đơn hàng, chưa nhận hàng. Cùng lúc đó kéo ① sang một cột khác thì vẫn bị chặn đúng
   * bằng câu "Chỉ kéo được sang bước liền kề".
   *
   * ⚠️ Vì sao lọt: `vuongMacSangBuocSau(deNghi, tu, …)` hỏi điều kiện rời **bước ĐANG ĐỨNG**,
   * không hỏi khoảng cách tới bước đích. Đứng ở ① thì bước ① đã xong (đã phân bổ đủ người) nên
   * hàm trả `null` = "không vướng" — và câu trả lời đó hoàn toàn đúng với câu hỏi của nó. Sai là
   * ở chỗ tôi hỏi nó thay cho một câu hỏi khác hẳn.
   *
   * 📌 Đặt sau phép kiểm liền kề thì chỉ còn đúng một đường vào đây: từ ⑦ sang ⑧.
   */
  if (dich === "hoan_thanh") {
    /**
     * 🔴 GỌI HÀM LUẬT, KHÔNG VIẾT CỨNG CÂU CHẶN — sửa 24/08/2026 sau khi Ban lãnh đạo báo lệch
     * lần thứ hai.
     *
     * Câu cũ viết cứng: *"Hoàn thành cần đủ 4 điều kiện: giao đủ khối lượng + phiếu giao nhận +
     * thủ kho xác nhận + trưởng bộ phận xác nhận — thao tác ở trang chi tiết ĐƠN HÀNG"*. Đo được
     * là nó **sai cả điều kiện lẫn nơi phải đến**:
     *   · Hồ sơ chỉ vào được bước ⑦ khi hàng ĐÃ về đủ, nên cả bốn điều kiện đó thường đã xong.
     *     Thứ thật sự chặn là **Hóa đơn VAT** và ô tích **ủy nhiệm chi** — câu cũ không hề nhắc.
     *   · Nút "Hoàn thành quy trình" nằm ở trang chi tiết **ĐỀ NGHỊ**, còn câu cũ chỉ sang trang
     *     đơn hàng — nơi KHÔNG có ô nào đính hóa đơn VAT. Người dùng sang đó tìm, thấy mọi thứ
     *     xanh, không hiểu app đang đòi gì.
     *
     * Nay dùng chung `vuongMacSangBuocSau` với nút, nên hai đường **không thể nói khác nhau**.
     */
    /* Đủ điều kiện thì DẪN tới đúng nút, đừng chặn tuyệt đối: việc hoàn thành là một quyết
       định có người bấm (Ban lãnh đạo 22/08/2026), không phải hệ quả của một cú kéo. */
    const danToiNutHoanThanh: HanhDongKeoTha = {
      loai: "mo_trang",
      duongDan: `/de-nghi/${the.deNghi.id}`,
      thongBao:
        "Hồ sơ đã đủ điều kiện hoàn thành. Bấm “Hoàn thành quy trình” ở cuối trang chi tiết đề nghị để đóng hồ sơ.",
    };

    /**
     * ★★ CỬA ⑦ → ⑧ CŨNG PHẢI CÓ Ô NHẬP NHANH — bổ sung 25/08/2026 cùng lượt với khối bên dưới.
     *
     * 🔴 SUÝT BỎ SÓT ĐÚNG CỬA QUAN TRỌNG NHẤT. Nhánh `dich === "hoan_thanh"` này `return` **trước**
     * khối `can_go_vuong` ở cuối hàm, nên nếu chỉ sửa dưới đó thì **hóa đơn VAT và ủy nhiệm chi**
     * — hai chứng từ Ban lãnh đạo nêu đích danh — vẫn bị chặn bằng một câu chữ, hộp không mở, ô
     * nhập không bao giờ hiện. Sửa xong mà màn hình không đổi gì.
     *
     * 📌 Ở ĐÂY GIỮ NGUYÊN `cauHinh` (KHÔNG xoá `congViecTheoBuoc`), khác khối cuối hàm. Cửa hoàn
     * thành phải soát cả việc bắt buộc của bước ⑦, và hộp có sẵn danh sách tích được cho chúng.
     */
    const dsHoanThanh = dsDieuKienConVuong(
      the.deNghi,
      tu,
      baoGiaCuaDeNghi,
      cauHinh,
      vuongMacBaoGia,
    );
    if (dsHoanThanh.length > 0) {
      if (dsHoanThanh.every((d) => d.goDuocTaiCho)) {
        return {
          loai: "can_go_vuong",
          dieuKien: dsHoanThanh,
          hanhDongSau: danToiNutHoanThanh,
        };
      }
      /* Còn mục phải sang màn khác mới gỡ được → chặn, nói đúng câu của hàm luật (mục đầu). */
      return { loai: "khong_the", lyDo: dsHoanThanh[0].cau };
    }
    return danToiNutHoanThanh;
  }

  /**
   * 🔴 BƯỚC TRƯỚC PHẢI XONG MỚI ĐI TIẾP (chỉ đạo Ban lãnh đạo 10/08/2026) — nhưng CHỈ chặn
   * ở bước ①, không chặn chung mọi bước.
   *
   * ⚠️ Trước 14/08/2026 chốt này chạy cho MỌI bước, ngay trước `switch`, nên nó giết luôn
   * hai nhánh bên dưới đã cố tình thiết kế để dẫn người dùng đi tiếp:
   *   · bước ② chưa có bảng báo giá → lẽ ra MỞ màn lập bảng, lại bị chặn
   *   · bước ③ bảng chưa duyệt → lẽ ra MỞ bảng so sánh để chốt NCC, cũng bị chặn
   * Đúng cái "làm người dùng kẹt" mà chú thích trong hai nhánh đó nói đã sửa: đứng ở cột ②,
   * kéo sang ③ thì bị chặn, mà trên bảng không có đường nào khác để lập bảng báo giá.
   *
   * Bỏ chốt ở hai bước đó KHÔNG mở đường đi tắt: cả hai nhánh đều trả về hành động MỞ MÀN
   * để làm việc thật (lập bảng / chọn NCC), thẻ chỉ chuyển cột khi chứng từ có thật — đúng
   * nguyên tắc "giai đoạn suy ra từ chứng từ, kéo thả không đổi nhãn chay".
   */
  /**
   * ★ CÔNG VIỆC BẮT BUỘC CHƯA XONG THÌ MỞ HỘP CHO TÍCH NGAY, KHÔNG CHẶN BẰNG MỘT CÂU BÁO LỖI.
   *
   * 🔴 Ban lãnh đạo 16/08/2026: *"khi trưởng bộ phận kéo sang bước 2 là phải hiện xác nhận đã
   * check hàng tồn kho, nếu chưa tích xác nhận thì chưa cho chuyển"*.
   *
   * Trước đây chỗ này trả `khong_the` kèm câu *"Tích hoàn thành ở khối Công việc của bước
   * trong trang chi tiết đề nghị"* — người dùng đang đứng ở BẢNG QUY TRÌNH, bị đuổi sang một
   * màn khác, làm xong lại phải quay về kéo lại. Hộp chuyển bước vốn đã có sẵn chỗ hiện việc
   * còn treo và khóa nút; chặn từ đây thì hộp đó không bao giờ mở ra được.
   *
   * 📌 Nút trong hộp VẪN KHÓA cho tới khi tích đủ — đây là mở đường làm việc, không phải mở
   * đường đi tắt. Luật chặn vẫn là `congViecChuaXongCuaBuoc`, một chỗ duy nhất.
   */
  /**
   * ★★ MỘT ĐIỀU KIỆN CHO MỌI ĐƯỜNG CHUYỂN BƯỚC — Ban lãnh đạo 23/08/2026: *"kiểm tra lại tính
   * năng kéo chuyển bước, khi kéo chuyển bước thì các điều kiện chuyển bước phải đồng nhất với
   * khi chuyển bước ở cửa sổ chi tiết"*.
   *
   * 🔴 CHỖ LỆCH ĐÃ TÌM RA: trước hôm nay `vuongMacSangBuocSau` chỉ được hỏi khi đứng ở bước ①.
   * Kéo từ ④ sang ⑤ thì hàm này **im lặng dẫn người dùng đi lập đơn**, không hề nói rằng bước ④
   * còn đòi bản hợp đồng (hoặc lý do chưa có). Người dùng lập đơn xong, quay lại thấy thẻ vẫn
   * nằm cột ④ và không hiểu vì sao — đúng câu Ban lãnh đạo hỏi lúc 17:44 cùng ngày.
   *
   * 👉 Nay hỏi cho MỌI bước tiến, và xử theo bản chất của hành động:
   *   · Hành động là MỞ TRANG (④ ⑤ ⑦) → vẫn mở, nhưng **ghép lý do vướng vào thông báo**. Mở
   *     trang chính là cách gỡ vướng, chặn lại thì người dùng không có đường nào để làm.
   *   · Hành động là GHI DỮ LIỆU (lập bảng báo giá, chốt so sánh) → chặn kèm lý do, như cũ.
   *
   * ⚠️ VÌ SAO KHÔNG CHẶN THẲNG MỌI BƯỚC CHO GỌN: bước ② khi chưa có bảng báo giá thì
   * `vuongMacSangBuocSau` trả *"Chưa có bảng báo giá nào đang thu thập"* — mà hành động của
   * nhánh đó chính là LẬP BẢNG, tức là việc gỡ đúng cái vướng vừa nêu. Chặn là dựng lại đúng cái
   * bí đã phải sửa ngày 14/08/2026: đứng cột ②, kéo sang ③ bị chặn, mà trên bảng không có đường
   * nào khác để lập bảng báo giá.
   *
   * 📌 `congViecTheoBuoc: {}` — bỏ phần "công việc bắt buộc của bước" khỏi lần hỏi này, vì việc
   * đó đã có đường riêng: hộp chuyển bước bày danh sách việc còn treo và khóa nút cho tới khi
   * tích đủ (chỉ đạo 16/08/2026). Để nguyên thì hộp đó không bao giờ mở ra được.
   */
  /**
   * ★★ CHỐT CÔNG VIỆC BẮT BUỘC CỦA CÁC BƯỚC **TRƯỚC** — bổ sung 23/08/2026 (tối), sau khi Sếp hỏi
   * lại: *"e vẫn chưa sửa điều kiện khi kéo chuyển bước đúng ko?"*.
   *
   * 🔴 SÁNG NAY TÔI SỬA THIẾU MỘT NỬA. Lượt sửa trước chỉ gộp điều kiện của **bước đang đứng**
   * (`vuongMacSangBuocSau`); còn chốt *"công việc bắt buộc của bước TRƯỚC còn treo"*
   * (`vuongMacViecBatBuocCacBuocTruoc`) thì chiều nay mới thêm, và **chỉ thêm cho 4 cửa ghi dữ
   * liệu** — kéo thả bị bỏ sót. Nghĩa là hồ sơ chưa tích *"Checkin hàng tồn kho"* bị chặn khi bấm
   * nút, mà kéo thẻ thì vẫn đi. Đúng kiểu lệch mà Sếp yêu cầu dẹp.
   *
   * 🔴 CHẶN CỨNG, KHÔNG "MỞ HỘP CHO TÍCH NGAY" như việc của bước đang đứng: việc treo nằm ở **bước
   * khác**, mà hộp chuyển bước chỉ bày và tích được việc của bước đang đứng. Mở hộp ra thì người
   * dùng thấy một danh sách không chứa cái đang chặn họ — bí và không hiểu vì sao.
   *
   * 📌 CHỈ CHẶN KHI TIẾN. Kéo LÙI đã `return` ở dòng trên, không đi qua đây — lùi là để sửa sai,
   * chặn lùi vì giấy tờ còn treo là khóa luôn đường sửa.
   */
  const chanViecBuocTruoc = vuongMacViecBatBuocCacBuocTruoc(the.deNghi, tu, cauHinh);
  if (chanViecBuocTruoc) return { loai: "khong_the", lyDo: chanViecBuocTruoc };

  const vuongMacBuocDangDung = vuongMacSangBuocSau(
    the.deNghi,
    tu,
    baoGiaCuaDeNghi,
    { ...cauHinh, congViecTheoBuoc: {} },
    vuongMacBaoGia,
  );

  const hanhDong = hanhDongTienMotBuoc(tu, the, poCuaDeNghi, baoGiaCuaDeNghi);
  if (!vuongMacBuocDangDung) return hanhDong;

  /**
   * ★★ VƯỚNG MẮC GỠ ĐƯỢC NGAY TRONG HỘP → MỞ HỘP KÈM Ô, KHÔNG ĐUỔI ĐI ĐÂU CẢ.
   * Ban lãnh đạo 25/08/2026: *"Kéo qua bước phải hiển thị các trường nhập nhanh các điều kiện
   * chuyển bước"*.
   *
   * 🔴🔴 KHỐI NÀY PHẢI ĐỨNG **TRƯỚC** NHÁNH `mo_trang` BÊN DƯỚI — và đây đúng là chỗ tôi vừa đặt
   * sai rồi phải sửa ngay trong lượt này. Lý do: hai bước mà Ban lãnh đạo cần ô nhập nhanh nhất
   * đều trả `mo_trang`:
   *   · bước ⑤ "Tiến hành đặt hàng"  → vướng **tệp hợp đồng**
   *   · bước ⑦ "Hồ sơ thanh toán"    → vướng **hóa đơn VAT / ủy nhiệm chi**
   * Đặt sau `mo_trang` thì hai ca đó không bao giờ tới đây, app vẫn đá người dùng sang trang chi
   * tiết như cũ — sửa xong mà **không có gì đổi trên màn hình**, đúng kiểu "tưởng xong mà chưa".
   *
   * 🔴 CHIA THEO `goDuocTaiCho`, KHÔNG CHIA THEO BƯỚC. Chia theo bước thì mỗi lần quy trình đổi
   * lại phải nhớ sửa một danh sách bước ở đây — kiểu chốt sớm muộn thiếu một mục rồi lọt im lặng
   * (đã xảy ra ba lần với chính hàm này). Còn `goDuocTaiCho` do chính nơi định nghĩa điều kiện
   * khai, nên thêm điều kiện mới là tự động đúng.
   *
   * ⚠️ ĐÒI **MỌI** MỤC GỠ ĐƯỢC TẠI CHỖ, không phải "có ít nhất một mục". Còn lẫn một mục phải
   * sang màn khác mới gỡ được thì hộp mở ra sẽ bày một bộ ô mà gỡ hết vẫn không mở được nút —
   * người dùng làm xong vẫn kẹt và không hiểu vì sao. Ca đó để rơi xuống dưới, chặn thẳng và chỉ
   * đúng chỗ phải tới.
   *
   * 📌 `congViecTheoBuoc: {}` giống hệt lần hỏi trên: việc bắt buộc của bước đã có đường riêng
   * trong hộp (danh sách tích được, chỉ đạo 16/08/2026), đưa vào đây là đếm hai lần.
   */
  const dsVuong = dsDieuKienConVuong(
    the.deNghi,
    tu,
    baoGiaCuaDeNghi,
    { ...cauHinh, congViecTheoBuoc: {} },
    vuongMacBaoGia,
  ).filter((d) => {
    /**
     * 🔴 BỎ MỤC MÀ CHÍNH CÁI NÚT SẼ LÀM — sửa 25/08/2026 sau khi Ban lãnh đạo báo hộp trống.
     *
     * *"Chưa có bảng báo giá nào"* là việc APP tự làm khi bấm nút (`tao_bao_gia`), không phải
     * việc người dùng phải gỡ. Giữ nó trong danh sách thì nó kéo cả danh sách xuống "còn mục
     * không gỡ được tại chỗ" → hộp không bày ô nào → đúng cái màn hình trống Ban lãnh đạo chụp:
     * chỉ có ô ghi chú và nút *"Tạo bảng báo giá"*, không một ô đính kèm báo giá nào.
     *
     * ⚠️ CHỈ bỏ khi hành động sắp làm ĐÚNG LÀ lập bảng. Ở ca khác (đã có bảng) mục này không
     * sinh ra, còn nếu về sau có nhánh nào khác thì nó vẫn phải chặn như cũ.
     */
    const nutSeTuLam =
      d.ma === "chua_lap_bang_bao_gia" &&
      tu === "yeu_cau_bao_gia" &&
      hanhDong.loai === "tao_bao_gia";
    return !nutSeTuLam;
  });
  if (dsVuong.length > 0 && dsVuong.every((d) => d.goDuocTaiCho)) {
    return { loai: "can_go_vuong", dieuKien: dsVuong, hanhDongSau: hanhDong };
  }

  /**
   * 🔴🔴 CÒN VƯỚNG MẮC THÌ **MẶC ĐỊNH CHẶN** — sửa 24/08/2026 sau khi Ban lãnh đạo báo LẦN THỨ BA.
   *
   * Ban lãnh đạo: *"sao kéo chuyển bước chưa có các điều kiện giống chuyển bước trong chi tiết.
   * Ví dụ: Bước 2 sang bước 3 phải đính kèm báo giá và bảng so sánh giá"*.
   *
   * ⚠️ VÌ SAO HAI LẦN SỬA TRƯỚC CHƯA ĂN: tôi đã cho `vuongMacSangBuocSau` hỏi đủ điều kiện báo
   * giá, nhưng đoạn dưới đây **tính ra vướng mắc rồi vứt đi**. Chú thích cũ ghi *"Còn lại là hành
   * động LÀM VIỆC THẬT — chính là cách gỡ vướng, nên cho đi"*. Câu đó ĐÚNG với một ca duy nhất
   * (chưa có bảng báo giá → lập bảng), và SAI với ca Ban lãnh đạo vừa nêu:
   *
   *   Hồ sơ có bảng báo giá đang thu thập nhưng mới đính 1/3 bản, chưa có bảng so sánh.
   *   → `hanhDongTienMotBuoc` trả `chot_so_sanh` (một hành động **GHI DỮ LIỆU**).
   *   → Chốt so sánh KHÔNG làm cho có thêm bản báo giá nào, tức KHÔNG gỡ được vướng mắc.
   *   → Vậy mà code cũ vẫn `return hanhDong` → bảng chuyển `da_so_sanh`, thẻ sang cột ③.
   *
   * 🔴 ĐẢO MẶC ĐỊNH: trước là "cho đi trừ khi nằm trong `CHAN_CUNG`", nay là "chặn trừ đúng một
   * ngoại lệ". Một chốt phải mặc định CHẶN — danh sách miễn trừ thì người ta nhớ bổ sung, còn
   * danh sách cấm thì sớm muộn thiếu một mục và lọt im lặng, đúng như đã xảy ra ba lần.
   */

  /* ① Hành động chỉ ĐIỀU HƯỚNG: mở trang kèm câu vướng, để người dùng tới đúng chỗ mà gỡ.
     Không ghi gì nên không có gì lọt — đây chính là phần "đồng nhất với cửa sổ chi tiết":
     cùng một câu, do cùng một hàm sinh ra. */
  if (hanhDong.loai === "mo_trang") {
    return {
      ...hanhDong,
      thongBao: `${vuongMacBuocDangDung} ${hanhDong.thongBao ?? ""}`.trim(),
    };
  }

  /**
   * ② NGOẠI LỆ DUY NHẤT: hành động sắp làm TẠO RA CHÍNH THỨ ĐANG THIẾU.
   *
   * Chỉ đúng một ca: đứng ở bước ② mà **chưa có bảng báo giá nào** — vướng mắc là *"Chưa có bảng
   * báo giá nào đang thu thập"* và việc sắp làm là **lập bảng đó**. Chặn ở đây là bí hoàn toàn:
   * trên bảng quy trình không còn đường nào khác để lập bảng báo giá (đã phải sửa ngày
   * 14/08/2026, và bộ thử 23/08 bắt lại đúng lỗi này khi tôi chặn chung mọi bước).
   *
   * 📌 `hanhDongTienMotBuoc` chỉ trả `tao_bao_gia` cho bước ② KHI chưa có bảng nào — nên cặp điều
   * kiện dưới đây nhận diện đúng ca đó, không cần thêm cờ.
   *
   * ⚠️ Bước ① cũng trả `tao_bao_gia`, nhưng vướng mắc của nó là *"còn dòng chưa phân bổ người phụ
   * trách"* — lập bảng báo giá xong vẫn còn dòng không ai nhận. Vì vậy điều kiện phải kèm
   * `tu === "yeu_cau_bao_gia"`, không được rút gọn thành mỗi `loai === "tao_bao_gia"`.
   */
  if (tu === "yeu_cau_bao_gia" && hanhDong.loai === "tao_bao_gia") return hanhDong;

  /* ③ Còn lại: hành động GHI DỮ LIỆU mà vướng mắc vẫn nguyên → CHẶN, kèm đúng câu của hàm luật.
     Đây là chỗ ca "bước ② → ③ thiếu bảng so sánh" bị chặn lại. */
  return { loai: "khong_the", lyDo: vuongMacBuocDangDung };
}

/**
 * Việc phải làm để tiến MỘT bước từ `tu` — phần `switch` tách khỏi `quyetDinhKeoTha`.
 *
 * 🔴 TÁCH RA ĐỂ CÓ THỂ HỎI ĐIỀU KIỆN TRƯỚC RỒI MỚI QUYẾT (23/08/2026). Trước đây `switch` nằm
 * thẳng trong `quyetDinhKeoTha` nên không có cách nào vừa biết hành động vừa biết vướng mắc mà
 * không chép luật ra hai chỗ.
 *
 * ⚠️ HÀM NÀY KHÔNG TỰ KIỂM ĐIỀU KIỆN. Nó chỉ trả lời *"muốn tiến từ bước này thì làm việc gì"*.
 * Việc kiểm điều kiện là của `vuongMacSangBuocSau`, gọi ở đúng một chỗ bên trên.
 */
function hanhDongTienMotBuoc(
  tu: GiaiDoanMuaHang,
  the: TheDeNghiTrenBang,
  poCuaDeNghi: DonDatHang[],
  baoGiaCuaDeNghi: BaoGia[],
): HanhDongKeoTha {
  switch (tu) {
    case "tiep_nhan":
      return { loai: "tao_bao_gia" };

    case "yeu_cau_bao_gia":
      /**
       * ⚠️ TỪ 13/08/2026 thẻ vào cột này ngay khi phân bổ đủ người, nên hoàn toàn có thể
       * CHƯA có bảng báo giá nào. Bản trước trả "không thể" kèm lý do — đúng sự thật nhưng
       * làm người dùng kẹt: họ đứng ở cột ②, kéo sang ③ thì bị chặn, mà trên bảng không có
       * đường nào để lập bảng báo giá. Nay mở thẳng màn lập bảng, đúng việc họ đang cần làm.
       */
      return baoGiaCuaDeNghi.some((b) => b.trangThai === "dang_thu_thap")
        ? { loai: "chot_so_sanh" }
        : /* `chotLuon`: đang đứng ở ② và kéo sang ③, nên tạo bảng xong phải chốt luôn — xem
             chú thích ở khai báo `HanhDongKeoTha`. Không có cờ này thì thẻ đứng nguyên cột ②
             sau khi bấm, và người dùng phải kéo lần thứ hai mà không hiểu vì sao. */
          { loai: "tao_bao_gia", chotLuon: true };

    case "xet_duyet_bao_gia": {
      /**
       * 🔴 DẪN VỀ TRANG CHI TIẾT ĐỀ NGHỊ, không phải màn Báo giá — Ban lãnh đạo 20/08/2026 chốt
       * **bỏ hẳn màn Báo giá** cùng bảng so sánh giá nhập tay.
       *
       * ⚠️ Bản trước dẫn tới `/bao-gia/{id}` kèm câu *"Chọn nhà cung cấp trong bảng so sánh"*.
       * Để nguyên là người kéo thẻ đúng luật bị đưa tới một trang **không còn tồn tại**, thẻ
       * đứng yên, và **không lỗi nào báo** — kiểu hỏng khó tìm nhất.
       *
       * Nút Duyệt / Không duyệt nay nằm trong khối bước ③ ở trang chi tiết đề nghị.
       */
      return {
        loai: "mo_trang",
        duongDan: `/de-nghi/${the.deNghi.id}`,
        thongBao:
          "Trưởng bộ phận duyệt trong khối bước “Xét duyệt báo giá” ở trang chi tiết đề nghị — duyệt xong thẻ tự chuyển bước.",
      };
    }

    case "lap_don_mua_hang": {
      const poNhap = poCuaDeNghi.find((po) => po.trangThai === "nhap");
      return poNhap
        ? {
            loai: "mo_trang",
            duongDan: `/don-hang/${poNhap.id}`,
            thongBao: "Chốt đơn hàng nháp — chốt xong thẻ tự chuyển bước.",
          }
        : {
            loai: "mo_trang",
            /* 🔴 BẮT BUỘC KÈM `?prId=` (sửa 17/08/2026). Thiếu tham số này thì màn lập đơn
               không biết đang lập cho đề nghị nào và trả về khối trống "Chưa chọn đề nghị" —
               người dùng kéo thẻ đúng luật xong bị dẫn tới một trang không làm gì được. */
            duongDan: `/don-hang/tao-moi?prId=${the.deNghi.id}`,
            thongBao: "Lập đơn hàng cho đề nghị — lập xong thẻ tự chuyển bước.",
          };
    }

    case "dat_hang": {
      const po = poCuaDeNghi.find((p) => p.trangThai === "da_chot") ?? poCuaDeNghi[0];
      return {
        loai: "mo_trang",
        duongDan: po ? `/don-hang/${po.id}` : "/don-hang",
        thongBao: "Ghi phiếu nhận hàng lần đầu — có hàng về là thẻ tự chuyển bước.",
      };
    }

    /**
     * ★ CỘT "HỒ SƠ THANH TOÁN" — phải khai ở đây, nếu không kéo thẻ sang nó sẽ nhận đúng câu
     * *"Bước chuyển này chưa được hỗ trợ"* ở nhánh `default`. TypeScript KHÔNG bắt được lỗi này
     * (switch có `default`), nên nó chỉ hiện ra khi người dùng thử kéo.
     *
     * 📌 Dẫn về trang chi tiết đề nghị: việc phải làm là ĐÍNH KÈM CHỨNG TỪ, mà ô đính kèm nằm
     * trong khối của bước ở trang đó. Kéo thả không tự sinh chứng từ được — đúng nguyên tắc
     * "kéo thả làm đúng nghiệp vụ của cột đích, không đổi nhãn chay".
     */
    case "ho_so_thanh_toan":
      return {
        loai: "mo_trang",
        duongDan: `/de-nghi/${the.deNghi.id}`,
        thongBao:
          "Đính kèm Hóa đơn VAT (bắt buộc) và Ủy nhiệm chi nếu có, trong khối “Hồ sơ thanh toán” ở trang chi tiết đề nghị.",
      };

    /**
     * ★ CỘT ⑥ → ⑦: NÓI ĐÚNG VIỆC CẦN LÀM, KHÔNG NÓI "CHƯA ĐƯỢC HỖ TRỢ" — sửa 24/08/2026.
     *
     * 🔴 CHẶN Ở ĐÂY LÀ ĐÚNG, đừng "sửa" thành cho đi. Hồ sơ chỉ vào cột ⑦ khi hàng ĐÃ về đủ
     * (`daVeDu` — mọi dòng đã lên đơn và đã nhận đủ). Thẻ còn đứng ở ⑥ nghĩa là hàng CHƯA đủ,
     * và không thao tác nào — kéo thả hay bấm nút — chuyển được nó sang ⑦. Kéo thả không tự
     * sinh phiếu nhận hàng được.
     *
     * ⚠️ CÁI SAI LÀ CÂU BÁO. Trước đây bước này rơi vào nhánh `default` và trả *"Bước chuyển
     * này chưa được hỗ trợ"* — nghe như **lỗi phần mềm**, nên người dùng đi hỏi IT thay vì đi
     * ghi nốt phiếu nhận. Trong khi kéo LÙI ⑥ → ⑤ thì lại nói đúng lý do. Một hồ sơ, hai
     * hướng, hai chất lượng câu trả lời.
     */
    case "nhan_hang": {
      const po = poCuaDeNghi.find((p) => p.trangThai === "da_chot") ?? poCuaDeNghi[0];
      return {
        loai: "mo_trang",
        duongDan: po ? `/don-hang/${po.id}` : `/de-nghi/${the.deNghi.id}`,
        thongBao:
          "Hồ sơ chỉ sang “Hồ sơ thanh toán” khi hàng đã về đủ. Ghi tiếp phiếu nhận hàng ở khối “Tiến độ nhận hàng”, đủ khối lượng là thẻ tự chuyển bước.",
      };
    }

    default:
      return { loai: "khong_the", lyDo: "Bước chuyển này chưa được hỗ trợ." };
  }
}

// ------------------------------------------------------------
// XÁC NHẬN TRƯỚC KHI CHUYỂN BƯỚC
//
// Chỉ đạo Ban lãnh đạo 08/08/2026: "nhiều khi do sơ suất mà kéo nhầm qua bước
// tiếp theo mà bước trước chưa thực hiện xong".
//
// 🔴 Hai việc khác nhau, đừng gộp:
//   · quyetDinhKeoTha  — bước này có ĐƯỢC PHÉP không (luật cứng, sai thì chặn)
//   · dungXacNhanKeoTha — bước này ĐƯỢC PHÉP, nhưng có gì đáng ngờ không (cảnh báo mềm)
//
// Cảnh báo ở đây CỐ Ý KHÔNG CHẶN. Việc dang dở ở bước trước là chuyện thường gặp
// và nhiều khi có lý do chính đáng (VD phân bổ nốt sau, hàng về trước giấy tờ).
// Chặn cứng sẽ làm người dùng bí việc; nhiệm vụ của hộp này là BẮT NGƯỜI DÙNG NHÌN
// rồi tự quyết. Muốn cấm hẳn một bước thì thêm luật vào `quyetDinhKeoTha`.
// ------------------------------------------------------------

export interface XacNhanKeoTha {
  /** Mã đề nghị đang kéo. */
  maDeNghi: string;
  tuBuoc: string;
  denBuoc: string;
  /** Điều sẽ xảy ra nếu bấm xác nhận — nói bằng lời người dùng hiểu. */
  seLam: string;
  /** Việc còn dang dở ở bước hiện tại. Rỗng = không có gì đáng ngờ. */
  canhBao: string[];
  nhanNut: string;
  /** Đóng dở là việc nặng — nút để tông nguy hiểm. */
  nguyHiem: boolean;
}

export function dungXacNhanKeoTha(
  the: TheDeNghiTrenBang,
  dich: GiaiDoanMuaHang,
  hanhDong: HanhDongKeoTha,
  poCuaDeNghi: DonDatHang[],
  phieuCuaDeNghi: PhieuNhanHang[],
): XacNhanKeoTha {
  const nhanBuoc = (ma: GiaiDoanMuaHang) => NHAN_GIAI_DOAN[ma]?.nhan ?? ma;

  const canhBao: string[] = [];

  // ① Còn dòng chưa phân bổ cho ai — hay gặp nhất, và là thứ thẻ đã cảnh báo sẵn trên bảng.
  if (the.soDongChuaPhanBo > 0) {
    canhBao.push(
      `Còn ${the.soDongChuaPhanBo} công việc chưa phân bổ cho nhân viên nào.`,
    );
  }

  // ② Đơn hàng còn ở dạng nháp — chưa chốt thì nhà cung cấp chưa nhận được gì.
  const soNhap = poCuaDeNghi.filter((po) => po.trangThai === "nhap").length;
  if (soNhap > 0) {
    canhBao.push(`Còn ${soNhap} đơn đặt hàng ở trạng thái nháp, chưa chốt.`);
  }

  // ③ Phiếu nhận chờ kiểm tra — khối lượng CHƯA được tính (nguyên tắc dữ liệu số 4).
  const soChoKiemTra = phieuCuaDeNghi.filter((p) => p.trangThai === "cho_kiem_tra").length;
  if (soChoKiemTra > 0) {
    canhBao.push(
      `Còn ${soChoKiemTra} phiếu nhận hàng đang chờ kiểm tra — khối lượng chưa được tính vào đã nhận.`,
    );
  }

  // ④ Đề nghị đã trễ hạn cần hàng.
  if (the.han.quaHan) {
    canhBao.push(`Đề nghị đã ${the.han.nhan.toLowerCase()} so với ngày cần hàng.`);
  }

  const chung = {
    maDeNghi: the.deNghi.code,
    tuBuoc: nhanBuoc(the.giaiDoan),
    denBuoc: nhanBuoc(dich),
    canhBao,
  };

  switch (hanhDong.loai) {
    case "tao_bao_gia":
      return {
        ...chung,
        seLam: "Tạo một bảng báo giá mới cho đề nghị này, rồi chuyển thẻ sang bước mới.",
        nhanNut: "Tạo bảng báo giá",
        nguyHiem: false,
      };
    case "chot_so_sanh":
      return {
        ...chung,
        seLam:
          "Chốt bảng báo giá đang thu thập để chuyển sang so sánh. Dòng nào chưa có giá sẽ được điền giá mẫu.",
        nhanNut: "Chốt báo giá",
        nguyHiem: false,
      };
    case "dong_do":
      return {
        ...chung,
        denBuoc: nhanBuoc("that_bai"),
        seLam: "Đóng dở đề nghị. Đề nghị chuyển vào cột Thất bại và KHÔNG mua tiếp.",
        nhanNut: "Đóng dở đề nghị",
        nguyHiem: true,
      };
    case "mo_trang":
      return {
        ...chung,
        seLam: `${hanhDong.thongBao} Thẻ CHƯA chuyển bước cho tới khi việc đó xong.`,
        nhanNut: "Mở màn hình đó",
        nguyHiem: false,
      };
    case "lui_buoc":
      return {
        ...chung,
        // 🔴 `nguyHiem: true` — lùi bước là HỦY CHỨNG TỪ, không phải đổi nhãn. Nút đỏ để
        // người dùng dừng lại đọc một giây, và câu `viec` nói rõ app sắp hủy cái gì.
        seLam: `${hanhDong.viec} Việc này được ghi vào nhật ký kèm tên bạn.`,
        nhanNut: "Lùi một bước",
        nguyHiem: true,
      };
    /**
     * ★★ CÒN VƯỚNG NHƯNG GỠ ĐƯỢC TẠI CHỖ — Ban lãnh đạo 25/08/2026.
     *
     * 🔴 KHÔNG TỰ NGHĨ RA CÂU MỚI, mà hỏi lại chính hàm này cho `hanhDongSau`. Nút phải nói đúng
     * việc app sẽ làm SAU KHI gỡ xong — nếu viết cứng một câu chung chung ("Xác nhận") thì người
     * bấm không biết mình sắp chốt báo giá hay sắp được dẫn sang màn khác.
     *
     * 🔴 CÂU DẪN NÓI THẲNG LÀ THẺ CHƯA NHẢY — Ban lãnh đạo 25/08/2026: *"Phải được duyệt thì mới
     * nhảy"*. Người dùng đính tệp xong rất dễ tưởng đã xong việc rồi đóng hộp; nói trước thì họ
     * biết còn một nút phải bấm.
     */
    case "can_go_vuong": {
      const sau = dungXacNhanKeoTha(the, dich, hanhDong.hanhDongSau, poCuaDeNghi, phieuCuaDeNghi);
      return {
        ...sau,
        seLam: `Bổ sung đủ chứng từ còn thiếu ở trên, rồi bấm nút bên dưới — thẻ chỉ chuyển bước sau khi bấm. ${sau.seLam}`.trim(),
      };
    }

    default:
      // "khong_the" không bao giờ tới được đây — trang gọi đã chặn và báo lý do trước.
      return { ...chung, seLam: "", nhanNut: "Xác nhận", nguyHiem: false };
  }
}
