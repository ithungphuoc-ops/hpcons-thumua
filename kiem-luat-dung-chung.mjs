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
    const cau = r?.lyDo ?? r?.thongBao ?? "";
    return {
      duoc: cau.includes("Hóa đơn VAT") || cau.includes("Hoá đơn VAT"),
      thucTe: `${r?.loai ?? "?"}: "${String(cau).slice(0, 110)}"`,
      mongDoi: "câu chặn phải nhắc Hóa đơn VAT (thứ thật sự đang chặn ở bước ⑦)",
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
    return {
      duoc: r?.loai === "khong_the" && String(r.lyDo).includes("bản báo giá"),
      thucTe: `${r?.loai ?? "?"}${r?.lyDo ? `: "${String(r.lyDo).slice(0, 80)}"` : ""}`,
      mongDoi: 'loai = "khong_the" kèm đúng câu thiếu bản báo giá',
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
      duoc: r?.loai === "khong_the" && String(r.lyDo).includes("so sánh"),
      thucTe: `${r?.loai ?? "?"}${r?.lyDo ? `: "${String(r.lyDo).slice(0, 80)}"` : ""}`,
      mongDoi: 'loai = "khong_the" kèm câu thiếu bảng so sánh',
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
      duoc: r?.loai === "khong_the" && String(r.lyDo).includes("liền kề"),
      thucTe: `${r?.loai ?? "?"}: "${String(r?.lyDo ?? r?.thongBao ?? "").slice(0, 70)}"`,
      mongDoi: 'khong_the kèm câu "chỉ kéo được sang bước liền kề"',
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
