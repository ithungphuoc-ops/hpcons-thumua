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
 * Commit của phiên kia mà bản sao chưa có.
 *
 * ⚠️ So `HEAD..FETCH_HEAD` chứ không so với repo gốc: `HEAD` của bản sao là lần push cuối của
 * CHÍNH MÌNH, nên khoảng giữa hai mốc đúng bằng những gì phiên kia vừa thêm.
 */
const commitMoi = chay('git log --format="%h|%an|%ad|%s" --date=format:"%d/%m %H:%M" HEAD..FETCH_HEAD', BAN_SAO);

if (commitMoi === "") {
  console.log(`${XANH}✓ Phiên kia chưa đẩy gì mới — deploy an toàn.${HET}\n`);
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
console.log(`\n${XANH}✓ Không thiếu tệp nào của phiên kia — cho deploy.${HET}`);
console.log(
  `${XAM}  Nhắc: deploy xong chạy ${HET}npm run kiem-route${XAM} để chắc chắn không route nào bị 404.${HET}\n`,
);
