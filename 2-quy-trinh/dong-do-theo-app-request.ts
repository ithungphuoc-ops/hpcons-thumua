// ============================================================
// ĐỀ XUẤT BỊ XOÁ BÊN APP REQUEST → HỒ SƠ THU MUA TỰ SANG CỘT "THẤT BẠI"
//
// ★ Sếp 26/09/2026: *"nếu không có mã số đề nghị bên app đề nghị thì đồng nghĩa bên app thu mua
// cũng sẽ ko có mã đó… bên app đề nghị xoá mã 1 đó thì bên app thu mua cũng phải tự động đẩy mã 1
// đó vào mục thất bại dù nó đang ở bước nào đi nữa"*.
//
// Sếp chọn cách: App Request, khi xoá một đề xuất, GỌI sang cửa
// `app/api/app-request/de-nghi-da-xoa/route.ts`. Tệp này là PHẦN LUẬT (hàm thuần, không mạng,
// không Firestore) để `kiem-luat-dung-chung.mjs` gọi thật được — route chỉ việc đọc, gọi hàm
// này, rồi ghi đúng những gì hàm trả về.
//
// 🔴 CÁCH XỬ LÝ ĐÃ CHỐT (trình Sếp 26/09/2026):
//   · Đẩy sang Thất bại DÙ đã có đơn hàng gửi NCC hoặc đã gửi QLK CTR.
//   · NHƯNG đơn hàng GIỮ NGUYÊN — KHÔNG tự huỷ PO. Huỷ PO là việc với nhà cung cấp (đã có thể
//     ký, đã giao một phần), một cú gọi máy móc từ app khác không được phép quyết thay.
//   · Báo đỏ cho Trưởng bộ phận xử lý từng đơn đó (xem `thongBaoPoCanXuLy`).
//
// 🔴 PHIẾU ĐÃ `hoan_thanh` THÌ KHÔNG ĐỔI. Hồ sơ đã đóng đủ chứng từ, hàng đã về, tiền có thể đã
// trả — đẩy nó sang Thất bại là làm sai thống kê và giải trình. Ghi vào `boQua` để route báo lại.
//
// 🔴 PHIẾU ĐÃ `dong_do` THÌ CŨNG KHÔNG ĐỔI — giữ nguyên lý do cũ (người dùng đã tự đóng dở và ghi
// lý do của họ; đè bằng câu hệ thống là mất lý do thật). Đây cũng chính là thứ làm hàm
// IDEMPOTENT: gọi lần hai thì cả họ phiếu đã `dong_do`, không ghi thêm dòng lịch sử nào.
// ============================================================

import type { DeNghiMuaHang, DonDatHang, ThongBaoChuyenBuoc } from "@/3-du-lieu/kieu-du-lieu";
import { NHAN_BAN_LANH_DAO, NHAN_TRUONG_BO_PHAN } from "@/2-quy-trinh/giai-doan-mua-hang";

/** Người thực hiện ghi vào nhật ký hồ sơ. KHÔNG dùng đúng chữ "Hệ thống" — xem de-nghi-moi. */
export const NGUOI_THUC_HIEN_XOA_AR = "Hệ thống · App Request";

/** Một đơn hàng của họ phiếu vừa sang Thất bại mà vẫn còn sống — Trưởng bộ phận phải xử lý tay. */
export interface PoCanXuLyKhiXoaAR {
  poId: string;
  poCode: string;
  prId: string;
  trangThai: DonDatHang["trangThai"];
  /** Đã đồng bộ sang QLK CTR (`qlkCtrSyncStatus === "synced"`). */
  daGuiQlk: boolean;
}

export interface KetQuaXoaTuAppRequest {
  /** Đề nghị sau khi áp — CHỈ những phiếu đã đổi (route ghi đúng những phiếu này). */
  deNghiDaDoi: DeNghiMuaHang[];
  daDoi: string[];
  boQua: { id: string; code: string; lyDo: string }[];
  poCanXuLy: PoCanXuLyKhiXoaAR[];
  /** Có ít nhất một đề nghị mang mã này không (để route trả 404). */
  timThay: boolean;
}

/**
 * So mã đề xuất đã chuẩn hoá. App Request lưu dạng `"000000157"`; bên gọi có thể gửi `"157"`.
 * Cùng quy ước với `khopTimBangQuyTrinh` (`2-quy-trinh/tim-kiem.ts`): hai bên TOÀN SỐ thì so theo
 * giá trị số, còn lại so nguyên văn sau khi bỏ khoảng trắng hai đầu.
 */
export function cungMaDeXuat(a: string | undefined, b: string | undefined): boolean {
  const x = (a ?? "").trim();
  const y = (b ?? "").trim();
  if (!x || !y) return false;
  if (/^\d+$/.test(x) && /^\d+$/.test(y)) return Number(x) === Number(y);
  return x === y;
}

/** `dd/mm/yyyy hh:mm` theo giờ Việt Nam (UTC+7) — không phụ thuộc múi giờ máy chủ. */
export function dinhDangGioVN(iso: string): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return iso;
  const vn = new Date(t.getTime() + 7 * 3600_000);
  const h = (n: number) => String(n).padStart(2, "0");
  return `${h(vn.getUTCDate())}/${h(vn.getUTCMonth() + 1)}/${vn.getUTCFullYear()} ${h(vn.getUTCHours())}:${h(vn.getUTCMinutes())}`;
}

/**
 * Gom CẢ HỌ PHIẾU của một mã đề xuất: mọi phiếu mang mã đó, cộng mọi phiếu có `deNghiGocId` /
 * `deNghiChaId` trỏ về một phiếu trong họ (lặp tới khi không thêm được ai — bắt được cả cháu
 * không mang mã đề xuất, hoặc bản copy bị người dùng xoá mất mã).
 */
export function hoPhieuCuaMaDeXuat(tatCaDeNghi: readonly DeNghiMuaHang[], maDeXuat: string): DeNghiMuaHang[] {
  const ids = new Set(
    tatCaDeNghi.filter((d) => cungMaDeXuat(d.maDeXuatAppRequest, maDeXuat)).map((d) => d.id),
  );
  if (ids.size === 0) return [];
  let them = true;
  while (them) {
    them = false;
    for (const d of tatCaDeNghi) {
      if (ids.has(d.id)) continue;
      if ((d.deNghiGocId && ids.has(d.deNghiGocId)) || (d.deNghiChaId && ids.has(d.deNghiChaId))) {
        ids.add(d.id);
        them = true;
      }
    }
  }
  return tatCaDeNghi.filter((d) => ids.has(d.id));
}

/**
 * ★ ÁP VIỆC "ĐỀ XUẤT ĐÃ BỊ XOÁ Ở APP REQUEST" LÊN KHO — hàm thuần.
 *
 * @param thoiDiem ISO đầy đủ giờ phút (route truyền `new Date().toISOString()`).
 * @param donHang  Toàn bộ đơn hàng — CHỈ ĐỌC để lập `poCanXuLy`, KHÔNG đổi đơn nào.
 */
export function apDungXoaTuAppRequest(
  tatCaDeNghi: readonly DeNghiMuaHang[],
  maDeXuat: string,
  thoiDiem: string,
  donHang: readonly DonDatHang[] = [],
): KetQuaXoaTuAppRequest {
  const ma = maDeXuat.trim();
  const ho = ma ? hoPhieuCuaMaDeXuat(tatCaDeNghi, ma) : [];
  const lyDo = `Đề xuất ${ma} đã bị xoá ở App Request (lúc ${dinhDangGioVN(thoiDiem)})`;

  const deNghiDaDoi: DeNghiMuaHang[] = [];
  const boQua: KetQuaXoaTuAppRequest["boQua"] = [];

  for (const d of ho) {
    if (d.trangThai === "hoan_thanh") {
      boQua.push({ id: d.id, code: d.code, lyDo: "Hồ sơ đã Hoàn thành — giữ nguyên, không đẩy sang Thất bại" });
      continue;
    }
    if (d.trangThai === "dong_do") {
      boQua.push({ id: d.id, code: d.code, lyDo: "Hồ sơ đã ở Thất bại từ trước — giữ nguyên lý do cũ" });
      continue;
    }
    deNghiDaDoi.push({
      ...d,
      trangThai: "dong_do",
      lyDoThatBai: lyDo,
      // ★ (03/10/2026) Nhớ chỗ cũ để App Request khôi phục đề xuất thì trả hồ sơ về đúng bước.
      trangThaiTruocXoaAR: d.trangThai,
      lichSu: [
        ...(d.lichSu ?? []),
        {
          thoiDiem,
          nguoiThucHien: NGUOI_THUC_HIEN_XOA_AR,
          hanhDong: `Tự chuyển sang Thất bại — lý do: ${lyDo}`,
          ghiChu: `Mã đề xuất App Request: ${ma}. Đơn hàng (nếu có) giữ nguyên, Trưởng bộ phận xử lý.`,
        },
      ],
    });
  }

  const idDaDoi = new Set(deNghiDaDoi.map((d) => d.id));
  const poCanXuLy: PoCanXuLyKhiXoaAR[] = donHang
    .filter((po) => po.prId && idDaDoi.has(po.prId) && po.trangThai !== "huy")
    .map((po) => ({
      poId: po.id,
      poCode: po.code,
      prId: po.prId as string,
      trangThai: po.trangThai,
      daGuiQlk: po.qlkCtrSyncStatus === "synced",
    }));

  return {
    deNghiDaDoi,
    daDoi: deNghiDaDoi.map((d) => d.id),
    boQua,
    poCanXuLy,
    timThay: ho.length > 0,
  };
}

// ============================================================
// ★ (03/10/2026, Sếp chốt — đợt 1 "liên kết 4 app") CÁC SỰ KIỆN SAU DUYỆT KHÁC TỪ APP REQUEST
//
// Cửa nhận: `app/api/app-request/cap-nhat-de-nghi/route.ts` (khôi phục · điều chỉnh sau duyệt ·
// thêm tài liệu; xoá cũng đi qua cửa đó và dùng lại đúng `apDungXoaTuAppRequest` ở trên).
//
// 📌 CHỐNG GHI 2 LẦN cho điều chỉnh / thêm tệp: mỗi sự kiện có `suKienId` riêng (mã việc trong
// hàng chờ App Request) → ghi kèm vào `ghiChu` của dòng lịch sử, gặp lại mã đó thì bỏ qua.
// Khôi phục tự nó đã idempotent (hồ sơ hết Thất bại thì lần hai không còn gì để trả về).
// ============================================================

export interface KetQuaSuKienAR {
  deNghiDaDoi: DeNghiMuaHang[];
  daDoi: string[];
  boQua: { id: string; code: string; lyDo: string }[];
  timThay: boolean;
  /** Đã áp sự kiện này từ trước (App Request gửi lại) — không đổi gì. */
  daXuLyTruoc: boolean;
}

const dauSuKien = (suKienId: string) => `[mã sự kiện ${suKienId}]`;

function daCoSuKien(ho: readonly DeNghiMuaHang[], suKienId: string): boolean {
  const dau = dauSuKien(suKienId);
  return ho.some((d) => (d.lichSu ?? []).some((m) => (m.ghiChu ?? "").includes(dau)));
}

/**
 * Khôi phục đề xuất bên App Request → hồ sơ đã bị TỰ chuyển Thất bại vì việc xoá đó (có
 * `trangThaiTruocXoaAR`) trở về đúng bước cũ. Hồ sơ Thất bại vì lý do khác thì GIỮ NGUYÊN.
 */
export function apDungKhoiPhucTuAppRequest(
  tatCaDeNghi: readonly DeNghiMuaHang[],
  maDeXuat: string,
  thoiDiem: string,
): KetQuaSuKienAR {
  const ma = maDeXuat.trim();
  const ho = ma ? hoPhieuCuaMaDeXuat(tatCaDeNghi, ma) : [];
  const deNghiDaDoi: DeNghiMuaHang[] = [];
  const boQua: KetQuaSuKienAR["boQua"] = [];

  for (const d of ho) {
    if (d.trangThai !== "dong_do") continue; // đang chạy bình thường — không có gì để khôi phục
    if (!d.trangThaiTruocXoaAR) {
      boQua.push({ id: d.id, code: d.code, lyDo: "Hồ sơ Thất bại vì lý do khác — giữ nguyên" });
      continue;
    }
    const { trangThaiTruocXoaAR, lyDoThatBai: _lyDoCu, ...conLai } = d;
    void _lyDoCu;
    deNghiDaDoi.push({
      ...conLai,
      trangThai: trangThaiTruocXoaAR,
      lichSu: [
        ...(d.lichSu ?? []),
        {
          thoiDiem,
          nguoiThucHien: NGUOI_THUC_HIEN_XOA_AR,
          hanhDong: "Đề xuất được khôi phục ở App Request — hồ sơ trở về bước cũ",
          ghiChu: `Mã đề xuất App Request: ${ma}. Lý do Thất bại trước đó: ${d.lyDoThatBai ?? "—"}.`,
        },
      ],
    });
  }
  return { deNghiDaDoi, daDoi: deNghiDaDoi.map((d) => d.id), boQua, timThay: ho.length > 0, daXuLyTruoc: false };
}

/**
 * Điều chỉnh sau duyệt / thêm tài liệu bên App Request → ghi 1 dòng lịch sử vào mọi hồ sơ của họ
 * phiếu, và nối tệp (nếu có) vào `taiLieuAppRequest` (bỏ trùng theo đường dẫn). Bảng vật tư KHÔNG
 * tự đổi — điều chỉnh là ghi chú tự do, người phụ trách đọc rồi tự xử lý.
 */
export function apDungGhiChuTuAppRequest(
  tatCaDeNghi: readonly DeNghiMuaHang[],
  maDeXuat: string,
  thoiDiem: string,
  suKien: {
    suKienId: string;
    loai: "dieu_chinh" | "them_file";
    nguoi?: string;
    noiDung?: string;
    tep?: { ten: string; duongDan?: string }[];
  },
): KetQuaSuKienAR {
  const ma = maDeXuat.trim();
  const ho = ma ? hoPhieuCuaMaDeXuat(tatCaDeNghi, ma) : [];
  if (ho.length === 0) return { deNghiDaDoi: [], daDoi: [], boQua: [], timThay: false, daXuLyTruoc: false };
  if (daCoSuKien(ho, suKien.suKienId)) {
    return { deNghiDaDoi: [], daDoi: [], boQua: [], timThay: true, daXuLyTruoc: true };
  }

  const tep = suKien.tep ?? [];
  const tenTep = tep.map((t) => t.ten).join(", ");
  const hanhDong =
    suKien.loai === "dieu_chinh"
      ? `Điều chỉnh sau duyệt từ App Request${suKien.nguoi ? ` (${suKien.nguoi})` : ""}: ${suKien.noiDung ?? ""}`
      : `Thêm tài liệu từ App Request${suKien.nguoi ? ` (${suKien.nguoi})` : ""}: ${tenTep}`;
  const ghiChu = [
    suKien.loai === "dieu_chinh" && tenTep ? `Tệp kèm: ${tenTep}.` : "",
    "Bảng vật tư không tự đổi — người phụ trách đọc để xử lý.",
    dauSuKien(suKien.suKienId),
  ]
    .filter(Boolean)
    .join(" ");

  const deNghiDaDoi = ho.map((d) => {
    const cu = d.taiLieuAppRequest ?? [];
    const daCo = new Set(cu.map((t) => t.duongDan ?? t.ten));
    const moi = tep.filter((t) => !daCo.has(t.duongDan ?? t.ten));
    return {
      ...d,
      ...(moi.length ? { taiLieuAppRequest: [...cu, ...moi] } : {}),
      lichSu: [...(d.lichSu ?? []), { thoiDiem, nguoiThucHien: NGUOI_THUC_HIEN_XOA_AR, hanhDong, ghiChu }],
    };
  });
  return { deNghiDaDoi, daDoi: deNghiDaDoi.map((d) => d.id), boQua: [], timThay: true, daXuLyTruoc: false };
}

/**
 * Tin báo đỏ cho Trưởng bộ phận — MỘT tin cho MỖI đơn còn sống.
 *
 * 📌 DÙNG LẠI khuôn tin cảnh báo đơn hàng đã có (`laCanhBaoTreo`, `kho-du-lieu.tsx` 29/08/2026):
 * `prId`/`prCode` mang id/mã CỦA PO, chuông đọc thẳng `tieuDe` và bấm vào mở `/don-hang/{id}`
 * (`nut-thong-bao.tsx`). Không phát minh loại tin mới.
 *
 * 🔴 ID CỐ ĐỊNH `tb-xoa-ar-{poId}` — chốt chống trùng khi App Request gọi lại.
 */
export function thongBaoPoCanXuLy(
  ds: readonly PoCanXuLyKhiXoaAR[],
  maDeXuat: string,
  thoiDiem: string,
): ThongBaoChuyenBuoc[] {
  return ds.map((p) => ({
    id: `tb-xoa-ar-${p.poId}`,
    prId: p.poId,
    prCode: p.poCode,
    tieuDe: `🔴 Đề xuất ${maDeXuat.trim()} đã bị xoá ở App Request — đơn hàng ${p.poCode} vẫn còn${
      p.daGuiQlk ? " (đã gửi QLK CTR)" : ""
    }, cần Trưởng bộ phận xử lý`,
    denBuoc: "that_bai",
    thoiDiem,
    guiToi: [NHAN_TRUONG_BO_PHAN, NHAN_BAN_LANH_DAO],
    daDoc: false,
    laCanhBaoTreo: true,
  }));
}
