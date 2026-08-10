"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, FileWarning, Forward, ShoppingCart, Split } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { DanhSachTruong } from "@/1-giao-dien/thanh-phan-dung-chung/danh-sach-truong";
import { KhoiGap } from "@/1-giao-dien/thanh-phan-dung-chung/khoi-gap";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { BangPhanBo } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-phan-bo";
import { KhoiNguoiTheoDoi } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-nguoi-theo-doi";
import { ThanhGiaiDoan } from "@/1-giao-dien/thanh-phan-nghiep-vu/thanh-giai-doan";
import {
  CotThongTinDeNghi,
  type MocGiaiDoan,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/cot-thong-tin-de-nghi";
import { TimelineDeNghi } from "@/1-giao-dien/thanh-phan-nghiep-vu/timeline-de-nghi";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
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
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { duocXemBaoGiaCuaDeNghi } from "@/4-phan-quyen/quyen-theo-ho-so";
import { soNgayConLai, tinhTienDoDeNghi, tomTatTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import { formatMocThoiGian } from "@/6-tien-ich/dinh-dang";
import { vuongMacSangBuocSau, xacDinhGiaiDoan } from "@/2-quy-trinh/giai-doan-mua-hang";
import {
  NHAN_PHONG_BAN_NGUON,
  NHAN_TRANG_THAI_BAO_GIA,
  NHAN_TRANG_THAI_DE_NGHI,
  NHAN_TRANG_THAI_PO,
} from "@/2-quy-trinh/trang-thai";

export default function TrangChiTietDeNghi() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    deNghi,
    donHang,
    phieuNhan,
    baoGia,
    chuyenTiepChoNhanVien,
    taoBaoGiaGiaLap,
  } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  const [moChuyenTiep, setMoChuyenTiep] = useState(false);
  /** Hỏi trước khi lập bảng báo giá — việc này CHUYỂN BƯỚC đề nghị sang ② (nguyên tắc 10/08/2026). */
  const [hoiLapBaoGia, setHoiLapBaoGia] = useState(false);
  const [loiNhan, setLoiNhan] = useState("");

  const dn = deNghi.find((x) => x.id === params.id);
  const poLienQuan = useMemo(
    () => donHang.filter((po) => po.prId === params.id),
    [donHang, params.id],
  );
  const baoGiaLienQuan = useMemo(
    () => baoGia.filter((bg) => bg.prId === params.id),
    [baoGia, params.id],
  );
  /** Phiếu nhận của mọi đơn thuộc đề nghị này — dùng để lấy mốc thời gian giai đoạn nhận hàng. */
  const phieuLienQuan = useMemo(() => {
    const idDon = new Set(poLienQuan.map((po) => po.id));
    return phieuNhan.filter((p) => idDon.has(p.poId));
  }, [phieuNhan, poLienQuan]);

  const tienDo = useMemo(
    () => (dn ? tinhTienDoDeNghi(dn, donHang, phieuNhan) : []),
    [dn, donHang, phieuNhan],
  );

  if (!dn) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Không tìm thấy đề nghị"
        description="Đề nghị này không tồn tại hoặc bạn không có quyền xem."
      />
    );
  }

  const tomTat = tomTatTienDoDeNghi(tienDo);

  // Giai đoạn KHÔNG lưu thành trường — suy ra từ chứng từ thật, đúng nguyên tắc ở
  // `2-quy-trinh/giai-doan-mua-hang.ts`. Tính một lần rồi truyền xuống, tránh mỗi
  // component tự tính lại rồi lệch nhau.
  const giaiDoan = xacDinhGiaiDoan(dn, donHang, baoGia, phieuNhan);
  const conLai = soNgayConLai(dn.ngayCanHang);

  /**
   * MỐC THỜI GIAN của từng giai đoạn, lấy từ CHỨNG TỪ THẬT.
   *
   * 🔴 Chỉ điền mốc cho giai đoạn nào có chứng từ tương ứng. Giai đoạn được suy ra từ
   * chứng từ chứ không lưu lịch sử chuyển bước, nên không có cách nào biết chính xác lúc
   * nào đề nghị rời giai đoạn "xét duyệt báo giá" nếu không có bảng báo giá. Thà để trống
   * còn hơn hiện một mốc không có gì bảo đảm — cột phải đã ghi rõ điều này cho người xem.
   */
  const mocGiaiDoan: MocGiaiDoan = {
    // Thu mua tiếp nhận khi đề nghị được duyệt xong.
    tiep_nhan: dn.ngayDuyet,
    ...(baoGiaLienQuan.length > 0 && {
      yeu_cau_bao_gia: [...baoGiaLienQuan].sort((a, b) => a.ngayTao.localeCompare(b.ngayTao))[0]
        .ngayTao,
    }),
    // Chỉ tính là đã xét duyệt khi thực sự đã chốt được nhà cung cấp.
    ...(baoGiaLienQuan.some((bg) => bg.nccDaChonId) && {
      xet_duyet_bao_gia: [...baoGiaLienQuan]
        .filter((bg) => bg.nccDaChonId)
        .sort((a, b) => b.ngayCapNhat.localeCompare(a.ngayCapNhat))[0].ngayCapNhat,
    }),
    ...(poLienQuan.length > 0 && {
      lap_don_mua_hang: [...poLienQuan].sort((a, b) =>
        a.ngayLapPO.localeCompare(b.ngayLapPO),
      )[0].ngayLapPO,
      // Đặt hàng = đơn đã chốt và gửi đi. Dùng luôn ngày lập của đơn đầu tiên.
      dat_hang: [...poLienQuan].sort((a, b) => a.ngayLapPO.localeCompare(b.ngayLapPO))[0]
        .ngayLapPO,
    }),
    ...(phieuLienQuan.length > 0 && {
      nhan_hang: [...phieuLienQuan].sort((a, b) =>
        a.ngayNhanThucTe.localeCompare(b.ngayNhanThucTe),
      )[0].ngayNhanThucTe,
    }),
    // Hoàn thành: lấy lần nhận cuối cùng, chỉ khi đề nghị thật sự đã ở giai đoạn này.
    ...(giaiDoan === "hoan_thanh" &&
      phieuLienQuan.length > 0 && {
        hoan_thanh: [...phieuLienQuan].sort((a, b) =>
          b.ngayNhanThucTe.localeCompare(a.ngayNhanThucTe),
        )[0].ngayNhanThucTe,
      }),
  };

  /** Ai sẽ nhận khi bấm "Chuyển tiếp" — các nhân viên đang phụ trách ít nhất một dòng. */
  const nguoiSeNhan = [
    ...new Set(dn.items.map((d) => d.nguoiPhuTrachTen).filter((x): x is string => Boolean(x))),
  ];
  const soDongChuaPhanBo = dn.items.filter((d) => !d.nguoiPhuTrachUid).length;
  const tt = NHAN_TRANG_THAI_DE_NGHI[dn.trangThai];

  return (
    <>
      {/* NÚT QUAY LẠI — chỉ đạo Ban lãnh đạo 10/08/2026. Breadcrumb ở dưới vẫn còn,
          nhưng người dùng quen bấm một nút "quay lại" rõ ràng hơn là dò chữ nhỏ. */}
      <Button
        variant="ghost"
        size="sm"
        className="w-fit -ml-2"
        nativeButton={false}
        render={<Link href="/de-nghi" />}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại danh sách đề nghị
      </Button>

      <PageHeader
        crumbs={[
          { label: "Thu mua", href: "/tong-quan" },
          { label: "Quy trình mua hàng", href: "/de-nghi" },
          { label: dn.code },
        ]}
        title={dn.tieuDe}
        description={`${dn.code} · ${dn.tenCongTrinh} · ${NHAN_PHONG_BAN_NGUON[dn.phongBanNguon]}`}
        actions={<StatusBadge label={tt.nhan} tone={tt.tong} />}
      />

      {/* Dải mũi tên 7 bước — nhìn ra ngay đề nghị đang đứng ở đâu trong quy trình */}
      <ThanhGiaiDoan giaiDoan={giaiDoan} />

      {/* BỐ CỤC HAI CỘT (theo trang nhiệm vụ của Base): nội dung làm việc bên trái,
          thông tin tra cứu bên phải. Dưới 1024px cột phải tự xuống dưới. */}
      {/* Cột phải 320px: vùng làm việc bị giới hạn bằng bề rộng A4 ngang (~1123px) nên
          320px cho tỷ lệ ~28%, đúng như tỷ lệ cột phải trong ảnh mẫu Base.vn. */}
      <div className="grid gap-(--hp-md-section) lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-(--hp-md-section)">
          {/* ===== THÔNG TIN ĐỀ NGHỊ — danh sách trường đánh số =====
              Bố cục theo trang nhiệm vụ Base.vn (ảnh Ban lãnh đạo cung cấp 10/08/2026):
              trường nào cũng có số thứ tự để trao đổi qua điện thoại chỉ nhau được ngay
              (*"ô số 4 điền gì"*). Mở sẵn vì đây là phần đọc đầu tiên khi vào hồ sơ. */}
          <KhoiGap tieuDe="Thông tin đề nghị" moSan>
            <DanhSachTruong
              truong={[
                // `daiCaHang` cho hai trường chữ dài — để trong một ô hẹp thì bị cắt mất.
                { nhan: "Tiêu đề", giaTri: dn.tieuDe, daiCaHang: true },
                { nhan: "Tên công trình", giaTri: dn.tenCongTrinh, daiCaHang: true },
                { nhan: "Mã đề nghị", giaTri: dn.code },
                { nhan: "Mã dự án", giaTri: dn.maDuAn },
                { nhan: "Số hợp đồng CĐT", giaTri: dn.maHopDongCDT },
                { nhan: "Phòng ban đề nghị", giaTri: NHAN_PHONG_BAN_NGUON[dn.phongBanNguon] },
                { nhan: "Người đề nghị", giaTri: dn.nguoiDeNghiTen },
                {
                  nhan: "Mức độ ưu tiên",
                  giaTri: dn.mucDoUuTien === "gap" ? "Gấp" : "Bình thường",
                },
                { nhan: "Ngày đề nghị", giaTri: formatMocThoiGian(dn.ngayDeNghi) },
                { nhan: "Ngày duyệt", giaTri: formatMocThoiGian(dn.ngayDuyet) },
                { nhan: "Ngày cần hàng", giaTri: formatMocThoiGian(dn.ngayCanHang) },
                { nhan: "Số mặt hàng", giaTri: `${dn.items.length} dòng vật tư` },
              ]}
            />
          </KhoiGap>

          {/* Người theo dõi — chọn từ danh bạ nhân sự công ty, xem `khoi-nguoi-theo-doi.tsx`.
              Có tên ở đây KHÔNG mở khóa xem giá (nguyên tắc dữ liệu số 3). */}
          <KhoiNguoiTheoDoi deNghi={dn} />

      {/* Timeline tổng */}
      <Card>
        <CardContent>
          <TimelineDeNghi
            ngayDuyet={dn.ngayDuyet}
            ngayCanHang={dn.ngayCanHang}
            soDongDaNhanDu={tomTat.soDongDaNhanDu}
            tongSoDong={tomTat.tongSoDong}
            soDongDaPhanBo={tienDo.filter((d) => d.trangThaiDong !== "chua_phan_bo").length}
            soDongDaLenPO={tienDo.filter((d) => d.maPOLienQuan.length > 0).length}
          />
        </CardContent>
      </Card>

      {/* M3 — Phân bổ.
          Các nút hành động đã dời sang khối "Hoạt động chính" ở CỘT PHẢI theo bố cục
          Base.vn (chỉ đạo Ban lãnh đạo 10/08/2026) — mọi việc bấm được gom về một chỗ,
          không rải rác cạnh từng tiêu đề. */}
      <section className="flex flex-col gap-(--hp-md-row-gap)">
        <h2 className="text-h3 text-text-primary">
          {quyen.phanBoCongViec ? "Phân bổ công việc" : "Chi tiết mặt hàng"}
        </h2>
        <BangPhanBo deNghi={dn} />
      </section>

      {/* Bảng báo giá — từ 06/08/2026 menu không còn mục "Báo giá & so sánh NCC",
          nên đây là lối vào duy nhất tới module đó. Bỏ khối này là module thành mồ côi. */}
      {/* 🔴 Dùng CHUNG luật với trang bảng báo giá (chỉ đạo Ban lãnh đạo 10/08/2026): chỉ
          người được chia việc hoặc người theo dõi mới thấy. Chặn ở đây để không hiện cả mã
          bảng báo giá và danh sách nhà cung cấp đã chọn cho người không có quyền. */}
      {duocXemBaoGiaCuaDeNghi(dn, nguoiDung.uid, quyen) && (
        <section className="flex flex-col gap-(--hp-md-row-gap)">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-h3 text-text-primary">Bảng báo giá ({baoGiaLienQuan.length})</h2>
            {/* 🔴 NÚT NÀY LÀ ĐƯỜNG VÀO CHUỖI TÁCH PO. Trước 10/08/2026 bảng báo giá CHỈ tạo
                được bằng cách kéo thẻ từ cột ① sang cột ② trên bảng quy trình — khó phát hiện,
                và trên điện thoại thì không kéo được nên tắc hẳn. Không có bảng báo giá thì
                không tách được khối lượng cho nhiều nhà cung cấp, tức không tách được PO. */}
            {quyen.lapPO && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setHoiLapBaoGia(true)}
              >
                <Split className="size-4" aria-hidden />
                Lập bảng báo giá
              </Button>
            )}
          </div>
          <Card>
            <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
              {baoGiaLienQuan.length === 0 && (
                <p className="text-sm text-text-desc">
                  Chưa lập bảng báo giá nào cho đề nghị này. Bấm{" "}
                  <strong>Lập bảng báo giá</strong> để nhập giá nhiều nhà cung cấp và{" "}
                  <strong>chia một mặt hàng cho nhiều nhà cung cấp</strong> khi một bên không
                  giao đủ số lượng.
                </p>
              )}
              {baoGiaLienQuan.map((bg) => {
                const ttBG = NHAN_TRANG_THAI_BAO_GIA[bg.trangThai];
                return (
                  <Link
                    key={bg.id}
                    href={`/bao-gia/${bg.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-surface p-(--hp-md-row-pad) transition-colors hover:border-primary/40"
                  >
                    <span className="text-sm font-semibold text-text-primary">{bg.code}</span>
                    <span className="text-xs text-text-desc">{bg.tieuDe}</span>
                    <span className="text-xs text-text-desc">
                      {bg.items.length} vật tư · hạn nộp{" "}
                      {new Date(bg.hanNop).toLocaleDateString("vi-VN")}
                    </span>
                    {bg.nccDaChonTen && (
                      <span className="text-xs text-text-desc">Đã chọn: {bg.nccDaChonTen}</span>
                    )}
                    <StatusBadge label={ttBG.nhan} tone={ttBG.tong} className="ml-auto" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Đơn hàng đã tách */}
      <section className="flex flex-col gap-(--hp-md-row-gap)">
        <h2 className="text-h3 text-text-primary">Đơn đặt hàng đã tách ({poLienQuan.length})</h2>
        <Card>
          <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
            {poLienQuan.length === 0 && <p className="text-sm text-text-desc">Chưa tách đơn hàng nào.</p>}
            {poLienQuan.map((po) => {
              const ttPO = NHAN_TRANG_THAI_PO[po.trangThai];
              return (
                <Link
                  key={po.id}
                  href={`/don-hang/${po.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-surface p-(--hp-md-row-pad) transition-colors hover:border-primary/40"
                >
                  <span className="text-sm font-semibold text-text-primary">{po.code}</span>
                  {quyen.xemNguoiPhuTrach && (
                    <span className="text-xs text-text-desc">{po.nguoiPhuTrachTen}</span>
                  )}
                  {quyen.xemNhaCungCap && (
                    <span className="text-xs text-text-desc">{po.supplierTen}</span>
                  )}
                  <span className="text-xs text-text-desc">
                    {po.items.length} dòng · giao dự kiến {new Date(po.ngayGiaoDuKien).toLocaleDateString("vi-VN")}
                  </span>
                  <StatusBadge label={ttPO.nhan} tone={ttPO.tong} className="ml-auto" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {/* Lịch sử đã dời sang khối "Lịch sử hoạt động" ở CỘT PHẢI (bố cục Base.vn).
          Không để hai chỗ cùng hiện một danh sách — sửa một chỗ là lệch ngay. */}
        </div>

        {/* Cột phải — thời hạn tổng, tiến trình từng giai đoạn, hoạt động chính, lịch sử.
            ⚠️ KHÔNG dùng `sticky` nữa: cột này giờ dài (có cả lịch sử) nên dán cứng vào
            đầu trang sẽ bị cắt mất phần dưới, cuộn không tới. */}
        <aside className="min-w-0">
          <CotThongTinDeNghi
            deNghi={dn}
            giaiDoan={giaiDoan}
            soNgayConLai={conLai}
            moc={mocGiaiDoan}
            tomTat={{
              daPhanBo: tienDo.filter((d) => d.trangThaiDong !== "chua_phan_bo").length,
              daLenPO: tienDo.filter((d) => d.maPOLienQuan.length > 0).length,
              daNhanDu: tomTat.soDongDaNhanDu,
              tongSoDong: tomTat.tongSoDong,
            }}
            hoatDongChinh={
              <>
                {/* 🔴 Màn này là CHỖ LÀM VIỆC CỦA TRƯỞNG BỘ PHẬN (chỉ đạo Ban lãnh đạo
                    08/08/2026): phân bổ xong thì việc còn lại là của nhân viên, nên nút
                    CHÍNH là "Chuyển tiếp", không phải "Lập đơn đặt hàng". Vẫn giữ nút lập
                    đơn ở dạng phụ để trưởng bộ phận tự làm được khi cần. */}
                {quyen.phanBoCongViec && (
                  <Button size="sm" className="w-full" onClick={() => setMoChuyenTiep(true)}>
                    <Forward className="size-4" aria-hidden />
                    Chuyển tiếp
                  </Button>
                )}
                {quyen.lapPO && (
                  <Button
                    size="sm"
                    className="w-full"
                    variant={quyen.phanBoCongViec ? "outline" : "default"}
                    nativeButton={false}
                    render={<Link href={`/don-hang/tao-moi?prId=${dn.id}`} />}
                  >
                    <ShoppingCart className="size-4" aria-hidden />
                    Lập đơn đặt hàng
                  </Button>
                )}
              </>
            }
          />
        </aside>
      </div>

      {/* HỘP CHUYỂN TIẾP — trưởng bộ phận bàn giao việc cho nhân viên đã phân bổ */}
      <Dialog open={moChuyenTiep} onOpenChange={setMoChuyenTiep}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chuyển tiếp {dn.code}</DialogTitle>
            <DialogDescription>
              Báo cho nhân viên đã được phân bổ biết đã tới lượt họ làm các bước sau.
            </DialogDescription>
          </DialogHeader>

          {nguoiSeNhan.length === 0 ? (
            <p className="rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
              Chưa phân bổ dòng nào cho ai nên chưa chuyển tiếp được. Phân bổ ít nhất một
              dòng vật tư ở bảng bên dưới trước.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1 rounded-lg bg-muted p-(--hp-md-row-pad) text-sm">
                <span className="text-xs text-text-desc">Chuyển tiếp cho</span>
                <span className="font-medium text-text-primary">{nguoiSeNhan.join(", ")}</span>
              </div>

              {/* Cảnh báo mềm, KHÔNG chặn — giống hộp xác nhận kéo thả ở màn danh sách */}
              {soDongChuaPhanBo > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-soft" aria-hidden />
                  <span>
                    Còn <strong>{soDongChuaPhanBo} dòng</strong> chưa phân bổ cho ai — những
                    dòng đó sẽ không có người làm tiếp.
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="loi-nhan">Lời nhắn kèm theo (không bắt buộc)</Label>
                <Input
                  id="loi-nhan"
                  placeholder="Ưu tiên lấy báo giá trước ngày 20/8"
                  value={loiNhan}
                  onChange={(e) => setLoiNhan(e.target.value)}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMoChuyenTiep(false)}>
              Hủy
            </Button>
            <Button
              disabled={nguoiSeNhan.length === 0}
              onClick={() => {
                const daGui = chuyenTiepChoNhanVien(dn.id, nguoiDung.tenHienThi, loiNhan);
                setMoChuyenTiep(false);
                setLoiNhan("");
                if (daGui.length > 0) {
                  toast.success("Đã chuyển tiếp", {
                    description: `${dn.code} đã báo tới ${daGui.join(", ")}.`,
                  });
                }
              }}
            >
              <Forward className="size-4" aria-hidden />
              Chuyển tiếp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Hỏi trước khi lập bảng báo giá — việc này chuyển đề nghị sang bước ② (nguyên tắc
          Ban lãnh đạo 10/08/2026, xem `HopXacNhan`). */}
      <HopXacNhan
        mo={hoiLapBaoGia}
        tieuDe="Lập bảng báo giá cho đề nghị này?"
        moTa={`Hệ thống lập bảng báo giá cho ${dn.items.length} mặt hàng của ${dn.code} để bạn mời nhà cung cấp chào giá.`}
        canhBao="Đề nghị sẽ chuyển sang bước “Yêu cầu NCC báo giá” trên bảng quy trình. Muốn lùi lại phải hủy bảng báo giá."
        nhanDongY="Lập bảng báo giá"
        onDong={() => setHoiLapBaoGia(false)}
        onDongY={() => {
          // Bước trước phải xong mới đi tiếp — dùng chung luật với kéo thả và nút nhận công tác.
          const vuongMac = vuongMacSangBuocSau(dn, "tiep_nhan", baoGiaLienQuan);
          if (vuongMac) {
            toast.error("Chưa xong bước Tiếp nhận và kiểm tra", { description: vuongMac });
            return;
          }
          const id = taoBaoGiaGiaLap(dn.id, nguoiDung.tenHienThi);
          if (id) {
            toast.success("Đã lập bảng báo giá", {
              description: "Nhập giá các nhà cung cấp, rồi trình trưởng bộ phận xem xét.",
            });
            router.push(`/bao-gia/${id}`);
          } else {
            toast.error("Không lập được bảng báo giá", {
              description: "Đã hết mã dự phòng cho bản chạy thử.",
            });
          }
        }}
      />
    </>
  );
}
