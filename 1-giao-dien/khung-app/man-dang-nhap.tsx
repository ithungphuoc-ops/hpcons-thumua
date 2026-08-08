"use client";

import Image from "next/image";
import { useState } from "react";
import { LogIn, ShieldAlert } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { MAT_KHAU_CHAY_THU, NHAN_CAP_QUYEN, VAI_TRO_MAU } from "@/4-phan-quyen/quyen";

/**
 * MÀN ĐĂNG NHẬP — cửa vào app.
 *
 * Hiện thay cho toàn bộ nội dung khi chưa đăng nhập (xem `khung-tong.tsx`).
 *
 * 🔴 Đây là đăng nhập GIẢ LẬP của bản chạy thử: xác thực chạy trong trình duyệt,
 * mật khẩu nằm sẵn trong mã nguồn. Nó chặn người vào nhầm, KHÔNG chặn người cố tình.
 * Bảo mật thật cần Firebase Authentication + Firestore Security Rules (phía máy chủ).
 * Xem ghi chú đầy đủ ở `4-phan-quyen/nguoi-dung-hien-tai.tsx`.
 */
export function ManDangNhap() {
  const { dangNhap } = useNguoiDung();
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [loi, setLoi] = useState<string | null>(null);

  function guiForm(e: React.FormEvent) {
    e.preventDefault();
    setLoi(dangNhap(tenDangNhap, matKhau));
  }

  /** Bấm một tài khoản trong bảng gợi ý là điền sẵn, khỏi gõ tay. */
  function chonNhanh(ten: string) {
    setTenDangNhap(ten);
    setMatKhau(MAT_KHAU_CHAY_THU);
    setLoi(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-4xl flex-col gap-(--hp-md-section) lg:flex-row lg:items-start">
        {/* --- Cột trái: form đăng nhập --- */}
        <section className="flex w-full flex-col gap-(--hp-md-card-gap) rounded-xl border border-border bg-card p-6 lg:max-w-sm">
          <div className="flex items-center gap-3">
            <Image src="/logo-hpc.png" alt="HP Cons" width={44} height={38} className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="text-h3 leading-tight text-text-primary">Phòng Thu mua</span>
              <span className="text-xs text-text-desc">HPCons · module Thu mua</span>
            </div>
          </div>

          <form onSubmit={guiForm} className="flex flex-col gap-(--hp-md-card-gap)">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ten-dang-nhap">Tên đăng nhập</Label>
              <Input
                id="ten-dang-nhap"
                autoFocus
                autoComplete="username"
                placeholder="truongbp"
                value={tenDangNhap}
                onChange={(e) => {
                  setTenDangNhap(e.target.value);
                  setLoi(null);
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="mat-khau">Mật khẩu</Label>
              <Input
                id="mat-khau"
                type="password"
                autoComplete="current-password"
                value={matKhau}
                onChange={(e) => {
                  setMatKhau(e.target.value);
                  setLoi(null);
                }}
              />
            </div>

            {/* Báo lỗi có cả biểu tượng và chữ, không chỉ dựa vào màu (V1.1) */}
            {loi && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-danger bg-danger-bg p-(--hp-md-row-pad) text-sm text-danger-soft"
              >
                <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {loi}
              </p>
            )}

            <Button type="submit" className="w-full">
              <LogIn className="size-4" aria-hidden />
              Đăng nhập
            </Button>
          </form>
        </section>

        {/* --- Cột phải: tài khoản chạy thử --- */}
        <section className="flex w-full flex-col gap-(--hp-md-row-gap) rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-h3 text-text-primary">Tài khoản chạy thử</h2>
            <p className="text-xs text-text-desc">
              Bấm một dòng để điền sẵn. Mật khẩu chung:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-semibold">{MAT_KHAU_CHAY_THU}</code>
            </p>
          </div>

          <ul className="flex flex-col gap-1.5">
            {VAI_TRO_MAU.map((v) => (
              <li key={v.uid}>
                <button
                  type="button"
                  onClick={() => chonNhanh(v.tenDangNhap)}
                  className="flex min-h-11 w-full flex-col items-start gap-0.5 rounded-lg border border-border p-(--hp-md-row-pad) text-left transition-colors hover:border-primary hover:bg-muted"
                >
                  <span className="flex w-full flex-wrap items-center gap-x-2 gap-y-1">
                    <code className="rounded bg-primary-bg px-1.5 py-0.5 text-xs font-semibold text-primary">
                      {v.tenDangNhap}
                    </code>
                    <span className="text-sm font-medium text-text-primary">{v.tenHienThi}</span>
                    <span className="ml-auto shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs text-text-secondary">
                      {NHAN_CAP_QUYEN[v.capTM]}
                    </span>
                  </span>
                  <span className="text-xs text-text-desc">{v.moTa}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* Nói thẳng giới hạn — để người dùng không tưởng đây là bảo mật thật */}
          <p className="rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-xs text-text-secondary">
            <strong className="text-warning-soft">Đây là đăng nhập của bản chạy thử.</strong> Việc
            kiểm tra chạy ngay trong trình duyệt nên chỉ chặn được người vào nhầm. Khi nối
            Firebase, phần này thay bằng <strong>Firebase Authentication</strong> và dữ liệu được
            chặn bằng <strong>Security Rules</strong> ở phía máy chủ.
          </p>
        </section>
      </div>
    </div>
  );
}
