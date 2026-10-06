"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, History, Lock, Minus, MoreHorizontal, RotateCcw, ShieldAlert, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/1-giao-dien/nen-tang-ui/dropdown-menu";
import { OTich } from "@/1-giao-dien/thanh-phan-dung-chung/o-tich-ba-trang-thai";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { useDonDepHopThoaiKet } from "@/1-giao-dien/thanh-phan-dung-chung/don-dep-hop-thoai-ket";
import { CO_TICK_DUOC, NHOM_QUYEN_TICK, type CoTickDuoc } from "@/4-phan-quyen/quyen-rieng";
import { VAI_TRO_CHUAN, type MaVaiTroChuan, type VaiTroChuan } from "@/4-phan-quyen/vai-tro-chuan";
import {
  COT_KHOA_MAU,
  DONG_GHI_CHU_MAU,
  GHI_CHU_LUAT_CO_DINH,
  MAU_TRONG,
  giaTriDongGhiChu,
  lyDoKhongSuaOMau,
  phuThuocCuaO,
  quyenCuaVaiTroCoMau,
  type MauChucDanh,
  type ThayDoiMau,
} from "@/4-phan-quyen/mau-chuc-danh";
import type { NguoiDung, Quyen } from "@/4-phan-quyen/quyen";
import type { DongLichSuDemo } from "@/3-du-lieu/kho-phan-quyen-demo";
import { formatDateTime } from "@/6-tien-ich/dinh-dang";

/**
 * ★★ BẢNG MẪU QUYỀN THEO CHỨC DANH — BẤM ĐƯỢC. Sếp chốt 06/10/2026 (kế hoạch phân quyền, mục 6):
 *   · Câu 1 = A — bấm thẳng vào bảng "chức danh nào mặc định làm được gì" để đổi mặc định cho CẢ chức
 *     danh, áp cho người được gán chức danh đó về sau.
 *   · Câu 2 = B — Trưởng bộ phận cũng sửa được, giới hạn cột mình gán được và dòng mình có; Quản trị sửa
 *     mọi ô không khoá.
 *   · Câu 3 = A — người có quyền riêng chỉ giữ ô cố ý khác, ô còn lại theo mẫu mới.
 *
 * 🔴 TỆP NÀY CHỈ HIỆN VÀ HỎI LUẬT — KHÔNG VIẾT LUẬT. Dòng = `CO_TICK_DUOC` (một nguồn với khối tick từng
 * người) + hai dòng ghi chú `DONG_GHI_CHU_MAU`; cột = `VAI_TRO_CHUAN`; giá trị ô = `quyenCuaVaiTroCoMau`
 * (công thức + mẫu); ô khoá và lý do = `lyDoKhongSuaOMau` (CÙNG hàm máy chủ hỏi lại trước khi ghi). Bản
 * nháp chỉ là "ô nào định đổi"; phép tính lưu thật là `tinhLuuMauChucDanh` (màn cha chạy thử trước khi
 * mở hộp xác nhận, máy chủ / kho demo chạy lại).
 *
 * 📱 Dưới 768px: Card List (chọn một chức danh rồi hiện 18 ô, mỗi vùng chạm ≥ 44px) — Design System V1.1
 * cấm ép bảng 11 cột lên điện thoại.
 */
export interface BangMauChucDanhProps {
  /** Mẫu đang cất. `null` = chưa đọc được (đang đọc, lỗi, hoặc hỏng — xem `mauHong`). */
  mau: MauChucDanh | null;
  /** Lý do mẫu HỎNG (máy chủ trả `mau-hong`), hoặc `null`. */
  mauHong: string | null;
  canhBaoMau: readonly string[];
  /** Người đang sửa — quyền HIỆU LỰC đã gộp mẫu + ngoại lệ (đúng thứ máy chủ dựng ở `ganQuyenRiengHieuLuc`). */
  nguoiGoi: NguoiDung;
  /** Bản nháp: chỉ ô định đổi. `null` = đưa ô về mặc định gốc (công thức). */
  nhap: ThayDoiMau;
  onDoiNhap: (moi: ThayDoiMau) => void;
  /** Lý do khoá CẢ bảng (chưa đọc được mẫu, không có quyền sửa mẫu…). `null` = từng ô theo luật. */
  khoaVi: string | null;
  /** Lý do khoá riêng nút Lưu (vd đang có nháp chưa lưu ở khối tick từng người). */
  lyDoKhongLuu: string | null;
  demNguoi: (ma: MaVaiTroChuan) => { soNguoi: number; soCoRieng: number };
  /** Bấm "N người…" ở đầu cột → màn cha đặt bộ lọc chức danh ở khối Nhân sự rồi cuộn lên. */
  onXemNguoi: (ma: MaVaiTroChuan) => void;
  onLuu: () => void;
  onHoanTac: () => void;
  /** Cứu mẫu hỏng (chỉ Quản trị) — màn cha hỏi lại rồi gọi máy chủ / kho demo. */
  onVeMacDinhKhiHong?: () => void;
  dangLuu: boolean;
  laDemo: boolean;
  lichSuDemo?: readonly DongLichSuDemo[] | null;
}

/** Ba bộ giá trị của một cột: công thức (mặc định gốc), mẫu đã lưu, và đang hiện (mẫu + nháp). */
interface GiaTriCot {
  goc: Quyen;
  daLuu: Quyen;
  hien: Quyen;
}

/**
 * Mẫu ĐỂ HIỆN = mẫu đã lưu đè thêm bản nháp. 📌 CHỈ ĐỂ VẼ (giá trị ô, dòng G2) — không quyết định ghi gì:
 * phép tính lưu thật (bỏ ô khoá, ô trùng công thức, chặn ô không được sửa) là `tinhLuuMauChucDanh`.
 * Ô khoá có lỡ nằm trong nháp cũng không hiện sai: `quyenCuaVaiTroCoMau` bỏ qua ô khoá.
 */
function mauKemNhap(mau: MauChucDanh, nhap: ThayDoiMau): MauChucDanh {
  const de = { ...mau.de };
  for (const [ma, cotNhap] of Object.entries(nhap) as [MaVaiTroChuan, Partial<Record<keyof Quyen, boolean | null>>][]) {
    const cot = { ...(de[ma] ?? {}) };
    for (const [k, v] of Object.entries(cotNhap ?? {}) as [keyof Quyen, boolean | null][]) {
      if (v === null) delete cot[k];
      else cot[k] = v;
    }
    de[ma] = cot;
  }
  return { ...mau, de };
}

export function BangMauChucDanh(p: BangMauChucDanhProps) {
  const [cotDienThoai, setCotDienThoai] = useState<MaVaiTroChuan>("nhan_vien_thu_mua");
  const [moLichSu, setMoLichSu] = useState(false);
  useDonDepHopThoaiKet(moLichSu);

  const mauHien = p.mau ?? MAU_TRONG;
  const giaTri = useMemo(() => {
    const xemTruoc = mauKemNhap(mauHien, p.nhap);
    const ra = {} as Record<MaVaiTroChuan, GiaTriCot>;
    for (const v of VAI_TRO_CHUAN) {
      ra[v.ma] = {
        goc: quyenCuaVaiTroCoMau(v, MAU_TRONG),
        daLuu: quyenCuaVaiTroCoMau(v, mauHien),
        hien: quyenCuaVaiTroCoMau(v, xemTruoc),
      };
    }
    return { cot: ra, xemTruoc };
  }, [mauHien, p.nhap]);

  const soONhap = Object.values(p.nhap).reduce((n, cot) => n + Object.keys(cot ?? {}).length, 0);
  const laQuanTri = p.nguoiGoi.vaiTro === "admin";

  /** Lý do một ô KHÔNG bấm được — một chỗ: khoá cả bảng, rồi luật `lyDoKhongSuaOMau` (máy chủ hỏi lại đúng nó). */
  const lyDoKhoaO = (ma: MaVaiTroChuan, k: keyof Quyen): string | null =>
    p.khoaVi ?? (p.dangLuu ? "Đang lưu…" : lyDoKhongSuaOMau(p.nguoiGoi, ma, k));

  /** Đổi một ô trong nháp: về đúng giá trị đã lưu → bỏ khỏi nháp; về đúng công thức → `null`. */
  function doiO(ma: MaVaiTroChuan, k: keyof Quyen, bat: boolean) {
    const g = giaTri.cot[ma];
    const cot = { ...(p.nhap[ma] ?? {}) };
    if (bat === g.daLuu[k]) delete cot[k];
    else cot[k] = bat === g.goc[k] ? null : bat;
    const moi: ThayDoiMau = { ...p.nhap };
    if (Object.keys(cot).length > 0) moi[ma] = cot;
    else delete moi[ma];
    p.onDoiNhap(moi);
  }

  /** Đưa mọi ô SỬA ĐƯỢC đang khác công thức về mặc định gốc (chỉ đổi nháp — vẫn phải Lưu). */
  function veMacDinh(chiCot?: MaVaiTroChuan) {
    const moi: ThayDoiMau = { ...p.nhap };
    let so = 0;
    for (const v of VAI_TRO_CHUAN) {
      if (chiCot && v.ma !== chiCot) continue;
      const g = giaTri.cot[v.ma];
      const cot = { ...(moi[v.ma] ?? {}) };
      for (const c of CO_TICK_DUOC) {
        if (g.hien[c.khoa] === g.goc[c.khoa] || lyDoKhoaO(v.ma, c.khoa)) continue;
        if (g.daLuu[c.khoa] === g.goc[c.khoa]) delete cot[c.khoa];
        else cot[c.khoa] = null;
        so += 1;
      }
      if (Object.keys(cot).length > 0) moi[v.ma] = cot;
      else delete moi[v.ma];
    }
    if (so === 0) {
      toast.info(chiCot ? "Cột này đang ở đúng mặc định gốc (với các ô bạn sửa được)." : "Các ô bạn sửa được đang ở đúng mặc định gốc.");
      return;
    }
    p.onDoiNhap(moi);
    toast.info(`Đã đưa ${so} ô về mặc định gốc trong bản nháp — bấm “Lưu mẫu” để áp dụng.`);
  }

  /** Cột này người đang sửa có sửa được ô nào không (để hiện menu "Về mặc định gốc cột này"). */
  const suaDuocCot = (ma: MaVaiTroChuan) => CO_TICK_DUOC.some((c) => lyDoKhoaO(ma, c.khoa) === null);

  const baoKhoa = (lyDo: string) => toast.info("Ô này khoá", { description: lyDo });

  // ---------- Mẫu chưa đọc được / hỏng ----------
  if (p.mau === null) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          <TieuDeBang laDemo={p.laDemo} />
          {p.mauHong ? (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-xl border border-danger bg-danger-bg p-(--hp-md-card-pad) text-sm text-text-secondary"
            >
              <p className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger-soft" aria-hidden />
                <span>
                  <strong className="text-text-primary">Bảng mẫu quyền theo chức danh đang HỎNG</strong> — {p.mauHong}{" "}
                  Trong lúc này người không phải Quản trị chưa vào được app (không rơi về quyền rộng hơn).
                </span>
              </p>
              {laQuanTri && p.onVeMacDinhKhiHong ? (
                <div>
                  <Button variant="destructive" disabled={p.dangLuu} onClick={p.onVeMacDinhKhiHong}>
                    <RotateCcw aria-hidden />
                    Đưa cả bảng mẫu về mặc định gốc (cứu mẫu hỏng)
                  </Button>
                </div>
              ) : (
                <p className="text-xs">Chỉ tài khoản Quản trị cứu được bảng mẫu — nhờ Quản trị vào màn này.</p>
              )}
            </div>
          ) : (
            <p className="rounded-lg bg-muted px-4 py-3 text-sm text-text-secondary">
              {p.khoaVi ?? "Đang đọc bảng mẫu…"}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const mau = p.mau;
  const lyDoKhongLuu =
    p.khoaVi ??
    p.lyDoKhongLuu ??
    (p.dangLuu ? "Đang lưu…" : soONhap === 0 ? "Chưa đổi ô nào trong bảng mẫu." : null);

  return (
    <Card>
      <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
        <TieuDeBang laDemo={p.laDemo} />

        {/* ---- Sửa lần cuối + lịch sử ---- */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
          <span>
            {mau.phienBan === 0
              ? "Mẫu đang ở đúng mặc định gốc (chưa ai sửa)."
              : `Sửa lần cuối: ${mau.capNhatLuc ? formatDateTime(mau.capNhatLuc) : "—"}${
                  mau.capNhatBoiTen ? ` bởi ${mau.capNhatBoiTen}` : ""
                } · bản ${mau.phienBan}`}
          </span>
          {p.laDemo ? (
            <Button variant="link" size="xs" className="px-0" onClick={() => setMoLichSu(true)}>
              <History aria-hidden />
              Xem lịch sử demo ({p.lichSuDemo?.length ?? 0})
            </Button>
          ) : (
            <Link
              href="/nhat-ky-he-thong?loc=phan_quyen"
              className="inline-flex min-h-11 items-center gap-1 text-primary underline-offset-4 hover:underline md:min-h-0"
            >
              <History className="size-3.5" aria-hidden />
              Xem lịch sử (Nhật ký hệ thống)
            </Link>
          )}
        </div>

        {p.canhBaoMau.length > 0 && (
          <div
            role="note"
            className="flex items-start gap-2 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-xs text-text-secondary"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-soft" aria-hidden />
            <ul className="flex flex-col gap-0.5">
              {p.canhBaoMau.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {p.khoaVi && (
          <p className="rounded-lg bg-muted px-4 py-3 text-sm text-text-secondary">{p.khoaVi}</p>
        )}

        {/* ================= MÀN ≥ 768px — BẢNG 11 CỘT ================= */}
        <div className="thanh-keo-ngang-ro hidden overflow-x-auto md:block">
          <table className="w-full min-w-[68rem] border-collapse text-sm">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 min-w-[16rem] border-b border-border bg-card px-2 py-2 text-left align-bottom text-xs font-semibold tracking-wide text-text-desc uppercase"
                >
                  Quyền
                </th>
                {VAI_TRO_CHUAN.map((v) => (
                  <DauCot
                    key={v.ma}
                    v={v}
                    dem={p.demNguoi(v.ma)}
                    suaDuoc={suaDuocCot(v.ma)}
                    onXemNguoi={() => p.onXemNguoi(v.ma)}
                    onVeMacDinh={() => veMacDinh(v.ma)}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {NHOM_QUYEN_TICK.map((nhom) => (
                <NhomDong
                  key={nhom}
                  nhom={nhom}
                  giaTri={giaTri.cot}
                  nhap={p.nhap}
                  lyDoKhoaO={lyDoKhoaO}
                  doiO={doiO}
                  baoKhoa={baoKhoa}
                />
              ))}
              <tr>
                <th
                  scope="colgroup"
                  colSpan={VAI_TRO_CHUAN.length + 1}
                  className="bg-muted px-3 py-2 text-left text-xs font-semibold tracking-wide text-text-secondary uppercase"
                >
                  Theo cấp / luật cố định — chỉ để xem, không tick được
                </th>
              </tr>
              {DONG_GHI_CHU_MAU.map((g) => (
                <tr key={g.ma} className="border-b border-divider">
                  <th scope="row" className="sticky left-0 z-10 bg-card px-2 py-2 text-left align-top font-normal">
                    <span className="block text-sm font-medium text-text-primary">{g.nhan}</span>
                    <span className="block text-xs text-text-desc">{g.moTa}</span>
                  </th>
                  {VAI_TRO_CHUAN.map((v) => (
                    <td key={v.ma} className="relative px-1 py-2 text-center align-middle">
                      <ODongGhiChu gt={giaTriDongGhiChu(g.ma, v, giaTri.xemTruoc)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= MÀN < 768px — CARD LIST ================= */}
        <div className="flex flex-col gap-3 md:hidden">
          <label htmlFor="bang-mau-chon-cot" className="text-xs font-semibold text-text-secondary">
            Chức danh đang xem
          </label>
          <select
            id="bang-mau-chon-cot"
            value={cotDienThoai}
            onChange={(e) => setCotDienThoai(e.target.value as MaVaiTroChuan)}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-text-primary focus:border-primary focus:outline-none"
          >
            {VAI_TRO_CHUAN.map((v) => (
              <option key={v.ma} value={v.ma}>
                {v.ten}
              </option>
            ))}
          </select>
          <TheCot
            v={VAI_TRO_CHUAN.find((v) => v.ma === cotDienThoai) ?? VAI_TRO_CHUAN[0]}
            giaTri={giaTri.cot}
            xemTruoc={giaTri.xemTruoc}
            nhap={p.nhap}
            dem={p.demNguoi(cotDienThoai)}
            suaDuoc={suaDuocCot(cotDienThoai)}
            lyDoKhoaO={lyDoKhoaO}
            doiO={doiO}
            baoKhoa={baoKhoa}
            onXemNguoi={() => p.onXemNguoi(cotDienThoai)}
            onVeMacDinh={() => veMacDinh(cotDienThoai)}
          />
        </div>

        {/* ---- Chú giải: trạng thái luôn có CHỮ, không chỉ màu (V1.1) ---- */}
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary" aria-label="Chú giải bảng mẫu">
          <li className="flex items-center gap-1.5">
            <span className="inline-block size-4 rounded ring-2 ring-warning ring-inset" aria-hidden />
            Viền vàng = khác mặc định gốc (công thức trong mã)
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block size-4 rounded bg-primary-bg ring-1 ring-primary ring-inset" aria-hidden />
            Nền xanh = đã đổi, chưa lưu
          </li>
          <li className="flex items-center gap-1.5">
            <Lock className="size-3.5" aria-hidden />
            Ô khoá — bấm vào để xem lý do
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block size-4 rounded bg-muted opacity-60" aria-hidden />
            Ô mờ = chưa có tác dụng vì cột thiếu ô phụ thuộc
          </li>
        </ul>

        {/* ---- Luật bảng mẫu KHÔNG đổi được — để không ai tưởng tick ô là đổi được chúng ---- */}
        <div className="rounded-lg bg-muted px-4 py-3 text-xs text-text-secondary">
          <p className="mb-1 font-semibold text-text-primary">Bảng mẫu không đổi được những luật sau:</p>
          <ul className="flex list-disc flex-col gap-1 pl-4">
            {GHI_CHU_LUAT_CO_DINH.map((c) => (
              <li key={c}>{c}</li>
            ))}
            {/* Bổ sung đặc tả D-F3: nói rõ khác biệt chiều TẮT giữa bảng mẫu và khối tick từng người. */}
            <li>
              Ở bảng mẫu, ô của quyền <strong>bạn không có</strong> khoá <strong>cả bật lẫn tắt</strong>. Ở khối tick
              từng người phía trên thì chỉ khoá chiều <strong>bật</strong> (tắt bớt cho một người vẫn được).
            </li>
          </ul>
        </div>

        {/* ---- Thanh công cụ ----
            `pb-16`: chừa chỗ cho nút nổi "Góp ý" của App Tổng (`feedback-widget.js` nạp ở `app/layout.tsx`,
            cố định góc dưới phải). Thẻ này đứng cuối trang, nên cuộn hết trang là nút "Lưu mẫu" rơi đúng
            dưới widget — bấm Lưu lại mở hộp Góp ý (đo khi bấm thử 06/10/2026). */}
        <div className="flex flex-col gap-2 border-t border-divider pt-(--hp-md-card-gap) pb-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-secondary">
              {soONhap > 0 ? (
                <>
                  <strong className="text-text-primary">{soONhap}</strong> ô đã đổi, chưa lưu
                </>
              ) : (
                "Chưa có thay đổi nào ở bảng mẫu"
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                disabled={Boolean(p.khoaVi) || p.dangLuu}
                onClick={() => veMacDinh()}
                title="Đưa mọi ô bạn sửa được về mặc định gốc trong bản nháp — vẫn phải bấm Lưu mẫu"
              >
                <RotateCcw aria-hidden />
                Về mặc định gốc
              </Button>
              <Button variant="outline" disabled={soONhap === 0 || p.dangLuu} onClick={p.onHoanTac}>
                Hoàn tác
              </Button>
              <Button disabled={Boolean(lyDoKhongLuu)} onClick={p.onLuu}>
                {p.dangLuu ? "Đang lưu…" : `Lưu mẫu${soONhap > 0 ? ` (${soONhap} ô)` : ""}`}
              </Button>
            </div>
          </div>
          {/* Nút mờ PHẢI kèm lý do — trừ lý do hiển nhiên "chưa đổi ô nào". */}
          {lyDoKhongLuu && soONhap > 0 && <p className="text-xs text-warning-soft">{lyDoKhongLuu}</p>}
        </div>
      </CardContent>

      {/* Lịch sử demo — chỉ bản demo; bản thật xem ở Nhật ký hệ thống. 🔴 KHÔNG bọc bằng `{moLichSu && …}`
          (hộp bị tháo giữa lúc đóng là cả app kẹt — sự cố 13 và 14/09/2026). */}
      {p.laDemo && (
        <Dialog open={moLichSu} onOpenChange={(v: boolean) => setMoLichSu(v)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Lịch sử phân quyền (bản demo)</DialogTitle>
              <DialogDescription>
                Chỉ lưu trên trình duyệt này, tối đa 50 dòng mới nhất. Bản thật ghi vào Nhật ký hệ thống.
              </DialogDescription>
            </DialogHeader>
            {(p.lichSuDemo?.length ?? 0) === 0 ? (
              <p className="text-sm text-text-desc">Chưa có lần lưu nào.</p>
            ) : (
              <ol className="thanh-cuon-doc-ro flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
                {(p.lichSuDemo ?? []).map((d, i) => (
                  <li key={`${d.luc}-${i}`} className="rounded-lg border border-divider p-3 text-sm">
                    <p className="text-xs text-text-desc">
                      {formatDateTime(d.luc)} · {d.ten} · <span className="font-mono">{d.hanhDong}</span>
                    </p>
                    <p className="text-text-primary">{d.moTa}</p>
                  </li>
                ))}
              </ol>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

function TieuDeBang({ laDemo }: { laDemo: boolean }) {
  return (
    <div>
      <p className="text-h3 text-text-primary">Mẫu quyền theo chức danh</p>
      <p className="text-sm text-text-secondary">
        Bấm thẳng vào ô để đổi mặc định cho <strong>cả chức danh</strong> (Sếp 06/10/2026). Người chưa được tick
        riêng đi theo mẫu này; người có quyền riêng chỉ giữ những ô đã cố ý khác, các ô còn lại theo mẫu.{" "}
        <strong>
          Mẫu và quyền riêng có hiệu lực khi người đó tải lại trang hoặc quay lại tab
          {laDemo ? " (bản demo: áp ngay cho tài khoản mẫu trên trình duyệt này)" : ""}.
        </strong>
      </p>
    </div>
  );
}

/** Đầu một cột: tên chức danh, khoá, số người (bấm để lọc) và menu "Về mặc định gốc cột này". */
function DauCot({
  v,
  dem,
  suaDuoc,
  onXemNguoi,
  onVeMacDinh,
}: {
  v: VaiTroChuan;
  dem: { soNguoi: number; soCoRieng: number };
  suaDuoc: boolean;
  onXemNguoi: () => void;
  onVeMacDinh: () => void;
}) {
  const khoaCot = COT_KHOA_MAU.includes(v.ma);
  return (
    <th scope="col" className="min-w-24 border-b border-border px-1 py-2 align-bottom text-xs font-semibold text-text-secondary">
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="leading-snug text-text-primary">{v.ten}</span>
        {khoaCot ? (
          <span className="inline-flex items-center gap-1 font-normal text-text-desc">
            <Lock className="size-3" aria-hidden />
            khoá
          </span>
        ) : !suaDuoc ? (
          <span className="font-normal text-text-desc">chỉ xem</span>
        ) : null}
        <button
          type="button"
          onClick={onXemNguoi}
          title="Lọc khối Nhân sự theo chức danh này"
          className="min-h-11 rounded px-1 font-normal text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none md:min-h-8"
        >
          {dem.soNguoi} người · {dem.soCoRieng} có quyền riêng
        </button>
        {suaDuoc && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-xs" aria-label={`Tuỳ chọn cột ${v.ten}`} />}
            >
              <MoreHorizontal aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-auto min-w-56">
              <DropdownMenuItem onClick={onVeMacDinh}>Về mặc định gốc cột này</DropdownMenuItem>
              <DropdownMenuItem onClick={onXemNguoi}>Xem người thuộc chức danh này</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </th>
  );
}

type HamKhoa = (ma: MaVaiTroChuan, k: keyof Quyen) => string | null;
type HamDoi = (ma: MaVaiTroChuan, k: keyof Quyen, bat: boolean) => void;

/** Trạng thái một ô — dùng chung cho bảng và Card List để hai nơi nói y một chuyện. */
function trangThaiO(
  v: VaiTroChuan,
  c: CoTickDuoc,
  giaTri: Record<MaVaiTroChuan, GiaTriCot>,
  nhap: ThayDoiMau,
  lyDoKhoaO: HamKhoa,
) {
  const g = giaTri[v.ma];
  const gt = g.hien[c.khoa];
  const pt = phuThuocCuaO(c.khoa);
  return {
    gt,
    khacGoc: gt !== g.goc[c.khoa],
    daDoi: Object.prototype.hasOwnProperty.call(nhap[v.ma] ?? {}, c.khoa),
    lyDo: lyDoKhoaO(v.ma, c.khoa),
    /* Ô phụ thuộc (B-F10/D-F5): cột thiếu ô cần thì ô này chưa có tác dụng. */
    chuaTacDung: pt && !g.hien[pt.can] ? pt.cau : null,
  };
}

/** Một nhóm dòng (Được xem / Được làm / Quản trị) của bảng ≥ 768px. */
function NhomDong({
  nhom,
  giaTri,
  nhap,
  lyDoKhoaO,
  doiO,
  baoKhoa,
}: {
  nhom: string;
  giaTri: Record<MaVaiTroChuan, GiaTriCot>;
  nhap: ThayDoiMau;
  lyDoKhoaO: HamKhoa;
  doiO: HamDoi;
  baoKhoa: (lyDo: string) => void;
}) {
  const ds = CO_TICK_DUOC.filter((c) => c.nhom === nhom);
  return (
    <>
      <tr>
        <th
          scope="colgroup"
          colSpan={VAI_TRO_CHUAN.length + 1}
          className="bg-primary-bg px-3 py-2 text-left text-xs font-semibold tracking-wide text-primary uppercase"
        >
          {nhom}
        </th>
      </tr>
      {ds.map((c) => (
        <tr key={c.khoa} className="border-b border-divider">
          <th scope="row" className="sticky left-0 z-10 bg-card px-2 py-1.5 text-left align-top font-normal">
            <span className="block text-sm font-medium text-text-primary">{c.nhan}</span>
            <span className="line-clamp-2 block text-xs text-text-desc" title={c.moTa}>
              {c.moTa}
            </span>
          </th>
          {VAI_TRO_CHUAN.map((v) => {
            const o = trangThaiO(v, c, giaTri, nhap, lyDoKhoaO);
            const chuAn = `${c.nhan} — ${v.ten}: ${o.gt ? "Được" : "Không"}${o.khacGoc ? ", khác mặc định gốc" : ""}${
              o.daDoi ? ", đã đổi, chưa lưu" : ""
            }${o.chuaTacDung ? `, chưa có tác dụng (${o.chuaTacDung})` : ""}`;
            /* `relative` ở MỌI ô có chữ `sr-only` — không có thì chữ ẩn bám khung gốc, thoát khỏi khung cuộn
               ngang và kéo giãn cả trang (CLAUDE.md §5). */
            const nen = `${o.khacGoc ? "ring-2 ring-warning ring-inset" : ""} ${o.daDoi ? "bg-primary-bg" : ""} ${
              o.chuaTacDung ? "opacity-60" : ""
            }`;
            const lyDo = o.lyDo;
            return (
              <td key={v.ma} className="relative p-0.5 text-center align-middle">
                {lyDo ? (
                  <button
                    type="button"
                    aria-disabled="true"
                    title={lyDo}
                    onClick={() => baoKhoa(lyDo)}
                    className={`relative mx-auto flex min-h-11 w-full min-w-11 items-center justify-center gap-0.5 rounded-md text-text-desc ${nen}`}
                  >
                    {o.gt ? (
                      <Check className="size-4 text-success" aria-hidden />
                    ) : (
                      <Minus className="size-4" aria-hidden />
                    )}
                    <Lock className="size-3" aria-hidden />
                    <span className="sr-only">{`${chuAn}, khoá. ${lyDo}`}</span>
                  </button>
                ) : (
                  <label
                    title={o.chuaTacDung ? `Chưa có tác dụng ở cột này: ${o.chuaTacDung}` : o.khacGoc ? "Khác mặc định gốc" : undefined}
                    className={`relative mx-auto flex min-h-11 w-full min-w-11 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-muted ${nen}`}
                  >
                    <OTich giaTri={o.gt} onDoi={(b) => doiO(v.ma, c.khoa, b)} ariaLabel={chuAn} />
                  </label>
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

/** Giá trị một dòng ghi chú (G1/G2) — có CẢ dấu lẫn chữ. */
function ODongGhiChu({ gt }: { gt: "duoc" | "khi-duoc-chia-viec" | "khong" }) {
  if (gt === "duoc") {
    return (
      <>
        <Check className="mx-auto size-4 text-success" aria-hidden />
        <span className="sr-only">Được</span>
      </>
    );
  }
  if (gt === "khi-duoc-chia-viec") return <span className="text-xs text-text-secondary">khi được chia việc</span>;
  return (
    <>
      <Minus className="mx-auto size-4 text-text-desc" aria-hidden />
      <span className="sr-only">Không</span>
    </>
  );
}

/** Card List của MỘT chức danh — màn < 768px. */
function TheCot({
  v,
  giaTri,
  xemTruoc,
  nhap,
  dem,
  suaDuoc,
  lyDoKhoaO,
  doiO,
  baoKhoa,
  onXemNguoi,
  onVeMacDinh,
}: {
  v: VaiTroChuan;
  giaTri: Record<MaVaiTroChuan, GiaTriCot>;
  xemTruoc: MauChucDanh;
  nhap: ThayDoiMau;
  dem: { soNguoi: number; soCoRieng: number };
  suaDuoc: boolean;
  lyDoKhoaO: HamKhoa;
  doiO: HamDoi;
  baoKhoa: (lyDo: string) => void;
  onXemNguoi: () => void;
  onVeMacDinh: () => void;
}) {
  const khoaCot = COT_KHOA_MAU.includes(v.ma);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
        {khoaCot && <StatusBadge label="Cột khoá" tone="neutral" />}
        {!khoaCot && !suaDuoc && <StatusBadge label="Chỉ xem" tone="neutral" />}
        <Button variant="link" size="xs" className="px-0" onClick={onXemNguoi}>
          {dem.soNguoi} người · {dem.soCoRieng} có quyền riêng
        </Button>
        {suaDuoc && (
          <Button variant="outline" size="xs" onClick={onVeMacDinh}>
            <RotateCcw aria-hidden />
            Về mặc định gốc cột này
          </Button>
        )}
      </div>
      {NHOM_QUYEN_TICK.map((nhom) => (
        <section key={nhom} className="flex flex-col gap-1">
          <h4 className="rounded-lg bg-primary-bg px-3 py-2 text-xs font-semibold tracking-wide text-primary uppercase">
            {nhom}
          </h4>
          <ul className="flex flex-col">
            {CO_TICK_DUOC.filter((c) => c.nhom === nhom).map((c) => {
              const o = trangThaiO(v, c, giaTri, nhap, lyDoKhoaO);
              const nen = `${o.khacGoc ? "ring-2 ring-warning ring-inset" : ""} ${o.daDoi ? "bg-primary-bg" : ""} ${
                o.chuaTacDung ? "opacity-60" : ""
              }`;
              const chu = (
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-text-primary">
                    {c.nhan}
                    <span className="text-xs font-normal text-text-desc">{o.gt ? "· Được" : "· Không"}</span>
                    {o.khacGoc && <StatusBadge label="khác mặc định gốc" tone="warning" />}
                    {o.daDoi && <StatusBadge label="đã đổi, chưa lưu" tone="primary" />}
                    {o.lyDo && <StatusBadge label="khoá" tone="neutral" />}
                  </span>
                  <span className="block text-xs text-text-desc">{c.moTa}</span>
                  {o.chuaTacDung && <span className="block text-xs text-warning-soft">Chưa có tác dụng: {o.chuaTacDung}</span>}
                  {o.lyDo && <span className="block text-xs text-text-desc">{o.lyDo}</span>}
                </span>
              );
              const lyDo = o.lyDo;
              return (
                <li key={c.khoa} className="border-b border-divider">
                  {lyDo ? (
                    <button
                      type="button"
                      aria-disabled="true"
                      onClick={() => baoKhoa(lyDo)}
                      className={`flex min-h-11 w-full items-start gap-3 rounded-lg p-2 text-left ${nen}`}
                    >
                      <Lock className="mt-0.5 size-4 shrink-0 text-text-desc" aria-hidden />
                      {chu}
                    </button>
                  ) : (
                    <label className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg p-2 ${nen}`}>
                      <OTich
                        giaTri={o.gt}
                        onDoi={(b) => doiO(v.ma, c.khoa, b)}
                        ariaLabel={`${c.nhan} — ${v.ten}`}
                        className="mt-0.5"
                      />
                      {chu}
                    </label>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <section className="flex flex-col gap-1">
        <h4 className="rounded-lg bg-muted px-3 py-2 text-xs font-semibold tracking-wide text-text-secondary uppercase">
          Theo cấp / luật cố định — chỉ để xem
        </h4>
        <ul className="flex flex-col">
          {DONG_GHI_CHU_MAU.map((g) => {
            const gt = giaTriDongGhiChu(g.ma, v, xemTruoc);
            return (
              <li key={g.ma} className="flex min-h-11 flex-col gap-0.5 border-b border-divider p-2">
                <span className="text-sm font-medium text-text-primary">
                  {g.nhan}{" "}
                  <span className="text-xs font-normal text-text-desc">
                    · {gt === "duoc" ? "Được" : gt === "khi-duoc-chia-viec" ? "Khi được chia việc" : "Không"}
                  </span>
                </span>
                <span className="text-xs text-text-desc">{g.moTa}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
