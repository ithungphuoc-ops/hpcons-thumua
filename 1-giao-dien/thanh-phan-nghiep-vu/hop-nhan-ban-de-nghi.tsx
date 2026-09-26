"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Copy, Info, ListChecks, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";
import { formatNumber } from "@/6-tien-ich/dinh-dang";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import {
  apDungNhanBanDeNghi,
  danhGiaDongNhanBan,
  lamTronKhoiLuong,
  maBanSaoTiepTheo,
  phieuGocCua,
  tenBanSaoTheoMa,
  type DongChonNhanBan,
} from "@/2-quy-trinh/nhan-ban-de-nghi";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/** Ô nhập khối lượng của một dòng đang chọn — giữ dạng chuỗi để người dùng gõ dở "12," không bị nuốt. */
interface ONhap {
  tuCha: string;
  them: string;
}

/** Đọc số người dùng gõ — chấp nhận dấu phẩy thập phân kiểu Việt. Trống = 0. */
function docSo(s: string): number {
  const t = s.trim().replace(",", ".");
  if (t === "") return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : Number.NaN;
}

/**
 * HỘP NHÂN BẢN ĐỀ NGHỊ = TÁCH THEO NHÀ CUNG CẤP.
 *
 * 🔴 Ban lãnh đạo 13/08/2026: *"nhân bản sẽ giữ nguyên toàn bộ thông tin chỉ thêm chữ (copy) phía sau
 * và có chức năng xóa bớt mặt hàng để giao cho nhân viên phù hợp"*.
 *
 * ★★★ Sếp duyệt 26/09/2026: *"nhân viên sẽ nhân bản đề nghị để tách từng công việc nhỏ trong đề nghị
 * do khác nhà cung cấp… phải có liên kết cha con"* — và thêm chức năng tăng giảm khối lượng: *"đề
 * nghị 100 bao xi măng nhưng phải cần 2 tới 3 NCC… Và có trường hợp mua nhiều hơn đề xuất 100 bao,
 * nhưng sau khi họp thì cần 120 bao"*.
 *
 *   · Chỉ tích được dòng HỢP LỆ; dòng không hợp lệ hiện xám KÈM LÝ DO (đã chuyển hết · có báo giá /
 *     đơn · của người khác). Luật ở `danhGiaDongNhanBan` — dùng chung với tầng ghi.
 *   · 🔴 MẶC ĐỊNH KHÔNG TÍCH DÒNG NÀO (trước 26/09 tích hết → phiếu gốc mờ toàn bộ, kéo luôn dòng
 *     đồng nghiệp đang mua sang bản sao = mua trùng).
 *   · Mỗi dòng chọn có ô "Lấy từ phần còn lại" (mặc định = còn lại, sửa nhỏ hơn được) và ô "Mua thêm
 *     ngoài đề nghị" (> 0 thì bắt buộc lý do).
 *   · Nút xác nhận khoá kèm ĐÚNG câu tầng ghi sẽ trả: hộp chạy thử `apDungNhanBanDeNghi` trên dữ liệu
 *     đang có, nên không bao giờ cho bấm một thứ tầng ghi sẽ chặn (và ngược lại).
 */
export function HopNhanBanDeNghi({
  deNghi,
  mo,
  onDong,
  onXacNhan,
}: {
  /** Phiếu đang nhân bản. `null` khi chưa chọn phiếu nào — hộp vẫn dựng để hiệu ứng đóng chạy hết. */
  deNghi: DeNghiMuaHang | null;
  mo: boolean;
  onDong: () => void;
  /** Gửi dòng + khối lượng + lý do. Trả câu lỗi (hộp giữ nguyên để sửa) hoặc `null` (đã tạo, đóng hộp). */
  onXacNhan: (luaChon: { chon: DongChonNhanBan[]; lyDoVuot?: string }) => string | null;
}) {
  const { deNghi: dsDeNghi, baoGia, donHang } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  const [chon, setChon] = useState<Map<number, ONhap>>(new Map());
  const [lyDoVuot, setLyDoVuot] = useState("");
  const [loiGui, setLoiGui] = useState<string | null>(null);

  /**
   * Mở hộp cho phiếu nào thì làm trống lựa chọn.
   * ⚠️ Phụ thuộc `deNghi?.id` chứ không phải `deNghi`: đối tượng dựng lại mỗi lần kho dữ liệu đổi,
   * để `deNghi` là lựa chọn của người dùng bị xoá sạch khi có người khác sửa một phiếu bất kỳ.
   */
  useEffect(() => {
    if (mo) {
      setChon(new Map());
      setLyDoVuot("");
      setLoiGui(null);
    }
  }, [mo, deNghi?.id]);

  const danhGia = useMemo(
    () =>
      deNghi
        ? danhGiaDongNhanBan(deNghi, dsDeNghi, nguoiDung.uid, quyen.phanBoCongViec, baoGia, donHang)
        : [],
    [deNghi, dsDeNghi, nguoiDung.uid, quyen.phanBoCongViec, baoGia, donHang],
  );

  /* Chỉ gửi dòng còn hợp lệ — dòng vừa bị máy khác tách hết trong lúc hộp mở thì rơi ra. */
  const dsChon: DongChonNhanBan[] = danhGia
    .filter((x) => x.duoc && chon.has(x.stt))
    .map((x) => {
      const o = chon.get(x.stt) as ONhap;
      return { stt: x.stt, khoiLuongTuCha: docSo(o.tuCha), khoiLuongThem: docSo(o.them) };
    });
  const coVuot = dsChon.some((c) => (c.khoiLuongThem ?? 0) > 0);

  /* Chạy thử đúng hàm tầng ghi — câu lỗi hiện ở đây là câu tầng ghi sẽ trả. */
  const loiThu = useMemo(() => {
    if (!deNghi || dsChon.length === 0) return null;
    const kq = apDungNhanBanDeNghi(dsDeNghi, {
      prId: deNghi.id,
      nguoi: { uid: nguoiDung.uid, ten: nguoiDung.tenHienThi },
      laNguoiPhanBo: quyen.phanBoCongViec,
      chon: dsChon,
      lyDoVuot,
      idMoi: "__thu__",
      ngay: "2000-01-01",
      thoiDiem: "2000-01-01T00:00:00Z",
      baoGia,
      donHang,
    });
    return kq.loi ?? null;
    // dsChon dựng lại mỗi lần vẽ — so bằng chuỗi để không chạy thử thừa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deNghi, dsDeNghi, JSON.stringify(dsChon), lyDoVuot, nguoiDung.uid, quyen.phanBoCongViec, baoGia, donHang]);

  if (!deNghi) return null;

  const goc = phieuGocCua(deNghi, dsDeNghi);
  const maMoi = maBanSaoTiepTheo(deNghi, dsDeNghi);
  const soDuoc = danhGia.filter((x) => x.duoc).length;
  const dongTheoStt = new Map(deNghi.items.map((d) => [d.stt, d]));

  function doiDong(stt: number, conLai: number) {
    setLoiGui(null);
    setChon((truoc) => {
      const m = new Map(truoc);
      if (m.has(stt)) m.delete(stt);
      else m.set(stt, { tuCha: String(conLai), them: "" });
      return m;
    });
  }
  function doiO(stt: number, truong: keyof ONhap, gt: string) {
    setLoiGui(null);
    setChon((truoc) => {
      const m = new Map(truoc);
      const o = m.get(stt);
      if (o) m.set(stt, { ...o, [truong]: gt });
      return m;
    });
  }

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      {/* 🔴 `sm:max-w-…` chứ không `max-w-…` trơn — lớp gốc của DialogContent có `sm:max-w-sm`,
          viết trơn là bị đè im lặng (CLAUDE.md §5). */}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nhân bản đề nghị {deNghi.code}</DialogTitle>
          <DialogDescription>
            Dùng khi một phần của phiếu mua ở <strong>nhà cung cấp khác</strong>: chọn mặt hàng và
            khối lượng đưa sang bản mới. Bản mới giữ dự án, công trình, ngày cần hàng và người theo
            dõi; <strong>không chép tệp đã đính kèm</strong> (xem ở phiếu gốc).{" "}
            {/* ★ Sếp 26/09/2026: TBP nhân bản thì phiếu con GIỮ người phụ trách — câu phải nói đúng
                theo quyền người đang bấm (luật ở `dungBanNhanBan` → `giuNguoiPhuTrachGoc`). */}
            {quyen.phanBoCongViec ? (
              <strong>Dòng đã giao ai thì giữ nguyên người phụ trách đó</strong>
            ) : (
              <strong>Bạn nhận phần việc của những dòng đã có người phụ trách</strong>
            )}
            , dòng chưa giao ai thì vẫn chờ phân bổ.
          </DialogDescription>
        </DialogHeader>

        {/* Tên / mã bản sao TÍNH BẰNG ĐÚNG HÀM kho dữ liệu dùng khi lưu (13/08 + 17/09/2026). */}
        <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          <span className="text-text-desc">Mã phiếu mới: </span>
          <span className="font-semibold text-text-primary">{maMoi}</span>
          <span className="block text-xs text-text-desc">
            Tên đề xuất mới: {tenBanSaoTheoMa(goc.tieuDe, maMoi)}
          </span>
          {/* ★ Sửa 26/09/2026 — câu cũ ghi "Bản mới … KHÔNG PHẢI con của {phiếu đang mở}", ngược với
              dữ liệu thật: từ 17/09 `deNghiChaId` = phiếu đang bấm nhân bản. */}
          <span className="block text-xs text-text-desc">
            Bản mới là <strong>con của {deNghi.code}</strong>
            {goc.id !== deNghi.id ? <> · thuộc đề xuất gốc {goc.code}</> : null} — hiện trong khối
            &quot;Đã tách thành … đề xuất con&quot; của các phiếu này.
          </span>
        </p>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
              <ListChecks className="size-4 shrink-0 text-text-desc" aria-hidden />
              Mặt hàng đưa sang bản mới ({dsChon.length}/{soDuoc} chọn được)
            </span>
            {dsChon.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11"
                onClick={() => {
                  setChon(new Map());
                  setLoiGui(null);
                }}
              >
                Bỏ chọn hết
              </Button>
            )}
          </div>

          {/* Cuộn trong hộp: nút xác nhận phải luôn nhìn thấy. */}
          <ul className="flex max-h-[50vh] flex-col divide-y divide-divider overflow-y-auto rounded-lg border border-border">
            {danhGia.map((x) => {
              const d = dongTheoStt.get(x.stt);
              if (!d) return null;
              const dangChon = x.duoc && chon.has(x.stt);
              const o = chon.get(x.stt);
              const tuCha = o ? docSo(o.tuCha) : 0;
              const them = o ? docSo(o.them) : 0;
              const dv = d.donViTinh;
              const coKhoiLuong = x.khoiLuongDong > 0;
              const conSau = lamTronKhoiLuong(x.conLai - (Number.isFinite(tuCha) ? tuCha : 0));
              const tongVuot = lamTronKhoiLuong(x.vuot + (Number.isFinite(them) ? them : 0));
              return (
                <li key={x.stt} className={x.duoc ? "" : "bg-muted"}>
                  <label
                    className={`flex min-h-11 min-w-0 items-start gap-2.5 px-3 py-2.5 ${
                      x.duoc ? "cursor-pointer hover:bg-muted" : "cursor-not-allowed"
                    }`}
                  >
                    {x.duoc ? (
                      <Checkbox
                        checked={dangChon}
                        onCheckedChange={() => doiDong(x.stt, x.conLai)}
                        className="mt-0.5 shrink-0"
                        aria-label={`Chọn ${d.tenVatLieu}`}
                      />
                    ) : (
                      <Lock className="mt-0.5 size-4 shrink-0 text-text-disabled" aria-hidden />
                    )}
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span
                        className={`text-sm font-medium ${x.duoc ? "text-text-primary" : "text-text-disabled"}`}
                      >
                        {d.stt}. {d.tenVatLieu}
                      </span>
                      <span className="text-xs text-text-desc">
                        {d.quyCach ? `${d.quyCach} · ` : ""}
                        {formatNumber(x.khoiLuongDong)} {dv}
                        {x.daLay > 0 && x.conLai > 0
                          ? ` · còn ${formatNumber(x.conLai)} ${dv} (${formatNumber(x.daLay)} đã tách sang ${x.maPhieuDaNhan.join(", ")})`
                          : ""}
                        {d.nguoiPhuTrachTen ? ` · đang giao ${d.nguoiPhuTrachTen}` : ""}
                      </span>
                      {x.vuot > 0 && (
                        <span className="text-xs font-medium text-warning-soft">
                          Đã mua vượt đề nghị {formatNumber(x.vuot)} {dv}
                        </span>
                      )}
                      {/* 🔴 Dòng xám PHẢI kèm lý do — trạng thái có cả chữ lẫn màu (Design System V1.1). */}
                      {!x.duoc && x.lyDo && (
                        <span className="text-xs font-medium text-text-secondary">
                          Không chọn được: {x.lyDo}
                        </span>
                      )}
                    </span>
                  </label>

                  {dangChon && o && coKhoiLuong && (
                    <div className="flex flex-col gap-2 px-3 pb-3 pl-10">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-xs text-text-secondary">
                          Lấy từ phần còn lại (tối đa {formatNumber(x.conLai)} {dv})
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={o.tuCha}
                            onChange={(e) => doiO(x.stt, "tuCha", e.target.value)}
                            aria-invalid={!Number.isFinite(tuCha) || tuCha > x.conLai || tuCha < 0}
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-text-secondary">
                          Mua thêm ngoài đề nghị ({dv})
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={o.them}
                            onChange={(e) => doiO(x.stt, "them", e.target.value)}
                            aria-invalid={!Number.isFinite(them) || them < 0}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-text-desc">
                        Bản mới mua{" "}
                        <strong className="text-text-primary">
                          {Number.isFinite(tuCha + them) ? formatNumber(lamTronKhoiLuong(tuCha + them)) : "—"} {dv}
                        </strong>
                        {" · "}
                        {conSau > 0
                          ? `${deNghi.code} còn tự mua ${formatNumber(conSau)} ${dv}`
                          : `${deNghi.code} hết phần dòng này`}
                      </p>
                      {tongVuot > 0 && Number.isFinite(them) && them > 0 && (
                        <p className="flex items-center gap-1.5 rounded-md bg-warning-bg px-2 py-1 text-xs font-medium text-warning-soft">
                          <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                          Vượt đề nghị: tổng {formatNumber(lamTronKhoiLuong(x.khoiLuongDong + tongVuot))} / đề nghị{" "}
                          {formatNumber(x.khoiLuongDong)} {dv} · vượt {formatNumber(tongVuot)}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {coVuot && (
            <label className="flex flex-col gap-1 text-sm font-medium text-text-primary">
              Lý do mua vượt đề nghị <span className="text-xs font-normal text-danger">(bắt buộc)</span>
              <Textarea
                value={lyDoVuot}
                onChange={(e) => {
                  setLoiGui(null);
                  setLyDoVuot(e.target.value);
                }}
                placeholder="VD: Họp công trường 26/09 chốt cần 120 bao"
                aria-invalid={!lyDoVuot.trim()}
              />
              <span className="text-xs font-normal text-text-desc">
                Ghi vào nhật ký của cả phiếu này và bản mới. Đừng ghi tên nhà cung cấp — nhật ký hiện cho
                cả vai trò không được xem NCC.
              </span>
            </label>
          )}

          {soDuoc === 0 && (
            <p className="flex items-start gap-1.5 text-xs text-warning-soft">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Phiếu này không còn dòng nào bạn nhân bản được — xem lý do cạnh từng dòng.
            </p>
          )}
          {dsChon.length === 0 && soDuoc > 0 && (
            <p className="text-xs text-text-desc">Chưa chọn mặt hàng nào — tích dòng cần tách sang nhà cung cấp khác.</p>
          )}
          {(loiGui ?? loiThu) && (
            <p className="flex items-start gap-1.5 rounded-md bg-danger-bg px-2 py-1.5 text-xs font-medium text-danger-soft">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {loiGui ?? loiThu}
            </p>
          )}
          {dsChon.length > 0 && !loiThu && (
            <p className="text-xs text-text-desc">
              Phiếu <strong>{deNghi.code}</strong> vẫn giữ đủ mặt hàng để tra lại: dòng đưa đi hết được{" "}
              <strong>làm mờ</strong>, dòng chỉ tách một phần thì hiện <strong>phần còn lại</strong> và ghi
              rõ đã tách sang đâu.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" className="min-h-11" onClick={onDong}>
            Hủy
          </Button>
          <Button
            className="min-h-11"
            disabled={dsChon.length === 0 || Boolean(loiThu)}
            onClick={() => {
              const loi = onXacNhan({ chon: dsChon, lyDoVuot: coVuot ? lyDoVuot.trim() : undefined });
              if (loi) setLoiGui(loi);
              else onDong();
            }}
          >
            <Copy className="size-4" aria-hidden />
            Nhân bản {dsChon.length} mặt hàng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
