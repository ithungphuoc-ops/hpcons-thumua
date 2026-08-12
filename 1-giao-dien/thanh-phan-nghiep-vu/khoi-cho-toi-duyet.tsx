"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BadgeCheck, ChevronRight } from "lucide-react";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { capDangCho, lyDoKhongDuyetDuoc } from "@/2-quy-trinh/duyet-bo-phan";
import { formatDate } from "@/6-tien-ich/dinh-dang";

/**
 * KHỐI "ĐỀ NGHỊ CHỜ TÔI DUYỆT" — đường vào duy nhất của người duyệt.
 *
 * 🔴 KHỐI NÀY LÀ BẮT BUỘC, KHÔNG PHẢI TIỆN ÍCH. Từ 12/08/2026 bảng quy trình của Thu mua
 * **lọc bỏ** phiếu chưa duyệt xong (đúng chỉ đạo Ban lãnh đạo), còn màn "Theo dõi đề nghị"
 * chỉ hiện phiếu mình đề xuất hoặc được thêm vào theo dõi.
 *
 * Nghĩa là: nếu không có khối này thì Chỉ huy trưởng và Trưởng phòng **không thấy phiếu
 * nhân viên gửi lên ở bất cứ đâu** — phiếu chờ duyệt vĩnh viễn, và người gửi thì cứ tưởng
 * cấp trên đang xem. Đúng kiểu việc rơi vào vùng mù, chỉ vỡ ra khi trễ ngày cần hàng.
 *
 * 📌 Đặt ở "Công việc của tôi" vì đây là màn trả lời câu *"việc nào đang tới tay tôi"* —
 * duyệt một đề nghị đúng là việc đang tới tay họ.
 */
export function KhoiChoToiDuyet() {
  const { deNghi } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  const dsChoDuyet = useMemo(
    () =>
      deNghi
        .filter((dn) => !dn.luuTru)
        // Chỉ giữ phiếu đang chờ, và ĐÚNG cấp mình duyệt được.
        // `lyDoKhongDuyetDuoc` đã lo cả việc không tự duyệt phiếu của chính mình.
        .filter((dn) => capDangCho(dn) !== null)
        .filter((dn) => lyDoKhongDuyetDuoc(dn, quyen, nguoiDung.uid) === null)
        // Cần hàng gấp nhất lên đầu — đó là phiếu duyệt trễ thì thiệt nhất.
        .sort((a, b) => a.ngayCanHang.localeCompare(b.ngayCanHang)),
    [deNghi, quyen, nguoiDung.uid],
  );

  // Không có gì chờ mình thì không hiện — đừng để một khối rỗng chiếm chỗ mỗi ngày.
  if (dsChoDuyet.length === 0) return null;

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-warning bg-warning-bg p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <BadgeCheck className="size-4 shrink-0 text-warning-soft" aria-hidden />
        Đề nghị chờ bạn duyệt ({dsChoDuyet.length})
      </h2>
      <p className="text-xs text-text-secondary">
        Những phiếu này <strong>chưa sang Phòng Thu mua</strong>. Bấm vào để xem chi tiết rồi
        duyệt.
      </p>

      <ul className="flex flex-col divide-y divide-divider overflow-hidden rounded-lg border border-border bg-card">
        {dsChoDuyet.map((dn) => {
          const cap = capDangCho(dn);
          return (
            <li key={dn.id}>
              <Link
                href={`/de-nghi/${dn.id}`}
                className="flex min-w-0 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span className="text-sm font-semibold text-primary">{dn.code}</span>
                    <span className="rounded bg-warning-bg px-1.5 py-0.5 text-[11px] font-medium text-warning-soft">
                      Chờ duyệt cấp {cap}
                    </span>
                  </span>
                  {/* `min-w-0` + `truncate` ở mọi cấp có cắt chữ, thiếu là tràn ra ngoài. */}
                  <span className="truncate text-xs text-text-secondary">
                    {dn.tieuDe} · {dn.tenCongTrinh}
                  </span>
                  <span className="text-xs text-text-desc">
                    {dn.nguoiDeNghiTen} lập · cần hàng {formatDate(dn.ngayCanHang)} ·{" "}
                    {dn.items.length} dòng vật tư
                  </span>
                </span>
                <ChevronRight className="ml-auto size-4 shrink-0 text-text-desc" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
