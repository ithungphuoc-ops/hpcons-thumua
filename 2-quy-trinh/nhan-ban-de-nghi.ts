// ============================================================
// LUẬT NHÂN BẢN / TÁCH ĐỀ NGHỊ
//
// 🔴 Ban lãnh đạo 13/08/2026: *"tên của đề xuất giữ nguyên chỉ thêm chữ copy phía sau, để
// sau này có thể tổng hợp lại các đề xuất con của cái đề xuất lớn đó"*.
//
// ⚠️ FILE NÀY SINH RA VÌ MỘT LỖI THẬT. Trước đó luật đặt tên nằm ở kho dữ liệu, còn hộp
// nhân bản tự ghép `${tên} (copy)` để hiện lên màn hình. Hai chỗ cùng tính một thứ nên
// lệch nhau: nhân bản từ một bản copy thì hộp báo *"... (copy) (copy)"* trong khi app lưu
// *"... (copy 2)"*. Người dùng đọc hộp rồi tin vào con số sai.
//
// 👉 Hàm ở đây là HÀM THUẦN, không đụng React. Mọi nơi cần biết tên bản sao hay quan hệ
// cha–con đều gọi qua đây — đừng tự tính lại ở file giao diện.
// ============================================================

import type {
  BaoGia,
  CongViecDaXong,
  DeNghiMuaHang,
  DonDatHang,
  DongDeNghi,
  NgayISO,
} from "@/3-du-lieu/kieu-du-lieu";

/**
 * Phiếu GỐC ĐẦU TIÊN của một đề nghị.
 *
 * Nhân bản từ một bản copy vẫn trả về phiếu lớn ban đầu — quan hệ cha–con **chỉ một cấp**,
 * để mọi phần tách của cùng một đề xuất gom được bằng một phép lọc, không phải lần ngược
 * từng đời. Phiếu không phải bản sao thì chính nó là gốc.
 */
export function phieuGocCua(dn: DeNghiMuaHang, tatCa: DeNghiMuaHang[]): DeNghiMuaHang {
  if (!dn.deNghiGocId) return dn;
  return tatCa.find((d) => d.id === dn.deNghiGocId) ?? dn;
}

/** Các bản đã tách ra từ một phiếu gốc. Lọc theo id, KHÔNG theo tên. */
export function cacBanTachCua(gocId: string, tatCa: DeNghiMuaHang[]): DeNghiMuaHang[] {
  return tatCa.filter((d) => d.deNghiGocId === gocId);
}

/** Các phiếu con TRỰC TIẾP (theo `deNghiChaId`) của một phiếu. */
export function cacConTrucTiep(id: string, tatCa: readonly DeNghiMuaHang[]): DeNghiMuaHang[] {
  return tatCa.filter((d) => d.deNghiChaId === id && d.id !== id);
}

/**
 * ★★ CẢ CÂY HẬU DUỆ (con, cháu, chắt…) theo `deNghiChaId` — Sếp 26/09/2026 (nhân bản theo NCC).
 *
 * 🔴 VÌ SAO CẦN: `cacBanTachCua` lọc theo `deNghiGocId` — trường đó luôn trỏ về phiếu GỐC ĐẦU TIÊN,
 * nên với một phiếu ở giữa (vd phiếu con giao việc `…__A` rồi A nhân bản tiếp theo NCC) thì bản cháu
 * KHÔNG hiện trong danh sách con của `…__A`, và chốt "còn bản con dở" của `…__A` không thấy nó —
 * `…__A` đóng được trong khi phần tách đi của nó còn đang mua.
 *
 * 📌 Có chốt chống vòng (dữ liệu hỏng trỏ vòng thì không lặp vô hạn). Thứ tự: theo từng tầng.
 */
export function cayHauDue(id: string, tatCa: readonly DeNghiMuaHang[]): DeNghiMuaHang[] {
  const ra: DeNghiMuaHang[] = [];
  const daThay = new Set<string>([id]);
  let tang = [id];
  while (tang.length > 0) {
    const tiep: string[] = [];
    for (const cha of tang) {
      for (const con of tatCa) {
        if (con.deNghiChaId !== cha || daThay.has(con.id)) continue;
        daThay.add(con.id);
        ra.push(con);
        tiep.push(con.id);
      }
    }
    tang = tiep;
  }
  return ra;
}

/**
 * Hậu duệ để HIỂN THỊ và để CHỐT HOÀN THÀNH: hợp của `cacBanTachCua` (bản cũ chỉ có `deNghiGocId`)
 * và `cayHauDue` (theo `deNghiChaId`, nhìn được cả cháu). Không trùng phần tử.
 */
export function hauDueCua(id: string, tatCa: readonly DeNghiMuaHang[]): DeNghiMuaHang[] {
  const ra = cayHauDue(id, tatCa);
  const co = new Set(ra.map((d) => d.id));
  for (const d of tatCa) {
    if (d.deNghiGocId === id && d.id !== id && !co.has(d.id)) {
      co.add(d.id);
      ra.push(d);
    }
  }
  return ra;
}

/**
 * ★ Dòng này đã có báo giá hoặc đơn hàng (chưa huỷ) trỏ tới chưa.
 *
 * 🔴 Dòng đã có chứng từ thì KHÔNG được chuyển việc / bỏ phân bổ / nhân bản: báo giá và PO trỏ về
 * `prId` + `sttDongDeNghi` của phiếu đang giữ nó; rút / tách dòng đi là PO đã lập bị bỏ khỏi tiến độ
 * còn phiếu mới lại thấy dòng "chưa lên đơn" → mua hai lần (phản biện 26/09).
 *
 * 📌 Dời từ `tach-khi-giao-viec.ts` sang đây (26/09/2026) để luật nhân bản dùng được mà không thành
 * vòng import; `tach-khi-giao-viec.ts` xuất lại y nguyên tên này.
 */
export function dongDaCoChungTu(
  dnId: string,
  stt: number,
  baoGia: readonly Pick<BaoGia, "prId" | "trangThai" | "items">[],
  donHang: readonly Pick<DonDatHang, "prId" | "trangThai" | "items">[],
): boolean {
  const coBaoGia = baoGia.some(
    (bg) => bg.prId === dnId && bg.trangThai !== "huy" && bg.items.some((d) => d.sttDongDeNghi === stt),
  );
  if (coBaoGia) return true;
  return donHang.some(
    (po) => po.prId === dnId && po.trangThai !== "huy" && po.items.some((d) => d.sttDongDeNghi === stt),
  );
}

// ════════════════════════════════════════════════════════════════════════════════════════
// ★★ DÒNG NÀO CỦA PHIẾU GỐC ĐÃ ĐƯỢC NHÂN BẢN ĐI — Sếp 15/09/2026
//
// Nguyên văn: *"khi bấm nhân bản và chọn các mặt hàng để nhân bản xong thì ở đề xuất chính sẽ làm
// mờ các mặt hàng đã nhân bản đi. Và phải có điều kiện hoặc ghi chú nào đó để biết rằng đề nghị đó
// đã được nhân bản để ko bị quên"*.
//
// Sếp chốt tiếp 15/09 khi được hỏi lại:
//   ① Phiếu gốc **KHÔNG CẦN MUA** phần đã nhân bản — *"Không cần mua (nhưng hãy làm mờ đi để vẫn
//      xem được nhưng khi in ra sẽ ko thấy)"*
//   ② Dòng đó **KHÔNG tính là "chưa phân bổ"** — *"vì người nhân bản sẽ là người thực hiện"*
//   ③ Màn của người đề nghị **KHÔNG làm mờ theo** — *"ko cần làm mờ theo"*
//   ④ Ghi **ĐỦ MỌI mã phiếu đích** (cách B), không chỉ mã đầu tiên
//
// 🔴 VÌ SAO KHÔNG LƯU CỜ LÊN DÒNG CỦA PHIẾU GỐC MÀ SUY RA Ở ĐÂY:
// Lưu cờ thì phải dọn nó ở **bốn** chỗ (nhân bản · tách tự động · gộp khi lùi bước · xoá phiếu
// con), bỏ sót một chỗ là dòng mờ vĩnh viễn hoặc mờ oan — và app hiện **không chặn** xoá phiếu gốc
// còn con. Suy ra từ chính các bản con thì xoá con là dấu vết tự mất theo, không bao giờ lệch.
// ════════════════════════════════════════════════════════════════════════════════════════

/**
 * Tra cứu: `stt` dòng ở phiếu gốc → danh sách **mã phiếu** đã nhận dòng đó.
 *
 * Trả về `Map` rỗng khi phiếu chưa bị nhân bản lần nào (trường hợp thường gặp nhất) — nơi gọi chỉ
 * cần hỏi `.size === 0` là biết không phải vẽ gì thêm.
 *
 * 🔴 CHỈ TÍNH BẢN CON CÒN SỐNG. Tham số `tatCa` là danh sách đề nghị hiện có; bản con đã bị xoá
 * hoặc đã bị gộp lại khi lùi bước thì không còn trong đó, nên dấu mờ tự biến mất — đúng ý.
 *
 * ⚠️ `sttDongGoc` chỉ có trên hồ sơ nhân bản **từ 15/09/2026 trở đi**. Bản con cũ hơn không có
 * trường này nên dòng của chúng không được tính — chấp nhận có chủ ý: thà không làm mờ còn hơn làm
 * mờ nhầm một dòng vẫn phải mua.
 */
export function dongDaNhanBanSang(
  goc: Pick<DeNghiMuaHang, "id"> & { items?: readonly Pick<DongDeNghi, "stt" | "khoiLuongDeNghi">[] },
  tatCa: DeNghiMuaHang[],
): BanDoDaTach {
  const ra: BanDoDaTach = new Map<number, string[]>();
  const them = (stt: number, ma: string) => {
    const ds = ra.get(stt) ?? [];
    /* Một bản con có thể chứa nhiều dòng cùng trỏ về một dòng gốc (nếu sau này cho tách theo
       khối lượng). Chỉ ghi mã phiếu MỘT LẦN để câu chữ không lặp. */
    if (!ds.includes(ma)) ds.push(ma);
    ra.set(stt, ds);
  };

  /**
   * ★★ ĐƯỜNG ①: BẢN CON TRỰC TIẾP — thêm 17/09/2026 (hướng C Sếp chốt).
   *
   * 🔴 ĐƯỜNG NÀY GIẢI CA BẢN COPY CẤP 2. Trước đây hàm chỉ quét `cacBanTachCua(goc.id)` — lọc theo
   * `deNghiGocId`, mà trường đó luôn trỏ về phiếu **gốc đầu tiên**. Nên một phiếu copy ở giữa
   * (bản thân nó là con của phiếu khác) tra ra **rỗng**, không biết dòng nào của mình đã giao đi,
   * và kẹt đúng như lỗi đã vá cho phiếu gốc: không vào nổi bước ⑦, không bấm hoàn thành được.
   *
   * Đo trên kho thật 17/09/2026: `2026/HDXD-PR-001 (copy 3)` nhân bản tay từ `(copy)`, mà `(copy)`
   * sinh ra từ tách tự động nên **không có `sttDongGoc`** — tức không có cách nào suy ra, phải có
   * cặp trường riêng `deNghiChaId` + `sttDongCha`.
   *
   * 📌 Khớp theo `deNghiChaId` nên phân biệt được hai bản con của cùng một phiếu; khớp mò theo
   * "anh em cùng gốc" thì cả hai cùng tưởng dòng của mình đã đi, cùng bị trừ hết, và **đóng được
   * hồ sơ chưa mua gì** — nặng hơn hẳn lỗi đang chữa.
   */
  for (const con of tatCa) {
    if (con.deNghiChaId !== goc.id) continue;
    for (const d of con.items ?? []) {
      if (typeof d.sttDongCha !== "number") continue;
      them(d.sttDongCha, con.code);
    }
  }

  /**
   * ★★ ĐƯỜNG ②: BẢN CÙNG GỐC theo `sttDongGoc` — đường vốn có, GIỮ NGUYÊN.
   *
   * 🔴 ĐỪNG BỎ DÙ ĐƯỜNG ① NGHE ĐẦY ĐỦ HƠN. Mọi hồ sơ nhân bản **trước 17/09/2026** không có
   * `deNghiChaId`; bỏ đường này là dấu mờ trên hàng loạt phiếu gốc biến mất, và những phiếu đó
   * kẹt trở lại. Hai đường cùng ghi vào một `Map` nên trùng nhau cũng vô hại.
   */
  for (const con of cacBanTachCua(goc.id, tatCa)) {
    for (const d of con.items ?? []) {
      if (typeof d.sttDongGoc !== "number") continue;
      them(d.sttDongGoc, con.code);
    }
  }
  /* ★ Khối lượng từng dòng (Sếp 26/09/2026) — gắn kèm để `dongDaChuyenDiHet` trả lời theo PHẦN CÒN
     LẠI chứ không theo "có bản con trỏ tới là mờ cả dòng". Chỉ tính khi đã có dòng bị tách. */
  if (ra.size > 0) ra.khoiLuong = khoiLuongDaTachTheoDong(goc, tatCa);
  return ra;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// ★★★ TÁCH THEO KHỐI LƯỢNG — Sếp 26/09/2026 (nhân bản theo NCC)
//
// Nguyên văn: *"có trường hợp đề nghị 100 bao xi măng nhưng phải cần 2 tới 3 NCC mới đáp ứng được
// nên phải tạo 2 tới 3 cái đề nghị nhân bản. Và có trường hợp mua nhiều hơn đề xuất 100 bao, nhưng
// sau khi họp thì cần 120 bao"*.
//
// 🔴 ĐỔI LUẬT "MỜ CẢ DÒNG" THÀNH "TRỪ KHỐI LƯỢNG" — có chủ ý, theo chỉ đạo trên. Trước 26/09 chỉ cần
// một bản con trỏ về dòng là dòng cha coi như đi hết. Nay:
//   · Dòng bản con có `khoiLuongTuCha` → trừ đúng phần đó; dòng cha còn lại bao nhiêu thì phiếu cha
//     tự mua bấy nhiêu (tiến độ / giai đoạn / lập đơn tính theo phần còn lại).
//   · Dòng bản con KHÔNG có `khoiLuongTuCha` (phiếu con giao việc, bản nhân bản cũ) → "cả dòng", y
//     như trước. Nhờ vậy mọi dữ liệu cũ cư xử không đổi.
//   · Bản cũ chỉ nối qua `sttDongGoc` (không có `deNghiChaId`, hoặc cha đã bị xoá) → "cả dòng".
//   · Bản cháu (cha là một phiếu khác còn sống) KHÔNG trừ thẳng vào phiếu gốc — phiếu ở giữa đã trừ
//     phần của nó; trừ thêm ở gốc là trừ hai lần.
// ════════════════════════════════════════════════════════════════════════════════════════

/** Tình trạng tách của MỘT dòng ở phiếu đang xét. */
export interface KhoiLuongTachDong {
  /** Khối lượng của dòng ở phiếu này. */
  khoiLuongDong: number;
  /** Tổng phần đã lấy từ dòng này sang các bản con (không tính phần mua thêm). */
  daLay: number;
  /** Tổng phần các bản con mua THÊM ngoài đề nghị (không trừ vào dòng này). */
  vuot: number;
  /** Có bản con cũ / phiếu con giao việc lấy "cả dòng" (không đo được khối lượng). */
  caDong: boolean;
  /** Phần phiếu này còn phải tự mua. 0 = đã chuyển đi hết. */
  conLai: number;
}

/** `Map` stt → mã các phiếu đã nhận dòng đó, kèm (tuỳ chọn) khối lượng từng dòng. */
export type BanDoDaTach = Map<number, string[]> & { khoiLuong?: Map<number, KhoiLuongTachDong> };

/** Làm tròn 3 chữ số lẻ — tránh 39.99999 do cộng trừ số thực (cùng lệ `apDungChiaKhoiLuong`). */
export function lamTronKhoiLuong(x: number): number {
  return Math.round(x * 1000) / 1000;
}

/**
 * ★★ KHỐI LƯỢNG ĐÃ TÁCH của từng dòng phiếu `goc` — chỉ trả dòng CÓ bản con trỏ tới.
 *
 * `goc.items` bỏ trống thì tra phiếu trong `tatCa`; không tra được thì trả `Map` rỗng (nơi gọi rơi
 * về cách đếm cũ "có bản con = mờ cả dòng" — không trừ mù).
 */
export function khoiLuongDaTachTheoDong(
  goc: Pick<DeNghiMuaHang, "id"> & { items?: readonly Pick<DongDeNghi, "stt" | "khoiLuongDeNghi">[] },
  tatCa: readonly DeNghiMuaHang[],
): Map<number, KhoiLuongTachDong> {
  const ra = new Map<number, KhoiLuongTachDong>();
  const dong = goc.items ?? tatCa.find((d) => d.id === goc.id)?.items;
  if (!dong) return ra;
  const klDong = new Map(dong.map((d) => [d.stt, Number(d.khoiLuongDeNghi) || 0]));
  const lay = (stt: number): KhoiLuongTachDong | undefined => {
    if (!klDong.has(stt)) return undefined;
    let x = ra.get(stt);
    if (!x) {
      x = { khoiLuongDong: klDong.get(stt) ?? 0, daLay: 0, vuot: 0, caDong: false, conLai: 0 };
      ra.set(stt, x);
    }
    return x;
  };
  const idConSong = new Set(tatCa.map((d) => d.id));

  /* Đường ①: bản con trực tiếp. */
  for (const con of tatCa) {
    if (con.deNghiChaId !== goc.id || con.id === goc.id) continue;
    for (const d of con.items ?? []) {
      if (typeof d.sttDongCha !== "number") continue;
      const x = lay(d.sttDongCha);
      if (!x) continue;
      if (typeof d.khoiLuongTuCha === "number" && Number.isFinite(d.khoiLuongTuCha)) {
        x.daLay += Math.max(0, d.khoiLuongTuCha);
      } else {
        x.caDong = true;
      }
      x.vuot += Math.max(0, Number(d.khoiLuongVuotCha) || 0);
    }
  }
  /* Đường ②: bản cũ chỉ nối qua `sttDongGoc` — không có cha trực tiếp, hoặc cha đã bị xoá. */
  for (const con of tatCa) {
    if (con.deNghiGocId !== goc.id || con.id === goc.id) continue;
    if (con.deNghiChaId && (con.deNghiChaId === goc.id || idConSong.has(con.deNghiChaId))) continue;
    for (const d of con.items ?? []) {
      if (typeof d.sttDongGoc !== "number") continue;
      const x = lay(d.sttDongGoc);
      if (x) x.caDong = true;
    }
  }
  for (const x of ra.values()) {
    x.daLay = lamTronKhoiLuong(x.daLay);
    x.vuot = lamTronKhoiLuong(x.vuot);
    x.conLai = x.caDong ? 0 : Math.max(0, lamTronKhoiLuong(x.khoiLuongDong - x.daLay));
  }
  return ra;
}

/**
 * Câu hiện cạnh dòng CHỈ TÁCH MỘT PHẦN — vd *"còn 40/100 bao · 60 đã tách sang X"*. Dòng mua vượt
 * thêm *" · tổng mua 120 / đề nghị 100 · vượt 20"*. Trả `null` khi dòng đã đi hết hoặc chưa tách.
 */
export function moTaTachMotPhan(
  x: KhoiLuongTachDong | undefined,
  donVi: string,
  maPhieu: readonly string[],
): string | null {
  if (!x || x.caDong || (x.daLay <= 0 && x.vuot <= 0)) return null;
  const dv = donVi ? ` ${donVi}` : "";
  const phan: string[] = [];
  if (x.conLai > 0) phan.push(`còn ${x.conLai}/${x.khoiLuongDong}${dv}`);
  if (x.daLay > 0) phan.push(`${x.daLay}${dv} đã tách sang ${maPhieu.join(", ")}`);
  else if (maPhieu.length > 0) phan.push(`đã nhân bản sang ${maPhieu.join(", ")}`);
  return phan.join(" · ");
}

/** Câu phần mua vượt đề nghị của một dòng — `null` khi không vượt. */
export function moTaVuotDeNghi(x: KhoiLuongTachDong | undefined, donVi: string): string | null {
  if (!x || x.vuot <= 0) return null;
  const dv = donVi ? ` ${donVi}` : "";
  const tong = lamTronKhoiLuong(x.khoiLuongDong + x.vuot);
  return `${tong} / đề nghị ${x.khoiLuongDong}${dv} · vượt ${x.vuot}`;
}

/**
 * Câu ghi chú hiện cạnh dòng đã nhân bản — **cách B Sếp chọn: liệt kê ĐỦ mọi mã phiếu**.
 *
 * 🔴 KHÔNG RÚT GỌN THÀNH "đã nhân bản sang 2 bản". Mục đích của cả tính năng này là *"để không bị
 * quên"*; giấu bớt một bản đi là đi ngược đúng mục đích đó. Sếp đã được hỏi và chọn cách liệt kê
 * đủ, chấp nhận dòng dài.
 */
export function ghiChuDaNhanBan(maPhieu: string[]): string {
  return `Đã nhân bản sang ${maPhieu.join(", ")}`;
}

/**
 * Dòng này có còn phải mua ở phiếu gốc nữa không.
 *
 * 🔴 DÙNG HÀM NÀY Ở MỌI NƠI, ĐỪNG SO `sttDongGoc` TAY. Sếp chốt *"không cần mua"*, nên câu trả lời
 * ở đây quyết định cả việc hiển thị (làm mờ) lẫn việc tính toán (bỏ khỏi phép đếm chưa phân bổ /
 * chưa lên đơn). Hai bên hỏi hai kiểu là giao diện nói một đằng, luật chạy một nẻo.
 */
export function dongDaChuyenDiHet(stt: number, daNhanBan: BanDoDaTach): boolean {
  if ((daNhanBan.get(stt)?.length ?? 0) === 0) return false;
  /* ★ Sếp 26/09/2026: dòng chỉ tách MỘT PHẦN khối lượng thì CHƯA đi hết — phiếu này còn mua phần
     còn lại. `Map` dựng tay (không kèm khối lượng) thì giữ cách đếm cũ. */
  const kl = daNhanBan.khoiLuong?.get(stt);
  if (!kl) return true;
  return kl.conLai <= 0;
}

/** Phần còn lại phiếu này phải tự mua của một dòng (`null` = dòng chưa bị tách chút nào). */
export function khoiLuongConLaiCuaDong(stt: number, daNhanBan: BanDoDaTach): number | null {
  if ((daNhanBan.get(stt)?.length ?? 0) === 0) return null;
  const kl = daNhanBan.khoiLuong?.get(stt);
  return kl ? kl.conLai : 0;
}

/**
 * Trừ phần đã tách khỏi MỘT dòng tiến độ (dòng chỉ tách một phần). Chỉnh những trường số có mặt:
 * `khoiLuongDeNghi`, `khoiLuongChuaLenPO`, `khoiLuongConLai`, `phanTram`, `trangThaiDong`.
 */
function truPhanDaTach<T>(d: T, x: KhoiLuongTachDong): T {
  const bot = lamTronKhoiLuong(x.khoiLuongDong - x.conLai);
  if (!(bot > 0)) return d;
  const o = d as unknown as Record<string, unknown>;
  const ra: Record<string, unknown> = { ...o };
  if (typeof o.khoiLuongDeNghi === "number") ra.khoiLuongDeNghi = x.conLai;
  if (typeof o.khoiLuongChuaLenPO === "number") {
    ra.khoiLuongChuaLenPO = Math.max(0, lamTronKhoiLuong(o.khoiLuongChuaLenPO - bot));
  }
  if (typeof o.khoiLuongConLai === "number") {
    ra.khoiLuongConLai = Math.max(0, lamTronKhoiLuong(o.khoiLuongConLai - bot));
  }
  if (typeof o.khoiLuongDaNhan === "number" && typeof o.phanTram === "number") {
    ra.phanTram = x.conLai > 0 ? Math.min(100, (o.khoiLuongDaNhan / x.conLai) * 100) : 100;
  }
  if (typeof o.trangThaiDong === "string" && ra.khoiLuongConLai === 0 && x.conLai > 0) {
    ra.trangThaiDong = "da_nhan_du";
  }
  return ra as T;
}

/**
 * ★★ LỌC BỎ DÒNG ĐÃ NHÂN BẢN ĐI KHỎI MỘT MẢNG TIẾN ĐỘ — Sếp 17/09/2026.
 *
 * 🔴 LỖI THẬT ĐÃ ĐO ĐƯỢC, KHÔNG PHẢI DỌN DẸP CHO ĐẸP. Trước bản vá này, phiếu gốc đã nhân bản 2/3
 * mặt hàng đi vẫn bị tính tiến độ trên **cả 3 dòng**, nên:
 *   · `xacDinhGiaiDoan` → nhánh `daVeDu` không bao giờ đúng ⇒ thẻ **không vào nổi cột ⑦ Hồ sơ
 *     thanh toán**, nằm lại ở ⑤/⑥ vĩnh viễn;
 *   · `vuongMacHoanThanhQuyTrinh` → *"còn 2 mặt hàng chưa lên đơn"* ⇒ **không bấm hoàn thành được**,
 *     dù 2 mặt hàng đó đang được người khác mua ở bản con.
 * Người giữ phiếu gốc không sai gì mà hồ sơ kẹt — và trên bảng KPI thì đó là một phiếu "trễ hạn"
 * ghi vào tên họ.
 *
 * 🔴 VÌ SAO KHÔNG SỬA `tinhTienDoDeNghi` (cách nghe hợp lý nhất và LÀ CÁCH SAI):
 * `giai-doan-mua-hang.ts` dòng ~200 đã ghi rõ lý do bác — `khoiLuongChuaLenPO` có **13 nơi đọc**,
 * trong đó có bảng phân bổ (**Sếp 15/09 yêu cầu dòng đã nhân bản vẫn LÀM MỜ để xem được**, trừ ở
 * tầng đó là dòng biến mất hẳn) và phép kiểm ngân sách khi sửa đơn. Nên trừ ở **đúng hai điểm
 * quyết định**, giống hệt khuôn `dongConPhaiLam` người trước đã đặt, chứ không trừ ở gốc.
 *
 * ⚠️ THIẾU `tatCaDeNghi` THÌ TRẢ NGUYÊN MẢNG — cư xử y như trước, tuyệt đối không trừ mù. Nơi gọi
 * chưa cập nhật mà đã trừ là cho đóng hồ sơ chưa mua gì, tức đổi một lỗi kẹt lấy một lỗi nặng hơn.
 *
 * 📌 `stt` ĐỂ TÙY CHỌN, VÀ DÒNG KHÔNG CÓ `stt` THÌ GIỮ LẠI. `vuongMacHoanThanhQuyTrinh` khai tham
 * số tiến độ ở dạng rút gọn (chỉ hai con số) và `kiem-luat-dung-chung.mjs` dựng mảng tay theo đúng
 * dạng đó. Đòi `stt` bắt buộc là mọi bài kiểm cũ gãy cùng lúc; còn loại bỏ dòng thiếu `stt` là trừ
 * mù — cả hai đều tệ hơn việc giữ nguyên dòng không đối chiếu được.
 */
export function locTienDoConPhaiMua<T extends { stt?: number }>(
  goc: Pick<DeNghiMuaHang, "id">,
  tatCaDeNghi: DeNghiMuaHang[] | undefined,
  tienDo: T[],
): T[] {
  if (!tatCaDeNghi || tatCaDeNghi.length === 0) return tienDo;
  const daNhanBan = dongDaNhanBanSang(goc, tatCaDeNghi);
  /* Phiếu chưa bị nhân bản lần nào — ca thường gặp nhất. Trả thẳng mảng cũ, không tạo mảng mới. */
  if (daNhanBan.size === 0) return tienDo;
  return tienDo
    .filter((d) => typeof d.stt !== "number" || !dongDaChuyenDiHet(d.stt, daNhanBan))
    .map((d) => {
      /* ★ Sếp 26/09/2026: dòng chỉ tách MỘT PHẦN → tiến độ tính theo PHẦN CÒN LẠI. */
      const x = typeof d.stt === "number" ? daNhanBan.khoiLuong?.get(d.stt) : undefined;
      return x && !x.caDong ? truPhanDaTach(d, x) : d;
    });
}

/**
 * MÃ của bản sao sắp tạo ra khi nhân bản `dn` — ví dụ `260001-HPCS-PR-001 (copy)`.
 *
 * 🔴 Ban lãnh đạo 13/08/2026 nói rõ bằng ví dụ: *"ý a là 26001-HPCS-PR-001 (copy)"*. Tức
 * bản tách **giữ nguyên mã của đề xuất lớn**, chỉ thêm "(copy)" — nhìn mã là biết ngay nó
 * thuộc đề xuất nào, không cần mở ra tra. Đó chính là cách "tổng hợp lại các đề xuất con".
 *
 * ⚠️ KHÔNG cấp mã PR mới cho bản tách. Cấp mã mới (PR-002, PR-003…) là mỗi phần tách trông
 * như một đề nghị độc lập, và trên bảng quy trình không còn dấu hiệu nào nói chúng cùng
 * một gốc.
 *
 * 📌 Luôn bám mã của PHIẾU GỐC ĐẦU TIÊN, không nối vào mã phiếu đang nhân bản. Tách 3 lần
 * mà lần nào cũng nối thì bản thứ ba thành *"…PR-001 (copy) (copy) (copy)"*. Nay: bản đầu
 * "(copy)", các bản sau "(copy 2)", "(copy 3)"…
 */
/**
 * ★ TÊN (TIÊU ĐỀ) CỦA MỘT BẢN TÁCH — Ban lãnh đạo 22/08/2026: *"Tên của quy trình giống nhau và
 * thêm chữ copy phía sau"*, và *"tên của nó sẽ vẫn giống như công việc cha chỉ thêm từ copy + số
 * tt của công việc con đó trong công việc cha"*.
 *
 * 🔴 ĐỔI MỘT QUYẾT ĐỊNH CŨ. Quyết định 44 (phiên 09, 13/08/2026) ghi *"tiêu đề giữ nguyên tuyệt
 * đối"* để sau này tổng hợp lại được. Nay Ban lãnh đạo yêu cầu tên có `copy`, nên tôi làm theo —
 * và việc tổng hợp KHÔNG mất: quan hệ cha–con vẫn nằm ở `deNghiGocId` + `maDeNghiGoc`, hai trường
 * đó mới là khóa nối, chứ không phải tên.
 *
 * 📌 Số thứ tự lấy ĐÚNG số của mã (`(copy)`, `(copy 2)`…) nên tên và mã luôn khớp nhau. Tính số
 * riêng ở đây là sớm muộn tên nói "copy 2" mà mã nói "(copy 3)".
 */
export function tenBanSaoTheoMa(tieuDeGoc: string, maBanSao: string): string {
  const khop = maBanSao.match(/\(copy(?: (\d+))?\)\s*$/);
  if (!khop) return tieuDeGoc;
  /**
   * 🔴 BẢN ĐẦU TIÊN: MÃ LÀ "(copy)" THÌ TÊN CŨNG PHẢI LÀ "(copy)" — sửa 17/09/2026.
   *
   * Trước đây dòng này ghi `" 1"` khi mã không có số, nên bản đầu tiên có **mã `…PR-001 (copy)`
   * mà tên `… (copy 1)`**. Hai thứ lệch nhau ngay trong cùng một hồ sơ, trong khi chú thích ngay
   * trên hàm này tự nhận *"tên và mã luôn khớp nhau"* — app tự nói sai về chính nó.
   *
   * 📌 Hậu quả tuy nhẹ nhưng có thật: người dùng tìm theo tên đọc được trên thẻ (`copy 1`) sẽ
   * không khớp mã hồ sơ, và hai bản tách đầu tiên của hai đề nghị khác nhau lại trông như cùng
   * một cách đánh số. Từ bản thứ hai trở đi (`(copy 2)`) vốn đã khớp, chỉ bản đầu sai.
   */
  const so = khop[1] ? ` ${khop[1]}` : "";
  return `${tieuDeGoc} (copy${so})`;
}

export function maBanSaoTiepTheo(dn: DeNghiMuaHang, tatCa: DeNghiMuaHang[]): string {
  const goc = phieuGocCua(dn, tatCa);
  /**
   * ⚠️ ĐẾM KHÔNG ĐỦ, PHẢI DÒ CHO TỚI KHI KHÔNG TRÙNG.
   *
   * Đếm số bản đang có rồi +1 nghe hợp lý nhưng sai khi có bản bị xóa: còn "(copy)" và
   * "(copy 2)", xóa "(copy)" đi thì số bản còn 1 → bản mới lại mang tên "(copy 2)", **trùng
   * mã với bản đang tồn tại**. Hai hồ sơ cùng mã là chuyện không được phép xảy ra.
   */
  const daDung = new Set(tatCa.map((d) => d.code));
  let ma = `${goc.code} (copy)`;
  let lan = 1;
  while (daDung.has(ma)) {
    lan += 1;
    ma = `${goc.code} (copy ${lan})`;
  }
  return ma;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// ★★ LÀM SẠCH BẢN NHÂN BẢN — Sếp 15/09/2026
//
// Nguyên văn: *"gọi thêm agent xử lý việc làm sạch thông tin khi nhân bản quy trình đối với
// các quy trình đã có sẵn file đính kèm hoặc ghi chú, a cần làm sạch tất cả khi trả về bước 2"*.
//
// Bản nhân bản luôn bắt đầu lại ở bước ② (Yêu cầu NCC báo giá). Phiếu gốc có thể đã đi tới bước
// ⑦ — lúc đó nó mang theo tệp đính kèm của từng bước, bình luận, lý do thiếu chứng từ, lý do
// thất bại. Trước 15/09/2026 chỗ dựng bản sao viết `{ ...goc }` nên **chép sạch những thứ đó**:
// bản copy vừa sinh ra đã có sẵn "Hợp đồng đã ký", "Hóa đơn VAT" của phiếu khác — hồ sơ nói dối
// đúng kiểu CLAUDE.md §3.5 cấm.
//
// 🔴 CHỈ BỎ THAM CHIẾU, TUYỆT ĐỐI KHÔNG XOÁ NỘI DUNG TỆP. Mô tả tệp (`MoTaTep`) nằm trong dữ
// liệu nghiệp vụ, còn NỘI DUNG nằm ở `3-du-lieu/kho-tep.ts` tra theo `id`. Bản copy và phiếu gốc
// mang CÙNG một `id` tệp, nên gọi `xoaTep` ở đây là **phiếu gốc mất chứng từ**. Bỏ tham chiếu
// không sinh tệp mồ côi: phiếu gốc vẫn trỏ tới đúng những tệp đó.
//
// 👉 HÀM THUẦN, đặt ở đây chứ không ở hook React, để `kiem-luat-dung-chung.mjs` gọi thật được.
// Luật nằm trong hook thì không bài kiểm nào bắt được lúc ai đó vô tình làm rơi một dòng.
// ════════════════════════════════════════════════════════════════════════════════════════

/**
 * Những bước mà VIỆC ĐÃ TÍCH vẫn còn hiệu lực với bản nhân bản.
 *
 * 🔴 KHÔNG XOÁ SẠCH `congViecDaXong` — làm vậy là dựng lại đúng lỗi đã sửa ngày 27/08/2026 ở
 * `tachTheoPhanBo`: bản copy được gán người phụ trách nên đủ điều kiện rời bước ①, mà việc bắt
 * buộc của bước ① (*"Checkin hàng tồn kho"*) lại về trạng thái *chưa tích* — thẻ đứng ở bước ②
 * kèm dòng "còn 1 việc chưa xong" mà **không ai tích được**, vì việc đó đã làm xong từ phiếu gốc.
 *
 * 🔴 NHƯNG CŨNG KHÔNG KẾ THỪA HẾT: việc đã tích ở bước ③ trở đi là TIẾN TRÌNH CỦA PHIẾU GỐC (vd
 * *"Đã xử lý ủy nhiệm chi"* ở bước Hồ sơ thanh toán). Chép sang là bản copy khoe đã làm xong việc
 * nó chưa từng làm.
 *
 * ⚠️ VIẾT THẲNG MÃ BƯỚC, KHÔNG IMPORT `GIAI_DOAN_MUA_HANG`. `giai-doan-mua-hang.ts` đang import
 * ngược tệp này (`dongDaNhanBanSang`, `dongDaChuyenDiHet`) — import qua lại là **vòng import**.
 * Khóa của `CongViecDaXong.giaiDoan` để kiểu `string` chính vì lý do tầng, xem `kieu-du-lieu.ts`.
 */
export const BUOC_GIU_VIEC_DA_TICH_KHI_NHAN_BAN: readonly string[] = [
  "tiep_nhan",
  "yeu_cau_bao_gia",
];

/** Việc đã tích của phiếu gốc còn giữ được cho bản copy. Trả `undefined` khi không còn gì. */
export function viecDaTichGiuLaiKhiNhanBan(
  da: CongViecDaXong[] | undefined,
): CongViecDaXong[] | undefined {
  const giu = (da ?? []).filter((v) => BUOC_GIU_VIEC_DA_TICH_KHI_NHAN_BAN.includes(v.giaiDoan));
  return giu.length > 0 ? giu : undefined;
}

/** Tham số dựng một bản nhân bản. Mọi giá trị "của môi trường" (id, ngày giờ) truyền từ ngoài
 *  vào để hàm này thuần — chạy lại bao nhiêu lần cũng ra cùng kết quả, và thử được bằng Node. */
export interface ThamSoDungBanNhanBan {
  /** Phiếu đang bấm nhân bản — có thể chính nó đã là một bản copy. */
  goc: DeNghiMuaHang;
  /** PHIẾU GỐC ĐẦU TIÊN của cả nhóm (`phieuGocCua`). Tên và quan hệ cha–con bám theo nó. */
  phieuGocDau: DeNghiMuaHang;
  idMoi: string;
  /** Mã bản sao, tính bằng `maBanSaoTiepTheo`. */
  maMoi: string;
  /** Người bấm nhân bản — họ nhận luôn phần việc này (Ban lãnh đạo 15/08/2026). */
  nguoi: { uid: string; ten: string };
  /** `stt` các dòng giữ lại; bỏ trống = giữ hết. */
  sttGiuLai?: number[];
  /**
   * ★ Khối lượng từng dòng (Sếp 26/09/2026). Có mục cho dòng nào thì dòng đó ở bản mới mang
   * `khoiLuongDeNghi = khoiLuongTuCha + khoiLuongThem`, ghi `khoiLuongTuCha` (trừ vào phiếu cha) và
   * `khoiLuongVuotCha` (mua thêm, kèm `lyDoVuot`). Dòng không có mục thì chép nguyên như trước.
   */
  khoiLuong?: readonly DongChonNhanBan[];
  /** Lý do mua vượt đề nghị — bắt buộc khi có dòng `khoiLuongThem > 0` (kiểm ở `apDungNhanBanDeNghi`). */
  lyDoVuot?: string;
  /** Ngày (không giờ) cho `ngayDeNghi` / `ngayDuyet`. */
  ngay: NgayISO;
  /** Mốc đầy đủ giờ phút cho nhật ký và `thoiDiemPhanBo`. */
  thoiDiem: NgayISO;
}

/**
 * Dựng bản nhân bản ĐÃ LÀM SẠCH. Trả `null` khi không giữ dòng nào — phiếu không có vật tư là
 * hồ sơ chết, không đi tiếp được bước nào.
 *
 * ⚠️ PHÂN BIỆT "thông tin" và "tiến trình":
 *   · Thông tin (công trình, phòng ban, loại hồ sơ, mặt hàng, ngày cần hàng, mức ưu tiên, người
 *     theo dõi, **tài liệu đầu vào lúc lập phiếu**) → CHÉP HẾT.
 *   · Tiến trình (tệp từng bước, bình luận, lý do thiếu chứng từ, lý do thất bại, cờ lưu trữ,
 *     nhật ký) → BỎ. Bản mới bắt đầu vòng mua hàng của riêng nó.
 *   · Người phụ trách → GÁN CHO NGƯỜI BẤM NHÂN BẢN (Ban lãnh đạo 15/08/2026).
 *
 * 📌 `taiLieu` và `taiLieuAppRequest` **CỐ Ý GIỮ**: đó là hồ sơ ĐẦU VÀO người đề nghị nộp kèm lúc
 * lập phiếu (catalogue, bản vẽ, mẫu chi tiết) — thứ nhân viên cần cầm theo để đi hỏi giá ở bước ②,
 * không phải chứng từ phát sinh trong lúc chạy quy trình. Xoá nốt hai thứ này là bản copy thành
 * hồ sơ trơ, không đi hỏi giá được. Nếu Sếp muốn xoá cả chúng thì sửa ở ĐÂY, một chỗ.
 */
/**
 * ★ NHỮNG DÒNG NGƯỜI NÀY ĐƯỢC ĐƯA VÀO BẢN NHÂN BẢN — soát giao việc 25–26/09/2026 (#16 #23 #24).
 *
 * 🔴 Hai điều kiện, thiếu cái nào cũng từng đo ra lỗi thật:
 *   · Dòng CHƯA chuyển đi hết (tách / nhân bản sang phiếu khác). Trước đây hộp tích hết mặc định,
 *     nên nhân bản phiếu gốc mang cả dòng người khác đang mua sang bản sao dưới dạng "chưa giao" →
 *     Trưởng bộ phận giao lại là MUA TRÙNG.
 *   · Người không có quyền phân bổ chỉ lấy dòng CỦA MÌNH (`nguoiPhuTrachUid === uid`). Trước đây
 *     nhân viên ở phiếu nhiều người cũ tích được dòng đồng nghiệp → việc của người kia sang tay
 *     mình, không lý do, không báo (chỉ đạo 15/08 "ai nhân bản thì người đó làm" chỉ nói về phần
 *     việc của chính người bấm).
 *
 * 📌 Mặc định BẢO THỦ: nhân viên KHÔNG lấy được dòng chưa ai nhận. Có mở hay không cần Sếp chốt.
 */
export function sttDuocNhanBan(
  dn: DeNghiMuaHang,
  tatCa: DeNghiMuaHang[],
  uid: string,
  laNguoiPhanBo: boolean,
): number[] {
  return danhGiaDongNhanBan(dn, tatCa, uid, laNguoiPhanBo, [], [])
    .filter((x) => x.duoc)
    .map((x) => x.stt);
}

/** Một mục người dùng chọn trong hộp nhân bản. */
export interface DongChonNhanBan {
  stt: number;
  /** Phần lấy từ PHẦN CÒN LẠI của dòng ở phiếu cha (≤ còn lại). */
  khoiLuongTuCha: number;
  /** Phần mua THÊM ngoài đề nghị (không trừ vào phiếu cha) — > 0 thì bắt buộc lý do. */
  khoiLuongThem?: number;
}

/** Đánh giá MỘT dòng trong hộp nhân bản: chọn được không, vì sao, còn lại bao nhiêu. */
export interface DanhGiaDongNhanBan {
  stt: number;
  duoc: boolean;
  /** Lý do KHÔNG chọn được — hiện cạnh dòng xám trong hộp (Sếp duyệt 26/09: "hiện xám kèm lý do"). */
  lyDo?: string;
  /** Khối lượng dòng ở phiếu này. */
  khoiLuongDong: number;
  /** Phần còn lại chưa tách (mặc định cho ô "khối lượng đưa sang bản mới"). */
  conLai: number;
  /** Đã lấy sang bản khác bao nhiêu, mua vượt bao nhiêu — để hộp nói rõ. */
  daLay: number;
  vuot: number;
  /** Mã các phiếu đã nhận một phần / cả dòng này. */
  maPhieuDaNhan: string[];
}

/**
 * ★★ DÒNG NÀO ĐƯỢC NHÂN BẢN, VÀ VÌ SAO KHÔNG — Sếp duyệt 26/09/2026 (nhân bản theo NCC), mục (1)(2).
 *
 * Một hàm cho CẢ hộp nhân bản (tô xám + lý do) lẫn tầng ghi (`apDungNhanBanDeNghi` từ chối), để
 * giao diện không bao giờ cho tích một dòng mà tầng ghi sẽ chặn — hay ngược lại.
 *
 * Bốn điều kiện, theo thứ tự lý do hiện ra:
 *   ① Dòng còn phần chưa tách (`conLai > 0`) — hết rồi thì nhân bản nữa là MUA TRÙNG.
 *   ② Dòng chưa có báo giá / đơn hàng (`dongDaCoChungTu`) — chứng từ đang trỏ theo khối lượng cũ.
 *   ③ Người không có quyền phân bổ chỉ lấy dòng CỦA MÌNH (`nguoiPhuTrachUid === uid`).
 *   ④ (Trưởng bộ phận thì mọi dòng qua ①②.)
 *
 * 📌 Mặc định BẢO THỦ: nhân viên KHÔNG lấy được dòng chưa ai nhận.
 */
export function danhGiaDongNhanBan(
  dn: DeNghiMuaHang,
  tatCa: readonly DeNghiMuaHang[],
  uid: string,
  laNguoiPhanBo: boolean,
  baoGia: readonly Pick<BaoGia, "prId" | "trangThai" | "items">[],
  donHang: readonly Pick<DonDatHang, "prId" | "trangThai" | "items">[],
): DanhGiaDongNhanBan[] {
  const daChuyen = dongDaNhanBanSang(dn, tatCa as DeNghiMuaHang[]);
  return dn.items.map((d) => {
    const kl = Number(d.khoiLuongDeNghi) || 0;
    const x = daChuyen.khoiLuong?.get(d.stt);
    const ma = daChuyen.get(d.stt) ?? [];
    const coBan = {
      stt: d.stt,
      khoiLuongDong: kl,
      conLai: x ? x.conLai : ma.length > 0 ? 0 : kl,
      daLay: x?.daLay ?? 0,
      vuot: x?.vuot ?? 0,
      maPhieuDaNhan: ma,
    };
    if (dongDaChuyenDiHet(d.stt, daChuyen)) {
      return { ...coBan, duoc: false, lyDo: `Đã chuyển hết sang ${ma.join(", ")}` };
    }
    if (dongDaCoChungTu(dn.id, d.stt, baoGia, donHang)) {
      return { ...coBan, duoc: false, lyDo: "Đã có báo giá hoặc đơn hàng — huỷ chứng từ đó trước" };
    }
    if (!laNguoiPhanBo && !(uid && d.nguoiPhuTrachUid === uid)) {
      return {
        ...coBan,
        duoc: false,
        lyDo: d.nguoiPhuTrachUid
          ? `Đang do ${d.nguoiPhuTrachTen?.trim() || "người khác"} phụ trách`
          : "Chưa giao cho bạn — nhờ Trưởng bộ phận",
      };
    }
    return { ...coBan, duoc: true };
  });
}

export type KetQuaApDungNhanBan =
  | { loi: string }
  | { loi?: undefined; deNghi: DeNghiMuaHang[]; ban: DeNghiMuaHang };

export interface ThamSoApDungNhanBan {
  /** Phiếu đang bấm nhân bản. */
  prId: string;
  nguoi: { uid: string; ten: string };
  /** Người bấm có quyền phân bổ (Trưởng bộ phận) — chọn được mọi dòng. */
  laNguoiPhanBo: boolean;
  chon: readonly DongChonNhanBan[];
  lyDoVuot?: string;
  idMoi: string;
  ngay: NgayISO;
  thoiDiem: NgayISO;
  baoGia: readonly Pick<BaoGia, "prId" | "trangThai" | "items">[];
  donHang: readonly Pick<DonDatHang, "prId" | "trangThai" | "items">[];
}

/**
 * ★★★ NHÂN BẢN (TÁCH THEO NCC) — HÀM THUẦN, nhận cả danh sách, trả danh sách mới. Sếp duyệt
 * 26/09/2026: *"nhân viên sẽ nhân bản đề nghị để tách từng công việc nhỏ trong đề nghị do khác nhà
 * cung cấp… phải có liên kết cha con"* + chia / tăng khối lượng.
 *
 * Tầng ghi (`nhanBanDeNghi` ở `kho-du-lieu.tsx`) gọi hàm này BÊN TRONG `setDeNghi((truoc) => …)`
 * nên luôn kiểm trên dữ liệu mới nhất; bộ kiểm luật gọi thật được.
 *
 * Chặn (mục (1)(2) Sếp duyệt): hồ sơ đã đóng · dòng không được phép (`danhGiaDongNhanBan`) · khối
 * lượng sai (≤ 0, vượt phần còn lại, số rác) · mua thêm mà trống lý do · phiếu cha sẽ không còn
 * PHẦN nào tự mua (vỏ rỗng — trừ khi chỉ tách một phần khối lượng thì phiếu cha vẫn còn phần đó).
 *
 * Ghi (mục (3)): nhật ký lên CẢ phiếu cha lẫn bản mới, kèm khối lượng và lý do vượt.
 *
 * 📌 Mua vượt chưa cần Trưởng phòng duyệt (Sếp chưa yêu cầu). Muốn thêm duyệt thì chặn ở đây.
 */
export function apDungNhanBanDeNghi(
  tatCa: readonly DeNghiMuaHang[],
  t: ThamSoApDungNhanBan,
): KetQuaApDungNhanBan {
  const goc = tatCa.find((d) => d.id === t.prId);
  if (!goc) return { loi: "Không tìm thấy đề nghị." };
  if (goc.trangThai === "hoan_thanh") return { loi: "Đề nghị đã hoàn thành nên không nhân bản được nữa." };
  if (goc.trangThai === "dong_do") {
    return { loi: "Đề nghị đã đóng dở nên không nhân bản được nữa. Muốn mua tiếp thì lập một đề nghị mới." };
  }
  if (!t.nguoi.uid) return { loi: "Không xác định được người nhân bản." };
  if (t.chon.length === 0) return { loi: "Chưa chọn mặt hàng nào để nhân bản." };
  if (new Set(t.chon.map((c) => c.stt)).size !== t.chon.length) {
    return { loi: "Một dòng bị chọn hai lần." };
  }

  const danhGia = new Map(
    danhGiaDongNhanBan(goc, tatCa, t.nguoi.uid, t.laNguoiPhanBo, t.baoGia, t.donHang).map((x) => [x.stt, x]),
  );
  const dsKhoiLuong: DongChonNhanBan[] = [];
  let coVuot = false;
  for (const c of t.chon) {
    const dg = danhGia.get(c.stt);
    if (!dg) return { loi: `Không tìm thấy dòng ${c.stt}.` };
    if (!dg.duoc) return { loi: `Dòng ${c.stt}: ${dg.lyDo ?? "không nhân bản được"}.` };
    const tuCha = Number(c.khoiLuongTuCha);
    const them = c.khoiLuongThem === undefined ? 0 : Number(c.khoiLuongThem);
    if (!Number.isFinite(tuCha) || !Number.isFinite(them) || tuCha < 0 || them < 0) {
      return { loi: `Dòng ${c.stt}: khối lượng không hợp lệ.` };
    }
    /* Dòng không có khối lượng (dữ liệu cũ) → chép nguyên dòng như trước, không đo được phần nào. */
    if (dg.khoiLuongDong <= 0) continue;
    if (tuCha > dg.conLai + 1e-9) {
      return {
        loi: `Dòng ${c.stt}: chỉ còn ${dg.conLai} chưa tách — muốn mua nhiều hơn đề nghị thì nhập vào ô "mua thêm" và ghi lý do.`,
      };
    }
    if (!(lamTronKhoiLuong(tuCha + them) > 0)) {
      return { loi: `Dòng ${c.stt}: khối lượng đưa sang bản mới phải lớn hơn 0.` };
    }
    if (them > 0) coVuot = true;
    dsKhoiLuong.push({ stt: c.stt, khoiLuongTuCha: lamTronKhoiLuong(tuCha), khoiLuongThem: lamTronKhoiLuong(them) });
  }
  const lyDo = t.lyDoVuot?.trim() ?? "";
  if (coVuot && !lyDo) {
    return { loi: "Có dòng mua nhiều hơn đề nghị — bắt buộc ghi lý do (vd kết luận cuộc họp)." };
  }

  /* Phiếu cha còn PHẦN nào tự mua sau lần này không (mục (2): không để phiếu cha thành vỏ rỗng). */
  const layTheoStt = new Map(dsKhoiLuong.map((k) => [k.stt, k.khoiLuongTuCha]));
  const chonSet = new Set(t.chon.map((c) => c.stt));
  const conPhanTuMua = goc.items.some((d) => {
    const dg = danhGia.get(d.stt);
    if (!dg) return false;
    const diHet = dg.maPhieuDaNhan.length > 0 && dg.conLai <= 0;
    if (!chonSet.has(d.stt)) return !diHet;
    if (dg.khoiLuongDong <= 0) return false; // chép nguyên dòng → đi hết
    return lamTronKhoiLuong(dg.conLai - (layTheoStt.get(d.stt) ?? 0)) > 0;
  });
  if (!conPhanTuMua) {
    return {
      loi: `Phiếu ${goc.code} sẽ không còn phần nào tự mua. Để lại ít nhất một phần khối lượng (hoặc một mặt hàng) cho phiếu này — mỗi phiếu là một nhà cung cấp, phiếu gốc giữ phần của một nhà cung cấp.`,
    };
  }

  const phieuGocDau = phieuGocCua(goc, tatCa as DeNghiMuaHang[]);
  const maMoi = maBanSaoTiepTheo(goc, tatCa as DeNghiMuaHang[]);
  const sttChon = [...chonSet].sort((a, b) => a - b);
  const ban = dungBanNhanBan({
    goc,
    phieuGocDau,
    idMoi: t.idMoi,
    maMoi,
    nguoi: t.nguoi,
    sttGiuLai: sttChon,
    khoiLuong: dsKhoiLuong,
    lyDoVuot: coVuot ? lyDo : undefined,
    ngay: t.ngay,
    thoiDiem: t.thoiDiem,
  });
  if (!ban) return { loi: "Không còn mặt hàng nào được giữ lại." };

  /* Nhật ký phiếu cha — nói đúng từng dòng đi bao nhiêu, còn bao nhiêu. */
  const moTaDong = sttChon.map((stt) => {
    const d = goc.items.find((x) => x.stt === stt);
    const dg = danhGia.get(stt);
    const k = dsKhoiLuong.find((x) => x.stt === stt);
    const dv = d?.donViTinh ? ` ${d.donViTinh}` : "";
    if (!d || !dg || !k) return `dòng ${stt} (cả dòng)`;
    const con = lamTronKhoiLuong(dg.conLai - k.khoiLuongTuCha);
    const phan = [`${k.khoiLuongTuCha}/${dg.khoiLuongDong}${dv}`];
    if ((k.khoiLuongThem ?? 0) > 0) phan.push(`mua thêm ${k.khoiLuongThem}${dv}`);
    phan.push(con > 0 ? `phiếu này còn ${con}${dv}` : "hết phần của phiếu này");
    return `dòng ${stt} (${phan.join(", ")})`;
  });
  const vuotCau = dsKhoiLuong
    .filter((k) => (k.khoiLuongThem ?? 0) > 0)
    .map((k) => {
      const dg = danhGia.get(k.stt);
      const d = goc.items.find((x) => x.stt === k.stt);
      const dv = d?.donViTinh ? ` ${d.donViTinh}` : "";
      const tong = lamTronKhoiLuong((dg?.khoiLuongDong ?? 0) + (dg?.vuot ?? 0) + (k.khoiLuongThem ?? 0));
      return `dòng ${k.stt} tổng ${tong} / đề nghị ${dg?.khoiLuongDong ?? 0}${dv}`;
    });
  const ghiChuCha = vuotCau.length > 0 ? `Mua vượt đề nghị: ${vuotCau.join("; ")}. Lý do: ${lyDo}` : undefined;

  const moi = tatCa.map((d) =>
    d.id !== goc.id
      ? d
      : {
          ...d,
          lichSu: [
            ...d.lichSu,
            {
              thoiDiem: t.thoiDiem,
              nguoiThucHien: t.nguoi.ten,
              hanhDong: `Nhân bản sang phiếu ${maMoi}: ${moTaDong.join("; ")}`,
              ...(ghiChuCha ? { ghiChu: ghiChuCha } : {}),
            },
          ],
        },
  );
  moi.push(ban);
  return { deNghi: moi, ban };
}

export function dungBanNhanBan(t: ThamSoDungBanNhanBan): DeNghiMuaHang | null {
  const { goc, phieuGocDau, nguoi } = t;

  const giu = t.sttGiuLai && t.sttGiuLai.length > 0 ? new Set(t.sttGiuLai) : null;
  const dongGiuLai = giu ? goc.items.filter((d) => giu.has(d.stt)) : goc.items;
  if (dongGiuLai.length === 0) return null;

  /* Phiếu đang nhân bản có phải đã là một bản copy không — quyết định cách ghi `sttDongGoc`.
     Hỏi `goc.deNghiGocId` chứ không so `goc.id !== phieuGocDau.id`: hai cách cho cùng kết quả khi
     dữ liệu lành, nhưng bản con mồ côi (phiếu gốc đã bị xoá) thì `phieuGocCua` trả về CHÍNH NÓ, và
     lúc đó phép so kia kết luận nhầm rằng đây là phiếu gốc thật. */
  const nguonLaBanSao = Boolean(goc.deNghiGocId);

  return {
    ...goc,
    id: t.idMoi,
    code: t.maMoi,
    /* ★ TIÊU ĐỀ CÓ THÊM "(copy N)" — Ban lãnh đạo 22/08/2026: *"Tên của quy trình giống nhau và
       thêm chữ copy phía sau"*. Việc "tổng hợp lại các bản tách" KHÔNG dựa vào tên mà dựa vào
       `deNghiGocId` + `maDeNghiGoc` ngay dưới. */
    tieuDe: tenBanSaoTheoMa(phieuGocDau.tieuDe, t.maMoi),
    // ★ Quan hệ cha–con để TỔNG HỢP LẠI được các bản tách (xem `deNghiGocId`).
    deNghiGocId: phieuGocDau.id,
    /**
     * ★★ PHIẾU CHA TRỰC TIẾP — Sếp chốt 17/09/2026. Ghi `goc.id` (phiếu vừa bấm nhân bản), KHÔNG
     * phải `phieuGocDau.id`. Đây là điểm khác duy nhất giữa hai trường, và cũng là cả tác dụng của
     * nó: khi nhân bản từ một bản copy thì phiếu copy ở giữa mới tra ra được dòng nào của mình đã
     * đi sang bản cháu.
     */
    deNghiChaId: goc.id,
    maDeNghiGoc: phieuGocDau.code,
    ngayDeNghi: t.ngay,
    ngayDuyet: t.ngay,
    trangThai: "da_duyet",
    luuTru: undefined,
    /* ★ Không mượn mốc vào bước của phiếu gốc (soát giao việc 25–26/09, #14) — mượn là bản mới vừa
       sinh đã báo "Trễ". Tầng ghi (`nhanBanDeNghi`) đặt lại mốc = lúc nhân bản; tệp này không import
       được `xacDinhGiaiDoan` (sẽ thành vòng import). */
    mocVaoBuoc: undefined,

    // ── LÀM SẠCH TIẾN TRÌNH CỦA PHIẾU GỐC (Sếp 15/09/2026) ───────────────────────────────
    /* Tệp đính kèm của TỪNG BƯỚC: bảng báo giá NCC gửi, hợp đồng đã ký, hóa đơn VAT… Chúng là
       chứng từ của phiếu gốc, bản copy chưa có cái nào. 🔴 Chỉ bỏ tham chiếu — nội dung trong
       `3-du-lieu/kho-tep.ts` giữ nguyên cho phiếu gốc dùng. */
    tepGiaiDoan: undefined,
    /* Lý do "chưa có chứng từ bắt buộc" — nó MỞ ĐƯỜNG ĐI TIẾP (Ban lãnh đạo 23/08/2026). Chép
       sang là bản copy được đi tiếp bằng một lời giải thích viết cho hồ sơ khác. */
    lyDoThieuChungTu: undefined,
    /* Bình luận thuộc về phiếu gốc. Chép sang mọi bản copy là mỗi người đọc lại một bản y hệt,
       trả lời vào bản nào cũng không ai thấy (cùng lý do đã ghi ở `tachTheoPhanBo`). */
    binhLuan: undefined,
    /* Lý do hồ sơ thất bại — bản copy đang ở `da_duyet`, mang theo lý do đóng dở của phiếu khác
       là hồ sơ tự mâu thuẫn. */
    lyDoThatBai: undefined,
    /* Việc đã tích: giữ bước ①②, bỏ từ ③ trở đi — xem `viecDaTichGiuLaiKhiNhanBan`. */
    congViecDaXong: viecDaTichGiuLaiKhiNhanBan(goc.congViecDaXong),

    /**
     * ⚠️ ĐÁNH SỐ LẠI TỪ 1. `stt` là KHÓA ĐỐI CHIẾU khối lượng — dòng đơn hàng và dòng nhận hàng
     * đều trỏ về nó. Giữ số cũ (ví dụ chỉ còn dòng 3, 7) thì phiếu mới có dòng số 3 và 7 mà không
     * có 1, 2 — người đọc tưởng mất dòng, và mọi chỗ đếm "dòng thứ mấy" đều lệch.
     *
     * ★★ `sttDongGoc` — DẤU VẾT NGƯỢC VỀ DÒNG Ở PHIẾU GỐC (Sếp 15/09/2026), để phiếu gốc làm mờ
     * dòng đã nhân bản đi. Nguồn ĐÃ LÀ BẢN COPY thì **kế thừa** `d.sttDongGoc` (dòng đó đã trỏ sẵn
     * về gốc đầu tiên), chỉ phiếu gốc thật mới lấy `d.stt` — vì `stt` của bản copy đã đánh số lại
     * từ 1, viết thẳng `d.stt` là làm mờ NHẦM một dòng vẫn phải mua. Lý do đầy đủ ở
     * `dongDaNhanBanSang` phía trên.
     *
     * 🔴 CHỈ GÁN NGƯỜI CHO DÒNG GỐC ĐÃ CÓ NGƯỜI — Ban lãnh đạo 16/08/2026: *"nhân bản ở bước nào
     * thì sẽ trả nhân bản ở đúng bước đó"*. Gán cho MỌI dòng (kể cả dòng gốc chưa ai nhận) là bản
     * sao đi trước bản gốc một bước, không ai hiểu vì sao.
     */
    items: dongGiuLai.map((d, i) => {
      const daCoNguoi = Boolean(d.nguoiPhuTrachUid);
      /* ★ Khối lượng (Sếp 26/09/2026): có mục chọn → bản mới mua đúng phần được tách (+ phần mua
         thêm). Không có mục → chép nguyên dòng, `khoiLuongTuCha` trống = "cả dòng" như trước. */
      const k = t.khoiLuong?.find((x) => x.stt === d.stt);
      const them = k ? Math.max(0, k.khoiLuongThem ?? 0) : 0;
      const phanKhoiLuong = k
        ? {
            khoiLuongDeNghi: lamTronKhoiLuong(k.khoiLuongTuCha + them),
            khoiLuongTuCha: k.khoiLuongTuCha,
            khoiLuongVuotCha: them > 0 ? them : undefined,
            lyDoVuotCha: them > 0 ? t.lyDoVuot?.trim() || undefined : undefined,
          }
        : { khoiLuongTuCha: undefined, khoiLuongVuotCha: undefined, lyDoVuotCha: undefined };
      return {
        ...d,
        ...phanKhoiLuong,
        stt: i + 1,
        /* `sttChiaTu` trỏ theo số dòng của phiếu nguồn — ở bản mới (đánh số lại) không còn nghĩa. */
        sttChiaTu: undefined,
        /* ★ Nguồn là PHIẾU CON TRỰC TIẾP của gốc đầu tiên mà dòng chưa có `sttDongGoc` (phiếu con
           giao việc 26/09 chỉ ghi `sttDongCha`) → lấy `sttDongCha`: đó đúng là số dòng ở gốc đầu tiên.
           Thiếu bước này thì bản cháu không có dấu vết nào về gốc, và gộp khi lùi về ① bỏ sót nó. */
        sttDongGoc: nguonLaBanSao
          ? (d.sttDongGoc ?? (goc.deNghiChaId === phieuGocDau.id ? d.sttDongCha : undefined))
          : d.stt,
        /**
         * ★★ DÒNG NÀO CỦA **PHIẾU CHA TRỰC TIẾP** — Sếp chốt 17/09/2026.
         *
         * 🔴 LUÔN LÀ `d.stt`, KHÔNG kế thừa như `sttDongGoc` ngay trên. `d` chính là dòng của phiếu
         * vừa bấm nhân bản, nên `d.stt` đúng là số dòng ở phiếu cha — bất kể phiếu cha là phiếu gốc
         * hay đã là một bản copy. Kế thừa ở đây là quay lại đúng lỗ hổng đang vá.
         */
        sttDongCha: d.stt,
        ...(daCoNguoi
          ? {
              nguoiPhuTrachUid: nguoi.uid,
              nguoiPhuTrachTen: nguoi.ten,
              // Người tách tự nhận việc, nên người phân bổ cũng chính là họ.
              nguoiPhanBoTen: nguoi.ten,
              thoiDiemPhanBo: t.thoiDiem,
            }
          : {
              // Dòng gốc chưa ai nhận thì bản copy cũng để trống — trưởng bộ phận phân bổ như
              // với mọi dòng mới.
              nguoiPhuTrachUid: undefined,
              nguoiPhuTrachTen: undefined,
              nguoiPhanBoTen: undefined,
              thoiDiemPhanBo: undefined,
            }),
      };
    }),
    lichSu: [
      {
        thoiDiem: t.thoiDiem,
        nguoiThucHien: nguoi.ten,
        hanhDong: `Nhân bản từ ${goc.code}`,
        ghiChu:
          (giu
            ? `Giữ ${dongGiuLai.length}/${goc.items.length} mặt hàng của phiếu gốc`
            : `Giữ nguyên toàn bộ ${goc.items.length} mặt hàng`) +
          // Nói đúng số dòng thật sự được giao — dòng gốc chưa ai nhận thì bản copy cũng để
          // trống, nên câu cũ ("nhận phụ trách toàn bộ") có thể sai.
          (dongGiuLai.some((d) => d.nguoiPhuTrachUid)
            ? `. Người tách nhận ${
                dongGiuLai.filter((d) => d.nguoiPhuTrachUid).length
              } công việc đã được giao ở phiếu gốc.`
            : ". Các công việc chưa phân bổ, giữ nguyên như phiếu gốc.") +
          /* ★ Khối lượng từng dòng + lý do mua vượt (Sếp 26/09/2026) — ghi ở CẢ bản mới lẫn phiếu cha. */
          (t.khoiLuong && t.khoiLuong.length > 0
            ? ` Khối lượng: ${t.khoiLuong
                .map((k) => {
                  const d = goc.items.find((x) => x.stt === k.stt);
                  const dv = d?.donViTinh ? ` ${d.donViTinh}` : "";
                  const them = k.khoiLuongThem ?? 0;
                  return `dòng ${k.stt} của ${goc.code} lấy ${k.khoiLuongTuCha}${dv}${
                    them > 0 ? ` + mua thêm ${them}${dv} (vượt đề nghị)` : ""
                  }`;
                })
                .join("; ")}.${
                t.khoiLuong.some((k) => (k.khoiLuongThem ?? 0) > 0) && t.lyDoVuot?.trim()
                  ? ` Lý do mua vượt: ${t.lyDoVuot.trim()}.`
                  : ""
              }`
            : "") +
          // Nói thẳng đã bỏ gì, để người đọc hồ sơ không đi tìm chứng từ tưởng bị mất.
          " Bản sao bắt đầu lại từ bước ② nên KHÔNG mang theo tệp đính kèm của từng bước, bình luận và lý do thiếu chứng từ của phiếu gốc.",
      },
    ],
  };
}

// ============================================================
// TÁCH TỰ ĐỘNG THEO PHÂN CÔNG CỦA TRƯỞNG BỘ PHẬN
//
// 🔴 Ban lãnh đạo 15/08/2026: *"Khi trưởng phòng giao việc cho nhân viên khác nhau thì ở
// bước 2 sẽ tự copy đề nghị đó ra và công việc ứng với các tích chọn của trưởng phòng"*.
//
// Nghĩa là: ở bước ① trưởng bộ phận tích chọn dòng nào cho ai; khi phiếu đủ điều kiện sang
// bước ②, mỗi người nhận một phiếu riêng chứa **đúng những dòng mình được giao**.
//
// 👉 Hàm ở đây chỉ TÍNH RA phương án tách. Việc tạo phiếu nằm ở `kho-du-lieu.tsx` — tách đôi
// như vậy để luật kiểm được bằng mắt mà không phải chạy React.
// ============================================================

/** Một phần tách: người phụ trách và những dòng (theo `stt`) thuộc về họ. */
export interface PhanTachTheoNguoi {
  uid: string;
  ten: string;
  /** `stt` của các dòng người này phụ trách, theo đúng thứ tự trong phiếu gốc. */
  stt: number[];
}

/**
 * Nhóm các dòng của phiếu theo NGƯỜI PHỤ TRÁCH.
 *
 * Trả về mảng rỗng khi phiếu chưa phân bổ đủ — chưa đủ thì chưa sang bước ②, mà chưa sang
 * bước ② thì chưa tới lúc tách.
 *
 * ⚠️ Thứ tự trả về bám theo `stt` NHỎ NHẤT của mỗi người, không phải thứ tự ngẫu nhiên của
 * `Map`. Nhờ vậy người giữ phiếu gốc luôn là một người xác định, chạy lại bao nhiêu lần cũng
 * ra cùng kết quả — nếu để thứ tự đổi lung tung thì cùng một phiếu, hai máy tách ra hai kiểu.
 */
export function nhomDongTheoNguoiPhuTrach(dn: DeNghiMuaHang): PhanTachTheoNguoi[] {
  if (dn.items.length === 0) return [];
  // Còn dòng chưa giao cho ai → chưa phải lúc tách.
  if (dn.items.some((d) => !d.nguoiPhuTrachUid)) return [];

  const theoNguoi = new Map<string, PhanTachTheoNguoi>();
  for (const d of dn.items) {
    const uid = d.nguoiPhuTrachUid as string;
    const da = theoNguoi.get(uid);
    if (da) da.stt.push(d.stt);
    else theoNguoi.set(uid, { uid, ten: d.nguoiPhuTrachTen ?? uid, stt: [d.stt] });
  }
  return [...theoNguoi.values()].sort((a, b) => Math.min(...a.stt) - Math.min(...b.stt));
}

/** Kết quả tính phương án tách — nói rõ tách được hay không và vì sao. */
export type PhuongAnTach =
  | { tach: false; lyDo: string }
  | {
      tach: true;
      /** Người giữ nguyên phiếu gốc (nhóm có dòng đầu tiên). */
      giuPhieuGoc: PhanTachTheoNguoi;
      /** Các nhóm cần tạo phiếu mới. */
      canTaoPhieu: PhanTachTheoNguoi[];
    };

/**
 * Quyết định có tách phiếu hay không.
 *
 * 🔴 NGƯỜI CÓ DÒNG ĐẦU TIÊN GIỮ PHIẾU GỐC, các người còn lại nhận phiếu copy. Vì sao không
 * tạo phiếu mới cho tất cả rồi bỏ phiếu gốc: bản chạy thử chỉ có **12 mã dự phòng**
 * (`generateStaticParams`), tạo dư một phiếu mỗi lần tách là rất nhanh hết mã. Giữ phiếu gốc
 * cũng đúng nghiệp vụ hơn — mã `PR-001` vẫn tồn tại thay vì biến mất thành ba mã "(copy)".
 *
 * ⚠️ KIỂM ĐỦ MÃ TRƯỚC KHI TÁCH, đây là lý do hàm nhận `soMaConTrong`. Tách được 1 trong 2
 * phiếu rồi hết mã là tệ hơn không tách: phiếu gốc đã bị lấy mất dòng của người thứ hai,
 * mà phiếu của người đó thì không tồn tại — khối lượng biến mất khỏi hệ thống.
 */
export function tinhPhuongAnTach(dn: DeNghiMuaHang, soMaConTrong: number): PhuongAnTach {
  // Bản đã là copy thì không tách tiếp — quan hệ cha–con chỉ một cấp (xem `deNghiGocId`).
  if (dn.deNghiGocId) return { tach: false, lyDo: "Phiếu này đã là một bản tách." };

  const nhom = nhomDongTheoNguoiPhuTrach(dn);
  if (nhom.length === 0) {
    return { tach: false, lyDo: "Còn công việc chưa phân bổ người phụ trách." };
  }
  if (nhom.length === 1) {
    return { tach: false, lyDo: "Cả phiếu giao cho một người nên không cần tách." };
  }
  const canTao = nhom.length - 1;
  if (soMaConTrong < canTao) {
    return {
      tach: false,
      /* ⚠️ Câu này gần như không còn xảy ra: từ 22/08/2026 id hồ sơ sinh động, không còn danh sách
         12 mã khai trước (xem `6-tien-ich/sinh-id-ho-so.ts`), và nơi gọi truyền số rất lớn. Giữ
         nhánh kiểm là cố ý — hàm luật này dùng chung, nơi gọi khác vẫn có thể có hạn mức thật. */
      lyDo: `Cần ${canTao} mã hồ sơ để tách cho ${nhom.length} người nhưng chỉ còn ${soMaConTrong}.`,
    };
  }
  return { tach: true, giuPhieuGoc: nhom[0], canTaoPhieu: nhom.slice(1) };
}
