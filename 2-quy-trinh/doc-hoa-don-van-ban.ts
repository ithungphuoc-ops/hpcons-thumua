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
