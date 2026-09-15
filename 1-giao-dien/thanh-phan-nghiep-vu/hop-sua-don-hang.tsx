"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import type { DonDatHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * ★★★ NÚT "SỬA ĐƠN HÀNG" — nay là một ĐƯỜNG DẪN sang màn lập đơn, không còn là hộp thoại.
 *
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🔴 CHỈ ĐẠO SẾP 15/09/2026 — LẦN THỨ HAI CỦA CÙNG MỘT YÊU CẦU
 *
 * Sếp mở hộp *"Sửa đơn hàng DMH260008"* trên bản thật, khoanh đỏ toàn bộ hộp và ghi nguyên văn:
 *
 *     *"mục sửa đơn sao còn giao diện này — A đã nói e cho sửa tại giao diện lập PO rồi mà"*
 *
 * Chữ *"đã nói… rồi mà"* là chỉ đạo LẶP LẠI. Lần đầu là 13/09/2026, cũng nguyên văn:
 *
 *     *"làm đầy đủ, không làm bản rút gọn"*
 *
 * Lần đó việc đã **DỪNG GIỮA CHỪNG CÓ CHỦ Ý** và báo cáo, với lý do đo được: cửa ghi `suaDonHang`
 * chỉ nhận đúng kiểu `ThayDoiDonHang` (`3-du-lieu/kho-du-lieu.tsx`), nên bày form lập đơn đầy đủ
 * ra mà không xử lý gì thì cả loạt ô bấm Lưu xong sẽ **im lặng mất thay đổi** — đúng điều
 * CLAUDE.md §3.5 cấm. Ghi lại đây để người sau biết đây là lần thứ hai, và biết cái kẹt thật sự
 * nằm ở đâu.
 *
 * ✅ 15/09/2026 ĐÃ LÀM: `form-lap-don-mua-hang.tsx` có thêm **chế độ sửa** (prop `poDangSua`),
 * ô nào cửa ghi nhận thì sửa được thật, ô nào không nhận thì **khoá + nói rõ lý do** thay vì nhận
 * rồi bỏ đi. Khoá lại KHÔNG mất gì so với hộp thoại cũ — hộp đó cũng chưa bao giờ sửa được chúng.
 *
 * 🔴 ĐÚNG CÁCH ĐÃ CHỐT TỪ TRƯỚC: bản cũ của chính tệp này đã dặn *"ĐỪNG CHÉP TỆP NÀY RA BẢN THỨ
 * HAI khi làm tiếp. Cách an toàn đã chốt là thêm CHẾ ĐỘ SỬA cho chính `form-lap-don-mua-hang.tsx`
 * (prop `poDangSua?`), giữ nguyên đường lập đơn mới"*. Đã làm đúng như vậy — một form, một chỗ.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 *
 * 🔴 TOÀN BỘ LUẬT SỬA ĐƠN KHÔNG MẤT MỘT CÁI NÀO, chỉ ĐỔI CHỖ. Bảng tra cho người sau:
 *
 *   | Luật                                            | Nay nằm ở đâu |
 *   |---|---|
 *   | Quyền: `suaPODaChot` HOẶC người phụ trách đơn    | `duocSuaDon` trong form + cổng gác đầu form; tầng ghi kiểm lại |
 *   | Đơn `hoan_thanh`/`huy` thì không sửa             | Nút này ẩn hẳn (dưới) + `EmptyState` ở trang; tầng ghi kiểm lại |
 *   | Bắt buộc ghi lý do (3 ca)                        | `batBuocLyDoSua` + ô "Lý do sửa đơn" trong form |
 *   | Khoá dòng đã có phiếu nhận                       | `dongDaNhanCuaPO` / `chanSuaDongDaNhan` trong form |
 *   | Giữ `thueSuatGTGT` cũ của từng dòng              | Cột "% Thuế GTGT" của bảng Hàng tiền, nạp sẵn từ chứng từ giá |
 *   | Dọn giá của dòng đã xoá                          | Không còn cần: giá đi liền theo dòng trong bảng, xoá dòng là mất luôn |
 *   | Đơn có `prId` thì không thêm dòng mới            | `themDong` / `chenDongDuoi` / `conMatHangDeThem` trong form |
 *   | Cảnh báo đơn đã gửi sang QLK CTR                 | Dải thông báo đầu form (`qlkCtrSyncStatus === "synced"`) |
 *   | `MA_KHONG_CO_THAY_DOI`                           | **Import từ tầng ghi**, dùng trong `luuSua()` của form |
 *   | Nhóm 3 (mã PO · mã dự án · đề nghị nguồn · trạng thái) không sửa được | Bốn ô chỉ đọc trong form |
 *
 * 📌 GIỮ TÊN `HopSuaDonHang` và giữ nguyên tệp này: `trang/don-hang-chi-tiet.tsx` đang gọi nó, và
 * hai điều kiện ẩn nút (quyền · trạng thái) vẫn cần một chỗ duy nhất. Đổi tên là đụng thêm một
 * tệp nữa mà không được gì.
 */
export function HopSuaDonHang({ po }: { po: DonDatHang }) {
  const { nguoiDung, quyen } = useNguoiDung();

  /* Luật quyền GIỮ NGUYÊN của bản hộp thoại (Sếp 31/08/2026): Trưởng bộ phận/quản trị, HOẶC
     người phụ trách chính đơn này. Form cũng kiểm lại, và tầng ghi kiểm lần cuối. */
  const duocSua = quyen.suaPODaChot || po.nguoiPhuTrachUid === nguoiDung.uid;
  if (!duocSua) return null;
  /* Đơn đã hoàn thành hoặc đã huỷ thì không sửa lại được nữa — ẩn nút thay vì dẫn người dùng
     sang một màn chỉ để báo "không sửa được". */
  if (po.trangThai === "hoan_thanh" || po.trangThai === "huy") return null;

  return (
    <Button
      size="sm"
      variant="outline"
      nativeButton={false}
      /* 🔴 ĐIỀU HƯỚNG TRONG APP (`Link`), KHÔNG mở tab mới: người sửa cần quay lại trang chi tiết
         đơn ngay sau khi lưu, và `onDaSua` ở trang kia làm đúng việc đó. */
      render={<Link href={`/don-hang/tao-moi?suaPoId=${encodeURIComponent(po.id)}`} />}
    >
      <Pencil className="size-4" aria-hidden />
      Sửa đơn hàng
    </Button>
  );
}
