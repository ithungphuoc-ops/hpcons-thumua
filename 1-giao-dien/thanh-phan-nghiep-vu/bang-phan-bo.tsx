"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeftRight,
  MoreHorizontal,
  Plus,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/1-giao-dien/nen-tang-ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/1-giao-dien/nen-tang-ui/table";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { TOI_DA_O_BAO_GIA } from "@/2-quy-trinh/bao-gia-dinh-kem";
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  coLocTheoPhanViec,
  duocChuyenViecDong,
  sttDongDuocXem,
} from "@/4-phan-quyen/quyen-theo-ho-so";
import { tinhTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import { nhanAnToan, NHAN_TRANG_THAI_DONG } from "@/2-quy-trinh/trang-thai";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * Lớp chung cho mọi mục trong menu ⋯ của bảng này.
 *
 * 🔴 Ban lãnh đạo 16/08/2026 khoanh đỏ menu ⋯ vì hai mục cao thấp khác nhau. Lớp gốc của
 * thư viện chỉ có `py-1` và KHÔNG đặt chiều cao tối thiểu, nên mục xuống 2 dòng cao 48px
 * còn mục 1 dòng chỉ 28px.
 *
 * · `min-h-11` = 44px — vùng chạm tối thiểu theo Design System V1.1, đồng thời làm mọi
 *   mục cao bằng nhau kể cả khi nhãn dài ngắn khác nhau.
 * · `whitespace-nowrap` — nhãn không xuống dòng nữa, đi cùng `w-auto` của menu.
 *
 * ⚠️ Không sửa được thẳng trong `nen-tang-ui/dropdown-menu.tsx` vì đó là thư viện ngoài
 * (quy ước CLAUDE.md mục 3.4b), nên để hằng số ở đây cho hai mục dùng chung — sửa một chỗ
 * là cả menu đổi theo, không phải chép class ra từng mục rồi lệch nhau.
 */
const LOP_MUC_MENU = "min-h-11 whitespace-nowrap";

/**
 * Nhãn ngắn cho nút phân bổ.
 *
 * ⚠️ KHÔNG được dựa vào việc chức danh có ngoặc đơn. Chức danh mẫu là "Nhân viên Thu mua
 * (TM2)" nên cắt trong ngoặc ra "TM2" rất gọn — nhưng chức danh THẬT của người thật chỉ
 * ghi "Nhân viên", không có ngoặc nào. Bám vào ngoặc là nút hiện nhãn rỗng.
 *
 * Nên: có ngoặc thì dùng, không có thì lấy chữ cái đầu của tên (Trần Văn C → TVC).
 */
function nhanNgan(ten: string, chucDanh: string): string {
  const trongNgoac = chucDanh.match(/\(([^)]+)\)/)?.[1];
  if (trongNgoac) return trongNgoac;
  return ten
    .trim()
    .split(/\s+/)
    .map((t) => t[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
}

/**
 * Yêu cầu trưởng bộ phận đặt ra lúc giao việc. Không có yêu cầu nào thì không hiện gì —
 * đừng để một khung rỗng chiếm chỗ ở mọi dòng.
 *
 * Dùng chung cho cả bảng Desktop và Card List Mobile: một chỗ sửa, hai nơi đổi theo.
 */
function YeuCauGiaoViec({ soBaoGia, ghiChu }: { soBaoGia?: number; ghiChu?: string }) {
  if (!soBaoGia && !ghiChu) return null;
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-primary-bg px-2 py-1">
      {soBaoGia ? (
        <span className="text-xs font-medium text-primary">
          Yêu cầu lấy {soBaoGia} báo giá
        </span>
      ) : null}
      {ghiChu ? <span className="text-xs text-text-secondary">{ghiChu}</span> : null}
    </div>
  );
}

/**
 * M3 — BẢNG PHÂN BỔ của Trưởng bộ phận thu mua.
 * Màn hình MỚI, bản thumua-next cũ không có.
 *
 * Giá trị: thấy ngay dòng nào CHƯA PHÂN BỔ và dòng nào ĐÃ PHÂN MÀ CHƯA LÊN PO —
 * đây là chỗ hay bỏ sót nhất trong mua hàng thực tế.
 */
export function BangPhanBo({
  deNghi,
  dangOBuocPhanBo = true,
  hoSoDaDong = false,
}: {
  deNghi: DeNghiMuaHang;
  /**
   * ★ CÓ CÒN Ở BƯỚC PHÂN BỔ KHÔNG — Ban lãnh đạo 15/08/2026: *"sao ở bước 2 sau khi đã giao
   * việc cho nhân viên rồi mà quy trình phân bổ này vẫn còn"*.
   *
   * `false` = đã qua bước ①: bảng chuyển sang chế độ **chỉ xem** — bỏ ô tích chọn dòng và
   * thanh "phân cho ai", chỉ giữ bảng để tra ai đang phụ trách phần nào.
   *
   * 🔴 Vì sao đáng ẩn: phân bổ là việc CỦA BƯỚC ①. Sang bước ② mà công cụ vẫn bày ra thì
   * vừa rối vừa dễ bấm nhầm — người đang đi hỏi giá vô tình phân lại việc cho người khác.
   *
   * ⚠️ Trang gọi vẫn mở lại công cụ khi CÒN DÒNG CHƯA PHÂN BỔ (thêm vật tư mới ở bước sau),
   * vì lúc đó thật sự cần phân bổ chứ không phải bày cho có.
   */
  dangOBuocPhanBo?: boolean;
  /**
   * ★ HỒ SƠ ĐÃ ĐÓNG (hoàn thành hoặc đóng dở) — Ban lãnh đạo 15/08/2026: *"sao hoàn thành
   * rồi mà vẫn được thêm vật tư"*.
   *
   * `true` = khóa mọi thao tác đổi nội dung: thêm vật tư, xóa vật tư, phân bổ lại.
   *
   * 🔴 Chốt chặn thật nằm ở `suaMatHangDeNghi` (tầng dữ liệu); cờ này chỉ để KHÔNG BÀY nút ra.
   * Bày nút rồi bấm vào mới báo lỗi là bắt người dùng phát hiện luật bằng cách gặp lỗi.
   */
  hoSoDaDong?: boolean;
}) {
  const { donHang, phieuNhan, phanBoDong, boPhanBoDong, chuyenViecDong, suaMatHangDeNghi, cauHinh } =
    useDuLieu();
  /**
   * Dòng vật tư MỚI đang gõ ở cuối bảng — `null` là chưa bấm nút thêm.
   *
   * 🔴 Ban lãnh đạo 13/08/2026: *"tối giản mục thêm bớt này đi, chỉ cần thêm dấu × ở đầu
   * tên mỗi loại vật tư để xóa, và thêm hình cây bút ở cuối danh sách để thêm vật tư mới"*.
   * Trước đó là một hộp thoại 455 dòng cho việc mà một dấu × và một dòng nhập là đủ.
   */
  const [dongMoi, setDongMoi] = useState<{ ten: string; kl: string; dvt: string } | null>(null);
  /** Dòng đang hỏi xóa — hộp xác nhận nói rõ xóa cái gì. */
  const [hoiXoa, setHoiXoa] = useState<{ stt: number; ten: string } | null>(null);
  const { nguoiDung, quyen, danhSachTaiKhoan } = useNguoiDung();
  const [chon, setChon] = useState<number[]>([]);

  /**
   * 🔴 Lấy từ danh sách TÀI KHOẢN ĐĂNG NHẬP ĐƯỢC, không lấy từ danh bạ nhân sự.
   *
   * Danh bạ có cả người không có tài khoản; phân bổ cho họ là việc treo vĩnh viễn —
   * không ai nhận công tác, không ai lập được đơn, và dòng đó **biến mất khỏi lịch của
   * mọi người** (lịch lọc theo mã người, còn cảnh báo "Chờ phân bổ" chỉ hiện khi dòng
   * CHƯA có người). Việc rơi vào vùng mù, chỉ vỡ ra khi trễ ngày cần hàng.
   *
   * ⚠️ Trước 12/08/2026 danh sách này tính MỘT LẦN lúc nạp tệp từ mảng cứng. Nay đọc từ
   * máy chủ nên phải tính trong thân component — để nguyên cách cũ thì bảng phân bổ
   * **trống trơn vĩnh viễn**, trưởng bộ phận không giao được việc cho ai.
   *
   * 📌 Trưởng bộ phận KHÔNG có trong danh sách: chị ấy *phân bổ*, không *nhận phần việc*.
   */
  const nhanVienThuMua = useMemo(
    () =>
      danhSachTaiKhoan
        .filter((n) => n.chucNang === "nhan_vien_thu_mua")
        .map((n) => ({
          uid: n.uid,
          ten: n.tenHienThi,
          ngan: nhanNgan(n.tenHienThi, n.chucDanh),
        })),
    [danhSachTaiKhoan],
  );

  /**
   * ⚠️ CỜ MỞ TÁCH KHỎI NỘI DUNG — theo đúng cảnh báo ghi sẵn trong `hop-xac-nhan.tsx`:
   * *"Xóa nội dung cùng lúc với đóng sẽ tháo cây con giữa lúc hiệu ứng đóng đang chạy và để
   * lại lớp mờ kẹt trên màn hình"*.
   *
   * Bản đầu của khối này dùng đúng một biến (`giaoViec === null` vừa là "đóng" vừa là "rỗng"),
   * nên bấm Giao việc là câu mô tả trong hộp biến mất ngay giữa lúc hộp đang đóng. Nay
   * `moHop` lo đóng/mở, `giaoViec` chỉ giữ nội dung và KHÔNG bị xóa khi đóng.
   *
   * 📌 Cùng cách làm với `menu-tai-khoan.tsx` (`moHoSo` tách khỏi `hoSo`).
   */
  const [moHop, setMoHop] = useState(false);
  const [giaoViec, setGiaoViec] = useState<{ uid: string; ten: string; dong: number[] } | null>(
    null,
  );
  /** Giữ dạng chuỗi để ô nhập xóa trống được — số 0 và "chưa nhập" là hai chuyện khác nhau. */
  const [soBaoGia, setSoBaoGia] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  /**
   * ★ CHUYỂN VIỆC — Ban lãnh đạo 12/08/2026: *"thêm tính năng chuyển công việc cho nhân
   * viên khác khi nhân viên được giao việc không thể thực hiện"*.
   *
   * Cờ mở tách khỏi nội dung, cùng lý do với hộp giao việc ở trên.
   */
  const [moChuyen, setMoChuyen] = useState(false);
  const [dongChuyen, setDongChuyen] = useState<{ stt: number; tenCu: string } | null>(null);
  const [uidNhan, setUidNhan] = useState("");
  const [lyDoChuyen, setLyDoChuyen] = useState("");

  function moChuyenViec(stt: number, tenCu: string) {
    setDongChuyen({ stt, tenCu });
    setUidNhan("");
    setLyDoChuyen("");
    setMoChuyen(true);
  }

  function xacNhanChuyen() {
    if (!dongChuyen || !uidNhan) return;
    const nhan = danhSachTaiKhoan.find((n) => n.uid === uidNhan);
    if (!nhan) return;
    chuyenViecDong(
      deNghi.id,
      [dongChuyen.stt],
      { uid: nhan.uid, ten: nhan.tenHienThi },
      lyDoChuyen,
      nguoiDung.tenHienThi,
    );
  }

  /**
   * Ai nhận được việc chuyển sang: nhân viên thu mua, TRỪ người đang phụ trách.
   * ⚠️ Không lọc người hiện tại ra là chuyển cho chính mình — thao tác vô nghĩa mà vẫn ghi
   * một dòng nhật ký, làm hồ sơ nhiễu.
   */
  const nguoiNhanDuoc = useMemo(
    () => nhanVienThuMua.filter((n) => n.uid !== deNghi.items.find((d) => d.stt === dongChuyen?.stt)?.nguoiPhuTrachUid),
    [nhanVienThuMua, deNghi.items, dongChuyen],
  );

  /**
   * 🔴 CHỈ HIỆN DÒNG ĐƯỢC GIAO — Ban lãnh đạo 12/08/2026: *"chỉ cần hiện công việc được
   * phân công, không cần hiển thị toàn bộ danh mục request"*.
   *
   * Trưởng bộ phận (`xemMoiHoSo`) vẫn thấy hết để phân bổ; nhân viên chỉ thấy phần mình.
   * Luật ở `4-phan-quyen/quyen-theo-ho-so.ts` → `sttDongDuocXem`, MỘT CHỖ DUY NHẤT.
   */
  const tienDo = useMemo(() => {
    const tatCa = tinhTienDoDeNghi(deNghi, donHang, phieuNhan);
    const duocXem = new Set(sttDongDuocXem(deNghi, nguoiDung.uid, quyen));
    return tatCa.filter((d) => duocXem.has(d.stt));
  }, [deNghi, donHang, phieuNhan, nguoiDung.uid, quyen]);

  const biLoc = coLocTheoPhanViec(deNghi, nguoiDung.uid, quyen);

  const soChuaPhanBo = tienDo.filter((d) => d.trangThaiDong === "chua_phan_bo").length;
  const soDaPhanChuaLenPO = tienDo.filter((d) => d.trangThaiDong === "da_phan_bo").length;

  /**
   * Dòng này có hành động nào để mở menu ⋯ không.
   *
   * ⚠️ Phải kiểm TRƯỚC khi vẽ nút ⋯. Vẽ nút rồi mở ra menu rỗng là kiểu bí việc khó chịu:
   * người dùng bấm hai lần mới biết chẳng có gì.
   */
  function coHanhDong(d: { stt: number; trangThaiDong: string; nguoiPhuTrachUid?: string }) {
    if (d.trangThaiDong !== "da_phan_bo") return false;
    return duocChuyenViecDong(d, nguoiDung.uid, quyen) || quyen.phanBoCongViec;
  }

  /**
   * `stt` các dòng ĐÃ LÊN ĐƠN ĐẶT HÀNG — không cho xóa: xóa là dòng đơn hàng mồ côi và
   * sai khối lượng đối chiếu. Kho dữ liệu vẫn chặn lần nữa, đây chỉ là để ẩn dấu ×.
   */
  const sttDaLenDon = useMemo(
    () =>
      donHang
        .filter((p) => p.prId === deNghi.id && p.trangThai !== "huy")
        /* `?? []` — quét nhiều đơn, một đơn thiếu `items` là sập bảng phân bổ. */
        .flatMap((p) => (p.items ?? []).map((x) => x.sttDongDeNghi)),
    [donHang, deNghi.id],
  );

  /**
   * ★ CÓ BÀY CÔNG CỤ PHÂN BỔ HÀNG LOẠT KHÔNG (ô tích chọn dòng + thanh "phân cho ai").
   *
   * Cần CẢ HAI: có quyền phân bổ, VÀ đang ở bước phân bổ (hoặc còn dòng chưa ai nhận).
   *
   * ⚠️ KHÁC với `quyen.phanBoCongViec` đơn thuần — các chỗ khác trong bảng vẫn dùng quyền
   * đó (nút xóa vật tư, menu ⋯, nút phân cho dòng lẻ chưa có người). Chỉ bộ công cụ chọn
   * hàng loạt mới ẩn đi sau bước ①.
   */
  const hienCongCuPhanBo = quyen.phanBoCongViec && dangOBuocPhanBo;

  /**
   * Số NGƯỜI khác nhau đang được giao việc trong phiếu này — dùng để báo trước việc tách.
   *
   * 📌 Đếm trên `deNghi.items` chứ không phải `tienDo`: `tienDo` có thể đã bị lọc chỉ còn phần
   * việc của người đang xem, đếm trên đó thì nhân viên nào cũng thấy "1 người".
   */
  const soNguoiDuocGiao = new Set(
    deNghi.items.map((d) => d.nguoiPhuTrachUid).filter(Boolean),
  ).size;

  /** Dòng này có hiện dấu × không. Luật đầy đủ ở `suaMatHangDeNghi`, đây là phép lịch sự. */
  function xoaDuoc(stt: number) {
    return (
      quyen.phanBoCongViec &&
      !biLoc &&
      // Hồ sơ đã đóng thì cả xóa cũng khóa, không riêng thêm mới.
      !hoSoDaDong &&
      deNghi.items.length > 1 &&
      !sttDaLenDon.includes(stt)
    );
  }

  function xoaMatHang(stt: number) {
    const lyDo = suaMatHangDeNghi(
      deNghi.id,
      deNghi.items.filter((d) => d.stt !== stt),
      nguoiDung.tenHienThi,
    );
    if (lyDo) {
      toast.error("Không xóa được mặt hàng", { description: lyDo });
      return;
    }
    toast.success("Đã xóa mặt hàng khỏi đề nghị");
  }

  function themMatHang() {
    if (!dongMoi) return;
    const lyDo = suaMatHangDeNghi(
      deNghi.id,
      [
        ...deNghi.items,
        // `stt: 0` = dòng mới, kho dữ liệu cấp số thật khi lưu.
        // ⚠️ KHÔNG gán `trangThaiDong` / `maPOLienQuan` — hai thứ đó là kết quả TÍNH RA
        // từ đơn hàng và phiếu nhận (`tinhTienDoDeNghi`), không phải dữ liệu lưu trên dòng.
        {
          stt: 0,
          tenVatLieu: dongMoi.ten.trim(),
          donViTinh: dongMoi.dvt.trim(),
          khoiLuongDeNghi: Number(dongMoi.kl),
        },
      ],
      nguoiDung.tenHienThi,
    );
    if (lyDo) {
      toast.error("Không thêm được mặt hàng", { description: lyDo });
      return;
    }
    setDongMoi(null);
    toast.success("Đã thêm mặt hàng vào đề nghị");
  }

  function doiChon(stt: number, checked: boolean) {
    setChon((truoc) => (checked ? [...truoc, stt] : truoc.filter((x) => x !== stt)));
  }

  /**
   * Mở hộp xác nhận giao việc — KHÔNG phân bổ ngay khi bấm.
   *
   * 🔴 Ban lãnh đạo 12/08/2026: *"khi bấm phân bổ công việc cho nhân viên, phải hiện cửa sổ
   * xác nhận lại có giao việc không, và được viết thêm ghi chú yêu cầu số lượng báo giá cần
   * cung cấp"*. Hộp này vừa là chỗ hỏi lại, vừa là chỗ DUY NHẤT nêu yêu cầu số báo giá.
   */
  function moGiaoViec(uid: string, ten: string, dong: number[]) {
    if (dong.length === 0) return;
    setSoBaoGia("");
    setGhiChu("");
    setGiaoViec({ uid, ten, dong });
    setMoHop(true);
  }

  function xacNhanGiaoViec() {
    if (!giaoViec) return;
    const so = Number.parseInt(soBaoGia, 10);
    /**
     * 🔴 ĐỌC KẾT QUẢ RỒI MỚI BÁO — sửa 24/08/2026.
     *
     * Từ hôm nay `phanBoDong` có thể TỪ CHỐI: phân bổ nốt dòng cuối là hồ sơ rời bước ①, nên nó
     * hỏi việc bắt buộc của bước ① (VD *"Checkin hàng tồn kho"*) — đúng danh sách mà hộp kéo thả
     * đang khóa nút theo. Trước đây hàm không kiểm gì, nên gán người cho dòng cuối là hồ sơ nhảy
     * sang bước ② với việc ấy vẫn treo; kéo thẻ thì bị chặn, bấm nút thì đi.
     */
    const loi = phanBoDong(
      deNghi.id,
      giaoViec.dong,
      giaoViec.uid,
      nguoiDung.tenHienThi,
      {
        // Chỉ gửi khi là số dương thật — ô để trống nghĩa là "không nêu yêu cầu riêng",
        // không phải "yêu cầu 0 báo giá".
        soBaoGia: Number.isFinite(so) && so > 0 ? so : undefined,
        ghiChu,
      },
      // Truyền thẳng tên đang hiện trên nút: tài khoản thật không có trong danh bạ viết
      // cứng, để kho dữ liệu tự tra là màn hình hiện mã thô thay vì tên người.
      giaoViec.ten,
    );
    if (loi) {
      toast.error("Chưa giao được việc", { description: loi });
      return;
    }
    setChon([]);
    /**
     * ★ BÁO NGAY CHO NGƯỜI VỪA GIAO — Ban lãnh đạo 21/08/2026: *"khi giao việc cho nhân viên cũng
     * chưa hiện thông báo"*.
     *
     * 🔴 HAI LOẠI THÔNG BÁO KHÁC NHAU, trước đây chỉ có một:
     *   · `phanBoDong` đã tạo tin vào **chuông của người NHẬN việc** — đúng, giữ nguyên.
     *   · Nhưng người VỪA BẤM thì không thấy gì: hộp thoại đóng lại, bảng lặng lẽ đổi. Không có
     *     gì xác nhận việc đã giao cho ai và mấy dòng, nên người giao không biết mình bấm được
     *     hay chưa — đúng cảm giác Ban lãnh đạo báo.
     *
     * 📌 Nói rõ SỐ DÒNG và TÊN NGƯỜI: đó là hai thứ người giao cần soát lại ngay, và cũng là hai
     * thứ dễ bấm nhầm nhất (chọn thiếu dòng, chọn sai người).
     */
    toast.success(`Đã giao ${giaoViec.dong.length} công việc`, {
      description: `${giaoViec.ten} sẽ thấy việc mới trong chuông thông báo và ở màn “Công việc của tôi”.`,
    });
    // ⚠️ KHÔNG `setGiaoViec(null)` ở đây — xem ghi chú ở chỗ khai `moHop`.
    // `HopXacNhan` tự gọi `onDong` ngay sau hàm này để đóng hộp.
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
        {/* 🔴 Nói RÕ là đang lọc. Giấu bớt dòng mà không báo thì người dùng tưởng đề nghị
            chỉ có ngần ấy vật tư, hoặc tưởng app mất dữ liệu — rồi đi hỏi vòng quanh. */}
        {biLoc && (
          <p className="rounded-lg bg-primary-bg px-3 py-2 text-xs text-primary">
            Đang chỉ hiện <strong>phần việc được giao cho bạn</strong> ({tienDo.length}/
            {deNghi.items.length} công việc của đề nghị này). Các công việc còn lại do người
            khác phụ trách.
          </p>
        )}

        {/* Tóm tắt cảnh báo.
            📌 Gọi là "công việc" chứ không phải "dòng" (Ban lãnh đạo 15/08/2026). Với người
            dùng, mỗi dòng vật tư được giao cho một người CHÍNH LÀ một đầu việc — "dòng" là
            cách gọi theo cấu trúc bảng, nói đúng thứ họ phải làm mới dễ hiểu. */}
        <div className="flex flex-wrap items-center gap-3">
          {soChuaPhanBo > 0 ? (
            <span className="flex items-center gap-2 rounded-lg bg-danger-bg px-3 py-1.5 text-sm font-medium text-danger-soft">
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              {soChuaPhanBo} công việc chưa phân bổ
            </span>
          ) : (
            <span className="rounded-lg bg-success-bg px-3 py-1.5 text-sm font-medium text-success-soft">
              Đã phân bổ đủ {tienDo.length} công việc
            </span>
          )}
          {soDaPhanChuaLenPO > 0 && (
            <span className="rounded-lg bg-warning-bg px-3 py-1.5 text-sm font-medium text-warning-soft">
              {soDaPhanChuaLenPO} công việc đã phân nhưng chưa lên đơn hàng
            </span>
          )}
        </div>

        {/* ★ BÁO TRƯỚC VIỆC TÁCH PHIẾU — Ban lãnh đạo 15/08/2026 chốt: giao cho nhiều người
            thì sang bước ② phiếu tự tách, mỗi người một phiếu.

            🔴 Phải nói TRƯỚC khi nó xảy ra. Tách phiếu là việc khó đảo ngược (sinh hồ sơ mới,
            ăn vào 12 mã dự phòng của bản chạy thử); để người dùng phân bổ xong mới phát hiện
            phiếu của mình đã bị chia ba là đúng kiểu app tự tiện làm thay người. */}
        {hienCongCuPhanBo && soNguoiDuocGiao > 1 && (
          <p className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary-bg px-3 py-2 text-sm text-primary">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Đang giao cho <strong>{soNguoiDuocGiao} người</strong>.{" "}
              {soChuaPhanBo > 0 ? (
                <>
                  Khi phân bổ hết {soChuaPhanBo} dòng còn lại, phiếu sẽ <strong>tự tách thành{" "}
                  {soNguoiDuocGiao} phiếu</strong> — mỗi người một phiếu chứa đúng phần việc của
                  họ, vẫn gom lại được vì cùng mã gốc.
                </>
              ) : (
                <>
                  Phiếu sẽ <strong>tự tách thành {soNguoiDuocGiao} phiếu</strong> khi sang bước
                  Yêu cầu NCC báo giá — mỗi người một phiếu, vẫn gom lại được vì cùng mã gốc.
                </>
              )}
            </span>
          </p>
        )}

        {/* Thanh hành động khi đã chọn dòng — chỉ ở bước phân bổ, xem `hienCongCuPhanBo`. */}
        {hienCongCuPhanBo && chon.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary-bg p-3">
            <span className="text-sm font-medium text-primary">Đã chọn {chon.length} dòng — phân cho:</span>
            {nhanVienThuMua.map((nv) => (
              <Button key={nv.uid} size="sm" onClick={() => moGiaoViec(nv.uid, nv.ten, chon)}>
                <UserPlus className="size-4" aria-hidden />
                {nv.ngan} · {nv.ten}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setChon([])}>
              Bỏ chọn
            </Button>
          </div>
        )}

        {/* Bảng — Desktop/Tablet */}
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                {hienCongCuPhanBo && <TableHead className="w-10" />}
                {/* ★ CỘT THAO TÁC NẰM BÊN TRÁI — Ban lãnh đạo 20/08/2026: *"mục thêm xoá tên
                    công tác này a đã nói e đưa về phía trái rồi mà"*. Ngày 19/08 đã thử gom về
                    cột cuối bên phải; chỉ đạo nay là bên trái, giữ nguyên cách gom một cột.
                    Tiêu đề để TRỐNG có chủ ý: chữ "Thao tác" chiếm chỗ mà không nói thêm gì so
                    với chính cái nút nằm dưới. `sr-only` cho trình đọc màn hình biết cột này là gì.
                    ⚠️ KHÔNG dùng lớp `sr-only` bên trong khung cuộn ngang mà thiếu tổ tiên định
                    vị — ở đây `<th>` là ô bảng nên có ngữ cảnh riêng, không thoát ra ngoài. */}
                {quyen.phanBoCongViec && (
                  <TableHead className="w-11">
                    <span className="sr-only">Thao tác</span>
                  </TableHead>
                )}
                <TableHead className="w-12 text-right">Dòng</TableHead>
                <TableHead>Vật liệu</TableHead>
                {/* 🔴 GỘP ĐVT VÀO CỘT KHỐI LƯỢNG — Ban lãnh đạo 12/08/2026 yêu cầu tối ưu.
                    Tám cột trong ~855px là chật, bảng tràn ngang và cột Trạng thái bị cắt chữ.
                    "150 Bao" đọc tự nhiên hơn hai cột rời, mà tiết kiệm hẳn một cột. */}
                <TableHead className="text-right">KL đề nghị</TableHead>
                <TableHead>Người phụ trách</TableHead>
                <TableHead>Trạng thái</TableHead>
                {/* Mã đơn hàng ít tra tới — ẩn dưới 1280px thay vì để nó đẩy bảng tràn.
                    Vẫn xem được ở khối "Đơn đặt hàng đã tách" phía dưới trang. */}
                <TableHead className="hidden xl:table-cell">Đơn hàng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tienDo.map((d) => {
                const tt = nhanAnToan(NHAN_TRANG_THAI_DONG, d.trangThaiDong);
                const daPhan = Boolean(d.nguoiPhuTrachUid);
                return (
                  <TableRow key={d.stt} className={d.trangThaiDong === "chua_phan_bo" ? "bg-danger-bg/40" : undefined}>
                    {hienCongCuPhanBo && (
                      <TableCell>
                        <Checkbox
                          checked={chon.includes(d.stt)}
                          onCheckedChange={(c) => doiChon(d.stt, Boolean(c))}
                          aria-label={`Chọn dòng ${d.stt}`}
                        />
                      </TableCell>
                    )}
                    {/* ★ Ô THAO TÁC — nằm BÊN TRÁI theo chỉ đạo 20/08/2026.
                        🔴 Ô VẪN VẼ RA dù dòng không xoá được (`xoaDuoc` sai): bỏ hẳn ô là bảng
                        thiếu một `<td>` ở hàng đó, các ô sau bị đẩy lệch so với tiêu đề — lỗi
                        bảng kinh điển, và chỉ lộ ra ở đúng những hàng đã lên đơn.
                        📌 Vẫn hỏi lại một câu trước khi xoá: mất một dòng vật tư khỏi chứng từ
                        không lùi lại được. */}
                    {quyen.phanBoCongViec && (
                      <TableCell className="w-11">
                        {xoaDuoc(d.stt) && (
                          <button
                            type="button"
                            onClick={() => setHoiXoa({ stt: d.stt, ten: d.tenVatLieu })}
                            aria-label={`Xóa ${d.tenVatLieu} khỏi đề nghị`}
                            title="Xóa dòng này khỏi đề nghị"
                            /* 44×44 theo Design System V1.1 — đây là nút XOÁ, bấm trượt trên máy
                               tính bảng là mất một dòng vật tư. */
                            className="flex size-11 items-center justify-center rounded-md text-text-desc transition-colors hover:bg-muted hover:text-danger"
                          >
                            <Trash2 className="size-4 shrink-0" aria-hidden />
                          </button>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-right text-text-desc">{d.stt}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        {/* 📌 KHÔNG CÓ NÚT XOÁ Ở ĐÂY NỮA. Lịch sử để người sau khỏi dời lại lần
                            thứ tư: 13/08/2026 dấu × nằm ngay trước tên vật tư → 19/08/2026 gom
                            về cột cuối bên phải → 20/08/2026 Ban lãnh đạo chốt **cột thao tác
                            nằm bên trái** (*"a đã nói e đưa về phía trái rồi mà"*).
                            Giữ nguyên nguyên tắc gom một cột: mắt chạy dọc một đường thẳng để
                            tìm nút, thay vì mỗi hàng lại tìm ở giữa chữ. */}
                        <span className="flex items-baseline gap-1.5">
                          <span className="min-w-0">{d.tenVatLieu}</span>
                        </span>
                        {d.quyCach && <span className="text-xs text-text-desc">{d.quyCach}</span>}
                        {/* Mục đích sử dụng do người đề nghị ghi trên phiếu — hiện ngay
                            dưới tên vật liệu để người lập đơn biết mua cho hạng mục nào,
                            khỏi phải mở lại phiếu gốc. */}
                        {d.mucDichSuDung && (
                          <span className="text-xs text-text-desc">
                            Dùng cho: {d.mucDichSuDung}
                          </span>
                        )}
                        {d.vatTuKiemSoatDinhMuc && (
                          /* 11px chứ không phải 10px: đây là chữ CẢNH BÁO người dùng phải
                             đọc được, mà 10px nằm ngoài thang chữ của dự án (11/12/14/16/18)
                             và phạm quy tắc "cấm chữ <12px cho nội dung quan trọng"
                             (CLAUDE.md mục 3.2). 11px là bậc nhỏ nhất còn được dùng cho nhãn. */
                          <span className="mt-0.5 w-fit rounded bg-warning-bg px-1.5 py-0.5 text-[11px] font-semibold text-warning-soft">
                            Vật tư kiểm soát định mức
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap">
                      {d.khoiLuongDeNghi.toLocaleString("vi-VN")}{" "}
                      <span className="font-normal text-text-desc">{d.donViTinh}</span>
                    </TableCell>
                    <TableCell>
                      {daPhan ? (
                        /**
                         * 🔴 THIẾT KẾ LẠI 12/08/2026 — Ban lãnh đạo: *"mục này chưa ok, cần
                         * thiết kế lại tối ưu hơn"*.
                         *
                         * Bản trước nhồi vào cột này: tên · nút X bỏ phân bổ · badge yêu cầu
                         * báo giá · ghi chú · VÀ HAI nút chuyển việc (một nút bản điện thoại
                         * lọt vào bảng máy tính). Cột phình ra, đẩy bảng **tràn ngang** và
                         * cột Trạng thái bị cắt mất chữ.
                         *
                         * Nay: cột chỉ còn THÔNG TIN (tên + yêu cầu), mọi HÀNH ĐỘNG gom vào
                         * một menu ⋯ — đúng cách bảng quy trình đang làm, và cột giữ được bề
                         * rộng cố định dù thêm hành động về sau.
                         */
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm">{d.nguoiPhuTrachTen}</span>
                            {coHanhDong(d) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 shrink-0"
                                      aria-label={`Thao tác với dòng ${d.stt}`}
                                    />
                                  }
                                >
                                  <MoreHorizontal className="size-4" aria-hidden />
                                </DropdownMenuTrigger>
                                {/* ⚠️ base-nova bắt buộc Item nằm trong Group — thiếu là
                                    "MenuGroupContext is missing" và crash cả trang khi mở. */}
                                {/* 🔴 `w-auto min-w-64` chứ KHÔNG phải `w-56` (224px): Ban lãnh
                                    đạo 16/08/2026 khoanh đỏ menu này vì hai mục cao thấp khác
                                    nhau. Nguyên do là "Chuyển việc cho người khác" không đủ
                                    chỗ nên xuống 2 dòng (48px) trong khi mục kia 1 dòng (28px).
                                    `w-auto` cho menu nở theo nội dung, `min-w-64` giữ sàn 256px
                                    để menu không hẹp hơn menu ⋯ ở bảng quy trình.
                                    ⚠️ Phải ghi `w-auto`: lớp gốc của thư viện là
                                    `w-(--anchor-width)` — bề rộng của nút ⋯, tức 28px — chỉ
                                    thêm `min-w-*` thì bề rộng vẫn bị chốt cứng ở sàn đó. */}
                                <DropdownMenuContent align="end" className="w-auto min-w-64">
                                  <DropdownMenuGroup>
                                    {duocChuyenViecDong(d, nguoiDung.uid, quyen) && (
                                      <DropdownMenuItem
                                        className={LOP_MUC_MENU}
                                        onClick={() =>
                                          moChuyenViec(d.stt, d.nguoiPhuTrachTen ?? "")
                                        }
                                      >
                                        <ArrowLeftRight className="size-4 shrink-0" aria-hidden />
                                        Chuyển việc cho người khác
                                      </DropdownMenuItem>
                                    )}
                                    {quyen.phanBoCongViec && (
                                      <DropdownMenuItem
                                        className={LOP_MUC_MENU}
                                        onClick={() =>
                                          boPhanBoDong(deNghi.id, d.stt, nguoiDung.tenHienThi)
                                        }
                                      >
                                        <X className="size-4 shrink-0" aria-hidden />
                                        Bỏ phân bổ dòng này
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </span>
                          {/* Yêu cầu giao việc của trưởng bộ phận — hiện ngay dưới tên người
                              phụ trách để người nhận việc đọc được, khỏi phải mở nhật ký. */}
                          <YeuCauGiaoViec soBaoGia={d.soBaoGiaYeuCau} ghiChu={d.ghiChuPhanBo} />
                        </div>
                      ) : (
                        <span className="text-sm text-text-desc italic">chưa phân</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge label={tt.nhan} tone={tt.tong} />
                    </TableCell>
                    {/* Bỏ `text-xs`: mọi ô dữ liệu khác trong cùng một hàng đều 14px, riêng
                        cột này 12px làm hàng ngang nhìn so le (Ban lãnh đạo 16/08/2026 về
                        chiều cao chữ không đồng đều). Màu xám vẫn giữ để nó lùi về sau. */}
                    <TableCell className="hidden text-text-desc xl:table-cell">
                      {d.maPOLienQuan.length > 0 ? d.maPOLienQuan.join(", ") : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* ★ THÊM VẬT TƯ MỚI — nút cây bút ở cuối danh sách (Ban lãnh đạo 13/08/2026).
                  Bấm bút thì chính hàng này thành ba ô nhập, gõ xong bấm dấu ✓ là xong —
                  không mở hộp thoại, không rời khỏi bảng. */}
              {/* Hồ sơ đã đóng thì không bày nút thêm — xem `hoSoDaDong`. */}
              {quyen.phanBoCongViec && !biLoc && !hoSoDaDong && (
                <TableRow>
                  {/**
                   * 🔴 `colSpan` TÍNH TỪ CHÍNH ĐIỀU KIỆN CỦA TỪNG CỘT, không viết một con số chết.
                   *
                   * Sáu cột luôn có: Dòng · Vật liệu · KL đề nghị · Người phụ trách · Trạng thái ·
                   * Đơn hàng. Cộng thêm cột ô tích (`hienCongCuPhanBo`) và cột thao tác
                   * (`quyen.phanBoCongViec`) — HAI ĐIỀU KIỆN KHÁC NHAU, vì `hienCongCuPhanBo` còn
                   * đòi đang ở bước phân bổ.
                   *
                   * ⚠️ Bản đầu tôi viết `quyen.phanBoCongViec ? 8 : 6` — sai đúng ở ca "có quyền
                   * nhưng KHÔNG ở bước phân bổ": lúc đó bảng có 7 cột mà `colSpan` khai 8, hàng
                   * này thừa một ô và đường kẻ lệch. Lỗi kiểu này không có gì báo.
                   */}
                  <TableCell
                    colSpan={6 + (hienCongCuPhanBo ? 1 : 0) + (quyen.phanBoCongViec ? 1 : 0)}
                    className="py-2"
                  >
                    {dongMoi === null ? (
                      /* 📌 Nút nằm SÁT TRÁI cho thẳng cột thao tác — Ban lãnh đạo 20/08/2026
                         yêu cầu đưa thêm/xoá về phía trái. (Bản 19/08 đẩy phải bằng `ml-auto`,
                         nay bỏ.) */
                      <button
                        type="button"
                        onClick={() => setDongMoi({ ten: "", kl: "", dvt: "" })}
                        className="flex min-h-11 items-center gap-2 text-sm text-text-desc transition-colors hover:text-primary"
                      >
                        <Plus className="size-4 shrink-0" aria-hidden />
                        Thêm vật tư mới
                      </button>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          autoFocus
                          value={dongMoi.ten}
                          onChange={(e) => setDongMoi({ ...dongMoi, ten: e.target.value })}
                          placeholder="Tên vật tư"
                          className="w-56"
                          aria-label="Tên vật tư mới"
                        />
                        <Input
                          type="number"
                          min={0}
                          value={dongMoi.kl}
                          onChange={(e) => setDongMoi({ ...dongMoi, kl: e.target.value })}
                          placeholder="Số lượng"
                          className="w-28"
                          aria-label="Số lượng"
                        />
                        <Input
                          value={dongMoi.dvt}
                          onChange={(e) => setDongMoi({ ...dongMoi, dvt: e.target.value })}
                          placeholder="ĐVT"
                          className="w-24"
                          aria-label="Đơn vị tính"
                        />
                        <Button
                          size="sm"
                          disabled={
                            dongMoi.ten.trim() === "" ||
                            dongMoi.dvt.trim() === "" ||
                            !(Number(dongMoi.kl) > 0)
                          }
                          onClick={themMatHang}
                        >
                          Thêm
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDongMoi(null)}>
                          Hủy
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Card List — Mobile (<768px): không ép bảng nhiều cột, luật V1.1 Phần F */}
        <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
          {tienDo.map((d) => {
            const tt = nhanAnToan(NHAN_TRANG_THAI_DONG, d.trangThaiDong);
            return (
              <div key={d.stt} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold text-text-primary">
                      {d.stt}. {d.tenVatLieu}
                    </span>
                    {d.quyCach && <span className="text-xs text-text-desc">{d.quyCach}</span>}
                    {d.mucDichSuDung && (
                      <span className="text-xs text-text-desc">Dùng cho: {d.mucDichSuDung}</span>
                    )}
                  </div>
                  <StatusBadge label={tt.nhan} tone={tt.tong} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-desc">Đề nghị</span>
                  <span className="font-semibold">
                    {d.khoiLuongDeNghi.toLocaleString("vi-VN")} {d.donViTinh}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-desc">Người phụ trách</span>
                  <span>{d.nguoiPhuTrachTen ?? "chưa phân"}</span>
                </div>
                <YeuCauGiaoViec soBaoGia={d.soBaoGiaYeuCau} ghiChu={d.ghiChuPhanBo} />

                {/* Trên điện thoại KHÔNG dùng menu ⋯ mà hiện nút thẳng: màn hẹp thì menu bật
                    ra che gần hết nội dung, còn ở đây có sẵn chỗ. Vùng chạm ≥44px (V1.1). */}
                {coHanhDong(d) && (
                  <div className="flex flex-wrap gap-2">
                    {duocChuyenViecDong(d, nguoiDung.uid, quyen) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-h-11"
                        onClick={() => moChuyenViec(d.stt, d.nguoiPhuTrachTen ?? "")}
                      >
                        <ArrowLeftRight className="size-4" aria-hidden />
                        Chuyển việc
                      </Button>
                    )}
                    {quyen.phanBoCongViec && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="min-h-11"
                        onClick={() => boPhanBoDong(deNghi.id, d.stt, nguoiDung.tenHienThi)}
                      >
                        <X className="size-4" aria-hidden />
                        Bỏ phân bổ
                      </Button>
                    )}
                  </div>
                )}

                {quyen.phanBoCongViec && !d.nguoiPhuTrachUid && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {nhanVienThuMua.map((nv) => (
                      <Button
                        key={nv.uid}
                        size="sm"
                        variant="outline"
                        className="min-h-11"
                        onClick={() => moGiaoViec(nv.uid, nv.ten, [d.stt])}
                      >
                        {nv.ngan}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* ===== HỘP XÁC NHẬN GIAO VIỆC =====
          Ban lãnh đạo 12/08/2026. Cùng một hộp cho cả bảng (Desktop) lẫn Card List
          (Mobile) — một chỗ duy nhất, khỏi hai đường giao việc lệch nhau. */}
      <HopXacNhan
        mo={moHop}
        tieuDe="Giao việc cho nhân viên?"
        moTa={
          giaoViec &&
          `Giao ${giaoViec.dong.length} công việc (dòng ${giaoViec.dong.join(", ")}) của đề nghị ${deNghi.code} cho ${giaoViec.ten}.`
        }
        nhanDongY="Giao việc"
        onDong={() => setMoHop(false)}
        onDongY={xacNhanGiaoViec}
      >
        <div className="flex flex-col gap-(--hp-md-row-gap)">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="so-bao-gia">Số báo giá yêu cầu nhân viên lấy về</Label>
            {/* ★ NÚT SỔ XUỐNG thay cho ô gõ số — Ban lãnh đạo 20/08/2026: *"tạo nút sổ xuống chọn
                số lượng báo giá"*.
                🔴 CHỈ LIỆT KÊ TỚI `TOI_DA_O_BAO_GIA` (4): đó là số ô đính kèm app thật sự mở ra
                được — mỗi bước giữ tối đa 5 tệp và một suất đã dành cho bảng so sánh bắt buộc.
                Ô gõ số cũ cho nhập tới 10, và người giao việc đặt 7 thì app chỉ mở 4 ô → yêu cầu
                của họ không bao giờ thỏa được mà chẳng có gì báo. Sổ xuống thì không chọn được
                con số app không làm nổi. */}
            <select
              id="so-bao-gia"
              value={soBaoGia}
              onChange={(e) => setSoBaoGia(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors hover:border-primary focus:border-primary focus:outline-none"
            >
              <option value="">Không yêu cầu riêng</option>
              {Array.from({ length: TOI_DA_O_BAO_GIA }, (_, i) => i + 1).map((n) => (
                <option key={n} value={String(n)}>
                  {/* ★ MỨC TRẦN GHI LÀ "NHIỀU" — Ban lãnh đạo 21/08/2026: *"sửa thành chữ nhiều"*
                      (khoanh đỏ đúng mục cuối).
                      🔴 VẪN GHI RÕ CON SỐ TRONG NGOẶC: quy trình có thể cần 5–6 báo giá, nhưng app
                      chỉ mở được {TOI_DA_O_BAO_GIA} ô (mỗi bước giữ tối đa 5 tệp, một suất đã dành
                      cho bảng so sánh bắt buộc). Ghi trơ chữ "Nhiều" là để người giao việc tưởng
                      app nhận bao nhiêu cũng được, rồi yêu cầu của họ không bao giờ thỏa. */}
                  {n === TOI_DA_O_BAO_GIA ? `Nhiều báo giá (tối đa ${n})` : `${n} báo giá`}
                </option>
              ))}
            </select>
            {/* Nêu luật thật của công ty để trưởng bộ phận đặt con số có căn cứ, thay vì
                đoán. Con số tối thiểu lấy từ `cauHinh`, KHÔNG viết số cứng ở đây — nó là tham số
                sửa được ở trang Cài đặt quy trình, trước 14/08/2026 chỗ này còn viết cứng "02". */}
            <p className="text-xs text-text-desc">
              Quy trình yêu cầu tối thiểu{" "}
              <strong>{String(cauHinh.soBaoGiaToiThieu).padStart(2, "0")} báo giá</strong>. Để
              trống thì app không chặn theo số bản — nhân viên vẫn phải đính kèm{" "}
              <strong>bảng so sánh</strong> trước khi trình xét duyệt.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ghi-chu-giao-viec">Ghi chú cho người nhận việc</Label>
            <Textarea
              id="ghi-chu-giao-viec"
              rows={3}
              
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
            />
          </div>
        </div>
      </HopXacNhan>

      {/* ===== HỘP CHUYỂN VIỆC =====
          Ban lãnh đạo 12/08/2026: thay cho bước "Nhận công tác" vừa bỏ. Không hỏi có làm
          hay không, nhưng phải có đường thoát khi người được giao thật sự không làm được. */}
      <HopXacNhan
        mo={moChuyen}
        tieuDe="Chuyển việc cho người khác?"
        moTa={
          dongChuyen &&
          `Dòng ${dongChuyen.stt} của đề nghị ${deNghi.code}, đang do ${dongChuyen.tenCu} phụ trách.`
        }
        canhBao="Yêu cầu số báo giá và ghi chú giao việc giữ nguyên — chỉ đổi người làm, không đổi nội dung công việc."
        nhanDongY="Chuyển việc"
        onDong={() => setMoChuyen(false)}
        onDongY={xacNhanChuyen}
      >
        <div className="flex flex-col gap-(--hp-md-row-gap)">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nguoi-nhan-viec">Chuyển cho</Label>
            {nguoiNhanDuoc.length === 0 ? (
              // 🔴 Nói rõ vì sao trống, đừng để ô chọn rỗng không lời giải thích.
              <p className="text-xs text-warning-soft">
                Không còn nhân viên thu mua nào khác để chuyển. Cần thêm tài khoản nhân viên
                trước.
              </p>
            ) : (
              <select
                id="nguoi-nhan-viec"
                value={uidNhan}
                onChange={(e) => setUidNhan(e.target.value)}
                className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none"
              >
                <option value="">— Chọn người nhận việc —</option>
                {nguoiNhanDuoc.map((n) => (
                  <option key={n.uid} value={n.uid}>
                    {n.ten}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ly-do-chuyen">Lý do chuyển</Label>
            <Textarea
              id="ly-do-chuyen"
              rows={2}
              
              value={lyDoChuyen}
              onChange={(e) => setLyDoChuyen(e.target.value)}
            />
            {/* 🔴 Ghi lý do vào nhật ký. Đổi người mà không có lý do thì sau này đọc lại hồ
                sơ không biết vì sao việc đổi tay — đúng lúc cần truy trách nhiệm. */}
            <p className="text-xs text-text-desc">
              Lý do được ghi vào Lịch sử hoạt động của đề nghị.
            </p>
          </div>
        </div>
      </HopXacNhan>

      {/* Hỏi lại trước khi xóa: mất một dòng vật tư khỏi chứng từ không lùi lại được.
          Luật chặn đầy đủ nằm ở `suaMatHangDeNghi`, hộp này chỉ hỏi. */}
      <HopXacNhan
        mo={hoiXoa !== null}
        tieuDe="Xóa mặt hàng khỏi đề nghị?"
        moTa={hoiXoa ? `Dòng ${hoiXoa.stt} — ${hoiXoa.ten}` : undefined}
        nhanDongY="Xóa"
        nguyHiem
        onDong={() => setHoiXoa(null)}
        onDongY={() => hoiXoa && xoaMatHang(hoiXoa.stt)}
      />
    </Card>
  );
}
