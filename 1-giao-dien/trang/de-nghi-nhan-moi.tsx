"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  timNhanSu,
  type NhanSu,
} from "@/3-du-lieu/danh-ba-nhan-su";
import { useDanhBa } from "@/4-phan-quyen/dung-danh-ba";
import { nguoiDuyetDuocChon } from "@/2-quy-trinh/duyet-bo-phan";
import type { NguoiDuyetChiDinh } from "@/3-du-lieu/kieu-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";

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
  const { nguoiDung, quyen, danhSachTaiKhoan } = useNguoiDung();
  /** 🔴 Danh bạ đọc từ TÀI KHOẢN THẬT, không phải mảng mẫu — xem `dung-danh-ba.ts`. */
  const danhBa = useDanhBa();

  const [maDuAn, setMaDuAn] = useState("");
  const [tenCongTrinh, setTenCongTrinh] = useState("");
  const [maHopDongCDT, setMaHopDongCDT] = useState("");
  const [tieuDe, setTieuDe] = useState("");
  const [nguoiDeNghiTen, setNguoiDeNghiTen] = useState(nguoiDung.tenHienThi);
  const [ngayDeNghi, setNgayDeNghi] = useState(homNay);
  const [ngayDuyet, setNgayDuyet] = useState(homNay);
  const [ngayCanHang, setNgayCanHang] = useState("");
  const [gap, setGap] = useState(false);
  const [dong, setDong] = useState<DongNhap[]>([{ ...DONG_TRONG }]);
  const [nguoiTheoDoi, setNguoiTheoDoi] = useState<NhanSu[]>([]);

  /**
   * ★ NGƯỜI DUYỆT HAI CẤP — Ban lãnh đạo 12/08/2026: *"chưa có mục thêm người duyệt"*.
   *
   * Giữ MÃ người, không giữ cả bản ghi: danh sách tài khoản đọc bất đồng bộ từ máy chủ nên
   * có thể về sau khi biểu mẫu đã dựng. Giữ mã thì lúc nào tra lại cũng ra đúng người.
   */
  const [uidDuyet1, setUidDuyet1] = useState("");
  const [uidDuyet2, setUidDuyet2] = useState("");

  /** Ai được chọn cho từng cấp — lọc theo CHỨC VỤ, xem `2-quy-trinh/duyet-bo-phan.ts`. */
  const chonDuoc1 = useMemo(() => nguoiDuyetDuocChon(danhSachTaiKhoan, 1), [danhSachTaiKhoan]);
  const chonDuoc2 = useMemo(() => nguoiDuyetDuocChon(danhSachTaiKhoan, 2), [danhSachTaiKhoan]);

  /**
   * Chỉ có ĐÚNG MỘT người ở cấp đó thì chọn sẵn luôn.
   *
   * 🔴 Không phải để tiện tay: bỏ trống là phiếu không có người duyệt, mà luật lại quay về
   * xét theo chức vụ — người lập tưởng đã chỉ định xong trong khi thực tế chưa. Chọn sẵn khi
   * không có gì để chọn là cách bỏ hẳn tình huống mơ hồ đó.
   */
  useEffect(() => {
    if (!uidDuyet1 && chonDuoc1.length === 1) setUidDuyet1(chonDuoc1[0].uid);
    if (!uidDuyet2 && chonDuoc2.length === 1) setUidDuyet2(chonDuoc2[0].uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chonDuoc1, chonDuoc2]);
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
    setNguoiDeNghiTen(nguoiDung.tenHienThi);
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
    const conLai = danhBa.filter(
      (n) => !nguoiTheoDoi.some((x) => x.uid === n.uid),
    );
    return timNhanSu(conLai, timNguoi).slice(0, 6);
    // `danhBa` đọc bất đồng bộ từ máy chủ nên PHẢI có trong deps — thiếu là gợi ý vẫn hiện
    // danh bạ mẫu cho tới lần gõ tiếp theo.
  }, [danhBa, timNguoi, nguoiTheoDoi]);

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
      setNguoiDeNghiTen(n.nguoiDeNghiTen ?? nguoiDung.tenHienThi);
      setNgayDeNghi(n.ngayDeNghi ?? homNay());
      setNgayDuyet(n.ngayDuyet ?? homNay());
      setNgayCanHang(n.ngayCanHang ?? "");
      setGap(Boolean(n.gap));
      setDong(Array.isArray(n.dong) && n.dong.length > 0 ? n.dong : [{ ...DONG_TRONG }]);
      const ds = danhBa;
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
      nguoiDeNghiTen: nguoiDeNghiTen.trim() || nguoiDung.tenHienThi,
      // 🔴 Mã và chức danh lấy từ NGƯỜI ĐANG ĐĂNG NHẬP, không theo ô nhập tên: ô đó cho sửa
      // tên hiển thị, nhưng danh tính trong hồ sơ phải là người thật đang bấm nút.
      nguoiDeNghiUid: nguoiDung.uid,
      nguoiDeNghiChucDanh: nguoiDung.chucDanh,
      /**
       * Số cấp duyệt ghi sẵn theo CHỨC VỤ người lập — xem `2-quy-trinh/duyet-bo-phan.ts`.
       * Trưởng phòng lập → duyệt sẵn cả 2 · Chỉ huy trưởng → sẵn cấp 1 · còn lại → 0.
       * ⚠️ Xét theo `quyen`, không xét chuỗi chức danh: chức danh là chữ người ta gõ, đổi
       * một chữ là luật sai mà không báo gì.
       */
      capDuyetSan: quyen.duyetCap2 ? 2 : quyen.duyetCap1 ? 1 : 0,
      nguoiDuyetCap1: chiDinhTu(danhSachTaiKhoan, uidDuyet1),
      nguoiDuyetCap2: chiDinhTu(danhSachTaiKhoan, uidDuyet2),
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
        title="Tạo đề nghị mới"
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

      {/* KHỐI LƯU Ý — chép đúng khối xanh đầu biểu mẫu "Tạo đề xuất mới" trên Base.vn
          (Ban lãnh đạo chốt 12/08/2026: *"giữ bố cục base và màu công ty"*). Nội dung lấy
          theo Base, chỉ điều chỉnh cho khớp app: luồng duyệt TP/QL → TGĐ, mã hồ sơ theo
          Thông báo 09/2026.
          🎨 Nền dùng token `success-bg` của công ty thay cho xanh lá Base — cùng sắc ý
          "khối hướng dẫn", nhưng là màu trong Design System V1.1, không hardcode. */}
      <Card className="border-success/30 bg-success-bg">
        <CardContent className="flex flex-col gap-1.5 text-xs text-text-secondary">
          <p>
            - Thời gian đề nghị: <strong>ít nhất 2 ngày</strong> trước ngày cần hàng.
          </p>
          <p className="pt-1 text-sm font-semibold text-success-soft">Các lưu ý:</p>
          <p>
            <strong>1. Tên đề nghị:</strong> “Số hợp đồng + tên công trình (ngắn gọn)” Hoặc
            “Tên phòng ban đề nghị”.
          </p>
          <p>
            <strong>2. Luồng duyệt (duyệt lần lượt):</strong> Trưởng phòng/Quản lý →{" "}
            <strong>Tổng Giám đốc hoặc Các Phó Tổng Giám đốc</strong>.
          </p>
          <p>
            <strong>3. Người theo dõi:</strong>
            <br />
            &nbsp;&nbsp;- Các cá nhân có liên quan cần nắm tiến trình.
            <br />
            &nbsp;&nbsp;- Có tên trong danh sách <strong>không mở khóa quyền xem đơn giá</strong>.
          </p>
          <p>
            <strong>4. Tài liệu:</strong> có thể đính kèm catalogue của sản phẩm hoặc dịch vụ.
          </p>
          <p className="text-text-desc">
            Mã đề nghị do hệ thống tự sinh theo Thông báo 09/2026/TB-HPCS — người lập không tự
            đặt.
          </p>
        </CardContent>
      </Card>

      {/* PHIẾU ĐỀ NGHỊ — bố cục NHÃN BÊN TRÁI, Ô NHẬP BÊN PHẢI theo đúng biểu mẫu
          "Tạo đề xuất mới" đang dùng trên Base.vn (chỉ đạo Ban lãnh đạo 08/08/2026).
          Dưới 768px tự xếp thành một cột để điện thoại vẫn nhập được. */}
      <Card>
        <CardContent className="flex flex-col">
          <Truong nhan="Tên đề nghị" batBuoc moTa="Số hợp đồng + tên công trình, ngắn gọn">
            <Input
              placeholder="Vật tư thi công phần thân đợt 4"
              value={tieuDe}
              onChange={(e) => setTieuDe(e.target.value)}
            />
          </Truong>

          {/* Ô CHỈ ĐỌC theo đúng Base ("Nhóm đề xuất: 01.0. Phiếu đề nghị") — cho người
              quen Base thấy đúng phiếu mình vẫn lập, dù giá trị hiện chỉ có một. */}
          <Truong nhan="Nhóm đề nghị" batBuoc moTa="Nhóm phiếu theo danh mục Base">
            <Input value="01.0. Phiếu đề nghị" disabled readOnly className="bg-muted" />
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

          {/* Base gọi ô này là "Ngày đề nghị cấp" — chính là ngày cần hàng về của app.
              Đặt NGAY SAU Bộ phận cho đúng thứ tự trường trên Base. */}
          <Truong nhan="Ngày đề nghị cấp" batBuoc moTa="Ngày cần hàng về — mốc tính “Quá hạn / Còn N ngày”">
            <div className="flex flex-wrap items-center gap-4">
              <Input
                type="date"
                value={ngayCanHang}
                onChange={(e) => setNgayCanHang(e.target.value)}
                className="w-44"
                aria-label="Ngày đề nghị cấp (ngày cần hàng)"
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

          {/* ===== THÔNG TIN CÔNG TRÌNH — phần RIÊNG của HP CONS, Base không có =====
              Không bỏ được: mã hồ sơ sinh theo Thông báo 09/2026 cần mã dự án. Gom lại một
              cụm có tiêu đề nhỏ để phần "giống Base" ở trên không bị chen ngang. */}
          <p className="mt-3 border-t border-divider pt-3 text-xs font-semibold tracking-wide text-text-desc uppercase">
            Thông tin công trình (theo Thông báo 09/2026/TB-HPCS)
          </p>


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


          {/* ===== CHI TIẾT — nối liền trong CÙNG tấm phiếu, như hộp "Tạo đề xuất mới"
              của Base (một tờ trắng duy nhất, không tách thẻ rời). ===== */}
          <div className="mt-4 flex flex-col gap-(--hp-md-card-gap) border-t border-divider pt-4">
          {/* Base gọi phần này là "Chi tiết *". Nút thêm dòng chuyển XUỐNG DƯỚI bảng theo
              đúng vị trí "⊕ Thêm dòng mới" của Base. */}
          <h2 className="text-h3 text-text-primary">
            Chi tiết <span className="text-danger">*</span>{" "}
            <span className="text-sm font-normal text-text-desc">
              ({dongHopLe.length} dòng hợp lệ)
            </span>
          </h2>

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

          {/* "⊕ Thêm dòng mới" dưới bảng — đúng chỗ của Base. Kiểu liên kết, không phải nút
              viền: hành động phụ đứng cạnh bảng dữ liệu thì làm nhẹ để bảng vẫn là vai chính. */}
          <button
            type="button"
            onClick={() => setDong((t) => [...t, { ...DONG_TRONG }])}
            className="flex min-h-11 w-fit items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:underline"
          >
            <Plus className="size-4" aria-hidden />
            Thêm dòng mới
          </button>
          </div>

          {/* ===== QUẢN LÝ TRỰC TIẾP · NGƯỜI THEO DÕI · TÀI LIỆU — cùng tấm phiếu ===== */}
          <div className="mt-2 flex flex-col border-t border-divider pt-2">
          {/* ===== NGƯỜI DUYỆT — Ban lãnh đạo 12/08/2026 =====
              Đặt TRƯỚC "Người theo dõi" là cố ý: người duyệt là mắt xích BẮT BUỘC của quy
              trình, còn người theo dõi chỉ để nắm thông tin. Thứ quan trọng hơn đứng trước. */}
          <Truong
            nhan="Quản lý trực tiếp"
            batBuoc
            moTa="Bạn phải thông báo cho quản lý trực tiếp về đề nghị này — duyệt lần lượt hai cấp trước khi sang Phòng Thu mua"
          >
            <div className="flex flex-col gap-3">
              <OChonNguoiDuyet
                cap={1}
                nhan="Cấp 1 — Trưởng phòng / Quản lý"
                danhSach={chonDuoc1}
                giaTri={uidDuyet1}
                onDoi={setUidDuyet1}
              />
              <OChonNguoiDuyet
                cap={2}
                nhan="Cấp 2 — Tổng Giám đốc / Phó TGĐ"
                danhSach={chonDuoc2}
                giaTri={uidDuyet2}
                onDoi={setUidDuyet2}
              />
              <p className="text-xs text-text-desc">
                Để trống thì app xét theo chức vụ: ai là Chỉ huy trưởng / Trưởng phòng đều duyệt
                được. Chỉ định đích danh khi công ty có nhiều công trình để phiếu không hiện sang
                người phụ trách công trình khác.
              </p>
            </div>
          </Truong>

          <Truong
            nhan="Người theo dõi"
            moTa="Thành viên có thể nhìn thấy đề nghị này"
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

          <Truong nhan="Tài liệu đính kèm (nếu có)" moTa="Đính kèm tối đa 10 tài liệu — catalogue, bản vẽ, chứng chỉ">
            {/* Chưa làm được thật vì cần Firebase Storage. Để ô VÔ HIỆU HÓA kèm lời
                giải thích, chứ KHÔNG làm nút bấm được rồi im lặng không lưu gì — như thế
                người dùng tưởng đã đính kèm xong. */}
            <div className="flex flex-col gap-1">
              <Button variant="outline" size="sm" disabled className="w-fit">
                <Paperclip className="size-4" aria-hidden />
                Chọn tệp
              </Button>
              <span className="text-xs text-text-desc">
                Sẽ mở ở bản sau — phiếu đề nghị chưa có chỗ lưu tài liệu trong hồ sơ. Báo giá và
                phiếu giao nhận thì đã đính kèm được ở đúng bước của chúng.
              </span>
            </div>
          </Truong>
          </div>

          {/* ===== CHÂN PHIẾU — hai nút lớn chia đôi, đúng dáng chân hộp Base
              ("Lưu nháp" trái · "Tạo đề xuất mới" phải). Màu theo token công ty, không lấy
              xanh lá của Base — chỉ đạo 12/08/2026: "giữ bố cục base và màu công ty". */}
          <div className="mt-4 flex flex-col gap-3 border-t border-divider pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="min-h-11 w-full" onClick={luuNhap}>
              <Save className="size-4" aria-hidden />
              Lưu nháp
            </Button>
            <Button className="min-h-11 w-full" disabled={!hopLe} onClick={nhanDeNghi}>
              <Inbox className="size-4" aria-hidden />
              Tạo đề nghị mới
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => router.push("/de-nghi")}
          >
            Quay lại bảng
          </Button>
          {!hopLe && (
            <span className="text-xs text-text-desc">
              Còn thiếu: mã dự án · tên công trình · tên đề nghị · ngày đề nghị cấp · ít nhất 1
              dòng có tên, số lượng và ĐVT.
            </span>
          )}
          </div>
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

/**
 * Ô CHỌN NGƯỜI DUYỆT một cấp.
 *
 * ⚠️ Dùng `<select>` thuần của trình duyệt, KHÔNG dùng component Select của thư viện.
 * Lý do: danh sách chỉ 1–3 người, không cần tìm kiếm; còn `<select>` thuần thì trên điện
 * thoại mở ra bộ chọn sẵn của hệ điều hành — ngón tay to bấm dễ hơn hẳn danh sách tự vẽ.
 * Vẫn dùng token màu của Design System, không hardcode.
 */
function OChonNguoiDuyet({
  cap,
  nhan,
  danhSach,
  giaTri,
  onDoi,
}: {
  cap: 1 | 2;
  nhan: string;
  danhSach: { uid: string; tenHienThi: string; chucDanh: string }[];
  giaTri: string;
  onDoi: (uid: string) => void;
}) {
  const id = `nguoi-duyet-cap-${cap}`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{nhan}</Label>
      {danhSach.length === 0 ? (
        // 🔴 Nói rõ vì sao trống. Một ô chọn rỗng không giải thích thì người lập ngồi đoán.
        <p className="text-xs text-warning-soft">
          Chưa có tài khoản nào giữ chức vụ này. App sẽ xét theo chức vụ khi có người được cấp.
        </p>
      ) : (
        <select
          id={id}
          value={giaTri}
          onChange={(e) => onDoi(e.target.value)}
          className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none"
        >
          <option value="">— Không chỉ định, xét theo chức vụ —</option>
          {danhSach.map((n) => (
            <option key={n.uid} value={n.uid}>
              {n.tenHienThi} · {n.chucDanh}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

/**
 * Dựng bản ghi "người được chỉ định" từ mã đã chọn.
 * Trả `undefined` khi không chọn — Firestore không nhận `undefined` nên kho dữ liệu đã lọc
 * sạch qua JSON, ở đây cứ trả `undefined` cho đúng nghĩa "không chỉ định".
 */
function chiDinhTu(
  danhSach: { uid: string; tenHienThi: string; chucDanh: string }[],
  uid: string,
): NguoiDuyetChiDinh | undefined {
  if (!uid) return undefined;
  const n = danhSach.find((x) => x.uid === uid);
  return n ? { uid: n.uid, ten: n.tenHienThi, chucDanh: n.chucDanh } : undefined;
}
