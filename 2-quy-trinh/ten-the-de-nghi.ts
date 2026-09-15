// ════════════════════════════════════════════════════════════════════════════════════════
// TÊN HIỂN THỊ CỦA MỘT ĐỀ NGHỊ TRÊN THẺ BẢNG QUY TRÌNH
//
// 🔴 TỆP NÀY SINH RA TỪ MỘT LỖI ĐO ĐƯỢC — Sếp 15/09/2026, ảnh chụp bảng kanban bản chạy thật,
// nguyên văn: *"khi nhân bản thì tên tiêu đề này cũng phải hiển thị luôn chư (copy..) hiện tại
// phải bấm vào chỉnh sửa thông tin thì nó mới hiện"*.
//
// Trong ảnh, cột "Yêu cầu NCC báo giá" có HAI thẻ tiêu đề giống hệt nhau
// (`000000086 - 2026/HDXD - DỰ ÁN TEST`), một trong hai là bản nhân bản — không cách nào phân
// biệt bằng mắt.
//
// NGUYÊN NHÂN ĐO ĐƯỢC (không phải suy đoán): dữ liệu ĐÚNG — `tieuDe` của bản sao có sẵn đuôi
// `(copy N)` do `tenBanSaoTheoMa` ghi vào. Chính chỗ HIỂN THỊ đã **cố ý cắt đuôi đó đi**, với lý
// do ghi trong chú thích: *"mã trên dòng đầu thẻ đã mang sẵn (copy)"*. Lý do đó chỉ đúng khi dòng
// đầu in `deNghi.code`. Hồ sơ đến từ App Request thì dòng đầu in `maDeXuatAppRequest` —
// **mã này của bản sao TRÙNG HỆT phiếu gốc** (xem `app/api/app-request/de-nghi-moi/route.ts`,
// chú thích *"phiếu nhân bản mang CÙNG mã đề xuất"*). Vậy là đuôi bị cắt mà không có gì bù lại.
//
// 👉 Nay chỉ cắt đuôi khi mã in ở dòng đầu THẬT SỰ đã mang đuôi đó.
//
// ⚠️ ĐÂY LÀ TÊN HIỂN THỊ, KHÔNG PHẢI MÃ HỒ SƠ. Mã hồ sơ bám Thông báo 09/2026 (CLAUDE.md §3.1)
// và không được nhét đuôi gì vào — đuôi `(copy N)` trong `code` là do `maBanSaoTiepTheo` đặt từ
// 13/08/2026 theo đúng ví dụ Ban lãnh đạo đưa, tệp này không đụng tới.
//
// 📌 ĐẶT Ở `2-quy-trinh/` chứ không cạnh thẻ, dù đây là việc định dạng chữ: có vậy
// `kiem-luat-dung-chung.mjs` mới GỌI THẬT được (chú thích không chạy được, nên không lừa được
// phép gọi hàm — xem đầu tệp bài kiểm). Chính chú thích cũ cạnh thẻ đã dặn *"nếu màn hình khác
// cũng cần thì dời sang 2-quy-trinh/, đừng chép lần hai"*.
// ════════════════════════════════════════════════════════════════════════════════════════

import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/** Đuôi bản sao trong TÊN và trong MÃ — `(copy)`, `(copy 2)`, `(copy 12)`… */
const DUOI_BAN_SAO = /\(copy(?: \d+)?\)\s*$/i;

/**
 * Mã in ở ĐẦU thẻ. Hồ sơ từ App Request dùng mã đề xuất của họ; phiếu lập tay trong app lùi về
 * mã hồ sơ.
 *
 * 🔴 Ban lãnh đạo 21/08/2026 đã cho gỡ mã hồ sơ của app khỏi thẻ, và 20/08 đã bác việc để
 * `deNghi.code` ở đầu (mã đó chứa luôn số hợp đồng nên đọc ra như in lặp). Đừng đổi thứ tự hai
 * vế này.
 */
export function maDauTheDeNghi(deNghi: DeNghiMuaHang): string {
  return deNghi.maDeXuatAppRequest || deNghi.code;
}

/**
 * ★★ PHẦN TÊN ĐỀ XUẤT CÒN LẠI SAU KHI TRỪ NHỮNG MẢNH DÒNG ĐẦU THẺ ĐÃ IN — 13/09/2026.
 *
 * 🔴 YÊU CẦU — Ban lãnh đạo 13/09/2026, nguyên văn: *"Hiển thị thêm các chữ phía sau, vì sẽ có
 * trường hợp đổi tên đề xuất cho dễ nhớ nên cần hiển thị thêm các nội dung hiển thị đó"*.
 * Chữ **"thêm"**: giữ nguyên phần thẻ đang có, chỉ bổ sung tên đề xuất vào.
 *
 * ⚠️ VÌ SAO KHÔNG IN THẲNG `deNghi.tieuDe`. Với Phòng Thi công, tiêu đề do app **tự sinh** theo
 * công thức ở `2-quy-trinh/dat-ten-de-nghi.ts` → `dungTenDeNghi()`, và công thức đó ghép đúng ba
 * mảnh mà dòng đầu thẻ đang in:
 *
 *     mã đề nghị  -  mã hợp đồng CĐT,  TÊN CÔNG TRÌNH
 *
 * Nên phiếu mẫu hiện có tiêu đề `260001-HPCS-PR-001 - 260001-HPCS-HDXD-001, CÔNG TRÌNH CHIEN YI`
 * — in thẳng là thẻ đọc ra **hai lần cùng một chuỗi**, tốn thêm hai dòng trên một thẻ chỉ rộng
 * ~240px mà không nói thêm được chữ nào.
 *
 * 👉 CÁCH CHỌN: trừ khỏi tiêu đề đúng những mảnh dòng đầu ĐÃ in, còn lại chữ gì thì in chữ đó.
 *   · Tiêu đề tự sinh, chưa ai đổi → trừ xong không còn gì → **ẩn hẳn dòng**, không in nhãn trơ.
 *   · Tiêu đề đã đổi tay (đúng ca Sếp nói: *"đổi tên đề xuất cho dễ nhớ"*) → phần người dùng gõ
 *     thêm luôn còn lại → in ra.
 *
 * 🔴 TRỪ CẢ `code` (mã hồ sơ của app) dù dòng đầu có thể đang in `maDeXuatAppRequest` thay cho nó:
 * mã hồ sơ đã được Ban lãnh đạo cho gỡ khỏi thẻ ngày 21/08/2026. Để nó lọt lại qua đường tiêu đề
 * là lén đưa về bằng cửa sau.
 *
 * ⚠️ CÁI GIÁ / CHỖ CHƯA CHẮC — ghi ra để người sau cân lại chứ không giấu:
 *   · Chỉ trừ **lần xuất hiện đầu** của mỗi mảnh. Tên tự gõ mà cố ý nhắc tên công trình lần hai
 *     thì lần hai vẫn hiện — chấp nhận, vì đó là chữ người dùng chủ động viết.
 *   · **Bỏ qua mảnh ngắn dưới 3 ký tự.** Mảnh quá ngắn (vd mã đề xuất `12`) dễ khớp nhầm vào giữa
 *     một từ và xén mất chữ của người dùng. Thà lặp một mã ngắn còn hơn cắt sai tên.
 *   · Cắt một mảnh ở giữa câu có thể để lại chữ nối cụt (`"Vật tư đợt 4 cho"`). Hiếm, và vẫn đọc
 *     ra nghĩa, nên không cố đoán thêm — đoán sai còn tệ hơn.
 */
export function phanThemCuaTieuDe(deNghi: DeNghiMuaHang): string {
  let con = (deNghi.tieuDe ?? "").trim();
  if (!con) return "";

  /**
   * ⚠️ BẢN NHÂN BẢN CẦN THÊM MỘT MẢNH NỮA. Mã bản tách là `…PR-001 (copy)` (xem
   * `2-quy-trinh/nhan-ban-de-nghi.ts` → `maBanSaoTiepTheo`), nhưng tiêu đề của nó là tiêu đề CHA
   * cộng đuôi — tức bên trong tiêu đề chỉ có `…PR-001` trơn, KHÔNG kèm `(copy)`. So cả mã có đuôi
   * thì không khớp một ký tự nào, và mã hồ sơ cha lọt nguyên lên thẻ — đúng thứ Ban lãnh đạo đã
   * cho gỡ ngày 21/08/2026. Nên trừ thêm mã đã bỏ đuôi.
   */
  const maBanSao = (deNghi.code ?? "").trim();
  const maGoc = maBanSao.replace(/\s*\(copy(?: \d+)?\)$/i, "").trim();

  /* Sắp mảnh DÀI trước. `260001-HPCS-HDXD-001` phải được trừ trọn vẹn trước khi tới lượt mảnh
     ngắn hơn; trừ ngược thứ tự thì mảnh ngắn cắt vào giữa mảnh dài và để lại rác kiểu `-001`. */
  const daInODongDau = [
    deNghi.maDeXuatAppRequest,
    maBanSao,
    maGoc,
    deNghi.maHopDongCDT,
    deNghi.tenCongTrinh,
  ]
    .map((x) => (x ?? "").trim())
    .filter((x) => x.length >= 3)
    .sort((a, b) => b.length - a.length);

  for (const manh of daInODongDau) {
    /* So KHÔNG phân biệt hoa thường: dòng đầu thẻ in tên công trình IN HOA (`toUpperCase()`),
       còn tiêu đề giữ nguyên chữ người lập gõ — so thẳng thì không bao giờ khớp, và dòng lặp
       vẫn hiện y như chưa làm gì. */
    const viTri = con.toLowerCase().indexOf(manh.toLowerCase());
    if (viTri >= 0) con = con.slice(0, viTri) + con.slice(viTri + manh.length);
  }

  /**
   * ★★ ĐUÔI `(copy N)` — CHỈ CẮT KHI MÃ Ở DÒNG ĐẦU ĐÃ MANG SẴN NÓ. Sửa 15/09/2026 theo Sếp
   * (*"khi nhân bản thì tên tiêu đề này cũng phải hiển thị luôn chư (copy..)"*).
   *
   * 🔴 BẢN TRƯỚC CẮT VÔ ĐIỀU KIỆN, và đó là gốc của lỗi hai thẻ giống hệt nhau. Lý lẽ cũ —
   * *"mã trên dòng đầu thẻ đã mang sẵn (copy), nói lần nữa là chiếm một dòng của thẻ hẹp"* — chỉ
   * đúng cho phiếu LẬP TAY, vì lúc đó dòng đầu in `deNghi.code` (có đuôi `(copy)`). Hồ sơ đến từ
   * App Request thì dòng đầu in `maDeXuatAppRequest`, mà mã đó của bản sao **trùng hệt phiếu
   * gốc** — cắt đuôi là xoá nốt dấu hiệu phân biệt CUỐI CÙNG trên thẻ.
   *
   * 📌 Phải bắt bằng regex chứ không cắt theo mã: mã ghi `(copy)` nhưng tiêu đề ghi `(copy 1)`
   * (`tenBanSaoTheoMa` đổi số 1 cho đủ cặp), so thẳng hai chuỗi đó là trượt.
   */
  if (DUOI_BAN_SAO.test(maDauTheDeNghi(deNghi).trim())) {
    con = con.replace(/\s*\(copy(?: \d+)?\)\s*$/i, "");
  }

  /* Dọn dấu nối trơ do vừa cắt bỏ: gộp chuỗi dấu dính nhau (`" - , "`) thành một, rồi cắt dấu ở
     hai đầu. 🔴 KHÔNG thay mọi dấu trong câu — tên tự gõ có quyền chứa dấu gạch ("đợt 4 - lần 2"),
     quét sạch là làm hỏng chữ của người dùng. Dấu `-` đặt CUỐI lớp ký tự để không thành dải. */
  con = con
    .replace(/\s+/g, " ")
    .replace(/(\s*[,;:|·–—-]\s*){2,}/g, " - ")
    .replace(/^[\s,;:|·–—-]+/, "")
    .replace(/[\s,;:|·–—-]+$/, "")
    .trim();

  /* Còn lại toàn dấu câu thì coi như không còn gì. Đòi ít nhất 2 ký tự có nghĩa: một ký tự lẻ sót
     lại là rác, in ra chỉ làm người đọc tưởng dữ liệu hỏng.
     ⚠️ NGƯỠNG NÀY NAY CÒN CANH CẢ ĐUÔI BẢN SAO: với hồ sơ App Request, phần còn lại có thể chỉ
     là `(copy 4)` — siết ngưỡng lên là xoá mất dấu hiệu duy nhất phân biệt bản sao trên thẻ. */
  const kyTuCoNghia = con.replace(/[\s.,;:|·–—-]/g, "");
  return kyTuCoNghia.length >= 2 ? con : "";
}

/**
 * Hai mảnh chữ của dòng tiêu đề thẻ: `ma` (tô màu chủ đạo, `select-all`) và `phanSau` (phần còn
 * lại, đã kèm dấu nối). Tách đôi vì thẻ tô màu riêng cho mã.
 *
 * ★ Khuôn bám đúng ảnh bảng Base Ban lãnh đạo gửi 21/08/2026 (*"bố cục giống vậy"*):
 *
 *     2975818 - 01/2026/HĐXD-HPCS - NHÀ MÁY HOWELL - <tên tự đặt>
 *     └ mã đề xuất   └ số hợp đồng      └ tên công trình
 */
export function manhTenTheDeNghi(deNghi: DeNghiMuaHang): { ma: string; phanSau: string } {
  const them = phanThemCuaTieuDe(deNghi);
  return {
    ma: maDauTheDeNghi(deNghi),
    phanSau:
      (deNghi.maHopDongCDT ? ` - ${deNghi.maHopDongCDT}` : "") +
      (deNghi.tenCongTrinh ? ` - ${deNghi.tenCongTrinh.toUpperCase()}` : "") +
      (them ? ` - ${them}` : ""),
  };
}

/** Cả dòng tiêu đề thẻ, ghép sẵn — dùng cho bài kiểm và cho chỗ nào cần một chuỗi (tooltip, tìm
 *  kiếm). Giao diện thẻ dùng `manhTenTheDeNghi` để tô màu riêng phần mã. */
export function tenTheDeNghi(deNghi: DeNghiMuaHang): string {
  const { ma, phanSau } = manhTenTheDeNghi(deNghi);
  return ma + phanSau;
}
