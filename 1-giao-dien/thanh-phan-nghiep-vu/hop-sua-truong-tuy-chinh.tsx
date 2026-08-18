"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, LogIn, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { ODinhKemTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { ODinhKemNhieuTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-nhieu-tep";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { DANH_MUC_PHONG_BAN } from "@/3-du-lieu/danh-muc-phong-ban";
import { NHAN_GIAI_DOAN } from "@/2-quy-trinh/giai-doan-mua-hang";
import {
  NHAN_NHOM_DE_XUAT,
  type DeNghiMuaHang,
  type DongDeNghi,
  type MoTaTep,
  type NhomDeXuat,
} from "@/3-du-lieu/kieu-du-lieu";

/**
 * ✏️ HỘP "CHỈNH SỬA CÁC TRƯỜNG DỮ LIỆU TÙY CHỈNH" — dựng theo đúng ảnh Base mà Ban lãnh đạo gửi
 * ngày 18/08/2026: *"đây là giao diện chức năng 'chỉnh sửa dữ liệu tùy chỉnh', e cấu hình giống
 * 100% cho a"*.
 *
 * ---
 * ## VÌ SAO VIẾT MỚI THAY VÌ SỬA HỘP CŨ
 * Hộp cũ (`HopSuaTruongBoSung` trong `hop-sua-de-nghi.tsx`) mang đúng cái tên "Chỉnh sửa dữ liệu
 * tùy chỉnh" nhưng bên trong chỉ là **bảng cặp "tên trường / giá trị" gõ tự do** — người dùng phải
 * tự gõ cả tên trường. Base thì khác hẳn: nó bày ra **chính các trường của quy trình, xếp theo
 * từng bước**, mỗi trường đúng kiểu nhập của nó (ô chọn, ngày-giờ, bảng, tệp).
 *
 * Hai hộp phục vụ hai việc khác nhau nên **giữ cả hai**, không xóa hộp cũ: trường gõ tự do vẫn
 * cần cho thông tin phát sinh mà quy trình chưa có ô. Menu ⋯ nay có hai mục tên khác nhau rõ ràng.
 *
 * ## 🔴 KHÔNG MỞ ĐƯỜNG GHI MỚI
 * Mọi thay đổi đi qua **đúng những hàm đã có** của kho dữ liệu, vì mỗi hàm đó đang giữ luật riêng
 * của nó và tự ghi nhật ký:
 *   · `suaThongTinChung`   — tiêu đề · bộ phận · nhóm đề xuất · link phiếu
 *   · `suaThoiHan`         — ngày đề nghị cấp (**bắt ghi lý do**, xem bên dưới)
 *   · `suaMatHangDeNghi`   — bảng "Chi tiết" (tự chặn khi dòng đã có đơn hàng / đã nhận hàng)
 *   · `datSoBaoGiaChoPhieu`— SL Báo giá
 *   · `themTepGiaiDoan` + `datGhiChuTepGiaiDoan` — ba ô báo giá và ô "báo giá khác"
 * Viết một đường ghi riêng cho hộp này là bỏ qua hết những luật đó mà không có gì báo.
 *
 * ## ⚠️ MỘT CHỖ CỐ Ý KHÔNG GIỐNG BASE: đổi ngày phải ghi lý do
 * Base cho sửa "Ngày đề nghị cấp" thẳng, không hỏi gì. App thì **bắt ghi lý do** — đây là luật
 * Ban lãnh đạo đặt ra khi làm `suaThoiHan`: ngày cần hàng là **cam kết với công trình**, đổi mà
 * không nói vì sao thì bên đề nghị chỉ thấy ngày tự nhiên lùi ra và không tra được ai lùi. Vì vậy
 * ô "Lý do đổi thời hạn" chỉ hiện ra **khi ngày-giờ thật sự đổi**, và lúc đó là bắt buộc. Bỏ luật
 * này để cho giống ảnh 100% là làm mất một chốt kiểm soát đã có chủ ý.
 *
 * ## 📌 BA Ô BÁO GIÁ CÓ TÊN RIÊNG
 * App vốn giữ tệp của mỗi bước thành MỘT DANH SÁCH (tối đa 5 tệp), không có khái niệm "ô số 1, ô
 * số 2". Để dựng đúng ba ô có tên như ảnh mà không phải đổi cấu trúc dữ liệu, mỗi ô đánh dấu tệp
 * của mình bằng **ghi chú tệp** (`GHI_CHU_O_BAO_GIA`) — ghi chú vốn đã là chỗ ghi nhãn cho chứng
 * từ. Tệp không mang nhãn nào thì thuộc ô "Báo giá khác".
 * ⚠️ Hệ quả phải biết: người dùng tự sửa ghi chú của một tệp ở khối đính kèm ngoài trang chi tiết
 * thì tệp đó chuyển ô. Không mất dữ liệu, chỉ đổi chỗ hiển thị.
 */

/** Nhãn ghi chú đánh dấu ba ô báo giá có tên riêng — xem khối chú thích đầu file. */
const GHI_CHU_O_BAO_GIA = ["Báo giá NCC 1", "Báo giá NCC 2", "Báo giá NCC 3"] as const;

/** Bước giữ tệp báo giá nhà cung cấp. */
const BUOC_BAO_GIA = "xet_duyet_bao_gia";

/** Số báo giá cho ô chọn "SL Báo giá". Trùng ngưỡng của `o-sua-so-bao-gia.tsx`. */
const CHON_SO_BAO_GIA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Dòng bảng "Chi tiết" ở dạng chuỗi thô đang gõ — đổi sang số lúc lưu. */
interface DongGo {
  stt: number;
  tenVatLieu: string;
  quyCach: string;
  khoiLuong: string;
  donViTinh: string;
  mucDichSuDung: string;
  /** Giữ nguyên phần dữ liệu KHÔNG hiện trên bảng này (phân bổ, ghi chú, cờ định mức). */
  goc?: DongDeNghi;
}

export function HopSuaTruongTuyChinh({
  mo,
  deNghi,
  onDong,
}: {
  mo: boolean;
  deNghi: DeNghiMuaHang;
  onDong: () => void;
}) {
  const {
    suaThongTinChung,
    suaThoiHan,
    suaMatHangDeNghi,
    datSoBaoGiaChoPhieu,
    themTepGiaiDoan,
    datGhiChuTepGiaiDoan,
  } = useDuLieu();
  const { nguoiDung } = useNguoiDung();

  const [tieuDe, setTieuDe] = useState("");
  const [phongBan, setPhongBan] = useState("");
  const [nhomDeXuat, setNhomDeXuat] = useState<NhomDeXuat>("khac");
  const [ngay, setNgay] = useState("");
  const [gio, setGio] = useState("");
  const [lyDoDoiHan, setLyDoDoiHan] = useState("");
  const [link, setLink] = useState("");
  const [dong, setDong] = useState<DongGo[]>([]);
  const [soBaoGia, setSoBaoGia] = useState("");
  /** Nhóm nào đang mở. Mặc định mở nhóm đầu — đó là nhóm người dùng sửa nhiều nhất. */
  const [nhomMo, setNhomMo] = useState<string[]>(["nhap_moi"]);

  /**
   * Nạp lại toàn bộ giá trị THẬT của hồ sơ mỗi lần mở hộp.
   * ⚠️ Mở → sửa dở → Bỏ qua → mở lại phải thấy giá trị của hồ sơ, không phải chữ gõ dở lần trước.
   */
  useEffect(() => {
    if (!mo) return;
    setTieuDe(deNghi.tieuDe);
    setPhongBan(deNghi.phongBanNguon);
    setNhomDeXuat(deNghi.nhomDeXuat ?? "khac");
    /* `ngayCanHang` có thể là "2026-08-27" hoặc ISO đầy đủ "2026-08-27T16:25" — tách làm hai ô
       như Base. Ô ngày của trình duyệt chỉ nhận đúng 10 ký tự đầu, đưa cả chuỗi ISO vào là ô
       hiện TRỐNG mà không báo gì. */
    setNgay(deNghi.ngayCanHang.slice(0, 10));
    setGio(deNghi.ngayCanHang.includes("T") ? deNghi.ngayCanHang.slice(11, 16) : "");
    setLyDoDoiHan("");
    setLink(deNghi.linkPhieuDeNghi ?? "");
    setDong(
      deNghi.items.map((d) => ({
        stt: d.stt,
        tenVatLieu: d.tenVatLieu,
        quyCach: d.quyCach ?? "",
        khoiLuong: String(d.khoiLuongDeNghi),
        donViTinh: d.donViTinh,
        mucDichSuDung: d.mucDichSuDung ?? "",
        goc: d,
      })),
    );
    /* SL Báo giá: lấy số CHUNG của mọi dòng đã giao. Mỗi dòng một số thì để trống ô chọn — đặt
       lại ở đây sẽ ghi đè số riêng của từng dòng, đúng cái bẫy đã ghi trong `o-sua-so-bao-gia`. */
    const so = deNghi.items
      .map((d) => d.soBaoGiaYeuCau)
      .filter((x): x is number => typeof x === "number" && x > 0);
    const chung = so.length > 0 && Math.min(...so) === Math.max(...so) ? so[0] : undefined;
    setSoBaoGia(chung === undefined ? "" : String(chung));
  }, [mo, deNghi]);

  /** Tệp của bước ③, tra theo nhãn ghi chú. */
  const tepBuocBaoGia: MoTaTep[] = deNghi.tepGiaiDoan?.[BUOC_BAO_GIA] ?? [];
  const tepTheoO = GHI_CHU_O_BAO_GIA.map((nhan) =>
    tepBuocBaoGia.find((t) => (t.ghiChu ?? "").trim() === nhan),
  );
  const tepKhac = tepBuocBaoGia.filter(
    (t) => !GHI_CHU_O_BAO_GIA.includes((t.ghiChu ?? "").trim() as (typeof GHI_CHU_O_BAO_GIA)[number]),
  );

  const ngayGioMoi = ngay === "" ? "" : gio === "" ? ngay : `${ngay}T${gio}`;
  const doiNgayGio = ngayGioMoi !== "" && ngayGioMoi !== deNghi.ngayCanHang;

  const hopLe =
    tieuDe.trim() !== "" &&
    ngay !== "" &&
    dong.length > 0 &&
    // Đổi ngày thì bắt ghi lý do — xem khối chú thích đầu file.
    (!doiNgayGio || lyDoDoiHan.trim() !== "");

  function suaDong(i: number, phan: Partial<DongGo>) {
    setDong((t) => t.map((x, k) => (k === i ? { ...x, ...phan } : x)));
  }

  /**
   * Đính kèm vào MỘT Ô CÓ TÊN: cất tệp vào danh sách của bước rồi gắn nhãn ghi chú.
   *
   * ⚠️ Hai lần ghi liên tiếp vào cùng một hồ sơ. Phải chờ `themTepGiaiDoan` xong (nó trả lý do
   * lỗi chứ không ném) rồi mới gắn ghi chú — gắn trước thì tệp chưa tồn tại, ghi chú rơi mất
   * lặng lẽ và tệp nằm sai ô.
   */
  function ganTepVaoO(tep: MoTaTep, nhan: string) {
    const loi = themTepGiaiDoan(deNghi.id, BUOC_BAO_GIA, [tep], nguoiDung.tenHienThi);
    if (loi) {
      toast.error("Không lưu được tệp vào hồ sơ", { description: loi });
      return;
    }
    datGhiChuTepGiaiDoan(deNghi.id, BUOC_BAO_GIA, tep.id, nhan, nguoiDung.tenHienThi);
  }

  function capNhat() {
    /* 🔴 GỌI TỪNG HÀM RIÊNG, mỗi hàm chỉ khi trường của nó THẬT SỰ đổi. Gọi hết mọi lần bấm là
       nhật ký hồ sơ đầy dòng "đã sửa" mà chẳng sửa gì — mỗi hàm đều tự ghi một dòng. */
    const doiThongTin =
      tieuDe.trim() !== deNghi.tieuDe ||
      phongBan !== deNghi.phongBanNguon ||
      nhomDeXuat !== (deNghi.nhomDeXuat ?? "khac") ||
      link.trim() !== (deNghi.linkPhieuDeNghi ?? "");
    if (doiThongTin) {
      suaThongTinChung(
        deNghi.id,
        {
          tieuDe: tieuDe.trim(),
          phongBanNguon: phongBan,
          nhomDeXuat,
          linkPhieuDeNghi: link.trim(),
        },
        nguoiDung.tenHienThi,
      );
    }

    if (doiNgayGio) suaThoiHan(deNghi.id, ngayGioMoi, lyDoDoiHan.trim(), nguoiDung.tenHienThi);

    /* Bảng "Chi tiết": dựng lại danh sách dòng, GIỮ nguyên phần dữ liệu không hiện trên bảng
       (người phụ trách, số báo giá yêu cầu, ghi chú giao việc). Bỏ qua chúng là mỗi lần sửa tên
       một mặt hàng lại xóa sạch việc đã giao. */
    const dongMoi: DongDeNghi[] = dong.map((d, i) => ({
      ...(d.goc ?? { stt: i + 1, tenVatLieu: "", donViTinh: "", khoiLuongDeNghi: 0 }),
      stt: d.goc?.stt ?? i + 1,
      tenVatLieu: d.tenVatLieu.trim(),
      quyCach: d.quyCach.trim() || undefined,
      donViTinh: d.donViTinh.trim(),
      khoiLuongDeNghi: Number(d.khoiLuong) || 0,
      mucDichSuDung: d.mucDichSuDung.trim() || undefined,
    }));
    const doiDong = JSON.stringify(dongMoi) !== JSON.stringify(deNghi.items);
    if (doiDong) {
      const loi = suaMatHangDeNghi(deNghi.id, dongMoi, nguoiDung.tenHienThi);
      if (loi) {
        // 🔴 KHÔNG ĐÓNG HỘP khi tầng dữ liệu từ chối: đóng là người dùng tưởng đã lưu xong.
        toast.error("Không sửa được danh sách mặt hàng", { description: loi });
        return;
      }
    }

    const soMoi = Number(soBaoGia);
    const soCu = dong[0]?.goc?.soBaoGiaYeuCau;
    if (soBaoGia !== "" && soMoi > 0 && soMoi !== soCu) {
      datSoBaoGiaChoPhieu(deNghi.id, soMoi, nguoiDung.tenHienThi);
    }

    toast.success("Đã cập nhật các trường dữ liệu");
    onDong();
  }

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      {/* 🔴 PHẢI VIẾT `sm:max-w-…`: `DialogContent` có sẵn `sm:max-w-sm` trong lớp gốc, class
          không có tiền tố `sm:` bị đè IM LẶNG và hộp kẹt ở 384px (bài học 15/08/2026, CLAUDE.md
          mục 5). Hộp này có bảng 6 cột nên cần rộng.
          `max-h` + cuộn DỌC: nội dung dài hơn màn hình thì cuộn trong hộp, không đẩy nút
          "Cập nhật" ra khỏi tầm mắt. */}
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa các trường dữ liệu tùy chỉnh</DialogTitle>
          <DialogDescription>
            {deNghi.code} — mọi thay đổi được ghi vào nhật ký kèm giá trị cũ và người sửa.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-(--hp-md-card-gap) overflow-y-auto">
          {/* ---------- TÊN NHIỆM VỤ: đứng ngoài mọi nhóm, đúng như Base ---------- */}
          <Truong nhan="Tên nhiệm vụ" batBuoc id="tc-tieu-de">
            <Input
              id="tc-tieu-de"
              value={tieuDe}
              onChange={(e) => setTieuDe(e.target.value)}
              placeholder="Vật tư thi công phần thân đợt 4"
            />
          </Truong>

          {/* ---------- NHÓM ①: TRƯỜNG DỮ LIỆU KHI NHẬP MỚI ---------- */}
          <Nhom
            ma="nhap_moi"
            nhan="Trường dữ liệu khi nhập mới"
            mo={nhomMo.includes("nhap_moi")}
            onBam={() =>
              setNhomMo((c) =>
                c.includes("nhap_moi") ? c.filter((x) => x !== "nhap_moi") : [...c, "nhap_moi"],
              )
            }
          >
            <Truong
              nhan="Bộ phận"
              batBuoc
              moTa="Bạn thuộc phòng ban hay bộ phận nào?"
              id="tc-bo-phan"
            >
              <OChon id="tc-bo-phan" value={phongBan} onChange={setPhongBan}>
                {DANH_MUC_PHONG_BAN.map((p) => (
                  <option key={p.ma} value={p.ma}>
                    {p.ten}
                  </option>
                ))}
              </OChon>
            </Truong>

            <Truong nhan="Nhóm đề xuất" batBuoc id="tc-nhom">
              <OChon
                id="tc-nhom"
                value={nhomDeXuat}
                onChange={(v) => setNhomDeXuat(v as NhomDeXuat)}
              >
                {(Object.keys(NHAN_NHOM_DE_XUAT) as NhomDeXuat[]).map((k) => (
                  <option key={k} value={k}>
                    {NHAN_NHOM_DE_XUAT[k]}
                  </option>
                ))}
              </OChon>
            </Truong>

            <Truong
              nhan="Ngày đề nghị cấp"
              batBuoc
              moTa="Ghi rõ ngày-giờ đề nghị cấp"
              id="tc-ngay"
            >
              <div className="flex flex-wrap gap-2">
                <Input
                  id="tc-ngay"
                  type="date"
                  value={ngay}
                  onChange={(e) => setNgay(e.target.value)}
                  className="w-40"
                />
                <Input
                  type="time"
                  value={gio}
                  onChange={(e) => setGio(e.target.value)}
                  aria-label="Giờ đề nghị cấp"
                  className="w-28"
                />
              </div>
            </Truong>

            {/* ⚠️ CHỈ HIỆN KHI NGÀY-GIỜ ĐỔI — xem khối chú thích đầu file. Hiện sẵn thì người
                chỉ vào sửa tiêu đề cũng thấy một ô bắt buộc không liên quan. */}
            {doiNgayGio && (
              <Truong nhan="Lý do đổi thời hạn" batBuoc id="tc-ly-do">
                <Input
                  id="tc-ly-do"
                  value={lyDoDoiHan}
                  onChange={(e) => setLyDoDoiHan(e.target.value)}
                  placeholder="Công trình lùi tiến độ đổ sàn tầng 3"
                />
                <span className="text-xs text-text-desc">
                  Bắt buộc — ngày cần hàng là cam kết với công trình, đổi phải nói rõ vì sao.
                </span>
              </Truong>
            )}

            {/* ---------- BẢNG "CHI TIẾT" ---------- */}
            <Truong nhan="Chi tiết" batBuoc>
              {/* Bảng 6 cột trên màn hẹp thì CUỘN TRONG KHUNG, không bóp cột đến mức không gõ
                  được. `overflow-x-auto` phải bọc riêng bảng, không bọc cả hộp. */}
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[42rem] border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted text-left text-[11px] font-semibold tracking-wide text-text-desc uppercase">
                      <th className="w-10 px-2 py-2">#</th>
                      <th className="px-2 py-2">Tên mặt hàng</th>
                      <th className="px-2 py-2">Quy cách</th>
                      <th className="w-24 px-2 py-2">Số lượng</th>
                      <th className="w-20 px-2 py-2">ĐVT</th>
                      <th className="px-2 py-2">Mục đích sử dụng</th>
                      <th className="w-11 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {dong.map((d, i) => (
                      <tr key={d.goc?.stt ?? `moi-${i}`} className="border-t border-border">
                        <td className="px-2 py-1.5 text-center text-xs text-text-desc tabular-nums">
                          {i + 1}
                        </td>
                        <td className="px-2 py-1.5">
                          <OGoTrongBang
                            value={d.tenVatLieu}
                            onChange={(v) => suaDong(i, { tenVatLieu: v })}
                            nhan={`Tên mặt hàng dòng ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <OGoTrongBang
                            value={d.quyCach}
                            onChange={(v) => suaDong(i, { quyCach: v })}
                            nhan={`Quy cách dòng ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <OGoTrongBang
                            value={d.khoiLuong}
                            onChange={(v) => suaDong(i, { khoiLuong: v })}
                            nhan={`Số lượng dòng ${i + 1}`}
                            soLuong
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <OGoTrongBang
                            value={d.donViTinh}
                            onChange={(v) => suaDong(i, { donViTinh: v })}
                            nhan={`Đơn vị tính dòng ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <OGoTrongBang
                            value={d.mucDichSuDung}
                            onChange={(v) => suaDong(i, { mucDichSuDung: v })}
                            nhan={`Mục đích sử dụng dòng ${i + 1}`}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => setDong((x) => x.filter((_, k) => k !== i))}
                            aria-label={`Xóa dòng ${i + 1}`}
                            title="Xóa dòng"
                            className="flex size-9 items-center justify-center rounded-md text-text-desc transition-colors hover:bg-muted hover:text-danger"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() =>
                  setDong((t) => [
                    ...t,
                    {
                      // STT mới nối tiếp số lớn nhất đang có — KHÔNG dùng `length + 1`: xóa dòng
                      // giữa rồi thêm mới sẽ ra STT trùng, mà STT là khóa đối chiếu khối lượng
                      // của dòng đơn hàng và dòng nhận hàng.
                      stt: Math.max(0, ...t.map((x) => x.stt)) + 1,
                      tenVatLieu: "",
                      quyCach: "",
                      khoiLuong: "",
                      donViTinh: "",
                      mucDichSuDung: "",
                    },
                  ])
                }
              >
                <Plus className="size-4" aria-hidden />
                Thêm dòng mới
              </Button>
            </Truong>

            <Truong nhan="Link phiếu đề nghị" id="tc-link">
              <Input
                id="tc-link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://… hoặc đường dẫn thư mục chung của phòng"
              />
            </Truong>
          </Nhom>

          {/* ---------- NHÓM ②: YÊU CẦU NCC BÁO GIÁ ---------- */}
          <Nhom
            ma="bao_gia"
            nhan={NHAN_GIAI_DOAN.yeu_cau_bao_gia.nhan}
            mo={nhomMo.includes("bao_gia")}
            onBam={() =>
              setNhomMo((c) =>
                c.includes("bao_gia") ? c.filter((x) => x !== "bao_gia") : [...c, "bao_gia"],
              )
            }
          >
            <Truong nhan="SL Báo giá" id="tc-sl-bao-gia">
              <OChon id="tc-sl-bao-gia" value={soBaoGia} onChange={setSoBaoGia}>
                <option value="">— chưa đặt —</option>
                {CHON_SO_BAO_GIA.map((n) => (
                  <option key={n} value={String(n)}>
                    {n} báo giá
                  </option>
                ))}
              </OChon>
              <span className="text-xs text-text-desc">
                Đặt ở đây là áp cho <strong>mọi dòng</strong> của phiếu. Muốn mỗi dòng một số khác
                nhau thì đặt lúc giao việc ở bảng Phân bổ.
              </span>
            </Truong>
          </Nhom>

          {/* ---------- NHÓM ③: XÉT DUYỆT BÁO GIÁ ---------- */}
          <Nhom
            ma="xet_duyet"
            nhan={NHAN_GIAI_DOAN.xet_duyet_bao_gia.nhan}
            mo={nhomMo.includes("xet_duyet")}
            onBam={() =>
              setNhomMo((c) =>
                c.includes("xet_duyet") ? c.filter((x) => x !== "xet_duyet") : [...c, "xet_duyet"],
              )
            }
          >
            {GHI_CHU_O_BAO_GIA.map((nhan, i) => (
              <Truong key={nhan} nhan={`${nhan} (PDF)`}>
                <ODinhKemTep
                  tep={tepTheoO[i]}
                  nhanThem="Chọn tệp"
                  nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
                  onXong={(t) => ganTepVaoO(t, nhan)}
                />
              </Truong>
            ))}

            <Truong
              nhan="Báo giá khác (PDF)"
              moTa="Upload các báo giá còn lại theo thứ tự ưu tiên"
            >
              <ODinhKemNhieuTep
                tep={tepKhac}
                nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
                nhan="Chọn tệp"
                onDoi={(moi) => {
                  /* Chỉ xử lý phần THÊM. Việc gỡ tệp đi qua khối đính kèm ở trang chi tiết —
                     nơi có hộp hỏi xác nhận, vì gỡ chứng từ khỏi hồ sơ không hoàn lại được. */
                  const themVao = moi.filter((t) => !tepKhac.some((c) => c.id === t.id));
                  for (const t of themVao) {
                    const loi = themTepGiaiDoan(
                      deNghi.id,
                      BUOC_BAO_GIA,
                      [t],
                      nguoiDung.tenHienThi,
                    );
                    if (loi) toast.error("Không lưu được tệp vào hồ sơ", { description: loi });
                  }
                }}
              />
            </Truong>
          </Nhom>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Bỏ qua
          </Button>
          <Button disabled={!hopLe} onClick={capNhat}>
            Cập nhật
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// CÁC MẢNH NHỎ CỦA HỘP
// ------------------------------------------------------------

/**
 * Một nhóm gập được.
 *
 * 📌 Dùng đúng kiểu chữ và màu của khối bước ở trang chi tiết
 * (`khoi-dau-vao-theo-giai-doan.tsx`): hai chỗ cùng nói về một bước quy trình, nhìn khác nhau là
 * người dùng phải học hai lần.
 */
function Nhom({
  ma,
  nhan,
  mo,
  onBam,
  children,
}: {
  ma: string;
  nhan: string;
  mo: boolean;
  onBam: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-primary/30">
      <button
        type="button"
        onClick={onBam}
        aria-expanded={mo}
        aria-controls={`nhom-${ma}`}
        className="flex min-h-11 w-full items-center gap-2 bg-primary-bg px-3 py-2.5 text-left transition-colors hover:bg-primary/10"
      >
        <ChevronRight
          className={`size-4 shrink-0 text-primary transition-transform ${mo ? "rotate-90" : ""}`}
          aria-hidden
        />
        <span className="text-[11px] font-semibold tracking-wide text-primary uppercase">
          {nhan}
        </span>
      </button>
      {mo && (
        <div id={`nhom-${ma}`} className="flex flex-col gap-(--hp-md-card-gap) p-3">
          {/* Nhãn "ĐẦU VÀO" y như trên trang chi tiết — cùng một thứ thì gọi cùng một tên. */}
          <p className="flex items-center gap-1.5 text-xs font-semibold text-text-desc uppercase">
            <LogIn className="size-3.5 shrink-0" aria-hidden />
            Đầu vào
          </p>
          {children}
        </div>
      )}
    </section>
  );
}

/** Một trường: nhãn (kèm dấu * nếu bắt buộc) · mô tả phụ · ô nhập. */
function Truong({
  nhan,
  moTa,
  batBuoc = false,
  id,
  children,
}: {
  nhan: string;
  moTa?: string;
  batBuoc?: boolean;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {nhan}
        {/* Dấu * có `aria-hidden` và kèm chữ cho trình đọc màn hình: chỉ dùng dấu sao thì người
            dùng trình đọc không biết trường nào bắt buộc. */}
        {batBuoc && (
          <>
            <span aria-hidden className="text-danger">
              {" *"}
            </span>
            <span className="sr-only"> (bắt buộc)</span>
          </>
        )}
      </Label>
      {moTa && <span className="text-xs text-text-desc">{moTa}</span>}
      {children}
    </div>
  );
}

/**
 * Ô chọn.
 *
 * 🔴 DÙNG `<select>` GỐC CỦA TRÌNH DUYỆT, không dùng `Select` của base-ui: `Select` mở danh sách
 * bằng một lớp nổi riêng, mà hộp thoại này cũng là một lớp nổi có bẫy tiêu điểm — trong app chưa
 * có chỗ nào ghép hai thứ đó nên chưa có gì bảo đảm nó mở được. Ô chọn gốc thì chắc chắn chạy,
 * và trên điện thoại còn hiện bộ chọn của hệ điều hành, dễ bấm hơn.
 * 📌 Đã tô đúng token nền/viền/chữ như `Input` để không lệch khỏi Design System.
 */
function OChon({
  id,
  value,
  onChange,
  children,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors hover:border-primary focus:border-primary focus:outline-none"
    >
      {children}
    </select>
  );
}

/**
 * Ô gõ trong bảng "Chi tiết" — viền mảnh, không nền, để bảng đọc như bảng chứ không như một dãy
 * hộp nhập. Vùng chạm vẫn đủ cao (`min-h-9` + đệm hàng của ô bảng).
 */
function OGoTrongBang({
  value,
  onChange,
  nhan,
  soLuong = false,
}: {
  value: string;
  onChange: (v: string) => void;
  nhan: string;
  soLuong?: boolean;
}) {
  const oRef = useRef<HTMLInputElement>(null);
  return (
    <input
      ref={oRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={nhan}
      inputMode={soLuong ? "decimal" : undefined}
      className={`min-h-9 w-full rounded-md border border-transparent bg-transparent px-1.5 text-sm text-text-primary transition-colors hover:border-border focus:border-primary focus:outline-none ${
        soLuong ? "text-right tabular-nums" : ""
      }`}
    />
  );
}
