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

/* ★★ TÊN HIỂN THỊ TRÊN THẺ KANBAN — Sếp 15/09/2026: *"khi nhân bản thì tên tiêu đề này cũng phải
   hiển thị luôn chư (copy..)"*. Luật ghép tên đã dời ra khỏi tệp giao diện để canh được. */
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

const nap = createRequire(import.meta.url);
const M = nap(tepRa);
const G = nap(tepRa2);
const AR = nap(tepRa6);
const KD = nap(tepRa7);
const HS = nap(tepRa8);
const NB = nap(tepRa9);
const TT = nap(tepRa10);
const CQ = nap(tepRa11);
const QLK = nap(tepRa12);
const NH = nap(tepRa14);
const GB = nap(tepRa15);

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
    /* Ban lãnh đạo 24/08 yêu cầu tối giản ký tự -> bản ngắn dùng số bước khoanh tròn.
       ⚠️ Là bước ⑤ chứ không phải ④: cùng ngày 24/08 Ban lãnh đạo chuyển ô Hợp đồng sang bước
       "Tiến hành đặt hàng" (*"Hợp đồng mua hàng em đưa sang bước tiến hành đặt hàng"*). Đây là
       ĐỔI YÊU CẦU, không phải sửa bài kiểm cho vừa mã nguồn. */
    const coNhacBuoc5 = ds.some((m) => m.startsWith("⑤"));
    return {
      duoc: coNhacBuoc5,
      thucTe: ds.length === 0 ? "[] (THẺ TRẮNG TRƠN — đúng lỗi đã báo)" : JSON.stringify(ds),
      mongDoi: 'có ít nhất một mục nhắc bước ⑤ (Tiến hành đặt hàng)',
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
       thẻ mất luôn dòng "⑤ thiếu HĐ" — chính thứ Sếp yêu cầu GIỮ. Nên đòi thêm dòng đó. */
    const conHopDong = bay.some((m) => m.includes("HĐ"));
    return {
      duoc: conHoaDon.length === 0 && conHopDong,
      thucTe: JSON.stringify(bay),
      mongDoi:
        'không còn mục nào nhắc hoá đơn, nhưng VẪN còn mục "⑤ thiếu HĐ" (Hợp đồng — Sếp yêu cầu giữ)',
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
    const gomNhan = (dn) =>
      (G.mucConNoCuaBuoc(dn, "dat_hang", cauHinh, [], []) ?? [])
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

kiem(
  'Khai "Khong co HD" van KHONG dong duoc ho so (loi khai khong thay duoc chung tu)',
  'Sep · 14/09/2026 — *"2 loai nay DEU phai dinh kem hop dong"*, ke ca don mau PO-02',
  () => {
    /* 🔴 BAI KIEM QUAN TRONG NHAT CUA LUAT NAY. Neu ai doi `coHopDong` thanh
       `vuongMacRoiBuocLapDon` cho "thong nhat voi buoc ④" thi bai TREN van xanh (ho so do khong
       ghi ly do gi), chi bai nay bat duoc. */
    const CT = nap(join(thuMuc, "chung-tu.cjs"));
    const r = CT.vuongMacHoanThanhQuyTrinh(
      hoSoSanSangDong(CT.LY_DO_KHONG_CO_HOP_DONG, false),
      tienDoXong,
    );
    return {
      duoc: typeof r === "string" && /h[ợo]p đ[ồo]ng/i.test(r),
      thucTe: r === null ? "null (LOT — loi khai da thay duoc chung tu!)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "van chan, vi loi khai khong thay duoc tep",
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
// ★★★ SỬA ĐƠN HÀNG KHÔNG ĐƯỢC ĐI VÒNG QUA KIỂM SOÁT CHI TIÊU — Sếp 15/09/2026
//
// Rà soát 15/09/2026 tìm ra: `suaDonHang` cho thêm mặt hàng + số lượng + đơn giá TÙY Ý vào một PO
// ĐÃ CHỐT — không gọi `vuongMacLapDonHang`, không đối chiếu khối lượng đã duyệt của đề nghị.
//
// 🔴 HẬU QUẢ KÉP, và vế thứ hai mới là vế nguy: dòng thêm tay mang `sttDongDeNghi: undefined`, mà
//    `tinhTienDoDeNghi` gom khối lượng THEO `sttDongDeNghi`. Nên tiền của đơn tăng ngay, còn đề
//    nghị gốc **vẫn báo khối lượng đó "chưa lên PO"** → người khác lập tiếp một PO nữa cho cùng
//    phần việc. Đặt trùng, không màn hình nào báo.
//
// ⚠️ BỘ NÀY PHẢI "KHÔNG RỖNG NGHĨA" THEO CẢ HAI CHIỀU:
//    · `return null` vô điều kiện  → các bài "phải chặn" đỏ
//    · chặn vô điều kiện           → các bài "không được chặn" đỏ (đơn đang chạy sẽ kẹt cứng)
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
/** Dòng PO KHÔNG trỏ về đề nghị nào — kiểu dòng mà lỗ hổng này cho phép thêm tùy ý. */
const dongMoCoi = (sttDong, khoiLuongDat, ten = "Máy phát điện") => ({
  sttDong,
  tenVatLieu: ten,
  donViTinh: "cái",
  khoiLuongDat,
});

kiem(
  "THÊM dòng mới không gắn đề nghị vào PO đã chốt → CHẶN",
  "Sếp · 15/09/2026 — lỗ hổng kiểm soát chi tiêu ở tầng ghi `suaDonHang`",
  () => {
    /* 🔴 BÀI QUAN TRỌNG NHẤT CỦA LUẬT NÀY. Đây đúng thao tác đã đo được là đi vòng qua chốt duyệt
       giá: bấm "Sửa đơn hàng" → "Thêm dòng" → gõ mặt hàng và giá → lưu. */
    const r = KD.vuongMacSuaDongPOTheoDeNghi(
      [dongTheoDN(1, 100)],
      [dongTheoDN(1, 100), dongMoCoi(2, 1)],
      tienDoDN(0),
    );
    return {
      duoc: typeof r === "string" && r !== "",
      thucTe: r === null ? "null (LỌT — thêm được mặt hàng chưa ai duyệt vào đơn đã chốt!)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "một câu lý do",
    };
  },
);

kiem(
  "TĂNG số lượng vượt phần đã duyệt → CHẶN",
  "Sếp · 15/09/2026 — đặt quá khối lượng đề nghị cũng là tiêu tiền chưa ai duyệt",
  () => {
    /* Đề nghị đã lên PO hết 100 (`conLai = 0`), đơn này đang giữ đúng 100 → ngân sách là 100.
       Sửa lên 150 là mua thêm 50 kg không có đề nghị nào đứng sau. */
    const r = KD.vuongMacSuaDongPOTheoDeNghi([dongTheoDN(1, 100)], [dongTheoDN(1, 150)], tienDoDN(0));
    return {
      duoc: typeof r === "string" && r !== "",
      thucTe: r === null ? "null (LỌT — đặt vượt phần đã duyệt)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "một câu lý do",
    };
  },
);

kiem(
  "CẮT một dòng đề nghị thành HAI dòng PO, tổng vượt → vẫn CHẶN",
  "Sếp · 15/09/2026 — chống lách bằng cách chia nhỏ dòng",
  () => {
    /* 🔴 BÀI NÀY GIỮ MỘT QUYẾT ĐỊNH THIẾT KẾ, đừng "dọn cho gọn" thành xét lẻ từng dòng: một dòng
       đề nghị ĐƯỢC PHÉP cắt thành nhiều dòng PO (giao nhiều đợt). Xét lẻ thì hai dòng mỗi dòng
       "vừa đủ phần còn lại" đều lọt, cộng lại thành gấp đôi phần đã duyệt. */
    const r = KD.vuongMacSuaDongPOTheoDeNghi(
      [dongTheoDN(1, 100)],
      [dongTheoDN(1, 100), dongTheoDN(2, 20)],
      tienDoDN(0),
    );
    return {
      duoc: typeof r === "string" && r !== "",
      thucTe: r === null ? "null (LỌT — chia nhỏ dòng là lách được)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "một câu lý do",
    };
  },
);

kiem(
  "TĂNG khối lượng một dòng CŨ không gắn đề nghị → CHẶN",
  "Sếp · 15/09/2026 — dòng mồ côi được giữ, nhưng không được phình ra",
  () => {
    const r = KD.vuongMacSuaDongPOTheoDeNghi(
      [dongTheoDN(1, 100), dongMoCoi(2, 1)],
      [dongTheoDN(1, 100), dongMoCoi(2, 5)],
      tienDoDN(0),
    );
    return {
      duoc: typeof r === "string" && r !== "",
      thucTe: r === null ? "null (LỌT — lách bằng cách thổi số lượng một dòng có sẵn)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "một câu lý do",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: bảng mặt hàng không đổi → KHÔNG được chặn",
  "Sếp · 15/09/2026 — chặn quá tay là mọi đơn đang chạy hết sửa được",
  () => {
    /* 🔴 BÀI CHỐNG "CHẶN VÔ ĐIỀU KIỆN". `khoiLuongChuaLenPO` do `tinhTienDoDeNghi` trả về ĐÃ TRỪ
       phần đơn này đang giữ — quên cộng ngược lại là mở hộp sửa rồi bấm lưu mà không đổi gì cũng
       bị chặn, tức luật đúng biến thành luật khoá cứng. */
    const r = KD.vuongMacSuaDongPOTheoDeNghi([dongTheoDN(1, 100)], [dongTheoDN(1, 100)], tienDoDN(0));
    return {
      duoc: r === null,
      thucTe: r === null ? "null (sửa được)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "null",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: tăng số lượng TRONG phần đề nghị còn lại → KHÔNG được chặn",
  "Sếp · 15/09/2026 — còn khối lượng đã duyệt thì phải đặt thêm được",
  () => {
    // Đề nghị còn 20 kg chưa lên PO, đơn đang giữ 100 → được phép nâng tới 120.
    const r = KD.vuongMacSuaDongPOTheoDeNghi([dongTheoDN(1, 100)], [dongTheoDN(1, 120)], tienDoDN(20));
    return {
      duoc: r === null,
      thucTe: r === null ? "null (đặt thêm được)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "null",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: dòng CŨ không gắn đề nghị, giữ nguyên → KHÔNG được chặn",
  "Sếp · 15/09/2026 — dữ liệu chạy thử có sẵn dòng như vậy, chặn tiệt là khoá cứng đơn cũ",
  () => {
    /* Đơn lập tay thời kỳ đầu / nhập từ Excel có dòng thiếu `sttDongDeNghi`. Chặn tiệt thì mở hộp
       sửa để đổi một số điện thoại cũng không lưu nổi. */
    const r = KD.vuongMacSuaDongPOTheoDeNghi(
      [dongTheoDN(1, 100), dongMoCoi(2, 1)],
      [dongTheoDN(1, 100), dongMoCoi(2, 1)],
      tienDoDN(0),
    );
    return {
      duoc: r === null,
      thucTe: r === null ? "null (đơn cũ vẫn sửa được)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "null",
    };
  },
);

kiem(
  "CHIỀU NGƯỢC: đặt ĐÚNG BẰNG phần còn lại (số lẻ) → KHÔNG được chặn",
  "Sếp · 15/09/2026 — chống chặn oan vì sai số dấu phẩy động",
  () => {
    /* `0.1 + 0.2 = 0.30000000000000004` trong JavaScript. Ai bỏ `NGUONG_LECH_KHOI_LUONG` thì bài
       này đỏ, và ngoài đời người dùng nhìn hai con số y hệt nhau mà app nói "vượt". */
    const r = KD.vuongMacSuaDongPOTheoDeNghi(
      [dongTheoDN(1, 0.1)],
      [dongTheoDN(1, 0.1 + 0.2)],
      tienDoDN(0.2),
    );
    return {
      duoc: r === null,
      thucTe: r === null ? "null (không chặn oan)" : `"${String(r).slice(0, 90)}"`,
      mongDoi: "null",
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

kiem(
  "Muc 4 CO tep PO da ky -> bay DUNG TEP do (khong phai to in)",
  CHU_SEP_PO_KY,
  () => {
    const BH = nap(join(thuMuc, "bo-ho-so.cjs"));
    const m = muc4(dnBoHoSo([tepPOKy]));
    const dung = m?.tep?.length === 1 && m.tep[0].id === "poky1" && BH.mucDaCo(m) === true;
    return {
      duoc: dung,
      thucTe: `tep=${JSON.stringify(m?.tep?.map((t) => t.id) ?? null)} · mucDaCo=${m ? BH.mucDaCo(m) : "KHONG CO MUC 4"}`,
      mongDoi:
        'muc 4 tra ve dung tep "DMH260007-da-ky.pdf" (doc qua tepHopDong: khoa lap_don_mua_hang + nhan "Hợp đồng") va tinh la DA CO',
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

kiem(
  "dungBoHoSoThanhToan VAN tra DU 8 MUC, dung 8 khoa (hop dong du lieu voi app Ke toan)",
  "Ban lãnh đạo 26/08/2026 + Sếp 15/09/2026 — bộ chuyển sang app Kế toán không được hụt khoá nào",
  () => {
    /* 🔴 CHIỀU NGHỊCH CỦA CẢ LƯỢT SỬA HÔM NAY. Việc bỏ liên kết in và bỏ hai dòng ghi chú là việc
       HIỂN THỊ; ai nhân đà "dọn cho gọn" ở tầng dữ liệu thì bên nhận mất một khoá mà KHÔNG CÓ GÌ
       BÁO — đúng loại lỗi cả tệp `bo-ho-so-thanh-toan.ts` sinh ra để tránh. */
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
    ];
    const stt = ds.map((m) => m.stt).join(",");
    return {
      duoc: khoa.length === 8 && khoa.every((k, i) => k === mongDoi[i]) && stt === "1,2,3,4,5,6,7,8",
      thucTe: `${khoa.length} mục: ${khoa.join(" · ")} (stt ${stt})`,
      mongDoi: `8 mục đúng thứ tự: ${mongDoi.join(" · ")} (stt 1..8)`,
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

/* ---------- Kết quả ---------- */
rmSync(thuMuc, { recursive: true, force: true });

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
