// ============================================================
// CHUYỂN KHO CHUNG SANG CẤU TRÚC TÁCH — bước 2 của kế hoạch (Sếp duyệt 16/09/2026)
//
// Chép từng đề nghị / đơn hàng / báo giá… từ tài liệu chung `chay-thu/du-lieu-chung` sang tài
// liệu riêng của nó trong các collection `tm_*` (tên lấy đúng theo `5-ket-noi/firestore.rules`).
//
// ════════════════════════════════════════════════════════════════════════════════════════
// 🔴 MẶC ĐỊNH LÀ CHẠY THỬ — KHÔNG GHI GÌ LÊN MÁY CHỦ.
//
//     node chuyen-kho-sang-tach.mjs            → đọc, đối chiếu, in ra, KHÔNG ghi
//     node chuyen-kho-sang-tach.mjs --ghi-that → sao lưu rồi mới ghi
//
// Đặt mặc định ở phía an toàn là cố ý: lệnh này ghi hàng trăm tài liệu, gõ nhầm một lần là
// không lùi được bằng Ctrl+Z. Ai muốn ghi thật thì phải gõ thêm một cờ — và gõ được cờ đó
// nghĩa là đã đọc tới dòng này.
// ════════════════════════════════════════════════════════════════════════════════════════
//
// 🔴 KHÔNG XOÁ TÀI LIỆU CŨ. Nó nằm nguyên đó làm đường lùi, ít nhất một tuần (Sếp chốt
// 16/09/2026). Hỏng thì chỉ cần đổi tầng đồng bộ về bản cũ là app chạy lại như chưa có gì.
// ============================================================

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import admin from "firebase-admin";

const GHI_THAT = process.argv.includes("--ghi-that");

const XANH = "\x1b[32m";
const DO = "\x1b[31m";
const VANG = "\x1b[33m";
const XAM = "\x1b[90m";
const HET = "\x1b[0m";

/* ── Khoá: cùng nguồn với app, đọc từ .env.local ── */
const env = readFileSync(".env.local", "utf8");
let sa = null;
for (const d of env.split(/\r?\n/)) {
  if (d.startsWith("HPCORE_FIREBASE_SERVICE_ACCOUNT=")) {
    sa = JSON.parse(d.slice("HPCORE_FIREBASE_SERVICE_ACCOUNT=".length).trim().replace(/^"|"$/g, ""));
  }
}
if (!sa) {
  console.error(`${DO}⛔ Không đọc được HPCORE_FIREBASE_SERVICE_ACCOUNT trong .env.local${HET}`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

/* ── Bản đồ nhóm → collection mới + cách lấy khoá.
     🔴 PHẢI KHỚP TỪNG CHỮ với `DUONG_DAN_TACH` và `LAY_KHOA` trong
     `3-du-lieu/kho-chung-tach.ts`. Lệch một chữ là app ghi vào chỗ này mà đọc chỗ khác — dữ
     liệu vẫn còn nguyên nhưng app thấy kho rỗng. ── */
const NHOM = [
  { ten: "deNghi", col: "tm_denghi", khoa: (x) => x.id },
  { ten: "donHang", col: "tm_donhang", khoa: (x) => x.id },
  { ten: "giaDonHang", col: "tm_donhang_gia", khoa: (x) => x.poId },
  { ten: "baoGia", col: "tm_baogia", khoa: (x) => x.id },
  { ten: "thongBao", col: "tm_thongbao", khoa: (x) => x.id },
];

/** Phiếu nhận LỒNG trong đơn: `tm_donhang/{poId}/nhanhang/{id}` — Sếp chốt 16/09/2026. */
const PHIEU_NHAN = { ten: "phieuNhan", trongDon: "nhanhang" };

/** Bốn khoá cài đặt gom vào một tài liệu `tm_caidat/chung`. */
const KHOA_CAI_DAT = ["cauHinh", "lichSuCauHinh", "nhaCungCapThem", "thuKhoThem"];

/** Firestore cho tối đa 500 thao tác mỗi lô. Chia 400 cho chắc. */
const CO_LO = 400;

/** Gom phiếu nhận theo đơn, bỏ phiếu không biết thuộc đơn nào. */
function gomPhieuTheoDon(mang) {
  const theoDon = new Map();
  const hong = [];
  for (const x of mang) {
    if (!x.poId || !x.id) {
      hong.push(`phieuNhan: thiếu ${!x.poId ? "poId" : "id"} — ${JSON.stringify(x).slice(0, 80)}`);
      continue;
    }
    if (!theoDon.has(x.poId)) theoDon.set(x.poId, []);
    theoDon.get(x.poId).push(x);
  }
  return { theoDon, hong };
}

(async () => {
  console.log(`${XAM}Project:${HET} ${sa.project_id}`);
  console.log(
    GHI_THAT
      ? `${VANG}CHẾ ĐỘ: GHI THẬT — sẽ sao lưu trước rồi mới ghi.${HET}\n`
      : `${XANH}CHẾ ĐỘ: CHẠY THỬ — chỉ đọc và đối chiếu, KHÔNG ghi gì.${HET}\n`,
  );

  /* ── ① Đọc tài liệu cũ ── */
  const snap = await db.collection("chay-thu").doc("du-lieu-chung").get();
  if (!snap.exists) {
    console.error(`${DO}⛔ Không có tài liệu chay-thu/du-lieu-chung — dừng.${HET}`);
    process.exit(1);
  }
  const cu = snap.data();
  const mocCu = snap.updateTime.toDate().toISOString();
  console.log(`${XAM}Tài liệu cũ ghi lần cuối:${HET} ${mocCu}\n`);

  /* ── ② Đếm và soát khoá TRƯỚC khi ghi bất cứ thứ gì ── */
  console.log("=== SẼ CHÉP ===");
  const keHoach = [];
  let tongBanGhi = 0;
  const loiKhoa = [];

  for (const n of NHOM) {
    const mang = Array.isArray(cu[n.ten]) ? cu[n.ten] : [];
    const daGap = new Set();
    const hopLe = [];
    for (const x of mang) {
      const k = n.khoa(x);
      if (!k || typeof k !== "string") {
        loiKhoa.push(`${n.ten}: một bản ghi KHÔNG CÓ khoá — ${JSON.stringify(x).slice(0, 90)}`);
        continue;
      }
      if (daGap.has(k)) {
        loiKhoa.push(`${n.ten}: khoá TRÙNG "${k}" — hai bản ghi cùng khoá sẽ đè nhau`);
        continue;
      }
      daGap.add(k);
      hopLe.push({ khoa: k, ban: x });
    }
    keHoach.push({ ...n, hopLe });
    tongBanGhi += hopLe.length;
    console.log(
      `  ${n.col.padEnd(18)} ${String(hopLe.length).padStart(4)} bản ghi` +
        (hopLe.length !== mang.length ? `  ${DO}(bỏ ${mang.length - hopLe.length})${HET}` : ""),
    );
  }

  /* Phiếu nhận: LỒNG trong đơn nên đếm riêng, và phải có `poId` mới biết lồng vào đâu. */
  const { theoDon: phieuTheoDon, hong: phieuHong } = gomPhieuTheoDon(
    Array.isArray(cu.phieuNhan) ? cu.phieuNhan : [],
  );
  const soPhieu = [...phieuTheoDon.values()].reduce((t, v) => t + v.length, 0);
  loiKhoa.push(...phieuHong);
  console.log(
    `  ${"tm_donhang/*/nhanhang".padEnd(18)} ${String(soPhieu).padStart(4)} bản ghi` +
      ` ${XAM}(lồng trong ${phieuTheoDon.size} đơn)${HET}`,
  );
  tongBanGhi += soPhieu;

  const caiDat = {};
  for (const k of KHOA_CAI_DAT) if (cu[k] !== undefined) caiDat[k] = cu[k];
  console.log(
    `  ${"tm_caidat/chung".padEnd(18)} ${String(Object.keys(caiDat).length).padStart(4)} khoá` +
      ` ${XAM}(${Object.keys(caiDat).join(", ") || "trống"})${HET}`,
  );
  console.log(`\n  ${XAM}Tổng: ${tongBanGhi} bản ghi + 1 tài liệu cài đặt${HET}`);

  /* ── ③ Có bản ghi hỏng thì DỪNG, đừng chép nửa vời ── */
  if (loiKhoa.length > 0) {
    console.error(`\n${DO}⛔ ${loiKhoa.length} BẢN GHI CÓ VẤN ĐỀ VỀ KHOÁ:${HET}`);
    for (const d of loiKhoa) console.error(`  ${DO}·${HET} ${d}`);
    console.error(
      `\n${VANG}Dừng lại, KHÔNG chép gì. Bản ghi thiếu khoá hoặc trùng khoá mà cứ chép là mất\n` +
        `dữ liệu im lặng — bản sau đè bản trước và không ai biết.${HET}\n`,
    );
    process.exit(1);
  }

  /* ── ④ Xem chỗ mới đã có gì chưa ── */
  console.log("\n=== CHỖ MỚI ĐANG CÓ GÌ ===");
  let daCoGi = false;
  for (const n of keHoach) {
    const c = (await db.collection(n.col).count().get()).data().count;
    if (c > 0) daCoGi = true;
    console.log(`  ${n.col.padEnd(18)} ${String(c).padStart(4)} bản ghi`);
  }
  if (daCoGi) {
    console.log(
      `\n${VANG}⚠️ Chỗ mới ĐÃ CÓ dữ liệu. Chạy lại sẽ ghi đè bản ghi cùng khoá (không xoá bản lạ).${HET}`,
    );
  }

  if (!GHI_THAT) {
    console.log(
      `\n${XANH}✓ Chạy thử xong, KHÔNG ghi gì cả.${HET}\n` +
        `${XAM}  Muốn chép thật:  node chuyen-kho-sang-tach.mjs --ghi-that${HET}\n`,
    );
    process.exit(0);
  }

  /* ── ⑤ Sao lưu NGAY TRƯỚC KHI GHI — không dùng bản sao lưu cũ, dữ liệu có thể đã đổi ── */
  const tenSaoLuu = join(
    process.cwd(),
    `sao-luu-truoc-khi-tach-${mocCu.replace(/[:.]/g, "-")}.json`,
  );
  writeFileSync(tenSaoLuu, JSON.stringify({ updateTime: mocCu, data: cu }, null, 1), "utf8");
  console.log(`\n${XANH}① Đã sao lưu:${HET} ${tenSaoLuu}`);

  /* ── ⑥ Chép, chia lô ── */
  console.log(`${XANH}② Đang chép…${HET}`);
  for (const n of keHoach) {
    for (let i = 0; i < n.hopLe.length; i += CO_LO) {
      const lo = n.hopLe.slice(i, i + CO_LO);
      const batch = db.batch();
      for (const v of lo) batch.set(db.collection(n.col).doc(v.khoa), v.ban);
      await batch.commit();
    }
    console.log(`   ${n.col.padEnd(18)} xong ${n.hopLe.length}`);
  }
  /* Phiếu nhận — lồng vào đúng đơn của nó. */
  if (soPhieu > 0) {
    const batch = db.batch();
    let n = 0;
    for (const [poId, ds] of phieuTheoDon) {
      for (const x of ds) {
        batch.set(db.collection("tm_donhang").doc(poId).collection("nhanhang").doc(x.id), x);
        n += 1;
      }
    }
    await batch.commit();
    console.log(`   ${"tm_donhang/*/nhanhang".padEnd(18)} xong ${n}`);
  }

  if (Object.keys(caiDat).length > 0) {
    await db.collection("tm_caidat").doc("chung").set(caiDat);
    console.log(`   ${"tm_caidat/chung".padEnd(18)} xong`);
  }

  /* ── ⑦ ĐỐI CHIẾU LẠI — bước này bắt buộc, đừng bỏ ── */
  console.log(`\n${XANH}③ Đối chiếu số lượng${HET}`);
  let lech = 0;
  for (const n of keHoach) {
    const thuc = (await db.collection(n.col).count().get()).data().count;
    const khop = thuc === n.hopLe.length;
    if (!khop) lech += 1;
    console.log(
      `   ${n.col.padEnd(18)} chép ${String(n.hopLe.length).padStart(4)} · trên máy chủ ${String(thuc).padStart(4)}  ` +
        (khop ? `${XANH}khớp${HET}` : `${DO}LỆCH${HET}`),
    );
  }

  if (soPhieu > 0) {
    const thuc = (await db.collectionGroup("nhanhang").count().get()).data().count;
    const khop = thuc === soPhieu;
    if (!khop) lech += 1;
    console.log(
      `   ${"tm_donhang/*/nhanhang".padEnd(18)} chép ${String(soPhieu).padStart(4)} · trên máy chủ ${String(thuc).padStart(4)}  ` +
        (khop ? `${XANH}khớp${HET}` : `${DO}LỆCH${HET}`),
    );
  }

  console.log("");
  if (lech > 0) {
    console.error(
      `${DO}⛔ CÓ ${lech} NHÓM LỆCH SỐ LƯỢNG — ĐỪNG BẬT CẤU TRÚC MỚI.${HET}\n` +
        `${VANG}   Tài liệu cũ vẫn còn nguyên, app vẫn đang chạy trên nó. Không mất gì.${HET}\n`,
    );
    process.exit(1);
  }
  console.log(
    `${XANH}✓ Chép xong, số lượng khớp hết.${HET}\n` +
      `${XAM}  Tài liệu cũ VẪN CÒN NGUYÊN — giữ một tuần làm đường lùi (Sếp chốt 16/09/2026).${HET}\n`,
  );
  process.exit(0);
})().catch((e) => {
  console.error(`${DO}⛔ LỖI:${HET}`, e.message);
  process.exit(1);
});
