// ============================================================
// SO BẢN CŨ VỚI BẢN MỚI ĐỂ BIẾT PHẢI GHI GÌ — HÀM THUẦN, GỌI THẬT ĐƯỢC
//
// 🔴 SINH RA CHO VIỆC TÁCH KHO CHUNG (Sếp duyệt 16/09/2026).
//
// Hôm nay cả công ty còn dùng CHUNG MỘT tài liệu Firestore: mỗi lần ai sửa một dòng là ghi đè
// nguyên khối ~150 KB, và mọi máy đang mở nhận lại trọn gói. Hệ quả đã đo được:
//   · 15/09: ba đơn hàng BIẾN MẤT — máy giữ ảnh chụp cũ ghi đè lên đơn người khác vừa lập.
//   · 15/09: một vòng lặp ghi vô tận, 12 lần ghi trong 120 giây khi không ai thao tác.
//   · Chú thích trong `kho-chung-firestore.ts` đã ghi sẵn từ 12/08/2026: *"lên bản thật phải
//     tách từng chứng từ ra document riêng"*.
//
// Tách rồi thì mỗi lần ghi chỉ đụng đúng chứng từ vừa sửa. Nhưng muốn vậy phải trả lời được câu
// *"so với lần trước, cái gì đã đổi"* — đó là việc của tệp này.
//
// ⚠️ TỆP NÀY KHÔNG ĐƯỢC `import` GÌ CẢ. Nó phải dựng được độc lập bằng esbuild cho
// `kiem-luat-dung-chung.mjs`. Chỉ đạo Sếp 15/09/2026: *"luật nằm trong hook thì không bài kiểm
// nào bắt được"*.
// ============================================================

/** Một việc phải ghi: đặt lại nguyên bản ghi này (dùng cho cả thêm mới lẫn sửa). */
export interface ViecDatLai<T> {
  khoa: string;
  ban: T;
}

export interface ViecGhi<T> {
  /** Bản ghi cần đặt lại lên máy chủ — thêm mới hoặc vừa sửa. */
  datLai: ViecDatLai<T>[];
  /** Khoá của bản ghi đã biến mất, cần xoá trên máy chủ. */
  xoa: string[];
  /**
   * 🔴 CỜ BÁO ĐỘNG — xem `NGUONG_XOA_DANG_NGO`. `true` nghĩa là nơi gọi **PHẢI DỪNG**, đừng ghi
   * gì cả. Đây là lưới chắn cuối cùng trước khi xoá nhầm dữ liệu thật của cả phòng.
   */
  dangNgo: boolean;
}

/**
 * ★★ NGƯỠNG "XOÁ NHIỀU QUÁ MỨC BÌNH THƯỜNG" — quá nửa số bản ghi trong MỘT lượt.
 *
 * 🔴 VÌ SAO PHẢI CÓ LƯỚI NÀY — RỦI RO LỚN NHẤT CỦA CẢ VIỆC TÁCH:
 * Sau khi tách, "bản ghi biến mất khỏi mảng" nghĩa là "xoá tài liệu trên máy chủ". Mà mảng trong
 * bộ nhớ có thể rỗng vì những lý do KHÔNG PHẢI người dùng xoá:
 *   · state chưa nạp xong (mở app, chưa nghe được máy chủ lần nào);
 *   · một lỗi nào đó làm state về rỗng;
 *   · nhánh mã nào đó vô tình gọi `setDeNghi([])`.
 * Ở mô hình cũ, ghi đè bằng mảng rỗng chỉ làm mất dữ liệu **trong một document** và còn cứu được
 * bằng bản sao. Ở mô hình mới, nó thành **lệnh xoá hàng loạt tài liệu** — nhanh và dứt khoát hơn
 * nhiều.
 *
 * 📌 VÌ SAO LÀ "QUÁ NỬA" CHỨ KHÔNG PHẢI "XOÁ BẤT KỲ": người dùng có quyền xoá thật (xoá đề nghị,
 * huỷ đơn). Chặn mọi lệnh xoá là làm app mất tính năng. Nhưng xoá **quá nửa kho trong một lượt**
 * thì không còn là thao tác của người — không có nút nào trong app làm được việc đó.
 *
 * ⚠️ NGƯỠNG CHỈ XÉT KHI CÓ ĐỦ DỮ LIỆU ĐỂ SO. Kho đang có 1 bản ghi mà xoá 1 thì đúng là 100%,
 * nhưng đó là thao tác bình thường. Xem `TOI_THIEU_DE_XET_NGUONG`.
 */
export const NGUONG_XOA_DANG_NGO = 0.5;

/**
 * Dưới số này thì không xét ngưỡng phần trăm.
 *
 * 🔴 Kho có 2 bản ghi, người dùng xoá 1 → đúng 50%, chạm ngưỡng, mà đó là việc hoàn toàn bình
 * thường. Chặn là app hỏng tính năng xoá với những kho nhỏ. Ngưỡng phần trăm chỉ có nghĩa khi
 * số lượng đủ lớn để "quá nửa" thật sự bất thường.
 */
export const TOI_THIEU_DE_XET_NGUONG = 5;

/**
 * JSON có thứ tự khoá ỔN ĐỊNH.
 *
 * 🔴 KHÔNG DÙNG `JSON.stringify` TRẦN ĐỂ SO SÁNH. Thứ tự khoá trong một object JavaScript không
 * được bảo đảm giống nhau giữa hai lần dựng — cùng một dữ liệu vẫn ra hai chuỗi khác nhau, và
 * phép so sẽ báo "đã đổi" cho mọi bản ghi, mọi lượt. Hậu quả ở mô hình tách: mỗi lần ghi là ghi
 * lại TOÀN BỘ tài liệu, tức mất sạch cái lợi của việc tách.
 *
 * ⚠️ Đây không phải lo xa. Sáng 16/09/2026 tôi đã nhìn một khác biệt do thứ tự khoá và kết luận
 * nhầm là "nội dung không đổi" — phải đo lại bằng phép so chuẩn hoá mới thấy sự thật.
 */
export function chuoiOnDinh(x: unknown): string {
  if (x === null || x === undefined) return "null";
  if (Array.isArray(x)) return "[" + x.map(chuoiOnDinh).join(",") + "]";
  if (typeof x === "object") {
    const o = x as Record<string, unknown>;
    return (
      "{" +
      Object.keys(o)
        .sort()
        .filter((k) => o[k] !== undefined)
        .map((k) => JSON.stringify(k) + ":" + chuoiOnDinh(o[k]))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(x);
}

/**
 * So mảng cũ với mảng mới, trả về đúng những việc phải ghi lên máy chủ.
 *
 * @param truoc   Ảnh chụp lần đồng bộ trước. Rỗng = chưa từng đồng bộ.
 * @param sau     Trạng thái hiện tại trong bộ nhớ.
 * @param layKhoa Cách lấy khoá duy nhất của một bản ghi (`id`, hoặc `poId` với bảng giá).
 *
 * 🔴 BẢN GHI KHÔNG ĐỔI THÌ KHÔNG VÀO DANH SÁCH — đó là toàn bộ mục đích của hàm này. Ghi lại một
 * bản ghi y hệt vẫn tốn một lượt ghi, vẫn phát tán cho mọi máy đang nghe, và vẫn có thể châm ngòi
 * vòng lặp (sự cố 15/09/2026: ghi một giá trị luôn-mới trong vòng đọc-ghi).
 *
 * 🔴 BẢN GHI THIẾU KHOÁ BỊ BỎ QUA, KHÔNG NÉM LỖI. Một bản ghi hỏng không được phép chặn việc đồng
 * bộ của tất cả bản ghi còn lại — đó là cách một lỗi nhỏ làm đứng cả app.
 */
export function tinhViecGhi<T>(
  truoc: readonly T[],
  sau: readonly T[],
  layKhoa: (x: T) => string,
): ViecGhi<T> {
  const banTruoc = new Map<string, string>();
  for (const x of truoc) {
    const k = layKhoa(x);
    if (k) banTruoc.set(k, chuoiOnDinh(x));
  }

  const datLai: ViecDatLai<T>[] = [];
  const conLai = new Set(banTruoc.keys());

  for (const x of sau) {
    const k = layKhoa(x);
    if (!k) continue;
    conLai.delete(k);
    const chuoi = chuoiOnDinh(x);
    if (banTruoc.get(k) !== chuoi) datLai.push({ khoa: k, ban: x });
  }

  const xoa = [...conLai];

  /* Lưới chắn — xem `NGUONG_XOA_DANG_NGO`. Chỉ xét khi kho đủ lớn để "quá nửa" có nghĩa. */
  const dangNgo =
    banTruoc.size >= TOI_THIEU_DE_XET_NGUONG && xoa.length > banTruoc.size * NGUONG_XOA_DANG_NGO;

  return { datLai, xoa, dangNgo };
}
