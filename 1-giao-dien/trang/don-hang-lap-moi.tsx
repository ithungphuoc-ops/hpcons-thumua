"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileWarning,
  ShoppingCart,
  Split,
} from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { Skeleton } from "@/1-giao-dien/nen-tang-ui/skeleton";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { tinhKhoiTongTien, tinhTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import { docDonHangTuExcel, docNgayVN, khopVoiDeNghi } from "@/2-quy-trinh/doc-don-hang-excel";
import { taoFileNhapDonHang, tenFileNhapDonHang } from "@/2-quy-trinh/ghi-don-hang-excel";
import { docSoTien } from "@/6-tien-ich/doc-so-tien";
import { boDau } from "@/6-tien-ich/bo-dau";

/**
 * M4 — Lập đơn đặt hàng.
 *
 * Chỉ chọn được dòng ĐÃ ĐƯỢC PHÂN BỔ và CÒN KHỐI LƯỢNG CHƯA LÊN PO.
 * Khối lượng đặt không được vượt phần còn lại của dòng đề nghị.
 * Đơn giá nhập ở đây được lưu sang collection RIÊNG tm_donhang_gia.
 */
/**
 * `useSearchParams` bắt buộc phải nằm trong Suspense, nếu không `next build`
 * sẽ báo "missing-suspense-with-csr-bailout" và dừng build.
 */
export default function TrangLapDonHang() {
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

  const [chon, setChon] = useState<number[]>([]);
  const [khoiLuong, setKhoiLuong] = useState<Record<number, string>>({});
  const [donGia, setDonGia] = useState<Record<number, string>>({});
  const [supplierId, setSupplierId] = useState<string>("");
  const [ngayGiao, setNgayGiao] = useState("");

  // --- Các ô có trên biểu mẫu giấy `1. DON HANG HPCONS.xlsx` ---
  // Theo từng dòng hàng:
  const [maHang, setMaHang] = useState<Record<number, string>>({});
  const [thongSo, setThongSo] = useState<Record<number, string>>({});
  const [mucDich, setMucDich] = useState<Record<number, string>>({});
  /**
   * Tên hàng và ĐVT **theo đơn đặt hàng**, khi khác với phiếu đề nghị.
   *
   * 🔴 Chỉ đạo Ban lãnh đạo 10/08/2026: *"Thông tin này thống nhất lấy theo PO... phiếu đề
   * nghị chỉ để đối chiếu sau này. Sau này cũng sẽ lấy thông tin từ PO để đẩy qua cho các
   * phòng ban khác"*. Nên khi nhập từ file, tên hàng trên đơn lấy đúng chữ trong file — đó
   * là chữ sẽ in ra gửi nhà cung cấp và đẩy sang Kho / QLDA. Phiếu đề nghị có thể ghi
   * "Xi măng PCB40" còn đơn ghi "Xi măng PCB40 - Hà Tiên", hai bên không buộc phải giống.
   *
   * Để trống thì lấy theo phiếu đề nghị như trước.
   */
  const [tenHangPO, setTenHangPO] = useState<Record<number, string>>({});
  const [dvtPO, setDvtPO] = useState<Record<number, string>>({});
  // Theo cả đơn:
  const [diaDiemGiao, setDiaDiemGiao] = useState("");
  const [nguoiNhanHang, setNguoiNhanHang] = useState("");
  const [dieuKhoanKhac, setDieuKhoanKhac] = useState("");
  // Phần TIỀN — lưu sang chứng từ riêng tm_donhang_gia, không nằm trong PO:
  const [chietKhau, setChietKhau] = useState("");
  const [thueSuat, setThueSuat] = useState("8");
  const [dieuKhoanThanhToan, setDieuKhoanThanhToan] = useState("");

  /** Kết quả lần nhập Excel gần nhất — hiện để người dùng soát, không tự ẩn đi. */
  const [ketQuaNhap, setKetQuaNhap] = useState<{
    daDien: number;
    khongKhop: string[];
    khongLapDuoc: string[];
    vuot: string[];
    canhBao: string[];
    /** Nhà cung cấp ghi trong file nhưng không có trong danh mục — người dùng phải tự chọn. */
    nccChuaKhop?: string;
  } | null>(null);
  const [dangDocFile, setDangDocFile] = useState(false);
  const [dangTaoFile, setDangTaoFile] = useState(false);

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
  const dongLapDuoc = tienDo.filter(
    (d) =>
      d.khoiLuongChuaLenPO > 0 &&
      Boolean(d.nguoiPhuTrachUid) &&
      (quyen.phanBoCongViec || d.nguoiPhuTrachUid === nguoiDung.uid),
  );

  /**
   * ĐIỀN SẴN TỪ PHÂN BỔ CỦA BẢNG BÁO GIÁ — mắt nối của chức năng TÁCH PO.
   *
   * Người dùng vào màn Báo giá, chia 2.400 kg thép cho NCC B 1.500 và NCC G 900, rồi bấm
   * "Lập đơn" ở nhóm NCC B. Màn này mở ra với: NCC B đã chọn, dòng thép đã tick, khối
   * lượng 1.500 và đơn giá B đã báo — điền sẵn. Bấm "Lập đơn" ở nhóm NCC G thì ra đơn
   * thứ hai cho 900 kg còn lại. Đó chính là hai PO tách ra từ một mặt hàng.
   *
   * 🔴 Chạy MỘT LẦN duy nhất (`daDienTuBaoGia`): không có chốt này thì mỗi lần state đổi
   * (người dùng vừa sửa tay khối lượng) hiệu ứng lại ghi đè, người lập không sửa được gì.
   *
   * ⚠️ Khớp theo TÊN VẬT LIỆU vì dòng báo giá không giữ số thứ tự dòng đề nghị. Cùng cách
   * khớp với phần nhập Excel — khi có mã vật tư thì đổi cả hai chỗ sang khớp theo mã.
   */
  const daDienTuBaoGia = useRef(false);
  useEffect(() => {
    if (daDienTuBaoGia.current) return;
    if (!rfqId || !nccIdTuBaoGia || !dn) return;
    const bg = baoGia.find((b) => b.id === rfqId);
    if (!bg) return;

    const chuanHoa = (s: string) => boDau(s).replace(/\s+/g, " ").trim();
    // 🔴 CHỈ XÉT `dongLapDuoc`, KHÔNG xét cả `tienDo`. Bảng bên dưới chỉ hiện `dongLapDuoc`;
    // nếu tick sẵn một dòng không nằm trong đó thì người lập KHÔNG THẤY để bỏ tick, mà lúc
    // chốt đơn dòng đó vẫn vào PO — tức đặt hàng cho dòng chưa phân bổ, hoặc dòng của người
    // khác. Đúng cái mà chú thích đầu file cấm: "Chỉ chọn được dòng ĐÃ ĐƯỢC PHÂN BỔ".
    const theoTen = new Map(dongLapDuoc.map((d) => [chuanHoa(d.tenVatLieu), d]));
    const theoStt = new Map(dongLapDuoc.map((d) => [d.stt, d]));

    const sttMoi: number[] = [];
    let soDong = 0;
    let tenNCC = "";
    let soDongBoQua = 0;

    for (const item of bg.items) {
      const phan = (item.phanBo ?? []).find((p) => p.nccId === nccIdTuBaoGia);
      if (!phan || phan.khoiLuong <= 0) continue;
      tenNCC = phan.tenNCC;

      // Khớp theo SỐ THỨ TỰ DÒNG trước — chính xác tuyệt đối. Chỉ lùi về khớp theo tên với
      // dữ liệu cũ chưa có `sttDongDeNghi` (hai dòng cùng tên khác quy cách sẽ khớp sai,
      // nên đây chỉ là đường lùi, không phải cách chính).
      const dongDN =
        item.sttDongDeNghi !== undefined
          ? theoStt.get(item.sttDongDeNghi)
          : theoTen.get(chuanHoa(item.tenVatLieu));

      // Dòng đã lên đơn đủ, chưa phân bổ, hoặc phân bổ cho người khác — không tick sẵn.
      if (!dongDN || dongDN.khoiLuongChuaLenPO <= 0) {
        soDongBoQua += 1;
        continue;
      }

      // Không đặt vượt phần còn lại của dòng đề nghị, kể cả khi phân bổ ghi nhiều hơn.
      const klDat = Math.min(phan.khoiLuong, dongDN.khoiLuongChuaLenPO);
      setKhoiLuong((t) => ({ ...t, [dongDN.stt]: String(klDat) }));

      const gia = item.baoGiaNCC.find((q) => q.nccId === nccIdTuBaoGia)?.donGia;
      if (gia !== undefined) setDonGia((t) => ({ ...t, [dongDN.stt]: String(gia) }));

      sttMoi.push(dongDN.stt);
      soDong += 1;
    }

    if (sttMoi.length > 0) {
      setChon((t) => [...new Set([...t, ...sttMoi])]);
      setSupplierId(nccIdTuBaoGia);
      setNguonTuBaoGia({ maBaoGia: bg.code, tenNCC, soDong, soDongBoQua });
    } else if (soDongBoQua > 0) {
      // Không điền được gì nhưng vẫn phải nói lý do, đừng để màn hình trắng trơn khiến
      // người dùng tưởng bấm nhầm nút.
      setNguonTuBaoGia({ maBaoGia: bg.code, tenNCC, soDong: 0, soDongBoQua });
    }
    daDienTuBaoGia.current = true;
    // `dongLapDuoc` tính lại mỗi lần render nên KHÔNG đưa vào deps — đã có chốt
    // `daDienTuBaoGia` bảo đảm chạy một lần, đưa vào chỉ làm hiệu ứng chạy lại vô ích.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqId, nccIdTuBaoGia, dn, baoGia]);

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
   * Chỉ ĐIỀN SẴN vào biểu mẫu trên màn hình, KHÔNG tự chốt đơn — người lập vẫn phải
   * soát rồi bấm "Chốt đơn hàng". File là nguồn nhập liệu, không phải lệnh mua.
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

      // Điền từng dòng khớp được — LẤY THEO FILE PO, đề nghị chỉ dùng để đối chiếu.
      const sttMoi: number[] = [];
      for (const k of khop) {
        const e = k.dongExcel;
        sttMoi.push(k.sttDeNghi);
        setKhoiLuong((t) => ({ ...t, [k.sttDeNghi]: String(e.soLuong) }));
        if (e.donGia !== undefined) setDonGia((t) => ({ ...t, [k.sttDeNghi]: String(e.donGia) }));
        if (e.maHang) setMaHang((t) => ({ ...t, [k.sttDeNghi]: e.maHang! }));
        if (e.thongSoKyThuat) setThongSo((t) => ({ ...t, [k.sttDeNghi]: e.thongSoKyThuat! }));
        if (e.mucDichSuDung) setMucDich((t) => ({ ...t, [k.sttDeNghi]: e.mucDichSuDung! }));
        // Tên hàng và ĐVT: lấy đúng chữ trong file — đây là chữ sẽ in ra đơn gửi nhà cung
        // cấp và đẩy sang Kho / QLDA.
        setTenHangPO((t) => ({ ...t, [k.sttDeNghi]: e.tenHang }));
        if (e.donViTinh) setDvtPO((t) => ({ ...t, [k.sttDeNghi]: e.donViTinh }));
      }
      // Gộp với lựa chọn sẵn có, không xóa dòng người dùng đã tự tick.
      if (sttMoi.length > 0) setChon((t) => [...new Set([...t, ...sttMoi])]);

      // --- Thông tin chung của phiếu ---
      const c = kq.thongTinChung;
      if (c.diaDiemGiaoHang) setDiaDiemGiao(c.diaDiemGiaoHang);
      if (c.nguoiNhan) setNguoiNhanHang(c.nguoiNhan);
      if (c.dieuKhoanKhac) setDieuKhoanKhac(c.dieuKhoanKhac);
      if (c.dieuKhoanThanhToan) setDieuKhoanThanhToan(c.dieuKhoanThanhToan);
      if (c.thueSuatGTGT !== undefined) setThueSuat(String(c.thueSuatGTGT));

      // Ngày giao hàng — trước đây bỏ sót, người lập phải tự chọn lại dù file đã ghi rõ.
      // ⚠️ Đổi dd/MM/yyyy sang yyyy-MM-dd, xem `docNgayVN`: đưa thẳng chuỗi Việt vào ô ngày
      // là ô trống trơn, còn để `new Date()` đọc thì lệch một tháng.
      const ngayGiaoISO = docNgayVN(c.ngayGiaoHang);
      if (ngayGiaoISO) setNgayGiao(ngayGiaoISO);

      /**
       * NHẬN DIỆN NHÀ CUNG CẤP — theo MÃ SỐ THUẾ trước, rồi mới đến tên.
       *
       * 🔴 Mã số thuế là số định danh duy nhất do cơ quan thuế cấp; tên thì mỗi phiếu viết
       * một kiểu ("CÔNG TY TNHH HIỆP PHÁT" · "Công ty TNHH Hiệp Phát" · "CTY TNHH HIỆP
       * PHÁT"). Khớp theo tên trước là trượt ngay ở phiếu viết hoa hoặc viết tắt.
       *
       * ⚠️ Bỏ mọi ký tự không phải chữ số khi so mã số thuế — nhiều phiếu ghi có dấu gạch
       * cho đơn vị phụ thuộc ("0300000001-001") hoặc chèn khoảng trắng.
       */
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
        if (ncc) {
          setSupplierId(ncc.id);
          daChonNCC = true;
        }
      }

      setKetQuaNhap({
        daDien: khop.length,
        khongKhop: khongKhop.map((d) => d.tenHang),
        khongLapDuoc: khongLapDuoc.map((k) => `${k.dongExcel.tenHang} (${k.lyDo})`),
        vuot: khop.filter((k) => k.vuotKhoiLuong).map((k) => k.dongExcel.tenHang),
        canhBao: kq.canhBao,
        // File ghi rõ nhà cung cấp mà app không tra ra thì phải nói, đừng để người lập
        // tưởng app đã chọn sẵn rồi chốt đơn với nhà cung cấp khác.
        nccChuaKhop:
          !daChonNCC && (c.tenNhaCungCap || c.maSoThueNCC)
            ? `${c.tenNhaCungCap ?? "(không có tên)"}${
                c.maSoThueNCC ? ` · MST ${c.maSoThueNCC}` : ""
              }`
            : undefined,
      });

      // Nói ĐÚNG lý do. Ba tình huống rất khác nhau, người dùng phải làm ba việc khác nhau:
      // file chưa điền gì · file có hàng nhưng tên khác · đọc được và điền xong.
      if (khop.length > 0) {
        toast.success(`Đã điền ${khop.length} dòng từ file`, {
          description: "Soát lại số liệu rồi bấm Chốt đơn hàng.",
        });
      } else if (kq.bangTrong) {
        toast.error("File chưa có dòng hàng nào", {
          description:
            "Đây là biểu mẫu trống. Bấm “Tải file mẫu” để lấy bản đã có sẵn mặt hàng của đề nghị này.",
        });
      } else if (khongLapDuoc.length > 0 && khongKhop.length === 0) {
        // Mặt hàng CÓ trong đề nghị, chỉ là lúc này không lập đơn được. Báo "tên không
        // khớp" ở đây là nói sai hẳn — người dùng sẽ đi dò lại tên hàng vô ích.
        toast.error("Mặt hàng trong file hiện chưa lập được đơn", {
          description: khongLapDuoc
            .slice(0, 3)
            .map((k) => `${k.dongExcel.tenHang} — ${k.lyDo}`)
            .join("; "),
        });
      } else {
        toast.error("Không điền được dòng nào", {
          description: `Đọc được ${kq.dong.length} dòng nhưng tên hàng không khớp mặt hàng nào của đề nghị này.`,
        });
      }
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

  const hopLe = chon.length > 0 && supplierId !== "" && ngayGiao !== "";

  /** Xem trước khối tổng ngay khi đang nhập — dùng chung công thức với màn xem và trang in. */
  const congTienHang = chon.reduce((tong, stt) => {
    const dong = tienDo.find((d) => d.stt === stt);
    if (!dong) return tong;
    const nhap = Number(khoiLuong[stt] ?? 0);
    const kl = nhap > 0 ? Math.min(nhap, dong.khoiLuongChuaLenPO) : dong.khoiLuongChuaLenPO;
    return tong + kl * (Number(donGia[stt]) || 0);
  }, 0);
  const xemTruocTien = tinhKhoiTongTien(congTienHang, Number(chietKhau) || 0, Number(thueSuat) || 0);

  function luu() {
    const ncc = nhaCungCap.find((n) => n.id === supplierId);
    if (!ncc || !dn) return;

    // 🔴 LỌC LẠI THEO `dongLapDuoc`, KHÔNG TIN VÀO `chon`.
    // Lớp chặn thứ hai, cố ý trùng với lớp ở chỗ điền sẵn. Bảng bên dưới chỉ hiện
    // `dongLapDuoc`, nên bất kỳ stt nào lọt vào `chon` mà không nằm trong đó là dòng người
    // lập KHÔNG NHÌN THẤY — đặt hàng cho nó là đặt cho dòng chưa phân bổ hoặc dòng của
    // người khác. Đã từng lọt qua đường điền sẵn từ bảng báo giá.
    const sttHopLe = new Set(dongLapDuoc.map((d) => d.stt));
    const items = chon
      .filter((stt) => sttHopLe.has(stt))
      .map((stt, i) => {
      const dong = tienDo.find((d) => d.stt === stt)!;
      const nhap = Number(khoiLuong[stt] ?? 0);
      return {
        sttDong: i + 1,
        sttDongDeNghi: stt,
        // Ô trống thì để `undefined` chứ không lưu chuỗi rỗng — trang in dựa vào
        // `?? "—"` để biết ô nào chưa khai, chuỗi rỗng sẽ in ra ô trắng khó hiểu.
        maHang: maHang[stt]?.trim() || undefined,
        // 🔴 TÊN VÀ ĐVT LẤY THEO ĐƠN HÀNG trước, phiếu đề nghị chỉ là đường lùi.
        // Chỉ đạo Ban lãnh đạo 10/08/2026: thông tin thống nhất lấy theo PO, vì chính PO là
        // thứ in ra gửi nhà cung cấp và đẩy sang các phòng ban khác. Liên kết truy vết về
        // phiếu đề nghị vẫn giữ nguyên qua `sttDongDeNghi` ngay dưới.
        tenVatLieu: tenHangPO[stt]?.trim() || dong.tenVatLieu,
        // Chưa nhập thông số riêng thì lấy quy cách đã ghi ở dòng đề nghị.
        thongSoKyThuat: thongSo[stt]?.trim() || dong.quyCach || undefined,
        donViTinh: dvtPO[stt]?.trim() || dong.donViTinh,
        khoiLuongDat: nhap > 0 ? Math.min(nhap, dong.khoiLuongChuaLenPO) : dong.khoiLuongChuaLenPO,
        // Chưa nhập riêng thì lấy mục đích người đề nghị đã ghi trên phiếu — thông tin
        // đó đi thẳng ra đơn mua hàng gửi nhà cung cấp, không phải gõ lại.
        mucDichSuDung: mucDich[stt]?.trim() || dong.mucDichSuDung || undefined,
      };
    });

    // Lọc xong không còn dòng nào thì dừng, kèm lý do — đừng lập một đơn hàng trống.
    if (items.length === 0) {
      toast.error("Không có dòng nào lập được đơn", {
        description: "Các dòng đã chọn hiện chưa được phân bổ, hoặc đã lên đơn đủ khối lượng.",
      });
      return;
    }

    const giaTheoDong: Record<number, number> = {};
    items.forEach((it) => {
      giaTheoDong[it.sttDong] = Number(donGia[it.sttDongDeNghi] ?? 0);
    });

    const id = themDonHang({
      maDuAn: dn.maDuAn,
      maHopDongCDT: dn.maHopDongCDT,
      prId: dn.id,
      prCode: dn.code,
      supplierId: ncc.id,
      supplierTen: ncc.ten,
      nguoiPhuTrachUid: nguoiDung.uid,
      nguoiPhuTrachTen: nguoiDung.tenHienThi,
      ngayLapPO: new Date().toISOString().slice(0, 10),
      ngayGiaoDuKien: ngayGiao,
      diaDiemGiaoHang: diaDiemGiao.trim() || undefined,
      nguoiNhanHangTen: nguoiNhanHang.trim() || undefined,
      dieuKhoanKhac: dieuKhoanKhac.trim() || undefined,
      items,
      donGia: giaTheoDong,
      phanTien: {
        loaiTien: "VND",
        chietKhau: Number(chietKhau) || undefined,
        thueSuatGTGT: Number(thueSuat) || undefined,
        dieuKhoanThanhToan: dieuKhoanThanhToan.trim() || undefined,
      },
    });

    // Đơn mới giờ lấy id từ `ID_DON_HANG_GIA_LAP` (đã sinh sẵn trang) nên mở thẳng
    // được trang chi tiết. Trước đây phải quay về danh sách vì id tự nghĩ ra 404.
    if (!id) {
      toast.error("Đã hết chỗ cho đơn hàng thử", {
        description: "Bản chạy thử chỉ lập được 20 đơn. Tải lại trang để về dữ liệu gốc.",
      });
      return;
    }
    toast.success("Đã chốt đơn hàng", {
      description: "Đơn đã được đẩy sang app Kho và app QLDA.",
    });
    router.push(`/don-hang/${id}`);
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Thu mua", href: "/tong-quan" },
          { label: "Đề nghị mua hàng", href: "/de-nghi" },
          { label: dn.code, href: `/de-nghi/${dn.id}` },
          { label: "Lập đơn đặt hàng" },
        ]}
        title="Lập đơn đặt hàng"
        description={`Từ ${dn.code} · ${dn.tieuDe}. Mã PO sinh tự động theo mã dự án ${dn.maDuAn}`}
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

      {/* ===== NHẬP TỪ FILE EXCEL =====
          Chỉ đạo Ban lãnh đạo 10/08/2026: dùng chính biểu mẫu đang lưu hành
          `1. INPUT/Bieu mau/1. DON HANG HPCONS.xlsx` để nhập, khỏi gõ tay từng dòng. */}
      <Card className="border-primary/30">
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-h3 text-text-primary">Nhập từ file Excel</h2>
              <p className="text-xs text-text-desc">
                Chọn file theo mẫu <strong>Đơn mua hàng HPCons</strong>. Hệ thống đọc bảng
                hàng rồi <strong>điền sẵn</strong> vào biểu mẫu bên dưới — vẫn phải soát lại
                trước khi chốt đơn.
              </p>
              {/* Chỉ dẫn thẳng vào cái bẫy đã gặp: biểu mẫu giấy là mẫu TRỐNG, chọn nó
                  thì không có dòng nào để đọc. */}
              <p className="text-xs text-text-desc">
                Chưa có file? Bấm <strong>Tải file mẫu</strong> — file tải về đã sẵn các mặt
                hàng của đề nghị này, chỉ cần điền <strong>Đơn giá</strong>. Biểu mẫu giấy
                tải từ nơi khác thường là <em>mẫu trống</em>, chọn vào đây sẽ không có dòng nào.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
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
            <label className="shrink-0">
              <input
                type="file"
                accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
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
                {dangDocFile ? "Đang đọc file..." : "Chọn file Excel"}
              </span>
            </label>
            </div>
          </div>

          {/* Báo cáo kết quả — nói rõ dòng nào không dùng được, KHÔNG lặng lẽ bỏ qua */}
          {ketQuaNhap && (
            <div className="flex flex-col gap-1.5 rounded-lg bg-muted p-(--hp-md-row-pad) text-xs">
              <p className="text-sm font-semibold text-text-primary">
                Đã điền {ketQuaNhap.daDien} dòng từ file
              </p>
              {ketQuaNhap.vuot.length > 0 && (
                <p className="flex items-start gap-1.5 text-warning-soft">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>
                    Số lượng vượt phần còn được đặt: <strong>{ketQuaNhap.vuot.join(", ")}</strong>.
                    Khi chốt đơn hệ thống sẽ tự cắt về phần còn lại.
                  </span>
                </p>
              )}
              {/* Nhà cung cấp trong file không tra ra trong danh mục — phải nói, nếu không
                  người lập tưởng app đã chọn sẵn rồi chốt đơn với nhà cung cấp khác. */}
              {ketQuaNhap.nccChuaKhop && (
                <p className="flex items-start gap-1.5 text-warning-soft">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>
                    Nhà cung cấp trong file chưa có trong danh mục:{" "}
                    <strong>{ketQuaNhap.nccChuaKhop}</strong>. Hãy tự chọn nhà cung cấp bên
                    dưới, hoặc nhờ quản trị thêm nhà cung cấp này vào danh mục.
                  </span>
                </p>
              )}
              {ketQuaNhap.khongKhop.length > 0 && (
                <p className="flex items-start gap-1.5 text-danger-soft">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>
                    Chưa đối chiếu được với phiếu đề nghị:{" "}
                    <strong>{ketQuaNhap.khongKhop.join(", ")}</strong>. Tên trong file không
                    trùng mặt hàng nào của đề nghị này nên chưa đưa vào đơn được. Sửa tên trong
                    file cho gần với tên trên phiếu đề nghị, hoặc chọn tay dòng tương ứng bên
                    dưới rồi điền số liệu.
                  </span>
                </p>
              )}
              {/* Tách riêng khỏi nhóm trên: mặt hàng NÀY CÓ trong đề nghị, chỉ là lúc
                  này chưa lập đơn được. Gộp chung sẽ làm người dùng tưởng app đọc sai file. */}
              {ketQuaNhap.khongLapDuoc.length > 0 && (
                <p className="flex items-start gap-1.5 text-warning-soft">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>
                    Có trong đề nghị nhưng chưa lập đơn được:{" "}
                    <strong>{ketQuaNhap.khongLapDuoc.join(", ")}</strong>.
                  </span>
                </p>
              )}
              {ketQuaNhap.canhBao.map((c) => (
                <p key={c} className="text-text-secondary">
                  · {c}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chọn nhà cung cấp + ngày giao */}
      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          <div className="flex flex-col gap-2">
            <Label>Nhà cung cấp</Label>
            <div className="flex flex-wrap gap-2">
              {nhaCungCap.map((n) => (
                <Button
                  key={n.id}
                  variant={supplierId === n.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSupplierId(n.id)}
                >
                  {n.ten}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-(--hp-md-card-gap) md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ngay-giao">Ngày giao dự kiến (1 ngày cho cả PO)</Label>
              <Input
                id="ngay-giao"
                type="date"
                value={ngayGiao}
                onChange={(e) => setNgayGiao(e.target.value)}
                className="w-44"
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
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="dia-diem">Địa điểm giao hàng</Label>
              <Input
                id="dia-diem"
                placeholder={dn.tenCongTrinh}
                value={diaDiemGiao}
                onChange={(e) => setDiaDiemGiao(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="dk-khac">Điều khoản khác</Label>
              <Input
                id="dk-khac"
                placeholder="Bảo hành, bốc xếp, chứng chỉ chất lượng kèm theo…"
                value={dieuKhoanKhac}
                onChange={(e) => setDieuKhoanKhac(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-text-desc">
            Các ô trên lấy đúng tên nhãn của biểu mẫu giấy đang dùng (
            <code className="text-xs">1. DON HANG HPCONS.xlsx</code>) để đơn in ra khớp bản giấy.
          </p>
        </CardContent>
      </Card>

      {/* Chọn dòng */}
      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          <h2 className="text-h3 text-text-primary">Chọn mặt hàng đưa vào đơn</h2>
          {dongLapDuoc.length === 0 ? (
            <p className="text-sm text-text-desc">
              Không còn dòng nào lập được đơn. Dòng phải được phân bổ cho bạn và còn khối lượng chưa lên đơn.
            </p>
          ) : (
            <div className="flex flex-col gap-(--hp-md-row-gap)">
              {dongLapDuoc.map((d) => {
                const daChon = chon.includes(d.stt);
                return (
                  <div
                    key={d.stt}
                    className="flex flex-col gap-3 rounded-lg border border-border p-3 md:flex-row md:items-end"
                  >
                    <label className="flex flex-1 items-start gap-3">
                      <Checkbox
                        checked={daChon}
                        onCheckedChange={(c) =>
                          setChon((t) => (c ? [...t, d.stt] : t.filter((x) => x !== d.stt)))
                        }
                        aria-label={`Chọn ${d.tenVatLieu}`}
                      />
                      <span className="flex flex-col">
                        <span className="text-sm font-medium text-text-primary">
                          {d.stt}. {d.tenVatLieu}
                        </span>
                        {/* Tên trên ĐƠN khác tên trên phiếu đề nghị thì phải nói rõ — đây là
                            chữ sẽ in ra gửi nhà cung cấp, người lập cần thấy trước khi chốt. */}
                        {tenHangPO[d.stt] &&
                          tenHangPO[d.stt].trim() !== "" &&
                          tenHangPO[d.stt].trim() !== d.tenVatLieu && (
                            <span className="text-xs text-primary">
                              Tên trên đơn: <strong>{tenHangPO[d.stt]}</strong>
                              {dvtPO[d.stt] && dvtPO[d.stt] !== d.donViTinh
                                ? ` · ĐVT ${dvtPO[d.stt]}`
                                : ""}
                            </span>
                          )}
                        <span className="text-xs text-text-desc">
                          Còn chưa lên đơn: {d.khoiLuongChuaLenPO.toLocaleString("vi-VN")} {d.donViTinh}
                          {d.nguoiPhuTrachTen ? ` · phụ trách ${d.nguoiPhuTrachTen}` : ""}
                        </span>
                      </span>
                    </label>

                    {daChon && (
                      <div className="flex flex-wrap gap-3">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`mh-${d.stt}`}>Mã hàng</Label>
                          <Input
                            id={`mh-${d.stt}`}
                            placeholder="VT00027"
                            value={maHang[d.stt] ?? ""}
                            onChange={(e) => setMaHang((t) => ({ ...t, [d.stt]: e.target.value }))}
                            className="w-28"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`ts-${d.stt}`}>Thông số kỹ thuật</Label>
                          <Input
                            id={`ts-${d.stt}`}
                            placeholder={d.quyCach ?? "Mác, tiêu chuẩn, quy cách"}
                            value={thongSo[d.stt] ?? ""}
                            onChange={(e) => setThongSo((t) => ({ ...t, [d.stt]: e.target.value }))}
                            className="w-52"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`md-${d.stt}`}>Mục đích sử dụng</Label>
                          <Input
                            id={`md-${d.stt}`}
                            placeholder={d.mucDichSuDung ?? "Hạng mục nào của công trình"}
                            value={mucDich[d.stt] ?? ""}
                            onChange={(e) => setMucDich((t) => ({ ...t, [d.stt]: e.target.value }))}
                            className="w-52"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`kl-${d.stt}`}>Khối lượng đặt</Label>
                          <Input
                            id={`kl-${d.stt}`}
                            type="number"
                            min={0}
                            max={d.khoiLuongChuaLenPO}
                            placeholder={String(d.khoiLuongChuaLenPO)}
                            value={khoiLuong[d.stt] ?? ""}
                            onChange={(e) => setKhoiLuong((t) => ({ ...t, [d.stt]: e.target.value }))}
                            className="w-32"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`dg-${d.stt}`}>Đơn giá (₫)</Label>
                          <Input
                            id={`dg-${d.stt}`}
                            type="number"
                            min={0}
                            placeholder="0"
                            value={donGia[d.stt] ?? ""}
                            onChange={(e) => setDonGia((t) => ({ ...t, [d.stt]: e.target.value }))}
                            className="w-36"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* --- KHỐI TIỀN: chiết khấu · thuế · điều khoản thanh toán ---
              Cả khối này lưu sang chứng từ riêng tm_donhang_gia, không nằm trong PO. */}
          {chon.length > 0 && (
            <div className="flex flex-col gap-(--hp-md-card-gap) border-t border-divider pt-4">
              <h3 className="text-sm font-semibold text-text-primary">
                Chiết khấu · thuế · thanh toán
              </h3>
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ck">Số tiền CK (₫)</Label>
                  <Input
                    id="ck"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={chietKhau}
                    onChange={(e) => setChietKhau(e.target.value)}
                    className="w-36"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="vat">Thuế suất GTGT (%)</Label>
                  <Input
                    id="vat"
                    type="number"
                    min={0}
                    max={100}
                    value={thueSuat}
                    onChange={(e) => setThueSuat(e.target.value)}
                    className="w-32"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="dk-tt">Điều khoản thanh toán</Label>
                  <Input
                    id="dk-tt"
                    placeholder="Thanh toán 100% trong 30 ngày sau khi nhận đủ hàng"
                    value={dieuKhoanThanhToan}
                    onChange={(e) => setDieuKhoanThanhToan(e.target.value)}
                  />
                </div>
              </div>

              {/* Xem trước đúng trình tự của biểu mẫu giấy */}
              <dl className="ml-auto flex w-full max-w-sm flex-col gap-1 text-sm">
                <DongXemTruoc nhan="Cộng tiền hàng (chưa trừ CK)" giaTri={xemTruocTien.congTienHang} />
                <DongXemTruoc nhan="Số tiền CK" giaTri={xemTruocTien.chietKhau} />
                <DongXemTruoc
                  nhan="Cộng tiền hàng (đã trừ CK)"
                  giaTri={xemTruocTien.congTienHangSauCK}
                />
                <DongXemTruoc
                  nhan={`Tiền thuế GTGT (${xemTruocTien.thueSuatGTGT}%)`}
                  giaTri={xemTruocTien.tienThueGTGT}
                />
                <DongXemTruoc
                  nhan="Tổng tiền thanh toán"
                  giaTri={xemTruocTien.tongThanhToan}
                  tong
                />
              </dl>
              <p className="text-right text-xs italic text-text-desc">
                {docSoTien(xemTruocTien.tongThanhToan)}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-divider pt-4">
            <Button disabled={!hopLe} onClick={luu}>
              <ShoppingCart className="size-4" aria-hidden />
              Chốt đơn hàng
            </Button>
            <Button variant="ghost" onClick={() => router.back()}>
              Quay lại
            </Button>
            {!hopLe && (
              <span className="text-xs text-text-desc">
                Cần chọn nhà cung cấp, ngày giao dự kiến và ít nhất một mặt hàng.
              </span>
            )}
          </div>
          <p className="text-xs text-text-desc">
            Chốt đơn = đẩy PO sang app Kho và app QLDA. Đơn giá, chiết khấu, thuế và điều khoản
            thanh toán lưu riêng ở <code className="text-xs">tm_donhang_gia</code> nên thủ kho
            không đọc được.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

/** Một dòng của khối xem trước tổng tiền ở màn lập đơn. */
function DongXemTruoc({ nhan, giaTri, tong }: { nhan: string; giaTri: number; tong?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        tong ? "border-t border-divider pt-1.5" : ""
      }`}
    >
      <dt className={tong ? "font-bold text-text-primary" : "text-text-desc"}>{nhan}</dt>
      <dd className={tong ? "text-base font-bold text-primary" : "font-medium text-text-primary"}>
        {giaTri.toLocaleString("vi-VN")} ₫
      </dd>
    </div>
  );
}
