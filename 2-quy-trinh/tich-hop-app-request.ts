// ============================================================
// LIÊN KẾT VỚI APP REQUEST — QUY TẮC BIẾN ĐỔI DỮ LIỆU
//
// Việc 1 (Sếp chốt 19/08/2026): App Thu mua nhận TẤT CẢ đề xuất đã duyệt từ App Request —
// cả đề xuất gắn công trình VÀ đề xuất riêng của một phòng ban (không gắn công trình nào).
// Khác App Kho (QLK CTR): Thu mua KHÔNG so khớp/gate theo công trình, nhận nguyên trạng.
//
// Hàm ở đây đều là HÀM THUẦN (không đụng Firestore, không đụng giao diện) — để test được
// độc lập và để route handler (`app/api/app-request/de-nghi-moi/route.ts`) gọi vào.
// ============================================================

import { maPhongBanTuTen, type MaPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";
import type { LoaiHoSoDeNghi } from "@/3-du-lieu/kieu-du-lieu";
import { boDau } from "@/6-tien-ich/bo-dau";

export interface CongTrinhTuChuoi {
  maHopDongCDT?: string;
  tenCongTrinh: string;
}

/**
 * Tách chuỗi công trình App Request gửi (quy ước "Mã hợp đồng - Tên công trình", vd
 * `"30/2025/HĐXD/UNICE-HPCS - UNICE QUẢNG NGÃI"`) thành 2 phần.
 *
 * Trả `null` nếu chuỗi rỗng — đây CHÍNH LÀ dấu hiệu "đề xuất của một phòng ban, không gắn
 * công trình nào" mà Sếp mô tả, KHÔNG coi là lỗi.
 *
 * ⚠️ Tách theo `" - "` (có khoảng trắng hai bên) — KHÔNG tách theo dấu `-` trần, vì mã hợp
 * đồng thật có thể chứa dấu gạch ngang riêng (vd `UNICE-HPCS`). Chỉ tách ở lần gặp `" - "`
 * ĐẦU TIÊN — tên công trình phía sau vẫn được giữ nguyên dù có chứa `" - "` khác.
 *
 * ════════════════════════════════════════════════════════════════════════════════════
 * ★ PHẦN MỞ RỘNG 13/09/2026 — NHẬN THÊM DẤU THANH ĐỨNG `|`
 *
 * 🔴 CHỈ THÊM, KHÔNG XOÁ. Chỉ đạo Sếp 13/09/2026: *"không được xoá dòng của phiên tích
 * hợp, e chỉ được mở rộng thôi"*. Nên mọi dòng của phiên tích hợp phía trên và phía dưới
 * đều còn nguyên từng ký tự; phần thêm là một khối `if` đứng TRƯỚC, và khi không khớp thì
 * rơi xuống đúng mã gốc của họ.
 *
 * VÌ SAO CẦN: App Request gửi đề nghị `000000078` với chuỗi
 *     "26002/HDXD | Nhà xưởng Howell"
 * — dùng THANH ĐỨNG chứ không phải gạch ngang. Mã gốc chỉ biết `" - "` nên không tách
 * được, dồn NGUYÊN CẢ CHUỖI vào "Tên công trình" và để "Số hợp đồng CĐT" trống. Ban lãnh
 * đạo phát hiện trên màn hình: *"chỗ này sao lại bị gộp tên hđ với tên công trình vậy"*.
 *
 * 📌 `|` tách kể cả khi KHÔNG có khoảng trắng (`"A|B"`) — khác luật của `" - "`, và cố ý:
 * thanh đứng gần như không bao giờ nằm trong mã hợp đồng hay tên công trình, nên nhận rộng
 * là an toàn. Còn dấu `-` thì vẫn phải có khoảng trắng hai bên — **luật đó là của phiên
 * tích hợp, không đụng tới**, vì mã hợp đồng thật có gạch ngang bên trong (`UNICE-HPCS`).
 *
 * ⚠️ Vẫn lấy dấu xuất hiện SỚM NHẤT — điều kiện `viTriOng < viTriGachCu` ở dưới giữ đúng
 * điều đó, vì mã hợp đồng luôn đứng trước. `"A - B | C"` vẫn tách ở `" - "` như cũ.
 *
 * 🔴 KHÔNG NHẬN `–` (en dash) VÀ `—` (em dash) — ĐÃ THỬ RỒI BỎ cùng ngày. Lý do thêm chúng
 * là "Word/Excel tự đổi `-` thành chúng"; lý do bỏ mạnh hơn hẳn: gạch dài là dấu NGẮT CÂU
 * thông dụng trong tên tiếng Việt. Quét dữ liệu thật bắt được ngay một ca:
 *     "Nhà xưởng ABC — Giai đoạn 2"
 * nhận `—` là cắt thành mã hợp đồng `"Nhà xưởng ABC"` + tên `"Giai đoạn 2"` — sai hoàn
 * toàn, và sai IM LẶNG. Chưa từng thấy App Request gửi gạch dài làm dấu ngăn; đừng thêm
 * lại khi chưa có ca thật.
 * ════════════════════════════════════════════════════════════════════════════════════
 */
export function tachCongTrinhTuChuoi(congTrinhChuoi: string | undefined | null): CongTrinhTuChuoi | null {
  const chuoi = congTrinhChuoi?.trim();
  if (!chuoi) return null;

  /* ★ THÊM 13/09/2026 — nhánh dấu `|`. Không khớp thì rơi xuống mã gốc bên dưới, nguyên vẹn. */
  const viTriOng = chuoi.indexOf("|");
  const viTriGachCu = chuoi.indexOf(" - ");
  if (viTriOng !== -1 && (viTriGachCu === -1 || viTriOng < viTriGachCu)) {
    const maTheoOng = chuoi.slice(0, viTriOng).trim();
    const tenTheoOng = chuoi.slice(viTriOng + 1).trim();
    return { maHopDongCDT: maTheoOng || undefined, tenCongTrinh: tenTheoOng || chuoi };
  }

  const viTri = chuoi.indexOf(" - ");
  if (viTri === -1) return { tenCongTrinh: chuoi };

  const maHopDongCDT = chuoi.slice(0, viTri).trim();
  const tenCongTrinh = chuoi.slice(viTri + 3).trim();
  return { maHopDongCDT: maHopDongCDT || undefined, tenCongTrinh: tenCongTrinh || chuoi };
}

/**
 * ★★ CHUẨN HOÁ Ô "LỰA CHỌN ĐỀ NGHỊ" của App Request → mã loại hồ sơ của Thu mua.
 *
 * 🔴🔴 TỆP NÀY THUỘC VÙNG CẤM SỬA CỦA PHIÊN TÍCH HỢP APP TỔNG (CLAUDE.md §6.6, chỉ đạo Sếp
 * 20/08/2026). Hàm này do PHIÊN NGHIỆP VỤ THU MUA thêm, **có phép riêng của Sếp ngày 15/09/2026**
 * (*"A đã báo rồi, e sửa đi"*). THUẦN THÊM MỘT HÀM MỚI: không đổi, không xoá dòng nào của họ —
 * `tachCongTrinhTuChuoi`, `xacDinhMaDuAnTamThoi`, `quyDoiPhongBan` còn nguyên từng ký tự.
 *
 * 🔴 ĐẶT Ở ĐÂY CHỨ KHÔNG VIẾT THẲNG TRONG ROUTE: đúng lời hứa ở đầu tệp — *"Hàm ở đây đều là HÀM
 * THUẦN … để test được độc lập và để route handler gọi vào"*. Nhờ vậy `kiem-luat-dung-chung.mjs`
 * gọi thật được hàm này, thay vì `grep` một chuỗi trong route (CLAUDE.md §6.6: grep không bắt được
 * việc xoá logic).
 *
 * CHUẨN HOÁ BA THỨ, vì dữ liệu thật đã cho thấy cả ba đều lệch:
 *   ① khoảng trắng thừa/kép → gom về một dấu cách;
 *   ② hoa/thường → đo được **hai cách viết cùng tồn tại**: `"Đề nghị công trình"` và
 *      `"Đề nghị Công trình"`;
 *   ③ dấu tiếng Việt → bỏ qua `boDau`, để nhãn gõ thiếu dấu (hoặc mã máy `cong_trinh`) vẫn nhận ra.
 *
 * 🔴 KHÔNG ĐOÁN BỪA — trả `undefined` trong CẢ HAI ca mập mờ:
 *   · không khớp nhãn nào (App Request đổi nhãn, hoặc gửi rác);
 *   · khớp CẢ HAI nhãn cùng lúc (vd *"Đề nghị công trình và phòng ban"*) — không biết chọn cái nào
 *     thì phải nói là không biết, để tầng dự phòng ở `ho-so-phong-ban.ts` xử.
 * `undefined` nghĩa là **CHƯA BIẾT**, không phải "công trình".
 *
 * 📌 KHÔNG ĐỤNG `xacDinhMaDuAnTamThoi`: nó sinh `maDuAn` — KHOÁ tự động khớp PO đã lập trước
 * (`app/api/app-request/de-nghi-moi/route.ts`) và là phần đầu của mã hồ sơ đã phát hành. Đổi nó
 * là đổi mã của hồ sơ cũ lẫn mới, rủi ro lớn hơn nhiều so với việc nó đặt tiền tố `"PB-"` chưa
 * chính xác. Việc nhận diện phòng ban nay do trường `loaiHoSo` lo, không cần đọc `maDuAn` nữa.
 */
export function chuanHoaLoaiHoSo(giaTri: string | undefined | null): LoaiHoSoDeNghi | undefined {
  const tho = (giaTri ?? "").trim();
  if (!tho) return undefined;

  /* `boDau` bỏ dấu + hạ chữ thường sẵn. Đổi `_`/`-` thành dấu cách để mã máy `cong_trinh` và
     nhãn người đọc `Đề nghị công trình` cùng về một khuôn; gom mọi khoảng trắng về một dấu cách. */
  const chuan = boDau(tho).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  const coPhongBan = chuan.includes("phong ban");
  const coCongTrinh = chuan.includes("cong trinh");
  if (coPhongBan && coCongTrinh) return undefined;
  if (coPhongBan) return "phong_ban";
  if (coCongTrinh) return "cong_trinh";
  return undefined;
}

/**
 * ★★ ĐỌC LOẠI ĐỀ NGHỊ TỪ CHÍNH HỒ SƠ BÊN APP REQUEST (document `requests/{id}`).
 *
 * 🔴🔴 Thêm 15/09/2026, **có phép riêng của Sếp** (vùng cấm §6.6). Nguyên văn chỉ đạo Sếp:
 * *"API của app request e đã có rồi, e chỉ cần link thêm trường phòng ban đó là xong mà"* — tức
 * KHÔNG ngồi chờ đội App Request sửa phần gửi, mà tự đọc sang.
 *
 * 🔴 TRA THEO `options`, TUYỆT ĐỐI KHÔNG TRA THEO MÃ TRƯỜNG. Mã trường bên App Request là UUID và
 * **đổi theo từng đời biểu mẫu** — đã đo ba mã khác nhau cho cùng một ô "Lựa chọn đề nghị"
 * (`e08076bf-…`, `12cb9ca6-…`, `79590aee-…`). Viết cứng một mã là hôm nào họ phát hành biểu mẫu
 * mới thì app lặng lẽ đọc hụt, không một dòng báo lỗi. Nên phải đi tìm ô nào có `options` chứa
 * ĐỦ CẢ HAI lựa chọn *"Đề nghị công trình"* và *"Đề nghị phòng ban"* — đó mới là ô cần đọc.
 *
 * ✅ ĐÃ ĐO TRÊN DỮ LIỆU THẬT 15/09/2026 (16 đề nghị đang có trên kho chung): đọc ra loại
 * **16/16 phiếu**, khớp **16/16** với phép suy `maHopDongCDT` rỗng, **lệch 0**. Ba phiếu ra
 * "phòng ban" là `000000089`, `000000090`, `000000091` — đúng ba phiếu Sếp chỉ ra.
 *
 * 📌 HÀM THUẦN, KHÔNG GỌI MẠNG. Nó chỉ nhận dữ liệu document đã đọc về (route lo phần kết nối),
 * nhờ vậy `kiem-luat-dung-chung.mjs` gọi thật được để canh luật này.
 *
 * 📌 KHÂU CUỐI GỌI LẠI `chuanHoaLoaiHoSo` — một luật một chỗ: hoa/thường, dấu cách thừa, thiếu
 * dấu tiếng Việt và ca mập mờ (chuỗi chứa cả hai nhãn) đều đã xử ở đó, không chép lại lần hai.
 *
 * ⚠️ Trả `undefined` cho MỌI ca không chắc: không có `fieldsSnapshot`, không tìm ra ô nào,
 * người dùng bỏ trống ô. Nơi gọi phải rơi về phép suy dự phòng, không được coi là "công trình".
 */
export function layLoaiTuHoSoAppRequest(
  hoSo: { fieldsSnapshot?: unknown; values?: unknown } | null | undefined,
): LoaiHoSoDeNghi | undefined {
  const fields = Array.isArray(hoSo?.fieldsSnapshot) ? (hoSo.fieldsSnapshot as unknown[]) : [];
  const values = (hoSo?.values ?? {}) as Record<string, unknown>;

  for (const f of fields) {
    const o = (f ?? {}) as { id?: unknown; options?: unknown };
    const ops = Array.isArray(o.options) ? o.options.map(String) : [];
    const laOLuaChon =
      ops.some((x) => /đề nghị\s*công trình/i.test(x)) &&
      ops.some((x) => /đề nghị\s*phòng ban/i.test(x));
    if (!laOLuaChon) continue;

    const v = values[String(o.id)];
    return typeof v === "string" ? chuanHoaLoaiHoSo(v) : undefined;
  }
  return undefined;
}

/**
 * ⚠️ ĐIỂM CÒN TREO, ĐÃ BÁO SẾP (chưa có câu trả lời khác): App Request không có danh mục
 * "mã dự án ngắn" chuẩn Thông báo 09/2026 (vd `260001-HPCS`) — chỉ có chuỗi tự do. Đang tạm
 * dùng THẲNG phần mã hợp đồng tách được (hoặc cả chuỗi, nếu không tách được) làm "mã dự án"
 * để app còn có cái đặt số hồ sơ. Sếp có nguồn mã dự án ngắn chuẩn ở đâu thì đổi lại chỗ NÀY
 * — một chỗ duy nhất, không phải sửa route handler.
 */
export function xacDinhMaDuAnTamThoi(congTrinh: CongTrinhTuChuoi | null, maPhongBan: MaPhongBan): string {
  if (!congTrinh) return `PB-${maPhongBan}`;
  return congTrinh.maHopDongCDT || congTrinh.tenCongTrinh;
}

/**
 * Quy đổi tên phòng ban tự do (từ field "Chọn bộ phận" bên App Request) sang mã phòng ban
 * chuẩn của Thu mua. Không khớp được thì GIỮ NGUYÊN chuỗi gốc — `MaPhongBan` là kiểu mở
 * (`string`), nên phòng ban lạ vẫn lưu được, chỉ là chưa có nhãn đẹp trong `nhanPhongBan()`.
 */
export function quyDoiPhongBan(tenPhongBanTuAppRequest: string | undefined | null): MaPhongBan {
  const ten = tenPhongBanTuAppRequest?.trim();
  if (!ten) return "";
  return maPhongBanTuTen(ten) ?? ten;
}
