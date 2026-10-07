// ============================================================
// DANH MỤC NHÀ CUNG CẤP ↔ FILE EXCEL — xuất ra và nhập vào
//
// ★ Sếp 02/10/2026: *"Thêm tab danh sách nhà cung cấp có chức năng xuất file excel và import
// file"*. Nhập file mà NCC đã có trong danh mục → **BỎ QUA dòng trùng** (Sếp chốt cùng ngày), không
// ghi đè thông tin đang có.
//
// 📌 Hai chiều dùng CHUNG một bộ tiêu đề cột (`COT`): tệp xuất ra mở sửa rồi nhập lại được ngay.
// ★ CỘT "Mã NCC" = MÃ SỐ THUẾ, CHỈ Ở CHIỀU XUẤT — Sếp 07/10/2026: *"file excel danh sách NCC khi xuất
//    ra e thêm trường Mã NCC vào nữa"*, cùng ngày đã chốt *"mã NCC này là MST luôn, chứ ko phải định
//    dạng NC000 nữa"*. Nên cột "Mã NCC" (cột 2, ngay sau STT — khớp màn danh mục) ghi MST, KHÔNG phải
//    mã nội bộ `NC0000`. Cột này KHÔNG nằm trong `COT`: chiều nhập đọc theo tiêu đề, gặp "Mã NCC" thì
//    bỏ qua (không có trong `cachViet` nào) — MST vẫn đọc từ cột "Mã số thuế". (02/10 từng bỏ hẳn cột
//    "Mã NCC" vì nó in `NC0000` — Sếp: *"Mã này là MST, sửa lại"*.)
// 🔴 Báo lỗi theo SỐ DÒNG TRONG FILE (chỉ đạo 17/08/2026 cho việc nhập Excel), không theo STT.
// ★ Cột "Nhóm NCC" (Sếp 02/10/2026): nhiều nhóm một ô, xuất nối bằng "; ", nhập tách bằng
//   `tachNhomNCC` (`nhom-nha-cung-cap.ts`). 🔴 Dòng TRÙNG vẫn BỎ QUA NGUYÊN DÒNG, kể cả cột nhóm
//   (Sếp chốt) — gán nhóm cho NCC đã có làm trên màn danh mục, không qua file.
// ============================================================

import type { NhaCungCap } from "@/3-du-lieu/kieu-du-lieu";
import { boDau } from "@/6-tien-ich/bo-dau";
import { lyDoTenNhomKhongHop, noiNhomNCC, tachNhomNCC } from "@/2-quy-trinh/nhom-nha-cung-cap";

/** Thông tin một NCC đọc từ file — đúng các trường `themNhaCungCap` nhận. */
export interface NCCTuFile {
  ten: string;
  maSoThue?: string;
  diaChi?: string;
  dienThoai?: string;
  nguoiLienHe?: string;
  ghiChu?: string;
  /**
   * ★ Nhóm NCC (Sếp 02/10/2026) — đã tách sẵn thành mảng bằng `tachNhomNCC`.
   * 🔴 Dòng TRÙNG thì nhóm ở đây KHÔNG được áp (Sếp chốt: bỏ qua nguyên dòng) — gán nhóm cho NCC
   * đã có làm trên màn danh mục.
   */
  nhomNCC?: string[];
}

export interface DongNhapNCC extends NCCTuFile {
  /** Số dòng thật trong file (1-based, như lề trái của Excel). */
  dongTrongFile: number;
}

export type KetQuaDongNhap =
  | { loai: "moi"; dong: DongNhapNCC }
  | { loai: "trung"; dong: DongNhapNCC; lyDo: string }
  | { loai: "loi"; dong: DongNhapNCC; lyDo: string };

/** Bộ cột dùng cho CẢ xuất lẫn nhập. `cachViet` = các tiêu đề chấp nhận khi đọc (đã bỏ dấu). */
const COT = [
  {
    khoa: "ten",
    tieuDe: "Tên nhà cung cấp",
    rong: 44,
    cachViet: ["ten nha cung cap", "ten ncc", "nha cung cap", "ten", "ten cong ty", "ten don vi", "don vi", "cong ty"],
  },
  { khoa: "maSoThue", tieuDe: "Mã số thuế", rong: 16, cachViet: ["ma so thue", "mst", "ma thue", "ma so dn", "ma so doanh nghiep"] },
  { khoa: "diaChi", tieuDe: "Địa chỉ", rong: 50, cachViet: ["dia chi", "dia chi tru so", "dia chi cong ty", "tru so"] },
  {
    khoa: "dienThoai",
    tieuDe: "Điện thoại",
    rong: 16,
    cachViet: ["dien thoai", "so dien thoai", "sdt", "so dt", "dt", "dien thoai lien he", "hotline"],
  },
  { khoa: "nguoiLienHe", tieuDe: "Người liên hệ", rong: 28, cachViet: ["nguoi lien he", "lien he", "nguoi lh"] },
  { khoa: "ghiChu", tieuDe: "Ghi chú", rong: 36, cachViet: ["ghi chu", "ghi chu ncc", "note"] },
  /* ★ Sếp 02/10/2026. Nhiều nhóm trong một ô, cách nhau "; " (đọc vào nhận cả ";" lẫn ","). */
  {
    khoa: "nhomNCC",
    tieuDe: "Nhóm NCC",
    rong: 30,
    cachViet: ["nhom ncc", "nhom nha cung cap", "nhom", "phan nhom"],
  },
] as const;

type KhoaCot = (typeof COT)[number]["khoa"];

const chuanHoa = (s: string) => boDau(s).replace(/\s+/g, " ").trim().toLowerCase();

/** Mã số thuế so sánh được: bỏ khoảng trắng, dấu chấm. Giữ dấu `-` của MST 13 số (chi nhánh). */
export function chuanHoaMST(mst: string | undefined): string {
  return (mst ?? "").replace(/[\s.]/g, "").trim();
}

/**
 * Phân loại từng dòng đọc được: MỚI · TRÙNG (bỏ qua) · LỖI.
 *
 * Trùng khi: cùng MÃ SỐ THUẾ với một NCC đã có; hoặc — với dòng không có MST — cùng TÊN (so không
 * phân biệt hoa thường, dấu, dấu cách thừa; cùng cách `themNhaCungCap` chặn trùng tên). Hai dòng
 * trong cùng file trùng nhau thì dòng sau là trùng.
 *
 * ⚠️ Trùng tên với NCC đã có nhưng KHÁC MST vẫn tính là trùng: `themNhaCungCap` chặn trùng tên
 * tuyệt đối (một tên hai dòng là công nợ bị chia đôi), nên cho qua ở đây thì tới lúc ghi cũng bị
 * chặn — báo ngay từ bước xem trước cho thật.
 */
export function phanLoaiNhapNCC(
  dong: readonly DongNhapNCC[],
  daCo: readonly Pick<NhaCungCap, "ten" | "maSoThue">[],
): KetQuaDongNhap[] {
  const tenDaCo = new Set(daCo.map((n) => chuanHoa(n.ten)));
  const mstDaCo = new Set(daCo.map((n) => chuanHoaMST(n.maSoThue)).filter(Boolean));
  const tenTrongFile = new Set<string>();
  const mstTrongFile = new Set<string>();

  return dong.map((d) => {
    const ten = d.ten.trim();
    if (ten === "") return { loai: "loi", dong: d, lyDo: "Thiếu tên nhà cung cấp." };
    const mst = chuanHoaMST(d.maSoThue);
    /* MST doanh nghiệp 10 số, chi nhánh 13 số (có hoặc không gạch); cá nhân dùng số định danh 12
       số. Sai dạng khác thì báo LỖI chứ không nuốt — một MST gõ thiếu số đi thẳng vào chứng từ. */
    if (mst && !/^(\d{10}(-?\d{3})?|\d{12})$/.test(mst)) {
      return {
        loai: "loi",
        dong: d,
        lyDo: `Mã số thuế “${d.maSoThue}” không đúng dạng (10 số, 13 số chi nhánh, hoặc 12 số cá nhân).`,
      };
    }
    const t = chuanHoa(ten);
    if (mst && mstDaCo.has(mst)) return { loai: "trung", dong: d, lyDo: "Trùng mã số thuế với NCC đã có." };
    if (tenDaCo.has(t)) return { loai: "trung", dong: d, lyDo: "Trùng tên với NCC đã có." };
    if (mst && mstTrongFile.has(mst)) return { loai: "trung", dong: d, lyDo: "Trùng mã số thuế với dòng trên trong file." };
    if (tenTrongFile.has(t)) return { loai: "trung", dong: d, lyDo: "Trùng tên với dòng trên trong file." };
    /* Nhóm xét SAU luật trùng: dòng trùng bị bỏ nguyên dòng, nhóm của nó không có ý nghĩa gì. */
    const nhom = tachNhomNCC(d.nhomNCC);
    const loiNhom = nhom.map(lyDoTenNhomKhongHop).find((x) => x !== null);
    if (loiNhom) return { loai: "loi", dong: d, lyDo: loiNhom };
    tenTrongFile.add(t);
    if (mst) mstTrongFile.add(mst);
    /* Nhóm đã chuẩn hoá thay cho nhóm thô; dòng không có nhóm thì KHÔNG mang khoá. */
    const sach: DongNhapNCC = { ...d, ten, ...(mst ? { maSoThue: mst } : {}) };
    if (nhom.length > 0) sach.nhomNCC = nhom;
    else delete sach.nhomNCC;
    return { loai: "moi", dong: sach };
  });
}

/**
 * Chuỗi hiển thị của một ô ExcelJS (ô công thức trả `{ result }`, ô định dạng trả `richText`, ô
 * liên kết trả `{ text, hyperlink }`, ô lỗi trả `{ error: "#N/A" }`).
 *
 * 🔴 Ô LỖI / ô công thức chưa có kết quả → CHUỖI RỖNG. Trước đây rơi xuống `String(o)` ra
 * `"[object Object]"` và dòng đó được xếp "Thêm mới" với tên rác (phản biện 02/10/2026).
 */
function chuOi(o: unknown): string {
  if (o === null || o === undefined) return "";
  if (o instanceof Date) return o.toLocaleDateString("vi-VN");
  if (typeof o === "object") {
    const v = o as { result?: unknown; richText?: { text: string }[]; text?: unknown; error?: unknown };
    if (v.error !== undefined) return "";
    if (Array.isArray(v.richText)) return v.richText.map((r) => r.text).join("");
    if (v.result !== undefined) return v.result === null || typeof v.result === "object" ? "" : String(v.result);
    if (v.text !== undefined) return typeof v.text === "string" ? v.text : chuOi(v.text);
    return "";
  }
  return String(o);
}

/** Kết quả đọc file: các dòng, và cột nào ĐÃ nhận ra / CHƯA thấy — để bản xem trước nói rõ. */
export interface KetQuaDocNCC {
  dong: DongNhapNCC[];
  /** Tên các cột đã nhận ra trong file (theo tiêu đề chuẩn của app). */
  cotDoc: string[];
  /** Các cột của app KHÔNG tìm thấy trong file — dữ liệu cột đó sẽ trống. */
  cotThieu: string[];
}

/**
 * Đọc file Excel danh mục NCC. Dò dòng tiêu đề trong 15 dòng đầu (dòng có ô "Tên nhà cung cấp"),
 * đọc tới hết trang tính đầu tiên; dòng trống hoàn toàn thì bỏ.
 *
 * ⚠️ MÃ SỐ THUẾ LƯU DẠNG SỐ thì Excel đã ăn mất số 0 đầu (`0301234567` → `301234567`). Ô kiểu số có
 * 9 chữ số thì bù lại một số 0 — MST Việt Nam luôn 10 số. Tệp do app xuất ra ghi MST dạng CHỮ nên
 * không dính chuyện này.
 */
export async function docNCCTuExcel(file: ArrayBuffer): Promise<KetQuaDocNCC> {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(file);
  } catch (loi) {
    throw new Error(
      "Không mở được file. File phải là .xlsx (Excel 2007 trở lên) và không bị hỏng. " +
        "File .xls đời cũ cần mở bằng Excel rồi “Lưu thành” định dạng .xlsx.",
      { cause: loi },
    );
  }
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("File không có trang tính nào.");

  let dongTieuDe = 0;
  const banDo: Partial<Record<KhoaCot, number>> = {};
  for (let r = 1; r <= Math.min(15, ws.rowCount) && !dongTieuDe; r++) {
    const row = ws.getRow(r);
    const thu: Partial<Record<KhoaCot, number>> = {};
    row.eachCell((cell, c) => {
      const tieuDe = chuanHoa(chuOi(cell.value));
      for (const cot of COT) {
        if (thu[cot.khoa] === undefined && (cot.cachViet as readonly string[]).includes(tieuDe)) {
          thu[cot.khoa] = c;
          break;
        }
      }
    });
    if (thu.ten !== undefined) {
      dongTieuDe = r;
      Object.assign(banDo, thu);
    }
  }
  if (!dongTieuDe) {
    throw new Error(
      "Không tìm thấy dòng tiêu đề. Trong 15 dòng đầu phải có ô “Tên nhà cung cấp” — dễ nhất là " +
        "bấm “Xuất Excel” để lấy tệp mẫu rồi điền tiếp vào đó.",
    );
  }

  const doc = (row: { getCell: (c: number) => { value: unknown } }, k: KhoaCot) => {
    const c = banDo[k];
    if (c === undefined) return "";
    const v = row.getCell(c).value;
    /* Ô kiểu SỐ thì Excel đã ăn số 0 đầu. MST 9 chữ số → bù về 10; điện thoại 9 chữ số → bù số 0
       đầu (số di động / cố định VN đều bắt đầu bằng 0). */
    if ((k === "maSoThue" || k === "dienThoai") && typeof v === "number") {
      const so = String(Math.trunc(v));
      return so.length === 9 ? `0${so}` : so;
    }
    return chuOi(v).trim();
  };

  const ketQua: DongNhapNCC[] = [];
  for (let r = dongTieuDe + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const d: DongNhapNCC = {
      dongTrongFile: r,
      ten: doc(row, "ten"),
      ...(doc(row, "maSoThue") ? { maSoThue: doc(row, "maSoThue") } : {}),
      ...(doc(row, "diaChi") ? { diaChi: doc(row, "diaChi") } : {}),
      ...(doc(row, "dienThoai") ? { dienThoai: doc(row, "dienThoai") } : {}),
      ...(doc(row, "nguoiLienHe") ? { nguoiLienHe: doc(row, "nguoiLienHe") } : {}),
      ...(doc(row, "ghiChu") ? { ghiChu: doc(row, "ghiChu") } : {}),
    };
    const nhom = tachNhomNCC(doc(row, "nhomNCC"));
    if (nhom.length > 0) d.nhomNCC = nhom;
    /* Dòng chỉ ghi mỗi nhóm vẫn là dòng có dữ liệu → vào bản xem trước và báo "Thiếu tên", không
       lặng lẽ biến mất. */
    const trong =
      !d.ten && !d.maSoThue && !d.diaChi && !d.dienThoai && !d.nguoiLienHe && !d.ghiChu && nhom.length === 0;
    if (!trong) ketQua.push(d);
  }
  return {
    dong: ketQua,
    cotDoc: COT.filter((c) => banDo[c.khoa] !== undefined).map((c) => c.tieuDe),
    cotThieu: COT.filter((c) => banDo[c.khoa] === undefined).map((c) => c.tieuDe),
  };
}

/** Dựng tệp .xlsx của danh mục. `exceljs` nạp động như các tệp xuất khác. */
export async function xuatDanhMucNCCExcel(
  ds: readonly NhaCungCap[],
  nguoiXuat: string,
): Promise<Blob> {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "App Thu mua HP Cons";
  const ws = wb.addWorksheet("Danh mục NCC", { views: [{ state: "frozen", ySplit: 3 }] });
  /* Cột 1 = STT · cột 2 = "Mã NCC" (MST, chỉ chiều xuất — xem đầu tệp) · từ cột 3 = `COT`. */
  const COT_DAU = 3;
  const soCot = COT.length + 2;
  ws.mergeCells(1, 1, 1, soCot);
  ws.getCell(1, 1).value = "DANH MỤC NHÀ CUNG CẤP";
  ws.getCell(1, 1).font = { bold: true, size: 14 };
  ws.mergeCells(2, 1, 2, soCot);
  ws.getCell(2, 1).value = `Xuất bởi ${nguoiXuat} lúc ${new Date().toLocaleString("vi-VN")} · ${ds.length} nhà cung cấp`;
  ws.getCell(2, 1).font = { italic: true, size: 10 };
  ws.getRow(3).values = ["STT", "Mã NCC", ...COT.map((c) => c.tieuDe)];
  ws.getRow(3).font = { bold: true };
  ws.getRow(3).alignment = { vertical: "middle", wrapText: true };
  ws.getColumn(1).width = 6;
  ws.getColumn(2).width = 16;
  COT.forEach((c, i) => {
    ws.getColumn(i + COT_DAU).width = c.rong;
  });
  /* MST (cả cột "Mã NCC") và điện thoại ghi dạng CHỮ — để Excel không ăn số 0 đầu khi người dùng mở ra
     điền tiếp. */
  ws.getColumn(2).numFmt = "@";
  ws.getColumn(COT.findIndex((c) => c.khoa === "maSoThue") + COT_DAU).numFmt = "@";
  ws.getColumn(COT.findIndex((c) => c.khoa === "dienThoai") + COT_DAU).numFmt = "@";
  [...ds]
    .sort((a, b) => (a.maNCC ?? "").localeCompare(b.maNCC ?? ""))
    .forEach((n, i) => {
      /* Nhóm là MẢNG — phải nối thành chữ, đưa thẳng mảng vào ô là ExcelJS ghi rác. */
      const row = ws.addRow([
        i + 1,
        n.maSoThue ?? "",
        ...COT.map((c) => (c.khoa === "nhomNCC" ? noiNhomNCC(n.nhomNCC) : (n[c.khoa] ?? ""))),
      ]);
      row.alignment = { vertical: "top", wrapText: true };
    });
  ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: soCot } };
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
