// ============================================================
// KIỂM RẼ KHO EQUI Ở BA CỬA TIẾP NHẬN — CHẠY THẬT CÁC ROUTE VỚI FIRESTORE GIẢ (Sếp duyệt 14/10/2026)
//
// Route `de-nghi-moi` / `cap-nhat-de-nghi` / `de-nghi-da-xoa` là đường GHI dữ liệu thật; từng có sự cố
// ghi đè mất 76 đề nghị (nhịp 3a). Nên bài này dựng route bằng esbuild, thay Firestore/Next bằng bản giả
// trong bộ nhớ, rồi GỌI THẬT `POST` và đọc lại hai "tài liệu" (kho thường, kho EQUI).
//
// ★ 15/10/2026 (Liên kết mua hàng EQUI): thêm `kiemLienKetMuaHangEqui` — chạy thật `app/api/equi/phieu-nhan-moi`
// (đối chiếu từng bước với route gốc `qlk-ctr/phieu-nhan-moi`) và hai route trung chuyển `app/api/equi/gui-po*`.
//
// ⚠️ Firestore giả KHÔNG thay được Firestore thật (không kiểm rules, giao dịch tranh chấp, giới hạn
// 1MB). Nó chỉ chứng minh LOGIC RẼ KHO. Chạy:  npm run kiem-re-kho-equi
// ============================================================
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const DO = "\u001b[31m", XANH = "\u001b[32m", HET = "\u001b[0m";
const thuMuc = mkdtempSync(join(tmpdir(), "kiem-re-kho-"));

/* ---------- Bản giả ---------- */
/* ★ 15/10/2026 (Liên kết mua hàng EQUI): thêm `delete` / `arrayUnion` — cửa phiếu nhận (`cheDo` cap_nhat /
   xoa) ghi bằng hai lệnh này. Bản giả trả dấu hiệu, `update` của Firestore giả bên dưới thi hành. */
const FAKE_FIRESTORE = `
export class FieldPath { constructor(...p){ this.p=p; } }
export const FieldValue = {
  serverTimestamp: () => "__server_ts__",
  delete: () => ({ __xoa: true }),
  arrayUnion: (...v) => ({ __them: v }),
};
export const getFirestore = () => ({});
export class Timestamp {}
`;
const FAKE_NEXT = `
export class NextRequest {}
export const NextResponse = { json: (body, init) => ({ body, status: (init && init.status) || 200 }) };
export const after = (fn) => { globalThis.__after = globalThis.__after || []; globalThis.__after.push(fn); };
`;
const FAKE_HPCORE = `
export const getThuMuaDb = () => globalThis.__db;
export const getHpcoreDb = () => globalThis.__db;
`;
const FAKE_TB = `
export async function guiDeNghiMoi(prId, pq, kho) { (globalThis.__guiDeNghiMoi = globalThis.__guiDeNghiMoi || []).push({ prId, kho }); }
export async function guiTinTheoMa() {}
export async function guiKhoDaNhan(phieuId, pq, kho) { (globalThis.__guiKhoDaNhan = globalThis.__guiKhoDaNhan || []).push({ phieuId, kho }); }
`;

/* esbuild chạy qua `npx --yes` (như `kiem-luat-dung-chung.mjs`, không thêm phụ thuộc vào package.json) nên
   dùng cờ `--alias` thay cho plugin: mỗi import chạm Firestore/Next/mạng được trỏ sang một tệp giả. */
const tepGia = {
  "firebase-admin/firestore": FAKE_FIRESTORE,
  "firebase-admin/app": "export const cert=()=>({});export const getApps=()=>[];export const initializeApp=()=>({});export const getApp=()=>({});export const deleteApp=async()=>{};",
  "next/server": FAKE_NEXT,
  "server-only": "export {};",
  "@/5-ket-noi/hpcore-may-chu": FAKE_HPCORE,
  "@/5-ket-noi/thong-bao-app-tong-may-chu": FAKE_TB,
  "@/5-ket-noi/phan-quyen-may-chu": "export {};",
};
const aliasFlags = Object.entries(tepGia).map(([ten, nd], i) => {
  const f = join(thuMuc, `gia-${i}.mjs`);
  writeFileSync(f, nd);
  return `--alias:${ten}="${f.split("\\").join("/")}"`;
}).join(" ");

async function dung(nguon, ten) {
  const ra = join(thuMuc, ten);
  execSync(`npx --yes esbuild "${nguon}" --bundle --platform=node --format=cjs --outfile="${ra}" --log-level=error ${aliasFlags}`, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
  return createRequire(import.meta.url)(ra);
}

/* ---------- Firestore giả trong bộ nhớ ---------- */
const sao = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
function taoDb(store) {
  const ref = (col, id) => ({ col, id, key: `${col}/${id}` });
  const snap = (r) => ({ exists: store.has(r.key), id: r.id, data: () => sao(store.get(r.key)) });
  const hopNhat = (cu, moi) => ({ ...(cu ?? {}), ...moi });
  return {
    collection: (col) => ({ doc: (id) => ref(col, id ?? `auto-${Math.random().toString(36).slice(2)}`) }),
    getAll: async (...rs) => rs.filter((r) => r && r.key).map(snap),
    runTransaction: async (fn) => {
      const ghi = [];
      const tx = {
        get: async (r) => snap(r),
        set: (r, d, o) => ghi.push(() => store.set(r.key, o && o.merge ? hopNhat(store.get(r.key), sao(d)) : sao(d))),
        create: (r, d) => ghi.push(() => store.set(r.key, sao(d))),
        /* Đường dẫn: `FieldPath` (bất kỳ số tầng) hoặc tên trường dạng chuỗi. Giá trị: thường, hoặc dấu
           hiệu `delete` / `arrayUnion` của `FieldValue` giả. (Bản trước chỉ nhận FieldPath 2 tầng — mọi
           lời gọi cũ vẫn ra đúng kết quả cũ.) */
        update: (r, ...kv) =>
          ghi.push(() => {
            const cu = sao(store.get(r.key)) ?? {};
            for (let i = 0; i < kv.length; i += 2) {
              const duong = typeof kv[i] === "string" ? kv[i].split(".") : kv[i].p;
              const gt = kv[i + 1];
              let o = cu;
              for (const d of duong.slice(0, -1)) {
                o[d] = o[d] ?? {};
                o = o[d];
              }
              const cuoi = duong[duong.length - 1];
              if (gt && gt.__xoa) delete o[cuoi];
              else if (gt && gt.__them) o[cuoi] = [...(Array.isArray(o[cuoi]) ? o[cuoi] : []), ...sao(gt.__them)];
              else o[cuoi] = sao(gt);
            }
            store.set(r.key, cu);
          }),
      };
      const kq = await fn(tx);
      ghi.forEach((f) => f());
      return kq;
    },
  };
}

const KHO_T = "chay-thu/du-lieu-chung", KHO_E = "chay-thu/du-lieu-equi";
const dsDeNghi = (store, key) => {
  const d = store.get(key)?.deNghi;
  return d == null ? [] : Array.isArray(d) ? d : Object.values(d);
};

let dat = 0;
const hong = [];
const kiem = (ten, ok, ct = "") => {
  if (ok) dat++;
  else hong.push(`${ten} ${ct}`);
};

async function main() {
  process.env.APP_REQUEST_API_KEY = "khoa-thu";
  const MOI = await dung("app/api/app-request/de-nghi-moi/route.ts", "moi.cjs");
  const CAPNHAT = await dung("app/api/app-request/cap-nhat-de-nghi/route.ts", "capnhat.cjs");
  const XOA = await dung("app/api/app-request/de-nghi-da-xoa/route.ts", "xoa.cjs");

  const yeuCau = (body) => ({ json: async () => body, headers: { get: (k) => (k.toLowerCase() === "x-api-key" ? "khoa-thu" : null) } });
  const moiBody = (ma, nhom, them = {}) => ({
    requestCode: ma, requestId: `id-${ma}`, nguoiGuiTen: "A", nguoiGuiEmail: "a@x.vn", ngayGui: "2026-10-14", ngayDuyet: "2026-10-14",
    congTrinhChuoi: "HD01 - Cong trinh thu", loaiDeNghi: "cong_trinh", nguoiTheoDoi: [], phongBan: "Thi cong",
    vatTu: [{ tenVatTu: "Xi mang", dvt: "bao", soLuong: 10 }],
    ...(nhom === undefined ? {} : { nhomDeXuat: nhom }),
    ...them,
  });
  const chay = async (store, fn, body, env = {}) => {
    globalThis.__db = taoDb(store);
    globalThis.__after = [];
    globalThis.__guiDeNghiMoi = [];
    for (const k of ["EQUI_RE_KHO", "EQUI_SO_DAU_NHOM"]) delete process.env[k];
    Object.assign(process.env, env);
    return fn(yeuCau(body));
  };

  const NHOM_E = "1.0. Phiếu đề nghị (EQUI)";
  const NHOM_T = "1.0. Phiếu đề nghị";
  const BAT = { EQUI_RE_KHO: "1" };

  /* 1. công tắc TẮT: nhóm EQUI vẫn vào kho thường (deploy chưa bật thì không đổi gì) */
  {
    const s = new Map();
    const r = await chay(s, MOI.POST, moiBody("100", NHOM_E));
    kiem("tắt: tạo được", r.body.ok === true && r.body.trangThai === "da_tao", JSON.stringify(r.body));
    kiem("tắt: vào kho THƯỜNG", dsDeNghi(s, KHO_T).length === 1 && dsDeNghi(s, KHO_E).length === 0);
    for (const f of globalThis.__after) await f();
    kiem("tắt: thông báo gọi với kho thuong", globalThis.__guiDeNghiMoi.length === 1 && globalThis.__guiDeNghiMoi[0].kho === "thuong", JSON.stringify(globalThis.__guiDeNghiMoi));
  }
  /* 2. công tắc BẬT + nhóm EQUI → kho EQUI */
  {
    const s = new Map();
    const r = await chay(s, MOI.POST, moiBody("101", NHOM_E), BAT);
    kiem("bật+EQUI: tạo được", r.body.ok === true && r.body.trangThai === "da_tao", JSON.stringify(r.body));
    kiem("bật+EQUI: vào kho EQUI", dsDeNghi(s, KHO_E).length === 1 && dsDeNghi(s, KHO_T).length === 0);
    for (const f of globalThis.__after) await f();
    kiem("bật+EQUI: thông báo gọi với kho equi", globalThis.__guiDeNghiMoi.length === 1 && globalThis.__guiDeNghiMoi[0].kho === "equi", JSON.stringify(globalThis.__guiDeNghiMoi));
  }
  /* 3. bật + nhóm thường */
  {
    const s = new Map();
    await chay(s, MOI.POST, moiBody("102", NHOM_T), BAT);
    kiem("bật+thường: vào kho thường", dsDeNghi(s, KHO_T).length === 1 && dsDeNghi(s, KHO_E).length === 0);
  }
  /* 4. bật + EQUI nhưng đã có ở kho thường → ở lại kho thường, không đẻ bản trùng */
  {
    const s = new Map();
    await chay(s, MOI.POST, moiBody("103", NHOM_T), BAT);
    const r = await chay(s, MOI.POST, moiBody("103", NHOM_E), BAT);
    kiem("đã có ở kho thường: trả đã tồn tại", r.body.trangThai === "da_ton_tai", JSON.stringify(r.body));
    kiem("đã có ở kho thường: KHÔNG tạo bản ở EQUI", dsDeNghi(s, KHO_E).length === 0 && dsDeNghi(s, KHO_T).length === 1);
  }
  /* 5. gửi lại cùng đề xuất EQUI → không trùng */
  {
    const s = new Map();
    await chay(s, MOI.POST, moiBody("104", NHOM_E), BAT);
    const r = await chay(s, MOI.POST, moiBody("104", NHOM_E), BAT);
    kiem("gửi lại EQUI: da_ton_tai", r.body.trangThai === "da_ton_tai", JSON.stringify(r.body));
    kiem("gửi lại EQUI: vẫn 1 bản", dsDeNghi(s, KHO_E).length === 1 && dsDeNghi(s, KHO_T).length === 0);
  }
  /* 6. bật + thiếu nhomDeXuat → kho thường (không đoán) */
  {
    const s = new Map();
    await chay(s, MOI.POST, moiBody("105", undefined), BAT);
    kiem("thiếu nhomDeXuat: kho thường", dsDeNghi(s, KHO_T).length === 1 && dsDeNghi(s, KHO_E).length === 0);
  }
  /* 7. nhóm EQUI không liên quan mua hàng (2.0, 9.0) → kho thường */
  for (const nhom of ["2.0. Bảng kê thanh toán (EQUI)", "9.0. Tạm ứng lương (EQUI)"]) {
    const s = new Map();
    await chay(s, MOI.POST, moiBody("106", nhom), BAT);
    kiem(`nhóm EQUI không liên quan mua hàng → kho thường: ${nhom}`, dsDeNghi(s, KHO_T).length === 1 && dsDeNghi(s, KHO_E).length === 0);
  }
  /* 8. đổi cấu hình số đầu */
  {
    const s = new Map();
    await chay(s, MOI.POST, moiBody("107", "2.0. Bảng kê thanh toán (EQUI)"), { EQUI_RE_KHO: "1", EQUI_SO_DAU_NHOM: "2.0" });
    kiem("cấu hình EQUI_SO_DAU_NHOM=2.0 → nhận nhóm 2.0 vào EQUI", dsDeNghi(s, KHO_E).length === 1);
  }
  /* 9. hai kho độc lập */
  {
    const s = new Map();
    await chay(s, MOI.POST, moiBody("108", NHOM_E), BAT);
    await chay(s, MOI.POST, moiBody("109", NHOM_T), BAT);
    kiem("hai kho độc lập: mỗi kho 1 bản, không lẫn", dsDeNghi(s, KHO_E).length === 1 && dsDeNghi(s, KHO_T).length === 1 && dsDeNghi(s, KHO_E)[0].maDeXuatAppRequest === "108");
  }

  /* 10. cap-nhat-de-nghi */
  const capNhat = (ma, loai = "dieu_chinh") => ({ suKienId: `sk-${ma}-${loai}`, requestCode: ma, loai, noiDung: "Doi so luong", nguoi: "B" });
  {
    const s = new Map();
    await chay(s, MOI.POST, moiBody("120", NHOM_E), BAT);
    const truocE = JSON.stringify(dsDeNghi(s, KHO_E));
    const r = await chay(s, CAPNHAT.POST, capNhat("120"), BAT);
    kiem("cập nhật: tìm thấy ở kho EQUI", r.body.ok === true && r.body.trangThai !== "khong_co_de_nghi", JSON.stringify(r.body));
    kiem("cập nhật: kho EQUI đổi, kho thường không có gì", JSON.stringify(dsDeNghi(s, KHO_E)) !== truocE && dsDeNghi(s, KHO_T).length === 0);
    const r2 = await chay(s, CAPNHAT.POST, capNhat("120", "them_file"), {});
    kiem("cập nhật: công tắc TẮT thì không tìm ở EQUI (hành vi cũ)", r2.body.trangThai === "khong_co_de_nghi" || r2.body.ok === false, JSON.stringify(r2.body));
  }
  /* 11. cập nhật cho đề nghị ở kho thường vẫn như cũ khi bật */
  {
    const s = new Map();
    await chay(s, MOI.POST, moiBody("121", NHOM_T), BAT);
    const r = await chay(s, CAPNHAT.POST, capNhat("121"), BAT);
    kiem("cập nhật: đề nghị kho thường vẫn tìm thấy", r.body.ok === true && r.body.trangThai !== "khong_co_de_nghi", JSON.stringify(r.body));
  }
  /* 12. mã không tồn tại ở đâu */
  {
    const s = new Map();
    const r = await chay(s, CAPNHAT.POST, capNhat("999"), BAT);
    kiem("cập nhật: mã không có ở hai kho → khong_co_de_nghi", r.body.trangThai === "khong_co_de_nghi", JSON.stringify(r.body));
  }

  /* 13. de-nghi-da-xoa */
  {
    const s = new Map();
    await chay(s, MOI.POST, moiBody("130", NHOM_E), BAT);
    const r = await chay(s, XOA.POST, { requestCode: "130" }, BAT);
    kiem("xoá: tìm thấy ở EQUI và chuyển trạng thái", r.body.ok === true && r.body.daDoi && r.body.daDoi.length === 1, JSON.stringify(r.body));
    kiem("xoá: đề nghị EQUI đổi trạng thái, kho thường rỗng", !!dsDeNghi(s, KHO_E)[0] && dsDeNghi(s, KHO_E)[0].trangThai !== "da_duyet" && dsDeNghi(s, KHO_T).length === 0, JSON.stringify(dsDeNghi(s, KHO_E)[0] && dsDeNghi(s, KHO_E)[0].trangThai));
    const r2 = await chay(s, XOA.POST, { requestCode: "999" }, BAT);
    kiem("xoá: mã không có → 404", r2.status === 404, JSON.stringify(r2));
  }
  {
    const s = new Map();
    await chay(s, MOI.POST, moiBody("131", NHOM_E), BAT);
    const r = await chay(s, XOA.POST, { requestCode: "131" }, {});
    kiem("xoá: công tắc TẮT → không tìm ở EQUI (hành vi cũ)", r.status === 404, JSON.stringify(r));
  }

  await kiemLienKetMuaHangEqui();
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════
   ★ LIÊN KẾT MUA HÀNG EQUI (Sếp duyệt 15/10/2026) — chạy THẬT các route mới với Firestore giả:
     · `app/api/equi/phieu-nhan-moi` — ghi vào kho EQUI, KHÔNG chạm kho thường; đủ 4 `cheDo`; khoá đóng cổng.
     · Đối chiếu với route GỐC `app/api/qlk-ctr/phieu-nhan-moi` (vùng cấm) trên cùng kịch bản: phiếu ghi ra
       phải giống nhau trừ các chỗ cố ý khác — bản EQUI là bản CHÉP, lệch luật là đỏ.
     · `app/api/equi/gui-po*` — trung chuyển sang `EQUI_API_URL` kèm `EQUI_API_KEY`, không bao giờ sang QLK CTR.
   ════════════════════════════════════════════════════════════════════════════════════════════════ */
async function kiemLienKetMuaHangEqui() {
  const NHAN_E = await dung("app/api/equi/phieu-nhan-moi/route.ts", "nhan-equi.cjs");
  const NHAN_T = await dung("app/api/qlk-ctr/phieu-nhan-moi/route.ts", "nhan-qlk.cjs");
  const GUI_E = await dung("app/api/equi/gui-po/route.ts", "gui-po-equi.cjs");
  const GUI_DL_E = await dung("app/api/equi/gui-po-doc-lap/route.ts", "gui-po-dl-equi.cjs");
  const GUI_T = await dung("app/api/qlk-ctr/gui-po/route.ts", "gui-po-qlk.cjs");

  const KHOA_E = "khoa-equi-thu";
  const yc = (body, khoa) => ({ json: async () => body, headers: { get: (k) => (k.toLowerCase() === "x-api-key" ? khoa ?? null : null) } });
  const BIEN = ["EQUI_PHIEU_NHAN_API_KEY", "QLKCTR_PHIEU_NHAN_API_KEY", "EQUI_API_URL", "EQUI_API_KEY", "QLKCTR_API_URL", "QLKCTR_API_KEY"];
  /* Route in `console.error` khi từ chối có chủ đích (PO không có, nhập vượt…) — nuốt trong lúc chạy cho
     khỏi nhầm là bài kiểm hỏng; kết quả vẫn chấm qua mã trả về. */
  const goiRoute = async (store, fn, body, khoa, env = {}) => {
    globalThis.__db = taoDb(store);
    globalThis.__after = [];
    globalThis.__guiKhoDaNhan = [];
    for (const k of BIEN) delete process.env[k];
    Object.assign(process.env, env);
    const loiGoc = console.error;
    console.error = () => {};
    try {
      const r = await fn(yc(body, khoa));
      for (const f of globalThis.__after) await f();
      return r;
    } finally {
      console.error = loiGoc;
    }
  };
  const ENV_E = { EQUI_PHIEU_NHAN_API_KEY: KHOA_E };

  /* Một PO + đề nghị, dựng ở dạng MAP (như kho production sau đợt 2) hoặc MẢNG (dữ liệu cũ). */
  const poMau = (them = {}) => ({
    id: "po-x-1", code: "DMHEQ260001", prId: "pr-x-1", trangThai: "da_chot", maDuAn: "LOT-01", tenCongTrinh: "Lô 01",
    items: [
      { sttDong: 1, tenVatLieu: "Thép tấm", thongSoKyThuat: "10ly", donViTinh: "kg", khoiLuongDat: 100 },
      { sttDong: 2, tenVatLieu: "Bulong", donViTinh: "bộ", khoiLuongDat: 50 },
    ],
    ...them,
  });
  const dnMau = { id: "pr-x-1", code: "PR-X-1", maDeXuatAppRequest: "000000301", lichSu: [] };
  const tai = (dang, po = poMau()) =>
    dang === "map"
      ? { donHang: { [po.id]: po }, deNghi: { [dnMau.id]: dnMau }, phieuNhan: {} }
      : { donHang: [po], deNghi: [dnMau], phieuNhan: [] };
  const dsPhieu = (store, key) => {
    const p = store.get(key)?.phieuNhan;
    return p == null ? [] : Array.isArray(p) ? p : Object.values(p);
  };
  const dsDon = (store, key) => {
    const p = store.get(key)?.donHang;
    return p == null ? [] : Array.isArray(p) ? p : Object.values(p);
  };
  const thanTao = (them = {}) => ({
    poCode: "DMHEQ260001", maPhieuNhanQlkCtr: "PNVT-260001", ngayNhanThucTe: "2026-10-16", nguoiNhanTen: "Thủ kho EQUI",
    soPhieuGiaoNCC: "PGH-1",
    lines: [{ tenVatLieu: "Thép tấm", khoiLuongThucNhan: 40, thongSoKyThuat: "10ly" }, { tenVatLieu: "Bulong", khoiLuongThucNhan: 50 }],
    anhQlkCtr: { ten: "pgh-1.jpg", url: "https://equi.hpcore.vn/api/files/abc" },
    ...them,
  });
  const lanSua = { thoiDiem: "2026-10-16T09:00:00Z", nguoiSuaTen: "Thủ kho EQUI", lyDo: "Đếm lại", thayDoi: [{ muc: "Số lượng · Thép tấm", truoc: "40 kg", sau: "30 kg" }] };

  /* A. KHOÁ — thiếu khoá thì ĐÓNG (503), sai khoá 401, không ghi gì. */
  {
    const s = new Map([[KHO_E, tai("map")]]);
    const truoc = JSON.stringify([...s]);
    const r1 = await goiRoute(s, NHAN_E.POST, thanTao(), KHOA_E, {});
    kiem("EQUI phiếu nhận: THIẾU EQUI_PHIEU_NHAN_API_KEY → 503 đóng cổng", r1.status === 503 && r1.body.ok === false, JSON.stringify(r1));
    const r2 = await goiRoute(s, NHAN_E.POST, thanTao(), "sai-khoa", ENV_E);
    const r3 = await goiRoute(s, NHAN_E.POST, thanTao(), undefined, ENV_E);
    kiem("EQUI phiếu nhận: sai / thiếu x-api-key → 401", r2.status === 401 && r3.status === 401, JSON.stringify([r2.status, r3.status]));
    /* Khoá của cửa QLK CTR KHÔNG mở được cửa EQUI. */
    const r4 = await goiRoute(s, NHAN_E.POST, thanTao(), "khoa-qlk", { QLKCTR_PHIEU_NHAN_API_KEY: "khoa-qlk" });
    kiem("EQUI phiếu nhận: khoá QLK CTR không mở được cửa EQUI (503 vì EQUI chưa khai khoá)", r4.status === 503);
    kiem("EQUI phiếu nhận: bị chặn thì KHÔNG ghi gì", JSON.stringify([...s]) === truoc);
  }

  /* B. TẠO — vào kho EQUI, kho thường đứng yên tuyệt đối (cùng mã PO ở cả hai kho để chắc không đọc nhầm). */
  for (const dang of ["map", "mang"]) {
    const s = new Map([[KHO_E, tai(dang)], [KHO_T, tai(dang)]]);
    const khoThuongTruoc = JSON.stringify(s.get(KHO_T));
    const r = await goiRoute(s, NHAN_E.POST, thanTao(), KHOA_E, ENV_E);
    const pE = dsPhieu(s, KHO_E);
    kiem(`[${dang}] EQUI tạo: da_tao`, r.status === 200 && r.body.trangThai === "da_tao" && r.body.phieuCode === "DMHEQ260001-DO01", JSON.stringify(r));
    kiem(`[${dang}] EQUI tạo: đúng 1 phiếu trong kho EQUI, mang mã phiếu + ảnh App EQUI`, pE.length === 1 && pE[0].maPhieuNhanQlkCtr === "PNVT-260001" && pE[0].anhQlkCtr?.url === "https://equi.hpcore.vn/api/files/abc" && pE[0].trangThai === "da_nhap_kho" && pE[0].nguoiNhanUid === "app-equi", JSON.stringify(pE));
    kiem(`[${dang}] EQUI tạo: dòng khớp theo tên (+ quy cách)`, JSON.stringify(pE[0]?.lines) === JSON.stringify([{ sttDongPO: 1, khoiLuongThucNhan: 40 }, { sttDongPO: 2, khoiLuongThucNhan: 50 }]), JSON.stringify(pE[0]?.lines));
    kiem(`[${dang}] EQUI tạo: PO kho EQUI da_chot → dang_giao`, dsDon(s, KHO_E)[0]?.trangThai === "dang_giao");
    kiem(`[${dang}] EQUI tạo: kho thường KHÔNG đổi một byte`, JSON.stringify(s.get(KHO_T)) === khoThuongTruoc);
    kiem(`[${dang}] EQUI tạo: chuông "Kho đã nhận" gọi với kho equi`, globalThis.__guiKhoDaNhan.length === 1 && globalThis.__guiKhoDaNhan[0].kho === "equi", JSON.stringify(globalThis.__guiKhoDaNhan));
    /* Gửi lại cùng mã (retry mạng) → da_ton_tai, không thêm phiếu, không báo chuông lần hai. */
    const r2 = await goiRoute(s, NHAN_E.POST, thanTao(), KHOA_E, ENV_E);
    kiem(`[${dang}] EQUI gửi lại cùng mã: da_ton_tai, vẫn 1 phiếu, không báo chuông`, r2.body.trangThai === "da_ton_tai" && dsPhieu(s, KHO_E).length === 1 && globalThis.__guiKhoDaNhan.length === 0, JSON.stringify(r2));
    /* Dò trùng theo cả mã dự phòng. */
    const r3 = await goiRoute(s, NHAN_E.POST, thanTao({ maPhieuNhanQlkCtr: "MA-KHAC", maPhieuDuPhong: ["PNVT-260001"] }), KHOA_E, ENV_E);
    kiem(`[${dang}] EQUI dò trùng theo maPhieuDuPhong`, r3.body.trangThai === "da_ton_tai" && dsPhieu(s, KHO_E).length === 1, JSON.stringify(r3));
  }

  /* C. PO chỉ có ở kho THƯỜNG → cửa EQUI không thấy (không đọc kho thường), kho thường đứng yên. */
  {
    const s = new Map([[KHO_T, tai("map")]]);
    const truoc = JSON.stringify(s.get(KHO_T));
    const r = await goiRoute(s, NHAN_E.POST, thanTao(), KHOA_E, ENV_E);
    const dung = r.status === 500 && /Không tìm thấy/.test(r.body.error ?? "");
    kiem("EQUI: PO chỉ ở kho thường → lỗi không tìm thấy, không ghi kho thường, không tạo gì ở kho EQUI", dung && JSON.stringify(s.get(KHO_T)) === truoc && !s.has(KHO_E), JSON.stringify(r));
  }

  /* D. KIỂM TRA / CẬP NHẬT / XOÁ / 409. */
  {
    const s = new Map([[KHO_E, tai("map")]]);
    await goiRoute(s, NHAN_E.POST, thanTao(), KHOA_E, ENV_E);
    const kt = await goiRoute(s, NHAN_E.POST, { poCode: "DMHEQ260001", maPhieuNhanQlkCtr: "PNVT-260001", cheDo: "kiem_tra", lines: [] }, KHOA_E, ENV_E);
    kiem("EQUI kiem_tra: coPO + coPhieu, chưa xác nhận", kt.body.trangThai === "kiem_tra" && kt.body.coPO === true && kt.body.coPhieu === true && kt.body.daXacNhan === false, JSON.stringify(kt));
    const cn = await goiRoute(s, NHAN_E.POST, thanTao({ cheDo: "cap_nhat", lanSua, lines: [{ tenVatLieu: "Thép tấm", khoiLuongThucNhan: 30, thongSoKyThuat: "10ly" }, { tenVatLieu: "Bulong", khoiLuongThucNhan: 50 }] }), KHOA_E, ENV_E);
    const p = dsPhieu(s, KHO_E);
    kiem("EQUI cap_nhat: da_cap_nhat, số mới, có lịch sử sửa", cn.body.trangThai === "da_cap_nhat" && p.length === 1 && p[0].lines[0].khoiLuongThucNhan === 30 && p[0].lichSuSuaTuKho?.length === 1, JSON.stringify({ cn, p }));
    const ls = (Object.values(s.get(KHO_E).deNghi)[0].lichSu ?? []).map((m) => m.nguoiThucHien);
    kiem("EQUI cap_nhat: lịch sử hồ sơ ghi người sửa \"(App EQUI)\"", ls.some((x) => x === "Thủ kho EQUI (App EQUI)"), JSON.stringify(ls));
    const xoa = await goiRoute(s, NHAN_E.POST, { poCode: "DMHEQ260001", maPhieuNhanQlkCtr: "PNVT-260001", cheDo: "xoa", lines: [], lanSua }, KHOA_E, ENV_E);
    kiem("EQUI xoa: da_xoa, phiếu biến mất, ghi lần giao lớn nhất", xoa.body.trangThai === "da_xoa" && dsPhieu(s, KHO_E).length === 0 && dsDon(s, KHO_E)[0].lanGiaoLonNhatTungCo === 1, JSON.stringify({ xoa, don: dsDon(s, KHO_E)[0] }));
    const lai = await goiRoute(s, NHAN_E.POST, thanTao({ maPhieuNhanQlkCtr: "PNVT-260002", soPhieuGiaoNCC: "PGH-2" }), KHOA_E, ENV_E);
    kiem("EQUI sau khi xoá: phiếu mới mang lần giao 2 (không cấp lại số đã xoá)", lai.body.phieuCode === "DMHEQ260001-DO02", JSON.stringify(lai));
    /* Thu mua đã "Xác nhận nhận hàng" → App EQUI không sửa/xoá được (409). */
    const doc = s.get(KHO_E);
    doc.donHang["po-x-1"].xacNhanKho = { thoiDiem: "2026-10-17", ten: "NV Thu mua", uid: "u1" };
    s.set(KHO_E, doc);
    const truoc409 = JSON.stringify(s.get(KHO_E));
    const c409 = await goiRoute(s, NHAN_E.POST, thanTao({ maPhieuNhanQlkCtr: "PNVT-260002", cheDo: "cap_nhat", lanSua }), KHOA_E, ENV_E);
    const x409 = await goiRoute(s, NHAN_E.POST, { poCode: "DMHEQ260001", maPhieuNhanQlkCtr: "PNVT-260002", cheDo: "xoa", lines: [], lanSua }, KHOA_E, ENV_E);
    kiem("EQUI: đơn đã xác nhận → cap_nhat / xoa đều 409 da_xac_nhan, nói 'App EQUI', không ghi", c409.status === 409 && x409.status === 409 && c409.body.loai === "da_xac_nhan" && /App EQUI/.test(c409.body.error) && JSON.stringify(s.get(KHO_E)) === truoc409, JSON.stringify([c409, x409]));
    const thieuLyDo = await goiRoute(s, NHAN_E.POST, { poCode: "DMHEQ260001", maPhieuNhanQlkCtr: "PNVT-260002", cheDo: "xoa", lines: [] }, KHOA_E, ENV_E);
    const cheDoLa = await goiRoute(s, NHAN_E.POST, thanTao({ cheDo: "abc" }), KHOA_E, ENV_E);
    kiem("EQUI: sửa/xoá thiếu lý do → 400; cheDo lạ → 400", thieuLyDo.status === 400 && cheDoLa.status === 400);
    const vuot = await goiRoute(new Map([[KHO_E, tai("map")]]), NHAN_E.POST, thanTao({ lines: [{ tenVatLieu: "Bulong", khoiLuongThucNhan: 999 }] }), KHOA_E, ENV_E);
    const laMat = await goiRoute(new Map([[KHO_E, tai("map")]]), NHAN_E.POST, thanTao({ lines: [{ tenVatLieu: "Không có", khoiLuongThucNhan: 1 }] }), KHOA_E, ENV_E);
    kiem("EQUI: nhập vượt số còn lại / vật tư lạ → từ chối (luật vuongMac* giữ nguyên)", vuot.status === 500 && /vượt/.test(vuot.body.error) && laMat.status === 500 && /Không khớp/.test(laMat.body.error), JSON.stringify([vuot.body, laMat.body]));
  }

  /* E. ĐỐI CHIẾU VỚI ROUTE GỐC QLK CTR — cùng kịch bản, kho khác: phiếu phải giống nhau trừ chỗ cố ý khác. */
  {
    const sT = new Map([[KHO_T, tai("map")]]);
    const sE = new Map([[KHO_E, tai("map")]]);
    const KHOA_T = "khoa-qlk-thu";
    const ENV_T = { QLKCTR_PHIEU_NHAN_API_KEY: KHOA_T };
    const kichBan = [
      thanTao(),
      thanTao({ maPhieuNhanQlkCtr: "PNVT-260002", soPhieuGiaoNCC: "PGH-2", lines: [{ tenVatLieu: "Thép tấm", khoiLuongThucNhan: 10, thongSoKyThuat: "10ly" }] }),
      thanTao({ cheDo: "cap_nhat", lanSua, lines: [{ tenVatLieu: "Thép tấm", khoiLuongThucNhan: 35, thongSoKyThuat: "10ly", soLuongQuyDoi: 2, dvtQuyDoi: "tấm" }, { tenVatLieu: "Bulong", khoiLuongThucNhan: 50 }] }),
      { poCode: "DMHEQ260001", maPhieuNhanQlkCtr: "PNVT-260002", cheDo: "xoa", lines: [], lanSua },
      thanTao({ maPhieuNhanQlkCtr: "PNVT-260003", soPhieuGiaoNCC: "PGH-3", lines: [{ tenVatLieu: "Thép tấm", khoiLuongThucNhan: 5, thongSoKyThuat: "10ly" }] }),
    ];
    const lech = [];
    for (const [i, than] of kichBan.entries()) {
      const rT = await goiRoute(sT, NHAN_T.POST, than, KHOA_T, ENV_T);
      const rE = await goiRoute(sE, NHAN_E.POST, than, KHOA_E, ENV_E);
      if (rT.status !== rE.status || JSON.stringify(rT.body) !== JSON.stringify(rE.body)) lech.push(`bước ${i + 1}: ${JSON.stringify(rT)} ≠ ${JSON.stringify(rE)}`);
    }
    /* Chỗ cố ý khác: uid người nhận ("qlk-ctr" ↔ "app-equi"). Bỏ ra rồi so cả khối phiếu + đơn. */
    const chuan = (store, key) => JSON.stringify({
      phieu: dsPhieu(store, key).map((p) => ({ ...p, nguoiNhanUid: "_" })).sort((a, b) => a.id.localeCompare(b.id)),
      don: dsDon(store, key),
    });
    kiem("ĐỐI CHIẾU: cùng kịch bản 5 bước → route EQUI trả lời y hệt route gốc QLK CTR", lech.length === 0, lech.join("\n    "));
    kiem("ĐỐI CHIẾU: phiếu + đơn ghi ra y hệt (trừ uid người nhận cố ý khác)", chuan(sT, KHO_T) === chuan(sE, KHO_E), `\n    QLK : ${chuan(sT, KHO_T)}\n    EQUI: ${chuan(sE, KHO_E)}`);
    const lsT = (Object.values(sT.get(KHO_T).deNghi)[0].lichSu ?? []).map((m) => m.nguoiThucHien);
    const lsE = (Object.values(sE.get(KHO_E).deNghi)[0].lichSu ?? []).map((m) => m.nguoiThucHien);
    kiem("ĐỐI CHIẾU: lịch sử cùng số dòng; gốc ghi \"(App Kho)\", EQUI ghi \"(App EQUI)\"", lsT.length === lsE.length && lsT.length > 0 && lsT.every((x) => x.endsWith("(App Kho)")) && lsE.every((x) => x.endsWith("(App EQUI)")), JSON.stringify([lsT, lsE]));
    kiem("ĐỐI CHIẾU: route gốc QLK CTR vẫn chỉ ghi kho thường (không tạo kho EQUI)", !sT.has(KHO_E) && !sE.has(KHO_T));
  }

  /* F. GỬI PO — trung chuyển sang App EQUI (bắt `fetch` ra ngoài). */
  {
    const that = globalThis.fetch;
    const goi = [];
    let traVe = { ok: true, status: 200, json: async () => ({ ok: true, trangThai: "da_tao" }) };
    globalThis.fetch = async (url, opt) => { goi.push({ url: String(url), khoa: opt?.headers?.["x-api-key"], body: opt?.body }); return traVe; };
    try {
      const payload = { maDeXuatAppRequest: "000000301", poIdThuMua: "po-x-1", soPO: "DMHEQ260001", vatTu: [] };
      const r0 = await goiRoute(new Map(), GUI_E.POST, payload, undefined, {});
      kiem("gửi PO EQUI: thiếu EQUI_API_URL → 500 tạm thời, không gọi ra ngoài", r0.status === 500 && r0.body.loaiLoi === "tam_thoi" && /EQUI_API_URL/.test(r0.body.error) && goi.length === 0, JSON.stringify(r0));
      /* Cấu hình QLK CTR có sẵn cũng KHÔNG được dùng cho đường EQUI. */
      const r0b = await goiRoute(new Map(), GUI_E.POST, payload, undefined, { QLKCTR_API_URL: "https://qlkctr.vd", QLKCTR_API_KEY: "khoa-qlk" });
      kiem("gửi PO EQUI: có QLKCTR_API_URL nhưng thiếu EQUI_API_URL → vẫn 500, KHÔNG gửi sang QLK CTR", r0b.status === 500 && goi.length === 0);
      const ENV_G = { EQUI_API_URL: "https://equi.hpcore.vn/", EQUI_API_KEY: "khoa-gui-equi", QLKCTR_API_URL: "https://qlkctr.vd", QLKCTR_API_KEY: "khoa-qlk" };
      const r1 = await goiRoute(new Map(), GUI_E.POST, payload, undefined, ENV_G);
      kiem("gửi PO EQUI → {EQUI_API_URL}/api/app-mua-hang/po-moi, khoá EQUI_API_KEY, body nguyên văn", r1.status === 200 && r1.body.ok === true && goi.length === 1 && goi[0].url === "https://equi.hpcore.vn/api/app-mua-hang/po-moi" && goi[0].khoa === "khoa-gui-equi" && goi[0].body === JSON.stringify(payload), JSON.stringify(goi));
      const r2 = await goiRoute(new Map(), GUI_DL_E.POST, payload, undefined, ENV_G);
      kiem("gửi PO độc lập EQUI → /api/app-mua-hang/po-doc-lap", r2.status === 200 && goi[1]?.url === "https://equi.hpcore.vn/api/app-mua-hang/po-doc-lap" && goi[1]?.khoa === "khoa-gui-equi", JSON.stringify(goi[1]));
      const rT = await goiRoute(new Map(), GUI_T.POST, payload, undefined, ENV_G);
      kiem("route gốc QLK CTR vẫn gửi QLK CTR (không đổi)", rT.status === 200 && goi[2]?.url === "https://qlkctr.vd/api/app-mua-hang/po-moi" && goi[2]?.khoa === "khoa-qlk", JSON.stringify(goi[2]));
      for (const [ten, tv, ma, loai] of [
        ["404 vĩnh viễn", { ok: false, status: 404, json: async () => ({ ok: false, error: "khong_co_de_nghi", loaiLoi: "vinh_vien", trangThai: "khong_co_de_nghi" }) }, 404, "vinh_vien"],
        ["400 không khai loaiLoi", { ok: false, status: 400, json: async () => ({ ok: false, error: "thiếu" }) }, 400, "vinh_vien"],
        ["503 tạm thời", { ok: false, status: 503, json: async () => ({ ok: false, error: "bận", loaiLoi: "tam_thoi" }) }, 502, "tam_thoi"],
        ["HTML lỗi", { ok: false, status: 500, json: async () => { throw new Error("html"); } }, 502, "tam_thoi"],
      ]) {
        traVe = tv;
        const rE = await goiRoute(new Map(), GUI_E.POST, payload, undefined, ENV_G);
        const rQ = await goiRoute(new Map(), GUI_T.POST, payload, undefined, ENV_G);
        kiem(`gửi PO EQUI: ${ten} → ${ma} ${loai}, y hệt bản QLK CTR`, rE.status === ma && rE.body.loaiLoi === loai && JSON.stringify(rE) === JSON.stringify(rQ), `${JSON.stringify(rE)} | ${JSON.stringify(rQ)}`);
      }
      const rx = await goiRoute(new Map(), (q) => GUI_E.POST({ ...q, json: async () => { throw new Error("x"); } }), null, undefined, ENV_G);
      kiem("gửi PO EQUI: body không phải JSON → 400", rx.status === 400);
    } finally {
      globalThis.fetch = that;
    }
  }
}

try {
  await main();
} catch (e) {
  console.error(`${DO}⛔ Kiểm chạy lỗi:${HET}`, e);
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}
rmSync(thuMuc, { recursive: true, force: true });
if (hong.length) {
  console.error(`${DO}⛔ ${hong.length} luật rẽ kho HỎNG:${HET}`);
  for (const h of hong) console.error("  ✗ " + h);
  process.exit(1);
}
console.log(`${XANH}✓ ${dat}/${dat} luật rẽ kho EQUI (ba cửa App Request + liên kết mua hàng EQUI: phiếu nhận, gửi PO) đạt.${HET}`);
