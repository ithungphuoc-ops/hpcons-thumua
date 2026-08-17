// ============================================================
// ĐỌC ĐƠN MUA HÀNG TỪ FILE EXCEL — theo đúng biểu mẫu của công ty
//   `1. INPUT/Bieu mau/1. DON HANG HPCONS.xlsx`
//
// Chỉ đạo Ban lãnh đạo 10/08/2026: dùng chính file biểu mẫu đang lưu hành để nhập
// liệu, khỏi phải gõ tay lại từng dòng.
//
// 🔴 HAI ĐẶC ĐIỂM CỦA BIỂU MẪU QUYẾT ĐỊNH CÁCH ĐỌC — đọc kỹ trước khi sửa:
//
// 1. NHÃN VÀ GIÁ TRỊ NẰM CHUNG MỘT Ô.
//    Các dòng thông tin là ô GỘP hết chiều ngang (A6:H6 "Tên nhà cung cấp:",
//    A21:J21 "Ngày giao hàng:", A24:J24, A25:J25, A26:J26...). Không có ô trống
//    bên cạnh để điền, nên người lập phiếu gõ thẳng vào sau dấu hai chấm:
//        "Tên nhà cung cấp: Công ty TNHH VLXD A"
//    → Muốn lấy giá trị thì cắt phần sau dấu ":" đầu tiên.
//
// 2. BẢNG HÀNG KHÔNG CỐ ĐỊNH SỐ DÒNG.
//    Trong file mẫu, tiêu đề bảng ở dòng 11 và "Cộng tiền hàng" ở dòng 14 (chừa 2
//    dòng trống). Người dùng chèn thêm dòng thì "Cộng tiền hàng" bị đẩy xuống.
//    → KHÔNG đọc cứng đến dòng 13. Phải dò: đọc từ dòng ngay dưới tiêu đề, dừng khi
//      gặp dòng bắt đầu bằng "Cộng tiền hàng" hoặc hết dòng có dữ liệu.
//
// Hàm ở đây là hàm THUẦN, không đụng giao diện. Việc chọn file và hiển thị kết quả
// nằm ở `1-giao-dien/trang/don-hang-lap-moi.tsx`.
// ============================================================

import { boDau } from "@/6-tien-ich/bo-dau";

/** Một dòng hàng đọc được từ file. */
export interface DongExcel {
  stt: number;
  /**
   * ★ SỐ DÒNG THẬT TRONG FILE EXCEL (1-based, đúng số hiện ở lề trái khi mở Excel).
   *
   * 🔴 KHÁC HẲN `stt`. `stt` là số thứ tự app đánh lại sau khi bỏ dòng hỏng; `dongTrongFile`
   * là chỗ người dùng phải bấm vào để sửa. Báo lỗi mà đưa `stt` thì người dùng dò mãi không
   * ra dòng nào sai — yêu cầu Ban lãnh đạo 17/08/2026 là chỉ đúng dòng trong file.
   */
  dongTrongFile: number;
  maHang?: string;
  tenHang: string;
  thongSoKyThuat?: string;
  donViTinh: string;
  soLuong: number;
  donGia?: number;
  /** Cột "% Thuế GTGT" của màn MISA — thuế suất riêng của dòng, đơn vị %. */
  thueSuatGTGT?: number;
  /** Cột "Trường mở rộng 1" của màn MISA. */
  truongMoRong1?: string;
  mucDichSuDung?: string;
  /** Dòng này là DÒNG GHI CHÚ chèn giữa bảng (nút "Thêm ghi chú" của MISA), không phải hàng. */
  laDongGhiChu?: boolean;
}

/** Phần thông tin chung ở đầu và cuối phiếu. */
export interface ThongTinChungExcel {
  tenNhaCungCap?: string;
  diaChiNCC?: string;
  maSoThueNCC?: string;
  nguoiNhan?: string;
  ngay?: string;
  soPhieu?: string;
  loaiTien?: string;
  thueSuatGTGT?: number;
  ngayGiaoHang?: string;
  maDeXuatVaCongTrinh?: string;
  canCuHopDong?: string;
  diaDiemGiaoHang?: string;
  dieuKhoanKhac?: string;
  dieuKhoanThanhToan?: string;
  // --- Các ô bám màn Đơn mua hàng MISA (chỉ đạo Ban lãnh đạo 17/08/2026) ---
  /** Ô "Mã nhà cung cấp". */
  maNCC?: string;
  /** Ô "Người liên hệ" — người bên nhà cung cấp. */
  nguoiLienHe?: string;
  /** Ô "Nhân viên mua hàng" — người bên mình. */
  nhanVienMuaHang?: string;
  /** Ô "Diễn giải". */
  dienGiai?: string;
  /** Ô "Tham chiếu". */
  thamChieu?: string;
  /** Ô "Số ngày được nợ". */
  soNgayDuocNo?: number;
  /** Ô "Ngày đơn hàng" — khác "Ngày giao hàng". */
  ngayDonHang?: string;
  /** Ô "Ngày hợp đồng". */
  ngayHopDong?: string;
}

/** Một dòng file KHÔNG đọc được, kèm chỗ người dùng phải mở ra sửa. */
export interface LoiDongExcel {
  /** Số dòng thật trong file Excel. */
  dongTrongFile: number;
  /** Tên hàng đọc được (nếu có) — để người dùng nhận ra dòng nào mà không cần mở file. */
  tenHang?: string;
  lyDo: string;
}

export interface KetQuaDocExcel {
  thongTinChung: ThongTinChungExcel;
  dong: DongExcel[];
  /**
   * ★ DÒNG GHI CHÚ chèn giữa bảng — tách riêng khỏi `dong`.
   *
   * 🔴 Tách ra là CỐ Ý: gộp vào `dong` thì chúng đi thẳng vào khâu đối chiếu với đề nghị và
   * bị báo "không có trong đề nghị", đẩy người dùng đi sửa tên một thứ vốn không phải hàng hóa.
   */
  dongGhiChu: DongExcel[];
  /**
   * ★ TỪNG DÒNG FILE BỊ LOẠI, kèm SỐ DÒNG TRONG EXCEL và lý do.
   *
   * 🔴 KHÔNG ĐƯỢC IM LẶNG BỎ DÒNG (yêu cầu Ban lãnh đạo 17/08/2026). Đơn thiếu một mặt hàng
   * mà không ai biết thì công trình thiếu vật tư, phát hiện ra lúc đã trễ tiến độ.
   */
  dongLoi: LoiDongExcel[];
  /**
   * ★ TÊN CÁC CỘT BẮT BUỘC KHÔNG TÌM THẤY trong dòng tiêu đề của file.
   *
   * Bảng thực tế của kế toán hiếm khi gõ đúng từng ký tự, nên app khớp tên cột không phân biệt
   * hoa thường và bỏ dấu cách thừa. Khớp không ra thì phải NÓI RÕ THIẾU CỘT NÀO chứ không
   * lặng lẽ đọc thiếu — người dùng nhìn số liệu đúng một nửa mà tưởng đã nhập đủ.
   */
  thieuCot: string[];
  /** Việc cần người dùng biết: dòng bị bỏ qua, ô đọc không ra số... */
  canhBao: string[];
  /**
   * Vùng bảng hàng KHÔNG có một ô dữ liệu nào — tức người dùng vừa chọn **biểu mẫu
   * trống** chứ không phải đơn hàng đã điền.
   *
   * 🔴 Phải tách khỏi trường hợp "đọc được dòng nhưng tên không khớp đề nghị". Hai
   * việc này người dùng phải xử lý khác nhau hoàn toàn: một là đi điền file, một là
   * đi sửa tên hàng. Gộp chung thành một câu báo lỗi là đẩy người dùng đi sai hướng —
   * đã xảy ra thật ngày 10/08/2026 với file `1. DON HANG HPCONS.xlsx` (mẫu trống:
   * hai dòng hàng 12–13 không có ô nào có giá trị).
   */
  bangTrong: boolean;
}

/** Cắt phần giá trị sau dấu hai chấm đầu tiên. `"Ngày: 05/08/2026"` → `"05/08/2026"`. */
function sauDauHaiCham(o: unknown): string | undefined {
  const s = String(o ?? "").trim();
  if (s === "") return undefined;
  const i = s.indexOf(":");
  const giaTri = i >= 0 ? s.slice(i + 1).trim() : s;
  return giaTri === "" ? undefined : giaTri;
}

/**
 * Đọc số từ ô Excel. Ô có thể là số thật, hoặc chuỗi người dùng gõ tay kiểu
 * `"1.200"` / `"1,200"` / `"1 200 kg"`.
 *
 * ⚠️ Người Việt dùng DẤU CHẤM làm phân cách nghìn (`16.800` = mười sáu nghìn tám trăm),
 * khác hệ Anh–Mỹ. Bỏ hết dấu chấm và khoảng trắng, đổi dấu phẩy thành dấu thập phân.
 */
function docSo(o: unknown): number | undefined {
  if (typeof o === "number" && Number.isFinite(o)) return o;
  const s = String(o ?? "").trim();
  if (s === "") return undefined;
  const sach = s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  /**
   * 🔴 CHUỖI CHỮ THUẦN PHẢI TRẢ VỀ "KHÔNG ĐỌC ĐƯỢC", KHÔNG PHẢI SỐ 0.
   *
   * Lột hết ký tự khỏi một chuỗi toàn chữ (VD lỡ đọc nhầm nhãn "Thuế suất thuế GTGT:") thì
   * còn chuỗi rỗng, mà `Number("")` bằng 0 và 0 là số hữu hạn — app hiểu thành "thuế suất
   * 0%" thay vì "không đọc được ô này". Sai kiểu này im lặng tuyệt đối: hóa đơn thiếu VAT
   * mà không có cảnh báo nào.
   */
  if (sach === "" || sach === "-" || sach === "." || sach === "-.") return undefined;
  const n = Number(sach);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Đổi ngày kiểu Việt Nam sang dạng `yyyy-MM-dd` để điền được vào ô `<input type="date">`.
 *
 * `"07/08/2026"` → `"2026-08-07"` · `"7/8/2026"` → `"2026-08-07"`.
 *
 * 🔴 NGÀY TRƯỚC, THÁNG SAU. Biểu mẫu công ty ghi kiểu Việt (dd/MM/yyyy), còn `new Date()`
 * của JavaScript đọc chuỗi "07/08/2026" theo kiểu Mỹ (tháng trước) và cho ra 08/07/2026 —
 * lệch một tháng mà không báo lỗi gì. Vì vậy phải tự tách, không dùng `new Date(chuỗi)`.
 *
 * Trả `undefined` khi không nhận ra dạng ngày — thà để trống cho người dùng tự chọn còn
 * hơn điền một ngày sai.
 */
export function docNgayVN(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const m = s.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (m) {
    const [, ngay, thang, nam] = m;
    const d = Number(ngay);
    const t = Number(thang);
    if (d < 1 || d > 31 || t < 1 || t > 12) return undefined;
    return `${nam}-${String(t).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  // Ô định dạng ngày của Excel có thể đã ở dạng ISO sẵn.
  const iso = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : undefined;
}

/**
 * ★ ĐỌC Ô "% THUẾ GTGT" — phải đỡ được cả hai cách Excel giữ phần trăm.
 *
 * 🔴 CÁI BẪY: ô định dạng Phần trăm hiện "8%" nhưng Excel lưu bên trong là **0.08**. Thư viện
 * trả về đúng 0.08, đọc thẳng thành thuế suất **0,08%** — tiền thuế thiếu gần hết mà không có
 * một dòng cảnh báo nào. Còn ô gõ tay "8%" hay "8" thì lại là 8 thật.
 *
 * Cách phân biệt: thuế suất GTGT ở Việt Nam là 0 · 5 · 8 · 10 (%), không có mức nào dưới 1%.
 * Nên số nằm trong khoảng (0;1) chắc chắn là dạng thập phân → nhân 100.
 *
 * ⚠️ Đánh đổi đã biết: mức thuế thật dưới 1% sẽ bị hiểu sai. Chấp nhận được vì mức đó không tồn
 * tại trong biểu thuế hiện hành; nếu sau này có thì phải đọc thêm định dạng ô, không đoán nữa.
 */
function docThueSuat(o: unknown): number | undefined {
  const n = docSo(o);
  if (n === undefined) return undefined;
  if (n > 0 && n < 1) return n * 100;
  return n;
}

// ============================================================
// KHỚP CỘT THEO TÊN TIÊU ĐỀ
//
// 🔴 VÌ SAO ĐỔI TỪ VỊ TRÍ CỨNG SANG KHỚP TÊN (chỉ đạo Ban lãnh đạo 17/08/2026):
// Trước đây app đọc cứng cột A→J. Màn Đơn mua hàng của MISA có thêm cột "% Thuế GTGT",
// "Tiền thuế GTGT", "Trường mở rộng 1" và cột đầu ghi "#" chứ không phải "STT" — chỉ cần
// người dùng chèn một cột là mọi cột sau đó lệch hết, mà lệch IM LẶNG: app vẫn đọc ra số,
// chỉ là lấy nhầm ô. Đơn giá đọc nhầm sang cột thành tiền thì đơn hàng sai giá.
//
// Khớp theo tên thì chèn cột, đổi thứ tự, thêm cột lạ đều không ảnh hưởng.
// ============================================================

/** Các cột app biết đọc. */
export type MaCot =
  | "stt"
  | "maHang"
  | "tenHang"
  | "thongSoKyThuat"
  | "donViTinh"
  | "soLuong"
  | "donGia"
  | "thanhTien"
  | "thueSuatGTGT"
  | "tienThueGTGT"
  | "truongMoRong1"
  | "mucDichSuDung";

/** Tên hiển thị của cột — dùng khi báo "thiếu cột nào". */
export const TEN_COT: Record<MaCot, string> = {
  stt: "STT",
  maHang: "Mã hàng",
  tenHang: "Tên hàng",
  thongSoKyThuat: "Thông số kỹ thuật",
  donViTinh: "ĐVT",
  soLuong: "Số lượng",
  donGia: "Đơn giá",
  thanhTien: "Thành tiền",
  thueSuatGTGT: "% Thuế GTGT",
  tienThueGTGT: "Tiền thuế GTGT",
  truongMoRong1: "Trường mở rộng 1",
  mucDichSuDung: "Mục đích sử dụng",
};

/**
 * Các cách viết chấp nhận được cho mỗi cột — đã bỏ dấu và viết thường.
 *
 * ⚠️ SO KHỚP ĐÚNG BẰNG CẢ CHUỖI, không dùng "chứa" hay "bắt đầu bằng". Nếu dùng "chứa" thì
 * "tien thue gtgt" chứa luôn "thue gtgt" → hai cột khác nhau tranh nhau một ô, và cột nào
 * thắng phụ thuộc thứ tự duyệt. Sai kiểu đó không có triệu chứng nào ngoài con số lệch.
 *
 * 📌 Thêm cách viết mới thì thêm vào đây, đừng sửa chỗ đọc.
 */
const CACH_VIET_COT: Record<MaCot, string[]> = {
  stt: ["stt", "#", "so tt", "so thu tu"],
  maHang: ["ma hang", "ma vat tu", "ma vt", "ma hang hoa", "ma san pham"],
  tenHang: ["ten hang", "ten vat tu", "ten vat lieu", "ten hang hoa", "ten hang hoa dich vu"],
  thongSoKyThuat: ["thong so ky thuat", "thong so", "quy cach", "quy cach ky thuat", "tskt"],
  donViTinh: ["dvt", "don vi tinh", "don vi", "dv tinh"],
  soLuong: ["sl", "so luong", "khoi luong", "so luong dat", "kl"],
  donGia: ["don gia", "gia", "don gia chua thue", "don gia truoc thue"],
  thanhTien: ["thanh tien", "thanh tien chua thue"],
  thueSuatGTGT: ["% thue gtgt", "thue suat gtgt", "% vat", "thue gtgt", "thue suat", "vat", "% thue"],
  tienThueGTGT: ["tien thue gtgt", "tien thue", "tien vat"],
  truongMoRong1: ["truong mo rong 1", "truong mo rong"],
  mucDichSuDung: ["muc dich su dung", "muc dich", "ghi chu su dung"],
};

/**
 * Chuẩn hóa một ô tiêu đề để đem so.
 *
 * Bỏ dấu tiếng Việt · viết thường · bỏ dấu `*` (MISA đánh dấu trường bắt buộc bằng dấu sao) ·
 * gộp mọi khoảng trắng và dấu chấm/hai chấm thành một dấu cách · cắt hai đầu.
 * Nhờ vậy `"  SỐ LƯỢNG "`, `"Số lượng"`, `"số  lượng"` đều ra `"so luong"`.
 */
function chuanHoaTieuDe(s: string): string {
  return boDau(s)
    .replace(/\*/g, "")
    .replace(/[:.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Vị trí cột (1-based) của từng loại dữ liệu trong file đang đọc. */
export type BanDoCot = Partial<Record<MaCot, number>>;

/**
 * Đọc dòng tiêu đề thành bản đồ cột.
 *
 * ⚠️ CỘT KHỚP ĐẦU TIÊN THẮNG. Biểu mẫu công ty gộp ô "Thành tiền" hết H:I, mà thư viện trả
 * giá trị ô gốc cho mọi ô con trong vùng gộp — nên cột I cũng "tên là Thành tiền". Giữ cột
 * khớp đầu tiên (H) thì đọc đúng ô có số; để cột sau đè lên là đọc trúng ô rỗng.
 */
function doBanDoCot(oChu: (r: number, c: number) => string, dongTieuDe: number, soCot: number): BanDoCot {
  const banDo: BanDoCot = {};
  for (let c = 1; c <= soCot; c++) {
    const tieuDe = chuanHoaTieuDe(oChu(dongTieuDe, c));
    if (tieuDe === "") continue;
    for (const ma of Object.keys(CACH_VIET_COT) as MaCot[]) {
      if (banDo[ma] !== undefined) continue;
      if (CACH_VIET_COT[ma].includes(tieuDe)) {
        banDo[ma] = c;
        break;
      }
    }
  }
  return banDo;
}

/** Lấy chuỗi hiển thị của một ô ExcelJS (ô có công thức trả về object `{ result }`). */
function chuOi(o: unknown): string {
  if (o === null || o === undefined) return "";
  if (typeof o === "object") {
    const v = o as { result?: unknown; richText?: { text: string }[]; text?: string };
    if (Array.isArray(v.richText)) return v.richText.map((r) => r.text).join("");
    if (v.result !== undefined) return String(v.result);
    if (v.text !== undefined) return String(v.text);
    if (o instanceof Date) return o.toLocaleDateString("vi-VN");
  }
  return String(o);
}

/**
 * Đọc file Excel đơn mua hàng.
 *
 * `exceljs` được nạp ĐỘNG (`await import`) để không cộng ~1MB vào gói tải lần đầu —
 * phần lớn người dùng không bao giờ bấm nhập Excel.
 */
export async function docDonHangTuExcel(file: ArrayBuffer): Promise<KetQuaDocExcel> {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();

  /**
   * 🔴 KHÔNG NUỐT LỖI ĐỊNH DẠNG. Ném ra một câu nói rõ phải làm gì, kèm nguyên nhân gốc ở
   * `cause` để còn chẩn đoán được khi người dùng báo lỗi. Trước đây lỗi thô của thư viện đi
   * thẳng lên giao diện, mà nó viết bằng tiếng Anh và không nói được file sai ở chỗ nào.
   */
  try {
    await wb.xlsx.load(file);
  } catch (loi) {
    throw new Error(
      "Không mở được file. File phải là .xlsx (Excel 2007 trở lên) và không bị hỏng. " +
        "File .xls đời cũ cần mở bằng Excel rồi “Lưu thành” định dạng .xlsx.",
      { cause: loi },
    );
  }

  /** Kết quả rỗng dùng cho các đường thoát sớm — khai một chỗ để không sót trường mới. */
  const ketQuaRong = (canhBao: string[]): KetQuaDocExcel => ({
    thongTinChung: {},
    dong: [],
    dongGhiChu: [],
    dongLoi: [],
    thieuCot: [],
    canhBao,
    bangTrong: true,
  });

  const ws = wb.worksheets[0];
  if (!ws) return ketQuaRong(["File không có trang tính nào."]);

  const canhBao: string[] = [];
  const dongLoi: LoiDongExcel[] = [];
  const oChu = (r: number, c: number) => chuOi(ws.getRow(r).getCell(c).value).trim();

  /**
   * --- Dò dòng tiêu đề bảng ---
   *
   * 🔴 KHÔNG CÒN ĐÒI Ô A PHẢI LÀ "STT". Màn Đơn mua hàng của MISA đánh cột đầu là "#", và
   * bảng của kế toán hay chèn thêm cột trước STT. Dấu hiệu chắc chắn hơn: dòng nào vừa có cột
   * TÊN HÀNG vừa có cột SỐ LƯỢNG thì đó là dòng tiêu đề bảng — không bảng hàng nào thiếu hai
   * cột này, và không dòng dữ liệu nào vô tình có cả hai cái tên đó.
   */
  const SO_COT_QUET = Math.max(ws.columnCount, 20);
  let dongTieuDe = -1;
  let banDoCot: BanDoCot = {};
  for (let r = 1; r <= Math.min(ws.rowCount, 40); r++) {
    const thu = doBanDoCot(oChu, r, SO_COT_QUET);
    if (thu.tenHang !== undefined && thu.soLuong !== undefined) {
      dongTieuDe = r;
      banDoCot = thu;
      break;
    }
  }
  if (dongTieuDe < 0) {
    return ketQuaRong([
      "Không tìm thấy bảng hàng trong file. Dòng tiêu đề của bảng phải có ít nhất hai cột " +
        "“Tên hàng” và “Số lượng” (viết hoa hay thường đều được). " +
        "Bấm “Tải file mẫu” để lấy bản đúng cấu trúc.",
    ]);
  }

  /**
   * --- Báo thiếu cột, KHÔNG lặng lẽ đọc thiếu ---
   *
   * Bảy cột Ban lãnh đạo yêu cầu (17/08/2026) đối chiếu với màn MISA. Thiếu thì vẫn đọc tiếp
   * bằng những cột có thật — chặn hẳn sẽ làm biểu mẫu công ty đang lưu hành (không có cột
   * "% Thuế GTGT") không nhập được nữa. Nhưng phải NÊU ĐÍCH DANH cột thiếu để người dùng biết
   * số liệu nào không được lấy vào.
   */
  const COT_BAT_BUOC: MaCot[] = [
    "maHang",
    "tenHang",
    "thongSoKyThuat",
    "donViTinh",
    "soLuong",
    "donGia",
    "thueSuatGTGT",
  ];
  const thieuCot = COT_BAT_BUOC.filter((ma) => banDoCot[ma] === undefined).map((ma) => TEN_COT[ma]);
  if (thieuCot.length > 0) {
    canhBao.push(
      `File thiếu ${thieuCot.length} cột so với mẫu đơn mua hàng: ${thieuCot.join(" · ")}. ` +
        "Các cột này sẽ để trống, cần điền tay sau khi nhập.",
    );
  }
  // Cột "% Thuế GTGT" thiếu là chuyện thường với biểu mẫu công ty — nói rõ app lấy gì thay thế,
  // đừng để người dùng tưởng thuế bị bỏ qua.
  if (banDoCot.thueSuatGTGT === undefined) {
    canhBao.push(
      "File không có cột “% Thuế GTGT” theo từng dòng — app sẽ dùng thuế suất chung của cả đơn.",
    );
  }

  /** Đọc một ô theo LOẠI dữ liệu thay vì theo vị trí. Cột không có trong file → chuỗi rỗng. */
  const oTheoCot = (r: number, ma: MaCot): string => {
    const c = banDoCot[ma];
    return c === undefined ? "" : oChu(r, c);
  };
  const oThoTheoCot = (r: number, ma: MaCot): unknown => {
    const c = banDoCot[ma];
    return c === undefined ? undefined : ws.getRow(r).getCell(c).value;
  };
  /**
   * Cột STT thật (nếu file có). Dùng cho chốt chặn "ô STT luôn là số" ở dưới.
   *
   * 🔴 KHÔNG ĐƯỢC THAY BẰNG CỘT 1 KHI FILE KHÔNG CÓ CỘT STT. Bảng nào không có cột STT thì
   * cột 1 thường chính là "Tên hàng" — mà tên hàng là chữ, nên chốt chặn kia cắt đứt bảng
   * ngay dòng hàng đầu tiên và app đọc ra 0 dòng. Lỗi này IM LẶNG hoàn toàn: không cảnh báo,
   * chỉ là đơn hàng trống. Đã dựng lại được khi thử với bảng đảo thứ tự cột.
   */
  const cotSTT = banDoCot.stt;

  // --- Thông tin chung: dò theo NHÃN chứ không theo số dòng cứng ---
  // Người dùng có thể chèn/xóa dòng phía trên bảng, dò theo nhãn thì vẫn đúng.
  //
  // 🔴 PHẢI BỎ QUA VÙNG ĐẦU TRANG — nơi in thông tin CÔNG TY MÌNH (bên mua).
  // Ô **C2** của biểu mẫu (vùng gộp C2:I2) chứa:
  //     "Địa chỉ: B_4B3_CN, Khu công nghiệp Mỹ Phước 3... MST: 3703172689"
  // tức địa chỉ Hưng Phước. Hàm dò quét cột 1→12 nên dò từ dòng 1 là khớp ngay ô này, và
  // app lấy **địa chỉ công ty mình làm địa chỉ nhà cung cấp** — sai hẳn đối tượng. Nên dò
  // từ dòng tiêu đề "ĐƠN MUA HÀNG" trở xuống, vì mọi thông tin của phiếu đều nằm dưới đó.
  let dongTieuDePhieu = 0;
  for (let r = 1; r <= Math.min(ws.rowCount, 20); r++) {
    if (boDau(oChu(r, 1)).toUpperCase().includes("DON MUA HANG")) {
      dongTieuDePhieu = r;
      break;
    }
  }

  /**
   * Tìm giá trị của một nhãn trên phiếu.
   *
   * 🔴 PHẢI ĐỠ ĐƯỢC HAI CÁCH ĐIỀN, vì biểu mẫu công ty dùng cả hai (đối chiếu file thật
   * Ban lãnh đạo cung cấp 10/08/2026):
   *
   *   1. NHÃN VÀ GIÁ TRỊ CHUNG MỘT Ô — ô gộp hết chiều ngang nên người lập gõ thẳng sau
   *      dấu hai chấm:   A6 = "Tên nhà cung cấp: CÔNG TY TNHH HIỆP PHÁT"
   *   2. NHÃN MỘT Ô, GIÁ TRỊ Ô KẾ BÊN — vùng bên phải phiếu không gộp:
   *      I6 = "Ngày:"  ·  J6 = "05/08/2026"
   *      I7 = "Số:"    ·  J7 = "ĐMH0559-26"
   *
   * Chỉ đỡ cách 1 thì mọi trường bên phải phiếu (Ngày, Số phiếu, Loại tiền) đọc ra rỗng.
   *
   * ⚠️ Quét ô kế bên chỉ trong CÙNG MỘT DÒNG và lấy ô đầu tiên có nội dung. Không nhìn
   * xuống dòng dưới — dòng dưới là nhãn khác, lấy sang là gán sai giá trị.
   */
  const timTheoNhan = (nhan: string): string | undefined => {
    const khoa = nhan.toLowerCase();
    for (let r = dongTieuDePhieu + 1; r <= Math.min(ws.rowCount, 60); r++) {
      for (let c = 1; c <= 12; c++) {
        const s = oChu(r, c);
        if (!s.toLowerCase().startsWith(khoa)) continue;

        // Cách 1: giá trị nằm ngay sau dấu hai chấm trong cùng ô.
        const cungO = sauDauHaiCham(s);
        if (cungO !== undefined) return cungO;

        // Cách 2: giá trị ở ô kế bên phải trên cùng dòng.
        for (let c2 = c + 1; c2 <= 13; c2++) {
          /**
           * 🔴 BỎ QUA Ô CON CỦA VÙNG GỘP. Thư viện Excel trả về giá trị của ô GỐC cho mọi ô
           * con trong vùng gộp — nên ô con của chính cái nhãn vừa khớp sẽ trả lại đúng
           * chuỗi nhãn đó, và app lấy nhãn làm giá trị.
           *
           * Đã dính thật với file do chính app xuất ra: mẫu công ty gộp nhãn
           * "Thuế suất thuế GTGT:" hết ô A:B, giá trị % nằm ở ô C. Nhập lại file đó thì ô B
           * (ô con) trả về chuỗi nhãn, `docSo` lột hết chữ còn chuỗi rỗng, mà `Number("")`
           * bằng 0 — thuế suất âm thầm thành 0%, tiền thuế và tổng thanh toán thiếu VAT mà
           * không một dòng cảnh báo. Không bao giờ đọc tới được ô C.
           */
          const oHienTai = ws.getRow(r).getCell(c2);
          if (oHienTai.isMerged && oHienTai.master !== oHienTai) continue;

          const ben = oChu(r, c2);
          // Bỏ qua ô chỉ có dấu hai chấm (một số biểu mẫu tách dấu ra ô riêng).
          if (ben === "" || ben === ":") continue;

          /**
           * ⚠️ Gặp một NHÃN KHÁC thì dừng, đừng lấy nó làm giá trị. Trường bỏ trống (VD NCC
           * không có mã số thuế) mà cứ quét tiếp sẽ vớ phải nhãn của ô bên cạnh cùng dòng —
           * "Mã số thuế:" trống sẽ nhận nhầm "Loại tiền:" làm mã số thuế.
           */
          if (ben.endsWith(":")) return undefined;

          return ben;
        }
        return undefined;
      }
    }
    return undefined;
  };

  const thongTinChung: ThongTinChungExcel = {
    tenNhaCungCap: timTheoNhan("tên nhà cung cấp"),
    diaChiNCC: timTheoNhan("địa chỉ:"),
    maSoThueNCC: timTheoNhan("mã số thuế"),
    nguoiNhan: timTheoNhan("người nhận"),
    ngay: timTheoNhan("ngày:"),
    soPhieu: timTheoNhan("số:"),
    loaiTien: timTheoNhan("loại tiền"),
    thueSuatGTGT: docSo(timTheoNhan("thuế suất thuế gtgt")),
    ngayGiaoHang: timTheoNhan("ngày giao hàng"),
    maDeXuatVaCongTrinh: timTheoNhan("mã đề xuất và tên công trình"),
    canCuHopDong: timTheoNhan("căn cứ hợp đồng số"),
    diaDiemGiaoHang: timTheoNhan("địa điểm giao hàng"),
    dieuKhoanKhac: timTheoNhan("điều khoản khác"),
    dieuKhoanThanhToan: timTheoNhan("điều khoản thanh toán"),
    // --- Các ô của màn Đơn mua hàng MISA (chỉ đạo Ban lãnh đạo 17/08/2026) ---
    // ⚠️ Dò "mã nhà cung cấp" PHẢI đứng trước và tách khỏi "mã số thuế": hai nhãn đều bắt đầu
    // bằng "mã " nhưng `timTheoNhan` so bằng `startsWith` cả cụm nên không lẫn nhau.
    maNCC: timTheoNhan("mã nhà cung cấp"),
    nguoiLienHe: timTheoNhan("người liên hệ"),
    nhanVienMuaHang: timTheoNhan("nhân viên mua hàng"),
    dienGiai: timTheoNhan("diễn giải"),
    thamChieu: timTheoNhan("tham chiếu"),
    soNgayDuocNo: docSo(timTheoNhan("số ngày được nợ")),
    ngayDonHang: timTheoNhan("ngày đơn hàng"),
    ngayHopDong: timTheoNhan("ngày hợp đồng"),
  };

  // --- Bảng hàng: đọc từ dòng dưới tiêu đề, dừng ở "Cộng tiền hàng" ---
  const dong: DongExcel[] = [];
  const dongGhiChu: DongExcel[] = [];
  let soDongTrongLienTiep = 0;
  /** Có gặp ô nào có dữ liệu trong vùng bảng chưa — để phân biệt biểu mẫu trống. */
  let coODuLieuTrongBang = false;

  /**
   * Các nhãn báo hiệu ĐÃ HẾT BẢNG HÀNG, sang vùng tổng kết.
   *
   * ⚠️ Biểu mẫu trống ghi "Cộng tiền hàng (Chưa trừ CK):" nhưng file đã điền của công ty
   * lại có thêm dòng "Số tiền CK:" và ghi "Cộng tiền hàng (Đã trừ CK):" (đối chiếu file
   * thật 10/08/2026). Liệt kê cả ba để đừng phụ thuộc vào đúng một cách viết.
   */
  const NHAN_HET_BANG = ["cộng tiền hàng", "số tiền ck", "thuế suất", "số tiền viết bằng chữ"];

  for (let r = dongTieuDe + 1; r <= ws.rowCount; r++) {
    /**
     * Nhãn kết thúc bảng — soi CẢ cột 1 LẪN cột Tên hàng.
     *
     * Vùng tổng kết là các ô GỘP hết chiều ngang, mà thư viện trả giá trị ô gốc cho mọi ô con
     * trong vùng gộp. Bảng bắt đầu ở cột 1 thì nhãn nằm ở cột 1; bảng thụt vào (hoặc không có
     * cột STT) thì chính cột Tên hàng nhận được chữ đó. Soi cả hai mới chặn đủ.
     */
    const oMoc = [oChu(r, 1), oTheoCot(r, "tenHang")];
    if (oMoc.some((s) => NHAN_HET_BANG.some((nhan) => s.toLowerCase().startsWith(nhan)))) break;

    // 🔴 CHẶN THÊM MỘT LỚP: ô cột STT của vùng bảng luôn là SỐ. Có chữ mà không phải
    // "Cộng tiền hàng" nghĩa là đã đi quá bảng, xuống vùng tổng kết
    // ("Thuế suất thuế GTGT:", "Số tiền viết bằng chữ:"...). Dừng luôn.
    //
    // ⚠️ CHỈ ÁP DỤNG KHI FILE THẬT SỰ CÓ CỘT STT. Trước đây chỗ này rơi về cột 1 khi không
    // tìm thấy cột STT — mà bảng không có cột STT thì cột 1 chính là "Tên hàng", vốn là chữ,
    // nên bảng bị cắt ngay dòng hàng đầu tiên và app đọc ra 0 dòng, không một cảnh báo nào.
    if (cotSTT !== undefined) {
      const oSTT = oChu(r, cotSTT);
      if (oSTT !== "" && docSo(oSTT) === undefined) break;
    }

    const tenHang = oTheoCot(r, "tenHang");
    const soLuong = docSo(oThoTheoCot(r, "soLuong"));
    const maHang = oTheoCot(r, "maHang");
    const donViTinh = oTheoCot(r, "donViTinh");
    const donGia = docSo(oThoTheoCot(r, "donGia"));
    const thueSuatDong = docThueSuat(oThoTheoCot(r, "thueSuatGTGT"));

    // Bất kỳ ô nào trong vùng bảng có nội dung — kể cả chỉ điền STT hoặc chỉ điền ĐVT.
    // Dùng để nói đúng "biểu mẫu chưa điền gì" thay vì đoán bừa lý do.
    if (!coODuLieuTrongBang) {
      for (let c = 1; c <= SO_COT_QUET; c++) {
        if (oChu(r, c) !== "") {
          coODuLieuTrongBang = true;
          break;
        }
      }
    }

    // Dòng trống hoàn toàn: bỏ qua, nhưng gặp 5 dòng trống liên tiếp thì coi như hết bảng
    // (tránh quét tới hàng nghìn dòng rỗng của file Excel).
    if (tenHang === "" && soLuong === undefined) {
      soDongTrongLienTiep += 1;
      if (soDongTrongLienTiep >= 5) break;
      continue;
    }
    soDongTrongLienTiep = 0;

    // Có tên nhưng thiếu số lượng (hoặc ngược lại) — báo cho người dùng biết dòng nào hỏng,
    // KHÔNG tự đoán giá trị thay họ.
    if (tenHang === "") {
      const lyDo = "có số liệu nhưng thiếu tên hàng";
      dongLoi.push({ dongTrongFile: r, lyDo });
      canhBao.push(`Dòng ${r}: ${lyDo} — đã bỏ qua.`);
      continue;
    }

    /**
     * ★ DÒNG GHI CHÚ chèn giữa bảng (nút "Thêm ghi chú" của MISA) — CHỈ có chữ ở cột Tên hàng.
     *
     * 🔴 PHÂN BIỆT VỚI DÒNG HÀNG QUÊN ĐIỀN SỐ LƯỢNG, nếu không thì mọi dòng thiếu SL đều bị
     * nuốt thành ghi chú và người dùng mất hàng mà không hay. Dấu hiệu: dòng ghi chú không có
     * mã hàng, không ĐVT, không đơn giá, không thuế suất — quên điền SL thì thường vẫn còn ít
     * nhất một trong số đó.
     *
     * Vẫn ghi ra `canhBao` chứ không im lặng: người dùng phải thấy app đã hiểu dòng đó thế nào.
     */
    const trongMoiCotSo =
      maHang === "" && donViTinh === "" && donGia === undefined && thueSuatDong === undefined;
    if (soLuong === undefined && trongMoiCotSo) {
      dongGhiChu.push({
        stt: dongGhiChu.length + 1,
        dongTrongFile: r,
        tenHang,
        donViTinh: "",
        soLuong: 0,
        laDongGhiChu: true,
      });
      canhBao.push(`Dòng ${r}: đọc thành DÒNG GHI CHÚ (“${tenHang}”), không phải mặt hàng.`);
      continue;
    }

    if (soLuong === undefined || soLuong <= 0) {
      const lyDo = "thiếu số lượng hoặc số lượng không hợp lệ";
      dongLoi.push({ dongTrongFile: r, tenHang, lyDo });
      canhBao.push(`Dòng ${r} (${tenHang}): ${lyDo} — đã bỏ qua.`);
      continue;
    }

    // Thuế suất đọc ra ngoài khoảng hợp lý thì BỎ giá trị đó và báo, chứ không đem đi tính:
    // một con số vô lý lọt vào là tổng thanh toán sai mà nhìn bảng không thấy chỗ nào sai.
    let thueSuat = thueSuatDong;
    if (thueSuat !== undefined && (thueSuat < 0 || thueSuat > 100)) {
      const lyDo = `% thuế GTGT không hợp lệ (${thueSuat})`;
      dongLoi.push({ dongTrongFile: r, tenHang, lyDo });
      canhBao.push(`Dòng ${r} (${tenHang}): ${lyDo} — dùng thuế suất chung của đơn thay thế.`);
      thueSuat = undefined;
    }

    dong.push({
      stt: dong.length + 1,
      dongTrongFile: r,
      maHang: maHang || undefined,
      tenHang,
      thongSoKyThuat: oTheoCot(r, "thongSoKyThuat") || undefined,
      donViTinh,
      soLuong,
      donGia,
      thueSuatGTGT: thueSuat,
      truongMoRong1: oTheoCot(r, "truongMoRong1") || undefined,
      mucDichSuDung: oTheoCot(r, "mucDichSuDung") || undefined,
    });
  }

  const bangTrong = !coODuLieuTrongBang;

  // Nói đúng việc đã xảy ra. Ba tình huống, ba câu khác nhau — người dùng phải làm ba
  // việc khác nhau, gộp lại là đẩy họ đi sai hướng.
  if (bangTrong) {
    canhBao.push(
      "File này là BIỂU MẪU TRỐNG — bảng hàng chưa có dòng nào được điền. Hãy điền các cột Tên hàng, ĐVT, SL (và Đơn giá nếu có) rồi chọn lại file.",
    );
  } else if (dong.length === 0) {
    canhBao.push(
      "Bảng hàng có nội dung nhưng không lấy được dòng nào hợp lệ. Mỗi dòng phải có đủ Tên hàng (cột C) và SL (cột F) lớn hơn 0.",
    );
  }
  // Thiếu ĐVT không chặn nhập, nhưng phải nói ra vì đơn hàng in ra sẽ trống cột đó.
  const thieuDVT = dong.filter((d) => d.donViTinh === "").length;
  if (thieuDVT > 0) canhBao.push(`${thieuDVT} dòng chưa có ĐVT — cần điền trước khi chốt đơn.`);

  // Thiếu đơn giá thì không chốt được đơn (luật ở màn lập đơn), nên nói ngay từ lúc nhập file
  // thay vì để người dùng bấm "Chốt đơn hàng" rồi mới bị chặn.
  const thieuGia = dong.filter((d) => d.donGia === undefined || d.donGia <= 0).length;
  if (thieuGia > 0) {
    canhBao.push(`${thieuGia} dòng chưa có đơn giá — phải điền đủ mới chốt được đơn hàng.`);
  }

  return { thongTinChung, dong, dongGhiChu, dongLoi, thieuCot, canhBao, bangTrong };
}

// ============================================================
// KHỚP DÒNG EXCEL VỚI DÒNG CỦA ĐỀ NGHỊ
// ============================================================

/** Một dòng đề nghị đủ để đem đi khớp — chỉ lấy phần cần, không kéo cả kiểu lớn vào. */
export interface DongDeNghiDeKhop {
  stt: number;
  tenVatLieu: string;
  /** Quy cách ghi trên phiếu đề nghị — dùng để phân biệt hai dòng cùng tên vật liệu. */
  quyCach?: string;
  khoiLuongChuaLenPO: number;
  /**
   * Dòng này có lập được đơn lúc này không (đã phân bổ cho người đang thao tác và
   * còn khối lượng chưa lên đơn). Dùng để báo lý do cho đúng, xem `KetQuaKhop`.
   */
  lapDuoc: boolean;
}

export interface KetQuaKhop {
  /** Dòng Excel khớp được với dòng đề nghị nào. */
  khop: { sttDeNghi: number; dongExcel: DongExcel; vuotKhoiLuong: boolean }[];
  /** Mặt hàng trong file KHÔNG hề có trong đề nghị. */
  khongKhop: DongExcel[];
  /**
   * Mặt hàng CÓ trong đề nghị nhưng lúc này không lập đơn được — đã lên đơn hết,
   * hoặc chưa phân bổ cho người đang thao tác.
   *
   * 🔴 Tách riêng khỏi `khongKhop` là CẦN THIẾT: gộp chung thì app báo "không có
   * trong đề nghị" cho mặt hàng rõ ràng đang nằm trong đề nghị, người dùng sẽ tưởng
   * app đọc sai file và mất thời gian dò lại. Đã gặp thật khi thử với pr-001.
   */
  khongLapDuoc: { dongExcel: DongExcel; lyDo: string }[];
}

/**
 * Ghép từng dòng trong file Excel với dòng của đề nghị.
 *
 * 🔴 NGUYÊN TẮC (chỉ đạo Ban lãnh đạo 10/08/2026): *"Thông tin này thống nhất lấy theo PO,
 * nên khi import sẽ lấy thông tin trên PO, phiếu đề nghị chỉ để đối chiếu sau này. Sau này
 * cũng sẽ lấy thông tin từ PO để đẩy qua cho các phòng ban khác"*.
 *
 * Nghĩa là **ĐƠN HÀNG LÀ NGUỒN SỰ THẬT**, việc khớp với đề nghị là để TRUY VẾT, không phải
 * cửa chặn. Nên hàm này cố khớp bằng nhiều cách, từ chắc nhất tới lỏng nhất:
 *
 *   1. **Mã hàng** — chắc nhất, nếu cả hai bên đều có.
 *   2. **Tên + quy cách** — phân biệt được hai dòng cùng tên vật liệu khác quy cách.
 *   3. **Tên** (bỏ dấu, không phân biệt hoa thường).
 *   4. **Tên chứa nhau** — file ghi "Xi măng" mà đề nghị ghi "Xi măng PCB40" thì vẫn là một
 *      thứ. Người lập phiếu và người lập đơn hiếm khi gõ y nguyên từng chữ.
 *
 * ⚠️ Cách 4 chỉ chấp nhận khi khớp được ĐÚNG MỘT dòng đề nghị. Khớp lỏng ra nhiều dòng thì
 * bỏ, vì đoán sai dòng còn tệ hơn không đoán — khối lượng sẽ trừ vào dòng khác.
 *
 * Dòng không khớp được vẫn nằm ở `khongKhop` để người dùng **tự quyết đưa vào đơn hay không**
 * (xem khối "chưa đối chiếu được" ở màn lập đơn), chứ không còn bị loại thẳng như trước.
 */
export function khopVoiDeNghi(
  dongExcel: DongExcel[],
  dongDeNghi: DongDeNghiDeKhop[],
): KetQuaKhop {
  const chuanHoa = (s: string) => boDau(s).replace(/\s+/g, " ").trim();
  const theoTen = new Map<string, DongDeNghiDeKhop>();
  const theoTenQuyCach = new Map<string, DongDeNghiDeKhop>();
  for (const d of dongDeNghi) {
    theoTen.set(chuanHoa(d.tenVatLieu), d);
    if (d.quyCach) theoTenQuyCach.set(`${chuanHoa(d.tenVatLieu)}|${chuanHoa(d.quyCach)}`, d);
  }

  /** Khớp lỏng: tên bên này chứa tên bên kia, và chỉ chấp nhận khi duy nhất một kết quả. */
  const khopLong = (ten: string): DongDeNghiDeKhop | undefined => {
    const t = chuanHoa(ten);
    if (t.length < 3) return undefined; // quá ngắn thì chứa cái gì cũng được, dễ sai
    const ungVien = dongDeNghi.filter((d) => {
      const dt = chuanHoa(d.tenVatLieu);
      return dt.includes(t) || t.includes(dt);
    });
    return ungVien.length === 1 ? ungVien[0] : undefined;
  };

  const khop: KetQuaKhop["khop"] = [];
  const khongKhop: DongExcel[] = [];
  const khongLapDuoc: KetQuaKhop["khongLapDuoc"] = [];

  for (const e of dongExcel) {
    const d =
      (e.thongSoKyThuat
        ? theoTenQuyCach.get(`${chuanHoa(e.tenHang)}|${chuanHoa(e.thongSoKyThuat)}`)
        : undefined) ??
      theoTen.get(chuanHoa(e.tenHang)) ??
      khopLong(e.tenHang);

    if (!d) {
      khongKhop.push(e);
      continue;
    }
    if (!d.lapDuoc) {
      khongLapDuoc.push({
        dongExcel: e,
        lyDo:
          d.khoiLuongChuaLenPO <= 0
            ? "đã lên đơn đủ khối lượng"
            : "chưa được phân bổ cho bạn",
      });
      continue;
    }
    khop.push({
      sttDeNghi: d.stt,
      dongExcel: e,
      // Báo chứ không tự cắt bớt: người dùng phải biết file ghi nhiều hơn phần còn
      // được đặt, rồi tự quyết sửa file hay sửa số trên màn hình.
      vuotKhoiLuong: e.soLuong > d.khoiLuongChuaLenPO,
    });
  }

  return { khop, khongKhop, khongLapDuoc };
}
