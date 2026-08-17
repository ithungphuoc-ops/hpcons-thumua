"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  FileText,
  FileWarning,
  GitBranch,
  Forward,
  Package,
  ShoppingCart,
} from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { nhanPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";
import { NHAN_NHOM_DE_XUAT } from "@/3-du-lieu/kieu-du-lieu";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { LienKetTep } from "@/1-giao-dien/thanh-phan-dung-chung/lien-ket-tep";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { DanhSachTruong } from "@/1-giao-dien/thanh-phan-dung-chung/danh-sach-truong";
import { KhoiGap } from "@/1-giao-dien/thanh-phan-dung-chung/khoi-gap";
import { BangPhanBo } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-phan-bo";
import { KhoiDeXuatCon } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-de-xuat-con";
import { OSuaSoBaoGia } from "@/1-giao-dien/thanh-phan-nghiep-vu/o-sua-so-bao-gia";
import { KhoiNguoiTheoDoi } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-nguoi-theo-doi";
import { KhoiTraoDoi } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-trao-doi";
import {
  KhoiDauVaoTheoGiaiDoan,
  NhanPhanTrongGiaiDoan,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-dau-vao-theo-giai-doan";
import { KhuDinhKemGiaiDoan } from "@/1-giao-dien/thanh-phan-nghiep-vu/khu-dinh-kem-giai-doan";
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
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { duocXemBaoGiaCuaDeNghi } from "@/4-phan-quyen/quyen-theo-ho-so";
import { soNgayConLai } from "@/2-quy-trinh/tinh-toan";
import { formatMocThoiGian } from "@/6-tien-ich/dinh-dang";
import {
  giaiDoanDaKetThuc,
  NHAN_GIAI_DOAN,
  vuongMacLapDonHang,
  xacDinhGiaiDoan,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import {
  nhanAnToan,
  NHAN_TRANG_THAI_BAO_GIA,
  NHAN_TRANG_THAI_PO,
} from "@/2-quy-trinh/trang-thai";

export default function TrangChiTietDeNghi() {
  const params = useParams<{ id: string }>();
  const {
    deNghi,
    donHang,
    phieuNhan,
    baoGia,
    chuyenTiepChoNhanVien,
    cauHinh,
    danhDauCongViecGiaiDoan,
    vietBinhLuan,
    suaBinhLuan,
    datSoBaoGiaChoPhieu,
  } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  const [moChuyenTiep, setMoChuyenTiep] = useState(false);
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

  /**
   * HỒ SƠ ĐÃ ĐÓNG (hoàn thành / đóng dở) — khóa mọi thao tác đổi nội dung.
   *
   * 📌 Tính một lần rồi dùng chung cho bảng Phân bổ và các khu đính kèm của sáu bước, để
   * hai chỗ không bao giờ chặn theo hai luật khác nhau.
   */
  const hoSoDaDong = giaiDoanDaKetThuc(giaiDoan);

  /**
   * ★ AI ĐƯỢC GẮN / GỠ TỆP CỦA TỪNG BƯỚC (Ban lãnh đạo 17/08/2026).
   *
   * 🔴 KHÔNG BỊA CỜ QUYỀN MỚI. `4-phan-quyen/quyen.ts` không có cờ nào mang nghĩa "được sửa
   * nội dung đề nghị này" — đã tra hết 16 cờ. Nên dùng lại đúng luật đã có sẵn cho khối
   * **Người theo dõi** ở cột phải trang này (`khoi-nguoi-theo-doi.tsx`): *"Chỉ Thu mua được
   * sửa danh sách. Vai trò khác vẫn xem được, chỉ không thêm/bỏ."*
   *
   * Vì sao đúng cho việc này:
   *   · `lapPO` mở cho **nhân viên thu mua cấp ≥2** — chính người nhận báo giá nhà cung cấp
   *     gửi về qua Zalo/email, tức người mà tính năng này sinh ra để phục vụ.
   *   · `phanBoCongViec` là trưởng bộ phận và quản trị.
   *   · Vai trò chỉ đọc (thủ kho, kế toán, QLDA, Phòng Thi công) **xem được nhưng không gỡ
   *     được** — gỡ chứng từ khỏi hồ sơ là làm mất bằng chứng, không phải việc của họ.
   *
   * ⚠️ Đây CHƯA phải bảo mật thật, chỉ chặn ở giao diện. Chốt chặn hồ sơ đã đóng nằm ở tầng
   * dữ liệu (`themTepGiaiDoan` / `goTepGiaiDoan`); còn chặn theo vai trò thì phải làm bằng
   * Firestore Security Rules khi lên bản thật.
   */
  const duocSuaTepBuoc = quyen.phanBoCongViec || quyen.lapPO;

  /** Ai sẽ nhận khi bấm "Chuyển tiếp" — các nhân viên đang phụ trách ít nhất một dòng. */
  const nguoiSeNhan = [
    ...new Set(dn.items.map((d) => d.nguoiPhuTrachTen).filter((x): x is string => Boolean(x))),
  ];
  const soDongChuaPhanBo = dn.items.filter((d) => !d.nguoiPhuTrachUid).length;

  return (
    <>
      {/* NÚT QUAY LẠI — chỉ đạo Ban lãnh đạo 10/08/2026. Breadcrumb ở dưới vẫn còn,
          nhưng người dùng quen bấm một nút "quay lại" rõ ràng hơn là dò chữ nhỏ. */}
      {/* BỐ CỤC HAI CỘT (theo trang nhiệm vụ của Base): nội dung làm việc bên trái,
          thông tin tra cứu bên phải. Dưới 1024px cột phải tự xuống dưới. */}
      {/* Cột phải rộng THEO TỶ LỆ ~27% chứ không cố định 320px: vùng làm việc đã bỏ
          giới hạn 1440px nên trải kín màn hình — cột phải cố định sẽ càng ngày càng
          lép so với cột trái trên màn rộng, mất cân đối như ảnh Ban lãnh đạo gửi
          16/08/2026. Tỷ lệ ~27% lấy theo ảnh mẫu Base.vn trong cùng đợt phản hồi đó.
          Hai chỗ minmax đều có lý do sống còn:
          · Cột trái minmax(0,1fr): không có sàn 0 thì bảng rộng bên trong lấy min-content
            làm sàn, đẩy vỡ grid và tràn ngang cả trang.
          · Cột phải minmax(320px,27%): sàn 320px giữ cho các khối tra cứu không bị bóp
            nát trên màn hẹp (1280px trở xuống, khi 27% chỉ còn ~260px). */}
      <div className="grid gap-(--hp-md-section) lg:grid-cols-[minmax(0,1fr)_minmax(320px,27%)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-(--hp-md-section)">
          {/* 🔴 NÚT QUAY LẠI · TIÊU ĐỀ · DẢI BƯỚC NẰM TRONG CỘT TRÁI — Ban lãnh đạo 17/08/2026:
              *"kéo tịnh tiến lên trên"* (mũi tên chỉ vào khoảng trống góc trên phải).

              Trước đó ba khối này chiếm hết bề ngang phía trên lưới, nên cột phải chỉ bắt đầu
              được từ dưới dải bước — để lại một vùng trắng cao gần 200px ở góc trên phải, đúng
              chỗ Ban lãnh đạo khoanh. Đưa vào cột trái thì cột phải kéo lên sát dòng đầu trang,
              giống trang nhiệm vụ Base.

              ⚠️ Dải 7 bước giờ chỉ còn ~73% bề ngang. Nó vốn đã có khung cuộn ngang riêng nên
              không tràn trang, nhưng nếu sau này thêm bước thì kiểm lại trên màn 1280px. */}
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
            /* 📌 ĐÃ BỎ nhóm nút góc trên phải (Ban lãnh đạo 16/08/2026: *"bỏ các mục này"*):
               huy hiệu trạng thái · nút "Chuyển tiếp" · nút "Lập đơn đặt hàng".

               🔴 ĐÃ KIỂM CẢ BA CÒN ĐƯỜNG VÀO KHÁC trước khi bỏ (quy ước CLAUDE.md 3.4b —
               phiên 03 suýt làm module Báo giá thành mồ côi):
                 · Chuyển tiếp → menu ⋯ trên thẻ ở bảng quy trình
                 · Lập đơn đặt hàng → nút ở khối "Đơn đặt hàng" ngay trong trang này
                 · Trạng thái → khối "Giai đoạn hiện tại" ở cột phải, chi tiết hơn */
          />

          {/* Dải mũi tên 7 bước — nhìn ra ngay đề nghị đang đứng ở đâu trong quy trình */}
          <ThanhGiaiDoan giaiDoan={giaiDoan} />
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
            {/* 🔴 GẬP LẠI ĐƯỢC — Ban lãnh đạo 17/08/2026: *"thêm nút group này lại"*.
                Khối này (danh sách phiếu con + bảng "Ai đang làm phần nào") từng bung hết
                và chiếm gần nửa màn hình ngay đầu trang, đẩy các bước của quy trình xuống
                dưới. Ruột dời sang `KhoiDeXuatCon` — xem chú thích trong file đó. */}
            {deNghiCon.length > 0 && (
              <KhoiDeXuatCon
                deNghi={dn}
                deNghiCon={deNghiCon}
                donHang={donHang}
                baoGia={baoGia}
                phieuNhan={phieuNhan}
                hienBangNangLuc={quyen.phanBoCongViec}
              />
            )}

            {/* Tài liệu đính kèm lúc lập phiếu — nội dung nằm trên máy chủ (kho tệp),
                bấm tên tệp để mở. Không có thì không hiện, đừng chiếm chỗ bằng khối rỗng. */}
            {dn.taiLieu && dn.taiLieu.length > 0 && (
              /* Khai `text-sm` ở lớp bọc, lý do như hộp đề xuất con phía trên. */
              <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-(--hp-md-row-pad) text-sm">
                <p className="font-semibold text-text-primary">
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

          {/* ★ ĐẦU VÀO THEO GIAI ĐOẠN — Ban lãnh đạo 16/08/2026: *"đây là quy trình thu mua
              khi mở trên 1 trang, e bố cục giống 100% như vậy"*.

              🔴 Base gom dữ liệu theo GIAI ĐOẠN, app trước gom theo LOẠI CHỨNG TỪ. Muốn biết
              "bước ③ đã nộp những gì" thì trước đây phải đi tìm khắp trang; nay mở đúng khối
              của bước đó là thấy. Trường đánh số liên tục 01→N như Base.

              🔴 BA KHỐI NGHIỆP VỤ NẰM TRONG GIAI ĐOẠN — cùng chỉ đạo 16/08/2026. Khi được
              báo là app có ba khối Base không có (Phân bổ công việc · Bảng báo giá · Đơn đặt
              hàng), Ban lãnh đạo trả lời: *"những mục này base ko có, e kiểm tra xem nó đang
              trùng ở bước nào thì thêm nó vào bước đó"*.

              Nghĩa là KHÔNG bỏ ba khối (bỏ là mất chức năng chính của app), mà xếp mỗi khối
              vào đúng bước sinh ra nó, qua prop `noiDungNghiepVu`:
                · Phân bổ công việc  → ① Tiếp nhận        (giao người phụ trách là việc bước ①)
                · Bảng báo giá       → ② Yêu cầu NCC báo giá (bảng được LẬP ở bước ② để đi hỏi giá)
                · Đơn đặt hàng       → ④ Lập đơn mua hàng  (đơn được LẬP ở bước ④)

              ⚠️ Chỉ ĐỔI CHỖ, không đổi hành vi: mọi điều kiện hiện/ẩn, mọi prop, mọi lý do
              khóa nút của ba khối giữ y nguyên như khi chúng còn nằm rời ở cuối trang.

              📌 "Danh sách công việc" CỐ Ý đứng riêng bên dưới, không nhét vào đây — Base
              cũng để nó thành mục ngang hàng với khối giai đoạn. */}
          <KhoiDauVaoTheoGiaiDoan
            giaiDoan={[
              {
                ma: "tiep_nhan",
                nhan: NHAN_GIAI_DOAN.tiep_nhan.nhan,
                dangODay: giaiDoan === "tiep_nhan",
                truong: [
                  { nhan: "Bộ phận", giaTri: nhanPhongBan(dn.phongBanNguon) },
                  {
                    nhan: "Nhóm đề xuất",
                    giaTri: NHAN_NHOM_DE_XUAT[dn.nhomDeXuat ?? "khac"],
                  },
                  { nhan: "Ngày đề nghị cấp", giaTri: formatMocThoiGian(dn.ngayCanHang) },
                  { nhan: "Chi tiết", giaTri: `${dn.items.length} mặt hàng` },
                  ...(dn.taiLieu && dn.taiLieu.length > 0
                    ? [{ nhan: "Tài liệu đính kèm", tep: dn.taiLieu }]
                    : []),
                ],
                /* M3 — PHÂN BỔ, thuộc bước ① (chỉ đạo 16/08/2026, xem chú thích đầu khối).
                   Giao ai làm dòng vật tư nào là việc đầu tiên Thu mua phải làm sau khi nhận
                   phiếu, nên nó đứng cùng chỗ với dữ liệu tiếp nhận chứ không rời xuống cuối
                   trang như trước.
                   Các nút hành động đã dời sang cột phải theo bố cục Base.vn (10/08/2026) —
                   mọi việc bấm được gom một chỗ, không rải rác cạnh từng tiêu đề. */
                noiDungNghiepVu: (
                  <section className="flex flex-col gap-(--hp-md-row-gap)">
                    {/* Tiêu đề dùng chung kiểu chữ với nhãn "ĐẦU VÀO" ngay phía trên —
                        xem `NhanPhanTrongGiaiDoan`. Ban lãnh đạo 16/08/2026 khoanh đỏ chỗ
                        này vì tiêu đề con (18px) đang to hơn tiêu đề khối cha (11px). */}
                    <NhanPhanTrongGiaiDoan the="h2" icon={ClipboardList}>
                      {quyen.phanBoCongViec ? "Phân bổ công việc" : "Chi tiết mặt hàng"}
                    </NhanPhanTrongGiaiDoan>
                    {/* Công cụ phân bổ hàng loạt chỉ bày ở bước ①, HOẶC khi còn dòng chưa ai
                        nhận (thêm vật tư mới ở bước sau) — Ban lãnh đạo 15/08/2026. Xem
                        `dangOBuocPhanBo`. */}
                    <BangPhanBo
                      deNghi={dn}
                      dangOBuocPhanBo={giaiDoan === "tiep_nhan" || soDongChuaPhanBo > 0}
                      // Hồ sơ đã chốt (hoàn thành / đóng dở) thì khóa mọi thao tác đổi nội
                      // dung — Ban lãnh đạo 15/08/2026. Dùng `giaiDoanDaKetThuc` cho khớp
                      // với luật chung.
                      hoSoDaDong={hoSoDaDong}
                    />
                  </section>
                ),
                /* ★ ĐÍNH KÈM CHO CẢ SÁU BƯỚC — Ban lãnh đạo 17/08/2026: ảnh khoanh đỏ khối
                   "Bảng báo giá (0)" ở bước ② kèm chữ *"mục đính kèm file"*.

                   🔴 KHÔNG làm riêng bước ②. Việc đang chờ trong danh sách ("thêm chỗ đính
                   kèm cho hợp đồng, đơn có chữ ký, hóa đơn NCC") chính là cùng một nhu cầu;
                   làm lẻ từng chỗ là sau này app có 5 cơ chế đính kèm khác nhau, mỗi chỗ một
                   kiểu. Bước ① nhận biên bản họp, phiếu kiểm tồn kho… */
                khuDinhKem: (
                  <KhuDinhKemGiaiDoan
                    deNghi={dn}
                    maGiaiDoan="tiep_nhan"
                    duocSua={duocSuaTepBuoc}
                    khoa={hoSoDaDong}
                  />
                ),
              },
              {
                ma: "yeu_cau_bao_gia",
                nhan: NHAN_GIAI_DOAN.yeu_cau_bao_gia.nhan,
                dangODay: giaiDoan === "yeu_cau_bao_gia",
                truong: [
                  {
                    nhan: "SL Báo giá",
                    /* ★ SỬA ĐƯỢC NGAY TẠI ĐÂY — Ban lãnh đạo 17/08/2026: *"phần đầu vào thêm
                       chức năng sửa số lượng báo giá"*. Trước đó con số chỉ đặt được một lần
                       lúc kéo phiếu sang bước ②, đặt xong là kẹt.

                       📌 Dùng `noiDung` chứ không dùng `giaTri`: `giaTri` chỉ nhận chữ. */
                    noiDung: (
                      <OSuaSoBaoGia
                        // Số báo giá đặt cho cả phiếu — lấy của dòng đầu tiên có yêu cầu.
                        soHienTai={dn.items.find((d) => d.soBaoGiaYeuCau)?.soBaoGiaYeuCau}
                        duocSua={duocSuaTepBuoc && !hoSoDaDong}
                        onLuu={(so) => {
                          datSoBaoGiaChoPhieu(dn.id, so, nguoiDung.tenHienThi);
                          toast.success(`Đã đổi thành ${so} báo giá cho mọi mặt hàng`);
                        }}
                      />
                    ),
                  },
                ],
                /* BẢNG BÁO GIÁ, thuộc bước ② (chỉ đạo 16/08/2026, xem chú thích đầu khối):
                   bảng được LẬP ở chính bước này để đi mời nhà cung cấp chào giá, nên đứng
                   ngay cạnh trường "SL Báo giá" của bước.

                   🔴 Từ 06/08/2026 menu không còn mục "Báo giá & so sánh NCC", nên đây là lối
                   vào DUY NHẤT tới module đó. Bỏ khối này là module thành mồ côi.

                   🔴 Dùng CHUNG luật với trang bảng báo giá (chỉ đạo 10/08/2026): chỉ người
                   được chia việc hoặc người theo dõi mới thấy. Chặn ngay ở đây để không lộ mã
                   bảng báo giá và tên nhà cung cấp đã chọn cho người không có quyền. */
                /* 📌 CHƯA CÓ BẢNG NÀO THÌ CẢ KHỐI BIẾN MẤT — Ban lãnh đạo 17/08/2026 khoanh nút
                   "Lập bảng báo giá" và ghi *"bỏ nút này"*. Bỏ nút xong thì khối chỉ còn trơ
                   một dòng tiêu đề "BẢNG BÁO GIÁ (0)" không dẫn đi đâu, nên ẩn luôn cả khối.

                   🔴 MODULE BÁO GIÁ KHÔNG BỊ MỒ CÔI: việc "Lập bảng báo giá" đã chuyển vào
                   menu ⋯ trên thẻ ở bảng quy trình (`bang-quy-trinh-mua-hang.tsx`). Bắt buộc
                   phải có một lối vào bấm được TRÊN ĐIỆN THOẠI — đường còn lại là kéo thẻ từ
                   cột ① sang ②, mà điện thoại không kéo được. Trước 10/08/2026 app đã tắc
                   đúng kiểu này. Xem CLAUDE.md mục 3.4b. */
                noiDungNghiepVu: duocXemBaoGiaCuaDeNghi(dn, nguoiDung.uid, quyen) &&
                  baoGiaLienQuan.length > 0 && (
                  <section className="flex flex-col gap-(--hp-md-row-gap)">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* Cùng kiểu chữ với "ĐẦU VÀO" — xem `NhanPhanTrongGiaiDoan`. */}
                      <NhanPhanTrongGiaiDoan the="h2" icon={FileText}>
                        Bảng báo giá ({baoGiaLienQuan.length})
                      </NhanPhanTrongGiaiDoan>
                    </div>
                    <Card>
                      <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
                        {baoGiaLienQuan.map((bg) => {
                          const ttBG = nhanAnToan(NHAN_TRANG_THAI_BAO_GIA, bg.trangThai);
                          return (
                            <Link
                              key={bg.id}
                              href={`/bao-gia/${bg.id}`}
                              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-surface p-(--hp-md-row-pad) transition-colors hover:border-primary/40"
                            >
                              <span className="text-sm font-semibold text-text-primary">
                                {bg.code}
                              </span>
                              <span className="text-xs text-text-desc">{bg.tieuDe}</span>
                              <span className="text-xs text-text-desc">
                                {bg.items.length} vật tư · hạn nộp{" "}
                                {new Date(bg.hanNop).toLocaleDateString("vi-VN")}
                              </span>
                              {bg.nccDaChonTen && (
                                <span className="text-xs text-text-desc">
                                  Đã chọn: {bg.nccDaChonTen}
                                </span>
                              )}
                              <StatusBadge
                                label={ttBG.nhan}
                                tone={ttBG.tong}
                                className="ml-auto"
                              />
                            </Link>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </section>
                ),
                /* 🔴 ĐÂY LÀ CHỖ BAN LÃNH ĐẠO KHOANH ĐỎ 17/08/2026. Bản báo giá nhà cung cấp
                   gửi về qua Zalo/email trước đây chỉ gắn được sau khi đã vào trong trang
                   bảng báo giá — mà lúc chưa lập bảng nào thì không có chỗ nào bỏ tệp vào cả.

                   📌 KHÔNG chặn theo `duocXemBaoGiaCuaDeNghi` như khối Bảng báo giá ngay
                   trên: khối đó bị chặn vì nó lộ MÃ BẢNG và TÊN NHÀ CUNG CẤP đã chọn. Tệp
                   đính kèm của bước thì không tự nó lộ hai thứ đó, mà chặn thêm ở đây sẽ làm
                   chính người đi hỏi giá không dán được báo giá vào hồ sơ. */
                khuDinhKem: (
                  <KhuDinhKemGiaiDoan
                    deNghi={dn}
                    maGiaiDoan="yeu_cau_bao_gia"
                    duocSua={duocSuaTepBuoc}
                    khoa={hoSoDaDong}
                  />
                ),
              },
              {
                ma: "xet_duyet_bao_gia",
                nhan: NHAN_GIAI_DOAN.xet_duyet_bao_gia.nhan,
                dangODay: giaiDoan === "xet_duyet_bao_gia",
                truong: baoGiaLienQuan.flatMap((bg) =>
                  (bg.tepBaoGia ?? []).length > 0
                    ? [{ nhan: `Báo giá NCC — ${bg.code}`, tep: bg.tepBaoGia }]
                    : [],
                ),
                /* Bước ③ nhận biên bản xét duyệt, tờ trình so sánh giá. Khu này đứng riêng
                   với trường "Báo giá NCC" ở trên: trường đó là tệp gắn TRONG bảng báo giá
                   (chỉ đọc ở đây), còn khu này là chứng từ gắn thẳng vào bước. */
                khuDinhKem: (
                  <KhuDinhKemGiaiDoan
                    deNghi={dn}
                    maGiaiDoan="xet_duyet_bao_gia"
                    duocSua={duocSuaTepBuoc}
                    khoa={hoSoDaDong}
                  />
                ),
              },
              {
                ma: "lap_don_mua_hang",
                nhan: NHAN_GIAI_DOAN.lap_don_mua_hang.nhan,
                dangODay: giaiDoan === "lap_don_mua_hang",
                truong: baoGiaLienQuan.flatMap((bg) =>
                  (bg.tepChonNCC ?? []).length > 0
                    ? [{ nhan: "Căn cứ chọn nhà cung cấp", tep: bg.tepChonNCC }]
                    : [],
                ),
                /* ĐƠN ĐẶT HÀNG, thuộc bước ④ (chỉ đạo 16/08/2026, xem chú thích đầu khối):
                   đơn được LẬP ở chính bước này, ngay sau khi đã có căn cứ chọn nhà cung cấp
                   nằm phía trên.

                   📌 Tiêu đề gọi thẳng là "Đơn đặt hàng" (Ban lãnh đạo 15/08/2026). Chữ "đã
                   tách" là cách nói của người làm hệ thống — với người dùng thì đây đơn giản
                   là danh sách đơn của đề nghị này, dù tách cho nhiều nhà cung cấp hay chỉ
                   một đơn duy nhất. */
                noiDungNghiepVu: (
                  <section className="flex flex-col gap-(--hp-md-row-gap)">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Cùng kiểu chữ với "ĐẦU VÀO" — xem `NhanPhanTrongGiaiDoan`. */}
                      <NhanPhanTrongGiaiDoan the="h2" icon={Package}>
                        Đơn đặt hàng ({poLienQuan.length})
                      </NhanPhanTrongGiaiDoan>
                      {/* ★ TÁCH ĐƠN NGAY TẠI ĐÂY — Ban lãnh đạo 15/08/2026: *"thêm tính năng
                          tách đơn cho tài khoản nhân viên"*.

                          🔴 Nhân viên VỐN ĐÃ có quyền lập đơn (`lapPO` mở cho nhân viên thu
                          mua cấp ≥2), nhưng đường vào chỉ có MỘT nút ở tận đầu trang. Đứng ở
                          khối đơn hàng — đúng lúc nhìn thấy "cần thêm một đơn nữa cho nhà
                          cung cấp khác" — thì không có nút nào. Người dùng tưởng mình không
                          được tách và đi nhờ trưởng bộ phận.

                          📌 Dùng CHUNG `chanLapDon` với chốt chặn thật trong `themDonHang`:
                          nút khóa vì lý do gì thì đúng là lý do app sẽ chặn. */}
                      {/* 🔴 NÚT MỞ ĐƯỢC KỂ CẢ KHI CÒN VƯỚNG — Ban lãnh đạo 17/08/2026 hỏi năm
                          lần *"mục giao diện giống misa ở bước lập đơn mua hàng đâu"* /
                          *"mục này vẫn chưa có phần import"*.

                          Nguyên do: nút này để `disabled` nên KHÔNG AI VÀO ĐƯỢC màn lập đơn —
                          mà chính màn đó mới có bộ trường theo MISA và nút Nhập từ Excel. App
                          bảo *"phải lập bảng báo giá..."* rồi đứng im, không cho một đường nào
                          đi tiếp. Đó là ngõ cụt, không phải bảo vệ.

                          🔴 LUẬT KHÔNG BỊ NỚI MỘT LY: chốt chặn thật nằm ở `themDonHang` (dùng
                          chung `vuongMacLapDonHang`), nên vẫn KHÔNG cất được đơn khi chưa chốt
                          nhà cung cấp. Mở nút chỉ là cho vào NHẬP LIỆU và NHẬP EXCEL; ô cảnh
                          báo vàng ngay dưới đây nói rõ còn thiếu gì trước khi cất được.

                          ⚠️ Đánh đổi đã cân: người dùng có thể gõ cả đơn rồi mới bị chặn ở nút
                          Cất. Chấp nhận, vì thà vậy còn hơn không có đường nào tới màn nhập
                          liệu — và ô cảnh báo đã đứng ngay cạnh nút này từ trước khi bấm. */}
                      {quyen.lapPO && !giaiDoanDaKetThuc(giaiDoan) && (
                        <Button
                          size="sm"
                          variant="outline"
                          nativeButton={false}
                          title={chanLapDon ?? undefined}
                          render={<Link href={`/don-hang/tao-moi?prId=${dn.id}`} />}
                        >
                          <ShoppingCart className="size-4" aria-hidden />
                          {poLienQuan.length === 0 ? "Lập đơn đặt hàng" : "Tách thêm đơn"}
                        </Button>
                      )}
                    </div>
                    <Card>
                      <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
                        {/* ★ NÓI RÕ VÌ SAO NÚT LẬP ĐƠN ĐANG KHÓA — Ban lãnh đạo 15/08/2026
                            chỉ vào nút xám và hỏi *"sao nút này không dùng được"*.

                            🔴 App chặn ĐÚNG (bảng báo giá còn đang thu thập, chưa qua xét
                            duyệt — chính luật Ban lãnh đạo yêu cầu hôm đó), nhưng lý do chỉ
                            nằm trong `title`, mà `title` phải rê chuột mới thấy và trên máy
                            tính bảng thì không có. Nút xám không lời giải thích trông y như
                            app hỏng. */}
                        {quyen.lapPO && chanLapDon && !giaiDoanDaKetThuc(giaiDoan) && (
                          <div className="flex flex-col gap-2 rounded-lg border border-warning bg-warning-bg px-3 py-2">
                            <p className="flex items-start gap-2 text-sm text-warning-soft">
                              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                              <span>
                                {/* Nhãn đổi từ "Chưa lập được đơn" sang "Chưa CẤT được đơn":
                                    từ 17/08/2026 vào màn nhập liệu được rồi, chỉ nút Cất còn
                                    bị chặn. Để nguyên chữ cũ là nói sai việc app đang làm. */}
                                <strong>Chưa cất được đơn đặt hàng.</strong> {chanLapDon} Vào màn
                                lập đơn thì nhập liệu và nhập từ Excel vẫn dùng được, chỉ nút
                                Cất còn khóa.
                              </span>
                            </p>
                            {/* 🔴 GỠ NGÕ CỤT: trước đây ô này nói "phải lập bảng báo giá" mà
                                không cho chỗ nào làm việc đó — muốn lập phải quay ra /de-nghi
                                rồi tìm menu ⋯ trên thẻ, không ai đoán được.
                                Đi qua bảng quy trình chứ không gọi thẳng hàm tạo: ở đó việc lập
                                bảng báo giá đi qua đúng chốt `quyetDinhKeoTha` và hộp xác nhận. */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-fit"
                              nativeButton={false}
                              render={<Link href="/de-nghi" />}
                            >
                              <FileText className="size-4" aria-hidden />
                              Sang bảng quy trình để lập bảng báo giá
                            </Button>
                          </div>
                        )}
                        {poLienQuan.length === 0 && (
                          <p className="text-sm text-text-desc">
                            Chưa có đơn đặt hàng nào. Một đề nghị tách được thành nhiều đơn khi
                            chia hàng cho nhiều nhà cung cấp.
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
                              <span className="text-sm font-semibold text-text-primary">
                                {po.code}
                              </span>
                              {quyen.xemNguoiPhuTrach && (
                                <span className="text-xs text-text-desc">
                                  {po.nguoiPhuTrachTen}
                                </span>
                              )}
                              {quyen.xemNhaCungCap && (
                                <span className="text-xs text-text-desc">{po.supplierTen}</span>
                              )}
                              <span className="text-xs text-text-desc">
                                {po.items.length} dòng · giao dự kiến{" "}
                                {new Date(po.ngayGiaoDuKien).toLocaleDateString("vi-VN")}
                              </span>
                              <StatusBadge
                                label={ttPO.nhan}
                                tone={ttPO.tong}
                                className="ml-auto"
                              />
                            </Link>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </section>
                ),
                /* Bước ④ nhận hợp đồng mua bán, phụ lục, đơn đã có chữ ký. */
                khuDinhKem: (
                  <KhuDinhKemGiaiDoan
                    deNghi={dn}
                    maGiaiDoan="lap_don_mua_hang"
                    duocSua={duocSuaTepBuoc}
                    khoa={hoSoDaDong}
                  />
                ),
              },
              {
                ma: "dat_hang",
                nhan: NHAN_GIAI_DOAN.dat_hang.nhan,
                dangODay: giaiDoan === "dat_hang",
                truong: poLienQuan.map((po) => ({
                  nhan: "Đơn mua hàng",
                  giaTri: po.code,
                })),
                /* Bước ⑤ nhận đơn đã gửi đi có xác nhận của nhà cung cấp, chứng từ tạm ứng. */
                khuDinhKem: (
                  <KhuDinhKemGiaiDoan
                    deNghi={dn}
                    maGiaiDoan="dat_hang"
                    duocSua={duocSuaTepBuoc}
                    khoa={hoSoDaDong}
                  />
                ),
              },
              {
                ma: "nhan_hang",
                nhan: NHAN_GIAI_DOAN.nhan_hang.nhan,
                dangODay: giaiDoan === "nhan_hang" || giaiDoan === "hoan_thanh",
                truong: phieuLienQuan.flatMap((p) =>
                  p.tepPhieuGiao
                    ? [{ nhan: `Phiếu giao nhận lần ${p.lanGiaoThu}`, tep: [p.tepPhieuGiao] }]
                    : [],
                ),
                /* Bước ⑥ nhận hóa đơn nhà cung cấp, chứng chỉ chất lượng, biên bản nghiệm thu.
                   ⚠️ KHÔNG thay cho tệp phiếu giao nhận. Luật "mỗi lần giao phải có phiếu mới
                   được xác nhận hoàn thành" (`vuongMacXacNhanKho`) kiểm TỪNG phiếu nhận hàng
                   qua `tepPhieuGiao`, gắn tệp ở đây không gỡ được vướng mắc đó — và không được
                   để nó gỡ, nếu không luật thành vô nghĩa. */
                khuDinhKem: (
                  <KhuDinhKemGiaiDoan
                    deNghi={dn}
                    maGiaiDoan="nhan_hang"
                    duocSua={duocSuaTepBuoc}
                    khoa={hoSoDaDong}
                  />
                ),
              },
            ]}
          />

          {/* 📌 15/08/2026 — Ban lãnh đạo:
                · *"bố cục lại sang tab phải"* → khối **Người theo dõi** đã dời sang cột phải
                · *"mục này đã có trong tab theo dõi đề nghị thì ở đây ko cần hiển thị"* →
                  **Timeline ngang** (Duyệt → Đã phân bổ → Đã lên đơn → Đang giao → Nhận đủ)
                  đã BỎ, vì màn "Theo dõi đề nghị" đã vẽ đúng thứ đó.

             📌 16/08/2026: ba khối làm việc (phân bổ · báo giá · đơn hàng) không còn xếp
             rời ở đây nữa — đã vào trong đúng giai đoạn của chúng ở khối ngay phía trên.
             Cột trái giờ còn: thông tin đề nghị · các giai đoạn (kèm phần làm việc) ·
             danh sách công việc của bước đang đứng · trao đổi. */}

          {/* ★ CÔNG VIỆC BẮT BUỘC CỦA BƯỚC ĐANG ĐỨNG — mục "Danh sách công việc" của bảng
              Base (Ban lãnh đạo gửi ảnh cài đặt giai đoạn 14/08/2026).

              📌 Chỉ hiện khi bước hiện tại CÓ khai công việc. Năm bước còn lại trong ảnh ghi
              "Không có công việc", hiện khối rỗng chỉ làm trang dài ra.

              📌 CỐ Ý ĐỨNG RIÊNG, không nhét vào khối giai đoạn ở trên: Base cũng để nó thành
              mục ngang hàng. Nó nói về BƯỚC ĐANG ĐỨNG (một bước duy nhất), còn khối trên liệt
              kê cả sáu bước — nhét vào trong sẽ phải nhân bản cho từng bước hoặc chôn nó vào
              một bước, cả hai đều sai ý nghĩa. */}
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
      {/* 📌 ĐÃ BỎ hộp "Lập bảng báo giá cho đề nghị này?" (Ban lãnh đạo 17/08/2026 khoanh nút
          mở nó và ghi *"bỏ nút này"*). Bỏ nút mà để hộp lại là mã chết — đúng thứ đang phải
          dọn ở hộp "Chuyển tiếp".

          🔴 CHỐT KIỂM KHÔNG MẤT THEO: việc lập bảng báo giá chuyển sang menu ⋯ trên thẻ ở
          bảng quy trình, và ở đó nó gọi `xuLyTha` — cùng đường với kéo thả, nên vẫn qua
          `quyetDinhKeoTha` (kiểm bước đang đứng đã xong chưa) và vẫn mở hộp xác nhận. */}
    </>
  );
}
