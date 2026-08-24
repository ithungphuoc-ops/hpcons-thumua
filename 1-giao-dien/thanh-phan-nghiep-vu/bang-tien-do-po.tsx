"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, PackageCheck, Plus } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
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
import {
  tinhTienDoPO,
  vuongMacGhiThemPhieuNhan,
  vuongMacKhoiLuongNhan,
  vuongMacSoPhieuNCC,
} from "@/2-quy-trinh/tinh-toan";
import { nhanAnToan, NHAN_TRANG_THAI_PHIEU } from "@/2-quy-trinh/trang-thai";
import type { DonDatHang } from "@/3-du-lieu/kieu-du-lieu";
import type { MoTaTep } from "@/3-du-lieu/kho-tep";

/**
 * M5 — Bảng tiến độ nhận hàng của một PO, có CỘT ĐỘNG theo từng lần giao.
 *
 * Đây là thứ bản thumua-next cũ KHÔNG có: bản cũ chỉ cộng dồn `receivedQuantity`
 * trên dòng PO nên mất ngày nhận từng lần. Yêu cầu số 1 của Ban lãnh đạo:
 * "ngày 06/08 nhận 10/20 bao xi măng".
 *
 * Quy tắc: CHỈ phiếu ở trạng thái "đã nhập kho" được tính vào khối lượng đã nhận.
 */
export function BangTienDoPO({ po }: { po: DonDatHang }) {
  const { phieuNhan, themPhieuNhan, dinhKemPhieuGiao } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  const [moForm, setMoForm] = useState(false);
  const [ngayNhan, setNgayNhan] = useState(new Date().toISOString().slice(0, 10));
  const [soPhieuNCC, setSoPhieuNCC] = useState("");
  const [khoiLuong, setKhoiLuong] = useState<Record<number, string>>({});
  /**
   * Tệp phiếu giao nhận của lần ghi này — BẮT BUỘC mới lưu được phiếu.
   * 🔴 Chỉ đạo Ban lãnh đạo 11/08/2026: *"thủ kho khi nhận hàng phải đính kèm file phiếu
   * giao nhận thì mới được bấm hoàn thành"*. Bắt ngay lúc ghi phiếu là chỗ tự nhiên nhất —
   * lúc đó tờ phiếu đang cầm trên tay.
   */
  const [tepPhieuGiao, setTepPhieuGiao] = useState<MoTaTep | undefined>();

  const phieuCuaPO = useMemo(
    () => phieuNhan.filter((p) => p.poId === po.id).sort((a, b) => a.lanGiaoThu - b.lanGiaoThu),
    [phieuNhan, po.id],
  );
  const tienDo = useMemo(() => tinhTienDoPO(po, phieuCuaPO), [po, phieuCuaPO]);
  /** Lý do không được ghi thêm phiếu — `null` là còn ghi được. Luật ở `2-quy-trinh`. */
  const chanGhiThemPhieu = vuongMacGhiThemPhieuNhan(tienDo);

  /** Các lần giao ĐÃ NHẬP KHO — thành cột động trong bảng. */
  const lanGiaoDaTinh = phieuCuaPO.filter((p) => p.trangThai === "da_nhap_kho");
  const phieuChoKiemTra = phieuCuaPO.filter((p) => p.trangThai === "cho_kiem_tra");

  const dongCoKhoiLuong = po.items
    .map((d) => ({ sttDongPO: d.sttDong, khoiLuongThucNhan: Number(khoiLuong[d.sttDong] ?? 0) }))
    .filter((l) => l.khoiLuongThucNhan > 0);

  /**
   * Vì sao chưa lưu được phiếu. Trả chuỗi để hiện thẳng cho người dùng thay vì chỉ làm mờ
   * cái nút — nút mờ không lý do là kiểu bí việc khó chịu nhất.
   */
  const vuongMacLuuPhieu: string | null =
    dongCoKhoiLuong.length === 0
      ? "Chưa nhập khối lượng nhận cho công việc nào."
      : /**
         * 🔴 PHẢI CHẶN NGÀY RỖNG. Ô ngày xóa trống được, và trước 14/08/2026 chỗ này không
         * kiểm — phiếu lưu với `ngayNhanThucTe: ""` thì mọi chỗ hiển thị ra **"Invalid Date"**
         * vĩnh viễn, mà phiếu nhận hàng nằm trên kho chung nên cả phòng cùng thấy. Không có
         * đường sửa ngày sau khi lưu, nên hỏng là hỏng luôn.
         */
        !ngayNhan.trim() || Number.isNaN(new Date(ngayNhan).getTime())
        ? "Chưa chọn ngày nhận hàng thực tế."
        : !tepPhieuGiao
          ? "Chưa đính kèm phiếu giao nhận của nhà cung cấp."
          : /**
             * ★ HAI LUẬT MỚI 15/08/2026 — Ban lãnh đạo: *"khi đã nhận đủ hàng thì không được
             * thêm phiếu ghi nhận nữa, và tên phiếu giao nhận phải khác nhau, không được trùng
             * tên để sau này có thể tổng hợp"*.
             *
             * 🔴 Kiểm ở đây, chỗ ĐANG NHẬP, chứ không đợi lúc lưu xong mới báo: phiếu nhận là
             * chứng từ của Kho, lưu rồi thì Thu mua không sửa được (nguyên tắc dữ liệu số 2).
             * Luật ở `2-quy-trinh/tinh-toan.ts`, dùng chung với chỗ khóa nút bên trên.
             */
            (vuongMacKhoiLuongNhan(tienDo, dongCoKhoiLuong) ??
            vuongMacSoPhieuNCC(soPhieuNCC, phieuCuaPO));

  function luuPhieu() {
    if (vuongMacLuuPhieu) return;

    /**
     * 🔴 ĐỌC KẾT QUẢ RỒI MỚI XOÁ FORM — sửa 24/08/2026.
     *
     * Bản trước gọi `themPhieuNhan` rồi **xoá sạch form và đóng khối** vô điều kiện. Khi tầng ghi
     * chặn (bước trước còn treo việc bắt buộc, hoặc có người vừa ghi nốt phiếu cuối trên kho
     * chung) thì nó không ghi gì, mà thủ kho thấy form đóng lại nên tưởng đã lưu — số liệu vừa gõ
     * mất luôn, và không có phiếu nào trong hồ sơ. Đúng điều `CLAUDE.md` §3.5 cấm.
     *
     * 📌 Vướng thì GIỮ NGUYÊN form: người ghi phiếu không phải gõ lại từ đầu sau khi đọc lý do.
     */
    const loi = themPhieuNhan({
      poId: po.id,
      poCode: po.code,
      ngayNhanThucTe: ngayNhan,
      nguoiNhanUid: nguoiDung.uid,
      nguoiNhanTen: nguoiDung.tenHienThi,
      soPhieuGiaoNCC: soPhieuNCC || undefined,
      tepPhieuGiao,
      trangThai: "da_nhap_kho",
      lines: dongCoKhoiLuong,
    });
    if (loi) {
      toast.error("Chưa ghi được phiếu nhận", { description: loi });
      return;
    }
    setKhoiLuong({});
    setSoPhieuNCC("");
    setTepPhieuGiao(undefined);
    setMoForm(false);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-h3 text-text-primary">Tiến độ nhận hàng</h2>
          {/* ★ ĐÃ NHẬN ĐỦ THÌ KHÓA NÚT, kèm lý do (Ban lãnh đạo 15/08/2026).
              📌 Khóa chứ không ẩn: ẩn nút thì thủ kho tưởng mình mất quyền ghi phiếu và đi hỏi
              vòng quanh; ghi rõ "đã nhận đủ" là họ biết ngay không cần làm gì nữa. */}
          {quyen.ghiPhieuNhanHang && po.trangThai !== "hoan_thanh" && po.trangThai !== "huy" && (
            <Button
              size="sm"
              disabled={Boolean(chanGhiThemPhieu)}
              title={chanGhiThemPhieu ?? undefined}
              onClick={() => setMoForm((v) => !v)}
            >
              <Plus className="size-4" aria-hidden />
              {chanGhiThemPhieu
                ? "Đã nhận đủ hàng"
                : `Ghi phiếu nhận hàng lần ${phieuCuaPO.length + 1}`}
            </Button>
          )}
        </div>

        {/* Nói rõ lý do ngay dưới nút — `title` chỉ hiện khi rê chuột, mà trên máy tính bảng
            thì không có thao tác rê chuột. */}
        {quyen.ghiPhieuNhanHang && chanGhiThemPhieu && (
          <p className="rounded-lg border border-success bg-success-bg px-3 py-2 text-sm text-success-soft">
            {chanGhiThemPhieu}
          </p>
        )}

        {/* Form ghi phiếu nhận hàng — chỉ thủ kho (apps.kh >= 2) */}
        {moForm && (
          <div className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-primary-bg/40 p-4">
            <p className="text-sm font-semibold text-text-primary">
              Phiếu nhận hàng lần {phieuCuaPO.length + 1} — nhập khối lượng CỦA LẦN NÀY, không phải cộng dồn
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ngay-nhan">Ngày nhận thực tế</Label>
                <Input
                  id="ngay-nhan"
                  type="date"
                  value={ngayNhan}
                  onChange={(e) => setNgayNhan(e.target.value)}
                  className="w-44"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="so-phieu-ncc">Số phiếu giao của NCC</Label>
                <Input
                  id="so-phieu-ncc"
                  value={soPhieuNCC}
                  onChange={(e) => setSoPhieuNCC(e.target.value)}
                  placeholder="HT-2026-08-0412"
                  className="w-56"
                />
              </div>
            </div>
            <div className="flex flex-col gap-(--hp-md-row-gap)">
              {tienDo.map((d) => (
                <div key={d.sttDong} className="flex flex-wrap items-end gap-4">
                  <div className="flex min-w-56 flex-col gap-2">
                    <Label htmlFor={`kl-${d.sttDong}`}>
                      {d.tenVatLieu} ({d.donViTinh})
                    </Label>
                    <Input
                      id={`kl-${d.sttDong}`}
                      type="number"
                      min={0}
                      max={d.khoiLuongConLai}
                      value={khoiLuong[d.sttDong] ?? ""}
                      onChange={(e) => setKhoiLuong((t) => ({ ...t, [d.sttDong]: e.target.value }))}
                      placeholder="0"
                      className="w-40"
                    />
                  </div>
                  <span className="pb-2 text-xs text-text-desc">
                    còn lại {d.khoiLuongConLai.toLocaleString("vi-VN")} {d.donViTinh}
                  </span>
                </div>
              ))}
            </div>
            {/* ---- Phiếu giao nhận: BẮT BUỘC ---- */}
            <div className="flex flex-col gap-2 border-t border-divider pt-3">
              <Label>
                Phiếu giao nhận của nhà cung cấp{" "}
                <span className="font-normal text-danger-soft">(bắt buộc)</span>
              </Label>
              <p className="text-xs text-text-desc">
                Chụp hoặc quét tờ phiếu giao nhận đã ký của lần giao này. Đây là chứng từ gốc
                chứng minh hàng đã về — thiếu nó thì số liệu trong app không đối chiếu được với
                giấy tờ.
              </p>
              <ODinhKemTep
                tep={tepPhieuGiao}
                nhanThem="Đính kèm phiếu giao nhận"
                batBuoc={!tepPhieuGiao}
                nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
                onXong={setTepPhieuGiao}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={luuPhieu} disabled={vuongMacLuuPhieu !== null}>
                <PackageCheck className="size-4" aria-hidden />
                Lưu phiếu &amp; nhập kho
              </Button>
              <Button variant="ghost" onClick={() => setMoForm(false)}>
                Hủy
              </Button>
              {/* Nói RÕ vì sao chưa bấm được, không để nút mờ câm lặng. */}
              {vuongMacLuuPhieu && (
                <span className="flex items-center gap-1.5 text-xs text-warning-soft">
                  <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                  {vuongMacLuuPhieu}
                </span>
              )}
            </div>
          </div>
        )}

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
