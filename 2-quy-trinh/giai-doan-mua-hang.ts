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
  TienDoDongDeNghi,
} from "@/3-du-lieu/kieu-du-lieu";
import type { Tong } from "@/2-quy-trinh/trang-thai";
import { soSanhDeNghiUuTien } from "@/2-quy-trinh/sap-xep-uu-tien";
import {
  caiDatCuaBuoc,
  type CauHinhQuyTrinh,
  type CongViecGiaiDoan,
} from "@/2-quy-trinh/cau-hinh-quy-trinh";
// Luật đối chiếu khối lượng đã lên đơn — dùng lại, không tự cộng ở đây.
// (`tinh-toan.ts` chỉ import kiểu dữ liệu nên không tạo vòng import.)
import { tinhTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
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
    // Từ 13/08/2026 thẻ vào cột này ngay khi phân bổ đủ người, chưa cần có bảng báo giá —
    // nên câu mô tả phải nói đúng việc đang chờ: nhân viên đi hỏi giá.
    moTa: "Đã giao việc, nhân viên đang liên hệ nhà cung cấp lấy báo giá",
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

  // ⑦ Hoàn thành — mọi đơn hàng của đề nghị đều đã xong VÀ không còn dòng vật tư nào chưa
  // lên đơn.
  if (deNghi.trangThai === "hoan_thanh") return "hoan_thanh";
  if (poCuaDeNghi.length > 0 && poCuaDeNghi.every((po) => po.trangThai === "hoan_thanh")) {
    /**
     * 🔴 PHẢI KIỂM ĐỦ PHỦ TOÀN BỘ DÒNG, không chỉ nhìn các đơn đã tồn tại.
     *
     * App cố ý cho lập đơn TỪNG PHẦN (tách đơn cho nhiều NCC, mỗi NCC một đơn riêng), và
     * một đơn được xác nhận hoàn thành chỉ dựa trên phạm vi của chính nó. Nên đề nghị 5
     * dòng mới lập 1 đơn cho 2 dòng, đơn đó xong là cả đề nghị bị coi như xong — trong khi
     * 3 dòng kia còn đang hỏi giá.
     *
     * Hậu quả trước 14/08/2026: thẻ nhảy sang cột Hoàn thành, `hanXuLyDeNghi` tắt luôn cảnh
     * báo quá hạn, ba dòng vật tư còn lại biến mất khỏi tầm mắt trưởng bộ phận và có thể
     * trễ ngày cần hàng mà không ai thấy. Đúng thứ "báo tiến độ ảo" mà nguyên tắc đầu file
     * này sinh ra để chống.
     *
     * Dùng lại `tinhTienDoDeNghi` chứ KHÔNG tự cộng khối lượng ở đây — luật đối chiếu
     * khối lượng chỉ được có MỘT chỗ, hai chỗ cùng tính là sớm muộn cũng lệch nhau.
     */
    const conDongChuaLenDon = tinhTienDoDeNghi(deNghi, tatCaPO, tatCaPhieu).some(
      (d) => d.khoiLuongChuaLenPO > 0,
    );
    if (!conDongChuaLenDon) return "hoan_thanh";
    // Còn dòng chưa lên đơn thì rơi tiếp xuống dưới, các nhánh sau tự xếp đúng cột theo
    // chứng từ đang có.
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

  /**
   * ② PHÂN BỔ XONG CŨNG LÀ SANG BƯỚC 2 — Ban lãnh đạo 13/08/2026: *"các việc này trưởng bộ
   * phận đã giao việc xong nhưng vẫn chưa tự động nhảy qua bước 2"*.
   *
   * 🔴 Trước đó thẻ chỉ rời cột ① khi có bảng báo giá. Nhưng chính mô tả cột ① là *"thu mua
   * đang kiểm tra và **phân bổ người phụ trách**"* — phân bổ xong là hết việc của cột đó.
   * Để thẻ nằm lại là bảng nói sai: trưởng bộ phận nhìn vào tưởng còn phải giao việc, mà
   * việc đã giao rồi; còn nhân viên đang đi hỏi giá thì không thấy phần việc của mình ở
   * đâu trên bảng.
   *
   * ⚠️ PHẢI ĐỦ MỌI DÒNG. Phân bổ một phần thì trưởng bộ phận vẫn còn việc ở cột ① — nhảy
   * cột sớm là những dòng chưa ai làm biến mất khỏi tầm mắt người có trách nhiệm giao.
   *
   * 📌 Vẫn đúng nguyên tắc "suy ra từ chứng từ có thật": người phụ trách được ghi vào dòng
   * đề nghị khi trưởng bộ phận bấm giao việc, không phải một trường trạng thái gõ tay.
   */
  const daPhanBoDu =
    deNghi.items.length > 0 && deNghi.items.every((d) => Boolean(d.nguoiPhuTrachUid));
  if (daPhanBoDu) return "yeu_cau_bao_gia";

  // ① Chưa phát sinh chứng từ nào, và còn dòng chưa có người phụ trách.
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
  /**
   * UID của những người phụ trách — dùng để biết thẻ này có phải việc của người đang xem không.
   *
   * 🔴 PHẢI SO BẰNG UID, KHÔNG SO BẰNG TÊN. `nguoiPhuTrach` chỉ có tên hiển thị, mà công ty
   * hoàn toàn có thể có hai người trùng tên — so tên là đẩy nhầm việc của người khác lên đầu
   * bảng của mình, mà không có dấu hiệu nào để phát hiện.
   */
  uidPhuTrach: string[];
  soDongChuaPhanBo: number;
  /* 📌 ĐÃ BỎ trường `vuongMac` (Ban lãnh đạo 16/08/2026 yêu cầu bỏ dòng cảnh báo trên thẻ).
     Không giữ lại trường không ai đọc: mỗi lần dựng bảng nó vẫn chạy `vuongMacSangBuocSau`
     cho từng hồ sơ, tốn công tính một chuỗi rồi vứt đi. Lý do chặn vẫn được tính ĐÚNG LÚC cần
     — ở hộp xác nhận kéo thả và ở trang chi tiết đề nghị. */
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
  /**
   * UID người đang xem bảng — việc của họ được đẩy lên đầu mỗi cột.
   *
   * Bỏ trống (nơi gọi không quan tâm ai đang xem, VD trang in) thì bảng xếp thuần theo ngày
   * cần hàng như trước.
   */
  uidNguoiXem?: string,
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
      uidPhuTrach: [
        ...new Set(
          deNghi.items
            .map((d) => d.nguoiPhuTrachUid)
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
      the: [...cuaCot].sort((a, b) => soSanhTheTrenBang(a, b, uidNguoiXem)),
      soQuaHan: cuaCot.filter((t) => t.han.quaHan).length,
    };
  });
}

/**
 * THỨ TỰ THẺ TRONG MỘT CỘT — một chỗ duy nhất, dùng cho cả bảng lẫn danh sách.
 *
 * 🔴 Ban lãnh đạo 15/08/2026: *"ở các tài khoản nhân viên, hãy ưu tiên hiển thị các công việc
 * của nhân viên đó đảm nhiệm trước"*. Trước đó nhân viên mở bảng lên thì thẻ của đồng nghiệp
 * nằm chen giữa, phải đọc hết cột mới thấy việc của mình.
 *
 * 👉 Luật thật nằm ở `2-quy-trinh/sap-xep-uu-tien.ts`, MỘT CHỖ DUY NHẤT. Hàm này chỉ là lớp
 * vỏ mỏng để bảng quy trình gọi cho tiện — đừng chép luật vào đây.
 */
export function soSanhTheTrenBang(
  a: TheDeNghiTrenBang,
  b: TheDeNghiTrenBang,
  uidNguoiXem?: string,
): number {
  return soSanhDeNghiUuTien(a.deNghi, b.deNghi, uidNguoiXem);
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
  /**
   * ★ LÙI LẠI MỘT BƯỚC — Ban lãnh đạo 13/08/2026: *"chức năng kéo thả chuyển bước chỉ cho
   * tiến hoặc lùi trong phạm vi 1 bước"*.
   *
   * `ve` là giai đoạn đích, `viec` là câu tả việc app sẽ làm để lùi — hộp xác nhận in ra
   * câu này. Giai đoạn suy ra từ chứng từ nên lùi KHÔNG phải đổi nhãn: phải hủy đúng chứng
   * từ của bước đang đứng, và người dùng cần đọc trước mình sắp hủy cái gì.
   */
  | { loai: "lui_buoc"; ve: GiaiDoanMuaHang; viec: string }
  | { loai: "khong_the"; lyDo: string };

const THU_TU_GIAI_DOAN: GiaiDoanMuaHang[] = GIAI_DOAN_MUA_HANG.map((g) => g.ma);

/**
 * ★ GIAI ĐOẠN `ma` ĐÃ TỚI LƯỢT CHƯA, so với giai đoạn hiện tại của hồ sơ.
 *
 * 🔴 Ban lãnh đạo 19/08/2026: *"Bước 1 thì chỉ hiện trường thông tin của bước 1. Tương tự cho
 * các bước sau"* — trang chi tiết đang bày cả sáu khối bước, kể cả những bước còn trống trơn vì
 * chưa tới lượt, nên người xem phải cuộn qua một dãy khối rỗng để tới đúng bước đang làm.
 *
 * 📌 ĐỂ Ở TẦNG QUY TRÌNH, không để trong file giao diện (quy tắc 3.4b): đây là luật về thứ tự
 * các bước, và `THU_TU_GIAI_DOAN` là bản duy nhất giữ thứ tự đó. Giao diện tự dò thứ tự bằng
 * một mảng chép tay là sớm muộn lệch khi quy trình đổi.
 *
 * ⚠️ Mã lạ (hồ sơ cũ, hoặc dữ liệu từ máy khác đang chạy bản khác) → `indexOf` trả `-1`. Khi đó
 * trả `true` để **hiện ra** chứ không ẩn: thà bày thừa một khối còn hơn giấu mất dữ liệu của
 * người dùng mà không có gì báo.
 */
export function giaiDoanDaToiLuot(
  ma: string,
  giaiDoanHienTai: GiaiDoanMuaHang,
): boolean {
  const i = THU_TU_GIAI_DOAN.indexOf(ma as GiaiDoanMuaHang);
  const iHienTai = THU_TU_GIAI_DOAN.indexOf(giaiDoanHienTai);
  if (i === -1 || iHienTai === -1) return true;
  return i <= iHienTai;
}

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
/**
 * ★ CÔNG VIỆC BẮT BUỘC CỦA BƯỚC MÀ ĐỀ NGHỊ NÀY CHƯA TÍCH XONG.
 *
 * 🔴 MỘT CHỖ DUY NHẤT trả lời câu "còn vướng việc gì". Luật chặn chuyển bước, chữ hiện trên
 * hộp xác nhận, và khối "Công việc của bước" ở trang chi tiết đều gọi vào đây — nếu mỗi chỗ
 * tự lọc lấy thì sớm muộn có chỗ quên xét cờ `batBuocXongCongViec` và chặn (hoặc thả) sai.
 *
 * Trả về mảng rỗng khi: bước không khai việc nào · đã tích xong hết · hoặc cài đặt của bước
 * TẮT "bắt buộc hoàn thành công việc" (khi đó danh sách chỉ còn là lời nhắc).
 */
export function congViecChuaXongCuaBuoc(
  deNghi: DeNghiMuaHang,
  giaiDoan: GiaiDoanMuaHang,
  cauHinh: CauHinhQuyTrinh,
): CongViecGiaiDoan[] {
  if (!caiDatCuaBuoc(cauHinh, giaiDoan).batBuocXongCongViec) return [];
  const daXong = deNghi.congViecDaXong ?? [];
  return (cauHinh.congViecTheoBuoc?.[giaiDoan] ?? []).filter(
    (cv) => cv.batBuoc && !daXong.some((x) => x.maCongViec === cv.ma),
  );
}

export function vuongMacSangBuocSau(
  deNghi: DeNghiMuaHang,
  giaiDoan: GiaiDoanMuaHang,
  baoGiaCuaDeNghi: BaoGia[],
  /**
   * Cấu hình quy trình đang áp dụng — hàm tự tra danh sách công việc và các cờ của bước.
   *
   * 🔴 NHẬN CẢ CẤU HÌNH thay vì nhận rời từng mảnh: nơi gọi chỉ việc đưa `cauHinh` vào, không
   * phải tự quyết "có bắt buộc hay không" — quyết định đó là luật nghiệp vụ, để ở giao diện
   * là sớm muộn hai màn hình xử khác nhau.
   */
  cauHinh: CauHinhQuyTrinh,
): string | null {
  const conSong = baoGiaCuaDeNghi.filter((b) => b.trangThai !== "huy");

  /**
   * ★ CÔNG VIỆC BẮT BUỘC CỦA BƯỚC — kiểm TRƯỚC các điều kiện riêng của từng bước.
   *
   * 🔴 Ban lãnh đạo 14/08/2026 gửi ảnh cài đặt giai đoạn 01 trên Base: ô *"Yêu cầu hoàn thành
   * các công việc được quy định"* đặt là **"Bắt buộc hoàn thành công việc của giai đoạn hiện
   * tại"**, và bước 01 có công việc *"Checkin hàng tồn kho — QLK/TK báo tồn kho thực tế"*.
   *
   * Kiểm ở đây nên MỌI đường chuyển bước đều bị chặn như nhau (kéo thả, nút lập bảng báo
   * giá) — đúng nếp "một luật, mọi đường dùng chung" của hàm này. Danh mục công việc do nơi
   * gọi lấy từ cấu hình quy trình (sửa được ở trang Cài đặt), không viết cứng ở đây.
   */
  const conViecChuaXong = congViecChuaXongCuaBuoc(deNghi, giaiDoan, cauHinh);
  if (conViecChuaXong.length > 0) {
    const ds = conViecChuaXong.map((cv) => `“${cv.ten}”`).join(", ");
    return `Còn ${conViecChuaXong.length} công việc bắt buộc của bước này chưa hoàn thành: ${ds}. Tích hoàn thành ở khối “Công việc của bước” trong trang chi tiết đề nghị.`;
  }

  switch (giaiDoan) {
    case "tiep_nhan": {
      // Xong bước ① = đã có người phụ trách cho MỌI dòng vật tư. Còn dòng chưa ai nhận thì
      // đi tiếp là bỏ rơi dòng đó: không ai đi hỏi giá, không ai lập đơn cho nó.
      const chuaPhanBo = deNghi.items.filter((d) => !d.nguoiPhuTrachUid).length;
      return chuaPhanBo > 0
        ? `Còn ${chuaPhanBo} trong ${deNghi.items.length} công việc chưa phân bổ người phụ trách. Phân bổ hết ở bảng "Phân bổ công việc" trước khi sang bước sau.`
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

/**
 * ★ CÓ ĐƯỢC LẬP ĐƠN ĐẶT HÀNG CHƯA — trả lý do bị chặn, `null` là được phép.
 *
 * 🔴 Ban lãnh đạo 15/08/2026 bắt lỗi: *"bước này sao trưởng phòng chưa duyệt đã đẩy qua tiến
 * hành đặt hàng rồi"*. Thẻ `260001-HPCS-PR-001` đang ở cột ⑤ *Tiến hành đặt hàng* kèm
 * `260001-HPCS-PO-001`, trong khi cột ③ *Xét duyệt báo giá* và cột ④ *Lập đơn mua hàng* đều
 * trống — tức đơn hàng ra đời mà **không ai duyệt giá**.
 *
 * Nguyên nhân: `themDonHang` tạo đơn thẳng ở trạng thái `da_chot` mà không kiểm điều kiện gì.
 * Giai đoạn thì SUY RA từ chứng từ (nguyên tắc đầu file), nên có đơn đã chốt là thẻ nhảy
 * thẳng lên bước ⑤, bỏ qua hai bước giữa. Luật chặn cũ chỉ nằm ở đường KÉO THẢ
 * (`vuongMacSangBuocSau`), còn nút "Lập đơn đặt hàng" đi đường khác nên lọt hết.
 *
 * 🔴 ĐÂY LÀ LỖ HỔNG KIỂM SOÁT CHI TIÊU, không phải lỗi hiển thị. Đơn hàng là cam kết trả tiền
 * cho nhà cung cấp; lập được đơn mà không qua duyệt giá nghĩa là một người có thể tự chọn nhà
 * cung cấp và tự chốt giá, không ai đối chiếu.
 *
 * 📌 Đòi bảng báo giá ở trạng thái `da_chon_ncc` chính là đòi bước ③ đã xong: trạng thái đó
 * chỉ được đặt khi trưởng bộ phận chốt nhà cung cấp hoặc duyệt phương án chia đơn.
 *
 * ---
 *
 * 🔴 HÀM NÀY CHỈ NHẬN BẢNG BÁO GIÁ CỦA MỘT ĐỀ NGHỊ — nó không biết gì về việc "đơn có gắn đề
 * nghị hay không", và **đừng chuyển việc kiểm đó vào đây**: hàm thuộc `2-quy-trinh/` nên chỉ
 * được biết về bảng báo giá. Nơi gọi tự lo phần đó.
 *
 * 📌 DIỄN BIẾN 18/08/2026, ghi lại để không ai dựng lại bản sáng:
 *  · SÁNG — module "Lập đơn mua hàng (PO)" cất được đơn KHÔNG gắn đề nghị. Đơn đó không có bảng
 *    báo giá nào để đối chiếu (gọi hàm này với mảng rỗng là chặn 100%), nên `themDonHang` được
 *    cho **bỏ qua** chốt. Tức đường đó **đi vòng qua đúng lỗ hổng kiểm soát chi tiêu** mà chỉ
 *    đạo 15/08/2026 ở trên sinh ra để vá. Rủi ro đã báo lên Ban lãnh đạo.
 *  · CHIỀU — Ban lãnh đạo trả lời *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*: module đó không cất
 *    đơn nữa, chỉ in / xuất mẫu. `themDonHang` vì vậy đã **siết lại — thiếu `prId` là từ chối
 *    cất**, rồi mới chạy hàm này. Nghĩa là **mọi đơn nằm trong hệ thống đều đã qua chốt này.**
 */
export function vuongMacLapDonHang(baoGiaCuaDeNghi: BaoGia[]): string | null {
  const conSong = baoGiaCuaDeNghi.filter((b) => b.trangThai !== "huy");
  if (conSong.length === 0) {
    return "Chưa có bảng báo giá nào cho đề nghị này. Phải lập bảng báo giá, thu thập giá rồi trình trưởng bộ phận duyệt trước khi lập đơn đặt hàng.";
  }
  if (conSong.some((b) => b.trangThai === "da_chon_ncc")) return null;
  if (conSong.some((b) => b.trangThai === "da_so_sanh")) {
    return "Bảng báo giá đã trình nhưng trưởng bộ phận CHƯA DUYỆT. Phải chốt nhà cung cấp (hoặc duyệt phương án chia đơn) ở bước Xét duyệt báo giá trước khi lập đơn đặt hàng.";
  }
  return "Bảng báo giá còn đang thu thập giá, chưa trình duyệt. Nhập đủ giá rồi bấm trình xét duyệt, trưởng bộ phận duyệt xong mới lập được đơn đặt hàng.";
}

/**
 * ★ DÒNG NÀO CỦA ĐỀ NGHỊ MÀ NGƯỜI NÀY LẬP ĐƯỢC ĐƠN — hàm thuần, MỘT CHỖ DUY NHẤT.
 *
 * Ba điều kiện, cả ba đều bắt buộc:
 *   ① Còn khối lượng chưa lên đơn — hết rồi thì đặt thêm là mua vượt phần đã duyệt.
 *   ② Dòng đã có người phụ trách — dòng chưa phân bổ thuộc bước ①, chưa tới lượt lập đơn.
 *   ③ Là người phụ trách chính dòng đó, HOẶC là người có quyền phân bổ (trưởng bộ phận /
 *      quản trị) — trưởng bộ phận lập đơn thay được cho cả nhóm.
 *
 * 📌 Tách ra khỏi file giao diện ngày 18/08/2026, lúc đó có HAI chỗ cần đúng luật này: form
 * lập đơn (`thanh-phan-nghiep-vu/form-lap-don-mua-hang.tsx` → `dongLapDuoc`) và bước CHỌN ĐỀ
 * NGHỊ của `/don-hang/tao-moi`. **Bước chọn đó đã bị bỏ ngay chiều 18/08/2026** (Ban lãnh đạo:
 * mục menu là module lập đơn ĐỘC LẬP, không hỏi đề nghị nữa), nên nay chỉ còn một nơi gọi.
 * Vẫn giữ ở đây chứ không nhét ngược vào file giao diện: `2-quy-trinh/` là chỗ của luật, và
 * quy tắc 3.4b của dự án cấm để hàm nghiệp vụ trong file giao diện.
 *
 * ⚠️ Ở CHẾ ĐỘ ĐƠN ĐỘC LẬP hàm này không được gọi tới (không có đề nghị nào để lọc dòng) —
 * mặt hàng lúc đó do người lập gõ tự do. Xem bảng hai chế độ ở đầu `form-lap-don-mua-hang.tsx`.
 *
 * ⚠️ Nhận `laNguoiPhanBo` là BOOLEAN, không nhận cả đối tượng `Quyen`: `2-quy-trinh/` là quy
 * tắc nghiệp vụ thuần, không được phụ thuộc vào `4-phan-quyen/`. Chỗ gọi truyền
 * `quyen.phanBoCongViec` vào.
 */
export function dongLapDuocDonHang(
  tienDo: TienDoDongDeNghi[],
  uidNguoiLap: string,
  laNguoiPhanBo: boolean,
): TienDoDongDeNghi[] {
  return tienDo.filter(
    (d) =>
      d.khoiLuongChuaLenPO > 0 &&
      Boolean(d.nguoiPhuTrachUid) &&
      (laNguoiPhanBo || d.nguoiPhuTrachUid === uidNguoiLap),
  );
}

/*
 * 📌 ĐÃ XÓA `dongThuocVeNguoi` NGÀY 18/08/2026 (chiều).
 *
 * Hàm đó sinh ra sáng cùng ngày, chỉ phục vụ **bước chọn đề nghị** của `/don-hang/tao-moi`:
 * nó phân biệt *"đề nghị này chưa phân bổ dòng nào cho bạn"* với *"dòng của bạn đã lên đơn đủ
 * rồi"*. Chiều 18/08/2026 Ban lãnh đạo bỏ hẳn bước chọn (mục menu là module lập đơn ĐỘC LẬP),
 * nên hàm không còn nơi gọi.
 *
 * 🔴 XÓA CHỨ KHÔNG ĐỂ LẠI: một hàm xuất khẩu không ai gọi trông y như đang có chức năng, và
 * người sau sẽ mất công dò xem nó chạy ở đâu. Cần lại thì lấy ở lịch sử git.
 */

/**
 * ★ KÉO LÙI MỘT BƯỚC — quyết định app phải hủy chứng từ nào.
 *
 * 🔴 Ban lãnh đạo 13/08/2026: *"chỉ cho tiến hoặc lùi trong phạm vi 1 bước"*.
 *
 * ⚠️ LÙI KHÔNG PHẢI ĐỔI NHÃN. Giai đoạn được SUY RA từ chứng từ có thật, nên muốn thẻ về
 * cột trước thì phải hủy đúng chứng từ đang giữ nó ở cột này. Nếu chỉ đổi nhãn thì lần vẽ
 * lại bảng tiếp theo thẻ tự nhảy về chỗ cũ — người dùng tưởng app hỏng.
 *
 * 🔒 CHẶN LÙI TỪ "NHẬN HÀNG": phiếu nhận là chứng từ của KHO, và theo nguyên tắc dữ liệu số
 * 2 thì Kho là nguồn duy nhất của số lượng thực nhận — Thu mua không được xóa phiếu của họ.
 */
function quyetDinhLui(
  tu: GiaiDoanMuaHang,
  ve: GiaiDoanMuaHang,
  poCuaDeNghi: DonDatHang[],
  baoGiaCuaDeNghi: BaoGia[],
): HanhDongKeoTha {
  switch (tu) {
    case "yeu_cau_bao_gia": {
      // Về ①: bỏ hết phân bổ, và hủy bảng báo giá nếu đã lập.
      const bg = baoGiaCuaDeNghi.filter((b) => b.trangThai !== "huy");
      const coGia = bg.some((b) => b.items.some((d) => d.baoGiaNCC.length > 0));
      if (coGia) {
        return {
          loai: "khong_the",
          lyDo: "Bảng báo giá đã có giá của nhà cung cấp — lùi về bước ① sẽ mất số liệu đó. Hủy bảng báo giá ở trang chi tiết nếu thật sự muốn làm lại.",
        };
      }
      return {
        loai: "lui_buoc",
        ve,
        viec:
          bg.length > 0
            ? "Hủy bảng báo giá trống và bỏ toàn bộ phân bổ người phụ trách."
            : "Bỏ toàn bộ phân bổ người phụ trách — đề nghị về lại bước tiếp nhận.",
      };
    }

    case "xet_duyet_bao_gia":
      // Về ②: mở lại bảng báo giá cho nhân viên thu thập tiếp. KHÔNG mất giá đã nhập.
      return {
        loai: "lui_buoc",
        ve,
        viec: "Mở lại bảng báo giá để thu thập tiếp. Giá đã nhập vẫn giữ nguyên.",
      };

    case "lap_don_mua_hang": {
      // Về ③: bỏ nhà cung cấp đã chốt. Còn đơn nháp thì phải hủy đơn trước.
      if (poCuaDeNghi.some((po) => po.trangThai === "nhap")) {
        return {
          loai: "khong_the",
          lyDo: "Đã có đơn đặt hàng nháp cho đề nghị này. Hủy đơn nháp trước rồi mới lùi được về bước xét duyệt báo giá.",
        };
      }
      return {
        loai: "lui_buoc",
        ve,
        viec: "Bỏ nhà cung cấp đã chốt — bảng báo giá về trạng thái chờ duyệt.",
      };
    }

    case "dat_hang":
      // Về ④: đưa đơn đã chốt về nháp để sửa lại.
      return {
        loai: "lui_buoc",
        ve,
        viec: "Đưa các đơn đã chốt về trạng thái nháp để sửa lại. Đơn chưa gửi nhà cung cấp thì làm được; đã gửi rồi thì phải thông báo cho họ.",
      };

    case "nhan_hang":
      return {
        loai: "khong_the",
        lyDo: "Đã có phiếu nhận hàng của Kho. Phiếu nhận là chứng từ của Kho — Thu mua không xóa được. Nhờ thủ kho hủy phiếu trước.",
      };

    default:
      return {
        loai: "khong_the",
        lyDo: "Bước này không lùi được.",
      };
  }
}

export function quyetDinhKeoTha(
  the: TheDeNghiTrenBang,
  dich: GiaiDoanMuaHang,
  poCuaDeNghi: DonDatHang[],
  baoGiaCuaDeNghi: BaoGia[],
  /** Cấu hình quy trình — hàm tự tra công việc bắt buộc và cài đặt của bước đang đứng. */
  cauHinh: CauHinhQuyTrinh,
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
      // ⚠️ ĐỦ BỐN, không phải ba. Điều kiện tệp phiếu giao nhận thêm ngày 11/08/2026 nhưng
      // câu này quên cập nhật — người dùng làm đủ đúng ba việc như app hướng dẫn mà nút vẫn
      // khóa, lại không chỗ nào nói điều kiện thứ tư đang chặn họ.
      lyDo: "Hoàn thành cần đủ 4 điều kiện: giao đủ khối lượng + mọi lần giao đều có phiếu giao nhận đính kèm + thủ kho xác nhận + trưởng bộ phận xác nhận — thao tác ở trang chi tiết đơn hàng.",
    };
  }

  const buocTu = THU_TU_GIAI_DOAN.indexOf(tu);
  const buocDich = THU_TU_GIAI_DOAN.indexOf(dich);

  /**
   * ★ PHẠM VI KÉO THẢ: ĐÚNG MỘT BƯỚC, cả tiến lẫn lùi — Ban lãnh đạo 13/08/2026.
   * Bản trước chặn lùi hoàn toàn; nay lùi được nhưng chỉ một bước.
   */
  if (buocDich < buocTu - 1 || buocDich > buocTu + 1) {
    return {
      loai: "khong_the",
      lyDo: "Chỉ kéo được sang bước liền kề — tiến một bước hoặc lùi một bước, không nhảy cóc.",
    };
  }

  if (buocDich === buocTu - 1) return quyetDinhLui(tu, dich, poCuaDeNghi, baoGiaCuaDeNghi);

  /**
   * 🔴 BƯỚC TRƯỚC PHẢI XONG MỚI ĐI TIẾP (chỉ đạo Ban lãnh đạo 10/08/2026) — nhưng CHỈ chặn
   * ở bước ①, không chặn chung mọi bước.
   *
   * ⚠️ Trước 14/08/2026 chốt này chạy cho MỌI bước, ngay trước `switch`, nên nó giết luôn
   * hai nhánh bên dưới đã cố tình thiết kế để dẫn người dùng đi tiếp:
   *   · bước ② chưa có bảng báo giá → lẽ ra MỞ màn lập bảng, lại bị chặn
   *   · bước ③ bảng chưa duyệt → lẽ ra MỞ bảng so sánh để chốt NCC, cũng bị chặn
   * Đúng cái "làm người dùng kẹt" mà chú thích trong hai nhánh đó nói đã sửa: đứng ở cột ②,
   * kéo sang ③ thì bị chặn, mà trên bảng không có đường nào khác để lập bảng báo giá.
   *
   * Bỏ chốt ở hai bước đó KHÔNG mở đường đi tắt: cả hai nhánh đều trả về hành động MỞ MÀN
   * để làm việc thật (lập bảng / chọn NCC), thẻ chỉ chuyển cột khi chứng từ có thật — đúng
   * nguyên tắc "giai đoạn suy ra từ chứng từ, kéo thả không đổi nhãn chay".
   */
  /**
   * ★ CÔNG VIỆC BẮT BUỘC CHƯA XONG THÌ MỞ HỘP CHO TÍCH NGAY, KHÔNG CHẶN BẰNG MỘT CÂU BÁO LỖI.
   *
   * 🔴 Ban lãnh đạo 16/08/2026: *"khi trưởng bộ phận kéo sang bước 2 là phải hiện xác nhận đã
   * check hàng tồn kho, nếu chưa tích xác nhận thì chưa cho chuyển"*.
   *
   * Trước đây chỗ này trả `khong_the` kèm câu *"Tích hoàn thành ở khối Công việc của bước
   * trong trang chi tiết đề nghị"* — người dùng đang đứng ở BẢNG QUY TRÌNH, bị đuổi sang một
   * màn khác, làm xong lại phải quay về kéo lại. Hộp chuyển bước vốn đã có sẵn chỗ hiện việc
   * còn treo và khóa nút; chặn từ đây thì hộp đó không bao giờ mở ra được.
   *
   * 📌 Nút trong hộp VẪN KHÓA cho tới khi tích đủ — đây là mở đường làm việc, không phải mở
   * đường đi tắt. Luật chặn vẫn là `congViecChuaXongCuaBuoc`, một chỗ duy nhất.
   */
  if (tu === "tiep_nhan") {
    /* Vướng mắc KHÁC công việc bắt buộc (còn dòng chưa phân bổ người) thì vẫn chặn thẳng:
       việc đó phải làm ở bảng Phân bổ, hộp chuyển bước không giải quyết được. */
    const vuongMac = vuongMacSangBuocSau(the.deNghi, tu, baoGiaCuaDeNghi, {
      ...cauHinh,
      congViecTheoBuoc: {},
    });
    if (vuongMac) return { loai: "khong_the", lyDo: vuongMac };
  }

  // Từ đây trở xuống: dich là bước LIỀN KỀ phía trước
  switch (tu) {
    case "tiep_nhan":
      return { loai: "tao_bao_gia" };

    case "yeu_cau_bao_gia":
      /**
       * ⚠️ TỪ 13/08/2026 thẻ vào cột này ngay khi phân bổ đủ người, nên hoàn toàn có thể
       * CHƯA có bảng báo giá nào. Bản trước trả "không thể" kèm lý do — đúng sự thật nhưng
       * làm người dùng kẹt: họ đứng ở cột ②, kéo sang ③ thì bị chặn, mà trên bảng không có
       * đường nào để lập bảng báo giá. Nay mở thẳng màn lập bảng, đúng việc họ đang cần làm.
       */
      return baoGiaCuaDeNghi.some((b) => b.trangThai === "dang_thu_thap")
        ? { loai: "chot_so_sanh" }
        : { loai: "tao_bao_gia" };

    case "xet_duyet_bao_gia": {
      /**
       * 🔴 DẪN VỀ TRANG CHI TIẾT ĐỀ NGHỊ, không phải màn Báo giá — Ban lãnh đạo 20/08/2026 chốt
       * **bỏ hẳn màn Báo giá** cùng bảng so sánh giá nhập tay.
       *
       * ⚠️ Bản trước dẫn tới `/bao-gia/{id}` kèm câu *"Chọn nhà cung cấp trong bảng so sánh"*.
       * Để nguyên là người kéo thẻ đúng luật bị đưa tới một trang **không còn tồn tại**, thẻ
       * đứng yên, và **không lỗi nào báo** — kiểu hỏng khó tìm nhất.
       *
       * Nút Duyệt / Không duyệt nay nằm trong khối bước ③ ở trang chi tiết đề nghị.
       */
      return {
        loai: "mo_trang",
        duongDan: `/de-nghi/${the.deNghi.id}`,
        thongBao:
          "Trưởng bộ phận duyệt trong khối bước “Xét duyệt báo giá” ở trang chi tiết đề nghị — duyệt xong thẻ tự chuyển bước.",
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
            /* 🔴 BẮT BUỘC KÈM `?prId=` (sửa 17/08/2026). Thiếu tham số này thì màn lập đơn
               không biết đang lập cho đề nghị nào và trả về khối trống "Chưa chọn đề nghị" —
               người dùng kéo thẻ đúng luật xong bị dẫn tới một trang không làm gì được. */
            duongDan: `/don-hang/tao-moi?prId=${the.deNghi.id}`,
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
      `Còn ${the.soDongChuaPhanBo} công việc chưa phân bổ cho nhân viên nào.`,
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
    case "lui_buoc":
      return {
        ...chung,
        // 🔴 `nguyHiem: true` — lùi bước là HỦY CHỨNG TỪ, không phải đổi nhãn. Nút đỏ để
        // người dùng dừng lại đọc một giây, và câu `viec` nói rõ app sắp hủy cái gì.
        seLam: `${hanhDong.viec} Việc này được ghi vào nhật ký kèm tên bạn.`,
        nhanNut: "Lùi một bước",
        nguyHiem: true,
      };
    default:
      // "khong_the" không bao giờ tới được đây — trang gọi đã chặn và báo lý do trước.
      return { ...chung, seLam: "", nhanNut: "Xác nhận", nguyHiem: false };
  }
}
