"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
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
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { tinhTienDoPO } from "@/2-quy-trinh/tinh-toan";
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
 */
export function BangTienDoPO({ po }: { po: DonDatHang }) {
  const { phieuNhan, dinhKemPhieuGiao } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  const phieuCuaPO = useMemo(
    () => phieuNhan.filter((p) => p.poId === po.id).sort((a, b) => a.lanGiaoThu - b.lanGiaoThu),
    [phieuNhan, po.id],
  );
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
          <h3 className="text-sm font-semibold text-text-primary">
            Phiếu nhận hàng ({phieuCuaPO.length} lần giao)
          </h3>
          {phieuCuaPO.length === 0 ? (
            <p className="text-sm text-text-desc">Chưa có lần giao nào.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {phieuCuaPO.map((p) => {
                const tt = nhanAnToan(NHAN_TRANG_THAI_PHIEU, p.trangThai);
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
                      * ★★ ĐƠN ĐÃ HOÀN THÀNH THÌ KHÔNG ĐỔI TỆP PHIẾU GIAO NHẬN NỮA (23/08/2026).
                      *
                      * 🔴 VÌ SAO PHẢI KHÓA: luật "mỗi lần giao phải có phiếu giao nhận đính kèm mới
                      * được xác nhận hoàn thành" (Ban lãnh đạo 11/08/2026) kiểm TỪNG phiếu qua
                      * `tepPhieuGiao`. Đơn đã qua đủ hai lớp xác nhận (thủ kho + trưởng bộ phận) mà
                      * tệp vẫn thay được thì **chứng từ làm căn cứ xác nhận bị đổi sau khi đã ký** —
                      * hai lớp xác nhận kia thành xác nhận cho một nội dung khác nội dung hiện tại.
                      * Đây là lỗ hổng chứng từ, không phải chuyện tiện dụng.
                      *
                      * 📌 VẪN XEM VÀ TẢI VỀ ĐƯỢC — nhánh dưới lo việc đó. Khóa nghĩa là không THAY,
                      * không GỠ; chứ giấu tệp đi thì hồ sơ mất bằng chứng.
                      *
                      * ⚠️ CHỈ KHÓA KHI `hoan_thanh`. Đơn đang giao vẫn phải cho bổ sung: phiếu ghi
                      * trước 11/08/2026 không có tệp, chặn mà không cho bổ sung thì các đơn đó KẸT
                      * VĨNH VIỄN, không bao giờ bấm hoàn thành được (chú thích cũ ngay dưới).
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
                      ) : quyen.ghiPhieuNhanHang && po.trangThai !== "hoan_thanh" ? (
                        <ODinhKemTep
                          tep={p.tepPhieuGiao}
                          nhanThem="Đính kèm phiếu giao nhận (bắt buộc)"
                          batBuoc={!p.tepPhieuGiao}
                          nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
                          onXong={(tep) => dinhKemPhieuGiao(p.id, tep, nguoiDung.tenHienThi)}
                        />
                      ) : p.tepPhieuGiao ? (
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
