// ============================================================
// DANH MỤC PHÒNG BAN CỦA CÔNG TY
//
// 🔴 NGUỒN: Ban lãnh đạo cung cấp ngày 12/08/2026 — chụp từ ô chọn phòng ban trên hệ
// thống Base đang chạy thật của công ty. Mục đích: *"tạo sẵn danh mục để sau này khi link
// dữ liệu từ app tổng qua sẽ có dữ liệu"*.
//
// ⚠️ ĐÂY LÀ DANH MỤC TẠM, CHỜ APP TỔNG. Khi HPcore.vn mở danh mục phòng ban dùng chung
// thì thay RUỘT của file này (đọc từ Firestore), giữ nguyên tên hàm — mọi nơi khác trong
// app gọi qua `nhanPhongBan()` nên không phải sửa gì.
//
// 📌 Vì sao để riêng một file mà không nhét vào `trang-thai.ts`: danh mục phòng ban là DỮ
// LIỆU của công ty (sẽ thay đổi khi công ty tái cơ cấu), còn `trang-thai.ts` là NHÃN của
// quy trình mua hàng (chỉ đổi khi nghiệp vụ đổi). Trộn hai thứ vào một chỗ thì mỗi lần
// công ty thêm phòng ban lại phải mở file nghiệp vụ ra sửa.
// ============================================================

/**
 * Mã phòng ban — chuỗi tự do, KHÔNG phải union đóng.
 *
 * 🔴 Cố ý để `string` chứ không phải union 16 giá trị. Lý do: dữ liệu sẽ do App Tổng đẩy
 * sang; nếu App Tổng thêm một phòng ban mà app này khai union đóng, phiếu của phòng đó
 * **không hợp kiểu** → hoặc build hỏng, hoặc phải sửa code mỗi lần công ty đổi cơ cấu.
 * Đổi lại, mọi chỗ hiển thị PHẢI đi qua `nhanPhongBan()` để mã lạ vẫn hiện ra được chữ.
 */
export type MaPhongBan = string;

/**
 * 16 phòng ban theo danh sách Ban lãnh đạo cung cấp 12/08/2026.
 *
 * Thứ tự giữ đúng thứ tự trên Base (Ban Giám đốc trước, các Bộ phận, rồi các Phòng) để
 * người dùng quen mắt tìm nhanh — đừng sắp lại theo bảng chữ cái.
 *
 * ⚠️ Mã `thi_cong` PHẢI giữ nguyên: mọi đề nghị đã tạo trước 12/08/2026 đều mang mã này.
 * Đổi mã là toàn bộ phiếu cũ hiện sai tên phòng ban.
 */
export const DANH_MUC_PHONG_BAN: { ma: MaPhongBan; ten: string }[] = [
  { ma: "ban_giam_doc", ten: "Ban Giám đốc" },
  { ma: "thi_cong", ten: "Bộ phận Thi công" },
  { ma: "qa_qc", ten: "Bộ phận QA-QC" },
  { ma: "bao_tri", ten: "Bộ phận Bảo trì" },
  { ma: "hse", ten: "Bộ phận HSE" },
  { ma: "shopdrawing", ten: "Bộ phận Shopdrawing" },
  { ma: "thu_mua_cung_ung", ten: "Phòng Thu mua Cung ứng" },
  { ma: "hanh_chinh_nhan_su_it", ten: "Phòng Hành chính Nhân sự-IT" },
  { ma: "phap_ly", ten: "Phòng Pháp Lý" },
  { ma: "kinh_doanh", ten: "Phòng Kinh doanh" },
  { ma: "ban_tro_ly", ten: "Ban Trợ lý" },
  { ma: "ke_toan_tai_chinh", ten: "Phòng Kế toán Tài chính" },
  { ma: "quan_ly_du_an", ten: "Phòng Quản lý dự án" },
  { ma: "dau_thau", ten: "Phòng Đấu thầu" },
  { ma: "thiet_ke", ten: "Phòng Thiết kế" },
  { ma: "to_chuc_hanh_chinh", ten: "Phòng Tổ chức Hành chính" },
];

/** Tra nhanh mã → tên. Dựng một lần, không dựng lại mỗi lần vẽ giao diện. */
const BANG_TEN = new Map(DANH_MUC_PHONG_BAN.map((p) => [p.ma, p.ten]));

/**
 * ⚠️ MÃ NGOÀI DANH MỤC CHÍNH THỨC — giữ để không mất người, KHÔNG hiện trong ô chọn.
 *
 * 🔴 `kho` là trường hợp có thật: nhân sự chạy thử có anh Nguyễn Hữu Phước — thủ kho, hồ
 * sơ ghi phòng ban *"Kho công trình"*, nhưng danh sách 16 phòng ban Ban lãnh đạo gửi
 * ngày 12/08/2026 **không có mục Kho**. Bỏ mã này đi thì thủ kho rơi khỏi mọi nhóm phòng
 * ban trong hộp chọn người theo dõi — người dùng tìm không ra và tưởng anh ấy nghỉ việc.
 *
 * 👉 Cần Ban lãnh đạo xác nhận: Kho thuộc *Phòng Thu mua Cung ứng*, hay là một bộ phận
 * riêng cần bổ sung vào danh mục? Xác nhận xong thì xóa bảng này.
 */
const MA_NGOAI_DANH_MUC: Record<string, string> = {
  kho: "Kho công trình",
};

/**
 * Tên phòng ban để hiện lên màn hình.
 *
 * 🔴 KHÔNG BAO GIỜ trả về `undefined`. Mã lạ (dữ liệu cũ, hoặc phòng ban App Tổng vừa
 * thêm mà danh mục này chưa kịp cập nhật) thì trả về chính cái mã — người dùng thấy
 * `phong_moi` còn hiểu được và báo lại được, chứ thấy chữ "undefined" giữa hồ sơ thì
 * không biết đường nào mà lần.
 */
export function nhanPhongBan(ma: MaPhongBan | undefined | null): string {
  if (!ma) return "—";
  return BANG_TEN.get(ma) ?? MA_NGOAI_DANH_MUC[ma] ?? ma;
}

/** Mã dùng khi lập phiếu mà chưa biết phòng ban — đứng đầu ô chọn. */
export const PHONG_BAN_MAC_DINH: MaPhongBan = "thi_cong";

/**
 * Đoán mã phòng ban từ TÊN phòng ban dạng chữ.
 *
 * 🔴 Vì sao cần: hồ sơ nhân sự (Firestore `nguoi-dung/*`) đang lưu phòng ban bằng chuỗi
 * tiếng Việt — *"Phòng Thu mua"*, *"Kho công trình"* — chứ chưa có mã. Hàm này là cầu tạm
 * cho tới khi App Tổng trả về mã chuẩn; lúc đó xóa hàm và dùng thẳng mã.
 *
 * ⚠️ So khớp theo chuỗi nên thứ tự các nhánh QUAN TRỌNG: xét cụm dài và riêng biệt trước.
 * Ví dụ *"Phòng Tổ chức Hành chính"* phải xét trước *"Hành chính Nhân sự-IT"*, nếu không
 * cả hai cùng chứa chữ "hanh chinh" và người của phòng này lọt sang nhóm phòng kia.
 */
export function maPhongBanTuTen(ten: string | undefined | null): MaPhongBan | null {
  if (!ten) return null;
  // Bỏ dấu để "Kế toán" và "Ke toan" cùng khớp. Dùng mã Unicode ̀-ͯ thay vì gõ
  // thẳng ký tự dấu — dấu thanh rời nhìn không thấy trên màn hình, sửa nhầm là hỏng thầm lặng.
  const t = ten
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();

  if (t.includes("giam doc")) return "ban_giam_doc";
  if (t.includes("tro ly")) return "ban_tro_ly";
  if (t.includes("thu mua") || t.includes("cung ung")) return "thu_mua_cung_ung";
  if (t.includes("thi cong")) return "thi_cong";
  if (t.includes("kho")) return "kho"; // ngoài danh mục — xem MA_NGOAI_DANH_MUC
  if (t.includes("quan ly du an") || t.includes("qlda")) return "quan_ly_du_an";
  if (t.includes("ke toan") || t.includes("tai chinh")) return "ke_toan_tai_chinh";
  if (t.includes("to chuc")) return "to_chuc_hanh_chinh";
  if (t.includes("hanh chinh") || t.includes("nhan su") || t.includes("it"))
    return "hanh_chinh_nhan_su_it";
  if (t.includes("phap ly")) return "phap_ly";
  if (t.includes("dau thau")) return "dau_thau";
  if (t.includes("thiet ke")) return "thiet_ke";
  if (t.includes("shopdrawing") || t.includes("shop drawing")) return "shopdrawing";
  if (t.includes("kinh doanh")) return "kinh_doanh";
  if (t.includes("bao tri")) return "bao_tri";
  if (t.includes("hse") || t.includes("an toan")) return "hse";
  if (t.includes("qa") || t.includes("qc")) return "qa_qc";
  return null;
}
