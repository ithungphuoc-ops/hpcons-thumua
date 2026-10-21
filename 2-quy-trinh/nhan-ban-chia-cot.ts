// ============================================================
// NHÂN BẢN CHIA CỘT — Sếp duyệt 19–20/10/2026 (demo "Nhân bản + giao việc", bản 14).
//
// Popup chép đủ mặt hàng, mỗi CỘT là một phiếu: "Phiếu này" (giữ phần còn lại) + "Bản mới 1..N".
//   · Dòng có số lượng: nhập phần lấy sang từng bản mới — TRỪ khỏi phiếu này (y luật 26/09).
//   · Dòng theo file (1 lô, file 10–20 món): tick cột nào làm + ghi "phần việc" — CHIA CHUNG, không
//     trừ phiếu này (`DongDeNghi.chiaPhanViec`).
//   · Bước ① (Trưởng bộ phận giao việc): chọn người cho từng cột → nhân bản xong là giao luôn.
//   · Bước ② (người được giao tách tiếp phần của mình): nút "Nhân bản" (bản mới vẫn của mình),
//     "Mua hàng" (giao bản mới cho bạn khác), "Xuất kho" → XK VPP (NV Nhân sự) / XK Kho Tổng
//     (NV Kho tổng) — bản mới bỏ qua báo giá, sang thẳng Lập đơn.
//
// 📌 HÀM THUẦN, ĐƯỢC CẢ HOẶC KHÔNG ĐƯỢC GÌ: gọi lần lượt `apDungNhanBanDeNghi` cho từng bản mới rồi
// `apDungGiaoViec` cho phần cần giao — trên CÙNG một mảng, cột nào lỗi là trả lỗi, không ghi gì.
// Tầng ghi (`nhanBanChiaCot` ở kho-du-lieu.tsx) gọi trong `setDeNghi((truoc) => …)`; bộ kiểm luật
// gọi thật được (§3.4b).
//
// ⚠️ TỆP RIÊNG, KHÔNG NHÉT VÀO `nhan-ban-de-nghi.ts`: `tach-khi-giao-viec.ts` đã import tệp đó,
// gọi ngược `apDungGiaoViec` từ đó là vòng import.
// ============================================================

import type { BaoGia, DeNghiMuaHang, DonDatHang, LoaiViecGiao, NgayISO } from "@/3-du-lieu/kieu-du-lieu";
import {
  apDungNhanBanDeNghi,
  dongDaChuyenDiHet,
  dongDaNhanBanSang,
  hauDueCua,
  phieuGocCua,
  type DongChonNhanBan,
} from "@/2-quy-trinh/nhan-ban-de-nghi";
import { apDungGiaoViec, type ThongTinGiaoViec } from "@/2-quy-trinh/tach-khi-giao-viec";

/** Người nhận phần việc của một cột. */
export interface NguoiNhanNhanBan {
  uid: string;
  ten: string;
  /** Người kho / nhân sự → `xuat_kho` / `nhan_su` (bỏ qua báo giá). Trống = mua hàng. */
  loaiViecGiao?: LoaiViecGiao;
}

/** Một cột "Bản mới" của popup. */
export interface CotNhanBan {
  chon: DongChonNhanBan[];
  /** Có = giao luôn bản mới cho người này. Trống = giữ người phụ trách theo luật nhân bản cũ. */
  giaoCho?: NguoiNhanNhanBan;
}

export interface ThamSoNhanBanChiaCot {
  prId: string;
  /** Người bấm. */
  nguoi: { uid: string; ten: string };
  /** Người bấm có quyền phân bổ (Trưởng bộ phận). */
  laNguoiPhanBo: boolean;
  cot: CotNhanBan[];
  /** Cột "Phiếu này": phần việc giữ lại của dòng theo file + (bước ①) người làm phần còn lại. */
  giuLai?: { phanViec?: Readonly<Record<number, string>>; giaoCho?: NguoiNhanNhanBan };
  /** Id cấp sẵn cho từng bản mới — cùng thứ tự với `cot`. */
  idMoi: string[];
  ngay: NgayISO;
  thoiDiem: NgayISO;
  baoGia: readonly Pick<BaoGia, "prId" | "trangThai" | "items">[];
  donHang: readonly Pick<DonDatHang, "prId" | "trangThai" | "items">[];
}

/** Số báo giá mặc định khi giao qua popup nhân bản — mức chung của công ty (Sếp 19/10/2026 chấp nhận). */
export const SO_BAO_GIA_MAC_DINH_NHAN_BAN = 2;

export type KetQuaNhanBanChiaCot =
  | { loi: string }
  | {
      loi?: undefined;
      deNghi: DeNghiMuaHang[];
      /** Các bản mới theo đúng thứ tự cột. */
      cacBan: DeNghiMuaHang[];
      /** Ai được giao gì — để tầng ghi gửi thông báo việc mới đúng người, đúng phiếu. */
      daGiao: { prId: string; uid: string; ten: string; soDong: number }[];
    };

function thongTinGiao(t: ThamSoNhanBanChiaCot, g: NguoiNhanNhanBan): ThongTinGiaoViec {
  return {
    uid: g.uid,
    ten: g.ten,
    nguoiGiaoTen: t.nguoi.ten,
    thoiDiem: t.thoiDiem,
    ngay: t.ngay,
    /* Người kho / nhân sự không đi hỏi giá → không đặt số báo giá (y hộp giao việc khi chọn Xuất kho). */
    soBaoGia: g.loaiViecGiao ? undefined : SO_BAO_GIA_MAC_DINH_NHAN_BAN,
    loaiViecGiao: g.loaiViecGiao,
    /* Không gộp phiếu con cũ của người nhận — mỗi lần chia cột là các phiếu riêng, người chia nhìn thấy. */
    gopConCu: false,
  };
}

/**
 * Giao TOÀN BỘ dòng còn làm của một phiếu cho `g`. Bỏ qua (không lỗi) khi mọi dòng đã đúng người
 * + đúng loại việc — `apDungGiaoViec` coi đó là "giao trùng" và từ chối.
 */
function giaoCaPhieu(
  ds: DeNghiMuaHang[],
  prId: string,
  stt: number[],
  t: ThamSoNhanBanChiaCot,
  g: NguoiNhanNhanBan,
): { loi: string } | { loi?: undefined; deNghi: DeNghiMuaHang[]; daGiao: boolean } {
  const p = ds.find((d) => d.id === prId);
  if (!p) return { loi: "Không tìm thấy phiếu vừa tạo." };
  const dong = p.items.filter((d) => stt.includes(d.stt));
  if (dong.length === 0) return { deNghi: ds, daGiao: false };
  const trung = dong.every((d) => d.nguoiPhuTrachUid === g.uid && d.loaiViecGiao === g.loaiViecGiao);
  if (trung) return { deNghi: ds, daGiao: false };
  /* Dòng đang của người khác (nhân viên tách phần của mình rồi "Mua hàng" giao bạn khác): rút người
     cũ khỏi dòng TRÊN BẢN MỚI rồi giao — bản mới vừa sinh, chưa chứng từ, chưa ai làm gì trên nó. */
  const sach = ds.map((d) =>
    d.id !== prId
      ? d
      : {
          ...d,
          items: d.items.map((x) =>
            stt.includes(x.stt) && x.nguoiPhuTrachUid && x.nguoiPhuTrachUid !== g.uid
              ? { ...x, nguoiPhuTrachUid: undefined, nguoiPhuTrachTen: undefined, nguoiPhanBoTen: undefined, thoiDiemPhanBo: undefined }
              : x,
          ),
        },
  );
  const kq = apDungGiaoViec(sach, prId, stt, thongTinGiao(t, g));
  if (kq.loi !== undefined) return { loi: kq.loi };
  return { deNghi: kq.deNghi, daGiao: true };
}

/**
 * ★★★ NHÂN BẢN NHIỀU BẢN + GIAO LUÔN — Sếp 20/10/2026. Xem đầu tệp.
 *
 * Chặn (ngoài mọi chốt của `apDungNhanBanDeNghi` cho TỪNG bản): không có bản mới nào · số id không
 * khớp số cột · bản mới không có dòng nào.
 */
export function apDungNhanBanChiaCot(
  tatCa: readonly DeNghiMuaHang[],
  t: ThamSoNhanBanChiaCot,
): KetQuaNhanBanChiaCot {
  if (t.cot.length === 0) return { loi: "Chưa có bản mới nào — bấm \"+ Thêm bản\" để chia." };
  if (t.idMoi.length !== t.cot.length) return { loi: "Lỗi cấp mã bản mới — tải lại trang rồi thử lại." };

  let ds = [...tatCa] as DeNghiMuaHang[];
  const cacBan: DeNghiMuaHang[] = [];
  const daGiao: { prId: string; uid: string; ten: string; soDong: number }[] = [];

  for (let i = 0; i < t.cot.length; i++) {
    const cot = t.cot[i];
    if (cot.chon.length === 0) return { loi: `Bản mới ${i + 1} chưa có mặt hàng nào.` };
    const kq = apDungNhanBanDeNghi(ds, {
      prId: t.prId,
      nguoi: t.nguoi,
      laNguoiPhanBo: t.laNguoiPhanBo,
      chon: cot.chon,
      idMoi: t.idMoi[i],
      ngay: t.ngay,
      thoiDiem: t.thoiDiem,
      baoGia: t.baoGia,
      donHang: t.donHang,
    });
    if (kq.loi !== undefined) return { loi: t.cot.length > 1 ? `Bản mới ${i + 1}: ${kq.loi}` : kq.loi };
    ds = kq.deNghi;
    if (cot.giaoCho) {
      const sttBan = kq.ban.items.map((d) => d.stt);
      const g = giaoCaPhieu(ds, kq.ban.id, sttBan, t, cot.giaoCho);
      if (g.loi !== undefined) return { loi: `Bản mới ${i + 1}: ${g.loi}` };
      ds = g.deNghi;
      if (g.daGiao) daGiao.push({ prId: kq.ban.id, uid: cot.giaoCho.uid, ten: cot.giaoCho.ten, soDong: sttBan.length });
    }
    cacBan.push(ds.find((d) => d.id === kq.ban.id) ?? kq.ban);
  }

  /* Cột "Phiếu này": phần việc giữ lại của dòng theo file. */
  const pv = t.giuLai?.phanViec;
  if (pv && Object.keys(pv).length > 0) {
    ds = ds.map((d) =>
      d.id !== t.prId
        ? d
        : {
            ...d,
            items: d.items.map((x) => {
              const v = pv[x.stt];
              return v === undefined ? x : { ...x, phanViec: v.trim() || undefined };
            }),
          },
    );
  }

  /* Bước ①: người làm phần còn lại của phiếu này — giao các dòng CHƯA AI NHẬN mà phiếu còn làm. */
  if (t.giuLai?.giaoCho) {
    const p = ds.find((d) => d.id === t.prId);
    if (!p) return { loi: "Không tìm thấy đề nghị." };
    const daChuyen = dongDaNhanBanSang(p, ds);
    const stt = p.items.filter((d) => !d.nguoiPhuTrachUid && !dongDaChuyenDiHet(d.stt, daChuyen)).map((d) => d.stt);
    if (stt.length > 0) {
      const kq = apDungGiaoViec(ds, t.prId, stt, thongTinGiao(t, t.giuLai.giaoCho));
      if (kq.loi !== undefined) return { loi: `Phiếu này: ${kq.loi}` };
      ds = kq.deNghi;
      daGiao.push({ prId: kq.idDich, uid: t.giuLai.giaoCho.uid, ten: t.giuLai.giaoCho.ten, soDong: stt.length });
    }
  }

  return { deNghi: ds, cacBan, daGiao };
}

/**
 * Dòng "theo file đính kèm" (1 lô, file liệt kê nhiều món) — hộp chia cột mặc định chia theo PHẦN
 * VIỆC (tick + ghi mục) thay vì theo số lượng. Chỉ là MẶC ĐỊNH: người chia đổi cách chia được.
 */
export function laDongTheoFile(
  d: { tenVatLieu?: string; quyCach?: string; donViTinh?: string; khoiLuongDeNghi?: number },
): boolean {
  const chu = `${d.tenVatLieu ?? ""} ${d.quyCach ?? ""}`.toLowerCase();
  if (/theo file|đính kèm|dinh kem|\bfile\b/.test(chu)) return true;
  return (d.donViTinh ?? "").trim().toLowerCase() === "lô" && Number(d.khoiLuongDeNghi) === 1;
}

/** Một phiếu đang giữ (một phần) một dòng của đề nghị gốc — cho khung "Đã tách". */
export interface PhieuGiuDong {
  prId: string;
  code: string;
  /** Khối lượng phiếu đó còn làm của dòng (dòng chia chung: khối lượng dòng). */
  khoiLuong: number;
  donViTinh: string;
  phanViec?: string;
  nguoiPhuTrachTen?: string;
  laPhieuGoc: boolean;
}

/** Lần ngược một dòng về dòng ở PHIẾU GỐC ĐẦU TIÊN qua `deNghiChaId` + `sttDongCha`. */
function dongGocCua(
  p: DeNghiMuaHang,
  stt: number,
  tatCa: readonly DeNghiMuaHang[],
): { phieu: DeNghiMuaHang; stt: number } {
  let phieu = p;
  let s = stt;
  for (let i = 0; i < 50 && phieu.deNghiChaId; i++) {
    const d = phieu.items.find((x) => x.stt === s);
    const cha = tatCa.find((x) => x.id === phieu.deNghiChaId);
    if (!d || typeof d.sttDongCha !== "number" || !cha) break;
    phieu = cha;
    s = d.sttDongCha;
  }
  return { phieu, stt: s };
}

/**
 * ★ KHUNG "ĐÃ TÁCH" của một dòng — Sếp 19/10/2026: *"lúc bấm nhân bản phải hiện ra số lượng đã được
 * tách luôn để nhìn vào là biết liền"*. Liệt kê MỌI phiếu trong cả nhóm (gốc + mọi bản) còn làm dòng
 * này: khối lượng còn lại (hoặc phần việc với dòng theo file) + người phụ trách.
 *
 * Trả mảng rỗng khi dòng chưa bị tách lần nào (chỉ một phiếu giữ) — nơi gọi không vẽ khung.
 */
export function cacPhieuGiuDong(
  p: DeNghiMuaHang,
  stt: number,
  tatCa: readonly DeNghiMuaHang[],
): PhieuGiuDong[] {
  const goc = dongGocCua(p, stt, tatCa);
  const nhom = [phieuGocCua(goc.phieu, tatCa as DeNghiMuaHang[])];
  nhom.push(...hauDueCua(nhom[0].id, tatCa as DeNghiMuaHang[]));
  const ra: PhieuGiuDong[] = [];
  for (const ph of nhom) {
    const daChuyen = dongDaNhanBanSang(ph, tatCa as DeNghiMuaHang[]);
    for (const d of ph.items) {
      const ve = dongGocCua(ph, d.stt, tatCa);
      if (ve.phieu.id !== goc.phieu.id || ve.stt !== goc.stt) continue;
      if (dongDaChuyenDiHet(d.stt, daChuyen)) continue;
      const kl = daChuyen.khoiLuong?.get(d.stt);
      ra.push({
        prId: ph.id,
        code: ph.code,
        khoiLuong: kl ? kl.conLai : Number(d.khoiLuongDeNghi) || 0,
        donViTinh: d.donViTinh,
        phanViec: d.phanViec,
        nguoiPhuTrachTen: d.nguoiPhuTrachTen,
        laPhieuGoc: ph.id === goc.phieu.id,
      });
    }
  }
  return ra.length > 1 ? ra : [];
}
