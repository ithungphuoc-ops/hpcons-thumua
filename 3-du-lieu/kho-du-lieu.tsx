"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
// Chỉ dùng để SUY RA giai đoạn khi phát thông báo chuyển bước — import type-only
// chiều ngược lại nên không tạo vòng phụ thuộc runtime.
import {
  NHAN_GIAI_DOAN,
  xacDinhGiaiDoan,
  type GiaiDoanMuaHang,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import {
  DE_NGHI_MAU,
  DON_HANG_MAU,
  GIA_DON_HANG_MAU,
  ID_BAO_GIA_GIA_LAP,
  ID_DE_NGHI_GIA_LAP,
  NHA_CUNG_CAP,
  PHIEU_NHAN_MAU,
  BAO_GIA_MAU,
  CONG_NO_MAU,
} from "@/3-du-lieu/du-lieu-mau";
import type {
  DeNghiMuaHang,
  DongDeNghi,
  DongNhanHang,
  DonDatHang,
  GiaDonDatHang,
  NguoiTheoDoi,
  NhaCungCap,
  PhieuNhanHang,
  ThongBaoChuyenBuoc,
  TrangThaiBaoGia,
  XacNhan,
  BaoGia,
  CongNo,
} from "@/3-du-lieu/kieu-du-lieu";

/** Dữ liệu người dùng nhập ở màn giả lập. Mã và STT do kho dữ liệu tự sinh. */
export interface DauVaoDeNghiGiaLap {
  maDuAn: string;
  maHopDongCDT?: string;
  tenCongTrinh: string;
  tieuDe: string;
  nguoiDeNghiTen: string;
  ngayDeNghi: string;
  ngayDuyet: string;
  ngayCanHang: string;
  mucDoUuTien: "binh_thuong" | "gap";
  items: Omit<DongDeNghi, "stt">[];
  /** Người theo dõi chọn sẵn lúc lập phiếu (mục "Người theo dõi" trên phiếu đề nghị).
   *  Người đề nghị luôn được thêm tự động, không cần khai ở đây. */
  nguoiTheoDoi?: Pick<NguoiTheoDoi, "uid" | "ten" | "chucDanh">[];
}

/**
 * Dữ liệu lập một đơn mua hàng mới.
 *
 * 🔴 Cố ý tách làm hai phần vì chúng đi về HAI CHỨNG TỪ khác nhau:
 *  - phần còn lại → `tm_donhang` (mọi vai trò liên quan đọc được)
 *  - `donGia` + `phanTien` → `tm_donhang_gia` (chỉ vai trò được xem giá)
 */
export type DauVaoDonHangMoi = Omit<DonDatHang, "id" | "code" | "trangThai"> & {
  /** Đơn giá theo số thứ tự dòng PO. */
  donGia: Record<number, number>;
  /** Chiết khấu · thuế suất · loại tiền · điều khoản thanh toán — theo mẫu Excel công ty. */
  phanTien?: Pick<
    GiaDonDatHang,
    "loaiTien" | "chietKhau" | "thueSuatGTGT" | "dieuKhoanThanhToan"
  >;
};

const homNay = () => new Date().toISOString().slice(0, 10);

interface GiaTriDuLieu {
  deNghi: DeNghiMuaHang[];
  donHang: DonDatHang[];
  /** ⚠️ Ở bản thật, mảng này chỉ tải được nếu quyền cho phép (collection tm_donhang_gia). */
  giaDonHang: GiaDonDatHang[];
  phieuNhan: PhieuNhanHang[];
  nhaCungCap: NhaCungCap[];
  baoGia: BaoGia[];
  congNo: CongNo[];

  // --- Thao tác ---
  // ⚠️ NHẬT KÝ CHỈNH SỬA (yêu cầu Ban lãnh đạo 07/08/2026): mọi thao tác ghi dữ liệu
  // đều thêm một dòng "ai làm · làm gì · lúc nào" vào `lichSu` của đề nghị liên quan.
  // Hiển thị ở khối "Lịch sử" trang chi tiết đề nghị.
  /**
   * GIẢ LẬP nhận một đề nghị đã duyệt từ Phòng Thi công.
   * Trả về id đề nghị vừa nhận, hoặc chuỗi rỗng nếu đã hết id dự phòng.
   *
   * ⚠️ Ở bản thật KHÔNG có hàm này — đề nghị do Phòng Thi công lập trên HPcore,
   * app Thu mua chỉ đọc. Xem `1-giao-dien/trang/de-nghi-nhan-moi.tsx`.
   */
  themDeNghiGiaLap: (dauVao: DauVaoDeNghiGiaLap) => string;
  phanBoDong: (prId: string, sttDong: number[], nguoiPhuTrachUid: string, nguoiPhanBoTen: string) => void;
  boPhanBoDong: (prId: string, sttDong: number, nguoiThucHien: string) => void;
  /** Lập PO mới từ các dòng đề nghị. Trả về id PO vừa tạo. */
  themDonHang: (dauVao: DauVaoDonHangMoi) => string;
  themPhieuNhan: (phieu: Omit<PhieuNhanHang, "id" | "code" | "lanGiaoThu">) => void;
  doiTrangThaiPhieu: (
    phieuId: string,
    trangThai: PhieuNhanHang["trangThai"],
    nguoiThucHien?: string,
  ) => void;
  xacNhanKho: (poId: string, nguoi: XacNhan) => void;
  xacNhanTruongBP: (poId: string, nguoi: XacNhan) => void;
  /** Kéo thả ① Tiếp nhận → ② Yêu cầu báo giá: tạo bảng báo giá đang thu thập cho đề nghị. */
  taoBaoGiaGiaLap: (prId: string, nguoiThucHien: string) => string | null;
  /** Kéo thả ② → ③: chuyển mọi bảng báo giá của đề nghị từ trạng thái `tu` sang `sang`. */
  doiTrangThaiBaoGiaTheoDeNghi: (
    prId: string,
    tu: TrangThaiBaoGia,
    sang: TrangThaiBaoGia,
    nguoiThucHien: string,
  ) => void;
  /** Bước ③ → ④: chốt nhà cung cấp cho một bảng báo giá đã so sánh. */
  chonNCCChoBaoGia: (bgId: string, nccId: string, tenNCC: string, nguoiThucHien: string) => void;
  /** Kéo thả vào cột Thất bại: đóng dở đề nghị, ghi lịch sử. */
  dongDoDeNghi: (prId: string, nguoiThucHien: string) => void;

  // --- Người theo dõi ---
  /** Thêm một người vào danh sách theo dõi đề nghị. Thêm trùng thì bỏ qua. */
  themNguoiTheoDoi: (
    prId: string,
    nguoi: Pick<NguoiTheoDoi, "uid" | "ten" | "chucDanh">,
    nguoiThemTen: string,
  ) => void;
  /** Bỏ một người khỏi danh sách theo dõi đề nghị. */
  boNguoiTheoDoi: (prId: string, uid: string) => void;

  /**
   * Trưởng bộ phận bấm "Chuyển tiếp": bàn giao đề nghị cho các nhân viên đã được
   * phân bổ, để họ làm tiếp các bước sau (lập đơn, chọn NCC...).
   * Trả về danh sách tên đã gửi tới — rỗng nghĩa là chưa phân bổ cho ai.
   */
  chuyenTiepChoNhanVien: (prId: string, nguoiChuyenTen: string, loiNhan?: string) => string[];

  // --- Thông báo chuyển bước + tiếp nhận công tác ---
  /** Thông báo chuyển bước, mới nhất đứng đầu (tự sinh khi đề nghị đổi bước). */
  thongBao: ThongBaoChuyenBuoc[];
  /** Đánh dấu toàn bộ thông báo là đã đọc — gọi khi người dùng mở chuông. */
  danhDauDaDocThongBao: () => void;
  /** Bấm "Nhận công tác": ghi người tiếp nhận vào thông báo + nhật ký đề nghị. */
  nhanCongTac: (thongBaoId: string, nguoi: { uid: string; ten: string }) => void;
}

const Context = createContext<GiaTriDuLieu | null>(null);

/**
 * Kho dữ liệu chạy thử — giữ trong bộ nhớ để mọi thao tác (phân bổ, ghi nhận hàng,
 * xác nhận hoàn thành) đều hoạt động thật khi trình diễn. Tải lại trang là về dữ liệu gốc.
 *
 * Khi nối Firebase: thay các hàm bên dưới bằng lệnh ghi Firestore, giao diện giữ nguyên.
 */
export function DuLieuProvider({ children }: { children: ReactNode }) {
  const [deNghi, setDeNghi] = useState<DeNghiMuaHang[]>(DE_NGHI_MAU);
  const [donHang, setDonHang] = useState<DonDatHang[]>(DON_HANG_MAU);
  const [giaDonHang, setGiaDonHang] = useState<GiaDonDatHang[]>(GIA_DON_HANG_MAU);
  const [phieuNhan, setPhieuNhan] = useState<PhieuNhanHang[]>(PHIEU_NHAN_MAU);
  const [baoGia, setBaoGia] = useState<BaoGia[]>(BAO_GIA_MAU);
  const [thongBao, setThongBao] = useState<ThongBaoChuyenBuoc[]>([]);

  // Đọc danh sách hiện có khi sinh mã mới, không cần đưa state vào deps.
  const donHangRef = useRef(donHang);
  donHangRef.current = donHang;
  const deNghiRef = useRef(deNghi);
  deNghiRef.current = deNghi;
  const baoGiaRef = useRef(baoGia);
  baoGiaRef.current = baoGia;
  const phieuNhanRef = useRef(phieuNhan);
  phieuNhanRef.current = phieuNhan;
  const thongBaoRef = useRef(thongBao);
  thongBaoRef.current = thongBao;

  // ------------------------------------------------------------
  // THÔNG BÁO CHUYỂN BƯỚC — theo dõi giai đoạn SUY RA của từng đề nghị.
  // Giai đoạn không lưu trong dữ liệu (nguyên tắc ở 2-quy-trinh/giai-doan-mua-hang)
  // nên cứ mỗi lần dữ liệu đổi thì so bước trước/sau: khác là báo. Nhờ vậy bắt được
  // MỌI đường chuyển bước — kéo thả, chọn NCC, lập đơn, ghi phiếu nhận, xác nhận...
  // ------------------------------------------------------------
  const giaiDoanTruocRef = useRef<Map<string, GiaiDoanMuaHang> | null>(null);
  const soThuTuThongBao = useRef(0);
  useEffect(() => {
    const hienTai = new Map(
      deNghi.map((dn) => [dn.id, xacDinhGiaiDoan(dn, donHang, baoGia, phieuNhan)] as const),
    );
    const truoc = giaiDoanTruocRef.current;
    giaiDoanTruocRef.current = hienTai;
    if (!truoc) return; // Lần dựng đầu — dữ liệu mẫu không phải "vừa chuyển bước"

    const moi: ThongBaoChuyenBuoc[] = [];
    for (const dn of deNghi) {
      const buocMoi = hienTai.get(dn.id);
      const buocCu = truoc.get(dn.id);
      if (!buocMoi || buocCu === buocMoi) continue;
      soThuTuThongBao.current += 1;
      moi.push({
        id: `tb-${soThuTuThongBao.current}`,
        prId: dn.id,
        prCode: dn.code,
        tieuDe: dn.tieuDe,
        tuBuoc: buocCu, // trống = đề nghị mới vào bảng
        denBuoc: buocMoi,
        thoiDiem: new Date().toISOString(),
        guiToi: (dn.nguoiTheoDoi ?? []).map((n) => n.ten),
        daDoc: false,
      });
    }
    // Giữ tối đa 30 thông báo gần nhất — đủ cho một phiên trình diễn.
    if (moi.length > 0) setThongBao((truocDo) => [...moi, ...truocDo].slice(0, 30));
  }, [deNghi, donHang, baoGia, phieuNhan]);

  /** Ghi một dòng nhật ký vào lịch sử của đề nghị — dùng cho MỌI thao tác sửa dữ liệu. */
  const ghiLichSuDeNghi = useCallback(
    (prId: string, nguoiThucHien: string, hanhDong: string) => {
      setDeNghi((truoc) =>
        truoc.map((dn) =>
          dn.id !== prId
            ? dn
            : { ...dn, lichSu: [...dn.lichSu, { thoiDiem: homNay(), nguoiThucHien, hanhDong }] },
        ),
      );
    },
    [],
  );

  const themDeNghiGiaLap = useCallback((dauVao: DauVaoDeNghiGiaLap) => {
    const hienCo = deNghiRef.current;

    // Lấy id dự phòng đầu tiên chưa dùng — hosting tĩnh chỉ mở được địa chỉ đã sinh sẵn.
    const id = ID_DE_NGHI_GIA_LAP.find((x) => !hienCo.some((dn) => dn.id === x));
    if (!id) return "";

    // Số thứ tự chạy THEO DỰ ÁN, đúng quy tắc mã hồ sơ Thông báo 09/2026.
    const soHienCo = hienCo.filter((dn) => dn.maDuAn === dauVao.maDuAn).length;
    const code = `${dauVao.maDuAn}-PR-${String(soHienCo + 1).padStart(3, "0")}`;

    const moi: DeNghiMuaHang = {
      id,
      code,
      maDuAn: dauVao.maDuAn,
      maHopDongCDT: dauVao.maHopDongCDT || undefined,
      tenCongTrinh: dauVao.tenCongTrinh,
      tieuDe: dauVao.tieuDe,
      // Ver 1 chỉ nhận đề nghị từ Phòng Thi công (chỉ đạo Ban lãnh đạo 05/08/2026).
      phongBanNguon: "thi_cong",
      nguoiDeNghiUid: "u-tc",
      nguoiDeNghiTen: dauVao.nguoiDeNghiTen,
      ngayDeNghi: dauVao.ngayDeNghi,
      ngayDuyet: dauVao.ngayDuyet,
      ngayCanHang: dauVao.ngayCanHang,
      mucDoUuTien: dauVao.mucDoUuTien,
      // Đề nghị vào app luôn ở trạng thái ĐÃ DUYỆT — app Thu mua không duyệt đề nghị.
      trangThai: "da_duyet",
      items: dauVao.items.map((d, i) => ({ ...d, stt: i + 1 })),
      // Người đề nghị mặc định theo dõi tiến trình đề nghị của chính mình,
      // rồi tới những người được chọn thêm ở mục "Người theo dõi" của phiếu.
      nguoiTheoDoi: [
        {
          uid: "u-tc",
          ten: dauVao.nguoiDeNghiTen,
          chucDanh: "Chỉ huy trưởng công trình",
          nguoiThemTen: dauVao.nguoiDeNghiTen,
          thoiDiemThem: dauVao.ngayDeNghi,
        },
        ...(dauVao.nguoiTheoDoi ?? [])
          // Bỏ trùng với người đề nghị đã thêm ở trên.
          .filter((n) => n.uid !== "u-tc")
          .map((n) => ({
            ...n,
            nguoiThemTen: dauVao.nguoiDeNghiTen,
            thoiDiemThem: dauVao.ngayDeNghi,
          })),
      ],
      lichSu: [
        { thoiDiem: dauVao.ngayDeNghi, nguoiThucHien: dauVao.nguoiDeNghiTen, hanhDong: "Tạo đề nghị" },
        { thoiDiem: dauVao.ngayDuyet, nguoiThucHien: "Ban chỉ huy", hanhDong: "Duyệt đề nghị" },
        {
          thoiDiem: homNay(),
          nguoiThucHien: "HPcore",
          hanhDong: "Chuyển sang Phòng Thu mua",
          ghiChu: "Bản chạy thử: đề nghị này do công cụ giả lập tạo ra",
        },
      ],
    };

    setDeNghi((truoc) => [...truoc, moi]);
    return id;
  }, []);

  const phanBoDong = useCallback(
    (prId: string, sttDong: number[], nguoiPhuTrachUid: string, nguoiPhanBoTen: string) => {
      const ten =
        {
          "u-tm1": "Nguyễn Văn A",
          "u-tm2": "Trần Văn C",
          "u-tm3": "Lê Thị D",
        }[nguoiPhuTrachUid] ?? nguoiPhuTrachUid;

      setDeNghi((truoc) =>
        truoc.map((dn) =>
          dn.id !== prId
            ? dn
            : {
                ...dn,
                items: dn.items.map((d) =>
                  sttDong.includes(d.stt)
                    ? {
                        ...d,
                        nguoiPhuTrachUid,
                        nguoiPhuTrachTen: ten,
                        nguoiPhanBoTen,
                        thoiDiemPhanBo: homNay(),
                      }
                    : d,
                ),
                // Nhật ký: ghi trong CÙNG lần cập nhật để dữ liệu và lịch sử không lệch nhau
                lichSu: [
                  ...dn.lichSu,
                  {
                    thoiDiem: homNay(),
                    nguoiThucHien: nguoiPhanBoTen,
                    hanhDong: `Phân bổ dòng ${sttDong.join(", ")} cho ${ten}`,
                  },
                ],
              },
        ),
      );
    },
    [],
  );

  const boPhanBoDong = useCallback((prId: string, stt: number, nguoiThucHien: string) => {
    setDeNghi((truoc) =>
      truoc.map((dn) =>
        dn.id !== prId
          ? dn
          : {
              ...dn,
              items: dn.items.map((d) =>
                d.stt === stt
                  ? {
                      ...d,
                      nguoiPhuTrachUid: undefined,
                      nguoiPhuTrachTen: undefined,
                      nguoiPhanBoTen: undefined,
                      thoiDiemPhanBo: undefined,
                    }
                  : d,
              ),
              lichSu: [
                ...dn.lichSu,
                { thoiDiem: homNay(), nguoiThucHien, hanhDong: `Bỏ phân bổ dòng ${stt}` },
              ],
            },
      ),
    );
  }, []);

  const themDonHang = useCallback(
    (dauVao: DauVaoDonHangMoi) => {
      const { donGia, phanTien, ...po } = dauVao;
      // Số thứ tự PO chạy theo DỰ ÁN, đúng quy tắc mã hồ sơ Thông báo 09/2026.
      const soHienCo = donHangRef.current.filter((p) => p.maDuAn === po.maDuAn).length;
      const stt = String(soHienCo + 1).padStart(3, "0");
      const code = `${po.maDuAn}-PO-${stt}`;
      const id = `po-moi-${po.maDuAn}-${stt}`;

      setDonHang((truoc) => [...truoc, { ...po, id, code, trangThai: "da_chot" }]);
      setGiaDonHang((truoc) => [
        ...truoc,
        {
          poId: id,
          poCode: code,
          maDuAn: po.maDuAn,
          lines: po.items.map((d) => ({ sttDong: d.sttDong, donGia: donGia[d.sttDong] ?? 0 })),
          // Chiết khấu / thuế / điều khoản thanh toán đi cùng GIÁ, không đi cùng PO —
          // nếu để trong PO thì cho thủ kho đọc PO là hở luôn phần thương mại.
          ...phanTien,
        },
      ]);
      // Không ghi tên NCC vào nhật ký — lịch sử đề nghị hiện cho cả vai trò không được xem NCC.
      ghiLichSuDeNghi(po.prId, po.nguoiPhuTrachTen, `Lập và chốt đơn hàng ${code}`);
      return id;
    },
    [ghiLichSuDeNghi],
  );

  const themPhieuNhan = useCallback(
    (phieu: Omit<PhieuNhanHang, "id" | "code" | "lanGiaoThu">) => {
      const lanGiaoThu = phieuNhanRef.current.filter((p) => p.poId === phieu.poId).length + 1;
      const id = `grn-${phieu.poId}-${lanGiaoThu}`;
      const code = `${phieu.poCode}-DO${String(lanGiaoThu).padStart(2, "0")}`;
      setPhieuNhan((truoc) => [...truoc, { ...phieu, id, code, lanGiaoThu }]);
      // PO chuyển sang "đang giao" ngay khi có phiếu nhận đầu tiên
      setDonHang((truoc) =>
        truoc.map((po) =>
          po.id === phieu.poId && po.trangThai === "da_chot" ? { ...po, trangThai: "dang_giao" } : po,
        ),
      );
      const po = donHangRef.current.find((p) => p.id === phieu.poId);
      if (po) {
        ghiLichSuDeNghi(po.prId, phieu.nguoiNhanTen, `Ghi phiếu nhận hàng lần ${lanGiaoThu} — ${phieu.poCode}`);
      }
    },
    [ghiLichSuDeNghi],
  );

  const doiTrangThaiPhieu = useCallback(
    (phieuId: string, trangThai: PhieuNhanHang["trangThai"], nguoiThucHien?: string) => {
      setPhieuNhan((truoc) => truoc.map((p) => (p.id === phieuId ? { ...p, trangThai } : p)));
      if (nguoiThucHien) {
        const phieu = phieuNhanRef.current.find((p) => p.id === phieuId);
        const po = phieu && donHangRef.current.find((p) => p.id === phieu.poId);
        if (phieu && po) {
          const nhan =
            trangThai === "da_nhap_kho"
              ? "Duyệt nhập kho"
              : trangThai === "tu_choi_nhan"
                ? "Từ chối nhận"
                : "Chuyển chờ kiểm tra";
          ghiLichSuDeNghi(po.prId, nguoiThucHien, `${nhan} phiếu ${phieu.code}`);
        }
      }
    },
    [ghiLichSuDeNghi],
  );

  const xacNhanKho = useCallback(
    (poId: string, nguoi: XacNhan) => {
      setDonHang((truoc) =>
        truoc.map((po) =>
          po.id === poId ? { ...po, xacNhanKho: nguoi, trangThai: "cho_xac_nhan_hoan_thanh" } : po,
        ),
      );
      const po = donHangRef.current.find((p) => p.id === poId);
      if (po) ghiLichSuDeNghi(po.prId, nguoi.ten, `Thủ kho xác nhận đã nhận đủ — ${po.code}`);
    },
    [ghiLichSuDeNghi],
  );

  const xacNhanTruongBP = useCallback(
    (poId: string, nguoi: XacNhan) => {
      setDonHang((truoc) =>
        truoc.map((po) => (po.id === poId ? { ...po, xacNhanTruongBP: nguoi, trangThai: "hoan_thanh" } : po)),
      );
      const po = donHangRef.current.find((p) => p.id === poId);
      if (po) {
        ghiLichSuDeNghi(po.prId, nguoi.ten, `Trưởng bộ phận xác nhận hoàn thành — ${po.code}, chuyển hồ sơ Kế toán`);
      }
    },
    [ghiLichSuDeNghi],
  );

  const taoBaoGiaGiaLap = useCallback(
    (prId: string, nguoiThucHien: string) => {
      const dn = deNghiRef.current.find((d) => d.id === prId);
      if (!dn) return null;
      const daDung = new Set(baoGiaRef.current.map((b) => b.id));
      const id = ID_BAO_GIA_GIA_LAP.find((x) => !daDung.has(x));
      if (!id) return null;

      const soHienCo = baoGiaRef.current.filter((b) => b.code.startsWith(`${dn.maDuAn}-BG-`)).length;
      const code = `${dn.maDuAn}-BG-${String(soHienCo + 1).padStart(3, "0")}`;
      const ngay = homNay();

      const moi: BaoGia = {
        id,
        code,
        prId,
        prCode: dn.code,
        tieuDe: `Báo giá ${dn.tieuDe}`,
        trangThai: "dang_thu_thap",
        // Mỗi dòng đề nghị thành một dòng cần hỏi giá; cột NCC trống chờ giá gửi về.
        items: dn.items.map((d) => ({
          id: `bg-${id}-${d.stt}`,
          tenVatLieu: d.tenVatLieu,
          donViTinh: d.donViTinh,
          khoiLuong: d.khoiLuongDeNghi,
          baoGiaNCC: [],
        })),
        hanNop: dn.ngayCanHang,
        ngayTao: ngay,
        ngayCapNhat: ngay,
      };
      setBaoGia((truoc) => [...truoc, moi]);
      ghiLichSuDeNghi(prId, nguoiThucHien, `Tạo bảng báo giá ${code}, gửi nhà cung cấp chào giá`);
      return id;
    },
    [ghiLichSuDeNghi],
  );

  const doiTrangThaiBaoGiaTheoDeNghi = useCallback(
    (prId: string, tu: TrangThaiBaoGia, sang: TrangThaiBaoGia, nguoiThucHien: string) => {
      const ngay = homNay();
      setBaoGia((truoc) =>
        truoc.map((b) => {
          if (b.prId !== prId || b.trangThai !== tu) return b;
          // Sang bước "đã so sánh" mà dòng nào chưa có giá thì điền GIÁ MẪU — mô phỏng
          // NCC gửi giá về, để bảng so sánh và nút "Chọn NCC này" bấm thử được.
          // Giá tính theo công thức cố định (không ngẫu nhiên), chỉ dùng khi chạy thử.
          const items =
            sang === "da_so_sanh"
              ? b.items.map((d, iDong) =>
                  d.baoGiaNCC.length > 0
                    ? d
                    : {
                        ...d,
                        baoGiaNCC: NHA_CUNG_CAP.slice(0, 3).map((ncc, k) => ({
                          nccId: ncc.id,
                          tenNCC: ncc.ten,
                          donGia: 50_000 + iDong * 10_000 + k * 2_500,
                          thoiGianGiao: 2 + k,
                        })),
                      },
                )
              : b.items;
          return { ...b, items, trangThai: sang, ngayCapNhat: ngay };
        }),
      );
      if (sang === "da_so_sanh") {
        ghiLichSuDeNghi(prId, nguoiThucHien, "Chốt đủ báo giá, chuyển sang so sánh và trình duyệt");
      }
    },
    [ghiLichSuDeNghi],
  );

  const chonNCCChoBaoGia = useCallback(
    (bgId: string, nccId: string, tenNCC: string, nguoiThucHien: string) => {
      const ngay = homNay();
      setBaoGia((truoc) =>
        truoc.map((b) =>
          b.id === bgId
            ? { ...b, trangThai: "da_chon_ncc", nccDaChonId: nccId, nccDaChonTen: tenNCC, ngayCapNhat: ngay }
            : b,
        ),
      );
      const bg = baoGiaRef.current.find((b) => b.id === bgId);
      // Không ghi tên NCC vào nhật ký — lịch sử đề nghị hiện cho cả vai trò không được xem NCC.
      if (bg) ghiLichSuDeNghi(bg.prId, nguoiThucHien, `Chốt nhà cung cấp cho bảng báo giá ${bg.code}`);
    },
    [ghiLichSuDeNghi],
  );

  const danhDauDaDocThongBao = useCallback(() => {
    setThongBao((truoc) =>
      truoc.some((t) => !t.daDoc) ? truoc.map((t) => (t.daDoc ? t : { ...t, daDoc: true })) : truoc,
    );
  }, []);

  const nhanCongTac = useCallback(
    (thongBaoId: string, nguoi: { uid: string; ten: string }) => {
      const tb = thongBaoRef.current.find((t) => t.id === thongBaoId);
      if (!tb || tb.tiepNhan) return; // đã có người nhận thì thôi

      const tiepNhan: XacNhan = { ...nguoi, thoiDiem: new Date().toISOString() };
      setThongBao((truoc) => truoc.map((t) => (t.id === thongBaoId ? { ...t, tiepNhan } : t)));

      // Ghi cả vào nhật ký đề nghị — bàn giao phải có dấu vết hai chiều.
      const nhan = NHAN_GIAI_DOAN[tb.denBuoc as GiaiDoanMuaHang]?.nhan ?? tb.denBuoc;
      ghiLichSuDeNghi(tb.prId, nguoi.ten, `Tiếp nhận công tác bước "${nhan}"`);
    },
    [ghiLichSuDeNghi],
  );

  const dongDoDeNghi = useCallback((prId: string, nguoiThucHien: string) => {
    setDeNghi((truoc) =>
      truoc.map((dn) =>
        dn.id !== prId
          ? dn
          : {
              ...dn,
              trangThai: "dong_do",
              lichSu: [
                ...dn.lichSu,
                { thoiDiem: homNay(), nguoiThucHien, hanhDong: "Đóng dở đề nghị" },
              ],
            },
      ),
    );
  }, []);

  // ------------------------------------------------------------
  // NGƯỜI THEO DÕI
  // Nhật ký ghi trong CÙNG lần cập nhật (như `phanBoDong`) để danh sách và
  // lịch sử không bao giờ lệch nhau nếu một trong hai lần ghi thất bại.
  // ------------------------------------------------------------
  const themNguoiTheoDoi = useCallback(
    (
      prId: string,
      nguoi: Pick<NguoiTheoDoi, "uid" | "ten" | "chucDanh">,
      nguoiThemTen: string,
    ) => {
      setDeNghi((truoc) =>
        truoc.map((dn) => {
          if (dn.id !== prId) return dn;
          const ds = dn.nguoiTheoDoi ?? [];
          if (ds.some((n) => n.uid === nguoi.uid)) return dn; // đã có thì thôi
          return {
            ...dn,
            nguoiTheoDoi: [...ds, { ...nguoi, nguoiThemTen, thoiDiemThem: homNay() }],
            lichSu: [
              ...dn.lichSu,
              {
                thoiDiem: homNay(),
                nguoiThucHien: nguoiThemTen,
                hanhDong: `Thêm ${nguoi.ten} vào danh sách theo dõi`,
              },
            ],
          };
        }),
      );
    },
    [],
  );

  const boNguoiTheoDoi = useCallback((prId: string, uid: string) => {
    setDeNghi((truoc) =>
      truoc.map((dn) => {
        if (dn.id !== prId) return dn;
        const ds = dn.nguoiTheoDoi ?? [];
        const bi = ds.find((n) => n.uid === uid);
        if (!bi) return dn;
        return {
          ...dn,
          nguoiTheoDoi: ds.filter((n) => n.uid !== uid),
          lichSu: [
            ...dn.lichSu,
            {
              thoiDiem: homNay(),
              nguoiThucHien: bi.nguoiThemTen,
              hanhDong: `Bỏ ${bi.ten} khỏi danh sách theo dõi`,
            },
          ],
        };
      }),
    );
  }, []);

  /**
   * CHUYỂN TIẾP — trưởng bộ phận bàn giao việc cho nhân viên đã phân bổ.
   *
   * 🔴 Không đụng tới giai đoạn của đề nghị. Giai đoạn vẫn suy ra từ chứng từ
   * (nguyên tắc ở `2-quy-trinh/giai-doan-mua-hang`); chuyển tiếp chỉ là BÀN GIAO
   * NGƯỜI LÀM, không phải bước nghiệp vụ mới. Vì vậy `tuBuoc` = `denBuoc`.
   *
   * Dùng lại đúng cơ chế thông báo + nút "Nhận công tác" đã có, nên nhân viên
   * nhận việc theo cùng một thói quen thao tác.
   */
  const chuyenTiepChoNhanVien = useCallback(
    (prId: string, nguoiChuyenTen: string, loiNhan?: string) => {
      const dn = deNghiRef.current.find((x) => x.id === prId);
      if (!dn) return [];

      // Người nhận = các nhân viên đang phụ trách ít nhất một dòng, không trùng lặp.
      const nguoiNhan = [
        ...new Set(
          dn.items.map((d) => d.nguoiPhuTrachTen).filter((x): x is string => Boolean(x)),
        ),
      ];
      if (nguoiNhan.length === 0) return [];

      const buocHienTai = xacDinhGiaiDoan(
        dn,
        donHangRef.current,
        baoGiaRef.current,
        phieuNhanRef.current,
      );

      soThuTuThongBao.current += 1;
      setThongBao((truoc) =>
        [
          {
            id: `tb-ct-${soThuTuThongBao.current}`,
            prId: dn.id,
            prCode: dn.code,
            tieuDe: dn.tieuDe,
            tuBuoc: buocHienTai,
            denBuoc: buocHienTai,
            thoiDiem: new Date().toISOString(),
            guiToi: nguoiNhan,
            daDoc: false,
            laChuyenTiep: true,
            loiNhan: loiNhan?.trim() || undefined,
          },
          ...truoc,
        ].slice(0, 30),
      );

      ghiLichSuDeNghi(
        prId,
        nguoiChuyenTen,
        `Chuyển tiếp cho ${nguoiNhan.join(", ")}${loiNhan?.trim() ? ` — “${loiNhan.trim()}”` : ""}`,
      );
      return nguoiNhan;
    },
    [ghiLichSuDeNghi],
  );

  const value = useMemo<GiaTriDuLieu>(
    () => ({
      deNghi,
      donHang,
      giaDonHang,
      phieuNhan,
      nhaCungCap: NHA_CUNG_CAP,
      baoGia,
      congNo: CONG_NO_MAU,
      themDeNghiGiaLap,
      phanBoDong,
      boPhanBoDong,
      themDonHang,
      themPhieuNhan,
      doiTrangThaiPhieu,
      xacNhanKho,
      xacNhanTruongBP,
      taoBaoGiaGiaLap,
      doiTrangThaiBaoGiaTheoDeNghi,
      chonNCCChoBaoGia,
      dongDoDeNghi,
      themNguoiTheoDoi,
      boNguoiTheoDoi,
      chuyenTiepChoNhanVien,
      thongBao,
      danhDauDaDocThongBao,
      nhanCongTac,
    }),
    [
      deNghi,
      donHang,
      giaDonHang,
      phieuNhan,
      baoGia,
      themDeNghiGiaLap,
      phanBoDong,
      boPhanBoDong,
      themDonHang,
      themPhieuNhan,
      doiTrangThaiPhieu,
      xacNhanKho,
      xacNhanTruongBP,
      taoBaoGiaGiaLap,
      doiTrangThaiBaoGiaTheoDeNghi,
      chonNCCChoBaoGia,
      dongDoDeNghi,
      themNguoiTheoDoi,
      boNguoiTheoDoi,
      chuyenTiepChoNhanVien,
      thongBao,
      danhDauDaDocThongBao,
      nhanCongTac,
    ],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDuLieu(): GiaTriDuLieu {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useDuLieu phải nằm trong <DuLieuProvider>.");
  return ctx;
}

/** Mảng dòng nhận hàng rỗng để khởi tạo form — tránh tạo lại mỗi lần render. */
export const DONG_NHAN_RONG: DongNhanHang[] = [];
