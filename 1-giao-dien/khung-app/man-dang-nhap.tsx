"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDown, Eye, EyeOff, LogIn, ShieldAlert } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { CHE_DO_XAC_THUC, useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { MAT_KHAU_CHAY_THU, NHAN_CAP_QUYEN, VAI_TRO_MAU } from "@/4-phan-quyen/quyen";
import { guiThuDatLaiMatKhau } from "@/5-ket-noi/xac-thuc-firebase";

/**
 * MÀN ĐĂNG NHẬP — cửa vào app, hiện thay toàn bộ nội dung khi chưa đăng nhập
 * (xem `cong-bao-ve.tsx`).
 *
 * Bố cục hai cột kiểu app doanh nghiệp: bên trái là bảng nhận diện HP CONS, bên phải
 * là biểu mẫu. Dưới 1024px bảng nhận diện ẩn đi, chỉ còn biểu mẫu — điện thoại không
 * cần trang trí, cần nhập nhanh.
 *
 * 📌 DANH SÁCH TÀI KHOẢN THỬ ĐƯỢC THU GỌN, MẶC ĐỊNH ĐÓNG. Trước đây phơi cả 8 tài
 * khoản kèm mật khẩu ra ngoài, nhìn như bản demo chứ không phải app thật. Vẫn giữ lại
 * vì bản chạy thử cần chỗ tra tài khoản, nhưng người dùng bình thường mở lên chỉ thấy
 * một biểu mẫu sạch.
 *
 * 🔴 Đây là đăng nhập GIẢ LẬP: xác thực chạy trong trình duyệt, mật khẩu nằm sẵn trong
 * mã nguồn. Chặn được người vào nhầm, KHÔNG chặn được người cố tình. Bảo mật thật cần
 * Firebase Authentication + Firestore Security Rules — xem ghi chú đầy đủ ở
 * `4-phan-quyen/nguoi-dung-hien-tai.tsx`.
 */
export function ManDangNhap() {
  const { dangNhap, loiHoSo } = useNguoiDung();
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [hienMatKhau, setHienMatKhau] = useState(false);
  const [ghiNho, setGhiNho] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [moDanhSach, setMoDanhSach] = useState(false);
  /** Chặn bấm Đăng nhập hai lần khi đang chờ máy chủ trả lời. */
  const [dangGui, setDangGui] = useState(false);

  const laCheDoThat = CHE_DO_XAC_THUC === "firebase";

  async function guiForm(e: React.FormEvent) {
    e.preventDefault();
    if (dangGui) return;
    setDangGui(true);
    try {
      setLoi(await dangNhap(tenDangNhap, matKhau, ghiNho));
    } finally {
      setDangGui(false);
    }
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
          Một module của hệ sinh thái HPcore · Bản chạy thử
        </p>
      </aside>

      {/* ============ BIỂU MẪU ĐĂNG NHẬP ============ */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="flex w-full max-w-sm flex-col gap-(--hp-md-section)">
          {/* Logo cho màn hẹp — bảng nhận diện bên trái đã ẩn */}
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
            <h2 className="text-h2 text-text-primary">Đăng nhập</h2>
            <p className="text-sm text-text-desc">
              Dùng tài khoản nội bộ do phòng IT cấp.
            </p>
          </div>

          <form onSubmit={guiForm} className="flex flex-col gap-(--hp-md-card-gap)">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ten-dang-nhap">{laCheDoThat ? "Email" : "Tên đăng nhập"}</Label>
              <Input
                id="ten-dang-nhap"
                autoFocus
                // `type=email` để điện thoại bật đúng bàn phím có dấu @.
                type={laCheDoThat ? "email" : "text"}
                autoComplete={laCheDoThat ? "email" : "username"}
                placeholder={laCheDoThat ? "Nhập email được cấp" : "Nhập tên đăng nhập"}
                value={tenDangNhap}
                onChange={(e) => {
                  setTenDangNhap(e.target.value);
                  setLoi(null);
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="mat-khau">Mật khẩu</Label>
              {/* Nút hiện/ẩn nằm TRONG ô: gõ trên điện thoại rất dễ sai, phải xem lại được */}
              <div className="relative">
                <Input
                  id="mat-khau"
                  type={hienMatKhau ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  className="pr-11"
                  value={matKhau}
                  onChange={(e) => {
                    setMatKhau(e.target.value);
                    setLoi(null);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setHienMatKhau((v) => !v)}
                  aria-label={hienMatKhau ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-text-desc transition-colors hover:text-text-primary"
                >
                  {hienMatKhau ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )}
                </button>
              </div>
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

            {/* Báo lỗi có cả biểu tượng và chữ, không chỉ dựa vào màu (V1.1).
                `loiHoSo` là loại lỗi KHÁC: mật khẩu đúng nhưng chưa được cấp quyền vào app.
                Gộp chung một chỗ hiện thì người dùng đọc được lý do thật, thay vì bị đá về
                màn đăng nhập không hiểu vì sao. */}
            {(loi ?? loiHoSo) && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-danger bg-danger-bg p-(--hp-md-row-pad) text-sm text-danger-soft"
              >
                <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {loi ?? loiHoSo}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={dangGui}>
              <LogIn className="size-4" aria-hidden />
              {dangGui ? "Đang kiểm tra..." : "Đăng nhập"}
            </Button>
          </form>

          {/* 🔴 Chế độ thật thì nút này PHẢI làm thật. Trước đây màn hình ghi "liên hệ phòng
              IT để được cấp lại" trong khi IT không cấp lại được gì — mật khẩu là hằng số
              trong mã nguồn. Đó đúng là kiểu "giao diện hứa việc app không làm". */}
          {laCheDoThat ? (
            <button
              type="button"
              onClick={async () => {
                if (!tenDangNhap.trim()) {
                  setLoi("Nhập email của bạn vào ô phía trên rồi bấm lại.");
                  return;
                }
                const kq = await guiThuDatLaiMatKhau(tenDangNhap);
                setLoi(
                  kq.loi ??
                    "Đã gửi thư đặt lại mật khẩu. Mở hộp thư (kiểm tra cả mục Spam) và làm theo hướng dẫn.",
                );
              }}
              className="min-h-11 text-left text-xs text-text-desc underline underline-offset-2 transition-colors hover:text-text-secondary"
            >
              Quên mật khẩu? Bấm đây để nhận thư đặt lại.
            </button>
          ) : (
            <p className="text-xs text-text-desc">
              Quên mật khẩu? Liên hệ <strong className="text-text-secondary">phòng IT</strong> để
              được cấp lại.
            </p>
          )}

          {/* ---- Tài khoản chạy thử ----
              🔴 CHỈ hiện ở chế độ tài khoản mẫu. Chế độ thật mà còn in danh sách người dùng
              ra màn hình công khai là tự tay đưa cho người ngoài biết công ty có những ai và
              ai quyền gì — chỉ còn thiếu mật khẩu. */}
          {!laCheDoThat && (
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
                  Đăng nhập ở bản chạy thử chỉ kiểm tra trong trình duyệt. Khi nối Firebase
                  sẽ thay bằng <strong>Firebase Authentication</strong>.
                </p>
              </div>
            )}
          </div>
          )}
        </div>
      </main>
    </div>
  );
}
