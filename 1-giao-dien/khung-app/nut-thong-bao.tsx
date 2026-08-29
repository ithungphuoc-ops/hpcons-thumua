"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/1-giao-dien/nen-tang-ui/dropdown-menu";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  NHAN_GIAI_DOAN,
  thongBaoDanhChoToi,
  type GiaiDoanMuaHang,
} from "@/2-quy-trinh/giai-doan-mua-hang";

const nhanBuoc = (ma?: string) =>
  ma ? (NHAN_GIAI_DOAN[ma as GiaiDoanMuaHang]?.nhan ?? ma) : "";

const gioPhut = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

/**
 * 🔔 CHUÔNG THÔNG BÁO CHUYỂN BƯỚC — sinh tự động khi một đề nghị đổi bước trên bảng quy
 * trình (kéo thả hay nghiệp vụ đều bắt được).
 *
 * 🔴 KHÔNG CÒN NÚT "Nhận công tác" — Ban lãnh đạo 12/08/2026: *"Trưởng phòng giao việc thì
 * chắc chắn phải làm nên không cần bước bấm xác nhận này"*. Chuông giờ chỉ để BÁO TIN.
 * Người được giao mà không làm được thì dùng "Chuyển việc" ở bảng phân bổ.
 */
export function NutThongBao() {
  const router = useRouter();
  const { thongBao: tatCaThongBao, danhDauDaDocThongBao } = useDuLieu();
  const { quyen, nguoiDung } = useNguoiDung();

  /**
   * 🔴 CHỈ HIỆN THÔNG BÁO GỬI CHO MÌNH — Ban lãnh đạo 12/08/2026.
   *
   * Trước đây chuông đổ hết mọi thông báo cho mọi người: trưởng phòng thấy tin gửi cho
   * ba nhân viên **kèm nút "Nhận công tác"**, bấm vào là giành mất việc của nhân viên và
   * ghi tên mình vào nhật ký. Nhân viên cũng thấy việc của nhau.
   *
   * Luật ở `2-quy-trinh/giai-doan-mua-hang.ts` → `thongBaoDanhChoToi`, MỘT CHỖ DUY NHẤT.
   */
  const thongBao = useMemo(
    () =>
      tatCaThongBao.filter((t) =>
        thongBaoDanhChoToi(
          t.guiToi,
          nguoiDung.tenHienThi,
          quyen.phanBoCongViec,
          nguoiDung.vaiTro === "director",
        ),
      ),
    [tatCaThongBao, nguoiDung.tenHienThi, quyen.phanBoCongViec, nguoiDung.vaiTro],
  );

  // ⚠️ Đếm trên danh sách ĐÃ LỌC. Đếm trên danh sách gốc thì chuông báo số đỏ cho những
  // tin người dùng không bao giờ nhìn thấy — bấm vào không thấy gì, số không bao giờ hết.
  const chuaDoc = thongBao.filter((t) => !t.daDoc).length;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        // Chỉ đánh dấu đã đọc những tin CỦA MÌNH — xem ghi chú ở `danhDauDaDocThongBao`.
        if (open) danhDauDaDocThongBao(thongBao.map((t) => t.id));
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={chuaDoc > 0 ? `Thông báo — ${chuaDoc} chưa đọc` : "Thông báo"}
          />
        }
      >
        <Bell className="size-5" />
        {chuaDoc > 0 && (
          <span
            aria-hidden
            className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
          >
            {chuaDoc > 9 ? "9+" : chuaDoc}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 max-w-[92vw]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span>Thông báo</span>
            {/* Nói đủ BA loại tin (cập nhật 29/08/2026 thêm cảnh báo PO treo — trước đó chỉ nói
                hai loại "việc mới" và "đổi bước", khiến người nhận cảnh báo PO treo (Trưởng bộ
                phận/Ban lãnh đạo) đọc phụ đề không thấy mình thuộc diện nào — CodeRabbit review). */}
            <span className="text-[11px] font-normal text-text-desc">
              Việc mới giao cho bạn, đề nghị đổi bước, và PO chờ đề nghị treo quá hạn đều báo ở
              đây
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {thongBao.length === 0 ? (
            <p className="px-2 py-5 text-center text-xs text-text-desc">
              Chưa có thông báo nào gửi cho bạn. Chuông chỉ hiện việc giao cho bạn (và, nếu bạn là
              Trưởng bộ phận/Ban lãnh đạo, cảnh báo PO treo), không hiện việc của người khác.
            </p>
          ) : (
            thongBao.slice(0, 8).map((tb) => (
              <DropdownMenuItem
                key={tb.id}
                /* ★ Tin cảnh báo PO treo (29/08/2026) mang id/mã CỦA PO trong `prId`/`prCode`
                   (xem chú thích ở `ThongBaoChuyenBuoc.laCanhBaoTreo`) — điều hướng sang
                   trang PO, không phải trang đề nghị. */
                onClick={() =>
                  router.push(tb.laCanhBaoTreo ? `/don-hang/${tb.prId}` : `/de-nghi/${tb.prId}`)
                }
                className="items-start"
              >
                <div className="flex w-full flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-primary">{tb.prCode}</span>
                    <span className="shrink-0 text-[11px] text-text-desc">{gioPhut(tb.thoiDiem)}</span>
                  </div>
                  <span className="text-xs text-text-primary">
                    {/* 🔴 THỨ TỰ CÁC NHÁNH CÓ Ý NGHĨA: tin "việc mới" và tin "chuyển tiếp" đều có
                        `tuBuoc` = `denBuoc` (không đổi bước hồ sơ), nên phải xét TRƯỚC nhánh so
                        hai bước — để nguyên sẽ ra "A → A" vô nghĩa. */}
                    {/* 🔴 KHÔNG in tên bước cho tin "việc mới". Bước được suy ra ở đúng khoảnh
                        khắc bấm giao việc, tức TRƯỚC khi dòng vừa giao kịp ghi vào dữ liệu — mà
                        chính cú giao đó có thể đẩy hồ sơ sang bước sau (giao nốt dòng cuối là
                        ① → ②). In ra là chỉ người nhận sang một bước đã cũ. Bấm "mở phiếu" thì
                        họ thấy bước thật ngay trên thanh tiến độ, không cần chuông đoán hộ. */}
                    {/* ★ Cảnh báo PO treo (29/08/2026) — xét TRƯỚC mọi nhánh khác, đọc thẳng
                        `tieuDe` thay vì suy diễn từ bước đề nghị (tin này không nói về đề
                        nghị nào cả, xem `ThongBaoChuyenBuoc.laCanhBaoTreo`). */}
                    {tb.laCanhBaoTreo
                      ? tb.tieuDe
                      : tb.laViecMoi
                        ? `Bạn được giao ${tb.soDongViec ?? ""} dòng vật tư`
                        : tb.laChuyenTiep
                          ? `Trưởng bộ phận chuyển tiếp — mời tiếp tục bước "${nhanBuoc(tb.denBuoc)}"`
                          : tb.tuBuoc
                            ? `${nhanBuoc(tb.tuBuoc)} → ${nhanBuoc(tb.denBuoc)}`
                            : `Đề nghị mới vào bước "${nhanBuoc(tb.denBuoc)}"`}
                  </span>
                  {tb.loiNhan && (
                    <span className="text-[11px] text-text-secondary italic">
                      “{tb.loiNhan}”
                    </span>
                  )}
                  {tb.guiToi.length > 0 && (
                    <span className="text-[11px] text-text-desc">Gửi tới: {tb.guiToi.join(" · ")}</span>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
