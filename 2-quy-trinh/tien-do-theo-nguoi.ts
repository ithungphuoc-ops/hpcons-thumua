// ============================================================
// TIẾN ĐỘ THEO TỪNG NGƯỜI — Sếp chốt 25/09/2026
//
// 🔴 VẤN ĐỀ: một phiếu đề nghị chia cho nhiều người, nhưng app chỉ tính MỘT bước cho cả phiếu.
// Cách tính là "chỉ cần một đơn tới bước nào thì cả phiếu nhảy bước đó" — nên thanh bước luôn
// chạy theo NGƯỜI NHANH NHẤT. Trưởng bộ phận nhìn vào thấy phiếu ở bước ⑤ trong khi một nửa
// phiếu còn ở bước ②, và không có cách nào biết ai đang chậm.
//
// ✅ CÁCH CHỮA: tính thêm bước cho TỪNG NGƯỜI, hiển thị bên dưới thanh bước chung.
//
// 🔴🔴 GỌI LẠI ĐÚNG HÀM ĐANG CHẠY, TUYỆT ĐỐI KHÔNG VIẾT LUẬT THỨ HAI.
//
// `xacDinhGiaiDoan` dài hơn 270 dòng và đầy luật do Sếp/Ban lãnh đạo chốt rải rác từ tháng 8:
// hoá đơn VAT bắt buộc mới duyệt hoàn thành, hồ sơ phòng ban đi nhánh riêng bằng phiếu giao
// hàng, giao thiếu vẫn qua bước ⑦ được, dòng đã nhân bản đi thì không tính là chưa phân bổ…
//
// Viết một hàm mới để tính bước cho từng người là tự tạo BẢN LUẬT THỨ HAI. Vài lần sửa sau,
// hai bản lệch nhau — và lệch kiểu im lặng: thanh trên nói một đằng, khối dưới nói một nẻo,
// không một dòng lỗi nào. Đúng loại lỗi vừa vấp ở nhịp 3c (route máy chủ không theo kịp đợt 2).
//
// Nên ở đây chỉ làm một việc: LỌC dữ liệu về phần của từng người, rồi đưa cho chính hàm cũ.
//
// 📌 LÀM ĐƯỢC LÀ NHỜ APP ĐÃ LƯU SẴN MỐI LIÊN HỆ NGƯỢC: mỗi dòng trong đơn hàng
// (`DongPO.sttDongDeNghi`) và trong báo giá (`DongBaoGia.sttDongDeNghi`) đều trỏ về đúng dòng
// của phiếu đề nghị. Không phải thêm trường mới, không phải sửa dữ liệu cũ.
// ============================================================

import { xacDinhGiaiDoan, type GiaiDoanMuaHang } from "@/2-quy-trinh/giai-doan-mua-hang";
import type {
  BaoGia,
  DeNghiMuaHang,
  DonDatHang,
  PhieuNhanHang,
} from "@/3-du-lieu/kieu-du-lieu";

/** Tiến độ của một người trên một phiếu đề nghị. */
export interface TienDoNguoi {
  uid: string;
  ten: string;
  /** Số thứ tự các dòng người này phụ trách. */
  sttDong: number[];
  giaiDoan: GiaiDoanMuaHang;
}

export interface TienDoPhieu {
  /** Xếp theo thứ tự xuất hiện trong phiếu — giữ nguyên thứ tự trưởng bộ phận đã phân bổ. */
  nguoi: TienDoNguoi[];
  /** Số dòng CHƯA giao cho ai. Việc của trưởng bộ phận, không hiện ra là rất dễ quên. */
  soDongChuaGiao: number;
}

/**
 * Gom dòng theo người phụ trách.
 *
 * ⚠️ GIỮ THỨ TỰ XUẤT HIỆN, đừng sắp lại theo tên hay theo tiến độ. Trưởng bộ phận phân bổ theo
 * một thứ tự nào đó trong đầu họ; đảo đi là mỗi lần mở phiếu lại thấy danh sách nhảy chỗ.
 */
function gomTheoNguoi(deNghi: DeNghiMuaHang): {
  nhom: { uid: string; ten: string; sttDong: number[] }[];
  soDongChuaGiao: number;
} {
  const theoUid = new Map<string, { uid: string; ten: string; sttDong: number[] }>();
  let soDongChuaGiao = 0;

  for (const d of deNghi.items ?? []) {
    const uid = (d.nguoiPhuTrachUid ?? "").trim();
    if (!uid) {
      soDongChuaGiao += 1;
      continue;
    }
    let n = theoUid.get(uid);
    if (!n) {
      /* Tên có thể trống ở dữ liệu cũ — hiện "(không rõ tên)" còn hơn hiện một ô rỗng khó hiểu.
         KHÔNG bịa tên từ uid: uid là chuỗi băm, đọc lên không ra người nào cả. */
      n = { uid, ten: (d.nguoiPhuTrachTen ?? "").trim() || "(không rõ tên)", sttDong: [] };
      theoUid.set(uid, n);
    }
    n.sttDong.push(d.stt);
  }

  return { nhom: [...theoUid.values()], soDongChuaGiao };
}

/**
 * Lọc dữ liệu về đúng phần của một người, rồi hỏi chính hàm tính bước đang chạy.
 *
 * 🔴 PHIẾU ẢO GIỮ NGUYÊN MỌI TRƯỜNG KHÁC, chỉ thay `items`. Hàm tính bước có đọc `trangThai`
 * (đóng/hoàn thành), `maHopDongCDT`, `phongBanNguon`, `taiLieu`… — cắt bớt trường nào là đổi
 * kết quả theo cách không ai ngờ.
 *
 * 🔴 ĐƠN HÀNG LỌC THEO DÒNG, KHÔNG THEO NGƯỜI LẬP ĐƠN. `po.nguoiPhuTrachUid` là người bấm nút
 * lập đơn, còn câu hỏi ở đây là *"đơn này mua hộ những dòng nào"*. Hai thứ khác nhau: trưởng bộ
 * phận có thể lập đơn hộ nhân viên, và một đơn gộp dòng của hai người vẫn tính cho cả hai.
 */
export function tienDoCuaNguoi(
  deNghi: DeNghiMuaHang,
  sttDong: readonly number[],
  tatCaPO: readonly DonDatHang[],
  tatCaBaoGia: readonly BaoGia[],
  tatCaPhieu: readonly PhieuNhanHang[],
  tatCaDeNghi?: readonly DeNghiMuaHang[],
): GiaiDoanMuaHang {
  const cua = new Set(sttDong);

  const phieuAo: DeNghiMuaHang = {
    ...deNghi,
    items: (deNghi.items ?? []).filter((d) => cua.has(d.stt)),
  };

  const poCua = tatCaPO.filter(
    (po) =>
      po.prId === deNghi.id &&
      (po.items ?? []).some((d) => d.sttDongDeNghi !== undefined && cua.has(d.sttDongDeNghi)),
  );

  const baoGiaCua = tatCaBaoGia.filter(
    (bg) =>
      bg.prId === deNghi.id &&
      (bg.items ?? []).some((d) => d.sttDongDeNghi !== undefined && cua.has(d.sttDongDeNghi)),
  );

  /* Phiếu nhận không trỏ thẳng về dòng đề nghị — đi vòng qua đơn hàng đã lọc ở trên. */
  const idPO = new Set(poCua.map((po) => po.id));
  const phieuCua = tatCaPhieu.filter((p) => idPO.has(p.poId));

  return xacDinhGiaiDoan(
    phieuAo,
    poCua as DonDatHang[],
    baoGiaCua as BaoGia[],
    phieuCua as PhieuNhanHang[],
    tatCaDeNghi as DeNghiMuaHang[] | undefined,
  );
}

/** Tiến độ của mọi người trên một phiếu. */
export function tienDoTheoNguoi(
  deNghi: DeNghiMuaHang,
  tatCaPO: readonly DonDatHang[],
  tatCaBaoGia: readonly BaoGia[],
  tatCaPhieu: readonly PhieuNhanHang[],
  tatCaDeNghi?: readonly DeNghiMuaHang[],
): TienDoPhieu {
  const { nhom, soDongChuaGiao } = gomTheoNguoi(deNghi);
  return {
    nguoi: nhom.map((n) => ({
      ...n,
      giaiDoan: tienDoCuaNguoi(deNghi, n.sttDong, tatCaPO, tatCaBaoGia, tatCaPhieu, tatCaDeNghi),
    })),
    soDongChuaGiao,
  };
}

// ============================================================
// QUYẾT ĐỊNH HIỂN THỊ — tách riêng để bộ luật gọi thật được
// ============================================================

import { GIAI_DOAN_MUA_HANG, giaiDoanDaKetThuc } from "@/2-quy-trinh/giai-doan-mua-hang";

/** Thứ tự các bước, dựng từ chính bảng mô tả đang chạy — không chép lại danh sách. */
const THU_TU: GiaiDoanMuaHang[] = GIAI_DOAN_MUA_HANG.map((g) => g.ma);

/**
 * Vị trí của một bước trong dãy. `-1` cho mã lạ (hồ sơ cũ, hoặc máy khác chạy bản khác).
 *
 * ⚠️ `that_bai` NẰM CUỐI DÃY nhưng KHÔNG phải "đi xa nhất". Mọi phép so sánh tiến độ bên dưới
 * phải loại nó ra, nếu không một hồ sơ đóng dở sẽ được coi là người chạy nhanh nhất.
 */
export function viTriBuoc(g: GiaiDoanMuaHang): number {
  return THU_TU.indexOf(g);
}

/** Người này đã xong phần của mình chưa. */
export function daXongPhanMinh(g: GiaiDoanMuaHang): boolean {
  return g === "hoan_thanh";
}

/**
 * Có nên hiện khối "tiến độ theo người" không.
 *
 * 🔴 CHỈ HIỆN KHI CÓ TỪ HAI NGƯỜI. Một người làm hết thì khối này chỉ lặp lại đúng thanh bước
 * ngay phía trên — thêm một khối thừa trên màn hình mà không nói thêm điều gì.
 *
 * 📌 Còn dòng chưa giao thì VẪN hiện dù chỉ một người: đó là thông tin trưởng bộ phận cần
 * (còn việc chưa phân cho ai), và thanh bước ở trên không nói được điều đó.
 */
export function nenHienTienDoTheoNguoi(t: TienDoPhieu): boolean {
  return t.nguoi.length >= 2 || (t.nguoi.length >= 1 && t.soDongChuaGiao > 0);
}

/** Khoảng cách tối thiểu để gắn nhãn "chậm nhất". */
export const LECH_TOI_THIEU_DE_GAN_CHAM = 2;

/**
 * Ai đang chậm nhất — trả `uid`, hoặc `null` khi không gắn nhãn cho ai.
 *
 * 🔴 CHỈ GẮN KHI LỆCH TỪ HAI BƯỚC. Lệch một bước là nhịp làm việc bình thường: người này vừa
 * chốt báo giá, người kia đang lập đơn. Gắn nhãn "chậm nhất" vào đó là tạo áp lực vô cớ, và
 * nhãn nào cũng hiện thì chẳng còn là tín hiệu nữa.
 *
 * 🔴 KHÔNG GẮN CHO NGƯỜI ĐÃ XONG, và cũng không tính họ khi đo khoảng cách — người xong việc
 * đứng ở cuối dãy, để họ trong phép đo thì lúc nào cũng ra "lệch nhiều".
 *
 * ⚠️ HAI NGƯỜI CÙNG CHẬM NHẤT thì chỉ gắn cho người ĐẦU TIÊN theo thứ tự phân bổ. Gắn cả hai
 * thì nhãn mất nghĩa "nhất"; không gắn ai thì mất luôn tín hiệu.
 */
export function aiChamNhat(t: TienDoPhieu): string | null {
  const dangChay = t.nguoi.filter((n) => !giaiDoanDaKetThuc(n.giaiDoan) && viTriBuoc(n.giaiDoan) >= 0);
  if (dangChay.length < 2) return null;

  const viTri = dangChay.map((n) => viTriBuoc(n.giaiDoan));
  const thap = Math.min(...viTri);
  const cao = Math.max(...viTri);
  if (cao - thap < LECH_TOI_THIEU_DE_GAN_CHAM) return null;

  return dangChay.find((n) => viTriBuoc(n.giaiDoan) === thap)?.uid ?? null;
}
