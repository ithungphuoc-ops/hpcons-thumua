import { after, NextRequest, NextResponse } from "next/server";
import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { getThuMuaDb } from "@/5-ket-noi/hpcore-may-chu";
import { DUONG_DAN, bo0Undefined } from "@/3-du-lieu/kho-chung-firestore";
import { tuMap, ghiTheoDangHienCo, chuoiOnDinh } from "@/2-quy-trinh/ghi-tung-phan";
import {
  tinhTienDoPO,
  vuongMacGhiThemPhieuNhan,
  vuongMacKhoiLuongNhan,
  vuongMacSoPhieuNCC,
  laDongHang,
} from "@/2-quy-trinh/tinh-toan";
import type {
  DeNghiMuaHang,
  DonDatHang,
  DongNhanHang,
  MocLichSu,
  PhieuNhanHang,
} from "@/3-du-lieu/kieu-du-lieu";
import type { DuLieuLuu } from "@/3-du-lieu/luu-tren-may";
import type { PhieuNhanMoiTuQlkCtr, KetQuaNhanPhieuTuQlkCtr } from "@/3-du-lieu/tich-hop-qlk-ctr-nhan-hang-types";
import { guiKhoDaNhan } from "@/5-ket-noi/thong-bao-app-tong-may-chu";
import * as PQ from "@/5-ket-noi/phan-quyen-may-chu";

// "Cửa tiếp nhận" của App Thu mua cho QLK CTR — mirror đúng khuôn `de-nghi-moi/route.ts`
// (Việc 1). Thủ kho ghi nhận nhập kho + tải ảnh MỘT LẦN ở QLK CTR, phiếu nhận hàng tự sinh
// ở đây, không ai ghi tay lần 2. Xem hợp đồng dữ liệu đầy đủ tại
// 3-du-lieu/tich-hop-qlk-ctr-nhan-hang-types.ts.
//
//   POST /api/qlk-ctr/phieu-nhan-moi
//
// Bảo vệ tạm bằng header x-api-key nếu đã cấu hình QLKCTR_PHIEU_NHAN_API_KEY — chưa cấu
// hình thì API vẫn chạy được ngay (để 2 đội test trước), đúng kiểu de-nghi-moi đang làm.
//
// 🔴 KHÔNG tái sử dụng `themPhieuNhan()` (kho-du-lieu.tsx) — đó là React hook chạy trong
// trình duyệt, không gọi được từ máy chủ. Viết lại đúng 3 luật `vuongMac*` + cách sinh
// lanGiaoThu/id/code tại đây, giống cách de-nghi-moi đã làm với maDeNghiTiepTheo.
//
// ============================================================
// ★★ SỬA CÓ PHÉP CỦA SẾP — 08/10/2026 ("Sửa lần nhập")
// Tệp này là cửa của phiên tích hợp (vùng cấm, CLAUDE.md §6.6). Sếp duyệt demo "Sửa lần nhập" rồi
// cho phép ("code đi") sửa ĐÚNG cửa này — Sếp chốt: *"thu mua chưa xác nhận thì app kho sửa xong
// cập nhật vào ô phiếu nhận, thu mua bấm Xác nhận nhận hàng rồi thì không sửa được"*. Đã làm:
//   ① `cheDo`: "tao" (mặc định — y hệt hành vi cũ) · "kiem_tra" (chỉ hỏi, không ghi) ·
//      "cap_nhat" (ghi đè phiếu đã có bằng bản Kho sửa) · "xoa" (Kho xoá lần nhập → bỏ phiếu).
//      "cap_nhat"/"xoa" TỪ CHỐI khi đơn đã "Xác nhận nhận hàng" (`po.xacNhanKho`).
//   ② Dò phiếu đã có theo CẢ `maPhieuDuPhong` — lần nhập cũ bên Kho gửi bằng 1 trong 2 kiểu mã.
//   ③ Lần giao mới = lần giao LỚN NHẤT + 1 (trước: số phiếu + 1). Kho xoá được phiếu thì "số phiếu
//      + 1" sinh lại đúng mã `grn-{poId}-{n}` của phiếu đang còn → ghi đè mất phiếu đó. Xoá phiếu thì
//      ghi lại `lanGiaoLonNhatTungCo` trên đơn — xoá đúng phiếu cuối cũng không cấp lại số của nó.
// Nhánh "tao" không đổi chữ nào khác ngoài ②③. Báo chuông "Kho đã nhận hàng" (PR #43) giữ nguyên,
// và cũng báo khi `cap_nhat` phải tạo phiếu mới (phiếu chưa từng sang được).
// ============================================================

type DuLieu = Partial<DuLieuLuu>;

/** Kết quả trong giao dịch — tách khỏi câu trả lời HTTP để nhánh nào cũng đi qua một chỗ trả lời. */
type KetQuaGiaoDich =
  | { loai: "kiem_tra"; coPO: boolean; coPhieu: boolean; daXacNhan: boolean; maKhop?: string; phieuCode?: string }
  | { loai: "ton_tai"; phieu: PhieuNhanHang }
  | { loai: "moi"; phieu: PhieuNhanHang }
  | { loai: "cap_nhat"; phieu: PhieuNhanHang }
  | { loai: "da_xoa"; phieuCode?: string }
  | { loai: "da_xac_nhan" };

const CAC_CHE_DO = ["tao", "kiem_tra", "cap_nhat", "xoa"] as const;

const laMap = (x: unknown) => x != null && typeof x === "object" && !Array.isArray(x);

type TenKhoi = "donHang" | "deNghi" | "phieuNhan";
type CoId = { id: string };
type BoGhi = ReturnType<typeof taoBoGhi>;

/**
 * Gom mọi thay đổi của 1 lần Kho sửa/xoá phiếu vào ĐÚNG 1 lệnh `tx.update` (QA 08/10/2026: không
 * ghi 2 lệnh vào cùng 1 tài liệu trong 1 giao dịch).
 * Khối dạng map: chạm đúng một trường bằng FieldPath (không ghép chuỗi — id có dấu chấm là tách sai
 * tầng). Khối còn dạng mảng: sửa trên bản sao cả khối, lúc ghi mới đổ cả khối.
 */
function taoBoGhi(data: DuLieu) {
  const capMap: unknown[] = [];
  const banMang = new Map<TenKhoi, CoId[]>();
  return {
    /** Dạng map: ghi `giaTriMap` vào `khoi.<id>[.<truong>]`. Dạng mảng: `suaMang` trả bản mới, `null` = bỏ bản ghi. */
    sua(khoi: TenKhoi, id: string, truong: string | null, giaTriMap: unknown, suaMang: (cu: CoId) => CoId | null) {
      if (laMap(data[khoi])) {
        capMap.push(truong ? new FieldPath(khoi, id, truong) : new FieldPath(khoi, id), giaTriMap);
        return;
      }
      const ds = banMang.get(khoi) ?? tuMap<CoId>(data[khoi]);
      banMang.set(
        khoi,
        ds.flatMap((x) => {
          if (x.id !== id) return [x];
          const moi = suaMang(x);
          return moi ? [moi] : [];
        }),
      );
    },
    ghi(tx: FirebaseFirestore.Transaction, docRef: FirebaseFirestore.DocumentReference) {
      const cap: unknown[] = [...capMap];
      for (const [khoi, ds] of banMang) cap.push(khoi, bo0Undefined(ghiTheoDangHienCo(khoi, data[khoi], ds)));
      if (cap.length < 2) return;
      const [truongDau, giaTriDau, ...conLai] = cap;
      tx.update(docRef, truongDau as string | FieldPath, giaTriDau, ...conLai);
    },
  };
}

/**
 * Ghi 1 dòng vào lịch sử hồ sơ — ĐÚNG luật định tuyến của `ghiNhatKyDonHang` (kho-du-lieu.tsx):
 * đơn có `prId` thì vào lịch sử ĐỀ NGHỊ (khối "Lịch sử hoạt động"), không thì vào lịch sử ĐƠN.
 *
 * 🔴 Không tìm thấy bản ghi đích thì BỎ QUA, không ghi theo đường dẫn — `arrayUnion` vào
 * `deNghi.<id>.lichSu` của một id không tồn tại là dựng ra bản ghi ma chỉ có mỗi `lichSu`.
 */
function ghiLichSuHoSo(boGhi: BoGhi, data: DuLieu, po: DonDatHang, moc: MocLichSu) {
  const mocSach = bo0Undefined(moc);
  const khoi: TenKhoi = po.prId ? "deNghi" : "donHang";
  const id = po.prId ?? po.id;
  if (!tuMap<CoId>(data[khoi]).some((d) => d.id === id)) return;
  boGhi.sua(khoi, id, "lichSu", FieldValue.arrayUnion(mocSach), (cu) => ({
    ...cu,
    lichSu: [...((cu as DeNghiMuaHang | DonDatHang).lichSu ?? []), mocSach],
  }));
}

/** "Số lượng · Bulong neo: 60 Bộ → 50 Bộ; Ngày nhập: …" — gọn để nằm vừa một dòng lịch sử. */
function tomTatThayDoi(lanSua: NonNullable<PhieuNhanMoiTuQlkCtr["lanSua"]>): string {
  return lanSua.thayDoi.map((t) => `${t.muc}: ${t.truoc} → ${t.sau}`).join("; ");
}

export async function POST(req: NextRequest): Promise<NextResponse<KetQuaNhanPhieuTuQlkCtr>> {
  const apiKeyYeuCau = process.env.QLKCTR_PHIEU_NHAN_API_KEY;
  if (apiKeyYeuCau) {
    const apiKeyGui = req.headers.get("x-api-key");
    if (apiKeyGui !== apiKeyYeuCau) {
      return NextResponse.json({ ok: false, error: "Thiếu hoặc sai x-api-key." }, { status: 401 });
    }
  }

  let payload: PhieuNhanMoiTuQlkCtr;
  try {
    payload = (await req.json()) as PhieuNhanMoiTuQlkCtr;
  } catch {
    return NextResponse.json({ ok: false, error: "Body gửi lên không phải JSON hợp lệ." }, { status: 400 });
  }

  const cheDo = payload.cheDo ?? "tao";
  if (!(CAC_CHE_DO as readonly string[]).includes(cheDo)) {
    return NextResponse.json({ ok: false, error: `Chế độ "${String(cheDo)}" không hợp lệ.` }, { status: 400 });
  }
  /* `kiem_tra`/`xoa` không mang dòng hàng — chỉ `tao`/`cap_nhat` mới bắt buộc có `lines`. */
  const canDong = cheDo === "tao" || cheDo === "cap_nhat";
  if (!payload.poCode?.trim() || !payload.maPhieuNhanQlkCtr?.trim() || (canDong && !payload.lines?.length)) {
    return NextResponse.json(
      { ok: false, error: "Thiếu dữ liệu bắt buộc (poCode / maPhieuNhanQlkCtr / lines)." },
      { status: 400 },
    );
  }
  if ((cheDo === "cap_nhat" || cheDo === "xoa") && !payload.lanSua?.lyDo?.trim()) {
    return NextResponse.json({ ok: false, error: "Sửa/xoá phiếu phải kèm lý do (lanSua)." }, { status: 400 });
  }
  const lanSua = payload.lanSua;
  /* ② Mọi mã phiếu có thể đã dùng — mã chính đứng đầu. */
  const cacMa = [payload.maPhieuNhanQlkCtr, ...(payload.maPhieuDuPhong ?? [])]
    .map((m) => (typeof m === "string" ? m.trim() : ""))
    .filter(Boolean);

  try {
    const db = getThuMuaDb();
    const docRef = db.collection(DUONG_DAN.boSuuTap).doc(DUONG_DAN.tep);

    const ketQua = await db.runTransaction(async (tx): Promise<KetQuaGiaoDich> => {
      const snap = await tx.get(docRef);
      const data = (snap.exists ? snap.data() : {}) as DuLieu;
      /* ★ ĐỌC ĐƯỢC CẢ HAI DẠNG — nhịp 3a, 23/09/2026. Dòng cũ dùng `Array.isArray(x) ? x : []`;
         gặp kho đã chuyển sang map (đợt 2) nó trả RỖNG rồi phần ghi bên dưới đè cả khối — 18
         đơn hàng và 15 phiếu nhận nằm trong tầm. Xem chú thích dài ở `ghi-tung-phan.ts`. */
      const donHangHienCo: DonDatHang[] = tuMap<DonDatHang>(data.donHang);
      const phieuNhanHienCo: PhieuNhanHang[] = tuMap<PhieuNhanHang>(data.phieuNhan);

      // Phiếu Kho đã gửi trước đó (nếu có) — dò theo mọi mã có thể (②).
      const phieuCu = phieuNhanHienCo.find((p) => p.maPhieuNhanQlkCtr && cacMa.includes(p.maPhieuNhanQlkCtr));
      const po = donHangHienCo.find((p) => p.code === payload.poCode);

      if (cheDo === "kiem_tra") {
        return {
          loai: "kiem_tra",
          coPO: Boolean(po),
          coPhieu: Boolean(phieuCu),
          daXacNhan: Boolean(po?.xacNhanKho),
          maKhop: phieuCu?.maPhieuNhanQlkCtr,
          phieuCode: phieuCu?.code,
        };
      }

      // Chống trùng khi QLK CTR gọi lại (retry do mạng lỗi) — trả lại đúng phiếu đã tạo.
      if (cheDo === "tao" && phieuCu) {
        return { loai: "ton_tai", phieu: phieuCu };
      }

      if (!po) {
        throw new Error(`Không tìm thấy đơn mua hàng "${payload.poCode}".`);
      }
      if (phieuCu && phieuCu.poId !== po.id) {
        throw new Error(`Phiếu kho "${phieuCu.maPhieuNhanQlkCtr}" thuộc đơn ${phieuCu.poCode}, không phải ${po.code}.`);
      }
      /* 🔴 Sếp chốt 08/10/2026: Thu mua đã bấm "Xác nhận nhận hàng" thì App Kho không sửa/xoá được nữa. */
      if ((cheDo === "cap_nhat" || cheDo === "xoa") && po.xacNhanKho) {
        return { loai: "da_xac_nhan" };
      }

      const thoiDiem = new Date().toISOString();
      const phieuCuaPO = phieuNhanHienCo.filter((p) => p.poId === po.id);

      if (cheDo === "xoa") {
        if (!phieuCu) return { loai: "da_xoa" }; // chưa từng sang → không có gì để bỏ
        const boGhi = taoBoGhi(data);
        boGhi.sua("phieuNhan", phieuCu.id, null, FieldValue.delete(), () => null);
        /* ③ Ghi nhớ số lần giao lớn nhất từng cấp — phiếu sau không mang lại mã của phiếu vừa xoá. */
        const lanGiaoLonNhat = phieuCuaPO.reduce((m, p) => Math.max(m, p.lanGiaoThu || 0), po.lanGiaoLonNhatTungCo ?? 0);
        boGhi.sua("donHang", po.id, "lanGiaoLonNhatTungCo", lanGiaoLonNhat, (cu) => ({
          ...cu,
          lanGiaoLonNhatTungCo: lanGiaoLonNhat,
        }));
        ghiLichSuHoSo(boGhi, data, po, {
          thoiDiem,
          nguoiThucHien: `${lanSua!.nguoiSuaTen} (App Kho)`,
          hanhDong: `Kho xoá phiếu nhận ${phieuCu.code} (lần giao ${phieuCu.lanGiaoThu}${
            phieuCu.soPhieuGiaoNCC ? `, phiếu NCC ${phieuCu.soPhieuGiaoNCC}` : ""
          })`,
          ghiChu: `${tomTatThayDoi(lanSua!)}. Lý do: ${lanSua!.lyDo}`,
        });
        boGhi.ghi(tx, docRef);
        return { loai: "da_xoa", phieuCode: phieuCu.code };
      }

      // ── `tao`, hoặc `cap_nhat` ── (cap_nhat mà phiếu chưa từng sang thì tạo mới như `tao`)
      const suaPhieu = cheDo === "cap_nhat" && phieuCu ? phieuCu : null;
      /* Sửa phiếu: tính "còn lại" KHÔNG gồm chính phiếu đang sửa — nếu không, số cũ của nó bị trừ
         hai lần và bản sửa đúng vẫn bị chặn "vượt quá số lượng". */
      const tienDo = tinhTienDoPO(po, suaPhieu ? phieuCuaPO.filter((p) => p.id !== suaPhieu.id) : phieuCuaPO);

      // Khớp theo TÊN vật liệu (không theo số thứ tự) — cả 2 hệ thống đều có sẵn tên gốc
      // từ cùng 1 đề nghị, ổn định hơn số thứ tự có thể lệch giữa 2 hệ thống.
      //
      // 🔴 (29/08/2026): PO có thể có NHIỀU dòng CÙNG tên nhưng khác quy cách (vd "Ống nước"
      // D34 và D90, PO DMH260002) — Map cũ (1 tên → 1 dòng) bị dòng sau ghi đè dòng trước,
      // khiến khối lượng nhận bị gán nhầm sang dòng khác và kích hoạt nhầm chặn "vượt quá số
      // lượng" (vuongMacKhoiLuongNhan), rollback cả phiếu dù dữ liệu gửi lên đúng. Sửa: gom
      // theo tên thành MẢNG ứng viên, chỉ nhận khi đúng 1 ứng viên — nếu nhiều ứng viên trùng
      // tên thì bắt buộc phân biệt tiếp bằng thongSoKyThuat (mirror đúng cách QLK CTR tự dùng
      // nội bộ, hàm `chonMotVatTu` trong app-mua-hang-actions.ts).
      const chuanHoa = (s: string | undefined | null) => (s ?? "").trim().toLowerCase();
      const dongTheoTen = new Map<string, (typeof tienDo)[number][]>();
      for (const d of tienDo.filter(laDongHang)) {
        const key = chuanHoa(d.tenVatLieu);
        const ds = dongTheoTen.get(key);
        if (ds) ds.push(d);
        else dongTheoTen.set(key, [d]);
      }

      function chonMotDong(l: PhieuNhanMoiTuQlkCtr["lines"][number]) {
        const ungVien = dongTheoTen.get(chuanHoa(l.tenVatLieu)) ?? [];
        if (ungVien.length === 1) return ungVien[0];
        if (ungVien.length > 1) {
          const theoQuyCach = ungVien.filter((d) => chuanHoa(d.thongSoKyThuat) === chuanHoa(l.thongSoKyThuat));
          if (theoQuyCach.length === 1) return theoQuyCach[0];
        }
        return null;
      }

      const khongKhop: string[] = [];
      const lines: DongNhanHang[] = payload.lines.map((l) => {
        // (28/09/2026) Số quy đổi từ kho — chỉ lưu để hiển thị, không tham gia tính tiến độ.
        const quyDoi =
          typeof l.soLuongQuyDoi === "number" && l.soLuongQuyDoi > 0
            ? { soLuongQuyDoi: l.soLuongQuyDoi, ...(l.dvtQuyDoi ? { dvtQuyDoi: l.dvtQuyDoi } : {}) }
            : {};
        const dong = chonMotDong(l);
        if (!dong) {
          khongKhop.push(l.thongSoKyThuat ? `${l.tenVatLieu} (${l.thongSoKyThuat})` : l.tenVatLieu);
          return { sttDongPO: -1, khoiLuongThucNhan: l.khoiLuongThucNhan, ...quyDoi };
        }
        return { sttDongPO: dong.sttDong, khoiLuongThucNhan: l.khoiLuongThucNhan, ...quyDoi };
      });
      if (khongKhop.length > 0) {
        throw new Error(`Không khớp được vật liệu trong PO "${payload.poCode}": ${khongKhop.join(", ")}.`);
      }

      const vuongMac = suaPhieu
        ? /* Sửa phiếu đã có: không hỏi "đơn đã nhận đủ chưa" (đây không phải thêm lần giao), và
             số phiếu NCC được trùng với CHÍNH nó. */
          vuongMacKhoiLuongNhan(tienDo, lines) ??
          vuongMacSoPhieuNCC(payload.soPhieuGiaoNCC ?? "", phieuCuaPO, suaPhieu.id)
        : vuongMacGhiThemPhieuNhan(tienDo) ??
          vuongMacKhoiLuongNhan(tienDo, lines) ??
          vuongMacSoPhieuNCC(payload.soPhieuGiaoNCC ?? "", phieuCuaPO);
      if (vuongMac) {
        throw new Error(vuongMac);
      }

      if (suaPhieu) {
        /* Đổi số / ngày / số phiếu / ảnh thì dấu "đã đối chiếu" của thu mua hết giá trị (họ đã soi
           bản CŨ) → gỡ để họ soi lại. Kho chỉ sửa thứ thu mua không thấy thì giữ nguyên dấu. */
        const noiDung = (p: Pick<PhieuNhanHang, "lines" | "ngayNhanThucTe" | "soPhieuGiaoNCC" | "anhQlkCtr">) =>
          chuoiOnDinh({
            lines: p.lines ?? [],
            ngay: p.ngayNhanThucTe ?? "",
            soPhieu: (p.soPhieuGiaoNCC ?? "").trim(),
            anh: p.anhQlkCtr?.url ?? "",
          });
        const khongDauDoiChieu: PhieuNhanHang = { ...suaPhieu };
        delete khongDauDoiChieu.thuMuaDoiChieu;
        const banMoi = {
          lines,
          ngayNhanThucTe: payload.ngayNhanThucTe || suaPhieu.ngayNhanThucTe,
          soPhieuGiaoNCC: payload.soPhieuGiaoNCC?.trim() || undefined,
          anhQlkCtr: payload.anhQlkCtr ?? suaPhieu.anhQlkCtr,
        };
        const doiNoiDung = noiDung(suaPhieu) !== noiDung(banMoi);
        const phieuMoi: PhieuNhanHang = {
          ...(doiNoiDung ? khongDauDoiChieu : suaPhieu),
          ...banMoi,
          lichSuSuaTuKho: [...(suaPhieu.lichSuSuaTuKho ?? []), lanSua!],
        };
        const boGhi = taoBoGhi(data);
        boGhi.sua("phieuNhan", suaPhieu.id, null, bo0Undefined(phieuMoi), () => phieuMoi);
        ghiLichSuHoSo(boGhi, data, po, {
          thoiDiem,
          nguoiThucHien: `${lanSua!.nguoiSuaTen} (App Kho)`,
          hanhDong: `Kho sửa phiếu nhận ${suaPhieu.code} (lần giao ${suaPhieu.lanGiaoThu})${
            doiNoiDung && suaPhieu.thuMuaDoiChieu ? " — dấu đối chiếu cũ đã gỡ, cần soi lại" : ""
          }`,
          ghiChu: `${tomTatThayDoi(lanSua!)}. Lý do: ${lanSua!.lyDo}`,
        });
        boGhi.ghi(tx, docRef);
        return { loai: "cap_nhat", phieu: phieuMoi };
      }

      /* ③ Lần giao LỚN NHẤT + 1 (kể cả phiếu Kho đã xoá), không phải số phiếu + 1 — xem chú thích đầu tệp. */
      const lanGiaoThu =
        phieuCuaPO.reduce((m, p) => Math.max(m, p.lanGiaoThu || 0), po.lanGiaoLonNhatTungCo ?? 0) + 1;
      const phieuMoi: PhieuNhanHang = {
        id: `grn-${po.id}-${lanGiaoThu}`,
        code: `${po.code}-DO${String(lanGiaoThu).padStart(2, "0")}`,
        poId: po.id,
        poCode: po.code,
        lanGiaoThu,
        ngayNhanThucTe: payload.ngayNhanThucTe,
        nguoiNhanUid: "qlk-ctr",
        nguoiNhanTen: payload.nguoiNhanTen,
        soPhieuGiaoNCC: payload.soPhieuGiaoNCC,
        trangThai: "da_nhap_kho",
        lines,
        maPhieuNhanQlkCtr: payload.maPhieuNhanQlkCtr,
        anhQlkCtr: payload.anhQlkCtr,
        /* `cap_nhat` của lần nhập CHƯA từng sang được: vẫn mang lịch sử sửa để thu mua thấy nhãn. */
        ...(cheDo === "cap_nhat" && lanSua ? { lichSuSuaTuKho: [lanSua] } : {}),
      };

      const donHangMoi = donHangHienCo.map((p) =>
        p.id === po.id && p.trangThai === "da_chot" ? { ...p, trangThai: "dang_giao" as const } : p,
      );

      /* Ghi đúng dạng máy chủ đang có, xét TỪNG khối riêng — `donHang` và `phieuNhan` có thể
         đang ở hai dạng khác nhau trong lúc chuyển đổi. */
      tx.set(
        docRef,
        bo0Undefined({
          donHang: ghiTheoDangHienCo("donHang", data.donHang, donHangMoi),
          phieuNhan: ghiTheoDangHienCo("phieuNhan", data.phieuNhan, [...phieuNhanHienCo, phieuMoi]),
        }),
        { merge: true },
      );
      return { loai: "moi", phieu: phieuMoi };
    });

    if (ketQua.loai === "da_xac_nhan") {
      return NextResponse.json(
        {
          ok: false,
          loai: "da_xac_nhan",
          error: `Đơn ${payload.poCode} đã được Thu mua "Xác nhận nhận hàng" — App Kho không sửa/xoá phiếu nhận được nữa.`,
        },
        { status: 409 },
      );
    }
    if (ketQua.loai === "kiem_tra") {
      return NextResponse.json({
        ok: true,
        trangThai: "kiem_tra",
        coPO: ketQua.coPO,
        coPhieu: ketQua.coPhieu,
        daXacNhan: ketQua.daXacNhan,
        maKhop: ketQua.maKhop,
        phieuCode: ketQua.phieuCode,
      });
    }
    if (ketQua.loai === "da_xoa") {
      return NextResponse.json({ ok: true, trangThai: "da_xoa", phieuCode: ketQua.phieuCode });
    }

    /* ★ Báo chuông App Tổng "Kho đã nhận hàng" (Sếp duyệt demo 08/10/2026) — CHỈ khi phiếu MỚI vừa ghi;
       gửi lại / trùng (`da_ton_tai`) không báo. Chạy sau khi trả lời, hỏng chỉ ghi log. */
    if (ketQua.loai === "moi") {
      const phieuId = ketQua.phieu.id;
      after(() => guiKhoDaNhan(phieuId, PQ));
    }

    if (ketQua.loai === "cap_nhat") {
      return NextResponse.json({
        ok: true,
        trangThai: "da_cap_nhat",
        phieuId: ketQua.phieu.id,
        phieuCode: ketQua.phieu.code,
        maKhop: ketQua.phieu.maPhieuNhanQlkCtr ?? payload.maPhieuNhanQlkCtr,
      });
    }
    return NextResponse.json({
      ok: true,
      trangThai: ketQua.loai === "moi" ? "da_tao" : "da_ton_tai",
      phieuId: ketQua.phieu.id,
      phieuCode: ketQua.phieu.code,
      maKhop: ketQua.phieu.maPhieuNhanQlkCtr,
    });
  } catch (error) {
    console.error("Lỗi nhận phiếu nhận hàng từ QLK CTR:", error);
    const thongBaoLoi = error instanceof Error ? error.message : "Lỗi không xác định.";
    return NextResponse.json({ ok: false, error: thongBaoLoi }, { status: 500 });
  }
}
