// ============================================================
// NHÓM ĐỀ XUẤT NÀO THUỘC KHO EQUI — Sếp duyệt demo 14/10/2026
//
// Chỉ đạo Sếp: đề xuất duyệt xong ở các nhóm "03 - EQUI" LIÊN QUAN MUA HÀNG tự chảy vào kho EQUI
// (câu 1 chọn A: chỉ nhóm liên quan mua hàng). Em đề nghị 3 nhóm — đó là mặc định dưới đây:
//   "0. Đề xuất trực tiếp (EQUI)" · "1.0. Phiếu đề nghị (EQUI)" · "7.0. Xét duyệt báo giá NTP (EQUI)"
//
// 🔴 NHẬN THEO TÊN NHÓM, KHÔNG THEO MÃ NHÓM (Sếp chọn "cách 2", 14/10/2026): không đọc được mã nhóm
// thật bên App Đề xuất (không có khoá), và "Đề xuất trực tiếp" vốn KHÔNG có mã nhóm (`groupId=null`).
// Tên nhóm bên App Đề xuất có dạng `<số đầu>. <tên> (EQUI)` — số đầu do chính Sếp đặt để xếp thứ tự.
// Khớp khi: số đầu nằm trong danh sách VÀ tên kết thúc bằng "(EQUI)". Cần cả hai: số đầu "0"/"1.0" của
// nhóm KHÔNG phải EQUI (vd "1.0. Phiếu đề nghị") không được lọt vào kho EQUI.
//
// 📌 Danh sách số đầu chỉnh bằng biến môi trường `EQUI_SO_DAU_NHOM` (vd "0,1.0,7.0") — không phải sửa
// mã. Công tắc `EQUI_RE_KHO=1` bật việc rẽ kho; TẮT (mặc định) thì mọi đề xuất vẫn vào kho thường y như
// trước — đường lùi bằng một biến môi trường, đúng khuôn các đợt chống mất dữ liệu.
//
// ⚠️ THUẦN HÀM, KHÔNG ĐỌC MẠNG, để bộ luật (`kiem-kho-equi.mjs`) GỌI THẬT được.
// ============================================================

import type { KhoId } from "@/3-du-lieu/kho-id";

/** Số đầu mặc định của ba nhóm EQUI liên quan mua hàng. */
export const SO_DAU_NHOM_EQUI_MAC_DINH: readonly string[] = ["0", "1.0", "7.0"];

/** `"1.0. Phiếu đề nghị"` → `"1.0"`; `"0. Đề xuất trực tiếp"` → `"0"`; không có số đầu → `null`. */
export function soDauCuaTenNhom(ten: string): string | null {
  const m = /^\s*(\d+(?:\.\d+)*)\.?(?=\s|$)/.exec(ten);
  return m ? m[1] : null;
}

/** Tên nhóm có kết thúc bằng "(EQUI)" không — bỏ khoảng trắng thừa, không phân biệt hoa thường. */
export function coDuoiEqui(ten: string): boolean {
  return /\(\s*equi\s*\)\s*$/i.test(ten.normalize("NFC").trim());
}

/**
 * Đọc danh sách số đầu từ chuỗi cấu hình ("0, 1.0 ,7.0"). Rỗng/thiếu → mặc định. Phần tử không giống
 * số đầu (vd "abc") bị BỎ — không để một lỗi gõ làm nhóm lạ lọt vào kho EQUI.
 */
export function docSoDauCauHinh(tho: string | undefined | null): readonly string[] {
  const ds = (tho ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d+(\.\d+)*$/.test(s));
  return ds.length > 0 ? ds : SO_DAU_NHOM_EQUI_MAC_DINH;
}

/** Tên nhóm này có thuộc nhóm EQUI liên quan mua hàng không. */
export function laNhomEqui(
  tenNhom: unknown,
  soDauChoPhep: readonly string[] = SO_DAU_NHOM_EQUI_MAC_DINH,
): boolean {
  if (typeof tenNhom !== "string") return false;
  const ten = tenNhom.normalize("NFC");
  if (!coDuoiEqui(ten)) return false;
  const so = soDauCuaTenNhom(ten);
  return so !== null && soDauChoPhep.includes(so);
}

/**
 * Đề xuất này vào kho nào. `bat=false` (công tắc tắt) → luôn kho thường. Không biết tên nhóm → kho
 * thường (KHÔNG đoán bừa — đoán sai là một đề xuất thường rơi vào kho EQUI và biến mất khỏi bảng cũ).
 */
export function khoChoDeXuat(
  bat: boolean,
  tenNhom: unknown,
  soDauChoPhep: readonly string[] = SO_DAU_NHOM_EQUI_MAC_DINH,
): KhoId {
  return bat && laNhomEqui(tenNhom, soDauChoPhep) ? "equi" : "thuong";
}

/** Công tắc đọc từ biến môi trường MÁY CHỦ (đọc lúc chạy, không phải lúc build). */
export function reKhoDangBat(tho: string | undefined | null): boolean {
  return (tho ?? "").trim().toLowerCase() === "1";
}
