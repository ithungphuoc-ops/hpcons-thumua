"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { docGhiChu, ghiGhiChu, type GhiChuCongViec } from "@/3-du-lieu/ghi-chu-ca-nhan";
import {
  NHAN_LOAI_MUC,
  TEN_THU,
  dungLichCuaToi,
  dungLuoiThang,
  gomTheoNgay,
  tenThang,
  tomTatSapToi,
  type MucLich,
} from "@/2-quy-trinh/lich-cong-viec";
import { thoiDiemHienTai } from "@/6-tien-ich/dinh-dang";

/**
 * MÀN LỊCH CÔNG VIỆC — chỉ đạo Ban lãnh đạo 11/08/2026: *"lịch ghi chú cho các tài khoản của
 * bộ phận này, và sẽ tự động cập nhật công việc vào lịch khi có nhiệm vụ"*.
 *
 * 🔴 VIỆC TỰ ĐỘNG ĐƯỢC SUY RA TỪ CHỨNG TỪ, không lưu bản sao — luật ở
 * `2-quy-trinh/lich-cong-viec.ts`, màn này chỉ vẽ. Hệ quả người dùng thấy được: mục tự động
 * KHÔNG có nút xóa, vì xóa nó không làm hồ sơ hết hạn. Hồ sơ xong thì mục tự rụng khỏi lịch.
 *
 * 🔴 GHI CHÚ TAY LÀ RIÊNG TƯ TUYỆT ĐỐI (Sếp chốt 11/08/2026). Không ai khác đọc được, kể cả
 * trưởng bộ phận. Màn này phải NÓI RA điều đó — người dùng có quyền biết cái gì riêng, cái gì
 * cả phòng thấy.
 *
 * ⚠️ Lịch chỉ hiện việc CỦA NGƯỜI ĐANG ĐĂNG NHẬP. Đổ hết mọi hồ sơ lên đây thì nó thành bảng
 * quy trình thứ hai, mất công dụng "hôm nay tôi phải làm gì".
 */
export default function TrangLichCongViec() {
  const { deNghi, donHang, baoGia, congNo } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  const homNay = useMemo(() => new Date(), []);
  const [nam, setNam] = useState(homNay.getFullYear());
  const [thang0, setThang0] = useState(homNay.getMonth());

  /**
   * Sổ tay đọc trong `useEffect`, KHÔNG đọc lúc khởi tạo state.
   * localStorage chỉ có ở trình duyệt; đọc khi dựng sẽ khác kết quả giữa lần render trên máy
   * chủ và trên trình duyệt → React báo lệch nội dung (hydration mismatch).
   */
  const [ghiChu, setGhiChu] = useState<GhiChuCongViec[]>([]);
  useEffect(() => setGhiChu(docGhiChu(nguoiDung.uid)), [nguoiDung.uid]);

  function luu(ds: GhiChuCongViec[]) {
    setGhiChu(ds);
    ghiGhiChu(nguoiDung.uid, ds);
  }

  const [ngayDangChon, setNgayDangChon] = useState<string | null>(null);
  const [noiDungMoi, setNoiDungMoi] = useState("");

  const muc = useMemo(
    () =>
      dungLichCuaToi(
        { deNghi, donHang, baoGia, congNo, ghiChu },
        nguoiDung.uid,
        quyen,
      ),
    [deNghi, donHang, baoGia, congNo, ghiChu, nguoiDung.uid, quyen],
  );

  const theoNgay = useMemo(() => gomTheoNgay(muc), [muc]);
  const luoi = useMemo(() => dungLuoiThang(nam, thang0, homNay), [nam, thang0, homNay]);
  const tomTat = useMemo(() => tomTatSapToi(muc, 7, homNay), [muc, homNay]);

  function doiThang(buoc: number) {
    const d = new Date(nam, thang0 + buoc, 1);
    setNam(d.getFullYear());
    setThang0(d.getMonth());
  }

  function veHomNay() {
    setNam(homNay.getFullYear());
    setThang0(homNay.getMonth());
    setNgayDangChon(null);
  }

  function themGhiChu() {
    const noiDung = noiDungMoi.trim();
    if (!noiDung || !ngayDangChon) return;
    luu([
      ...ghiChu,
      {
        id: `gc-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        noiDung,
        xong: false,
        thoiDiem: thoiDiemHienTai(),
        ngayHan: ngayDangChon,
      },
    ]);
    setNoiDungMoi("");
  }

  const mucNgayChon = ngayDangChon ? (theoNgay.get(ngayDangChon) ?? []) : [];

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Thu mua", href: "/tong-quan" }, { label: "Lịch công việc" }]}
        title="Lịch công việc"
        description={`Việc đến hạn của ${nguoiDung.tenHienThi} — tự lấy từ hồ sơ, cộng ghi chú riêng của bạn`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={veHomNay}>
              <CalendarDays className="size-4" aria-hidden />
              Về hôm nay
            </Button>
          </div>
        }
      />

      {/* ---- Dòng tóm tắt: trả lời ngay "có gì gấp không" ---- */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {/* Trạng thái luôn có CẢ MÀU VÀ CHỮ (quy chuẩn V1.1), không chỉ tô đỏ. */}
          <span className="flex items-center gap-2">
            <StatusBadge
              label={tomTat.quaHan > 0 ? `${tomTat.quaHan} việc quá hạn` : "Không có việc quá hạn"}
              tone={tomTat.quaHan > 0 ? "danger" : "success"}
            />
          </span>
          <span className="flex items-center gap-1.5 text-text-secondary">
            <CalendarClock className="size-4 shrink-0 text-text-desc" aria-hidden />
            Hôm nay: <strong className="text-text-primary">{tomTat.homNayCo}</strong> việc
          </span>
          <span className="text-text-secondary">
            7 ngày tới: <strong className="text-text-primary">{tomTat.trongKhoang}</strong> việc
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-text-desc">
            <Lock className="size-3.5 shrink-0" aria-hidden />
            Ghi chú của bạn là riêng tư — người khác không đọc được
          </span>
        </CardContent>
      </Card>

      {/* ---- Lưới tháng ---- */}
      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-h3 text-text-primary">
              {tenThang(thang0)} / {nam}
            </h2>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => doiThang(-1)}
                aria-label="Tháng trước"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => doiThang(1)}
                aria-label="Tháng sau"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>

          {/* Lưới 7 cột. Màn hẹp thì cho cuộn ngang TRONG khung, không để bóp méo ô. */}
          <div className="min-w-0 overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-7 gap-1 pb-1">
                {TEN_THU.map((t) => (
                  <div key={t} className="text-center text-xs font-semibold text-text-desc">
                    {t}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {luoi.map((o) => {
                  const cua = theoNgay.get(o.ngay) ?? [];
                  const conViec = cua.filter((m) => !m.xong);
                  const dangChon = ngayDangChon === o.ngay;
                  return (
                    <button
                      key={o.ngay}
                      type="button"
                      onClick={() => setNgayDangChon(dangChon ? null : o.ngay)}
                      aria-label={`Ngày ${o.soNgay}, ${conViec.length} việc`}
                      aria-pressed={dangChon}
                      className={[
                        "flex min-h-24 flex-col gap-1 rounded-lg border p-1.5 text-left transition-colors",
                        o.trongThang ? "bg-card" : "bg-muted/40",
                        o.cuoiTuan && o.trongThang ? "bg-muted/60" : "",
                        dangChon ? "border-primary ring-2 ring-primary ring-inset" : "border-border",
                        "hover:border-primary",
                      ].join(" ")}
                    >
                      <span className="flex items-center justify-between gap-1">
                        <span
                          className={[
                            "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                            o.laHomNay
                              ? "bg-primary text-white"
                              : o.trongThang
                                ? "text-text-primary"
                                : "text-text-disabled",
                          ].join(" ")}
                        >
                          {o.soNgay}
                        </span>
                        {conViec.length > 0 && (
                          <span className="rounded-full bg-primary-bg px-1.5 text-[11px] font-bold text-primary">
                            {conViec.length}
                          </span>
                        )}
                      </span>

                      {/* Hiện tối đa 2 mục cho ô đỡ chật; còn lại đếm thành "+N". */}
                      {cua.slice(0, 2).map((m) => (
                        <ChipMuc key={m.khoa} muc={m} />
                      ))}
                      {cua.length > 2 && (
                        <span className="px-0.5 text-[11px] text-text-desc">
                          +{cua.length - 2} việc nữa
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- Chi tiết ngày đang chọn ---- */}
      {ngayDangChon && (
        <Card className="border-primary/40">
          <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
            <h2 className="text-h3 text-text-primary">
              Ngày {new Date(ngayDangChon).toLocaleDateString("vi-VN")}
            </h2>

            {mucNgayChon.length === 0 ? (
              <p className="text-sm text-text-desc">Không có việc nào trong ngày này.</p>
            ) : (
              <ul className="flex flex-col gap-(--hp-md-row-gap)">
                {mucNgayChon.map((m) => {
                  const nhan = NHAN_LOAI_MUC[m.loai];
                  return (
                    <li
                      key={m.khoa}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-surface p-(--hp-md-row-pad)"
                    >
                      <StatusBadge label={nhan.nhan} tone={nhan.tong} />
                      <span
                        className={`text-sm font-medium ${m.xong ? "text-text-disabled line-through" : "text-text-primary"}`}
                      >
                        {m.nhan}
                      </span>
                      {m.moTa && <span className="text-xs text-text-desc">{m.moTa}</span>}

                      <span className="ml-auto flex items-center gap-2">
                        {m.duongDan && (
                          <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<Link href={m.duongDan} />}
                          >
                            Mở hồ sơ
                          </Button>
                        )}
                        {/* 🔴 CHỈ ghi chú tay mới cho đánh dấu xong và xóa. Mục tự động suy
                            ra từ chứng từ — xóa nó không làm hồ sơ hết hạn, nên không có nút. */}
                        {m.laGhiChuTay && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const id = m.khoa.split("|")[1];
                                luu(
                                  ghiChu.map((g) => (g.id === id ? { ...g, xong: !g.xong } : g)),
                                );
                              }}
                            >
                              {m.xong ? "Bỏ đánh dấu" : "Xong"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Xóa ghi chú"
                              onClick={() => {
                                const id = m.khoa.split("|")[1];
                                luu(ghiChu.filter((g) => g.id !== id));
                              }}
                            >
                              <Trash2 className="size-4 text-danger-soft" aria-hidden />
                            </Button>
                          </>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* ---- Thêm ghi chú cho ngày này ---- */}
            <div className="flex flex-col gap-2 border-t border-divider pt-(--hp-md-card-gap)">
              <Label htmlFor="ghi-chu-moi">Thêm ghi chú cho ngày này</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="ghi-chu-moi"
                  value={noiDungMoi}
                  onChange={(e) => setNoiDungMoi(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") themGhiChu();
                  }}
                  placeholder="vd Gọi lại NCC hỏi giá thép D14"
                  className="min-w-56 flex-1"
                />
                <Button onClick={themGhiChu} disabled={noiDungMoi.trim() === ""}>
                  <Plus className="size-4" aria-hidden />
                  Thêm
                </Button>
              </div>
              <p className="text-xs text-text-desc">
                Ghi chú lưu trong trình duyệt máy này và <strong>chỉ bạn thấy</strong>. Muốn giao
                việc cho người khác thì dùng bảng phân bổ hoặc nút Chuyển tiếp ở trang chi tiết
                đề nghị.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

/** Một dòng nhỏ trong ô ngày. Cắt ngắn để ô không giãn theo nội dung. */
function ChipMuc({ muc }: { muc: MucLich }) {
  const t = NHAN_LOAI_MUC[muc.loai];
  const nen: Record<string, string> = {
    primary: "bg-primary-bg text-primary-soft",
    warning: "bg-warning-bg text-warning-soft",
    danger: "bg-danger-bg text-danger-soft",
    success: "bg-success-bg text-success-soft",
    neutral: "bg-neutral-bg text-neutral-soft",
  };
  return (
    <span
      title={`${t.nhan}: ${muc.nhan}`}
      className={`truncate rounded px-1 py-0.5 text-[11px] leading-tight ${nen[t.tong]} ${
        muc.xong ? "line-through opacity-60" : ""
      }`}
    >
      {muc.nhan}
    </span>
  );
}
