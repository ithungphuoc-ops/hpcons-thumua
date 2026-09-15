"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { AlertTriangle, BadgeCheck, FileWarning, Info, Lock, Printer } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { TimelineProgress } from "@/1-giao-dien/thanh-phan-dung-chung/timeline-progress";
import { BangTienDoPO } from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-tien-do-po";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/1-giao-dien/nen-tang-ui/table";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { duocXacNhanNhanDuHangCuaHoSo } from "@/4-phan-quyen/quyen-theo-ho-so";
import { laHoSoPhongBan, LY_DO_NHANH_PHONG_BAN } from "@/2-quy-trinh/ho-so-phong-ban";
import {
  poDaGiaoDu,
  tinhTienDonHang,
  tinhTienDoPO,
  vuongMacXacNhanKho,
} from "@/2-quy-trinh/tinh-toan";
import { nhanAnToan, NHAN_TRANG_THAI_PO } from "@/2-quy-trinh/trang-thai";
import { docSoTien } from "@/6-tien-ich/doc-so-tien";
import { formatDateTime } from "@/6-tien-ich/dinh-dang";
import { NutXuatDonHangExcel } from "@/1-giao-dien/thanh-phan-nghiep-vu/nut-xuat-don-hang";
import { BadgeChoDeNghi } from "@/1-giao-dien/thanh-phan-nghiep-vu/badge-cho-de-nghi";
import { HopGanDeNghi } from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-gan-de-nghi";
import { HopXacNhanTuDongGan } from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-xac-nhan-tu-dong-gan";
import { HopSuaDonHang } from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-sua-don-hang";

export default function TrangChiTietDonHang() {
  const params = useParams<{ id: string }>();
  const { donHang, phieuNhan, giaDonHang, deNghi, xacNhanKho, xacNhanTruongBP, chotDonNhap } =
    useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  const po = donHang.find((x) => x.id === params.id);
  const gia = giaDonHang.find((g) => g.poId === params.id);

  /**
   * ★ Đề nghị nguồn của đơn — cần để biết đây là hồ sơ CÔNG TRÌNH hay PHÒNG BAN.
   *
   * Sếp 15/09/2026: *"E mở cho nhánh phòng ban"*, *"nhân viên thu mua tự hoàn thành, nhưng phải
   * đính kèm phiếu giao hàng"*. Hồ sơ phòng ban không có kho công trình xác nhận hộ, nên quyền
   * bấm "Kho xác nhận nhận đủ hàng" phải hỏi THEO HỒ SƠ chứ không theo cờ toàn cục.
   *
   * 📌 `undefined` khi đơn chưa gắn đề nghị — `duocXacNhanNhanDuHangCuaHoSo` nhận `undefined` và
   * **không nới quyền**, đúng luật "thiếu thông tin thì cho quyền thấp nhất".
   */
  const deNghiNguon = po?.prId ? deNghi.find((d) => d.id === po.prId) : undefined;

  /**
   * ★★ ĐƠN NÀY THUỘC HỒ SƠ PHÒNG BAN? — Sếp 15/09/2026 (chiều), nguyên văn: *"Đề nghị phòng ban
   * thì ko cần nút này"*, chỉ vào nút "Kho xác nhận nhận đủ hàng".
   *
   * 🔴 HAI MÀN PHẢI NÓI GIỐNG NHAU. Nút xác nhận nhận đủ hàng có ở CẢ trang chi tiết đề nghị
   * (`trang/de-nghi-chi-tiet.tsx`, khối "KẾT QUẢ" của bước ⑥) lẫn trang này. Sửa một bên thôi thì
   * người dùng vẫn gặp đúng cái nút thừa đó ở đường vào còn lại, và tệ hơn: hai màn hiển thị hai
   * trạng thái khác nhau cho cùng một đơn.
   *
   * 📌 `deNghiNguon` có thể `undefined` (đơn chưa gắn đề nghị) — `laHoSoPhongBan(undefined)` trả
   * `false`, tức là giữ nguyên hành vi cũ. Đúng luật "thiếu thông tin thì không nới".
   */
  const hoSoPhongBan = laHoSoPhongBan(deNghiNguon);

  const phieuCuaPO = useMemo(
    () => (po ? phieuNhan.filter((p) => p.poId === po.id) : []),
    [po, phieuNhan],
  );

  const tienDo = useMemo(() => (po ? tinhTienDoPO(po, phieuCuaPO) : []), [po, phieuCuaPO]);

  /** Còn phiếu nào chưa đính kèm phiếu giao nhận không — luật ở `2-quy-trinh/tinh-toan.ts`. */
  const vuongMacTep = vuongMacXacNhanKho(phieuCuaPO);

  if (!po) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Không tìm thấy đơn đặt hàng"
        description="Đơn hàng này không tồn tại hoặc bạn không có quyền xem."
      />
    );
  }

  const tt = nhanAnToan(NHAN_TRANG_THAI_PO, po.trangThai);
  const daGiaoDu = poDaGiaoDu(tienDo);
  const tien = tinhTienDonHang(po, gia);

  /**
   * ★ AI ĐƯỢC DUYỆT HOÀN THÀNH ĐƠN — Ban lãnh đạo 24/08/2026: *"Mục này là do nhân viên phụ
   * trách đơn hàng này duyệt"*.
   *
   * 🔴 SỬA MỘT LỆCH GIỮA HAI MÀN HÌNH cho CÙNG một việc: trang chi tiết ĐỀ NGHỊ đã cho nhân viên
   * phụ trách duyệt từ 22/08/2026 (`quyen.xacNhanTruongBP || laViecCuaToi(...)`), còn trang này
   * vẫn chỉ cho `quyen.xacNhanTruongBP`. Cùng một đơn, mở ở màn này thì không thấy nút, mở ở màn
   * kia thì bấm được — người dùng không thể hiểu vì sao.
   *
   * 📌 Ở màn ĐƠN HÀNG thì "việc của tôi" xét theo `po.nguoiPhuTrachUid` (người phụ trách chính
   * đơn này), chứ không xét theo dòng của đề nghị: đây là trang của một đơn cụ thể.
   *
   * ⚠️ Tầng ghi (`xacNhanTruongBP`) vẫn kiểm lại đủ điều kiện nghiệp vụ — mở quyền ở đây KHÔNG
   * nới bất kỳ điều kiện nào (hàng về đủ · thủ kho đã xác nhận · có Hóa đơn VAT).
   */
  const duocDuyetHoanThanhDon =
    quyen.xacNhanTruongBP || (!!po.nguoiPhuTrachUid && po.nguoiPhuTrachUid === nguoiDung.uid);

  function bamXacNhanKho() {
    /* 🔴 Từ 24/08/2026 tầng ghi có thể TỪ CHỐI (hàng chưa về đủ, hoặc còn phiếu thiếu tệp giao
       nhận) — cùng nếp với `bamXacNhanTruongBP` ngay dưới. Bỏ qua giá trị trả về là nút bấm
       không có gì xảy ra mà không ai biết vì sao. */
    const loi = xacNhanKho(po!.id, {
      uid: nguoiDung.uid,
      ten: nguoiDung.tenHienThi,
      thoiDiem: new Date().toISOString().slice(0, 10),
    });
    if (loi !== null) {
      toast.error("Chưa xác nhận được", { description: loi });
    }
  }

  function bamXacNhanTruongBP() {
    /* 🔴 Từ 22/08/2026 tầng ghi có thể TỪ CHỐI: bắt buộc có Hóa đơn VAT mới duyệt hoàn thành
       được. Bỏ qua giá trị trả về là nút bấm không có gì xảy ra mà không ai biết vì sao. */
    const loi = xacNhanTruongBP(po!.id, {
      uid: nguoiDung.uid,
      ten: nguoiDung.tenHienThi,
      thoiDiem: new Date().toISOString().slice(0, 10),
    });
    if (loi !== null) {
      toast.error("Chưa duyệt hoàn thành được", { description: loi });
      return;
    }
    toast.success("Đã duyệt hoàn thành đơn", { description: `${po!.code} — hồ sơ chuyển Kế toán` });
  }

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Thu mua", href: "/tong-quan" },
          { label: "Đơn đặt hàng", href: "/don-hang" },
          { label: po.code },
        ]}
        title={po.code}
        /* 🔴 ĐƠN KHÔNG GẮN ĐỀ NGHỊ PHẢI NÓI RA, không để câu cụt "Từ đề nghị " (18/08/2026).
           Nói rõ luôn hệ quả rút gọn: đơn này không nằm trong quy trình 8 cột nào, nên người
           đọc không đi tìm hồ sơ nguồn cho mất công. */
        description={`${po.prCode ? `Từ đề nghị ${po.prCode}` : "Đơn lập riêng, không gắn đề nghị"}${quyen.xemNhaCungCap ? ` · ${po.supplierTen}` : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Chỉ vai trò xem được giá mới in được — đơn gửi NCC bắt buộc có đơn giá.
                Mở tab mới để người dùng không mất trang đang xem sau khi in. */}
            {/* 🔒 Cả hai nút đòi quyền xem giá: đơn gửi nhà cung cấp buộc phải có đơn giá,
                nên không có bản "ẩn giá" của đơn mua hàng — cùng nguyên tắc với trang in. */}
            {/* Nút xuất Excel dùng chung với màn danh sách — xem `nut-xuat-don-hang.tsx`.
                Component tự lo quyền `xemGia` và luật chặn nên ở đây không kiểm lại. */}
            <NutXuatDonHangExcel poId={po.id} />
            {/* Ẩn hẳn khi không đủ quyền hoặc đơn đã hoàn thành/hủy — component tự kiểm cả hai,
                xem `hop-sua-don-hang.tsx`. */}
            <HopSuaDonHang po={po} />
            {quyen.xemGia && (
              <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/in/don-hang/${po.id}`} target="_blank" />}>
                <Printer className="size-4" aria-hidden />
                In đơn mua hàng
              </Button>
            )}
            {/* ★ CHỐT LẠI ĐƠN NHÁP (12/09/2026) — vá "ngõ cụt bước ④": đơn đã chốt bị lùi về bước
                "Lập đơn mua hàng" (trạng thái "nhap") trước đây không có đường chốt lại, dù
                `hanhDongTienMotBuoc` hứa "Chốt đơn hàng nháp". Luật chặn thật (`vuongMacLapDonHang`)
                nằm ở cửa ghi `chotDonNhap` (kho-du-lieu.tsx), nút này chỉ gọi tới. */}
            {po.trangThai === "nhap" && (
              <Button
                size="sm"
                onClick={() => {
                  const loi = chotDonNhap(po.id);
                  if (loi) {
                    toast.error("Chưa chốt được đơn", { description: loi });
                    return;
                  }
                  toast.success("Đã chốt đơn hàng", {
                    description: `${po.code} chuyển sang bước tiếp theo.`,
                  });
                }}
              >
                <BadgeCheck className="size-4" aria-hidden />
                Chốt đơn hàng
              </Button>
            )}
            {po.trangThai === "cho_de_nghi" ? (
              <BadgeChoDeNghi />
            ) : (
              <StatusBadge label={tt.nhan} tone={tt.tong} />
            )}
          </div>
        }
      />

      {/* =====================================================================
          ★★ CHƯA GỬI ĐƯỢC SANG KHO CÔNG TRÌNH — thêm 15/09/2026
          =====================================================================
          🔴 VÌ SAO PHẢI BÀY RA: trước hôm nay, một đơn `qlkCtrSyncStatus === "failed"` KHÔNG
          hiện gì cả trên màn này. Hậu quả thật: thủ kho mở app Kho công trình không thấy đơn,
          không ghi nhập kho được, mà bên Thu mua nhìn màn hình thì mọi thứ "bình thường" — đúng
          lỗi §3.5 CLAUDE.md *"đừng để giao diện hứa một việc app không làm"*, chỉ ở chiều ngược
          lại: giao diện IM LẶNG về một việc app đã làm hỏng.

          📌 Lý do lỗi (`qlkCtrSyncError`) và mốc thử gần nhất (`qlkCtrSyncAt`) do
          `3-du-lieu/kho-du-lieu.tsx` ghi lại — Sếp 15/09/2026: *"cần giải quyết dứt điểm chứ
          không phải mỗi lần lỗi là mỗi lần sửa"*.

          🔴 CỐ Ý KHÔNG CÓ NÚT "GỬI LẠI". Cơ chế gửi lại đã có sẵn và tự chạy: mỗi lần dữ liệu
          từ kho chung về (mở app · tải lại trang · sửa đơn), vòng retry trong `kho-du-lieu.tsx`
          tự gọi lại `guiPOSangQlkCtr`. Thêm nút là hai đường cùng làm một việc, rồi lệch nhau —
          và người bấm sẽ tưởng phải bấm thì mới gửi, trong khi app vẫn đang tự thử.

          ⚠️ Đặt NGAY DƯỚI tiêu đề, trên mọi khối nội dung: đây là thứ phải đọc trước khi tin
          vào bảng tiến độ nhận hàng bên dưới. */}
      {po.qlkCtrSyncStatus === "failed" && (
        <div className="flex items-start gap-3 rounded-xl border border-warning bg-warning-bg p-(--hp-md-row-pad)">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-soft" aria-hidden />
          <div className="flex flex-col gap-1.5">
            {/* Trạng thái có CẢ MÀU LẪN CHỮ (Design System V1.1) — người không phân biệt được
                màu vẫn đọc ra đây là cảnh báo. */}
            <span className="text-sm font-semibold text-warning-soft">
              Chưa gửi được đơn này sang app Kho công trình
            </span>
            <p className="text-sm text-text-secondary">
              Thủ kho công trình chưa nhìn thấy đơn <strong>{po.code}</strong> bên app Kho, nên
              chưa ghi nhận nhập kho theo đơn này được. Phần tiến độ nhận hàng bên dưới có thể
              chưa phản ánh đúng hàng đã về.
            </p>
            {/* ⚠️ KHÔNG ĐỂ TRỐNG khi đơn hỏng từ trước lúc có trường `qlkCtrSyncError`
                (15/09/2026) — để trống thì trông như chính khối cảnh báo này bị lỗi. Nói thẳng
                là app hồi đó chưa ghi được lý do. */}
            <p className="text-sm text-text-secondary">
              <span className="text-text-desc">Lý do: </span>
              {po.qlkCtrSyncError ?? (
                <em>
                  chưa ghi được lý do — lần lỗi này xảy ra trước ngày 15/09/2026, khi app còn
                  chưa lưu nội dung lỗi. Các lần thử sau sẽ có lý do cụ thể.
                </em>
              )}
            </p>
            <p className="text-xs text-text-desc">
              {po.qlkCtrSyncAt
                ? `Thử gửi lần gần nhất: ${formatDateTime(po.qlkCtrSyncAt)}`
                : "Chưa ghi nhận thời điểm thử gửi gần nhất."}{" "}
              App tự gửi lại mỗi lần mở hoặc tải lại trang — không cần bấm gì thêm. Nếu dòng này
              còn đây sau vài lần tải lại, báo bộ phận phụ trách tích hợp kèm mã đơn {po.code} và
              nguyên văn lý do ở trên.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================================
          ★★ ĐƠN CỦA HỒ SƠ PHÒNG BAN — KHÔNG CÓ VIỆC GÌ Ở APP KHO (15/09/2026)
          =====================================================================
          Sếp nguyên văn: *"nếu làm đề nghị là chọn theo phòng ban thì k có chạy về app kho vì
          phòng ban không có kho riêng… thu mua tự đánh vào phiếu tiến độ giao hàng và tự cập
          nhật phiếu giao hàng là done"*.

          🔴 VÌ SAO PHẢI NÓI RA CHỨ KHÔNG IM LẶNG: khối cảnh báo ngay phía trên dạy người dùng
          rằng "không thấy đơn bên app Kho là có chuyện". Với hồ sơ phòng ban thì KHÔNG hề có
          chuyện gì — nhưng nếu màn này không nói gì cả, người dùng tự suy theo nếp cũ rồi đi
          hỏi. Nói rõ ngay tại chỗ là cách rẻ nhất chặn hiểu nhầm đó (cùng lý lẽ với
          `LY_DO_NHANH_PHONG_BAN`).

          🔴 MÀU TRUNG TÍNH, KHÔNG PHẢI VÀNG/ĐỎ: đây là thông tin, không phải cảnh báo. Dùng màu
          cảnh báo cho một việc bình thường là làm hỏng ý nghĩa của màu cảnh báo ở mọi chỗ khác.

          📌 Không có nút gửi lại, và cố ý không có: gửi sang app Kho là việc KHÔNG áp dụng cho
          hồ sơ này, không phải việc đang chờ làm. */}
      {po.qlkCtrSyncStatus === "khong_ap_dung" && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted p-(--hp-md-row-pad)">
          <Info className="mt-0.5 size-5 shrink-0 text-text-desc" aria-hidden />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-text-primary">
              Đơn này không gửi sang app Kho công trình
            </span>
            <p className="text-sm text-text-secondary">{LY_DO_NHANH_PHONG_BAN}</p>
            {/* 🔴 ĐỪNG VIẾT "ghi đủ là đơn xong". CodeRabbit bắt đúng 15/09/2026 và kiểm lại
                code thì CodeRabbit đúng: `duocXacNhanNhanDuHangCuaHoSo` chỉ đổi **ai được bấm**
                (nhánh phòng ban cho chính người Thu mua bấm thay thủ kho), CHỨ KHÔNG BỎ bước
                bấm. Đơn vẫn phải qua "xác nhận nhận đủ hàng" rồi mới tới "duyệt hoàn thành".
                Viết sai câu này là giao diện hứa một việc app không làm — đúng lỗi §3.5. */}
            <p className="text-sm text-text-secondary">
              Hàng về tới đâu, Thu mua tự ghi vào bảng tiến độ giao hàng bên dưới và đính kèm
              phiếu giao hàng của từng lần giao. Ghi đủ rồi thì <strong>chính Thu mua</strong> bấm
              xác nhận nhận đủ hàng cho đơn <strong>{po.code}</strong> — không phải chờ thủ kho
              công trình bấm hộ. Các bước duyệt hoàn thành sau đó giữ nguyên như mọi đơn khác.
            </p>
          </div>
        </div>
      )}

      {/* Thông tin PO */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-(--hp-md-card-gap) md:grid-cols-4">
          <ThongTin nhan="Mã dự án" giaTri={po.maDuAn} />
          {/* 🔴 CHỈ VẼ LIÊN KẾT KHI CÓ ĐỀ NGHỊ THẬT. Để `href={/de-nghi/${undefined}}` là một
              LIÊN KẾT CHẾT: bấm vào rơi về danh sách đề nghị, người dùng tưởng hồ sơ bị mất.
              Không có đề nghị thì vẫn phải bày một ô nói rõ "không gắn đề nghị" — bỏ hẳn ô đi
              thì lưới thông tin khuyết một chỗ và người đọc không biết là cố ý hay lỗi. */}
          {po.trangThai === "cho_de_nghi" && po.prId ? (
            /* ★ ĐÃ TỰ ĐỘNG ĐIỀN, CHỜ XÁC NHẬN (29/08/2026, chiều) — route tự động khớp
               (`app-request/de-nghi-moi`) chỉ điền `prId` chứ không tự chốt nữa (Sếp chọn
               "thêm 1 bước xác nhận cuối" sau review PR). XÉT TRƯỚC nhánh `prId && prCode` bên
               dưới — nếu không, trạng thái "chờ xác nhận" này sẽ bị nhánh đó nuốt mất, hiện như
               một đề nghị đã chốt bình thường. */
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-desc">Đề nghị nguồn</span>
              <HopXacNhanTuDongGan po={po} />
            </div>
          ) : po.prId && po.prCode ? (
            <ThongTin nhan="Đề nghị nguồn" giaTri={po.prCode} href={`/de-nghi/${po.prId}`} />
          ) : po.trangThai === "cho_de_nghi" ? (
            /* ★ PO "chờ đề nghị" (29/08/2026) — nút gắn đề nghị ngay tại đây, đúng chỗ đang
               nói "chưa có đề nghị". Xem `hop-gan-de-nghi.tsx` cho toàn bộ luồng chọn + kiểm
               điều kiện + đổi trạng thái. */
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-desc">Đề nghị nguồn</span>
              <HopGanDeNghi po={po} />
            </div>
          ) : (
            <ThongTin nhan="Đề nghị nguồn" giaTri="Không gắn đề nghị" />
          )}
          {po.tenCongTrinh && <ThongTin nhan="Tên công trình" giaTri={po.tenCongTrinh} />}
          {quyen.xemNguoiPhuTrach && <ThongTin nhan="Người phụ trách" giaTri={po.nguoiPhuTrachTen} />}
          <ThongTin nhan="Ngày lập PO" giaTri={new Date(po.ngayLapPO).toLocaleDateString("vi-VN")} />
          <ThongTin
            nhan="Ngày giao dự kiến"
            /* ⚠️ `po.ngayGiaoDenNgay` là trường THÊM SAU (27/08/2026), đơn cũ không có — kiểm
               rỗng trước khi đưa vào `new Date()`. Cùng cách nối "ngày — ngày" đã dùng ở tờ in
               PO (`to-don-mua-hang-a4.tsx`), màn này trước đó bị bỏ sót nên chỉ hiện 1 ngày dù
               người lập đã chọn cả khoảng. */
            giaTri={[
              new Date(po.ngayGiaoDuKien).toLocaleDateString("vi-VN"),
              po.ngayGiaoDenNgay ? new Date(po.ngayGiaoDenNgay).toLocaleDateString("vi-VN") : undefined,
            ]
              .filter(Boolean)
              .join(" — ")}
          />
          {quyen.xemNhaCungCap && <ThongTin nhan="Nhà cung cấp" giaTri={po.supplierTen} />}
          {po.dieuKienGiaoHang && <ThongTin nhan="Điều kiện giao hàng" giaTri={po.dieuKienGiaoHang} />}
          {/* Các ô dưới đây lấy đúng tên nhãn trên biểu mẫu giấy của công ty */}
          {po.diaDiemGiaoHang && <ThongTin nhan="Địa điểm giao hàng" giaTri={po.diaDiemGiaoHang} />}
          {po.nguoiNhanHangTen && <ThongTin nhan="Người nhận hàng" giaTri={po.nguoiNhanHangTen} />}
          {/* ★ Số điện thoại người nhận (21/08/2026): trường này thêm cho tờ in PO nhưng CHƯA hiện
              ở màn chi tiết — người lập gõ số vào form rồi mở lại đơn không thấy đâu, tưởng mất.
              Nhà cung cấp gọi đúng số này để hẹn giao, nên nó phải xem lại được. */}
          {po.nguoiNhanHangSdt && (
            <ThongTin nhan="Số điện thoại người nhận" giaTri={po.nguoiNhanHangSdt} />
          )}
          {po.dieuKhoanKhac && <ThongTin nhan="Điều khoản khác" giaTri={po.dieuKhoanKhac} />}
        </CardContent>
      </Card>

      {/* Timeline thời gian — component chuẩn V1.1 Phần E2, tái sử dụng từ bản cũ */}
      <Card>
        <CardContent>
          <TimelineProgress
            startDate={po.ngayLapPO}
            endDate={po.ngayGiaoDuKien}
            completed={po.trangThai === "hoan_thanh"}
            mocThucTe={phieuNhan
              .filter((p) => p.poId === po.id && p.trangThai === "da_nhap_kho")
              .map((p) => ({ ngay: p.ngayNhanThucTe, nhan: `Lần ${p.lanGiaoThu} · ${p.code}` }))}
          />
        </CardContent>
      </Card>

      {/* M5 — Bảng tiến độ nhận hàng theo từng lần giao */}
      <BangTienDoPO po={po} />

      {/* Khối GIÁ — chỉ vai trò được xem giá thấy (collection tm_donhang_gia riêng) */}
      {quyen.xemGia ? (
        <section className="flex flex-col gap-(--hp-md-row-gap)">
          <h2 className="text-h3 text-text-primary">Giá trị đơn hàng</h2>
          <Card>
            <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
              <div className="overflow-x-auto">
                <Table>
                  {/* Thứ tự cột giữ đúng biểu mẫu 1. DON HANG HPCONS.xlsx để người quen
                      dùng bản giấy đọc ra ngay: STT · Mã hàng · Tên hàng · Thông số kỹ thuật
                      · ĐVT · SL · Đơn giá · Thành tiền · Mục đích sử dụng */}
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-right">STT</TableHead>
                      <TableHead>Mã hàng</TableHead>
                      <TableHead>Tên hàng</TableHead>
                      <TableHead>Thông số kỹ thuật</TableHead>
                      <TableHead className="text-right">SL</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                      <TableHead>Mục đích sử dụng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {po.items.map((d) => {
                      const g = gia?.lines.find((l) => l.sttDong === d.sttDong);
                      const donGia = g?.donGia ?? 0;
                      return (
                        <TableRow key={d.sttDong}>
                          <TableCell className="text-right text-text-desc">{d.sttDong}</TableCell>
                          <TableCell className="text-text-desc">{d.maHang ?? "—"}</TableCell>
                          <TableCell className="font-medium">{d.tenVatLieu}</TableCell>
                          <TableCell className="text-text-secondary">{d.thongSoKyThuat ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            {d.khoiLuongDat.toLocaleString("vi-VN")} {d.donViTinh}
                          </TableCell>
                          <TableCell className="text-right">{donGia.toLocaleString("vi-VN")} ₫</TableCell>
                          <TableCell className="text-right font-semibold">
                            {(donGia * d.khoiLuongDat).toLocaleString("vi-VN")} ₫
                          </TableCell>
                          <TableCell className="text-text-secondary">{d.mucDichSuDung ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Khối tổng — đúng trình tự biểu mẫu: cộng tiền hàng → CK → đã trừ CK
                  → thuế GTGT → tổng thanh toán → đọc thành chữ. */}
              <dl className="ml-auto flex w-full max-w-sm flex-col gap-1 text-sm">
                <DongTien nhan="Cộng tiền hàng (chưa trừ CK)" giaTri={tien.congTienHang} />
                <DongTien nhan="Số tiền CK" giaTri={tien.chietKhau} />
                <DongTien nhan="Cộng tiền hàng (đã trừ CK)" giaTri={tien.congTienHangSauCK} />
                <DongTien
                  nhan={`Tiền thuế GTGT (${tien.thueSuatGTGT}%)`}
                  giaTri={tien.tienThueGTGT}
                />
                <DongTien nhan="Tổng tiền thanh toán" giaTri={tien.tongThanhToan} tong />
              </dl>
              <p className="text-right text-xs italic text-text-desc">
                {docSoTien(tien.tongThanhToan)}
              </p>
              {gia?.dieuKhoanThanhToan && (
                <p className="text-sm text-text-secondary">
                  <span className="text-text-desc">Điều khoản thanh toán: </span>
                  {gia.dieuKhoanThanhToan}
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      ) : (
        <Card>
          <CardContent className="flex items-center gap-3 text-sm text-text-desc">
            <Lock className="size-4 shrink-0" aria-hidden />
            {/* Chỉ nói ĐIỀU NGƯỜI DÙNG CẦN BIẾT. Phần "đơn giá nằm ở collection riêng
                tm_donhang_gia, chặn ở tầng dữ liệu" đã bỏ (Ban lãnh đạo 16/08/2026) — tên
                collection và cách chặn quyền là chuyện bên trong hệ thống, người dùng đọc vào
                chỉ thấy rối, mà lộ cấu trúc dữ liệu ra ngoài cũng không nên. */}
            <span>
              Vai trò <strong className="text-text-secondary">{nguoiDung.chucDanh}</strong> không
              được xem giá.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Điều kiện hoàn thành PO — 4 lớp (thêm phiếu giao nhận ngày 11/08/2026) */}
      <section className="flex flex-col gap-(--hp-md-row-gap)">
        <h2 className="text-h3 text-text-primary">Hoàn thành đơn hàng</h2>
        <Card>
          <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
            <ol className="flex flex-col gap-2">
              <DieuKien
                so={1}
                nhan="Đã giao đủ toàn bộ khối lượng"
                xong={daGiaoDu}
                moTa={daGiaoDu ? "Mọi dòng còn lại = 0" : "Còn dòng chưa nhận đủ"}
              />
              {/* 🔴 ĐIỀU KIỆN MỚI — chỉ đạo Ban lãnh đạo 11/08/2026: *"thủ kho khi nhận hàng
                  phải đính kèm file phiếu giao nhận thì mới được bấm hoàn thành"*.
                  Luật ở `2-quy-trinh/tinh-toan.ts` → `vuongMacXacNhanKho`, KHÔNG tính lại ở
                  đây — nút bấm bên dưới cũng gọi đúng hàm đó. */}
              <DieuKien
                so={2}
                nhan="Mọi lần giao đều có phiếu giao nhận đính kèm"
                xong={vuongMacTep === null}
                moTa={vuongMacTep ?? `Đủ ${phieuCuaPO.length} phiếu giao nhận`}
              />
              {/* ★★ NHÃN NÓI ĐÚNG SỰ THẬT — Sếp 15/09/2026.
                  Hồ sơ phòng ban KHÔNG có kho công trình, nên dòng "Thủ kho công trình xác nhận"
                  bắt người đọc đi tìm một vai trò không tồn tại trong quy trình của họ. Với hồ sơ
                  phòng ban, điều kiện này do chính lần ghi nhận giao hàng chốt
                  (`tuChotXacNhanKhoPhongBan` ở `3-du-lieu/kho-du-lieu.tsx`), nên nhãn phải nói về
                  SỰ VIỆC (đã nhận đủ hàng) chứ không nói về người. */}
              <DieuKien
                so={3}
                nhan={hoSoPhongBan ? "Đã nhận đủ hàng" : "Thủ kho công trình xác nhận"}
                xong={Boolean(po.xacNhanKho)}
                moTa={
                  po.xacNhanKho
                    ? `${po.xacNhanKho.ten} · ${new Date(po.xacNhanKho.thoiDiem).toLocaleDateString("vi-VN")}`
                    : hoSoPhongBan
                      ? "Chưa nhận đủ — ghi nhận giao hàng kèm phiếu giao hàng ở bảng tiến độ phía trên"
                      : "Chưa xác nhận"
                }
              />
              {/**
                * ★ NHÃN NÓI ĐÚNG AI DUYỆT — Ban lãnh đạo 24/08/2026: *"Mục này là do nhân viên
                * phụ trách đơn hàng này duyệt"*.
                *
                * 🔴 Nhãn cũ ghi cứng *"Trưởng bộ phận thu mua xác nhận"*, nhưng từ 22/08/2026
                * **nhân viên phụ trách đơn cũng duyệt được** — trang chi tiết ĐỀ NGHỊ đã đổi nhãn
                * theo người đang xem, còn trang này thì không. Nhân viên phụ trách đọc dòng này
                * tưởng phải chờ trưởng bộ phận, rồi đi hỏi vòng quanh trong khi chính họ bấm được.
                */}
              <DieuKien
                so={4}
                nhan="Thu mua xác nhận hoàn thành"
                xong={Boolean(po.xacNhanTruongBP)}
                moTa={
                  po.xacNhanTruongBP
                    ? `${po.xacNhanTruongBP.ten} · ${new Date(po.xacNhanTruongBP.thoiDiem).toLocaleDateString("vi-VN")}`
                    : /* Nói rõ AI được bấm, thay vì để người đọc tự đoán. */
                      po.nguoiPhuTrachTen
                      ? `Chưa xác nhận — nhân viên phụ trách (${po.nguoiPhuTrachTen}) hoặc trưởng bộ phận`
                      : "Chưa xác nhận — nhân viên phụ trách đơn hoặc trưởng bộ phận"
                }
              />
            </ol>

            <div className="flex flex-wrap items-center gap-2 border-t border-divider pt-4">
              {/* ★★ Hỏi THEO HỒ SƠ, không theo cờ toàn cục — Sếp 15/09/2026 (sáng) mở nhánh phòng
                  ban. Hồ sơ công trình: y như cũ, chỉ thủ kho.

                  ★★ 15/09/2026 (chiều) — Sếp xem production và chốt lại: *"Đề nghị phòng ban thì ko
                  cần nút này"*. Nên thêm `!hoSoPhongBan`.
                  🔴 KHÔNG PHẢI GIẤU NÚT ĐI: với hồ sơ phòng ban, `po.xacNhanKho` được tầng ghi TỰ
                  CHỐT (`tuChotXacNhanKhoPhongBan` ở `3-du-lieu/kho-du-lieu.tsx`) ngay trong lần "Ghi
                  nhận giao hàng" làm đơn đủ khối lượng, mang tên và ngày của người vừa ghi nhận —
                  nên nút này thừa thật. Tầng tự chốt giữ nguyên cả hai hàng rào `daGiaoDu` và
                  `vuongMacTep === null`, tức chuyển người bấm chứ không hạ điều kiện.
                  ⚠️ Gỡ tầng tự chốt đó thì PHẢI bỏ luôn `!hoSoPhongBan` ở đây, không thì hồ sơ phòng
                  ban kẹt vĩnh viễn ở bước ⑥.

                  📌 Điều kiện chứng từ KHÔNG đổi — `vuongMacTep` bên dưới vẫn khoá nút của hồ sơ
                  công trình khi còn lần giao nào thiếu phiếu giao hàng. */}
              {duocXacNhanNhanDuHangCuaHoSo(deNghiNguon, nguoiDung, quyen) &&
                daGiaoDu &&
                !hoSoPhongBan &&
                !po.xacNhanKho && (
                <>
                  {/* Nút KHÓA khi còn phiếu thiếu tệp — không giấu nút, vì giấu đi thì thủ
                      kho tưởng mình không có quyền. Khóa kèm lý do ngay bên cạnh. */}
                  <Button onClick={bamXacNhanKho} disabled={vuongMacTep !== null}>
                    <BadgeCheck className="size-4" aria-hidden />
                    Thủ kho xác nhận đã nhận đủ
                  </Button>
                  {vuongMacTep && (
                    <span className="flex items-start gap-1.5 text-sm text-warning-soft">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {vuongMacTep}
                    </span>
                  )}
                </>
              )}
              {/**
                * ★★ HỒ SƠ PHÒNG BAN: ẨN NÚT THÌ PHẢI NÓI VÌ SAO CHƯA XONG — Sếp 15/09/2026.
                *
                * 🔴 ĐỪNG DỌN KHỐI NÀY. Đơn phòng ban đã giao đủ mà vẫn chưa có `po.xacNhanKho` thì
                * tầng tự chốt đang bị một điều kiện chặn — và người dùng phải đọc được nó TẠI CHỖ.
                * Không in ra thì chỗ này là một khoảng trắng: không nút, không lý do, người dùng
                * tưởng app hỏng hoặc tưởng mình thiếu quyền (CLAUDE.md §3.5 — chức năng chưa xong
                * thì khoá lại và nói rõ lý do, không được để trống).
                *
                * 📌 Ca `!daGiaoDu` đã có dòng "Chưa đủ điều kiện…" ngay bên dưới lo rồi, nên khối
                * này chỉ nhận ca đã giao đủ — để không nói hai câu chồng nhau cho cùng một việc.
                */}
              {hoSoPhongBan && daGiaoDu && !po.xacNhanKho && (
                <p className="flex items-start gap-1.5 text-sm text-warning-soft">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    {vuongMacTep !== null ? (
                      <>
                        {vuongMacTep} Bổ sung phiếu giao hàng cho lần giao còn thiếu ở bảng “Phiếu
                        nhận hàng” phía trên — xong là đơn tự chuyển sang “Đã nhận đủ hàng”, không
                        phải bấm thêm nút nào.
                      </>
                    ) : (
                      <>
                        Đơn đã giao đủ và không thiếu phiếu giao hàng nào, nhưng chưa được chốt “Đã
                        nhận đủ hàng”. Thường gặp ở đơn ghi nhận TRƯỚC ngày 15/09/2026 — hãy mở
                        lại một phiếu ở bảng “Phiếu nhận hàng” phía trên và đính kèm lại phiếu giao
                        hàng để hệ thống chốt, hoặc báo quản trị nếu vẫn không chuyển.
                      </>
                    )}
                  </span>
                </p>
              )}

              {duocDuyetHoanThanhDon && daGiaoDu && po.xacNhanKho && !po.xacNhanTruongBP && (
                <div className="flex flex-col gap-1">
                  <Button onClick={bamXacNhanTruongBP}>
                    <BadgeCheck className="size-4" aria-hidden />
                    {/* 🔴 Nhãn nói TÊN CỦA VIỆC, không nói vai trò người đang bấm — Ban lãnh đạo
                        26/08/2026. Xem chú thích đầy đủ ở `trang/de-nghi-chi-tiet.tsx`, cùng nút
                        này. ⚠️ Hai trang phải nói GIỐNG NHAU: cùng một việc mà hai màn gọi hai
                        tên là người dùng tưởng có hai chức năng khác nhau. */}
                    Xác nhận hoàn thành đơn
                  </Button>
                  <span className="text-xs text-text-desc">
                    Nhân viên phụ trách đơn xác nhận. Trưởng bộ phận bấm thay khi cần.
                  </span>
                </div>
              )}
              {po.trangThai === "hoan_thanh" && (
                <p className="rounded-lg bg-success-bg px-3 py-2 text-sm text-success-soft">
                  PO đã hoàn thành — hồ sơ chuyển sang app Kế toán, PO khóa không sửa được nữa.
                </p>
              )}
              {!daGiaoDu && (
                <p className="text-sm text-text-desc">
                  Chưa đủ điều kiện — phải giao đủ khối lượng trước khi xác nhận hoàn thành.
                </p>
              )}

              {/* 🔴 KHÔNG ĐỂ KHỐI TRỐNG khi người xem không được duyệt — cùng nếp với nút thủ kho
                  ngay trên: không có nút mà không giải thích thì người dùng tưởng app lỗi hoặc
                  tưởng mình thiếu quyền, rồi đi hỏi vòng quanh. Nói rõ đang chờ AI. */}
              {daGiaoDu &&
                po.xacNhanKho &&
                !po.xacNhanTruongBP &&
                !duocDuyetHoanThanhDon && (
                  <p className="text-sm text-text-desc">
                    Đang chờ{" "}
                    {po.nguoiPhuTrachTen
                      ? `nhân viên phụ trách đơn (${po.nguoiPhuTrachTen})`
                      : "nhân viên phụ trách đơn"}{" "}
                    hoặc trưởng bộ phận thu mua xác nhận hoàn thành.
                  </p>
                )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* =====================================================================
          LỊCH SỬ — CHỈ hiện với ĐƠN KHÔNG GẮN ĐỀ NGHỊ (18/08/2026)
          =====================================================================
          🔴 Đơn CÓ đề nghị thì nhật ký nằm ở khối "Lịch sử" của trang chi tiết đề nghị, y
          như trước — vẽ thêm ở đây là chẻ một dòng thời gian thành hai chỗ.

          🔴 Đơn KHÔNG có đề nghị thì đây là NƠI DUY NHẤT còn dấu vết: ai lập đơn, ai ghi phiếu
          nhận, ai duyệt nhập kho, ai xác nhận hoàn thành. Không bày ra thì mọi thao tác trên
          đơn độc lập coi như không có người chịu trách nhiệm.

          ⚠️ Không in tên nhà cung cấp trong nhật ký (quy ước phiên 04) — chuỗi đã được
          `kho-du-lieu.tsx` dựng sẵn đúng luật đó, ở đây chỉ hiển thị. */}
      {!po.prId && (
        <Card>
          <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
            <h2 className="text-h3 text-text-primary">Lịch sử đơn hàng</h2>
            {po.lichSu && po.lichSu.length > 0 ? (
              <ol className="flex flex-col gap-2">
                {po.lichSu.map((m, i) => (
                  <li
                    key={`${m.thoiDiem}-${i}`}
                    className="flex flex-col gap-0.5 rounded-lg border border-border bg-surface p-(--hp-md-row-pad)"
                  >
                    <span className="text-sm text-text-primary">{m.hanhDong}</span>
                    <span className="text-xs text-text-desc">
                      {m.nguoiThucHien} · {formatDateTime(m.thoiDiem)}
                    </span>
                    {m.ghiChu && <span className="text-xs text-text-secondary">{m.ghiChu}</span>}
                  </li>
                ))}
              </ol>
            ) : (
              /* Đơn lập trước 18/08/2026 không có trường này — nói rõ, đừng để khối trống. */
              <p className="text-sm text-text-desc">
                Chưa có dòng nhật ký nào cho đơn này.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}

function ThongTin({ nhan, giaTri, href }: { nhan: string; giaTri: string; href?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-text-desc">{nhan}</span>
      {href ? (
        <Link href={href} className="text-sm font-medium text-primary hover:underline">
          {giaTri}
        </Link>
      ) : (
        <span className="text-sm font-medium text-text-primary">{giaTri}</span>
      )}
    </div>
  );
}

/** Một dòng của khối tổng tiền. `tong` = dòng Tổng tiền thanh toán, kẻ viền trên cho nổi. */
function DongTien({ nhan, giaTri, tong }: { nhan: string; giaTri: number; tong?: boolean }) {
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

function DieuKien({ so, nhan, xong, moTa }: { so: number; nhan: string; xong: boolean; moTa: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          xong ? "bg-success text-white" : "bg-muted text-text-desc"
        }`}
        aria-hidden
      >
        {xong ? "✓" : so}
      </span>
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${xong ? "text-text-primary" : "text-text-secondary"}`}>
          {nhan}
        </span>
        <span className={`text-xs ${xong ? "text-success-soft" : "text-text-desc"}`}>{moTa}</span>
      </div>
    </li>
  );
}
