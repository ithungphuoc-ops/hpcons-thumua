"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronUp, GitBranch } from "lucide-react";
import { BangNangLucTheoNhanVien } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-nang-luc-theo-nhan-vien";
import type {
  BaoGia,
  DeNghiMuaHang,
  DonDatHang,
  PhieuNhanHang,
} from "@/3-du-lieu/kieu-du-lieu";

/**
 * KHỐI "ĐÃ TÁCH THÀNH N ĐỀ XUẤT CON" — gập lại được.
 *
 * 🔴 Ban lãnh đạo 17/08/2026 khoanh đỏ khối này và ghi *"thêm nút group này lại"*.
 * Trước đó khối luôn bung hết: danh sách phiếu con + câu ghi chú + bảng "Ai đang làm phần
 * nào" chiếm gần nửa màn hình ngay đầu trang, đẩy toàn bộ các bước của quy trình xuống dưới
 * — mà đây là thông tin để TRA khi cần, không phải thứ phải nhìn mỗi lần mở phiếu.
 *
 * 📌 Dòng tiêu đề "Đã tách thành N đề xuất con" LUÔN hiện kể cả khi gập. Gập mà giấu luôn
 * dòng đó thì người mở phiếu không biết phiếu này đã được tách — tưởng khối lượng trên màn
 * là toàn bộ, trong khi phần lớn việc đã nằm ở các phiếu con.
 *
 * ⚠️ Không dùng lại `KhoiGap` dùng chung: khối đó có nền `bg-surface` và viền xám của một
 * thẻ đứng riêng, còn khối này nằm BÊN TRONG "Thông tin đề nghị" nên phải giữ nền xanh nhạt
 * `bg-primary-bg` để thấy nó là một chú thích của phiếu, không phải một mục ngang hàng.
 */
export function KhoiDeXuatCon({
  deNghi,
  deNghiCon,
  donHang,
  baoGia,
  phieuNhan,
  hienBangNangLuc,
}: {
  /** Phiếu gốc đang mở. */
  deNghi: DeNghiMuaHang;
  /** Các phiếu đã tách ra từ phiếu gốc. */
  deNghiCon: DeNghiMuaHang[];
  donHang: DonDatHang[];
  baoGia: BaoGia[];
  phieuNhan: PhieuNhanHang[];
  /**
   * Có hiện bảng tổng hợp theo người hay không.
   *
   * 🔒 Chỉ người phân bổ công việc (trưởng bộ phận, quản trị) mới được xem: đây là số liệu
   * về người khác, nhân viên nhìn nhau qua bảng này dễ sinh so bì mà số liệu lại chưa tính
   * độ khó từng phần việc.
   */
  hienBangNangLuc: boolean;
}) {
  /**
   * Mặc định GẬP.
   *
   * Đây là lý do Ban lãnh đạo yêu cầu thêm nút: để khối này thôi chiếm chỗ. Mở sẵn rồi bắt
   * người dùng bấm gập mỗi lần vào phiếu thì nút coi như không có tác dụng.
   */
  const [mo, doiMo] = useState(false);

  return (
    <div className="mt-2 rounded-lg border border-primary/30 bg-primary-bg text-sm">
      {/* Dùng `<button>` thật chứ không phải `<div onClick>` — bàn phím phải Tab tới và
          Enter được, trình đọc màn hình đọc được trạng thái qua `aria-expanded`. */}
      <button
        type="button"
        onClick={() => doiMo((v) => !v)}
        aria-expanded={mo}
        className="flex min-h-11 w-full items-center gap-2 p-(--hp-md-row-pad) text-left"
      >
        <GitBranch className="size-4 shrink-0 text-primary" aria-hidden />
        <span className="font-semibold text-text-primary">
          Đã tách thành {deNghiCon.length} đề xuất con
        </span>
        {/* Nhãn nhắc còn gì bên trong khi đang gập — người dùng biết bấm ra sẽ thấy gì,
            không phải mở thử. */}
        {!mo && (
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-text-secondary">
            {hienBangNangLuc ? "Xem danh sách · ai đang làm phần nào" : "Xem danh sách"}
          </span>
        )}
        <ChevronUp
          className={`ml-auto size-4 shrink-0 text-text-desc transition-transform ${
            mo ? "" : "rotate-180"
          }`}
          aria-hidden
        />
      </button>

      {mo && (
        <div className="flex flex-col gap-1.5 border-t border-primary/20 p-(--hp-md-row-pad) pt-2">
          <ul className="flex flex-col gap-1">
            {deNghiCon.map((con) => (
              <li key={con.id} className="flex min-w-0 flex-wrap items-center gap-x-2 text-sm">
                <Link
                  href={`/de-nghi/${con.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {con.code}
                </Link>
                <span className="truncate text-xs text-text-desc">
                  {con.items.length} mặt hàng
                  {/* Người phụ trách của phiếu con — biết ai đang làm phần nào mà không
                      phải mở từng phiếu ra xem. */}
                  {(() => {
                    const ds = [
                      ...new Set(
                        con.items
                          .map((x) => x.nguoiPhuTrachTen)
                          .filter((x): x is string => Boolean(x)),
                      ),
                    ];
                    return ds.length > 0 ? ` · ${ds.join(", ")}` : " · chưa giao ai";
                  })()}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-text-desc">
            Khối lượng của các phiếu con <strong>không cộng vào</strong> phiếu này — mỗi phiếu
            đi một vòng mua hàng riêng.
          </p>

          {/* ★ TỔNG HỢP THEO NGƯỜI — Ban lãnh đạo 15/08/2026: tách việc rồi phải "tổng hợp
              lại được để trưởng phòng đánh giá năng lực nhân viên". */}
          {hienBangNangLuc && (
            <div className="mt-1 border-t border-primary/20 pt-2">
              <BangNangLucTheoNhanVien
                nhom={[deNghi, ...deNghiCon]}
                donHang={donHang}
                baoGia={baoGia}
                phieuNhan={phieuNhan}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
