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

const nap = createRequire(import.meta.url);
const M = nap(tepRa);
const G = nap(tepRa2);
const AR = nap(tepRa6);
const KD = nap(tepRa7);
const HS = nap(tepRa8);

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
  /* ⚠️ Tên trường là `maCongViec` và mã đúng là hằng `VIEC_UNC_XONG` = "unc_xong" — đoán sai tên
     thì `daTichXongUNC` trả false và bài kiểm đỏ vì lý do chẳng liên quan gì tới hợp đồng. */
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
    /* Nhánh phòng ban chỉ đổi CHỖ điều kiện khối lượng. Bốn điều kiện còn lại (chưa lên đơn · hợp
       đồng · hóa đơn VAT · tích UNC) áp y hệt cho cả hai loại hồ sơ. */
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
