// ============================================================
// KIỂM LUẬT TRONG TỆP DÙNG CHUNG — BẰNG HÀNH VI, KHÔNG BẰNG TÌM CHUỖI
//
// 🔴 SINH RA TỪ MỘT LỖ HỔNG ĐO ĐƯỢC NGÀY 24/08/2026.
//
// Hai phiên Claude Code làm song song trên cùng mã nguồn. Cách bảo vệ code của nhau đang dùng
// là `grep` các "dấu mốc" (`anhQlkCtr`, `maDeXuatAppRequest`, `bo0Undefined`…). **Cách đó KHÔNG
// bắt được việc xoá code**, và đây là bằng chứng cụ thể:
//
//   Trong `2-quy-trinh/tinh-toan.ts`, chuỗi `anhQlkCtr` xuất hiện HAI lần:
//     · dòng 133 — trong CHÚ THÍCH
//     · dòng 138 — trong ĐIỀU KIỆN THẬT `&& !p.anhQlkCtr`
//   Ai xoá dòng 138 mà để lại chú thích thì `grep -c "anhQlkCtr"` vẫn trả về 2, mọi chốt tìm
//   chuỗi vẫn XANH, và luật của phiên tích hợp đã chết mà không ai biết. Hậu quả thật: thủ kho
//   phải đính kèm phiếu giao nhận HAI LẦN cho cùng một lần giao, hoặc đơn kẹt không hoàn thành
//   được.
//
// 👉 Cách duy nhất có hiệu lực: GỌI THẬT HÀM rồi đòi kết quả đúng. Chú thích không chạy được,
//    nên không lừa được phép kiểm này.
//
// ⚠️ MỖI BÀI KIỂM PHẢI GHI RÕ LUẬT CỦA AI VÀ NGÀY NÀO. Người phiên sau đọc phải biết ngay
//    mình đang định sửa luật của ai — đó là điều `grep` không bao giờ nói được.
//
// Chạy:  npm run kiem-luat
// ============================================================

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const DO = "\u001b[31m";
const VANG = "\u001b[33m";
const XANH = "\u001b[32m";
const XAM = "\u001b[90m";
const HET = "\u001b[0m";

/* ---------- Dựng mã TypeScript thành mã chạy được ---------- */
/* 📌 Dùng esbuild vì nó gộp luôn các tệp `import` mà KHÔNG cần cấu hình — bài kiểm phải chạy
   được ngay, không phụ thuộc thiết lập Jest/Vitest mà dự án chưa có. */
const thuMuc = mkdtempSync(join(tmpdir(), "kiem-luat-"));
const tepRa = join(thuMuc, "tinh-toan.cjs");

try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/tinh-toan.ts" --bundle --platform=node --format=cjs --outfile="${tepRa}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/tinh-toan.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

const tepRa2 = join(thuMuc, "giai-doan.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/giai-doan-mua-hang.ts" --bundle --platform=node --format=cjs --outfile="${tepRa2}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/giai-doan-mua-hang.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

const tepRa3 = join(thuMuc, "chung-tu.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/chung-tu-cuoi-quy-trinh.ts" --bundle --platform=node --format=cjs --outfile="${tepRa3}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/chung-tu-cuoi-quy-trinh.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

const tepRa4 = join(thuMuc, "bao-gia.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/bao-gia-dinh-kem.ts" --bundle --platform=node --format=cjs --outfile="${tepRa4}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/bao-gia-dinh-kem.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

const tepRa5 = join(thuMuc, "tuoi-no.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/tuoi-no.ts" --bundle --platform=node --format=cjs --outfile="${tepRa5}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/tuoi-no.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★ Dò thông tin hoá đơn từ chữ — Sếp 20/09/2026. Hàm thuần nên kiểm được ở Node; phần lấy chữ
   ra khỏi PDF nằm ở `6-tien-ich/trich-text-pdf.ts` và không kiểm ở đây (cần trình duyệt). */
const tepRaHoaDon = join(thuMuc, "doc-hoa-don.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/doc-hoa-don-van-ban.ts" --bundle --platform=node --format=cjs --outfile="${tepRaHoaDon}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/doc-hoa-don-van-ban.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★ Ghi từng phần — đợt 2 lộ trình chống mất dữ liệu (22/09/2026). Phần QUYẾT ĐỊNH của việc
   "chỉ gửi thứ mình vừa sửa" nằm ở đây để kiểm được bằng cách gọi thật. */
const tepRaGTP = join(thuMuc, "ghi-tung-phan.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/ghi-tung-phan.ts" --bundle --platform=node --format=cjs --outfile="${tepRaGTP}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/ghi-tung-phan.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★ Giữ 30 thông báo gần nhất (23/09/2026). Tách khỏi `kho-du-lieu.tsx` vì file đó không nạp
   được ngoài trình duyệt — mà đây đúng là chỗ đã cắt nhầm tin trên production. */
const tepRaTB = join(thuMuc, "giu-thong-bao.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/giu-thong-bao.ts" --bundle --platform=node --format=cjs --outfile="${tepRaTB}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/giu-thong-bao.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★ Số đơn hàng / số phiếu xuất kho XK (26/09/2026). */
const tepRaDMH = join(thuMuc, "dat-ma-don-hang.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/dat-ma-don-hang.ts" --bundle --platform=node --format=cjs --outfile="${tepRaDMH}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/dat-ma-don-hang.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★ Gom theo công trình (25/09/2026) — một luật dùng chung cho màn Theo dõi và màn Công nợ. */
const tepRaGCT = join(thuMuc, "gom-cong-trinh.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/gom-cong-trinh.ts" --bundle --platform=node --format=cjs --outfile="${tepRaGCT}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/gom-cong-trinh.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★ Xuất công nợ Excel theo khung thời gian (25/09/2026). `exceljs` để ngoài — bài kiểm chỉ gọi
   phần LỌC, phần dựng tệp đã chạy thử riêng. */
const tepRaXCN = join(thuMuc, "xuat-cong-no-excel.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/xuat-cong-no-excel.ts" --bundle --platform=node --format=cjs --external:exceljs --outfile="${tepRaXCN}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/xuat-cong-no-excel.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★ Tách phiếu lúc giao việc (26/09/2026) — thay cơ chế tách ngầm đã sinh bản lặp. */
const tepRaTKG = join(thuMuc, "tach-khi-giao-viec.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/tach-khi-giao-viec.ts" --bundle --platform=node --format=cjs --outfile="${tepRaTKG}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/tach-khi-giao-viec.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★ Lọc bảng quy trình theo ô tìm (26/09/2026). */
const tepRaTK = join(thuMuc, "tim-kiem.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/tim-kiem.ts" --bundle --platform=node --format=cjs --outfile="${tepRaTK}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/tim-kiem.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★ Cấp mã ở máy chủ — nhịp 3b (23/09/2026). Phần quyết định tách khỏi route vì route phải mở
   Firebase mới chạy; luật phải gọi thật được chỗ dễ sai nhất. */
const tepRaCM = join(thuMuc, "cap-ma-may-chu.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/cap-ma-may-chu.ts" --bundle --platform=node --format=cjs --outfile="${tepRaCM}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/cap-ma-may-chu.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★ Soát trước khi ghi — nhịp 3c (24/09/2026). Phần quyết định "ô nào ghi được, ô nào phải
   báo" tách khỏi tầng lưu vì tầng lưu phải mở Firebase mới chạy. */
const tepRaSO = join(thuMuc, "soat-truoc-khi-ghi.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/soat-truoc-khi-ghi.ts" --bundle --platform=node --format=cjs --outfile="${tepRaSO}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/soat-truoc-khi-ghi.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★ Tiến độ theo từng người — Sếp chốt 25/09/2026. Phần quyết định hiển thị (ai bị gắn
   "chậm nhất", khi nào ẩn khối) tách khỏi giao diện để bộ luật gọi thật được. */
const tepRaTDN = join(thuMuc, "tien-do-theo-nguoi.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/tien-do-theo-nguoi.ts" --bundle --platform=node --format=cjs --outfile="${tepRaTDN}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/tien-do-theo-nguoi.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

const tepRa6 = join(thuMuc, "tich-hop-app-request.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/tich-hop-app-request.ts" --bundle --platform=node --format=cjs --outfile="${tepRa6}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/tich-hop-app-request.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/**
 * ★★ TẦNG GHI ĐƠN HÀNG — Sếp 15/09/2026.
 *
 * 🔴 ĐÚNG, ĐÂY LÀ MỘT TỆP `.tsx` CÓ REACT, VÀ VẪN DỰNG ĐƯỢC. Các luật cần kiểm là **hàm thuần
 * đứng ở tầng module** (ngoài mọi hook), nên nạp bằng Node không cần render gì cả — đã đo: gói
 * dựng ra `require()` được sạch, không có tác dụng phụ nào lúc nạp.
 *
 * ⚠️ ĐÚNG RA NHỮNG HÀM NÀY THUỘC `2-quy-trinh/`. Chúng nằm tạm trong `3-du-lieu/kho-du-lieu.tsx`
 * vì lượt sửa 15/09/2026 có nhiều phiên làm song song, mỗi phiên chỉ được đụng đúng tệp của mình.
 * Ai dời được thì dời, nhớ đổi đường dẫn ở đây.
 */
const tepRa7 = join(thuMuc, "kho-du-lieu.cjs");
try {
  execSync(
    `npx --yes esbuild "3-du-lieu/kho-du-lieu.tsx" --bundle --platform=node --format=cjs --outfile="${tepRa7}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 3-du-lieu/kho-du-lieu.tsx:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★★ NHÁNH HỒ SƠ PHÒNG BAN — Sếp 15/09/2026. Chỗ nhận diện hồ sơ phòng ban, và là chỗ đã sai
   một lần hôm nay: bản đầu nhận diện bằng `tenCongTrinh` rỗng, đo trên kho thật ra **0/16**, nên
   nhánh không bao giờ bật (Sếp báo *"a thấy nhánh phòng ban chưa chạy"*). Phải có bài kiểm canh. */
const tepRa8 = join(thuMuc, "ho-so-phong-ban.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/ho-so-phong-ban.ts" --bundle --platform=node --format=cjs --outfile="${tepRa8}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/ho-so-phong-ban.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★★ LÀM SẠCH BẢN NHÂN BẢN — Sếp 15/09/2026: *"a cần làm sạch tất cả khi trả về bước 2"*.
   Luật dựng bản sao đã dời từ hook React sang hàm thuần `dungBanNhanBan` đúng để chỗ này gọi
   thật được — nằm trong hook thì không bài kiểm nào bắt được khi ai đó làm rơi một dòng. */
const tepRa9 = join(thuMuc, "nhan-ban-de-nghi.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/nhan-ban-de-nghi.ts" --bundle --platform=node --format=cjs --outfile="${tepRa9}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/nhan-ban-de-nghi.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★★ HẠN MỨC TỆP MỖI BƯỚC — Sếp 17/09/2026 nâng 5→6 để mở đủ 5 ô báo giá NCC. Dựng riêng để bài
   kiểm đối chiếu ĐƯỢC hai hằng số với nhau: số ô báo giá cộng bảng so sánh bắt buộc phải vừa hạn
   mức, thiếu chỗ là phiếu kẹt vĩnh viễn ở bước ②. */
/* ★★ NĂNG LỰC PHÒNG THU MUA — Sếp 17/09/2026 (màn KPI). Dựng riêng để bài kiểm gọi THẬT hàm cộng,
   nhất là hai chốt: không đếm hai lần dòng đã nhân bản, và KHÔNG tính phiếu đóng dở là "xong". */
const tepRaNL = join(thuMuc, "nang-luc.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/nang-luc-phong-thu-mua.ts" --bundle --platform=node --format=cjs --outfile="${tepRaNL}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/nang-luc-phong-thu-mua.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

const tepRaGH = join(thuMuc, "gioi-han.cjs");
try {
  execSync(
    `npx --yes esbuild "3-du-lieu/gioi-han-dinh-kem.ts" --bundle --platform=node --format=cjs --outfile="${tepRaGH}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 3-du-lieu/gioi-han-dinh-kem.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★★ TÊN HIỂN THỊ TRÊN THẺ KANBAN — Sếp 15/09/2026: *"khi nhân bản thì tên tiêu đề này cũng phải
   hiển thị luôn chư (copy..)"*. Luật ghép tên đã dời ra khỏi tệp giao diện để canh được. */
/* ★★ SINH MÃ ĐỀ NGHỊ — Sếp 17/09/2026 bỏ ký hiệu `PR`. Hàm này là thứ `CLAUDE.md` §3.1 gọi là
   bất di bất dịch (hệ mã hồ sơ), mà tới 17/09/2026 **chưa có một chốt nào canh** — đo được: cả
   tệp kiểm không hề import `dat-ten-de-nghi`. Dựng riêng để gọi THẬT. */
const tepRaMa = join(thuMuc, "dat-ten.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/dat-ten-de-nghi.ts" --bundle --platform=node --format=cjs --outfile="${tepRaMa}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/dat-ten-de-nghi.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

const tepRa10 = join(thuMuc, "ten-the-de-nghi.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/ten-the-de-nghi.ts" --bundle --platform=node --format=cjs --outfile="${tepRa10}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/ten-the-de-nghi.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★★ CẤU HÌNH QUY TRÌNH — cần để canh `MA_CONG_VIEC_DA_BO` (Sếp 15/09/2026). Bản cấu hình người
   dùng đã lưu trên kho chung ĐÈ nguyên khối lên mặc định, nên việc "đã bỏ ở mặc định" một mình
   không chứng minh được gì; phải gọi thật `gopCauHinhVoiMacDinh`. */
const tepRa11 = join(thuMuc, "cau-hinh.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/cau-hinh-quy-trinh.ts" --bundle --platform=node --format=cjs --outfile="${tepRa11}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/cau-hinh-quy-trinh.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★★ GỬI PO SANG QLK CTR — cần để canh luật Sếp 15/09/2026 *"Đề xuất từ phòng ban thì ko cần gửi
   sang app kho"*. Bốn hàm ở đây quyết định hồ sơ nào được gửi sang app Kho công trình; nới nhầm
   sang hồ sơ CÔNG TRÌNH thì thủ kho không bao giờ thấy đơn và KHÔNG CÓ GÌ BÁO. */
const tepRa12 = join(thuMuc, "gui-po-qlk-ctr.cjs");
try {
  execSync(
    `npx --yes esbuild "5-ket-noi/gui-po-qlk-ctr.ts" --bundle --platform=node --format=cjs --outfile="${tepRa12}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 5-ket-noi/gui-po-qlk-ctr.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★★ BỘ HỒ SƠ THANH TOÁN — cần để canh luật Sếp 15/09/2026 về mục 4 *"file PO ký đính kèm"*.
   `dungBoHoSoThanhToan` là hàm mà **cửa API đẩy sang app Kế toán sau này sẽ gọi**, nên nó vừa là
   luật hiển thị vừa là hợp đồng dữ liệu — hụt một mục là bên nhận mất một chứng từ mà không có gì
   báo. Phải gọi thật, `grep` không bắt được. */
const tepRa13 = join(thuMuc, "bo-ho-so.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/bo-ho-so-thanh-toan.ts" --bundle --platform=node --format=cjs --outfile="${tepRa13}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/bo-ho-so-thanh-toan.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★★ NHỊP GHI KHO CHUNG & NHỊP THỬ LẠI QLK CTR — Sếp 15/09/2026, theo phân tích của đội QLK CTR
   cùng ngày. Đây là tệp sinh ra ĐÚNG để bài kiểm gọi thật được: chỉ đạo là *"luật nằm trong hook
   thì không bài kiểm nào bắt được"*. Cả cơ chế chống dội vào QLK CTR nằm ở bốn hàm trong đó. */
const tepRa14 = join(thuMuc, "nhip-dong-bo.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/nhip-dong-bo-qlk-ctr.ts" --bundle --platform=node --format=cjs --outfile="${tepRa14}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/nhip-dong-bo-qlk-ctr.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★★ GIỮ BẢN GHI VỪA TẠO CHO TỚI KHI THẤY NÓ TRÊN MÁY CHỦ — sự cố MẤT DỮ LIỆU THẬT 15/09/2026,
   Sếp báo lúc 19:33. Đo trên kho chung `hpcons-portal`: đơn vừa lập KHÔNG có trên máy chủ, và 3 đơn
   khác (DMH260001, DMH260003, DMH260004) đã mất y hệt từ trước — app không có chức năng xoá đơn.
   🔴 Bài kiểm ở đây canh CẢ HAI CHIỀU. Chiều nghịch quan trọng hơn chiều thuận: nếu hàm ghép bị
   sửa thành "luôn ghép" thì mọi bản ghi người khác XOÁ sẽ sống lại vĩnh viễn — bản vá biến thành
   một lỗi nặng hơn lỗi nó đang chữa. */
const tepRa15 = join(thuMuc, "giu-ban-ghi-moi.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/giu-ban-ghi-moi.ts" --bundle --platform=node --format=cjs --outfile="${tepRa15}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/giu-ban-ghi-moi.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/* ★★ PHÂN QUYỀN — thêm 16/09/2026 cho cờ `xoaToanBoDuLieu` (Sếp: *"chức năng này chỉ hiện ở tài
   khoản cấp quản trị"*). Đây là cờ DUY NHẤT trong bảng quyền chỉ mở cho quản trị, và nới nhầm nó
   nghĩa là mở nút xoá sạch dữ liệu cả phòng cho người không được phép — hỏng thì không khôi phục
   lại được, nên phải có phép gọi thật canh. */
const tepRa16 = join(thuMuc, "quyen.cjs");
try {
  execSync(
    `npx --yes esbuild "4-phan-quyen/quyen.ts" --bundle --platform=node --format=cjs --outfile="${tepRa16}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 4-phan-quyen/quyen.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

/**
 * ★★ DỰNG `2-quy-trinh/dieu-huong.ts` — thêm 18/09/2026.
 *
 * 🔴 VÌ SAO GIỜ MỚI CÓ: tệp này giữ luật **ai thấy mục menu nào**, mà tới hôm nay bộ kiểm chưa
 * bao giờ dựng nó. Bốn luật menu đổi ngày 18/09 (ẩn Tổng quan · Công việc của tôi · Lịch cho
 * người ngoài phòng Thu mua, giữ Đơn hàng cho thủ kho) vì vậy **không có một dòng đỏ nào canh** —
 * ai siết nốt mục Đơn hàng cho "nhất quán" là thủ kho mất luôn màn duy nhất có việc của họ.
 */
const tepRa17 = join(thuMuc, "dieu-huong.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/dieu-huong.ts" --bundle --platform=node --format=cjs --outfile="${tepRa17}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/dieu-huong.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

const nap = createRequire(import.meta.url);
/* Nạp sẵn: thư mục tạm bị xoá giữa chừng (trước các bài kiểm cuối tệp), nạp muộn là không thấy tệp. */
const modDMH = nap(tepRaDMH);
const M = nap(tepRa);
const G = nap(tepRa2);
const AR = nap(tepRa6);
const KD = nap(tepRa7);
const HS = nap(tepRa8);
const NB = nap(tepRa9);
const GTP = nap(tepRaGTP);
const TB = nap(tepRaTB);
const CM = nap(tepRaCM);
const SO = nap(tepRaSO);
const TDN = nap(tepRaTDN);
const TT = nap(tepRa10);
const CQ = nap(tepRa11);
const QLK = nap(tepRa12);
const NH = nap(tepRa14);
const GB = nap(tepRa15);
const PQ = nap(tepRa16);

/* ---------- Bộ khung chấm ---------- */
let dat = 0;
const truot = [];

/**
 * @param ten   Tên bài kiểm — ghi rõ LUẬT CỦA AI, NGÀY NÀO.
 * @param chu   Chủ của luật, để khi đỏ thì biết phải báo cho ai.
 * @param chay  Hàm trả về `{ duoc, thucTe, mongDoi }`.
 */
function kiem(ten, chu, chay) {
  let kq;
  try {
    kq = chay();
  } catch (e) {
    truot.push({ ten, chu, thucTe: `NÉM LỖI: ${e.message}`, mongDoi: "chạy được" });
    return;
  }
  if (kq.duoc) {
    dat += 1;
    return;
  }
  truot.push({ ten, chu, thucTe: kq.thucTe, mongDoi: kq.mongDoi });
}

/* Phiếu nhận hàng tối giản — chỉ những trường luật thật sự đọc. */
const phieu = (them) => ({ id: "p1", lanGiaoThu: 1, trangThai: "da_nhap_kho", ...them });

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA PHIÊN TÍCH HỢP — 23/08/2026, commit cae2340
// Ảnh do QLK CTR gửi kèm được coi là bằng chứng giao nhận, không đòi
// thủ kho đính kèm lại lần thứ hai.
// ════════════════════════════════════════════════════════════════════

kiem(
  "Phiếu CHỈ có ảnh QLK CTR (không có tệp phiếu giao) → KHÔNG được đòi thêm",
  "phiên tích hợp · 23/08/2026 · cae2340",
  () => {
    const r = M.vuongMacXacNhanKho([
      phieu({ anhQlkCtr: { ten: "phieu-giao.jpg", url: "https://vd/x.jpg" } }),
    ]);
    return {
      duoc: r === null,
      thucTe: r === null ? "null" : `"${r}"`,
      mongDoi: "null (đã có ảnh QLK CTR = đủ bằng chứng giao nhận)",
    };
  },
);

kiem(
  "Nhiều phiếu, mỗi phiếu một loại bằng chứng khác nhau → KHÔNG vướng",
  "phiên tích hợp 23/08 + Ban lãnh đạo 11/08",
  () => {
    const r = M.vuongMacXacNhanKho([
      phieu({ id: "a", lanGiaoThu: 1, tepPhieuGiao: { ten: "a.pdf", id: "f1" } }),
      phieu({ id: "b", lanGiaoThu: 2, anhQlkCtr: { ten: "b.jpg", url: "https://vd/b.jpg" } }),
      phieu({ id: "c", lanGiaoThu: 3, trangThai: "tu_choi_nhan" }),
    ]);
    return {
      duoc: r === null,
      thucTe: r === null ? "null" : `"${r}"`,
      mongDoi: "null (cả ba phiếu đều hợp lệ theo ba đường khác nhau)",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA BAN LÃNH ĐẠO 11/08/2026 — phải có phiếu giao nhận mới xác nhận
// ⚠️ Đây là chiều NGƯỢC LẠI. Phải kiểm cả hai chiều, nếu không thì ai
//    sửa hàm thành `return null` vô điều kiện là mọi bài kiểm ở trên
//    vẫn XANH mà luật đã mất sạch.
// ════════════════════════════════════════════════════════════════════

kiem(
  "Phiếu TRẮNG (không tệp, không ảnh) → PHẢI bị chặn",
  "Ban lãnh đạo · 11/08/2026",
  () => {
    const r = M.vuongMacXacNhanKho([phieu({})]);
    return {
      duoc: typeof r === "string" && r.length > 0,
      thucTe: r === null ? "null (KHÔNG CHẶN!)" : `"${String(r).slice(0, 60)}…"`,
      mongDoi: "một câu lý do (phải chặn vì chưa có bằng chứng giao nhận)",
    };
  },
);

kiem(
  "Kiểm TỪNG phiếu, không phải 'có ít nhất một tệp'",
  "Ban lãnh đạo · 11/08/2026",
  () => {
    /* 🔴 Ca này bắt đúng lỗi `.some()` thay vì `.filter()`: một phiếu có tệp, một phiếu trắng.
       Nếu hàm chỉ hỏi "có tệp nào không" thì nó trả null và lần giao thứ 2 mất chứng từ. */
    const r = M.vuongMacXacNhanKho([
      phieu({ id: "a", lanGiaoThu: 1, tepPhieuGiao: { ten: "a.pdf", id: "f1" } }),
      phieu({ id: "b", lanGiaoThu: 2 }),
    ]);
    return {
      duoc: typeof r === "string" && r.includes("lần 2"),
      thucTe: r === null ? "null (KHÔNG CHẶN!)" : `"${String(r).slice(0, 70)}…"`,
      mongDoi: 'phải chặn và chỉ rõ "lần 2" là phiếu còn thiếu',
    };
  },
);

kiem(
  "Phiếu TỪ CHỐI NHẬN không có tệp → KHÔNG được chặn",
  "Ban lãnh đạo · 11/08/2026 (ngoại lệ đã ghi trong tài liệu)",
  () => {
    /* Hàng bị từ chối thì không có phiếu giao nhận nào được ký. Đòi tệp là làm kẹt đơn
       vĩnh viễn — không bao giờ bấm hoàn thành được. */
    const r = M.vuongMacXacNhanKho([phieu({ trangThai: "tu_choi_nhan" })]);
    return {
      duoc: r === null,
      thucTe: r === null ? "null" : `"${String(r).slice(0, 60)}…"`,
      mongDoi: "null (hàng trả về thì lấy đâu ra phiếu giao nhận đã ký)",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA BAN LÃNH ĐẠO 15/08/2026 — nhận đủ rồi thì không ghi thêm phiếu
// (lỗi tiền bạc: nhận 300 bao cho đơn 150 bao mà app vẫn báo "đã nhận đủ")
// ════════════════════════════════════════════════════════════════════

kiem(
  "Đã nhận đủ toàn bộ → PHẢI chặn ghi thêm phiếu nhận",
  "Ban lãnh đạo · 15/08/2026",
  () => {
    const r = M.vuongMacGhiThemPhieuNhan([{ khoiLuongConLai: 0 }, { khoiLuongConLai: 0 }]);
    return {
      duoc: typeof r === "string" && r.length > 0,
      thucTe: r === null ? "null (KHÔNG CHẶN!)" : `"${String(r).slice(0, 60)}…"`,
      mongDoi: "một câu lý do (chặn để không nhận thừa rồi vẫn được thanh toán)",
    };
  },
);

kiem(
  "Còn thiếu hàng → KHÔNG được chặn ghi phiếu",
  "Ban lãnh đạo · 15/08/2026 (chiều ngược lại)",
  () => {
    const r = M.vuongMacGhiThemPhieuNhan([{ khoiLuongConLai: 0 }, { khoiLuongConLai: 25 }]);
    return {
      duoc: r === null,
      thucTe: r === null ? "null" : `"${String(r).slice(0, 60)}…"`,
      mongDoi: "null (còn thiếu thì phải cho ghi tiếp)",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// CHẶN NaN — lỗi im lặng, nguy hơn lỗi làm sập trang
// ════════════════════════════════════════════════════════════════════

kiem(
  "PO thiếu hẳn danh sách hàng → không được ném lỗi làm sập bảng",
  "phiên nghiệp vụ · 23/08/2026",
  () => {
    /* Đơn cũ trong kho dữ liệu có thể không có trường `items`. Không chặn thì cả bảng quy
       trình trắng trang, mà lỗi lại nằm ở chỗ khác hoàn toàn. */
    const r = M.dongHangCuaPO({});
    return {
      duoc: Array.isArray(r) && r.length === 0,
      thucTe: JSON.stringify(r),
      mongDoi: "[] (mảng rỗng, không ném lỗi)",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LỖI BAN LÃNH ĐẠO BÁO 24/08/2026 — "Sao có bước chưa hoàn thành nhưng
// ở bảng kanban lại không hiện thông báo"
//
// Hồ sơ ở bước ⑦ Hồ sơ thanh toán, còn nợ tệp Hợp đồng ở bước ④.
// Trang chi tiết tô đỏ khối ④ + nhãn "Còn thiếu"; thẻ kanban thì TRẮNG TRƠN.
// Nguyên nhân: thẻ chỉ soát ĐÚNG MỘT bước — bước nó đang đứng.
// ════════════════════════════════════════════════════════════════════

/** Đề nghị tối giản, đủ để các hàm nợ chứng từ chạy. */
const deNghiThu = (them) => ({
  id: "pr-thu",
  items: [{ sttDong: 1, nguoiPhuTrachUid: "u-tm-01", nguoiPhuTrachTen: "A" }],
  congViecDaXong: [],
  tepTheoKhoa: {},
  ...them,
});

kiem(
  "Hồ sơ ở bước ⑦ mà nợ tệp Hợp đồng ở bước ④ → THẺ KANBAN phải báo",
  "Ban lãnh đạo · 24/08/2026",
  () => {
    /* Không có tệp Hợp đồng nào -> bước ④ còn nợ. Giai đoạn hiện tại là ⑦. */
    const ds = G.dsConNoToanHoSo(
      deNghiThu(),
      "ho_so_thanh_toan",
      G.CAU_HINH_MAC_DINH ?? {},
      [],
      [],
    );
    /* ★ LUẬT BÀI NÀY GHIM: hồ sơ ĐÃ QUA bước rồi thì nợ của bước cũ **vẫn phải hiện trên thẻ**
       (Ban lãnh đạo 24/08/2026). Thẻ trắng trơn là lỗi đã phải chữa một lần.

       ⚠️ CÁCH NHẬN DIỆN ĐỔI NGÀY 19/09/2026, LUẬT THÌ KHÔNG. Trước đây bài này nhận ra mục bằng
       tiền tố số khoanh (`m.startsWith("⑤")`) — nhưng Sếp 19/09 yêu cầu *"Bỏ số 4 đi và ghi rõ
       thông tin"*, nên tiền tố không còn tồn tại. Nay nhận bằng chính tên tệp đang thiếu, thứ
       không phụ thuộc vào việc app có đánh số bước hay không.

       📌 Món nợ này thuộc bước ⑤ *Tiến hành đặt hàng* (Ban lãnh đạo 24/08 chuyển ô Hợp đồng sang
       đó: *"Hợp đồng mua hàng em đưa sang bước tiến hành đặt hàng"*) — hồ sơ thử không có lý do
       nợ nào nên đi nhánh ⑤, xem `buocBaoNoHopDong`. */
    const coNhacHopDong = ds.some((m) => /Thiếu hợp đồng/.test(m));
    return {
      duoc: coNhacHopDong,
      thucTe: ds.length === 0 ? "[] (THẺ TRẮNG TRƠN — đúng lỗi đã báo)" : JSON.stringify(ds),
      mongDoi: 'qua bước ⑦ rồi vẫn còn mục "Thiếu hợp đồng" của bước ⑤ (Tiến hành đặt hàng)',
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: hồ sơ mới ở bước ① thì KHÔNG được báo nợ của bước sau",
  "Ban lãnh đạo · 24/08/2026 (chống tô đỏ mọi thẻ)",
  () => {
    /* 🔴 Nếu gộp cả bước CHƯA TỚI thì mọi thẻ đỏ ngay từ bước ① — rơi đúng bẫy "đỏ hết thì
       người ta thôi để ý". Bài kiểm này giữ cho bản sửa không đi quá. */
    const ds = G.dsConNoToanHoSo(deNghiThu(), "tiep_nhan", G.CAU_HINH_MAC_DINH ?? {}, [], []);
    const nhacBuocSau = ds.filter((m) => /^[②③④⑤⑥⑦⑧]/.test(m));
    return {
      duoc: nhacBuocSau.length === 0,
      thucTe: nhacBuocSau.length === 0 ? "không nhắc bước chưa tới" : JSON.stringify(nhacBuocSau),
      mongDoi: "không có mục nào nhắc bước chưa tới lượt",
    };
  },
);

kiem(
  "Nhãn trên thẻ phải NGẮN — Ban lãnh đạo 24/08: “Tối giản ký tự thông báo lại”",
  "Ban lãnh đạo · 24/08/2026",
  () => {
    /* 🔴 Câu cũ dài 120+ ký tự, bày trên thẻ rộng 240px thành bốn dòng chữ; ba thẻ như vậy là
       hết cả cột. Ngưỡng 34 ký tự ≈ hai dòng ngắn, vẫn đủ chỗ cho “④ thiếu hàng 2/3 dòng”. */
    const ds = G.dsConNoToanHoSo(
      deNghiThu(),
      "ho_so_thanh_toan",
      G.CAU_HINH_MAC_DINH ?? {},
      [],
      [],
    );
    const qua = ds.filter((m) => m.length > 34);
    return {
      duoc: ds.length > 0 && qua.length === 0,
      thucTe:
        ds.length === 0
          ? "[] (không có mục nào — bài kiểm mất ý nghĩa)"
          : qua.length === 0
            ? `dài nhất ${Math.max(...ds.map((m) => m.length))} ký tự: ${JSON.stringify(ds)}`
            : `${qua.length} mục quá dài: ${JSON.stringify(qua)}`,
      mongDoi: "mỗi nhãn trên thẻ ≤ 34 ký tự",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA SẾP — 15/09/2026
// Nguyên văn: "Không cần ghi chú mục thiếu hoá đơn/UNC — Chỉ cần báo
// Hợp đồng và Đơn mua hàng"
// (ảnh chụp bảng quy trình trên bản chạy thật: thẻ 000000089 ở cột
//  "Hồ sơ thanh toán" hiện hai dòng đỏ "⑤ thiếu HĐ" và "Thiếu hoá
//  đơn"; Sếp khoanh đỏ dòng sau.)
//
// 🔴🔴 CHỈ BỎ DÒNG CHỮ TRÊN MẶT THẺ. LUẬT BẮT BUỘC CÓ HOÁ ĐƠN VẪN CÒN:
// `vuongMacDuyetHoanThanhDeNghi` (chung-tu-cuoi-quy-trinh.ts) vẫn chặn
// đóng hồ sơ khi thiếu Hóa đơn VAT. Vì vậy phải kiểm CẢ HAI CHIỀU —
// chiều nghịch mới là chiều quan trọng.
// ════════════════════════════════════════════════════════════════════

kiem(
  "CHIỀU THUẬN: thẻ kanban KHÔNG còn in dòng chữ “thiếu hoá đơn”",
  "Sếp · 15/09/2026 · “Không cần ghi chú mục thiếu hoá đơn/UNC — Chỉ cần báo Hợp đồng và Đơn mua hàng”",
  () => {
    /* Hồ sơ ở bước ⑦, chưa đính hoá đơn và cũng chưa có tệp Hợp đồng ở bước ⑤. */
    const bay = G.dsConNoBayTrenThe(
      deNghiThu(),
      "ho_so_thanh_toan",
      G.CAU_HINH_MAC_DINH ?? {},
      [],
      [],
    );
    const conHoaDon = bay.filter((m) => /ho[áa] đơn/i.test(m));
    /* 🔴 CHỐT CHỐNG "XANH RỖNG": hàm trả về mảng rỗng thì phép trên cũng xanh, mà lúc đó
       thẻ mất luôn dòng nợ Hợp đồng — chính thứ Sếp yêu cầu GIỮ. Nên đòi thêm dòng đó.
       📌 19/09/2026: nhãn đổi từ viết tắt "thiếu HĐ" sang đủ chữ "Thiếu hợp đồng" (Sếp:
       *"Bỏ số 4 đi và ghi rõ thông tin"*). Luật của bài này — *bỏ chữ hoá đơn, giữ chữ hợp
       đồng* — không đổi một ly; chỉ đổi chuỗi dùng để nhận ra mục. */
    const conHopDong = bay.some((m) => /Thiếu hợp đồng/.test(m));
    return {
      duoc: conHoaDon.length === 0 && conHopDong,
      thucTe: JSON.stringify(bay),
      mongDoi:
        'không còn mục nào nhắc hoá đơn, nhưng VẪN còn mục "Thiếu hợp đồng" (Sếp yêu cầu giữ)',
    };
  },
);

kiem(
  "CHIỀU NGHỊCH: nợ Hoá đơn VAT vẫn còn nguyên ở dải đỏ trang chi tiết, viền đỏ thẻ và số “N còn thiếu”",
  "Sếp · 15/09/2026 (bỏ GHI CHÚ, KHÔNG bỏ cảnh báo — hoá đơn vẫn chặn đóng hồ sơ)",
  () => {
    /* 🔴 BÀI NÀY CANH ĐÚNG MỘT KIỂU HỎNG: ai đó "dọn cho gọn" bằng cách XOÁ HẲN nhánh
       `giaiDoan === "ho_so_thanh_toan"` trong `mucConNoCuaBuoc` thay vì chỉ đặt cờ
       `nhacTrenThe: false`. Khi đó chiều thuận ở trên vẫn XANH, nhưng:
         · khối bước ⑧ ở trang chi tiết hết viền đỏ → người dùng không còn chỗ nào biết mình
           thiếu hoá đơn, mà `vuongMacDuyetHoanThanhDeNghi` thì vẫn chặn họ bấm Hoàn thành
         · thẻ hết viền đỏ, cột "Công việc" ở chế độ xem Danh sách hiện "—" (sạch)
       ⇒ người dùng bị chặn mà không biết vì sao. Ba phép dưới đây phải xanh cả ba. */
    const CH = G.CAU_HINH_MAC_DINH ?? {};
    const co = (x) => typeof x === "string" && /H[oó]a đơn VAT/i.test(x);

    /* ① Dải đỏ + nhãn "Còn thiếu" của khối bước ⑧ ở trang chi tiết (`conThieuCuaBuoc`). */
    const dsBuoc = G.dsConNoCuaBuoc(deNghiThu(), "ho_so_thanh_toan", CH, [], []);
    const cauBuoc = G.conNoCuaBuoc(deNghiThu(), "ho_so_thanh_toan", CH, [], []);
    /* ② Viền đỏ của thẻ + chữ hiện khi rê chuột (`the.conNo`). */
    const cauThe = G.conNoToanHoSo(deNghiThu(), "ho_so_thanh_toan", CH, [], []);
    /* ③ Con số "N còn thiếu" ở chế độ xem Danh sách (`the.dsConNo`, cố ý KHÔNG lọc). */
    const dsDem = G.dsConNoToanHoSo(deNghiThu(), "ho_so_thanh_toan", CH, [], []);

    const thieuO = [];
    if (!dsBuoc.some(co)) thieuO.push("dsConNoCuaBuoc (dải đỏ khối bước ⑧)");
    if (!co(cauBuoc)) thieuO.push("conNoCuaBuoc (câu dưới nhãn “Còn thiếu”)");
    if (!co(cauThe)) thieuO.push("conNoToanHoSo (viền đỏ thẻ + chữ rê chuột)");
    if (!dsDem.some((m) => /ho[áa] đơn/i.test(m)))
      thieuO.push("dsConNoToanHoSo (số “N còn thiếu” ở xem Danh sách)");

    return {
      duoc: thieuO.length === 0,
      thucTe:
        thieuO.length === 0
          ? "cả 4 chỗ vẫn nhắc Hóa đơn VAT"
          : `MẤT cảnh báo hoá đơn ở: ${thieuO.join(" · ")}`,
      mongDoi:
        "nợ Hóa đơn VAT vẫn hiện ở trang chi tiết, ở viền đỏ/chữ rê chuột của thẻ và ở số “N còn thiếu” — chỉ dòng chữ trên mặt thẻ mới được bỏ",
    };
  },
);

kiem(
  "Bản ĐẦY ĐỦ (chữ rê chuột) phải GIỮ nguyên lý do, không bị rút theo",
  "Ban lãnh đạo · 24/08/2026 (rút ngắn chỗ BÀY, không rút thông tin)",
  () => {
    /* Người rê chuột là người đang muốn biết chi tiết — cắt ở đây là mất đường tra cuối cùng. */
    const cau = G.conNoToanHoSo(
      deNghiThu(),
      "ho_so_thanh_toan",
      G.CAU_HINH_MAC_DINH ?? {},
      [],
      [],
    );
    return {
      duoc: typeof cau === "string" && cau.includes("Tiến hành đặt hàng"),
      thucTe: cau === null ? "null" : `"${String(cau).slice(0, 110)}…"`,
      mongDoi: "câu đầy đủ có ghi tên bước “Tiến hành đặt hàng”",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LỆCH ĐIỀU KIỆN CHUYỂN BƯỚC — Ban lãnh đạo báo LẦN THỨ HAI 24/08/2026:
// "Các điều kiện chuyển bước khi kéo ở bảng kanban chưa được sửa đồng
//  nhất với điều kiện khi thao tác trực tiếp"
//
// 🔴 MỖI BÀI DƯỚI ĐÂY LÀ MỘT ĐIỂM LỆCH ĐÃ ĐO ĐƯỢC THẬT. Đừng "dọn cho
//    gọn": xoá bài nào là mở lại đúng lỗ hổng đó.
// ════════════════════════════════════════════════════════════════════

/** Cấu hình có việc bắt buộc ở một bước, để kiểm chốt công việc. */
function cauHinhCoViecBatBuoc(buoc, tenViec) {
  const goc = G.CAU_HINH_MAC_DINH ?? {};
  return {
    ...goc,
    congViecTheoBuoc: { [buoc]: [{ ma: "viec-thu", ten: tenViec, batBuoc: true }] },
    caiDatTheoBuoc: {
      ...(goc.caiDatTheoBuoc ?? {}),
      [buoc]: { ...(goc.caiDatTheoBuoc?.[buoc] ?? {}), batBuocXongCongViec: true },
    },
  };
}

/**
 * 🔴🔴 HAI HÀM DƯỚI ĐÂY GIỮ MỘT ĐIỀU BẤT BIẾN QUA HAI CHỈ ĐẠO KHÁC NHAU — đọc kỹ trước khi sửa.
 *
 *   · Ban lãnh đạo 24/08/2026: *"Bước 2 sang bước 3 phải đính kèm báo giá và bảng so sánh giá"*
 *     → lúc đó cài bằng `khong_the` (chặn kèm toast đỏ).
 *   · Ban lãnh đạo 25/08/2026: *"Kéo qua bước phải hiển thị các trường nhập nhanh các điều kiện
 *     chuyển bước"* + *"Phải được duyệt thì mới nhảy"*
 *     → nay còn thêm `can_go_vuong`: hộp MỞ RA kèm ô đính kèm, **nút vẫn khoá** tới khi hết vướng.
 *
 * ⚠️ CHỈ ĐẠO 24/08 KHÔNG BỊ HUỶ. Điều Ban lãnh đạo đòi là *"thẻ không được sang cột khi thiếu
 * chứng từ"* — điều đó vẫn nguyên. Cái đổi chỉ là CÁCH BÁO: trước là ngõ cụt, nay là ô để gỡ tại
 * chỗ. Nên bài kiểm chuyển từ soát *một kiểu trả về* sang soát *đúng điều bất biến* — chặt hơn,
 * không lỏng đi: `can_go_vuong` còn bị đòi thêm điều kiện mà `khong_the` không bị (xem dưới).
 *
 * 🔴 TUYỆT ĐỐI KHÔNG nới thành "cho qua nếu loại nào cũng được". Còn đúng hai loại được phép, và
 * mọi loại khác (`chot_so_sanh`, `tao_bao_gia`, `mo_trang`…) đều là ĐỂ THẺ ĐI — tức lỗi đã phải
 * sửa ba lần.
 */
function khongChoThenNhayCot(r) {
  if (r?.loai === "khong_the") return true;
  if (r?.loai !== "can_go_vuong") return false;
  /* Vướng mắc phải gỡ được HẾT ngay trong hộp. Lẫn một mục phải sang màn khác thì người dùng
     đính đủ tệp vẫn không mở được nút — kẹt mà không hiểu vì sao. */
  return (
    Array.isArray(r.dieuKien) &&
    r.dieuKien.length > 0 &&
    r.dieuKien.every((d) => d.goDuocTaiCho === true)
  );
}

/** Câu đang chặn, đọc được ở CẢ HAI kiểu trả về — để bài kiểm không phải biết kiểu nào. */
function cauDangChan(r) {
  if (r?.loai === "can_go_vuong") return r.dieuKien?.map((d) => d.cau).join(" · ") ?? "";
  return r?.lyDo ?? r?.thongBao ?? "";
}

kiem(
  "vuongMacRoiBuoc soát CẢ việc của bước đang rời (đường bấm nút = đường kéo thả)",
  "Ban lãnh đạo · 24/08/2026",
  () => {
    /* 🔴 Đây là điểm lệch nặng nhất: hộp kéo thả khóa nút theo việc bắt buộc của bước ĐANG
       ĐỨNG, còn cửa ghi chỉ hỏi các bước TRƯỚC — nên kéo thẻ ③→④ bị chặn mà bấm "Duyệt" thì
       đi được. `vuongMacRoiBuoc` sinh ra để hai đường hỏi cùng một câu. */
    const ch = cauHinhCoViecBatBuoc("xet_duyet_bao_gia", "Đối chiếu đơn giá với dự toán");
    const r = G.vuongMacRoiBuoc(deNghiThu(), "xet_duyet_bao_gia", ch);
    return {
      duoc: typeof r === "string" && r.includes("Đối chiếu đơn giá với dự toán"),
      thucTe: r === null ? "null (KHÔNG CHẶN — lỗ hổng đã mở lại!)" : `"${String(r).slice(0, 90)}…"`,
      mongDoi: "chặn và gọi đúng tên việc còn treo của bước đang rời",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: vuongMacViecBatBuocCacBuocTruoc KHÔNG soát bước đang đứng",
  "Ban lãnh đạo · 24/08/2026 (chống chặn quá tay)",
  () => {
    /* 🔴 Nếu hàm này cũng soát bước đang đứng thì không ai làm được gì ở bước mình đang ở —
       việc của bước đang làm đương nhiên còn treo. Bài kiểm giữ ranh giới giữa hai hàm. */
    const ch = cauHinhCoViecBatBuoc("xet_duyet_bao_gia", "Đối chiếu đơn giá với dự toán");
    const r = G.vuongMacViecBatBuocCacBuocTruoc(deNghiThu(), "xet_duyet_bao_gia", ch);
    return {
      duoc: r === null,
      thucTe: r === null ? "null" : `"${String(r).slice(0, 80)}…"`,
      mongDoi: "null (việc của CHÍNH bước đang đứng không phải cớ để chặn)",
    };
  },
);

kiem(
  "Bước ① còn treo việc bắt buộc → KHÔNG được giao việc sang bước ②",
  "Ban lãnh đạo · 27/08/2026 (*'Tíck chọn xong mới cho giao việc'*)",
  () => {
    /* 🔴 Việc bắt buộc mặc định của bước ① là *"Checkin hàng tồn kho"* — tra kho trước khi đi
       hỏi giá, để không mua thứ đang có sẵn. Trước 27/08/2026 nó chỉ chặn trên đường KÉO THẢ;
       ba cửa ghi (lập bảng báo giá, lưu đề xuất NCC, đóng hồ sơ) đi vòng qua được. */
    const ch = cauHinhCoViecBatBuoc("tiep_nhan", "Checkin hàng tồn kho");
    const r = G.vuongMacRoiBuoc(deNghiThu(), "tiep_nhan", ch);
    return {
      duoc: typeof r === "string" && r.includes("Checkin hàng tồn kho"),
      thucTe: r === null ? "null (KHÔNG CHẶN — lỗ hổng đã mở lại!)" : `"${String(r).slice(0, 90)}…"`,
      mongDoi: "chặn và gọi đúng tên việc còn treo của bước ①",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: tích xong việc bước ① thì PHẢI cho đi tiếp (không kẹt cứng)",
  "Ban lãnh đạo · 27/08/2026 (chống chặn quá tay)",
  () => {
    /* 🔴 Bài kiểm này quan trọng ngang bài trên. Một chốt chặn được nhưng KHÔNG mở ra được thì
       hồ sơ kẹt vĩnh viễn — đúng cái bẫy đã ghi ở luật phiếu giao nhận 11/08/2026. Tích xong
       việc thì cửa phải thông ngay, không đòi thêm điều kiện nào khác. */
    const ch = cauHinhCoViecBatBuoc("tiep_nhan", "Checkin hàng tồn kho");
    const dn = deNghiThu({
      congViecDaXong: [
        {
          maCongViec: "viec-thu",
          giaiDoan: "tiep_nhan",
          nguoiXongTen: "A",
          thoiDiem: "2026-08-27",
        },
      ],
    });
    const r = G.vuongMacRoiBuoc(dn, "tiep_nhan", ch);
    return {
      duoc: r === null,
      thucTe: r === null ? "null" : `"${String(r).slice(0, 90)}…" (CHẶN QUÁ TAY — hồ sơ kẹt!)`,
      mongDoi: "null (đã tích xong thì đi được)",
    };
  },
);

kiem(
  "Bước ② phải hỏi ĐỦ BẢN BÁO GIÁ, không chỉ hỏi 'có bảng thu thập không'",
  "Ban lãnh đạo · 20/08/2026, bị lách tới 24/08/2026",
  () => {
    /* Đo được: hồ sơ mới đính 1/3 bản báo giá thì nút "Trình xét duyệt" mờ, nhưng kéo thẻ
       ②→③ đi được với toast xanh "Đã chốt đủ báo giá". */
    const bangDangThuThap = [{ id: "bg1", prId: "x", trangThai: "dang_thu_thap" }];
    const cauBaoGia = "Quy trình yêu cầu 3 bản báo giá, hiện còn thiếu 2 bản.";
    const r = G.vuongMacSangBuocSau(
      deNghiThu(),
      "yeu_cau_bao_gia",
      bangDangThuThap,
      G.CAU_HINH_MAC_DINH ?? {},
      cauBaoGia,
    );
    return {
      duoc: r === cauBaoGia,
      thucTe: r === null ? "null (LÁCH ĐƯỢC — lỗ hổng đã mở lại!)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "trả đúng câu vướng mắc báo giá do nơi gọi truyền vào",
    };
  },
);

kiem(
  "Thẻ ở bước ② phải có dấu đỏ khi thiếu bản báo giá",
  "Ban lãnh đạo · 24/08/2026",
  () => {
    /* Lệch giữa THỨ APP BÀY RA và THỨ APP THẬT SỰ CHẶN: nút thì khóa, mà thẻ không viền đỏ
       nên trông y như hồ sơ sạch đang chờ xử lý. */
    const ds = G.dsConNoToanHoSo(
      deNghiThu(),
      "yeu_cau_bao_gia",
      G.CAU_HINH_MAC_DINH ?? {},
      [],
      [],
      "Quy trình yêu cầu 3 bản báo giá, hiện còn thiếu 2 bản.",
    );
    return {
      duoc: ds.some((m) => m.includes("báo giá")),
      thucTe: JSON.stringify(ds),
      mongDoi: 'có mục nhắc thiếu báo giá (nhãn ngắn "thiếu báo giá")',
    };
  },
);

kiem(
  "Kéo sang cột Hoàn thành phải nói ĐÚNG thứ đang chặn, không nói câu viết cứng",
  "Ban lãnh đạo · 24/08/2026",
  () => {
    /* 🔴 Câu cũ viết cứng nói "giao đủ khối lượng + phiếu giao nhận + thủ kho + trưởng bộ phận
       xác nhận, thao tác ở trang chi tiết ĐƠN HÀNG" — sai cả điều kiện (không nhắc Hóa đơn
       VAT, thứ thật sự chặn) lẫn nơi phải đến (trang đơn hàng không có ô đính hóa đơn). */
    const the = { deNghi: deNghiThu(), giaiDoan: "ho_so_thanh_toan" };
    const r = G.quyetDinhKeoTha(the, "hoan_thanh", [], [], G.CAU_HINH_MAC_DINH ?? {}, null);
    /* 📌 Đọc bằng `cauDangChan` chứ không đọc thẳng `.lyDo`: từ 25/08/2026 cửa ⑦→⑧ trả
       `can_go_vuong` (hộp kèm ô đính hóa đơn) thay vì `khong_the`. Điều bài kiểm giữ vẫn y
       nguyên — câu báo phải nêu đích danh Hóa đơn VAT, không nói câu viết cứng. */
    const cau = cauDangChan(r);
    return {
      duoc:
        khongChoThenNhayCot(r) && (cau.includes("Hóa đơn VAT") || cau.includes("Hoá đơn VAT")),
      thucTe: `${r?.loai ?? "?"}: "${String(cau).slice(0, 110)}"`,
      mongDoi: "không cho thẻ nhảy cột, và câu báo phải nhắc Hóa đơn VAT (thứ thật sự chặn ở ⑦)",
    };
  },
);

kiem(
  "Kéo ⑥ → ⑦ phải nói việc cần làm, KHÔNG nói 'chưa được hỗ trợ'",
  "Ban lãnh đạo · 24/08/2026",
  () => {
    /* Chặn là ĐÚNG (hồ sơ chỉ vào ⑦ khi hàng về đủ). Cái sai là câu báo nghe như lỗi phần
       mềm, khiến người dùng đi hỏi IT thay vì đi ghi nốt phiếu nhận. */
    const the = { deNghi: deNghiThu(), giaiDoan: "nhan_hang" };
    const r = G.quyetDinhKeoTha(the, "ho_so_thanh_toan", [], [], G.CAU_HINH_MAC_DINH ?? {}, null);
    const cau = r?.thongBao ?? r?.lyDo ?? "";
    return {
      duoc: !cau.includes("chưa được hỗ trợ") && cau.includes("phiếu nhận"),
      thucTe: `${r?.loai ?? "?"}: "${String(cau).slice(0, 110)}"`,
      mongDoi: "câu nói rõ phải ghi tiếp phiếu nhận hàng",
    };
  },
);

kiem(
  "Kéo sang cột Thất bại KHÔNG bị chặn bởi việc bắt buộc còn treo",
  "Ban lãnh đạo · 24/08/2026",
  () => {
    /* 🔴 App từng buộc người dùng tích "Checkin hàng tồn kho" — tức ghi một dữ liệu SAI — chỉ
       để hủy một hồ sơ mà công trình đã bỏ nhu cầu. Việc bắt buộc là điều kiện ĐI TIẾP trong
       quy trình; hủy hồ sơ là RA KHỎI quy trình. */
    const ch = cauHinhCoViecBatBuoc("tiep_nhan", "Checkin hàng tồn kho");
    const the = { deNghi: deNghiThu(), giaiDoan: "tiep_nhan" };
    const r = G.quyetDinhKeoTha(the, "that_bai", [], [], ch, null);
    return {
      duoc: r?.loai === "dong_do",
      thucTe: `${r?.loai ?? "?"}${r?.lyDo ? `: "${String(r.lyDo).slice(0, 70)}"` : ""}`,
      mongDoi: 'loai = "dong_do" (cho đóng dở, chỉ đòi ghi lý do)',
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// HỢP ĐỒNG CHUYỂN TỪ BƯỚC ④ SANG ⑤ — Ban lãnh đạo 24/08/2026:
// "Hợp đồng mua hàng em đưa sang bước tiến hành đặt hàng"
// ════════════════════════════════════════════════════════════════════

kiem(
  "Hợp đồng đính TRƯỚC 24/08 (khóa cũ bước ④) vẫn phải đọc ra được",
  "Ban lãnh đạo · 24/08/2026",
  () => {
    /* 🔴 BÀI KIỂM QUAN TRỌNG NHẤT CỦA LẦN CHUYỂN NÀY. Chỉ đọc khóa mới thì mọi hợp đồng đã
       đính kèm trước hôm nay BIẾN MẤT khỏi hồ sơ: app báo "chưa có Hợp đồng", tô đỏ và chặn,
       trong khi tệp vẫn nằm nguyên trong dữ liệu. Người dùng không hiểu vì sao. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const dnCu = {
      id: "x",
      items: [],
      tepGiaiDoan: {
        lap_don_mua_hang: [{ id: "t1", ten: "HD-2026.pdf", ghiChu: "Hợp đồng" }],
      },
    };
    return {
      duoc: CT.coHopDong(dnCu) === true,
      thucTe: `coHopDong = ${CT.coHopDong(dnCu)}, số tệp đọc ra = ${CT.tepHopDong(dnCu).length}`,
      mongDoi: "true (đọc được hợp đồng đính ở khóa cũ `lap_don_mua_hang`)",
    };
  },
);

kiem(
  "Hợp đồng đính ở khóa MỚI (bước ⑤) cũng đọc ra được",
  "Ban lãnh đạo · 24/08/2026",
  () => {
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const dnMoi = {
      id: "x",
      items: [],
      tepGiaiDoan: { dat_hang: [{ id: "t2", ten: "HD-moi.pdf", ghiChu: "Hợp đồng" }] },
    };
    return {
      duoc: CT.coHopDong(dnMoi) === true,
      thucTe: `coHopDong = ${CT.coHopDong(dnMoi)}`,
      mongDoi: "true (khóa mới `dat_hang`)",
    };
  },
);

kiem(
  "Thiếu hợp đồng thì tô đỏ ở bước ⑤, KHÔNG tô ở bước ④",
  "Ban lãnh đạo · 24/08/2026",
  () => {
    /* Tô đỏ ở ④ là chỉ người dùng mở một khối không còn chứa ô đính kèm đó — họ đi tìm và
       không thấy. */
    const CH = G.CAU_HINH_MAC_DINH ?? {};
    const o4 = G.dsConNoCuaBuoc(deNghiThu(), "lap_don_mua_hang", CH, [], []);
    const o5 = G.dsConNoCuaBuoc(deNghiThu(), "dat_hang", CH, [], []);
    const coO5 = o5.some((m) => m.includes("Hợp đồng") || m.includes("HĐ"));
    const coO4 = o4.some((m) => m.includes("Hợp đồng") || m.includes("HĐ"));
    return {
      duoc: coO5 && !coO4,
      thucTe: `bước ④ = ${JSON.stringify(o4)} · bước ⑤ = ${JSON.stringify(o5)}`,
      mongDoi: "bước ⑤ có nhắc hợp đồng, bước ④ thì không",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// ĐƠN XONG HÀNG ≠ ĐỀ NGHỊ HOÀN THÀNH — Ban lãnh đạo 27/08/2026
//
// 🔴 LỖI THẬT ĐÃ XẢY RA TRÊN BẢN CHẠY THẬT, và nó là hậu quả DÂY CHUYỀN:
//   · Sáng 27/08 gỡ điều kiện hoá đơn VAT khỏi nút "Xác nhận hoàn thành đơn" (đúng chỉ đạo).
//   · Từ đó `po.trangThai = "hoan_thanh"` chỉ còn nghĩa "hàng về đủ + có phiếu giao nhận".
//   · Nhưng `xacDinhGiaiDoan` còn một nhánh TỰ SUY: mọi đơn `hoan_thanh` → đề nghị `hoan_thanh`.
//   · Kết quả: thẻ nhảy thẳng sang cột Hoàn thành trong khi còn thiếu hoá đơn, thiếu hợp đồng
//     và còn một việc chưa xong — Ban lãnh đạo chụp lại đúng ba cờ đỏ đó.
//
// Ban lãnh đạo: *"Việc xác nhận đó mới chỉ là hoàn thành công việc của bước tiến hành nhận
// hàng thôi. Và chỉ được đẩy qua bước hồ sơ thanh toán. Khi nào bổ sung đủ điều kiện của bước
// HSTT thì mới được đẩy qua hoàn thành"*.
//
// 👉 BÀI HỌC: đổi Ý NGHĨA của một trạng thái thì phải soát MỌI nơi ĐỌC nó, không chỉ nơi ghi.
// ════════════════════════════════════════════════════════════════════

/**
 * Bộ dữ liệu cho ba bài kiểm giai đoạn.
 *
 * 🔴 TÊN TRƯỜNG PHẢI ĐÚNG TỪNG CHỮ, và đây là chỗ đã sai một lần: bản đầu của bài kiểm này dùng
 * `sttDongPR` và `khoiLuong`, trong khi `tinhTienDoDeNghi` đọc `sttDongDeNghi` và `khoiLuongDeNghi`.
 * Sai tên trường thì `tinhTienDoDeNghi` không khớp được dòng nào, `daVeDu` thành false, và hàm trả
 * "nhan_hang" — bài kiểm viết `duoc: gd !== "hoan_thanh"` vẫn XANH, tức xanh giả.
 *
 * 👉 Vì vậy cả ba bài dưới đòi ĐÚNG một giá trị, không dùng phép "khác X".
 */
function boGiaiDoanThu() {
  return {
    dn: {
      id: "d1",
      code: "26001/HDXD-X-PR-001",
      trangThai: "dang_xu_ly",
      items: [{ stt: 1, tenVatLieu: "Thep", donViTinh: "kg", khoiLuongDeNghi: 100 }],
    },
    po: {
      id: "po1",
      prId: "d1",
      code: "DMH260001",
      trangThai: "hoan_thanh",
      maDuAn: "X",
      ngayGiaoDuKien: "2026-08-20",
      items: [
        { sttDong: 1, sttDongDeNghi: 1, tenVatLieu: "Thep", donViTinh: "kg", khoiLuongDat: 100 },
      ],
    },
    phieu: (kl) => [
      {
        poId: "po1",
        lanGiaoThu: 1,
        ngayNhanThucTe: "2026-08-20",
        trangThai: "da_nhap_kho",
        lines: [{ sttDongPO: 1, khoiLuongThucNhan: kl }],
      },
    ],
  };
}

kiem(
  "Mọi đơn đã xong hàng nhưng CHƯA bấm nút → đề nghị dừng ở ⑦, KHÔNG nhảy sang Hoàn thành",
  "Ban lãnh đạo · 27/08/2026",
  () => {
    const b = boGiaiDoanThu();
    const gd = G.xacDinhGiaiDoan(b.dn, [b.po], [], b.phieu(100));
    return {
      /* Đòi ĐÚNG "ho_so_thanh_toan", không chỉ "khác hoan_thanh". Chặn quá tay cũng là lỗi:
         thẻ kẹt lại ở "nhan_hang" thì hồ sơ không bao giờ đóng được. */
      duoc: gd === "ho_so_thanh_toan",
      thucTe: `xacDinhGiaiDoan = "${gd}"`,
      mongDoi: '"ho_so_thanh_toan" — đúng lời Sếp: "chỉ được đẩy qua bước hồ sơ thanh toán"',
    };
  },
);

kiem(
  "Bấm nút Hoàn thành quy trình (deNghi.trangThai) thì MỚI vào cột Hoàn thành",
  "Ban lãnh đạo · 27/08/2026",
  () => {
    /* Chiều ngược: chặn quá tay là hồ sơ không bao giờ đóng được. */
    const b = boGiaiDoanThu();
    const gd = G.xacDinhGiaiDoan({ ...b.dn, trangThai: "hoan_thanh" }, [b.po], [], b.phieu(100));
    return {
      duoc: gd === "hoan_thanh",
      thucTe: `xacDinhGiaiDoan = "${gd}"`,
      mongDoi: '"hoan_thanh" — đây là đường DUY NHẤT còn lại vào cột Hoàn thành',
    };
  },
);

kiem(
  "Hàng CHƯA về đủ thì thẻ vẫn ở ⑥ Tiến hành nhận hàng",
  "Ban lãnh đạo · 27/08/2026",
  () => {
    /* Chốt thứ ba: bảo đảm hai bài trên không xanh nhờ hàm trả bừa một giá trị cố định. */
    const b = boGiaiDoanThu();
    const gd = G.xacDinhGiaiDoan(b.dn, [b.po], [], b.phieu(50));
    return {
      duoc: gd === "nhan_hang",
      thucTe: `xacDinhGiaiDoan = "${gd}" (mới nhận 50/100)`,
      mongDoi: '"nhan_hang" — chưa đủ hàng thì chưa mở hồ sơ thanh toán',
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// CÔNG NỢ THEO ĐƠN HÀNG — bảng 8 cột, Ban lãnh đạo 27/08/2026
//
// ⚠️ HAI QUY TẮC DƯỚI ĐÂY LÀ GIẢ ĐỊNH CỦA PHIÊN NGHIỆP VỤ, CHƯA ĐƯỢC SẾP XÁC NHẬN
//    · mốc tính nợ = ngày nhận hàng LẦN CUỐI
//    · ngưỡng "sắp đến hạn" = 7 ngày
// Căn cứ đã có: chú thích của `soNgayDuocNo` ghi "kể từ ngày nhận hàng", và thẻ KPI ghi
// "Cần bố trí thanh toán trong tuần". Sếp chốt khác thì SỬA CẢ HÀM LẪN BÀI KIỂM, và ghi
// lại ngày chốt ở đây.
//
// 🔴 Ba bài kiểm này bảo vệ những thứ SAI LÀ RA SỐ TIỀN SAI. Trước 27/08/2026 màn công nợ
// không có dòng nào nên không ai nhìn ra được lỗi bằng mắt.
// ════════════════════════════════════════════════════════════════════

/** Dựng bộ dữ liệu công nợ để gọi thật — tên trường lấy đúng theo `tinhTienDoPO`. */
function boCongNoThu() {
  const po = (id, code, ncc) => ({
    id,
    code,
    supplierTen: ncc,
    trangThai: "da_chot",
    maDuAn: "X",
    items: [{ sttDong: 1, tenVatLieu: "Thep", donViTinh: "kg", khoiLuongDat: 100 }],
  });
  const gia = (poId, donGia, ngayNo) => ({
    poId,
    lines: [{ sttDong: 1, donGia, thueSuatGTGT: 8 }],
    thueSuatGTGT: 8,
    soNgayDuocNo: ngayNo,
  });
  const phieu = (poId, lan, ngay, kl) => ({
    poId,
    lanGiaoThu: lan,
    ngayNhanThucTe: ngay,
    trangThai: "da_nhap_kho",
    lines: [{ sttDongPO: 1, khoiLuongThucNhan: kl }],
  });
  return {
    moc: new Date(2026, 7, 27), // 27/08/2026
    donHang: [
      po("p1", "DMH260001", "NCC A"), // giao 2 đợt: 01/06 rồi 01/07
      po("p2", "DMH260003", "NCC C"), // không ghi số ngày được nợ
      po("p3", "DMH260004", "NCC D"), // mới nhận 50/100
    ],
    giaDon: [gia("p1", 10000, 30), gia("p2", 30000, undefined), gia("p3", 40000, 30)],
    phieuNhan: [
      phieu("p1", 1, "2026-06-01", 60),
      phieu("p1", 2, "2026-07-01", 40),
      phieu("p2", 1, "2026-08-20", 100),
      phieu("p3", 1, "2026-08-01", 50),
    ],
  };
}

kiem(
  "Ngày BẮT ĐẦU nhập tay đè lên ngày nhận hàng, ngày tới hạn tự tính THEO ngày bắt đầu",
  "Ban lãnh đạo · 06/09/2026 (*'ngày này được phép điều chỉnh'* + *'cố định ngày tới hạn'*)",
  () => {
    /* 🔴 ĐẢO so với 28/08: nay NGÀY BẮT ĐẦU là ô nhập tay, ngày tới hạn cố định tự tính từ nó.
       p1: nhận 2 đợt 01/06 rồi 01/07 → ngày nhận cuối = 2026-07-01, soNgayDuocNo = 30.
       Gõ tay ngày bắt đầu = 2026-06-15 (khác ngày nhận cuối) → ngày tới hạn PHẢI theo ngày tay:
       2026-06-15 + 30 = 2026-07-15, chứ không phải theo ngày nhận cuối (2026-07-31). */
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const b = boCongNoThu();
    const gia = b.giaDon.map((g) =>
      g.poId === "p1" ? { ...g, ngayBatDauTinhNoTay: "2026-06-15" } : g,
    );
    const d = TN.congNoTheoDonHang(b.donHang, gia, b.phieuNhan, b.moc).find(
      (x) => x.maDonHang === "DMH260001",
    );
    return {
      duoc:
        d?.ngayBatDau === "2026-06-15" &&
        d?.batDauNhapTay === true &&
        d?.ngayToiHan === "2026-07-15",
      thucTe: `ngayBatDau = ${d?.ngayBatDau} · batDauNhapTay = ${d?.batDauNhapTay} · ngayToiHan = ${d?.ngayToiHan}`,
      mongDoi: "bắt đầu 2026-06-15 (gõ tay), tới hạn 2026-07-15 (tự tính theo ngày bắt đầu)",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: xóa ngày bắt đầu gõ tay thì QUAY VỀ ngày nhận hàng lần cuối",
  "Ban lãnh đạo · 06/09/2026 (chống kẹt)",
  () => {
    /* 🔴 Quan trọng ngang bài trên. Một trường nhập tay mà không xóa được để về tự suy thì người
       lỡ gõ nhầm sẽ mắc kẹt vĩnh viễn.
       ⚠️ Kiểm cả chuỗi RỖNG: ô ngày bị xóa trắng trả về `""`, mà `"" ?? x` cho ra `""` chứ không
       rơi về `x` — để lọt là ngày bắt đầu thành rỗng, kéo theo ngày tới hạn rỗng và cảnh báo NaN. */
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const b = boCongNoThu();
    const gia = b.giaDon.map((g) => (g.poId === "p1" ? { ...g, ngayBatDauTinhNoTay: "" } : g));
    const d = TN.congNoTheoDonHang(b.donHang, gia, b.phieuNhan, b.moc).find(
      (x) => x.maDonHang === "DMH260001",
    );
    return {
      duoc:
        d?.ngayBatDau === "2026-07-01" &&
        d?.batDauNhapTay === false &&
        d?.ngayToiHan === "2026-07-31",
      thucTe: `ngayBatDau = ${d?.ngayBatDau} · batDauNhapTay = ${d?.batDauNhapTay} · ngayToiHan = ${d?.ngayToiHan}`,
      mongDoi: "bắt đầu 2026-07-01 (ngày nhận cuối), tới hạn 2026-07-31 (tự tính lại)",
    };
  },
);

kiem(
  "Công nợ tính từ ngày nhận hàng LẦN CUỐI, không phải lần đầu",
  "phiên nghiệp vụ · 27/08/2026 (giả định, chờ Sếp xác nhận)",
  () => {
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const b = boCongNoThu();
    const ra = TN.congNoTheoDonHang(b.donHang, b.giaDon, b.phieuNhan, b.moc);
    const d = ra.find((x) => x.maDonHang === "DMH260001");
    return {
      duoc: d?.ngayBatDau === "2026-07-01" && d?.ngayToiHan === "2026-07-31",
      thucTe: `ngayBatDau = ${d?.ngayBatDau} · ngayToiHan = ${d?.ngayToiHan}`,
      mongDoi: "batDau = 2026-07-01 (lần giao thứ 2), toiHan = 2026-07-31 (+30 ngày)",
    };
  },
);

kiem(
  "Đơn CHƯA nhận đủ hàng KHÔNG được vào bảng công nợ",
  "phiên nghiệp vụ · 27/08/2026",
  () => {
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const b = boCongNoThu();
    const ra = TN.congNoTheoDonHang(b.donHang, b.giaDon, b.phieuNhan, b.moc);
    const co = ra.some((x) => x.maDonHang === "DMH260004");
    return {
      duoc: !co && ra.length === 2,
      thucTe: `số dòng = ${ra.length}, có DMH260004 (mới nhận 50/100) = ${co}`,
      mongDoi: "2 dòng, KHÔNG có đơn chưa nhận đủ — đưa vào là thổi phồng dư nợ",
    };
  },
);

kiem(
  "Thiếu số ngày được nợ thì KHÔNG bịa ngày tới hạn",
  "phiên nghiệp vụ · 27/08/2026",
  () => {
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const b = boCongNoThu();
    const ra = TN.congNoTheoDonHang(b.donHang, b.giaDon, b.phieuNhan, b.moc);
    const d = ra.find((x) => x.maDonHang === "DMH260003");
    return {
      duoc: d?.ngayToiHan === undefined && d?.canhBao?.tong === "neutral",
      thucTe: `ngayToiHan = ${d?.ngayToiHan} · cảnh báo = ${JSON.stringify(d?.canhBao)}`,
      mongDoi: 'ngayToiHan undefined và cảnh báo tông "neutral" — không được báo là trong hạn',
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// HÓA ĐƠN VAT: CHẶN Ở BƯỚC ⑧, KHÔNG CHẶN Ở BƯỚC ⑦
//
// 🔴 Ban lãnh đạo 27/08/2026: *"Phần xác nhận đơn hàng này chỉ cần có
//    đính kèm phiếu giao hàng là được xác nhận hoàn thành"*.
//
// Hai bài dưới đây kiểm HAI CHIỀU, cố ý. Chỉ kiểm một chiều thì:
//   · chỉ kiểm ⑦ không đòi  → ai bỏ nốt luật ở ⑧ vẫn xanh, mà bỏ là hồ
//     sơ đóng được khi chưa có hóa đơn, Kế toán không hạch toán được;
//   · chỉ kiểm ⑧ có đòi     → ai gọi lại hàm ở nút ⑦ "cho chắc" vẫn
//     xanh, và đơn lại kẹt dở dang chờ hóa đơn như trước 27/08.
// ════════════════════════════════════════════════════════════════════

kiem(
  "Hoàn thành QUY TRÌNH (⑧) vẫn ĐÒI hóa đơn VAT",
  "Ban lãnh đạo · 27/08/2026",
  () => {
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const dnKhongHoaDon = { id: "x", items: [], tepGiaiDoan: {} };
    const cau = CT.vuongMacDuyetHoanThanhDeNghi(dnKhongHoaDon);
    return {
      duoc: typeof cau === "string" && /[Hh]óa đơn/.test(cau),
      thucTe: `vuongMacDuyetHoanThanhDeNghi = ${JSON.stringify(cau)}`,
      mongDoi: "một câu chặn có nhắc tới hóa đơn (KHÔNG được trả null)",
    };
  },
);

kiem(
  "Xác nhận hoàn thành ĐƠN (⑦) KHÔNG được đòi hóa đơn VAT",
  "Ban lãnh đạo · 27/08/2026",
  () => {
    /* Đo trên MÃ NGUỒN của tầng ghi, vì điều kiện nằm trong `useCallback` của kho dữ liệu —
       không gọi thẳng ra được.

       🔴 NEO BẰNG CHUỖI KHAI BÁO ĐẦY ĐỦ, KHÔNG NEO BẰNG TÊN TRỜI. Bản đầu của bài kiểm này neo
       bằng `indexOf("xacNhanTruongBP")` và trúng ngay dòng CHÚ THÍCH ở đầu tệp, cắt ra một khối
       541 ký tự chẳng liên quan — bài kiểm XANH GIẢ, không bắt được gì. Đã đo lại và sửa. */
    const nguon = readFileSync("3-du-lieu/kho-du-lieu.tsx", "utf8");
    const dau = nguon.indexOf("const xacNhanTruongBP = useCallback(");
    const cuoi = nguon.indexOf("const taoBaoGiaGiaLap", dau);
    if (dau < 0 || cuoi < 0) {
      return {
        duoc: false,
        thucTe: `không tìm ra thân hàm (dau=${dau}, cuoi=${cuoi}) — có ai đổi tên hàm?`,
        mongDoi: "đọc được thân hàm `xacNhanTruongBP` để soát",
      };
    }
    const khoiXacNhan = nguon.slice(dau, cuoi);
    /* Bỏ chú thích trước khi tìm — chú thích của chính luật này có nhắc tên hàm, mà chú thích
       thì không chạy được nên không được tính là "đang gọi". Đúng bài học 24/08/2026. */
    const chayThat = khoiXacNhan
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^[ \t]*\/\/.*$/gm, "");
    const conGoi = /vuongMacDuyetHoanThanhDeNghi\s*\(/.test(chayThat);
    return {
      /* Đòi khối đủ dài: cắt trượt thành chuỗi ngắn thì phép `!conGoi` luôn đúng — xanh giả. */
      duoc: !conGoi && chayThat.length > 800,
      thucTe: `thân hàm ${khoiXacNhan.length} ký tự (bỏ chú thích còn ${chayThat.length}) · còn gọi luật hóa đơn = ${conGoi}`,
      mongDoi: "nút ⑦ chỉ đòi: hàng về đủ + thủ kho xác nhận (tức có tệp phiếu giao nhận)",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// KÉO ② → ③ PHẢI CHẶN KHI THIẾU BÁO GIÁ / BẢNG SO SÁNH
//
// 🔴 Ban lãnh đạo báo LẦN THỨ BA ngày 24/08/2026: *"sao kéo chuyển bước
//    chưa có các điều kiện giống chuyển bước trong chi tiết. Ví dụ: Bước
//    2 sang bước 3 phải đính kèm báo giá và bảng so sánh giá..."*
//
// Hai lần sửa trước KHÔNG ăn vì `quyetDinhKeoTha` tính ra vướng mắc rồi
// VỨT ĐI: đoạn cuối hàm ghi "hành động làm việc thật chính là cách gỡ
// vướng, nên cho đi". Câu đó đúng với MỘT ca (chưa có bảng → lập bảng)
// và sai với ca này: `chot_so_sanh` KHÔNG làm cho có thêm bản báo giá.
// ════════════════════════════════════════════════════════════════════

/** Bảng báo giá đang thu thập — đủ để `hanhDongTienMotBuoc` trả `chot_so_sanh`. */
const bangDangThuThap = [{ id: "bg1", prId: "pr-thu", trangThai: "dang_thu_thap" }];

kiem(
  "Kéo ② → ③ khi THIẾU bản báo giá → phải CHẶN (đúng ca Ban lãnh đạo nêu)",
  "Ban lãnh đạo · 24/08/2026 (báo lần thứ ba)",
  () => {
    const cauThieu = "Quy trình yêu cầu 3 bản báo giá, hiện còn thiếu 2 bản.";
    const the = { deNghi: deNghiThu(), giaiDoan: "yeu_cau_bao_gia" };
    const r = G.quyetDinhKeoTha(
      the,
      "xet_duyet_bao_gia",
      [],
      bangDangThuThap,
      G.CAU_HINH_MAC_DINH ?? {},
      cauThieu,
    );
    /* ⚠️ TỪ 25/08/2026 ĐÚNG HAI KIỂU TRẢ VỀ ĐƯỢC CHẤP NHẬN — xem `khongChoThenNhayCot`. Điều Ban
       lãnh đạo đòi ngày 24/08 (*"thẻ không sang cột ③ khi thiếu bản báo giá"*) vẫn nguyên; chỉ
       khác là nay hộp mở ra kèm ô đính kèm thay vì một toast đỏ ngõ cụt. */
    return {
      duoc: khongChoThenNhayCot(r) && cauDangChan(r).includes("bản báo giá"),
      thucTe: `${r?.loai ?? "?"}: "${String(cauDangChan(r)).slice(0, 80)}"`,
      mongDoi: "không cho thẻ sang cột ③, kèm đúng câu thiếu bản báo giá",
    };
  },
);

kiem(
  "Kéo ② → ③ khi thiếu BẢNG SO SÁNH → phải CHẶN",
  "Ban lãnh đạo · 20/08/2026 + 24/08/2026",
  () => {
    const cauThieu = 'Chưa đính kèm “Bảng so sánh báo giá”. Bảng này bắt buộc phải có trước khi trình.';
    const the = { deNghi: deNghiThu(), giaiDoan: "yeu_cau_bao_gia" };
    const r = G.quyetDinhKeoTha(
      the,
      "xet_duyet_bao_gia",
      [],
      bangDangThuThap,
      G.CAU_HINH_MAC_DINH ?? {},
      cauThieu,
    );
    return {
      duoc: khongChoThenNhayCot(r) && cauDangChan(r).includes("so sánh"),
      thucTe: `${r?.loai ?? "?"}: "${String(cauDangChan(r)).slice(0, 80)}"`,
      mongDoi: "không cho thẻ sang cột ③, kèm câu thiếu bảng so sánh",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: đủ báo giá thì kéo ② → ③ phải ĐI ĐƯỢC",
  "Ban lãnh đạo · 24/08/2026 (chống chặn quá tay)",
  () => {
    /* Chặn cả khi đã đủ là quy trình tắc hẳn — bài kiểm này giữ cho bản sửa không đi quá. */
    const the = { deNghi: deNghiThu(), giaiDoan: "yeu_cau_bao_gia" };
    const r = G.quyetDinhKeoTha(
      the,
      "xet_duyet_bao_gia",
      [],
      bangDangThuThap,
      G.CAU_HINH_MAC_DINH ?? {},
      null,
    );
    return {
      duoc: r?.loai === "chot_so_sanh",
      thucTe: `${r?.loai ?? "?"}${r?.lyDo ? `: "${String(r.lyDo).slice(0, 70)}"` : ""}`,
      mongDoi: 'loai = "chot_so_sanh" (đủ điều kiện thì cho chốt)',
    };
  },
);

kiem(
  "NGOẠI LỆ vẫn sống: bước ② CHƯA CÓ bảng báo giá thì cho lập bảng",
  "Bài học 14/08 + 23/08/2026 (đừng chặn quá tay)",
  () => {
    /* 🔴 Chặn ca này là người dùng BÍ HOÀN TOÀN: trên bảng quy trình không còn đường nào khác
       để lập bảng báo giá. Đã phải sửa một lần ngày 14/08, và bộ thử 23/08 bắt lại đúng lỗi
       này. Đây là ngoại lệ DUY NHẤT được đi tiếp khi còn vướng. */
    const the = { deNghi: deNghiThu(), giaiDoan: "yeu_cau_bao_gia" };
    const r = G.quyetDinhKeoTha(the, "xet_duyet_bao_gia", [], [], G.CAU_HINH_MAC_DINH ?? {}, null);
    return {
      duoc: r?.loai === "tao_bao_gia",
      thucTe: `${r?.loai ?? "?"}${r?.lyDo ? `: "${String(r.lyDo).slice(0, 70)}"` : ""}`,
      mongDoi: 'loai = "tao_bao_gia" (mở màn lập bảng, không chặn)',
    };
  },
);

kiem(
  "Bước ① còn dòng chưa phân bổ → vẫn CHẶN (ngoại lệ không được nới sang bước ①)",
  "Ban lãnh đạo · 10/08/2026",
  () => {
    /* ⚠️ Bước ① cũng trả `tao_bao_gia`, nhưng vướng mắc của nó là "còn dòng chưa phân bổ" —
       lập bảng báo giá xong vẫn còn dòng không ai nhận. Nếu ai rút gọn điều kiện ngoại lệ
       thành mỗi `loai === "tao_bao_gia"` thì ca này lọt. */
    const dnThieuPhanBo = {
      id: "x",
      items: [{ stt: 1, nguoiPhuTrachUid: "u1" }, { stt: 2 }],
      congViecDaXong: [],
      tepTheoKhoa: {},
    };
    const the = { deNghi: dnThieuPhanBo, giaiDoan: "tiep_nhan" };
    const r = G.quyetDinhKeoTha(the, "yeu_cau_bao_gia", [], [], G.CAU_HINH_MAC_DINH ?? {}, null);
    return {
      duoc: r?.loai === "khong_the" && String(r.lyDo).includes("phân bổ"),
      thucTe: `${r?.loai ?? "?"}${r?.lyDo ? `: "${String(r.lyDo).slice(0, 80)}"` : ""}`,
      mongDoi: 'loai = "khong_the" kèm câu còn dòng chưa phân bổ',
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// SỐ BẢN BÁO GIÁ: KHÔNG ĐẶT RIÊNG THÌ RƠI VỀ CẤU HÌNH QUY TRÌNH
//
// 🔴 Lỗ hổng đo được 24/08/2026: `soBaoGiaCanCo` chỉ đọc `items[].soBaoGiaYeuCau`, không đọc
//    `cauHinh.soBaoGiaToiThieu`. Trưởng bộ phận giao việc mà để ô "Số báo giá yêu cầu" ở mục
//    "Không yêu cầu riêng" (ô đó KHÔNG bắt buộc) → cần 0 bản → `vuongMacTrinhXetDuyet` trả null
//    NGAY, bỏ qua cả phép kiểm bảng so sánh. Hồ sơ 0 tệp báo giá vẫn trình xét duyệt được, CẢ
//    bằng nút LẪN bằng kéo thả. Tức cấu hình quy trình của công ty bị vô hiệu hoàn toàn — trong
//    khi bảng phân bổ vẫn in "Quy trình yêu cầu tối thiểu 02 báo giá".
// ════════════════════════════════════════════════════════════════════

kiem(
  "Không đặt số riêng → rơi về cấu hình quy trình, KHÔNG phải 0",
  "Ban lãnh đạo · 20/08/2026 (luật bị vô hiệu tới 24/08)",
  () => {
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const dn = { id: "x", items: [{ stt: 1 }, { stt: 2 }], tepGiaiDoan: {} };
    const can = BG.soBaoGiaCanCo(dn, { soBaoGiaToiThieu: 2 });
    return {
      duoc: can === 2,
      thucTe: `cần ${can} bản`,
      mongDoi: "2 (lấy từ cauHinh.soBaoGiaToiThieu)",
    };
  },
);

kiem(
  "Đặt riêng cho dòng thì con số đó THẮNG cấu hình chung",
  "Ban lãnh đạo · 20/08/2026",
  () => {
    /* Trưởng bộ phận biết dòng nào cần hỏi kỹ hơn mức tối thiểu — số riêng phải thắng. */
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const dn = { id: "x", items: [{ stt: 1, soBaoGiaYeuCau: 3 }, { stt: 2 }], tepGiaiDoan: {} };
    const can = BG.soBaoGiaCanCo(dn, { soBaoGiaToiThieu: 2 });
    return { duoc: can === 3, thucTe: `cần ${can} bản`, mongDoi: "3 (số riêng > mức tối thiểu)" };
  },
);

kiem(
  "SL Bao gia = 1 -> CHI can 1 ban, du cau hinh chung doi 2",
  'Sếp · 18/09/2026 — *"Số lượng 1 thì chỉ mở 1 mục đính kèm báo giá thôi"*',
  () => {
    /* 🔴 ĐÂY LÀ CHIỀU MỚI MỞ 18/09/2026. Trước đó hàm lấy `Math.max(riêng, chung)` nên đặt 1 vẫn
       ra 2 — trong khi chính app dạy người dùng rằng *"số đó thắng số này"* (ô Số báo giá tối
       thiểu ở trang Cài đặt, và hộp kéo thẻ Kanban đều in câu ấy). Người đặt 1 rồi mong ra 1 là
       làm đúng như app dạy.

       ⚠️ AI HẠ ĐƯỢC: chỉ Trưởng bộ phận. Nhân viên bị kẹp sàn ở mốc TP giao — chốt đó nằm ở
       `datSoBaoGiaChoPhieu` (tầng ghi) và `sanSoBaoGiaTPGiao` (nút ±). Bài kiểm ngay dưới canh. */
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const dn = {
      id: "x",
      items: [{ stt: 1, soBaoGiaYeuCau: 1 }, { stt: 2, soBaoGiaYeuCau: 1 }],
      tepGiaiDoan: {},
    };
    const can = BG.soBaoGiaCanCo(dn, { soBaoGiaToiThieu: 2 });
    return { duoc: can === 1, thucTe: `cần ${can} bản`, mongDoi: "1 — số đặt riêng thắng cả khi NHỎ hơn" };
  },
);

kiem(
  "CHIEU NGHICH — KHONG dat so nao thi VAN ve cau hinh chung (chot su co 24/08)",
  'Sếp · 18/09/2026 (giữ nguyên luật Ban lãnh đạo 20/08/2026)',
  () => {
    /* 🔴 Chống cách sửa "gọn tay" cho yêu cầu 18/09: bỏ hẳn `canChung` và luôn lấy số riêng. Làm
       vậy thì hồ sơ KHÔNG dòng nào đặt số quay về `0` — cổng `vuongMacTrinhXetDuyet` mở toang,
       hồ sơ 0 tệp báo giá vẫn trình xét duyệt được. Đúng sự cố 24/08/2026 đã mất công vá một lần.
       Hai ca này KHÁC NHAU: "để trống" là không ai quyết, "đặt rõ 1" là có người chịu trách nhiệm. */
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const trong = BG.soBaoGiaCanCo({ id: "x", items: [{ stt: 1 }], tepGiaiDoan: {} }, { soBaoGiaToiThieu: 3 });
    const soKhong = BG.soBaoGiaCanCo(
      { id: "x", items: [{ stt: 1, soBaoGiaYeuCau: 0 }], tepGiaiDoan: {} },
      { soBaoGiaToiThieu: 3 },
    );
    return {
      duoc: trong === 3 && soKhong === 3,
      thucTe: `bo trong=${trong} · dat 0=${soKhong}`,
      mongDoi: "ca hai = 3 — chi so >= 1 moi tinh la 'co nguoi dat'",
    };
  },
);

/* ════════════════════════════════════════════════════════════════════
   ★★ SAN CUA NUT GIAM "SL Bao gia" — Sếp 16/09/2026
   *"Phai co them nut giam va chi duoc giam ve muc duoc giao. Vi du: TP giao 2 bao gia nhung toi
   nhan vien bam len 3 thi phai co them nut giam ve 2"*, chot them: *"neu co lo bam tang len thi
   cung duoc bam giam ve lai muc duoc giao"*.

   🔴 KHONG DAO CHI DAO 13/09/2026 (*"nhan vien chi duoc tang, ko duoc bam giam"*). Cai 13/09 chan
   la **nhan vien tu noi luat dang cham chinh minh** — ha xuong DUOI muc TP yeu cau. Dieu do van
   nguyen. Thu duoc mo chi la go cu bam nham cua chinh ho.
   ════════════════════════════════════════════════════════════════════ */

kiem(
  "SAN = muc TP giao, KHONG phai so dang luu (nhan vien bam tang khong nang san)",
  'Sếp · 16/09/2026 — *"chi duoc giam ve muc duoc giao"*',
  () => {
    /* 🔴 DAY LA DIEM CHINH CUA CA VIEC. Truoc 16/09 san lay `max(soBaoGiaYeuCau dang luu)`, nen
       nhan vien bam + len 5 thi san cung thanh 5 — cu bam nham TU KHOA LAI CHINH NO. Nay san doc
       `soBaoGiaTPGiao`, mot con so chi TP dat duoc. */
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const dn = {
      id: "x",
      items: [
        { stt: 1, soBaoGiaYeuCau: 5, soBaoGiaTPGiao: 2 },
        { stt: 2, soBaoGiaYeuCau: 5, soBaoGiaTPGiao: 2 },
      ],
      tepGiaiDoan: {},
    };
    const san = BG.sanSoBaoGiaTPGiao(dn);
    return {
      duoc: san === 2,
      thucTe: `san = ${san} (so dang luu la 5)`,
      mongDoi: "2 — san theo muc TP giao, khong theo so nhan vien vua bam len",
    };
  },
);

kiem(
  "Ho so KHONG co moc -> tra `undefined`, KHONG tra 0 (chieu nghich)",
  'Sếp · 16/09/2026 — ho so lap truoc 16/09 giu nguyen hanh vi cu',
  () => {
    /* 🔴🔴 CHIEU NGHICH QUAN TRONG NHAT. Ai "don cho gon" bang cach tra 0 khi khong co moc thi
       bai tren VAN XANH, nhung moi ho so cu lap truoc 16/09/2026 bong nhien cho ha tu do ve 1 —
       dung cai cua ma chi dao 13/09 dong lai. `undefined` la "CHUA BIET", khong phai "khong co". */
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const dn = { id: "x", items: [{ stt: 1, soBaoGiaYeuCau: 5 }], tepGiaiDoan: {} };
    const san = BG.sanSoBaoGiaTPGiao(dn);
    return {
      duoc: san === undefined,
      thucTe: `san = ${String(san)}`,
      mongDoi: "undefined (noi goi se khoa han nut giam, nhu truoc 16/09)",
    };
  },
);

kiem(
  "Phieu giao nhieu dot -> lay MOC LON NHAT, khong lay dot dau",
  "Sếp · 16/09/2026",
  () => {
    /* Mot phieu co the duoc giao lam nhieu dot, moi dot mot so. Ha xuong duoi so lon nhat la co it
       nhat mot dong bi lay thieu bao gia so voi dieu TP yeu cau.
       📌 Dong khong co moc (dot cu, truoc 16/09) bi BO QUA chu khong lam ca phieu mat san. */
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const dn = {
      id: "x",
      items: [
        { stt: 1, soBaoGiaTPGiao: 2 },
        { stt: 2, soBaoGiaTPGiao: 4 },
        { stt: 3 },
      ],
      tepGiaiDoan: {},
    };
    const san = BG.sanSoBaoGiaTPGiao(dn);
    return { duoc: san === 4, thucTe: `san = ${san}`, mongDoi: "4 (moc lon nhat)" };
  },
);

kiem(
  "Hồ sơ 0 tệp báo giá → PHẢI chặn trình xét duyệt (trước đây lọt)",
  "Ban lãnh đạo · 20/08/2026",
  () => {
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const dn = { id: "x", items: [{ stt: 1 }], tepGiaiDoan: {} };
    const r = BG.vuongMacTrinhXetDuyet(dn, { soBaoGiaToiThieu: 2 });
    return {
      duoc: typeof r === "string" && r.includes("báo giá"),
      thucTe: r === null ? "null (LỌT — lỗ hổng đã mở lại!)" : `"${String(r).slice(0, 80)}"`,
      mongDoi: "câu chặn nói còn thiếu bản báo giá",
    };
  },
);

kiem(
  "Cấu hình đặt 0 → KHÔNG chặn (quyết định có người bấm)",
  "Ban lãnh đạo · 24/08/2026 (chống chặn quá tay)",
  () => {
    /* Vẫn phải còn đường tắt luật: đặt `soBaoGiaToiThieu = 0` ở trang Cài đặt. Khác hẳn việc
       bỏ trống một ô tuỳ chọn lúc giao việc. */
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const dn = { id: "x", items: [{ stt: 1 }], tepGiaiDoan: {} };
    const r = BG.vuongMacTrinhXetDuyet(dn, { soBaoGiaToiThieu: 0 });
    return { duoc: r === null, thucTe: r === null ? "null" : `"${String(r).slice(0, 70)}"`, mongDoi: "null" };
  },
);

// ════════════════════════════════════════════════════════════════════
// CHỈ ĐỊNH THẲNG 1 NHÀ CUNG CẤP LÚC GIAO VIỆC — BẮT BUỘC GHI LÝ DO — 07/09/2026
// Ban lãnh đạo: nếu trưởng bộ phận CHỦ ĐỘNG đặt "Số báo giá yêu cầu" = 1 ngay lúc giao việc thì
// phải ghi lý do — khác hẳn việc nhân viên xin bỏ qua 1 ô báo giá còn thiếu (luật riêng ở trên).
// ════════════════════════════════════════════════════════════════════

kiem(
  "SL Báo giá = 1, KHÔNG ghi chú → phải chặn",
  "Ban lãnh đạo · 07/09/2026",
  () => {
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const r = BG.vuongMacChiDinhNCCLucGiaoViec(1, "");
    return {
      duoc: typeof r === "string" && r.includes("báo giá"),
      thucTe: r === null ? "null (LỌT)" : `"${String(r).slice(0, 80)}"`,
      mongDoi: "câu chặn nói rõ vì sao phải ghi lý do",
    };
  },
);

kiem(
  "SL Báo giá = 1, CÓ ghi chú → không chặn",
  "Ban lãnh đạo · 07/09/2026",
  () => {
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const r = BG.vuongMacChiDinhNCCLucGiaoViec(1, "Nhà cung cấp độc quyền cho vật tư này.");
    return { duoc: r === null, thucTe: r === null ? "null" : `"${String(r).slice(0, 70)}"`, mongDoi: "null" };
  },
);

kiem(
  "SL Báo giá = 2 hoặc để trống → KHÔNG đòi ghi chú (chỉ luật riêng của SL = 1)",
  "Ban lãnh đạo · 07/09/2026",
  () => {
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const r2 = BG.vuongMacChiDinhNCCLucGiaoViec(2, "");
    const rTrong = BG.vuongMacChiDinhNCCLucGiaoViec(undefined, "");
    return {
      duoc: r2 === null && rTrong === null,
      thucTe: `SL=2 → ${r2 === null ? "null" : `"${r2}"`}; để trống → ${rTrong === null ? "null" : `"${rTrong}"`}`,
      mongDoi: "cả hai đều null",
    };
  },
);

kiem(
  "HƯỚNG DẪN chọn số báo giá theo giá trị đơn hàng — đủ 4 dòng, nêu đúng 2 ngưỡng tiền",
  "Ban lãnh đạo · 07/09/2026 (vòng sau)",
  () => {
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const dong = BG.HUONG_DAN_SO_BAO_GIA_THEO_GIA_TRI;
    const gop = Array.isArray(dong) ? dong.join(" ") : "";
    const duoc =
      Array.isArray(dong) &&
      dong.length === 4 &&
      dong.every((d) => typeof d === "string" && d.trim() !== "") &&
      gop.includes("10") &&
      gop.includes("100 triệu");
    return {
      duoc,
      thucTe: Array.isArray(dong) ? `${dong.length} dòng: ${JSON.stringify(dong)}` : String(dong),
      mongDoi: "mảng 4 chuỗi không rỗng, nêu đủ ngưỡng 10tr và 100tr — hiện THƯỜNG TRỰC, không phụ thuộc SL chọn mấy báo giá",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// HAI LỖI VÁ NGÀY 25/08/2026 — Ban lãnh đạo: "sao ko còn kéo qua bước được"
// ════════════════════════════════════════════════════════════════════

kiem(
  "Kéo NHẢY CÓC sang cột Hoàn thành phải bị chặn",
  "lỗi hồi quy do tôi gây 24/08/2026",
  () => {
    /* 🔴 Hôm 24/08 tôi đặt nhánh `hoan_thanh` ở ĐẦU hàm, trước cả phép kiểm "chỉ kéo được sang
       bước liền kề". Đo được: kéo thẻ từ bước ① thẳng sang cột Hoàn thành thì app trả
       *"Hồ sơ đã đủ điều kiện hoàn thành"* — trong khi hồ sơ chưa có báo giá, chưa có đơn hàng,
       chưa nhận hàng. Vì `vuongMacSangBuocSau` hỏi điều kiện rời BƯỚC ĐANG ĐỨNG, không hỏi
       khoảng cách tới bước đích. */
    const the = { deNghi: deNghiThu(), giaiDoan: "tiep_nhan" };
    const r = G.quyetDinhKeoTha(the, "hoan_thanh", [], [], G.CAU_HINH_MAC_DINH ?? {}, null);
    return {
      /* 📌 So KHONG phan biet hoa thuong: chu trong cau chan doi ngay 26/08/2026 (bo ve "lui mot
         buoc" vi keo lui da tam tat), nhung DIEU BAT BIEN van la "cau chan phai nhac toi viec chi
         keo duoc sang buoc lien ke". Bai kiem soat dieu do, khong soat tung chu hoa. */
      duoc: r?.loai === "khong_the" && String(r.lyDo).toLowerCase().includes("liền kề"),
      thucTe: `${r?.loai ?? "?"}: "${String(r?.lyDo ?? r?.thongBao ?? "").slice(0, 70)}"`,
      mongDoi: 'khong_the kem cau nhac "bước liền kề"',
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: ⑦ → ⑧ vẫn phải đi được (đường đúng duy nhất)",
  "Ban lãnh đạo · 22/08/2026",
  () => {
    /* Vá nhảy cóc mà chặn luôn đường đúng thì hồ sơ không bao giờ hoàn thành được. */
    const dn = {
      id: "x",
      items: [{ stt: 1, nguoiPhuTrachUid: "u1" }],
      congViecDaXong: [{ maCongViec: "unc_xong" }],
      tepGiaiDoan: { ho_so_thanh_toan: [{ id: "t", tenTep: "hd.pdf", ghiChu: "Hóa đơn VAT" }] },
    };
    const r = G.quyetDinhKeoTha(
      { deNghi: dn, giaiDoan: "ho_so_thanh_toan" },
      "hoan_thanh",
      [],
      [],
      G.CAU_HINH_MAC_DINH ?? {},
      null,
    );
    return {
      duoc: r?.loai === "mo_trang",
      thucTe: `${r?.loai ?? "?"}: "${String(r?.thongBao ?? r?.lyDo ?? "").slice(0, 70)}"`,
      mongDoi: 'mo_trang (dẫn tới nút "Hoàn thành quy trình")',
    };
  },
);

kiem(
  "Việc bắt buộc còn treo của bước TRƯỚC phải có chỗ để tích (gỡ ngõ cụt)",
  "Ban lãnh đạo · 25/08/2026",
  () => {
    /* 🔴 ĐÂY LÀ LÝ DO THẬT Ban lãnh đạo không kéo được. Chốt chặn bảo "mở khối bước đó ở trang
       chi tiết, tích hoàn thành rồi làm tiếp" — nhưng khối đó chỉ bày việc của BƯỚC ĐANG ĐỨNG,
       nên việc của bước ① không còn ô nào để tích trong toàn app. App chỉ người dùng tới một
       chỗ không tồn tại. */
    const ch = cauHinhCoViecBatBuoc("tiep_nhan", "Checkin hàng tồn kho");
    const nhom = G.congViecConTreoCacBuocTruoc(deNghiThu(), "yeu_cau_bao_gia", ch);
    const coViec = nhom.some((n) => n.viec.some((v) => v.ten === "Checkin hàng tồn kho"));
    const coNhanBuoc = nhom.some((n) => typeof n.nhanBuoc === "string" && n.nhanBuoc.length > 0);
    return {
      duoc: coViec && coNhanBuoc,
      thucTe:
        nhom.length === 0
          ? "[] (KHÔNG CÓ CHỖ TÍCH — ngõ cụt đã mở lại!)"
          : JSON.stringify(nhom.map((n) => ({ buoc: n.buoc, nhan: n.nhanBuoc, so: n.viec.length }))),
      mongDoi: "có nhóm bước ① kèm tên bước và việc còn treo",
    };
  },
);

kiem(
  "Đứng ở bước ① thì KHÔNG có nhóm bước trước nào",
  "Ban lãnh đạo · 25/08/2026 (chống bày thừa)",
  () => {
    const ch = cauHinhCoViecBatBuoc("tiep_nhan", "Checkin hàng tồn kho");
    const nhom = G.congViecConTreoCacBuocTruoc(deNghiThu(), "tiep_nhan", ch);
    return {
      duoc: nhom.length === 0,
      thucTe: JSON.stringify(nhom.map((n) => n.buoc)),
      mongDoi: "[] (bước ① không có bước nào trước nó)",
    };
  },
);

kiem(
  "dsDieuKienConVuong phải trả ĐỦ các điều kiện cùng lúc, không phải một câu rồi thoát",
  "Ban lãnh đạo · 25/08/2026 (yêu cầu nhúng ô nhập nhanh vào hộp kéo thả)",
  () => {
    /* 🔴 ĐÂY LÀ LÝ DO CÓ HÀM DANH SÁCH.
       Mọi hàm luật trước nay trả MỘT câu rồi `return`. Nếu hộp kéo thả đọc câu đó để bày ô
       nhập, người dùng gỡ xong điều kiện thứ nhất thì hộp mới lòi ra điều kiện thứ hai —
       ba vòng bất ngờ liên tiếp. Bài kiểm này dựng một hồ sơ vướng ĐỒNG THỜI hai thứ:
         · còn công việc bắt buộc của bước chưa tích
         · chưa đủ bản báo giá
       và đòi danh sách phải nêu CẢ HAI. */
    const ch = cauHinhCoViecBatBuoc("yeu_cau_bao_gia", "Khảo sát giá thị trường");
    const bangDangThuThap = [{ id: "bg1", prId: "x", trangThai: "dang_thu_thap" }];
    const cauBaoGia = "Quy trình yêu cầu 3 bản báo giá, hiện còn thiếu 2 bản.";
    const ds = G.dsDieuKienConVuong(
      deNghiThu(),
      "yeu_cau_bao_gia",
      bangDangThuThap,
      ch,
      cauBaoGia,
    );
    const ma = ds.map((d) => d.ma);
    return {
      duoc: ma.includes("cong_viec_bat_buoc") && ma.includes("thieu_ban_bao_gia"),
      thucTe: `${ds.length} mục: ${JSON.stringify(ma)}`,
      mongDoi: 'đủ cả ["cong_viec_bat_buoc","thieu_ban_bao_gia"]',
    };
  },
);

kiem(
  "vuongMacSangBuocSau phải LẤY TỪ danh sách, không giữ bản luật riêng",
  "Ban lãnh đạo · 25/08/2026 (chống hai chỗ cùng trả lời một câu hỏi)",
  () => {
    /* Hàm một-câu và hàm danh sách phải là MỘT luật. Nếu ai đó chép lại điều kiện vào hàm
       một-câu, hai bên sẽ lệch nhau theo thời gian — kiểu lỗi đã phải sửa nhiều lần ở dự
       án này. Đo bằng cách đòi câu trả lời của hàm một-câu KHỚP mục đầu của danh sách. */
    const ch = cauHinhCoViecBatBuoc("yeu_cau_bao_gia", "Khảo sát giá thị trường");
    const bangDangThuThap = [{ id: "bg1", prId: "x", trangThai: "dang_thu_thap" }];
    const cauBaoGia = "Quy trình yêu cầu 3 bản báo giá, hiện còn thiếu 2 bản.";
    const doiSo = [deNghiThu(), "yeu_cau_bao_gia", bangDangThuThap, ch, cauBaoGia];
    const mot = G.vuongMacSangBuocSau(...doiSo);
    const ds = G.dsDieuKienConVuong(...doiSo);
    return {
      duoc: ds.length > 0 && mot === ds[0].cau,
      thucTe: `một-câu="${String(mot).slice(0, 60)}" · đầu-danh-sách="${String(ds[0]?.cau).slice(0, 60)}"`,
      mongDoi: "hai bên trùng khít (hàm một-câu chỉ lấy mục đầu của danh sách)",
    };
  },
);

kiem(
  "Hồ sơ đủ điều kiện thì danh sách phải RỖNG (kiểm chiều ngược)",
  "Ban lãnh đạo · 25/08/2026",
  () => {
    /* Chiều ngược bắt buộc: nếu ai sửa hàm thành trả về mảng cứng thì hai bài trên vẫn xanh
       mà app sẽ chặn cả hồ sơ hợp lệ. */
    const bangDangThuThap = [{ id: "bg1", prId: "x", trangThai: "dang_thu_thap" }];
    const ds = G.dsDieuKienConVuong(
      deNghiThu(),
      "yeu_cau_bao_gia",
      bangDangThuThap,
      G.CAU_HINH_MAC_DINH ?? {},
      null,
    );
    return {
      duoc: ds.length === 0,
      thucTe: `${ds.length} mục: ${JSON.stringify(ds.map((d) => d.ma))}`,
      mongDoi: "[] (không vướng gì thì không được bịa ra điều kiện)",
    };
  },
);

kiem(
  "Kéo ② → ③ thiếu báo giá phải MỞ HỘP KÈM Ô, không phải ngõ cụt",
  "Ban lãnh đạo · 25/08/2026 (*\"hiển thị các trường nhập nhanh\"*)",
  () => {
    /* 🔴 BÀI KIỂM CỦA CHÍNH CHỈ ĐẠO 25/08. Bài trên (`khongChoThenNhayCot`) chấp nhận CẢ
       `khong_the` lẫn `can_go_vuong` — nên nếu ai đó lặng lẽ quay về chặn bằng toast đỏ thì bài
       đó vẫn xanh. Bài này đòi ĐÚNG `can_go_vuong` cho ca Ban lãnh đạo nêu đích danh, để việc
       quay lui bị bắt ngay chứ không im lặng. */
    const cauThieu = "Quy trình yêu cầu 3 bản báo giá, hiện còn thiếu 2 bản.";
    const the = { deNghi: deNghiThu(), giaiDoan: "yeu_cau_bao_gia" };
    const r = G.quyetDinhKeoTha(
      the,
      "xet_duyet_bao_gia",
      [],
      bangDangThuThap,
      G.CAU_HINH_MAC_DINH ?? {},
      cauThieu,
    );
    return {
      duoc: r?.loai === "can_go_vuong" && r.dieuKien?.some((d) => d.ma === "thieu_ban_bao_gia"),
      thucTe: `${r?.loai ?? "?"} · ${JSON.stringify(r?.dieuKien?.map((d) => d.ma) ?? [])}`,
      mongDoi: 'loai = "can_go_vuong" có mục "thieu_ban_bao_gia" để hộp bày ô đính báo giá',
    };
  },
);

kiem(
  "can_go_vuong phải mang theo HÀNH ĐỘNG SAU — thẻ chỉ nhảy khi bấm duyệt",
  "Ban lãnh đạo · 25/08/2026 (*\"Phải được duyệt thì mới nhảy\"*)",
  () => {
    /* 🔴 Thiếu `hanhDongSau` thì người dùng đính đủ tệp, bấm nút, và KHÔNG CÓ GÌ XẢY RA — thẻ
       đứng yên, không lỗi nào báo. Đúng kiểu hỏng khó tìm nhất trong dự án này. */
    const cauThieu = "Quy trình yêu cầu 3 bản báo giá, hiện còn thiếu 2 bản.";
    const the = { deNghi: deNghiThu(), giaiDoan: "yeu_cau_bao_gia" };
    const r = G.quyetDinhKeoTha(
      the,
      "xet_duyet_bao_gia",
      [],
      bangDangThuThap,
      G.CAU_HINH_MAC_DINH ?? {},
      cauThieu,
    );
    const sau = r?.hanhDongSau;
    return {
      duoc: r?.loai === "can_go_vuong" && !!sau && sau.loai !== "khong_the",
      thucTe: `hanhDongSau = ${sau?.loai ?? "(khong co)"}`,
      mongDoi: "có hành động thật để chạy khi bấm duyệt (ở ca này là chot_so_sanh)",
    };
  },
);

kiem(
  "can_go_vuong KHÔNG được chứa điều kiện phải sang màn khác mới gỡ",
  "Ban lãnh đạo · 25/08/2026 (chống hộp gỡ hết vẫn kẹt)",
  () => {
    /* Bước ① vướng "chưa phân bổ người phụ trách" — việc đó cần cả bảng phân bổ, không nhồi vào
       hộp được (`goDuocTaiCho: false`). Nếu app mở hộp cho ca này thì người dùng đính hết mọi
       thứ trong hộp mà nút vẫn khoá, không hiểu vì sao. Phải chặn thẳng và chỉ đúng chỗ. */
    const dn = deNghiThu();
    dn.items = [{ id: "d1", ten: "Thép", donViTinh: "kg", khoiLuongDat: 10 }];
    const the = { deNghi: dn, giaiDoan: "tiep_nhan", soDongChuaPhanBo: 1 };
    const r = G.quyetDinhKeoTha(
      the,
      "yeu_cau_bao_gia",
      [],
      [],
      G.CAU_HINH_MAC_DINH ?? {},
      null,
    );
    const oK = r?.loai !== "can_go_vuong" || r.dieuKien.every((d) => d.goDuocTaiCho === true);
    return {
      duoc: oK,
      thucTe: `${r?.loai ?? "?"} · ${JSON.stringify(r?.dieuKien?.map((d) => `${d.ma}:${d.goDuocTaiCho}`) ?? [])}`,
      mongDoi: "không mở hộp khi còn mục goDuocTaiCho=false",
    };
  },
);

kiem(
  "Buoc ② CHUA co bang bao gia van phai bay O DINH KEM (ca Sep chup 25/08)",
  "Ban lãnh đạo · 25/08/2026 (*\"sao vẫn chưa sửa mục này\"*)",
  () => {
    /* 🔴 CA NÀY ĐÃ LỌT MỘT LẦN. Bản sửa sáng 25/08 chỉ chạy đúng khi hồ sơ ĐÃ có bảng báo giá;
       hồ sơ chưa có bảng thì `dsDieuKienConVuong` viết `else` nên **không thèm hỏi** có thiếu
       bản báo giá hay không, chỉ trả `chua_lap_bang_bao_gia` (goDuocTaiCho: false) → hộp mở ra
       TRỐNG TRƠN, chỉ có ô ghi chú và nút "Tạo bảng báo giá". Ban lãnh đạo chụp đúng màn đó. */
    const the = { deNghi: deNghiThu(), giaiDoan: "yeu_cau_bao_gia" };
    const cauThieu = "Quy trình yêu cầu 2 bản báo giá, hiện còn thiếu 2 bản.";
    const r = G.quyetDinhKeoTha(
      the,
      "xet_duyet_bao_gia",
      [],
      [] /* KHONG co bang bao gia nao — day la diem khac biet */,
      G.CAU_HINH_MAC_DINH ?? {},
      cauThieu,
    );
    return {
      duoc: r?.loai === "can_go_vuong" && r.dieuKien?.some((d) => d.ma === "thieu_ban_bao_gia"),
      thucTe: `${r?.loai ?? "?"} · ${JSON.stringify(r?.dieuKien?.map((d) => d.ma) ?? [])}`,
      mongDoi: 'can_go_vuong co "thieu_ban_bao_gia" (khong duoc chi tra chua_lap_bang_bao_gia)',
    };
  },
);

kiem(
  "Tao bang bao gia tu buoc ② phai CHOT LUON de the sang cot ③",
  "Ban lãnh đạo · 25/08/2026 (chong 'bam ma khong thay gi')",
  () => {
    /* Bang moi tao mang trang thai `dang_thu_thap`, ma `xacDinhGiaiDoan` suy trang thai do ve
       COT ②. Thieu co `chotLuon` thi nguoi dung dinh du tep, bam nut, the dung nguyen cho cu. */
    const the = { deNghi: deNghiThu(), giaiDoan: "yeu_cau_bao_gia" };
    const r = G.quyetDinhKeoTha(the, "xet_duyet_bao_gia", [], [], G.CAU_HINH_MAC_DINH ?? {}, null);
    return {
      duoc: r?.loai === "tao_bao_gia" && r.chotLuon === true,
      thucTe: `${r?.loai ?? "?"} · chotLuon = ${String(r?.chotLuon)}`,
      mongDoi: "tao_bao_gia kem chotLuon = true",
    };
  },
);

kiem(
  "Keo ① → ② KHONG duoc chot luon (chong day the vuot mot buoc)",
  "Ban lãnh đạo · 25/08/2026 (chieu nguoc cua bai tren)",
  () => {
    /* Buoc ① cung tra `tao_bao_gia`, nhung o do dich den DUNG LA cot ②. Chot luon la day the
       sang ③ — vuot mot buoc khong ai yeu cau. Bai kiem nay giu cho ban sua khong di qua tay. */
    const the = { deNghi: deNghiThu(), giaiDoan: "tiep_nhan" };
    const r = G.quyetDinhKeoTha(the, "yeu_cau_bao_gia", [], [], G.CAU_HINH_MAC_DINH ?? {}, null);
    return {
      duoc: r?.loai !== "tao_bao_gia" || !r.chotLuon,
      thucTe: `${r?.loai ?? "?"} · chotLuon = ${String(r?.chotLuon)}`,
      mongDoi: "khong co chotLuon khi keo tu buoc ①",
    };
  },
);

kiem(
  "CHUA CO HOP DONG thi KHONG lap duoc don mua hang",
  "Ban lãnh đạo · 26/08/2026 (*\"Phải có hợp đồng hoặc thoả thuận mua bán thì mới tiến hành lập PO được\"*)",
  () => {
    /* 🔴 Chot THAT nam o tang ghi (`themDonHang` goi `vuongMacLapDonHang`). Nut mo tren giao dien
       chi la loi nhac. Bai kiem nay goi thang ham luat. */
    const bangDaChonNCC = [{ id: "bg1", prId: "x", trangThai: "da_chon_ncc" }];
    const dn = deNghiThu();           // khong co tep hop dong, khong co ly do
    const r = G.vuongMacLapDonHang(bangDaChonNCC, dn);
    return {
      duoc: typeof r === "string" && /[Hh]ợp đồng/.test(r),
      thucTe: r === null ? "null (LOT — lap duoc don khi chua co hop dong!)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "tra cau chan co nhac Hop dong",
    };
  },
);

kiem(
  "CO LY DO chua co hop dong thi VAN lap duoc don (loi thoat cho mau PO-02)",
  "Ban lãnh đạo · 23/08/2026, giu nguyen khi doi buoc 26/08",
  () => {
    /* 🔴 CHIEU NGUOC BAT BUOC. Mau PO-02 'Don mua hang kem thoa thuan' thi chinh to don LA thoa
       thuan, khong co hop dong rieng de dinh. Bo duong 'ghi ly do' la khoa cung moi don dung mau
       do — chan qua tay con te hon khong chan. */
    const bangDaChonNCC = [{ id: "bg1", prId: "x", trangThai: "da_chon_ncc" }];
    const dn = deNghiThu();
    /* 📌 Ly do luu o `lyDoThieuChungTu`, KHONG phai `truongBoSung` — khoa la
       KHOA_LY_DO_THIEU_HOP_DONG = "lap_don_mua_hang|hop_dong" (chuoi nay CO Y giu nguyen qua ca
       hai lan doi buoc, de ly do da ghi truoc do khong mat). */
    dn.lyDoThieuChungTu = { "lap_don_mua_hang|hop_dong": "Dung mau PO-02" };
    const r = G.vuongMacLapDonHang(bangDaChonNCC, dn);
    return {
      duoc: r === null,
      thucTe: r === null ? "null (di duoc — dung)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "null — co ly do thi lap duoc don",
    };
  },
);

kiem(
  "Che do lap don MAU (khong co de nghi) KHONG bi chan boi dieu kien hop dong",
  "Ban lãnh đạo · 18/08/2026 + 26/08/2026",
  () => {
    /* Che do mau khong cat don nen khong co gi de chan; bat buoc tham so `deNghi` la che do do
       het dung duoc. */
    const bangDaChonNCC = [{ id: "bg1", prId: "x", trangThai: "da_chon_ncc" }];
    const r = G.vuongMacLapDonHang(bangDaChonNCC, undefined);
    return {
      duoc: r === null,
      thucTe: String(r),
      mongDoi: "null — khong co de nghi thi khong xet hop dong",
    };
  },
);

kiem(
  "TAM NGUNG 08/09/2026: du KHONG co quyen taoPoDoiLap van bi chan (nhu truoc)",
  "08/09/2026 — Ban lãnh đạo: bat buoc phai co de nghi moi tao duoc PO",
  () => {
    const r = G.vuongMacLapDocLap(false, "Ly do that su hop le");
    return {
      duoc: typeof r === "string" && r.length > 0,
      thucTe: r === null ? "null (LOT — lap duoc PO doc lap du dang tam ngung!)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "tra cau chan (bat ky noi dung gi, chi can khong phai null)",
    };
  },
);

kiem(
  "TAM NGUNG 08/09/2026: DU CO quyen taoPoDoiLap VA CO ly do hop le, VAN bi chan tuyet doi",
  "08/09/2026 — day la phep kiem QUAN TRONG NHAT: bao ve khong cho ai vo tinh mo lai duong nay",
  () => {
    const r = G.vuongMacLapDocLap(true, "NCC yeu cau dat coc giu hang gap");
    return {
      duoc: typeof r === "string" && r.length > 0,
      thucTe: r === null ? "null (LOT NGHIEM TRONG — PO doc lap lai lap duoc du dang tam ngung!)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "tra cau chan — KHONG duoc la null dù du quyen + du ly do",
    };
  },
);

kiem(
  "Dieu kien HOP DONG phai gan vao buoc ④ Lap don mua hang, KHONG phai buoc ⑤",
  "Ban lãnh đạo · 26/08/2026 (*\"kéo bước đính kèm hợp đồng về bước này\"*)",
  () => {
    /* 🔴 Doi hang so BUOC_DINH_KEM_HOP_DONG thoi la CHUA DU. O dinh kem nam o ④ ma dieu kien
       chuyen buoc con treo o ⑤ thi: keo the ④→⑤ di lot du chua co hop dong, roi toi ⑤ moi bi chan
       — ma o de go lai nam nguoc ve ④. */
    const dn = deNghiThu();
    const ds4 = G.dsDieuKienConVuong(dn, "lap_don_mua_hang", [], G.CAU_HINH_MAC_DINH ?? {}, null);
    const ds5 = G.dsDieuKienConVuong(dn, "dat_hang", [], G.CAU_HINH_MAC_DINH ?? {}, null);
    const o4 = ds4.some((d) => d.ma === "thieu_hop_dong");
    const o5 = ds5.some((d) => d.ma === "thieu_hop_dong");
    return {
      duoc: o4 && !o5,
      thucTe: `buoc ④ co dieu kien hop dong: ${o4} · buoc ⑤: ${o5}`,
      mongDoi: "④ = true, ⑤ = false",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// QUAY LAI BUOC TRUOC DE SUA — BANG SEP DUYET 15/09/2026
//
// Sep 14/09/2026: *"quy trinh nay chi duoc 1 buoc tien con neu muon quay lai sua thi gan nhu
// la ko duoc, e thiet ke xem quy trinh quay lai buoc truoc de sua that logic va khoa hoc cho a"*.
// Ban thiet ke duoc Sep DUYET ngay 15/09/2026.
//
// 🔴 BAI KIEM CU O DAY DA BI THAY THE, VA PHAI NOI RO DE KHONG AI TUONG LA "SUA BAI KIEM CHO
//    VUA MA NGUON". Bai cu ten *"KEO LUI dang TAM TAT — phai chan, va noi duong go khac"*, ghi
//    lai chi dao Ban lanh dao 26/08/2026 (*"e TAM dong goi chuc nang keo lui buoc trong bang
//    kanban, tinh nang nay se xu ly sau"*). Chu **"tam"** va **"xu ly sau"** trong chinh cau do
//    da noi truoc se bat lai; hom nay Sep duyet bang lui buoc nen chi dao 26/08 HET HIEU LUC.
//    Day la DOI YEU CAU (co nguoi quyet, co ngay), khong phai noi luat cho vua ma nguon.
//
// ⚠️ MOI CAP DEU CO HAI CHIEU: mot bai "cho lui khi du dieu kien" + it nhat mot bai "CHAN khi
//    thieu". Thieu chieu nao thi mot dot bien tam thuong (`return khong_the` vo dieu kien, hoac
//    `return lui_buoc` vo dieu kien) van di lot qua het bo kiem.
// ════════════════════════════════════════════════════════════════════

/** Quyen cua truong bo phan cap 3 tro len / quan tri — du ca hai co ma bang duyet doi. */
const quyenTruongBP = { phanBoCongViec: true, xacNhanTruongBP: true };
/** Nhan vien thu mua: lap duoc PO nhung KHONG duoc lui buoc. */
const quyenNhanVien = { phanBoCongViec: false, xacNhanTruongBP: false };

const theDangO = (giaiDoan) => ({ deNghi: deNghiThu(), giaiDoan });

/** Goi `quyetDinhKeoTha` cho mot cu keo LUI mot buoc. */
const keoLui = (tu, ve, po = [], bg = [], quyen = quyenTruongBP) =>
  G.quyetDinhKeoTha(theDangO(tu), ve, po, bg, G.CAU_HINH_MAC_DINH ?? {}, null, quyen);

const poThu = (them) => ({ id: "po-1", code: "PO-001", prId: "pr-thu", trangThai: "da_chot", items: [], ...them });
const bgThu = (them) => ({ id: "bg-1", prId: "pr-thu", trangThai: "dang_thu_thap", items: [{ baoGiaNCC: [] }], ...them });

// ---------- ② → ① Tiep nhan (chu: phanBoCongViec) ----------

kiem(
  "② → ① CHO LUI khi chua co PO va bang bao gia chua co gia NCC nao",
  "Sep · 15/09/2026 — thay the chi dao 26/08/2026 (*\"TAM dong goi chuc nang keo lui buoc\"*)",
  () => {
    const r = keoLui("yeu_cau_bao_gia", "tiep_nhan", [], [bgThu()]);
    const viec = String(r?.viec ?? "");
    return {
      duoc: r?.loai === "lui_buoc" && r.ve === "tiep_nhan" && r.batBuocLyDo === true && viec.length > 40,
      thucTe: `${r?.loai ?? "?"} ve=${r?.ve ?? "-"} batBuocLyDo=${String(r?.batBuocLyDo)} viec="${viec.slice(0, 60)}"`,
      mongDoi: 'lui_buoc ve "tiep_nhan", batBuocLyDo=true, co cau ta viec se lam',
    };
  },
);

kiem(
  "② → ① cau `viec` PHAI noi truoc se mat gi (xoa phan bo · huy bang bao gia · danh so lai)",
  "Sep · 15/09/2026 — giao dien in THANG cau nay vao hop xac nhan, khong viet lai lan hai",
  () => {
    /* 🔴 Khong phai van ve. Nguoi dung bam mot nut XOA DU LIEU; cau nay la thu duy nhat noi cho
       ho biet minh dang xoa gi. Doi chieu than `luiVeBuoc` (3-du-lieu/kho-du-lieu.tsx ~2960-3082):
       gop ban tach roi XOA, danh lai `stt` tu 1, xoa 6 truong phan bo, huy bang bao gia. */
    const r = keoLui("yeu_cau_bao_gia", "tiep_nhan", [], [bgThu()]);
    const v = String(r?.viec ?? "");
    const du = /phân bổ/i.test(v) && /hủy/i.test(v) && /báo giá/i.test(v) && /(thứ tự|từ 1)/i.test(v);
    return {
      duoc: du,
      thucTe: `"${v.slice(0, 120)}"`,
      mongDoi: 'cau nhac du: phan bo · huy bang bao gia · danh so thu tu lai',
    };
  },
);

kiem(
  "② → ① CHAN khi bang bao gia DA CO gia cua nha cung cap",
  "Sep · 15/09/2026 (giu nguyen luat 13/08/2026) — lui la mat sach so lieu da nhap",
  () => {
    const bg = bgThu({ items: [{ baoGiaNCC: [{ nccId: "ncc-1", donGia: 1000 }] }] });
    const r = keoLui("yeu_cau_bao_gia", "tiep_nhan", [], [bg]);
    return {
      duoc: r?.loai === "khong_the" && /giá của nhà cung cấp/i.test(String(r.lyDo)),
      thucTe: `${r?.loai ?? "?"}: "${String(r?.lyDo ?? r?.viec ?? "").slice(0, 80)}"`,
      mongDoi: "khong_the, cau noi ro bang da co gia NCC",
    };
  },
);

kiem(
  "② → ① CHAN khi de nghi da phat sinh don mua hang",
  "Sep · 15/09/2026 — dieu kien MOI cua bang duyet (*\"Chua co PO nao\"*)",
  () => {
    /* Lui ve ① co the GOP roi XOA ban tach — phieu bi xoa ma don con tro vao la don mo coi. */
    const r = keoLui("yeu_cau_bao_gia", "tiep_nhan", [poThu({ trangThai: "nhap" })], [bgThu()]);
    return {
      duoc: r?.loai === "khong_the" && /đơn mua hàng/i.test(String(r.lyDo)),
      thucTe: `${r?.loai ?? "?"}: "${String(r?.lyDo ?? r?.viec ?? "").slice(0, 80)}"`,
      mongDoi: "khong_the, cau noi ro da co don mua hang",
    };
  },
);

kiem(
  "② → ① CHAN nhan vien thu mua (chi `phanBoCongViec` moi lui duoc)",
  "Sep · 15/09/2026 — cot \"Ai duoc lui\" cua bang duyet",
  () => {
    const r = keoLui("yeu_cau_bao_gia", "tiep_nhan", [], [bgThu()], quyenNhanVien);
    return {
      duoc: r?.loai === "khong_the" && /Phân bổ công việc/i.test(String(r.lyDo)),
      thucTe: `${r?.loai ?? "?"}: "${String(r?.lyDo ?? r?.viec ?? "").slice(0, 80)}"`,
      mongDoi: 'khong_the, cau goi dung ten quyen "Phan bo cong viec"',
    };
  },
);

// ---------- ③ → ② Yeu cau bao gia (chu: xacNhanTruongBP) ----------

kiem(
  "③ → ② CHO LUI khi co bang da trinh xet duyet — va KHONG mat gia da nhap",
  "Sep · 15/09/2026 (giu nguyen duong \"Khong duyet\" dang chay)",
  () => {
    const r = keoLui("xet_duyet_bao_gia", "yeu_cau_bao_gia", [], [bgThu({ trangThai: "da_so_sanh" })]);
    const v = String(r?.viec ?? "");
    return {
      duoc: r?.loai === "lui_buoc" && r.ve === "yeu_cau_bao_gia" && r.batBuocLyDo === true && /giữ nguyên/i.test(v),
      thucTe: `${r?.loai ?? "?"} ve=${r?.ve ?? "-"} viec="${v.slice(0, 70)}"`,
      mongDoi: 'lui_buoc ve "yeu_cau_bao_gia", cau noi ro gia giu nguyen',
    };
  },
);

/* ════════════════════════════════════════════════════════════════════
   ★★ CHUYEN BUOC ⑤ → ⑥ — Sếp 16/09/2026, nguyen van tren anh chup buoc ⑤:
   *"Dieu kien de chuyen buoc 5 sang 6: Phai dinh kem file PO ky dong moc hoac phai bam tich chon
   'Bo sung sau'"*, kem mot cau truoc do: *"khi chon nay roi thi chuyen buoc nay sang buoc tiep theo"*.

   🔴 VI SAO DOI: truoc do buoc ⑥ CHI mo khi **da co phieu nhan hang** — mot viec cua KHO. Nguoi thu
   mua dat hang xong, dinh ban PO nha cung cap ky, phan viec cua ho da het, ma the van nam o ⑤ doi
   dong do *"Con 1/1 dong chua nhan du hang"*. Tuc phai CHO NGUOI KHAC lam thi buoc cua minh moi xong.
   ════════════════════════════════════════════════════════════════════ */

/** Đề nghị + PO đã chốt, chưa giao lần nào — đúng ca Sếp chụp (DMH260002). */
const boBuoc5 = (tepGiaiDoan = {}, lyDoThieuChungTu = undefined) => ({
  dn: {
    id: "d5",
    code: "PR-5",
    trangThai: "dang_xu_ly",
    maHopDongCDT: "HD-01",
    items: [{ stt: 1, tenVatLieu: "Da", donViTinh: "m3", khoiLuong: 400 }],
    tepGiaiDoan,
    ...(lyDoThieuChungTu ? { lyDoThieuChungTu } : {}),
  },
  po: {
    id: "po5",
    prId: "d5",
    code: "DMH260002",
    trangThai: "da_chot",
    maDuAn: "X",
    ngayGiaoDuKien: "2026-09-20",
    items: [{ sttDong: 1, sttDongDeNghi: 1, tenVatLieu: "Da", donViTinh: "m3", khoiLuongDat: 400 }],
  },
});

kiem(
  "⑤ → ⑥ CHUA co ban PO ky lan chua bam 'Bo sung sau' -> the NAM LAI buoc ⑤ (chieu nghich)",
  'Sếp · 16/09/2026 — *"Phai dinh kem file PO ky dong moc hoac phai bam tich chon \'Bo sung sau\'"*',
  () => {
    /* 🔴 CHIEU NGHICH, VA NO QUAN TRONG HON CHIEU THUAN: ai sua `vuongMacRoiBuocDatHang` thanh
       `return null` vo dieu kien thi bai "cho di tiep" ben duoi VAN XANH, chi bai nay bat duoc —
       va luc do buoc ⑤ khong con doi chung tu gi, the tu chay sang ⑥ tren moi ho so. */
    const b = boBuoc5();
    const gd = G.xacDinhGiaiDoan(b.dn, [b.po], [], []);
    return {
      duoc: gd === "dat_hang",
      thucTe: `xacDinhGiaiDoan = "${gd}"`,
      mongDoi: '"dat_hang" — chua lam gi o buoc ⑤ thi khong duoc sang ⑥',
    };
  },
);

kiem(
  "⑤ → ⑥ DA DINH ban PO ky -> the sang buoc ⑥ du CHUA co phieu nhan nao",
  'Sếp · 16/09/2026 — *"khi chon nay roi thi chuyen buoc nay sang buoc tiep theo"*',
  () => {
    const b = boBuoc5({
      don_mua_hang_ncc_ky: [{ id: "t1", ten: "PO-ky.pdf", ghiChu: "Đơn mua hàng" }],
    });
    const gd = G.xacDinhGiaiDoan(b.dn, [b.po], [], []);
    return {
      duoc: gd === "nhan_hang",
      thucTe: `xacDinhGiaiDoan = "${gd}"`,
      mongDoi: '"nhan_hang" — KHONG con doi phieu nhan cua Kho moi roi duoc buoc ⑤',
    };
  },
);

kiem(
  "⑤ → ⑥ BAM 'Bo sung sau' cung du de sang buoc ⑥",
  'Sếp · 16/09/2026 — *"hoac phai bam tich chon \'Bo sung sau\'"*',
  () => {
    /* ⚠️ "Bo sung sau" KHONG xoa mon no: muc 4 cua bo ho so thanh toan VAN bao do cho toi khi co
       tep that (`CHUNG_TU_DON_MUA_HANG.lyDoKhongCo = null`). No chuyen theo chung tu, khong bien mat. */
    const b = boBuoc5({}, { "dat_hang|don_mua_hang": "Bổ sung sau" });
    const gd = G.xacDinhGiaiDoan(b.dn, [b.po], [], []);
    return {
      duoc: gd === "nhan_hang",
      thucTe: `xacDinhGiaiDoan = "${gd}"`,
      mongDoi: '"nhan_hang"',
    };
  },
);

kiem(
  "⑤ → ⑥ PO con NHAP thi khong sang ⑥ du da bam 'Bo sung sau' (chieu nghich)",
  "Sếp · 16/09/2026 — dat hang xong moi sang cho nhan hang",
  () => {
    /* Don con nhap = chua gui nha cung cap, chua the goi la da dat hang. Thieu chot nay thi mot ho
       so chi moi soan don nhap da nhay sang buoc cho nhan hang. */
    const b = boBuoc5({}, { "dat_hang|don_mua_hang": "Bổ sung sau" });
    const gd = G.xacDinhGiaiDoan(b.dn, [{ ...b.po, trangThai: "nhap" }], [], []);
    return {
      duoc: gd !== "nhan_hang",
      thucTe: `xacDinhGiaiDoan = "${gd}"`,
      mongDoi: 'KHAC "nhan_hang"',
    };
  },
);

kiem(
  "Buoc ⑤ phai co trong DANH SACH DIEU KIEN — neu khong, hop xac nhan va the noi nguoc nhau",
  "Sếp · 16/09/2026",
  () => {
    /* 🔴 BAI NAY CANH MOT KIEU HONG IM LANG DA SAP THAT NGAY 23/08/2026 (voi hop dong): luat noi o
       mot ham, con `dsDieuKienConVuong` giu dieu kien cu => hop xac nhan bao "khong con dieu kien
       nao" trong khi the van nam lai cot cu, va KHONG MOT DONG LOI NAO BAO. */
    const b = boBuoc5();
    const ds = G.dsDieuKienConVuong(b.dn, "dat_hang", [], G.CAU_HINH_MAC_DINH ?? {}, null);
    const co = ds.some((x) => x.ma === "thieu_don_mua_hang");
    /* Da bam "Bo sung sau" thi dieu kien phai BIEN MAT — khong thi nguoi dung lam xong roi ma hop
       xac nhan van chan. */
    const b2 = boBuoc5({}, { "dat_hang|don_mua_hang": "Bổ sung sau" });
    const ds2 = G.dsDieuKienConVuong(b2.dn, "dat_hang", [], G.CAU_HINH_MAC_DINH ?? {}, null);
    const het = !ds2.some((x) => x.ma === "thieu_don_mua_hang");
    return {
      duoc: co && het,
      thucTe: `chua lam gi: ${co ? "CO dieu kien" : "THIEU dieu kien"} · da bam Bo sung sau: ${het ? "da het" : "VAN CON"}`,
      mongDoi: "chua lam gi -> co dieu kien `thieu_don_mua_hang`; bam 'Bo sung sau' -> het",
    };
  },
);

kiem(
  "Nut XOA TOAN BO DU LIEU chi mo cho QUAN TRI — moi vai tro khac deu KHONG co",
  'Sếp · 16/09/2026 — *"chuc nang nay chi hien o tai khoan cap quan tri"*',
  () => {
    /* 🔴 CHIEU NGHICH NAM NGAY TRONG BAI NAY, va no moi la phan quan trong: khong chi kiem
       "admin co", ma kiem CA 5 vai tro khac deu KHONG co — ke ca Ban Giam doc (`director`) va
       Truong bo phan cap 4 (nguoi dang co `suaPODaChot`, tuc VAO DUOC trang Cai dat quy trinh
       noi nut nay dat). Chi kiem chieu thuan thi ai sua thanh `true` vo dieu kien van di lot,
       va luc do nut xoa sach du lieu ca phong mo cho tat ca.

       ⚠️ Nut nay xoa MOI de nghi, bao gia, don hang, phieu nhan khoi kho chung va KHONG khoi
       phuc duoc — nen no la co DUY NHAT trong bang quyen chi mo cho quan tri. */
    const ai = (them) =>
      PQ.tinhQuyen({
        uid: "u-thu",
        tenHienThi: "Nguoi thu",
        chucDanh: "",
        vaiTro: "staff",
        chucNang: "nhan_vien_thu_mua",
        capTM: 2,
        ...them,
      });

    const quanTri = ai({ vaiTro: "admin", capTM: 4 });
    const khac = [
      ["Ban Giam doc", ai({ vaiTro: "director", capTM: 4 })],
      ["Truong bo phan cap 4", ai({ chucNang: "truong_bo_phan_thu_mua", capTM: 4 })],
      ["Truong bo phan cap 3", ai({ chucNang: "truong_bo_phan_thu_mua", capTM: 3 })],
      ["Nhan vien thu mua", ai({ capTM: 2 })],
      ["Thu kho", ai({ chucNang: "thu_kho_cong_trinh", capTM: 1, capKho: 2 })],
    ];
    const loGio = khac.filter(([, q]) => q.xoaToanBoDuLieu).map(([t]) => t);

    return {
      duoc: quanTri.xoaToanBoDuLieu === true && loGio.length === 0,
      thucTe:
        `admin=${quanTri.xoaToanBoDuLieu}` +
        (loGio.length ? ` · LO CHO: ${loGio.join(", ")}` : " · 5 vai tro khac deu false"),
      mongDoi: "admin=true, moi vai tro khac=false (ke ca director va truong bo phan cap 4)",
    };
  },
);

kiem(
  "CAU HIEN THI TUYET DOI KHONG duoc nhac \"Sep\" / \"Ban lanh dao\" / ngay chi dao",
  'Sếp · 16/09/2026 — *"day la app cho bo phan thu mua, sao lai de cac ghi chu lien quan toi sep ??"*',
  () => {
    /* 🔴 SEP CHUP DUNG POP-UP TREN BANG QUY TRINH: cau tu choi lui buoc in ra chu *"(Sep chot
       15/09/2026)"* ngay giua man hinh nguoi dung. Xuat xu cua luat la viec cua CHU THICH va
       nhat ky — nguoi thu mua can biet PHAI LAM GI, khong can biet ai duyet luat ngay nao.

       ⚠️ BAI KIEM NAY CHI CANH MAY HAM TRA CAU CHAN cua `giai-doan-mua-hang.ts`. No KHONG quet
       duoc toan bo app (hang tram chuoi nam rai trong JSX) — dung tuong xanh o day la sach het.
       Quet day du lam bang tay 16/09/2026 (bo chu thich roi doc tung chuoi literal): sua 12 cho.
       Hai chuoi CO Y GIU: `NHAN_BAN_LANH_DAO` va cau quy trinh cua Ban Tong Giam doc — do la
       CHUC DANH that trong van ban cong ty, khong phai ghi chu noi bo. */
    /* 📌 GỌI QUA ĐƯỜNG THẬT (`quyetDinhKeoTha`), KHÔNG export thêm `lyDoKhongLuiDuoc` chỉ để
       chiều bài kiểm — mở rộng bề mặt công khai của một tệp luật cho việc kiểm là đổi mã nguồn
       theo bài kiểm, đúng chiều ngược với thứ bộ kiểm này sinh ra để chặn. */
    const XAU = /(Sếp|Ban lãnh đạo|BLĐ|\d{1,2}\/\d{1,2}\/20\d{2})/;
    const cau = [
      keoLui("nhan_hang", "dat_hang")?.lyDo,
      keoLui("ho_so_thanh_toan", "nhan_hang")?.lyDo,
      keoLui("hoan_thanh", "ho_so_thanh_toan")?.lyDo,
      keoLui("that_bai", "nhan_hang")?.lyDo,
      /* Ca THIẾU QUYỀN — câu này cũng từng mang chữ "(Sếp chốt 15/09/2026)". */
      keoLui("xet_duyet_bao_gia", "yeu_cau_bao_gia", [], [bgThu({ trangThai: "da_so_sanh" })], quyenNhanVien)
        ?.lyDo,
    ].filter(Boolean);
    const ban = cau.filter((c) => XAU.test(String(c)));
    return {
      duoc: cau.length >= 5 && ban.length === 0,
      thucTe:
        ban.length === 0
          ? `${cau.length} cau — khong cau nao nhac nguoi duyet hay ngay chi dao`
          : ban.map((c) => `"${String(c).slice(0, 90)}"`).join(" | "),
      mongDoi: "moi cau chan deu KHONG chua \"Sep\" / \"Ban lanh dao\" / ngay dd/mm/yyyy",
    };
  },
);

kiem(
  "③ → ② cau `viec` PHAI noi truoc la SE XOA SACH tep cua buoc bao gia",
  "Sep · 16/09/2026 — *\"Sao bam lui ve ma van con cac file dinh kem, cac file nay phai duoc xoa sach\"*",
  () => {
    /* 🔴 VI SAO CAN BAI NAY: hom 16/09 nhanh `luiVeBuoc` (`ve === "yeu_cau_bao_gia"`) doi tu
       KHONG XOA GI thanh XOA SACH `tepGiaiDoan["yeu_cau_bao_gia"]`. Cau `viec` nay la thu DUY
       NHAT noi cho nguoi bam biet ho sap xoa chung tu — giao dien in THANG no vao hop xac nhan.
       Doi tang ghi ma quen cau nay thi ban va tu de ra mot loi NANG HON loi no chua: nguoi dung
       dong y dua tren mot cau hua sai. */
    const r = keoLui("xet_duyet_bao_gia", "yeu_cau_bao_gia", [], [bgThu({ trangThai: "da_so_sanh" })]);
    const v = String(r?.viec ?? "");
    return {
      duoc: /xo[áa]/i.test(v) && /t[ệe]p/i.test(v),
      thucTe: `"${v.slice(0, 140)}"`,
      mongDoi: "cau viec nhac ro se XOA TEP dinh kem cua buoc bao gia",
    };
  },
);

kiem(
  "③ → ② cau `viec` TUYET DOI KHONG duoc hua \"KHONG mat du lieu nao\" (chieu nghich)",
  "Sep · 16/09/2026 — thay the cau cu cua ban 15/09/2026",
  () => {
    /* ⚠️ DAY LA CHIEU NGHICH cua bai ngay tren, va no bat mot ca that: cau `viec` ban 15/09 mo
       dau bang dung chu *"KHONG mat du lieu nao"*. Chi kiem "co chu XOA" thi mot cau vua hua
       khong mat gi vua noi se xoa tep van di lot — mau thuan ngay trong mot cau, nguoi doc tin
       ve dau cung duoc. Ai hoan tac tang ghi ve nep cu thi PHAI sua ca cau nay, va bai kiem se
       chi thang vao day. */
    const r = keoLui("xet_duyet_bao_gia", "yeu_cau_bao_gia", [], [bgThu({ trangThai: "da_so_sanh" })]);
    const v = String(r?.viec ?? "");
    return {
      duoc: !/KH[ÔO]NG m[ấa]t d[ữu] li[ệe]u n[àa]o/i.test(v),
      thucTe: `"${v.slice(0, 140)}"`,
      mongDoi: "cau viec KHONG con ve hua \"KHONG mat du lieu nao\"",
    };
  },
);

kiem(
  "③ → ② CHAN khi CHUA co bang nao duoc trinh (chong \"bao thanh cong gia\")",
  "Sep · 15/09/2026 — cung lo hong `luiVeBuoc` da va 11/09/2026 cho nhanh co `traLai`",
  () => {
    /* Duong keo tha KHONG truyen `traLai` nen chot 11/09 trong `luiVeBuoc` khong bat duoc ca nay:
       khong bang nao doi, nhung nhat ky van ghi mot dong cho viec chua tung xay ra. */
    const r = keoLui("xet_duyet_bao_gia", "yeu_cau_bao_gia", [], [bgThu({ trangThai: "dang_thu_thap" })]);
    return {
      duoc: r?.loai === "khong_the" && /trình xét duyệt/i.test(String(r.lyDo)),
      thucTe: `${r?.loai ?? "?"}: "${String(r?.lyDo ?? r?.viec ?? "").slice(0, 80)}"`,
      mongDoi: "khong_the, cau noi ro chua co bang nao duoc trinh",
    };
  },
);

kiem(
  "③ → ② CHAN nguoi khong co quyen `xacNhanTruongBP`",
  "Sep · 15/09/2026 — cot \"Ai duoc lui\" cua bang duyet",
  () => {
    const r = keoLui(
      "xet_duyet_bao_gia",
      "yeu_cau_bao_gia",
      [],
      [bgThu({ trangThai: "da_so_sanh" })],
      quyenNhanVien,
    );
    return {
      duoc: r?.loai === "khong_the" && /Xác nhận hoàn thành đơn/i.test(String(r.lyDo)),
      thucTe: `${r?.loai ?? "?"}: "${String(r?.lyDo ?? r?.viec ?? "").slice(0, 80)}"`,
      mongDoi: 'khong_the, cau goi dung ten quyen "Xac nhan hoan thanh don"',
    };
  },
);

// ---------- ④ → ③ Xet duyet bao gia (chu: xacNhanTruongBP) ----------

kiem(
  "④ → ③ CHO LUI khi KHONG con don nao — va bao truoc se mat TEP DAN CHUNG",
  "Sep · 15/09/2026",
  () => {
    /* `luiVeBuoc` nhanh `ve === "xet_duyet_bao_gia"` xoa du 6 truong, trong do co `tepChonNCC`
       — tep dan chung KHONG khoi phuc duoc. Cau `viec` phai noi truoc dung chuyen do. */
    const r = keoLui("lap_don_mua_hang", "xet_duyet_bao_gia", [], [bgThu({ trangThai: "da_chon_ncc" })]);
    const v = String(r?.viec ?? "");
    return {
      duoc: r?.loai === "lui_buoc" && r.ve === "xet_duyet_bao_gia" && r.batBuocLyDo === true && /dẫn chứng/i.test(v),
      thucTe: `${r?.loai ?? "?"} ve=${r?.ve ?? "-"} viec="${v.slice(0, 80)}"`,
      mongDoi: 'lui_buoc, cau nhac tep dan chung khong khoi phuc duoc',
    };
  },
);

kiem(
  "④ → ③ CHAN khi con don NHAP — va cau chan KHONG duoc hua nut \"Huy don\"",
  "Sep · 15/09/2026 + §3.5 CLAUDE.md (*\"dung de giao dien hua mot viec app khong lam\"*)",
  () => {
    /* 🔴 Do 15/09/2026: app KHONG co cho nao ghi `trangThai: "huy"` cho DonDatHang, cung khong
       cho nao xoa don khoi mang. Cau chan cu (*"Huy don nhap truoc roi moi lui duoc"*) day nguoi
       dung di tim mot nut khong bao gio ton tai. */
    const r = keoLui("lap_don_mua_hang", "xet_duyet_bao_gia", [poThu({ trangThai: "nhap" })], []);
    const cau = String(r?.lyDo ?? "");
    return {
      duoc: r?.loai === "khong_the" && /CHƯA có chức năng hủy/i.test(cau) && /Chốt đơn hàng/i.test(cau),
      thucTe: `${r?.loai ?? "?"}: "${cau.slice(0, 100)}"`,
      mongDoi: 'khong_the, cau noi THAT la app chua co chuc nang huy don + chi duong "Chot don hang"',
    };
  },
);

kiem(
  "④ → ③ CHAN ca khi don DA CHOT, khong chi don nhap",
  "Sep · 15/09/2026 — bang duyet siet thanh *\"Khong con PO nao gan de nghi\"*",
  () => {
    /* 🔴 CHIEU MO RONG. Luat cu chi chan `nhap`; ai khoi phuc lai dung luat cu thi bai nay do,
       vi don `da_chot` van dung ten nha cung cap sap bi xoa. */
    const r = keoLui("lap_don_mua_hang", "xet_duyet_bao_gia", [poThu({ trangThai: "da_chot" })], []);
    return {
      duoc: r?.loai === "khong_the",
      thucTe: `${r?.loai ?? "?"}: "${String(r?.lyDo ?? r?.viec ?? "").slice(0, 80)}"`,
      mongDoi: "khong_the (con BAT KY don nao cung chan, khong rieng don nhap)",
    };
  },
);

// ---------- ⑤ → ④ Lap don mua hang (chu: phanBoCongViec) ----------

kiem(
  "⑤ → ④ CHO LUI khi don da chot va CHUA dong bo QLK CTR",
  "Sep · 15/09/2026",
  () => {
    const r = keoLui("dat_hang", "lap_don_mua_hang", [poThu({ trangThai: "da_chot" })], []);
    const v = String(r?.viec ?? "");
    return {
      duoc: r?.loai === "lui_buoc" && r.ve === "lap_don_mua_hang" && r.batBuocLyDo === true && /nháp/i.test(v),
      thucTe: `${r?.loai ?? "?"} ve=${r?.ve ?? "-"} viec="${v.slice(0, 70)}"`,
      mongDoi: 'lui_buoc ve "lap_don_mua_hang", cau noi ro dua don ve nhap',
    };
  },
);

kiem(
  "⑤ → ④ CHAN khi don DA DONG BO sang QLK CTR (`qlkCtrSyncStatus === \"synced\"`)",
  "Sep · 15/09/2026 — dieu kien nang nhat cua cap nay",
  () => {
    /* 🔴 Mot ban don DA NAM BEN app Kho cong trinh. Dua don ve nhap o day khong go duoc ban do,
       va app chua co chuc nang thu hoi don da dong bo — thu kho van nhan hang theo ban cu. */
    const r = keoLui(
      "dat_hang",
      "lap_don_mua_hang",
      [poThu({ trangThai: "da_chot", qlkCtrSyncStatus: "synced" })],
      [],
    );
    const cau = String(r?.lyDo ?? "");
    return {
      duoc: r?.loai === "khong_the" && /Kho công trình/i.test(cau) && /Sửa đơn hàng/i.test(cau),
      thucTe: `${r?.loai ?? "?"}: "${cau.slice(0, 100)}"`,
      mongDoi: 'khong_the, cau nhac QLK CTR va chi duong nut "Sua don hang"',
    };
  },
);

kiem(
  "⑤ → ④ CHAN khi don da chuyen sang DANG GIAO",
  "Sep · 15/09/2026 — dieu kien ② cua bang duyet",
  () => {
    const r = keoLui("dat_hang", "lap_don_mua_hang", [poThu({ trangThai: "dang_giao" })], []);
    return {
      duoc: r?.loai === "khong_the" && /đang giao/i.test(String(r.lyDo)),
      thucTe: `${r?.loai ?? "?"}: "${String(r?.lyDo ?? r?.viec ?? "").slice(0, 80)}"`,
      mongDoi: "khong_the, cau noi ro don dang giao",
    };
  },
);

kiem(
  "⑤ → ④ CHAN nguoi khong co quyen `phanBoCongViec`",
  "Sep · 15/09/2026 — cot \"Ai duoc lui\" cua bang duyet",
  () => {
    const r = keoLui(
      "dat_hang",
      "lap_don_mua_hang",
      [poThu({ trangThai: "da_chot" })],
      [],
      quyenNhanVien,
    );
    return {
      duoc: r?.loai === "khong_the" && /Phân bổ công việc/i.test(String(r.lyDo)),
      thucTe: `${r?.loai ?? "?"}: "${String(r?.lyDo ?? r?.viec ?? "").slice(0, 80)}"`,
      mongDoi: 'khong_the, cau goi dung ten quyen "Phan bo cong viec"',
    };
  },
);

// ---------- Ba cap CUOI: khong lui duoc, va phai noi dung ly do ----------

kiem(
  "⑥ → ⑤ KHONG lui duoc — va cau chan KHONG duoc hua \"nho thu kho huy phieu\"",
  "Sep · 15/09/2026 — nguyen tac du lieu #2: Kho la nguon duy nhat cua so luong thuc nhan",
  () => {
    /* 🔴 CAU CU (13/08/2026) ghi *"Nho thu kho huy phieu truoc"* — hua rang huy phieu xong la lui
       duoc. Sai hai lan: bang duyet 15/09 cam han cap nay, VA app khong co cho nao xoa
       PhieuNhanHang (da grep `xoaPhieuNhan` · `huyPhieuNhan` · "Huy phieu": khong co ket qua). */
    const r = keoLui("nhan_hang", "dat_hang", [poThu({ trangThai: "dang_giao" })], []);
    const cau = String(r?.lyDo ?? "");
    return {
      duoc:
        r?.loai === "khong_the" &&
        /KHÔNG lùi được/i.test(cau) &&
        !/hủy phiếu/i.test(cau) &&
        /Sửa đơn hàng|Đánh dấu thất bại/i.test(cau),
      thucTe: `${r?.loai ?? "?"}: "${cau.slice(0, 110)}"`,
      mongDoi: 'khong_the, KHONG co chu "huy phieu", co chi duong thao tac CO THAT',
    };
  },
);

kiem(
  "⑦ → ⑥ KHONG lui duoc — lui la sua nguoc so lieu cua Kho",
  "Sep · 15/09/2026",
  () => {
    const r = keoLui("ho_so_thanh_toan", "nhan_hang", [poThu({ trangThai: "hoan_thanh" })], []);
    const cau = String(r?.lyDo ?? "");
    return {
      duoc: r?.loai === "khong_the" && /KHÔNG lùi được/i.test(cau),
      thucTe: `${r?.loai ?? "?"}: "${cau.slice(0, 100)}"`,
      mongDoi: "khong_the kem ly do that (khong phai cau chung chung)",
    };
  },
);

kiem(
  "KHONG truyen quyen → CHAN (thieu thong tin thi lay quyen THAP NHAT)",
  "Sep · 15/09/2026 + CLAUDE.md §3.6c",
  () => {
    /* 🔴 CHIEU AN TOAN. Tham so quyen de `?` chi vi tang giao dien dang do phien khac sua cung
       luc — nhung vang mat KHONG duoc hieu la "cho qua". Lui buoc XOA du lieu that. */
    const r = G.quyetDinhKeoTha(
      theDangO("dat_hang"),
      "lap_don_mua_hang",
      [poThu({ trangThai: "da_chot" })],
      [],
      G.CAU_HINH_MAC_DINH ?? {},
      null,
      // KHONG truyen quyen
    );
    return {
      duoc: r?.loai === "khong_the" && /quyền thấp nhất/i.test(String(r.lyDo)),
      thucTe: `${r?.loai ?? "?"}: "${String(r?.lyDo ?? r?.viec ?? "").slice(0, 90)}"`,
      mongDoi: 'khong_the, cau nhac nguyen tac "quyen thap nhat"',
    };
  },
);

kiem(
  "LUI HAI BUOC van bi chan — bang duyet chi mo LIEN KE",
  "Ban lanh dao 13/08/2026 (*\"chi cho tien hoac lui trong pham vi 1 buoc\"*) — con nguyen hieu luc",
  () => {
    /* ⚠️ Bat lai keo lui KHONG duoc lam ro chot nhay coc. Ca nay di tu ⑤ ve ③. */
    const r = keoLui("dat_hang", "xet_duyet_bao_gia", [], []);
    return {
      duoc: r?.loai === "khong_the" && /nhảy cóc/i.test(String(r.lyDo)),
      thucTe: `${r?.loai ?? "?"}: "${String(r?.lyDo ?? r?.viec ?? "").slice(0, 80)}"`,
      mongDoi: 'khong_the, cau nhac "khong nhay coc"',
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// TÁCH "Mã hợp đồng CĐT | Tên công trình" TỪ CHUỖI APP REQUEST GỬI
//
// 🔴 SỰ CỐ THẬT 13/09/2026: App Request gửi đề nghị `000000078` với chuỗi
//    "26002/HDXD | Nhà xưởng Howell" (THANH ĐỨNG). Hàm chỉ biết " - " nên không tách được,
//    dồn cả chuỗi vào "Tên công trình" và để "Số hợp đồng CĐT" trống. Ban lãnh đạo phát hiện
//    trên giao diện: *"chỗ này sao lại bị gộp tên hđ với tên công trình vậy"*.
//
// ⚠️ BÀI KIỂM CÓ CẢ HAI CHIỀU. Chỉ kiểm "tách được dấu |" là chưa đủ: ai nới thành tách theo
//    dấu `-` TRẦN thì bài đó vẫn xanh, mà mã hợp đồng thật (`UNICE-HPCS`) bị cắt đôi im lặng.
// ════════════════════════════════════════════════════════════════════

kiem(
  "TACH chuoi cong trinh theo dau THANH DUNG |",
  "Ban lanh dao 13/09/2026 (*\"sao lai bi gop ten hd voi ten cong trinh\"*) — ho so 000000078",
  () => {
    const r = AR.tachCongTrinhTuChuoi("26002/HDXD | Nhà xưởng Howell");
    return {
      duoc: r?.maHopDongCDT === "26002/HDXD" && r?.tenCongTrinh === "Nhà xưởng Howell",
      thucTe: `ma="${r?.maHopDongCDT}" ten="${r?.tenCongTrinh}"`,
      mongDoi: 'ma="26002/HDXD" ten="Nhà xưởng Howell"',
    };
  },
);

kiem(
  "VAN TACH duoc dau \" - \" nhu cu (khong pha luat goc)",
  "phien tich hop — quy uoc goc \"Ma hop dong - Ten cong trinh\"",
  () => {
    const r = AR.tachCongTrinhTuChuoi("06/2026/HĐXD-HPCS - NHÀ MÁY SHUN HING");
    return {
      duoc: r?.maHopDongCDT === "06/2026/HĐXD-HPCS" && r?.tenCongTrinh === "NHÀ MÁY SHUN HING",
      thucTe: `ma="${r?.maHopDongCDT}" ten="${r?.tenCongTrinh}"`,
      mongDoi: 'ma="06/2026/HĐXD-HPCS" ten="NHÀ MÁY SHUN HING"',
    };
  },
);

kiem(
  "KHONG duoc tach theo dau '-' TRAN — ma hop dong that co gach ngang ben trong",
  "phien tich hop — chu thich goc: \"KHONG tach theo dau `-` tran, vi ma hop dong that co the chua dau gach ngang rieng (vd UNICE-HPCS)\"",
  () => {
    /* 🔴 CHIEU NGUOC LAI. Neu ai noi thanh tach dau `-` tran thi chuoi duoi day se bi cat thanh
       ma="30/2025/HĐXD/UNICE" — sai ma hop dong, va sai IM LANG. */
    const r = AR.tachCongTrinhTuChuoi("30/2025/HĐXD/UNICE-HPCS - UNICE QUẢNG NGÃI");
    return {
      duoc: r?.maHopDongCDT === "30/2025/HĐXD/UNICE-HPCS" && r?.tenCongTrinh === "UNICE QUẢNG NGÃI",
      thucTe: `ma="${r?.maHopDongCDT}" ten="${r?.tenCongTrinh}"`,
      mongDoi: 'ma="30/2025/HĐXD/UNICE-HPCS" (NGUYEN ven, khong bi cat o dau - tran)',
    };
  },
);

kiem(
  "LAY dau xuat hien SOM NHAT, vi ma hop dong luon dung truoc",
  "Ban lanh dao 13/09/2026 — he qua cua viec nhan nhieu dau phan cach",
  () => {
    const r = AR.tachCongTrinhTuChuoi("26002/HDXD | Nhà xưởng - Howell");
    return {
      duoc: r?.maHopDongCDT === "26002/HDXD" && r?.tenCongTrinh === "Nhà xưởng - Howell",
      thucTe: `ma="${r?.maHopDongCDT}" ten="${r?.tenCongTrinh}"`,
      mongDoi: 'tach o | (vi tri 11), KHONG tach o " - " phia sau',
    };
  },
);

kiem(
  "KHONG duoc tach theo GACH DAI – — (do la dau ngat cau trong ten cong trinh)",
  "Ban lanh dao 13/09/2026 — ca that bat duoc khi quet du lieu: \"Nhà xưởng ABC — Giai đoạn 2\"",
  () => {
    /* 🔴 CHIEU NGUOC LAI, va day la LOI DA SUYT LEN BAN THAT. Ban dau co them –/— vao danh sach
       dau phan cach voi ly do "Word tu doi - thanh chung". Quet du lieu that bat duoc ngay mot
       ho so ten "Nhà xưởng ABC — Giai đoạn 2" — gach dai o day la NGAT CAU, nhan no la cat thanh
       ma="Nhà xưởng ABC" + ten="Giai đoạn 2", sai hoan toan va sai IM LANG.
       ⚠️ Chua tung thay App Request gui gach dai lam dau ngan. Dung them lai khi chua co ca that. */
    const em = AR.tachCongTrinhTuChuoi("Nhà xưởng ABC — Giai đoạn 2");
    const en = AR.tachCongTrinhTuChuoi("Nhà xưởng ABC – Giai đoạn 2");
    return {
      duoc:
        em?.maHopDongCDT === undefined &&
        em?.tenCongTrinh === "Nhà xưởng ABC — Giai đoạn 2" &&
        en?.maHopDongCDT === undefined &&
        en?.tenCongTrinh === "Nhà xưởng ABC – Giai đoạn 2",
      thucTe: `em-dash: ma="${em?.maHopDongCDT}" ten="${em?.tenCongTrinh}" | en-dash: ma="${en?.maHopDongCDT}" ten="${en?.tenCongTrinh}"`,
      mongDoi: "ca hai: ma=undefined, ten GIU NGUYEN ca chuoi",
    };
  },
);

kiem(
  "CHUOI RONG van tra null — de xuat cua phong ban, KHONG phai loi",
  "Sep 19/08/2026 (*\"nhan ca de xuat rieng cua mot phong ban, khong gan cong trinh nao\"*)",
  () => {
    const a = AR.tachCongTrinhTuChuoi("");
    const b = AR.tachCongTrinhTuChuoi(undefined);
    const c = AR.tachCongTrinhTuChuoi("   ");
    return {
      duoc: a === null && b === null && c === null,
      thucTe: `""->${JSON.stringify(a)} undefined->${JSON.stringify(b)} "   "->${JSON.stringify(c)}`,
      mongDoi: "ca ba deu null",
    };
  },
);

kiem(
  "KHONG tach duoc thi DON CA CHUOI vao ten cong trinh, khong doan bua ra ma",
  "phien tich hop — hanh vi goc, giu nguyen sau ban va 13/09/2026",
  () => {
    const r = AR.tachCongTrinhTuChuoi("Nhà xưởng Howell");
    return {
      duoc: r?.maHopDongCDT === undefined && r?.tenCongTrinh === "Nhà xưởng Howell",
      thucTe: `ma="${r?.maHopDongCDT}" ten="${r?.tenCongTrinh}"`,
      mongDoi: 'ma=undefined ten="Nhà xưởng Howell"',
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// HAI LỜI KHAI KHÁC NHAU KHI CHƯA CÓ HỢP ĐỒNG — Sếp 13/09/2026
//
// Nguyên văn: *"Khi chọn vào nút 'Không có HĐ' thì mới ko báo đỏ, còn nếu chọn nút 'Bổ sung sau'
// thì báo đỏ để nhắc việc"*.
//
// 🔴 VÌ SAO PHẢI CÓ BÀI KIỂM: trước 13/09 hai nút này giống hệt nhau — hễ ghi lý do là hết đỏ.
//    Nay chúng khác nhau, mà cái khác đó CHỈ NẰM TRONG MỘT PHÉP SO CHUỖI. Ai "dọn code cho gọn"
//    bằng cách gộp lại hai nhánh thì app quay về hành vi cũ và KHÔNG CÓ GÌ BÁO.
//
// ⚠️ BÀI KIỂM ĐỦ CẢ HAI CHIỀU, và chiều "Bổ sung sau vẫn đỏ" mới là chiều dễ mất:
//    ai nới thành `lyDoThieuHopDong(dn) !== "" → hết đỏ` thì chiều kia vẫn xanh.
// ════════════════════════════════════════════════════════════════════

const KHOA_HD = "lap_don_mua_hang|hop_dong";
/** Đề nghị KHÔNG có tệp hợp đồng, lý do ghi đúng chuỗi truyền vào. */
const hoSoThieuHD = (lyDo) => ({
  id: "x",
  items: [{ stt: 1 }],
  tepGiaiDoan: {},
  lyDoThieuChungTu: lyDo === undefined ? {} : { [KHOA_HD]: lyDo },
});

kiem(
  'Khai "Khong co HD" -> THOI to do',
  'Sep · 13/09/2026 (*"Khi chon vao nut \'Khong co HD\' thi moi ko bao do"*)',
  () => {
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.thieuHopDongDaGhiLyDo(hoSoThieuHD(CT.LY_DO_KHONG_CO_HOP_DONG));
    return {
      duoc: r === false,
      thucTe: `thieuHopDongDaGhiLyDo = ${r}`,
      mongDoi: "false (don mau PO-02 khong bao gio co HD rieng de bo sung)",
    };
  },
);

kiem(
  'Khai "Bo sung sau" -> VAN to do (chieu nguoc lai, de mat nhat)',
  'Sep · 13/09/2026 (*"con neu chon nut \'Bo sung sau\' thi bao do de nhac viec"*)',
  () => {
    /* 🔴 CHIEU NGUOC. Neu ai gop hai nhanh thanh "co ly do la het do" thi bai tren VAN XANH,
       chi bai nay bat duoc. Mat dong nay la mat luon dau nhac con no chung tu. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.thieuHopDongDaGhiLyDo(hoSoThieuHD(CT.LY_DO_BO_SUNG_SAU));
    return {
      duoc: r === true,
      thucTe: `thieuHopDongDaGhiLyDo = ${r}`,
      mongDoi: "true (con no hop dong, phai con dau do nhac viec)",
    };
  },
);

kiem(
  "Ly do GO TAY cua ho so CU -> van to do, khong duoc noi qua tay",
  "Sep · 13/09/2026 — chi DUNG MOT chuoi duoc mien",
  () => {
    /* Ho so truoc 13/09 co the ghi ly do bat ky. Chung KHONG duoc tu nhien het do — nguoi dung
       khong he khai "khong bao gio co hop dong", ho chi ghi mot ghi chu. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.thieuHopDongDaGhiLyDo(hoSoThieuHD("NCC hen tuan sau gui ban da ky"));
    return {
      duoc: r === true,
      thucTe: `thieuHopDongDaGhiLyDo = ${r}`,
      mongDoi: "true",
    };
  },
);

kiem(
  'The kanban va hop ly do phai NOI CUNG MOT CAU ve "Khong co HD"',
  "Sep · 13/09/2026 — mot luat, hai noi hoi (chung-tu-cuoi-quy-trinh + giai-doan-mua-hang)",
  () => {
    /* 🔴 DAY LA BAI KIEM CHONG APP TU MAU THUAN. Dau do cua HOP ly do lay tu
       `thieuHopDongDaGhiLyDo`, con dau do cua THE kanban lay tu `mucConNoCuaBuoc`. Sua mot noi
       thoi thi hop het do ma the van keu "thieu HD" — nguoi dung khong hieu tin cai nao. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const cauHinh = { soBaoGiaToiThieu: 2, hanGioTheoBuoc: {}, congViecTheoBuoc: {}, caiDatTungBuoc: {} };
    /* ⚠️ Tên trường là `ngan`/`day` (xem interface MucConNo) — KHÔNG phải `nhan`/`chiTiet`.
       Đọc sai tên thì mọi mục thành chuỗi rỗng và bài kiểm "xanh giả" ở chiều thứ nhất. */
    /**
     * ★★ ĐỔI BƯỚC SOÁT `dat_hang` → `lap_don_mua_hang` NGÀY 18/09/2026. ĐỌC TRƯỚC KHI ĐỔI LẠI.
     *
     * Luật 13/09 KHÔNG đổi: *"Không có HĐ"* thì thôi báo đỏ, *"Bổ sung sau"* thì vẫn đỏ. Chỉ đổi
     * **chỗ bày** — Sếp 18/09 khoanh đỏ câu "Chưa có tệp Hợp đồng…" đang hiện ở khối ⑤:
     * ***"Thông báo này ở sai chỗ. Đây là thông báo ở bước lập đơn mua hàng"***. Ô đính Hợp đồng
     * nằm ở bước ④ (`BUOC_DINH_KEM_HOP_DONG`), nên nhắc ở ⑤ là chỉ người ta tới một khối không có
     * ô để đính.
     *
     * ⚠️ HAI HỒ SƠ THỬ ở đây ĐỀU ĐÃ GHI LÝ DO (`LY_DO_KHONG_CO_HOP_DONG` / `LY_DO_BO_SUNG_SAU`)
     * nên nợ hợp đồng của chúng bày ở bước ④. Hồ sơ CHƯA ghi lý do vẫn bày ở ⑤ — ca đó do các bài
     * kiểm khác giữ, đừng gộp hai ca vào một bài.
     */
    const gomNhan = (dn) =>
      (G.mucConNoCuaBuoc(dn, "lap_don_mua_hang", cauHinh, [], []) ?? [])
        .map((m) => `${m?.ngan ?? ""} / ${m?.day ?? ""}`)
        .join(" | ");

    const khongCoHD = gomNhan(hoSoThieuHD(CT.LY_DO_KHONG_CO_HOP_DONG));
    const boSungSau = gomNhan(hoSoThieuHD(CT.LY_DO_BO_SUNG_SAU));
    const coKeuThieuHD = (s) => /h[ợo]p đ[ồo]ng|HĐ/i.test(s);

    return {
      duoc: !coKeuThieuHD(khongCoHD) && coKeuThieuHD(boSungSau),
      thucTe: `"Khong co HD" -> [${khongCoHD || "(rong)"}] ; "Bo sung sau" -> [${boSungSau || "(rong)"}]`,
      mongDoi: '"Khong co HD" KHONG con muc hop dong; "Bo sung sau" VAN con',
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// "KHÔNG CẦN ĐÍNH KÈM BẢNG SO SÁNH" PHẢI MỞ ĐƯỢC CỔNG CHUYỂN BƯỚC — Sếp 13/09/2026
//
// Nguyên văn: *"Vẫn giữ nút đính kèm bảng so sánh báo giá và thêm 1 nút không cần đính kèm báo
// giá bên cạnh"*.
//
// 🔴 CÁI BẪY ĐÃ DÍNH THẬT: bản làm ngày 13/09 đặt khóa `KHOA_BO_QUA_SO_SANH` trong TỆP GIAO DIỆN,
//    nên `vuongMacTrinhXetDuyet` không đọc được — bấm nút chỉ tắt cảnh báo tại ô, còn nút "Trình
//    xét duyệt báo giá" vẫn khóa. Nút hứa một việc app không làm (CLAUDE.md §3.5). Nối lại
//    14/09/2026 bằng cách dời khóa sang `2-quy-trinh/bao-gia-dinh-kem.ts`.
//
// ⚠️ HAI CHIỀU: chưa ghi lý do thì VẪN phải chặn — nếu không, luật "bảng so sánh bắt buộc"
//    (Ban lãnh đạo 20/08/2026) mất sạch mà bài kiểm vẫn xanh.
// ════════════════════════════════════════════════════════════════════

/** Hồ sơ có ĐÚNG 2 bản báo giá thật, KHÔNG có tệp bảng so sánh. */
const hoSoHaiBaoGiaKhongBangSoSanh = (lyDoBoQua) => ({
  id: "x",
  items: [{ stt: 1 }],
  tepGiaiDoan: {
    yeu_cau_bao_gia: [
      { id: "t1", ten: "bg1.pdf", ghiChu: "Báo giá NCC 1 — Công ty A" },
      { id: "t2", ten: "bg2.pdf", ghiChu: "Báo giá NCC 2 — Công ty B" },
    ],
  },
  lyDoThieuChungTu: lyDoBoQua === undefined ? {} : { "yeu_cau_bao_gia|bang_so_sanh": lyDoBoQua },
});

kiem(
  "2 bao gia that, THIEU bang so sanh, CHUA ghi ly do -> van CHAN",
  "Ban lanh dao · 20/08/2026 (*\"muc nay bat buoc phai co\"*) — chieu nguoc lai cua luat 13/09",
  () => {
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const r = BG.vuongMacTrinhXetDuyet(hoSoHaiBaoGiaKhongBangSoSanh(undefined), {
      soBaoGiaToiThieu: 2,
    });
    return {
      duoc: typeof r === "string" && r.includes(BG.NHAN_O_SO_SANH),
      thucTe: r === null ? "null (LOT — luat 20/08 da mat!)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: `cau chan nhac "${BG.NHAN_O_SO_SANH}"`,
    };
  },
);

kiem(
  "2 bao gia that, THIEU bang so sanh, DA ghi ly do -> KHONG chan nua",
  'Sep · 13/09/2026 (*"them 1 nut khong can dinh kem bao gia ben canh"*), noi vao cong 14/09/2026',
  () => {
    /* 🔴 TRUOC 14/09 BAI NAY DO: khoa nam trong tep giao dien nen cong khong doc duoc.
       Neu bai nay do tro lai, kiem xem ai da go dieu kien `lyDoBoQuaSoSanh(deNghi) === ""`
       khoi `vuongMacTrinhXetDuyet` — go la nut kia thanh nut gia. */
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const r = BG.vuongMacTrinhXetDuyet(
      hoSoHaiBaoGiaKhongBangSoSanh("Chỉ có 2 NCC, đã so trực tiếp trong cuộc họp."),
      { soBaoGiaToiThieu: 2 },
    );
    return {
      duoc: r === null,
      thucTe: r === null ? "null (dung — cho di tiep)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "null",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// HỢP ĐỒNG BẮT BUỘC MỚI ĐÓNG ĐƯỢC HỒ SƠ — Sếp 14/09/2026
//
// Nguyên văn: *"2 loại này đều phải đính kèm hợp đồng… E chỉ cần tạo nút đính kèm HĐ bắt buộc
// là được"* (sau khi bỏ hướng tách thành hai ô Hợp đồng / Đơn mua hàng).
//
// 🔴 CHỖ DỄ HỎNG NHẤT: `vuongMacHoanThanhQuyTrinh` phải hỏi `coHopDong` (CHỈ tệp), KHÔNG được
//    "dọn cho thống nhất" thành `vuongMacRoiBuocLapDon` (tệp HOẶC lý do). Đổi sang hàm kia thì
//    hồ sơ bấm "Không có HĐ" đóng được mà không có tờ hợp đồng nào — luật này mất sạch, và mất
//    IM LẶNG vì cả hai hàm đều trả `string | null` nên không lỗi kiểu nào báo.
//
// ⚠️ Hai chốt CỐ Ý khác nhau, bài kiểm giữ cả hai:
//    · bước ④ `vuongMacRoiBuocLapDon`     → tệp HOẶC lý do (nới, để lập được đơn khi HĐ chưa ký)
//    · bước ⑧ `vuongMacHoanThanhQuyTrinh` → BẮT BUỘC có tệp (đóng hồ sơ đẩy sang Kế toán)
// ════════════════════════════════════════════════════════════════════

/** Hồ sơ đã xong hết mọi điều kiện KHÁC của bước ⑧, chỉ còn chuyện hợp đồng. */
const hoSoSanSangDong = (lyDo, coTepHopDong) => ({
  id: "x",
  items: [{ stt: 1 }],
  tepGiaiDoan: {
    ...(coTepHopDong
      ? { lap_don_mua_hang: [{ id: "hd1", ten: "hop-dong.pdf", ghiChu: "Hợp đồng" }] }
      : {}),
    ho_so_thanh_toan: [{ id: "v1", ten: "vat.pdf", ghiChu: "Hóa đơn VAT" }],
  },
  lyDoThieuChungTu: lyDo === undefined ? {} : { [KHOA_HD]: lyDo },
  /* ⚠️ DÒNG NÀY NAY LÀ DỮ LIỆU THỪA, CỐ Ý GIỮ. Trước 15/09/2026 nó là thứ bắt buộc để hồ sơ vượt
     qua chốt `daTichXongUNC`; Sếp đã bỏ cái tích đó (xem khối bài kiểm "BỎ Ô TÍCH ỦY NHIỆM CHI").
     Giữ lại để chứng minh thêm một điều: hồ sơ CŨ còn mang dấu tích cũ vẫn chạy bình thường —
     luật mới không được vấp vào dữ liệu lịch sử. */
  congViecDaXong: [{ maCongViec: "unc_xong", thoiDiem: "2026-09-14T01:00:00.000Z" }],
});
/** Tiến độ "mọi mặt hàng đã lên đơn và đã về đủ" — để không vướng hai chốt khối lượng. */
const tienDoXong = [{ khoiLuongChuaLenPO: 0, khoiLuongConLai: 0 }];

kiem(
  "THIEU tep hop dong -> CHAN hoan thanh quy trinh",
  'Sep · 14/09/2026 (*"2 loai nay deu phai dinh kem hop dong"*)',
  () => {
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.vuongMacHoanThanhQuyTrinh(hoSoSanSangDong(undefined, false), tienDoXong);
    return {
      duoc: typeof r === "string" && /h[ợo]p đ[ồo]ng/i.test(r),
      thucTe: r === null ? "null (LOT — luat 14/09 da mat!)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "cau chan nhac Hop dong",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// 🔴🔴 LUẬT ĐÃ ĐỔI 16/09/2026 — BÀI KIỂM NÀY ĐƯỢC **VIẾT LẠI**, KHÔNG BỊ XOÁ. GHI ĐỦ HAI MỐC.
//
// · LUẬT CŨ — Sếp 14/09/2026, nguyên văn:
//     ***"2 loại này đều phải đính kèm hợp đồng… E chỉ cần tạo nút đính kèm HĐ bắt buộc là được"***
//   Khi đó bài kiểm này tên là *'Khai "Khong co HD" van KHONG dong duoc ho so'* và đòi
//   `vuongMacHoanThanhQuyTrinh` trả về CÂU CHẶN cho hồ sơ đã khai "Không có HĐ" mà chưa có tệp.
//
// · LUẬT MỚI THAY THẾ — Sếp 16/09/2026, nguyên văn (trả lời câu hỏi "khai không có hợp đồng thì có
//   được coi là đủ điều kiện đóng hồ sơ không"):
//     ***"Đúng, là điều kiện để đóng hồ sơ, nhưng phải có ghi chú và được link xuống mục 8"***
//
// 👉 LUẬT CŨ KHÔNG BỊ AI LỠ TAY XOÁ — nó được thay bằng chỉ đạo mới. Ai đọc tới đây mà thấy hồ sơ
//    khai "Không có HĐ" đóng được thì đó là ĐÚNG, không phải lỗ hổng.
// ⚠️ NHƯNG RANH GIỚI PHẢI GIỮ BẰNG MỌI GIÁ: chỉ **lời khai dứt điểm** mới mở cửa. Ba bài kiểm
//    chiều nghịch ngay dưới canh đúng chỗ đó.
// ════════════════════════════════════════════════════════════════════

kiem(
  'LUAT MOI: khai "Khong co HD" -> DONG DUOC ho so (loi khai la dieu kien du)',
  'Sep · 16/09/2026 — *"Dung, la dieu kien de dong ho so, nhung phai co ghi chu va duoc link xuong muc 8"* (thay luat 14/09/2026)',
  () => {
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.vuongMacHoanThanhQuyTrinh(
      hoSoSanSangDong(CT.LY_DO_KHONG_CO_HOP_DONG, false),
      tienDoXong,
    );
    return {
      duoc: r === null,
      thucTe: r === null ? "null (dong duoc — dung luat moi 16/09)" : `"${String(r).slice(0, 110)}"`,
      mongDoi:
        "null — don mau PO-02 khong co hop dong rieng, khai dut diem la du dieu kien (Sep 16/09/2026)",
    };
  },
);

kiem(
  '🔴 CHIEU NGHICH SO 1: "Bo sung sau" VAN KHONG dong duoc ho so',
  'Sep · 16/09/2026 — chi LOI KHAI DUT DIEM moi mo cua, "Bo sung sau" nghia la CON NO chung tu',
  () => {
    /* 🔴🔴 BAI KIEM QUAN TRONG NHAT CUA CA LUOT SUA 16/09/2026.
       Neu ai noi `daKhaiKhongCoHopDong` thanh `lyDoThieuHopDong(dn) !== ""` (hoac dung
       `vuongMacRoiBuocLapDon` cho "gon") thi bai TREN van xanh, chi bai nay bat duoc — va hau qua
       la AI QUEN DINH KEM CUNG DONG DUOC HO SO, tuc BO CHOT chu khong phai noi chot. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.vuongMacHoanThanhQuyTrinh(
      hoSoSanSangDong(CT.LY_DO_BO_SUNG_SAU, false),
      tienDoXong,
    );
    return {
      duoc: typeof r === "string" && /h[ợo]p đ[ồo]ng/i.test(r),
      thucTe: r === null ? "null (LOT — 'Bo sung sau' da mo cua dong ho so!)" : `"${String(r).slice(0, 110)}"`,
      mongDoi: "van chan — 'Bo sung sau' la mot mon no dang treo, khong phai ket luan",
    };
  },
);

kiem(
  "🔴 CHIEU NGHICH SO 2: LY DO GO TAY (ho so cu truoc 13/09) VAN KHONG dong duoc",
  'Sep · 16/09/2026 — chuoi la khong phai loi khai dut diem',
  () => {
    /* Ho so truoc 13/09/2026 go ly do tu do. Neu phep so duoc noi thanh "co ghi gi do la duoc"
       thi toan bo lop ho so cu do dong duoc ma khong ai doc lai chung. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.vuongMacHoanThanhQuyTrinh(
      hoSoSanSangDong("NCC hen gui ban ky tuan sau", false),
      tienDoXong,
    );
    return {
      duoc: typeof r === "string" && /h[ợo]p đ[ồo]ng/i.test(r),
      thucTe: r === null ? "null (LOT — ly do go tay da mo cua!)" : `"${String(r).slice(0, 110)}"`,
      mongDoi: "van chan — chi dung chuoi LY_DO_KHONG_CO_HOP_DONG moi la loi khai dut diem",
    };
  },
);

kiem(
  "🔴 CHIEU NGHICH SO 3: khai o MUC 4 (Don mua hang) KHONG mo duoc cua dong ho so",
  'Sep · 16/09/2026 — *"PO la chac chan co, chi la bo sung sau thoi. Kiem tra lai va dieu chinh"*',
  () => {
    /* 🔴 CA NAY DA TUNG TON TAI THAT trong ban dung dau ngay 16/09/2026: muc 3 va muc 4 dung CHUNG
       mot truong ly do, nen khai "Khong co HD" lam muc Don mua hang cung nhan cau do. Sep bat dung
       loi nay. Sau khi tach, khoa cua muc 4 la `KHOA_LY_DO_THIEU_DON_MUA_HANG` — ghi vao do thi
       chot hop dong KHONG duoc dong y, vi PO va hop dong la hai chung tu khac ban chat. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const hoSo = hoSoSanSangDong(undefined, false);
    hoSo.lyDoThieuChungTu = {
      [CT.KHOA_LY_DO_THIEU_DON_MUA_HANG]: CT.LY_DO_KHONG_CO_HOP_DONG,
    };
    const r = CT.vuongMacHoanThanhQuyTrinh(hoSo, tienDoXong);
    return {
      duoc: typeof r === "string" && /h[ợo]p đ[ồo]ng/i.test(r),
      thucTe: r === null ? "null (LOT — khai o muc 4 da mo cua dong ho so!)" : `"${String(r).slice(0, 110)}"`,
      mongDoi:
        "van chan — khoa cua muc 4 khong duoc dong y thay cho hop dong; PO la chung tu goc cua ca don hang",
    };
  },
);

kiem(
  "🔴 CHIEU NGHICH SO 4: khoi luong CHUA VE DU thi khai 'Khong co HD' cung KHONG dong duoc",
  "Sep · 16/09/2026 — Sep mo dung MOT cua, khong mo ca hang rao",
  () => {
    /* Chot khoi luong nam TRUOC chot hop dong trong `vuongMacHoanThanhQuyTrinh`. Bai nay chung
       minh loi khai khong keo theo viec noi cac chot khac. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.vuongMacHoanThanhQuyTrinh(hoSoSanSangDong(CT.LY_DO_KHONG_CO_HOP_DONG, false), [
      { khoiLuongChuaLenPO: 0, khoiLuongConLai: 5 },
    ]);
    return {
      duoc: typeof r === "string" && /nh[ậa]n đ[ủu]|nh[ậa]n h[àa]ng/i.test(r),
      thucTe: r === null ? "null (LOT — chot khoi luong da mat!)" : `"${String(r).slice(0, 110)}"`,
      mongDoi: "van chan vi con mat hang chua nhan du hang",
    };
  },
);

kiem(
  "🔴 CHIEU NGHICH SO 5: khai 'Khong co HD' ma THIEU HOA DON VAT thi VAN chan",
  "Ban lanh dao · 22/08/2026 — chot hoa don VAT khong duoc noi theo luat moi 16/09/2026",
  () => {
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const hoSo = {
      id: "x",
      items: [{ stt: 1 }],
      tepGiaiDoan: {},
      lyDoThieuChungTu: { [KHOA_HD]: CT.LY_DO_KHONG_CO_HOP_DONG },
      congViecDaXong: [],
      lichSu: [],
    };
    const r = CT.vuongMacHoanThanhQuyTrinh(hoSo, tienDoXong);
    return {
      duoc: typeof r === "string" && /h[oóơ]a ?đ[oơ]n|VAT/i.test(r),
      thucTe: r === null ? "null (LOT — chot hoa don VAT da mat!)" : `"${String(r).slice(0, 110)}"`,
      mongDoi: "cau chan nhac Hoa don VAT",
    };
  },
);

kiem(
  "CAU CHAN hop dong phai CHI DUNG CHO CON LAM DUOC VIEC (khong con o nop o buoc ⑧)",
  'Sep · 16/09/2026 — *"Bo nut dinh kem nay, hop dong se duoc link tu buoc 3 xuong"*',
  () => {
    /* 🔴 CLAUDE.md §3.5 — giao dien khong duoc hua mot viec app khong lam. O nop hop dong o buoc ⑧
       da bi bo, nen cau chan KHONG duoc con noi "dinh kem ngay o o Hop dong trong khoi nay":
       nguoi dung se di tim mot cai nut khong con tren man hinh. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.vuongMacHoanThanhQuyTrinh(hoSoSanSangDong(undefined, false), tienDoXong);
    const chuoi = String(r ?? "");
    const chiDungCho = /L[ậa]p đ[ơo]n mua h[àa]ng/i.test(chuoi) && !/trong kh[ốo]i n[àa]y/i.test(chuoi);
    return {
      duoc: chiDungCho,
      thucTe: `"${chuoi.slice(0, 150)}"`,
      mongDoi:
        'cau chan chi ve buoc "Lap don mua hang" (noi con o nop that), KHONG con chu "trong khoi nay"',
    };
  },
);

kiem(
  "CO tep hop dong -> khong con vuong chuyen hop dong nua",
  "Sep · 14/09/2026 — chieu nguoc lai, chong chan qua tay",
  () => {
    /* Chieu nguoc: chan chat qua thi ho so du chung tu van khong dong duoc = ket vinh vien. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.vuongMacHoanThanhQuyTrinh(hoSoSanSangDong(undefined, true), tienDoXong);
    return {
      duoc: r === null,
      thucTe: r === null ? "null (dong duoc ho so)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "null",
    };
  },
);

kiem(
  "BUOC ④ VAN NOI RONG nhu cu — khai ly do la lap duoc don",
  "Sep · 13/09/2026 — hai chot co y khac nhau, dung go nham chot nay",
  () => {
    /* 🔴 CHONG "DON CHO THONG NHAT" THEO CHIEU NGUOC LAI: ai siet buoc ④ thanh bat buoc co tep
       (cho giong buoc ⑧) thi ca phong khong lap duoc don khi hop dong chua ky xong. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.vuongMacRoiBuocLapDon(hoSoThieuHD(CT.LY_DO_BO_SUNG_SAU));
    return {
      duoc: r === null,
      thucTe: r === null ? "null (lap don duoc)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "null — buoc ④ chap nhan tep HOAC ly do",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// BỎ Ô TÍCH "ĐÃ XỬ LÝ ỦY NHIỆM CHI" Ở BƯỚC ⑧ — LUẬT ĐÃ ĐỔI, GHI ĐỦ HAI MỐC
//
// · LUẬT CŨ — Ban lãnh đạo 23/08/2026: bước ⑧ "Hồ sơ thanh toán" có MỘT việc BẮT BUỘC
//   `{ ma: "unc_xong", ten: "Đã xử lý ủy nhiệm chi (hoặc đơn này không cần)" }`, và
//   `vuongMacHoanThanhQuyTrinh` chặn đóng hồ sơ khi chưa tích. Ban lãnh đạo 22/08/2026 còn thêm
//   chốt "chưa có Hóa đơn VAT thì chưa tích được" (`vuongMacTichXongUNC`).
//
// · LUẬT MỚI THAY THẾ — Sếp 15/09/2026, khoanh đỏ đúng khối đó trên bản chạy thật:
//   ***"bỏ mục này, ko cần thiết"***, và sau khi được báo đây là VIỆC BẮT BUỘC chứ không phải ghi
//   chú, nên bỏ nó là đổi luật: ***"bỏ và thiết lập lại luật mới"***.
//
// 👉 ĐỌC KỸ TRƯỚC KHI SỬA: luật cũ KHÔNG bị ai lỡ tay xóa — nó được thay bằng chỉ đạo mới. Nhưng
//    Sếp chỉ bỏ CÁI TÍCH, không bỏ chứng từ: bước ⑧ vẫn đòi đủ **Hợp đồng** và **Hóa đơn VAT**.
//    Ba bài kiểm dưới đây canh đúng ranh giới đó — hai chiều, không chỉ một.
// ════════════════════════════════════════════════════════════════════

kiem(
  "LUAT MOI: KHONG tich UNC van DONG DUOC ho so (du hop dong + hoa don VAT)",
  'Sep · 15/09/2026 — *"bo muc nay, ko can thiet"* → *"bo va thiet lap lai luat moi"*',
  () => {
    /* 🔴 BAI KIEM CHINH CUA LUAT MOI. Neu ai khoi phuc phep kiem `daTichXongUNC` (vi doc chu thich
       cu 23/08/2026 roi tuong luat van con song) thi ho so du chung tu VAN bi chan — ma khong con
       o tich nao trong app de go, tuc ket VINH VIEN. Bai nay do se bat duoc ngay. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const hoSo = {
      id: "x",
      items: [{ stt: 1 }],
      tepGiaiDoan: {
        lap_don_mua_hang: [{ id: "hd1", ten: "hop-dong.pdf", ghiChu: "Hợp đồng" }],
        ho_so_thanh_toan: [{ id: "v1", ten: "vat.pdf", ghiChu: "Hóa đơn VAT" }],
      },
      lyDoThieuChungTu: {},
      /* 🔴 CO Y DE RONG — do dung thu Sep vua bo: khong tich gi ca. */
      congViecDaXong: [],
    };
    const r = CT.vuongMacHoanThanhQuyTrinh(hoSo, tienDoXong);
    return {
      duoc: r === null,
      thucTe: r === null ? "null (dong duoc — dung luat moi)" : `"${String(r).slice(0, 110)}"`,
      mongDoi: "null — buoc ⑧ khong con doi tich uy nhiem chi",
    };
  },
);

kiem(
  "CHIEU NGUOC: thieu HOA DON VAT thi VAN PHAI CHAN dong ho so",
  "Ban lanh dao · 22/08/2026 — chot nay KHONG duoc noi theo khi bo o tich 15/09/2026",
  () => {
    /* 🔴 DAY LA BAI KIEM QUAN TRONG NHAT CUA DOT SUA 15/09. Bo `unc_xong` ma lo tay go luon phep
       kiem hoa don (hai dong nam sat nhau trong `vuongMacHoanThanhQuyTrinh`) thi ho so dong duoc
       MA KHONG CO MOT CHUNG TU THANH TOAN NAO — Ke toan khong hach toan duoc. Bai TREN van xanh
       trong ca do, chi bai nay bat duoc. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const hoSoThieuVAT = {
      id: "x",
      items: [{ stt: 1 }],
      tepGiaiDoan: {
        lap_don_mua_hang: [{ id: "hd1", ten: "hop-dong.pdf", ghiChu: "Hợp đồng" }],
      },
      lyDoThieuChungTu: {},
      congViecDaXong: [],
    };
    const r = CT.vuongMacHoanThanhQuyTrinh(hoSoThieuVAT, tienDoXong);
    return {
      duoc: typeof r === "string" && /h[oóơ]a ?đ[oơ]n|VAT/i.test(r),
      thucTe: r === null ? "null (LOT — chot hoa don VAT da mat!)" : `"${String(r).slice(0, 110)}"`,
      mongDoi: "cau chan nhac Hoa don VAT",
    };
  },
);

kiem(
  "CAU HINH DA LUU tren kho chung phai bi LOC BO viec unc_xong",
  'Sep · 15/09/2026 — bo o mac dinh la CHUA DU, ban da luu de nguyen khoi',
  () => {
    /* 🔴 DO THAT 15/09/2026, KHONG PHAI DE PHONG SUONG: document `chay-thu/du-lieu-chung` tren
       project `hpcons-portal` DANG giu `cauHinh.congViecTheoBuoc.ho_so_thanh_toan = [unc_xong]`.
       `gopCauHinhVoiMacDinh` gop NONG mot tang nen ban da luu DE nguyen khoi len mac dinh — xoa o
       `CAU_HINH_MAC_DINH` thoi thi o tich VAN HIEN va ho so VAN bi doi tich mot viec khong con
       luat nao do. Chot that nam o `MA_CONG_VIEC_DA_BO`, va day la bai kiem canh no.
       ⚠️ Bai nay goi THAT `gopCauHinhVoiMacDinh`, khong grep chu — chu thich khong chay duoc. */
    const banDaLuu = {
      soBaoGiaToiThieu: 2,
      hanGioTheoBuoc: {},
      caiDatTungBuoc: {},
      congViecTheoBuoc: {
        tiep_nhan: [{ ma: "checkin_ton_kho", ten: "Checkin hàng tồn kho", batBuoc: true }],
        ho_so_thanh_toan: [
          { ma: "unc_xong", ten: "Đã xử lý ủy nhiệm chi (hoặc đơn này không cần)", batBuoc: true },
        ],
      },
    };
    const ra = CQ.gopCauHinhVoiMacDinh(banDaLuu);
    const conUNC = Object.values(ra.congViecTheoBuoc ?? {}).some((ds) =>
      (ds ?? []).some((cv) => cv.ma === "unc_xong"),
    );
    /* CHIEU NGUOC NGAY TRONG BAI: loc qua tay (xoa sach ca bang) thi viec checkin ton kho cung
       bien mat — chot chong MUA TRUNG hang kho dang co se mat im lang. */
    const conCheckin = (ra.congViecTheoBuoc?.tiep_nhan ?? []).some(
      (cv) => cv.ma === "checkin_ton_kho",
    );
    return {
      duoc: !conUNC && conCheckin,
      thucTe: `con unc_xong = ${conUNC} · con checkin_ton_kho = ${conCheckin}`,
      mongDoi: "unc_xong bi loc bo, checkin_ton_kho giu nguyen",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// TÁCH TIỀN THUẾ THEO TỪNG MỨC — Sếp 14/09/2026
//
// Nguyên văn: *"Tách các dòng theo mức thuế của từng mặt hàng"*, chỉ vào dòng tổng cũ ghi
// *"Tiền thuế GTGT (nhiều mức) 84.400 đ"* — kế toán không đối chiếu được với hóa đơn NCC.
//
// 🔴 LUẬT SỐNG CÒN: tổng của `theoMucThue` PHẢI bằng đúng `tienThueGTGT`. Lệch một đồng là màn
//    hình bày ba dòng cộng không ra dòng tổng — người dùng mất tin vào toàn bộ khối tiền.
//
// ⚠️ CÁI BẪY ĐÃ TRÁNH, BÀI KIỂM NÀY GIỮ LẠI: mỗi mức thuế chỉ được làm tròn ĐÚNG MỘT LẦN, theo cơ
//    sở tính thuế của CẢ NHÓM. Ai "dọn cho gọn" bằng cách cộng `dong[].tienThueGTGT` (số đã làm
//    tròn theo từng dòng) để ra số của một mức thì lệch vài đồng — và lệch IM LẶNG.
// ════════════════════════════════════════════════════════════════════

kiem(
  "Don TRON hai muc thue -> tach du hai dong, KHONG con mot cuc 'nhieu muc'",
  'Sep · 14/09/2026 (*"Tach cac dong theo muc thue cua tung mat hang"*)',
  () => {
    /* Dựng đúng ca trong ảnh Sếp gửi: 3 dòng, mức 10% · 8% · 10%. */
    const r = M.tinhTienChiTiet(
      [
        { sttDong: 1, soLuong: 32, donGia: 10_000, thueSuatGTGT: 10 },
        { sttDong: 2, soLuong: 23, donGia: 25_000, thueSuatGTGT: 8 },
        { sttDong: 3, soLuong: 2, donGia: 32_000, thueSuatGTGT: 10 },
      ],
      { thueSuatGTGT: 8 },
    );
    const ds = r?.theoMucThue ?? [];
    const muc = ds.map((m) => m.mucThue);
    return {
      duoc: ds.length === 2 && muc[0] === 8 && muc[1] === 10 && r.nhieuMucThue === true,
      thucTe: `${ds.length} mức: ${JSON.stringify(ds)}`,
      mongDoi: "2 mức, sắp TĂNG DẦN [8, 10], và nhieuMucThue = true",
    };
  },
);

kiem(
  "TONG cac muc PHAI bang dung tienThueGTGT (chong lech im lang)",
  "Sep · 14/09/2026 — chot chong hai cho cung tinh mot con so",
  () => {
    /* 🔴 Dùng số LẺ để phép làm tròn có cơ hội lệch. Số tròn thì bài kiểm xanh giả. */
    const r = M.tinhTienChiTiet(
      [
        { sttDong: 1, soLuong: 7, donGia: 13_333, thueSuatGTGT: 10 },
        { sttDong: 2, soLuong: 3, donGia: 9_777, thueSuatGTGT: 8 },
        { sttDong: 3, soLuong: 11, donGia: 4_321, thueSuatGTGT: 5 },
        { sttDong: 4, soLuong: 2, donGia: 55_555, thueSuatGTGT: 10 },
      ],
      { thueSuatGTGT: 10, chietKhauPhanTram: 3 },
    );
    const tong = (r?.theoMucThue ?? []).reduce((s, m) => s + m.tienThue, 0);
    return {
      duoc: tong === r?.tienThueGTGT,
      thucTe: `cộng các mức = ${tong} · tienThueGTGT = ${r?.tienThueGTGT}`,
      mongDoi: "hai số BẰNG NHAU tuyệt đối",
    };
  },
);

kiem(
  "Don MOT muc -> van tra dung MOT phan tu, khong phai mang rong",
  "Sep · 14/09/2026 — noi ve tu quyet bay hay khong, dung bat no doan",
  () => {
    /* Chiều ngược: trả mảng rỗng cho đơn một mức thì nơi vẽ rơi vào nhánh "nhiều mức" sai, hoặc
       không in dòng thuế nào — chứng từ thiếu hẳn tiền thuế. */
    const r = M.tinhTienChiTiet(
      [
        { sttDong: 1, soLuong: 5, donGia: 20_000 },
        { sttDong: 2, soLuong: 3, donGia: 10_000 },
      ],
      { thueSuatGTGT: 8 },
    );
    const ds = r?.theoMucThue ?? [];
    return {
      duoc: ds.length === 1 && ds[0]?.mucThue === 8 && r.nhieuMucThue === false,
      thucTe: `${ds.length} phần tử: ${JSON.stringify(ds)} · nhieuMucThue=${r?.nhieuMucThue}`,
      mongDoi: "đúng 1 phần tử mức 8%, nhieuMucThue = false",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA SẾP — 15/09/2026
// Hồ sơ đã qua nghiệm thu (thẻ sang bước "Hồ sơ thanh toán") thì KHÔNG
// được thay tệp phiếu giao nhận nữa — đó là chứng từ đã dùng để nghiệm
// thu. Luật ở `2-quy-trinh/tinh-toan.ts` → `vuongMacThayTepPhieuGiao`.
//
// 🔴 PHẢI KIỂM CẢ HAI CHIỀU. Chỉ kiểm "khóa đúng lúc cần khóa" là chưa
//    đủ: ai sửa hàm thành `return "..."` vô điều kiện thì bài đó vẫn
//    xanh, mà đường BỔ SUNG phiếu cũ còn thiếu tệp đã chết — và luật
//    11/08/2026 nói rõ mất đường đó là đơn KẸT VĨNH VIỄN.
// ════════════════════════════════════════════════════════════════════

/** Tệp giả lập — luật chỉ hỏi "có hay không", không đọc nội dung. */
const tepGiao = { id: "f-giao", tenTep: "phieu-giao.pdf" };
/** Đơn còn đang chạy (chưa hoàn thành) — để tách bạch với nhánh khóa của luật 23/08. */
const poDangChay = { trangThai: "dang_giao" };

kiem(
  "Hồ sơ đã sang bước Hồ sơ thanh toán + phiếu đã nhập kho + ĐÃ CÓ tệp → KHÓA thay tệp",
  "Sếp · 15/09/2026 — chứng từ đã dùng để nghiệm thu thì không đổi được nữa",
  () => {
    const r = M.vuongMacThayTepPhieuGiao(
      phieu({ trangThai: "da_nhap_kho", tepPhieuGiao: tepGiao }),
      poDangChay,
      "ho_so_thanh_toan",
    );
    return {
      duoc: typeof r === "string" && r !== "",
      thucTe: r === null ? "null (VẪN CHO THAY)" : `"${r}"`,
      mongDoi: "một câu lý do — khóa thay tệp",
    };
  },
);

kiem(
  "Bước Hoàn thành cũng khóa — không chỉ riêng Hồ sơ thanh toán",
  "Sếp · 15/09/2026 — 'sang bước Hồ sơ thanh toán TRỞ ĐI'",
  () => {
    const r = M.vuongMacThayTepPhieuGiao(
      phieu({ trangThai: "da_nhap_kho", tepPhieuGiao: tepGiao }),
      poDangChay,
      "hoan_thanh",
    );
    return {
      duoc: typeof r === "string" && r !== "",
      thucTe: r === null ? "null (VẪN CHO THAY)" : `"${r}"`,
      mongDoi: "một câu lý do — bước sau nghiệm thu cũng phải khóa",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: phiếu cũ CHƯA CÓ tệp, dù hồ sơ đã sang Hồ sơ thanh toán → VẪN cho bổ sung",
  "Ban lãnh đạo · 11/08/2026 (đường bổ sung) + Sếp · 15/09/2026",
  () => {
    /* 🔴 BÀI KIỂM QUAN TRỌNG NHẤT CỦA CỤM NÀY. Bước "Hồ sơ thanh toán" chỉ cần HÀNG VỀ ĐỦ, không
       cần đơn đã hoàn thành. Khóa cả việc bổ sung ở bước này = phiếu thiếu tệp không bao giờ bổ
       sung được, mà thiếu tệp thì `vuongMacXacNhanKho` chặn xác nhận hoàn thành → KẸT VĨNH VIỄN. */
    const r = M.vuongMacThayTepPhieuGiao(
      phieu({ trangThai: "da_nhap_kho", tepPhieuGiao: undefined }),
      poDangChay,
      "ho_so_thanh_toan",
    );
    return {
      duoc: r === null,
      thucTe: r === null ? "null" : `"${r}" (ĐÃ CHẶN — đơn sẽ kẹt vĩnh viễn)`,
      mongDoi: "null — chưa có tệp thì LUÔN cho bổ sung",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: hàng đang về (bước Tiến hành nhận hàng) → chưa tới lúc khóa, vẫn thay được",
  "Sếp · 15/09/2026 — chặn quá tay cũng là lỗi",
  () => {
    const r = M.vuongMacThayTepPhieuGiao(
      phieu({ trangThai: "da_nhap_kho", tepPhieuGiao: tepGiao }),
      poDangChay,
      "nhan_hang",
    );
    return {
      duoc: r === null,
      thucTe: r === null ? "null" : `"${r}"`,
      mongDoi: "null — chứng từ chưa được lấy làm căn cứ nghiệm thu, gắn nhầm phải sửa được",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: phiếu còn Chờ kiểm tra → vẫn thay được, đây là đường gỡ khóa hợp lệ",
  "Sếp · 15/09/2026 — chỉ phiếu ĐÃ NHẬP KHO mới là căn cứ nghiệm thu",
  () => {
    const r = M.vuongMacThayTepPhieuGiao(
      phieu({ trangThai: "cho_kiem_tra", tepPhieuGiao: tepGiao }),
      poDangChay,
      "ho_so_thanh_toan",
    );
    return {
      duoc: r === null,
      thucTe: r === null ? "null" : `"${r}" (không còn đường sửa tệp gắn nhầm)`,
      mongDoi: "null — chỉ phiếu `da_nhap_kho` mới bị khóa",
    };
  },
);

kiem(
  "Đơn đã hoàn thành → vẫn khóa, kể cả khi đơn không gắn đề nghị nào",
  "phiên nghiệp vụ · 23/08/2026 — luật cũ KHÔNG được nới khi thêm luật 15/09",
  () => {
    /* Chiều bảo vệ luật cũ: nhánh `po.trangThai === "hoan_thanh"` phải khóa VÔ ĐIỀU KIỆN, kể cả
       PO "chờ đề nghị" (`giaiDoanDeNghi = null`) và kể cả phiếu chưa có tệp. Ai đem điều kiện
       "phải có tệp" của luật 15/09 gắn vào nhánh này là NỚI một luật đang chạy. */
    const r = M.vuongMacThayTepPhieuGiao(
      phieu({ trangThai: "da_nhap_kho", tepPhieuGiao: tepGiao }),
      { trangThai: "hoan_thanh" },
      null,
    );
    return {
      duoc: typeof r === "string" && r !== "",
      thucTe: r === null ? "null (LUẬT 23/08 ĐÃ MẤT)" : `"${r}"`,
      mongDoi: "một câu lý do — đơn hoàn thành thì không thay tệp",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: PO chưa gắn đề nghị, đơn đang chạy → không khóa bừa",
  "Sếp · 15/09/2026 — không có bước nào để xét thì đừng bịa ra một bước",
  () => {
    const r = M.vuongMacThayTepPhieuGiao(
      phieu({ trangThai: "da_nhap_kho", tepPhieuGiao: tepGiao }),
      poDangChay,
      null,
    );
    return {
      duoc: r === null,
      thucTe: r === null ? "null" : `"${r}"`,
      mongDoi: "null — PO 'chờ đề nghị' không có bước quy trình để khóa theo",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// ★★★ SỬA ĐƠN HÀNG: MỞ TĂNG GIẢM MẶT HÀNG · SỐ LƯỢNG · ĐƠN GIÁ · THUẾ — Sếp 16/09/2026
//
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴🔴 LUẬT Ở ĐÂY VỪA ĐỔI CHIỀU CÓ CHỦ ĐÍCH. ĐỌC HẾT KHỐI NÀY TRƯỚC KHI SỬA BẤT CỨ BÀI NÀO.
//
// **MỐC CŨ — Sếp 15/09/2026:** hàm `vuongMacSuaDongPOTheoDeNghi` CHẶN CỨNG ba việc khi sửa một
// PO lập từ đề nghị: thêm dòng không gắn đề nghị · đặt vượt khối lượng đã duyệt · thổi số lượng
// một dòng mồ côi. Tám bài kiểm của mốc đó từng đứng ở đúng chỗ này và đều đòi "một câu lý do".
//
// **MỐC MỚI — Sếp 16/09/2026,** nguyên văn chỉ đạo (ảnh màn *"Sửa đơn mua hàng DMH260002"*):
//     *"khi sửa đơn thì cho phép tăng giảm mặt hàng, số lượng, đơn giá, thuế. Hãy sửa và mở
//      thêm tính năng"*
// kèm hai chốt Sếp chốt cùng ngày:
//   · **(A)** Vượt khối lượng đã duyệt → **CẢNH BÁO NHƯNG VẪN CHO LƯU**. App phải nói rõ *đang
//     vượt bao nhiêu so với đã duyệt* và **bắt ghi lý do** mới lưu được. **Không chặn.**
//   · **(B)** Dòng mặt hàng thêm mới → **PHẢI ĐÁNH DẤU** là *"hàng thêm ngoài đề nghị"*, hiện
//     nhãn trên màn hình để Kế toán và người duyệt biết phần nào đã qua duyệt. **Không cản trở.**
//
// 👉 Nên hàm nay là `soatBangMatHangKhiSua`, trả `{ chan, vuot, batLyDo, sttThemNgoaiDeNghi }`.
//    Ai đổi ngược lại thành chặn cứng là **đi ngược chỉ đạo 16/09/2026** — cần đổi thì phải có
//    chỉ đạo mới, và phải sửa cả khối này, đừng sửa lặng lẽ một bên.
// ═══════════════════════════════════════════════════════════════════════════════════════════
//
// 🔴 CHỐT KHÔNG ĐƯỢC NỚI, VÀ ĐÓ LÀ PHẦN NẶNG NHẤT CỦA BỘ NÀY: dòng **đã có phiếu nhận hàng** thì
//    ① không xoá được, ② số lượng không hạ xuống dưới khối lượng đã nhận. Đây là chốt NGHIỆP VỤ,
//    không phải chốt duyệt — chỉ đạo 16/09 không đụng tới nó. Ai nới là app sinh ra cảnh **"nhận
//    nhiều hơn đặt"**, mà con số đã nhận chính là căn cứ thanh toán cho nhà cung cấp.
//
// ⚠️ BỘ NÀY PHẢI "KHÔNG RỖNG NGHĨA" THEO CẢ HAI CHIỀU:
//    · `chan` luôn `null` + `batLyDo` luôn `false` → các bài "phải cảnh báo/phải chặn" đỏ
//    · chặn hoặc đòi lý do vô điều kiện          → các bài "KHÔNG được chặn" đỏ (đơn đang chạy kẹt)
// ════════════════════════════════════════════════════════════════════

/** Đề nghị duyệt 100 kg thép cho dòng số 1; `conLai` = phần CHƯA lên PO nào. */
const tienDoDN = (conLai) => [
  { stt: 1, tenVatLieu: "Thép D10", donViTinh: "kg", khoiLuongChuaLenPO: conLai },
];
/** Dòng PO trỏ đúng về dòng 1 của đề nghị. */
const dongTheoDN = (sttDong, khoiLuongDat) => ({
  sttDong,
  sttDongDeNghi: 1,
  tenVatLieu: "Thép D10",
  donViTinh: "kg",
  khoiLuongDat,
});
/** Dòng PO KHÔNG trỏ về đề nghị nào — kiểu dòng mà chốt (B) sinh ra để đánh dấu. */
const dongMoCoi = (sttDong, khoiLuongDat, ten = "Máy phát điện") => ({
  sttDong,
  tenVatLieu: ten,
  donViTinh: "cái",
  khoiLuongDat,
});
/** Chưa nhận gì — tuyệt đại đa số bài dùng cái này. */
const CHUA_NHAN = new Map();
/** Đã nhận `kl` trên dòng PO số `stt`. */
const daNhan = (stt, kl) => new Map([[stt, kl]]);
/** Gọi tắt cho gọn: mặc định đơn CÓ đề nghị. */
const soat = (cu, moi, tienDo, nhan = CHUA_NHAN, coDeNghi = true) =>
  KD.soatBangMatHangKhiSua(cu, moi, tienDo, nhan, coDeNghi);

kiem(
  "(A) TĂNG số lượng vượt phần đã duyệt → CẢNH BÁO + BẮT LÝ DO, KHÔNG chặn",
  "Sếp · 16/09/2026 — *\"cảnh báo nhưng vẫn cho lưu … bắt ghi lý do\"*",
  () => {
    /* 🔴 BÀI XƯƠNG SỐNG CỦA CHỐT (A). Đề nghị đã lên PO hết 100 (`conLai = 0`), đơn này đang giữ
       đúng 100 → phần được phép đặt là 100. Sửa lên 150 là vượt 50.
       Hai thứ cùng phải đúng: KHÔNG chặn (`chan === null`) VÀ có đòi lý do (`batLyDo`). Thiếu vế
       đầu là đi ngược chỉ đạo 16/09; thiếu vế sau là mở toang kiểm soát chi tiêu của 15/09. */
    const r = soat([dongTheoDN(1, 100)], [dongTheoDN(1, 150)], tienDoDN(0));
    return {
      duoc: r.chan === null && r.batLyDo === true && r.vuot.length === 1 && r.vuot[0].vuot === 50,
      thucTe: JSON.stringify({ chan: r.chan, batLyDo: r.batLyDo, vuot: r.vuot }),
      mongDoi: "chan: null · batLyDo: true · vuot: [{ daDuyet: 100, dangDat: 150, vuot: 50 }]",
    };
  },
);

kiem(
  "(A) Câu cảnh báo phải NÓI ĐỦ BA SỐ: đã duyệt · đang đặt · vượt",
  "Sếp · 16/09/2026 — *\"nói rõ đang vượt bao nhiêu so với đã duyệt\"*",
  () => {
    /* 🔴 CHỐT (A) KHÔNG PHẢI LÀ MỘT CỜ BOOLEAN. Nửa sau của chỉ đạo là app phải NÓI RA con số —
       cảnh báo "bạn đang vượt" mà không kèm số thì người sửa không viết nổi lý do cho tử tế, và
       người duyệt đọc lại hồ sơ cũng không biết vượt bao nhiêu. Dựng câu bằng `taCacDongVuot`
       (một bản duy nhất, tầng ghi và form dùng chung) nên bài này canh luôn cả việc đó. */
    const r = soat([dongTheoDN(1, 100)], [dongTheoDN(1, 150)], tienDoDN(0));
    const cau = KD.taCacDongVuot(r.vuot);
    const duSo = cau.includes("100") && cau.includes("150") && cau.includes("50");
    return {
      duoc: duSo && cau.includes("Thép D10"),
      thucTe: `"${cau}"`,
      mongDoi: "một câu có đủ tên mặt hàng, 100 (đã duyệt), 150 (đang đặt), 50 (vượt)",
    };
  },
);

kiem(
  "(A) CẮT một dòng đề nghị thành HAI dòng PO, tổng vượt → vẫn CẢNH BÁO",
  "Sếp · 16/09/2026 (giữ nguyên quyết định thiết kế của 15/09/2026)",
  () => {
    /* 🔴 ĐỪNG "DỌN CHO GỌN" THÀNH XÉT LẺ TỪNG DÒNG: một dòng đề nghị ĐƯỢC PHÉP cắt thành nhiều
       dòng PO (giao nhiều đợt). Xét lẻ thì hai dòng mỗi dòng "vừa đủ phần còn lại" đều không
       vượt, cộng lại thành gấp đôi phần đã duyệt mà không ai được cảnh báo. */
    const r = soat([dongTheoDN(1, 100)], [dongTheoDN(1, 100), dongTheoDN(2, 20)], tienDoDN(0));
    return {
      duoc: r.batLyDo === true && r.vuot.length === 1 && r.vuot[0].vuot === 20,
      thucTe: JSON.stringify({ batLyDo: r.batLyDo, vuot: r.vuot }),
      mongDoi: "batLyDo: true · vượt 20 (gom theo sttDongDeNghi, không xét lẻ từng dòng PO)",
    };
  },
);

kiem(
  "(A) TĂNG khối lượng một dòng CŨ không gắn đề nghị → CẢNH BÁO + BẮT LÝ DO",
  "Sếp · 16/09/2026 — dòng mồ côi không có mốc duyệt nào, phình ra là phải giải trình",
  () => {
    const r = soat(
      [dongTheoDN(1, 100), dongMoCoi(2, 1)],
      [dongTheoDN(1, 100), dongMoCoi(2, 5)],
      tienDoDN(0),
    );
    return {
      duoc: r.chan === null && r.batLyDo === true && r.vuot.some((v) => v.vuot === 4),
      thucTe: JSON.stringify({ chan: r.chan, vuot: r.vuot }),
      mongDoi: "chan: null · một dòng vượt 4 (từ 1 lên 5)",
    };
  },
);

kiem(
  "(B) THÊM dòng mới không gắn đề nghị → ĐÁNH DẤU `themNgoaiDeNghi`, KHÔNG chặn",
  "Sếp · 16/09/2026 — *\"phải đánh dấu là hàng thêm ngoài đề nghị … không cản trở việc thêm\"*",
  () => {
    /* 🔴 BÀI XƯƠNG SỐNG CỦA CHỐT (B), và là chỗ luật đổi chiều rõ nhất: đúng thao tác này ngày
       15/09 bị CHẶN, nay phải ĐI QUA ĐƯỢC nhưng mang dấu vết. Mất nhãn là Kế toán và người duyệt
       nhìn dòng thêm tay y hệt hàng đã qua bước Xét duyệt báo giá. */
    const r = soat([dongTheoDN(1, 100)], [dongTheoDN(1, 100), dongMoCoi(2, 1)], tienDoDN(0));
    return {
      duoc:
        r.chan === null &&
        r.sttThemNgoaiDeNghi.length === 1 &&
        r.sttThemNgoaiDeNghi[0] === 2,
      thucTe: JSON.stringify({ chan: r.chan, sttThemNgoaiDeNghi: r.sttThemNgoaiDeNghi }),
      mongDoi: "chan: null · sttThemNgoaiDeNghi: [2]",
    };
  },
);

kiem(
  "(B) CHIỀU NGƯỢC: đơn KHÔNG gắn đề nghị → KHÔNG đóng cờ cho dòng nào",
  "Sếp · 16/09/2026 — nhãn phải có nghĩa, đóng bừa là nó thành vô nghĩa",
  () => {
    /* 🔴 ĐƠN ĐỘC LẬP CÓ **MỌI** DÒNG KHÔNG TRỎ VỀ ĐỀ NGHỊ (đúng thiết kế, xem `DongPO`). Đóng cờ
       cho chúng là mỗi dòng của mọi đơn độc lập đều đeo nhãn "hàng thêm ngoài đề nghị" — nhãn
       hiện ở khắp nơi thì không ai đọc nó nữa, và chốt (B) chết theo. */
    const r = soat(
      [dongMoCoi(1, 10)],
      [dongMoCoi(1, 10), dongMoCoi(2, 3, "Bốc xếp")],
      [],
      CHUA_NHAN,
      false,
    );
    return {
      duoc: r.sttThemNgoaiDeNghi.length === 0,
      thucTe: JSON.stringify(r.sttThemNgoaiDeNghi),
      mongDoi: "[] — đơn không gắn đề nghị thì không có khái niệm 'ngoài đề nghị'",
    };
  },
);

kiem(
  "🔴 DÒNG ĐÃ CÓ PHIẾU NHẬN HÀNG → KHÔNG XOÁ ĐƯỢC",
  "Sếp · 16/09/2026 — chốt NGHIỆP VỤ giữ nguyên khi mở tăng giảm mặt hàng",
  () => {
    /* 🔴🔴 BÀI QUAN TRỌNG NHẤT CỦA CẢ KHỐI. Chỉ đạo 16/09 mở cho BỚT mặt hàng — rất dễ hiểu
       nhầm thành "bớt được mọi dòng". Xoá một dòng đã nhận hàng là để lại phiếu nhận trỏ về một
       dòng không còn tồn tại, mà phiếu đó là căn cứ thanh toán cho nhà cung cấp.
       Ai nới cái này là app cho "nhận nhiều hơn đặt" — không màn hình nào báo, chỉ Kế toán phát
       hiện lúc đối chiếu, thường là sau khi đã trả tiền. */
    const r = soat([dongTheoDN(1, 100)], [], tienDoDN(0), daNhan(1, 40));
    return {
      duoc: typeof r.chan === "string" && r.chan !== "",
      thucTe: r.chan === null ? "chan: null (LỌT — xoá được dòng đã nhận hàng!)" : `"${r.chan.slice(0, 90)}"`,
      mongDoi: "một câu chặn",
    };
  },
);

kiem(
  "🔴 HẠ số lượng XUỐNG DƯỚI khối lượng ĐÃ NHẬN → CHẶN",
  "Sếp · 16/09/2026 — nửa còn lại của cùng một chốt nghiệp vụ",
  () => {
    /* 🔴 CHIỀU LÁCH TINH VI HƠN BÀI TRÊN: không xoá dòng, chỉ hạ số đặt xuống dưới số đã nhận —
       ra đúng cùng một cảnh "nhận nhiều hơn đặt", mà lại trông như một lần sửa số lượng bình
       thường. Đã nhận 40, hạ số đặt về 30 là đơn tự mâu thuẫn với chính phiếu nhận của nó. */
    const r = soat([dongTheoDN(1, 100)], [dongTheoDN(1, 30)], tienDoDN(0), daNhan(1, 40));
    return {
      duoc: typeof r.chan === "string" && r.chan !== "",
      thucTe: r.chan === null ? "chan: null (LỌT — đơn thành 'nhận nhiều hơn đặt')" : `"${r.chan.slice(0, 90)}"`,
      mongDoi: "một câu chặn",
    };
  },
);

kiem(
  "🔴 ĐỔI TÊN MẶT HÀNG của dòng đã có phiếu nhận → CHẶN",
  "Sếp · 16/09/2026 — phiếu nhận trỏ theo VỊ TRÍ dòng, không theo nội dung",
  () => {
    const r = soat(
      [dongTheoDN(1, 100)],
      [{ ...dongTheoDN(1, 100), tenVatLieu: "Thép D12" }],
      tienDoDN(0),
      daNhan(1, 40),
    );
    return {
      duoc: typeof r.chan === "string" && r.chan !== "",
      thucTe: r.chan === null ? "chan: null (LỌT — phiếu nhận cũ bỗng nói về mặt hàng khác)" : `"${r.chan.slice(0, 90)}"`,
      mongDoi: "một câu chặn",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: HẠ số lượng ĐÚNG BẰNG khối lượng đã nhận → KHÔNG được chặn",
  "Sếp · 16/09/2026 — chặn quá tay là đơn giao thiếu không chốt lại được",
  () => {
    /* Nhà cung cấp giao 40 rồi báo không giao nốt phần còn lại. Hạ số đặt về đúng 40 là cách
       DUY NHẤT để đóng đơn cho khớp thực tế. Chặn ở đây là đơn treo vĩnh viễn. */
    const r = soat([dongTheoDN(1, 100)], [dongTheoDN(1, 40)], tienDoDN(0), daNhan(1, 40));
    return {
      duoc: r.chan === null,
      thucTe: r.chan === null ? "chan: null (hạ về đúng phần đã nhận được)" : `"${r.chan.slice(0, 90)}"`,
      mongDoi: "chan: null",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: TĂNG số lượng của dòng đã có phiếu nhận → KHÔNG được chặn",
  "Sếp · 16/09/2026 — *\"cho phép tăng giảm … số lượng\"*, luật cũ 15/09 khoá cứng cả tăng",
  () => {
    /* 🔴 ĐÂY LÀ ĐIỀU LUẬT 15/09 CẤM VÀ SẾP VỪA MỞ. Bản cũ so `khoiLuongDat !== dongCu.khoiLuongDat`
       nên tăng cũng chặn — mà tăng số đặt trên một dòng đang giao dở là việc rất thường (chủ đầu
       tư thêm khối lượng). Vượt duyệt thì đã có chốt (A) đòi lý do lo phần kiểm soát. */
    const r = soat([dongTheoDN(1, 100)], [dongTheoDN(1, 120)], tienDoDN(20), daNhan(1, 40));
    return {
      duoc: r.chan === null && r.batLyDo === false,
      thucTe: JSON.stringify({ chan: r.chan, batLyDo: r.batLyDo }),
      mongDoi: "chan: null · batLyDo: false (còn 20 kg đã duyệt nên không vượt)",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: bảng mặt hàng KHÔNG đổi → không chặn, không đòi lý do",
  "Sếp · 16/09/2026 — cảnh báo rác là người dùng gõ lý do bừa cho xong",
  () => {
    /* 🔴 BÀI CHỐNG "ĐÒI LÝ DO VÔ ĐIỀU KIỆN". `khoiLuongChuaLenPO` do `tinhTienDoDeNghi` trả về ĐÃ
       TRỪ phần đơn này đang giữ — quên cộng ngược lại là mở màn sửa rồi bấm Lưu mà không đổi gì
       cũng bị đòi lý do vượt duyệt. Cảnh báo sai một lần thì lần sau không ai đọc nó nữa. */
    const r = soat([dongTheoDN(1, 100)], [dongTheoDN(1, 100)], tienDoDN(0));
    return {
      duoc: r.chan === null && r.batLyDo === false && r.sttThemNgoaiDeNghi.length === 0,
      thucTe: JSON.stringify(r),
      mongDoi: "chan: null · batLyDo: false · sttThemNgoaiDeNghi: []",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: tăng số lượng TRONG phần đề nghị còn lại → không đòi lý do",
  "Sếp · 16/09/2026 — còn khối lượng đã duyệt thì đặt thêm là chuyện bình thường",
  () => {
    // Đề nghị còn 20 kg chưa lên PO, đơn đang giữ 100 → nâng tới 120 vẫn nằm trong phần đã duyệt.
    const r = soat([dongTheoDN(1, 100)], [dongTheoDN(1, 120)], tienDoDN(20));
    return {
      duoc: r.batLyDo === false && r.vuot.length === 0,
      thucTe: JSON.stringify({ batLyDo: r.batLyDo, vuot: r.vuot }),
      mongDoi: "batLyDo: false · vuot: []",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: đặt ĐÚNG BẰNG phần còn lại (số lẻ) → không đòi lý do",
  "Sếp · 16/09/2026 (giữ nguyên chốt sai số dấu phẩy động của 15/09/2026)",
  () => {
    /* `0.1 + 0.2 = 0.30000000000000004` trong JavaScript. Ai bỏ `NGUONG_LECH_KHOI_LUONG` thì bài
       này đỏ, và ngoài đời người dùng nhìn hai con số y hệt nhau mà app đòi giải trình "vượt". */
    const r = soat([dongTheoDN(1, 0.1)], [dongTheoDN(1, 0.1 + 0.2)], tienDoDN(0.2));
    return {
      duoc: r.batLyDo === false,
      thucTe: JSON.stringify({ batLyDo: r.batLyDo, vuot: r.vuot }),
      mongDoi: "batLyDo: false — không đòi lý do oan vì sai số dấu phẩy động",
    };
  },
);

kiem(
  "BA Ô `code` · `maDuAn` · `ngayLapPO` VẪN KHÔNG SỬA ĐƯỢC",
  "Sếp · 15/09/2026 — chốt này KHÔNG bị chỉ đạo 16/09/2026 mở ra",
  () => {
    /* 🔴 VÌ SAO VẪN KHOÁ: số đơn hàng đã được cấp và mọi chứng từ khác trỏ về nó (phiếu nhận,
       công nợ, bản đã gửi Kho công trình); mã dự án là phần đầu của chính số đó; ngày đơn hàng
       quyết định năm của số đó. Chỉ đạo 16/09 nói về MẶT HÀNG · SỐ LƯỢNG · ĐƠN GIÁ · THUẾ, không
       nói về ba ô này — mở kèm là tự ý nới một chốt Sếp vừa chốt hôm trước.
       ⚠️ GIỚI HẠN CỦA BÀI NÀY, NÓI THẲNG: chốt thật là TypeScript (ba trường không có trong kiểu
       `ThayDoiDonHang` nên không biên dịch nổi). Ở đây chỉ đọc lại khai báo kiểu đó — yếu hơn
       một phép gọi hàm, nhưng vẫn bắt được đúng cái việc "ai đó khai thêm trường vào kiểu". */
    const nguon = readFileSync("3-du-lieu/kho-du-lieu.tsx", "utf8");
    const i = nguon.indexOf("export interface ThayDoiDonHang {");
    const khoi = i === -1 ? "" : nguon.slice(i, nguon.indexOf("\n}", i));
    const lot = ["code", "maDuAn", "ngayLapPO"].filter((t) =>
      new RegExp(`^\\s*${t}\\??:`, "m").test(khoi),
    );
    return {
      duoc: i !== -1 && lot.length === 0,
      thucTe: i === -1 ? "không tìm thấy khai báo ThayDoiDonHang" : `trường lọt vào: ${lot.join(", ") || "(không có)"}`,
      mongDoi: "ThayDoiDonHang KHÔNG khai code / maDuAn / ngayLapPO",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// ★★ BỐN CỬA GHI THIẾU KHÓA QUYỀN — Sếp 15/09/2026
//
// Bốn hàm ghi (`chotDonNhap` · `xacNhanKho` · `xacNhanTruongBP` · `datDieuKhoanCongNo`) kiểm đủ
// ĐIỀU KIỆN NGHIỆP VỤ nhưng **không hỏi một câu nào về người đang bấm**. Khóa nút không phải là
// chặn — chính dự án này viết ra nguyên tắc đó ở `themPhieuNhan` và `dinhKemPhieuGiao`.
//
// ⚠️ MỖI LUẬT KIỂM CẢ HAI CHIỀU: đủ quyền phải ĐI ĐƯỢC. Chặn vô điều kiện là cả phòng đứng hình,
//    và đó là kiểu hỏng còn khó phát hiện hơn lọt quyền vì ai cũng tưởng "app đang siết".
// ════════════════════════════════════════════════════════════════════

kiem(
  "Không có quyền lập PO → CHẶN chốt lại đơn nháp",
  "Sếp · 15/09/2026 — nút 'Chốt đơn hàng' vốn hiện theo trạng thái đơn, không hỏi quyền",
  () => {
    const r = KD.vuongMacQuyenChotDonNhap({ lapPO: false });
    return {
      duoc: typeof r === "string" && r !== "",
      thucTe: r === null ? "null (LỌT — ai mở được trang cũng chốt được đơn thật)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "một câu lý do",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: có quyền lập PO → chốt lại được đơn nháp",
  "Sếp · 15/09/2026 — nhân viên thu mua cấp 2 vẫn phải chốt được, đừng siết lên cấp 3",
  () => {
    const r = KD.vuongMacQuyenChotDonNhap({ lapPO: true });
    return { duoc: r === null, thucTe: r === null ? "null" : `"${String(r).slice(0, 90)}"`, mongDoi: "null" };
  },
);

kiem(
  "Không phải thủ kho → CHẶN xác nhận đã nhận đủ hàng",
  "Sếp · 15/09/2026 — chữ ký thủ kho là điều kiện ② để duyệt hoàn thành đơn",
  () => {
    const r = KD.vuongMacQuyenXacNhanKho({ xacNhanKho: false });
    return {
      duoc: typeof r === "string" && r !== "",
      thucTe: r === null ? "null (LỌT — ai cũng ký thay thủ kho được)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "một câu lý do",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: đúng thủ kho → xác nhận được",
  "Sếp · 15/09/2026",
  () => {
    const r = KD.vuongMacQuyenXacNhanKho({ xacNhanKho: true });
    return { duoc: r === null, thucTe: r === null ? "null" : `"${String(r).slice(0, 90)}"`, mongDoi: "null" };
  },
);

kiem(
  "Không quyền sửa điều khoản công nợ → CHẶN",
  "Sếp · 15/09/2026 — điều kiện thanh toán nằm trên CHỨNG TỪ GIÁ (nguyên tắc dữ liệu số 3)",
  () => {
    const r = KD.vuongMacQuyenSuaDieuKhoanCongNo({ lapPO: false });
    return {
      duoc: typeof r === "string" && r !== "",
      thucTe: r === null ? "null (LỌT — vai trò không xem giá vẫn sửa được điều kiện thanh toán)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "một câu lý do",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: Thu mua (lapPO) → sửa được điều khoản công nợ",
  "Sếp · 15/09/2026 — đúng cờ màn Công nợ đang dùng, không đổi sang `xemCongNo`",
  () => {
    const r = KD.vuongMacQuyenSuaDieuKhoanCongNo({ lapPO: true });
    return { duoc: r === null, thucTe: r === null ? "null" : `"${String(r).slice(0, 90)}"`, mongDoi: "null" };
  },
);

/** Đề nghị mà dòng 1 đang do `u-tm-02` phụ trách. */
const dnCoNguoiPhuTrach = {
  id: "dn1",
  items: [{ stt: 1, nguoiPhuTrachUid: "u-tm-02" }],
};

kiem(
  "Người ngoài cuộc → CHẶN duyệt hoàn thành đơn",
  "Sếp · 15/09/2026 — duyệt hoàn thành là đóng đơn và đẩy hồ sơ sang Kế toán",
  () => {
    const r = KD.vuongMacQuyenXacNhanHoanThanhDon(
      { xacNhanTruongBP: false },
      "u-la-01",
      { nguoiPhuTrachUid: "u-tm-09" },
      dnCoNguoiPhuTrach,
    );
    return {
      duoc: typeof r === "string" && r !== "",
      thucTe: r === null ? "null (LỌT — người ngoài đóng được đơn)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "một câu lý do",
    };
  },
);

kiem(
  "Vai trò KHÔNG_QUYỀN (uid rỗng) gặp đơn chưa có người phụ trách → vẫn CHẶN",
  "Sếp · 15/09/2026 — đừng để 'rỗng khớp rỗng' thành một đường vào",
  () => {
    /* 🔴 Bẫy đã tránh, bài kiểm giữ lại: `po.nguoiPhuTrachUid === uid` với cả hai cùng rỗng/undefined
       là một phép so ĐÚNG về mặt mã nguồn nhưng SAI về nghiệp vụ. Cùng bài học đã ghi ở
       `laViecCuaToi` (`2-quy-trinh/sap-xep-uu-tien.ts`). */
    const r = KD.vuongMacQuyenXacNhanHoanThanhDon(
      { xacNhanTruongBP: false },
      "",
      { nguoiPhuTrachUid: undefined },
      undefined,
    );
    return {
      duoc: typeof r === "string" && r !== "",
      thucTe: r === null ? "null (LỌT — người không có quyền nào cũng đóng được đơn mồ côi)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "một câu lý do",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC ①: Trưởng bộ phận → duyệt hoàn thành được",
  "Sếp · 15/09/2026",
  () => {
    const r = KD.vuongMacQuyenXacNhanHoanThanhDon(
      { xacNhanTruongBP: true },
      "u-tm-01",
      { nguoiPhuTrachUid: "u-tm-09" },
      undefined,
    );
    return { duoc: r === null, thucTe: r === null ? "null" : `"${String(r).slice(0, 90)}"`, mongDoi: "null" };
  },
);

kiem(
  "CHIỀU NGƯỢC ②: người phụ trách CHÍNH ĐƠN → duyệt hoàn thành được",
  "Ban lãnh đạo · 24/08/2026 — *'Mục này là do nhân viên phụ trách đơn hàng này duyệt'*",
  () => {
    const r = KD.vuongMacQuyenXacNhanHoanThanhDon(
      { xacNhanTruongBP: false },
      "u-tm-02",
      { nguoiPhuTrachUid: "u-tm-02" },
      undefined,
    );
    return { duoc: r === null, thucTe: r === null ? "null (LUẬT 24/08 CÒN)" : `"${String(r).slice(0, 90)}"`, mongDoi: "null" };
  },
);

kiem(
  "CHIỀU NGƯỢC ③: người phụ trách một DÒNG CỦA ĐỀ NGHỊ → duyệt hoàn thành được",
  "Ban lãnh đạo · 22/08/2026 — *'Bước này sẽ để nhân viên phụ trách của đề nghị này duyệt'*",
  () => {
    /* 🔴 Hai màn hình mở nút theo hai cách khác nhau (`don-hang-chi-tiet` xét theo PO,
       `de-nghi-chi-tiet` xét theo đề nghị), nên tầng ghi phải nhận HỢP của cả hai. Cắt đường này
       là nút sáng ở màn đề nghị mà bấm vào bị chặn — người dùng không thể hiểu vì sao. */
    const r = KD.vuongMacQuyenXacNhanHoanThanhDon(
      { xacNhanTruongBP: false },
      "u-tm-02",
      { nguoiPhuTrachUid: "u-tm-09" },
      dnCoNguoiPhuTrach,
    );
    return { duoc: r === null, thucTe: r === null ? "null (LUẬT 22/08 CÒN)" : `"${String(r).slice(0, 90)}"`, mongDoi: "null" };
  },
);

// ════════════════════════════════════════════════════════════════════
// ★★★ GHI NHẬN GIAO HÀNG BẰNG TAY — CHỈ HỒ SƠ PHÒNG BAN — Sếp 15/09/2026
//
// Nguyên văn: *"E mở cho nhánh phòng ban"* và *"Đúng, nhân viên thu mua tự hoàn thành, **nhưng
// phải đính kèm phiếu giao hàng**"*.
//
// Vì sao mở: hồ sơ phòng ban KẸT VĨNH VIỄN — từ 30/08/2026 phiếu nhận chỉ vào app qua cửa API do
// app kho công trình (QLK CTR) gọi sang, mà phòng ban không có kho công trình nào để gửi.
//
// 🔴 HAI ĐIỀU KIỆN SỐNG CÒN, mỗi cái một bài kiểm riêng:
//    ② hồ sơ phải là PHÒNG BAN — người đi mua tự ký nhận hàng của mình thì không còn ai đối
//      chứng; nhánh này mở được CHỈ VÌ phòng ban không có kho để đối chứng.
//    ④ phải có TỆP phiếu giao hàng — bằng chứng duy nhất còn lại khi không có thủ kho đứng giữa.
// ════════════════════════════════════════════════════════════════════

const nvThuMua = { uid: "u-tm-02", chucNang: "nhan_vien_thu_mua", capTM: 2 };
/** Quyền của một nhân viên thu mua: KHÔNG có cờ thủ kho `ghiPhieuNhanHang`. */
const quyenNVThuMua = { ghiPhieuNhanHang: false };
const dnPhongBan = { id: "dn-pb", tenCongTrinh: "", items: [{ stt: 1, nguoiPhuTrachUid: "u-tm-02" }] };
/* ⚠️ KHAI CẢ `maHopDongCDT` LẪN `tenCongTrinh` — ĐỪNG BỎ BỚT. `laHoSoPhongBan` đổi cách nhận diện
   ngày 15/09/2026 (từ `tenCongTrinh` rỗng sang `maHopDongCDT` rỗng) vì đo được App Request nhét
   tiêu đề đề nghị vào ô tên công trình. Khai đủ cả hai thì bài kiểm đo đúng CHỐT của chính nó,
   không vỡ theo mỗi lần bên kia đổi phép nhận diện. */
const dnCongTrinh = {
  id: "dn-ct",
  tenCongTrinh: "Nhà máy A",
  maHopDongCDT: "HD-2026-01",
  items: [{ stt: 1, nguoiPhuTrachUid: "u-tm-02" }],
};
const tepGiaoHang = { id: "t1", tenTep: "phieu-giao-01.pdf", kichThuoc: 1024, loai: "application/pdf" };

kiem(
  "Hồ sơ phòng ban THIẾU tệp phiếu giao hàng → CHẶN",
  "Sếp · 15/09/2026 — *'nhưng phải đính kèm phiếu giao hàng'*",
  () => {
    /* 🔴 BÀI QUAN TRỌNG NHẤT CỦA NHÁNH NÀY. Bỏ điều kiện tệp đi thì đường mới trở thành: người đi
       mua tự khai hàng đã về, không một mảnh giấy nào chứng minh — và `poDaGiaoDu` sẽ bật, rồi
       đơn hoàn thành. Đúng thứ chỉ đạo 11/08/2026 sinh ra để chặn. */
    const r = KD.vuongMacGhiNhanGiaoHangPhongBan(dnPhongBan, nvThuMua, quyenNVThuMua, undefined);
    return {
      duoc: typeof r === "string" && /phi[ếe]u giao/i.test(String(r)),
      thucTe: r === null ? "null (LỌT — ghi nhận hàng về mà không có chứng từ nào!)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "câu chặn nhắc phiếu giao hàng",
    };
  },
);

kiem(
  "Hồ sơ CÔNG TRÌNH → CHẶN, dù có đủ tệp phiếu giao",
  "Sếp · 15/09/2026 — nhánh này CHỈ mở cho phòng ban, đừng nới sang hồ sơ công trình",
  () => {
    /* 🔴 Chốt kiểm soát nặng nhất của cả đường này. Hồ sơ công trình CÓ kho thật để đối chứng, nên
       phiếu nhận vẫn phải do thủ kho ghi bên QLK CTR. */
    const r = KD.vuongMacGhiNhanGiaoHangPhongBan(dnCongTrinh, nvThuMua, quyenNVThuMua, tepGiaoHang);
    return {
      duoc: typeof r === "string" && r !== "",
      thucTe: r === null ? "null (LỌT — người đi mua tự ký nhận hàng công trình của chính mình)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "một câu lý do",
    };
  },
);

kiem(
  "PO chưa gắn đề nghị → CHẶN (thiếu thông tin thì cho quyền thấp nhất)",
  "Sếp · 15/09/2026 — không biết hồ sơ nào thì không biết có kho hay không",
  () => {
    const r = KD.vuongMacGhiNhanGiaoHangPhongBan(undefined, nvThuMua, quyenNVThuMua, tepGiaoHang);
    return {
      duoc: typeof r === "string" && r !== "",
      thucTe: r === null ? "null (LỌT — PO 'chờ đề nghị' cũng ghi tay được)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "một câu lý do",
    };
  },
);

kiem(
  "Người không liên quan tới hồ sơ phòng ban → CHẶN",
  "Sếp · 15/09/2026 — quyền theo TỪNG HỒ SƠ, không phải cứ phòng ban là ai cũng ghi được",
  () => {
    const nguoiLa = { uid: "u-kt-01", chucNang: "ke_toan", capTM: 2 };
    const r = KD.vuongMacGhiNhanGiaoHangPhongBan(dnPhongBan, nguoiLa, quyenNVThuMua, tepGiaoHang);
    return {
      duoc: typeof r === "string" && r !== "",
      thucTe: r === null ? "null (LỌT — vai trò ngoài Thu mua cũng ghi nhận giao hàng được)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "một câu lý do",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: hồ sơ phòng ban + đúng người + CÓ tệp phiếu giao → GHI ĐƯỢC",
  "Sếp · 15/09/2026 — *'E mở cho nhánh phòng ban'*",
  () => {
    /* 🔴 BÀI CHỐNG "CHẶN VÔ ĐIỀU KIỆN". Nếu bài này đỏ thì hồ sơ phòng ban lại kẹt vĩnh viễn y
       như trước 15/09 — đúng thứ Sếp vừa yêu cầu mở. */
    const r = KD.vuongMacGhiNhanGiaoHangPhongBan(dnPhongBan, nvThuMua, quyenNVThuMua, tepGiaoHang);
    return {
      duoc: r === null,
      thucTe: r === null ? "null (ghi nhận được)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "null",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: thủ kho (`ghiPhieuNhanHang`) vẫn ghi được như từ trước tới nay",
  "Ban lãnh đạo (đường cũ) — nhánh 15/09 là NỚI THÊM, không được thay thế đường sẵn có",
  () => {
    const thuKho = { uid: "u-kho-01", chucNang: "thu_kho_cong_trinh", capTM: 1 };
    const r = KD.vuongMacGhiNhanGiaoHangPhongBan(
      dnPhongBan,
      thuKho,
      { ghiPhieuNhanHang: true },
      tepGiaoHang,
    );
    return {
      duoc: r === null,
      thucTe: r === null ? "null" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "null — cờ `ghiPhieuNhanHang` là đường sẵn có, không được siết",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// ★★★ HỒ SƠ PHÒNG BAN TỰ CHỐT "ĐÃ NHẬN ĐỦ HÀNG" — Sếp 15/09/2026
//
// Nguyên văn (xem ảnh production bước ⑥): *"Đề nghị phòng ban thì ko cần nút này"* — nút **Kho
// xác nhận nhận đủ hàng** ở khối KẾT QUẢ.
//
// 🔴 VÌ SAO KHÔNG CHỈ ẨN NÚT: `xacNhanTruongBP` chặn cứng khi `po.xacNhanKho` rỗng. Hồ sơ phòng
// ban KHÔNG có thủ kho công trình nào bấm hộ, nên ẩn nút mà không thay gì thì hồ sơ đứng mãi ở
// bước ⑥ — đúng cái lỗi vừa vá sáng nay, chỉ đổi chiều. Thứ thay thế là hành động đã có thật:
// chính lần **Ghi nhận giao hàng** (đã bắt buộc kèm phiếu giao hàng) ghi luôn `po.xacNhanKho`
// mang tên người vừa bấm.
//
// 🔴 BỐN ĐIỀU KIỆN, MỖI CÁI MỘT BÀI KIỂM RIÊNG — không cái nào là thủ tục:
//    ② hồ sơ phải là PHÒNG BAN — nới sang công trình là app TỰ KÝ NHẬN HÀNG thay thủ kho, mất
//      hẳn người đối chứng. Đây là chốt nặng nhất của cả đường này.
//    · `daGiaoDu` — xác nhận sớm là căn cứ trả tiền cho hàng chưa nhận.
//    · `vuongMacTep === null` — luật Ban lãnh đạo 11/08/2026 *"mỗi lần giao phải có tệp phiếu
//      giao nhận"* vẫn chạy nguyên trên TOÀN BỘ phiếu của đơn, kể cả phiếu cũ.
//    · `daCoXacNhanKho` — đã có người xác nhận thì không ghi đè tên họ.
// ════════════════════════════════════════════════════════════════════

/* ⚠️ KHAI `maHopDongCDT` TƯỜNG MINH — ĐỪNG BỎ, VÀ ĐỪNG PHÂN LOẠI THEO `tenCongTrinh`.
   `laHoSoPhongBan` nhận diện theo `maHopDongCDT` rỗng hay không. `tenCongTrinh` vô dụng để phân
   loại vì App Request nhét TIÊU ĐỀ đề nghị vào ô đó — đo trên kho thật 15/09/2026: bản đầu dùng
   `tenCongTrinh` rỗng cho ra 0/16 hồ sơ phòng ban, nhánh không bao giờ bật.
   Nên fixture phòng ban dưới đây CỐ Ý mang chuỗi rác thật đo được: ai quay lại dùng
   `tenCongTrinh` thì bài kiểm đỏ ngay. */
const dnPBChot = {
  id: "dn-pb-chot",
  maHopDongCDT: "",
  tenCongTrinh: "Đề nghị 2. Phòng Pháp lý (HP Cons)",
  items: [{ stt: 1, nguoiPhuTrachUid: "u-tm-02" }],
};
const dnCTChot = {
  id: "dn-ct-chot",
  maHopDongCDT: "HD-2026-01",
  tenCongTrinh: "Nhà máy A",
  items: [{ stt: 1, nguoiPhuTrachUid: "u-tm-02" }],
};
/** Câu vướng mẫu của `vuongMacXacNhanKho` — chỉ cần KHÁC `null` là đủ để luật 11/08 phải chặn. */
const vuongTepMau = "Phiếu giao lần 1 chưa có tệp phiếu giao nhận đính kèm.";

kiem(
  "CHIỀU NGƯỢC: hồ sơ PHÒNG BAN + giao đủ + không vướng tệp + chưa ai xác nhận → TỰ CHỐT",
  'Sếp · 15/09/2026 — *"Đề nghị phòng ban thì ko cần nút này"*',
  () => {
    /* 🔴 BÀI CHỐNG "CHẶN VÔ ĐIỀU KIỆN". Nếu bài này đỏ thì hàm đã thành `return false` vô nghĩa,
       và hồ sơ phòng ban lại kẹt vĩnh viễn ở bước ⑥ — đúng thứ Sếp vừa yêu cầu gỡ. */
    const r = KD.tuChotXacNhanKhoPhongBan(dnPBChot, true, null, false);
    return {
      duoc: r === true,
      thucTe: String(r),
      mongDoi: "true — không tự chốt thì hồ sơ phòng ban kẹt vĩnh viễn ở bước ⑥",
    };
  },
);

kiem(
  "Hồ sơ CÔNG TRÌNH → KHÔNG tự chốt, dù đủ mọi điều kiện còn lại",
  "Sếp · 15/09/2026 — nhánh này CHỈ cho phòng ban; công trình có thủ kho thật để đối chứng",
  () => {
    /* 🔴🔴 CHỐT NẶNG NHẤT CỦA CẢ ĐƯỜNG NÀY. Trả `true` ở đây nghĩa là app TỰ KÝ NHẬN HÀNG thay
       thủ kho công trình: `po.xacNhanKho` có tên người, đơn sang `cho_xac_nhan_hoan_thanh`, rồi
       hoàn thành — mà không một thủ kho nào nhìn thấy lô hàng. Mất hẳn người đối chứng, đúng thứ
       app bỏ đường ghi tay ngày 30/08/2026 để chặn. */
    const r = KD.tuChotXacNhanKhoPhongBan(dnCTChot, true, null, false);
    return {
      duoc: r === false,
      thucTe: r === true ? "true (LỌT — app tự ký nhận hàng thay thủ kho công trình!)" : String(r),
      mongDoi: "false",
    };
  },
);

kiem(
  "CHƯA giao đủ → KHÔNG tự chốt",
  "Sếp · 15/09/2026 — giữ nguyên điều kiện mà cái nút vừa bị ẩn đang gác",
  () => {
    /* Xác nhận "đã nhận đủ hàng" khi hàng chưa về đủ là dựng sẵn căn cứ trả tiền cho hàng chưa
       nhận. Chuyển NGƯỜI BẤM, không hạ hàng rào. */
    const r = KD.tuChotXacNhanKhoPhongBan(dnPBChot, false, null, false);
    return {
      duoc: r === false,
      thucTe: r === true ? "true (LỌT — chốt 'đã nhận đủ' khi hàng chưa về đủ!)" : String(r),
      mongDoi: "false",
    };
  },
);

kiem(
  "Còn phiếu THIẾU tệp phiếu giao nhận → KHÔNG tự chốt",
  "Ban lãnh đạo · 11/08/2026 — *'mỗi lần giao phải có tệp phiếu giao nhận'*, Sếp giữ nguyên 15/09/2026",
  () => {
    /* 🔴 Luật 11/08 chạy trên TOÀN BỘ phiếu của đơn, kể cả phiếu cũ ghi trước hôm nay. Bỏ điều
       kiện này là đơn tự chốt "đã nhận đủ" trong khi hồ sơ còn thiếu chứng từ giao nhận — đúng
       thứ chỉ đạo 11/08 sinh ra để chặn, chỉ là lách qua cửa khác. */
    const r = KD.tuChotXacNhanKhoPhongBan(dnPBChot, true, vuongTepMau, false);
    return {
      duoc: r === false,
      thucTe: r === true ? "true (LỌT — tự chốt khi hồ sơ còn thiếu phiếu giao nhận!)" : String(r),
      mongDoi: "false",
    };
  },
);

kiem(
  "ĐÃ có `po.xacNhanKho` → KHÔNG ghi đè tên người đã xác nhận",
  "Sếp · 15/09/2026 — dấu vết người xác nhận là chứng từ, không được viết chồng",
  () => {
    const r = KD.tuChotXacNhanKhoPhongBan(dnPBChot, true, null, true);
    return {
      duoc: r === false,
      thucTe: r === true ? "true (LỌT — ghi đè tên người đã xác nhận nhận hàng!)" : String(r),
      mongDoi: "false",
    };
  },
);

kiem(
  "PO chưa gắn đề nghị (`undefined`) → KHÔNG tự chốt",
  "CLAUDE.md §3.6c — thiếu thông tin thì cho quyền THẤP NHẤT, không đoán",
  () => {
    /* Không biết hồ sơ nào thì không biết hồ sơ đó có kho công trình hay không. Đoán "chắc là
       phòng ban" chính là cách chốt ② bị nới im lặng. */
    const r = KD.tuChotXacNhanKhoPhongBan(undefined, true, null, false);
    return {
      duoc: r === false,
      thucTe: r === true ? "true (LỌT — PO 'chờ đề nghị' cũng tự chốt đã nhận đủ hàng)" : String(r),
      mongDoi: "false",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// ★ NHẬT KÝ SỬA ĐƠN PHẢI NÓI ĐƯỢC CÁI GÌ ĐÃ ĐỔI — Sếp 15/09/2026
//
// Câu cũ là đúng bốn chữ *"sửa bảng mặt hàng"* — không dòng nào, không từ bao nhiêu sang bao
// nhiêu. Nhật ký sinh ra để truy vết mà không truy được gì.
//
// 🔴 KÈM MỘT LUẬT BẢO MẬT: con số ĐƠN GIÁ không được vào nhật ký đề nghị (khối "Lịch sử" hiện cho
//    MỌI vai trò, kể cả người không được xem giá) — cùng lý do đã ghi ở `lichSuDieuKhoanCongNo`.
// ════════════════════════════════════════════════════════════════════

kiem(
  "Đổi số lượng một dòng → nhật ký ghi RÕ dòng nào, từ bao nhiêu sang bao nhiêu",
  "Sếp · 15/09/2026 — không còn chấp nhận bốn chữ 'sửa bảng mặt hàng'",
  () => {
    const moc = KD.mocSuaBangMatHang([dongTheoDN(1, 100)], [dongTheoDN(1, 120)]);
    const cau = moc.join(" · ");
    return {
      duoc: moc.length === 1 && cau.includes("100") && cau.includes("120"),
      thucTe: `[${cau}]`,
      mongDoi: "một mốc có cả số cũ và số mới",
    };
  },
);

kiem(
  "Bảng mặt hàng KHÔNG đổi → không đẻ mốc nhật ký nào",
  "phiên nghiệp vụ · 31/08/2026 — luật cũ, hộp sửa gửi lại NGUYÊN state mỗi lần lưu",
  () => {
    /* Chiều bảo vệ luật cũ: mất phép so nội dung thì MỌI lần sửa (kể cả chỉ đổi số điện thoại) đều
       báo "sửa bảng mặt hàng", và sổ lịch sử thành vô dụng vì toàn dòng sai. */
    const moc = KD.mocSuaBangMatHang([dongTheoDN(1, 100)], [dongTheoDN(1, 100)]);
    return { duoc: moc.length === 0, thucTe: `[${moc.join(" · ")}]`, mongDoi: "mảng rỗng" };
  },
);

kiem(
  "CON SỐ đơn giá KHÔNG được lọt vào nhật ký đề nghị",
  "Sếp · 15/09/2026 + nguyên tắc dữ liệu số 3 — khối Lịch sử hiện cho cả vai trò không xem giá",
  () => {
    /* 🔴 BÀI GIỮ MỘT LUẬT BẢO MẬT, đừng "dọn cho gọn" bằng cách nhập hai sổ làm một. `chung` chảy
       vào `ghiNhatKyDonHang` → lịch sử ĐỀ NGHỊ (mọi vai trò đọc được); `rieng` chảy vào
       `GiaDonDatHang.lichSuDieuKhoanCongNo` → sổ của chính chứng từ giá. */
    const kq = KD.mocSuaDonGia(
      [{ sttDong: 1, donGia: 1200000 }],
      [{ sttDong: 1, donGia: 1250000 }],
      () => "Thép D10",
    );
    const chung = kq.chung.join(" · ");
    const rieng = kq.rieng.join(" · ");
    const loGia = /1[.,]?200[.,]?000|1[.,]?250[.,]?000/.test(chung);
    return {
      duoc: !loGia && kq.chung.length === 1 && /1[.,]250[.,]000/.test(rieng),
      thucTe: loGia ? `LỘ GIÁ ở sổ chung: [${chung}]` : `chung=[${chung}] · riêng=[${rieng}]`,
      mongDoi: "sổ chung chỉ nói tăng/giảm · sổ chứng từ giá mới có con số",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: đơn giá có đổi thì sổ CHUNG vẫn phải nói ra là đã đổi",
  "Sếp · 15/09/2026 — giấu số khác với giấu việc",
  () => {
    /* Gộp hết về sổ riêng cho "an toàn" thì người không được xem giá **không hề biết** đơn giá vừa
       bị sửa — mất luôn khả năng đặt câu hỏi. Giấu con số, không giấu sự việc. */
    const kq = KD.mocSuaDonGia(
      [{ sttDong: 1, donGia: 1200000 }],
      [{ sttDong: 1, donGia: 1250000 }],
      () => "Thép D10",
    );
    return {
      duoc: kq.chung.length === 1 && /t[ăa]ng/i.test(kq.chung[0]),
      thucTe: `[${kq.chung.join(" · ")}]`,
      mongDoi: "một mốc nói rõ dòng nào và tăng hay giảm",
    };
  },
);

kiem(
  "`suaDonHang` phải phân biệt được 'không có gì đổi' với 'đã ghi xong'",
  "Sếp · 15/09/2026 — `null` mang hai nghĩa thì giao diện báo xanh cho lần ghi không xảy ra",
  () => {
    /* Hằng này là giao kèo GIỮA hai tệp: `3-du-lieu/kho-du-lieu.tsx` và
       `1-giao-dien/thanh-phan-nghiep-vu/hop-sua-don-hang.tsx`. Đổi giá trị của nó mà không sửa nơi
       đọc thì giao diện lại báo xanh như cũ — im lặng, không lỗi nào báo. */
    const v = KD.MA_KHONG_CO_THAY_DOI;
    return {
      duoc: v === "KHONG_CO_THAY_DOI",
      thucTe: v === undefined ? "undefined (hằng đã bị xoá!)" : `"${String(v)}"`,
      mongDoi: '"KHONG_CO_THAY_DOI"',
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// NHÁNH HỒ SƠ PHÒNG BAN — Sếp 14/09/2026, chốt lại 15/09/2026
//
// Nguyên văn: *"Các đề xuất từ phòng ban thì sẽ đi nhánh riêng, không cần lấy dữ liệu từ app kho
// công trình mà nhân viên mua hàng sẽ là người bấm hoàn thành và đính kèm phiếu giao hàng."*
// Và 15/09: *"E mở cho nhánh phòng ban"* · *"nhân viên thu mua tự hoàn thành, NHƯNG phải đính kèm
// phiếu giao hàng"*.
//
// 🔴 BÀI QUAN TRỌNG NHẤT LÀ BÀI "KHONG CO PHIEU -> VAN CHAN". Ai nới thành "phòng ban thì hoàn
//    thành được luôn" thì mọi bài khác vẫn xanh, chỉ bài đó bắt được.
// 🔴 VÀ BÀI "CONG TRINH CHUA NHAN DU -> VAN CHAN": chứng minh nhánh mới KHÔNG rò sang hồ sơ công
//    trình. Rò là mất chốt đối chiếu khối lượng của toàn bộ app.
// ⚠️ MỌI FIXTURE PHẢI KHAI `tenCongTrinh` TƯỜNG MINH. `laHoSoPhongBan` nhận diện bằng trường này
//    rỗng, nên quên khai là hồ sơ công trình bị xếp nhầm sang phòng ban và bài kiểm đo sai thứ.
// ════════════════════════════════════════════════════════════════════

/** Hồ sơ đã xong mọi điều kiện khác của bước ⑧; chỉ còn chuyện khối lượng / phiếu giao hàng. */
const hoSoDongPB = ({ tenCongTrinh, nhanPhieuGiao, coTepHopDong = true }) => ({
  id: "x",
  tenCongTrinh,
  /* 🔴 `maHopDongCDT` MỚI LÀ THỨ `laHoSoPhongBan` ĐỌC (đổi 15/09/2026 — App Request nhét tiêu đề
     đề nghị vào ô tên công trình nên ô đó không bao giờ rỗng, đo ra 0/16 hồ sơ là phòng ban).
     Ở đây suy từ `tenCongTrinh` để mọi lời gọi sẵn có không phải sửa: có tên công trình thì coi
     như hồ sơ công trình và gắn luôn mã hợp đồng; để rỗng thì là hồ sơ phòng ban. */
  ...((tenCongTrinh ?? "").trim() ? { maHopDongCDT: "HD-2026-01" } : {}),
  items: [{ stt: 1 }],
  tepGiaiDoan: {
    ...(coTepHopDong
      ? { lap_don_mua_hang: [{ id: "hd1", ten: "hd.pdf", ghiChu: "Hợp đồng" }] }
      : {}),
    ho_so_thanh_toan: [{ id: "v1", ten: "vat.pdf", ghiChu: "Hóa đơn VAT" }],
    ...(nhanPhieuGiao
      ? { nhan_hang: [{ id: "pg1", ten: "phieu.jpg", ghiChu: nhanPhieuGiao }] }
      : {}),
  },
  lyDoThieuChungTu: {},
  congViecDaXong: [{ maCongViec: "unc_xong", thoiDiem: "2026-09-15T01:00:00.000Z" }],
});
/* Hàng CHƯA về đủ — trạng thái thật của MỌI hồ sơ phòng ban (không kho nào gửi phiếu sang). */
const tienDoChuaVeDu = [{ khoiLuongChuaLenPO: 0, khoiLuongConLai: 5 }];

kiem(
  "PHONG BAN co phieu giao hang -> HOAN THANH DUOC (het ket vinh vien)",
  'Sếp · 15/09/2026 — *"E mở cho nhánh phòng ban"*',
  () => {
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.vuongMacHoanThanhQuyTrinh(
      hoSoDongPB({ tenCongTrinh: "", nhanPhieuGiao: "Phiếu giao hàng" }),
      tienDoChuaVeDu,
    );
    return {
      duoc: r === null,
      thucTe: r === null ? "null (dong duoc ho so)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "null",
    };
  },
);

kiem(
  "PHONG BAN THIEU phieu giao hang -> VAN CHAN (doi nguon bang chung, KHONG bo bang chung)",
  'Sếp · 15/09/2026 — *"nhân viên thu mua tự hoàn thành, NHƯNG phải đính kèm phiếu giao hàng"*',
  () => {
    /* 🔴 BÀI QUAN TRỌNG NHẤT. Ai nới trắng thành "phòng ban thì hoàn thành được luôn" thì mọi bài
       khác vẫn xanh, chỉ bài này bắt được. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.vuongMacHoanThanhQuyTrinh(hoSoDongPB({ tenCongTrinh: "" }), tienDoChuaVeDu);
    return {
      duoc: typeof r === "string" && /phiếu giao hàng/i.test(r),
      thucTe: r === null ? "null (LOT — luat 15/09 da mat!)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "cau chan nhac Phieu giao hang",
    };
  },
);

kiem(
  "PHONG BAN co tep KHAC nhan o buoc ⑥ -> VAN CHAN",
  "Sếp · 15/09/2026 — chống lấy một tệp bất kỳ làm bằng chứng giao hàng",
  () => {
    /* Khu đính kèm bước ⑥ vốn để cho CO/CQ, biên bản nghiệm thu. Nếu tệp nào cũng tính thì luật
       này chỉ là một cái nút "bấm để qua". */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.vuongMacHoanThanhQuyTrinh(
      hoSoDongPB({ tenCongTrinh: "", nhanPhieuGiao: "Biên bản nghiệm thu" }),
      tienDoChuaVeDu,
    );
    return {
      duoc: typeof r === "string" && /phiếu giao hàng/i.test(r),
      thucTe: r === null ? "null (LOT — tep nao cung tinh!)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "cau chan nhac Phieu giao hang",
    };
  },
);

kiem(
  "PHONG BAN nhan co danh so '(2)' -> VAN TINH (moi lan giao mot to phieu)",
  "Sếp · 15/09/2026 — chống chặn quá tay, hồ sơ đủ phiếu mà vẫn kẹt",
  () => {
    /* `OChungTuBatBuoc` đặt tên bản thứ hai là "Phiếu giao hàng (2)". So bằng nhau thay vì so tiền
       tố thì gỡ mất bản đầu là hồ sơ đủ phiếu mà app vẫn báo thiếu. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.vuongMacHoanThanhQuyTrinh(
      hoSoDongPB({ tenCongTrinh: "  ", nhanPhieuGiao: "Phiếu giao hàng (2)" }),
      tienDoChuaVeDu,
    );
    return {
      duoc: r === null,
      thucTe: r === null ? "null (dong duoc ho so)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "null",
    };
  },
);

kiem(
  "CONG TRINH chua nhan du -> VAN CHAN y nhu cu, du CO tep phieu giao hang",
  "Sếp · 15/09/2026 — chứng minh nhánh phòng ban KHÔNG rò sang hồ sơ công trình",
  () => {
    /* 🔴 RÒ SANG ĐÂY LÀ MẤT CHỐT ĐỐI CHIẾU KHỐI LƯỢNG CỦA TOÀN BỘ APP: ai cũng có thể đính một
       tấm ảnh vào bước ⑥ rồi đóng hồ sơ trong khi hàng chưa về. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.vuongMacHoanThanhQuyTrinh(
      hoSoDongPB({ tenCongTrinh: "CT Sunrise", nhanPhieuGiao: "Phiếu giao hàng" }),
      tienDoChuaVeDu,
    );
    return {
      duoc: typeof r === "string" && /chưa nhận đủ hàng/i.test(r),
      thucTe:
        r === null ? "null (LOT — nhanh phong ban da ro sang cong trinh!)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "cau chan nhac chua nhan du hang",
    };
  },
);

kiem(
  "CONG TRINH nhan du + du chung tu -> null (chieu nguoc lai)",
  "Sếp · 15/09/2026 — chống chặn quá tay ở nhánh công trình",
  () => {
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.vuongMacHoanThanhQuyTrinh(hoSoDongPB({ tenCongTrinh: "CT Sunrise" }), [
      { khoiLuongChuaLenPO: 0, khoiLuongConLai: 0 },
    ]);
    return {
      duoc: r === null,
      thucTe: r === null ? "null (dong duoc ho so)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "null",
    };
  },
);

kiem(
  "PHONG BAN thieu hop dong -> VAN CHAN hop dong (luat Sep 14/09 con nguyen)",
  'Sếp · 14/09/2026 — *"2 loại này ĐỀU phải đính kèm hợp đồng"*, phòng ban không được miễn',
  () => {
    /* Nhánh phòng ban chỉ đổi CHỖ điều kiện khối lượng. Ba điều kiện còn lại (chưa lên đơn · hợp
       đồng · hóa đơn VAT) áp y hệt cho cả hai loại hồ sơ.
       📌 Trước 15/09/2026 còn điều kiện thứ tư "tích UNC" — Sếp đã bỏ (*"bỏ và thiết lập lại luật
       mới"*), xem khối bài kiểm "BỎ Ô TÍCH ỦY NHIỆM CHI" phía trên. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.vuongMacHoanThanhQuyTrinh(
      hoSoDongPB({ tenCongTrinh: "", nhanPhieuGiao: "Phiếu giao hàng", coTepHopDong: false }),
      tienDoChuaVeDu,
    );
    return {
      duoc: typeof r === "string" && /h[ợo]p đ[ồo]ng/i.test(r),
      thucTe: r === null ? "null (LOT — phong ban da duoc mien hop dong!)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "cau chan nhac Hop dong",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// NHẬN DIỆN HỒ SƠ PHÒNG BAN — Sếp · 15/09/2026
//
// 🔴 ĐÂY LÀ CHỖ ĐÃ SAI MỘT LẦN, NÊN MỚI PHẢI CÓ BÀI KIỂM. Bản đầu nhận diện bằng `tenCongTrinh`
// rỗng; đo trên kho đang chạy (`hpcons-portal`, 16 đề nghị) ra **0/16** — vì App Request nhét
// TIÊU ĐỀ ĐỀ NGHỊ vào ô tên công trình (`000000089` → "Đề nghị 2. Phòng Pháp lý (HP Cons)").
// Nhánh phòng ban làm xong mà công tắc không bật được, Sếp phải tự phát hiện trên bản thật.
//
// ✅ Nay hai tầng: ① ô "Lựa chọn đề nghị" của App Request (nguồn chính thức) → ② `maHopDongCDT`
// rỗng (dự phòng cho hồ sơ cũ — đã đối chiếu 16/16 với nguồn chính thức, lệch 0).
// ════════════════════════════════════════════════════════════════════

kiem(
  "CO loai=phong_ban -> LA HO SO PHONG BAN (du CO maHopDongCDT)",
  'Sếp · 15/09/2026 — ô "Lựa chọn đề nghị" là nguồn chính thức, thắng phép suy đoán',
  () => {
    const r = HS.laHoSoPhongBan({ loaiHoSo: "phong_ban", maHopDongCDT: "HD-2026-01" });
    return { duoc: r === true, thucTe: String(r), mongDoi: "true" };
  },
);

kiem(
  "CO loai=cong_trinh -> KHONG phai phong ban (du maHopDongCDT RONG)",
  "Sếp · 15/09/2026 — nguồn chính thức thắng phép suy đoán, cả chiều ngược lại",
  () => {
    const r = HS.laHoSoPhongBan({ loaiHoSo: "cong_trinh", maHopDongCDT: "" });
    return { duoc: r === false, thucTe: String(r), mongDoi: "false" };
  },
);

kiem(
  "KHONG co loai + maHopDongCDT RONG -> VAN nhan la phong ban (tang du phong)",
  "Sếp · 15/09/2026 — hồ sơ cũ KHÔNG BAO GIỜ có trường mới; bỏ tầng này là 000000089/090/091 kẹt lại",
  () => {
    /* 🔴 Cố ý khai `tenCongTrinh` CÓ GIÁ TRỊ và là rác thật đo được từ kho: nếu ai quay lại nhận
       diện bằng `tenCongTrinh` rỗng thì bài này đỏ ngay, đúng lỗi đã xảy ra hôm nay. */
    const r = HS.laHoSoPhongBan({
      maHopDongCDT: "",
      tenCongTrinh: "Đề nghị 2. Phòng Pháp lý (HP Cons)",
    });
    return { duoc: r === true, thucTe: String(r), mongDoi: "true" };
  },
);

kiem(
  "KHONG co loai + CO maHopDongCDT -> ho so cong trinh (khong ro sang)",
  "Sếp · 15/09/2026 — nhánh phòng ban không được rò sang hồ sơ công trình",
  () => {
    const r = HS.laHoSoPhongBan({ maHopDongCDT: "HD-2026-01", tenCongTrinh: "Nha xuong Howell" });
    return { duoc: r === false, thucTe: String(r), mongDoi: "false" };
  },
);

kiem(
  "CHUAN HOA nhan App Request — 2 cach viet hoa, khoang trang thua, thieu dau",
  'Sếp · 15/09/2026 — đo được cả "Đề nghị công trình" lẫn "Đề nghị Công trình" trong dữ liệu thật',
  () => {
    const ca = [
      ["Đề nghị công trình", "cong_trinh"],
      ["Đề nghị Công trình", "cong_trinh"],
      ["  Đề nghị   phòng ban  ", "phong_ban"],
      ["DE NGHI PHONG BAN", "phong_ban"],
      ["cong_trinh", "cong_trinh"],
      ["phong_ban", "phong_ban"],
    ];
    const sai = ca.filter(([vao, ra]) => AR.chuanHoaLoaiHoSo(vao) !== ra);
    return {
      duoc: sai.length === 0,
      thucTe: sai.length === 0 ? "nhan dung ca 6 cach viet" : `sai: ${JSON.stringify(sai)}`,
      mongDoi: "nhan dung ca 6 cach viet",
    };
  },
);

kiem(
  "CHUAN HOA khong doan bua — rong / nhan la / nhan chua CA HAI -> undefined",
  "Sếp · 15/09/2026 — thiếu thông tin thì để trống, không suy diễn (rơi về tầng dự phòng)",
  () => {
    const v = ["", undefined, null, "Đề nghị mua sắm", "Đề nghị công trình và phòng ban"];
    const sai = v.filter((x) => AR.chuanHoaLoaiHoSo(x) !== undefined);
    return {
      duoc: sai.length === 0,
      thucTe: sai.length === 0 ? "undefined het" : `doan bua o: ${JSON.stringify(sai)}`,
      mongDoi: "undefined het",
    };
  },
);

kiem(
  "DOC LOAI TU APP REQUEST — tra theo `options`, KHONG tra theo ma truong",
  "Sếp · 15/09/2026 — mã trường là UUID đổi theo đời biểu mẫu (đo được 3 mã khác nhau)",
  () => {
    const O = (id) => ({ id, options: ["Đề nghị công trình", "Đề nghị phòng ban"] });
    const ca = [
      [
        {
          fieldsSnapshot: [{ id: "khac", options: ["Vật tư"] }, O("e08076bf")],
          values: { e08076bf: "Đề nghị phòng ban" },
        },
        "phong_ban",
      ],
      [{ fieldsSnapshot: [O("12cb9ca6")], values: { "12cb9ca6": "Đề nghị Công trình" } }, "cong_trinh"],
      [{ fieldsSnapshot: [O("79590aee")], values: { "79590aee": "  Đề nghị   công trình " } }, "cong_trinh"],
    ];
    const sai = ca.filter(([doc, ra]) => AR.layLoaiTuHoSoAppRequest(doc) !== ra);
    return {
      duoc: sai.length === 0,
      thucTe: sai.length === 0 ? "doc dung ca 3 doi bieu mau" : `sai ${sai.length}/3`,
      mongDoi: "doc dung ca 3 doi bieu mau",
    };
  },
);

kiem(
  "DOC LOAI TU APP REQUEST — khong chac thi tra undefined, KHONG nem loi",
  "Sếp · 15/09/2026 — cửa tiếp nhận đề nghị là đường sống, không được vỡ vì dữ liệu lạ",
  () => {
    const v = [
      { fieldsSnapshot: [{ id: "x", options: ["Đề nghị công trình", "Đề nghị phòng ban"] }], values: {} },
      { fieldsSnapshot: [{ id: "khac", options: ["Vật tư", "Dịch vụ"] }], values: { khac: "Vật tư" } },
      {},
      undefined,
      { fieldsSnapshot: "rac", values: 5 },
    ];
    const sai = v.filter((x) => AR.layLoaiTuHoSoAppRequest(x) !== undefined);
    return {
      duoc: sai.length === 0,
      thucTe: sai.length === 0 ? "undefined het, khong nem loi" : `doan bua ${sai.length} ca`,
      mongDoi: "undefined het",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA SẾP — 15/09/2026: LÀM SẠCH BẢN NHÂN BẢN
//
// Nguyên văn: *"gọi thêm agent xử lý việc làm sạch thông tin khi nhân
// bản quy trình đối với các quy trình đã có sẵn file đính kèm hoặc ghi
// chú, a cần làm sạch tất cả khi trả về bước 2"*.
//
// 🔴 CHIỀU NGHỊCH QUAN TRỌNG HƠN CHIỀU THUẬN. "Làm sạch" quá tay là bản
// copy mất `deNghiGocId` (phiếu gốc đóng được trong khi bản con còn dở),
// mất `sttDongGoc` (phiếu gốc hết làm mờ dòng đã nhân bản ⇒ mua hai lần),
// hoặc mất `loaiHoSo` (hồ sơ đi nhầm nhánh phòng ban / công trình).
// ════════════════════════════════════════════════════════════════════

/** Phiếu gốc "đã đi xa": đủ tệp ở nhiều bước, bình luận, lý do thiếu chứng từ, việc đã tích. */
function phieuGocDaDiXa() {
  const tep = (id) => ({
    id,
    tenTep: `${id}.pdf`,
    kieuMime: "application/pdf",
    kichThuoc: 1,
    nguoiTaiUid: "u1",
    nguoiTaiTen: "Nguyễn Văn A",
    thoiDiem: "2026-09-01T08:00:00.000Z",
  });
  return {
    id: "pr-goc",
    code: "260001-HPCS-PR-001",
    maDuAn: "260001-HPCS",
    maHopDongCDT: "2026/HDXD",
    tenCongTrinh: "DỰ ÁN TEST",
    tieuDe: "DỰ ÁN TEST",
    phongBanNguon: "thi_cong",
    nguoiDeNghiUid: "u9",
    nguoiDeNghiTen: "Nguyễn Văn B",
    ngayDeNghi: "2026-08-01",
    ngayDuyet: "2026-08-02",
    ngayCanHang: "2026-10-01",
    mucDoUuTien: "binh_thuong",
    trangThai: "dang_thuc_hien",
    loaiHoSo: "phong_ban",
    maDeXuatAppRequest: "000000086",
    idHoSoAppRequest: "fSH4lYLX63FaV4B1pcY1",
    luuTru: true,
    items: [
      { stt: 1, tenVatLieu: "Thép D10", donViTinh: "kg", khoiLuongDeNghi: 10, nguoiPhuTrachUid: "u1", nguoiPhuTrachTen: "Nguyễn Văn A" },
      { stt: 2, tenVatLieu: "Xi măng", donViTinh: "bao", khoiLuongDeNghi: 20, nguoiPhuTrachUid: "u1", nguoiPhuTrachTen: "Nguyễn Văn A" },
      { stt: 3, tenVatLieu: "Cát", donViTinh: "m3", khoiLuongDeNghi: 5 },
    ],
    lichSu: [{ thoiDiem: "2026-08-02T01:00:00.000Z", nguoiThucHien: "Nguyễn Văn B", hanhDong: "Tạo đề nghị" }],
    nguoiTheoDoi: [{ uid: "u9", ten: "Nguyễn Văn B", chucDanh: "NV", nguoiThemTen: "app", thoiDiemThem: "2026-08-02T01:00:00.000Z" }],
    taiLieu: [tep("dau-vao-1")],
    taiLieuAppRequest: [{ ten: "mau-chi-tiet.xlsx", duongDan: "requests/x/mau-chi-tiet.xlsx" }],
    tepGiaiDoan: {
      yeu_cau_bao_gia: [tep("bao-gia-ncc")],
      dat_hang: [tep("hop-dong-da-ky")],
      ho_so_thanh_toan: [tep("hoa-don-vat")],
    },
    lyDoThieuChungTu: { thieu_hop_dong: "NCC hẹn gửi bản ký tuần sau" },
    binhLuan: [{ id: "bl1", nguoiVietUid: "u1", nguoiVietTen: "Nguyễn Văn A", thoiDiem: "2026-09-01T08:00:00.000Z", noiDung: "Đã gọi NCC" }],
    congViecDaXong: [
      { maCongViec: "checkin_ton_kho", giaiDoan: "tiep_nhan", nguoiXongTen: "Nguyễn Văn A", thoiDiem: "2026-08-03T01:00:00.000Z" },
      { maCongViec: "unc_xong", giaiDoan: "ho_so_thanh_toan", nguoiXongTen: "Nguyễn Văn A", thoiDiem: "2026-09-10T01:00:00.000Z" },
    ],
    lyDoThatBai: "NCC bỏ cuộc",
  };
}

const nhanBanThu = (goc, sttGiuLai, phieuGocDau) =>
  NB.dungBanNhanBan({
    goc,
    phieuGocDau: phieuGocDau ?? goc,
    idMoi: "pr-copy",
    maMoi: `${(phieuGocDau ?? goc).code} (copy)`,
    nguoi: { uid: "u2", ten: "Trần Thị C" },
    sttGiuLai,
    ngay: "2026-09-15",
    thoiDiem: "2026-09-15T03:00:00.000Z",
  });

kiem(
  "NHAN BAN — ban copy KHONG mang theo tep tung buoc, binh luan, ly do thieu chung tu, ly do that bai",
  'Sếp · 15/09/2026 — "a cần làm sạch tất cả khi trả về bước 2"',
  () => {
    const ban = nhanBanThu(phieuGocDaDiXa());
    const con = [
      ban.tepGiaiDoan ? "tepGiaiDoan" : "",
      ban.binhLuan ? "binhLuan" : "",
      ban.lyDoThieuChungTu ? "lyDoThieuChungTu" : "",
      ban.lyDoThatBai ? "lyDoThatBai" : "",
      ban.luuTru ? "luuTru" : "",
      (ban.congViecDaXong ?? []).some((v) => v.giaiDoan === "ho_so_thanh_toan")
        ? "congViecDaXong(buoc sau)"
        : "",
      (ban.lichSu ?? []).length !== 1 ? `lichSu=${(ban.lichSu ?? []).length} dong` : "",
    ].filter(Boolean);
    return {
      duoc: con.length === 0,
      thucTe: con.length === 0 ? "ban copy sach" : `con mang theo: ${con.join(", ")}`,
      mongDoi: "ban copy sach, chi con 1 dong nhat ky 'Nhan ban tu ...'",
    };
  },
);

kiem(
  "NHAN BAN — CHIEU NGHICH: lam sach qua tay lam mat khoa noi ban con voi phieu goc",
  "Sếp · 15/09/2026 — mất `deNghiGocId` là phiếu gốc đóng được trong khi bản con còn dở; mất `sttDongGoc` là phiếu gốc hết làm mờ dòng đã nhân bản ⇒ mua hai lần",
  () => {
    const goc = phieuGocDaDiXa();
    const ban = nhanBanThu(goc, [2, 3]);
    const thieu = [
      ban.deNghiGocId === "pr-goc" ? "" : "deNghiGocId",
      ban.maDeNghiGoc === goc.code ? "" : "maDeNghiGoc",
      ban.loaiHoSo === "phong_ban" ? "" : "loaiHoSo",
      ban.items.length === 2 ? "" : "so dong giu lai",
      ban.items[0]?.sttDongGoc === 2 && ban.items[1]?.sttDongGoc === 3 ? "" : "sttDongGoc",
      ban.items[0]?.stt === 1 && ban.items[1]?.stt === 2 ? "" : "danh so lai tu 1",
      ban.tenCongTrinh === goc.tenCongTrinh ? "" : "tenCongTrinh",
      ban.maDuAn === goc.maDuAn ? "" : "maDuAn",
      (ban.taiLieu ?? []).length === 1 ? "" : "taiLieu (ho so dau vao)",
      (ban.nguoiTheoDoi ?? []).length === 1 ? "" : "nguoiTheoDoi",
      (ban.congViecDaXong ?? []).some((v) => v.maCongViec === "checkin_ton_kho")
        ? ""
        : "congViecDaXong(buoc ①)",
    ].filter(Boolean);
    return {
      duoc: thieu.length === 0,
      thucTe: thieu.length === 0 ? "giu du khoa noi va thong tin nhan dang" : `da xoa mat: ${thieu.join(", ")}`,
      mongDoi: "giu deNghiGocId · sttDongGoc tung dong · loaiHoSo · danh sach mat hang",
    };
  },
);

kiem(
  "NHAN BAN — phieu GOC khong bi dung toi mot chu nao",
  "Sếp · 15/09/2026 — chỉ bỏ THAM CHIẾU ở bản copy; nội dung tệp ở `3-du-lieu/kho-tep.ts` dùng chung `id`, xoá là phiếu gốc mất chứng từ",
  () => {
    const goc = phieuGocDaDiXa();
    const truoc = JSON.stringify(goc);
    nhanBanThu(goc, [1]);
    return {
      duoc: JSON.stringify(goc) === truoc,
      thucTe: JSON.stringify(goc) === truoc ? "phieu goc nguyen ven" : "phieu goc da bi sua",
      mongDoi: "phieu goc nguyen ven",
    };
  },
);

kiem(
  "NHAN BAN TU MOT BAN COPY — `sttDongGoc` ke thua, KHONG lay `stt` cua ban copy",
  "Sếp · 15/09/2026 — ghi `d.stt` là làm mờ NHẦM một dòng của phiếu gốc vẫn phải mua",
  () => {
    const goc = phieuGocDaDiXa();
    const copy1 = nhanBanThu(goc, [2, 3]); // stt 1,2 ↔ sttDongGoc 2,3
    const copy2 = NB.dungBanNhanBan({
      goc: copy1,
      phieuGocDau: goc,
      idMoi: "pr-copy-2",
      maMoi: `${goc.code} (copy 2)`,
      nguoi: { uid: "u2", ten: "Trần Thị C" },
      sttGiuLai: [2],
      ngay: "2026-09-15",
      thoiDiem: "2026-09-15T04:00:00.000Z",
    });
    const ra = copy2.items[0]?.sttDongGoc;
    return {
      duoc: ra === 3 && copy2.deNghiGocId === "pr-goc",
      thucTe: `sttDongGoc=${ra} · deNghiGocId=${copy2.deNghiGocId}`,
      mongDoi: "sttDongGoc=3 (dong o phieu goc dau tien) · deNghiGocId=pr-goc (cha–con MOT cap)",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA SẾP — 17/09/2026: BẢN NHÂN BẢN CẤP 2 + MÀN KPI PHÒNG
//
// ① Nhan ban cap 2: quan he cha-con chi MOT CAP nen ban chau tro thang
//    ve phieu goc dau tien, bo qua phieu o giua => phieu giua khong biet
//    dong nao cua minh da giao di va KET (khong vao noi buoc 7). Da do
//    tren kho that 17/09/2026: "2026/HDXD-PR-001 (copy 3)" nhan ban tay
//    tu "(copy)", va "(copy)" KHONG co sttDongGoc.
//    Cach chua (huong C Sep chot): them deNghiChaId + sttDongCha.
//
// ② Man KPI: 🔴 HAI BAI CHIEU NGHICH LA THU QUAN TRONG NHAT — chung ghim
//    dung hai loi cua khoi thong ke cu:
//      · dem HAI LAN dong da nhan ban di;
//      · tinh phieu DONG DO la "xong" => thuong cong cho viec that bai.
// ════════════════════════════════════════════════════════════════════

kiem(
  "THEM BAN NUA — ban thu hai (nhan co hau to) PHAI duoc nhan",
  'Sếp · 17/09/2026 — "Truong nay dang ko hoat dong" (nut + Them ban nua)',
  () => {
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const dn = {
      tepGiaiDoan: {
        ho_so_thanh_toan: [
          { id: "t1", ten: "vat1.pdf", ghiChu: CT.NHAN_TEP_HOA_DON_VAT },
          { id: "t2", ten: "vat2.pdf", ghiChu: `${CT.NHAN_TEP_HOA_DON_VAT} (2)` },
        ],
      },
    };
    const ra = CT.tepHoaDonVAT(dn).map((t) => t.id);
    return {
      duoc: ra.length === 2 && ra.includes("t2"),
      thucTe: `nhan ${ra.length} ban: ${ra.join(",")}`,
      mongDoi: "nhan CA HAI ban — ban (2) la thu nut \"Them ban nua\" sinh ra",
    };
  },
);

kiem(
  "THEM BAN NUA — CHIEU NGHICH: ghi chu nguoi dung tu go KHONG duoc dem la chung tu",
  "Ly do cu van con nguyen: dem nham la app bao du ho so khi ho so con thieu",
  () => {
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const dn = {
      tepGiaiDoan: {
        ho_so_thanh_toan: [
          { id: "x1", ten: "a.pdf", ghiChu: `cho ${CT.NHAN_TEP_HOA_DON_VAT} ben A gui` },
          { id: "x2", ten: "b.pdf", ghiChu: `${CT.NHAN_TEP_HOA_DON_VAT} ban nhap` },
          { id: "x3", ten: "c.pdf", ghiChu: `${CT.NHAN_TEP_HOA_DON_VAT} (ban cu)` },
        ],
      },
    };
    const ra = CT.tepHoaDonVAT(dn).map((t) => t.id);
    return {
      duoc: ra.length === 0,
      thucTe: ra.length === 0 ? "khong dem cai nao (dung)" : `dem nham: ${ra.join(",")}`,
      mongDoi: "khong dem — chi nhan dung dang nhan + \" (so)\"",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA SẾP — 17/09/2026: BỎ KÝ HIỆU `PR` KHỎI MÃ ĐỀ NGHỊ
//
// Sep: "e bo luon chu PR do di". Ma sinh ra tu nay la 2026/HDXD-001.
//
// 🔴 BAI CHIEU NGHICH LA THU QUAN TRONG NHAT: du lieu that dang co ma CU
// dang ...-PR-003. Neu ham sinh ma chi do dang MOI thi phieu tiep theo ra 001
// trong khi du an do da dung toi 003 => hai ho so mang so thu tu lan nhau, dung
// cai su co 14/08/2026 da sua mot lan.
// ════════════════════════════════════════════════════════════════════

kiem(
  "MA DE NGHI — KHONG con chu PR trong ma moi",
  'Sếp · 17/09/2026 — "e bo luon chu PR do di"',
  () => {
    const M2 = nap(join(thuMuc, "dat-ten.cjs"));
    const ra = M2.maDeNghiTiepTheo("2026/HDXD", []);
    return {
      duoc: !ra.includes("PR") && ra === "2026/HDXD-001",
      thucTe: `"${ra}"`,
      mongDoi: '"2026/HDXD-001" — khong co -PR-',
    };
  },
);

kiem(
  "MA DE NGHI — CHIEU NGHICH: ma CU co PR van duoc tinh, KHONG duoc cap trung so",
  "Su co 14/08/2026: dem lai tu dau la hai ho so mang so thu tu lan nhau",
  () => {
    const M2 = nap(join(thuMuc, "dat-ten.cjs"));
    const daDung = [
      "2026/HDXD-PR-001",
      "2026/HDXD-PR-002",
      "2026/HDXD-PR-003 (copy)",
    ];
    const ra = M2.maDeNghiTiepTheo("2026/HDXD", daDung);
    return {
      duoc: ra === "2026/HDXD-004",
      thucTe: `"${ra}"`,
      mongDoi: '"2026/HDXD-004" — tiep sau so 003 cua ma CU, khong quay ve 001',
    };
  },
);

kiem(
  "NHAN BAN CAP 2 — phieu o GIUA phai biet dong nao cua minh da giao di",
  "Sếp · 17/09/2026 (huong C) — truoc do phieu giua ket y nhu loi A cua phieu goc",
  () => {
    const A = { id: "pr-a", code: "PR-001", items: [{ stt: 1 }, { stt: 2 }] };
    /* B sinh ra tu TACH TU DONG nen KHONG co sttDongGoc — dung nhu ca that tren kho. */
    const B = { id: "pr-b", code: "PR-001 (copy)", deNghiGocId: "pr-a", items: [{ stt: 1 }, { stt: 2 }] };
    /* C nhan ban tay tu B: deNghiGocId van tro ve A (mot cap), nhung deNghiChaId tro ve B. */
    const C = {
      id: "pr-c",
      code: "PR-001 (copy 3)",
      deNghiGocId: "pr-a",
      deNghiChaId: "pr-b",
      items: [{ stt: 1, sttDongCha: 2 }],
    };
    const ra = NB.dongDaNhanBanSang(B, [A, B, C]);
    return {
      duoc: ra.size === 1 && (ra.get(2) ?? []).includes("PR-001 (copy 3)"),
      thucTe: `phieu giua tra ra ${ra.size} dong da giao di (stt=${[...ra.keys()].join(",")})`,
      mongDoi: "tra ra dong stt=2 da giao sang PR-001 (copy 3)",
    };
  },
);

kiem(
  "NHAN BAN CAP 2 — CHIEU NGHICH: hai ban con cua CUNG mot phieu KHONG duoc tru lan nhau",
  "Sếp · 17/09/2026 — tru lan nhau la ca hai cung dong duoc ho so CHUA MUA GI",
  () => {
    const A = { id: "pr-a", code: "PR-001", items: [{ stt: 1 }, { stt: 2 }] };
    /* Hai ban con nhan ban TAY tu cung phieu A, cung sttDongGoc — neu khop mo theo "anh em"
       thi moi ban tuong dong cua minh da di sang ban kia. */
    const B1 = {
      id: "pr-b1", code: "PR-001 (copy)", deNghiGocId: "pr-a", deNghiChaId: "pr-a",
      items: [{ stt: 1, sttDongGoc: 1, sttDongCha: 1 }],
    };
    const B2 = {
      id: "pr-b2", code: "PR-001 (copy 2)", deNghiGocId: "pr-a", deNghiChaId: "pr-a",
      items: [{ stt: 1, sttDongGoc: 1, sttDongCha: 1 }],
    };
    const ra = NB.dongDaNhanBanSang(B1, [A, B1, B2]);
    return {
      duoc: ra.size === 0,
      thucTe: ra.size === 0 ? "B1 khong bi tru dong nao (dung)" : `B1 bi tru ${ra.size} dong (LOT!)`,
      mongDoi: "khong tru gi — B1 chua nhan ban cho ai",
    };
  },
);

kiem(
  "KPI PHONG — KHONG dem hai lan dong da nhan ban di",
  'Sếp · 17/09/2026 — khoi thong ke cu duyet dn.items khong loc, mot viec that dem thanh hai',
  () => {
    const NL = nap(join(thuMuc, "nang-luc.cjs"));
    const goc = {
      id: "pr-a", code: "PR-001", ngayDeNghi: "2026-09-01", items: [
        { stt: 1, nguoiPhuTrachUid: "u1", nguoiPhuTrachTen: "NV A" },
        { stt: 2, nguoiPhuTrachUid: "u1", nguoiPhuTrachTen: "NV A" },
      ],
    };
    const con = {
      id: "pr-b", code: "PR-001 (copy)", deNghiGocId: "pr-a", deNghiChaId: "pr-a",
      ngayDeNghi: "2026-09-02",
      items: [{ stt: 1, sttDongGoc: 2, sttDongCha: 2, nguoiPhuTrachUid: "u1", nguoiPhuTrachTen: "NV A" }],
    };
    const ds = NL.congNangLucTheoNhanVien([goc, con], [goc, con], [], [], []);
    const nv = ds.find((x) => x.uid === "u1");
    return {
      duoc: nv?.soDong === 2,
      thucTe: `NV A duoc tinh ${nv?.soDong} dong`,
      mongDoi: "2 dong (1 con lai o phieu goc + 1 o ban con), KHONG phai 3",
    };
  },
);

kiem(
  "KPI PHONG — CHIEU NGHICH: phieu DONG DO khong duoc tinh la 'xong'",
  "Sếp · 17/09/2026 — dem chung la bang danh gia thuong cong cho viec that bai",
  () => {
    const NL = nap(join(thuMuc, "nang-luc.cjs"));
    const dongDo = {
      id: "pr-x", code: "PR-009", ngayDeNghi: "2026-09-01", trangThai: "dong_do",
      items: [{ stt: 1, nguoiPhuTrachUid: "u1", nguoiPhuTrachTen: "NV A" }],
    };
    const ds = NL.congNangLucTheoNhanVien([dongDo], [dongDo], [], [], []);
    const nv = ds.find((x) => x.uid === "u1");
    return {
      duoc: nv?.soPhieuXong === 0 && nv?.soPhieuDongDo === 1,
      thucTe: `xong=${nv?.soPhieuXong} · dongDo=${nv?.soPhieuDongDo}`,
      mongDoi: "xong=0 · dongDo=1",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA SẾP — 17/09/2026: DUYỆT BÁO GIÁ NGAY TẠI BƯỚC ③
//
// Sep bat loi: bang so sanh bi gan nut "Duyet ban nay" — "Muc nay de xem
// thong tin nen chon NCC nao. Sao lai co nut duyet".
//
// 🔴 HAI BAI DUOI CANH HAI LOI KHAC NHAU MA CUNG MOT GOC: lay mot danh sach
// GOP CHUNG roi doi xu nhu the no chi chua mot loai.
//   ① ngan `yeu_cau_bao_gia` chua CA ban bao gia LAN bang so sanh;
//   ② `ghiChu` cua o chua CA nhan o LAN ten NCC.
// ════════════════════════════════════════════════════════════════════

kiem(
  "BAO GIA — danh sach ban bao gia KHONG duoc lan bang so sanh",
  'Sếp · 17/09/2026 — "Muc nay de xem thong tin nen chon NCC nao. Sao lai co nut duyet"',
  () => {
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const dn = {
      tepGiaiDoan: {
        yeu_cau_bao_gia: [
          { id: "t1", ten: "bg1.pdf", ghiChu: "Báo giá NCC 1" },
          { id: "t2", ten: "bg2.pdf", ghiChu: "Báo giá NCC 2 — Thép ABC" },
          { id: "t3", ten: "ss.pdf", ghiChu: BG.NHAN_O_SO_SANH },
        ],
      },
    };
    const ra = BG.tepBanBaoGiaNCC(dn).map((t) => t.id);
    return {
      duoc: ra.length === 2 && !ra.includes("t3"),
      thucTe: `con ${ra.length} ban: ${ra.join(",")}`,
      mongDoi: "con 2 ban bao gia NCC, KHONG co bang so sanh",
    };
  },
);

kiem(
  "BAO GIA — CHIEU NGHICH: nhan o phai doc lai duoc tu can cu duyet, KE CA o co ten NCC",
  "Sếp · 17/09/2026 — ghi ca ten NCC vao can cu duyet la mat dong 'Ban bao gia duoc chon'",
  () => {
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    /* Ô số 2 CÓ ghi tên NCC — nhãn sạch phải là "Báo giá NCC 2", không kèm tên. */
    const dn = {
      tepGiaiDoan: {
        yeu_cau_bao_gia: [
          { id: "t1", ten: "bg1.pdf", ghiChu: "Báo giá NCC 1" },
          { id: "t2", ten: "bg2.pdf", ghiChu: "Báo giá NCC 2 — Thép ABC" },
        ],
      },
    };
    const chiSo = BG.chiSoOBaoGia("Báo giá NCC 2 — Thép ABC");
    const nhanSach = BG.nhanOBaoGia(chiSo - 1);
    const docLai = BG.tepBaoGiaDaDuyet(dn, `[${nhanSach}] Duyet cho ben A`);
    return {
      duoc: docLai !== undefined && docLai.tep.id === "t2",
      thucTe:
        docLai === undefined
          ? `nhan "${nhanSach}" -> KHONG doc lai duoc (mat link Ban bao gia duoc chon)`
          : `doc lai ra tep ${docLai.tep.id}`,
      mongDoi: "doc lai dung tep t2",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA SẾP — 17/09/2026: "HỒ SƠ ĐÃ ĐỦ — CHỜ XÁC NHẬN"
//
// Sep khoanh do the o cot 7 Ho so thanh toan: "Them thong bao 'Ho so da du,
// cho xac nhan' doi voi cac quy trinh da hoan thanh va chi cho xac nhan".
//
// 🔴 BAI CHIEU NGHICH LA THU QUAN TRONG NHAT O DAY: the bay "da du" cho mot
// ho so CON THIEU HOA DON la app noi doi ngay tren mat bang quy trinh, va
// nguoi duyet bam vao roi moi biet bi chan. Mang `dsConNoBayTrenThe` da bi
// loc bot hoa don/UNC (chi dao 15/09) nen ai do dung nham mang do de tinh
// la dinh dung cai bay nay.
// ════════════════════════════════════════════════════════════════════

kiem(
  "THE KANBAN — ho so CON THIEU HOA DON thi KHONG duoc bay 'da du, cho xac nhan'",
  "Sếp · 17/09/2026 — bay 'da du' cho ho so thieu hoa don la app noi doi tren mat bang",
  () => {
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const thieuVAT = { id: "x", items: [{ stt: 1 }], tepGiaiDoan: {} };
    const r = CT.vuongMacDuyetHoanThanhDeNghi(thieuVAT);
    return {
      duoc: typeof r === "string",
      thucTe: r === null ? "null (LOT — se bay 'da du' cho ho so thieu hoa don!)" : `"${String(r).slice(0, 70)}"`,
      mongDoi: "van vuong vi thieu Hoa don VAT",
    };
  },
);

kiem(
  "TEN BAN SAO — hau to trong TEN phai khop y het hau to trong MA",
  "Sếp · 17/09/2026 — ban dau tien tung co ma '(copy)' ma ten '(copy 1)', lech ngay trong mot ho so",
  () => {
    const bo = [
      { ma: "260001-HPCS-PR-001 (copy)", mong: "Vat tu phan tho (copy)" },
      { ma: "260001-HPCS-PR-001 (copy 2)", mong: "Vat tu phan tho (copy 2)" },
      { ma: "260001-HPCS-PR-001 (copy 3)", mong: "Vat tu phan tho (copy 3)" },
    ];
    const sai = bo
      .map((b) => ({ ...b, that: NB.tenBanSaoTheoMa("Vat tu phan tho", b.ma) }))
      .filter((b) => b.that !== b.mong);
    return {
      duoc: sai.length === 0,
      thucTe:
        sai.length === 0
          ? "ca 3 ban: ten khop ma"
          : sai.map((s) => `ma "${s.ma}" -> ten "${s.that}"`).join(" · "),
      mongDoi: "hau to trong ten giong het hau to trong ma",
    };
  },
);

kiem(
  "TEN BAN SAO — CHIEU NGHICH: ma KHONG phai ban sao thi GIU NGUYEN tieu de, khong tu them '(copy)'",
  "Sếp · 17/09/2026 — them hau to cho phieu goc la doi ten mot ho so chua he duoc nhan ban",
  () => {
    const ra = NB.tenBanSaoTheoMa("Vat tu phan tho", "260001-HPCS-PR-001");
    return {
      duoc: ra === "Vat tu phan tho",
      thucTe: `"${ra}"`,
      mongDoi: '"Vat tu phan tho" (nguyen ven)',
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA SẾP — 17/09/2026: DẤU ĐỐI CHIẾU CỦA THU MUA LÀ NHẮC, KHÔNG CHẶN
//
// Sếp: *"bước tiến hành nhận hàng… là bước check song song với dữ liệu từ
// app kho đưa về"*. Sếp được trình hai cách và chọn cách ĐỐI CHIẾU (dấu của
// thu mua đứng CẠNH dấu của kho), bác cách cho thu mua tự ghi nhận hàng thay
// kho — vì hai đường ghi phiếu dùng CHUNG công thức sinh mã grn-{poId}-{lan}
// nên sẽ đếm trùng khối lượng, mà khối lượng nhận là căn cứ trả tiền NCC.
//
// 🔴 HAI BÀI DƯỚI CANH HAI CHIỀU NGƯỢC NHAU:
//   ① nhắc phải kêu khi còn phiếu chưa soi / đã soi ra lệch;
//   ② nhưng KHÔNG được biến thành chốt chặn — hàng đủ, chứng từ đủ mà đơn
//      không đóng được chỉ vì thiếu một dấu tích nội bộ là app tự dựng bế tắc.
// ════════════════════════════════════════════════════════════════════

kiem(
  "DOI CHIEU THU MUA — con phieu chua soi thi CO cau nhac",
  'Sếp · 17/09/2026 — "buoc check song song voi du lieu tu app kho dua ve"',
  () => {
    const r = M.nhacDoiChieuThuMua([
      { lanGiaoThu: 1, trangThai: "da_nhap_kho", thuMuaDoiChieu: { khop: true } },
      { lanGiaoThu: 2, trangThai: "da_nhap_kho" },
    ]);
    return {
      duoc: typeof r === "string" && /ch[ưu]a đ[ốo]i chi[ếe]u/i.test(r),
      thucTe: r === null ? "null (LOT — dau doi chieu thanh nghi thuc rong)" : `"${String(r).slice(0, 80)}"`,
      mongDoi: "cau nhac con lan giao chua doi chieu",
    };
  },
);

kiem(
  "DOI CHIEU THU MUA — da soi ra LECH thi noi cai LECH truoc, khong noi 'chua soi'",
  "Sếp · 17/09/2026 — lech la viec phai xu, nang hon viec chua soi",
  () => {
    const r = M.nhacDoiChieuThuMua([
      {
        lanGiaoThu: 1,
        trangThai: "da_nhap_kho",
        thuMuaDoiChieu: { khop: false, ghiChu: "kho ghi 150, phieu NCC ghi 120" },
      },
      { lanGiaoThu: 2, trangThai: "da_nhap_kho" },
    ]);
    return {
      duoc: typeof r === "string" && /L[ỆE]CH/.test(r),
      thucTe: `"${String(r).slice(0, 90)}"`,
      mongDoi: "cau nhac noi ve viec LECH so lieu",
    };
  },
);

kiem(
  "DOI CHIEU THU MUA — CHIEU NGHICH: soi het roi + deu khop thi IM, khong nhac vo co",
  "Sếp · 17/09/2026 — nhac khi khong con gi de nhac la chot bao dong sai, lan sau khong ai doc",
  () => {
    const r = M.nhacDoiChieuThuMua([
      { lanGiaoThu: 1, trangThai: "da_nhap_kho", thuMuaDoiChieu: { khop: true } },
      { lanGiaoThu: 2, trangThai: "tu_choi_nhan" },
    ]);
    return {
      duoc: r === null,
      thucTe: r === null ? "null (im)" : `"${String(r).slice(0, 80)}"`,
      mongDoi: "null — phieu tu_choi_nhan khong tinh, con lai da soi va khop",
    };
  },
);

kiem(
  "DOI CHIEU THU MUA — CHIEU NGHICH: KHONG duoc dung dieu kien khoi luong cua kho",
  "Nguyen tac du lieu so 2: Kho la nguon duy nhat cua so luong thuc nhan",
  () => {
    /* Phiếu thiếu tệp phiếu giao -> `vuongMacXacNhanKho` PHẢI chặn y như trước, dấu đối chiếu
       của thu mua không được làm nhẹ đi chốt 11/08/2026 đó. */
    const phieu = [
      { lanGiaoThu: 1, trangThai: "da_nhap_kho", thuMuaDoiChieu: { khop: true } },
    ];
    const r = M.vuongMacXacNhanKho(phieu);
    return {
      duoc: typeof r === "string" && /phi[ếe]u giao nh[ậa]n/i.test(r),
      thucTe: r === null ? "null (LOT — dau doi chieu da lam mat chot 11/08/2026!)" : `"${String(r).slice(0, 80)}"`,
      mongDoi: "van chan vi thieu tep phieu giao nhan — dau doi chieu KHONG thay the chung tu",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA SẾP — 17/09/2026: SỐ Ô BÁO GIÁ + BẢNG SO SÁNH PHẢI VỪA HẠN MỨC
//
// Sếp: *"Đang chỉ cho tạo tối đa 4 báo giá NCC… nếu tăng được 5 NCC thì nâng
// hạng lên 5 nha"*. Đã nâng `TOI_DA_TEP_MOI_BUOC` 5 → 6 nên `TOI_DA_O_BAO_GIA`
// thành 5.
//
// 🔴 TRẦN NÀY TRƯỚC 17/09/2026 KHÔNG CÓ MỘT CHỐT NÀO CANH. Ai bỏ phép trừ 1
// (cho `TOI_DA_O_BAO_GIA` bằng thẳng hạn mức) thì mọi bài kiểm vẫn xanh, còn
// hồ sơ đặt mức báo giá cao nhất thì **kẹt vĩnh viễn** ở bước ②: bản cuối cùng
// cộng bảng so sánh vượt hạn mức, tệp bị từ chối, điều kiện chuyển bước không
// bao giờ thoả. Đúng loại lỗi §6.6 nói `grep` không bắt được.
// ════════════════════════════════════════════════════════════════════

kiem(
  "BAO GIA — so o toi da CONG bang so sanh phai VUA han muc tep moi buoc",
  'Sếp · 17/09/2026 — "nếu tăng được 5 NCC thì nâng hạng lên 5"; thieu cho cho bang so sanh la phieu ket vinh vien',
  () => {
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const GH = nap(join(thuMuc, "gioi-han.cjs"));
    const vua = BG.TOI_DA_O_BAO_GIA + 1 <= GH.TOI_DA_TEP_MOI_BUOC;
    return {
      duoc: vua && BG.TOI_DA_O_BAO_GIA >= 5,
      thucTe: `${BG.TOI_DA_O_BAO_GIA} o bao gia + 1 bang so sanh = ${
        BG.TOI_DA_O_BAO_GIA + 1
      } / han muc ${GH.TOI_DA_TEP_MOI_BUOC}`,
      mongDoi: "it nhat 5 o bao gia, va tong (o + bang so sanh) KHONG vuot han muc",
    };
  },
);

kiem(
  "BAO GIA — CHIEU NGHICH: dat SL Bao gia cao ngat van bi kep ve dung so o app mo duoc",
  "Sếp · 17/09/2026 — ho so cu dat 20 (do tran cu) khong duoc phep ket lai",
  () => {
    const BG = nap(join(thuMuc, "bao-gia.cjs"));
    const can = BG.soBaoGiaCanCo(
      { items: [{ stt: 1, soBaoGiaYeuCau: 99 }] },
      { soBaoGiaToiThieu: 0 },
    );
    return {
      duoc: can <= BG.TOI_DA_O_BAO_GIA,
      thucTe: `can=${can} (tran ${BG.TOI_DA_O_BAO_GIA})`,
      mongDoi: `can bi kep ve toi da ${BG.TOI_DA_O_BAO_GIA} — khong doi bang thu app khong mo cho dinh`,
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA SẾP — 17/09/2026: PHIẾU GỐC ĐÃ NHÂN BẢN ĐI THÌ KHÔNG BỊ KẸT
//
// Lỗi đo được trước bản vá: phiếu gốc nhân bản 2/3 mặt hàng cho người khác
// vẫn bị tính tiến độ trên CẢ 3 dòng, nên:
//   · thẻ không vào nổi cột ⑦ Hồ sơ thanh toán (nhánh `daVeDu` không bao giờ đúng);
//   · nút hoàn thành báo *"còn 2 mặt hàng chưa lên đơn"* và không bấm được.
// Người giữ phiếu gốc không sai gì mà hồ sơ kẹt — và trên bảng đánh giá thì
// đó là một phiếu "trễ hạn" ghi vào tên họ.
//
// 🔴 BA BÀI DƯỚI ĐÂY PHẢI GIỮ ĐỦ CẢ BA. Bài ① một mình thì ai sửa hàm thành
// `return []` vô điều kiện vẫn xanh — mà làm vậy là cho đóng hồ sơ CHƯA MUA GÌ.
// ════════════════════════════════════════════════════════════════════

/** Phiếu gốc 3 dòng, đã nhân bản dòng 2 và 3 sang một bản con. */
const boNhanBan = () => {
  const goc = { id: "pr-goc", code: "PR-001", items: [{ stt: 1 }, { stt: 2 }, { stt: 3 }] };
  const con = {
    id: "pr-con",
    code: "PR-001 (copy)",
    deNghiGocId: "pr-goc",
    items: [
      { stt: 1, sttDongGoc: 2 },
      { stt: 2, sttDongGoc: 3 },
    ],
  };
  return { goc, con, tatCa: [goc, con] };
};

kiem(
  "LOC TIEN DO — dong da nhan ban di KHONG con tinh vao phieu goc",
  'Sếp · 17/09/2026 — dong da nhan ban thi phieu goc "khong can mua" (chot 15/09)',
  () => {
    const { goc, tatCa } = boNhanBan();
    const tienDo = [
      { stt: 1, khoiLuongChuaLenPO: 0, khoiLuongConLai: 0 },
      { stt: 2, khoiLuongChuaLenPO: 5, khoiLuongConLai: 5 },
      { stt: 3, khoiLuongChuaLenPO: 7, khoiLuongConLai: 7 },
    ];
    const ra = NB.locTienDoConPhaiMua(goc, tatCa, tienDo);
    const stt = ra.map((d) => d.stt).join(",");
    return {
      duoc: ra.length === 1 && stt === "1",
      thucTe: `con ${ra.length} dong (stt=${stt})`,
      mongDoi: "con 1 dong (stt=1) — hai dong kia da giao cho nguoi khac",
    };
  },
);

kiem(
  "LOC TIEN DO — CHIEU NGHICH: thieu `tatCaDeNghi` thi TRA NGUYEN, khong tru mu",
  "Sếp · 17/09/2026 — tru mu la cho dong ho so CHUA MUA GI, nang hon loi dang va",
  () => {
    const { goc } = boNhanBan();
    const tienDo = [
      { stt: 1, khoiLuongChuaLenPO: 0, khoiLuongConLai: 0 },
      { stt: 2, khoiLuongChuaLenPO: 5, khoiLuongConLai: 5 },
    ];
    const ra = NB.locTienDoConPhaiMua(goc, undefined, tienDo);
    return {
      duoc: ra.length === 2,
      thucTe: `con ${ra.length} dong`,
      mongDoi: "con 2 dong (nguyen mang) — noi goi chua cap nhat thi KHONG duoc tru",
    };
  },
);

kiem(
  "LOC TIEN DO — CHIEU NGHICH: phieu CHUA nhan ban lan nao thi khong dong nao bi bo",
  "Sếp · 17/09/2026 — ca thuong gap nhat, bo nham mot dong la bo roi vat tu chua ai mua",
  () => {
    const goc = { id: "pr-le", code: "PR-009", items: [{ stt: 1 }, { stt: 2 }] };
    const tienDo = [
      { stt: 1, khoiLuongChuaLenPO: 3, khoiLuongConLai: 3 },
      { stt: 2, khoiLuongChuaLenPO: 0, khoiLuongConLai: 4 },
    ];
    const ra = NB.locTienDoConPhaiMua(goc, [goc], tienDo);
    return {
      duoc: ra.length === 2,
      thucTe: `con ${ra.length} dong`,
      mongDoi: "con 2 dong — khong co ban con nao thi giu nguyen",
    };
  },
);

kiem(
  "HOAN THANH — phieu goc da nhan ban di, phan con lai mua xong -> KHONG con chan khoi luong",
  'Sếp · 17/09/2026 — truoc ban va bao "con 2 mat hang chua len don" va khong bam duoc',
  () => {
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const { con } = boNhanBan();
    /* Phiếu gốc dựng theo khuôn `hoSoSanSangDong` (đủ hợp đồng + hóa đơn VAT) rồi thêm 3 dòng
       và một bản con ĐÃ CHỐT XONG — để chốt "còn bản con dở" không phải thứ đang chặn. */
    const goc = {
      ...hoSoSanSangDong(undefined, true),
      id: "pr-goc",
      code: "PR-001",
      items: [{ stt: 1 }, { stt: 2 }, { stt: 3 }],
    };
    const conXong = { ...con, trangThai: "hoan_thanh" };
    const tienDo = [
      { stt: 1, khoiLuongChuaLenPO: 0, khoiLuongConLai: 0 },
      { stt: 2, khoiLuongChuaLenPO: 5, khoiLuongConLai: 5 },
      { stt: 3, khoiLuongChuaLenPO: 7, khoiLuongConLai: 7 },
    ];
    const r = CT.vuongMacHoanThanhQuyTrinh(goc, tienDo, [goc, conXong]);
    const vuongVeKhoiLuong = typeof r === "string" && /ch[ưu]a l[êe]n đ[ơo]n|ch[ưu]a nh[ậa]n đ[ủu]/i.test(r);
    return {
      duoc: !vuongVeKhoiLuong,
      thucTe: r === null ? "null (khong vuong gi)" : `"${String(r).slice(0, 100)}"`,
      mongDoi: "khong con cau chan ve khoi luong cua 2 dong da giao di",
    };
  },
);

kiem(
  "HOAN THANH — CHIEU NGHICH: dong CHUA nhan ban di ma chua len don thi VAN CHAN",
  "Sếp · 17/09/2026 — ban va khong duoc bien thanh duong dong ho so bo roi vat tu",
  () => {
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const { con } = boNhanBan();
    const goc = {
      ...hoSoSanSangDong(undefined, true),
      id: "pr-goc",
      code: "PR-001",
      items: [{ stt: 1 }, { stt: 2 }, { stt: 3 }],
    };
    const conXong = { ...con, trangThai: "hoan_thanh" };
    /* Dòng 1 KHÔNG nằm trong bản con — nó vẫn là việc của phiếu gốc và chưa lên đơn. */
    const tienDo = [
      { stt: 1, khoiLuongChuaLenPO: 9, khoiLuongConLai: 9 },
      { stt: 2, khoiLuongChuaLenPO: 0, khoiLuongConLai: 0 },
      { stt: 3, khoiLuongChuaLenPO: 0, khoiLuongConLai: 0 },
    ];
    const r = CT.vuongMacHoanThanhQuyTrinh(goc, tienDo, [goc, conXong]);
    return {
      duoc: typeof r === "string" && /ch[ưu]a l[êe]n đ[ơo]n/i.test(r),
      thucTe: r === null ? "null (LOT — dong ho so bo roi vat tu!)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "cau chan nhac con mat hang chua len don",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA SẾP — 15/09/2026: HẬU TỐ "(copy N)" PHẢI HIỆN NGAY TRÊN THẺ
//
// Nguyên văn: *"khi nhân bản thì tên tiêu đề này cũng phải hiển thị luôn
// chư (copy..) hiện tại phải bấm vào chỉnh sửa thông tin thì nó mới hiện"*.
//
// Ảnh chụp bảng kanban bản chạy thật có HAI thẻ tiêu đề giống hệt nhau
// (`000000086 - 2026/HDXD - DỰ ÁN TEST`), một trong hai là bản nhân bản.
// ════════════════════════════════════════════════════════════════════

kiem(
  "TEN THE — ban copy phai KHAC ban goc va mang hau to (copy N)",
  'Sếp · 15/09/2026 — "khi nhân bản thì tên tiêu đề này cũng phải hiển thị luôn chư (copy..)"',
  () => {
    const goc = phieuGocDaDiXa();
    const ban = nhanBanThu(goc);
    const tGoc = TT.tenTheDeNghi(goc);
    const tBan = TT.tenTheDeNghi(ban);
    return {
      duoc: tGoc !== tBan && /\(copy/i.test(tBan),
      thucTe: `goc="${tGoc}" · copy="${tBan}"`,
      mongDoi: "hai ten KHAC nhau, ten ban copy chua '(copy'",
    };
  },
);

kiem(
  "TEN THE — CHIEU NGHICH: phieu GOC khong bi gan them hau to nao",
  "Sếp · 15/09/2026 — dán '(copy)' cho mọi thẻ là phiếu gốc cũng trông như bản sao, mất luôn ý nghĩa dấu hiệu",
  () => {
    const goc = phieuGocDaDiXa();
    const ten = TT.tenTheDeNghi(goc);
    /* Và không lặp chữ: tên công trình chỉ được in MỘT lần dù `tieuDe` cũng chứa nó
       (luật 13/09/2026 của Ban lãnh đạo). */
    const soLanTenCongTrinh = ten.toUpperCase().split("DỰ ÁN TEST").length - 1;
    return {
      duoc: !/\(copy/i.test(ten) && soLanTenCongTrinh === 1,
      thucTe: `"${ten}" · ten cong trinh xuat hien ${soLanTenCongTrinh} lan`,
      mongDoi: "khong co '(copy)', ten cong trinh xuat hien dung 1 lan",
    };
  },
);

kiem(
  "TEN THE — phieu LAP TAY: ma dau the da mang '(copy)' thi KHONG in hau to lan hai",
  "Ban lãnh đạo · 13/09/2026 — thẻ rộng ~240px, nhắc lại một chuỗi là chiếm chỗ mà không nói thêm gì",
  () => {
    /* Phiếu lập tay không có `maDeXuatAppRequest` → dòng đầu thẻ in `code`, mà mã bản sao đã
       mang sẵn `(copy)`. Đây chính là ca mà luật cắt đuôi cũ được viết cho. */
    const goc = { ...phieuGocDaDiXa(), maDeXuatAppRequest: undefined, tieuDe: "Vật tư đợt 4" };
    const ban = nhanBanThu(goc);
    const ten = TT.tenTheDeNghi(ban);
    const soLan = ten.toLowerCase().split("(copy").length - 1;
    return {
      duoc: soLan === 1,
      thucTe: `"${ten}" — '(copy' xuat hien ${soLan} lan`,
      mongDoi: "'(copy' xuat hien dung 1 lan (o ma dau the)",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA SẾP — 15/09/2026
// Ảnh chụp bảng quy trình kanban, khoanh đỏ cả hàng tiêu đề các cột:
//     *"trường thời gian ở các bước này sao chưa có"*
// Hỏi lại và Sếp chốt: muốn hiện THỜI HẠN CHUẨN CỦA BƯỚC ở đầu mỗi cột
// (quy trình cho bước này bao nhiêu giờ), KHÔNG phải "hồ sơ đã nằm ở
// bước này bao lâu".
//
// Luật ở `2-quy-trinh/cau-hinh-quy-trinh.ts` → `nhanHanGioBuoc` /
// `nhanHanGioCuaBuoc`; đầu cột lấy chữ qua `CotBangQuyTrinh.hanGio` do
// `dungBangQuyTrinh` sinh (`2-quy-trinh/giai-doan-mua-hang.ts`).
//
// 🔴 VÌ SAO PHẢI CÓ BÀI KIỂM: `hanGioTheoBuoc` khai `nhan_hang: 0`, còn
//    `ho_so_thanh_toan` / `hoan_thanh` / `that_bai` KHÔNG khai khóa nào.
//    Ai "dọn cho gọn" thành `${han} giờ` trơn thì bốn cột cuối in ra
//    "0 giờ" và "undefined giờ" — mà `0` trong cấu hình nghĩa là KHÔNG
//    ĐẶT HẠN, in "0 giờ" là đọc ngược lại thành "hết hạn ngay lập tức".
//
// 🔴 KIỂM CẢ HAI CHIỀU. Ai sửa hàm thành `return "Không đặt thời hạn"`
//    vô điều kiện thì ba bài đầu vẫn xanh, mà con số thật đã biến mất
//    khỏi cả ba màn hình đang dùng chung hàm này.
// ════════════════════════════════════════════════════════════════════

kiem(
  "HAN BUOC — buoc CO han (tiep_nhan = 4) phai ra chuoi mang dung con so do",
  'Sếp · 15/09/2026 — "trường thời gian ở các bước này sao chưa có"',
  () => {
    const r = CQ.nhanHanGioCuaBuoc(CQ.CAU_HINH_MAC_DINH, "tiep_nhan");
    return {
      duoc: r === "4 giờ",
      thucTe: `"${r}"`,
      mongDoi: '"4 giờ" — đúng số trong `hanGioTheoBuoc.tiep_nhan`',
    };
  },
);

kiem(
  "HAN BUOC — buoc khai 0 (nhan_hang) → 'Khong dat thoi han', TUYET DOI khong phai '0 gio'",
  "Sếp · 15/09/2026 · quy ước 0 = không đặt hạn có từ Ban lãnh đạo 13/08/2026",
  () => {
    const r = CQ.nhanHanGioCuaBuoc(CQ.CAU_HINH_MAC_DINH, "nhan_hang");
    return {
      duoc: r === "Không đặt thời hạn",
      thucTe: `"${r}"`,
      mongDoi: '"Không đặt thời hạn" (0 = KHÔNG đặt hạn, không phải hạn bằng 0 giờ)',
    };
  },
);

kiem(
  "HAN BUOC — buoc KHONG KHAI khoa (hoan_thanh) → cau khong dat han, khong ra 'undefined'",
  "Sếp · 15/09/2026 — ba bước cuối chưa bao giờ được khai trong CAU_HINH_MAC_DINH",
  () => {
    const ds = ["ho_so_thanh_toan", "hoan_thanh", "that_bai"].map((b) => [
      b,
      CQ.nhanHanGioCuaBuoc(CQ.CAU_HINH_MAC_DINH, b),
    ]);
    const xau = ds.filter(([, v]) => v !== "Không đặt thời hạn");
    return {
      duoc: xau.length === 0,
      thucTe: JSON.stringify(ds),
      mongDoi: 'cả ba ra "Không đặt thời hạn" — không "undefined giờ", không "NaN giờ"',
    };
  },
);

kiem(
  "HAN BUOC — CHIEU NGHICH: ham KHONG duoc tra cung mot cau cho moi ca",
  "Sếp · 15/09/2026 — chốt chống ai đó `return` cứng làm mất sạch con số thật",
  () => {
    /* 🔴 Bài kiểm này tồn tại vì ba bài trên một mình KHÔNG đủ: hàm trả cứng
       "Không đặt thời hạn" thì hai bài "không đặt hạn" xanh, và chỉ một bài có số đứng
       chặn — mà bài đó dễ bị sửa theo. Ở đây đòi hàm phân biệt được bốn giá trị khác nhau. */
    const co4 = CQ.nhanHanGioBuoc(4);
    const co12 = CQ.nhanHanGioBuoc(12);
    const khong0 = CQ.nhanHanGioBuoc(0);
    const khongKhai = CQ.nhanHanGioBuoc(undefined);
    return {
      duoc:
        co4 === "4 giờ" &&
        co12 === "12 giờ" &&
        co4 !== co12 &&
        khong0 === khongKhai &&
        khong0 !== co4,
      thucTe: `4→"${co4}" · 12→"${co12}" · 0→"${khong0}" · undefined→"${khongKhai}"`,
      mongDoi: '4 và 12 ra hai chuỗi KHÁC nhau có số; 0 và undefined cùng ra câu "không đặt"',
    };
  },
);

kiem(
  "HAN BUOC — CHIEU NGHICH: gia tri hong (NaN, am) khong duoc in ra man hinh",
  "Sếp · 15/09/2026 — cấu hình đi qua Firestore và qua ô nhập trang Cài đặt",
  () => {
    const ds = [NaN, -3, null].map((v) => CQ.nhanHanGioBuoc(v));
    const xau = ds.filter((v) => v !== "Không đặt thời hạn");
    return {
      duoc: xau.length === 0,
      thucTe: JSON.stringify(ds),
      mongDoi: 'cả ba ra "Không đặt thời hạn" — không "NaN giờ", không "-3 giờ"',
    };
  },
);

kiem(
  "DAU COT KANBAN — moi cot PHAI mang san chu thoi han (truong `hanGio`), BAN NGAN",
  'Sếp · 15/09/2026 "trường thời gian ở các bước này sao chưa có" → 16/09/2026 "điều chỉnh lại header này cho đồng bộ"',
  () => {
    /* 🔴 Đây mới là bài kiểm ĐÚNG CHỖ SẾP CHỈ: ba bài trên chỉ chứng minh hàm định dạng chạy
       đúng, không chứng minh đầu cột có chữ. Ai bỏ `hanGio` khỏi `dungBangQuyTrinh` thì hàm
       vẫn xanh còn hàng tiêu đề lại trắng trơn như trước.

       ★★ ĐỔI KỲ VỌNG 16/09/2026 — GHI ĐỦ HAI MỐC ĐỂ KHÔNG AI TƯỞNG LUẬT BỊ LỠ TAY SỬA:
       · 15/09/2026 Sếp yêu cầu đầu cột phải có thời hạn → bài này ra đời, kỳ vọng câu DÀI
         ("Không đặt thời hạn") vì lúc đó cả app dùng chung một câu.
       · 16/09/2026 Sếp xem bảng thật và yêu cầu *"điều chỉnh lại header này cho đồng bộ"*: câu dài
         làm cột nào có thêm cụm "N còn thiếu" bị xuống dòng hai, riêng cột đó cao hơn 8 cột kia.
         Nay đầu cột dùng `nhanHanGioCuaBuocNgan` → "Không đặt hạn".

       🔴 ĐỔI ĐÚNG MỘT CHỖ, KHÔNG NỚI: câu DÀI vẫn là chuẩn của hộp chuyển giai đoạn và cột thông
       tin đề nghị — ba bài kiểm phía trên vẫn canh `NHAN_BUOC_KHONG_HAN` nguyên vẹn. Nếu ai sửa
       `nhanHanGioBuoc` (bản dài) cho ngắn lại thì ba bài đó đỏ ngay.
       📌 Ca CÓ hạn vẫn phải ra y hệt bản dài ("4 giờ") — giữ nguyên trong kỳ vọng dưới đây, vì đó
       là chốt ngăn ai đó viết một hàm định dạng thứ hai rồi hai màn hình nói khác nhau. */
    const cot = G.dungBangQuyTrinh([], [], [], [], CQ.CAU_HINH_MAC_DINH);
    const thieu = cot.filter((c) => typeof c.hanGio !== "string" || c.hanGio.trim() === "");
    const tiepNhan = cot.find((c) => c.giaiDoan?.ma === "tiep_nhan");
    const nhanHang = cot.find((c) => c.giaiDoan?.ma === "nhan_hang");
    return {
      duoc:
        cot.length > 0 &&
        thieu.length === 0 &&
        tiepNhan?.hanGio === "4 giờ" &&
        nhanHang?.hanGio === CQ.NHAN_BUOC_KHONG_HAN_NGAN,
      thucTe: `${cot.length} cột · thiếu ${thieu.length} · tiep_nhan="${tiepNhan?.hanGio}" · nhan_hang="${nhanHang?.hanGio}"`,
      mongDoi: `mọi cột có chữ; tiep_nhan = "4 giờ"; nhan_hang = "${CQ.NHAN_BUOC_KHONG_HAN_NGAN}" (bản NGẮN, Sếp 16/09/2026)`,
    };
  },
);

kiem(
  "HAI BAN DAI/NGAN LA HAI CAU KHAC NHAU — va ban dai KHONG duoc rut gon theo",
  'Sếp · 16/09/2026 — "điều chỉnh lại header này cho đồng bộ" (chỉ đổi ở ĐẦU CỘT)',
  () => {
    /* 🔴 CHIỀU NGƯỢC LẠI, và đây mới là bài quan trọng: rất dễ có người thấy hai hằng gần giống
       nhau rồi "dọn cho gọn" bằng cách xoá một cái. Xoá bản NGẮN → header so le trở lại. Xoá bản
       DÀI (hoặc rút nó lại cho bằng bản ngắn) → hộp chuyển giai đoạn và cột thông tin đề nghị mất
       chữ "thời hạn", tức làm nghèo hai màn hình rộng rãi để chữa một màn hình chật.
       📌 Và ca CÓ hạn thì HAI bản phải trả y hệt — khác nhau đúng một câu, ở đúng một ca. */
    const dai = CQ.NHAN_BUOC_KHONG_HAN;
    const ngan = CQ.NHAN_BUOC_KHONG_HAN_NGAN;
    const coHanDai = CQ.nhanHanGioBuoc(4);
    const coHanNgan = CQ.nhanHanGioBuocNgan(4);
    return {
      duoc:
        typeof dai === "string" &&
        typeof ngan === "string" &&
        dai !== ngan &&
        ngan.length < dai.length &&
        CQ.nhanHanGioBuoc(0) === dai &&
        CQ.nhanHanGioBuocNgan(0) === ngan &&
        coHanDai === "4 giờ" &&
        coHanNgan === "4 giờ",
      thucTe: `dài="${dai}" · ngắn="${ngan}" · có hạn: dài="${coHanDai}" ngắn="${coHanNgan}"`,
      mongDoi:
        'hai câu KHÁC nhau cho ca không đặt hạn (ngắn phải ngắn hơn), nhưng ca có hạn thì GIỐNG HỆT ("4 giờ")',
    };
  },
);

kiem(
  "DAU COT KANBAN — chu lay tu CAU HINH DANG HIEU LUC, khong phai ban mac dinh",
  "Sếp · 15/09/2026 — cấp quản lý sửa được hạn ở trang Cài đặt quy trình",
  () => {
    /* 🔴 CHIỀU NGHỊCH của bài trên: ai đọc thẳng `CAU_HINH_MAC_DINH` trong `dungBangQuyTrinh`
       (hoặc trong file giao diện) thì bài trên vẫn xanh, mà đầu cột hiện số CŨ ngay sau khi
       cấp quản lý vừa sửa hạn — sai mà không một lỗi nào báo. */
    const suaTay = {
      ...CQ.CAU_HINH_MAC_DINH,
      hanGioTheoBuoc: { ...CQ.CAU_HINH_MAC_DINH.hanGioTheoBuoc, tiep_nhan: 48, hoan_thanh: 2 },
    };
    const cot = G.dungBangQuyTrinh([], [], [], [], suaTay);
    const tiepNhan = cot.find((c) => c.giaiDoan?.ma === "tiep_nhan");
    const hoanThanh = cot.find((c) => c.giaiDoan?.ma === "hoan_thanh");
    return {
      duoc: tiepNhan?.hanGio === "48 giờ" && hoanThanh?.hanGio === "2 giờ",
      thucTe: `tiep_nhan="${tiepNhan?.hanGio}" · hoan_thanh="${hoanThanh?.hanGio}"`,
      mongDoi: '"48 giờ" và "2 giờ" — theo cấu hình vừa sửa, KHÔNG phải 4 giờ / không đặt hạn',
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA SẾP — 15/09/2026, nguyên văn:
//   *"Đề xuất từ phòng ban thì ko cần gửi sang app kho, nên e bỏ phần ghi chú này và điều chỉnh
//    lại phần code của phòng ban"*
// (nhắn kèm ảnh chụp đơn DMH260007 của đề nghị "2. Phòng Pháp lý (HP Cons)" trên bản chạy thật,
//  đang bày dải cảnh báo vàng "Chưa gửi được đơn này sang app Kho công trình")
//
// 🔴 VÌ SAO LUẬT NÀY ĐÁNG MỘT BÀI KIỂM RIÊNG, KHÔNG PHẢI CHUYỆN DỌN GIAO DIỆN:
// Sáng cùng ngày bản chạy thật dính vòng lặp ghi vô hạn (app thấy PO `failed` → gửi lại QLK CTR →
// lỗi → ghi lên kho chung → snapshot dội về → lặp), tới mức Firestore chặn với *"Write stream
// exhausted maximum allowed queued writes"*, 1565 lỗi trong console. PO của hồ sơ phòng ban nằm
// đúng trong nhóm `failed` đó — tức là nhiên liệu của vòng lặp. Chốt này rút nhiên liệu ra.
//
// ⚠️ CHIỀU NGHỊCH QUAN TRỌNG HƠN CHIỀU THUẬN: ai nới nhầm chốt sang hồ sơ CÔNG TRÌNH thì thủ kho
//    không bao giờ thấy đơn bên app Kho, và KHÔNG CÓ GÌ BÁO — giống hệt cách sự cố 23/08 lọt qua
//    mọi lớp kiểm. Nên mỗi chiều thuận ở dưới đều có một chiều nghịch đi kèm.
// ════════════════════════════════════════════════════════════════════

/* Đề nghị tối giản — chỉ những trường `laHoSoPhongBan` và `xayDungPayloadPO` thật sự đọc. */
const dnQlk = (them) => ({
  id: "pr-1",
  code: "260001-HPCS-HDXD-001-PR-001",
  maDeXuatAppRequest: "000000085",
  ...them,
});

/* PO tối giản. `maHopDongCDT` để RỖNG ở mặc định vì nhánh PO ĐỘC LẬP đọc đúng trường này. */
const poQlk = (them) => ({
  id: "po-1",
  code: "DMH260007",
  maDuAn: "260001-HPCS",
  tenCongTrinh: "Đề nghị 2. Phòng Pháp lý (HP Cons)",
  maHopDongCDT: "",
  supplierTen: "Công ty TNHH VLXD A",
  ngayLapPO: "2026-09-01",
  items: [{ stt: 1, sttDongDeNghi: 1, tenVatLieu: "Thép D10", donViTinh: "kg", khoiLuongDat: 10 }],
  ...them,
});

/**
 * 🔴 THAY `fetch` BẰNG BẢN GIẢ CÓ ĐẾM — cố ý, và đây là chỗ bài kiểm này mạnh hơn `grep`.
 *
 * Không phải để tránh gọi mạng (bài kiểm không được gọi ra ngoài), mà để trả lời được câu hỏi
 * THẬT: *"app có THỰC SỰ gửi đi hay không"*. Chỉ đọc giá trị trả về thì một hàm bị sửa thành
 * `return { apDung: false }` vô điều kiện vẫn làm mọi bài kiểm chiều thuận xanh — trong khi luật
 * 20/08/2026 của phiên tích hợp (gửi PO công trình sang QLK CTR) đã chết sạch.
 */
const fetchThat = globalThis.fetch;
const daGoi = [];
globalThis.fetch = async (url, opt) => {
  daGoi.push({ url: String(url), body: opt?.body });
  return { ok: true, status: 200, json: async () => ({ ok: true }) };
};

/* Gọi trước, chờ xong, rồi mới chấm — `kiem` là hàm đồng bộ. */
const soGoiTruocPB = daGoi.length;
const kqPBCoDeNghi = await QLK.guiPOSangQlkCtr(poQlk(), dnQlk({ maHopDongCDT: "" }));
const soGoiSauPB = daGoi.length;

const soGoiTruocCT = daGoi.length;
const kqCTCoDeNghi = await QLK.guiPOSangQlkCtr(
  poQlk({ maHopDongCDT: "260001-HPCS-HDXD-001" }),
  dnQlk({ maHopDongCDT: "260001-HPCS-HDXD-001" }),
);
const soGoiSauCT = daGoi.length;

/* Chiều nghịch thứ hai: `loaiHoSo` khai rõ "cong_trinh" thì PHẢI gửi, kể cả khi thiếu hợp đồng
   CĐT — tầng ① của `laHoSoPhongBan` thắng phép suy ở tầng ②. */
const soGoiTruocCT2 = daGoi.length;
const kqCTKhaiRo = await QLK.guiPOSangQlkCtr(poQlk(), dnQlk({ maHopDongCDT: "", loaiHoSo: "cong_trinh" }));
const soGoiSauCT2 = daGoi.length;

const soGoiTruocDLPB = daGoi.length;
const kqDocLapPB = await QLK.guiPOSangQlkCtrDocLap(poQlk({ maHopDongCDT: "" }));
const soGoiSauDLPB = daGoi.length;

const soGoiTruocDLCT = daGoi.length;
const kqDocLapCT = await QLK.guiPOSangQlkCtrDocLap(poQlk({ maHopDongCDT: "260001-HPCS-HDXD-001" }));
const soGoiSauDLCT = daGoi.length;

globalThis.fetch = fetchThat;

const CHU_SEP_PB = 'Sếp · 15/09/2026 · "Đề xuất từ phòng ban thì ko cần gửi sang app kho"';
const CHU_TICH_HOP = "phiên tích hợp · 20/08/2026 (Việc 2) — chiều nghịch, đừng nới nhầm";

kiem(
  "PHONG BAN (co de nghi) -> guiPOSangQlkCtr tra KHONG AP DUNG, khong phai THAT BAI",
  CHU_SEP_PB,
  () => ({
    duoc: kqPBCoDeNghi?.apDung === false,
    thucTe: JSON.stringify(kqPBCoDeNghi),
    mongDoi:
      '{ apDung: false } — "không áp dụng" là đúng nghiệp vụ; "thất bại" là có lỗi cần xử, ' +
      "hai thứ khác hẳn nhau và chỉ cái sau mới bày cảnh báo vàng ra màn hình",
  }),
);

kiem(
  "PHONG BAN -> KHONG he goi API QLK CTR (dem so lan fetch)",
  CHU_SEP_PB,
  () => ({
    duoc: soGoiSauPB === soGoiTruocPB,
    thucTe: `${soGoiSauPB - soGoiTruocPB} lần gọi fetch`,
    mongDoi: "0 lần — bỏ qua NGAY, không gọi gì cả (hồ sơ phòng ban không gắn công trình nào)",
  }),
);

kiem(
  "PHONG BAN -> canDongBoLaiPO tra false (khong bi cham 'can gui lai' vinh vien)",
  CHU_SEP_PB,
  () => {
    const r = QLK.canDongBoLaiPO(poQlk(), dnQlk({ maHopDongCDT: "" }));
    return {
      duoc: r === false,
      thucTe: String(r),
      mongDoi: "false — cặp hàm này phải khớp `guiPOSangQlkCtr`, lệch nhau là vòng thử lại vô ích",
    };
  },
);

kiem(
  "CONG TRINH -> VAN GUI binh thuong (CHIEU NGHICH — noi nham la thu kho khong bao gio thay don)",
  CHU_TICH_HOP,
  () => ({
    duoc: kqCTCoDeNghi?.apDung === true && soGoiSauCT - soGoiTruocCT === 1,
    thucTe: `${JSON.stringify(kqCTCoDeNghi)} · ${soGoiSauCT - soGoiTruocCT} lần gọi fetch`,
    mongDoi: "apDung: true VÀ đúng 1 lần gọi /api/qlk-ctr/gui-po",
  }),
);

kiem(
  'CONG TRINH khai ro loaiHoSo="cong_trinh" nhung THIEU hop dong CDT -> VAN GUI',
  CHU_TICH_HOP,
  () => ({
    duoc: kqCTKhaiRo?.apDung === true && soGoiSauCT2 - soGoiTruocCT2 === 1,
    thucTe: `${JSON.stringify(kqCTKhaiRo)} · ${soGoiSauCT2 - soGoiTruocCT2} lần gọi fetch`,
    mongDoi:
      "apDung: true — người đề nghị tự khai là công trình thì tin lời khai, đừng để phép suy " +
      '"thiếu hợp đồng = phòng ban" cắt mất đường gửi',
  }),
);

kiem(
  "PO DOC LAP cua PHONG BAN (khong hop dong CDT) -> KHONG GUI",
  CHU_SEP_PB,
  () => ({
    duoc: kqDocLapPB?.apDung === false && soGoiSauDLPB === soGoiTruocDLPB,
    thucTe: `${JSON.stringify(kqDocLapPB)} · ${soGoiSauDLPB - soGoiTruocDLPB} lần gọi fetch`,
    mongDoi: "{ apDung: false } và 0 lần gọi — nhánh PO độc lập từng hở, vá 15/09/2026",
  }),
);

kiem(
  "PO DOC LAP cua CONG TRINH -> VAN GUI (CHIEU NGHICH cho nhanh doc lap)",
  CHU_TICH_HOP,
  () => ({
    duoc: kqDocLapCT?.apDung === true && soGoiSauDLCT - soGoiTruocDLCT === 1,
    thucTe: `${JSON.stringify(kqDocLapCT)} · ${soGoiSauDLCT - soGoiTruocDLCT} lần gọi fetch`,
    mongDoi:
      "apDung: true VÀ đúng 1 lần gọi /api/qlk-ctr/gui-po-doc-lap — luật 30/08/2026: hàng có thể " +
      "về công trình trước khi đề nghị kịp về, thủ kho phải có chỗ ghi nhập kho",
  }),
);

kiem(
  "laPOCuaHoSoPhongBan con duoc EXPORT (giao dien va vong dong bo dang goi nho no)",
  CHU_SEP_PB,
  () => {
    const co = typeof QLK.laPOCuaHoSoPhongBan === "function";
    const pb = co ? QLK.laPOCuaHoSoPhongBan(poQlk(), dnQlk({ maHopDongCDT: "" })) : null;
    const ct = co
      ? QLK.laPOCuaHoSoPhongBan(poQlk(), dnQlk({ maHopDongCDT: "260001-HPCS-HDXD-001" }))
      : null;
    return {
      duoc: co && pb === true && ct === false,
      thucTe: co ? `phòng ban=${pb} · công trình=${ct}` : "KHÔNG CÒN EXPORT",
      mongDoi:
        "export được, phòng ban=true, công trình=false — bỏ export thì `don-hang-chi-tiet.tsx` và " +
        "`kho-du-lieu.tsx` mất phép nhận diện chung, rồi mỗi nơi lại tự đoán một kiểu",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// BỘ HỒ SƠ THANH TOÁN — MỤC 4 LÀ **TỆP ĐƠN MUA HÀNG ĐÃ KÝ**, KHÔNG PHẢI TỜ IN
// Luật của: Sếp · 15/09/2026
// Nguyên văn (khoanh đỏ đúng mục 4 của khối "Bộ hồ sơ thanh toán" ở bước ⑧):
//   ***"Đây ko phải là link PO in. mà là file PO ký đính kèm đã đính kèm ở bước 4,
//      chỉ cần link xuống thôi"***
//
// 🔴 VÌ SAO PHẢI CÓ BÀI KIỂM MÁY: `grep "tepHopDong"` trong `bo-ho-so-thanh-toan.ts` XANH cả khi
//    mục 4 bị trả về tờ in như cũ — chuỗi đó vẫn còn ở mục 3. Chỉ phép gọi thật mới phân biệt được.
// ════════════════════════════════════════════════════════════════════

const CHU_SEP_PO_KY =
  'Sếp · 15/09/2026 — *"Đây ko phải là link PO in. mà là file PO ký đính kèm đã đính kèm ở bước 4, chỉ cần link xuống thôi"*';

/** Tệp đơn mua hàng NCC ký — cất ở ô dùng chung của bước ④/⑤ (`lap_don_mua_hang` + nhãn "Hợp đồng"). */
const tepPOKy = { id: "poky1", ten: "DMH260007-da-ky.pdf", ghiChu: "Hợp đồng" };

const dnBoHoSo = (tepBuoc4 = []) => ({
  id: "dn-bo-ho-so",
  tepGiaiDoan: tepBuoc4.length > 0 ? { lap_don_mua_hang: tepBuoc4 } : {},
});
const poBoHoSo = [{ id: "po1", code: "DMH260007" }];
/** Gọi hàm thật rồi lấy đúng mục 4. */
const muc4 = (deNghi, po = poBoHoSo) => {
  const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
  return BH.dungBoHoSoThanhToan(deNghi, po, [], []).find((m) => m.ma === "don_mua_hang");
};

/** Tệp đơn mua hàng NCC ký nằm ở NGĂN RIÊNG — khác hẳn `tepPOKy` (ngăn chung, nhãn "Hợp đồng"). */
const dnCoPORieng = {
  id: "dn-bo-ho-so",
  tepGiaiDoan: {
    don_mua_hang_ncc_ky: [{ id: "porieng1", ten: "DMH260007-da-ky.pdf", ghiChu: "Đơn mua hàng" }],
  },
};

kiem(
  "Muc 4 CO tep o NGAN RIENG -> bay dung tep do",
  CHU_SEP_PO_KY,
  () => {
    const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
    const m = muc4(dnCoPORieng);
    const dung = m?.tep?.length === 1 && m.tep[0].id === "porieng1" && BH.mucDaCo(m) === true;
    return {
      duoc: dung,
      thucTe: `tep=${JSON.stringify(m?.tep?.map((t) => t.id) ?? null)} · mucDaCo=${m ? BH.mucDaCo(m) : "KHONG CO MUC 4"}`,
      mongDoi: 'muc 4 tra ve tep cua ngan rieng "don_mua_hang_ncc_ky" va tinh la DA CO',
    };
  },
);

kiem(
  "Muc 4 TUYET DOI KHONG muon tep cua muc 3 (chieu nghich)",
  'Sếp · 16/09/2026 — anh muc 3 va muc 4 bay Y HET mot tep: *"Cai gi day, Hop dong va don mua hang la rieng biet ma"*',
  () => {
    /* 🔴🔴 BAI NAY GHI LAI MOT LOI DA XAY RA THAT, va hai moc cua no:
         · SANG 16/09/2026 — luc tach hai chung tu, moi tep cu deu nam chung o `lap_don_mua_hang`.
           Da chon cach "tep o ngan chung hien o CA HAI muc, kem ghi chu giai thich" de ho so cu
           khoi bao thieu hang loat. Y do CHUA TUNG DUOC SEP DUYET — dua thang vao ma nguon roi
           moi bao cao sau. Bai kiem cu o cho nay ghi dung luat do.
         · CHIEU 16/09/2026 — Sep gui anh muc 3 va muc 4 bay cung mot tep 303 KB va bat loi.
       👉 Day la SUA MOT VIEC LAM SAI, khong phai doi y: Sep da chot *"Tach lam 2 muc rieng"* tu
          truoc, ma hai muc bay chung mot tep thi co tach gi dau.
       ⚠️ Hau qua neu de nguyen: bo ho so giao Ke toan co HAI dong chung tu khac ten tro vao CUNG
          mot to giay — nguoi doi chieu khong cach nao biet to do la hop dong hay don mua hang. */
    const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
    const ds = BH.dungBoHoSoThanhToan(dnBoHoSo([tepPOKy]), poBoHoSo, [], []);
    const m3 = ds.find((m) => m.ma === "hop_dong");
    const m4 = ds.find((m) => m.ma === "don_mua_hang");
    const id3 = (m3?.tep ?? []).map((t) => t.id);
    const id4 = (m4?.tep ?? []).map((t) => t.id);
    const trung = id4.filter((x) => id3.includes(x));
    return {
      duoc: id3.length === 1 && id3[0] === "poky1" && id4.length === 0 && trung.length === 0,
      thucTe: `muc3=${JSON.stringify(id3)} · muc4=${JSON.stringify(id4)}${trung.length ? ` · TRUNG TEP: ${trung.join(", ")}` : ""}`,
      mongDoi:
        "tep o ngan chung chi thuoc MUC 3; muc 4 rong va bao thieu — khong tep nao xuat hien o ca hai muc",
    };
  },
);

kiem(
  "Muc 4 CHUA co tep du DA LAP PO -> bao THIEU va chi dung cho dinh",
  CHU_SEP_PO_KY,
  () => {
    /* 🔴 CHIỀU QUAN TRỌNG NHẤT. Trước 15/09/2026 mục 4 xanh ngay khi có đơn trong app (đếm
       `chungTuTrongApp`). Ai khôi phục cách đếm đó thì bài "có tệp" phía trên vẫn xanh, chỉ bài
       này bắt được — và hậu quả là bộ giao Kế toán báo đủ trong khi chưa có tờ chứng từ nào. */
    const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
    const m = muc4(dnBoHoSo([]));
    const chuaCo = m ? BH.mucDaCo(m) === false : false;
    const chiDuongDu =
      typeof m?.ghiChu === "string" &&
      /DMH260007/.test(m.ghiChu) &&
      /đặt hàng|Lập đơn mua hàng/i.test(m.ghiChu);
    return {
      duoc: chuaCo && chiDuongDu,
      thucTe: `mucDaCo=${m ? BH.mucDaCo(m) : "KHONG CO MUC 4"} · ghiChu="${String(m?.ghiChu ?? "(trống)").slice(0, 110)}"`,
      mongDoi:
        "mucDaCo=false VA cau nhac vua noi da lap don nao vua chi dung o dinh kem — de trong la " +
        "nguoi dung khong biet phai lam gi (CLAUDE.md §3.5)",
    };
  },
);

kiem(
  "Muc 4 KHONG con lien ket to in `/in/don-hang/{id}` o bat ky dau",
  CHU_SEP_PO_KY,
  () => {
    /* 🔴 CHIỀU NGHỊCH VỀ QUYỀN XEM GIÁ — đọc kỹ trước khi sửa bài này.
       Liên kết tờ in cũ được gác bằng prop `xemGia` vì tờ in CÓ ĐƠN GIÁ. Gác đó nay không còn
       chỗ nào để gác, vì liên kết đã bỏ. Ai dựng lại liên kết in trong dữ liệu mục 4 mà quên gác
       thì vai trò không được xem giá mở được tờ in — lỗi nặng hơn hẳn việc trỏ sai tệp.
       👉 Bài này đỏ nghĩa là: hoặc bỏ liên kết đi, hoặc gác lại `xemGia` ở nơi vẽ. Đừng sửa bài
          kiểm cho vừa mã nguồn. */
    const m = muc4(dnBoHoSo([tepPOKy]));
    const chuoi = JSON.stringify(m ?? {});
    const sach = !/\/in\/don-hang/.test(chuoi) && !("chungTuTrongApp" in (m ?? {}));
    return {
      duoc: sach,
      thucTe: sach ? "sach (khong co duong dan in, khong co chungTuTrongApp)" : chuoi.slice(0, 160),
      mongDoi:
        "muc 4 khong chua `/in/don-hang/...` va khong con truong `chungTuTrongApp` — to in con hai " +
        "duong vao khac (nut In don mua hang o don-hang-chi-tiet, nut Cat va In o don-hang-lap-moi) " +
        "nen bo o day khong lam no mo coi",
    };
  },
);

kiem(
  "Tep o buoc ④ mang NHAN KHAC -> KHONG tinh la don mua hang da ky",
  CHU_SEP_PO_KY,
  () => {
    /* Chống nới thành "có tệp nào ở bước ④ cũng được": khu đính kèm bước ④ còn chứa biên bản,
       CO/CQ… Nới ra là bộ hồ sơ báo đủ trong khi chưa có tờ đơn ký nào. */
    const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
    const m = muc4(dnBoHoSo([{ id: "bb1", ten: "bien-ban.pdf", ghiChu: "Biên bản làm việc" }]));
    return {
      duoc: m ? BH.mucDaCo(m) === false : false,
      thucTe: `mucDaCo=${m ? BH.mucDaCo(m) : "KHONG CO MUC 4"} · tep=${JSON.stringify(m?.tep?.map((t) => t.id) ?? null)}`,
      mongDoi: "false — chi tep mang dung nhan luu NHAN_TEP_HOP_DONG moi la don mua hang da ky",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// 🔴 HỢP ĐỒNG DỮ LIỆU VỚI APP KẾ TOÁN ĐÃ ĐỔI **8 → 9 KHOÁ** NGÀY 16/09/2026.
//
// · Bài kiểm này tới 15/09/2026 mang tên *"dungBoHoSoThanhToan VAN tra DU 8 MUC, dung 8 khoa"* và
//   đòi đúng 8 khoá, `stt` 1..8. Mục 9 *Đính kèm khác* khi ấy CỐ Ý chưa dựng, vì bước ⑧ không có ô
//   đính tệp tự do nào (dựng ra là một dòng vĩnh viễn trống — CLAUDE.md §3.5).
// · Sếp 16/09/2026: ***"Cần thiết mở thêm để đính kèm tài liệu khác"*** → mục 9 được dựng, có ngăn
//   riêng `dinh_kem_khac` và khu đính kèm tự do thật.
//
// 👉 Đây là **THÊM một khoá**, không phải đổi khoá: 8 khoá cũ giữ nguyên từng chữ và đúng thứ tự,
//    nên bên nhận cũ vẫn đọc được. Bài kiểm vì vậy kiểm CẢ HAI: đủ 9 khoá, VÀ 8 khoá đầu y nguyên.
// ════════════════════════════════════════════════════════════════════

kiem(
  "dungBoHoSoThanhToan tra DU 9 MUC, dung 9 khoa (hop dong du lieu voi app Ke toan)",
  "Ban lãnh đạo 26/08/2026 + Sếp 15/09/2026 + Sếp 16/09/2026 (*\"Can thiet mo them de dinh kem tai lieu khac\"* — doi 8 → 9 khoa)",
  () => {
    /* 🔴 CHIỀU NGHỊCH CỦA CẢ LƯỢT SỬA: việc bỏ ô nộp hợp đồng ở bước ⑧ và việc tách hai chứng từ là
       việc HIỂN THỊ / NGĂN LƯU; ai nhân đà "dọn cho gọn" ở tầng dữ liệu thì bên nhận mất một khoá
       mà KHÔNG CÓ GÌ BÁO — đúng loại lỗi cả tệp `bo-ho-so-thanh-toan.ts` sinh ra để tránh. */
    const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
    const ds = BH.dungBoHoSoThanhToan(dnBoHoSo([tepPOKy]), poBoHoSo, [], []);
    const khoa = ds.map((m) => m.ma);
    const mongDoi = [
      "phieu_de_nghi",
      "bao_gia_ncc",
      "hop_dong",
      "don_mua_hang",
      "phieu_giao_hang",
      "hoa_don_vat",
      "unc",
      "phieu_chi",
      "dinh_kem_khac",
    ];
    const stt = ds.map((m) => m.stt).join(",");
    return {
      duoc:
        khoa.length === 9 && khoa.every((k, i) => k === mongDoi[i]) && stt === "1,2,3,4,5,6,7,8,9",
      thucTe: `${khoa.length} mục: ${khoa.join(" · ")} (stt ${stt})`,
      mongDoi: `9 mục đúng thứ tự: ${mongDoi.join(" · ")} (stt 1..9)`,
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// TÁCH "HỢP ĐỒNG" VÀ "ĐƠN MUA HÀNG" THÀNH HAI CHỨNG TỪ RIÊNG
// Luật của: Sếp · 16/09/2026 — nguyên văn ***"Tách làm 2 mục riêng"***.
//
// 🔴 CÁI BẪY LỚN NHẤT LÀ **DỮ LIỆU CŨ**, và đó là thứ khối bài kiểm này canh. Tới hết 15/09/2026
//    app dùng MỘT ô, MỘT tệp cho cả hai chứng từ (ngăn `lap_don_mua_hang`, nhãn "Hợp đồng"). Gán
//    tệp cũ đó cho một mục thì mục kia đột nhiên báo thiếu trên TOÀN BỘ hồ sơ đang chạy — hàng loạt
//    dấu đỏ mọc lên mà không ai làm gì sai.
//
// ✅ LUẬT SẾP CHỐT: tệp ở **ngăn chung cũ** hiện ở CẢ HAI mục, kèm ghi chú nói rõ; hồ sơ mới nộp
//    riêng vào ngăn của nó, và **tệp riêng thắng**. Phân biệt bằng **KHOÁ NGĂN**, không bằng ngày.
// ════════════════════════════════════════════════════════════════════

const CHU_SEP_TACH = 'Sếp · 16/09/2026 — *"Tách làm 2 mục riêng"*';
/** Tệp Ở NGĂN CHUNG CŨ — đúng thứ mọi hồ sơ trước 16/09/2026 đang có. */
const tepChungCu = { id: "chung1", ten: "HD-DMH260007.pdf", ghiChu: "Hợp đồng" };
/** Tệp ở NGĂN RIÊNG MỚI của đơn mua hàng. */
const tepPORieng = { id: "poRieng1", ten: "DMH260007-NCC-ky.pdf", ghiChu: "Đơn mua hàng" };

const dsBoHoSo = (tepGiaiDoan) => {
  const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
  return BH.dungBoHoSoThanhToan(
    { id: "dn-tach", tepGiaiDoan, lichSu: [] },
    poBoHoSo,
    [],
    [],
  );
};
const mucTheoMa = (tepGiaiDoan, ma) => dsBoHoSo(tepGiaiDoan).find((m) => m.ma === ma);

kiem(
  "HO SO CU (chi co tep o NGAN CHUNG) -> CHI muc 3 thay tep do, muc 4 bao THIEU",
  'Sếp · 16/09/2026 (chieu) — *"Cai gi day, Hop dong va don mua hang la rieng biet ma"*',
  () => {
    /* 🔴🔴 BAI NAY DA BI VIET LAI, VA PHAI NOI RO DE KHONG AI TUONG LA SUA BAI KIEM CHO VUA MA
       NGUON. Ban cu ten *"CA HAI muc deu thay tep do"*, ghi lai cach xu du lieu cu chon sang
       16/09/2026: tep o ngan chung hien o CA HAI muc kem ghi chu "dang dung chung".

       👉 Cach do CHUA TUNG DUOC SEP DUYET — no la de xuat noi bo dua thang vao ma nguon roi moi
          bao cao. Chieu cung ngay Sep gui anh muc 3 va muc 4 bay Y HET mot tep 303 KB va bat loi:
          Sep da chot *"Tach lam 2 muc rieng"* tu truoc, ma hai muc bay chung mot tep thi khong
          con la tach nua.

       ⚠️ CAI GIA DA CAN NHAC: ho so cu gio bao THIEU o muc 4. Do la SU THAT — ho thuc su chua nop
       ban don NCC ky rieng — va dung tinh than Sep chot cung ngay: *"PO la chac chan co, chi la bo
       sung sau thoi"*. To da dinh KHONG MAT: no van nam dung o muc 3. */
    const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
    const tg = { lap_don_mua_hang: [tepChungCu] };
    const m3 = mucTheoMa(tg, "hop_dong");
    const m4 = mucTheoMa(tg, "don_mua_hang");
    const id3 = (m3?.tep ?? []).map((t) => t.id);
    const id4 = (m4?.tep ?? []).map((t) => t.id);
    return {
      duoc:
        id3.length === 1 &&
        id3[0] === "chung1" &&
        BH.mucDaCo(m3) === true &&
        id4.length === 0 &&
        BH.mucDaCo(m4) === false,
      thucTe: `muc3=${JSON.stringify(id3)} · muc4=${JSON.stringify(id4)} · muc4DaCo=${m4 ? BH.mucDaCo(m4) : "?"}`,
      mongDoi: 'chi muc 3 thay "chung1"; muc 4 rong va mucDaCo=false',
    };
  },
);

kiem(
  "HO SO MOI (co tep RIENG o ngan moi) -> TEP RIENG THANG, muc 4 thoi hien tep chung",
  CHU_SEP_TACH,
  () => {
    /* 🔴 CHIEU NGHICH. Khong co luat "tep rieng thang" thi ho so da nop dung ban don NCC ky van keo
       theo to hop dong vao muc 4 — hai to khac nhau cho mot muc, khong ai biet to nao dung. */
    const tg = {
      lap_don_mua_hang: [tepChungCu],
      don_mua_hang_ncc_ky: [tepPORieng],
    };
    const m3 = mucTheoMa(tg, "hop_dong");
    const m4 = mucTheoMa(tg, "don_mua_hang");
    const id4 = (m4?.tep ?? []).map((t) => t.id);
    return {
      duoc:
        id4.length === 1 &&
        id4[0] === "poRieng1" &&
        (m3?.tep ?? []).some((t) => t.id === "chung1") === true &&
        /* Khong con ghi chu "dung chung" khi da co ban rieng. */
        !/d[ùu]ng chung/i.test(String(m4?.ghiChu ?? "")),
      thucTe: `muc4=${JSON.stringify(id4)} · muc3=${JSON.stringify((m3?.tep ?? []).map((t) => t.id))} · ghiChu4="${String(m4?.ghiChu ?? "(trong)").slice(0, 70)}"`,
      mongDoi:
        'muc 4 CHI hien "poRieng1" (tep rieng thang), muc 3 van giu "chung1", va khong con ghi chu "dung chung"',
    };
  },
);

kiem(
  "HAI NGAN DOC LAP: tep rieng cua muc 4 KHONG lot sang muc 3",
  CHU_SEP_TACH,
  () => {
    /* Chieu nghich cua phep tach: neu `tepHopDong` bi noi de "doc ca ngan moi cho chac" thi ho so
       chi co ban don NCC ky bong nhien duoc coi la CO HOP DONG — va cua dong ho so mo ra ma khong
       co to hop dong nao. */
    const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
    const tg = { don_mua_hang_ncc_ky: [tepPORieng] };
    const m3 = mucTheoMa(tg, "hop_dong");
    const m4 = mucTheoMa(tg, "don_mua_hang");
    return {
      duoc: BH.mucDaCo(m3) === false && BH.mucDaCo(m4) === true,
      thucTe: `muc3.daCo=${m3 ? BH.mucDaCo(m3) : "?"} · muc4.daCo=${m4 ? BH.mucDaCo(m4) : "?"}`,
      mongDoi: "muc3=false, muc4=true — hai ngan hoan toan doc lap",
    };
  },
);

kiem(
  "coHopDong KHONG duoc dem tep o ngan rieng cua don mua hang",
  CHU_SEP_TACH,
  () => {
    /* 🔴 Cung mot noi dung nhu bai tren nhung do o TANG LUAT — day moi la cho mo cua dong ho so. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const dn = { id: "x", tepGiaiDoan: { don_mua_hang_ncc_ky: [tepPORieng] }, lichSu: [] };
    return {
      duoc: CT.coHopDong(dn) === false && CT.coDonMuaHangNCCKy(dn) === true,
      thucTe: `coHopDong=${CT.coHopDong(dn)} · coDonMuaHangNCCKy=${CT.coDonMuaHangNCCKy(dn)}`,
      mongDoi: "coHopDong=false, coDonMuaHangNCCKy=true",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LỜI KHAI "CHƯA CÓ CHỨNG TỪ" SAU KHI TÁCH — MỖI MỤC MỘT KHOÁ, VÀ PO KHÔNG CÓ LỜI KHAI DỨT ĐIỂM
// Luật của: Sếp · 16/09/2026 — ***"PO là chắc chắn có, chỉ là bổ sung sau thôi. Kiểm tra lại và
// điều chỉnh"*** (sửa lỗi: mục Đơn mua hàng đang hiện câu "đơn này không có hợp đồng riêng").
// ════════════════════════════════════════════════════════════════════

const CHU_SEP_PO_LUON_CO =
  'Sếp · 16/09/2026 — *"PO là chắc chắn có, chỉ là bổ sung sau thôi. Kiểm tra lại và điều chỉnh"*';

const khaiCua = (khoa, lyDo, tepGiaiDoan = {}) => {
  const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
  const dn = { id: "dn-khai", tepGiaiDoan, lyDoThieuChungTu: { [khoa]: lyDo }, lichSu: [] };
  const ds = BH.dungBoHoSoThanhToan(dn, poBoHoSo, [], []);
  return { BH, dn, ds };
};

kiem(
  "MUC 3 ghi chu 'Khong co HD' -> ket_luan, KHONG bao do, va NOI RO la GHI CHU cua nguoi dung",
  'Sếp · 16/09/2026 — *"phai co ghi chu va duoc link xuong muc 8"*',
  () => {
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const { BH, dn, ds } = khaiCua(KHOA_HD, CT.LY_DO_KHONG_CO_HOP_DONG);
    const m3 = ds.find((m) => m.ma === "hop_dong");
    const k = BH.loiKhaiThieuChungTu(dn, m3);
    return {
      duoc:
        k.loai === "ket_luan" &&
        k.baoDo === false &&
        /ghi ch[úu] c[ủu]a ng[ưu][ờo]i d[ùu]ng/i.test(k.chu) &&
        /đi[ềe]u ki[ệe]n đ[ủu]/i.test(k.chu),
      thucTe: `loai=${k.loai} · baoDo=${k.baoDo} · chu="${k.chu.slice(0, 130)}"`,
      mongDoi:
        'ket_luan, khong do, cau noi ro "theo ghi chu cua nguoi dung" VA "dieu kien du de dong ho so"',
    };
  },
);

kiem(
  "MUC 3 ghi chu NEU RA TEN NGUOI KHAI khi nhat ky tra duoc",
  'Sếp · 16/09/2026 — *"phai co ghi chu"*, va ghi chu phai noi duoc AI da khai',
  () => {
    /* 🔴 Cau nhat ky dung boi CHINH ham thuan `cauNhatKyGhiLyDoThieu` — cung ham ma
       `kho-du-lieu.tsx` dung de GHI. Hai ben go tay hai cau la cho doc khong bao gio khop cho ghi,
       va no hong IM LANG (chi mat chu "(do ... khai)"). */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
    const dn = {
      id: "dn-ai-khai",
      tepGiaiDoan: {},
      lyDoThieuChungTu: { [KHOA_HD]: CT.LY_DO_KHONG_CO_HOP_DONG },
      lichSu: [
        {
          thoiDiem: "2026-09-16T01:00:00.000Z",
          nguoiThucHien: "Nguyễn Văn A",
          hanhDong: CT.cauNhatKyGhiLyDoThieu(
            CT.TEN_HIEN_HOP_DONG,
            CT.LY_DO_KHONG_CO_HOP_DONG,
          ),
        },
      ],
    };
    const m3 = BH.dungBoHoSoThanhToan(dn, poBoHoSo, [], []).find((m) => m.ma === "hop_dong");
    const k = BH.loiKhaiThieuChungTu(dn, m3);
    return {
      duoc: /Nguy[ễe]n V[ăa]n A/.test(k.chu),
      thucTe: `"${k.chu.slice(0, 150)}"`,
      mongDoi: 'cau ghi chu co ten "Nguyễn Văn A"',
    };
  },
);

kiem(
  "🔴 MUC 4 KHONG BAO GIO co trang thai trung tinh — chua co tep thi LUON BAO DO",
  CHU_SEP_PO_LUON_CO,
  () => {
    /* 🔴🔴 BAI KIEM SUA MOT LOI THAT SEP BAT DUOC. Truoc khi tach, muc 4 dung CHUNG truong ly do
       voi muc 3, nen ho so khai "Khong co HD" lam muc DON MUA HANG hien cau "don nay khong co hop
       dong rieng, khong phai thieu sot" — vua sai chung tu, vua tat mat dau do cua mot to CHAC CHAN
       phai co. Ai them lai mot loi khai dut diem cho muc 4 thi bai nay do ngay. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
    /* Thu ca hai chuoi: "Bo sung sau" (dung) va "Khong co HD" (chuoi la doi voi muc 4). */
    const ket = [CT.LY_DO_BO_SUNG_SAU, CT.LY_DO_KHONG_CO_HOP_DONG].map((lyDo) => {
      const { dn, ds } = khaiCua(CT.KHOA_LY_DO_THIEU_DON_MUA_HANG, lyDo);
      const m4 = ds.find((m) => m.ma === "don_mua_hang");
      return BH.loiKhaiThieuChungTu(dn, m4);
    });
    return {
      duoc: ket.every((k) => k.loai === "con_no" && k.baoDo === true),
      thucTe: ket.map((k) => `${k.loai}/baoDo=${k.baoDo}`).join(" · "),
      mongDoi:
        "ca hai deu con_no + baoDo=true — PO luon phai co, chi co the 'bo sung sau', khong co ca 'khong co PO'",
    };
  },
);

kiem(
  "HAI MUC KHAI DOC LAP: khai o muc 3 KHONG lam muc 4 doi trang thai",
  CHU_SEP_TACH,
  () => {
    /* Truoc 16/09/2026 hai muc dung chung mot truong nen hien GIONG HET nhau. Bai nay canh dung
       cho do: ai gan lai `KHOA_LY_DO_THIEU_THEO_MUC` ve mot khoa chung la do. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
    const { dn, ds } = khaiCua(KHOA_HD, CT.LY_DO_KHONG_CO_HOP_DONG);
    const k3 = BH.loiKhaiThieuChungTu(dn, ds.find((m) => m.ma === "hop_dong"));
    const k4 = BH.loiKhaiThieuChungTu(dn, ds.find((m) => m.ma === "don_mua_hang"));
    return {
      duoc: k3.loai === "ket_luan" && k4.loai === "chua_khai",
      thucTe: `muc3=${k3.loai} · muc4=${k4.loai}`,
      mongDoi: "muc3=ket_luan, muc4=chua_khai — hai khoa hoan toan doc lap",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// MỤC 9 "ĐÍNH KÈM KHÁC" — Sếp · 16/09/2026: ***"Cần thiết mở thêm để đính kèm tài liệu khác"***
//
// 🔴 ĐIỀU KIỆN SỐNG CÒN: **NGĂN RIÊNG**. Dùng lại ngăn `ho_so_thanh_toan` thì nút "Gỡ" của khu tự
//    do xoá được **Hoá đơn VAT thật** → hồ sơ không đóng được nữa.
// ════════════════════════════════════════════════════════════════════

const CHU_SEP_MUC9 = 'Sếp · 16/09/2026 — *"Cần thiết mở thêm để đính kèm tài liệu khác"*';

kiem(
  "Muc 9 doc NGAN RIENG `dinh_kem_khac`, KHONG dung ngan `ho_so_thanh_toan`",
  CHU_SEP_MUC9,
  () => {
    /* 🔴 BAI KIEM QUAN TRONG NHAT CUA MUC 9. Neu ai tro muc 9 vao ngan `ho_so_thanh_toan` thi
       Hoa don VAT / UNC / Phieu chi se hien LAI trong muc 9 — va nut "Go" cua khu tu do xoa duoc
       chinh Hoa don VAT that. */
    const tg = {
      ho_so_thanh_toan: [
        { id: "v1", ten: "vat.pdf", ghiChu: "Hóa đơn VAT" },
        { id: "u1", ten: "unc.pdf", ghiChu: "Ủy nhiệm chi" },
      ],
      dinh_kem_khac: [{ id: "co1", ten: "CO-CQ.pdf" }],
    };
    const m9 = mucTheoMa(tg, "dinh_kem_khac");
    const id9 = (m9?.tep ?? []).map((t) => t.id);
    return {
      duoc: id9.length === 1 && id9[0] === "co1",
      thucTe: `muc9=${JSON.stringify(id9)}`,
      mongDoi: 'CHI "co1" — tuyet doi khong duoc thay "v1" (Hoa don VAT) hay "u1" (UNC)',
    };
  },
);

kiem(
  "Muc 9 KHONG duoc tinh vao phep dem bat buoc (tong van la 4)",
  CHU_SEP_MUC9,
  () => {
    /* 🔴 CHIEU NGHICH. Bat `batBuoc: true` cho muc 9 thi MOI ho so trong app deu bao con thieu mot
       muc — chot luc nao cung do thi nguoi dung bo qua ca khoi. */
    const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
    const ds = dsBoHoSo({});
    const m9 = ds.find((m) => m.ma === "dinh_kem_khac");
    const tt = BH.tomTatBoHoSo(ds);
    const batBuoc = ds.filter((m) => m.batBuoc).map((m) => m.ma);
    return {
      duoc: m9?.batBuoc === false && tt.tong === 4,
      thucTe: `muc9.batBuoc=${m9?.batBuoc} · tong=${tt.tong} · cac muc bat buoc: ${batBuoc.join(", ")}`,
      mongDoi:
        "muc9.batBuoc=false va tong=4 (bao gia NCC · hop dong · don mua hang · phieu giao hang)",
    };
  },
);

kiem(
  "Muc 9 dung O NOP CO TEN nhu moi muc khac — GIAO DIEN DONG BO",
  CHU_SEP_MUC9,
  () => {
    /* Quyet dinh bo cuc nam o ham thuan `kieuONop` chu khong phai `if` trong JSX — nho vay bai kiem
       nay goi THAT duoc (CLAUDE.md §6.6: grep dau moc khong bat duoc viec xoa code). */
    const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
    return {
      duoc:
        /* 🔴🔴 DOI TU `khu_tu_do` SANG `o_co_ten` — VA DAY LA DOI YEU CAU, khong phai sua bai
           kiem cho vua ma nguon. Hai moc:
             · 16/09/2026 (sang) — Sep mo muc 9: *"Can thiet mo them de dinh kem tai lieu khac"*.
               Luc do chon khu tu do vi muc 9 nhan tai lieu gi cung duoc, khong co nhan co dinh.
             · 16/09/2026 (dem) — Sep khoanh do dung muc 9: *"Dong bo lai giao dien dinh kem cho
               giong nhau, sao muc nay dinh kem giao dien lai khac cac buoc kia"*.
           👉 Ly le cu khong sai ve ky thuat, nhung cai gia la muc 9 bay ra mot giao dien THU HAI
              giua danh sach 9 muc — va do moi la thu nguoi dung nhin thay. "Nhan co dinh" hoa ra
              khong phai van de: `OChungTuBatBuoc` tu danh so ban thu hai tro di. */
        BH.kieuONop("dinh_kem_khac") === "o_co_ten" &&
        /* 🔴🔴 `don_mua_hang` DOI TU `o_co_ten` SANG `khong` — VA DAY LA DOI YEU CAU, KHONG PHAI
           SUA BAI KIEM CHO VUA MA NGUON. Hai moc, ca hai deu cua Sep, cach nhau vai gio:
             · SANG 16/09/2026 — *"Tach lam 2 muc rieng"*, kem yeu cau o nop rieng cho Don mua
               hang *"o buoc ⑤ va o buoc ⑧ (dong so 4)"*  => luc do dung la `o_co_ten`.
             · CHIEU 16/09/2026 — Sep xem giao dien that, khoanh do dung nut vang o dong 4:
               *"Muc nay cung la link tu buoc lap don mua hang xuong, chu ko phai dinh kem o day ·
               Lam tuong tu nhu phan hop dong"*  => nay la `khong`.
           👉 O nop KHONG mat: no van o buoc ⑤ (`BUOC_DINH_KEM_DON_MUA_HANG`). Bo o o buoc ⑧ la bo
           duong THU HAI toi cung mot tep, dung nhu da lam voi Hop dong. */
        BH.kieuONop("don_mua_hang") === "khong" &&
        /* 🔴 HOP DONG THOI CO O NOP O BUOC ⑧ — Sep 16/09/2026: *"Bo nut dinh kem nay, hop dong se
           duoc link tu buoc 3 xuong"*. */
        BH.kieuONop("hop_dong") === "khong" &&
        BH.kieuONop("phieu_giao_hang") === "khong",
      thucTe: ["dinh_kem_khac", "don_mua_hang", "hop_dong", "phieu_giao_hang"]
        .map((m) => `${m}=${BH.kieuONop(m)}`)
        .join(" · "),
      mongDoi:
        "dinh_kem_khac=o_co_ten (Sep 16/09 DEM: dong bo giao dien) · don_mua_hang=khong · hop_dong=khong · phieu_giao_hang=khong",
    };
  },
);

kiem(
  "MUC 1 KHONG mang nhan 'Neu co', nhung `batBuoc` VAN la false va KHONG bi dem",
  'Sếp · 16/09/2026 — khoanh do dung nhan xam canh muc 1 va ghi *"Bo ghi chu nay"*',
  () => {
    /* 🔴🔴 CHIEU NGHICH QUAN TRONG NHAT CUA VIEC NAY. Cach "don cho gon" sai la sua `batBuoc` cua
       muc 1 de nhan bien mat — lam vay la muc 1 thanh BAT BUOC, `tong` nhay 4 → 5, va MOI ho so
       that deu bao con thieu mot muc (app khong giu ban sao tep phieu de nghi nen dieu kien do
       khong bao gio dat duoc). */
    const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
    const ds = dsBoHoSo({});
    const m1 = ds.find((m) => m.ma === "phieu_de_nghi");
    const tt = BH.tomTatBoHoSo(ds);
    /* Muc 7 · 8 · 9 GIU NGUYEN nhan — Sep khong khoanh chung, va o do nhan dung nghia. */
    const conGiu = ["unc", "phieu_chi", "dinh_kem_khac"].every((ma) =>
      BH.hienNhanNeuCo(ds.find((m) => m.ma === ma)),
    );
    return {
      duoc: BH.hienNhanNeuCo(m1) === false && m1?.batBuoc === false && tt.tong === 4 && conGiu,
      thucTe: `muc1: hienNhan=${BH.hienNhanNeuCo(m1)} batBuoc=${m1?.batBuoc} · tong=${tt.tong} · muc 7/8/9 con nhan=${conGiu}`,
      mongDoi:
        "muc1 khong ve nhan nhung batBuoc=false va tong=4; muc 7 · 8 · 9 VAN co nhan (Sep khong khoanh chung)",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// CHỐNG DỘI SANG QLK CTR & GOM LẦN GHI KHO CHUNG
// Chỉ đạo Sếp 15/09/2026 + phân tích của đội QLK CTR cùng ngày.
//
// Nguyên văn phần đề nghị của QLK CTR: *"Cách sửa (bên App Thu Mua): thêm giới hạn/độ trễ giữa
// các lần tự động gửi lại, và/hoặc chỉ cho phép 1 lượt gửi lại tại 1 thời điểm (không gửi chồng
// lên chính nó khi lượt trước chưa xong)."* Ba đơn kẹt lúc đó: DMH260005, DMH260007, DMH260009.
//
// 🔴 CHIỀU NGHỊCH LÀ PHẦN QUAN TRỌNG NHẤT Ở ĐÂY. Ai sửa mấy hàm này thành "luôn luôn chặn" thì
// bài kiểm chiều thuận vẫn xanh hết, mà PO lỗi tạm thời (mạng chập chờn) sẽ **không bao giờ tự
// hồi phục** — trong khi toàn bộ cơ chế thử lại sinh ra là để lo đúng ca đó. Mỗi luật dưới đây
// đều có bài kiểm cả hai chiều.
// ════════════════════════════════════════════════════════════════════

const CHU_NHIP = "Sếp 15/09/2026 + đội QLK CTR cùng ngày";
const PHUT = 60_000;
const GIO = 3_600_000;

kiem(
  "khoangChoThuLai(0) = 0 — CHƯA thử lần nào thì gửi NGAY, không bắt chờ",
  CHU_NHIP,
  () => {
    const r = NH.khoangChoThuLai(0);
    return {
      duoc: r === 0,
      thucTe: `${r}ms`,
      mongDoi: "0ms (lần gửi đầu tiên không được bị độ trễ chặn)",
    };
  },
);

kiem(
  "khoangChoThuLai(1) = 1 phút — hỏng một lần rồi thì lần sau phải chờ",
  CHU_NHIP,
  () => {
    const r = NH.khoangChoThuLai(1);
    return { duoc: r === PHUT, thucTe: `${r}ms`, mongDoi: `${PHUT}ms (1 phút)` };
  },
);

kiem(
  "Khoảng chờ TĂNG DẦN nghiêm ngặt qua các bậc (1 → 2 → 3 → 4)",
  CHU_NHIP,
  () => {
    const ds = [1, 2, 3, 4].map((n) => NH.khoangChoThuLai(n));
    const tang = ds.every((v, i) => i === 0 || v > ds[i - 1]);
    return {
      duoc: tang && ds[0] === PHUT,
      thucTe: ds.map((v) => `${Math.round(v / 1000)}s`).join(" → "),
      mongDoi: "mỗi bậc phải LỚN HƠN bậc trước (1 phút → 5 phút → 30 phút → 2 giờ)",
    };
  },
);

kiem(
  "Khoảng chờ CÓ TRẦN — hỏng 99 lần cũng không chờ quá 2 giờ",
  CHU_NHIP,
  () => {
    const r = NH.khoangChoThuLai(99);
    return {
      duoc: r === NH.khoangChoThuLai(4) && r <= 2 * GIO,
      thucTe: `${r}ms`,
      mongDoi: `bằng bậc cuối (${2 * GIO}ms = 2 giờ), không tăng vô hạn`,
    };
  },
);

kiem(
  "duocThuLaiQlkCtr(chưa có mốc) = TRUE — PO mới lỗi lần đầu phải được thử ngay",
  CHU_NHIP,
  () => {
    const r = NH.duocThuLaiQlkCtr(undefined, 1_000_000);
    return { duoc: r === true, thucTe: String(r), mongDoi: "true" };
  },
);

kiem(
  "Vừa thử xong (chưa hết 1 phút) → CHẶN, không cho dội tiếp",
  CHU_NHIP,
  () => {
    const bayGio = 1_000_000;
    const r = NH.duocThuLaiQlkCtr({ soLanDaThu: 1, lanCuoi: bayGio - 5_000 }, bayGio);
    return {
      duoc: r === false,
      thucTe: String(r),
      mongDoi: "false (mới 5 giây, bậc 1 đòi 1 phút) — đây là chốt ngăn dội vào QLK CTR",
    };
  },
);

kiem(
  "Đã QUÁ hạn chờ → CHO thử lại (cơ chế tự hồi phục còn sống)",
  CHU_NHIP,
  () => {
    const bayGio = 1_000_000;
    const r = NH.duocThuLaiQlkCtr({ soLanDaThu: 1, lanCuoi: bayGio - 2 * PHUT }, bayGio);
    return { duoc: r === true, thucTe: String(r), mongDoi: "true (đã 2 phút > 1 phút)" };
  },
);

kiem(
  "🔴 CHIỀU NGHỊCH: duocThuLaiQlkCtr KHÔNG ĐƯỢC 'luôn luôn chặn' — kể cả bậc cao nhất",
  CHU_NHIP,
  () => {
    /* 🔴 BÀI KIỂM QUAN TRỌNG NHẤT CỦA CẢ KHỐI NÀY. Sửa hàm thành `return false` vô điều kiện
       thì mọi bài kiểm chiều thuận ở trên vẫn xanh (chúng chỉ đòi "có chặn"), mà PO lỗi tạm thời
       vì mạng chập chờn sẽ kẹt VĨNH VIỄN — thủ kho không bao giờ thấy đơn, và KHÔNG CÓ GÌ BÁO.
       Đây đúng là ca mà toàn bộ cơ chế thử lại sinh ra để lo. */
    const bayGio = 100 * GIO;
    const caPhaiChoThu = [
      NH.duocThuLaiQlkCtr(undefined, bayGio), // chưa từng thử
      NH.duocThuLaiQlkCtr({ soLanDaThu: 1, lanCuoi: bayGio - GIO }, bayGio), // quá hạn xa
      NH.duocThuLaiQlkCtr({ soLanDaThu: 99, lanCuoi: bayGio - 24 * GIO }, bayGio), // bậc trần, 1 ngày
    ];
    return {
      duoc: caPhaiChoThu.every((x) => x === true),
      thucTe: caPhaiChoThu.join(" · "),
      mongDoi:
        "cả ba đều true — hàm chặn vô điều kiện là giết luôn khả năng tự hồi phục của PO lỗi tạm thời",
    };
  },
);

kiem(
  "Đồng hồ máy bị chỉnh LÙI → vẫn cho thử, không kẹt vĩnh viễn",
  CHU_NHIP,
  () => {
    /* Mốc nằm ở tương lai (người dùng chỉnh giờ máy, hoặc múi giờ đổi). Trừ ra được số âm; xử
       sai chỗ này là PO kẹt cho tới khi đồng hồ đuổi kịp — có thể hàng tháng. */
    const bayGio = 1_000_000;
    const r = NH.duocThuLaiQlkCtr({ soLanDaThu: 3, lanCuoi: bayGio + 10 * GIO }, bayGio);
    return { duoc: r === true, thucTe: String(r), mongDoi: "true (thà thử sớm còn hơn kẹt)" };
  },
);

kiem(
  "mocSauLanThuHong TĂNG số lần thử và ghi lại mốc thời gian",
  CHU_NHIP,
  () => {
    const a = NH.mocSauLanThuHong(undefined, 500);
    const b = NH.mocSauLanThuHong(a, 900);
    return {
      duoc: a.soLanDaThu === 1 && a.lanCuoi === 500 && b.soLanDaThu === 2 && b.lanCuoi === 900,
      thucTe: `${a.soLanDaThu}@${a.lanCuoi} → ${b.soLanDaThu}@${b.lanCuoi}`,
      mongDoi: "1@500 → 2@900 (không tăng đếm thì mọi PO đứng mãi ở bậc 1 phút)",
    };
  },
);

kiem(
  "Nhịp gom ghi kho chung nằm trong 600–1000ms",
  CHU_NHIP,
  () => {
    /* Dưới 600ms thì không gom được gì (Firestore khuyến cáo ~1 lần ghi/giây cho MỘT tài liệu,
       mà cả app dùng đúng một tài liệu). Trên 1000ms thì cửa sổ mất việc — ảnh chụp của người
       khác dội về đè state trong lúc bản của mình còn nằm chờ — rộng quá một giây. */
    const v = NH.NHIP_GOM_GHI_MS;
    return {
      duoc: typeof v === "number" && v >= 600 && v <= 1000,
      thucTe: `${v}ms`,
      mongDoi: "600–1000ms (dự án đang chọn 800ms)",
    };
  },
);

kiem(
  "tinhDoTreGhi: CHƯA ghi lần nào → ghi NGAY (0ms)",
  CHU_NHIP,
  () => {
    const r = NH.tinhDoTreGhi(0, 1_000_000);
    return { duoc: r === 0, thucTe: `${r}ms`, mongDoi: "0ms" };
  },
);

kiem(
  "tinhDoTreGhi: đang trong nhịp → hẹn phần còn thiếu, không ghi thêm lượt",
  CHU_NHIP,
  () => {
    const bayGio = 1_000_000;
    const r = NH.tinhDoTreGhi(bayGio - 200, bayGio, 800);
    return {
      duoc: r === 600,
      thucTe: `${r}ms`,
      mongDoi: "600ms (đã trôi 200/800) — đây là chốt gom cả tràng thao tác thành MỘT lần ghi",
    };
  },
);

kiem(
  "🔴 CHIỀU NGHỊCH: tinhDoTreGhi KHÔNG ĐƯỢC thành 'hoãn cứng' — thao tác lẻ vẫn tức thì",
  CHU_NHIP,
  () => {
    /* 🔴 Nếu ai đó đổi thành `return nhip` vô điều kiện thì mọi thao tác đều trễ 800ms mà chẳng
       giảm được lượt ghi nào ở ca thường gặp nhất (người dùng bấm một cái rồi ngồi đọc). Người
       dùng sẽ báo đúng thứ Sếp đã báo sáng 15/09: *"giống kiểu bị delay"*. */
    const bayGio = 1_000_000;
    const caPhaiGhiNgay = [
      NH.tinhDoTreGhi(0, bayGio), // chưa ghi lần nào
      NH.tinhDoTreGhi(bayGio - 5_000, bayGio), // đã im 5 giây
      NH.tinhDoTreGhi(bayGio + 10_000, bayGio), // đồng hồ lùi
    ];
    return {
      duoc: caPhaiGhiNgay.every((x) => x === 0),
      thucTe: caPhaiGhiNgay.map((x) => `${x}ms`).join(" · "),
      mongDoi: "cả ba đều 0ms — nhịp gom là TRẦN TỐC ĐỘ, không phải độ trễ cố định",
    };
  },
);

kiem(
  "tinhDoTreGhi không bao giờ trả số ÂM (âm là hẹn giờ chạy ngược)",
  CHU_NHIP,
  () => {
    const mau = [
      NH.tinhDoTreGhi(0, 0),
      NH.tinhDoTreGhi(1_000_000, 1_000_000),
      NH.tinhDoTreGhi(1_000_000, 1_000_799, 800),
      NH.tinhDoTreGhi(1_000_000, 9_999_999),
    ];
    return {
      duoc: mau.every((x) => typeof x === "number" && x >= 0 && x <= NH.NHIP_GOM_GHI_MS),
      thucTe: mau.map((x) => `${x}ms`).join(" · "),
      mongDoi: `mọi giá trị trong khoảng 0…${NH.NHIP_GOM_GHI_MS}ms`,
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// PHÂN LOẠI LỖI QLK CTR: VĨNH VIỄN vs TẠM THỜI — Sếp 15/09/2026 (đêm), vá P0 chặn vòng lặp
//
// Gốc sự cố: PO của đề nghị 000000085 (chưa từng sang Kho vì Kho hết hạn mức lúc App Request
// gọi) bị gửi lại vô hạn. Lỗi "không có đề nghị" là VĨNH VIỄN — thử lại không đổi được gì,
// nhưng mỗi lần thử là một lần ghi kho chung → dội về mọi máy.
// Luật: 4xx (trừ 408/429) → vĩnh viễn → `can_xu_ly_tay`, KHÔNG tự thử lại.
//       5xx / timeout / không rõ → tạm thời → `failed`, vẫn tự thử theo bậc chờ.
//       QLK CTR tự khai `loaiLoi` thì tin lời khai đó.
// ════════════════════════════════════════════════════════════════════
const CHU_PHAN_LOAI = "Sếp 15/09/2026 (đêm) — vá P0 chặn vòng lặp Thu mua ↔ QLK CTR";

kiem(
  "phanLoaiLoiQlkCtr: 404/400/422 (đề nghị không có, sai dữ liệu) là VĨNH VIỄN",
  CHU_PHAN_LOAI,
  () => {
    const mau = [404, 400, 422, 401, 403].map((s) => NH.phanLoaiLoiQlkCtr(s));
    return {
      duoc: mau.every((x) => x === "vinh_vien"),
      thucTe: mau.join(" · "),
      mongDoi: "tất cả là vinh_vien",
    };
  },
);

kiem(
  "phanLoaiLoiQlkCtr: 500/502/503/504 (Kho sập, hết hạn mức) là TẠM THỜI — PO phải tự hồi phục được",
  CHU_PHAN_LOAI,
  () => {
    const mau = [500, 502, 503, 504].map((s) => NH.phanLoaiLoiQlkCtr(s));
    return {
      duoc: mau.every((x) => x === "tam_thoi"),
      thucTe: mau.join(" · "),
      mongDoi: "tất cả là tam_thoi",
    };
  },
);

kiem(
  "phanLoaiLoiQlkCtr: KHÔNG BIẾT (timeout/mạng, không có mã) và 408/429 → TẠM THỜI (chiều an toàn)",
  CHU_PHAN_LOAI,
  () => {
    const mau = [NH.phanLoaiLoiQlkCtr(undefined), NH.phanLoaiLoiQlkCtr(408), NH.phanLoaiLoiQlkCtr(429), NH.phanLoaiLoiQlkCtr(NaN)];
    return {
      duoc: mau.every((x) => x === "tam_thoi"),
      thucTe: mau.join(" · "),
      mongDoi: "tất cả là tam_thoi",
    };
  },
);

kiem(
  "phanLoaiLoiQlkCtr: lời khai `loaiLoi` của QLK CTR THẮNG mã HTTP (cả hai chiều)",
  CHU_PHAN_LOAI,
  () => {
    const a = NH.phanLoaiLoiQlkCtr(502, "vinh_vien"); // proxy trả 502 nhưng Kho nói vĩnh viễn
    const b = NH.phanLoaiLoiQlkCtr(400, "tam_thoi"); // 400 nhưng Kho nói tạm thời
    const c = NH.phanLoaiLoiQlkCtr(400, "linh_tinh"); // lời khai lạ → bỏ qua, suy từ mã
    return {
      duoc: a === "vinh_vien" && b === "tam_thoi" && c === "vinh_vien",
      thucTe: `${a} · ${b} · ${c}`,
      mongDoi: "vinh_vien · tam_thoi · vinh_vien",
    };
  },
);

kiem(
  "trangThaiSauLoiQlkCtr: vĩnh viễn → can_xu_ly_tay; tạm thời → failed",
  CHU_PHAN_LOAI,
  () => {
    const a = NH.trangThaiSauLoiQlkCtr("vinh_vien");
    const b = NH.trangThaiSauLoiQlkCtr("tam_thoi");
    return { duoc: a === "can_xu_ly_tay" && b === "failed", thucTe: `${a} · ${b}`, mongDoi: "can_xu_ly_tay · failed" };
  },
);

kiem(
  "coTuThuLaiQlkCtr: CHỈ `failed` vào hàng tự thử lại — `can_xu_ly_tay` đứng ngoài (điểm cắt vòng lặp)",
  CHU_PHAN_LOAI,
  () => {
    const mau = {
      failed: NH.coTuThuLaiQlkCtr("failed"),
      can_xu_ly_tay: NH.coTuThuLaiQlkCtr("can_xu_ly_tay"),
      synced: NH.coTuThuLaiQlkCtr("synced"),
      khong_ap_dung: NH.coTuThuLaiQlkCtr("khong_ap_dung"),
      rong: NH.coTuThuLaiQlkCtr(undefined),
    };
    return {
      duoc: mau.failed === true && !mau.can_xu_ly_tay && !mau.synced && !mau.khong_ap_dung && !mau.rong,
      thucTe: JSON.stringify(mau),
      mongDoi: "chỉ failed = true",
    };
  },
);

kiem(
  "CHIỀU NGHỊCH: một PO can_xu_ly_tay dù đã QUÁ MỌI BẬC CHỜ vẫn không được tự thử lại",
  CHU_PHAN_LOAI,
  () => {
    const bayGio = 10_000_000_000;
    const quaHan = NH.duocThuLaiQlkCtr({ soLanDaThu: 1, lanCuoi: bayGio - 24 * 3_600_000 }, bayGio);
    const vanChan = !NH.coTuThuLaiQlkCtr("can_xu_ly_tay");
    return {
      duoc: quaHan === true && vanChan === true,
      thucTe: `bậc chờ cho phép=${quaHan}, trạng thái chặn=${vanChan}`,
      mongDoi: "bậc chờ cho phép nhưng trạng thái vẫn chặn — hai chốt độc lập",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// MỞ KHOÁ TRƯỜNG Ở MÀN SỬA ĐƠN — Sếp 15/09/2026
//
// Nguyên văn chỉ đạo:
//   *"phần sửa PO, phải cấp quyền cho sửa toàn bộ giống như khi lập đơn mua hàng mới"*
// và khi được hỏi có bắt ghi lý do khi sửa chiết khấu / thuế suất không:
//   *"Có, bắt ghi lý do"* — vì hai thứ đó đổi SỐ TIỀN của đơn, kéo theo công nợ phải trả NCC;
//   không có lý do thì sau này Kế toán hỏi *"sao đơn này lệch tiền"* chỉ còn thấy số cũ và số mới.
//
// 🔴 HAI CHIỀU, VÀ CHIỀU NGHỊCH QUAN TRỌNG HƠN:
//    · chiều thuận — 10 trường đã mở thì cửa ghi phải NHẬN và phải ghi nhật ký được
//    · chiều nghịch — ba trường Nhóm C (`code` · `maDuAn` · `ngayLapPO`) VẪN phải khoá, chốt
//      `hoan_thanh`/`huy` VẪN phải chặn, và con số tiền VẪN không được lọt vào nhật ký đề nghị
// ════════════════════════════════════════════════════════════════════

/** Bộ điều kiện thương mại tối giản — đúng sáu trường `DieuKienThuongMaiPO` khai. */
const dkTM = (them) => ({
  loaiTien: "VND",
  dieuKhoanThanhToan: "Thanh toán 100% trong 30 ngày",
  thueSuatGTGT: 8,
  kieuChietKhau: "khong",
  ...them,
});

kiem(
  "Đổi CHIẾT KHẤU → bắt buộc ghi lý do (`doiTien` bật)",
  "Sếp · 15/09/2026 — *\"Có, bắt ghi lý do\"*: chiết khấu đổi số tiền phải trả nhà cung cấp",
  () => {
    const r = KD.mocSuaDieuKienThuongMai(
      dkTM(),
      dkTM({ kieuChietKhau: "ty_le", tyLeChietKhau: 5 }),
    );
    return {
      duoc: r.doiTien === true && r.chung.length === 1 && r.rieng.length === 1,
      thucTe: `doiTien=${r.doiTien} · chung=[${r.chung.join(" · ")}] · riêng=[${r.rieng.join(" · ")}]`,
      mongDoi: "doiTien=true, có đúng một mốc ở mỗi sổ",
    };
  },
);

kiem(
  "Đổi THUẾ SUẤT CHUNG → bắt buộc ghi lý do (`doiTien` bật)",
  "Sếp · 15/09/2026 — *\"Có, bắt ghi lý do\"*: thuế suất đổi số tiền của đơn",
  () => {
    const r = KD.mocSuaDieuKienThuongMai(dkTM(), dkTM({ thueSuatGTGT: 10 }));
    return {
      duoc: r.doiTien === true,
      thucTe: `doiTien=${r.doiTien} · riêng=[${r.rieng.join(" · ")}]`,
      mongDoi: "doiTien=true",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: đổi LOẠI TIỀN hoặc ĐIỀU KHOẢN THANH TOÁN thì KHÔNG bắt lý do",
  "Sếp · 15/09/2026 — chỉ hai thứ đổi số tiền mới bắt lý do",
  () => {
    /* 🔴 BÀI NÀY GIỮ CHO CHỐT CÒN NGHĨA. Bắt lý do cho cả bốn trường là biến một chốt có nghĩa
       thành thủ tục: người ta gõ "sửa" cho xong, rồi lần sửa TIỀN thật cũng chỉ còn chữ "sửa". */
    const a = KD.mocSuaDieuKienThuongMai(dkTM(), dkTM({ loaiTien: "USD" }));
    const b = KD.mocSuaDieuKienThuongMai(dkTM(), dkTM({ dieuKhoanThanhToan: "Trả ngay" }));
    return {
      duoc:
        a.doiTien === false &&
        b.doiTien === false &&
        a.chung.length === 1 &&
        b.chung.length === 1,
      thucTe: `loạiTiền: doiTien=${a.doiTien}, mốc=${a.chung.length} · điềuKhoản: doiTien=${b.doiTien}, mốc=${b.chung.length}`,
      mongDoi: "cả hai doiTien=false nhưng vẫn ghi được một mốc nhật ký",
    };
  },
);

kiem(
  "CON SỐ TIỀN KHÔNG ĐƯỢC LỌT VÀO NHẬT KÝ ĐỀ NGHỊ (sổ `chung`)",
  "Sếp · 15/09/2026 · nguyên tắc dữ liệu số 3 — khối Lịch sử của đề nghị hiện cho MỌI vai trò",
  () => {
    /* 🔴 BÀI QUAN TRỌNG NHẤT CỦA LUẬT NÀY. `chung` chảy vào `ghiNhatKyDonHang` → `DeNghiMuaHang
       .lichSu`, nơi thủ kho và Phòng Thi công đọc được — chính những vai trò mà `tm_donhang_gia`
       dựng ra để giấu giá. Một dòng "chiết khấu: 0 → 5%" ở đó là phá lớp bảo mật bằng chữ. */
    const r = KD.mocSuaDieuKienThuongMai(
      dkTM({ kieuChietKhau: "so_tien", chietKhau: 1000000 }),
      dkTM({ thueSuatGTGT: 10, kieuChietKhau: "ty_le", tyLeChietKhau: 5 }),
    );
    const chung = r.chung.join(" · ");
    const rieng = r.rieng.join(" · ");
    const loSo = /\d/.test(chung);
    return {
      duoc: !loSo && /5%/.test(rieng) && /10%/.test(rieng),
      thucTe: loSo ? `LỘ SỐ ở sổ chung: [${chung}]` : `chung=[${chung}] · riêng=[${rieng}]`,
      mongDoi: "sổ chung KHÔNG có chữ số nào · sổ chứng từ giá có đủ cũ → mới",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: có đổi thì sổ CHUNG vẫn phải nói ra là đã đổi",
  "Sếp · 15/09/2026 — giấu con số, không giấu sự việc",
  () => {
    /* Gộp hết về sổ riêng cho "an toàn" thì người không xem được giá **không hề biết** điều kiện
       thương mại của đơn vừa bị sửa — mất luôn khả năng đặt câu hỏi. */
    const r = KD.mocSuaDieuKienThuongMai(dkTM(), dkTM({ thueSuatGTGT: 10 }));
    return {
      duoc: r.chung.length === 1 && /thu[ếe]/i.test(r.chung[0]),
      thucTe: `[${r.chung.join(" · ")}]`,
      mongDoi: "một mốc nói rõ đã sửa thuế suất chung",
    };
  },
);

kiem(
  "Bấm Lưu mà KHÔNG đổi gì → không sinh mốc nào, không bắt lý do",
  "Sếp · 15/09/2026 — thay đổi giả là thứ làm ca 'không có gì đổi' chết vĩnh viễn",
  () => {
    const r = KD.mocSuaDieuKienThuongMai(dkTM(), dkTM());
    return {
      duoc: r.chung.length === 0 && r.rieng.length === 0 && r.doiTien === false,
      thucTe: `chung=${r.chung.length} · riêng=${r.rieng.length} · doiTien=${r.doiTien}`,
      mongDoi: "0 · 0 · false",
    };
  },
);

kiem(
  "Đơn CŨ không có `loaiTien` vs ô ghi 'VND' → KHÔNG coi là thay đổi",
  "Sếp · 15/09/2026 — chống thay đổi giả ở đơn lập trước 23/08/2026",
  () => {
    /* 🔴 Trước 23/08/2026 app ghi cứng "VND" lúc in mà KHÔNG lưu trường này, nên đơn cũ có
       `loaiTien === undefined` trong khi chứng từ ghi VND. Không chuẩn hoá thì mở màn sửa rồi bấm
       Lưu mà không đụng gì cũng ghi "loại tiền: trống → VND", và ca `MA_KHONG_CO_THAY_DOI` không
       bao giờ xảy ra được nữa. */
    const r = KD.mocSuaDieuKienThuongMai(
      { ...dkTM(), loaiTien: undefined },
      dkTM({ loaiTien: "VND" }),
    );
    return {
      duoc: r.chung.length === 0,
      thucTe: `[${r.chung.join(" · ")}]`,
      mongDoi: "không mốc nào",
    };
  },
);

kiem(
  "Thuế suất `0` KHÁC `không đặt` — xoá mức thuế phải ghi được vào nhật ký",
  "Sếp · 15/09/2026 — 0% là một mức thuế THẬT (hàng không chịu thuế GTGT)",
  () => {
    /* 🔴 Khuôn `Number(x) || undefined` của đường LẬP đơn biến 0 thành "không đặt". Ở đường SỬA,
       gộp hai ca đó là **xoá mất mức thuế của một đơn đang chạy mà nhật ký im lặng**. */
    const a = KD.mocSuaDieuKienThuongMai(dkTM({ thueSuatGTGT: 0 }), dkTM({ thueSuatGTGT: undefined }));
    const b = KD.mocSuaDieuKienThuongMai(dkTM({ thueSuatGTGT: undefined }), dkTM({ thueSuatGTGT: 0 }));
    return {
      duoc: a.chung.length === 1 && b.chung.length === 1 && a.doiTien && b.doiTien,
      thucTe: `0→không đặt: ${a.chung.length} mốc (doiTien=${a.doiTien}) · không đặt→0: ${b.chung.length} mốc (doiTien=${b.doiTien})`,
      mongDoi: "cả hai chiều đều sinh đúng 1 mốc và bật doiTien",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: `ThayDoiDonHang` VẪN KHÔNG được khai `code` · `maDuAn` · `ngayLapPO`",
  "Sếp · 15/09/2026 — mở TRƯỜNG, không mở ba thứ định danh chứng từ",
  () => {
    /* 🔴 ĐÂY LÀ BÀI GIỮ NHÓM C. Mở khoá 10 trường ngày 15/09 rất dễ kéo theo *"mở nốt cho đủ"* —
       nhưng ba trường này khoá vì LÝ DO NGHIỆP VỤ, không phải vì kiểu dữ liệu:
         · `code`      — phiếu nhận hàng (`poCode`), chứng từ giá (`poCode`) và bản PO đã nằm bên
                         QLK CTR đều trỏ về nó. Đổi là trỏ hụt hàng loạt, không màn nào báo.
         · `maDuAn`    — là PHẦN ĐẦU của chính số đơn đã cấp, và là khoá của `GiaDonDatHang.maDuAn`.
         · `ngayLapPO` — quyết định NĂM của số đơn đã cấp (`DMH2026-0008`).
       Kiểu TypeScript là chốt DUY NHẤT của chúng (không có `if` runtime nào), nên phải đọc mã
       nguồn — `esbuild` xoá sạch kiểu nên không gọi hàm mà kiểm được.
       ⚠️ Chỉ soi đúng thân `interface ThayDoiDonHang`, không soi cả tệp: chữ `code` có ở hàng trăm
       chỗ khác. */
    const nguon = readFileSync("3-du-lieu/kho-du-lieu.tsx", "utf8");
    const than = nguon.split("export interface ThayDoiDonHang {")[1]?.split("\n}")[0] ?? "";
    const cam = ["code", "maDuAn", "ngayLapPO", "prId", "trangThai"];
    const loSot = cam.filter((t) => new RegExp(`^\\s*${t}\\??:`, "m").test(than));
    return {
      duoc: than !== "" && loSot.length === 0,
      thucTe:
        than === ""
          ? "KHÔNG tìm thấy `interface ThayDoiDonHang` — bài kiểm mất chỗ bám, sửa bài kiểm"
          : loSot.length === 0
            ? "không trường cấm nào được khai"
            : `ĐÃ KHAI: ${loSot.join(" · ")}`,
      mongDoi: "không trường nào trong: " + cam.join(" · "),
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: `suaDonHang` VẪN chặn đơn `hoan_thanh` / `huy`",
  "Sếp · 31/08/2026, giữ nguyên 15/09/2026 — mở quyền sửa NỘI DUNG, không mở đơn đã chốt sổ",
  () => {
    /* 🔴 Chốt này nằm thẳng trong `useCallback` nên không gọi thật được (bộ kiểm không mount hook
       React). Đọc mã nguồn là cách duy nhất còn lại — yếu hơn gọi hàm, nhưng vẫn bắt được ca
       "refactor rồi vô tình làm rơi cả khối `if`", đúng ca đã xảy ra ngày 24/08/2026. */
    const nguon = readFileSync("3-du-lieu/kho-du-lieu.tsx", "utf8");
    const than = nguon.split("const suaDonHang = useCallback(")[1]?.slice(0, 2000) ?? "";
    const coChan =
      /po\.trangThai === "hoan_thanh"/.test(than) && /po\.trangThai === "huy"/.test(than);
    return {
      duoc: coChan,
      thucTe: than === "" ? "KHÔNG tìm thấy `suaDonHang`" : coChan ? "còn đủ hai vế" : "ĐÃ MẤT",
      mongDoi: "`suaDonHang` mở đầu bằng chốt trạng thái hoan_thanh/huy",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: chốt `xacNhanTruongBP` VẪN chỉ chặn `gia.lines`, không chặn nhánh thương mại",
  "Sếp · 15/09/2026 — tách nhánh để nới một luật cũ không thành khoá cứng một việc khác",
  () => {
    /* 🔴 HAI LỖI NGƯỢC NHAU, BÀI NÀY GIỮ CẢ HAI:
         · nhét `dieuKienThuongMai` vào `thayDoi.gia` → đơn đã xác nhận không đổi nổi ô Loại tiền
         · bỏ luôn chốt cho `gia.lines`  → sửa được đơn giá của đơn Trưởng BP đã ký xác nhận
       Nên bài kiểm đòi ĐÚNG một khối `if (thayDoi.gia && po.xacNhanTruongBP)` và đòi nhánh
       thương mại ghi bằng một khối `if` RIÊNG. */
    const nguon = readFileSync("3-du-lieu/kho-du-lieu.tsx", "utf8");
    const conChotGia = /if \(thayDoi\.gia && po\.xacNhanTruongBP\)/.test(nguon);
    const nhanhRieng = /if \(thayDoi\.dieuKienThuongMai && mocTM\.rieng\.length > 0\)/.test(nguon);
    const nhetVaoGia = /gia\s*=\s*\{[^}]*dieuKienThuongMai/.test(nguon);
    return {
      duoc: conChotGia && nhanhRieng && !nhetVaoGia,
      thucTe: `chốt gia.lines=${conChotGia} · nhánh riêng=${nhanhRieng} · nhét vào gia=${nhetVaoGia}`,
      mongDoi: "chốt gia.lines còn · nhánh thương mại đứng riêng · không nhét vào `gia`",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: `doiTien` phải nằm trong `batBuocLyDo` của `suaDonHang`",
  "Sếp · 15/09/2026 — form báo trước, nhưng chốt THẬT phải ở tầng ghi",
  () => {
    /* 🔴 Bỏ vế này đi thì form vẫn hiện ô đỏ "phải ghi lý do" (nó có phép so riêng), nhưng ai gọi
       thẳng cửa ghi — hoặc chỉ cần form lệch một lần — là sửa được tiền mà không lý do. Chốt ở
       giao diện không phải là chặn. */
    const nguon = readFileSync("3-du-lieu/kho-du-lieu.tsx", "utf8");
    const dong = nguon.match(/const batBuocLyDo = .*/)?.[0] ?? "";
    return {
      duoc: /mocTM\.doiTien/.test(dong),
      thucTe: dong === "" ? "KHÔNG tìm thấy `batBuocLyDo`" : dong.trim(),
      mongDoi: "`batBuocLyDo` có vế `mocTM.doiTien`",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// SỬA 7 Ô PHIẾU XUẤT KHO (MẪU PO-03) Ở CHẾ ĐỘ SỬA ĐƠN — Sếp 26/09/2026: "Làm tiếp cho chế độ sửa"
//
// Trước hôm đó form KHOÁ bảy ô này khi sửa, vì `ThayDoiDonHang` chưa khai chúng (mở ô ra là bấm
// Lưu xong chữ biến mất — CLAUDE.md §3.5). Luật so/ghi nay ở `mocSuaPhieuXuatKho` (hàm thuần trong
// `3-du-lieu/kho-du-lieu.tsx`), gọi thẳng được.
// ════════════════════════════════════════════════════════════════════

const CHU_PXK = "Sếp · 26/09/2026 — sửa được các ô phiếu xuất kho (Mẫu PO-03) ở chế độ sửa đơn";
const BAY_O_PXK = [
  "taiKhoanNoXuatKho",
  "taiKhoanCoXuatKho",
  "canCuXuatKho",
  "khoXuat",
  "diaDiemKhoXuat",
  "dienGiaiXuatKho",
  "soChungTuGocXuatKho",
];

kiem(
  "PO-03: đổi MỘT ô → đúng một mốc có nhãn, bản vá chỉ chứa đúng ô đó (đã trim)",
  CHU_PXK,
  () => {
    const r = KD.mocSuaPhieuXuatKho(
      { khoXuat: "Kho Tổng", taiKhoanNoXuatKho: "6211" },
      { khoXuat: "  Kho Bình Dương ", taiKhoanNoXuatKho: "6211", taiKhoanCoXuatKho: "" },
    );
    const khoa = Object.keys(r.vaLai);
    return {
      duoc:
        r.moc.length === 1 &&
        /Xuất tại kho: Kho Tổng → Kho Bình Dương$/.test(r.moc[0]) &&
        khoa.length === 1 &&
        r.vaLai.khoXuat === "Kho Bình Dương",
      thucTe: `mốc=[${r.moc.join(" · ")}] · vá=${JSON.stringify(r.vaLai)}`,
      mongDoi: 'một mốc "Xuất tại kho: Kho Tổng → Kho Bình Dương" · vá chỉ có khoXuat',
    };
  },
);

kiem(
  'PO-03: xoá trắng một ô (`""`) → bản vá ghi `undefined` = XOÁ trường, nhật ký ghi "→ trống"',
  CHU_PXK + " · chuỗi rỗng = xoá, giống lúc lập mới",
  () => {
    /* 🔴 Nếu tầng ghi quy `""` về "không đụng tới" thì người dùng KHÔNG BAO GIỜ xoá được một ô đã
       nhập nhầm — bấm Lưu, toast xanh, mà chữ cũ vẫn in trên phiếu. */
    const r = KD.mocSuaPhieuXuatKho({ dienGiaiXuatKho: "Xuất nhầm" }, { dienGiaiXuatKho: "   " });
    return {
      duoc:
        r.moc.length === 1 &&
        /→ trống$/.test(r.moc[0]) &&
        "dienGiaiXuatKho" in r.vaLai &&
        r.vaLai.dienGiaiXuatKho === undefined,
      thucTe: `mốc=[${r.moc.join(" · ")}] · có khoá=${"dienGiaiXuatKho" in r.vaLai} · giá trị=${r.vaLai.dienGiaiXuatKho}`,
      mongDoi: 'một mốc "… → trống" · vá có khoá dienGiaiXuatKho mang undefined',
    };
  },
);

kiem(
  "CHIỀU NGƯỢC PO-03: lưu lại KHÔNG đụng gì (đơn cũ thiếu ô, form nạp `\"\"`) → 0 mốc, bản vá rỗng",
  CHU_PXK + " · chống thay đổi giả làm chết ca MA_KHONG_CO_THAY_DOI",
  () => {
    /* Form nạp `po.x ?? ""` cho cả 7 ô rồi gửi nguyên state. So thô `undefined` với `""` là mở màn
       sửa bấm Lưu mà không đổi gì cũng sinh 7 mốc "trống → trống" và ghi đè cả đơn. */
    const cu = { khoXuat: "Kho Tổng" };
    const moi = Object.fromEntries(BAY_O_PXK.map((k) => [k, ""]));
    moi.khoXuat = "Kho Tổng ";
    const a = KD.mocSuaPhieuXuatKho(cu, moi);
    /* `undefined` = không đụng tới: ô có giá trị cũ mà nơi gọi không gửi thì KHÔNG bị xoá. */
    const b = KD.mocSuaPhieuXuatKho({ khoXuat: "Kho Tổng", canCuXuatKho: "ĐN 46" }, {});
    const n = (r) => r.moc.length + Object.keys(r.vaLai).length;
    return {
      duoc: n(a) === 0 && n(b) === 0,
      thucTe: `không đổi: mốc=${a.moc.length}, vá=${Object.keys(a.vaLai).length} · không gửi: mốc=${b.moc.length}, vá=${Object.keys(b.vaLai).length}`,
      mongDoi: "cả hai ca 0 mốc, bản vá rỗng",
    };
  },
);

kiem(
  "PO-03: danh sách ô của tầng ghi phải đủ CẢ BẢY ô form gửi lên",
  CHU_PXK,
  () => {
    /* 🔴 TypeScript KHÔNG bắt được ca này: bỏ một dòng khỏi `TRUONG_PHIEU_XUAT_KHO` thì mọi thứ vẫn
       biên dịch, form vẫn gửi ô đó, còn tầng ghi lặng lẽ bỏ qua — đúng lỗi §3.5 mà việc 26/09 vừa
       gỡ. Đọc thẳng hằng số đã bundle. */
    const co = (KD.TRUONG_PHIEU_XUAT_KHO ?? []).map(([k]) => k);
    const thieu = BAY_O_PXK.filter((k) => !co.includes(k));
    return {
      duoc: co.length === BAY_O_PXK.length && thieu.length === 0,
      thucTe: `có ${co.length} ô · thiếu: ${thieu.join(", ") || "(không)"}`,
      mongDoi: `đủ ${BAY_O_PXK.length} ô: ${BAY_O_PXK.join(", ")}`,
    };
  },
);

kiem(
  "CHIỀU NGƯỢC PO-03: `suaDonHang` phải GỌI `mocSuaPhieuXuatKho` VÀ ÁP bản vá trong `setDonHang`",
  CHU_PXK + " · nhật ký và dữ liệu phải đi cùng nhau",
  () => {
    /* 🔴 Nằm trong `useCallback` nên không gọi thật được — đọc mã nguồn. Hai lỗi ngược nhau, bài này
       giữ cả hai: mất lệnh gọi → ô sửa không lưu, không nhật ký (toast "Không có gì thay đổi"); mất
       lệnh áp → nhật ký nói đã sửa mà đơn vẫn giữ chữ cũ. */
    const nguon = readFileSync("3-du-lieu/kho-du-lieu.tsx", "utf8");
    const than = nguon.split("const suaDonHang = useCallback(")[1]?.split("const themDeNghiGiaLap")[0] ?? "";
    const coGoi = /const mocPXK = mocSuaPhieuXuatKho\(po, thayDoi\)/.test(than);
    const coNhatKy = /moc\.push\(\.\.\.mocPXK\.moc\)/.test(than);
    const coAp = /Object\.assign\(sau, mocPXK\.vaLai\)/.test(than);
    return {
      duoc: than !== "" && coGoi && coNhatKy && coAp,
      thucTe:
        than === ""
          ? "KHÔNG tìm thấy thân `suaDonHang` — bài kiểm mất chỗ bám, sửa bài kiểm"
          : `gọi=${coGoi} · nhật ký=${coNhatKy} · áp bản vá=${coAp}`,
      mongDoi: "gọi=true · nhật ký=true · áp bản vá=true",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// GIỮ BẢN GHI VỪA TẠO CHO TỚI KHI THẤY NÓ TRÊN MÁY CHỦ
// Sự cố MẤT DỮ LIỆU THẬT — 15/09/2026, Sếp báo lúc 19:33.
//
// Sếp lập một đơn mua hàng, app sinh id `po-b1e884d9-0c60-490a-a8da-c4f84da64d8e`, điều hướng
// sang trang chi tiết → *"Không tìm thấy đơn đặt hàng"*.
//
// ĐO TRÊN KHO CHUNG THẬT (`hpcons-portal`, `chay-thu/du-lieu-chung`):
//   · Đơn đó KHÔNG tồn tại. Tài liệu 162.928 byte — không chạm trần 1 MiB, loại trừ ca tràn.
//   · 7 đơn còn lại: DMH260002, 05, 06, 07, 08, 09, 10 — **thiếu 260001, 260003, 260004**.
//     App KHÔNG có chức năng xoá từng đơn ⇒ ít nhất 3 đơn khác đã mất y hệt từ trước.
//
// 🔴🔴 CHIỀU NGHỊCH QUAN TRỌNG HƠN CHIỀU THUẬN Ở ĐÂY. Sửa `ghepBanChuaLenMayChu` thành "luôn
// ghép hai danh sách" thì mọi bản ghi người khác XOÁ sẽ sống lại vĩnh viễn, xoá bao nhiêu lần
// cũng vô ích — bản vá biến thành một lỗi NẶNG HƠN lỗi nó đang chữa. Bốn bài dưới canh đúng chỗ đó.
// ════════════════════════════════════════════════════════════════════

const CHU_GIU = "Sếp · 15/09/2026 19:33 · sự cố mất đơn (thiếu DMH260001/260003/260004)";

/** Đơn hàng tối giản — chỉ trường mà luật ghép thật sự đọc. */
const don = (id) => ({ id, code: `DMH-${id}` });
/** Sổ theo dõi từ danh sách id. */
const so = (...ids) => new Map(ids.map((id) => [id, { soAnhChupVang: 0 }]));

kiem(
  "THUẬN: ảnh chụp thiếu đơn vừa tạo → hàm báo PHẢI GHÉP LẠI",
  CHU_GIU,
  () => {
    const dangGiu = so("po:moi");
    const anhChup = new Set(["po:cu1", "po:cu2"]);
    const r = GB.idCanGhepLai(dangGiu, anhChup);
    return {
      duoc: r.length === 1 && r[0] === "po:moi",
      thucTe: JSON.stringify(r),
      mongDoi: '["po:moi"] — đây đúng là ca đơn 19:33 của Sếp biến mất khỏi màn hình',
    };
  },
);

kiem(
  "THUẬN: ghép lại thật sự giữ được đơn vừa tạo mà ảnh chụp không có",
  CHU_GIU,
  () => {
    const tuMayChu = [don("cu1"), don("cu2")];
    const taiMay = [don("cu1"), don("cu2"), don("moi")];
    const r = GB.ghepBanChuaLenMayChu(tuMayChu, taiMay, so("po:moi"), (x) => `po:${x.id}`);
    return {
      duoc: r.length === 3 && r.some((x) => x.id === "moi"),
      thucTe: r.map((x) => x.id).join(","),
      mongDoi: "cu1,cu2,moi — bản chưa lên máy chủ được đắp lại, không bị ảnh chụp xoá",
    };
  },
);

kiem(
  "🔴 NGHỊCH (QUAN TRỌNG NHẤT): id ĐÃ THẤY trên máy chủ rồi → KHÔNG ghép lại nữa",
  CHU_GIU,
  () => {
    /* 🔴 Đây là cửa MỘT CHIỀU, và là thứ duy nhất phân biệt "bản mới chưa lên server" với
       "bản người khác cố ý xoá". Hỏng nó thì: máy A xoá một đơn → máy B dựng nó sống lại
       → xoá bao nhiêu lần cũng vô ích, và KHÔNG CÓ GÌ BÁO. */
    // ① Ảnh chụp có `po:x` → sổ phải gỡ `po:x` ra.
    const sauKhiThay = GB.soSauAnhChup(
      so("po:x"),
      new Set(["po:x"]),
      new Set(["po:x"]),
    );
    // ② Sau đó có người xoá `po:x` ⇒ ảnh chụp mới KHÔNG còn `po:x`.
    const conGiu = GB.idCanGhepLai(sauKhiThay, new Set([]));
    /* ⚠️ Sổ truyền vào phải CÓ nội dung (`po:chuaLen` — một bản ghi khác đang chờ thật), nếu
       không thì `ghepBanChuaLenMayChu` thoát sớm ở nhánh "sổ rỗng" và bài kiểm này không hề chạm
       tới chốt `dangGiu.has(id)` — tức canh nhầm chỗ. Đã đo bằng đột biến: bỏ chốt đó mà bài kiểm
       vẫn xanh nếu sổ rỗng. Kết quả đúng: giữ `chuaLen`, để `x` (người khác xoá) mất. */
    const soThat = new Map(sauKhiThay);
    soThat.set("po:chuaLen", { soAnhChupVang: 0 });
    const sauKhiXoa = GB.ghepBanChuaLenMayChu(
      [don("y")],
      [don("x"), don("y"), don("chuaLen")],
      soThat,
      (v) => `po:${v.id}`,
    );
    return {
      duoc:
        sauKhiThay.size === 0 &&
        conGiu.length === 0 &&
        sauKhiXoa.length === 2 &&
        sauKhiXoa.every((v) => v.id !== "x"),
      thucTe: `sổ=${sauKhiThay.size} · cầnGhép=${JSON.stringify(conGiu)} · còn lại=${sauKhiXoa
        .map((v) => v.id)
        .join(",")}`,
      mongDoi:
        "sổ=0 · cầnGhép=[] · còn lại=y,chuaLen (KHÔNG có x) — thấy trên máy chủ MỘT LẦN là thôi theo dõi VĨNH VIỄN, để lần xoá của người khác đi qua",
    };
  },
);

kiem(
  "🔴 NGHỊCH: ghepBanChuaLenMayChu KHÔNG ĐƯỢC thành 'luôn luôn ghép'",
  CHU_GIU,
  () => {
    /* 🔴 Ai sửa hàm này thành gộp hai danh sách vô điều kiện thì MỌI bản xoá của MỌI người đều
       bị hồi sinh. Sổ rỗng = không giữ gì = phải trả về đúng danh sách của máy chủ. */
    const tuMayChu = [don("a")];
    const taiMay = [don("a"), don("b"), don("c")];
    const soRong = GB.ghepBanChuaLenMayChu(tuMayChu, taiMay, new Map(), (x) => `po:${x.id}`);
    /* Và cả ca sổ CÓ nội dung nhưng không khớp id nào đang bị thiếu. */
    const soLech = GB.ghepBanChuaLenMayChu(tuMayChu, taiMay, so("po:z"), (x) => `po:${x.id}`);
    return {
      duoc:
        soRong.length === 1 &&
        soRong[0].id === "a" &&
        soLech.length === 1 &&
        soLech[0].id === "a",
      thucTe: `sổ rỗng → ${soRong.map((v) => v.id).join(",")} · sổ lệch → ${soLech
        .map((v) => v.id)
        .join(",")}`,
      mongDoi: "cả hai đều chỉ còn 'a' — không theo dõi thì KHÔNG đắp lại, dù bản ghi còn ở máy",
    };
  },
);

kiem(
  "🔴 NGHỊCH: bản ghi do MÁY KHÁC tạo (về qua ảnh chụp) KHÔNG được nhận vơ là của mình",
  CHU_GIU,
  () => {
    /* 🔴 Bỏ vế `daThayTrenMayChu` trong `idVuaTaoTaiMay` là máy này coi mọi thứ người khác tạo
       cũng là "mới mọc ra ở máy mình", rồi từ đó hồi sinh mọi thứ họ xoá. */
    const cuaNguoiKhac = GB.idVuaTaoTaiMay(
      new Set(["po:a"]), // kỳ trước
      ["po:a", "po:b"], // kỳ này — `po:b` vừa xuất hiện
      new Set(["po:b"]), // …nhưng máy chủ ĐÃ từng gửi `po:b` về
    );
    const cuaMinh = GB.idVuaTaoTaiMay(new Set(["po:a"]), ["po:a", "po:c"], new Set(["po:b"]));
    return {
      duoc: cuaNguoiKhac.length === 0 && cuaMinh.length === 1 && cuaMinh[0] === "po:c",
      thucTe: `từ máy chủ → ${JSON.stringify(cuaNguoiKhac)} · tự tạo → ${JSON.stringify(cuaMinh)}`,
      mongDoi: '[] và ["po:c"]',
    };
  },
);

kiem(
  "Chính máy này xoá bản ghi chưa kịp lên máy chủ → gỡ khỏi sổ, KHÔNG dựng lại",
  CHU_GIU,
  () => {
    /* Người ngồi máy này tự xoá đề nghị mình vừa tạo. Giữ tiếp là chống lại ý muốn của họ. */
    const sau = GB.soSauAnhChup(so("pr:moi"), new Set([]), new Set([]));
    return {
      duoc: sau.size === 0,
      thucTe: `sổ còn ${sau.size} mục`,
      mongDoi: "0 — không còn trong state máy này thì thôi theo dõi",
    };
  },
);

kiem(
  "Vắng mặt nhiều ảnh chụp → đếm tăng và quaHanDongBo báo động (để app nói THẬT)",
  CHU_GIU,
  () => {
    let s = so("po:moi");
    for (let i = 0; i < GB.SO_ANH_CHUP_TRUOC_KHI_BAO; i += 1) {
      s = GB.soSauAnhChup(s, new Set([]), new Set(["po:moi"]));
    }
    const vet = s.get("po:moi");
    return {
      duoc:
        s.size === 1 &&
        vet.soAnhChupVang === GB.SO_ANH_CHUP_TRUOC_KHI_BAO &&
        GB.quaHanDongBo(vet) === true &&
        GB.quaHanDongBo({ soAnhChupVang: 0 }) === false,
      thucTe: `vắng ${vet?.soAnhChupVang} ảnh chụp · quáHạn=${GB.quaHanDongBo(vet)}`,
      mongDoi: `vắng ${GB.SO_ANH_CHUP_TRUOC_KHI_BAO} · quáHạn=true, và bản ghi VẪN được giữ (thôi giữ = mất dữ liệu lần hai)`,
    };
  },
);

kiem(
  "🔴 NGHỊCH: quá hạn KHÔNG được làm bản ghi biến mất — vẫn phải ghép lại",
  CHU_GIU,
  () => {
    /* 🔴 Cân nhắc kỹ rồi mới chọn: "quá N ảnh chụp thì thôi giữ" chính là MẤT DỮ LIỆU LẦN THỨ
       HAI, mà bản ghi đó là bản DUY NHẤT còn tồn tại (máy chủ không có). Thứ ngăn hồi sinh vĩnh
       viễn là cửa một chiều ở `soSauAnhChup`, không phải cái trần này. Trần chỉ đổi LỜI APP NÓI. */
    const quaHan = new Map([["po:moi", { soAnhChupVang: 999 }]]);
    const r = GB.ghepBanChuaLenMayChu([], [don("moi")], quaHan, (x) => `po:${x.id}`);
    return {
      duoc: r.length === 1 && r[0].id === "moi",
      thucTe: r.map((v) => v.id).join(",") || "(rỗng)",
      mongDoi: "moi — quá hạn thì BÁO người dùng, không phải vứt việc họ đã làm",
    };
  },
);

kiem(
  "① Thử lại khi ghi hỏng: hỏng lần đầu phải có khoảng chờ, và tăng dần có trần",
  CHU_GIU,
  () => {
    const bac = [0, 1, 2, 3, 4, 9].map((n) => GB.khoangChoGhiLai(n));
    const tran = GB.BAC_CHO_GHI_LAI_MS[GB.BAC_CHO_GHI_LAI_MS.length - 1];
    return {
      duoc:
        bac[0] === 0 &&
        bac[1] === 3_000 &&
        bac[2] === 10_000 &&
        bac[3] === 30_000 &&
        bac[4] === tran &&
        bac[5] === tran,
      thucTe: bac.map((x) => `${x}ms`).join(" · "),
      mongDoi: `0 · 3000 · 10000 · 30000 · ${tran} · ${tran} — trước 15/09/2026 ghi hỏng là MẤT LUÔN, không thử lại lần nào`,
    };
  },
);

kiem(
  "🔴 NGHỊCH: conDuocGhiLai KHÔNG ĐƯỢC trả false vô điều kiện",
  CHU_GIU,
  () => {
    /* Chặn tuyệt đối = quay về đúng lỗi 15/09/2026: ghi hỏng một lần là mất luôn việc vừa làm. */
    const r = [GB.conDuocGhiLai(0), GB.conDuocGhiLai(1), GB.conDuocGhiLai(GB.SO_LAN_GHI_LAI_TOI_DA)];
    return {
      duoc: r[0] === true && r[1] === true && r[2] === false && GB.SO_LAN_GHI_LAI_TOI_DA >= 3,
      thucTe: `0→${r[0]} · 1→${r[1]} · ${GB.SO_LAN_GHI_LAI_TOI_DA}→${r[2]}`,
      mongDoi: "true · true · false (có trần, nhưng KHÔNG chặn ngay từ lần đầu)",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// ⑤ SỔ PHẢI SỐNG QUA MỘT LẦN TẢI LẠI TRANG — MẤT ĐƠN LẦN THỨ HAI, 15/09/2026 ~20:35
//
// Bản vá lúc 19:33 đã lên production (xác minh được `banGhiChuaLenKhoChung`/`quaHanDongBo` trong
// bundle `5396-b4014730eb9fda8a.js`), NHƯNG Sếp lập đơn `po-7a4d4418-bb18-486b-b0bc-b40aa990a20d`
// lúc ~20:35 và **vẫn mất**. Đo lại kho chung (`hpcons-portal`, `chay-thu/du-lieu-chung`,
// `updateTime` 13:35:54Z = 20:35 giờ VN ⇒ kho VẪN đang nhận ghi bình thường): đơn đó KHÔNG tồn
// tại, vẫn đúng 7 đơn như trước (DMH260002 · 260005 failed · 260006 · 260007 · 260008 · 260009 ·
// 260010).
//
// 🔴 VÌ SAO: cả cuốn sổ nằm trong `useRef` của `DuLieuProvider` ⇒ chết theo mỗi document trình
// duyệt (F5, trang in mở ở TAB MỚI bằng `<Link target="_blank">`, hoặc một lần điều hướng cứng
// của Next.js khi bản deploy đổi giữa chừng). Mất sổ mà bản ghi vẫn nằm trong localStorage ⇒ ảnh
// chụp kế tiếp xoá nó RỒI GHI ĐÈ localStorage bằng bộ đã thiếu — bản cuối cùng còn tồn tại trên
// đời bị chính máy của người dùng xoá.
//
// 🔴🔴 CHIỀU NGHỊCH QUAN TRỌNG HƠN: sổ sống bền thì lập luận "chưa ai thấy nên không ai xoá"
// THỦNG theo thời gian. Hai bài nghịch dưới canh đúng hai cửa chặn: **đã thấy trên máy chủ ⇒
// không bao giờ giữ lại**, và **quá 24 giờ ⇒ bỏ**. Mất một trong hai là app hồi sinh dữ liệu
// người khác đã xoá, vĩnh viễn, và không có một dòng nào báo.
// ════════════════════════════════════════════════════════════════════

const CHU_SO_BEN = "Sếp · 15/09/2026 ~20:35 · mất đơn LẦN HAI (po-7a4d4418-bb18-486b-b0bc-b40aa990a20d)";

/** Dựng chuỗi sổ y như `ghiSoRaChuoi` sẽ cất xuống localStorage. */
const soChuoi = (muc) => JSON.stringify(muc);

kiem(
  "THUẬN: sổ nạp lại sau khi TẢI LẠI TRANG vẫn giữ được id chưa lên máy chủ",
  CHU_SO_BEN,
  () => {
    const bayGio = 1_757_000_000_000;
    /* Đúng ca của Sếp: đơn lập lúc 20:35, tab in dựng lại 30 giây sau. */
    const tho = soChuoi({ "po:7a4d4418": { soAnhChupVang: 0, tao: bayGio - 30_000 } });
    const so = GB.docSoDaLuuTuChuoi(tho, bayGio);
    /* Rồi ảnh chụp từ máy chủ về mà KHÔNG có đơn đó — phải đắp lại được. */
    const r = GB.ghepBanChuaLenMayChu([], [don("7a4d4418")], so, (x) => `po:${x.id}`);
    return {
      duoc: so.size === 1 && so.has("po:7a4d4418") && r.length === 1 && r[0].id === "7a4d4418",
      thucTe: `sổ ${so.size} mục · ghép lại ${r.map((v) => v.id).join(",") || "(rỗng)"}`,
      mongDoi:
        "sổ 1 mục · ghép lại 7a4d4418 — trước bản vá này, tải lại trang là sổ bốc hơi và đơn bị ảnh chụp xoá",
    };
  },
);

kiem(
  "🔴 NGHỊCH: mục QUÁ HẠN trong sổ cất trên máy phải BỊ BỎ (chống hồi sinh vĩnh viễn)",
  CHU_SO_BEN,
  () => {
    const bayGio = 1_757_000_000_000;
    const han = GB.HAN_GIU_BAN_GHI_MS;
    const tho = soChuoi({
      "po:conHan": { soAnhChupVang: 3, tao: bayGio - (han - 60_000) }, // sát hạn, còn giữ
      "po:quaHan": { soAnhChupVang: 3, tao: bayGio - (han + 60_000) }, // quá hạn, phải bỏ
      "po:khongRoTuoi": { soAnhChupVang: 3 }, // sổ đời cũ, không có mốc ⇒ phải bỏ
    });
    const so = GB.docSoDaLuuTuChuoi(tho, bayGio);
    /* Và bản ghi quá hạn phải để cho ảnh chụp xoá — đúng ý người đã xoá nó. */
    const r = GB.ghepBanChuaLenMayChu([], [don("quaHan"), don("conHan")], so, (x) => `po:${x.id}`);
    return {
      duoc:
        so.size === 1 &&
        so.has("po:conHan") &&
        !so.has("po:quaHan") &&
        !so.has("po:khongRoTuoi") &&
        han === 24 * 60 * 60 * 1000 &&
        r.length === 1 &&
        r[0].id === "conHan",
      thucTe: `giữ [${[...so.keys()].join(",")}] · hạn ${han}ms · ghép lại [${r.map((v) => v.id).join(",")}]`,
      mongDoi:
        "chỉ giữ po:conHan · hạn 86400000ms (24 giờ, qua được một đêm nhưng không quá một ngày làm việc) · chỉ ghép lại conHan",
    };
  },
);

kiem(
  "🔴 NGHỊCH: id ĐÃ THẤY trên máy chủ thì KHÔNG BAO GIỜ được giữ lại, dù sổ sống qua tải lại trang",
  CHU_SO_BEN,
  () => {
    const bayGio = 1_757_000_000_000;
    const so = GB.docSoDaLuuTuChuoi(
      soChuoi({ "po:daLen": { soAnhChupVang: 1, tao: bayGio - 60_000 } }),
      bayGio,
    );
    /* ① Ảnh chụp CÓ id đó ⇒ cửa một chiều đóng lại, gỡ khỏi sổ vĩnh viễn. */
    const sauKhiThay = GB.soSauAnhChup(so, new Set(["po:daLen"]), new Set(["po:daLen"]));
    /* ② Cất sổ đó xuống máy rồi nạp lại (đúng như một lần F5) — vẫn phải rỗng. */
    const napLai = GB.docSoDaLuuTuChuoi(GB.ghiSoRaChuoi(sauKhiThay), bayGio);
    /* ③ Nay người khác xoá bản ghi đó: ảnh chụp mới không có nó ⇒ PHẢI để nó mất. */
    const r = GB.ghepBanChuaLenMayChu([], [don("daLen")], napLai, (x) => `po:${x.id}`);
    return {
      duoc: sauKhiThay.size === 0 && napLai.size === 0 && r.length === 0,
      thucTe: `sau ảnh chụp ${sauKhiThay.size} mục · nạp lại ${napLai.size} mục · ghép lại ${r.length} bản ghi`,
      mongDoi:
        "0 · 0 · 0 — thấy trên máy chủ một lần là thôi theo dõi VĨNH VIỄN, kể cả sau khi tải lại trang. Mất chốt này là mọi lần xoá của mọi người đều bị hồi sinh",
    };
  },
);

kiem(
  "🔴 NGHỊCH: sổ cất trên máy HỎNG thì phải rơi về SỔ RỖNG, tuyệt đối không ném lỗi",
  CHU_SO_BEN,
  () => {
    /* Sổ hỏng là chuyện thường: localStorage bị cắt ngang, người dùng sửa tay, đổi phiên bản dữ
       liệu. Ném ở đây là làm chết `DuLieuProvider`, tức chết cả app, vì một thứ chỉ là lưới an
       toàn. Rơi về sổ rỗng = mất lớp giữ bản ghi mới, nhưng app vẫn chạy. */
    const bayGio = 1_757_000_000_000;
    const cac = [
      null,
      undefined,
      "",
      "   ",
      "{khong-phai-json",
      "[1,2,3]",
      '"chuoi tron"',
      soChuoi({ "po:x": null }),
      soChuoi({ "po:x": { soAnhChupVang: "ba", tao: bayGio } }),
    ].map((t) => GB.docSoDaLuuTuChuoi(t, bayGio));
    return {
      duoc: cac.every((m) => m instanceof Map && m.size === 0),
      thucTe: cac.map((m) => (m instanceof Map ? m.size : "KHÔNG PHẢI Map")).join(" · "),
      mongDoi: "0 · 0 · 0 · 0 · 0 · 0 · 0 · 0 · 0 — mọi đầu vào hỏng đều ra Map rỗng, không ném",
    };
  },
);

kiem(
  "THUẬN: mốc `tao` phải SỐNG QUA từng ảnh chụp, không bị soSauAnhChup xoá",
  CHU_SO_BEN,
  () => {
    /* 🔴 `soSauAnhChup` viết `{ soAnhChupVang: … }` trơn thì mỗi ảnh chụp lại xoá mốc tạo ⇒ lần
       tải trang sau `docSoDaLuuTuChuoi` thấy mục "không rõ tuổi" và BỎ nó. Tức bản vá ⑤ tự huỷ
       sau đúng một ảnh chụp, mà không có gì báo. */
    const bayGio = 1_757_000_000_000;
    let s = new Map([["po:moi", { soAnhChupVang: 0, tao: bayGio - 5_000 }]]);
    for (let i = 0; i < 5; i += 1) {
      s = GB.soSauAnhChup(s, new Set([]), new Set(["po:moi"]));
    }
    const napLai = GB.docSoDaLuuTuChuoi(GB.ghiSoRaChuoi(s), bayGio);
    return {
      duoc:
        s.get("po:moi")?.tao === bayGio - 5_000 &&
        s.get("po:moi")?.soAnhChupVang === 5 &&
        napLai.size === 1,
      thucTe: `tao=${s.get("po:moi")?.tao} · vắng=${s.get("po:moi")?.soAnhChupVang} · nạp lại ${napLai.size} mục`,
      mongDoi: `tao=${bayGio - 5_000} · vắng=5 · nạp lại 1 mục`,
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// LUẬT CỦA SẾP — 16/09/2026
// Nguyên văn: "Nếu ko lùi được thì bỏ luôn cưa sổ này để tránh gây
// hiểu nhầm" (kèm ảnh hộp "Chuyển nhiệm vụ sang giai đoạn tiếp theo"
// mở đầy đủ ô nhập + nút "Xác nhận", rồi mới in chữ đỏ nói không lùi
// được).
//
// 📌 MỐC CŨ 27/08/2026 — trước đây CỐ Ý mở hộp cho cả ca "khong_the",
//    vì hồi đó cú bấm thẻ dừng ở hộp nên hộp là đường duy nhất vào
//    trang chi tiết bằng chuột (bỏ hộp = trang chi tiết mồ côi, §3.4b).
//    Tiền đề đó đã hết hiệu lực từ 28/08/2026: bấm thẻ nay mở POP-UP
//    trang chi tiết (onXemPopupThe), không còn đi qua hộp này.
//    Luật đổi có chủ đích, không phải quên.
//
// ⚠️ CHIỀU NGƯỢC LẠI MỚI LÀ CHIỀU QUAN TRỌNG (mấy bài cuối khối): ai
//    sửa hàm thành "không bao giờ mở hộp" là xoá luôn chỗ gỡ vướng
//    tại chỗ (can_go_vuong, Ban lãnh đạo 25/08/2026).
// ════════════════════════════════════════════════════════════════════

kiem(
  "Kéo thả vào ca bị chặn cứng → KHÔNG mở hộp, và có câu lý do để báo toast",
  "Sếp · 16/09/2026",
  () => {
    const r = G.quyetDinhMoHopChuyenBuoc({ loai: "khong_the", lyDo: "Lý do thử" }, "keo_tha");
    return {
      duoc: r.moHop === false && r.baoLyDo === "Lý do thử",
      thucTe: JSON.stringify(r),
      mongDoi: '{ moHop: false, baoLyDo: "Lý do thử" }',
    };
  },
);

kiem(
  "Menu ⋯ 'Chuyển về giai đoạn trước' vào ca bị chặn cứng → KHÔNG mở hộp",
  "Sếp · 16/09/2026",
  () => {
    /* Đây mới là đường vào THẬT trong ảnh Sếp chụp: kéo thả đang tắt
       (keoThaDuoc={false} từ 27/08/2026), hộp chỉ còn mở từ menu ⋯. */
    const r = G.quyetDinhMoHopChuyenBuoc({ loai: "khong_the", lyDo: "Lý do thử" }, "menu_the");
    return {
      duoc: r.moHop === false && r.baoLyDo === "Lý do thử",
      thucTe: JSON.stringify(r),
      mongDoi: '{ moHop: false, baoLyDo: "Lý do thử" } — bày form rồi nói không làm được là §3.5',
    };
  },
);

kiem(
  "Đúng ca trong ảnh Sếp: ⑧ Hồ sơ thanh toán → ⑦ Nhận hàng, hộp KHÔNG được mở",
  "Sếp · 16/09/2026 (luật chặn: Sếp · 15/09/2026)",
  () => {
    /* Đi qua luật thật quyetDinhKeoTha chứ không tự dựng "khong_the":
       bài kiểm này bắt được cả ca ai đó đổi ⑧→⑦ thành đi được. */
    const the = { deNghi: deNghiThu(), giaiDoan: "ho_so_thanh_toan" };
    const hanhDong = G.quyetDinhKeoTha(
      the,
      "nhan_hang",
      [],
      [],
      G.CAU_HINH_MAC_DINH ?? {},
      null,
      { phanBoCongViec: true, xacNhanTruongBP: true },
    );
    const r = G.quyetDinhMoHopChuyenBuoc(hanhDong, "menu_the");
    const lyDo = String(r.baoLyDo ?? "");
    return {
      duoc:
        hanhDong?.loai === "khong_the" &&
        r.moHop === false &&
        lyDo.includes("KHÔNG lùi được") &&
        lyDo.includes("Hồ sơ thanh toán"),
      thucTe: (hanhDong?.loai ?? "?") + " · moHop=" + r.moHop + ' · "' + lyDo.slice(0, 90) + '"',
      mongDoi:
        "khong_the + moHop=false + câu lý do nguyên văn của tầng luật (nói rõ thay chứng từ ở trang chi tiết)",
    };
  },
);

kiem(
  "NGƯỢC LẠI: ca còn vướng nhưng gỡ được trong hộp (can_go_vuong) → VẪN PHẢI MỞ HỘP",
  "Ban lãnh đạo · 25/08/2026 (giữ nguyên qua thay đổi 16/09/2026)",
  () => {
    /* Hộp ở ca này là CHỖ LÀM VIỆC — người dùng đính tệp / tích việc ngay
       tại đó. Bỏ hộp là đuổi họ sang màn khác rồi bắt quay về làm lại. */
    const hd = {
      loai: "can_go_vuong",
      dieuKien: [{ ma: "thieu_hoa_don_vat", cau: "Thiếu hóa đơn VAT", goDuocTaiCho: true }],
      hanhDongSau: { loai: "chot_so_sanh" },
    };
    const ra = ["keo_tha", "menu_the", "xem_nhanh"].map(
      (n) => G.quyetDinhMoHopChuyenBuoc(hd, n).moHop,
    );
    return {
      duoc: ra.every((x) => x === true),
      thucTe: JSON.stringify(ra),
      mongDoi: "[true, true, true] — mọi đường vào đều mở hộp gỡ vướng",
    };
  },
);

kiem(
  "NGƯỢC LẠI: ca đi được bình thường → VẪN PHẢI MỞ HỘP xác nhận",
  "Ban lãnh đạo · 08/08/2026 (hỏi lại trước khi làm việc thật)",
  () => {
    /* Nếu ai sửa hàm thành "không bao giờ mở hộp" thì app làm nghiệp vụ
       thật mà không hỏi ai — đúng thứ chỉ đạo 08/08/2026 cấm. */
    const ra = [
      G.quyetDinhMoHopChuyenBuoc({ loai: "tao_bao_gia", chotLuon: false }, "keo_tha").moHop,
      G.quyetDinhMoHopChuyenBuoc({ loai: "chot_so_sanh" }, "menu_the").moHop,
      G.quyetDinhMoHopChuyenBuoc(
        { loai: "mo_trang", duongDan: "/x", thongBao: "y" },
        "menu_the",
      ).moHop,
    ];
    return {
      duoc: ra.every((x) => x === true),
      thucTe: JSON.stringify(ra),
      mongDoi: "[true, true, true]",
    };
  },
);

kiem(
  "NGƯỢC LẠI: đường 'xem nhanh' vào ca bị chặn vẫn mở hộp (luật 27/08/2026 còn nguyên)",
  "Ban lãnh đạo · 27/08/2026",
  () => {
    /* Hiện chưa nơi nào gọi nguồn này, nhưng luật phải còn sống: ngày nào
       cú bấm thẻ được trỏ lại vào hộp thì không phải dựng lại từ trí nhớ.
       Ở đường XEM, người dùng không chủ ý chuyển bước — bắn toast đỏ vào
       mặt họ là app tố cáo một việc họ chưa hề làm. */
    const r = G.quyetDinhMoHopChuyenBuoc({ loai: "khong_the", lyDo: "Lý do thử" }, "xem_nhanh");
    return {
      duoc: r.moHop === true && r.baoLyDo === null,
      thucTe: JSON.stringify(r),
      mongDoi: "{ moHop: true, baoLyDo: null } — hộp mở, tự khóa nút bằng prop chanCung",
    };
  },
);

kiem(
  "Luật không dựng nổi hành động nào (null) → không mở hộp và KHÔNG bắn toast",
  "Sếp · 16/09/2026",
  () => {
    /* Bước cuối chuỗi. Nơi gọi tự đưa sang trang đầy đủ — không có gì để
       báo, bắn toast đỏ ở đây là báo lỗi cho một việc không phải lỗi. */
    const r = G.quyetDinhMoHopChuyenBuoc(null, "menu_the");
    return {
      duoc: r.moHop === false && r.baoLyDo === null,
      thucTe: JSON.stringify(r),
      mongDoi: "{ moHop: false, baoLyDo: null }",
    };
  },
);

/* ★★ DẢI BÁO "ĐÃ CÓ BẢN MỚI" — thêm 16/09/2026.
   🔴 Vá một lỗ đã gây sự cố THẬT: deploy không đẩy mã mới sang tab đang mở, nên máy chạy bản cũ
   ghi đè được lên dữ liệu của bản mới. Ngày 15/09 phải tắt hết máy cả phòng thì vòng lặp mới
   dừng, dù đã vá và deploy xong từ lâu. Hôm sau đo được ba đơn DMH260011/12/13 mang dấu hỏng
   KHÔNG kèm mốc thời gian — dấu vân tay của bản app trước 14/09.
   🔴 Bài kiểm canh CẢ HAI CHIỀU. Chiều nghịch quan trọng hơn: nếu `coBanMoi` bị sửa thành "thiếu
   thông tin cũng coi là có bản mới" thì mọi máy sẽ bị bày cảnh báo giả ngay lần hỏi đầu tiên,
   và người dùng học được thói quen lờ dải báo đi — lúc có bản mới thật thì không ai buồn bấm. */
const tepRaBanMoi = join(thuMuc, "nhip-kiem-ban-moi.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/nhip-kiem-ban-moi.ts" --bundle --platform=node --format=cjs --outfile="${tepRaBanMoi}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/nhip-kiem-ban-moi.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}
/* `nap` = createRequire, khai ở dòng ~294 — tệp này là ES module nên `require` trần không chạy. */
const BM = nap(tepRaBanMoi);

kiem(
  "Bản máy chủ KHÁC bản đang chạy → báo có bản mới",
  "Sếp 16/09/2026 · vá lỗ máy chạy bản cũ ghi đè dữ liệu bản mới",
  () => {
    const r = BM.coBanMoi("dep_abc123", "dep_xyz789");
    return { duoc: r === true, thucTe: String(r), mongDoi: "true" };
  },
);

kiem(
  "Bản máy chủ GIỐNG bản đang chạy → KHÔNG báo",
  "Sếp 16/09/2026",
  () => {
    const r = BM.coBanMoi("dep_abc123", "dep_abc123");
    return { duoc: r === false, thucTe: String(r), mongDoi: "false" };
  },
);

kiem(
  "CHƯA hỏi được lần đầu (mốc rỗng) → KHÔNG báo, đừng bày cảnh báo giả",
  "CLAUDE.md §3.6c — thiếu thông tin thì cho mức thấp nhất",
  () => {
    const r = BM.coBanMoi("", "dep_xyz789");
    return { duoc: r === false, thucTe: String(r), mongDoi: "false (chưa có mốc để so)" };
  },
);

kiem(
  "Lần hỏi HỎNG (máy chủ trả rỗng) → KHÔNG báo",
  "CLAUDE.md §3.6c",
  () => {
    const r = BM.coBanMoi("dep_abc123", "");
    return { duoc: r === false, thucTe: String(r), mongDoi: "false (lần hỏi hỏng ≠ có bản mới)" };
  },
);

kiem(
  "Vừa phát hiện → CHƯA đổi sang giọng gấp",
  "Sếp 16/09/2026 · nhã nhặn một lần trước khi nói thật",
  () => {
    const moc = 1_000_000;
    const r = BM.daDenLucNhacGap(moc, moc + 60_000);
    return { duoc: r === false, thucTe: String(r), mongDoi: "false (mới 1 phút)" };
  },
);

kiem(
  "Quá 30 phút chưa tải lại → ĐỔI sang giọng gấp",
  "Sếp 16/09/2026 · dải nhã nhặn bị lờ đi thì bằng không làm gì",
  () => {
    const moc = 1_000_000;
    const r = BM.daDenLucNhacGap(moc, moc + BM.HAN_NHAC_GAP_MS);
    return { duoc: r === true, thucTe: String(r), mongDoi: "true" };
  },
);

kiem(
  "Chưa từng phát hiện (mốc 0) → KHÔNG bao giờ gấp",
  "chiều nghịch — mốc rỗng không được tính thành 'đã quá hạn từ lâu'",
  () => {
    const r = BM.daDenLucNhacGap(0, Date.now());
    return { duoc: r === false, thucTe: String(r), mongDoi: "false" };
  },
);

kiem(
  "Câu nhắc mức GẤP phải nói ra HẬU QUẢ, không chỉ mời tải lại",
  "Sếp 16/09/2026 · tới lúc đó lời mời đã thất bại một lần",
  () => {
    const thuong = BM.cauNhacBanMoi(false);
    const gap = BM.cauNhacBanMoi(true);
    const coHauQua = /ghi sai|dữ liệu chung/i.test(gap.chiDan);
    const khacNhau = thuong.chiDan !== gap.chiDan && thuong.tieuDe !== gap.tieuDe;
    return {
      duoc: coHauQua && khacNhau,
      thucTe: `gấp="${gap.chiDan.slice(0, 50)}…" · khác câu thường: ${khacNhau}`,
      mongDoi: "câu gấp nói hậu quả và khác hẳn câu thường",
    };
  },
);

kiem(
  "Vừa phát hiện → đếm ngược đủ 30 giây",
  "Sếp chốt 16/09/2026 chiều: tự tải lại sau 30 giây",
  () => {
    const moc = 1_000_000;
    const r = BM.giayConLai(moc, moc);
    return { duoc: r === 30, thucTe: String(r), mongDoi: "30" };
  },
);

kiem(
  "Đã trôi 10 giây → còn 20",
  "Sếp 16/09/2026",
  () => {
    const moc = 1_000_000;
    const r = BM.giayConLai(moc, moc + 10_000);
    return { duoc: r === 20, thucTe: String(r), mongDoi: "20" };
  },
);

kiem(
  "🔴 Quá hạn (tab ngủ lâu) → trả 0, KHÔNG BAO GIỜ âm",
  "số âm hiện lên dải báo là lỗi người dùng thấy ngay",
  () => {
    const moc = 1_000_000;
    const r = BM.giayConLai(moc, moc + 300_000);
    return { duoc: r === 0, thucTe: String(r), mongDoi: "0" };
  },
);

kiem(
  "Chưa có mốc phát hiện → trả đủ 30, không phải 0",
  "chiều nghịch — trả 0 là tải lại NGAY khi vừa mở app, không kịp báo ai",
  () => {
    const r = BM.giayConLai(0, Date.now());
    return { duoc: r === 30, thucTe: String(r), mongDoi: "30" };
  },
);

kiem(
  "Câu đếm ngược phải nói THẲNG là trang sẽ tự tải lại, ngay đầu câu",
  "Sếp 16/09/2026 · người dùng chỉ liếc dải báo một lần",
  () => {
    const c = BM.cauDemNguocTaiLai(17);
    const noiThang = /^Trang sẽ tự tải lại/.test(c);
    const coSoGiay = c.includes("17");
    const canhBaoMat = /gõ dở sẽ mất|đang gõ dở/.test(c);
    return {
      duoc: noiThang && coSoGiay && canhBaoMat,
      thucTe: c,
      mongDoi: "mở đầu bằng 'Trang sẽ tự tải lại', có số giây, có cảnh báo mất nội dung đang gõ",
    };
  },
);

/* ★★ SO BẢN CŨ VỚI BẢN MỚI ĐỂ BIẾT PHẢI GHI GÌ — nền của việc TÁCH KHO CHUNG (Sếp duyệt 16/09).
   🔴 Đây là phần dễ sai nhất của cả việc tách, vì nó sinh ra LỆNH XOÁ. Ở mô hình cũ, ghi đè bằng
   mảng rỗng chỉ làm hỏng một document và còn cứu được bằng bản sao. Ở mô hình mới nó thành lệnh
   xoá hàng loạt tài liệu — nhanh và dứt khoát hơn nhiều.
   🔴 Bài kiểm canh CẢ HAI CHIỀU. Chiều nghịch quan trọng hơn: nếu `dangNgo` bị sửa thành "luôn
   false" thì lưới chắn biến mất mà mọi thứ vẫn chạy êm — cho tới ngày state về rỗng vì một lý do
   nào đó và app xoá sạch kho của cả phòng. */
const tepRaSoSanh = join(thuMuc, "so-sanh-kho-tach.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/so-sanh-kho-tach.ts" --bundle --platform=node --format=cjs --outfile="${tepRaSoSanh}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/so-sanh-kho-tach.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}
const SS = nap(tepRaSoSanh);
const khoaId = (x) => x.id;

kiem(
  "Bản ghi KHÔNG đổi → không ghi lại",
  "Sếp 16/09/2026 · toàn bộ mục đích của việc tách",
  () => {
    const cu = [{ id: "a", ten: "X" }];
    const r = SS.tinhViecGhi(cu, [{ id: "a", ten: "X" }], khoaId);
    return {
      duoc: r.datLai.length === 0 && r.xoa.length === 0,
      thucTe: `datLai=${r.datLai.length} xoa=${r.xoa.length}`,
      mongDoi: "datLai=0 xoa=0",
    };
  },
);

kiem(
  "Chỉ ĐỔI THỨ TỰ KHOÁ, nội dung y hệt → vẫn coi là không đổi",
  "bài học 16/09/2026 · tôi đã kết luận nhầm vì so bằng JSON.stringify trần",
  () => {
    const r = SS.tinhViecGhi([{ id: "a", x: 1, y: 2 }], [{ id: "a", y: 2, x: 1 }], khoaId);
    return {
      duoc: r.datLai.length === 0,
      thucTe: `datLai=${r.datLai.length}`,
      mongDoi: "0 — thứ tự khoá không phải thay đổi nội dung",
    };
  },
);

kiem(
  "Bản ghi VỪA SỬA → ghi lại đúng một bản",
  "Sếp 16/09/2026",
  () => {
    const r = SS.tinhViecGhi([{ id: "a", ten: "X" }], [{ id: "a", ten: "Y" }], khoaId);
    return {
      duoc: r.datLai.length === 1 && r.datLai[0].khoa === "a",
      thucTe: JSON.stringify(r.datLai.map((v) => v.khoa)),
      mongDoi: '["a"]',
    };
  },
);

kiem(
  "Bản ghi MỚI → ghi thêm, KHÔNG đụng bản cũ",
  "Sếp 16/09/2026 · hai người lập hai đơn không được đè nhau",
  () => {
    const r = SS.tinhViecGhi([{ id: "a", ten: "X" }], [{ id: "a", ten: "X" }, { id: "b", ten: "Z" }], khoaId);
    return {
      duoc: r.datLai.length === 1 && r.datLai[0].khoa === "b" && r.xoa.length === 0,
      thucTe: `datLai=${JSON.stringify(r.datLai.map((v) => v.khoa))} xoa=${JSON.stringify(r.xoa)}`,
      mongDoi: 'datLai=["b"] xoa=[]',
    };
  },
);

kiem(
  "Bản ghi BIẾN MẤT → sinh lệnh xoá đúng khoá đó",
  "Sếp 16/09/2026 · xoá đề nghị, huỷ đơn là thao tác thật",
  () => {
    const r = SS.tinhViecGhi([{ id: "a" }, { id: "b" }], [{ id: "a" }], khoaId);
    return {
      duoc: r.xoa.length === 1 && r.xoa[0] === "b" && !r.dangNgo,
      thucTe: `xoa=${JSON.stringify(r.xoa)} dangNgo=${r.dangNgo}`,
      mongDoi: 'xoa=["b"] dangNgo=false',
    };
  },
);

kiem(
  "🔴 XOÁ SẠCH kho đang có nhiều bản ghi → BÁO ĐỘNG, nơi gọi phải dừng",
  "lưới chắn cuối trước khi xoá nhầm dữ liệu cả phòng",
  () => {
    const cu = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "e" }, { id: "f" }];
    const r = SS.tinhViecGhi(cu, [], khoaId);
    return {
      duoc: r.dangNgo === true && r.xoa.length === 6,
      thucTe: `dangNgo=${r.dangNgo} xoa=${r.xoa.length}`,
      mongDoi: "dangNgo=true (state rỗng KHÔNG được coi là lệnh xoá sạch)",
    };
  },
);

kiem(
  "Kho NHỎ, xoá 1/2 → KHÔNG báo động (thao tác bình thường)",
  "chiều nghịch — chặn cả kho nhỏ là app mất tính năng xoá",
  () => {
    const r = SS.tinhViecGhi([{ id: "a" }, { id: "b" }], [{ id: "a" }], khoaId);
    return {
      duoc: r.dangNgo === false,
      thucTe: `dangNgo=${r.dangNgo}`,
      mongDoi: "false — kho dưới ngưỡng thì không xét phần trăm",
    };
  },
);

kiem(
  "Kho LỚN, xoá đúng một bản → KHÔNG báo động",
  "chiều nghịch — lưới chắn không được chặn thao tác thật",
  () => {
    const cu = Array.from({ length: 20 }, (_, i) => ({ id: `x${i}` }));
    const r = SS.tinhViecGhi(cu, cu.slice(1), khoaId);
    return {
      duoc: r.dangNgo === false && r.xoa.length === 1,
      thucTe: `dangNgo=${r.dangNgo} xoa=${r.xoa.length}`,
      mongDoi: "dangNgo=false xoa=1",
    };
  },
);

kiem(
  "Bảng giá dùng `poId` làm khoá, không phải `id`",
  "GiaDonDatHang không có trường id — đo trên kieu-du-lieu.ts 16/09/2026",
  () => {
    const r = SS.tinhViecGhi(
      [{ poId: "po1", tien: 100 }],
      [{ poId: "po1", tien: 200 }],
      (x) => x.poId,
    );
    return {
      duoc: r.datLai.length === 1 && r.datLai[0].khoa === "po1",
      thucTe: JSON.stringify(r.datLai.map((v) => v.khoa)),
      mongDoi: '["po1"]',
    };
  },
);

kiem(
  "Bản ghi THIẾU KHOÁ → bỏ qua, KHÔNG ném lỗi",
  "một bản ghi hỏng không được chặn đồng bộ của tất cả bản ghi còn lại",
  () => {
    const r = SS.tinhViecGhi([], [{ id: "" }, { id: "a" }], khoaId);
    return {
      duoc: r.datLai.length === 1 && r.datLai[0].khoa === "a",
      thucTe: `datLai=${JSON.stringify(r.datLai.map((v) => v.khoa))}`,
      mongDoi: 'datLai=["a"] — bỏ bản thiếu khoá, giữ bản hợp lệ',
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// ⑤ PHIẾU GIAO HÀNG — BỘ HỒ SƠ THANH TOÁN PHẢI TRẢ LỜI GIỐNG `vuongMacXacNhanKho`
//
// 🔴 VÌ SAO CÓ BÀI KIỂM NÀY: tới 18/09/2026 hai nơi trả lời NGƯỢC NHAU cho cùng một phiếu.
//    `vuongMacXacNhanKho` coi ảnh QLK CTR là bằng chứng giao nhận hợp lệ (luật của phiên tích
//    hợp, 23/08/2026), còn `dungBoHoSoThanhToan` chỉ đếm `tep` nên vẫn báo vàng "Chưa có phiếu
//    giao nhận nào". Sếp nhìn thấy app vừa liệt kê 4 ảnh vừa bảo không có ảnh, và hỏi
//    *"có cách nào kéo nội dung này về app Thu mua không"*.
//
// ⚠️ `grep "anhQlkCtr"` trong `bo-ho-so-thanh-toan.ts` CHO XANH GIẢ — chuỗi đó còn nằm trong
//    câu ghi chú của nhóm. Chỉ phép gọi thật mới phân biệt được (CLAUDE.md §6.6).
// ════════════════════════════════════════════════════════════════════

const CHU_SEP_ANH_QLK =
  'Sếp · 18/09/2026 — *"CÓ CÁCH NÀO KÉO NỘI DUNG NÀY VỀ APP THU MUA KO"* (hỏi vì mục ⑤ vừa ' +
  "liệt kê ảnh QLK CTR vừa báo vàng chưa có phiếu giao nhận)";

/** Lấy đúng mục ⑤ bằng cách gọi thật hàm dựng bộ hồ sơ. */
const muc5PhieuGiao = (phieu) => {
  const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
  return BH.dungBoHoSoThanhToan({ id: "dn-anh-qlk", tepGiaiDoan: {} }, poBoHoSo, phieu, []).find(
    (m) => m.ma === "phieu_giao_hang",
  );
};
const phieuCoAnhQlk = [
  {
    id: "pn1",
    poCode: "DMH260007",
    lanGiaoThu: 1,
    trangThai: "da_nhap_kho",
    anhQlkCtr: { ten: "TC_cot.jpg", url: "https://qlk/api/files/abc" },
  },
];

kiem("Lan giao CO anh QLK CTR -> muc ⑤ tinh la DA CO, KHONG bao vang", CHU_SEP_ANH_QLK, () => {
  const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
  const m = muc5PhieuGiao(phieuCoAnhQlk);
  const daCo = m ? BH.mucDaCo(m) === true : false;
  const khongBaoThieu = !/Chưa có phiếu giao nhận nào/.test(String(m?.ghiChu ?? ""));
  return {
    duoc: daCo && khongBaoThieu,
    thucTe: `mucDaCo=${m ? BH.mucDaCo(m) : "KHONG CO MUC 5"} · ghiChu="${String(m?.ghiChu ?? "(trống)").slice(0, 90)}"`,
    mongDoi:
      "mucDaCo=true va KHONG con cau vang — `vuongMacXacNhanKho` da coi anh QLK CTR la bang " +
      "chung hop le, hai noi phai tra loi giong nhau",
  };
});

kiem(
  "CHIEU NGHICH — lan giao KHONG co gi -> VAN phai bao thieu",
  CHU_SEP_ANH_QLK,
  () => {
    /* 🔴 Chống chữa bài trên bằng cách cho `bangChungNgoai` luôn bật: làm vậy thì hồ sơ thật sự
       thiếu phiếu giao nhận cũng hiện đủ, và luật 11/08/2026 (mỗi lần giao một tờ phiếu) mất
       sạch. Đừng sửa bài kiểm cho vừa mã nguồn. */
    const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
    const m = muc5PhieuGiao([
      { id: "pn2", poCode: "DMH260007", lanGiaoThu: 1, trangThai: "cho_kiem_tra" },
    ]);
    const thieu = m ? BH.mucDaCo(m) === false : false;
    /* ⚠️ ĐỔI CHUỖI ĐÒI HỎI 18/09/2026 — LUẬT KHÔNG ĐỔI, chỉ CÂU CHỮ đổi. Trước đó mục ⑤ luôn in
       "Chưa có phiếu giao nhận nào" kể cả khi hồ sơ đã có phiếu cho lần 1 và chỉ thiếu lần 2 —
       sai sự thật, và người đọc đi tìm nhầm chỗ. Nay câu nói rõ THIẾU LẦN NÀO. Bài kiểm vì vậy
       chỉ đòi "còn câu cảnh báo và nó nhắc tới phiếu giao nhận", không ghim nguyên văn. */
    const conCauCanhBao = /phiếu giao nhận/i.test(String(m?.ghiChu ?? ""));
    return {
      duoc: thieu && conCauCanhBao,
      thucTe: `mucDaCo=${m ? BH.mucDaCo(m) : "KHONG CO MUC 5"} · ghiChu="${String(m?.ghiChu ?? "(trống)").slice(0, 90)}"`,
      mongDoi: "mucDaCo=false VA con cau canh bao — khong co anh, khong co tep thi dung la thieu that",
    };
  },
);

// ────────────────────────────────────────────────────────────────────
// 🔴 CA HỖN HỢP — NHIỀU LẦN GIAO, MỘT LẦN THIẾU. Lỗ hổng đo được 18/09/2026.
//
// Ba bài kiểm phía trên (viết cùng ngày) đều truyền mảng MỘT phiếu duy nhất, nên không bài nào
// bắt được ca thật hay gặp nhất: đơn giao nhiều lần. Mục ⑤ hỏi bằng `.some` còn luật gốc
// `vuongMacXacNhanKho` hỏi bằng `.every` ⇒ hồ sơ thiếu một tờ phiếu vẫn hiện ✓ xanh cho Kế toán.
//
// 📌 CÁCH KIỂM MẠNH NHẤT: so THẲNG hai nơi với nhau, đúng câu luật mà chú thích mục ⑤ tự đặt ra —
//    *"HAI NƠI NÀY PHẢI LUÔN CÙNG MỘT CÂU TRẢ LỜI"*. So như vậy thì sau này ai sửa một bên mà
//    quên bên kia là đỏ ngay, không cần thêm bài mới cho từng ca.
// ────────────────────────────────────────────────────────────────────

const hoSoNhieuLanGiao = (...ds) =>
  ds.map((kieu, i) => {
    const nen = { id: `pn-h${i}`, poCode: "DMH260007", lanGiaoThu: i + 1, trangThai: "da_nhap_kho" };
    if (kieu === "tep") return { ...nen, tepPhieuGiao: { id: `t${i}`, ten: `phieu-${i}.pdf` } };
    if (kieu === "anh") return { ...nen, anhQlkCtr: { ten: `a${i}.jpg`, url: "https://qlk/x" } };
    if (kieu === "tu-choi") return { ...nen, trangThai: "tu_choi_nhan" };
    return nen; // "thieu"
  });

for (const ca of [
  { ten: "co tep + THIEU", ds: ["tep", "thieu"], mongCo: false },
  { ten: "tu choi + THIEU", ds: ["tu-choi", "thieu"], mongCo: false },
  { ten: "anh QLK + THIEU", ds: ["anh", "thieu"], mongCo: false },
  { ten: "anh QLK + anh QLK (chieu nghich)", ds: ["anh", "anh"], mongCo: true },
  { ten: "tep + tu choi (chieu nghich)", ds: ["tep", "tu-choi"], mongCo: true },
]) {
  kiem(`Nhieu lan giao — ${ca.ten}: muc ⑤ va luat kho phai NOI CUNG MOT CAU`, CHU_SEP_ANH_QLK, () => {
    const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
    const TT = nap(join(thuMuc, "tinh-toan.cjs"));
    const phieu = hoSoNhieuLanGiao(...ca.ds);
    const m = muc5PhieuGiao(phieu);
    const mucCo = m ? BH.mucDaCo(m) === true : false;
    const khoKhongVuong = TT.vuongMacXacNhanKho(phieu) === null;
    return {
      duoc: mucCo === khoKhongVuong && mucCo === ca.mongCo,
      thucTe: `muc ⑤ da co=${mucCo} · luat kho khong vuong=${khoKhongVuong} · ghiChu="${String(m?.ghiChu ?? "(trống)").slice(0, 80)}"`,
      mongDoi: `ca hai = ${ca.mongCo} — thieu mot to phieu la thieu ca muc (BLD 11/08/2026: moi lan giao mot to)`,
    };
  });
}

kiem("Lan giao BI TU CHOI NHAN -> khong doi phieu, muc ⑤ khong bao thieu", CHU_SEP_ANH_QLK, () => {
  /* Cùng một luật với `vuongMacXacNhanKho`: hàng bị từ chối thì không có tờ phiếu nào được ký,
     bắt đính kèm là làm kẹt đơn vĩnh viễn (chỉ đạo 11/08/2026). */
  const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
  const m = muc5PhieuGiao([
    { id: "pn3", poCode: "DMH260007", lanGiaoThu: 1, trangThai: "tu_choi_nhan" },
  ]);
  return {
    duoc: m ? BH.mucDaCo(m) === true : false,
    thucTe: `mucDaCo=${m ? BH.mucDaCo(m) : "KHONG CO MUC 5"}`,
    mongDoi: "true — `vuongMacXacNhanKho` cung bo qua phieu `tu_choi_nhan`",
  };
});

// ════════════════════════════════════════════════════════════════════
// MỘT MÓN NỢ CHỈ BÀY Ở MỘT BƯỚC — Sếp 18/09/2026
//
// Hai ảnh trong cùng buổi sáng: thẻ kanban hiện hai dòng giống hệt *"④ thiếu HĐ"* + *"Thiếu HĐ"*;
// khối ⑤ hiện câu "Chưa có tệp Hợp đồng…" mà Sếp khoanh đỏ *"Thông báo này ở sai chỗ. Đây là
// thông báo ở bước lập đơn mua hàng"*.
// ════════════════════════════════════════════════════════════════════

const CHU_SEP_NO_DUNG_BUOC =
  'Sếp · 18/09/2026 — *"Thông báo này ở sai chỗ. Đây là thông báo ở bước lập đơn mua hàng"* + ' +
  '*"ở mục báo thiếu… đó là thiếu ĐMH"*';

const CH_TRONG = { soBaoGiaToiThieu: 2, hanGioTheoBuoc: {}, congViecTheoBuoc: {}, caiDatTungBuoc: {} };
const nhanCuaBuoc = (dn, buoc) =>
  (G.mucConNoCuaBuoc(dn, buoc, CH_TRONG, [], []) ?? []).map((m) => `${m?.ngan ?? ""}`).join(" | ");

/* ════════════════════════════════════════════════════════════════════
   🔴 NHÃN NGẮN ĐỔI CHỮ NGÀY 19/09/2026 — ĐỌC TRƯỚC KHI SỬA BỐN BÀI DƯỚI

   Sếp 19/09/2026, nguyên văn: ***"Bỏ số 4 đi và ghi rõ thông tin / Thiếu hợp đồng / Thiếu đơn
   mua hàng (PO)"***. Bốn bài dưới đây trước đó tìm chuỗi viết tắt `thiếu HĐ` / `thiếu ĐMH`, nên
   chúng đỏ ngay khi nhãn đổi chữ.

   📌 VÌ SAO ĐỔI BÀI KIỂM Ở ĐÂY KHÔNG PHẢI LÀ "SỬA BÀI CHO VỪA MÃ NGUỒN":
   luật mà bốn bài này ghim là **món nợ được báo ở BƯỚC NÀO** và **bấm "Bổ sung sau" không xoá
   món nợ** (Sếp 18/09/2026) — không phải chuỗi chữ. Chuỗi chỉ là cách nhận ra mục. Mọi điều kiện
   về bước giữ nguyên từng chữ; chỉ đổi thứ dùng để nhận diện.

   ⚠️ CỐ Ý KHÔNG CHẤP NHẬN CẢ CHỮ CŨ LẪN CHỮ MỚI. Viết `/thiếu HĐ|Thiếu hợp đồng/` thì ai quay về
   bản viết tắt vẫn xanh — tức mất luôn dấu vết chỉ đạo 19/09. Bài "KHONG con so khoanh" ngay
   dưới nhóm này là chỗ ghim chỉ đạo đó.
   ════════════════════════════════════════════════════════════════════ */
const CHU_SEP_NHAN_DU_CHU =
  'Sếp · 19/09/2026 — *"Bỏ số 4 đi và ghi rõ thông tin / Thiếu hợp đồng / Thiếu đơn mua hàng (PO)"*';

kiem("Da ghi ly do no HD -> bao o buoc ④, KHONG bao o buoc ⑤", CHU_SEP_NO_DUNG_BUOC, () => {
  const CT = nap(join(thuMuc, "chung-tu.cjs"));
  const dn = hoSoThieuHD(CT.LY_DO_BO_SUNG_SAU);
  const o4 = nhanCuaBuoc(dn, "lap_don_mua_hang");
  const o5 = nhanCuaBuoc(dn, "dat_hang");
  return {
    duoc: /Thiếu hợp đồng/.test(o4) && !/Thiếu hợp đồng/.test(o5),
    thucTe: `④=[${o4 || "(rỗng)"}] · ⑤=[${o5 || "(rỗng)"}]`,
    mongDoi: "④ co 'Thieu hop dong' (noi co o de dinh), ⑤ KHONG con — mot mon no mot dong",
  };
});

kiem(
  "CHIEU NGHICH — CHUA ghi ly do nao thi buoc ⑤ VAN phai bao thieu HD",
  CHU_SEP_NO_DUNG_BUOC,
  () => {
    /* 🔴 Chống chữa bài trên bằng cách bỏ hẳn nhánh ⑤. Hồ sơ chưa từng bấm "Bổ sung sau" thì
       nhánh ④ KHÔNG bật (nó đòi có lý do), nên bỏ ⑤ là hồ sơ đó mất sạch cảnh báo — trong khi
       `vuongMacRoiBuocLapDon` vẫn chặn nó chuyển bước. Người dùng bị chặn mà màn hình trắng trơn. */
    const dn = hoSoThieuHD("");
    const o5 = nhanCuaBuoc(dn, "dat_hang");
    return {
      duoc: /Thiếu hợp đồng/.test(o5),
      thucTe: `⑤=[${o5 || "(rỗng)"}]`,
      mongDoi: "⑤ VAN co 'Thieu hop dong' — khong co ly do thi khong co dong nao o ④ de thay the",
    };
  },
);

kiem("Buoc ⑤ thieu ban NCC ky -> bao 'thieu ĐMH'", CHU_SEP_NO_DUNG_BUOC, () => {
  /* Trước 18/09/2026 thẻ kanban KHÔNG hề nhắc món này, dù luật đòi bản NCC ký đã có từ 16/09. */
  const dn = hoSoThieuHD("");
  const o5 = nhanCuaBuoc(dn, "dat_hang");
  return {
    duoc: /Thiếu đơn mua hàng \(PO\)/.test(o5),
    thucTe: `⑤=[${o5 || "(rỗng)"}]`,
    mongDoi: "⑤ co 'Thieu don mua hang (PO)' — chu day du, Sep 19/09/2026",
  };
});

kiem(
  'CHIEU NGHICH — bam "Bo sung sau" cho DMH thi VAN con "thieu ĐMH"',
  CHU_SEP_NO_DUNG_BUOC,
  () => {
    /* 🔴 Chống việc lấy `vuongMacRoiBuocDatHang` làm nguồn: hàm đó trả null ngay khi có lý do, nên
       bấm "Bổ sung sau" một cái là thẻ thôi nhắc — trái cách hợp đồng đang xử (Sếp 13/09: chỉ
       "Không có HĐ" mới hết đỏ, "Bổ sung sau" vẫn đỏ). */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const dn = {
      ...hoSoThieuHD(""),
      /* 🔴 KHOÁ LÀ `.khoa`, KHÔNG PHẢI CẢ OBJECT — sửa 18/09/2026. Bản đầu viết
         `{ [CT.CHUNG_TU_DON_MUA_HANG]: ... }`, mà khoá của object trong JS bị ép thành chuỗi nên
         ra `"[object Object]"`: hồ sơ thử KHÔNG hề mang lý do nào, và bài kiểm xanh vì lý do sai.
         Xanh giả kiểu này nguy hơn không có bài kiểm — nó tạo cảm giác đã được canh. */
      lyDoThieuChungTu: { [CT.CHUNG_TU_DON_MUA_HANG.khoa]: CT.LY_DO_BO_SUNG_SAU },
    };
    const o5 = nhanCuaBuoc(dn, "dat_hang");
    return {
      duoc: /Thiếu đơn mua hàng \(PO\)/.test(o5),
      thucTe: `⑤=[${o5 || "(rỗng)"}]`,
      mongDoi: '"Bo sung sau" KHONG xoa mon no — chi co tep that moi xoa',
    };
  },
);

kiem("Nhan tren the KHONG con so khoanh ④ — ghi du chu", CHU_SEP_NHAN_DU_CHU, () => {
  /* 🔴 Ghim chỉ đạo 19/09/2026. Hồ sơ đã ghi lý do nợ HĐ thì món nợ nằm ở bước ④, còn thẻ đang
     đứng ở bước ⑤ ⇒ đi đúng nhánh trước đây gắn tiền tố `④` (`mucConNoToanHoSo`). Bài này đòi
     nhãn in ra mặt thẻ không còn ký tự số khoanh nào, và vẫn phải nói đủ tên tệp đang thiếu.

     ⚠️ ĐÒI CẢ HAI VẾ là cố ý: chỉ đòi "không có số khoanh" thì ai xoá sạch nhãn cũng xanh. */
  const CT = nap(join(thuMuc, "chung-tu.cjs"));
  const dn = hoSoThieuHD(CT.LY_DO_BO_SUNG_SAU);
  const the = (G.dsConNoBayTrenThe(dn, "dat_hang", CH_TRONG, [], []) ?? []).join(" | ");
  return {
    duoc: !/[①②③④⑤⑥⑦⑧⑨]/.test(the) && /Thiếu hợp đồng/.test(the),
    thucTe: `thẻ=[${the || "(rỗng)"}]`,
    mongDoi: "khong con ky tu ①..⑨, va van co dong 'Thieu hop dong'",
  };
});

// ════════════════════════════════════════════════════════════════════
// BẢNG HOÁ ĐƠN VAT LÀ NGUỒN DUY NHẤT — Sếp 19/09/2026
//
// *"Thêm các trường nhập liệu: 1. STT · 2. Số hoá đơn · 3. Ngày hoá đơn · 4. Số tiền trên hoá
// đơn · 5. Đính kèm"*, và khi được hỏi lại thì Sếp chọn **"Bảng là nguồn duy nhất, ô Công nợ tự
// cộng"** + **"Cho đóng hồ sơ, chỉ nhắc bằng chữ vàng"**.
// ════════════════════════════════════════════════════════════════════

const CHU_SEP_BANG_HOA_DON =
  'Sếp · 19/09/2026 — *"Thêm các trường nhập liệu: STT · Số hoá đơn · Ngày hoá đơn · Số tiền ' +
  'trên hoá đơn · Đính kèm"* + chốt "Bảng là nguồn duy nhất, ô Công nợ tự cộng"';

kiem("Co bang hoa don -> TONG lay tu bang, KHONG lay o go tay", CHU_SEP_BANG_HOA_DON, () => {
  const TN = nap(join(thuMuc, "tuoi-no.cjs"));
  /* 🔴 Chot cua Sep: uu tien nguoc lai (doc `tongTienHoaDon` truoc) la nguoi dung nhap bang xong
     ma cot "Con phai tra" van giu so cu — dung thu hai-cho-mot-so ma Sep yeu cau dep. */
  const coBang = TN.tongTienHoaDonCuaDon({
    hoaDonVAT: [{ soTien: 30_000_000 }, { soTien: 15_522_000 }],
    tongTienHoaDon: 999,
  });
  const chuoi = TN.chuoiSoHoaDonCuaDon({
    hoaDonVAT: [{ soHoaDon: "HD-01" }, { soHoaDon: "HD-02" }],
    soHoaDon: "so-cu",
  });
  return {
    duoc: coBang === 45_522_000 && chuoi === "HD-01 · HD-02",
    thucTe: `tong=${coBang} · chuoi=${JSON.stringify(chuoi)}`,
    mongDoi: "45522000 va 'HD-01 · HD-02' (bang thang o go tay)",
  };
});

kiem(
  "CHIEU NGHICH — CHUA co bang thi VAN doc o go tay cua don cu",
  CHU_SEP_BANG_HOA_DON,
  () => {
    /* 🔴 Hang chuc don cu da go tay vao `tongTienHoaDon` va khong ai di nhap lai. Bo nhanh du
       phong nay la chung mat sach can cu tinh no, im lang. */
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const khongBang = TN.tongTienHoaDonCuaDon({ tongTienHoaDon: 7_000_000 });
    const bangRong = TN.tongTienHoaDonCuaDon({ hoaDonVAT: [], tongTienHoaDon: 7_000_000 });
    /* Mang RONG khac "da nhap 0 dong": tra 0 thi don chua nhap hoa don se trong nhu DA TRA XONG
       khi nguoi xem chon can cu "theo hoa don". */
    const trongTron = TN.tongTienHoaDonCuaDon({});
    return {
      duoc: khongBang === 7_000_000 && bangRong === 7_000_000 && trongTron === undefined,
      thucTe: `khong bang=${khongBang} · bang rong=${bangRong} · trong tron=${trongTron}`,
      mongDoi: "7000000 · 7000000 · undefined (RONG khong phai da nhap 0 dong)",
    };
  },
);

kiem(
  "Dong hoa don RAC khong lam hong ca cot tien",
  CHU_SEP_BANG_HOA_DON,
  () => {
    /* Du lieu tu kho chung KHONG qua phep kiem tung phan tu — mot dong rac la ca cot hien "NaN d". */
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const r = TN.tongTienHoaDonCuaDon({
      hoaDonVAT: [{ soTien: 1_000_000 }, { soTien: Number("hai trieu") }, { soTien: 500_000 }],
    });
    return {
      duoc: r === 1_500_000,
      thucTe: String(r),
      mongDoi: "1500000 — bo qua dong rac, KHONG tra NaN",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// ĐỌC HOÁ ĐƠN PDF VECTOR — Sếp 20/09/2026
//
// *"a muốn đính kèm file hoá đơn vào là app tự đọc thông tin trên hoá đơn và nhập số liệu vào
// trường dữ liệu đang có thì có được không?"* → *"Hãy làm trước nhánh với file PDF vector"*.
//
// 🔴 VĂN BẢN THỬ DƯỚI ĐÂY LẤY ĐÚNG CẤU TRÚC hoá đơn thật Sếp gửi (mẫu Bkav, ký hiệu `1C25THA`),
// CHỈ THAY tên nhà cung cấp và mã số thuế bằng tên giả — quy ước dự án cấm để tên thương hiệu
// NCC thật trong dữ liệu mẫu.
// ════════════════════════════════════════════════════════════════════

const CHU_SEP_DOC_HOA_DON =
  'Sếp · 20/09/2026 — *"đính kèm file hoá đơn vào là app tự đọc thông tin"* + *"làm trước nhánh với file PDF vector"*';

/* Cấu trúc SONG NGỮ đúng như hoá đơn thật: tiếng Việt · (tiếng Anh) · dấu hai chấm · giá trị. */
const HOA_DON_THU =
  "HÓA ĐƠN GIÁ TRỊ GIA TĂNG  (VAT INVOICE)  Ngày   (day)   10   tháng   (month)   12   năm   " +
  "(year)   2025  Đơn vị bán   (Seller) :   CÔNG TY TNHH VLXD A  Mã số thuế   (Tax Code) :   " +
  "0000000000  1   Nước uống đóng chai   Thùng   100   69.444,444   6.944.444  " +
  "Cộng tiền hàng   (Sub total) :   6.944.444  Thuế suất GTGT   (Tax rate) :   8%   " +
  "Tiền thuế GTGT   (VAT amount) :   555.556  " +
  "Tổng cộng tiền thanh toán   (Total payment) :   7.500.000  " +
  "Mẫu số - Ký hiệu   (Serial No.) :   1C25THA  Số   (Invoice No.) :   00001879";

kiem("Doc dung 3 truong tu hoa don PDF that", CHU_SEP_DOC_HOA_DON, () => {
  const D = nap(join(thuMuc, "doc-hoa-don.cjs"));
  const r = D.doHoaDonTuVanBan(HOA_DON_THU);
  return {
    duoc: r.soHoaDon === "00001879" && r.ngayHoaDon === "2025-12-10" && r.soTien === 7_500_000,
    thucTe: `so=${r.soHoaDon} · ngay=${r.ngayHoaDon} · tien=${r.soTien}`,
    mongDoi: "00001879 · 2025-12-10 · 7500000",
  };
});

kiem(
  "CHIEU NGHICH — KHONG duoc lay nham tien hang chua thue hay tien thue",
  CHU_SEP_DOC_HOA_DON,
  () => {
    /* 🔴🔴 BAI KIEM QUAN TRONG NHAT CUA TINH NANG NAY. Hoa don co BA dong tien:
         Cong tien hang (chua thue) = 6.944.444
         Tien thue GTGT             =   555.556
         Tong cong tien thanh toan  = 7.500.000  <- DUNG con so cong no can
       Lay nham mot trong hai dong dau la so no THIEU dung phan VAT, ma nhin vao bang thi khong
       co gi bat thuong. Bai nay ghim thu tu uu tien cua `KHOA_TIEN`. */
    const D = nap(join(thuMuc, "doc-hoa-don.cjs"));
    const r = D.doHoaDonTuVanBan(HOA_DON_THU);
    return {
      duoc: r.soTien !== 6_944_444 && r.soTien !== 555_556 && r.soTien === 7_500_000,
      thucTe: String(r.soTien),
      mongDoi: "7500000 — KHONG phai 6944444 (chua thue) hay 555556 (thue)",
    };
  },
);

kiem("Doi tien: dau cham la PHAN CACH NGHIN, khong phai thap phan", CHU_SEP_DOC_HOA_DON, () => {
  /* 🔴 Hieu "45.522.000" la 45,5 dong thay vi 45 trieu thi con so do troi thang vao so cong no. */
  const D = nap(join(thuMuc, "doc-hoa-don.cjs"));
  const ca = [
    ["45.522.000", 45_522_000],
    ["7.500.000", 7_500_000],
    ["1.234", 1_234],
    ["69.444,444", 69_444], // don gia co phan le kieu Viet -> lam tron
    ["500", 500],
  ];
  const sai = ca.filter(([chuoi, mong]) => D.doiTienHoaDon(chuoi) !== mong);
  return {
    duoc: sai.length === 0,
    thucTe: sai.length === 0 ? "dung het" : sai.map(([c]) => `${c} -> ${D.doiTienHoaDon(c)}`).join(" · "),
    mongDoi: "45522000 · 7500000 · 1234 · 69444 · 500",
  };
});

kiem(
  "Khong doc duoc thi tra undefined, KHONG bia so",
  CHU_SEP_DOC_HOA_DON,
  () => {
    /* App bia mot con so roi dien san vao o tien la nguoi dung bam Luu ma khong biet no sai o dau. */
    const D = nap(join(thuMuc, "doc-hoa-don.cjs"));
    const r = D.doHoaDonTuVanBan("Day khong phai hoa don, chi la mot doan chu bat ky.");
    return {
      duoc: r.soTien === undefined && r.daDoc.length === 0,
      thucTe: `tien=${r.soTien} · daDoc=[${r.daDoc.join(",")}]`,
      mongDoi: "undefined va daDoc rong",
    };
  },
);

/* ============================================================================
   NĂM BÀI DƯỚI ĐÂY RA ĐỜI TỪ MỘT LƯỢT PHẢN BIỆN NGÀY 20/09/2026.
   Mỗi bài ghim MỘT lỗi đã ĐO ĐƯỢC, và điểm chung của cả năm: app cho ra một giá trị
   TRÔNG HỢP LỆ HOÀN TOÀN, nên người nhập không có cách nào biết mình đang lưu cái sai.
   ============================================================================ */

kiem("CHIEU NGHICH — hoa don dieu chinh GIAM khong duoc thanh so DUONG", CHU_SEP_DOC_HOA_DON, () => {
  /* 🔴 Bo dau tru la no TANG thay vi GIAM. Nguoi nhap nhin o thay dung con so 1.500.000 nen
     khong co dau hieu nao de biet. Hoa don dieu chinh giam la chuyen thuong trong xay dung. */
  const D = nap(join(thuMuc, "doc-hoa-don.cjs"));
  const r = D.doHoaDonTuVanBan("HOA DON DIEU CHINH GIAM Tổng cộng tiền thanh toán : -1.500.000");
  return {
    duoc: r.soTien === undefined && typeof r.canhBao === "string" && r.canhBao.length > 0,
    thucTe: `tien=${r.soTien} · canhBao=${r.canhBao ? "co" : "KHONG"}`,
    mongDoi: "KHONG dien so tien, va co cau canh bao cho nguoi dung",
  };
});

kiem("So hoa don: khong duoc lay nham Mau so / Ma so thue", CHU_SEP_DOC_HOA_DON, () => {
  /* 🔴 `"so:"` la chuoi con cua "Mau so:" va "Ma so:". `indexOf` lay lan dau tien nen tren hoa
     don CHI TIENG VIET no vo ngay ma mau hoac ma so thue. So hoa don sai thi doi chieu voi nha
     cung cap la hong. */
  const D = nap(join(thuMuc, "doc-hoa-don.cjs"));
  const a = D.doHoaDonTuVanBan(
    "Mẫu số: 01GTKT0/001 Ký hiệu: 1C25THA Số: 00001879 Tổng cộng tiền thanh toán: 7.500.000",
  ).soHoaDon;
  const b = D.doHoaDonTuVanBan(
    "Mã số: 0301234567 Số: 00001879 Tổng cộng tiền thanh toán: 7.500.000",
  ).soHoaDon;
  /* Ca thu ba: phan tieng Anh trong ngoac tung bi lay lam so hoa don (ra chu "Invoice"). */
  const c = D.doHoaDonTuVanBan(
    "Số hoá đơn   (Invoice No.) :   00001879 Tổng cộng tiền thanh toán: 7.500.000",
  ).soHoaDon;
  return {
    duoc: a === "00001879" && b === "00001879" && c === "00001879",
    thucTe: `mau-so=${a} · ma-so=${b} · song-ngu=${c}`,
    mongDoi: "ca ba deu 00001879",
  };
});

kiem("Ngay: khong nhan ngay KHONG CO THAT, khong lay han thanh toan", CHU_SEP_DOC_HOA_DON, () => {
  /* 🔴 Ma tra cuu `1234-56-78` khop khuon ISO va LOT qua `vuongMacDongHoaDon` (chi kiem khuon).
     Ngay hoa don la dau vao cua han no va canh bao qua han — ngay rac la ca cot canh bao sai. */
  const D = nap(join(thuMuc, "doc-hoa-don.cjs"));
  const ca = [
    [D.doiNgayHoaDon("1234-56-78"), undefined, "ma tra cuu khong phai ngay"],
    [D.doiNgayHoaDon("32/13/2026"), undefined, "thang 13 ngay 32"],
    [D.doiNgayHoaDon("29/02/2025"), undefined, "2025 khong nhuan"],
    [D.doiNgayHoaDon("29/02/2024"), "2024-02-29", "2024 nhuan — phai nhan"],
    [
      D.doHoaDonTuVanBan("Hạn thanh toán 30/12/2026 ; Ngày 05/11/2026").ngayHoaDon,
      "2026-11-05",
      "khong duoc lay han thanh toan",
    ],
  ];
  const sai = ca.filter(([duoc, mong]) => duoc !== mong);
  return {
    duoc: sai.length === 0,
    thucTe: sai.length === 0 ? "dung het" : sai.map(([d, m, t]) => `${t}: ${d} (mong ${m})`).join(" · "),
    mongDoi: "chan ngay rac, van giu ngay that",
  };
});

kiem("Doc duoc ca chu dang NFD (dau tach roi)", CHU_SEP_DOC_HOA_DON, () => {
  /* 🔴 `doanSauKhoa` tim chi so tren chuoi DA BO DAU roi cat tren chuoi GOC — chi dung khi hai
     chuoi cung do dai. Chu dang NFD tach dau thanh ky tu rieng, `boDau` xoa di nen chuoi ngan
     hon va MOI CHI SO LECH. Do duoc: ban NFD cho ra so hoa don la chu "hoa".
     pdf.js tra dung nhung gi bang ToUnicode cua tep ghi, co bo sinh hoa don xuat NFD. */
  const D = nap(join(thuMuc, "doc-hoa-don.cjs"));
  const nfd = D.doHoaDonTuVanBan(HOA_DON_THU.normalize("NFD"));
  const nfc = D.doHoaDonTuVanBan(HOA_DON_THU.normalize("NFC"));
  return {
    duoc:
      nfd.soHoaDon === "00001879" && nfd.ngayHoaDon === "2025-12-10" && nfd.soTien === 7_500_000 &&
      nfc.soHoaDon === nfd.soHoaDon,
    thucTe: `NFD: so=${nfd.soHoaDon} ngay=${nfd.ngayHoaDon} tien=${nfd.soTien}`,
    mongDoi: "NFD cho ket qua y het NFC",
  };
});

// ════════════════════════════════════════════════════════════════════
// CÁCH ĐỌC THEO DÒNG — Sếp 25/09/2026: *"sẽ có rất nhiều các mẫu khác nữa, cần phải tối ưu
// cách đọc"*. Dòng dưới đây là dòng `dungDongTuManhChu` dựng ra từ 5 hoá đơn THẬT của 5 phần
// mềm (đo 25/09/2026), chỉ thay tên NCC / địa chỉ / MST / số tài khoản bằng giả định.
// Cách cũ (`doHoaDonTuVanBan`) đọc đủ 3 ô trên 1/5 tờ; cách theo dòng đọc đủ cả 5.
// ════════════════════════════════════════════════════════════════════

const CHU_SEP_DOC_THEO_DONG =
  'Sếp · 25/09/2026 — *"sẽ có rất nhiều các mẫu khác nữa, cần phải tối ưu cách đọc"*';

const MAU_THEO_DONG = [
  {
    ten: "Bkav",
    mongDoi: ["00001879", "2025-12-10", 7_500_000],
    dong: [
      "Mẫu số - Ký hiệu (Serial No.) : 1C25THA", "HÓA ĐƠN GIÁ TRỊ GIA TĂNG", "Số (Invoice No.) : 00001879",
      "(VAT INVOICE)", "Ngày (day) 10 tháng (month) 12 năm (year) 2025",
      "Đơn vị bán (Seller) : CÔNG TY TNHH VLXD A", "Mã số thuế (Tax Code) : 0 0 0 0 0 0 0 0 0 1",
      "Số tài khoản (Account No.) : 000000000000001 tại Ngân hàng A",
      "STT Tên hàng hóa, dịch vụ Số lượng Đơn giá Thành tiền", "1 Nước uống đóng chai Thùng 100 69.444,444 6.944.444",
      "Cộng tiền hàng (Sub total) : 6.944.444", "Thuế suất GTGT (Tax rate) : 8% Tiền thuế GTGT (VAT amount) : 555.556",
      "Tổng cộng tiền thanh toán (Total payment) : 7.500.000", "Ngày: 10/12/2025",
    ],
  },
  {
    ten: "HT invoice (ve chu nguoc thu tu)",
    mongDoi: ["00000017", "2026-09-16", 5_600_000],
    dong: [
      "HOÁ ĐƠN GIÁ TRỊ GIA TĂNG Ký hiệu (Serial): 1 C26THK", "VAT INVOICE Số (No): 00000017",
      "Ngày (Date) 16 tháng (month) 09 năm (year) 2026", "Đơn vị bán hàng (Company): CÔNG TY TNHH VLXD B",
      "Số tài khoản (Account): 0000000002 Ngân hàng (Bank): Ngân hàng B",
      "STT Tên hàng hóa, dịch vụ Đơn vị tính Số lượng Đơn giá Thành tiền", "1 Hàng mẫu B Hộp 2 2.800.000 5.600.000",
      "Cộng tiền hàng (Sub Total): 5.600.000", "Thuế suất GTGT (VAT rate): KKKNT Tiền thuế GTGT (VAT Amount): 0",
      "Tổng cộng tiền thanh toán (Total payment): 5.600.000", "Ngày ký(Sign date): 16/09/2026",
    ],
  },
  {
    ten: "MISA meInvoice",
    mongDoi: ["00007980", "2026-09-16", 9_672_000],
    dong: [
      "CÔNG TY TNHH VLXD C", "Mã số thuế (Tax code) : 0 0 0 0 0 0 0 0 0 3",
      "Số tài khoản (Bank account) : 00000003 - Ngân hàng C", "HÓA ĐƠN GIÁ TRỊ GIA TĂNG Ký hiệu (Serial) : 1C26THY",
      "(VAT INVOICE) Số (No.) : 00007980", "Ngày (Date) 16 tháng (month) 09 năm (year) 2026",
      "Hình thức thanh toán (Payment method) : CK Số tài khoản (Bank account) :",
      "STT Tên hàng hóa, dịch vụ Đơn vị tính Số lượng Đơn giá Thành tiền", "1 Hộp 13 740.740,741 9.629.630",
      "Tỷ lệ CK (Discount rate) : 7,00% Số tiền chiết khấu (Discount amount) : 674.074",
      "Cộng tiền hàng (Đã trừ CK) (Total amount excl. VAT) (Discounted) : 8.955.556",
      "Thuế suất GTGT (VAT rate) : 8% Tiền thuế GTGT (VAT amount) : 716.444",
      "Tổng tiền thanh toán (Total amount) : 9.672.000", "Ký ngày (Signing Date) : 16/09/2026",
    ],
  },
  {
    ten: "EFY (so hoa don ngan)",
    mongDoi: ["153", "2026-08-11", 2_937_600],
    dong: [
      "Ký hiệu (Serial No): 1C26THN", "HÓA ĐƠN GIÁ TRỊ GIA TĂNG", "Số (No): 153", "(VAT INVOICE)", "Mã CQT:",
      "Ngày (Date) 11 tháng (month) 08 năm (year) 2026", "CÔNG TY TNHH VLXD D",
      "Số tài khoản (A/C): 000000000000004 Ngân Hàng D", "Hình thức thanh toán (Pay.method): TM/CK Số tài khoản (A/C):",
      "STT Tên hàng hóa, dịch vụ Số lượng Đơn giá Thành tiền",
      "1 Con kê bê tông 25/30mm viên 4.000 430 1.720.000", "Cộng tiền hàng (Total before VAT): 2.720.000",
      "Thuế suất GTGT (VAT rate): 8 % Tiền thuế GTGT (VAT amount): 217.600",
      "Tổng tiền thanh toán (Total amount): 2.937.600", "Ký ngày: 11/08/2026 14:36:09",
    ],
  },
  {
    ten: "VNPT (khong co tieng Anh, So chung dong ma CQT)",
    mongDoi: ["00000085", "2026-09-24", 4_840_000],
    dong: [
      "HÓA ĐƠN GIÁ TRỊ GIA TĂNG", "Ký hiệu: 1C26THT", "Ngày 24 tháng 09 năm 2026",
      "Mã của cơ quan thuế: 0081900EC27408492BA1C6E91B1E7EABE9 Số: 00000085",
      "Tên đơn vị bán hàng: CÔNG TY TNHH VLXD E", "Mã số thuế: 0000000005", "Số tài khoản:",
      "Mã số thuế : 3703172689 Mã ĐVQHNS :", "Số căn cước công dân : Số hộ chiếu :",
      "STT Tên hàng hóa, dịch vụ Đơn vị tính Số lượng Đơn giá Thành tiền", "1 Cát xây dựng M3 10 440.000 4.400.000",
      "Cộng tiền hàng: 4.400.000", "Thuế suất GTGT: 10% Tiền thuế GTGT: 440.000",
      "Tổng cộng tiền thanh toán: 4.840.000", "Ký ngày: 24/09/2026 10:43:42",
    ],
  },
];

for (const mau of MAU_THEO_DONG) {
  kiem(`Doc theo dong du 3 o + tu kiem khop — mau ${mau.ten}`, CHU_SEP_DOC_THEO_DONG, () => {
    const D = nap(join(thuMuc, "doc-hoa-don.cjs"));
    const r = D.doHoaDonTheoDong(mau.dong);
    const [so, ngay, tien] = mau.mongDoi;
    return {
      duoc: r.soHoaDon === so && r.ngayHoaDon === ngay && r.soTien === tien && r.doiChieu?.khop === true,
      thucTe: `so=${r.soHoaDon} · ngay=${r.ngayHoaDon} · tien=${r.soTien} · khop=${r.doiChieu?.khop}`,
      mongDoi: `${so} · ${ngay} · ${tien} · khop=true`,
    };
  });
}

kiem("Dung dong theo TOA DO — phan mem ve chu nguoc thu tu (HT invoice)", CHU_SEP_DOC_THEO_DONG, () => {
  /* 🔴 Đúng thứ tự pdf.js trả về trên tờ HT thật: số TRƯỚC, nhãn SAU — nhưng toạ độ x thì bình
     thường (nhãn x=306, số x=531) và y lệch 1 (408/409). Dựng theo toạ độ phải ra nhãn trước. */
  const D = nap(join(thuMuc, "doc-hoa-don.cjs"));
  const dong = D.dungDongTuManhChu([
    { trang: 1, chu: "5.600.000", x: 531, y: 408, rong: 40 },
    { trang: 1, chu: "(Total payment):", x: 416, y: 409, rong: 70 },
    { trang: 1, chu: "Tổng cộng tiền thanh toán", x: 306, y: 408, rong: 105 },
    { trang: 1, chu: "Số tiền viết bằng chữ", x: 23, y: 387, rong: 90 },
    { trang: 1, chu: "MÃ TRA CỨU IN DỌC", x: 5, y: 400, rong: 10, xoay: true },
  ]);
  const r = D.doHoaDonTheoDong(dong);
  return {
    duoc: dong[0] === "Tổng cộng tiền thanh toán (Total payment): 5.600.000" && dong.length === 2 && r.soTien === 5_600_000,
    thucTe: JSON.stringify(dong),
    mongDoi: '["Tổng cộng tiền thanh toán (Total payment): 5.600.000","Số tiền viết bằng chữ"] — chữ xoay bị bỏ',
  };
});

kiem("CHIEU NGHICH — 'Hop dong so' KHONG duoc cuop o So hoa don", CHU_SEP_DOC_THEO_DONG, () => {
  /* Phản biện 25/09 dựng ca này: cách dò từ khoá sau khi bỏ ngoặc lấy nhầm "45/2026". */
  const D = nap(join(thuMuc, "doc-hoa-don.cjs"));
  const a = D.doHoaDonTheoDong(["Hợp đồng số (Contract No.): 45/2026", "Số (No.): 00000017"]);
  const b = D.doHoaDonTheoDong(["Hợp đồng số (Contract No.): 45/2026"]);
  const c = D.doHoaDonTheoDong(["Số tài khoản (Account No.) : 95255769", "Mã số (Tax code): 0301234567"]);
  return {
    duoc: a.soHoaDon === "00000017" && b.soHoaDon === undefined && c.soHoaDon === undefined,
    thucTe: `a=${a.soHoaDon} · b=${b.soHoaDon} · c=${c.soHoaDon}`,
    mongDoi: "a=00000017 · b=undefined · c=undefined",
  };
});

kiem("CHIEU NGHICH — ngay hop dong trong phan dau KHONG lan ngay lap", CHU_SEP_DOC_THEO_DONG, () => {
  const D = nap(join(thuMuc, "doc-hoa-don.cjs"));
  const r = D.doHoaDonTheoDong([
    "Ngày lập (Date): 16/09/2026",
    "Theo HĐ số 12 ngày 05 tháng 08 năm 2026",
    "STT Tên hàng",
  ]);
  return { duoc: r.ngayHoaDon === "2026-09-16", thucTe: String(r.ngayHoaDon), mongDoi: "2026-09-16" };
});

kiem("CHIEU NGHICH — chi co ngay ky so thi dien nhung PHAI nhac xem lai", CHU_SEP_DOC_THEO_DONG, () => {
  const D = nap(join(thuMuc, "doc-hoa-don.cjs"));
  const r = D.doHoaDonTheoDong(["Số: 00000001", "Ký ngày: 24/09/2026 10:43:42"]);
  return {
    duoc: r.ngayHoaDon === "2026-09-24" && r.nhac.some((x) => x.includes("ngày ký")),
    thucTe: `ngay=${r.ngayHoaDon} · nhac=${JSON.stringify(r.nhac)}`,
    mongDoi: "2026-09-24 + câu nhắc ngày ký",
  };
});

kiem("CHIEU NGHICH — so am (dau tru HOAC ngoac ke toan) KHONG dien, co canh bao", CHU_SEP_DOC_THEO_DONG, () => {
  /* Cách cũ bỏ qua ca `(1.500.000)` IM LẶNG — không điền mà cũng không nói vì sao. */
  const D = nap(join(thuMuc, "doc-hoa-don.cjs"));
  const a = D.doHoaDonTheoDong(["Tổng cộng tiền thanh toán (Total payment): (1.500.000)"]);
  const b = D.doHoaDonTheoDong(["Tổng tiền thanh toán : -1.500.000"]);
  const c = D.doHoaDon(["Tổng tiền thanh toán : -1.500.000"], "Tổng tiền thanh toán : -1.500.000");
  return {
    duoc: a.soTien === undefined && !!a.canhBao && b.soTien === undefined && !!b.canhBao && c?.soTien === undefined,
    thucTe: `a: tien=${a.soTien} canhBao=${!!a.canhBao} · b: tien=${b.soTien} canhBao=${!!b.canhBao} · gop: tien=${c?.soTien}`,
    mongDoi: "không điền, có cảnh báo, kể cả qua hàm gộp",
  };
});

kiem("Tu kiem LECH thi van dien nhung nhac xem lai — KHONG dung canhBao", CHU_SEP_DOC_THEO_DONG, () => {
  /* 🔴 `canhBao` = "đọc ra nhưng KHÔNG điền", giao diện dừng ngay khi gặp. Lệch tổng chỉ là nhắc. */
  const D = nap(join(thuMuc, "doc-hoa-don.cjs"));
  const r = D.doHoaDonTheoDong([
    "Cộng tiền hàng : 1.000.000",
    "Tiền thuế GTGT : 80.000",
    "Tổng tiền thanh toán : 1.800.000",
  ]);
  return {
    duoc: r.soTien === 1_800_000 && r.doiChieu?.khop === false && r.nhac.length === 1 && !r.canhBao,
    thucTe: `tien=${r.soTien} · khop=${r.doiChieu?.khop} · nhac=${r.nhac.length} · canhBao=${r.canhBao}`,
    mongDoi: "tien=1800000 · khop=false · nhac=1 · canhBao=undefined",
  };
});

kiem("Ham gop: o nao cach theo dong truot thi lay tu cach cu", CHU_SEP_DOC_THEO_DONG, () => {
  /* Không có dòng nào (PDF không toạ độ dùng được) → vẫn đọc được mẫu Bkav bằng cách cũ. */
  const D = nap(join(thuMuc, "doc-hoa-don.cjs"));
  const r = D.doHoaDon([], HOA_DON_THU);
  return {
    duoc: r.soHoaDon === "00001879" && r.ngayHoaDon === "2025-12-10" && r.soTien === 7_500_000,
    thucTe: `so=${r.soHoaDon} · ngay=${r.ngayHoaDon} · tien=${r.soTien}`,
    mongDoi: "00001879 · 2025-12-10 · 7500000",
  };
});

kiem(
  "Gom cong trinh: bo dau/khoang trang/hoa thuong ve MOT nhom, 'chua ghi' xep CUOI, PO uu tien ten chep tren don",
  'Sếp · 25/09/2026 — *"tạo thêm nút group theo tên công trình"* (màn Công nợ)',
  () => {
    const G = nap(tepRaGCT);
    const ds = [
      { id: "a", ten: "Nhà xưởng  Howell" },
      { id: "b", ten: "" },
      { id: "c", ten: "nha xuong howell" },
      { id: "d", ten: "Công trình AID" },
    ];
    const nhom = G.gomTheoCongTrinh(ds, (x) => x.ten);
    const po = G.tenCongTrinhCuaPO({ tenCongTrinh: "", prId: "pr1" }, [{ id: "pr1", tenCongTrinh: "Kho Bình Dương" }]);
    const poChep = G.tenCongTrinhCuaPO({ tenCongTrinh: "Tên trên đơn", prId: "pr1" }, [{ id: "pr1", tenCongTrinh: "Đã đổi" }]);
    const thucTe = `${nhom.map((n) => `${n.ten}[${n.muc.map((m) => m.id).join("")}]`).join(" | ")} · po=${po} · chep=${poChep}`;
    return {
      duoc:
        nhom.length === 3 &&
        nhom[0].ten === "Công trình AID" &&
        nhom[1].muc.map((m) => m.id).join("") === "ac" &&
        nhom[2].khoa === G.NHOM_CHUA_GHI_CONG_TRINH &&
        po === "Kho Bình Dương" &&
        poChep === "Tên trên đơn",
      thucTe,
      mongDoi: "Công trình AID[d] | Nhà xưởng  Howell[ac] | Chưa ghi công trình[b] · po=Kho Bình Dương · chep=Tên trên đơn",
    };
  },
);

kiem(
  "KPI Cong no tinh tu dong bang theo don: qua han / sap han / da tra du — KHONG con doc congNo rong",
  'Sếp · 25/09/2026 — *"Kiểm tra lại 2 chức năng này có bị trùng ko"* (4 thẻ KPI luôn 0)',
  () => {
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const k = TN.tongHopCongNo([
      { conLai: 1_000_000, daTatToan: false, soNgayConLai: -3 },
      { conLai: 2_000_000, daTatToan: false, soNgayConLai: 5 },
      { conLai: 4_000_000, daTatToan: false, soNgayConLai: 30 },
      { conLai: 8_000_000, daTatToan: false, soNgayConLai: undefined },
      { conLai: 0, daTatToan: true, soNgayConLai: undefined },
    ]);
    return {
      duoc:
        k.tongConLai === 15_000_000 && k.soChuaTatToan === 4 && k.soDon === 5 &&
        k.quaHan.so === 1 && k.quaHan.tien === 1_000_000 &&
        k.sapDenHan.so === 1 && k.sapDenHan.tien === 2_000_000 && k.soDaTatToan === 1,
      thucTe: JSON.stringify(k),
      mongDoi: "tong 15tr · 4/5 chua tat toan · qua han 1 (1tr) · sap han 1 (2tr) · da tra du 1",
    };
  },
);

kiem(
  "Xuat cong no Excel: loc theo NGAY HOA DON tung to; don chua co hoa don thi theo NGAY LAP PO",
  'Sếp · 25/09/2026 — *"tải xuống danh sách công nợ (định dạng excel) có thể chọn theo khung thời gian"*',
  () => {
    const X = nap(tepRaXCN);
    const ds = [
      { poId: "a", hoaDon: [{ soHoaDon: "T9", ngayHoaDon: "2026-09-10" }, { soHoaDon: "T8", ngayHoaDon: "2026-08-01" }] },
      { poId: "b", hoaDon: [] },
      { poId: "c", hoaDon: [] },
      { poId: "d", hoaDon: [{ soHoaDon: "T10", ngayHoaDon: "2026-10-01" }] },
    ];
    const ngayPO = new Map([["b", "2026-09-30"], ["c", "2026-07-01"]]);
    const kq = X.locCongNoTheoKhung(ds, { tuNgay: "2026-09-01", denNgay: "2026-09-30" }, ngayPO);
    const thucTe = kq.map((x) => `${x.dong.poId}[${x.cacTo.map((t) => t.soHoaDon).join(",")}]`).join(" ");
    const tatCa = X.locCongNoTheoKhung(ds, { tuNgay: "", denNgay: "" }, ngayPO).length;
    return {
      duoc: thucTe === "a[T9] b[]" && tatCa === 4,
      thucTe: `${thucTe} · khong gioi han=${tatCa}`,
      mongDoi: "a[T9] b[] · khong gioi han=4 (ca ngay cuoi 30/09 duoc TINH)",
    };
  },
);

const CHU_SEP_TACH_GIAO =
  'Sếp · 26/09/2026 — *"giao việc cho nhân viên sẽ tự động tách ra các phiếu riêng biệt… vẫn phải có liên kết cha con"* + chốt: 1 người thì không tách, người sau cùng giữ phiếu gốc';
const phieuThuTach = () => ({
  id: "pr-goc",
  code: "HD-001",
  tieuDe: "HD-001 | CT A",
  trangThai: "da_duyet",
  items: [1, 2, 3].map((stt) => ({ stt, tenVatLieu: `VT${stt}`, khoiLuong: 10 })),
  lichSu: [],
});
const gThu = (uid) => ({ uid, ten: `NV ${uid}`, nguoiGiaoTen: "TBP", thoiDiem: "2026-09-26T01:00:00Z", ngay: "2026-09-26" });

kiem("Tach khi giao: giao CA phieu cho 1 nguoi thi KHONG tach", CHU_SEP_TACH_GIAO, () => {
  const T = nap(tepRaTKG);
  const r = T.apDungGiaoViec([phieuThuTach()], "pr-goc", [1, 2, 3], gThu("A"));
  return {
    duoc: r.tach === false && r.deNghi.length === 1 && r.deNghi[0].items.every((d) => d.nguoiPhuTrachUid === "A"),
    thucTe: `tach=${r.tach} · so phieu=${r.deNghi?.length}`,
    mongDoi: "tach=false · 1 phieu, ca 3 dong cua A",
  };
});

kiem(
  "Tach khi giao: giao 1 phan -> phieu con co MA CO DINH, lien ket cha-con, dong goc mo va khong con nguoi phu trach; nguoi SAU CUNG giu phieu goc",
  CHU_SEP_TACH_GIAO,
  () => {
    const T = nap(tepRaTKG);
    const b1 = T.apDungGiaoViec([phieuThuTach()], "pr-goc", [1], gThu("A"));
    const con = b1.deNghi.find((d) => d.id !== "pr-goc");
    const goc1 = b1.deNghi.find((d) => d.id === "pr-goc");
    const b2 = T.apDungGiaoViec(b1.deNghi, "pr-goc", [2, 3], gThu("B"));
    const goc2 = b2.deNghi.find((d) => d.id === "pr-goc");
    return {
      duoc:
        b1.tach === true &&
        con.id === "pr-goc__A" && con.deNghiChaId === "pr-goc" && con.deNghiGocId === "pr-goc" &&
        con.items.length === 1 && con.items[0].sttDongCha === 1 && con.items[0].nguoiPhuTrachUid === "A" &&
        goc1.items.length === 3 && goc1.items[0].nguoiPhuTrachUid === undefined &&
        b2.tach === false && b2.deNghi.length === 2 &&
        goc2.items[1].nguoiPhuTrachUid === "B" && goc2.items[2].nguoiPhuTrachUid === "B",
      thucTe: `b1.tach=${b1.tach} con=${con?.id} cha=${con?.deNghiChaId} dongCon=${con?.items.length} · b2.tach=${b2.tach} soPhieu=${b2.deNghi.length}`,
      mongDoi: "b1 tach ra pr-goc__A (dong 1, cha pr-goc) · b2 KHONG tach, goc thuoc B, van 2 phieu",
    };
  },
);

kiem(
  "🔴 CHIEU NGHICH — chay lai / giao them cho cung nguoi KHONG sinh ban moi (loi tach lap 24-25/09)",
  CHU_SEP_TACH_GIAO,
  () => {
    const T = nap(tepRaTKG);
    const b1 = T.apDungGiaoViec([phieuThuTach()], "pr-goc", [1], gThu("A"));
    const lai = T.apDungGiaoViec(b1.deNghi, "pr-goc", [1], gThu("A"));
    const them = T.apDungGiaoViec(b1.deNghi, "pr-goc", [2], gThu("A"));
    const conThem = them.deNghi.filter((d) => d.id === "pr-goc__A");
    return {
      duoc: typeof lai.loi === "string" && them.deNghi.length === 2 && conThem.length === 1 && conThem[0].items.length === 2,
      thucTe: `giao lai dong da tach: ${lai.loi ? "bi chan" : "KHONG chan"} · giao them: ${them.deNghi.length} phieu, con co ${conThem[0]?.items.length} dong`,
      mongDoi: "giao lai bi chan · giao them van 2 phieu, phieu con A co 2 dong",
    };
  },
);

kiem(
  "Tach khi giao: nguoi SAU CUNG da co phieu con thi GOP ve phieu goc — moi nguoi chi MOT phieu",
  CHU_SEP_TACH_GIAO,
  () => {
    const T = nap(tepRaTKG);
    const b1 = T.apDungGiaoViec([phieuThuTach()], "pr-goc", [1], gThu("A"));
    const b2 = T.apDungGiaoViec(b1.deNghi, "pr-goc", [2], gThu("B"));
    const b3 = T.apDungGiaoViec(b2.deNghi, "pr-goc", [3], gThu("B"));
    const goc = b3.deNghi.find((d) => d.id === "pr-goc");
    const conB = b3.deNghi.find((d) => d.id === "pr-goc__B");
    const khongGop = T.apDungGiaoViec(b2.deNghi, "pr-goc", [3], { ...gThu("B"), gopConCu: false });
    return {
      duoc:
        b2.tach === true && b3.tach === false && !conB && b3.deNghi.length === 2 &&
        goc.items[1].nguoiPhuTrachUid === "B" && goc.items[2].nguoiPhuTrachUid === "B" &&
        khongGop.deNghi.some((d) => d.id === "pr-goc__B"),
      thucTe: `b2.tach=${b2.tach} b3.tach=${b3.tach} conB con=${Boolean(conB)} soPhieu=${b3.deNghi.length} · gopConCu=false giu con=${khongGop.deNghi.some((d) => d.id === "pr-goc__B")}`,
      mongDoi: "b2 tach, b3 gop: con B bi bo, goc dong 2-3 cua B, 2 phieu · gopConCu=false thi giu",
    };
  },
);

kiem(
  "Chia khoi luong: 10 tan giao 5 -> dong cu 5, dong MOI 5 'chia tu dong 3', tong KHONG doi; khong danh so lai",
  'Sếp · 26/09/2026 — *"đề nghị có 10 tấn thép… 1 người lấy từ kho 5 tấn, còn 5 tấn giao cho người khác đặt mua… phải liên kết cha con"*',
  () => {
    const T = nap(tepRaTKG);
    const p = phieuThuTach();
    p.items[2] = { stt: 3, tenVatLieu: "Thep", khoiLuongDeNghi: 10, donViTinh: "tấn" };
    const r = T.apDungChiaKhoiLuong([p], "pr-goc", 3, 5, "TBP", "2026-09-26T03:00:00Z");
    const it = r.deNghi[0].items;
    const d3 = it.find((d) => d.stt === 3), d4 = it.find((d) => d.stt === 4);
    const du = T.apDungChiaKhoiLuong([p], "pr-goc", 3, 10, "TBP", "x");
    const qua = T.apDungChiaKhoiLuong([p], "pr-goc", 3, 12, "TBP", "x");
    return {
      duoc:
        r.sttMoi === 4 && d3.khoiLuongDeNghi === 5 && d4.khoiLuongDeNghi === 5 && d4.sttChiaTu === 3 &&
        d3.sttChiaTu === 3 && it.filter((d) => d.stt === 1 || d.stt === 2).length === 2 &&
        du.sttMoi === null && typeof qua.loi === "string",
      thucTe: `sttMoi=${r.sttMoi} d3=${d3?.khoiLuongDeNghi} d4=${d4?.khoiLuongDeNghi}(chiaTu ${d4?.sttChiaTu}) · ca dong=${du.sttMoi} · vuot=${qua.loi ? "chan" : "KHONG chan"}`,
      mongDoi: "sttMoi=4 d3=5 d4=5(chiaTu 3) · ca dong=null · vuot=chan",
    };
  },
);

kiem(
  "Giao cho THU KHO / NHAN SU -> phieu bo qua bao gia, sang thang Lap don mua hang; con dong mua thuong thi van o buoc bao gia",
  'Sếp · 26/09/2026 — *"khi giao việc cho nhân viên [thủ kho] này thì việc sẽ nhảy trực tiếp qua bước Lập đơn mua hàng"* + *"Nhân viên nhân sự… cũng sẽ nhảy trực tiếp qua bước lập đơn mua hàng luôn"*',
  () => {
    const T = nap(tepRaTKG);
    const kho = T.apDungGiaoViec([phieuThuTach()], "pr-goc", [1, 2, 3], { ...gThu("K"), loaiViecGiao: "xuat_kho" });
    const ns = T.apDungGiaoViec([phieuThuTach()], "pr-goc", [1, 2, 3], { ...gThu("H"), loaiViecGiao: "nhan_su" });
    const tron = T.apDungGiaoViec([phieuThuTach()], "pr-goc", [1], { ...gThu("K"), loaiViecGiao: "xuat_kho" });
    const tron2 = T.apDungGiaoViec(tron.deNghi, "pr-goc", [2, 3], gThu("A"));
    const buoc = (ds, id) => G.xacDinhGiaiDoan(ds.find((d) => d.id === id), [], [], [], ds);
    const kq = {
      kho: buoc(kho.deNghi, "pr-goc"),
      nhanSu: buoc(ns.deNghi, "pr-goc"),
      conKho: buoc(tron2.deNghi, "pr-goc__K"),
      gocMua: buoc(tron2.deNghi, "pr-goc"),
    };
    return {
      duoc: kq.kho === "lap_don_mua_hang" && kq.nhanSu === "lap_don_mua_hang" && kq.conKho === "lap_don_mua_hang" && kq.gocMua === "yeu_cau_bao_gia",
      thucTe: JSON.stringify(kq),
      mongDoi: "kho/nhanSu/conKho = lap_don_mua_hang · gocMua = yeu_cau_bao_gia",
    };
  },
);

kiem("Tach khi giao: ma phieu con KHONG chua ky tu Firestore cam (~ * / [ ] .)", CHU_SEP_TACH_GIAO, () => {
  const T = nap(tepRaTKG);
  const id = T.idPhieuConTheoNguoi("pr-goc", "a.b~c/d[e]");
  return { duoc: !/[~*/[\].]/.test(id), thucTe: id, mongDoi: "khong co ~ * / [ ] ." };
});

kiem("Rut dong khoi phieu con: tra ve goc, phieu con HET dong thi bo", CHU_SEP_TACH_GIAO, () => {
  const T = nap(tepRaTKG);
  const b1 = T.apDungGiaoViec([phieuThuTach()], "pr-goc", [1], gThu("A"));
  const r = T.apDungRutDong(b1.deNghi, "pr-goc__A", [1], "TBP", "2026-09-26T02:00:00Z", "Bỏ phân bổ");
  return {
    duoc: r.chaId === "pr-goc" && r.sttCha.join() === "1" && r.deNghi.length === 1,
    thucTe: `cha=${r.chaId} sttCha=${r.sttCha} soPhieu=${r.deNghi?.length}`,
    mongDoi: "cha=pr-goc sttCha=1 soPhieu=1",
  };
});

kiem("Dong da co bao gia / don hang (chua huy) thi KHONG duoc chuyen / bo phan bo", CHU_SEP_TACH_GIAO, () => {
  const T = nap(tepRaTKG);
  const bg = [{ prId: "p", trangThai: "dang_thu_thap", items: [{ sttDongDeNghi: 2 }] }];
  const po = [{ prId: "p", trangThai: "huy", items: [{ sttDongDeNghi: 3 }] }];
  const kq = [1, 2, 3].map((st) => T.dongDaCoChungTu("p", st, bg, po));
  return { duoc: kq.join() === "false,true,false", thucTe: kq.join(), mongDoi: "false,true,false (PO da huy khong tinh)" };
});

kiem(
  "Loc bang quy trinh: go TOAN SO = dung ma de xuat (154 == 000000154, KHONG dinh 1541); go chu = tim chua bo dau",
  'Sếp · 26/09/2026 — *"khi a nhập mã số đề nghị vào thanh tìm kiếm, thì trên quy trình mua hàng chỉ hiện đúng cái đề nghị đó thôi"*',
  () => {
    const TK = nap(tepRaTK);
    const dn = (ma, cong) => ({ code: `HD-${ma}`, tieuDe: `HD | ${cong}`, tenCongTrinh: cong, maDeXuatAppRequest: ma });
    const a = dn("000000154", "Nhà máy Howell"), b = dn("000001541", "Chen Yi"), c = dn("000000015", "Unice");
    const kq = {
      so154: [a, b, c].filter((d) => TK.khopTimBangQuyTrinh(d, "154")).map((d) => d.maDeXuatAppRequest),
      soDu: TK.khopTimBangQuyTrinh(a, "000000154"),
      chu: [a, b, c].filter((d) => TK.khopTimBangQuyTrinh(d, "howell")).length,
      rong: [a, b, c].every((d) => TK.khopTimBangQuyTrinh(d, "  ")),
    };
    return {
      duoc: kq.so154.join() === "000000154" && kq.soDu && kq.chu === 1 && kq.rong,
      thucTe: JSON.stringify(kq),
      mongDoi: 'so154=["000000154"] · soDu=true · chu=1 · rong=true',
    };
  },
);

kiem("Doi tien: CHI CON MOT BAN duy nhat, XML dung chung", CHU_SEP_DOC_HOA_DON, () => {
  /* 🔴 `doc-hoa-don-xml.ts` tung co ban `chuanHoaTien` rieng, va hai ban DA LECH NHAU ngay trong
     tuan dau: "69.444,444" -> ban XML cho 69, ban van ban cho 69444 (lech 1000 lan).
     Dung §3.4b: "hai cho cung tinh mot con so roi lech nhau". */
  const nguon = readFileSync("2-quy-trinh/doc-hoa-don-xml.ts", "utf8");
  const conHamRieng = /function\s+chuanHoaTien/.test(nguon);
  const dungChung = nguon.includes("doiTienHoaDon(tienRaw)");
  return {
    duoc: !conHamRieng && dungChung,
    thucTe: `ham rieng: ${conHamRieng ? "CON" : "da bo"} · dung chung: ${dungChung ? "co" : "KHONG"}`,
    mongDoi: "khong con ham rieng, goi doiTienHoaDon",
  };
});

kiem("Worker pdf.js trong public/ dung phien ban voi thu vien da cai", CHU_SEP_DOC_HOA_DON, () => {
  /* 🔴🔴 KHONG BAT DUOC BANG MAT, VA HONG THI HONG LUC CHAY THAT.
     `6-tien-ich/trich-text-pdf.ts` nap thu vien tu `node_modules` nhung worker thi lay tep tinh
     o `public/pdfjs/`. pdf.js 4.x NEM LOI *"The API version does not match the Worker version"*
     khi hai ben lech nhau — `npm run verify` van PASS, chi la nguoi dung bam nut doc hoa don thi
     khong co gi xay ra.
     Nen sau moi lan `npm update pdfjs-dist` phai chep lai tep:
       cp node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs public/pdfjs/pdf.worker.min.mjs */
  const bam = (p) => createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 16);
  const a = bam("public/pdfjs/pdf.worker.min.mjs");
  const b = bam("node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs");
  /* Doc them chuoi duong dan trong ma nguon — doi cho de tep ma quen doi hang la 404 im lang. */
  const nguon = readFileSync("6-tien-ich/trich-text-pdf.ts", "utf8");
  const trungDuongDan = nguon.includes('"/pdfjs/pdf.worker.min.mjs"');
  return {
    duoc: a === b && trungDuongDan,
    thucTe: `public=${a} · node_modules=${b} · duong dan trong ma nguon: ${trungDuongDan ? "khop" : "KHONG khop"}`,
    mongDoi: "hai bam giong nhau va ma nguon tro dung /pdfjs/pdf.worker.min.mjs",
  };
});

kiem(
  "Tien da tra cua TUNG TO: chi cong dot chi DA GAN dung to",
  'Sếp · 20/09/2026 — *"Trường nhập số tiền đã thanh toán đâu / Để như vậy thì sao hoàn thành được"*',
  () => {
    /* 🔴 KHONG CHIA DEU, KHONG SUY "TRA TO CU TRUOC". Dot chi chua gan to nao thi KHONG duoc gan
       bua cho to nao ca — app se in con so doan ra nhu su that, dung thu §3.5 cam. */
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const gia = {
      soNgayDuocNo: 30,
      hoaDonVAT: [
        { id: "hd1", soHoaDon: "A", ngayHoaDon: "2026-09-01", soTien: 10_000_000, nguoiGhiTen: "X" },
        { id: "hd2", soHoaDon: "B", ngayHoaDon: "2026-09-05", soTien: 5_000_000, nguoiGhiTen: "X" },
      ],
    };
    const dotChi = [
      { id: "d1", poId: "po", ngayChi: "2026-09-10", soTien: 10_000_000, hoaDonId: "hd1" },
      { id: "d2", poId: "po", ngayChi: "2026-09-11", soTien: 2_000_000, hoaDonId: "hd2" },
      /* Dot CHUA gan to nao — khong duoc cong vao to nao. */
      { id: "d3", poId: "po", ngayChi: "2026-09-12", soTien: 3_000_000 },
    ];
    const ra = TN.hanNoTungToHoaDon(gia, "2026-09-01", new Date(2026, 8, 25), dotChi);
    const chuaGan = TN.tienChuaGanHoaDon(dotChi);
    return {
      duoc:
        ra[0].daTra === 10_000_000 &&
        ra[0].conLai === 0 &&
        ra[0].daTatToan === true &&
        ra[1].daTra === 2_000_000 &&
        ra[1].conLai === 3_000_000 &&
        ra[1].daTatToan === false &&
        chuaGan === 3_000_000,
      thucTe: `A: tra=${ra[0].daTra} con=${ra[0].conLai} tatToan=${ra[0].daTatToan} · B: tra=${ra[1].daTra} con=${ra[1].conLai} · chua gan=${chuaGan}`,
      mongDoi: "A tra du 10tr (tat toan) · B moi tra 2tr con 3tr · 3tr chua gan cho to nao",
    };
  },
);

kiem(
  "CHIEU NGHICH — them lop hoa don KHONG duoc lam lech TONG cua don",
  'Sếp · 20/09/2026 + nguyên tắc: tiền lệch một đồng là sai sổ',
  () => {
    /* 🔴🔴 BAI KIEM QUAN TRONG NHAT CUA DOT NAY. `daTraCuaPO` cong theo `poId` va KHONG doc
       `hoaDonId` — nen them truong moi KHONG duoc lam doi mot dong nao cua so cu. Neu ai do sau
       nay sua `daTraCuaPO` cho "chi cong dot da gan" thi tong da tra cua don tut xuong am tham,
       va cot "Con phai tra" cua ca bang cong no sai. */
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const dotChi = [
      { id: "d1", poId: "po", ngayChi: "2026-09-10", soTien: 10_000_000, hoaDonId: "hd1" },
      { id: "d2", poId: "po", ngayChi: "2026-09-11", soTien: 2_000_000 },
      /* 🔴🔴 CA MO COI — them 20/09/2026 sau khi mot agent phan bien do ra bai nay XANH GIA.
         Ban dau bo thu chi co du lieu SACH (moi `hoaDonId` deu tro toi to co that), nen bat bien
         "tong cac to + chua gan = tong cua don" luon dung ma khong chung minh duoc gi.
         Dot chi nay tro toi mot to DA BI XOA: neu `tienChuaGanHoaDon` chi hoi "co hoaDonId khong"
         thi no bi bo qua ca hai phep cong => 5tr bien mat khoi CA HAI cho, bai kiem phai DO. */
      { id: "d4", poId: "po", ngayChi: "2026-09-13", soTien: 5_000_000, hoaDonId: "hd-da-bi-xoa" },
      { id: "d3", poId: "khac", ngayChi: "2026-09-11", soTien: 99_000_000, hoaDonId: "hd9" },
    ];
    const tongCuaDon = TN.daTraCuaPO("po", dotChi); // 10 + 2 + 5 = 17tr
    /* Tong cac to + phan chua gan phai BANG tong cua don — khong duoc ho mot dong nao. */
    const gia = {
      hoaDonVAT: [{ id: "hd1", soHoaDon: "A", ngayHoaDon: "2026-09-01", soTien: 10_000_000, nguoiGhiTen: "X" }],
    };
    const ra = TN.hanNoTungToHoaDon(gia, "2026-09-01", new Date(2026, 8, 25), dotChi.filter((d) => d.poId === "po"));
    const tongCacTo = ra.reduce((s, x) => s + x.daTra, 0);
    const chuaGan = TN.tienChuaGanHoaDon(
      dotChi.filter((d) => d.poId === "po"),
      gia.hoaDonVAT.map((x) => x.id),
    );
    return {
      duoc: tongCuaDon === 17_000_000 && tongCacTo + chuaGan === tongCuaDon,
      thucTe: `tong don=${tongCuaDon} · tong cac to=${tongCacTo} + chua gan=${chuaGan} = ${tongCacTo + chuaGan}`,
      mongDoi: "17000000 va tong cac to + chua gan PHAI bang tong cua don — KE CA khi co dot tro toi to da bi xoa",
    };
  },
);

kiem(
  "Da tat toan thi THOI canh bao han",
  'Sếp · 20/09/2026 — *"Để như vậy thì sao hoàn thành được"*',
  () => {
    /* To tra xong roi ma the van keu "Qua han 3 ngay" la app duoi nguoi dung di lam mot viec da
       xong. Cung thu tu uu tien voi cap don: trang thai tat toan DE LEN canh bao thoi gian. */
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const gia = {
      soNgayDuocNo: 5,
      hoaDonVAT: [{ id: "hd1", soHoaDon: "A", ngayHoaDon: "2026-09-01", soTien: 1_000_000, nguoiGhiTen: "X" }],
    };
    const chuaTra = TN.hanNoTungToHoaDon(gia, "2026-09-01", new Date(2026, 8, 25), []);
    const daTra = TN.hanNoTungToHoaDon(gia, "2026-09-01", new Date(2026, 8, 25), [
      { id: "d1", poId: "po", ngayChi: "2026-09-10", soTien: 1_000_000, hoaDonId: "hd1" },
    ]);
    return {
      duoc:
        chuaTra[0].canhBao.tong === "danger" &&
        daTra[0].canhBao.nhan === "Đã tất toán" &&
        daTra[0].canhBao.tong === "success",
      thucTe: `chua tra=${chuaTra[0].canhBao.nhan} · da tra=${daTra[0].canhBao.nhan}`,
      mongDoi: "chua tra thi qua han (danger) · tra du thi 'Đã tất toán' (success)",
    };
  },
);

kiem(
  "To ghi 0 dong KHONG phai da tat toan",
  'Sếp · 20/09/2026',
  () => {
    /* To ghi 0 dong la to CHUA CO SO LIEU, khong phai to da tra xong. Hien xanh "da tat toan"
       cho no la giau mat mot dong con thieu du lieu — cung luat voi cap don. */
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const ra = TN.hanNoTungToHoaDon(
      { hoaDonVAT: [{ id: "hd1", soHoaDon: "A", ngayHoaDon: "2026-09-01", soTien: 0, nguoiGhiTen: "X" }] },
      "2026-09-01",
      new Date(2026, 8, 25),
      [],
    );
    return {
      duoc: ra[0].daTatToan === false,
      thucTe: `daTatToan=${ra[0].daTatToan} · nhan=${ra[0].canhBao.nhan}`,
      mongDoi: "false — to 0 dong la chua co so lieu, khong phai da tra xong",
    };
  },
);

kiem(
  "Han no TUNG TO: moc mac dinh la NGAY HOA DON, khong phai ngay nhan hang cua don",
  'Sếp · 20/09/2026 — *"Thêm trường nhập thông tin giống mục theo dõi công nợ"* + chốt "Từ ngày hoá đơn, nhưng cho sửa tay"',
  () => {
    /* 🔴 Lay lai moc cua PO cho tung to thi MOI to co cung ngay toi han => bang con chi lap lai
       dung dong PO phia tren, tinh nang thanh vo nghia. Bai nay ghim dung dieu do. */
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const ra = TN.hanNoTungToHoaDon(
      {
        soNgayDuocNo: 30,
        hoaDonVAT: [
          { id: "a", soHoaDon: "HD-A", ngayHoaDon: "2026-09-01", soTien: 1, nguoiGhiTen: "X" },
          { id: "b", soHoaDon: "HD-B", ngayHoaDon: "2026-09-20", soTien: 2, nguoiGhiTen: "X" },
        ],
      },
      "2026-08-01", // ngay bat dau cua DON — KHONG duoc dung khi to da co ngay hoa don
      new Date(2026, 8, 25),
    );
    return {
      duoc:
        ra.length === 2 &&
        ra[0].ngayBatDau === "2026-09-01" &&
        ra[0].ngayToiHan === "2026-10-01" &&
        ra[1].ngayBatDau === "2026-09-20" &&
        ra[1].ngayToiHan === "2026-10-20",
      thucTe: ra.map((x) => `${x.soHoaDon}: ${x.ngayBatDau} -> ${x.ngayToiHan}`).join(" · "),
      mongDoi: "HD-A: 2026-09-01 -> 2026-10-01 · HD-B: 2026-09-20 -> 2026-10-20 (hai to HAI han khac nhau)",
    };
  },
);

kiem(
  "CHIEU NGHICH — go tay thi THANG ngay hoa don; khong khai so ngay thi KE THUA don",
  'Sếp · 20/09/2026 — *"Từ ngày hoá đơn, nhưng cho sửa tay"*',
  () => {
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const ra = TN.hanNoTungToHoaDon(
      {
        soNgayDuocNo: 30,
        hoaDonVAT: [
          /* To nay go tay ca hai truong -> phai thang ca ngay hoa don lan so ngay cua don. */
          {
            id: "a",
            soHoaDon: "HD-A",
            ngayHoaDon: "2026-09-01",
            soTien: 1,
            nguoiGhiTen: "X",
            ngayBatDauTinhNoTay: "2026-09-10",
            soNgayDuocNo: 7,
          },
          /* To nay khong khai gi -> ke thua 30 ngay cua don, moc la ngay hoa don. */
          { id: "b", soHoaDon: "HD-B", ngayHoaDon: "2026-09-01", soTien: 2, nguoiGhiTen: "X" },
        ],
      },
      "2026-08-01",
      new Date(2026, 8, 25),
    );
    return {
      duoc:
        ra[0].ngayBatDau === "2026-09-10" &&
        ra[0].ngayToiHan === "2026-09-17" &&
        ra[0].batDauNhapTay === true &&
        ra[0].soNgayRieng === true &&
        ra[1].soNgayDuocNo === 30 &&
        ra[1].soNgayRieng === false &&
        ra[1].batDauNhapTay === false,
      thucTe: `go tay: ${ra[0].ngayBatDau}->${ra[0].ngayToiHan} (rieng=${ra[0].soNgayRieng}) · ke thua: ${ra[1].soNgayDuocNo} ngay (rieng=${ra[1].soNgayRieng})`,
      mongDoi: "go tay 2026-09-10 -> 2026-09-17 voi 7 ngay rieng · to kia ke thua 30 ngay cua don",
    };
  },
);

kiem(
  "Thieu so ngay no -> KHONG bia ra ngay toi han",
  'Sếp · 20/09/2026 — *"Thêm trường nhập thông tin giống mục theo dõi công nợ"*',
  () => {
    /* Don chua dat so ngay duoc no thi khong co can cu nao tinh han. Bia ra mot ngay cho bang
       trong day du la app noi doi — cung luat voi cap don (xem `congNoTheoDonHang`). */
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const ra = TN.hanNoTungToHoaDon(
      { hoaDonVAT: [{ id: "a", soHoaDon: "HD-A", ngayHoaDon: "2026-09-01", soTien: 1, nguoiGhiTen: "X" }] },
      undefined,
      new Date(2026, 8, 25),
    );
    /* Ngay hoa don RAC cung khong duoc lam hong cot ngay. */
    const raRac = TN.hanNoTungToHoaDon(
      {
        soNgayDuocNo: 30,
        hoaDonVAT: [{ id: "b", soHoaDon: "HD-B", ngayHoaDon: "khong-phai-ngay", soTien: 1, nguoiGhiTen: "X" }],
      },
      undefined,
      new Date(2026, 8, 25),
    );
    return {
      duoc: ra[0].ngayToiHan === undefined && raRac[0].ngayToiHan === undefined,
      thucTe: `thieu so ngay=${ra[0].ngayToiHan} · ngay rac=${raRac[0].ngayToiHan}`,
      mongDoi: "ca hai undefined — khong bia ngay toi han",
    };
  },
);

kiem(
  "Co hoa don ma CHUA ai chon -> tu lay can cu HOA DON",
  'Sếp · 20/09/2026 — *"hoá đơn này chưa thấy link tự động qua chức năng công nợ"* → *"E SỬA ĐI"*',
  () => {
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const coBang = TN.canCuHieuLuc({ hoaDonVAT: [{ soTien: 1 }] });
    const coTruongCu = TN.canCuHieuLuc({ tongTienHoaDon: 5_000_000 });
    const chuaCoGi = TN.canCuHieuLuc({});
    const khongCoGia = TN.canCuHieuLuc(undefined);
    return {
      duoc:
        coBang === "hoa_don" && coTruongCu === "hoa_don" && chuaCoGi === "po" && khongCoGia === "po",
      thucTe: `co bang=${coBang} · truong cu=${coTruongCu} · chua co=${chuaCoGi} · khong gia=${khongCoGia}`,
      mongDoi: "hoa_don · hoa_don · po · po",
    };
  },
);

kiem(
  "Bo nut chon can cu -> lua chon tay CU khong con duoc doc, app tu chon theo co hoa don hay chua",
  'Sếp · 25/09/2026 — *"Bỏ chữ năng đánh dấu này đi"* (THAY bài kiểm 19/09 "người dùng đã chọn thì app không được tự đổi")',
  () => {
    /* 🔴 BAI KIEM NAY THAY bai "CHIEU NGHICH — nguoi dung DA chon thi app KHONG duoc tu doi"
       (chi dao 19/09). 25/09 Sep bo han nut chon; giu doc lua chon cu la don tung chon "theo PO"
       ket vinh vien o PO, khong con nut de doi. Neu sau nay dung lai nut chon thi phai dung lai
       ca bai kiem 19/09. */
    const TN = nap(join(thuMuc, "tuoi-no.cjs"));
    const cuChonPO = TN.canCuHieuLuc({ canCuCongNo: "po", hoaDonVAT: [{ soTien: 9 }] });
    const cuChonHD = TN.canCuHieuLuc({ canCuCongNo: "hoa_don" });
    return {
      duoc: cuChonPO === "hoa_don" && cuChonHD === "po",
      thucTe: `tung chon PO nhung co hoa don=${cuChonPO} · tung chon hoa don nhung chua co=${cuChonHD}`,
      mongDoi: "hoa_don · po — app tu chon, bo qua lua chon tay cu",
    };
  },
);

kiem(
  "Nhan tep cua tung to hoa don PHAI dung khuon luat nhan ra duoc",
  'Sếp · 20/09/2026 — *"tích hợp mục đính kèm hoá đơn đó xuống mục dưới"* + chốt "mỗi tờ hoá đơn một tệp riêng"',
  () => {
    /* 🔴🔴 BAI KIEM NAY GHIM CHO DE KET HO SO VINH VIEN.
       `tepTheoNhan` chi nhan `ghiChu` bang dung "Hóa đơn VAT" hoac "Hóa đơn VAT (n)" voi n la CHU
       SO THUAN. Moi to hoa don duoc cap mot nhan rieng luc tao dong; dat nhan kieu khac (vd theo
       id dong: "Hóa đơn VAT hd-ab12") thi tep LUU THAT ma `coHoaDonVAT` KHONG THAY -> ho so khong
       bao gio dong duoc, va khong mot loi nao bao. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const hoSo = (ghiChu) => ({
      id: "pr-nhan",
      lichSu: [],
      tepGiaiDoan: { ho_so_thanh_toan: [{ id: "t1", ten: "HD.pdf", ghiChu }] },
    });
    const nhanSo = CT.tepHoaDonVAT(hoSo(`${CT.NHAN_TEP_HOA_DON_VAT} (3)`)).length;
    const nhanTron = CT.tepHoaDonVAT(hoSo(CT.NHAN_TEP_HOA_DON_VAT)).length;
    /* Chieu nghich: nhan theo id dong KHONG duoc nhan ra — neu bai nay xanh voi ca nhan rac thi
       phep loc da bi noi long va chot mat tac dung. */
    const nhanRac = CT.tepHoaDonVAT(hoSo(`${CT.NHAN_TEP_HOA_DON_VAT} hd-ab12`)).length;
    return {
      duoc: nhanSo === 1 && nhanTron === 1 && nhanRac === 0,
      thucTe: `"(3)"=${nhanSo} · tron=${nhanTron} · "hd-ab12"=${nhanRac}`,
      mongDoi: "1 · 1 · 0 — chi khuon 'Hóa đơn VAT' va 'Hóa đơn VAT (n)' moi duoc nhan",
    };
  },
);

kiem(
  "CHIEU NGHICH — thieu hoa don cho tung dot giao VAN dong duoc ho so",
  CHU_SEP_BANG_HOA_DON + ' + Sếp chốt "Cho đóng, chỉ nhắc bằng chữ vàng"',
  () => {
    /* 🔴 Sep chot 19/09: NCC thuong xuat GOP cuoi thang. Ep moi dot giao mot hoa don thi don giao
       3 lan ma NCC xuat 1 to se KET VINH VIEN, va moi ho so dang mo bi chan dong ngay hom trien
       khai. Bai nay chan viec "siet cho chat" ve sau. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    /* 📌 Tệp hoá đơn nhận diện bằng NHÃN ghi chú (`NHAN_TEP_HOA_DON_VAT`) trong ngăn
       `ho_so_thanh_toan`, không phải bằng khoá riêng — xem `gopTepHaiKhoa` ở
       `2-quy-trinh/chung-tu-cuoi-quy-trinh.ts`. Dựng sai chỗ này thì bài kiểm đỏ oan. */
    const dn = {
      id: "pr-hd",
      lichSu: [],
      tepGiaiDoan: {
        ho_so_thanh_toan: [{ id: "t1", ten: "HD.pdf", ghiChu: CT.NHAN_TEP_HOA_DON_VAT }],
      },
    };
    const r = CT.vuongMacDuyetHoanThanhDeNghi(dn);
    return {
      duoc: r === null,
      thucTe: JSON.stringify(r),
      mongDoi: "null — co it nhat 1 hoa don la dong duoc, khong doi du tung dot giao",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// ĐỒNG HỒ THEO BƯỚC — Sếp 19/09/2026
//
// *"Nút thời gian này chưa hoạt động / Thời gian ở các bước này tính từ khi công việc chuyển bước
// tới là bắt đầu tính / Nếu quá hạn thì đề nghị đó sẽ báo đỏ"*
//
// Hỏi lại, Sếp chốt thêm ba điều:
//   · đầu cột GIỮ hạn chuẩn (chỉ đạo 15/09), đồng hồ đếm nằm trên TỪNG THẺ
//   · hồ sơ chưa tra ra mốc → ghi "Chưa có mốc", **KHÔNG báo đỏ**
//   · tính theo giờ làm việc **bỏ Chủ nhật**, thứ Bảy vẫn tính
//   · hồ sơ bị kéo LÙI rồi đẩy lên lại → đồng hồ **đếm lại từ đầu**
// ════════════════════════════════════════════════════════════════════

const CHU_SEP_DONG_HO_BUOC =
  'Sếp · 19/09/2026 — *"Thời gian ở các bước này tính từ khi công việc chuyển bước tới là bắt ' +
  'đầu tính / Nếu quá hạn thì đề nghị đó sẽ báo đỏ"*';

kiem("Qua han buoc -> BAO DO (tong danger, quaHan=true)", CHU_SEP_DONG_HO_BUOC, () => {
  /* Vao buoc luc 08:00 thu Hai, han 4 gio, bay gio la 14:00 cung ngay -> tre 2 gio. */
  const vao = new Date(2026, 8, 14, 8, 0, 0); // 14/09/2026 la thu Hai
  const bayGio = new Date(2026, 8, 14, 14, 0, 0);
  const r = G.hanTheoBuoc(vao.toISOString(), 4, bayGio, true);
  return {
    duoc: r !== null && r.quaHan === true && r.tong === "danger" && r.coMoc === true,
    thucTe: JSON.stringify(r),
    mongDoi: "quaHan=true · tong=danger · coMoc=true",
  };
});

kiem(
  "CHIEU NGHICH — CHUA co moc thi KHONG duoc bao do",
  CHU_SEP_DONG_HO_BUOC + ' + Sếp chốt "Ghi Chưa có mốc, không báo đỏ"',
  () => {
    /* 🔴 Chot cua Sep 19/09. Coi thieu moc = 0 gio thi ca bang do ruc ngay lan deploy dau;
       coi thieu moc = vua vao buoc thi ho so ton dong tu tuan truoc duoc tha oan. Ca hai deu
       la app noi doi, chi khac chieu. */
    const r = G.hanTheoBuoc(undefined, 4, new Date(2026, 8, 14, 14, 0, 0), true);
    const rRac = G.hanTheoBuoc("khong-phai-ngay", 4, new Date(2026, 8, 14, 14, 0, 0), true);
    return {
      duoc:
        r !== null && r.quaHan === false && r.coMoc === false &&
        rRac !== null && rRac.quaHan === false && rRac.coMoc === false,
      thucTe: `khong moc=${JSON.stringify(r)} · moc rac=${JSON.stringify(rRac)}`,
      mongDoi: "ca hai: quaHan=false, coMoc=false (chuoi ngay hong cung phai an toan)",
    };
  },
);

kiem("Buoc KHONG dat han -> khong ve gi (tra null)", CHU_SEP_DONG_HO_BUOC, () => {
  /* Buoc "Tien hanh nhan hang" mac dinh han = 0 = khong dat han. Ve badge "Tre 900 gio" cho
     buoc do la bao dong gia — chot mat tin cay con te hon khong co chot. */
  const vao = new Date(2026, 8, 1, 8, 0, 0).toISOString();
  const r0 = G.hanTheoBuoc(vao, 0, new Date(2026, 8, 14), true);
  const rU = G.hanTheoBuoc(vao, undefined, new Date(2026, 8, 14), true);
  return {
    duoc: r0 === null && rU === null,
    thucTe: `han 0 -> ${JSON.stringify(r0)} · han undefined -> ${JSON.stringify(rU)}`,
    mongDoi: "ca hai tra null",
  };
});

kiem(
  "Bo qua CHU NHAT: thu Bay VAN tinh, Chu nhat KHONG tinh",
  CHU_SEP_DONG_HO_BUOC + ' + Sếp chốt "giờ làm việc nhưng chỉ bỏ Chủ nhật"',
  () => {
    /* 19/09/2026 la thu Bay, 20/09 Chu nhat, 21/09 thu Hai.
       Tu 12:00 thu Bay -> 12:00 thu Hai = 48 gio lich, bo tron 24 gio Chu nhat con 24. */
    const tu = new Date(2026, 8, 19, 12, 0, 0);
    const den = new Date(2026, 8, 21, 12, 0, 0);
    const coBo = G.gioTroiQua(tu, den, true);
    const khongBo = G.gioTroiQua(tu, den, false);
    /* Chieu nghich trong cung mot bai: thu Bay phai VAN duoc tinh. 12:00 thu Sau -> 12:00 thu Bay
       la 24 gio, bo Chu nhat khong anh huong gi. */
    const thuBay = G.gioTroiQua(new Date(2026, 8, 18, 12), new Date(2026, 8, 19, 12), true);
    return {
      duoc: Math.round(coBo) === 24 && Math.round(khongBo) === 48 && Math.round(thuBay) === 24,
      thucTe: `bo CN=${coBo} · khong bo=${khongBo} · qua thu Bay=${thuBay}`,
      mongDoi: "24 · 48 · 24 (Chu nhat bi tru, thu Bay van tinh)",
    };
  },
);

kiem(
  "Moc CU cua buoc KHAC khong duoc dung cho buoc dang dung",
  CHU_SEP_DONG_HO_BUOC + ' + Sếp chốt "lùi bước thì đếm lại từ đầu"',
  () => {
    /* 🔴 Vi sao `mocVaoBuoc` phai luu CA `buoc` lan `thoiDiem`: ho so lui buoc roi day len lai thi
       dong ho dem lai tu dau. Chi luu thoi diem thi khong phan biet duoc "moc cua buoc nay" voi
       "moc cu cua buoc khac con sot lai". */
    const dn = {
      id: "pr-x",
      lichSu: [],
      mocVaoBuoc: { buoc: "tiep_nhan", thoiDiem: new Date(2026, 8, 1, 8).toISOString() },
    };
    const dungBuoc = G.traMocVaoBuoc(dn, "tiep_nhan");
    const khacBuoc = G.traMocVaoBuoc(dn, "dat_hang");
    return {
      duoc: Boolean(dungBuoc) && khacBuoc === undefined,
      thucTe: `dung buoc=${JSON.stringify(dungBuoc)} · khac buoc=${JSON.stringify(khacBuoc)}`,
      mongDoi: "dung buoc co moc · khac buoc KHONG lay moc cu",
    };
  },
);

kiem(
  "Tang bu: tra duoc moc tu THONG BAO chuyen buoc va tu NHAT KY",
  CHU_SEP_DONG_HO_BUOC,
  () => {
    /* 🔴 Khong co tang bu thi tinh nang IM LANG voi toan bo ho so ton dong: app chi ghi moc tu
       19/09/2026, ma ho so da nam san o buoc ②–⑦ tu hom qua thi khong bao gio co moc. */
    const dn = {
      id: "pr-y",
      lichSu: [
        { thoiDiem: new Date(2026, 8, 10, 9).toISOString(), nguoiThucHien: "A", hanhDong: "Tao" },
        { thoiDiem: new Date(2026, 8, 12, 9).toISOString(), nguoiThucHien: "A", hanhDong: "Sua" },
      ],
    };
    const tb = [
      { prId: "pr-y", tuBuoc: "tiep_nhan", denBuoc: "dat_hang", thoiDiem: new Date(2026, 8, 13, 10).toISOString() },
      /* Tin "de nghi moi vao bang" — `tuBuoc` trong. PHAI bi bo qua, no khong phai chuyen buoc. */
      { prId: "pr-y", denBuoc: "dat_hang", thoiDiem: new Date(2026, 8, 18, 10).toISOString() },
    ];
    const tuThongBao = G.traMocVaoBuoc(dn, "dat_hang", tb);
    const tuNhatKy = G.traMocVaoBuoc(dn, "tiep_nhan");
    return {
      duoc:
        tuThongBao === tb[0].thoiDiem &&
        tuNhatKy === dn.lichSu[0].thoiDiem,
      thucTe: `tu thong bao=${tuThongBao} · tu nhat ky=${tuNhatKy}`,
      mongDoi: "lay tin CO tuBuoc (bo tin tuBuoc trong) · nhat ky lay dong SOM NHAT",
    };
  },
);

kiem(
  "CHIEU NGHICH — nhat ky CHI dung cho buoc DAU, khong bia cho buoc khac",
  CHU_SEP_DONG_HO_BUOC,
  () => {
    /* Dung dong dau nhat ky lam moc cho buoc ⑤ la bia: luc do ho so vao APP chu khong vao BUOC do. */
    const dn = {
      id: "pr-z",
      lichSu: [{ thoiDiem: new Date(2026, 8, 10, 9).toISOString(), nguoiThucHien: "A", hanhDong: "Tao" }],
    };
    const r = G.traMocVaoBuoc(dn, "dat_hang");
    return {
      duoc: r === undefined,
      thucTe: JSON.stringify(r),
      mongDoi: "undefined — khong lay dong dau nhat ky lam moc cho buoc giua chung",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// PHÒNG BAN KHÁC CHỈ CÒN "THEO DÕI ĐỀ NGHỊ" — Sếp 18/09/2026
//
// Nguyên văn: *"Ở tài khoản của các phòng ban khác khi phân quyền thì chỉ mở được chức năng
// 'Theo dõi đề nghị' thôi"* (ảnh: một tài khoản ngoài phòng Thu mua đang thấy Tổng quan · Công
// việc của tôi · Lịch công việc · Đơn hàng).
// ════════════════════════════════════════════════════════════════════

const CHU_SEP_CHI_THEO_DOI =
  'Sếp · 18/09/2026 — *"Ở tài khoản của các phòng ban khác khi phân quyền thì chỉ mở được chức ' +
  'năng \'Theo dõi đề nghị\' thôi"*';

const aiDo = (them) =>
  PQ.tinhQuyen({
    uid: "u-ngoai",
    tenHienThi: "Nguoi ngoai",
    chucDanh: "",
    vaiTro: "staff",
    chucNang: "phong_thi_cong",
    capTM: 2,
    ...them,
  });

kiem("Phong ban khac KHONG vao duoc /tong-quan /viec-cua-toi /lich", CHU_SEP_CHI_THEO_DOI, () => {
  /* 🔴 KIỂM `duocVaoDuongDan`, KHÔNG kiểm mục menu. Ẩn menu không phải là chặn — người gõ thẳng
     địa chỉ hoặc bấm thẻ đã lưu vẫn vào được. Đây đúng bài học đã ghi cho `/de-nghi` (BLĐ 16/08). */
  const q = aiDo({});
  const chan = ["/tong-quan", "/viec-cua-toi", "/lich", "/de-nghi"].filter(
    (d) => PQ.duocVaoDuongDan(d, q) === false,
  );
  const moTheoDoi = PQ.duocVaoDuongDan("/theo-doi", q) === true;
  return {
    duoc: chan.length === 4 && moTheoDoi,
    thucTe: `chan=[${chan.join(" ")}] · /theo-doi=${moTheoDoi}`,
    mongDoi: "chan du 4 duong dan, va /theo-doi VAN mo",
  };
});

kiem("CHIEU NGHICH — nguoi lam THU MUA van vao duoc ca 3 man", CHU_SEP_CHI_THEO_DOI, () => {
  /* Chống chữa bài trên bằng cách chặn tất cả: siết nhầm là cả phòng Thu mua mất màn Tổng quan,
     Công việc của tôi và Lịch — tức app gần như vô dụng với chính người dùng chính. */
  const nv = aiDo({ chucNang: "nhan_vien_thu_mua" });
  const tp = aiDo({ chucNang: "truong_bo_phan_thu_mua", capTM: 3 });
  const mo = (q) =>
    ["/tong-quan", "/viec-cua-toi", "/lich"].every((d) => PQ.duocVaoDuongDan(d, q) === true);
  return {
    duoc: mo(nv) && mo(tp),
    thucTe: `nhan vien=${mo(nv)} · truong bo phan=${mo(tp)}`,
    mongDoi: "ca hai deu vao duoc — ho la nguoi dung chinh cua nhung man nay",
  };
});

kiem("THU KHO van vao duoc /don-hang de bam xac nhan nhan du hang", CHU_SEP_CHI_THEO_DOI, () => {
  /* 🔴 Nút "Kho xác nhận nhận đủ hàng" nằm ở `/don-hang/{poId}`, và từ 30/08/2026 thủ kho không
     ghi phiếu nhận trong app này nữa — đó là việc DUY NHẤT của họ ở đây. Siết nốt màn này là màn
     đó thành mồ côi với thủ kho (CLAUDE.md §3.4b). */
  const tk = aiDo({ chucNang: "thu_kho_cong_trinh", capTM: 1, capKho: 2 });
  return {
    duoc: PQ.duocVaoDuongDan("/don-hang", tk) === true && PQ.duocVaoDuongDan("/de-nghi", tk) === false,
    thucTe: `/don-hang=${PQ.duocVaoDuongDan("/don-hang", tk)} · /de-nghi=${PQ.duocVaoDuongDan("/de-nghi", tk)}`,
    mongDoi: "/don-hang MO (co viec that o do) · /de-nghi VAN chan (BLD 16/08/2026)",
  };
});

// ════════════════════════════════════════════════════════════════════
// HỢP ĐỒNG: ĐÍNH VÀO Ô TRỐNG ≠ THAY BẢN ĐÃ CÓ — Sếp 18/09/2026
//
// *"mở nút đính kèm cho nhân viên"*, và khi được hỏi lại thì chốt *"vẫn giữ ở trưởng bộ phận"*
// cho việc thay/xoá. Hai câu đó là HAI quyền khác nhau trên cùng một ô.
//
// 🔴 TRƯỚC 18/09 KHÔNG CÓ BÀI KIỂM NÀO GHIM CHỈ ĐẠO 01/09/2026 (siết quyền thay hợp đồng từ bước
//    ⑤). Grep cả tên hàm lẫn ngày trong tệp này đều ra 0 — nghĩa là ai nới hàm đó cũng không có
//    dòng đỏ nào báo đang đụng chỉ đạo của ai. Ba bài dưới bịt đúng lỗ đó.
// ════════════════════════════════════════════════════════════════════

const CHU_SEP_DINH_HD =
  'Sếp · 18/09/2026 *"mở nút đính kèm cho nhân viên"* + *"vẫn giữ ở trưởng bộ phận"* (thay/xoá), ' +
  'trên nền chỉ đạo Sếp · 01/09/2026 *"siết người được thay lại kể từ bước ⑤"*';

const qNhanVien = { phanBoCongViec: false, lapPO: true };
const qTruongBP = { phanBoCongViec: true, lapPO: true };
const qChiXem = { phanBoCongViec: false, lapPO: false };

kiem("Nhan vien DINH duoc hop dong vao o trong", CHU_SEP_DINH_HD, () => {
  /* ⚠️ BỎ MẢNG 4 GIAI ĐOẠN — sửa 18/09/2026. Bản đầu lặp qua mảng đó nhưng KHÔNG truyền giai đoạn
     vào hàm, nên mảng chỉ là trang trí: gọi cùng một phép bốn lần. Tệ hơn, nó che đúng ca cần
     canh — ai thêm tham số giai đoạn rồi siết "từ bước ⑤ cũng chỉ trưởng bộ phận" là đóng lại
     thứ Sếp vừa mở, mà bài vẫn xanh. Nay bài kiểm nói đúng thứ nó thật sự đo, và có thêm một bài
     riêng bên dưới canh việc hàm bị thêm tham số giai đoạn. */
  return {
    duoc:
      G.duocDinhHopDongVaoOTrong(qNhanVien) === true &&
      G.duocDinhHopDongVaoOTrong(qTruongBP) === true,
    thucTe: `nhan vien=${G.duocDinhHopDongVaoOTrong(qNhanVien)} · truong bo phan=${G.duocDinhHopDongVaoOTrong(qTruongBP)}`,
    mongDoi: "ca hai deu TRUE — o dang trong thi nguoi nhan duoc ban ky phai dinh vao duoc",
  };
});

kiem("Quyen DINH hop dong KHONG phu thuoc giai doan", CHU_SEP_DINH_HD, () => {
  /* 🔴 Ghim đúng điểm khác nhau giữa hai hàm: `duocSuaHopDongTheoGiaiDoan` NHẬN giai đoạn và siết
     từ bước ⑤; `duocDinhHopDongVaoOTrong` thì KHÔNG — ô trống thì bước nào cũng đính được. Ai
     thêm tham số giai đoạn cho hàm này rồi siết theo bước là đóng lại thứ Sếp mở 18/09/2026, và
     bài này đỏ ngay vì hàm nhận thừa tham số. */
  return {
    duoc: G.duocDinhHopDongVaoOTrong.length === 1,
    thucTe: `so tham so cua duocDinhHopDongVaoOTrong = ${G.duocDinhHopDongVaoOTrong.length}`,
    mongDoi: "1 — chi nhan bo quyen, KHONG nhan giai doan",
  };
});

kiem(
  "CHIEU NGHICH — tu buoc ⑤, nhan vien KHONG duoc THAY/XOA ban da co",
  CHU_SEP_DINH_HD,
  () => {
    /* 🔴 Đây là nửa còn lại của chỉ đạo, và là nửa dễ mất nhất: cách sửa "tiện tay" là nới thẳng
       `duocSuaHopDongTheoGiaiDoan` cho `lapPO` — lúc đó nhân viên thay hoặc xoá được bản hợp đồng
       đã ký ở tận bước ⑦, không còn lớp nào chặn. Ô hợp đồng KHÔNG có bản đối chiếu nào trong app:
       tệp đính kèm là bản ghi duy nhất của nội dung hợp đồng. */
    const nvTuBuoc5 = ["dat_hang", "nhan_hang", "ho_so_thanh_toan"].map((gd) =>
      G.duocSuaHopDongTheoGiaiDoan(qNhanVien, gd),
    );
    const tpTuBuoc5 = G.duocSuaHopDongTheoGiaiDoan(qTruongBP, "ho_so_thanh_toan");
    return {
      duoc: nvTuBuoc5.every((x) => x === false) && tpTuBuoc5 === true,
      thucTe: `nhan vien tu ⑤=[${nvTuBuoc5.join(" ")}] · truong bo phan=${tpTuBuoc5}`,
      mongDoi: "nhan vien FALSE o ca 3 buoc · truong bo phan TRUE",
    };
  },
);

kiem("CHIEU NGHICH — tai khoan chi XEM khong dinh duoc gi", CHU_SEP_DINH_HD, () => {
  /* Sếp nói "nhân viên", không nói "mọi người". Cấp 1 (chỉ xem) phải trượt cả hai quyền. */
  return {
    duoc:
      G.duocDinhHopDongVaoOTrong(qChiXem) === false &&
      G.duocSuaHopDongTheoGiaiDoan(qChiXem, "lap_don_mua_hang") === false,
    thucTe: `dinh moi=${G.duocDinhHopDongVaoOTrong(qChiXem)} · sua=${G.duocSuaHopDongTheoGiaiDoan(qChiXem, "lap_don_mua_hang")}`,
    mongDoi: "ca hai FALSE",
  };
});

kiem("Buoc ④ — nhan vien VAN sua duoc nhu truoc (chi dao 01/09 chi siet tu ⑤)", CHU_SEP_DINH_HD, () => {
  /* Chống siết nhầm theo chiều ngược: ai đó "dọn cho gọn" bằng cách bắt mọi giai đoạn dùng
     `phanBoCongViec` là nhân viên mất luôn quyền đính bản hợp đồng đầu tiên ở bước ④. */
  return {
    duoc: G.duocSuaHopDongTheoGiaiDoan(qNhanVien, "lap_don_mua_hang") === true,
    thucTe: `buoc ④ nhan vien=${G.duocSuaHopDongTheoGiaiDoan(qNhanVien, "lap_don_mua_hang")}`,
    mongDoi: "TRUE — 01/09/2026 ghi ro: con o buoc ④ thi `phanBoCongViec || lapPO`",
  };
});

// ════════════════════════════════════════════════════════════════════
// ⬇⬇ BÀI KIỂM CỦA PHIÊN TÍCH HỢP APP TỔNG — commit e012a5f / 35cbd82 (17/09/2026).
// Trộn vào đây 18/09/2026 vì cả hai phiên cùng thêm bài ở cuối tệp. KHÔNG SỬA NỘI DUNG.
// ════════════════════════════════════════════════════════════════════

/* ★★★ GIAO THIẾU VẪN QUA ĐƯỢC BƯỚC ⑦ — Sếp 17/09/2026.

   Nguyên văn: *"Cái nút ở bước 6 thu mua là phải có tiến độ nhận hàng, có đủ hay thiếu thì NV thu
   mua cũng bấm được vì có trường hợp giao thiếu"*.

   🔴 VÌ SAO PHẢI CÓ BÀI KIỂM: trước 17/09 chỉ có hai đường vào ⑦ và cả hai đều đòi hàng về ĐỦ.
   Nhà cung cấp giao thiếu rồi không giao nốt là chuyện có thật — hồ sơ đó kẹt vĩnh viễn ở cột ⑥.
   Đo lúc 21:03 ngày 17/09: 4/5 đề nghị đứng ở cột ⑥ đúng vì lý do này.

   🔴 BA BÀI, TRONG ĐÓ HAI BÀI LÀ CHIỀU NGHỊCH. Chiều thuận (giao thiếu + đã xác nhận → qua bước)
   mà xanh một mình thì chưa chứng minh được gì: một hàm trả bừa `"ho_so_thanh_toan"` cũng xanh.
   Phải có bài canh "chưa xác nhận thì KHÔNG được qua" và bài canh `every` mới đủ. */

kiem(
  "🔴 Giao THIẾU nhưng thu mua ĐÃ xác nhận nhận hàng → qua được ⑦ Hồ sơ thanh toán",
  'Sếp 17/09/2026 — *"có đủ hay thiếu thì NV thu mua cũng bấm được vì có trường hợp giao thiếu"*',
  () => {
    const b = boGiaiDoanThu();
    const poDaXN = { ...b.po, xacNhanKho: { uid: "u1", ten: "NV Thu mua", thoiDiem: "2026-09-17" } };
    const gd = G.xacDinhGiaiDoan(b.dn, [poDaXN], [], b.phieu(50));
    return {
      duoc: gd === "ho_so_thanh_toan",
      thucTe: `xacDinhGiaiDoan = "${gd}" (mới nhận 50/100, đã xác nhận)`,
      mongDoi: '"ho_so_thanh_toan" — trước 17/09 chỗ này trả "nhan_hang" và hồ sơ kẹt vĩnh viễn',
    };
  },
);

kiem(
  "🔴 CHIỀU NGHỊCH: giao thiếu mà CHƯA ai xác nhận → vẫn đứng ở ⑥",
  "mở cho giao thiếu không có nghĩa mọi hồ sơ tự nhảy bước",
  () => {
    const b = boGiaiDoanThu();
    const gd = G.xacDinhGiaiDoan(b.dn, [b.po], [], b.phieu(50));
    return {
      duoc: gd === "nhan_hang",
      thucTe: `xacDinhGiaiDoan = "${gd}"`,
      mongDoi: '"nhan_hang" — phải có người bấm xác nhận thì mới qua bước',
    };
  },
);

kiem(
  "🔴 Đề nghị có HAI đơn, mới xác nhận MỘT → vẫn đứng ở ⑥",
  "dùng `every` chứ không phải `some` — một đơn xong không kéo cả hồ sơ sang bước thanh toán",
  () => {
    const b = boGiaiDoanThu();
    const po1 = { ...b.po, xacNhanKho: { uid: "u1", ten: "NV Thu mua", thoiDiem: "2026-09-17" } };
    const po2 = { ...b.po, id: b.po.id + "-2", code: b.po.code + "-2" };
    const gd = G.xacDinhGiaiDoan(b.dn, [po1, po2], [], b.phieu(50));
    return {
      duoc: gd === "nhan_hang",
      thucTe: `xacDinhGiaiDoan = "${gd}" (1/2 đơn đã xác nhận)`,
      mongDoi: '"nhan_hang" — còn đơn chưa xác nhận thì hồ sơ chưa qua bước',
    };
  },
);

/* ★★★ AI ĐƯỢC BẤM "XÁC NHẬN NHẬN HÀNG" — Sếp chốt phương án B ngày 17/09/2026.

   🔴 LUẬT NÀY VỪA BỊ ĐẢO, NÊN PHẢI CÓ BÀI KIỂM KHOÁ LẠI. Trước 17/09 nút thuộc về thủ kho
   (`quyen.xacNhanKho`), và thu mua chỉ bấm được hồ sơ PHÒNG BAN. Sếp mô tả lại quy trình thật:
   *"Kho chỉ gửi phiếu đánh đủ số lượng, còn thu mua trên app thu mua bấm xác nhận nhận hàng qua
   bước chứ"*. Hỏi lại ai còn được bấm, Sếp chốt **chỉ nhân viên thu mua**.

   🔴 CHIỀU NGHỊCH MỚI LÀ CHIỀU NGUY HIỂM: nếu ai đó nối lại `quyen.xacNhanKho` vào hàm này thì
   thủ kho lại bấm được, hồ sơ vẫn qua bước bình thường, và **không có triệu chứng nào** — chỉ tới
   lúc đối chiếu trách nhiệm mới phát hiện hai bên cùng bấm được. Vì vậy phải canh cả chiều đó. */
const tepRaQuyen = join(thuMuc, "quyen-theo-ho-so.cjs");
try {
  execSync(
    `npx --yes esbuild "4-phan-quyen/quyen-theo-ho-so.ts" --bundle --platform=node --format=cjs --outfile="${tepRaQuyen}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 4-phan-quyen/quyen-theo-ho-so.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}
const QH = nap(tepRaQuyen);

kiem(
  "🔴 Theo doi de nghi: CHI nguoi lap / duoc chia viec / theo doi (hoac cap quan ly) xem duoc — trang chi tiet cung chan",
  'Sếp · 25/09/2026 — *"Cần tối ưu giải pháp theo dõi này"*; lỗ hổng `/theo-doi/<id>` không kiểm quyền (phản biện 25/09)',
  () => {
    const dn = {
      nguoiDeNghiUid: "lap",
      items: [{ stt: 1, nguoiPhuTrachUid: "chia" }],
      nguoiTheoDoi: [{ uid: "theodoi" }],
    };
    const thuong = { xemMoiHoSo: false };
    const xet = (uid, q = thuong) => QH.duocXemTienTrinhDeNghi(dn, uid, q);
    const kq = {
      lap: xet("lap"),
      chia: xet("chia"),
      theodoi: xet("theodoi"),
      nguoiLa: xet("nguoi-la"),
      uidRong: xet(""),
      quanLy: xet("nguoi-la", { xemMoiHoSo: true }),
    };
    return {
      duoc: kq.lap && kq.chia && kq.theodoi && !kq.nguoiLa && !kq.uidRong && kq.quanLy,
      thucTe: JSON.stringify(kq),
      mongDoi: "lap/chia/theodoi/quanLy = true · nguoiLa/uidRong = false",
    };
  },
);

/** Hồ sơ CÔNG TRÌNH — có mã hợp đồng chủ đầu tư. */
const hsCongTrinh = { maHopDongCDT: "2026/HDXD", items: [] };
/** Hồ sơ PHÒNG BAN — không có mã hợp đồng. */
const hsPhongBan = { maHopDongCDT: "", items: [] };
/** Nhân viên thu mua đủ cấp (cấp 2 = "Nhập liệu" trở lên). */
const nvTMQuyen = { uid: "u1", chucNang: "nhan_vien_thu_mua", capTM: 2 };

kiem(
  "🔴 Nhân viên thu mua BẤM ĐƯỢC trên hồ sơ CÔNG TRÌNH",
  'Sếp 17/09/2026, phương án B — *"thu mua trên app thu mua bấm xác nhận nhận hàng qua bước"*',
  () => {
    const r = QH.duocXacNhanNhanDuHangCuaHoSo(hsCongTrinh, nvTMQuyen);
    return { duoc: r === true, thucTe: String(r), mongDoi: "true — trước 17/09 chỗ này trả false" };
  },
);

kiem(
  "Nhân viên thu mua vẫn bấm được trên hồ sơ PHÒNG BAN",
  "nhánh cũ mở từ 15/09/2026 không được mất khi đổi luật",
  () => {
    const r = QH.duocXacNhanNhanDuHangCuaHoSo(hsPhongBan, nvTMQuyen);
    return { duoc: r === true, thucTe: String(r), mongDoi: "true" };
  },
);

kiem(
  "🔴 Người CHỈ ĐƯỢC XEM (cấp 1) KHÔNG bấm được",
  "sàn cấp 2 — cấp 1 là Xem theo chuẩn App Tổng, người chỉ xem không chốt chứng từ",
  () => {
    const r = QH.duocXacNhanNhanDuHangCuaHoSo(hsCongTrinh, { uid: "u2", chucNang: "nhan_vien_thu_mua", capTM: 1 });
    return { duoc: r === false, thucTe: String(r), mongDoi: "false" };
  },
);

kiem(
  "🔴 Người NGOÀI phòng thu mua, KHÔNG được chia việc → KHÔNG bấm được",
  "mở cho thu mua không có nghĩa mở cho cả công ty",
  () => {
    const r = QH.duocXacNhanNhanDuHangCuaHoSo(hsCongTrinh, { uid: "u3", chucNang: "nhan_vien_ky_thuat", capTM: 3 });
    return { duoc: r === false, thucTe: String(r), mongDoi: "false" };
  },
);

kiem(
  "Người ngoài phòng nhưng ĐƯỢC CHIA VIỆC dòng này → bấm được",
  "đường `duocChiaViec` sẵn có, không bị đợt đổi luật làm mất",
  () => {
    const hs = { maHopDongCDT: "2026/HDXD", items: [{ nguoiPhuTrachUid: "u4" }] };
    const r = QH.duocXacNhanNhanDuHangCuaHoSo(hs, { uid: "u4", chucNang: "nhan_vien_ky_thuat", capTM: 2 });
    return { duoc: r === true, thucTe: String(r), mongDoi: "true" };
  },
);

kiem(
  "Không có đề nghị → KHÔNG bấm được, và KHÔNG ném lỗi",
  "đơn chưa gắn đề nghị vẫn gọi hàm này (xem `don-hang-chi-tiet.tsx`)",
  () => {
    const r = QH.duocXacNhanNhanDuHangCuaHoSo(undefined, nvTMQuyen);
    return { duoc: r === false, thucTe: String(r), mongDoi: "false" };
  },
);

kiem(
  "🔴 CHIỀU NGHỊCH: hàm chỉ nhận ĐÚNG 2 tham số, không còn cờ quyền kho",
  "Sếp chọn B chứ không chọn 'cả hai cùng bấm được' — nối lại `quyen.xacNhanKho` là sai chỉ đạo",
  () => {
    const n = QH.duocXacNhanNhanDuHangCuaHoSo.length;
    return {
      duoc: n === 2,
      thucTe: String(n) + " tham số",
      mongDoi: "2 — thêm tham số thứ ba nghĩa là cờ quyền kho đã bị nối lại",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// MỤC MENU — ai thấy cái gì. Bộ kiểm chưa bao giờ canh `dieu-huong.ts` tới 18/09/2026.
// ════════════════════════════════════════════════════════════════════

const DH = nap(tepRa17);
const mucCuaAi = (q) => DH.MUC_DIEU_HUONG.filter((m) => m.duocThay(q)).map((m) => m.href);

kiem("Phong ban khac chi con MOT muc menu: /theo-doi", CHU_SEP_CHI_THEO_DOI, () => {
  const ds = mucCuaAi(aiDo({}));
  return {
    duoc: ds.length === 1 && ds[0] === "/theo-doi",
    thucTe: `menu=[${ds.join(" ")}]`,
    mongDoi: "dung mot muc /theo-doi",
  };
});

kiem("THU KHO VAN con muc /don-hang — man duy nhat co viec cua ho", CHU_SEP_CHI_THEO_DOI, () => {
  /* 🔴 CHIỀU NGHỊCH QUAN TRỌNG NHẤT của cả nhóm: nút *"Xác nhận nhận hàng"* nằm ở
     `/don-hang/{poId}`, và từ 30/08/2026 thủ kho không ghi phiếu nhận trong app này nữa — đó là
     việc DUY NHẤT của họ. Ai siết nốt mục này cho "nhất quán" là màn đó thành mồ côi với thủ kho
     (CLAUDE.md §3.4b). Bài này đỏ nghĩa là bạn vừa làm đúng việc đó. */
  const ds = mucCuaAi(aiDo({ chucNang: "thu_kho_cong_trinh", capTM: 1, capKho: 2 }));
  return {
    duoc: ds.includes("/don-hang") && ds.includes("/theo-doi") && !ds.includes("/de-nghi"),
    thucTe: `menu=[${ds.join(" ")}]`,
    mongDoi: "co /don-hang va /theo-doi · KHONG co /de-nghi (BLD 16/08/2026)",
  };
});

kiem("CHIEU NGHICH — nguoi lam thu mua VAN thay du muc chinh", CHU_SEP_CHI_THEO_DOI, () => {
  const ds = mucCuaAi(aiDo({ chucNang: "nhan_vien_thu_mua" }));
  const du = ["/tong-quan", "/viec-cua-toi", "/lich", "/de-nghi", "/don-hang", "/theo-doi"].every(
    (h) => ds.includes(h),
  );
  return { duoc: du, thucTe: `menu=[${ds.join(" ")}]`, mongDoi: "co du 6 muc chinh" };
});

kiem("Menu va duong dan PHAI NOI CUNG MOT CAU", CHU_SEP_CHI_THEO_DOI, () => {
  /* 🔴 Hai tầng phải khớp: thấy mục menu thì bấm vào phải đi được, và ẩn mục thì gõ thẳng địa chỉ
     cũng phải bị chặn. Lệch một bên là "thấy nút bấm vào bị đá ra" (18/09 đã dính với /don-hang:
     menu ẩn nhưng đường dẫn vẫn mở). */
  const ai = [
    ["ngoai phong", aiDo({})],
    ["thu kho", aiDo({ chucNang: "thu_kho_cong_trinh", capTM: 1, capKho: 2 })],
    ["nhan vien thu mua", aiDo({ chucNang: "nhan_vien_thu_mua" })],
  ];
  const lech = [];
  for (const [ten, q] of ai) {
    for (const m of DH.MUC_DIEU_HUONG) {
      const thayMuc = m.duocThay(q);
      const vaoDuoc = PQ.duocVaoDuongDan(m.href, q);
      /* Mục ẩn có chủ ý (`() => false`, như "Lập đơn mua hàng (PO)" tạm ngưng) thì không tính. */
      if (!thayMuc && !vaoDuoc) continue;
      if (thayMuc !== vaoDuoc && thayMuc) lech.push(`${ten}:${m.href}(thay nhung khong vao duoc)`);
    }
  }
  return {
    duoc: lech.length === 0,
    thucTe: lech.length === 0 ? "khop het" : lech.join(" · "),
    mongDoi: "khong muc nao HIEN ma lai bi chan duong dan",
  };
});

// ════════════════════════════════════════════════════════════════════
// HAI LUẬT NẰM TRONG HOOK — KIỂM BẰNG CẤU TRÚC MÃ NGUỒN, KHÔNG GỌI ĐƯỢC HÀM
//
// ⚠️ NÓI THẲNG GIỚI HẠN: hai bài dưới đây đọc MÃ NGUỒN chứ không gọi hàm như 370 bài còn lại —
// `ghiDoiChieuThuMua` nằm trong `useCallback` và `choDinhMoi` là prop của một component React,
// cả hai không nạp bằng Node được. Nên chúng yếu hơn, và KHÔNG được coi là bằng chứng hành vi.
//
// 📌 Nhưng vẫn hơn không có gì, và chúng không phải `grep` chuỗi trơn: bài thứ nhất đòi đúng
// QUAN HỆ *"trong nhánh gỡ dấu phải có lời gọi ghi nhật ký"*, bài thứ hai đòi ô trống dùng cờ
// KHÁC với hai ô trên. Muốn kiểm thật thì phải tách phần thuần của `ghiDoiChieuThuMua` ra
// `2-quy-trinh/`, lúc đó đổi hai bài này sang gọi hàm.
// ════════════════════════════════════════════════════════════════════

const doc = (p) => readFileSync(p, "utf8");

kiem(
  "Go dau doi chieu (khop = null) VAN phai ghi nhat ky don hang",
  'Sếp · 18/09/2026 — *"Nut khop so lieu nay dang chi cho tick chu ko cho bo tick"*',
  () => {
    /* 🔴 Dấu đối chiếu mang TÊN người đối chiếu. Gỡ im lặng thì sau này không ai biết phiếu từng
       được đánh dấu rồi bị gỡ — đúng loại mất dấu vết mà nhật ký đơn hàng sinh ra để tránh. */
    const src = doc("3-du-lieu/kho-du-lieu.tsx");
    const i = src.indexOf("if (khop === null) {");
    if (i < 0) {
      return { duoc: false, thucTe: "KHONG con nhanh `khop === null`", mongDoi: "nhanh go dau con ton tai" };
    }
    /* Cắt đúng thân nhánh: từ chỗ mở tới `return null;` đầu tiên sau đó. */
    const than = src.slice(i, src.indexOf("return null;", i));
    return {
      duoc: than.includes("ghiNhatKyDonHang"),
      thucTe: than.includes("ghiNhatKyDonHang") ? "co goi ghiNhatKyDonHang" : "KHONG goi ghiNhatKyDonHang",
      mongDoi: "nhanh go dau phai goi ghiNhatKyDonHang",
    };
  },
);

kiem(
  "O TRONG cua o chung tu dung co RIENG, khong dung chung `duocSua`",
  'Sếp · 18/09/2026 *"mo nut dinh kem cho nhan vien"* + *"van giu o truong bo phan"* (thay/xoa)',
  () => {
    /* 🔴 Nếu ai đổi dòng ô trống về `duocSua` thì nhân viên mất quyền đính vừa được mở — lặng lẽ,
       `npm run kiem-luat` vẫn xanh nếu không có bài này. Ngược lại, đổi hai ô TRÊN sang
       `choDinhMoi` là nhân viên thay/xoá được bản hợp đồng đã ký. */
    const src = doc("1-giao-dien/thanh-phan-nghiep-vu/o-chung-tu-bat-buoc.tsx");
    const soODaCo = (src.match(/khoa=\{khoa \|\| !duocSua\}/g) ?? []).length;
    const soOTrong = (src.match(/khoa=\{khoa \|\| !choDinhMoi\}/g) ?? []).length;
    return {
      duoc: soODaCo === 1 && soOTrong === 1,
      thucTe: `o da co dung duocSua: ${soODaCo} · o trong dung choDinhMoi: ${soOTrong}`,
      mongDoi: "dung 1 va 1 — hai o khac nhau dung hai co khac nhau",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// ĐỢT THANH TOÁN & SỐ TIỀN CÒN LẠI — Sếp 18/09/2026, yêu cầu ③+④ của màn Công nợ
//
// 🔴 ĐÂY LÀ LUẬT VỀ TIỀN, nên mỗi chiều đều phải có bài canh. Sai ở đây không ai thấy ngay: bảng
// vẫn đẹp, chỉ là con số "Còn lại" nói sai, và người ta đi trả tiền theo con số đó.
// ════════════════════════════════════════════════════════════════════

const CHU_SEP_DOT_CHI =
  'Sếp · 18/09/2026 — *"Số tiền còn lại = Tổng công nợ − Tổng số tiền đã thanh toán các đợt"* + ' +
  '*"Mỗi PO sẽ được tạo thêm dòng để nhập số tiền thanh toán từng đợt"*';

/* Tuoi no da duoc dung san o dau tep (tepRa5) — dung lai, dung dung bundle thu hai. */
const TN2 = nap(tepRa5);

const dotChi = (poId, soTien, ngayChi = "2026-09-01", them = {}) => ({
  id: `dtt-${poId}-${soTien}`,
  poId,
  ngayChi,
  soTien,
  nguoiGhiUid: "u-kt",
  nguoiGhiTen: "Kế toán thử",
  thoiDiemGhi: "2026-09-01T08:00:00.000Z",
  ...them,
});

kiem("Cong dung tong da tra cua MOT don, bo qua dot cua don khac", CHU_SEP_DOT_CHI, () => {
  const ds = [dotChi("po-1", 1_000_000), dotChi("po-2", 5_000_000), dotChi("po-1", 2_500_000)];
  const r = TN2.daTraCuaPO("po-1", ds);
  return { duoc: r === 3_500_000, thucTe: `${r}`, mongDoi: "3500000 — chi cong dot cua po-1" };
});

kiem("CHIEU NGHICH — ban ghi hong (soTien khong phai so) KHONG lam ca cot thanh NaN", CHU_SEP_DOT_CHI, () => {
  /* 🔴 Một bản ghi hỏng (dữ liệu cũ, hoặc ai đó sửa tay trên kho chung) mà lọt vào phép cộng thì
     CẢ cột "Còn lại" của đơn đó hiện ra chữ "NaN đ" — người đọc không biết đơn đó đã trả bao nhiêu.
     Đừng bỏ `|| 0` trong `daTraCuaPO` cho gọn. */
  const ds = [dotChi("po-1", 1_000_000), { ...dotChi("po-1", 0), soTien: "hai trieu" }];
  const r = TN2.daTraCuaPO("po-1", ds);
  return {
    duoc: Number.isFinite(r) && r === 1_000_000,
    thucTe: `${r}`,
    mongDoi: "1000000 — ban ghi hong bi coi la 0, KHONG lan ra NaN",
  };
});

kiem("Con lai = tong - da tra, va KHONG BAO GIO am", CHU_SEP_DOT_CHI, () => {
  /* 📌 Trả dư (chuyển nhầm, hoặc trả gộp nhiều đơn vào một lệnh) có thật. Nhưng hiện số âm ở cột
     "Còn lại" thì người đọc hiểu thành "nhà cung cấp nợ lại mình" — sai hẳn nghĩa. */
  const binhThuong = TN2.conLaiCuaPO(10_000_000, 4_000_000);
  const traDu = TN2.conLaiCuaPO(10_000_000, 12_000_000);
  return {
    duoc: binhThuong === 6_000_000 && traDu === 0,
    thucTe: `binh thuong=${binhThuong} · tra du=${traDu}`,
    mongDoi: "6000000 va 0 (kep o 0, khong am)",
  };
});

kiem(
  "Ai ghi duoc tien da tra: KE TOAN / TBP3 / QUAN TRI / NHAN VIEN THU MUA cap ≥2",
  'Sếp · 19/09/2026 — *"Mở quyền nhập đơn hàng cho tài khoản nhân viên / Vì đa phần công việc ' +
    'này sẽ do nhân viên làm"* (đè chỉ đạo 18/09/2026 "chỉ Kế toán + Trưởng phòng")',
  () => {
  /* 🔴 CHIỀU NGHỊCH NẰM NGAY TRONG BÀI: không chỉ kiểm "ai ghi được", mà kiểm CẢ thủ kho, QLDA,
     phòng thi công và nhân viên thu mua CẤP 1 đều KHÔNG ghi được. Chỉ kiểm chiều thuận thì ai
     sửa cờ thành `true` vô điều kiện vẫn xanh, và lúc đó mọi tài khoản đều ghi được tiền đã chi. */
  const ai = (them) =>
    PQ.tinhQuyen({
      uid: "u-t",
      tenHienThi: "Nguoi thu",
      chucDanh: "",
      phongBan: "",
      vaiTro: "staff",
      chucNang: "nhan_vien_thu_mua",
      capTM: 2,
      ...them,
    });
  /* 🔴 NHÂN VIÊN THU MUA CHUYỂN TỪ NHÓM "KHÔNG" SANG NHÓM "ĐƯỢC" — Sếp 19/09/2026.
     Nguyên văn: *"Mở quyền nhập đơn hàng cho tài khoản nhân viên / Vì đa phần công việc này sẽ
     do nhân viên làm"*, hỏi lại đúng câu thì Sếp chọn **Có**. Đây là đổi ý đè lên chỉ đạo
     18/09/2026 (*"chỉ Kế toán và Trưởng phòng"*), không phải sửa bài kiểm cho vừa mã nguồn.

     ⚠️ CHUYỂN CHỖ, TUYỆT ĐỐI KHÔNG XOÁ DÒNG. `ai({})` mặc định chính là nhân viên thu mua cấp 2
     — xoá nó đi là bài kiểm mất luôn chiều nghịch cho đúng vai trò đang được nới quyền. */
  const duoc = [
    ["ke toan", ai({ chucNang: "ke_toan" })],
    ["truong bo phan cap 3", ai({ chucNang: "truong_bo_phan_thu_mua", capTM: 3 })],
    ["quan tri", ai({ vaiTro: "admin", capTM: 4 })],
    ["nhan vien thu mua cap 2", ai({})],
  ];
  const khong = [
    /* 🔴 CHIỀU NGHỊCH CỦA CHÍNH LUẬT MỚI: nhân viên thu mua cấp 1 chỉ được XEM, không được ghi
       tiền. Bỏ ca này là ai viết `|| laNhanVienTM` trơn cũng xanh, tức nới rộng hơn Sếp duyệt. */
    ["nhan vien thu mua cap 1", ai({ capTM: 1 })],
    ["thu kho", ai({ chucNang: "thu_kho_cong_trinh", capTM: 1, capKho: 2 })],
    ["QLDA", ai({ chucNang: "qlda" })],
    ["phong thi cong", ai({ chucNang: "phong_thi_cong", capTM: 1 })],
  ];
  const saiDuoc = duoc.filter(([, q]) => q.ghiThanhToan !== true).map(([t]) => t);
  const saiKhong = khong.filter(([, q]) => q.ghiThanhToan !== false).map(([t]) => t);
  return {
    duoc: saiDuoc.length === 0 && saiKhong.length === 0,
    thucTe:
      saiDuoc.length === 0 && saiKhong.length === 0
        ? "dung het"
        : `thieu quyen: [${saiDuoc.join(" ")}] · thua quyen: [${saiKhong.join(" ")}]`,
    mongDoi:
      "ke toan + TBP cap ≥3 + quan tri + NHAN VIEN THU MUA cap ≥2 CO · " +
      "nhan vien cap 1, thu kho, QLDA, thi cong KHONG",
  };
  },
);

kiem("Tang ghi CHAN dot thanh toan khong hop le", CHU_SEP_DOT_CHI, () => {
  /* 🔴 Bốn ca này đều làm hỏng số liệu tiền theo cách KHÔNG nhìn ra trên bảng:
     · 0 đồng → một dòng vô nghĩa, tổng không đổi nhưng bảng có thêm đợt;
     · số âm → lén TĂNG dư nợ;
     · chuỗi rác → `NaN`, cả cột "Còn lại" của đơn đó hiện "NaN đ";
     · thiếu ngày → không đối chiếu được với sao kê ngân hàng. */
  const KD = nap(join(thuMuc, "kho-du-lieu.cjs"));
  const ca = [
    ["so 0", { poId: "po-1", ngayChi: "2026-09-01", soTien: 0 }],
    ["so am", { poId: "po-1", ngayChi: "2026-09-01", soTien: -500 }],
    ["chuoi rac", { poId: "po-1", ngayChi: "2026-09-01", soTien: Number("hai trieu") }],
    ["thieu ngay", { poId: "po-1", soTien: 1000 }],
    ["ngay sai khuon", { poId: "po-1", ngayChi: "01/09/2026", soTien: 1000 }],
    ["khong gan don", { ngayChi: "2026-09-01", soTien: 1000 }],
  ];
  const lot = ca.filter(([, d]) => KD.vuongMacDotThanhToan(d) === null).map(([t]) => t);
  const hopLe = KD.vuongMacDotThanhToan({ poId: "po-1", ngayChi: "2026-09-01", soTien: 1_000_000 });
  return {
    duoc: lot.length === 0 && hopLe === null,
    thucTe: lot.length === 0 ? `chan het · ca hop le=${hopLe ?? "cho qua"}` : `LOT: ${lot.join(" · ")}`,
    mongDoi: "chan ca 6 ca hong, va CHO QUA dot hop le",
  };
});

/* ---------- Kết quả ---------- */
rmSync(thuMuc, { recursive: true, force: true });

// ════════════════════════════════════════════════════════════════════
// GHI TỪNG PHẦN — đợt 2 lộ trình chống mất dữ liệu, Sếp chốt 22/09/2026
//
// Luật ở đây canh đúng MỘT điều: app chỉ được gửi lên thứ mình vừa sửa. Mỗi luật
// dưới đây ứng với một cách mà việc đó có thể hỏng — và cách nào cũng đã từng làm
// mất đơn thật ở bản cũ.
// ════════════════════════════════════════════════════════════════════

kiem(
  "Bản ghi KHÔNG đổi thì KHÔNG được gửi lên — đây là toàn bộ giá trị của đợt 2",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    const x = { id: "X", soLuong: 10 };
    const anh = GTP.chupAnh("donHang", [x]);
    const r = GTP.tinhThayDoi("donHang", anh, [x]);
    return {
      duoc: r.length === 0,
      thucTe: `${r.length} thay đổi`,
      mongDoi: "0 — y hệt bản trên máy chủ thì khỏi gửi, nhờ vậy không đè lên việc người khác",
    };
  },
);

kiem(
  "Sửa đơn X thì CHỈ gửi đơn X, không đụng đơn Y",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    const anh = GTP.chupAnh("donHang", [{ id: "X", soLuong: 10 }, { id: "Y", ncc: "A" }]);
    const r = GTP.tinhThayDoi("donHang", anh, [{ id: "X", soLuong: 50 }, { id: "Y", ncc: "A" }]);
    const chiX = r.length === 1 && r[0].duongDan === "donHang.X";
    return {
      duoc: chiX,
      thucTe: r.map((t) => t.duongDan).join(", ") || "(rỗng)",
      mongDoi: "chỉ donHang.X — đơn Y không đụng thì không gửi, nên không đè bản người khác vừa sửa",
    };
  },
);

kiem(
  "Bản ghi bị xoá phải báo riêng bằng null, không được lặng lẽ bỏ qua",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    const anh = GTP.chupAnh("donHang", [{ id: "X" }, { id: "Y" }]);
    const r = GTP.tinhThayDoi("donHang", anh, [{ id: "X" }]);
    const dung = r.length === 1 && r[0].duongDan === "donHang.Y" && r[0].giaTri === null;
    return {
      duoc: dung,
      thucTe: JSON.stringify(r),
      mongDoi: 'donHang.Y = null — bỏ qua thì người dùng xoá xong đơn vẫn nằm trên máy chủ và hiện về lần sau',
    };
  },
);

kiem(
  "CHƯA nhận được ảnh chụp nào thì KHÔNG ghi gì — không được coi là 'ghi tất'",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    const r = GTP.tinhThayDoi("donHang", null, [{ id: "X", soLuong: 1 }]);
    return {
      duoc: r.length === 0,
      thucTe: `${r.length} thay đổi`,
      mongDoi: "0 — chưa biết máy chủ đang có gì mà ghi đè tất là đúng cái sai đang muốn sửa",
    };
  },
);

kiem(
  "Đọc được CẢ dữ liệu cũ (mảng) lẫn dữ liệu mới (map)",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    const tuMang = GTP.tuMap([{ id: "X" }, { id: "Y" }]);
    const tuMapMoi = GTP.tuMap({ X: { id: "X" }, Y: { id: "Y" } });
    return {
      duoc: tuMang.length === 2 && tuMapMoi.length === 2,
      thucTe: `mảng→${tuMang.length}, map→${tuMapMoi.length}`,
      mongDoi: "2 và 2 — thiếu vế nào cũng khiến một nửa số máy đọc ra kho rỗng trong lúc chuyển đổi",
    };
  },
);

kiem(
  "Bảng giá khoá theo poId, KHÔNG phải id — sai khoá là mọi bảng giá đè lên nhau",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    const m = GTP.sangMap("giaDonHang", [{ poId: "PO1", tien: 100 }, { poId: "PO2", tien: 200 }]);
    return {
      duoc: Object.keys(m).length === 2 && !!m.PO1 && !!m.PO2,
      thucTe: Object.keys(m).join(", ") || "(rỗng)",
      mongDoi: "PO1, PO2 — bảng giá không có trường `id`, khoá nhầm là cả hai dồn vào một ô rồi mất một",
    };
  },
);

kiem(
  "Bản ghi không có mã thì bỏ, không dựng bản ghi ma",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    const m = GTP.sangMap("donHang", [{ id: "X" }, { soLuong: 5 }, { id: "" }]);
    return {
      duoc: Object.keys(m).length === 1 && !!m.X,
      thucTe: `${Object.keys(m).length} bản ghi`,
      mongDoi: "1 — không mã thì không ghi riêng được, giữ lại là bày ra bản ghi không ai sửa được",
    };
  },
);

kiem(
  "Thứ tự trường khác nhau KHÔNG bị coi là đã đổi",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    const anh = GTP.chupAnh("donHang", [{ id: "X", a: 1, b: 2 }]);
    const r = GTP.tinhThayDoi("donHang", anh, [{ b: 2, id: "X", a: 1 }]);
    return {
      duoc: r.length === 0,
      thucTe: `${r.length} thay đổi`,
      mongDoi: "0 — so bằng chuỗi không ổn định thì mỗi lần render lại tưởng có đổi, ghi loạn cả kho",
    };
  },
);

// ------------------------------------------------------------
// QUYẾT ĐỊNH GHI — phần dễ sai nhất của đợt 2. Cố ý tách khỏi `kho-chung-firestore.ts`
// (file đó phải mở Firebase mới chạy) để chỗ này gọi thật được.
// ------------------------------------------------------------

/** Trạng thái "máy chủ đã ở dạng map, biết rõ đang có gì" — nền để dựng từng ca kiểm. */
function ttMap(sach) {
  return GTP.chupTrangThai(GTP.sangMapCaKho(sach));
}

kiem(
  "Lưu mà KHÔNG đổi gì thì không ghi một byte nào",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    const sach = { donHang: [{ id: "X", soLuong: 10 }], deNghi: [{ id: "D1" }] };
    const r = GTP.quyetDinhGhi(ttMap(sach), sach);
    return {
      duoc: r.kieu === "bo-qua",
      thucTe: r.kieu,
      mongDoi:
        "bo-qua — mở hồ sơ ra xem rồi đóng lại mà vẫn đẩy cả kho lên là cách đơn của Sếp biến mất 15/09",
    };
  },
);

kiem(
  "Sửa một đơn thì chỉ gửi ĐÚNG đơn đó, không đụng đơn bên cạnh",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    const cu = { donHang: [{ id: "X", soLuong: 10 }, { id: "Y", soLuong: 20 }] };
    const moi = { donHang: [{ id: "X", soLuong: 50 }, { id: "Y", soLuong: 20 }] };
    const r = GTP.quyetDinhGhi(ttMap(cu), moi);
    const dung =
      r.kieu === "tung-phan" &&
      r.thayDoi.length === 1 &&
      r.thayDoi[0].duongDan === "donHang.X";
    return {
      duoc: dung,
      thucTe:
        r.kieu === "tung-phan" ? r.thayDoi.map((t) => t.duongDan).join(", ") || "(rỗng)" : r.kieu,
      mongDoi: "chỉ donHang.X — gửi kèm Y là đè lên bản Y mà người khác vừa sửa",
    };
  },
);

kiem(
  "Máy chủ CÒN DẠNG MẢNG thì phải ghi đầy đủ để chuyển dạng, không ghi từng phần",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    /* Dữ liệu thô còn là mảng — đúng như production hôm nay, trước khi bật công tắc. */
    const tt = GTP.chupTrangThai({ donHang: [{ id: "X", soLuong: 10 }] });
    const r = GTP.quyetDinhGhi(tt, { donHang: [{ id: "X", soLuong: 50 }] });
    return {
      duoc: r.kieu === "day-du" && r.ly === "con-dang-mang",
      thucTe: `${r.kieu}${r.ly ? " / " + r.ly : ""}`,
      mongDoi:
        "day-du / con-dang-mang — Firestore không hiểu đường dẫn `donHang.X` trên một trường đang là MẢNG",
    };
  },
);

kiem(
  "Lần chuyển dạng ghi lên MAP chứ không phải mảng",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    const tt = GTP.chupTrangThai({ donHang: [{ id: "X" }] });
    const r = GTP.quyetDinhGhi(tt, { donHang: [{ id: "X" }, { id: "Y" }] });
    const dh = r.kieu === "day-du" ? r.ban.donHang : null;
    const dung = dh !== null && !Array.isArray(dh) && Boolean(dh.X) && Boolean(dh.Y);
    return {
      duoc: dung,
      thucTe: Array.isArray(dh) ? "vẫn là mảng" : JSON.stringify(Object.keys(dh ?? {})),
      mongDoi:
        'map khoá ["X","Y"] — ghi lại dạng mảng thì lần sau vẫn không ghi riêng được, chuyển dạng thành vô nghĩa',
    };
  },
);

kiem(
  "Máy chủ CHƯA CÓ tài liệu thì phải TẠO chứ không bỏ qua",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    const r = GTP.quyetDinhGhi(GTP.chupTrangThai(undefined), { donHang: [{ id: "X" }] });
    return {
      duoc: r.kieu === "day-du" && r.ly === "chua-co-tai-lieu",
      thucTe: `${r.kieu}${r.ly ? " / " + r.ly : ""}`,
      mongDoi:
        "day-du / chua-co-tai-lieu — `updateDoc` không tạo được tài liệu, gọi nó ở đây là ném lỗi và mất trắng lần lưu",
    };
  },
);

kiem(
  "CHƯA nghe được lần nào thì ghi đầy đủ, KHÔNG suy đoán",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    const tt = { daNhanAnh: false, anhTheoKhoi: null, anhNguyenKhoi: {}, conDangMang: false };
    const r = GTP.quyetDinhGhi(tt, { donHang: [{ id: "X" }] });
    return {
      duoc: r.kieu === "day-du" && r.ly === "chua-nhan-anh",
      thucTe: `${r.kieu}${r.ly ? " / " + r.ly : ""}`,
      mongDoi: "day-du / chua-nhan-anh — chưa biết máy chủ có gì thì không được tính 'đã đổi'",
    };
  },
);

kiem(
  "Xoá một đơn phải báo riêng để nơi gọi dịch sang deleteField()",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    const cu = { donHang: [{ id: "X" }, { id: "Y" }] };
    const r = GTP.quyetDinhGhi(ttMap(cu), { donHang: [{ id: "X" }] });
    const xoa = r.kieu === "tung-phan" ? r.thayDoi.filter((t) => t.giaTri === null) : [];
    return {
      duoc: xoa.length === 1 && xoa[0].duongDan === "donHang.Y",
      thucTe: xoa.map((t) => t.duongDan).join(", ") || "(không có)",
      mongDoi:
        "donHang.Y = null — bỏ qua thì người dùng xoá đơn xong nó vẫn nằm trên máy chủ và hiện về lần sau",
    };
  },
);

kiem(
  "Cấu hình đổi thì gửi, không đổi thì thôi",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    const cu = { donHang: [], cauHinh: { nguong: 5 } };
    const yNguyen = GTP.quyetDinhGhi(ttMap(cu), { donHang: [], cauHinh: { nguong: 5 } });
    const daDoi = GTP.quyetDinhGhi(ttMap(cu), { donHang: [], cauHinh: { nguong: 9 } });
    const dung =
      yNguyen.kieu === "bo-qua" &&
      daDoi.kieu === "tung-phan" &&
      daDoi.thayDoi.length === 1 &&
      daDoi.thayDoi[0].duongDan === "cauHinh";
    return {
      duoc: dung,
      thucTe: `y nguyên → ${yNguyen.kieu}; đã đổi → ${daDoi.kieu}`,
      mongDoi:
        "bo-qua / tung-phan(cauHinh) — cấu hình từng bị lột sạch vì quên khai một khoá, đừng để nó lọt lần nữa",
    };
  },
);

kiem(
  "chupTrangThai phải đọc DỮ LIỆU THÔ, không đọc bản đã chuẩn hoá",
  "đợt 2 chống mất dữ liệu · 22/09/2026",
  () => {
    const dangMap = GTP.chupTrangThai({ donHang: { X: { id: "X" } } });
    const dangMang = GTP.chupTrangThai({ donHang: [{ id: "X" }] });
    return {
      duoc: dangMap.conDangMang === false && dangMang.conDangMang === true,
      thucTe: `map → ${dangMap.conDangMang}; mảng → ${dangMang.conDangMang}`,
      mongDoi:
        "false / true — hỏi bản đã chuẩn hoá thì lúc nào cũng thấy mảng, app sẽ ghi đè cả kho mãi mãi mà không ai biết",
    };
  },
);

// ------------------------------------------------------------
// NHỊP 3a — đường ghi phía máy chủ. Sự cố suýt xảy ra 23/09/2026.
// ------------------------------------------------------------

kiem(
  "Kho đang dạng MAP thì route máy chủ phải ghi lại dạng MAP",
  "nhịp 3a · 23/09/2026",
  () => {
    const trenMayChu = { "D1": { id: "D1" }, "D2": { id: "D2" } };
    const r = GTP.ghiTheoDangHienCo("deNghi", trenMayChu, [{ id: "D1" }, { id: "D2" }, { id: "D3" }]);
    const dung = !Array.isArray(r) && Object.keys(r).sort().join(",") === "D1,D2,D3";
    return {
      duoc: dung,
      thucTe: Array.isArray(r) ? "ghi ra MẢNG" : "map " + JSON.stringify(Object.keys(r).sort()),
      mongDoi:
        "map D1,D2,D3 — ghi mảng đè lên kho đang là map thì kho quay về dạng cũ, đợt 2 thành vô nghĩa",
    };
  },
);

kiem(
  "Kho còn dạng MẢNG thì route giữ nguyên MẢNG, không tự chuyển dạng",
  "nhịp 3a · 23/09/2026",
  () => {
    const r = GTP.ghiTheoDangHienCo("deNghi", [{ id: "D1" }], [{ id: "D1" }, { id: "D2" }]);
    return {
      duoc: Array.isArray(r) && r.length === 2,
      thucTe: Array.isArray(r) ? "mảng " + r.length + " bản ghi" : "map",
      mongDoi:
        "mảng 2 bản ghi — route không được tự chuyển dạng thay người dùng, đó là việc của đợt 2 lúc bấm Lưu",
    };
  },
);

kiem(
  "Khối CHƯA TỒN TẠI thì ghi dạng mảng (giữ hành vi cũ)",
  "nhịp 3a · 23/09/2026",
  () => {
    const r = GTP.ghiTheoDangHienCo("donHang", undefined, [{ id: "X" }]);
    return {
      duoc: Array.isArray(r),
      thucTe: Array.isArray(r) ? "mảng" : "map",
      mongDoi: "mảng — kho mới tinh chưa có gì thì đi đường cũ, đừng tự ý đổi luật",
    };
  },
);

kiem(
  "Route đọc kho dạng MAP phải ra ĐỦ bản ghi, không ra rỗng",
  "nhịp 3a · 23/09/2026",
  () => {
    /* Đúng ca suýt xảy ra 23/09: `Array.isArray(x) ? x : []` trả rỗng rồi ghi đè cả khối. */
    const trenMayChu = { D1: { id: "D1" }, D2: { id: "D2" }, D3: { id: "D3" } };
    const cachCu = Array.isArray(trenMayChu) ? trenMayChu : [];
    const cachMoi = GTP.tuMap(trenMayChu);
    return {
      duoc: cachCu.length === 0 && cachMoi.length === 3,
      thucTe: `cách cũ ${cachCu.length} bản ghi, cách mới ${cachMoi.length}`,
      mongDoi:
        "cũ 0 / mới 3 — chính là chỗ 76 đề nghị suýt bị ghi đè bằng đúng 1 bản ghi mới ngày 23/09",
    };
  },
);

kiem(
  "Xét TỪNG khối riêng — hai khối có thể đang ở hai dạng khác nhau",
  "nhịp 3a · 23/09/2026",
  () => {
    /* Trong lúc chuyển đổi: deNghi đã sang map, donHang còn mảng. Gộp lại mà xét là ghi sai một bên. */
    const rDeNghi = GTP.ghiTheoDangHienCo("deNghi", { D1: { id: "D1" } }, [{ id: "D1" }]);
    const rDonHang = GTP.ghiTheoDangHienCo("donHang", [{ id: "X" }], [{ id: "X" }]);
    return {
      duoc: !Array.isArray(rDeNghi) && Array.isArray(rDonHang),
      thucTe: `deNghi → ${Array.isArray(rDeNghi) ? "mảng" : "map"}; donHang → ${Array.isArray(rDonHang) ? "mảng" : "map"}`,
      mongDoi: "deNghi map / donHang mảng — mỗi khối theo dạng của chính nó",
    };
  },
);

kiem(
  "Chọn bản gốc KHÔNG được dựa vào thứ tự — phải theo ngày, mã, id",
  "nhịp 3a · CodeRabbit PR #35 · 23/09/2026",
  () => {
    /* Cùng một mã đề xuất, 3 đề nghị. Bản gốc là bản ngày sớm nhất, dù nằm ở đâu trong danh sách. */
    const ds = [
      { id: "z9", code: "PR-003", ngayDeNghi: "2026-09-20" },
      { id: "a1", code: "PR-001", ngayDeNghi: "2026-09-18" },
      { id: "m5", code: "PR-002", ngayDeNghi: "2026-09-19" },
    ];
    const xuoi = GTP.chonBanSomNhat(ds);
    const nguoc = GTP.chonBanSomNhat([...ds].reverse());
    return {
      duoc: xuoi?.id === "a1" && nguoc?.id === "a1",
      thucTe: `xuôi → ${xuoi?.id}; ngược → ${nguoc?.id}`,
      mongDoi:
        "a1 ở cả hai chiều — `.find` cũ lấy phần tử đầu, đổi mảng sang map là đổi luôn bản được chọn (production 23/09 có mã 7 đề nghị trùng)",
    };
  },
);

kiem(
  "Cùng ngày cùng mã thì vẫn ra một kết quả xác định",
  "nhịp 3a · CodeRabbit PR #35 · 23/09/2026",
  () => {
    const ds = [
      { id: "b", code: "PR-001", ngayDeNghi: "2026-09-18" },
      { id: "a", code: "PR-001", ngayDeNghi: "2026-09-18" },
    ];
    const x = GTP.chonBanSomNhat(ds), y = GTP.chonBanSomNhat([...ds].reverse());
    return {
      duoc: x?.id === "a" && y?.id === "a",
      thucTe: `${x?.id} / ${y?.id}`,
      mongDoi: "a ở cả hai chiều — thiếu tầng id thì hai lần gọi ra hai kết quả, lỗi không tài nào truy được",
    };
  },
);

kiem(
  "Bản NHÂN BẢN không được chọn thay bản gốc — ca thật của mã 000000098",
  "nhịp 3a · dữ liệu production 23/09/2026",
  () => {
    /* Dữ liệu thật: mã đề xuất 000000098 có 7 đề nghị — 1 bản gốc và 6 bản người dùng tự
       nhân bản, tất cả cùng ngày 17/09. Route phải vá vào BẢN GỐC, không vá vào bản copy. */
    const ds = [
      { id: "d4", code: "30/2025/HDXD/UNICE-HPCS-PR-001 (copy 3)", ngayDeNghi: "2026-09-17" },
      { id: "d1", code: "30/2025/HDXD/UNICE-HPCS-PR-001",          ngayDeNghi: "2026-09-17" },
      { id: "d2", code: "30/2025/HDXD/UNICE-HPCS-PR-001 (copy)",   ngayDeNghi: "2026-09-17" },
      { id: "d6", code: "30/2025/HDXD/UNICE-HPCS-PR-001 (copy 5)", ngayDeNghi: "2026-09-17" },
    ];
    const chon = GTP.chonBanSomNhat(ds);
    return {
      duoc: chon?.id === "d1" && !String(chon?.code).includes("copy"),
      thucTe: String(chon?.code),
      mongDoi:
        "bản gốc (không có chữ copy) — `.find` cũ lấy phần tử đầu danh sách, ở đây là 'copy 3', tức vá nhầm hồ sơ rồi trả mã sai cho App Đề xuất",
    };
  },
);

kiem(
  "giuThongBaoGanNhat giữ đúng tin MỚI NHẤT, không phải tin đứng đầu mảng",
  "vá 23/09/2026 · đo thật trên production sau lần test đầu",
  () => {
    /* 🔴 DỰNG ĐÚNG HÌNH DẠNG THẬT: kho sang map nên mảng về theo thứ tự KHOÁ. Ba mươi tin CŨ
       có mã bắt đầu bằng "tb-1…" nên đứng TRƯỚC, còn tin MỚI nhất mã "tb-vm-223" đứng CUỐI —
       y như production 23/09. Cắt theo vị trí là mất đúng tin mới.

       ⚠️ Đặt tin mới ở đầu mảng thì cả hai cách đều giữ được nó, và luật mất răng. Bản đầu của
       luật này mắc đúng lỗi đó: phá hàm production mà luật vẫn xanh. */
    const cu = Array.from({ length: 30 }, (_, i) => ({
      id: "tb-1" + String(i).padStart(2, "0"),
      thoiDiem: "2026-09-19T06:55:" + String(i).padStart(2, "0"),
    }));
    const moiNhat = { id: "tb-vm-223", thoiDiem: "2026-09-21T02:31:17" };

    const theoViTri = [...cu, moiNhat].slice(0, 30).map((x) => x.id);
    const ra = TB.giuThongBaoGanNhat([...cu, moiNhat]);
    const con = new Set(ra.map((x) => x.id));

    return {
      duoc: ra.length === 30 && con.has("tb-vm-223") && !theoViTri.includes("tb-vm-223"),
      thucTe: `giữ ${ra.length} tin; có tb-vm-223: ${con.has("tb-vm-223")} (cắt theo vị trí thì: ${theoViTri.includes("tb-vm-223")})`,
      mongDoi:
        "giữ 30 tin VÀ phải có tb-vm-223 — đúng tin đã mất thật trên production khi còn cắt theo vị trí",
    };
  },
);

kiem(
  "Tin thiếu thoiDiem bị xếp cuối chứ KHÔNG bị loại",
  "vá 23/09/2026",
  () => {
    const ra = TB.giuThongBaoGanNhat([
      { id: "khong-gio" },
      { id: "moi", thoiDiem: "2026-09-21T00:00:00" },
    ]);
    return {
      duoc: ra.length === 2 && ra[0].id === "moi" && ra[1].id === "khong-gio",
      thucTe: ra.map((x) => x.id).join(", "),
      mongDoi:
        "moi, khong-gio — mất tin vì thiếu một trường là tệ hơn hiển thị nó sai chỗ; dữ liệu cũ không ai bảo đảm được",
    };
  },
);

kiem(
  "Số tin giữ lại đúng bằng SO_THONG_BAO_GIU, không viết cứng 30 ở nơi khác",
  "vá 23/09/2026",
  () => {
    const n = TB.SO_THONG_BAO_GIU;
    const ra = TB.giuThongBaoGanNhat(
      Array.from({ length: n + 15 }, (_, i) => ({
        id: "t" + i,
        thoiDiem: "2026-09-20T00:00:" + String(i).padStart(2, "0"),
      })),
    );
    return {
      duoc: typeof n === "number" && ra.length === n,
      thucTe: `SO_THONG_BAO_GIU = ${n}, giữ được ${ra.length}`,
      mongDoi: "hai số bằng nhau — sáu đường thêm thông báo đều gọi chung hàm này, đừng để lệch",
    };
  },
);

// ------------------------------------------------------------
// NHỊP 3b — cấp mã ở máy chủ (23/09/2026)
// ------------------------------------------------------------

kiem(
  "Mã đang GIỮ CHỖ phải được tính vào, không thì hai người cách vài giây vẫn trùng",
  "nhịp 3b · 23/09/2026",
  () => {
    const trongKho = ["DMH260018"];
    const giuCho = [{ ma: "DMH260019", luc: new Date().toISOString() }];
    const coGiuCho = CM.maTiepTheoTrenMayChu("don-hang", "26", trongKho, giuCho);
    const khongGiuCho = CM.maTiepTheoTrenMayChu("don-hang", "26", trongKho, []);
    return {
      duoc: coGiuCho === "DMH260020" && khongGiuCho === "DMH260019",
      thucTe: `có giữ chỗ → ${coGiuCho}; bỏ giữ chỗ → ${khongGiuCho}`,
      mongDoi:
        "DMH260020 / DMH260019 — người đầu cấp xong chưa kịp ghi chứng từ, người sau nhìn vào kho không thấy gì; sổ giữ chỗ sinh ra đúng để chặn ca đó",
    };
  },
);

kiem(
  "Giữ chỗ hết hạn thì TRẢ SỐ VỀ, không treo vĩnh viễn",
  "nhịp 3b · 23/09/2026",
  () => {
    const bayGio = Date.now();
    const cu = [{ ma: "DMH260019", luc: new Date(bayGio - CM.HAN_GIU_CHO_MS - 1000).toISOString() }];
    const moi = [{ ma: "DMH260019", luc: new Date(bayGio - 1000).toISOString() }];
    const conHan = CM.locGiuChoConHieuLuc(moi, [], bayGio);
    const hetHan = CM.locGiuChoConHieuLuc(cu, [], bayGio);
    return {
      duoc: conHan.length === 1 && hetHan.length === 0,
      thucTe: `còn hạn giữ ${conHan.length}; hết hạn giữ ${hetHan.length}`,
      mongDoi:
        "1 / 0 — giữ vĩnh viễn thì mỗi lần người dùng bỏ dở là dãy số nhảy cóc một nấc, kế toán sẽ hỏi",
    };
  },
);

kiem(
  "Mã đã thành chứng từ thật thì thôi giữ chỗ — sổ tự dọn, không phình",
  "nhịp 3b · 23/09/2026",
  () => {
    const giuCho = [{ ma: "DMH260019", luc: new Date().toISOString() }];
    const conLai = CM.locGiuChoConHieuLuc(giuCho, ["DMH260018", "DMH260019"]);
    return {
      duoc: conLai.length === 0,
      thucTe: `${conLai.length} mục còn giữ`,
      mongDoi: "0 — giữ chỗ xong việc; không dọn thì sổ phình mãi và mỗi lần cấp lại đọc thêm",
    };
  },
);

kiem(
  "So mã KHÔNG phân biệt hoa thường — mã cũ nhập tay có thể là 'nc0001'",
  "nhịp 3b · 23/09/2026",
  () => {
    const conLai = CM.locGiuChoConHieuLuc([{ ma: "NC0007", luc: new Date().toISOString() }], ["nc0007"]);
    return {
      duoc: conLai.length === 0,
      thucTe: `${conLai.length} mục còn giữ`,
      mongDoi:
        "0 — hai nơi so khác nhau thì một bên tưởng đã dùng, bên kia tưởng còn trống, rồi cấp trùng",
    };
  },
);

kiem(
  "Khoá sổ tách theo đúng phạm vi đánh số, và chịu được dấu '/' trong mã dự án",
  "nhịp 3b · 23/09/2026",
  () => {
    const a = CM.khoaSoCapPhat("de-nghi", "30/2025/HĐXD/UNICE-HPCS");
    const b = CM.khoaSoCapPhat("de-nghi", "43-2025-HĐXD-HPCS");
    const nam26 = CM.khoaSoCapPhat("don-hang", "26");
    const nam27 = CM.khoaSoCapPhat("don-hang", "27");
    return {
      duoc: !a.includes("/") && a !== b && nam26 !== nam27,
      thucTe: `${a} | ${b} | ${nam26} | ${nam27}`,
      mongDoi:
        "không còn '/' (Firestore cấm trong mã tài liệu) và hai dự án/hai năm ra hai khoá khác nhau",
    };
  },
);

kiem(
  "Loại mã lạ bị chặn — route không được nhận dữ liệu tuỳ tiện",
  "nhịp 3b · 23/09/2026",
  () => {
    const ok = CM.laLoaiMa("don-hang") && CM.laLoaiMa("de-nghi") && CM.laLoaiMa("nha-cung-cap");
    const chan = !CM.laLoaiMa("xoa-het") && !CM.laLoaiMa("") && !CM.laLoaiMa(null);
    return {
      duoc: ok && chan,
      thucTe: `ba loại thật: ${ok}; chặn loại lạ: ${chan}`,
      mongDoi: "true / true — thiếu chặn là mở cửa cho dữ liệu lạ đi thẳng vào giao dịch",
    };
  },
);

kiem(
  "Nhà cung cấp chỉ có MỘT sổ giữ chỗ, bất kể tham số truyền vào",
  "nhịp 3b · CodeRabbit PR #37 · 23/09/2026",
  () => {
    /* `maTiepTheoTrenMayChu` bỏ qua tham số cho loại này. Nếu khoá sổ vẫn kèm tham số thì hai
       lượt gọi khác tham số ghi vào HAI sổ — không tranh chấp với nhau, và cùng trả một mã. */
    const a = CM.khoaSoCapPhat("nha-cung-cap", "");
    const b = CM.khoaSoCapPhat("nha-cung-cap", "abc");
    const c = CM.khoaSoCapPhat("nha-cung-cap", "2026");
    return {
      duoc: a === b && b === c,
      thucTe: `"${a}" / "${b}" / "${c}"`,
      mongDoi:
        "ba khoá giống hệt nhau — khoá sổ phải khớp ĐÚNG phạm vi đánh số, không phải khớp thứ nơi gọi tiện truyền",
    };
  },
);

kiem(
  "Đơn hàng và đề nghị thì VẪN tách sổ theo tham số",
  "nhịp 3b · CodeRabbit PR #37 · 23/09/2026",
  () => {
    /* Đừng chữa lỗi trên bằng cách bỏ tham số cho mọi loại: đơn hàng đánh số theo NĂM, đề nghị
       theo DỰ ÁN. Gộp chung là hai năm/hai dự án tranh nhau vô cớ và dãy số lẫn vào nhau. */
    const nam26 = CM.khoaSoCapPhat("don-hang", "26");
    const nam27 = CM.khoaSoCapPhat("don-hang", "27");
    const duAnA = CM.khoaSoCapPhat("de-nghi", "30/2025/HĐXD/UNICE-HPCS");
    const duAnB = CM.khoaSoCapPhat("de-nghi", "43-2025-HĐXD-HPCS");
    return {
      duoc: nam26 !== nam27 && duAnA !== duAnB,
      thucTe: `${nam26} ≠ ${nam27}; ${duAnA} ≠ ${duAnB}`,
      mongDoi: "hai năm khác khoá, hai dự án khác khoá",
    };
  },
);

// ------------------------------------------------------------
// NHỊP 3c — soát trước khi ghi (24/09/2026)
// ------------------------------------------------------------

/** Dựng nhanh một kho dạng map. */
function khoMap(khoi, ds) {
  const m = {};
  for (const x of ds) m[khoi === "giaDonHang" ? x.poId : x.id] = x;
  return { [khoi]: m };
}

kiem(
  "Ô người khác vừa đổi thì KHÔNG ghi đè — phải báo",
  "nhịp 3c · 24/09/2026",
  () => {
    const banCu = { id: "X", trangThai: "cho_xac_nhan" };
    const anh = { donHang: { X: GTP.chuoiOnDinh(banCu) } };
    /* Máy chủ giờ đã khác: chị Thuỳ vừa xác nhận. */
    const trenMayChu = khoMap("donHang", [
      {
        id: "X",
        trangThai: "da_duyet",
        lichSu: [{ thoiDiem: "2026-09-24T09:14:00", nguoiThucHien: "Nguyễn Thị Thuỳ" }],
      },
    ]);
    const r = SO.soatTruocKhiGhi(
      [{ duongDan: "donHang.X", giaTri: { id: "X", trangThai: "huy" } }],
      anh,
      trenMayChu,
    );
    return {
      duoc:
        r.ghiDuoc.length === 0 &&
        r.xungDot.length === 1 &&
        r.xungDot[0].aiDoi === "Nguyễn Thị Thuỳ",
      thucTe: `ghi ${r.ghiDuoc.length}, báo ${r.xungDot.length}, ai: ${r.xungDot[0] ? r.xungDot[0].aiDoi : "—"}`,
      mongDoi:
        "không ghi ô nào, báo 1 ô kèm TÊN người vừa đổi — đây là chỗ cuối cùng còn mất việc sau đợt 2",
    };
  },
);

kiem(
  "Ô chưa ai đụng thì vẫn ghi bình thường — đừng chặn nhầm",
  "nhịp 3c · 24/09/2026",
  () => {
    const ban = { id: "X", trangThai: "cho_xac_nhan" };
    const anh = { donHang: { X: GTP.chuoiOnDinh(ban) } };
    const r = SO.soatTruocKhiGhi(
      [{ duongDan: "donHang.X", giaTri: { id: "X", trangThai: "da_duyet" } }],
      anh,
      khoMap("donHang", [ban]),
    );
    return {
      duoc: r.ghiDuoc.length === 1 && r.xungDot.length === 0,
      thucTe: `ghi ${r.ghiDuoc.length}, báo ${r.xungDot.length}`,
      mongDoi: "ghi 1, báo 0 — chặn nhầm ca này là app không lưu được gì nữa",
    };
  },
);

kiem(
  "Bản ghi MỚI TOANH phải ghi được — tuyệt đối không chặn đường tạo mới",
  "nhịp 3c · 24/09/2026",
  () => {
    const r = SO.soatTruocKhiGhi(
      [{ duongDan: "donHang.MOI", giaTri: { id: "MOI" } }],
      { donHang: {} },
      khoMap("donHang", [{ id: "CU" }]),
    );
    return {
      duoc: r.ghiDuoc.length === 1 && r.xungDot.length === 0,
      thucTe: `ghi ${r.ghiDuoc.length}, báo ${r.xungDot.length}`,
      mongDoi:
        "ghi 1 — mình chưa từng thấy nó vì chính mình vừa tạo ra; chặn ở đây là không lập được đơn",
    };
  },
);

kiem(
  "Mã mới mà máy chủ ĐÃ CÓ thì phải báo, không được đè",
  "nhịp 3c · 24/09/2026",
  () => {
    const r = SO.soatTruocKhiGhi(
      [{ duongDan: "donHang.X", giaTri: { id: "X", ghiChu: "bản của tôi" } }],
      { donHang: {} },
      khoMap("donHang", [{ id: "X", ghiChu: "người khác vừa tạo" }]),
    );
    return {
      duoc: r.ghiDuoc.length === 0 && r.xungDot.length === 1,
      thucTe: `ghi ${r.ghiDuoc.length}, báo ${r.xungDot.length}`,
      mongDoi: "báo 1 — hai người vừa tạo trùng khoá, đè là xoá mất bản của người kia",
    };
  },
);

kiem(
  "XOÁ cũng phải soát — không nuốt mất việc người khác vừa sửa",
  "nhịp 3c · 24/09/2026",
  () => {
    const banCu = { id: "X", trangThai: "nhap" };
    const anh = { donHang: { X: GTP.chuoiOnDinh(banCu) } };
    const r = SO.soatTruocKhiGhi(
      [{ duongDan: "donHang.X", giaTri: null }],
      anh,
      khoMap("donHang", [{ id: "X", trangThai: "da_duyet" }]),
    );
    return {
      duoc: r.ghiDuoc.length === 0 && r.xungDot.length === 1,
      thucTe: `xoá được ${r.ghiDuoc.length}, báo ${r.xungDot.length}`,
      mongDoi: "báo 1 — mình xoá trong khi người khác vừa duyệt chính đơn đó",
    };
  },
);

kiem(
  "Thứ tự trường khác nhau KHÔNG bị coi là xung đột",
  "nhịp 3c · 24/09/2026",
  () => {
    const anh = { donHang: { X: GTP.chuoiOnDinh({ id: "X", a: 1, b: 2 }) } };
    const r = SO.soatTruocKhiGhi(
      [{ duongDan: "donHang.X", giaTri: { id: "X", a: 9 } }],
      anh,
      khoMap("donHang", [{ b: 2, id: "X", a: 1 }]),
    );
    return {
      duoc: r.ghiDuoc.length === 1 && r.xungDot.length === 0,
      thucTe: `ghi ${r.ghiDuoc.length}, báo ${r.xungDot.length}`,
      mongDoi: "ghi 1 — so bằng chuỗi không ổn định thì mỗi lần render lại tưởng có xung đột",
    };
  },
);

kiem(
  "Soát được cả khi kho CÒN DẠNG MẢNG (chưa bật đợt 2)",
  "nhịp 3c · 24/09/2026",
  () => {
    const banCu = { id: "X", trangThai: "cho_xac_nhan" };
    const anh = { donHang: { X: GTP.chuoiOnDinh(banCu) } };
    /* Kho thô còn là MẢNG — hai công tắc độc lập nhau, đừng giả định đợt 2 đã bật. */
    const r = SO.soatTruocKhiGhi(
      [{ duongDan: "donHang.X", giaTri: { id: "X", trangThai: "huy" } }],
      anh,
      { donHang: [{ id: "X", trangThai: "da_duyet" }] },
    );
    return {
      duoc: r.xungDot.length === 1,
      thucTe: `báo ${r.xungDot.length}`,
      mongDoi: "báo 1 — chỉ đọc được dạng map là nhịp 3c tắt tiếng khi đợt 2 chưa bật",
    };
  },
);

kiem(
  "Khoá nguyên khối (cấu hình) cho qua — soát theo ô không áp dụng được",
  "nhịp 3c · 24/09/2026",
  () => {
    const r = SO.soatTruocKhiGhi([{ duongDan: "cauHinh", giaTri: { nguong: 9 } }], {}, {});
    return {
      duoc: r.ghiDuoc.length === 1 && r.xungDot.length === 0,
      thucTe: `ghi ${r.ghiDuoc.length}, báo ${r.xungDot.length}`,
      mongDoi: "ghi 1 — chặn cấu hình vì không soát được là khoá luôn trang Cài đặt",
    };
  },
);

kiem(
  "Câu báo KHÔNG được hứa 'phần bạn vẫn còn trên màn hình'",
  "nhịp 3c · CodeRabbit PR #38 · 24/09/2026",
  () => {
    /* 🔴 Bản đầu của câu này có hứa như vậy, và nó SAI: khi xung đột, ảnh chụp mới từ máy chủ
       thay bản ghi trong bộ nhớ, mà hộp sửa có effect phụ thuộc `[mo, deNghi]` nạp lại mọi ô —
       tức xoá đúng phần người dùng vừa gõ. Hứa sai tệ hơn không nói gì: người ta yên tâm đóng
       hộp thoại rồi mất thật. */
    const c = SO.cauBaoXungDot([
      {
        khoi: "donHang",
        khoa: "X",
        duongDan: "donHang.X",
        aiDoi: "Nguyễn Thị Thuỳ",
        luc: "2026-09-24T09:14:00",
      },
    ]);
    /* 🔴 Danh sách này phải bắt CẢ BIẾN THỂ (CodeRabbit chỉ ra, PR #38): bản đầu chỉ dò 
       "vẫn còn nguyên" nên một câu viết "phần bạn vẫn còn trên màn hình" vẫn lọt qua luật này.
       Cả lời dặn "chép lại TRƯỚC KHI…" cũng bị chặn: `onSnapshot` có thể áp bản của người
       khác vào màn hình TRƯỚC khi thông báo kịp hiện — lời dặn đó đến muộn. */
    const huaSai =
      /vẫn còn nguyên|vẫn còn trên màn hình|chưa mất|không mất gì|trước khi làm gì tiếp|màn hình sắp cập nhật/i.test(
        c.moTa,
      );
    return {
      duoc: !huaSai,
      thucTe: huaSai ? "VẪN CÒN lời hứa sai" : "không hứa điều không bảo đảm được",
      mongDoi:
        "không có câu nào hứa phần vừa nhập còn trên màn hình — giữ bản nháp bị từ chối là việc của một nhịp riêng, chưa làm thì đừng hứa",
    };
  },
);

kiem(
  "Câu báo nói ĐÚNG SỰ THẬT: phần vừa nhập CÓ THỂ đã bị thay",
  "nhịp 3c · CodeRabbit PR #38 · 25/09/2026",
  () => {
    const c = SO.cauBaoXungDot([
      {
        khoi: "donHang",
        khoa: "X",
        duongDan: "donHang.X",
        aiDoi: "Nguyễn Thị Thuỳ",
        luc: "2026-09-24T09:14:00",
      },
    ]);
    const coAi = c.moTa.includes("Nguyễn Thị Thuỳ") && c.moTa.includes("09:14");
    const noiDung = /có thể đã bị thay/i.test(c.moTa);
    const coViecLam = /mở lại|nhập lại/i.test(c.moTa);
    const khongDoLoi = !/xin lỗi/i.test(c.moTa) && !/ghi đè lên bạn/i.test(c.moTa);
    return {
      duoc: coAi && noiDung && coViecLam && khongDoLoi,
      thucTe: `ai+giờ:${coAi} · nói đúng sự thật:${noiDung} · việc cần làm:${coViecLam} · không đổ lỗi:${khongDoLoi}`,
      mongDoi:
        "đủ bốn — chưa giữ được bản nháp thì nói thẳng 'có thể đã bị thay', đừng hứa cũng đừng dặn một việc có thể đã muộn",
    };
  },
);

kiem(
  "Chỉ bảo nhập lại phần BỊ TỪ CHỐI, không bảo gõ lại thứ đã lưu",
  "nhịp 3c · CodeRabbit PR #38 · 25/09/2026",
  () => {
    /* Một lần lưu mang nhiều thay đổi; giao dịch VẪN ghi những ô không ai đụng. Bảo "nhập lại
       phần của bạn" là bảo người ta gõ lại cả thứ đã lưu xong — rồi họ ghi đè lên chính mình. */
    const xd = [
      { khoi: "donHang", khoa: "X", duongDan: "donHang.X", aiDoi: "Thuỳ", luc: "2026-09-24T09:14:00" },
    ];
    const coDaLuu = SO.cauBaoXungDot(xd, 3);
    const khongCo = SO.cauBaoXungDot(xd, 0);
    return {
      duoc: /3 thay đổi khác/.test(coDaLuu.moTa) && !/thay đổi khác/.test(khongCo.moTa),
      thucTe: `có 3 ô đã lưu → nhắc: ${/3 thay đổi khác/.test(coDaLuu.moTa)}; không ô nào → nhắc: ${/thay đổi khác/.test(khongCo.moTa)}`,
      mongDoi:
        "nhắc khi có ô đã lưu, im khi không có — nói thừa cũng gây hoang mang như nói thiếu",
    };
  },
);

kiem(
  "KHÔNG quy tên khi nhật ký không dài ra — người sửa có thể không để lại dấu",
  "nhịp 3c · CodeRabbit PR #38 · 24/09/2026",
  () => {
    /* Viết bình luận, ghi mốc vào bước, đường QLK CTR đều sửa bản ghi mà KHÔNG thêm nhật ký.
       Lấy mục cuối làm "người vừa đổi" là có ngày hiện tên một người sửa từ tuần trước. */
    const lichSuCu = [
      { thoiDiem: "2026-09-17T08:00:00", nguoiThucHien: "Trần Văn Nam", hanhDong: "Lập đơn" },
    ];
    const anhCu = GTP.chuoiOnDinh({ id: "X", trangThai: "cho_xac_nhan", lichSu: lichSuCu });

    // ① Người khác sửa NHƯNG không ghi nhật ký → không được quy tên ai
    const khongDau = SO.aiVuaDoi({ id: "X", trangThai: "huy", lichSu: lichSuCu }, anhCu);

    // ② Người khác sửa VÀ có ghi nhật ký → quy tên được
    const coDau = SO.aiVuaDoi(
      {
        id: "X",
        trangThai: "da_duyet",
        lichSu: [
          ...lichSuCu,
          { thoiDiem: "2026-09-24T09:14:00", nguoiThucHien: "Nguyễn Thị Thuỳ", hanhDong: "Xác nhận" },
        ],
      },
      anhCu,
    );

    return {
      duoc: khongDau.ten === null && coDau.ten === "Nguyễn Thị Thuỳ",
      thucTe: `không để lại dấu → ${khongDau.ten}; có ghi nhật ký → ${coDau.ten}`,
      mongDoi:
        "null / Nguyễn Thị Thuỳ — quy oan cho một người sửa từ tuần trước còn tệ hơn không nói tên",
    };
  },
);

kiem(
  "Ảnh chụp hỏng thì không đoán tên",
  "nhịp 3c · CodeRabbit PR #38 · 24/09/2026",
  () => {
    const r = SO.aiVuaDoi(
      { lichSu: [{ thoiDiem: "2026-09-24T09:14:00", nguoiThucHien: "Ai Đó" }] },
      "{ không phải JSON",
    );
    return {
      duoc: r.ten === null,
      thucTe: String(r.ten),
      mongDoi: "null — không đọc được ảnh chụp thì không có cơ sở nào để so, đừng đoán",
    };
  },
);

kiem(
  "Không tra được tên người thì nói chung chung, KHÔNG bịa tên",
  "nhịp 3c · 24/09/2026",
  () => {
    const c = SO.cauBaoXungDot([
      { khoi: "deNghi", khoa: "D1", duongDan: "deNghi.D1", aiDoi: null, luc: null },
    ]);
    return {
      duoc: c.moTa.includes("người khác") && c.tieuDe.length > 0,
      thucTe: c.moTa.slice(0, 70),
      mongDoi: "câu chung chung — thà nói ít hơn là nói sai tên người",
    };
  },
);

kiem(
  "Nhật ký rỗng / thiếu trường không làm hỏng việc tra tên",
  "nhịp 3c · 24/09/2026",
  () => {
    const a = SO.aiVuaDoi({});
    const b = SO.aiVuaDoi({ lichSu: [] });
    const c = SO.aiVuaDoi({ lichSu: [{ hanhDong: "sửa" }] });
    const d = SO.aiVuaDoi(null);
    return {
      duoc: [a, b, c, d].every((x) => x.ten === null),
      thucTe: JSON.stringify([a.ten, b.ten, c.ten, d.ten]),
      mongDoi: "cả bốn đều null — dữ liệu cũ không ai bảo đảm có đủ nhật ký",
    };
  },
);

// ------------------------------------------------------------

/** Dựng nhanh một bảng tiến độ để kiểm phần quyết định hiển thị. */
function tdPhieu(ds, chuaGiao) {
  return {
    nguoi: ds.map((x, i) => ({
      uid: x.uid || "u" + i,
      ten: x.ten || "Người " + i,
      sttDong: x.sttDong || [i + 1],
      giaiDoan: x.giaiDoan,
    })),
    soDongChuaGiao: chuaGiao || 0,
  };
}

kiem(
  "Chỉ MỘT người phụ trách thì ẩn khối — đừng lặp lại thanh bước ở trên",
  "tiến độ theo người · 25/09/2026",
  () => {
    const mot = TDN.nenHienTienDoTheoNguoi(tdPhieu([{ giaiDoan: "dat_hang" }], 0));
    const hai = TDN.nenHienTienDoTheoNguoi(
      tdPhieu([{ giaiDoan: "dat_hang" }, { giaiDoan: "yeu_cau_bao_gia" }], 0),
    );
    return {
      duoc: mot === false && hai === true,
      thucTe: `một người → ${mot}; hai người → ${hai}`,
      mongDoi:
        "false / true — một người làm hết thì khối này nói đúng thứ thanh bước đã nói, thêm vào chỉ tổ rối",
    };
  },
);

kiem(
  "Một người NHƯNG còn dòng chưa giao thì VẪN hiện",
  "tiến độ theo người · 25/09/2026",
  () => {
    const r = TDN.nenHienTienDoTheoNguoi(tdPhieu([{ giaiDoan: "dat_hang" }], 2));
    return {
      duoc: r === true,
      thucTe: String(r),
      mongDoi:
        "true — 'còn 2 dòng chưa giao cho ai' là việc của trưởng bộ phận, mà thanh bước ở trên không nói được điều đó",
    };
  },
);

kiem(
  "Lệch 1 bước KHÔNG gắn nhãn chậm nhất",
  "tiến độ theo người · 25/09/2026",
  () => {
    const r = TDN.aiChamNhat(
      tdPhieu([
        { uid: "ny", giaiDoan: "xet_duyet_bao_gia" },
        { uid: "thuy", giaiDoan: "lap_don_mua_hang" },
      ]),
    );
    return {
      duoc: r === null,
      thucTe: String(r),
      mongDoi:
        "null — lệch một bước là nhịp làm việc bình thường; nhãn nào cũng hiện thì hết là tín hiệu",
    };
  },
);

kiem(
  "Lệch 2 bước trở lên thì gắn cho đúng người chậm",
  "tiến độ theo người · 25/09/2026",
  () => {
    const r = TDN.aiChamNhat(
      tdPhieu([
        { uid: "ny", giaiDoan: "yeu_cau_bao_gia" },
        { uid: "thuy", giaiDoan: "dat_hang" },
      ]),
    );
    return {
      duoc: r === "ny",
      thucTe: String(r),
      mongDoi: "ny — người đang ở bước thấp nhất",
    };
  },
);

kiem(
  "KHÔNG gắn nhãn chậm cho người đã xong, và không tính họ khi đo khoảng cách",
  "tiến độ theo người · 25/09/2026",
  () => {
    /* Người xong đứng cuối dãy; để họ trong phép đo thì lúc nào cũng ra "lệch nhiều". */
    const r = TDN.aiChamNhat(
      tdPhieu([
        { uid: "ny", giaiDoan: "lap_don_mua_hang" },
        { uid: "thuy", giaiDoan: "hoan_thanh" },
        { uid: "quan", giaiDoan: "dat_hang" },
      ]),
    );
    return {
      duoc: r === null,
      thucTe: String(r),
      mongDoi:
        "null — hai người còn chạy chỉ lệch 1 bước; nếu đếm cả người đã hoàn thành thì sẽ gắn nhãn oan cho Ny",
    };
  },
);

kiem(
  "Hồ sơ THẤT BẠI không được coi là đi xa nhất",
  "tiến độ theo người · 25/09/2026",
  () => {
    /* `that_bai` nằm CUỐI dãy bước. Không loại ra thì một hồ sơ đóng dở thành người chạy nhanh nhất. */
    const viTriThatBai = TDN.viTriBuoc("that_bai");
    const viTriHoanThanh = TDN.viTriBuoc("hoan_thanh");
    const r = TDN.aiChamNhat(
      tdPhieu([
        { uid: "ny", giaiDoan: "yeu_cau_bao_gia" },
        { uid: "thuy", giaiDoan: "that_bai" },
      ]),
    );
    return {
      duoc: viTriThatBai > viTriHoanThanh && r === null,
      thucTe: `vị trí that_bai=${viTriThatBai} > hoan_thanh=${viTriHoanThanh}; gắn nhãn: ${r}`,
      mongDoi:
        "that_bai đứng sau hoan_thanh trong dãy NHƯNG phải bị loại khỏi phép so — chỉ còn 1 người đang chạy nên không gắn nhãn ai",
    };
  },
);

kiem(
  "Hai người cùng chậm nhất thì chỉ gắn cho người ĐẦU TIÊN",
  "tiến độ theo người · 25/09/2026",
  () => {
    const r = TDN.aiChamNhat(
      tdPhieu([
        { uid: "ny", giaiDoan: "yeu_cau_bao_gia" },
        { uid: "thuy", giaiDoan: "yeu_cau_bao_gia" },
        { uid: "quan", giaiDoan: "nhan_hang" },
      ]),
    );
    return {
      duoc: r === "ny",
      thucTe: String(r),
      mongDoi:
        "ny — gắn cả hai thì nhãn mất nghĩa 'nhất', không gắn ai thì mất luôn tín hiệu",
    };
  },
);

kiem(
  "Mã bước lạ không làm hỏng phép so",
  "tiến độ theo người · 25/09/2026",
  () => {
    /* Hồ sơ cũ hoặc máy khác chạy bản khác có thể mang mã app này chưa biết. */
    const r = TDN.aiChamNhat(
      tdPhieu([
        { uid: "ny", giaiDoan: "buoc_la_khong_co_that" },
        { uid: "thuy", giaiDoan: "dat_hang" },
      ]),
    );
    return {
      duoc: r === null && TDN.viTriBuoc("buoc_la_khong_co_that") === -1,
      thucTe: `gắn nhãn: ${r}; vị trí mã lạ: ${TDN.viTriBuoc("buoc_la_khong_co_that")}`,
      mongDoi:
        "null và -1 — mã lạ bị loại khỏi phép so, chỉ còn 1 người hợp lệ nên không gắn nhãn; tính nó là 'bước -1' sẽ gắn nhãn chậm cho một hồ sơ chỉ vì app chưa biết mã",
    };
  },
);

kiem(
  "Gom dòng theo người: giữ nguyên thứ tự phân bổ, đếm đúng dòng chưa giao",
  "tiến độ theo người · 25/09/2026",
  () => {
    const deNghi = {
      id: "D1",
      items: [
        { stt: 1, nguoiPhuTrachUid: "ny", nguoiPhuTrachTen: "Bạn Ny" },
        { stt: 2, nguoiPhuTrachUid: "thuy", nguoiPhuTrachTen: "Bạn Thùy" },
        { stt: 3, nguoiPhuTrachUid: "ny", nguoiPhuTrachTen: "Bạn Ny" },
        { stt: 4 },
        { stt: 5, nguoiPhuTrachUid: "" },
      ],
    };
    const r = TDN.tienDoTheoNguoi(deNghi, [], [], []);
    const ny = r.nguoi.find((n) => n.uid === "ny");
    return {
      duoc:
        r.nguoi.length === 2 &&
        r.nguoi[0].uid === "ny" &&
        String(ny.sttDong) === "1,3" &&
        r.soDongChuaGiao === 2,
      thucTe: `${r.nguoi.length} người, người đầu ${r.nguoi[0] && r.nguoi[0].uid}, dòng của ny [${ny && ny.sttDong}], chưa giao ${r.soDongChuaGiao}`,
      mongDoi:
        "2 người · ny đứng đầu (thứ tự phân bổ) · ny giữ dòng 1,3 · 2 dòng chưa giao (trống và chuỗi rỗng đều tính)",
    };
  },
);

kiem(
  "Thiếu tên người thì KHÔNG bịa từ uid",
  "tiến độ theo người · 25/09/2026",
  () => {
    const r = TDN.tienDoTheoNguoi(
      { id: "D1", items: [{ stt: 1, nguoiPhuTrachUid: "abc123xyz" }] },
      [], [], [],
    );
    const ten = r.nguoi[0] && r.nguoi[0].ten;
    return {
      duoc: ten === "(không rõ tên)" && !String(ten).includes("abc123"),
      thucTe: String(ten),
      mongDoi:
        "(không rõ tên) — uid là chuỗi băm, đọc lên không ra người nào; hiện nó lên còn khó hiểu hơn để trống",
    };
  },
);

kiem(
  "Đơn hàng lọc theo DÒNG, không theo người lập đơn",
  "tiến độ theo người · 25/09/2026",
  () => {
    /* Trưởng bộ phận lập đơn hộ nhân viên: `po.nguoiPhuTrachUid` là trưởng bộ phận, nhưng đơn
       mua hộ dòng của nhân viên nên phải tính vào tiến độ của NHÂN VIÊN. */
    const deNghi = {
      id: "D1",
      trangThai: "dang_xu_ly",
      items: [
        { stt: 1, nguoiPhuTrachUid: "ny", nguoiPhuTrachTen: "Ny" },
        { stt: 2, nguoiPhuTrachUid: "thuy", nguoiPhuTrachTen: "Thùy" },
      ],
    };
    const po = {
      id: "PO1",
      prId: "D1",
      trangThai: "da_chot",
      nguoiPhuTrachUid: "quyen", // trưởng bộ phận lập hộ
      items: [{ sttDong: 1, sttDongDeNghi: 1 }],
    };
    const r = TDN.tienDoTheoNguoi(deNghi, [po], [], []);
    const ny = r.nguoi.find((n) => n.uid === "ny");
    const thuy = r.nguoi.find((n) => n.uid === "thuy");
    return {
      duoc: ny.giaiDoan === "dat_hang" && thuy.giaiDoan !== "dat_hang",
      thucTe: `ny → ${ny && ny.giaiDoan}; thuy → ${thuy && thuy.giaiDoan}`,
      mongDoi:
        "ny ở dat_hang (đơn mua hộ dòng của ny), thuy chưa — lọc theo người lập đơn thì cả hai cùng sai",
    };
  },
);

kiem(
  "Hồ sơ THẤT BẠI không được vẽ thanh đầy như hoàn thành",
  "tiến độ theo người · CodeRabbit PR #39 · 25/09/2026",
  () => {
    /* `that_bai` nằm CUỐI dãy nên `viTriBuoc` trả 8, trong khi thanh chỉ vẽ 8 ô (0…7).
       Truyền thẳng số đó vào là `i <= 8` đúng với mọi ô — hồ sơ đóng dở hiện thanh ĐẦY y hệt
       hồ sơ hoàn thành, ngay cạnh chữ "Thất bại". */
    const soO = 8; // số ô thanh vẽ (đã bỏ that_bai)
    const viTriThatBai = TDN.viTriBuoc("that_bai");
    return {
      duoc: viTriThatBai >= soO,
      thucTe: `viTriBuoc(that_bai) = ${viTriThatBai}, thanh vẽ ${soO} ô`,
      mongDoi:
        "viTriBuoc(that_bai) ≥ số ô — đây chính là lý do giao diện PHẢI truyền -1 thay vì truyền thẳng vị trí",
    };
  },
);

kiem(
  "Phiếu nhận của người KHÁC không được đẩy bước của mình lên 'đã nhận hàng'",
  "tiến độ theo người · CodeRabbit PR #39 · 25/09/2026",
  () => {
    /* Một đơn hàng gộp dòng của hai người. Phiếu nhận chỉ chở dòng của Thùy. */
    const deNghi = {
      id: "D1",
      trangThai: "dang_xu_ly",
      items: [
        { stt: 1, nguoiPhuTrachUid: "ny", nguoiPhuTrachTen: "Ny" },
        { stt: 2, nguoiPhuTrachUid: "thuy", nguoiPhuTrachTen: "Thùy" },
      ],
    };
    const po = {
      id: "PO1",
      prId: "D1",
      trangThai: "da_chot",
      items: [
        { sttDong: 1, sttDongDeNghi: 1 }, // của Ny
        { sttDong: 2, sttDongDeNghi: 2 }, // của Thùy
      ],
    };
    const phieu = {
      id: "GRN1",
      poId: "PO1",
      trangThai: "da_nhan",
      lines: [{ sttDongPO: 2 }], // CHỈ dòng của Thùy
    };

    const r = TDN.tienDoTheoNguoi(deNghi, [po], [], [phieu]);
    const ny = r.nguoi.find((n) => n.uid === "ny");
    const thuy = r.nguoi.find((n) => n.uid === "thuy");
    const nyChuaNhan = ny && ny.giaiDoan !== "nhan_hang" && ny.giaiDoan !== "ho_so_thanh_toan";

    return {
      duoc: Boolean(nyChuaNhan),
      thucTe: `ny → ${ny && ny.giaiDoan}; thuy → ${thuy && thuy.giaiDoan}`,
      mongDoi:
        "ny CHƯA ở bước nhận hàng — lọc phiếu nhận chỉ theo poId là báo Ny đã nhận được hàng trong khi hàng của Ny chưa về",
    };
  },
);

kiem(
  "Phiếu nhận CÓ dòng của mình thì vẫn tính bình thường",
  "tiến độ theo người · CodeRabbit PR #39 · 25/09/2026",
  () => {
    /* Vá chặt quá tay thì bước của người có hàng về lại không nhúc nhích — kiểm cả chiều này. */
    const deNghi = {
      id: "D1",
      trangThai: "dang_xu_ly",
      items: [
        { stt: 1, nguoiPhuTrachUid: "ny", nguoiPhuTrachTen: "Ny" },
        { stt: 2, nguoiPhuTrachUid: "thuy", nguoiPhuTrachTen: "Thùy" },
      ],
    };
    const po = {
      id: "PO1",
      prId: "D1",
      trangThai: "da_chot",
      items: [
        { sttDong: 1, sttDongDeNghi: 1 },
        { sttDong: 2, sttDongDeNghi: 2 },
      ],
    };
    const phieu = { id: "GRN1", poId: "PO1", trangThai: "da_nhan", lines: [{ sttDongPO: 1 }] };

    const r = TDN.tienDoTheoNguoi(deNghi, [po], [], [phieu]);
    const ny = r.nguoi.find((n) => n.uid === "ny");
    return {
      duoc: ny && (ny.giaiDoan === "nhan_hang" || ny.giaiDoan === "ho_so_thanh_toan"),
      thucTe: `ny → ${ny && ny.giaiDoan}`,
      mongDoi: "ny ở bước nhận hàng (hoặc xa hơn) — phiếu nhận này CHỞ ĐÚNG dòng của Ny",
    };
  },
);

// ════════════════════════════════════════════════════════════════════
// QUY TRÌNH NHÂN SỰ KHÔNG CẦN HỢP ĐỒNG + HOÁ ĐƠN — Sếp 26/09/2026
// "sẽ khác ở hồ sơ thanh toán, là ko cần hợp đồng và hoá đơn, vì hàng có sẵn trong kho"
// Kiểm HAI CHIỀU: phiếu toàn dòng nhân sự thì nới; lẫn một dòng mua ngoài thì KHÔNG nới.
// ════════════════════════════════════════════════════════════════════

{
  const hoSoNS = (loai2) => ({
    id: "ns",
    items: [
      { stt: 1, loaiViecGiao: "nhan_su" },
      { stt: 2, loaiViecGiao: loai2 },
    ],
    tepGiaiDoan: {},
    lyDoThieuChungTu: {},
  });
  kiem(
    "Phiếu toàn dòng NHÂN SỰ → không đòi hợp đồng (bước ④) và không đòi hoá đơn",
    "Sếp · 26/09/2026 · quy trình nhân sự",
    () => {
      const CT = nap(join(thuMuc, "chung-tu.cjs"));
      const hd = CT.vuongMacRoiBuocLapDon(hoSoNS("nhan_su"));
      const vat = CT.vuongMacDuyetHoanThanhDeNghi(hoSoNS("nhan_su"));
      return {
        duoc: hd === null && vat === null,
        thucTe: `HĐ=${hd === null ? "null" : "chặn"} · VAT=${vat === null ? "null" : "chặn"}`,
        mongDoi: "cả hai null",
      };
    },
  );
  kiem(
    "Phiếu LẪN dòng mua ngoài → VẪN đòi hợp đồng và hoá đơn (không nới cả phiếu)",
    "Sếp · 26/09/2026 · quy trình nhân sự (chiều nghịch)",
    () => {
      const CT = nap(join(thuMuc, "chung-tu.cjs"));
      /* Dòng 2 không có loại việc = mua ngoài qua báo giá. (Bản sáng 26/09 dùng "xuat_kho" làm ví dụ
         bị chặn — đó là giả định; Sếp chốt chiều 26/09: xuất kho cũng miễn, xem bài dưới.) */
      const hd = CT.vuongMacRoiBuocLapDon(hoSoNS(undefined));
      const vat = CT.vuongMacDuyetHoanThanhDeNghi(hoSoNS(undefined));
      return {
        duoc: hd !== null && vat !== null,
        thucTe: `HĐ=${hd === null ? "null" : "chặn"} · VAT=${vat === null ? "null" : "chặn"}`,
        mongDoi: "cả hai chặn",
      };
    },
  );
  kiem(
    "Phiếu toàn dòng XUẤT KHO (hoặc lẫn nhân sự) → không đòi hợp đồng, không đòi hoá đơn",
    "Sếp · 26/09/2026 (Đúng, xuất kho thì ko cần hợp đồng và hoá đơn)",
    () => {
      const CT = nap(join(thuMuc, "chung-tu.cjs"));
      const hs = {
        ...hoSoNS("xuat_kho"),
        items: [
          { stt: 1, loaiViecGiao: "xuat_kho" },
          { stt: 2, loaiViecGiao: "nhan_su" },
        ],
      };
      const hd = CT.vuongMacRoiBuocLapDon(hs);
      const vat = CT.vuongMacDuyetHoanThanhDeNghi(hs);
      return {
        duoc: hd === null && vat === null,
        thucTe: `HĐ=${hd === null ? "null" : "chặn"} · VAT=${vat === null ? "null" : "chặn"}`,
        mongDoi: "cả hai null",
      };
    },
  );
}

// ════════════════════════════════════════════════════════════════════
// SỐ PHIẾU XUẤT KHO — Sếp 26/09/2026: "XK260001 số nhảy tự động"
// Dãy XK chạy RIÊNG theo năm, không tranh số với DMH; tiền tố lạ không tự đặt được mã mới.
// ════════════════════════════════════════════════════════════════════
kiem(
  "Số phiếu xuất kho: XK + năm + 4 số, dãy riêng không lẫn DMH",
  "Sếp · 26/09/2026 · mã chứng từ phiếu xuất kho",
  () => {
    const D = modDMH;
    const daCo = ["DMH260007", "XK260001", "XK260002", "XK250009"];
    const xk = D.maDonHangTiepTheo(D.thamSoCapSoDon("26", true), daCo);
    const dmh = D.maDonHangTiepTheo(D.thamSoCapSoDon("26", false), daCo);
    const xkDau = D.maDonHangTiepTheo(D.thamSoCapSoDon("27", true), daCo);
    return {
      duoc: xk === "XK260003" && dmh === "DMH260008" && xkDau === "XK270001",
      thucTe: `${xk} · ${dmh} · ${xkDau}`,
      mongDoi: "XK260003 · DMH260008 · XK270001",
    };
  },
);
kiem(
  "Tiền tố lạ gửi vào cửa cấp số KHÔNG sinh được hệ mã mới (quy tắc E-6)",
  "Thông báo 09/2026 E-6 · 26/09/2026",
  () => {
    const D = modDMH;
    const r = D.maDonHangTiepTheo("ABC:26", []);
    return { duoc: !r.startsWith("ABC"), thucTe: r, mongDoi: "không bắt đầu bằng ABC" };
  },
);

// ════════════════════════════════════════════════════════════════════
// PHÂN QUYỀN TICK CHỌN — Sếp 26/09/2026
// "khi chọn nhân viên A thì sẽ hiện 1 list quyền bên cạnh, a giao cho quyền gì thì chỉ cần
//  tick zô là được" · "được chọn nhiều người cùng lúc" · trưởng bộ phận là người tick.
//
// 📌 KHỐI TỰ ĐỦ: thư mục tạm chung (`thuMuc`) đã bị xoá ở phía trên, nên khối này dựng vào thư mục
//    tạm RIÊNG rồi nạp ngay. Canh HAI CHIỀU cho mỗi luật — chỉ canh "chặn được" thì ai sửa hàm
//    thành `return "chặn"` vô điều kiện vẫn xanh mà Sếp không tick được cho ai.
// ════════════════════════════════════════════════════════════════════
{
  const thuMucPQ = mkdtempSync(join(tmpdir(), "kiem-luat-pq-"));
  let QR = null;
  let LPQ = null;
  let QX = null;
  let QTH = null;
  let VTC = null;
  try {
    execSync(
      `npx --yes esbuild "4-phan-quyen/quyen-rieng.ts" "4-phan-quyen/luat-phan-quyen.ts" "4-phan-quyen/quyen.ts" "4-phan-quyen/quyen-theo-ho-so.ts" "4-phan-quyen/vai-tro-chuan.ts" --bundle --platform=node --format=cjs --outdir="${thuMucPQ}" --out-extension:.js=.cjs --log-level=error`,
      { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
    );
    /* Nạp NGAY khi còn thư mục — xoá xong mới nạp là không thấy tệp (bài học `modDMH`). */
    QR = nap(join(thuMucPQ, "quyen-rieng.cjs"));
    LPQ = nap(join(thuMucPQ, "luat-phan-quyen.cjs"));
    QX = nap(join(thuMucPQ, "quyen.cjs"));
    QTH = nap(join(thuMucPQ, "quyen-theo-ho-so.cjs"));
    VTC = nap(join(thuMucPQ, "vai-tro-chuan.cjs"));
  } catch (e) {
    truot.push({
      ten: "Dựng 4-phan-quyen/quyen-rieng.ts + luat-phan-quyen.ts + quyen.ts",
      chu: "Sếp · 26/09/2026 · phân quyền tick",
      thucTe: `KHÔNG DỰNG ĐƯỢC: ${String(e.stderr ?? e.message).slice(0, 300)}`,
      mongDoi: "dựng được",
    });
  } finally {
    rmSync(thuMucPQ, { recursive: true, force: true });
  }

  if (QR && LPQ && QX) {
    const CHU = "Sếp · 26/09/2026 · phân quyền tick";
    const nd = (uid, them) => ({
      uid,
      tenHienThi: uid,
      chucDanh: "",
      phongBan: "",
      vaiTro: "staff",
      capKho: 0,
      ...them,
    });
    const TBP = nd("tbp", { chucNang: "truong_bo_phan_thu_mua", capTM: 3, capKho: 1 });
    const TBP2 = nd("tbp2", { chucNang: "truong_bo_phan_thu_mua", capTM: 3, capKho: 1 });
    const NV = nd("nv", { chucNang: "nhan_vien_thu_mua", capTM: 2 });
    const KHO = nd("kho", { chucNang: "thu_kho_cong_trinh", capTM: 1, capKho: 2 });
    const QT = nd("qt", { chucNang: "truong_bo_phan_thu_mua", vaiTro: "admin", capTM: 4, capKho: 4 });
    const BGD = nd("bgd", { chucNang: "truong_bo_phan_thu_mua", vaiTro: "director", capTM: 1 });
    const NGUNG = nd("ngung", { chucNang: "phong_thi_cong", capTM: 0 });

    /** Dựng một người nhận: quyền riêng đang cất + phần thay đổi → trước/sau như route tính. */
    const dich = (n, riengCu, thayDoi) => {
      const goc = QX.tinhQuyenTheoChucDanh(n);
      const ts = QR.tinhTruocSauKhiLuu(goc, riengCu, n.vaiTro === "admin", thayDoi);
      return {
        uid: n.uid,
        ten: n.uid,
        vaiTro: n.vaiTro,
        capTM: n.capTM,
        quyenGoc: goc,
        quyenTruoc: ts.quyenTruoc,
        quyenSau: ts.quyenSau,
        boVaoApp: ts.boVaoApp,
      };
    };
    const goi = (n, quyenRieng = null) => ({ uid: n.uid, nguoiDung: { ...n, quyenRieng } });

    kiem(
      "🔴 Chưa có quyền riêng → GIỮ NGUYÊN quyền theo chức danh (deploy xong không ai mất quyền)",
      `${CHU} · Sếp chốt 26/09/2026: "Tạm giữ theo chức danh"`,
      () => {
        const goc = QX.tinhQuyenTheoChucDanh(NV);
        const kq = QR.apDungQuyenRieng(goc, null, false);
        const tq = QX.tinhQuyen(NV);
        const giong = Object.keys(goc).every((k) => kq[k] === goc[k] && tq[k] === goc[k]);
        return {
          duoc: giong && kq.xemGia === true && kq.lapPO === true,
          thucTe: `giống gốc=${giong} · xemGia=${kq.xemGia} · lapPO=${kq.lapPO}`,
          mongDoi: "y hệt quyền theo chức danh (NV Thu mua vẫn xem giá, lập đơn)",
        };
      },
    );

    kiem(
      "Có quyền riêng → cờ tick được lấy ĐÚNG theo bản riêng (thiếu khoá = tắt) — hai chiều: bỏ được VÀ thêm được",
      CHU,
      () => {
        /* Chiều BỎ: NV chỉ được tick "Vào app" → mất xem giá, mất lập đơn. */
        const nv = QX.tinhQuyen({ ...NV, quyenRieng: { xemDuocApp: true } });
        /* Chiều THÊM: thủ kho vốn KHÔNG xem giá, tick thêm là xem được. */
        const kho = QX.tinhQuyen({ ...KHO, quyenRieng: { xemDuocApp: true, xemGia: true } });
        const khoGoc = QX.tinhQuyen(KHO);
        return {
          duoc: nv.xemDuocApp && !nv.xemGia && !nv.lapPO && kho.xemGia && !khoGoc.xemGia,
          thucTe: `NV: vào=${nv.xemDuocApp} giá=${nv.xemGia} lập đơn=${nv.lapPO} · kho gốc giá=${khoGoc.xemGia} → tick giá=${kho.xemGia}`,
          mongDoi: "NV: vào=true giá=false lập đơn=false · kho gốc giá=false → tick giá=true",
        };
      },
    );

    kiem(
      "🔴 tinhQuyen(nguoiDung) ĐÃ áp quyền riêng — tầng ghi kho-du-lieu.tsx gác quyền bằng chính hàm này",
      CHU,
      () => {
        /* Nếu ai tách lớp đè ra khỏi `tinhQuyen` (chỉ áp ở context) thì giao diện hiện nút theo
           quyền tick còn tầng ghi vẫn gác theo chức danh: nút hiện, bấm bị từ chối. */
        const coGhi = QX.tinhQuyen({ ...KHO, quyenRieng: { xemDuocApp: true, ghiThanhToan: true } });
        const boGhi = QX.tinhQuyen({ ...NV, quyenRieng: { xemDuocApp: true, lapPO: true } });
        return {
          duoc: coGhi.ghiThanhToan === true && boGhi.ghiThanhToan === false,
          thucTe: `kho tick ghi TT=${coGhi.ghiThanhToan} · NV bỏ ghi TT=${boGhi.ghiThanhToan}`,
          mongDoi: "kho tick ghi TT=true · NV bỏ ghi TT=false",
        };
      },
    );

    kiem(
      "Quản trị KHÔNG tự khoá được · bỏ 'Vào app' là mất hết · tài khoản Ngừng truy cập KHÔNG mở lại được bằng tick",
      CHU,
      () => {
        const qt = QX.tinhQuyen({ ...QT, quyenRieng: {} });
        const tatVao = QX.tinhQuyen({ ...NV, quyenRieng: { xemDuocApp: false, xemGia: true, lapPO: true } });
        const conBat = Object.entries(tatVao).filter(([, v]) => v).map(([k]) => k);
        const ngung = QX.tinhQuyen({ ...NGUNG, quyenRieng: { xemDuocApp: true, xemGia: true } });
        return {
          duoc: qt.xoaToanBoDuLieu && qt.phanQuyenNguoiDung && conBat.length === 0 && !ngung.xemDuocApp && !ngung.xemGia,
          thucTe: `QT xoá=${qt.xoaToanBoDuLieu} phân quyền=${qt.phanQuyenNguoiDung} · bỏ vào app còn bật=[${conBat}] · ngừng: vào=${ngung.xemDuocApp} giá=${ngung.xemGia}`,
          mongDoi: "QT đủ quyền · bỏ vào app còn bật=[] · ngừng: vào=false giá=false",
        };
      },
    );

    kiem(
      "Ghép phần thay đổi: ô đã chạm thắng, ô chưa chạm giữ của từng người; chưa có quyền riêng mà trùng mẫu → KHÔNG ghi",
      CHU,
      () => {
        const nen = { xemDuocApp: true, xemGia: true, lapPO: true };
        const g = QR.ghepQuyenRieng(nen, { xemGia: false, xemCongNo: true });
        const gocNV = QX.tinhQuyenTheoChucDanh(NV);
        const trungMau = QR.canGhiQuyenRieng(null, gocNV, { xemGia: true, lapPO: true });
        const khacMau = QR.canGhiQuyenRieng(null, gocNV, { xemGia: false });
        const voNghia = QR.canGhiQuyenRieng({ ...nen }, gocNV, { xemGia: true });
        return {
          duoc:
            g.xemDuocApp && !g.xemGia && g.lapPO && g.xemCongNo && !trungMau && khacMau && !voNghia,
          thucTe: `ghép: vào=${g.xemDuocApp} giá=${g.xemGia} lập=${g.lapPO} nợ=${g.xemCongNo} · trùng mẫu ghi=${trungMau} · khác mẫu ghi=${khacMau} · không đổi ghi=${voNghia}`,
          mongDoi: "ghép: vào=true giá=false lập=true nợ=true · trùng mẫu ghi=false · khác mẫu ghi=true · không đổi ghi=false",
        };
      },
    );

    kiem(
      "✅ Trưởng bộ phận TRAO ĐƯỢC cờ mình có cho nhân viên cấp 2 (chiều cho phép — nếu đỏ là Sếp không tick được cho ai)",
      CHU,
      () => {
        /* "Xem mọi hồ sơ": chức danh NV KHÔNG cho, trưởng bộ phận CÓ → trao được. (Chọn cờ chức danh
           NV không có, để phép thử đi đúng nhánh "người trao đang có", không nhờ nhánh miễn cờ chức danh.) */
        const r = LPQ.vuongMacTraoQuyen(goi(TBP), [dich(NV, null, { xemMoiHoSo: true })]);
        /* Nhiều người một lượt: NV + thủ kho, chỉ bỏ "Xem nhà cung cấp" — thủ kho vẫn giữ "Ghi phiếu
           nhận hàng" mà trưởng bộ phận KHÔNG có; giữ nguyên không phải là trao. */
        const r2 = LPQ.vuongMacTraoQuyen(goi(TBP), [
          dich(NV, null, { xemNhaCungCap: false }),
          dich(KHO, null, { xemNhaCungCap: false }),
        ]);
        /* Thủ kho có quyền riêng cũ thiếu "Ghi phiếu nhận hàng"; áp lại mẫu chức danh → bật lại cờ
           chức danh đã cho sẵn, KHÔNG tính là trao. */
        const r3 = LPQ.vuongMacTraoQuyen(goi(TBP), [
          dich(KHO, { xemDuocApp: true }, QR.rutQuyenRieng(QX.tinhQuyenTheoChucDanh(KHO))),
        ]);
        return {
          duoc: r === null && r2 === null && r3 === null,
          thucTe: `trao xem mọi hồ sơ=${r ?? "cho qua"} · nhiều người=${r2 ?? "cho qua"} · áp mẫu kho=${r3 ?? "cho qua"}`,
          mongDoi: "cả ba cho qua",
        };
      },
    );

    kiem(
      "⛔ Chống leo quyền: trưởng bộ phận KHÔNG trao được cờ mình không có, KHÔNG trao 'Xoá toàn bộ'",
      /* Đổi theo soát chéo 26/09/2026: bỏ ca "trao 'Phân quyền'" — cờ đó không tick được nữa (máy chủ
         `/api/phan-quyen` gác theo cấp), việc chặn nó đã có bài kiểm riêng ngay dưới. */
      `${CHU} · sửa theo soát chéo 26/09/2026`,
      () => {
        const khongCo = LPQ.vuongMacTraoQuyen(goi(TBP), [dich(NV, null, { ghiPhieuNhanHang: true })]);
        const xoa = LPQ.vuongMacTraoQuyen(goi(TBP), [dich(NV, null, { xoaToanBoDuLieu: true })]);
        /* Chiều ngược: Quản trị trao được cả hai. */
        const qtTrao = LPQ.vuongMacTraoQuyen(goi(QT), [
          dich(NV, null, { xoaToanBoDuLieu: true, ghiPhieuNhanHang: true }),
        ]);
        return {
          duoc: khongCo !== null && xoa !== null && qtTrao === null,
          thucTe: `không có=${khongCo ? "chặn" : "LỌT"} · xoá=${xoa ? "chặn" : "LỌT"} · QT trao=${qtTrao ?? "cho qua"}`,
          mongDoi: "hai ca đầu chặn · QT trao cho qua",
        };
      },
    );

    kiem(
      "⛔ Không tự sửa mình · TBP không sửa Quản trị/BGĐ/trưởng bộ phận khác · người cấp 2 không tick cho ai",
      /* Đổi theo soát chéo 26/09/2026 (hai lượt): ca "bị bỏ tick 'Phân quyền'" rồi ca "bản riêng cũ
         khoá 'Vào app' của TBP" đều không còn tồn tại — cờ phân quyền theo chức danh, và "Vào app" của
         người cấp ≥ 3 bị ép bật (`apDungQuyenRieng` ⑤). Đường còn lại: người gọi cấp 2 (chức danh không
         có quyền phân quyền). ★ Sếp chốt 26/09/2026 "Giữ quyền này": TBP không sửa được BGĐ. */
      `${CHU} · sửa theo soát chéo 26/09/2026 · Sếp: "Giữ quyền này" (BGĐ)`,
      () => {
        /* Tự sửa: dùng Quản trị — trưởng bộ phận tự sửa mình còn vướng luật cấp, phép thử sẽ không
           chứng minh được chốt "không tự sửa". */
        const tuSua = LPQ.vuongMacTraoQuyen(goi(QT), [dich(QT, null, { xemCongNo: false })]);
        const suaQT = LPQ.vuongMacTraoQuyen(goi(TBP), [dich(QT, null, { xemGia: false })]);
        const suaBGD = LPQ.vuongMacTraoQuyen(goi(TBP), [dich(BGD, null, { xemGia: false })]);
        const suaTBP2 = LPQ.vuongMacTraoQuyen(goi(TBP), [dich(TBP2, null, { xemGia: false })]);
        const hetQuyen = LPQ.vuongMacTraoQuyen(goi(NV), [dich(KHO, null, { xemGia: false })]);
        /* Chiều ngược: Quản trị sửa được BGĐ. */
        const qtSuaBGD = LPQ.vuongMacTraoQuyen(goi(QT), [dich(BGD, null, { xemGia: false })]);
        const chan = [tuSua, suaQT, suaBGD, suaTBP2, hetQuyen];
        return {
          duoc: chan.every((x) => x !== null) && qtSuaBGD === null,
          thucTe: `${chan.map((x) => (x ? "chặn" : "LỌT")).join(" · ")} · QT sửa BGĐ=${qtSuaBGD ?? "cho qua"}`,
          mongDoi: "chặn · chặn · chặn · chặn · chặn · QT sửa BGĐ=cho qua",
        };
      },
    );

    kiem(
      "🔴 'Phân quyền người dùng' và 'Xuất hồ sơ' KHÔNG tick được — luôn theo chức danh; hai khoá này gửi lên là bị từ chối",
      /* Soát chéo 26/09/2026: `/api/phan-quyen` (phiên tích hợp) gác gán chức danh theo CẤP, không đọc
         quyền tick → bỏ tick "Phân quyền" chỉ ẩn màn hình, máy chủ vẫn cho gán. Soát lần 2: không nút
         xuất/in nào đọc `quyen.xuatHoSo` → ô đó không chặn gì. Cả hai rút khỏi danh sách tick. */
      `${CHU} · soát chéo 26/09/2026 (máy chủ gác theo cấp · xuatHoSo không có chỗ đọc)`,
      () => {
        const coTrongDs =
          QR.KHOA_TICK.includes("phanQuyenNguoiDung") || QR.KHOA_TICK.includes("xuatHoSo");
        const ch = QR.chuanHoaQuyenRieng({ xemGia: true, phanQuyenNguoiDung: true, xuatHoSo: false });
        const biTuChoi =
          ch !== null &&
          ch.boQua.includes("phanQuyenNguoiDung") &&
          ch.boQua.includes("xuatHoSo") &&
          !("phanQuyenNguoiDung" in ch.quyen) &&
          !("xuatHoSo" in ch.quyen);
        /* Chiều BỎ: trưởng bộ phận có bản riêng ghi tắt cờ này → vẫn giữ (theo chức danh). */
        const tbp = QX.tinhQuyen({ ...TBP, quyenRieng: { xemDuocApp: true, phanQuyenNguoiDung: false } });
        /* Chiều THÊM: nhân viên có bản riêng ghi bật cờ này → vẫn không có (theo chức danh). */
        const nv = QX.tinhQuyen({ ...NV, quyenRieng: { xemDuocApp: true, phanQuyenNguoiDung: true } });
        return {
          duoc: !coTrongDs && biTuChoi && tbp.phanQuyenNguoiDung === true && nv.phanQuyenNguoiDung === false,
          thucTe: `trong DS tick=${coTrongDs} · khoá bị từ chối=${biTuChoi} · TBP giữ=${tbp.phanQuyenNguoiDung} · NV có=${nv.phanQuyenNguoiDung}`,
          mongDoi: "trong DS tick=false · khoá bị từ chối=true · TBP giữ=true · NV có=false",
        };
      },
    );

    kiem(
      "🔴 Không bỏ được 'Vào app' của người cấp ≥ 3 (kể cả Quản trị bỏ) — hai chiều",
      /* Soát chéo 26/09/2026: bỏ "Vào app" của người cấp Quản lý chỉ khoá giao diện, `/api/phan-quyen`
         vẫn cho họ gán chức danh theo cấp. Chiều ngược phải còn: bỏ của người cấp 2 được, bỏ cờ KHÁC
         của người cấp 3 được, và tick LÊN lại được. */
      `${CHU} · soát chéo 26/09/2026 (máy chủ gác theo cấp)`,
      () => {
        const boTBP = LPQ.vuongMacTraoQuyen(goi(QT), [dich(TBP, null, { xemDuocApp: false })]);
        const boNV = LPQ.vuongMacTraoQuyen(goi(QT), [dich(NV, null, { xemDuocApp: false })]);
        const boGiaTBP = LPQ.vuongMacTraoQuyen(goi(QT), [dich(TBP, null, { xemGia: false })]);
        /* Bản riêng cũ đã lỡ khoá "Vào app" của TBP → tick LÊN lại phải được. */
        const tickLai = LPQ.vuongMacTraoQuyen(goi(QT), [dich(TBP, { xemDuocApp: false }, { xemDuocApp: true })]);
        const dungCau = typeof boTBP === "string" && boTBP.includes("Muốn thu hồi thì hạ chức danh");
        return {
          duoc: dungCau && boNV === null && boGiaTBP === null && tickLai === null,
          thucTe: `bỏ vào app TBP=${boTBP ? "chặn" : "LỌT"}${dungCau ? "" : " (sai câu)"} · bỏ NV=${boNV ?? "cho qua"} · bỏ giá TBP=${boGiaTBP ?? "cho qua"} · tick lại=${tickLai ?? "cho qua"}`,
          mongDoi: "bỏ vào app TBP=chặn (đúng câu) · bỏ NV=cho qua · bỏ giá TBP=cho qua · tick lại=cho qua",
        };
      },
    );

    kiem(
      "🔴 Dấu chức danh: KHỚP thì dùng nguyên; LỆCH thì chỉ mang sang cờ ĐÃ BỊ BỎ THẬT (vòng NV→Kho→NV) — không lách được bằng đổi chức danh vòng",
      /* Soát chéo 26/09/2026: bản lưu cho chức danh cũ áp nguyên lên chức danh mới → hạ chức danh không
         hạ được quyền, và lách "chỉ trao cờ mình có" (NV → Thủ kho → lưu → NV, cờ thủ kho ở lại).
         Soát lần 2: công thức lệch đổi sang `goc && !(gocCu && !rieng)` — cờ mới của chức danh mới được
         cấp (trước đây "Lập đơn" của NV bị tắt oan chỉ vì bản thời thủ kho không có). */
      `${CHU} · soát chéo 26/09/2026 (dấu chức danh, sửa công thức lần 2)`,
      () => {
        const gocKho = QX.tinhQuyenTheoChucDanh(KHO);
        /* Bản lưu thời NV ở chức danh THỦ KHO: có ghi phiếu nhận hàng, BỎ xem NCC, được trao thêm xem giá. */
        const banKho = {
          quyen: { ...QR.rutQuyenRieng(gocKho), xemNhaCungCap: false, xemGia: true },
          theoChucDanh: QR.dauChucDanhCua(KHO),
        };
        /* Chiều KHỚP: vẫn là thủ kho → dùng nguyên (kể cả cờ vượt chức danh "Xem giá" đã được trao). */
        const khop = QX.quyenRiengConHieuLuc(banKho, KHO);
        /* Chiều LỆCH: đổi lại NV → cờ thủ kho mất; "Xem NCC" đã bị bỏ thật → vẫn bỏ; "Lập đơn" là cờ
           MỚI của NV (thủ kho không có) → được cấp; "Xem giá" NV có sẵn → có. */
        const lech = QX.quyenRiengConHieuLuc(banKho, NV);
        const hlNV = QX.tinhQuyen({ ...NV, quyenRieng: lech });
        /* THIẾU dấu → cách an toàn cũ: cờ vắng trong bản coi như đã bỏ. */
        const thieuDau = QX.quyenRiengConHieuLuc({ quyen: banKho.quyen }, NV);
        /* Lách vòng: trưởng bộ phận (không có "Ghi phiếu nhận hàng") lưu thêm cho NV đang mang bản cũ
           → cờ đó KHÔNG được coi là "có sẵn". */
        const lach = LPQ.vuongMacTraoQuyen(goi(TBP), [dich(NV, lech, { ghiPhieuNhanHang: true })]);
        return {
          duoc:
            khop.ghiPhieuNhanHang === true &&
            khop.xemGia === true &&
            lech.ghiPhieuNhanHang === false &&
            lech.xemNhaCungCap === false &&
            lech.lapPO === true &&
            hlNV.ghiPhieuNhanHang === false &&
            hlNV.xemGia === true &&
            thieuDau.lapPO === false &&
            lach !== null,
          thucTe: `khớp: phiếu=${khop.ghiPhieuNhanHang} giá=${khop.xemGia} · lệch: phiếu=${lech.ghiPhieuNhanHang} NCC=${lech.xemNhaCungCap} lập=${lech.lapPO} · NV hiệu lực: phiếu=${hlNV.ghiPhieuNhanHang} giá=${hlNV.xemGia} · thiếu dấu lập=${thieuDau.lapPO} · lách=${lach ? "chặn" : "LỌT"}`,
          mongDoi: "khớp: phiếu=true giá=true · lệch: phiếu=false NCC=false lập=true · NV hiệu lực: phiếu=false giá=true · thiếu dấu lập=false · lách=chặn",
        };
      },
    );

    kiem(
      "🔴 NÂNG chức danh (NV → Trưởng BP) được ĐỦ cờ của chức danh mới, TRỪ cờ đã bị bỏ ở bản cũ",
      /* Soát chéo lần 2 26/09/2026: công thức cũ `goc && rieng` làm người được nâng mất luôn "Giao việc"
         (bản thời NV không có) — nâng mà không nâng. */
      `${CHU} · soát chéo lần 2 26/09/2026`,
      () => {
        const gocNV = QX.tinhQuyenTheoChucDanh(NV);
        const banNV = { quyen: { ...QR.rutQuyenRieng(gocNV), xemGia: false }, theoChucDanh: QR.dauChucDanhCua(NV) };
        const hl = QX.tinhQuyen({ ...TBP, quyenRieng: QX.quyenRiengConHieuLuc(banNV, TBP) });
        return {
          duoc: hl.phanBoCongViec && hl.xacNhanTruongBP && hl.suaPODaChot && !hl.xemGia && hl.lapPO,
          thucTe: `giao việc=${hl.phanBoCongViec} xác nhận TBP=${hl.xacNhanTruongBP} sửa đơn chốt=${hl.suaPODaChot} · giá (đã bỏ)=${hl.xemGia} · lập đơn=${hl.lapPO}`,
          mongDoi: "giao việc=true xác nhận TBP=true sửa đơn chốt=true · giá (đã bỏ)=false · lập đơn=true",
        };
      },
    );

    kiem(
      "Dấu chức danh: capKho vắng / 0 / undefined là MỘT; capKho có mặt mà sai khuôn → coi như thiếu dấu (không đoán 0)",
      `${CHU} · soát chéo lần 2 26/09/2026`,
      () => {
        const vang = QR.chuanHoaDauChucDanh({ chucNang: "nhan_vien_thu_mua", vaiTro: "staff", capTM: 2 });
        const khong = QR.chuanHoaDauChucDanh({ chucNang: "nhan_vien_thu_mua", vaiTro: "staff", capTM: 2, capKho: 0 });
        const sai = QR.chuanHoaDauChucDanh({ chucNang: "nhan_vien_thu_mua", vaiTro: "staff", capTM: 2, capKho: "2" });
        const ndKhongCapKho = { ...NV, capKho: undefined };
        const khop1 = QR.khopDauChucDanh(vang, QR.dauChucDanhCua(ndKhongCapKho));
        const khop2 = QR.khopDauChucDanh(khong, QR.dauChucDanhCua(NV));
        const lechKho = QR.khopDauChucDanh(khong, QR.dauChucDanhCua({ ...NV, capKho: 2 }));
        return {
          duoc: khop1 && khop2 && sai === undefined && !lechKho,
          thucTe: `vắng~undefined=${khop1} · 0~0=${khop2} · sai khuôn=${sai === undefined ? "thiếu dấu" : "ĐOÁN"} · 0 vs 2=${lechKho ? "KHỚP NHẦM" : "lệch"}`,
          mongDoi: "vắng~undefined=true · 0~0=true · sai khuôn=thiếu dấu · 0 vs 2=lệch",
        };
      },
    );

    kiem(
      "🔴 Người cấp ≥ 3 luôn còn 'Vào app' + 'Phân quyền' dù bản riêng cũ đã tắt (bị bỏ lúc cấp 2 rồi được nâng) — chiều ngược: cấp 2 vẫn khoá được",
      /* Soát chéo lần 2 26/09/2026: người bị bỏ "Vào app" lúc cấp 2 rồi được nâng lên cấp ≥ 3 → dây
         chuyền tắt luôn `phanQuyenNguoiDung` trên giao diện, trong khi `/api/phan-quyen` vẫn cho họ gán
         chức danh theo cấp. `apDungQuyenRieng` ⑤ ép "Vào app" bật cho người chức danh có quyền phân quyền. */
      `${CHU} · soát chéo lần 2 26/09/2026 (máy chủ gác theo cấp)`,
      () => {
        const tbp = QX.tinhQuyen({ ...TBP, quyenRieng: { xemDuocApp: false } });
        const nv = QX.tinhQuyen({ ...NV, quyenRieng: { xemDuocApp: false } });
        const conBatNV = Object.entries(nv).filter(([, v]) => v).map(([k]) => k);
        /* Đúng kịch bản: bản thời NV đã khoá hết, rồi hồ sơ được nâng lên TBP. */
        const banNVKhoa = { quyen: {}, theoChucDanh: QR.dauChucDanhCua(NV) };
        const nang = QX.tinhQuyen({ ...TBP, quyenRieng: QX.quyenRiengConHieuLuc(banNVKhoa, TBP) });
        return {
          duoc:
            tbp.xemDuocApp && tbp.phanQuyenNguoiDung && !tbp.xemGia && conBatNV.length === 0 &&
            nang.xemDuocApp && nang.phanQuyenNguoiDung,
          thucTe: `TBP bản tắt: vào=${tbp.xemDuocApp} phân quyền=${tbp.phanQuyenNguoiDung} giá=${tbp.xemGia} · NV bản tắt còn bật=[${conBatNV}] · nâng NV→TBP: vào=${nang.xemDuocApp} phân quyền=${nang.phanQuyenNguoiDung}`,
          mongDoi: "TBP bản tắt: vào=true phân quyền=true giá=false · NV bản tắt còn bật=[] · nâng NV→TBP: vào=true phân quyền=true",
        };
      },
    );

    kiem(
      "★ Cờ chức danh đã cho sẵn: Quản trị bỏ rồi trưởng bộ phận BẬT LẠI được (không tính là trao)",
      /* Sếp chốt 26/09/2026, nguyên văn "Có được bật lại quyền". Chiều ngược: cờ chức danh KHÔNG cho mà
         trưởng bộ phận không có thì vẫn chặn (đã canh ở bài chống leo quyền). */
      `Sếp · 26/09/2026 · "Có được bật lại quyền"`,
      () => {
        const gocKho = QX.tinhQuyenTheoChucDanh(KHO);
        /* Quản trị đã bỏ "Ghi phiếu nhận hàng" của thủ kho (bản riêng dấu thủ kho). */
        const banQT = { quyen: { ...QR.rutQuyenRieng(gocKho), ghiPhieuNhanHang: false }, theoChucDanh: QR.dauChucDanhCua(KHO) };
        const riengCu = QX.quyenRiengConHieuLuc(banQT, KHO);
        const batLai = LPQ.vuongMacTraoQuyen(goi(TBP), [dich(KHO, riengCu, { ghiPhieuNhanHang: true })]);
        const vuotChucDanh = LPQ.vuongMacTraoQuyen(goi(TBP), [dich(KHO, riengCu, { xacNhanTruongBP: true, ghiPhieuNhanHang: true })]);
        return {
          duoc: batLai === null && vuotChucDanh === null,
          thucTe: `bật lại phiếu=${batLai ?? "cho qua"} · kèm cờ TBP có (xác nhận TBP)=${vuotChucDanh ?? "cho qua"}`,
          mongDoi: "cả hai cho qua (TBP có 'Xác nhận TBP' nên trao được; 'Ghi phiếu' là cờ chức danh đã cho)",
        };
      },
    );

    /* ★ MỌI Ô TICK PHẢI CÓ CHỖ ĐỌC THẬT — soát chéo lần 2 26/09/2026. Ô tick mà không nút/màn nào đọc cờ
       đó là giao diện hứa một việc app không làm (đã gặp: `xuatHoSo`). Quét MÃ NGUỒN (bỏ chú thích,
       không tin `grep` thô — chú thích nhắc tên cờ không phải chỗ đọc). Tính cả hàm trong `quyen.ts`
       (`duocVaoDuongDan`) và `quyen-theo-ho-so.ts`, vì chúng được giao diện/tầng ghi gọi thật; bỏ các tệp
       chỉ để PHÂN QUYỀN (màn phân quyền, luật tick) vì chúng đọc cờ để hiện chứ không để gác. */
    kiem(
      "★ Mọi ô tick được đều có ít nhất một chỗ ĐỌC THẬT trong mã nguồn (không phải chú thích)",
      `${CHU} · soát chéo lần 2 26/09/2026 (xuatHoSo từng không có chỗ đọc)`,
      () => {
        const fs = nap("node:fs");
        const THU_MUC = ["1-giao-dien", "2-quy-trinh", "3-du-lieu", "4-phan-quyen", "app", "5-ket-noi", "6-tien-ich"];
        const BO = new Set([
          "4-phan-quyen/quyen-rieng.ts",
          "4-phan-quyen/quyen-rieng-ket-noi.ts",
          "4-phan-quyen/luat-phan-quyen.ts",
          "4-phan-quyen/vai-tro-chuan.ts",
          "4-phan-quyen/nguoi-dung-hien-tai.tsx",
          "1-giao-dien/trang/phan-quyen.tsx",
          "app/api/quyen-rieng/route.ts",
        ]);
        const tep = [];
        const di = (d) => {
          for (const t of fs.readdirSync(d)) {
            const p = `${d}/${t}`;
            if (t === "node_modules" || t === "nen-tang-ui") continue;
            if (fs.statSync(p).isDirectory()) di(p);
            else if (/\.(ts|tsx)$/.test(t) && !BO.has(p)) tep.push(p);
          }
        };
        THU_MUC.filter((d) => fs.existsSync(d)).forEach(di);
        const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");
        const coDoc = new Set();
        for (const p of tep) {
          const s = boChuThich(fs.readFileSync(p, "utf8"));
          for (const m of s.matchAll(/\b(?:quyen|q)\??\.(\w+)\b|tinhQuyen\([^)]*\)\.(\w+)/g)) coDoc.add(m[1] ?? m[2]);
        }
        const thieu = QR.KHOA_TICK.filter((k) => !coDoc.has(k));
        /* Chốt dương tính: cờ chắc chắn có chỗ đọc phải được tìm thấy — nếu không, phép quét hỏng. */
        const quetDuoc = coDoc.has("xemGia") && coDoc.has("lapPO") && tep.length > 50;
        return {
          duoc: quetDuoc && thieu.length === 0,
          thucTe: quetDuoc ? `ô tick không chỗ đọc: [${thieu.join(", ")}]` : `phép quét hỏng (${tep.length} tệp)`,
          mongDoi: "ô tick không chỗ đọc: [] — rút ô nào không có chỗ đọc khỏi CO_TICK_DUOC",
        };
      },
    );

    // ── Sếp 26/09/2026 "Nối vào ô tíck": quyền theo từng hồ sơ + danh sách Giao việc ──
    if (QTH && VTC) {
      const CHU_G = 'Sếp · 26/09/2026 · "Nối vào ô tíck" (quyền theo hồ sơ + Giao việc)';
      /** Đề nghị tối giản: loại hồ sơ + có chia việc cho `uidChia` hay không. */
      const dnThu = (loaiHoSo, uidChia) => ({
        loaiHoSo,
        items: [{ stt: 1, nguoiPhuTrachUid: uidChia }],
        nguoiTheoDoi: [],
      });
      const ndTuVaiTro = (v, uid) => ({
        uid,
        tenHienThi: uid,
        chucDanh: "",
        phongBan: "",
        chucNang: v.chucNang,
        vaiTro: v.vaiTro,
        capTM: v.capTM,
        capKho: v.capKho,
      });

      kiem(
        "🔴 CHƯA có quyền riêng → ba quyền theo hồ sơ Y HỆT luật cũ theo chức danh, với MỌI chức danh chuẩn",
        /* Không ai mất quyền khi deploy. So với luật cũ viết lại ngay trong bài kiểm:
           người thu mua = cấp ≥ 2 và (NV/Trưởng BP Thu mua hoặc được chia việc); ghi nhận giao hàng =
           ghiPhieuNhanHang hoặc (hồ sơ phòng ban và người thu mua). */
        CHU_G,
        () => {
          const lech = [];
          for (const v of VTC.VAI_TRO_CHUAN) {
            for (const coRiengNull of [false, true]) {
              const nd = { ...ndTuVaiTro(v, "x"), ...(coRiengNull ? { quyenRieng: null } : {}) };
              const q = QX.tinhQuyen(nd);
              for (const loai of ["phong_ban", "cong_trinh"]) {
                for (const chia of [true, false]) {
                  const dn = dnThu(loai, chia ? "x" : "khac");
                  const ntm =
                    nd.capTM >= 2 &&
                    (nd.chucNang === "nhan_vien_thu_mua" || nd.chucNang === "truong_bo_phan_thu_mua" || chia);
                  const cu = [ntm, ntm, q.ghiPhieuNhanHang || (loai === "phong_ban" && ntm)];
                  const moi = [
                    QTH.duocXacNhanNhanDuHangCuaHoSo(dn, nd),
                    QTH.duocGhiDoiChieuThuMua(dn, nd),
                    QTH.duocGhiNhanGiaoHangCuaHoSo(dn, nd, q),
                  ];
                  if (cu.some((x, i) => x !== moi[i])) lech.push(`${v.ma}/${loai}/${chia ? "chia" : "-"}`);
                }
              }
            }
          }
          return {
            duoc: lech.length === 0,
            thucTe: lech.length === 0 ? "khớp hết" : `LỆCH: ${lech.slice(0, 6).join(" · ")}`,
            mongDoi: "khớp hết (người chưa có quyền riêng không đổi hành vi)",
          };
        },
      );

      kiem(
        "🔴 Bỏ tick 'Lập đơn mua hàng' → mất xác nhận nhận đủ / đối chiếu / ghi nhận giao hàng phòng ban; tick lại → có lại (hai chiều)",
        /* Cờ chọn là `lapPO` ("đang LÀM thu mua"), KHÔNG phải `xacNhanKho` (Sếp 17/09 đã gỡ cờ kho khỏi
           luật này) hay `ghiPhieuNhanHang` (cờ thủ kho). Chiều cuối: thủ kho vẫn ghi nhận nhờ cờ riêng
           của họ, không bị ô "Lập đơn" kéo theo. */
        CHU_G,
        () => {
          const dn = dnThu("phong_ban", "nv");
          const mauNV = QR.rutQuyenRieng(QX.tinhQuyenTheoChucDanh(NV));
          const boLap = { ...NV, quyenRieng: { ...mauNV, lapPO: false } };
          const coLap = { ...NV, quyenRieng: { ...mauNV } };
          const ba = (n) => [
            QTH.duocXacNhanNhanDuHangCuaHoSo(dn, n),
            QTH.duocGhiDoiChieuThuMua(dn, n),
            QTH.duocGhiNhanGiaoHangCuaHoSo(dn, n, QX.tinhQuyen(n)),
          ];
          const kqBo = ba(boLap);
          const kqCo = ba(coLap);
          const mauKho = QR.rutQuyenRieng(QX.tinhQuyenTheoChucDanh(KHO));
          const kho = { ...KHO, quyenRieng: { ...mauKho, lapPO: false } };
          const khoGhi = QTH.duocGhiNhanGiaoHangCuaHoSo(dnThu("cong_trinh", "khac"), kho, QX.tinhQuyen(kho));
          return {
            duoc: kqBo.every((x) => x === false) && kqCo.every((x) => x === true) && khoGhi === true,
            thucTe: `bỏ lập đơn=[${kqBo}] · có lập đơn=[${kqCo}] · thủ kho ghi nhận=${khoGhi}`,
            mongDoi: "bỏ lập đơn=[false,false,false] · có lập đơn=[true,true,true] · thủ kho ghi nhận=true",
          };
        },
      );

      kiem(
        "🔴 Danh sách Giao việc: người bị bỏ 'Vào app' bị LỌC RA; chưa có quyền riêng / cấp ≥ 3 thì KHÔNG bị lọc (hai chiều)",
        /* Máy chủ `/api/quyen-rieng?biKhoa=1` dùng đúng `nguoiBiKhoaVaoApp` để lập danh sách lọc cho
           `bang-phan-bo.tsx`. Cấp ≥ 3 luôn còn "Vào app" (`apDungQuyenRieng` ⑤) nên không bị lọc. */
        CHU_G,
        () => {
          const khoaNV = QX.nguoiBiKhoaVaoApp(NV, { quyen: {}, theoChucDanh: QR.dauChucDanhCua(NV) });
          const chuaCo = QX.nguoiBiKhoaVaoApp(NV, null);
          const moNV = QX.nguoiBiKhoaVaoApp(NV, {
            quyen: QR.rutQuyenRieng(QX.tinhQuyenTheoChucDanh(NV)),
            theoChucDanh: QR.dauChucDanhCua(NV),
          });
          const tbp = QX.nguoiBiKhoaVaoApp(TBP, { quyen: {}, theoChucDanh: QR.dauChucDanhCua(TBP) });
          /* Bản cũ thời thủ kho đã khoá, nay là NV → vẫn khoá (cờ đã bị bỏ thật mang sang). */
          const khoaCu = QX.nguoiBiKhoaVaoApp(NV, { quyen: {}, theoChucDanh: QR.dauChucDanhCua(KHO) });
          return {
            duoc: khoaNV && !chuaCo && !moNV && !tbp && khoaCu,
            thucTe: `NV bị khoá=${khoaNV} · chưa có bản=${chuaCo} · NV mở=${moNV} · TBP bản tắt=${tbp} · bản cũ thời kho=${khoaCu}`,
            mongDoi: "NV bị khoá=true · chưa có bản=false · NV mở=false · TBP bản tắt=false · bản cũ thời kho=true",
          };
        },
      );
    }
  }
}

const tong = dat + truot.length;
console.log("");
if (truot.length === 0) {
  console.log(`${XANH}✓ ${dat}/${tong} luật trong tệp dùng chung còn nguyên hiệu lực.${HET}`);
  console.log(
    `${XAM}  Đo bằng cách GỌI THẬT hàm — chú thích không chạy được nên không lừa được phép kiểm này.${HET}\n`,
  );
  process.exit(0);
}

console.error(`${DO}${"═".repeat(78)}${HET}`);
console.error(`${DO}  ⛔ ${truot.length}/${tong} LUẬT ĐÃ MẤT HIỆU LỰC${HET}`);
console.error(`${DO}${"═".repeat(78)}${HET}\n`);
for (const t of truot) {
  console.error(`${DO}✗ ${t.ten}${HET}`);
  console.error(`  ${VANG}luật của:${HET} ${t.chu}`);
  console.error(`  ${XAM}mong đợi:${HET} ${t.mongDoi}`);
  console.error(`  ${XAM}thực tế :${HET} ${t.thucTe}\n`);
}
console.error(
  `${VANG}🔴 Nếu dòng đỏ ghi "luật của: phiên tích hợp" thì bạn vừa xoá code của họ.${HET}`,
);
console.error(
  `${XAM}   Lấy lại bằng:  git -C C:/Users/trand/hpcons-thumua-github show FETCH_HEAD:"<tệp>"${HET}`,
);
console.error(
  `${XAM}   ĐỪNG chữa bằng cách sửa bài kiểm cho vừa mã nguồn — bài kiểm đang ghi lại một chỉ\n   đạo có thật, sửa nó là xoá dấu vết của chỉ đạo đó.${HET}\n`,
);
process.exit(1);
