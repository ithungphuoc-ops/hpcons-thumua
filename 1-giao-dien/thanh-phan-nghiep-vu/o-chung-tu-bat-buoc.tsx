"use client";

// ============================================================
// Ô ĐÍNH KÈM MỘT CHỨNG TỪ CÓ TÊN — dùng cho Hợp đồng · Hóa đơn VAT · Ủy nhiệm chi
//
// ★ Chỉ đạo Ban lãnh đạo 22/08/2026 (xem `2-quy-trinh/chung-tu-cuoi-quy-trinh.ts`).
//
// 🔴 VÌ SAO KHÔNG DÙNG `KhuDinhKemGiaiDoan` CÓ SẴN: khu đó là một DANH SÁCH TỆP KHÔNG TÊN — bỏ
// bao nhiêu tệp cũng được, không tệp nào là bắt buộc, và không cách nào biết tệp nào là hợp đồng.
// Mà ba chứng từ này phải trả lời được câu "đã có chưa" để chặn chuyển bước. Nên cần ô CÓ TÊN,
// đúng cách khu báo giá đang làm: nhãn nằm trong `ghiChu` của tệp.
//
// 🔴 GHI BẰNG `datTepVaoOGiaiDoan`, KHÔNG PHẢI `themTepGiaiDoan` + đặt ghi chú:
// hai lần ghi liên tiếp thì lần sau đọc `deNghiRef.current` trước khi React vẽ lại, nên nhãn
// **rơi mất im lặng** — đã dính đúng lỗi này ngày 20/08/2026 với các ô báo giá, tệp đính vào rồi
// mà app coi như chưa có gì.
// ============================================================

import { useState } from "react";
import { FileCheck2 } from "lucide-react";
import { ODinhKemTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import type { DeNghiMuaHang, MoTaTep } from "@/3-du-lieu/kieu-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";

export function OChungTuBatBuoc({
  deNghi,
  maGiaiDoan,
  nhanO,
  tieuDe,
  moTa,
  batBuoc = false,
  duocSua,
  khoa = false,
  /** Tệp đã có của ô này — nơi gọi tự lọc bằng hàm thuần ở `chung-tu-cuoi-quy-trinh.ts`. */
  tepDaCo,
}: {
  deNghi: DeNghiMuaHang;
  maGiaiDoan: string;
  nhanO: string;
  tieuDe: string;
  moTa?: string;
  batBuoc?: boolean;
  duocSua: boolean;
  khoa?: boolean;
  tepDaCo: MoTaTep[];
}) {
  const { datTepVaoOGiaiDoan, goTepGiaiDoan } = useDuLieu();
  const { nguoiDung } = useNguoiDung();
  /* Nhiều bản của cùng một loại chứng từ là chuyện thường: đơn tách cho hai nhà cung cấp thì có
     hai hóa đơn VAT. Nên ô này cho thêm bản nữa, không chỉ một tệp. */
  const [themBanNua, setThemBanNua] = useState(false);

  const nguoi = { uid: nguoiDung.uid, ten: nguoiDung.tenHienThi };

  function luu(tep: MoTaTep, thayBanCu: MoTaTep | undefined): string | null {
    /* `datTepVaoOGiaiDoan` tự gỡ bản cũ CÙNG NHÃN — nên khi muốn giữ nhiều bản, phải đặt nhãn
       khác nhau cho từng bản (`Hợp đồng`, `Hợp đồng (2)`…). Đó là lý do có tham số `thayBanCu`:
       thay thì dùng đúng nhãn cũ, thêm mới thì sinh nhãn tiếp theo. */
    const nhan = thayBanCu
      ? (thayBanCu.ghiChu ?? nhanO)
      : tepDaCo.length === 0
        ? nhanO
        : `${nhanO} (${tepDaCo.length + 1})`;
    const loi = datTepVaoOGiaiDoan(deNghi.id, maGiaiDoan, tep, nhan, nguoiDung.tenHienThi);
    if (loi === null) setThemBanNua(false);
    return loi;
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <FileCheck2 className="size-4 shrink-0 text-text-desc" aria-hidden />
        <span className="text-sm font-semibold text-text-primary">{tieuDe}</span>
        {batBuoc && (
          <span className="rounded-md bg-danger/10 px-1.5 py-0.5 text-xs font-medium text-danger">
            Bắt buộc
          </span>
        )}
        {!batBuoc && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-text-secondary">
            Nếu có
          </span>
        )}
      </div>
      {moTa && <p className="text-xs text-text-desc">{moTa}</p>}

      {/* Các bản đã có — mỗi bản một ô, thay được từng bản. */}
      {tepDaCo.map((t) => (
        <ODinhKemTep
          key={t.id}
          tep={t}
          nhanThem={tieuDe}
          nguoi={nguoi}
          onXong={(moi) => luu(moi, t)}
          khoa={khoa || !duocSua}
          anHuongDan
          onXoa={
            duocSua && !khoa
              ? () => {
                  goTepGiaiDoan(deNghi.id, maGiaiDoan, t.id, nguoiDung.tenHienThi);
                }
              : undefined
          }
        />
      ))}

      {/* Ô trống để thêm bản mới. Chưa có bản nào thì luôn hiện; đã có rồi thì chỉ hiện khi người
          dùng bấm "Thêm bản nữa" — bày sẵn ô trống dưới mỗi bản làm khối dài ra vô ích. */}
      {(tepDaCo.length === 0 || themBanNua) && (
        <ODinhKemTep
          nhanThem={tieuDe}
          nguoi={nguoi}
          onXong={(moi) => luu(moi, undefined)}
          batBuoc={batBuoc && tepDaCo.length === 0}
          khoa={khoa || !duocSua}
          anHuongDan={tepDaCo.length > 0}
        />
      )}

      {tepDaCo.length > 0 && !themBanNua && duocSua && !khoa && (
        <button
          type="button"
          onClick={() => setThemBanNua(true)}
          className="min-h-11 w-fit text-left text-xs font-medium text-primary underline-offset-2 hover:underline md:min-h-9"
        >
          + Thêm bản nữa
        </button>
      )}
    </section>
  );
}
