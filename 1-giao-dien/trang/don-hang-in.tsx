"use client";

import { useParams, useRouter } from "next/navigation";
import { Printer, X } from "lucide-react";
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
/**
 * ★★ THANH CÔNG CỤ RIÊNG CỦA TRANG IN ĐƠN MUA HÀNG — nút "Đóng" QUAY VỀ BẢNG QUY TRÌNH.
 *
 * 🔴 SẾP YÊU CẦU 13/09/2026 (nguyên văn): *"nút Đóng ở trang in đơn mua hàng phải QUAY VỀ BẢNG
 * KANBAN, không đóng app"*.
 *
 * ── VÌ SAO PHẢI SỬA (lỗi có thật, không phải góp ý thẩm mỹ) ──────────────────────────────────
 * Thanh công cụ dùng chung `thanh-phan-dung-chung/print-toolbar.tsx` cho nút "Đóng" gọi
 * `window.close()`. Trình duyệt CHỈ cho một trang tự đóng cái tab mà **chính script đã mở ra**
 * bằng `window.open()`. Trang in đơn mua hàng lại được mở bằng HAI đường, và không đường nào
 * thoả điều kiện đó:
 *
 *   ① `trang/don-hang-chi-tiet.tsx` → nút "In đơn mua hàng" là một thẻ liên kết
 *      `<Link href="/in/don-hang/[id]" target="_blank">`. Tab mới do TRÌNH DUYỆT mở khi người
 *      dùng bấm liên kết, KHÔNG do script mở → `window.close()` bị chặn, **im lặng, không báo
 *      lỗi**. Người dùng bấm "Đóng" và không có gì xảy ra.
 *
 *   ② `trang/don-hang-lap-moi.tsx` → nút "Cất và In" gọi `router.push("/in/don-hang/<id>")`,
 *      tức là đi thẳng TRONG CHÍNH TAB ĐANG CHẠY APP. Ở đây `window.close()` mà chạy được thì
 *      nó đóng luôn cả tab app của người dùng — đúng thứ Sếp nói là "đóng app".
 *
 * ── CÁCH ĐÃ CHỌN VÀ VÌ SAO ───────────────────────────────────────────────────────────────────
 * Bấm "Đóng" thì **luôn luôn** điều hướng về `/de-nghi` (bảng quy trình mua hàng), bất kể trang
 * này được mở bằng đường nào. Đã cân nhắc phương án "đoán xem tab có đóng được không rồi mới
 * quyết định", và BỎ, vì ba lý do:
 *
 *   · Không có cách nào đáng tin để biết trước. `window.close()` thất bại **không ném lỗi, không
 *     trả về gì** — muốn biết chỉ còn cách gọi thử rồi hẹn giờ kiểm `window.closed`, tức là
 *     người dùng phải nhìn nút đứng im một lúc rồi trang mới nhảy. Xấu và khó kiểm thử.
 *   · Một nút mà lúc thì đóng tab lúc thì chuyển trang là không giải thích được cho người dùng,
 *     cũng không viết được vào tài liệu hướng dẫn.
 *   · Sếp nói rõ đích đến là bảng Kanban, không nói "đóng tab nếu được".
 *
 * ⚠️ CÁI GIÁ PHẢI TRẢ — nói rõ để không ai tưởng là lỗi: ở đường ①, tab cũ (trang chi tiết đơn)
 * vẫn nằm đó, nên sau khi bấm "Đóng" người dùng có HAI tab cùng mở app, tab này đang ở bảng quy
 * trình. Hơi thừa một tab, đóng bằng Ctrl+W như mọi tab khác. Đổi lại, nút không còn "bấm mà
 * không có gì xảy ra" — điều mục 3.5 của CLAUDE.md cấm: giao diện không được hứa một việc app
 * không làm.
 *
 * ⚠️ NHÃN NÚT ĐÃ GHI RÕ ĐÍCH ĐẾN ("Đóng, về bảng quy trình") thay vì mỗi chữ "Đóng". Vẫn theo
 * mục 3.5: người dùng phải biết trước cái gì sẽ xảy ra, nhất là khi đang ở tab app của mình và
 * sợ mất phần đang làm dở.
 *
 * ── VÌ SAO KHÔNG SỬA THẲNG `print-toolbar.tsx` DÙNG CHUNG ───────────────────────────────────
 * Thanh dùng chung đó còn phục vụ trang in **bản mẫu** `/in/don-hang-mau`. Trang bản mẫu được
 * mở bằng `window.open("/in/don-hang-mau", "_blank")` trong
 * `thanh-phan-nghiep-vu/form-lap-don-mua-hang.tsx` — **script tự mở**, nên ở đó `window.close()`
 * CHẠY ĐÚNG và cũng là hành vi đúng: đóng tab xem thử để người lập đơn quay lại đúng cái form
 * họ đang gõ dở ở tab kia. Nếu ép trang bản mẫu cũng nhảy về `/de-nghi` thì tab xem thử biến
 * thành một tab mồ côi nằm ở bảng quy trình, còn form dở dang thì nằm khuất sau lưng.
 *
 * 👉 Tức là hai trang in **cần hai hành vi khác nhau**, không phải một hành vi chung.
 *
 * 📌 VIỆC CÒN NỢ (đã ghi vào báo cáo để Sếp quyết): đẹp nhất là gộp lại MỘT thanh dùng chung,
 * thêm một prop kiểu `khiDong?: () => void` cho nơi gọi tự quyết, rồi xoá bản cục bộ này. Lần
 * này chưa làm vì phiên khác đang sửa song song và `print-toolbar.tsx` không nằm trong phần
 * việc được giao. Ai gộp lại thì nhớ giữ nguyên hành vi `window.close()` cho `/in/don-hang-mau`.
 *
 * 📌 MÀU VIẾT CỨNG LÀ CỐ Ý, không vi phạm mục 3.2. Trang in cố định nền sáng, không theo Dark
 * Mode và không theo tuỳ chọn màu cá nhân — quy ước đã có sẵn, xem chú thích đầu
 * `print-toolbar.tsx` và `thong-bao-trang-in.tsx`. Mã màu ở đây chép đúng bản dùng chung để hai
 * thanh trông y hệt nhau.
 *
 * 📌 `print:hidden` — thanh này chỉ có trên màn hình, không in ra giấy. Giữ nguyên như bản cũ.
 * 📌 Nút "In / Lưu PDF" giữ nguyên `window.print()` như cũ, không đụng gì tới luồng in.
 */
function ThanhCongCuInDonHang() {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#E4E7EC] bg-[#F9FAFB] px-6 py-3 print:hidden">
      <p className="text-sm text-[#475467]">
        Bấm <strong>In / Lưu PDF</strong>, rồi chọn <strong>&ldquo;Lưu thành PDF&rdquo;</strong> trong
        hộp thoại in để xuất file PDF.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => router.push("/de-nghi")}
          title="Đóng tờ đơn và quay về bảng quy trình mua hàng"
          className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-lg border border-[#D0D5DD] bg-white px-4 text-sm font-medium text-[#344054] transition-colors hover:bg-[#F2F4F7] xl:h-10"
        >
          <X className="size-4" aria-hidden />
          Đóng, về bảng quy trình
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-lg bg-[#096AA7] px-4 text-sm font-medium text-white transition-colors hover:bg-[#0A5D91] xl:h-10"
        >
          <Printer className="size-4" aria-hidden />
          In / Lưu PDF
        </button>
      </div>
    </div>
  );
}

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
      {/* Thanh công cụ riêng của trang này — nút "Đóng" quay về bảng quy trình, KHÔNG đóng tab
          app. Lý do đầy đủ ở chú thích của `ThanhCongCuInDonHang` ngay trên. */}
      <ThanhCongCuInDonHang />
      <ToDonMuaHangA4 po={po} gia={gia} ncc={ncc} />
    </div>
  );
}
