"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, FileWarning } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { TimelineDeNghi } from "@/1-giao-dien/thanh-phan-nghiep-vu/timeline-de-nghi";
import { ThanhTienDo } from "@/1-giao-dien/thanh-phan-nghiep-vu/thanh-tien-do";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/1-giao-dien/nen-tang-ui/table";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { DongPhanCong } from "@/1-giao-dien/trang/theo-doi-danh-sach";
import { tinhTienDoDeNghi, tomTatTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import { nhanAnToan, NHAN_TRANG_THAI_DONG_CHO_NGUOI_DE_NGHI } from "@/2-quy-trinh/trang-thai";

/** M6 — Chi tiết tiến trình từng mặt hàng cho người đề nghị. */
export default function TrangTheoDoiChiTiet() {
  const params = useParams<{ id: string }>();
  const { deNghi, donHang, phieuNhan } = useDuLieu();
  const { quyen } = useNguoiDung();
  const [moDong, setMoDong] = useState<number | null>(null);
  /**
   * Khối "Chi tiết từng mặt hàng" đang mở hay đã thu gọn.
   *
   * 📌 MẶC ĐỊNH MỞ: đây là nội dung chính của trang, người vào là để xem nó. Gập sẵn thì
   * vào trang phải bấm mới thấy việc mình cần.
   */
  const [moBang, setMoBang] = useState(true);

  const dn = deNghi.find((x) => x.id === params.id);
  const tienDo = useMemo(
    () => (dn ? tinhTienDoDeNghi(dn, donHang, phieuNhan) : []),
    [dn, donHang, phieuNhan],
  );

  if (!dn) {
    return (
      <EmptyState
        icon={FileWarning}
        title="Không tìm thấy đề nghị"
        description="Đề nghị này không tồn tại hoặc bạn không có quyền xem."
      />
    );
  }

  const tomTat = tomTatTienDoDeNghi(tienDo);

  /** Lịch sử nhận hàng của một dòng đề nghị — gộp từ mọi PO liên quan. */
  function lichSuNhan(sttDeNghi: number) {
    const ketQua: { ngay: string; khoiLuong: number; lan: number }[] = [];
    for (const po of donHang.filter((p) => p.prId === params.id)) {
      const dongPO = po.items.filter((d) => d.sttDongDeNghi === sttDeNghi);
      if (dongPO.length === 0) continue;
      for (const p of phieuNhan.filter((x) => x.poId === po.id && x.trangThai === "da_nhap_kho")) {
        for (const d of dongPO) {
          const line = p.lines.find((l) => l.sttDongPO === d.sttDong);
          if (line) ketQua.push({ ngay: p.ngayNhanThucTe, khoiLuong: line.khoiLuongThucNhan, lan: p.lanGiaoThu });
        }
      }
    }
    return ketQua.sort((a, b) => a.ngay.localeCompare(b.ngay));
  }

  return (
    <>
      {/* 🔴 NÚT QUAY LẠI — Ban lãnh đạo 18/08/2026: *"bung ra xem ko group lại được"*.
          (Nhắc lần thứ hai; lần đầu tôi sửa SAI CHỖ — thêm nút "Thu gọn nhóm" ở trang DANH
          SÁCH `/theo-doi`, trong khi Ban lãnh đạo đang đứng ở trang CHI TIẾT này.)

          Vì sao đúng là ngõ cụt: người dùng bấm "Xem chi tiết từng mặt hàng →" ở trang danh
          sách là RỜI TRANG sang đây. Trang này trước chỉ có breadcrumb — chữ nhỏ, xám, không
          ai đọc ra là bấm được — nên không có đường về danh sách đã gom, tức "không group lại
          được". Trang chi tiết đề nghị vốn đã có nút này; trang này bị bỏ sót.

          📌 Cùng kiểu nút, cùng chỗ đặt với `trang/de-nghi-chi-tiet.tsx` — hai trang chi tiết
          nằm cạnh nhau trong cùng app thì đường về phải ở cùng một chỗ. */}
      {/* 📌 `outline` chứ không phải `ghost` (22/08/2026): sau khi bỏ nút ở cuối khối, đây là
          đường về DUY NHẤT trên trang, nên nó phải nhìn ra ngay là bấm được. `ghost` không viền,
          chữ hòa vào nền — đúng cái đã làm người dùng nói "không có nút quay về" bốn lần. */}
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        nativeButton={false}
        render={<Link href="/theo-doi" />}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại Theo dõi đề nghị
      </Button>

      <PageHeader
        crumbs={[
          { label: "Thu mua", href: "/tong-quan" },
          { label: "Theo dõi đề nghị", href: "/theo-doi" },
          { label: dn.code },
        ]}
        title={dn.tieuDe}
        description={`${dn.code} · ${dn.tenCongTrinh} · cần hàng ${new Date(dn.ngayCanHang).toLocaleDateString("vi-VN")}`}
      />

      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          {/* Người đề nghị cần biết "đã ai lo việc này chưa". Từ 12/08/2026 lấy từ PHÂN BỔ
              thay vì nút xác nhận đã bỏ — dùng chung component với màn danh sách. */}
          <DongPhanCong deNghi={dn} hienTen={quyen.xemNguoiPhuTrach} />

          <TimelineDeNghi
            ngayDuyet={dn.ngayDuyet}
            ngayCanHang={dn.ngayCanHang}
            soDongDaNhanDu={tomTat.soDongDaNhanDu}
            tongSoDong={tomTat.tongSoDong}
            soDongDaPhanBo={tienDo.filter((d) => d.trangThaiDong !== "chua_phan_bo").length}
            soDongDaLenPO={tienDo.filter((d) => d.maPOLienQuan.length > 0).length}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          {/* 🔴 CẢ KHỐI GẬP LẠI ĐƯỢC — Ban lãnh đạo 18/08/2026, nhắc BA LẦN: *"bung xem chi
              tiết xong ko group lại được"*.

              Hai lần trước tôi sửa sai chỗ: lần đầu thêm nút "Thu gọn nhóm" ở trang DANH SÁCH
              `/theo-doi`, lần hai thêm nút "Quay lại" ở đầu trang này. Đã đo lại cả ba thứ đó
              và chúng CHẠY ĐÚNG — gập/mở từng dòng đảo được (3 hàng → 4 → 3), nút quay lại về
              đúng `/theo-doi`, nhóm ở đó đã gập.

              Thứ THẬT SỰ còn thiếu là chính khối này: nó luôn bung, không có nút thu gọn, trong
              khi mọi khối khác của app đều gập được. Người xem hết ba mặt hàng rồi muốn gom lại
              cho gọn thì không có chỗ bấm — đúng nghĩa "không group lại được".

              📌 Gập là THÁO nội dung khỏi cây React (khác khối bước ④ phải giữ vì có form nhập
              liệu): ở đây chỉ là bảng đọc, không có ô nào đang gõ nên không có gì để mất.

              🔴 LẦN THỨ TƯ (21/08/2026): *"Mục này khi bung ra xem chi tiết thì lại không có nút
              quay về"* — ảnh khoanh đỏ đúng khối này, lúc nó ĐANG BUNG.

              Nguyên nhân thật, khác cả ba lần đoán trước: nút thu gọn CÓ SẴN và chạy đúng, nhưng
              nó chỉ là một mũi tên xám 16px, không một chữ nào. Người dùng nhìn khối đã bung
              không thấy chỗ nào ghi "quay về" nên kết luận là không có — và họ đúng: một icon
              trơn thì không tự nói được nó làm gì. Đây chính là điều Design System đã dặn cho ô
              trạng thái (*"luôn có cả màu và chữ"*), áp cho nút cũng vậy.

              Nên từ nay: (1) nút thu gọn có CHỮ, đứng bên phải tiêu đề; (2) thêm một nút nữa ở
              CUỐI khối — xem hết bảng thì mắt đang ở dưới, bắt cuộn ngược lên đầu mới đóng được
              cũng là một kiểu ngõ cụt; (3) dòng mặt hàng bung ra có nút "Đóng" riêng. */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMoBang((v) => !v)}
              aria-expanded={moBang}
              className="flex min-h-11 w-fit items-center gap-2 text-left"
            >
              <ChevronDown
                className={`size-4 shrink-0 text-text-desc transition-transform ${moBang ? "" : "-rotate-90"}`}
                aria-hidden
              />
              <span className="text-h3 text-text-primary">Chi tiết từng mặt hàng</span>
              {/* Khi gập vẫn phải biết bên trong có gì, nếu không thu gọn chỉ là giấu thông tin. */}
              {!moBang && (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-text-secondary tabular-nums">
                  {tienDo.length} mặt hàng
                </span>
              )}
            </button>

            {/* Nút CÓ CHỮ — thứ người dùng tìm mà không thấy. Cùng hành động với mũi tên bên
                trái; để hai chỗ bấm là cố ý, vì mắt người tìm chữ trước khi tìm icon. */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMoBang((v) => !v)}
              aria-expanded={moBang}
              className="min-h-11 md:min-h-9"
            >
              {moBang ? (
                <>
                  <ChevronUp className="size-4" aria-hidden />
                  Thu gọn
                </>
              ) : (
                <>
                  <ChevronDown className="size-4" aria-hidden />
                  Mở ra xem
                </>
              )}
            </Button>
          </div>

          {moBang && (
            <>
          {/* Bảng — Desktop/Tablet */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mặt hàng</TableHead>
                  <TableHead>ĐVT</TableHead>
                  <TableHead className="text-right">Đề nghị</TableHead>
                  <TableHead className="text-right">Đã nhận</TableHead>
                  <TableHead className="text-right">Còn lại</TableHead>
                  <TableHead>Dự kiến giao</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tienDo.map((d) => {
                  const tt = nhanAnToan(NHAN_TRANG_THAI_DONG_CHO_NGUOI_DE_NGHI, d.trangThaiDong);
                  const ls = lichSuNhan(d.stt);
                  return (
                    <Fragment key={d.stt}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setMoDong(moDong === d.stt ? null : d.stt)}
                      >
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            <ChevronDown
                              className={`size-4 shrink-0 text-text-desc transition-transform ${moDong === d.stt ? "rotate-180" : ""}`}
                              aria-hidden
                            />
                            {d.tenVatLieu}
                          </span>
                        </TableCell>
                        <TableCell>{d.donViTinh}</TableCell>
                        <TableCell className="text-right">{d.khoiLuongDeNghi.toLocaleString("vi-VN")}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {d.khoiLuongDaNhan.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${d.khoiLuongConLai > 0 ? "text-warning-soft" : "text-success-soft"}`}
                        >
                          {d.khoiLuongConLai.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {d.ngayGiaoDuKien ? new Date(d.ngayGiaoDuKien).toLocaleDateString("vi-VN") : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <StatusBadge label={tt.nhan} tone={tt.tong} />
                            {d.khoiLuongDaNhan > 0 && d.khoiLuongConLai > 0 && (
                              <ThanhTienDo phanTram={d.phanTram} nhan={`${Math.round(d.phanTram)}%`} />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {moDong === d.stt && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-surface">
                            <div className="flex flex-col items-start gap-2">
                              {ls.length === 0 ? (
                                <p className="text-sm text-text-desc">Chưa có lần nhận hàng nào.</p>
                              ) : (
                                <ul className="flex flex-col gap-1">
                                  {ls.map((x, i) => (
                                    <li key={i} className="text-sm text-text-secondary">
                                      Lần {x.lan} · {new Date(x.ngay).toLocaleDateString("vi-VN")} · nhận{" "}
                                      <strong>{x.khoiLuong.toLocaleString("vi-VN")}</strong> {d.donViTinh}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {/* Đóng ngay tại dòng vừa bung — không phải mò lại đúng dòng ở trên. */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setMoDong(null)}
                                className="min-h-11 md:min-h-9"
                              >
                                <ChevronUp className="size-4" aria-hidden />
                                Đóng dòng này
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Card List — Mobile: BCH hay xem ở công trường bằng điện thoại */}
          <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
            {tienDo.map((d) => {
              const tt = nhanAnToan(NHAN_TRANG_THAI_DONG_CHO_NGUOI_DE_NGHI, d.trangThaiDong);
              const ls = lichSuNhan(d.stt);
              return (
                <div key={d.stt} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-text-primary">{d.tenVatLieu}</span>
                    <StatusBadge label={tt.nhan} tone={tt.tong} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-desc">Đề nghị</span>
                    <span className="font-semibold">
                      {d.khoiLuongDeNghi.toLocaleString("vi-VN")} {d.donViTinh}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-desc">Đã nhận</span>
                    <span className="font-semibold">{d.khoiLuongDaNhan.toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-desc">Còn lại</span>
                    <span
                      className={d.khoiLuongConLai > 0 ? "font-semibold text-warning-soft" : "font-semibold text-success-soft"}
                    >
                      {d.khoiLuongConLai.toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-desc">Dự kiến giao</span>
                    <span>
                      {d.ngayGiaoDuKien ? new Date(d.ngayGiaoDuKien).toLocaleDateString("vi-VN") : "—"}
                    </span>
                  </div>
                  <ThanhTienDo
                    phanTram={d.phanTram}
                    tong={d.khoiLuongConLai === 0 ? "success" : "primary"}
                    nhan={d.khoiLuongConLai === 0 ? "Đã nhận đủ" : `${Math.round(d.phanTram)}%`}
                  />
                  {ls.length > 0 && (
                    <ul className="flex flex-col gap-0.5 border-t border-divider pt-2 text-xs text-text-desc">
                      {ls.map((x, i) => (
                        <li key={i}>
                          Lần {x.lan} · {new Date(x.ngay).toLocaleDateString("vi-VN")} ·{" "}
                          {x.khoiLuong.toLocaleString("vi-VN")} {d.donViTinh}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* ❌ ĐÃ BỎ hai nút ở cuối khối (22/08/2026 — Ban lãnh đạo: *"Bỏ nút này vì đã có ở
              trên"* cho nút Thu gọn, và *"Di chuyển nút này nên trên"* cho nút Quay lại).

              Hôm 21/08 tôi thêm chúng để người xem hết bảng không phải cuộn ngược lên mới đóng
              được. Nhưng khối này chỉ dài ba dòng, nên cả hai nút đều nằm trong cùng một khung
              nhìn với nút ở trên — thành ra là hai cặp nút giống nhau cách nhau vài trăm pixel.
              Nút thừa làm người dùng phải đọc lại để biết hai nút có khác nhau không.

              📌 Cả hai việc vẫn làm được ở hàng tiêu đề khối: nút "Thu gọn" ở đó, và đường về
              nằm ở nút "Quay lại Theo dõi đề nghị" ngay đầu trang. */}
            </>
          )}

          <p className="border-t border-divider pt-3 text-xs text-text-desc">
            🔒 Màn hình này không hiển thị đơn giá, thành tiền, nhà cung cấp và tên nhân viên thu mua phụ trách.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
