// ============================================================
// ĐO CÁC CỬA API TRÊN BẢN ĐANG CHẠY — CHẠY SAU MỖI LẦN DEPLOY
//
// 🔴 SINH RA TỪ SỰ CỐ 23/08/2026: deploy báo `● Ready`, alias trỏ đúng, `npm run verify` PASS —
//    mà route mới của phiên kia đã bị xoá khỏi production. Không có gì cảnh báo. Cách duy nhất
//    biết được là **gọi thật từng route rồi đọc mã trả về**.
//
// 🔴🔴 KHÔNG ĐO BẰNG MÃ HTTP — ĐO BẰNG "ROUTE CÓ TRẢ LỜI ĐÚNG KIỂU KHÔNG".
//
// Bản đầu của script này chỉ xem mã HTTP và coi `500/502` là hỏng. Nó **báo động sai ngay lần
// chạy đầu**: `/api/qlk-ctr/gui-po` trả `502`, script hô "vừa xoá code của phiên kia" — trong khi
// route đó **chạy hoàn hảo**.
//
// Vì sao: `gui-po` là một PROXY. Nó nhận payload rồi gọi tiếp sang QLK CTR; bên kia trả lỗi thì nó
// bọc lại thành `502` kèm câu lỗi của bên kia. Gọi bằng body rỗng `{}` thì QLK CTR trả *"Thiếu dữ
// liệu bắt buộc"* → `502` là **hành vi đúng theo thiết kế**. Nói cách khác `502` ở đây còn chứng
// minh nhiều hơn `400`: nó cho biết `QLKCTR_API_URL` đã cấu hình và đường sang QLK CTR đang thông.
//
// 👉 CÁCH ĐO ĐÚNG: đọc BODY. Route của app này luôn trả JSON có khoá `ok` (và `error` khi lỗi).
//    · Parse được JSON có `ok`/`error`  → ROUTE SỐNG, bất kể mã là 400/401/405/500/502.
//    · `404`                            → ROUTE KHÔNG CÓ trong bản vừa deploy → vừa xoá code của ai đó.
//    · Không phải JSON (trang HTML lỗi) → hạ tầng hỏng / function crash → xem log Vercel.
//
// 🔴 VÌ SAO PHẢI SỬA CHỨ KHÔNG "ĐỂ TẠM": một chốt báo động sai thì lần thứ hai người ta đã bỏ qua
//    nó. Chốt mất tin cậy còn tệ hơn không có chốt, vì nó tạo cảm giác đã được canh.
//
// ⚠️ DANH SÁCH DƯỚI ĐÂY PHẢI CẬP NHẬT MỖI KHI MỘT PHIÊN THÊM ROUTE MỚI. Bỏ sót một dòng là lần
//    sau không ai biết route đó từng tồn tại — đúng cách sự cố 23/08 lọt qua mọi lớp kiểm.
// ============================================================

const DIA_CHI = process.env.HPCONS_DIA_CHI ?? "https://thumua.hpcore.vn";

/**
 * Mọi cửa API của CẢ HAI PHIÊN.
 *
 * 📌 Ghi rõ `cua` (phiên nào làm) để khi có dòng đỏ thì biết ngay phải báo cho ai.
 */
/**
 * 🔴 PHẢI GHI ĐÚNG PHƯƠNG THỨC CỦA TỪNG ROUTE (`pt`).
 *
 * Bản đầu gọi POST cho tất cả và **báo sai 2 route**: `hpcore-session` và `directory` chỉ export
 * `GET`, nên Next.js trả `405` với body RỖNG — script đọc không thấy JSON và kết luận "function
 * crash". Route hoàn toàn lành; lỗi là ở cách đo.
 *
 * 📌 Lấy `pt` từ chính mã nguồn, đừng đoán:
 *    `grep -oE 'export async function (GET|POST)' app/api/**​/route.ts`
 */
const ROUTE = [
  { duong: "/api/app-request/de-nghi-moi", pt: "POST", cua: "tích hợp", viec: "nhận đề nghị từ App Request" },
  { duong: "/api/qlk-ctr/gui-po", pt: "POST", cua: "tích hợp", viec: "gửi PO sang QLK CTR" },
  { duong: "/api/qlk-ctr/phieu-nhan-moi", pt: "POST", cua: "tích hợp", viec: "nhận phiếu nhận hàng từ QLK CTR" },
  { duong: "/api/auth/hpcore-session", pt: "GET", cua: "tích hợp", viec: "SSO App Tổng" },
  { duong: "/api/directory", pt: "GET", cua: "tích hợp", viec: "danh bạ nhân sự" },
  { duong: "/api/phan-quyen", pt: "POST", cua: "tích hợp", viec: "phân quyền" },
];

const DO = "[31m";
const VANG = "[33m";
const XANH = "[32m";
const XAM = "[90m";
const HET = "[0m";

/**
 * Gọi POST với body rỗng — đủ để biết route có sống, không tạo dữ liệu gì.
 *
 * 📌 Trả về `{ ma, song, vi }`: `song` là kết luận, `vi` là câu giải thích ngắn để in ra.
 */
async function do1(duong, pt) {
  let r;
  try {
    r = await fetch(`${DIA_CHI}${duong}`, {
      method: pt,
      /* GET không được mang body — kèm body là `fetch` ném lỗi ngay. */
      ...(pt === "GET"
        ? {}
        : { headers: { "Content-Type": "application/json" }, body: "{}" }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch (e) {
    return { ma: "—", song: false, vi: `không gọi được (${e.name})` };
  }

  if (r.status === 404) {
    return { ma: 404, song: false, vi: "KHÔNG CÓ route này trong bản đang chạy" };
  }

  if (r.status === 405) {
    /* Route CÓ nhưng không nhận phương thức này → sai bảng `ROUTE`, không phải app hỏng. */
    return { ma: 405, song: false, vi: `route không nhận ${pt} — sửa cột \`pt\` trong bảng ROUTE` };
  }

  const chu = await r.text();
  let than;
  try {
    than = JSON.parse(chu);
  } catch {
    /* Không phải JSON → thường là trang lỗi HTML của hạ tầng, tức function không chạy nổi. */
    return { ma: r.status, song: false, vi: "trả về không phải JSON — function crash?" };
  }

  /* Route của app này luôn trả JSON có `ok`; có `ok` nghĩa là mã của route ĐÃ THỰC THI. */
  if (than && (typeof than.ok === "boolean" || typeof than.error === "string")) {
    return { ma: r.status, song: true, vi: than.error ?? "ok" };
  }
  return { ma: r.status, song: false, vi: "JSON lạ, không có khoá ok/error" };
}

console.log(`\n${XAM}Đo các cửa API trên ${DIA_CHI}${HET}`);
console.log(`${XAM}(đo bằng NỘI DUNG trả về, không bằng mã HTTP — xem chú thích đầu tệp)${HET}\n`);

let soHong = 0;
for (const r of ROUTE) {
  const kq = await do1(r.duong, r.pt);
  if (!kq.song) soHong += 1;
  const dau = kq.song ? `${XANH}✓${HET}` : `${DO}✗${HET}`;
  const mauMa = kq.song ? `${XANH}${kq.ma}${HET}` : `${DO}${kq.ma}${HET}`;
  console.log(
    `${dau} ${r.pt.padEnd(4)} ${String(r.duong).padEnd(32)} ${mauMa}  ${XAM}${r.cua} — ${r.viec}${HET}`,
  );
  /* In câu route tự nói ra — đây mới là bằng chứng nó đang thực thi, không chỉ tồn tại. */
  console.log(`  ${XAM}↳ ${String(kq.vi).slice(0, 88)}${HET}`);
}

console.log("");
if (soHong === 0) {
  console.log(`${XANH}✓ Đủ ${ROUTE.length} cửa API còn sống. Không xoá code của phiên nào.${HET}\n`);
  process.exit(0);
}

console.error(`${DO}${"═".repeat(78)}${HET}`);
console.error(`${DO}  ⛔ ${soHong} CỬA API KHÔNG SỐNG${HET}`);
console.error(`${DO}${"═".repeat(78)}${HET}`);
console.error(`
${VANG}404${HET} → route KHÔNG CÓ trong bản vừa deploy, tức vừa xoá code của phiên kia.
      Lấy code của họ về rồi deploy lại:  ${XAM}npm run deploy${HET}
      (chốt trước deploy sẽ chỉ ra đúng tệp nào còn thiếu)

${VANG}Không phải JSON${HET} → function không chạy nổi (thiếu biến môi trường, lỗi khởi tạo…).
      Xem log:  ${XAM}npx vercel logs ${DIA_CHI}${HET}

📌 ${XAM}Nhắc lại để không bắt oan: mã ${HET}400/401/405/500/502${XAM} mà route vẫn trả JSON có
   khoá ${HET}ok${XAM}/${HET}error${XAM} thì route SỐNG — script đã tính là ✓, không phải lỗi.${HET}

🔴 ${VANG}Đừng để qua đêm.${HET} Phiên kia đang chờ route đó chạy để nối với app QLK CTR.
`);
process.exit(1);
