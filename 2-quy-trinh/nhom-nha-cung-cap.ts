// ============================================================
// NHÓM NHÀ CUNG CẤP — luật thuần (không giao diện, không đọc kho)
//
// ★ Sếp 02/10/2026: *"Thêm trường để nhân viên có thể tự thêm và nhóm được NCC theo mong muốn.
//   Ví dụ: NCC chuyên cung cấp VLXD, NCC chuyên cung cấp bê tông.."*. Sếp chốt cùng ngày:
//   · MỘT NCC THUỘC ĐƯỢC NHIỀU NHÓM → trường `nhomNCC?: string[]` trên `NhaCungCap`.
//   · Nhập Excel vẫn BỎ QUA nguyên dòng trùng (kể cả cột nhóm) — gán nhóm cho NCC đã có làm
//     TRÊN MÀN HÌNH danh mục.
//
// 🔴 KHÔNG CÓ DANH SÁCH NHÓM LƯU RIÊNG. Danh sách nhóm = các giá trị đang được dùng trên danh
//    mục, suy ra mỗi lần (`thongKeNhomNCC`). Lưu riêng là hai chỗ cùng nói một chuyện: xoá NCC cuối
//    cùng của nhóm thì danh sách vẫn giữ nhóm ma, đổi tên ở một chỗ thì chỗ kia lệch.
// 🔴 SO TRÙNG TÊN NHÓM THEO CHUẨN HOÁ (`khoaNhom`): bỏ dấu, gộp khoảng trắng, không phân biệt hoa
//    thường — "Bê tông", "be  tong", "BÊ TÔNG" là MỘT nhóm. So chuỗi thô thì danh mục mọc ba nhóm
//    nhìn như một và lọc theo nhóm nào cũng sót NCC. Cách viết HIỂN THỊ giữ theo lần gặp đầu.
// 📌 Hàm ở đây là nơi DUY NHẤT tách / gộp / đổi tên nhóm. Tầng ghi (`kho-du-lieu.tsx` →
//    `datNhomNCC`, `doiTenNhomNCC`, `themNhaCungCap`, `themNhieuNhaCungCap`) và Excel
//    (`danh-muc-ncc-excel.ts`) đều gọi vào đây — không tự viết lại luật tách chuỗi.
// ============================================================

import { boDau } from "@/6-tien-ich/bo-dau";

/** Độ dài tối đa một tên nhóm — để hàng lọc theo nhóm không vỡ khung. */
export const DO_DAI_TOI_DA_TEN_NHOM = 60;

/** Dấu tách nhiều nhóm trong MỘT ô chữ (ô nhập của hộp thêm NCC, ô Excel). */
const DAU_TACH = /[;,\n\r]+/;

/**
 * Khoá so trùng: chuẩn hoá Unicode NFC, gộp khoảng trắng, chữ thường — GIỮ DẤU.
 *
 * 🔴 KHÔNG BỎ DẤU (sửa 02/10/2026, soát lỗi trước push): tiếng Việt dấu là nghĩa. Bỏ dấu thì "Cửa"
 * và "Cưa", "Cát" và "Cắt", "Đá" và "Da" thành MỘT nhóm — gõ "Cưa" bị lặng lẽ đổi thành "Cửa",
 * không cách nào tạo được nhóm "Cưa". Khác hoa/thường và khoảng trắng thừa thì vẫn là một nhóm.
 * 📌 NFC trước khi so: chữ gõ bằng bảng mã "Unicode tổ hợp" (Unikey/EVKey, tệp làm trên Mac) là
 * NFD — cùng chữ "Bê tông" mà khác chuỗi, và dài hơn khi đếm ký tự.
 */
export function khoaNhom(ten: string): string {
  return ten.normalize("NFC").replace(/\s+/g, " ").trim().toLocaleLowerCase("vi");
}

/** Cách viết hiển thị: NFC + gộp khoảng trắng thừa — GIỮ dấu, giữ hoa thường người dùng gõ. */
export function gonTenNhom(ten: string): string {
  return ten.normalize("NFC").replace(/\s+/g, " ").trim();
}

/**
 * Tên nhóm có dùng được không. Trả câu lý do, `null` là dùng được.
 *
 * 🔴 Cấm dấu `;` và `,` trong tên: đó là dấu tách nhiều nhóm của ô nhập và của cột Excel — tên
 * "Thép, tôn" xuất ra rồi nhập lại sẽ thành HAI nhóm "Thép" và "tôn".
 * 📌 Cấm tên "Chưa phân nhóm": trùng chữ với nút lọc NCC chưa có nhóm, người dùng không phân biệt
 * được hai thứ.
 */
export function lyDoTenNhomKhongHop(ten: string): string | null {
  const t = gonTenNhom(ten);
  if (t === "") return "Chưa có tên nhóm.";
  if (/[;,]/.test(t)) return `Tên nhóm “${t}” có dấu “;” hoặc “,” — đó là dấu tách nhiều nhóm, hãy bỏ đi.`;
  if (t.length > DO_DAI_TOI_DA_TEN_NHOM) {
    return `Tên nhóm dài quá ${DO_DAI_TOI_DA_TEN_NHOM} ký tự — hãy đặt ngắn hơn.`;
  }
  /* Riêng phép cấm này BỎ DẤU: "Chua phan nhom" gõ không dấu vẫn đọc ra đúng tên nút lọc. */
  if (boDau(khoaNhom(t)) === "chua phan nhom") return "“Chưa phân nhóm” là tên của nút lọc — hãy đặt tên khác.";
  return null;
}

/**
 * Tách thành mảng nhóm: nhận chuỗi `"VLXD; Bê tông, Thép"` hoặc mảng có sẵn.
 * Bỏ ô rỗng, bỏ trùng THEO CHUẨN HOÁ, giữ cách viết của lần gặp ĐẦU TIÊN, giữ thứ tự.
 *
 * ⚠️ Không kiểm tên hợp lệ ở đây (độ dài, tên cấm) — việc đó của `lyDoTenNhomKhongHop`, để nơi gọi
 * báo lỗi rõ ràng thay vì lặng lẽ vứt nhóm người dùng đã gõ.
 */
export function tachNhomNCC(vao: string | readonly string[] | undefined | null): string[] {
  if (vao === undefined || vao === null) return [];
  const manh = typeof vao === "string" ? vao.split(DAU_TACH) : vao.flatMap((x) => String(x).split(DAU_TACH));
  const daGap = new Set<string>();
  const ra: string[] = [];
  for (const m of manh) {
    const ten = gonTenNhom(m);
    if (ten === "") continue;
    const k = khoaNhom(ten);
    if (daGap.has(k)) continue;
    daGap.add(k);
    ra.push(ten);
  }
  return ra;
}

/**
 * Đổi từng tên nhóm về CÁCH VIẾT ĐANG DÙNG trên danh mục nếu nhóm đó đã có (theo chuẩn hoá).
 *
 * 📌 Người dùng gõ "vlxd" mà danh mục đã có nhóm "VLXD" thì NCC mới nhận nhãn "VLXD" — không thì
 * cùng một nhóm hiện hai kiểu chữ tuỳ NCC. Nhóm chưa có thì giữ nguyên cách gõ.
 */
export function theoCachVietSan(
  nhom: readonly string[],
  danhMuc: readonly { nhomNCC?: readonly string[] }[],
): string[] {
  const sanCo = new Map<string, string>();
  for (const n of danhMuc) {
    for (const x of n.nhomNCC ?? []) {
      const k = khoaNhom(x);
      if (k !== "" && !sanCo.has(k)) sanCo.set(k, gonTenNhom(x));
    }
  }
  return tachNhomNCC(nhom.map((x) => sanCo.get(khoaNhom(x)) ?? x));
}

/** Nối mảng nhóm thành một ô chữ (cột Excel, ô nhập). */
export function noiNhomNCC(nhom: readonly string[] | undefined): string {
  return tachNhomNCC(nhom ?? []).join("; ");
}

/** NCC có thuộc nhóm `ten` không (so theo chuẩn hoá). */
export function coTrongNhom(ncc: { nhomNCC?: readonly string[] }, ten: string): boolean {
  const k = khoaNhom(ten);
  return k !== "" && (ncc.nhomNCC ?? []).some((x) => khoaNhom(x) === k);
}

export interface ThongKeNhom {
  /** Cách viết hiển thị (lần gặp đầu theo thứ tự danh mục). */
  ten: string;
  soNCC: number;
}

/**
 * Đếm số NCC mỗi nhóm + số NCC chưa có nhóm nào. Nhóm xếp theo tên (bảng chữ cái tiếng Việt).
 * Một NCC nhiều nhóm thì được đếm ở MỖI nhóm của nó — nên tổng các nhóm có thể lớn hơn số NCC.
 */
export function thongKeNhomNCC(ds: readonly { nhomNCC?: readonly string[] }[]): {
  nhom: ThongKeNhom[];
  chuaPhanNhom: number;
} {
  const theoKhoa = new Map<string, ThongKeNhom>();
  let chuaPhanNhom = 0;
  for (const n of ds) {
    const nhom = tachNhomNCC(n.nhomNCC ?? []);
    if (nhom.length === 0) {
      chuaPhanNhom += 1;
      continue;
    }
    for (const ten of nhom) {
      const k = khoaNhom(ten);
      const co = theoKhoa.get(k);
      if (co) co.soNCC += 1;
      else theoKhoa.set(k, { ten, soNCC: 1 });
    }
  }
  return {
    nhom: [...theoKhoa.values()].sort((a, b) => a.ten.localeCompare(b.ten, "vi")),
    chuaPhanNhom,
  };
}

/** Lựa chọn của hàng lọc theo nhóm. */
export type LocNhomNCC = { loai: "tat_ca" } | { loai: "chua_phan_nhom" } | { loai: "nhom"; ten: string };

export const LOC_TAT_CA: LocNhomNCC = { loai: "tat_ca" };

/**
 * Lọc danh mục theo nhóm. Vì một NCC nhiều nhóm nên đây là LỌC (một NCC hiện ở mọi nhóm của nó),
 * không phải gom thành khối rời.
 */
export function locNCCTheoNhom<T extends { nhomNCC?: readonly string[] }>(ds: readonly T[], loc: LocNhomNCC): T[] {
  if (loc.loai === "tat_ca") return [...ds];
  if (loc.loai === "chua_phan_nhom") return ds.filter((n) => tachNhomNCC(n.nhomNCC ?? []).length === 0);
  return ds.filter((n) => coTrongNhom(n, loc.ten));
}

/**
 * Gắn mảng nhóm mới vào một NCC. Mảng rỗng thì XOÁ HẲN khoá `nhomNCC` — Firestore từ chối giá trị
 * `undefined`, và để `[]` thì bản ghi mang một khoá vô nghĩa.
 * 📌 Không đổi gì (cùng nhóm, cùng cách viết, cùng thứ tự) thì trả LẠI ĐÚNG đối tượng cũ để nơi
 * gọi biết không có gì phải ghi.
 */
export function ganNhomNCC<T extends { nhomNCC?: string[] }>(ncc: T, nhom: readonly string[]): T {
  const moi = tachNhomNCC(nhom);
  const cu = ncc.nhomNCC ?? [];
  if (moi.length === cu.length && moi.every((x, i) => x === cu[i])) return ncc;
  /* Gõ kiểu là hình dạng gốc rồi ép lại `T`: gán thẳng vào `T["nhomNCC"]` của kiểu tổng quát thì
     TypeScript không cho (T có thể hẹp hơn). */
  const sau: { nhomNCC?: string[] } = { ...ncc };
  if (moi.length === 0) delete sau.nhomNCC;
  else sau.nhomNCC = moi;
  return sau as T;
}

/**
 * Thêm / bỏ MỘT nhóm cho các NCC có `id` trong `ids`. NCC khác giữ nguyên đối tượng cũ.
 * Thêm: nhóm đã có trên danh mục (theo chuẩn hoá) thì dùng CÁCH VIẾT ĐANG CÓ (`theoCachVietSan`).
 * Bỏ: bỏ mọi cách viết cùng chuẩn hoá.
 */
export function datNhomTrongDanhMuc<T extends { id: string; nhomNCC?: string[] }>(
  ds: readonly T[],
  ids: readonly string[],
  ten: string,
  hanhDong: "them" | "bo",
): T[] {
  const tapId = new Set(ids);
  const k = khoaNhom(ten);
  if (k === "") return [...ds];
  const t = theoCachVietSan([ten], ds)[0] ?? gonTenNhom(ten);
  return ds.map((n) => {
    if (!tapId.has(n.id)) return n;
    const cu = n.nhomNCC ?? [];
    const sau = hanhDong === "them" ? [...cu, t] : cu.filter((x) => khoaNhom(x) !== k);
    return ganNhomNCC(n, sau);
  });
}

/**
 * Đổi tên nhóm `tenCu` → `tenMoi` trên CẢ danh mục.
 *
 * 📌 Tên mới trùng (theo chuẩn hoá) một nhóm khác đang có thì HAI NHÓM GỘP LÀM MỘT: NCC thuộc cả
 * hai chỉ còn một nhãn. Mọi cách viết của cả tên cũ lẫn tên mới đều đổi về ĐÚNG cách viết `tenMoi`
 * — không thì sau khi gộp, nhóm vẫn hiện hai kiểu chữ tuỳ NCC.
 */
export function doiTenNhomTrongDanhMuc<T extends { nhomNCC?: string[] }>(
  ds: readonly T[],
  tenCu: string,
  tenMoi: string,
): T[] {
  const kCu = khoaNhom(tenCu);
  const moi = gonTenNhom(tenMoi);
  const kMoi = khoaNhom(moi);
  if (kCu === "" || kMoi === "") return [...ds];
  return ds.map((n) => {
    const cu = n.nhomNCC ?? [];
    if (!cu.some((x) => khoaNhom(x) === kCu || khoaNhom(x) === kMoi)) return n;
    return ganNhomNCC(
      n,
      cu.map((x) => (khoaNhom(x) === kCu || khoaNhom(x) === kMoi ? moi : x)),
    );
  });
}
