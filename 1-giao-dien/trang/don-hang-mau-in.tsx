"use client";

import { useEffect, useRef, useState } from "react";
import { PrintToolbar } from "@/1-giao-dien/thanh-phan-dung-chung/print-toolbar";
import { ThongBaoTrangIn } from "@/1-giao-dien/thanh-phan-dung-chung/thong-bao-trang-in";
import { ToDonMuaHangA4 } from "@/1-giao-dien/thanh-phan-nghiep-vu/to-don-mua-hang-a4";
import {
  layBanMauDonMuaHang,
  type BanMauDonMuaHang,
} from "@/3-du-lieu/ban-mau-don-mua-hang";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";

/**
 * TRANG IN **BẢN MẪU** ĐƠN MUA HÀNG — địa chỉ cố định `/in/don-hang-mau`.
 *
 * 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 18/08/2026: *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*.
 *
 * Bản mẫu là đơn người lập vừa gõ ở `/don-hang/tao-moi` (chế độ không gắn phiếu đề nghị) mà
 * **CHƯA VÀO HỆ THỐNG**. Nó không có id, không có mã hồ sơ, nên không tra kho được.
 *
 * 🔴 DÙNG LẠI ĐÚNG `ToDonMuaHangA4` CỦA ĐƠN THẬT — bản vẽ chứng từ chỉ được có một bản. Chép
 * tay thành bản thứ hai là hai tờ giấy lệch nhau sau vài lần sửa, rồi một trong hai gửi sai cho
 * nhà cung cấp. Trang này chỉ khác trang `/in/don-hang/[id]` ở **chỗ lấy dữ liệu**.
 *
 * 📌 VÌ SAO ĐỊA CHỈ KHÔNG CÓ THAM SỐ: `/in/don-hang/[id]` là trang tĩnh, chỉ sinh sẵn cho danh
 * sách id khai trong `generateStaticParams` — bịa một id tạm là ra 404. Địa chỉ cố định thì
 * không vướng chốt đó. Dữ liệu đi qua kho tạm, xem `3-du-lieu/ban-mau-don-mua-hang.ts`.
 *
 * 🔒 Vẫn gác quyền `xemGia` như đơn thật: tờ giấy này có đơn giá và tổng tiền thanh toán. Cổng
 *    đăng nhập thì đã có `app/in/layout.tsx` → `CongBaoVe` lo.
 */
export default function TrangInDonHangMau() {
  const { nguoiDung, quyen, daDangNhap } = useNguoiDung();
  /**
   * `undefined` = chưa đọc kho tạm xong · `null` = không có bản mẫu nào.
   *
   * 🔴 PHẢI ĐỌC TRONG `useEffect`, không đọc ngay khi dựng component: `sessionStorage` chỉ có ở
   * trình duyệt, mà Next.js dựng sẵn trang này lúc build (xuất tĩnh) nên lần chạy đầu không có
   * `window`. Đọc thẳng là build dừng.
   */
  const [ban, setBan] = useState<BanMauDonMuaHang | null | undefined>(undefined);

  /**
   * 🔴 CHỐT "CHỈ ĐỌC MỘT LẦN" — KHÔNG PHẢI TỐI ƯU, LÀ SỬA LỖI THẬT (phát hiện 18/08/2026 khi
   * chạy thử trên trình duyệt).
   *
   * `layBanMauDonMuaHang()` đọc xong thì XÓA NGAY (cố ý, xem chú thích ở hàm đó). Mà React ở
   * chế độ Strict Mode — Next.js bật sẵn khi `npm run dev` — **chạy `useEffect` HAI LẦN** lúc
   * mới dựng component. Không có chốt này thì: lần một đọc được và xóa · lần hai đọc ra rỗng và
   * `setBan(null)` → màn hình luôn báo *"Không tìm thấy bản mẫu"* dù bản mẫu vừa được cất đúng.
   *
   * ⚠️ Bản dựng thật (`next build`) KHÔNG double-invoke nên lỗi này chỉ hiện khi chạy dev —
   * đúng kiểu bẫy làm người sau tưởng tính năng hỏng rồi đi sửa sai chỗ. Chốt lại cho cả hai
   * môi trường chạy giống nhau.
   *
   * 📌 Dùng `useRef` chứ không dùng biến ngoài component: `useRef` sống qua đúng một lần dựng
   * component, nên mở tab in lần sau vẫn đọc lại bình thường. Cùng cách mà
   * `form-lap-don-mua-hang.tsx` đang dùng cho `daDienTuDeNghi` / `daDienTuBaoGia`.
   */
  const daDoc = useRef(false);

  useEffect(() => {
    if (daDoc.current) return;
    daDoc.current = true;
    setBan(layBanMauDonMuaHang());
  }, []);

  if (daDangNhap === null) return <div className="min-h-screen bg-white" aria-busy="true" />;
  if (!daDangNhap) {
    return (
      <ThongBaoTrangIn
        tieuDe="Chưa đăng nhập"
        moTa="Mở app và đăng nhập trước, rồi lập lại bản mẫu đơn mua hàng."
      />
    );
  }

  if (!quyen.xemGia) {
    return (
      <ThongBaoTrangIn
        tieuDe="Không có quyền in đơn mua hàng"
        moTa={`Vai trò "${nguoiDung.chucDanh}" không được xem giá. Đơn mua hàng gửi nhà cung cấp bắt buộc có đơn giá nên không có bản in ẩn giá.`}
      />
    );
  }

  if (ban === undefined) return <div className="min-h-screen bg-white" aria-busy="true" />;

  if (ban === null) {
    return (
      <ThongBaoTrangIn
        tieuDe="Không tìm thấy bản mẫu"
        moTa="Bản mẫu chỉ sống một lần, đủ để mở tab in này. Tải lại trang hoặc mở lại bằng dấu trang thì phải quay về màn Lập đơn mua hàng (PO) và bấm “In mẫu PO” lần nữa."
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#101828]">
      <PrintToolbar />
      {/* Dải nhắc CHỈ TRÊN MÀN HÌNH (`print:hidden`) — dài dòng thì tốn giấy, mà tờ giấy đã có
          dòng "Bản mẫu — chưa cấp số, chưa lưu vào hệ thống" ngay dưới tiêu đề nên không mất
          thông tin khi in ra. */}
      <div className="border-b border-[#FEDF89] bg-[#FFFAEB] px-6 py-2.5 print:hidden">
        <p className="text-sm text-[#B54708]">
          <strong>Đây là bản mẫu, chưa lưu vào hệ thống.</strong> Đơn chưa được cấp số theo Thông
          báo 09/2026/TB-HPCS và không có trong danh sách đơn hàng. Muốn có đơn thật thì lập từ
          phiếu đề nghị trong Quy trình mua hàng.
        </p>
      </div>
      <ToDonMuaHangA4 po={ban.po} gia={ban.gia} ncc={ban.ncc} banMau />
    </div>
  );
}
