"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeftRight, MoreHorizontal, UserPlus, X } from "lucide-react";
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
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { NGUONG } from "@/2-quy-trinh/nguong-gia-tri";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  coLocTheoPhanViec,
  duocChuyenViecDong,
  sttDongDuocXem,
} from "@/4-phan-quyen/quyen-theo-ho-so";
import { tinhTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import { NHAN_TRANG_THAI_DONG } from "@/2-quy-trinh/trang-thai";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

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
export function BangPhanBo({ deNghi }: { deNghi: DeNghiMuaHang }) {
  const { donHang, phieuNhan, phanBoDong, boPhanBoDong, chuyenViecDong } = useDuLieu();
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
    phanBoDong(
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
    setChon([]);
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
            {deNghi.items.length} dòng vật tư của đề nghị này). Các dòng còn lại do người khác
            phụ trách.
          </p>
        )}

        {/* Tóm tắt cảnh báo */}
        <div className="flex flex-wrap items-center gap-3">
          {soChuaPhanBo > 0 ? (
            <span className="flex items-center gap-2 rounded-lg bg-danger-bg px-3 py-1.5 text-sm font-medium text-danger-soft">
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              {soChuaPhanBo} dòng chưa phân bổ
            </span>
          ) : (
            <span className="rounded-lg bg-success-bg px-3 py-1.5 text-sm font-medium text-success-soft">
              Đã phân bổ đủ {tienDo.length} dòng
            </span>
          )}
          {soDaPhanChuaLenPO > 0 && (
            <span className="rounded-lg bg-warning-bg px-3 py-1.5 text-sm font-medium text-warning-soft">
              {soDaPhanChuaLenPO} dòng đã phân nhưng chưa lên đơn hàng
            </span>
          )}
        </div>

        {/* Thanh hành động khi đã chọn dòng */}
        {quyen.phanBoCongViec && chon.length > 0 && (
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
                {quyen.phanBoCongViec && <TableHead className="w-10" />}
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
                const tt = NHAN_TRANG_THAI_DONG[d.trangThaiDong];
                const daPhan = Boolean(d.nguoiPhuTrachUid);
                return (
                  <TableRow key={d.stt} className={d.trangThaiDong === "chua_phan_bo" ? "bg-danger-bg/40" : undefined}>
                    {quyen.phanBoCongViec && (
                      <TableCell>
                        <Checkbox
                          checked={chon.includes(d.stt)}
                          onCheckedChange={(c) => doiChon(d.stt, Boolean(c))}
                          aria-label={`Chọn dòng ${d.stt}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-right text-text-desc">{d.stt}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{d.tenVatLieu}</span>
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
                          <span className="mt-0.5 w-fit rounded bg-warning-bg px-1.5 py-0.5 text-[10px] font-semibold text-warning-soft">
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
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuGroup>
                                    {duocChuyenViecDong(d, nguoiDung.uid, quyen) && (
                                      <DropdownMenuItem
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
                    <TableCell className="hidden text-xs text-text-desc xl:table-cell">
                      {d.maPOLienQuan.length > 0 ? d.maPOLienQuan.join(", ") : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Card List — Mobile (<768px): không ép bảng nhiều cột, luật V1.1 Phần F */}
        <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
          {tienDo.map((d) => {
            const tt = NHAN_TRANG_THAI_DONG[d.trangThaiDong];
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
          `Giao ${giaoViec.dong.length} dòng vật tư (dòng ${giaoViec.dong.join(", ")}) của đề nghị ${deNghi.code} cho ${giaoViec.ten}.`
        }
        nhanDongY="Giao việc"
        onDong={() => setMoHop(false)}
        onDongY={xacNhanGiaoViec}
      >
        <div className="flex flex-col gap-(--hp-md-row-gap)">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="so-bao-gia">Số báo giá yêu cầu nhân viên lấy về</Label>
            <Input
              id="so-bao-gia"
              type="number"
              min={1}
              max={10}
              inputMode="numeric"
              placeholder="Để trống nếu không yêu cầu riêng"
              value={soBaoGia}
              onChange={(e) => setSoBaoGia(e.target.value)}
            />
            {/* Nêu luật thật của công ty để trưởng bộ phận đặt con số có căn cứ, thay vì
                đoán. Ngưỡng lấy từ `nguong-gia-tri.ts`, KHÔNG viết số cứng ở đây. */}
            <p className="text-xs text-text-desc">
              Quy trình yêu cầu tối thiểu <strong>02 báo giá</strong> với đơn từ{" "}
              {(NGUONG.HAI_BAO_GIA / 1_000_000).toLocaleString("vi-VN")} triệu đồng trở lên. Lúc
              giao việc thì chưa có giá nên app chưa biết đơn này thuộc mức nào — để trống cũng
              được, app vẫn soát theo ngưỡng khi trình xét duyệt báo giá.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ghi-chu-giao-viec">Ghi chú cho người nhận việc</Label>
            <Textarea
              id="ghi-chu-giao-viec"
              rows={3}
              placeholder="Ví dụ: ưu tiên nhà cung cấp giao trong 3 ngày, hỏi thêm giá cho phương án thay thế..."
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
              placeholder="Ví dụ: đang đi công trường, không kịp hạn báo giá..."
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
    </Card>
  );
}
