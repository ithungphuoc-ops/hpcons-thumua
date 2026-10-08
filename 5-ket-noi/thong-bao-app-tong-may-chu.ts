// ============================================================
// GỬI THÔNG BÁO THU MUA SANG CHUÔNG APP TỔNG — PHẦN MÁY CHỦ (Sếp duyệt demo 08/10/2026)
//
// Luật (loại tin, người nhận, nội dung, không giá) ở `2-quy-trinh/thong-bao-app-tong.ts` — tệp này chỉ:
//   ① ĐỌC (chỉ đọc) tài liệu chung `chay-thu/du-lieu-chung` — chỉ các khối cần (thongBao, deNghi,
//      donHang, baoGia, phieuNhan; KHÔNG đọc giaDonHang) — và danh bạ quyền Thu mua;
//   ② gọi cổng App Tổng `POST /api/notifications/ingest`.
//
// 🔴 KHÔNG GHI GÌ vào dữ liệu nghiệp vụ. Không đổi cách lưu. Hỏng ở đâu cũng chỉ ghi log, không ném ra
// ngoài — việc nghiệp vụ đã xong trước khi chạy tới đây (gọi trong `after()`).
//
// 📌 Công tắc: thiếu `NOTIFY_INGEST_KEY` → tắt hẳn (không đọc Firestore, không gọi mạng).
//    `NOTIFY_INGEST_URL` (tuỳ chọn) đổi địa chỉ cổng; mặc định https://account.hpcore.vn/api/notifications/ingest.
//
// 📌 Chỉ GỌI hàm export của `hpcore-may-chu.ts` / `ho-so-tai-khoan.ts` (vùng của phiên tích hợp), không sửa.
// ============================================================

import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getHpcoreDb, getThuMuaDb } from "@/5-ket-noi/hpcore-may-chu";
import { BO_SUU_TAP_NGUOI_DUNG } from "@/5-ket-noi/ho-so-tai-khoan";
import { DUONG_DAN } from "@/3-du-lieu/kho-chung-firestore";
import { tuMap } from "@/2-quy-trinh/ghi-tung-phan";
import { boTraGiaiDoanTheoId } from "@/2-quy-trinh/giai-doan-mua-hang";
import { laDongHang, tinhTienDoPO } from "@/2-quy-trinh/tinh-toan";
import { tinhQuyen } from "@/4-phan-quyen/quyen";
import { BO_SUU_TAP_QUYEN_RIENG } from "@/4-phan-quyen/quyen-rieng";
import type {
  BaoGia,
  DeNghiMuaHang,
  DonDatHang,
  PhieuNhanHang,
  ThongBaoChuyenBuoc,
} from "@/3-du-lieu/kieu-du-lieu";
import {
  BoNhoDaGui,
  dungGoiGui,
  giaiNguoiNhan,
  goiYTenTuDon,
  goiYTenTuHoSo,
  luatDuocXem,
  maSuKien,
  maSuKienKhoNhan,
  NHAN_TBP,
  noiDungChoTin,
  noiDungKhoNhan,
  phanLoaiTin,
  tinConMoi,
  TOI_DA_MA_MOI_LAN,
  type GoiGuiAppTong,
  type LoaiTinAppTong,
  type NguoiTrongDanhBa,
} from "@/2-quy-trinh/thong-bao-app-tong";

/**
 * Các hàm đọc quyền máy chủ của `5-ket-noi/phan-quyen-may-chu.ts`, do ROUTE truyền vào.
 *
 * 📌 Vì sao không nạp thẳng: luật C-F4 (`kiem-luat-dung-chung.mjs`, 06/10/2026) chỉ cho tệp `app/api/**​/route.ts`
 * nạp `phan-quyen-may-chu.ts`. Route nạp rồi trao cho tệp này — cùng một bộ hàm, không chép lại luật quyền.
 */
export type CongQuyenMayChu = Pick<
  typeof import("@/5-ket-noi/phan-quyen-may-chu"),
  "banGhiTuAnh" | "mauTuAnh" | "nguoiGoiTuAnh" | "refMau"
>;

const DIA_CHI_MAC_DINH = "https://account.hpcore.vn/api/notifications/ingest";
const CHO_TOI_DA_MS = 8000;
const NHAT_KY = "[thong-bao-app-tong]";

/** Khoá cổng App Tổng. Trống = tính năng tắt. */
function khoaIngest(): string {
  return (process.env.NOTIFY_INGEST_KEY ?? "").trim();
}

export function daBatThongBaoAppTong(): boolean {
  return khoaIngest().length > 0;
}

function diaChiIngest(): string {
  return (process.env.NOTIFY_INGEST_URL ?? "").trim() || DIA_CHI_MAC_DINH;
}

/** Chặn gửi lại cùng sự kiện trong cùng máy chủ (App Tổng mới là chốt chống trùng thật theo eventId). */
const daGui = new BoNhoDaGui();

// ------------------------------------------------------------
// GỌI APP TỔNG — hẹn giờ 8s, thử lại TỐI ĐA 1 lần khi lỗi mạng (không thử lại khi App Tổng trả lỗi)
// ------------------------------------------------------------

async function goiMotLan(goi: GoiGuiAppTong): Promise<{ ok: boolean; status?: number; loiMang?: boolean }> {
  const huy = new AbortController();
  const hen = setTimeout(() => huy.abort(), CHO_TOI_DA_MS);
  try {
    const res = await fetch(diaChiIngest(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${khoaIngest()}` },
      body: JSON.stringify(goi),
      signal: huy.signal,
      cache: "no-store",
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, loiMang: true };
  } finally {
    clearTimeout(hen);
  }
}

export async function guiSangAppTong(goi: GoiGuiAppTong): Promise<boolean> {
  if (!daBatThongBaoAppTong()) return false;
  if (goi.recipients.length === 0) return false;
  if (!daGui.danhDau(goi.eventId)) return false;
  let kq = await goiMotLan(goi);
  if (!kq.ok && kq.loiMang) kq = await goiMotLan(goi);
  if (!kq.ok) {
    daGui.bo(goi.eventId);
    console.warn(NHAT_KY, "App Tổng không nhận", goi.eventId, kq.loiMang ? "lỗi mạng" : `mã ${kq.status}`);
    return false;
  }
  return true;
}

// ------------------------------------------------------------
// DANH BẠ QUYỀN — mọi hồ sơ `nguoi-dung` + owner App Tổng, quyền HIỆU LỰC (mẫu + quyền riêng). Đệm 60s.
// ------------------------------------------------------------

let demDanhBa: { luc: number; ds: NguoiTrongDanhBa[] } | null = null;
const HAN_DEM_MS = 60_000;

async function docDanhBa(pq: CongQuyenMayChu): Promise<NguoiTrongDanhBa[]> {
  const { banGhiTuAnh, mauTuAnh, nguoiGoiTuAnh, refMau } = pq;
  if (demDanhBa && Date.now() - demDanhBa.luc < HAN_DEM_MS) return demDanhBa.ds;
  const db = getThuMuaDb();
  const [snapHoSo, snapRieng, anhMau, snapOwner] = await Promise.all([
    db.collection(BO_SUU_TAP_NGUOI_DUNG).get(),
    db.collection(BO_SUU_TAP_QUYEN_RIENG).get(),
    refMau().get(),
    getHpcoreDb().collection("users").where("role", "==", "owner").get(),
  ]);
  const hoSo = new Map<string, DocumentSnapshot>(snapHoSo.docs.map((d) => [d.id, d]));
  const rieng = new Map<string, DocumentSnapshot>(snapRieng.docs.map((d) => [d.id, d]));
  const owner = new Map<string, string>(
    snapOwner.docs
      .filter((d) => d.data().isActive !== false)
      .map((d) => [d.id, String(d.data().fullName ?? d.data().email ?? "").trim()]),
  );

  /* Dấu vết mẫu: MỌI bản ghi quyền riêng (cùng cách `?tatCa=1`). Bản ghi hỏng → bỏ khỏi dấu vết. */
  const vet = snapRieng.docs.map((d) => {
    try {
      return banGhiTuAnh(d.id, d);
    } catch {
      return null;
    }
  });
  /* 🔴 Mẫu hỏng → NÉM (nơi gọi bắt, không gửi gì): không đoán quyền rộng hơn. */
  const { mau } = mauTuAnh(anhMau, vet);

  const ds: NguoiTrongDanhBa[] = [];
  for (const uid of new Set([...hoSo.keys(), ...owner.keys()])) {
    try {
      const laOwner = owner.has(uid);
      const goi = nguoiGoiTuAnh(uid, laOwner, hoSo.get(uid), rieng.get(uid), mau);
      if (!goi) continue;
      const q = tinhQuyen(goi.nguoiDung);
      const hs = hoSo.get(uid)?.data() as { tenHienThi?: unknown; uidNghiepVu?: unknown } | undefined;
      const ten = (laOwner ? owner.get(uid) : "") || String(hs?.tenHienThi ?? goi.nguoiDung.tenHienThi ?? "");
      ds.push({
        firebaseUid: uid,
        uidNghiepVu: typeof hs?.uidNghiepVu === "string" && hs.uidNghiepVu ? hs.uidNghiepVu : uid,
        ten,
        quyen: q,
        laBanLanhDao: laOwner || goi.nguoiDung.vaiTro === "director",
      });
    } catch (e) {
      console.warn(NHAT_KY, "bỏ qua hồ sơ đọc lỗi", uid, e instanceof Error ? e.message : e);
    }
  }
  demDanhBa = { luc: Date.now(), ds };
  return ds;
}

// ------------------------------------------------------------
// ĐỌC TÀI LIỆU CHUNG — CHỈ ĐỌC, chỉ các khối cần
// ------------------------------------------------------------

interface KhoDoc {
  thongBao: ThongBaoChuyenBuoc[];
  deNghi: DeNghiMuaHang[];
  donHang: DonDatHang[];
  baoGia: BaoGia[];
  phieuNhan: PhieuNhanHang[];
}

async function docKhoChung(): Promise<KhoDoc> {
  const db = getThuMuaDb();
  const ref = db.collection(DUONG_DAN.boSuuTap).doc(DUONG_DAN.tep);
  const [anh] = await db.getAll(ref, { fieldMask: ["thongBao", "deNghi", "donHang", "baoGia", "phieuNhan"] });
  const d = (anh?.exists ? anh.data() : {}) as Record<string, unknown>;
  return {
    thongBao: tuMap<ThongBaoChuyenBuoc>(d.thongBao),
    deNghi: tuMap<DeNghiMuaHang>(d.deNghi),
    donHang: tuMap<DonDatHang>(d.donHang),
    baoGia: tuMap<BaoGia>(d.baoGia),
    phieuNhan: tuMap<PhieuNhanHang>(d.phieuNhan),
  };
}

// ------------------------------------------------------------
// CÁC LỐI VÀO
// ------------------------------------------------------------

/**
 * Gửi các tin chuông VỪA TẠO (theo mã) sang App Tổng. Đọc lại tin từ tài liệu chung — nội dung KHÔNG lấy
 * từ người gọi. `actorUid` = người vừa thao tác (mã Firebase), `null` khi do máy chủ / app khác tạo.
 *
 * Không bao giờ ném lỗi.
 */
export async function guiTinTheoMa(
  ids: readonly string[],
  actorUid: string | null,
  pq: CongQuyenMayChu,
): Promise<void> {
  if (!daBatThongBaoAppTong() || ids.length === 0) return;
  try {
    const can = [...new Set(ids)].slice(0, TOI_DA_MA_MOI_LAN);
    const kho = await docKhoChung();
    const theoMa = new Map(kho.thongBao.map((t) => [t.id, t]));
    const tin = can
      .map((id) => theoMa.get(id))
      .filter((t): t is ThongBaoChuyenBuoc => Boolean(t) && tinConMoi(t!.thoiDiem))
      .map((t) => ({ t, loai: phanLoaiTin(t) }))
      .filter(
        (x): x is { t: ThongBaoChuyenBuoc; loai: Exclude<LoaiTinAppTong, "kho_da_nhan"> } =>
          x.loai !== null && x.loai !== "kho_da_nhan",
      );
    if (tin.length === 0) return;

    const danhBa = await docDanhBa(pq);
    const giaiDoanCua = boTraGiaiDoanTheoId(kho.deNghi, kho.donHang, kho.baoGia, kho.phieuNhan);
    const hoSoTheoId = new Map(kho.deNghi.map((d) => [d.id, d]));
    const donTheoId = new Map(kho.donHang.map((p) => [p.id, p]));
    const tenNguoiGui = actorUid ? danhBa.find((n) => n.firebaseUid === actorUid)?.ten : undefined;

    for (const { t, loai } of tin) {
      const ghiLog = (s: string) => console.warn(NHAT_KY, t.id, s);
      let goiYTen: Map<string, Set<string>>;
      let uidNghiepVuThem: string[] = [];
      if (loai === "canh_bao") {
        /* Tin cảnh báo mang id CỦA PO. Bảng đã duyệt: + người phụ trách PO. */
        const po = donTheoId.get(t.prId);
        goiYTen = goiYTenTuDon(po);
        if (po?.nguoiPhuTrachUid) uidNghiepVuThem = [po.nguoiPhuTrachUid];
      } else {
        const dn = hoSoTheoId.get(t.prId);
        const cha = dn?.deNghiChaId ? hoSoTheoId.get(dn.deNghiChaId) : undefined;
        goiYTen = goiYTenTuHoSo(dn, cha);
      }
      const recipients = giaiNguoiNhan(t.guiToi ?? [], {
        danhBa,
        actorUid,
        goiYTen,
        uidNghiepVuThem,
        duocXem: luatDuocXem(loai, { denBuoc: t.denBuoc, giaiDoanHoSo: giaiDoanCua(t.prId) }),
        ghiLog,
      });
      if (recipients.length === 0) continue;
      const nd = noiDungChoTin(t, loai, loai === "cho_duyet_bao_gia" ? tenNguoiGui : undefined);
      await guiSangAppTong(dungGoiGui(maSuKien(t, loai), recipients, nd));
    }
  } catch (e) {
    console.warn(NHAT_KY, "không gửi được:", e instanceof Error ? e.message : e);
  }
}

/**
 * "Kho đã nhận hàng" — gọi SAU KHI cửa `qlk-ctr/phieu-nhan-moi` đã ghi xong một phiếu MỚI.
 * Người nhận: người phụ trách PO (bảng đã duyệt). Không bao giờ ném lỗi.
 */
export async function guiKhoDaNhan(phieuId: string, pq: CongQuyenMayChu): Promise<void> {
  if (!daBatThongBaoAppTong() || !phieuId) return;
  try {
    const kho = await docKhoChung();
    const phieu = kho.phieuNhan.find((p) => p.id === phieuId);
    if (!phieu) return;
    const po = kho.donHang.find((p) => p.id === phieu.poId);
    if (!po) return;
    const tienDo = tinhTienDoPO(
      po,
      kho.phieuNhan.filter((p) => p.poId === po.id),
    ).filter(laDongHang);
    const daNhanDu = tienDo.length > 0 && tienDo.every((d) => d.khoiLuongConLai <= 0);
    const danhBa = await docDanhBa(pq);
    const giaiDoanCua = boTraGiaiDoanTheoId(kho.deNghi, kho.donHang, kho.baoGia, kho.phieuNhan);
    const recipients = giaiNguoiNhan([], {
      danhBa,
      actorUid: null,
      uidNghiepVuThem: po.nguoiPhuTrachUid ? [po.nguoiPhuTrachUid] : [],
      duocXem: luatDuocXem("kho_da_nhan", { poPrId: po.prId ?? null, giaiDoanCua }),
      ghiLog: (s) => console.warn(NHAT_KY, phieuId, s),
    });
    if (recipients.length === 0) return;
    const nd = noiDungKhoNhan({
      poId: po.id,
      poCode: po.code,
      tenCongTrinh: po.tenCongTrinh,
      lanGiaoThu: phieu.lanGiaoThu,
      daNhanDu,
    });
    await guiSangAppTong(dungGoiGui(maSuKienKhoNhan(phieu.id), recipients, nd));
  } catch (e) {
    console.warn(NHAT_KY, "không gửi được (kho đã nhận):", e instanceof Error ? e.message : e);
  }
}

/**
 * "Đề nghị mới cần phân bổ" cho MỘT hồ sơ vừa tạo ở máy chủ (cửa App Request `de-nghi-moi`).
 *
 * 🔴 CHƯA ĐƯỢC GỌI Ở ĐÂU: `app/api/app-request/de-nghi-moi/route.ts` thuộc VÙNG CẤM SỬA (BAN-DO-MA-NGUON.md
 * §2b-bis, chỉ đạo Sếp 20/08/2026). Khi Sếp cho phép, chỉ cần thêm sau giao dịch, nhánh `ketQua.moi`:
 *     after(() => guiDeNghiMoi(ketQua.deNghi.id, PQ));   // PQ = import * as PQ from "@/5-ket-noi/phan-quyen-may-chu"
 * Mã sự kiện trùng với đường tin `tb-req-*` của trình duyệt (`thu_mua:de-nghi-moi:{prId}`) → hai đường
 * cùng chạy thì App Tổng chỉ nhận một lần. Không bao giờ ném lỗi.
 */
export async function guiDeNghiMoi(prId: string, pq: CongQuyenMayChu): Promise<void> {
  if (!daBatThongBaoAppTong() || !prId) return;
  try {
    const kho = await docKhoChung();
    const dn = kho.deNghi.find((d) => d.id === prId);
    if (!dn) return;
    const tin: ThongBaoChuyenBuoc = {
      id: `tb-req-${dn.id}`,
      prId: dn.id,
      prCode: dn.code,
      tieuDe: dn.tieuDe,
      tuBuoc: "tiep_nhan",
      denBuoc: "tiep_nhan",
      thoiDiem: new Date().toISOString(),
      guiToi: [NHAN_TBP],
      daDoc: false,
    };
    const danhBa = await docDanhBa(pq);
    const giaiDoanCua = boTraGiaiDoanTheoId(kho.deNghi, kho.donHang, kho.baoGia, kho.phieuNhan);
    const recipients = giaiNguoiNhan(tin.guiToi, {
      danhBa,
      actorUid: null,
      duocXem: luatDuocXem("de_nghi_moi", { denBuoc: "tiep_nhan", giaiDoanHoSo: giaiDoanCua(dn.id) }),
      ghiLog: (s) => console.warn(NHAT_KY, prId, s),
    });
    if (recipients.length === 0) return;
    await guiSangAppTong(dungGoiGui(maSuKien(tin, "de_nghi_moi"), recipients, noiDungChoTin(tin, "de_nghi_moi")));
  } catch (e) {
    console.warn(NHAT_KY, "không gửi được (đề nghị mới):", e instanceof Error ? e.message : e);
  }
}
