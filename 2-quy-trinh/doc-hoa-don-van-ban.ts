// ============================================================
// DÒ THÔNG TIN HOÁ ĐƠN TỪ ĐOẠN CHỮ (PDF vector đã trích text)
//
// ★★ Sếp 20/09/2026: ***"a muốn đính kèm file hoá đơn vào là app tự đọc thông tin trên hoá đơn và
// nhập số liệu vào trường dữ liệu đang có thì có được không?"***, rồi ***"Hãy làm trước nhánh với
// file PDF vector"***, và khi vẫn chưa thấy: ***"Sao chưa có nút đính kèm hoá đơn để app tự đọc
// là lấy thông tin"***.
//
// 🔴 HÀM THUẦN, TÁCH HẲN KHỎI VIỆC ĐỌC PDF. Phần dễ sai nhất của tính năng này là **dò từ khoá**,
// nên nó phải kiểm được bằng bài kiểm chạy ở Node — không phụ thuộc trình duyệt, không phụ thuộc
// thư viện đọc PDF. Việc lấy chữ ra khỏi PDF nằm ở `6-tien-ich/trich-text-pdf.ts`.
//
// 🔴🔴 CHỈ ĐỀ XUẤT, KHÔNG GHI THẲNG VÀO SỔ. Nơi gọi phải điền sẵn vào ô rồi để người dùng nhìn và
// bấm Lưu. Hoá đơn có NHIỀU dòng tiền (tiền hàng chưa thuế · tiền thuế · tổng thanh toán) và mỗi
// nhà cung cấp một mẫu — lấy nhầm dòng là sổ công nợ sai mà nhìn vào không biết.
//
// ⚠️ KHÔNG ĐOÁN BỪA. Không tra ra thì trả `undefined` cho trường đó và nơi gọi nói thẳng *"không
// đọc được, mời nhập tay"* — đúng luật §3.5: đừng để giao diện hứa một việc app không làm.
// ============================================================

import type { NgayISO } from "@/3-du-lieu/kieu-du-lieu";

export interface ThongTinHoaDonDoc {
  soHoaDon?: string;
  ngayHoaDon?: NgayISO;
  soTien?: number;
  /** Tên các trường đã tra ra — để giao diện nói được app đọc được những gì. */
  daDoc: string[];
  /**
   * ★ Câu cảnh báo khi app ĐỌC RA ĐƯỢC nhưng CỐ Ý KHÔNG điền — nơi gọi phải hiện ra.
   *
   * 🔴 Ca duy nhất hiện nay: **hoá đơn điều chỉnh giảm** (số tiền âm). Bỏ dấu trừ rồi điền số
   * dương là nợ **tăng** thay vì giảm, mà người nhập nhìn ô thấy đúng con số nên không có cách
   * nào biết. Thà để trống và nói thẳng.
   */
  canhBao?: string;
}

/** Bỏ dấu tiếng Việt và hạ chữ thường — để dò từ khoá không phụ thuộc cách gõ dấu của từng mẫu. */
function boDau(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/**
 * ★ Đổi chuỗi tiền trong hoá đơn thành số.
 *
 * 🔴 ĐÂY LÀ CHỖ DỄ SAI NHẤT CỦA CẢ TÍNH NĂNG. Hoá đơn Việt ghi `45.522.000` — hiểu dấu chấm là
 * dấu thập phân thì ra **45,5 đồng** thay vì 45 triệu, và con số đó trôi thẳng vào sổ công nợ.
 *
 * 🔴 CA CÓ CẢ HAI DẤU PHẢI XÉT RIÊNG — BẢN ĐẦU CỦA TÔI SAI Ở ĐÂY. Hoá đơn thật Sếp gửi
 * 20/09/2026 ghi đơn giá `69.444,444`: ba chữ số sau dấu phẩy là **phần lẻ**, không phải nhóm
 * nghìn. Luật "đúng một dấu mà sau có 3 chữ số ⇒ phân cách nghìn" áp mù vào đây cho ra
 * **69.444.444 đồng thay vì 69.444 đồng** — sai gấp nghìn lần. Bài kiểm chiều nghịch bắt được.
 *
 * Luật phân biệt:
 *   · có CẢ chấm lẫn phẩy ⇒ dấu đứng SAU CÙNG là thập phân, dấu kia là phân cách nghìn
 *   · chỉ một loại dấu, xuất hiện nhiều hơn một lần ⇒ chắc chắn là phân cách nghìn
 *   · chỉ một loại dấu, xuất hiện đúng một lần, phần sau có ĐÚNG 3 chữ số ⇒ cũng là phân cách
 *     nghìn (tiền Việt gần như không ghi phần lẻ tới 3 số khi không có dấu kia đi kèm)
 *   · còn lại ⇒ dấu thập phân
 */
export function doiTienHoaDon(chuoi: string | undefined): number | undefined {
  if (!chuoi) return undefined;
  let s = chuoi.trim().replace(/[\s ]/g, "");
  if (!s) return undefined;
  const cham = (s.match(/\./g) ?? []).length;
  const phay = (s.match(/,/g) ?? []).length;
  if (cham > 0 && phay > 0) {
    /* Dấu nào đứng sau cùng là dấu thập phân; dấu còn lại chỉ là phân cách nghìn. */
    const thapPhanLaCham = s.lastIndexOf(".") > s.lastIndexOf(",");
    s = s.replace(thapPhanLaCham ? /,/g : /\./g, "");
  } else {
    if (cham > 1 || (cham === 1 && /\.\d{3}(?!\d)/.test(s))) s = s.replace(/\./g, "");
    if (phay > 1 || (phay === 1 && /,\d{3}(?!\d)/.test(s))) s = s.replace(/,/g, "");
  }
  s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
}

/**
 * ★ Ngày có nằm trong khoảng người ta dùng thật không.
 *
 * 🔴 KHÔNG CÓ PHÉP NÀY THÌ CHUỖI RÁC ĐI THẲNG VÀO SỔ. Đo được 20/09/2026: mã tra cứu hoá đơn
 * `1234-56-78` khớp khuôn ISO, và tầng ghi (`vuongMacDongHoaDon`) chỉ kiểm khuôn `\d{4}-\d{2}-\d{2}`
 * nên **nhận luôn**. Ngày hoá đơn là đầu vào của hạn nợ và cảnh báo quá hạn — ngày rác là cả cột
 * cảnh báo nói sai.
 */
function ngayThat(nam: number, thang: number, ngay: number): boolean {
  if (thang < 1 || thang > 12 || ngay < 1 || ngay > 31) return false;
  if (nam < 2000 || nam > 2100) return false;
  const d = new Date(Date.UTC(nam, thang - 1, ngay));
  return d.getUTCFullYear() === nam && d.getUTCMonth() === thang - 1 && d.getUTCDate() === ngay;
}

/** `20/09/2026` · `20-09-2026` · `2026-09-20` → `yyyy-mm-dd`. Ngày không có thật thì trả `undefined`. */
export function doiNgayHoaDon(chuoi: string | undefined): NgayISO | undefined {
  if (!chuoi) return undefined;
  const s = chuoi.trim();
  /* `(?<!\d)`/`(?!\d)`: KHÔNG cắt giữa một dãy số dài hơn — `123456-78-90` không phải ngày. */
  const iso = /(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/.exec(s);
  if (iso && ngayThat(Number(iso[1]), Number(iso[2]), Number(iso[3]))) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  const vn = /(?<!\d)(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{4})(?!\d)/.exec(s);
  if (vn && ngayThat(Number(vn[3]), Number(vn[2]), Number(vn[1]))) {
    const hai = (x: string) => x.padStart(2, "0");
    return `${vn[3]}-${hai(vn[2])}-${hai(vn[1])}`;
  }
  /**
   * ★ Mẫu chữ — ĐO TỪ HOÁ ĐƠN THẬT Sếp gửi 20/09/2026 (mẫu Bkav, ký hiệu `1C25THA`):
   *
   *     Ngày   (day)   10   tháng   (month)   12   năm   (year)   2025
   *
   * 🔴 PHẢI CHO PHÉP PHẦN TIẾNG ANH CHEN GIỮA. Bản đầu của tôi viết `ngay\s*(\d…)` — chỉ chấp
   * nhận khoảng trắng, nên **không khớp mẫu thật** vì có `(day)` nằm giữa. Đây đúng là chỗ nếu
   * không có tệp mẫu thì đã làm sai mà không biết.
   *
   * ⚠️ `[^\d]{0,20}` chứ không phải `.*`: giới hạn khoảng cách để không vớ nhầm con số ở tận
   * dòng khác.
   */
  const chu = /ngay[^\d]{0,20}(\d{1,2})[^\d]{0,20}thang[^\d]{0,20}(\d{1,2})[^\d]{0,20}nam[^\d]{0,20}(\d{4})/.exec(
    boDau(s),
  );
  if (chu && ngayThat(Number(chu[3]), Number(chu[2]), Number(chu[1]))) {
    const hai = (x: string) => x.padStart(2, "0");
    return `${chu[3]}-${hai(chu[2])}-${hai(chu[1])}`;
  }
  return undefined;
}

/**
 * ★★ TỪ KHOÁ CỦA TỪNG TRƯỜNG, xếp theo ĐỘ TIN CẬY GIẢM DẦN.
 *
 * 🔴 THỨ TỰ TRONG NHÓM TIỀN LÀ QUAN TRỌNG NHẤT. *"Tổng cộng tiền thanh toán"* mới là con số công
 * nợ cần; *"Cộng tiền hàng"* là tiền CHƯA thuế và *"Tiền thuế GTGT"* là phần thuế — lấy nhầm hai
 * cái sau là số nợ thiếu đúng phần VAT, mà nhìn vào bảng thì không có gì bất thường.
 *
 * 📌 Viết KHÔNG DẤU vì chuỗi đem so đã qua `boDau`. Thêm mẫu mới chỉ cần thêm vào đây.
 */
const KHOA_SO_HOA_DON = ["so hoa don", "so hd", "invoice no", "so:"];
const KHOA_NGAY = ["ngay hoa don", "ngay lap", "invoice date", "ngay ky"];

/**
 * ★★ CÁC CỤM PHẢI BỎ QUA KHI TÌM SỐ HOÁ ĐƠN — đo được 20/09/2026, và đây là lỗi lấy sai số.
 *
 * `"so:"` là chuỗi con của **rất nhiều** thứ khác trên hoá đơn. `indexOf` lấy lần xuất hiện ĐẦU
 * TIÊN, nên trên hoá đơn chỉ tiếng Việt (không có phần `(Invoice No.)`) nó vớ ngay:
 *
 *     "Mẫu số: 01GTKT0/001 … Số: 00001879"   →  lấy nhầm  01GTKT0/001   (mã mẫu)
 *     "Mã số: 0301234567  … Số: 00001879"    →  lấy nhầm  0301234567    (mã số thuế)
 *
 * Số hoá đơn sai thì đối chiếu với nhà cung cấp là hỏng, mà nhìn vào bảng không thấy gì lạ.
 *
 * 📌 Viết KHÔNG DẤU vì chuỗi đem so đã qua `boDau`.
 */
const CUM_KHONG_PHAI_SO_HOA_DON = ["mau so", "ma so", "so tai khoan", "so thue", "so hieu"];

/**
 * ★★ CÁC CỤM BÁO HIỆU "ĐÂY KHÔNG PHẢI NGÀY HOÁ ĐƠN" — đo được 20/09/2026.
 *
 * Khi tài liệu không có từ khoá ngày nào khớp, app phải đoán bằng cách lấy ngày đầu tiên thấy
 * được. Hai ca đo ra lấy sai mà trông vẫn hợp lệ hoàn toàn:
 *
 *     "Hợp đồng số 12/2026 ký ngày 01/01/2020…"      → lấy ngày ký hợp đồng
 *     "Hạn thanh toán 30/12/2026 ; Ngày 05/11/2026"  → lấy hạn thanh toán
 *
 * 🔴 SAI NGÀY LÀ SAI CẢ CỘT CẢNH BÁO NỢ, vì hạn nợ tính từ ngày hoá đơn. Thà trả `undefined` và
 * mời nhập tay còn hơn điền một ngày trông bình thường.
 */
const CUM_KHONG_PHAI_NGAY_HOA_DON = [
  "hop dong",
  "han thanh toan",
  "han tt",
  "ngay giao",
  "den ngay",
  "tu ngay",
  "ngay den han",
];

/**
 * ⚠️ CỬA SỔ 25 KÝ TỰ LÀ MỘT ĐÁNH ĐỔI ĐÃ ĐO, ĐỪNG NỚI RỘNG CHO "CHẮC ĂN".
 *
 * Nới lên 35 thì ca *"Hạn thanh toán 30/12/2026 ; Ngày 05/11/2026"* mất luôn **ngày đúng**
 * (05/11 cách cụm "hạn thanh toán" 33 ký tự) — chặn nhầm còn tệ hơn vì app im lặng bỏ trống.
 * Giữ 25 thì ca đó lấy đúng.
 *
 * 📌 GIỚI HẠN CÒN LẠI, ĐÃ BIẾT: chuỗi *"Hợp đồng số 12/2026 ký ngày 01/01/2020"* vẫn lọt (cụm
 * "hợp đồng" cách ngày 27 ký tự). Đây là văn bản **không phải hoá đơn**; người dùng vẫn nhìn ô
 * ngày trước khi bấm Lưu. Chưa chặn vì mọi cách chặn thử đều làm mất ngày đúng ở ca trên.
 */
const CUA_SO_TRUOC_NGAY = 25;

/**
 * Tìm ngày trong một đoạn, BỎ QUA những ngày bị cụm loại trừ đứng ngay trước.
 *
 * 📌 Quét từng vị trí có chữ số thay vì gọi thẳng `doiNgayHoaDon` một lần, vì cần biết mỗi ngày
 * nằm ở đâu mới xét được đoạn chữ đứng trước nó.
 */
function doNgayKhongDinhCumLoaiTru(doan: string): NgayISO | undefined {
  const khongDau = boDau(doan);
  const re = /(?<!\d)(\d{1,2}\s*[/-]\s*\d{1,2}\s*[/-]\s*\d{4}|\d{4}-\d{2}-\d{2})(?!\d)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(doan)) !== null) {
    const truoc = khongDau.slice(Math.max(0, m.index - CUA_SO_TRUOC_NGAY), m.index);
    if (CUM_KHONG_PHAI_NGAY_HOA_DON.some((c) => truoc.includes(c))) continue;
    const ngay = doiNgayHoaDon(m[1]);
    if (ngay) return ngay;
  }
  /**
   * Khuôn chữ "Ngày … tháng … năm …" — khuôn chuẩn trên mọi hoá đơn GTGT, xét sau cùng.
   *
   * ⚠️ GỌI THẲNG KHUÔN CHỮ, KHÔNG gọi lại `doiNgayHoaDon(doan)`: hàm đó thử khuôn `dd/mm/yyyy`
   * trước, nên nó sẽ nhặt lại đúng cái ngày mà vòng lặp trên vừa loại.
   */
  const chu = /ngay[^\d]{0,20}(\d{1,2})[^\d]{0,20}thang[^\d]{0,20}(\d{1,2})[^\d]{0,20}nam[^\d]{0,20}(\d{4})/.exec(
    khongDau,
  );
  return chu ? doiNgayHoaDon(`${chu[1]}/${chu[2]}/${chu[3]}`) : undefined;
}
const KHOA_TIEN = [
  "tong cong tien thanh toan",
  "tong tien thanh toan",
  "tong cong thanh toan",
  "tong tien can thanh toan",
  "total payment",
];

/**
 * ★★ Lấy đoạn chữ ngay sau một từ khoá, tối đa `soKyTu` ký tự.
 *
 * 🔴🔴 BỎ PHẦN TIẾNG ANH TRONG NGOẶC ĐƠN — ĐÂY LÀ LỖI LẤY SAI SỐ, ĐO ĐƯỢC 20/09/2026.
 * Hoá đơn điện tử Việt Nam gần như luôn song ngữ:
 *
 *     "Số hoá đơn   (Invoice No.) :   00001879"
 *
 * Bản đầu của tôi trả nguyên đoạn `"   (Invoice No.) :   00001879"`, rồi khuôn dò số hoá đơn
 * (`[A-Za-z0-9]…`) vớ ngay chữ **`Invoice`** làm số hoá đơn. Không lỗi, không cảnh báo — chỉ là
 * ô số hoá đơn điền sẵn chữ "Invoice" và người nhập vội bấm Lưu.
 *
 * Nội dung thật (số hoá đơn · ngày · số tiền) **không bao giờ** nằm trong ngoặc đơn trên hoá đơn,
 * nên bỏ cả cụm là an toàn. Bỏ SAU khi đã cắt nên không làm lệch chỉ số của lần tìm sau.
 *
 * @param bỏQuaCum Các cụm mà nếu ĐỨNG NGAY TRƯỚC từ khoá thì vị trí đó không tính (xem
 *   `CUM_KHONG_PHAI_SO_HOA_DON`). Tìm tiếp vị trí sau đó thay vì bỏ cuộc.
 */
function doanSauKhoa(
  vanBanKhongDau: string,
  vanBanGoc: string,
  khoa: string,
  soKyTu = 40,
  boQuaCum: readonly string[] = [],
): string | undefined {
  let i = vanBanKhongDau.indexOf(khoa);
  while (i >= 0) {
    /* Đoạn ngắn ngay trước từ khoá, gộp cả từ khoá — đủ để nhận ra "mau so:" hay "ma so:". */
    const truoc = vanBanKhongDau.slice(Math.max(0, i - 12), i + khoa.length);
    if (!boQuaCum.some((c) => truoc.includes(c))) {
      return vanBanGoc
        .slice(i + khoa.length, i + khoa.length + soKyTu)
        .replace(/\([^)]*\)/g, " ");
    }
    i = vanBanKhongDau.indexOf(khoa, i + khoa.length);
  }
  return undefined;
}

/**
 * ★★★ DÒ THÔNG TIN TỪ TOÀN BỘ CHỮ CỦA MỘT HOÁ ĐƠN.
 *
 * @param vanBan Chữ trích từ PDF (hoặc dán tay). Mọi xuống dòng đều được gom về khoảng trắng
 *   trước khi dò — PDF hay cắt một dòng thành nhiều mảnh, nên giữ nguyên xuống dòng là từ khoá
 *   và con số nằm ở hai "dòng" khác nhau và không bao giờ khớp.
 */
export function doHoaDonTuVanBan(vanBan: string): ThongTinHoaDonDoc {
  /**
   * 🔴 `normalize("NFC")` LÀ BẮT BUỘC, KHÔNG PHẢI CHO ĐẸP. `doanSauKhoa` tìm chỉ số trên chuỗi
   * ĐÃ BỎ DẤU rồi cắt trên chuỗi GỐC — chỉ đúng khi hai chuỗi cùng độ dài. Chữ dạng NFD tách dấu
   * thành ký tự riêng, `boDau` xoá chúng đi ⇒ chuỗi không dấu NGẮN HƠN gốc ⇒ mọi chỉ số lệch về
   * phía trước và cắt nhầm đoạn. Đo được 20/09/2026: cùng một hoá đơn, bản NFD cho ra số hoá đơn
   * là chữ **"hoa"**. pdf.js trả đúng những gì bảng ToUnicode của tệp ghi, và có bộ sinh hoá đơn
   * xuất NFD — nên đây là ca gặp thật, không phải ca giả tưởng.
   */
  const goc = String(vanBan ?? "")
    .normalize("NFC")
    .replace(/\s+/g, " ");
  const khongDau = boDau(goc);
  const daDoc: string[] = [];
  let canhBao: string | undefined;

  let soHoaDon: string | undefined;
  for (const k of KHOA_SO_HOA_DON) {
    /* 🔴 `CUM_KHONG_PHAI_SO_HOA_DON`: chặn "Mẫu số:" / "Mã số:" cướp mất từ khoá `"so:"`. */
    const doan = doanSauKhoa(khongDau, goc, k, 60, CUM_KHONG_PHAI_SO_HOA_DON);
    /* Số hoá đơn là chuỗi chữ-số liền, có thể kèm gạch. Phần `(Invoice No.)` đã được
       `doanSauKhoa` bỏ, nên ở đây chỉ còn nuốt dấu hai chấm và khoảng trắng. */
    const khop = doan ? /^[^A-Za-z0-9]{0,30}([A-Za-z0-9][A-Za-z0-9/-]{2,})/.exec(doan) : null;
    if (khop?.[1]) {
      soHoaDon = khop[1].slice(0, 60);
      break;
    }
  }

  let ngayHoaDon: NgayISO | undefined;
  for (const k of KHOA_NGAY) {
    ngayHoaDon = doiNgayHoaDon(doanSauKhoa(khongDau, goc, k, 60));
    if (ngayHoaDon) break;
  }
  /**
   * ★ Không có từ khoá ngày thì tìm ngày trong PHẦN ĐẦU tài liệu.
   *
   * 🔴 CHỈ ~300 KÝ TỰ ĐẦU, KHÔNG PHẢI CẢ TÀI LIỆU. Bản đầu của tôi dò toàn văn và đo ra hai ca
   * lấy sai mà trông vẫn hợp lệ:
   *
   *     "Hợp đồng số 12/2026 ký ngày 01/01/2020…"   → lấy ngày ký hợp đồng
   *     "Hạn thanh toán 30/12/2026 ; Ngày 05/11/2026" → lấy hạn thanh toán
   *
   * Chú thích cũ của tôi biện hộ *"sai ngày thì người dùng nhìn thấy ngay"* — sai: cả hai ca trên
   * đều ra một ngày trông bình thường. Mà ngày hoá đơn là đầu vào của hạn nợ và cảnh báo quá hạn.
   * Mẫu hoá đơn nào cũng ghi ngày ở đầu tờ, nên thu hẹp phạm vi là mất rất ít mà chặn được cả hai.
   */
  if (!ngayHoaDon) ngayHoaDon = doNgayKhongDinhCumLoaiTru(goc.slice(0, 300));

  let soTien: number | undefined;
  for (const k of KHOA_TIEN) {
    const doan = doanSauKhoa(khongDau, goc, k, 60);
    /**
     * 🔴🔴 BẮT CẢ DẤU TRỪ — HOÁ ĐƠN ĐIỀU CHỈNH GIẢM. Bản đầu của tôi dùng `[^\d]{0,30}` nên dấu
     * trừ bị nuốt mất cùng phần dẫn, và `-1.500.000` thành **+1.500.000**: nợ TĂNG thay vì giảm,
     * người nhập nhìn ô thấy đúng con số nên không có cách nào biết. Hoá đơn điều chỉnh giảm là
     * chuyện thường trong xây dựng (giao thiếu, trả lại hàng).
     *
     * 📌 Đọc ra số âm thì KHÔNG điền, chỉ báo — tầng ghi cũng từ chối số âm, nên điền vào chỉ
     * làm người dùng bấm Lưu rồi nhận một câu lỗi không hiểu vì sao.
     */
    const khop = doan ? /^[^\d-]{0,30}(-?)([\d.,]{4,})/.exec(doan) : null;
    const n = doiTienHoaDon(khop?.[2]);
    if (n !== undefined && n > 0) {
      if (khop?.[1] === "-") {
        canhBao =
          "Đây là hoá đơn điều chỉnh GIẢM (số tiền âm) — app chưa xử lý được loại này, mời nhập tay.";
        break;
      }
      soTien = n;
      break;
    }
  }

  if (soHoaDon) daDoc.push("số hoá đơn");
  if (ngayHoaDon) daDoc.push("ngày");
  if (soTien !== undefined) daDoc.push("số tiền");
  return { soHoaDon, ngayHoaDon, soTien, daDoc, canhBao };
}

// ============================================================
// ★★★ CÁCH ĐỌC THEO DÒNG — Sếp 25/09/2026: ***"sẽ có rất nhiều các mẫu khác nữa, cần phải tối
// ưu cách đọc"***.
//
// 🔴 VÌ SAO PHẢI CÓ: `doHoaDonTuVanBan` ở trên dựng từ ĐÚNG MỘT mẫu (Bkav) và đọc chữ theo THỨ
// TỰ PHẦN MỀM VẼ. Đo 25/09/2026 trên 5 hoá đơn thật của 5 phần mềm, cách cũ đọc đủ 1/5:
//   · HT invoice vẽ chữ NGƯỢC trong mỗi dòng: "5.600.000 (Total payment): Tổng cộng tiền thanh
//     toán" — số đứng TRƯỚC nhãn nên không từ khoá nào khớp.
//   · MISA ghi "Số (No.) : 00007980" — "(No.)" chen giữa nên khoá "so:" trượt; ngày nằm quá ký
//     tự thứ 300 nên nhánh dự phòng không thấy.
//   · EFY: không đọc được ô nào. VNPT: thiếu ngày.
// Cách theo dòng đọc đủ 3 ô trên cả 5 tờ, và Tổng = Tiền hàng + Thuế khớp cả 5.
//
// Hai tầng:
//   1. `dungDongTuManhChu` — dựng lại DÒNG theo TOẠ ĐỘ trên tờ. Phần mềm vẽ theo thứ tự nào cũng
//      được: nhãn và số cùng một hàng về đúng một dòng.
//   2. `doHoaDonTheoDong` — đọc cặp "Nhãn : giá trị" trên từng dòng, so NGUYÊN nhãn. "Số tài
//      khoản", "Số lượng", "Hợp đồng số" không cướp được ô Số hoá đơn.
// ============================================================

/** Một mảnh chữ pdf.js trả về, đã rút gọn còn những gì cần để dựng dòng. */
export interface ManhChu {
  trang: number;
  chu: string;
  x: number;
  y: number;
  /** Bề rộng mảnh — để biết hai mảnh chữ số có đứng sát nhau không. */
  rong?: number;
  /** Chữ in xoay (mã tra cứu in dọc lề) — bỏ, không thì bị xé thành từng mảnh vụn chen vào dòng. */
  xoay?: boolean;
}

/**
 * ★ Gom mảnh chữ thành dòng: cùng trang, |y| lệch ≤ `lech` là một dòng; trong dòng xếp theo x.
 *
 * ⚠️ SO VỚI MỐC CỦA DÒNG (mảnh đầu tiên), KHÔNG so nối tiếp với mảnh liền trước — so nối tiếp thì
 * các cặp lệch 1 đơn vị trôi dần và gộp nhầm hai dòng. Đo 25/09/2026: hai dòng khác nhau gần nhất
 * cách 6 đơn vị (Bkav), cùng một dòng lệch tới 1 (HT, MISA) — ngưỡng 3 nằm giữa.
 */
export function dungDongTuManhChu(manh: readonly ManhChu[], lech = 3): string[] {
  const theoTrang = new Map<number, ManhChu[]>();
  for (const m of manh) {
    if (!m.chu || !m.chu.trim() || m.xoay) continue;
    const ds = theoTrang.get(m.trang) ?? [];
    ds.push(m);
    theoTrang.set(m.trang, ds);
  }
  const ra: string[] = [];
  for (const trang of [...theoTrang.keys()].sort((a, b) => a - b)) {
    const dong: { y: number; m: ManhChu[] }[] = [];
    for (const m of [...(theoTrang.get(trang) ?? [])].sort((a, b) => b.y - a.y)) {
      const d = dong.find((x) => Math.abs(x.y - m.y) <= lech);
      if (d) d.m.push(m);
      else dong.push({ y: m.y, m: [m] });
    }
    for (const d of dong.sort((a, b) => b.y - a.y)) {
      const ms = d.m.sort((a, b) => a.x - b.x);
      let s = ms[0].chu;
      for (let i = 1; i < ms.length; i++) {
        const truoc = ms[i - 1];
        /* Hai mảnh CHỮ SỐ đứng sát nhau thì nối liền — có mẫu in số từng ký tự một. */
        const sat =
          truoc.rong !== undefined &&
          ms[i].x - (truoc.x + truoc.rong) < 1.5 &&
          /\d$/.test(truoc.chu) &&
          /^\d/.test(ms[i].chu);
        s += (sat ? "" : " ") + ms[i].chu;
      }
      ra.push(s);
    }
  }
  return ra;
}

/**
 * Bỏ dấu TỪNG KÝ TỰ để chuỗi không dấu dài ĐÚNG BẰNG chuỗi gốc — tìm chỉ số trên bản không dấu
 * rồi cắt trên bản gốc phải trùng vị trí (cùng loại lỗi đã đo ở ca NFD phía trên).
 */
function boDauGiuDoDai(s: string): string {
  let r = "";
  for (const ch of s) {
    let c = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (c === "đ") c = "d";
    else if (c === "Đ") c = "D";
    r += c.length === ch.length ? c.toLowerCase() : " ".repeat(ch.length);
  }
  return r;
}

/**
 * Che phần chú thích trong ngoặc CÓ CHỮ CÁI — `(No.)`, `(Total payment)` — bằng khoảng trắng CÙNG
 * ĐỘ DÀI. Ngoặc chỉ có số như `(1.500.000)` (số âm kiểu kế toán) thì GIỮ, để còn bắt được.
 *
 * 🔴 CHE, KHÔNG XOÁ. Xoá thì chỉ số lệch; và phản biện 25/09 đo được: bỏ hẳn ngoặc làm mẫu Bkav
 * mất số hoá đơn. Ở đây nhãn "Số (Invoice No.) :" thành "Số                 :" — khớp nhãn "số".
 */
function cheNgoac(s: string): string {
  let truoc: string;
  do {
    truoc = s;
    s = s.replace(/\([^()]*[a-z][^()]*\)/g, (m) => " ".repeat(m.length));
  } while (s !== truoc);
  return s;
}

const NHAN_TONG = [
  "tong cong tien thanh toan",
  "tong tien thanh toan",
  "tong cong thanh toan",
  "tong tien can thanh toan",
  "tong gia tri thanh toan",
  "tong so tien thanh toan",
  "tong thanh toan",
  "tong cong",
];
const NHAN_TIEN_HANG = ["cong tien hang hoa, dich vu", "cong tien hang", "tong tien hang", "tien hang chua thue"];
const NHAN_THUE = ["tong tien thue gtgt", "tien thue gtgt", "tong tien thue", "tien thue"];
/** 📌 "so" để CUỐI: nhãn dài hơn phải được thử trước. */
const NHAN_SO_HD = ["so hoa don", "so hd", "so"];
const NHAN_NGAY = ["ngay hoa don", "ngay lap"];
const NHAN_NGAY_KY = ["ngay ky", "ky ngay", "ngay"];

/**
 * ★★ Tìm "nhãn : giá trị" trong một dòng; trả phần chữ GỐC ngay sau dấu hai chấm.
 *
 * 🔴 SO NGUYÊN NHÃN. Chữ đứng trước nhãn phải là: đầu dòng · một cặp "nhãn : giá trị" khác (đã có
 * dấu ":" phía trước) · hoặc tiêu đề hoá đơn ("VAT INVOICE", "… GIA TĂNG"). Nhờ vậy "Hợp đồng số :
 * 45/2026", "Mã số : 0301234567" không bị coi là nhãn "Số" — phản biện 25/09 dựng đúng ca
 * "Hợp đồng số (Contract No.): 45/2026" và cách dò từ khoá thì lấy nhầm 45/2026.
 */
function timCap(goc: string, khongDau: string, dsNhan: readonly string[]): string | undefined {
  for (const n of dsNhan) {
    const re = new RegExp(`(^|[^a-z])(${n.replace(/ /g, "\\s+")})\\s*:\\s*`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(khongDau)) !== null) {
      const truoc = khongDau.slice(0, m.index + m[1].length).replace(/\s+$/, "");
      if (truoc && !truoc.includes(":") && !/(invoice|gia tang)$/.test(truoc)) continue;
      return goc.slice(m.index + m[0].length);
    }
  }
  return undefined;
}

function ngayTuSo(nam: string, thang: string, ngay: string): NgayISO | undefined {
  return ngayThat(+nam, +thang, +ngay)
    ? `${nam}-${thang.padStart(2, "0")}-${ngay.padStart(2, "0")}`
    : undefined;
}

export interface DoiChieuTienHoaDon {
  tienHang: number;
  thue: number;
  tong: number;
  khop: boolean;
}

export interface ThongTinHoaDonTheoDong extends ThongTinHoaDonDoc {
  /**
   * ★ Câu NHẮC XEM LẠI — app VẪN điền, chỉ nhắc. Cố ý tách khỏi `canhBao`: `canhBao` nghĩa là
   * "đọc ra nhưng KHÔNG điền" và nơi gọi dừng ngay khi gặp nó (phản biện 25/09 chỉ ra).
   */
  nhac: string[];
  /** Tổng = tiền hàng + thuế — chỉ có khi đọc được đủ ba dòng tiền. */
  doiChieu?: DoiChieuTienHoaDon;
}

/**
 * ★★★ Đọc hoá đơn từ các DÒNG đã dựng lại theo toạ độ.
 *
 * Thứ tự dò NGÀY (phản biện 25/09): nhãn rõ ("Ngày lập", "Ngày hoá đơn") → khuôn "Ngày … tháng …
 * năm …" nằm TRƯỚC bảng hàng hoá → cuối cùng mới tới ngày ký số. Quét khuôn chữ trên toàn văn thì
 * "theo HĐ số 12 ngày 05 tháng 08 năm 2026" lấn mất ngày lập; ngày ký số có thể khác ngày lập.
 */
export function doHoaDonTheoDong(dongGoc: readonly string[]): ThongTinHoaDonTheoDong {
  const ds = dongGoc.map((d) => {
    const goc = d.normalize("NFC");
    return { goc, k: cheNgoac(boDauGiuDoDai(goc)) };
  });
  let dongBang = ds.findIndex((d) => /\bstt\b/.test(d.k) || /ten hang/.test(d.k));
  if (dongBang < 0) dongBang = ds.length;

  let soHoaDon: string | undefined;
  let ngayNhan: NgayISO | undefined;
  let ngayChu: NgayISO | undefined;
  let ngayKy: NgayISO | undefined;
  const tien: { tong?: string; tienHang?: string; thue?: string } = {};

  ds.forEach(({ goc, k }, i) => {
    if (!soHoaDon) {
      /* 🔴 Số hoá đơn phải TOÀN CHỮ SỐ, không dính "/" "-" phía sau — loại "45/2026", "01GTKT0/001".
         Giới hạn 8 chữ số: theo ghi nhớ là quy định NĐ 123/2020, CHƯA tra lại văn bản gốc. */
      const v = timCap(goc, k, NHAN_SO_HD);
      const m = v ? /^(\d{1,8})(?![\d/-])/.exec(v) : null;
      if (m) soHoaDon = m[1];
    }
    if (!ngayNhan) {
      const v = timCap(goc, k, NHAN_NGAY);
      const m = v ? /^(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4})/.exec(v) : null;
      if (m) ngayNhan = ngayTuSo(m[3], m[2], m[1]);
    }
    if (!ngayChu && i < dongBang) {
      const m = /ngay\s+(\d{1,2})\s+thang\s+(\d{1,2})\s+nam\s+(\d{4})/.exec(k);
      if (m) ngayChu = ngayTuSo(m[3], m[2], m[1]);
    }
    if (!ngayKy) {
      const v = timCap(goc, k, NHAN_NGAY_KY);
      const m = v ? /^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/.exec(v) : null;
      if (m) ngayKy = ngayTuSo(m[3], m[2], m[1]);
    }
    for (const [truong, nhan] of [
      ["tong", NHAN_TONG],
      ["tienHang", NHAN_TIEN_HANG],
      ["thue", NHAN_THUE],
    ] as const) {
      if (tien[truong] !== undefined) continue;
      const v = timCap(goc, k, nhan);
      const m = v ? /^(\(?-?[\d.,]*\d\)?)/.exec(v.trim()) : null;
      if (m) tien[truong] = m[1];
    }
  });

  const daDoc: string[] = [];
  const nhac: string[] = [];
  let canhBao: string | undefined;
  const ngayHoaDon = ngayNhan ?? ngayChu ?? ngayKy;
  if (!ngayNhan && !ngayChu && ngayKy) {
    nhac.push("Ngày lấy từ ngày ký số — có thể khác ngày lập hoá đơn, mời xem lại.");
  }

  /** Số âm: dấu trừ HOẶC ngoặc kiểu kế toán `(1.500.000)` — cách cũ bỏ qua ca ngoặc im lặng. */
  const laAm = (s?: string) => !!s && (/^-/.test(s) || /^\(.*\)$/.test(s));
  const soDuong = (s?: string) => doiTienHoaDon(s?.replace(/[()-]/g, ""));
  let soTien: number | undefined;
  if (tien.tong !== undefined) {
    if (laAm(tien.tong)) {
      canhBao = "Đây là hoá đơn điều chỉnh GIẢM (số tiền âm) — app chưa xử lý được loại này, mời nhập tay.";
    } else {
      soTien = soDuong(tien.tong);
    }
  }
  let doiChieu: DoiChieuTienHoaDon | undefined;
  const tong = soDuong(tien.tong);
  const tienHang = soDuong(tien.tienHang);
  const thue = soDuong(tien.thue);
  if (tong !== undefined && tienHang !== undefined && thue !== undefined) {
    /* Cho lệch 2 đồng — làm tròn thuế từng dòng hàng. */
    doiChieu = { tienHang, thue, tong, khop: Math.abs(tienHang + thue - tong) <= 2 };
    if (!doiChieu.khop && soTien !== undefined) {
      nhac.push("Tiền hàng + thuế không bằng tổng thanh toán — có thể app lấy nhầm dòng, mời xem lại số tiền.");
    }
  }

  if (soHoaDon) daDoc.push("số hoá đơn");
  if (ngayHoaDon) daDoc.push("ngày");
  if (soTien !== undefined) daDoc.push("số tiền");
  return { soHoaDon, ngayHoaDon, soTien, daDoc, canhBao, nhac, doiChieu };
}

/**
 * ★★★ ĐIỂM VÀO DUY NHẤT cho giao diện: đọc theo dòng trước, ô nào trượt thì lấy từ cách cũ.
 *
 * 📌 Giữ cách cũ làm dự phòng TỪNG Ô, không phải cả tờ: ca PDF không có toạ độ dùng được (hiếm)
 * vẫn còn đường đọc, và không mẫu nào đang đọc được bị đọc kém đi.
 * 🔴 Có `canhBao` (số âm) thì KHÔNG lấy số tiền từ cách cũ — cách cũ cũng sẽ từ chối, nhưng đừng
 * để một đường dự phòng vô tình điền lại đúng con số mà đường chính đã cố ý bỏ trống.
 */
export function doHoaDon(dong: readonly string[], vanBan: string): ThongTinHoaDonTheoDong {
  const moi = doHoaDonTheoDong(dong);
  const cu = doHoaDonTuVanBan(vanBan);
  const soHoaDon = moi.soHoaDon ?? cu.soHoaDon;
  const ngayHoaDon = moi.ngayHoaDon ?? cu.ngayHoaDon;
  const canhBao = moi.canhBao ?? cu.canhBao;
  const soTien = moi.soTien ?? (canhBao ? undefined : cu.soTien);
  const daDoc: string[] = [];
  if (soHoaDon) daDoc.push("số hoá đơn");
  if (ngayHoaDon) daDoc.push("ngày");
  if (soTien !== undefined) daDoc.push("số tiền");
  return { ...moi, soHoaDon, ngayHoaDon, soTien, canhBao, daDoc };
}
