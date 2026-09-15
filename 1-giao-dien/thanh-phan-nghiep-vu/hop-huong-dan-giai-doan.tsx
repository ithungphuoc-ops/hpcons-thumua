"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, Clock, Info, PencilLine, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";
import {
  GIAI_DOAN_MUA_HANG,
  NHAN_GIAI_DOAN,
  type GiaiDoanMuaHang,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import {
  HUONG_DAN_GIAI_DOAN,
  QUY_UOC_SOAN_HUONG_DAN,
  huongDanHienThi,
  huongDanThanhVanBan,
  type DoanHuongDan,
} from "@/2-quy-trinh/huong-dan-giai-doan";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";

/**
 * HƯỚNG DẪN SỬ DỤNG TỪNG BƯỚC — mở từ nút ⓘ ở đầu mỗi cột bảng quy trình và ở thanh
 * giai đoạn trên trang chi tiết.
 *
 * 🔴 Chỉ đạo Ban lãnh đạo 11/08/2026: *"đây là hình ảnh hướng dẫn các quy trình thu mua,
 * đọc kiểm tra và làm lại theo đúng quy trình này, thêm nút để bấm vô sẽ đọc được hướng
 * dẫn sử dụng"*.
 *
 * 🔴 CHỮ LẤY NGUYÊN VĂN TỪ `2-quy-trinh/huong-dan-giai-doan.ts`, KHÔNG viết lại trong này.
 * Đó là văn bản nghiệp vụ của công ty (bảng Base "TM-QT Mua hàng"); người dùng đối chiếu
 * với quy trình giấy nên lệch một chữ là mất tin. Component này chỉ lo phần trình bày.
 *
 * ⚠️ Khối "App chưa làm được" là phần BẮT BUỘC hiện. Đọc hướng dẫn ngay trong app rất dễ
 * làm người dùng tưởng app đã kiểm hộ mọi điều kiện (hợp đồng ≥20 triệu, tem hiệu chuẩn
 * QA-QC, danh mục NCC hàng năm) — thực tế vẫn phải làm tay ngoài app.
 */
export function NutHuongDanGiaiDoan({
  giaiDoan,
  /** `bieu_tuong` cho đầu cột (chật chỗ) · `nut_chu` cho trang chi tiết. */
  kieu = "bieu_tuong",
  /**
   * Chữ trên nút, chỉ dùng với `kieu="nut_chu"`. Bỏ trống = "Hướng dẫn bước này".
   *
   * 📌 Có tham số này vì màn Lập đơn mua hàng cần đúng chữ **"Hướng dẫn sử dụng"** của MISA
   * (Ban lãnh đạo 18/08/2026: *"giao diện phần PO e chỉnh lại giống 100% như vậy"*), trong khi
   * ở bảng quy trình thì "Hướng dẫn bước này" mới đúng nghĩa — nút ở đó gắn với một BƯỚC.
   * 🔴 Thêm tham số thay vì đổi chữ cứng: đổi chữ cứng là kéo theo mọi nơi đang gọi.
   */
  nhanNut,
  className,
}: {
  giaiDoan: GiaiDoanMuaHang;
  kieu?: "bieu_tuong" | "nut_chu";
  nhanNut?: string;
  className?: string;
}) {
  const [mo, setMo] = useState(false);
  const huongDan = HUONG_DAN_GIAI_DOAN[giaiDoan];

  // Hai cột kết thúc (Hoàn thành · Thất bại) không có hướng dẫn trên bảng Base — không
  // hiện nút còn hơn hiện một nút bấm vào chẳng có gì.
  if (!huongDan) return null;

  const nhan = NHAN_GIAI_DOAN[giaiDoan]?.nhan ?? giaiDoan;

  return (
    <>
      {kieu === "bieu_tuong" ? (
        <button
          type="button"
          onClick={() => setMo(true)}
          title={`Hướng dẫn bước "${nhan}"`}
          aria-label={`Xem hướng dẫn bước ${nhan}`}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-text-desc transition-colors hover:bg-card hover:text-primary"
        >
          <Info className="size-4" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setMo(true)}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary ${className ?? ""}`}
        >
          <BookOpen className="size-4 shrink-0" aria-hidden />
          {nhanNut ?? "Hướng dẫn bước này"}
        </button>
      )}

      <HopHuongDanGiaiDoan giaiDoan={giaiDoan} mo={mo} onDong={() => setMo(false)} />
    </>
  );
}

export function HopHuongDanGiaiDoan({
  giaiDoan,
  mo,
  onDong,
}: {
  giaiDoan: GiaiDoanMuaHang;
  mo: boolean;
  onDong: () => void;
}) {
  const { cauHinh, luuCauHinhQuyTrinh } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  /** `null` = đang xem. Chuỗi = đang sửa, giữ chữ người dùng gõ. */
  const [nhap, setNhap] = useState<string | null>(null);

  const goc = HUONG_DAN_GIAI_DOAN[giaiDoan];
  const huongDan = huongDanHienThi(giaiDoan, cauHinh.huongDanTuyChinh);

  /**
   * ★ Ai được sửa: dùng chung khuôn quyền với `suaPODaChot` (Quản trị, hoặc Trưởng bộ phận từ
   * cấp 3). Nội dung hướng dẫn là văn bản nghiệp vụ dùng chung cho cả phòng — một người sửa là
   * đổi chữ trên màn hình mọi người, nên đặt cùng mức nhạy cảm với việc sửa PO đã chốt.
   */
  const duocSua = quyen.suaPODaChot && goc !== undefined;
  const dangSua = nhap !== null;

  function moSua() {
    if (!goc) return;
    /* Mồi bằng ĐÚNG nội dung đang hiện (bản sửa nếu có, không thì bản gốc) — người quản lý sửa
       vài chữ trên nền có sẵn, không phải gõ lại từ đầu. */
    setNhap(cauHinh.huongDanTuyChinh?.[giaiDoan] ?? huongDanThanhVanBan(goc.noiDung));
  }

  function ghi(vanMoi: string | undefined, loiNhan: string) {
    const banDo = { ...(cauHinh.huongDanTuyChinh ?? {}) };
    if (vanMoi === undefined) delete banDo[giaiDoan];
    else banDo[giaiDoan] = vanMoi;

    /* Không còn khóa nào thì BỎ HẲN trường, đừng để lại object rỗng — `soSanhCauHinh` và phép
       so cấu hình đều dựa trên "có khóa hay không". */
    const coKhoa = Object.keys(banDo).length > 0;
    const loi = luuCauHinhQuyTrinh(
      { ...cauHinh, ...(coKhoa ? { huongDanTuyChinh: banDo } : { huongDanTuyChinh: undefined }) },
      nguoiDung.tenHienThi,
    );
    if (loi.length > 0) {
      toast.error("Chưa lưu được", { description: loi[0] });
      return;
    }
    setNhap(null);
    toast.success(loiNhan, { description: "Nội dung mới áp dụng cho cả phòng ngay lập tức." });
  }

  // Số bước tính trên chuỗi 7 bước — "Thất bại" là nhánh dừng, không nằm trong chuỗi
  // (cùng cách đếm với `thanh-giai-doan.tsx`, đừng để hai chỗ ra hai con số khác nhau).
  const chuoi = GIAI_DOAN_MUA_HANG.filter((g) => g.ma !== "that_bai");
  const viTri = chuoi.findIndex((g) => g.ma === giaiDoan);

  /* 🔴 KHÔNG `return null` TRƯỚC `<Dialog>`. Tháo hộp thoại giữa lúc đang mở để lại node "mồ
     côi" che kín màn hình — đúng lỗi kẹt giao diện đã mất 6 lượt sửa mới truy ra (14/09/2026,
     xem `thanh-phan-dung-chung/don-dep-hop-thoai-ket.ts`). Giữ hộp luôn được dựng, chỉ đổi RUỘT. */
  return (
    <Dialog open={mo && huongDan !== undefined} onOpenChange={(v: boolean) => !v && onDong()}>
      {/* Hướng dẫn dài hơn màn hình — cuộn BÊN TRONG hộp để nền trang đứng yên.
          ⚠️ PHẢI GHI `sm:max-w-2xl`, không phải `max-w-2xl`. `DialogContent` gốc đã có sẵn
          `sm:max-w-sm`; tailwind-merge chỉ bỏ được lớp CÙNG biến thể, nên `max-w-2xl` không
          hạ được `sm:max-w-sm` và hộp vẫn hẹp 384px trên màn to. */}
      <DialogContent className="max-h-[85vh] sm:max-w-2xl overflow-y-auto">
        {huongDan && (
          <>
            <DialogHeader>
              <DialogTitle className="pr-8 leading-snug">
                {viTri >= 0 ? `Bước ${viTri + 1}. ` : ""}
                {huongDan.tenDayDu}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  {huongDan.khongCoTrenBase
                    ? "Cách app xác định bước này"
                    : "Hướng dẫn hoàn thành các nhiệm vụ trong giai đoạn"}
                </span>
                {huongDan.gioChuan !== undefined && (
                  <span className="inline-flex items-center gap-1 text-text-secondary">
                    <Clock className="size-3.5 shrink-0" aria-hidden />
                    Thời lượng chuẩn {huongDan.gioChuan} giờ làm việc
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            {/* 🔴 NÓI NGUỒN TRƯỚC KHI NÓI NỘI DUNG. Hai cột kết thúc không có hướng dẫn trên bảng
                quy trình của công ty; chữ bên dưới là mô tả kỹ thuật. Không phân biệt rõ thì người
                dùng sẽ trích chữ trong app ra tranh luận nghiệp vụ. */}
            {huongDan.khongCoTrenBase && (
              <p className="flex items-start gap-2 rounded-lg border border-border bg-muted p-(--hp-md-row-pad) text-sm text-text-secondary">
                <Info className="mt-0.5 size-4 shrink-0 text-text-desc" aria-hidden />
                <span>
                  Bước này <strong>không có hướng dẫn trong quy trình giấy</strong> của công ty. Phần
                  dưới đây là <strong>cách app xác định</strong>, viết ra để mọi người biết vì sao
                  hồ sơ nằm ở đây — không phải văn bản nghiệp vụ.
                </span>
              </p>
            )}

            {/* ★ BẢN ĐÃ CHỈNH — phải nói rõ, vì người dùng đối chiếu hộp này với quy trình giấy.
                Lệch nhau mà không báo thì họ tưởng app hiển thị sai (xem `daTuyChinh`). */}
            {huongDan.daTuyChinh && !dangSua && (
              <p className="flex items-start gap-2 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
                <PencilLine className="mt-0.5 size-4 shrink-0 text-warning-soft" aria-hidden />
                <span>
                  Nội dung dưới đây đã được <strong>công ty chỉnh sửa</strong>, không còn giống
                  nguyên văn quy trình gốc. Xem ai sửa lúc nào ở trang <em>Cài đặt quy trình</em>.
                </span>
              </p>
            )}

            {dangSua ? (
              <div className="flex flex-col gap-3">
                <Textarea
                  value={nhap}
                  onChange={(e) => setNhap(e.target.value)}
                  rows={16}
                  className="font-mono text-xs leading-relaxed"
                  aria-label="Nội dung hướng dẫn"
                />
                {/* Quy ước soạn thảo hiện ngay tại chỗ gõ — người sửa là cán bộ nghiệp vụ,
                    bắt họ nhớ cú pháp mà không nhắc là chắc chắn gõ sai. */}
                <ul className="ml-5 list-disc space-y-1 text-xs text-text-desc">
                  {QUY_UOC_SOAN_HUONG_DAN.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={() => ghi(nhap, "Đã lưu nội dung hướng dẫn")}>
                    Lưu nội dung
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setNhap(null)}>
                    Hủy
                  </Button>
                  {huongDan.daTuyChinh && (
                    /* 🔴 Khôi phục = XÓA KHÓA, không phải chép bản gốc vào ô. Chép vào là từ đó
                       hai chỗ cùng giữ một nội dung rồi lệch nhau khi công ty đổi quy trình. */
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-text-desc"
                      onClick={() => ghi(undefined, "Đã khôi phục hướng dẫn về bản gốc")}
                    >
                      <RotateCcw className="size-4 shrink-0" aria-hidden />
                      Khôi phục bản gốc
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-sm leading-relaxed text-text-primary">
                {huongDan.noiDung.map((doan, i) => (
                  <DoanNoiDung key={i} doan={doan} laMoTaCuaApp={huongDan.khongCoTrenBase} />
                ))}

                {/* 📌 ĐÃ BỎ hai khối ghi chú (Ban lãnh đạo 15/08/2026: *"bỏ hết các ghi chú kiểu
                    này đi"*):
                      · "Phần app chưa làm thay được — vẫn phải làm tay"
                      · Dòng "Nội dung chép nguyên văn từ quy trình TM-QT Mua hàng (HP CONS)…"

                    Cả hai là ghi chú của ĐỘI TRIỂN KHAI nói với nhau, không phải việc người dùng
                    cần đọc mỗi lần mở hướng dẫn. Hộp này để tra "bước này phải làm gì", thêm hai
                    khối kia vào là đẩy phần việc thật xuống dưới màn hình.

                    🔴 Nội dung "app chưa làm được" KHÔNG mất — chuyển thành chú thích trong
                    `2-quy-trinh/huong-dan-giai-doan.ts` để người bảo trì vẫn biết app còn thiếu gì
                    so với quy trình giấy. */}

                {/* ★ NÚT SỬA — Sếp 14/09/2026. Chỉ hiện với người có quyền; người khác không thấy
                    nút, không phải thấy nút rồi bấm vào mới bị từ chối. */}
                {duocSua && (
                  <div className="mt-1 border-t border-border pt-3">
                    <Button size="sm" variant="ghost" className="text-text-secondary" onClick={moSua}>
                      <PencilLine className="size-4 shrink-0" aria-hidden />
                      Sửa nội dung hướng dẫn
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DoanNoiDung({
  doan,
  /** Bước không có hướng dẫn trên bảng Base — chữ ở đây là mô tả app, không phải quy định. */
  laMoTaCuaApp,
}: {
  doan: DoanHuongDan;
  laMoTaCuaApp?: boolean;
}) {
  // Đoạn "Lưu ý" đứng riêng một khối viền — trên bảng Base nó cũng được tách khỏi thân bài,
  // và đây thường là câu người dùng hay bỏ sót nhất.
  if (doan.luuY) {
    return (
      <p className="rounded-lg border-l-4 border-primary bg-primary-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
        <strong className="text-primary-soft">Lưu ý: </strong>
        {doan.luuY}
      </p>
    );
  }

  // Đoạn nhấn mạnh = quy tắc có ngưỡng tiền / người duyệt / số lượng báo giá. Nền riêng để
  // mắt bắt được ngay, KÈM CHỮ "Quy định bắt buộc" — luật V1.1: không truyền tin chỉ bằng màu.
  const khungNhan = doan.nhanManh
    ? "rounded-lg border border-border bg-muted p-(--hp-md-row-pad)"
    : "";

  return (
    <div className={`flex flex-col gap-1.5 ${khungNhan}`}>
      {doan.nhanManh && (
        /* 🔴 Nhãn phải theo NGUỒN. Ở bước không có trong quy trình giấy mà vẫn in "Quy định
           bắt buộc" là tự mâu thuẫn với chính dòng cảnh báo phía trên, và tệ hơn: biến mô tả
           kỹ thuật thành quy định công ty trong mắt người đọc. */
        <span className="text-xs font-semibold tracking-wide text-text-desc uppercase">
          {laMoTaCuaApp ? "Điều kiện app kiểm" : "Quy định bắt buộc"}
        </span>
      )}
      {doan.van && <p>{doan.van}</p>}
      {doan.gach && (
        <ul className="ml-5 list-disc space-y-1">
          {doan.gach.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
