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
import { mkdtempSync, rmSync } from "node:fs";
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

const nap = createRequire(import.meta.url);
const M = nap(tepRa);
const G = nap(tepRa2);

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
    /* Ban lãnh đạo 24/08 yêu cầu tối giản ký tự -> bản ngắn dùng số bước khoanh tròn “④”. */
    const coNhacBuoc4 = ds.some((m) => m.startsWith("④"));
    return {
      duoc: coNhacBuoc4,
      thucTe: ds.length === 0 ? "[] (THẺ TRẮNG TRƠN — đúng lỗi đã báo)" : JSON.stringify(ds),
      mongDoi: 'có ít nhất một mục nhắc bước ④ (Lập đơn mua hàng)',
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
      duoc: typeof cau === "string" && cau.includes("Lập đơn mua hàng"),
      thucTe: cau === null ? "null" : `"${String(cau).slice(0, 110)}…"`,
      mongDoi: "câu đầy đủ có ghi tên bước “Lập đơn mua hàng”",
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
