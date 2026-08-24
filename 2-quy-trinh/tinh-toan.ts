// ============================================================
// QUY TẮC TÍNH TOÁN — Phần 6 của đặc tả v0.2
//
// Nguyên tắc bất di bất dịch:
//  1. CHỈ phiếu nhận hàng ở trạng thái "da_nhap_kho" được tính vào khối lượng đã nhận.
//     Hàng "cho_kiem_tra" không tính — tránh báo tiến độ ảo.
//  2. % của PO / Đề nghị = số dòng đã nhận đủ / tổng số dòng.
//     KHÔNG tính theo giá trị tiền, vì Kho và Phòng thi công không xem được giá —
//     tính theo tiền thì họ thấy số khác Thu mua và QLDA, dễ tranh cãi số liệu.
// ============================================================

import type {
  DeNghiMuaHang,
  DongPO,
  DonDatHang,
  GiaDonDatHang,
  KieuChietKhau,
  PhieuNhanHang,
  TienDoDongDeNghi,
  TienDoDongPO,
  TrangThaiDongDeNghi,
} from "@/3-du-lieu/kieu-du-lieu";

/** Chỉ phiếu đã nhập kho mới được tính. */
export function phieuDuocTinh(p: PhieuNhanHang): boolean {
  return p.trangThai === "da_nhap_kho";
}

/**
 * ★ ĐÂY CÓ PHẢI DÒNG HÀNG THẬT KHÔNG (đối lại: dòng ghi chú chèn giữa bảng).
 *
 * Nút "Thêm ghi chú" trên màn Đơn mua hàng của MISA chèn một DÒNG vào giữa bảng hàng chứ
 * không mở ô ghi chú riêng (chỉ đạo Ban lãnh đạo 17/08/2026 — bám màn MISA "100%").
 *
 * 🔴 MỌI VÒNG LẶP QUA `po.items` ĐỀU PHẢI LỌC QUA ĐÂY TRƯỚC. Quên lọc thì dòng ghi chú:
 *   • bị đếm vào mẫu số của `phanTramPO` → phần trăm tiến độ sai;
 *   • nằm chờ nhận hàng vĩnh viễn ở bảng tiến độ, dù nó không phải hàng hóa;
 *   • lọt vào bảng tiền với thành tiền 0 ₫.
 *
 * Đặt thành hàm riêng (thay vì viết `!d.laDongGhiChu` rải rác) để sau này đổi cách đánh dấu
 * dòng ghi chú thì chỉ sửa đúng một chỗ.
 */
export function laDongHang(d: Pick<DongPO, "laDongGhiChu">): boolean {
  return d.laDongGhiChu !== true;
}

/**
 * ★★ DÒNG HÀNG THẬT CỦA MỘT ĐƠN — dùng THAY CHO `po.items.filter(laDongHang)` ở mọi chỗ.
 *
 * 🔴🔴 `?? []` LÀ CHỐT CHỐNG SẬP TRANG, KHÔNG PHẢI VIẾT CHO ĐẸP (23/08/2026).
 *
 * `items` là trường bắt buộc theo kiểu dữ liệu, nên TypeScript tin nó luôn có — nhưng **dữ liệu
 * thật thì không đảm bảo điều đó**: kho chung là một document Firestore mà nhiều máy cùng ghi,
 * đơn nhập từ Excel hoặc đơn của bản chạy thử cũ có thể thiếu khóa `items`. Gặp một đơn như vậy
 * thì `po.items.filter(...)` ném `Cannot read properties of undefined (reading 'filter')` — và vì
 * `tinhTienDoDeNghi` nay được gọi cho **mọi thẻ trên bảng quy trình** (dấu đỏ "chưa nhận đủ
 * hàng"), một đơn hỏng là **cả bảng trắng trơn**, không chỉ một thẻ.
 *
 * 📌 Đã dính thật: lỗi này bắt được lúc chạy thử luật mới ngày 23/08/2026, và trước đó cùng ngày
 * đã làm trang chi tiết đề nghị trắng màn khi nạp một đơn thiếu trường.
 *
 * ⚠️ Trả mảng rỗng nghĩa là đơn đó **không có dòng hàng nào để tính tiến độ** — đúng với thực tế
 * dữ liệu đang có, và không giả vờ tính ra một con số từ hư không.
 */
export function dongHangCuaPO(po: Pick<DonDatHang, "items">): DongPO[] {
  return (po.items ?? []).filter(laDongHang);
}

// ------------------------------------------------------------
// TIẾN ĐỘ THEO PO
// ------------------------------------------------------------

export function tinhTienDoPO(po: DonDatHang, phieuCuaPO: PhieuNhanHang[]): TienDoDongPO[] {
  const phieuHopLe = phieuCuaPO
    .filter(phieuDuocTinh)
    .sort((a, b) => a.lanGiaoThu - b.lanGiaoThu);

  // Dòng ghi chú không phải hàng hóa nên không có tiến độ nhận — xem `laDongHang`.
  return dongHangCuaPO(po).map((dong) => {
    const theoLanGiao = phieuHopLe
      .map((p) => {
        const line = (p.lines ?? []).find((l) => l.sttDongPO === dong.sttDong);
        /* `|| 0` và `?? []`: cùng chốt chống `NaN` / sập trang như trong `tinhTienDoDeNghi` —
           xem chú thích dài ở đó. Thiếu chốt này là tiến độ PO báo "đã nhận đủ" khi chưa đủ. */
        return line
          ? {
              lanGiaoThu: p.lanGiaoThu,
              ngayNhan: p.ngayNhanThucTe,
              khoiLuong: line.khoiLuongThucNhan || 0,
            }
          : null;
      })
      .filter((x): x is { lanGiaoThu: number; ngayNhan: string; khoiLuong: number } => x !== null);

    const khoiLuongDaNhan = theoLanGiao.reduce((s, x) => s + x.khoiLuong, 0);
    const khoiLuongConLai = Math.max(0, dong.khoiLuongDat - khoiLuongDaNhan);
    const phanTram = dong.khoiLuongDat > 0 ? (khoiLuongDaNhan / dong.khoiLuongDat) * 100 : 0;

    return { ...dong, khoiLuongDaNhan, khoiLuongConLai, phanTram, theoLanGiao };
  });
}

/** % của PO = số dòng đã nhận đủ / tổng số dòng. */
export function phanTramPO(tienDo: TienDoDongPO[]): number {
  if (tienDo.length === 0) return 0;
  const duSo = tienDo.filter((d) => d.khoiLuongConLai === 0).length;
  return (duSo / tienDo.length) * 100;
}

export function poDaGiaoDu(tienDo: TienDoDongPO[]): boolean {
  return tienDo.length > 0 && tienDo.every((d) => d.khoiLuongConLai === 0);
}

/**
 * THỦ KHO ĐÃ ĐỦ ĐIỀU KIỆN XÁC NHẬN CHƯA — trả về lý do còn vướng, `null` là được phép.
 *
 * 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 11/08/2026: *"thủ kho khi nhận hàng phải đính kèm file phiếu giao
 * nhận thì mới được bấm hoàn thành"*.
 *
 * 🔴 ĐẶT Ở ĐÂY LÀ CỐ Ý — MỘT LUẬT, MỌI ĐƯỜNG DÙNG CHUNG, đúng nếp đã làm với
 * `vuongMacSangBuocSau`. Nút xác nhận của thủ kho và hàm `poDuDieuKienHoanThanh` đều gọi vào
 * đây; nếu mỗi chỗ tự kiểm thì bịt được nút này lại hở đường kia — chuyện đã xảy ra thật với
 * luật "bước trước phải xong mới đi tiếp".
 *
 * ⚠️ Kiểm TỪNG phiếu, không phải "có ít nhất một tệp". Mỗi lần giao hàng có một phiếu giao
 * nhận riêng của nhà cung cấp; chấp nhận một tệp cho cả đơn thì lần giao thứ hai trở đi
 * không còn chứng từ gốc nào đối chiếu.
 *
 * ⚠️ Phiếu `tu_choi_nhan` KHÔNG đòi tệp — hàng bị từ chối thì không có phiếu giao nhận nào
 * được ký, bắt đính kèm là làm kẹt đơn vĩnh viễn.
 */
export function vuongMacXacNhanKho(phieuCuaPO: PhieuNhanHang[]): string | null {
  // `anhQlkCtr` (ảnh QLK CTR tự gửi kèm, 23/08/2026) coi như ĐÃ có bằng chứng giao nhận —
  // đúng tinh thần chỉ đạo 11/08/2026 (phải có ảnh/phiếu chứng minh hàng đã về), chỉ khác
  // nguồn đính kèm. Không đòi thêm `tepPhieuGiao` khi đã có ảnh này, tránh bắt thủ kho đính
  // kèm 2 lần cho cùng 1 lần giao.
  const thieu = phieuCuaPO.filter(
    (p) => p.trangThai !== "tu_choi_nhan" && !p.tepPhieuGiao && !p.anhQlkCtr,
  );
  if (thieu.length === 0) return null;
  const ds = thieu.map((p) => `lần ${p.lanGiaoThu}`).join(", ");
  return `Còn ${thieu.length} phiếu nhận hàng chưa đính kèm phiếu giao nhận của nhà cung cấp (${ds}). Mở khối "Tiến độ nhận hàng" để bổ sung.`;
}

/**
 * ★ CÒN ĐƯỢC GHI THÊM PHIẾU NHẬN HÀNG KHÔNG — trả lý do bị chặn, `null` là còn được.
 *
 * 🔴 Ban lãnh đạo 15/08/2026: *"khi đã nhận đủ hàng thì không được thêm phiếu ghi nhận nữa"*.
 *
 * Ảnh Sếp gửi cho thấy hậu quả thật: đơn đặt **150 bao**, hai lần giao mỗi lần 150, tổng
 * **đã nhận 300** — nhận gấp đôi số đặt — mà app vẫn ghi *"Đã nhận đủ · Còn lại 0"* và vẫn
 * mời *"Ghi phiếu nhận hàng lần 3"*. Con số 0 đó là do `khoiLuongConLai` dùng `Math.max(0, …)`
 * nên phần vượt bị cắt mất, không ai nhìn ra.
 *
 * 🔴 ĐÂY LÀ LỖI TIỀN BẠC, không phải lỗi giao diện. Khối lượng nhận là căn cứ để kế toán trả
 * tiền nhà cung cấp; nhận thừa mà hệ thống báo "đủ" thì phần thừa vẫn nằm trong sổ và vẫn
 * được thanh toán.
 */
export function vuongMacGhiThemPhieuNhan(tienDo: TienDoDongPO[]): string | null {
  if (tienDo.length === 0) return null;
  if (tienDo.every((d) => d.khoiLuongConLai === 0)) {
    return "Đơn hàng đã nhận đủ toàn bộ khối lượng nên không ghi thêm phiếu nhận được. Nếu nhận thừa hoặc ghi nhầm, sửa lại phiếu đã ghi thay vì thêm phiếu mới.";
  }
  return null;
}

/**
 * ★ KHỐI LƯỢNG GHI TRONG PHIẾU CÓ VƯỢT SỐ CÒN LẠI KHÔNG.
 *
 * Chặn ngay lúc nhập, vì sau khi lưu thì không có đường sửa khối lượng phiếu nhận (phiếu là
 * chứng từ của Kho — nguyên tắc dữ liệu số 2, Thu mua không sửa của họ).
 */
export function vuongMacKhoiLuongNhan(
  tienDo: TienDoDongPO[],
  dongNhap: { sttDongPO: number; khoiLuongThucNhan: number }[],
): string | null {
  const vuot = dongNhap
    .map((l) => {
      const d = tienDo.find((x) => x.sttDong === l.sttDongPO);
      if (!d) return null;
      const thua = l.khoiLuongThucNhan - d.khoiLuongConLai;
      return thua > 0
        ? { ten: d.tenVatLieu, thua, conLai: d.khoiLuongConLai, dvt: d.donViTinh }
        : null;
    })
    .filter((x): x is { ten: string; thua: number; conLai: number; dvt: string } => x !== null);
  if (vuot.length === 0) return null;
  const ds = vuot
    .map((v) => `${v.ten} (còn ${v.conLai} ${v.dvt}, nhập thừa ${v.thua})`)
    .join("; ")
  return `Khối lượng nhập vượt số còn lại: ${ds}. Nhận thừa so với đơn đặt phải xử lý bằng đơn bổ sung, không ghi vượt vào phiếu.`;
}

/**
 * ★ SỐ PHIẾU GIAO NHẬN CỦA NHÀ CUNG CẤP KHÔNG ĐƯỢC TRÙNG NHAU.
 *
 * 🔴 Ban lãnh đạo 15/08/2026: *"tên phiếu giao nhận phải khác nhau, không được trùng tên để
 * sau này có thể tổng hợp"*. Ảnh cho thấy cả hai lần giao đều ghi *"Phiếu NCC: 231"*.
 *
 * Trùng số phiếu thì không đối chiếu được với chứng từ giấy của nhà cung cấp: hai lần giao
 * khác nhau mà cùng một số, kế toán không biết hóa đơn nào ứng với lần giao nào, và một lần
 * giao hoàn toàn có thể bị trả tiền hai lần.
 *
 * 📌 So sau khi bỏ khoảng trắng thừa và không phân biệt hoa/thường — "231" và " 231 " là cùng
 * một tờ phiếu, chặn được cả kiểu gõ lại cho khác.
 */
export function vuongMacSoPhieuNCC(
  soPhieuMoi: string,
  phieuCuaPO: PhieuNhanHang[],
  /** Bỏ qua phiếu này khi so (dùng khi sửa phiếu cũ, không phải thêm mới). */
  boQuaPhieuId?: string,
): string | null {
  const moi = soPhieuMoi.trim().toLowerCase();
  // Để trống được — không phải nhà cung cấp nào cũng đánh số phiếu.
  if (moi === "") return null;
  const trung = phieuCuaPO.find(
    (p) => p.id !== boQuaPhieuId && (p.soPhieuGiaoNCC ?? "").trim().toLowerCase() === moi,
  );
  if (!trung) return null;
  return `Số phiếu "${soPhieuMoi.trim()}" đã dùng cho lần giao ${trung.lanGiaoThu}. Mỗi lần giao phải mang một số phiếu riêng thì sau này mới đối chiếu và tổng hợp được.`;
}

/**
 * Đủ điều kiện đánh dấu hoàn thành (Phần 4.3) — nay là BỐN, không còn ba:
 * giao đủ · **có phiếu giao nhận cho mọi lần giao** · thủ kho xác nhận · trưởng bộ phận xác nhận.
 *
 * 🔴 `phieuCuaPO` KHÔNG ĐƯỢC CÓ GIÁ TRỊ MẶC ĐỊNH.
 *
 * Trước 14/08/2026 tham số này mặc định là mảng rỗng, mà mảng rỗng thì `vuongMacXacNhanKho`
 * trả `null` — tức "không vướng gì". Gọi thiếu tham số là điều kiện phiếu giao nhận bị bỏ
 * qua hoàn toàn, âm thầm, không một cảnh báo biên dịch nào: đúng lỗ hổng mà chỉ đạo
 * 11/08/2026 sinh ra để vá. Bỏ mặc định đi thì gọi thiếu thành lỗi biên dịch ngay.
 */
export function poDuDieuKienHoanThanh(
  po: DonDatHang,
  tienDo: TienDoDongPO[],
  phieuCuaPO: PhieuNhanHang[],
): boolean {
  return (
    poDaGiaoDu(tienDo) &&
    vuongMacXacNhanKho(phieuCuaPO) === null &&
    Boolean(po.xacNhanKho) &&
    Boolean(po.xacNhanTruongBP)
  );
}

// ------------------------------------------------------------
// TIẾN ĐỘ THEO ĐỀ NGHỊ — gộp từ nhiều PO
// ------------------------------------------------------------

export function tinhTienDoDeNghi(
  deNghi: DeNghiMuaHang,
  tatCaPO: DonDatHang[],
  tatCaPhieu: PhieuNhanHang[],
): TienDoDongDeNghi[] {
  const poCuaDeNghi = tatCaPO.filter((po) => po.prId === deNghi.id && po.trangThai !== "huy");

  return deNghi.items.map((dong) => {
    let khoiLuongDaLenPO = 0;
    let khoiLuongDaNhan = 0;
    const maPOLienQuan: string[] = [];
    const ngayGiao: string[] = [];

    for (const po of poCuaDeNghi) {
      // Lọc dòng ghi chú cho chắc: nó mang `sttDongDeNghi = 0` nên không khớp stt nào (stt
      // của đề nghị bắt đầu từ 1), nhưng lọc tường minh thì quy ước kia có đổi cũng không vỡ.
      const dongPOLienQuan = dongHangCuaPO(po).filter((d) => d.sttDongDeNghi === dong.stt);
      if (dongPOLienQuan.length === 0) continue;

      maPOLienQuan.push(po.code);
      ngayGiao.push(po.ngayGiaoDuKien);
      khoiLuongDaLenPO += dongPOLienQuan.reduce((s, d) => s + d.khoiLuongDat, 0);

      const phieuCuaPO = tatCaPhieu.filter((p) => p.poId === po.id).filter(phieuDuocTinh);
      for (const p of phieuCuaPO) {
        for (const d of dongPOLienQuan) {
          const line = (p.lines ?? []).find((l) => l.sttDongPO === d.sttDong);
          /**
           * 🔴 `|| 0` LÀ CHỐT CHỐNG `NaN`, KHÔNG PHẢI VIẾT THÊM (23/08/2026).
           *
           * `khoiLuongThucNhan` là trường bắt buộc theo kiểu dữ liệu, nhưng dữ liệu thật thì không
           * đảm bảo: kho chung là một document nhiều máy cùng ghi, và phiếu của bản chạy thử cũ có
           * thể thiếu khóa này. Thiếu một lần là `khoiLuongDaNhan` thành `NaN`, rồi:
           *   · `khoiLuongConLai = Math.max(0, NaN)` → `NaN`
           *   · `NaN > 0` là **false**, nên app IM LẶNG coi như **đã nhận đủ**
           * Tức tiến độ báo xong trong khi hàng chưa về — thứ nguy hiểm nhất trong cả file này, vì
           * nó không sập, không báo lỗi, chỉ nói sai.
           *
           * 📌 Bắt được lúc chạy thử luật "chưa nhận đủ hàng" ngày 23/08/2026: một phiếu thử thiếu
           * trường này làm cả hai phép thử (chưa đủ / đã đủ) đều trả về "không thiếu gì".
           */
          if (line) khoiLuongDaNhan += line.khoiLuongThucNhan || 0;
        }
      }
    }

    const khoiLuongChuaLenPO = Math.max(0, dong.khoiLuongDeNghi - khoiLuongDaLenPO);
    const khoiLuongConLai = Math.max(0, dong.khoiLuongDeNghi - khoiLuongDaNhan);
    const phanTram = dong.khoiLuongDeNghi > 0 ? (khoiLuongDaNhan / dong.khoiLuongDeNghi) * 100 : 0;

    let trangThaiDong: TrangThaiDongDeNghi;
    if (khoiLuongConLai === 0 && dong.khoiLuongDeNghi > 0) trangThaiDong = "da_nhan_du";
    else if (khoiLuongDaNhan > 0) trangThaiDong = "dang_giao";
    else if (maPOLienQuan.length > 0) trangThaiDong = "da_len_po";
    else if (dong.nguoiPhuTrachUid) trangThaiDong = "da_phan_bo";
    else trangThaiDong = "chua_phan_bo";

    return {
      ...dong,
      khoiLuongDaLenPO,
      khoiLuongChuaLenPO,
      khoiLuongDaNhan,
      khoiLuongConLai,
      phanTram,
      trangThaiDong,
      maPOLienQuan,
      ngayGiaoDuKien: ngayGiao.sort()[0],
    };
  });
}

/** "6/10 mặt hàng đã nhận đủ" — quy tắc dùng chung cho MỌI nhóm người xem. */
export function tomTatTienDoDeNghi(tienDo: TienDoDongDeNghi[]): {
  soDongDaNhanDu: number;
  tongSoDong: number;
  phanTram: number;
} {
  const tongSoDong = tienDo.length;
  const soDongDaNhanDu = tienDo.filter((d) => d.trangThaiDong === "da_nhan_du").length;
  return {
    soDongDaNhanDu,
    tongSoDong,
    phanTram: tongSoDong > 0 ? (soDongDaNhanDu / tongSoDong) * 100 : 0,
  };
}

// ------------------------------------------------------------
// TIỀN — chỉ dùng khi quyen.xemGia === true
// ------------------------------------------------------------

/**
 * ★ QUY ƯỚC LÀM TRÒN TIỀN CỦA TOÀN APP — làm tròn về ĐỒNG, nửa lên (`Math.round`).
 *
 * 🔴 VÌ SAO PHẢI CÓ MỘT QUY ƯỚC DUY NHẤT: hóa đơn và đơn hàng gửi nhà cung cấp in số nguyên
 * đồng. Nếu màn hình giữ số lẻ còn bản in tự làm tròn, hai tờ giấy cùng một đơn ra hai con số
 * khác nhau — mất uy tín với nhà cung cấp, và kế toán không đối chiếu được.
 *
 * ⚠️ Đồng Việt Nam không có đơn vị nhỏ hơn đồng nên KHÔNG giữ số lẻ. Khối lượng thì có
 * (12,5 m³), nên `soLuong × donGia` ra số lẻ là chuyện thường — chỗ làm tròn là đây.
 *
 * 📌 Chọn `Math.round` (nửa lên) chứ không phải làm tròn chẵn kiểu ngân hàng: đây là cách
 * Excel và MISA làm tròn, mà kế toán đối chiếu bằng chính hai công cụ đó.
 */
export function lamTronDong(soTien: number): number {
  return Math.round(soTien);
}

/** Thành tiền một dòng = số lượng × đơn giá, làm tròn về đồng. */
export function thanhTienDong(soLuong: number, donGia: number): number {
  return lamTronDong(soLuong * donGia);
}

/**
 * ★ CHIA MỘT SỐ TIỀN CHO CÁC DÒNG THEO TỶ LỆ, KHÔNG ĐỂ RƠI MẤT ĐỒNG NÀO.
 *
 * 🔴 VÌ SAO KHÔNG CHỈ `Math.round` TỪNG PHẦN: chia 100 ₫ cho 3 dòng bằng nhau thì mỗi dòng
 * 33 ₫, cộng lại 99 ₫ — thiếu 1 ₫ so với dòng tổng ngay bên dưới. Bảng nào cũng có dòng TỔNG
 * CỘNG (màn MISA có, biểu mẫu công ty có), nên cột cộng lại KHÔNG khớp dòng tổng là lỗi người
 * dùng nhìn thấy ngay và không có cách giải thích.
 *
 * Cách chữa: làm tròn các phần, rồi dồn phần dư vào DÒNG CUỐI CÙNG CÓ TRỌNG SỐ. Nhờ vậy
 * `Σ kết quả === tongCanChia` luôn đúng tuyệt đối.
 *
 * ⚠️ Dồn dư vào dòng cuối **có trọng số > 0**, không phải dòng cuối của mảng: dòng đơn giá 0 ₫
 * mà hiện 3 ₫ tiền thuế thì người dùng tưởng app tính sai.
 */
export function chiaTheoTyLe(trongSo: number[], tongCanChia: number): number[] {
  const ketQua = trongSo.map(() => 0);
  if (tongCanChia === 0) return ketQua;

  const tongTrongSo = trongSo.reduce((s, x) => s + x, 0);
  // Không có gì để chia theo (mọi dòng đều 0) — trả về toàn 0 thay vì chia đều, vì chia đều
  // sẽ gán tiền cho những dòng đáng lẽ không có đồng nào.
  if (tongTrongSo <= 0) return ketQua;

  let cuoiCungCoTrongSo = -1;
  for (let i = 0; i < trongSo.length; i++) if (trongSo[i] > 0) cuoiCungCoTrongSo = i;
  if (cuoiCungCoTrongSo < 0) return ketQua;

  let daChia = 0;
  for (let i = 0; i < trongSo.length; i++) {
    if (i === cuoiCungCoTrongSo || trongSo[i] <= 0) continue;
    ketQua[i] = lamTronDong((tongCanChia * trongSo[i]) / tongTrongSo);
    daChia += ketQua[i];
  }
  ketQua[cuoiCungCoTrongSo] = tongCanChia - daChia;
  return ketQua;
}

/** Phần thương lượng về tiền cần để tính chiết khấu — nhận cả `GiaDonDatHang` lẫn bản nháp. */
export interface PhanTienDeTinh {
  kieuChietKhau?: KieuChietKhau;
  tyLeChietKhau?: number;
  chietKhau?: number;
  /** Thuế suất chung của cả đơn, dùng cho dòng không ghi thuế suất riêng. */
  thueSuatGTGT?: number;
}

/**
 * ★ SỐ TIỀN CHIẾT KHẤU THỰC SỰ ĐEM ĐI TÍNH — một con số duy nhất, dù người dùng nhập kiểu nào.
 *
 * ⚠️ ĐỌC ĐƯỢC CẢ DỮ LIỆU LẬP TRƯỚC 17/08/2026 (chưa có `kieuChietKhau`): có `chietKhau > 0`
 * thì hiểu là nhập bằng số tiền, không có thì hiểu là không chiết khấu. Nhờ vậy không phải
 * chuyển đổi dữ liệu cũ — mà chuyển đổi dữ liệu tiền là việc không ai muốn làm lại lần hai.
 *
 * 🔴 Chiết khấu KHÔNG được vượt tiền hàng. Mẫu giấy không chặn được, app phải chặn — chiết
 * khấu vượt tiền hàng cho ra tiền thuế âm và tổng thanh toán âm.
 */
export function tienChietKhau(congTienHang: number, phan: PhanTienDeTinh | undefined): number {
  const kieu: KieuChietKhau =
    phan?.kieuChietKhau ?? ((phan?.chietKhau ?? 0) > 0 ? "so_tien" : "khong");

  let tho = 0;
  if (kieu === "ty_le") tho = lamTronDong((congTienHang * Math.max(phan?.tyLeChietKhau ?? 0, 0)) / 100);
  else if (kieu === "so_tien") tho = phan?.chietKhau ?? 0;

  return Math.min(Math.max(tho, 0), Math.max(congTienHang, 0));
}

/** Tiền thuế của một cơ sở tính thuế đã trừ chiết khấu. */
export function tienThueDong(coSoTinhThue: number, thueSuatPhanTram: number): number {
  return lamTronDong((coSoTinhThue * Math.max(thueSuatPhanTram, 0)) / 100);
}

/** Một dòng đã tính đủ tiền — khớp các cột của bảng "Hàng tiền" trên màn MISA. */
export interface DongTienDonHang {
  sttDong: number;
  soLuong: number;
  donGia: number;
  /** Cột "Thành tiền". */
  thanhTien: number;
  /** Phần chiết khấu của cả đơn được phân bổ về dòng này. */
  chietKhauDong: number;
  thanhTienSauCK: number;
  /** Cột "% Thuế GTGT" thực sự áp cho dòng này (đã suy ra từ thuế suất chung nếu dòng bỏ trống). */
  thueSuatGTGT: number;
  /** Cột "Tiền thuế GTGT". */
  tienThueGTGT: number;
}

/** Dòng thô đưa vào máy tính tiền. */
export interface DongDeTinhTien {
  sttDong: number;
  soLuong: number;
  donGia: number;
  /** Thuế suất riêng của dòng, % — bỏ trống thì lấy thuế suất chung của đơn. */
  thueSuatGTGT?: number;
}

/**
 * Kết quả đầy đủ: từng dòng + khối tổng. `TienDonHang` là phần khối tổng, giữ nguyên hình
 * dạng cũ để màn xem và trang in không phải sửa.
 */
export interface KetQuaTienDonHang extends TienDonHang {
  dong: DongTienDonHang[];
  /**
   * Đơn có TRỘN NHIỀU MỨC THUẾ SUẤT.
   *
   * 🔴 KHI CỜ NÀY BẬT, TUYỆT ĐỐI KHÔNG ĐƯỢC IN `thueSuatGTGT` NHƯ THUẾ SUẤT CỦA CẢ ĐƠN.
   * Trường đó lúc ấy chỉ là mức của nhóm có giá trị lớn nhất — in ra thành "Tiền thuế GTGT
   * (thuế suất 8%)" trong khi đơn có cả 10% là ghi sai chứng từ thuế. Dùng `moTaThueSuat`.
   */
  nhieuMucThue: boolean;
}

/**
 * ★ MÁY TÍNH TIỀN CỦA ĐƠN MUA HÀNG — NƠI DUY NHẤT tính mọi con số tiền.
 *
 * Chỉ đạo Ban lãnh đạo 17/08/2026: màn lập đơn phải giống màn Đơn mua hàng của MISA, trong đó
 * bảng "Hàng tiền" có cột **% Thuế GTGT** và **Tiền thuế GTGT** cho TỪNG DÒNG, cộng một dòng
 * TỔNG CỘNG ở cuối bảng.
 *
 * Trình tự tính bám đúng biểu mẫu công ty `1. INPUT/Bieu mau/1. DON HANG HPCONS.xlsx`:
 *
 *   Cộng tiền hàng (chưa trừ CK) = Σ (số lượng × đơn giá)
 *   Số tiền CK                   (không chiết khấu / theo tỷ lệ / theo số tiền)
 *   Cộng tiền hàng (đã trừ CK)   = trên − CK
 *   Tiền thuế GTGT               = (đã trừ CK) × thuế suất %
 *   Tổng tiền thanh toán         = (đã trừ CK) + tiền thuế
 *
 * 🔴 THUẾ TÍNH TRÊN GIÁ ĐÃ TRỪ CHIẾT KHẤU. Đảo thứ tự là ra số thuế khác.
 *
 * 🔴 BA QUYẾT ĐỊNH VỀ LÀM TRÒN — ghi ra đây vì lệch một đồng giữa màn hình và bản in là mất
 * uy tín với nhà cung cấp:
 *
 *  1. **Chiết khấu phân bổ về từng dòng theo tỷ lệ thành tiền.** Bắt buộc phải phân bổ, không
 *     phải để cho đẹp: khi đơn trộn nhiều mức thuế, chiết khấu để nguyên ở mức tổng thì không
 *     biết phần nào thuộc hàng 8%, phần nào thuộc hàng 10% — không tính nổi tiền thuế.
 *
 *  2. **Thuế làm tròn MỘT LẦN cho mỗi MỨC THUẾ SUẤT**, không phải làm tròn từng dòng rồi cộng.
 *     Đây là cách tờ khai thuế GTGT gộp số liệu (theo từng thuế suất), và nó giữ cho kết quả
 *     TRÙNG KHÍT với `tinhKhoiTongTien` trong trường hợp đơn chỉ có một mức thuế — tức phần
 *     xem trước ở màn lập đơn và số đã lưu của đơn không bao giờ lệch nhau.
 *
 *  3. **Cột "Tiền thuế GTGT" của từng dòng là phần chia lại từ số đã làm tròn của nhóm**
 *     (qua `chiaTheoTyLe`), nên cộng cột luôn đúng bằng dòng TỔNG CỘNG. Làm tròn độc lập từng
 *     dòng thì cột cộng lại lệch dòng tổng vài đồng — người dùng nhìn thấy ngay.
 */
export function tinhTienChiTiet(
  dongVao: DongDeTinhTien[],
  phan: PhanTienDeTinh | undefined,
): KetQuaTienDonHang {
  const thanhTien = dongVao.map((d) => thanhTienDong(d.soLuong, d.donGia));
  const congTienHang = thanhTien.reduce((s, x) => s + x, 0);

  const chietKhau = tienChietKhau(congTienHang, phan);
  const chietKhauDong = chiaTheoTyLe(thanhTien, chietKhau);
  const thanhTienSauCK = thanhTien.map((x, i) => x - chietKhauDong[i]);
  const congTienHangSauCK = congTienHang - chietKhau;

  // Thuế suất áp cho từng dòng: dòng ghi riêng thì theo dòng, không thì theo thuế suất chung.
  const thueSuatTheoDong = dongVao.map((d) =>
    Math.max(d.thueSuatGTGT ?? phan?.thueSuatGTGT ?? 0, 0),
  );

  // Gom theo MỨC thuế suất — mỗi mức làm tròn đúng một lần (quyết định số 2 ở trên).
  const nhom = new Map<number, number[]>();
  thueSuatTheoDong.forEach((r, i) => {
    const ds = nhom.get(r);
    if (ds) ds.push(i);
    else nhom.set(r, [i]);
  });

  const tienThueTheoDong = dongVao.map(() => 0);
  let tienThueGTGT = 0;
  /** Mức thuế của nhóm có cơ sở tính thuế lớn nhất — chỉ dùng khi cả đơn một mức. */
  let mucLonNhat = 0;
  let coSoLonNhat = -1;

  for (const [mucThue, chiSo] of nhom) {
    const coSo = chiSo.reduce((s, i) => s + thanhTienSauCK[i], 0);
    const thueCuaNhom = tienThueDong(coSo, mucThue);
    tienThueGTGT += thueCuaNhom;

    const phanBo = chiaTheoTyLe(
      chiSo.map((i) => thanhTienSauCK[i]),
      thueCuaNhom,
    );
    chiSo.forEach((i, viTri) => {
      tienThueTheoDong[i] = phanBo[viTri];
    });

    if (coSo > coSoLonNhat) {
      coSoLonNhat = coSo;
      mucLonNhat = mucThue;
    }
  }

  return {
    dong: dongVao.map((d, i) => ({
      sttDong: d.sttDong,
      soLuong: d.soLuong,
      donGia: d.donGia,
      thanhTien: thanhTien[i],
      chietKhauDong: chietKhauDong[i],
      thanhTienSauCK: thanhTienSauCK[i],
      thueSuatGTGT: thueSuatTheoDong[i],
      tienThueGTGT: tienThueTheoDong[i],
    })),
    congTienHang,
    chietKhau,
    congTienHangSauCK,
    thueSuatGTGT: mucLonNhat,
    tienThueGTGT,
    tongThanhToan: congTienHangSauCK + tienThueGTGT,
    nhieuMucThue: nhom.size > 1,
  };
}

/**
 * Chữ mô tả thuế suất để in ra chứng từ — "8%" hoặc "nhiều mức".
 *
 * 🔴 Có sẵn hàm này để không màn hình nào tự nghĩ cách hiển thị riêng. Đơn trộn 8% và 10% mà
 * in "thuế suất 8%" là ghi sai chứng từ thuế, không phải lỗi trình bày.
 */
export function moTaThueSuat(kq: Pick<KetQuaTienDonHang, "thueSuatGTGT" | "nhieuMucThue">): string {
  return kq.nhieuMucThue ? "nhiều mức" : `${kq.thueSuatGTGT}%`;
}

export function tongGiaTriPO(
  po: DonDatHang,
  gia: { lines: { sttDong: number; donGia: number }[] } | undefined,
): number {
  if (!gia) return 0;
  // Làm tròn TỪNG DÒNG rồi mới cộng — đúng con số cột "Thành tiền" hiện trên bảng, để cộng
  // cột bằng tay ra đúng dòng tổng. Bỏ dòng ghi chú vì nó không phải hàng hóa.
  return dongHangCuaPO(po).reduce((tong, dong) => {
    const g = gia.lines.find((l) => l.sttDong === dong.sttDong);
    return tong + (g ? thanhTienDong(dong.khoiLuongDat, g.donGia) : 0);
  }, 0);
}

/**
 * Khối tổng tiền của đơn mua hàng — TÍNH ĐÚNG TRÌNH TỰ của biểu mẫu công ty
 * `1. INPUT/Bieu mau/1. DON HANG HPCONS.xlsx`:
 *
 *   Cộng tiền hàng (chưa trừ CK)          = Σ (đơn giá × khối lượng đặt)
 *   Số tiền CK                            (nhập bằng số tiền, không phải %)
 *   Cộng tiền hàng (đã trừ CK)            = trên − CK
 *   Tiền thuế GTGT                        = (đã trừ CK) × thuế suất %
 *   Tổng tiền thanh toán                  = (đã trừ CK) + tiền thuế
 *
 * 🔴 Thuế tính TRÊN GIÁ ĐÃ TRỪ CHIẾT KHẤU — đúng thứ tự các dòng trên mẫu.
 * Tiền thuế làm tròn về đồng (Math.round) như cách kế toán vẫn ghi hóa đơn.
 * Đây là NƠI DUY NHẤT tính các con số này — trang xem, trang in đều gọi về đây.
 */
export interface TienDonHang {
  congTienHang: number;
  chietKhau: number;
  congTienHangSauCK: number;
  thueSuatGTGT: number;
  tienThueGTGT: number;
  tongThanhToan: number;
}

/**
 * Dựng khối tổng từ ba con số thô. Tách riêng để **màn LẬP đơn xem trước được tổng tiền
 * trước khi PO tồn tại**, mà vẫn dùng chung đúng một công thức với màn xem và trang in.
 */
export function tinhKhoiTongTien(
  congTienHang: number,
  chietKhauNhap: number,
  thueSuatNhap: number,
): TienDonHang {
  /**
   * 🔴 GỌI THẲNG VÀO `tinhTienChiTiet` — KHÔNG tự tính lại ở đây.
   *
   * Hàm này chỉ có ba con số gộp (màn LẬP đơn cần xem trước tổng tiền khi PO chưa tồn tại),
   * nên gói cả tiền hàng thành MỘT dòng rồi đưa qua đúng bộ máy kia. Viết lại công thức ở đây
   * là tạo nguồn sự thật thứ hai: hai chỗ cùng tính một con số thì sớm muộn lệch nhau, mà lệch
   * ở đây nghĩa là phần xem trước lúc lập đơn khác hẳn số đã lưu của đơn.
   *
   * 📌 Một dòng nên chỉ có một mức thuế và làm tròn đúng một lần — kết quả TRÙNG KHÍT với
   * cách tính cũ, không có bước nhảy số nào cho đơn đang chạy.
   */
  return tinhTienChiTiet([{ sttDong: 1, soLuong: 1, donGia: congTienHang, thueSuatGTGT: thueSuatNhap }], {
    kieuChietKhau: "so_tien",
    chietKhau: chietKhauNhap,
  });
}

/**
 * Khối tổng của một đơn đã lập — dùng ở màn xem đơn và trang in A4.
 * Là bản rút gọn của `tinhTienChiTietPO`, giữ nguyên kiểu trả về cũ.
 */
export function tinhTienDonHang(po: DonDatHang, gia: GiaDonDatHang | undefined): TienDonHang {
  return tinhTienChiTietPO(po, gia);
}

/**
 * ★ Tiền của đơn đã lập, CÓ CHI TIẾT TỪNG DÒNG — cho bảng "Hàng tiền" kiểu MISA
 * (cột Thành tiền · % Thuế GTGT · Tiền thuế GTGT và dòng TỔNG CỘNG).
 *
 * ⚠️ Dòng không tra được đơn giá coi như 0 ₫, KHÔNG bỏ dòng đi: bỏ dòng thì bảng trên màn hình
 * thiếu mặt hàng so với đơn thật, người dùng không nhìn ra là đang thiếu giá.
 */
export function tinhTienChiTietPO(
  po: DonDatHang,
  gia: GiaDonDatHang | undefined,
): KetQuaTienDonHang {
  const dong: DongDeTinhTien[] = dongHangCuaPO(po).map((d) => {
    const g = gia?.lines.find((l) => l.sttDong === d.sttDong);
    return {
      sttDong: d.sttDong,
      soLuong: d.khoiLuongDat,
      donGia: g?.donGia ?? 0,
      thueSuatGTGT: g?.thueSuatGTGT,
    };
  });
  return tinhTienChiTiet(dong, gia);
}

// ------------------------------------------------------------
// THỜI GIAN
// ------------------------------------------------------------

export function soNgayConLai(denNgay: string, tuNgay: Date = new Date()): number {
  const den = new Date(denNgay);
  const moc = new Date(tuNgay.getFullYear(), tuNgay.getMonth(), tuNgay.getDate());
  return Math.round((den.getTime() - moc.getTime()) / 86_400_000);
}

/** Màu thanh tiến độ theo Design System V1.1 Phần E2. */
export type TongMau = "primary" | "warning" | "danger" | "success";

export function tongMauTheoThoiGian(
  ngayBatDau: string,
  ngayKetThuc: string,
  daHoanThanh: boolean,
): TongMau {
  if (daHoanThanh) return "success";
  const batDau = new Date(ngayBatDau).getTime();
  const ketThuc = new Date(ngayKetThuc).getTime();
  const tong = Math.max(1, ketThuc - batDau);
  const daDung = ((Date.now() - batDau) / tong) * 100;
  if (daDung >= 100) return "danger";
  if (daDung >= 90) return "danger";
  if (daDung >= 70) return "warning";
  return "primary";
}
