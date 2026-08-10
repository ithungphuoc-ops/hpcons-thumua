"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Inbox, Paperclip, Plus, Save, Trash2, Wand2, X } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import {
  NHAN_PHONG_BAN,
  nhanSuDangLamViec,
  timNhanSu,
  type NhanSu,
} from "@/3-du-lieu/danh-ba-nhan-su";

/**
 * CÔNG CỤ GIẢ LẬP — nhận một đề nghị mua hàng đã duyệt từ Phòng Thi công.
 *
 * 🔴 ĐÂY KHÔNG PHẢI NGHIỆP VỤ THẬT. Theo kiến trúc đã chốt, đề nghị do Phòng Thi công
 * lập và Ban chỉ huy duyệt trên HPcore; app Thu mua CHỈ ĐỌC, không tự tạo đề nghị.
 * Màn này chỉ để chạy thử được trọn vòng khi chưa nối Firebase.
 * Khi nối dữ liệu thật: XÓA màn này và xóa `themDeNghiGiaLap` trong kho dữ liệu.
 */

interface DongNhap {
  tenVatLieu: string;
  quyCach: string;
  donViTinh: string;
  khoiLuong: string;
  mucDichSuDung: string;
  vatTuKiemSoatDinhMuc: boolean;
}

const DONG_TRONG: DongNhap = {
  tenVatLieu: "",
  quyCach: "",
  donViTinh: "",
  khoiLuong: "",
  mucDichSuDung: "",
  vatTuKiemSoatDinhMuc: false,
};

/** Khóa lưu bản nháp trong trình duyệt — xem nút "Lưu nháp". */
const KHOA_BAN_NHAP = "hpcons-tm-de-nghi-nhap";

function homNay(): string {
  return new Date().toISOString().slice(0, 10);
}

function congNgay(soNgay: number): string {
  const d = new Date();
  d.setDate(d.getDate() + soNgay);
  return d.toISOString().slice(0, 10);
}

export default function TrangNhanDeNghiMoi() {
  const router = useRouter();
  const { deNghi, themDeNghiGiaLap } = useDuLieu();

  const [maDuAn, setMaDuAn] = useState("");
  const [tenCongTrinh, setTenCongTrinh] = useState("");
  const [maHopDongCDT, setMaHopDongCDT] = useState("");
  const [tieuDe, setTieuDe] = useState("");
  const [nguoiDeNghiTen, setNguoiDeNghiTen] = useState("Phạm Văn F");
  const [ngayDeNghi, setNgayDeNghi] = useState(homNay);
  const [ngayDuyet, setNgayDuyet] = useState(homNay);
  const [ngayCanHang, setNgayCanHang] = useState("");
  const [gap, setGap] = useState(false);
  const [dong, setDong] = useState<DongNhap[]>([{ ...DONG_TRONG }]);
  const [nguoiTheoDoi, setNguoiTheoDoi] = useState<NhanSu[]>([]);
  const [timNguoi, setTimNguoi] = useState("");

  /** Các dự án đã có trong hệ thống — bấm để điền nhanh, khỏi gõ lại. */
  const duAnDaCo = useMemo(() => {
    const map = new Map<string, { maDuAn: string; tenCongTrinh: string; maHopDongCDT?: string }>();
    for (const dn of deNghi) {
      if (!map.has(dn.maDuAn)) {
        map.set(dn.maDuAn, {
          maDuAn: dn.maDuAn,
          tenCongTrinh: dn.tenCongTrinh,
          maHopDongCDT: dn.maHopDongCDT,
        });
      }
    }
    return [...map.values()];
  }, [deNghi]);

  const dongHopLe = dong.filter(
    (d) => d.tenVatLieu.trim() !== "" && d.donViTinh.trim() !== "" && Number(d.khoiLuong) > 0,
  );
  const hopLe =
    maDuAn.trim() !== "" &&
    tenCongTrinh.trim() !== "" &&
    tieuDe.trim() !== "" &&
    ngayCanHang !== "" &&
    dongHopLe.length > 0;

  function chonDuAn(d: { maDuAn: string; tenCongTrinh: string; maHopDongCDT?: string }) {
    setMaDuAn(d.maDuAn);
    setTenCongTrinh(d.tenCongTrinh);
    setMaHopDongCDT(d.maHopDongCDT ?? "");
  }

  /** Điền sẵn một đề nghị đủ dữ liệu để Sếp bấm thử nhanh, khỏi gõ tay. */
  function dienNhanh() {
    const mau = duAnDaCo[0];
    setMaDuAn(mau?.maDuAn ?? "260001-HPCS");
    setTenCongTrinh(mau?.tenCongTrinh ?? "Nhà xưởng ABC — Giai đoạn 2");
    setMaHopDongCDT(mau?.maHopDongCDT ?? "");
    setTieuDe("Vật tư thử nghiệm — tạo lúc " + new Date().toLocaleTimeString("vi-VN"));
    setNguoiDeNghiTen("Phạm Văn F");
    setNgayDeNghi(homNay());
    setNgayDuyet(homNay());
    setNgayCanHang(congNgay(10));
    setGap(false);
    setDong([
      { tenVatLieu: "Xi măng PCB40", quyCach: "bao 50kg", donViTinh: "Bao", khoiLuong: "150", mucDichSuDung: "Đổ bê tông móng", vatTuKiemSoatDinhMuc: false },
      { tenVatLieu: "Thép thanh vằn D14", quyCach: "CB400-V", donViTinh: "Kg", khoiLuong: "2400", mucDichSuDung: "Cốt thép cột trục 1-4", vatTuKiemSoatDinhMuc: true },
      { tenVatLieu: "Cát xây tô", quyCach: "", donViTinh: "m³", khoiLuong: "60", mucDichSuDung: "Xây tô tường bao", vatTuKiemSoatDinhMuc: false },
    ]);
    toast.info("Đã điền sẵn một đề nghị mẫu", { description: "Sửa lại tùy ý rồi bấm Nhận đề nghị." });
  }

  function suaDong(i: number, thayDoi: Partial<DongNhap>) {
    setDong((truoc) => truoc.map((d, idx) => (idx === i ? { ...d, ...thayDoi } : d)));
  }

  /** Gợi ý người theo dõi — bỏ người đã chọn, gõ không dấu vẫn ra. Chỉ hiện khi đang gõ. */
  const goiYNguoi = useMemo(() => {
    if (timNguoi.trim() === "") return [];
    const conLai = nhanSuDangLamViec().filter(
      (n) => !nguoiTheoDoi.some((x) => x.uid === n.uid),
    );
    return timNhanSu(conLai, timNguoi).slice(0, 6);
  }, [timNguoi, nguoiTheoDoi]);

  /**
   * LƯU NHÁP vào bộ nhớ trình duyệt.
   *
   * ⚠️ Đây là chỗ CỐ Ý khác bản thật: bản thật lưu nháp vào Firestore để mở lại được
   * ở máy khác. Bản chạy thử chưa nối Firebase nên lưu tạm ở `localStorage` — vẫn giải
   * quyết đúng nỗi đau chính là lỡ tải lại trang thì mất hết công gõ.
   */
  function luuNhap() {
    try {
      window.localStorage.setItem(
        KHOA_BAN_NHAP,
        JSON.stringify({
          maDuAn, tenCongTrinh, maHopDongCDT, tieuDe, nguoiDeNghiTen,
          ngayDeNghi, ngayDuyet, ngayCanHang, gap, dong,
          nguoiTheoDoi: nguoiTheoDoi.map((n) => n.uid),
        }),
      );
      toast.success("Đã lưu nháp", {
        description: "Mở lại màn này là nội dung tự hiện ra.",
      });
    } catch {
      // Trình duyệt chặn localStorage (chế độ riêng tư) — báo thật, không im lặng.
      toast.error("Không lưu nháp được", {
        description: "Trình duyệt đang chặn bộ nhớ cục bộ.",
      });
    }
  }

  function taiNhap() {
    try {
      const raw = window.localStorage.getItem(KHOA_BAN_NHAP);
      if (!raw) {
        toast.info("Chưa có bản nháp nào được lưu");
        return;
      }
      const n = JSON.parse(raw);
      setMaDuAn(n.maDuAn ?? "");
      setTenCongTrinh(n.tenCongTrinh ?? "");
      setMaHopDongCDT(n.maHopDongCDT ?? "");
      setTieuDe(n.tieuDe ?? "");
      setNguoiDeNghiTen(n.nguoiDeNghiTen ?? "Phạm Văn F");
      setNgayDeNghi(n.ngayDeNghi ?? homNay());
      setNgayDuyet(n.ngayDuyet ?? homNay());
      setNgayCanHang(n.ngayCanHang ?? "");
      setGap(Boolean(n.gap));
      setDong(Array.isArray(n.dong) && n.dong.length > 0 ? n.dong : [{ ...DONG_TRONG }]);
      const ds = nhanSuDangLamViec();
      setNguoiTheoDoi((n.nguoiTheoDoi ?? []).map((uid: string) => ds.find((x) => x.uid === uid)).filter(Boolean));
      toast.success("Đã mở bản nháp đã lưu");
    } catch {
      toast.error("Bản nháp bị hỏng, không mở được");
    }
  }

  function nhanDeNghi() {
    const id = themDeNghiGiaLap({
      maDuAn: maDuAn.trim(),
      maHopDongCDT: maHopDongCDT.trim() || undefined,
      tenCongTrinh: tenCongTrinh.trim(),
      tieuDe: tieuDe.trim(),
      nguoiDeNghiTen: nguoiDeNghiTen.trim() || "Phòng Thi công",
      ngayDeNghi,
      ngayDuyet,
      ngayCanHang,
      mucDoUuTien: gap ? "gap" : "binh_thuong",
      items: dongHopLe.map((d) => ({
        tenVatLieu: d.tenVatLieu.trim(),
        quyCach: d.quyCach.trim() || undefined,
        donViTinh: d.donViTinh.trim(),
        khoiLuongDeNghi: Number(d.khoiLuong),
        mucDichSuDung: d.mucDichSuDung.trim() || undefined,
        vatTuKiemSoatDinhMuc: d.vatTuKiemSoatDinhMuc || undefined,
      })),
      nguoiTheoDoi: nguoiTheoDoi.map((n) => ({
        uid: n.uid,
        ten: n.displayName,
        chucDanh: n.title,
      })),
    });

    if (!id) {
      toast.error("Đã hết chỗ cho đề nghị thử", {
        description: "Bản chạy thử chỉ nhận được 12 đề nghị giả lập. Tải lại trang để về dữ liệu gốc.",
      });
      return;
    }

    toast.success("Đã nhận đề nghị từ Phòng Thi công", {
      description: "Thẻ mới nằm ở cột đầu tiên — Tiếp nhận và kiểm tra.",
    });
    router.push("/de-nghi");
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Thu mua", href: "/tong-quan" },
          { label: "Quy trình mua hàng", href: "/de-nghi" },
          { label: "Nhận đề nghị mới" },
        ]}
        title="Tạo đề nghị mới (giả lập)"
        description="Mô phỏng việc Phòng Thi công gửi một đề nghị ĐÃ DUYỆT sang Phòng Thu mua qua HPcore"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={taiNhap}>
              Mở bản nháp
            </Button>
            <Button variant="outline" size="sm" onClick={dienNhanh}>
              <Wand2 className="size-4" aria-hidden />
              Điền nhanh mẫu
            </Button>
          </div>
        }
      />

      {/* Cảnh báo: đây không phải nghiệp vụ thật */}
      <Card className="border-warning/40 bg-warning-bg">
        <CardContent className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-warning-soft">Đây là công cụ chạy thử</p>
          <p className="text-xs text-text-secondary">
            Ở bản thật, app Thu mua <strong>không tạo được đề nghị</strong> — đề nghị do Phòng Thi công
            lập và Ban chỉ huy duyệt trên HPcore, app này chỉ đọc. Màn này chỉ để bấm thử trọn vòng
            khi chưa nối Firebase.
          </p>
        </CardContent>
      </Card>

      {/* KHỐI LƯU Ý — đặt ngay đầu phiếu như biểu mẫu "Tạo đề xuất mới" đang dùng
          trên Base.vn, để người lập phiếu đọc quy định trước khi gõ. */}
      <Card className="border-success/30 bg-success-bg">
        <CardContent className="flex flex-col gap-1.5 text-xs text-text-secondary">
          <p className="text-sm font-semibold text-success-soft">Các lưu ý khi lập đề nghị</p>
          <p>
            <strong>1. Nội dung đề nghị:</strong> ghi theo mẫu “Số hợp đồng + tên công trình
            (ngắn gọn)”, hoặc “Tên phòng ban đề nghị”.
          </p>
          <p>
            <strong>2. Mã dự án gốc</strong> bám Thông báo 09/2026/TB-HPCS. Mã đề nghị do hệ thống
            tự sinh, người lập <strong>không tự đặt</strong>.
          </p>
          <p>
            <strong>3. Người theo dõi:</strong> thêm các cá nhân có liên quan để họ nắm được tiến
            trình. Có tên trong danh sách <strong>không mở khóa quyền xem đơn giá</strong>.
          </p>
          <p>
            <strong>4. Thời gian:</strong> nên đề nghị trước ngày cần hàng ít nhất 2 ngày làm việc.
          </p>
        </CardContent>
      </Card>

      {/* PHIẾU ĐỀ NGHỊ — bố cục NHÃN BÊN TRÁI, Ô NHẬP BÊN PHẢI theo đúng biểu mẫu
          "Tạo đề xuất mới" đang dùng trên Base.vn (chỉ đạo Ban lãnh đạo 08/08/2026).
          Dưới 768px tự xếp thành một cột để điện thoại vẫn nhập được. */}
      <Card>
        <CardContent className="flex flex-col">
          {duAnDaCo.length > 0 && (
            <Truong nhan="Chọn nhanh dự án" moTa="Bấm để điền sẵn mã dự án, công trình và hợp đồng">
              <div className="flex flex-wrap gap-2">
                {duAnDaCo.map((d) => (
                  <Button
                    key={d.maDuAn}
                    variant={maDuAn === d.maDuAn ? "default" : "outline"}
                    size="sm"
                    onClick={() => chonDuAn(d)}
                  >
                    {d.maDuAn}
                  </Button>
                ))}
              </div>
            </Truong>
          )}

          <Truong nhan="Nội dung đề nghị" batBuoc moTa="Số hợp đồng + tên công trình, ngắn gọn">
            <Input
              placeholder="Vật tư thi công phần thân đợt 4"
              value={tieuDe}
              onChange={(e) => setTieuDe(e.target.value)}
            />
          </Truong>

          <Truong nhan="Bộ phận đề nghị" batBuoc moTa="Đề nghị đến từ phòng ban nào">
            <div className="flex flex-col gap-1">
              {/* Ver 1 CHỈ nhận đề nghị từ Phòng Thi công (chỉ đạo 05/08/2026) nên khóa
                  cứng, nhưng vẫn để thành một ô riêng đúng như biểu mẫu — mở rộng 5 phòng
                  ban ở ver sau chỉ việc đổi ô này thành danh sách chọn. */}
              <Input value={NHAN_PHONG_BAN["thi-cong"]} readOnly className="bg-muted" />
              <span className="text-xs text-text-desc">
                Ver 1 chỉ nhận đề nghị từ Phòng Thi công — các phòng ban khác mở ở phiên bản sau.
              </span>
            </div>
          </Truong>

          <Truong nhan="Mã dự án gốc" batBuoc moTa="Theo Thông báo 09/2026/TB-HPCS">
            <div className="flex flex-col gap-1">
              <Input
                placeholder="260001-HPCS"
                value={maDuAn}
                onChange={(e) => setMaDuAn(e.target.value)}
              />
              <span className="text-xs text-text-desc">
                Mã đề nghị tự sinh: {maDuAn.trim() || "[mã dự án]"}-PR-00x
              </span>
            </div>
          </Truong>

          <Truong nhan="Tên công trình" batBuoc>
            <Input
              placeholder="Nhà xưởng ABC — Giai đoạn 2"
              value={tenCongTrinh}
              onChange={(e) => setTenCongTrinh(e.target.value)}
            />
          </Truong>

          <Truong nhan="Mã hợp đồng chủ đầu tư">
            <Input
              placeholder="260001-HPCS-HDXD-001"
              value={maHopDongCDT}
              onChange={(e) => setMaHopDongCDT(e.target.value)}
            />
          </Truong>

          <Truong nhan="Người đề nghị" batBuoc>
            <Input value={nguoiDeNghiTen} onChange={(e) => setNguoiDeNghiTen(e.target.value)} />
          </Truong>

          <Truong nhan="Ngày đề nghị" batBuoc moTa="Ngày lập và ngày được duyệt">
            <div className="flex flex-wrap gap-3">
              <Input
                type="date"
                value={ngayDeNghi}
                onChange={(e) => setNgayDeNghi(e.target.value)}
                className="w-44"
                aria-label="Ngày đề nghị"
              />
              <Input
                type="date"
                value={ngayDuyet}
                onChange={(e) => setNgayDuyet(e.target.value)}
                className="w-44"
                aria-label="Ngày duyệt"
              />
            </div>
          </Truong>

          <Truong nhan="Ngày cần hàng" batBuoc moTa="Mốc tính “Quá hạn / Còn N ngày” trên bảng quy trình">
            <div className="flex flex-wrap items-center gap-4">
              <Input
                type="date"
                value={ngayCanHang}
                onChange={(e) => setNgayCanHang(e.target.value)}
                className="w-44"
                aria-label="Ngày cần hàng"
              />
              <label className="flex min-h-11 items-center gap-2">
                <Checkbox
                  checked={gap}
                  onCheckedChange={(c) => setGap(c === true)}
                  aria-label="Đánh dấu đề nghị gấp"
                />
                <span className="text-sm text-text-primary">Đánh dấu Gấp</span>
              </label>
            </div>
          </Truong>
        </CardContent>
      </Card>

      {/* Danh sách mặt hàng */}
      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-h3 text-text-primary">Mặt hàng đề nghị ({dongHopLe.length} dòng hợp lệ)</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDong((t) => [...t, { ...DONG_TRONG }])}
            >
              <Plus className="size-4" aria-hidden />
              Thêm dòng
            </Button>
          </div>

          {/* BẢNG CHI TIẾT — cột đặt đúng thứ tự biểu mẫu công ty:
              # · Tên mặt hàng · Quy cách/chủng loại · Số lượng · ĐVT · Mục đích sử dụng.
              Desktop dùng bảng cho nhập nhanh theo hàng; điện thoại chuyển sang thẻ
              (V1.1: bảng nhiều cột trên mobile phải thành Card List). */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-desc">
                  <th className="w-10 px-2 py-2 font-semibold">#</th>
                  <th className="px-2 py-2 font-semibold">Tên mặt hàng *</th>
                  <th className="px-2 py-2 font-semibold">Quy cách / chủng loại</th>
                  <th className="w-28 px-2 py-2 font-semibold">Số lượng *</th>
                  <th className="w-24 px-2 py-2 font-semibold">ĐVT *</th>
                  <th className="px-2 py-2 font-semibold">Mục đích sử dụng</th>
                  <th className="w-12 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {dong.map((d, i) => (
                  <tr key={i} className="border-b border-divider last:border-b-0">
                    <td className="px-2 py-2 align-top text-text-desc">{i + 1}</td>
                    <td className="px-2 py-2">
                      <Input
                        placeholder="Xi măng PCB40"
                        value={d.tenVatLieu}
                        onChange={(e) => suaDong(i, { tenVatLieu: e.target.value })}
                        aria-label={`Tên mặt hàng dòng ${i + 1}`}
                      />
                      <label className="mt-1.5 flex items-center gap-2">
                        <Checkbox
                          checked={d.vatTuKiemSoatDinhMuc}
                          onCheckedChange={(c) => suaDong(i, { vatTuKiemSoatDinhMuc: c === true })}
                          aria-label={`Vật tư kiểm soát định mức, dòng ${i + 1}`}
                        />
                        <span className="text-xs text-text-desc">
                          Kiểm soát định mức — Ban QLDA nhận cảnh báo
                        </span>
                      </label>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Input
                        placeholder="bao 50kg"
                        value={d.quyCach}
                        onChange={(e) => suaDong(i, { quyCach: e.target.value })}
                        aria-label={`Quy cách dòng ${i + 1}`}
                      />
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={d.khoiLuong}
                        onChange={(e) => suaDong(i, { khoiLuong: e.target.value })}
                        aria-label={`Số lượng dòng ${i + 1}`}
                      />
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Input
                        placeholder="Bao"
                        value={d.donViTinh}
                        onChange={(e) => suaDong(i, { donViTinh: e.target.value })}
                        aria-label={`Đơn vị tính dòng ${i + 1}`}
                      />
                    </td>
                    <td className="px-2 py-2 align-top">
                      <Input
                        placeholder="Đổ bê tông móng"
                        value={d.mucDichSuDung}
                        onChange={(e) => suaDong(i, { mucDichSuDung: e.target.value })}
                        aria-label={`Mục đích sử dụng dòng ${i + 1}`}
                      />
                    </td>
                    <td className="px-2 py-2 align-top">
                      {dong.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDong((t) => t.filter((_, idx) => idx !== i))}
                          aria-label={`Xóa dòng ${i + 1}`}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card List — điện thoại */}
          <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
            {dong.map((d, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-text-primary">Dòng {i + 1}</span>
                  {dong.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDong((t) => t.filter((_, idx) => idx !== i))}
                      aria-label={`Xóa dòng ${i + 1}`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Xóa
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`ten-${i}`}>Tên mặt hàng *</Label>
                  <Input
                    id={`ten-${i}`}
                    placeholder="Xi măng PCB40"
                    value={d.tenVatLieu}
                    onChange={(e) => suaDong(i, { tenVatLieu: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`qc-${i}`}>Quy cách / chủng loại</Label>
                  <Input
                    id={`qc-${i}`}
                    placeholder="bao 50kg"
                    value={d.quyCach}
                    onChange={(e) => suaDong(i, { quyCach: e.target.value })}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label htmlFor={`kl-${i}`}>Số lượng *</Label>
                    <Input
                      id={`kl-${i}`}
                      type="number"
                      min={0}
                      placeholder="0"
                      value={d.khoiLuong}
                      onChange={(e) => suaDong(i, { khoiLuong: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label htmlFor={`dvt-${i}`}>ĐVT *</Label>
                    <Input
                      id={`dvt-${i}`}
                      placeholder="Bao"
                      value={d.donViTinh}
                      onChange={(e) => suaDong(i, { donViTinh: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`md-${i}`}>Mục đích sử dụng</Label>
                  <Input
                    id={`md-${i}`}
                    placeholder="Đổ bê tông móng"
                    value={d.mucDichSuDung}
                    onChange={(e) => suaDong(i, { mucDichSuDung: e.target.value })}
                  />
                </div>
                <label className="flex min-h-11 items-center gap-2">
                  <Checkbox
                    checked={d.vatTuKiemSoatDinhMuc}
                    onCheckedChange={(c) => suaDong(i, { vatTuKiemSoatDinhMuc: c === true })}
                    aria-label={`Vật tư kiểm soát định mức, dòng ${i + 1}`}
                  />
                  <span className="text-sm text-text-primary">
                    Vật tư kiểm soát định mức{" "}
                    <span className="text-xs text-text-desc">— Ban QLDA sẽ nhận cảnh báo</span>
                  </span>
                </label>
              </div>
            ))}
          </div>

        </CardContent>
      </Card>

      {/* NGƯỜI THEO DÕI + TÀI LIỆU — hai mục cuối của biểu mẫu */}
      <Card>
        <CardContent className="flex flex-col">
          <Truong
            nhan="Người theo dõi"
            moTa="Cá nhân có liên quan cần nắm tiến trình đề nghị"
          >
            <div className="flex flex-col gap-2">
              {nguoiTheoDoi.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                  {nguoiTheoDoi.map((n) => (
                    <li
                      key={n.uid}
                      className="inline-flex items-center gap-1 rounded-full bg-muted py-0.5 pr-0.5 pl-2.5 text-sm"
                    >
                      <span className="text-text-primary" title={n.title}>
                        {n.displayName}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setNguoiTheoDoi((t) => t.filter((x) => x.uid !== n.uid))
                        }
                        className="flex size-6 items-center justify-center rounded-full text-text-desc transition-colors hover:bg-danger-bg hover:text-danger"
                        aria-label={`Bỏ ${n.displayName} khỏi danh sách theo dõi`}
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="relative">
                <Input
                  placeholder="Gõ tên, mã nhân viên hoặc phòng ban để thêm..."
                  value={timNguoi}
                  onChange={(e) => setTimNguoi(e.target.value)}
                  aria-label="Tìm người theo dõi"
                />
                {goiYNguoi.length > 0 && (
                  <ul className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg">
                    {goiYNguoi.map((n) => (
                      <li key={n.uid}>
                        <button
                          type="button"
                          onClick={() => {
                            setNguoiTheoDoi((t) => [...t, n]);
                            setTimNguoi("");
                          }}
                          className="flex min-h-11 w-full flex-wrap items-center gap-x-3 px-3 text-left transition-colors hover:bg-muted"
                        >
                          <span className="text-sm font-medium text-text-primary">
                            {n.displayName}
                          </span>
                          <span className="text-xs text-text-desc">{n.title}</span>
                          <span className="ml-auto text-xs text-text-disabled">
                            {n.employeeCode}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <span className="text-xs text-text-desc">
                Người đề nghị tự động được thêm, không cần chọn lại. Có tên ở đây{" "}
                <strong>không mở khóa quyền xem đơn giá</strong>.
              </span>
            </div>
          </Truong>

          <Truong nhan="Tài liệu đính kèm" moTa="Catalogue sản phẩm, bản vẽ, chứng chỉ...">
            {/* Chưa làm được thật vì cần Firebase Storage. Để ô VÔ HIỆU HÓA kèm lời
                giải thích, chứ KHÔNG làm nút bấm được rồi im lặng không lưu gì — như thế
                người dùng tưởng đã đính kèm xong. */}
            <div className="flex flex-col gap-1">
              <Button variant="outline" size="sm" disabled className="w-fit">
                <Paperclip className="size-4" aria-hidden />
                Chọn tệp
              </Button>
              <span className="text-xs text-text-desc">
                Chưa dùng được ở bản chạy thử — cần bật Firebase Storage của project
                <code className="mx-1 text-xs">hpcons-portal</code>.
              </span>
            </div>
          </Truong>
        </CardContent>
      </Card>

      {/* Thanh nút cuối phiếu — giống biểu mẫu: Lưu nháp bên trái, nút chính bên phải */}
      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={luuNhap}>
              <Save className="size-4" aria-hidden />
              Lưu nháp
            </Button>
            <Button disabled={!hopLe} onClick={nhanDeNghi}>
              <Inbox className="size-4" aria-hidden />
              Tạo đề nghị
            </Button>
            <Button variant="ghost" onClick={() => router.push("/de-nghi")}>
              Quay lại bảng
            </Button>
          </div>
          {!hopLe && (
            <span className="text-xs text-text-desc">
              Còn thiếu: mã dự án · tên công trình · nội dung · ngày cần hàng · ít nhất 1 dòng
              có tên, số lượng và ĐVT.
            </span>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/**
 * Một hàng của phiếu: NHÃN BÊN TRÁI, Ô NHẬP BÊN PHẢI — theo biểu mẫu "Tạo đề xuất mới"
 * của công ty. Dưới 768px tự xếp thành một cột để điện thoại nhập được.
 */
function Truong({
  nhan,
  batBuoc,
  moTa,
  children,
}: {
  nhan: string;
  batBuoc?: boolean;
  moTa?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2 border-b border-divider py-3 last:border-b-0 md:grid-cols-[200px_1fr] md:gap-6">
      <div className="flex flex-col gap-0.5 md:pt-2">
        <Label>
          {nhan}
          {/* Dấu * có kèm chữ cho trình đọc màn hình — không chỉ dựa vào ký hiệu. */}
          {batBuoc && (
            <span className="text-danger">
              {" *"}
              <span className="sr-only"> (bắt buộc)</span>
            </span>
          )}
        </Label>
        {moTa && <span className="text-xs text-text-desc">{moTa}</span>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
