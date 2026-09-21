// ============================================================
// DI TRÚ DỮ LIỆU SANG PROJECT FIREBASE RIÊNG CỦA THU MUA — Sếp chốt 21/09/2026
//
// Chép toàn bộ dữ liệu nghiệp vụ từ project dùng chung `hpcons-portal` sang project riêng
// mới của app Thu mua. KHÔNG đụng tới `users` / `departments` / `app_permissions` — ba khối
// đó do App Tổng sở hữu và ở lại `hpcons-portal` vĩnh viễn.
//
// ════════════════════════════════════════════════════════════════════════════════════════
// 🔴 MẶC ĐỊNH LÀ CHẠY THỬ — KHÔNG GHI GÌ SANG PROJECT MỚI.
//
//     node di-tru-sang-project-rieng.mjs             → đọc, đếm, in ra, KHÔNG ghi
//     node di-tru-sang-project-rieng.mjs --ghi-that  → sao lưu rồi mới ghi
//     node di-tru-sang-project-rieng.mjs --doi-chieu → chỉ so hai bên, không ghi
//
//   Thêm `--don-truoc` để XOÁ dữ liệu cũ ở project đích trước khi chép (xem `donProjectDich`
//   để biết vì sao cần). Một mình nó vẫn là chạy thử; phải đi kèm `--ghi-that` mới xoá thật:
//
//     node di-tru-sang-project-rieng.mjs --don-truoc              → xem sẽ xoá những gì
//     node di-tru-sang-project-rieng.mjs --don-truoc --ghi-that   → dọn rồi chép
//
// Theo đúng lệ của `chuyen-kho-sang-tach.mjs`: ai muốn ghi thật phải gõ thêm một cờ — và gõ
// được cờ đó nghĩa là đã đọc tới dòng này.
// ════════════════════════════════════════════════════════════════════════════════════════
//
// 🔴 KHÔNG XOÁ DỮ LIỆU NGUỒN. Project cũ giữ nguyên làm đường lùi ít nhất một tuần. Hỏng thì
// chỉ cần gỡ biến `THUMUA_FIREBASE_SERVICE_ACCOUNT` và trả sáu biến `NEXT_PUBLIC_FIREBASE_*`
// về giá trị cũ là app chạy lại như chưa có gì (xem đường lùi ở `5-ket-noi/hpcore-may-chu.ts`).
//
// ⚠️ PHẢI CHẠY TRONG CỬA SỔ NGỪNG DỊCH VỤ. Script chép một lần, không theo dõi thay đổi —
// ai nhập liệu trong lúc chép thì bản ghi đó nằm lại project cũ và MẤT sau khi chuyển đổi.
// ============================================================

import { readFileSync, writeFileSync } from "node:fs";
import admin from "firebase-admin";

const GHI_THAT = process.argv.includes("--ghi-that");
const CHI_DOI_CHIEU = process.argv.includes("--doi-chieu");
const DON_TRUOC = process.argv.includes("--don-truoc");

const XANH = "\x1b[32m";
const DO = "\x1b[31m";
const VANG = "\x1b[33m";
const XAM = "\x1b[90m";
const HET = "\x1b[0m";

/* ── Hai chìa khoá: nguồn (project chung) và đích (project riêng) ── */
function docKhoa(ten) {
  const env = readFileSync(".env.local", "utf8");
  for (const d of env.split(/\r?\n/)) {
    if (!d.startsWith(ten + "=")) continue;
    let v = d.slice(ten.length + 1).trim().replace(/^["']|["']$/g, "");
    return JSON.parse(v.startsWith("{") ? v : Buffer.from(v, "base64").toString("utf8"));
  }
  return null;
}

const saNguon = docKhoa("HPCORE_FIREBASE_SERVICE_ACCOUNT");
const saDich = docKhoa("THUMUA_FIREBASE_SERVICE_ACCOUNT");

if (!saNguon) {
  console.error(`${DO}Thiếu HPCORE_FIREBASE_SERVICE_ACCOUNT trong .env.local — không có nguồn để chép.${HET}`);
  process.exit(1);
}
if (!saDich) {
  console.error(`${DO}Thiếu THUMUA_FIREBASE_SERVICE_ACCOUNT trong .env.local.${HET}`);
  console.error(`${XAM}  Đây là khoá Admin SDK của project MỚI. Tạo ở Firebase Console →${HET}`);
  console.error(`${XAM}  Cài đặt project → Tài khoản dịch vụ → Tạo khoá riêng tư mới.${HET}`);
  process.exit(1);
}
if (saNguon.project_id === saDich.project_id) {
  console.error(`${DO}Hai khoá trỏ CÙNG một project (${saNguon.project_id}) — không có gì để di trú.${HET}`);
  process.exit(1);
}

const appNguon = admin.initializeApp({ credential: admin.credential.cert(saNguon) }, "nguon");
const appDich = admin.initializeApp({ credential: admin.credential.cert(saDich) }, "dich");
const dbNguon = appNguon.firestore();
const dbDich = appDich.firestore();

/* ── Những gì phải mang đi. Tên khớp `5-ket-noi/firestore.rules` và `3-du-lieu/duong-dan-tach.ts` ── */
const TAI_LIEU_LE = [{ boSuuTap: "chay-thu", ma: "du-lieu-chung" }];
const BO_SUU_TAP_PHANG = ["tm_denghi", "tm_donhang_gia", "tm_baogia", "tm_thongbao", "tm_caidat", "nguoi-dung"];
/** Có collection con bên trong — phải chép cả ruột, `.get()` ở ngoài KHÔNG lấy được. */
const BO_SUU_TAP_CO_RUOT = [
  { ten: "tm_donhang", ruot: ["nhanhang"] },
  { ten: "tep", ruot: ["manh"] },
];

/**
 * Dọn sạch dữ liệu CŨ ở project ĐÍCH trước khi chép.
 *
 * 🔴 VÌ SAO CẦN: project `hpcons-thumua` còn nguyên dữ liệu chạy thử từ 20/08/2026 — ngày app
 * chuyển sang dùng chung `hpcons-portal` và bỏ project này lại. Đo ngày 21/09/2026: 11 hồ sơ
 * `nguoi-dung` + 33 tệp + 1 tài liệu `chay-thu/du-lieu-chung`, và **KHÔNG id nào trùng** với
 * production. Nghĩa là chép đè lên KHÔNG xoá được chúng — chúng sót lại lẫn vào dữ liệu thật.
 *
 * Nguy nhất là `nguoi-dung`: 11 hồ sơ đó gồm ba tài khoản `capTM=4` (quyền cao nhất) mang
 * email giả `@thumua-chaythu.hpcons`. Để lẫn thì màn "Phân quyền người dùng" bày ra 25 người
 * thay vì 14, và ba dòng quyền cao nhất là tài khoản không có thật.
 *
 * ⚠️ XOÁ KHÔNG LÙI ĐƯỢC. Chỉ động vào project ĐÍCH, không bao giờ đụng nguồn.
 */
async function donProjectDich() {
  const cacKhoi = [
    ...BO_SUU_TAP_PHANG,
    ...BO_SUU_TAP_CO_RUOT.map((x) => x.ten),
  ];
  const daXoa = [];

  for (const { boSuuTap, ma } of TAI_LIEU_LE) {
    const snap = await dbDich.collection(boSuuTap).doc(ma).get();
    if (snap.exists) daXoa.push({ duongDan: snap.ref.path, data: snap.data() });
  }
  for (const ten of cacKhoi) {
    const snap = await dbDich.collection(ten).get();
    for (const d of snap.docs) {
      daXoa.push({ duongDan: d.ref.path, data: d.data() });
      const ruot = BO_SUU_TAP_CO_RUOT.find((x) => x.ten === ten)?.ruot ?? [];
      for (const conName of ruot) {
        const con = await dbDich.collection(ten).doc(d.id).collection(conName).get();
        for (const c of con.docs) daXoa.push({ duongDan: c.ref.path, data: c.data() });
      }
    }
  }

  if (daXoa.length === 0) {
    console.log(`  ${XAM}Project đích đã sạch — không có gì để dọn.${HET}`);
    return 0;
  }

  if (!GHI_THAT) {
    console.log(`  ${VANG}Sẽ xoá ${daXoa.length} tài liệu cũ ở ${saDich.project_id} (chạy thử — chưa xoá).${HET}`);
    return daXoa.length;
  }

  const tenTep = `sao-luu-truoc-di-tru-${new Date().toISOString().replace(/[:.]/g, "-")}-DA-XOA.json`;
  writeFileSync(tenTep, JSON.stringify(daXoa, null, 2), "utf8");
  console.log(`  ${XAM}Đã sao lưu ${daXoa.length} tài liệu sắp xoá ra ${tenTep}.${HET}`);

  for (let i = 0; i < daXoa.length; i += 400) {
    const lo = dbDich.batch();
    for (const { duongDan } of daXoa.slice(i, i + 400)) lo.delete(dbDich.doc(duongDan));
    await lo.commit();
  }
  console.log(`  ${XANH}Đã dọn ${daXoa.length} tài liệu cũ.${HET}`);
  return daXoa.length;
}

/**
 * Xoá tài khoản Auth chạy thử còn sót ở project đích.
 * Ngày 21/09/2026 project mới có 11 tài khoản email/mật khẩu `@thumua-chaythu.hpcons`. Cách
 * đăng nhập bằng mật khẩu đã bị TẮT ở Console (đã kiểm: API trả `PASSWORD_LOGIN_DISABLED`),
 * nên chúng không còn vào được — nhưng vẫn nên dọn để danh sách người dùng khỏi lẫn.
 * Chỉ xoá tài khoản mang tên miền chạy thử, KHÔNG đụng tài khoản thật.
 */
const DUOI_EMAIL_CHAY_THU = "@thumua-chaythu.hpcons";
async function donTaiKhoanChayThu() {
  const { getAuth } = await import("firebase-admin/auth");
  const auth = getAuth(appDich);
  const r = await auth.listUsers(1000);
  const canXoa = r.users.filter((u) => (u.email ?? "").endsWith(DUOI_EMAIL_CHAY_THU));
  const giuLai = r.users.length - canXoa.length;

  if (canXoa.length === 0) {
    console.log(`  ${XAM}Không có tài khoản chạy thử nào để dọn.${HET}`);
    return 0;
  }
  if (!GHI_THAT) {
    console.log(`  ${VANG}Sẽ xoá ${canXoa.length} tài khoản ${DUOI_EMAIL_CHAY_THU} (giữ lại ${giuLai} tài khoản khác).${HET}`);
    return canXoa.length;
  }
  await auth.deleteUsers(canXoa.map((u) => u.uid));
  console.log(`  ${XANH}Đã xoá ${canXoa.length} tài khoản chạy thử (giữ lại ${giuLai}).${HET}`);
  return canXoa.length;
}

/** Ghi theo lô 400 — Firestore chặn ở 500 thao tác mỗi lô. */
async function ghiTheoLo(ban) {
  for (let i = 0; i < ban.length; i += 400) {
    const lo = dbDich.batch();
    for (const { ref, data } of ban.slice(i, i + 400)) lo.set(ref, data);
    await lo.commit();
  }
}

async function chep() {
  const banGhi = [];
  const thongKe = [];

  for (const { boSuuTap, ma } of TAI_LIEU_LE) {
    const snap = await dbNguon.collection(boSuuTap).doc(ma).get();
    if (!snap.exists) { thongKe.push([`${boSuuTap}/${ma}`, 0, "KHÔNG CÓ ở nguồn"]); continue; }
    const kb = Math.round(Buffer.byteLength(JSON.stringify(snap.data()), "utf8") / 1024);
    banGhi.push({ ref: dbDich.collection(boSuuTap).doc(ma), data: snap.data() });
    thongKe.push([`${boSuuTap}/${ma}`, 1, `~${kb} KB`]);
  }

  for (const ten of BO_SUU_TAP_PHANG) {
    const snap = await dbNguon.collection(ten).get();
    for (const d of snap.docs) banGhi.push({ ref: dbDich.collection(ten).doc(d.id), data: d.data() });
    thongKe.push([ten, snap.size, ""]);
  }

  for (const { ten, ruot } of BO_SUU_TAP_CO_RUOT) {
    const snap = await dbNguon.collection(ten).get();
    let demRuot = 0;
    for (const d of snap.docs) {
      banGhi.push({ ref: dbDich.collection(ten).doc(d.id), data: d.data() });
      for (const conName of ruot) {
        const con = await dbNguon.collection(ten).doc(d.id).collection(conName).get();
        for (const c of con.docs) {
          banGhi.push({ ref: dbDich.collection(ten).doc(d.id).collection(conName).doc(c.id), data: c.data() });
          demRuot++;
        }
      }
    }
    thongKe.push([ten, snap.size, `+ ${demRuot} tài liệu con`]);
  }

  return { banGhi, thongKe };
}

async function demHaiBen() {
  const ten = [...BO_SUU_TAP_PHANG, ...BO_SUU_TAP_CO_RUOT.map((x) => x.ten)];
  console.log(`\n  ${"Khối dữ liệu".padEnd(18)}${"Nguồn".padStart(8)}${"Đích".padStart(8)}   Kết quả`);
  let lech = 0;
  for (const t of ten) {
    const [a, b] = await Promise.all([
      dbNguon.collection(t).count().get(),
      dbDich.collection(t).count().get(),
    ]);
    const x = a.data().count, y = b.data().count;
    if (x !== y) lech++;
    console.log(`  ${t.padEnd(18)}${String(x).padStart(8)}${String(y).padStart(8)}   ${x === y ? XANH + "khớp" : DO + "LỆCH"}${HET}`);
  }
  return lech;
}

(async () => {
  console.log(`\n${VANG}═══ DI TRÚ SANG PROJECT RIÊNG ═══${HET}`);
  console.log(`  Nguồn: ${saNguon.project_id}`);
  console.log(`  Đích : ${saDich.project_id}`);
  console.log(`  Chế độ: ${GHI_THAT ? DO + "GHI THẬT" : CHI_DOI_CHIEU ? "chỉ đối chiếu" : XANH + "chạy thử (không ghi)"}${HET}`);

  if (CHI_DOI_CHIEU) {
    const lech = await demHaiBen();
    console.log(lech === 0 ? `\n${XANH}✓ Hai bên khớp nhau hoàn toàn.${HET}\n` : `\n${DO}✖ Có ${lech} khối lệch — CHƯA được chuyển đổi.${HET}\n`);
    process.exit(lech === 0 ? 0 : 1);
  }

  if (DON_TRUOC) {
    console.log(`\n${VANG}── DỌN DỮ LIỆU CŨ Ở PROJECT ĐÍCH ──${HET}`);
    await donProjectDich();
    await donTaiKhoanChayThu();
  }

  const { banGhi, thongKe } = await chep();
  console.log(`\n  ${"Khối dữ liệu".padEnd(24)}${"Số tài liệu".padStart(12)}   Ghi chú`);
  for (const [ten, so, note] of thongKe) console.log(`  ${ten.padEnd(24)}${String(so).padStart(12)}   ${XAM}${note}${HET}`);
  console.log(`\n  ${VANG}Tổng cộng phải ghi: ${banGhi.length} tài liệu${HET}`);

  if (!GHI_THAT) {
    console.log(`\n${XANH}Chạy thử xong — chưa ghi gì sang project mới.${HET}`);
    console.log(`${XAM}Muốn ghi thật:  node di-tru-sang-project-rieng.mjs --ghi-that${HET}\n`);
    return;
  }

  const tenTep = `sao-luu-truoc-di-tru-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(tenTep, JSON.stringify(banGhi.map((b) => ({ duongDan: b.ref.path, data: b.data })), null, 2), "utf8");
  console.log(`\n  ${XAM}Đã sao lưu ra ${tenTep} (tệp này CHỨA DỮ LIỆU THẬT — đừng commit).${HET}`);

  await ghiTheoLo(banGhi);
  console.log(`  ${XANH}Đã ghi ${banGhi.length} tài liệu sang ${saDich.project_id}.${HET}`);

  const lech = await demHaiBen();
  console.log(lech === 0
    ? `\n${XANH}✓ Di trú xong, hai bên khớp nhau. Dữ liệu cũ VẪN NGUYÊN làm đường lùi.${HET}\n`
    : `\n${DO}✖ Còn ${lech} khối lệch — kiểm lại trước khi chuyển đổi.${HET}\n`);
  process.exit(lech === 0 ? 0 : 1);
})().catch((e) => {
  console.error(`\n${DO}Lỗi: ${e.message}${HET}\n`);
  process.exit(1);
});
