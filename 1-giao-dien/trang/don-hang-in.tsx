"use client";

import { useParams } from "next/navigation";
import { PrintToolbar } from "@/1-giao-dien/thanh-phan-dung-chung/print-toolbar";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { tinhTienDonHang } from "@/2-quy-trinh/tinh-toan";
import { docSoTien } from "@/6-tien-ich/doc-so-tien";

/**
 * TRANG IN ĐƠN MUA HÀNG — A4 dọc.
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
 * 🔒 Chỉ vai trò được xem giá mới mở được trang này — đơn gửi nhà cung cấp buộc phải có
 *    đơn giá, nên không có bản "ẩn giá" của trang này.
 */
export default function TrangInDonHang() {
  const params = useParams<{ id: string }>();
  const { donHang, giaDonHang, nhaCungCap } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  const po = donHang.find((x) => x.id === params.id);
  const gia = giaDonHang.find((g) => g.poId === params.id);
  const ncc = po ? nhaCungCap.find((n) => n.id === po.supplierId) : undefined;

  if (!po) {
    return (
      <ThongBaoTrang
        tieuDe="Không tìm thấy đơn đặt hàng"
        moTa="Đơn hàng này không tồn tại hoặc chưa được sinh sẵn trang in."
      />
    );
  }

  if (!quyen.xemGia) {
    return (
      <ThongBaoTrang
        tieuDe="Không có quyền in đơn mua hàng"
        moTa={`Vai trò "${nguoiDung.chucDanh}" không được xem giá. Đơn mua hàng gửi nhà cung cấp bắt buộc có đơn giá nên không có bản in ẩn giá.`}
      />
    );
  }

  const tien = tinhTienDonHang(po, gia);
  const donViTien = gia?.loaiTien ?? "VND";
  const soTien = (n: number) => n.toLocaleString("vi-VN");

  return (
    <div className="min-h-screen bg-white text-[#101828]">
      <PrintToolbar />

      {/* Khổ A4 dọc: 210mm trừ lề 15mm mỗi bên = 180mm bề ngang in được */}
      <article className="mx-auto w-full max-w-[210mm] px-[15mm] py-[12mm] print:px-0 print:py-0">
        {/* ---------- ĐẦU TRANG: pháp nhân bên mua ---------- */}
        <header className="text-center">
          <p className="text-[13px] font-bold uppercase leading-tight text-[#101828]">
            Công ty Cổ phần Xây dựng Công nghiệp Hưng Phước
          </p>
          <p className="mt-1 text-[10px] leading-snug text-[#475467]">
            Địa chỉ: B_4B3_CN, Khu công nghiệp Mỹ Phước 3, Phường Thới Hòa, Thành phố Hồ Chí Minh,
            Việt Nam.
          </p>
          <p className="text-[10px] text-[#475467]">MST: 3703172689</p>

          <h1 className="mt-4 text-[20px] font-bold uppercase tracking-wide text-[#096AA7]">
            Đơn mua hàng
          </h1>
        </header>

        {/* ---------- HAI CỘT THÔNG TIN ---------- */}
        {/* `flex-wrap` để màn hẹp thì cột phải xuống dòng thay vì bị bó mất chữ.
            Khi IN thì giấy luôn đủ rộng nên vẫn nằm hai cột như mẫu. */}
        <section className="mt-4 flex flex-wrap justify-between gap-x-8 gap-y-2 text-[11px]">
          <dl className="flex min-w-[80mm] flex-1 flex-col gap-1">
            <Dong nhan="Tên nhà cung cấp" giaTri={po.supplierTen} dam />
            <Dong nhan="Địa chỉ" giaTri={ncc?.diaChi ?? "—"} />
            <Dong nhan="Mã số thuế" giaTri={ncc?.maSoThue ?? "—"} />
            <Dong nhan="Người Nhận" giaTri={po.nguoiNhanHangTen ?? "—"} />
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
        <table className="w-full min-w-[170mm] border-collapse text-[10px] print:min-w-0">
          <thead>
            <tr className="bg-[#EAF3F9]">
              {/* Tổng bề rộng phải đúng 100% — cộng quá 100 là trình duyệt tự bóp
                  cột cuối, chữ xuống dòng từng chữ một, in ra rất khó đọc. */}
              <O th w="5%" giua>STT</O>
              <O th w="9%">Mã hàng</O>
              <O th w="18%">Tên hàng</O>
              <O th w="20%">Thông số kỹ thuật</O>
              <O th w="6%" giua>ĐVT</O>
              <O th w="7%" phai>SL</O>
              <O th w="10%" phai>Đơn giá</O>
              <O th w="11%" phai>Thành tiền</O>
              <O th w="14%">Mục đích sử dụng</O>
            </tr>
          </thead>
          <tbody>
            {po.items.map((d) => {
              const donGia = gia?.lines.find((l) => l.sttDong === d.sttDong)?.donGia ?? 0;
              return (
                <tr key={d.sttDong} className="break-inside-avoid">
                  <O giua>{d.sttDong}</O>
                  <O>{d.maHang ?? ""}</O>
                  <O>{d.tenVatLieu}</O>
                  <O>{d.thongSoKyThuat ?? ""}</O>
                  <O giua>{d.donViTinh}</O>
                  <O phai>{soTien(d.khoiLuongDat)}</O>
                  <O phai>{soTien(donGia)}</O>
                  <O phai>{soTien(donGia * d.khoiLuongDat)}</O>
                  <O>{d.mucDichSuDung ?? ""}</O>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        {/* ---------- KHỐI TỔNG TIỀN ---------- */}
        {/* Đúng trình tự của biểu mẫu. Con số do `tinhTienDonHang` tính, trang in
            không tự cộng lại — tránh hai chỗ ra hai kết quả khác nhau. */}
        <section className="mt-3 flex justify-end">
          <dl className="w-[95mm] text-[11px]">
            <DongTien nhan="Cộng tiền hàng (Chưa trừ CK)" giaTri={soTien(tien.congTienHang)} />
            <DongTien nhan="Số tiền CK" giaTri={soTien(tien.chietKhau)} />
            <DongTien nhan="Cộng tiền hàng (Đã trừ CK)" giaTri={soTien(tien.congTienHangSauCK)} />
            <DongTien
              nhan={`Tiền thuế GTGT (thuế suất ${tien.thueSuatGTGT}%)`}
              giaTri={soTien(tien.tienThueGTGT)}
            />
            <DongTien nhan="Tổng tiền thanh toán" giaTri={soTien(tien.tongThanhToan)} tong />
          </dl>
        </section>

        <p className="mt-2 text-[11px]">
          <span className="text-[#475467]">Số tiền viết bằng chữ: </span>
          <span className="font-medium italic">{docSoTien(tien.tongThanhToan)}</span>
        </p>

        {/* ---------- ĐIỀU KHOẢN ---------- */}
        <section className="mt-4 flex flex-col gap-1 text-[11px]">
          <Dong
            nhan="Ngày giao hàng"
            giaTri={new Date(po.ngayGiaoDuKien).toLocaleDateString("vi-VN")}
            rong
          />
          <Dong
            nhan="Mã đề xuất và tên công trình"
            giaTri={`${po.prCode}${po.maHopDongCDT ? ` · ${po.maHopDongCDT}` : ""}`}
            rong
          />
          <Dong nhan="Căn cứ hợp đồng số" giaTri={po.maHopDongCDT ?? "—"} rong />
          <Dong nhan="Địa điểm giao hàng" giaTri={po.diaDiemGiaoHang ?? "—"} rong />
          <Dong nhan="Điều khoản khác" giaTri={po.dieuKhoanKhac ?? po.dieuKienGiaoHang ?? "—"} rong />
          <Dong nhan="Điều khoản thanh toán" giaTri={gia?.dieuKhoanThanhToan ?? "—"} rong />
        </section>

        {/* ---------- CHỮ KÝ ---------- */}
        <section className="mt-10 grid grid-cols-2 gap-8 text-center text-[11px] break-inside-avoid">
          <div>
            <p className="font-semibold">Xác nhận của nhà cung cấp</p>
            <p className="text-[10px] text-[#475467]">(Ký, họ tên)</p>
            <div className="h-20" />
          </div>
          <div>
            <p className="font-semibold">Bên mua hàng</p>
            <p className="text-[10px] text-[#475467]">(Ký, họ tên)</p>
            <div className="h-20" />
            <p className="font-medium">{po.nguoiPhuTrachTen}</p>
          </div>
        </section>
      </article>
    </div>
  );
}

// ------------------------------------------------------------
// CÁC MẢNH NHỎ CỦA TRANG IN
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
  return (
    <div className="flex gap-2">
      <dt className={`shrink-0 text-[#475467] ${rong ? "w-[52mm]" : "w-[28mm]"}`}>{nhan}:</dt>
      <dd className={dam ? "font-semibold" : "font-medium"}>{giaTri}</dd>
    </div>
  );
}

/** Một dòng trong khối tổng tiền. `tong` = dòng Tổng tiền thanh toán, kẻ viền trên. */
function DongTien({ nhan, giaTri, tong }: { nhan: string; giaTri: string; tong?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-0.5 ${
        tong ? "mt-1 border-t border-[#101828] pt-1.5" : ""
      }`}
    >
      <dt className={tong ? "font-bold" : "text-[#475467]"}>{nhan}</dt>
      <dd className={tong ? "text-[13px] font-bold text-[#096AA7]" : "font-medium"}>{giaTri}</dd>
    </div>
  );
}

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
}: {
  children?: React.ReactNode;
  th?: boolean;
  w?: string;
  giua?: boolean;
  phai?: boolean;
}) {
  const canh = giua ? "text-center" : phai ? "text-right" : "text-left";
  const lop = `border border-[#D0D5DD] px-1.5 py-1 align-top ${canh}`;
  if (th) {
    return (
      <th className={`${lop} font-semibold`} style={{ width: w }}>
        {children}
      </th>
    );
  }
  return <td className={lop}>{children}</td>;
}

/** Màn báo lỗi của trang in — không dùng EmptyState của app vì trang này nền trắng cố định. */
function ThongBaoTrang({ tieuDe, moTa }: { tieuDe: string; moTa: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-8">
      <div className="max-w-md text-center">
        <p className="text-lg font-semibold text-[#101828]">{tieuDe}</p>
        <p className="mt-2 text-sm text-[#475467]">{moTa}</p>
      </div>
    </div>
  );
}
