import type { ReactNode } from "react";
import Image from "next/image";
import {
  NHAN_MAU_PO,
  type DonDatHang,
  type GiaDonDatHang,
  type MauDonMuaHang,
  type NhaCungCap,
} from "@/3-du-lieu/kieu-du-lieu";
import {
  CAM_KET_THEO_HOP_DONG_CHUAN,
  CAM_KET_THOA_THUAN_CHUAN,
  GOI_Y_DIEU_KHOAN_KHAC,
  GOI_Y_DIEU_KHOAN_THANH_TOAN,
  dieuKhoanGiaoHangChuanTheoMau,
  daSuaKhacBanChuan,
  tachDongDieuKhoan,
} from "@/3-du-lieu/dieu-khoan-chuan-don-mua-hang";
import { laDongHang, moTaThueSuat, tinhTienChiTietPO } from "@/2-quy-trinh/tinh-toan";
import { docSoTien } from "@/6-tien-ich/doc-so-tien";

/**
 * TỜ ĐƠN MUA HÀNG A4 DỌC — **BẢN VẼ DUY NHẤT** của chứng từ in gửi nhà cung cấp.
 *
 * 🔴 CHỈ ĐƯỢC CÓ MỘT BẢN. Tách ra khỏi `trang/don-hang-in.tsx` ngày 18/08/2026 để hai chỗ dùng
 * chung: trang in đơn đã cất (`/in/don-hang/[id]`) và trang in **bản mẫu chưa lưu**
 * (`/in/don-hang-mau`, chỉ đạo Ban lãnh đạo 18/08/2026 *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*).
 *
 * Chép tay thành bản thứ hai là điều **cấm tuyệt đối**: bản in bám biểu mẫu giấy thật của công
 * ty, hai bản chép tay sẽ lệch nhau sau vài lần sửa và **một trong hai sẽ gửi sai cho nhà cung
 * cấp**. Vì vậy component này KHÔNG đọc kho dữ liệu, KHÔNG đọc địa chỉ URL, KHÔNG kiểm quyền —
 * nó chỉ nhận dữ liệu qua prop và vẽ. Mọi việc tra cứu và gác quyền nằm ở TRANG gọi nó.
 *
 * 📄 Bám ĐÚNG biểu mẫu đang dùng của công ty:
 *    `1. INPUT/Bieu mau/1. DON HANG HPCONS.xlsx`, sheet "Mẫu".
 *    Thứ tự các ô và tên nhãn giữ nguyên như trên giấy để người ký quen mắt:
 *      Tên nhà cung cấp · Địa chỉ · Mã số thuế · Người Nhận | Ngày · Số · Loại tiền
 *      Bảng: STT · Mã hàng · Tên hàng · Thông số kỹ thuật · ĐVT · SL · Đơn giá · Thành tiền · Mục đích sử dụng
 *      Cộng tiền hàng (chưa trừ CK) → Số tiền CK → Cộng tiền hàng (đã trừ CK)
 *      → Thuế suất GTGT + Tiền thuế GTGT → Tổng tiền thanh toán → Số tiền bằng chữ
 *      Ngày giao hàng · Mã đề xuất và tên công trình · Căn cứ hợp đồng số
 *      · Địa điểm giao hàng · Điều khoản khác · Điều khoản thanh toán
 *      Ký: Xác nhận của nhà cung cấp | Bên mua hàng
 *
 * 🔴 HAI QUY TẮC RIÊNG CỦA TRANG IN — đừng "sửa cho đúng chuẩn app":
 *  1. Màu và cỡ chữ viết CỨNG, không dùng token theme. Chứng từ in ra gửi nhà cung cấp
 *     không được đổi màu theo tùy chọn cá nhân của người bấm In (quy ước phiên 04).
 *  2. Nền luôn trắng, không theo Dark Mode.
 *
 * ★ ĐỐI CHIẾU LẠI VỚI BIỂU MẪU NGÀY 18/08/2026 — Ban lãnh đạo: *"đang thiếu logo công ty và chưa
 *   giống file template PO"*.
 *
 *   Đã đọc thẳng `1. INPUT/Bieu mau/1. DON HANG HPCONS.xlsx` bằng thư viện `exceljs` (chỉ đọc,
 *   không mở Excel nên file trong `1. INPUT/` không bị đổi một byte — đúng quy tắc mục 3.4 của
 *   CLAUDE.md; lần trước dùng Excel COM đã làm đổi kích thước file). Những thứ đo được từ biểu
 *   mẫu và nay đã áp đúng:
 *
 *   · **Logo** nằm ở ô A1:B4, tức GÓC TRÊN BÊN TRÁI — trước đây tờ in không có logo nào.
 *   · **Phông chữ Times New Roman** cho toàn bộ tờ giấy (mọi ô trong biểu mẫu đều Times New
 *     Roman). Trước đây tờ in dùng phông không chân của app, nên nhìn đã khác hẳn tờ giấy thật.
 *   · **Tên pháp nhân canh TRÁI** (ô C1:J1, `horizontal` để trống = trái), nằm cạnh logo — trước
 *     đây canh giữa và không có logo.
 *   · Màu chữ: tên công ty · địa chỉ · tiêu đề bảng · số tiền tổng = **`#000066`** (xanh mực đo
 *     được từ biểu mẫu). Tiêu đề "ĐƠN MUA HÀNG" = **đen**, cỡ 22pt.
 *     🔴 Trước đây tiêu đề và dòng tổng tô `#096AA7` — màu nhận diện của app, KHÔNG phải màu của
 *     biểu mẫu giấy.
 *   · Bảng hàng hóa: **nền trắng**, **viền mảnh màu đen**. Trước đây nền tiêu đề xanh nhạt
 *     `#EAF3F9` và viền xám `#D0D5DD` — cả hai đều không có trên biểu mẫu.
 *   · Bề rộng 9 cột lấy theo đúng tỉ lệ bề rộng cột A→J của biểu mẫu.
 *   · Thêm dòng **"Thuế suất thuế GTGT"** riêng (ô A17 của biểu mẫu là một trường độc lập), thay
 *     vì nhét mức thuế vào trong nhãn "Tiền thuế GTGT" như trước.
 *
 *   ⚠️ MỘT CHỖ CỐ Ý KHÔNG COPY: trên biểu mẫu, ô "Cộng tiền hàng (Chưa trừ CK)" gộp A14:G14 nên
 *   nhãn đó nằm sát lề trái, trong khi bốn nhãn cùng khối (Số tiền CK, Đã trừ CK, Tiền thuế,
 *   Tổng tiền) lại nằm ở cột E — nhìn trên giấy là một dòng lệch hẳn ra khỏi khối. Đây gần như
 *   chắc chắn là chỗ gộp ô thừa khi người lập biểu mẫu gõ, không phải chủ ý trình bày, nên tờ in
 *   giữ cả năm dòng thẳng cột với nhau. Nếu Ban lãnh đạo muốn giống y cả chỗ lệch này thì nói,
 *   sửa một dòng là xong.
 *
 * ★ HAI VIỆC BIỂU MẪU GIẤY KHÔNG DIỄN TẢ NỔI (thêm 17/08/2026, khi màn lập đơn bám MISA bắt
 *   đầu tạo ra được hai thứ này):
 *
 *   1. DÒNG GHI CHÚ chèn giữa bảng hàng (`DongPO.laDongGhiChu`). Vẫn IN RA vì đó là lời dặn
 *      thật của người lập đơn, nhà cung cấp cần đọc — nhưng KHÔNG có STT, SL, đơn giá, thành
 *      tiền, thuế, và không cộng vào một dòng tổng nào. Gộp ô ngang + chữ nghiêng để người
 *      đọc phân biệt ngay với dòng hàng.
 *      🔴 Trước đó dòng này in ra thành một mặt hàng SL 0 · đơn giá 0 · thành tiền 0 — tức là
 *      thêm một mặt hàng không có thật vào chứng từ gửi nhà cung cấp.
 *
 *   2. ĐƠN TRỘN NHIỀU MỨC THUẾ SUẤT (vừa 8% vừa 10%). Biểu mẫu chỉ có MỘT ô thuế suất cho cả
 *      đơn nên không nói được đơn kiểu này. Khi và CHỈ KHI trộn mức, bảng thêm hai cột
 *      "% Thuế GTGT" và "Tiền thuế GTGT" theo từng dòng; đơn một mức (gần như mọi đơn) giữ
 *      nguyên đúng 9 cột của biểu mẫu, không đổi một ô nào.
 *      🔴 Trước đó dòng tổng ghi cứng `thueSuatGTGT` — mà khi trộn mức, trường đó chỉ là mức
 *      của nhóm có giá trị lớn nhất, in ra là ghi sai chứng từ thuế. Nay dùng `moTaThueSuat`.
 */
export interface PropToDonMuaHangA4 {
  po: DonDatHang;
  /** Chứng từ giá — tách document riêng (nguyên tắc dữ liệu số 3) nên có thể không đọc được. */
  gia?: GiaDonDatHang;
  /**
   * Nhà cung cấp, để lấy Địa chỉ và Mã số thuế.
   *
   * ⚠️ Hai ô này lấy từ DANH MỤC chứ không lấy từ đơn — giữ nguyên hành vi có từ trước, không
   * đổi trong lần tách file này. Trang gọi chịu trách nhiệm truyền đúng thứ cần in.
   */
  ncc?: NhaCungCap;
  /**
   * ★ ĐÂY LÀ BẢN MẪU, CHƯA LƯU VÀO HỆ THỐNG (18/08/2026).
   *
   * 🔴 Chỉ thêm MỘT DÒNG CHỮ dưới tiêu đề, không đụng một ô nào của biểu mẫu. Mục đích: tờ giấy
   * rời khỏi màn hình rồi thì không còn ngữ cảnh nào cho biết nó chưa được cấp số và chưa vào
   * hệ thống — người cầm tờ giấy phải đọc được điều đó ngay trên giấy, không phải đoán.
   *
   * Trang in đơn thật (`/in/don-hang/[id]`) KHÔNG truyền prop này.
   */
  banMau?: boolean;
}

export function ToDonMuaHangA4({ po, gia, ncc, banMau = false }: PropToDonMuaHangA4) {
  /**
   * 🔴 MỘT NGUỒN TÍNH DUY NHẤT — tờ in KHÔNG tự nhân số lượng với đơn giá.
   *
   * Trước 17/08/2026 cột "Thành tiền" ở đây tính tay `donGia * khoiLuongDat`, tức là bỏ qua
   * bước làm tròn về đồng của `thanhTienDong`. Dòng có khối lượng lẻ (12,5 m³) thì bản in ra
   * số lẻ trong khi màn hình và file Excel ra số nguyên — hai chứng từ của cùng một đơn ghi
   * hai con số khác nhau.
   */
  /**
   * Mẫu in đang dùng. Đơn cũ không có `mauPO` → mặc định `thoa_thuan` (xem `DonDatHang.mauPO`).
   */
  const mau: MauDonMuaHang = po.mauPO ?? "thoa_thuan";

  /* ★ Điều khoản in ra: bản của ĐƠN nếu có, không thì bản chuẩn của công ty (22/08/2026).
     🔴 `??` chứ KHÔNG phải `||`: chuỗi rỗng là người lập cố ý xóa trắng khối điều khoản, còn
     `undefined` là đơn chưa sửa gì. `||` gộp hai thứ đó lại và in điều khoản vào đúng tờ đơn mà
     người lập đã quyết định bỏ. */
  /**
   * 🔴 BẢN CHUẨN CHỌN THEO MẪU ĐANG IN — sửa 26/08/2026 (Ban lãnh đạo: *"làm form giống 100% mẫu
   * a gửi"*). Mẫu PO-01 chỉ có HAI dòng "Phương thức giao hàng"; mẫu PO-02 mới có thêm khối 5
   * điều khoản. Trước đây in CHUNG một bản, tức mọi đơn theo hợp đồng đều in thừa 5 điều khoản
   * mà biểu mẫu giấy không có — lệch NỘI DUNG PHÁP LÝ, không phải lệch trình bày.
   */
  const banChuanTheoMau = dieuKhoanGiaoHangChuanTheoMau(mau);
  const dieuKhoanIn = po.dieuKhoanGiaoHang ?? banChuanTheoMau;
  const camKetIn = po.camKetThoaThuan ?? CAM_KET_THOA_THUAN_CHUAN;
  const daSuaBanChuan =
    daSuaKhacBanChuan(po.dieuKhoanGiaoHang, banChuanTheoMau) ||
    (mau === "thoa_thuan" && daSuaKhacBanChuan(po.camKetThoaThuan, CAM_KET_THOA_THUAN_CHUAN));

  const tien = tinhTienChiTietPO(po, gia);
  /** Kết quả tiền của từng dòng, tra theo `sttDong`. Dòng ghi chú KHÔNG có mặt ở đây. */
  const tienTheoDong = new Map(tien.dong.map((t) => [t.sttDong, t]));
  /** Đơn trộn nhiều mức thuế → thêm hai cột thuế theo dòng (xem chú thích đầu file, mục 2). */
  const coCotThue = tien.nhieuMucThue;
  /**
   * Bề rộng cột. Tổng phải ĐÚNG 100% — cộng quá 100 là trình duyệt tự bóp cột cuối, chữ
   * xuống dòng từng chữ một, in ra rất khó đọc. Hai bộ vì đơn trộn thuế có thêm hai cột.
   */
  /* Tỉ lệ lấy từ bề rộng cột A→J của biểu mẫu, quy về phần trăm. Bản có thêm hai cột thuế thì
     bóp đều mọi cột để nhường 14% cho hai cột mới.

     🔴 ĐÃ BỎ CỘT `ma` (cột thứ hai, không tiêu đề) — Ban lãnh đạo 27/08/2026: *"Bỏ cột trống này
     đi"*. Cột đó chiếm gần 1/10 bề ngang bảng mà LUÔN TRẮNG: ô nhập "Mã hàng" đã bị bỏ khỏi màn
     lập đơn từ 23/08/2026, nên chỉ đơn nhập từ file Excel mới có giá trị, và cũng không in ra
     tiêu đề nào để người nhận biết cột đó là gì.

     ⚠️ TRƯỜNG `maHang` VẪN CÒN trong dữ liệu và vẫn hiện ở trang chi tiết đơn — chỉ TỜ IN bỏ
     cột. Bộ đọc file Excel vẫn nhận cột "Mã hàng", đừng dọn theo.

     📌 Phần 9,5% (bản không thuế) / 8,2% (bản có thuế) của cột bỏ đi được chia cho ba cột CHỮ
     (Tên hàng · Quy cách · Mục đích sử dụng) — đó là những cột hay bị bó chữ nhất. Tổng vẫn phải
     ĐÚNG 100%, cộng quá là trình duyệt tự bóp cột cuối và chữ xuống dòng từng chữ một. */
  const beRong = coCotThue
    ? { stt: "4.7%", ten: "17.5%", tskt: "17%", dvt: "5.6%", sl: "8.2%", gia: "7.6%", tt: "12.9%", muc: "12.5%" }
    : { stt: "5.5%", ten: "20.3%", tskt: "19.8%", dvt: "6.5%", sl: "9.5%", gia: "8.9%", tt: "15%", muc: "14.5%" };

  const donViTien = gia?.loaiTien ?? "VND";
  const soTien = (n: number) => n.toLocaleString("vi-VN");

  return (
    /* Khổ A4 dọc: 210mm trừ lề 15mm mỗi bên = 180mm bề ngang in được.
       🔴 PHÔNG TIMES NEW ROMAN cho cả tờ giấy — mọi ô của biểu mẫu công ty đều dùng phông này.
       Khai ở thẻ ngoài cùng để mọi mảnh bên trong thừa hưởng, khỏi phải nhắc lại từng chỗ. */
    /**
     * 🔴 GIỮ PHẦN ĐỆM KHI IN — sửa 26/08/2026, cùng lượt với việc bỏ hai dòng header/footer của
     * trình duyệt.
     *
     * Trước đây có `print:px-0 print:py-0`: bỏ đệm khi in vì đã dựa vào **lề giấy của trình
     * duyệt**. Nay `app/in/layout.tsx` đặt `@page { margin: 0 }` để Chrome không còn chỗ in ngày
     * giờ và địa chỉ web vào lề — nghĩa là lề giấy nay bằng 0, và tờ đơn phải tự lo phần đệm.
     *
     * ⚠️ HAI CHỖ NÀY ĐI CẶP. Bỏ `@page margin: 0` mà để đệm ở đây thì lề gấp đôi; giữ `@page`
     * mà bỏ đệm ở đây thì chữ sát mép giấy và máy in cắt mất chữ.
     */
    <article className="mx-auto w-full max-w-[210mm] px-[15mm] py-[12mm] [font-family:'Times_New_Roman',Times,serif]">
      {/* ---------- ĐẦU TRANG: logo + pháp nhân bên mua ----------
          Bám ô A1:B4 (logo, góc trên bên trái) và C1:J1 / C2:I2 (tên + địa chỉ, canh trái)
          của biểu mẫu. `items-start` để tên công ty thẳng đỉnh logo như trên giấy. */}
      <header>
        <div className="flex items-start gap-[4mm]">
          {/* 🔴 `priority` để ảnh tải NGAY, không tải chậm theo tầm nhìn: trang in thường bị bấm
              In liền sau khi mở, ảnh tải chậm thì tờ giấy ra lò KHÔNG CÓ LOGO — đúng lỗi vừa bị
              nhắc, mà lại chỉ xảy ra lúc in nên rất khó phát hiện.
              Kích thước gốc 179×152; cao 24mm ứng với chỗ logo chiếm 4 hàng đầu của biểu mẫu. */}
          <Image
            src="/logo-hpc.png"
            alt="Logo Công ty Cổ phần Xây dựng Công nghiệp Hưng Phước"
            width={179}
            height={152}
            priority
            className="h-[24mm] w-auto shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold uppercase leading-tight text-[#000066]">
              Công ty Cổ phần Xây dựng Công nghiệp Hưng Phước
            </p>
            <p className="mt-1 text-[11px] leading-snug text-[#000066]">
              Địa chỉ: B_4B3_CN, Khu công nghiệp Mỹ Phước 3, Phường Thới Hòa, Thành phố Hồ Chí
              Minh, Việt Nam.
            </p>
            <p className="text-[11px] text-[#000066]">MST: 3703172689</p>
          </div>
        </div>

        {/* Ô A4:J4 của biểu mẫu: canh giữa cả trang, 22pt, đậm, MÀU ĐEN (không phải màu app). */}
        {/* ★ TIÊU ĐỀ THEO MẪU ĐÃ CHỌN — Ban lãnh đạo 21/08/2026: *"có trường tuỳ chọn 1 trong
            2 mẫu"*. Hai mẫu của biểu mẫu công ty khác nhau ngay ở dòng này; xem `NHAN_MAU_PO`.
            📌 Đơn cũ không có `mauPO` → mặc định `thoa_thuan`, vì phần lớn đơn lẻ không có hợp
            đồng riêng, và mẫu đó IN THÊM hai câu cam kết — thiếu thì chứng từ yếu hơn, còn in
            thừa thì chỉ là dài hơn. Chọn phía an toàn cho chứng từ. */}
        <h1 className="mt-3 text-center text-[22px] font-bold uppercase tracking-wide text-[#000000]">
          {NHAN_MAU_PO[mau].tieuDeIn}
        </h1>
        {/* 🔴 IN RA GIẤY, không phải chỉ hiện trên màn hình. Màu viết cứng như cả trang in. */}
        {banMau && (
          <p className="mt-1 text-center text-[11px] font-bold uppercase tracking-wide text-[#B42318]">
            Bản mẫu — chưa cấp số, chưa lưu vào hệ thống
          </p>
        )}
      </header>

      {/* ---------- HAI CỘT THÔNG TIN ---------- */}
      {/* `flex-wrap` để màn hẹp thì cột phải xuống dòng thay vì bị bó mất chữ.
          Khi IN thì giấy luôn đủ rộng nên vẫn nằm hai cột như mẫu. */}
      <section className="mt-4 flex flex-wrap justify-between gap-x-8 gap-y-2 text-[11px]">
        <dl className="flex min-w-[80mm] flex-1 flex-col gap-1">
          {/**
            * 🔴 ĐỌC TRƯỜNG CỦA CHÍNH ĐƠN TRƯỚC, DANH MỤC CHỈ LÀ ĐƯỜNG LUI.
            *
            * Ban lãnh đạo 27/08/2026: *"Nhứng trường ký tự đó hãy điều chỉnh sao để có thể sửa"*.
            *
            * TRƯỚC ĐÂY hai dòng này chỉ đọc `ncc` — mà trang in đơn đã cất lấy `ncc` bằng cách
            * TRA DANH MỤC theo `po.supplierId` (`trang/don-hang-in.tsx`). Nhà cung cấp chưa có
            * trong danh mục thì `ncc` là `undefined` và tờ in ra dấu "—" **dù người lập đã gõ đủ
            * địa chỉ và mã số thuế trên form** — gõ mà không sửa được tờ in, đúng thứ Sếp nói.
            *
            * 🔴 MÃ SỐ THUẾ LÀ THÔNG TIN PHÁP LÝ BẮT BUỘC trên chứng từ gửi ra ngoài. In ra "—" là
            * phát hành một tờ đơn thiếu, mà không có dòng nào báo.
            *
            * ⚠️ VÌ SAO ĐƠN ĐỨNG TRƯỚC DANH MỤC, KHÔNG PHẢI NGƯỢC LẠI: đơn là chứng từ ĐÃ PHÁT
            * HÀNH, phải giữ nguyên thông tin tại thời điểm lập. Ưu tiên danh mục thì ai sửa hồ sơ
            * nhà cung cấp hôm nay là đổi luôn nội dung những tờ đơn đã gửi đi từ tháng trước.
            * Danh mục chỉ dùng để lấp chỗ trống cho các đơn cũ chưa lưu hai trường này.
            *
            * 📌 Lỗi này TRƯỚC GIỜ KHÔNG LỘ RA khi thử, vì trang in BẢN MẪU tự dựng `ncc` từ đúng
            * ô người lập gõ (`2-quy-trinh/don-hang-mau.ts`) nên xem trước lúc nào cũng đúng — chỉ
            * đơn thật đã cất mới hiện dấu "—".
            */}
          <Dong nhan="Tên nhà cung cấp" giaTri={po.supplierTen} dam />
          <Dong nhan="Địa chỉ" giaTri={po.diaChiNCC?.trim() || ncc?.diaChi || "—"} />
          <Dong nhan="Mã số thuế" giaTri={po.maSoThueNCC?.trim() || ncc?.maSoThue || "—"} />
          {/**
            * ★★ "Theo hợp đồng" ĐỨNG NGAY SAU MÃ SỐ THUẾ, ở KHỐI ĐẦU — Ban lãnh đạo 26/08/2026
            * gửi hai biểu mẫu chuẩn và yêu cầu *"sửa lại các trường thông tin giống vậy"*.
            *
            * 🔴 TRƯỚC ĐÂY DÒNG NÀY NẰM Ở KHỐI DƯỚI (cạnh "Mã đề xuất"). Trên giấy nó thuộc khối
            * nhận diện bên bán, in đậm màu xanh dương ngay dưới mã số thuế — người cầm tờ đơn đọc
            * hợp đồng căn cứ ngay ở đầu tờ, không phải tìm xuống nửa dưới.
            *
            * 📌 CHỈ CÓ Ở MẪU PO-01 "theo hợp đồng". Mẫu PO-02 (thỏa thuận) thì chính tờ đơn đóng
            * vai hợp đồng — in thêm dòng này là hai văn bản cùng nhận vai trò hợp đồng cho một
            * giao dịch.
            */}
          {/**
            * 🔴 IN NGUYÊN VĂN NHỮNG GÌ NGƯỜI LẬP GÕ — KHÔNG GHÉP THÊM CHỮ NÀO.
            *
            * Ban lãnh đạo 27/08/2026: *"Dòng theo hợp đồng sẽ nhập thủ công, e để sẵn ô để ghi chú"*.
            *
            * TRƯỚC ĐÂY app tự dựng dòng này từ hai mảnh: `[số hợp đồng, "Ký ngày …"].join(" · ")`.
            * Cách đó ép mọi đơn vào đúng một khuôn chữ, trong khi hợp đồng ngoài đời ghi đủ kiểu
            * (số + phụ lục, "theo thoả thuận khung ngày …", nhiều hợp đồng cùng lúc). Nay ô trên
            * form là ghi chú tự do, nên tờ in chỉ việc chép lại.
            *
            * ⚠️ PHẢI DÙNG `?.trim() ||` CHỨ KHÔNG PHẢI `??`. Ô ghi chú rất dễ mang giá trị chuỗi
            * rỗng hoặc toàn khoảng trắng (người lập gõ rồi xoá); `??` chỉ bắt `undefined` nên tờ in
            * sẽ ra một dòng "Theo hợp đồng:" cụt, mất luôn chỗ chừa để viết tay.
            *
            * 📌 Để trống LÀ HỢP LỆ: dải chấm lửng chính là chỗ điền tay khi ký ngoài hiện trường.
            */}
          {mau === "theo_hop_dong" && (
            <Dong
              nhan="Theo hợp đồng"
              giaTri={po.maHopDongCDT?.trim() || "……………………………………………………………"}
              dam
            />
          )}
          {/* 🔴 "Người nhận hàng" và "Số điện thoại" ĐÃ DỜI XUỐNG KHỐI ĐIỀU KHOẢN — trên cả hai
              biểu mẫu chuẩn, hai ô đó nằm ở nửa dưới tờ, cùng nhóm với "Ngày giao hàng" và "Địa
              điểm giao hàng" (thông tin GIAO NHẬN), không thuộc khối nhận diện bên bán ở đầu tờ. */}
        </dl>
        <dl className="flex w-[62mm] shrink-0 flex-col gap-1">
          <Dong nhan="Ngày" giaTri={new Date(po.ngayLapPO).toLocaleDateString("vi-VN")} />
          <Dong nhan="Số" giaTri={po.code} dam />
          <Dong nhan="Loại tiền" giaTri={donViTien} />
        </dl>
      </section>

      {/* ---------- BẢNG HÀNG HÓA ----------
          Bảng 9 cột cần bề ngang; xem trước trên màn hẹp thì cho CUỘN TRONG KHUNG
          chứ không để cắt mất cột cuối. `print:overflow-visible` để khi in ra giấy
          bảng vẫn hiện đủ — giấy A4 luôn đủ rộng nên không cần cuộn. */}
      <div className="mt-4 overflow-x-auto print:overflow-visible">
        <table
          className={`w-full border-collapse text-[10px] print:min-w-0 ${
            coCotThue ? "min-w-[195mm]" : "min-w-[170mm]"
          }`}
        >
          <thead>
            {/* 🔴 KHÔNG tô nền hàng tiêu đề: biểu mẫu đo được là nền TRẮNG (`FFFFFFFF`), chữ đậm
                màu `#000066`. Nền xanh nhạt của bản trước là thói quen làm giao diện app, không
                có trên tờ giấy — và in bằng máy in đen trắng thì nó thành một dải xám. */}
            <tr className="text-[#000066]">
              <O th w={beRong.stt} giua>STT</O>
              {/* 📌 ĐÃ BỎ cột thứ hai (không tiêu đề, luôn trắng) — xem chú thích ở `beRong`. */}
              <O th w={beRong.ten}>Tên hàng</O>
              <O th w={beRong.tskt}>Quy cách / chủng loại</O>
              <O th w={beRong.dvt} giua>ĐVT</O>
              <O th w={beRong.sl} phai>SL</O>
              <O th w={beRong.gia} phai>Đơn giá</O>
              <O th w={beRong.tt} phai>Thành tiền</O>
              {coCotThue && (
                <>
                  <O th w="5%" phai>% Thuế GTGT</O>
                  <O th w="9%" phai>Tiền thuế GTGT</O>
                </>
              )}
              <O th w={beRong.muc}>Mục đích sử dụng</O>
            </tr>
          </thead>
          <tbody>
            {po.items.map((d) => {
              /* ===== DÒNG GHI CHÚ — in ra, nhưng KHÔNG phải một mặt hàng =====
                 Không STT, không SL, không đơn giá, không thành tiền, không thuế; và vì
                 `tinhTienChiTietPO` đã loại nó ra nên nó cũng không cộng vào dòng tổng nào. */
              if (!laDongHang(d)) {
                return (
                  <tr key={d.sttDong} className="break-inside-avoid">
                    <O giua />
                    {/* Gộp hết các cột còn lại sau ô STT. Tổng cột của bảng là 8 (hoặc 10 khi
                        đơn trộn nhiều mức thuế) — đã trừ cột thứ hai bỏ đi ngày 27/08/2026. */}
                    <O span={coCotThue ? 9 : 7} nghieng>
                      {d.tenVatLieu}
                    </O>
                  </tr>
                );
              }

              /* `tinhTienChiTietPO` lọc dòng bằng CHÍNH `laDongHang` ở trên, nên mọi dòng hàng
                 đều tra ra kết quả. `?? 0` chỉ là chốt chặn kiểu dữ liệu, không phải đường
                 chạy thật. */
              const t = tienTheoDong.get(d.sttDong);
              return (
                <tr key={d.sttDong} className="break-inside-avoid">
                  <O giua>{d.sttDong}</O>
                  <O>{d.tenVatLieu}</O>
                  <O>{d.thongSoKyThuat ?? ""}</O>
                  <O giua>{d.donViTinh}</O>
                  <O phai>{soTien(d.khoiLuongDat)}</O>
                  <O phai>{soTien(t?.donGia ?? 0)}</O>
                  <O phai>{soTien(t?.thanhTien ?? 0)}</O>
                  {coCotThue && (
                    <>
                      {/* Thuế suất CỦA CHÍNH DÒNG NÀY — không phải mức chung của đơn. */}
                      <O phai>{`${t?.thueSuatGTGT ?? 0}%`}</O>
                      <O phai>{soTien(t?.tienThueGTGT ?? 0)}</O>
                    </>
                  )}
                  <O>{d.mucDichSuDung ?? ""}</O>
                </tr>
              );
            })}
            {/**
              * ★★ KHỐI TIỀN NẰM TRONG BẢNG, CÓ KẺ Ô — Ban lãnh đạo 26/08/2026: *"ở bảng này cũng
              * cần bố cục lại cho giống nha"*, kèm ảnh chụp tờ in hiện tại.
              *
              * 🔴 TRƯỚC ĐÂY KHỐI TIỀN LÀ MỘT DANH SÁCH RỜI đặt bên phải, DƯỚI bảng và KHÔNG có
              * đường kẻ nào. Trên hai biểu mẫu chuẩn, bốn dòng tiền là **phần tiếp theo của chính
              * bảng hàng**, kẻ ô đầy đủ và thẳng cột với cột "Thành tiền".
              *
              * 🔴 "Thuế suất thuế GTGT" NẰM Ở Ô BÊN TRÁI, cùng hàng với "Tiền thuế GTGT" — đúng ô
              * A17 của biểu mẫu. Bản trước xếp nó thành một dòng riêng trong danh sách bên phải,
              * tức bỏ mất cách trình bày của tờ giấy.
              *
              * 📌 Cột "Mục đích sử dụng" (và hai cột thuế khi đơn trộn mức) để TRỐNG ở khối tiền,
              * đúng như trên giấy — không gộp vào ô số tiền.
              */}
            {(() => {
              /* Số cột sau "Thành tiền" — để ô cuối gộp đúng, không lệch bảng khi đơn trộn thuế. */
              const soCotCuoi = coCotThue ? 3 : 1;
              const DongTienTrongBang = ({
                nhanTrai,
                nhan,
                giaTri,
                tong,
              }: {
                nhanTrai?: string;
                nhan: string;
                giaTri: string;
                tong?: boolean;
              }) => (
                /* Sáu cột trước ô số tiền (3 + 3) để ô tiền rơi ĐÚNG cột "Thành tiền" — bảng có
                   8 cột sau khi bỏ cột trống 27/08/2026. Sửa số cột của bảng thì phải sửa cả
                   hai số này, nếu không khối tiền lệch khỏi cột Thành tiền. */
                <tr className={tong ? "font-bold text-[#000066]" : undefined}>
                  <O span={3}>{nhanTrai ?? ""}</O>
                  <O span={3}>
                    <span className="font-semibold">{nhan}:</span>
                  </O>
                  <O phai>{giaTri}</O>
                  <O span={soCotCuoi}>{""}</O>
                </tr>
              );
              return (
                <>
                  <DongTienTrongBang nhan="Số tiền Chiết khấu" giaTri={soTien(tien.chietKhau)} />
                  <DongTienTrongBang
                    nhan="Cộng tiền hàng (sau trừ chiết khấu)"
                    giaTri={soTien(tien.congTienHangSauCK)}
                  />
                  {/* `moTaThueSuat` là chỗ duy nhất quyết định cách viết: "8%" khi cả đơn một mức,
                      "nhiều mức" khi trộn. Ghi cứng `tien.thueSuatGTGT` là in mức của nhóm lớn
                      nhất thành mức của cả đơn — sai chứng từ thuế. */}
                  <DongTienTrongBang
                    nhanTrai={`Thuế suất thuế GTGT: ${moTaThueSuat(tien)}`}
                    nhan="Tiền thuế GTGT"
                    giaTri={soTien(tien.tienThueGTGT)}
                  />
                  <DongTienTrongBang
                    nhan="Tổng tiền thanh toán"
                    giaTri={soTien(tien.tongThanhToan)}
                    tong
                  />
                </>
              );
            })()}
          </tbody>
        </table>
      </div>


      {/* ⚠️ `docSoTien` đọc theo ĐỒNG VIỆT NAM. Đơn ngoại tệ thì ghi số kèm mã tiền, y hệt
          `xuat-don-hang-excel.ts` — hai chứng từ của cùng một đơn không được nói khác nhau,
          mà đọc "… đồng" cho một đơn USD là ghi sai số tiền phải trả. */}
      {/* Ô A19 của biểu mẫu: nhãn NGHIÊNG màu `#000066`; ô C19 (giá trị): đậm + nghiêng, cùng màu. */}
      <p className="mt-2 text-[11px] text-[#000066]">
        <span className="italic">Số tiền viết bằng chữ: </span>
        <span className="font-bold italic">
          {donViTien === "VND"
            ? docSoTien(tien.tongThanhToan)
            : `${soTien(tien.tongThanhToan)} ${donViTien}`}
        </span>
      </p>

      {/* ---------- ĐIỀU KHOẢN ---------- */}
      {/**
        * ★★ THỨ TỰ ĐÚNG THEO BIỂU MẪU CHUẨN (Ban lãnh đạo 26/08/2026):
        *     Mã đề xuất và tên công trình
        *     Người nhận hàng          |  Số điện thoại
        *     Ngày giao hàng
        *     Địa điểm giao hàng
        *     Phương thức giao hàng …
        *     Điều khoản thanh toán …
        *     Điều khoản khác …
        *
        * 🔴 TRƯỚC ĐÂY "Ngày giao hàng" đứng ĐẦU và "Người nhận hàng" thì nằm tít trên khối đầu tờ.
        * Người cầm tờ giấy dò xuống không thấy hàng nào khớp hàng nào.
        */}
      <section className="mt-4 flex flex-col gap-1 text-[11px]">
        {/* 🔴 DÒNG NÀY IN RA GIẤY GỬI NHÀ CUNG CẤP — không được để trống, và phải in ĐÚNG
            thứ mà nhãn hứa.

            Sửa 18/08/2026, hai việc:
            ① Đơn KHÔNG gắn đề nghị thì `prCode` là `undefined` → trước đây in ra chuỗi cụt.
            ② Nhãn ghi *"Mã đề xuất và **tên công trình**"* mà giá trị cũ ghép `maHopDongCDT`
               — mã hợp đồng đã có dòng riêng "Căn cứ hợp đồng số" ngay bên dưới, còn tên
               công trình thì không in ở đâu cả. `DonDatHang.tenCongTrinh` có từ 17/08/2026
               nhưng trang in chưa dùng. Nay in đúng hai thứ nhãn nói, khớp với file Excel
               xuất ra (`2-quy-trinh/xuat-don-hang-excel.ts` cũng ghép `prCode` + tên CT). */}
        <Dong
          nhan="Mã đề xuất và tên công trình"
          giaTri={[po.prCode, po.tenCongTrinh].filter(Boolean).join(" · ") || "—"}
          rong
        />
        {/* ★ "Người nhận hàng" và "Số điện thoại" NẰM CÙNG MỘT HÀNG, đúng như hai biểu mẫu chuẩn
            (Ban lãnh đạo 26/08/2026). Đây là thông tin GIAO NHẬN nên thuộc nhóm này, không thuộc
            khối nhận diện bên bán ở đầu tờ — nhà cung cấp gọi số này để hẹn giao. */}
        <div className="flex flex-wrap gap-x-10 gap-y-1">
          <Dong nhan="Người nhận hàng" giaTri={po.nguoiNhanHangTen ?? "—"} />
          <Dong nhan="Số điện thoại" giaTri={po.nguoiNhanHangSdt ?? "—"} />
        </div>
        {/**
          * ★ THỜI GIAN NHẬN HÀNG LÀ MỘT KHOẢNG — Ban lãnh đạo 27/08/2026: *"Mục này cho chọn
          * thời gian nhận hàng. Từ ngày này tới ngày khác"*.
          *
          * 📌 HAI CÁCH IN, TÙY ĐƠN: có ngày kết thúc thì in *"02/09/2026 — 05/09/2026"*; không
          * có thì in đúng một ngày như trước. Đơn hẹn giao gọn trong một ngày mà in ra một
          * khoảng "02/09 — 02/09" là chữ thừa trên chứng từ gửi ra ngoài.
          *
          * ⚠️ NHÃN VẪN LÀ "Ngày giao hàng" — đó là chữ trên biểu mẫu giấy của công ty. Ô nhập
          * trên form gọi là "Thời gian nhận hàng" cho đúng nghĩa mới, nhưng tờ in thì chép theo
          * giấy; đừng "thống nhất" bằng cách sửa nhãn tờ in.
          *
          * ⚠️ `po.ngayGiaoDenNgay` là trường THÊM SAU, đơn cũ không có — phải kiểm rỗng trước
          * khi đưa vào `new Date()`.
          */}
        <Dong
          nhan="Ngày giao hàng"
          giaTri={[
            new Date(po.ngayGiaoDuKien).toLocaleDateString("vi-VN"),
            po.ngayGiaoDenNgay
              ? new Date(po.ngayGiaoDenNgay).toLocaleDateString("vi-VN")
              : undefined,
          ]
            .filter(Boolean)
            .join(" — ")}
          rong
        />
        <Dong nhan="Địa điểm giao hàng" giaTri={po.diaDiemGiaoHang ?? "—"} rong />
      </section>

      {/**
        * ---------- ĐIỀU KHOẢN CỦA BIỂU MẪU ----------
        *
        * ★ Ban lãnh đạo 21/08/2026 gửi biểu mẫu `PO - DEMO 130826.xlsx` — ba đoạn này là chữ in
        * sẵn trên giấy. Ngày 22/08/2026 Ban lãnh đạo yêu cầu **cho sửa được nội dung**, nên nay
        * chúng đọc từ chính đơn, và chỉ rơi về bản chuẩn khi đơn chưa sửa gì.
        *
        * 📌 Văn bản chuẩn ở `3-du-lieu/dieu-khoan-chuan-don-mua-hang.ts` — MỘT chỗ duy nhất, dùng
        * chung với ô nhập trong form lập đơn. Hai nơi tự giữ một bản chữ là lệch nhau ngay lần
        * sửa đầu.
        *
        * ⚠️ Hai câu cuối CHỈ IN Ở MẪU THỎA THUẬN: chúng nói *"đơn này có giá trị như hợp đồng"* —
        * in vào đơn đặt theo hợp đồng đã ký là hai văn bản cùng nhận vai trò hợp đồng cho một
        * giao dịch.
        */}
      {(dieuKhoanIn !== "" || camKetIn !== "") && (
        <section className="mt-3 flex flex-col gap-1.5 text-[10px] leading-snug">
          {dieuKhoanIn !== "" && (
            <div>
              {tachDongDieuKhoan(dieuKhoanIn).map((d, i) =>
                /* Dòng trống giữ khoảng thở giữa các nhóm — `&nbsp;` để thẻ không bị co về 0. */
                d.laDongTrong ? (
                  <p key={i}>&nbsp;</p>
                ) : (
                  <p key={i} className={d.laTieuDe ? "font-semibold" : undefined}>
                    {d.chu}
                  </p>
                ),
              )}
            </div>
          )}

          {/**
            * ★★ HAI DÒNG ĐIỀU KHOẢN CUỐI — đúng vị trí và đúng chữ mẫu của biểu mẫu chuẩn
            * (Ban lãnh đạo 26/08/2026: *"sửa lại các trường thông tin giống vậy"*).
            *
            * 🔴 HAI CHỖ SỬA:
            *   ① VỊ TRÍ — trước đây hai dòng này nằm ở khối GIAO NHẬN phía trên (cạnh "Địa điểm
            *     giao hàng"). Trên giấy chúng đứng SAU khối "Phương thức giao hàng", ngay trước
            *     câu kết. Dò theo tờ giấy thì không thấy chúng ở chỗ mong đợi.
            *   ② CHỮ MẪU IN SẴN — giấy có sẵn *"kể từ khi Bên Bán giao đủ: …"* và *"(bổ sung ghi
            *     chú về đơn giá …)"*. Bản cũ chỉ in giá trị người lập nhập, nên đơn chưa điền ra
            *     một dòng cụt *"Điều khoản thanh toán: —"* — mất phần chữ nhà cung cấp cần đọc.
            */}
          <div className="flex flex-col gap-1">
            <p>
              <span className="font-semibold">Điều khoản thanh toán: </span>
              {gia?.dieuKhoanThanhToan?.trim() || "…………………………."}{" "}
              {GOI_Y_DIEU_KHOAN_THANH_TOAN}
            </p>
            <p>
              <span className="font-semibold">Điều khoản khác: </span>
              {(po.dieuKhoanKhac ?? po.dieuKienGiaoHang)?.trim() || (
                <span className="italic">{GOI_Y_DIEU_KHOAN_KHAC}</span>
              )}
            </p>
          </div>

          {mau === "thoa_thuan" && camKetIn !== "" && (
            <div className="italic">
              {tachDongDieuKhoan(camKetIn).map((d, i) =>
                d.laDongTrong ? <p key={i}>&nbsp;</p> : <p key={i}>{d.chu}</p>,
              )}
            </div>
          )}

          {/**
            * ★★ CÂU KẾT CỦA MẪU PO-01 — trước 26/08/2026 mẫu này KHÔNG CÓ câu kết nào, thiếu hẳn
            * so với giấy. Tờ đơn đặt theo hợp đồng phải nói rõ phần không nêu thì áp theo hợp
            * đồng gốc; thiếu câu đó thì tranh chấp về một điều khoản không có trên tờ đơn sẽ
            * không biết căn cứ vào đâu.
            *
            * 🔴 KHÁC HẲN hai câu của mẫu thỏa thuận ở trên — xem `CAM_KET_THEO_HOP_DONG_CHUAN`.
            */}
          {mau === "theo_hop_dong" && (
            <p className="font-semibold">{CAM_KET_THEO_HOP_DONG_CHUAN}</p>
          )}

          {/* 🔴 NÓI RÕ KHI BẢN ĐIỀU KHOẢN ĐÃ BỊ SỬA KHÁC BẢN CHUẨN.
              Cho sửa thì mỗi đơn có thể mang một bản khác nhau; lúc đối chiếu hồ sơ, người đọc
              phải nhận ra ngay tờ này không phải bản chuẩn của công ty — nếu không thì điều khoản
              bị đổi âm thầm và chỉ phát hiện khi đã tranh chấp. */}
          {daSuaBanChuan && (
            <p className="mt-1 text-[9px] not-italic text-neutral-600">
              (Điều khoản của đơn này đã được sửa khác bản chuẩn của công ty.)
            </p>
          )}
        </section>
      )}

      {/* ---------- CHỮ KÝ ---------- */}
      <section className="mt-10 grid grid-cols-2 gap-8 text-center text-[11px] break-inside-avoid">
        <div>
          <p className="font-semibold">Xác nhận của nhà cung cấp</p>
          {/* Ô B29/G29 của biểu mẫu: NGHIÊNG, màu đen, cùng cỡ 12pt với dòng trên. */}
          <p className="text-[11px] italic">(Ký, họ tên)</p>
          <div className="h-20" />
        </div>
        <div>
          <p className="font-semibold">Bên mua hàng</p>
          {/* Ô B29/G29 của biểu mẫu: NGHIÊNG, màu đen, cùng cỡ 12pt với dòng trên. */}
          <p className="text-[11px] italic">(Ký, họ tên)</p>
          <div className="h-20" />
          <p className="font-medium">{po.nguoiPhuTrachTen}</p>
        </div>
      </section>
    </article>
  );
}

// ------------------------------------------------------------
// CÁC MẢNH NHỎ CỦA TỜ IN
// ------------------------------------------------------------

/** Một dòng "nhãn: giá trị". `rong` = nhãn rộng hơn cho khối điều khoản cuối trang. */
function Dong({
  nhan,
  giaTri,
  dam,
  rong,
}: {
  nhan: string;
  giaTri: string;
  dam?: boolean;
  rong?: boolean;
}) {
  /* Nhãn màu ĐEN, cỡ bằng giá trị — đo được ở các ô A6→A9 và A21→A26 của biểu mẫu (12pt, đen,
     không đậm). Bản trước để xám `#475467` cho "dịu mắt", nhưng đây là chứng từ giấy: nhãn mờ
     hơn giá trị là cách trình bày của màn hình, không phải của biểu mẫu. */
  return (
    <div className="flex gap-2">
      <dt className={`shrink-0 ${rong ? "w-[52mm]" : "w-[28mm]"}`}>{nhan}:</dt>
      <dd className={dam ? "font-semibold" : "font-medium"}>{giaTri}</dd>
    </div>
  );
}

/*
 * 📌 ĐÃ BỎ component `DongTien` (khối tổng tiền dạng danh sách rời bên phải bảng) — Ban lãnh đạo
 * 26/08/2026: *"ở bảng này cũng cần bố cục lại cho giống nha"*. Trên hai biểu mẫu chuẩn, bốn dòng
 * tiền là **các hàng CÓ KẺ Ô nằm trong chính bảng hàng hóa**, không phải danh sách trôi ngoài
 * khung. Nay dùng `DongTienTrongBang` (khai ngay trong thân tờ in, vì nó cần biết bảng đang có bao
 * nhiêu cột mới gộp ô đúng). Đừng dựng lại kiểu danh sách rời.
 */

/**
 * Một ô của bảng hàng hóa. Gộp `<th>` và `<td>` vào một chỗ để chiều rộng cột và
 * cách canh lề của tiêu đề luôn khớp với thân bảng — tách ra là dễ lệch khi sửa.
 */
function O({
  children,
  th,
  w,
  giua,
  phai,
  span,
  nghieng,
}: {
  children?: ReactNode;
  th?: boolean;
  w?: string;
  giua?: boolean;
  phai?: boolean;
  /** Gộp ô ngang qua nhiều cột — dùng cho dòng ghi chú. */
  span?: number;
  /** Chữ nghiêng màu nhạt: dấu hiệu "đây là ghi chú, không phải mặt hàng". */
  nghieng?: boolean;
}) {
  const canh = giua ? "text-center" : phai ? "text-right" : "text-left";
  /* Viền MẢNH MÀU ĐEN — đúng viền `thin` màu `FF000000` đo được ở biểu mẫu. Viền xám `#D0D5DD`
     của bản trước là màu kẻ bảng trên màn hình, in ra giấy nhìn nhợt và mờ. */
  const lop = `border border-[#000000] px-1.5 py-1 align-top ${canh}${
    nghieng ? " italic text-[#475467]" : ""
  }`;
  if (th) {
    return (
      <th className={`${lop} font-semibold`} style={{ width: w }}>
        {children}
      </th>
    );
  }
  return (
    <td className={lop} colSpan={span}>
      {children}
    </td>
  );
}
