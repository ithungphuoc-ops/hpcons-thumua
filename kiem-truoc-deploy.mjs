// ============================================================
// CHỐT CHẶN TRƯỚC KHI DEPLOY — KHÔNG CHO ĐÈ CODE CỦA PHIÊN KIA
//
// 🔴 SINH RA TỪ SỰ CỐ THẬT 23/08/2026. Hai phiên Claude Code làm song song, cùng deploy tay bằng
//    `vercel --prod` lên MỘT project Vercel từ HAI bản mã nguồn khác nhau. `vercel --prod` **thay
//    toàn bộ production**, không trộn, không cảnh báo — nên người deploy sau luôn xoá tính năng mà
//    người deploy trước vừa đưa lên. Hôm đó route mới của phiên tích hợp
//    (`/api/qlk-ctr/phieu-nhan-moi`) bị xoá khỏi production **12 lần trong một buổi** trước khi có
//    người phát hiện.
//
// ⚠️ KHÔNG CÓ DẤU HIỆU NÀO CẢNH BÁO: deploy báo `● Ready`, alias trỏ đúng, `npm run verify` PASS —
//    chỉ là route của phiên kia im lặng biến mất.
//
// 🔴 VÌ SAO PHẢI LÀ SCRIPT, KHÔNG PHẢI MỘT DÒNG TRONG CLAUDE.md: một quy tắc chỉ ghi ra giấy thì
//    phụ thuộc việc người deploy nhớ đọc và làm đủ. Sự cố xảy ra đúng vì không có gì BẮT BUỘC.
//    Script này chạy trước mọi `npm run deploy` và **chặn thật** nếu chưa trộn.
//
// ⚠️ GIỚI HẠN — PHẢI BIẾT: chốt này chỉ chặn `npm run deploy`. Ai gọi thẳng `npx vercel --prod`
//    thì vẫn lọt. Muốn chặn hoàn toàn thì phải nối project Vercel với GitHub (xem CLAUDE.md §6.6)
//    — khi đó Vercel tự từ chối mọi deploy từ dòng lệnh.
// ============================================================

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Bản sao CHỈ-CÓ-MÃ-NGUỒN dùng làm cầu sang GitHub.
 *
 * 🔴 KHÔNG so trực tiếp lịch sử repo gốc với GitHub được: repo GitHub là `git subtree split` của
 * `thumua-v1`, nên nó có **chuỗi commit khác hoàn toàn** (SHA khác, dù nội dung cùng gốc). So SHA
 * là luôn lệch, so nội dung mới đúng — nên phải đi qua bản sao này.
 *
 * 📌 Cho phép đặt lại bằng biến môi trường để phiên kia (máy khác, đường dẫn khác) dùng được.
 */
const BAN_SAO =
  process.env.HPCONS_REPO_MA_NGUON ?? "C:/Users/trand/hpcons-thumua-github";

const DO = "\u001b[31m";
const VANG = "\u001b[33m";
const XANH = "\u001b[32m";
const XAM = "\u001b[90m";
const HET = "\u001b[0m";

function chay(lenh, o) {
  return execSync(lenh, { cwd: o, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function dung(tieuDe, dong) {
  console.error(`\n${DO}${"═".repeat(78)}${HET}`);
  console.error(`${DO}  ⛔ CHẶN DEPLOY — ${tieuDe}${HET}`);
  console.error(`${DO}${"═".repeat(78)}${HET}\n`);
  for (const d of dong) console.error(d);
  console.error("");
  process.exit(1);
}

/* ---------- 1. Bản sao cầu nối có tồn tại không ---------- */
if (!existsSync(join(BAN_SAO, ".git"))) {
  dung("KHÔNG TÌM ĐƯỢC BẢN SAO MÃ NGUỒN ĐỂ ĐỐI CHIẾU", [
    `Đang tìm ở: ${VANG}${BAN_SAO}${HET}`,
    "",
    "Không có bản sao này thì KHÔNG BIẾT phiên kia đã đẩy gì mới lên GitHub,",
    "và deploy lúc đó có thể xoá code của họ mà không ai hay.",
    "",
    `${XAM}Cách gỡ — một trong hai:${HET}`,
    `  • Clone bản sao:  git clone https://github.com/ithungphuoc-ops/hpcons-thumua "${BAN_SAO}"`,
    `  • Hoặc trỏ sang chỗ khác:  HPCONS_REPO_MA_NGUON=<đường/dẫn> npm run deploy`,
  ]);
}

/* ---------- 2. Lấy bản mới nhất trên GitHub ---------- */
console.log(`${XAM}› Đang lấy bản mới nhất của phiên kia từ GitHub…${HET}`);
try {
  chay("git fetch origin main", BAN_SAO);
} catch (e) {
  dung("KHÔNG LẤY ĐƯỢC BẢN MỚI NHẤT TỪ GITHUB", [
    "Không fetch được nên KHÔNG THỂ BIẾT phiên kia đã đẩy gì mới.",
    "",
    `${XAM}Lỗi gốc:${HET} ${String(e.stderr ?? e.message).trim().split("\n").slice(-2).join(" ")}`,
    "",
    `${XAM}Không được bỏ qua bước này.${HET} Mất mạng thì chờ có mạng rồi deploy —`,
    "deploy mù là đúng cách đã gây ra sự cố 23/08/2026.",
  ]);
}

/**
 * ---------- QUÉT TOÀN BỘ CÂY: TỆP NÀO TRÊN GITHUB MÀ MÁY NÀY KHÔNG CÓ ----------
 *
 * 🔴 PHẦN NÀY SINH RA TỪ ĐÚNG MỘT LẦN CHỐT NÀY TRẢ VỀ MÀU XANH SAI, NGÀY 24/08/2026.
 *
 * Bản đầu chỉ soát các tệp nằm trong `HEAD..FETCH_HEAD` — tức **chỉ những tệp phiên kia vừa
 * sửa trong mấy commit mới nhất**. Hôm đó máy này thiếu 2 tệp còn nằm trên GitHub, chốt in
 * "✓ Phiên kia chưa đẩy gì mới — deploy an toàn" và thoát mã 0. Phải tìm ra bằng tay.
 *
 * Vì sao lọt: tệp của họ ở commit CŨ HƠN mốc `HEAD` của bản sao thì không xuất hiện trong
 * `HEAD..FETCH_HEAD`. Cửa sổ so sánh hẹp hơn sự thật.
 *
 * 👉 Nên phép quét NÀY ĐỘC LẬP với việc "họ có commit mới hay không": kể cả khi họ chưa đẩy
 *    gì, vẫn phải soát đủ cây. Deploy là thay TOÀN BỘ production, nên câu hỏi đúng là
 *    "bản trên máy có đủ mọi tệp đang có trên GitHub không", chứ không phải "họ vừa sửa gì".
 *
 * ⚠️ CHỈ SOÁT SỰ TỒN TẠI, không so nội dung từng tệp: so nội dung 219 tệp mỗi lần deploy thì
 *    quá chậm, và tệp trùng khác nội dung là BÌNH THƯỜNG (đã trộn phần của họ rồi thêm phần
 *    của mình). Cái chết người là tệp BIẾN MẤT — đó mới là xoá code của phiên kia.
 */

/**
 * Danh sách tệp CỐ Ý xoá, kèm lý do — mỗi dòng `đường/dẫn = lý do`.
 *
 * 📌 Có tệp này vì đôi khi xoá là ĐÚNG (Ban lãnh đạo yêu cầu bỏ một màn hình chẳng hạn).
 * Nhưng bắt buộc phải GHI LÝ DO RA: chặn theo mặc định, muốn miễn thì phải viết xuống. Nếu
 * cho miễn im lặng thì lần sau không ai phân biệt được "cố ý bỏ" với "vô tình xoá".
 */
const TEP_CO_Y_XOA = "da-co-y-xoa.txt";
const coYXoa = new Map();
if (existsSync(join(process.cwd(), TEP_CO_Y_XOA))) {
  for (const dong of readFileSync(join(process.cwd(), TEP_CO_Y_XOA), "utf8").split("\n")) {
    const s = dong.trim();
    if (s === "" || s.startsWith("#")) continue;
    const i = s.indexOf("=");
    if (i > 0) coYXoa.set(s.slice(0, i).trim(), s.slice(i + 1).trim());
  }
}

const tepTrenGitHub = chay('git ls-tree -r --name-only FETCH_HEAD', BAN_SAO)
  .split("\n")
  .map((x) => x.trim())
  .filter(Boolean);

const bienMat = [];
for (const tep of tepTrenGitHub) {
  if (existsSync(join(process.cwd(), tep))) continue;
  if (coYXoa.has(tep)) continue;
  bienMat.push(tep);
}

if (bienMat.length > 0) {
  dung("MÁY NÀY THIẾU TỆP ĐANG CÓ TRÊN GITHUB", [
    `${DO}${bienMat.length} tệp có trên GitHub mà KHÔNG có trên máy này.${HET}`,
    `${VANG}Deploy bây giờ là XOÁ chúng khỏi production.${HET}`,
    "",
    ...bienMat.map((t) => `  ✗ ${t}`),
    "",
    `${XAM}Nếu đây là tệp của phiên kia → lấy về:${HET}`,
    ...bienMat.slice(0, 8).map((t) => `  git -C "${BAN_SAO}" show FETCH_HEAD:"${t}" > "${t}"`),
    bienMat.length > 8 ? `  … và ${bienMat.length - 8} tệp nữa` : "",
    "",
    `${XAM}Nếu CỐ Ý xoá (Ban lãnh đạo yêu cầu bỏ) → ghi vào ${HET}${TEP_CO_Y_XOA}${XAM}, mỗi dòng:${HET}`,
    `  ${XAM}đường/dẫn/tệp = lý do xoá, ai yêu cầu, ngày nào${HET}`,
    "",
    `${VANG}🔴 Trước khi ghi vào ${TEP_CO_Y_XOA}, BẮT BUỘC kiểm tệp đó do ai viết:${HET}`,
    `  git -C "${BAN_SAO}" log --format="%h %an %s" -- <tệp>`,
    `  ${XAM}Nếu tác giả là phiên tích hợp (ithungphuoc-ops / Phuoc) thì KHÔNG được tự xoá.${HET}`,
  ]);
}

/**
 * Commit của phiên kia mà bản sao chưa có.
 *
 * ⚠️ So `HEAD..FETCH_HEAD` chứ không so với repo gốc: `HEAD` của bản sao là lần push cuối của
 * CHÍNH MÌNH, nên khoảng giữa hai mốc đúng bằng những gì phiên kia vừa thêm.
 */
const commitMoi = chay('git log --format="%h|%an|%ad|%s" --date=format:"%d/%m %H:%M" HEAD..FETCH_HEAD', BAN_SAO);

if (commitMoi === "") {
  /* 📌 NÓI ĐÚNG PHẠM VI ĐÃ KIỂM, KHÔNG HỨA QUÁ. Câu cũ là "deploy an toàn" — nghe như đã
     soát mọi thứ, trong khi chốt này KHÔNG kiểm nội dung tệp, KHÔNG kiểm ai đang deploy
     cùng lúc với mình. Một chốt hứa quá thì lần sau người ta tin nó thay vì tự soát. */
  console.log(
    `${XANH}✓ Đủ ${tepTrenGitHub.length} tệp đang có trên GitHub; phiên kia chưa đẩy commit mới.${HET}`,
  );
  console.log(
    `${XAM}  Chốt này CHỈ kiểm tệp có/không. KHÔNG kiểm nội dung, và KHÔNG biết phiên kia có\n  đang deploy cùng lúc hay không — deploy sau vẫn đè deploy trước.${HET}\n`,
  );
  process.exit(0);
}

/* ---------- 3. Có commit mới → soát từng tệp xem đã trộn chưa ---------- */
const tepThayDoi = chay("git diff --name-only HEAD FETCH_HEAD", BAN_SAO)
  .split("\n")
  .map((x) => x.trim())
  .filter(Boolean);

/**
 * Tệp nào CHƯA được trộn vào máy này.
 *
 * 🔴 SO NỘI DUNG, KHÔNG SO NGÀY SỬA hay SHA: hai lịch sử khác nhau nên chỉ nội dung mới nói được
 * sự thật. Tệp trùng mà nội dung khác thì KHÔNG kết luận là chưa trộn — có thể mình đã trộn phần
 * của họ rồi thêm phần của mình vào (đúng cách làm). Vì vậy chỉ chặn cứng ở tệp **họ có mà mình
 * KHÔNG có**, còn tệp trùng thì CẢNH BÁO để người deploy tự soát.
 */
const thieuHan = [];
const trungCanSoat = [];

for (const tep of tepThayDoi) {
  const oDay = join(process.cwd(), tep);
  if (!existsSync(oDay)) {
    /* Họ xoá tệp thì bên mình không có là đúng — không tính là thiếu. */
    let conTrenGitHub = true;
    try {
      chay(`git cat-file -e FETCH_HEAD:"${tep}"`, BAN_SAO);
    } catch {
      conTrenGitHub = false;
    }
    if (conTrenGitHub) thieuHan.push(tep);
    continue;
  }
  const banHo = chay(`git show FETCH_HEAD:"${tep}"`, BAN_SAO);
  const banMinh = readFileSync(oDay, "utf8").trim();
  if (banHo !== banMinh) trungCanSoat.push(tep);
}

if (thieuHan.length > 0) {
  dung("MÁY NÀY THIẾU TỆP MÀ PHIÊN KIA VỪA ĐẨY LÊN", [
    `${VANG}Phiên kia có ${commitMoi.split("\n").length} commit mới:${HET}`,
    ...commitMoi.split("\n").map((d) => {
      const [sha, ai, luc, tieuDe] = d.split("|");
      return `  ${sha}  ${ai}  ${luc}  ${tieuDe}`;
    }),
    "",
    `${DO}${thieuHan.length} tệp CHƯA CÓ trên máy này — deploy bây giờ là XOÁ chúng khỏi production:${HET}`,
    ...thieuHan.map((t) => `  ✗ ${t}`),
    "",
    `${XAM}Cách trộn (KHÔNG ghi đè — xem CLAUDE.md §6.6):${HET}`,
    ...thieuHan.map(
      (t) => `  git -C "${BAN_SAO}" show FETCH_HEAD:"${t}" > "${t}"`,
    ),
    "",
    `${XAM}Trộn xong chạy lại:${HET} npm run verify && npm run deploy`,
  ]);
}

/* Không thiếu tệp nào, nhưng có tệp trùng khác nội dung → nhắc, không chặn. */
console.log(`\n${VANG}⚠ Phiên kia có ${commitMoi.split("\n").length} commit mới:${HET}`);
for (const d of commitMoi.split("\n")) {
  const [sha, ai, luc, tieuDe] = d.split("|");
  console.log(`   ${sha}  ${ai}  ${luc}  ${tieuDe}`);
}
if (trungCanSoat.length > 0) {
  console.log(
    `\n${VANG}${trungCanSoat.length} tệp cả hai bên đều sửa — đã có trên máy này nhưng nội dung khác bản của họ:${HET}`,
  );
  for (const t of trungCanSoat) console.log(`   ~ ${t}`);
  console.log(
    `\n${XAM}   Khác nội dung là BÌNH THƯỜNG nếu bạn đã trộn phần của họ rồi thêm phần của mình.${HET}`,
  );
  console.log(
    `${XAM}   Nhưng nếu chưa soát thì soát ngay:  git -C "${BAN_SAO}" diff HEAD FETCH_HEAD -- <tệp>${HET}`,
  );
}
/* 📌 Nói đúng cái đã kiểm. Câu cũ là "Không thiếu tệp nào của phiên kia — cho deploy",
   nghe như đã bảo đảm an toàn. Thực tế chốt này KHÔNG kiểm nội dung tệp trùng, và không
   thể biết phiên kia có đang bấm deploy cùng lúc. Xem chú thích đầu tệp. */
console.log(`\n${XANH}✓ Đủ ${tepTrenGitHub.length} tệp đang có trên GitHub — không tệp nào biến mất.${HET}`);
console.log(
  `${XAM}  Chưa kiểm: nội dung ${trungCanSoat.length} tệp trùng ở trên, và việc phiên kia có\n  đang deploy cùng lúc hay không.${HET}`,
);
console.log(
  `${XAM}  Nhắc: deploy xong chạy ${HET}npm run kiem-route${XAM} để chắc chắn không route nào bị 404.${HET}\n`,
);
