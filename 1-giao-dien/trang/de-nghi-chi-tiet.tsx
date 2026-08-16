"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  FileWarning,
  GitBranch,
  Forward,
  ShoppingCart,
  Split,
} from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { nhanPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";
import { NHAN_NHOM_DE_XUAT } from "@/3-du-lieu/kieu-du-lieu";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { LienKetTep } from "@/1-giao-dien/thanh-phan-dung-chung/lien-ket-tep";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { DanhSachTruong } from "@/1-giao-dien/thanh-phan-dung-chung/danh-sach-truong";
import { KhoiGap } from "@/1-giao-dien/thanh-phan-dung-chung/khoi-gap";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { BangPhanBo } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-phan-bo";
import { BangNangLucTheoNhanVien } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-nang-luc-theo-nhan-vien";
import { KhoiNguoiTheoDoi } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-nguoi-theo-doi";
import { KhoiTraoDoi } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-trao-doi";
import { ThanhGiaiDoan } from "@/1-giao-dien/thanh-phan-nghiep-vu/thanh-giai-doan";
import {
  CotThongTinDeNghi,
  type MocGiaiDoan,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/cot-thong-tin-de-nghi";
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
import { caiDatCuaBuoc } from "@/2-quy-trinh/cau-hinh-quy-trinh";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { duocXemBaoGiaCuaDeNghi } from "@/4-phan-quyen/quyen-theo-ho-so";
import { soNgayConLai } from "@/2-quy-trinh/tinh-toan";
import { formatMocThoiGian } from "@/6-tien-ich/dinh-dang";
import {
  giaiDoanDaKetThuc,
  NHAN_GIAI_DOAN,
  vuongMacLapDonHang,
  vuongMacSangBuocSau,
  xacDinhGiaiDoan,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import {
  nhanAnToan,
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
    cauHinh,
    danhDauCongViecGiaiDoan,
    vietBinhLuan,
    suaBinhLuan,
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
  /**
   * Các đề xuất con đã tách ra từ phiếu này — để "tổng hợp lại các đề xuất con của cái đề
   * xuất lớn" (Ban lãnh đạo 13/08/2026). Lọc theo `deNghiGocId`, KHÔNG theo tên.
   */
  const deNghiCon = useMemo(
    () => deNghi.filter((d) => d.deNghiGocId === params.id),
    [deNghi, params.id],
  );
  /** Phiếu nhận của mọi đơn thuộc đề nghị này — dùng để lấy mốc thời gian giai đoạn nhận hàng. */
  const phieuLienQuan = useMemo(() => {
    const idDon = new Set(poLienQuan.map((po) => po.id));
    return phieuNhan.filter((p) => idDon.has(p.poId));
  }, [phieuNhan, poLienQuan]);

  /* 📌 Không còn tính `tienDo` ở trang này (15/08/2026): khối "Hoạt động chính" và timeline
     ngang — hai chỗ duy nhất dùng nó — đã bỏ theo yêu cầu Ban lãnh đạo. Bảng Phân bổ tự tính
     lấy phần của nó, nên tính lại ở đây là thừa. */

  if (!dn) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Không tìm thấy đề nghị"
        description="Đề nghị này không tồn tại hoặc bạn không có quyền xem."
      />
    );
  }


  // Giai đoạn KHÔNG lưu thành trường — suy ra từ chứng từ thật, đúng nguyên tắc ở
  // `2-quy-trinh/giai-doan-mua-hang.ts`. Tính một lần rồi truyền xuống, tránh mỗi
  // component tự tính lại rồi lệch nhau.
  const giaiDoan = xacDinhGiaiDoan(dn, donHang, baoGia, phieuNhan);
  const conLai = soNgayConLai(dn.ngayCanHang);

  /**
   * Lý do CHƯA lập được đơn đặt hàng — `null` là lập được.
   *
   * Dùng CHUNG hàm với chốt chặn thật trong `themDonHang`, nên nút bị khóa vì lý do gì thì
   * đúng là lý do app sẽ chặn — không có chuyện nút mở mà bấm vào lại báo lỗi, hay ngược lại.
   */
  const chanLapDon = vuongMacLapDonHang(baoGia.filter((b) => b.prId === dn.id));

  /**
   * Công việc bắt buộc của bước ĐANG ĐỨNG — mục "Danh sách công việc" của bảng Base.
   * Bước không khai việc nào thì mảng rỗng (ảnh Base ghi "Không có công việc").
   */
  const congViecCuaBuoc = cauHinh.congViecTheoBuoc?.[giaiDoan] ?? [];
  /** Cài đặt riêng của bước — quyết định có hiện nút "Chuyển tiếp", có bắt buộc xong việc... */
  const caiDatBuoc = caiDatCuaBuoc(cauHinh, giaiDoan);

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
  const tt = nhanAnToan(NHAN_TRANG_THAI_DE_NGHI, dn.trangThai);

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
        description={`${dn.code} · ${dn.tenCongTrinh} · ${nhanPhongBan(dn.phongBanNguon)}`}
        actions={
          /* ★ NÚT HÀNH ĐỘNG LÊN ĐẦU TRANG — Ban lãnh đạo 15/08/2026 chốt bỏ khối "Hoạt động
             chính" ở cột phải vì trùng thông tin. Hai nút trong đó dời lên đây, đúng chỗ
             Base đặt (góc trên phải, cạnh tiêu đề).

             📌 Đặt cạnh trạng thái là hợp lý: người mở hồ sơ nhìn một chỗ thấy ngay "đang ở
             tình trạng nào" và "làm gì tiếp được". */
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={tt.nhan} tone={tt.tong} />
            {/* ⚙️ Nút này BẬT/TẮT ĐƯỢC ở trang Cài đặt quy trình → ô "Cho phép giao lại
                nhiệm vụ cho người khác" của từng bước. Base đặt "Không cho phép" ở cả 8 giai
                đoạn; app để Ban lãnh đạo tự chọn thay vì âm thầm gỡ nút đang chạy. */}
            {quyen.phanBoCongViec && caiDatBuoc.chuyenViecDuoc && (
              <Button size="sm" onClick={() => setMoChuyenTiep(true)}>
                <Forward className="size-4" aria-hidden />
                Chuyển tiếp
              </Button>
            )}
            {/* ★ KHÓA NÚT KHI CHƯA DUYỆT BÁO GIÁ — Ban lãnh đạo 15/08/2026: *"bước này sao
                trưởng phòng chưa duyệt đã đẩy qua tiến hành đặt hàng rồi"*.

                🔴 Nút này là đường CHÍNH dẫn tới việc lập đơn, mà trước đây nó mở ở MỌI bước:
                đang ở bước ① cũng bấm được, lập xong là thẻ nhảy thẳng lên bước ⑤, bỏ qua cả
                xét duyệt báo giá lẫn lập đơn mua hàng.

                📌 Khóa kèm lý do chứ không ẩn: ẩn nút thì người dùng tưởng app thiếu chức
                năng và đi tìm đường khác; ghi rõ "chưa duyệt báo giá" thì họ biết phải làm gì.
                Chốt chặn thật nằm ở `themDonHang` — đây chỉ là phép lịch sự. */}
            {quyen.lapPO &&
              (chanLapDon ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                  title={chanLapDon}
                  aria-label={`Chưa lập đơn đặt hàng được: ${chanLapDon}`}
                >
                  <ShoppingCart className="size-4" aria-hidden />
                  Lập đơn đặt hàng
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant={quyen.phanBoCongViec ? "outline" : "default"}
                  nativeButton={false}
                  render={<Link href={`/don-hang/tao-moi?prId=${dn.id}`} />}
                >
                  <ShoppingCart className="size-4" aria-hidden />
                  Lập đơn đặt hàng
                </Button>
              ))}
          </div>
        }
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
              (*"ô số 4 điền gì"*).

              📌 GẬP SẴN từ 15/08/2026 (Ban lãnh đạo: *"hãy luôn group này lại"*). Phần lớn
              thông tin ở đây đã có ở tiêu đề trang và khối "Thông tin nhiệm vụ" bên phải;
              mở sẵn thì đẩy phần việc thật (phân bổ, báo giá, đơn hàng) xuống dưới màn hình.
              Cần tra chi tiết thì bấm một cái là mở. */}
          <KhoiGap tieuDe="Thông tin đề nghị">
            <DanhSachTruong
              truong={[
                // `daiCaHang` cho hai trường chữ dài — để trong một ô hẹp thì bị cắt mất.
                { nhan: "Tiêu đề", giaTri: dn.tieuDe, daiCaHang: true },
                { nhan: "Tên công trình", giaTri: dn.tenCongTrinh, daiCaHang: true },
                { nhan: "Mã đề nghị", giaTri: dn.code },
                { nhan: "Mã dự án", giaTri: dn.maDuAn },
                { nhan: "Số hợp đồng CĐT", giaTri: dn.maHopDongCDT },
                { nhan: "Phòng ban đề nghị", giaTri: nhanPhongBan(dn.phongBanNguon) },
                // Nhóm đề xuất — trường của thẻ Base (14/08/2026). Phiếu cũ không có thì đọc
                // là "Khác", KHÔNG đoán ngược từ nội dung vật tư.
                { nhan: "Nhóm đề xuất", giaTri: NHAN_NHOM_DE_XUAT[dn.nhomDeXuat ?? "khac"] },
                { nhan: "Người đề nghị", giaTri: dn.nguoiDeNghiTen },
                {
                  nhan: "Mức độ ưu tiên",
                  giaTri: dn.mucDoUuTien === "gap" ? "Gấp" : "Bình thường",
                },
                { nhan: "Ngày đề nghị", giaTri: formatMocThoiGian(dn.ngayDeNghi) },
                {
                  nhan: "Ngày duyệt",
                  // ⚠️ Phiếu lập trong "thời kỳ duyệt hai cấp" (sáng 12/08/2026) có thể còn
                  // `ngayDuyet` rỗng — format chuỗi rỗng ra "Invalid Date" nên phải chặn.
                  giaTri: dn.ngayDuyet ? formatMocThoiGian(dn.ngayDuyet) : "—",
                },
                { nhan: "Ngày cần hàng", giaTri: formatMocThoiGian(dn.ngayCanHang) },
                { nhan: "Số mặt hàng", giaTri: `${dn.items.length} dòng vật tư` },
              ]}
            />

            {/* ★ NHÓM ĐỀ XUẤT — Ban lãnh đạo 13/08/2026: *"để sau này có thể tổng hợp lại
                các đề xuất con của cái đề xuất lớn đó"*.

                Hiện ở CẢ HAI chiều: đứng ở phiếu con thì thấy đường về phiếu lớn, đứng ở
                phiếu lớn thì thấy đủ các phần đã tách ra. Thiếu một chiều là người dùng
                phải nhớ trong đầu mình đã tách những gì — đúng thứ app sinh ra để bỏ.

                📌 Quan hệ dựa trên `deNghiGocId` chứ không dựa vào tên: sửa tên một bản
                copy vẫn không làm đứt nhóm. */}
            {dn.deNghiGocId && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary-bg p-(--hp-md-row-pad) text-sm">
                <GitBranch className="size-4 shrink-0 text-primary" aria-hidden />
                <span className="text-text-secondary">Tách ra từ đề xuất</span>
                <Link
                  href={`/de-nghi/${dn.deNghiGocId}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {dn.maDeNghiGoc ?? dn.deNghiGocId}
                </Link>
              </div>
            )}
            {deNghiCon.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-primary/30 bg-primary-bg p-(--hp-md-row-pad)">
                <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <GitBranch className="size-4 shrink-0 text-primary" aria-hidden />
                  Đã tách thành {deNghiCon.length} đề xuất con
                </p>
                <ul className="flex flex-col gap-1">
                  {deNghiCon.map((con) => (
                    <li key={con.id} className="flex min-w-0 flex-wrap items-center gap-x-2 text-sm">
                      <Link
                        href={`/de-nghi/${con.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {con.code}
                      </Link>
                      <span className="truncate text-xs text-text-desc">
                        {con.items.length} mặt hàng
                        {/* Người phụ trách của phiếu con — biết ai đang làm phần nào mà
                            không phải mở từng phiếu ra xem. */}
                        {(() => {
                          const ds = [
                            ...new Set(
                              con.items
                                .map((x) => x.nguoiPhuTrachTen)
                                .filter((x): x is string => Boolean(x)),
                            ),
                          ];
                          return ds.length > 0 ? ` · ${ds.join(", ")}` : " · chưa giao ai";
                        })()}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-text-desc">
                  Khối lượng của các phiếu con <strong>không cộng vào</strong> phiếu này — mỗi
                  phiếu đi một vòng mua hàng riêng.
                </p>

                {/* ★ TỔNG HỢP THEO NGƯỜI — Ban lãnh đạo 15/08/2026: tách việc rồi phải
                    "tổng hợp lại được để trưởng phòng đánh giá năng lực nhân viên".

                    🔒 Chỉ người phân bổ công việc (trưởng bộ phận, quản trị) mới thấy: đây là
                    số liệu về người khác, nhân viên nhìn nhau qua bảng này dễ sinh so bì mà
                    số liệu lại chưa tính độ khó từng phần việc. */}
                {quyen.phanBoCongViec && (
                  <div className="mt-1 border-t border-primary/20 pt-2">
                    <BangNangLucTheoNhanVien
                      nhom={[dn, ...deNghiCon]}
                      donHang={donHang}
                      baoGia={baoGia}
                      phieuNhan={phieuNhan}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tài liệu đính kèm lúc lập phiếu — nội dung nằm trên máy chủ (kho tệp),
                bấm tên tệp để mở. Không có thì không hiện, đừng chiếm chỗ bằng khối rỗng. */}
            {dn.taiLieu && dn.taiLieu.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-(--hp-md-row-pad)">
                <p className="text-sm font-semibold text-text-primary">
                  Tài liệu đính kèm ({dn.taiLieu.length})
                </p>
                <ul className="flex flex-col gap-1">
                  {dn.taiLieu.map((t) => (
                    <li key={t.id} className="flex min-w-0 items-center gap-2 text-sm">
                      <LienKetTep tep={t} />
                      <span className="shrink-0 text-xs text-text-desc">{t.nguoiTaiTen}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </KhoiGap>

          {/* 📌 15/08/2026 — Ban lãnh đạo:
                · *"bố cục lại sang tab phải"* → khối **Người theo dõi** đã dời sang cột phải
                · *"mục này đã có trong tab theo dõi đề nghị thì ở đây ko cần hiển thị"* →
                  **Timeline ngang** (Duyệt → Đã phân bổ → Đã lên đơn → Đang giao → Nhận đủ)
                  đã BỎ, vì màn "Theo dõi đề nghị" đã vẽ đúng thứ đó.
             Cột trái giờ chỉ còn phần LÀM VIỆC: công việc của bước, phân bổ, báo giá, đơn hàng. */}

      {/* ★ CÔNG VIỆC BẮT BUỘC CỦA BƯỚC ĐANG ĐỨNG — mục "Danh sách công việc" của bảng Base
          (Ban lãnh đạo gửi ảnh cài đặt giai đoạn 14/08/2026).

          📌 Chỉ hiện khi bước hiện tại CÓ khai công việc. Năm bước còn lại trong ảnh ghi
          "Không có công việc", hiện khối rỗng chỉ làm trang dài ra.

          ⚠️ Đặt NGAY TRÊN bảng phân bổ, vì đây là việc phải làm TRƯỚC khi giao việc đi hỏi
          giá — kiểm tồn kho xong mới biết có cần mua hay không. */}
      {congViecCuaBuoc.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
            {/* Tên khối và cách xếp bám đúng Base (ảnh Ban lãnh đạo gửi 16/08/2026): tiêu đề
                "Danh sách công việc", ngay dưới là TÊN GIAI ĐOẠN đang đứng, rồi tới các việc.
                Người của phòng đã quen bảng Base nên đọc không phải dịch lại trong đầu. */}
            <div className="flex flex-col gap-1">
              <h2 className="text-h3 text-text-primary">Danh sách công việc</h2>
              <p className="text-xs font-semibold tracking-wide text-text-desc uppercase">
                {NHAN_GIAI_DOAN[giaiDoan]?.nhan ?? giaiDoan}
              </p>
            </div>
            <ul className="flex flex-col gap-2">
              {congViecCuaBuoc.map((cv) => {
                const xong = (dn.congViecDaXong ?? []).find((x) => x.maCongViec === cv.ma);
                return (
                  <li
                    key={cv.ma}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5">
                      {/* Vùng chạm ≥44px theo Design System V1.1 — ô tích nhỏ nhưng cả nhãn
                          bấm được nên vùng thật rộng hơn nhiều. */}
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 accent-primary"
                        checked={Boolean(xong)}
                        disabled={!quyen.phanBoCongViec}
                        onChange={(e) =>
                          danhDauCongViecGiaiDoan(
                            dn.id,
                            cv,
                            giaiDoan,
                            e.target.checked,
                            nguoiDung.tenHienThi,
                          )
                        }
                      />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-medium text-text-primary">
                          {cv.ten}
                          {cv.batBuoc && <span className="text-danger"> *</span>}
                        </span>
                        {cv.moTa && <span className="text-xs text-text-desc">{cv.moTa}</span>}
                        {/* Ai tích, lúc nào — cùng thông tin đã vào nhật ký đề nghị. */}
                        {xong && (
                          <span className="text-xs text-success-soft">
                            {xong.nguoiXongTen} · {formatMocThoiGian(xong.thoiDiem)}
                          </span>
                        )}
                      </span>
                    </label>
                    <StatusBadge
                      label={xong ? "Đã xong" : "Chưa xong"}
                      tone={xong ? "success" : "neutral"}
                    />
                  </li>
                );
              })}
            </ul>
            {/* Nói rõ ai được tích, thay vì để ô mờ không lời giải thích. */}
            {!quyen.phanBoCongViec && (
              <p className="text-xs text-text-desc">
                Chỉ Trưởng bộ phận Thu mua tích được các việc này.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* M3 — Phân bổ.
          Các nút hành động đã dời sang khối "Hoạt động chính" ở CỘT PHẢI theo bố cục
          Base.vn (chỉ đạo Ban lãnh đạo 10/08/2026) — mọi việc bấm được gom về một chỗ,
          không rải rác cạnh từng tiêu đề. */}
      <section className="flex flex-col gap-(--hp-md-row-gap)">
        <h2 className="text-h3 text-text-primary">
          {quyen.phanBoCongViec ? "Phân bổ công việc" : "Chi tiết mặt hàng"}
        </h2>
        {/* Công cụ phân bổ hàng loạt chỉ bày ở bước ①, HOẶC khi còn dòng chưa ai nhận (thêm
            vật tư mới ở bước sau) — Ban lãnh đạo 15/08/2026. Xem `dangOBuocPhanBo`. */}
        <BangPhanBo
          deNghi={dn}
          dangOBuocPhanBo={giaiDoan === "tiep_nhan" || soDongChuaPhanBo > 0}
          // Hồ sơ đã chốt (hoàn thành / đóng dở) thì khóa mọi thao tác đổi nội dung —
          // Ban lãnh đạo 15/08/2026. Dùng `giaiDoanDaKetThuc` cho khớp với luật chung.
          hoSoDaDong={giaiDoanDaKetThuc(giaiDoan)}
        />
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
            {/* 📌 CHỈ HIỆN KHI CHƯA CÓ BẢNG NÀO — Ban lãnh đạo 15/08/2026 khoanh nút này và
                ghi *"bỏ nút này"*, trên màn đã có sẵn `260001-HPCS-BG-001` đang thu thập.

                🔴 Bỏ HẲN thì không còn đường lập bảng báo giá đầu tiên — đúng lỗi "làm module
                mồ côi" mà CLAUDE.md mục 3.4b cảnh báo (phiên 03 suýt mắc với module Báo giá).
                Nên chỉ ẩn khi đã có bảng: lúc đó thêm nhà cung cấp là việc làm BÊN TRONG bảng
                đang có, không phải lập bảng thứ hai. */}
            {quyen.lapPO && baoGiaLienQuan.length === 0 && (
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
                const ttBG = nhanAnToan(NHAN_TRANG_THAI_BAO_GIA, bg.trangThai);
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

      {/* Đơn đặt hàng của đề nghị này */}
      <section className="flex flex-col gap-(--hp-md-row-gap)">
        {/* 📌 Tiêu đề gọi thẳng là "Đơn đặt hàng" (Ban lãnh đạo 15/08/2026). Chữ "đã tách" là
            cách nói của người làm hệ thống — với người dùng thì đây đơn giản là danh sách đơn
            của đề nghị này, dù có tách cho nhiều nhà cung cấp hay chỉ một đơn duy nhất. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-h3 text-text-primary">Đơn đặt hàng ({poLienQuan.length})</h2>
          {/* ★ TÁCH ĐƠN NGAY TẠI ĐÂY — Ban lãnh đạo 15/08/2026: *"thêm tính năng tách đơn cho
              tài khoản nhân viên"*.

              🔴 Nhân viên VỐN ĐÃ có quyền lập đơn (`lapPO` mở cho nhân viên thu mua cấp ≥2),
              nhưng đường vào chỉ có MỘT nút ở tận đầu trang. Đứng ở khối đơn hàng — đúng lúc
              nhìn thấy "cần thêm một đơn nữa cho nhà cung cấp khác" — thì không có nút nào.
              Người dùng tưởng mình không được tách và đi nhờ trưởng bộ phận.

              📌 Dùng CHUNG `chanLapDon` với nút đầu trang: hai nút không bao giờ nói khác nhau
              về việc có được lập đơn hay chưa. */}
          {quyen.lapPO &&
            !giaiDoanDaKetThuc(giaiDoan) &&
            (chanLapDon ? (
              <Button size="sm" variant="outline" disabled title={chanLapDon}>
                <ShoppingCart className="size-4" aria-hidden />
                {poLienQuan.length === 0 ? "Lập đơn đặt hàng" : "Tách thêm đơn"}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href={`/don-hang/tao-moi?prId=${dn.id}`} />}
              >
                <ShoppingCart className="size-4" aria-hidden />
                {poLienQuan.length === 0 ? "Lập đơn đặt hàng" : "Tách thêm đơn"}
              </Button>
            ))}
        </div>
        <Card>
          <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
            {/* ★ NÓI RÕ VÌ SAO NÚT LẬP ĐƠN ĐANG KHÓA — Ban lãnh đạo 15/08/2026 chỉ vào nút xám
                và hỏi *"sao nút này không dùng được"*.

                🔴 App chặn ĐÚNG (bảng báo giá còn đang thu thập, chưa qua xét duyệt — chính
                luật Ban lãnh đạo yêu cầu hôm nay), nhưng lý do chỉ nằm trong `title`, mà
                `title` phải rê chuột mới thấy và trên máy tính bảng thì không có. Nút xám
                không lời giải thích trông y như app hỏng. */}
            {quyen.lapPO && chanLapDon && !giaiDoanDaKetThuc(giaiDoan) && (
              <p className="flex items-start gap-2 rounded-lg border border-warning bg-warning-bg px-3 py-2 text-sm text-warning-soft">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <strong>Chưa lập được đơn đặt hàng.</strong> {chanLapDon}
                </span>
              </p>
            )}
            {poLienQuan.length === 0 && (
              <p className="text-sm text-text-desc">
                Chưa có đơn đặt hàng nào. Một đề nghị tách được thành nhiều đơn khi chia hàng
                cho nhiều nhà cung cấp.
              </p>
            )}
            {poLienQuan.map((po) => {
              const ttPO = nhanAnToan(NHAN_TRANG_THAI_PO, po.trangThai);
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

      {/* ★ TRAO ĐỔI — thẻ Bình luận + thẻ Lịch sử hoạt động, đặt ở CỘT GIỮA (Ban lãnh đạo
          15/08/2026: *"mục bình luận này e kéo ra tab giữa luôn"*).

          🔴 Ban đầu đặt ở cột phải cùng khối Người theo dõi, nhưng cột đó chỉ rộng ~300px:
          ô soạn bị bóp còn hai chữ một dòng, nút "Gửi bình luận" tràn ra ngoài khung, câu
          hướng dẫn dài hơn cả ô nhập. Bình luận là chỗ NGƯỜI TA GÕ, không phải thông tin tra
          cứu — nó thuộc vùng làm việc chính. */}
      <KhoiTraoDoi
        deNghi={dn}
        nguoiDung={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
        onGui={(noiDung, tep, traLoiChoId) =>
          vietBinhLuan(
            dn.id,
            { uid: nguoiDung.uid, ten: nguoiDung.tenHienThi },
            noiDung,
            tep,
            traLoiChoId,
          )
        }
        onSua={(binhLuanId, noiDungMoi, tepThem, idTepGo) => {
          const loi = suaBinhLuan(
            dn.id,
            binhLuanId,
            { uid: nguoiDung.uid, ten: nguoiDung.tenHienThi },
            noiDungMoi,
            tepThem,
            idTepGo,
          );
          // Bị chặn thì nói ĐÚNG LÝ DO — luật ở tầng dữ liệu, không đoán lại ở đây.
          if (loi) toast.error("Chưa sửa được bình luận", { description: loi });
        }}
        // Trưởng bộ phận xem lại được nội dung của bài đã thu hồi từ trước.
        duocXemBaiThuHoi={quyen.xacNhanTruongBP}
      />
        </div>

        {/* Cột phải — thời hạn tổng, tiến trình từng giai đoạn, hoạt động chính, lịch sử.
            ⚠️ KHÔNG dùng `sticky` nữa: cột này giờ dài (có cả lịch sử) nên dán cứng vào
            đầu trang sẽ bị cắt mất phần dưới, cuộn không tới. */}
        <aside className="flex min-w-0 flex-col gap-(--hp-md-section)">
          <CotThongTinDeNghi
            deNghi={dn}
            giaiDoan={giaiDoan}
            soNgayConLai={conLai}
            moc={mocGiaiDoan}
            // Hạn chuẩn từng bước lấy từ cấu hình quy trình (sửa được ở trang Cài đặt),
            // KHÔNG viết cứng trong component hiển thị.
            hanGioTheoBuoc={cauHinh.hanGioTheoBuoc}
          />

          {/* ★ NGƯỜI THEO DÕI — cột phải, NGAY TRÊN khối trao đổi (Ban lãnh đạo 15/08/2026:
              *"mục người theo dõi này đưa xuống dưới, trên mục lịch sử hoạt động"*).
              Hợp lý: "ai đang nắm hồ sơ" đứng liền trên chỗ những người đó trao đổi và chỗ
              ghi lại họ đã làm gì.
              ⚠️ Có tên ở đây KHÔNG mở khóa xem giá (nguyên tắc dữ liệu số 3). */}
          <KhoiNguoiTheoDoi deNghi={dn} />
        </aside>
      </div>

      {/* HỘP CHUYỂN TIẾP — trưởng bộ phận bàn giao việc cho nhân viên đã phân bổ */}
      <Dialog open={moChuyenTiep} onOpenChange={setMoChuyenTiep}>
        <DialogContent className="sm:max-w-lg">
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
          /**
           * Bước trước phải xong mới đi tiếp — dùng chung luật với kéo thả.
           *
           * 🔴 KIỂM THEO BƯỚC ĐANG ĐỨNG, KHÔNG viết cứng "tiep_nhan". Đã dính lỗi thật
           * 15/08/2026: phiếu đã sang bước ② nhưng chỗ này vẫn xét luật bước ①, mà bước ① có
           * việc bắt buộc "Checkin hàng tồn kho" — nhân viên bấm "Lập bảng báo giá" thì bị
           * chặn bằng một câu nói về bước họ đã đi qua từ lâu, không hiểu vì sao.
           */
          const vuongMac = vuongMacSangBuocSau(dn, giaiDoan, baoGiaLienQuan, cauHinh);
          if (vuongMac) {
            toast.error(`Chưa xong bước ${NHAN_GIAI_DOAN[giaiDoan]?.nhan ?? giaiDoan}`, {
              description: vuongMac,
            });
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
