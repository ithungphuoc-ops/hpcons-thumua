// ============================================================
// GỬI THÔNG BÁO THU MUA SANG CHUÔNG APP TỔNG — luật THUẦN (Sếp duyệt demo 08/10/2026)
//
// Demo đã duyệt: tong-quan-demo/HPCons-ThuMua/thong-bao-thu-mua-kho-2026-10-08/index.html
//   · Gửi vào chuông App Tổng + thông báo màn hình/điện thoại (App Tổng lo phần đẩy).
//   · Chuông riêng trong Thu mua GIỮ NGUYÊN đợt này.
//   · Việc → người nhận theo đúng bảng "Thu mua — việc nào báo cho ai".
//   · KHÔNG BAO GIỜ ghi giá / số tiền (thủ kho không được xem giá).
//   · Chỉ báo cho người được xem hồ sơ đó (cùng luật chuông trong app: `thongBaoDanhChoToi` +
//     ô tick "Xem bước quy trình").
//
// 🔴 TỆP NÀY KHÔNG ĐỌC / GHI GÌ. Không đụng cách lưu dữ liệu nghiệp vụ (tài liệu chung
// `chay-thu/du-lieu-chung`). Phần đọc Firestore + gọi App Tổng ở `5-ket-noi/thong-bao-app-tong-may-chu.ts`;
// trình duyệt chỉ gửi MÃ TIN qua `3-du-lieu/gui-tin-app-tong.ts`.
//
// 📌 Thuần để `kiem-thong-bao-app-tong.mjs` gọi thật được (cùng cách `kiem-luat-dung-chung.mjs`).
// ============================================================

import type { DeNghiMuaHang, DonDatHang, ThongBaoChuyenBuoc } from "@/3-du-lieu/kieu-du-lieu";
import type { KhoaXemBuoc, Quyen } from "@/4-phan-quyen/quyen";
import { duocXemBuoc, hoSoDuocXemTheoBuoc, poDuocXemTheoBuoc } from "@/4-phan-quyen/quyen";
import type { GiaiDoanMuaHang } from "@/2-quy-trinh/giai-doan-mua-hang";

/** Hằng nhãn vai trò — trùng `giai-doan-mua-hang.ts` (viết lại để tệp này không nạp cả bộ luật giai đoạn). */
export const NHAN_TBP = "Trưởng bộ phận Thu mua";
export const NHAN_CHUA_PB = "Chưa phân bổ người phụ trách";
export const NHAN_BLD = "Ban lãnh đạo";

export const APP_ID = "thu_mua";
export const DIA_CHI_APP = "https://thumua.hpcore.vn";
/** Tối đa số mã tin một lần gọi `/api/thong-bao/day`. */
export const TOI_DA_MA_MOI_LAN = 20;
/** Tin cũ hơn mốc này thì không gửi (chặn gửi lại tin cũ bằng cách gọi lại mã của nó). */
export const TUOI_TOI_DA_TIN_MS = 60 * 60_000;
/** Cho phép đồng hồ máy lệch tới trước tối đa 10 phút. */
export const LECH_TOI_TRUOC_MS = 10 * 60_000;

export type LoaiTinAppTong =
  | "giao_viec"
  | "de_nghi_moi"
  | "cho_duyet_bao_gia"
  | "chuyen_tiep"
  | "canh_bao"
  | "kho_da_nhan";

/** Mã tin hợp lệ để nhận từ trình duyệt — chặn chuỗi lạ. */
export const MA_TIN_HOP_LE = /^tb-[A-Za-z0-9_-]{1,120}$/;

/**
 * Tin trong chuông Thu mua → loại thông báo App Tổng. `null` = loại không có trong bảng đã duyệt → bỏ qua.
 *
 * Bảng đã duyệt (demo 08/10/2026):
 *   · Được giao / chuyển việc         → `tb-vm-*` / `tb-cv-*` (`laViecMoi`)               → giao_viec
 *   · Đề nghị mới từ App Đề xuất      → `tb-req-*`                                         → de_nghi_moi
 *   · Chuyển sang bước duyệt báo giá  → `tb-<số>` có `denBuoc = xet_duyet_bao_gia`         → cho_duyet_bao_gia
 *   · Trưởng BP bấm "Chuyển tiếp"     → `tb-ct-*` (`laChuyenTiep`)                         → chuyen_tiep
 *   · PO treo / không gửi được sang Kho / đề xuất bị xoá → `tb-treo-po-*` · `tb-dung-gui-po-*` · `tb-xoa-ar-*`
 *                                                                                           → canh_bao
 *   · Kho đã nhận hàng → không có tin trong chuông; máy chủ tự dựng ở cửa `phieu-nhan-moi`.
 * Bỏ qua: `tb-moi-*` (đề nghị lập tay — không có trong bảng), mọi tin chuyển bước khác.
 */
/** Phần tin đủ để phân loại. */
export interface TinDePhanLoai {
  id: string;
  tuBuoc?: string;
  denBuoc?: string;
  laViecMoi?: boolean;
  laChuyenTiep?: boolean;
  laCanhBaoTreo?: boolean;
}

export function phanLoaiTin(t: TinDePhanLoai): LoaiTinAppTong | null {
  const id = t.id ?? "";
  if ((id.startsWith("tb-vm-") || id.startsWith("tb-cv-")) && t.laViecMoi === true) return "giao_viec";
  if (id.startsWith("tb-req-")) return "de_nghi_moi";
  if (id.startsWith("tb-ct-") && t.laChuyenTiep === true) return "chuyen_tiep";
  if (
    (id.startsWith("tb-treo-po-") || id.startsWith("tb-dung-gui-po-") || id.startsWith("tb-xoa-ar-")) &&
    t.laCanhBaoTreo === true
  ) {
    return "canh_bao";
  }
  if (/^tb-\d+$/.test(id) && t.denBuoc === "xet_duyet_bao_gia" && t.tuBuoc !== t.denBuoc) return "cho_duyet_bao_gia";
  return null;
}

/**
 * Mã sự kiện gửi App Tổng (App Tổng chống trùng theo mã này).
 *
 * · Đề nghị mới: theo MÃ HỒ SƠ — nhiều máy cùng thấy một đề nghị mới có thể sinh nhiều tin `tb-req-*`.
 * · Tin có mã cố định (`tb-treo-po-*`, `tb-dung-gui-po-*`, `tb-xoa-ar-*`): theo mã tin — nhiều máy sinh
 *   cùng mã thì chỉ gửi một lần.
 * · Tin mã số thứ tự (`tb-12`, `tb-vm-12`…): mã tin + dấu thời điểm — hai máy có thể cấp trùng số cho hai
 *   việc khác nhau, chỉ theo mã tin là mất một việc.
 */
export function maSuKien(t: Pick<ThongBaoChuyenBuoc, "id" | "prId" | "thoiDiem">, loai: LoaiTinAppTong): string {
  if (loai === "de_nghi_moi") return gioiHanMa(`${APP_ID}:de-nghi-moi:${t.prId}`);
  if (loai === "canh_bao") return gioiHanMa(`${APP_ID}:${t.id}`);
  const dau = String(t.thoiDiem ?? "").replace(/[^0-9]/g, "").slice(0, 17);
  return gioiHanMa(`${APP_ID}:${t.id}${dau ? `-${dau}` : ""}`);
}

/** Mã sự kiện "Kho đã nhận hàng" — theo mã phiếu nhận (cố định theo PO + lần giao). */
export function maSuKienKhoNhan(phieuId: string): string {
  return gioiHanMa(`${APP_ID}:kho-nhan:${phieuId}`);
}

function gioiHanMa(s: string): string {
  return s.replace(/[^A-Za-z0-9_:.-]/g, "_").slice(0, 160);
}

// ------------------------------------------------------------
// LÀM SẠCH CHỮ — ký tự điều khiển / bidi, cắt an toàn theo cụm ký tự, bỏ số tiền
// ------------------------------------------------------------

/** Ký tự điều khiển + ký tự đảo chiều (bidi) + ký tự vô hình. GIỮ U+200C/U+200D (nối emoji). */
const KY_TU_LA = /[\u0000-\u001F\u007F-\u009F​‎‏‪-‮⁠-⁤⁦-⁩﻿]/g;

export function lamSach(s: unknown): string {
  if (typeof s !== "string") return "";
  return s.replace(KY_TU_LA, " ").replace(/\s+/g, " ").trim();
}

function cumKyTu(s: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment: (x: string) => Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) return Array.from(new Seg("vi", { granularity: "grapheme" }).segment(s), (x) => x.segment);
  return Array.from(s);
}

/**
 * Cắt chuỗi để `.length` (đơn vị UTF-16, cách App Tổng đếm) ≤ `toiDa`, KHÔNG cắt đôi một cụm ký tự
 * (emoji ghép, chữ có dấu tổ hợp). Bị cắt thì thêm "…".
 */
export function catAnToan(s: string, toiDa: number): string {
  if (s.length <= toiDa) return s;
  if (toiDa <= 1) return "…".slice(0, Math.max(0, toiDa));
  let ra = "";
  for (const c of cumKyTu(s)) {
    if (ra.length + c.length > toiDa - 1) break;
    ra += c;
  }
  return ra.trimEnd() + "…";
}

/** Làm sạch rồi cắt. */
export function chu(s: unknown, toiDa: number): string {
  return catAnToan(lamSach(s), toiDa);
}

/**
 * 🔴 BỎ SỐ TIỀN trong chữ tự do (lời nhắn, tiêu đề) — thông báo KHÔNG BAO GIỜ được mang giá.
 *
 * Che (thay bằng "[…]"), theo thứ tự:
 *   ① ký hiệu tiền trước số: `₫ 45000`, `$200`, `VND 1.000`;
 *   ② số + đơn vị tiền: đ/₫/đồng/VND/VNĐ/USD, nghìn/ngàn/k, triệu/tr (cả `1tr2`), tỷ/tỉ;
 *   ③ số đứng sau từ khoá giá: giá · đơn giá · báo giá · tiền · thành tiền · tổng (giữ từ khoá);
 *   ④ mọi số có NHÓM NGHÌN (`1.200.000`, `1,200`, `1 200 000`).
 * GIỮ NGUYÊN: mã (`PO-2026`, `DMH260012`, `000231`), số nhỏ không đơn vị tiền (`10 tấn`, `12m`).
 * ⚠️ Che thừa chấp nhận được (vd số lượng có nhóm nghìn `5.000 viên`) — lọt giá thì không.
 */
const SO = String.raw`(?:\d{1,3}(?:[.,\s]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?)`;
const DAU_SO = String.raw`(?<![\p{L}\d\-])`;
const DON_VI_TIEN = String.raw`(?:\s?(?:triệu|trieu|tỷ|tỉ|ty|ti|nghìn|nghin|ngàn|ngan)(?![\p{L}])(?:\s?(?:đồng|dong|vnđ|vnd|đ)(?![\p{L}]))?|\s?(?:đồng|dong|vnđ|vnd|usd|₫|đ)(?![\p{L}])|\s?tr\d*(?![\p{L}])|\s?k(?![\p{L}\d]))`;
const RE_KY_HIEU = new RegExp(String.raw`(?:₫|\$|VNĐ|VND|USD)\s?${SO}`, "giu");
const RE_SO_DON_VI = new RegExp(`${DAU_SO}${SO}${DON_VI_TIEN}`, "giu");
const RE_TU_KHOA = new RegExp(
  String.raw`((?<![\p{L}])(?:thành tiền|đơn giá|báo giá|giá|tiền|tổng)(?![\p{L}])\s*(?:là|:|=)?\s*)${SO}`,
  "giu",
);
const RE_NHOM_NGHIN = new RegExp(String.raw`${DAU_SO}\d{1,3}(?:[.,\s]\d{3})+(?:[.,]\d+)?(?!\d)`, "gu");

export function boSoTien(s: string): string {
  return s
    .replace(RE_KY_HIEU, "[…]")
    .replace(RE_SO_DON_VI, "[…]")
    .replace(RE_TU_KHOA, "$1[…]")
    .replace(RE_NHOM_NGHIN, "[…]");
}

// ------------------------------------------------------------
// NỘI DUNG THEO LOẠI — không giá
// ------------------------------------------------------------

export interface NoiDungTin {
  title: string;
  body: string;
  link: string;
  meta: { v: 1; kind: LoaiTinAppTong; headline: string; subline?: string; excerpt?: string; code?: string };
  push: { title: string; body: string; actionTitle?: string };
}

const BIEU_TUONG: Record<LoaiTinAppTong, string> = {
  giao_viec: "📦",
  de_nghi_moi: "🆕",
  cho_duyet_bao_gia: "⏳",
  chuyen_tiep: "↪️",
  canh_bao: "⚠️",
  kho_da_nhan: "✅",
};

/** Bỏ biểu tượng cảnh báo đầu câu của tin cũ (`⚠️ …`, `🔴 …`) — App Tổng tự gắn biểu tượng theo loại. */
function boBieuTuongDau(s: string): string {
  return s.replace(/^(?:⚠️|⚠|🔴|❗|‼️)\s*/u, "");
}

interface DauVaoNoiDung {
  loai: LoaiTinAppTong;
  headline: string;
  code?: string;
  excerpt?: string;
  subline?: string;
  /** Dòng thêm cho thân tin (vd lời nhắn). */
  them?: string;
  link: string;
}

/** Dựng đủ trường + giới hạn độ dài (title ≤200, body ≤500, headline/subline/excerpt ≤200, code ≤40, push.title ≤120, push.body ≤240, actionTitle ≤30). */
export function dungNoiDung(v: DauVaoNoiDung): NoiDungTin {
  const headline = chu(boSoTien(lamSach(v.headline)), 200);
  const code = v.code ? chu(v.code, 40) : "";
  const excerpt = v.excerpt ? chu(boSoTien(lamSach(v.excerpt)), 200) : "";
  const subline = v.subline ? chu(boSoTien(lamSach(v.subline)), 200) : "";
  const them = v.them ? lamSach(boSoTien(lamSach(v.them))) : "";
  const dongPhu = subline || [code, excerpt].filter(Boolean).join(" · ");
  const bt = BIEU_TUONG[v.loai];
  const meta: NoiDungTin["meta"] = { v: 1, kind: v.loai, headline };
  if (subline) meta.subline = subline;
  if (excerpt) meta.excerpt = excerpt;
  if (code) meta.code = code;
  const body = [dongPhu, them].filter(Boolean).join(" — ");
  return {
    /* Không biểu tượng ở title/headline — App Tổng tự gắn biểu tượng theo `kind`; chỉ push.title có. */
    title: catAnToan(headline, 200),
    body: catAnToan(body || headline, 500),
    link: v.link,
    meta,
    push: {
      title: catAnToan(`${bt} ${headline}`, 120),
      body: catAnToan(body || headline, 240),
      actionTitle: "Mở Thu mua",
    },
  };
}

const linkHoSo = (prId: string) => `${DIA_CHI_APP}/de-nghi/${encodeURIComponent(prId)}`;
const linkDon = (poId: string) => `${DIA_CHI_APP}/don-hang/${encodeURIComponent(poId)}`;

/**
 * Nội dung cho một tin chuông. `tenNguoiGui` = người vừa thao tác (máy chủ tra theo phiên), có thể trống.
 */
export function noiDungChoTin(
  t: ThongBaoChuyenBuoc,
  loai: Exclude<LoaiTinAppTong, "kho_da_nhan">,
  tenNguoiGui?: string,
): NoiDungTin {
  const code = t.prCode;
  const tieuDe = t.tieuDe;
  const loiNhan = lamSach(t.loiNhan);
  switch (loai) {
    case "giao_viec": {
      const n = typeof t.soDongViec === "number" && t.soDongViec > 0 ? t.soDongViec : 1;
      return dungNoiDung({
        loai,
        headline: `Bạn được giao ${n} dòng vật tư`,
        code,
        excerpt: tieuDe,
        them: loiNhan ? `“${loiNhan}”` : undefined,
        link: linkHoSo(t.prId),
      });
    }
    case "de_nghi_moi":
      return dungNoiDung({ loai, headline: "Đề nghị đã duyệt xong cần phân bổ", code, excerpt: tieuDe, link: linkHoSo(t.prId) });
    case "cho_duyet_bao_gia":
      return dungNoiDung({
        loai,
        headline: "Chờ bạn duyệt báo giá",
        code,
        excerpt: tieuDe,
        subline: tenNguoiGui ? `${code} · ${tenNguoiGui} gửi` : undefined,
        link: linkHoSo(t.prId),
      });
    case "chuyen_tiep":
      return dungNoiDung({
        loai,
        headline: loiNhan ? `Trưởng BP chuyển tiếp: “${loiNhan}”` : "Trưởng BP chuyển tiếp hồ sơ cho bạn",
        code,
        excerpt: tieuDe,
        link: linkHoSo(t.prId),
      });
    case "canh_bao":
      /* Tin cảnh báo mang id/mã CỦA PO (`laCanhBaoTreo`) → mở `/don-hang/{id}`. */
      return dungNoiDung({ loai, headline: boBieuTuongDau(lamSach(tieuDe)), code, link: linkDon(t.prId) });
  }
}

/** Nội dung "Kho đã nhận hàng". */
export function noiDungKhoNhan(v: {
  poId: string;
  poCode: string;
  tenCongTrinh?: string;
  lanGiaoThu: number;
  daNhanDu: boolean;
}): NoiDungTin {
  const kho = lamSach(v.tenCongTrinh) ? `Kho ${lamSach(v.tenCongTrinh)}` : "Kho công trình";
  return dungNoiDung({
    loai: "kho_da_nhan",
    headline: `${kho} đã nhận ${v.daNhanDu ? "đủ hàng" : "hàng"} PO ${lamSach(v.poCode)}`,
    code: v.poCode,
    subline: `${lamSach(v.poCode)} · lần giao ${v.lanGiaoThu}`,
    link: linkDon(v.poId),
  });
}

// ------------------------------------------------------------
// NGƯỜI NHẬN — nhãn vai trò / tên → mã người (uid App Tổng)
// ------------------------------------------------------------

export type QuyenNhanTin = Pick<Quyen, KhoaXemBuoc | "xemDuocApp" | "phanBoCongViec">;

export interface NguoiTrongDanhBa {
  /** Mã Firebase = uid App Tổng (mã tài liệu `nguoi-dung/{uid}`). Đây là mã gửi sang App Tổng. */
  firebaseUid: string;
  /** Mã nghiệp vụ (`uidNghiepVu`) — mã ghi trên dòng vật tư / đơn hàng (`nguoiPhuTrachUid`). */
  uidNghiepVu: string;
  ten: string;
  /** Quyền HIỆU LỰC (chức danh + mẫu + quyền riêng). */
  quyen: QuyenNhanTin;
  /** Ban Giám đốc (`vaiTro === "director"`) hoặc owner App Tổng. */
  laBanLanhDao: boolean;
}

export const chuanTen = (s: string) => s.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");

export interface NguCanhNguoiNhan {
  danhBa: readonly NguoiTrongDanhBa[];
  /** Người vừa thao tác (mã Firebase) — không tự báo cho chính mình. */
  actorUid?: string | null;
  /** Gợi ý tên → mã nghiệp vụ lấy từ dữ liệu (dòng vật tư, đơn hàng) — ưu tiên hơn so tên trong danh bạ. */
  goiYTen?: ReadonlyMap<string, ReadonlySet<string>>;
  /** Mã nghiệp vụ thêm (vd người phụ trách PO trong tin cảnh báo). */
  uidNghiepVuThem?: readonly string[];
  /** Người này có được xem tin không (luật chuông + ô tick Xem bước quy trình). */
  duocXem: (q: QuyenNhanTin) => boolean;
  /** Ghi lý do bỏ qua (tên trùng, không tìm thấy…). */
  ghiLog?: (s: string) => void;
}

/** Mã nghiệp vụ → người trong danh bạ. Trùng nhiều người → `null` (không đoán). */
function theoUidNghiepVu(danhBa: readonly NguoiTrongDanhBa[], uid: string): NguoiTrongDanhBa | null | "trung" {
  const ds = danhBa.filter((n) => n.uidNghiepVu === uid);
  if (ds.length === 1) return ds[0];
  if (ds.length > 1) {
    const dungMa = ds.filter((n) => n.firebaseUid === uid);
    return dungMa.length === 1 ? dungMa[0] : "trung";
  }
  const theoMaFirebase = danhBa.filter((n) => n.firebaseUid === uid);
  return theoMaFirebase.length === 1 ? theoMaFirebase[0] : null;
}

/**
 * Giải danh sách `guiToi` (tên người / nhãn vai trò) ra mã người nhận App Tổng.
 *
 * · "Trưởng bộ phận Thu mua" / "Chưa phân bổ người phụ trách" → mọi người có `phanBoCongViec` (cùng luật chuông).
 * · "Ban lãnh đạo" → Ban Giám đốc + owner.
 * · Tên người → ưu tiên mã trên dữ liệu (`goiYTen`), không có mới so tên trong danh bạ. Tên ra NHIỀU
 *   người → BỎ QUA + ghi log (thà không báo còn hơn báo nhầm người).
 * Sau đó lọc: còn vào được app + được xem tin (`duocXem`) + không phải chính người thao tác.
 */
export function giaiNguoiNhan(guiToi: readonly string[], ctx: NguCanhNguoiNhan): string[] {
  const chon = new Map<string, NguoiTrongDanhBa>();
  const log = ctx.ghiLog ?? (() => {});
  const them = (n: NguoiTrongDanhBa) => chon.set(n.firebaseUid, n);

  const theoMa = (uid: string, nguon: string) => {
    const n = theoUidNghiepVu(ctx.danhBa, uid);
    if (n === "trung") log(`bỏ qua ${nguon}: mã ${uid} khớp nhiều hồ sơ`);
    else if (n) them(n);
    else log(`bỏ qua ${nguon}: mã ${uid} không có trong danh bạ Thu mua`);
  };

  for (const g of guiToi) {
    if (typeof g !== "string" || !g.trim()) continue;
    if (g === NHAN_TBP || g === NHAN_CHUA_PB) {
      for (const n of ctx.danhBa) if (n.quyen.phanBoCongViec) them(n);
      continue;
    }
    if (g === NHAN_BLD) {
      for (const n of ctx.danhBa) if (n.laBanLanhDao) them(n);
      continue;
    }
    const k = chuanTen(g);
    const goiY = ctx.goiYTen?.get(k);
    if (goiY && goiY.size === 1) {
      theoMa([...goiY][0], `tên "${g}"`);
      continue;
    }
    if (goiY && goiY.size > 1) {
      log(`bỏ qua tên "${g}": dữ liệu ghi ${goiY.size} mã khác nhau cho cùng tên`);
      continue;
    }
    const trungTen = ctx.danhBa.filter((n) => chuanTen(n.ten) === k);
    if (trungTen.length === 1) them(trungTen[0]);
    else if (trungTen.length > 1) log(`bỏ qua tên "${g}": ${trungTen.length} người trùng tên`);
    else log(`bỏ qua tên "${g}": không tìm thấy trong danh bạ Thu mua`);
  }
  for (const uid of ctx.uidNghiepVuThem ?? []) if (uid) theoMa(uid, "người phụ trách");

  return [...chon.values()]
    .filter((n) => n.quyen.xemDuocApp && ctx.duocXem(n.quyen))
    .filter((n) => !ctx.actorUid || n.firebaseUid !== ctx.actorUid)
    .map((n) => n.firebaseUid);
}

/** Tên → mã nghiệp vụ theo các dòng vật tư của hồ sơ (người phụ trách từng dòng). */
export function goiYTenTuHoSo(...dsHoSo: (Pick<DeNghiMuaHang, "items"> | undefined)[]): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const dn of dsHoSo) {
    for (const d of dn?.items ?? []) {
      if (!d.nguoiPhuTrachTen || !d.nguoiPhuTrachUid) continue;
      const k = chuanTen(d.nguoiPhuTrachTen);
      const s = m.get(k) ?? new Set<string>();
      s.add(d.nguoiPhuTrachUid);
      m.set(k, s);
    }
  }
  return m;
}

/** Tên → mã nghiệp vụ theo người phụ trách đơn hàng. */
export function goiYTenTuDon(po: Pick<DonDatHang, "nguoiPhuTrachTen" | "nguoiPhuTrachUid"> | undefined): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  if (po?.nguoiPhuTrachTen && po.nguoiPhuTrachUid) m.set(chuanTen(po.nguoiPhuTrachTen), new Set([po.nguoiPhuTrachUid]));
  return m;
}

/**
 * Luật "được xem tin" theo loại — BÁM ĐÚNG CHUÔNG TRONG APP (`nut-thong-bao.tsx`):
 *   · giao_viec, canh_bao: chuông luôn giữ (tin giao việc cho chính mình / cảnh báo PO) → chỉ cần vào được app.
 *   · de_nghi_moi, cho_duyet_bao_gia, chuyen_tiep: được tick bước mà tin nói tới (`denBuoc`) VÀ mở được
 *     hồ sơ ở bước nó đang đứng (`hoSoDuocXemTheoBuoc` = `duocXemHoSo`).
 *   · kho_da_nhan: xem được đơn hàng (`poDuocXemTheoBuoc` — PO có hồ sơ theo hồ sơ; PO độc lập theo ô ④).
 */
export function luatDuocXem(
  loai: LoaiTinAppTong,
  v: { denBuoc?: string; giaiDoanHoSo?: GiaiDoanMuaHang; poPrId?: string | null; giaiDoanCua?: (prId: string) => GiaiDoanMuaHang | undefined },
): (q: QuyenNhanTin) => boolean {
  if (loai === "giao_viec" || loai === "canh_bao") return (q) => q.xemDuocApp;
  if (loai === "kho_da_nhan") {
    return (q) => poDuocXemTheoBuoc(q, v.poPrId, (prId) => hoSoDuocXemTheoBuoc(q, v.giaiDoanCua?.(prId)));
  }
  return (q) => duocXemBuoc(q, v.denBuoc ?? "") && hoSoDuocXemTheoBuoc(q, v.giaiDoanHoSo);
}

// ------------------------------------------------------------
// GÓI GỬI APP TỔNG
// ------------------------------------------------------------

export interface GoiGuiAppTong {
  appId: typeof APP_ID;
  eventId: string;
  recipients: string[];
  title: string;
  body: string;
  link: string;
  meta: NoiDungTin["meta"];
  push: NoiDungTin["push"];
}

export function dungGoiGui(eventId: string, recipients: readonly string[], nd: NoiDungTin): GoiGuiAppTong {
  return {
    appId: APP_ID,
    eventId,
    recipients: [...new Set(recipients)],
    title: nd.title,
    body: nd.body,
    link: nd.link,
    meta: nd.meta,
    push: nd.push,
  };
}

/** Tối đa người nhận mỗi lần gọi App Tổng. */
export const TOI_DA_NGUOI_NHAN_MOI_GOI = 200;

/**
 * Chia người nhận thành nhiều gói ≤ 200. Một gói → giữ nguyên `eventId`; nhiều gói → `eventId:c<i>` (ổn
 * định theo thứ tự người nhận đã sắp, để gửi lại vẫn trùng mã — App Tổng chống trùng từng gói).
 */
export function chiaGoiGui(eventId: string, recipients: readonly string[], nd: NoiDungTin): GoiGuiAppTong[] {
  const ds = [...new Set(recipients)].sort();
  if (ds.length <= TOI_DA_NGUOI_NHAN_MOI_GOI) return [dungGoiGui(eventId, ds, nd)];
  const ra: GoiGuiAppTong[] = [];
  for (let i = 0; i * TOI_DA_NGUOI_NHAN_MOI_GOI < ds.length; i += 1) {
    ra.push(dungGoiGui(`${eventId}:c${i}`, ds.slice(i * TOI_DA_NGUOI_NHAN_MOI_GOI, (i + 1) * TOI_DA_NGUOI_NHAN_MOI_GOI), nd));
  }
  return ra;
}

/**
 * Chạy `viec` cho từng phần tử, tối đa `soLuong` việc cùng lúc, dừng NHẬN việc mới khi quá `hanMs`
 * (việc đang chạy để tự kết thúc theo hẹn giờ riêng). Không ném lỗi — lỗi từng việc bị nuốt.
 * Trả số việc đã bắt đầu.
 */
export async function chaySongSong<T>(
  ds: readonly T[],
  soLuong: number,
  viec: (x: T) => Promise<unknown>,
  hanMs: number,
): Promise<number> {
  const batDau = Date.now();
  let i = 0;
  let daBatDau = 0;
  const luong = async () => {
    while (i < ds.length) {
      if (Date.now() - batDau > hanMs) return;
      const x = ds[i++];
      daBatDau += 1;
      try {
        await viec(x);
      } catch {
        /* nuốt */
      }
    }
  };
  let henGio: ReturnType<typeof setTimeout> | undefined;
  const het = new Promise<void>((r) => {
    henGio = setTimeout(r, hanMs);
  });
  await Promise.race([Promise.all(Array.from({ length: Math.max(1, soLuong) }, luong)), het]);
  clearTimeout(henGio);
  return daBatDau;
}

/** Nên thử lại một lần không: lỗi mạng, 5xx, 429. Không thử lại 4xx khác. */
export function nenThuLai(kq: { ok: boolean; status?: number; loiMang?: boolean }): boolean {
  if (kq.ok) return false;
  if (kq.loiMang) return true;
  return kq.status === 429 || (typeof kq.status === "number" && kq.status >= 500);
}

/** Khoá cổng App Tổng có dùng được không — ngắn hơn 24 ký tự coi như TẮT (khoá thử / gõ nhầm). */
export const DO_DAI_KHOA_TOI_THIEU = 24;
export function khoaHopLe(k: string | undefined): boolean {
  return (k ?? "").trim().length >= DO_DAI_KHOA_TOI_THIEU;
}

/**
 * Chặn gọi lại nhanh trong CÙNG một máy chủ (bộ nhớ ngắn hạn, mất khi máy chủ khởi động lại — App Tổng mới
 * là chốt chống trùng thật theo `eventId`).
 */
export class BoNhoDaGui {
  private m = new Map<string, number>();
  constructor(
    private readonly toiDa = 500,
    private readonly hanMs = 10 * 60_000,
  ) {}
  /** `true` nếu CHƯA gửi gần đây (và ghi nhận luôn); `false` nếu vừa gửi rồi. */
  danhDau(k: string, bayGio = Date.now()): boolean {
    const luc = this.m.get(k);
    if (luc !== undefined && bayGio - luc < this.hanMs) return false;
    this.m.delete(k);
    this.m.set(k, bayGio);
    while (this.m.size > this.toiDa) {
      const dau = this.m.keys().next().value;
      if (dau === undefined) break;
      this.m.delete(dau);
    }
    return true;
  }
  /** Gỡ dấu (gửi hỏng → cho lần sau thử lại). */
  bo(k: string): void {
    this.m.delete(k);
  }
}

/** Giới hạn tần suất gọi theo người: tối đa `soLan` lần trong `cuaSoMs`. */
export class GioiHanTanSuat {
  private m = new Map<string, number[]>();
  constructor(
    private readonly soLan = 30,
    private readonly cuaSoMs = 60_000,
  ) {}
  choPhep(k: string, bayGio = Date.now()): boolean {
    const ds = (this.m.get(k) ?? []).filter((t) => bayGio - t < this.cuaSoMs);
    if (ds.length >= this.soLan) {
      this.m.set(k, ds);
      return false;
    }
    ds.push(bayGio);
    this.m.set(k, ds);
    if (this.m.size > 2000) {
      for (const [kk, v] of this.m) if (v.every((t) => bayGio - t >= this.cuaSoMs)) this.m.delete(kk);
    }
    return true;
  }
}

/** Đọc thân `{ ids: string[] }` từ trình duyệt — chỉ giữ mã hợp lệ, bỏ trùng, tối đa 20. `null` = sai khuôn. */
export function docMaTin(than: unknown): string[] | null {
  if (!than || typeof than !== "object" || Array.isArray(than)) return null;
  const ids = (than as { ids?: unknown }).ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > TOI_DA_MA_MOI_LAN) return null;
  const ra = [...new Set(ids.filter((x): x is string => typeof x === "string" && MA_TIN_HOP_LE.test(x)))];
  return ra.length > 0 ? ra : null;
}

/** Tin còn đủ mới để gửi không (chặn gửi lại tin cũ). */
export function tinConMoi(thoiDiem: string | undefined, bayGio = Date.now()): boolean {
  const t = Date.parse(String(thoiDiem ?? ""));
  if (!Number.isFinite(t)) return false;
  return bayGio - t <= TUOI_TOI_DA_TIN_MS && t - bayGio <= LECH_TOI_TRUOC_MS;
}

// ------------------------------------------------------------
// HÀNG CHỜ PHÍA TRÌNH DUYỆT — mã tin máy này vừa sinh, chờ báo App Tổng (`kho-du-lieu.tsx` dùng)
// ------------------------------------------------------------

/** `lanGui` = số lần đã gửi mã này cho máy chủ. Tối đa 2 (gửi đầu + gửi lại một lần nếu máy chủ chưa thấy). */
export type HangChoTin = Map<string, { luc: number; lanGui: number }>;
export const HAN_CHO_TIN_MS = 10 * 60_000;
const SO_LAN_GUI_TOI_DA = 2;

/** Đánh dấu tin máy này vừa sinh — chỉ loại có trong bảng đã duyệt; mã đã có thì giữ nguyên. */
export function themVaoHangCho(cho: HangChoTin, ds: readonly TinDePhanLoai[], bayGio = Date.now()): void {
  for (const t of ds) if (phanLoaiTin(t) !== null && !cho.has(t.id)) cho.set(t.id, { luc: bayGio, lanGui: 0 });
}

/**
 * Sau một lần lưu THÀNH CÔNG: lấy các mã có trong bản vừa ghi (`daLen`) mà chưa gửi đủ lượt; tăng lượt.
 * Mã quá hạn 10 phút bị bỏ.
 */
export function layMaCanGui(cho: HangChoTin, daLen: ReadonlySet<string>, bayGio = Date.now()): string[] {
  const ra: string[] = [];
  for (const [id, v] of cho) {
    if (bayGio - v.luc > HAN_CHO_TIN_MS || v.lanGui >= SO_LAN_GUI_TOI_DA) {
      cho.delete(id);
      continue;
    }
    if (daLen.has(id)) {
      v.lanGui += 1;
      ra.push(id);
    }
  }
  return ra;
}

/**
 * Máy chủ trả lời: mã đã thấy → xong; mã chưa thấy → giữ để gửi lại MỘT lần (nếu còn lượt).
 * `thay = null` (lỗi / không biết) → bỏ hết, không gửi lại.
 */
export function capNhatSauKhiGui(cho: HangChoTin, daGui: readonly string[], thay: ReadonlySet<string> | null): void {
  for (const id of daGui) {
    const v = cho.get(id);
    if (!v) continue;
    if (thay === null || thay.has(id) || v.lanGui >= SO_LAN_GUI_TOI_DA) cho.delete(id);
  }
}
