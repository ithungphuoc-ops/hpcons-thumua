// ============================================================
// CẤP MÃ Ở MÁY CHỦ — nhịp 3b lộ trình chống mất dữ liệu (Sếp chốt 23/09/2026)
//
// 🔴 VẤN ĐỀ: mã đơn hàng / đề nghị / nhà cung cấp đang được tính TRONG MÁY NGƯỜI DÙNG — lấy
// danh sách mã đang có trong bộ nhớ, tìm số lớn nhất, cộng một. Hai người bấm "Tạo" cùng lúc
// thì cùng nhìn thấy một số lớn nhất, nên cùng cấp ra MỘT MÃ. Hai chứng từ khác nhau mang cùng
// một số; đối chiếu công nợ với nhà cung cấp sẽ lệch, và không ai biết lệch ở đâu.
//
// ✅ CÁCH CHỮA: cấp mã trong một giao dịch ở máy chủ. Người sau phải chờ người trước xong mới
// tới lượt, nên không thể nhìn thấy cùng một số lớn nhất.
//
// 🔴 CHỈ ĐỌC RỒI TRẢ MÃ LÀ VÔ NGHĨA — ĐÂY LÀ CHỖ DỄ LÀM SAI NHẤT. Giao dịch Firestore chỉ phát
// hiện tranh chấp khi có GHI. Hai giao dịch cùng đọc, cùng tính, cùng trả về một mã mà không ghi
// gì thì cả hai đều "thành công" và vẫn trùng y như cũ. Nên mỗi lần cấp phải ghi mã vừa cấp vào
// một SỔ GIỮ CHỖ — chính lần ghi đó tạo ra tranh chấp để Firestore bắt được.
//
// ⚠️ ĐÁNH ĐỔI PHẢI BIẾT: mã được cấp trước, chứng từ ghi sau. Người dùng cấp mã xong rồi bỏ dở
// thì mã đó treo. Nên giữ chỗ CÓ HẠN (xem `HAN_GIU_CHO_MS`): quá hạn mà chưa thấy mã trong kho
// thì coi như bỏ dở và trả số về. Giữ vĩnh viễn thì dãy số nhảy cóc, kế toán sẽ hỏi.
// ============================================================

import { maDonHangTiepTheo } from "@/2-quy-trinh/dat-ma-don-hang";
import { maDeNghiTiepTheo } from "@/2-quy-trinh/dat-ten-de-nghi";
import { maNhaCungCapTiepTheo } from "@/2-quy-trinh/dat-ma-nha-cung-cap";

export const LOAI_MA = ["don-hang", "de-nghi", "nha-cung-cap"] as const;
export type LoaiMa = (typeof LOAI_MA)[number];

/** Kho chứa sổ giữ chỗ. KHÔNG dùng chung với dữ liệu nghiệp vụ — cùng lý do với `dang-sua`. */
export const KHO_CAP_PHAT = "cap-phat-ma";

/**
 * Giữ chỗ 10 phút.
 *
 * ⚠️ PHẢI DÀI HƠN KHOẢNG CÁCH GIỮA "cấp mã" VÀ "ghi chứng từ" — thực tế là vài giây, vì app
 * cấp mã ngay lúc người dùng bấm Lưu chứ không phải lúc mở biểu mẫu. 10 phút là thừa sức,
 * nhưng vẫn đủ ngắn để một lần bỏ dở không treo số quá lâu.
 */
export const HAN_GIU_CHO_MS = 10 * 60 * 1000;

/** Một mã đã cấp nhưng chưa chắc đã được ghi thành chứng từ. */
export interface MaGiuCho {
  ma: string;
  /** Mốc cấp, dạng ISO. */
  luc: string;
}

/**
 * Khoá của sổ giữ chỗ.
 *
 * 🔴 TÁCH SỔ THEO ĐÚNG PHẠM VI ĐÁNH SỐ. Đơn hàng đánh số theo NĂM, đề nghị theo DỰ ÁN, nhà
 * cung cấp thì một dãy chung. Gộp chung một sổ là hai dự án khác nhau tranh nhau vô cớ — chậm
 * mà chẳng được gì; tách nhỏ hơn phạm vi thật thì lại không chống được trùng.
 */
export function khoaSoCapPhat(loai: LoaiMa, thamSo: string): string {
  const s = thamSo.trim();
  /* Firestore cấm "/" trong mã tài liệu, mà mã dự án thì đầy dấu gạch chéo
     (`30/2025/HĐXD/UNICE-HPCS`). Thay bằng "__" chứ đừng bỏ đi: bỏ đi là hai dự án khác nhau
     có thể cho ra cùng một khoá. */
  const an = s.replace(/\//g, "__");
  return an ? `${loai}__${an}` : loai;
}

/**
 * Lọc ra những mã giữ chỗ CÒN HIỆU LỰC.
 *
 * Bỏ đi hai loại: mã đã thành chứng từ thật (thấy trong kho — giữ chỗ xong việc), và mã quá
 * hạn mà vẫn chưa thấy (người dùng bỏ dở — trả số về).
 *
 * ⚠️ So mã KHÔNG phân biệt hoa thường, cùng quy ước với `maNhaCungCapTiepTheo` — mã cũ nhập tay
 * có thể là `nc0001`. Hai nơi so khác nhau thì một bên tưởng đã dùng, bên kia tưởng còn trống.
 */
export function locGiuChoConHieuLuc(
  giuCho: readonly MaGiuCho[],
  maTrongKho: readonly string[],
  bayGio: number = Date.now(),
): MaGiuCho[] {
  const daThanhChungTu = new Set(maTrongKho.map((m) => m.trim().toLowerCase()));
  return giuCho.filter((g) => {
    if (!g?.ma || typeof g.ma !== "string") return false;
    if (daThanhChungTu.has(g.ma.trim().toLowerCase())) return false;
    const t = new Date(g.luc ?? "").getTime();
    if (!Number.isFinite(t)) return false; // không rõ cấp lúc nào → không giữ nữa
    return bayGio - t < HAN_GIU_CHO_MS;
  });
}

/**
 * Tính mã tiếp theo, ĐÃ TÍNH CẢ MÃ ĐANG GIỮ CHỖ.
 *
 * 🔴 PHẢI GỘP `maTrongKho` VỚI MÃ GIỮ CHỖ TRƯỚC KHI TÍNH. Bỏ vế sau thì hai người cách nhau
 * vài giây vẫn nhận cùng một mã — người đầu cấp xong chưa kịp ghi chứng từ, người sau nhìn vào
 * kho không thấy gì. Đó đúng là cái mà sổ giữ chỗ sinh ra để chặn.
 *
 * Ba loại dùng lại đúng ba hàm thuần đang chạy ở giao diện (`dat-ma-don-hang`,
 * `dat-ten-de-nghi`, `dat-ma-nha-cung-cap`) — một luật một chỗ. Chép lại luật sinh mã sang máy
 * chủ là bảo đảm hai bên lệch nhau sau vài lần sửa.
 */
export function maTiepTheoTrenMayChu(
  loai: LoaiMa,
  thamSo: string,
  maTrongKho: readonly string[],
  giuCho: readonly MaGiuCho[],
): string {
  const tatCa = [...maTrongKho, ...giuCho.map((g) => g.ma)];
  if (loai === "don-hang") return maDonHangTiepTheo(thamSo, tatCa);
  if (loai === "de-nghi") return maDeNghiTiepTheo(thamSo, tatCa);
  return maNhaCungCapTiepTheo(tatCa);
}

/** Có phải một loại mã hợp lệ không — dùng để chặn dữ liệu lạ gửi vào route. */
export function laLoaiMa(x: unknown): x is LoaiMa {
  return typeof x === "string" && (LOAI_MA as readonly string[]).includes(x);
}
