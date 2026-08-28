// ============================================================
// MÔ HÌNH DỮ LIỆU — APP THU MUA (mã app "tm")
// Ánh xạ đúng Phần 3 của đặc tả:
//   ../../2. THIET KE/01-DAC-TA-APP-THU-MUA-v0.2.md
//
// Quy ước Firestore (khi nối thật):
//   projects/{projectId}/tm_denghi/{prId}
//   projects/{projectId}/tm_donhang/{poId}
//   projects/{projectId}/tm_donhang/{poId}/nhanhang/{grnId}
//   projects/{projectId}/tm_donhang_gia/{poId}      ← GIÁ TÁCH RIÊNG
//   tm_ncc/{supplierId}
// ============================================================

/** Ngày tháng lưu dạng ISO string trong bản chạy thử; Firestore dùng Timestamp. */
export type NgayISO = string;

/** Mô tả tệp đính kèm — nội dung tệp nằm ở `3-du-lieu/kho-tep.ts`, đây chỉ là phần tra cứu. */
export type { MoTaTep } from "@/3-du-lieu/kho-tep";
import type { MoTaTep } from "@/3-du-lieu/kho-tep";

// ------------------------------------------------------------
// DỰ ÁN — đọc từ App Tổng, app thu mua KHÔNG tự sinh mã
// ------------------------------------------------------------

export interface DuAn {
  id: string;
  /** Mã dự án gốc theo Thông báo 09/2026/TB-HPCS, vd 260001-HPCS.
   *  Được cung cấp kèm Đề nghị vì Đề nghị là đề xuất thật từ công trình. */
  maDuAn: string;
  tenCongTrinh: string;
  /** Mã hợp đồng CĐT — thuộc tính của dự án, không phải khóa liên kết. */
  maHopDongCDT?: string;
  chuDauTu?: string;
}

// ------------------------------------------------------------
// ĐỀ NGHỊ MUA HÀNG (PR)
// ------------------------------------------------------------

export type TrangThaiDeNghi =
  | "da_duyet"
  | "dang_phan_bo"
  | "da_phan_bo_du"
  | "dang_thuc_hien"
  | "hoan_thanh"
  | "dong_do";

export type TrangThaiDongDeNghi =
  | "chua_phan_bo"
  | "da_phan_bo"
  | "da_len_po"
  | "dang_giao"
  | "da_nhan_du";

import type { MaPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";

/**
 * Phòng ban gửi đề nghị.
 *
 * 🔴 Từ 12/08/2026 nhận đề xuất từ MỌI phòng ban của công ty (chỉ đạo Ban lãnh đạo).
 * Danh mục 16 phòng ban thật nằm ở `3-du-lieu/danh-muc-phong-ban.ts` — file đó là chỗ
 * duy nhất sửa khi công ty đổi cơ cấu, và là chỗ sẽ nối vào App Tổng sau này.
 *
 * ⚠️ Là chuỗi tự do, KHÔNG phải union đóng — xem lý do ở `MaPhongBan`. Muốn hiện tên
 * phòng ban thì gọi `nhanPhongBan()`, đừng tra Record trực tiếp.
 */
export type PhongBanNguon = MaPhongBan;

/**
 * ★ NHÓM ĐỀ XUẤT — trường "Nhóm đề xuất" trên thẻ của bảng Base.
 *
 * Ban lãnh đạo 14/08/2026 gửi ảnh bảng "TM-QT Mua hàng (HP CONS)" đang chạy thật và chốt:
 * *"ô a khoanh đỏ, e sửa lại app của mình hiển thị các trường thông tin cơ bản vậy là đủ"*.
 * Bốn giá trị dưới đây đọc trực tiếp từ các thẻ trong ảnh đó.
 *
 * 📌 Đây là cách phân loại đề nghị, KHÁC với `phongBanNguon` (ai gửi): cùng Bộ phận Thi công
 * có phiếu xin vật tư, có phiếu thuê dịch vụ, có phiếu mua máy móc — ba việc khác nhau hẳn về
 * cách hỏi giá và bộ chứng từ.
 *
 * ⚠️ `khac` là mặc định cho phiếu cũ lập trước 14/08/2026 — chúng không có trường này, và app
 * KHÔNG đoán ngược từ nội dung vật tư (đoán sai còn tệ hơn để trống).
 */
export type NhomDeXuat = "vat_tu" | "dich_vu" | "mm_ccdc" | "khac";

/** Nhãn hiển thị của nhóm đề xuất — chép đúng chữ trên bảng Base. */
export const NHAN_NHOM_DE_XUAT: Record<NhomDeXuat, string> = {
  vat_tu: "Vật tư",
  dich_vu: "Dịch vụ",
  mm_ccdc: "MM-CCDC",
  khac: "Khác",
};

export interface DongDeNghi {
  /** ★ KHÓA ĐỐI CHIẾU KHỐI LƯỢNG — dòng PO và dòng nhận hàng đều trỏ về đây.
   *  Dùng thay cho mã vật tư (mã vật tư làm ở ver sau). */
  stt: number;
  tenVatLieu: string;
  quyCach?: string;
  donViTinh: string;
  khoiLuongDeNghi: number;
  /** Cột "Mục đích sử dụng" trên phiếu đề nghị của công ty — dùng cho hạng mục nào.
   *  Chuyển tiếp sang `DongPO.mucDichSuDung` khi lập đơn để in ra đơn mua hàng. */
  mucDichSuDung?: string;
  ghiChu?: string;
  /** Cờ cảnh báo QLDA. Ver 1 gán tay; ver sau lấy từ danh mục vật tư. */
  vatTuKiemSoatDinhMuc?: boolean;

  // --- PHÂN BỔ (Trưởng bộ phận thu mua) ---
  /** Trống = CHƯA PHÂN BỔ. */
  nguoiPhuTrachUid?: string;
  nguoiPhuTrachTen?: string;
  nguoiPhanBoTen?: string;
  thoiDiemPhanBo?: NgayISO;
  /**
   * Số báo giá trưởng bộ phận YÊU CẦU nhân viên phải lấy về cho dòng này
   * (Ban lãnh đạo 12/08/2026). Trống = không nêu yêu cầu riêng, cứ theo ngưỡng giá trị
   * trong `2-quy-trinh/nguong-gia-tri.ts`.
   *
   * ⚠️ Đây là YÊU CẦU GIAO VIỆC, khác với số báo giá quy trình bắt buộc theo giá trị đơn.
   * Trưởng bộ phận có thể đòi nhiều hơn mức tối thiểu; app không lấy con số này thay cho
   * việc soát ngưỡng.
   */
  soBaoGiaYeuCau?: number;
  /** Lời dặn kèm theo khi giao việc — hiện cho người được phân bổ đọc. */
  ghiChuPhanBo?: string;
}

export interface DeNghiMuaHang {
  id: string;
  /** vd 260001-HPCS-PR-001 (mã loại PR đang chờ phê duyệt danh mục). */
  code: string;
  maDuAn: string;
  maHopDongCDT?: string;
  tenCongTrinh: string;
  tieuDe: string;
  phongBanNguon: PhongBanNguon;
  /**
   * Nhóm đề xuất — Vật tư · Dịch vụ · MM-CCDC · Khác (theo thẻ bảng Base).
   *
   * ⚠️ Tùy chọn vì phiếu lập trước 14/08/2026 không có. Chỗ hiển thị phải chịu được thiếu
   * (`?? "khac"` hoặc ẩn hẳn dòng), đừng để hiện "undefined" trên thẻ.
   */
  nhomDeXuat?: NhomDeXuat;
  nguoiDeNghiUid: string;
  nguoiDeNghiTen: string;
  ngayDeNghi: NgayISO;
  ngayDuyet: NgayISO;
  ngayCanHang: NgayISO;
  mucDoUuTien: "binh_thuong" | "gap";
  trangThai: TrangThaiDeNghi;
  items: DongDeNghi[];
  /** Nhật ký thao tác — MỌI hành động sửa nội dung đều ghi thêm một dòng vào đây
   *  (ai làm · làm gì · lúc nào). Hiển thị ở khối "Lịch sử" trang chi tiết đề nghị. */
  lichSu: MocLichSu[];
  /** Người được thêm vào để nắm tiến trình. Trống = chưa có ai theo dõi. */
  nguoiTheoDoi?: NguoiTheoDoi[];
  /* 📌 12/08/2026 (chiều): ĐÃ GỠ các trường duyệt hai cấp (`duyetCap1/2`,
     `nguoiDuyetCap1/2`, `duyetBoPhan`). Ban lãnh đạo chốt: việc duyệt đề nghị nằm ở APP
     KHÁC của bộ phận đề xuất — phiếu vào app Thu mua là ĐÃ duyệt (`ngayDuyet` luôn có).
     Dữ liệu cũ trên kho chung còn mang mấy khóa đó thì cứ nằm im, app không đọc nữa. */

  /**
   * ★ ĐÃ LƯU TRỮ — ẩn khỏi bảng quy trình nhưng KHÔNG xóa dữ liệu.
   *
   * Chỉ đạo Ban lãnh đạo 10/08/2026 (menu ⋯ theo Base.vn). Khác "Đóng dở" (`dong_do`):
   * đóng dở là **kết luận nghiệp vụ** — không mua nữa, có ghi lý do, vẫn nằm ở cột "Thất
   * bại" để thống kê. Lưu trữ chỉ là **dọn bảng cho đỡ rối**, hồ sơ vẫn nguyên trạng thái
   * và bỏ lưu trữ là quay lại đúng cột cũ.
   */
  luuTru?: boolean;

  /**
   * ★ ĐỀ NGHỊ GỐC — phiếu này được tách ra từ phiếu nào.
   *
   * 🔴 Ban lãnh đạo 13/08/2026: *"tên của đề xuất giữ nguyên chỉ thêm chữ copy phía sau,
   * để sau này có thể **tổng hợp lại các đề xuất con** của cái đề xuất lớn đó"*.
   *
   * ⚠️ CHỈ DỰA VÀO TÊN LÀ KHÔNG ĐỦ để tổng hợp. Người dùng sửa tên một bản copy là mối
   * liên hệ đứt, mà không có gì báo. Vì vậy quan hệ cha–con lưu bằng **id**, còn tên chỉ
   * để người đọc nhận ra bằng mắt.
   *
   * 📌 CHỈ MỘT CẤP. Nhân bản từ một bản copy thì phiếu mới vẫn trỏ về **phiếu gốc đầu
   * tiên**, không tạo chuỗi cha–con–cháu: mọi bản tách của cùng một đề xuất lớn phải gom
   * được vào một nhóm bằng một phép lọc, không phải đi lần ngược từng đời.
   */
  deNghiGocId?: string;
  /** Mã phiếu gốc — chép sẵn để hiện lên màn hình khỏi phải tra ngược. */
  maDeNghiGoc?: string;
  /**
   * ★ TRƯỜNG BỔ SUNG — cặp nhãn/giá trị do người dùng tự đặt, tương ứng "dữ liệu tùy chỉnh"
   * của Base.vn.
   *
   * ⚠️ CHỈ DÙNG CHO THÔNG TIN PHỤ. Đừng đưa số liệu nghiệp vụ (khối lượng, đơn giá, ngày
   * giao) vào đây — những thứ đó phải có trường riêng để tính toán và đối chiếu được. Trường
   * bổ sung không ai tính toán trên nó, chỉ để đọc.
   */
  truongBoSung?: TruongBoSung[];
  /**
   * ★ LINK PHIẾU ĐỀ NGHỊ — đường dẫn tới bản gốc của phiếu (Drive, SharePoint, ảnh chụp trên
   * HPcore…).
   *
   * 🔴 Thêm 18/08/2026 theo ảnh Ban lãnh đạo gửi: hộp *"Chỉnh sửa các trường dữ liệu tùy chỉnh"*
   * trên Base có trường **"Link phiếu đề nghị *"**, còn app thì chưa có chỗ nào giữ nó.
   *
   * 📌 KHÁC `taiLieu` (tệp đính kèm): đây là **con trỏ tới bản gốc nằm ngoài app** — bản có chữ
   * ký tươi, bản scan lưu ở thư mục chung của phòng. `taiLieu` là bản sao NẰM TRONG app. Hai thứ
   * không thay nhau: có link mà không có tệp thì mở app không xem được nội dung; có tệp mà không
   * có link thì mất dấu bản gốc để đối chiếu khi cần bản cứng.
   *
   * ⚠️ Giữ nguyên chuỗi người dùng gõ, KHÔNG kiểm tra đây có phải địa chỉ web hợp lệ. Chỗ hiển
   * thị chỉ biến thành liên kết bấm được khi chuỗi bắt đầu bằng `http://` hoặc `https://`; còn
   * lại hiện như chữ thường. Bắt đúng định dạng thì người dùng dán mã hồ sơ nội bộ vào đây sẽ bị
   * chặn oan.
   */
  linkPhieuDeNghi?: string;
  /**
   * ★ TÀI LIỆU ĐÍNH KÈM lúc lập phiếu — catalogue, bản vẽ, chứng chỉ; tối đa 10 theo
   * biểu mẫu Base (Ban lãnh đạo 12/08/2026). Đây chỉ là phần MÔ TẢ; nội dung tệp nằm
   * ở kho tệp (`3-du-lieu/kho-tep.ts` → Firestore) nên máy khác mở xem được.
   */
  taiLieu?: MoTaTep[];
  /**
   * ★ TỆP ĐÍNH KÈM CỦA TỪNG BƯỚC — khóa là mã giai đoạn (`GiaiDoanMuaHang`).
   *
   * 🔴 Ban lãnh đạo 17/08/2026 khoanh đỏ khối "Bảng báo giá" ở bước ② và ghi *"mục đính kèm
   * file"*. Trước đó bước ② KHÔNG có chỗ nào bỏ tệp vào: bản báo giá nhà cung cấp gửi về qua
   * Zalo/email chỉ gắn được sau khi đã lập bảng báo giá, mà lúc chưa lập bảng nào thì nhân
   * viên không biết cất vào đâu — chứng từ nằm lại trong điện thoại, hồ sơ thiếu mà không
   * ai biết.
   *
   * 🔴 KHÁC HẲN `taiLieu` ở trên, ĐỪNG GỘP HAI THỨ. `taiLieu` là **hồ sơ đầu vào** người đề
   * nghị nộp kèm lúc lập phiếu (catalogue, bản vẽ) — cố định, không sinh thêm. Còn đây là
   * **chứng từ phát sinh trong lúc chạy quy trình**, mỗi bước một tập riêng, và phải biết
   * chứng từ đó thuộc bước nào mới tra ngược được hồ sơ.
   *
   * 📌 LÀM CHO CẢ 6 BƯỚC chứ không riêng bước ②: hợp đồng, đơn có chữ ký, hóa đơn nhà cung
   * cấp đều là cùng một nhu cầu. Làm lẻ từng chỗ thì sau này app có 5 cơ chế đính kèm khác
   * nhau, mỗi chỗ một kiểu, sửa một lỗi phải sửa năm nơi.
   *
   * 📌 Đây chỉ là phần MÔ TẢ; nội dung tệp nằm ở kho tệp (`3-du-lieu/kho-tep.ts` → Firestore)
   * nên máy khác mở xem được.
   *
   * ⚠️ Khóa để kiểu `string` chứ không phải `GiaiDoanMuaHang`: kiểu giai đoạn nằm ở
   * `2-quy-trinh/`, mà tầng dữ liệu không được phụ thuộc ngược lên tầng quy trình. Cùng cách
   * đã dùng cho `CongViecDaXong.giaiDoan`.
   */
  tepGiaiDoan?: Record<string, MoTaTep[]>;
  /**
   * ★ LÝ DO CHƯA CÓ MỘT CHỨNG TỪ BẮT BUỘC — Ban lãnh đạo 23/08/2026: *"bắt buộc có file đính kèm
   * hoặc ghi chú lý do không đính kèm file thì mới cho chuyển bước… Để biết là còn thiếu hồ sơ để
   * bổ sung sau"*.
   *
   * Khóa là hằng số khai trong `2-quy-trinh/chung-tu-cuoi-quy-trinh.ts`
   * (VD `KHOA_LY_DO_THIEU_HOP_DONG`), KHÔNG phải chuỗi gõ tay ở chỗ gọi.
   *
   * 🔴 CÓ LÝ DO ≠ ĐỦ HỒ SƠ. Trường này chỉ mở đường ĐI TIẾP; hồ sơ vẫn bị tô đỏ cho tới khi tệp
   * thật được đính vào. Đừng dùng nó để tắt cảnh báo.
   */
  lyDoThieuChungTu?: Record<string, string>;
  /**
   * ★ CÔNG VIỆC BẮT BUỘC CỦA GIAI ĐOẠN ĐÃ TÍCH XONG — mục "Danh sách công việc" của Base.
   *
   * Danh mục công việc nằm ở `2-quy-trinh/cau-hinh-quy-trinh.ts` → `congViecTheoBuoc`; ở đây
   * chỉ lưu VIỆC NÀO ĐÃ XONG của riêng đề nghị này, khóa theo `CongViecGiaiDoan.ma`.
   *
   * 📌 Lưu trong chính đề nghị (không tách khóa dữ liệu mới) là cố ý: khỏi phải khai thêm ở
   * `docDuLieuDaLuu` và `chuanHoa` — hai chỗ dùng danh sách trắng, quên khai là mất dữ liệu
   * im lặng (đã dính thật với khóa `cauHinh` ngày 13/08/2026).
   */
  congViecDaXong?: CongViecDaXong[];
  /**
   * ★ BÌNH LUẬN trao đổi trong quy trình (Ban lãnh đạo 15/08/2026).
   *
   * 🔴 KHÁC HẲN `lichSu`, đừng gộp hai thứ. `lichSu` là **app tự ghi** những gì đã xảy ra —
   * không ai sửa, không ai xóa, dùng để truy trách nhiệm. `binhLuan` là **người tự viết** để
   * trao đổi. Trộn chung thì một dòng người dùng gõ tay trông y hệt một dòng máy ghi, và nhật
   * ký mất giá trị làm bằng chứng.
   *
   * ⚠️ Từ 16/08/2026 bình luận **KHÔNG XÓA ĐƯỢC**, chỉ sửa (có lưu vết) hoặc thu hồi — xem
   * `lichSuSua` và `thuHoi` bên dưới.
   */
  binhLuan?: BinhLuan[];

  /**
   * ★ MÃ ĐỀ XUẤT gốc bên App Request — khóa liên kết duy nhất giữa App Request, App Thu
   * mua và (sau này) QLK CTR cho cùng một đề xuất.
   *
   * 🔴 Thêm 19/08/2026 cho Việc 1 "liên kết App Request ↔ App Thu mua" (Sếp chốt): App
   * Request tự sinh mã đề xuất 6 số (vd `01234`) cho MỌI đề xuất duyệt xong, có công trình
   * hay không. Trường này CHÍNH LÀ mã đó — dùng để (a) chống tạo trùng khi App Request gọi
   * lại (mạng lỗi, thử lại), (b) sau này khi Việc 2 (PO ↔ QLK CTR) triển khai, đây là khóa
   * để đối chiếu đúng đề nghị mà không cần biết id nội bộ của app nào.
   *
   * Trống = đề nghị lập tay trong app (không qua App Request) — vẫn là phần lớn dữ liệu
   * chạy thử hiện tại.
   */
  maDeXuatAppRequest?: string;
  /**
   * ★ LÝ DO HỒ SƠ THẤT BẠI — ghi khi đóng dở đề nghị (`trangThai === "dong_do"`).
   *
   * 🔴 Ban lãnh đạo 24/08/2026: *"Ở bước thất bại chỉ cần ghi lý do thất bại. Không cần ghi các
   * thông tin thiếu này"*. Trước đó `dongDoDeNghi` KHÔNG nhận lý do, nhật ký chỉ ghi *"Đóng dở đề
   * nghị"* — hồ sơ nằm cột Thất bại mà không ai biết vì sao, trong khi đây là dữ liệu phải giữ
   * lâu nhất (thống kê nhà cung cấp trượt, giải trình với công trình).
   *
   * ⚠️ ĐẶT TÊN KHÁC `lyDoHuyHoacDongDo` của `DonDatHang` là CỐ Ý, không phải quên dùng lại: đó là
   * lý do hủy/đóng dở một ĐƠN HÀNG (chuyện giữa Thu mua và nhà cung cấp), còn đây là lý do cả HỒ
   * SƠ ĐỀ NGHỊ không mua được (chuyện với công trình). Gộp một tên là sớm muộn có người đọc lý do
   * của đơn rồi tưởng là lý do của hồ sơ.
   *
   * ⚠️ Trống ở hồ sơ đóng dở TRƯỚC 24/08/2026 — khi đó app chưa có chỗ ghi. Giao diện phải chịu
   * được `undefined`, và KHÔNG bịa câu thay thế (nói "không rõ lý do" thì người đọc tưởng app
   * mất dữ liệu).
   */
  lyDoThatBai?: string;
}

/**
 * Một lần sửa bình luận.
 *
 * 🔴 PHẢI LƯU CẢ NỘI DUNG CŨ, không chỉ mốc thời gian. Ban lãnh đạo 16/08/2026 yêu cầu *"ghi
 * lại lịch sử"* — mà biết "đã sửa lúc 14:20" nhưng không biết sửa TỪ GÌ THÀNH GÌ thì vết sửa
 * vô dụng đúng lúc cần nhất: khi hai bên nói khác nhau về việc đã trao đổi gì.
 */
export interface LanSuaBinhLuan {
  thoiDiem: NgayISO;
  nguoiSuaUid: string;
  nguoiSuaTen: string;
  /**
   * Nội dung TRƯỚC lần sửa này. Vắng nghĩa là đã bị rơi bớt để tiết kiệm dung lượng — xem
   * luật cắt ở `suaBinhLuan`. Bản gốc đầu tiên thì không bao giờ rơi.
   */
  noiDungTruoc?: string;
}

/**
 * Tệp đã bị gỡ khỏi bài.
 *
 * ⚠️ NỘI DUNG TỆP VẪN CÒN trong kho tệp — chỉ gỡ khỏi bài, không xóa. Gỡ mà xóa luôn nội dung
 * thì "không cho xóa" chỉ đúng với chữ, còn chứng từ đính kèm vẫn biến mất được.
 */
export interface TepDaGo {
  tep: MoTaTep;
  nguoiGoUid: string;
  nguoiGoTen: string;
  thoiDiem: NgayISO;
}

/** Bài bị thu hồi — thay cho việc xóa. Bài vẫn nằm nguyên chỗ, chỉ ẩn phần chữ. */
export interface ThuHoiBinhLuan {
  nguoiUid: string;
  nguoiTen: string;
  thoiDiem: NgayISO;
}

/** Một lời bình trong hồ sơ. Ảnh/tài liệu kèm theo nằm ở `tep`. */
export interface BinhLuan {
  id: string;
  nguoiVietUid: string;
  nguoiVietTen: string;
  /** ISO đầy đủ giờ phút. */
  thoiDiem: NgayISO;
  noiDung: string;
  /**
   * Ảnh và tài liệu đính kèm — phần MÔ TẢ, nội dung tệp nằm ở kho tệp
   * (`3-du-lieu/kho-tep.ts` → Firestore) nên máy khác mở xem được.
   */
  tep?: MoTaTep[];
  /**
   * Trả lời bình luận nào — trống là bình luận gốc.
   *
   * 📌 CHỈ MỘT CẤP, giống cách làm với `deNghiGocId`: trả lời của trả lời vẫn trỏ về bài gốc
   * đầu tiên. Cây nhiều tầng đọc trên màn hẹp là không xem được, mà nghiệp vụ cũng không cần.
   */
  traLoiChoId?: string;

  // --- Ba trường dưới thêm 16/08/2026: chỉ sửa, không xóa, có lưu vết ---
  // ⚠️ TẤT CẢ ĐỀU TÙY CHỌN. Bình luận viết trước ngày này không có chúng, và như vậy là đúng:
  // chúng chưa từng bị sửa nên không được đeo nhãn "đã sửa".

  /** Các lần đã sửa, cũ trước mới sau. Trống hoặc vắng = chưa sửa lần nào. */
  lichSuSua?: LanSuaBinhLuan[];
  /** Tệp đã gỡ khỏi bài — giữ lại để thấy bài từng đính kèm gì. */
  tepDaGo?: TepDaGo[];
  /** Có thì bài này đã bị thu hồi; phần chữ chỉ người có quyền mới xem lại được. */
  thuHoi?: ThuHoiBinhLuan;
}

/** Một công việc của giai đoạn đã được tích hoàn thành. */
export interface CongViecDaXong {
  /** Khóa công việc — khớp `CongViecGiaiDoan.ma` trong cấu hình quy trình. */
  maCongViec: string;
  /** Mã giai đoạn lúc tích xong — giữ để tra lại, vì cấu hình có thể đổi sau. */
  giaiDoan: string;
  nguoiXongTen: string;
  thoiDiem: NgayISO;
}

/** Một cặp nhãn/giá trị người dùng tự thêm vào đề nghị. */
export interface TruongBoSung {
  nhan: string;
  giaTri: string;
}

/**
 * Người theo dõi một đề nghị — người muốn nắm tiến trình nhưng KHÔNG làm gì trên đó.
 * Tương đương "người theo dõi" của một nhiệm vụ trên Base.vn.
 *
 * ⚠️ ĐỪNG NHẦM với màn "Theo dõi đề nghị" (`/theo-doi`) — màn đó là chỗ Phòng Thi công
 * xem tiến trình đề nghị DO CHÍNH HỌ gửi. Còn đây là danh sách người được thêm vào.
 *
 * 🔴 Có tên trong danh sách này KHÔNG mở khóa việc xem giá. Đơn giá nằm ở chứng từ riêng
 * `tm_donhang_gia`, chặn bằng Security Rule của chứng từ đó — đúng nguyên tắc dữ liệu số 3.
 */
export interface NguoiTheoDoi {
  uid: string;
  ten: string;
  chucDanh: string;
  /** Ai đã thêm người này vào — để truy được trách nhiệm. */
  nguoiThemTen: string;
  thoiDiemThem: NgayISO;
}

export interface MocLichSu {
  thoiDiem: NgayISO;
  nguoiThucHien: string;
  hanhDong: string;
  ghiChu?: string;
}

// ------------------------------------------------------------
// NHÀ CUNG CẤP
// ------------------------------------------------------------

/**
 * ★ THỦ KHO CÔNG TRÌNH — danh mục người nhận hàng tại chân công trình.
 *
 * ★ Ban lãnh đạo 22/08/2026: *"Thêm trường nhập liệu thông tin thủ kho công trình và cho lưu lại"*.
 *
 * 🔴 VÌ SAO KHÔNG DÙNG DANH BẠ NHÂN SỰ CHO VIỆC NÀY: danh bạ chỉ có người **đã có tài khoản** trên
 * hệ thống. Thủ kho ở công trường phần lớn chưa có tài khoản, nên trước đây mỗi lần lập đơn là gõ
 * lại tên và số điện thoại từ đầu — gõ mười lần thì có mười cách viết, và số điện thoại thì hay
 * gõ sai một chữ số. Nhà cung cấp gọi vào số sai là hàng không giao được.
 *
 * 📌 Đây là danh mục NGƯỜI DÙNG TỰ THÊM, cùng cách làm với `NhaCungCap` do thu mua tự điền.
 */
export interface ThuKhoCongTrinh {
  id: string;
  ten: string;
  /** Số nhà cung cấp gọi để hẹn giao hàng — lý do chính phải lưu danh mục này. */
  soDienThoai?: string;
  /** Công trình / dự án người này phụ trách, để chọn đúng người khi có nhiều thủ kho. */
  congTrinh?: string;
  ghiChu?: string;
}

export interface NhaCungCap {
  id: string;
  ten: string;
  dienThoai?: string;
  diaChi?: string;
  /** Ô "Mã số thuế" trên mẫu đơn mua hàng của công ty. */
  maSoThue?: string;
  /**
   * ★ Mã nhà cung cấp do người dùng đặt (vd `NCC0001`) — ô "Mã nhà cung cấp" trên màn
   * Đơn mua hàng của MISA (chỉ đạo Ban lãnh đạo 17/08/2026: *"cấu hình cho a bước lập đơn
   * mua hàng có chức năng giống này 100%"*).
   *
   * ⚠️ KHÁC HẲN `id`. `id` là khóa kỹ thuật, người dùng không nhìn thấy và không gõ được;
   * `maNCC` là mã nghiệp vụ in trên chứng từ, có thể đổi mà không làm mồ côi dữ liệu cũ.
   * Gộp hai thứ này là mỗi lần kế toán đổi mã thì mọi đơn hàng cũ mất liên kết nhà cung cấp.
   *
   * 🔴 KHÔNG bám hệ mã `DMH…` của MISA. Mã hồ sơ của công ty theo Thông báo 09/2026 (TGĐ ký).
   */
  maNCC?: string;
  /** ★ Ô "Người liên hệ" trên màn MISA — người bên NCC để gọi khi cần giục hàng. */
  nguoiLienHe?: string;
}

// ------------------------------------------------------------
// ĐƠN ĐẶT HÀNG (PO) — KHÔNG CHỨA GIÁ
// ------------------------------------------------------------

export type TrangThaiPO =
  | "nhap"
  | "da_chot"
  | "dang_giao"
  | "cho_xac_nhan_hoan_thanh"
  | "hoan_thanh"
  | "huy";

/**
 * Một dòng trên đơn mua hàng.
 *
 * 📄 Các trường dưới đây ánh xạ 1-1 với cột của biểu mẫu công ty
 *    `1. INPUT/Bieu mau/1. DON HANG HPCONS.xlsx` (dòng tiêu đề bảng, ô A11:J11):
 *    STT · Mã hàng · Tên hàng · Thông số kỹ thuật · ĐVT · SL · Đơn giá · Thành tiền · Mục đích sử dụng
 *
 * 🔴 Đơn giá và Thành tiền KHÔNG nằm ở đây — chúng ở `GiaDonDatHang` (chứng từ riêng),
 *    vì Firestore chặn quyền theo document chứ không theo trường (nguyên tắc dữ liệu số 3).
 */
export interface DongPO {
  sttDong: number;
  /**
   * ★ Trỏ về `DongDeNghi.stt` — khóa truy vết khối lượng.
   *
   * 🔴 TỪ 18/08/2026 LÀ TÙY CHỌN, và BA giá trị mang BA nghĩa khác hẳn nhau:
   *
   *   · một số ≥ 1  → dòng hàng trừ khối lượng vào đúng dòng đó của phiếu đề nghị (đường cũ)
   *   · `0`         → **dòng ghi chú** (xem `laDongGhiChu` bên dưới) — quy ước có từ trước
   *   · `undefined` → dòng hàng của **đơn KHÔNG gắn đề nghị nào** (module "Lập đơn mua hàng
   *     (PO)" độc lập, chỉ đạo Ban lãnh đạo 18/08/2026)
   *
   * 🔴 KHÔNG DÙNG `0` CHO DÒNG ĐỘC LẬP dù nghe cũng là "không trỏ về đâu". `0` đã mang nghĩa
   * dòng ghi chú từ trước; chồng hai nghĩa lên một giá trị là mầm lỗi — mai kia ai đó lọc
   * `sttDongDeNghi === 0` để tìm dòng ghi chú sẽ vơ luôn cả dòng hàng thật.
   *
   * ⚠️ Mọi chỗ so `d.sttDongDeNghi === <stt của đề nghị>` vẫn đúng nguyên: `undefined` không
   * bằng số nào, nên đơn độc lập **không trừ khối lượng của bất kỳ đề nghị nào** và không
   * làm lệch `tinhTienDoDeNghi` / `xacDinhGiaiDoan`.
   */
  sttDongDeNghi?: number;
  /**
   * Mã hàng trong danh mục vật tư, vd `VT00027` (thấy trên ĐMH0875-25 của công ty).
   * ⚠️ Ver 1 để TRỐNG được: quyết định 1 của dự án là "đặt mã vật tư làm sau",
   * đối chiếu khối lượng vẫn dựa vào `sttDongDeNghi`. Có mã thì in ra đơn cho khớp mẫu.
   */
  maHang?: string;
  tenVatLieu: string;
  /** Cột "Thông số kỹ thuật" — quy cách, mác, tiêu chuẩn. */
  thongSoKyThuat?: string;
  donViTinh: string;
  khoiLuongDat: number;
  /** Cột "Mục đích sử dụng" — dùng cho hạng mục nào của công trình. */
  mucDichSuDung?: string;
  /**
   * ★ Cột "Trường mở rộng 1" của màn Đơn mua hàng MISA (chỉ đạo Ban lãnh đạo 17/08/2026).
   *
   * Ô chữ tự do, app KHÔNG diễn giải nội dung. Cố ý để trống nghĩa: mỗi công trình dùng nó
   * cho một việc khác nhau (số lô, ký hiệu bản vẽ, đợt đổ bê tông…). Đặt tên có nghĩa sẵn
   * thì chỗ nào không dùng đúng nghĩa đó lại phải thêm cột mới.
   */
  truongMoRong1?: string;
  /**
   * ★ ĐÂY LÀ DÒNG GHI CHÚ, KHÔNG PHẢI DÒNG HÀNG.
   *
   * Nút "Thêm ghi chú" của MISA chèn một DÒNG vào giữa bảng hàng (không phải ô ghi chú riêng
   * bên ngoài), dùng để tách nhóm vật tư hoặc dặn nhà cung cấp ngay tại chỗ.
   *
   * Quy ước khi `laDongGhiChu === true`:
   *   • `tenVatLieu` giữ NỘI DUNG ghi chú (cột "Tên hàng" trên mẫu in).
   *   • `sttDongDeNghi = 0` · `donViTinh = ""` · `khoiLuongDat = 0` — dòng này không trỏ về
   *     đề nghị nào và không có khối lượng.
   *
   * 🔴 MỌI HÀM TÍNH TOÁN PHẢI LOẠI DÒNG NÀY RA TRƯỚC. Dùng `laDongHang()` ở
   * `2-quy-trinh/tinh-toan.ts`. Không loại thì dòng ghi chú bị đếm vào mẫu số của
   * `phanTramPO` (% tiến độ sai) và nằm chờ nhận hàng vĩnh viễn ở bảng tiến độ.
   */
  laDongGhiChu?: boolean;
}

export interface XacNhan {
  uid: string;
  ten: string;
  thoiDiem: NgayISO;
}

/**
 * ★ HAI MẪU IN ĐƠN MUA HÀNG — biểu mẫu `PO - DEMO 130826.xlsx` (Ban lãnh đạo gửi 21/08/2026).
 * Xem chú thích của `DonDatHang.mauPO` để biết khi nào dùng mẫu nào.
 */
export type MauDonMuaHang = "thoa_thuan" | "theo_hop_dong";

/**
 * Nhãn hai mẫu — dùng chung cho ô chọn ở màn lập đơn và cho tiêu đề tờ in.
 *
 * ★ ĐẶT TÊN THEO MÃ BIỂU MẪU — Ban lãnh đạo 25/08/2026: *"Đổi tên 2 mẫu này: 1. Mẫu PO-01 - Đơn
 * mua hàng · 2. Mẫu PO-02 - Đơn mua hàng kèm thoả thuận"*.
 *
 * ★★ ĐỔI LẦN HAI — Ban lãnh đạo 27/08/2026: *"ĐỔI TÊN 2 MẪU NÀY CHO A"*, kèm ảnh ghi rõ:
 *     `Mẫu PO-01 - ĐƠN MUA HÀNG` · `Mẫu PO-02 - ĐƠN MUA HÀNG / THOẢ THUẬN MUA BÁN`
 *
 * 🔴 KHÔNG PHẢI CHỈ VIẾT HOA. Tên mẫu PO-02 đổi cả NGHĨA: từ *"kèm thoả thuận"* (nghe như đơn
 * mua hàng có kèm thêm một thoả thuận) thành *"ĐƠN MUA HÀNG / THOẢ THUẬN MUA BÁN"* — tức chính
 * tờ đơn ĐÓNG CẢ HAI vai. Đó mới đúng bản chất pháp lý của mẫu này, và nay khớp y hệt tiêu đề
 * in trên giấy (`tieuDeIn`), nên người lập chọn ở ô nào cũng đọc ra đúng tờ mình sắp in.
 *
 * ⚠️ CHÍNH TẢ ĐỂ NGUYÊN NHƯ SẾP VIẾT: nhãn dùng **"THOẢ"**, còn `tieuDeIn` vẫn là **"Thỏa"** theo
 * biểu mẫu giấy của công ty. Hai cách viết đều đúng tiếng Việt; đừng "thống nhất" bằng cách sửa
 * `tieuDeIn` — đó là chữ chép từ giấy, sửa là lệch biểu mẫu.
 *
 * 🔴🔴 `nhan` VÀ `tieuDeIn` LÀ HAI THỨ KHÁC NHAU, ĐỪNG GỘP:
 *   · `nhan`     = chữ trong ô chọn, người **nội bộ** đọc để chọn đúng biểu mẫu → mang mã PO-01 /
 *                  PO-02 cho khớp bộ biểu mẫu của công ty.
 *   · `tieuDeIn` = chữ **in lên tờ giấy gửi nhà cung cấp** → TUYỆT ĐỐI không mang mã nội bộ. Nhà
 *                  cung cấp nhận một chứng từ đề *"Mẫu PO-01"* thì không hiểu đó là văn bản gì;
 *                  tờ đơn phải tự xưng đúng loại văn bản của nó.
 *
 * 🔴 ÁNH XẠ THEO NGHĨA PHÁP LÝ, KHÔNG THEO THỨ TỰ CŨ TRONG Ô CHỌN:
 *   · PO-02 *"ĐƠN MUA HÀNG / THOẢ THUẬN MUA BÁN"* → `thoa_thuan` — chính tờ đơn có giá trị như
 *     hợp đồng, nên tờ in có thêm hai câu cam kết ở cuối.
 *   · PO-01 *"ĐƠN MUA HÀNG"*                      → `theo_hop_dong` — điều khoản nằm ở hợp đồng
 *     nguyên tắc đã ký, tờ in chỉ dẫn lại hợp đồng đó (nguyên văn ghi chú người lập gõ) và KHÔNG
 *     cam kết lại.
 * Đổi nhãn máy móc theo vị trí cũ là gán tên có chữ "thoả thuận" cho mẫu **không** có thoả thuận —
 * người lập chọn nhầm là gửi cho nhà cung cấp một chứng từ nói sai về căn cứ pháp lý.
 *
 * 📌 THỨ TỰ KHAI Ở ĐÂY QUYẾT ĐỊNH THỨ TỰ TRONG Ô CHỌN (dropdown dựng bằng `Object.keys`). Xếp
 * PO-01 trước PO-02 cho đúng số thứ tự Ban lãnh đạo đánh.
 */
export const NHAN_MAU_PO: Record<MauDonMuaHang, { nhan: string; tieuDeIn: string; moTa: string }> = {
  theo_hop_dong: {
    nhan: "Mẫu PO-01 - ĐƠN MUA HÀNG",
    tieuDeIn: "Đơn mua hàng",
    /* ⚠️ CHỮ CHẠY TRÊN GIAO DIỆN (hiện dưới ô chọn mẫu ở form lập đơn), không phải chú thích.
       Từ 27/08/2026 app KHÔNG tự dựng số và ngày nữa — nói ngược lại là hứa một việc app không làm. */
    moTa: "Đã có hợp đồng nguyên tắc — tờ đơn dẫn lại hợp đồng đó theo ô ghi chú bạn nhập.",
  },
  thoa_thuan: {
    nhan: "Mẫu PO-02 - ĐƠN MUA HÀNG / THOẢ THUẬN MUA BÁN",
    tieuDeIn: "Đơn mua hàng / Thỏa thuận mua bán",
    moTa: "Chưa có hợp đồng riêng — chính tờ đơn có giá trị như hợp đồng khi hai bên ký.",
  },
};

export interface DonDatHang {
  id: string;
  /**
   * vd 260001-HPCS-PO-001 — theo Thông báo 09/2026/TB-HPCS (TGĐ ký 11/07/2026).
   *
   * 🔴 KHÔNG đổi sang kiểu `DMH0532-26` của MISA dù màn hình bám theo MISA. Bản thân mã
   * loại `PO` vẫn ĐANG CHỜ đơn vị quản lý hệ thống duyệt (quy tắc E-6), nên nó để ở
   * `2-quy-trinh/cau-hinh-quy-trinh.ts` sửa được, không viết cứng ở đây.
   */
  code: string;
  maDuAn: string;
  /**
   * ★ GHI CHÚ HỢP ĐỒNG — chữ in nguyên văn sau *"Theo hợp đồng:"* trên tờ đơn mẫu PO-01.
   *
   * 🔴 Ban lãnh đạo 27/08/2026: *"Dòng theo hợp đồng sẽ nhập thủ công, e để sẵn ô để ghi chú"*.
   * Trước đó đây là SỐ hợp đồng thuần và tờ in tự ghép thêm *"· Ký ngày …"*. Nay là chuỗi tự do:
   * người lập gõ cả số lẫn ngày ký (hoặc bất cứ gì cần dẫn), app chép lại y nguyên.
   *
   * ⚠️ ĐỪNG ĐỔI TÊN TRƯỜNG dù tên không còn khớp nghĩa: `5-ket-noi/gui-po-qlk-ctr.ts` đọc nó để
   * dựng payload gửi sang QLK CTR, mà tệp đó thuộc vùng cấm sửa của phiên tích hợp (CLAUDE.md
   * §6.6) — đổi tên là gãy typecheck ở chỗ mình không được phép sửa.
   *
   * ⚠️ CÙNG TÊN nhưng KHÁC THỰC THỂ với `DuAn.maHopDongCDT` và `DeNghiMuaHang.maHopDongCDT` —
   * hai chỗ đó vẫn là MÃ hợp đồng thuần, đừng dọn nhầm.
   */
  maHopDongCDT?: string;
  /**
   * ⚠️ TRƯỜNG CŨ — KHÔNG CÒN NHẬP MỚI TỪ 27/08/2026, nhưng ĐỪNG XÓA.
   *
   * Ô "Ngày hợp đồng" của màn MISA đã bị bỏ khỏi form: ngày ký nay nằm ngay trong `maHopDongCDT`.
   * Giữ khai báo vì các đơn lập trước ngày đó còn mang giá trị này trong Firestore — xóa đi là
   * đọc lên gãy kiểu, mà dữ liệu chứng từ đã phát hành thì không được sửa ngược.
   */
  ngayHopDongCDT?: NgayISO;
  /**
   * ★ ĐỀ NGHỊ NGUỒN — TỪ 18/08/2026 LÀ TÙY CHỌN.
   *
   * 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 18/08/2026: *"MUC NAY SE LA MODUL RIENG, KHONG LIEN QUAN GI TOI
   * QUY TRINH, NO CHI DE PHUC VU LAP DON DAT HANG, NEN E KO CAN LINK NO TOI CAC BUOC QUY
   * TRINH"*. Mục menu "Lập đơn mua hàng (PO)" nay lập được đơn KHÔNG gắn đề nghị nào.
   *
   * Bỏ trống cả hai (`prId` và `prCode` luôn đi cặp) = **đơn KHÔNG gắn đề nghị**.
   *
   * 🔴 NHƯNG ĐƠN KIỂU ĐÓ **KHÔNG CẤT ĐƯỢC VÀO HỆ THỐNG** (siết lại chiều 18/08/2026, sau khi
   * Ban lãnh đạo chốt module "Lập đơn mua hàng (PO)" *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*):
   * `themDonHang` từ chối ngay khi `prId` rỗng, vì đơn không có bảng báo giá nào để đối chiếu
   * thì cũng không qua được chốt KIỂM SOÁT CHI TIÊU `vuongMacLapDonHang`.
   *
   * Vậy hai trường này để tùy chọn cho ai còn dùng chúng:
   *   · **Bản mẫu in / xuất Excel** — `2-quy-trinh/don-hang-mau.ts` dựng một `DonDatHang` tạm
   *     trong bộ nhớ, không bao giờ vào kho. Đây là chỗ dùng thật duy nhất hiện nay.
   *   · Dữ liệu cũ hoặc nguồn ngoài có thể thiếu trường.
   *
   *   ⚠️ `maDuAn` VẪN BẮT BUỘC, kể cả với bản mẫu, vì mã đơn `260001-HPCS-PO-001` lấy phần đầu
   *      từ mã dự án.
   *
   * 🔴 MỌI CHỖ ĐỌC HAI TRƯỜNG NÀY PHẢI CHỊU ĐƯỢC `undefined`: trang chi tiết đơn (ô "Đề nghị
   * nguồn" + liên kết), danh sách đơn, trang in A4, file Excel xuất ra, thẻ ở Tổng quan, ô
   * tìm kiếm. Để nguyên là link chết `/de-nghi/` và chứng từ in ra trống một dòng.
   */
  prId?: string;
  prCode?: string;
  /**
   * ★ Ô "Mã RQ - Tên Công trình" của màn MISA. `prCode` đã giữ mã RQ, còn TÊN công trình
   * trước 17/08/2026 KHÔNG có chỗ nào trên đơn — trang in `/in/don-hang/[id]` in dòng
   * "Mã đề xuất và tên công trình" mà chỉ ra được mã, phần tên bỏ trống.
   *
   * Chép sang đơn (thay vì tra ngược đề nghị mỗi lần hiển thị) là CỐ Ý: đơn mua hàng là
   * chứng từ gửi ra ngoài công ty, nội dung đã in phải đứng yên kể cả khi đề nghị nguồn
   * bị sửa tên hoặc bị đóng sau đó.
   */
  tenCongTrinh?: string;
  supplierId: string;
  supplierTen: string;
  /**
   * ★ BA TRƯỜNG NHÀ CUNG CẤP CHÉP THẲNG LÊN ĐƠN (chỉ đạo Ban lãnh đạo 17/08/2026).
   *
   * 🔴 Trước 17/08/2026 màn lập đơn CÓ ô nhập mã số thuế và địa chỉ nhưng KHÔNG lưu đi đâu:
   * chỉ `supplierId` + `supplierTen` được truyền vào `themDonHang`. Trang in phải tra ngược
   * danh mục `NHA_CUNG_CAP` qua `supplierId`, mà danh mục đó là hằng số cứng và app không có
   * đường thêm nhà cung cấp mới. Hệ quả: NCC ngoài danh mục thì đơn in ra hiện "—" ở dòng
   * Địa chỉ và Mã số thuế — chứng từ gửi nhà cung cấp thiếu mã số thuế.
   *
   * Vì vậy lưu ngay trên đơn. Danh mục chỉ còn là chỗ GỢI Ý lúc nhập, không phải nguồn duy nhất.
   *
   * ⚠️ Đây KHÔNG phải thông tin nhạy cảm về giá → để ở `tm_donhang` là đúng chỗ. Thủ kho cần
   * biết địa chỉ và người liên hệ của NCC để nhận hàng.
   */
  maSoThueNCC?: string;
  diaChiNCC?: string;
  /** Ô "Người liên hệ" trên màn MISA — người bên NCC, kèm số điện thoại nếu có. */
  nguoiLienHeNCC?: string;
  /*
   * ❌ ĐÃ BỎ trường `dienGiai` (Ban lãnh đạo 21/08/2026: *"CHẤP NHẬN BỎ"*).
   * Nó là ô "Diễn giải" bắt chước màn MISA, nhưng trong app này **chưa từng hiện ở đâu**:
   * không có trên tờ in A4, không có ở danh sách đơn hàng. Người dùng gõ vào rồi không thấy lại
   * bao giờ — đúng cái lỗi "giao diện hứa một việc app không làm" ở CLAUDE.md §3.5.
   * Việc mô tả đơn đã có `ghiChu` (dặn dò nội bộ) và `dieuKhoanKhac` (điều khoản với NCC) lo.
   * ⚠️ Đơn cũ trong Firestore có thể còn khóa `dienGiai`; nó chỉ nằm im, không ai đọc nữa.
   */
  /** ★ Ô "Tham chiếu" của màn MISA — số chứng từ bên ngoài liên quan (đơn cũ, email, hợp đồng). */
  thamChieu?: string;
  nguoiPhuTrachUid: string;
  /** Ô "Nhân viên mua hàng" trên màn MISA. */
  nguoiPhuTrachTen: string;
  ngayLapPO: NgayISO;
  /**
   * ★ NGÀY GIAO HÀNG — nay là **ngày BẮT ĐẦU** của khoảng nhận hàng.
   *
   * Ban lãnh đạo 27/08/2026: *"Mục này cho chọn thời gian nhận hàng. Từ ngày này tới ngày
   * khác"*. Trước đó đây là một ngày duy nhất cho cả đơn.
   *
   * 🔴 GIỮ NGUYÊN TÊN VÀ GIỮ BẮT BUỘC. Đây là trường đã có trong mọi đơn đang chạy; đổi tên
   * hoặc cho phép rỗng là đơn cũ đọc lên gãy kiểu, mà chứng từ đã phát hành thì không được sửa
   * ngược. Khoảng ngày làm bằng cách THÊM một trường kết thúc, không đụng trường này.
   */
  ngayGiaoDuKien: NgayISO;
  /**
   * ★ Ngày KẾT THÚC của khoảng nhận hàng — thêm 27/08/2026.
   *
   * 📌 TÙY CHỌN, và bỏ trống là chuyện bình thường: đơn hẹn giao gọn trong một ngày thì chỉ
   * điền ngày bắt đầu. Nơi hiển thị phải tự lo hai ca — có khoảng thì in "từ … đến …", không
   * thì in đúng một ngày như trước.
   *
   * ⚠️ ĐƠN CŨ KHÔNG CÓ TRƯỜNG NÀY. Đừng viết chỗ nào đọc thẳng `.slice()` hay `new Date()` lên
   * nó mà không kiểm rỗng trước.
   */
  ngayGiaoDenNgay?: NgayISO;
  /**
   * ★ GHI CHÚ về thời gian giao hàng — Ban lãnh đạo 27/08/2026: *"Thêm cột ghi chú thời gian
   * giao hàng"*, mũi tên chỉ đúng chỗ trống cạnh hai ô ngày.
   *
   * 📌 VÌ SAO CẦN, DÙ ĐÃ CÓ KHOẢNG NGÀY: khoảng ngày nói được *"giao trong tuần này"*, nhưng
   * không nói được những điều kiện thật hay gặp khi hẹn xe — *"giao buổi sáng, sau 8h"*, *"gọi
   * trước 1 ngày"*, *"chia 2 đợt, đợt sau khi có mặt bằng"*, *"nghỉ lễ không nhận hàng"*. Không
   * có chỗ ghi thì người lập nhét vào ô "Điều khoản khác" — lẫn với điều khoản thương mại, và
   * nhà cung cấp đọc tờ đơn không thấy nó ở chỗ đáng thấy.
   *
   * 📌 Tùy chọn. In kèm dòng "Ngày giao hàng" trên tờ đơn, không phải một dòng riêng.
   */
  ghiChuThoiGianGiao?: string;
  /**
   * ★ MÃ ĐỀ XUẤT BÊN APP REQUEST của phiếu đề nghị nguồn — CHÉP SANG lúc lập đơn.
   *
   * 🔴 Ban lãnh đạo 27/08/2026, chỉ dòng "Mã đề xuất và tên công trình" trên tờ in: *"Hiển thị ở
   * đây đang bị sai … Mã đề xuất từ đề nghị 0000046"*.
   *
   * VÌ SAO PHẢI CHÉP SANG PO chứ không tra ngược đề nghị: tờ in `ToDonMuaHangA4` chỉ nhận `po`,
   * và bản in MẪU thì không có đề nghị nào để tra. Chép sang lúc lập đơn cũng đúng bản chất chứng
   * từ: đơn đã phát hành phải giữ nguyên mã tại thời điểm lập.
   *
   * ⚠️ ĐỪNG NHẦM VỚI `prCode`. `prCode` là mã hồ sơ nội bộ (`DeNghiMuaHang.code`), với phiếu đến
   * từ App Request thì nó là chuỗi dài *mã · hợp đồng · TÊN CÔNG TRÌNH* — chính thứ in ra sai mà
   * Ban lãnh đạo khoanh đỏ. Giữ `prCode` làm đường lui cho đơn không qua App Request.
   */
  maDeXuatAppRequest?: string;
  dieuKienGiaoHang?: string;
  /** Ô "Địa điểm giao hàng" trên mẫu đơn — thường là chân công trình. */
  diaDiemGiaoHang?: string;
  /** Ô "Người Nhận" trên mẫu đơn — người BÊN MUA đứng ra nhận hàng. */
  nguoiNhanHangTen?: string;
  /**
   * Số điện thoại người nhận hàng — ô "Số điện thoại" đứng cạnh "Người nhận hàng" trên biểu mẫu
   * `PO - DEMO 130826.xlsx` (Ban lãnh đạo gửi 21/08/2026).
   *
   * 📌 Nhà cung cấp gọi số này để hẹn giao hàng. Thiếu nó thì tài xế tới cổng không biết gọi ai —
   * đó là lý do biểu mẫu giấy để hẳn một ô riêng.
   */
  nguoiNhanHangSdt?: string;
  /**
   * ★ CHỌN 1 TRONG 2 MẪU IN — Ban lãnh đạo 21/08/2026: *"có trường tuỳ chọn 1 trong 2 mẫu"*.
   *
   * Hai mẫu trong biểu mẫu công ty khác nhau ở chỗ **đơn này đã có hợp đồng trước hay chưa**:
   *   · `thoa_thuan` — tiêu đề *"ĐƠN MUA HÀNG / THỎA THUẬN MUA BÁN"*. Dùng khi KHÔNG có hợp đồng
   *     riêng: chính tờ đơn có giá trị như hợp đồng, nên cuối tờ có hai câu cam kết cố định.
   *   · `theo_hop_dong` — tiêu đề *"ĐƠN MUA HÀNG"*, thêm dòng *"Theo hợp đồng: …"* in nguyên văn
   *     ghi chú người lập gõ ở `maHopDongCDT` (để trống thì in dải chấm để viết tay).
   *     Dùng khi đã ký hợp đồng nguyên tắc; điều khoản nằm ở hợp đồng nên tờ đơn không cam kết lại.
   *
   * ⚠️ TÙY CHỌN, mặc định `thoa_thuan`: đơn cũ không có trường này, và phần lớn đơn lẻ không có
   * hợp đồng riêng. Đọc `undefined` thành `theo_hop_dong` là in thiếu hai câu cam kết trên chứng
   * từ đã gửi nhà cung cấp.
   */
  mauPO?: MauDonMuaHang;
  /**
   * ★ Khối "Phương thức giao hàng" in ở cuối tờ đơn — SỬA ĐƯỢC từ 22/08/2026
   * (Ban lãnh đạo: *"mục đơn PO này hãy tạo thành trường có thể sửa được nội dung"*).
   *
   * 🔴 `undefined` KHÁC chuỗi rỗng, đừng gộp:
   *   · `undefined`   → đơn chưa sửa gì → in **bản chuẩn** ở `dieu-khoan-chuan-don-mua-hang.ts`.
   *   · `""`          → người lập cố ý xóa trắng → tờ in KHÔNG có khối điều khoản nào.
   * Gộp hai thứ này là đơn cố ý bỏ điều khoản vẫn in đầy đủ điều khoản ra chứng từ gửi nhà cung
   * cấp — tức app tự thêm cam kết mà người lập đã quyết định bỏ.
   *
   * 📌 Lưu bản CỦA TỪNG ĐƠN chứ không trỏ tới bản chuẩn: sửa bản chuẩn về sau không được làm
   * thay đổi chứng từ đã phát hành.
   */
  dieuKhoanGiaoHang?: string;
  /** ★ Hai câu cam kết cuối tờ, CHỈ in ở mẫu *Thỏa thuận mua bán*. Quy ước `undefined`/`""` như trên. */
  camKetThoaThuan?: string;
  /** Ô "Điều khoản khác" trên mẫu đơn (bảo hành, bốc xếp, chứng chỉ chất lượng...). */
  dieuKhoanKhac?: string;
  ghiChu?: string;
  /**
   * ★ Khối "Đính kèm" của màn MISA (MISA ghi "Dung lượng tối đa 5MB").
   *
   * 🔴 Chỉ giữ phần MÔ TẢ tệp. Nội dung nằm ở `3-du-lieu/kho-tep.ts` (IndexedDB), tuyệt đối
   * không nhét vào localStorage — chỗ đó chỉ ~5MB cho cả tên miền và đang giữ toàn bộ dữ
   * liệu nghiệp vụ, nhét một ảnh 2–5MB vào là mất sạch.
   *
   * ⚠️ Giới hạn cỡ tệp của app là `CO_TOI_DA` (10MB) ở `kho-tep.ts`, KHÔNG phải 5MB của MISA.
   * Giữ một con số duy nhất cho cả app, không đặt thêm giới hạn riêng cho đơn hàng.
   */
  tepDinhKem?: MoTaTep[];
  trangThai: TrangThaiPO;
  items: DongPO[];
  /**
   * ★ NHẬT KÝ RIÊNG CỦA ĐƠN — chỉ dùng cho **đơn KHÔNG gắn đề nghị** (từ 18/08/2026).
   *
   * 🔴 VÌ SAO PHẢI THÊM: mọi thao tác trên đơn (lập đơn, ghi phiếu nhận, duyệt nhập kho, đính
   * kèm phiếu giao, thủ kho xác nhận, trưởng bộ phận xác nhận hoàn thành) trước nay đều ghi
   * vào `DeNghiMuaHang.lichSu` qua `prId`. Đơn độc lập không có `prId`, nên nếu không có chỗ
   * này thì `ghiLichSuDeNghi(undefined, …)` **rơi mất im lặng** — sáu thao tác không để lại
   * một dấu vết nào, không một dòng báo lỗi. Đó là mất mát nặng hơn cả hai điều đã báo Ban
   * lãnh đạo, nên phải vá tại chỗ.
   *
   * 🔴 ĐƠN CÓ `prId` THÌ VẪN GHI VÀO ĐỀ NGHỊ, KHÔNG ghi vào đây. Một hồ sơ chỉ được có MỘT
   * dòng thời gian; tách làm hai chỗ là người đọc phải ghép tay và sớm muộn bỏ sót một nửa.
   * Luật định tuyến nằm ở `3-du-lieu/kho-du-lieu.tsx` → `ghiNhatKyDonHang`, một chỗ duy nhất.
   */
  lichSu?: MocLichSu[];
  /** Điều kiện ② hoàn thành PO. */
  xacNhanKho?: XacNhan;
  /** Điều kiện ③ hoàn thành PO. */
  xacNhanTruongBP?: XacNhan;
  lyDoHuyHoacDongDo?: string;
  /**
   * ★ Việc 2 (20/08/2026): kết quả lần gửi PO này sang QLK CTR GẦN NHẤT — vắng mặt = chưa
   * từng thử (đơn không gắn đề nghị có công trình, hoặc đề nghị đó chưa từng đồng bộ ở Việc 1).
   * "failed" là dấu hiệu để tự thử lại lần sau có người mở lại đúng đơn này — cùng mẫu
   * `thuMuaSyncStatus` bên App Request đã làm cho Việc 1. Xem `5-ket-noi/gui-po-qlk-ctr.ts`.
   */
  qlkCtrSyncStatus?: "synced" | "failed";
  /**
   * ★ (24/08/2026): dấu vân tay (JSON.stringify) của đúng phần dữ liệu đã gửi sang QLK CTR ở lần
   * "synced" gần nhất — dùng để phát hiện Thu mua SỬA LẠI PO sau khi đã đồng bộ (đổi NCC/số
   * lượng/ngày giao...). So khớp ở `5-ket-noi/gui-po-qlk-ctr.ts` → `canDongBoLaiPO`; khác thì tự
   * gửi lại lần nữa ở `apDung()`, cùng cơ chế "retry-on-view" đã có cho trạng thái "failed".
   */
  qlkCtrSyncedSnapshot?: string;
}

// ------------------------------------------------------------
// GIÁ — TÁCH RIÊNG khỏi PO
// Lý do: Firestore Security Rules chặn ở mức DOCUMENT, không chặn theo TRƯỜNG.
// Để giá trong PO thì cho thủ kho đọc PO là thủ kho đọc luôn cả giá.
// ------------------------------------------------------------

export interface DongGiaPO {
  sttDong: number;
  donGia: number;
  /**
   * ★ Cột "% Thuế GTGT" của màn Đơn mua hàng MISA — thuế suất RIÊNG của dòng này, đơn vị %.
   *
   * Bỏ trống = dùng `GiaDonDatHang.thueSuatGTGT` (thuế suất chung của cả đơn). Hầu hết đơn chỉ
   * có một mức thuế nên để trống là đúng; chỉ ghi khi đơn trộn nhiều mức (vd vật tư 8% đi chung
   * với dịch vụ vận chuyển 10%).
   *
   * 🔴 NẰM Ở CHỨNG TỪ GIÁ, KHÔNG nằm ở `DongPO`. Firestore chặn quyền theo DOCUMENT chứ không
   * theo trường: để thuế suất trong `tm_donhang` là cho thủ kho đọc đơn hàng thấy luôn phần
   * thương mại, và từ thuế suất + tổng tiền suy ngược ra được đơn giá.
   */
  thueSuatGTGT?: number;
}

/**
 * ★ Cách tính chiết khấu — ô "Chiết khấu" ở góc phải bảng hàng tiền của MISA.
 *
 * `"khong"` không chiết khấu · `"ty_le"` theo % tiền hàng · `"so_tien"` nhập thẳng số tiền.
 *
 * ⚠️ Dữ liệu lập TRƯỚC 17/08/2026 không có trường này. Quy ước đọc bản cũ (xem
 * `tienChietKhau` ở `2-quy-trinh/tinh-toan.ts`): có `chietKhau > 0` thì hiểu là `"so_tien"`,
 * không có thì hiểu là `"khong"`. Nhờ vậy không phải chuyển đổi dữ liệu cũ.
 */
export type KieuChietKhau = "khong" | "ty_le" | "so_tien";

/**
 * Phần TIỀN của một đơn mua hàng — tách hẳn khỏi `DonDatHang`.
 *
 * 🔴 MỌI thứ dính tới tiền đều để ở đây, kể cả chiết khấu, thuế suất và điều khoản
 * thanh toán. Lý do: Security Rule chỉ chặn được cả document. Nếu để thuế suất hay
 * điều khoản thanh toán trong PO thì cho thủ kho đọc PO là hở luôn phần thương mại.
 *
 * 📄 Ánh xạ khối tổng của biểu mẫu `1. DON HANG HPCONS.xlsx`:
 *    Cộng tiền hàng (chưa trừ CK) → Số tiền CK → Cộng tiền hàng (đã trừ CK)
 *    → Thuế suất GTGT + Tiền thuế GTGT → Tổng tiền thanh toán → Số tiền bằng chữ.
 *    Các con số này KHÔNG lưu, mà tính lại ở `2-quy-trinh/tinh-toan.ts` → `tinhTienDonHang`,
 *    để không bao giờ có hai chỗ giữ hai kết quả khác nhau.
 */
export interface GiaDonDatHang {
  /** = DonDatHang.id */
  poId: string;
  poCode: string;
  maDuAn: string;
  lines: DongGiaPO[];
  /** Ô "Loại tiền". Trống = VND. */
  loaiTien?: string;
  /** Ô "Số tiền CK" — chiết khấu tính bằng SỐ TIỀN, không phải phần trăm (đúng mẫu công ty). */
  chietKhau?: number;
  /**
   * ★ Ô chọn "Chiết khấu" của MISA. Bỏ trống thì suy từ dữ liệu cũ, xem `KieuChietKhau`.
   */
  kieuChietKhau?: KieuChietKhau;
  /**
   * ★ Tỷ lệ chiết khấu, đơn vị %. CHỈ dùng khi `kieuChietKhau === "ty_le"`.
   *
   * 🔴 Giữ CẢ tỷ lệ lẫn số tiền (`chietKhau`) là cố ý, không phải thừa: chứng từ phải nói được
   * "chiết khấu 5%" chứ không chỉ "giảm 1.250.000 ₫" — nhà cung cấp đối chiếu theo tỷ lệ đã
   * thỏa thuận. Số tiền vẫn là con số DUY NHẤT đem đi tính, `tinhTienChiTiet` tự suy ra từ tỷ lệ
   * để hai giá trị không bao giờ lệch nhau.
   */
  tyLeChietKhau?: number;
  /** Ô "Thuế suất thuế GTGT", đơn vị phần trăm. vd 8 hoặc 10. Trống = không chịu thuế. */
  thueSuatGTGT?: number;
  /** Ô "Điều khoản thanh toán" — vd "Thanh toán 100% trong 30 ngày sau khi nhận đủ hàng". */
  dieuKhoanThanhToan?: string;
  /**
   * ★ Ô "Số ngày được nợ" của màn MISA — số ngày nhà cung cấp cho nợ kể từ ngày nhận hàng.
   *
   * 🔴 ĐỂ Ở CHỨNG TỪ GIÁ chứ không ở `DonDatHang`, dù nghe như thông tin hành chính. Đây là
   * điều kiện thương mại đàm phán được (NCC cho nợ 45 ngày thường báo giá cao hơn NCC thu tiền
   * ngay) — lộ nó ra `tm_donhang` là lộ một phần thế đàm phán, đúng thứ nguyên tắc dữ liệu số 3
   * của dự án muốn chặn.
   */
  soNgayDuocNo?: number;
  /**
   * ★★ NGÀY TỚI HẠN THANH TOÁN — NHẬP TAY, ĐÈ LÊN GIÁ TRỊ TỰ TÍNH (Ban lãnh đạo 28/08/2026:
   * *"ngày tới hạn cũng là trường nhập thủ công"*).
   *
   * 🔴 KHÔNG BỎ PHÉP TỰ TÍNH. Trống ở đây thì `congNoTheoDonHang` vẫn suy ra từ *ngày nhận hàng
   * lần cuối + `soNgayDuocNo`* như trước. Bỏ tự tính đi là mọi đơn cũ mất sạch ngày tới hạn cho
   * tới khi có người gõ tay từng đơn — và trong lúc đó cảnh báo quá hạn im lặng tắt.
   *
   * 📌 Đặt CÙNG CHỖ với `soNgayDuocNo`, không đưa sang `DonDatHang`: hai trường này là một cặp
   * điều kiện thanh toán. Tách ra hai chứng từ là mở đường cho một bên đổi mà bên kia không biết,
   * rồi hai con số cùng nói về một ngày lại lệch nhau.
   */
  ngayToiHanThanhToan?: NgayISO;
  /**
   * ★★ NHẬT KÝ SỬA ĐIỀU KHOẢN CÔNG NỢ (Ban lãnh đạo 28/08/2026: *"có ghi lại lịch sử"*).
   *
   * 🔴 CẤT Ở ĐÂY CHỨ KHÔNG GHI VÀO NHẬT KÝ ĐỀ NGHỊ, và đây là lý do bảo mật chứ không phải chọn
   * cho tiện: khối "Lịch sử" của đề nghị hiện cho MỌI vai trò, kể cả người không được xem giá.
   * Một dòng *"đổi số ngày được nợ từ 30 sang 45"* nằm ở đó là lộ đúng cái điều kiện thương mại
   * mà nguyên tắc dữ liệu số 3 dựng cả một chứng từ riêng để giấu. Cùng lý do với luật đã có:
   * *"không ghi tên nhà cung cấp vào nhật ký đề nghị"*.
   *
   * ⚠️ Vì vậy KHÔNG gọi `ghiNhatKyDonHang` cho việc sửa điều khoản công nợ — hàm đó định tuyến
   * sang lịch sử đề nghị khi đơn có `prId`, tức là đi thẳng vào chỗ vừa nói.
   */
  lichSuDieuKhoanCongNo?: MocLichSu[];
}

// ------------------------------------------------------------
// PHIẾU NHẬN HÀNG — thủ kho công trình lập, MỖI LẦN GIAO MỘT PHIẾU
// Đây là thứ bản thumua-next KHÔNG có (chỉ cộng dồn receivedQuantity).
// ------------------------------------------------------------

export type TrangThaiPhieuNhan = "cho_kiem_tra" | "da_nhap_kho" | "tu_choi_nhan";

export interface DongNhanHang {
  /** Trỏ về DongPO.sttDong. */
  sttDongPO: number;
  /** Khối lượng của CHÍNH LẦN NÀY, không phải cộng dồn. */
  khoiLuongThucNhan: number;
  khoiLuongTuChoi?: number;
  lyDoTuChoi?: string;
}

export interface PhieuNhanHang {
  id: string;
  /** vd 260001-HPCS-PO-001-DO01 */
  code: string;
  poId: string;
  poCode: string;
  lanGiaoThu: number;
  ngayNhanThucTe: NgayISO;
  nguoiNhanUid: string;
  nguoiNhanTen: string;
  soPhieuGiaoNCC?: string;
  /**
   * ★ BẢN CHỤP / BẢN QUÉT PHIẾU GIAO NHẬN của nhà cung cấp cho LẦN GIAO NÀY.
   *
   * 🔴 Chỉ đạo Ban lãnh đạo 11/08/2026: *"thủ kho khi nhận hàng phải đính kèm file phiếu
   * giao nhận thì mới được bấm hoàn thành"*. Đây là chứng từ gốc chứng minh hàng đã về
   * thật — không có nó thì con số khối lượng trong app không đối chiếu được với giấy tờ.
   *
   * Để `?` vì phiếu ghi TRƯỚC ngày 11/08/2026 chưa có trường này. Phiếu cũ vẫn đọc được,
   * chỉ là phải bổ sung tệp thì đơn mới hoàn thành được — xem `vuongMacXacNhanKho`.
   *
   * ⚠️ Chỉ là phần MÔ TẢ. Nội dung tệp nằm ở kho riêng (`3-du-lieu/kho-tep.ts`), tra theo
   * `id`. Đừng nhét nội dung tệp vào đây — dữ liệu nghiệp vụ lưu ở localStorage, nhét vào
   * là tràn và mất sạch.
   */
  tepPhieuGiao?: MoTaTep;
  /** ★ CHỈ trạng thái da_nhap_kho mới được tính vào khối lượng đã nhận. */
  trangThai: TrangThaiPhieuNhan;
  ghiChuTinhTrangHang?: string;
  lines: DongNhanHang[];
  /**
   * Phiếu do QLK CTR tự động tạo (thủ kho ghi nhận nhập kho bên đó, không ghi tay ở đây) —
   * xem 3-du-lieu/tich-hop-qlk-ctr-nhan-hang-types.ts. `undefined` = phiếu tự ghi bình
   * thường ở Thu mua như trước giờ.
   */
  maPhieuNhanQlkCtr?: string;
  /**
   * Ảnh phiếu giao do QLK CTR gửi kèm — CHỈ LÀ ĐƯỜNG LINK (QLK CTR tự host qua
   * /api/files/{key}), không phải MoTaTep vì kho tệp của Thu mua không có chỗ chứa link
   * ngoài. Xem 1-giao-dien/thanh-phan-dung-chung/lien-ket-anh-qlk-ctr.tsx.
   */
  anhQlkCtr?: { ten: string; url: string };
}

// ------------------------------------------------------------
// THÔNG BÁO CHUYỂN BƯỚC
// Sinh tự động khi một đề nghị ĐỔI BƯỚC trên bảng quy trình (bất kể chuyển
// bằng kéo thả hay bằng nghiệp vụ).
// Bản chạy thử giữ trong bộ nhớ; bản thật sẽ là collection tm_thongbao.
//
// 📌 Bước "Nhận công tác" đã BỎ (12/08/2026) — trường `tiepNhan` gỡ nốt ngày 14/08/2026.
// ------------------------------------------------------------

export interface ThongBaoChuyenBuoc {
  id: string;
  prId: string;
  prCode: string;
  tieuDe: string;
  /** Mã giai đoạn (GiaiDoanMuaHang) — nhãn tra ở `2-quy-trinh/giai-doan-mua-hang`.
   *  Trống = đề nghị MỚI vào bảng, không phải chuyển bước. */
  tuBuoc?: string;
  denBuoc: string;
  /** ISO đầy đủ giờ phút — thông báo cần biết "lúc mấy giờ". */
  thoiDiem: string;
  /** Người nên nhận thông báo (người theo dõi đề nghị). Bản chạy thử hiển thị chung. */
  guiToi: string[];
  daDoc: boolean;
  /**
   * `true` = thông báo do TRƯỞNG BỘ PHẬN BẤM "CHUYỂN TIẾP", không phải hệ thống tự
   * sinh khi đề nghị đổi bước (chỉ đạo Ban lãnh đạo 08/08/2026).
   *
   * Vì sao cần phân biệt: trưởng bộ phận phân bổ xong thì việc còn lại là của nhân
   * viên. Lúc đó đề nghị CHƯA đổi bước (vẫn đang ở "Lập đơn mua hàng") nên không có
   * thông báo tự động nào — nhân viên không biết đã tới lượt mình. Nút "Chuyển tiếp"
   * lấp đúng khoảng trống đó; `tuBuoc` và `denBuoc` khi ấy bằng nhau.
   */
  laChuyenTiep?: boolean;
  /**
   * `true` = **VIỆC MỚI ĐƯỢC GIAO CHO ĐÍCH DANH MỘT NGƯỜI** (trưởng bộ phận phân bổ dòng vật tư,
   * hoặc chuyển việc của một dòng sang người khác).
   *
   * 🔴 Ban lãnh đạo 18/08/2026: *"cài đặt thêm tính năng thông báo khi có công việc mới"*.
   *
   * VÌ SAO PHẢI THÊM LOẠI TIN NÀY — khoảng trống thật của bản trước:
   * Chuông chỉ báo khi **cả phiếu đổi bước**, mà bước chỉ đổi khi **mọi dòng đã được phân bổ**
   * (`daPhanBoDu`). Trưởng bộ phận giao 2 trong 5 dòng cho một nhân viên thì phiếu VẪN đứng ở
   * bước ①, nên nhân viên đó **không nhận được một tin nào** — họ chỉ biết mình có việc nếu tự
   * mở app và đi dò từng phiếu. Việc giao rồi mà người nhận không biết là việc nằm im.
   *
   * Và ngay khi bước có đổi thì tin đổi bước cũng gửi cho *"người cần xử lý"* nói chung, nội
   * dung là *"Tiếp nhận và kiểm tra → Yêu cầu NCC báo giá"* — nói về HỒ SƠ, không nói *"bạn được
   * giao mấy dòng nào"*. Hai loại tin trả lời hai câu hỏi khác nhau nên giữ cả hai.
   */
  laViecMoi?: boolean;
  /** Số dòng vật tư được giao trong tin `laViecMoi` — để viết "được giao 3 dòng vật tư". */
  soDongViec?: number;
  /** Lời nhắn kèm khi chuyển tiếp / giao việc — trưởng bộ phận dặn thêm gì thì ghi ở đây. */
  loiNhan?: string;
}

// ------------------------------------------------------------
// KIỂU TỔNG HỢP DÙNG CHO GIAO DIỆN (tính runtime, không lưu)
// ------------------------------------------------------------

export interface TienDoDongPO extends DongPO {
  khoiLuongDaNhan: number;
  khoiLuongConLai: number;
  phanTram: number;
  /** Khối lượng nhận theo từng lần, để dựng cột động trong bảng tiến độ. */
  theoLanGiao: { lanGiaoThu: number; ngayNhan: NgayISO; khoiLuong: number }[];
}

export interface TienDoDongDeNghi extends DongDeNghi {
  khoiLuongDaLenPO: number;
  khoiLuongChuaLenPO: number;
  khoiLuongDaNhan: number;
  khoiLuongConLai: number;
  phanTram: number;
  trangThaiDong: TrangThaiDongDeNghi;
  /** Các PO có dòng trỏ về dòng đề nghị này. */
  maPOLienQuan: string[];
  /** Ngày giao dự kiến sớm nhất trong các PO liên quan. */
  ngayGiaoDuKien?: NgayISO;
}

// ------------------------------------------------------------
// BÁO GIÁ (RFQ) — so sánh giá từ nhiều NCC cho một Đề nghị
// Firestore: projects/{projectId}/tm_baogia/{rfqId}
// ------------------------------------------------------------

export type TrangThaiBaoGia = "dang_thu_thap" | "da_so_sanh" | "da_chon_ncc" | "huy";

export interface DongBaoGiaNCC {
  nccId: string;
  tenNCC: string;
  donGia: number;
  thoiGianGiao: number;
  ghiChu?: string;
}

/**
 * BẢN BÁO GIÁ NHÀ CUNG CẤP GỬI VỀ — nhân viên thu mua tải lên làm bằng chứng.
 *
 * 🔴 Chỉ đạo Ban lãnh đạo 10/08/2026: bước ② *"nv tm sẽ up báo giá của các nhà cung cấp lên
 * để trưởng bộ phận xem xét"*. Trưởng bộ phận duyệt giá thì phải xem được bản gốc nhà cung
 * cấp gửi, không chỉ tin con số nhân viên gõ vào.
 *
 * ✅ TỪ 11/08/2026 ĐÃ LƯU NỘI DUNG THẬT và mở xem lại được — qua kho tệp
 * `3-du-lieu/kho-tep.ts`. Trước đó chỉ giữ tên tệp rồi vứt nội dung đi, trong khi nhật ký
 * vẫn ghi *"Tải lên bản báo giá X"* — người dùng có mọi lý do tin là đã lưu vào hệ thống,
 * và hồ sơ thiếu chứng từ mà không ai biết. Đó là lỗi, đã sửa.
 *
 * ⚠️ Tệp nằm trong trình duyệt của MÁY ĐÃ TẢI LÊN, chưa lên máy chủ. Máy khác thấy tên tệp
 * nhưng bấm xem thì báo không còn nội dung. Khi nối Firebase Storage thì chỉ thay ruột
 * `kho-tep.ts`, kiểu dữ liệu này không phải sửa.
 *
 * ⚠️ Bản ghi tạo TRƯỚC 11/08/2026 thiếu `id` nên không mở xem được — đúng như thực tế, vì
 * nội dung tệp lúc đó chưa từng được lưu.
 */
export interface TepBaoGiaNCC extends MoTaTep {
  nccId: string;
  tenNCC: string;
}

export interface DongBaoGia {
  id: string;
  /**
   * ★ Số thứ tự dòng của ĐỀ NGHỊ mà dòng báo giá này ứng với.
   *
   * 🔴 KHÓA TRUY VẾT, không phải trường trang trí. Khi lập đơn từ phân bổ, phải biết phần
   * khối lượng này thuộc dòng đề nghị nào. Trước đây không có nên phải khớp theo
   * `tenVatLieu`, và hai dòng đề nghị cùng tên khác quy cách ("Thép hộp" 40×40 và 50×50)
   * bị dồn về một dòng — dòng kia mất khối lượng. Tên vật liệu do người dùng gõ tự do nên
   * trùng tên là chuyện thường.
   *
   * ⚠️ Không bắt buộc để đọc được dữ liệu cũ chưa có trường này; chỗ dùng phải có đường lùi
   * về khớp theo tên.
   */
  sttDongDeNghi?: number;
  tenVatLieu: string;
  donViTinh: string;
  khoiLuong: number;
  baoGiaNCC: DongBaoGiaNCC[];
  /**
   * ★ TÁCH BÁO GIÁ — chia khối lượng của DÒNG NÀY cho nhiều nhà cung cấp.
   *
   * Chỉ đạo Ban lãnh đạo 10/08/2026: *"một mặt hàng có thể phải chia nhỏ PO do 1 nhà
   * cung cấp thì không cung cấp hết được số lượng hàng cần đặt"*. Ví dụ cần 2.400 kg
   * thép: NCC B giao được 1.500, NCC G giao 900 → hai đơn đặt hàng riêng.
   *
   * Trống = chưa tách, cả dòng về một nhà cung cấp (`BaoGia.nccDaChonId`).
   *
   * 🔴 KHÔNG CÒN ĐƯỜNG GHI TRƯỜNG NÀY (20/08/2026). Ban lãnh đạo chốt *"bỏ quy trình so sánh
   * báo giá đó đi, chỉ đính kèm file và trưởng bộ phận chọn duyệt thôi"*, nên chức năng tách đơn
   * cho nhiều nhà cung cấp và hàm kiểm `kiemPhanBoDong` (ở `2-quy-trinh/so-sanh-bao-gia.ts`) đã
   * bị xóa cùng bảng so sánh.
   *
   * ⚠️ TRƯỜNG VẪN GIỮ vì dữ liệu cũ trên kho chung của cả phòng có thể đang mang nó — bỏ khỏi
   * kiểu dữ liệu là mọi chỗ đọc phải phòng `undefined`, mà lợi thì không có. Muốn làm lại tách
   * đơn thì viết lại hàm kiểm tổng khối lượng trước, đừng ghi trường này mà không kiểm.
   */
  phanBo?: PhanBoNCC[];
}

/** Một phần khối lượng của dòng báo giá giao cho một nhà cung cấp. */
export interface PhanBoNCC {
  nccId: string;
  tenNCC: string;
  khoiLuong: number;
}

/**
 * Thông tin thương mại của MỘT nhà cung cấp trong bảng so sánh — ba dòng cuối của mẫu
 * "SO SÁNH GIÁ" công ty đang dùng (ảnh Ban lãnh đạo gửi 13/08/2026).
 *
 * ⚠️ Cả ba đều là CHỮ TỰ DO, không phải danh mục chọn. Thực tế mỗi nhà cung cấp diễn đạt một
 * kiểu: *"Công nợ 15 từ ngày xuất HĐ, chốt CN vào ngày 15 & 30 hằng tháng"*, *"Tạm ứng trước
 * 2000m³/đợt để chạy hàng"*. Ép vào danh mục là mất đúng phần thông tin cần đọc để quyết định.
 */
export interface ThongTinThuongMaiNCC {
  nccId: string;
  tenNCC: string;
  /** Ví dụ: "Công nợ 15 ngày từ ngày xuất hóa đơn, chốt 15 & 30 hằng tháng". */
  hinhThucThanhToan?: string;
  /** Ví dụ: "Xe đầu kéo & xe 3–4 giờ". Khác `thoiGianGiao` (số ngày) ở từng dòng giá. */
  thoiGianGiaoHang?: string;
  /** Ví dụ: "VAT xuất tên Đất san lấp" · "NCC có nhiều loại đất lấp khác nhau". */
  ghiChu?: string;
}

/**
 * Một lượt trưởng bộ phận KHÔNG DUYỆT và trả bảng báo giá về bước ②.
 *
 * ⚠️ `lyDo` là chữ người dùng tự gõ nên **rất hay có tên nhà cung cấp** ("bên A thiếu báo giá").
 * Vì vậy nó nằm ở đây chứ không đẩy vào `DeNghiMuaHang.lichSu` — nhật ký hiện cho cả vai trò
 * không được xem nhà cung cấp.
 */
export interface LanTraLaiBaoGia {
  /** ISO đầy đủ giờ phút. */
  thoiDiem: string;
  nguoiTuChoiTen: string;
  lyDo: string;
}

export interface BaoGia {
  id: string;
  code: string;
  prId: string;
  prCode: string;
  tieuDe: string;
  trangThai: TrangThaiBaoGia;
  items: DongBaoGia[];
  nccDaChonId?: string;
  nccDaChonTen?: string;
  /**
   * ★ LÝ DO / DẪN CHỨNG vì sao chọn nhà cung cấp này — Ban lãnh đạo 13/08/2026: *"thêm chức
   * năng ghi chú lý do / dẫn chứng vì sao chọn NCC sau khi so sánh báo giá"*.
   *
   * 🔴 Đây là CĂN CỨ CỦA MỘT QUYẾT ĐỊNH CHI TIỀN. Chọn nhà cung cấp không phải lúc nào cũng
   * là chọn giá thấp nhất — có khi vì giao nhanh hơn, chất lượng đã kiểm chứng, hoặc bên rẻ
   * hơn không đủ hàng. Không ghi lại thì sáu tháng sau kiểm toán hỏi *"vì sao không chọn bên
   * rẻ nhất"*, không ai trả lời được, và người quyết định phải tự bảo vệ bằng ký ức.
   *
   * 📌 Lưu cùng bảng báo giá (không phải nhật ký đề nghị) vì nhật ký hiện cho cả vai trò
   * không được xem nhà cung cấp — xem quy ước ở `ghiLichSuDeNghi`.
   */
  lyDoChonNCC?: string;
  /**
   * ★ TÀI LIỆU ĐÍNH KÈM CHO QUYẾT ĐỊNH CHỌN NCC — Ban lãnh đạo 16/08/2026.
   *
   * 🔴 Ô lý do chỉ cho gõ chữ, trong khi dẫn chứng thật đa số là TỆP: văn bản Tổng Giám đốc
   * ký duyệt (đơn từ 10 triệu trở lên bắt buộc có), email nhà cung cấp báo hết hàng, bản báo
   * giá gốc có dấu. Không có chỗ đính kèm thì những giấy tờ đó nằm rải rác trong hộp thư
   * riêng của người quyết định — sáu tháng sau kiểm toán hỏi thì không ai lấy ra được.
   *
   * Đây chỉ là phần MÔ TẢ; nội dung tệp nằm ở kho tệp (`3-du-lieu/kho-tep.ts`).
   */
  tepChonNCC?: MoTaTep[];
  /** Người ghi lý do và lúc nào — để biết ai chịu trách nhiệm về quyết định này. */
  nguoiChonTen?: string;
  thoiDiemChon?: string;

  /**
   * ★ TRƯỞNG BỘ PHẬN KHÔNG DUYỆT — Ban lãnh đạo 19/08/2026: *"bước xét duyệt báo giá phải có
   * chức năng duyệt hoặc không duyệt, và phải có ghi chú bắt buộc lý do vì sao duyệt hoặc không
   * duyệt"*.
   *
   * 🔴 TRƯỚC ĐÂY KHÔNG CÓ ĐƯỜNG TỪ CHỐI. Bước ③ chỉ có một lối đi: chốt nhà cung cấp. Trưởng bộ
   * phận thấy giá chưa ổn, thiếu báo giá, hay đề xuất chưa thuyết phục thì **không có cách nào
   * trả phiếu lại** — hoặc nhắn ngoài app, hoặc nhắm mắt chốt. Cả hai đều làm bước xét duyệt
   * thành hình thức.
   *
   * 📌 KHÔNG DUYỆT ĐƯA BẢNG VỀ `dang_thu_thap`, tức quay lại bước ② để nhân viên bổ sung rồi
   * trình lại. KHÔNG hủy bảng: hủy là mất sạch giá đã nhập và nhân viên phải gõ lại từ đầu.
   *
   * 🔴 GIỮ LẠI SAU KHI TRÌNH LẠI, cố ý không xóa khi nhân viên trình lượt mới. Người duyệt cần
   * đọc "lần trước bị trả vì sao" để biết nhân viên đã sửa đúng chỗ chưa; xóa đi là mỗi lượt
   * duyệt lại bắt đầu từ con số không.
   *
   * 🔴 MẢNG, KHÔNG PHẢI MỘT CHUỖI. Phiếu có thể đi đi về lại ②↔③ nhiều vòng; để một chuỗi thì
   * lần bác sau **ghi đè** lần trước, và nhân viên lặp lại đúng cái sai cũ mà không ai tra ra.
   *
   * ⚠️ TÊN LÀ `lanTraLai`, KHÔNG PHẢI `lyDoTuChoi`: `DongNhanHang.lyDoTuChoi` đã tồn tại và
   * mang nghĩa khác hẳn (thủ kho từ chối nhận hàng). Hai trường trùng tên khác nghĩa trong cùng
   * một tệp kiểu dữ liệu là bẫy cho người đọc sau.
   */
  lanTraLai?: LanTraLaiBaoGia[];
  /**
   * ★ ĐỀ XUẤT CỦA NHÂN VIÊN THU MUA — Ban lãnh đạo 13/08/2026: *"ở bước cung cấp so sánh báo
   * giá, nhân viên phải đưa ra đề xuất lựa chọn NCC nào và phải có dẫn chứng cụ thể nên hãy
   * để sẵn phần ghi chú cho nhân viên"*.
   *
   * 🔴 KHÁC `lyDoChonNCC` — đừng gộp hai thứ này:
   *   · `deXuat*` là của NHÂN VIÊN, ghi ở bước ② khi trình xét duyệt. Là **kiến nghị**.
   *   · `lyDoChonNCC` là của TRƯỞNG BỘ PHẬN, ghi ở bước ③ khi chốt. Là **quyết định**.
   *
   * Giữ riêng thì đọc lại hồ sơ thấy được cả hai: nhân viên đề xuất bên A vì giao nhanh,
   * trưởng bộ phận vẫn chốt bên B vì giá thấp hơn — và cả hai đều có tên, có căn cứ. Gộp một
   * trường là mất một trong hai tiếng nói, thường là tiếng của người làm trực tiếp.
   */
  deXuatNCCId?: string;
  deXuatNCCTen?: string;
  /** Dẫn chứng cụ thể cho đề xuất — bắt buộc điền trước khi trình xét duyệt. */
  lyDoDeXuat?: string;
  nguoiDeXuatTen?: string;
  thoiDiemDeXuat?: string;

  /**
   * ★ THÔNG TIN THƯƠNG MẠI THEO TỪNG NHÀ CUNG CẤP — theo mẫu "SO SÁNH GIÁ" của công ty
   * (Ban lãnh đạo cung cấp ảnh 13/08/2026).
   *
   * 🔴 Mẫu của công ty so sánh KHÔNG CHỈ GIÁ. Ba dòng cuối bảng là hình thức thanh toán,
   * thời gian giao hàng và ghi chú — và chính chúng quyết định chọn ai. Ví dụ thật trong ảnh:
   * bên rẻ nhất (Bảo Hoàng) ghi chú *"NCC có nhiều loại đất lấp khác nhau"*, còn các bên khác
   * ghi rõ VAT xuất tên hàng gì. Thiếu ba dòng này thì bảng so sánh của app chỉ là bảng giá,
   * không đủ để quyết định.
   *
   * 📌 Đặt ở cấp BẢNG BÁO GIÁ, không đặt trong từng dòng vật tư: hình thức thanh toán là
   * thỏa thuận với nhà cung cấp cho cả đơn, không phải theo từng mặt hàng.
   */
  thongTinNCC?: ThongTinThuongMaiNCC[];
  /** Bản báo giá gốc nhà cung cấp gửi về, nhân viên thu mua tải lên — xem `TepBaoGiaNCC`. */
  tepBaoGia?: TepBaoGiaNCC[];
  hanNop: NgayISO;
  ngayTao: NgayISO;
  ngayCapNhat: NgayISO;
}

// ------------------------------------------------------------
// CÔNG NỢ NHÀ CUNG CẤP — theo dõi thanh toán từng hóa đơn
// Dữ liệu lấy trực tiếp từ PO (user yêu cầu 05/08/2026)
// Firestore: projects/{projectId}/tm_congno/{id}
// ------------------------------------------------------------

export type TrangThaiCongNo = "chua_den_han" | "sap_den_han" | "qua_han" | "da_thanh_toan";

export interface CongNo {
  id: string;
  poId: string;
  poCode: string;
  nccId: string;
  tenNCC: string;
  soHoaDon: string;
  soTien: number;
  daTra: number;
  hanThanhToan: NgayISO;
  trangThai: TrangThaiCongNo;
  congTrinh?: string;
  ghiChu?: string;
}
