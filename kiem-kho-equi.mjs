// ============================================================
// KIỂM KHO EQUI — BẰNG HÀNH VI (Sếp duyệt demo 14/10/2026)
//
// Gọi THẬT các hàm chọn kho / tiền tố / cổng quyền, đòi kết quả đúng. Chạy:  npm run kiem-kho-equi
//
// 🔴 Mục tiêu số 1: KHO THƯỜNG KHÔNG ĐỔI GÌ so với trước khi có EQUI (đường dẫn Firestore, khoá
// localStorage, địa chỉ). Hỏng một trong các điều đó là người đang dùng kho thường mất dữ liệu.
// Mục tiêu số 2: hai kho KHÔNG BAO GIỜ trỏ cùng một chỗ lưu.
// ★ 15/10/2026 (Liên kết mua hàng EQUI): ⑧ số PO `DMHEQ…` / `XKEQ…` (kho thường giữ `DMH…`/`XK…`) ·
//   ⑨ gửi PO theo kho + payload App EQUI = payload QLK CTR từng byte (bản EQUI chép từ tệp vùng cấm) ·
//   ⑩ chữ tên app theo kho.
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

let K, Q, N, D, CM, G, TA;
try {
  N = dung("2-quy-trinh/nhom-equi.ts", "nhom-equi.cjs");
  K = dung("3-du-lieu/kho-id.ts", "kho-id.cjs");
  Q = dung("4-phan-quyen/quyen.ts", "quyen.cjs");
  /* ★ Liên kết mua hàng EQUI (Sếp duyệt 15/10/2026) — số PO DMHEQ, chọn đích gửi PO theo kho, tên app. */
  D = dung("2-quy-trinh/dat-ma-don-hang.ts", "dat-ma-don-hang.cjs");
  CM = dung("2-quy-trinh/cap-ma-may-chu.ts", "cap-ma-may-chu.cjs");
  G = dung("5-ket-noi/gui-po-theo-kho.ts", "gui-po-theo-kho.cjs");
  TA = dung("2-quy-trinh/ten-app-kho.ts", "ten-app-kho.cjs");
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

/* ⑦ NHẬN DIỆN NHÓM EQUI (Pha 2, 14/10/2026) — theo TÊN, cần CẢ số đầu lẫn đuôi "(EQUI)" */
const nhomDung = ["0. Đề xuất trực tiếp (EQUI)", "1.0. Phiếu đề nghị (EQUI)", "7.0. Xét duyệt báo giá NTP (EQUI)", "  1.0.  Phiếu đề nghị  ( equi )  ", "1.0. Phiếu đề nghị (equi)"];
for (const t of nhomDung) kiem(`nhóm EQUI nhận: ${JSON.stringify(t)}`, N.laNhomEqui(t) === true);
const nhomSai = [
  "1.0. Phiếu đề nghị", "0. Đề xuất trực tiếp", "7.0. Xét duyệt báo giá NTP",   /* cùng số đầu nhưng KHÔNG phải EQUI */
  "2.0. Bảng kê thanh toán (EQUI)", "3.0. Tạm ứng chi phí (EQUI)", "9.0. Tạm ứng lương (EQUI)", "6.0. Bảng kê thu tiền (EQUI)", /* EQUI nhưng không liên quan mua hàng */
  "10. Gì đó (EQUI)", "1. Gì đó (EQUI)", "01.0. Gì đó (EQUI)", "Phiếu đề nghị (EQUI)", "(EQUI)", "", "1.0. Phiếu (EQUI) thêm", "1.0 Phiếu đề nghị EQUI",
  undefined, null, 5, {}, [],
];
for (const t of nhomSai) kiem(`nhóm KHÔNG nhận: ${JSON.stringify(t)}`, N.laNhomEqui(t) === false);
kiem("số đầu mặc định đúng 3 nhóm", eq(N.SO_DAU_NHOM_EQUI_MAC_DINH, ["0", "1.0", "7.0"]));
kiem("soDauCuaTenNhom", N.soDauCuaTenNhom("1.0. Phiếu") === "1.0" && N.soDauCuaTenNhom("0. Đề") === "0" && N.soDauCuaTenNhom("Phiếu") === null && N.soDauCuaTenNhom("12.3.4. x") === "12.3.4");
kiem("cấu hình rỗng/lạ → mặc định", eq(N.docSoDauCauHinh(undefined), ["0", "1.0", "7.0"]) && eq(N.docSoDauCauHinh(""), ["0", "1.0", "7.0"]) && eq(N.docSoDauCauHinh("abc, ,x"), ["0", "1.0", "7.0"]));
kiem("cấu hình tuỳ chỉnh", eq(N.docSoDauCauHinh(" 2.0 , 3.0,abc "), ["2.0", "3.0"]));
kiem("đổi cấu hình → nhận nhóm mới, bỏ nhóm cũ", N.laNhomEqui("2.0. Bảng kê thanh toán (EQUI)", ["2.0"]) === true && N.laNhomEqui("1.0. Phiếu đề nghị (EQUI)", ["2.0"]) === false);
kiem("công tắc TẮT → luôn kho thường dù đúng nhóm EQUI", N.khoChoDeXuat(false, "1.0. Phiếu đề nghị (EQUI)") === "thuong");
kiem("công tắc BẬT + nhóm EQUI → equi", N.khoChoDeXuat(true, "1.0. Phiếu đề nghị (EQUI)") === "equi");
kiem("công tắc BẬT + nhóm thường → thuong", N.khoChoDeXuat(true, "1.0. Phiếu đề nghị") === "thuong");
kiem("công tắc BẬT + thiếu tên nhóm → thuong (không đoán)", N.khoChoDeXuat(true, undefined) === "thuong" && N.khoChoDeXuat(true, "") === "thuong");
for (const [v, kq] of [["1", true], [" 1 ", true], ["0", false], ["", false], [undefined, false], ["true", false], ["on", false]]) kiem(`reKhoDangBat(${JSON.stringify(v)}) = ${kq}`, N.reKhoDangBat(v) === kq);

/* ════════════════════════════════════════════════════════════════════════════════════════════
   ⑧ SỐ PO KHO EQUI — Sếp chốt 15/10/2026 (câu 2A): `DMHEQ` + năm 2 số + STT 4 số, viết liền;
   phiếu xuất kho `XKEQ…`. 🔴 Kho thường GIỮ NGUYÊN `DMH260001` / `XK260001`, hai kho không ảnh hưởng nhau.
   ════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const so = (nam, xk, kho, daCo = []) => D.maDonHangTiepTheo(kho === undefined ? D.thamSoCapSoDon(nam, xk) : D.thamSoCapSoDon(nam, xk, kho), daCo);
  kiem("EQUI: PO đầu năm 26 = DMHEQ260001", so("26", false, "equi") === "DMHEQ260001", so("26", false, "equi"));
  kiem("EQUI: phiếu xuất kho đầu năm 26 = XKEQ260001", so("26", true, "equi") === "XKEQ260001", so("26", true, "equi"));
  kiem("kho thường (không truyền kho): vẫn DMH260001", so("26", false) === "DMH260001", so("26", false));
  kiem("kho thường (truyền 'thuong'): vẫn DMH260001", so("26", false, "thuong") === "DMH260001");
  kiem("kho thường: phiếu xuất kho vẫn XK260001", so("26", true) === "XK260001" && so("26", true, "thuong") === "XK260001");
  /* Tham số gửi máy chủ của kho thường KHÔNG ĐỔI MỘT KÝ TỰ — cửa cấp số mở sổ theo đúng chuỗi này. */
  kiem("kho thường: tham số cấp số y hệt trước ('26' / 'XK:26')", D.thamSoCapSoDon("26", false) === "26" && D.thamSoCapSoDon("26", true) === "XK:26" && D.thamSoCapSoDon(" 26 ", false, "thuong") === "26");
  kiem("EQUI: tham số cấp số 'DMHEQ:26' / 'XKEQ:26'", D.thamSoCapSoDon("26", false, "equi") === "DMHEQ:26" && D.thamSoCapSoDon("26", true, "equi") === "XKEQ:26");
  /* Hai kho, bốn dãy, cùng nằm trong một danh sách mã — mỗi dãy chỉ đếm số của chính nó. */
  const lan = ["DMH260005", "DMHEQ260002", "XK260003", "XKEQ260007", "DMH250009", "DMHEQ250004"];
  kiem("lẫn mã: dãy DMH chỉ đếm DMH → DMH260006", so("26", false, "thuong", lan) === "DMH260006", so("26", false, "thuong", lan));
  kiem("lẫn mã: dãy DMHEQ chỉ đếm DMHEQ → DMHEQ260003", so("26", false, "equi", lan) === "DMHEQ260003", so("26", false, "equi", lan));
  kiem("lẫn mã: dãy XK → XK260004, dãy XKEQ → XKEQ260008", so("26", true, "thuong", lan) === "XK260004" && so("26", true, "equi", lan) === "XKEQ260008");
  kiem("năm mới: DMHEQ270001 (không nối dãy năm 26)", so("27", false, "equi", lan) === "DMHEQ270001");
  /* Kho EQUI đã có PO số cũ `DMH26…` (lập trước 15/10) → dãy mới vẫn bắt đầu DMHEQ260001, không trùng. */
  kiem("kho EQUI có PO số cũ DMH… → dãy DMHEQ bắt đầu 0001", so("26", false, "equi", ["DMH260001", "DMH260002"]) === "DMHEQ260001");
  kiem("chống trùng: DMHEQ260001 đã dùng (lệch khuôn) → DMHEQ260002", so("26", false, "equi", ["DMHEQ260001"]) === "DMHEQ260002");
  /* Đường MÁY CHỦ (`/api/cap-ma`) gọi đúng hàm thuần này với `thamSo` gửi lên + mã giữ chỗ. */
  const giuCho = [{ ma: "DMHEQ260002", luc: new Date().toISOString() }];
  kiem("máy chủ: DMHEQ:26 + giữ chỗ DMHEQ260002 → DMHEQ260003", CM.maTiepTheoTrenMayChu("don-hang", "DMHEQ:26", ["DMHEQ260001"], giuCho) === "DMHEQ260003");
  kiem("máy chủ: kho thường '26' vẫn ra DMH (không lẫn sổ EQUI)", CM.maTiepTheoTrenMayChu("don-hang", "26", ["DMHEQ260009"], []) === "DMH260001");
  kiem("máy chủ: sổ giữ chỗ DMHEQ khác sổ DMH", CM.khoaSoCapPhat("don-hang", "DMHEQ:26") !== CM.khoaSoCapPhat("don-hang", "26") && CM.khoaSoCapPhat("don-hang", "XKEQ:26") !== CM.khoaSoCapPhat("don-hang", "XK:26"));
  /* Tiền tố lạ vẫn KHÔNG tự đặt được hệ mã mới (quy tắc E-6) — danh sách trắng chỉ thêm đúng DMHEQ/XKEQ. */
  for (const la of ["DMHX:26", "EQ:26", "ABC:26", "dmheq:26", "XKE:26"]) {
    const r = D.maDonHangTiepTheo(la, []);
    /* Không mở được hệ mã của tiền tố lạ, và không "mượn" được số hợp lệ của dãy EQUI/XK. */
    kiem(`tiền tố lạ ${la} không sinh hệ mã mới`, !r.startsWith(la.split(":")[0]) && !/^(DMHEQ|XKEQ|XK)\d{6}$/.test(r), r);
  }
  kiem("khuôn xem trước: thường DMH/XK, EQUI DMHEQ/XKEQ", D.tienToSoDon(false) === "DMH" && D.tienToSoDon(true) === "XK" && D.tienToSoDon(false, "thuong") === "DMH" && D.tienToSoDon(false, "equi") === "DMHEQ" && D.tienToSoDon(true, "equi") === "XKEQ");
}

/* ════════════════════════════════════════════════════════════════════════════════════════════
   ⑨ GỬI PO THEO KHO — kho thường → QLK CTR (hàm gốc), kho EQUI → App EQUI. Hợp đồng kết nối mục 3:
   payload Y HỆT. 🔴 `gui-po-equi.ts` CHÉP hai hàm dựng payload từ `gui-po-qlk-ctr.ts` (vùng cấm) — bài
   này gọi THẬT cả hai bản (bắt `fetch`) và đòi body bằng nhau từng byte: một bên đổi, bên kia không đổi
   là đỏ ngay.
   ════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const T = G.boGuiPOTheoKho("thuong");
  const E = G.boGuiPOTheoKho("equi");
  kiem("bộ gửi: thiếu kho = kho thường (cùng một bộ)", G.boGuiPOTheoKho(undefined) === T && G.boGuiPOTheoKho("abc") === T);
  kiem("bộ gửi: tham chiếu ỔN ĐỊNH giữa các lần gọi (không làm hook dựng lại)", G.boGuiPOTheoKho("equi") === E && G.boGuiPOTheoKho("thuong") === T && E.guiPOSangQlkCtr === G.boGuiPOTheoKho("equi").guiPOSangQlkCtr);
  kiem("bộ gửi: hai kho là hai bộ hàm KHÁC nhau", T.guiPOSangQlkCtr !== E.guiPOSangQlkCtr && T.canDongBoLaiPO !== E.canDongBoLaiPO && T.guiPOSangQlkCtrDocLap !== E.guiPOSangQlkCtrDocLap && T.canDongBoLaiPODocLap !== E.canDongBoLaiPODocLap);

  const dn = (them = {}) => ({ id: "pr-1", code: "PR-1", maDeXuatAppRequest: "000000301", maHopDongCDT: "HD-EQ-01", ...them });
  const po = (them = {}) => ({
    id: "po-eq-1", code: "DMHEQ260001", prId: "pr-1", maDuAn: "LOT-01", tenCongTrinh: "Lô hàng SX 01", maHopDongCDT: "HD-EQ-01",
    supplierTen: "NCC A", diaChiNCC: "Q1", maSoThueNCC: "0300", ngayLapPO: "2026-10-15", ngayGiaoDuKien: "2026-10-20", ngayGiaoDenNgay: "2026-10-22",
    diaDiemGiaoHang: "Xưởng EQUI", dieuKhoanKhac: "x", nguoiNhanHangTen: "Thủ kho EQUI", nguoiPhuTrachTen: "NV Thu mua", trangThai: "da_chot",
    items: [
      { stt: 1, sttDongDeNghi: 1, tenVatLieu: "Thép tấm", thongSoKyThuat: " 10ly ", donViTinh: "kg", khoiLuongDat: 100 },
      { stt: 2, sttDongDeNghi: 2, tenVatLieu: "Bulong", donViTinh: "bộ", khoiLuongDat: 50 },
      { stt: 3, laDongGhiChu: true, tenVatLieu: "Ghi chú: giao giờ hành chính", donViTinh: "", khoiLuongDat: 0 },
    ],
    ...them,
  });
  const caPO = [
    ["PO có đề nghị", po(), dn()],
    ["đã Xác nhận nhận hàng", po({ xacNhanKho: { thoiDiem: "2026-10-21T08:00:00Z", ten: "NV Thu mua", uid: "u1" } }), dn()],
    ["đơn hủy", po({ trangThai: "huy" }), dn()],
    ["loaiHoSo cong_trinh, thiếu HĐ CĐT", po({ maHopDongCDT: "" }), dn({ maHopDongCDT: "", loaiHoSo: "cong_trinh" })],
  ];

  const that = globalThis.fetch;
  const goi = [];
  let traVe = { ok: true, status: 200, json: async () => ({ ok: true }) };
  globalThis.fetch = async (url, opt) => { goi.push({ url: String(url), body: opt?.body }); return traVe; };
  const chay = async (f, ...a) => { const truoc = goi.length; const kq = await f(...a); return { kq, moi: goi.slice(truoc) }; };
  try {
    for (const [ten, p, d] of caPO) {
      const t = await chay(T.guiPOSangQlkCtr, p, d);
      const e = await chay(E.guiPOSangQlkCtr, p, d);
      kiem(`[${ten}] kho thường gửi /api/qlk-ctr/gui-po`, t.moi.length === 1 && t.moi[0].url === "/api/qlk-ctr/gui-po", JSON.stringify(t.moi.map((x) => x.url)));
      kiem(`[${ten}] kho EQUI gửi /api/equi/gui-po (KHÔNG chạm QLK CTR)`, e.moi.length === 1 && e.moi[0].url === "/api/equi/gui-po", JSON.stringify(e.moi.map((x) => x.url)));
      kiem(`[${ten}] payload EQUI = payload QLK CTR (từng byte)`, t.moi[0]?.body === e.moi[0]?.body, `\n    QLK : ${t.moi[0]?.body}\n    EQUI: ${e.moi[0]?.body}`);
      kiem(`[${ten}] snapshot hai bản bằng nhau`, t.kq.snapshot !== undefined && t.kq.snapshot === e.kq.snapshot);
      const daGui = { ...p, qlkCtrSyncedSnapshot: e.kq.snapshot };
      kiem(`[${ten}] canDongBoLai: vừa gửi xong → cả hai false`, T.canDongBoLaiPO(daGui, d) === false && E.canDongBoLaiPO(daGui, d) === false);
      const daSua = { ...daGui, ngayGiaoDuKien: "2026-11-01" };
      kiem(`[${ten}] canDongBoLai: sửa PO → cả hai true`, T.canDongBoLaiPO(daSua, d) === true && E.canDongBoLaiPO(daSua, d) === true);
    }

    /* PO ĐỘC LẬP — cùng phép so, route riêng. */
    for (const [ten, p] of [["độc lập", po({ prId: undefined, trangThai: "cho_de_nghi" })], ["độc lập đã xác nhận", po({ prId: undefined, xacNhanKho: { thoiDiem: "2026-10-21", ten: "A" } })]]) {
      const t = await chay(T.guiPOSangQlkCtrDocLap, p);
      const e = await chay(E.guiPOSangQlkCtrDocLap, p);
      kiem(`[${ten}] kho thường → /api/qlk-ctr/gui-po-doc-lap, EQUI → /api/equi/gui-po-doc-lap`, t.moi[0]?.url === "/api/qlk-ctr/gui-po-doc-lap" && e.moi[0]?.url === "/api/equi/gui-po-doc-lap" && t.moi.length === 1 && e.moi.length === 1);
      kiem(`[${ten}] payload độc lập EQUI = QLK CTR (từng byte)`, t.moi[0]?.body === e.moi[0]?.body, `\n    QLK : ${t.moi[0]?.body}\n    EQUI: ${e.moi[0]?.body}`);
      const daGui = { ...p, qlkCtrSyncedSnapshot: e.kq.snapshot };
      kiem(`[${ten}] canDongBoLaiPODocLap: hai bản cùng kết luận`, T.canDongBoLaiPODocLap(daGui) === false && E.canDongBoLaiPODocLap(daGui) === false && T.canDongBoLaiPODocLap({ ...daGui, dieuKhoanKhac: "y" }) === true && E.canDongBoLaiPODocLap({ ...daGui, dieuKhoanKhac: "y" }) === true);
    }

    /* CHỐT KHÔNG ÁP DỤNG — giống hệt: không gọi gì cả. */
    const khongApDung = [
      ["hồ sơ phòng ban", po({ maHopDongCDT: "" }), dn({ maHopDongCDT: "" })],
      ["khai rõ phòng ban", po(), dn({ loaiHoSo: "phong_ban" })],
      ["thiếu mã đề xuất App Request", po(), dn({ maDeXuatAppRequest: undefined })],
      ["không có đề nghị", po(), undefined],
    ];
    for (const [ten, p, d] of khongApDung) {
      const t = await chay(T.guiPOSangQlkCtr, p, d);
      const e = await chay(E.guiPOSangQlkCtr, p, d);
      kiem(`[${ten}] hai bản đều { apDung:false } và KHÔNG gọi mạng`, t.kq.apDung === false && e.kq.apDung === false && t.moi.length === 0 && e.moi.length === 0);
      kiem(`[${ten}] canDongBoLai: hai bản đều false`, T.canDongBoLaiPO(p, d) === false && E.canDongBoLaiPO(p, d) === false);
    }
    const pbDocLap = po({ prId: undefined, maHopDongCDT: "" });
    const tDL = await chay(T.guiPOSangQlkCtrDocLap, pbDocLap);
    const eDL = await chay(E.guiPOSangQlkCtrDocLap, pbDocLap);
    kiem("[độc lập phòng ban] hai bản đều không áp dụng, không gọi mạng", tDL.kq.apDung === false && eDL.kq.apDung === false && tDL.moi.length + eDL.moi.length === 0);

    /* LỖI — cùng cách cắt + phân loại (404 vĩnh viễn, 502 tạm thời, mạng hỏng tạm thời). */
    for (const [ten, tv, loai] of [
      ["404 khong_co_de_nghi", { ok: false, status: 404, json: async () => ({ ok: false, error: "Không có đề nghị", loaiLoi: "vinh_vien" }) }, "vinh_vien"],
      ["502 tạm thời", { ok: false, status: 502, json: async () => ({ ok: false, error: "x".repeat(900) }) }, "tam_thoi"],
      ["body không phải JSON", { ok: false, status: 500, json: async () => { throw new Error("html"); } }, "tam_thoi"],
    ]) {
      traVe = tv;
      const t = await chay(T.guiPOSangQlkCtr, po(), dn());
      const e = await chay(E.guiPOSangQlkCtr, po(), dn());
      kiem(`[lỗi ${ten}] hai bản trả CÙNG kết quả (${loai})`, JSON.stringify(t.kq) === JSON.stringify(e.kq) && e.kq.thanhCong === false && e.kq.loaiLoi === loai, `${JSON.stringify(t.kq).slice(0, 120)} | ${JSON.stringify(e.kq).slice(0, 120)}`);
    }
    globalThis.fetch = async () => { throw new Error("mất mạng"); };
    const tM = await T.guiPOSangQlkCtr(po(), dn());
    const eM = await E.guiPOSangQlkCtr(po(), dn());
    kiem("[mất mạng] hai bản cùng tạm thời", JSON.stringify(tM) === JSON.stringify(eM) && eM.loaiLoi === "tam_thoi");
  } finally {
    globalThis.fetch = that;
  }
}

/* ════════════════════════════════════════════════════════════════════════════════════════════
   ⑩ CHỮ TRÊN MÀN HÌNH — kho thường trả NGUYÊN chữ cũ, kho EQUI nói "App EQUI".
   ════════════════════════════════════════════════════════════════════════════════════════════ */
for (const cu of ["app Kho công trình", "QLK CTR", "App Kho", "app kho", "Kho công trình", "app QLK CTR"]) {
  kiem(`tenAppKho thường giữ nguyên "${cu}"`, TA.tenAppKho("thuong", cu) === cu && TA.tenAppKho(undefined, cu) === cu);
  kiem(`tenAppKho EQUI "${cu}" → App EQUI`, TA.tenAppKho("equi", cu) === "App EQUI");
}

rmSync(thuMuc, { recursive: true, force: true });
if (hong.length) {
  console.error(`${DO}⛔ ${hong.length} luật kho EQUI HỎNG:${HET}`);
  for (const h of hong) console.error("  ✗ " + h);
  process.exit(1);
}
console.log(`${XANH}✓ ${dat}/${dat} luật kho EQUI còn nguyên hiệu lực.${HET}`);
