"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, Check, FileWarning, ShoppingCart, Split } from "lucide-react";
import { toast } from "sonner";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { lyDoKhongXemBaoGia } from "@/4-phan-quyen/quyen-theo-ho-so";
import { KhoiThuThapBaoGia } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-thu-thap-bao-gia";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { Card, CardContent, CardHeader, CardTitle } from "@/1-giao-dien/nen-tang-ui/card";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Badge } from "@/1-giao-dien/nen-tang-ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/1-giao-dien/nen-tang-ui/table";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { NHAN_TRANG_THAI_BAO_GIA } from "@/2-quy-trinh/trang-thai";
import {
  daTachBaoGia,
  dungBangSoSanh,
  gomTheoNCC,
  kiemPhanBoDong,
} from "@/2-quy-trinh/so-sanh-bao-gia";
import type { PhanBoNCC } from "@/3-du-lieu/kieu-du-lieu";
import { formatCurrencyVnd, formatDate, formatNumber } from "@/6-tien-ich/dinh-dang";
import { cn } from "@/6-tien-ich/gop-lop";

/** M7b — So sánh báo giá nhiều nhà cung cấp cho một đề nghị đã duyệt. */
export default function TrangBaoGiaChiTiet() {
  const params = useParams<{ id: string }>();
  const {
    baoGia,
    deNghi,
    donHang,
    nhaCungCap,
    chonNCCChoBaoGia,
    luuPhanBoBaoGia,
    nhapGiaNCC,
    dinhKemBaoGia,
    trinhXetDuyetBaoGia,
    duyetPhuongAnTach,
  } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  const bg = baoGia.find((b) => b.id === params.id);

  /**
   * CHẾ ĐỘ TÁCH — bật lên thì mỗi ô trong bảng so sánh có thêm ô nhập khối lượng.
   * Khóa ngoài là `DongBaoGia.id`, khóa trong là `nccId`, giá trị là chuỗi đang gõ
   * (giữ nguyên chuỗi để người dùng xóa trắng ô mà không bị nhảy về 0).
   */
  const [cheDoTach, setCheDoTach] = useState(false);
  const [nhap, setNhap] = useState<Record<string, Record<string, string>>>({});

  /**
   * Việc đang chờ xác nhận. Theo nguyên tắc Ban lãnh đạo 10/08/2026: mọi việc CHUYỂN BƯỚC
   * hoặc không lùi lại được đều phải hỏi trước — xem `HopXacNhan`.
   *
   * Một state duy nhất cho cả ba việc ở màn này (trình xét duyệt · duyệt phương án chia đơn ·
   * chốt một nhà cung cấp) thay vì ba cờ riêng: chỉ mở được một hộp tại một thời điểm, gộp lại
   * thì không có cách nào mở trùng hai hộp.
   */
  const [viecChoXacNhan, setViecChoXacNhan] = useState<
    | { loai: "trinh_xet_duyet" }
    | { loai: "duyet_phuong_an" }
    | { loai: "chot_ncc"; nccId: string; tenNCC: string }
    | null
  >(null);

  if (!bg) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Không tìm thấy bảng báo giá"
        description="Bảng báo giá có thể đã bị xóa hoặc đường dẫn không đúng."
      />
    );
  }

  /**
   * 🔴 CHẶN THEO TỪNG HỒ SƠ (chỉ đạo Ban lãnh đạo 10/08/2026): *"Chỉ nhân viên nào được chia
   * việc thì mới xem được báo giá, hoặc được thêm vào mục người theo dõi"*.
   *
   * Chặn NGAY ĐẦU MÀN, trước khi dựng bảng so sánh — không chỉ ẩn cột giá. Bảng báo giá chứa
   * đơn giá của nhiều nhà cung cấp, là thông tin thương mại nhạy cảm nhất của phòng thu mua.
   *
   * ⚠️ Đề nghị nguồn không còn (dữ liệu chạy thử bị xóa) thì cũng không cho xem — thà chặn
   * oan còn hơn để lộ giá vì thiếu dữ liệu đối chiếu.
   */
  const dnNguon = deNghi.find((d) => d.id === bg.prId);
  const lyDoChan = dnNguon
    ? lyDoKhongXemBaoGia(dnNguon, nguoiDung.uid, quyen)
    : "Không tìm thấy đề nghị nguồn của bảng báo giá này nên chưa kiểm được quyền xem.";

  if (lyDoChan) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Không có quyền xem bảng báo giá này"
        description={lyDoChan}
      />
    );
  }

  const tt = NHAN_TRANG_THAI_BAO_GIA[bg.trangThai];
  const { cot, dong } = dungBangSoSanh(bg);
  const daTach = daTachBaoGia(bg);
  const nhomNCC = gomTheoNCC(bg);

  /**
   * Khối lượng ĐÃ ĐẶT của mỗi (nhà cung cấp × dòng đề nghị), gom từ các đơn hàng thật.
   *
   * 🔴 PHẢI TÍNH THEO TỪNG DÒNG, KHÔNG chỉ theo nhà cung cấp. Gom thô theo `supplierId`
   * trên cả đề nghị thì chặn oan: NCC B đã có đơn cho dòng thép, sau đó tách thêm dòng xi
   * măng cũng cho B là hết đường lập đơn thứ hai — trong khi mô hình dữ liệu cho phép nhiều
   * đơn trỏ về cùng một đề nghị. Cũng chặn oan ca đặt trước một phần rồi đặt tiếp phần còn
   * lại từ cùng nhà cung cấp.
   *
   * ⚠️ Chỉ xét đơn CHƯA HỦY — đơn đã hủy thì phải cho lập lại.
   */
  const daDatTheoNCCVaDong = new Map<string, number>();
  for (const po of donHang) {
    if (po.prId !== bg.prId || po.trangThai === "huy") continue;
    for (const d of po.items) {
      const khoa = `${po.supplierId}|${d.sttDongDeNghi}`;
      daDatTheoNCCVaDong.set(khoa, (daDatTheoNCCVaDong.get(khoa) ?? 0) + d.khoiLuongDat);
    }
  }

  /**
   * Nhóm phân bổ của nhà cung cấp này đã được đặt hết chưa.
   *
   * "Hết" = mọi dòng trong nhóm đều đã có đơn với khối lượng ≥ phần được phân bổ. Còn một
   * dòng chưa đủ thì vẫn cho lập đơn tiếp.
   */
  const daDatHetNhom = (nccId: string): boolean => {
    const dongCuaNhom = bg.items
      .map((item) => ({
        stt: item.sttDongDeNghi,
        phan: (item.phanBo ?? []).find((p) => p.nccId === nccId)?.khoiLuong ?? 0,
      }))
      .filter((x) => x.phan > 0);
    if (dongCuaNhom.length === 0) return false;
    return dongCuaNhom.every((x) => {
      // Dòng báo giá cũ chưa có `sttDongDeNghi` thì không đối chiếu được theo dòng — coi như
      // chưa đặt, thà hiện nút thừa còn hơn chặn oan không cho lập đơn.
      if (x.stt === undefined) return false;
      return (daDatTheoNCCVaDong.get(`${nccId}|${x.stt}`) ?? 0) >= x.phan;
    });
  };

  /** Đọc số đang gõ ở ô (dòng × NCC). Ô trống hoặc gõ bậy tính là 0. */
  const soDangGo = (dongId: string, nccId: string): number => {
    const s = nhap[dongId]?.[nccId];
    const n = Number(s);
    return s !== undefined && s !== "" && Number.isFinite(n) && n > 0 ? n : 0;
  };

  /** Bật chế độ tách: nạp sẵn phân bổ đã lưu để sửa tiếp, không bắt gõ lại từ đầu. */
  function moCheDoTach() {
    const banDau: Record<string, Record<string, string>> = {};
    for (const item of bg!.items) {
      for (const p of item.phanBo ?? []) {
        banDau[item.id] = { ...(banDau[item.id] ?? {}), [p.nccId]: String(p.khoiLuong) };
      }
    }
    setNhap(banDau);
    setCheDoTach(true);
  }

  // Kiểm từng dòng để biết dòng nào chia vượt — có dòng vượt thì chặn lưu cả bảng.
  const ketQuaDong = dong.map((d) => {
    const ds: PhanBoNCC[] = cot
      .map((c) => ({ nccId: c.nccId, tenNCC: c.tenNCC, khoiLuong: soDangGo(d.dong.id, c.nccId) }))
      .filter((p) => p.khoiLuong > 0);
    return { dongId: d.dong.id, ds, kiem: kiemPhanBoDong(d.dong.khoiLuong, ds) };
  });
  const coDongVuot = ketQuaDong.some((k) => k.kiem.vuot);
  const tongDaChia = ketQuaDong.reduce((t, k) => t + k.ds.length, 0);

  function luuTach() {
    const theoDong: Record<string, PhanBoNCC[]> = {};
    for (const k of ketQuaDong) theoDong[k.dongId] = k.ds;
    luuPhanBoBaoGia(bg!.id, theoDong, nguoiDung.tenHienThi);
    setCheDoTach(false);
    toast.success("Đã lưu phân bổ", {
      description: "Mỗi nhà cung cấp sẽ được lập một đơn đặt hàng riêng.",
    });
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Phòng Thu Mua", href: "/tong-quan" },
          { label: "Báo giá", href: "/bao-gia" },
          { label: bg.code },
        ]}
        title={bg.tieuDe}
        description={`${bg.code} · Hạn nộp báo giá ${formatDate(bg.hanNop)}`}
        actions={<StatusBadge label={tt.nhan} tone={tt.tong} />}
      />

      <Card>
        <CardContent className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-text-desc">Đề nghị liên kết</p>
            <Link
              href={`/de-nghi/${bg.prId}`}
              className="font-medium text-primary hover:underline"
            >
              {bg.prCode}
            </Link>
          </div>
          <div>
            <p className="text-xs text-text-desc">Ngày tạo</p>
            <p className="font-medium text-text-primary">{formatDate(bg.ngayTao)}</p>
          </div>
          <div>
            <p className="text-xs text-text-desc">Cập nhật lần cuối</p>
            <p className="font-medium text-text-primary">{formatDate(bg.ngayCapNhat)}</p>
          </div>
          <div>
            <p className="text-xs text-text-desc">Nhà cung cấp đã chọn</p>
            <p className={cn("font-medium", bg.nccDaChonTen ? "text-success-soft" : "text-text-desc")}>
              {bg.nccDaChonTen ?? "Chưa chọn"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ===== CHỜ NHÀ CUNG CẤP GỬI GIÁ VỀ =====
          🔴 MẮT NỐI của chuỗi tách PO. Bảng báo giá vừa lập ra chưa có giá của ai, nên
          không có gì để so sánh và cũng KHÔNG TÁCH ĐƯỢC. Trước 10/08/2026 giá chỉ được
          điền khi KÉO THẺ từ cột ② sang cột ③ trên bảng quy trình — trên điện thoại không
          kéo được nên chuỗi tắc hẳn ở đây.

          ⚠️ Nút này là CÔNG CỤ CHẠY THỬ, tự điền giá giả lập của 3 nhà cung cấp. Khi nối
          Firestore thật thì thay bằng màn nhập giá thật (hoặc nhận giá NCC gửi qua HPcore)
          và BỎ nút này. */}
      {bg.trangThai === "dang_thu_thap" && quyen.lapPO && (
        <KhoiThuThapBaoGia
          baoGia={bg}
          nhaCungCap={nhaCungCap}
          nguoiDungTen={nguoiDung.tenHienThi}
          onNhapGia={(ncc, gia) => nhapGiaNCC(bg.id, ncc, gia, nguoiDung.tenHienThi)}
          onDinhKem={(tep) => dinhKemBaoGia(bg.id, tep, nguoiDung.tenHienThi)}
          // Hỏi trước khi trình — chuyển bước là việc không lùi lại được (nguyên tắc
          // Ban lãnh đạo 10/08/2026).
          onTrinhXetDuyet={() => setViecChoXacNhan({ loai: "trinh_xet_duyet" })}
        />
      )}

      {/* ===== TÁCH BÁO GIÁ CHO NHIỀU NHÀ CUNG CẤP =====
          Chỉ đạo Ban lãnh đạo 10/08/2026: một nhà cung cấp có thể không giao đủ số
          lượng cần đặt, nên phải chia mặt hàng đó cho nhiều nhà cung cấp — mỗi phần
          sẽ thành một đơn đặt hàng riêng. */}
      {daTach && !cheDoTach && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-base">
              Đã tách cho {nhomNCC.length} nhà cung cấp
            </CardTitle>
            <p className="text-xs text-text-desc">
              Mỗi nhà cung cấp bên dưới sẽ được lập <strong>một đơn đặt hàng riêng</strong>.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
            {nhomNCC.map((n) => (
              <div
                key={n.nccId}
                className="flex flex-col gap-1 rounded-lg border border-border p-(--hp-md-row-pad)"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-text-primary">{n.tenNCC}</span>
                  <span className="text-xs text-text-desc">{n.dong.length} mặt hàng</span>
                  {quyen.xemGia && (
                    <span className="ml-auto text-sm font-bold text-text-primary">
                      {formatCurrencyVnd(n.tongTien)}
                    </span>
                  )}
                </div>
                <ul className="flex flex-col gap-0.5 text-xs text-text-secondary">
                  {n.dong.map((d) => (
                    <li key={d.dongBaoGiaId}>
                      {d.tenVatLieu} — {formatNumber(d.khoiLuong)} {d.donViTinh}
                    </li>
                  ))}
                </ul>
                {/* Cảnh báo khi giao cho NCC chưa báo giá dòng đó — lập đơn sẽ thiếu đơn giá */}
                {n.thieuGia && (
                  <p className="flex items-center gap-1.5 text-xs text-warning-soft">
                    <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                    Có mặt hàng nhà cung cấp này chưa báo giá — cần thỏa thuận giá trước khi lập đơn.
                  </p>
                )}

                {/* ===== LẬP ĐƠN CHO RIÊNG NHÀ CUNG CẤP NÀY =====
                    🔴 ĐÂY LÀ MẮT NỐI của chức năng tách PO. Trước ngày 10/08/2026 khối này
                    chỉ hiện danh sách đã chia mà KHÔNG có đường lập đơn, nên tách xong người
                    dùng vẫn phải sang màn lập đơn tự chọn nhà cung cấp và tự nhập lại khối
                    lượng — tách chỉ là ghi chú, không sinh ra đơn nào. Ban lãnh đạo báo
                    *"chức năng tách PO vẫn chưa có"* chính là thiếu chỗ này.

                    Bấm nút → mở màn lập đơn với nhà cung cấp, khối lượng và đơn giá điền sẵn
                    theo phân bổ. Mỗi nhà cung cấp một lần bấm = một PO riêng. */}
                {quyen.lapPO && (
                  <div className="mt-1 flex flex-wrap items-center gap-2 border-t border-divider pt-2">
                    {/* 🔴 CHƯA DUYỆT THÌ CHƯA LẬP ĐƠN (chỉ đạo Ban lãnh đạo 10/08/2026:
                        "phải có bước xét duyệt báo giá thì mới qua bước lập PO"). Trước đây
                        nút lập đơn hiện ngay ở trạng thái `da_so_sanh` nên người lập tự so
                        giá rồi tự đặt hàng — bước ③ Xét duyệt bị bỏ qua hoàn toàn. */}
                    {bg.trangThai !== "da_chon_ncc" ? (
                      <span className="flex items-center gap-1.5 text-xs text-warning-soft">
                        <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                        Chờ duyệt phương án chia đơn — duyệt xong mới lập được đơn đặt hàng.
                      </span>
                    ) : daDatHetNhom(n.nccId) ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-success-soft">
                        <Check className="size-3.5 shrink-0" aria-hidden />
                        Đã lập đơn đủ phần của nhà cung cấp này
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        nativeButton={false}
                        render={
                          <Link
                            href={`/don-hang/tao-moi?prId=${bg.prId}&rfqId=${bg.id}&nccId=${n.nccId}`}
                          />
                        }
                      >
                        <ShoppingCart className="size-4" aria-hidden />
                        Lập đơn cho {n.tenNCC}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={moCheDoTach}>
                <Split className="size-4" aria-hidden />
                Sửa phân bổ
              </Button>

              {/* ===== BƯỚC ③ XÉT DUYỆT BÁO GIÁ =====
                  🔴 Chỉ đạo Ban lãnh đạo 10/08/2026. Người DUYỆT phải là trưởng bộ phận
                  (`xacNhanTruongBP`), không phải người lập — để người lập tự duyệt phương án
                  của mình thì bước xét duyệt chỉ còn là hình thức. */}
              {bg.trangThai === "da_so_sanh" &&
                (quyen.xacNhanTruongBP ? (
                  <Button
                    size="sm"
                    onClick={() => setViecChoXacNhan({ loai: "duyet_phuong_an" })}
                  >
                    <Check className="size-4" aria-hidden />
                    Duyệt phương án chia đơn
                  </Button>
                ) : (
                  <span className="text-xs text-warning-soft">
                    Chờ trưởng bộ phận duyệt phương án chia đơn.
                  </span>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">Bảng so sánh giá nhà cung cấp</CardTitle>
              <p className="text-xs text-text-desc">
                {cheDoTach
                  ? "Điền khối lượng giao cho từng nhà cung cấp. Để trống nghĩa là không giao."
                  : "Giá thấp nhất mỗi dòng được tô màu xanh và đánh dấu chữ “thấp nhất”. Cột nhà cung cấp báo thiếu dòng không được đưa vào so sánh tổng."}
              </p>
            </div>
            {quyen.lapPO && !cheDoTach && !daTach && (
              <Button variant="outline" size="sm" onClick={moCheDoTach}>
                <Split className="size-4" aria-hidden />
                Tách cho nhiều NCC
              </Button>
            )}
          </div>

          {cheDoTach && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-muted p-(--hp-md-row-pad)">
              <span className="text-xs text-text-secondary">
                Đã phân bổ <strong className="text-text-primary">{tongDaChia}</strong> lượt giao
              </span>
              {coDongVuot && (
                <span className="flex items-center gap-1 text-xs font-semibold text-danger-soft">
                  <AlertTriangle className="size-3.5" aria-hidden />
                  Có dòng chia vượt khối lượng — sửa lại mới lưu được
                </span>
              )}
              <span className="ml-auto flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setCheDoTach(false)}>
                  Hủy
                </Button>
                <Button size="sm" disabled={coDongVuot || tongDaChia === 0} onClick={luuTach}>
                  <Check className="size-4" aria-hidden />
                  Lưu phân bổ
                </Button>
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">STT</TableHead>
                  <TableHead>Vật tư</TableHead>
                  <TableHead>ĐVT</TableHead>
                  <TableHead className="text-right">Khối lượng</TableHead>
                  {cot.map((c) => (
                    <TableHead key={c.nccId} className="min-w-40 text-right">
                      <span className="flex flex-col items-end gap-1">
                        <span className="max-w-40 truncate" title={c.tenNCC}>
                          {c.tenNCC}
                        </span>
                        {bg.nccDaChonId === c.nccId && (
                          <Badge className="border-transparent bg-success-bg text-success-soft">
                            <Check aria-hidden /> Đã chọn
                          </Badge>
                        )}
                        {/* Chọn NCC — ĐÂY LÀ HÀNH VI DUYỆT của bước ③ Xét duyệt báo giá.
                            🔴 Đòi quyền `xacNhanTruongBP`, KHÔNG phải `lapPO` (chỉ đạo Ban lãnh
                            đạo 10/08/2026): trước đây nhân viên lập đơn tự chốt nhà cung cấp
                            được, nghĩa là tự duyệt phương án của mình — bước xét duyệt thành
                            hình thức. */}
                        {bg.trangThai === "da_so_sanh" && quyen.xacNhanTruongBP && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setViecChoXacNhan({
                                loai: "chot_ncc",
                                nccId: c.nccId,
                                tenNCC: c.tenNCC,
                              })
                            }
                          >
                            Chọn NCC này
                          </Button>
                        )}
                        {!c.baoDuDong && (
                          <span className="text-xs font-normal text-text-desc">Báo thiếu dòng</span>
                        )}
                      </span>
                    </TableHead>
                  ))}
                  {cheDoTach && <TableHead className="text-right">Còn lại</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dong.map((d, idx) => (
                  <TableRow key={d.dong.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium text-text-primary">
                      {d.dong.tenVatLieu}
                    </TableCell>
                    <TableCell>{d.dong.donViTinh}</TableCell>
                    <TableCell className="text-right">{formatNumber(d.dong.khoiLuong)}</TableCell>
                    {cot.map((c) => {
                      const o = d.o[c.nccId];
                      const daChiaOnay = (bg.items.find((x) => x.id === d.dong.id)?.phanBo ?? []).find(
                        (p) => p.nccId === c.nccId,
                      );
                      if (!o) {
                        return (
                          <TableCell key={c.nccId} className="text-right text-text-desc">
                            Không báo giá
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={c.nccId} className="text-right">
                          <span
                            className={cn(
                              "font-medium",
                              o.laGiaThapNhat ? "text-success-soft" : "text-text-primary",
                            )}
                          >
                            {formatCurrencyVnd(o.donGia)}
                            {o.laGiaThapNhat && " · thấp nhất"}
                          </span>
                          <span className="block text-xs text-text-desc">
                            Giao {o.thoiGianGiao} ngày · TT {formatCurrencyVnd(o.thanhTien)}
                          </span>

                          {/* Ô nhập khối lượng giao cho NCC này — chỉ hiện khi đang tách */}
                          {cheDoTach && (
                            <Input
                              type="number"
                              min={0}
                              max={d.dong.khoiLuong}
                              placeholder="0"
                              value={nhap[d.dong.id]?.[c.nccId] ?? ""}
                              onChange={(e) =>
                                setNhap((t) => ({
                                  ...t,
                                  [d.dong.id]: { ...(t[d.dong.id] ?? {}), [c.nccId]: e.target.value },
                                }))
                              }
                              aria-label={`Khối lượng giao cho ${c.tenNCC} — ${d.dong.tenVatLieu}`}
                              className="mt-1.5 h-9 text-right"
                            />
                          )}

                          {/* Đã tách rồi thì hiện phần đã chia, kể cả khi không ở chế độ sửa */}
                          {!cheDoTach && daChiaOnay && (
                            <span className="mt-1 block rounded bg-primary-bg px-1.5 py-0.5 text-xs font-semibold text-primary">
                              Giao {formatNumber(daChiaOnay.khoiLuong)} {d.dong.donViTinh}
                            </span>
                          )}
                        </TableCell>
                      );
                    })}

                    {/* Cột theo dõi phần đã chia của dòng — chỉ có khi đang tách */}
                    {cheDoTach && (
                      <TableCell className="text-right whitespace-nowrap">
                        {(() => {
                          const k = ketQuaDong.find((x) => x.dongId === d.dong.id)!.kiem;
                          if (k.vuot) {
                            return (
                              <span className="inline-flex items-center gap-1 rounded bg-danger-bg px-1.5 py-0.5 text-xs font-semibold text-danger-soft">
                                <AlertTriangle className="size-3.5" aria-hidden />
                                Vượt {formatNumber(-k.conLai)}
                              </span>
                            );
                          }
                          if (k.chiaDu) {
                            return (
                              <span className="rounded bg-success-bg px-1.5 py-0.5 text-xs font-semibold text-success-soft">
                                Đã chia đủ
                              </span>
                            );
                          }
                          return (
                            <span className="text-xs text-text-desc">
                              Còn {formatNumber(k.conLai)} {d.dong.donViTinh}
                            </span>
                          );
                        })()}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={4} className="text-right">
                    Tổng giá trị
                  </TableCell>
                  {cot.map((c) => (
                    <TableCell
                      key={c.nccId}
                      className={cn(
                        "text-right",
                        c.laTongThapNhat ? "text-success-soft" : "text-text-primary",
                      )}
                    >
                      {formatCurrencyVnd(c.tongTien)}
                      {c.laTongThapNhat && (
                        <span className="block text-xs font-normal">Tổng thấp nhất</span>
                      )}
                    </TableCell>
                  ))}
                  {cheDoTach && <TableCell />}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div>
        <Button variant="outline" nativeButton={false} render={<Link href="/bao-gia" />}>
          <ArrowLeft aria-hidden /> Quay lại danh sách
        </Button>
      </div>
      {/* ===== HỘP XÁC NHẬN CHUNG cho ba việc chuyển bước ở màn này =====
          Nguyên tắc Ban lãnh đạo 10/08/2026: việc nào bấm là xong, không lùi lại được thì phải
          hỏi trước. Ba việc ở đây đều đổi bước của đề nghị trên bảng quy trình. */}
      <HopXacNhan
        mo={viecChoXacNhan !== null}
        tieuDe={
          viecChoXacNhan?.loai === "trinh_xet_duyet"
            ? "Trình trưởng bộ phận xem xét?"
            : viecChoXacNhan?.loai === "duyet_phuong_an"
              ? "Duyệt phương án chia đơn?"
              : "Chốt nhà cung cấp này?"
        }
        moTa={
          viecChoXacNhan?.loai === "trinh_xet_duyet"
            ? `Bảng báo giá ${bg.code} sẽ chuyển sang bước “Xét duyệt báo giá”, chờ trưởng bộ phận chốt.`
            : viecChoXacNhan?.loai === "duyet_phuong_an"
              ? `Bảng báo giá ${bg.code} sẽ chuyển sang bước “Lập đơn mua hàng”.`
              : viecChoXacNhan?.loai === "chot_ncc"
                ? `Chốt ${viecChoXacNhan.tenNCC} cho toàn bộ bảng báo giá ${bg.code}.`
                : undefined
        }
        canhBao={
          viecChoXacNhan?.loai === "trinh_xet_duyet"
            ? "Sau khi trình, bạn không nhập thêm giá nhà cung cấp vào bảng này được nữa."
            : "Bước này ghi vào nhật ký đề nghị và không lùi lại được. Muốn lùi phải hủy chứng từ tương ứng."
        }
        nhanDongY={
          viecChoXacNhan?.loai === "trinh_xet_duyet"
            ? "Trình xét duyệt"
            : viecChoXacNhan?.loai === "duyet_phuong_an"
              ? "Duyệt"
              : "Chốt nhà cung cấp"
        }
        onDong={() => setViecChoXacNhan(null)}
        onDongY={() => {
          const v = viecChoXacNhan;
          if (!v) return;
          if (v.loai === "trinh_xet_duyet") {
            trinhXetDuyetBaoGia(bg.id, nguoiDung.tenHienThi);
            toast.success("Đã trình trưởng bộ phận xem xét", {
              description: `${bg.prCode} chuyển sang bước “Xét duyệt báo giá”.`,
            });
            return;
          }
          if (v.loai === "duyet_phuong_an") {
            duyetPhuongAnTach(bg.id, nguoiDung.tenHienThi);
            toast.success("Đã duyệt phương án chia đơn", {
              description: `${bg.prCode} chuyển sang bước “Lập đơn mua hàng”.`,
            });
            return;
          }
          chonNCCChoBaoGia(bg.id, v.nccId, v.tenNCC, nguoiDung.tenHienThi);
          toast.success("Đã chốt nhà cung cấp", {
            description: `${v.tenNCC} — ${bg.prCode} chuyển sang “Lập đơn mua hàng”.`,
          });
        }}
      />
    </>
  );
}
