"use client";

import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { DuLieuProvider } from "@/3-du-lieu/kho-du-lieu";
import { KhoNguCanh } from "@/1-giao-dien/khung-app/kho-ngu-canh";

// ============================================================
// NÚT LỌC EQUI Ở BA MÀN DÙNG CHUNG — Sếp duyệt demo EQUI v2 14/10/2026 (câu 2, câu 3 chọn A)
//
// Theo dõi đơn hàng · Theo dõi đề nghị · Công nợ nhà cung cấp có thêm nút "EQUI": bấm vào thì màn đó
// hiện dữ liệu của KHO EQUI (kho riêng), bấm "Thường" thì về kho thường. Các nút khác giữ nguyên.
//
// 🔴 CÁCH LÀM: bọc màn bằng một `DuLieuProvider kho="equi"` LỒNG BÊN TRONG provider của kho thường, chỉ
// khi đang xem EQUI. Màn hình vẫn gọi `useDuLieu()` như cũ nhưng nhận dữ liệu EQUI — nên KHÔNG phải sửa
// logic của ba màn, và mọi thao tác ghi (vd ghi đợt thanh toán ở Công nợ) đi vào ĐÚNG kho đang xem.
// Chống ghi nhầm kho là lý do chọn cách này thay cho việc "gộp hai kho vào một danh sách".
//
// ⚠️ ĐÃ BỎ Ô "TẤT CẢ" CỦA DEMO Ở MÀN CÔNG NỢ: gộp hai kho thành một bảng thì dòng EQUI vẫn ghi vào kho
// thường khi người dùng nhập "Đã trả" — tiền vào nhầm sổ. Cần làm thì làm bản CHỈ ĐỌC, có Sếp duyệt riêng.
//
// 📌 Trạng thái nằm ở `?kho=equi` trên địa chỉ để F5 và gửi link vẫn đúng kho. `?kho=` lạ → kho thường.
// ============================================================

const THAM_SO = "kho";

function docKhoTuDiaChi(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(THAM_SO) === "equi";
}

/** Hai nút "Thường" / "EQUI" — đặt vào khu `actions` của `PageHeader`, luôn hiện kể cả khi danh sách trống. */
function NutLocKho({ dangEqui, doi }: { dangEqui: boolean; doi: (equi: boolean) => void }) {
  const lop = (chon: boolean, mauEqui = false) =>
    `inline-flex min-h-11 items-center rounded-lg border px-3 text-sm font-medium transition-colors ${
      chon
        ? "border-primary bg-primary-bg text-primary"
        : mauEqui
          ? "border-primary text-primary hover:bg-primary-bg"
          : "border-border text-text-secondary hover:border-primary hover:text-primary"
    }`;
  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Loại hồ sơ">
      <span className="text-xs font-semibold tracking-wide text-text-desc uppercase">Phân loại</span>
      <button type="button" role="tab" aria-selected={!dangEqui} onClick={() => doi(false)} className={lop(!dangEqui)}>
        Thường
      </button>
      <button type="button" role="tab" aria-selected={dangEqui} onClick={() => doi(true)} className={lop(dangEqui, true)}>
        EQUI
      </button>
    </div>
  );
}

/**
 * Bọc một màn hình. `Trang` nhận prop `boLocKho` (nút lọc) để đưa vào `PageHeader.actions`.
 * Đang xem EQUI → dựng lại màn dưới provider EQUI (`key` buộc dựng mới, state của kho thường không rơi sang).
 */
export function VoLocKho({ Trang }: { Trang: ComponentType<{ boLocKho?: ReactNode }> }) {
  const [dangEqui, setDangEqui] = useState(false);

  /* Đọc `?kho=` SAU khi gắn vào trang (không đọc lúc khởi tạo state) — lần vẽ đầu ở máy chủ không có
     `window`, đọc sớm là lệch giữa máy chủ và trình duyệt. */
  useEffect(() => setDangEqui(docKhoTuDiaChi()), []);

  const doi = useCallback((equi: boolean) => {
    setDangEqui(equi);
    const url = new URL(window.location.href);
    if (equi) url.searchParams.set(THAM_SO, "equi");
    else url.searchParams.delete(THAM_SO);
    window.history.replaceState(window.history.state, "", url.toString());
  }, []);

  const nut = <NutLocKho dangEqui={dangEqui} doi={doi} />;

  if (!dangEqui) return <Trang boLocKho={nut} />;
  return (
    <KhoNguCanh.Provider value="equi">
      <DuLieuProvider key="equi" kho="equi">
        <Trang boLocKho={nut} />
      </DuLieuProvider>
    </KhoNguCanh.Provider>
  );
}
