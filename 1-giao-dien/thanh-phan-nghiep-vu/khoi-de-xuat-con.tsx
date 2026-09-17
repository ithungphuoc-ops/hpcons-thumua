"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronUp, GitBranch } from "lucide-react";
import { BangNangLucTheoNhanVien } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-nang-luc-theo-nhan-vien";
import { maKiemSoatDeNghi } from "@/2-quy-trinh/ten-the-de-nghi";
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

  /**
   * ★ TRA TÊN VẬT LIỆU THEO `stt` CỦA PHIẾU GỐC — để khối này nói được **dòng nào** đã tách đi,
   * chứ không chỉ "N mặt hàng" (Sếp 15/09/2026: *"phải có điều kiện hoặc ghi chú nào đó để biết
   * rằng đề nghị đó đã được nhân bản để ko bị quên"*).
   *
   * 📌 Đọc từ `deNghi.items` (phiếu gốc đang mở) chứ không từ `con.items`: tên ở hai bên giống
   * nhau, nhưng `stt` thì KHÁC — bản con đánh số lại từ 1, còn con số người dùng đang nhìn thấy
   * trên bảng phân bổ là số của phiếu gốc. Nói số của bản con ở đây là chỉ sai dòng.
   */
  const tenDongGoc = useMemo(
    () => new Map(deNghi.items.map((d) => [d.stt, d.tenVatLieu])),
    [deNghi.items],
  );

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
            {deNghiCon.map((con) => {
              /**
               * ★ DÒNG NÀO CỦA PHIẾU GỐC ĐÃ SANG BẢN NÀY — Sếp 15/09/2026.
               *
               * ⚠️ CHỈ CÓ VỚI BẢN NHÂN BẢN TAY. `sttDongGoc` do `nhanBanDeNghi` ghi; phiếu con
               * sinh ra bằng TÁCH TỰ ĐỘNG theo phân công (`tachTheoPhanBo`) **cố ý không ghi**
               * trường này — ở đó dòng bị cắt hẳn khỏi phiếu gốc và phiếu gốc đánh số lại, nên
               * số cũ trỏ nhầm dòng (lý do đầy đủ ở `kho-du-lieu.tsx`, chỗ dựng `items` của
               * `tachTheoPhanBo`). Bản con cũ hơn 15/09/2026 cũng không có.
               *
               * 👉 Không có thì KHÔNG HIỆN GÌ THÊM — thà thiếu một dòng chú thích còn hơn chỉ
               * sai dòng vật tư.
               */
              const sttGoc = [
                ...new Set(
                  con.items
                    .map((x) => x.sttDongGoc)
                    .filter((x): x is number => typeof x === "number"),
                ),
              ].sort((a, b) => a - b);
              return (
                <li key={con.id} className="flex min-w-0 flex-wrap items-center gap-x-2 text-sm">
                  <Link
                    href={`/de-nghi/${con.id}`}
                    className="font-medium text-primary hover:underline"
                    title={con.code}
                  >
                    {/* 🔴 MÃ KIỂM SOÁT, KHÔNG PHẢI `con.code` — Sếp 17/09/2026: *"Hãy lấy mã
                        hợp đồng + mã đề nghị để nhân viên dễ kiểm soát"*. `code` là mã nội bộ của
                        app thu mua; thứ nhân viên tra trên giấy tờ là số hợp đồng + mã 6 số.
                        📌 `title` giữ `code` để ai quen mã cũ rê chuột vẫn tra ra. */}
                    {maKiemSoatDeNghi(con)}
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
                  {/* `basis-full` — xuống hàng riêng: danh sách tên vật tư dài, để chung hàng với
                      mã phiếu là bị cắt mất đúng phần cần đọc. */}
                  {sttGoc.length > 0 && (
                    <span className="basis-full text-xs text-text-secondary">
                      Đã nhận dòng{" "}
                      {sttGoc.map((s) => `${s}. ${tenDongGoc.get(s) ?? "(dòng đã bỏ)"}`).join(" · ")}{" "}
                      của phiếu gốc — các dòng này ở phiếu gốc đang được làm mờ, không phải mua
                      nữa.
                    </span>
                  )}
                </li>
              );
            })}
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
