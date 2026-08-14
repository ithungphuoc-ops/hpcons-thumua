"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Search, ShoppingCart, Tags, X } from "lucide-react";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  NHAN_LOAI_HO_SO,
  SO_KY_TU_TOI_THIEU,
  timHoSo,
  type LoaiHoSo,
} from "@/2-quy-trinh/tim-kiem";

/**
 * Ô TÌM KIẾM HỒ SƠ trên thanh trên.
 *
 * Đây là đường vào thay cho 3 mục menu đã bỏ (Phân bổ · Đơn đặt hàng · Báo giá) —
 * chỉ đạo Ban lãnh đạo 06/08/2026: "tra dữ liệu dựa vào mã số lấy từ Request".
 *
 * Luật tìm và LỌC THEO QUYỀN nằm ở `2-quy-trinh/tim-kiem.ts`, không tính ở đây.
 *
 * Bàn phím: ↑ ↓ chọn · Enter mở · Esc đóng. Có bàn phím thì thao tác nhanh hơn chuột
 * với người nhập liệu cả ngày, và cũng là yêu cầu tiếp cận của Design System V1.1.
 */
export function OTimKiem() {
  const router = useRouter();
  const { deNghi, donHang, baoGia } = useDuLieu();
  const { quyen, nguoiDung } = useNguoiDung();

  const [tuKhoa, setTuKhoa] = useState("");
  const [dangMo, setDangMo] = useState(false);
  const [viTri, setViTri] = useState(0);
  const boc = useRef<HTMLDivElement>(null);

  // Truyền uid vì luật xem báo giá còn xét theo TỪNG hồ sơ (ai được chia việc / ai theo dõi),
  // không chỉ theo cấp quyền.
  const { ketQua, tongKhop } = useMemo(
    () => timHoSo(tuKhoa, { deNghi, donHang, baoGia }, quyen, nguoiDung.uid),
    [tuKhoa, deNghi, donHang, baoGia, quyen, nguoiDung.uid],
  );

  // Bấm ra ngoài thì đóng hộp gợi ý.
  useEffect(() => {
    if (!dangMo) return;
    const khiBam = (e: MouseEvent) => {
      if (boc.current && !boc.current.contains(e.target as Node)) setDangMo(false);
    };
    document.addEventListener("mousedown", khiBam);
    return () => document.removeEventListener("mousedown", khiBam);
  }, [dangMo]);

  // Gõ lại thì con trỏ chọn về đầu danh sách, tránh Enter mở nhầm hồ sơ cũ.
  useEffect(() => setViTri(0), [tuKhoa]);

  function mo(duongDan: string) {
    setDangMo(false);
    setTuKhoa("");
    router.push(duongDan);
  }

  function khiGoPhim(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setDangMo(false);
      return;
    }
    if (ketQua.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setViTri((v) => (v + 1) % ketQua.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setViTri((v) => (v - 1 + ketQua.length) % ketQua.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      mo(ketQua[viTri].duongDan);
    }
  }

  const daGoDu = tuKhoa.trim().length >= SO_KY_TU_TOI_THIEU;
  const hienHop = dangMo && tuKhoa.trim().length > 0;

  return (
    <div ref={boc} className="relative hidden max-w-sm flex-1 sm:block">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-desc" />
      <Input
        value={tuKhoa}
        onChange={(e) => {
          setTuKhoa(e.target.value);
          setDangMo(true);
        }}
        onFocus={() => setDangMo(true)}
        onKeyDown={khiGoPhim}
        placeholder="Tìm mã hồ sơ, công trình, vật liệu..."
        className="pl-9 pr-9"
        aria-label="Tìm hồ sơ theo mã"
        role="combobox"
        aria-expanded={hienHop}
        aria-controls="ket-qua-tim-kiem"
      />
      {tuKhoa !== "" && (
        <button
          type="button"
          onClick={() => {
            setTuKhoa("");
            setDangMo(false);
          }}
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-text-desc transition-colors hover:bg-muted hover:text-text-primary"
          aria-label="Xóa từ khóa tìm kiếm"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}

      {hienHop && (
        <div
          id="ket-qua-tim-kiem"
          role="listbox"
          className="absolute top-full left-0 z-30 mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          {!daGoDu ? (
            <p className="px-3 py-3 text-sm text-text-desc">
              Gõ ít nhất {SO_KY_TU_TOI_THIEU} ký tự.
            </p>
          ) : ketQua.length === 0 ? (
            <p className="px-3 py-3 text-sm text-text-desc">
              Không tìm thấy hồ sơ nào khớp “{tuKhoa.trim()}”.
            </p>
          ) : (
            <>
              <ul className="max-h-[60vh] overflow-y-auto py-1">
                {ketQua.map((r, i) => (
                  <li key={`${r.loai}-${r.id}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === viTri}
                      onMouseEnter={() => setViTri(i)}
                      onClick={() => mo(r.duongDan)}
                      className={`flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                        i === viTri ? "bg-primary-bg" : "hover:bg-muted"
                      }`}
                    >
                      <BieuTuong loai={r.loai} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-text-primary">
                          {r.ma}
                        </span>
                        <span className="truncate text-xs text-text-desc">
                          {r.tieuDe} · {r.moTaPhu}
                        </span>
                      </span>
                      {/* Nhãn loại hồ sơ luôn có CHỮ, không chỉ dựa vào icon (V1.1) */}
                      <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs text-text-secondary">
                        {NHAN_LOAI_HO_SO[r.loai]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {/* Cắt bớt thì phải nói ra, không im lặng giấu kết quả */}
              {tongKhop > ketQua.length && (
                <p className="border-t border-divider px-3 py-2 text-xs text-text-desc">
                  Đang hiện {ketQua.length} trong {tongKhop} hồ sơ khớp — gõ thêm cho gọn kết quả.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function BieuTuong({ loai }: { loai: LoaiHoSo }) {
  const lop = "size-4 shrink-0 text-text-desc";
  if (loai === "don_hang") return <ShoppingCart className={lop} aria-hidden />;
  if (loai === "bao_gia") return <Tags className={lop} aria-hidden />;
  return <FileText className={lop} aria-hidden />;
}
