"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, Info, Lock, ScanSearch } from "lucide-react";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/1-giao-dien/nen-tang-ui/table";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { ODinhKemTep, rutGonTenTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { LienKetTep } from "@/1-giao-dien/thanh-phan-dung-chung/lien-ket-tep";
import { LienKetAnhQlkCtr } from "@/1-giao-dien/thanh-phan-dung-chung/lien-ket-anh-qlk-ctr";
import { ThanhTienDo } from "@/1-giao-dien/thanh-phan-nghiep-vu/thanh-tien-do";
import { HopGhiNhanGiaoHang } from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-ghi-nhan-giao-hang";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { tinhTienDoPO, vuongMacThayTepPhieuGiao } from "@/2-quy-trinh/tinh-toan";
import { xacDinhGiaiDoan } from "@/2-quy-trinh/giai-doan-mua-hang";
import { laHoSoPhongBan, LY_DO_NHANH_PHONG_BAN } from "@/2-quy-trinh/ho-so-phong-ban";
import {
  duocGhiDoiChieuThuMua,
  duocGhiNhanGiaoHangCuaHoSo,
  ghiNhanGiaoHangNhoNhanhPhongBan,
} from "@/4-phan-quyen/quyen-theo-ho-so";
import {
  nhanAnToan,
  NHAN_TRANG_THAI_PHIEU,
  NHAN_TRANG_THAI_PHIEU_PHONG_BAN,
} from "@/2-quy-trinh/trang-thai";
import type { DonDatHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * ★★★ NHÃN "HÀNG THÊM NGOÀI ĐỀ NGHỊ" — chốt (B) của Sếp ngày 16/09/2026.
 *
 * Nguyên văn chỉ đạo hôm đó: mở cho *"tăng giảm mặt hàng, số lượng, đơn giá, thuế"* khi sửa đơn,
 * đổi lại **dòng thêm mới phải được đánh dấu** để *"Kế toán và người duyệt biết phần nào đã qua
 * duyệt, phần nào thêm sau"*. Bảng này là màn hình hai nhóm người đó đọc, nên nhãn phải ở đây —
 * để nó nằm mỗi trong màn sửa đơn thì đúng người cần biết lại không bao giờ thấy.
 *
 * 🔴 CÓ CẢ MÀU LẪN CHỮ (Design System V1.1 §3.2): người không phân biệt được màu vẫn đọc ra. Tông
 * `warning` là cố ý — không phải lỗi (`danger`), chỉ là *"phần này chưa qua bước duyệt báo giá"*.
 * Cỡ chữ `text-xs` = 12px, đúng sàn cho phép; token `warning`/`warning-bg`/`warning-soft` đều có
 * thật trong `app/globals.css`.
 *
 * ⚠️ CỜ DO TẦNG GHI ĐẶT (`suaDonHang` → `soatBangMatHangKhiSua`), thành phần này chỉ hiện lại.
 */
function NhanThemNgoaiDeNghi({ hien }: { hien: boolean }) {
  if (!hien) return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-md border border-warning bg-warning-bg px-1.5 py-0.5 align-middle text-xs font-medium text-warning-soft">
      <AlertTriangle className="size-3 shrink-0" aria-hidden />
      Hàng thêm ngoài đề nghị
    </span>
  );
}

/**
 * M5 — Bảng tiến độ nhận hàng của một PO, có CỘT ĐỘNG theo từng lần giao.
 *
 * Đây là thứ bản thumua-next cũ KHÔNG có: bản cũ chỉ cộng dồn `receivedQuantity`
 * trên dòng PO nên mất ngày nhận từng lần. Yêu cầu số 1 của Ban lãnh đạo:
 * "ngày 06/08 nhận 10/20 bao xi măng".
 *
 * Quy tắc: CHỈ phiếu ở trạng thái "đã nhập kho" được tính vào khối lượng đã nhận.
 *
 * 🔴 (30/08/2026): BỎ HẲN GHI PHIẾU NHẬN HÀNG THỦ CÔNG TẠI ĐÂY — Sếp chốt bỏ vì đây là tính năng
 * có TRƯỚC khi đồng bộ QLK CTR → Thu mua (Việc "phiếu-nhận-moi") ra đời, giờ tồn tại song song
 * gây rủi ro thật: ai đó dùng nút này tạo ra 1 phiếu nhận hàng KHÔNG tương ứng dữ liệu thật nào
 * ở kho, trong khi nguồn thật duy nhất bây giờ là thủ kho ghi nhận nhập kho bên QLK CTR rồi tự
 * đồng bộ sang. Component này giờ CHỈ CÒN HIỂN THỊ (tiến độ + lịch sử phiếu), không còn tạo mới.
 * Vẫn giữ `ODinhKemTep` ở lịch sử phiếu (nhánh `else if` bên dưới) để bổ sung file cho phiếu THỦ
 * CÔNG CŨ đã lỡ tạo trước ngày này — không có tệp thì đơn đó kẹt vĩnh viễn không bấm hoàn thành
 * được (đúng lý do đã ghi trong chính nhánh đó).
 *
 * ★★★ 15/09/2026 — MỞ LẠI ĐƯỜNG GHI NHẬN GIAO HÀNG, **CHỈ CHO HỒ SƠ PHÒNG BAN** (nút "Ghi nhận
 * giao hàng", xem `hop-ghi-nhan-giao-hang.tsx`).
 *
 * 🔴 KHÔNG PHẢI HỦY LUẬT 30/08/2026 Ở TRÊN. Hồ sơ CÔNG TRÌNH vẫn y nguyên: phiếu chỉ vào app qua
 * cửa API do QLK CTR gọi sang, nút này không hiện, và nếu có đường nào gọi lọt thì tầng ghi vẫn
 * chặn (`vuongMacGhiNhanGiaoHangPhongBan` điều kiện ②, `3-du-lieu/kho-du-lieu.tsx`).
 *
 * Mở đúng một lỗ hổng mà chính luật 30/08 tạo ra: hồ sơ PHÒNG BAN **không có kho công trình nào**
 * để gửi phiếu sang, nên `khoiLuongConLai` không bao giờ về 0 và thẻ kẹt vĩnh viễn ở bước ⑥. Sếp
 * mở bản thật ngày 15/09/2026, phiếu `000000089`: *"phiếu 89 này là phiếu của phòng ban, nhưng
 * nhân viên vẫn chưa thể bấm xác nhận nhận hàng"*.
 *
 * 🔴 ĐỔI NGƯỜI GHI NHẬN, KHÔNG BỎ BẰNG CHỨNG — Sếp 15/09/2026: *"nhân viên thu mua tự hoàn thành,
 * **nhưng phải đính kèm phiếu giao hàng**"*. Nút Lưu trong hộp khóa tới khi có tệp.
 */
export function BangTienDoPO({ po }: { po: DonDatHang }) {
  const { deNghi, donHang, baoGia, phieuNhan, dinhKemPhieuGiao, ghiDoiChieuThuMua } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  /**
   * ★ Phiếu đang mở ô ghi lý do lệch (Sếp 17/09/2026 — dấu đối chiếu của Thu mua).
   *
   * 📌 CHỈ LÀ STATE MÀN HÌNH, không lưu gì. Bấm "Lệch" mở ô ngay tại dòng đó thay vì bật hộp thoại:
   * người dùng đang so số trên chính dòng này, đẩy họ sang một hộp khác là mất chỗ đang nhìn.
   */
  const [dangGhiLech, setDangGhiLech] = useState<string | null>(null);
  const [lyDoLech, setLyDoLech] = useState("");

  const phieuCuaPO = useMemo(
    () => phieuNhan.filter((p) => p.poId === po.id).sort((a, b) => a.lanGiaoThu - b.lanGiaoThu),
    [phieuNhan, po.id],
  );

  /**
   * ★ BƯỚC HIỆN TẠI CỦA ĐỀ NGHỊ CHỨA ĐƠN NÀY — chỉ để trả lời câu *"còn thay được tệp phiếu
   * giao nhận không"* (`vuongMacThayTepPhieuGiao`, Sếp 15/09/2026).
   *
   * 📌 `null` khi đơn KHÔNG gắn đề nghị (PO "chờ đề nghị", `prId` bỏ trống): không có bước nào
   * để xét, và luật tự hiểu như vậy — đừng bịa một bước ra cho đủ tham số.
   *
   * ⚠️ Giai đoạn SUY RA từ chứng từ chứ không phải trường lưu sẵn (xem `xacDinhGiaiDoan`), nên
   * phải tính lại mỗi khi đơn/báo giá/phiếu đổi — đó là lý do cả ba mảng nằm trong danh sách
   * phụ thuộc.
   */
  /**
   * ★ ĐỀ NGHỊ CHỨA ĐƠN NÀY — `null` khi đơn chưa gắn đề nghị nào (PO "chờ đề nghị", `prId` bỏ
   * trống). Tách riêng vì nay có HAI câu hỏi cần tới nó: bước hiện tại (`giaiDoanDeNghi`, bên
   * dưới) và *"đây có phải hồ sơ phòng ban không"* (nhánh phòng ban, Sếp 14/09/2026). Hai chỗ
   * cùng tự `find` là hai chỗ sớm muộn tra ra hai hồ sơ khác nhau.
   */
  const deNghiCuaPO = useMemo(
    () => (po.prId ? (deNghi.find((d) => d.id === po.prId) ?? null) : null),
    [po.prId, deNghi],
  );
  const giaiDoanDeNghi = useMemo(
    /* 🔴 Truyền `deNghi` (tham số cuối) — Sếp 15/09/2026: dòng đã nhân bản đi không còn tính là
       "chưa phân bổ". Thiếu tham số thì khối này hiện giai đoạn KHÁC với bảng quy trình cho cùng
       một hồ sơ, mà đây lại là chỗ quyết định khoá/mở ô đính kèm phiếu giao nhận. */
    () => (deNghiCuaPO ? xacDinhGiaiDoan(deNghiCuaPO, donHang, baoGia, phieuNhan, deNghi) : null),
    [deNghiCuaPO, donHang, baoGia, phieuNhan, deNghi],
  );

  /**
   * ★★ AI ĐƯỢC ĐÍNH KÈM PHIẾU GIAO NHẬN Ở ĐÂY — KHÔNG CÒN HỎI THẲNG `quyen.ghiPhieuNhanHang`.
   *
   * 🔴 CHỈ ĐẠO SẾP 14/09/2026: hồ sơ của PHÒNG BAN đi nhánh riêng, *"nhân viên mua hàng sẽ là
   * người bấm hoàn thành và đính kèm phiếu giao hàng"*. Cờ `quyen.ghiPhieuNhanHang` chỉ mở cho
   * thủ kho và quản trị, mà hồ sơ phòng ban KHÔNG có kho công trình nào gửi phiếu sang — giữ
   * nguyên là các hồ sơ đó kẹt vĩnh viễn, không ai đính kèm được phiếu để bấm hoàn thành.
   *
   * 🔴 LUẬT NẰM Ở `4-phan-quyen/quyen-theo-ho-so.ts`, KHÔNG so `tenCongTrinh` tại chỗ. Cùng lý do
   * với `vuongMacThayTepPhieuGiao` ngay dưới: một luật, mọi nơi gọi chung.
   */
  const duocDinhKemPhieuGiao = duocGhiNhanGiaoHangCuaHoSo(deNghiCuaPO, nguoiDung, quyen);
  /**
   * ★★ ĐƯỢC GHI DẤU ĐỐI CHIẾU KHÔNG — Sếp 17/09/2026: *"bước tiến hành nhận hàng… là bước check
   * song song với dữ liệu từ app kho đưa về"*.
   *
   * 🔴 KHÁC HẲN `duocDinhKemPhieuGiao` NGAY TRÊN, đừng gộp hai cờ. Cờ kia mở theo hồ sơ phòng ban
   * vì nó SINH RA khối lượng; cờ này mở cho **mọi hồ sơ** vì nó chỉ ghi lại việc thu mua đã soi
   * chéo số của kho — và hồ sơ công trình mới là nơi có phiếu kho để soi.
   */
  const duocDoiChieu = duocGhiDoiChieuThuMua(deNghiCuaPO, nguoiDung);
  /** Mở được là NHỜ nhánh phòng ban → bắt buộc in lý do ra, không nới im lặng. */
  const moNhoNhanhPhongBan = ghiNhanGiaoHangNhoNhanhPhongBan(deNghiCuaPO, nguoiDung, quyen);

  /**
   * ★★★ CÓ ĐƯỢC **TẠO MỚI** PHIẾU NHẬN HÀNG BẰNG TAY Ở ĐÂY KHÔNG (nút "Ghi nhận giao hàng",
   * 15/09/2026). Khác `duocDinhKemPhieuGiao` ngay trên: cái đó là *bổ sung tệp cho phiếu ĐÃ CÓ*,
   * cái này là *đẻ ra một phiếu mới*.
   *
   * 🔴 SOI ĐÚNG HAI ĐIỀU KIỆN ② VÀ ③ CỦA TẦNG GHI (`vuongMacGhiNhanGiaoHangPhongBan`):
   *   ② `laHoSoPhongBan` — hồ sơ công trình KHÔNG bao giờ hiện nút này, phiếu của họ do thủ kho
   *      ghi bên QLK CTR. Thiếu vế này là nút mở cho cả thủ kho trên mọi hồ sơ, tức mở lại đúng
   *      đường ghi tay toàn cục đã bỏ ngày 30/08/2026.
   *   ③ `duocGhiNhanGiaoHangCuaHoSo` — chính là biến `duocDinhKemPhieuGiao` đã tính ở trên.
   *
   * ⚠️ ĐỪNG TỰ CHẾ ĐIỀU KIỆN KHÁC cho nhanh. Nút mở rộng hơn tầng ghi thì người dùng nhập xong
   * cả phiếu mới nhận câu từ chối; nút hẹp hơn thì hồ sơ kẹt mà không ai hiểu vì sao — cả hai
   * kiểu lệch đều KHÔNG có dòng cảnh báo nào.
   */
  const duocGhiNhanGiaoHangTay = laHoSoPhongBan(deNghiCuaPO) && duocDinhKemPhieuGiao;

  const tienDo = useMemo(() => tinhTienDoPO(po, phieuCuaPO), [po, phieuCuaPO]);

  /** Các lần giao ĐÃ NHẬP KHO — thành cột động trong bảng. */
  const lanGiaoDaTinh = phieuCuaPO.filter((p) => p.trangThai === "da_nhap_kho");
  const phieuChoKiemTra = phieuCuaPO.filter((p) => p.trangThai === "cho_kiem_tra");

  return (
    <Card>
      <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
        <h2 className="text-h3 text-text-primary">Tiến độ nhận hàng</h2>

        {/* Bảng tiến độ — Desktop/Tablet */}
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-right">Dòng</TableHead>
                {/**
                  * ★★ "Tên hàng" + "Thông số kỹ thuật" — Sếp 16/09/2026, vẽ mũi tên từ hai cột đó
                  * ở bảng *Giá trị đơn hàng* lên đây: ***"Thêm 2 trường này lên đây"***.
                  *
                  * 📌 Cột đầu ĐÃ LÀ tên hàng, chỉ mang nhãn "Vật liệu" — nay đổi nhãn cho khớp
                  * bảng dưới, KHÔNG thêm cột thứ hai cùng nội dung. Thứ thật sự thiếu chỉ là
                  * **Thông số kỹ thuật**.
                  *
                  * 📌 Dữ liệu có sẵn, KHÔNG phải đụng tầng tính toán: `TienDoDongPO extends DongPO`
                  * nên `thongSoKyThuat` đi theo mỗi dòng.
                  */}
                {/**
                  * ★★ PHẦN DƯ DỒN VÀO CỘT "Tiến độ" — Sếp 17/09/2026, **lần sửa thứ hai trong
                  * cùng ngày**, cùng một câu: ***"bố cục lại giao diện này cho cân đối"***.
                  *
                  * 🔴 NGUYÊN NHÂN KHOẢNG TRỐNG: `TableCell` có sẵn `whitespace-nowrap` nên mọi cột
                  * co về đúng nội dung; bảng lại là `w-full`, nên phần dư giữa bề rộng bảng và tổng
                  * nội dung bị **chia đều cho mọi cột** — các cột số dãn cách nhau cả trăm pixel.
                  *
                  * ❌ LẦN ĐẦU TÔI ĐẶT `w-full` VÀO "Thông số kỹ thuật" VÀ SAI. Nội dung cột đó rất
                  * ngắn ("A4", "Xanh", "Laptop") nên nó phình thành **một mảng trắng khổng lồ giữa
                  * bảng** — Sếp chụp lại đúng mảng trắng đó. Đổi một lỗi lấy một lỗi khó coi hơn.
                  *
                  * ✅ CHỖ ĐÚNG LÀ CỘT CUỐI "Tiến độ", vì `ThanhTienDo` bên trong là `w-full`: ô
                  * rộng thêm bao nhiêu thì **thanh dài ra bấy nhiêu**, không để lại khoảng trắng
                  * nào. Đây là cột duy nhất của bảng có phần tử tự co giãn — mọi cột khác đều là
                  * chữ hoặc số, phình ra là thành chỗ trống.
                  *
                  * 📌 BÀI HỌC ĐỂ ĐỪNG LẶP: chọn chỗ nhận phần dư thì tìm cột có **phần tử co giãn**
                  * (thanh, biểu đồ), không phải cột có **chữ dài nhất**.
                  */}
                <TableHead>Tên hàng</TableHead>
                <TableHead>Thông số kỹ thuật</TableHead>
                <TableHead>ĐVT</TableHead>
                <TableHead className="text-right">Đặt</TableHead>
                {lanGiaoDaTinh.map((p) => (
                  <TableHead key={p.id} className="text-right whitespace-nowrap">
                    {new Date(p.ngayNhanThucTe).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                  </TableHead>
                ))}
                <TableHead className="text-right">Đã nhận</TableHead>
                <TableHead className="text-right">Còn lại</TableHead>
                {/* `w-full` = "cột này xin 100%" → hút toàn bộ phần dư của bảng, các cột còn lại co
                    sát nội dung. Xem lý do đầy đủ ở khối chú thích đầu hàng tiêu đề này. */}
                <TableHead className="w-full">Tiến độ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tienDo.map((d) => (
                <TableRow key={d.sttDong}>
                  <TableCell className="text-right text-text-desc">{d.sttDong}</TableCell>
                  <TableCell className="font-medium">
                    {d.tenVatLieu}
                    <NhanThemNgoaiDeNghi hien={d.themNgoaiDeNghi === true} />
                  </TableCell>
                  <TableCell className="text-text-secondary">{d.thongSoKyThuat ?? "—"}</TableCell>
                  <TableCell>{d.donViTinh}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {d.khoiLuongDat.toLocaleString("vi-VN")}
                  </TableCell>
                  {lanGiaoDaTinh.map((p) => {
                    const line = p.lines.find((l) => l.sttDongPO === d.sttDong);
                    return (
                      <TableCell key={p.id} className="text-right">
                        {line ? line.khoiLuongThucNhan.toLocaleString("vi-VN") : "—"}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right font-semibold">
                    {d.khoiLuongDaNhan.toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${d.khoiLuongConLai > 0 ? "text-warning-soft" : "text-success-soft"}`}
                  >
                    {d.khoiLuongConLai.toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <ThanhTienDo
                      phanTram={d.phanTram}
                      tong={d.khoiLuongConLai === 0 ? "success" : "primary"}
                      nhan={
                        d.khoiLuongConLai === 0 ? "Đã nhận đủ" : `${Math.round(d.phanTram)}% — còn thiếu`
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Card List — Mobile */}
        <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
          {tienDo.map((d) => (
            <div key={d.sttDong} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
              <span className="text-sm font-semibold text-text-primary">
                {d.sttDong}. {d.tenVatLieu}
                <NhanThemNgoaiDeNghi hien={d.themNgoaiDeNghi === true} />
              </span>
              {/* 🔴 PHẢI CÓ CẢ Ở ĐÂY, không chỉ ở bảng desktop — Design System V1.1 §3.2 quy định
                  bảng nhiều cột đổi thành Card List trên điện thoại, nên bỏ qua khối này là hai
                  thiết bị đọc ra hai thông tin khác nhau về cùng một đơn.
                  📌 Chỉ hiện khi có: dòng "Thông số kỹ thuật —" trống trơn chỉ làm thẻ dài thêm. */}
              {d.thongSoKyThuat && (
                <span className="-mt-1 text-xs text-text-secondary">{d.thongSoKyThuat}</span>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-desc">Đặt</span>
                <span className="font-semibold">
                  {d.khoiLuongDat.toLocaleString("vi-VN")} {d.donViTinh}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-desc">Đã nhận</span>
                <span className="font-semibold">{d.khoiLuongDaNhan.toLocaleString("vi-VN")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-desc">Còn lại</span>
                <span className={d.khoiLuongConLai > 0 ? "font-semibold text-warning-soft" : "font-semibold text-success-soft"}>
                  {d.khoiLuongConLai.toLocaleString("vi-VN")}
                </span>
              </div>
              <ThanhTienDo
                phanTram={d.phanTram}
                tong={d.khoiLuongConLai === 0 ? "success" : "primary"}
                nhan={d.khoiLuongConLai === 0 ? "Đã nhận đủ" : `${Math.round(d.phanTram)}%`}
              />
              {d.theoLanGiao.length > 0 && (
                <ul className="flex flex-col gap-0.5 border-t border-divider pt-2 text-xs text-text-desc">
                  {d.theoLanGiao.map((l) => (
                    <li key={l.lanGiaoThu}>
                      Lần {l.lanGiaoThu} · {new Date(l.ngayNhan).toLocaleDateString("vi-VN")} ·{" "}
                      {l.khoiLuong.toLocaleString("vi-VN")} {d.donViTinh}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Lịch sử phiếu nhận hàng */}
        <div className="flex flex-col gap-2 border-t border-divider pt-4">
          {/* Tiêu đề và nút ghi nhận trên CÙNG MỘT HÀNG, nút neo phải. `flex-wrap` để màn hẹp
              thì nút xuống dòng chứ không ép tiêu đề vỡ chữ. */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-text-primary">
              Phiếu nhận hàng ({phieuCuaPO.length} lần giao)
            </h3>
            {/**
              * 🔴 DỰNG VÔ ĐIỀU KIỆN, KHÔNG BỌC `{duocGhiNhanGiaoHangTay && <Hop… />}`.
              *
              * Quyền truyền vào trong `duocGhiNhan` để component tự ẩn **cái nút**, còn
              * `<Dialog>` thì luôn nằm trong cây. Bọc ngoài là có ngày hộp thoại bị THÁO giữa lúc
              * đang mở (dữ liệu kho chung đổi, hồ sơ đổi) — base-ui không kịp chạy hàm dọn, khoá
              * cuộn và `data-base-ui-inert` kẹt lại trên DOM: cả app bấm không ăn, phải F5. Đúng
              * sự cố Sếp báo 13–14/09/2026, mất 6 lượt sửa mới truy ra nguyên nhân.
              */}
            <HopGhiNhanGiaoHang
              po={po}
              tienDo={tienDo}
              phieuCuaPO={phieuCuaPO}
              duocGhiNhan={duocGhiNhanGiaoHangTay}
              moNhoNhanhPhongBan={moNhoNhanhPhongBan}
            />
          </div>
          {phieuCuaPO.length === 0 ? (
            /* ⚠️ Câu trống phải NÓI ĐƯỜNG ĐI, không chỉ báo "chưa có". Chính màn hình này (phiếu
               `000000089`, 15/09/2026) in mỗi chữ *"Chưa có lần giao nào."* trong khi người dùng
               không hề có nút nào để tạo — họ chỉ còn cách ngồi chờ một thứ không bao giờ tới. */
            <p className="text-sm text-text-desc">
              {duocGhiNhanGiaoHangTay
                ? "Chưa có lần giao nào. Hàng về tới đâu thì bấm “Ghi nhận giao hàng” ghi lại tới đó, kèm phiếu giao hàng của nhà cung cấp."
                : "Chưa có lần giao nào."}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {phieuCuaPO.map((p) => {
                /* ★ Hồ sơ PHÒNG BAN không có kho nào cả — hàng do nhân viên thu mua nhận thẳng
                   rồi tự ghi nhận. In "Đã nhập kho" ở đó là nói một việc không hề xảy ra
                   (Sếp khoanh đỏ 15/09/2026, ghi *"đã nhận hàng"*). Chỉ đổi CHỮ, mã trạng thái
                   `da_nhap_kho` giữ nguyên vì mọi phép tính khối lượng đang dựa vào nó. */
                const tt = nhanAnToan(
                  laHoSoPhongBan(deNghiCuaPO) ? NHAN_TRANG_THAI_PHIEU_PHONG_BAN : NHAN_TRANG_THAI_PHIEU,
                  p.trangThai,
                );
                /* Còn thay được tệp phiếu giao nhận của lần giao này không — MỘT LUẬT DUY NHẤT ở
                   `2-quy-trinh/tinh-toan.ts`, tầng ghi `dinhKemPhieuGiao` gọi đúng hàm này. Đừng
                   so `po.trangThai` hay tên bước tại chỗ: lệch một điều kiện là nút mở mà tầng ghi
                   từ chối (hoặc ngược lại), không một dòng nào báo. */
                const khoaThayTep = vuongMacThayTepPhieuGiao(p, po, giaiDoanDeNghi);
                return (
                  /* Bố cục HAI TẦNG: tầng trên là thông tin lần giao, tầng dưới là phiếu
                     đính kèm. Bản cũ nhét tất cả vào một hàng `flex-wrap` nên trạng thái,
                     mã phiếu và ô đính kèm quấn vào nhau mỗi màn một kiểu. */
                  <li
                    key={p.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-(--hp-md-row-pad)"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-semibold text-text-primary">
                        Lần {p.lanGiaoThu}
                      </span>
                      <span className="text-sm text-text-secondary">
                        {new Date(p.ngayNhanThucTe).toLocaleDateString("vi-VN")}
                      </span>
                      <span className="text-xs text-text-desc">{p.code}</span>
                      {p.soPhieuGiaoNCC && (
                        <span className="text-xs text-text-desc">Phiếu NCC: {p.soPhieuGiaoNCC}</span>
                      )}
                      {/**
                       * ★★ HAI MỐC ĐỂ ĐỐI CHIẾU VỚI APP KHO — Sếp 17/09/2026: *"bước tiến hành nhận
                       * hàng… là bước **check song song** với dữ liệu từ app kho đưa về"*.
                       *
                       * 🔴 HAI TRƯỜNG NÀY CÓ TRONG DỮ LIỆU TỪ 23/08/2026 MÀ CHƯA MÀN NÀO HIỆN RA.
                       * Đo được 17/09: `grep maPhieuNhanQlkCtr` trong toàn bộ tệp `.tsx` trả **0 kết
                       * quả** — app nhận số phiếu nhập kho bên QLK CTR rồi cất đi, không ai đọc được.
                       * Người thu mua muốn đối chiếu một lô hàng phải gọi điện hỏi thủ kho mà **không
                       * có mã nào để nói**. Đó mới là thứ "check song song" đang thiếu, chứ không phải
                       * thiếu quyền ghi phiếu.
                       *
                       * 📌 CHỈ BÀY, KHÔNG ĐỤNG QUYỀN. Đây là đường rẻ nhất và không phá chốt nào:
                       * "người xác nhận hàng về phải là người nhận hàng" giữ nguyên, hai bài kiểm mang
                       * tên Sếp ngày 15/09 vẫn xanh.
                       *
                       * ⚠️ `maPhieuNhanQlkCtr` là trường của **phiên tích hợp** (`CLAUDE.md` §6.6) —
                       * chỉ ĐỌC để hiện, tuyệt đối không sửa cửa API sinh ra nó.
                       */}
                      {p.maPhieuNhanQlkCtr && (
                        <span className="text-xs text-text-desc">
                          Phiếu kho: {p.maPhieuNhanQlkCtr}
                        </span>
                      )}
                      {p.nguoiNhanTen && (
                        <span className="text-xs text-text-desc">Người nhận: {p.nguoiNhanTen}</span>
                      )}
                      <StatusBadge label={tt.nhan} tone={tt.tong} className="ml-auto shrink-0" />
                    </div>

                    {/* ---- Phiếu giao nhận của lần giao này ----
                        🔴 PHẢI CHO BỔ SUNG, không chỉ bắt buộc lúc ghi phiếu mới. Phiếu ghi
                        trước 11/08/2026 không có tệp; chặn mà không cho bổ sung thì các đơn
                        đó KẸT VĨNH VIỄN, không bao giờ bấm hoàn thành được.
                        Phiếu bị từ chối nhận thì không đòi — hàng trả về thì lấy đâu ra
                        phiếu giao nhận đã ký. */}
                    {/**
                      * ★★ CHỨNG TỪ ĐÃ CHỐT THÌ KHÔNG ĐỔI TỆP PHIẾU GIAO NHẬN NỮA
                      * (23/08/2026: đơn đã hoàn thành · **15/09/2026: hồ sơ đã sang bước "Hồ sơ
                      * thanh toán"**, tức đã nghiệm thu).
                      *
                      * 🔴 VÌ SAO PHẢI KHÓA: luật "mỗi lần giao phải có phiếu giao nhận đính kèm mới
                      * được xác nhận hoàn thành" (Ban lãnh đạo 11/08/2026) kiểm TỪNG phiếu qua
                      * `tepPhieuGiao`. Chứng từ đã dùng làm căn cứ nghiệm thu mà vẫn thay được thì
                      * **căn cứ bị đổi sau khi đã ký** — các xác nhận kia thành xác nhận cho một nội
                      * dung khác nội dung hiện tại. Đây là lỗ hổng chứng từ, không phải chuyện tiện
                      * dụng.
                      *
                      * 🔴 ĐIỀU KIỆN KHÓA KHÔNG VIẾT Ở ĐÂY — gọi `vuongMacThayTepPhieuGiao`. Trước
                      * 15/09/2026 chỗ này so thẳng `po.trangThai !== "hoan_thanh"` còn tầng ghi so
                      * một bản chép riêng; thêm mốc khóa thứ hai vào hai bản chép là cách chắc chắn
                      * để chúng lệch nhau.
                      *
                      * 🔴 KHÓA THÌ PHẢI NÓI RA LÝ DO, KHÔNG ẨN IM LẶNG. Bản trước ẩn thẳng ô đính
                      * kèm khi đơn hoàn thành: người dùng chỉ thấy nút biến mất, không biết vì hết
                      * quyền, vì app lỗi, hay vì hồ sơ đã chốt. Nay luôn in câu lý do bên dưới.
                      *
                      * 📌 VẪN XEM VÀ TẢI VỀ ĐƯỢC — nhánh dưới lo việc đó. Khóa nghĩa là không THAY;
                      * chứ giấu tệp đi thì hồ sơ mất bằng chứng.
                      *
                      * ⚠️ KHÔNG BAO GIỜ KHÓA ĐƯỜNG BỔ SUNG TỆP CÒN THIẾU: phiếu ghi trước
                      * 11/08/2026 không có tệp, chặn mà không cho bổ sung thì các đơn đó KẸT VĨNH
                      * VIỄN, không bao giờ bấm hoàn thành được. Luật đã lo phần này (phiếu chưa có
                      * tệp thì luôn trả `null`) — đừng thêm điều kiện chặn ở đây.
                      */}
                    {p.trangThai !== "tu_choi_nhan" &&
                      (p.anhQlkCtr ? (
                        // Phiếu do QLK CTR tự tạo — thủ kho đã đính kèm ảnh bên đó rồi, không
                        // cần đính kèm lại ở đây (vuongMacXacNhanKho đã coi ảnh này là đủ
                        // bằng chứng giao nhận, xem 2-quy-trinh/tinh-toan.ts).
                        <span className="flex min-w-0 items-center gap-1.5 text-xs text-success-soft">
                          <span className="shrink-0">Ảnh phiếu giao (từ QLK CTR):</span>
                          <LienKetAnhQlkCtr anh={p.anhQlkCtr} />
                        </span>
                      ) : duocDinhKemPhieuGiao && !khoaThayTep ? (
                        /**
                         * ★★ NHÁNH ĐÍNH KÈM — nay mở theo HỒ SƠ, không theo cờ toàn cục.
                         *
                         * 🔴 SẾP 14/09 + 15/09/2026: hồ sơ phòng ban đi nhánh riêng, *"nhân viên
                         * thu mua tự hoàn thành, **nhưng phải đính kèm phiếu giao hàng**"*. Nới
                         * quyền ở đây là để họ ĐÍNH ĐƯỢC phiếu, KHÔNG PHẢI để bỏ qua chứng từ:
                         * `batBuoc` và chữ "(bắt buộc)" giữ nguyên cho cả hai loại hồ sơ, và luật
                         * `vuongMacXacNhanKho` vẫn chặn bấm hoàn thành khi còn lần giao thiếu tệp.
                         */
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <ODinhKemTep
                            tep={p.tepPhieuGiao}
                            nhanThem="Đính kèm phiếu giao nhận (bắt buộc)"
                            batBuoc={!p.tepPhieuGiao}
                            nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
                            onXong={(tep) => dinhKemPhieuGiao(p.id, tep, nguoiDung.tenHienThi)}
                          />
                          {/* 🔴 NỚI QUYỀN THÌ PHẢI NÓI RA NGAY TẠI CHỖ. Nhân viên thu mua bình
                              thường không được đính kèm phiếu nhận hàng; thấy mình đính được mà
                              không hiểu vì sao thì sẽ tưởng luật đã đổi cho MỌI hồ sơ, rồi đi đòi
                              làm y vậy trên hồ sơ công trình — nơi chốt "chỉ thủ kho xác nhận" là
                              chốt kiểm soát nặng nhất của app.
                              📌 Câu chữ lấy từ `LY_DO_NHANH_PHONG_BAN` (một chỗ duy nhất), và nó
                              nói đúng tinh thần chỉ đạo: ĐỔI NGƯỜI GHI NHẬN, KHÔNG BỎ yêu cầu có
                              phiếu giao hàng. Câu nhấn phía sau viết thêm ở đây cho hết ý.
                              ⚠️ Có CẢ MÀU LẪN CHỮ + icon (Design System V1.1) — không báo bằng
                              riêng màu. Token `border-warning` / `bg-warning-bg` / `text-warning-soft`
                              đều có thật trong `app/globals.css`. */}
                          {moNhoNhanhPhongBan && (
                            <p className="flex items-start gap-1.5 rounded-md border border-warning bg-warning-bg px-2 py-1.5 text-xs text-warning-soft">
                              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                              <span>
                                {LY_DO_NHANH_PHONG_BAN} Phiếu giao hàng vẫn là bắt buộc — thiếu
                                tệp của bất kỳ lần giao nào thì đơn không bấm hoàn thành được.
                              </span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex min-w-0 flex-col gap-1">
                          {p.tepPhieuGiao ? (
                            // 🔴 13/08/2026: bấm được để XEM và TẢI VỀ (Ban lãnh đạo yêu cầu).
                            // Trước đó chỉ in ra chữ — người dùng thấy tên tệp mà không mở được,
                            // tưởng app chưa lưu nội dung. Luật ở `LienKetTep`, một chỗ duy nhất.
                            // `min-w-0` + `truncate`: tên tệp ảnh chụp điện thoại dài cả trăm ký
                            // tự, để nguyên là kéo giãn cả thẻ.
                            <span className="flex min-w-0 items-center gap-1.5 text-xs text-success-soft">
                              <span className="shrink-0">Có phiếu giao nhận:</span>
                              <LienKetTep tep={p.tepPhieuGiao} rutGon={rutGonTenTep} />
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs text-warning-soft">
                              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                              Chưa có phiếu giao nhận đính kèm
                            </span>
                          )}
                          {/* 🔴 CÂU LÝ DO — chỉ hiện khi THẬT SỰ bị khóa, không hiện khi chỉ là
                              thiếu quyền (`duocDinhKemPhieuGiao` sai). Người xem không có quyền ghi thì
                              chưa bao giờ thấy nút này, in thêm câu "hồ sơ đã chốt" cho họ là nói
                              về một việc họ không định làm.
                              ⚠️ Trạng thái phải có CẢ MÀU LẪN CHỮ (Design System V1.1) — icon ổ
                              khóa đi kèm chữ, không dùng riêng màu để báo. */}
                          {khoaThayTep && (
                            <span className="flex items-start gap-1.5 text-xs text-text-desc">
                              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                              <span>{khoaThayTep}</span>
                            </span>
                          )}
                        </div>
                      ))}

                    {/**
                      * ★★ DẤU ĐỐI CHIẾU CỦA PHÒNG THU MUA — Sếp 17/09/2026: *"bước tiến hành nhận
                      * hàng… là bước **check song song** với dữ liệu từ app kho đưa về"*.
                      *
                      * 🔴 ĐỨNG CẠNH DẤU CỦA KHO, KHÔNG THAY NÓ. Không đụng một con số khối lượng
                      * nào — kho vẫn là nguồn duy nhất của số lượng thực nhận. Sếp được trình hai
                      * cách và **bác** cách cho thu mua tự ghi nhận hàng thay kho, vì hai đường ghi
                      * phiếu dùng chung công thức sinh mã nên sẽ đếm trùng khối lượng (lỗi tiền).
                      *
                      * 🔴 MỘT NÚT DUY NHẤT, VẼ Ở ĐÚNG ĐÂY. `BangTienDoPO` dùng chung cho cả trang
                      * chi tiết đề nghị lẫn trang chi tiết đơn hàng, nên vẽ ở đây là cả hai màn đều
                      * có mà không nhân bản. Dự án đã bác một lần việc dựng ô tích thứ hai cho cùng
                      * một việc — đừng thêm nút này ở màn khác.
                      *
                      * 📌 Phiếu `tu_choi_nhan` không hiện: không nhận thì không có gì để đối chiếu.
                      */}
                    {p.trangThai !== "tu_choi_nhan" && (p.thuMuaDoiChieu || duocDoiChieu) && (
                      <div className="flex flex-col gap-1.5 border-t border-border pt-2">
                        {p.thuMuaDoiChieu ? (
                          /* Trạng thái LUÔN có cả màu lẫn chữ lẫn icon (Design System V1.1). */
                          <span
                            className={`flex items-start gap-1.5 text-xs ${
                              p.thuMuaDoiChieu.khop ? "text-success-soft" : "text-danger"
                            }`}
                          >
                            {p.thuMuaDoiChieu.khop ? (
                              <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                            ) : (
                              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                            )}
                            <span>
                              {p.thuMuaDoiChieu.khop
                                ? "Thu mua đã đối chiếu: khớp số liệu app kho"
                                : `Thu mua đối chiếu: LỆCH — ${p.thuMuaDoiChieu.ghiChu ?? ""}`}
                              <span className="text-text-desc">
                                {" "}
                                · {p.thuMuaDoiChieu.nguoiTen},{" "}
                                {new Date(p.thuMuaDoiChieu.thoiDiem).toLocaleDateString("vi-VN")}
                              </span>
                            </span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-text-desc">
                            <ScanSearch className="size-3.5 shrink-0" aria-hidden />
                            Phòng Thu mua chưa đối chiếu lần giao này
                          </span>
                        )}

                        {/* Ghi rồi vẫn sửa được: soi lại thấy khác thì phải nói lại được. Bấm lại
                            là GHI ĐÈ dấu cũ, dấu vết ai sửa lúc nào nằm ở nhật ký đơn hàng. */}
                        {duocDoiChieu && dangGhiLech !== p.id && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                ghiDoiChieuThuMua(p.id, true, undefined, {
                                  uid: nguoiDung.uid,
                                  ten: nguoiDung.tenHienThi,
                                })
                              }
                              className="min-h-9 rounded-lg border border-border px-3 text-xs font-medium text-text-secondary transition-colors hover:border-success hover:text-success"
                            >
                              Khớp số liệu
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDangGhiLech(p.id);
                                setLyDoLech(p.thuMuaDoiChieu?.ghiChu ?? "");
                              }}
                              className="min-h-9 rounded-lg border border-border px-3 text-xs font-medium text-text-secondary transition-colors hover:border-danger hover:text-danger"
                            >
                              Ghi nhận lệch
                            </button>
                          </div>
                        )}

                        {dangGhiLech === p.id && (
                          <div className="flex flex-col gap-2">
                            <label
                              htmlFor={`lech-${p.id}`}
                              className="text-xs font-medium text-text-secondary"
                            >
                              Lệch ở đâu? (bắt buộc — không nói rõ thì người đọc không xử được)
                            </label>
                            <textarea
                              id={`lech-${p.id}`}
                              value={lyDoLech}
                              onChange={(e) => setLyDoLech(e.target.value)}
                              rows={2}
                              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
                              placeholder="VD: app kho ghi 150 tấn, phiếu giao NCC ghi 120 tấn"
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={lyDoLech.trim() === ""}
                                onClick={() => {
                                  const loi = ghiDoiChieuThuMua(p.id, false, lyDoLech, {
                                    uid: nguoiDung.uid,
                                    ten: nguoiDung.tenHienThi,
                                  });
                                  if (loi === null) {
                                    setDangGhiLech(null);
                                    setLyDoLech("");
                                  }
                                }}
                                className="min-h-9 rounded-lg bg-danger px-3 text-xs font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Lưu ghi nhận lệch
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDangGhiLech(null);
                                  setLyDoLech("");
                                }}
                                className="min-h-9 rounded-lg border border-border px-3 text-xs font-medium text-text-secondary"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {p.ghiChuTinhTrangHang && (
                      <p className="text-xs text-warning-soft">{p.ghiChuTinhTrangHang}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {phieuChoKiemTra.length > 0 && (
            <p className="rounded-lg bg-warning-bg px-3 py-2 text-xs text-warning-soft">
              Có {phieuChoKiemTra.length} phiếu đang chờ kiểm tra — khối lượng CHƯA được tính vào &quot;đã
              nhận&quot; để tránh báo tiến độ ảo.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
