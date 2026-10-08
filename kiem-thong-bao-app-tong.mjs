// ============================================================
// KIỂM LUẬT GỬI THÔNG BÁO SANG CHUÔNG APP TỔNG — Sếp duyệt demo 08/10/2026
// (tong-quan-demo/HPCons-ThuMua/thong-bao-thu-mua-kho-2026-10-08)
//
// Gọi THẬT các hàm thuần ở `2-quy-trinh/thong-bao-app-tong.ts` (dựng bằng esbuild như `kiem-luat`):
// phân loại tin, người nhận (nhãn vai trò, tên trùng, ô tick Xem bước), nội dung (không giá, cắt an toàn),
// khuôn gói gửi App Tổng, chống gọi lại. Thêm vài phép soi mã nguồn `kho-du-lieu.tsx` để chắc tin nhận
// từ nơi khác (onSnapshot) KHÔNG được đánh dấu gửi.
//
// Chạy:  npm run kiem-thong-bao
// ============================================================

import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const DO = "\u001b[31m";
const XANH = "\u001b[32m";
const HET = "\u001b[0m";

const thuMuc = mkdtempSync(join(tmpdir(), "kiem-tb-app-tong-"));
const tepRa = join(thuMuc, "tb.cjs");
try {
  execSync(
    `npx --yes esbuild "2-quy-trinh/thong-bao-app-tong.ts" --bundle --platform=node --format=cjs --outfile="${tepRa}" --log-level=error`,
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
} catch (e) {
  console.error(`${DO}⛔ Không dựng được 2-quy-trinh/thong-bao-app-tong.ts:${HET}`);
  console.error(String(e.stderr ?? e.message));
  rmSync(thuMuc, { recursive: true, force: true });
  process.exit(1);
}
const TB = createRequire(import.meta.url)(tepRa);
rmSync(thuMuc, { recursive: true, force: true });

let dat = 0;
const truot = [];
function kiem(ten, chay) {
  try {
    const r = chay();
    if (r === true) dat += 1;
    else truot.push({ ten, thucTe: typeof r === "string" ? r : JSON.stringify(r) });
  } catch (e) {
    truot.push({ ten, thucTe: `NÉM LỖI: ${e.message}` });
  }
}
const sai = (o) => {
  const ds = Object.entries(o).filter(([, v]) => !v).map(([k]) => k);
  return ds.length === 0 ? true : `sai: ${ds.join(", ")}`;
};

// ---------- dữ liệu mẫu ----------
const BUOC = ["xemBuocTiepNhan", "xemBuocYeuCauBaoGia", "xemBuocXetDuyetBaoGia", "xemBuocLapDon", "xemBuocDatHang", "xemBuocNhanHang", "xemBuocHoSoThanhToan", "xemBuocHoanThanh", "xemBuocThatBai"];
const q = (them = {}, buoc = BUOC) => ({
  xemDuocApp: true,
  phanBoCongViec: false,
  ...Object.fromEntries(BUOC.map((k) => [k, buoc.includes(k)])),
  ...them,
});
const nguoi = (firebaseUid, uidNghiepVu, ten, quyen, laBanLanhDao = false) => ({ firebaseUid, uidNghiepVu, ten, quyen, laBanLanhDao });
const DANH_BA = [
  nguoi("fbA", "fbA", "Lê Thị A", q({ phanBoCongViec: true })),
  nguoi("fbB", "fbB", "Phạm B", q({ phanBoCongViec: true }, BUOC.filter((k) => k !== "xemBuocTiepNhan"))),
  nguoi("fbC", "u-tm1", "Nguyễn Văn C", q({}, BUOC.filter((k) => k !== "xemBuocDatHang"))),
  nguoi("fbD1", "fbD1", "Trần Văn D", q()),
  nguoi("fbD2", "fbD2", "Trần  văn D", q()),
  nguoi("fbE", "fbE", "Giám đốc E", q(), true),
  nguoi("fbF", "fbF", "Thủ kho F", q({}, [])),
  nguoi("fbG", "fbG", "Bị khoá G", q({ xemDuocApp: false, phanBoCongViec: true })),
];
const tin = (them) => ({ id: "tb-1", prId: "pr1", prCode: "000231", tieuDe: "1.0. Phiếu đề nghị", denBuoc: "tiep_nhan", thoiDiem: new Date().toISOString(), guiToi: [], daDoc: false, ...them });

// ---------- 1. Phân loại tin ----------
kiem("Phân loại: đúng bảng đã duyệt, bỏ loại ngoài bảng", () =>
  sai({
    giao: TB.phanLoaiTin({ id: "tb-vm-3", laViecMoi: true }) === "giao_viec",
    chuyen_viec: TB.phanLoaiTin({ id: "tb-cv-4", laViecMoi: true }) === "giao_viec",
    vm_thieu_co: TB.phanLoaiTin({ id: "tb-vm-3" }) === null,
    de_nghi_moi: TB.phanLoaiTin({ id: "tb-req-9" }) === "de_nghi_moi",
    chuyen_tiep: TB.phanLoaiTin({ id: "tb-ct-2", laChuyenTiep: true }) === "chuyen_tiep",
    treo: TB.phanLoaiTin({ id: "tb-treo-po-po1", laCanhBaoTreo: true }) === "canh_bao",
    dung_gui: TB.phanLoaiTin({ id: "tb-dung-gui-po-po1-abc", laCanhBaoTreo: true }) === "canh_bao",
    xoa_ar: TB.phanLoaiTin({ id: "tb-xoa-ar-po1", laCanhBaoTreo: true }) === "canh_bao",
    duyet_bg: TB.phanLoaiTin({ id: "tb-12", tuBuoc: "yeu_cau_bao_gia", denBuoc: "xet_duyet_bao_gia" }) === "cho_duyet_bao_gia",
    buoc_khac: TB.phanLoaiTin({ id: "tb-12", tuBuoc: "lap_don_mua_hang", denBuoc: "dat_hang" }) === null,
    lap_tay: TB.phanLoaiTin({ id: "tb-moi-5" }) === null,
  }),
);

// ---------- 2. Mã sự kiện ----------
kiem("Mã sự kiện: đề nghị mới theo hồ sơ, cảnh báo theo mã cố định, tin số thứ tự kèm dấu thời điểm", () => {
  const a = TB.maSuKien({ id: "tb-req-1", prId: "pr1", thoiDiem: "2026-10-08T01:00:00.000Z" }, "de_nghi_moi");
  const b = TB.maSuKien({ id: "tb-req-7", prId: "pr1", thoiDiem: "2026-10-08T02:00:00.000Z" }, "de_nghi_moi");
  const c1 = TB.maSuKien({ id: "tb-treo-po-po1", prId: "po1", thoiDiem: "2026-10-08T01:00:00.000Z" }, "canh_bao");
  const c2 = TB.maSuKien({ id: "tb-treo-po-po1", prId: "po1", thoiDiem: "2026-10-09T01:00:00.000Z" }, "canh_bao");
  const v1 = TB.maSuKien({ id: "tb-vm-5", prId: "pr1", thoiDiem: "2026-10-08T01:00:00.000Z" }, "giao_viec");
  const v2 = TB.maSuKien({ id: "tb-vm-5", prId: "pr2", thoiDiem: "2026-10-08T01:00:01.000Z" }, "giao_viec");
  return sai({
    de_nghi_cung_ma: a === b && a === "thu_mua:de-nghi-moi:pr1",
    canh_bao_cung_ma: c1 === c2 && c1 === "thu_mua:tb-treo-po-po1",
    so_thu_tu_khac_ma: v1 !== v2 && v1.startsWith("thu_mua:tb-vm-5-"),
    ky_tu_an_toan: [a, c1, v1, TB.maSuKienKhoNhan("grn-po1-2")].every((m) => /^[A-Za-z0-9_:.-]+$/.test(m)),
  });
});

// ---------- 3. Người nhận ----------
const giai = (guiToi, them = {}) => {
  const log = [];
  const ra = TB.giaiNguoiNhan(guiToi, { danhBa: DANH_BA, duocXem: () => true, ghiLog: (s) => log.push(s), ...them });
  return { ra: [...ra].sort(), log };
};
kiem("Người nhận: nhãn Trưởng BP / Chưa phân bổ → người có phanBoCongViec, trừ người bị khoá app", () => {
  const r = giai([TB.NHAN_TBP]);
  const r2 = giai([TB.NHAN_CHUA_PB]);
  return sai({ tbp: r.ra.join() === "fbA,fbB", chua_pb: r2.ra.join() === "fbA,fbB" });
});
kiem("Người nhận: Ban lãnh đạo → director/owner", () => giai([TB.NHAN_BLD]).ra.join() === "fbE" || giai([TB.NHAN_BLD]).ra.join());
kiem("Người nhận: không tự báo cho người vừa thao tác", () => giai([TB.NHAN_TBP], { actorUid: "fbA" }).ra.join() === "fbB");
kiem("Người nhận: tên trùng 2 người (khác khoảng trắng/hoa thường) → BỎ QUA + ghi log, không đoán", () => {
  const r = giai(["Trần Văn D"]);
  return sai({ khong_ai: r.ra.length === 0, co_log: r.log.some((s) => s.includes("trùng tên")) });
});
kiem("Người nhận: ưu tiên mã trên dòng vật tư (nguoiPhuTrachUid) hơn so tên", () => {
  const goiY = TB.goiYTenTuHoSo({ items: [{ nguoiPhuTrachTen: "Trần Văn D", nguoiPhuTrachUid: "fbD1" }, { nguoiPhuTrachTen: "Nguyễn Văn C", nguoiPhuTrachUid: "u-tm1" }] });
  const r = giai(["Trần Văn D", "Nguyễn Văn C"], { goiYTen: goiY });
  return r.ra.join() === "fbC,fbD1" || r.ra.join();
});
kiem("Người nhận: cùng tên mà dòng vật tư ghi 2 mã khác nhau → bỏ qua", () => {
  const goiY = TB.goiYTenTuHoSo({ items: [{ nguoiPhuTrachTen: "Trần Văn D", nguoiPhuTrachUid: "fbD1" }, { nguoiPhuTrachTen: "Trần Văn D", nguoiPhuTrachUid: "fbD2" }] });
  return giai(["Trần Văn D"], { goiYTen: goiY }).ra.length === 0;
});
kiem("Người nhận: mã người phụ trách PO thêm vào (cảnh báo PO) — mã nghiệp vụ đổi ra mã Firebase", () => {
  const r = giai([TB.NHAN_BLD], { uidNghiepVuThem: ["u-tm1"] });
  return r.ra.join() === "fbC,fbE" || r.ra.join();
});
kiem("Hiển thị: đề nghị mới chỉ tới người được tick bước ① (cùng luật chuông + ô Xem bước)", () => {
  const duocXem = TB.luatDuocXem("de_nghi_moi", { denBuoc: "tiep_nhan", giaiDoanHoSo: "tiep_nhan" });
  return giai([TB.NHAN_TBP], { duocXem }).ra.join() === "fbA" || giai([TB.NHAN_TBP], { duocXem }).ra.join();
});
kiem("Hiển thị: chuyển tiếp ở bước ⑤ không tới người không được tick bước ⑤", () => {
  const goiY = TB.goiYTenTuHoSo({ items: [{ nguoiPhuTrachTen: "Nguyễn Văn C", nguoiPhuTrachUid: "u-tm1" }, { nguoiPhuTrachTen: "Lê Thị A", nguoiPhuTrachUid: "fbA" }] });
  const duocXem = TB.luatDuocXem("chuyen_tiep", { denBuoc: "dat_hang", giaiDoanHoSo: "dat_hang" });
  return giai(["Nguyễn Văn C", "Lê Thị A"], { goiYTen: goiY, duocXem }).ra.join() === "fbA";
});
kiem("Hiển thị: giao việc tới cả người 0 ô bước (Thủ kho) — như chuông; người bị khoá app thì không", () => {
  const duocXem = TB.luatDuocXem("giao_viec", {});
  return sai({
    thu_kho: giai(["Thủ kho F"], { duocXem }).ra.join() === "fbF",
    bi_khoa: giai(["Bị khoá G"], { duocXem }).ra.length === 0,
  });
});
kiem("Hiển thị: kho đã nhận — PO có hồ sơ theo bước hồ sơ, PO độc lập theo ô ④", () => {
  const coHoSo = TB.luatDuocXem("kho_da_nhan", { poPrId: "pr1", giaiDoanCua: () => "dat_hang" });
  const docLap = TB.luatDuocXem("kho_da_nhan", { poPrId: null, giaiDoanCua: () => undefined });
  const qC = DANH_BA[2].quyen;
  return sai({ co_ho_so_chan: coHoSo(qC) === false, doc_lap_mo: docLap(qC) === true, A_mo: coHoSo(DANH_BA[0].quyen) === true });
});

// ---------- 4. Nội dung ----------
const coSoTien = (s) => /5\.000\.000|12 triệu|300k|₫|VNĐ/i.test(s);
kiem("Nội dung: KHÔNG mang số tiền (lời nhắn, tiêu đề), giữ số lượng thường", () => {
  const t = tin({ id: "tb-ct-1", laChuyenTiep: true, denBuoc: "dat_hang", loiNhan: "Giá 5.000.000đ, NCC chào 12 triệu, phí 300k, giao 10 tấn trước thứ 6" });
  const nd = TB.noiDungChoTin(t, "chuyen_tiep");
  const tatCa = JSON.stringify(nd);
  const v = TB.noiDungChoTin(tin({ id: "tb-vm-1", laViecMoi: true, soDongViec: 3, tieuDe: "Thép hộp 1.200.000 VNĐ", loiNhan: "đơn giá ₫ 45000" }), "giao_viec");
  return sai({
    khong_tien: !coSoTien(tatCa) && !coSoTien(JSON.stringify(v)),
    giu_10_tan: tatCa.includes("10 tấn"),
    tieu_de_giao: v.meta.headline === "Bạn được giao 3 dòng vật tư",
  });
});
kiem("Nội dung: cắt an toàn theo cụm ký tự + đủ giới hạn độ dài", () => {
  const dai = "Ưu tiên giao trước thứ 6 ".repeat(30);
  const nd = TB.noiDungChoTin(tin({ id: "tb-ct-1", laChuyenTiep: true, loiNhan: dai, tieuDe: "x".repeat(600), prCode: "C".repeat(80) }), "chuyen_tiep");
  const emoji = "👨‍👩‍👧".repeat(40);
  const cat = TB.catAnToan(emoji, 120);
  const than = cat.slice(0, -1);
  return sai({
    title: nd.title.length <= 200,
    body: nd.body.length <= 500,
    headline: nd.meta.headline.length <= 200 && nd.meta.headline.endsWith("…"),
    excerpt: nd.meta.excerpt.length <= 200,
    code: nd.meta.code.length <= 40,
    push_title: nd.push.title.length <= 120,
    push_body: nd.push.body.length <= 240,
    action: (nd.push.actionTitle ?? "").length <= 30,
    emoji_nguyen_cum: cat.length <= 120 && cat.endsWith("…") && than.length % "👨‍👩‍👧".length === 0,
  });
});
kiem("Nội dung: bỏ ký tự điều khiển / đảo chiều", () => {
  const s = TB.lamSach("‮abc\u0007⁦ d‏\n e");
  return s === "abc d e" || JSON.stringify(s);
});
kiem("Nội dung: đường dẫn đúng trang — hồ sơ /de-nghi, cảnh báo PO (id PO) /don-hang", () => {
  const a = TB.noiDungChoTin(tin({ id: "tb-req-1" }), "de_nghi_moi");
  const b = TB.noiDungChoTin(tin({ id: "tb-treo-po-po9", prId: "po9", prCode: "DMH260009", laCanhBaoTreo: true, tieuDe: "⚠️ Đơn hàng DMH260009 đã \"Chờ đề nghị\" 8 ngày" }), "canh_bao");
  return sai({
    de_nghi: a.link === "https://thumua.hpcore.vn/de-nghi/pr1",
    don: b.link === "https://thumua.hpcore.vn/don-hang/po9",
    bo_bieu_tuong_dau: !b.meta.headline.startsWith("⚠"),
    title_khong_bieu_tuong: !b.title.startsWith("⚠"),
    push_co_bieu_tuong: b.push.title.startsWith("⚠️"),
  });
});
kiem("Nội dung: kho đã nhận đủ / chưa đủ", () => {
  const du = TB.noiDungKhoNhan({ poId: "po1", poCode: "DMH260012", tenCongTrinh: "CT Khánh Thành", lanGiaoThu: 2, daNhanDu: true });
  const chua = TB.noiDungKhoNhan({ poId: "po1", poCode: "DMH260012", lanGiaoThu: 1, daNhanDu: false });
  return sai({
    du: du.meta.headline === "Kho CT Khánh Thành đã nhận đủ hàng PO DMH260012",
    chua: chua.meta.headline === "Kho công trình đã nhận hàng PO DMH260012",
    link: du.link === "https://thumua.hpcore.vn/don-hang/po1",
  });
});

// ---------- 5. Khuôn gói gửi App Tổng ----------
kiem("Gói gửi: đúng khuôn cổng ingest App Tổng", () => {
  const nd = TB.noiDungChoTin(tin({ id: "tb-12", tuBuoc: "yeu_cau_bao_gia", denBuoc: "xet_duyet_bao_gia", prCode: "DMH260012", tieuDe: "Thép hộp" }), "cho_duyet_bao_gia", "Nguyễn Văn A");
  const g = TB.dungGoiGui("thu_mua:tb-12-1", ["fbA", "fbA", "fbB"], nd);
  return sai({
    khoa: Object.keys(g).sort().join() === "appId,body,eventId,link,meta,push,recipients,title",
    appId: g.appId === "thu_mua",
    bo_trung: g.recipients.join() === "fbA,fbB",
    meta: g.meta.v === 1 && g.meta.kind === "cho_duyet_bao_gia" && g.meta.headline === "Chờ bạn duyệt báo giá" && g.meta.subline === "DMH260012 · Nguyễn Văn A gửi",
    push: typeof g.push.title === "string" && typeof g.push.body === "string",
  });
});

// ---------- 6. Chống gọi lại / vòng lặp ----------
kiem("Thân yêu cầu: chỉ mã hợp lệ, ≤ 20, bỏ trùng", () =>
  sai({
    tot: JSON.stringify(TB.docMaTin({ ids: ["tb-1", "tb-1", "x/../y", "tb-vm-2"] })) === '["tb-1","tb-vm-2"]',
    qua_20: TB.docMaTin({ ids: Array.from({ length: 21 }, (_, i) => `tb-${i}`) }) === null,
    rong: TB.docMaTin({ ids: [] }) === null,
    sai_khuon: TB.docMaTin([1]) === null && TB.docMaTin(null) === null,
  }),
);
kiem("Chống gọi lại nhanh: cùng mã sự kiện lần 2 bị chặn, gỡ dấu thì gửi lại được", () => {
  const b = new TB.BoNhoDaGui(3, 1000);
  const r1 = b.danhDau("e1", 0);
  const r2 = b.danhDau("e1", 10);
  b.bo("e1");
  const r3 = b.danhDau("e1", 20);
  const r4 = b.danhDau("e1", 5000);
  b.danhDau("e2", 5001); b.danhDau("e3", 5002); b.danhDau("e4", 5003);
  const r5 = b.danhDau("e1", 5004); // e1 đã bị đẩy khỏi bộ nhớ (tối đa 3)
  return sai({ r1, r2: !r2, r3, r4, r5 });
});
kiem("Giới hạn tần suất theo người", () => {
  const g = new TB.GioiHanTanSuat(3, 1000);
  const ds = [g.choPhep("u", 0), g.choPhep("u", 1), g.choPhep("u", 2), g.choPhep("u", 3), g.choPhep("v", 3), g.choPhep("u", 1500)];
  return ds.join() === "true,true,true,false,true,true" || ds.join();
});
kiem("Tin cũ (> 60 phút), lệch tới trước > 10 phút hoặc thời điểm hỏng không gửi", () =>
  sai({
    moi: TB.tinConMoi(new Date(Date.now() - 60_000).toISOString()),
    con_59_phut: TB.tinConMoi(new Date(Date.now() - 59 * 60_000).toISOString()),
    cu: !TB.tinConMoi(new Date(Date.now() - 61 * 60_000).toISOString()),
    toi_truoc_9: TB.tinConMoi(new Date(Date.now() + 9 * 60_000).toISOString()),
    toi_truoc_11: !TB.tinConMoi(new Date(Date.now() + 11 * 60_000).toISOString()),
    hong: !TB.tinConMoi("abc"),
  }),
);

// ---------- 7. Soi mã nguồn: không kích hoạt từ dữ liệu nhận qua onSnapshot ----------
const KHO = readFileSync("3-du-lieu/kho-du-lieu.tsx", "utf8");
const khoiHam = (dau, ketThuc) => {
  const i = KHO.indexOf(dau);
  const j = KHO.indexOf(ketThuc, i + dau.length);
  return i < 0 || j < 0 ? "" : KHO.slice(i, j);
};
kiem("Mã nguồn: `apDung` (dữ liệu từ onSnapshot) KHÔNG đánh dấu / gửi tin App Tổng", () => {
  const ap = khoiHam("const apDung = useCallback(", "\n  }, [");
  return sai({ tim_thay: ap.length > 0, khong_danh_dau: !ap.includes("danhDauTinChoAppTong") && !ap.includes("xaTinChoAppTong") });
});
kiem("Mã nguồn: chỉ gửi ở nhánh GHI THÀNH CÔNG của `dayLenMayChu`, bọc try", () => {
  const day = khoiHam("const dayLenMayChu = useCallback(", "dayLenMayChuRef.current = dayLenMayChu;");
  const iThen = day.indexOf(".then(");
  const iCatch = day.indexOf(".catch(");
  const iGoi = day.indexOf("xaTinChoAppTongRef.current(d)");
  return sai({ trong_then: iThen >= 0 && iGoi > iThen && iGoi < iCatch, boc_try: /try\s*\{\s*xaTinChoAppTongRef\.current\(d\)/.test(day) });
});
kiem("Mã nguồn: tin chuyển bước chỉ đánh dấu SAU chốt `dangNhanTuNoiKhac`", () => {
  const iChot = KHO.indexOf("if (dangNhanTuNoiKhac.current) {");
  const iDanh = KHO.indexOf("danhDauTinChoAppTong(tinChoAppTong.current, moi);");
  return iChot > 0 && iDanh > iChot;
});
kiem("Mã nguồn: route /api/thong-bao/day kiểm vé + nguồn + JSON + tần suất, gửi trong after()", () => {
  const r = readFileSync("app/api/thong-bao/day/route.ts", "utf8");
  return sai({
    ve: r.includes("verifyClientIdToken("),
    nguon: r.includes("cungNguon(req)"),
    json: r.includes("application/json"),
    tan_suat_10: r.includes("new GioiHanTanSuat(10, 60_000)") && r.includes("gioiHan.choPhep("),
    nguoi_dung_thu_mua: r.includes("laNguoiDungThuMua(nguoiGoi.uid, PQ)"),
    pha_1_truoc:
      r.indexOf("timTinCanGui(ids)") > r.indexOf("laNguoiDungThuMua(nguoiGoi") &&
      r.indexOf("timTinCanGui(ids)") < r.indexOf("after(() =>"),
    tra_tim_thay: r.includes("{ ok: true, timThay }"),
    after: /after\(\(\) => guiCacTin\(canGui, nguoiGoi\.uid, PQ\)\)/.test(r),
    max_duration: /export const maxDuration = 30;/.test(r),
  });
});

// ---------- 8. Vòng soát 08/10/2026 ----------
kiem("Che tiền: các ca lọt đã đo (giá, đơn giá/m3, tỉ, 1tr2, USD, nhóm nghìn có dấu cách)", () => {
  const ca = {
    gia: "giá 1.200.000",
    don_gia_m3: "đơn giá 150.000 / m3",
    ti: "khoảng 1,2 tỉ",
    tr2: "chào 1tr2",
    usd: "1,200 USD",
    cach: "1 200 000 đ",
    ty_dong: "1,5 tỷ đồng",
    gia_khong_nhom: "giá 45000",
    thanh_tien: "thành tiền: 980000",
    tong: "tổng 3500000",
    ky_hieu: "$200 và ₫ 45000",
    nhom_tran: "chi 2.500.000 cho vận chuyển",
  };
  const ra = Object.fromEntries(Object.entries(ca).map(([k, v]) => [k, TB.boSoTien(v)]));
  const lot = Object.entries(ra).filter(([, v]) => /\d/.test(v.replace(/m3/g, "")));
  const giu = {
    po: TB.boSoTien("PO-2026 gửi kho") === "PO-2026 gửi kho",
    dmh: TB.boSoTien("DMH260012 · 000231") === "DMH260012 · 000231",
    tan: TB.boSoTien("giao 10 tấn trước thứ 6, dài 12m, 5 trụ") === "giao 10 tấn trước thứ 6, dài 12m, 5 trụ",
    ten_phieu: TB.boSoTien("1.0. Phiếu đề nghị") === "1.0. Phiếu đề nghị",
  };
  return lot.length === 0 && Object.values(giu).every(Boolean)
    ? true
    : `lọt: ${JSON.stringify(lot)} · giữ: ${JSON.stringify(giu)}`;
});
kiem('Nội dung: đề nghị mới = "Đề nghị đã duyệt xong cần phân bổ"; title/headline không biểu tượng, push.title có', () => {
  const nd = TB.noiDungChoTin(tin({ id: "tb-req-1" }), "de_nghi_moi");
  return sai({
    headline: nd.meta.headline === "Đề nghị đã duyệt xong cần phân bổ",
    title: nd.title === "Đề nghị đã duyệt xong cần phân bổ",
    push: nd.push.title === "🆕 Đề nghị đã duyệt xong cần phân bổ",
  });
});
kiem("Chia người nhận ≤ 200/gói, mã sự kiện theo gói; ≤ 200 giữ nguyên mã", () => {
  const nd = TB.noiDungChoTin(tin({ id: "tb-req-1" }), "de_nghi_moi");
  const nguoiNhan = Array.from({ length: 450 }, (_, i) => `u${String(i).padStart(3, "0")}`);
  const goi = TB.chiaGoiGui("thu_mua:x", nguoiNhan, nd);
  const mot = TB.chiaGoiGui("thu_mua:x", nguoiNhan.slice(0, 200), nd);
  return sai({
    ba_goi: goi.length === 3 && goi.every((g) => g.recipients.length <= 200),
    du_nguoi: new Set(goi.flatMap((g) => g.recipients)).size === 450,
    ma_goi: goi.map((g) => g.eventId).join() === "thu_mua:x:c0,thu_mua:x:c1,thu_mua:x:c2",
    mot_goi: mot.length === 1 && mot[0].eventId === "thu_mua:x",
  });
});
kiem("Thử lại: chỉ lỗi mạng / 5xx / 429; không thử lại 4xx khác", () =>
  sai({
    mang: TB.nenThuLai({ ok: false, loiMang: true }),
    s503: TB.nenThuLai({ ok: false, status: 503 }),
    s429: TB.nenThuLai({ ok: false, status: 429 }),
    s400: !TB.nenThuLai({ ok: false, status: 400 }),
    s401: !TB.nenThuLai({ ok: false, status: 401 }),
    ok: !TB.nenThuLai({ ok: true, status: 200 }),
  }),
);
kiem("Khoá cổng < 24 ký tự coi như TẮT", () =>
  sai({
    rong: !TB.khoaHopLe(""),
    ngan: !TB.khoaHopLe("abc123"),
    du: TB.khoaHopLe("x".repeat(24)),
    cat_trang: !TB.khoaHopLe(` ${"x".repeat(22)} `),
  }),
);
kiem("Hàng chờ trình duyệt: chỉ gửi mã đã lên kho chung; máy chủ chưa thấy → gửi lại đúng 1 lần; lỗi → bỏ", () => {
  const cho = new Map();
  TB.themVaoHangCho(
    cho,
    [
      { id: "tb-vm-1", laViecMoi: true },
      { id: "tb-5", denBuoc: "dat_hang", tuBuoc: "lap_don_mua_hang" },
      { id: "tb-ct-2", laChuyenTiep: true },
      { id: "tb-ct-3", laChuyenTiep: true },
    ],
    0,
  );
  const boLoai = !cho.has("tb-5");
  const l1 = TB.layMaCanGui(cho, new Set(["tb-vm-1", "tb-ct-2", "tb-ct-3"]), 1);
  TB.capNhatSauKhiGui(cho, l1, new Set(["tb-vm-1"])); // tb-ct-2, tb-ct-3 máy chủ chưa thấy
  const l2 = TB.layMaCanGui(cho, new Set(["tb-ct-2", "tb-ct-3"]), 2);
  TB.capNhatSauKhiGui(cho, ["tb-ct-2"], new Set()); // vẫn chưa thấy → hết lượt, bỏ
  TB.capNhatSauKhiGui(cho, ["tb-ct-3"], null); // lỗi → bỏ
  const l3 = TB.layMaCanGui(cho, new Set(["tb-ct-2", "tb-ct-3"]), 3);
  const cho2 = new Map();
  TB.themVaoHangCho(cho2, [{ id: "tb-ct-9", laChuyenTiep: true }], 0);
  const chuaLen = TB.layMaCanGui(cho2, new Set(), 1);
  const conGiuSauKhiChuaLen = cho2.has("tb-ct-9");
  const quaHan = TB.layMaCanGui(cho2, new Set(["tb-ct-9"]), TB.HAN_CHO_TIN_MS + 1);
  return sai({
    bo_loai: boLoai,
    l1: [...l1].sort().join() === "tb-ct-2,tb-ct-3,tb-vm-1",
    l2: [...l2].sort().join() === "tb-ct-2,tb-ct-3",
    l3: l3.length === 0 && cho.size === 0,
    chua_len_khong_gui: chuaLen.length === 0 && conGiuSauKhiChuaLen,
    qua_han_bo: quaHan.length === 0 && cho2.size === 0,
  });
});
kiem("Mã nguồn: máy chủ đọc HAI PHA (pha 1 chỉ thongBao; pha 2 không thongBao, không giaDonHang), danh bạ đệm 5 phút", () => {
  const m = readFileSync("5-ket-noi/thong-bao-app-tong-may-chu.ts", "utf8");
  return sai({
    pha1: m.includes('fieldMask: ["thongBao"]'),
    pha2: m.includes('fieldMask: ["deNghi", "donHang", "baoGia", "phieuNhan"]'),
    khong_gia: !m.includes('"giaDonHang"'),
    dem_5_phut: m.includes("const HAN_DEM_MS = 5 * 60_000;"),
    song_song: m.includes("const SONG_SONG = 4;") && m.includes("HAN_DOT_GUI_MS = 20_000"),
  });
});
kiem("Mã nguồn: de-nghi-moi chỉ thêm ĐÚNG 1 dòng gửi, trong nhánh ketQua.moi", () => {
  const r = readFileSync("app/api/app-request/de-nghi-moi/route.ts", "utf8");
  const dong = r.split(/\r?\n/).filter((l) => l.includes("guiDeNghiMoi("));
  return sai({
    mot_dong: dong.length === 1,
    dung_nhanh: /if \(ketQua\.moi\) after\(\(\) => guiDeNghiMoi\(ketQua\.deNghi\.id, PQ\)\);/.test(dong[0] ?? ""),
  });
});

/* Bài bất đồng bộ — chạy song song có giới hạn + hạn tổng. */
{
  let dangChay = 0;
  let caoNhat = 0;
  const xong = [];
  await TB.chaySongSong(
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    4,
    async (x) => {
      dangChay += 1;
      caoNhat = Math.max(caoNhat, dangChay);
      await new Promise((r) => setTimeout(r, 10));
      dangChay -= 1;
      if (x === 3) throw new Error("hỏng một việc");
      xong.push(x);
    },
    5000,
  );
  const t0 = Date.now();
  const daBatDau = await TB.chaySongSong([1, 2, 3, 4, 5, 6], 2, () => new Promise((r) => setTimeout(r, 200)), 250);
  const tg = Date.now() - t0;
  const r = sai({ toi_da_4: caoNhat <= 4 && caoNhat >= 2, loi_khong_chan: xong.length === 8, han_tong: tg < 400 && daBatDau <= 4 });
  if (r === true) dat += 1;
  else
    truot.push({
      ten: "Chạy song song: tối đa 4 việc, một việc hỏng không chặn, dừng nhận việc khi hết hạn",
      thucTe: `${r} · cao=${caoNhat} xong=${xong.length} tg=${tg} bd=${daBatDau}`,
    });
}

const tong = dat + truot.length;
if (truot.length === 0) {
  console.log(`${XANH}✓ ${dat}/${tong} luật gửi thông báo App Tổng đạt.${HET}`);
  process.exit(0);
}
console.error(`${DO}⛔ ${truot.length}/${tong} luật trượt:${HET}`);
for (const t of truot) console.error(`  ✗ ${t.ten}\n    thực tế: ${t.thucTe}`);
process.exit(1);
