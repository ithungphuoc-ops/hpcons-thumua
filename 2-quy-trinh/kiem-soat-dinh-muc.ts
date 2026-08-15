// ============================================================
// VẬT TƯ KIỂM SOÁT ĐỊNH MỨC
//
// 🔴 Ban lãnh đạo 15/08/2026 gửi danh sách 5 nhóm vật tư và chốt: *"thêm chức năng tự động
// thông báo khi gặp các vật tư này sẽ tự động hiện dòng thông báo định mức và báo cho bộ
// phận QLDA. Danh sách này sẽ được thêm mới hoặc xóa bớt nên cấu hình sao để có thể sửa"*.
//
// Vì sao cần: những vật tư này có ĐỊNH MỨC do QLDA quản. Mua vượt định mức là vượt dự toán
// công trình, mà lúc phát hiện thì hàng đã về tới nơi. Bắt ngay từ lúc lập đề nghị thì còn
// kịp đối chiếu.
//
// ⚠️ DANH MỤC SỬA ĐƯỢC, không viết cứng vào luật. Vật tư kiểm soát thay đổi theo từng thời
// kỳ và từng loại công trình; sửa danh sách mà phải nhờ đội triển khai thì cuối cùng không
// ai sửa, danh sách thành lạc hậu rồi cảnh báo sai.
// ============================================================

import { boDau } from "@/6-tien-ich/bo-dau";

/** Một nhóm vật tư kiểm soát định mức — theo đúng cách Ban lãnh đạo chia nhóm. */
export interface NhomVatTuDinhMuc {
  /** Khóa ổn định, KHÔNG đổi khi sửa tên nhóm. */
  ma: string;
  /** Tên nhóm, vd "Vật tư kết cấu". */
  ten: string;
  /**
   * Tên các vật tư trong nhóm.
   *
   * 📌 So khớp KHÔNG cần trùng khít: người lập phiếu gõ "Xi măng PCB40" thì vẫn phải khớp
   * mục "XI MĂNG". Xem `vatTuKiemSoatDinhMuc`.
   */
  vatTu: string[];
}

/**
 * Danh mục mặc định — CHÉP ĐÚNG ảnh Ban lãnh đạo gửi 15/08/2026.
 *
 * ⚠️ Giữ nguyên cách chia nhóm và thứ tự trong ảnh để người dùng đối chiếu được với bảng
 * giấy đang dùng. Nhóm "Chưa phân nhóm" cũng giữ y nguyên tên, không tự xếp vào nhóm khác.
 */
export const NHOM_VAT_TU_DINH_MUC_MAC_DINH: NhomVatTuDinhMuc[] = [
  {
    ma: "ket_cau",
    ten: "Vật tư kết cấu",
    vatTu: ["Bê tông", "Thép xây dựng", "Thép lưới hàn"],
  },
  {
    ma: "hoan_thien",
    ten: "Vật tư hoàn thiện",
    vatTu: ["Gạch đinh 40x80x180", "Xi măng", "Cát xây", "Gạch ốp lát"],
  },
  {
    ma: "ket_cau_thep_mai_vach",
    ten: "Vật tư kết cấu thép, mái, vách",
    vatTu: [
      "Bulong liên kết",
      "Bulong neo",
      "Tole mái",
      "Tole vách",
      "Tole trần",
      "Xà gồ",
      "Bông thủy tinh",
      "Lưới",
      "Giấy bạt",
      "Tole sàn deck",
    ],
  },
  {
    ma: "ha_tang",
    ten: "Vật tư hạ tầng",
    vatTu: ["Cống các loại", "Đá hạ tầng", "Cát san lấp"],
  },
  {
    ma: "chua_phan_nhom",
    ten: "Chưa phân nhóm",
    vatTu: ["Gạch rỗng 80x80x180", "Gạch block M75 390x190x90"],
  },
];

/** Kết quả tra một tên vật tư. */
export interface KetQuaTraDinhMuc {
  /** Tên trong danh mục đã khớp, vd "Xi măng". */
  tenTrongDanhMuc: string;
  /** Nhóm chứa nó, vd "Vật tư hoàn thiện". */
  tenNhom: string;
}

/**
 * ★ TÊN VẬT TƯ NÀY CÓ THUỘC DIỆN KIỂM SOÁT ĐỊNH MỨC KHÔNG.
 *
 * 🔴 KHỚP MỀM, không đòi trùng khít. Người lập phiếu gõ theo thói quen: *"Xi măng PCB40"*,
 * *"Thép xây dựng D14 CB400"*, *"Cát xây tô"*. Đòi gõ đúng y hệt "XI MĂNG" thì cảnh báo
 * không bao giờ nổ, mà người dùng lại tưởng app đã kiểm hộ — tệ hơn là không có cảnh báo.
 *
 * Cách khớp: bỏ dấu, đưa về chữ thường, rồi xem chuỗi người dùng gõ CÓ CHỨA tên trong danh
 * mục không.
 *
 * ⚠️ Chấp nhận có lúc báo thừa (vd "lưới" khớp cả "lưới B40" lẫn "lưới chắn côn trùng").
 * Báo thừa thì người dùng bỏ tích được; báo thiếu thì không ai biết mà sửa. Với việc kiểm
 * soát định mức, thà cẩn thận quá còn hơn lọt.
 *
 * ⚠️ Bỏ qua mục dài dưới 3 ký tự để tránh khớp bừa.
 */
export function vatTuKiemSoatDinhMuc(
  tenVatLieu: string,
  nhom: NhomVatTuDinhMuc[],
): KetQuaTraDinhMuc | null {
  const can = boDau(tenVatLieu ?? "").trim();
  if (can.length < 2) return null;

  for (const n of nhom) {
    for (const v of n.vatTu) {
      const muc = boDau(v ?? "").trim();
      if (muc.length < 3) continue;
      if (can.includes(muc)) return { tenTrongDanhMuc: v, tenNhom: n.ten };
    }
  }
  return null;
}

/**
 * Các dòng vật tư của một phiếu thuộc diện kiểm soát định mức.
 *
 * Dùng chung cho: màn lập phiếu (tự tích + cảnh báo), trang chi tiết (dòng thông báo), và
 * chỗ quyết định có báo cho QLDA hay không — MỘT luật, mọi nơi hỏi cùng một câu.
 */
export function dongCanKiemSoatDinhMuc<T extends { tenVatLieu: string }>(
  dong: T[],
  nhom: NhomVatTuDinhMuc[],
): { dong: T; khop: KetQuaTraDinhMuc }[] {
  const ra: { dong: T; khop: KetQuaTraDinhMuc }[] = [];
  for (const d of dong) {
    const khop = vatTuKiemSoatDinhMuc(d.tenVatLieu, nhom);
    if (khop) ra.push({ dong: d, khop });
  }
  return ra;
}
