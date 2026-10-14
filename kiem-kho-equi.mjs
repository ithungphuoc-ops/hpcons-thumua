// ============================================================
// KIỂM KHO EQUI — BẰNG HÀNH VI (Sếp duyệt demo 14/10/2026)
//
// Gọi THẬT các hàm chọn kho / tiền tố / cổng quyền, đòi kết quả đúng. Chạy:  npm run kiem-kho-equi
//
// 🔴 Mục tiêu số 1: KHO THƯỜNG KHÔNG ĐỔI GÌ so với trước khi có EQUI (đường dẫn Firestore, khoá
// localStorage, địa chỉ). Hỏng một trong các điều đó là người đang dùng kho thường mất dữ liệu.
// Mục tiêu số 2: hai kho KHÔNG BAO GIỜ trỏ cùng một chỗ lưu.
// ============================================================
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const DO = "\u001b[31m", XANH = "\u001b[32m", HET = "\u001b[0m";
const thuMuc = mkdtempSync(join(tmpdir(), "kiem-kho-equi-"));
const dung = (nguon, ten) => {
  const ra = join(thuMuc, ten);
  execSync(`npx --yes esbuild "${nguon}" --bundle --platform=node --format=cjs --outfile="${ra}" --log-level=error`, {
    stdio: ["ignore", "pipe", "pipe"], encoding: "utf8",
  });
  return createRequire(import.meta.url)(ra);
};

let K, Q;
try {
  K = dung("3-du-lieu/kho-id.ts", "kho-id.cjs");
  Q = dung("4-phan-quyen/quyen.ts", "quyen.cjs");
} catch (e) {
  console.error(`${DO}⛔ Không dựng được mã để kiểm:${HET}`, String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}

let dat = 0; const hong = [];
const kiem = (ten, ok, chiTiet = "") => { if (ok) dat++; else hong.push(`${ten} ${chiTiet}`); };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ① KHO THƯỜNG GIỮ NGUYÊN — đường dẫn, khoá máy, mặc định */
kiem("kho thường: đường dẫn kho chung giữ nguyên", eq(K.duongDanKhoChung("thuong"), { boSuuTap: "chay-thu", tep: "du-lieu-chung" }));
kiem("kho thường: đường dẫn thanh toán giữ nguyên", eq(K.duongDanKhoThanhToan("thuong"), { boSuuTap: "chay-thu", tep: "thanh-toan" }));
kiem("kho thường: hậu tố khoá máy RỖNG (giữ khoá cũ)", K.hauToKhoaMay("thuong") === "");
kiem("mặc định là kho thường", K.KHO_MAC_DINH === "thuong");

/* ② HAI KHO KHÔNG TRỎ CÙNG MỘT CHỖ */
kiem("hai kho: tài liệu chung khác nhau", K.duongDanKhoChung("thuong").tep !== K.duongDanKhoChung("equi").tep);
kiem("hai kho: tài liệu thanh toán khác nhau", K.duongDanKhoThanhToan("thuong").tep !== K.duongDanKhoThanhToan("equi").tep);
kiem("hai kho: khoá máy khác nhau", K.hauToKhoaMay("thuong") !== K.hauToKhoaMay("equi"));
kiem("kho EQUI vẫn trong bộ sưu tập chay-thu (rules hiện hành phủ)", K.duongDanKhoChung("equi").boSuuTap === "chay-thu" && K.duongDanKhoThanhToan("equi").boSuuTap === "chay-thu");
kiem("EQUI: không đè lên tài liệu nào của kho thường", ![K.duongDanKhoChung("thuong").tep, K.duongDanKhoThanhToan("thuong").tep].includes(K.duongDanKhoChung("equi").tep));

/* ③ CHUẨN HOÁ GIÁ TRỊ LẠ → kho thường (an toàn) */
for (const x of [undefined, null, "", "EQUI", "Equi", "abc", 1, {}, "thuong "]) kiem(`chuanHoaKhoId(${JSON.stringify(x)}) → thuong`, K.chuanHoaKhoId(x) === "thuong");
kiem("chuanHoaKhoId('equi') → equi", K.chuanHoaKhoId("equi") === "equi");

/* ④ KHO THEO ĐỊA CHỈ — khớp theo ĐOẠN */
const khoDiaChi = [
  ["/equi", "equi"], ["/equi/de-nghi", "equi"], ["/equi/don-hang/abc", "equi"], ["/equi/in/don-hang/x", "equi"],
  ["/de-nghi", "thuong"], ["/", "thuong"], ["/equipment", "thuong"], ["/equi-x/de-nghi", "thuong"], ["/in/don-hang/x", "thuong"],
  ["/tong-quan", "thuong"], ["", "thuong"], [null, "thuong"], [undefined, "thuong"],
];
for (const [d, kq] of khoDiaChi) kiem(`khoTheoDuongDan(${JSON.stringify(d)}) = ${kq}`, K.khoTheoDuongDan(d) === kq, `được ${K.khoTheoDuongDan(d)}`);

/* ⑤ TIỀN TỐ ĐỊA CHỈ */
const tt = (h, kho = "equi") => K.themTienToKho(h, kho);
const bang = [
  ["/de-nghi", "/equi/de-nghi"], ["/de-nghi/123", "/equi/de-nghi/123"], ["/de-nghi/123-copy1?x=1#neo", "/equi/de-nghi/123-copy1?x=1#neo"],
  ["/don-hang", "/equi/don-hang"], ["/don-hang/p1", "/equi/don-hang/p1"], ["/don-hang/tao-moi?prId=a", "/equi/don-hang/tao-moi?prId=a"],
  ["/phan-bo", "/equi/phan-bo"], ["/theo-doi/xyz", "/equi/theo-doi/xyz"], ["/in/don-hang/p1", "/equi/in/don-hang/p1"],
  /* dùng chung cả công ty → KHÔNG tiền tố (tiền tố là ra 404) */
  ["/theo-doi", "/theo-doi"], ["/tong-quan", "/tong-quan"], ["/cong-no", "/cong-no"], ["/viec-cua-toi", "/viec-cua-toi"],
  ["/lich", "/lich"], ["/cai-dat-quy-trinh", "/cai-dat-quy-trinh"], ["/nha-cung-cap", "/nha-cung-cap"],
  ["/in/don-hang-mau", "/in/don-hang-mau"], ["/phan-bo/x", "/phan-bo/x"],
  /* không phải địa chỉ nội bộ, hoặc đã có tiền tố */
  ["https://request.hpcore.vn/request", "https://request.hpcore.vn/request"], ["//evil.com/de-nghi", "//evil.com/de-nghi"],
  ["#neo", "#neo"], ["de-nghi", "de-nghi"], ["/equi/de-nghi", "/equi/de-nghi"], ["/de-nghis", "/de-nghis"],
];
for (const [vao, ra] of bang) {
  const kq = tt(vao);
  /* ngoại lệ có chủ đích: "/de-nghis" bắt đầu bằng "de-nghis" ≠ "de-nghi" nên không đổi */
  kiem(`themTienToKho(${vao}) = ${ra}`, kq === ra, `được ${kq}`);
}
for (const [vao] of bang) kiem(`kho thường: ${vao} KHÔNG đổi`, tt(vao, "thuong") === vao);
for (const [vao] of bang) kiem(`idempotent: tiền tố hai lần = một lần (${vao})`, tt(tt(vao)) === tt(vao));

/* ⑥ QUYỀN: /equi/... gác ĐÚNG như địa chỉ gốc — câu 2 Sếp chọn "giống hệt" */
const duongDanThu = ["/de-nghi", "/de-nghi/1", "/don-hang", "/don-hang/p1", "/don-hang/tao-moi", "/phan-bo", "/theo-doi/1", "/in/don-hang/p1"];
for (const co of [true, false]) {
  const q = new Proxy({}, { get: () => co });
  for (const d of duongDanThu) {
    kiem(`quyền (mọi cờ=${co}): ${d} ≡ /equi${d}`, Q.duocVaoDuongDan(d, q) === Q.duocVaoDuongDan(`/equi${d}`, q));
  }
}
/* một người có đúng quyền xem quy trình nhưng KHÔNG có quyền lập PO */
const chiXem = new Proxy({}, { get: (_t, k) => k !== "lapPO" });
kiem("quyền: thiếu lapPO → /equi/don-hang/tao-moi bị chặn như /don-hang/tao-moi", Q.duocVaoDuongDan("/equi/don-hang/tao-moi", chiXem) === false && Q.duocVaoDuongDan("/don-hang/tao-moi", chiXem) === false);

rmSync(thuMuc, { recursive: true, force: true });
if (hong.length) {
  console.error(`${DO}⛔ ${hong.length} luật kho EQUI HỎNG:${HET}`);
  for (const h of hong) console.error("  ✗ " + h);
  process.exit(1);
}
console.log(`${XANH}✓ ${dat}/${dat} luật kho EQUI còn nguyên hiệu lực.${HET}`);
