"use client";

// ============================================================
// KHỐI "NĂNG LỰC PHÒNG THU MUA" — cộng theo nhân viên qua NHIỀU đề nghị
//
// ★★ Sếp 17/09/2026: việc nhân bản đề nghị là *"tài liệu để đánh giá KPI của từng nhân viên,
// của phòng ban"*. App trước đó chỉ thống kê trong ĐÚNG MỘT nhóm đề xuất.
//
// 🔴 QUYỀN: **CHỈ TRƯỞNG PHÒNG VÀ QUẢN TRỊ** — Sếp chốt nguyên văn 17/09/2026: *"chỉ có tk trưởng
// phòng và quản trị mới xem được màn KPI"*. Dùng `quyen.phanBoCongViec` vì cờ đó đã đúng tập người
// ấy (quản trị + trưởng bộ phận thu mua cấp ≥3) — KHÔNG bịa cờ mới chỉ dùng một chỗ.
// ⚠️ Ban Giám đốc KHÔNG nằm trong cờ này. Sếp nói rõ hai nhóm, nên để đúng hai nhóm; muốn mở cho
// BGĐ thì phải có chỉ đạo mới, đừng tự nới bằng cách ghép thêm `xemMoiHoSo` (ghép vậy kéo theo cả
// QLDA — đúng cái bẫy đã ghi ở `quyen.ts` chỗ `xemQuyTrinhMuaHang`).
//
// 🔴 LUẬT TÍNH NẰM Ở `2-quy-trinh/nang-luc-phong-thu-mua.ts`, khối này chỉ bày. Đọc khối chú thích
// đầu tệp đó trước khi dùng con số — đặc biệt đoạn nói app KHÔNG có thước đo độ khó.
// ============================================================

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/1-giao-dien/nen-tang-ui/table";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { congCaPhong, congNangLucTheoNhanVien } from "@/2-quy-trinh/nang-luc-phong-thu-mua";

/** Các kỳ xem được. Giá trị là SỐ THÁNG lùi lại; `0` = tất cả. */
const KY = [
  { ma: "1", nhan: "Tháng này", thang: 1 },
  { ma: "3", nhan: "3 tháng gần đây", thang: 3 },
  { ma: "0", nhan: "Tất cả", thang: 0 },
] as const;

export function KhoiNangLucPhong() {
  const { deNghi, donHang, baoGia, phieuNhan } = useDuLieu();
  const { quyen } = useNguoiDung();
  const [ky, setKy] = useState<string>("1");

  const soThang = KY.find((k) => k.ma === ky)?.thang ?? 1;

  const trongKy = useMemo(() => {
    if (soThang === 0) return deNghi;
    const moc = new Date();
    moc.setMonth(moc.getMonth() - soThang);
    /**
     * 🔴 LỌC THEO `ngayDeNghi`, KHÔNG theo ngày hoàn thành — app **không lưu ngày hoàn thành**
     * (đo 17/09/2026: mốc đó chỉ nằm trong một dòng chữ tiếng Việt của nhật ký, không có trường
     * riêng). Nên "kỳ" ở đây nghĩa là *"phiếu phát sinh trong kỳ"*, và nhãn cột phải nói đúng vậy.
     *
     * ⚠️ Hồ sơ thiếu `ngayDeNghi` thì GIỮ LẠI, không loại — thiếu ngày mà bị loại là công của
     * người ta biến mất khỏi bảng đánh giá, im lặng.
     */
    return deNghi.filter((d) => !d.ngayDeNghi || new Date(d.ngayDeNghi) >= moc);
  }, [deNghi, soThang]);

  const ds = useMemo(
    () => congNangLucTheoNhanVien(trongKy, deNghi, donHang, baoGia, phieuNhan),
    [trongKy, deNghi, donHang, baoGia, phieuNhan],
  );
  const tong = congCaPhong(ds);

  /* 🔴 Chốt quyền Ở ĐÂY, không để nơi gọi tự nhớ — khối này chứa số liệu của mọi nhân viên. */
  if (!quyen.phanBoCongViec) return null;

  return (
    <section className="flex flex-col gap-(--hp-md-row-gap)">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-h3 text-text-primary">
          <Users className="size-5 shrink-0 text-text-desc" aria-hidden />
          Năng lực phòng thu mua
        </h2>
        <label className="ml-auto flex items-center gap-2 text-sm text-text-secondary">
          Kỳ:
          <select
            id="ky-nang-luc"
            value={ky}
            onChange={(e) => setKy(e.target.value)}
            className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm text-text-primary focus:border-primary focus:outline-none md:min-h-9"
          >
            {KY.map((k) => (
              <option key={k.ma} value={k.ma}>
                {k.nhan}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
          {ds.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-desc">
              Chưa có phần việc nào được giao trong kỳ này.
            </p>
          ) : (
            <>
              {/* Bảng — Desktop/Tablet */}
              {/**
                * ★★ BỀ RỘNG BẢNG — Sếp 18/09/2026 khoanh đỏ nửa phải Card: ***"Cân đối lại giao
                * diện, đang trống mục này"***.
                *
                * 🔴 HAI LẦN SAI TRƯỚC ĐÓ, ghi lại để không ai dựng lại:
                *  · Lần 1 (17/09): đặt `w-full` ở cột cuối để nó hút phần dư — nội dung cột đó chỉ là
                *    một con số ⇒ mảng trắng khổng lồ giữa bảng.
                *  · Lần 2 (17/09): chữa bằng `max-w-4xl` ghim bảng ở 896px. Hết mảng trắng TRONG bảng,
                *    nhưng `Card` vẫn ăn hết ~1780px (khung đã bỏ giới hạn 1440px theo chỉ đạo BLĐ
                *    16/08/2026 *"full màn hình"*, xem `khung-tong.tsx`) ⇒ khoảng trống chỉ **dời ra
                *    ngoài bảng**, thành nửa Card rỗng. Đó là thứ Sếp khoanh đỏ hôm nay.
                *
                * ✅ DÙNG ĐÚNG KHUÔN MẪU ĐÃ CHỐT ở `trang/cong-no.tsx` (cùng một loại chỉ đạo, BLĐ
                * 15/09/2026): `table-fixed` + bề rộng PHẦN TRĂM cộng đúng **100**. Khi đó phần dư được
                * chia ĐỀU theo tỷ lệ cho cả 6 cột, không cột nào phình thành dải trắng — nên bảng trải
                * hết Card mà vẫn cân. `min-w-[56rem]` là sàn: hẹp hơn thì cuộn ngang trong khung riêng.
                *
                * ⚠️ BA CÁI BẪY CỦA `table-fixed`, đã dính ở `cong-no.tsx`:
                *  · Nó **chỉ đọc bề rộng ở HÀNG ĐẦU** — đặt `w-…` ở `TableCell` thân bảng là vô nghĩa.
                *  · Nó **không nong cột cho vừa chữ**, chữ `nowrap` dài sẽ TRÀN đè ô bên cạnh ⇒ mọi
                *    tiêu đề nhiều chữ phải `whitespace-normal` (trước đây chỉ cột Nhân viên có).
                *  · Tên người dài phải `truncate` + `title` để rê chuột vẫn đọc đủ.
                */}
              {/* 🔴 `thanh-keo-ngang-ro`: thanh cuộn ngang LUÔN HIỆN (Ban lãnh đạo 22/08/2026).
                  Thêm 18/09/2026 — bảng có sàn 896px nên ở dải 768–896px nó BẮT BUỘC cuộn, mà
                  thanh mặc định của trình duyệt chỉ hiện khi đang kéo: người dùng tưởng bảng chỉ
                  có 5 cột và mất hẳn cột "Đang quá hạn". Khuôn mẫu đã chốt ở `trang/cong-no.tsx`.
                  `Table` tự bọc sẵn một khung cuộn bên trong nên phải tắt khung đó thì lớp thanh
                  cuộn mới ăn. */}
              <div className="thanh-keo-ngang-ro hidden overflow-x-auto md:block [&>[data-slot=table-container]]:overflow-visible">
                <Table className="min-w-[56rem] table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[25%] whitespace-normal">Nhân viên</TableHead>
                      <TableHead className="w-[15%] text-right whitespace-normal">Dòng vật tư</TableHead>
                      <TableHead className="w-[15%] text-right whitespace-normal">
                        Thuộc mấy phiếu
                      </TableHead>
                      <TableHead className="w-[15%] text-right whitespace-normal">
                        Phiếu đã đóng
                      </TableHead>
                      <TableHead className="w-[15%] text-right whitespace-normal">
                        Phiếu đóng dở
                      </TableHead>
                      <TableHead className="w-[15%] text-right whitespace-normal">
                        Đang quá hạn
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ds.map((x) => (
                      <TableRow key={x.uid}>
                        {/* `table-fixed` không nong cột — tên dài phải cắt, `title` để rê chuột đọc đủ. */}
                        <TableCell className="truncate font-medium" title={x.ten}>
                          {x.ten}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{x.soDong}</TableCell>
                        <TableCell className="text-right tabular-nums">{x.soPhieu}</TableCell>
                        <TableCell className="text-right tabular-nums text-success-soft">
                          {x.soPhieuXong || "—"}
                        </TableCell>
                        {/* 🔴 Đóng dở KHÔNG tô xanh — nó không phải thành tích. Tông trung tính. */}
                        <TableCell className="text-right tabular-nums text-text-desc">
                          {x.soPhieuDongDo || "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {x.soPhieuQuaHan > 0 ? (
                            <span className="rounded-md bg-danger/10 px-2 py-0.5 font-semibold text-danger">
                              {x.soPhieuQuaHan}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {tong && (
                      <TableRow>
                        <TableCell className="font-semibold">Cả phòng</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{tong.soDong}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{tong.soPhieu}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{tong.soPhieuXong}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{tong.soPhieuDongDo}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{tong.soPhieuQuaHan}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Card List — Mobile. V1.1 §3.2: bảng nhiều cột trên màn hẹp phải đổi sang thẻ. */}
              <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
                {ds.map((x) => (
                  <div
                    key={x.uid}
                    className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4"
                  >
                    <span className="text-sm font-semibold text-text-primary">{x.ten}</span>
                    <span className="text-sm text-text-secondary">
                      {x.soDong} dòng vật tư · {x.soPhieu} phiếu
                    </span>
                    <span className="text-sm text-text-secondary">
                      Đã đóng {x.soPhieuXong} · đóng dở {x.soPhieuDongDo}
                      {x.soPhieuQuaHan > 0 && (
                        <span className="ml-1 font-semibold text-danger">
                          · quá hạn {x.soPhieuQuaHan}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
                {/**
                  * ★ DÒNG TỔNG "CẢ PHÒNG" CHO BẢN ĐIỆN THOẠI — thêm 18/09/2026.
                  *
                  * 🔴 Bản desktop có hàng cuối cộng đủ 5 con số, bản thẻ thì không — trưởng phòng
                  * mở trên điện thoại phải tự cộng tay. Hai bản của CÙNG một khối mà nói khác nhau
                  * là đúng thứ dự án cấm; và người hay xem bằng điện thoại nhất chính là người cần
                  * con số tổng.
                  */}
                {tong && (
                  <div className="flex flex-col gap-1 rounded-xl border border-primary/40 bg-primary-bg p-4">
                    <span className="text-sm font-semibold text-text-primary">Cả phòng</span>
                    <span className="text-sm text-text-secondary">
                      {tong.soDong} dòng vật tư · {tong.soPhieu} phiếu
                    </span>
                    <span className="text-sm text-text-secondary">
                      Đã đóng {tong.soPhieuXong} · đóng dở {tong.soPhieuDongDo}
                      {tong.soPhieuQuaHan > 0 && (
                        <span className="ml-1 font-semibold text-danger">
                          · quá hạn {tong.soPhieuQuaHan}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/**
            * 🔴🔴 CÂU NÀY BẮT BUỘC PHẢI CÓ, ĐỪNG GỠ CHO GỌN — đã báo Sếp 17/09/2026 trước khi dựng.
            *
            * App KHÔNG có thước đo độ khó: không biết vật tư nào hiếm, nhà cung cấp nào hay chậm.
            * Hai người cùng 10 dòng có thể đã bỏ ra công sức rất khác nhau. Khối thống kê cũ
            * (`bang-nang-luc-theo-nhan-vien.tsx`) tự ghi *"không phải bảng xếp hạng"* đúng vì lý do
            * này, và lý do đó không mất đi khi cộng qua nhiều kỳ — chỉ làm con số **trông** đáng
            * tin hơn thực tế.
            *
            * Bảng nào dùng để đánh giá con người mà không nói ra giới hạn của chính nó thì người
            * đọc sẽ tin nó nhiều hơn mức nó đáng được tin.
            */}
          <p className="border-t border-border pt-3 text-xs text-text-desc">
            Số liệu đếm theo dòng vật tư được giao, <strong>đã trừ phần đã nhân bản sang người
            khác</strong>. Bảng chưa tính độ khó từng phần việc (vật tư hiếm, nhà cung cấp hay chậm)
            — dùng để biết ai đang giữ phần nào và chỗ nào đang tắc, không đủ để một mình kết luận
            năng lực. Kỳ tính theo <strong>ngày lập phiếu</strong>.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
