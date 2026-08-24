// ============================================================
// `npm run deploy` KHÔNG CÒN DEPLOY — TỪ 24/08/2026 PHÁT HÀNH BẰNG `git push`
//
// 🔴 VÌ SAO KHÔNG ĐỂ NÓ GỌI `vercel --prod` NHƯ CŨ: project Vercel đã nối GitHub, nên mọi
//    deploy từ dòng lệnh bị chặn — nhưng Vercel **không nói lý do**, lệnh chỉ đứng im rồi
//    bản deploy nằm mãi ở trạng thái `UNKNOWN`. Đo thật 24/08/2026: chờ hơn 10 phút vẫn
//    không xong. Để nguyên lệnh cũ là đặt bẫy: người dùng chờ vô ích rồi kết luận sai là
//    "mạng lỗi" hoặc "CLI hỏng", và bước tiếp theo họ nghĩ ra sẽ là gỡ nối Git — tức phá
//    đúng cái chốt đang bảo vệ họ.
//
// 👉 Nên lệnh này giờ CHỈ in hướng dẫn. Hai chốt kiểm vẫn chạy trước nó (xem `package.json`),
//    nên chạy `npm run deploy` vẫn có ích: nó soát code của phiên kia trước khi bạn push.
// ============================================================

import { execSync } from "node:child_process";

const XANH = "[32m";
const VANG = "[33m";
const DO = "[31m";
const XAM = "[90m";
const HET = "[0m";

function chay(lenh) {
  try {
    return execSync(lenh, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch {
    return "";
  }
}

const nhanh = chay("git rev-parse --abbrev-ref HEAD") || "(không rõ)";
const chuaCommit = chay("git status --porcelain");

console.log(`
${XANH}✓ Hai chốt kiểm đã qua.${HET}

${VANG}📌 TỪ 24/08/2026, PHÁT HÀNH BẰNG \`git push\` — KHÔNG CÒN \`vercel --prod\`.${HET}

Project Vercel đã nối GitHub (Production Branch = ${XANH}main${HET}). Đẩy lên là Vercel tự dựng
rồi tự đưa lên ${XANH}https://thumua.hpcore.vn${HET}.

${XAM}Vì sao đổi: \`vercel --prod\` THAY TOÀN BỘ production bằng mã nguồn ở máy chạy lệnh —
không trộn, không cảnh báo. Hai phiên deploy tay từ hai bản khác nhau thì người sau LUÔN
xoá tính năng người trước. Còn \`git push\` BẮT BUỘC fast-forward: người kia vừa đẩy gì mà
bạn chưa có thì Git TỪ CHỐI và bắt lấy về trước. Push là hàng đợi tự nhiên.${HET}
`);

if (chuaCommit !== "") {
  console.log(`${DO}⚠ Còn thay đổi chưa commit — Vercel chỉ dựng cái đã đẩy lên GitHub:${HET}`);
  for (const d of chuaCommit.split("\n").slice(0, 12)) console.log(`   ${d}`);
  if (chuaCommit.split("\n").length > 12) {
    console.log(`   ${XAM}… và ${chuaCommit.split("\n").length - 12} mục nữa${HET}`);
  }
  console.log("");
}

console.log(`${VANG}Làm theo thứ tự:${HET}
  1. ${XAM}Kiểm đầy đủ${HET}        npm run verify
  2. ${XAM}Commit${HET}             git add -A && git commit -F <tệp-thông-điệp>
  3. ${XAM}Lấy bản của họ${HET}     git fetch origin main
  4. ${XAM}Chốt an toàn${HET}       git merge-base --is-ancestor FETCH_HEAD HEAD
     ${XAM}(đúng = push chỉ THÊM commit, không thể xoá của ai. Sai = họ vừa đẩy thêm, phải trộn)${HET}
  5. ${XAM}Đẩy lên${HET}            git push origin main
  6. ${XAM}Đợi ~1 phút rồi đo${HET} npm run kiem-route

  ${XAM}Nhánh hiện tại: ${HET}${nhanh}${XAM}  (phải là \`main\` mới lên production)${HET}

${DO}⛔ NẾU BẠN VẪN CHẠY \`vercel --prod\` VÀ NÓ TRẢ \`UNKNOWN\`:${HET}
   Đó là chốt đang LÀM ĐÚNG VIỆC, không phải lỗi mạng, không phải CLI hỏng.
   ${DO}TUYỆT ĐỐI KHÔNG chạy \`npx vercel git disconnect\`${HET} — đó là lệnh phá chốt:
   một lệnh, không sinh commit nào, không ai được thông báo, và từ giây đó hai phiên
   lại đè code của nhau đúng như sự cố 23/08/2026.

${XAM}Cần chữa cháy gấp? Dùng Instant Rollback / Promote trên bảng điều khiển Vercel —
chạy hoàn toàn trên web, không cần GitHub, không phá chốt.${HET}
`);
