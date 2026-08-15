"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Inbox, Paperclip, Plus, Save, Trash2, Wand2, X } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { timNhanSu, type NhanSu } from "@/3-du-lieu/danh-ba-nhan-su";
import { useDanhBa } from "@/4-phan-quyen/dung-danh-ba";
import { coCongThucTuDong, dungTenDeNghi } from "@/2-quy-trinh/dat-ten-de-nghi";
import { LienKetTep } from "@/1-giao-dien/thanh-phan-dung-chung/lien-ket-tep";
import {
  DANH_MUC_PHONG_BAN,
  PHONG_BAN_MAC_DINH,
  maPhongBanTuTen,
  nhanPhongBan,
} from "@/3-du-lieu/danh-muc-phong-ban";
import { NHAN_NHOM_DE_XUAT, type NhomDeXuat, type PhongBanNguon } from "@/3-du-lieu/kieu-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  CO_TOI_DA,
  KIEU_CHO_PHEP,
  catTep,
  xoaTep,
  type MoTaTep,
} from "@/3-du-lieu/kho-tep";

/**
 * LẬP ĐỀ NGHỊ MUA HÀNG — nghiệp vụ THẬT, mọi tài khoản dùng được.
 *
 * 🔴 Chỉ đạo Ban lãnh đạo 12/08/2026: *"chức năng đề nghị này hãy tạo cho TOÀN BỘ các
 * tài khoản hiện có"*, và *"app này chỉ liên quan tới quy trình thu mua, nhận đề xuất mua
 * hàng từ tất cả các phòng ban của công ty"*.
 *
 * 📌 Bố cục chép theo biểu mẫu **"Tạo đề xuất mới" trên Base.vn** (ảnh Ban lãnh đạo cung
 * cấp): hộp có thanh tiêu đề + nút đóng, khối lưu ý xanh, trường nhãn-trái ô-phải, chân
 * hộp hai nút lớn chia đôi. Màu theo token công ty, không lấy xanh lá của Base.
 *
 * ⚠️ App KHÔNG duyệt đề nghị. Việc duyệt chạy ở app của bộ phận đề xuất rồi mới đẩy phiếu
 * sang đây — đừng thêm bước duyệt vào màn này (xem `4-phan-quyen/quyen.ts`).
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
  const { nguoiDung, danhSachTaiKhoan } = useNguoiDung();
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

  const [timNguoi, setTimNguoi] = useState("");

  /**
   * Phòng ban gửi đề xuất — từ 12/08/2026 nhận từ MỌI phòng ban của công ty.
   * Danh mục 16 phòng ban thật ở `3-du-lieu/danh-muc-phong-ban.ts`.
   *
   * 🔴 MẶC ĐỊNH THEO PHÒNG BAN CỦA NGƯỜI ĐANG ĐĂNG NHẬP, không để cứng Thi công. Ai cũng
   * lập đề nghị cho chính phòng mình, nên để cứng một phòng nghĩa là 15/16 số người phải
   * nhớ đổi ô này mỗi lần lập phiếu — quên một lần là phiếu mang tên phòng ban khác, và
   * không có gì báo sai cả.
   */
  const [boPhan, setBoPhan] = useState<PhongBanNguon>(
    () => maPhongBanTuTen(nguoiDung.phongBan) ?? PHONG_BAN_MAC_DINH,
  );

  /**
   * Nhóm đề xuất — Vật tư · Dịch vụ · MM-CCDC · Khác (trường của thẻ Base).
   *
   * 📌 Mặc định "Vật tư" vì phần lớn phiếu của quy trình mua hàng là xin vật tư — nhìn ảnh
   * bảng Base thật thì đa số thẻ ghi "Nhóm đề xuất: Vật tư". Đặt mặc định đúng với việc hay
   * gặp nhất để người lập ít phải đổi, nhưng vẫn là ô bắt buộc nhìn thấy được.
   */
  const [nhomDeXuat, setNhomDeXuat] = useState<NhomDeXuat>("vat_tu");

  /**
   * Dự án đang chọn ở ô "Dự án / Công trình" — "" = chưa chọn, "__moi__" = nhập tay.
   * Base đặt một Ô CHỌN ở vị trí này; app dùng nó để điền mã dự án + tên công trình + mã
   * hợp đồng một phát, thay cho cụm nhập tay từng chen giữa phiếu.
   */
  const [duAnChon, setDuAnChon] = useState("");

  /** Tài liệu đính kèm lúc lập phiếu — tối đa 10 theo biểu mẫu Base. */
  const [taiLieu, setTaiLieu] = useState<MoTaTep[]>([]);
  const [dangTaiTep, setDangTaiTep] = useState(false);

  async function themTaiLieu(files: FileList | null) {
    if (!files || files.length === 0) return;
    const conCho = 10 - taiLieu.length;
    const chon = Array.from(files).slice(0, conCho);
    if (chon.length < files.length) {
      toast.error("Tối đa 10 tài liệu", {
        description: `Chỉ nhận thêm được ${conCho} tệp nữa.`,
      });
    }
    setDangTaiTep(true);
    try {
      for (const f of chon) {
        // `catTep` tự đẩy nội dung lên máy chủ; đẩy hỏng là NÉM LỖI chứ không im lặng.
        const mt = await catTep(f, { uid: nguoiDung.uid, ten: nguoiDung.tenHienThi });
        setTaiLieu((t) => [...t, mt]);
      }
    } catch (e) {
      toast.error("Không đính kèm được", {
        description: e instanceof Error ? e.message : "Trình duyệt không cho lưu tệp.",
      });
    } finally {
      setDangTaiTep(false);
    }
  }

  function boTaiLieu(id: string) {
    setTaiLieu((t) => t.filter((x) => x.id !== id));
    // Dọn cả nội dung đã đẩy lên — không dọn thì mảnh tệp nằm lại vĩnh viễn trên máy chủ.
    void xoaTep(id);
  }

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
    // Phòng ban có công thức đặt tên thì tên do app dựng, không đòi người lập gõ.
    (coCongThucTuDong(boPhan) || tieuDe.trim() !== "") &&
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
    setDuAnChon(mau ? mau.maDuAn : "__moi__");
    setMaHopDongCDT(mau?.maHopDongCDT ?? "");
    // Phòng có công thức thì tên do app dựng — điền vào đây chỉ tạo cảm giác sai là gõ được.
    setTieuDe(
      coCongThucTuDong(boPhan)
        ? ""
        : "Vật tư thử nghiệm — tạo lúc " + new Date().toLocaleTimeString("vi-VN"),
    );
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
      // Ô chọn dự án phải khớp dữ liệu nháp — mã có trong danh sách thì chọn, lạ thì "nhập tay".
      setDuAnChon(
        n.maDuAn ? (duAnDaCo.some((x) => x.maDuAn === n.maDuAn) ? n.maDuAn : "__moi__") : "",
      );
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
      phongBanNguon: boPhan,
      nhomDeXuat,
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
      /**
       * Người theo dõi = [Người giám sát (tài khoản mặc định — ghi rõ trong khối lưu ý,
       * đúng như Base)] + người được chọn tay. Lọc trùng để chọn tay Người giám sát không
       * thành hai dòng.
       */
      nguoiTheoDoi: [
        ...danhSachTaiKhoan
          .filter((n) => n.uid === "u-giamsat")
          .map((n) => ({ uid: n.uid, ten: n.tenHienThi, chucDanh: n.chucDanh })),
        ...nguoiTheoDoi
          .filter((n) => n.uid !== "u-giamsat")
          .map((n) => ({ uid: n.uid, ten: n.displayName, chucDanh: n.title })),
      ],
      taiLieu: taiLieu.length > 0 ? taiLieu : undefined,
    });

    if (!id) {
      toast.error("Đã hết chỗ cho đề nghị thử", {
        description: "Bản chạy thử chỉ nhận được 12 đề nghị giả lập. Tải lại trang để về dữ liệu gốc.",
      });
      return;
    }

    toast.success(`Đã nhận đề nghị từ ${nhanPhongBan(boPhan)}`, {
      description: "Thẻ mới nằm ở cột đầu tiên — Tiếp nhận và kiểm tra.",
    });
    router.push("/de-nghi");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      {/* Hai nút tiện dụng đặt NGOÀI hộp phiếu — hộp giữ nguyên dáng biểu mẫu Base.
          ⚠️ Đã bỏ tấm "công cụ chạy thử / app không tạo được đề nghị": từ 12/08/2026 lập
          đề nghị là NGHIỆP VỤ THẬT, mọi tài khoản lập được — giữ tấm cũ là nói sai về
          chính chức năng đang chạy. */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={taiNhap}>
          Mở bản nháp
        </Button>
        <Button variant="outline" size="sm" onClick={dienNhanh}>
          <Wand2 className="size-4" aria-hidden />
          Điền nhanh mẫu
        </Button>
      </div>

      {/* ===== HỘP PHIẾU — đúng dáng hộp "Tạo đề xuất mới" của Base: thanh tiêu đề IN
          HOA + nút đóng, khối lưu ý xanh, các trường nhãn-trái ô-phải, chân hộp hai nút
          lớn chia đôi. Màu theo token công ty, không lấy xanh lá Base (12/08/2026). ===== */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-3">
          <h1 className="text-sm font-bold tracking-wide text-text-primary uppercase">
            Tạo đề nghị mới
          </h1>
          <button
            type="button"
            onClick={() => router.push("/de-nghi")}
            aria-label="Đóng, quay lại bảng quy trình"
            className="flex size-8 items-center justify-center rounded-md text-text-desc transition-colors hover:bg-muted hover:text-text-primary"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <CardContent className="flex flex-col">
          {/* Khối lưu ý xanh — nội dung chép theo khối đầu hộp của Base */}
          <div className="mb-2 flex flex-col gap-1.5 rounded-lg border border-success/30 bg-success-bg p-3 text-xs text-text-secondary">
          {/* 📌 Đã BỎ dòng "Xem quy định tiếp nhận đề nghị: office.base.vn/doc/25684"
              (Ban lãnh đạo 15/08/2026). Đó là đường dẫn sang tài liệu bên Base — app này
              là hệ thống riêng, chỉ sang chỗ khác ngay ở màn lập phiếu là dẫn người dùng
              rời app giữa chừng. Nội dung quy định cần thì đưa vào hướng dẫn từng bước
              (nút ⓘ), không phải một liên kết ra ngoài. */}
          <p>
            - Thời gian đề nghị: <strong>ít nhất 2 ngày</strong> trước ngày cần hàng.
          </p>
          <p className="pt-1 text-sm font-semibold text-success-soft">Các lưu ý:</p>
          <p>
            <strong>1. Tên đề nghị:</strong> “Số hợp đồng + tên công trình (ngắn gọn)” Hoặc
            “Tên phòng ban đề nghị”.
          </p>
          {/* 🔴 12/08/2026 (chiều): viết lại mục 2 cho ĐÚNG việc app làm. Bản trước ghi
              "Luồng duyệt (duyệt lần lượt): TP/QL → TGĐ" — nay app KHÔNG duyệt nữa, để
              nguyên câu đó là hứa một việc app không làm (quy tắc dự án mục 3.5). Vẫn nêu
              luồng duyệt của công ty, nhưng nói rõ nó chạy ở đâu. */}
          <p>
            <strong>2. Duyệt đề nghị:</strong> thực hiện trên{" "}
            <strong>app của bộ phận đề xuất</strong> (Trưởng phòng/Quản lý → Tổng Giám đốc
            hoặc Các Phó Tổng Giám đốc). App Thu mua chỉ tiếp nhận phiếu{" "}
            <strong>đã duyệt</strong> để đi hỏi giá và đặt hàng.
          </p>
          <p>
            <strong>3. Người theo dõi:</strong>
            <br />
            &nbsp;&nbsp;- Các cá nhân có liên quan cần nắm tiến trình.
            <br />
            &nbsp;&nbsp;- Tài khoản mặc định: Người giám sát.
            <br />
            &nbsp;&nbsp;- Có tên trong danh sách <strong>không mở khóa quyền xem đơn giá</strong>.
          </p>
          <p>
            <strong>4. Tài liệu:</strong> có thể đính kèm catalogue của sản phẩm hoặc dịch vụ.
          </p>
          </div>
          {/* ★ TÊN ĐỀ NGHỊ TỰ ĐẶT THEO CÔNG THỨC — Ban lãnh đạo 13/08/2026 gửi ảnh Base:
              `mã đề xuất - tên hợp đồng, TÊN CÔNG TRÌNH`, áp cho Phòng Thi công.

              🔴 Ô thành CHỈ ĐỌC, không cho gõ tay: công thức có tác dụng chỉ khi mọi phiếu
              đặt tên giống nhau. Cho sửa thì người lập gõ tên riêng và danh sách lại lộn xộn
              y như trước — đúng thứ công thức sinh ra để dẹp.

              📌 Mã đề nghị chỉ có SAU khi lưu (phải biết phiếu thứ mấy của dự án), nên ở đây
              hiện chữ giữ chỗ. Tên thật do kho dữ liệu dựng — cùng một hàm `dungTenDeNghi`,
              không có chỗ thứ hai nào tự ghép chuỗi. */}
          {coCongThucTuDong(boPhan) ? (
            <Truong
              nhan="Tên đề nghị"
              moTa="Tự đặt theo công thức của quy trình mua hàng"
            >
              <div className="flex flex-col gap-1">
                <Input
                  value={dungTenDeNghi({
                    maDeNghi: "[mã sinh khi lưu]",
                    maHopDongCDT,
                    tenCongTrinh: tenCongTrinh || "[tên công trình]",
                  })}
                  readOnly
                  className="bg-muted"
                  aria-label="Tên đề nghị tự đặt theo công thức"
                />
                <span className="text-xs text-text-desc">
                  Công thức: <strong>mã đề xuất − tên hợp đồng, TÊN CÔNG TRÌNH</strong>. Điền mã
                  hợp đồng và tên công trình ở cụm bên dưới là tên tự đủ.
                </span>
              </div>
            </Truong>
          ) : (
            <Truong nhan="Tên đề nghị" batBuoc moTa="Số hợp đồng + tên công trình, ngắn gọn">
              <Input
                placeholder="Vật tư thi công phần thân đợt 4"
                value={tieuDe}
                onChange={(e) => setTieuDe(e.target.value)}
              />
            </Truong>
          )}

          {/* Ô CHỈ ĐỌC theo đúng Base ("Nhóm đề xuất: 01.0. Phiếu đề nghị") — cho người
              quen Base thấy đúng phiếu mình vẫn lập, dù giá trị hiện chỉ có một. */}
          <Truong nhan="Nhóm đề nghị" batBuoc moTa="Nhóm phiếu theo danh mục Base">
            <Input value="01.0. Phiếu đề nghị" disabled readOnly className="bg-muted" />
          </Truong>

          <Truong nhan="Bộ phận" batBuoc moTa="Bạn thuộc phòng ban hay bộ phận nào?">
            {/* 🔴 12/08/2026: mở nhận đề xuất từ MỌI phòng ban (trước chỉ Phòng Thi công).
                Ban lãnh đạo: *"app này chỉ liên quan tới quy trình thu mua, nhận đề xuất
                mua hàng từ tất cả các phòng ban của công ty"*. */}
            <select
              aria-label="Bộ phận đề nghị"
              value={boPhan}
              onChange={(e) => setBoPhan(e.target.value)}
              className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none"
            >
              {DANH_MUC_PHONG_BAN.map((pb) => (
                <option key={pb.ma} value={pb.ma}>
                  {pb.ten}
                </option>
              ))}
            </select>
          </Truong>

          {/* ★ NHÓM ĐỀ XUẤT — Ban lãnh đạo 14/08/2026 gửi ảnh bảng Base thật, trường này nằm
              ngay sau "Bộ phận" trên thẻ. Phân loại đề nghị: cùng một bộ phận có phiếu xin
              vật tư, có phiếu thuê dịch vụ, có phiếu mua máy — ba việc khác hẳn nhau về cách
              hỏi giá và bộ chứng từ. */}
          <Truong nhan="Nhóm đề xuất" batBuoc moTa="Phiếu này xin vật tư, thuê dịch vụ hay mua máy móc – công cụ?">
            <select
              aria-label="Nhóm đề xuất"
              value={nhomDeXuat}
              onChange={(e) => setNhomDeXuat(e.target.value as NhomDeXuat)}
              className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none"
            >
              {(Object.keys(NHAN_NHOM_DE_XUAT) as NhomDeXuat[]).map((ma) => (
                <option key={ma} value={ma}>
                  {NHAN_NHOM_DE_XUAT[ma]}
                </option>
              ))}
            </select>
          </Truong>

          {/* ★ Ô CHỌN DỰ ÁN — thay cho cụm "Thông tin công trình" từng chen giữa phiếu
              (Ban lãnh đạo chê 12/08/2026: *"e đang làm thành mẫu gì vậy"*). Chọn một dự
              án là tự điền mã dự án + tên công trình + mã hợp đồng; chỉ khi "nhập tay"
              mới mở ba ô chi tiết. Phiếu nhờ vậy đọc liền mạch đúng như hộp Base. */}
          <Truong nhan="Dự án / Công trình" batBuoc moTa="Mã hồ sơ sinh theo Thông báo 09/2026/TB-HPCS">
            <div className="flex flex-col gap-1">
              <select
                aria-label="Chọn dự án"
                value={duAnChon}
                onChange={(e) => {
                  const v = e.target.value;
                  setDuAnChon(v);
                  const d = duAnDaCo.find((x) => x.maDuAn === v);
                  if (d) chonDuAn(d);
                }}
                className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none"
              >
                <option value="">-- Vui lòng chọn --</option>
                {duAnDaCo.map((d) => (
                  <option key={d.maDuAn} value={d.maDuAn}>
                    {d.maDuAn} — {d.tenCongTrinh}
                  </option>
                ))}
                <option value="__moi__">Dự án khác — nhập tay…</option>
              </select>
              <span className="text-xs text-text-desc">
                Mã đề nghị tự sinh: {maDuAn.trim() || "[mã dự án]"}-PR-00x
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


          {duAnChon === "__moi__" && (
            <>
          <Truong nhan="Mã dự án gốc" batBuoc moTa="Theo Thông báo 09/2026/TB-HPCS">
            <Input
              placeholder="260001-HPCS"
              value={maDuAn}
              onChange={(e) => setMaDuAn(e.target.value)}
            />
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
            </>
          )}

          {/* ⚠️ Base KHÔNG có ô "Người đề nghị" và "Ngày đề nghị" — người lập chính là
              người đang đăng nhập, ngày lập là hôm nay. App vẫn ghi đủ hai giá trị đó vào
              hồ sơ (mặc định trong state), chỉ là không bắt người dùng nhập lại thứ máy
              đã biết. */}


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
          {/* ===== 📌 12/08/2026 (chiều): BỎ ô "Quản lý trực tiếp / người duyệt". Ban lãnh đạo
              chốt: việc duyệt đề nghị nằm ở APP KHÁC của bộ phận đề xuất — app Thu mua chỉ
              NHẬN phiếu đã duyệt. Khối lưu ý xanh phía trên vẫn ghi luồng duyệt của công ty
              để người lập biết phiếu mình sẽ đi qua đâu trước khi vào đây. */}

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
            {/* ★ MỞ THẬT từ 12/08/2026: nội dung tệp lưu lên Firestore (`kho-tep.ts`) nên
                máy khác mở xem được — trước đó ô này bị khóa để không hứa thứ app chưa làm. */}
            <div className="flex flex-col gap-2">
              {taiLieu.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {taiLieu.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5"
                    >
                      {/* Xem + tải về, luật ở `LienKetTep` — một chỗ duy nhất cho mọi
                          chỗ hiện chứng từ đính kèm (Ban lãnh đạo 13/08/2026). */}
                      <LienKetTep tep={t} />
                      <button
                        type="button"
                        onClick={() => boTaiLieu(t.id)}
                        aria-label={`Bỏ tệp ${t.tenTep}`}
                        className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-md text-text-desc transition-colors hover:bg-muted hover:text-danger"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {taiLieu.length < 10 && (
                <label
                  className={`inline-flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:border-primary hover:bg-muted ${
                    dangTaiTep ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept={KIEU_CHO_PHEP}
                    className="sr-only"
                    disabled={dangTaiTep}
                    onChange={(e) => {
                      const fs = e.target.files;
                      e.target.value = "";
                      void themTaiLieu(fs);
                    }}
                  />
                  <Paperclip className="size-4" aria-hidden />
                  {dangTaiTep ? "Đang lưu tệp…" : "Chọn tệp"}
                </label>
              )}
              <span className="text-xs text-text-desc">
                Nhận PDF, ảnh, Word, Excel · tối đa {CO_TOI_DA / 1024 / 1024}MB mỗi tệp. Tệp lưu
                lên máy chủ nên người duyệt và Thu mua mở xem được.
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
          {!hopLe && (
            <span className="text-xs text-text-desc">
              Còn thiếu: dự án/công trình{coCongThucTuDong(boPhan) ? "" : " · tên đề nghị"} ·
              ngày đề nghị cấp · ít nhất 1 dòng có tên, số lượng và ĐVT.
            </span>
          )}
          </div>
        </CardContent>
      </Card>
    </div>
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

