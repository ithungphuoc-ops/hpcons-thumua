// ============================================================
// GOM THEO CÔNG TRÌNH — một luật cho mọi màn cần nhóm theo tên công trình.
//
// ★ Sếp 25/09/2026: ***"tạo thêm nút group theo tên công trình"*** ở màn Công nợ. Màn Theo dõi đề
// nghị đã gom theo công trình từ trước — hàm khoá được dời ra đây để HAI MÀN DÙNG CHUNG. Hai bản
// chép tay sớm muộn lệch nhau: cùng một công trình mà màn này gộp, màn kia tách làm hai nhóm.
//
// 🔴 Tên công trình là chữ NGƯỜI DÙNG GÕ TAY, nên khoá phải bỏ dấu + gộp khoảng trắng + hạ chữ
// thường: "Nhà xưởng  Howell" và "nhà xưởng howell" là một công trình.
// ============================================================

import { boDau } from "@/6-tien-ich/bo-dau";
import type { DeNghiMuaHang, DonDatHang } from "@/3-du-lieu/kieu-du-lieu";

/** Khoá của nhóm "chưa ghi công trình" — dùng chung để hai màn cùng xếp nhóm này ở một chỗ. */
export const NHOM_CHUA_GHI_CONG_TRINH = "__chua_ghi__";

/** Khoá gom nhóm từ tên công trình người dùng đã gõ. Trống → nhóm "chưa ghi". */
export function khoaCongTrinh(ten: string | undefined): string {
  const t = (ten ?? "").trim();
  if (t === "") return NHOM_CHUA_GHI_CONG_TRINH;
  return boDau(t).replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Tên công trình của một PO.
 *
 * 📌 ƯU TIÊN TÊN CHÉP TRÊN ĐƠN (`po.tenCongTrinh`) — đơn là chứng từ gửi ra ngoài nên nội dung
 * đứng yên kể cả khi đề nghị nguồn bị sửa tên (xem chú thích trường đó ở `kieu-du-lieu.ts`).
 * Đơn cũ chưa chép thì mới tra đề nghị gốc qua `prId`.
 */
export function tenCongTrinhCuaPO(
  po: Pick<DonDatHang, "tenCongTrinh" | "prId"> | undefined,
  tatCaDeNghi: readonly Pick<DeNghiMuaHang, "id" | "tenCongTrinh">[],
): string {
  if (!po) return "";
  const tren = (po.tenCongTrinh ?? "").trim();
  if (tren) return tren;
  return (tatCaDeNghi.find((d) => d.id === po.prId)?.tenCongTrinh ?? "").trim();
}

/**
 * ★ Xếp danh sách thành các nhóm công trình, GIỮ thứ tự sẵn có trong từng nhóm.
 *
 * Nhóm xếp theo tên (tiếng Việt), nhóm "chưa ghi công trình" luôn ở CUỐI — để các công trình thật
 * đứng trước, không bị một nhóm rác chen lên đầu bảng.
 */
export function gomTheoCongTrinh<T>(
  ds: readonly T[],
  layTen: (x: T) => string,
): { khoa: string; ten: string; muc: T[] }[] {
  const nhom = new Map<string, { khoa: string; ten: string; muc: T[] }>();
  for (const x of ds) {
    const ten = layTen(x).trim();
    const khoa = khoaCongTrinh(ten);
    const n = nhom.get(khoa) ?? { khoa, ten: ten || "Chưa ghi công trình", muc: [] };
    n.muc.push(x);
    nhom.set(khoa, n);
  }
  return [...nhom.values()].sort((a, b) => {
    if (a.khoa === NHOM_CHUA_GHI_CONG_TRINH) return 1;
    if (b.khoa === NHOM_CHUA_GHI_CONG_TRINH) return -1;
    return a.ten.localeCompare(b.ten, "vi");
  });
}
