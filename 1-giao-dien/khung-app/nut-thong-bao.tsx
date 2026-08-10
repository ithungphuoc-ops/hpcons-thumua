"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { toast } from "sonner";
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
import { HopNhanCongTac } from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-nhan-cong-tac";
import { lyDoKhongNhanCongTac } from "@/4-phan-quyen/quyen-theo-ho-so";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  NHAN_GIAI_DOAN,
  vuongMacSangBuocSau,
  type GiaiDoanMuaHang,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import type { ThongBaoChuyenBuoc } from "@/3-du-lieu/kieu-du-lieu";

const nhanBuoc = (ma?: string) =>
  ma ? (NHAN_GIAI_DOAN[ma as GiaiDoanMuaHang]?.nhan ?? ma) : "";

const gioPhut = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

/**
 * 🔔 CHUÔNG THÔNG BÁO CHUYỂN BƯỚC — sinh tự động khi một đề nghị đổi bước trên
 * bảng quy trình (kéo thả hay nghiệp vụ đều bắt được). Mỗi thông báo có nút
 * "Nhận công tác" để người phụ trách bước mới xác nhận tiếp quản — nhận xong
 * ghi cả vào nhật ký "Lịch sử" của đề nghị.
 * Mở chuông là toàn bộ thông báo được tính đã đọc.
 */
export function NutThongBao() {
  const router = useRouter();
  const { thongBao, baoGia, deNghi, danhDauDaDocThongBao, nhanCongTac, taoBaoGiaGiaLap } =
    useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  const chuaDoc = thongBao.filter((t) => !t.daDoc).length;

  /**
   * Thông báo đang chờ người dùng xác nhận nhận công tác.
   *
   * 🔴 PHẢI HỎI TRƯỚC KHI NHẬN (chỉ đạo Ban lãnh đạo 10/08/2026): *"khi nhân viên bấm tiếp
   * nhận thì phải hiện thông báo có chắc chắn nhận hay không, hay do bấm nhầm"*. Nhận công
   * tác là việc KHÔNG HOÀN LẠI ĐƯỢC — tên người nhận ghi vào nhật ký đề nghị, và ở bước
   * tiếp nhận nó còn kéo theo lập bảng báo giá tức chuyển hẳn đề nghị sang bước sau.
   */
  const [hoiNhan, doiHoiNhan] = useState<ThongBaoChuyenBuoc | null>(null);

  /**
   * Nhận công tác ở bước ① thì TỰ CHUYỂN sang bước ② "Yêu cầu NCC báo giá"
   * (chỉ đạo Ban lãnh đạo 10/08/2026).
   *
   * 🔴 Chuyển bước bằng cách LẬP BẢNG BÁO GIÁ, không phải gán một trường trạng thái. Giai
   * đoạn của đề nghị được **suy ra từ chứng từ** (xem `2-quy-trinh/giai-doan-mua-hang.ts`),
   * nên muốn nó sang bước ② thì phải có chứng từ của bước ② tồn tại thật. Gán nhãn chay sẽ
   * bị hàm suy giai đoạn tính lại và nhảy về bước cũ ngay lần render sau.
   */
  /** Luật "ai được nhận" — dùng cho cả điều kiện hiện nút lẫn lớp chặn khi ghi. */
  function lyDoKhongNhan(tb: ThongBaoChuyenBuoc): string | null {
    const dn = deNghi.find((d) => d.id === tb.prId);
    if (!dn) return "Không tìm thấy đề nghị của thông báo này.";
    return lyDoKhongNhanCongTac(dn, tb.denBuoc, nguoiDung.uid, quyen);
  }

  function xacNhanNhan(tb: ThongBaoChuyenBuoc) {
    // 🔴 Lớp chặn thứ hai (chỉ đạo Ban lãnh đạo 10/08/2026: "sao trưởng bộ phận chưa duyệt
    // mà nhân viên tự bấm nhận việc được") — nút đã ẩn nhưng vẫn kiểm lại trước khi ghi tên
    // vào nhật ký, phòng đường gọi khác.
    const lyDo = lyDoKhongNhan(tb);
    if (lyDo) {
      toast.error("Chưa nhận việc này được", { description: lyDo });
      return;
    }
    nhanCongTac(tb.id, { uid: nguoiDung.uid, ten: nguoiDung.tenHienThi });

    const dangOBuocTiepNhan = tb.denBuoc === "tiep_nhan";
    // Đã có bảng báo giá rồi thì đề nghị vốn đã qua bước ②, đừng lập thêm bảng thứ hai.
    const daCoBaoGia = baoGia.some((b) => b.prId === tb.prId && b.trangThai !== "huy");

    // 🔴 BƯỚC TRƯỚC PHẢI XONG MỚI CHUYỂN BƯỚC (chỉ đạo Ban lãnh đạo 10/08/2026).
    // Đây từng là đường lách: nhận công tác là lập luôn bảng báo giá, kể cả khi chưa phân bổ
    // dòng nào — đề nghị nhảy sang bước ② rồi ④ mà không ai được phân công.
    const dn = deNghi.find((d) => d.id === tb.prId);
    const vuongMac = dn
      ? vuongMacSangBuocSau(
          dn,
          "tiep_nhan",
          baoGia.filter((b) => b.prId === tb.prId),
        )
      : null;

    if (dangOBuocTiepNhan && vuongMac) {
      toast.warning("Đã nhận công tác nhưng chưa chuyển bước", { description: vuongMac });
      return;
    }

    if (dangOBuocTiepNhan && !daCoBaoGia) {
      const id = taoBaoGiaGiaLap(tb.prId, nguoiDung.tenHienThi);
      if (id) {
        toast.success("Đã nhận công tác", {
          description: `${tb.prCode} chuyển sang bước “Yêu cầu NCC báo giá” — đã lập bảng báo giá.`,
          action: { label: "Mở bảng báo giá", onClick: () => router.push(`/bao-gia/${id}`) },
        });
      } else {
        // Nói thật khi không chuyển được bước, đừng báo thành công cho xong việc.
        toast.warning("Đã nhận công tác nhưng chưa chuyển bước", {
          description: "Không lập được bảng báo giá: đã hết mã dự phòng của bản chạy thử.",
        });
      }
      return;
    }

    toast.success("Đã nhận công tác", {
      description: `${tb.prCode} — bước “${nhanBuoc(tb.denBuoc)}”`,
    });
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) danhDauDaDocThongBao();
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
            <span>Thông báo chuyển bước</span>
            <span className="text-[11px] font-normal text-text-desc">
              Đề nghị đổi bước trên bảng quy trình là báo ở đây — bấm &quot;Nhận công tác&quot; để tiếp quản
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {thongBao.length === 0 ? (
            <p className="px-2 py-5 text-center text-xs text-text-desc">
              Chưa có thông báo nào. Kéo một thẻ trên bảng quy trình sang bước kế tiếp để thử.
            </p>
          ) : (
            thongBao.slice(0, 8).map((tb) => (
              <DropdownMenuItem
                key={tb.id}
                onClick={() => router.push(`/de-nghi/${tb.prId}`)}
                className="items-start"
              >
                <div className="flex w-full flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-primary">{tb.prCode}</span>
                    <span className="shrink-0 text-[11px] text-text-desc">{gioPhut(tb.thoiDiem)}</span>
                  </div>
                  <span className="text-xs text-text-primary">
                    {/* Tin CHUYỂN TIẾP có `tuBuoc` = `denBuoc` (bàn giao người làm, không
                        đổi bước) nên phải viết riêng — để nguyên sẽ ra "A → A" vô nghĩa. */}
                    {tb.laChuyenTiep
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
                  {tb.tiepNhan ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success-soft">
                      <Check className="size-3.5 shrink-0" aria-hidden />
                      {tb.tiepNhan.ten} đã nhận công tác lúc {gioPhut(tb.tiepNhan.thoiDiem)}
                    </span>
                  ) : quyen.lapPO && lyDoKhongNhan(tb) === null ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="self-start"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Không nhận ngay — mở hộp xác nhận, tránh bấm nhầm.
                        doiHoiNhan(tb);
                      }}
                    >
                      Nhận công tác
                    </Button>
                  ) : (
                    <span className="text-[11px] font-medium text-warning-soft">Chờ tiếp nhận</span>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>

      {/* Hộp xác nhận dùng chung với thẻ trên bảng quy trình — xem `hop-nhan-cong-tac.tsx`.
          Tách ra vì có hai chỗ bấm nhận; copy sang chỗ thứ hai thì lời cảnh báo "không hoàn
          lại được" sẽ lệch nhau khi sửa. */}
      <HopNhanCongTac
        thongBao={hoiNhan}
        seTuChuyenBuoc={
          hoiNhan?.denBuoc === "tiep_nhan" &&
          !baoGia.some((b) => b.prId === hoiNhan.prId && b.trangThai !== "huy")
        }
        onDong={() => doiHoiNhan(null)}
        onDongY={xacNhanNhan}
      />
    </DropdownMenu>
  );
}
