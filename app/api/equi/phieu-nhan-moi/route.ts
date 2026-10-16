import { after, NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { FieldPath, FieldValue } from "firebase-admin/firestore";
import { getThuMuaDb } from "@/5-ket-noi/hpcore-may-chu";
import { bo0Undefined } from "@/3-du-lieu/kho-chung-firestore";
import { duongDanKhoChung } from "@/3-du-lieu/kho-id";
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

// ============================================================
// CỬA TIẾP NHẬN PHIẾU NHẬN HÀNG TỪ APP EQUI — Liên kết mua hàng EQUI (Sếp duyệt 15/10/2026, "code đi")
//
//   POST /api/equi/phieu-nhan-moi        Header: x-api-key: <EQUI_PHIEU_NHAN_API_KEY>
//   Body: PhieuNhanMoiTuQlkCtr (Y HỆT khuôn QLK CTR đang gửi — hợp đồng kết nối mục 4)
//
// App EQUI đóng vai "App Kho" cho đề xuất nhóm "(EQUI)": thủ kho EQUI ghi nhập kho + ảnh phiếu giao
// MỘT LẦN bên App EQUI, phiếu nhận hàng tự sinh ở đây — vào **KHO EQUI** (`duongDanKhoChung("equi")`),
// hiện ở khối "Tiến hành nhận hàng" của kho EQUI y như phiếu từ QLK CTR (cùng trường `anhQlkCtr`,
// `maPhieuNhanQlkCtr`, nên "Khớp số liệu", "Xác nhận nhận hàng"… dùng chung không phải sửa).
//
// 🔴🔴 CHÉP TỪ `app/api/qlk-ctr/phieu-nhan-moi/route.ts` (VÙNG CẤM — không được sửa tệp đó, nên
// không tách được phần chung ra để gọi lại). HAI BẢN PHẢI GIỐNG HỆT VỀ LUẬT: mọi `cheDo`
// (tao / kiem_tra / cap_nhat / xoa), chống trùng theo mã phiếu (+ `maPhieuDuPhong`), 409 khi đơn đã
// "Xác nhận nhận hàng", lần giao = lớn nhất + 1, khớp dòng theo tên (+ quy cách), ba luật `vuongMac*`.
// Bài kiểm `npm run kiem-re-kho-equi` chạy THẬT cả hai route trên cùng một kịch bản và đòi phiếu ghi ra
// giống nhau (trừ các chỗ cố ý khác ngay dưới). Sửa bản gốc (có phép Sếp) thì sửa y hệt ở đây.
//
// CHỈ KHÁC BẢN GỐC Ở BỐN CHỖ (cố ý):
//   ① Kho: đọc/ghi `duongDanKhoChung("equi")` — KHÔNG BAO GIỜ chạm tài liệu kho thường.
//   ② Khoá: `EQUI_PHIEU_NHAN_API_KEY`. THIẾU KHOÁ → 503, ĐÓNG CỔNG (bản gốc thiếu khoá thì mở — hợp
//      đồng chốt bên nhận thiếu khoá phải đóng). So khoá bằng phép so hằng thời gian.
//   ③ Chữ: người thực hiện ghi "(App EQUI)" thay "(App Kho)"; câu 409 nói "App EQUI"; người nhận phiếu
//      mang uid "app-equi" (bản gốc "qlk-ctr" — không chỗ nào trong app so chuỗi đó).
//   ④ Chuông App Tổng "Kho đã nhận hàng": gọi `guiKhoDaNhan(…, "equi")` để đọc đúng kho EQUI (bản gốc
//      không truyền kho → kho thường).
// ============================================================

const KHO = "equi" as const;
const TEN_APP = "App EQUI";

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
 * So khoá hằng thời gian. Băm cả hai về cùng độ dài trước — `timingSafeEqual` đòi hai bộ đệm dài
 * bằng nhau, so độ dài trước là lộ độ dài khoá qua thời gian trả lời.
 */
function khoaKhop(gui: string | null, yeuCau: string): boolean {
  if (!gui) return false;
  const a = createHash("sha256").update(gui).digest();
  const b = createHash("sha256").update(yeuCau).digest();
  return timingSafeEqual(a, b);
}

/** Chép từ bản gốc — gom mọi thay đổi của 1 lần sửa/xoá vào ĐÚNG 1 lệnh `tx.update`. */
function taoBoGhi(data: DuLieu) {
  const capMap: unknown[] = [];
  const banMang = new Map<TenKhoi, CoId[]>();
  return {
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

/** Chép từ bản gốc — đơn có `prId` ghi vào lịch sử ĐỀ NGHỊ, không thì lịch sử ĐƠN; không thấy đích thì bỏ qua. */
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

function tomTatThayDoi(lanSua: NonNullable<PhieuNhanMoiTuQlkCtr["lanSua"]>): string {
  return lanSua.thayDoi.map((t) => `${t.muc}: ${t.truoc} → ${t.sau}`).join("; ");
}

export async function POST(req: NextRequest): Promise<NextResponse<KetQuaNhanPhieuTuQlkCtr>> {
  /* ② THIẾU KHOÁ → ĐÓNG CỔNG (khác bản gốc, cố ý — hợp đồng kết nối). */
  const apiKeyYeuCau = process.env.EQUI_PHIEU_NHAN_API_KEY?.trim();
  if (!apiKeyYeuCau) {
    return NextResponse.json(
      { ok: false, error: "Cửa nhận phiếu từ App EQUI chưa cấu hình EQUI_PHIEU_NHAN_API_KEY — đang đóng." },
      { status: 503 },
    );
  }
  if (!khoaKhop(req.headers.get("x-api-key"), apiKeyYeuCau)) {
    return NextResponse.json({ ok: false, error: "Thiếu hoặc sai x-api-key." }, { status: 401 });
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
  const cacMa = [payload.maPhieuNhanQlkCtr, ...(payload.maPhieuDuPhong ?? [])]
    .map((m) => (typeof m === "string" ? m.trim() : ""))
    .filter(Boolean);

  try {
    const db = getThuMuaDb();
    /* ① KHO EQUI — đường dẫn lấy từ `kho-id.ts`, một chỗ duy nhất. */
    const duongDan = duongDanKhoChung(KHO);
    const docRef = db.collection(duongDan.boSuuTap).doc(duongDan.tep);

    const ketQua = await db.runTransaction(async (tx): Promise<KetQuaGiaoDich> => {
      const snap = await tx.get(docRef);
      const data = (snap.exists ? snap.data() : {}) as DuLieu;
      const donHangHienCo: DonDatHang[] = tuMap<DonDatHang>(data.donHang);
      const phieuNhanHienCo: PhieuNhanHang[] = tuMap<PhieuNhanHang>(data.phieuNhan);

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

      // Chống trùng khi App EQUI gọi lại (retry do mạng lỗi) — trả lại đúng phiếu đã tạo.
      if (cheDo === "tao" && phieuCu) {
        return { loai: "ton_tai", phieu: phieuCu };
      }

      if (!po) {
        throw new Error(`Không tìm thấy đơn mua hàng "${payload.poCode}" trong kho EQUI.`);
      }
      if (phieuCu && phieuCu.poId !== po.id) {
        throw new Error(`Phiếu kho "${phieuCu.maPhieuNhanQlkCtr}" thuộc đơn ${phieuCu.poCode}, không phải ${po.code}.`);
      }
      if ((cheDo === "cap_nhat" || cheDo === "xoa") && po.xacNhanKho) {
        return { loai: "da_xac_nhan" };
      }

      const thoiDiem = new Date().toISOString();
      const phieuCuaPO = phieuNhanHienCo.filter((p) => p.poId === po.id);

      if (cheDo === "xoa") {
        if (!phieuCu) return { loai: "da_xoa" };
        const boGhi = taoBoGhi(data);
        boGhi.sua("phieuNhan", phieuCu.id, null, FieldValue.delete(), () => null);
        const lanGiaoLonNhat = phieuCuaPO.reduce((m, p) => Math.max(m, p.lanGiaoThu || 0), po.lanGiaoLonNhatTungCo ?? 0);
        boGhi.sua("donHang", po.id, "lanGiaoLonNhatTungCo", lanGiaoLonNhat, (cu) => ({
          ...cu,
          lanGiaoLonNhatTungCo: lanGiaoLonNhat,
        }));
        ghiLichSuHoSo(boGhi, data, po, {
          thoiDiem,
          nguoiThucHien: `${lanSua!.nguoiSuaTen} (${TEN_APP})`,
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
      const tienDo = tinhTienDoPO(po, suaPhieu ? phieuCuaPO.filter((p) => p.id !== suaPhieu.id) : phieuCuaPO);

      // Khớp theo TÊN vật liệu; trùng tên thì phân biệt tiếp bằng quy cách (chép từ bản gốc).
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
        ? vuongMacKhoiLuongNhan(tienDo, lines) ??
          vuongMacSoPhieuNCC(payload.soPhieuGiaoNCC ?? "", phieuCuaPO, suaPhieu.id)
        : vuongMacGhiThemPhieuNhan(tienDo) ??
          vuongMacKhoiLuongNhan(tienDo, lines) ??
          vuongMacSoPhieuNCC(payload.soPhieuGiaoNCC ?? "", phieuCuaPO);
      if (vuongMac) {
        throw new Error(vuongMac);
      }

      if (suaPhieu) {
        /* Đổi số / ngày / số phiếu / ảnh thì dấu "đã đối chiếu" của thu mua hết giá trị → gỡ để soi lại. */
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
          nguoiThucHien: `${lanSua!.nguoiSuaTen} (${TEN_APP})`,
          hanhDong: `Kho sửa phiếu nhận ${suaPhieu.code} (lần giao ${suaPhieu.lanGiaoThu})${
            doiNoiDung && suaPhieu.thuMuaDoiChieu ? " — dấu đối chiếu cũ đã gỡ, cần soi lại" : ""
          }`,
          ghiChu: `${tomTatThayDoi(lanSua!)}. Lý do: ${lanSua!.lyDo}`,
        });
        boGhi.ghi(tx, docRef);
        return { loai: "cap_nhat", phieu: phieuMoi };
      }

      /* Lần giao LỚN NHẤT + 1 (kể cả phiếu Kho đã xoá), không phải số phiếu + 1. */
      const lanGiaoThu =
        phieuCuaPO.reduce((m, p) => Math.max(m, p.lanGiaoThu || 0), po.lanGiaoLonNhatTungCo ?? 0) + 1;
      const phieuMoi: PhieuNhanHang = {
        id: `grn-${po.id}-${lanGiaoThu}`,
        code: `${po.code}-DO${String(lanGiaoThu).padStart(2, "0")}`,
        poId: po.id,
        poCode: po.code,
        lanGiaoThu,
        ngayNhanThucTe: payload.ngayNhanThucTe,
        nguoiNhanUid: "app-equi",
        nguoiNhanTen: payload.nguoiNhanTen,
        soPhieuGiaoNCC: payload.soPhieuGiaoNCC,
        trangThai: "da_nhap_kho",
        lines,
        maPhieuNhanQlkCtr: payload.maPhieuNhanQlkCtr,
        anhQlkCtr: payload.anhQlkCtr,
        ...(cheDo === "cap_nhat" && lanSua ? { lichSuSuaTuKho: [lanSua] } : {}),
      };

      const donHangMoi = donHangHienCo.map((p) =>
        p.id === po.id && p.trangThai === "da_chot" ? { ...p, trangThai: "dang_giao" as const } : p,
      );

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
          error: `Đơn ${payload.poCode} đã được Thu mua "Xác nhận nhận hàng" — ${TEN_APP} không sửa/xoá phiếu nhận được nữa.`,
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

    /* ④ Chuông App Tổng "Kho đã nhận hàng" — CHỈ khi phiếu MỚI vừa ghi, đọc đúng kho EQUI. */
    if (ketQua.loai === "moi") {
      const phieuId = ketQua.phieu.id;
      after(() => guiKhoDaNhan(phieuId, PQ, KHO));
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
    console.error("Lỗi nhận phiếu nhận hàng từ App EQUI:", error);
    const thongBaoLoi = error instanceof Error ? error.message : "Lỗi không xác định.";
    return NextResponse.json({ ok: false, error: thongBaoLoi }, { status: 500 });
  }
}
