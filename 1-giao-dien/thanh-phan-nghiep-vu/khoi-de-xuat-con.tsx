"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronUp, GitBranch } from "lucide-react";
import { BangNangLucTheoNhanVien } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-nang-luc-theo-nhan-vien";
import { tenTheDeNghi } from "@/2-quy-trinh/ten-the-de-nghi";
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

  /**
   * ★ CẢ PHIẾU CHÁU, XẾP THEO CÂY — Sếp 26/09/2026 (nhân bản theo NCC, mục (3)).
   *
   * `deNghiCon` nay gồm cả bản nhân bản TỪ một phiếu con (vd phiếu giao việc `…__A` rồi A tách tiếp
   * theo NCC). Xếp theo cây (con → cháu của nó) và thụt lề theo tầng để người đọc thấy ai tách từ
   * ai; phiếu cũ chỉ nối qua `deNghiGocId` (không có cha trực tiếp) đứng cuối, tầng 1.
   */
  const theoCay = useMemo(() => {
    const ra: { con: DeNghiMuaHang; tang: number }[] = [];
    const daXep = new Set<string>();
    const duyet = (chaId: string, tang: number) => {
      for (const c of deNghiCon) {
        if (c.deNghiChaId !== chaId || daXep.has(c.id)) continue;
        daXep.add(c.id);
        ra.push({ con: c, tang });
        duyet(c.id, tang + 1);
      }
    };
    duyet(deNghi.id, 1);
    for (const c of deNghiCon) {
      if (daXep.has(c.id)) continue;
      daXep.add(c.id);
      ra.push({ con: c, tang: 1 });
      duyet(c.id, 2);
    }
    return ra;
  }, [deNghi.id, deNghiCon]);
  const soChau = theoCay.filter((x) => x.tang > 1).length;
  const maTheoId = useMemo(() => new Map(deNghiCon.map((c) => [c.id, c.code])), [deNghiCon]);

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
          {soChau > 0 ? ` (gồm ${soChau} phiếu cháu)` : ""}
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
            {theoCay.map(({ con, tang }) => {
              /**
               * ★ DÒNG NÀO CỦA PHIẾU ĐANG MỞ ĐÃ SANG BẢN NÀY — Sếp 15/09/2026, mở rộng 26/09/2026.
               *
               * · Bản con TRỰC TIẾP (`deNghiChaId` = phiếu đang mở): đọc `sttDongCha` — đúng số dòng
               *   của phiếu này, kèm khối lượng lấy đi (`khoiLuongTuCha`) và phần mua vượt.
               * · Bản cũ chỉ nối qua `deNghiGocId`: đọc `sttDongGoc` như trước.
               * · Phiếu CHÁU: số dòng nói về phiếu cha của nó (không phải phiếu đang mở) → chỉ ghi
               *   "tách từ {mã cha}", KHÔNG ghi số dòng — ghi là chỉ sai dòng vật tư.
               */
              const trucTiep = con.deNghiChaId === deNghi.id;
              const laChau = tang > 1;
              const dongNhan = laChau
                ? []
                : con.items
                    .map((x) => ({
                      stt: trucTiep ? x.sttDongCha : con.deNghiChaId ? undefined : x.sttDongGoc,
                      tuCha: trucTiep ? x.khoiLuongTuCha : undefined,
                      vuot: trucTiep ? Number(x.khoiLuongVuotCha) || 0 : 0,
                      dv: x.donViTinh,
                    }))
                    .filter((x): x is { stt: number; tuCha: number | undefined; vuot: number; dv: string } =>
                      typeof x.stt === "number",
                    )
                    .sort((a, b) => a.stt - b.stt);
              return (
                <li
                  key={con.id}
                  className={`flex min-w-0 flex-wrap items-center gap-x-2 text-sm ${
                    tang === 2 ? "pl-4" : tang > 2 ? "pl-8" : ""
                  }`}
                >
                  <Link
                    href={`/de-nghi/${con.id}`}
                    className="font-medium text-primary hover:underline"
                    title={con.code}
                  >
                    {/* 🔴 MÃ KIỂM SOÁT, KHÔNG PHẢI `con.code` — Sếp 17/09/2026: *"Hãy lấy mã
                        hợp đồng + mã đề nghị để nhân viên dễ kiểm soát"*. `code` là mã nội bộ của
                        app thu mua; thứ nhân viên tra trên giấy tờ là số hợp đồng + mã 6 số.
                        📌 `title` giữ `code` để ai quen mã cũ rê chuột vẫn tra ra. */}
                    {/* 🔴 CÙNG CÁCH VỚI DÒNG "Tách ra từ đề xuất" ở trang chi tiết — Sếp 17/09/2026:
                        *"hiển thị Mã đề nghị + Mã Hợp đồng + Tên công trình, giống tên tiêu đề của quy trình"*.
                        Hai khối này nói về cùng một quan hệ cha–con, ghi hai kiểu là người đọc phải tự ghép.
                        📌 `title` giữ `code` để ai quen mã cũ rê chuột vẫn tra ra. */}
                    {tenTheDeNghi(con)}
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
                  {laChau && con.deNghiChaId && (
                    <span className="basis-full text-xs text-text-secondary">
                      Phiếu cháu — tách từ {maTheoId.get(con.deNghiChaId) ?? con.deNghiChaId}
                    </span>
                  )}
                  {dongNhan.length > 0 && (
                    <span className="basis-full text-xs text-text-secondary">
                      Đã nhận dòng{" "}
                      {dongNhan
                        .map(
                          (x) =>
                            `${x.stt}. ${tenDongGoc.get(x.stt) ?? "(dòng đã bỏ)"}` +
                            (typeof x.tuCha === "number" ? ` (${x.tuCha} ${x.dv})` : " (cả dòng)") +
                            (x.vuot > 0 ? ` + mua vượt ${x.vuot} ${x.dv}` : ""),
                        )
                        .join(" · ")}{" "}
                      của phiếu này — dòng đi hết thì được làm mờ, dòng chỉ tách một phần thì phiếu
                      này tự mua phần còn lại.
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
