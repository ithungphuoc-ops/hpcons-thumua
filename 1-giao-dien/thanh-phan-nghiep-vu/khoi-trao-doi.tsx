"use client";

import { useMemo, useRef, useState } from "react";
import { CornerDownRight, Eye, ImagePlus, Paperclip, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { HopXemTep } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xem-tep";
import { rutGonTenTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import {
  CO_TOI_DA,
  KIEU_CHO_PHEP,
  catTep,
  coTep,
  type MoTaTep,
} from "@/3-du-lieu/kho-tep";
import { formatMocThoiGian } from "@/6-tien-ich/dinh-dang";
import type { BinhLuan, DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * KHỐI TRAO ĐỔI — hai thẻ "Bình luận" và "Lịch sử hoạt động" của trang chi tiết đề nghị.
 *
 * Ban lãnh đạo 15/08/2026: *"Thêm tính năng bình luận trong quy trình này luôn, thêm mục chèn
 * hình ảnh tài liệu nữa"*.
 *
 * 🔴 VÌ SAO HAI THẺ CHỨ KHÔNG PHẢI MỘT DÒNG THỜI GIAN CHUNG. Nhật ký (`lichSu`) do app tự
 * ghi, không ai sửa được, dùng để truy trách nhiệm — đó là giá trị duy nhất của nó. Bình luận
 * là chữ người dùng gõ tay, xóa được. Trộn chung thì nhìn không ra đâu là máy ghi đâu là người
 * viết, và nhật ký mất tư cách làm bằng chứng.
 *
 * ⚠️ Lịch sử được dời NGUYÊN VẸN từ `cot-thong-tin-de-nghi.tsx` sang đây — không để hai chỗ
 * cùng hiện một danh sách, sửa một chỗ là lệch ngay.
 */
export function KhoiTraoDoi({
  deNghi,
  nguoiDung,
  onGui,
  onXoa,
}: {
  deNghi: DeNghiMuaHang;
  nguoiDung: { uid: string; ten: string };
  onGui: (noiDung: string, tep: MoTaTep[], traLoiChoId?: string) => void;
  onXoa: (binhLuanId: string) => void;
}) {
  const [the, setThe] = useState<"binh_luan" | "lich_su">("binh_luan");
  const binhLuan = useMemo(() => deNghi.binhLuan ?? [], [deNghi.binhLuan]);

  /* Gom trả lời về dưới bài gốc. Bài gốc xếp theo thời gian, trả lời nằm ngay dưới bài
     mình trả lời — đọc theo mạch hội thoại chứ không nhảy cóc. */
  const daSapXep = useMemo(() => {
    const goc = binhLuan.filter((b) => !b.traLoiChoId);
    return goc.map((g) => ({
      bai: g,
      traLoi: binhLuan.filter((b) => b.traLoiChoId === g.id),
    }));
  }, [binhLuan]);

  return (
    <section className="rounded-xl border border-border bg-card">
      {/* Hai thẻ chuyển qua lại — con số cho biết có gì bên trong mà không phải bấm vào. */}
      <div role="tablist" aria-label="Trao đổi và lịch sử" className="flex border-b border-divider">
        <TheChuyen
          dangChon={the === "binh_luan"}
          onChon={() => setThe("binh_luan")}
          nhan="Bình luận"
          soLuong={binhLuan.length}
        />
        <TheChuyen
          dangChon={the === "lich_su"}
          onChon={() => setThe("lich_su")}
          nhan="Lịch sử hoạt động"
          soLuong={deNghi.lichSu.length}
        />
      </div>

      <div className="p-(--hp-md-card-pad)">
        {the === "binh_luan" ? (
          <div className="flex flex-col gap-(--hp-md-row-gap)">
            <OSoanBinhLuan nguoiDung={nguoiDung} onGui={(nd, tep) => onGui(nd, tep)} />

            {daSapXep.length === 0 ? (
              <p className="py-2 text-sm text-text-desc">
                Chưa có bình luận nào. Trao đổi ở đây để mọi thắc mắc về hồ sơ nằm cùng một
                chỗ, khỏi phải tìm lại trong tin nhắn riêng.
              </p>
            ) : (
              <ul className="flex flex-col gap-(--hp-md-row-gap)">
                {daSapXep.map(({ bai, traLoi }) => (
                  <li key={bai.id} className="flex flex-col gap-2">
                    <MotBinhLuan
                      bai={bai}
                      laCuaToi={bai.nguoiVietUid === nguoiDung.uid}
                      onXoa={() => onXoa(bai.id)}
                      onTraLoi={(nd, tep) => onGui(nd, tep, bai.id)}
                      nguoiDung={nguoiDung}
                    />
                    {traLoi.length > 0 && (
                      <ul className="ml-6 flex flex-col gap-2 border-l-2 border-divider pl-3">
                        {traLoi.map((t) => (
                          <li key={t.id}>
                            <MotBinhLuan
                              bai={t}
                              laCuaToi={t.nguoiVietUid === nguoiDung.uid}
                              onXoa={() => onXoa(t.id)}
                              nguoiDung={nguoiDung}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <KhoiLichSu deNghi={deNghi} />
        )}
      </div>
    </section>
  );
}

/** Một thẻ ở đầu khối. Vùng chạm ≥44px theo Design System. */
function TheChuyen({
  dangChon,
  onChon,
  nhan,
  soLuong,
}: {
  dangChon: boolean;
  onChon: () => void;
  nhan: string;
  soLuong: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={dangChon}
      onClick={onChon}
      className={`flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors ${
        dangChon
          ? "border-primary text-primary"
          : "border-transparent text-text-desc hover:text-text-primary"
      }`}
    >
      {nhan}
      <span
        className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
          dangChon ? "bg-primary-bg text-primary" : "bg-muted text-text-desc"
        }`}
      >
        {soLuong}
      </span>
    </button>
  );
}

/**
 * Ô soạn bình luận + đính kèm ảnh/tài liệu.
 *
 * 🔴 CẤT TỆP TRƯỚC, GỬI SAU. Tệp được đẩy lên kho ngay lúc chọn; nếu đẩy hỏng thì báo lỗi
 * ngay tại đó và KHÔNG hiện tên tệp. Làm ngược lại (hiện tên trước, đẩy lúc bấm Gửi) là lặp
 * đúng cái bẫy của chỗ tải báo giá cũ: người dùng thấy tên tệp, tưởng đã lưu, mà nội dung thì
 * chưa đi đâu cả.
 */
function OSoanBinhLuan({
  nguoiDung,
  onGui,
  gonNhe = false,
  nhanNut = "Gửi bình luận",
  onHuy,
}: {
  nguoiDung: { uid: string; ten: string };
  onGui: (noiDung: string, tep: MoTaTep[]) => void;
  gonNhe?: boolean;
  nhanNut?: string;
  onHuy?: () => void;
}) {
  const [chu, setChu] = useState("");
  const [tep, setTep] = useState<MoTaTep[]>([]);
  const [dangCat, setDangCat] = useState(false);
  const oNhap = useRef<HTMLTextAreaElement>(null);

  /** Tối đa 5 tệp mỗi bình luận — đủ cho một bộ ảnh chụp phiếu, mà không làm hồ sơ phình. */
  const TOI_DA_TEP = 5;

  async function themTep(ds: FileList) {
    const conNhan = TOI_DA_TEP - tep.length;
    if (conNhan <= 0) {
      toast.error("Đã đủ tệp", { description: `Mỗi bình luận tối đa ${TOI_DA_TEP} tệp.` });
      return;
    }
    setDangCat(true);
    const moi: MoTaTep[] = [];
    // Xử lý từng tệp một và báo lỗi riêng: một tệp quá cỡ không được làm hỏng cả lượt chọn.
    for (const f of Array.from(ds).slice(0, conNhan)) {
      try {
        moi.push(await catTep(f, { uid: nguoiDung.uid, ten: nguoiDung.ten }));
      } catch (e) {
        toast.error(`Không đính kèm được ${f.name}`, {
          description: e instanceof Error ? e.message : "Không lưu được tệp.",
        });
      }
    }
    if (moi.length > 0) setTep((t) => [...t, ...moi]);
    setDangCat(false);
  }

  const coGiDeGui = chu.trim().length > 0 || tep.length > 0;

  function gui() {
    if (!coGiDeGui) return;
    onGui(chu, tep);
    setChu("");
    setTep([]);
    oNhap.current?.focus();
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-(--hp-md-row-pad)">
      <textarea
        ref={oNhap}
        value={chu}
        onChange={(e) => setChu(e.target.value)}
        rows={gonNhe ? 2 : 3}
        placeholder={
          gonNhe ? "Trả lời…" : "Viết trao đổi về hồ sơ này — hỏi, nhắc việc, ghi chú kết quả…"
        }
        className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled focus:border-primary focus:outline-none"
        aria-label="Nội dung bình luận"
        onKeyDown={(e) => {
          // Ctrl/⌘+Enter gửi nhanh — Enter thường vẫn xuống dòng vì bình luận hay nhiều dòng.
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") gui();
        }}
      />

      {tep.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {tep.map((t) => (
            <li
              key={t.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-success-bg py-0.5 pr-0.5 pl-2.5"
            >
              <Paperclip className="size-3 shrink-0 text-success-soft" aria-hidden />
              <span className="truncate text-xs text-text-primary" title={t.tenTep}>
                {rutGonTenTep(t.tenTep, 28)}
              </span>
              <span className="shrink-0 text-[11px] text-text-desc">{coTep(t.kichThuoc)}</span>
              <button
                type="button"
                onClick={() => setTep((x) => x.filter((y) => y.id !== t.id))}
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-text-desc transition-colors hover:bg-danger-bg hover:text-danger"
                aria-label={`Bỏ tệp ${t.tenTep}`}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition-colors ${
            dangCat
              ? "pointer-events-none opacity-60"
              : "cursor-pointer hover:border-primary hover:bg-muted"
          }`}
        >
          <input
            type="file"
            multiple
            accept={KIEU_CHO_PHEP}
            className="sr-only"
            disabled={dangCat}
            onChange={(e) => {
              const ds = e.target.files;
              // Xóa giá trị ngay để chọn lại đúng tệp vừa bỏ ra vẫn kích hoạt onChange.
              const chep = ds ? new DataTransfer() : null;
              if (ds && chep) for (const f of Array.from(ds)) chep.items.add(f);
              e.target.value = "";
              if (chep && chep.files.length > 0) void themTep(chep.files);
            }}
          />
          <ImagePlus className="size-4 shrink-0" aria-hidden />
          {dangCat ? "Đang lưu tệp…" : "Ảnh / tài liệu"}
        </label>

        {onHuy && (
          <Button variant="outline" onClick={onHuy}>
            Hủy
          </Button>
        )}

        <Button className="ml-auto" disabled={!coGiDeGui || dangCat} onClick={gui}>
          <Send className="size-4" aria-hidden />
          {nhanNut}
        </Button>
      </div>

      {/* Nói rõ giới hạn ngay chỗ dùng, đừng để người dùng phát hiện bằng cách gặp lỗi. */}
      <p className="text-xs text-text-desc">
        Nhận ảnh, PDF, Word, Excel · tối đa {CO_TOI_DA / 1024 / 1024}MB mỗi tệp, {TOI_DA_TEP} tệp
        mỗi bình luận. Tệp lưu lên máy chủ nên người khác mở xem được. Ctrl+Enter để gửi nhanh.
      </p>
    </div>
  );
}

/** Một bài bình luận, kèm tệp đính kèm và nút trả lời / xóa. */
function MotBinhLuan({
  bai,
  laCuaToi,
  onXoa,
  onTraLoi,
  nguoiDung,
}: {
  bai: BinhLuan;
  laCuaToi: boolean;
  onXoa: () => void;
  onTraLoi?: (noiDung: string, tep: MoTaTep[]) => void;
  nguoiDung: { uid: string; ten: string };
}) {
  const [dangTraLoi, setDangTraLoi] = useState(false);
  const [xemTep, setXemTep] = useState<MoTaTep | null>(null);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-(--hp-md-row-pad)">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-sm font-semibold text-text-primary">{bai.nguoiVietTen}</span>
        <span className="font-mono text-xs text-text-desc tabular-nums">
          {formatMocThoiGian(bai.thoiDiem)}
        </span>
        {laCuaToi && (
          <button
            type="button"
            onClick={onXoa}
            className="ml-auto inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs text-text-desc transition-colors hover:bg-danger-bg hover:text-danger"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Xóa
          </button>
        )}
      </div>

      {/* `whitespace-pre-wrap` để giữ đúng cách xuống dòng người viết đã gõ. */}
      {bai.noiDung && (
        <p className="text-sm whitespace-pre-wrap text-text-secondary">{bai.noiDung}</p>
      )}

      {(bai.tep ?? []).length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {(bai.tep ?? []).map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setXemTep(t)}
                className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary"
              >
                <Eye className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate" title={t.tenTep}>
                  {rutGonTenTep(t.tenTep, 32)}
                </span>
                <span className="shrink-0 text-text-desc">{coTep(t.kichThuoc)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {onTraLoi && !dangTraLoi && (
        <button
          type="button"
          onClick={() => setDangTraLoi(true)}
          className="inline-flex w-fit min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-text-desc transition-colors hover:bg-muted hover:text-primary"
        >
          <CornerDownRight className="size-3.5" aria-hidden />
          Trả lời
        </button>
      )}

      {onTraLoi && dangTraLoi && (
        <OSoanBinhLuan
          gonNhe
          nhanNut="Gửi trả lời"
          nguoiDung={nguoiDung}
          onHuy={() => setDangTraLoi(false)}
          onGui={(nd, tep) => {
            onTraLoi(nd, tep);
            setDangTraLoi(false);
          }}
        />
      )}

      {xemTep && (
        <HopXemTep tep={xemTep} mo onDong={() => setXemTep(null)} />
      )}
    </div>
  );
}

/** Nhật ký thao tác — dời nguyên vẹn từ `cot-thong-tin-de-nghi.tsx`. */
function KhoiLichSu({ deNghi }: { deNghi: DeNghiMuaHang }) {
  if (deNghi.lichSu.length === 0) {
    return <p className="text-sm text-text-desc">Chưa có thao tác nào được ghi lại.</p>;
  }
  return (
    <>
      {/* Mới nhất lên đầu — người xem thường quan tâm việc vừa xảy ra. */}
      <ul className="flex flex-col gap-2.5">
        {[...deNghi.lichSu].reverse().map((m, i) => (
          <li key={i} className="flex flex-col gap-0.5 text-sm leading-tight">
            <span className="font-mono text-xs text-text-desc tabular-nums">
              {formatMocThoiGian(m.thoiDiem)}
            </span>
            <span className="text-text-secondary">
              <strong className="font-medium text-text-primary">{m.nguoiThucHien}</strong>{" "}
              {m.hanhDong}
            </span>
            {m.ghiChu && <span className="text-text-desc italic">{m.ghiChu}</span>}
          </li>
        ))}
      </ul>
      <p className="mt-2.5 border-t border-divider pt-2 text-xs text-text-desc">
        Nhật ký do hệ thống tự ghi, không sửa được. Giờ theo múi giờ Việt Nam (UTC+7).
      </p>
    </>
  );
}
