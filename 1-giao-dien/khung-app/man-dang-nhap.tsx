"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDown, Loader2, LogIn, ShieldAlert } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { CHE_DO_XAC_THUC, useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { MAT_KHAU_CHAY_THU, NHAN_CAP_QUYEN, VAI_TRO_MAU } from "@/4-phan-quyen/quyen";

/**
 * MÀN ĐĂNG NHẬP — cửa vào app, hiện thay toàn bộ nội dung khi chưa đăng nhập
 * (xem `cong-bao-ve.tsx`).
 *
 * 📌 20/08/2026 — ĐÃ NỐI SSO APP TỔNG. Chế độ `sso` KHÔNG có biểu mẫu gì cả: người chưa
 * đăng nhập được `nguoi-dung-hien-tai.tsx` tự động chuyển thẳng sang
 * `account.hpcore.vn/login` trước khi component này kịp vẽ ra màn hình. Component chỉ
 * còn hiện ra trong đúng MỘT tình huống ở chế độ `sso`: có lỗi cần báo (vd chưa được cấp
 * hồ sơ ở app này, hoặc máy chủ hỏng) — xem nhánh `laCheDoSSO` bên dưới.
 *
 * Biểu mẫu "tên đăng nhập/mật khẩu" cũ CHỈ còn giữ lại cho CHẾ ĐỘ MẪU (`mau`) — dùng để
 * xem thử giao diện trên máy chưa cấu hình Firebase/SSO, KHÔNG PHẢI bảo mật thật.
 */
export function ManDangNhap() {
  const { dangNhapMau, loiHoSo, dangXuLySSO } = useNguoiDung();
  const laCheDoSSO = CHE_DO_XAC_THUC === "sso";

  if (laCheDoSSO) {
    return <ManChoSSO dangXuLy={dangXuLySSO} loi={loiHoSo} />;
  }

  return <ManDangNhapMau dangNhapMau={dangNhapMau} />;
}

/**
 * Màn chờ/báo lỗi ở chế độ SSO — KHÔNG có ô nhập liệu nào, vì mật khẩu không còn là
 * chuyện của app này nữa. Đang xử lý thì hiện spinner (`account.hpcore.vn` đang xác minh
 * và có thể sắp điều hướng đi); có lỗi thì hiện rõ lý do + nút tải lại.
 */
function ManChoSSO({ dangXuLy, loi }: { dangXuLy: boolean; loi: string | null }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-bg p-2">
        <Image src="/logo-hpc.png" alt="HP Cons" width={40} height={34} className="h-auto w-full object-contain" priority />
      </div>
      {loi ? (
        <>
          <p role="alert" className="flex max-w-md items-start gap-2 rounded-lg border border-danger bg-danger-bg p-(--hp-md-row-pad) text-left text-sm text-danger-soft">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {loi}
          </p>
          <Button onClick={() => window.location.reload()}>
            <LogIn className="size-4" aria-hidden /> Thử lại
          </Button>
        </>
      ) : (
        <p className="flex items-center gap-2 text-sm text-text-desc" aria-busy={dangXuLy}>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Đang xác thực với App Tổng…
        </p>
      )}
    </div>
  );
}

/**
 * Biểu mẫu đăng nhập CHẾ ĐỘ MẪU — bấm chọn 1 trong các vai trò mẫu, mật khẩu chung nằm
 * sẵn trong mã nguồn. Chỉ để xem thử giao diện, KHÔNG PHẢI bảo mật thật.
 */
function ManDangNhapMau({
  dangNhapMau,
}: {
  dangNhapMau: (tenDangNhap: string, matKhau: string, ghiNho: boolean) => string | null;
}) {
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [ghiNho, setGhiNho] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [moDanhSach, setMoDanhSach] = useState(false);

  function guiForm(e: React.FormEvent) {
    e.preventDefault();
    setLoi(dangNhapMau(tenDangNhap, matKhau, ghiNho));
  }

  function chonNhanh(ten: string) {
    setTenDangNhap(ten);
    setMatKhau(MAT_KHAU_CHAY_THU);
    setLoi(null);
    setMoDanhSach(false);
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ============ BẢNG NHẬN DIỆN — ẩn dưới 1024px ============ */}
      <aside className="relative hidden w-[42%] max-w-lg flex-col justify-between bg-primary p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white p-1.5">
            <Image
              src="/logo-hpc.png"
              alt="HP Cons"
              width={36}
              height={30}
              className="h-auto w-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">CÔNG TY CP XÂY DỰNG</span>
            <span className="text-sm font-semibold">CÔNG NGHIỆP HƯNG PHƯỚC</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-display leading-tight">
            Phần mềm
            <br />
            Quản lý Thu mua
          </h1>
          <p className="max-w-sm text-sm text-white/80">
            Đề nghị mua hàng · phân bổ công việc · đơn đặt hàng · theo dõi giao nhận ·
            công nợ nhà cung cấp.
          </p>
        </div>

        <p className="text-xs text-white/60">
          Một module của hệ sinh thái HPcore · Bản chạy thử (tài khoản mẫu)
        </p>
      </aside>

      {/* ============ BIỂU MẪU ĐĂNG NHẬP MẪU ============ */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="flex w-full max-w-sm flex-col gap-(--hp-md-section)">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary-bg p-1.5">
              <Image
                src="/logo-hpc.png"
                alt="HP Cons"
                width={32}
                height={28}
                className="h-auto w-full object-contain"
              />
            </div>
            <span className="text-sm font-semibold text-text-primary">HP CONS</span>
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-h2 text-text-primary">Đăng nhập (bản chạy thử)</h2>
            <p className="text-sm text-text-desc">
              Máy này chưa cấu hình SSO App Tổng — chọn một vai trò mẫu để xem thử giao diện.
            </p>
          </div>

          <form onSubmit={guiForm} className="flex flex-col gap-(--hp-md-card-gap)">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ten-dang-nhap">Tên đăng nhập</Label>
              <Input
                id="ten-dang-nhap"
                autoFocus
                type="text"
                autoComplete="username"
                placeholder="Nhập tên đăng nhập mẫu"
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
                type="text"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={matKhau}
                onChange={(e) => {
                  setMatKhau(e.target.value);
                  setLoi(null);
                }}
              />
            </div>

            <label className="flex min-h-11 items-center gap-2.5">
              <Checkbox
                checked={ghiNho}
                onCheckedChange={(c) => setGhiNho(c === true)}
                aria-label="Duy trì đăng nhập"
              />
              <span className="flex flex-col leading-tight">
                <span className="text-sm text-text-primary">Duy trì đăng nhập</span>
                <span className="text-xs text-text-desc">
                  Không tick thì đóng trình duyệt là thoát
                </span>
              </span>
            </label>

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

          <div className="flex flex-col gap-2 border-t border-divider pt-4">
            <button
              type="button"
              onClick={() => setMoDanhSach((v) => !v)}
              aria-expanded={moDanhSach}
              className="flex min-h-11 items-center justify-between gap-2 text-left text-xs text-text-desc transition-colors hover:text-text-secondary"
            >
              <span>Bản chạy thử — xem danh sách tài khoản mẫu</span>
              <ChevronDown
                className={`size-4 shrink-0 transition-transform ${moDanhSach ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {moDanhSach && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-text-desc">
                  Mật khẩu chung:{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-semibold">
                    {MAT_KHAU_CHAY_THU}
                  </code>
                </p>
                <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                  {VAI_TRO_MAU.map((v) => (
                    <li key={v.uid}>
                      <button
                        type="button"
                        onClick={() => chonNhanh(v.tenDangNhap)}
                        className="flex min-h-11 w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg border border-border p-2 text-left transition-colors hover:border-primary hover:bg-muted"
                      >
                        <code className="rounded bg-primary-bg px-1.5 py-0.5 text-xs font-semibold text-primary">
                          {v.tenDangNhap}
                        </code>
                        <span className="text-sm text-text-primary">{v.tenHienThi}</span>
                        <span className="ml-auto shrink-0 text-xs text-text-desc">
                          {NHAN_CAP_QUYEN[v.capTM]}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-text-desc">
                  Đăng nhập ở bản chạy thử chỉ kiểm tra trong trình duyệt, KHÔNG PHẢI bảo
                  mật thật. Máy đã cấu hình SSO sẽ chuyển thẳng sang đăng nhập App Tổng.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
