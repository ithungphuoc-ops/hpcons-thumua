// ============================================================
// KIỂM RẼ KHO EQUI Ở BA CỬA TIẾP NHẬN — CHẠY THẬT CÁC ROUTE VỚI FIRESTORE GIẢ (Sếp duyệt 14/10/2026)
//
// Route `de-nghi-moi` / `cap-nhat-de-nghi` / `de-nghi-da-xoa` là đường GHI dữ liệu thật; từng có sự cố
// ghi đè mất 76 đề nghị (nhịp 3a). Nên bài này dựng route bằng esbuild, thay Firestore/Next bằng bản giả
// trong bộ nhớ, rồi GỌI THẬT `POST` và đọc lại hai "tài liệu" (kho thường, kho EQUI).
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
const FAKE_FIRESTORE = `
export class FieldPath { constructor(...p){ this.p=p; } }
export const FieldValue = { serverTimestamp: () => "__server_ts__" };
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
        update: (r, ...kv) =>
          ghi.push(() => {
            const cu = sao(store.get(r.key)) ?? {};
            for (let i = 0; i < kv.length; i += 2) {
              const [a, b] = kv[i].p;
              cu[a] = cu[a] ?? {};
              cu[a][b] = sao(kv[i + 1]);
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
console.log(`${XANH}✓ ${dat}/${dat} luật rẽ kho EQUI ở ba cửa tiếp nhận đạt.${HET}`);
