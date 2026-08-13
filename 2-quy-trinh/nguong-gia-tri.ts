// ============================================================
// NGƯỠNG GIÁ TRỊ ĐƠN HÀNG — luật thật của quy trình TM-QT Mua hàng (HP CONS)
//
// 🔴 NGUỒN: hướng dẫn từng giai đoạn trên bảng Base.vn của công ty, Ban lãnh đạo cung cấp
// ảnh 11/08/2026. Nguyên văn nằm ở `huong-dan-giai-doan.ts`; file này là phần app KIỂM ĐƯỢC.
//
// Ba ngưỡng, đừng nhớ nhầm vì mỗi ngưỡng dùng cho một việc khác nhau:
//   ·  5 triệu — đơn TRÊN mức này phải trình TP.TMCU ký duyệt rồi gửi NCC ký xác nhận
//   · 10 triệu — TỪ mức này phải có 02 báo giá, và người duyệt là TỔNG GIÁM ĐỐC (dưới mức
//                này thì TP.TMCU duyệt)
//   · 20 triệu — TỪ mức này phải có hợp đồng do TGĐ ký; NCC mới phải cập nhật danh sách NCC
//
// ⚠️ APP CHỈ KIỂM ĐƯỢC PHẦN CÓ DỮ LIỆU. Việc ký hợp đồng, TGĐ duyệt, cập nhật danh sách NCC
// đều diễn ra NGOÀI app — nên các hàm dưới đây trả về LỜI NHẮC, không tự chặn thay con
// người. Chặn cứng một việc app không nhìn thấy được thì người dùng chỉ tìm cách lách.
// ============================================================

import type { BaoGia } from "@/3-du-lieu/kieu-du-lieu";
import {
  CAU_HINH_MAC_DINH,
  type CauHinhQuyTrinh,
} from "@/2-quy-trinh/cau-hinh-quy-trinh";

/**
 * Ngưỡng tính bằng đồng — GIÁ TRỊ MẶC ĐỊNH.
 *
 * ⚠️ TỪ 13/08/2026 NGƯỠNG SỬA ĐƯỢC qua trang "Cài đặt quy trình" (Ban lãnh đạo yêu cầu).
 * Hằng số này chỉ còn là giá trị dùng khi chưa ai đổi gì — mọi hàm ở đây nhận cấu hình làm
 * tham số. Đừng đọc thẳng `NGUONG` ở màn hình mới; đọc từ `useDuLieu().cauHinh`.
 */
export const NGUONG = {
  KY_DUYET_DON: CAU_HINH_MAC_DINH.nguongKyDuyetDon,
  HAI_BAO_GIA: CAU_HINH_MAC_DINH.nguongHaiBaoGia,
  HOP_DONG: CAU_HINH_MAC_DINH.nguongHopDong,
} as const;

/**
 * Viết số tiền theo cách người đọc quy trình quen: "5 triệu", "10 triệu", "1,5 tỷ".
 *
 * 🔴 SINH CÂU NHẮC TỪ CẤU HÌNH, KHÔNG VIẾT CỨNG SỐ. Trước 13/08/2026 các câu nhắc ghi
 * thẳng *"Trên 5 triệu đồng…"*. Khi ngưỡng sửa được mà câu chữ vẫn cứng, app xét theo 10
 * triệu nhưng đọc ra "5 triệu" — giao diện nói sai chính luật nó đang chạy, đúng thứ quy
 * tắc dự án mục 3.5 cấm.
 */
function chuTien(dong: number): string {
  if (dong >= 1_000_000_000) {
    const ty = dong / 1_000_000_000;
    return `${Number.isInteger(ty) ? ty : ty.toFixed(1).replace(".", ",")} tỷ`;
  }
  const tr = dong / 1_000_000;
  return `${Number.isInteger(tr) ? tr : tr.toFixed(1).replace(".", ",")} triệu`;
}

/** Ai là người xét duyệt báo giá, theo giá trị đơn hàng. */
export type CapDuyet = "truong_phong" | "tong_giam_doc";

export function capDuyetTheoGiaTri(
  giaTri: number,
  ch: CauHinhQuyTrinh = CAU_HINH_MAC_DINH,
): CapDuyet {
  return giaTri >= ch.nguongHaiBaoGia ? "tong_giam_doc" : "truong_phong";
}

export const NHAN_CAP_DUYET: Record<CapDuyet, string> = {
  truong_phong: "Trưởng phòng Thu mua duyệt",
  tong_giam_doc: "Tổng Giám đốc duyệt",
};

/**
 * Tổng giá trị của một bảng báo giá — lấy mức CAO NHẤT trong các nhà cung cấp đã báo.
 *
 * 🔴 Dùng mức cao nhất, KHÔNG dùng mức thấp nhất hay trung bình: ngưỡng duyệt là để bảo vệ
 * công ty, nên khi còn chưa biết sẽ chọn nhà cung cấp nào thì phải xét theo phương án đắt
 * nhất. Lấy mức thấp nhất sẽ có trường hợp lọt qua ngưỡng rồi cuối cùng chốt nhà cung cấp
 * đắt hơn — tức đơn phải TGĐ duyệt mà chỉ có trưởng phòng duyệt.
 *
 * ⚠️ Chỉ tính nhà cung cấp báo ĐỦ MỌI DÒNG. Nhà cung cấp báo thiếu dòng luôn rẻ hơn một
 * cách giả tạo, đưa vào so sánh là kéo tổng xuống dưới ngưỡng.
 */
export function giaTriUocTinh(bg: BaoGia): number {
  const theoNCC = new Map<string, { tong: number; soDong: number }>();
  for (const item of bg.items) {
    for (const q of item.baoGiaNCC) {
      const cu = theoNCC.get(q.nccId) ?? { tong: 0, soDong: 0 };
      theoNCC.set(q.nccId, {
        tong: cu.tong + q.donGia * item.khoiLuong,
        soDong: cu.soDong + 1,
      });
    }
  }
  const duDong = [...theoNCC.values()].filter((x) => x.soDong === bg.items.length);
  const xet = duDong.length > 0 ? duDong : [...theoNCC.values()];
  return xet.reduce((max, x) => Math.max(max, x.tong), 0);
}

/** Số nhà cung cấp đã có giá trong bảng báo giá. */
export function soNhaCungCapDaBao(bg: BaoGia): number {
  return new Set(bg.items.flatMap((d) => d.baoGiaNCC.map((q) => q.nccId))).size;
}

export interface CanhBaoNguong {
  /** Việc buộc phải làm theo quy trình mà app nhìn thấy là CHƯA đạt. */
  batBuoc: string[];
  /** Việc phải làm ngoài app — app không kiểm được, chỉ nhắc. */
  nhacNgoaiApp: string[];
  /** Ai phải duyệt bảng báo giá này. */
  capDuyet: CapDuyet;
  /** Giá trị dùng để xét ngưỡng. */
  giaTri: number;
}

/**
 * Soát một bảng báo giá theo các ngưỡng của quy trình, trước khi trình xét duyệt.
 *
 * `batBuoc` là thứ app nhìn thấy được và khẳng định được (số lượng báo giá). `nhacNgoaiApp`
 * là thứ app không có dữ liệu để kiểm (hợp đồng, chữ ký, danh mục NCC hàng năm) — chỉ nhắc
 * đúng lúc, không giả vờ đã kiểm hộ.
 */
/**
 * Soát ngưỡng cho một bảng báo giá.
 *
 * ⚠️ `ch` mặc định là cấu hình gốc để mọi chỗ gọi cũ không vỡ, NHƯNG màn hình phải truyền
 * cấu hình thật từ `useDuLieu().cauHinh` — không truyền là màn đó xét theo luật cũ trong khi
 * chỗ khác xét theo luật mới, hai chỗ nói khác nhau về cùng một đơn.
 */
export function soatNguongBaoGia(
  bg: BaoGia,
  ch: CauHinhQuyTrinh = CAU_HINH_MAC_DINH,
): CanhBaoNguong {
  const giaTri = giaTriUocTinh(bg);
  const soNCC = soNhaCungCapDaBao(bg);
  const batBuoc: string[] = [];
  const nhacNgoaiApp: string[] = [];

  if (giaTri >= ch.nguongHaiBaoGia && soNCC < ch.soBaoGiaToiThieu) {
    batBuoc.push(
      `Đơn ước tính ${chuTien(giaTri)} đồng (từ ${chuTien(ch.nguongHaiBaoGia)} trở lên) nên quy trình yêu cầu ít nhất ${String(ch.soBaoGiaToiThieu).padStart(2, "0")} báo giá — hiện mới có ${soNCC}. Trừ khi nhà cung cấp được chỉ định, hoặc đã có trong danh mục NCC hàng năm.`,
    );
  }

  if (giaTri >= ch.nguongHaiBaoGia) {
    nhacNgoaiApp.push(
      `Từ ${chuTien(ch.nguongHaiBaoGia)} đồng trở lên: Tổng Giám đốc là người duyệt báo giá. Việc TGĐ ký duyệt diễn ra ngoài app — trình ký xong rồi mới bấm duyệt ở đây.`,
    );
  }
  if (giaTri >= ch.nguongHopDong) {
    nhacNgoaiApp.push(
      `Từ ${chuTien(ch.nguongHopDong)} đồng trở lên: phải soạn Hợp đồng kinh tế / mua bán / nguyên tắc, trình Tổng Giám đốc ký duyệt. Với nhà cung cấp mới, sau khi giao nhận xong phải cập nhật “Danh sách nhà cung cấp”.`,
    );
  } else if (giaTri > ch.nguongKyDuyetDon) {
    // ⚠️ Ngưỡng này dùng "TRÊN" (`>`), hai ngưỡng kia dùng "TỪ" (`>=`) — hai quy ước khác
    // nhau trong cùng một file, giữ nguyên theo đúng chữ của quy trình công ty.
    nhacNgoaiApp.push(
      `Trên ${chuTien(ch.nguongKyDuyetDon)} đồng: đơn mua hàng phải trình Trưởng phòng Thu mua ký duyệt, sau đó gửi nhà cung cấp ký xác nhận.`,
    );
  }

  return { batBuoc, nhacNgoaiApp, capDuyet: capDuyetTheoGiaTri(giaTri, ch), giaTri };
}
