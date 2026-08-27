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

kiem(
  "KEO LUI dang TAM TAT — phai chan, va noi duong go khac",
  "Ban lanh dao 26/08/2026 (*\"tam dong goi chuc nang keo lui buoc\"*)",
  () => {
    /* 🔴 Chan o `quyetDinhKeoTha`, KHONG xoa `quyetDinhLui` — ham do giu toan bo luat huy chung
       tu tuong ung tung buoc (chi dao 13/08/2026). Bat lai chi can xoa mot khoi `if`.
       ⚠️ Cau chan phai NOI DUONG GO KHAC (huy chung tu dang giu the o buoc do), neu khong nguoi
       dung tuong ho so di nham buoc la ket vinh vien. */
    const the = { deNghi: deNghiThu(), giaiDoan: "xet_duyet_bao_gia" };
    const r = G.quyetDinhKeoTha(
      the,
      "yeu_cau_bao_gia",   // lui MOT buoc
      [],
      [],
      G.CAU_HINH_MAC_DINH ?? {},
      null,
    );
    const cau = String(r?.lyDo ?? "");
    return {
      duoc: r?.loai === "khong_the" && /tạm tắt/i.test(cau) && /hủy/i.test(cau),
      thucTe: `${r?.loai ?? "?"}: "${cau.slice(0, 80)}"`,
      mongDoi: 'khong_the, cau co "tam tat" VA chi duong "huy chung tu"',
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
