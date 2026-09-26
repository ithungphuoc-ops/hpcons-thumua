import type { DonDatHang, GiaDonDatHang } from "@/3-du-lieu/kieu-du-lieu";
import { laDongHang, tinhTienChiTietPO } from "@/2-quy-trinh/tinh-toan";
import { dongNgayThangNam, soPhieuXuatKho } from "@/2-quy-trinh/phieu-xuat-kho";
import { docSoTien } from "@/6-tien-ich/doc-so-tien";

/**
 * ★ XEM NHANH PHIẾU XUẤT KHO NGAY TRÊN MÀN LẬP ĐƠN — Mẫu PO-03 (Sếp 26/09/2026: *"phải tạo giao
 * diện nhập liệu giống mẫu để có cái nhìn tổng quan"*).
 *
 * Bày ĐÚNG thứ tự ô của biểu mẫu `Phieu xuat kho   HPCons.xlsx` (xem `2-quy-trinh/phieu-xuat-kho.ts`)
 * bằng chính dữ liệu đang gõ trên form, để người lập soát tờ phiếu trước khi In.
 *
 * 🔴 CHỈ ĐỌC — không có ô nhập nào ở đây. Mọi ô nhập nằm ở khối đầu tờ / bảng hàng / khối giao
 * nhận của form; bày ô nhập thứ hai cho cùng một trường là "hai chỗ cùng nói một chuyện".
 *
 * 📌 KHÁC TỜ IN `to-phieu-xuat-kho-a4.tsx`: tờ in viết màu cứng (chứng từ giấy), còn khối này là
 * giao diện app nên dùng token Design System V1.1 và theo Sáng/Tối. Dữ liệu đưa vào là CÙNG một
 * đơn tạm (`dungDonHangMau`) mà nút In dùng, nên hai bên không nói khác nhau.
 *
 * 📱 Bảng 8 cột → trên điện thoại chuyển thành danh sách thẻ (V1.1: bảng nhiều cột → Card List).
 */
export function KhoiTongQuanPhieuXuatKho({
  po,
  gia,
  xemGia,
}: {
  po: DonDatHang;
  gia?: GiaDonDatHang;
  /** Không có quyền xem giá thì hai cột Đơn giá / Thành tiền để trống kèm lý do. */
  xemGia: boolean;
}) {
  const tien = tinhTienChiTietPO(po, gia);
  const tienTheoDong = new Map(tien.dong.map((t) => [t.sttDong, t]));
  const coGia = xemGia && gia !== undefined;
  const so = (n: number) => n.toLocaleString("vi-VN");
  const dongHang = po.items.filter(laDongHang);
  const trong = (v: string | undefined) =>
    v?.trim() ? (
      <span className="font-medium text-text-primary">{v.trim()}</span>
    ) : (
      <span className="italic text-text-desc">(chưa nhập)</span>
    );

  return (
    <section
      aria-label="Xem nhanh phiếu xuất kho"
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-sm text-text-secondary"
    >
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
        {/* (Sếp chỉnh mẫu 26/09/2026: bỏ dòng "Ban hành theo Thông tư 200…", bảng đổi thành Tên mặt hàng · Quy cách / chủng loại (bỏ cột Mã số)). Giữ ô trống để lưới 3 cột không lệch. */}
        <span aria-hidden />
        <div className="text-center">
          <p className="text-lg font-bold uppercase tracking-wide text-text-primary">
            Phiếu xuất kho
          </p>
          <p>
            Ngày:{" "}
            {trong(po.ngayLapPO ? new Date(po.ngayLapPO).toLocaleDateString("vi-VN") : undefined)}
          </p>
          <p>Số: {trong(soPhieuXuatKho(po))}</p>
        </div>
        <div className="md:justify-self-end">
          <p>Nợ: {trong(po.taiKhoanNoXuatKho)}</p>
          <p>Có: {trong(po.taiKhoanCoXuatKho)}</p>
        </div>
      </div>

      <dl className="flex flex-col gap-1">
        <div>
          <dt className="inline">Họ và tên người nhận: </dt>
          <dd className="inline">{trong(po.nguoiNhanHangTen)}</dd>
        </div>
        <div>
          <dt className="inline">Theo: </dt>
          <dd className="inline">{trong(po.canCuXuatKho)}</dd>
        </div>
        <div className="grid gap-1 md:grid-cols-[3fr_2fr]">
          <div>
            <dt className="inline">Xuất tại kho: </dt>
            <dd className="inline">{trong(po.khoXuat)}</dd>
          </div>
          <div>
            <dt className="inline">Địa điểm: </dt>
            <dd className="inline">{trong(po.diaDiemKhoXuat)}</dd>
          </div>
        </div>
        <div>
          <dt className="inline">Diễn giải: </dt>
          <dd className="inline">{trong(po.dienGiaiXuatKho)}</dd>
        </div>
      </dl>

      {/* ----- Bảng hàng: máy tính / máy tính bảng ----- */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted text-text-primary">
            <tr>
              <th rowSpan={2} className="border border-border px-2 py-1.5">STT</th>
              <th rowSpan={2} className="border border-border px-2 py-1.5 text-left">Tên mặt hàng</th>
              <th rowSpan={2} className="border border-border px-2 py-1.5 text-left">
                Quy cách / chủng loại
              </th>
              <th rowSpan={2} className="border border-border px-2 py-1.5">Đơn vị tính</th>
              <th colSpan={2} className="border border-border px-2 py-1.5">Số lượng</th>
              <th rowSpan={2} className="border border-border px-2 py-1.5">Đơn giá</th>
              <th rowSpan={2} className="border border-border px-2 py-1.5">Thành tiền</th>
            </tr>
            <tr>
              <th className="border border-border px-2 py-1.5">Theo chứng từ</th>
              <th className="border border-border px-2 py-1.5">Thực xuất</th>
            </tr>
          </thead>
          <tbody>
            {dongHang.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-border px-2 py-3 text-center text-text-desc">
                  Chưa có dòng hàng — thêm ở bảng hàng phía trên.
                </td>
              </tr>
            ) : (
              dongHang.map((d) => {
                const t = tienTheoDong.get(d.sttDong);
                return (
                  <tr key={d.sttDong}>
                    <td className="border border-border px-2 py-1.5 text-center">{d.sttDong}</td>
                    <td className="border border-border px-2 py-1.5 text-text-primary">{d.tenVatLieu}</td>
                    <td className="border border-border px-2 py-1.5">{d.thongSoKyThuat?.trim() ?? ""}</td>
                    <td className="border border-border px-2 py-1.5 text-center">{d.donViTinh}</td>
                    <td className="border border-border px-2 py-1.5 text-right tabular-nums">
                      {so(d.khoiLuongDat)}
                    </td>
                    <td className="border border-border px-2 py-1.5" />
                    <td className="border border-border px-2 py-1.5 text-right tabular-nums">
                      {coGia && t ? so(t.donGia) : ""}
                    </td>
                    <td className="border border-border px-2 py-1.5 text-right tabular-nums">
                      {coGia && t ? so(t.thanhTien) : ""}
                    </td>
                  </tr>
                );
              })
            )}
            <tr className="font-semibold text-text-primary">
              <td className="border border-border px-2 py-1.5" />
              <td className="border border-border px-2 py-1.5 text-center">Cộng</td>
              <td colSpan={5} className="border border-border px-2 py-1.5" />
              <td className="border border-border px-2 py-1.5 text-right tabular-nums">
                {coGia ? so(tien.congTienHang) : ""}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ----- Bảng hàng: điện thoại — danh sách thẻ ----- */}
      <ul className="flex flex-col gap-2 md:hidden">
        {dongHang.length === 0 && (
          <li className="text-text-desc">Chưa có dòng hàng — thêm ở bảng hàng phía trên.</li>
        )}
        {dongHang.map((d) => {
          const t = tienTheoDong.get(d.sttDong);
          return (
            <li key={d.sttDong} className="rounded-lg border border-border p-3">
              <p className="font-medium text-text-primary">
                {d.sttDong}. {d.tenVatLieu}
                {d.thongSoKyThuat?.trim() ? ` — ${d.thongSoKyThuat.trim()}` : ""}
              </p>
              <p className="text-xs text-text-desc">
                Theo chứng từ: {so(d.khoiLuongDat)}{" "}
                {d.donViTinh}
              </p>
              {coGia && t && (
                <p className="text-xs tabular-nums">
                  Đơn giá {so(t.donGia)} · Thành tiền {so(t.thanhTien)}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-1">
        <p>
          Tổng số tiền (Viết bằng chữ):{" "}
          {coGia ? (
            <span className="italic text-text-primary">
              {(gia?.loaiTien ?? "VND") === "VND"
                ? docSoTien(tien.congTienHang)
                : `${so(tien.congTienHang)} ${gia?.loaiTien}`}
            </span>
          ) : (
            <span className="italic text-text-desc">
              {xemGia ? "(chưa có đơn giá)" : "(bạn không có quyền xem giá)"}
            </span>
          )}
        </p>
        <p>Số chứng từ gốc kèm theo: {trong(po.soChungTuGocXuatKho)}</p>
        <p className="text-right italic">{dongNgayThangNam(po.ngayLapPO)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-xs md:grid-cols-4">
        {["Người lập biểu", "Người nhận hàng", "Thủ kho", "Kế toán trưởng"].map((k) => (
          <div key={k} className="rounded-lg bg-muted px-2 py-3">
            <p className="font-semibold text-text-primary">{k}</p>
            <p className="italic text-text-desc">(Ký, họ tên)</p>
          </div>
        ))}
      </div>
    </section>
  );
}
