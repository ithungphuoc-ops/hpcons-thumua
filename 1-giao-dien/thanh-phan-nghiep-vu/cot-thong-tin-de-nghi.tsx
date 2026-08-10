"use client";

import { CalendarClock, CircleDot, Clock, Hash, User } from "lucide-react";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import {
  GIAI_DOAN_MUA_HANG,
  NHAN_GIAI_DOAN,
  type GiaiDoanMuaHang,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import { formatDate } from "@/6-tien-ich/dinh-dang";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * CỘT THÔNG TIN BÊN PHẢI của trang chi tiết đề nghị.
 *
 * Bám bố cục trang nhiệm vụ của Base.vn (Ban lãnh đạo cung cấp ảnh 10/08/2026):
 * nội dung làm việc nằm cột trái, còn "hồ sơ này là gì, đang ở đâu, ai đụng vào"
 * gom hết về cột phải để tra nhanh mà không phải cuộn.
 *
 * Trên màn hẹp cột này tự xuống dưới (xem lớp lưới ở trang gọi nó).
 */
export function CotThongTinDeNghi({
  deNghi,
  giaiDoan,
  soNgayConLai,
}: {
  deNghi: DeNghiMuaHang;
  giaiDoan: GiaiDoanMuaHang;
  soNgayConLai: number;
}) {
  const chuoi = GIAI_DOAN_MUA_HANG.filter((g) => g.ma !== "that_bai");
  const viTri = chuoi.findIndex((g) => g.ma === giaiDoan);
  const buocKeTiep = viTri >= 0 && viTri < chuoi.length - 1 ? chuoi[viTri + 1] : undefined;
  const moTa = NHAN_GIAI_DOAN[giaiDoan];

  return (
    <div className="flex flex-col gap-(--hp-md-row-gap)">
      {/* ---- GIAI ĐOẠN HIỆN TẠI ---- */}
      <section className="flex flex-col gap-1.5 rounded-xl bg-primary p-(--hp-md-card-pad) text-white">
        <span className="text-[11px] font-semibold tracking-wide text-white/70 uppercase">
          Giai đoạn hiện tại
        </span>
        <p className="text-sm font-bold">
          {viTri >= 0 ? `[${viTri + 1}/${chuoi.length}] ` : ""}
          {moTa?.nhan ?? giaiDoan}
        </p>
        <p className="text-xs text-white/80">{moTa?.moTa}</p>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-white/20 pt-2 text-xs">
          <span className="text-white/70">Ngày cần hàng</span>
          <span className="font-semibold">{formatDate(deNghi.ngayCanHang)}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-white/70">Thời hạn</span>
          {/* Quá hạn hiện cả chữ lẫn nền đậm, không chỉ đổi màu chữ (V1.1) */}
          <span
            className={`rounded px-1.5 py-0.5 font-semibold ${
              soNgayConLai < 0 ? "bg-white text-danger" : "text-white"
            }`}
          >
            {soNgayConLai < 0 ? `Quá hạn ${-soNgayConLai} ngày` : `Còn ${soNgayConLai} ngày`}
          </span>
        </div>

        {buocKeTiep && (
          <p className="mt-1 border-t border-white/20 pt-2 text-xs text-white/80">
            » Giai đoạn kế tiếp: <strong className="text-white">{buocKeTiep.nhan}</strong>
          </p>
        )}
      </section>

      {/* ---- THÔNG TIN HỒ SƠ ---- */}
      <Card>
        <CardContent className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold tracking-wide text-text-desc uppercase">
            Thông tin hồ sơ
          </span>
          <Dong icon={Hash} nhan="Mã đề nghị" giaTri={deNghi.code} />
          <Dong icon={CircleDot} nhan="Mã dự án" giaTri={deNghi.maDuAn} />
          {deNghi.maHopDongCDT && (
            <Dong icon={CircleDot} nhan="Hợp đồng CĐT" giaTri={deNghi.maHopDongCDT} />
          )}
          <Dong icon={User} nhan="Người đề nghị" giaTri={deNghi.nguoiDeNghiTen} />
          <Dong icon={CalendarClock} nhan="Ngày duyệt" giaTri={formatDate(deNghi.ngayDuyet)} />
          <Dong
            icon={Clock}
            nhan="Cập nhật gần nhất"
            giaTri={
              deNghi.lichSu.length > 0
                ? formatDate(deNghi.lichSu[deNghi.lichSu.length - 1].thoiDiem)
                : "—"
            }
          />
        </CardContent>
      </Card>

      {/* ---- TIẾN TRÌNH CÁC GIAI ĐOẠN ---- */}
      <Card>
        <CardContent className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold tracking-wide text-text-desc uppercase">
            Tiến trình các giai đoạn
          </span>
          <ol className="flex flex-col gap-1.5">
            {chuoi.map((g, i) => {
              const daQua = viTri >= 0 && i < viTri;
              const hienTai = i === viTri;
              return (
                <li key={g.ma} className="flex items-start gap-2.5">
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      hienTai
                        ? "bg-primary text-white"
                        : daQua
                          ? "bg-success text-white"
                          : "bg-muted text-text-desc"
                    }`}
                    aria-hidden
                  >
                    {daQua ? "✓" : i + 1}
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span
                      className={`text-xs ${
                        hienTai ? "font-semibold text-text-primary" : "text-text-secondary"
                      }`}
                    >
                      {g.nhan}
                    </span>
                    {hienTai && (
                      <span className="text-[11px] text-primary">Đang ở bước này</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function Dong({
  icon: Icon,
  nhan,
  giaTri,
}: {
  icon: typeof Hash;
  nhan: string;
  giaTri: string;
}) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-text-desc" aria-hidden />
      <span className="shrink-0 text-text-desc">{nhan}</span>
      <span className="ml-auto text-right font-medium text-text-primary">{giaTri}</span>
    </div>
  );
}
