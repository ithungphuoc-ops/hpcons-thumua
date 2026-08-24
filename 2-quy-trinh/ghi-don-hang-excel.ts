// ============================================================
// XUẤT FILE EXCEL ĐỂ NHẬP ĐƠN HÀNG — bản đã điền sẵn mặt hàng
//
// 🔴 VÌ SAO CẦN FILE NÀY (bài học 10/08/2026):
// Biểu mẫu `1. INPUT/Bieu mau/1. DON HANG HPCONS.xlsx` là **mẫu trống** — bảng hàng
// (dòng 12–13) không có ô nào có dữ liệu. Người dùng tải mẫu đó rồi chọn nhập vào app
// thì đọc ra 0 dòng, tưởng chức năng nhập bị hỏng. Ban lãnh đạo báo *"chức năng import
// đơn hàng chưa nhận"* chính là tình huống này.
//
// Cách chữa: app tự xuất file đã điền sẵn **đúng những mặt hàng đang chờ lập đơn** của
// đề nghị đang mở. Người lập chỉ việc điền Đơn giá (và sửa SL nếu chia nhỏ đơn) rồi chọn
// lại file — chắc chắn khớp, vì tên hàng do chính app ghi ra.
//
// ⚠️ File này dựng MỚI bằng ExcelJS, KHÔNG copy file biểu mẫu gốc:
//   • `1. INPUT/` là tài liệu đầu vào, không được sửa và không được đưa lên repo công khai
//     (xem CLAUDE.md mục 3.4 và 6.3).
//   • Vì vậy file xuất ra **không có logo và định dạng in** của bản gốc. Nó chỉ dùng để
//     NHẬP LIỆU. Muốn bản in đúng biểu mẫu thì dùng trang in A4 của app (`/in/don-hang/...`).
//
// 📌 Thứ tự cột PHẢI trùng với bên đọc (`doc-don-hang-excel.ts`):
//     A=STT · B=Mã hàng · C=Tên hàng · D=Thông số kỹ thuật · E=ĐVT · F=SL ·
//     G=Đơn giá · H=Thành tiền · J=Mục đích sử dụng
// Sửa một bên mà quên bên kia là file xuất ra chính app lại không đọc được.
// ============================================================

/** Một dòng cần đưa vào file mẫu. */
export interface DongDeGhi {
  stt: number;
  tenVatLieu: string;
  quyCach?: string;
  donViTinh: string;
  /** Khối lượng còn được đặt — điền sẵn để người lập không phải tra lại. */
  soLuong: number;
  mucDichSuDung?: string;
  /**
   * ★ Đơn giá ĐANG CÓ TRÊN ĐƠN (21/08/2026) — có thì ghi sẵn vào cột G.
   *
   * 🔴 Ban lãnh đạo: *"sao file mẫu đơn mua hàng xuất ra lại không giống đơn nhập"*. Trước đây
   * hàm này cố tình để trống cột Đơn giá, đúng cho lần đầu lập đơn — nhưng người đã điền giá,
   * chọn nhà cung cấp, ghi điều khoản rồi mới tải file thì nhận về một tờ trắng và tưởng app
   * làm mất dữ liệu. Ghi sẵn thì file trở thành ĐÚNG hiện trạng đơn: sửa ngoài Excel rồi nạp
   * lại vào app là một vòng khép kín, không phải gõ lại từ đầu.
   */
  donGia?: number;
  /** % thuế GTGT RIÊNG của dòng — chỉ ghi khi khác thuế suất chung, đúng nghĩa cột K. */
  thueSuatDong?: number;
}

export interface DauVaoFileMau {
  /**
   * Mã phiếu đề nghị nguồn.
   *
   * ⚠️ TÙY CHỌN từ 18/08/2026: module "Lập đơn mua hàng (PO)" độc lập không gắn đề nghị nào
   * (chỉ đạo Ban lãnh đạo). Bỏ trống thì dòng "Mã đề xuất và tên công trình:" chỉ còn tên
   * công trình — `filter(Boolean)` lo, không in ra dấu gạch ngang trơ.
   */
  maDeNghi?: string;
  tenCongTrinh: string;
  maHopDongCDT?: string;
  diaDiemGiaoHang?: string;
  nguoiNhanHang?: string;
  /**
   * ★ Những gì người lập ĐÃ ĐIỀN TRÊN ĐƠN (21/08/2026) — có thì ghi sẵn vào đúng ô của nó.
   *
   * Tất cả đều tùy chọn: lần đầu lập đơn thì chưa có gì, file ra vẫn là biểu mẫu trống như cũ.
   */
  tenNhaCungCap?: string;
  diaChiNCC?: string;
  maSoThueNCC?: string;
  maNCC?: string;
  nguoiLienHeNCC?: string;
  nhanVienMuaHang?: string;
  thamChieu?: string;
  soNgayDuocNo?: number;
  /** Ngày lập đơn, dạng dd/mm/yyyy. */
  ngayDonHang?: string;
  /** Ngày hợp đồng với chủ đầu tư, dạng dd/mm/yyyy. */
  ngayHopDongCDT?: string;
  /** Ngày giao dự kiến, ĐÃ ở dạng người Việt đọc được (dd/mm/yyyy) — nơi gọi lo việc định dạng. */
  ngayGiaoHang?: string;
  dieuKhoanKhac?: string;
  dieuKhoanThanhToan?: string;
  /** Thuế suất chung của đơn, tính theo % (VD 8 hoặc 10). */
  thueSuatGTGT?: number;
  dong: DongDeGhi[];
  /**
   * ★ File dành cho đơn KHÔNG gắn đề nghị — đổi CÂU HƯỚNG DẪN ở cuối file.
   *
   * 🔴 Không đổi thì file mẫu dặn *"KHÔNG đổi tên hàng ở cột C — app đối chiếu theo tên này"*,
   * trong khi đơn độc lập chẳng đối chiếu với gì cả và người lập được phép gõ tên bất kỳ. Một
   * câu hướng dẫn sai còn tệ hơn không có: người dùng làm theo rồi tự trách mình.
   */
  nhapTuDo?: boolean;
}

/** Nhãn của biểu mẫu giấy — giữ nguyên chữ để người dùng nhìn ra ngay là cùng một mẫu. */
const NHAN = {
  tieuDe: "ĐƠN MUA HÀNG",
  nhaCungCap: "Tên nhà cung cấp:",
  diaChi: "Địa chỉ:",
  maSoThue: "Mã số thuế:",
  nguoiNhan: "Người Nhận:",
  /**
   * ★ BẢY DÒNG CỦA MÀN MISA — bổ sung 21/08/2026.
   *
   * 🔴 `doc-don-hang-excel.ts` ĐÃ dò sẵn bảy nhãn này từ 17/08/2026, nhưng biểu mẫu do app xuất
   * ra lại không in dòng nào cả. Hệ quả: người lập không có chỗ nào để điền mã nhà cung cấp,
   * người liên hệ, nhân viên mua hàng, tham chiếu, số ngày được nợ, ngày đơn hàng, ngày hợp
   * đồng — và app cũng không hề báo là thiếu. Cả một nhóm trường nằm im, không đường vào.
   *
   * ⚠️ Chữ phải trùng ĐÚNG với chuỗi bên đọc dò (`timTheoNhan`), kể cả dấu hai chấm.
   */
  maNCC: "Mã nhà cung cấp:",
  nguoiLienHe: "Người liên hệ:",
  nhanVienMuaHang: "Nhân viên mua hàng:",
  thamChieu: "Tham chiếu:",
  soNgayDuocNo: "Số ngày được nợ:",
  ngayDonHang: "Ngày đơn hàng:",
  ngayHopDong: "Ngày hợp đồng:",
  congTienHang: "Cộng tiền hàng (Chưa trừ CK):",
  thueSuat: "Thuế suất thuế GTGT:",
  ngayGiaoHang: "Ngày giao hàng:",
  maDeXuat: "Mã đề xuất và tên công trình:",
  canCuHopDong: "Căn cứ hợp đồng số:",
  diaDiemGiao: "Địa điểm giao hàng:",
  dieuKhoanKhac: "Điều khoản khác:",
  dieuKhoanThanhToan: "Điều khoản thanh toán:",
} as const;

/**
 * Tiêu đề bảng.
 *
 * 🔴 CỘT A→J GIỮ NGUYÊN THỨ TỰ CỦA BIỂU MẪU CÔNG TY — đây là chứng từ đang lưu hành, và cả
 * `xuat-don-hang-excel.ts` lẫn trang in A4 đều bám thứ tự này.
 *
 * ★ Hai cột MỚI (K, L) theo màn Đơn mua hàng MISA (chỉ đạo Ban lãnh đạo 17/08/2026) được
 * ĐẶT THÊM VÀO CUỐI, không chen vào giữa. MISA xếp "% Thuế GTGT" ngay sau "Thành tiền", nhưng
 * chen vào đó sẽ đẩy cột "Mục đích sử dụng" của biểu mẫu công ty sang chỗ khác — mà biểu mẫu
 * công ty mới là chứng từ có hiệu lực.
 *
 * 📌 Chen được vào cuối là nhờ `doc-don-hang-excel.ts` nay khớp cột THEO TÊN TIÊU ĐỀ chứ không
 * theo vị trí, nên thứ tự cột không còn là ràng buộc giữa hai file.
 */
const TIEU_DE_BANG = [
  "STT",
  "Mã hàng",
  "Tên hàng",
  /* Nhãn đúng theo biểu mẫu công ty (23/08/2026) — bên đọc nhận cả cách viết cũ. */
  "Quy cách / chủng loại",
  "ĐVT",
  "SL",
  "Đơn giá",
  "Thành tiền",
  "",
  "Mục đích sử dụng",
  "% Thuế GTGT",
  /* ❌ BỎ cột "Trường mở rộng 1" (21/08/2026).
     Nó là cột của màn MISA, app này KHÔNG có nghiệp vụ nào dùng tới, nên mọi file xuất ra đều
     có một cột tiêu đề đứng trơ mà cả cột rỗng — người mở file hỏi "cột này điền gì" và không
     ai trả lời được. Bên đọc VẪN nhận cột này nếu file MISA thật có (`doc-don-hang-excel.ts`
     khớp cột theo tên tiêu đề), nên bỏ ở đây không làm mất khả năng nhập file bên ngoài. */
];

/**
 * Dựng file .xlsx để người lập đơn điền đơn giá.
 *
 * `exceljs` nạp động giống bên đọc — không cộng ~1MB vào gói tải lần đầu.
 */
export async function taoFileNhapDonHang(dv: DauVaoFileMau): Promise<Blob> {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Don mua hang");

  // Bề rộng cột cho vừa mắt khi mở ra — không ảnh hưởng lúc đọc lại.
  ws.columns = [
    { width: 6 }, // A STT
    { width: 12 }, // B Mã hàng
    { width: 34 }, // C Tên hàng
    { width: 26 }, // D Thông số kỹ thuật
    { width: 8 }, // E ĐVT
    { width: 10 }, // F SL
    { width: 14 }, // G Đơn giá
    { width: 16 }, // H Thành tiền
    { width: 4 }, // I (bản gốc gộp H:I)
    { width: 24 }, // J Mục đích sử dụng
    { width: 12 }, // K % Thuế GTGT
  ];

  const datNhan = (dong: number, chu: string) => {
    const o = ws.getRow(dong).getCell(1);
    o.value = chu;
    return o;
  };

  /**
   * Ghi "Nhãn: giá trị" vào CHUNG một ô ở cột A.
   *
   * 🔴 Cố ý ghi chung ô chứ không tách sang ô kế bên: đó là cách biểu mẫu công ty điền và là
   * cách `doc-don-hang-excel.ts` đọc chắc nhất (cách 1 — giá trị nằm sau dấu hai chấm). Tách
   * giá trị ra cột B, H hay bất cứ cột nào của BẢNG là tự tạo thêm một "dòng hàng" giả nằm
   * dưới bảng, rồi bên đọc phải đoán xem nó là hàng hay là chú thích.
   */
  const datNhanCoGiaTri = (dong: number, nhan: string, giaTri?: string | number) => {
    const chu = giaTri === undefined || giaTri === "" ? nhan : `${nhan} ${giaTri}`;
    return datNhan(dong, chu);
  };

  /* 🔴 TIÊU ĐỀ NÓI RÕ ĐÂY LÀ BIỂU MẪU, KHÔNG PHẢI ĐƠN CHÍNH THỨC (21/08/2026).
     Trước đây ô A1 ghi đúng chữ "ĐƠN MUA HÀNG" y như đơn thật, nên người mở file ra tin đây là
     đơn hàng của mình và thấy nó thiếu giá, thiếu nhà cung cấp thì kết luận app làm sai — đúng
     cái lỗi CLAUDE.md §3.5 đã dặn: đừng để app tự nhận một việc nó không làm.
     ⚠️ PHẢI GIỮ chuỗi "ĐƠN MUA HÀNG" trong ô này: `doc-don-hang-excel.ts` dò đúng chuỗi đó
     (không dấu, hoa) để biết vùng thông tin phiếu bắt đầu từ đâu; đổi hẳn tiêu đề là app không
     đọc lại được file do chính nó xuất ra. */
  ws.getRow(1).getCell(1).value = `BIỂU MẪU NHẬP ${NHAN.tieuDe} — chưa phải đơn chính thức`;
  ws.getRow(1).getCell(1).font = { bold: true, size: 14 };

  // Nhãn và giá trị nằm CHUNG một ô, gõ ngay sau dấu hai chấm — đúng cách bên đọc hiểu.
  datNhanCoGiaTri(3, NHAN.nhaCungCap, dv.tenNhaCungCap);
  datNhanCoGiaTri(4, NHAN.diaChi, dv.diaChiNCC);
  datNhanCoGiaTri(5, NHAN.maSoThue, dv.maSoThueNCC);
  datNhanCoGiaTri(6, NHAN.nguoiNhan, dv.nguoiNhanHang);

  /* ★ Bảy dòng của màn MISA — app đã biết ĐỌC chúng từ 17/08/2026 mà biểu mẫu chưa từng IN ra.
     Đặt ngay dưới khối nhà cung cấp, TRƯỚC dòng tiêu đề bảng (dòng 8 cũ đã dời xuống). */
  datNhanCoGiaTri(7, NHAN.maNCC, dv.maNCC);
  datNhanCoGiaTri(8, NHAN.nguoiLienHe, dv.nguoiLienHeNCC);
  datNhanCoGiaTri(9, NHAN.nhanVienMuaHang, dv.nhanVienMuaHang);
  datNhanCoGiaTri(10, NHAN.thamChieu, dv.thamChieu);
  datNhanCoGiaTri(11, NHAN.soNgayDuocNo, dv.soNgayDuocNo);
  datNhanCoGiaTri(12, NHAN.ngayDonHang, dv.ngayDonHang);
  datNhanCoGiaTri(13, NHAN.ngayHopDong, dv.ngayHopDongCDT);

  /* --- Bảng hàng ---
     ⚠️ Dòng tiêu đề dời từ 8 xuống 15 khi thêm bảy dòng MISA ở trên. Con số này KHÔNG phải quy
     ước hai bên phải khớp: `doc-don-hang-excel.ts` tìm dòng tiêu đề bằng cách quét tên cột chứ
     không đọc theo số dòng cứng (xem `dongTieuDe` ở hàm `docDonHangTuExcel`), nên chèn thêm dòng
     phía trên bảng là an toàn — đã kiểm bằng một vòng ghi rồi đọc lại. */
  const DONG_TIEU_DE = 15;
  const hangTieuDe = ws.getRow(DONG_TIEU_DE);
  TIEU_DE_BANG.forEach((chu, i) => {
    if (chu === "") return;
    const o = hangTieuDe.getCell(i + 1);
    o.value = chu;
    o.font = { bold: true };
    o.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  /** Tổng tiền hàng của những dòng ĐÃ CÓ GIÁ — chỉ để ghi vào ô "Cộng tiền hàng". */
  let congTienHang = 0;

  dv.dong.forEach((d, i) => {
    const r = ws.getRow(DONG_TIEU_DE + 1 + i);
    r.getCell(1).value = d.stt;
    // Cột "Mã hàng" để TRỐNG: dự án chưa có danh mục mã vật tư (quyết định 1 — làm sau).
    r.getCell(3).value = d.tenVatLieu;
    if (d.quyCach) r.getCell(4).value = d.quyCach;
    r.getCell(5).value = d.donViTinh;
    r.getCell(6).value = d.soLuong;
    /* Cột 7 (Đơn giá) và 8 (Thành tiền): ĐIỀN SẴN nếu đơn đã có giá, để trống nếu chưa.
       Thành tiền ghi bằng CÔNG THỨC `=F*G` chứ không phải số chết: người lập sửa SL hay đơn giá
       trong Excel thì con số tự chạy theo. Ghi số chết là hai ô nói khác nhau ngay khi họ sửa
       một chữ — và họ sẽ tin con số, không tin phép nhân. */
    if (d.donGia !== undefined && d.donGia > 0) {
      const dongExcel = DONG_TIEU_DE + 1 + i;
      r.getCell(7).value = d.donGia;
      r.getCell(8).value = { formula: `F${dongExcel}*G${dongExcel}` };
      r.getCell(7).numFmt = "#,##0";
      r.getCell(8).numFmt = "#,##0";
      congTienHang += d.donGia * d.soLuong;
    }
    if (d.mucDichSuDung) r.getCell(10).value = d.mucDichSuDung;
    /* Cột 11 (% Thuế GTGT) chỉ điền khi dòng này có thuế suất KHÁC thuế suất chung của đơn.
       Bỏ trống khi giống nhau là CỐ Ý — bên đọc hiểu ô trống là "dùng thuế suất chung", còn
       điền sẵn một con số vào mọi dòng thì người lập tưởng đã được duyệt và không rà lại nữa. */
    if (d.thueSuatDong !== undefined && d.thueSuatDong !== dv.thueSuatGTGT) {
      r.getCell(11).value = d.thueSuatDong;
    }
  });

  // --- Khối tổng và các điều khoản, đặt sau bảng ---
  const sauBang = DONG_TIEU_DE + 1 + dv.dong.length;
  datNhanCoGiaTri(
    sauBang,
    NHAN.congTienHang,
    congTienHang > 0 ? congTienHang.toLocaleString("vi-VN") : undefined,
  );
  datNhanCoGiaTri(
    sauBang + 1,
    NHAN.thueSuat,
    dv.thueSuatGTGT !== undefined ? `${dv.thueSuatGTGT}%` : undefined,
  );
  datNhanCoGiaTri(sauBang + 3, NHAN.ngayGiaoHang, dv.ngayGiaoHang);
  // `filter(Boolean)`: đơn không gắn đề nghị thì chỉ còn tên công trình, không in " — " trơ.
  datNhan(
    sauBang + 4,
    `${NHAN.maDeXuat} ${[dv.maDeNghi, dv.tenCongTrinh].filter(Boolean).join(" — ")}`.trim(),
  );
  datNhan(sauBang + 5, `${NHAN.canCuHopDong} ${dv.maHopDongCDT ?? ""}`.trim());
  datNhan(sauBang + 6, `${NHAN.diaDiemGiao} ${dv.diaDiemGiaoHang ?? ""}`.trim());
  datNhanCoGiaTri(sauBang + 7, NHAN.dieuKhoanKhac, dv.dieuKhoanKhac);
  datNhanCoGiaTri(sauBang + 8, NHAN.dieuKhoanThanhToan, dv.dieuKhoanThanhToan);

  /* 📌 Ghi chú cho người điền, đặt cách ra để không lẫn vào vùng app dò nhãn.
   *
   * 🔴 TÁCH THÀNH NHIỀU DÒNG NGẮN, KHÔNG `wrapText`, KHÔNG GỘP Ô (sửa 21/08/2026).
   *
   * Trước đây cả đoạn hướng dẫn nằm trong MỘT ô ở cột A kèm `wrapText: true`. `wrapText` bọc
   * chữ trong đúng bề rộng của ô — mà cột A rộng có 6 ký tự, nên đoạn văn xếp thành một cột chữ
   * dọc dài hàng chục dòng chạy hết màn hình. Ban lãnh đạo đã thấy đúng cảnh đó khi mở file.
   *
   * ⚠️ VÀ KHÔNG ĐƯỢC CHỮA BẰNG CÁCH GỘP Ô. Thư viện Excel trả giá trị ô GỐC cho mọi ô con trong
   * vùng gộp, nên gộp A→C là ô "Tên hàng" của dòng này bỗng có nội dung, gộp tới E, F là ô "ĐVT"
   * và "SL" cũng vậy → nạp lại chính file này thì dòng hướng dẫn hóa thành một DÒNG HÀNG có tên
   * là cả đoạn văn. `xuat-don-hang-excel.ts` đã dặn nguyên văn chuyện này ("đừng gộp cho đẹp");
   * tôi đã thử gộp A→I rồi nhận ra vướng đúng cái bẫy đó.
   *
   * Cách đúng: mỗi câu một dòng riêng, để mặc `wrapText` tắt. Chuỗi dài trong ô A sẽ hiển thị
   * VẮT NGANG qua các ô bên phải đang trống — Excel chỉ vẽ tràn ra, không đặt nội dung vào ô
   * nào, nên các ô B…K của dòng đó vẫn trống thật và bên đọc loại dòng đúng như cơ chế cũ.
   */
  const cauHuongDan = dv.nhapTuDo
    ? [
        // Đơn không gắn đề nghị: app KHÔNG đối chiếu tên hàng với hồ sơ nào, nên được gõ tự do
        // và được thêm dòng mới. Nói đúng như vậy, đừng dặn ngược lại.
        "Hướng dẫn: điền Tên hàng (C), ĐVT (E), SL (F) và Đơn giá (G) cho từng dòng — thêm bao nhiêu dòng cũng được.",
        "Ghi tên nhà cung cấp ngay sau dấu hai chấm ở dòng “Tên nhà cung cấp:”.",
        "Cột “% Thuế GTGT” (K) chỉ điền khi dòng đó có thuế suất KHÁC thuế suất chung của đơn; để trống là dùng thuế suất chung.",
        "Đơn này KHÔNG gắn phiếu đề nghị nên app không đối chiếu tên hàng với hồ sơ nào — tên gõ thế nào thì in ra đơn thế ấy.",
      ]
    : [
        "Hướng dẫn: điền cột Đơn giá (G) cho từng dòng, sửa SL (F) nếu chia nhỏ đơn cho nhiều nhà cung cấp.",
        "Ghi tên nhà cung cấp ngay sau dấu hai chấm ở dòng “Tên nhà cung cấp:”.",
        "Cột “% Thuế GTGT” (K) chỉ điền khi dòng đó có thuế suất KHÁC thuế suất chung của đơn; để trống là dùng thuế suất chung.",
        "KHÔNG đổi tên hàng ở cột C — app đối chiếu theo tên này.",
      ];

  [
    ...cauHuongDan,
    "KHÔNG đổi chữ ở dòng tiêu đề bảng — app tìm cột theo đúng những tên đó.",
    "Lưu lại rồi bấm “Chọn file Excel” trong app để nạp lại.",
  ].forEach((cau, i) => {
    const o = ws.getRow(sauBang + 11 + i).getCell(1);
    o.value = cau;
    o.font = { italic: true, size: 10 };
  });

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Đặt tên file theo mã đề nghị để không lẫn giữa các đề nghị khi tải nhiều lần.
 *
 * ⚠️ Đơn không gắn đề nghị thì nơi gọi truyền mã dự án (hoặc một nhãn thay thế) — tên file
 * vẫn phải phân biệt được, tải hai lần mà cùng một tên là trình duyệt tự thêm "(1)" và người
 * dùng không biết file nào của việc nào.
 */
export function tenFileNhapDonHang(maDeNghi: string): string {
  /* 🔴 TÊN FILE PHẢI TỰ NÓI ĐÂY LÀ BIỂU MẪU (21/08/2026).
     Tên cũ `Don-mua-hang-<mã>.xlsx` đọc lên y như một đơn mua hàng thật, mà đơn thật do
     `xuat-don-hang-excel.ts` xuất ra với tên `<mã PO>.xlsx`. Hai file cùng nằm trong thư mục
     Tải xuống thì không cách nào phân biệt cái nào là bản để điền, cái nào là bản gửi nhà cung
     cấp — và bản để điền thì không có giá. */
  return `Mau-nhap-don-mua-hang-${maDeNghi}.xlsx`;
}
