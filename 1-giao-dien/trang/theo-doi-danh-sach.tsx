"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Clock, Eye, GitBranch, UserCheck } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { TimelineDeNghi } from "@/1-giao-dien/thanh-phan-nghiep-vu/timeline-de-nghi";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { tinhTienDoDeNghi, tomTatTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import { NHAN_TRANG_THAI_DE_NGHI } from "@/2-quy-trinh/trang-thai";
import { NHAN_GIAI_DOAN, xacDinhGiaiDoan } from "@/2-quy-trinh/giai-doan-mua-hang";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * M6 — Người đề nghị (Phòng Thi công) theo dõi tiến trình đề nghị của mình.
 * Màn hình MỚI, bản thumua-next cũ không có.
 * 🔒 Không hiển thị: đơn giá, thành tiền, nhà cung cấp, tên nhân viên thu mua.
 */
export default function TrangTheoDoi() {
  const { deNghi, donHang, baoGia, phieuNhan } = useDuLieu();
  const router = useRouter();
  const { nguoiDung, quyen } = useNguoiDung();

  /** Người đề nghị chỉ thấy đề nghị của mình; vai trò quản lý thấy hết. */
  const danhSach = useMemo(() => {
    const nguon = quyen.xemMoiHoSo
      ? deNghi
      : deNghi.filter((dn) => dn.nguoiDeNghiUid === nguoiDung.uid);
    return nguon.map((dn) => {
      const tienDo = tinhTienDoDeNghi(dn, donHang, phieuNhan);
      return {
        dn,
        tienDo,
        tomTat: tomTatTienDoDeNghi(tienDo),
        // Giai đoạn SUY RA từ chứng từ thật, không thêm trường mới — xem `xacDinhGiaiDoan`.
        giaiDoan: xacDinhGiaiDoan(dn, donHang, baoGia, phieuNhan),
      };
    });
  }, [deNghi, donHang, baoGia, phieuNhan, nguoiDung.uid, quyen.xemMoiHoSo]);

  /**
   * ★ GOM NHÓM THEO MÃ ĐỀ NGHỊ — Ban lãnh đạo 13/08/2026: *"mục theo dõi đề nghị này em
   * làm thêm tính năng group lại theo mã đề nghị nữa nhé"*.
   *
   * Một đề xuất lớn tách thành nhiều phiếu (`PR-001`, `PR-001 (copy)`, `PR-001 (copy 2)`)
   * nằm rời rạc thì người theo dõi phải tự nhớ chúng là một việc. Gom lại thì đọc một lần
   * thấy ngay: việc này chia mấy phần, phần nào đang ở đâu.
   *
   * 🔴 Gom theo `deNghiGocId` (mã hồ sơ), KHÔNG theo tiêu đề: hai đề xuất khác nhau hoàn
   * toàn có thể trùng tên, gom nhầm là trộn việc của hai người thành một.
   *
   * 📌 Trả về DANH SÁCH PHẲNG có xen dòng tiêu đề, không phải cây lồng nhau. Lồng thêm một
   * cấp thì 90 dòng JSX bên dưới phải thụt lại hết — diff phình lên mà giao diện không
   * khác gì. Thẻ thuộc nhóm nhận viền trái để mắt thấy chúng đi cùng nhau.
   */
  const dongHienThi = useMemo(() => {
    const map = new Map<string, typeof danhSach>();
    for (const m of danhSach) {
      const goc = m.dn.deNghiGocId ?? m.dn.id;
      map.set(goc, [...(map.get(goc) ?? []), m]);
    }
    const ra: ({ loai: "nhom"; id: string; ma: string; tieuDe: string; soPhieu: number } | ((typeof danhSach)[number] & { loai: "the"; trongNhom: boolean }))[] = [];
    for (const [gocId, ds] of map) {
      // Phiếu gốc có thể KHÔNG nằm trong danh sách (không được xem, hoặc đã xóa) — khi đó
      // lấy mã gốc chép sẵn trên phiếu con để vẫn gọi tên được nhóm.
      const goc = ds.find((x) => x.dn.id === gocId)?.dn;
      const trongNhom = ds.length > 1;
      if (trongNhom) {
        ra.push({
          loai: "nhom",
          id: gocId,
          ma: goc?.code ?? ds[0].dn.maDeNghiGoc ?? ds[0].dn.code,
          tieuDe: goc?.tieuDe ?? ds[0].dn.tieuDe,
          soPhieu: ds.length,
        });
      }
      // Phiếu gốc lên đầu, các bản tách xếp theo mã cho thứ tự ổn định.
      const sapXep = [...ds].sort((a, b) =>
        a.dn.id === gocId ? -1 : b.dn.id === gocId ? 1 : a.dn.code.localeCompare(b.dn.code),
      );
      for (const m of sapXep) ra.push({ ...m, loai: "the", trongNhom });
    }
    return ra;
  }, [danhSach]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Thu mua", href: "/tong-quan" }, { label: "Theo dõi đề nghị" }]}
        title="Theo dõi đề nghị"
        description="Tiến trình hồ sơ đề nghị mua hàng — không hiển thị giá và nhà cung cấp"
      />

      {danhSach.length === 0 ? (
        /* 🔴 12/08/2026: câu cũ ghi *"Đề nghị bạn lập trên HPcore… sẽ hiện ở đây"* — chỉ
           người dùng sang một hệ thống khác để làm việc mà app này đang làm được. Từ khi
           mọi tài khoản lập được đề nghị NGAY TRONG APP, câu đó đẩy người mới đi lạc đúng
           lúc họ cần chỉ đúng nhất. Nay nói thật, và mở luôn đường vào. */
        <EmptyState
          icon={Eye}
          title="Chưa có đề nghị nào để theo dõi"
          description={
            quyen.taoDeNghi
              ? "Chưa có đề nghị nào do bạn lập hoặc có tên bạn trong danh sách theo dõi. Bạn lập được đề nghị ngay trong app."
              : "Chưa có đề nghị nào do bạn lập hoặc có tên bạn trong danh sách theo dõi."
          }
          action={
            quyen.taoDeNghi
              ? { label: "Tạo đề nghị mua hàng", onClick: () => router.push("/de-nghi/nhan-moi") }
              : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-(--hp-md-card-gap)">
          {dongHienThi.map((m) => {
            // Dòng tiêu đề của một nhóm phiếu đã tách.
            if (m.loai === "nhom") {
              return (
                <p
                  key={`nhom-${m.id}`}
                  className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1 text-sm"
                >
                  <GitBranch className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="font-semibold text-text-primary">{m.ma}</span>
                  <span className="text-text-secondary">— {m.tieuDe}</span>
                  <span className="rounded bg-primary-bg px-1.5 py-0.5 text-xs font-medium text-primary">
                    {m.soPhieu} phiếu đã tách
                  </span>
                </p>
              );
            }
            const { dn, tienDo, tomTat, giaiDoan } = m;
            const tt = NHAN_TRANG_THAI_DE_NGHI[dn.trangThai];
            const buoc = NHAN_GIAI_DOAN[giaiDoan];
            return (
              <Card
                key={dn.id}
                // Viền trái + lùi vào: thấy ngay thẻ này thuộc nhóm phía trên, mà không
                // phải lồng thêm một lớp khung bọc quanh cả nhóm.
                className={m.trongNhom ? "ml-3 border-l-4 border-l-primary" : undefined}
              >
                <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/theo-doi/${dn.id}`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {dn.code}
                      </Link>
                      <span className="text-sm text-text-primary">{dn.tieuDe}</span>
                      <span className="text-xs text-text-desc">{dn.tenCongTrinh}</span>
                    </div>
                    {/* Bước hiện tại đứng cạnh trạng thái: người đề nghị cần biết hồ sơ
                        đang nằm ở đâu, không chỉ "đã duyệt" hay "hoàn thành". */}
                    <span className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge label={buoc.nhan} tone={buoc.tong} />
                      <StatusBadge label={tt.nhan} tone={tt.tong} />
                    </span>
                  </div>

                  {/* ---- Phòng Thu mua đã phân công chưa ---- */}
                  <DongPhanCong deNghi={dn} hienTen={quyen.xemNguoiPhuTrach} />

                  <TimelineDeNghi
                    ngayDuyet={dn.ngayDuyet}
                    ngayCanHang={dn.ngayCanHang}
                    soDongDaNhanDu={tomTat.soDongDaNhanDu}
                    tongSoDong={tomTat.tongSoDong}
                    soDongDaPhanBo={tienDo.filter((d) => d.trangThaiDong !== "chua_phan_bo").length}
                    soDongDaLenPO={tienDo.filter((d) => d.maPOLienQuan.length > 0).length}
                  />

                  <Link
                    href={`/theo-doi/${dn.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Xem chi tiết từng mặt hàng →
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

/**
 * Một dòng cho biết Phòng Thu mua đã phân công người phụ trách chưa.
 *
 * 🔴 THAY CHO "ĐÃ TIẾP NHẬN" — Ban lãnh đạo 12/08/2026 bỏ hẳn bước bấm "Nhận công tác"
 * (*"Trưởng phòng giao việc thì chắc chắn phải làm nên không cần bước bấm xác nhận này"*).
 *
 * Dựa vào PHÂN BỔ thay vì một cái nút xác nhận là thông tin **đúng hơn**: nó phản ánh việc
 * đã có người thật đang làm, chứ không phải ai đó đã bấm một nút. Người đề nghị vẫn có đúng
 * câu trả lời họ cần — *"đã ai lo việc này chưa"* — mà không phải chờ thêm một thao tác.
 *
 * 🔴 Tách thành component vì màn danh sách và màn chi tiết đều dùng — chép hai lần thì sửa
 * một chỗ là chỗ kia lệch, mà đây là câu trả lời cho đúng thứ người đề nghị muốn biết nhất.
 */
export function DongPhanCong({
  deNghi,
  /** Vai trò được xem tên nhân viên thu mua hay không. */
  hienTen,
}: {
  deNghi: DeNghiMuaHang;
  hienTen: boolean;
}) {
  const nguoiPhuTrach = [
    ...new Set(
      deNghi.items.map((d) => d.nguoiPhuTrachTen).filter((x): x is string => Boolean(x)),
    ),
  ];
  const soDaPhan = deNghi.items.filter((d) => d.nguoiPhuTrachUid).length;

  if (soDaPhan === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad) text-sm text-text-secondary">
        <Clock className="size-4 shrink-0 text-warning-soft" aria-hidden />
        <span>
          <strong>Chờ Phòng Thu mua phân công.</strong> Khi có người nhận phần việc, dòng này sẽ
          tự đổi — không cần gọi hỏi.
        </span>
      </p>
    );
  }

  const xong = soDaPhan === deNghi.items.length;
  return (
    <p
      className={`flex items-center gap-2 rounded-lg border p-(--hp-md-row-pad) text-sm text-text-secondary ${
        xong ? "border-success bg-success-bg" : "border-warning bg-warning-bg"
      }`}
    >
      <UserCheck
        className={`size-4 shrink-0 ${xong ? "text-success-soft" : "text-warning-soft"}`}
        aria-hidden
      />
      <span>
        <strong>
          Phòng Thu mua đã phân công {soDaPhan}/{deNghi.items.length} mặt hàng
        </strong>
        {/* 🔒 Giấu TÊN người phụ trách với vai trò không được xem (Phòng Thi công). Họ chỉ
            cần biết đã có người lo, không cần biết nhân sự nội bộ phòng thu mua. */}
        {hienTen && nguoiPhuTrach.length > 0 ? ` — ${nguoiPhuTrach.join(", ")}` : ""}
      </span>
    </p>
  );
}
