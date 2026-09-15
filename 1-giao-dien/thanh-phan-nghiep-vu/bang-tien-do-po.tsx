"use client";

import { useMemo } from "react";
import { AlertTriangle, Info, Lock } from "lucide-react";
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
  duocGhiNhanGiaoHangCuaHoSo,
  ghiNhanGiaoHangNhoNhanhPhongBan,
} from "@/4-phan-quyen/quyen-theo-ho-so";
import { nhanAnToan, NHAN_TRANG_THAI_PHIEU } from "@/2-quy-trinh/trang-thai";
import type { DonDatHang } from "@/3-du-lieu/kieu-du-lieu";

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
  const { deNghi, donHang, baoGia, phieuNhan, dinhKemPhieuGiao } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

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
    () => (deNghiCuaPO ? xacDinhGiaiDoan(deNghiCuaPO, donHang, baoGia, phieuNhan) : null),
    [deNghiCuaPO, donHang, baoGia, phieuNhan],
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
                <TableHead>Vật liệu</TableHead>
                <TableHead>ĐVT</TableHead>
                <TableHead className="text-right">Đặt</TableHead>
                {lanGiaoDaTinh.map((p) => (
                  <TableHead key={p.id} className="text-right whitespace-nowrap">
                    {new Date(p.ngayNhanThucTe).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                  </TableHead>
                ))}
                <TableHead className="text-right">Đã nhận</TableHead>
                <TableHead className="text-right">Còn lại</TableHead>
                <TableHead>Tiến độ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tienDo.map((d) => (
                <TableRow key={d.sttDong}>
                  <TableCell className="text-right text-text-desc">{d.sttDong}</TableCell>
                  <TableCell className="font-medium">{d.tenVatLieu}</TableCell>
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
              </span>
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
                const tt = nhanAnToan(NHAN_TRANG_THAI_PHIEU, p.trangThai);
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
