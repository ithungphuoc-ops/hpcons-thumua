"use client";

import { useParams } from "next/navigation";
import { PrintToolbar } from "@/1-giao-dien/thanh-phan-dung-chung/print-toolbar";
import { ToDonMuaHangA4 } from "@/1-giao-dien/thanh-phan-nghiep-vu/to-don-mua-hang-a4";
import { ThongBaoTrangIn } from "@/1-giao-dien/thanh-phan-dung-chung/thong-bao-trang-in";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";

/**
 * TRANG IN ĐƠN MUA HÀNG ĐÃ CẤT — A4 dọc, địa chỉ `/in/don-hang/[id]`.
 *
 * 🔴 TỪ 18/08/2026 TRANG NÀY KHÔNG CÒN VẼ TỜ ĐƠN. Toàn bộ bản vẽ nằm ở
 * `thanh-phan-nghiep-vu/to-don-mua-hang-a4.tsx` — **một bản duy nhất**, dùng chung với trang in
 * bản mẫu chưa lưu (`/in/don-hang-mau`, chỉ đạo Ban lãnh đạo 18/08/2026 *"chỉ cần tạo mẫu PO
 * thôi, chưa cần lưu"*). Chép tay thành hai bản là **cấm tuyệt đối**: bản in bám biểu mẫu giấy
 * thật của công ty, hai bản sẽ lệch nhau sau vài lần sửa và một trong hai gửi sai cho nhà cung
 * cấp.
 *
 * Việc còn lại của trang này, và cũng là lý do nó tồn tại: **tra kho dữ liệu theo id trên địa
 * chỉ, rồi gác ba lớp quyền**. Component vẽ không biết gì về kho dữ liệu và quyền.
 *
 * 🔒 Chỉ vai trò được xem giá mới mở được trang này — đơn gửi nhà cung cấp buộc phải có
 *    đơn giá, nên không có bản "ẩn giá" của trang này.
 */
export default function TrangInDonHang() {
  const params = useParams<{ id: string }>();
  const { donHang, giaDonHang, nhaCungCap } = useDuLieu();
  const { nguoiDung, quyen, daDangNhap } = useNguoiDung();

  const po = donHang.find((x) => x.id === params.id);
  const gia = giaDonHang.find((g) => g.poId === params.id);
  const ncc = po ? nhaCungCap.find((n) => n.id === po.supplierId) : undefined;

  // 🔴 Trang in nằm NGOÀI nhóm (app) nên không được `CongBaoVe` che — phải tự chặn.
  // Thiếu chỗ này thì gõ thẳng địa chỉ /in/don-hang/... là xem được đơn hàng kèm
  // ĐƠN GIÁ mà không cần đăng nhập.
  if (daDangNhap === null) return <div className="min-h-screen bg-white" aria-busy="true" />;
  if (!daDangNhap) {
    return (
      <ThongBaoTrangIn
        tieuDe="Chưa đăng nhập"
        moTa="Mở app và đăng nhập trước, rồi vào lại trang in đơn mua hàng."
      />
    );
  }

  if (!po) {
    return (
      <ThongBaoTrangIn
        tieuDe="Không tìm thấy đơn đặt hàng"
        moTa="Đơn hàng này không tồn tại hoặc chưa được sinh sẵn trang in."
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

  return (
    <div className="min-h-screen bg-white text-[#101828]">
      <PrintToolbar />
      <ToDonMuaHangA4 po={po} gia={gia} ncc={ncc} />
    </div>
  );
}
