"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Inbox, Plus, Search, Star } from "lucide-react";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { nhanPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { KhoiGhiChuCongViec } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-ghi-chu-cong-viec";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { docDanhDau, ghiDanhDau } from "@/3-du-lieu/danh-dau-ca-nhan";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { soNgayConLai, tinhTienDoDeNghi, tomTatTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import { NHAN_GIAI_DOAN, xacDinhGiaiDoan } from "@/2-quy-trinh/giai-doan-mua-hang";
import { laViecCuaToi } from "@/2-quy-trinh/sap-xep-uu-tien";
import { formatDate } from "@/6-tien-ich/dinh-dang";
import { boDau } from "@/6-tien-ich/bo-dau";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * MÀN HÌNH CÁ NHÂN — "Việc của tôi".
 *
 * Chỉ đạo Ban lãnh đạo 10/08/2026, kèm ảnh màn danh sách đề xuất của Base.vn. Bố cục bám
 * đúng ảnh đó: tiêu đề lớn → dải tab lọc chữ hoa nhỏ → danh sách DÒNG ĐƠN, mỗi dòng gồm
 * ngôi sao ghim · tiêu đề đậm · một chuỗi mô tả xám ngăn bằng dấu "·" · chip trạng thái ·
 * người phụ trách · ngày.
 *
 * 🔴 VÌ SAO LÀ DÒNG ĐƠN, KHÔNG PHẢI THẺ: màn này để **quét nhanh nhiều hồ sơ**. Thẻ tốn
 * chiều cao, một màn chỉ xem được 4–5 hồ sơ; dòng đơn xem được hơn 20. Trang chi tiết mới
 * là chỗ đọc kỹ.
 *
 * ⚠️ KHÁC với `/theo-doi`: màn đó dành cho NGƯỜI ĐỀ NGHỊ (Phòng Thi công) xem tiến trình
 * hồ sơ mình gửi, và cố tình ẩn giá + nhà cung cấp. Màn này dành cho NGƯỜI LÀM THU MUA
 * xem việc đang tới tay mình. Hai màn khác nhau về đối tượng, đừng gộp.
 */

/** Các tab lọc, dịch từ dải tab trong ảnh mẫu sang đúng nghiệp vụ thu mua. */
type MaLoc =
  | "tat_ca"
  | "den_luot_toi"
  | "qua_han"
  | "dang_chay"
  | "da_xong"
  | "toi_theo_doi"
  | "da_danh_dau";

const LOC: { ma: MaLoc; nhan: string }[] = [
  { ma: "tat_ca", nhan: "Tất cả" },
  { ma: "den_luot_toi", nhan: "Đến lượt tôi" },
  { ma: "qua_han", nhan: "Quá hạn" },
  { ma: "dang_chay", nhan: "Đang chạy" },
  { ma: "da_xong", nhan: "Đã xong" },
  { ma: "toi_theo_doi", nhan: "Tôi theo dõi" },
  { ma: "da_danh_dau", nhan: "Đã đánh dấu" },
];

export default function TrangViecCuaToi() {
  const { deNghi, donHang, baoGia, phieuNhan } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  const [loc, setLoc] = useState<MaLoc>("tat_ca");
  const [tuKhoa, setTuKhoa] = useState("");
  const [daGhim, setDaGhim] = useState<string[]>([]);

  // Đọc ngôi sao trong useEffect, KHÔNG đọc lúc khởi tạo state: trang được dựng sẵn lúc
  // build (hosting tĩnh) nên lần render đầu không có localStorage — đọc sớm là lỗi hydrate.
  useEffect(() => {
    setDaGhim(docDanhDau(nguoiDung.uid));
  }, [nguoiDung.uid]);

  function doiGhim(id: string) {
    setDaGhim((truoc) => {
      const sau = truoc.includes(id) ? truoc.filter((x) => x !== id) : [...truoc, id];
      ghiDanhDau(nguoiDung.uid, sau);
      return sau;
    });
  }

  /** Tính sẵn mọi thứ cần để lọc và hiển thị, mỗi đề nghị một lần. */
  const dong = useMemo(() => {
    // Người có quyền xem mọi hồ sơ thì thấy hết; còn lại chỉ thấy hồ sơ mình dính vào.
    const nguon = quyen.xemMoiHoSo
      ? deNghi
      : deNghi.filter(
          (dn) =>
            dn.nguoiDeNghiUid === nguoiDung.uid ||
            laViecCuaToi(dn, nguoiDung.uid) ||
            dn.nguoiTheoDoi?.some((n) => n.uid === nguoiDung.uid),
        );

    return nguon.map((dn) => {
      const tienDo = tinhTienDoDeNghi(dn, donHang, phieuNhan);
      const tomTat = tomTatTienDoDeNghi(tienDo);
      const giaiDoan = xacDinhGiaiDoan(dn, donHang, baoGia, phieuNhan);
      const conLai = soNgayConLai(dn.ngayCanHang);
      const xong = giaiDoan === "hoan_thanh";
      return {
        dn,
        giaiDoan,
        conLai,
        xong,
        soMatHang: dn.items.length,
        soDaNhanDu: tomTat.soDongDaNhanDu,
        // "Đến lượt tôi": tôi đang phụ trách ít nhất một dòng và hồ sơ chưa xong.
        // Dùng `laViecCuaToi` chứ không tự viết lại điều kiện — cùng một câu hỏi với bảng
        // quy trình, phải cùng một câu trả lời.
        denLuotToi: !xong && laViecCuaToi(dn, nguoiDung.uid),
        toiTheoDoi: Boolean(dn.nguoiTheoDoi?.some((n) => n.uid === nguoiDung.uid)),
        // Quá hạn chỉ tính khi CHƯA xong — hồ sơ đã nhận đủ thì hạn không còn ý nghĩa.
        quaHan: !xong && conLai < 0,
        nguoiPhuTrach: [
          ...new Set(dn.items.map((d) => d.nguoiPhuTrachTen).filter(Boolean)),
        ] as string[],
      };
    });
  }, [deNghi, donHang, baoGia, phieuNhan, nguoiDung.uid, quyen.xemMoiHoSo]);

  const hienThi = useMemo(() => {
    const k = boDau(tuKhoa).trim();
    return dong
      .filter((x) => {
        if (loc === "den_luot_toi") return x.denLuotToi;
        if (loc === "qua_han") return x.quaHan;
        if (loc === "dang_chay") return !x.xong;
        if (loc === "da_xong") return x.xong;
        if (loc === "toi_theo_doi") return x.toiTheoDoi;
        if (loc === "da_danh_dau") return daGhim.includes(x.dn.id);
        return true;
      })
      .filter((x) => {
        if (k === "") return true;
        // Tìm trên mã hồ sơ, tiêu đề, công trình và cả tên vật liệu — người dùng thường
        // chỉ nhớ "cái đề nghị xi măng" chứ không nhớ mã.
        const kho = boDau(
          `${x.dn.code} ${x.dn.tieuDe} ${x.dn.tenCongTrinh} ${x.dn.maDuAn} ${x.dn.items
            .map((d) => d.tenVatLieu)
            .join(" ")}`,
        );
        return kho.includes(k);
      })
      .sort((a, b) => {
        /* Ghim lên đầu — người dùng tự tay đánh dấu thì ý muốn của họ đứng trên mọi luật
           tự động. */
        const ga = daGhim.includes(a.dn.id) ? 0 : 1;
        const gb = daGhim.includes(b.dn.id) ? 0 : 1;
        if (ga !== gb) return ga - gb;
        /* ★ VIỆC ĐẾN LƯỢT MÌNH LÊN TRƯỚC — Ban lãnh đạo 15/08/2026.
           `denLuotToi` đã tính sẵn ở trên (mình phụ trách VÀ hồ sơ chưa xong), tab "Tất cả"
           trước đây bỏ quên nó nên việc của mình lẫn giữa việc của đồng nghiệp. */
        if (a.denLuotToi !== b.denLuotToi) return a.denLuotToi ? -1 : 1;
        if (a.quaHan !== b.quaHan) return a.quaHan ? -1 : 1;
        const han = a.dn.ngayCanHang.localeCompare(b.dn.ngayCanHang);
        // Phá hòa bằng mã hồ sơ — thiếu bước này thì hồ sơ cùng ngày cần hàng đảo chỗ
        // mỗi lần dữ liệu đổi, người đang nhìn tưởng bấm nhầm.
        return han !== 0 ? han : a.dn.code.localeCompare(b.dn.code, "vi");
      });
  }, [dong, loc, tuKhoa, daGhim]);

  /** Số hồ sơ của mỗi tab — hiện cạnh nhãn để biết chỗ nào đang có việc. */
  const demTheoLoc = useMemo(
    () => ({
      tat_ca: dong.length,
      den_luot_toi: dong.filter((x) => x.denLuotToi).length,
      qua_han: dong.filter((x) => x.quaHan).length,
      dang_chay: dong.filter((x) => !x.xong).length,
      da_xong: dong.filter((x) => x.xong).length,
      toi_theo_doi: dong.filter((x) => x.toiTheoDoi).length,
      da_danh_dau: dong.filter((x) => daGhim.includes(x.dn.id)).length,
    }),
    [dong, daGhim],
  );

  return (
    <>
      {/* ===== ĐẦU TRANG: tiêu đề lớn · ô tìm · nút tạo mới ===== */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 text-text-primary">Công việc của tôi</h1>
          <p className="text-sm text-text-desc">
            {nguoiDung.tenHienThi} · {nguoiDung.chucDanh}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-desc"
              aria-hidden
            />
            <Input
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              placeholder="Tìm mã hồ sơ, công trình, vật liệu..."
              aria-label="Tìm trong việc của tôi"
              className="w-64 pl-9"
            />
          </div>
          {/* 🔴 Kiểm ĐÚNG quyền `taoDeNghi`, không phải `xemMoiHoSo`.
              Hai quyền này khác nhau: `xemMoiHoSo` là "xem được mọi hồ sơ" (cấp 3 trở lên),
              còn lập đề nghị thì MỌI tài khoản đều được (chỉ đạo 12/08/2026). Dùng nhầm làm
              nhân viên cấp 2 — người lập đề nghị nhiều nhất — **mất hẳn nút này**. */}
          {quyen.taoDeNghi && (
            <Button nativeButton={false} render={<Link href="/de-nghi/nhan-moi" />}>
              <Plus className="size-4" aria-hidden />
              Tạo đề nghị
            </Button>
          )}
        </div>
      </div>

      {/* ===== DẢI TAB LỌC =====
          Dùng <button> thật để Tab/Enter được. Cuộn ngang trên màn hẹp thay vì xuống dòng
          lộn xộn — `overflow-x-auto` nằm ngay đây nên không kéo giãn cả trang. */}
      <div
        className="-mx-(--hp-md-pad) flex gap-1 overflow-x-auto border-b border-divider px-(--hp-md-pad)"
        role="tablist"
        aria-label="Bộ lọc việc của tôi"
      >
        {LOC.map((l) => {
          const dangChon = loc === l.ma;
          const so = demTheoLoc[l.ma];
          return (
            <button
              key={l.ma}
              type="button"
              role="tab"
              aria-selected={dangChon}
              onClick={() => setLoc(l.ma)}
              className={`flex min-h-11 shrink-0 items-center gap-1.5 border-b-2 px-3 text-xs font-semibold tracking-wide uppercase transition-colors ${
                dangChon
                  ? "border-primary text-primary"
                  : "border-transparent text-text-desc hover:text-text-primary"
              }`}
            >
              {l.nhan}
              {/* Số 0 vẫn hiện — biết chắc là "không có việc" chứ không phải chưa tải xong. */}
              <span
                className={`rounded px-1 py-0.5 text-[10px] tabular-nums ${
                  dangChon ? "bg-primary/10 text-primary" : "bg-muted text-text-desc"
                }`}
              >
                {so}
              </span>
            </button>
          );
        })}
      </div>

      {/* ===== GHI CHÚ CÔNG VIỆC CẦN GIẢI QUYẾT =====
          Chỉ đạo Ban lãnh đạo 10/08/2026. Đặt TRÊN danh sách hồ sơ: đây là việc người dùng tự
          nhắc mình, cần thấy ngay khi mở màn chứ không phải cuộn xuống cuối mới thấy. */}
      <KhoiGhiChuCongViec uid={nguoiDung.uid} />

      {/* ===== DANH SÁCH ===== */}
      {hienThi.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Không có hồ sơ nào ở mục này"
          description={
            tuKhoa.trim() !== ""
              ? `Không tìm thấy hồ sơ nào khớp “${tuKhoa}”. Thử từ khóa khác hoặc đổi mục lọc.`
              : "Đổi sang mục lọc khác để xem các hồ sơ còn lại."
          }
        />
      ) : (
        <ul className="flex flex-col rounded-xl border border-border bg-surface">
          {hienThi.map((x) => (
            <DongViec
              key={x.dn.id}
              deNghi={x.dn}
              nhanGiaiDoan={NHAN_GIAI_DOAN[x.giaiDoan]?.nhan ?? x.giaiDoan}
              xong={x.xong}
              quaHan={x.quaHan}
              conLai={x.conLai}
              soMatHang={x.soMatHang}
              nguoiPhuTrach={quyen.xemNguoiPhuTrach ? x.nguoiPhuTrach : []}
              daGhim={daGhim.includes(x.dn.id)}
              onGhim={() => doiGhim(x.dn.id)}
            />
          ))}
        </ul>
      )}
    </>
  );
}

/** Một dòng trong danh sách. Tách riêng cho dễ đọc, không dùng ở đâu khác. */
function DongViec({
  deNghi,
  nhanGiaiDoan,
  xong,
  quaHan,
  conLai,
  soMatHang,
  nguoiPhuTrach,
  daGhim,
  onGhim,
}: {
  deNghi: DeNghiMuaHang;
  nhanGiaiDoan: string;
  xong: boolean;
  quaHan: boolean;
  conLai: number;
  soMatHang: number;
  nguoiPhuTrach: string[];
  daGhim: boolean;
  onGhim: () => void;
}) {
  return (
    <li className="flex items-center gap-2 border-b border-divider px-(--hp-md-row-pad) last:border-b-0 hover:bg-muted/50">
      {/* 🔴 Ngôi sao PHẢI nằm NGOÀI thẻ Link. Lồng <button> trong <a> là HTML không hợp lệ,
          và bấm ghim sẽ kéo theo điều hướng sang trang chi tiết. Vùng chạm 44×44 (V1.1). */}
      <button
        type="button"
        onClick={onGhim}
        aria-pressed={daGhim}
        aria-label={daGhim ? `Bỏ ghim ${deNghi.code}` : `Ghim ${deNghi.code}`}
        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-text-desc transition-colors hover:bg-muted hover:text-warning-soft"
      >
        <Star
          className={`size-4 ${daGhim ? "fill-warning-soft text-warning-soft" : ""}`}
          aria-hidden
        />
      </button>

      <Link
        href={`/de-nghi/${deNghi.id}`}
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 py-2.5 md:flex-nowrap"
      >
        {/* Một hàng duy nhất trên màn rộng, giống ảnh mẫu: mã và cụm bên phải không co,
            phần mô tả dài thì cắt bớt bằng `truncate`. Màn hẹp thì cho xuống dòng.
            ⚠️ `min-w-0` là bắt buộc trên mọi cấp có `truncate`, thiếu nó thì flex item
            không chịu co và dòng bị đẩy tràn ngang. */}
        <span className="shrink-0 text-sm font-semibold text-text-primary">{deNghi.code}</span>
        <span className="min-w-0 shrink truncate text-sm text-text-primary">
          {deNghi.tieuDe}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-text-desc">
          {deNghi.tenCongTrinh} · {nhanPhongBan(deNghi.phongBanNguon)} ·{" "}
          {soMatHang} mặt hàng · cần hàng {formatDate(deNghi.ngayCanHang)}
        </span>

        <span className="ml-auto flex shrink-0 items-center justify-end gap-2">
          {/* Hạn: hiện CẢ CHỮ, không chỉ dựa vào màu (V1.1). Xong rồi thì không nhắc hạn. */}
          {!xong && (
            <span
              className={`text-xs font-medium tabular-nums ${
                quaHan ? "text-danger" : "text-text-desc"
              }`}
            >
              {quaHan ? `Quá hạn ${-conLai} ngày` : `Còn ${conLai} ngày`}
            </span>
          )}
          {/* Design System chỉ có 5 tông: primary/success/warning/danger/neutral —
              không có "info". Đang chạy dùng `primary`. */}
          <StatusBadge
            label={nhanGiaiDoan}
            tone={xong ? "success" : quaHan ? "danger" : "primary"}
          />
          {nguoiPhuTrach.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-text-secondary"
                aria-hidden
              >
                {vietTat(nguoiPhuTrach[0])}
              </span>
              {/* Nhiều người thì ghi rõ "+N", đừng để người xem tưởng chỉ có một người.
                  Tên dài bị cắt để không đẩy dòng xuống hàng — hover xem đủ qua `title`. */}
              <span
                className="hidden max-w-36 truncate sm:inline"
                title={nguoiPhuTrach.join(", ")}
              >
                {nguoiPhuTrach.length === 1
                  ? nguoiPhuTrach[0]
                  : `${nguoiPhuTrach[0]} +${nguoiPhuTrach.length - 1}`}
              </span>
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

/** Chữ viết tắt trên avatar, vd "Nguyễn Văn A" → "NA". */
function vietTat(ten: string): string {
  const phan = ten.trim().split(/\s+/);
  const raw =
    phan.length === 1 ? phan[0].slice(0, 2) : `${phan[0][0]}${phan[phan.length - 1][0]}`;
  return raw.toUpperCase();
}
