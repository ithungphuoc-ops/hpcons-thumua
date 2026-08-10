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

/** Một dòng hàng đọc được từ file. Khớp cột A→J của bảng trong biểu mẫu. */
export interface DongExcel {
  stt: number;
  maHang?: string;
  tenHang: string;
  thongSoKyThuat?: string;
  donViTinh: string;
  soLuong: number;
  donGia?: number;
  mucDichSuDung?: string;
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
}

export interface KetQuaDocExcel {
  thongTinChung: ThongTinChungExcel;
  dong: DongExcel[];
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
  await wb.xlsx.load(file);

  const ws = wb.worksheets[0];
  if (!ws) {
    return {
      thongTinChung: {},
      dong: [],
      canhBao: ["File không có trang tính nào."],
      bangTrong: true,
    };
  }

  const canhBao: string[] = [];
  const oChu = (r: number, c: number) => chuOi(ws.getRow(r).getCell(c).value).trim();

  // --- Dò dòng tiêu đề bảng: dòng nào có ô A = "STT" ---
  let dongTieuDe = -1;
  for (let r = 1; r <= Math.min(ws.rowCount, 40); r++) {
    if (oChu(r, 1).toUpperCase() === "STT") {
      dongTieuDe = r;
      break;
    }
  }
  if (dongTieuDe < 0) {
    return {
      thongTinChung: {},
      dong: [],
      canhBao: [
        "Không tìm thấy bảng hàng trong file. File phải theo biểu mẫu “1. DON HANG HPCONS.xlsx” (có dòng tiêu đề bắt đầu bằng ô STT).",
      ],
      bangTrong: true,
    };
  }

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
          const ben = oChu(r, c2);
          // Bỏ qua ô chỉ có dấu hai chấm (một số biểu mẫu tách dấu ra ô riêng).
          if (ben === "" || ben === ":") continue;
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
  };

  // --- Bảng hàng: đọc từ dòng dưới tiêu đề, dừng ở "Cộng tiền hàng" ---
  const dong: DongExcel[] = [];
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
    const oA = oChu(r, 1);
    const oAThuong = oA.toLowerCase();
    if (NHAN_HET_BANG.some((nhan) => oAThuong.startsWith(nhan))) break;

    // 🔴 CHẶN THÊM MỘT LỚP: cột STT của vùng bảng luôn là SỐ. Ô A có chữ mà không
    // phải "Cộng tiền hàng" nghĩa là đã đi quá bảng, xuống vùng tổng kết
    // ("Thuế suất thuế GTGT:", "Số tiền viết bằng chữ:"...). Dừng luôn.
    //
    // Cần lớp này vì vùng tổng kết là các Ô GỘP hết chiều ngang — thư viện đọc sẽ
    // trả giá trị của ô gộp cho MỌI cột trong vùng, nên cột "Tên hàng" bỗng có chữ
    // và dòng rác lọt vào danh sách. Đã gặp thật khi thử.
    if (oA !== "" && docSo(oA) === undefined) break;

    const tenHang = oChu(r, 3);
    const soLuong = docSo(ws.getRow(r).getCell(6).value);
    // Bất kỳ ô nào trong vùng bảng có nội dung — kể cả chỉ điền STT hoặc chỉ điền ĐVT.
    // Dùng để nói đúng "biểu mẫu chưa điền gì" thay vì đoán bừa lý do.
    if (!coODuLieuTrongBang) {
      for (let c = 1; c <= 10; c++) {
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
      canhBao.push(`Dòng ${r}: có số liệu nhưng thiếu tên hàng — đã bỏ qua.`);
      continue;
    }
    if (soLuong === undefined || soLuong <= 0) {
      canhBao.push(`Dòng ${r} (${tenHang}): thiếu số lượng hoặc số lượng không hợp lệ — đã bỏ qua.`);
      continue;
    }

    dong.push({
      stt: dong.length + 1,
      maHang: oChu(r, 2) || undefined,
      tenHang,
      thongSoKyThuat: oChu(r, 4) || undefined,
      donViTinh: oChu(r, 5) || "",
      soLuong,
      donGia: docSo(ws.getRow(r).getCell(7).value),
      mucDichSuDung: oChu(r, 10) || undefined,
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

  return { thongTinChung, dong, canhBao, bangTrong };
}

// ============================================================
// KHỚP DÒNG EXCEL VỚI DÒNG CỦA ĐỀ NGHỊ
// ============================================================

/** Một dòng đề nghị đủ để đem đi khớp — chỉ lấy phần cần, không kéo cả kiểu lớn vào. */
export interface DongDeNghiDeKhop {
  stt: number;
  tenVatLieu: string;
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
 * Ghép từng dòng trong file Excel với dòng của đề nghị, đối chiếu theo TÊN VẬT LIỆU
 * (bỏ dấu, không phân biệt hoa thường, bỏ khoảng trắng thừa).
 *
 * 🔴 KHÔNG tự tạo dòng mới từ file. Đơn đặt hàng bắt buộc trỏ về một dòng của đề nghị
 * (`DongPO.sttDongDeNghi`) — đó là khóa truy vết khối lượng của cả hệ thống. Cho phép
 * nhập mặt hàng lạ từ file là mua thứ không ai đề nghị, và khối lượng nhận sau này
 * không đối chiếu được với đâu cả. Dòng lạ được trả về ở `khongKhop` để người dùng tự xử.
 *
 * ⚠️ Khớp theo tên là cách tạm của ver 1 — quyết định 1 của dự án là "đặt mã vật tư
 * làm sau". Khi có mã vật tư thì đổi sang khớp theo mã, chính xác hơn nhiều.
 */
export function khopVoiDeNghi(
  dongExcel: DongExcel[],
  dongDeNghi: DongDeNghiDeKhop[],
): KetQuaKhop {
  const chuanHoa = (s: string) => boDau(s).replace(/\s+/g, " ").trim();
  const banDo = new Map<string, DongDeNghiDeKhop>();
  for (const d of dongDeNghi) banDo.set(chuanHoa(d.tenVatLieu), d);

  const khop: KetQuaKhop["khop"] = [];
  const khongKhop: DongExcel[] = [];
  const khongLapDuoc: KetQuaKhop["khongLapDuoc"] = [];

  for (const e of dongExcel) {
    const d = banDo.get(chuanHoa(e.tenHang));
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
