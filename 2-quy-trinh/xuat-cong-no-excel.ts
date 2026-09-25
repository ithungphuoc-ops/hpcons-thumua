// ============================================================
// XUẤT DANH SÁCH CÔNG NỢ RA EXCEL, CHỌN KHUNG THỜI GIAN.
//
// ★ Sếp 25/09/2026: ***"Thêm chức năng tải xuống danh sách công nợ (định dạng excel) có thể chọn
// theo khung thời gian"***.
//
// 🔴 KHÔNG TÍNH LẠI CON SỐ NÀO. Mọi cột (đã trả, còn phải trả, tới hạn, cảnh báo) lấy nguyên từ
// `congNoTheoDonHang` — đúng các dòng bảng Công nợ đang hiện. Tính lại ở đây là hai chỗ cùng tính
// một con số, sớm muộn tệp Excel nói khác màn hình (CLAUDE.md §3.4b).
//
// 📌 LỌC THEO NGÀY NÀO: theo NGÀY HOÁ ĐƠN của từng tờ — ngày kế toán dùng để đối chiếu với nhà
// cung cấp. Đơn CHƯA có tờ hoá đơn nào thì lọc theo NGÀY LẬP PO, để đơn chưa xuất hoá đơn không
// lặng lẽ biến mất khỏi tệp.
//
// Hai trang tính:
//   · "Theo đơn hàng" — mỗi PO một dòng, giống bảng tổng.
//   · "Theo tờ hoá đơn" — mỗi tờ một dòng, để đối chiếu công nợ từng tờ.
// ============================================================

import type { CongNoTheoDon, CongNoTheoHoaDon } from "@/2-quy-trinh/tuoi-no";
import type { NgayISO } from "@/3-du-lieu/kieu-du-lieu";

export interface KhungThoiGian {
  /** `yyyy-mm-dd`, tính CẢ ngày đầu. Trống = không chặn đầu. */
  tuNgay?: NgayISO | "";
  /** `yyyy-mm-dd`, tính CẢ ngày cuối. Trống = không chặn cuối. */
  denNgay?: NgayISO | "";
}

const trongKhung = (ngay: string | undefined, k: KhungThoiGian): boolean => {
  if (!ngay) return !k.tuNgay && !k.denNgay;
  if (k.tuNgay && ngay < k.tuNgay) return false;
  if (k.denNgay && ngay > k.denNgay) return false;
  return true;
};

/**
 * ★ Lọc các dòng công nợ theo khung thời gian — hàm thuần, kiểm được ở Node.
 *
 * Đơn có tờ hoá đơn: giữ đơn nếu CÓ ÍT NHẤT một tờ trong khung, và chỉ giữ các tờ trong khung.
 * Đơn chưa có tờ nào: xét theo ngày lập PO (`ngayLapPO` truyền vào qua `ngayPOTheoId`).
 */
export function locCongNoTheoKhung<
  T extends Pick<CongNoTheoDon, "poId"> & { hoaDon: readonly Pick<CongNoTheoHoaDon, "ngayHoaDon">[] },
>(ds: readonly T[], k: KhungThoiGian, ngayPOTheoId: ReadonlyMap<string, string | undefined>): {
  dong: T;
  cacTo: T["hoaDon"][number][];
}[] {
  const ra: { dong: T; cacTo: T["hoaDon"][number][] }[] = [];
  for (const r of ds) {
    if (r.hoaDon.length > 0) {
      const cacTo = r.hoaDon.filter((h) => trongKhung(h.ngayHoaDon, k));
      if (cacTo.length > 0) ra.push({ dong: r, cacTo });
    } else if (trongKhung(ngayPOTheoId.get(r.poId), k)) {
      ra.push({ dong: r, cacTo: [] });
    }
  }
  return ra;
}

const ngayVN = (s?: string) => {
  if (!s) return "";
  const [y, m, d] = s.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : s;
};

/**
 * Dựng tệp .xlsx. `exceljs` nạp động — không cộng ~1MB vào gói tải lần đầu (cùng cách
 * `xuat-don-hang-excel.ts`).
 */
export async function xuatCongNoExcel(dv: {
  cacDong: ReturnType<typeof locCongNoTheoKhung<CongNoTheoDon>>;
  khung: KhungThoiGian;
  nguoiXuat: string;
}): Promise<Blob> {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "App Thu mua HP Cons";
  const DINH_DANG_TIEN = "#,##0";
  const tieuDeKhung = `Khung thời gian (theo ngày hoá đơn): ${
    dv.khung.tuNgay ? ngayVN(dv.khung.tuNgay) : "…"
  } – ${dv.khung.denNgay ? ngayVN(dv.khung.denNgay) : "…"} · Xuất bởi ${dv.nguoiXuat} lúc ${new Date().toLocaleString("vi-VN")}`;

  const dungTrang = (
    ten: string,
    cot: { header: string; key: string; width: number; tien?: boolean }[],
    dong: Record<string, string | number>[],
  ) => {
    const ws = wb.addWorksheet(ten, { views: [{ state: "frozen", ySplit: 3 }] });
    ws.mergeCells(1, 1, 1, cot.length);
    ws.getCell(1, 1).value = `CÔNG NỢ NHÀ CUNG CẤP — ${ten.toUpperCase()}`;
    ws.getCell(1, 1).font = { bold: true, size: 14 };
    ws.mergeCells(2, 1, 2, cot.length);
    ws.getCell(2, 1).value = tieuDeKhung;
    ws.getCell(2, 1).font = { italic: true, size: 10 };
    ws.getRow(3).values = cot.map((c) => c.header);
    ws.getRow(3).font = { bold: true };
    ws.getRow(3).alignment = { vertical: "middle", wrapText: true };
    cot.forEach((c, i) => {
      ws.getColumn(i + 1).width = c.width;
      if (c.tien) ws.getColumn(i + 1).numFmt = DINH_DANG_TIEN;
    });
    dong.forEach((d) => ws.addRow(cot.map((c) => d[c.key] ?? "")));
    ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: cot.length } };
  };

  dungTrang(
    "Theo đơn hàng",
    [
      { header: "STT", key: "stt", width: 6 },
      { header: "Mã đơn hàng (PO)", key: "ma", width: 16 },
      { header: "Mã số đề nghị", key: "maDeNghi", width: 14 },
      { header: "Tên công trình", key: "congTrinh", width: 28 },
      { header: "Tên NCC", key: "ncc", width: 30 },
      { header: "Số hoá đơn", key: "soHD", width: 18 },
      { header: "Tổng tiền theo PO", key: "tongPO", width: 16, tien: true },
      { header: "Tổng tiền theo hoá đơn", key: "tongHD", width: 16, tien: true },
      { header: "Đã trả", key: "daTra", width: 14, tien: true },
      { header: "Còn phải trả", key: "conLai", width: 16, tien: true },
      { header: "Thời gian C.Nợ (ngày)", key: "soNgay", width: 12 },
      { header: "Ngày bắt đầu tính", key: "batDau", width: 14 },
      { header: "Ngày tới hạn", key: "toiHan", width: 14 },
      { header: "Cảnh báo tới hạn", key: "canhBao", width: 20 },
    ],
    dv.cacDong.map(({ dong: r, cacTo }, i) => ({
      stt: i + 1,
      ma: r.maDonHang,
      maDeNghi: r.maDeNghi ?? "",
      congTrinh: r.tenCongTrinh ?? "",
      ncc: r.tenNCC,
      soHD: cacTo.map((h) => h.soHoaDon).join(", ") || (r.soHoaDon ?? ""),
      tongPO: r.tongCongNo,
      tongHD: r.tongTienHoaDon ?? "",
      daTra: r.daTra,
      conLai: r.conLai,
      soNgay: r.soNgayDuocNo ?? "",
      batDau: ngayVN(r.ngayBatDau),
      toiHan: ngayVN(r.ngayToiHan),
      canhBao: r.daTatToan ? "Đã trả đủ" : r.canhBao.nhan,
    })),
  );

  dungTrang(
    "Theo tờ hoá đơn",
    [
      { header: "STT", key: "stt", width: 6 },
      { header: "Mã đơn hàng (PO)", key: "ma", width: 16 },
      { header: "Tên công trình", key: "congTrinh", width: 28 },
      { header: "Tên NCC", key: "ncc", width: 30 },
      { header: "Số hoá đơn", key: "soHD", width: 16 },
      { header: "Ngày hoá đơn", key: "ngayHD", width: 14 },
      { header: "Số tiền", key: "soTien", width: 16, tien: true },
      { header: "Đã trả", key: "daTra", width: 14, tien: true },
      { header: "Còn phải trả", key: "conLai", width: 16, tien: true },
      { header: "Số ngày nợ", key: "soNgay", width: 10 },
      { header: "Bắt đầu tính", key: "batDau", width: 14 },
      { header: "Tới hạn", key: "toiHan", width: 14 },
      { header: "Cảnh báo", key: "canhBao", width: 20 },
    ],
    dv.cacDong
      .flatMap(({ dong: r, cacTo }) => cacTo.map((h) => ({ r, h })))
      .map(({ r, h }, i) => ({
        stt: i + 1,
        ma: r.maDonHang,
        congTrinh: r.tenCongTrinh ?? "",
        ncc: r.tenNCC,
        soHD: h.soHoaDon,
        ngayHD: ngayVN(h.ngayHoaDon),
        soTien: h.soTien,
        daTra: h.daTra,
        conLai: h.conLai,
        soNgay: h.soNgayDuocNo ?? "",
        batDau: ngayVN(h.ngayBatDau),
        toiHan: ngayVN(h.ngayToiHan),
        canhBao: h.daTatToan ? "Đã trả đủ" : h.canhBao.nhan,
      })),
  );

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
