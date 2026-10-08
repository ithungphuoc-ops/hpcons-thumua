// ============================================================
// PHÉP TÍNH LƯU PHÂN QUYỀN — MỘT PHÉP TÍNH CHO CẢ MÁY CHỦ LẪN KHO DEMO
//
// 🔴 Sếp 06/10/2026 (mẫu chức danh sửa được · Câu 1 = A · Câu 2 = B · Câu 3 = A). Route
// `app/api/quyen-rieng` / `app/api/quyen-mau-chuc-danh` (đọc + ghi Firestore trong giao dịch) và kho demo
// ở chế độ tài khoản mẫu (localStorage) cùng gọi ĐÚNG hai hàm dưới đây để quyết định ghi gì, xoá gì,
// chặn vì sao. Hai nơi tự tính là sớm muộn demo nói "được" mà máy chủ nói "không" — Sếp duyệt trên demo
// rồi lên bản thật thấy khác.
//
// 📌 HÀM THUẦN: nhận dữ liệu đã đọc, trả kết quả; KHÔNG đọc/ghi gì, KHÔNG nạp Firebase / React. Thời
// điểm (`luc`) và người lưu do nơi gọi truyền vào — máy chủ lấy từ vé đăng nhập, không tin trình duyệt.
// ============================================================

import {
  ngoaiLeConHieuLuc,
  quyenRiengConHieuLuc,
  tinhQuyenTheoChucDanh,
  type NguoiDung,
  type Quyen,
} from "@/4-phan-quyen/quyen";
import {
  apDungQuyenRieng,
  dauChucDanhCua,
  KHOA_TICK,
  nhanCoTick,
  quyenTheoChucDanhCoMau,
  rutNgoaiLe,
  tinhTruocSauKhiLuu,
  TOI_DA_NGUOI_MOI_LAN,
  type BanGhiQuyenRieng,
  type QuyenRieng,
} from "@/4-phan-quyen/quyen-rieng";
import {
  coQuyenPhanQuyen,
  duocSuaMauChucDanh,
  vuongMacTraoQuyen,
  type DichTraoQuyen,
  type NguoiGoiTraoQuyen,
} from "@/4-phan-quyen/luat-phan-quyen";
import { quyenCuaVaiTro, timVaiTroChuan, VAI_TRO_CHUAN, type MaVaiTroChuan } from "@/4-phan-quyen/vai-tro-chuan";
import {
  canhBaoChiDaoKhiDoiMau,
  canhBaoViecKhongAiLam,
  danhSachLeoQuyenQuaGanChucDanh,
  LY_DO_KHONG_SUA_MAU,
  lyDoKhongSuaOMau,
  oDeCuaHoSo,
  phienBanCuuMauHong,
  quyenCuaVaiTroCoMau,
  type DeMau,
  type MauChucDanh,
  type ThayDoiMau,
} from "@/4-phan-quyen/mau-chuc-danh";

/* Một luật một chỗ: `coQuyenPhanQuyen` / `duocSuaMauChucDanh` sống ở `luat-phan-quyen.ts` (bổ sung đặc tả
   B-F3), export lại ở đây đúng chữ ký đặc tả 2.4 để route và kho demo nạp từ một tệp. */
export { coQuyenPhanQuyen, duocSuaMauChucDanh };

/** `hanhDong` ghi Nhật ký hệ thống — tiền tố chung `phan_quyen_` để trang Nhật ký lọc được. */
export const HANH_DONG_NHAT_KY = {
  tick: "phan_quyen_tick_rieng",
  bo: "phan_quyen_bo_quyen_rieng",
  mau: "phan_quyen_mau_chuc_danh",
  veMacDinh: "phan_quyen_mau_ve_mac_dinh",
} as const;

/** Trần độ dài một dòng nhật ký (đặc tả 2.3). */
const TOI_DA_MO_TA = 1000;

/**
 * Gắn quyền HIỆU LỰC (mẫu chức danh + ngoại lệ) vào hồ sơ — đúng thứ máy chủ trả cho trình duyệt qua
 * `GET /api/quyen-rieng`. Dùng cho NGƯỜI GỌI (để "chỉ trao cờ mình có" và Câu 2 = B tính theo quyền đã
 * gộp mẫu) và cho kho demo.
 */
export function ganQuyenRiengHieuLuc(
  nd: NguoiDung,
  banGhi: BanGhiQuyenRieng | null,
  mau: MauChucDanh,
): NguoiDung {
  return { ...nd, quyenRieng: quyenRiengConHieuLuc(banGhi, nd, oDeCuaHoSo(mau, nd)) };
}

/** Một người nhận trong lần lưu. `uid` cùng lớp danh tính với `NguoiGoiTraoQuyen.uid` (ở route: mã Firebase). */
export interface NguoiNhanLuu {
  uid: string;
  nd: NguoiDung;
  /** Bản ghi đang cất, ĐÃ qua `chuanHoaBanGhiQuyenRieng`. `null` = chưa có. */
  banGhi: BanGhiQuyenRieng | null;
}

export type YeuCauQuyenRieng = { loai: "tick"; thayDoi: QuyenRieng } | { loai: "bo-quyen-rieng" };

export type KetQuaLuuQuyenRieng =
  | {
      ok: true;
      /** Bản ghi KHUÔN 2 cần `set`. */
      ghi: { uid: string; banGhi: BanGhiQuyenRieng }[];
      /** Mã tài liệu cần XOÁ (ngoại lệ rỗng, hoặc "Bỏ quyền riêng"). */
      xoa: string[];
      /** Không đổi gì — không ghi, không xoá (bản khuôn 1 cũ được GIỮ NGUYÊN khuôn). */
      giuNguyen: string[];
      moTaNhatKy: string;
    }
  | { ok: false; status: 400 | 403 | 404 | 409; error: string; maLoi?: "mau-doi" };

export type KetQuaLuuMau =
  | { ok: true; mauMoi: MauChucDanh; soODoi: number; canhBao: string[]; moTaNhatKy: string }
  | { ok: false; status: 400 | 403 | 409; error: string; maLoi?: "mau-doi" };

/** Ghép câu nhật ký, cắt ở `TOI_DA_MO_TA` ký tự kèm "… và N thay đổi khác" (đặc tả 2.3). */
function ghepMoTa(dau: string, muc: readonly string[], cuoi = ""): string {
  const du = `${dau}${muc.join("; ")}${cuoi}`;
  if (du.length <= TOI_DA_MO_TA) return du;
  const lay: string[] = [];
  for (let i = 0; i < muc.length; i++) {
    const conLai = muc.length - (lay.length + 1);
    const thu = `${dau}${[...lay, muc[i]].join("; ")}… và ${conLai} thay đổi khác${cuoi}`;
    if (thu.length > TOI_DA_MO_TA) break;
    lay.push(muc[i]);
  }
  const bo = muc.length - lay.length;
  const ra = `${dau}${lay.join("; ")}… và ${bo} thay đổi khác${cuoi}`;
  return ra.length <= TOI_DA_MO_TA ? ra : `${ra.slice(0, TOI_DA_MO_TA - 1)}…`;
}

const cauMauDoi = (gui: number, dang: number) =>
  `Mẫu quyền theo chức danh vừa được sửa (bản ${gui} → ${dang}). Tải lại trang rồi làm lại — lưu bây giờ có thể trả lại quyền vừa bị bỏ ở mẫu.`;

/**
 * ★ NGOẠI LỆ MỚI SAU MỘT LẦN TICK — bổ sung đặc tả B-F2 (Sếp 06/10/2026, Câu 3 = A: *"chỉ GIỮ ô đã cố ý
 * khác"*). Xem bước 4 ở chú thích `tinhLuuQuyenRieng`.
 *
 * · Dấu KHỚP + bản ghi mới còn "Vào app": ngoại lệ CŨ không bị chạm → GIỮ nguyên giá trị (kể cả khi đang
 *   trùng mẫu hiện tại — Sếp có thể đổi mẫu lại, ngoại lệ phải còn); ô VỪA CHẠM → ngoại lệ khi ≠ `goc`,
 *   bỏ khỏi ngoại lệ khi = `goc`.
 * · Dấu LỆCH / THIẾU (không biết ô nào là "cố ý") hoặc lần lưu tắt "Vào app" (dây chuyền tắt mọi ô) →
 *   luật riêng như đặc tả: `rutNgoaiLe(riengMoi, goc)` — mọi ô khác `goc` thành ngoại lệ.
 * · ★ 07/10/2026: ô bước mà luật 8 / 8b điền cho bản ghi CŨ (không dấu) nằm trong ngoại lệ đang giữ
 *   (`ngoaiLeConHieuLuc`) → lần lưu này GHI HẲN chúng xuống bản khuôn 2 có dấu — xem trước = kết quả.
 */
function ngoaiLeMoiKhiTick(
  banGhi: BanGhiQuyenRieng | null,
  nd: NguoiDung,
  goc: Quyen,
  riengMoi: QuyenRieng,
  thayDoi: QuyenRieng,
): QuyenRieng {
  const cu = banGhi ? ngoaiLeConHieuLuc(banGhi, nd) : { khop: true, ngoaiLe: {} as QuyenRieng };
  if (!cu.khop || riengMoi.xemDuocApp !== true) return rutNgoaiLe(riengMoi, goc);
  const co = (o: QuyenRieng, k: keyof Quyen) => Object.prototype.hasOwnProperty.call(o, k);
  const ra: QuyenRieng = {};
  for (const k of KHOA_TICK) {
    if (co(thayDoi, k)) {
      const giaTri = riengMoi[k] === true;
      if (giaTri !== (goc[k] === true)) ra[k] = giaTri;
    } else if (co(cu.ngoaiLe, k)) {
      ra[k] = cu.ngoaiLe[k] === true;
    }
  }
  return ra;
}

/**
 * ★ LƯU QUYỀN RIÊNG (tick từng người / nhiều người, hoặc "Bỏ quyền riêng — về theo chức danh").
 *
 * Thứ tự — ★ bổ sung đặc tả B-F7 (06/10/2026) thống nhất cho mọi phép lưu: QUYỀN trước, rồi `phienBan`,
 * rồi KHUÔN, rồi TỪNG Ô / TỪNG NGƯỜI (bản đầu gói B so `phienBan` trước quyền — người không có quyền vẫn
 * nhận câu "tải lại trang" thay vì câu "không có quyền"):
 *   1. Người gọi không có quyền phân quyền → 403.
 *   2. `phienBanMauGui` lệch mẫu đang cất → 409 `mau-doi`. 🔴 Tab cũ gửi bản nháp dựng theo mẫu cũ là
 *      trả lại đúng cờ Sếp vừa bỏ ở mẫu.
 *   3. Khuôn: danh sách người nhận (1..50, bỏ trùng), khoá + giá trị của `thayDoi` → 400.
 *   4. Từng người nhận: `goc` = công thức + mẫu; bản cũ đọc qua `quyenRiengConHieuLuc` (đã đối chiếu dấu).
 *      · tick: `tinhTruocSauKhiLuu` (giữ nguyên); cần ghi thì tính NGOẠI LỆ MỚI — rỗng → XOÁ (có bản) /
 *        giữ nguyên (chưa có bản); còn lại → ghi bản KHUÔN 2 (kèm `quyen` đủ ô `KHOA_TICK` cho bản mã cũ
 *        khi rollback, kèm `phienBanMau` — B-F8, kèm dấu `coOXemBuoc: true` — 07/10/2026).
 *        ★ B-F2 (Câu 3 = A, "chỉ GIỮ ô đã cố ý khác"): dấu KHỚP và không bỏ "Vào app" → ngoại lệ mới =
 *        ngoại lệ CŨ mà lần này KHÔNG chạm (giữ nguyên giá trị, kể cả khi đang TRÙNG mẫu hiện tại) ∪ ô vừa
 *        chạm có giá trị ≠ `goc`; ô vừa chạm mà = `goc` thì bỏ khỏi ngoại lệ. Khuôn 1 thì ngoại lệ cũ =
 *        ngoại lệ ngầm (`ngoaiLeConHieuLuc`). Dấu LỆCH / THIẾU / bỏ "Vào app" → giữ luật riêng như đặc tả
 *        (`rutNgoaiLe(riengMoi, goc)`). 🔴 Bản đầu dùng `rutNgoaiLe` cho mọi ca: ngoại lệ đang trùng mẫu bị
 *        rơi mất ở lần lưu ô KHÁC, rồi Sếp đổi mẫu lại là người đó mất quyền đã được cố ý trao.
 *      · bỏ quyền riêng: trước = hiệu lực hiện tại, sau = `goc`; có bản → XOÁ.
 *   5. `vuongMacTraoQuyen` → 403. 🔴 "Bỏ quyền riêng" CŨNG phải qua: xoá một bản đã bỏ ô chính là trao
 *      lại các cờ đó (Trưởng BP không xoá được bản riêng của Quản trị, BGĐ, Trưởng BP khác).
 *   6. Câu nhật ký: có tên người nhận, KHÔNG có tên nhà cung cấp.
 */
export function tinhLuuQuyenRieng(v: {
  nguoiGoi: NguoiGoiTraoQuyen;
  nhan: readonly NguoiNhanLuu[];
  mau: MauChucDanh;
  phienBanMauGui: number;
  yeuCau: YeuCauQuyenRieng;
  luc: string;
  capNhatBoi: string;
  capNhatBoiTen: string;
}): KetQuaLuuQuyenRieng {
  /* B-F7: quyền → phienBan → khuôn → từng người. */
  if (!coQuyenPhanQuyen(v.nguoiGoi.nguoiDung)) {
    return { ok: false, status: 403, error: "Bạn không có quyền phân quyền người dùng." };
  }
  if (v.phienBanMauGui !== v.mau.phienBan) {
    return { ok: false, status: 409, error: cauMauDoi(v.phienBanMauGui, v.mau.phienBan), maLoi: "mau-doi" };
  }
  /* Bỏ trùng mã (giữ người xuất hiện đầu) — route đã bỏ trùng, kho demo thì chưa chắc. */
  const daGap = new Set<string>();
  const nhan = v.nhan.filter((n) => (daGap.has(n.uid) ? false : (daGap.add(n.uid), true)));
  if (nhan.length === 0) return { ok: false, status: 400, error: "Chưa chọn người nào để phân quyền." };
  if (nhan.length > TOI_DA_NGUOI_MOI_LAN) {
    return {
      ok: false,
      status: 400,
      error: `Mỗi lần lưu tối đa ${TOI_DA_NGUOI_MOI_LAN} người — chia nhỏ rồi lưu lại.`,
    };
  }

  let thayDoi: QuyenRieng = {};
  if (v.yeuCau.loai === "tick") {
    const tick = new Set<string>(KHOA_TICK);
    const raw = v.yeuCau.thayDoi as Record<string, unknown>;
    const la = Object.keys(raw).filter((k) => !tick.has(k) || typeof raw[k] !== "boolean");
    if (la.length > 0) return { ok: false, status: 400, error: `Khoá quyền không hợp lệ: ${la.join(", ")}.` };
    thayDoi = v.yeuCau.thayDoi;
    if (Object.keys(thayDoi).length === 0) {
      return { ok: false, status: 400, error: "Chưa có thay đổi nào để lưu." };
    }
  }

  const dich: DichTraoQuyen[] = [];
  const ghi: { uid: string; banGhi: BanGhiQuyenRieng }[] = [];
  const xoa: string[] = [];
  const giuNguyen: string[] = [];
  for (const n of nhan) {
    /* 📌 Chốt 409 "bản ghi có ô Xem bước của bản sau" (nhịp 1, `693370a`) ĐÃ GỠ ở nhịp 2 (07/10/2026): 9 khoá
       bước nay là khoá chính thức của `KHOA_TICK`, bản này đọc và ghi lại được chúng. Chốt đó chỉ có nghĩa
       khi bản ĐANG CHẠY là nhịp 1 (sau một lần Instant Rollback) — mã nhịp 1 vẫn còn nó. */
    const laQT = n.nd.vaiTro === "admin";
    const oDe = oDeCuaHoSo(v.mau, n.nd);
    const goc = quyenTheoChucDanhCoMau(tinhQuyenTheoChucDanh(n.nd), oDe);
    const riengCu = quyenRiengConHieuLuc(n.banGhi, n.nd, oDe);

    if (v.yeuCau.loai === "bo-quyen-rieng") {
      dich.push({
        uid: n.uid,
        ten: n.nd.tenHienThi,
        vaiTro: n.nd.vaiTro,
        capTM: n.nd.capTM,
        quyenGoc: goc,
        quyenTruoc: apDungQuyenRieng(goc, riengCu, laQT),
        quyenSau: goc,
        boVaoApp: false,
      });
      (n.banGhi ? xoa : giuNguyen).push(n.uid);
      continue;
    }

    const ts = tinhTruocSauKhiLuu(goc, riengCu, laQT, thayDoi);
    dich.push({
      uid: n.uid,
      ten: n.nd.tenHienThi,
      vaiTro: n.nd.vaiTro,
      capTM: n.nd.capTM,
      quyenGoc: goc,
      quyenTruoc: ts.quyenTruoc,
      quyenSau: ts.quyenSau,
      boVaoApp: ts.boVaoApp,
    });
    if (!ts.canGhi) {
      giuNguyen.push(n.uid);
      continue;
    }
    const ngoaiLe = ngoaiLeMoiKhiTick(n.banGhi, n.nd, goc, ts.riengMoi, thayDoi);
    if (Object.keys(ngoaiLe).length === 0) {
      /* Y hệt chức danh → không cất `{}`: có bản thì XOÁ để người đó về "theo chức danh". */
      (n.banGhi ? xoa : giuNguyen).push(n.uid);
      continue;
    }
    ghi.push({
      uid: n.uid,
      banGhi: {
        khuon: 2,
        ngoaiLe,
        /* Dấu lấy từ hồ sơ nơi gọi VỪA ĐỌC (route: trong giao dịch), không nhận từ trình duyệt. */
        theoChucDanh: dauChucDanhCua(n.nd),
        /* Đủ ô `KHOA_TICK` — CHỈ cho bản mã cũ đọc khi Instant Rollback (mã mới không đọc khi khuon === 2). */
        quyen: ts.riengMoi,
        /* B-F8: phiên bản mẫu lúc lưu — dấu vết để phát hiện tài liệu mẫu bị xoá (`docMauChucDanh`). */
        phienBanMau: v.mau.phienBan,
        /* ★ 07/10/2026: dấu "đã có ô Xem bước" — LITERAL `true` (không bao giờ `undefined`: Admin SDK ném, bài
           C-F5). Thiếu dấu là bản ghi bị đọc lại theo luật 8 / 8b → xem trước ≠ kết quả. */
        coOXemBuoc: true,
        capNhatLuc: v.luc,
        capNhatBoi: v.capNhatBoi,
        capNhatBoiTen: v.capNhatBoiTen,
      },
    });
  }

  const chan = vuongMacTraoQuyen(v.nguoiGoi, dich);
  if (chan) return { ok: false, status: 403, error: chan };

  const tenCua = new Map(nhan.map((n) => [n.uid, n.nd.tenHienThi || n.uid]));
  const ten = (uids: readonly string[]) => uids.map((u) => tenCua.get(u) ?? u);
  let moTaNhatKy: string;
  if (v.yeuCau.loai === "bo-quyen-rieng") {
    moTaNhatKy = ghepMoTa(
      `Bỏ quyền riêng — về theo chức danh (xoá ${xoa.length}, giữ nguyên ${giuNguyen.length}): `,
      ten(xoa.length > 0 ? xoa : giuNguyen),
      ".",
    );
  } else {
    const coDoi = KHOA_TICK.filter((k) => k in thayDoi).map(
      (k) => `${thayDoi[k] === true ? "bật" : "tắt"} “${nhanCoTick(k)}”`,
    );
    moTaNhatKy = ghepMoTa(
      `Tick quyền riêng cho ${nhan.length} người (ghi ${ghi.length}, xoá ${xoa.length}, giữ nguyên ${giuNguyen.length}) — `,
      [...coDoi, `người nhận: ${ten(nhan.map((n) => n.uid)).join(", ")}`],
      ".",
    );
  }
  return { ok: true, ghi, xoa, giuNguyen, moTaNhatKy };
}

/** Đếm ô có quyền hiệu lực khác nhau giữa hai mẫu (mọi cột × mọi ô `KHOA_TICK`). */
function demODoi(a: MauChucDanh, b: MauChucDanh): { ma: MaVaiTroChuan; khoa: keyof Quyen; sang: boolean }[] {
  const ra: { ma: MaVaiTroChuan; khoa: keyof Quyen; sang: boolean }[] = [];
  for (const vt of VAI_TRO_CHUAN) {
    const qa = quyenCuaVaiTroCoMau(vt, a);
    const qb = quyenCuaVaiTroCoMau(vt, b);
    for (const k of KHOA_TICK) if (qa[k] !== qb[k]) ra.push({ ma: vt.ma, khoa: k, sang: qb[k] });
  }
  return ra;
}

const moTaODoi = (ds: readonly { ma: MaVaiTroChuan; khoa: keyof Quyen; sang: boolean }[]) =>
  ds.map((o) => `${timVaiTroChuan(o.ma)?.ten ?? o.ma}: ${o.sang ? "bật" : "tắt"} “${nhanCoTick(o.khoa)}”`);

/**
 * ★ LƯU MẪU CHỨC DANH — Sếp 06/10/2026, Câu 1 = A · Câu 2 = B.
 *
 * Thứ tự (đặc tả 4 · B5, bổ sung B-F7 "quyền → phienBan → khuôn → từng ô"):
 *   ① quyền SỬA BẢNG MẪU (`duocSuaMauChucDanh` — B-F3: chỉ Quản trị hoặc hồ sơ khớp Trưởng BP Thu mua)
 *      → 403 · ② `phienBan` lệch → 409 `mau-doi` · ③ khuôn `thayDoi` (mã cột thuộc `VAI_TRO_CHUAN`, khoá
 *      thuộc `KHOA_TICK`, giá trị boolean / `null`) → 400 · ④ `lyDoKhongSuaOMau` từng ô → 403 · ⑤ dựng
 *      `deMoi` (bằng công thức hoặc `null` → xoá ô; cột rỗng → xoá cột) · ⑥ không đổi gì → 400 ·
 *   ⑦ LEO QUYỀN QUA GÁN CHỨC DANH (`danhSachLeoQuyenQuaGanChucDanh`) — ★ B-F4 (Sếp *"Quản trị sửa tất"*):
 *      · Quản trị → KHÔNG chặn, mọi ô leo quyền thành CẢNH BÁO trong hộp xác nhận;
 *      · người khác (Trưởng BP) → 400 chỉ với ô leo quyền MỚI SINH ở lần lưu này (không có trong mẫu cũ).
 *        Bổ sung đặc tả ghi "với Trưởng BP không cần chặn thêm" vì luật ⑤ "chỉ cờ mình có" đã chặn bật cờ
 *        mình không có; em vẫn giữ chốt cho ca BIÊN: Trưởng BP có cờ X nhờ NGOẠI LỆ RIÊNG (cột Trưởng BP
 *        không có X) bật X cho cả một cột → mọi Trưởng BP khác gán chức danh đó là trao được X. Ô Quản trị
 *        đã chấp nhận từ trước KHÔNG làm Trưởng BP kẹt (chỉ xét ô mới).
 *   ⑧ cảnh báo (chỉ báo, không chặn): việc không ai làm (★ 07/10/2026: kèm cặp việc–bước, bổ sung N-B) · chỉ
 *      đạo khi bật Xem giá / Xem NCC (B-F10) hoặc ô "Xem bước quy trình" (★ 07/10/2026, đặc tả D.2 + V-E) cho
 *      Thủ kho / Phòng Thi công · leo quyền của Quản trị (⑦) · ⑨ `phienBan + 1` + dấu `coOXemBuoc` · ⑩ câu
 *      nhật ký.
 */
export function tinhLuuMauChucDanh(v: {
  nguoiGoi: NguoiGoiTraoQuyen;
  mauCu: MauChucDanh;
  phienBanGui: number;
  thayDoi: ThayDoiMau;
  luc: string;
  capNhatBoi: string;
  capNhatBoiTen: string;
}): KetQuaLuuMau {
  const nd = v.nguoiGoi.nguoiDung;
  if (!coQuyenPhanQuyen(nd)) return { ok: false, status: 403, error: "Bạn không có quyền phân quyền người dùng." };
  if (!duocSuaMauChucDanh(nd)) return { ok: false, status: 403, error: LY_DO_KHONG_SUA_MAU };
  if (v.phienBanGui !== v.mauCu.phienBan) {
    return { ok: false, status: 409, error: cauMauDoi(v.phienBanGui, v.mauCu.phienBan), maLoi: "mau-doi" };
  }

  const raw = v.thayDoi as unknown;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, status: 400, error: "Thiếu phần thay đổi của bảng mẫu." };
  }
  const tick = new Set<string>(KHOA_TICK);
  const o: { ma: MaVaiTroChuan; khoa: keyof Quyen; giaTri: boolean | null }[] = [];
  for (const [ma, cot] of Object.entries(raw as Record<string, unknown>)) {
    if (!timVaiTroChuan(ma)) return { ok: false, status: 400, error: `Mã chức danh không hợp lệ: ${ma}.` };
    if (!cot || typeof cot !== "object" || Array.isArray(cot)) {
      return { ok: false, status: 400, error: `Cột ${ma} không đúng khuôn.` };
    }
    for (const [k, g] of Object.entries(cot as Record<string, unknown>)) {
      if (!tick.has(k)) return { ok: false, status: 400, error: `Khoá quyền không hợp lệ: ${k}.` };
      if (g !== null && typeof g !== "boolean") {
        return { ok: false, status: 400, error: `Ô ${ma}.${k} phải là true / false / null.` };
      }
      o.push({ ma: ma as MaVaiTroChuan, khoa: k as keyof Quyen, giaTri: g });
    }
  }
  if (o.length === 0) return { ok: false, status: 400, error: "Chưa có thay đổi nào để lưu." };

  for (const x of o) {
    const lyDo = lyDoKhongSuaOMau(nd, x.ma, x.khoa);
    if (lyDo) return { ok: false, status: 403, error: lyDo };
  }

  const deMoi: DeMau = {};
  for (const [ma, cot] of Object.entries(v.mauCu.de)) if (cot) deMoi[ma as MaVaiTroChuan] = { ...cot };
  for (const x of o) {
    const vt = timVaiTroChuan(x.ma)!;
    const cot: QuyenRieng = { ...(deMoi[x.ma] ?? {}) };
    if (x.giaTri === null || x.giaTri === quyenCuaVaiTro(vt)[x.khoa]) delete cot[x.khoa];
    else cot[x.khoa] = x.giaTri;
    if (Object.keys(cot).length > 0) deMoi[x.ma] = cot;
    else delete deMoi[x.ma];
  }

  const mauMoi: MauChucDanh = {
    khuon: 1,
    phienBan: v.mauCu.phienBan + 1,
    de: deMoi,
    /* ★ 07/10/2026: LUÔN đặt dấu (literal `true`) — `mauCu` đã đọc qua `chuanHoaMauChucDanh` nên `de` chép ở trên
       đã gồm ô bước luật 8 / 8b điền cho mẫu cũ; ghi kèm dấu là ghi hẳn chúng, đọc lại không điền lần hai. */
    coOXemBuoc: true,
    capNhatLuc: v.luc,
    capNhatBoi: v.capNhatBoi,
    capNhatBoiTen: v.capNhatBoiTen,
  };
  const oDoi = demODoi(v.mauCu, mauMoi);
  if (oDoi.length === 0) return { ok: false, status: 400, error: "Không có ô nào khác mẫu đang lưu." };

  /* ⑦ — B-F4: xem chú thích trên hàm. */
  const leo = danhSachLeoQuyenQuaGanChucDanh(deMoi);
  let canhBaoLeo: string[] = [];
  if (nd.vaiTro === "admin") {
    canhBaoLeo = leo.map((x) => x.cau);
  } else {
    const daCo = new Set(danhSachLeoQuyenQuaGanChucDanh(v.mauCu.de).map((x) => `${x.ma}.${x.khoa}`));
    const moi = leo.find((x) => !daCo.has(`${x.ma}.${x.khoa}`));
    if (moi) {
      return {
        ok: false,
        status: 400,
        error: `${moi.cau} Bỏ ô đó, hoặc nhờ Quản trị bật “${nhanCoTick(moi.khoa)}” cho cột Trưởng bộ phận trước.`,
      };
    }
  }

  return {
    ok: true,
    mauMoi,
    soODoi: oDoi.length,
    canhBao: [...canhBaoLeo, ...canhBaoChiDaoKhiDoiMau(v.mauCu, mauMoi), ...canhBaoViecKhongAiLam(mauMoi)],
    moTaNhatKy: ghepMoTa(
      `Sửa mẫu quyền theo chức danh (bản ${v.mauCu.phienBan} → ${mauMoi.phienBan}, ${oDoi.length} ô): `,
      moTaODoi(oDoi),
      ".",
    ),
  };
}

/**
 * (Thêm ngoài đặc tả 2.4 — tiện cho route và kho demo, không bắt buộc dùng.) Đưa CẢ bảng mẫu về mặc định
 * gốc khi mẫu ĐỌC ĐƯỢC: chỉ Quản trị, phải khớp `phienBan`, ghi `de: {}` + `phienBan + 1`. Nhánh cứu mẫu
 * HỎNG (không đọc được) là việc của route — xem đặc tả 5 · C3.
 */
export function tinhVeMacDinhMauToanBo(v: {
  nguoiGoi: NguoiGoiTraoQuyen;
  mauCu: MauChucDanh;
  phienBanGui: number;
  luc: string;
  capNhatBoi: string;
  capNhatBoiTen: string;
}): KetQuaLuuMau {
  if (v.nguoiGoi.nguoiDung.vaiTro !== "admin") {
    return { ok: false, status: 403, error: "Chỉ tài khoản Quản trị đưa được cả bảng mẫu về mặc định gốc." };
  }
  if (v.phienBanGui !== v.mauCu.phienBan) {
    return { ok: false, status: 409, error: cauMauDoi(v.phienBanGui, v.mauCu.phienBan), maLoi: "mau-doi" };
  }
  const mauMoi: MauChucDanh = {
    khuon: 1,
    phienBan: v.mauCu.phienBan + 1,
    de: {},
    coOXemBuoc: true, // ★ 07/10/2026 — xem `DAU_CO_O_XEM_BUOC`
    capNhatLuc: v.luc,
    capNhatBoi: v.capNhatBoi,
    capNhatBoiTen: v.capNhatBoiTen,
  };
  const oDoi = demODoi(v.mauCu, mauMoi);
  if (oDoi.length === 0) return { ok: false, status: 400, error: "Bảng mẫu đang ở đúng mặc định gốc." };
  return {
    ok: true,
    mauMoi,
    soODoi: oDoi.length,
    canhBao: canhBaoViecKhongAiLam(mauMoi),
    moTaNhatKy: ghepMoTa(
      `Đưa cả bảng mẫu quyền theo chức danh về mặc định gốc (bản ${v.mauCu.phienBan} → ${mauMoi.phienBan}, ${oDoi.length} ô): `,
      moTaODoi(oDoi),
      ".",
    ),
  };
}

/**
 * ★ CỨU MẪU HỎNG — đưa cả bảng mẫu về mặc định gốc khi tài liệu mẫu KHÔNG ĐỌC ĐƯỢC (`docMauChucDanh` trả
 * `{ loi }`: khuôn lạ, ô hỏng, hoặc bị xoá mà còn dấu vết — B-F8). Phép tính thuần cho route (gói C,
 * đặc tả 5 · C3 dòng "Hỏng + veMacDinhToanBo từ Quản trị") và kho demo.
 *
 * · Chỉ Quản trị. 🔴 `laQuanTri` nơi gọi phải xác định KHÔNG QUA MẪU (bổ sung đặc tả C-F2: mẫu hỏng thì
 *   không dựng được người gọi qua mẫu) — vd từ hồ sơ / vai trò owner.
 * · Bỏ qua kiểm `phienBan` (không đọc được bản đang cất).
 * · ★ B-F9: `phienBan` mới = `phienBanCuuMauHong(rawMau, luc)` — CHỈ TĂNG, lớn hơn mọi bản tab cũ đang
 *   giữ, để tab cũ không lọt chốt 409.
 */
export function tinhCuuMauHong(v: {
  laQuanTri: boolean;
  rawMau: unknown;
  lyDoHong: string;
  luc: string;
  capNhatBoi: string;
  capNhatBoiTen: string;
}): KetQuaLuuMau {
  if (!v.laQuanTri) {
    return { ok: false, status: 403, error: "Chỉ tài khoản Quản trị cứu được bảng mẫu quyền theo chức danh bị hỏng." };
  }
  const mauMoi: MauChucDanh = {
    khuon: 1,
    phienBan: phienBanCuuMauHong(v.rawMau, v.luc),
    de: {},
    coOXemBuoc: true, // ★ 07/10/2026 — xem `DAU_CO_O_XEM_BUOC`
    capNhatLuc: v.luc,
    capNhatBoi: v.capNhatBoi,
    capNhatBoiTen: v.capNhatBoiTen,
  };
  return {
    ok: true,
    mauMoi,
    /* Không đọc được mẫu hỏng nên không đếm được ô đổi — 0, kèm lý do hỏng trong nhật ký. */
    soODoi: 0,
    canhBao: canhBaoViecKhongAiLam(mauMoi),
    moTaNhatKy: ghepMoTa(
      `Cứu bảng mẫu quyền theo chức danh bị hỏng — đưa cả bảng về mặc định gốc (bản mới ${mauMoi.phienBan}). Lý do hỏng: `,
      [v.lyDoHong],
      "",
    ),
  };
}
