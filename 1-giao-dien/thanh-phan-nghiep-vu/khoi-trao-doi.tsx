"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CornerDownRight,
  Eye,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Send,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/1-giao-dien/nen-tang-ui/dropdown-menu";
import { AnhDaiDienChu } from "@/1-giao-dien/thanh-phan-dung-chung/anh-dai-dien-chu";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { HopXemTep } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xem-tep";
import { rutGonTenTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import {
  CO_TOI_DA,
  KIEU_CHO_PHEP,
  catTep,
  coTep,
  type MoTaTep,
} from "@/3-du-lieu/kho-tep";
import { formatMocThoiGian, formatThoiGianTuongDoi } from "@/6-tien-ich/dinh-dang";
import type { BinhLuan, DeNghiMuaHang, LanSuaBinhLuan } from "@/3-du-lieu/kieu-du-lieu";

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
  onSua,
  onThuHoi,
  duocThuHoiBaiNguoiKhac = false,
}: {
  deNghi: DeNghiMuaHang;
  nguoiDung: { uid: string; ten: string };
  onGui: (noiDung: string, tep: MoTaTep[], traLoiChoId?: string) => void;
  onSua: (binhLuanId: string, noiDungMoi: string, tepThem: MoTaTep[], idTepGo: string[]) => void;
  onThuHoi: (binhLuanId: string) => void;
  /** Trưởng bộ phận / quản trị thu hồi được bài của người khác (không sửa được). */
  duocThuHoiBaiNguoiKhac?: boolean;
}) {
  const [the, setThe] = useState<"binh_luan" | "lich_su">("binh_luan");
  const binhLuan = useMemo(() => deNghi.binhLuan ?? [], [deNghi.binhLuan]);

  /**
   * Mốc "bây giờ" để tính thời gian tương đối ("3 giờ trước").
   *
   * 🔴 PHẢI LẤY SAU KHI MOUNT, không lấy lúc dựng component. App xuất trang tĩnh nên chuỗi
   * sinh lúc build khác chuỗi sinh trên máy người dùng → React báo lệch hydration. Lần vẽ đầu
   * `moc = 0` nên hiện mốc tuyệt đối; sau khi mount mới đổi sang tương đối.
   */
  const [moc, setMoc] = useState(0);
  useEffect(() => {
    setMoc(Date.now());
    // Cập nhật mỗi phút để "vừa xong" không đứng mãi khi mở trang lâu.
    const h = setInterval(() => setMoc(Date.now()), 60_000);
    return () => clearInterval(h);
  }, []);

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
                Chưa có bình luận nào.
              </p>
            ) : (
              /* Khoảng cách 20px giữa các cụm — khoảng trắng thay vai trò của viền. */
              <ul className="flex flex-col gap-5">
                {daSapXep.map(({ bai, traLoi }) => (
                  <li key={bai.id} className="flex flex-col gap-3">
                    <MotBinhLuan
                      bai={bai}
                      laCuaToi={bai.nguoiVietUid === nguoiDung.uid}
                      onSua={(nd, tepThem, idGo) => onSua(bai.id, nd, tepThem, idGo)}
                      onThuHoi={() => onThuHoi(bai.id)}
                      onTraLoi={(nd, tep) => onGui(nd, tep, bai.id)}
                      nguoiDung={nguoiDung}
                      duocThuHoiBaiNguoiKhac={duocThuHoiBaiNguoiKhac}
                      moc={moc}
                    />
                    {traLoi.length > 0 && (
                      /* Ba tín hiệu cùng lúc để thấy đây là trả lời: thụt vào đúng bề rộng cột
                         ảnh đại diện của bài gốc (mép chữ thẳng hàng), trục dọc màu chủ đạo
                         thay vì xám như mọi đường kẻ khác, và ảnh đại diện nhỏ hơn. */
                      <ul className="ml-4 flex flex-col gap-3 border-l-2 border-primary/30 pl-4 sm:ml-6">
                        {traLoi.map((t) => (
                          <li key={t.id}>
                            <MotBinhLuan
                              bai={t}
                              laTraLoi
                              laCuaToi={t.nguoiVietUid === nguoiDung.uid}
                              onSua={(nd, tepThem, idGo) => onSua(t.id, nd, tepThem, idGo)}
                              onThuHoi={() => onThuHoi(t.id)}
                              nguoiDung={nguoiDung}
                              duocThuHoiBaiNguoiKhac={duocThuHoiBaiNguoiKhac}
                              moc={moc}
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
  chuBanDau = "",
  tepHienCo = [],
}: {
  nguoiDung: { uid: string; ten: string };
  /** `idTepGo` chỉ có khi đang SỬA — id các tệp cũ người dùng gỡ khỏi bài. */
  onGui: (noiDung: string, tep: MoTaTep[], idTepGo?: string[]) => void;
  gonNhe?: boolean;
  nhanNut?: string;
  onHuy?: () => void;
  /** Nạp sẵn chữ cũ khi mở ở chế độ sửa. */
  chuBanDau?: string;
  /** Tệp đã đính kèm từ trước — hiện kèm nút gỡ, chỉ dùng ở chế độ sửa. */
  tepHienCo?: MoTaTep[];
}) {
  const [chu, setChu] = useState(chuBanDau);
  const [tep, setTep] = useState<MoTaTep[]>([]);
  /** Id tệp cũ bị gỡ khỏi bài trong lần sửa này. */
  const [tepGo, setTepGo] = useState<string[]>([]);
  const [dangCat, setDangCat] = useState(false);
  const oNhap = useRef<HTMLTextAreaElement>(null);

  /** Tối đa 5 tệp mỗi bình luận — đủ cho một bộ ảnh chụp phiếu, mà không làm hồ sơ phình. */
  const TOI_DA_TEP = 5;
  /** Khớp với `DAI_TOI_DA_BINH_LUAN` ở tầng dữ liệu — chỗ đó mới là chốt chặn thật. */
  const DAI_TOI_DA = 1000;

  const tepCuConLai = tepHienCo.filter((t) => !tepGo.includes(t.id));

  async function themTep(ds: FileList) {
    const conNhan = TOI_DA_TEP - (tep.length + tepCuConLai.length);
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

  const dangSua = chuBanDau !== "" || tepHienCo.length > 0;
  const coGiDeGui =
    chu.trim().length > 0 || tep.length > 0 || (dangSua && tepCuConLai.length > 0);

  function gui() {
    if (!coGiDeGui) return;
    onGui(chu, tep, tepGo);
    // Ở chế độ sửa thì component bị gỡ ngay sau khi lưu, không cần dọn ô.
    if (!dangSua) {
      setChu("");
      setTep([]);
      oNhap.current?.focus();
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-(--hp-md-row-pad)">
      <textarea
        ref={oNhap}
        value={chu}
        onChange={(e) => setChu(e.target.value.slice(0, DAI_TOI_DA))}
        maxLength={DAI_TOI_DA}
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

      {/* Tệp ĐÃ ĐÍNH KÈM TỪ TRƯỚC (chỉ có ở chế độ sửa) — gỡ được, nhưng gọi đúng tên là
          "gỡ khỏi bài": nội dung tệp vẫn còn trong kho, không bị xóa. */}
      {tepCuConLai.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {tepCuConLai.map((t) => (
            <li
              key={t.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted py-0.5 pr-0.5 pl-2.5"
            >
              <Paperclip className="size-3 shrink-0 text-text-desc" aria-hidden />
              <span className="truncate text-xs text-text-primary" title={t.tenTep}>
                {rutGonTenTep(t.tenTep, 28)}
              </span>
              <button
                type="button"
                onClick={() => setTepGo((x) => [...x, t.id])}
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-text-desc transition-colors hover:bg-danger-bg hover:text-danger"
                aria-label={`Gỡ ${t.tenTep} khỏi bài`}
                title="Gỡ khỏi bài"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

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
        {/* ★ ICON KẸP GIẤY — Ban lãnh đạo 15/08/2026: *"thay icon chỗ up tài liệu theo chuẩn
            hiện đại"*. Kẹp giấy là ký hiệu đính kèm mà Gmail, Slack, Zalo, Teams đều dùng, nên
            người dùng nhận ra ngay không cần đọc chữ. Icon cũ (`ImagePlus` — khung ảnh có dấu
            cộng) trông giống nút "chèn ảnh vào bài viết" hơn là "đính kèm tệp", mà chỗ này
            nhận cả PDF/Word/Excel chứ không riêng ảnh.

            📌 VẪN GIỮ CHỮ bên cạnh icon: Design System V1.1 không cho phép truyền đạt chỉ
            bằng hình. Nút icon trần đẹp nhưng người mới vào phải rê chuột mới biết nó làm gì. */}
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
          <Paperclip className="size-4 shrink-0" aria-hidden />
          {dangCat ? "Đang lưu tệp…" : "Đính kèm"}
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

/**
 * MỘT BÀI BÌNH LUẬN.
 *
 * 🔴 BỎ KHUNG VIỀN quanh mỗi bài (Ban lãnh đạo 16/08/2026: *"thiết kế lại… dễ theo dõi hơn"*).
 * Trước đây mọi bài đều mang `rounded-lg border bg-surface`, thành ra 10 hình chữ nhật giống
 * hệt nhau — viền dùng cho 100% số bài thì không còn phân biệt được gì. Nay dùng **cột ảnh đại
 * diện + khoảng trắng** để phân cụm, viền chỉ để dành cho cái bất thường (bài đã thu hồi).
 */
function MotBinhLuan({
  bai,
  laCuaToi,
  onSua,
  onThuHoi,
  onTraLoi,
  nguoiDung,
  duocThuHoiBaiNguoiKhac,
  moc,
  laTraLoi = false,
}: {
  bai: BinhLuan;
  laCuaToi: boolean;
  onSua: (noiDungMoi: string, tepThem: MoTaTep[], idTepGo: string[]) => void;
  onThuHoi: () => void;
  onTraLoi?: (noiDung: string, tep: MoTaTep[]) => void;
  nguoiDung: { uid: string; ten: string };
  duocThuHoiBaiNguoiKhac: boolean;
  /** Mốc "bây giờ" để tính thời gian tương đối — 0 nghĩa là chưa mount xong. */
  moc: number;
  laTraLoi?: boolean;
}) {
  const [dangTraLoi, setDangTraLoi] = useState(false);
  const [dangSua, setDangSua] = useState(false);
  const [xemTep, setXemTep] = useState<MoTaTep | null>(null);
  const [moBanTruoc, setMoBanTruoc] = useState(false);
  const [hoiThuHoi, setHoiThuHoi] = useState(false);

  const lanSua = bai.lichSuSua ?? [];
  const daThuHoi = Boolean(bai.thuHoi);
  /** Người viết và cấp quản lý xem lại được nội dung đã thu hồi; người khác thì không. */
  const duocXemBanTruoc = laCuaToi || duocThuHoiBaiNguoiKhac;

  return (
    <div className="flex gap-3">
      <AnhDaiDienChu ten={bai.nguoiVietTen} co={laTraLoi ? 24 : 32} laToi={laCuaToi} />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Hàng danh tính */}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="text-sm font-semibold text-text-primary">{bai.nguoiVietTen}</span>
          {laCuaToi && <span className="text-xs text-text-desc">(Bạn)</span>}
          <span className="text-text-disabled">·</span>
          {/* `title` LUÔN là mốc tuyệt đối — chữ tương đối tiện đọc lướt nhưng khi đối chiếu
              chứng từ thì phải có ngày giờ chính xác. */}
          <time
            dateTime={bai.thoiDiem}
            title={formatMocThoiGian(bai.thoiDiem)}
            className="text-xs text-text-desc"
          >
            {moc > 0 ? formatThoiGianTuongDoi(bai.thoiDiem, moc) : formatMocThoiGian(bai.thoiDiem)}
          </time>

          {/* Nhãn "đã sửa" — CHỮ chứ không phải icon bút chì: icon bút chì mơ hồ giữa "đã
              sửa" và "bấm để sửa", mà Design System cũng cấm truyền đạt chỉ bằng hình. */}
          {lanSua.length > 0 && !daThuHoi && (
            <>
              <span className="text-text-disabled">·</span>
              <button
                type="button"
                onClick={() => setMoBanTruoc(true)}
                className="text-xs text-text-desc underline decoration-dotted underline-offset-2 transition-colors hover:text-primary"
              >
                {lanSua.length === 1 ? "đã sửa" : `đã sửa ${lanSua.length} lần`}
              </button>
            </>
          )}

          {/* Menu ⋯ thay cho nút Xóa đứng thường trực ở mọi bài. */}
          {!daThuHoi && (laCuaToi || duocThuHoiBaiNguoiKhac) && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label={`Thao tác với bình luận của ${bai.nguoiVietTen}`}
                    className="ml-auto flex size-11 items-center justify-center rounded-lg text-text-desc transition-colors hover:bg-muted hover:text-text-primary sm:size-9"
                  >
                    <MoreHorizontal className="size-4" aria-hidden />
                  </button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  {laCuaToi && (
                    <DropdownMenuItem onClick={() => setDangSua(true)}>
                      <Pencil className="size-4" aria-hidden />
                      Sửa bình luận
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setHoiThuHoi(true)}>
                    <Undo2 className="size-4" aria-hidden />
                    Thu hồi
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* ===== Nội dung ===== */}
        {daThuHoi ? (
          /* Bài đã thu hồi: khối xám có CẢ MÀU LẪN CHỮ, không chỉ tô nhạt. */
          <div className="flex flex-col gap-1.5 rounded-lg bg-muted px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs text-text-desc">
              <Undo2 className="size-3.5 shrink-0" aria-hidden />
              Nội dung đã được thu hồi bởi {bai.thuHoi?.nguoiTen} ·{" "}
              {formatMocThoiGian(bai.thuHoi?.thoiDiem)}
            </span>
            {duocXemBanTruoc && lanSua.length > 0 && (
              <button
                type="button"
                onClick={() => setMoBanTruoc(true)}
                className="w-fit text-xs text-primary underline underline-offset-2"
              >
                Xem nội dung đã thu hồi
              </button>
            )}
          </div>
        ) : dangSua ? (
          <OSoanBinhLuan
            gonNhe
            nhanNut="Lưu chỉnh sửa"
            nguoiDung={nguoiDung}
            chuBanDau={bai.noiDung}
            tepHienCo={bai.tep ?? []}
            onHuy={() => setDangSua(false)}
            onGui={(nd, tepThem, idTepGo) => {
              onSua(nd, tepThem, idTepGo ?? []);
              setDangSua(false);
            }}
          />
        ) : (
          <>
            {/* `whitespace-pre-wrap` để giữ đúng cách xuống dòng người viết đã gõ. */}
            {bai.noiDung && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-text-secondary">
                {bai.noiDung}
              </p>
            )}

            {(bai.tep ?? []).length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {(bai.tep ?? []).map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setXemTep(t)}
                      className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary"
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

            {/* Tệp đã gỡ — vẫn nói ra, vì "không cho xóa" phải đúng với cả chứng từ đính kèm. */}
            {(bai.tepDaGo ?? []).length > 0 && (
              <span className="text-xs text-text-desc">
                Đã gỡ {(bai.tepDaGo ?? []).length} tệp khỏi bài này
              </span>
            )}
          </>
        )}

        {/* Trả lời — chỉ ở bài gốc, và bài đã thu hồi thì không trả lời tiếp. */}
        {onTraLoi && !dangTraLoi && !dangSua && !daThuHoi && (
          <button
            type="button"
            onClick={() => setDangTraLoi(true)}
            className="inline-flex w-fit min-h-9 items-center gap-1.5 rounded-lg pr-2 text-xs font-medium text-text-desc transition-colors hover:text-primary"
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
      </div>

      {xemTep && <HopXemTep tep={xemTep} mo onDong={() => setXemTep(null)} />}

      <HopBanTruoc
        mo={moBanTruoc}
        onDong={() => setMoBanTruoc(false)}
        lanSua={lanSua}
        duocXem={duocXemBanTruoc}
      />

      <HopXacNhan
        mo={hoiThuHoi}
        tieuDe="Thu hồi bình luận này?"
        moTa={`Bình luận của ${bai.nguoiVietTen}.`}
        canhBao="Bài vẫn nằm nguyên chỗ, chỉ phần chữ bị ẩn với người khác. Nội dung gốc được lưu lại và không xóa được."
        nhanDongY="Thu hồi"
        nguyHiem
        onDong={() => setHoiThuHoi(false)}
        onDongY={onThuHoi}
      />
    </div>
  );
}

/**
 * Hộp xem các bản trước của một bình luận.
 *
 * ⚠️ Phải viết `sm:max-w-2xl`. Viết `max-w-2xl` trơn là VÔ HIỆU — `DialogContent` của base-nova
 * đã có `sm:max-w-sm` trong lớp gốc và sẽ đè lên, hộp kẹt 384px (bài học 15/08/2026).
 */
function HopBanTruoc({
  mo,
  onDong,
  lanSua,
  duocXem,
}: {
  mo: boolean;
  onDong: () => void;
  lanSua: LanSuaBinhLuan[];
  duocXem: boolean;
}) {
  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Các bản trước của bình luận</DialogTitle>
        </DialogHeader>

        {!duocXem ? (
          <p className="text-sm text-text-desc">
            Chỉ người viết và trưởng bộ phận xem lại được nội dung này.
          </p>
        ) : (
          <ol className="flex flex-col gap-(--hp-md-row-gap)">
            {[...lanSua].reverse().map((m, i) => (
              <li
                key={`${m.thoiDiem}-${i}`}
                className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-(--hp-md-row-pad)"
              >
                <span className="text-xs text-text-desc">
                  {m.nguoiSuaTen} · {formatMocThoiGian(m.thoiDiem)}
                </span>
                {/* 🔴 NÓI THẲNG khi bản đó không còn nội dung, đừng để trống cho người đọc
                    tưởng bản ấy vốn rỗng — xem luật cắt ở `catLichSuSua`. */}
                {m.noiDungTruoc === undefined ? (
                  <span className="text-sm text-text-disabled italic">
                    Không còn lưu nội dung bản này
                  </span>
                ) : (
                  <p className="text-sm whitespace-pre-wrap text-text-primary">
                    {m.noiDungTruoc || "(để trống)"}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      {/* 📌 ĐÃ BỎ câu "Nhật ký do hệ thống tự ghi, không sửa được. Giờ theo múi giờ Việt Nam"
          (Ban lãnh đạo 16/08/2026) — không có nút sửa nào ở đây thì cũng không ai tưởng sửa
          được, và múi giờ thì cả công ty dùng chung một múi. */}
    </>
  );
}
