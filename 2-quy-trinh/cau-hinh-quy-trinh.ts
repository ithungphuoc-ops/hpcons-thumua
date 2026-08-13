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

/** Tham số quy trình sửa được. Mọi giá trị là số nguyên dương. */
export interface CauHinhQuyTrinh {
  /** Trên mức này (đồng): đơn phải trình Trưởng phòng TMCU ký duyệt, gửi NCC ký xác nhận. */
  nguongKyDuyetDon: number;
  /** Từ mức này (đồng): cần đủ số báo giá tối thiểu, và Tổng Giám đốc là người duyệt. */
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
};

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
  return ra;
}

/** Một tham số trên trang cài đặt: nhãn, mô tả, khoảng hợp lệ. */
export interface MoTaThamSo {
  /** Chỉ các khóa kiểu SỐ — hạn từng bước là bảng riêng, không hiện ở đây. */
  khoa: Exclude<keyof CauHinhQuyTrinh, "hanGioTheoBuoc">;
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
    moTa: "Đơn TỪ mức này phải có đủ số báo giá tối thiểu, và Tổng Giám đốc là người duyệt.",
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
