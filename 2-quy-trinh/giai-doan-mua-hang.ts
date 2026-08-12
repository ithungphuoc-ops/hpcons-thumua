// ============================================================
// GIAI ĐOẠN MUA HÀNG — 8 cột của bảng quy trình (dạng Kanban)
//
// Đặt theo đúng quy trình đang chạy thật trên Base.vn của công ty
// ("TM-QT Mua hàng (HP CONS)"), Ban lãnh đạo cung cấp ngày 06/08/2026:
//
//   1 Tiếp nhận và kiểm tra → 2 Yêu cầu NCC báo giá → 3 Xét duyệt báo giá
//   → 4 Lập đơn mua hàng → 5 Tiến hành đặt hàng → 6 Tiến hành nhận hàng
//   → 7 Hoàn thành   ·   Thất bại (nhánh dừng)
//
// 🔴 NGUYÊN TẮC: giai đoạn KHÔNG phải một trường lưu trong dữ liệu.
// Nó được SUY RA từ chứng từ có thật (báo giá · đơn đặt hàng · phiếu nhận hàng).
// Lưu thành trường riêng sẽ tạo ra nguồn sự thật thứ hai: kéo thẻ sang cột
// "Tiến hành nhận hàng" trong khi chưa có phiếu nhận nào thì bảng báo tiến độ ảo.
// Muốn thẻ sang cột mới thì phải làm đúng nghiệp vụ của cột đó.
// ============================================================

import type {
  BaoGia,
  DeNghiMuaHang,
  DonDatHang,
  PhieuNhanHang,
} from "@/3-du-lieu/kieu-du-lieu";
import type { Tong } from "@/2-quy-trinh/trang-thai";
import { daysUntil } from "@/6-tien-ich/dinh-dang";

export type GiaiDoanMuaHang =
  | "tiep_nhan"
  | "yeu_cau_bao_gia"
  | "xet_duyet_bao_gia"
  | "lap_don_mua_hang"
  | "dat_hang"
  | "nhan_hang"
  | "hoan_thanh"
  | "that_bai";

export interface MoTaGiaiDoan {
  ma: GiaiDoanMuaHang;
  /** Nhãn cột — giữ nguyên chữ đang dùng trên Base để người quen việc không phải học lại. */
  nhan: string;
  /** Câu giải thích ngắn: đứng ở cột này nghĩa là đang chờ việc gì. */
  moTa: string;
  tong: Tong;
}

/** Thứ tự trong mảng này CHÍNH LÀ thứ tự cột trên bảng. */
export const GIAI_DOAN_MUA_HANG: MoTaGiaiDoan[] = [
  {
    ma: "tiep_nhan",
    nhan: "Tiếp nhận và kiểm tra",
    moTa: "Đề nghị đã duyệt, thu mua đang kiểm tra và phân bổ người phụ trách",
    tong: "neutral",
  },
  {
    ma: "yeu_cau_bao_gia",
    nhan: "Yêu cầu NCC báo giá",
    moTa: "Đã gửi yêu cầu, đang chờ nhà cung cấp gửi giá về",
    tong: "warning",
  },
  {
    ma: "xet_duyet_bao_gia",
    nhan: "Xét duyệt báo giá",
    moTa: "Đã có đủ giá, đang so sánh và trình duyệt chọn nhà cung cấp",
    tong: "warning",
  },
  {
    ma: "lap_don_mua_hang",
    nhan: "Lập đơn mua hàng",
    moTa: "Đã chốt nhà cung cấp, đang lập đơn đặt hàng",
    tong: "primary",
  },
  {
    ma: "dat_hang",
    nhan: "Tiến hành đặt hàng",
    moTa: "Đơn đã chốt và gửi nhà cung cấp, chờ giao hàng",
    tong: "primary",
  },
  {
    ma: "nhan_hang",
    nhan: "Tiến hành nhận hàng",
    moTa: "Hàng đang về, thủ kho ghi nhận từng lần giao",
    tong: "primary",
  },
  {
    ma: "hoan_thanh",
    nhan: "Hoàn thành",
    moTa: "Đã nhận đủ, kho và trưởng bộ phận đã xác nhận",
    tong: "success",
  },
  {
    ma: "that_bai",
    nhan: "Thất bại",
    moTa: "Đề nghị bị đóng dở hoặc hủy, không mua tiếp",
    tong: "danger",
  },
];

export const NHAN_GIAI_DOAN: Record<GiaiDoanMuaHang, MoTaGiaiDoan> = Object.fromEntries(
  GIAI_DOAN_MUA_HANG.map((g) => [g.ma, g]),
) as Record<GiaiDoanMuaHang, MoTaGiaiDoan>;

// ------------------------------------------------------------
// SUY RA GIAI ĐOẠN
// ------------------------------------------------------------

/**
 * Đề nghị đang ở cột nào. Xét từ giai đoạn XA NHẤT trở về, vì một đề nghị
 * có thể vừa còn báo giá dở vừa đã có đơn hàng đang giao — khi đó nó thuộc
 * về giai đoạn đi xa nhất, đúng như cách bảng Base đang chạy.
 */
export function xacDinhGiaiDoan(
  deNghi: DeNghiMuaHang,
  tatCaPO: DonDatHang[],
  tatCaBaoGia: BaoGia[],
  tatCaPhieu: PhieuNhanHang[],
): GiaiDoanMuaHang {
  if (deNghi.trangThai === "dong_do") return "that_bai";

  const poCuaDeNghi = tatCaPO.filter((po) => po.prId === deNghi.id && po.trangThai !== "huy");

  // ⑦ Hoàn thành — mọi đơn hàng của đề nghị đều đã đủ 3 lớp xác nhận.
  if (deNghi.trangThai === "hoan_thanh") return "hoan_thanh";
  if (poCuaDeNghi.length > 0 && poCuaDeNghi.every((po) => po.trangThai === "hoan_thanh")) {
    return "hoan_thanh";
  }

  // ⑥ Tiến hành nhận hàng — đã có hàng về, hoặc đơn đã chuyển sang trạng thái đang giao.
  const daCoPhieuNhan = tatCaPhieu.some((p) => poCuaDeNghi.some((po) => po.id === p.poId));
  const dangGiao = poCuaDeNghi.some(
    (po) => po.trangThai === "dang_giao" || po.trangThai === "cho_xac_nhan_hoan_thanh",
  );
  if (daCoPhieuNhan || dangGiao) return "nhan_hang";

  // ⑤ Tiến hành đặt hàng — đơn đã chốt, chưa có hàng nào về.
  if (poCuaDeNghi.some((po) => po.trangThai === "da_chot")) return "dat_hang";

  // ④ Lập đơn mua hàng — đang có đơn nháp, hoặc đã chọn NCC mà chưa lên đơn.
  if (poCuaDeNghi.some((po) => po.trangThai === "nhap")) return "lap_don_mua_hang";

  const baoGiaCuaDeNghi = tatCaBaoGia.filter((bg) => bg.prId === deNghi.id && bg.trangThai !== "huy");
  if (baoGiaCuaDeNghi.some((bg) => bg.trangThai === "da_chon_ncc")) return "lap_don_mua_hang";

  // ③ Xét duyệt báo giá · ② Yêu cầu NCC báo giá
  if (baoGiaCuaDeNghi.some((bg) => bg.trangThai === "da_so_sanh")) return "xet_duyet_bao_gia";
  if (baoGiaCuaDeNghi.some((bg) => bg.trangThai === "dang_thu_thap")) return "yeu_cau_bao_gia";

  // ① Chưa phát sinh chứng từ nào.
  return "tiep_nhan";
}

/** Giai đoạn đã kết thúc thì không còn tính hạn xử lý nữa. */
export function giaiDoanDaKetThuc(giaiDoan: GiaiDoanMuaHang): boolean {
  return giaiDoan === "hoan_thanh" || giaiDoan === "that_bai";
}

/**
 * AI CẦN XỬ LÝ BƯỚC NÀY — dùng cho dòng "Gửi tới" của thông báo chuyển bước.
 *
 * 🔴 Ban lãnh đạo bắt lỗi 11/08/2026: *"sao cấp trưởng phòng giao việc lại hiện thông báo như
 * vậy"*. Chuông đang ghi *"Gửi tới: Phạm Văn F"* — mà Phạm Văn F là NGƯỜI ĐỀ NGHỊ bên Phòng
 * Thi công, không phải người thu mua. Nguyên nhân: chỗ sinh thông báo lấy thẳng
 * `dn.nguoiTheoDoi`, tức danh sách người THEO DÕI, gán vào ô "Gửi tới".
 *
 * Sai ở hai mặt: người cần hành động (trưởng bộ phận / nhân viên phụ trách) thì không có tên,
 * còn người không làm gì được lại bị nêu như thể việc của họ.
 *
 * 📌 Trả về NHÃN VAI TRÒ ở bước ① vì lúc đó chưa ai được phân công — không thể nêu tên cụ thể.
 * Từ bước ② trở đi thì nêu đúng tên người phụ trách các dòng.
 */
export function nguoiCanXuLy(deNghi: DeNghiMuaHang, buoc: GiaiDoanMuaHang): string[] {
  if (buoc === "tiep_nhan") return ["Trưởng bộ phận Thu mua"];
  if (giaiDoanDaKetThuc(buoc)) return [];
  const ten = [
    ...new Set(
      deNghi.items.map((d) => d.nguoiPhuTrachTen).filter((x): x is string => Boolean(x)),
    ),
  ];
  return ten.length > 0 ? ten : ["Chưa phân bổ người phụ trách"];
}

/** Nhãn `nguoiCanXuLy` trả về khi việc thuộc về trưởng bộ phận thu mua. */
export const NHAN_TRUONG_BO_PHAN = "Trưởng bộ phận Thu mua";
/** Nhãn khi chưa ai được phân bổ — việc vẫn thuộc trưởng bộ phận. */
export const NHAN_CHUA_PHAN_BO = "Chưa phân bổ người phụ trách";

/**
 * THÔNG BÁO NÀY CÓ PHẢI GỬI CHO TÔI KHÔNG.
 *
 * 🔴 Chỉ đạo Ban lãnh đạo 12/08/2026: *"cấp trưởng phòng đã giao việc sao còn thấy thông
 * báo này"*. Trước đó chuông hiện **toàn bộ** thông báo cho **mọi người**: trưởng phòng
 * nhìn thấy tin gửi cho ba nhân viên, kèm nút "Nhận công tác" — bấm vào là giành mất việc
 * của nhân viên và ghi tên mình vào nhật ký. Nhân viên cũng thấy tin của nhau.
 *
 * Luật:
 *   · Tin ghi đích danh tên mình → của mình.
 *   · Tin gửi "Trưởng bộ phận Thu mua" hoặc "Chưa phân bổ người phụ trách" → của người có
 *     quyền phân bổ. Hai nhãn này là VAI TRÒ chứ không phải tên người, nên phải xét riêng.
 *   · Tin không ghi người nhận (giai đoạn đã kết thúc) → tin chung, ai cũng xem được.
 *
 * ⚠️ So khớp bằng TÊN vì `guiToi` đang lưu tên, không lưu mã người. Đây là điểm yếu đã
 * biết: hai người trùng tên sẽ thấy tin của nhau. Sửa tận gốc là lưu thêm mã người vào
 * thông báo — việc còn lại, chưa làm vì phải chuyển đổi dữ liệu cũ.
 */
export function thongBaoDanhChoToi(
  guiToi: string[],
  tenToi: string,
  laNguoiPhanBo: boolean,
): boolean {
  if (guiToi.length === 0) return true;
  if (guiToi.includes(tenToi)) return true;
  if (
    laNguoiPhanBo &&
    (guiToi.includes(NHAN_TRUONG_BO_PHAN) || guiToi.includes(NHAN_CHUA_PHAN_BO))
  ) {
    return true;
  }
  return false;
}


/**
 * Đề nghị đã đóng sổ (hoàn thành hoặc đóng dở) thì KHÔNG được đếm vào việc còn phải làm.
 * Không có cái này thì đề nghị đã đóng dở vẫn nằm trong hàng chờ phân bổ và trong
 * thẻ KPI của Bảng điều khiển — trưởng bộ phận sẽ thấy việc tồn nhiều hơn thực tế.
 */
export function deNghiConDangChay(deNghi: DeNghiMuaHang): boolean {
  return deNghi.trangThai !== "hoan_thanh" && deNghi.trangThai !== "dong_do";
}

// ------------------------------------------------------------
// HẠN XỬ LÝ — mốc là NGÀY CẦN HÀNG của đề nghị
// ------------------------------------------------------------

export interface HanXuLy {
  nhan: string;
  tong: Tong;
  quaHan: boolean;
}

/**
 * Bảng Base hiển thị "Quá hạn 1 day" / "Đến hạn trong 21h47m" / "Không thời hạn".
 * App này chỉ có ngày cần hàng (không có giờ) nên tính theo ngày lịch.
 *
 * ⚠️ Dùng `new Date()` lúc dựng trang. Với hosting tĩnh, trang sinh ra ở thời điểm
 * build nên mốc quá hạn có thể lệch một bậc — đúng hiện trạng đã ghi ở SESSION-LOG
 * phiên 02, sẽ xử lý chung một lượt khi nối dữ liệu thật.
 */
export function hanXuLyDeNghi(
  deNghi: DeNghiMuaHang,
  giaiDoan: GiaiDoanMuaHang,
  moc: Date = new Date(),
): HanXuLy {
  if (giaiDoanDaKetThuc(giaiDoan)) {
    return { nhan: "Không còn thời hạn", tong: "neutral", quaHan: false };
  }

  const soNgay = daysUntil(deNghi.ngayCanHang, moc);
  if (soNgay < 0) return { nhan: `Quá hạn ${-soNgay} ngày`, tong: "danger", quaHan: true };
  if (soNgay === 0) return { nhan: "Đến hạn hôm nay", tong: "danger", quaHan: true };
  if (soNgay <= 3) return { nhan: `Còn ${soNgay} ngày`, tong: "warning", quaHan: false };
  return { nhan: `Còn ${soNgay} ngày`, tong: "primary", quaHan: false };
}

// ------------------------------------------------------------
// GOM NHÓM CHO BẢNG
// ------------------------------------------------------------

export interface TheDeNghiTrenBang {
  deNghi: DeNghiMuaHang;
  giaiDoan: GiaiDoanMuaHang;
  han: HanXuLy;
  /** Người phụ trách lấy từ các dòng đã phân bổ, không trùng lặp. */
  nguoiPhuTrach: string[];
  soDongChuaPhanBo: number;
  /** Mã các đơn đặt hàng đã lập cho đề nghị này. */
  maPOLienQuan: string[];
}

export interface CotBangQuyTrinh {
  giaiDoan: MoTaGiaiDoan;
  the: TheDeNghiTrenBang[];
  soQuaHan: number;
}

/** Dựng đủ 8 cột theo đúng thứ tự, kể cả cột rỗng — cột rỗng cũng là thông tin. */
export function dungBangQuyTrinh(
  tatCaDeNghi: DeNghiMuaHang[],
  tatCaPO: DonDatHang[],
  tatCaBaoGia: BaoGia[],
  tatCaPhieu: PhieuNhanHang[],
  moc: Date = new Date(),
): CotBangQuyTrinh[] {
  // 🔴 BỎ HỒ SƠ ĐÃ LƯU TRỮ khỏi bảng (chỉ đạo Ban lãnh đạo 10/08/2026, menu ⋯ theo Base).
  // Lưu trữ ≠ đóng dở: hồ sơ vẫn nguyên trạng thái nghiệp vụ, chỉ không hiện trên bảng cho
  // đỡ rối. Bỏ lưu trữ là nó quay lại đúng cột cũ, vì cột suy ra từ chứng từ chứ không lưu.
  const the: TheDeNghiTrenBang[] = tatCaDeNghi
    .filter((dn) => !dn.luuTru)
    .map((deNghi) => {
    const giaiDoan = xacDinhGiaiDoan(deNghi, tatCaPO, tatCaBaoGia, tatCaPhieu);
    return {
      deNghi,
      giaiDoan,
      han: hanXuLyDeNghi(deNghi, giaiDoan, moc),
      nguoiPhuTrach: [
        ...new Set(
          deNghi.items
            .map((d) => d.nguoiPhuTrachTen)
            .filter((x): x is string => Boolean(x)),
        ),
      ],
      soDongChuaPhanBo: deNghi.items.filter((d) => !d.nguoiPhuTrachUid).length,
      maPOLienQuan: tatCaPO
        .filter((po) => po.prId === deNghi.id && po.trangThai !== "huy")
        .map((po) => po.code),
    };
  });

  return GIAI_DOAN_MUA_HANG.map((giaiDoan) => {
    const cuaCot = the.filter((t) => t.giaiDoan === giaiDoan.ma);
    return {
      giaiDoan,
      // Việc gấp và việc sắp trễ nổi lên trên — đúng thói quen đọc bảng của trưởng bộ phận.
      the: [...cuaCot].sort(
        (a, b) => new Date(a.deNghi.ngayCanHang).getTime() - new Date(b.deNghi.ngayCanHang).getTime(),
      ),
      soQuaHan: cuaCot.filter((t) => t.han.quaHan).length,
    };
  });
}

// ------------------------------------------------------------
// KÉO THẢ TRÊN BẢNG
//
// Giai đoạn được SUY RA từ chứng từ (nguyên tắc đầu file) nên kéo thẻ sang cột
// mới KHÔNG phải là "đổi nhãn" — nó phải LÀM ĐÚNG NGHIỆP VỤ của cột đó:
//   · Bước làm ngay được (tạo bảng báo giá, chốt so sánh, đóng dở) → làm luôn, thẻ tự chuyển
//   · Bước cần người quyết định (chọn NCC, lập PO, ghi phiếu nhận) → mở đúng màn hình đó
//   · Bước không hợp lệ (kéo lùi, nhảy cóc, ép hoàn thành) → giải thích lý do, thẻ đứng yên
// ------------------------------------------------------------

export type HanhDongKeoTha =
  | { loai: "tao_bao_gia" }
  | { loai: "chot_so_sanh" }
  | { loai: "dong_do" }
  | { loai: "mo_trang"; duongDan: string; thongBao: string }
  | { loai: "khong_the"; lyDo: string };

const THU_TU_GIAI_DOAN: GiaiDoanMuaHang[] = GIAI_DOAN_MUA_HANG.map((g) => g.ma);

/**
 * Quyết định điều gì xảy ra khi thả thẻ `the` vào cột `dich`.
 * Hàm thuần — không đụng dữ liệu; việc thực thi nằm ở trang gọi nó.
 * Trả về null khi thả về đúng cột cũ (không làm gì).
 */
/**
 * BƯỚC HIỆN TẠI ĐÃ LÀM XONG CHƯA — trả về lý do còn vướng, `null` nghĩa là đủ điều kiện
 * sang bước sau.
 *
 * 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 10/08/2026: *"sao chưa phân bổ công việc mà đã đi tới bước 4 rồi,
 * phải hoàn thành công việc ở các bước trước thì mới được thực hiện các bước tiếp theo"*.
 *
 * 🔴 ĐẶT Ở ĐÂY LÀ CỐ Ý — MỘT LUẬT, MỌI ĐƯỜNG DÙNG CHUNG. Đề nghị chuyển bước qua nhiều
 * đường khác nhau: kéo thả trên bảng, nút "Lập bảng báo giá"
 * ở trang chi tiết. Nếu mỗi đường tự kiểm riêng thì bịt được đường này lại hở đường khác —
 * đã xảy ra thật: bịt kéo thả nhưng một đường khác vẫn lập bảng báo giá khi chưa phân
 * bổ dòng nào, thế là đề nghị nhảy sang bước ② rồi ④ mà không ai được phân công.
 *
 * ⚠️ Đây là LUẬT CỨNG (chặn), khác `dungXacNhanKeoTha` là cảnh báo mềm (chỉ hỏi lại).
 */
export function vuongMacSangBuocSau(
  deNghi: DeNghiMuaHang,
  giaiDoan: GiaiDoanMuaHang,
  baoGiaCuaDeNghi: BaoGia[],
): string | null {
  const conSong = baoGiaCuaDeNghi.filter((b) => b.trangThai !== "huy");

  switch (giaiDoan) {
    case "tiep_nhan": {
      // Xong bước ① = đã có người phụ trách cho MỌI dòng vật tư. Còn dòng chưa ai nhận thì
      // đi tiếp là bỏ rơi dòng đó: không ai đi hỏi giá, không ai lập đơn cho nó.
      const chuaPhanBo = deNghi.items.filter((d) => !d.nguoiPhuTrachUid).length;
      return chuaPhanBo > 0
        ? `Còn ${chuaPhanBo} trong ${deNghi.items.length} dòng vật tư chưa phân bổ người phụ trách. Phân bổ hết ở bảng "Phân bổ công việc" trước khi sang bước sau.`
        : null;
    }

    case "yeu_cau_bao_gia":
      return conSong.some((b) => b.trangThai === "dang_thu_thap")
        ? null
        : "Chưa có bảng báo giá nào đang thu thập giá cho đề nghị này.";

    case "xet_duyet_bao_gia":
      // Xong bước ③ = đã DUYỆT (chốt nhà cung cấp hoặc duyệt phương án chia đơn).
      return conSong.some((b) => b.trangThai === "da_so_sanh")
        ? "Bảng báo giá chưa được duyệt. Trưởng bộ phận phải chốt nhà cung cấp (hoặc duyệt phương án chia đơn) trước khi lập đơn đặt hàng."
        : null;

    default:
      // Các bước sau đã được chặn bằng chứng từ thật (đơn hàng, phiếu nhận, 3 lớp xác nhận).
      return null;
  }
}

export function quyetDinhKeoTha(
  the: TheDeNghiTrenBang,
  dich: GiaiDoanMuaHang,
  poCuaDeNghi: DonDatHang[],
  baoGiaCuaDeNghi: BaoGia[],
): HanhDongKeoTha | null {
  const tu = the.giaiDoan;
  if (tu === dich) return null;

  if (giaiDoanDaKetThuc(tu)) {
    return { loai: "khong_the", lyDo: "Đề nghị đã kết thúc — không kéo được nữa." };
  }

  if (dich === "that_bai") return { loai: "dong_do" };

  if (dich === "hoan_thanh") {
    return {
      loai: "khong_the",
      lyDo: "Hoàn thành cần đủ 3 điều kiện: giao đủ khối lượng + thủ kho xác nhận + trưởng bộ phận xác nhận — thao tác ở trang chi tiết đơn hàng.",
    };
  }

  const buocTu = THU_TU_GIAI_DOAN.indexOf(tu);
  const buocDich = THU_TU_GIAI_DOAN.indexOf(dich);

  if (buocDich < buocTu) {
    return {
      loai: "khong_the",
      lyDo: "Không kéo lùi được — giai đoạn suy ra từ chứng từ thật (báo giá, đơn hàng, phiếu nhận). Muốn lùi phải hủy chứng từ tương ứng.",
    };
  }

  if (buocDich > buocTu + 1) {
    return { loai: "khong_the", lyDo: "Chỉ chuyển được sang bước liền kề, không nhảy cóc." };
  }

  // 🔴 BƯỚC TRƯỚC PHẢI XONG MỚI ĐI TIẾP (chỉ đạo Ban lãnh đạo 10/08/2026). Dùng chung luật
  // với các đường chuyển bước khác — xem `vuongMacSangBuocSau`.
  const vuongMac = vuongMacSangBuocSau(the.deNghi, tu, baoGiaCuaDeNghi);
  if (vuongMac) return { loai: "khong_the", lyDo: vuongMac };

  // Từ đây trở xuống: dich là bước LIỀN KỀ phía trước
  switch (tu) {
    case "tiep_nhan":
      return { loai: "tao_bao_gia" };

    case "yeu_cau_bao_gia":
      return baoGiaCuaDeNghi.some((b) => b.trangThai === "dang_thu_thap")
        ? { loai: "chot_so_sanh" }
        : { loai: "khong_the", lyDo: "Chưa có bảng báo giá đang thu thập nào cho đề nghị này." };

    case "xet_duyet_bao_gia": {
      const bg = baoGiaCuaDeNghi.find((b) => b.trangThai === "da_so_sanh");
      return {
        loai: "mo_trang",
        duongDan: bg ? `/bao-gia/${bg.id}` : "/bao-gia",
        thongBao: "Chọn nhà cung cấp trong bảng so sánh — chọn xong thẻ tự chuyển bước.",
      };
    }

    case "lap_don_mua_hang": {
      const poNhap = poCuaDeNghi.find((po) => po.trangThai === "nhap");
      return poNhap
        ? {
            loai: "mo_trang",
            duongDan: `/don-hang/${poNhap.id}`,
            thongBao: "Chốt đơn hàng nháp — chốt xong thẻ tự chuyển bước.",
          }
        : {
            loai: "mo_trang",
            duongDan: "/don-hang/tao-moi",
            thongBao: "Lập đơn hàng cho đề nghị — lập xong thẻ tự chuyển bước.",
          };
    }

    case "dat_hang": {
      const po = poCuaDeNghi.find((p) => p.trangThai === "da_chot") ?? poCuaDeNghi[0];
      return {
        loai: "mo_trang",
        duongDan: po ? `/don-hang/${po.id}` : "/don-hang",
        thongBao: "Ghi phiếu nhận hàng lần đầu — có hàng về là thẻ tự chuyển bước.",
      };
    }

    default:
      return { loai: "khong_the", lyDo: "Bước chuyển này chưa được hỗ trợ." };
  }
}

// ------------------------------------------------------------
// XÁC NHẬN TRƯỚC KHI CHUYỂN BƯỚC
//
// Chỉ đạo Ban lãnh đạo 08/08/2026: "nhiều khi do sơ suất mà kéo nhầm qua bước
// tiếp theo mà bước trước chưa thực hiện xong".
//
// 🔴 Hai việc khác nhau, đừng gộp:
//   · quyetDinhKeoTha  — bước này có ĐƯỢC PHÉP không (luật cứng, sai thì chặn)
//   · dungXacNhanKeoTha — bước này ĐƯỢC PHÉP, nhưng có gì đáng ngờ không (cảnh báo mềm)
//
// Cảnh báo ở đây CỐ Ý KHÔNG CHẶN. Việc dang dở ở bước trước là chuyện thường gặp
// và nhiều khi có lý do chính đáng (VD phân bổ nốt sau, hàng về trước giấy tờ).
// Chặn cứng sẽ làm người dùng bí việc; nhiệm vụ của hộp này là BẮT NGƯỜI DÙNG NHÌN
// rồi tự quyết. Muốn cấm hẳn một bước thì thêm luật vào `quyetDinhKeoTha`.
// ------------------------------------------------------------

export interface XacNhanKeoTha {
  /** Mã đề nghị đang kéo. */
  maDeNghi: string;
  tuBuoc: string;
  denBuoc: string;
  /** Điều sẽ xảy ra nếu bấm xác nhận — nói bằng lời người dùng hiểu. */
  seLam: string;
  /** Việc còn dang dở ở bước hiện tại. Rỗng = không có gì đáng ngờ. */
  canhBao: string[];
  nhanNut: string;
  /** Đóng dở là việc nặng — nút để tông nguy hiểm. */
  nguyHiem: boolean;
}

export function dungXacNhanKeoTha(
  the: TheDeNghiTrenBang,
  dich: GiaiDoanMuaHang,
  hanhDong: HanhDongKeoTha,
  poCuaDeNghi: DonDatHang[],
  phieuCuaDeNghi: PhieuNhanHang[],
): XacNhanKeoTha {
  const nhanBuoc = (ma: GiaiDoanMuaHang) => NHAN_GIAI_DOAN[ma]?.nhan ?? ma;

  const canhBao: string[] = [];

  // ① Còn dòng chưa phân bổ cho ai — hay gặp nhất, và là thứ thẻ đã cảnh báo sẵn trên bảng.
  if (the.soDongChuaPhanBo > 0) {
    canhBao.push(
      `Còn ${the.soDongChuaPhanBo} dòng vật tư chưa phân bổ cho nhân viên nào.`,
    );
  }

  // ② Đơn hàng còn ở dạng nháp — chưa chốt thì nhà cung cấp chưa nhận được gì.
  const soNhap = poCuaDeNghi.filter((po) => po.trangThai === "nhap").length;
  if (soNhap > 0) {
    canhBao.push(`Còn ${soNhap} đơn đặt hàng ở trạng thái nháp, chưa chốt.`);
  }

  // ③ Phiếu nhận chờ kiểm tra — khối lượng CHƯA được tính (nguyên tắc dữ liệu số 4).
  const soChoKiemTra = phieuCuaDeNghi.filter((p) => p.trangThai === "cho_kiem_tra").length;
  if (soChoKiemTra > 0) {
    canhBao.push(
      `Còn ${soChoKiemTra} phiếu nhận hàng đang chờ kiểm tra — khối lượng chưa được tính vào đã nhận.`,
    );
  }

  // ④ Đề nghị đã trễ hạn cần hàng.
  if (the.han.quaHan) {
    canhBao.push(`Đề nghị đã ${the.han.nhan.toLowerCase()} so với ngày cần hàng.`);
  }

  const chung = {
    maDeNghi: the.deNghi.code,
    tuBuoc: nhanBuoc(the.giaiDoan),
    denBuoc: nhanBuoc(dich),
    canhBao,
  };

  switch (hanhDong.loai) {
    case "tao_bao_gia":
      return {
        ...chung,
        seLam: "Tạo một bảng báo giá mới cho đề nghị này, rồi chuyển thẻ sang bước mới.",
        nhanNut: "Tạo bảng báo giá",
        nguyHiem: false,
      };
    case "chot_so_sanh":
      return {
        ...chung,
        seLam:
          "Chốt bảng báo giá đang thu thập để chuyển sang so sánh. Dòng nào chưa có giá sẽ được điền giá mẫu.",
        nhanNut: "Chốt báo giá",
        nguyHiem: false,
      };
    case "dong_do":
      return {
        ...chung,
        denBuoc: nhanBuoc("that_bai"),
        seLam: "Đóng dở đề nghị. Đề nghị chuyển vào cột Thất bại và KHÔNG mua tiếp.",
        nhanNut: "Đóng dở đề nghị",
        nguyHiem: true,
      };
    case "mo_trang":
      return {
        ...chung,
        seLam: `${hanhDong.thongBao} Thẻ CHƯA chuyển bước cho tới khi việc đó xong.`,
        nhanNut: "Mở màn hình đó",
        nguyHiem: false,
      };
    default:
      // "khong_the" không bao giờ tới được đây — trang gọi đã chặn và báo lý do trước.
      return { ...chung, seLam: "", nhanNut: "Xác nhận", nguyHiem: false };
  }
}
