// ============================================================
// CHUYỂN RUỘT TỆP ĐÍNH KÈM TỪ FIRESTORE SANG CLOUDFLARE R2 — Sếp chốt 21/09/2026
//
// Ghép các mảnh base64 trong `tep/{id}/manh/*` lại thành tệp nguyên vẹn rồi đẩy lên R2.
// KHÔNG xoá gì ở Firestore — bản cũ nằm nguyên làm đường lùi.
//
// ════════════════════════════════════════════════════════════════════════════════════════
// 🔴 MẶC ĐỊNH LÀ CHẠY THỬ — KHÔNG ĐẨY GÌ LÊN R2.
//
//     node di-tru-tep-sang-r2.mjs             → đọc, đếm, in ra, KHÔNG đẩy
//     node di-tru-tep-sang-r2.mjs --ghi-that  → đẩy thật lên R2
//     node di-tru-tep-sang-r2.mjs --doi-chieu → so hai bên theo TỪNG TỆP, không đẩy
// ════════════════════════════════════════════════════════════════════════════════════════
//
// 🔴 ĐỐI CHIẾU THEO CỠ TỆP, KHÔNG CHỈ ĐẾM SỐ LƯỢNG. Bài học ngay trong ngày: bản đối chiếu
// đầu của công cụ tách project chỉ đếm tài liệu cấp gốc, báo "khớp hoàn toàn" trong khi
// thiếu mảnh — phải kiểm tay mới thấy. Ở đây mỗi tệp đều so cỡ byte thật giữa hai bên.
//
// ⚠️ KHÔNG CẦN NGỪNG DỊCH VỤ cho bước đẩy. App vẫn đang đọc Firestore (công tắc
// `NEXT_PUBLIC_KHO_TEP` chưa bật) nên đẩy lên R2 không ảnh hưởng ai. Chỉ lúc BẬT công tắc
// mới cần một nhịp ngắn — và trước đó phải chạy `--doi-chieu` ra sạch.
// ============================================================

import { readFileSync } from "node:fs";
import admin from "firebase-admin";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const GHI_THAT = process.argv.includes("--ghi-that");
const CHI_DOI_CHIEU = process.argv.includes("--doi-chieu");

const XANH = "\x1b[32m";
const DO = "\x1b[31m";
const VANG = "\x1b[33m";
const XAM = "\x1b[90m";
const HET = "\x1b[0m";

const env = readFileSync(".env.local", "utf8");
function bien(ten) {
  for (const d of env.split(/\r?\n/)) {
    if (d.startsWith(ten + "=")) return d.slice(ten.length + 1).trim().replace(/^["']|["']$/g, "");
  }
  return "";
}
function khoa(ten) {
  const v = bien(ten);
  if (!v) return null;
  return JSON.parse(v.startsWith("{") ? v : Buffer.from(v, "base64").toString("utf8"));
}

/* Nguồn: project đang giữ tệp. Sau khi tách project (21/09/2026) đó là `hpcons-thumua`. */
const sa = khoa("THUMUA_FIREBASE_SERVICE_ACCOUNT") ?? khoa("HPCORE_FIREBASE_SERVICE_ACCOUNT");
if (!sa) {
  console.error(`${DO}Thiếu khoá Firebase trong .env.local.${HET}`);
  process.exit(1);
}
for (const t of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"]) {
  if (!bien(t)) {
    console.error(`${DO}Thiếu ${t} trong .env.local — chưa cấu hình kho R2.${HET}`);
    process.exit(1);
  }
}

const db = admin.initializeApp({ credential: admin.credential.cert(sa) }, "nguon").firestore();
const KHO = bien("R2_BUCKET_NAME");
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${bien("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: bien("R2_ACCESS_KEY_ID"), secretAccessKey: bien("R2_SECRET_ACCESS_KEY") },
});

const duongDan = (id) => `tep/${id}`;

/** Ghép các mảnh base64 lại thành tệp nguyên vẹn. `null` khi thiếu mảnh. */
async function ghepTep(id, soManh) {
  const phan = [];
  for (let i = 0; i < soManh; i++) {
    const m = await db.collection("tep").doc(id).collection("manh").doc(String(i)).get();
    if (!m.exists) return null;
    const b64 = m.data()?.b64;
    if (typeof b64 !== "string") return null;
    phan.push(b64);
  }
  return Buffer.from(phan.join(""), "base64");
}

async function coTrenR2(id) {
  try {
    const kq = await r2.send(new HeadObjectCommand({ Bucket: KHO, Key: duongDan(id) }));
    return kq.ContentLength ?? null;
  } catch {
    return null;
  }
}

(async () => {
  console.log(`\n${VANG}═══ CHUYỂN TỆP ĐÍNH KÈM SANG R2 ═══${HET}`);
  console.log(`  Nguồn: Firestore project ${sa.project_id}`);
  console.log(`  Đích : R2 bucket ${KHO}`);
  console.log(`  Chế độ: ${GHI_THAT ? DO + "ĐẨY THẬT" : CHI_DOI_CHIEU ? "chỉ đối chiếu" : XANH + "chạy thử (không đẩy)"}${HET}\n`);

  const ds = await db.collection("tep").get();
  console.log(`  Tổng số tệp trong Firestore: ${ds.size}\n`);

  let xong = 0, boQua = 0, hong = 0, tongByte = 0;
  const loi = [];

  for (const d of ds.docs) {
    const id = d.id;
    const mt = d.data();
    const soManh = Number(mt.soManh ?? 0);
    const ten = String(mt.tenTep ?? id).slice(0, 40);

    if (soManh < 1) { loi.push(`${id} — không ghi soManh`); hong++; continue; }

    if (CHI_DOI_CHIEU) {
      const co = await coTrenR2(id);
      const goc = Number(mt.kichThuoc ?? 0);
      /* 🔴 SO CHÍNH XÁC TỪNG BYTE, và THIẾU `kichThuoc` cũng là lỗi. Bản đầu cho sai số 16 B
         và bỏ qua khi `kichThuoc` bằng 0 — hai chỗ nới đó đều có thể để lọt một tệp hỏng qua
         cổng. Cùng loại sai lầm với bản đối chiếu đầu của công cụ tách project: nới tay ở
         phép kiểm thì phép kiểm mất tác dụng, mà lại không ai biết. */
      if (co === null) { loi.push(`${ten} — CHƯA CÓ trên R2`); hong++; }
      else if (goc <= 0) { loi.push(`${ten} — Firestore không ghi kichThuoc, không đối chiếu được`); hong++; }
      else if (co !== goc) { loi.push(`${ten} — LỆCH CỠ: Firestore ${goc} B, R2 ${co} B`); hong++; }
      else xong++;
      continue;
    }

    /* Đã có trên R2 với đúng cỡ thì bỏ qua — chạy lại lần hai không phải đẩy lại từ đầu. */
    const daCo = await coTrenR2(id);
    const coGoc = Number(mt.kichThuoc ?? 0);
    /* Chỉ bỏ qua khi CHẮC CHẮN đã có bản đúng: cỡ phải khớp từng byte. Không biết cỡ gốc thì
       đẩy lại cho chắc — đẩy thừa chỉ tốn vài giây, bỏ sót thì tệp hỏng nằm im tới lúc ai đó
       cần mở nó. */
    if (daCo !== null && coGoc > 0 && daCo === coGoc) { boQua++; continue; }

    const noi = await ghepTep(id, soManh);
    if (!noi) { loi.push(`${ten} — THIẾU MẢNH (khai ${soManh} mảnh)`); hong++; continue; }

    tongByte += noi.length;
    if (GHI_THAT) {
      try {
        await r2.send(new PutObjectCommand({
          Bucket: KHO, Key: duongDan(id), Body: noi,
          ContentType: String(mt.kieuMime ?? "application/octet-stream"),
        }));
        xong++;
      } catch (e) { loi.push(`${ten} — đẩy hỏng: ${String(e.message).slice(0, 70)}`); hong++; }
    } else xong++;

    if ((xong + boQua + hong) % 25 === 0) {
      process.stdout.write(`\r  ${XAM}Đã xử lý ${xong + boQua + hong}/${ds.size}…${HET}   `);
    }
  }
  process.stdout.write("\n");

  console.log(`\n  ${"Kết quả".padEnd(26)}${"Số tệp".padStart(8)}`);
  console.log(`  ${(CHI_DOI_CHIEU ? "Khớp hai bên" : GHI_THAT ? "Đã đẩy lên R2" : "Sẽ đẩy lên R2").padEnd(26)}${String(xong).padStart(8)}`);
  if (!CHI_DOI_CHIEU) console.log(`  ${"Bỏ qua (đã có sẵn)".padEnd(26)}${String(boQua).padStart(8)}`);
  console.log(`  ${"Có vấn đề".padEnd(26)}${String(hong).padStart(8)}`);
  if (tongByte > 0) console.log(`  ${XAM}Dung lượng xử lý: ${(tongByte / 1024 / 1024).toFixed(1)} MB${HET}`);

  if (loi.length) {
    console.log(`\n  ${DO}Danh sách có vấn đề (${loi.length}):${HET}`);
    for (const x of loi.slice(0, 15)) console.log(`     ${x}`);
    if (loi.length > 15) console.log(`     ${XAM}… và ${loi.length - 15} tệp nữa${HET}`);
  }

  if (!GHI_THAT && !CHI_DOI_CHIEU) {
    console.log(`\n${XANH}Chạy thử xong — chưa đẩy gì lên R2.${HET}`);
    console.log(`${XAM}Muốn đẩy thật:  node di-tru-tep-sang-r2.mjs --ghi-that${HET}\n`);
  } else if (hong === 0) {
    console.log(`\n${XANH}✓ Xong, không tệp nào có vấn đề. Dữ liệu cũ trong Firestore VẪN NGUYÊN.${HET}\n`);
  } else {
    console.log(`\n${DO}✖ Còn ${hong} tệp có vấn đề — CHƯA được bật công tắc NEXT_PUBLIC_KHO_TEP=r2.${HET}\n`);
    process.exit(1);
  }
})().catch((e) => {
  console.error(`\n${DO}Lỗi: ${e.message}${HET}\n`);
  process.exit(1);
});
