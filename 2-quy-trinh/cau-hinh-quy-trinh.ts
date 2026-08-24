// ============================================================
// CẤU HÌNH QUY TRÌNH MUA HÀNG — các điều kiện sửa được qua trang "Cài đặt quy trình"
//
// 🔴 Ban lãnh đạo 13/08/2026 (kèm ảnh tab "Cài đặt" trên Base): *"em thêm chức năng cài đặt
// quy trình, có thể chỉnh sửa các điều kiện trong quy trình"*.
//
// ⚠️ KHÔNG PHẢI ĐIỀU KIỆN NÀO CŨNG CHO SỬA. File này chỉ chứa những THAM SỐ mà công ty đổi
// theo thời giá hoặc chính sách. Ba loại điều kiện KHÔNG có ở đây và cố ý không cho sửa:
//
//   1. Luật BẢO VỆ DỮ LIỆU — ví dụ *"mỗi lần giao phải có tệp phiếu giao nhận mới được xác
//      nhận hoàn thành"* (Ban lãnh đạo 11/08/2026). Tắt được là hồ sơ thiếu chứng từ mà
//      không ai biết, đúng thứ luật đó sinh ra để chặn.
//   2. Ràng buộc KỸ THUẬT — ví dụ cỡ tệp tối đa (Firestore chỉ cho 1MB mỗi tài liệu nên tệp
//      phải cắt mảnh), số đề nghị tối đa của bản chạy thử (hosting tĩnh phải khai trước id).
//      Sửa số ở giao diện không làm hạ tầng chịu được nhiều hơn.
//   3. Phạm vi kéo thả một bước — đó là cách chống lỡ tay, không phải tham số nghiệp vụ.
//
// 📌 Trang cài đặt VẪN HIỆN cả ba loại trên ở dạng CHỈ ĐỌC kèm lý do. Người dùng cần biết
// app đang chạy theo luật gì; ẩn đi thì họ đi tìm trong mã nguồn hoặc hỏi vòng quanh.
// ============================================================

import {
  NHOM_VAT_TU_DINH_MUC_MAC_DINH,
  type NhomVatTuDinhMuc,
} from "@/2-quy-trinh/kiem-soat-dinh-muc";

/**
 * ★ MỘT CÔNG VIỆC BẮT BUỘC TRONG GIAI ĐOẠN — mục "Danh sách công việc" của bảng Base.
 *
 * 🔴 Ban lãnh đạo 14/08/2026 gửi ảnh cài đặt giai đoạn 01 trên Base: mục *"Danh sách công
 * việc — Công việc mặc định mà người thực thi phải thực hiện trong giai đoạn"*, và ô
 * *"Yêu cầu hoàn thành các công việc được quy định"* đặt là **"Bắt buộc hoàn thành công việc
 * của giai đoạn hiện tại"**.
 *
 * 📌 Đây KHÁC hướng dẫn nghiệp vụ (`huong-dan-giai-doan.ts`). Hướng dẫn là chữ để ĐỌC; công
 * việc ở đây là việc phải TÍCH XONG mới được sang bước sau — app chặn thật.
 */
export interface CongViecGiaiDoan {
  /**
   * Khóa ổn định, KHÔNG đổi khi sửa tên.
   *
   * ⚠️ Trạng thái đã xong của từng đề nghị lưu theo khóa này. Đổi khóa là mọi đề nghị đang
   * chạy mất dấu "đã xong" và bị chặn lại giữa đường.
   */
  ma: string;
  /** Tên công việc — chép đúng chữ trên bảng Base. */
  ten: string;
  /** Ai làm và làm gì — dòng mô tả nhỏ dưới tên trong ảnh Base. */
  moTa?: string;
  /**
   * `true` = chưa xong thì KHÔNG sang bước sau được.
   *
   * 📌 Base có ô bật/tắt riêng cho chuyện này ("Bắt buộc hoàn thành công việc của giai đoạn
   * hiện tại"). Giữ theo từng công việc để sau này thêm việc chỉ mang tính nhắc nhở.
   */
  batBuoc: boolean;
}

/**
 * ★ CÁCH GIAO VIỆC KHI HỒ SƠ VÀO GIAI ĐOẠN — ô "Nhiệm vụ được giao tự động như thế nào?"
 * trong ảnh cài đặt Base.
 *
 * 📌 Ảnh Ban lãnh đạo gửi 14–15/08/2026 cho thấy hai giá trị khác nhau giữa các bước:
 * bước 01 · 03 · 04 · 05 · 06 là *"Giữ nguyên người nhận việc ở giai đoạn trước"*, riêng
 * bước 02 là *"Không giao cho ai — Để người quản lý giai đoạn quyết định"*.
 */
export type CachGiaoViec = "giu_nguoi_buoc_truoc" | "de_quan_ly_giao";

/** Nhãn hiển thị của cách giao việc — chép đúng chữ trên bảng Base. */
export const NHAN_CACH_GIAO_VIEC: Record<CachGiaoViec, string> = {
  giu_nguoi_buoc_truoc: "Giữ nguyên người nhận việc ở giai đoạn trước",
  de_quan_ly_giao: "Không giao cho ai — để người quản lý giai đoạn quyết định",
};

/**
 * ★ CÀI ĐẶT RIÊNG CỦA MỘT GIAI ĐOẠN — gom các ô trong tab cài đặt giai đoạn của Base mà
 * app THỰC SỰ dùng được.
 *
 * 🔴 CHỈ ĐƯA VÀO ĐÂY THỨ APP CÓ CHẠY THẬT. Tab cài đặt của Base còn nhiều ô nữa (vai trò
 * trong giai đoạn, yêu cầu đánh giá công việc, nhảy bước theo điều kiện, SLA giao nhiệm vụ,
 * bỏ người nhận việc khỏi danh sách theo dõi). App chưa có cơ chế cho những thứ đó, nên
 * trang cài đặt hiện chúng ở dạng **chỉ đọc kèm lời giải thích** thay vì dựng ô bấm được mà
 * bấm xong không đổi gì — đúng luật "đừng để giao diện hứa một việc app không làm".
 */
export interface CaiDatGiaiDoan {
  /** Ô "Bỏ qua Chủ nhật?" — bật thì Chủ nhật không tính vào thời hạn của bước. */
  boQuaChuNhat: boolean;
  /**
   * Ô "Yêu cầu hoàn thành các công việc được quy định".
   *
   * `true` = *"Bắt buộc hoàn thành công việc của giai đoạn hiện tại"* (giá trị Base đang đặt
   * cho cả 8 bước). Tắt thì danh sách công việc chỉ còn là lời nhắc, không chặn chuyển bước.
   */
  batBuocXongCongViec: boolean;
  /**
   * Ô "Cho phép người nhận nhiệm vụ giao lại nhiệm vụ cho người khác?".
   *
   * ⚠️ Base đặt **"Không cho phép"** ở cả 8 bước, nhưng app đang có nút "Chuyển tiếp" (làm
   * ngày 12/08/2026 theo yêu cầu trước đó). Để thành cài đặt thay vì tự ý gỡ nút — Ban lãnh
   * đạo bật/tắt theo ý mình, và người sau đọc ra được app đang chạy theo luật nào.
   */
  chuyenViecDuoc: boolean;
  /** Ô "Nhiệm vụ được giao tự động như thế nào?" — hiện để tra cứu, xem `CachGiaoViec`. */
  cachGiaoViec: CachGiaoViec;
}

/** Tham số quy trình sửa được. Mọi giá trị là số nguyên dương. */
export interface CauHinhQuyTrinh {
  /** Trên mức này (đồng): đơn phải trình Trưởng phòng TMCU ký duyệt, gửi NCC ký xác nhận. */
  nguongKyDuyetDon: number;
  /**
   * Từ mức này (đồng): cần đủ số báo giá tối thiểu.
   *
   * 🔴 KHÔNG CÒN GẮN VỚI CẤP DUYỆT (20/08/2026): người duyệt luôn là trưởng bộ phận Thu mua.
   * ⚠️ Và app hiện KHÔNG tự áp được ngưỡng này, vì từ 20/08 app không nhập giá nhà cung cấp nên
   * không biết giá trị hồ sơ. Số báo giá bắt buộc lấy từ ô "SL Báo giá" trưởng bộ phận đặt tay
   * khi giao việc — xem `2-quy-trinh/bao-gia-dinh-kem.ts`.
   */
  nguongHaiBaoGia: number;
  /** Từ mức này (đồng): phải có hợp đồng do Tổng Giám đốc ký. */
  nguongHopDong: number;
  /**
   * Số báo giá tối thiểu khi đơn vượt `nguongHaiBaoGia`.
   *
   * 📌 Quy trình công ty ghi "02 báo giá", nhưng để sửa được vì có ngành hàng độc quyền chỉ
   * một nhà cung cấp — khi đó công ty có thể hạ xuống 1 kèm giải trình.
   */
  soBaoGiaToiThieu: number;
  /** Số ngày tối thiểu giữa ngày lập đề nghị và ngày cần hàng. */
  soNgayDeNghiToiThieu: number;
  /** Số tài liệu tối đa đính kèm một đề nghị. */
  soTaiLieuToiDa: number;
  /**
   * ★ THỜI HẠN XỬ LÝ TỪNG GIAI ĐOẠN, tính bằng GIỜ LÀM VIỆC.
   *
   * 🔴 Ban lãnh đạo 13/08/2026 gửi ảnh trang Cài đặt của Base: cột giai đoạn ghi rõ hạn từng
   * bước — *"01 Tiếp nhận và kiểm tra · 4.00 Giờ"*, *"02 Yêu cầu NCC báo giá · 12.00 Giờ"*,
   * *"04 Lập đơn mua hàng · 8.00 Giờ"*.
   *
   * 📌 App trước đây CHỈ có hạn theo ngày cần hàng của cả đề nghị. Hạn đó nói được "đơn này
   * còn 10 ngày", nhưng không nói được "bước hỏi giá đã ngồi đây 3 ngày rồi". Hạn từng bước
   * là thứ chỉ ra chỗ tắc, và đó mới là cái trưởng bộ phận cần biết mỗi sáng.
   *
   * ⚠️ Giá trị 0 = KHÔNG đặt hạn cho bước đó (ảnh Base cũng có bước *"Không có thời hạn"*).
   * Đừng coi 0 là "hạn 0 giờ" — làm vậy thì mọi hồ sơ ở bước đó trễ hạn ngay khi vào.
   */
  hanGioTheoBuoc: Record<string, number>;
  /**
   * ★ CÔNG VIỆC BẮT BUỘC CỦA TỪNG GIAI ĐOẠN — theo mục "Danh sách công việc" trên Base.
   *
   * Khóa là mã giai đoạn, giá trị là danh sách công việc. Bước không có việc nào thì khuyết
   * khóa hoặc để mảng rỗng — ảnh Base cũng ghi *"Không có công việc"* cho 5 bước còn lại.
   */
  congViecTheoBuoc: Record<string, CongViecGiaiDoan[]>;
  /**
   * ★ CÀI ĐẶT RIÊNG TỪNG GIAI ĐOẠN — khóa là mã giai đoạn. Xem `CaiDatGiaiDoan`.
   *
   * ⚠️ Bước khuyết khóa thì dùng `CAI_DAT_GIAI_DOAN_MAC_DINH`. Đừng coi khuyết khóa là "mọi
   * cờ đều tắt" — tắt `batBuocXongCongViec` là âm thầm bỏ luật chặn chuyển bước.
   */
  caiDatTungBuoc: Record<string, CaiDatGiaiDoan>;
  /**
   * ★ DANH MỤC VẬT TƯ KIỂM SOÁT ĐỊNH MỨC — Ban lãnh đạo 15/08/2026.
   *
   * Gặp vật tư trong danh mục này thì app tự gắn cờ kiểm soát định mức và nhắc báo QLDA.
   * Để trong cấu hình vì *"danh sách này sẽ được thêm mới hoặc xóa bớt"* — sửa được ngay
   * trên trang Cài đặt quy trình, không phải nhờ đội triển khai.
   */
  vatTuDinhMuc: NhomVatTuDinhMuc[];
}

/**
 * Cài đặt dùng khi một giai đoạn chưa được khai riêng.
 *
 * Lấy đúng giá trị Base đang đặt cho phần lớn giai đoạn (ảnh 14–15/08/2026): bắt buộc hoàn
 * thành công việc · không cho giao lại nhiệm vụ · không bỏ qua Chủ nhật · giữ nguyên người
 * nhận việc ở bước trước.
 */
export const CAI_DAT_GIAI_DOAN_MAC_DINH: CaiDatGiaiDoan = {
  boQuaChuNhat: false,
  batBuocXongCongViec: true,
  // 🔴 App vẫn để `true` (khác Base) vì nút "Chuyển tiếp" đang chạy và Ban lãnh đạo chưa chốt
  // bỏ. Đổi thành `false` là nút đó tắt trên toàn app — chỉ đổi khi có chỉ đạo.
  chuyenViecDuoc: true,
  cachGiaoViec: "giu_nguoi_buoc_truoc",
};

/**
 * Đọc cài đặt của một giai đoạn, luôn trả về giá trị đầy đủ.
 *
 * 🔴 DÙNG HÀM NÀY, đừng đọc thẳng `cauHinh.caiDatTungBuoc[buoc]` — bước chưa khai sẽ cho
 * `undefined` và mọi cờ thành "tắt", tức âm thầm bỏ hết luật chặn.
 */
export function caiDatCuaBuoc(ch: CauHinhQuyTrinh, buoc: string): CaiDatGiaiDoan {
  return { ...CAI_DAT_GIAI_DOAN_MAC_DINH, ...(ch.caiDatTungBuoc?.[buoc] ?? {}) };
}

/**
 * Giá trị mặc định = ĐÚNG luật đang chạy trước ngày 13/08/2026.
 *
 * 🔴 Đây cũng là giá trị dùng khi chưa ai vào trang cài đặt lần nào. Đổi mặc định ở đây là
 * đổi luật cho mọi máy chưa có cấu hình riêng — chỉ đổi khi Ban lãnh đạo chốt lại quy trình,
 * không phải để "cho tiện thử".
 *
 * Nguồn: quy trình TM-QT Mua hàng (HP CONS) trên Base, Ban lãnh đạo cung cấp ảnh 11/08/2026.
 */
export const CAU_HINH_MAC_DINH: CauHinhQuyTrinh = {
  nguongKyDuyetDon: 5_000_000,
  nguongHaiBaoGia: 10_000_000,
  nguongHopDong: 20_000_000,
  soBaoGiaToiThieu: 2,
  soNgayDeNghiToiThieu: 2,
  soTaiLieuToiDa: 10,
  /**
   * Hạn từng bước — LẤY ĐÚNG SỐ TRONG ẢNH BASE Ban lãnh đạo gửi 13/08/2026:
   * 01 Tiếp nhận 4h · 02 Yêu cầu báo giá 12h · 03 Xét duyệt 4h · 04 Lập đơn 8h ·
   * 05 Đặt hàng 4h · 06 Nhận hàng "không có thời hạn" (= 0).
   *
   * ⚠️ Hai bước cuối (Hoàn thành, Thất bại) không có hạn: chúng là điểm dừng, không phải
   * việc đang chờ ai làm.
   */
  hanGioTheoBuoc: {
    tiep_nhan: 4,
    yeu_cau_bao_gia: 12,
    xet_duyet_bao_gia: 4,
    lap_don_mua_hang: 8,
    dat_hang: 4,
    nhan_hang: 0,
  },
  /**
   * Công việc bắt buộc từng bước — LẤY ĐÚNG ẢNH BASE Ban lãnh đạo gửi 14/08/2026.
   *
   * Bước 01 có đúng 1 công việc: *"Checkin hàng tồn kho — QLK/TK báo tồn kho thực tế"*.
   * Năm bước còn lại trong ảnh ghi *"Không có công việc"* nên để trống, KHÔNG bịa thêm việc
   * cho đủ bộ — chờ Ban lãnh đạo gửi ảnh các bước sau.
   *
   * 🔴 VÌ SAO VIỆC NÀY QUAN TRỌNG: kiểm tồn kho trước khi mua là chốt chống MUA TRÙNG hàng
   * kho đang có. Bỏ qua nó là tiền công ty đi ra trong khi hàng nằm sẵn trong kho. Đây cũng
   * là lý do Base đặt nó thành việc BẮT BUỘC của bước đầu tiên, không phải lời nhắc.
   */
  congViecTheoBuoc: {
    tiep_nhan: [
      {
        ma: "checkin_ton_kho",
        ten: "Checkin hàng tồn kho",
        moTa: "QLK/TK báo tồn kho thực tế",
        batBuoc: true,
      },
    ],
    /**
     * ★ Bước "Hồ sơ thanh toán" — gộp từ hai bước cũ (Ban lãnh đạo 23/08/2026: *"Gộp 2 mục này
     * lại thành 1 'Hồ sơ thanh toán'"*).
     *
     * 🔴 PHẢI CÓ MỘT CÁI TÍCH cho ủy nhiệm chi, và nó phải BẮT BUỘC — nhưng cái tích nói *"đã xử
     * lý xong, kể cả khi đơn này không cần UNC"*. Vì phần lớn đơn trả tiền ngay, không có ủy
     * nhiệm chi nào; nếu điều kiện xong là "phải có tệp UNC" thì những đơn đó kẹt vĩnh viễn.
     *
     * ⚠️ Hóa đơn VAT KHÔNG có cái tích riêng: điều kiện xong của nó là **có tệp**, và luật đó chỉ
     * được nằm ở một chỗ (`coHoaDonVAT`). Thêm một cái tích song song là hai nguồn sự thật — tích
     * rồi mà chưa có tệp thì app báo xong trong khi hồ sơ vẫn thiếu chứng từ.
     *
     * Cửa chặn thật nằm ở `vuongMacTichXongUNC`: chưa có hóa đơn VAT thì không tích được.
     */
    ho_so_thanh_toan: [
      {
        ma: "unc_xong",
        ten: "Đã xử lý ủy nhiệm chi (hoặc đơn này không cần)",
        moTa: "Chỉ tích được sau khi có Hóa đơn VAT — ủy nhiệm chi là lệnh trả tiền",
        batBuoc: true,
      },
    ],
  },
  /**
   * Cài đặt từng bước — LẤY ĐÚNG ẢNH 8 GIAI ĐOẠN Ban lãnh đạo gửi 14–15/08/2026.
   *
   * Điểm khác nhau duy nhất giữa các bước trong ảnh là ô "Nhiệm vụ được giao tự động":
   * bước 02 là *"Không giao cho ai — để người quản lý giai đoạn quyết định"*, các bước còn
   * lại *"Giữ nguyên người nhận việc ở giai đoạn trước"*. Mọi bước đều: bắt buộc hoàn thành
   * công việc · không cho giao lại nhiệm vụ · không bỏ qua Chủ nhật.
   *
   * ⚠️ `chuyenViecDuoc` để `true` — KHÁC Base (Base ghi "Không cho phép"). Giữ vậy vì nút
   * "Chuyển tiếp" đang chạy thật và Ban lãnh đạo chưa chốt bỏ; đổi ở trang cài đặt là tắt
   * được ngay, không cần sửa mã nguồn.
   */
  // Danh mục vật tư kiểm soát định mức — chép đúng ảnh Ban lãnh đạo gửi 15/08/2026.
  // Nội dung và lý do ở `2-quy-trinh/kiem-soat-dinh-muc.ts`.
  vatTuDinhMuc: NHOM_VAT_TU_DINH_MUC_MAC_DINH,
  caiDatTungBuoc: {
    tiep_nhan: { ...CAI_DAT_GIAI_DOAN_MAC_DINH },
    yeu_cau_bao_gia: { ...CAI_DAT_GIAI_DOAN_MAC_DINH, cachGiaoViec: "de_quan_ly_giao" },
    xet_duyet_bao_gia: { ...CAI_DAT_GIAI_DOAN_MAC_DINH },
    lap_don_mua_hang: { ...CAI_DAT_GIAI_DOAN_MAC_DINH },
    dat_hang: { ...CAI_DAT_GIAI_DOAN_MAC_DINH },
    nhan_hang: { ...CAI_DAT_GIAI_DOAN_MAC_DINH },
    /* ★ Bước gộp "Hồ sơ thanh toán" (23/08/2026) — xem `2-quy-trinh/chung-tu-cuoi-quy-trinh.ts`. */
    ho_so_thanh_toan: { ...CAI_DAT_GIAI_DOAN_MAC_DINH },
  },
};

/**
 * ★ GỘP CẤU HÌNH ĐÃ LƯU VỚI MẶC ĐỊNH — BẮT BUỘC gọi ở mọi chỗ đọc cấu hình từ nơi lưu.
 *
 * 🔴 BẢN LƯU CŨ KHÔNG CÓ KHÓA MỚI. Cấu hình được lưu nguyên khối; mỗi lần thêm tham số mới là
 * mọi bản đã lưu trước đó thiếu khóa đó. Gán thẳng vào state thì `cauHinh.congViecTheoBuoc`
 * thành `undefined`, và chỗ nào đọc `cauHinh.congViecTheoBuoc[giaiDoan]` sẽ **sập cả trang**
 * — không phải sai số liệu mà là màn hình trắng.
 *
 * Chuyện này chắc chắn xảy ra: người dùng đã lưu cấu hình ngày 13/08/2026, còn khóa
 * `congViecTheoBuoc` thêm ngày 14/08/2026.
 *
 * ⚠️ Gộp NÔNG một tầng là đủ và cố ý: giá trị người dùng đã lưu phải thắng mặc định hoàn
 * toàn. Gộp sâu vào `hanGioTheoBuoc` sẽ làm bước người dùng cố ý đặt 0 giờ bị mặc định ghi
 * đè trở lại. Hai bảng `Record` đó đã có chốt `?? 0` / `?? []` ở nơi dùng.
 */
export function gopCauHinhVoiMacDinh(daLuu: Partial<CauHinhQuyTrinh> | undefined | null): CauHinhQuyTrinh {
  if (!daLuu) return CAU_HINH_MAC_DINH;
  return { ...CAU_HINH_MAC_DINH, ...daLuu };
}

/**
 * MỘT LẦN ĐỔI CẤU HÌNH — ai đổi, lúc nào, đổi những gì.
 *
 * 🔴 BẮT BUỘC GHI VẾT. Ngưỡng KHÔNG được chụp vào từng hồ sơ, nên đổi ngưỡng là mọi hồ sơ cũ
 * bị xét lại theo luật mới — kể cả hồ sơ đã xong. Ví dụ đơn 12 triệu hôm qua đã trình Tổng
 * Giám đốc ký đúng quy trình; nâng ngưỡng lên 15 triệu thì hôm nay app ghi "Trưởng phòng
 * duyệt", trong khi hồ sơ giấy có chữ ký TGĐ. Người kiểm tra sau sẽ tưởng làm sai quy trình.
 *
 * 📌 Vết này là cách duy nhất giải thích được chuyện đó: mở ra thấy "ngày 15/8 anh X nâng
 * ngưỡng từ 10 lên 15 triệu" là hiểu ngay vì sao hồ sơ và màn hình lệch nhau.
 */
export interface VetDoiCauHinh {
  thoiDiem: string;
  nguoiDoi: string;
  /** Mô tả từng thay đổi, dạng "Ngưỡng nhiều báo giá: 10.000.000 → 15.000.000". */
  thayDoi: string[];
}

/**
 * So hai cấu hình, trả về danh sách chữ mô tả những gì đã đổi.
 * Mảng rỗng = không có gì đổi (người dùng bấm Lưu mà chưa sửa gì).
 */
export function soSanhCauHinh(cu: CauHinhQuyTrinh, moi: CauHinhQuyTrinh): string[] {
  const ra: string[] = [];
  for (const t of THAM_SO_QUY_TRINH) {
    if (cu[t.khoa] !== moi[t.khoa]) {
      ra.push(
        `${t.nhan}: ${cu[t.khoa].toLocaleString("vi-VN")} → ${moi[t.khoa].toLocaleString("vi-VN")}`,
      );
    }
  }
  // Hạn từng bước so theo từng khóa — gom cả bước mới xuất hiện lẫn bước bị bỏ.
  const buoc = new Set([
    ...Object.keys(cu.hanGioTheoBuoc),
    ...Object.keys(moi.hanGioTheoBuoc),
  ]);
  for (const b of buoc) {
    const a = cu.hanGioTheoBuoc[b] ?? 0;
    const c = moi.hanGioTheoBuoc[b] ?? 0;
    if (a !== c) ra.push(`Hạn bước "${b}": ${a} giờ → ${c} giờ`);
  }

  /**
   * Cài đặt và công việc từng bước — cũng phải vào vết.
   *
   * 🔴 Đây là những thứ ĐỔI HÀNH VI THẬT (tắt bắt buộc hoàn thành việc = bỏ luôn chốt chặn
   * chuyển bước; tắt chuyển việc = mất nút Chuyển tiếp của cả app). Không ghi vết thì sau này
   * không ai giải thích được vì sao hôm nay app chặn mà hôm qua không.
   */
  const buocCaiDat = new Set([
    ...Object.keys(cu.caiDatTungBuoc ?? {}),
    ...Object.keys(moi.caiDatTungBuoc ?? {}),
    ...Object.keys(cu.congViecTheoBuoc ?? {}),
    ...Object.keys(moi.congViecTheoBuoc ?? {}),
  ]);
  for (const b of buocCaiDat) {
    const a = caiDatCuaBuoc(cu, b);
    const c = caiDatCuaBuoc(moi, b);
    if (a.batBuocXongCongViec !== c.batBuocXongCongViec) {
      ra.push(
        `Bước "${b}": bắt buộc hoàn thành công việc — ${a.batBuocXongCongViec ? "BẬT" : "TẮT"} → ${c.batBuocXongCongViec ? "BẬT" : "TẮT"}`,
      );
    }
    if (a.chuyenViecDuoc !== c.chuyenViecDuoc) {
      ra.push(
        `Bước "${b}": cho phép giao lại nhiệm vụ — ${a.chuyenViecDuoc ? "CÓ" : "KHÔNG"} → ${c.chuyenViecDuoc ? "CÓ" : "KHÔNG"}`,
      );
    }
    if (a.boQuaChuNhat !== c.boQuaChuNhat) {
      ra.push(
        `Bước "${b}": bỏ qua Chủ nhật — ${a.boQuaChuNhat ? "CÓ" : "KHÔNG"} → ${c.boQuaChuNhat ? "CÓ" : "KHÔNG"}`,
      );
    }
    if (a.cachGiaoViec !== c.cachGiaoViec) {
      ra.push(
        `Bước "${b}": cách giao việc — ${NHAN_CACH_GIAO_VIEC[a.cachGiaoViec]} → ${NHAN_CACH_GIAO_VIEC[c.cachGiaoViec]}`,
      );
    }

    // Công việc: ghi rõ thêm/bớt/đổi tên, vì mỗi thay đổi đều ảnh hưởng hồ sơ đang chạy.
    const viecCu = cu.congViecTheoBuoc?.[b] ?? [];
    const viecMoi = moi.congViecTheoBuoc?.[b] ?? [];
    for (const cv of viecMoi) {
      const truoc = viecCu.find((x) => x.ma === cv.ma);
      if (!truoc) ra.push(`Bước "${b}": THÊM công việc "${cv.ten}"`);
      else if (truoc.ten !== cv.ten) ra.push(`Bước "${b}": đổi tên việc "${truoc.ten}" → "${cv.ten}"`);
      else if (truoc.batBuoc !== cv.batBuoc) {
        ra.push(`Bước "${b}": việc "${cv.ten}" — ${cv.batBuoc ? "chuyển thành BẮT BUỘC" : "chuyển thành chỉ nhắc"}`);
      }
    }
    for (const cv of viecCu) {
      if (!viecMoi.some((x) => x.ma === cv.ma)) {
        ra.push(`Bước "${b}": XÓA công việc "${cv.ten}" — mọi đề nghị mất dấu đã xong của việc này`);
      }
    }
  }
  return ra;
}

/** Một tham số trên trang cài đặt: nhãn, mô tả, khoảng hợp lệ. */
export interface MoTaThamSo {
  /**
   * Chỉ các khóa kiểu SỐ.
   *
   * ⚠️ Hạn từng bước và danh sách công việc là BẢNG riêng (kiểu `Record`), có khối hiển thị
   * riêng trên trang cài đặt — loại ra khỏi đây để ô `<input type="number">` không bao giờ
   * nhận phải một object.
   */
  khoa: Exclude<
    keyof CauHinhQuyTrinh,
    "hanGioTheoBuoc" | "congViecTheoBuoc" | "caiDatTungBuoc" | "vatTuDinhMuc"
  >;
  nhan: string;
  moTa: string;
  /** `tien` hiện dấu phân cách nghìn và chữ "đồng"; `so` là số đếm thường. */
  kieu: "tien" | "so";
  toiThieu: number;
  toiDa: number;
}

/**
 * Danh sách tham số hiện trên trang cài đặt, đúng thứ tự.
 *
 * 🔴 KHOẢNG HỢP LỆ LÀ BẮT BUỘC. Không chặn thì người dùng gõ 0 vào ngưỡng hai báo giá — mọi
 * đơn từ 0 đồng trở lên đòi Tổng Giám đốc duyệt, và cả phòng tắc ngay hôm sau. Chặn ở đây
 * là chặn tại nguồn, còn `loiCauHinh` bên dưới chặn thêm lần nữa lúc lưu.
 */
export const THAM_SO_QUY_TRINH: MoTaThamSo[] = [
  {
    khoa: "nguongKyDuyetDon",
    nhan: "Ngưỡng trình ký duyệt đơn",
    moTa: "Đơn TRÊN mức này phải trình Trưởng phòng Thu mua Cung ứng ký duyệt, rồi gửi nhà cung cấp ký xác nhận.",
    kieu: "tien",
    toiThieu: 100_000,
    toiDa: 1_000_000_000,
  },
  {
    khoa: "nguongHaiBaoGia",
    nhan: "Ngưỡng bắt buộc nhiều báo giá",
    /* 🔴 BỎ CÂU "Tổng Giám đốc là người duyệt" — Ban lãnh đạo 20/08/2026: *"không cần tổng giám
       đốc duyệt, trưởng phòng sẽ quyết định"*. Cấp duyệt không còn phụ thuộc giá trị đơn. */
    moTa: "Đơn TỪ mức này phải có đủ số báo giá tối thiểu. Người duyệt luôn là trưởng bộ phận Thu mua, không phân cấp theo giá trị.",
    kieu: "tien",
    toiThieu: 100_000,
    toiDa: 1_000_000_000,
  },
  {
    khoa: "nguongHopDong",
    nhan: "Ngưỡng bắt buộc có hợp đồng",
    moTa: "Đơn TỪ mức này phải có hợp đồng do Tổng Giám đốc ký; nhà cung cấp mới phải vào danh sách NCC.",
    kieu: "tien",
    toiThieu: 100_000,
    toiDa: 5_000_000_000,
  },
  {
    khoa: "soBaoGiaToiThieu",
    nhan: "Số báo giá tối thiểu",
    moTa: "Số nhà cung cấp phải có báo giá khi đơn vượt ngưỡng trên. Quy trình công ty ghi 02.",
    kieu: "so",
    toiThieu: 1,
    toiDa: 10,
  },
  {
    khoa: "soNgayDeNghiToiThieu",
    nhan: "Số ngày đề nghị trước ngày cần hàng",
    moTa: "Đề nghị phải lập trước ngày cần hàng ít nhất bao nhiêu ngày, để thu mua kịp hỏi giá và đặt hàng.",
    kieu: "so",
    toiThieu: 0,
    toiDa: 60,
  },
  {
    khoa: "soTaiLieuToiDa",
    nhan: "Số tài liệu đính kèm tối đa",
    moTa: "Số tệp đính kèm được cho một đề nghị (catalogue, bản vẽ, chứng chỉ).",
    kieu: "so",
    toiThieu: 1,
    toiDa: 30,
  },
];

/**
 * Kiểm cấu hình trước khi lưu — trả về danh sách lỗi, mảng rỗng là hợp lệ.
 *
 * 🔴 KIỂM CẢ THỨ TỰ BA NGƯỠNG, không chỉ kiểm từng số. Ba ngưỡng phải tăng dần: ký duyệt ≤
 * nhiều báo giá ≤ hợp đồng. Đảo thứ tự thì sinh ra vùng vô nghĩa — ví dụ ngưỡng hợp đồng
 * (20tr) thấp hơn ngưỡng báo giá (30tr) nghĩa là có đơn phải ký hợp đồng nhưng lại không cần
 * báo giá nào. Từng số đều "hợp lệ" mà bộ ba thì sai.
 */
export function loiCauHinh(ch: CauHinhQuyTrinh): string[] {
  const loi: string[] = [];

  for (const t of THAM_SO_QUY_TRINH) {
    const v = ch[t.khoa];
    // `THAM_SO_QUY_TRINH` chỉ khai các khóa kiểu số; ép kiểu ở đây thay vì nới lỏng `MoTaThamSo`.
    if (typeof v !== "number" || !Number.isInteger(v)) {
      loi.push(`${t.nhan}: phải là số nguyên.`);
    } else if (v < t.toiThieu || v > t.toiDa) {
      loi.push(
        `${t.nhan}: phải trong khoảng ${t.toiThieu.toLocaleString("vi-VN")} – ${t.toiDa.toLocaleString("vi-VN")}.`,
      );
    }
  }

  /**
   * Hạn từng bước: cho phép 0 (= không đặt hạn) nhưng KHÔNG cho số âm hay số lẻ.
   * ⚠️ Kiểm riêng vì đây là một bảng khóa–giá trị, không nằm trong `THAM_SO_QUY_TRINH`.
   */
  for (const [buoc, gio] of Object.entries(ch.hanGioTheoBuoc)) {
    if (typeof gio !== "number" || !Number.isInteger(gio) || gio < 0 || gio > 720) {
      loi.push(`Hạn xử lý bước "${buoc}": phải là số giờ nguyên từ 0 đến 720 (0 = không đặt hạn).`);
    }
  }

  /**
   * Danh sách công việc từng bước — kiểm TÊN và MÃ.
   *
   * 🔴 Tên rỗng lọt qua là trang chi tiết đề nghị hiện một dòng trống có ô tích, người dùng
   * không biết mình đang phải làm gì mà vẫn bị chặn chuyển bước.
   * 🔴 Mã trùng còn tệ hơn: trạng thái "đã xong" lưu theo mã, hai việc cùng mã thì tích một
   * cái là cái kia cũng hiện đã xong.
   */
  for (const [buoc, ds] of Object.entries(ch.congViecTheoBuoc ?? {})) {
    const daThayMa = new Set<string>();
    for (const cv of ds) {
      if (!cv.ten?.trim()) {
        loi.push(`Bước "${buoc}": có công việc chưa đặt tên. Nhập tên hoặc xóa dòng đó đi.`);
      }
      if (!cv.ma?.trim()) {
        loi.push(`Bước "${buoc}": có công việc thiếu mã — không lưu được trạng thái đã xong.`);
      } else if (daThayMa.has(cv.ma)) {
        loi.push(
          `Bước "${buoc}": trùng mã công việc "${cv.ma}". Hai việc cùng mã sẽ dùng chung dấu đã xong.`,
        );
      } else {
        daThayMa.add(cv.ma);
      }
    }
  }

  if (ch.nguongKyDuyetDon > ch.nguongHaiBaoGia) {
    loi.push(
      "Ngưỡng trình ký duyệt phải ≤ ngưỡng bắt buộc nhiều báo giá — nếu không sẽ có đơn cần nhiều báo giá mà không cần ký duyệt.",
    );
  }
  if (ch.nguongHaiBaoGia > ch.nguongHopDong) {
    loi.push(
      "Ngưỡng nhiều báo giá phải ≤ ngưỡng bắt buộc hợp đồng — nếu không sẽ có đơn phải ký hợp đồng mà không cần báo giá nào.",
    );
  }

  return loi;
}

/**
 * ĐIỀU KIỆN CHỈ ĐỌC — hiện trên trang cài đặt để người dùng biết app đang chạy theo luật gì,
 * nhưng KHÔNG cho sửa. Xem lý do từng dòng.
 */
export const DIEU_KIEN_KHONG_SUA: { nhan: string; giaTri: string; lyDo: string }[] = [
  {
    nhan: "Mỗi lần giao phải có phiếu giao nhận đính kèm",
    giaTri: "Bắt buộc",
    lyDo: "Chỉ đạo Ban lãnh đạo 11/08/2026. Tắt được là hồ sơ thiếu chứng từ mà không ai biết — đúng thứ luật này sinh ra để chặn.",
  },
  {
    nhan: "Ba lớp xác nhận để hoàn thành đơn hàng",
    giaTri: "Giao đủ khối lượng · Thủ kho xác nhận · Trưởng bộ phận xác nhận",
    lyDo: "Ba lớp là ba người khác nhau kiểm chéo. Bỏ một lớp thì mất chỗ đối chiếu, không phải nhanh hơn.",
  },
  {
    nhan: "Chỉ tính khối lượng của phiếu đã nhập kho",
    giaTri: "Bắt buộc",
    lyDo: "Hàng chờ kiểm tra chưa phải hàng nhận được. Tính vào là báo tiến độ ảo.",
  },
  {
    nhan: "Phạm vi kéo thả trên bảng quy trình",
    giaTri: "Một bước (tiến hoặc lùi)",
    lyDo: "Chỉ đạo Ban lãnh đạo 13/08/2026. Đây là cách chống lỡ tay, không phải tham số nghiệp vụ.",
  },
  {
    nhan: "Cỡ tệp đính kèm tối đa",
    giaTri: "10 MB mỗi tệp",
    lyDo: "Ràng buộc kỹ thuật: Firestore chỉ cho 1MB mỗi tài liệu nên tệp phải cắt mảnh. 10MB đã là ~23 lần gọi mạng; nới số ở đây không làm hạ tầng chịu được nhiều hơn.",
  },
  {
    nhan: "Số đề nghị tối đa của bản chạy thử",
    giaTri: "12 đề nghị",
    lyDo: "Ràng buộc kỹ thuật của hosting tĩnh: địa chỉ từng đề nghị phải khai trước khi dựng. Lên bản thật sẽ hết giới hạn này.",
  },
];
