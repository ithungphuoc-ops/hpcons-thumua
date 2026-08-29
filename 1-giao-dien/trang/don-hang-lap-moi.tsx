"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AlertTriangle, X } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { Skeleton } from "@/1-giao-dien/nen-tang-ui/skeleton";
import { FormLapDonMuaHang } from "@/1-giao-dien/thanh-phan-nghiep-vu/form-lap-don-mua-hang";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";

/**
 * M4 — LẬP ĐƠN MUA HÀNG, bản MỘT TRANG RIÊNG (`/don-hang/tao-moi`).
 *
 * 🔴 TỪ 17/08/2026 PHẦN NHẬP LIỆU KHÔNG CÒN Ở ĐÂY. Toàn bộ form nằm ở
 * `thanh-phan-nghiep-vu/form-lap-don-mua-hang.tsx`; trang này chỉ là **cái vỏ mỏng** đọc tham
 * số địa chỉ rồi gọi đúng component đó.
 *
 * 🔴 MỘT FORM, MỘT CHỖ: tuyệt đối không chép ruột form về đây. Hai bản chép tay sẽ lệch nhau
 * sau vài lần sửa — lỗi dự án đã dính.
 *
 * ---
 *
 * ★★ TỪ 18/08/2026: TRANG NÀY LÀ **MODULE LẬP ĐƠN ĐỘC LẬP** ★★
 *
 * Chỉ đạo Ban lãnh đạo 18/08/2026, kèm ảnh chụp màn này đang hiện bước "Chọn phiếu đề nghị":
 *
 *   *"MUC NAY SE LA MODUL RIENG, KHONG LIEN QUAN GI TOI QUY TRINH, NO CHI DE PHUC VU LAP DON
 *   DAT HANG, NEN E KO CAN LINK NO TOI CAC BUOC QUY TRINH. va e hay hien thi cac truong nhap
 *   lieu cua modun nay luon"*
 *
 * 🔴 BƯỚC "CHỌN ĐỀ NGHỊ" ĐÃ XÓA HẲN (làm sáng 18/08/2026, bỏ ngay chiều 18/08/2026). Xóa chứ
 * không để lại mã chết: giữ một màn không có đường vào là đúng thứ "mồ côi" mà dự án đang phải
 * đi dọn. Cần dựng lại thì lấy ở lịch sử git.
 *
 * ⚠️ HAI ĐƯỜNG VÀO CŨ CHẠY Y NHƯ CŨ — đây là ràng buộc bắt buộc, không phải tùy chọn:
 *   · `?prId=…`                    (thẻ bảng quy trình, nút ở khối bước ④) → form CÓ đề nghị
 *   · `?prId=…&rfqId=…&nccId=…`    (tách PO từ bảng báo giá)              → form CÓ đề nghị,
 *     điền sẵn nhà cung cấp và giá theo phân bổ
 * Chức năng **tách PO theo phân bổ báo giá** chỉ đi qua đường này; module độc lập không làm
 * được nó, nên bỏ đường cũ là mất chức năng.
 *
 * 📌 Không có `prId` → form chạy **chế độ độc lập**: hiện ngay toàn bộ ô nhập liệu, mặt hàng
 * gõ tự do, mã dự án do người lập chọn. Xem bảng hai chế độ ở đầu `form-lap-don-mua-hang.tsx`.
 *
 * 🔴 CHIỀU 18/08/2026 — CHẾ ĐỘ ĐỘC LẬP **KHÔNG CẤT ĐƠN NỮA**. Ban lãnh đạo: *"chỉ cần tạo mẫu
 * PO thôi, chưa cần lưu"*. Thanh nút cuối form đổi thành **[In mẫu PO]** và **[Xuất Excel]**;
 * không có nút Cất, và không hàm nào ở nhánh đó gọi `themDonHang`. Nhờ vậy chế độ này không còn
 * đi vòng qua chốt kiểm soát chi tiêu `vuongMacLapDonHang` (rủi ro tôi đã báo lên sáng cùng
 * ngày, khi chế độ này còn cất đơn thật).
 *
 * ✅ MỞ LẠI CÓ KIỂM SOÁT 29/08/2026 — ĐỌC TIẾP TRƯỚC KHI TIN CÁI TRÊN LÀ HIỆN TRẠNG: người có
 * `quyen.taoPoDoiLap` (Trưởng bộ phận trở lên) GIỜ CẤT ĐƯỢC THẬT, vào trạng thái `"cho_de_nghi"`
 * chứ không phải `"da_chot"` — xem chú thích đầy đủ ở `themDonHang` (kho-du-lieu.tsx) và bảng
 * hai chế độ đầu `form-lap-don-mua-hang.tsx`. Đoạn trên vẫn ĐÚNG cho người KHÔNG có quyền đó.
 *
 * ⚠️ HỆ QUẢ Ở TRANG NÀY: prop `onDaLuu` bên dưới **chỉ chạy ở đường có `prId`**. Đừng bỏ nó
 * đi vì "thấy không dùng" — đường có đề nghị vẫn cần điều hướng sang đơn vừa cất.
 *
 * ✅ CẬP NHẬT 29/08/2026: câu trên KHÔNG còn đúng tuyệt đối — độc lập + `quyen.taoPoDoiLap`
 * (Trưởng bộ phận trở lên) GIỜ CŨNG gọi `luu()` và cũng nhận `onDaLuu` (hàm `luu()` vốn đã gọi
 * `onDaLuu?.(...)` bất kể có `prId` hay không). Đúng hành vi mong muốn: điều hướng sang trang
 * chi tiết PO vừa tạo, nơi có nút "+ Gắn đề nghị" để bổ sung sau — xem `hop-gan-de-nghi.tsx`.
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
  const { quyen } = useNguoiDung();

  /**
   * Đề nghị nguồn — CHỈ lấy từ địa chỉ. `null` khi vào từ menu (không có `prId`), HOẶC có
   * `prId` mà không tra ra.
   *
   * 🔴 `null` KHÔNG còn là ngõ cụt như trước 18/08/2026: form chạy chế độ độc lập.
   */
  const dn =
    prIdTuDiaChi !== null ? (deNghi.find((x) => x.id === prIdTuDiaChi) ?? null) : null;

  /**
   * Địa chỉ có `prId` mà không tra ra đề nghị = đường dẫn cũ, hoặc hồ sơ đã bị xóa.
   *
   * 🔴 PHẢI NÓI RA. Người dùng bấm một liên kết cũ và rơi vào chế độ mẫu mà không hay: họ gõ cả
   * cái đơn, bấm In, rồi tưởng đã lập được đơn cho phiếu mình định lập — mà từ chiều 18/08/2026
   * chế độ đó **không lưu gì cả**, nên hôm sau đi tìm đơn là không có. Nói rõ mã nào không tìm
   * thấy, và form vẫn in/xuất mẫu được nên không ai bị bí việc.
   */
  const maKhongTimThay = prIdTuDiaChi !== null && dn === null ? prIdTuDiaChi : null;

  /* 📌 Cổng gác quyền (`quyen.lapPO`) nằm TRONG form — xem chú thích ở đó. Ở đây không kiểm
     lại: hai chỗ kiểm hai kiểu là sớm muộn lệch nhau. */
  /* 🔴 THU GỌN BỀ NGANG RIÊNG MÀN NÀY — Ban lãnh đạo 18/08/2026: *"THU GỌN LẠI NHÌN CHO CÂN
     ĐỐI, ĐỂ HIỂN THỊ FULL TRANG VẬY DỄ BỊ LOÃNG THÔNG TIN"*.

     Trên màn 1990px, khối thông tin 3 cột cho mỗi cột gần 600px — một ô nhập chỉ chứa vài chữ
     mà kéo dài gần nửa mét, mắt phải chạy ngang rất xa giữa nhãn và ô. Giới hạn 1400px, căn
     giữa: mỗi cột còn ~430px, vừa tầm đọc.

     📌 KHÔNG MÂU THUẪN với chỉ đạo 16/08/2026 *"bố cục lại các trường thông tin full màn
     hình"*: câu đó nói về TRANG CHI TIẾT ĐỀ NGHỊ — trang hai cột có bảng 8 cột, càng rộng
     càng dễ đọc. Màn này là một cột trường nhập, trải quá rộng thì loãng. Giới hạn đặt Ở ĐÂY
     chứ không đặt ở khung chung, nên không đụng trang kia.

     ⚠️ Bảng "Hàng tiền" 12 cột KHÔNG bị bóp theo — nó có khung cuộn ngang riêng bên trong
     form. Bóp bảng là các cột số chồng lên nhau. */
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-(--hp-md-section)">
      <PageHeader
        crumbs={
          dn
            ? [
                { label: "Thu mua", href: "/tong-quan" },
                { label: "Quy trình mua hàng", href: "/de-nghi" },
                { label: dn.code, href: `/de-nghi/${dn.id}` },
                { label: "Lập đơn mua hàng" },
              ]
            : [
                { label: "Thu mua", href: "/tong-quan" },
                { label: "Lập đơn mua hàng (PO)" },
              ]
        }
        title={dn ? "Lập đơn mua hàng" : "Lập đơn mua hàng (PO)"}
        /* 🔴 CÂU MÔ TẢ PHẢI NÓI THẬT VIỆC APP LÀM. Chế độ không gắn đề nghị (18/08/2026, Ban
           lãnh đạo: *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*) chỉ IN và XUẤT mẫu — nói "nhập
           đơn đặt hàng gửi nhà cung cấp" như trước là để người lập tưởng đơn đã vào hệ thống.
           Dải cảnh báo trong form nói kỹ hơn; ở đây chỉ cần một câu.

           ✅ CẬP NHẬT 29/08/2026: câu "không lưu vào hệ thống" chỉ còn đúng khi KHÔNG có
           `quyen.taoPoDoiLap` — người có quyền (Trưởng bộ phận trở lên) đã cất được đơn thật
           ở trạng thái "Chờ đề nghị", xem `themDonHang`/`form-lap-don-mua-hang.tsx`. */
        description={
          dn
            ? `Từ ${dn.code} · ${dn.tieuDe}`
            : quyen.taoPoDoiLap
              ? 'Lập đơn mua hàng khi chưa có đề nghị — vào trạng thái "Chờ đề nghị", bổ sung đề nghị sau.'
              : "Tạo MẪU đơn mua hàng để in hoặc xuất Excel. Đơn ở đây không lưu vào hệ thống."
        }
        /* ★ NÚT X ĐÓNG ở góc phải thanh tiêu đề — MISA mở màn này thành một CỬA SỔ nên có nút X
           (Ban lãnh đạo 18/08/2026: *"giao diện phần PO e chỉnh lại giống 100% như vậy"*).
           ✅ LÀM VIỆC THẬT: `router.back()`, đúng việc mà nút [Hủy] ở đáy form đang làm. Trùng
           chức năng với [Hủy] là CỐ Ý — MISA cũng có cả hai.
           📌 Chỉ có ở TRANG RIÊNG. Khi form nhúng trong khối bước ④ của trang chi tiết đề nghị thì
           không có "cửa sổ" nào để đóng; ở đó đã có nút gập của chính khối. */
        actions={
          <button
            type="button"
            onClick={() => router.back()}
            /* Vùng chạm 44×44 theo V1.1 Phần F. */
            className="flex size-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-danger-bg hover:text-danger"
            aria-label="Đóng màn lập đơn mua hàng"
            title="Đóng"
          >
            <X className="size-5" aria-hidden />
          </button>
        }
      />

      {maKhongTimThay !== null && (
        <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning-bg px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-soft" aria-hidden />
          <p className="min-w-0 text-sm text-warning-soft">
            Không tìm thấy đề nghị{" "}
            <span className="font-semibold break-all">{maKhongTimThay}</span>. Đường dẫn có thể
            đã cũ, hoặc hồ sơ đã bị xóa. Form dưới đây đang ở chế độ{" "}
            <strong>chỉ tạo mẫu, không lưu vào hệ thống</strong> — muốn lập đơn thật cho đúng
            phiếu thì mở phiếu đó trong Quy trình mua hàng rồi bấm “Lập đơn đặt hàng”.
          </p>
        </div>
      )}

      <FormLapDonMuaHang
        /* `null` = chế độ độc lập. Truyền tường minh cho người đọc thấy ngay là có chủ đích. */
        deNghi={dn}
        /* 🔴 CHỈ ĐIỀN SẴN TỪ BẢNG BÁO GIÁ KHI TRA RA ĐỀ NGHỊ THẬT.
           `prId` + `rfqId` + `nccId` là MỘT GÓI do màn Báo giá gửi sang. `prId` hỏng mà `rfqId`
           còn thì phần điền sẵn sẽ đem phân bổ của một hồ sơ khác áp vào đơn đang lập — khớp
           theo TÊN vật liệu (đường lùi trong form) hoàn toàn có thể trúng một dòng trùng tên.
           Form cũng tự bỏ qua khối điền sẵn khi không có đề nghị, đây là lớp thứ hai. */
        rfqId={dn !== null ? rfqId : null}
        nccIdTuBaoGia={dn !== null ? nccIdTuBaoGia : null}
        /* Ở trang riêng thì cất xong ĐI TIẾP đúng như cũ: "Cất và In" mở bản in A4, "Cất"
           thường mở trang chi tiết đơn vừa lập. Trang in tự chặn quyền `xemGia` bên trong. */
        onDaLuu={(poId, rangIn) =>
          router.push(rangIn ? `/in/don-hang/${poId}` : `/don-hang/${poId}`)
        }
        onHuy={() => router.back()}
      />
    </div>
  );
}
