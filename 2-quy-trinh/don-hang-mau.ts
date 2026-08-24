// ============================================================
// ĐƠN MUA HÀNG "BẢN MẪU" — DỰNG TỪ DỮ LIỆU ĐANG GÕ TRÊN FORM, **KHÔNG GHI VÀO KHO**
//
// 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 18/08/2026: *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*.
//
// BỐI CẢNH — vì sao có file này:
// Sáng 18/08/2026 mục menu "Lập đơn mua hàng (PO)" thành module ĐỘC LẬP (không gắn phiếu đề
// nghị). Chế độ đó ĐI VÒNG QUA chốt kiểm soát chi tiêu `vuongMacLapDonHang` (đòi bảng báo giá
// đã chốt nhà cung cấp) vì không có bảng báo giá nào để đối chiếu. Rủi ro đã được báo lên Ban
// lãnh đạo, và câu trả lời là: chế độ đó **không cất đơn nữa**, chỉ in / xuất mẫu.
//
// ✅ KHÔNG LƯU THÌ KHÔNG CÓ ĐƠN TRONG DỮ LIỆU → KHÔNG ĐI VÒNG QUA CHỐT NÀO CẢ. Rủi ro trên tự
//    nó biến mất. Đây là lý do file này **tuyệt đối không được gọi `themDonHang`**, và cũng
//    không được ai "cải tiến" thành đường cất đơn tắt.
//
// 🔴 ĐƯỜNG GẮN ĐỀ NGHỊ KHÔNG DÙNG FILE NÀY. Vào form bằng `?prId=…` thì vẫn [Lưu] / [Lưu và In]
//    như cũ, vẫn qua `themDonHang`, vẫn bị `vuongMacLapDonHang` chặn. Đó là đường nghiệp vụ
//    chính của app — file này không đụng tới một dòng nào của nó.
//
// 🔴 HÀM THUẦN, ĐỂ Ở `2-quy-trinh/`: quy tắc 3.4b của dự án cấm để hàm nghiệp vụ trong file
//    giao diện — hai chỗ cùng dựng một chứng từ rồi lệch nhau là chuyện dự án đã dính.
//    Không import gì từ `1-giao-dien/`, không đụng kho dữ liệu, không đụng quyền.
// ============================================================

import type {
  DonDatHang,
  DongPO,
  GiaDonDatHang,
  DongGiaPO,
  KieuChietKhau,
  MauDonMuaHang,
  NhaCungCap,
} from "@/3-du-lieu/kieu-du-lieu";

/**
 * ★ SỐ ĐƠN CỦA BẢN MẪU — **CỐ Ý KHÔNG PHẢI MỘT MÃ HỒ SƠ**.
 *
 * 🔴 VÌ SAO KHÔNG SINH `260001-HPCS-PO-001` BẰNG `maDonHangTiepTheo`: bản mẫu không được cất,
 * nên nó sẽ **chiếm một số thứ tự rồi bỏ trống** — dãy mã của dự án thủng một số, đơn cất sau
 * nhảy số, và người đối chiếu chứng từ giấy không hiểu vì sao thiếu. Hàm `maDonHangTiepTheo`
 * cũng KHÔNG giữ chỗ: hai người cùng lập một lúc sẽ thấy cùng một số.
 *
 * 🔴 VÀ NẶNG HƠN: mã hồ sơ theo Thông báo 09/2026/TB-HPCS là mã tra cứu được của công ty. In
 * một mã như thật lên tờ giấy có thể gửi cho nhà cung cấp, trong khi hệ thống không có đơn nào
 * mang mã đó, là tạo ra **chứng từ giả trôi ra ngoài công ty**.
 *
 * Vì vậy ô "Số" ghi thẳng một câu chữ, nhìn là biết không phải mã. Số thật chỉ được cấp lúc
 * cất đơn, ở `3-du-lieu/kho-du-lieu.tsx` → `themDonHang`.
 */
export const SO_DON_BAN_MAU = "(bản mẫu — chưa cấp số)";

/**
 * Khóa kỹ thuật của bản mẫu. `DonDatHang.id` là trường bắt buộc theo kiểu dữ liệu, nhưng bản
 * mẫu không bao giờ vào kho nên giá trị này không tra ra được gì.
 *
 * ⚠️ ĐỪNG DÙNG NÓ LÀM ĐỊA CHỈ. `/in/don-hang/<id>` là trang tĩnh, chỉ sinh sẵn cho danh sách
 * id khai trong `generateStaticParams` — id này không có trong đó nên sẽ ra 404. Bản mẫu in ở
 * `/in/don-hang-mau`, một địa chỉ cố định không có tham số.
 */
export const ID_DON_BAN_MAU = "po-ban-mau-chua-luu";

/**
 * Một dòng của bảng "Hàng tiền" trên form, ở dạng **chuỗi thô người dùng vừa gõ**.
 *
 * 📌 Khai lại ở đây thay vì import `DongNhapDonHang` từ `1-giao-dien/`: thư mục `2-quy-trinh/`
 * không được phụ thuộc giao diện (bản đồ mã nguồn mục 1). TypeScript so kiểu theo cấu trúc nên
 * truyền thẳng `DongNhapDonHang[]` vào vẫn khớp.
 */
export interface DongNhapDonMau {
  laGhiChu: boolean;
  maHang: string;
  tenHang: string;
  thongSo: string;
  dvt: string;
  soLuong: string;
  donGia: string;
  /** % thuế GTGT riêng của dòng. Để trống = theo thuế suất chung của đơn. */
  thueSuat: string;
  truongMoRong1: string;
  mucDich: string;
}

/**
 * ★ DÒNG GÕ TỰ DO ĐÃ ĐỦ ĐỂ VÀO ĐƠN CHƯA — MỘT LUẬT, NHIỀU NƠI DÙNG.
 *
 * 🔴 VÌ SAO PHẢI LÀ MỘT HÀM DÙNG CHUNG: luật này từng được chép tay ở HAI chỗ trong form —
 * điều kiện `hopLe` (đếm dòng đủ để mở nút) và vòng lọc lúc dựng đơn — nhưng khối tính tiền
 * thì KHÔNG có nó. Hệ quả thật: người lập thêm một dòng, gõ Số lượng và Đơn giá nhưng bỏ trống
 * Tên hàng (hoặc ĐVT), màn hình cộng luôn dòng đó vào **"Tổng tiền thanh toán"** cỡ lớn ở đầu
 * form; tới lúc dựng chứng từ thì dòng đó bị bỏ, nên tờ giấy in ra mang một con số NHỎ HƠN con
 * số người lập vừa nhìn và vừa duyệt.
 *
 * 📌 Chuyển từ `1-giao-dien/thanh-phan-nghiep-vu/form-lap-don-mua-hang.tsx` sang đây ngày
 * 18/08/2026 — đúng quy tắc 3.4b (hàm nghiệp vụ không nằm trong file giao diện). Vẫn là MỘT
 * bản duy nhất, form import về dùng.
 *
 * ⚠️ CHỈ ÁP CHO DÒNG GÕ TỰ DO (đơn không gắn đề nghị). Dòng sinh ra từ một dòng đề nghị vốn đã
 * có đủ tên hàng / ĐVT / khối lượng, và khối lượng của nó còn bị cắt về phần còn được đặt —
 * luật riêng, đừng gộp.
 */
export function dongTuDoDuVaoDon(
  d: Pick<DongNhapDonMau, "laGhiChu" | "tenHang" | "dvt" | "soLuong">,
): boolean {
  return (
    !d.laGhiChu && d.tenHang.trim() !== "" && d.dvt.trim() !== "" && Number(d.soLuong) > 0
  );
}

/** Dữ liệu form đưa sang — tất cả đều là thứ người lập đã gõ, không tra cứu thêm gì. */
export interface DauVaoDonHangMau {
  maDuAn: string;
  tenCongTrinh?: string;
  maHopDongCDT?: string;
  ngayHopDongCDT?: string;
  /** Nhà cung cấp — lấy theo những ô người lập gõ, KHÔNG bắt phải có trong danh mục. */
  supplierTen: string;
  maSoThueNCC?: string;
  diaChiNCC?: string;
  nguoiLienHeNCC?: string;
  /* ❌ Bỏ `dienGiai` (Ban lãnh đạo 21/08/2026) — xem `kieu-du-lieu.ts`. */
  thamChieu?: string;
  /** Người lập đơn — in ở ô ký "Bên mua hàng". */
  nguoiPhuTrachTen: string;
  ngayLapPO: string;
  ngayGiaoDuKien: string;
  diaDiemGiaoHang?: string;
  nguoiNhanHangTen?: string;
  /** So dien thoai nguoi nhan hang — ô riêng trên biểu mẫu (21/08/2026). */
  nguoiNhanHangSdt?: string;
  /** Mẫu in đơn — bản mẫu cũng phải in đúng mẫu người lập chọn. */
  mauPO?: MauDonMuaHang;
  /**
   * ★ Điều khoản cuối tờ, sửa được từ 22/08/2026.
   *
   * 🔴 Bản mẫu PHẢI mang theo: người lập sửa điều khoản rồi bấm "In" để soát trước khi cất — bản
   * xem trước mà in bản chuẩn thì họ soát một tờ khác tờ sẽ phát hành.
   */
  dieuKhoanGiaoHang?: string;
  camKetThoaThuan?: string;
  dieuKhoanKhac?: string;
  dong: readonly DongNhapDonMau[];
  kieuChietKhau: KieuChietKhau;
  /** Chuỗi thô của ô nhập — hàm tự đổi sang số, ô trống thành `undefined`. */
  tyLeChietKhau: string;
  chietKhau: string;
  /** ★ Loại tiền in trên tờ đơn (23/08/2026) — bản mẫu phải theo đúng thứ người lập chọn. */
  loaiTien?: string;
  thueSuatGTGT: string;
  dieuKhoanThanhToan?: string;
  soNgayDuocNo?: string;
}

export interface DonHangBanMau {
  po: DonDatHang;
  gia: GiaDonDatHang;
  /**
   * Nhà cung cấp dựng TẠM từ chính những ô người lập gõ.
   *
   * 🔴 KHÔNG tra danh mục `NhaCungCap`. Tờ in và file Excel lấy Địa chỉ + Mã số thuế từ đối
   * tượng này; nhà cung cấp ngoài danh mục (chuyện bình thường — chỉ đạo 10/08/2026 cho phép
   * gõ tự do) sẽ ra chứng từ trống hai ô pháp lý bắt buộc nếu tra danh mục. `undefined` khi
   * người lập chưa gõ ô nào trong hai ô đó.
   */
  ncc?: NhaCungCap;
}

/**
 * Dựng một đơn mua hàng **tạm, trong bộ nhớ** để in và xuất Excel.
 *
 * 🔴 KẾT QUẢ KHÔNG BAO GIỜ ĐƯỢC GHI VÀO KHO DỮ LIỆU. Nó không có số đơn thật (xem
 * `SO_DON_BAN_MAU`), không có trạng thái nghiệp vụ đúng nghĩa, và không trừ khối lượng của
 * phiếu đề nghị nào. Cất đơn thật đi đường khác: `3-du-lieu/kho-du-lieu.tsx` → `themDonHang`.
 *
 * 📌 Dòng ghi chú giữ nguyên quy ước sẵn có của `DongPO`: `sttDongDeNghi = 0`, `donViTinh = ""`,
 * `khoiLuongDat = 0`, `laDongGhiChu = true` — để `laDongHang()` loại nó ra khỏi mọi phép tính.
 * Dòng hàng để `sttDongDeNghi = undefined` (không trỏ về đề nghị nào), **không dùng `0`** vì
 * `0` đã mang nghĩa dòng ghi chú.
 */
export function dungDonHangMau(dv: DauVaoDonHangMau): DonHangBanMau {
  const items: DongPO[] = [];
  const lines: DongGiaPO[] = [];

  for (const d of dv.dong) {
    if (d.laGhiChu) {
      // Ghi chú trống thì bỏ — một dòng trắng giữa chứng từ gửi nhà cung cấp là lỗi trình bày.
      if (d.tenHang.trim() === "") continue;
      items.push({
        sttDong: items.length + 1,
        sttDongDeNghi: 0,
        tenVatLieu: d.tenHang.trim(),
        donViTinh: "",
        khoiLuongDat: 0,
        laDongGhiChu: true,
      });
      continue;
    }

    // Dòng chưa đủ Tên hàng / ĐVT / Số lượng thì BỎ — cùng một luật với ô tổng tiền trên form,
    // nếu không thì tờ in ra một con số khác con số người lập vừa nhìn.
    if (!dongTuDoDuVaoDon(d)) continue;

    const sttDong = items.length + 1;
    items.push({
      sttDong,
      // Bản mẫu không gắn phiếu đề nghị nào — xem `DongPO.sttDongDeNghi`.
      sttDongDeNghi: undefined,
      // Ô trống để `undefined` chứ không lưu chuỗi rỗng: tờ in dựa vào `?? ""` / `?? "—"` để
      // biết ô nào chưa khai.
      maHang: d.maHang.trim() || undefined,
      tenVatLieu: d.tenHang.trim(),
      thongSoKyThuat: d.thongSo.trim() || undefined,
      donViTinh: d.dvt.trim(),
      khoiLuongDat: Number(d.soLuong),
      mucDichSuDung: d.mucDich.trim() || undefined,
      truongMoRong1: d.truongMoRong1.trim() || undefined,
    });
    lines.push({
      sttDong,
      donGia: Number(d.donGia) || 0,
      // Chỉ ghi thuế suất riêng khi người lập THẬT SỰ nhập — để trống thì chứng từ nói đúng
      // "dòng này không có thỏa thuận thuế riêng" và đi theo thuế suất chung của đơn.
      thueSuatGTGT: d.thueSuat.trim() === "" ? undefined : Number(d.thueSuat) || 0,
    });
  }

  const po: DonDatHang = {
    id: ID_DON_BAN_MAU,
    code: SO_DON_BAN_MAU,
    maDuAn: dv.maDuAn,
    maHopDongCDT: dv.maHopDongCDT?.trim() || undefined,
    ngayHopDongCDT: dv.ngayHopDongCDT || undefined,
    /* 🔴 Bản mẫu KHÔNG gắn đề nghị: để `undefined` cả `prId` lẫn `prCode`, không nhét chuỗi
       rỗng. Chuỗi rỗng vẫn "có giá trị" nên mọi chỗ kiểm `po.prId ?` sẽ tưởng là có đề nghị. */
    prId: undefined,
    prCode: undefined,
    tenCongTrinh: dv.tenCongTrinh?.trim() || undefined,
    /* `supplierId` là trường bắt buộc theo kiểu dữ liệu nhưng bản mẫu không liên kết danh mục
       nào — và cả tờ in lẫn file Excel đều KHÔNG đọc trường này. Để chuỗi rỗng cho rõ là
       "không liên kết", thay vì bịa một khóa nhìn như thật. */
    supplierId: "",
    supplierTen: dv.supplierTen.trim(),
    maSoThueNCC: dv.maSoThueNCC?.replace(/\D/g, "") || undefined,
    diaChiNCC: dv.diaChiNCC?.trim() || undefined,
    nguoiLienHeNCC: dv.nguoiLienHeNCC?.trim() || undefined,
    thamChieu: dv.thamChieu?.trim() || undefined,
    /* Bản mẫu không thuộc về ai trong hệ thống — chỉ giữ TÊN để in vào ô ký "Bên mua hàng".
       Mã người dùng để trống: gán mã thật vào một chứng từ không tồn tại là mời nhầm lẫn khi
       ai đó copy đoạn mã này sang đường cất đơn. */
    nguoiPhuTrachUid: "",
    nguoiPhuTrachTen: dv.nguoiPhuTrachTen,
    ngayLapPO: dv.ngayLapPO,
    ngayGiaoDuKien: dv.ngayGiaoDuKien,
    diaDiemGiaoHang: dv.diaDiemGiaoHang?.trim() || undefined,
    nguoiNhanHangTen: dv.nguoiNhanHangTen?.trim() || undefined,
    nguoiNhanHangSdt: dv.nguoiNhanHangSdt?.trim() || undefined,
    mauPO: dv.mauPO,
    dieuKhoanGiaoHang: dv.dieuKhoanGiaoHang,
    camKetThoaThuan: dv.camKetThoaThuan,
    dieuKhoanKhac: dv.dieuKhoanKhac?.trim() || undefined,
    /* 🔴 `nhap` chứ KHÔNG phải `da_chot`. Bản mẫu chưa qua bất kỳ bước duyệt nào; ghi "đã
       chốt" lên một thứ không tồn tại trong hệ thống là đúng kiểu "giao diện hứa một việc app
       không làm" mà quy ước dự án cấm. Trường này không in ra giấy, nhưng vẫn phải nói thật. */
    trangThai: "nhap",
    items,
  };

  const gia: GiaDonDatHang = {
    poId: ID_DON_BAN_MAU,
    poCode: SO_DON_BAN_MAU,
    maDuAn: dv.maDuAn,
    lines,
    /* Bản in thử phải in ĐÚNG loại tiền người lập đang chọn, không ghi cứng VND — nếu không,
       họ đổi sang USD rồi bấm In mà tờ giấy vẫn ghi VND. */
    loaiTien: dv.loaiTien?.trim() || "VND",
    kieuChietKhau: dv.kieuChietKhau,
    /* ⚠️ CHỈ GIỮ CON SỐ CỦA ĐÚNG KIỂU ĐANG CHỌN — y hệt lúc cất đơn thật. `tienChietKhau` suy
       số tiền từ tỷ lệ khi kiểu là "ty_le", nên ghi thêm `chietKhau` lúc đó là để lại một con
       số không ai dùng, đọc chứng từ thấy hai giá trị mâu thuẫn không biết tin cái nào. */
    chietKhau: dv.kieuChietKhau === "so_tien" ? Number(dv.chietKhau) || undefined : undefined,
    tyLeChietKhau: dv.kieuChietKhau === "ty_le" ? Number(dv.tyLeChietKhau) || undefined : undefined,
    thueSuatGTGT: Number(dv.thueSuatGTGT) || undefined,
    dieuKhoanThanhToan: dv.dieuKhoanThanhToan?.trim() || undefined,
    soNgayDuocNo: Number(dv.soNgayDuocNo) || undefined,
  };

  const diaChi = dv.diaChiNCC?.trim();
  const maSoThue = dv.maSoThueNCC?.trim();
  const ncc: NhaCungCap | undefined =
    diaChi || maSoThue
      ? {
          id: "",
          ten: dv.supplierTen.trim(),
          diaChi: diaChi || undefined,
          maSoThue: maSoThue || undefined,
          nguoiLienHe: dv.nguoiLienHeNCC?.trim() || undefined,
        }
      : undefined;

  return { po, gia, ncc };
}

/**
 * Tên file Excel của bản mẫu.
 *
 * 🔴 KHÔNG dùng `tenFileDonHang` (nó đặt tên theo mã PO thật). Tên file phải nói ngay đây là
 * bản mẫu, vì file rời khỏi app rồi thì chỉ còn cái tên để phân biệt với đơn thật đã cất.
 *
 * @param maDuAn Mã dự án gốc, dùng để phân biệt các bản mẫu của những dự án khác nhau.
 * @param ngay   Ngày đơn hàng dạng `yyyy-MM-dd`.
 */
export function tenFileDonHangMau(maDuAn: string, ngay: string): string {
  const duAn = maDuAn.trim().replace(/[\\/:*?"<>|]/g, "-") || "chua-chon-du-an";
  return `MAU-don-mua-hang-${duAn}-${ngay}.xlsx`;
}
