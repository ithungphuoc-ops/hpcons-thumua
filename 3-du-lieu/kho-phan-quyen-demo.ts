// ============================================================
// KHO DEMO PHÂN QUYỀN — CHỈ CHẠY Ở CHẾ ĐỘ TÀI KHOẢN MẪU (localhost, `NEXT_PUBLIC_XAC_THUC` trống / `mau`)
//
// 🔴 Sếp 06/10/2026: phân quyền mới (bảng mẫu chức danh sửa được · Câu 1 = A · Câu 2 = B · Câu 3 = A) phải
// DEMO ĐƯỢC TRÊN MÁY trước khi đẩy lên. Máy lập trình chạy chế độ mẫu: không có cấu hình Firebase, không có
// service account → mọi route máy chủ trả 401 trước khi chạm Firestore. Nên demo cất dữ liệu ở
// localStorage của trình duyệt này, KHÔNG BAO GIỜ ghi lên máy chủ.
//
// ## 🔴 LUẬT CHẠY THẬT, KHÔNG CHẠY LUẬT GIẢ
// Mọi lần lưu gọi ĐÚNG hai hàm thuần route máy chủ dùng — `tinhLuuQuyenRieng` / `tinhLuuMauChucDanh`
// (`4-phan-quyen/tinh-luu-phan-quyen.ts`), đọc mẫu qua ĐÚNG `docMauChucDanh`, gộp quyền qua ĐÚNG
// `ganQuyenRiengHieuLuc`. Kho này chỉ làm phần máy chủ làm bằng Firestore: đọc, áp kết quả, ghi, nhật ký.
// Hai nơi tự tính là sớm muộn demo nói "được" mà máy chủ nói "không" — Sếp duyệt trên demo rồi lên bản
// thật thấy khác.
//
// ## Một kho duy nhất (bổ sung đặc tả D-F1)
// · `layKhoDemo()` là lối vào cho app — MỘT bản dùng chung cho `nguoi-dung-hien-tai.tsx` (gộp quyền vào
//   người đang đăng nhập → menu, nút, tầng ghi đổi theo) và `4-phan-quyen/nguon-phan-quyen.ts` (màn Phân
//   quyền đọc/ghi). `taoKhoDemo` chỉ được gọi ở ĐÚNG một chỗ: trong `layKhoDemo` (bài kiểm-luật canh).
// · KHÔNG giữ trạng thái trong bộ nhớ làm nguồn: mọi thao tác đọc lại localStorage → sửa → ghi lại. Tab
//   khác ghi thì sự kiện `storage` báo, kho phát tin cho người đăng ký (`useSyncExternalStore`).
// · Kho tự dựng NGƯỜI GỌI từ dữ liệu của chính nó (`VAI_TRO_MAU` + bản ghi + mẫu trong kho), chỉ nhận MÃ
//   từ nơi gọi — y như route máy chủ dựng người gọi từ vé đăng nhập, không tin quyền trình duyệt gửi lên.
//
// ## Khuôn trong localStorage (khoá `hpcons-thumua-phan-quyen-demo-v1`, đặc tả 2.1)
//   `{ khuon: 1, mau: MauChucDanh, quyenRieng: Record<uid, BanGhiQuyenRieng>, lichSu: [...] (≤ 50) }`
// Mã người (`uid`) = mã tài khoản mẫu (`u-tm1`…) — ở demo mã Firebase = mã nghiệp vụ.
//
// ⚠️ Demo KHÔNG chứng minh được: giao dịch Firestore, 401/403 thật, nhật ký Firestore, rules, việc đổi
// chức danh (demo không đổi chức danh — `ganVaiTro` của nguồn demo trả câu lý do).
// ============================================================

import {
  quyenRiengConHieuLuc,
  VAI_TRO_MAU,
  type NguoiDung,
  type VaiTroMau,
} from "@/4-phan-quyen/quyen";
import {
  chuanHoaBanGhiQuyenRieng,
  dauChucDanhCua,
  KHOA_TICK,
  khopDauChucDanh,
  type BanGhiQuyenRieng,
  type BanGhiQuyenRiengHienThi,
  type QuyenRieng,
} from "@/4-phan-quyen/quyen-rieng";
import { docMauChucDanh, oDeCuaHoSo, type MauChucDanh, type ThayDoiMau } from "@/4-phan-quyen/mau-chuc-danh";
import {
  coQuyenPhanQuyen,
  ganQuyenRiengHieuLuc,
  HANH_DONG_NHAT_KY,
  tinhCuuMauHong,
  tinhLuuMauChucDanh,
  tinhLuuQuyenRieng,
  tinhVeMacDinhMauToanBo,
  type NguoiNhanLuu,
  type YeuCauQuyenRieng,
} from "@/4-phan-quyen/tinh-luu-phan-quyen";
/* 🔴 CHỈ `import type` từ hai tệp nối máy chủ — nạp hàm chạy được từ đó là kéo Firebase vào kho demo. */
import type { HoSoKemMa, ThanhVienDanhBa } from "@/5-ket-noi/ho-so-tai-khoan";
import type {
  KetQuaDocQuyenRiengTatCa,
  KetQuaLuuQuyenRiengNguoiDung,
} from "@/4-phan-quyen/quyen-rieng-ket-noi";
import type { KetQuaLuuMauNguoiDung } from "@/4-phan-quyen/mau-chuc-danh-ket-noi";

/** Khoá localStorage của demo (đặc tả 2.1). Đổi khuôn thì đổi đuôi `-v1` chứ đừng đọc khuôn cũ đoán mò. */
export const KHOA_KHO_DEMO_PHAN_QUYEN = "hpcons-thumua-phan-quyen-demo-v1";

/** Trần số dòng lịch sử demo (đặc tả 2.3). */
const TOI_DA_LICH_SU = 50;

const LOI_BO_NHO = "Trình duyệt chặn bộ nhớ — bản demo không lưu được.";

/** Một dòng lịch sử demo — cùng các trường route ghi vào Nhật ký hệ thống (đặc tả 2.3). */
export interface DongLichSuDemo {
  luc: string;
  ten: string;
  hanhDong: string;
  moTa: string;
}

export interface KhoDemoPhanQuyen {
  /** Đăng ký nghe thay đổi (cùng tab + tab khác) — cho `useSyncExternalStore`. Trả hàm huỷ. */
  dangKy(cb: () => void): () => void;
  /** Số lần kho đổi kể từ khi mở trang (bắt đầu từ 1) — "ảnh chụp" cho `useSyncExternalStore`. */
  phienBan(): number;
  /** Quyền riêng HIỆU LỰC (mẫu + ngoại lệ) của một tài khoản mẫu — đúng thứ máy chủ trả qua `GET /api/quyen-rieng`. */
  quyenRiengCua(nd: NguoiDung): QuyenRieng | null;
  docHoSo(): HoSoKemMa[];
  docDanhBa(): ThanhVienDanhBa[];
  docTatCa(uidNguoiGoi: string): KetQuaDocQuyenRiengTatCa;
  luuQuyenRieng(
    uidNguoiGoi: string,
    uids: readonly string[],
    yeuCau: YeuCauQuyenRieng,
    phienBanMau: number | undefined,
  ): KetQuaLuuQuyenRiengNguoiDung;
  luuMau(
    uidNguoiGoi: string,
    phienBan: number | undefined,
    thayDoi: ThayDoiMau | "ve-mac-dinh-toan-bo",
  ): KetQuaLuuMauNguoiDung;
  /** Lịch sử demo, MỚI NHẤT lên đầu. */
  lichSu(): DongLichSuDemo[];
  /** Xoá sạch dữ liệu demo phân quyền. `null` = xong, chuỗi = lý do hỏng. */
  xoaHet(): string | null;
}

/** Trạng thái đọc từ localStorage — `hong` khác `null` là tài liệu demo hỏng cả khối. */
interface TrangThaiTho {
  mau: unknown;
  quyenRieng: Record<string, unknown>;
  lichSu: DongLichSuDemo[];
  hong: string | null;
}

/**
 * Email hồ sơ demo — CHÉP quy ước có sẵn ở `5-ket-noi/ho-so-nhan-su.ts` → `layHoSoNhanSu` (dòng 65-66:
 * `${tenDangNhap}@hpcons.com.vn`, email GIẢ ĐỊNH chỉ để xem bố cục). Chép chứ không gọi vì hàm đó là
 * `async` còn kho này đồng bộ; bài kiểm-luật so hai bên khớp nhau (bổ sung đặc tả D-F6).
 */
const emailDemo = (v: VaiTroMau) => `${v.tenDangNhap}@hpcons.com.vn`;

/**
 * Lối vào DUY NHẤT tạo kho demo — gọi ở đúng một chỗ (`layKhoDemo`).
 *
 * 🔴 `cheDo !== "mau"` → NÉM, và ném TRƯỚC mọi lần chạm localStorage: chế độ `sso` (bản thật) mà lỡ dựng
 * kho demo là quyền lấy từ trình duyệt thay vì máy chủ.
 * 📌 Không đọc localStorage lúc tạo — chỉ đọc khi có thao tác (trang dựng sẵn phía máy chủ không có
 * localStorage).
 */
export function taoKhoDemo(cheDo: "mau" | "sso"): KhoDemoPhanQuyen {
  if (cheDo !== "mau") {
    throw new Error("Kho demo phân quyền chỉ dùng ở chế độ tài khoản mẫu — chế độ sso đọc/ghi máy chủ thật.");
  }

  let soLanDoi = 1;
  const nguoiNghe = new Set<() => void>();
  const phat = () => {
    soLanDoi += 1;
    for (const cb of [...nguoiNghe]) cb();
  };
  const khiTabKhacGhi = (e: Event) => {
    const khoa = (e as StorageEvent).key;
    if (khoa === KHOA_KHO_DEMO_PHAN_QUYEN || khoa === null) phat();
  };

  /** localStorage của môi trường hiện tại — trình duyệt chặn / máy chủ không có thì `null`. */
  function boNho(): Storage | null {
    try {
      return (globalThis as { localStorage?: Storage }).localStorage ?? null;
    } catch {
      return null;
    }
  }

  function docTho(): { tt: TrangThaiTho; coBoNho: boolean } {
    const trong: TrangThaiTho = { mau: undefined, quyenRieng: {}, lichSu: [], hong: null };
    const kho = boNho();
    if (!kho) return { tt: trong, coBoNho: false };
    let chuoi: string | null;
    try {
      chuoi = kho.getItem(KHOA_KHO_DEMO_PHAN_QUYEN);
    } catch {
      return { tt: trong, coBoNho: false };
    }
    /* Chưa có gì = demo trống = mẫu trống bản 0, chưa ai có quyền riêng (y hệt trước 06/10/2026). */
    if (chuoi === null) return { tt: trong, coBoNho: true };
    let d: unknown;
    try {
      d = JSON.parse(chuoi);
    } catch {
      return { tt: { ...trong, hong: "Dữ liệu demo phân quyền trên trình duyệt không đọc được (JSON hỏng)." }, coBoNho: true };
    }
    /* 🔴 Khối hỏng thì báo HỎNG (mẫu hỏng → người không phải Quản trị bị khoá), KHÔNG coi là demo trống:
       trống = mẫu trống = có thể RỘNG hơn mẫu đã lưu. Cùng luật "đọc lỗi không thành rộng hơn". */
    if (!d || typeof d !== "object" || Array.isArray(d)) {
      return { tt: { ...trong, hong: "Dữ liệu demo phân quyền sai khuôn (không phải object)." }, coBoNho: true };
    }
    const o = d as Record<string, unknown>;
    if (o.khuon !== 1) {
      return { tt: { ...trong, hong: `Dữ liệu demo phân quyền khuôn lạ (khuon = ${String(o.khuon)}).` }, coBoNho: true };
    }
    if (!o.quyenRieng || typeof o.quyenRieng !== "object" || Array.isArray(o.quyenRieng)) {
      return { tt: { ...trong, hong: "Dữ liệu demo phân quyền thiếu phần quyền riêng." }, coBoNho: true };
    }
    const lichSu = Array.isArray(o.lichSu)
      ? o.lichSu.filter(
          (x): x is DongLichSuDemo =>
            !!x &&
            typeof x === "object" &&
            typeof (x as DongLichSuDemo).luc === "string" &&
            typeof (x as DongLichSuDemo).moTa === "string" &&
            typeof (x as DongLichSuDemo).hanhDong === "string" &&
            typeof (x as DongLichSuDemo).ten === "string",
        )
      : [];
    return {
      tt: { mau: o.mau, quyenRieng: o.quyenRieng as Record<string, unknown>, lichSu, hong: null },
      coBoNho: true,
    };
  }

  /** Ghi cả khối. `null` = xong; chuỗi = lý do hỏng. Ghi xong thì phát tin cho người đăng ký. */
  function ghi(tt: { mau: unknown; quyenRieng: Record<string, unknown>; lichSu: DongLichSuDemo[] }): string | null {
    const kho = boNho();
    if (!kho) return LOI_BO_NHO;
    try {
      kho.setItem(
        KHOA_KHO_DEMO_PHAN_QUYEN,
        JSON.stringify({ khuon: 1, mau: tt.mau, quyenRieng: tt.quyenRieng, lichSu: tt.lichSu }),
      );
    } catch {
      return LOI_BO_NHO;
    }
    phat();
    return null;
  }

  /** Đọc mẫu ĐÚNG như máy chủ: `docMauChucDanh` kèm dấu vết `phienBanMau` của mọi bản ghi (B-F8). */
  function docMau(tt: TrangThaiTho): { mau: MauChucDanh; canhBao: string[] } | { loi: string } {
    if (tt.hong) return { loi: tt.hong };
    const vet = Object.values(tt.quyenRieng).map((raw) => chuanHoaBanGhiQuyenRieng(raw));
    return docMauChucDanh(tt.mau, vet);
  }

  /** Bản ghi của một người. Có mà sai khuôn → `{ loi }` (như route NÉM — không coi là "chưa có"). */
  function banGhiCua(tt: TrangThaiTho, uid: string): { banGhi: BanGhiQuyenRieng | null } | { loi: string } {
    const raw = tt.quyenRieng[uid];
    if (raw === undefined) return { banGhi: null };
    const b = chuanHoaBanGhiQuyenRieng(raw);
    return b ? { banGhi: b } : { loi: `Bản quyền riêng demo của ${uid} sai khuôn — bấm "Xoá dữ liệu demo phân quyền".` };
  }

  const timTaiKhoan = (uid: string) => VAI_TRO_MAU.find((v) => v.uid === uid);

  /** Dựng NGƯỜI GỌI từ dữ liệu của chính kho (không nhận quyền từ nơi gọi). */
  function nguoiGoiTu(
    tt: TrangThaiTho,
    mau: MauChucDanh,
    uid: string,
  ): { uid: string; nguoiDung: NguoiDung } | { loi: string } {
    const v = timTaiKhoan(uid);
    if (!v) return { loi: "Không tìm thấy tài khoản mẫu đang đăng nhập." };
    const b = banGhiCua(tt, uid);
    if ("loi" in b) return b;
    return { uid, nguoiDung: ganQuyenRiengHieuLuc(v, b.banGhi, mau) };
  }

  const themLichSu = (cu: DongLichSuDemo[], dong: DongLichSuDemo) => [dong, ...cu].slice(0, TOI_DA_LICH_SU);

  /** Đủ ô `KHOA_TICK` TẮT (27 ô từ 07/10/2026) — quyền hẹp nhất (dùng khi không đọc được mẫu / bản ghi). */
  const hepNhat = (): QuyenRieng => Object.fromEntries(KHOA_TICK.map((k) => [k, false])) as QuyenRieng;

  return {
    dangKy(cb) {
      nguoiNghe.add(cb);
      if (nguoiNghe.size === 1 && typeof globalThis.addEventListener === "function") {
        globalThis.addEventListener("storage", khiTabKhacGhi);
      }
      return () => {
        nguoiNghe.delete(cb);
        if (nguoiNghe.size === 0 && typeof globalThis.removeEventListener === "function") {
          globalThis.removeEventListener("storage", khiTabKhacGhi);
        }
      };
    },

    phienBan: () => soLanDoi,

    quyenRiengCua(nd) {
      const { tt } = docTho();
      const m = docMau(tt);
      /* 🔴 Mẫu hỏng / bản ghi hỏng → HẸP NHẤT (y như máy chủ trả 500 và trình duyệt chặn vào app). Quản trị
         vẫn đủ quyền nhờ chốt ② của `apDungQuyenRieng` → vào được màn Phân quyền để cứu. */
      if ("loi" in m) return hepNhat();
      const b = banGhiCua(tt, nd.uid);
      if ("loi" in b) return hepNhat();
      return ganQuyenRiengHieuLuc(nd, b.banGhi, m.mau).quyenRieng ?? null;
    },

    docHoSo: () =>
      VAI_TRO_MAU.map((v) => ({
        firebaseUid: v.uid,
        hoSo: {
          uidNghiepVu: v.uid,
          email: emailDemo(v),
          tenHienThi: v.tenHienThi,
          chucDanh: v.chucDanh,
          phongBan: v.phongBan,
          chucNang: v.chucNang,
          ...(v.chucVu ? { chucVu: v.chucVu } : {}),
          vaiTro: v.vaiTro,
          capTM: v.capTM,
          ...(v.capKho !== undefined ? { capKho: v.capKho } : {}),
          dangLamViec: true,
        },
      })),

    /* Danh bạ demo = đúng các tài khoản mẫu (ai cũng đã có hồ sơ) — không có "người chưa có quyền". */
    docDanhBa: () =>
      VAI_TRO_MAU.map((v) => ({
        uid: v.uid,
        hoTen: v.tenHienThi,
        email: emailDemo(v),
        phongBan: v.phongBan,
        chucDanh: v.chucDanh,
        daCoHoSoThuMua: true,
      })),

    docTatCa(uidNguoiGoi) {
      const { tt } = docTho();
      const m = docMau(tt);
      if ("loi" in m) return { loi: `Mẫu quyền theo chức danh (bản demo) hỏng: ${m.loi}`, mauHong: true };
      const goi = nguoiGoiTu(tt, m.mau, uidNguoiGoi);
      if ("loi" in goi) return { loi: goi.loi, mauHong: false };
      if (!coQuyenPhanQuyen(goi.nguoiDung)) {
        return { loi: "Bạn không có quyền phân quyền người dùng.", mauHong: false };
      }
      const tatCa: Record<string, BanGhiQuyenRiengHienThi> = {};
      for (const uid of Object.keys(tt.quyenRieng)) {
        const b = banGhiCua(tt, uid);
        /* Một bản hỏng → cả lượt lỗi (như route ném), không bỏ qua người đó. */
        if ("loi" in b) return { loi: b.loi, mauHong: false };
        const v = timTaiKhoan(uid);
        if (!v || !b.banGhi) continue; // bản của tài khoản không còn trong danh sách mẫu — không có hồ sơ để hiện
        tatCa[uid] = {
          ...b.banGhi,
          quyenHieuLuc: quyenRiengConHieuLuc(b.banGhi, v, oDeCuaHoSo(m.mau, v)) ?? hepNhat(),
          lechChucDanh: !khopDauChucDanh(b.banGhi.theoChucDanh, dauChucDanhCua(v)),
        };
      }
      return { tatCa, mau: m.mau, canhBaoMau: m.canhBao };
    },

    luuQuyenRieng(uidNguoiGoi, uids, yeuCau, phienBanMau) {
      const { tt, coBoNho } = docTho();
      if (!coBoNho) return { loi: LOI_BO_NHO };
      /* Như route gói C: thiếu `phienBanMau` là trang bản cũ → 400 `ban-cu`. */
      if (typeof phienBanMau !== "number") {
        return { loi: "Trang đang mở là bản cũ — tải lại trang rồi làm lại.", maLoi: "ban-cu" };
      }
      const m = docMau(tt);
      if ("loi" in m) return { loi: `Mẫu quyền theo chức danh (bản demo) hỏng: ${m.loi}`, maLoi: "mau-hong" };
      const goi = nguoiGoiTu(tt, m.mau, uidNguoiGoi);
      if ("loi" in goi) return { loi: goi.loi };
      const nhan: NguoiNhanLuu[] = [];
      for (const uid of uids) {
        const v = timTaiKhoan(uid);
        if (!v) return { loi: `Không tìm thấy hồ sơ của ${uid}.` };
        const b = banGhiCua(tt, uid);
        if ("loi" in b) return { loi: b.loi };
        nhan.push({ uid, nd: v, banGhi: b.banGhi });
      }
      const luc = new Date().toISOString();
      const kq = tinhLuuQuyenRieng({
        nguoiGoi: goi,
        nhan,
        mau: m.mau,
        phienBanMauGui: phienBanMau,
        yeuCau,
        luc,
        capNhatBoi: uidNguoiGoi,
        capNhatBoiTen: goi.nguoiDung.tenHienThi,
      });
      if (!kq.ok) return { loi: kq.error, ...(kq.maLoi ? { maLoi: kq.maLoi } : {}) };

      const quyenRieng: Record<string, unknown> = { ...tt.quyenRieng };
      for (const g of kq.ghi) quyenRieng[g.uid] = g.banGhi;
      for (const u of kq.xoa) delete quyenRieng[u];
      /* Như route: chỉ ghi nhật ký khi có ghi hoặc xoá. */
      const coDoi = kq.ghi.length + kq.xoa.length > 0;
      const lichSu = coDoi
        ? themLichSu(tt.lichSu, {
            luc,
            ten: goi.nguoiDung.tenHienThi,
            hanhDong: yeuCau.loai === "tick" ? HANH_DONG_NHAT_KY.tick : HANH_DONG_NHAT_KY.bo,
            moTa: kq.moTaNhatKy,
          })
        : tt.lichSu;
      const loiGhi = ghi({ mau: tt.mau, quyenRieng, lichSu });
      if (loiGhi) return { loi: loiGhi };
      return { loi: null, soDaGhi: kq.ghi.length, soDaXoa: kq.xoa.length, soGiuNguyen: kq.giuNguyen.length };
    },

    luuMau(uidNguoiGoi, phienBan, thayDoi) {
      const { tt, coBoNho } = docTho();
      if (!coBoNho) return { loi: LOI_BO_NHO };
      const luc = new Date().toISOString();
      const v = timTaiKhoan(uidNguoiGoi);
      const m = docMau(tt);

      if ("loi" in m) {
        /* ĐƯỜNG CỨU MẪU HỎNG — chỉ "về mặc định toàn bộ", chỉ Quản trị. 🔴 C-F2: xác định Quản trị CHỈ bằng
           hồ sơ, KHÔNG dựng người gọi qua mẫu (mẫu đang hỏng thì không dựng được). */
        if (thayDoi !== "ve-mac-dinh-toan-bo") {
          return { loi: `Mẫu quyền theo chức danh (bản demo) hỏng: ${m.loi}`, maLoi: "mau-hong" };
        }
        const kq = tinhCuuMauHong({
          laQuanTri: v?.vaiTro === "admin",
          rawMau: tt.hong ? undefined : tt.mau,
          lyDoHong: m.loi,
          luc,
          capNhatBoi: uidNguoiGoi,
          capNhatBoiTen: v?.tenHienThi ?? uidNguoiGoi,
        });
        if (!kq.ok) return { loi: kq.error };
        /* Cả khối demo hỏng (`tt.hong`) thì bản ghi cũ cũng không đọc được — dựng lại trống, nói rõ ở nhật ký. */
        const loiGhi = ghi({
          mau: kq.mauMoi,
          quyenRieng: tt.hong ? {} : tt.quyenRieng,
          lichSu: themLichSu(tt.hong ? [] : tt.lichSu, {
            luc,
            ten: v?.tenHienThi ?? uidNguoiGoi,
            hanhDong: HANH_DONG_NHAT_KY.veMacDinh,
            moTa: tt.hong ? `${kq.moTaNhatKy} (Cả khối dữ liệu demo hỏng — quyền riêng demo cũ không đọc được, đã bỏ.)` : kq.moTaNhatKy,
          }),
        });
        if (loiGhi) return { loi: loiGhi };
        return { loi: null, phienBan: kq.mauMoi.phienBan, soODoi: kq.soODoi, canhBao: kq.canhBao };
      }

      /* Như route gói C: thiếu `phienBan` ở đường thường là trang bản cũ → 400 `ban-cu`. */
      if (typeof phienBan !== "number") {
        return { loi: "Trang đang mở là bản cũ — tải lại trang rồi làm lại.", maLoi: "ban-cu" };
      }
      const goi = nguoiGoiTu(tt, m.mau, uidNguoiGoi);
      if ("loi" in goi) return { loi: goi.loi };
      const chung = {
        nguoiGoi: goi,
        mauCu: m.mau,
        phienBanGui: phienBan,
        luc,
        capNhatBoi: uidNguoiGoi,
        capNhatBoiTen: goi.nguoiDung.tenHienThi,
      };
      const kq =
        thayDoi === "ve-mac-dinh-toan-bo"
          ? tinhVeMacDinhMauToanBo(chung)
          : tinhLuuMauChucDanh({ ...chung, thayDoi });
      if (!kq.ok) return { loi: kq.error, ...(kq.maLoi ? { maLoi: kq.maLoi } : {}) };
      const loiGhi = ghi({
        mau: kq.mauMoi,
        quyenRieng: tt.quyenRieng,
        lichSu: themLichSu(tt.lichSu, {
          luc,
          ten: goi.nguoiDung.tenHienThi,
          hanhDong: thayDoi === "ve-mac-dinh-toan-bo" ? HANH_DONG_NHAT_KY.veMacDinh : HANH_DONG_NHAT_KY.mau,
          moTa: kq.moTaNhatKy,
        }),
      });
      if (loiGhi) return { loi: loiGhi };
      return { loi: null, phienBan: kq.mauMoi.phienBan, soODoi: kq.soODoi, canhBao: kq.canhBao };
    },

    lichSu: () => docTho().tt.lichSu,

    xoaHet() {
      const kho = boNho();
      if (!kho) return LOI_BO_NHO;
      try {
        kho.removeItem(KHOA_KHO_DEMO_PHAN_QUYEN);
      } catch {
        return LOI_BO_NHO;
      }
      phat();
      return null;
    },
  };
}

let khoDuyNhat: KhoDemoPhanQuyen | null = null;

/**
 * ★ KHO DEMO DUY NHẤT của cả app (tạo lười ở lần gọi đầu) — bổ sung đặc tả D-F1. `nguoi-dung-hien-tai.tsx`
 * và `nguon-phan-quyen.ts` cùng gọi hàm này, nên cùng MỘT danh sách người đăng ký: lưu ở màn Phân quyền là
 * menu / nút / tầng ghi của người đang đăng nhập đổi theo ngay.
 *
 * 🔴 Nơi gọi PHẢI gác `CHE_DO === "mau"` trước khi gọi (bài kiểm-luật canh); gọi với `"sso"` thì ném.
 */
export function layKhoDemo(cheDo: "mau" | "sso"): KhoDemoPhanQuyen {
  if (khoDuyNhat === null || cheDo !== "mau") khoDuyNhat = taoKhoDemo(cheDo);
  return khoDuyNhat;
}
