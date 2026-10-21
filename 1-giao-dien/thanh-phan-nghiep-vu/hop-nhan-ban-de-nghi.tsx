"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Copy, Lock, PackageOpen, UserPlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { formatNumber } from "@/6-tien-ich/dinh-dang";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { danhGiaDongNhanBan, lamTronKhoiLuong } from "@/2-quy-trinh/nhan-ban-de-nghi";
import {
  apDungNhanBanChiaCot,
  cacPhieuGiuDong,
  laDongTheoFile,
  type CotNhanBan,
  type NguoiNhanNhanBan,
  type ThamSoNhanBanChiaCot,
} from "@/2-quy-trinh/nhan-ban-chia-cot";
import {
  congViecChuaXongCuaBuoc,
  vuongMacViecBuoc1ChuaXong,
  xacDinhGiaiDoan,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { useNguoiKhongVaoApp } from "@/4-phan-quyen/dung-nguoi-khong-vao-app";
import { duocTichCongViec } from "@/4-phan-quyen/quyen-theo-ho-so";
import type { DeNghiMuaHang, LoaiViecGiao } from "@/3-du-lieu/kieu-du-lieu";

/** Đọc số người dùng gõ — chấp nhận dấu phẩy thập phân kiểu Việt. Trống = 0. */
function docSo(s: string): number {
  const t = s.trim().replace(",", ".");
  if (t === "") return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : Number.NaN;
}

/** Ô của một dòng ở một cột: dòng theo file (tick + phần việc) hoặc dòng số lượng. */
interface OFile {
  lam: boolean;
  pv: string;
}
type CachChia = "file" | "so";

/** Chức năng tài khoản → loại việc khi nhận (y `LOAI_VIEC_THEO_CHUC_NANG` ở bảng phân bổ). */
const LOAI_THEO_CHUC_NANG: Record<string, LoaiViecGiao | undefined> = {
  nhan_vien_thu_mua: undefined,
  thu_kho_cong_trinh: "xuat_kho",
  nhan_vien_kho_tong: "xuat_kho",
  nhan_vien_nhan_su: "nhan_su",
};
const HAU_TO: Record<string, string> = {
  nhan_vien_thu_mua: "",
  thu_kho_cong_trinh: " (thủ kho · xuất kho)",
  nhan_vien_kho_tong: " (NV Kho Tổng · xuất kho)",
  nhan_vien_nhan_su: " (NV Nhân sự · XK VPP)",
};
const LOP_CHON =
  "min-h-11 w-full rounded-lg border border-border bg-card px-2 text-sm text-text-primary transition-colors hover:border-primary focus:border-primary focus:outline-none md:min-h-9";

/**
 * ★★★ HỘP NHÂN BẢN CHIA CỘT — Sếp duyệt 19–20/10/2026 (demo "Nhân bản + giao việc" bản 14), thay hộp
 * "tích dòng + khối lượng" 26/09.
 *
 * · Chép ĐỦ mặt hàng. Mỗi CỘT là 1 phiếu: "Phiếu này" (tự giữ phần còn lại) + "Bản mới 1..N".
 * · Dòng số lượng: nhập phần lấy sang từng bản mới — TRỪ khỏi phiếu này.
 * · Dòng theo file: tick cột nào làm + ghi phần việc — CHIA CHUNG, không trừ phiếu này.
 * · Mỗi dòng có khung "Đã tách" (Sếp 19/10): mọi phiếu trong nhóm đang giữ dòng đó, bao nhiêu, ai làm.
 * · Bước ① + Trưởng bộ phận: chọn người từng cột → giao luôn. Bước ②: nút "Nhân bản" (giữ cho người
 *   đang làm) · "Mua hàng" (giao bạn khác) · "Xuất kho" → XK VPP / XK Kho Tổng (Sếp 20/10/2026).
 * · Phiếu đã giao mà chưa checkin → ô vàng tích ngay trong hộp (Sếp 20/10/2026), tích xong mới làm tiếp.
 *
 * 📌 Nút xác nhận khóa kèm ĐÚNG câu tầng ghi sẽ trả: hộp chạy thử `apDungNhanBanChiaCot` trên dữ liệu
 * đang có (cùng hàm tầng ghi gọi), nên không bao giờ cho bấm một thứ tầng ghi sẽ chặn.
 */
export function HopNhanBanDeNghi({
  deNghi,
  mo,
  onDong,
  onXacNhan,
}: {
  deNghi: DeNghiMuaHang | null;
  mo: boolean;
  onDong: () => void;
  /** Trả câu lỗi (hộp giữ nguyên để sửa) hoặc `null` (đã tạo, đóng hộp). */
  onXacNhan: (luaChon: Pick<ThamSoNhanBanChiaCot, "cot" | "giuLai">, cach: "giu" | "mua" | "xk") => string | null;
}) {
  const { deNghi: dsDeNghi, baoGia, donHang, phieuNhan, cauHinh, danhDauCongViecGiaiDoan } = useDuLieu();
  const { nguoiDung, quyen, danhSachTaiKhoan } = useNguoiDung();
  const { khongVaoApp } = useNguoiKhongVaoApp(quyen.phanBoCongViec);

  const [soBan, setSoBan] = useState(1);
  /** stt → ô từng cột (cột 0 = Phiếu này). Dòng số lượng: chuỗi số; dòng file: {lam, pv}. */
  const [oFile, setOFile] = useState<Map<number, OFile[]>>(new Map());
  const [oSo, setOSo] = useState<Map<number, string[]>>(new Map());
  const [cachChia, setCachChia] = useState<Map<number, CachChia>>(new Map());
  const [nguoiCot, setNguoiCot] = useState<string[]>([""]);
  const [cheDoGiao, setCheDoGiao] = useState<null | "mua" | "xk">(null);
  const [nguoiMua, setNguoiMua] = useState("");
  const [nguonXK, setNguonXK] = useState<"vpp" | "kho_tong">("vpp");
  const [nguoiXK, setNguoiXK] = useState("");
  const [loiGui, setLoiGui] = useState<string | null>(null);

  const danhGia = useMemo(
    () =>
      deNghi
        ? danhGiaDongNhanBan(deNghi, dsDeNghi, nguoiDung.uid, quyen.phanBoCongViec, baoGia, donHang)
        : [],
    [deNghi, dsDeNghi, nguoiDung.uid, quyen.phanBoCongViec, baoGia, donHang],
  );

  /* Mở hộp cho phiếu nào thì dựng lại lựa chọn (theo `deNghi?.id`, không theo đối tượng — xem chú
     thích cũ: đối tượng dựng lại mỗi lần kho đổi, bám vào nó là lựa chọn bị xoá giữa chừng). */
  useEffect(() => {
    if (!mo || !deNghi) return;
    const f = new Map<number, OFile[]>();
    const so = new Map<number, string[]>();
    const cach = new Map<number, CachChia>();
    for (const d of deNghi.items) {
      cach.set(d.stt, laDongTheoFile(d) ? "file" : "so");
      f.set(d.stt, [{ lam: true, pv: d.phanViec ?? "" }, { lam: false, pv: "" }]);
      so.set(d.stt, ["", ""]);
    }
    setSoBan(1);
    setOFile(f);
    setOSo(so);
    setCachChia(cach);
    setNguoiCot(["", ""]);
    setCheDoGiao(null);
    setLoiGui(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mo, deNghi?.id]);

  const buoc = deNghi ? xacDinhGiaiDoan(deNghi, donHang, baoGia, phieuNhan, dsDeNghi) : "tiep_nhan";
  /** Bước ① + Trưởng bộ phận: chọn người từng cột (giao luôn). */
  const chonNguoi = quyen.phanBoCongViec && buoc === "tiep_nhan";
  /** Phiếu đã giao việc mà việc bắt buộc bước ① còn treo — phải tích trước khi tách tiếp. */
  const chanCheckin = deNghi && buoc !== "tiep_nhan" ? vuongMacViecBuoc1ChuaXong(deNghi, cauHinh) : null;

  const taiKhoan = useMemo(
    () =>
      danhSachTaiKhoan
        .filter((n) => n.chucNang in LOAI_THEO_CHUC_NANG && !khongVaoApp.has(n.uid))
        .map((n) => ({ uid: n.uid, ten: n.tenHienThi, chucNang: n.chucNang as string }))
        .sort((a, b) => (a.chucNang === "nhan_vien_thu_mua" ? 0 : 1) - (b.chucNang === "nhan_vien_thu_mua" ? 0 : 1)),
    [danhSachTaiKhoan, khongVaoApp],
  );
  const nguoiNhan = (uid: string): NguoiNhanNhanBan | undefined => {
    const t = taiKhoan.find((x) => x.uid === uid);
    return t ? { uid: t.uid, ten: t.ten, loaiViecGiao: LOAI_THEO_CHUC_NANG[t.chucNang] } : undefined;
  };
  const dsMua = taiKhoan.filter((x) => x.chucNang === "nhan_vien_thu_mua" && x.uid !== nguoiDung.uid);
  const dsVPP = taiKhoan.filter((x) => x.chucNang === "nhan_vien_nhan_su");
  const dsKhoTong = taiKhoan.filter((x) => x.chucNang === "nhan_vien_kho_tong");

  const soCot = soBan + 1;
  const dgTheoStt = new Map(danhGia.map((x) => [x.stt, x]));
  const dongLam = deNghi ? deNghi.items.filter((d) => dgTheoStt.get(d.stt)?.duoc) : [];

  /** Dựng gói gửi tầng ghi từ ô đang nhập. Cách giao: `giu` / theo cột / mua / xk. */
  function dungLuaChon(giaoTatCa?: NguoiNhanNhanBan): Pick<ThamSoNhanBanChiaCot, "cot" | "giuLai"> {
    const cot: CotNhanBan[] = [];
    /* Dòng file mà "Phiếu này" không làm: bản mới ĐẦU TIÊN tick nhận cả dòng, các bản sau chia chung. */
    const daNhanCaDong = new Set<number>();
    for (let c = 1; c < soCot; c++) {
      const chon: CotNhanBan["chon"] = [];
      for (const d of dongLam) {
        const dg = dgTheoStt.get(d.stt);
        if (!dg) continue;
        if (cachChia.get(d.stt) === "file") {
          const o = oFile.get(d.stt) ?? [];
          if (!o[c]?.lam) continue;
          if (o[0]?.lam || daNhanCaDong.has(d.stt)) {
            chon.push({ stt: d.stt, khoiLuongTuCha: 0, chia: true, phanViec: o[c].pv });
          } else {
            daNhanCaDong.add(d.stt);
            chon.push({ stt: d.stt, khoiLuongTuCha: dg.conLai, phanViec: o[c].pv });
          }
        } else {
          const v = docSo(oSo.get(d.stt)?.[c] ?? "");
          if (v > 0 || Number.isNaN(v)) chon.push({ stt: d.stt, khoiLuongTuCha: v });
        }
      }
      const giaoCho = giaoTatCa ?? (chonNguoi ? nguoiNhan(nguoiCot[c] ?? "") : undefined);
      cot.push({ chon, ...(giaoCho ? { giaoCho } : {}) });
    }
    const phanViec: Record<number, string> = {};
    for (const d of dongLam) {
      if (cachChia.get(d.stt) !== "file") continue;
      const o0 = oFile.get(d.stt)?.[0];
      if (o0?.lam && o0.pv.trim() !== (d.phanViec ?? "").trim()) phanViec[d.stt] = o0.pv;
    }
    const giaoGoc = chonNguoi ? nguoiNhan(nguoiCot[0] ?? "") : undefined;
    return { cot, giuLai: { phanViec, ...(giaoGoc ? { giaoCho: giaoGoc } : {}) } };
  }

  /* Kiểm phía hộp — câu dễ hiểu hơn câu tầng ghi cho các lỗi nhập liệu thường gặp. */
  const loiNhap = ((): string | null => {
    if (!deNghi) return null;
    if (dongLam.length === 0) return "Phiếu này không còn dòng nào bạn nhân bản được — xem lý do cạnh từng dòng.";
    for (const d of dongLam) {
      const dg = dgTheoStt.get(d.stt);
      if (!dg) continue;
      if (cachChia.get(d.stt) === "file") {
        const o = oFile.get(d.stt) ?? [];
        if (!o.slice(0, soCot).some((x) => x.lam)) return `Dòng ${d.stt} (${d.tenVatLieu}): tick ít nhất 1 cột làm dòng này.`;
      } else {
        let tong = 0;
        for (let c = 1; c < soCot; c++) {
          const v = docSo(oSo.get(d.stt)?.[c] ?? "");
          if (!Number.isFinite(v) || v < 0) return `Dòng ${d.stt}, Bản mới ${c}: số lượng không hợp lệ.`;
          tong += v;
        }
        if (tong > dg.conLai + 1e-9) {
          return `Dòng ${d.stt} (${d.tenVatLieu}): các bản mới lấy ${formatNumber(lamTronKhoiLuong(tong))} — nhiều hơn phần còn ${formatNumber(dg.conLai)} ${d.donViTinh}.`;
        }
      }
    }
    const lc = dungLuaChon();
    for (let c = 0; c < lc.cot.length; c++) {
      if (lc.cot[c].chon.length === 0) return `Bản mới ${c + 1} chưa có mặt hàng nào — nhập số lượng hoặc tick dòng theo file, hoặc bấm ✕ bỏ cột.`;
    }
    if (chonNguoi) {
      /* Chọn người là KHÔNG bắt buộc — cột trống người thì phiếu đó nằm lại bước ① chờ giao. */
    }
    return null;
  })();

  /* Chạy thử đúng hàm tầng ghi — câu lỗi hiện ở đây là câu tầng ghi sẽ trả; kèm mã các bản mới. */
  const thu = useMemo(() => {
    if (!deNghi || loiNhap) return null;
    const lc = dungLuaChon();
    return apDungNhanBanChiaCot(dsDeNghi, {
      prId: deNghi.id,
      nguoi: { uid: nguoiDung.uid, ten: nguoiDung.tenHienThi },
      laNguoiPhanBo: quyen.phanBoCongViec,
      ...lc,
      idMoi: lc.cot.map((_, i) => `__thu__${i}`),
      ngay: "2000-01-01",
      thoiDiem: "2000-01-01T00:00:00Z",
      baoGia,
      donHang,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deNghi, dsDeNghi, loiNhap, oFile, oSo, cachChia, soBan, nguoiCot, nguoiDung.uid, quyen.phanBoCongViec, baoGia, donHang]);

  if (!deNghi) return null;
  const loiThu = loiNhap ?? (thu && thu.loi !== undefined ? thu.loi : null);
  const maMoi = thu && thu.loi === undefined ? thu.cacBan.map((b) => b.code) : [];
  const khoa = Boolean(loiThu) || Boolean(chanCheckin);

  function doiFile(stt: number, c: number, sua: Partial<OFile>) {
    setLoiGui(null);
    setOFile((truoc) => {
      const m = new Map(truoc);
      const ds = [...(m.get(stt) ?? [])];
      ds[c] = { ...(ds[c] ?? { lam: false, pv: "" }), ...sua };
      m.set(stt, ds);
      return m;
    });
  }
  function doiSo(stt: number, c: number, gt: string) {
    setLoiGui(null);
    setOSo((truoc) => {
      const m = new Map(truoc);
      const ds = [...(m.get(stt) ?? [])];
      ds[c] = gt;
      m.set(stt, ds);
      return m;
    });
  }
  function themBan() {
    setLoiGui(null);
    setSoBan((n) => Math.min(6, n + 1));
    setNguoiCot((x) => [...x, ""]);
  }
  function boBan(c: number) {
    setLoiGui(null);
    setSoBan((n) => Math.max(1, n - 1));
    setNguoiCot((x) => x.filter((_, i) => i !== c));
    setOFile((truoc) => new Map([...truoc].map(([k, v]) => [k, v.filter((_, i) => i !== c)])));
    setOSo((truoc) => new Map([...truoc].map(([k, v]) => [k, v.filter((_, i) => i !== c)])));
  }
  function tichCheckin() {
    if (!deNghi) return;
    for (const cv of congViecChuaXongCuaBuoc(deNghi, "tiep_nhan", cauHinh)) {
      const loi = danhDauCongViecGiaiDoan(deNghi.id, cv, "tiep_nhan", true, nguoiDung.tenHienThi);
      if (loi) {
        setLoiGui(loi);
        return;
      }
    }
  }
  function gui(cach: "giu" | "mua" | "xk") {
    let giao: NguoiNhanNhanBan | undefined;
    if (cach === "mua") {
      giao = nguoiNhan(nguoiMua);
      if (!giao) return setLoiGui("Chọn người nhận phần mua hàng.");
    }
    if (cach === "xk") {
      giao = nguoiNhan(nguoiXK);
      if (!giao) return setLoiGui(nguonXK === "vpp" ? "Chọn nhân viên nhận XK VPP." : "Chọn nhân viên nhận XK Kho Tổng.");
    }
    const loi = onXacNhan(dungLuaChon(giao), cach);
    if (loi) setLoiGui(loi);
    else onDong();
  }

  const nguoiGiuHienTai = [...new Set(dongLam.map((d) => d.nguoiPhuTrachTen).filter(Boolean))].join(", ");

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      {/* 🔴 `sm:max-w-…` chứ không `max-w-…` trơn — lớp gốc có `sm:max-w-sm` (CLAUDE.md §5).
          Sếp 19/10/2026: *"cửa sổ popup to lên lên tý"*. */}
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[min(1240px,calc(100%-2rem))]">
        <DialogHeader>
          <DialogTitle>Nhân bản đề nghị {deNghi.code}</DialogTitle>
          <DialogDescription>
            Chép đủ mặt hàng. Mỗi <strong>cột là 1 phiếu</strong>: cột <strong>Phiếu này</strong> tự giữ phần
            còn lại, các cột bản mới nhập số lượng lấy sang (trừ khỏi phiếu này). Dòng <strong>theo file</strong>:
            tick cột nào làm và ghi phần việc.{" "}
            {chonNguoi ? (
              <>
                Chọn <strong>người phụ trách</strong> cho từng cột — nhân bản xong là việc được giao luôn; để
                trống thì phiếu đó nằm lại bước Tiếp nhận, giao sau bằng ô tích.
              </>
            ) : (
              <>
                <strong>Nhân bản</strong> = bản mới vẫn của người đang làm · <strong>Mua hàng</strong> = giao bản
                mới cho bạn khác · <strong>Xuất kho</strong> = XK VPP hoặc XK Kho Tổng (bỏ qua báo giá).
                {!quyen.phanBoCongViec && " Bạn chỉ chia được dòng của mình."}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          <span className="text-text-desc">Bản mới sẽ tạo: </span>
          <span className="font-semibold text-text-primary">{maMoi.length > 0 ? maMoi.join(", ") : `${soBan} bản`}</span>
          <span className="block text-xs text-text-desc">
            Đều là con của {deNghi.code} — hiện trong khối &quot;Đã tách thành … đề xuất con&quot;. Không chép tệp đính
            kèm (xem ở phiếu gốc).
          </span>
        </p>

        {chanCheckin && (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-warning/40 bg-warning-bg p-3 text-sm text-warning-soft">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-primary"
              checked={false}
              disabled={!duocTichCongViec(quyen)}
              onChange={tichCheckin}
            />
            <span>
              <strong>Tích Checkin hàng tồn kho</strong> — lúc giao việc chưa tích nên phải tích trước khi tách
              tiếp. {chanCheckin}
            </span>
          </label>
        )}

        <div className="min-w-0 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 min-w-[200px] border-b border-divider bg-card p-2.5 text-left font-medium md:min-w-[240px]">
                  Mặt hàng
                </th>
                {Array.from({ length: soCot }, (_, c) => (
                  <th key={c} className="sticky top-0 z-10 min-w-[180px] border-b border-divider bg-card p-2.5 text-left align-top">
                    <div className="flex flex-col gap-1.5">
                      <span className="flex items-center justify-between gap-1 font-semibold">
                        {c === 0 ? "Phiếu này" : `Bản mới ${c}`}
                        {c > 0 && (
                          <button
                            type="button"
                            onClick={() => boBan(c)}
                            className="flex size-7 items-center justify-center rounded-md text-text-desc hover:bg-danger-bg hover:text-danger"
                            aria-label={`Bỏ Bản mới ${c}`}
                          >
                            <X className="size-4" aria-hidden />
                          </button>
                        )}
                      </span>
                      {chonNguoi ? (
                        <select
                          aria-label={`Người phụ trách ${c === 0 ? "phiếu này" : `Bản mới ${c}`}`}
                          className={LOP_CHON}
                          value={nguoiCot[c] ?? ""}
                          onChange={(e) =>
                            setNguoiCot((x) => {
                              const m = [...x];
                              m[c] = e.target.value;
                              return m;
                            })
                          }
                        >
                          <option value="">— Giao cho —</option>
                          {taiKhoan.map((t) => (
                            <option key={t.uid} value={t.uid}>
                              {t.ten}
                              {HAU_TO[t.chucNang] ?? ""}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-normal text-text-desc">
                          {c === 0 ? `Giữ: ${nguoiGiuHienTai || "—"}` : "Theo nút bấm bên dưới"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="sticky top-0 z-10 border-b border-divider bg-card p-2.5 align-middle">
                  {soBan < 6 && (
                    <Button variant="outline" className="min-h-11 whitespace-nowrap md:min-h-9" onClick={themBan}>
                      + Thêm bản
                    </Button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {deNghi.items.map((d) => {
                const dg = dgTheoStt.get(d.stt);
                const giu = cacPhieuGiuDong(deNghi, d.stt, dsDeNghi);
                const ten = (
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className={`font-medium ${dg?.duoc ? "text-text-primary" : "text-text-disabled"}`}>
                      {d.stt}. {d.tenVatLieu}
                    </span>
                    <span className="text-xs text-text-desc">
                      {d.quyCach ? `${d.quyCach} · ` : ""}
                      {formatNumber(Number(d.khoiLuongDeNghi) || 0)} {d.donViTinh}
                      {d.nguoiPhuTrachTen ? ` · đang giao ${d.nguoiPhuTrachTen}` : " · chưa giao ai"}
                    </span>
                    {giu.length > 0 && (
                      <span className="mt-1 flex flex-col gap-0.5 rounded-md border border-primary/30 bg-primary-bg px-2 py-1 text-xs text-text-secondary">
                        <span className="font-semibold text-primary">Đã tách</span>
                        {giu.map((g) => (
                          <span key={g.prId} className={g.prId === deNghi.id ? "font-semibold text-text-primary" : ""}>
                            {g.laPhieuGoc ? "Phiếu gốc" : g.code.slice(g.code.indexOf("("))}:{" "}
                            {g.phanViec ? `mục ${g.phanViec.replace(/^mục\s*/i, "")}` : `${formatNumber(g.khoiLuong)} ${g.donViTinh}`}
                            {g.nguoiPhuTrachTen ? ` · ${g.nguoiPhuTrachTen}` : " · chưa giao"}
                            {g.prId === deNghi.id ? " (phiếu này)" : ""}
                          </span>
                        ))}
                      </span>
                    )}
                    {dg?.duoc && (
                      <button
                        type="button"
                        className="w-fit text-xs text-primary underline-offset-2 hover:underline"
                        onClick={() =>
                          setCachChia((truoc) => new Map(truoc).set(d.stt, truoc.get(d.stt) === "file" ? "so" : "file"))
                        }
                      >
                        {cachChia.get(d.stt) === "file" ? "Chia theo số lượng" : "Chia theo phần việc (dòng theo file)"}
                      </button>
                    )}
                  </div>
                );
                if (!dg?.duoc) {
                  return (
                    <tr key={d.stt} className="bg-muted">
                      <td className="sticky left-0 z-[1] border-b border-divider bg-muted p-2.5 align-top">
                        <span className="flex items-start gap-2">
                          <Lock className="mt-0.5 size-4 shrink-0 text-text-disabled" aria-hidden />
                          {ten}
                        </span>
                      </td>
                      <td colSpan={soCot + 1} className="border-b border-divider p-2.5 align-top text-xs text-text-secondary">
                        Không chia được: {dg?.lyDo ?? "—"}
                      </td>
                    </tr>
                  );
                }
                const laFile = cachChia.get(d.stt) === "file";
                const o = oFile.get(d.stt) ?? [];
                const s = oSo.get(d.stt) ?? [];
                let tong = 0;
                for (let c = 1; c < soCot; c++) {
                  const v = docSo(s[c] ?? "");
                  if (Number.isFinite(v)) tong += v;
                }
                const giuLai = lamTronKhoiLuong(dg.conLai - tong);
                return (
                  <tr key={d.stt}>
                    <td className="sticky left-0 z-[1] border-b border-divider bg-card p-2.5 align-top">{ten}</td>
                    {Array.from({ length: soCot }, (_, c) =>
                      laFile ? (
                        <td key={c} className="border-b border-divider p-2.5 align-top">
                          <label className="flex min-h-9 cursor-pointer items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              className="size-4 accent-primary"
                              checked={Boolean(o[c]?.lam)}
                              onChange={(e) => doiFile(d.stt, c, { lam: e.target.checked })}
                            />
                            làm dòng này
                          </label>
                          {o[c]?.lam && (
                            <Input
                              className="mt-1"
                              value={o[c]?.pv ?? ""}
                              placeholder="Phần việc (vd mục 1–7)"
                              aria-label={`Phần việc dòng ${d.stt} — ${c === 0 ? "phiếu này" : `bản mới ${c}`}`}
                              onChange={(e) => doiFile(d.stt, c, { pv: e.target.value })}
                            />
                          )}
                        </td>
                      ) : c === 0 ? (
                        <td key={c} className="border-b border-divider p-2.5 align-top">
                          <span className={`block font-semibold ${giuLai < 0 ? "text-danger" : "text-text-primary"}`}>
                            {formatNumber(giuLai)} {d.donViTinh}
                          </span>
                          <span className="text-xs text-text-desc">tự giữ lại</span>
                        </td>
                      ) : (
                        <td key={c} className="border-b border-divider p-2.5 align-top">
                          <Input
                            inputMode="decimal"
                            className="max-w-[140px] text-right"
                            placeholder="0"
                            value={s[c] ?? ""}
                            aria-label={`Số lượng dòng ${d.stt} đưa sang Bản mới ${c}`}
                            onChange={(e) => doiSo(d.stt, c, e.target.value)}
                          />
                        </td>
                      ),
                    )}
                    <td className="border-b border-divider" />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(loiGui ?? loiThu) && (
          <p className="flex items-start gap-1.5 rounded-md bg-danger-bg px-2 py-1.5 text-xs font-medium text-danger-soft">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {loiGui ?? loiThu}
          </p>
        )}

        {cheDoGiao === "mua" && (
          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-primary/30 bg-primary-bg p-3">
            <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm font-medium">
              Mua hàng — giao phần tách ra cho
              <select className={LOP_CHON} value={nguoiMua} onChange={(e) => setNguoiMua(e.target.value)}>
                <option value="">— Chọn nhân viên thu mua —</option>
                {dsMua.map((t) => (
                  <option key={t.uid} value={t.uid}>
                    {t.ten}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="outline" className="min-h-11" onClick={() => setCheDoGiao(null)}>
              Quay lại
            </Button>
            <Button className="min-h-11" disabled={khoa || !nguoiMua} onClick={() => gui("mua")}>
              <UserPlus className="size-4" aria-hidden />
              Giao việc
            </Button>
          </div>
        )}
        {cheDoGiao === "xk" && (
          <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary-bg p-3 text-sm">
            <span className="font-medium">Xuất kho từ đâu? Phiếu tách ra bỏ qua báo giá, sang thẳng Lập đơn mua hàng.</span>
            {(
              [
                ["vpp", "XK VPP", "xuất văn phòng phẩm có sẵn — giao NV Nhân sự", dsVPP],
                ["kho_tong", "XK Kho Tổng", "lấy hàng có sẵn ở Kho Tổng — giao NV Kho Tổng", dsKhoTong],
              ] as const
            ).map(([ma, nhan, moTa, ds]) => (
              <label key={ma} className="flex cursor-pointer flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2.5">
                <input
                  type="radio"
                  name="nguon-xuat-kho"
                  className="accent-primary"
                  checked={nguonXK === ma}
                  onChange={() => {
                    setNguonXK(ma);
                    setNguoiXK(ds.length === 1 ? ds[0].uid : "");
                  }}
                />
                <span className="min-w-0 flex-1">
                  <strong>{nhan}</strong> — {moTa}
                </span>
                {nguonXK === ma &&
                  (ds.length === 0 ? (
                    <span className="text-xs text-danger">Chưa có tài khoản chức danh này trong app.</span>
                  ) : (
                    <select className={`${LOP_CHON} w-auto`} value={nguoiXK} onChange={(e) => setNguoiXK(e.target.value)}>
                      <option value="">— Chọn người —</option>
                      {ds.map((t) => (
                        <option key={t.uid} value={t.uid}>
                          {t.ten}
                        </option>
                      ))}
                    </select>
                  ))}
              </label>
            ))}
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" className="min-h-11" onClick={() => setCheDoGiao(null)}>
                Quay lại
              </Button>
              <Button className="min-h-11" disabled={khoa || !nguoiXK} onClick={() => gui("xk")}>
                <PackageOpen className="size-4" aria-hidden />
                Xuất kho
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" className="min-h-11" onClick={onDong}>
            Hủy
          </Button>
          {!chonNguoi && (
            <>
              <Button
                variant="outline"
                className="min-h-11"
                disabled={khoa || dsMua.length === 0}
                onClick={() => {
                  setCheDoGiao("mua");
                  setNguoiMua(dsMua.length === 1 ? dsMua[0].uid : "");
                }}
              >
                <UserPlus className="size-4" aria-hidden />
                Mua hàng
              </Button>
              <Button
                variant="outline"
                className="min-h-11"
                disabled={khoa}
                onClick={() => {
                  setCheDoGiao("xk");
                  setNguonXK("vpp");
                  setNguoiXK(dsVPP.length === 1 ? dsVPP[0].uid : "");
                }}
              >
                <PackageOpen className="size-4" aria-hidden />
                Xuất kho ▾
              </Button>
            </>
          )}
          <Button className="min-h-11" disabled={khoa} onClick={() => gui("giu")}>
            <Copy className="size-4" aria-hidden />
            Nhân bản (tạo {soBan} bản)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
