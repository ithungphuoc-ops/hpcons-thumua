"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronDown,
  Plus,
  Trash2,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  FileWarning,
  Keyboard,
  Printer,
  RotateCcw,
  Save,
  ShoppingCart,
  Split,
} from "lucide-react";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { BadgeChoDeNghi } from "@/1-giao-dien/thanh-phan-nghiep-vu/badge-cho-de-nghi";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/1-giao-dien/nen-tang-ui/popover";
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";
import { KhoiDieuKhoanTachDong } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-dieu-khoan-tach-dong";
import {
  BangHangTien,
  type ConLaiDeNghi,
  type DongNhapDonHang,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/bang-hang-tien";
import { NutHuongDanGiaiDoan } from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-huong-dan-giai-doan";
import {
  HopXemTruocNhapExcel,
  type DuLieuXemTruocExcel,
} from "@/1-giao-dien/thanh-phan-nghiep-vu/hop-xem-truoc-nhap-excel";
import { NhanPhanTrongGiaiDoan } from "@/1-giao-dien/thanh-phan-nghiep-vu/khoi-dau-vao-theo-giai-doan";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import type { MoTaTep } from "@/3-du-lieu/kho-tep";
import { NHAN_MAU_PO } from "@/3-du-lieu/kieu-du-lieu";
import {
  CAM_KET_THOA_THUAN_CHUAN,
  conDieuKhoanRiengThoaThuan,
  dieuKhoanGiaoHangChuanTheoMau,
  ghiChuHopDongTuMa,
} from "@/3-du-lieu/dieu-khoan-chuan-don-mua-hang";
import type {
  DeNghiMuaHang,
  DongPO,
  KieuChietKhau,
  MauDonMuaHang,
  NhaCungCap,
  TienDoDongDeNghi,
} from "@/3-du-lieu/kieu-du-lieu";
import { useDanhBa } from "@/4-phan-quyen/dung-danh-ba";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  moTaThueSuat,
  tinhTienChiTiet,
  tinhTienDoDeNghi,
  type DongDeTinhTien,
} from "@/2-quy-trinh/tinh-toan";
import { dongLapDuocDonHang, vuongMacLapDonHang } from "@/2-quy-trinh/giai-doan-mua-hang";
import { NHAN_TRANG_THAI_PO } from "@/2-quy-trinh/trang-thai";
import { docDonHangTuExcel, docNgayVN, khopVoiDeNghi } from "@/2-quy-trinh/doc-don-hang-excel";
import { taoFileNhapDonHang, tenFileNhapDonHang } from "@/2-quy-trinh/ghi-don-hang-excel";
import {
  dongTuDoDuVaoDon,
  dungDonHangMau,
  tenFileDonHangMau,
  SO_DON_BAN_MAU,
} from "@/2-quy-trinh/don-hang-mau";
/* Khuôn số đơn hàng — dùng CHUNG với chỗ cấp số thật, không viết lại chuỗi "DMH" ở đây. */
import { namCuaNgay, TIEN_TO_DON_HANG } from "@/2-quy-trinh/dat-ma-don-hang";
import { vuongMacXuatPO } from "@/2-quy-trinh/xuat-don-hang-excel";
import { catBanMauDonMuaHang } from "@/3-du-lieu/ban-mau-don-mua-hang";
import { docSoTien } from "@/6-tien-ich/doc-so-tien";
import { boDau } from "@/6-tien-ich/bo-dau";

/**
 * FORM LẬP ĐƠN MUA HÀNG — TOÀN BỘ phần nhập liệu của bước ④, dùng chung cho HAI CHỖ.
 *
 * 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 17/08/2026: *"a cần phần nhập liệu phải nằm trong khối, chỉ ai được
 * cấp quyền thì mới xem được phần nhập liệu đó"*.
 *
 * VÌ SAO TRƯỚC ĐÓ LÀM SAI CHỖ — ghi lại để đời sau không lặp lại: Ban lãnh đạo yêu cầu bước
 * "Lập đơn mua hàng" có chức năng giống màn **Đơn mua hàng của MISA**. MISA mở màn đó thành
 * MỘT CỬA SỔ RIÊNG, nên bản trước làm thành một TRANG RIÊNG (`/don-hang/tao-moi`), còn ở khối
 * bước ④ chỉ để đúng MỘT CÁI NÚT dẫn sang. Ban lãnh đạo hỏi SÁU LƯỢT *"mục giao diện giống
 * misa đâu"* / *"vẫn chưa thấy chức năng nhập liệu"* / *"mục này vẫn chưa có phần import"* —
 * vì đứng ở khối bước ④ thì không thấy phần nhập liệu, chỉ thấy một cái nút. Đã kiểm quyền
 * (`chucNang=truong_bo_phan_thu_mua`, `capTM=4`), nút đã bật, trang trả HTTP 200: KHÔNG PHẢI
 * lỗi quyền, mà là **đặt sai chỗ**. Bố cục mẫu (Base) đặt phần nhập liệu NGAY TRONG khối của
 * bước, nên nay form nằm trong khối.
 *
 * 🔴 MỘT FORM, MỘT CHỖ. Tuyệt đối không chép ruột ra hai bản cho hai bố cục — hai bản chép tay
 * sẽ lệch nhau sau vài lần sửa (lỗi dự án đã dính). Trang riêng `/don-hang/tao-moi` giờ chỉ là
 * cái vỏ mỏng đọc tham số địa chỉ rồi gọi đúng component này.
 *
 * ---
 *
 * Bố cục bám màn "Đơn mua hàng" của MISA, giữ đúng thứ tự và cách nhóm ô:
 *
 *   ① Khối thông tin chung 3 cột + "Tổng tiền thanh toán" cỡ lớn ở góc trên phải + Tham chiếu
 *   ② Bảng "Hàng tiền" (có dòng TỔNG CỘNG) + [Thêm dòng] [Thêm ghi chú] [Xóa hết dòng]
 *   ③ Khối dưới trái: Mã RQ - Tên công trình · Hợp đồng - Ngày hợp đồng · Địa điểm giao hàng ·
 *      Điều khoản khác · Đính kèm
 *   ④ Khối dưới phải: Tổng tiền hàng · Tiền chiết khấu · Thuế GTGT · Tổng tiền thanh toán
 *   ⑤ Thanh nút: [Hủy] bên trái — [Lưu] [Lưu và In] bên phải
 *      🔴 NHÃN LÀ "Lưu" / "Lưu và In", KHÔNG phải "Cất" (Ban lãnh đạo đổi ngày 18/08/2026).
 *      Ảnh MISA ghi "Cất"; đừng đổi lại theo ảnh. Các chú thích cũ trong file này từng viết
 *      "[Cất] [Cất và In]" — đã sửa hết, nếu còn sót chỗ nào thì mã nguồn mới là căn cứ.
 *
 * 🔴 BỐN ĐIỂM CỐ Ý KHÁC MISA — không được "sửa lại cho giống":
 *
 *  1. **Màu sắc theo HPCons Design System V1.1**, không lấy tông xanh ngọc của MISA. Ban lãnh
 *     đạo 17/08/2026: *"Về màu sắc thì vẫn theo design system"*. Primary `#096AA7`, mọi màu đi
 *     qua token, không viết cứng mã màu và không dùng inline style.
 *  2. **Số đơn hàng giữ `260001-HPCS-PO-001`**, không lấy kiểu `DMH0532-26`. Mã hồ sơ bám
 *     Thông báo 09/2026/TB-HPCS (TGĐ ký 11/07/2026), MISA không phải căn cứ.
 *  3. **Cột tiền chỉ hiện với người có `quyen.xemGia`.** Bảng vẫn dựng đủ dòng hàng cho người
 *     không có quyền, chỉ mất mấy cột tiền và khối tổng.
 *  4. **Mỗi dòng hàng BẮT BUỘC nối về một dòng của phiếu đề nghị đã được phân bổ.** MISA cho
 *     gõ tự do mặt hàng bất kỳ; ở đây không được, vì khối lượng đặt phải trừ vào một dòng đề
 *     nghị đã duyệt — đặt ngoài đề nghị là mua hàng không ai duyệt. Vì vậy [Thêm dòng] mở hộp
 *     chọn mặt hàng của đề nghị thay vì chèn một dòng trắng.
 *     ⚠️ Điểm 4 này **chỉ còn đúng ở CHẾ ĐỘ CÓ ĐỀ NGHỊ** — xem khối ngay dưới.
 *
 * 📌 Phân trang "20 bản ghi trên 1 trang" của MISA: ĐÃ LÀM THẬT (18/08/2026) — chọn 20/50/100,
 *    nút Trước · Sau đổi trang thật, cột `#` giữ số thứ tự thật của cả bảng. Chú thích ở đây từng
 *    ghi *"ĐÃ BỎ phân trang"*, đúng lúc viết nhưng SAI từ 18/08/2026; xem `BangHangTien`.
 *
 * ---
 *
 * ★★ HAI CHẾ ĐỘ, MỘT FORM — CHỈ ĐẠO BAN LÃNH ĐẠO 18/08/2026 ★★
 *
 * *"MUC NAY SE LA MODUL RIENG, KHONG LIEN QUAN GI TOI QUY TRINH, NO CHI DE PHUC VU LAP DON
 * DAT HANG, NEN E KO CAN LINK NO TOI CAC BUOC QUY TRINH. va e hay hien thi cac truong nhap
 * lieu cua modun nay luon"*.
 *
 * ⚠️ BẢNG DƯỚI GIỮ NGUYÊN Ý GỐC 18/08/2026 — với cột ĐỘC LẬP, đọc đúng cho người KHÔNG có
 * `quyen.taoPoDoiLap` (đa số — nhân viên thường). Người CÓ quyền đó (Trưởng bộ phận trở lên)
 * thì cột ĐỘC LẬP đổi khác ở đúng 4 dòng đánh dấu (✳️) — xem khối "29/08/2026" ngay dưới bảng.
 *
 * | | Có đề nghị (`deNghi` khác `null`) | ĐỘC LẬP, KHÔNG có `quyen.taoPoDoiLap` |
 * |---|---|---|
 * | Vào từ | `?prId=…` (thẻ bảng quy trình, nút ở khối bước ④) và `?prId=…&rfqId=…&nccId=…` (tách PO từ bảng báo giá) | Mục menu **Lập đơn mua hàng (PO)**, địa chỉ trơn `/don-hang/tao-moi` |
 * | Mã dự án | Lấy từ phiếu đề nghị | Người lập **chọn dự án đã có** hoặc gõ mã mới |
 * | [Thêm dòng] | Mở hộp chọn mặt hàng của đề nghị | Chèn **một dòng trắng** gõ tay |
 * | Nhập Excel | Đối chiếu với đề nghị (`khopVoiDeNghi`) | Lấy thẳng mọi dòng đọc được |
 * | Khối lượng | Trừ vào dòng đề nghị, cắt về phần còn lại | Không trừ vào đâu |
 * | Chốt `vuongMacLapDonHang` | **Có** — bảng báo giá phải đã chốt NCC | 🔴 **KHÔNG ÁP DỤNG** — không cất đơn nên không có gì để chặn |
 * | ✳️ Thanh nút cuối | **[Lưu]** · **[Lưu và In]** (nhãn Ban lãnh đạo chốt 18/08/2026, KHÔNG phải "Cất") | 🔴 **[In mẫu PO]** · **[Xuất Excel]** — KHÔNG có nút lưu |
 * | ✳️ Ghi vào hệ thống | Có, qua `themDonHang` | 🔴 **KHÔNG GHI GÌ CẢ** |
 * | ✳️ Số đơn hàng | `themDonHang` cấp lúc cất, theo Thông báo 09/2026 | Không cấp — in ra `SO_DON_BAN_MAU` |
 * | ✳️ Ô "Tình trạng" | Có, chỉ đọc, luôn `da_chot` | 🔴 **Ẩn hẳn** — bản mẫu không ở trạng thái nào |
 * | Đính kèm tệp | Có — vào `DonDatHang.tepDinhKem` của đơn được cất | 🔴 **Ẩn hẳn, nói rõ lý do** — không có đơn nào để gắn tệp, xem khối ③ |
 * | Nhật ký | `DeNghiMuaHang.lichSu` | Không có gì để ghi nhật ký |
 *
 * 🔴 ĐƯỜNG CÓ ĐỀ NGHỊ KHÔNG ĐƯỢC ĐỔI MỘT LY. Đó là chức năng **tách PO theo phân bổ báo giá**
 * — thứ mà module độc lập không làm được. Mọi nhánh mới ở dưới đều gác bằng `laDonDocLap`.
 *
 * ---
 *
 * ★★ CHIỀU 18/08/2026: CHẾ ĐỘ ĐỘC LẬP **KHÔNG CẤT ĐƠN NỮA** ★★
 *
 * Chỉ đạo Ban lãnh đạo: *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*.
 *
 * BỐI CẢNH — vì sao đổi: sáng cùng ngày chế độ độc lập có cất đơn thật, và tôi đã báo lên một
 * rủi ro: chế độ đó không có bảng báo giá nên **ĐI VÒNG QUA CHỐT KIỂM SOÁT CHI TIÊU**
 * (`vuongMacLapDonHang` đòi bảng báo giá đã chốt nhà cung cấp mới cắt được đơn) — tức là sinh
 * ra một cam kết trả tiền cho nhà cung cấp mà không qua bước ③ Xét duyệt báo giá, đúng lỗ hổng
 * chỉ đạo 15/08/2026 sinh ra để vá. Ban lãnh đạo trả lời: chỉ cần tạo mẫu, chưa cần lưu.
 *
 * ✅ KHÔNG LƯU THÌ KHÔNG CÓ ĐƠN TRONG DỮ LIỆU → KHÔNG ĐI VÒNG QUA CHỐT NÀO.
 *
 * 🔴 VÌ VẬY: chế độ độc lập **tuyệt đối không được gọi `themDonHang`**. Hai nút cuối form là
 *    [In mẫu PO] và [Xuất Excel], cả hai chỉ dựng một đơn TẠM trong bộ nhớ
 *    (`2-quy-trinh/don-hang-mau.ts` → `dungDonHangMau`) rồi in / xuất file. Đừng "cải tiến"
 *    thành đường cất đơn tắt: làm vậy là mở lại đúng lỗ hổng vừa đóng.
 *
 * 🔴 NHƯNG BỎ NÚT KHÔNG PHẢI LÀ CHẶN — `themDonHang` ĐÃ SIẾT LẠI Ở TẦNG DỮ LIỆU. Nay hàm đó
 *    **từ chối cất đơn thiếu `prId`**, không còn nhánh "bỏ qua chốt cho đơn độc lập" như bản
 *    sáng 18/08/2026. Hai lý do phải chặn ở đó chứ không chỉ ở đây:
 *     · Form không phải cửa duy nhất vào hàm ghi dữ liệu (đúng nguyên tắc ghi ở `themDonHang`:
 *       *"khóa nút chỉ che một đường trong ba"*).
 *     · Có một đường đua thật: hộp xác nhận Cất vẽ NGOÀI nhánh `laDonDocLap`, nên nếu phiếu đề
 *       nghị biến mất khỏi kho chung đúng lúc hộp đang mở thì `dn` thành `null` mà `luu()` vẫn
 *       chạy — trước khi siết, lần bấm đó cất ra một đơn không qua xét duyệt giá.
 *    Hàm `luu()` bên dưới vì vậy **không cần sửa**, và cũng không được nới: chốt nằm ở kho dữ
 *    liệu, một chỗ duy nhất.
 *
 * ---
 *
 * ★★★ 29/08/2026 — MỞ LẠI CÓ KIỂM SOÁT, KHÔNG PHẢI QUAY VỀ BẢN SÁNG 18/08 ★★★
 *
 * Sếp chốt sau khi bàn qua demo trực quan (Artifact "Ngã Rẽ Lập PO"): PO độc lập ĐƯỢC cất
 * thật, NHƯNG chỉ cho Trưởng bộ phận trở lên (`quyen.taoPoDoiLap`, xem `4-phan-quyen/quyen.ts`)
 * và cất ra ở trạng thái `"cho_de_nghi"` — KHÔNG phải `"da_chot"` như bản sáng 18/08. Khác biệt
 * mấu chốt với lỗ hổng đã đóng:
 *   · Bản sáng 18/08: cất thẳng `"da_chot"`, coi như PO hoàn chỉnh ngay, KHÔNG ai kiểm được nữa.
 *   · Bản 29/08: cất ra `"cho_de_nghi"` — vẫn CHƯA qua `vuongMacLapDonHang` lúc này (đúng, vì
 *     chưa có gì để đối chiếu), nhưng BẮT BUỘC phải gắn đúng 1 đề nghị đã duyệt + có bảng báo
 *     giá chốt NCC (nút "+ Gắn đề nghị", xem `1-giao-dien/thanh-phan-nghiep-vu/hop-gan-de-nghi.tsx`)
 *     — nơi CHẠY LẠI đúng `vuongMacLapDonHang` — mới chuyển được sang `"da_chot"`. Không có
 *     đường nào ở lại `"cho_de_nghi"` vĩnh viễn mà vẫn được coi là PO hoàn chỉnh.
 *
 * Vậy: `themDonHang` KHÔNG còn "từ chối tuyệt đối thiếu `prId`" như đoạn trên mô tả — xem chú
 * thích MỚI ngay tại chỗ chặn đó trong `3-du-lieu/kho-du-lieu.tsx` để biết luật thay thế chính
 * xác. Hàm `luu()` bên dưới VẪN không cần sửa gì (nó vốn đã truyền `prId: dn?.id` là
 * `undefined` cho cả hai chế độ) — chỉ có ĐIỀU KIỆN VẼ NÚT ở khối cuối form là đổi, xem đó.
 *
 * PO "chờ đề nghị" hoạt động GẦN NHƯ BÌNH THƯỜNG (Sếp chốt): in được, tính vào Công nợ nhà cung
 * cấp ngay — chỉ khác 1 badge tím riêng (`BadgeChoDeNghi`) và KHÔNG hiện trên bảng "Quy trình
 * mua hàng" (bảng đó liệt kê theo đề nghị, PO này chưa có đề nghị nào để liệt) cho tới khi gắn
 * xong — vẫn hiện bình thường ở "Danh sách đơn hàng".
 */
export interface PropFormLapDonMuaHang {
  /**
   * Phiếu đề nghị nguồn — **TRUYỀN VÀO**, form KHÔNG tự đọc `useSearchParams`.
   *
   * 🔴 Đây là điều kiện để nhúng được vào khối bước ④: `useSearchParams` bắt buộc nằm trong
   * `<Suspense>`, mà trang chi tiết đề nghị không có `Suspense` nào và là trang tĩnh
   * (`generateStaticParams`) — form tự đọc tham số địa chỉ là `next build` dừng ngay với lỗi
   * "missing-suspense-with-csr-bailout".
   *
   * 🔴 TỪ 18/08/2026 LÀ TÙY CHỌN. Bỏ trống (hoặc `null`) = **chế độ độc lập**: đơn không gắn
   * đề nghị nào. Xem bảng hai chế độ ở khối chú thích đầu file trước khi sửa bất cứ gì.
   */
  deNghi?: DeNghiMuaHang | null;
  /**
   * ★ ĐỊA CHỈ CÓ `prId` NHƯNG TRA KHÔNG RA ĐỀ NGHỊ — thêm 29/08/2026 (CodeRabbit review PR "PO
   * chờ đề nghị"). `true` khi trang gọi vào đây vì một liên kết CŨ/HỎNG (`prId` không tồn tại
   * hoặc hồ sơ đã xóa), KHÁC với việc người dùng chủ ý vào thẳng menu để lập PO độc lập.
   *
   * 🔴 VÌ SAO CẦN CỜ RIÊNG, KHÔNG SUY TỪ `deNghi === null`: cả hai trường hợp đều truyền
   * `deNghi={null}` (không tra ra thì cũng là `null`) — nếu không tách, một người có
   * `quyen.taoPoDoiLap` bấm nhầm một liên kết cũ sẽ cất được một PO ĐỘC LẬP THẬT mà không hề
   * định làm vậy (họ đang tìm ĐÚNG phiếu đề nghị kia, không phải muốn tạo PO tay). `true` ⇒ khoá
   * về đúng chế độ mẫu-thôi (không cất thật) bất kể `quyen.taoPoDoiLap`, và câu cảnh báo ở trang
   * gọi (`don-hang-lap-moi.tsx`) đã nói rõ lý do + hướng đi đúng.
   */
  duongDanHongPrId?: boolean;
  /** Bảng báo giá nguồn khi TÁCH ĐƠN — chỉ trang riêng truyền (đường vào từ màn Báo giá). */
  rfqId?: string | null;
  /** Nhà cung cấp được phân bổ trong bảng báo giá đó. Đi CẶP với `rfqId`, thiếu một là bỏ qua. */
  nccIdTuBaoGia?: string | null;
  /**
   * `true` = form đang nằm TRONG khối bước ④ của trang chi tiết đề nghị.
   *
   * Đổi đúng bốn thứ, không đổi nghiệp vụ: cỡ chữ tiêu đề (khối cha chỉ 11px nên tiêu đề con
   * không được to hơn — lỗi Ban lãnh đạo đã khoanh đỏ 16/08/2026) · khoảng cách giữa các khối ·
   * chỗ đặt hai nút Excel · và không chiếm cả khối bằng `EmptyState` khi thiếu quyền.
   */
  nhung?: boolean;
  /**
   * Đã cất xong một đơn — mỗi nơi tự quyết định làm gì tiếp.
   *
   * `rangIn` = người dùng bấm "Cất và In". Trang riêng thì điều hướng sang đơn vừa cất (hoặc
   * bản in); khối nhúng thì ĐỨNG YÊN tại trang chi tiết, chỉ mở trang in khi `rangIn`.
   */
  onDaLuu?: (poId: string, rangIn: boolean) => void;
  /** Nút [Hủy]. Không truyền thì KHÔNG vẽ nút — nhúng trong trang thì "hủy" đi đâu là vô nghĩa. */
  onHuy?: () => void;
}

/* ★ `dongTuDoDuVaoDon` — luật "dòng gõ tự do đã đủ để vào đơn chưa" — ĐÃ CHUYỂN sang
   `2-quy-trinh/don-hang-mau.ts` (chiều 18/08/2026).

   🔴 VÌ SAO CHUYỂN: đó là luật nghiệp vụ, và quy tắc 3.4b của dự án cấm để hàm nghiệp vụ trong
   file giao diện. Nay module dựng bản mẫu (`dungDonHangMau`) cũng phải dùng đúng luật đó; để nó
   ở đây thì `2-quy-trinh/` phải import ngược lên `1-giao-dien/`, hoặc tệ hơn là chép tay bản
   thứ hai rồi hai bản lệch nhau.

   Vẫn là MỘT bản duy nhất — ba nơi dùng đều import về: điều kiện `hopLe`, khối tính tiền `tien`,
   và `dungDonHangMau`. (`luu()` cũng gọi, nhưng nhánh đó nay không còn đường tới.) */

export function FormLapDonMuaHang({
  deNghi: dn = null,
  duongDanHongPrId = false,
  rfqId,
  nccIdTuBaoGia,
  nhung = false,
  onDaLuu,
  onHuy,
}: PropFormLapDonMuaHang) {
  const {
    deNghi: dsDeNghi,
    donHang,
    /* Chứng từ giá nằm RIÊNG (`tm_donhang_gia`) theo nguyên tắc dữ liệu số 3 của dự án — điều
       khoản thanh toán và số ngày được nợ là điều kiện thương mại, không để lẫn vào `tm_donhang`.
       Ở đây chỉ đọc để điền sẵn khi tách thêm đơn, và chỉ khi vai trò được xem giá. */
    giaDonHang,
    baoGia,
    phieuNhan,
    nhaCungCap,
    themDonHang,
    themNhaCungCap,
    xoaNhaCungCap,
    /* ★ Danh mục thủ kho công trình (22/08/2026) — người ở công trường phần lớn chưa có tài
       khoản nên không có trong danh bạ nhân sự. */
    thuKho,
    themThuKho,
    xoaThuKho,
  } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  /* Danh bạ nhân sự — dùng để chọn nhanh thủ kho ở ô "Người nhận hàng". */
  const danhBa = useDanhBa();

  /**
   * ★ CỜ CHIA HAI CHẾ ĐỘ — mọi nhánh mới ngày 18/08/2026 đều gác bằng cờ này.
   *
   * 🔴 SUY TỪ `dn`, KHÔNG nhận thêm một prop `docLap` riêng: hai nguồn sự thật cho cùng một
   * việc thì sớm muộn có chỗ truyền `docLap` mà vẫn kèm `deNghi`, rồi form chạy nửa nọ nửa kia.
   */
  const laDonDocLap = dn === null;
  /**
   * ★ QUYỀN LẬP PO ĐỘC LẬP THẬT SỰ ĐƯỢC DÙNG Ở ĐÂY — thêm 29/08/2026 cùng `duongDanHongPrId`.
   * KHÁC `quyen.taoPoDoiLap` trần: liên kết cũ/hỏng (`duongDanHongPrId`) khoá về mẫu-thôi bất kể
   * có quyền hay không — xem chú thích đầy đủ ở `PropFormLapDonMuaHang.duongDanHongPrId`.
   */
  const coQuyenTaoDocLapThat = quyen.taoPoDoiLap && !duongDanHongPrId;

  // ---------------------------------------------------------------------------
  // ① KHỐI THÔNG TIN CHUNG — đúng thứ tự ô của màn MISA
  // ---------------------------------------------------------------------------
  // Cột 1
  const [maNCC, setMaNCC] = useState("");
  const [mstNCC, setMstNCC] = useState("");
  // Cột 2
  /**
   * NHÀ CUNG CẤP CỦA ĐƠN — lấy từ file PO, không bắt chọn từ danh mục.
   *
   * 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 10/08/2026: *"mục này tên NCC sẽ lấy từ PO, nên hãy bỏ khu vực
   * này đi, và bám sát vào file PO"*. Trước đây bắt chọn từ 4 nhà cung cấp cứng trong dữ liệu
   * chạy thử, nên file PO thật ghi một nhà cung cấp ngoài danh sách thì người lập phải chọn
   * bừa — tức đơn hàng sai đối tượng.
   */
  const [tenNCC, setTenNCC] = useState("");
  const [diaChiNCC, setDiaChiNCC] = useState("");
  const [dieuKhoanThanhToan, setDieuKhoanThanhToan] = useState("");
  const [soNgayDuocNo, setSoNgayDuocNo] = useState("");
  // Cột 3
  /**
   * ★ LOẠI TIỀN — trường "Loại tiền: VND" trên biểu mẫu công ty (`PO - DEMO 130826.xlsx`, ô K8).
   *
   * 🔴 Ban lãnh đạo 23/08/2026: *"đủ các trường thông tin như vậy"*. Trước đây app **ghi cứng
   * "VND"** lúc cất đơn, tờ in vẫn in ra đúng — nhưng người lập không có chỗ nào đổi. Đơn mua
   * hàng nhập khẩu (thép, thiết bị) trả bằng USD thì chứng từ in ra sai đơn vị tiền, mà không ai
   * sửa được từ giao diện.
   */
  const [loaiTien, setLoaiTien] = useState("VND");
  const [ngayDonHang, setNgayDonHang] = useState(() => new Date().toISOString().slice(0, 10));
  const [ngayGiao, setNgayGiao] = useState("");
  /** Ngày KẾT THÚC của khoảng nhận hàng (Ban lãnh đạo 27/08/2026) — tùy chọn, xem ô nhập. */
  const [ngayGiaoDen, setNgayGiaoDen] = useState("");
  /**
   * Ghi chú thêm về thời gian giao (Ban lãnh đạo 27/08/2026) — in kèm dòng "Ngày giao hàng".
   * Chỗ cho những điều kiện khoảng ngày không nói được: giao buổi sáng, gọi trước 1 ngày…
   */
  const [ghiChuThoiGianGiao, setGhiChuThoiGianGiao] = useState("");
  // Dòng cuối khối
  const [thamChieu, setThamChieu] = useState("");
  /** `supplierId` chỉ có khi tra ra trong danh mục — không tra ra vẫn lập được đơn. */
  const [supplierId, setSupplierId] = useState<string>("");

  // ---------------------------------------------------------------------------
  // ② BẢNG "HÀNG TIỀN"
  // ---------------------------------------------------------------------------
  const [dongBang, setDongBang] = useState<DongNhapDonHang[]>([]);
  /**
   * Bộ đếm sinh khóa dòng. KHÔNG dùng `crypto.randomUUID()`: nó chỉ có trong ngữ cảnh bảo mật
   * (https / localhost) — mở bản dựng tĩnh bằng địa chỉ IP nội bộ là ném lỗi và cả bảng chết.
   */
  const boDemDong = useRef(0);
  const khoaDongMoi = useCallback(() => `d${++boDemDong.current}`, []);

  const [kieuChietKhau, setKieuChietKhau] = useState<KieuChietKhau>("khong");
  const [tyLeChietKhau, setTyLeChietKhau] = useState("");
  const [chietKhau, setChietKhau] = useState("");
  const [thueSuat, setThueSuat] = useState("8");

  // ---------------------------------------------------------------------------
  // ③ KHỐI DƯỚI TRÁI
  // ---------------------------------------------------------------------------
  const [tenCongTrinh, setTenCongTrinh] = useState("");
  /**
   * ★ MÃ DỰ ÁN GỐC — chỉ dùng ở CHẾ ĐỘ ĐỘC LẬP (18/08/2026).
   *
   * 🔴 VÌ SAO PHẢI CÓ: mã đơn `260001-HPCS-PO-001` lấy phần đầu từ mã dự án, mà mã dự án trước
   * nay luôn đến từ phiếu đề nghị. Đơn độc lập không có phiếu đề nghị nào, nên nếu không hỏi
   * thì mã đơn ra `-PO-001` — sai Thông báo 09/2026/TB-HPCS và không sửa lại được sau khi đơn
   * đã gửi nhà cung cấp. `themDonHang` từ chối cất khi ô này rỗng.
   *
   * 📌 CÁCH LẤY: chọn từ danh sách dự án ĐÃ CÓ trong hệ thống, hoặc gõ tay khi là dự án mới —
   * đúng cách màn "Nhận đề nghị mới" (`trang/de-nghi-nhan-moi.tsx`) đang làm. Dùng lại cách
   * quen thuộc thay vì bịa kiểu nhập mới, và **không tự đặt hệ mã**: mã dự án gốc là do công
   * ty cấp theo Thông báo 09/2026, app chỉ ghi lại.
   *
   * ⚠️ App CHƯA CÓ danh mục dự án riêng. Danh sách gợi ý được suy ra từ đề nghị và đơn hàng
   * đang có — nên dự án mới tinh bắt buộc phải gõ tay, và đó là lý do luôn có lựa chọn "nhập
   * tay". Khi HPcore mở danh mục dự án dùng chung thì thay nguồn ở `duAnDaCo`, giao diện giữ
   * nguyên.
   */
  const [maDuAnNhap, setMaDuAnNhap] = useState("");
  /** `""` chưa chọn · `"__moi__"` gõ tay · còn lại là mã dự án đã có. */
  const [duAnChon, setDuAnChon] = useState("");
  /**
   * ★ TÊN NHÂN VIÊN MUA HÀNG in trên tờ đơn — mở cho sửa 26/08/2026 (Ban lãnh đạo).
   *
   * 🔴 Khởi tạo bằng người đang lập, nhưng KHÔNG khóa: người lập đơn trong app không nhất thiết
   * là người đứng tên mua hàng trên chứng từ. Ghi vào `DonDatHang.nguoiPhuTrachTen`; mã
   * `nguoiPhuTrachUid` vẫn là người đang lập — xem chú thích tại ô nhập.
   */
  const [tenNhanVienMua, setTenNhanVienMua] = useState(nguoiDung.tenHienThi);

  /**
   * Ghi chú hợp đồng — chữ in nguyên văn sau *"Theo hợp đồng:"* trên tờ đơn mẫu PO-01.
   *
   * 🔴 Ban lãnh đạo 27/08/2026: *"Dòng theo hợp đồng sẽ nhập thủ công, e để sẵn ô để ghi chú"*.
   * Trước đó có thêm state `ngayHopDong` (ô chọn ngày) và tờ in tự ghép *"<số> · Ký ngày <ngày>"*.
   * Nay bỏ ô ngày: ngày ký nếu cần thì gõ thẳng vào ô này.
   *
   * ⚠️ Tên biến giữ nguyên `maHopDong` → trường `maHopDongCDT`, ĐỪNG ĐỔI TÊN. Trường đó được đọc
   * ở `5-ket-noi/gui-po-qlk-ctr.ts` — tệp thuộc vùng cấm sửa của phiên tích hợp (CLAUDE.md §6.6),
   * đổi tên là gãy typecheck ở chỗ mình không được phép sửa.
   */
  const [maHopDong, setMaHopDong] = useState("");
  const [diaDiemGiao, setDiaDiemGiao] = useState("");
  const [nguoiNhanHang, setNguoiNhanHang] = useState("");
  /** So dien thoai nguoi nhan hang — ô riêng trên biểu mẫu (21/08/2026). */
  const [sdtNguoiNhan, setSdtNguoiNhan] = useState("");
  /**
   * Mẫu in đơn mua hàng — Ban lãnh đạo 21/08/2026: *"có trường tuỳ chọn 1 trong 2 mẫu"*.
   * Mặc định `thoa_thuan`: phần lớn đơn lẻ không có hợp đồng nguyên tắc riêng.
   */
  const [mauPO, setMauPO] = useState<MauDonMuaHang>("thoa_thuan");
  const [dieuKhoanKhac, setDieuKhoanKhac] = useState("");
  /**
   * ★ Điều khoản in ở cuối tờ đơn — `null` nghĩa là CHƯA SỬA (dùng bản chuẩn của công ty).
   *
   * 🔴 Dùng `null` chứ không phải chuỗi rỗng làm giá trị khởi tạo: chuỗi rỗng đã mang nghĩa
   * "người lập cố ý bỏ khối điều khoản" (xem `DonDatHang.dieuKhoanGiaoHang`). Khởi tạo bằng `""`
   * là mọi đơn mới đều cất một bản điều khoản TRỐNG, và tờ in không còn dòng điều khoản nào.
   */
  const [dieuKhoanGiaoHang, setDieuKhoanGiaoHang] = useState<string | null>(null);
  const [camKetThoaThuan, setCamKetThoaThuan] = useState<string | null>(null);
  const [tepDinhKem, setTepDinhKem] = useState<MoTaTep[]>([]);

  // ---------------------------------------------------------------------------
  // Hộp thoại
  // ---------------------------------------------------------------------------
  const [dangDocFile, setDangDocFile] = useState(false);
  const [dangTaoFile, setDangTaoFile] = useState(false);
  /**
   * Đang dựng file Excel của BẢN MẪU (chế độ độc lập, 18/08/2026).
   *
   * 📌 Cờ riêng, không dùng chung `dangTaoFile`: `dangTaoFile` là của nút "Tải file mẫu" (biểu
   * mẫu CHƯA CÓ GIÁ để nhập lại vào app) — hai việc khác nhau, hai nút khác nhau. Dùng chung
   * thì bấm nút này lại thấy nút kia đổi chữ thành "Đang tạo file...".
   */
  const [dangXuatMau, setDangXuatMau] = useState(false);
  /**
   * Phần nhập liệu đang mở hay đã thu gọn — Ban lãnh đạo 17/08/2026: *"mục tự động nhập này
   * e tạo nút group lại"*.
   *
   * 📌 MẶC ĐỊNH MỞ. Ban lãnh đạo vừa mất sáu lượt trao đổi chỉ để thấy được phần nhập liệu
   * này; gập sẵn là đưa nó trở lại chỗ không ai thấy. Yêu cầu là "tạo nút", không phải "đổi
   * mặc định".
   *
   * ⚠️ CHỈ có ý nghĩa khi `nhung`. Ở trang riêng `/don-hang/tao-moi` thì cả trang chính là
   * form này — gập nó lại là trang trắng, nên trang riêng không vẽ nút gập.
   */
  const [moNhapLieu, setMoNhapLieu] = useState(true);
  /** Dữ liệu file vừa đọc, đang chờ người dùng soát. `null` = chưa đọc file nào. */
  const [xemTruocExcel, setXemTruocExcel] = useState<DuLieuXemTruocExcel | null>(null);
  /** Giữ riêng phần đã khớp để đổ vào bảng khi người dùng bấm đồng ý. */
  const doVaoBang = useRef<(() => void) | null>(null);
  const [moChonMatHang, setMoChonMatHang] = useState(false);
  const [hoiXoaHetDong, setHoiXoaHetDong] = useState(false);
  /**
   * Hỏi trước khi cất đơn (nguyên tắc Ban lãnh đạo 10/08/2026).
   *
   * 🔴 Cất đơn là việc RA NGOÀI PHÒNG: đơn được đẩy sang app Kho và app QLDA, và khối lượng
   * bị trừ khỏi phần chưa lên đơn của đề nghị. Bấm nhầm không có nút hoàn lại.
   *
   * `null` = chưa hỏi ai · `"cat"` = cất rồi mở đơn · `"cat-in"` = cất rồi mở trang in.
   */
  const [hoiCat, setHoiCat] = useState<null | "cat" | "cat-in">(null);

  /** Đã điền sẵn từ bảng báo giá nào — hiện dải thông báo để người lập biết vì sao có số. */
  const [nguonTuBaoGia, setNguonTuBaoGia] = useState<{
    maBaoGia: string;
    tenNCC: string;
    soDong: number;
    /** Số dòng trong phân bổ nhưng KHÔNG điền được — phải nói ra, không lặng lẽ bỏ. */
    soDongBoQua: number;
  } | null>(null);

  /**
   * ★ MÃ DỰ ÁN THẬT SỰ ĐEM ĐI CẤP SỐ ĐƠN — một chỗ duy nhất, hai chế độ cùng đọc.
   *
   * Tách ra thay vì viết `dn ? dn.maDuAn : maDuAnNhap` rải rác: ô "Số đơn hàng" trên màn hình,
   * câu nhắc dưới ô đó, điều kiện `hopLe` và lúc gọi `themDonHang` bắt buộc phải cùng một giá
   * trị — lệch nhau là màn hình hứa một mã, đơn cất ra mang mã khác.
   */
  const maDuAnDon = dn ? dn.maDuAn : maDuAnNhap.trim();

  /**
   * Dự án đã có trong hệ thống — nguồn của ô chọn ở chế độ độc lập.
   *
   * 📌 Gom từ CẢ đề nghị LẪN đơn hàng: một dự án có thể mới chỉ có đơn độc lập (lập từ chính
   * module này) mà chưa có đề nghị nào. Bỏ nguồn thứ hai thì lần lập đơn thứ hai cho cùng dự
   * án lại phải gõ tay, rất dễ gõ lệch một ký tự → hai "dự án" khác nhau, số thứ tự PO chạy
   * hai dãy riêng.
   */
  const duAnDaCo = useMemo(() => {
    const map = new Map<string, { maDuAn: string; tenCongTrinh: string; maHopDongCDT?: string }>();
    for (const d of dsDeNghi) {
      if (d.maDuAn && !map.has(d.maDuAn)) {
        map.set(d.maDuAn, {
          maDuAn: d.maDuAn,
          tenCongTrinh: d.tenCongTrinh,
          maHopDongCDT: d.maHopDongCDT,
        });
      }
    }
    for (const p of donHang) {
      if (p.maDuAn && !map.has(p.maDuAn)) {
        map.set(p.maDuAn, {
          maDuAn: p.maDuAn,
          tenCongTrinh: p.tenCongTrinh ?? "",
          maHopDongCDT: p.maHopDongCDT,
        });
      }
    }
    return [...map.values()].sort((a, b) => a.maDuAn.localeCompare(b.maDuAn, "vi"));
  }, [dsDeNghi, donHang]);

  /**
   * ★ ĐỊA ĐIỂM GIAO HÀNG ĐÃ DÙNG — nguồn cho ô chọn nhanh (18/08/2026).
   *
   * 🔴 MISA để "Địa điểm giao hàng" là Ô CHỌN có danh mục. App **không có danh mục địa điểm
   * giao hàng** nào trong `3-du-lieu/` (chỉ có `DANH_MUC_PHONG_BAN`) và không được tự bịa ra một
   * danh mục — đó là dữ liệu nghiệp vụ, phải do công ty cấp.
   *
   * 📌 CÁCH LÀM THẬT MÀ KHÔNG BỊA: gom các địa điểm đã ghi trên ĐƠN HÀNG THẬT — đúng cách ô
   * "Dự án / Công trình" ở trên đang làm (`duAnDaCo` suy từ đề nghị + đơn hàng, vì app cũng chưa
   * có danh mục dự án). Dùng lại cách đã quen thay vì dựng kiểu nhập thứ hai cho cùng một việc.
   *
   * ⚠️ HỆ QUẢ PHẢI BIẾT: kho dữ liệu mới (chưa có đơn nào) thì danh sách này RỖNG, và ô chọn
   * KHÔNG được vẽ ra — bày một ô chọn chỉ có đúng dòng "-- Chọn --" còn khó dùng hơn ô gõ tay.
   * Ô gõ chữ vì vậy luôn còn đó, và nó mới là ô giữ giá trị thật của đơn.
   */
  const diaDiemDaCo = useMemo(() => {
    const tap = new Set<string>();
    for (const p of donHang) {
      const s = (p.diaDiemGiaoHang ?? "").trim();
      if (s !== "") tap.add(s);
    }
    return [...tap].sort((a, b) => a.localeCompare(b, "vi"));
  }, [donHang]);

  /**
   * ★ NHÂN SỰ BỘ PHẬN KHO — để chọn nhanh người nhận hàng (Ban lãnh đạo 21/08/2026).
   *
   * 📌 Cùng nguồn `useDanhBa()` với ô "Người theo dõi": tài khoản THẬT trên máy chủ khi đã nối
   * App Tổng, rơi về danh bạ tĩnh khi chạy chế độ tài khoản mẫu. Không dựng danh sách riêng —
   * hai chỗ cùng chọn người mà lấy hai nguồn khác nhau là sớm muộn lệch nhau.
   *
   * ⚠️ Bỏ người đã nghỉ (`status !== "active"`): giao hàng cho người không còn làm ở công ty thì
   * tài xế tới cổng không ai nhận.
   */
  const nhanSuKho = useMemo(
    () =>
      danhBa
        .filter((n) => n.department === "kho" && n.status === "active")
        .sort((a, b) => a.displayName.localeCompare(b.displayName, "vi")),
    [danhBa],
  );

  /**
   * Tiến độ từng dòng của phiếu đề nghị nguồn.
   *
   * ⚠️ Độc lập thì KHÔNG có đề nghị nào → mảng rỗng, và mọi thứ suy ra từ nó (`dongLapDuoc`,
   * `conLaiTheoDong`, `matHangConThem`) cũng rỗng theo. Đó là ĐÚNG: không có khối lượng đã
   * duyệt nào để trừ. Các nhánh dùng chúng đều đã gác bằng `laDonDocLap`.
   */
  const tienDo = useMemo(
    () => (dn ? tinhTienDoDeNghi(dn, donHang, phieuNhan) : []),
    [dn, donHang, phieuNhan],
  );

  /**
   * Dòng lập được PO: đã phân bổ cho mình (hoặc mình là trưởng BP) và còn KL chưa lên PO.
   *
   * 🔴 LUẬT NẰM Ở `2-quy-trinh/giai-doan-mua-hang.ts` → `dongLapDuocDonHang`, KHÔNG viết lại
   * ở đây (quy tắc 3.4b: hàm nghiệp vụ không được nằm trong file giao diện).
   *
   * 📌 Sáng 18/08/2026 hàm đó có hai nơi gọi (thêm bước "chọn đề nghị" của `/don-hang/tao-moi`);
   * chiều cùng ngày Ban lãnh đạo bỏ hẳn bước chọn nên nay chỉ còn ĐÂY là nơi gọi duy nhất.
   */
  const dongLapDuoc = useMemo(
    () => dongLapDuocDonHang(tienDo, nguoiDung.uid, quyen.phanBoCongViec),
    [tienDo, quyen.phanBoCongViec, nguoiDung.uid],
  );

  /** Phần còn được đặt của từng dòng đề nghị — bảng dùng để nhắc và cảnh báo vượt. */
  const conLaiTheoDong = useMemo(() => {
    const bang: Record<number, ConLaiDeNghi> = {};
    for (const d of dongLapDuoc) {
      bang[d.stt] = { conLai: d.khoiLuongChuaLenPO, donViTinh: d.donViTinh };
    }
    return bang;
  }, [dongLapDuoc]);

  /**
   * ★ ĐIỀN CẢ CỤM Ô NHÀ CUNG CẤP TỪ MỘT BẢN GHI DANH MỤC — dùng cho ô tra mã và nút sổ xuống.
   *
   * 🔴 DÙNG CHUNG CHO HAI CHỖ ĐÓ, không chép tay hai bản: gõ trúng mã và chọn từ danh mục phải
   * ra đúng một kết quả, lệch nhau là người lập thấy hai hành vi khác nhau cho cùng một việc.
   *
   * ⚠️ KHÔNG dùng cho hai khối điền sẵn kia (từ bảng báo giá và từ file Excel) — CỐ Ý. Hai khối
   * đó lấy **tên nhà cung cấp theo phân bổ / theo file**, không theo danh mục (chỉ đạo Ban lãnh
   * đạo 10/08/2026: thông tin lấy theo PO). Gọi hàm này ở đó là ghi đè tên bằng tên trong danh
   * mục — đúng thứ chỉ đạo hôm đó yêu cầu bỏ.
   *
   * ⚠️ CHỈ GHI ĐÈ Ô CÓ DỮ LIỆU TRONG DANH MỤC. Danh mục thiếu địa chỉ mà vẫn ghi đè là **xóa
   * mất địa chỉ người lập vừa gõ tay** — mà địa chỉ là thông tin pháp lý in trên đơn.
   */
  const dienNhaCungCap = useCallback((n: NhaCungCap) => {
    setSupplierId(n.id);
    setTenNCC(n.ten);
    if (n.maNCC) setMaNCC(n.maNCC);
    if (n.maSoThue) setMstNCC(n.maSoThue);
    if (n.diaChi) setDiaChiNCC(n.diaChi);
  }, []);

  /**
   * Hộp "Thêm nhà cung cấp mới vào danh mục" (Ban lãnh đạo 20/08/2026) và các ô của nó.
   *
   * 📌 Giữ state ở đây chứ không dựng component riêng: chỉ có 5 ô, và nó dùng đúng một chỗ. Tách
   * ra file riêng lúc này là thêm một tầng truyền prop mà không ai dùng lại.
   */
  const [moThemNCC, setMoThemNCC] = useState(false);
  /** Nhà cung cấp đang hỏi xác nhận xóa khỏi danh mục — `null` là không hỏi gì. */
  const [hoiXoaNCC, setHoiXoaNCC] = useState<NhaCungCap | null>(null);

  /* ★ Danh mục thủ kho công trình (22/08/2026) — hai hộp thoại và ba ô nhập của hộp thêm. */
  const [moThemThuKho, setMoThemThuKho] = useState(false);
  const [moXoaThuKho, setMoXoaThuKho] = useState(false);
  const [tkTen, setTkTen] = useState("");
  const [tkSdt, setTkSdt] = useState("");
  const [tkCongTrinh, setTkCongTrinh] = useState("");
  /* 🔴 KHÔNG CÒN `maNCC` — mã do `themNhaCungCap` tự cấp theo `NC0000` (Ban lãnh đạo
     25/08/2026). Giữ lại một ô rỗng ở đây là mời người sau nối nó vào ô nhập rồi tưởng app
     dùng giá trị đó. */
  const [nccMoi, setNccMoi] = useState({
    ten: "",
    maSoThue: "",
    diaChi: "",
    dienThoai: "",
    nguoiLienHe: "",
  });

  /** Dựng một dòng bảng từ một dòng đề nghị. Số lượng bỏ trống = lấy hết phần còn lại. */
  const dungDongTuDeNghi = useCallback(
    (d: TienDoDongDeNghi, soLuong?: number, gia?: number): DongNhapDonHang => ({
      id: khoaDongMoi(),
      laGhiChu: false,
      sttDeNghi: d.stt,
      maHang: "",
      tenHang: d.tenVatLieu,
      thongSo: d.quyCach ?? "",
      dvt: d.donViTinh,
      soLuong: String(soLuong ?? d.khoiLuongChuaLenPO),
      donGia: gia !== undefined ? String(gia) : "",
      thueSuat: "",
      truongMoRong1: "",
      mucDich: d.mucDichSuDung ?? "",
    }),
    [khoaDongMoi],
  );

  /* ===== ĐIỀN SẴN CÁC Ô LẤY ĐƯỢC TỪ PHIẾU ĐỀ NGHỊ =====
     Chạy một lần khi mở màn. Mã RQ, tên công trình, hợp đồng đều đã có trên phiếu — bắt gõ
     lại là mời sai sót vào chứng từ. */
  const daDienTuDeNghi = useRef(false);
  useEffect(() => {
    if (daDienTuDeNghi.current) return;
    // Độc lập thì không có gì để điền sẵn — người lập tự chọn dự án ở ô bên dưới.
    if (!dn) return;
    setTenCongTrinh(dn.tenCongTrinh);
    setMaHopDong(ghiChuHopDongTuMa(dn.maHopDongCDT));
    daDienTuDeNghi.current = true;
  }, [dn]);

  /**
   * ★ TỰ NẠP MẶT HÀNG + SỐ LƯỢNG TỪ ĐỀ NGHỊ — Ban lãnh đạo 20/08/2026: *"khi bấm vào bước lập PO
   * này phải tự động link tên mặt hàng + số lượng theo đề nghị"*.
   *
   * 🔴 VÌ SAO TRƯỚC ĐÂY TRỐNG: đường điền sẵn duy nhất là effect TÁCH PO ngay dưới, và nó đòi
   * `rfqId` + `nccId` — hai tham số chỉ có khi bấm "Lập đơn" từ màn Báo giá. Màn đó **đã xóa**
   * 20/08/2026, nên vào từ `?prId=…` thì bảng Hàng tiền không có dòng nào và người lập phải gõ
   * lại toàn bộ mặt hàng đã có trên phiếu — mời sai sót vào chứng từ, đúng cái mà effect điền sẵn
   * phía trên vốn để tránh.
   *
   * 📌 Nạp `khoiLuongChuaLenPO` chứ KHÔNG phải khối lượng đề nghị: dòng đã lên đơn một phần thì
   * chỉ còn phần chưa đặt là hợp lệ. Đơn giá để TRỐNG — app không còn nhập giá nhà cung cấp nữa
   * (Ban lãnh đạo 19–20/08/2026), người lập tự điền theo báo giá đã đính kèm.
   *
   * ⚠️ KHÔNG ghi đè nếu bảng đã có dòng: người lập có thể vừa thêm tay hoặc nhập từ Excel.
   */
  const daNapTuDeNghi = useRef(false);
  useEffect(() => {
    if (daNapTuDeNghi.current) return;
    if (!dn) return;
    /* Đường TÁCH PO có effect riêng ngay dưới — để nó tự lo, đừng nạp trùng. */
    if (rfqId && nccIdTuBaoGia) return;
    /* Dữ liệu có thể chưa về ở lần vẽ đầu: chưa chốt cờ để lần sau còn chạy lại. */
    if (dongLapDuoc.length === 0) return;

    const dongMoi = dongLapDuoc
      .filter((d) => d.khoiLuongChuaLenPO > 0)
      .map((d) => dungDongTuDeNghi(d));
    if (dongMoi.length === 0) return;

    setDongBang((t) => (t.length > 0 ? t : dongMoi));
    daNapTuDeNghi.current = true;
  }, [dn, rfqId, nccIdTuBaoGia, dongLapDuoc, dungDongTuDeNghi]);

  /**
   * ★ ĐIỀN SẴN CÁC Ô CHUNG TỪ ĐƠN TRƯỚC CỦA CÙNG ĐỀ NGHỊ — mắt nối của việc TÁCH THÊM ĐƠN.
   *
   * 🔴 Ban lãnh đạo 21/08/2026: *"chức năng tách thêm đơn chưa tự động link thông tin từ các bước
   * trước nó"*. Đơn thứ hai giao cùng chỗ, cùng người nhận, cùng điều khoản, cùng thuế suất với
   * đơn thứ nhất — chỉ khác nhà cung cấp và mặt hàng. Trước đây mọi ô đó trắng trơn, người lập
   * phải mở lại đơn cũ đọc rồi gõ lại từng ô, và hai đơn của cùng một hồ sơ dễ lệch nhau.
   *
   * 🔴 CHỈ ĐIỀN Ô ĐANG TRỐNG. Không ghi đè thứ người lập vừa gõ, và không ghi đè thứ vừa đọc từ
   * file Excel — điền hộ mà xóa việc của người khác thì tệ hơn không điền.
   *
   * ⚠️ Chạy MỘT LẦN (`daDienTuDonTruoc`): thiếu chốt này thì mỗi lần người lập xóa trắng một ô,
   * hiệu ứng lại điền lại — không ai xóa được gì.
   *
   * ⚠️ KHÔNG kế thừa nhà cung cấp, mã số thuế, địa chỉ NCC — xem lý do ở `donTruocCuaDeNghi`.
   */
  const daDienTuDonTruoc = useRef(false);

  /**
   * ĐIỀN SẴN TỪ PHÂN BỔ CỦA BẢNG BÁO GIÁ — mắt nối của chức năng TÁCH PO.
   *
   * Người dùng vào màn Báo giá, chia 2.400 kg thép cho NCC B 1.500 và NCC G 900, rồi bấm
   * "Lập đơn" ở nhóm NCC B. Màn này mở ra với: NCC B đã điền, dòng thép đã có trong bảng,
   * khối lượng 1.500 và đơn giá B đã báo — điền sẵn. Bấm "Lập đơn" ở nhóm NCC G thì ra đơn
   * thứ hai cho 900 kg còn lại. Đó chính là hai PO tách ra từ một mặt hàng.
   *
   * 🔴 Chạy MỘT LẦN duy nhất (`daDienTuBaoGia`): không có chốt này thì mỗi lần state đổi
   * (người dùng vừa sửa tay khối lượng) hiệu ứng lại ghi đè, người lập không sửa được gì.
   */
  const daDienTuBaoGia = useRef(false);
  useEffect(() => {
    if (daDienTuBaoGia.current) return;
    // Bảng báo giá luôn thuộc về một đề nghị — không có đề nghị thì không có gì để điền sẵn.
    if (!dn) return;
    if (!rfqId || !nccIdTuBaoGia) return;
    const bg = baoGia.find((b) => b.id === rfqId);
    if (!bg) return;

    const chuanHoa = (s: string) => boDau(s).replace(/\s+/g, " ").trim();
    // 🔴 CHỈ XÉT `dongLapDuoc`, KHÔNG xét cả `tienDo`. Bảng chỉ cho thao tác trên dòng lập
    // được; nếu điền sẵn một dòng không nằm trong đó thì người lập KHÔNG THẤY để bỏ ra, mà
    // lúc cất đơn dòng đó vẫn vào PO — tức đặt hàng cho dòng chưa phân bổ, hoặc dòng của
    // người khác.
    const theoTen = new Map(dongLapDuoc.map((d) => [chuanHoa(d.tenVatLieu), d]));
    const theoStt = new Map(dongLapDuoc.map((d) => [d.stt, d]));

    const dongMoi: DongNhapDonHang[] = [];
    let tenNCCPhanBo = "";
    let soDongBoQua = 0;

    for (const item of bg.items) {
      const phan = (item.phanBo ?? []).find((p) => p.nccId === nccIdTuBaoGia);
      if (!phan || phan.khoiLuong <= 0) continue;
      tenNCCPhanBo = phan.tenNCC;

      // Khớp theo SỐ THỨ TỰ DÒNG trước — chính xác tuyệt đối. Chỉ lùi về khớp theo tên với
      // dữ liệu cũ chưa có `sttDongDeNghi` (hai dòng cùng tên khác quy cách sẽ khớp sai,
      // nên đây chỉ là đường lùi, không phải cách chính).
      const dongDN =
        item.sttDongDeNghi !== undefined
          ? theoStt.get(item.sttDongDeNghi)
          : theoTen.get(chuanHoa(item.tenVatLieu));

      // Dòng đã lên đơn đủ, chưa phân bổ, hoặc phân bổ cho người khác — không đưa vào bảng.
      if (!dongDN || dongDN.khoiLuongChuaLenPO <= 0) {
        soDongBoQua += 1;
        continue;
      }

      // Không đặt vượt phần còn lại của dòng đề nghị, kể cả khi phân bổ ghi nhiều hơn.
      const klDat = Math.min(phan.khoiLuong, dongDN.khoiLuongChuaLenPO);
      const gia = item.baoGiaNCC.find((q) => q.nccId === nccIdTuBaoGia)?.donGia;
      dongMoi.push(dungDongTuDeNghi(dongDN, klDat, gia));
    }

    if (dongMoi.length > 0) {
      setDongBang((t) => [...t, ...dongMoi]);
      setSupplierId(nccIdTuBaoGia);
      setTenNCC(tenNCCPhanBo);
      const trongDanhMuc = nhaCungCap.find((n) => n.id === nccIdTuBaoGia);
      if (trongDanhMuc?.maNCC) setMaNCC(trongDanhMuc.maNCC);
      if (trongDanhMuc?.maSoThue) setMstNCC(trongDanhMuc.maSoThue);
      if (trongDanhMuc?.diaChi) setDiaChiNCC(trongDanhMuc.diaChi);
      setNguonTuBaoGia({
        maBaoGia: bg.code,
        tenNCC: tenNCCPhanBo,
        soDong: dongMoi.length,
        soDongBoQua,
      });
    } else if (soDongBoQua > 0) {
      // Không điền được gì nhưng vẫn phải nói lý do, đừng để màn hình trắng trơn khiến
      // người dùng tưởng bấm nhầm nút.
      setNguonTuBaoGia({ maBaoGia: bg.code, tenNCC: tenNCCPhanBo, soDong: 0, soDongBoQua });
    }
    daDienTuBaoGia.current = true;
    // `dongLapDuoc` tính lại theo dữ liệu nên KHÔNG đưa vào deps — đã có chốt `daDienTuBaoGia`
    // bảo đảm chạy một lần, đưa vào chỉ làm hiệu ứng chạy lại vô ích.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqId, nccIdTuBaoGia, dn, baoGia, nhaCungCap]);

  /**
   * ★ TIỀN CỦA CẢ ĐƠN — gọi thẳng `tinhTienChiTiet` ở `2-quy-trinh/tinh-toan.ts`.
   *
   * 🔴 Ở đây KHÔNG có một phép tính tiền nào, chỉ nhặt trường từ ô nhập đưa sang. Quy tắc
   * 3.4b của dự án: hàm tính tiền nằm trong file giao diện là có hai chỗ cùng tính một con số
   * rồi lệch nhau — mà lệch giữa màn lập đơn và bản in là mất uy tín với nhà cung cấp.
   *
   * 📌 `sttDong` dùng CHỈ SỐ dòng trong `dongBang` (kể cả dòng ghi chú) để bảng tra ngược
   * được kết quả về đúng dòng đang hiện trên màn hình.
   *
   * 🔴 KHỐI LƯỢNG PHẢI CẮT ĐÚNG NHƯ LÚC CẤT ĐƠN. `luu()` cắt về phần còn được đặt, nên nếu ở
   * đây tính theo con số người dùng gõ thì "Tổng tiền thanh toán" cỡ lớn trên đầu màn hình là
   * một số KHÔNG BAO GIỜ THÀNH ĐƠN THẬT — file ghi 9.999 kg mà chỉ còn đặt được 2.400 kg thì
   * màn hình báo 199 triệu trong khi đơn cất ra 44 triệu. Người lập ký duyệt theo con số nhìn
   * thấy, nên hai chỗ buộc phải bằng nhau. Cảnh báo "vượt phần còn lại" ở từng dòng lo việc
   * giải thích vì sao số tiền không khớp với số lượng vừa gõ.
   */
  const tien = useMemo(() => {
    const dongVao: DongDeTinhTien[] = [];
    dongBang.forEach((d, i) => {
      if (d.laGhiChu) return;
      const nhap = Number(d.soLuong) || 0;
      /* `sttDeNghi === undefined` = dòng của đơn độc lập: không có "phần còn lại" nào để cắt,
         nên lấy đúng con số người lập gõ. `con === undefined` bên dưới lo tiếp.

         🔴 NHƯNG DÒNG CHƯA ĐỦ THÌ TÍNH BẰNG 0. `luu()` BỎ HẲN dòng gõ tự do còn thiếu Tên
         hàng / ĐVT / Số lượng; nếu ở đây vẫn cộng tiền của nó thì "Tổng tiền thanh toán" trên
         màn hình lớn hơn số tiền của đơn thật sự được cất — xem `dongTuDoDuVaoDon`. */
      const con =
        d.sttDeNghi === undefined ? undefined : conLaiTheoDong[d.sttDeNghi]?.conLai;
      const nhapThat = d.sttDeNghi === undefined && !dongTuDoDuVaoDon(d) ? 0 : nhap;
      dongVao.push({
        sttDong: i,
        // Bỏ trống thì lấy hết phần còn lại — y hệt `luu()`.
        soLuong: con === undefined ? nhapThat : nhapThat > 0 ? Math.min(nhapThat, con) : con,
        donGia: Number(d.donGia) || 0,
        // Ô trống = theo thuế suất chung của đơn. Ép về 0 ở đây là biến "chưa khai" thành
        // "không chịu thuế" — hai việc khác hẳn nhau trên chứng từ thuế.
        thueSuatGTGT: d.thueSuat.trim() === "" ? undefined : Number(d.thueSuat) || 0,
      });
    });
    return tinhTienChiTiet(dongVao, {
      kieuChietKhau,
      tyLeChietKhau: Number(tyLeChietKhau) || 0,
      chietKhau: Number(chietKhau) || 0,
      thueSuatGTGT: Number(thueSuat) || 0,
    });
  }, [dongBang, conLaiTheoDong, kieuChietKhau, tyLeChietKhau, chietKhau, thueSuat]);

  /** Mặt hàng của đề nghị chưa có trong bảng — nguồn của hộp [Thêm dòng]. */
  const matHangConThem = useMemo(() => {
    const daCo = new Set(dongBang.filter((d) => !d.laGhiChu).map((d) => d.sttDeNghi));
    return dongLapDuoc.filter((d) => !daCo.has(d.stt));
  }, [dongBang, dongLapDuoc]);

  /**
   * ★ VÌ SAO KHÔNG CÒN MẶT HÀNG NÀO — câu nói thật cho bảng khi nó trống (21/08/2026).
   *
   * 🔴 Ba lý do khác nhau hoàn toàn về việc phải làm tiếp, nên không được gộp thành một câu:
   *   · Phiếu đề nghị chưa có dòng nào  → hồ sơ sai, phải xem lại phiếu.
   *   · Đã lên đơn hết khối lượng       → không phải lỗi, chỉ là hết việc ở đây.
   *   · Còn khối lượng nhưng CHƯA PHÂN BỔ cho người đang lập → phải nhờ trưởng bộ phận phân bổ.
   *
   * Lý do thứ ba là chỗ dễ mất người nhất: nhân viên thấy đề nghị còn hàng, mở lập đơn ra thì
   * bảng trống, mà app trước đây chỉ nói "bấm Thêm dòng" — nút thì đã khóa.
   */
  const lyDoHetMatHang = useMemo(() => {
    if (laDonDocLap || !dn) return undefined;
    if (tienDo.length === 0) {
      return "Phiếu đề nghị này chưa có mặt hàng nào.";
    }
    const conKhoiLuong = tienDo.filter((d) => d.khoiLuongChuaLenPO > 0);
    if (conKhoiLuong.length === 0) {
      return "Mọi mặt hàng của đề nghị đã lên đơn hết — không còn khối lượng nào để đặt thêm.";
    }
    const sttLapDuoc = new Set(dongLapDuoc.map((d) => d.stt));
    const chuaPhanBo = conKhoiLuong.filter((d) => !sttLapDuoc.has(d.stt));
    if (chuaPhanBo.length > 0) {
      return `Còn ${chuaPhanBo.length} mặt hàng chưa được phân bổ cho bạn — nhờ trưởng bộ phận phân bổ trước khi lập đơn.`;
    }
    return undefined;
  }, [laDonDocLap, dn, tienDo, dongLapDuoc]);

  /**
   * ★ ĐƠN TRƯỚC CỦA CÙNG ĐỀ NGHỊ — nguồn để điền sẵn khi TÁCH THÊM ĐƠN (21/08/2026).
   *
   * 🔴 Ban lãnh đạo: *"chức năng tách thêm đơn chưa tự động link thông tin từ các bước trước nó"*.
   * Đơn thứ hai của một đề nghị gần như luôn giao cùng chỗ, cùng người nhận, cùng điều khoản
   * thanh toán và cùng thuế suất với đơn thứ nhất — chỉ khác nhà cung cấp và mặt hàng. Bắt gõ
   * lại toàn bộ là mời sai lệch giữa hai đơn của cùng một hồ sơ.
   *
   * ⚠️ KHÔNG kế thừa nhà cung cấp: tách đơn thường là để đặt bên KHÁC. Điền sẵn tên nhà cung cấp
   * cũ là dẫn người lập đặt hàng sai đối tượng — sai nặng hơn nhiều so với việc phải gõ lại.
   */
  const donTruocCuaDeNghi = useMemo(() => {
    if (!dn) return undefined;
    return donHang
      .filter((p) => p.prId === dn.id && p.trangThai !== "huy")
      .sort((a, b) => b.ngayLapPO.localeCompare(a.ngayLapPO))[0];
  }, [dn, donHang]);

  useEffect(() => {
    if (daDienTuDonTruoc.current) return;
    if (!donTruocCuaDeNghi) return;
    const p = donTruocCuaDeNghi;

    if (p.diaDiemGiaoHang) setDiaDiemGiao((v) => v || p.diaDiemGiaoHang!);
    if (p.nguoiNhanHangTen) setNguoiNhanHang((v) => v || p.nguoiNhanHangTen!);
    if (p.nguoiNhanHangSdt) setSdtNguoiNhan((v) => v || p.nguoiNhanHangSdt!);
    if (p.dieuKhoanKhac) setDieuKhoanKhac((v) => v || p.dieuKhoanKhac!);
    if (p.mauPO) setMauPO(p.mauPO);
    /* Ngày giao: KHÔNG lấy ngày của đơn cũ (đã qua rồi), mà lấy ngày cần hàng của đề nghị — đó
       mới là mốc thật người đề nghị đang chờ. */
    if (dn?.ngayCanHang) setNgayGiao((v) => v || dn.ngayCanHang);

    /* 🔒 Điều khoản thanh toán và số ngày được nợ nằm ở CHỨNG TỪ GIÁ — chỉ điền cho vai trò được
       xem giá. Vai trò không được xem giá mà thấy "được nợ 45 ngày" là lộ điều kiện thương mại
       qua đúng cái cửa mà nguyên tắc dữ liệu số 3 dựng lên để chặn. */
    if (quyen.xemGia) {
      const gia = giaDonHang.find((g) => g.poId === p.id);
      if (gia?.dieuKhoanThanhToan) setDieuKhoanThanhToan((v) => v || gia.dieuKhoanThanhToan!);
      if (gia?.soNgayDuocNo !== undefined) {
        setSoNgayDuocNo((v) => v || String(gia.soNgayDuocNo));
      }
      /* Thuế suất khởi tạo sẵn là "8" nên `v || x` sẽ không bao giờ đổi được. Chỉ ghi đè khi ô
         vẫn đúng bằng mặc định — người lập đã tự đổi sang 10% thì giữ nguyên ý họ. */
      if (gia?.thueSuatGTGT !== undefined) {
        setThueSuat((v) => (v === "8" ? String(gia.thueSuatGTGT) : v));
      }
      /* Loại tiền: cùng lối với thuế suất — ô khởi tạo sẵn "VND" nên `v || x` không bao giờ đổi
         được. Đơn thứ hai của một đề nghị thanh toán bằng đồng khác đơn thứ nhất là chuyện rất
         hiếm, nên kế thừa; người lập tự đổi rồi thì giữ nguyên ý họ. */
      if (gia?.loaiTien) {
        setLoaiTien((v) => (v === "VND" ? gia.loaiTien! : v));
      }
    }

    daDienTuDonTruoc.current = true;
  }, [donTruocCuaDeNghi, dn, quyen.xemGia, giaDonHang]);

  // --- Các thao tác trên bảng ---
  const doiDong = useCallback((id: string, phan: Partial<DongNhapDonHang>) => {
    setDongBang((t) => t.map((d) => (d.id === id ? { ...d, ...phan } : d)));
  }, []);
  const xoaDong = useCallback((id: string) => {
    setDongBang((t) => t.filter((d) => d.id !== id));
  }, []);
  /**
   * ★ CHÈN MỘT DÒNG HÀNG TRẮNG — chỉ ở chế độ độc lập (18/08/2026).
   *
   * 🔴 `sttDeNghi` để `undefined`, KHÔNG để `0`: `0` đã mang nghĩa dòng ghi chú (xem
   * `DongPO.sttDongDeNghi`). Hai nghĩa chồng lên một giá trị là mầm lỗi.
   *
   * ⚠️ Đây chính là chỗ chế độ độc lập rời khỏi quy tắc "mỗi dòng hàng phải nối về một dòng
   * đề nghị đã duyệt" (điểm 4 ở đầu file). Có chủ đích, theo chỉ đạo 18/08/2026.
   */
  const themDongTrong = useCallback(() => {
    setDongBang((t) => [
      ...t,
      {
        id: khoaDongMoi(),
        laGhiChu: false,
        sttDeNghi: undefined,
        maHang: "",
        tenHang: "",
        thongSo: "",
        dvt: "",
        soLuong: "",
        donGia: "",
        thueSuat: "",
        truongMoRong1: "",
        mucDich: "",
      },
    ]);
  }, [khoaDongMoi]);

  /**
   * Nút [Thêm dòng] và phím F9 — MỘT chỗ quyết định, hai chế độ hai việc khác nhau.
   *
   * Có đề nghị → mở hộp chọn mặt hàng của đề nghị (khối lượng phải trừ vào dòng đã duyệt).
   * Độc lập    → chèn một dòng trắng để gõ tay.
   */
  const themDong = useCallback(() => {
    if (laDonDocLap) themDongTrong();
    else setMoChonMatHang(true);
  }, [laDonDocLap, themDongTrong]);

  /** Một dòng trắng — dùng chung cho [Thêm dòng], dấu [+] và [Thêm ghi chú]. */
  const dongTrong = useCallback(
    (laGhiChu: boolean) => ({
      id: khoaDongMoi(),
      laGhiChu,
      /* Dòng ghi chú mang `sttDeNghi: 0` (không nối về dòng đề nghị nào), dòng hàng để trống. */
      sttDeNghi: laGhiChu ? 0 : undefined,
      maHang: "",
      tenHang: "",
      thongSo: "",
      dvt: "",
      soLuong: "",
      donGia: "",
      thueSuat: "",
      truongMoRong1: "",
      mucDich: "",
    }),
    [khoaDongMoi],
  );

  /**
   * ★ CHÈN MỘT DÒNG TRẮNG NGAY DƯỚI DÒNG ĐANG ĐỨNG — Ban lãnh đạo 25/08/2026: *"Thêm dấu cộng
   * để thêm dòng ngay bên dưới"*.
   *
   * 🔴 Chèn ĐÚNG VỊ TRÍ, không thêm vào cuối rồi mong người dùng tự dời: bảng không có chức năng
   * kéo dời dòng, nên thêm ở cuối là không có cách nào đưa dòng về giữa.
   *
   * ⚠️ Dòng chèn LUÔN là dòng trắng gõ tay, kể cả khi đơn lập từ đề nghị — khác [Thêm dòng] (mở
   * hộp chọn mặt hàng của đề nghị). Dòng trắng không nối về dòng đề nghị nào nên không trừ khối
   * lượng đã duyệt; nó dành cho thứ phát sinh tại chỗ (bốc xếp, vận chuyển…). Muốn thêm mặt hàng
   * CÓ trong đề nghị thì vẫn dùng [Thêm dòng] để khối lượng được trừ đúng chỗ.
   */
  const chenDongDuoi = useCallback(
    (idTren: string) => {
      setDongBang((t) => {
        const i = t.findIndex((d) => d.id === idTren);
        /* Không tìm thấy (dòng vừa bị xóa ở tab khác) thì thêm vào cuối — thà thêm sai chỗ còn
           hơn nuốt mất thao tác của người dùng mà không có gì hiện ra. */
        if (i === -1) return [...t, dongTrong(false)];
        return [...t.slice(0, i + 1), dongTrong(false), ...t.slice(i + 1)];
      });
    },
    [dongTrong],
  );

  /**
   * ★ GHI CHÚ CHÈN LÊN TRÊN, KHÔNG THÊM VÀO CUỐI — Ban lãnh đạo 25/08/2026: *"Mục thêm ghi chú
   * sẽ tạo thêm dòng ở bên trên công tác"*.
   *
   * 🔴 Trước đây thêm vào CUỐI bảng, nên ghi chú luôn nằm dưới mọi dòng hàng. Trên tờ đơn thì
   * dòng ghi chú đóng vai TIÊU ĐỀ NHÓM (*"Phần móng:"* rồi các dòng thép, bê tông bên dưới) —
   * đặt nó ở cuối là nó chú thích cho một nhóm nằm phía trên nó, đọc ngược.
   *
   * 📌 Chèn lên ĐẦU bảng (trên toàn bộ công tác). Muốn ghi chú giữa bảng thì thêm ở đây rồi dùng
   * dấu [+] của chính dòng ghi chú để dựng tiếp các dòng hàng bên dưới nó.
   */
  const themGhiChu = useCallback(() => {
    setDongBang((t) => [dongTrong(true), ...t]);
  }, [dongTrong]);

  /**
   * PHÍM TẮT F9 — "Thêm nhanh" của MISA. Có đề nghị thì mở hộp chọn mặt hàng, độc lập thì
   * chèn một dòng trắng (xem `themDong`).
   *
   * 📌 MISA còn ghi "F3 - Tìm nhanh" — F3 nay LÀM VIỆC THẬT, bắt ở `BangHangTien` (đưa con trỏ
   * vào ô tìm nhanh của bảng). Chú thích ở đây từng ghi *"ĐÃ BỎ F3: màn này không có ô tìm kiếm
   * nào để mở"* — đúng vào lúc viết, nhưng SAI kể từ 18/08/2026 khi bảng Hàng tiền có ô tìm thật.
   * Sửa lại vì một chú thích nói "đã bỏ" trong khi mã đang bắt phím sẽ khiến người sau tưởng
   * `NutPhimTat` đang rao một phím không tồn tại rồi đi xóa nó.
   *
   * 🔴 CHỈ BẮT PHÍM Ở TRANG RIÊNG (`!nhung`). Bắt trên `window` nên khi form nằm trong trang
   * chi tiết đề nghị, F9 sẽ nhảy ra hộp "Thêm mặt hàng" kể cả lúc người dùng đang gõ bình
   * luận, đang sửa bảng Phân bổ hay đang sửa "SL Báo giá" — cướp phím của cả trang. Ở trang
   * riêng thì cả trang chính là cái form nên không có ai để cướp. Không mất chức năng: nút
   * [Thêm dòng] trong bảng Hàng tiền làm đúng việc đó.
   */
  useEffect(() => {
    if (nhung) return;
    function bamPhim(e: KeyboardEvent) {
      if (e.key !== "F9") return;
      e.preventDefault();
      themDong();
    }
    window.addEventListener("keydown", bamPhim);
    return () => window.removeEventListener("keydown", bamPhim);
  }, [nhung, themDong]);

  /**
   * 🔴 LỚP CHẶN QUYỀN THỨ HAI, cố ý trùng với chỗ gọi.
   *
   * Chỉ đạo Ban lãnh đạo 17/08/2026: *"chỉ ai được cấp quyền thì mới xem được phần nhập liệu
   * đó"*. Dùng đúng cờ `quyen.lapPO` — cùng cờ mà `4-phan-quyen/quyen.ts` → `duocVaoDuongDan`
   * dùng cho địa chỉ `/don-hang/tao-moi`. KHÔNG bịa cờ quyền mới.
   *
   * ⚠️ Khi nhúng, cổng gác theo ĐƯỜNG DẪN không còn tác dụng: `duocVaoDuongDan` gác
   * `/de-nghi/...` bằng `xemQuyTrinhMuaHang`, cờ đó mở cho cả Ban Giám đốc (cấp 1) trong khi
   * `lapPO` thì không. Nên chốt duy nhất còn lại là chính hai chỗ kiểm `lapPO`: điều kiện ở
   * trang chi tiết và dòng dưới đây. Bỏ dòng này là tin vào chỗ gọi.
   *
   * Nhúng thì trả `null` (khối bước đã có tiêu đề và danh sách đơn của nó, chèn thêm một
   * `EmptyState` chiếm cả khối là vô ích); trang riêng thì nói rõ thiếu quyền gì.
   */
  if (!quyen.lapPO) {
    if (nhung) return null;
    return (
      <EmptyState
        icon={FileWarning}
        title="Không có quyền lập đơn hàng"
        description="Cần cấp quyền apps.tm từ 2 (Nhập liệu) trở lên."
      />
    );
  }

  /**
   * NHẬP TỪ FILE EXCEL theo biểu mẫu `1. DON HANG HPCONS.xlsx`.
   *
   * 🔴 ĐỌC XONG KHÔNG ĐỔ THẲNG — mở hộp xem trước cho người lập soát từng dòng rồi mới đổ
   * (chỉ đạo Ban lãnh đạo 17/08/2026). Đổ thẳng là xóa mất số liệu đang gõ dở trước khi người
   * ta kịp biết file có dùng được không, mà không có nút hoàn lại.
   */
  async function nhapTuExcel(file: File) {
    setDangDocFile(true);
    try {
      const kq = await docDonHangTuExcel(await file.arrayBuffer());
      /**
       * 🔴 CHỈ ĐỐI CHIẾU VỚI ĐỀ NGHỊ KHI CÓ ĐỀ NGHỊ (18/08/2026).
       *
       * Chạy `khopVoiDeNghi` với danh sách rỗng thì MỌI dòng của file rơi vào `khongKhop` và
       * hộp xem trước báo *"Không có trong đề nghị"* cho từng dòng — nút "Đổ vào bảng" khóa
       * cứng, chức năng nhập Excel của module độc lập coi như không có.
       */
      const { khop, khongKhop, khongLapDuoc } = laDonDocLap
        ? { khop: [], khongKhop: [], khongLapDuoc: [] }
        : khopVoiDeNghi(
            kq.dong,
            // Đối chiếu với TOÀN BỘ dòng của đề nghị (không chỉ dòng lập được) để báo đúng
            // lý do: "không có trong đề nghị" khác hẳn "có nhưng đã lên đơn hết".
            tienDo.map((d) => ({
              stt: d.stt,
              tenVatLieu: d.tenVatLieu,
              // Quy cách giúp phân biệt hai dòng cùng tên vật liệu — xem `khopVoiDeNghi`.
              quyCach: d.quyCach,
              khoiLuongChuaLenPO: d.khoiLuongChuaLenPO,
              lapDuoc: dongLapDuoc.some((x) => x.stt === d.stt),
            })),
          );

      /** Độc lập: mọi dòng hàng đọc được đều vào bảng, không qua bước đối chiếu nào. */
      const dongTuDo = laDonDocLap ? kq.dong : [];

      const tenDongDeNghi: Record<number, string> = {};
      for (const d of tienDo) tenDongDeNghi[d.stt] = d.tenVatLieu;

      /* Việc đổ vào bảng đóng gói sẵn ở đây, chỉ chạy khi người dùng bấm đồng ý trong hộp
         xem trước. Giữ trong `ref` chứ không dựng lại từ state: state của hộp chỉ có phần
         BÀY RA, còn đây cần đúng bộ dữ liệu vừa đọc. */
      doVaoBang.current = () => {
        const dongMoi: DongNhapDonHang[] = [];

        /* --- Đơn ĐỘC LẬP: lấy nguyên dòng của file, không nối về đề nghị nào --- */
        for (const e of dongTuDo) {
          dongMoi.push({
            id: khoaDongMoi(),
            laGhiChu: false,
            sttDeNghi: undefined,
            maHang: e.maHang ?? "",
            tenHang: e.tenHang,
            thongSo: e.thongSoKyThuat ?? "",
            dvt: e.donViTinh,
            soLuong: String(e.soLuong),
            donGia: e.donGia !== undefined ? String(e.donGia) : "",
            thueSuat: e.thueSuatGTGT !== undefined ? String(e.thueSuatGTGT) : "",
            truongMoRong1: e.truongMoRong1 ?? "",
            mucDich: e.mucDichSuDung ?? "",
          });
        }

        for (const k of khop) {
          const e = k.dongExcel;
          const dongDN = dongLapDuoc.find((x) => x.stt === k.sttDeNghi);
          if (!dongDN) continue;
          dongMoi.push({
            id: khoaDongMoi(),
            laGhiChu: false,
            sttDeNghi: k.sttDeNghi,
            maHang: e.maHang ?? "",
            // 🔴 TÊN VÀ ĐVT LẤY THEO FILE ĐƠN HÀNG, không lấy theo phiếu đề nghị. Chỉ đạo
            // Ban lãnh đạo 10/08/2026: thông tin thống nhất lấy theo PO — đó là chữ sẽ in ra
            // gửi nhà cung cấp và đẩy sang Kho / QLDA.
            tenHang: e.tenHang || dongDN.tenVatLieu,
            thongSo: e.thongSoKyThuat ?? dongDN.quyCach ?? "",
            dvt: e.donViTinh || dongDN.donViTinh,
            soLuong: String(e.soLuong),
            donGia: e.donGia !== undefined ? String(e.donGia) : "",
            thueSuat: e.thueSuatGTGT !== undefined ? String(e.thueSuatGTGT) : "",
            truongMoRong1: e.truongMoRong1 ?? "",
            mucDich: e.mucDichSuDung ?? dongDN.mucDichSuDung ?? "",
          });
        }

        // Dòng ghi chú của file vào bảng đúng dạng dòng ghi chú, không thành dòng hàng 0 ₫.
        for (const g of kq.dongGhiChu) {
          dongMoi.push({
            id: khoaDongMoi(),
            laGhiChu: true,
            sttDeNghi: 0,
            maHang: "",
            tenHang: g.tenHang,
            thongSo: "",
            dvt: "",
            soLuong: "",
            donGia: "",
            thueSuat: "",
            truongMoRong1: "",
            mucDich: "",
          });
        }

        /* ⚠️ THAY dòng cũ của cùng một mặt hàng, không cộng thêm dòng thứ hai. Chọn nhầm file
           rồi chọn lại file đúng mà app cứ nối tiếp thì bảng có hai dòng cùng mặt hàng, cất
           đơn là đặt gấp đôi khối lượng.

           🔴 HAI CÁCH NHẬN DIỆN "CÙNG MỘT MẶT HÀNG", theo chế độ:
             · Có đề nghị → theo SỐ THỨ TỰ DÒNG ĐỀ NGHỊ. Chính xác tuyệt đối.
             · Độc lập    → không có số nào để bám, nên theo TÊN HÀNG + ĐVT (bỏ dấu, gộp
               khoảng trắng, không phân biệt hoa thường).

           🔴 VÌ SAO KHÔNG QUÉT SẠCH BẢNG Ở CHẾ ĐỘ ĐỘC LẬP dù như vậy đơn giản hơn: người lập
           có thể đã gõ tay vài dòng rồi mới nhập thêm một file. Xóa hết là mất công nhập liệu
           của họ, im lặng, không có nút hoàn lại — đúng thứ dự án cấm. Cách trên giữ được
           dòng gõ tay không dính tới file, mà nhập lại đúng file đó hai lần vẫn không nhân
           đôi dòng. */
        const khoaTuDo = (d: { tenHang: string; dvt: string }) =>
          `${boDau(d.tenHang).replace(/\s+/g, " ").trim().toLowerCase()}|${boDau(d.dvt)
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase()}`;
        const sttMoi = new Set(
          dongMoi.filter((d) => !d.laGhiChu && d.sttDeNghi !== undefined).map((d) => d.sttDeNghi),
        );
        const khoaMoi = new Set(
          dongMoi.filter((d) => !d.laGhiChu && d.sttDeNghi === undefined).map(khoaTuDo),
        );
        setDongBang((t) => [
          ...t.filter((d) => {
            if (d.laGhiChu) return true;
            if (d.sttDeNghi !== undefined) return !sttMoi.has(d.sttDeNghi);
            return !khoaMoi.has(khoaTuDo(d));
          }),
          ...dongMoi,
        ]);

        // --- Thông tin chung của phiếu ---
        const c = kq.thongTinChung;
        if (c.diaDiemGiaoHang) setDiaDiemGiao(c.diaDiemGiaoHang);
        if (c.nguoiNhan) setNguoiNhanHang(c.nguoiNhan);
        if (c.dieuKhoanKhac) setDieuKhoanKhac(c.dieuKhoanKhac);
        if (c.dieuKhoanThanhToan) setDieuKhoanThanhToan(c.dieuKhoanThanhToan);
        if (c.thueSuatGTGT !== undefined) setThueSuat(String(c.thueSuatGTGT));
        /* Ô "Loại tiền" của file — bộ đọc đã nhặt sẵn từ lâu (`doc-don-hang-excel.ts` dòng 560)
           nhưng trước 23/08/2026 form bỏ qua, nên nhập một file ghi USD vẫn ra đơn VND. */
        if (c.loaiTien) setLoaiTien(c.loaiTien);
        if (c.thamChieu) setThamChieu(c.thamChieu);
        if (c.maNCC) setMaNCC(c.maNCC);
        if (c.soNgayDuocNo !== undefined) setSoNgayDuocNo(String(c.soNgayDuocNo));
        /**
         * File Excel giữ hợp đồng ở HAI Ô TÁCH RỜI ("Căn cứ hợp đồng số" và "Ngày hợp đồng"),
         * còn form từ 27/08/2026 chỉ còn MỘT ô ghi chú tự do. Nên đọc vào thì GỘP lại.
         *
         * 🔴 Đừng bỏ `c.ngayHopDong` đi cho gọn: file do người khác lập vẫn điền ô ngày, bỏ qua
         * là nhập file vào rồi mất ngày ký mà không có dòng nào báo — người lập tưởng file thiếu.
         *
         * 📌 Giữ nguyên văn chuỗi ngày của file (dd/MM/yyyy), KHÔNG đổi qua `Date`: đây là chữ
         * để in, không phải mốc thời gian để tính toán, mà `new Date("01/08/2026")` thì trình
         * duyệt đọc theo kiểu Mỹ và ra lệch một tháng.
         */
        const ghiChuHopDongTuFile = [
          c.canCuHopDong?.trim(),
          c.ngayHopDong?.trim() ? `ký ngày ${c.ngayHopDong.trim()}` : "",
        ]
          .filter(Boolean)
          .join(" ");
        if (ghiChuHopDongTuFile) setMaHopDong(ghiChuHopDongTuFile);

        // Ngày: đổi dd/MM/yyyy sang yyyy-MM-dd, xem `docNgayVN` — đưa thẳng chuỗi Việt vào ô
        // ngày là ô trống trơn, còn để `new Date()` đọc thì lệch một tháng.
        /**
         * 🔴 Ô "Ngày giao hàng" của file Excel nay có thể chứa MỘT KHOẢNG — "02/09/2026 —
         * 05/09/2026" (xem chỗ ghi ở `taoFileNhapDonHang`). Đưa nguyên chuỗi đó vào `docNgayVN`
         * là đọc hỏng, và hỏng IM LẶNG: hàm trả rỗng nên ô ngày giao trống trơn sau khi nhập
         * file, người lập tưởng file thiếu dữ liệu.
         *
         * 🔴 TÁCH BẰNG GẠCH DÀI "—" / "–" HOẶC CHỮ "đến", TUYỆT ĐỐI KHÔNG TÁCH BẰNG GẠCH
         * THƯỜNG "-". Ngày dạng ISO `2026-09-02` cũng dùng gạch thường; cho nó vào bộ tách là
         * một ngày duy nhất bị xé thành ba mảnh "2026" · "09" · "02", và ô ngày ra sai hẳn.
         */
        const manhNgayGiao = String(c.ngayGiaoHang ?? "")
          /* ⚠️ KHÔNG dùng `\b` quanh "đến": ranh giới từ của JavaScript chỉ hiểu chữ ASCII, nên
             `\bđến\b` KHÔNG khớp chữ có dấu — đã đo, ca "02/09/2026 đến 05/09/2026" trượt sạch.
             Dùng khoảng trắng hai bên thay cho ranh giới từ. */
          .split(/\s*(?:—|–)\s*|\s+(?:đến|den)\s+/i)
          .map((s) => s.trim())
          .filter(Boolean);
        const ngayGiaoISO = docNgayVN(manhNgayGiao[0]);
        if (ngayGiaoISO) setNgayGiao(ngayGiaoISO);
        const ngayGiaoDenISO = manhNgayGiao[1] ? docNgayVN(manhNgayGiao[1]) : undefined;
        if (ngayGiaoDenISO) setNgayGiaoDen(ngayGiaoDenISO);
        const ngayDonISO = docNgayVN(c.ngayDonHang);
        if (ngayDonISO) setNgayDonHang(ngayDonISO);

        /**
         * NHẬN DIỆN NHÀ CUNG CẤP — theo MÃ SỐ THUẾ trước, rồi mới đến tên.
         *
         * 🔴 Mã số thuế là số định danh duy nhất do cơ quan thuế cấp; tên thì mỗi phiếu viết
         * một kiểu ("CÔNG TY TNHH HIỆP PHÁT" · "Công ty TNHH Hiệp Phát" · "CTY TNHH HIỆP
         * PHÁT"). Khớp theo tên trước là trượt ngay ở phiếu viết hoa hoặc viết tắt.
         *
         * 🔴 LẤY NHÀ CUNG CẤP TỪ FILE, không đòi phải có trong danh mục (chỉ đạo Ban lãnh
         * đạo 10/08/2026). Tra danh mục chỉ để LIÊN KẾT thêm nếu tìm được, không phải để chặn.
         */
        if (c.tenNhaCungCap) setTenNCC(c.tenNhaCungCap);
        if (c.maSoThueNCC) setMstNCC(c.maSoThueNCC);
        if (c.diaChiNCC) setDiaChiNCC(c.diaChiNCC);

        const soThue = (s?: string) => (s ?? "").replace(/\D/g, "");
        let daChonNCC = false;
        if (c.maSoThueNCC) {
          const theoMST = nhaCungCap.find(
            (n) => n.maSoThue && soThue(n.maSoThue) === soThue(c.maSoThueNCC),
          );
          if (theoMST) {
            setSupplierId(theoMST.id);
            daChonNCC = true;
          }
        }
        if (!daChonNCC && c.tenNhaCungCap) {
          const chuan = (s: string) => boDau(s).replace(/\s+/g, " ").trim();
          const ncc = nhaCungCap.find((n) => chuan(n.ten) === chuan(c.tenNhaCungCap!));
          if (ncc) setSupplierId(ncc.id);
        }

        toast.success(`Đã đổ ${dongMoi.length} dòng vào bảng`, {
          description: "Soát lại số liệu rồi bấm Lưu.",
        });
      };

      setXemTruocExcel({
        tenFile: file.name,
        khop,
        khongKhop,
        khongLapDuoc,
        dongTuDo,
        nhapTuDo: laDonDocLap,
        dongGhiChu: kq.dongGhiChu,
        dongLoi: kq.dongLoi,
        thieuCot: kq.thieuCot,
        canhBao: kq.canhBao,
        bangTrong: kq.bangTrong,
        tenDongDeNghi,
      });
    } catch (loi) {
      // 🔴 PHẢI ghi lỗi thật ra console. Trước đây `catch {}` nuốt sạch, nên mọi nguyên
      // nhân khác nhau (file .xls định dạng cũ, file hỏng, thư viện không nạp được) đều
      // hiện ra một câu y như nhau — không cách nào chẩn đoán khi người dùng báo lỗi.
      console.error("[nhập Excel] không đọc được file:", loi);
      toast.error("Không đọc được file", {
        description:
          "File phải là .xlsx (Excel 2007 trở lên). File .xls đời cũ cần mở bằng Excel rồi “Lưu thành” .xlsx.",
      });
    } finally {
      setDangDocFile(false);
    }
  }

  /**
   * TẢI FILE MẪU ĐÃ ĐIỀN SẴN.
   *
   * 🔴 Vì sao cần (bài học 10/08/2026): biểu mẫu giấy `1. DON HANG HPCONS.xlsx` là **mẫu
   * trống**, chọn thẳng vào app thì đọc ra 0 dòng và người dùng tưởng chức năng nhập bị
   * hỏng. File tải ở đây đã có sẵn đúng các mặt hàng đang chờ lập đơn của đề nghị này,
   * nên tên hàng chắc chắn khớp — người lập chỉ điền Đơn giá rồi chọn lại file.
   */
  async function taiFileMau() {
    /**
     * 🔴 CHẶN CHỈ ÁP CHO CHẾ ĐỘ CÓ ĐỀ NGHỊ.
     *
     * Đơn độc lập không có "mặt hàng của đề nghị" nào, nên `dongLapDuoc` luôn rỗng — giữ nguyên
     * chốt cũ là nút "Tải file mẫu" chết vĩnh viễn ở module mới.
     */
    if (!laDonDocLap && dongLapDuoc.length === 0) {
      toast.error("Không có mặt hàng nào để đưa vào file", {
        description: "Đề nghị này đã lên đơn hết, hoặc các dòng chưa được phân bổ cho ai.",
      });
      return;
    }
    setDangTaoFile(true);
    try {
      /**
       * NGUỒN DÒNG CỦA FILE MẪU, theo chế độ:
       *   · Có đề nghị → các mặt hàng còn đặt được của đề nghị (đường cũ, không đổi).
       *   · Độc lập    → chính những dòng đang có trên bảng. Bảng trống thì file ra **chỉ có
       *     dòng tiêu đề** — và như vậy là ĐÚNG việc người dùng cần: một biểu mẫu sạch đúng
       *     tên cột mà app đọc lại được, để họ gõ trong Excel rồi nhập vào.
       */
      /**
       * ★ GIÁ ĐANG CÓ TRÊN BẢNG, tra theo STT dòng đề nghị (21/08/2026).
       *
       * 🔴 Ban lãnh đạo: *"sao file mẫu đơn mua hàng xuất ra lại không giống đơn nhập"*. Chế độ
       * có đề nghị lấy dòng từ `dongLapDuoc` (hồ sơ đề nghị) — nơi đó KHÔNG có giá, vì giá là
       * thứ người lập vừa gõ trên bảng. Nên phải nối hai nguồn: tên hàng/khối lượng từ đề nghị,
       * còn đơn giá và % thuế từ bảng đang mở.
       */
      const giaTheoStt = new Map<number, { donGia?: number; thueSuatDong?: number }>();
      for (const d of dongBang) {
        if (d.laGhiChu || d.sttDeNghi === undefined) continue;
        const g = Number(d.donGia);
        const t = Number(d.thueSuat);
        giaTheoStt.set(d.sttDeNghi, {
          donGia: Number.isFinite(g) && g > 0 ? g : undefined,
          thueSuatDong: d.thueSuat.trim() !== "" && Number.isFinite(t) ? t : undefined,
        });
      }

      const dongChoFile = laDonDocLap
        ? dongBang
            .filter((d) => !d.laGhiChu)
            .map((d, i) => {
              const g = Number(d.donGia);
              const t = Number(d.thueSuat);
              return {
                stt: i + 1,
                tenVatLieu: d.tenHang,
                quyCach: d.thongSo || undefined,
                donViTinh: d.dvt,
                soLuong: Number(d.soLuong) || 0,
                mucDichSuDung: d.mucDich || undefined,
                donGia: Number.isFinite(g) && g > 0 ? g : undefined,
                thueSuatDong: d.thueSuat.trim() !== "" && Number.isFinite(t) ? t : undefined,
              };
            })
        : dongLapDuoc.map((d) => ({
            stt: d.stt,
            tenVatLieu: d.tenVatLieu,
            quyCach: d.quyCach,
            donViTinh: d.donViTinh,
            /* Khối lượng: ưu tiên con số ĐANG GÕ TRÊN BẢNG, vì người lập có thể đã chia nhỏ đơn.
               Chưa đưa dòng đó vào bảng thì mới lấy phần còn được đặt của đề nghị. */
            soLuong:
              Number(dongBang.find((x) => x.sttDeNghi === d.stt)?.soLuong) || d.khoiLuongChuaLenPO,
            mucDichSuDung: d.mucDichSuDung,
            donGia: giaTheoStt.get(d.stt)?.donGia,
            thueSuatDong: giaTheoStt.get(d.stt)?.thueSuatDong,
          }));

      const thueSuatChung = Number(thueSuat);

      const blob = await taoFileNhapDonHang({
        maDeNghi: dn?.code,
        /**
         * 🔴 LUÔN LẤY GIÁ TRỊ TRÊN FORM, KHÔNG ĐỌC LẠI TỪ `dn` — Ban lãnh đạo 24/08/2026:
         * *"Link từ đề nghị và có chức năng sửa"*.
         *
         * Bản trước viết `dn ? dn.tenCongTrinh : tenCongTrinh`, tức khi lập đơn TỪ ĐỀ NGHỊ thì
         * file Excel xuất ra **bỏ qua** ô người lập vừa sửa và in lại giá trị gốc của đề nghị.
         * Ô trên form vẫn cho gõ, PO lưu vào hệ thống vẫn nhận giá trị đã sửa — chỉ tờ Excel gửi
         * nhà cung cấp là sai. Đúng kiểu hỏng nguy nhất: giao diện nhận, chứng từ thì không.
         *
         * 📌 Không mất đường link: hai ô này đã được điền sẵn từ `dn` ở `useEffect` phía trên
         * (`daDienTuDeNghi`), nên đọc từ form là đọc đúng giá trị đã link — cộng thêm phần người
         * lập sửa. Còn `maDeNghi` thì vẫn lấy thẳng từ `dn`: đó là khoá truy vết, sửa tay được là
         * mất đường về khối lượng đã duyệt.
         */
        tenCongTrinh: tenCongTrinh,
        maHopDongCDT: maHopDong.trim() || undefined,
        diaDiemGiaoHang: diaDiemGiao || (dn ? dn.tenCongTrinh : tenCongTrinh),
        nguoiNhanHang,
        /* ★ Những gì người lập đã điền trên form — trước 21/08/2026 tất cả bị bỏ lại, nên file
           tải về luôn trắng phần nhà cung cấp và điều khoản dù trên màn hình đã có đủ. */
        tenNhaCungCap: tenNCC.trim() || undefined,
        diaChiNCC: diaChiNCC.trim() || undefined,
        maSoThueNCC: mstNCC.replace(/\D/g, "") || undefined,
        /* ★ Bảy ô của màn MISA: app đã biết đọc chúng từ 17/08/2026 nhưng biểu mẫu chưa từng in
           ra dòng nào, nên người lập không có chỗ điền và không ai báo là thiếu. */
        maNCC: maNCC.trim() || undefined,
        nhanVienMuaHang: nguoiDung.tenHienThi,
        thamChieu: thamChieu.trim() || undefined,
        soNgayDuocNo: Number(soNgayDuocNo) || undefined,
        ngayDonHang: ngayDonHang
          ? new Date(ngayDonHang).toLocaleDateString("vi-VN")
          : undefined,
        /* 📌 KHÔNG còn truyền `ngayHopDongCDT` — từ 27/08/2026 form chỉ còn một ô ghi chú tự do,
           ngày ký (nếu có) nằm ngay trong chuỗi `maHopDongCDT`. Ô "Ngày hợp đồng" của file Excel
           vì vậy để trống cho người dùng tự điền trong Excel. Vòng đọc ngược vẫn đúng: bộ đọc gộp
           hai ô lại thành đúng câu người lập đã gõ (xem chỗ `ghiChuHopDongTuFile`). */
        /* Khoảng nhận hàng ghép vào MỘT ô của file Excel — ô đó vốn là ô chữ, và biểu mẫu chỉ có
           một dòng "Ngày giao hàng:". Có ngày kết thúc thì ghi "02/09/2026 — 05/09/2026", không
           thì ghi đúng một ngày như trước. */
        ngayGiaoHang:
          [
            ngayGiao ? new Date(ngayGiao).toLocaleDateString("vi-VN") : undefined,
            ngayGiaoDen ? new Date(ngayGiaoDen).toLocaleDateString("vi-VN") : undefined,
          ]
            .filter(Boolean)
            .join(" — ") || undefined,
        dieuKhoanKhac: dieuKhoanKhac.trim() || undefined,
        dieuKhoanThanhToan: dieuKhoanThanhToan.trim() || undefined,
        thueSuatGTGT: Number.isFinite(thueSuatChung) ? thueSuatChung : undefined,
        dong: dongChoFile,
        nhapTuDo: laDonDocLap,
      });

      /* Tên file phải phân biệt được giữa các lần tải. Độc lập thì không có mã đề nghị, dùng
         mã dự án; chưa chọn dự án thì một nhãn cố định còn hơn tên file cụt. */
      const tenFile = tenFileNhapDonHang(dn?.code || maDuAnDon || "khong-gan-de-nghi");
      // Tải xuống bằng thẻ <a> tạm — không cần máy chủ, chạy được cả trên hosting tĩnh.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = tenFile;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(
        dongChoFile.length > 0
          ? `Đã tải file mẫu với ${dongChoFile.length} mặt hàng`
          : "Đã tải biểu mẫu trống",
        {
          description: laDonDocLap
            ? "Điền Tên hàng, ĐVT, SL, Đơn giá trong Excel rồi bấm “Nhập từ Excel”."
            : "Điền cột Đơn giá rồi bấm “Chọn file Excel” để nhập lại.",
        },
      );
    } catch (loi) {
      console.error("[nhập Excel] không tạo được file mẫu:", loi);
      toast.error("Không tạo được file mẫu");
    } finally {
      setDangTaoFile(false);
    }
  }

  // ===========================================================================
  // ★ BẢN MẪU PO — CHỈ ĐẠO BAN LÃNH ĐẠO 18/08/2026: *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*
  //
  // 🔴 BA HÀM DƯỚI ĐÂY TUYỆT ĐỐI KHÔNG GỌI `themDonHang`, không ghi một dòng nào vào kho dữ
  //    liệu. Đó chính là điều làm chế độ độc lập KHÔNG còn đi vòng qua chốt kiểm soát chi tiêu
  //    `vuongMacLapDonHang` — xem khối chú thích đầu file.
  //
  // 🔴 CHỈ CHẠY Ở CHẾ ĐỘ ĐỘC LẬP. Hai nút gọi chúng chỉ được vẽ khi `laDonDocLap`; đường có đề
  //    nghị vẫn [Lưu] / [Lưu và In] qua `luu()` như cũ, không đụng một dòng.
  // ===========================================================================

  /**
   * Dựng đơn TẠM từ đúng những ô đang hiện trên màn hình.
   *
   * 🔴 PHÉP BIẾN ĐỔI NẰM Ở `2-quy-trinh/don-hang-mau.ts` → `dungDonHangMau`, không nằm ở đây:
   * quy tắc 3.4b của dự án cấm để hàm nghiệp vụ trong file giao diện. Ở đây chỉ nhặt state đưa
   * sang, không một phép tính nào.
   *
   * 📌 Truyền chuỗi thô của ô nhập (không `Number()` trước): hàm kia lo việc đổi số và phân biệt
   * "ô trống" với "số 0" — hai chỗ cùng làm việc đó là sớm muộn lệch nhau.
   */
  function dungDonMau() {
    return dungDonHangMau({
      maDuAn: maDuAnDon,
      tenCongTrinh,
      maHopDongCDT: maHopDong,
      /* Bản xem trước phải in đúng mã như đơn thật — xem chú thích trong `dungDonHangMau`. */
      maDeXuatAppRequest: dn?.maDeXuatAppRequest,
      supplierTen: tenNCC,
      maSoThueNCC: mstNCC,
      diaChiNCC,
      thamChieu,
      /* Tên NGƯỜI ĐỨNG TÊN trên tờ, sửa được (Ban lãnh đạo 26/08/2026). Rỗng thì lấy người đang
         lập — tờ in không được để trống dòng này. */
      nguoiPhuTrachTen: tenNhanVienMua.trim() || nguoiDung.tenHienThi,
      ngayLapPO: ngayDonHang,
      ngayGiaoDuKien: ngayGiao,
      /* Chuoi rong -> undefined: don giao gon mot ngay khong co ngay ket thuc. */
      ngayGiaoDenNgay: ngayGiaoDen || undefined,
      ghiChuThoiGianGiao: ghiChuThoiGianGiao.trim() || undefined,
      diaDiemGiaoHang: diaDiemGiao,
      nguoiNhanHangTen: nguoiNhanHang,
      nguoiNhanHangSdt: sdtNguoiNhan,
      mauPO,
      /* `?? undefined`: `null` (chưa sửa) phải thành `undefined` để tờ in rơi về bản chuẩn. */
      dieuKhoanGiaoHang: dieuKhoanGiaoHang ?? undefined,
      camKetThoaThuan: camKetThoaThuan ?? undefined,
      dieuKhoanKhac,
      dong: dongBang,
      kieuChietKhau,
      tyLeChietKhau,
      chietKhau,
      loaiTien,
      thueSuatGTGT: thueSuat,
      dieuKhoanThanhToan,
      soNgayDuocNo,
    });
  }

  /**
   * IN BẢN MẪU PO — mở tab in `/in/don-hang-mau`.
   *
   * 🔴 DÙNG LẠI ĐÚNG BẢN VẼ CHỨNG TỪ CỦA ĐƠN THẬT (`thanh-phan-nghiep-vu/to-don-mua-hang-a4.tsx`,
   * tách ra khỏi `trang/don-hang-in.tsx` cùng ngày). Bản in bám biểu mẫu giấy thật của công ty;
   * chép tay thành bản thứ hai là hai tờ giấy lệch nhau sau vài lần sửa rồi một trong hai gửi
   * sai cho nhà cung cấp.
   *
   * 📌 VÌ SAO MỞ TAB MỚI THAY VÌ IN NGAY TẠI TRANG: trang này nằm trong khung app (có thanh bên
   * và thanh trên), in trực tiếp là lôi theo cả những phần đó. Còn điều hướng ngay trong tab
   * đang gõ thì form bị tháo khỏi cây React và **mất sạch mọi ô vừa gõ**, không có nút hoàn lại.
   * Tab in dùng lại `app/in/layout.tsx` — chỗ đã sạch thanh bên và đã có cổng đăng nhập.
   */
  function inMauPO() {
    const { po, gia, ncc } = dungDonMau();

    /* 🔴 DÙNG CHUNG `vuongMacXuatPO` với nút Xuất Excel của đơn thật — một luật cho câu hỏi
       "tờ PO này đã đủ để đưa ra ngoài chưa". Đòi: có mặt hàng, có chứng từ giá, và MỌI dòng
       có đơn giá > 0. Viết một luật riêng cho bản mẫu là sớm muộn hai chỗ nói khác nhau.

       🔴 KHÔNG ĐỂ NÚT BẤM KHÔNG PHẢN ỨNG: bị chặn thì nói ngay thiếu gì. */
    const vuongMac = vuongMacXuatPO({ po, gia });
    if (vuongMac) {
      toast.error("Chưa in được bản mẫu", { description: vuongMac });
      return;
    }

    // Cất hỏng mà vẫn mở tab thì tab đó hiện "không tìm thấy bản mẫu" — người dùng không hiểu
    // vì sao. Báo tại chỗ, đúng nguyên nhân.
    if (!catBanMauDonMuaHang({ po, gia, ncc })) {
      toast.error("Không chuyển được bản mẫu sang trang in", {
        description:
          "Bộ nhớ tạm của trình duyệt đang không ghi được (thường là do đã đầy). Thử đóng vài tab rồi bấm lại, hoặc dùng nút Xuất Excel.",
      });
      return;
    }

    const tab = window.open("/in/don-hang-mau", "_blank");
    if (!tab) {
      toast.error("Trình duyệt đã chặn cửa sổ in", {
        description: "Cho phép mở cửa sổ (pop-up) cho địa chỉ này rồi bấm “In mẫu PO” lại.",
      });
      return;
    }
    toast.success("Đã mở bản mẫu ở tab mới", {
      description: "Bản mẫu chưa được lưu vào hệ thống và chưa được cấp số đơn hàng.",
    });
  }

  /**
   * XUẤT BẢN MẪU RA EXCEL, theo đúng biểu mẫu `1. DON HANG HPCONS.xlsx`.
   *
   * 🔴 DÙNG LẠI `2-quy-trinh/xuat-don-hang-excel.ts` — cùng một hàm mà đơn thật dùng. Hàm đó
   * THUẦN (không đọc kho dữ liệu, không kiểm quyền, không dùng `po.id`) nên nhận được đơn tạm.
   *
   * ⚠️ KHÔNG dùng lại `NutXuatDonHangExcel`: nút đó chỉ nhận `poId` rồi TỰ tra kho — bản mẫu
   * không có trong kho nên nút sẽ không vẽ ra gì cả.
   *
   * ⚠️ KHÔNG LẪN VỚI NÚT "Tải file mẫu" ở đầu form: cái đó là biểu mẫu CHƯA CÓ GIÁ để người lập
   * điền rồi nhập lại vào app (`ghi-don-hang-excel.ts`). Nút này ra tờ PO đầy đủ giá, đúng mẫu
   * gửi nhà cung cấp.
   */
  async function xuatExcelMau() {
    const { po, gia, ncc } = dungDonMau();

    // Cùng một luật với nút In ở trên, và với nút Xuất Excel của đơn thật.
    const vuongMac = vuongMacXuatPO({ po, gia });
    if (vuongMac) {
      toast.error("Chưa xuất được bản mẫu", { description: vuongMac });
      return;
    }

    setDangXuatMau(true);
    try {
      const { xuatDonHangExcel } = await import("@/2-quy-trinh/xuat-don-hang-excel");

      // Logo lấy từ `public/` để file có nhận diện như biểu mẫu giấy. Không tải được thì vẫn
      // xuất — thiếu logo đỡ hơn là không xuất được đơn.
      let logo: ArrayBuffer | undefined;
      try {
        const r = await fetch("/logo-hpc.png");
        if (r.ok) logo = await r.arrayBuffer();
      } catch {
        // Bỏ qua, xuất không logo.
      }

      const blob = await xuatDonHangExcel({
        po,
        gia,
        ncc,
        /* Tên công trình truyền RIÊNG vì hàm xuất không đọc `po.tenCongTrinh` (chú thích ở
           `DauVaoXuatPO`). Không truyền là file mất luôn ô "Mã đề xuất và tên công trình". */
        tenCongTrinh: tenCongTrinh.trim() || undefined,
        logo,
      });

      const tenFile = tenFileDonHangMau(maDuAnDon, ngayDonHang);
      // Tải xuống bằng thẻ <a> tạm — không cần máy chủ, chạy được cả trên hosting tĩnh.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = tenFile;
      a.click();
      // Thu hồi địa chỉ tạm, nếu không mỗi lần bấm lại giữ thêm một bản trong bộ nhớ.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);

      toast.success("Đã tải bản mẫu đơn mua hàng", {
        description: `${tenFile} — bản mẫu, chưa lưu vào hệ thống và chưa được cấp số đơn hàng.`,
      });
    } catch (loi) {
      // 🔴 Nói ra lỗi thay vì im lặng — bấm mà không thấy gì thì người dùng tưởng app hỏng.
      console.error("[bản mẫu PO] không tạo được file Excel:", loi);
      toast.error("Không tạo được file Excel", {
        description: loi instanceof Error ? loi.message : "Thử lại, hoặc dùng nút In mẫu PO.",
      });
    } finally {
      setDangXuatMau(false);
    }
  }

  /**
   * DỌN SẠCH FORM SAU KHI CẤT XONG.
   *
   * 🔴 SỐNG CÒN VỚI BỐ CỤC NHÚNG (17/08/2026): nhúng trong trang chi tiết thì cất xong KHÔNG
   * điều hướng đi đâu, nên nếu không dọn thì cả đơn vừa cất vẫn nằm nguyên trên màn hình.
   * Người lập nhìn thấy bảng còn đầy số liệu, tưởng chưa cất được, bấm Cất lần nữa —
   * ĐẶT HÀNG HAI LẦN. (Trang riêng thì điều hướng nên component bị tháo, không có lỗi này;
   * đó chính là vì sao lỗi này chỉ sinh ra khi nhúng.)
   *
   * 📌 Điền lại tên công trình / hợp đồng từ phiếu đề nghị chứ không để trống: hai ô đó vốn
   * do hiệu ứng điền sẵn lo, mà hiệu ứng ấy đã "chạy một lần" xong rồi.
   */
  function donForm() {
    setDongBang([]);
    setMaNCC("");
    setMstNCC("");
    setTenNCC("");
    setDiaChiNCC("");
    setDieuKhoanThanhToan("");
    setSoNgayDuocNo("");
    setNgayDonHang(new Date().toISOString().slice(0, 10));
    setNgayGiao("");
    setNgayGiaoDen("");
    setGhiChuThoiGianGiao("");
    setThamChieu("");
    setSupplierId("");
    setKieuChietKhau("khong");
    setTyLeChietKhau("");
    setChietKhau("");
    setThueSuat("8");
    /* Có đề nghị thì điền lại từ phiếu (hiệu ứng "chạy một lần" đã xong). Độc lập thì GIỮ
       NGUYÊN dự án / tên công trình / hợp đồng vừa chọn: người lập thường cất liền mấy đơn cho
       cùng một công trình, xóa đi là bắt chọn lại từ đầu mỗi lần. Mã dự án cũng phải giữ để ô
       "Số đơn hàng" tiếp tục hiện đúng dãy mã. */
    if (dn) {
      setTenCongTrinh(dn.tenCongTrinh);
      setMaHopDong(ghiChuHopDongTuMa(dn.maHopDongCDT));
    }
    setDiaDiemGiao("");
    setNguoiNhanHang("");
    setDieuKhoanKhac("");
    setTepDinhKem([]);
    setNguonTuBaoGia(null);
  }

  /** Dòng hàng thật (bỏ dòng ghi chú) — dùng để biết đơn đã có gì chưa. */
  const soDongHang = dongBang.filter((d) => !d.laGhiChu).length;
  /**
   * Ở chế độ độc lập, dòng hàng gõ tay có thể còn trống — phải có ít nhất một dòng ĐỦ tên
   * hàng, đơn vị tính và số lượng > 0 thì đơn mới có nghĩa. Đường có đề nghị không cần kiểm
   * việc này vì mọi dòng đều sinh ra từ một dòng đề nghị đã có đủ ba thứ đó.
   */
  const soDongHangHopLe = laDonDocLap
    ? dongBang.filter(dongTuDoDuVaoDon).length
    : soDongHang;
  // Đòi TÊN nhà cung cấp, không đòi phải có trong danh mục (chỉ đạo Ban lãnh đạo 10/08/2026).
  // 🔴 Độc lập đòi thêm MÃ DỰ ÁN: không có thì `themDonHang` từ chối cất, mà để người lập gõ
  // xong cả đơn rồi mới báo là bắt họ làm không công.
  /* 🔴 KHOẢNG NGƯỢC THÌ CHẶN CẤT, không chỉ tô cảnh báo ở ô. Thuộc tính `min` của ô ngày là
     gợi ý của trình duyệt — dán ngày vào ô hoặc gõ tay vẫn lọt qua được. Chốt thật phải ở đây,
     nơi quyết định cho cất hay không. */
  const khoangGiaoNguoc = ngayGiao !== "" && ngayGiaoDen !== "" && ngayGiaoDen < ngayGiao;

  const hopLe =
    soDongHangHopLe > 0 &&
    tenNCC.trim() !== "" &&
    ngayGiao !== "" &&
    !khoangGiaoNguoc &&
    ngayDonHang !== "" &&
    (!laDonDocLap || maDuAnDon !== "");

  /**
   * Lý do CHƯA CẤT được đơn — `null` là cất được.
   *
   * 🔴 DÙNG CHUNG `vuongMacLapDonHang` với chốt chặn thật trong `themDonHang`, nên câu giải
   * thích hiện ra đúng là lý do app sẽ chặn — không có chuyện màn hình nói một đằng, hàm ghi
   * dữ liệu chặn một nẻo.
   *
   * 📌 Ô cảnh báo nằm TRONG form (một chỗ duy nhất) chứ không nằm ở trang gọi: trước
   * 17/08/2026 nó ở trang chi tiết đề nghị và ghi *"vào màn lập đơn thì nhập liệu vẫn dùng
   * được"* — câu đó nói về MỘT MÀN KHÁC, nay form ở ngay tại chỗ nên câu ấy sai văn cảnh. Và
   * trang riêng thì trước đây KHÔNG có cảnh báo nào, người lập gõ hết đơn mới biết bị chặn.
   */
  /* 🔴 CHỈ TÍNH KHI CÓ ĐỀ NGHỊ (18/08/2026). Chế độ mẫu không gắn đề nghị nên không có bảng báo
     giá nào để đối chiếu; chạy luật này với danh sách rỗng thì dải cảnh báo hiện thường trực và
     nói một câu vô nghĩa — mà chế độ đó cũng không có nút Cất nào để chặn.
     ⚠️ ĐÂY CHỈ LÀ CÂU GIẢI THÍCH, KHÔNG PHẢI CHỐT CHẶN. Chốt thật ở `themDonHang`, và hàm đó
     TỪ CHỐI HẲN đơn thiếu `prId` — xem chú thích ở đó. */
  /* ★ Truyền `dn` để chốt kiểm luôn điều kiện HỢP ĐỒNG (Ban lãnh đạo 26/08/2026) — cùng một hàm
     với chốt thật trong `themDonHang`, nên câu báo trên form không thể nói khác lúc cất. */
  const chanLapDon = dn ? vuongMacLapDonHang(baoGia.filter((b) => b.prId === dn.id), dn) : null;

  function luu(rangIn: boolean) {
    if (tenNCC.trim() === "") return;
    /**
     * Nhà cung cấp của đơn — lấy theo FILE PO (chỉ đạo Ban lãnh đạo 10/08/2026).
     *
     * `supplierId` chỉ có khi tra ra trong danh mục. Không tra ra thì sinh khóa từ mã số
     * thuế (định danh duy nhất) hoặc từ tên — để hai đơn cùng một nhà cung cấp vẫn gom được
     * về một khóa khi tính công nợ và khi chống lập đơn trùng.
     */
    const maSoThue = mstNCC.replace(/\D/g, "");
    /**
     * 🔴 PHẢI LƯU CẢ MST VÀ ĐỊA CHỈ, không chỉ dùng để sinh khóa.
     *
     * Trang in đơn mua hàng (`trang/don-hang-in.tsx`) in hai dòng "Địa chỉ" và "Mã số thuế".
     * Trước 17/08/2026 chỗ đây chỉ giữ `id` + `ten` nên trang in phải tra ngược danh mục
     * `NHA_CUNG_CAP` — mà danh mục là hằng số cứng, app không có đường thêm nhà cung cấp mới.
     * Hệ quả: người lập gõ đủ MST và địa chỉ vào form mà **đơn in ra gửi nhà cung cấp vẫn
     * hiện dấu "—"**, thiếu thông tin pháp lý bắt buộc mà không ai biết.
     */
    const ncc = {
      id: supplierId || (maSoThue ? `ncc-mst-${maSoThue}` : `ncc-ten-${boDau(tenNCC).trim()}`),
      ten: tenNCC.trim(),
    };

    /* 🔴 LỌC LẠI THEO `dongLapDuoc`, KHÔNG TIN VÀO BẢNG.
       Lớp chặn thứ hai, cố ý trùng với lớp ở chỗ điền sẵn và ở hộp thêm dòng. Bất kỳ dòng nào
       lọt vào bảng mà không nằm trong `dongLapDuoc` là dòng đặt cho phần chưa phân bổ hoặc của
       người khác. Đã từng lọt qua đường điền sẵn từ bảng báo giá. */
    const sttHopLe = new Set(dongLapDuoc.map((d) => d.stt));
    const conLai = new Map(dongLapDuoc.map((d) => [d.stt, d.khoiLuongChuaLenPO]));

    const items: DongPO[] = [];
    const giaTheoDong: Record<number, number> = {};
    const thueSuatTheoDong: Record<number, number> = {};

    for (const d of dongBang) {
      if (d.laGhiChu) {
        // Dòng ghi chú trống thì bỏ — một dòng trắng giữa đơn gửi nhà cung cấp là lỗi trình bày.
        if (d.tenHang.trim() === "") continue;
        items.push({
          sttDong: items.length + 1,
          // Quy ước dòng ghi chú, xem `DongPO.laDongGhiChu`: không trỏ về đề nghị nào,
          // không đơn vị tính, không khối lượng.
          sttDongDeNghi: 0,
          tenVatLieu: d.tenHang.trim(),
          donViTinh: "",
          khoiLuongDat: 0,
          laDongGhiChu: true,
        });
        continue;
      }

      /**
       * ★ HAI ĐƯỜNG TÍNH KHỐI LƯỢNG, tách hẳn theo chế độ.
       *
       * · CÓ ĐỀ NGHỊ: dòng phải nằm trong `dongLapDuoc`, và khối lượng bị CẮT về phần còn được
       *   đặt. Đây là lớp chặn cuối cùng, cố ý trùng với lớp ở chỗ điền sẵn và hộp thêm dòng.
       * · ĐỘC LẬP: không có gì để trừ vào, lấy đúng con số người lập gõ. Dòng thiếu tên hàng /
       *   ĐVT / số lượng thì BỎ — một dòng trắng lọt vào đơn gửi nhà cung cấp là lỗi chứng từ.
       *   (`hopLe` đã khóa nút Cất khi KHÔNG CÒN dòng nào đủ, nhưng bảng vẫn có thể lẫn dòng
       *   trắng bên cạnh dòng đủ.)
       */
      if (d.sttDeNghi === undefined) {
        if (!laDonDocLap) continue;
        // Cùng một luật với `hopLe` và với khối tính tiền — xem `dongTuDoDuVaoDon`.
        if (!dongTuDoDuVaoDon(d)) continue;
        const soLuong = Number(d.soLuong);

        const sttDongTuDo = items.length + 1;
        items.push({
          sttDong: sttDongTuDo,
          // Không trỏ về đề nghị nào — xem `DongPO.sttDongDeNghi`.
          sttDongDeNghi: undefined,
          maHang: d.maHang.trim() || undefined,
          tenVatLieu: d.tenHang.trim(),
          thongSoKyThuat: d.thongSo.trim() || undefined,
          donViTinh: d.dvt.trim(),
          khoiLuongDat: soLuong,
          mucDichSuDung: d.mucDich.trim() || undefined,
          truongMoRong1: d.truongMoRong1.trim() || undefined,
        });
        giaTheoDong[sttDongTuDo] = Number(d.donGia) || 0;
        if (d.thueSuat.trim() !== "") thueSuatTheoDong[sttDongTuDo] = Number(d.thueSuat) || 0;
        continue;
      }

      if (!sttHopLe.has(d.sttDeNghi)) continue;
      const con = conLai.get(d.sttDeNghi) ?? 0;
      const nhap = Number(d.soLuong);
      // Nhập vượt thì tự cắt về phần còn lại (bảng đã cảnh báo tại chỗ); để trống thì lấy hết.
      const khoiLuongDat = nhap > 0 ? Math.min(nhap, con) : con;

      const sttDong = items.length + 1;
      items.push({
        sttDong,
        sttDongDeNghi: d.sttDeNghi,
        // Ô trống thì để `undefined` chứ không lưu chuỗi rỗng — trang in dựa vào `?? "—"`
        // để biết ô nào chưa khai, chuỗi rỗng sẽ in ra ô trắng khó hiểu.
        maHang: d.maHang.trim() || undefined,
        tenVatLieu: d.tenHang.trim(),
        thongSoKyThuat: d.thongSo.trim() || undefined,
        donViTinh: d.dvt.trim(),
        khoiLuongDat,
        mucDichSuDung: d.mucDich.trim() || undefined,
        truongMoRong1: d.truongMoRong1.trim() || undefined,
      });
      giaTheoDong[sttDong] = Number(d.donGia) || 0;
      // Chỉ ghi thuế suất riêng khi người lập THẬT SỰ nhập — để trống thì chứng từ nói đúng
      // "dòng này không có thỏa thuận thuế riêng", và sau đổi thuế suất chung là đổi theo.
      if (d.thueSuat.trim() !== "") thueSuatTheoDong[sttDong] = Number(d.thueSuat) || 0;
    }

    const dongHang = items.filter((it) => !it.laDongGhiChu);

    // Lọc xong không còn dòng hàng nào thì dừng, kèm lý do — đừng lập một đơn hàng trống.
    if (dongHang.length === 0) {
      toast.error("Không có dòng nào lập được đơn", {
        description: laDonDocLap
          ? "Mỗi dòng hàng phải có đủ Tên hàng, ĐVT và Số lượng lớn hơn 0."
          : "Các dòng trong bảng hiện chưa được phân bổ, hoặc đã lên đơn đủ khối lượng.",
      });
      return;
    }

    /**
     * 🔴 CHẶN CẤT ĐƠN KHI CÒN DÒNG THIẾU ĐƠN GIÁ (bài học 11/08/2026).
     *
     * Trước đây chỗ này chỉ `Number(... ?? 0)` nên cất được đơn với đơn giá 0. Hệ quả dây
     * chuyền: đơn đó không in ra được (bản in phải có giá), không xuất Excel được
     * (`vuongMacXuatPO` chặn), và công nợ tính ra 0 — mà người lập thì tưởng đã xong.
     *
     * Chặn ở ĐÂY, tại chỗ sinh ra đơn, thay vì chỉ chặn ở nút xuất file: sửa gốc thì mọi
     * đơn về sau đều lành, còn chặn ở ngọn thì đơn lỗi vẫn nằm trong dữ liệu.
     */
    const dongThieuGia = dongHang.filter((it) => !(giaTheoDong[it.sttDong] > 0));
    if (dongThieuGia.length > 0) {
      toast.error(`Còn ${dongThieuGia.length} dòng chưa nhập đơn giá`, {
        description: `Nhập đơn giá cho: ${dongThieuGia
          .map((it) => it.tenVatLieu)
          .join(", ")}. Đơn mua hàng gửi nhà cung cấp bắt buộc có đơn giá.`,
      });
      return;
    }

    const ketQua = themDonHang({
      // Một chỗ duy nhất, hai chế độ — xem `maDuAnDon`.
      maDuAn: maDuAnDon,
      /* Ghi chú hợp đồng, in nguyên văn lên tờ đơn (Ban lãnh đạo 27/08/2026). `.trim() || undefined`
         phải giữ: ô ghi chú rất dễ còn lại khoảng trắng, mà tờ in phân biệt "rỗng" để chừa chỗ
         viết tay. Không còn `ngayHopDongCDT` — ngày ký nằm ngay trong chuỗi này. */
      maHopDongCDT: maHopDong.trim() || undefined,
      /* 🔴 Đơn độc lập KHÔNG gắn đề nghị: để `undefined` cả hai, không nhét chuỗi rỗng. Chuỗi
         rỗng vẫn "có giá trị" nên mọi chỗ kiểm `po.prId ?` sẽ tưởng là có đề nghị, rồi vẽ ra
         một liên kết `/de-nghi/` chết. */
      prId: dn?.id,
      prCode: dn?.code,
      /* Chép mã App Request sang đơn để tờ in dùng — xem chú thích của trường trên `DonDatHang`.
         Đơn không qua App Request thì `undefined`, tờ in tự lùi về `prCode`. */
      maDeXuatAppRequest: dn?.maDeXuatAppRequest,
      tenCongTrinh: tenCongTrinh.trim() || undefined,
      supplierId: ncc.id,
      supplierTen: ncc.ten,
      maSoThueNCC: maSoThue || undefined,
      diaChiNCC: diaChiNCC.trim() || undefined,
      thamChieu: thamChieu.trim() || undefined,
      nguoiPhuTrachUid: nguoiDung.uid,
      /* Tên NGƯỜI ĐỨNG TÊN trên tờ, sửa được (Ban lãnh đạo 26/08/2026). Rỗng thì lấy người đang
         lập — tờ in không được để trống dòng này. */
      nguoiPhuTrachTen: tenNhanVienMua.trim() || nguoiDung.tenHienThi,
      ngayLapPO: ngayDonHang,
      ngayGiaoDuKien: ngayGiao,
      /* Chuoi rong -> undefined: don giao gon mot ngay khong co ngay ket thuc. */
      ngayGiaoDenNgay: ngayGiaoDen || undefined,
      ghiChuThoiGianGiao: ghiChuThoiGianGiao.trim() || undefined,
      diaDiemGiaoHang: diaDiemGiao.trim() || undefined,
      nguoiNhanHangTen: nguoiNhanHang.trim() || undefined,
      nguoiNhanHangSdt: sdtNguoiNhan.trim() || undefined,
      mauPO,
      /* 🔴 `?? undefined` chứ KHÔNG `|| undefined`: người lập xóa trắng khối điều khoản thì phải
         cất đúng chuỗi rỗng đó, để tờ in không tự thêm lại bản chuẩn. `||` biến `""` thành
         `undefined` và điều khoản họ vừa bỏ lại hiện nguyên trên chứng từ gửi nhà cung cấp. */
      dieuKhoanGiaoHang: dieuKhoanGiaoHang ?? undefined,
      camKetThoaThuan: camKetThoaThuan ?? undefined,
      dieuKhoanKhac: dieuKhoanKhac.trim() || undefined,
      tepDinhKem: tepDinhKem.length > 0 ? tepDinhKem : undefined,
      items,
      donGia: giaTheoDong,
      thueSuatDong: Object.keys(thueSuatTheoDong).length > 0 ? thueSuatTheoDong : undefined,
      phanTien: {
        loaiTien: loaiTien.trim() || "VND",
        kieuChietKhau,
        /* ⚠️ CHỈ GHI CON SỐ CỦA ĐÚNG KIỂU ĐANG CHỌN. `tienChietKhau` suy số tiền từ tỷ lệ khi
           kiểu là "ty_le", nên ghi thêm `chietKhau` lúc đó là để lại một con số cũ không ai
           dùng — đọc chứng từ sau này thấy hai giá trị mâu thuẫn không biết tin cái nào. */
        chietKhau: kieuChietKhau === "so_tien" ? Number(chietKhau) || undefined : undefined,
        tyLeChietKhau: kieuChietKhau === "ty_le" ? Number(tyLeChietKhau) || undefined : undefined,
        thueSuatGTGT: Number(thueSuat) || undefined,
        dieuKhoanThanhToan: dieuKhoanThanhToan.trim() || undefined,
        soNgayDuocNo: Number(soNgayDuocNo) || undefined,
      },
    });

    /* Bị chặn thì nói ĐÚNG LÝ DO. Lý do hay gặp nhất là bảng báo giá chưa được trưởng bộ
       phận duyệt — người dùng cần biết phải đi làm gì tiếp, không phải một câu báo lỗi chung
       chung rồi tự đoán. */
    if ("loi" in ketQua) {
      toast.error("Chưa lập được đơn đặt hàng", { description: ketQua.loi });
      return;
    }
    toast.success("Đã lưu đơn hàng", {
      description: nhung ? "Đơn mới đã hiện trong danh sách đơn của bước này." : undefined,
    });
    // Dọn TRƯỚC khi giao lại cho chỗ gọi: chỗ gọi có thể chỉ đứng yên (bố cục nhúng).
    donForm();
    /* "Cất và In" mở thẳng bản in A4. Trang in tự chặn quyền `xemGia` bên trong nên không
       phải kiểm lại ở đây. */
    onDaLuu?.(ketQua.id, rangIn);
  }

  /* ★ CẬP NHẬT 29/08/2026: độc lập + `quyen.taoPoDoiLap` giờ CŨNG cất được đơn (xem khối nút
     cuối form), và `themDonHang` tạo PO đó ở `"cho_de_nghi"` chứ không phải `"da_chot"` — badge
     "Tình trạng" phải nói đúng cái sẽ xảy ra khi bấm Lưu, không phải luôn hiện "Đã chốt". */
  const nhanTrangThai = laDonDocLap ? NHAN_TRANG_THAI_PO.cho_de_nghi : NHAN_TRANG_THAI_PO.da_chot;

  /* Hai nút NHẬP EXCEL — nửa sau của yêu cầu 17/08/2026, dựng một lần dùng cho cả hai bố cục.
     Đặt ở dòng đầu của form để thấy ngay: người lập thường có sẵn file của nhà cung cấp, gõ
     tay từng dòng chỉ là đường lùi. */
  const nutNhapExcel = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={taiFileMau}
        disabled={dangTaoFile || dangDocFile}
        className="min-h-11"
      >
        <Download className="size-4" aria-hidden />
        {dangTaoFile ? "Đang tạo file..." : "Tải file mẫu"}
      </Button>
      {/* Ô chọn tệp thật nằm trong <label>: `<input type=file>` không tạo kiểu được nên
          mọi app đều bọc như vậy. */}
      <label className="shrink-0">
        <input
          type="file"
          accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          disabled={dangDocFile}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void nhapTuExcel(f);
            // Xóa giá trị để chọn lại đúng file đó lần nữa vẫn kích hoạt onChange.
            e.target.value = "";
          }}
        />
        <span
          className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:border-primary hover:bg-muted ${
            dangDocFile ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <FileSpreadsheet className="size-4" aria-hidden />
          {dangDocFile ? "Đang đọc file..." : "Nhập từ Excel"}
        </span>
      </label>
    </div>
  );

  /**
   * ★ HAI NÚT TRỢ GIÚP của thanh tiêu đề MISA — [Hướng dẫn sử dụng] và biểu tượng bàn phím.
   *
   * ✅ CẢ HAI ĐỀU LÀM VIỆC THẬT, không phải chỗ trống:
   *  · [Hướng dẫn sử dụng] mở đúng hướng dẫn bước "Lập đơn mua hàng" đã có sẵn trong
   *    `2-quy-trinh/huong-dan-giai-doan.ts` (khóa `lap_don_mua_hang`, chép nguyên văn từ quy
   *    trình giấy TM-QT Mua hàng của công ty). Dùng lại `NutHuongDanGiaiDoan` chứ không dựng hộp
   *    thứ hai — chữ nghiệp vụ chỉ được có MỘT bản.
   *  · Biểu tượng bàn phím liệt kê phím tắt THẬT SỰ đang bắt (F3, F9).
   *
   * 🔴 NÚT BÀN PHÍM CHỈ HIỆN Ở TRANG RIÊNG (`!nhung`). Khi nhúng trong trang chi tiết đề nghị,
   * app CỐ Ý không bắt F3/F9 (sẽ cướp phím của ô bình luận và bảng phân bổ) — nên ở đó danh sách
   * phím tắt sẽ rỗng, và một cái nút mở ra hộp rỗng đúng là thứ quy ước dự án cấm.
   */
  const nutTroGiup = (
    <div className="flex flex-wrap items-center gap-2">
      <NutHuongDanGiaiDoan
        giaiDoan="lap_don_mua_hang"
        kieu="nut_chu"
        nhanNut="Hướng dẫn sử dụng"
      />
      {!nhung && <NutPhimTat />}
    </div>
  );

  return (
    /* 🔴 PHẢI CÓ KHUNG FLEX RIÊNG, không trả về một fragment trần.
       Trang riêng thì khung ngoài của app (`khung-tong.tsx`) là flex-col có `gap-(--hp-md-section)`
       nên fragment vẫn được giãn cách; còn khi nhúng, chỗ chứa là một `<div>` có padding thôi —
       fragment trần là năm khối dán liền nhau không một khe hở.
       Khoảng cách khi nhúng nhỏ hơn (`row-gap`): form là MỘT phần bên trong khối của bước, không
       phải năm mục ngang hàng của cả trang.
       `min-w-0` để bảng Hàng tiền cuộn được bên trong thay vì đẩy giãn cả trang. */
    <section
      className={
        nhung
          ? "flex min-w-0 flex-col gap-(--hp-md-row-gap) border-t border-divider pt-(--hp-md-card-gap)"
          : "flex min-w-0 flex-col gap-(--hp-md-section)"
      }
    >
      {/* ===== DÒNG ĐẦU: tiêu đề phần nhập liệu + hai nút Excel ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {nhung ? (
          /* 🔴 CẢ CỤM TIÊU ĐỀ LÀ MỘT NÚT GẬP — Ban lãnh đạo 17/08/2026: *"mục tự động nhập
             này e tạo nút group lại"*. Form này dài hơn 1.000px; để bung mãi thì khối bước ④
             đẩy phần "Đơn đặt hàng" và các bước sau xuống quá sâu. */
          <button
            type="button"
            onClick={() => setMoNhapLieu((v) => !v)}
            aria-expanded={moNhapLieu}
            className="flex min-h-11 min-w-0 flex-1 items-start gap-2 text-left"
          >
            <ChevronRight
              className={`mt-0.5 size-4 shrink-0 text-primary transition-transform ${moNhapLieu ? "rotate-90" : ""}`}
              aria-hidden
            />
            <span className="flex min-w-0 flex-col gap-1">
              {/* 🔴 DÙNG `NhanPhanTrongGiaiDoan` — KHÔNG dùng `text-h3`. Tiêu đề của khối bước
                  chỉ 11px, nên một tiêu đề con 18px là to hơn tiêu đề cha: đúng lỗi thứ bậc chữ
                  Ban lãnh đạo khoanh đỏ 16/08/2026. */}
              <NhanPhanTrongGiaiDoan the="h2" icon={ShoppingCart}>
                Nhập đơn đặt hàng mới
              </NhanPhanTrongGiaiDoan>
              {/* Nói rõ vì sao người khác không thấy phần này — chỉ đạo 17/08/2026 *"chỉ ai được
                  cấp quyền thì mới xem được phần nhập liệu đó"*. Không có câu này thì người
                  dùng tưởng ai mở phiếu cũng lập được đơn.
                  Khi gập thì đổi thành lời mời bấm mở, để dòng tiêu đề không đứng trơ vô nghĩa. */}
              <span className="text-xs text-text-desc">
                {moNhapLieu
                  ? "Chỉ người được cấp quyền lập đơn thấy phần nhập liệu này. Nhập tay từng dòng, hoặc lấy sẵn từ file Excel bằng hai nút dưới bảng Hàng tiền."
                  : "Đã thu gọn — bấm để mở phần nhập liệu (nhập tay hoặc lấy từ file Excel)."}
              </span>
            </span>
          </button>
        ) : (
          /* 🔴 BỎ DẤU HAI CHẤM VÀ NÓI RÕ NÚT NẰM Ở ĐÂU — sửa 26/08/2026, ngay sau khi dời hai nút
             Excel xuống bảng. Câu cũ kết thúc bằng *"…từ file Excel:"*, mà dấu hai chấm trỏ vào
             cụm nút đứng ngay dưới nó — cụm nút nay không còn ở đó nữa. Để nguyên là câu dẫn trỏ
             vào chỗ trống, đúng kiểu "giao diện nói một đằng làm một nẻo" mà quy ước dự án cấm. */
          <p className="text-sm text-text-desc">
            Nhập tay từng dòng, hoặc lấy sẵn từ file Excel — hai nút{" "}
            <strong className="font-medium text-text-secondary">Tải file mẫu</strong> và{" "}
            <strong className="font-medium text-text-secondary">Nhập từ Excel</strong> nằm ngay
            dưới bảng Hàng tiền.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {/* 🔴 HAI NÚT EXCEL ĐÃ DỜI XUỐNG BẢNG "Hàng tiền" — Ban lãnh đạo 25/08/2026: *"Chỉ cần
              tạo import file ở mục này thôi"*, khoanh đúng vùng bảng.
              Lý do: việc chúng làm là **đổ dữ liệu vào cái bảng đó**, mà đứng ở đây thì cách bảng
              gần hai màn hình cuộn — bấm xong phải cuộn xuống mới biết có ăn không.
              ⚠️ ĐỪNG thêm lại vào đây. Nếu cần đổi chỗ lần nữa thì đổi chỗ TRUYỀN `nutNhapExcel`
              cho `BangHangTien`, giữ một bản duy nhất. */}
          {/* 📌 Hai nút trợ giúp KHÔNG gập theo phần nhập liệu: đọc hướng dẫn là việc làm được cả
              khi phần đó đang thu gọn — chính lúc chưa biết bắt đầu từ đâu thì mới cần hướng dẫn. */}
          {nutTroGiup}
        </div>
      </div>

      {/* 🔴 GẬP = ẨN BẰNG `hidden`, KHÔNG THÁO KHỎI CÂY REACT.
          Tháo là mất sạch mọi ô người dùng đang gõ dở — đúng bài học của `giuNoiDungKhiGap`
          ở khối bước. `display:none` cũng đưa nội dung ra khỏi thứ tự Tab và khỏi trình đọc
          màn hình, nên vẫn đúng nghĩa "đã thu gọn".

          Lớp `flex flex-col gap-…` phải chép đúng của `<section>` bao ngoài: thêm một lớp bọc
          vào giữa là khoảng cách giữa các khối bên trong mất nếu không khai lại. */}
      <div
        className={
          nhung && !moNhapLieu
            ? "hidden"
            : nhung
              ? "flex min-w-0 flex-col gap-(--hp-md-row-gap)"
              : "flex min-w-0 flex-col gap-(--hp-md-section)"
        }
      >
      {/* ===== DẢI THÔNG BÁO: ĐÂY CHỈ LÀ BẢN MẪU, KHÔNG LƯU VÀO HỆ THỐNG =====
          🔴 PHẢI NÓI RA NGAY Ở ĐẦU, đúng chỉ đạo 18/08/2026 *"chỉ cần tạo mẫu PO thôi, chưa
          cần lưu"*. Không nói thì người lập gõ xong cả đơn, bấm In, rồi tưởng đơn đã vào hệ
          thống — hôm sau đi tìm không thấy. Đó đúng là kiểu "giao diện hứa một việc app không
          làm" mà quy ước dự án cấm.

          📌 Giữ NGẮN (một câu in đậm + một câu giải thích): dải cảnh báo dài thì người ta bỏ
          qua, mà câu quan trọng nhất phải đọc được trong một nhịp mắt.

          ✅ CẬP NHẬT 29/08/2026: câu này CHỈ còn đúng cho người KHÔNG có `quyen.taoPoDoiLap`.
          Người có quyền (Trưởng bộ phận trở lên) đã cất được đơn thật ở trạng thái "Chờ đề
          nghị" — nói "không lưu vào hệ thống" với họ là ĐÚNG KIỂU LỖI mà dải này sinh ra để
          chống (giao diện nói một đằng, hàm làm một nẻo) — chỉ khác chiều, quên cập nhật khi
          mở lại đường cất đơn. Phát hiện bằng Playwright thật trước khi merge, không phải đoán. */}
      {laDonDocLap && !coQuyenTaoDocLapThat && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/50 bg-warning-bg p-(--hp-md-row-pad) text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-soft" aria-hidden />
          <span className="min-w-0 text-text-secondary">
            <strong className="text-text-primary">
              Mục này chỉ để in và xuất MẪU đơn mua hàng — không lưu vào hệ thống.
            </strong>{" "}
            Đơn ở đây <strong>không được cấp số</strong> và{" "}
            <strong>không có trong danh sách đơn hàng</strong>. Cần một đơn thật thì mở phiếu đề
            nghị ở{" "}
            <Link href="/de-nghi" className="font-medium text-primary hover:underline">
              Quy trình mua hàng
            </Link>{" "}
            rồi bấm “Lập đơn đặt hàng”.
          </span>
        </div>
      )}

      {/* ===== DẢI THÔNG BÁO: ĐÃ ĐỦ QUYỀN, CẤT ĐƯỢC NHƯNG SẼ "CHỜ ĐỀ NGHỊ" — thêm 29/08/2026.
          Đối xứng với dải trên: người CÓ quyền cũng cần biết trước khi gõ, chỉ khác nội dung —
          không phải "không lưu được", mà là "lưu được nhưng còn thiếu 1 bước". */}
      {laDonDocLap && coQuyenTaoDocLapThat && (
        <div className="flex items-start gap-2 rounded-lg border border-primary/40 bg-primary-bg p-(--hp-md-row-pad) text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 text-text-secondary">
            <strong className="text-text-primary">
              Đơn lập ở đây sẽ vào trạng thái &quot;Chờ đề nghị&quot; — lưu thật vào hệ thống, được
              cấp số, tính vào Công nợ nhà cung cấp.
            </strong>{" "}
            Chỉ khác PO thường ở chỗ chưa gắn phiếu đề nghị nào, nên không hiện trên bảng{" "}
            <Link href="/de-nghi" className="font-medium text-primary hover:underline">
              Quy trình mua hàng
            </Link>
            . Bổ sung đề nghị sau bằng nút &quot;+ Gắn đề nghị&quot; ở trang chi tiết đơn.
          </span>
        </div>
      )}

      {/* ===== DẢI THÔNG BÁO: đơn này là MỘT PHẦN tách ra từ bảng báo giá =====
          Không có dòng này thì người lập mở màn ra thấy số liệu tự có sẵn mà không hiểu
          vì sao, dễ tưởng app điền sai rồi xóa đi làm lại. */}
      {nguonTuBaoGia && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-primary/40 bg-primary-bg p-(--hp-md-row-pad) text-sm">
          <span className="flex items-start gap-2 text-text-secondary">
            <Split className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              Đơn này là <strong className="text-text-primary">một phần tách ra</strong> từ bảng
              báo giá <strong className="text-text-primary">{nguonTuBaoGia.maBaoGia}</strong>,
              phần của <strong className="text-text-primary">{nguonTuBaoGia.tenNCC}</strong> —{" "}
              {nguonTuBaoGia.soDong} mặt hàng đã điền sẵn khối lượng và đơn giá theo phân bổ.
              Phần khối lượng của các nhà cung cấp khác sẽ lập thành đơn riêng.
            </span>
          </span>
          {/* ⚠️ Nói ra số dòng bị bỏ. Bỏ lặng lẽ thì người lập tưởng đã đặt đủ phần của nhà
              cung cấp này, trong khi thực tế còn dòng chưa được đặt. */}
          {nguonTuBaoGia.soDongBoQua > 0 && (
            <span className="flex items-start gap-2 text-warning-soft">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Có <strong>{nguonTuBaoGia.soDongBoQua} mặt hàng</strong> trong phân bổ không đưa
                vào đơn được: đã lên đơn đủ khối lượng, chưa được phân bổ cho ai, hoặc đang do
                người khác phụ trách.
              </span>
            </span>
          )}
        </div>
      )}

      {/* --- "Tổng tiền thanh toán" CỠ LỚN ở góc trên phải ---
          🔴 ĐỂ NGOÀI KHỐI THÔNG TIN, đúng chỗ MISA đặt (18/08/2026): trên ảnh MISA con số này
          nằm NGOÀI vùng tô nền, ngang hàng với đỉnh khối. Trước đó app để bên trong thẻ.
          🔴 Chỉ hiện với người có quyền xem giá.
          📌 Khi nhúng thì hạ một bậc (`text-h3`): 22px trong một khối có tiêu đề 11px là lệch
          thứ bậc chữ y như lỗi 16/08/2026. Vẫn to hơn hẳn chữ thường 14px nên không mất tính
          nổi bật mà MISA muốn. */}
      {quyen.xemGia && (
        <div className="flex flex-wrap items-baseline justify-end gap-x-3 gap-y-1">
          <span className="text-sm text-text-desc">Tổng tiền thanh toán</span>
          <span
            className={`font-bold tabular-nums text-primary ${nhung ? "text-h3" : "text-h2"}`}
          >
            {tien.tongThanhToan.toLocaleString("vi-VN")} ₫
          </span>
        </div>
      )}

      {/* =========================================================================
          ★ MẪU IN ĐƠN MUA HÀNG — Ô ĐẦU TIÊN CỦA FORM (Ban lãnh đạo 24/08/2026:
          *"Đưa lên trên đầu và bố cục lại giao diện PO"*).

          🔴 VÌ SAO PHẢI ĐỨNG ĐẦU: mẫu in quyết định tờ đơn in ra như thế nào — chọn *Thỏa thuận
          mua bán* thì tờ in có thêm hai câu cam kết pháp lý ở cuối; chọn *Theo hợp đồng đã ký*
          thì tờ in dẫn hợp đồng đó và KHÔNG cam kết lại. Đó là quyết định về CĂN CỨ PHÁP LÝ của
          chứng từ, không phải một tuỳ chọn trình bày.

          Trước đây ô này nằm lẫn ở giữa cột phải của khối đầu tờ, sau "Loại tiền" — người lập gõ
          xong gần hết đơn mới thấy nó, và nếu chọn *theo hợp đồng* thì phải quay lên điền ghi chú
          hợp đồng ở khối trên. Đặt đầu form thì thứ tự thành thuận: chọn mẫu → biết cần điền gì → nhập.
          ========================================================================= */}
      <Card className="bg-primary-bg">
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          <div className="grid items-start gap-(--hp-md-card-gap) lg:grid-cols-2">
                {/**
                  * ★ CHỌN 1 TRONG 2 MẪU IN — Ban lãnh đạo 21/08/2026: *"e chỉnh sửa mẫu ở bước lập Po
                  * nha, có trường tuỳ chọn 1 trong 2 mẫu"*, kèm biểu mẫu `PO - DEMO 130826.xlsx`.
                  *
                  * 🔴 Hai mẫu KHÁC NHAU VỀ PHÁP LÝ, không phải khác cách trình bày:
                  *   · *Thỏa thuận mua bán* — chính tờ đơn có giá trị như hợp đồng, nên tờ in có thêm
                  *     hai câu cam kết cố định ở cuối.
                  *   · *Theo hợp đồng đã ký* — điều khoản nằm ở hợp đồng nguyên tắc, tờ in dẫn lại hợp
                  *     đồng đó (nguyên văn ghi chú người lập gõ) và KHÔNG cam kết lại.
                  * Vì vậy chọn sai mẫu là gửi cho nhà cung cấp một chứng từ nói sai về căn cứ pháp lý —
                  * mô tả bên dưới ô chọn nói rõ điều đó ngay lúc chọn.
                  */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="mau-po">Mẫu in đơn mua hàng *</Label>
                  <select
                    id="mau-po"
                    value={mauPO}
                    onChange={(e) => setMauPO(e.target.value as MauDonMuaHang)}
                    className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors hover:border-primary focus:border-primary focus:outline-none"
                  >
                    {(Object.keys(NHAN_MAU_PO) as MauDonMuaHang[]).map((m) => (
                      <option key={m} value={m}>
                        {NHAN_MAU_PO[m].nhan}
                      </option>
                    ))}
                  </select>
                  {/**
                    * ★ MỘT CÂU NGẮN, KHÔNG GIẢNG GIẢI — Ban lãnh đạo 27/08/2026: *"Chỉ cần ghi
                    * chú: Chọn biểu mẫu PO phù hợp"*, khoanh đúng hai dòng chữ từng đứng ở đây.
                    *
                    * 🔴 HAI DÒNG BỎ ĐI GIẢI THÍCH THỨ NGƯỜI LẬP KHÔNG CẦN LÚC NÀY: một dòng mô tả
                    * mẫu đang chọn dẫn hợp đồng ra sao, một dòng báo trước tờ in sẽ chừa dải chấm
                    * khi ô ghi chú để trống. Cả hai đều đúng, nhưng chúng trả lời câu hỏi *"tờ in
                    * ra thế nào"* — trong khi ở ngay ô chọn mẫu, việc duy nhất cần làm là CHỌN.
                    * Chữ đúng mà đặt sai lúc thì cũng là chữ phải đọc lướt qua.
                    *
                    * 📌 Thông tin không mất: tên hai mẫu đã tự nói (*"ĐƠN MUA HÀNG"* vs *"ĐƠN MUA
                    * HÀNG / THOẢ THUẬN MUA BÁN"*), còn việc để trống ô ghi chú thì tờ in ra chừa
                    * chấm — câu đó đã có sẵn ngay dưới chính ô "Theo hợp đồng".
                    *
                    * ⚠️ `NHAN_MAU_PO[...].moTa` KHÔNG XOÁ khỏi kiểu dữ liệu: trước khi bỏ phải kiểm
                    * còn nơi nào đọc không. Hiện chỉ chỗ này đọc, nhưng để nguyên thì bật lại được
                    * mà không phải viết lại hai câu mô tả pháp lý.
                    */}
                  <p className="text-xs text-text-desc">Chọn biểu mẫu PO phù hợp.</p>
                </div>

            {/* Cột phải để trống có chủ ý: khối này chỉ có MỘT quyết định, nhồi thêm ô vào cạnh
                là làm loãng đúng thứ cần được chú ý đầu tiên. */}
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
          ① ĐẦU TỜ ĐƠN — bám đúng khối đầu của biểu mẫu công ty (PO - DEMO 130826.xlsx)

          🔴 BỐ CỤC LẠI 23/08/2026 — Ban lãnh đạo: *"a vẫn thấy tab lập PO là giao diện cũ giống
          misa"*, rồi nói rõ yêu cầu: *"A cần e bố cục lại giống theo form mẫu PO để dễ dàng nhập
          liệu cho người mới"*.

          TRƯỚC: lưới 3 cột dày đặc dựng theo ảnh MISA, thứ tự ô KHÔNG theo tờ giấy — người mới
          vừa nhập vừa phải nhảy mắt qua lại ba cột, và không dò được theo tờ đơn đang cầm tay.

          NAY: đọc DỌC đúng trình tự tờ đơn, mỗi khối là một phần của tờ:
            ① đầu tờ · ② bảng hàng · ③ khối tiền · ④ giao nhận và điều khoản · ⑤ nội bộ.

          Khối này = phần đầu tờ, chia hai cột ĐÚNG NHƯ TRÊN GIẤY:
            · trái = BÊN BÁN   (Tên nhà cung cấp · Địa chỉ · Mã số thuế — ô B6 · B7 · B8)
            · phải = CHỨNG TỪ  (Ngày · Số · Loại tiền — ô J6 · J7 · J8)
          rồi một dòng riêng "Theo hợp đồng: …" (ô B9) — nội dung do người lập gõ tay, đúng chỗ
          của nó trên giấy.

          🔴 NHỮNG Ô KHÔNG THUỘC ĐẦU TỜ ĐÃ DỜI ĐI, KHÔNG BỊ BỎ — đừng thêm lại vào đây:
            · Ngày giao hàng · Điều khoản thanh toán · Số ngày được nợ → khối ④, vì trên tờ chúng
              nằm ở phần giao nhận (ô B26 · B29/B30), không nằm ở đầu tờ.
            · Nhân viên mua hàng · Tham chiếu → khối ⑤: hai ô này KHÔNG có trên tờ đơn gửi nhà
              cung cấp, để lẫn ở đầu tờ là người nhập tưởng chúng sẽ được in.

          🔴 NỀN XANH RẤT NHẠT PHỦ KÍN KHỐI bằng TOKEN CỦA CÔNG TY: `bg-primary-bg` =
          `color-mix(--hp-primary 12%, transparent)` ở Sáng và `20%` ở Tối. Vì `--hp-primary` =
          #096AA7 nên ra xanh DƯƠNG nhạt theo V1.1 (Ban lãnh đạo 16/08/2026: *"Về màu sắc thì vẫn
          theo design system"*), và người dùng đổi màu chủ đạo thì nền này đi theo.
          ========================================================================= */}
      <Card className="bg-primary-bg">
        {/* 🔴 `[&_input]:bg-card` — Ô NHẬP PHẢI NỔI TRÊN NỀN ĐÃ TÔ, đúng như MISA (ô trắng trên
            khối nền nhạt). `Input` của bộ nền tảng mặc định `bg-transparent`, nên nếu không khai
            lại thì cả ô lẫn nền cùng một màu: người dùng không thấy đâu là chỗ gõ được.
            📌 Khai MỘT LẦN ở đây thay vì thêm class vào từng ô: khối này có hơn mười ô, sửa từng
            cái là chắc chắn bỏ sót một hai chỗ rồi trông chắp vá.
            📌 Vẫn là token (`bg-card` = `--hp-card`), không hardcode màu, và tự đúng ở cả Sáng
            (#ffffff) lẫn Tối (#182531).
            ⚠️ Ô bị khóa (`disabled`) KHÔNG bị ảnh hưởng: lớp `disabled:bg-input/50` của `Input`
            có độ ưu tiên cao hơn lớp con-cháu này, nên ô "Nhân viên mua hàng" và "Số đơn hàng"
            vẫn trông đúng là ô chỉ đọc.

            🔴 PHẢI KHAI CẢ `dark:[&_input]:bg-card`, và đây KHÔNG phải viết thừa. `Input` có sẵn
            `dark:bg-input/30`; lớp đó là `.dark .bg-input\/30` (độ ưu tiên 0,2,0) nên nó THẮNG lớp
            con-cháu `[&_input]:bg-card` (0,1,1) — đo trên trình duyệt ở chế độ Tối thì ô nhập ra
            màu trắng 2,35% chứ không phải `--hp-card`, tức là ô gần như tan vào nền đã tô. Bản
            `dark:` sinh ra selector 0,2,1 nên mới đè lại được. Đã đo lại sau khi sửa. */}
        <CardContent className="flex flex-col gap-(--hp-md-card-gap) [&_input]:bg-card dark:[&_input]:bg-card">
          <div className="grid gap-(--hp-md-card-gap) lg:grid-cols-2">
            {/* ===== TRÁI — BÊN BÁN (ô B6 · B7 · B8 của biểu mẫu) =====

                🔴🔴 BA HÀNG NÀY PHẢI THẲNG ĐÚNG BA DÒNG CỦA TỜ IN — Ban lãnh đạo 25/08/2026:
                *"Bố cục các trường nhập liệu này giống mẫu PO để người dùng dễ hình dung và thao
                tác"*, kèm ảnh tờ đơn.

                      TỜ IN                        FORM (phải khớp từng hàng)
                  Tên nhà cung cấp │ Ngày      →   Tên nhà cung cấp │ Ngày đơn hàng
                  Địa chỉ          │ Số        →   Địa chỉ          │ Số đơn hàng
                  Mã số thuế       │ Loại tiền →   Mã số thuế       │ Loại tiền

                ⚠️ TRƯỚC ĐÂY "Mã nhà cung cấp" CHIẾM NGUYÊN HÀNG 1, nên **mọi hàng lệch xuống một
                dòng**: người cầm tờ giấy dò sang màn hình thấy "Mã NCC ↔ Ngày", "Tên NCC ↔ Số"…
                — không hàng nào khớp hàng nào. Đó đúng là chỗ khó mà chỉ đạo trên yêu cầu bỏ.

                📌 Ô mã KHÔNG BỊ BỎ, chỉ GỘP VÀO CÙNG HÀNG với "Tên nhà cung cấp". Nó là ô TRA
                DANH MỤC (gõ trúng mã là điền hộ tên · địa chỉ · mã số thuế), nên phải đứng TRƯỚC
                ba ô đó — đẩy xuống dưới thì người nhập gõ tay xong mới thấy, tức là vô ích. Đứng
                cùng hàng thì vừa giữ được công dụng, vừa không chiếm một dòng của tờ giấy.

                📌 Tờ in không có ô mã, nên nó không có nhãn riêng — dùng `aria-label` + `title`
                cho trình đọc màn hình, và placeholder `NCC0001` đã nói rõ phải gõ gì. */}
            <div className="flex flex-col gap-(--hp-md-card-gap)">
              {/* `sm:col-span-2`: mục này CHIẾM CẢ HÀNG. Cột phải của mục chứa tới ba thứ (ô mã ·
                  nút sổ danh mục · ô tên) — nhét vào nửa lưới thì ô tên bị đẩy xuống dòng thứ hai
                  và nhãn không còn thẳng hàng với nó. Đã đo: lệch 52px trước khi cho span. */}
              <div className="muc-ngang sm:col-span-2">
                <Label htmlFor="ten-ncc">Tên nhà cung cấp</Label>
                {/* ===== Ô TRA MÃ + NÚT SỔ XUỐNG =====
                    ✅ NÚT SỔ XUỐNG LÀM VIỆC THẬT: nó mở đúng danh mục nhà cung cấp của app
                    (`nhaCungCap` trong `useDuLieu()`), chọn một dòng là điền cả cụm ô.

                    🔴 KHÔNG CÓ NÚT "+" NHƯ MISA. MISA có nút thêm nhanh nhà cung cấp; app này
                    **không có một hàm nào ghi vào danh mục nhà cung cấp** — `nhaCungCap` là hằng
                    số `NHA_CUNG_CAP` và trong toàn bộ mã nguồn không tồn tại `themNhaCungCap`.
                    Vẽ nút "+" ra là một cái nút bấm không có chỗ ghi, đúng thứ quy ước dự án cấm.
                    Không mất việc: ô "Tên nhà cung cấp" cho gõ tự do, đơn vẫn lập được với nhà
                    cung cấp ngoài danh mục (chỉ đạo 10/08/2026 — lấy NCC theo file PO). */}
                {/**
                  * 🔴 ĐÃ BỎ Ô "MÃ NHÀ CUNG CẤP" — Ban lãnh đạo 27/08/2026: *"các trường nhập số
                  * liệu này cũng phải giống 100% mẫu … nội dung nào khác thì bỏ hết"*.
                  *
                  * Ô đó KHÔNG có trên biểu mẫu giấy và cũng không in ra tờ A4 ở bất kỳ chỗ nào —
                  * nó chỉ là một lối tắt: gõ đúng mã thì app điền hộ tên / MST / địa chỉ. Việc đó
                  * nút sổ danh mục ngay cạnh làm được y nguyên (cùng gọi `dienNhaCungCap`), nên bỏ
                  * ô KHÔNG mất chức năng nào.
                  *
                  * 📌 Bỏ ô còn chữa đúng cái Sếp chỉ ở việc bố cục ngang: ba thứ (mã · nút · tên)
                  * chật quá nên ô TÊN bị đẩy xuống dòng hai, lệch 52px so với nhãn. Nay còn hai
                  * thứ, ô tên nằm thẳng hàng với nhãn.
                  *
                  * ⚠️ STATE `maNCC` VẪN GIỮ, ĐỪNG DỌN THEO: nó còn được ghi vào FILE EXCEL gửi nhà
                  * cung cấp (ô "Mã nhà cung cấp:" hàng 7) và còn nhận giá trị từ bốn đường khác —
                  * chọn NCC trong danh mục, đọc file Excel vào, thêm NCC mới, dọn form.
                  */}
                <div className="flex flex-wrap items-center gap-2">
                  <Popover>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          /* Vùng chạm 44×44 (V1.1 Phần F) — nút nhỏ hơn thì trên máy tính bảng
                             bấm không trúng. */
                          /* `order-1`: nút sổ đứng SAU ô tên. Trước đây thứ tự là [ô mã][nút][ô
                             tên]; bỏ ô mã ngày 27/08/2026 thì nút thành cái đứng đầu hàng — trông
                             như một nút mồ côi, và khác thứ tự của khối "Người nhận hàng" ngay
                             dưới (ô rồi mới tới nút). Đẩy bằng `order` để không phải dời cả khối
                             `Popover` dài 80 dòng xuống dưới. */
                          className="order-1 flex size-11 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-primary hover:text-primary"
                          aria-label="Chọn nhà cung cấp từ danh mục"
                          title="Chọn nhà cung cấp từ danh mục"
                        >
                          <ChevronDown className="size-4" aria-hidden />
                        </button>
                      }
                    />
                    <PopoverContent align="start" className="w-80">
                      <p className="text-xs text-text-desc">
                        Danh mục nhà cung cấp — chọn một dòng để điền mã, tên, mã số thuế, địa chỉ
                        và người liên hệ.
                      </p>
                      {nhaCungCap.length === 0 ? (
                        <p className="text-sm text-text-secondary">
                          Danh mục đang trống. Gõ thẳng tên nhà cung cấp ở ô bên cạnh — đơn vẫn
                          lập được.
                        </p>
                      ) : (
                        <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
                          {nhaCungCap.map((n) => (
                            /* Hàng gồm hai phần: bấm vào phần chữ là CHỌN, nút thùng rác bên
                               phải là XÓA. Tách rõ để không bấm chọn mà thành xóa. */
                            <li key={n.id} className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => dienNhaCungCap(n)}
                                className="flex min-h-11 min-w-0 flex-1 flex-col items-start gap-0.5 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-primary-bg"
                              >
                                <span className="text-sm font-medium text-text-primary">
                                  {n.maNCC ? `${n.maNCC} — ` : ""}
                                  {n.ten}
                                </span>
                                {n.maSoThue && (
                                  <span className="text-xs text-text-desc">
                                    MST {n.maSoThue}
                                  </span>
                                )}
                              </button>
                              {/* ★ XÓA KHỎI DANH MỤC — Ban lãnh đạo 21/08/2026.
                                  🔴 Hỏi lại trước khi xóa, và tầng dữ liệu còn CHẶN nếu nhà cung
                                  cấp đang có đơn đặt hàng — xem `xoaNhaCungCap`. */}
                              <button
                                type="button"
                                title={`Xóa ${n.ten} khỏi danh mục`}
                                onClick={() => setHoiXoaNCC(n)}
                                className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-text-desc transition-colors hover:bg-danger-bg hover:text-danger"
                              >
                                <Trash2 className="size-4 shrink-0" aria-hidden />
                                <span className="sr-only">Xóa {n.ten} khỏi danh mục</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* ★ THÊM NHÀ CUNG CẤP NGAY TẠI ĐÂY — Ban lãnh đạo 20/08/2026: *"tạo danh
                          mục NCC do bộ phận thu mua điền thông tin"*.
                          🔴 Đặt TRONG danh mục, không phải một nút riêng ở đâu khác: người dùng
                          mở danh mục ra, không thấy bên mình cần, thì đúng lúc đó mới cần thêm.
                          Bắt họ đóng lại rồi đi tìm nút khác là mời họ gõ tay cho xong. */}
                      <button
                        type="button"
                        onClick={() => {
                          setMoThemNCC(true);
                          /* Tên đã gõ ở ô bên cạnh thì mang sang, đỡ gõ lại. */
                          setNccMoi((c) => ({ ...c, ten: c.ten || tenNCC }));
                        }}
                        className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-lg border border-dashed border-border px-2.5 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary-bg"
                      >
                        <Plus className="size-4 shrink-0" aria-hidden />
                        Thêm nhà cung cấp mới vào danh mục
                      </button>
                    </PopoverContent>
                  </Popover>

                  {/* ★ Ô TÊN NẰM CÙNG HÀNG với ô mã và nút sổ (25/08/2026) — nhãn của cả hàng là
                      "Tên nhà cung cấp", đúng dòng đầu tiên của tờ in.
                      📌 `min-w-48 flex-1`: chiếm hết chỗ còn lại, và khi hàng chật thì `flex-wrap`
                      của cha đưa nó xuống dòng thay vì bóp còn vài chục pixel. */}
                  <Input
                    id="ten-ncc"
                    value={tenNCC}
                    onChange={(e) => setTenNCC(e.target.value)}
                    placeholder="CÔNG TY TNHH ..."
                    className="min-w-48 flex-1"
                  />
                </div>
                {/* Cho biết có tra ra trong danh mục hay không — hữu ích để quản trị bổ sung
                    sau, nhưng KHÔNG chặn lập đơn. */}
                {tenNCC.trim() !== "" && (
                  <span className="text-xs text-text-desc">
                    {supplierId
                      ? `Đã liên kết với “${nhaCungCap.find((n) => n.id === supplierId)?.ten}” trong danh mục.`
                      : "Chưa có trong danh mục — vẫn lập được đơn, thông tin lấy theo những ô trên."}
                  </span>
                )}
              </div>

              <div className="muc-ngang">
                <Label htmlFor="dia-chi-ncc">Địa chỉ</Label>
                <Input
                  id="dia-chi-ncc"
                  value={diaChiNCC}
                  onChange={(e) => setDiaChiNCC(e.target.value)}
                  placeholder="Số ..., đường ..., tỉnh ..."
                />
              </div>

              <div className="muc-ngang">
                <Label htmlFor="mst-ncc">Mã số thuế</Label>
                <Input
                  id="mst-ncc"
                  value={mstNCC}
                  onChange={(e) => setMstNCC(e.target.value)}
                  placeholder="0300000001"
                  inputMode="numeric"
                />
              </div>

              {/* 🔴 Ô "Người liên hệ" ĐÃ BỎ — Ban lãnh đạo 24/08/2026: *"Bỏ thông tin này"*.
                  Bên mua liên hệ nhà cung cấp qua kênh riêng, không cần lưu vào chứng từ đơn.

                  📌 Trường `nguoiLienHeNCC` VẪN GIỮ trong `3-du-lieu/kieu-du-lieu.ts` và vẫn được
                  `2-quy-trinh/ghi-don-hang-excel.ts` in ra — cố ý: đơn lập TRƯỚC 24/08 đã có giá
                  trị, xoá trường là mất dữ liệu đã lưu và tờ Excel của đơn cũ hụt một dòng.
                  `datNhanCoGiaTri` chỉ in khi có giá trị, nên đơn mới không còn dòng đó. */}
            </div>

            {/* ===== PHẢI — CHỨNG TỪ (ô J6 · J7 · J8 của biểu mẫu) ===== */}
            <div className="flex flex-col gap-(--hp-md-card-gap)">
              <div className="muc-ngang">
                <Label htmlFor="ngay-don-hang">Ngày đơn hàng</Label>
                <Input
                  id="ngay-don-hang"
                  type="date"
                  value={ngayDonHang}
                  onChange={(e) => setNgayDonHang(e.target.value)}
                  className="w-48"
                />
              </div>

              {/* 📌 Ô "Dự án / Công trình" ĐÃ DỜI XUỐNG KHỐI ⑤ (thông tin nội bộ) ngày
                  27/08/2026 — Ban lãnh đạo: *"các trường nhập số liệu này cũng phải giống 100%
                  mẫu … nội dung nào khác thì bỏ hết"*. Ô đó không có trên biểu mẫu giấy và không
                  in ra tờ đơn, nên không thuộc khối đầu tờ. Đừng đưa lại lên đây. */}

              <div className="muc-ngang">
                <Label htmlFor="so-don-hang">Số đơn hàng</Label>
                {/**
                  * ★ KÝ HIỆU `DMH[năm]-[0000]` — Ban lãnh đạo 23/08/2026: *"Số đơn hàng này sẽ ký
                  * hiệu như sau: DMH + năm + số nhảy tự động 0000"*. Đúng ký hiệu in sẵn trên biểu
                  * mẫu giấy (ô K7: `DMH.......`). Luật ở `2-quy-trinh/dat-ma-don-hang.ts`.
                  *
                  * 🔴 KHÔNG CHO GÕ VÀ KHÔNG ĐOÁN TRƯỚC CON SỐ. `themDonHang` cấp số lúc CẤT, nên
                  * đoán ở đây là hai người cùng lập một lúc sẽ thấy cùng một số, rồi đơn cất ra
                  * mang số khác cái vừa hiện. Bày phần KHUÔN (`DMH2026-…`) là đủ để người lập yên
                  * tâm mà không nói một con số có thể sai.
                  *
                  * 🔴 NĂM LẤY THEO Ô "NGÀY ĐƠN HÀNG" trên form, không theo hôm nay — cùng lý do
                  * với `namCuaNgay`: đơn lập bù cho năm trước phải mang số của năm ghi trên chứng
                  * từ. Đổi ngày đơn hàng thì khuôn hiện ở đây đổi theo, đúng như lúc cất.
                  *
                  * ★ CHẾ ĐỘ MẪU (không `quyen.taoPoDoiLap`) KHÔNG CÓ SỐ, và tuyệt đối KHÔNG được
                  * chiếm một số thật trong dãy: chiếm số rồi không cất là **thủng một số** — đơn
                  * cất sau nhảy số và người đối chiếu chứng từ giấy không hiểu vì sao thiếu. Nặng
                  * hơn: một số chứng từ nhìn như thật in lên tờ giấy có thể gửi ra ngoài, trong
                  * khi hệ thống không có đơn nào mang số đó. Vì vậy ô này ghi thẳng một câu chữ
                  * (`SO_DON_BAN_MAU`), nhìn là biết không phải số thật.
                  *
                  * ✅ CẬP NHẬT 29/08/2026: độc lập + `quyen.taoPoDoiLap` GIỜ CẤT ĐƯỢC và ĐƯỢC CẤP
                  * SỐ THẬT (`themDonHang` → `maDonHangTiepTheo`, giống hệt chế độ có đề nghị) —
                  * hiện khuôn xem trước `DMH2026-…` như chế độ có đề nghị, không còn ghi
                  * `SO_DON_BAN_MAU` (câu đó giờ CHỈ đúng cho người không đủ quyền, vẫn ở chế độ
                  * mẫu thật sự).
                  */}
                {/**
                  * ❌ ĐÃ BỎ dòng ghi chú dưới ô (Ban lãnh đạo 23/08/2026: *"Bỏ ghi chú ở dưới đi"*).
                  *
                  * 📌 Không mất thông tin nào: chính ô đã hiện khuôn `DMH26…`, nhìn là biết số sẽ
                  * ra dạng gì. Riêng CHẾ ĐỘ MẪU (không đủ quyền) thì giữ một câu — ở đó ô ghi
                  * "(bản mẫu — chưa cấp số)", và nếu không nói rõ *"số chỉ cấp khi lập đơn thật"*
                  * thì người lập tưởng app hỏng chỗ cấp số.
                  */}
                <Input
                  id="so-don-hang"
                  value={
                    laDonDocLap && !coQuyenTaoDocLapThat
                      ? SO_DON_BAN_MAU
                      : `${TIEN_TO_DON_HANG}${namCuaNgay(ngayDonHang) || "[năm]"}…`
                  }
                  readOnly
                  disabled
                  className={laDonDocLap && !coQuyenTaoDocLapThat ? "w-72" : "w-56"}
                />
                {laDonDocLap && !coQuyenTaoDocLapThat && (
                  <span className="text-xs text-text-desc">
                    Bản mẫu không được cấp số. Số đơn hàng chỉ cấp khi lập đơn thật từ phiếu đề
                    nghị.
                  </span>
                )}
              </div>

              {/**
                * ★ LOẠI TIỀN — ô "Loại tiền: VND" của biểu mẫu công ty, đặt ngay dưới "Số" đúng
                * như trên giấy (Ban lãnh đạo 23/08/2026: *"đủ các trường thông tin như vậy"*).
                *
                * 🔴 Trước đây app ghi cứng "VND" lúc cất đơn — tờ in vẫn ra đúng, nhưng người lập
                * không có chỗ nào đổi. Đơn nhập khẩu trả bằng USD thì chứng từ in sai đơn vị tiền
                * mà không sửa được từ giao diện.
                *
                * 📌 Ô gõ tự do chứ không phải danh sách chọn: app không có danh mục tiền tệ, và
                * bịa ra một danh mục (VND/USD/EUR…) là tự đặt dữ liệu nghiệp vụ — thứ phải do công
                * ty cấp. Gõ tự do thì cần đồng nào cũng ghi được.
                */}
              <div className="muc-ngang">
                <Label htmlFor="loai-tien">Loại tiền</Label>
                <Input
                  id="loai-tien"
                  value={loaiTien}
                  onChange={(e) => setLoaiTien(e.target.value)}
                  placeholder="VND"
                  className="w-40"
                />
              </div>


              {/* 🔴 CHẾ ĐỘ MẪU (không `quyen.taoPoDoiLap`) KHÔNG CÓ Ô "TÌNH TRẠNG" — bản mẫu
                  không tồn tại trong hệ thống nên nó không ở trạng thái nào. Bày một trạng thái
                  lên thứ không được lưu là đúng kiểu "giao diện hứa một việc app không làm" mà
                  quy ước dự án cấm.
                  ✅ CẬP NHẬT 29/08/2026: độc lập + `quyen.taoPoDoiLap` GIỜ CẤT ĐƯỢC (vào
                  `"cho_de_nghi"`) nên ô này phải hiện — ẩn đi là đúng lỗi ngược lại, hứa app
                  "không lưu gì" trong khi bấm Lưu là lưu thật. */}
              {(!laDonDocLap || coQuyenTaoDocLapThat) && (
                <div className="muc-ngang">
                  {/* ⚠️ KHÔNG có `htmlFor` ở đây, và đó là cố ý. Chỗ hiện tình trạng là một
                      `<div>` chứa badge, không phải ô nhập — `<label for="…">` trỏ vào một
                      thẻ không nhập được thì bấm vào nhãn KHÔNG đưa con trỏ đi đâu cả, mà trình
                      đọc màn hình cũng không nối được hai thứ. Trước 18/08/2026 chỗ này ghi
                      `htmlFor="tinh-trang"` trỏ vào `<div id="tinh-trang">`: một liên kết chết.
                      Chữ trạng thái đã nằm ngay trong badge (V1.1 — trạng thái luôn có cả màu
                      lẫn chữ) nên không mất thông tin nào. */}
                  <Label>
                    Tình trạng <span className="text-danger">*</span>
                  </Label>
                  {/* 🔴 CHỈ ĐỌC. MISA cho chọn tình trạng tự do; app này có quy trình trạng thái
                      riêng đã chốt. Bày một ô chọn rồi bỏ qua giá trị người dùng chọn cũng là
                      kiểu "giao diện hứa một việc app không làm". Trạng thái đổi ở màn chi tiết
                      đơn. Độc lập dùng badge tím riêng (`BadgeChoDeNghi`) — StatusBadge không có
                      tông màu riêng cho trạng thái cục bộ này, xem `trang-thai.ts`. */}
                  <div className="flex min-h-11 items-center">
                    {laDonDocLap ? (
                      <BadgeChoDeNghi />
                    ) : (
                      <StatusBadge label={nhanTrangThai.nhan} tone={nhanTrangThai.tong} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ★ "Theo hợp đồng: …" — ô B9 của biểu mẫu, MỘT DÒNG RIÊNG dưới hai cột, đúng như
              trên giấy. Chỉ mẫu *Đơn mua hàng theo hợp đồng* in dòng này, nhưng ô vẫn hiện ở cả
              hai mẫu: người nhập chọn mẫu sau khi đã gõ, ẩn đi là mất dữ liệu vừa gõ mà không có
              câu nào báo.

              🔴 Ô GHI CHÚ TỰ DO, KHÔNG PHẢI Ô "SỐ HỢP ĐỒNG" — Ban lãnh đạo 27/08/2026: *"Dòng
              theo hợp đồng sẽ nhập thủ công, e để sẵn ô để ghi chú"*. Trước đây đây là HAI ô (số
              hợp đồng + ô chọn ngày) rồi app tự ghép thành *"<số> · Ký ngày <ngày>"*. Nay gõ gì
              in nấy, nên bỏ ô chọn ngày: giữ lại một ô mà tờ in không dùng tới chính là kiểu
              giao diện hứa một việc app không làm.

              ⚠️ GIỮ MỘT DÒNG, ĐỪNG ĐỔI SANG Textarea. Giá trị này còn đi ra ô Excel gộp và đi
              sang app QLK CTR; ký tự xuống dòng ở hai chỗ đó hiển thị không lường trước được. */}
          <div className="muc-ngang">
            <Label htmlFor="hop-dong">Theo hợp đồng — ghi chú in lên tờ đơn</Label>
            <Input
              id="hop-dong"
              value={maHopDong}
              onChange={(e) => setMaHopDong(e.target.value)}
              placeholder="VD: HĐ số 089/2026/HĐKT-HPC ký ngày 01/08/2026"
            />
            <p className="text-[13px] text-text-secondary">
              Gõ nguyên văn phần muốn in sau chữ <strong>&quot;Theo hợp đồng:&quot;</strong>. Để
              trống thì tờ in chừa sẵn chỗ chấm để viết tay.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================================
          ② BẢNG "HÀNG TIỀN"
          ========================================================================= */}
      <Card>
        <CardContent className="flex min-w-0 flex-col gap-(--hp-md-card-gap)">
          <BangHangTien
            dong={dongBang}
            tien={tien}
            xemGia={quyen.xemGia}
            conLai={conLaiTheoDong}
            kieuChietKhau={kieuChietKhau}
            tyLeChietKhau={tyLeChietKhau}
            chietKhau={chietKhau}
            onDoiDong={doiDong}
            onXoaDong={xoaDong}
            onThemDong={themDong}
            onChenDongDuoi={chenDongDuoi}
            onThemGhiChu={themGhiChu}
            /* Hai nút Excel dời về cụm nút của bảng (Ban lãnh đạo 25/08/2026) — xem chú thích ở
               chỗ dựng `nutNhapExcel` và ở `BangHangTien`. */
            nutNhapExcel={nutNhapExcel}
            onXoaHetDong={() => setHoiXoaHetDong(true)}
            onDoiKieuChietKhau={setKieuChietKhau}
            onDoiTyLeChietKhau={setTyLeChietKhau}
            onDoiChietKhau={setChietKhau}
            /* Độc lập thì luôn thêm được dòng mới — không có danh sách mặt hàng nào để cạn. */
            conMatHangDeThem={laDonDocLap || matHangConThem.length > 0}
            lyDoHetMatHang={lyDoHetMatHang}
            nhapTuDo={laDonDocLap}
            /* Khi nhúng thì tiêu đề "Hàng tiền" phải nhỏ hơn tiêu đề khối bước — lý do như
               khối "Tổng tiền thanh toán" ở trên. */
            tieuDeTrongKhoiGiaiDoan={nhung}
            /* 🔴 F3 CHỈ BẮT PHÍM Ở TRANG RIÊNG — cùng một lý do đã áp cho F9 ngay dưới: nhúng
               trong trang chi tiết đề nghị thì phím tắt sẽ cướp phím của ô bình luận và bảng
               phân bổ. Ô tìm vẫn bấm được bằng chuột ở cả hai chỗ. */
            batPhimTat={!nhung}
          />

          {quyen.xemGia && (
            <div className="flex flex-wrap items-end gap-3 border-t border-divider pt-(--hp-md-card-gap)">
              <div className="flex flex-col gap-2">
                <Label htmlFor="vat-chung">Thuế suất GTGT chung (%)</Label>
                <Input
                  id="vat-chung"
                  type="number"
                  min={0}
                  max={100}
                  value={thueSuat}
                  onChange={(e) => setThueSuat(e.target.value)}
                  className="w-32"
                />
              </div>
              <p className="pb-2 text-xs text-text-desc">
                Áp cho mọi dòng bỏ trống cột <strong>% Thuế GTGT</strong>. Đơn trộn nhiều mức
                thì ghi riêng ở từng dòng.
              </p>
            </div>
          )}

          {/* 📌 DÒNG "F3 - Tìm nhanh, F9 - Thêm nhanh" của MISA — 18/08/2026 ĐÃ ĐỦ CẢ HAI.
              🔴 F3 trước đây bị bỏ vì màn không có ô tìm nào để mở; nay bảng Hàng tiền đã có ô
              tìm thật nên F3 làm việc thật (xem `BangHangTien`).
              🔴 CHỈ RAO KHI CÓ THẬT: nhúng trong trang thì app KHÔNG bắt hai phím này (sẽ cướp
              phím của ô bình luận, bảng phân bổ…), nên dòng chữ cũng không được hiện. */}
          {!nhung && (
            <p className="text-xs text-text-desc">
              F3 — tìm nhanh trong bảng · F9 — thêm nhanh một mặt hàng vào bảng.
            </p>
          )}
        </CardContent>
      </Card>

      {/* =========================================================================
          ③ KHỐI TIỀN — NGAY DƯỚI BẢNG VÀ CANH PHẢI, đúng như tờ giấy (ô I19 → I22)

          🔴 TRƯỚC ĐÂY khối này là NỬA PHẢI của một lưới 2 cột, nằm ngang hàng với khối giao nhận
          — tức là số tiền của đơn bị đặt cạnh ô "Địa điểm giao hàng", cách bảng hàng cả một khối.
          Trên tờ giấy thì bốn dòng tiền nằm SÁT ĐÁY BẢNG, thẳng cột Thành tiền. Người mới dò theo
          tờ giấy sẽ không tìm ra tổng tiền ở nửa bên kia màn hình.

          📌 `ml-auto max-w-xl`: canh phải và hẹp lại đúng như trên giấy (bốn dòng nhãn trái / số
          phải), thay vì trải hết bề ngang thành một dải số lạc lõng.
          📌 KHÔNG có viền và KHÔNG có tiêu đề "Tổng hợp" — tờ giấy cũng không có.
          ========================================================================= */}
      <div className="ml-auto flex w-full max-w-xl flex-col gap-(--hp-md-card-gap)">
        {quyen.xemGia ? (
          <>
            {/**
              * ★ BỐN DÒNG THEO ĐÚNG THỨ TỰ VÀ ĐÚNG CHỮ CỦA BIỂU MẪU (23/08/2026 — Ban lãnh đạo:
              * *"tạo các trường nhập liệu giống 100% file PO mẫu"*):
              *
              *   ô I19  Số tiền Chiết khấu
              *   ô I20  Cộng tiền hàng (sau trừ chiết khấu)
              *   ô I21  Tiền thuế GTGT          (nhãn thuế suất nằm ở ô B21 cùng dòng)
              *   ô I22  Tổng tiền thanh toán
              *   ô B23  Số tiền viết bằng chữ
              *
              * 🔴 TRƯỚC ĐÂY SAI CẢ THỨ TỰ LẪN NGHĨA: dòng đầu ghi *"Tổng tiền hàng"* rồi mới trừ
              * chiết khấu ở dòng sau. Trên tờ giấy thì chiết khấu đứng TRƯỚC, và dòng kế tiếp là
              * **tiền hàng ĐÃ TRỪ chiết khấu**. Người đối chiếu tờ in với màn hình thấy hai con số
              * cùng tên "tiền hàng" mà khác giá trị.
              *
              * ⚠️ `tien.congTienHang` LÀ SỐ ĐÃ TRỪ CHIẾT KHẤU (xem `tinhTienChiTiet`), nên nó khớp
              * đúng ô I20 — đừng đổi nhãn dòng này về "Tổng tiền hàng" cho ngắn, con số sẽ nói
              * khác cái tên.
              *
              * 📌 Giữ mức thuế trong nhãn: đơn nhập từ file có thể trộn 8% và 10%, ghi một mức là
              * ghi SAI chứng từ thuế. `moTaThueSuat` lo đúng chỗ này.
              */}
            <dl className="flex flex-col gap-1.5 text-sm">
              <DongTongHop nhan="Số tiền Chiết khấu" giaTri={tien.chietKhau} />
              <DongTongHop
                nhan="Cộng tiền hàng (sau trừ chiết khấu)"
                giaTri={tien.congTienHang}
              />
              <DongTongHop
                nhan={`Tiền thuế GTGT (${moTaThueSuat(tien)})`}
                giaTri={tien.tienThueGTGT}
              />
              <DongTongHop nhan="Tổng tiền thanh toán" giaTri={tien.tongThanhToan} tong />
            </dl>
            <p className="text-right text-xs italic text-text-desc">
              {docSoTien(tien.tongThanhToan)}
            </p>
          </>
        ) : (
          /* Không có quyền xem giá thì nói rõ vì sao trống, đừng để một thẻ rỗng. */
          <p className="text-sm text-text-desc">
            Bạn không có quyền xem giá nên phần tiền của đơn được ẩn.
          </p>
        )}
      </div>

      {/* =========================================================================
          ④ GIAO NHẬN VÀ ĐIỀU KHOẢN — MỘT CỘT DỌC, đúng thứ tự ô B24 → B31 của biểu mẫu:

            Mã đề xuất và tên công trình → Người nhận hàng + Số điện thoại → Ngày giao hàng →
            Địa điểm giao hàng → Phương thức giao hàng → Điều khoản thanh toán →
            Điều khoản khác → hai câu cam kết cuối tờ.

          🔴 MỘT CỘT, KHÔNG CHIA HAI: người mới nhập theo tờ giấy thì đọc từ trên xuống. Chia hai
          cột là buộc họ tự đoán ô nào tương ứng dòng nào trên giấy — chính chỗ khó mà Ban lãnh
          đạo yêu cầu bỏ.

          🔴 ĐÃ BỎ CHẶN BỀ RỘNG Ở CẤP KHỐI — Ban lãnh đạo 25/08/2026: *"dàn trang ra"*.

          Trước đó khối này khai `[&_input]:max-w-xl [&_textarea]:max-w-xl` một lần cho cả thẻ, với
          lý do *"ô trải hết bề ngang màn 27 inch thì mắt phải rê rất xa từ nhãn tới chỗ gõ"*. Lý do
          đó đúng cho màn siêu rộng, nhưng thẻ ở đây chỉ rộng ~1140px mà ô dừng ở 576px, nên **gần
          nửa thẻ bỏ trống** — nhìn ra là lỗi bố cục chứ không ra chủ ý. Nay ô trải theo bề rộng thẻ.

          📌 Ô nào cần hẹp thì tự khai bề rộng RIÊNG tại chỗ (`w-32` của "Số ngày được nợ", `w-48`
          của ô ngày) — cách đó nói rõ ý đồ ngay tại ô, không phụ thuộc một lớp cha ở xa. Đừng đặt
          lại chặn cấp khối: nó âm thầm bóp mọi ô con, kể cả ô thêm sau này.
          ========================================================================= */}
      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          {/**
            * ★★ HAI MỤC RIÊNG, MỖI MỤC MỘT NHÃN, CÙNG MỘT HÀNG — Ban lãnh đạo 27/08/2026: *"tạo 2
            * mục này cùng dòng và được tự động link từ đề nghị"*, kèm ảnh viết rõ hai chữ
            * *"Mã đề nghị"* và *"Tên công trình"* lên đúng hai ô.
            *
            * 🔴 VÌ SAO PHẢI TÁCH: trước đây hai ô nằm dưới MỘT nhãn chung *"Mã đề xuất và tên công
            * trình"*. Nhìn vào chỉ thấy hai ô trắng cạnh nhau, không biết ô nào là gì — mà một ô
            * thì CHỈ ĐỌC còn ô kia SỬA ĐƯỢC, hai hành vi khác hẳn nhau dưới cùng một cái tên.
            *
            * 📌 Xếp lưới 2 cột GIỐNG HỆT hàng "Theo hợp đồng · Mã request" ngay dưới — bốn ô của
            * khối này thành một lưới đều, thay vì một hàng dính liền rồi một hàng chia đôi.
            *
            * ⚠️ NHÃN TỜ IN KHÔNG ĐỔI. Tờ A4 và file Excel vẫn in MỘT dòng *"Mã đề xuất và tên công
            * trình"* (ô B24 của biểu mẫu, chỉ đạo 23/08/2026) ghép từ hai ô này. Đừng "thống nhất"
            * bằng cách tách dòng đó trên tờ in — đó là chữ chép từ giấy công ty.
            */}
          <div className="grid grid-cols-1 items-start gap-(--hp-md-card-gap) sm:grid-cols-2">
            {/**
              * ★★ MÃ ĐỀ NGHỊ = MÃ ĐỀ XUẤT BÊN APP REQUEST — Ban lãnh đạo 27/08/2026, chỉ thẳng
              * vào ô đang gắn nhãn *"Mã request"* và nói: *"Này chính là mã đề nghị"*.
              *
              * 🔴 TRƯỚC ĐÂY Ô NÀY HIỆN `dn.code` VÀ ĐÓ LÀ CHỮ SAI NGHĨA. Đề nghị đến từ App
              * Request có `code` là một chuỗi dài kiểu *"HDXD test-TEST Cong trinh-…201"* — người
              * lập nhìn vào không nhận ra đó là mã gì, trong khi mã họ dùng để đối chiếu hằng ngày
              * (`000000043`) lại nằm ở một ô khác mang tên lạ *"Mã request"*. Hai ô, một khái niệm,
              * và ô mang đúng tên thì hiện sai giá trị.
              *
              * 🔴 GỘP THÀNH MỘT Ô, KHÔNG GIỮ CẢ HAI. Bày hai ô cho cùng một thứ là mời người dùng
              * đi tìm xem cái nào mới đúng để chép vào chứng từ.
              *
              * 📌 `?? dn.code` là ĐƯỜNG LUI THẬT, không phải cho chắc: đề nghị lập TAY trong app
              * không đi qua App Request nên không có mã đó — để trống là ô rỗng vĩnh viễn.
              *
              * 📌 `dn.code` chuyển vào `title`: vẫn tra được khi cần đối chiếu nội bộ, mà không
              * chiếm một ô trên màn hình.
              *
              * ⚠️ CHỈ ĐỌC. Đây là mã do app KHÁC sinh ra; sửa tay ở đây là mất đường đối chiếu
              * giữa hai app, và mất luôn đường truy vết về khối lượng đã duyệt.
              */}
            {/**
              * 🔴 LUÔN HIỆN Ô NÀY, KỂ CẢ ĐƠN ĐỘC LẬP — Ban lãnh đạo 27/08/2026: *"sửa lại chỗ
              * này"*, khoanh hàng đang chỉ có một ô "Tên công trình" và ghi rõ hai ô cần có:
              * **Mã đề nghị** (trái) · **Tên công trình** (phải).
              *
              * TRƯỚC ĐÂY ô này bị ẩn khi đơn không gắn đề nghị, nên hàng lưới 2 cột bị lệch: "Tên
              * công trình" nhảy sang cột trái và cột phải trống trơ. Ẩn để "đỡ bày ô vô nghĩa" hoá
              * ra làm bố cục vỡ, còn khó hiểu hơn cái nó tránh.
              *
              * ✅ Nay ô luôn có mặt; đơn độc lập thì nói thẳng là không gắn phiếu nào, thay vì để
              * trống cho người lập tự đoán phải điền gì.
              */}
            <div className="muc-ngang">
              <Label htmlFor="ma-de-nghi">Mã đề nghị</Label>
              <Input
                id="ma-de-nghi"
                value={dn ? (dn.maDeXuatAppRequest ?? dn.code) : ""}
                readOnly
                disabled
                className={dn ? "font-mono" : undefined}
                placeholder={dn ? undefined : "— Đơn không gắn phiếu đề nghị —"}
                title={dn ? `Mã hồ sơ trong app Thu mua: ${dn.code}` : undefined}
              />
              <span className="text-xs text-text-desc">
                {!dn
                  ? "Đơn lập độc lập, không gắn phiếu đề nghị nào — nên không có mã."
                  : dn.maDeXuatAppRequest
                    ? "Mã đề xuất bên App Request — lấy tự động, chỉ đọc, dùng để đối chiếu giữa hai app."
                    : "Lấy tự động từ phiếu đề nghị — chỉ đọc, để giữ đường truy vết khối lượng đã duyệt."}
              </span>
            </div>

            <div className="muc-ngang">
              <Label htmlFor="ma-rq">Tên công trình</Label>
              {/* Sửa được — đơn là chứng từ gửi ra ngoài, tên in trên đó phải đứng yên kể cả khi
                  đề nghị bị đổi tên sau. */}
              <Input
                id="ma-rq"
                value={tenCongTrinh}
                onChange={(e) => setTenCongTrinh(e.target.value)}
                placeholder="Tên công trình"
              />
              <span className="text-xs text-text-desc">
                {dn
                  ? "Lấy tự động từ phiếu đề nghị, sửa được nếu phiếu ghi thiếu."
                  : /* "khối cuối" chứ không phải "khối trên" — ô Dự án đã dời xuống khối ⑤ ngày
                       27/08/2026. Chỉ sai chỗ là người lập đi tìm ở khối không có nó. */
                    "In ra bản đơn A4 và file Excel gửi nhà cung cấp. Chọn dự án ở khối cuối form thì ô này tự điền."}
              </span>
            </div>
          </div>

          {/**
            * ★ Ô "THEO HỢP ĐỒNG" — hợp đồng với CHỦ ĐẦU TƯ (`maHopDongCDT`). Căn cứ để công trình
            * quyết toán, nên in lên đơn gửi nhà cung cấp. SỬA ĐƯỢC: đề nghị điền sẵn, nhưng đơn là
            * chứng từ gửi ra ngoài — người lập phải sửa được nếu đề nghị ghi thiếu/sai.
            *
            * 📌 Cùng một state `maHopDong` với ô "Theo hợp đồng" ở khối đầu tờ — một giá trị, một
            * nguồn. Sửa ở ô nào thì ô kia đổi theo, không có chuyện hai ô lệch nhau.
            *
            * 🔴 SỬA Ô TRÊN THÌ PHẢI SỬA Ô NÀY THEO. Từ 27/08/2026 đây là GHI CHÚ TỰ DO in nguyên
            * văn lên tờ đơn, không còn là ô "mã hợp đồng" thuần. Để nhãn cũ ở đây là một ô bảo
            * "nhập mã", ô kia bảo "gõ cả câu" — cùng đổ vào một chỗ.
            *
            * 📌 ĐÃ BỎ Ô "MÃ REQUEST" đứng cạnh (27/08/2026): nó và ô "Mã đề nghị" ở hàng trên là
            * CÙNG MỘT THỨ — Ban lãnh đạo chỉ thẳng vào nó và nói *"Này chính là mã đề nghị"*. Nay
            * gộp về ô "Mã đề nghị". Đừng dựng lại ô này.
            *
            * 📌 Chiếm CẢ HÀNG: ô ghi chú hợp đồng hay dài (số hợp đồng + ngày ký + phụ lục), mà
            * hàng này không còn ô nào đứng cạnh nữa.
            */}
          <div className="muc-ngang">
            <Label htmlFor="ma-hop-dong-duoi">Số hợp đồng CĐT</Label>
            <Input
              id="ma-hop-dong-duoi"
              value={maHopDong}
              onChange={(e) => setMaHopDong(e.target.value)}
              placeholder="VD: HĐ số 089/2026/HĐKT-HPC ký ngày 01/08/2026"
            />
            <span className="text-xs text-text-desc">
              Hợp đồng với chủ đầu tư — in nguyên văn lên tờ đơn. Đề nghị điền sẵn mã, gõ thêm
              ngày ký hoặc sửa lại tuỳ đơn.
            </span>
          </div>

          {/**
            * ★ NGƯỜI NHẬN HÀNG + SỐ ĐIỆN THOẠI XẾP CÙNG MỘT HÀNG — Ban lãnh đạo 24/08/2026
            * (*"Đưa lên đây"*, mũi tên từ chỗ trống bên phải trỏ vào ô Số điện thoại).
            *
            * 🔴 ĐÂY LÀ NGOẠI LỆ CÓ CHỦ Ý của quy tắc "MỘT CỘT, KHÔNG CHIA HAI" ghi ở đầu khối ④.
            * Quy tắc đó sinh ra để người mới dò theo tờ giấy đọc từ trên xuống. Nhưng tên người
            * nhận và số điện thoại của CHÍNH người đó là **một cặp**: đặt hai dòng liền nhau thì
            * nửa bên phải màn hình trống trơn suốt cả khối, mà mắt vẫn phải đi hai chặng cho một
            * thông tin. Các ô KHÁC vẫn giữ một cột.
            *
            * ⚠️ `items-start`: khối bên trái cao hơn (có ô chọn nhân sự + hai nút danh mục), để
            * `items-stretch` là ô số điện thoại bị kéo cao bằng, trông như một ô lỗi.
            */}
          <div className="grid grid-cols-1 items-start gap-(--hp-md-card-gap) sm:grid-cols-2">
          <div className="muc-ngang">
            <Label htmlFor="nguoi-nhan">Người nhận hàng (bên mua)</Label>

            {/**
              * ★ CHỌN THỦ KHO TỪ DANH SÁCH NHÂN SỰ BỘ PHẬN KHO — Ban lãnh đạo 21/08/2026:
              * *"thêm chức năng chọn thủ từ danh sách nhân sự của bộ phận kho"*.
              *
              * 📌 Danh sách lấy từ `useDanhBa()` — cùng nguồn với ô "Người theo dõi", tức là
              * TÀI KHOẢN THẬT trên máy chủ khi đã nối App Tổng, và rơi về danh bạ tĩnh khi chạy
              * chế độ tài khoản mẫu. Lọc `department === "kho"` nên chỉ ra người của bộ phận kho.
              *
              * 🔴 Ô CHỌN CHỈ ĐIỀN HỘ, Ô CHỮ MỚI LÀ GIÁ TRỊ THẬT — cùng quy ước với ô "Địa điểm
              * giao hàng" ngay trên. Không biến ô chọn thành nguồn duy nhất, vì:
              *   · thủ kho công trình có thể là người CHƯA CÓ tài khoản trong hệ thống — bắt
              *     phải chọn trong danh sách là chặn hẳn những đơn giao cho họ;
              *   · tên người nhận đọc từ file Excel (`doVaoBang` → `setNguoiNhanHang`) sẽ không
              *     khớp lựa chọn nào và **biến mất khỏi màn hình** dù vẫn nằm trong đơn.
              *
              * ⚠️ Không ai thuộc bộ phận kho thì KHÔNG vẽ ô chọn: một ô chọn trống chỉ làm người
              * dùng bấm vào rồi tự hỏi mình làm sai chỗ nào.
              */}
            {/**
              * ★ TỪ 22/08/2026 GỘP HAI NGUỒN (Ban lãnh đạo: *"Thêm trường nhập liệu thông tin thủ
              * kho công trình và cho lưu lại"*):
              *   ① danh bạ nhân sự bộ phận Kho — người ĐÃ CÓ tài khoản;
              *   ② danh mục thủ kho tự thêm — người ở công trường CHƯA CÓ tài khoản, kèm số điện
              *      thoại. Chọn ở nhóm này thì điền cả tên VÀ số điện thoại.
              *
              * 🔴 Vì sao cần nhóm ②: trước đây thủ kho công trường phải gõ lại tên và số điện
              * thoại mỗi lần lập đơn. Gõ mười lần thì mười cách viết, và số điện thoại sai một
              * chữ số là nhà cung cấp gọi không được, hàng không giao được.
              */}
            {/**
              * ★★ DỰNG THEO ĐÚNG KHUÔN Ô NHÀ CUNG CẤP — Ban lãnh đạo 27/08/2026: *"Tạo phần nhập
              * thông tin giống NCC"*, mũi tên chỉ đúng khối này.
              *
              * 🔴 TRƯỚC ĐÂY LÀ BA THỨ RỜI NHAU, mỗi thứ một kiểu: một ô `<select>` chiếm trọn
              * hàng, một ô chữ ở dưới, rồi hai *đường dẫn chữ nhỏ* ("+ Lưu thủ kho…" / "Xóa thủ
              * kho…"). Cùng một việc — chọn người từ danh mục rồi thêm/bớt danh mục — mà ô nhà
              * cung cấp ngay phía trên làm bằng **nút sổ xuống**, còn ô này làm bằng ba kiểu khác.
              * Người lập phải học lại cách dùng ở mỗi khối.
              *
              * 📌 Nay giống hệt khối NCC: [ô chữ] + [nút sổ ▾], danh mục mở ra trong `Popover`,
              * mỗi dòng có nút xoá riêng, và nút "Thêm … vào danh mục" nằm CUỐI danh sách — đúng
              * lúc người dùng mở ra, không thấy người mình cần, thì mới cần thêm.
              *
              * 🔴 GIỮ NGUYÊN LUẬT CŨ: ô chữ vẫn là GIÁ TRỊ THẬT, nút sổ chỉ ĐIỀN HỘ. Thủ kho công
              * trình có thể chưa có tài khoản, và tên đọc từ file Excel phải hiện được — bắt chọn
              * trong danh sách là chặn hẳn những đơn đó.
              */}
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="nguoi-nhan"
                placeholder="Thủ kho công trình"
                value={nguoiNhanHang}
                onChange={(e) => setNguoiNhanHang(e.target.value)}
                className="min-w-48 flex-1"
              />
              <Popover>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      /* Vùng chạm 44×44 (V1.1 Phần F) — y hệt nút của ô nhà cung cấp. */
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-primary hover:text-primary"
                      aria-label="Chọn thủ kho từ danh mục"
                      title="Chọn thủ kho từ danh mục"
                    >
                      <ChevronDown className="size-4" aria-hidden />
                    </button>
                  }
                />
                <PopoverContent align="start" className="w-80">
                  <p className="text-xs text-text-desc">
                    Chọn một dòng để điền tên người nhận
                    {thuKho.length > 0 ? " và số điện thoại" : ""}.
                  </p>

                  {nhanSuKho.length === 0 && thuKho.length === 0 ? (
                    <p className="text-sm text-text-secondary">
                      Danh mục đang trống. Gõ thẳng tên ở ô bên cạnh — đơn vẫn lập được.
                    </p>
                  ) : (
                    <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
                      {/* ===== NHÓM ①: thủ kho công trình tự thêm — có nút XOÁ riêng từng dòng.
                          🔴 Đây là nhóm DUY NHẤT xoá được: nhóm ② lấy từ danh bạ nhân sự của App
                          Tổng, app Thu mua không có quyền xoá tài khoản người khác. */}
                      {thuKho.length > 0 && (
                        <li className="px-1 pt-1 text-xs font-medium text-text-desc">
                          Thủ kho công trình (danh mục đã lưu)
                        </li>
                      )}
                      {thuKho.map((n) => (
                        <li key={n.id} className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setNguoiNhanHang(n.ten);
                              /* Điền luôn số điện thoại — đó là lý do chính phải lưu danh mục này.
                                 Chỉ điền khi CÓ số, để không xoá mất số người lập vừa gõ tay. */
                              if (n.soDienThoai) setSdtNguoiNhan(n.soDienThoai);
                            }}
                            className="flex min-h-11 min-w-0 flex-1 flex-col items-start gap-0.5 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-primary-bg"
                          >
                            <span className="text-sm font-medium text-text-primary">{n.ten}</span>
                            {(n.congTrinh || n.soDienThoai) && (
                              <span className="text-xs text-text-desc">
                                {[n.congTrinh, n.soDienThoai].filter(Boolean).join(" · ")}
                              </span>
                            )}
                          </button>
                          <button
                            type="button"
                            title={`Xóa ${n.ten} khỏi danh mục`}
                            onClick={() => setMoXoaThuKho(true)}
                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-text-desc transition-colors hover:bg-danger-bg hover:text-danger"
                          >
                            <Trash2 className="size-4 shrink-0" aria-hidden />
                            <span className="sr-only">Xóa {n.ten} khỏi danh mục</span>
                          </button>
                        </li>
                      ))}

                      {/* ===== NHÓM ②: nhân sự bộ phận Kho, lấy từ danh bạ — CHỈ CHỌN, không xoá. */}
                      {nhanSuKho.length > 0 && (
                        <li className="px-1 pt-2 text-xs font-medium text-text-desc">
                          Nhân sự bộ phận Kho
                        </li>
                      )}
                      {nhanSuKho.map((n) => (
                        <li key={n.uid} className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setNguoiNhanHang(n.displayName)}
                            className="flex min-h-11 min-w-0 flex-1 flex-col items-start gap-0.5 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-primary-bg"
                          >
                            <span className="text-sm font-medium text-text-primary">
                              {n.displayName}
                            </span>
                            {n.title && <span className="text-xs text-text-desc">{n.title}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      /* Điền sẵn tên và số đang gõ: người lập thường gõ xong mới nghĩ tới việc lưu. */
                      setTkTen(nguoiNhanHang.trim());
                      setTkSdt(sdtNguoiNhan.trim());
                      setTkCongTrinh(tenCongTrinh.trim() || diaDiemGiao.trim());
                      setMoThemThuKho(true);
                    }}
                    className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-lg border border-dashed border-border px-2.5 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary-bg"
                  >
                    <Plus className="size-4 shrink-0" aria-hidden />
                    Thêm thủ kho vào danh mục
                  </button>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* ★ SỐ ĐIỆN THOẠI NGƯỜI NHẬN — ô riêng trên biểu mẫu `PO - DEMO 130826.xlsx`.
              Nhà cung cấp gọi số này để hẹn giao; thiếu thì tài xế tới cổng không biết gọi ai. */}
          <div className="muc-ngang">
            <Label htmlFor="sdt-nguoi-nhan">Số điện thoại người nhận</Label>
            <Input
              id="sdt-nguoi-nhan"
              inputMode="tel"
              placeholder="Số để nhà cung cấp hẹn giao hàng"
              value={sdtNguoiNhan}
              onChange={(e) => setSdtNguoiNhan(e.target.value)}
            />
          </div>
          </div>

          {/**
            * ★★ THỜI GIAN NHẬN HÀNG LÀ MỘT KHOẢNG — Ban lãnh đạo 27/08/2026: *"Mục này cho chọn
            * thời gian nhận hàng. Từ ngày này tới ngày khác"*.
            *
            * 🔴 THÊM Ô KẾT THÚC, KHÔNG ĐỔI Ô CŨ. Ô "từ ngày" vẫn ghi vào `ngayGiaoDuKien` — trường
            * bắt buộc đã có trong mọi đơn đang chạy. Đổi tên hay cho phép rỗng là đơn cũ đọc lên
            * gãy kiểu.
            *
            * 📌 "Đến ngày" TÙY CHỌN: đơn hẹn giao gọn trong một ngày thì chỉ điền ô đầu, tờ in ra
            * đúng một ngày như trước. Bắt điền cả hai là ép người lập bịa một ngày kết thúc.
            */}
          <div className="muc-ngang">
            <Label htmlFor="ngay-giao">Thời gian nhận hàng</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="ngay-giao"
                type="date"
                value={ngayGiao}
                onChange={(e) => setNgayGiao(e.target.value)}
                className="w-44"
                aria-label="Nhận hàng từ ngày"
              />
              <span className="text-sm text-text-secondary">đến</span>
              <Input
                id="ngay-giao-den"
                type="date"
                value={ngayGiaoDen}
                /* 🔴 `min` chặn ngay tại ô: chọn ngày kết thúc trước ngày bắt đầu là một khoảng
                   không tồn tại. Chặn ở đây thì người lập biết ngay lúc chọn, không phải bấm Cất
                   rồi mới thấy báo lỗi. */
                min={ngayGiao || undefined}
                onChange={(e) => setNgayGiaoDen(e.target.value)}
                className="w-44"
                aria-label="Nhận hàng đến ngày"
              />
              {/**
                * ★ Ô GHI CHÚ THỜI GIAN GIAO — Ban lãnh đạo 27/08/2026: *"Thêm cột ghi chú thời
                * gian giao hàng"*, mũi tên chỉ đúng chỗ trống này.
                *
                * 📌 VÌ SAO CẦN DÙ ĐÃ CÓ KHOẢNG NGÀY: khoảng ngày nói được *"giao trong tuần
                * này"*, nhưng không nói được điều kiện thật khi hẹn xe — *"giao buổi sáng sau
                * 8h"*, *"gọi trước 1 ngày"*, *"chia 2 đợt"*. Không có chỗ ghi thì người lập nhét
                * vào ô "Điều khoản khác", lẫn với điều khoản thương mại.
                *
                * 📌 `min-w-48 flex-1`: chiếm hết chỗ còn lại của hàng, và màn hẹp thì `flex-wrap`
                * của cha đưa xuống dòng thay vì bóp còn vài chục pixel.
                */}
              <Input
                id="ghi-chu-thoi-gian-giao"
                value={ghiChuThoiGianGiao}
                onChange={(e) => setGhiChuThoiGianGiao(e.target.value)}
                className="min-w-48 flex-1"
                placeholder="VD: giao buổi sáng, gọi trước 1 ngày…"
                aria-label="Ghi chú thời gian giao hàng"
              />
            </div>
            <span className="text-xs text-text-desc">
              Khoảng thời gian nhà cung cấp được giao hàng. Giao gọn trong một ngày thì chỉ điền ô
              đầu — tờ in sẽ ghi đúng một ngày. Ô cuối để ghi chú thêm, in kèm trên tờ đơn.
            </span>
            {/* Nói ngay khi sai, đừng đợi tới lúc bấm Cất. */}
            {ngayGiao !== "" && ngayGiaoDen !== "" && ngayGiaoDen < ngayGiao && (
              <span className="text-xs text-warning-soft">
                Ngày kết thúc đang trước ngày bắt đầu — sửa lại một trong hai ô.
              </span>
            )}
          </div>

          <div className="muc-ngang">
            <Label htmlFor="dia-diem">Địa điểm giao hàng</Label>
            {/**
              * ★ MỘT Ô DUY NHẤT: GÕ TRỰC TIẾP HOẶC CHỌN TỪ DANH SÁCH — Ban lãnh đạo 24/08/2026:
              * *"Nhập trực tiếp hoặc chọn từ danh sách. Bỏ dòng dưới đi"*.
              *
              * 🔴 DÙNG `<datalist>`, KHÔNG DÙNG `<select>` + ô chữ RIÊNG như trước. Bản cũ có hai
              * dòng: một ô chọn "-- Chọn địa điểm đã dùng --" chỉ để **điền hộ**, và ô chữ bên
              * dưới mới giữ giá trị thật. Hai dòng cho một thông tin, và người lập phải hiểu ô
              * trên không phải chỗ nhập.
              *
              * ✅ `<datalist>` giữ được ĐÚNG điều mà chú thích cũ lo: ô vẫn là `<input>` nên giá
              * trị đọc từ file Excel (`doVaoBang` → `setDiaDiemGiao`) luôn hiện ra, kể cả khi
              * không khớp mục nào trong danh sách. Nếu là `<select>` thuần thì địa điểm lạ **biến
              * mất khỏi màn hình** dù vẫn nằm trong đơn — người lập không biết mà sửa.
              *
              * ⚠️ Danh sách vẫn gom từ ĐỊA ĐIỂM ĐÃ GHI TRÊN ĐƠN THẬT (`diaDiemDaCo`). KHÔNG bịa
              * danh mục: danh mục địa điểm là dữ liệu nghiệp vụ phải do công ty cấp.
              */}
            <Input
              id="dia-diem"
              /* Gợi ý bằng tên công trình đang có trên form — độc lập thì đó là ô người lập
                 vừa gõ, có đề nghị thì là tên lấy từ phiếu. */
              placeholder={tenCongTrinh || "Chân công trình"}
              value={diaDiemGiao}
              onChange={(e) => setDiaDiemGiao(e.target.value)}
              list={diaDiemDaCo.length > 0 ? "dia-diem-da-dung" : undefined}
            />
            {diaDiemDaCo.length > 0 && (
              <datalist id="dia-diem-da-dung">
                {diaDiemDaCo.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            )}
          </div>

          {/**
            * ★ KHỐI ĐIỀU KHOẢN IN Ở CUỐI TỜ ĐƠN — sửa được từ 22/08/2026
            * (Ban lãnh đạo: *"mục đơn PO này hãy tạo thành trường có thể sửa được nội dung"*).
            *
            * 🔴 Ô ĐIỀN SẴN BẢN CHUẨN, không để trắng. Người lập cần sửa vài chỗ bỏ trống trong
            * đó (số ngày khiếu nại `……`, phạm vi bốc xếp) chứ không phải gõ lại cả trang điều
            * khoản. Ô trắng kèm placeholder là mời họ gõ tay một bản khác bản công ty.
            *
            * 🔴 KHÔNG ghi vào state khi chưa ai sửa — xem `dieuKhoanGiaoHang` ở `kieu-du-lieu.ts`:
            * `undefined` (chưa sửa, in bản chuẩn) khác `""` (cố ý bỏ khối điều khoản). Nếu lúc
            * mở form đã nhồi bản chuẩn vào state rồi cất, thì mọi đơn đều mang một bản copy —
            * sau này công ty đổi điều khoản, không đơn nào nhận được bản mới.
            */}
          {/* ★ Nhãn lấy ĐÚNG CHỮ trên biểu mẫu (ô B28: "Phương thức giao hàng") — 23/08/2026.
              Tên cũ "Điều khoản in ở cuối tờ đơn" mô tả CHỖ IN chứ không nói nội dung là gì,
              nên người mới dò theo tờ giấy không nhận ra đây là ô nào.

              🔴 TỪ 24/08/2026 TÁCH TỪNG ĐẦU MỤC (Ban lãnh đạo: *"Tách từng đầu mục riêng và được
              phép chỉnh sửa"*). Luật ba trạng thái `null` / `""` / chuỗi giữ nguyên — xem chú
              thích đầu `khoi-dieu-khoan-tach-dong.tsx`. */}
          {/**
            * 🔴🔴 BẢN CHUẨN PHẢI THEO ĐÚNG MẪU ĐANG CHỌN — SỬA 27/08/2026, ĐÂY LÀ LỖI PHÁP LÝ.
            *
            * TRƯỚC ĐÂY dòng này truyền cứng `DIEU_KHOAN_GIAO_HANG_CHUAN` (bản PO-02, đủ 9 dòng)
            * cho CẢ HAI mẫu, trong khi tờ in lại chọn theo mẫu bằng `dieuKhoanGiaoHangChuanTheoMau`.
            * Hai bên đọc hai bản khác nhau, và hậu quả không dừng ở chỗ bày sai trên màn hình:
            *
            *   người lập chọn mẫu PO-01 → form vẫn bày 5 điều khoản của PO-02 → họ sửa MỘT chữ
            *   → `dieuKhoanGiaoHang` thành chuỗi đủ 9 dòng → tờ in PO-01 **in thừa 5 điều khoản**.
            *
            * Đó đúng là thứ chỉ đạo 26/08/2026 bắt phải bỏ khỏi PO-01: 5 điều khoản đó nói về
            * kiểm đếm, khiếu nại, đổi trả, chi phí phát sinh — những việc hợp đồng nguyên tắc đã
            * quy định. In lại trên đơn là hai văn bản cùng quy định một việc, và khi hai bản khác
            * nhau thì không biết theo bản nào.
            *
            * ⚠️ KHÔNG CÓ DẤU HIỆU NÀO BÁO: không lỗi lint, không lỗi build, tờ in vẫn ra đẹp — chỉ
            * là chứng từ gửi nhà cung cấp mang thừa năm điều khoản.
            *
            * 📌 Dùng CHUNG một hàm với tờ in (`dieuKhoanGiaoHangChuanTheoMau`) chính là điều mà
            * chú thích của hàm đó đã dặn. Ai thêm mẫu PO thứ ba thì chỉ sửa trong hàm ấy.
            */}
          <KhoiDieuKhoanTachDong
            id="dk-giao-hang"
            nhan="Phương thức giao hàng"
            giaTri={dieuKhoanGiaoHang}
            banChuan={dieuKhoanGiaoHangChuanTheoMau(mauPO)}
            onDoi={setDieuKhoanGiaoHang}
            /* 📌 Câu này phải nói ĐỦ BA thao tác, và nói rõ [+] khác Enter — hai việc dễ lẫn nhất
               ở khối này (Ban lãnh đạo 27/08/2026: *"Thêm chức năng được thêm dòng và dùng icon
               dấu +"*, cùng ngày với *"xuống dòng trong trường đó"*). */
            moTa="Chỗ để trống …… là chỗ cần điền theo từng đơn. Bấm + để thêm một mục mới, Enter để xuống dòng trong cùng một mục, thùng rác để xoá mục; xoá nhầm thì bấm Khôi phục bản chuẩn."
          />

          {/**
            * ⚠️ CA ĐỔI MẪU SAU KHI ĐÃ SỬA — chốt còn lại sau khi bản chuẩn đã đi theo mẫu.
            *
            * Sửa điều khoản ở mẫu PO-02 (khối thành bản riêng của đơn) rồi đổi sang PO-01 thì bản
            * riêng vẫn giữ nguyên 5 điều khoản của PO-02, mà tờ in ưu tiên bản riêng hơn bản
            * chuẩn — nên tờ PO-01 vẫn in thừa. Đổi `banChuan` không tự chữa được ca này.
            *
            * 🔴 BÁO CHỨ KHÔNG TỰ XOÁ. Xoá giúp là vứt phần người lập vừa gõ mà không hỏi; để họ
            * quyết bằng nút "Khôi phục bản chuẩn" có sẵn ngay trong khối bên trên.
            */}
          {mauPO === "theo_hop_dong" && conDieuKhoanRiengThoaThuan(dieuKhoanGiaoHang) && (
            <p className="rounded-lg bg-warning-bg px-3 py-2 text-xs text-warning-soft">
              Khối <strong>Phương thức giao hàng</strong> đang còn các điều khoản riêng của mẫu
              PO-02 (kiểm đếm, khiếu nại, đổi trả…). Mẫu <strong>PO-01 theo hợp đồng</strong> không
              in những mục đó — hợp đồng nguyên tắc đã quy định rồi. Bấm{" "}
              <strong>Khôi phục bản chuẩn</strong> ở khối trên để lấy đúng bản của mẫu PO-01, hoặc
              xoá từng mục thừa bằng nút thùng rác.
            </p>
          )}

          <div className="muc-ngang">
            <Label htmlFor="dk-tt">Điều khoản thanh toán</Label>
            <Input
              id="dk-tt"
              value={dieuKhoanThanhToan}
              onChange={(e) => setDieuKhoanThanhToan(e.target.value)}
              placeholder="Thanh toán 100% trong 30 ngày sau khi nhận đủ hàng"
            />
          </div>

          <div className="muc-ngang">
            <Label htmlFor="so-ngay-no">Số ngày được nợ</Label>
            <Input
              id="so-ngay-no"
              type="number"
              min={0}
              value={soNgayDuocNo}
              onChange={(e) => setSoNgayDuocNo(e.target.value)}
              className="w-32"
              placeholder="30"
            />
          </div>

          <div className="muc-ngang">
            <Label htmlFor="dk-khac">Điều khoản khác</Label>
            {/* MISA để ô nhiều dòng, cao khoảng 4 dòng.
                🔴 SỬA MỘT CHÚ THÍCH SAI (18/08/2026): chỗ này từng ghi *"dùng textarea gốc vì
                bộ nền tảng chưa có component Textarea"* — KHÔNG ĐÚNG, `nen-tang-ui/textarea.tsx`
                có thật và export `Textarea`. Hệ quả của chú thích sai đó là một bản chép tay
                các lớp CSS: bộ nền tảng đổi cách vẽ ô (viền, vòng focus, nền ở chế độ Tối) thì
                ô này đứng yên và lệch hẳn so với mọi ô khác trong app. Nay dùng component thật. */}
            <Textarea
              id="dk-khac"
              rows={4}
              value={dieuKhoanKhac}
              onChange={(e) => setDieuKhoanKhac(e.target.value)}
              placeholder="Bảo hành, bốc xếp, chứng chỉ chất lượng kèm theo…"
              /* `min-h-24` ≈ 4 dòng, đúng chiều cao ô của MISA. `Textarea` có
                 `field-sizing-content` nên nó vẫn tự cao thêm khi gõ dài — `rows` một mình
                 không quyết định được chiều cao ban đầu. */
              className="min-h-24"
            />
          </div>

          {/* Hai câu cam kết cuối tờ — chỉ in ở mẫu *Thỏa thuận mua bán*, nên ô nhập cũng chỉ
              hiện ở mẫu đó. Bày ô cho một thứ không được in là mời người lập gõ vào chỗ vô ích. */}
          {mauPO === "thoa_thuan" && (
            <div className="muc-ngang">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="cam-ket">Hai câu cam kết cuối tờ (mẫu Thỏa thuận)</Label>
                {camKetThoaThuan !== null && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCamKetThoaThuan(null)}
                    className="min-h-11 md:min-h-9"
                  >
                    <RotateCcw className="size-4" aria-hidden />
                    Khôi phục bản chuẩn
                  </Button>
                )}
              </div>
              <Textarea
                id="cam-ket"
                rows={4}
                value={camKetThoaThuan ?? CAM_KET_THOA_THUAN_CHUAN}
                onChange={(e) => setCamKetThoaThuan(e.target.value)}
                className="min-h-24 font-mono text-xs"
              />
            </div>
          )}

        </CardContent>
      </Card>

      {/* =========================================================================
          ⑤ THÔNG TIN NỘI BỘ — KHÔNG in trên tờ đơn gửi nhà cung cấp

          🔴 TÁCH RA THÀNH KHỐI RIÊNG CÓ CHỦ Ý (23/08/2026). Ba thứ dưới đây không có ô nào trên
          biểu mẫu công ty: người lập đơn · số chứng từ tham chiếu · tệp đính kèm. Để lẫn vào đầu
          tờ như trước là người nhập tưởng chúng cũng được in ra và gửi cho nhà cung cấp.

          🔴 Bỏ `[&_input]:max-w-xl` cùng lý do với khối ④ (Ban lãnh đạo 25/08/2026: *"dàn trang
          ra"*) — hai khối nằm liền nhau nên phải cùng bề rộng, lệch một khối là thấy ngay.
          ========================================================================= */}
      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          {/**
            * ★★ Ô "DỰ ÁN / CÔNG TRÌNH" ĐÃ DỜI TỪ KHỐI ① XUỐNG ĐÂY — Ban lãnh đạo 27/08/2026, sau
            * khi em trình bày: *"các trường nhập số liệu này cũng phải giống 100% mẫu … nội dung
            * nào khác thì bỏ hết"*, và Sếp đồng ý phương án CHUYỂN thay vì bỏ.
            *
            * 🔴 VÌ SAO CHUYỂN CHỨ KHÔNG BỎ: ô này không có trên biểu mẫu giấy và không in ra tờ
            * đơn — đúng là "nội dung khác mẫu". NHƯNG bỏ hẳn là **không cất được đơn độc lập
            * nào**: `themDonHang` trong `kho-du-lieu.tsx` chặn thẳng khi `po.maDuAn` rỗng
            * (*"Chưa có mã dự án gốc nên chưa cấp được số đơn hàng"*). Chuyển xuống khối nội bộ
            * vừa làm khối đầu tờ sạch đúng mẫu, vừa không mất chức năng nào.
            *
            * 📌 ĐÚNG CHỖ VỀ Ý NGHĨA: khối ⑤ đúng là nơi gom những thứ KHÔNG in trên tờ đơn gửi
            * nhà cung cấp — mã dự án thuộc về đúng nhóm đó.
            *
            * ⚠️ CHỌN Ở ĐÂY VẪN ĐIỀN HỘ HAI Ô Ở KHỐI ĐẦU (tên công trình · ghi chú hợp đồng). Thứ
            * tự trên màn hình thành ngược (chọn ở cuối, chữ hiện ở đầu) nên câu chú thích dưới ô
            * phải nói rõ, nếu không người lập tưởng app tự ý sửa ô họ đã gõ.
            *
            * 🔴 KHÔNG TỰ BỊA MÃ DỰ ÁN. Mã dự án gốc do công ty cấp theo Thông báo 09/2026/TB-HPCS;
            * app chỉ cho CHỌN LẠI cái đã có hoặc GHI LẠI cái người dùng gõ. Danh sách gợi ý suy
            * từ đề nghị + đơn hàng đang có (app chưa có danh mục dự án riêng) — nên luôn phải
            * chừa đường "nhập tay" cho dự án mới.
            *
            * 🔴 `w-full min-w-0` KHÔNG PHẢI TRANG TRÍ. `<select>` để `width:auto` thì bề rộng tối
            * thiểu của nó bằng bề rộng của LỰA CHỌN DÀI NHẤT, mà mỗi lựa chọn ở đây là "mã dự án
            * — tên công trình" (có thể 60–70 ký tự). Bề rộng đó đẩy giãn cả cột: trên màn 375px
            * phần bên phải bị `overflow-x-hidden` của `khung-tong.tsx` CẮT MẤT — không trôi ngang
            * nên đo `scrollWidth` cũng không thấy, chỉ thấy khi mở bằng điện thoại.
            */}
          {laDonDocLap && (
            <div className="muc-ngang">
              <Label htmlFor="du-an-don">
                Dự án / Công trình <span className="text-danger">*</span>
              </Label>
              <select
                id="du-an-don"
                value={duAnChon}
                onChange={(e) => {
                  const v = e.target.value;
                  setDuAnChon(v);
                  if (v === "__moi__") {
                    // Chuyển sang gõ tay thì DỌN ô mã — giữ lại mã của dự án vừa chọn là
                    // mời người lập bấm Cất mà tưởng đang lập cho dự án mới.
                    setMaDuAnNhap("");
                    return;
                  }
                  const d = duAnDaCo.find((x) => x.maDuAn === v);
                  if (!d) {
                    setMaDuAnNhap("");
                    return;
                  }
                  setMaDuAnNhap(d.maDuAn);
                  // Điền hộ tên công trình và hợp đồng — hai ô đó nằm ở KHỐI ĐẦU TỜ, gõ lại là
                  // mời sai sót vào chứng từ gửi nhà cung cấp.
                  if (d.tenCongTrinh) setTenCongTrinh(d.tenCongTrinh);
                  if (d.maHopDongCDT) setMaHopDong(ghiChuHopDongTuMa(d.maHopDongCDT));
                }}
                className="min-h-11 w-full min-w-0 rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none"
              >
                <option value="">-- Chọn dự án --</option>
                {duAnDaCo.map((d) => (
                  <option key={d.maDuAn} value={d.maDuAn}>
                    {d.maDuAn}
                    {d.tenCongTrinh ? ` — ${d.tenCongTrinh}` : ""}
                  </option>
                ))}
                <option value="__moi__">Dự án khác — nhập tay…</option>
              </select>
              {duAnChon === "__moi__" && (
                <>
                  <Input
                    value={maDuAnNhap}
                    onChange={(e) => setMaDuAnNhap(e.target.value)}
                    placeholder="260001-HPCS"
                    aria-label="Mã dự án gốc"
                    className="w-56"
                  />
                  <span className="text-xs text-text-desc">
                    Mã dự án gốc theo Thông báo 09/2026/TB-HPCS, dạng{" "}
                    <strong>YYUNNN-HPCS</strong>.
                  </span>
                </>
              )}
              {/* Nói trước việc app điền hộ — chọn ở cuối form mà chữ hiện ở đầu form thì phải
                  báo, nếu không người lập tưởng app tự ý sửa ô họ đã gõ. */}
              <span className="text-xs text-text-desc">
                Không in trên tờ đơn — dùng để cấp số đơn hàng và lưu hồ sơ theo dự án. Chọn xong
                thì <strong>Tên công trình</strong> và <strong>Theo hợp đồng</strong> ở khối đầu
                tự điền.
              </span>
            </div>
          )}

          <div className="muc-ngang">
            <Label htmlFor="nv-mua-hang">Nhân viên mua hàng</Label>
            {/**
              * ★★ ĐÃ MỞ KHÓA CHO SỬA — Ban lãnh đạo 26/08/2026: *"Chỗ tên nhân viên mua hàng hãy
              * mở khoá cho chỉnh sửa nhé"*.
              *
              * 🔴 CHÚ THÍCH CŨ Ở ĐÂY LO ĐÚNG NHƯNG KẾT LUẬN SAI. Nó ghi *"cho gõ tự do thì tên và
              * mã lệch nhau, và mọi màn việc-của-tôi / lịch / phân bổ đều tra theo mã"*. Đọc lại
              * kiểu dữ liệu thì `DonDatHang` có **HAI trường tách riêng**:
              *   · `nguoiPhuTrachUid` — MÃ người, thứ mọi màn kia tra theo
              *   · `nguoiPhuTrachTen` — TÊN in trên tờ đơn gửi nhà cung cấp
              * Ô này chỉ ghi vào trường TÊN. Mã vẫn là người đang lập đơn, nên không màn nào bị
              * ảnh hưởng — cái lo của chú thích cũ không xảy ra được.
              *
              * 📌 VÌ SAO CẦN SỬA ĐƯỢC: người lập đơn trong app không nhất thiết là người đứng tên
              * mua hàng trên chứng từ (trưởng bộ phận lập thay, hoặc đơn do người khác phụ trách).
              * Khóa cứng là tờ in ghi sai người, mà không có cách nào chữa.
              *
              * ⚠️ ĐÂY KHÔNG PHẢI CHỖ ĐỔI NGƯỜI PHỤ TRÁCH TRONG APP. Đổi tên ở đây chỉ đổi chữ in
              * trên tờ; muốn đổi người phụ trách thật thì vào bảng Phân bổ công việc.
              */}
            <Input
              id="nv-mua-hang"
              value={tenNhanVienMua}
              onChange={(e) => setTenNhanVienMua(e.target.value)}
              placeholder={nguoiDung.tenHienThi}
            />
            <span className="text-xs text-text-desc">
              Tên in trên tờ đơn. Sửa được khi người đứng tên mua hàng không phải người đang lập
              đơn — không đổi người phụ trách trong app.
            </span>
          </div>

          {/**
            * ★ "Tham chiếu" DỜI VỀ ĐÂY, thay chỗ ô "Diễn giải" đã bỏ — Ban lãnh đạo
            * 21/08/2026: *"Bỏ"* (ô Diễn giải) và *"Bố cục cân đối lại"*.
            *
            * 🔴 VÌ SAO DỜI CHỨ KHÔNG CHỈ BỎ: khối thông tin xếp lưới 3 cột. Bỏ một ô ở cột
            * giữa là cột đó ngắn hơn hai cột kia, còn "Tham chiếu" thì vẫn nằm một dòng riêng
            * dưới đáy khối — đúng chỗ lệch Ban lãnh đạo khoanh. Đưa nó lên đúng ô vừa trống
            * thì lưới đầy đủ và không còn dòng lẻ nào.
            *
            * ❌ Trường `dienGiai` đã bỏ HẲN khỏi mã nguồn (Ban lãnh đạo 21/08/2026:
            * *"CHẤP NHẬN BỎ"*). Bỏ được sạch vì nó **chưa từng hiện ở đâu** — không có trên
            * tờ in A4, không có ở danh sách đơn hàng. Đơn cũ trong Firestore còn khóa
            * `dienGiai` thì nằm im, không ai đọc nữa.
            */}
          {/**
            * ❌ ĐÃ BỎ Ô "THAM CHIẾU" — Ban lãnh đạo 27/08/2026: *"Bỏ mục này đi"*, khoanh đúng ô
            * này và ô đính kèm ngay dưới.
            *
            * 📌 Ô đó không in trên tờ đơn A4 (đã kiểm: `to-don-mua-hang-a4.tsx` không đọc
            * `thamChieu` một lần nào) — nó chỉ đi ra một dòng của file Excel.
            *
            * ⚠️ STATE `thamChieu` VẪN GIỮ, ĐỪNG DỌN THEO: bộ đọc file Excel còn nhặt ô "Tham
            * chiếu:" vào (`doc-don-hang-excel.ts`), và bộ ghi còn ghi ra. Bỏ state là nhập một
            * file có giá trị đó rồi xuất lại thì mất — vòng đọc/ghi hỏng im lặng.
            */}

          {/* =====================================================================
              🔴 CHẾ ĐỘ MẪU KHÔNG CÓ Ô ĐÍNH KÈM — sửa lỗi thật, phát hiện 18/08/2026 khi
              soi lại chế độ "chỉ tạo mẫu".

              LỖI ĐÃ XẢY RA: ô này vẽ ở CẢ HAI chế độ. `ODinhKemNhieuTep` cất tệp vào kho tệp
              NGAY LÚC CHỌN (`3-du-lieu/kho-tep.ts` → `catTep`, ghi thẳng IndexedDB), rồi mới
              trả mô tả tệp về form. Mà ở chế độ mẫu thì:
               · `2-quy-trinh/don-hang-mau.ts` → `dungDonHangMau` KHÔNG mang `tepDinhKem` sang
                 (đúng — bản mẫu không có đơn nào để đính vào), và
               · không có đơn nào được cất, nên không chứng từ nào trỏ tới tệp vừa ghi.
              Hệ quả: người lập bỏ hợp đồng / báo giá vào đây, thấy tên tệp hiện lên dưới nhãn
              **"Đính kèm cho ĐƠN này"**, tin là đã lưu — trong khi tệp thành **khối dữ liệu mồ
              côi** nằm ăn dung lượng kho tệp và không ai tra ra được. Đúng cái quy ước dự án
              cấm ở mục 3.5: *"Đừng để giao diện hứa một việc app không làm"* — cùng họ với lỗi
              tải bản báo giá trước 11/08/2026, chỉ đảo chiều (lần đó mất nội dung tệp, lần này
              giữ tệp nhưng mất hồ sơ).

              ✅ Chức năng chưa làm được thì NÓI RÕ LÝ DO, không bày ra rồi lặng lẽ vứt.
              ⚠️ Đường có đề nghị giữ nguyên hoàn toàn — tệp ở đó đi vào
                 `DonDatHang.tepDinhKem` của đúng đơn được cất.
              ===================================================================== */}
          {/**
            * ❌ ĐÃ BỎ KHỐI "ĐÍNH KÈM CHO ĐƠN NÀY" — Ban lãnh đạo 27/08/2026: *"Bỏ mục này đi"*.
            *
            * 🔴 BỎ LÀ ĐÚNG, VÀ ĐÂY LÀ LÝ DO ĐO ĐƯỢC: tệp đính vào đơn **không có màn hình nào
            * hiển thị lại**. Đã grep `tepDinhKem` trên toàn bộ `1-giao-dien/trang/`: KHÔNG một
            * kết quả nào; tờ in A4 cũng không đọc. Nghĩa là người lập bỏ hợp đồng / báo giá vào
            * đây, thấy tên tệp hiện lên, tin là đã lưu vào hồ sơ — rồi không ai tra ra được nữa.
            * Đúng thứ quy ước dự án cấm ở mục 3.5: *"Đừng để giao diện hứa một việc app không
            * làm"*.
            *
            * 📌 CHỖ ĐÍNH KÈM ĐÚNG VẪN CÒN NGUYÊN: khu "Tệp đính kèm của bước" (`KhuDinhKemGiaiDoan`)
            * trên trang chi tiết đề nghị — tệp ở đó vào `DeNghiMuaHang.tepGiaiDoan`, có màn hình
            * xem lại, và được bộ hồ sơ thanh toán đếm. Hợp đồng, báo giá, phiếu giao nhận, hoá đơn
            * đều nộp ở đó.
            *
            * ⚠️ STATE `tepDinhKem` VẪN GIỮ: `themDonHang` còn nhận trường này, và đơn cũ trong
            * Firestore còn dữ liệu. Bỏ state là phải sửa cả tầng ghi cho một việc không cần thiết.
            */}

        </CardContent>
      </Card>

      {/* ===== NÓI RÕ VÌ SAO CHƯA CẤT ĐƯỢC — đứng ngay trên thanh nút =====
          🔴 Ban lãnh đạo 15/08/2026 chỉ vào nút xám và hỏi *"sao nút này không dùng được"*.
          App chặn ĐÚNG (bảng báo giá còn đang thu thập, chưa qua xét duyệt — chính luật Ban
          lãnh đạo yêu cầu hôm đó), nhưng nếu lý do chỉ nằm trong `title` thì phải rê chuột mới
          thấy, và trên máy tính bảng thì không có chuột. Nút xám không lời giải thích trông y
          như app hỏng.

          🔴 CHẶN ĐÚNG CHỖ, KHÔNG NỚI LUẬT: chốt chặn thật ở `themDonHang` (cùng dùng
          `vuongMacLapDonHang`). Nhập liệu và nhập Excel vẫn dùng được — thà cho gõ rồi chặn ở
          nút Cất, còn hơn đứng im không cho một đường nào đi tiếp như trước 17/08/2026. */}
      {chanLapDon && (
        <div className="flex flex-col gap-2 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad)">
          <p className="flex items-start gap-2 text-sm text-warning-soft">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <strong>Chưa cất được đơn đặt hàng.</strong> {chanLapDon} Phần nhập liệu và nhập
              từ Excel ở trên vẫn dùng được — chỉ nút <strong>Lưu</strong> còn bị chặn.
            </span>
          </p>
          {/* 🔴 GỠ NGÕ CỤT: trước đây câu này nói "phải lập bảng báo giá" mà không cho chỗ nào
              làm việc đó — muốn lập phải quay ra /de-nghi rồi tìm menu ⋯ trên thẻ, không ai
              đoán được. Đi qua bảng quy trình chứ không gọi thẳng hàm tạo: ở đó việc lập bảng
              báo giá đi qua đúng chốt `quyetDinhKeoTha` và hộp xác nhận. */}
          <Button
            size="sm"
            variant="outline"
            className="w-fit"
            nativeButton={false}
            render={<Link href="/de-nghi" />}
          >
            <FileText className="size-4" aria-hidden />
            Sang bảng quy trình để lập bảng báo giá
          </Button>
        </div>
      )}

      {/* =========================================================================
          ⑤ THANH NÚT DƯỚI CÙNG — [Hủy] trái · [Lưu] [Lưu và In] phải

          🔴 NỀN TỐI NHƯ MISA (18/08/2026), bằng token có thật của công ty: `bg-nav-base` =
          `--hp-nav-base` = **#4B4F55**, chính màu thanh bên của V1.1 và **cố định ở cả Sáng lẫn
          Tối**. Chữ dùng `text-nav-foreground` (#F5F7FA) cho đủ tương phản. Không bịa mã màu mới,
          không dùng đen thuần.

          🔴 CHỈ ÁP KHI Ở TRANG RIÊNG (`!nhung`). Nhúng trong khối bước ④ của trang chi tiết đề
          nghị thì một dải tối nằm giữa trang sẽ trông như đáy của cả trang, trong khi phía dưới
          còn bước ⑤ và ⑥ — người dùng tưởng hết trang. Ở đó giữ nền thẻ sáng như cũ.

          ⚠️ KHÔNG DÁN ĐÁY MÀN HÌNH (`sticky bottom-0`) dù MISA có — lý do kỹ thuật ở báo cáo:
          `main` trong `khung-app/khung-tong.tsx` có `overflow-x-hidden`, mà theo chuẩn CSS thì một
          trục `hidden` làm trục còn lại từ `visible` thành `auto` → `main` thành khung cuộn, và
          `main` lại cao đúng bằng nội dung nên **không bao giờ cuộn**. `sticky` bên trong một
          khung không cuộn là VÔ HIỆU — thêm vào chỉ để có class mà không dán được gì đúng là kiểu
          "thành phần trang trí" mà quy ước dự án cấm. */}
      {/* ⚠️ CHỈ ĐỔI NỀN, TUYỆT ĐỐI KHÔNG đặt `text-nav-foreground` lên cả thẻ. Màu chữ đặt ở thẻ
          sẽ CHẢY XUỐNG các nút bên trong: nút `variant="outline"` có nền `bg-background` (màu rất
          sáng ở chế độ Sáng) mà thừa hưởng chữ #F5F7FA cũng rất sáng → **chữ trên nút [Lưu và In]
          / [Xuất Excel] gần như vô hình**. Nên chỉ hai chỗ thật cần mới khai màu chữ: nút [Hủy]
          (kiểu `ghost`, không có nền riêng) và câu nhắc còn thiếu gì. */}
      <Card className={nhung ? undefined : "bg-nav-base ring-0"}>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          {/* Không có chỗ nào để "hủy" khi form nằm trong trang thì không vẽ nút — một nút
              không làm gì còn tệ hơn không có nút. `<span/>` giữ chỗ cho `justify-between`. */}
          {onHuy ? (
            <Button
              variant="ghost"
              onClick={onHuy}
              /* Trên nền tối, nút `ghost` mặc định ăn màu chữ tối → gần như vô hình. Khai lại
                 bằng token chữ của thanh điều hướng. */
              className={nhung ? undefined : "text-nav-foreground hover:bg-nav-hover"}
            >
              Hủy
            </Button>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap items-center gap-3">
            {!hopLe && (
              <span
                className={`max-w-80 text-xs ${nhung ? "text-text-desc" : "text-nav-foreground-muted"}`}
              >
                {/* Nói ĐỦ những gì còn thiếu, kể cả cái chỉ chế độ mẫu mới đòi — nút mờ không
                    giải thích là kiểu bí việc khó chịu nhất (bài học 15/08/2026). */}
                Cần {laDonDocLap ? "mã dự án, " : ""}tên nhà cung cấp, ngày đơn hàng, ngày giao
                hàng và ít nhất một dòng hàng
                {laDonDocLap ? " có đủ tên hàng, ĐVT và số lượng" : ""}.
              </span>
            )}

            {/* ===============================================================
                🔴 BA TRƯỜNG HỢP, KHÔNG PHẢI HAI — siết lại 29/08/2026 (Sếp chốt).

                · CHẾ ĐỘ MẪU (độc lập, KHÔNG có `quyen.taoPoDoiLap`) → [In mẫu PO] [Xuất Excel].
                  KHÔNG có nút cất, không hàm nào ở nhánh này gọi `themDonHang`. Y HỆT chỉ đạo
                  18/08/2026 *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"* — vẫn áp dụng cho nhân
                  viên thường (dưới Trưởng bộ phận), không đổi một ly.
                · ĐỘC LẬP + CÓ `quyen.taoPoDoiLap` (thêm 29/08/2026) → [Lưu] [Lưu và In], gọi
                  `luu()` y hệt chế độ có đề nghị — hàm này VỐN ĐÃ hỗ trợ `prId: dn?.id` là
                  `undefined` (xem thân hàm), chỉ là trước đây không có đường nào tới được nút
                  gọi nó. `themDonHang` tự nhận biết thiếu `prId` để tạo PO ở `"cho_de_nghi"`
                  thay vì `"da_chot"` — xem chú thích ở đó.
                · CHẾ ĐỘ CÓ ĐỀ NGHỊ → [Lưu] [Lưu và In] y như cũ, không đổi một ly. Đó là đường
                  nghiệp vụ chính của app (kể cả chức năng tách PO theo phân bổ báo giá).
                =============================================================== */}
            {laDonDocLap && !coQuyenTaoDocLapThat ? (
              <>
                <Button
                  disabled={!hopLe || !quyen.xemGia || dangXuatMau}
                  onClick={inMauPO}
                  /* Bản in luôn có giá nên đòi quyền xem giá — nút mờ phải nói lý do. */
                  title={!quyen.xemGia ? "Bản mẫu có giá nên cần quyền xem giá" : undefined}
                >
                  <Printer className="size-4" aria-hidden />
                  In mẫu PO
                </Button>
                <Button
                  variant="outline"
                  disabled={!hopLe || !quyen.xemGia || dangXuatMau}
                  onClick={() => void xuatExcelMau()}
                  title={
                    !quyen.xemGia
                      ? "File Excel có giá nên cần quyền xem giá"
                      : "Tải bản mẫu ra Excel theo biểu mẫu công ty"
                  }
                >
                  <FileSpreadsheet className="size-4" aria-hidden />
                  {dangXuatMau ? "Đang tạo file…" : "Xuất Excel"}
                </Button>
              </>
            ) : (
              <>
                <Button disabled={!hopLe} onClick={() => setHoiCat("cat")}>
                  <Save className="size-4" aria-hidden />
                  Lưu
                </Button>
                <Button
                  variant="outline"
                  disabled={!hopLe || !quyen.xemGia}
                  onClick={() => setHoiCat("cat-in")}
                  /* Trang in đòi quyền xem giá (bản in luôn có giá), nên nút mờ phải nói lý do —
                     nút mờ không giải thích là kiểu bí việc khó chịu nhất. */
                  title={!quyen.xemGia ? "Bản in có giá nên cần quyền xem giá" : undefined}
                >
                  <Printer className="size-4" aria-hidden />
                  Lưu và In
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Bốn hộp thoại đặt NGOÀI lớp bọc gập: chúng vẽ qua portal nên không nằm trong luồng
          bố cục, mà để trong lớp `hidden` thì lỡ có hộp đang mở lúc người dùng bấm gập là hộp
          biến mất giữa chừng. */}
      {/* ===== Hộp chọn mặt hàng cho [Thêm dòng] / phím F9 ===== */}
      <HopChonMatHang
        mo={moChonMatHang}
        matHang={matHangConThem}
        onDong={() => setMoChonMatHang(false)}
        onChon={(dsStt) => {
          const them = matHangConThem
            .filter((d) => dsStt.includes(d.stt))
            .map((d) => dungDongTuDeNghi(d));
          if (them.length > 0) setDongBang((t) => [...t, ...them]);
        }}
      />

      {/* ===== Hộp XÓA NHÀ CUNG CẤP khỏi danh mục (Ban lãnh đạo 21/08/2026) ===== */}
      <HopXacNhan
        mo={hoiXoaNCC !== null}
        tieuDe="Xóa nhà cung cấp khỏi danh mục?"
        moTa={
          hoiXoaNCC && (
            <>
              <strong>
                {hoiXoaNCC.maNCC ? `${hoiXoaNCC.maNCC} — ` : ""}
                {hoiXoaNCC.ten}
              </strong>{" "}
              sẽ không còn trong ô chọn nhà cung cấp. Đơn đặt hàng đã lập không đổi — mã, tên và
              mã số thuế được lưu ngay trong đơn.
            </>
          )
        }
        canhBao="Nếu nhà cung cấp này đang có đơn đặt hàng, app sẽ không cho xóa."
        nhanDongY="Xóa khỏi danh mục"
        nguyHiem
        onDong={() => setHoiXoaNCC(null)}
        onDongY={() => {
          if (!hoiXoaNCC) return;
          const loi = xoaNhaCungCap(hoiXoaNCC.id);
          if (loi) {
            toast.error("Không xóa được", { description: loi });
            setHoiXoaNCC(null);
            return;
          }
          toast.success("Đã xóa khỏi danh mục", { description: hoiXoaNCC.ten });
          setHoiXoaNCC(null);
        }}
      />

      {/**
        * ===== Hộp THÊM THỦ KHO CÔNG TRÌNH vào danh mục =====
        * ★ Ban lãnh đạo 22/08/2026: *"Thêm trường nhập liệu thông tin thủ kho công trình và cho
        * lưu lại"*.
        *
        * 📌 Chỉ TÊN là bắt buộc. Số điện thoại là lý do chính phải lưu danh mục, nhưng không bắt
        * buộc — có người lập biết tên trước, xin số sau; chặn lại là họ không lưu được gì.
        */}
      <HopXacNhan
        mo={moThemThuKho}
        tieuDe="Lưu thủ kho vào danh mục?"
        moTa="Thủ kho lưu ở đây dùng chung cho cả phòng. Lần sau chọn trong ô là điền sẵn cả tên và số điện thoại."
        nhanDongY="Lưu vào danh mục"
        khoaDongY={tkTen.trim() === "" ? "Phải có tên thủ kho." : undefined}
        onDong={() => setMoThemThuKho(false)}
        onDongY={() => {
          const loi = themThuKho({
            ten: tkTen,
            soDienThoai: tkSdt,
            congTrinh: tkCongTrinh,
          });
          if (loi) {
            toast.error("Không lưu được vào danh mục", { description: loi });
            return;
          }
          /* Điền luôn vào đơn đang lập — người dùng mở hộp này giữa lúc lập đơn. */
          setNguoiNhanHang(tkTen.trim());
          if (tkSdt.trim()) setSdtNguoiNhan(tkSdt.trim());
          toast.success("Đã lưu vào danh mục", { description: tkTen.trim() });
          setMoThemThuKho(false);
          setTkTen("");
          setTkSdt("");
          setTkCongTrinh("");
        }}
      >
        <div className="flex flex-col gap-(--hp-md-row-gap)">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Label htmlFor="tk-moi-ten">Tên thủ kho *</Label>
              <Input
                id="tk-moi-ten"
                value={tkTen}
                onChange={(e) => setTkTen(e.target.value)}
                placeholder="Họ và tên người nhận hàng tại công trình"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:w-48">
              <Label htmlFor="tk-moi-sdt">Số điện thoại</Label>
              <Input
                id="tk-moi-sdt"
                inputMode="tel"
                value={tkSdt}
                onChange={(e) => setTkSdt(e.target.value)}
                placeholder="Số để NCC hẹn giao"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tk-moi-ct">Công trình phụ trách</Label>
            <Input
              id="tk-moi-ct"
              value={tkCongTrinh}
              onChange={(e) => setTkCongTrinh(e.target.value)}
              placeholder="Để phân biệt khi có nhiều thủ kho"
            />
          </div>
        </div>
      </HopXacNhan>

      {/* ===== Hộp XÓA THỦ KHO khỏi danh mục ===== */}
      <HopXacNhan
        mo={moXoaThuKho}
        tieuDe="Xóa thủ kho khỏi danh mục"
        moTa="Chọn người cần bỏ khỏi danh mục. Đơn hàng cũ vẫn giữ nguyên tên và số điện thoại đã ghi — chỉ là lần sau không chọn nhanh được nữa."
        nhanDongY="Đóng"
        onDong={() => setMoXoaThuKho(false)}
        onDongY={() => setMoXoaThuKho(false)}
      >
        <ul className="flex flex-col gap-1.5">
          {thuKho.map((n) => (
            <li
              key={n.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <span className="min-w-0 text-sm text-text-primary">
                {n.ten}
                {n.congTrinh && <span className="text-text-desc"> · {n.congTrinh}</span>}
                {n.soDienThoai && <span className="text-text-desc"> · {n.soDienThoai}</span>}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11 text-danger md:min-h-9"
                onClick={() => {
                  const loi = xoaThuKho(n.id);
                  if (loi) {
                    toast.error("Không xóa được", { description: loi });
                    return;
                  }
                  toast.success("Đã xóa khỏi danh mục", { description: n.ten });
                }}
              >
                <Trash2 className="size-4" aria-hidden />
                Xóa
              </Button>
            </li>
          ))}
          {thuKho.length === 0 && (
            <li className="text-sm text-text-desc">Danh mục chưa có ai.</li>
          )}
        </ul>
      </HopXacNhan>

      {/* ===== Hộp THÊM NHÀ CUNG CẤP vào danh mục (Ban lãnh đạo 20/08/2026) ===== */}
      <HopXacNhan
        mo={moThemNCC}
        tieuDe="Thêm nhà cung cấp vào danh mục?"
        moTa="Nhà cung cấp thêm ở đây dùng chung cho cả phòng, lần sau chọn thẳng trong danh mục."
        nhanDongY="Thêm vào danh mục"
        /* 🔴 Khóa kèm CÂU GIẢI THÍCH — tên là thứ mọi chứng từ sau này dựa vào để truy về đúng
           một đối tượng, thiếu là không truy được.
           📌 KHÔNG còn đòi mã: từ 25/08/2026 mã do tầng ghi tự cấp (`themNhaCungCap`), người
           dùng không nhập nên không thể thiếu. */
        khoaDongY={nccMoi.ten.trim() === "" ? "Phải có tên nhà cung cấp." : undefined}
        onDong={() => setMoThemNCC(false)}
        onDongY={() => {
          const kq = themNhaCungCap(nccMoi);
          if ("loi" in kq) {
            toast.error("Không thêm được vào danh mục", { description: kq.loi });
            return;
          }
          /* Thêm xong thì ĐIỀN LUÔN vào đơn đang lập — người dùng mở hộp này giữa lúc lập đơn,
             bắt họ mở lại danh mục để chọn là thêm một bước vô ích.
             📌 Mã lấy từ KẾT QUẢ trả về, không lấy từ ô nhập: từ 25/08/2026 người dùng không
             nhập mã nữa, `themNhaCungCap` mới là nơi biết mã vừa cấp là gì. */
          setMaNCC(kq.ma);
          setTenNCC(nccMoi.ten.trim());
          if (nccMoi.maSoThue.trim()) setMstNCC(nccMoi.maSoThue.trim());
          if (nccMoi.diaChi.trim()) setDiaChiNCC(nccMoi.diaChi.trim());
          /* Nhắc lại mã vừa cấp — người dùng không tự đặt nên cần thấy app đã cấp số nào. */
          toast.success("Đã thêm vào danh mục", {
            description: `${kq.ma} — ${nccMoi.ten.trim()}`,
          });
          setMoThemNCC(false);
          setNccMoi({ ten: "", maSoThue: "", diaChi: "", dienThoai: "", nguoiLienHe: "" });
        }}
      >
        <div className="flex flex-col gap-(--hp-md-row-gap)">
          <div className="flex flex-col gap-2 sm:flex-row">
            {/**
              * ★★ MÃ DO APP TỰ CẤP, KHÔNG CHO SỬA — Ban lãnh đạo 25/08/2026: *"Mã NCC sẽ tự động
              * sinh ra sau khi nhập thông tin NCC. Theo cấu trúc: NC+0000. Và mục này sẽ không
              * được sửa"*.
              *
              * 🔴 KHÔNG ĐOÁN TRƯỚC CON SỐ, cùng lối với ô "Số đơn hàng". `themNhaCungCap` cấp mã
              * lúc GHI, nên đoán ở đây là hai người cùng thêm một lúc sẽ thấy cùng một mã, rồi
              * bản ghi ra lại mang mã khác cái vừa hiện. Bày phần KHUÔN (`NC0000`) là đủ để
              * người dùng biết mã sẽ ra dạng gì mà không nói một con số có thể sai.
              *
              * 📌 VẪN GIỮ Ô, không bỏ hẳn: bỏ đi thì người dùng không biết app có cấp mã hay
              * không, và lần sau mở danh mục thấy một dãy `NC…` lạ không hiểu ở đâu ra.
              */}
            <div className="flex flex-col gap-1.5 sm:w-1/3">
              <Label htmlFor="ncc-moi-ma">Mã nhà cung cấp</Label>
              <Input id="ncc-moi-ma" value="NC0000 (app tự cấp)" readOnly disabled />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Label htmlFor="ncc-moi-ten">Tên nhà cung cấp *</Label>
              <Input
                id="ncc-moi-ten"
                value={nccMoi.ten}
                onChange={(e) => setNccMoi((c) => ({ ...c, ten: e.target.value }))}
                placeholder="CÔNG TY TNHH …"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-col gap-1.5 sm:w-1/2">
              <Label htmlFor="ncc-moi-mst">Mã số thuế</Label>
              <Input
                id="ncc-moi-mst"
                value={nccMoi.maSoThue}
                onChange={(e) => setNccMoi((c) => ({ ...c, maSoThue: e.target.value }))}
                placeholder="0300000005"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Label htmlFor="ncc-moi-dt">Điện thoại</Label>
              <Input
                id="ncc-moi-dt"
                value={nccMoi.dienThoai}
                onChange={(e) => setNccMoi((c) => ({ ...c, dienThoai: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ncc-moi-dia-chi">Địa chỉ</Label>
            <Input
              id="ncc-moi-dia-chi"
              value={nccMoi.diaChi}
              onChange={(e) => setNccMoi((c) => ({ ...c, diaChi: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ncc-moi-lien-he">Người liên hệ</Label>
            <Input
              id="ncc-moi-lien-he"
              value={nccMoi.nguoiLienHe}
              onChange={(e) => setNccMoi((c) => ({ ...c, nguoiLienHe: e.target.value }))}
              placeholder="Tên · số điện thoại bên nhà cung cấp"
            />
          </div>
        </div>
      </HopXacNhan>

      {/* ===== Hộp xem trước file Excel ===== */}
      <HopXemTruocNhapExcel
        mo={xemTruocExcel !== null}
        duLieu={xemTruocExcel}
        onDong={() => setXemTruocExcel(null)}
        onDo={() => doVaoBang.current?.()}
      />

      {/* 🔴 "Xóa hết dòng" PHẢI HỎI LẠI — bấm nhầm là mất sạch công nhập liệu, không hoàn lại. */}
      <HopXacNhan
        mo={hoiXoaHetDong}
        nguyHiem
        tieuDe="Xóa hết dòng trong bảng?"
        moTa={`Bảng đang có ${dongBang.length} dòng (${soDongHang} dòng hàng). Xóa hết rồi phải chọn lại mặt hàng và nhập lại toàn bộ số liệu.`}
        canhBao="Không có nút hoàn lại. Nếu chỉ muốn bỏ một dòng thì dùng nút thùng rác ở cuối dòng đó."
        nhanDongY="Xóa hết dòng"
        onDong={() => setHoiXoaHetDong(false)}
        onDongY={() => setDongBang([])}
      />

      {/* Hỏi trước khi cất — xem `HopXacNhan` về nguyên tắc áp cho việc nào. */}
      <HopXacNhan
        mo={hoiCat !== null}
        tieuDe="Lưu đơn mua hàng này?"
        /* Ngày hiện theo kiểu Việt Nam, và nói rõ là KHOẢNG khi đơn có ngày kết thúc — chuỗi
           `2026-08-30` kiểu máy đọc thì người lập phải dịch trong đầu. */
        moTa={`Đơn cho ${tenNCC.trim() || "nhà cung cấp"} với ${soDongHangHopLe} mặt hàng, nhận hàng ${
          ngayGiao
            ? [ngayGiao, ngayGiaoDen]
                .filter(Boolean)
                .map((d) => new Date(d).toLocaleDateString("vi-VN"))
                .join(" — ")
            : "chưa chọn ngày"
        }.`}
        /**
         * ★ VIẾT LẠI CHO NGƯỜI DÙNG HIỂU — Ban lãnh đạo 27/08/2026 chỉ đúng câu này: *"này là
         * sao, a không hiểu"*.
         *
         * 🔴 CÂU CŨ VIẾT THEO GÓC NHÌN DỮ LIỆU: *"Khối lượng bị trừ khỏi phần chưa lên đơn của
         * đề nghị"* — đúng về mặt kỹ thuật, nhưng "phần chưa lên đơn" là một khái niệm bên trong
         * app, người lập không có lý do gì phải biết. Và *"Không hoàn lại được"* thì không nói
         * được là KHÔNG HOÀN LẠI CÁI GÌ.
         *
         * ✅ Câu mới nói đúng ba việc người lập cần biết trước khi bấm: đơn được cấp số thật,
         * phần vật tư này coi như đã đặt nên không lập đơn khác cho nó nữa, và muốn sửa thì phải
         * huỷ đơn chứ không có nút hoàn lại.
         *
         * 📌 Câu cảnh báo phải ĐÚNG với việc sắp xảy ra: đơn độc lập không trừ khối lượng của đề
         * nghị nào, nói ngược lại là hứa một chuyện app không làm.
         *
         * 🔴 CÂU RIÊNG CHO ĐỘC LẬP CẬP NHẬT 29/08/2026: trước đây đơn độc lập không cất được nên
         * câu này chưa từng chạy tới người dùng thật (xem lịch sử ở khối chú thích đầu file).
         * Nay chạy thật với `quyen.taoPoDoiLap` — phải nói rõ đơn vào trạng thái "Chờ đề nghị",
         * không hiện trên bảng Quy trình mua hàng (bảng đó liệt kê theo đề nghị, đơn này chưa có
         * đề nghị nào), nhưng VẪN hiện ở "Danh sách đơn hàng" và tính vào Công nợ nhà cung cấp
         * bình thường — và phải bổ sung đề nghị (nút "+ Gắn đề nghị") thì mới hết cảnh báo màu.
         */
        canhBao={
          laDonDocLap
            ? "Đơn vào trạng thái \"Chờ đề nghị\" — chưa gắn phiếu đề nghị nào nên không hiện trên bảng Quy trình mua hàng, nhưng vẫn hiện ở Danh sách đơn hàng và tính vào Công nợ nhà cung cấp bình thường. Bổ sung đề nghị sau bằng nút “+ Gắn đề nghị” ở trang chi tiết đơn."
            : "Lưu xong, số vật tư trong đơn này được tính là đã đặt hàng — phần còn lại của phiếu đề nghị giảm đi tương ứng, và không lập đơn khác cho phần đó nữa. Muốn sửa thì phải huỷ đơn rồi lập lại."
        }
        nhanDongY={hoiCat === "cat-in" ? "Lưu và In" : "Lưu"}
        onDong={() => setHoiCat(null)}
        onDongY={() => luu(hoiCat === "cat-in")}
      />
    </section>
  );
}

/**
 * ★ BIỂU TƯỢNG BÀN PHÍM của thanh tiêu đề MISA — danh sách phím tắt.
 *
 * 🔴 CHỈ LIỆT KÊ PHÍM CÓ THẬT. Hai phím dưới đây đều đang được bắt thật: F3 ở `BangHangTien`
 * (đưa con trỏ vào ô tìm nhanh), F9 ở `FormLapDonMuaHang` (thêm nhanh một mặt hàng). Liệt kê
 * thêm phím mà app không bắt là đúng kiểu "giao diện hứa một việc app không làm".
 *
 * 🔴 CHỖ GỌI CHỈ VẼ NÚT NÀY KHI `!nhung` — nhúng trong trang chi tiết đề nghị thì app cố ý không
 * bắt phím nào, nên danh sách sẽ rỗng. Chốt đó nằm ở chỗ gọi (`nutTroGiup`), không ở đây.
 */
function NutPhimTat() {
  const [mo, setMo] = useState(false);

  const dsPhim: { phim: string; viec: string }[] = [
    { phim: "F3", viec: "Tìm nhanh trong bảng Hàng tiền — lọc theo mã hàng, tên hàng, thông số, ĐVT, mục đích sử dụng." },
    { phim: "F9", viec: "Thêm nhanh một mặt hàng vào bảng Hàng tiền." },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setMo(true)}
        /* Vùng chạm 44×44 theo V1.1 Phần F. */
        className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-primary hover:text-primary"
        aria-label="Xem danh sách phím tắt"
        title="Phím tắt"
      >
        <Keyboard className="size-4" aria-hidden />
      </button>

      <Dialog open={mo} onOpenChange={(v: boolean) => !v && setMo(false)}>
        {/* 🔴 `sm:max-w-md` — viết `max-w-md` trơn là VÔ HIỆU, lớp gốc base-nova đã có
            `sm:max-w-sm` và tailwind-merge chỉ bỏ được lớp cùng biến thể. */}
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Phím tắt</DialogTitle>
            <DialogDescription>
              Chỉ có tác dụng trên màn Lập đơn mua hàng này.
            </DialogDescription>
          </DialogHeader>
          <dl className="flex flex-col gap-2.5 text-sm">
            {dsPhim.map((p) => (
              <div key={p.phim} className="flex items-start gap-3">
                <dt className="shrink-0 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-text-primary">
                  {p.phim}
                </dt>
                <dd className="min-w-0 text-text-secondary">{p.viec}</dd>
              </div>
            ))}
          </dl>
          {/* ⚠️ Nói rõ giới hạn thay vì để người dùng bấm F3 ở trang khác rồi tưởng app lỗi. */}
          <p className="text-xs text-text-desc">
            Khi phần nhập liệu này nằm trong trang chi tiết phiếu đề nghị, hai phím trên{" "}
            <strong>cố ý không hoạt động</strong> — ở đó chúng sẽ cướp phím của ô bình luận và
            bảng phân bổ. Dùng nút <strong>Thêm dòng</strong> và ô tìm trên bảng thay thế.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Một dòng của khối tổng hợp tiền ở góc dưới phải. */
function DongTongHop({
  nhan,
  giaTri,
  tong,
}: {
  nhan: string;
  giaTri: number;
  tong?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        tong ? "border-t border-divider pt-2" : ""
      }`}
    >
      <dt className={tong ? "font-bold text-text-primary" : "text-text-desc"}>{nhan}</dt>
      <dd
        className={`tabular-nums ${
          tong ? "text-h3 font-bold text-primary" : "font-medium text-text-primary"
        }`}
      >
        {giaTri.toLocaleString("vi-VN")} ₫
      </dd>
    </div>
  );
}

/**
 * HỘP CHỌN MẶT HÀNG cho nút [Thêm dòng] và phím F9.
 *
 * 🔴 VÌ SAO KHÔNG CHÈN MỘT DÒNG TRẮNG NHƯ MISA: mỗi dòng hàng bắt buộc nối về một dòng của
 * phiếu đề nghị đã được phân bổ, vì khối lượng đặt phải trừ vào đó. Cho gõ tự do là mở đường
 * đặt hàng ngoài đề nghị — mua hàng không ai duyệt. Nên nút thêm dòng mở đúng danh sách mặt
 * hàng còn đặt được của đề nghị này.
 */
function HopChonMatHang({
  mo,
  matHang,
  onDong,
  onChon,
}: {
  mo: boolean;
  matHang: TienDoDongDeNghi[];
  onDong: () => void;
  onChon: (dsStt: number[]) => void;
}) {
  const [daChon, setDaChon] = useState<number[]>([]);

  /* Dọn lựa chọn mỗi lần mở lại: giữ lựa chọn cũ thì lần sau mở ra đã có sẵn dấu tick của
     mặt hàng vừa thêm, người dùng bấm Thêm là ra dòng trùng. */
  useEffect(() => {
    if (mo) setDaChon([]);
  }, [mo]);

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      {/* 🔴 `sm:max-w-lg` — viết `max-w-lg` trơn là vô hiệu, lớp gốc base-nova đã có
          `sm:max-w-sm` đè lên. */}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm mặt hàng vào bảng</DialogTitle>
          <DialogDescription>
            Chỉ hiện mặt hàng của phiếu đề nghị còn khối lượng chưa lên đơn và đã được phân bổ
            cho bạn.
          </DialogDescription>
        </DialogHeader>

        {matHang.length === 0 ? (
          <p className="text-sm text-text-desc">
            Không còn mặt hàng nào để thêm. Tất cả đã nằm trong bảng, đã lên đơn đủ khối lượng,
            hoặc chưa được phân bổ cho bạn.
          </p>
        ) : (
          <ul className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
            {matHang.map((d) => (
              <li key={d.stt}>
                <label className="flex min-h-11 items-start gap-3 rounded-lg border border-border p-2.5">
                  <Checkbox
                    checked={daChon.includes(d.stt)}
                    onCheckedChange={(c: boolean) =>
                      setDaChon((t) => (c ? [...t, d.stt] : t.filter((x) => x !== d.stt)))
                    }
                    aria-label={`Chọn ${d.tenVatLieu}`}
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-text-primary">
                      {d.stt}. {d.tenVatLieu}
                    </span>
                    <span className="text-xs text-text-desc">
                      Còn chưa lên đơn: {d.khoiLuongChuaLenPO.toLocaleString("vi-VN")}{" "}
                      {d.donViTinh}
                      {d.nguoiPhuTrachTen ? ` · phụ trách ${d.nguoiPhuTrachTen}` : ""}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Hủy
          </Button>
          <Button
            disabled={daChon.length === 0}
            onClick={() => {
              onChon(daChon);
              onDong();
            }}
          >
            Thêm {daChon.length > 0 ? `${daChon.length} dòng` : "dòng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
