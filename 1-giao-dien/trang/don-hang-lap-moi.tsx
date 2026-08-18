"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { AlertTriangle, ChevronRight, ListChecks } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Skeleton } from "@/1-giao-dien/nen-tang-ui/skeleton";
import { FormLapDonMuaHang } from "@/1-giao-dien/thanh-phan-nghiep-vu/form-lap-don-mua-hang";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  dongLapDuocDonHang,
  dongThuocVeNguoi,
  giaiDoanDaKetThuc,
  NHAN_GIAI_DOAN,
  vuongMacLapDonHang,
  xacDinhGiaiDoan,
  type MoTaGiaiDoan,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import { tinhTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";

/**
 * M4 — LẬP ĐƠN MUA HÀNG, bản MỘT TRANG RIÊNG (`/don-hang/tao-moi`).
 *
 * 🔴 TỪ 17/08/2026 PHẦN NHẬP LIỆU KHÔNG CÒN Ở ĐÂY. Toàn bộ form đã dời sang
 * `thanh-phan-nghiep-vu/form-lap-don-mua-hang.tsx` để **dùng chung** với khối bước ④ trong
 * trang chi tiết đề nghị.
 *
 * Vì sao: Ban lãnh đạo 17/08/2026 — *"a cần phần nhập liệu phải nằm trong khối, chỉ ai được
 * cấp quyền thì mới xem được phần nhập liệu đó"*. Trước đó phần nhập liệu chỉ có ở trang riêng
 * này (vì màn "Đơn mua hàng" của MISA là một CỬA SỔ RIÊNG nên tôi làm thành TRANG riêng), còn
 * ở khối bước ④ chỉ có đúng một cái nút dẫn sang — nên đứng ở khối bước không thấy phần nhập
 * liệu, và Ban lãnh đạo hỏi sáu lượt *"mục giao diện giống misa đâu"*.
 *
 * 🔴 VÌ SAO KHÔNG BỎ TRANG NÀY: nó vẫn là đường DUY NHẤT của chức năng **tách PO từ bảng báo
 * giá** — chỉ nó nhận được hai tham số `rfqId` + `nccId` (`trang/bao-gia-chi-tiet.tsx`), thứ
 * mà khối nhúng không có. Ngoài ra bảng quy trình (`quyetDinhKeoTha` → `mo_trang`) cũng mở
 * địa chỉ này. Bỏ là làm mồ côi cả hai đường.
 *
 * 🔴 MỘT FORM, MỘT CHỖ: tuyệt đối không chép ruột form về đây. Hai bản chép tay sẽ lệch nhau
 * sau vài lần sửa — lỗi dự án đã dính.
 *
 * ---
 *
 * ★ TỪ 18/08/2026 TRANG NÀY CÒN LÀ MỘT MỤC MENU: **"Lập đơn mua hàng (PO)"**.
 *
 * Ban lãnh đạo 18/08/2026, kèm ảnh chụp khối "NHẬP ĐƠN ĐẶT HÀNG MỚI" của bước ④: *"e đưa mục
 * này ra thành 1 mục riêng bên tab trái, với tiêu đề là Lập đơn mua hàng (PO)"*. Khai báo mục
 * menu ở `2-quy-trinh/dieu-huong.ts` (kèm ghi chú vì sao việc này KHÔNG trái quy ước
 * `CLAUDE.md` 3.4b — quy ước đó đã được Ban lãnh đạo đổi đúng ngày này).
 *
 * 🔴 VÀO TỪ MENU THÌ KHÔNG CÓ `prId`, nên trang buộc phải có thêm **bước CHỌN ĐỀ NGHỊ**. Trước
 * 18/08/2026 trang chỉ đọc `prId` từ địa chỉ; vào từ menu là rơi thẳng vào nhánh "Chưa chọn
 * đề nghị" — một ngõ cụt, đúng loại lỗi vừa phải sửa hôm qua.
 *
 * ⚠️ HAI ĐƯỜNG VÀO CŨ PHẢI CHẠY Y NHƯ CŨ, đã giữ nguyên:
 *   · `?prId=…`                    (từ thẻ trên bảng quy trình) → vào thẳng form
 *   · `?prId=…&rfqId=…&nccId=…`    (tách PO từ bảng báo giá)    → vào thẳng form, điền sẵn
 * Bước chọn CHỈ hiện khi địa chỉ không có `prId` (hoặc `prId` trỏ vào đề nghị không tồn tại).
 */
export default function TrangLapDonHang() {
  /**
   * `useSearchParams` bắt buộc nằm trong Suspense, nếu không `next build` báo
   * "missing-suspense-with-csr-bailout" và dừng build.
   *
   * 📌 Chốt này là lý do form KHÔNG được tự đọc tham số địa chỉ: trang chi tiết đề nghị
   * (`/de-nghi/[id]`) không có `Suspense` nào và là trang tĩnh, nên form đọc `useSearchParams`
   * là build dừng ngay. Đề nghị nguồn phải TRUYỀN VÀO qua prop.
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
  const prIdTuDiaChi = searchParams.get("prId");
  /**
   * TÁCH PO: hai tham số này đến từ màn Báo giá, khi người dùng đã chia khối lượng một mặt
   * hàng cho nhiều nhà cung cấp rồi bấm "Lập đơn" cho một nhà cung cấp cụ thể.
   *
   * 🔴 VÌ SAO KHÔNG SINH PO TỰ ĐỘNG TỪ MÀN BÁO GIÁ: đơn đặt hàng còn cần ngày giao, người
   * nhận, địa điểm, điều khoản — những thứ chỉ người lập đơn biết. Nên form lập đơn vẫn là NƠI
   * DUY NHẤT tạo PO (một nguồn sự thật), phân bổ chỉ ĐIỀN SẴN vào đó.
   */
  const rfqId = searchParams.get("rfqId");
  const nccIdTuBaoGia = searchParams.get("nccId");
  const { deNghi } = useDuLieu();

  /**
   * Đề nghị người dùng vừa chọn ở BƯỚC CHỌN (chỉ dùng khi vào từ menu).
   *
   * 🔴 GIỮ TRONG STATE, KHÔNG đổi địa chỉ bằng `router.push("?prId=…")`. Bản dựng là hosting
   * tĩnh (`output: "export"`); thêm tham số vào địa chỉ chỉ để nhớ một lựa chọn tạm thì đổi
   * luôn hành vi nút Back của trình duyệt (bấm Back ra bước chọn thay vì ra chỗ vừa đến), mà
   * không được thêm gì. Muốn chia sẻ đường dẫn có sẵn đề nghị thì đã có `?prId=…` từ bảng
   * quy trình.
   */
  const [prIdDaChon, setPrIdDaChon] = useState<string | null>(null);

  /**
   * Đề nghị lấy được TỪ ĐỊA CHỈ. `null` khi địa chỉ không có `prId`, HOẶC có mà không tra ra.
   *
   * 🔴 PHẢI SO Ở MỨC "TRA RA ĐƯỢC ĐỀ NGHỊ", KHÔNG so ở mức "có tham số hay không".
   *
   * Bản đầu ngày 18/08/2026 viết `const prId = prIdTuDiaChi ?? prIdDaChon` — `??` chỉ nhường
   * khi vế trái là `null`, mà `?prId=BAD` cho ra chuỗi `"BAD"` (khác `null`). Hậu quả: vào
   * bằng một đường dẫn cũ / hồ sơ đã bị xóa thì bước chọn hiện ra đúng, nhưng **bấm vào dòng
   * nào cũng không đi đâu** — `setPrIdDaChon` chạy, rồi bị `"BAD"` đè lại ngay ở lần vẽ sau.
   * Đúng cái ngõ cụt mà khối chú thích bên dưới tự nhận là đã sửa.
   */
  const dnTuDiaChi =
    prIdTuDiaChi !== null ? (deNghi.find((x) => x.id === prIdTuDiaChi) ?? null) : null;

  /** Địa chỉ thắng state — nhưng chỉ khi địa chỉ TRA RA ĐỀ NGHỊ THẬT. */
  const dn =
    dnTuDiaChi ??
    (prIdDaChon !== null ? (deNghi.find((x) => x.id === prIdDaChon) ?? null) : null);

  if (!dn) {
    return (
      <BuocChonDeNghi
        /**
         * Địa chỉ có `prId` mà không tra ra đề nghị = đường dẫn cũ / hồ sơ đã bị xóa.
         *
         * 📌 Trước 18/08/2026 chỗ này hiện `EmptyState` "Chưa chọn đề nghị" — bí đường. Nay
         * vẫn nói rõ mã không tìm thấy, nhưng bày luôn danh sách chọn để người dùng đi tiếp
         * được ngay.
         */
        maKhongTimThay={prIdTuDiaChi}
        onChon={setPrIdDaChon}
      />
    );
  }

  /* 📌 Cổng gác quyền (`quyen.lapPO`) nằm TRONG form — xem chú thích ở đó. Ở đây không kiểm
     lại: hai chỗ kiểm hai kiểu là sớm muộn lệch nhau. */
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
        /* Đường quay lại bước chọn CHỈ hiện khi đề nghị do người dùng chọn tại trang này.
           Vào bằng `?prId=…` tra ra đề nghị thật thì không vẽ nút — đường vào cũ giữ nguyên
           như trước, và ở đó "đổi đề nghị" cũng vô nghĩa vì đề nghị do trang gọi quyết định.

           ⚠️ So `dnTuDiaChi`, KHÔNG so `prIdTuDiaChi`: `?prId=BAD` là chuỗi khác `null` nhưng
           đề nghị đang hiện lại do người dùng tự chọn — lúc đó phải có đường quay lại. */
        actions={
          dnTuDiaChi === null ? (
            <Button variant="outline" size="sm" onClick={() => setPrIdDaChon(null)}>
              <ChevronRight className="rotate-180" aria-hidden />
              Chọn đề nghị khác
            </Button>
          ) : undefined
        }
      />

      <FormLapDonMuaHang
        deNghi={dn}
        /* 🔴 CHỈ ĐIỀN SẴN TỪ BẢNG BÁO GIÁ KHI ĐỀ NGHỊ CŨNG LẤY TỪ ĐỊA CHỈ.
           `prId` + `rfqId` + `nccId` là MỘT GÓI do màn Báo giá gửi sang. Nếu `prId` hỏng mà
           `rfqId` còn, rồi người dùng tự chọn một đề nghị KHÁC ở bước chọn, thì phần điền sẵn
           sẽ đem phân bổ của bảng báo giá thuộc đề nghị này áp vào đề nghị kia — khớp theo TÊN
           vật liệu (đường lùi trong form) hoàn toàn có thể trúng một dòng trùng tên và điền
           khối lượng của hồ sơ khác vào đơn. */
        rfqId={dnTuDiaChi !== null ? rfqId : null}
        nccIdTuBaoGia={dnTuDiaChi !== null ? nccIdTuBaoGia : null}
        /* Ở trang riêng thì cất xong ĐI TIẾP đúng như cũ: "Cất và In" mở bản in A4, "Cất"
           thường mở trang chi tiết đơn vừa lập. Trang in tự chặn quyền `xemGia` bên trong. */
        onDaLuu={(poId, rangIn) =>
          router.push(rangIn ? `/in/don-hang/${poId}` : `/don-hang/${poId}`)
        }
        onHuy={() => router.back()}
      />
    </>
  );
}

/** Một dòng của danh sách chọn đề nghị. */
interface DongChonDeNghi {
  dn: DeNghiMuaHang;
  /** Bước hiện tại — suy ra từ chứng từ, không phải trường lưu sẵn. */
  buoc: MoTaGiaiDoan;
  /** Số mặt hàng của cả phiếu đề nghị. */
  soMatHang: number;
  /** Số mặt hàng NGƯỜI ĐANG ĐĂNG NHẬP lập được đơn ngay. */
  soDongLapDuoc: number;
  /** `null` = chọn được. Khác `null` = lý do chưa lập được đơn, in ngay trên dòng. */
  lyDoChan: string | null;
}

/**
 * ★ BƯỚC CHỌN ĐỀ NGHỊ — chỉ dùng khi vào trang từ mục menu "Lập đơn mua hàng (PO)".
 *
 * 🔴 ĐỀ NGHỊ CHƯA ĐỦ ĐIỀU KIỆN VẪN ĐƯỢC LIỆT KÊ, kèm LÝ DO ngay trên dòng, chỉ là không chọn
 * được. Giấu hẳn đi thì người dùng không hiểu vì sao phiếu của mình không có trong danh sách
 * và không biết phải đi làm gì tiếp — đúng ngõ cụt vừa phải sửa ngày 17/08/2026 (giao diện
 * không được im lặng khi từ chối một việc).
 *
 * 🔴 LUẬT LẤY TỪ `2-quy-trinh/`, KHÔNG tự đặt ở đây:
 *   · `xacDinhGiaiDoan` + `giaiDoanDaKetThuc` — hồ sơ còn chạy hay đã đóng
 *   · `dongLapDuocDonHang` / `dongThuocVeNguoi` — dòng nào của tôi, dòng nào lập được
 *   · `vuongMacLapDonHang` — CHÍNH luật mà `themDonHang` dùng để chặn lúc cất đơn
 * Nhờ dùng chung `vuongMacLapDonHang`, câu giải thích ở đây đúng là câu app sẽ chặn — không có
 * chuyện danh sách mời chọn rồi cất đơn mới báo không được.
 */
function BuocChonDeNghi({
  maKhongTimThay,
  onChon,
}: {
  /** Mã đề nghị trong địa chỉ mà không tra ra. `null` = vào từ menu, không có mã nào. */
  maKhongTimThay: string | null;
  onChon: (prId: string) => void;
}) {
  const router = useRouter();
  const { deNghi, donHang, baoGia, phieuNhan } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  const danhSach = useMemo<DongChonDeNghi[]>(() => {
    const ds: DongChonDeNghi[] = [];

    for (const dn of deNghi) {
      const maBuoc = xacDinhGiaiDoan(dn, donHang, baoGia, phieuNhan);
      /* Hồ sơ đã đóng (hoàn thành / thất bại) thì KHÔNG lập đơn được nữa — cùng luật mà trang
         chi tiết đề nghị dùng để không vẽ form ở khối bước ④. Không liệt kê vì đây không phải
         "đang vướng", mà là đã xong; câu chú ở cuối danh sách nói rõ điều đó. */
      if (giaiDoanDaKetThuc(maBuoc)) continue;

      const tienDo = tinhTienDoDeNghi(dn, donHang, phieuNhan);
      const cuaToi = dongThuocVeNguoi(tienDo, nguoiDung.uid, quyen.phanBoCongViec);
      const lapDuoc = dongLapDuocDonHang(tienDo, nguoiDung.uid, quyen.phanBoCongViec);

      /* PHẠM VI DANH SÁCH: người có quyền phân bổ (trưởng bộ phận / quản trị) thấy mọi đề nghị
         đang chạy vì họ lập đơn thay được cho cả nhóm; nhân viên chỉ thấy đề nghị có phần việc
         của mình. Đây là PHẠM VI TRÁCH NHIỆM, không phải "ẩn vì chưa đủ điều kiện" — nên vẫn
         đúng nguyên tắc ở đầu component. */
      if (!quyen.phanBoCongViec && cuaToi.length === 0) continue;

      /**
       * THỨ TỰ XÉT LÝ DO = THỨ TỰ VIỆC PHẢI LÀM TRONG QUY TRÌNH.
       *
       * Một đề nghị có thể vướng nhiều thứ cùng lúc; in hết ra là người dùng phải tự đoán nên
       * làm gì trước. Nên xét theo dòng chảy: phân bổ (bước ①) → còn khối lượng để đặt → báo
       * giá đã được duyệt (bước ③).
       */
      let lyDoChan: string | null;
      if (cuaToi.length === 0) {
        lyDoChan =
          "Chưa phân bổ người phụ trách cho mặt hàng nào. Phân bổ ở bước ① “Tiếp nhận và kiểm tra” trước khi lập đơn.";
      } else if (lapDuoc.length === 0) {
        /**
         * ⚠️ PHÂN BỔ MỘT PHẦN — không được nói "đã xong hết" khi vẫn còn dòng chưa ai nhận.
         *
         * Với trưởng bộ phận, `cuaToi` chỉ gồm dòng ĐÃ có người phụ trách. Hồ sơ 3 dòng mà 2
         * dòng đã phân bổ và lên đơn đủ, còn 1 dòng chưa phân bổ cho ai, sẽ rơi đúng vào nhánh
         * này — câu "mọi mặt hàng đã lên đơn đủ" khi đó là SAI, và sai theo hướng nguy hiểm
         * nhất: người có trách nhiệm giao việc yên tâm bỏ qua hồ sơ còn dòng chưa ai làm.
         */
        const chuaPhanBoConKhoiLuong = tienDo.filter(
          (d) => !d.nguoiPhuTrachUid && d.khoiLuongChuaLenPO > 0,
        ).length;
        lyDoChan =
          quyen.phanBoCongViec && chuaPhanBoConKhoiLuong > 0
            ? `Mặt hàng đã phân bổ đều lên đơn đủ khối lượng, nhưng còn ${chuaPhanBoConKhoiLuong} mặt hàng chưa có người phụ trách. Phân bổ ở bước ① “Tiếp nhận và kiểm tra” trước khi lập đơn.`
            : "Mọi mặt hàng thuộc phần việc của bạn đã lên đơn đủ khối lượng.";
      } else {
        lyDoChan = vuongMacLapDonHang(baoGia.filter((b) => b.prId === dn.id));
      }

      ds.push({
        dn,
        buoc: NHAN_GIAI_DOAN[maBuoc],
        soMatHang: dn.items.length,
        soDongLapDuoc: lapDuoc.length,
        lyDoChan,
      });
    }

    /* Chọn được lên trước — việc làm được ngay phải ở đầu tầm mắt. Trong cùng nhóm thì theo mã
       hồ sơ để thứ tự luôn giống nhau giữa hai lần mở trang (không sắp ngẫu nhiên theo thứ tự
       dữ liệu về). */
    return ds.sort((a, b) => {
      const uuTienA = a.lyDoChan === null ? 0 : 1;
      const uuTienB = b.lyDoChan === null ? 0 : 1;
      if (uuTienA !== uuTienB) return uuTienA - uuTienB;
      return a.dn.code.localeCompare(b.dn.code, "vi");
    });
  }, [deNghi, donHang, baoGia, phieuNhan, nguoiDung.uid, quyen.phanBoCongViec]);

  const soChonDuoc = danhSach.filter((d) => d.lyDoChan === null).length;

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Thu mua", href: "/tong-quan" },
          { label: "Lập đơn mua hàng (PO)" },
        ]}
        title="Lập đơn mua hàng (PO)"
        description="Chọn phiếu đề nghị cần lập đơn, rồi nhập đơn đặt hàng gửi nhà cung cấp."
      />

      {/* Địa chỉ cũ / hồ sơ đã bị xóa — nói rõ mã nào không tìm thấy, đừng để người dùng
          tưởng app hỏng. Có cả biểu tượng VÀ chữ, không chỉ dùng màu (V1.1). */}
      {maKhongTimThay !== null ? (
        <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning-bg px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-soft" aria-hidden />
          <p className="min-w-0 text-sm text-warning-soft">
            Không tìm thấy đề nghị <span className="font-semibold break-all">{maKhongTimThay}</span>.
            Đường dẫn có thể đã cũ, hoặc hồ sơ đã bị xóa. Chọn lại một đề nghị trong danh sách
            dưới đây.
          </p>
        </div>
      ) : null}

      {danhSach.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Chưa có đề nghị nào để lập đơn"
          description={
            quyen.phanBoCongViec
              ? "Không có đề nghị nào đang chạy. Đề nghị đã hoàn thành hoặc đã đóng dở không lập đơn được nữa. Vào bảng quy trình để nhận đề nghị mới hoặc lập bảng báo giá."
              : "Chưa có mặt hàng nào được phân bổ cho bạn ở các đề nghị đang chạy. Trưởng bộ phận phân bổ công việc thì đề nghị sẽ hiện ở đây. Vào bảng quy trình để xem hồ sơ đang ở bước nào."
          }
          /* Chỉ mời sang bảng quy trình khi tài khoản vào được màn đó — không được để giao
             diện hứa một việc app sẽ chặn (`duocVaoDuongDan` gác `/de-nghi` bằng
             `xemQuyTrinhMuaHang`). Hiện mọi ai có `lapPO` đều có cờ đó, nhưng kiểm ở đây thì
             sau này đổi luật quyền cũng không sinh nút chết. */
          action={
            quyen.xemQuyTrinhMuaHang
              ? { label: "Mở bảng quy trình mua hàng", onClick: () => router.push("/de-nghi") }
              : undefined
          }
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-text-primary">
                Chọn phiếu đề nghị ({danhSach.length})
              </p>
              <p className="text-xs text-text-desc">
                {soChonDuoc} phiếu lập được đơn ngay
              </p>
            </div>

            <ul className="flex flex-col gap-2">
              {danhSach.map((d) => (
                <li key={d.dn.id}>
                  <DongDanhSach dong={d} onChon={onChon} />
                </li>
              ))}
            </ul>

            {/* Nói ra thứ KHÔNG có trong danh sách. Thiếu câu này thì người dùng tìm một phiếu
                đã hoàn thành mà không thấy, rồi tưởng mất hồ sơ. */}
            <p className="text-xs text-text-desc">
              Danh sách không gồm đề nghị đã hoàn thành hoặc đã đóng dở
              {quyen.phanBoCongViec ? "" : ", và chỉ gồm đề nghị có mặt hàng phân bổ cho bạn"}.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

/**
 * Một dòng đề nghị trong bước chọn.
 *
 * 🔴 CHỌN ĐƯỢC thì là `<button>`; CHƯA ĐỦ ĐIỀU KIỆN thì là `<div>` kèm lý do. Không dùng
 * `<button disabled>`: nút mờ không giải thích được gì, mà người dùng vẫn cứ bấm. Ở đây lý do
 * là phần nội dung chính của dòng, không phải một dòng chữ mờ bên lề.
 *
 * ⚠️ KHÔNG có bảng nhiều cột ở đây (dù dữ liệu đúng dạng bảng): trang này mở nhiều trên điện
 * thoại của người đi công trường. Xếp dọc + `flex-wrap` thì không bao giờ trôi ngang, khỏi cần
 * khung cuộn riêng. Vùng chạm `min-h-16` > 44px theo V1.1 Phần F.
 */
function DongDanhSach({
  dong,
  onChon,
}: {
  dong: DongChonDeNghi;
  onChon: (prId: string) => void;
}) {
  const { dn, buoc, soMatHang, soDongLapDuoc, lyDoChan } = dong;

  const noiDung = (
    <>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-primary">{dn.code}</span>
          <StatusBadge label={buoc.nhan} tone={buoc.tong} />
          {lyDoChan !== null ? (
            <StatusBadge label="Chưa lập được đơn" tone="warning" />
          ) : null}
        </div>
        <span className="text-sm text-text-primary">{dn.tieuDe}</span>
        <span className="text-xs text-text-desc">
          {dn.tenCongTrinh} · {soMatHang} mặt hàng
          {lyDoChan === null ? ` · còn ${soDongLapDuoc} mặt hàng chưa lên đơn` : ""}
        </span>
        {lyDoChan !== null ? (
          <span className="text-xs text-warning-soft">{lyDoChan}</span>
        ) : null}
      </div>
      {lyDoChan === null ? (
        <ChevronRight className="mt-0.5 size-4 shrink-0 text-text-desc" aria-hidden />
      ) : null}
    </>
  );

  if (lyDoChan !== null) {
    return (
      <div className="flex min-h-16 w-full items-start gap-3 rounded-lg border border-border border-dashed bg-muted px-3 py-3 text-left">
        {noiDung}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onChon(dn.id)}
      className="flex min-h-16 w-full items-start gap-3 rounded-lg border border-border bg-card px-3 py-3 text-left transition-colors hover:border-primary hover:bg-primary-bg"
    >
      {noiDung}
    </button>
  );
}
