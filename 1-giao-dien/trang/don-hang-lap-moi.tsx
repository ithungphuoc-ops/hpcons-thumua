"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileWarning,
  Printer,
  Save,
  Split,
} from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { ODinhKemNhieuTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-nhieu-tep";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { Skeleton } from "@/1-giao-dien/nen-tang-ui/skeleton";
import {
  BangHangTien,
  type ConLaiDeNghi,
  type DongNhapDonHang,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-hang-tien";
import {
  HopXemTruocNhapExcel,
  type DuLieuXemTruocExcel,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-xem-truoc-nhap-excel";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import type { MoTaTep } from "@/3-du-lieu/kho-tep";
import type { DongPO, KieuChietKhau, TienDoDongDeNghi } from "@/3-du-lieu/kieu-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  moTaThueSuat,
  tinhTienChiTiet,
  tinhTienDoDeNghi,
  type DongDeTinhTien,
} from "@/2-quy-trinh/tinh-toan";
import { NHAN_TRANG_THAI_PO } from "@/2-quy-trinh/trang-thai";
import { docDonHangTuExcel, docNgayVN, khopVoiDeNghi } from "@/2-quy-trinh/doc-don-hang-excel";
import { taoFileNhapDonHang, tenFileNhapDonHang } from "@/2-quy-trinh/ghi-don-hang-excel";
import { docSoTien } from "@/6-tien-ich/doc-so-tien";
import { boDau } from "@/6-tien-ich/bo-dau";

/**
 * M4 — LẬP ĐƠN MUA HÀNG. Bố cục bám màn "Đơn mua hàng" của MISA.
 *
 * 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 17/08/2026: *"cấu hình cho a bước lập đơn mua hàng có chức năng
 * giống này 100% và được import được file excel"* — kèm ảnh chụp màn Đơn mua hàng DMH0532-26.
 * Bố cục màn này vì vậy đi theo đúng thứ tự và cách nhóm ô của MISA:
 *
 *   ① Khối thông tin chung 3 cột + "Tổng tiền thanh toán" cỡ lớn ở góc trên phải + Tham chiếu
 *   ② Bảng "Hàng tiền" (có dòng TỔNG CỘNG) + [Thêm dòng] [Thêm ghi chú] [Xóa hết dòng]
 *   ③ Khối dưới trái: Mã RQ - Tên công trình · Hợp đồng - Ngày hợp đồng · Địa điểm giao hàng ·
 *      Điều khoản khác · Đính kèm
 *   ④ Khối dưới phải: Tổng tiền hàng · Tiền chiết khấu · Thuế GTGT · Tổng tiền thanh toán
 *   ⑤ Thanh nút: [Hủy] bên trái — [Cất] [Cất và In] bên phải
 *
 * 🔴 BỐN ĐIỂM CỐ Ý KHÁC MISA — không được "sửa lại cho giống":
 *
 *  1. **Màu sắc theo HPCons Design System V1.1**, không lấy tông xanh ngọc của MISA. Ban lãnh
 *     đạo 17/08/2026: *"Về màu sắc thì vẫn theo design system"*. Primary `#096AA7`, mọi màu đi
 *     qua token, không viết cứng mã màu và không dùng inline style.
 *  2. **Số đơn hàng giữ `260001-HPCS-PO-001`**, không lấy kiểu `DMH0532-26`. Mã hồ sơ bám
 *     Thông báo 09/2026/TB-HPCS (TGĐ ký 11/07/2026), MISA không phải căn cứ.
 *  3. **Cột tiền chỉ hiện với người có `quyen.xemGia`.** Bảng vẫn dựng đủ dòng hàng cho người
 *     không có quyền, chỉ mất mấy cột tiền và khối tổng.
 *  4. **Mỗi dòng hàng BẮT BUỘC nối về một dòng của phiếu đề nghị đã được phân bổ.** MISA cho
 *     gõ tự do mặt hàng bất kỳ; ở đây không được, vì khối lượng đặt phải trừ vào một dòng đề
 *     nghị đã duyệt — đặt ngoài đề nghị là mua hàng không ai duyệt. Vì vậy [Thêm dòng] mở hộp
 *     chọn mặt hàng của đề nghị thay vì chèn một dòng trắng.
 *
 * 📌 ĐÃ BỎ phân trang "20 bản ghi trên 1 trang" của MISA — xem chú thích trong `BangHangTien`.
 */
export default function TrangLapDonHang() {
  /**
   * `useSearchParams` bắt buộc nằm trong Suspense, nếu không `next build` báo
   * "missing-suspense-with-csr-bailout" và dừng build.
   */
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <NoiDungLapDonHang />
    </Suspense>
  );
}

function NoiDungLapDonHang() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prId = searchParams.get("prId");
  /**
   * TÁCH PO: hai tham số này đến từ màn Báo giá, khi người dùng đã chia khối lượng một mặt
   * hàng cho nhiều nhà cung cấp rồi bấm "Lập đơn" cho một nhà cung cấp cụ thể.
   *
   * 🔴 VÌ SAO KHÔNG SINH PO TỰ ĐỘNG TỪ MÀN BÁO GIÁ: đơn đặt hàng còn cần ngày giao, người
   * nhận, địa điểm, điều khoản — những thứ chỉ người lập đơn biết. Nên màn này vẫn là NƠI
   * DUY NHẤT tạo PO (một nguồn sự thật), phân bổ chỉ ĐIỀN SẴN vào đây.
   */
  const rfqId = searchParams.get("rfqId");
  const nccIdTuBaoGia = searchParams.get("nccId");
  const { deNghi, donHang, baoGia, phieuNhan, nhaCungCap, themDonHang } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  // ---------------------------------------------------------------------------
  // ① KHỐI THÔNG TIN CHUNG — đúng thứ tự ô của màn MISA
  // ---------------------------------------------------------------------------
  // Cột 1
  const [maNCC, setMaNCC] = useState("");
  const [mstNCC, setMstNCC] = useState("");
  const [nguoiLienHe, setNguoiLienHe] = useState("");
  // Cột 2
  /**
   * NHÀ CUNG CẤP CỦA ĐƠN — lấy từ file PO, không bắt chọn từ danh mục.
   *
   * 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 10/08/2026: *"mục này tên NCC sẽ lấy từ PO, nên hãy bỏ khu vực
   * này đi, và bám sát vào file PO"*. Trước đây bắt chọn từ 4 nhà cung cấp cứng trong dữ liệu
   * chạy thử, nên file PO thật ghi một nhà cung cấp ngoài danh sách thì người lập phải chọn
   * bừa — tức đơn hàng sai đối tượng.
   */
  const [tenNCC, setTenNCC] = useState("");
  const [diaChiNCC, setDiaChiNCC] = useState("");
  const [dienGiai, setDienGiai] = useState("");
  const [dieuKhoanThanhToan, setDieuKhoanThanhToan] = useState("");
  const [soNgayDuocNo, setSoNgayDuocNo] = useState("");
  // Cột 3
  const [ngayDonHang, setNgayDonHang] = useState(() => new Date().toISOString().slice(0, 10));
  const [ngayGiao, setNgayGiao] = useState("");
  // Dòng cuối khối
  const [thamChieu, setThamChieu] = useState("");
  /** `supplierId` chỉ có khi tra ra trong danh mục — không tra ra vẫn lập được đơn. */
  const [supplierId, setSupplierId] = useState<string>("");

  // ---------------------------------------------------------------------------
  // ② BẢNG "HÀNG TIỀN"
  // ---------------------------------------------------------------------------
  const [dongBang, setDongBang] = useState<DongNhapDonHang[]>([]);
  /**
   * Bộ đếm sinh khóa dòng. KHÔNG dùng `crypto.randomUUID()`: nó chỉ có trong ngữ cảnh bảo mật
   * (https / localhost) — mở bản dựng tĩnh bằng địa chỉ IP nội bộ là ném lỗi và cả bảng chết.
   */
  const boDemDong = useRef(0);
  const khoaDongMoi = useCallback(() => `d${++boDemDong.current}`, []);

  const [kieuChietKhau, setKieuChietKhau] = useState<KieuChietKhau>("khong");
  const [tyLeChietKhau, setTyLeChietKhau] = useState("");
  const [chietKhau, setChietKhau] = useState("");
  const [thueSuat, setThueSuat] = useState("8");

  // ---------------------------------------------------------------------------
  // ③ KHỐI DƯỚI TRÁI
  // ---------------------------------------------------------------------------
  const [tenCongTrinh, setTenCongTrinh] = useState("");
  const [maHopDong, setMaHopDong] = useState("");
  const [ngayHopDong, setNgayHopDong] = useState("");
  const [diaDiemGiao, setDiaDiemGiao] = useState("");
  const [nguoiNhanHang, setNguoiNhanHang] = useState("");
  const [dieuKhoanKhac, setDieuKhoanKhac] = useState("");
  const [tepDinhKem, setTepDinhKem] = useState<MoTaTep[]>([]);

  // ---------------------------------------------------------------------------
  // Hộp thoại
  // ---------------------------------------------------------------------------
  const [dangDocFile, setDangDocFile] = useState(false);
  const [dangTaoFile, setDangTaoFile] = useState(false);
  /** Dữ liệu file vừa đọc, đang chờ người dùng soát. `null` = chưa đọc file nào. */
  const [xemTruocExcel, setXemTruocExcel] = useState<DuLieuXemTruocExcel | null>(null);
  /** Giữ riêng phần đã khớp để đổ vào bảng khi người dùng bấm đồng ý. */
  const doVaoBang = useRef<(() => void) | null>(null);
  const [moChonMatHang, setMoChonMatHang] = useState(false);
  const [hoiXoaHetDong, setHoiXoaHetDong] = useState(false);
  /**
   * Hỏi trước khi cất đơn (nguyên tắc Ban lãnh đạo 10/08/2026).
   *
   * 🔴 Cất đơn là việc RA NGOÀI PHÒNG: đơn được đẩy sang app Kho và app QLDA, và khối lượng
   * bị trừ khỏi phần chưa lên đơn của đề nghị. Bấm nhầm không có nút hoàn lại.
   *
   * `null` = chưa hỏi ai · `"cat"` = cất rồi mở đơn · `"cat-in"` = cất rồi mở trang in.
   */
  const [hoiCat, setHoiCat] = useState<null | "cat" | "cat-in">(null);

  /** Đã điền sẵn từ bảng báo giá nào — hiện dải thông báo để người lập biết vì sao có số. */
  const [nguonTuBaoGia, setNguonTuBaoGia] = useState<{
    maBaoGia: string;
    tenNCC: string;
    soDong: number;
    /** Số dòng trong phân bổ nhưng KHÔNG điền được — phải nói ra, không lặng lẽ bỏ. */
    soDongBoQua: number;
  } | null>(null);

  const dn = deNghi.find((x) => x.id === prId);
  const tienDo = useMemo(
    () => (dn ? tinhTienDoDeNghi(dn, donHang, phieuNhan) : []),
    [dn, donHang, phieuNhan],
  );

  /** Dòng lập được PO: đã phân bổ cho mình (hoặc mình là trưởng BP) và còn KL chưa lên PO. */
  const dongLapDuoc = useMemo(
    () =>
      tienDo.filter(
        (d) =>
          d.khoiLuongChuaLenPO > 0 &&
          Boolean(d.nguoiPhuTrachUid) &&
          (quyen.phanBoCongViec || d.nguoiPhuTrachUid === nguoiDung.uid),
      ),
    [tienDo, quyen.phanBoCongViec, nguoiDung.uid],
  );

  /** Phần còn được đặt của từng dòng đề nghị — bảng dùng để nhắc và cảnh báo vượt. */
  const conLaiTheoDong = useMemo(() => {
    const bang: Record<number, ConLaiDeNghi> = {};
    for (const d of dongLapDuoc) {
      bang[d.stt] = { conLai: d.khoiLuongChuaLenPO, donViTinh: d.donViTinh };
    }
    return bang;
  }, [dongLapDuoc]);

  /** Dựng một dòng bảng từ một dòng đề nghị. Số lượng bỏ trống = lấy hết phần còn lại. */
  const dungDongTuDeNghi = useCallback(
    (d: TienDoDongDeNghi, soLuong?: number, gia?: number): DongNhapDonHang => ({
      id: khoaDongMoi(),
      laGhiChu: false,
      sttDeNghi: d.stt,
      maHang: "",
      tenHang: d.tenVatLieu,
      thongSo: d.quyCach ?? "",
      dvt: d.donViTinh,
      soLuong: String(soLuong ?? d.khoiLuongChuaLenPO),
      donGia: gia !== undefined ? String(gia) : "",
      thueSuat: "",
      truongMoRong1: "",
      mucDich: d.mucDichSuDung ?? "",
    }),
    [khoaDongMoi],
  );

  /* ===== ĐIỀN SẴN CÁC Ô LẤY ĐƯỢC TỪ PHIẾU ĐỀ NGHỊ =====
     Chạy một lần khi mở màn. Mã RQ, tên công trình, hợp đồng đều đã có trên phiếu — bắt gõ
     lại là mời sai sót vào chứng từ. */
  const daDienTuDeNghi = useRef(false);
  useEffect(() => {
    if (daDienTuDeNghi.current || !dn) return;
    setTenCongTrinh(dn.tenCongTrinh);
    setMaHopDong(dn.maHopDongCDT ?? "");
    daDienTuDeNghi.current = true;
  }, [dn]);

  /**
   * ĐIỀN SẴN TỪ PHÂN BỔ CỦA BẢNG BÁO GIÁ — mắt nối của chức năng TÁCH PO.
   *
   * Người dùng vào màn Báo giá, chia 2.400 kg thép cho NCC B 1.500 và NCC G 900, rồi bấm
   * "Lập đơn" ở nhóm NCC B. Màn này mở ra với: NCC B đã điền, dòng thép đã có trong bảng,
   * khối lượng 1.500 và đơn giá B đã báo — điền sẵn. Bấm "Lập đơn" ở nhóm NCC G thì ra đơn
   * thứ hai cho 900 kg còn lại. Đó chính là hai PO tách ra từ một mặt hàng.
   *
   * 🔴 Chạy MỘT LẦN duy nhất (`daDienTuBaoGia`): không có chốt này thì mỗi lần state đổi
   * (người dùng vừa sửa tay khối lượng) hiệu ứng lại ghi đè, người lập không sửa được gì.
   */
  const daDienTuBaoGia = useRef(false);
  useEffect(() => {
    if (daDienTuBaoGia.current) return;
    if (!rfqId || !nccIdTuBaoGia || !dn) return;
    const bg = baoGia.find((b) => b.id === rfqId);
    if (!bg) return;

    const chuanHoa = (s: string) => boDau(s).replace(/\s+/g, " ").trim();
    // 🔴 CHỈ XÉT `dongLapDuoc`, KHÔNG xét cả `tienDo`. Bảng chỉ cho thao tác trên dòng lập
    // được; nếu điền sẵn một dòng không nằm trong đó thì người lập KHÔNG THẤY để bỏ ra, mà
    // lúc cất đơn dòng đó vẫn vào PO — tức đặt hàng cho dòng chưa phân bổ, hoặc dòng của
    // người khác.
    const theoTen = new Map(dongLapDuoc.map((d) => [chuanHoa(d.tenVatLieu), d]));
    const theoStt = new Map(dongLapDuoc.map((d) => [d.stt, d]));

    const dongMoi: DongNhapDonHang[] = [];
    let tenNCCPhanBo = "";
    let soDongBoQua = 0;

    for (const item of bg.items) {
      const phan = (item.phanBo ?? []).find((p) => p.nccId === nccIdTuBaoGia);
      if (!phan || phan.khoiLuong <= 0) continue;
      tenNCCPhanBo = phan.tenNCC;

      // Khớp theo SỐ THỨ TỰ DÒNG trước — chính xác tuyệt đối. Chỉ lùi về khớp theo tên với
      // dữ liệu cũ chưa có `sttDongDeNghi` (hai dòng cùng tên khác quy cách sẽ khớp sai,
      // nên đây chỉ là đường lùi, không phải cách chính).
      const dongDN =
        item.sttDongDeNghi !== undefined
          ? theoStt.get(item.sttDongDeNghi)
          : theoTen.get(chuanHoa(item.tenVatLieu));

      // Dòng đã lên đơn đủ, chưa phân bổ, hoặc phân bổ cho người khác — không đưa vào bảng.
      if (!dongDN || dongDN.khoiLuongChuaLenPO <= 0) {
        soDongBoQua += 1;
        continue;
      }

      // Không đặt vượt phần còn lại của dòng đề nghị, kể cả khi phân bổ ghi nhiều hơn.
      const klDat = Math.min(phan.khoiLuong, dongDN.khoiLuongChuaLenPO);
      const gia = item.baoGiaNCC.find((q) => q.nccId === nccIdTuBaoGia)?.donGia;
      dongMoi.push(dungDongTuDeNghi(dongDN, klDat, gia));
    }

    if (dongMoi.length > 0) {
      setDongBang((t) => [...t, ...dongMoi]);
      setSupplierId(nccIdTuBaoGia);
      setTenNCC(tenNCCPhanBo);
      const trongDanhMuc = nhaCungCap.find((n) => n.id === nccIdTuBaoGia);
      if (trongDanhMuc?.maNCC) setMaNCC(trongDanhMuc.maNCC);
      if (trongDanhMuc?.maSoThue) setMstNCC(trongDanhMuc.maSoThue);
      if (trongDanhMuc?.diaChi) setDiaChiNCC(trongDanhMuc.diaChi);
      if (trongDanhMuc?.nguoiLienHe) setNguoiLienHe(trongDanhMuc.nguoiLienHe);
      setNguonTuBaoGia({
        maBaoGia: bg.code,
        tenNCC: tenNCCPhanBo,
        soDong: dongMoi.length,
        soDongBoQua,
      });
    } else if (soDongBoQua > 0) {
      // Không điền được gì nhưng vẫn phải nói lý do, đừng để màn hình trắng trơn khiến
      // người dùng tưởng bấm nhầm nút.
      setNguonTuBaoGia({ maBaoGia: bg.code, tenNCC: tenNCCPhanBo, soDong: 0, soDongBoQua });
    }
    daDienTuBaoGia.current = true;
    // `dongLapDuoc` tính lại theo dữ liệu nên KHÔNG đưa vào deps — đã có chốt `daDienTuBaoGia`
    // bảo đảm chạy một lần, đưa vào chỉ làm hiệu ứng chạy lại vô ích.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqId, nccIdTuBaoGia, dn, baoGia, nhaCungCap]);

  /**
   * ★ TIỀN CỦA CẢ ĐƠN — gọi thẳng `tinhTienChiTiet` ở `2-quy-trinh/tinh-toan.ts`.
   *
   * 🔴 Ở đây KHÔNG có một phép tính tiền nào, chỉ nhặt trường từ ô nhập đưa sang. Quy tắc
   * 3.4b của dự án: hàm tính tiền nằm trong file giao diện là có hai chỗ cùng tính một con số
   * rồi lệch nhau — mà lệch giữa màn lập đơn và bản in là mất uy tín với nhà cung cấp.
   *
   * 📌 `sttDong` dùng CHỈ SỐ dòng trong `dongBang` (kể cả dòng ghi chú) để bảng tra ngược
   * được kết quả về đúng dòng đang hiện trên màn hình.
   *
   * 🔴 KHỐI LƯỢNG PHẢI CẮT ĐÚNG NHƯ LÚC CẤT ĐƠN. `luu()` cắt về phần còn được đặt, nên nếu ở
   * đây tính theo con số người dùng gõ thì "Tổng tiền thanh toán" cỡ lớn trên đầu màn hình là
   * một số KHÔNG BAO GIỜ THÀNH ĐƠN THẬT — file ghi 9.999 kg mà chỉ còn đặt được 2.400 kg thì
   * màn hình báo 199 triệu trong khi đơn cất ra 44 triệu. Người lập ký duyệt theo con số nhìn
   * thấy, nên hai chỗ buộc phải bằng nhau. Cảnh báo "vượt phần còn lại" ở từng dòng lo việc
   * giải thích vì sao số tiền không khớp với số lượng vừa gõ.
   */
  const tien = useMemo(() => {
    const dongVao: DongDeTinhTien[] = [];
    dongBang.forEach((d, i) => {
      if (d.laGhiChu) return;
      const nhap = Number(d.soLuong) || 0;
      const con = conLaiTheoDong[d.sttDeNghi]?.conLai;
      dongVao.push({
        sttDong: i,
        // Bỏ trống thì lấy hết phần còn lại — y hệt `luu()`.
        soLuong: con === undefined ? nhap : nhap > 0 ? Math.min(nhap, con) : con,
        donGia: Number(d.donGia) || 0,
        // Ô trống = theo thuế suất chung của đơn. Ép về 0 ở đây là biến "chưa khai" thành
        // "không chịu thuế" — hai việc khác hẳn nhau trên chứng từ thuế.
        thueSuatGTGT: d.thueSuat.trim() === "" ? undefined : Number(d.thueSuat) || 0,
      });
    });
    return tinhTienChiTiet(dongVao, {
      kieuChietKhau,
      tyLeChietKhau: Number(tyLeChietKhau) || 0,
      chietKhau: Number(chietKhau) || 0,
      thueSuatGTGT: Number(thueSuat) || 0,
    });
  }, [dongBang, conLaiTheoDong, kieuChietKhau, tyLeChietKhau, chietKhau, thueSuat]);

  /** Mặt hàng của đề nghị chưa có trong bảng — nguồn của hộp [Thêm dòng]. */
  const matHangConThem = useMemo(() => {
    const daCo = new Set(dongBang.filter((d) => !d.laGhiChu).map((d) => d.sttDeNghi));
    return dongLapDuoc.filter((d) => !daCo.has(d.stt));
  }, [dongBang, dongLapDuoc]);

  // --- Các thao tác trên bảng ---
  const doiDong = useCallback((id: string, phan: Partial<DongNhapDonHang>) => {
    setDongBang((t) => t.map((d) => (d.id === id ? { ...d, ...phan } : d)));
  }, []);
  const xoaDong = useCallback((id: string) => {
    setDongBang((t) => t.filter((d) => d.id !== id));
  }, []);
  const themGhiChu = useCallback(() => {
    setDongBang((t) => [
      ...t,
      {
        id: khoaDongMoi(),
        laGhiChu: true,
        sttDeNghi: 0,
        maHang: "",
        tenHang: "",
        thongSo: "",
        dvt: "",
        soLuong: "",
        donGia: "",
        thueSuat: "",
        truongMoRong1: "",
        mucDich: "",
      },
    ]);
  }, [khoaDongMoi]);

  /**
   * PHÍM TẮT F9 — "Thêm nhanh" của MISA, ở đây là mở hộp chọn mặt hàng.
   *
   * 📌 MISA còn ghi "F3 - Tìm nhanh". ĐÃ BỎ F3: màn này không có ô tìm kiếm nào để mở, gắn
   * một phím tắt không làm gì là đúng cái lỗi "giao diện hứa một việc app không làm".
   */
  useEffect(() => {
    function bamPhim(e: KeyboardEvent) {
      if (e.key !== "F9") return;
      e.preventDefault();
      setMoChonMatHang(true);
    }
    window.addEventListener("keydown", bamPhim);
    return () => window.removeEventListener("keydown", bamPhim);
  }, []);

  if (!quyen.lapPO) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Không có quyền lập đơn hàng"
        description="Cần cấp quyền apps.tm từ 2 (Nhập liệu) trở lên."
      />
    );
  }

  if (!dn) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Chưa chọn đề nghị"
        description="Mở một đề nghị mua hàng rồi bấm “Lập đơn đặt hàng”."
        action={{ label: "Xem danh sách đề nghị", onClick: () => router.push("/de-nghi") }}
      />
    );
  }

  /**
   * NHẬP TỪ FILE EXCEL theo biểu mẫu `1. DON HANG HPCONS.xlsx`.
   *
   * 🔴 ĐỌC XONG KHÔNG ĐỔ THẲNG — mở hộp xem trước cho người lập soát từng dòng rồi mới đổ
   * (chỉ đạo Ban lãnh đạo 17/08/2026). Đổ thẳng là xóa mất số liệu đang gõ dở trước khi người
   * ta kịp biết file có dùng được không, mà không có nút hoàn lại.
   */
  async function nhapTuExcel(file: File) {
    setDangDocFile(true);
    try {
      const kq = await docDonHangTuExcel(await file.arrayBuffer());
      // Đối chiếu với TOÀN BỘ dòng của đề nghị (không chỉ dòng lập được) để báo đúng
      // lý do: "không có trong đề nghị" khác hẳn "có nhưng đã lên đơn hết".
      const { khop, khongKhop, khongLapDuoc } = khopVoiDeNghi(
        kq.dong,
        tienDo.map((d) => ({
          stt: d.stt,
          tenVatLieu: d.tenVatLieu,
          // Quy cách giúp phân biệt hai dòng cùng tên vật liệu — xem `khopVoiDeNghi`.
          quyCach: d.quyCach,
          khoiLuongChuaLenPO: d.khoiLuongChuaLenPO,
          lapDuoc: dongLapDuoc.some((x) => x.stt === d.stt),
        })),
      );

      const tenDongDeNghi: Record<number, string> = {};
      for (const d of tienDo) tenDongDeNghi[d.stt] = d.tenVatLieu;

      /* Việc đổ vào bảng đóng gói sẵn ở đây, chỉ chạy khi người dùng bấm đồng ý trong hộp
         xem trước. Giữ trong `ref` chứ không dựng lại từ state: state của hộp chỉ có phần
         BÀY RA, còn đây cần đúng bộ dữ liệu vừa đọc. */
      doVaoBang.current = () => {
        const dongMoi: DongNhapDonHang[] = [];

        for (const k of khop) {
          const e = k.dongExcel;
          const dongDN = dongLapDuoc.find((x) => x.stt === k.sttDeNghi);
          if (!dongDN) continue;
          dongMoi.push({
            id: khoaDongMoi(),
            laGhiChu: false,
            sttDeNghi: k.sttDeNghi,
            maHang: e.maHang ?? "",
            // 🔴 TÊN VÀ ĐVT LẤY THEO FILE ĐƠN HÀNG, không lấy theo phiếu đề nghị. Chỉ đạo
            // Ban lãnh đạo 10/08/2026: thông tin thống nhất lấy theo PO — đó là chữ sẽ in ra
            // gửi nhà cung cấp và đẩy sang Kho / QLDA.
            tenHang: e.tenHang || dongDN.tenVatLieu,
            thongSo: e.thongSoKyThuat ?? dongDN.quyCach ?? "",
            dvt: e.donViTinh || dongDN.donViTinh,
            soLuong: String(e.soLuong),
            donGia: e.donGia !== undefined ? String(e.donGia) : "",
            thueSuat: e.thueSuatGTGT !== undefined ? String(e.thueSuatGTGT) : "",
            truongMoRong1: e.truongMoRong1 ?? "",
            mucDich: e.mucDichSuDung ?? dongDN.mucDichSuDung ?? "",
          });
        }

        // Dòng ghi chú của file vào bảng đúng dạng dòng ghi chú, không thành dòng hàng 0 ₫.
        for (const g of kq.dongGhiChu) {
          dongMoi.push({
            id: khoaDongMoi(),
            laGhiChu: true,
            sttDeNghi: 0,
            maHang: "",
            tenHang: g.tenHang,
            thongSo: "",
            dvt: "",
            soLuong: "",
            donGia: "",
            thueSuat: "",
            truongMoRong1: "",
            mucDich: "",
          });
        }

        /* ⚠️ THAY dòng cũ của cùng một mặt hàng, không cộng thêm dòng thứ hai. Chọn nhầm file
           rồi chọn lại file đúng mà app cứ nối tiếp thì bảng có hai dòng cùng mặt hàng, cất
           đơn là đặt gấp đôi khối lượng. */
        const sttMoi = new Set(dongMoi.filter((d) => !d.laGhiChu).map((d) => d.sttDeNghi));
        setDongBang((t) => [
          ...t.filter((d) => d.laGhiChu || !sttMoi.has(d.sttDeNghi)),
          ...dongMoi,
        ]);

        // --- Thông tin chung của phiếu ---
        const c = kq.thongTinChung;
        if (c.diaDiemGiaoHang) setDiaDiemGiao(c.diaDiemGiaoHang);
        if (c.nguoiNhan) setNguoiNhanHang(c.nguoiNhan);
        if (c.dieuKhoanKhac) setDieuKhoanKhac(c.dieuKhoanKhac);
        if (c.dieuKhoanThanhToan) setDieuKhoanThanhToan(c.dieuKhoanThanhToan);
        if (c.thueSuatGTGT !== undefined) setThueSuat(String(c.thueSuatGTGT));
        if (c.dienGiai) setDienGiai(c.dienGiai);
        if (c.thamChieu) setThamChieu(c.thamChieu);
        if (c.nguoiLienHe) setNguoiLienHe(c.nguoiLienHe);
        if (c.maNCC) setMaNCC(c.maNCC);
        if (c.soNgayDuocNo !== undefined) setSoNgayDuocNo(String(c.soNgayDuocNo));
        if (c.canCuHopDong) setMaHopDong(c.canCuHopDong);

        // Ngày: đổi dd/MM/yyyy sang yyyy-MM-dd, xem `docNgayVN` — đưa thẳng chuỗi Việt vào ô
        // ngày là ô trống trơn, còn để `new Date()` đọc thì lệch một tháng.
        const ngayGiaoISO = docNgayVN(c.ngayGiaoHang);
        if (ngayGiaoISO) setNgayGiao(ngayGiaoISO);
        const ngayDonISO = docNgayVN(c.ngayDonHang);
        if (ngayDonISO) setNgayDonHang(ngayDonISO);
        const ngayHopDongISO = docNgayVN(c.ngayHopDong);
        if (ngayHopDongISO) setNgayHopDong(ngayHopDongISO);

        /**
         * NHẬN DIỆN NHÀ CUNG CẤP — theo MÃ SỐ THUẾ trước, rồi mới đến tên.
         *
         * 🔴 Mã số thuế là số định danh duy nhất do cơ quan thuế cấp; tên thì mỗi phiếu viết
         * một kiểu ("CÔNG TY TNHH HIỆP PHÁT" · "Công ty TNHH Hiệp Phát" · "CTY TNHH HIỆP
         * PHÁT"). Khớp theo tên trước là trượt ngay ở phiếu viết hoa hoặc viết tắt.
         *
         * 🔴 LẤY NHÀ CUNG CẤP TỪ FILE, không đòi phải có trong danh mục (chỉ đạo Ban lãnh
         * đạo 10/08/2026). Tra danh mục chỉ để LIÊN KẾT thêm nếu tìm được, không phải để chặn.
         */
        if (c.tenNhaCungCap) setTenNCC(c.tenNhaCungCap);
        if (c.maSoThueNCC) setMstNCC(c.maSoThueNCC);
        if (c.diaChiNCC) setDiaChiNCC(c.diaChiNCC);

        const soThue = (s?: string) => (s ?? "").replace(/\D/g, "");
        let daChonNCC = false;
        if (c.maSoThueNCC) {
          const theoMST = nhaCungCap.find(
            (n) => n.maSoThue && soThue(n.maSoThue) === soThue(c.maSoThueNCC),
          );
          if (theoMST) {
            setSupplierId(theoMST.id);
            daChonNCC = true;
          }
        }
        if (!daChonNCC && c.tenNhaCungCap) {
          const chuan = (s: string) => boDau(s).replace(/\s+/g, " ").trim();
          const ncc = nhaCungCap.find((n) => chuan(n.ten) === chuan(c.tenNhaCungCap!));
          if (ncc) setSupplierId(ncc.id);
        }

        toast.success(`Đã đổ ${dongMoi.length} dòng vào bảng`, {
          description: "Soát lại số liệu rồi bấm Cất.",
        });
      };

      setXemTruocExcel({
        tenFile: file.name,
        khop,
        khongKhop,
        khongLapDuoc,
        dongGhiChu: kq.dongGhiChu,
        dongLoi: kq.dongLoi,
        thieuCot: kq.thieuCot,
        canhBao: kq.canhBao,
        bangTrong: kq.bangTrong,
        tenDongDeNghi,
      });
    } catch (loi) {
      // 🔴 PHẢI ghi lỗi thật ra console. Trước đây `catch {}` nuốt sạch, nên mọi nguyên
      // nhân khác nhau (file .xls định dạng cũ, file hỏng, thư viện không nạp được) đều
      // hiện ra một câu y như nhau — không cách nào chẩn đoán khi người dùng báo lỗi.
      console.error("[nhập Excel] không đọc được file:", loi);
      toast.error("Không đọc được file", {
        description:
          "File phải là .xlsx (Excel 2007 trở lên). File .xls đời cũ cần mở bằng Excel rồi “Lưu thành” .xlsx.",
      });
    } finally {
      setDangDocFile(false);
    }
  }

  /**
   * TẢI FILE MẪU ĐÃ ĐIỀN SẴN.
   *
   * 🔴 Vì sao cần (bài học 10/08/2026): biểu mẫu giấy `1. DON HANG HPCONS.xlsx` là **mẫu
   * trống**, chọn thẳng vào app thì đọc ra 0 dòng và người dùng tưởng chức năng nhập bị
   * hỏng. File tải ở đây đã có sẵn đúng các mặt hàng đang chờ lập đơn của đề nghị này,
   * nên tên hàng chắc chắn khớp — người lập chỉ điền Đơn giá rồi chọn lại file.
   */
  async function taiFileMau() {
    if (!dn) return;
    if (dongLapDuoc.length === 0) {
      toast.error("Không có mặt hàng nào để đưa vào file", {
        description: "Đề nghị này đã lên đơn hết, hoặc các dòng chưa được phân bổ cho ai.",
      });
      return;
    }
    setDangTaoFile(true);
    try {
      const blob = await taoFileNhapDonHang({
        maDeNghi: dn.code,
        tenCongTrinh: dn.tenCongTrinh,
        maHopDongCDT: dn.maHopDongCDT,
        diaDiemGiaoHang: diaDiemGiao || dn.tenCongTrinh,
        nguoiNhanHang,
        dong: dongLapDuoc.map((d) => ({
          stt: d.stt,
          tenVatLieu: d.tenVatLieu,
          quyCach: d.quyCach,
          donViTinh: d.donViTinh,
          soLuong: d.khoiLuongChuaLenPO,
          mucDichSuDung: d.mucDichSuDung,
        })),
      });

      // Tải xuống bằng thẻ <a> tạm — không cần máy chủ, chạy được cả trên hosting tĩnh.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = tenFileNhapDonHang(dn.code);
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Đã tải file mẫu với ${dongLapDuoc.length} mặt hàng`, {
        description: "Điền cột Đơn giá rồi bấm “Chọn file Excel” để nhập lại.",
      });
    } catch (loi) {
      console.error("[nhập Excel] không tạo được file mẫu:", loi);
      toast.error("Không tạo được file mẫu");
    } finally {
      setDangTaoFile(false);
    }
  }

  /** Dòng hàng thật (bỏ dòng ghi chú) — dùng để biết đơn đã có gì chưa. */
  const soDongHang = dongBang.filter((d) => !d.laGhiChu).length;
  // Đòi TÊN nhà cung cấp, không đòi phải có trong danh mục (chỉ đạo Ban lãnh đạo 10/08/2026).
  const hopLe = soDongHang > 0 && tenNCC.trim() !== "" && ngayGiao !== "" && ngayDonHang !== "";

  function luu(rangIn: boolean) {
    if (!dn || tenNCC.trim() === "") return;
    /**
     * Nhà cung cấp của đơn — lấy theo FILE PO (chỉ đạo Ban lãnh đạo 10/08/2026).
     *
     * `supplierId` chỉ có khi tra ra trong danh mục. Không tra ra thì sinh khóa từ mã số
     * thuế (định danh duy nhất) hoặc từ tên — để hai đơn cùng một nhà cung cấp vẫn gom được
     * về một khóa khi tính công nợ và khi chống lập đơn trùng.
     */
    const maSoThue = mstNCC.replace(/\D/g, "");
    /**
     * 🔴 PHẢI LƯU CẢ MST VÀ ĐỊA CHỈ, không chỉ dùng để sinh khóa.
     *
     * Trang in đơn mua hàng (`trang/don-hang-in.tsx`) in hai dòng "Địa chỉ" và "Mã số thuế".
     * Trước 17/08/2026 chỗ đây chỉ giữ `id` + `ten` nên trang in phải tra ngược danh mục
     * `NHA_CUNG_CAP` — mà danh mục là hằng số cứng, app không có đường thêm nhà cung cấp mới.
     * Hệ quả: người lập gõ đủ MST và địa chỉ vào form mà **đơn in ra gửi nhà cung cấp vẫn
     * hiện dấu "—"**, thiếu thông tin pháp lý bắt buộc mà không ai biết.
     */
    const ncc = {
      id: supplierId || (maSoThue ? `ncc-mst-${maSoThue}` : `ncc-ten-${boDau(tenNCC).trim()}`),
      ten: tenNCC.trim(),
    };

    /* 🔴 LỌC LẠI THEO `dongLapDuoc`, KHÔNG TIN VÀO BẢNG.
       Lớp chặn thứ hai, cố ý trùng với lớp ở chỗ điền sẵn và ở hộp thêm dòng. Bất kỳ dòng nào
       lọt vào bảng mà không nằm trong `dongLapDuoc` là dòng đặt cho phần chưa phân bổ hoặc của
       người khác. Đã từng lọt qua đường điền sẵn từ bảng báo giá. */
    const sttHopLe = new Set(dongLapDuoc.map((d) => d.stt));
    const conLai = new Map(dongLapDuoc.map((d) => [d.stt, d.khoiLuongChuaLenPO]));

    const items: DongPO[] = [];
    const giaTheoDong: Record<number, number> = {};
    const thueSuatTheoDong: Record<number, number> = {};

    for (const d of dongBang) {
      if (d.laGhiChu) {
        // Dòng ghi chú trống thì bỏ — một dòng trắng giữa đơn gửi nhà cung cấp là lỗi trình bày.
        if (d.tenHang.trim() === "") continue;
        items.push({
          sttDong: items.length + 1,
          // Quy ước dòng ghi chú, xem `DongPO.laDongGhiChu`: không trỏ về đề nghị nào,
          // không đơn vị tính, không khối lượng.
          sttDongDeNghi: 0,
          tenVatLieu: d.tenHang.trim(),
          donViTinh: "",
          khoiLuongDat: 0,
          laDongGhiChu: true,
        });
        continue;
      }

      if (!sttHopLe.has(d.sttDeNghi)) continue;
      const con = conLai.get(d.sttDeNghi) ?? 0;
      const nhap = Number(d.soLuong);
      // Nhập vượt thì tự cắt về phần còn lại (bảng đã cảnh báo tại chỗ); để trống thì lấy hết.
      const khoiLuongDat = nhap > 0 ? Math.min(nhap, con) : con;

      const sttDong = items.length + 1;
      items.push({
        sttDong,
        sttDongDeNghi: d.sttDeNghi,
        // Ô trống thì để `undefined` chứ không lưu chuỗi rỗng — trang in dựa vào `?? "—"`
        // để biết ô nào chưa khai, chuỗi rỗng sẽ in ra ô trắng khó hiểu.
        maHang: d.maHang.trim() || undefined,
        tenVatLieu: d.tenHang.trim(),
        thongSoKyThuat: d.thongSo.trim() || undefined,
        donViTinh: d.dvt.trim(),
        khoiLuongDat,
        mucDichSuDung: d.mucDich.trim() || undefined,
        truongMoRong1: d.truongMoRong1.trim() || undefined,
      });
      giaTheoDong[sttDong] = Number(d.donGia) || 0;
      // Chỉ ghi thuế suất riêng khi người lập THẬT SỰ nhập — để trống thì chứng từ nói đúng
      // "dòng này không có thỏa thuận thuế riêng", và sau đổi thuế suất chung là đổi theo.
      if (d.thueSuat.trim() !== "") thueSuatTheoDong[sttDong] = Number(d.thueSuat) || 0;
    }

    const dongHang = items.filter((it) => !it.laDongGhiChu);

    // Lọc xong không còn dòng hàng nào thì dừng, kèm lý do — đừng lập một đơn hàng trống.
    if (dongHang.length === 0) {
      toast.error("Không có dòng nào lập được đơn", {
        description: "Các dòng trong bảng hiện chưa được phân bổ, hoặc đã lên đơn đủ khối lượng.",
      });
      return;
    }

    /**
     * 🔴 CHẶN CẤT ĐƠN KHI CÒN DÒNG THIẾU ĐƠN GIÁ (bài học 11/08/2026).
     *
     * Trước đây chỗ này chỉ `Number(... ?? 0)` nên cất được đơn với đơn giá 0. Hệ quả dây
     * chuyền: đơn đó không in ra được (bản in phải có giá), không xuất Excel được
     * (`vuongMacXuatPO` chặn), và công nợ tính ra 0 — mà người lập thì tưởng đã xong.
     *
     * Chặn ở ĐÂY, tại chỗ sinh ra đơn, thay vì chỉ chặn ở nút xuất file: sửa gốc thì mọi
     * đơn về sau đều lành, còn chặn ở ngọn thì đơn lỗi vẫn nằm trong dữ liệu.
     */
    const dongThieuGia = dongHang.filter((it) => !(giaTheoDong[it.sttDong] > 0));
    if (dongThieuGia.length > 0) {
      toast.error(`Còn ${dongThieuGia.length} dòng chưa nhập đơn giá`, {
        description: `Nhập đơn giá cho: ${dongThieuGia
          .map((it) => it.tenVatLieu)
          .join(", ")}. Đơn mua hàng gửi nhà cung cấp bắt buộc có đơn giá.`,
      });
      return;
    }

    const ketQua = themDonHang({
      maDuAn: dn.maDuAn,
      maHopDongCDT: maHopDong.trim() || undefined,
      ngayHopDongCDT: ngayHopDong || undefined,
      prId: dn.id,
      prCode: dn.code,
      tenCongTrinh: tenCongTrinh.trim() || undefined,
      supplierId: ncc.id,
      supplierTen: ncc.ten,
      maSoThueNCC: maSoThue || undefined,
      diaChiNCC: diaChiNCC.trim() || undefined,
      nguoiLienHeNCC: nguoiLienHe.trim() || undefined,
      dienGiai: dienGiai.trim() || undefined,
      thamChieu: thamChieu.trim() || undefined,
      nguoiPhuTrachUid: nguoiDung.uid,
      nguoiPhuTrachTen: nguoiDung.tenHienThi,
      ngayLapPO: ngayDonHang,
      ngayGiaoDuKien: ngayGiao,
      diaDiemGiaoHang: diaDiemGiao.trim() || undefined,
      nguoiNhanHangTen: nguoiNhanHang.trim() || undefined,
      dieuKhoanKhac: dieuKhoanKhac.trim() || undefined,
      tepDinhKem: tepDinhKem.length > 0 ? tepDinhKem : undefined,
      items,
      donGia: giaTheoDong,
      thueSuatDong: Object.keys(thueSuatTheoDong).length > 0 ? thueSuatTheoDong : undefined,
      phanTien: {
        loaiTien: "VND",
        kieuChietKhau,
        /* ⚠️ CHỈ GHI CON SỐ CỦA ĐÚNG KIỂU ĐANG CHỌN. `tienChietKhau` suy số tiền từ tỷ lệ khi
           kiểu là "ty_le", nên ghi thêm `chietKhau` lúc đó là để lại một con số cũ không ai
           dùng — đọc chứng từ sau này thấy hai giá trị mâu thuẫn không biết tin cái nào. */
        chietKhau: kieuChietKhau === "so_tien" ? Number(chietKhau) || undefined : undefined,
        tyLeChietKhau: kieuChietKhau === "ty_le" ? Number(tyLeChietKhau) || undefined : undefined,
        thueSuatGTGT: Number(thueSuat) || undefined,
        dieuKhoanThanhToan: dieuKhoanThanhToan.trim() || undefined,
        soNgayDuocNo: Number(soNgayDuocNo) || undefined,
      },
    });

    /* Bị chặn thì nói ĐÚNG LÝ DO. Lý do hay gặp nhất là bảng báo giá chưa được trưởng bộ
       phận duyệt — người dùng cần biết phải đi làm gì tiếp, không phải một câu báo lỗi chung
       chung rồi tự đoán. */
    if ("loi" in ketQua) {
      toast.error("Chưa lập được đơn đặt hàng", { description: ketQua.loi });
      return;
    }
    toast.success("Đã cất đơn hàng");
    /* "Cất và In" mở thẳng bản in A4. Trang in tự chặn quyền `xemGia` bên trong nên không
       phải kiểm lại ở đây. */
    router.push(rangIn ? `/in/don-hang/${ketQua.id}` : `/don-hang/${ketQua.id}`);
  }

  const nhanTrangThai = NHAN_TRANG_THAI_PO.da_chot;

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Thu mua", href: "/tong-quan" },
          { label: "Quy trình mua hàng", href: "/de-nghi" },
          { label: dn.code, href: `/de-nghi/${dn.id}` },
          { label: "Lập đơn mua hàng" },
        ]}
        title="Lập đơn mua hàng"
        description={`Từ ${dn.code} · ${dn.tieuDe}`}
        actions={
          /* ===== NHẬP TỪ FILE EXCEL — nửa sau của yêu cầu 17/08/2026 =====
             Đặt ở góc trên phải để thấy ngay khi mở màn: người lập thường có sẵn file của nhà
             cung cấp, gõ tay từng dòng chỉ là đường lùi. */
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={taiFileMau}
              disabled={dangTaoFile || dangDocFile}
              className="min-h-11"
            >
              <Download className="size-4" aria-hidden />
              {dangTaoFile ? "Đang tạo file..." : "Tải file mẫu"}
            </Button>
            {/* Ô chọn tệp thật nằm trong <label>: `<input type=file>` không tạo kiểu được nên
                mọi app đều bọc như vậy. */}
            <label className="shrink-0">
              <input
                type="file"
                accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                disabled={dangDocFile}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void nhapTuExcel(f);
                  // Xóa giá trị để chọn lại đúng file đó lần nữa vẫn kích hoạt onChange.
                  e.target.value = "";
                }}
              />
              <span
                className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:border-primary hover:bg-muted ${
                  dangDocFile ? "pointer-events-none opacity-60" : ""
                }`}
              >
                <FileSpreadsheet className="size-4" aria-hidden />
                {dangDocFile ? "Đang đọc file..." : "Nhập từ Excel"}
              </span>
            </label>
          </div>
        }
      />

      {/* ===== DẢI THÔNG BÁO: đơn này là MỘT PHẦN tách ra từ bảng báo giá =====
          Không có dòng này thì người lập mở màn ra thấy số liệu tự có sẵn mà không hiểu
          vì sao, dễ tưởng app điền sai rồi xóa đi làm lại. */}
      {nguonTuBaoGia && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-primary/40 bg-primary-bg p-(--hp-md-row-pad) text-sm">
          <span className="flex items-start gap-2 text-text-secondary">
            <Split className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              Đơn này là <strong className="text-text-primary">một phần tách ra</strong> từ bảng
              báo giá <strong className="text-text-primary">{nguonTuBaoGia.maBaoGia}</strong>,
              phần của <strong className="text-text-primary">{nguonTuBaoGia.tenNCC}</strong> —{" "}
              {nguonTuBaoGia.soDong} mặt hàng đã điền sẵn khối lượng và đơn giá theo phân bổ.
              Phần khối lượng của các nhà cung cấp khác sẽ lập thành đơn riêng.
            </span>
          </span>
          {/* ⚠️ Nói ra số dòng bị bỏ. Bỏ lặng lẽ thì người lập tưởng đã đặt đủ phần của nhà
              cung cấp này, trong khi thực tế còn dòng chưa được đặt. */}
          {nguonTuBaoGia.soDongBoQua > 0 && (
            <span className="flex items-start gap-2 text-warning-soft">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Có <strong>{nguonTuBaoGia.soDongBoQua} mặt hàng</strong> trong phân bổ không đưa
                vào đơn được: đã lên đơn đủ khối lượng, chưa được phân bổ cho ai, hoặc đang do
                người khác phụ trách.
              </span>
            </span>
          )}
        </div>
      )}

      {/* =========================================================================
          ① KHỐI THÔNG TIN CHUNG — 3 cột, đúng thứ tự ô của MISA
          ========================================================================= */}
      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          {/* --- "Tổng tiền thanh toán" CỠ LỚN ở góc trên phải, đúng chỗ MISA đặt ---
              🔴 Chỉ hiện với người có quyền xem giá. */}
          {quyen.xemGia && (
            <div className="flex flex-wrap items-baseline justify-end gap-x-3 gap-y-1">
              <span className="text-sm text-text-desc">Tổng tiền thanh toán</span>
              <span className="text-h2 font-bold tabular-nums text-primary">
                {tien.tongThanhToan.toLocaleString("vi-VN")} ₫
              </span>
            </div>
          )}

          <div className="grid gap-(--hp-md-card-gap) md:grid-cols-2 xl:grid-cols-3">
            {/* ===== CỘT 1 ===== */}
            <div className="flex flex-col gap-(--hp-md-card-gap)">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ma-ncc">Mã nhà cung cấp</Label>
                <Input
                  id="ma-ncc"
                  value={maNCC}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMaNCC(v);
                    /* Ô này là Ô TRA DANH MỤC, không phải ô lưu vào đơn: `DonDatHang` không có
                       trường mã NCC (mã nằm ở danh mục `NhaCungCap.maNCC`). Gõ trúng mã thì
                       điền hộ tên / MST / địa chỉ / người liên hệ và giữ liên kết `supplierId`.
                       Câu trạng thái ngay dưới nói rõ có tra ra hay không — không tra ra mà im
                       lặng thì người lập tưởng đã chọn đúng nhà cung cấp. */
                    const tim = nhaCungCap.find(
                      (n) => n.maNCC && n.maNCC.toLowerCase() === v.trim().toLowerCase(),
                    );
                    if (!tim) return;
                    setSupplierId(tim.id);
                    setTenNCC(tim.ten);
                    if (tim.maSoThue) setMstNCC(tim.maSoThue);
                    if (tim.diaChi) setDiaChiNCC(tim.diaChi);
                    if (tim.nguoiLienHe) setNguoiLienHe(tim.nguoiLienHe);
                  }}
                  placeholder="NCC0001"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="mst-ncc">Mã số thuế</Label>
                <Input
                  id="mst-ncc"
                  value={mstNCC}
                  onChange={(e) => setMstNCC(e.target.value)}
                  placeholder="0300000001"
                  inputMode="numeric"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="nguoi-lien-he">Người liên hệ</Label>
                <Input
                  id="nguoi-lien-he"
                  value={nguoiLienHe}
                  onChange={(e) => setNguoiLienHe(e.target.value)}
                  placeholder="Tên · số điện thoại bên nhà cung cấp"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="nv-mua-hang">Nhân viên mua hàng</Label>
                {/* 🔴 CHỈ ĐỌC, cố ý. Đơn ghi tên ai thì `nguoiPhuTrachUid` phải là mã người
                    đó — cho gõ tự do thì tên và mã lệch nhau, và mọi màn "việc của tôi",
                    lịch công tác, phân bổ đều tra theo mã. */}
                <Input id="nv-mua-hang" value={nguoiDung.tenHienThi} readOnly disabled />
              </div>
            </div>

            {/* ===== CỘT 2 ===== */}
            <div className="flex flex-col gap-(--hp-md-card-gap)">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ten-ncc">Tên nhà cung cấp</Label>
                <Input
                  id="ten-ncc"
                  value={tenNCC}
                  onChange={(e) => setTenNCC(e.target.value)}
                  placeholder="CÔNG TY TNHH ..."
                />
                {/* Cho biết có tra ra trong danh mục hay không — hữu ích để quản trị bổ sung
                    sau, nhưng KHÔNG chặn lập đơn. */}
                {tenNCC.trim() !== "" && (
                  <span className="text-xs text-text-desc">
                    {supplierId
                      ? `Đã liên kết với “${nhaCungCap.find((n) => n.id === supplierId)?.ten}” trong danh mục.`
                      : "Chưa có trong danh mục — vẫn lập được đơn, thông tin lấy theo những ô trên."}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dia-chi-ncc">Địa chỉ</Label>
                <Input
                  id="dia-chi-ncc"
                  value={diaChiNCC}
                  onChange={(e) => setDiaChiNCC(e.target.value)}
                  placeholder="Số ..., đường ..., tỉnh ..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dien-giai">Diễn giải</Label>
                <Input
                  id="dien-giai"
                  value={dienGiai}
                  onChange={(e) => setDienGiai(e.target.value)}
                  placeholder="Một câu mô tả ngắn cho cả đơn"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dk-tt">Điều khoản thanh toán</Label>
                <Input
                  id="dk-tt"
                  value={dieuKhoanThanhToan}
                  onChange={(e) => setDieuKhoanThanhToan(e.target.value)}
                  placeholder="Thanh toán 100% trong 30 ngày sau khi nhận đủ hàng"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="so-ngay-no">Số ngày được nợ</Label>
                <Input
                  id="so-ngay-no"
                  type="number"
                  min={0}
                  value={soNgayDuocNo}
                  onChange={(e) => setSoNgayDuocNo(e.target.value)}
                  className="w-32"
                  placeholder="30"
                />
              </div>
            </div>

            {/* ===== CỘT 3 ===== */}
            <div className="flex flex-col gap-(--hp-md-card-gap)">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ngay-don-hang">Ngày đơn hàng</Label>
                <Input
                  id="ngay-don-hang"
                  type="date"
                  value={ngayDonHang}
                  onChange={(e) => setNgayDonHang(e.target.value)}
                  className="w-48"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="so-don-hang">Số đơn hàng</Label>
                {/* 🔴 SINH TỰ ĐỘNG THEO THÔNG BÁO 09/2026/TB-HPCS, không cho gõ và KHÔNG đoán
                    trước con số. Số thứ tự chạy theo dự án và do `themDonHang` cấp lúc cất —
                    đoán trước ở đây thì hai người cùng lập một lúc sẽ thấy cùng một số, rồi
                    đơn cất ra mang số khác cái đã hiện. Bày dạng mã là đủ để người lập yên tâm.
                    ⚠️ KHÔNG lấy kiểu `DMH0532-26` của MISA. */}
                <Input
                  id="so-don-hang"
                  value={`${dn.maDuAn}-PO-…`}
                  readOnly
                  disabled
                  className="w-56"
                />
                <span className="text-xs text-text-desc">
                  Cấp tự động khi cất, theo mã dự án {dn.maDuAn}.
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tinh-trang">
                  Tình trạng <span className="text-danger">*</span>
                </Label>
                {/* 🔴 CHỈ ĐỌC. MISA cho chọn tình trạng tự do; app này có quy trình 6 trạng thái
                    riêng đã chốt, và đơn mới luôn vào `da_chot` (xem `themDonHang`). Bày một ô
                    chọn rồi bỏ qua giá trị người dùng chọn chính là kiểu "giao diện hứa một
                    việc app không làm" mà dự án cấm. Trạng thái đổi ở màn chi tiết đơn. */}
                <div id="tinh-trang" className="flex min-h-11 items-center">
                  <StatusBadge label={nhanTrangThai.nhan} tone={nhanTrangThai.tong} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ngay-giao">Ngày giao hàng</Label>
                <Input
                  id="ngay-giao"
                  type="date"
                  value={ngayGiao}
                  onChange={(e) => setNgayGiao(e.target.value)}
                  className="w-48"
                />
                <span className="text-xs text-text-desc">
                  Một ngày cho cả đơn — app không nhập kế hoạch giao từng đợt.
                </span>
              </div>
            </div>
          </div>

          {/* --- Dòng "Tham chiếu" chạy hết bề ngang, đúng chỗ MISA đặt (cuối khối) --- */}
          <div className="flex flex-col gap-2 border-t border-divider pt-(--hp-md-card-gap)">
            <Label htmlFor="tham-chieu">Tham chiếu</Label>
            <Input
              id="tham-chieu"
              value={thamChieu}
              onChange={(e) => setThamChieu(e.target.value)}
              placeholder="Số chứng từ bên ngoài liên quan (đơn cũ, email, hợp đồng…)"
            />
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
          ② BẢNG "HÀNG TIỀN"
          ========================================================================= */}
      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          <BangHangTien
            dong={dongBang}
            tien={tien}
            xemGia={quyen.xemGia}
            conLai={conLaiTheoDong}
            kieuChietKhau={kieuChietKhau}
            tyLeChietKhau={tyLeChietKhau}
            chietKhau={chietKhau}
            onDoiDong={doiDong}
            onXoaDong={xoaDong}
            onThemDong={() => setMoChonMatHang(true)}
            onThemGhiChu={themGhiChu}
            onXoaHetDong={() => setHoiXoaHetDong(true)}
            onDoiKieuChietKhau={setKieuChietKhau}
            onDoiTyLeChietKhau={setTyLeChietKhau}
            onDoiChietKhau={setChietKhau}
            conMatHangDeThem={matHangConThem.length > 0}
          />

          {quyen.xemGia && (
            <div className="flex flex-wrap items-end gap-3 border-t border-divider pt-(--hp-md-card-gap)">
              <div className="flex flex-col gap-2">
                <Label htmlFor="vat-chung">Thuế suất GTGT chung (%)</Label>
                <Input
                  id="vat-chung"
                  type="number"
                  min={0}
                  max={100}
                  value={thueSuat}
                  onChange={(e) => setThueSuat(e.target.value)}
                  className="w-32"
                />
              </div>
              <p className="pb-2 text-xs text-text-desc">
                Áp cho mọi dòng bỏ trống cột <strong>% Thuế GTGT</strong>. Đơn trộn nhiều mức
                thì ghi riêng ở từng dòng.
              </p>
            </div>
          )}

          {/* 📌 MISA ghi "F3 - Tìm nhanh, F9 - Thêm nhanh". Ở đây chỉ giữ F9 vì chỉ F9 có thật
              — xem chú thích ở chỗ bắt phím. */}
          <p className="text-xs text-text-desc">F9 — thêm nhanh một mặt hàng vào bảng.</p>
        </CardContent>
      </Card>

      {/* =========================================================================
          ③ + ④ HAI KHỐI DƯỚI — trái: thông tin giao nhận · phải: bảng tổng hợp tiền
          ========================================================================= */}
      <div className="grid gap-(--hp-md-card-gap) lg:grid-cols-2">
        {/* --- ③ KHỐI DƯỚI TRÁI --- */}
        <Card>
          <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ma-rq">Mã RQ - Tên công trình</Label>
              <div className="flex flex-wrap gap-2">
                {/* Mã RQ chỉ đọc: nó là mã phiếu đề nghị nguồn, đổi tay là mất đường truy vết
                    về khối lượng đã duyệt. Tên công trình thì sửa được — đơn là chứng từ gửi
                    ra ngoài, tên in trên đó phải đứng yên kể cả khi đề nghị bị đổi tên sau. */}
                <Input value={dn.code} readOnly disabled className="w-44" aria-label="Mã RQ" />
                <Input
                  id="ma-rq"
                  value={tenCongTrinh}
                  onChange={(e) => setTenCongTrinh(e.target.value)}
                  className="min-w-48 flex-1"
                  placeholder="Tên công trình"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="hop-dong">Hợp đồng - Ngày hợp đồng</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="hop-dong"
                  value={maHopDong}
                  onChange={(e) => setMaHopDong(e.target.value)}
                  className="min-w-48 flex-1"
                  placeholder="Số hợp đồng với chủ đầu tư"
                />
                <Input
                  type="date"
                  value={ngayHopDong}
                  onChange={(e) => setNgayHopDong(e.target.value)}
                  className="w-48"
                  aria-label="Ngày hợp đồng"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="dia-diem">Địa điểm giao hàng</Label>
              {/* 📌 MISA để ô này là ô CHỌN có danh mục địa điểm. App chưa có danh mục địa điểm
                  giao hàng nào, nên giữ ô nhập chữ: một ô chọn chỉ có đúng một dòng còn khó
                  dùng hơn ô gõ tay. Bỏ trống thì lấy tên công trình. */}
              <Input
                id="dia-diem"
                placeholder={dn.tenCongTrinh}
                value={diaDiemGiao}
                onChange={(e) => setDiaDiemGiao(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="nguoi-nhan">Người nhận hàng (bên mua)</Label>
              <Input
                id="nguoi-nhan"
                placeholder="Thủ kho công trình"
                value={nguoiNhanHang}
                onChange={(e) => setNguoiNhanHang(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="dk-khac">Điều khoản khác</Label>
              {/* MISA để ô nhiều dòng — dùng textarea gốc vì bộ nền tảng chưa có component
                  Textarea; vẫn ăn đúng token màu và bo góc của Design System. */}
              <textarea
                id="dk-khac"
                rows={3}
                value={dieuKhoanKhac}
                onChange={(e) => setDieuKhoanKhac(e.target.value)}
                placeholder="Bảo hành, bốc xếp, chứng chỉ chất lượng kèm theo…"
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text-primary transition-colors outline-none placeholder:text-text-disabled focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/50"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Đính kèm</Label>
              {/* 🔴 DÙNG LẠI `ODinhKemNhieuTep`: nó cất tệp vào kho tệp (IndexedDB + Firestore)
                  NGAY LÚC CHỌN rồi mới trả mô tả về. Tuyệt đối không nhét nội dung tệp vào
                  `localStorage` — chỗ đó chỉ ~5MB cho cả tên miền và đang giữ toàn bộ dữ liệu
                  nghiệp vụ, một ảnh 2–5MB là mất sạch.
                  ⚠️ MISA ghi "Dung lượng tối đa 5MB"; app dùng giới hạn chung của mình
                  (`CO_TOI_DA` ở `kho-tep.ts`), do chính ô này in ra — không đặt thêm một con
                  số riêng cho đơn hàng rồi hai chỗ nói hai kiểu. */}
              <ODinhKemNhieuTep
                tep={tepDinhKem}
                onDoi={setTepDinhKem}
                nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
                nhan="Đính kèm tệp cho đơn"
              />
            </div>
          </CardContent>
        </Card>

        {/* --- ④ KHỐI DƯỚI PHẢI: bảng tổng hợp tiền --- */}
        <Card>
          <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
            <h2 className="text-h3 text-text-primary">Tổng hợp</h2>
            {quyen.xemGia ? (
              <>
                <dl className="flex flex-col gap-1.5 text-sm">
                  <DongTongHop nhan="Tổng tiền hàng" giaTri={tien.congTienHang} />
                  <DongTongHop nhan="Tiền chiết khấu" giaTri={tien.chietKhau} />
                  {/* 🔴 Đơn trộn 8% và 10% thì KHÔNG được ghi "Thuế GTGT (8%)" — đó là ghi sai
                      chứng từ thuế, không phải lỗi trình bày. `moTaThueSuat` lo đúng chỗ này. */}
                  <DongTongHop
                    nhan={`Thuế GTGT (${moTaThueSuat(tien)})`}
                    giaTri={tien.tienThueGTGT}
                  />
                  <DongTongHop nhan="Tổng tiền thanh toán" giaTri={tien.tongThanhToan} tong />
                </dl>
                <p className="text-right text-xs italic text-text-desc">
                  {docSoTien(tien.tongThanhToan)}
                </p>
              </>
            ) : (
              /* Không có quyền xem giá thì nói rõ vì sao trống, đừng để một thẻ rỗng. */
              <p className="text-sm text-text-desc">
                Bạn không có quyền xem giá nên phần tiền của đơn được ẩn.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* =========================================================================
          ⑤ THANH NÚT DƯỚI CÙNG — [Hủy] trái · [Cất] [Cất và In] phải
          ========================================================================= */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => router.back()}>
            Hủy
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            {!hopLe && (
              <span className="text-xs text-text-desc">
                Cần tên nhà cung cấp, ngày đơn hàng, ngày giao hàng và ít nhất một dòng hàng.
              </span>
            )}
            <Button disabled={!hopLe} onClick={() => setHoiCat("cat")}>
              <Save className="size-4" aria-hidden />
              Cất
            </Button>
            <Button
              variant="outline"
              disabled={!hopLe || !quyen.xemGia}
              onClick={() => setHoiCat("cat-in")}
              /* Trang in đòi quyền xem giá (bản in luôn có giá), nên nút mờ phải nói lý do —
                 nút mờ không giải thích là kiểu bí việc khó chịu nhất. */
              title={!quyen.xemGia ? "Bản in có giá nên cần quyền xem giá" : undefined}
            >
              <Printer className="size-4" aria-hidden />
              Cất và In
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== Hộp chọn mặt hàng cho [Thêm dòng] / phím F9 ===== */}
      <HopChonMatHang
        mo={moChonMatHang}
        matHang={matHangConThem}
        onDong={() => setMoChonMatHang(false)}
        onChon={(dsStt) => {
          const them = matHangConThem
            .filter((d) => dsStt.includes(d.stt))
            .map((d) => dungDongTuDeNghi(d));
          if (them.length > 0) setDongBang((t) => [...t, ...them]);
        }}
      />

      {/* ===== Hộp xem trước file Excel ===== */}
      <HopXemTruocNhapExcel
        mo={xemTruocExcel !== null}
        duLieu={xemTruocExcel}
        onDong={() => setXemTruocExcel(null)}
        onDo={() => doVaoBang.current?.()}
      />

      {/* 🔴 "Xóa hết dòng" PHẢI HỎI LẠI — bấm nhầm là mất sạch công nhập liệu, không hoàn lại. */}
      <HopXacNhan
        mo={hoiXoaHetDong}
        nguyHiem
        tieuDe="Xóa hết dòng trong bảng?"
        moTa={`Bảng đang có ${dongBang.length} dòng (${soDongHang} dòng hàng). Xóa hết rồi phải chọn lại mặt hàng và nhập lại toàn bộ số liệu.`}
        canhBao="Không có nút hoàn lại. Nếu chỉ muốn bỏ một dòng thì dùng nút thùng rác ở cuối dòng đó."
        nhanDongY="Xóa hết dòng"
        onDong={() => setHoiXoaHetDong(false)}
        onDongY={() => setDongBang([])}
      />

      {/* Hỏi trước khi cất — xem `HopXacNhan` về nguyên tắc áp cho việc nào. */}
      <HopXacNhan
        mo={hoiCat !== null}
        tieuDe="Cất đơn mua hàng này?"
        moTa={`Đơn cho ${tenNCC.trim() || "nhà cung cấp"} với ${soDongHang} mặt hàng, giao dự kiến ${ngayGiao || "—"}.`}
        canhBao="Khối lượng bị trừ khỏi phần chưa lên đơn của đề nghị. Không hoàn lại được."
        nhanDongY={hoiCat === "cat-in" ? "Cất và In" : "Cất"}
        onDong={() => setHoiCat(null)}
        onDongY={() => luu(hoiCat === "cat-in")}
      />
    </>
  );
}

/** Một dòng của khối tổng hợp tiền ở góc dưới phải. */
function DongTongHop({
  nhan,
  giaTri,
  tong,
}: {
  nhan: string;
  giaTri: number;
  tong?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        tong ? "border-t border-divider pt-2" : ""
      }`}
    >
      <dt className={tong ? "font-bold text-text-primary" : "text-text-desc"}>{nhan}</dt>
      <dd
        className={`tabular-nums ${
          tong ? "text-h3 font-bold text-primary" : "font-medium text-text-primary"
        }`}
      >
        {giaTri.toLocaleString("vi-VN")} ₫
      </dd>
    </div>
  );
}

/**
 * HỘP CHỌN MẶT HÀNG cho nút [Thêm dòng] và phím F9.
 *
 * 🔴 VÌ SAO KHÔNG CHÈN MỘT DÒNG TRẮNG NHƯ MISA: mỗi dòng hàng bắt buộc nối về một dòng của
 * phiếu đề nghị đã được phân bổ, vì khối lượng đặt phải trừ vào đó. Cho gõ tự do là mở đường
 * đặt hàng ngoài đề nghị — mua hàng không ai duyệt. Nên nút thêm dòng mở đúng danh sách mặt
 * hàng còn đặt được của đề nghị này.
 */
function HopChonMatHang({
  mo,
  matHang,
  onDong,
  onChon,
}: {
  mo: boolean;
  matHang: TienDoDongDeNghi[];
  onDong: () => void;
  onChon: (dsStt: number[]) => void;
}) {
  const [daChon, setDaChon] = useState<number[]>([]);

  /* Dọn lựa chọn mỗi lần mở lại: giữ lựa chọn cũ thì lần sau mở ra đã có sẵn dấu tick của
     mặt hàng vừa thêm, người dùng bấm Thêm là ra dòng trùng. */
  useEffect(() => {
    if (mo) setDaChon([]);
  }, [mo]);

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      {/* 🔴 `sm:max-w-lg` — viết `max-w-lg` trơn là vô hiệu, lớp gốc base-nova đã có
          `sm:max-w-sm` đè lên. */}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm mặt hàng vào bảng</DialogTitle>
          <DialogDescription>
            Chỉ hiện mặt hàng của phiếu đề nghị còn khối lượng chưa lên đơn và đã được phân bổ
            cho bạn.
          </DialogDescription>
        </DialogHeader>

        {matHang.length === 0 ? (
          <p className="text-sm text-text-desc">
            Không còn mặt hàng nào để thêm. Tất cả đã nằm trong bảng, đã lên đơn đủ khối lượng,
            hoặc chưa được phân bổ cho bạn.
          </p>
        ) : (
          <ul className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
            {matHang.map((d) => (
              <li key={d.stt}>
                <label className="flex min-h-11 items-start gap-3 rounded-lg border border-border p-2.5">
                  <Checkbox
                    checked={daChon.includes(d.stt)}
                    onCheckedChange={(c: boolean) =>
                      setDaChon((t) => (c ? [...t, d.stt] : t.filter((x) => x !== d.stt)))
                    }
                    aria-label={`Chọn ${d.tenVatLieu}`}
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-text-primary">
                      {d.stt}. {d.tenVatLieu}
                    </span>
                    <span className="text-xs text-text-desc">
                      Còn chưa lên đơn: {d.khoiLuongChuaLenPO.toLocaleString("vi-VN")}{" "}
                      {d.donViTinh}
                      {d.nguoiPhuTrachTen ? ` · phụ trách ${d.nguoiPhuTrachTen}` : ""}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Hủy
          </Button>
          <Button
            disabled={daChon.length === 0}
            onClick={() => {
              onChon(daChon);
              onDong();
            }}
          >
            Thêm {daChon.length > 0 ? `${daChon.length} dòng` : "dòng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
