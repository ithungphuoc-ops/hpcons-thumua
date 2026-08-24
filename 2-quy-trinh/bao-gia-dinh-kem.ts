// ============================================================
// LUẬT SỐ BẢN BÁO GIÁ PHẢI ĐÍNH KÈM — MỘT CHỖ DUY NHẤT
//
// 🔴 Ban lãnh đạo 20/08/2026: *"khi yêu cầu 2 báo giá thì phải có 2 mục đính kèm báo giá, và đó
// là quy tắc bắt buộc để được chuyển bước"*.
//
// 🔴 VÌ SAO LÀ HÀM THUẦN Ở `2-quy-trinh/`: luật này được hỏi ở BA NƠI —
//   ① khu đính kèm bước ② (vẽ bao nhiêu ô),
//   ② nút "Trình xét duyệt báo giá" (khóa hay mở, kèm lý do),
//   ③ tầng ghi `trinhXetDuyetBaoGia` (chặn thật, vì nút có thể bị đi vòng).
// Chép điều kiện ra ba chỗ là kiểu lỗi tệ nhất: nút mở mà tầng ghi từ chối, hoặc nút khóa mà
// đường khác vẫn trình được — và không có gì báo cho tới khi hồ sơ đã đi tiếp.
// ============================================================

import { TOI_DA_TEP_MOI_BUOC } from "@/3-du-lieu/gioi-han-dinh-kem";
import type { DeNghiMuaHang, MoTaTep } from "@/3-du-lieu/kieu-du-lieu";
import type { CauHinhQuyTrinh } from "@/2-quy-trinh/cau-hinh-quy-trinh";

/** Bước giữ bản báo giá nhà cung cấp — nơi nhân viên dán tệp vào. */
export const BUOC_DINH_KEM_BAO_GIA = "yeu_cau_bao_gia";

/**
 * ★ SỐ Ô BÁO GIÁ TỐI ĐA — **chừa một suất cho bảng so sánh**.
 *
 * 🔴 VÌ SAO PHẢI TRỪ 1: từ 20/08/2026 Ban lãnh đạo chốt bảng so sánh là **bắt buộc**. Mỗi bước chỉ
 * giữ được `TOI_DA_TEP_MOI_BUOC` tệp, nên nếu cho phép tối đa đúng bằng con số đó thì hồ sơ đặt
 * SL Báo giá = 5 sẽ cần 5 bản + 1 bảng so sánh = 6 tệp → tầng ghi từ chối tệp thứ sáu, điều kiện
 * chuyển bước **không bao giờ thỏa**, và phiếu **kẹt vĩnh viễn** ở bước ②.
 *
 * Chặn ngay ở đây thay vì để người dùng gặp bế tắc rồi mới hiểu ra.
 */
export const TOI_DA_O_BAO_GIA = TOI_DA_TEP_MOI_BUOC - 1;

/**
 * Nhãn ghi chú đánh dấu ô báo giá thứ `i` (đếm từ 0).
 *
 * 📌 App giữ tệp mỗi bước thành MỘT DANH SÁCH, không có khái niệm "ô số 1, ô số 2". Để dựng các
 * ô có tên mà không phải đổi cấu trúc dữ liệu, mỗi ô đánh dấu tệp của mình bằng **ghi chú tệp** —
 * ghi chú vốn đã là chỗ ghi nhãn cho chứng từ.
 */
export function nhanOBaoGia(i: number, tenNCC?: string): string {
  const ten = (tenNCC ?? "").trim();
  return ten === "" ? `Báo giá NCC ${i + 1}` : `Báo giá NCC ${i + 1}${DAU_NOI_TEN_NCC}${ten}`;
}

/**
 * Dấu nối giữa số hiệu ô và tên nhà cung cấp trong nhãn.
 *
 * 🔴 DÙNG GẠCH NGANG DÀI CÓ KHOẢNG TRẮNG HAI BÊN, không dùng dấu `-` thường: tên nhà cung cấp
 * hoàn toàn có thể chứa `-` (*"Thép Việt - Nhật"*), và khi đó tách nhãn theo `-` sẽ cắt mất một
 * phần tên. Chuỗi này gần như không xuất hiện trong tên công ty.
 */
const DAU_NOI_TEN_NCC = " — ";

/**
 * Đọc số hiệu ô từ ghi chú tệp. Trả `0` khi ghi chú không phải nhãn ô nào.
 *
 * ⚠️ Phải khớp CHÍNH XÁC dạng `nhanOBaoGia` sinh ra. Nới lỏng thành "có chứa chữ báo giá" là ghi
 * chú người dùng tự gõ (*"báo giá bên A rẻ hơn"*) bị hiểu thành nhãn ô, tệp nhảy sang chỗ khác.
 *
 * 📌 Phần tên nhà cung cấp sau dấu nối là TÙY CÓ — nhãn cũ (`Báo giá NCC 1`) vẫn đọc được đúng,
 * nên hồ sơ đã đính tệp trước 20/08/2026 không bị rơi ra khỏi ô của nó.
 */
export function chiSoOBaoGia(ghiChu: string | undefined): number {
  const khop = (ghiChu ?? "").trim().match(/^Báo giá NCC (\d+)(?: — .+)?$/);
  return khop ? Number(khop[1]) : 0;
}

/**
 * ★ Đọc TÊN NHÀ CUNG CẤP từ nhãn ô — Ban lãnh đạo 20/08/2026: *"mục này đính kèm của NCC nào thì
 * phải để ngay bên cạnh nút đính kèm đó để tránh nhầm lẫn"*.
 *
 * Trả `""` khi nhãn không có phần tên (hồ sơ cũ, hoặc người dùng chưa ghi).
 *
 * 🔴 LƯU TÊN VÀO CHÍNH NHÃN, không thêm trường mới vào kiểu dữ liệu: cả phòng đang chạy thử trên
 * một document Firestore, thêm trường là dữ liệu cũ thiếu trường đó và mọi chỗ đọc phải phòng
 * `undefined`. Nhãn thì đã là chỗ ghi chú cho tệp, và mở rộng cách đọc thì hồ sơ cũ vẫn đúng.
 */
export function tenNCCCuaO(ghiChu: string | undefined): string {
  const khop = (ghiChu ?? "").trim().match(/^Báo giá NCC \d+ — (.+)$/);
  return khop ? khop[1].trim() : "";
}

/**
 * ★ CẦN BAO NHIÊU BẢN BÁO GIÁ cho phiếu này.
 *
 * Lấy số CAO NHẤT trong `items[].soBaoGiaYeuCau` — con số trưởng bộ phận đặt lúc giao việc ở
 * bước ①.
 *
 * 🔴 LẤY MAX, KHÔNG LẤY DÒNG ĐẦU hay số nhỏ nhất: trưởng bộ phận có thể đòi dòng thép 3 báo giá
 * còn dòng cát 2 báo giá. Đòi theo số nhỏ hơn là bỏ qua yêu cầu chặt nhất của chính người giao
 * việc — mà đó thường là dòng có giá trị lớn nhất.
 *
 * 🔴🔴 KHÔNG ĐẶT RIÊNG THÌ RƠI VỀ `cauHinh.soBaoGiaToiThieu` — sửa 24/08/2026.
 *
 * BẢN TRƯỚC TRẢ `0` khi không dòng nào đặt số, kèm chú thích *"chặn bằng một con số không ai đặt
 * ra là bắt người dùng đi tìm luật không tồn tại"*. Câu đó **sai ở một chỗ chết người**: con số đó
 * CÓ người đặt ra — chính là ô *"Số báo giá tối thiểu"* trong trang **Cài đặt quy trình**
 * (`cauHinh.soBaoGiaToiThieu`, mặc định 2).
 *
 * Hậu quả đo được: trưởng bộ phận giao việc mà để ô "Số báo giá yêu cầu" ở mục *"Không yêu cầu
 * riêng"* (ô đó KHÔNG bắt buộc) → `can = 0` → `vuongMacTrinhXetDuyet` trả `null` NGAY, bỏ qua cả
 * phép kiểm bảng so sánh. Hồ sơ **0 tệp báo giá, không bảng so sánh** vẫn trình xét duyệt được —
 * cả bằng nút lẫn bằng kéo thả. Tức **cấu hình quy trình của công ty bị vô hiệu hoàn toàn**.
 *
 * ⚠️ Và giao diện thì nói ngược lại: bảng phân bổ in *"Quy trình yêu cầu tối thiểu 02 báo giá"* —
 * app hứa một luật nó không áp, đúng thứ `CLAUDE.md` §3.5 cấm.
 *
 * 📌 Vẫn còn đường về `0`: đặt `soBaoGiaToiThieu = 0` ở trang Cài đặt. Khi đó KHÔNG chặn — nhưng
 * đó là một quyết định **có người bấm**, không phải hệ quả của việc bỏ trống một ô tuỳ chọn.
 */
export function soBaoGiaCanCo(deNghi: DeNghiMuaHang, cauHinh: CauHinhQuyTrinh): number {
  const so = deNghi.items
    .map((d) => d.soBaoGiaYeuCau)
    .filter((x): x is number => typeof x === "number" && x > 0);
  /* Đặt riêng cho dòng nào thì con số đó THẮNG cấu hình chung — trưởng bộ phận biết dòng nào cần
     hỏi kỹ hơn mức tối thiểu. */
  const canRieng = so.length === 0 ? 0 : Math.max(...so);
  const canChung = Math.max(0, Math.trunc(cauHinh.soBaoGiaToiThieu ?? 0));
  return Math.min(Math.max(canRieng, canChung), TOI_DA_O_BAO_GIA);
}

/** Tệp báo giá đang đính ở bước ②. */
export function tepBaoGiaDaCo(deNghi: DeNghiMuaHang): MoTaTep[] {
  return deNghi.tepGiaiDoan?.[BUOC_DINH_KEM_BAO_GIA] ?? [];
}

/**
 * ★ NHÃN Ô "BẢNG SO SÁNH BÁO GIÁ" — Ban lãnh đạo 20/08/2026: *"thêm trường đính kèm file so
 * sánh"*.
 *
 * Bảng so sánh nay làm NGOÀI app (Excel) rồi đính vào, vì app đã bỏ hẳn chức năng so sánh giá
 * nhập tay. Đây là ô riêng, KHÔNG tính vào số bản báo giá bắt buộc.
 *
 * 🔴 Nhãn phải KHÁC hẳn dạng `Báo giá NCC {n}` để `chiSoOBaoGia` không nhận nó là một ô báo giá —
 * nếu nhận thì tệp so sánh được đếm như một bản báo giá và điều kiện chuyển bước bị lách.
 */
export const NHAN_O_SO_SANH = "Bảng so sánh báo giá";

/** Tệp đang nằm ở ô "Bảng so sánh báo giá", `undefined` là chưa có. */
export function tepSoSanh(deNghi: DeNghiMuaHang): MoTaTep | undefined {
  return tepBaoGiaDaCo(deNghi).find((t) => (t.ghiChu ?? "").trim() === NHAN_O_SO_SANH);
}

/**
 * ★ BẢN BÁO GIÁ ĐÃ ĐƯỢC DUYỆT — đọc từ căn cứ duyệt mà trưởng bộ phận đã ghi.
 *
 * 🔴 Ban lãnh đạo 20/08/2026: *"hãy tạo đường link tới báo giá được chọn"* — bước ③ đang ghi
 * *"chưa có dữ liệu nhập vào"* trong khi đầu vào thật của nó chính là bản báo giá được chọn.
 *
 * Khi bấm "Duyệt bản này", căn cứ duyệt được ghi kèm tiền tố `[Báo giá NCC n]` (xem chỗ gọi
 * `chonNCCChoBaoGia` ở `trang/de-nghi-chi-tiet.tsx`). Hàm này đọc lại tiền tố đó rồi tra ra đúng
 * tệp của ô tương ứng ở bước ②.
 *
 * ⚠️ Trả `undefined` khi không đọc được — hồ sơ duyệt TRƯỚC 20/08/2026 không có tiền tố này, và
 * ô có thể đã bị thay tệp. Nơi gọi phải chịu được `undefined`, đừng giả định luôn có.
 *
 * 📌 Vì sao đọc từ chuỗi thay vì thêm trường mới: cả phòng đang chạy thử trên MỘT document, thêm
 * trường là dữ liệu cũ thiếu nó và mọi chỗ đọc phải phòng `undefined` — mà vẫn phải phòng như
 * vậy. Đọc từ dữ liệu đã có thì hồ sơ cũ dùng được ngay, không cần chuyển đổi gì.
 */
export function tepBaoGiaDaDuyet(
  deNghi: DeNghiMuaHang,
  canCuDuyet: string | undefined,
): { nhanO: string; tep: MoTaTep } | undefined {
  const khop = (canCuDuyet ?? "").trim().match(/^\[(Báo giá NCC (\d+))\]/);
  if (!khop) return undefined;
  const chiSo = Number(khop[2]);
  const tep = tepBaoGiaDaCo(deNghi).find((t) => chiSoOBaoGia(t.ghiChu) === chiSo);
  return tep ? { nhanO: khop[1], tep } : undefined;
}

/**
 * Số ô báo giá phải vẽ ra.
 *
 * 🔴 `max(số cần, số hiệu ô cao nhất đang có tệp)`: hạ SL Báo giá xuống mà ẩn mất ô đang giữ tệp
 * thì người dùng thấy chứng từ "bốc hơi" — tệp vẫn trong hồ sơ nhưng không còn ô nào hiện nó ra.
 */
export function soOBaoGia(deNghi: DeNghiMuaHang, cauHinh: CauHinhQuyTrinh): number {
  const can = soBaoGiaCanCo(deNghi, cauHinh);
  const daCo = tepBaoGiaDaCo(deNghi).reduce(
    (max, t) => Math.max(max, chiSoOBaoGia(t.ghiChu)),
    0,
  );
  return Math.min(Math.max(can, daCo), TOI_DA_O_BAO_GIA);
}

/**
 * ★ DANH SÁCH NHÀ CUNG CẤP ĐÃ CÓ BẢN BÁO GIÁ ĐÍNH KÈM — để trưởng bộ phận chọn khi duyệt.
 *
 * 🔴 Ban lãnh đạo 20/08/2026: *"bỏ quy trình so sánh báo giá đó đi, chỉ đính kèm file và trưởng
 * bộ phận chọn duyệt thôi"*, và sau đó bỏ luôn khối nhân viên tự đề xuất nhà cung cấp.
 * Vậy người quyết là trưởng bộ phận, và thứ họ chọn giữa là **các nhà cung cấp đã gửi báo giá** —
 * chính là tên ghi ở từng ô đính kèm.
 *
 * Trả về theo thứ tự ô (Báo giá NCC 1, 2, …), chỉ những ô ĐÃ CÓ TỆP và ĐÃ GHI TÊN.
 *
 * ⚠️ Ô có tệp mà chưa ghi tên thì KHÔNG đưa vào: duyệt cho một nhà cung cấp không tên thì đơn
 * hàng sau đó không có đối tượng, và không ai truy được đã duyệt cho ai.
 */
export function danhSachNCCDaBaoGia(
  deNghi: DeNghiMuaHang,
): { chiSoO: number; nhanO: string; tenNCC: string }[] {
  return tepBaoGiaDaCo(deNghi)
    .map((t) => ({
      chiSoO: chiSoOBaoGia(t.ghiChu),
      tenNCC: tenNCCCuaO(t.ghiChu),
    }))
    .filter((x) => x.chiSoO >= 1 && x.tenNCC !== "")
    .sort((a, b) => a.chiSoO - b.chiSoO)
    .map((x) => ({ ...x, nhanO: nhanOBaoGia(x.chiSoO - 1) }));
}

/**
 * ★ CÒN VƯỚNG GÌ KHÔNG CHO TRÌNH XÉT DUYỆT — `null` là đủ điều kiện.
 *
 * 🔴 Ban lãnh đạo 20/08/2026: đủ số bản báo giá là **điều kiện bắt buộc để chuyển bước**.
 *
 * ⚠️ TRẢ VỀ CÂU GIẢI THÍCH, không trả `boolean`. Nút khóa mà không nói còn thiếu gì là kiểu bí
 * việc khó chịu nhất — người dùng bấm mãi không được và chẳng biết phải làm gì.
 *
 * 📌 Đếm theo Ô CÓ TÊN (`Báo giá NCC 1..N`), không đếm tổng số tệp: dán 3 tệp vào ô số 1 không
 * phải là có 3 bản báo giá của 3 nhà cung cấp. Đếm tổng là mở đường lách đúng cái luật này.
 */
export function vuongMacTrinhXetDuyet(
  deNghi: DeNghiMuaHang,
  cauHinh: CauHinhQuyTrinh,
): string | null {
  const can = soBaoGiaCanCo(deNghi, cauHinh);
  if (can === 0) return null;

  const tep = tepBaoGiaDaCo(deNghi);
  const oDaCoTep = new Set(
    tep.map((t) => chiSoOBaoGia(t.ghiChu)).filter((n) => n >= 1 && n <= can),
  );
  const thieu = can - oDaCoTep.size;
  if (thieu > 0) {
    return `Quy trình yêu cầu ${can} bản báo giá, hiện còn thiếu ${thieu} bản. Đính kèm đủ ${can} ô “Báo giá NCC” ở bước “Yêu cầu NCC báo giá” trước khi trình.`;
  }

  /**
   * 🔴 BẢNG SO SÁNH LÀ BẮT BUỘC — Ban lãnh đạo 20/08/2026: *"mục này bắt buộc phải có"*.
   *
   * Xét SAU khi đã đủ số bản báo giá: nói cái nặng trước (còn thiếu mấy bản) thì người dùng đi
   * làm đúng việc cần làm, chứ không nhảy qua nhảy lại giữa hai lời nhắc.
   *
   * ⚠️ Chỉ đòi khi phiếu có yêu cầu báo giá (`can > 0`) — không có bản báo giá nào thì cũng không
   * có gì để so sánh.
   */
  if (!tepSoSanh(deNghi)) {
    return `Chưa đính kèm “${NHAN_O_SO_SANH}”. Bảng này bắt buộc phải có trước khi trình — lập ngoài (Excel/PDF) rồi đính vào ô cuối ở bước “Yêu cầu NCC báo giá”.`;
  }

  return null;
}
