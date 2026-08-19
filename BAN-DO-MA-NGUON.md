# BẢN ĐỒ MÃ NGUỒN — App Thu mua

> **File này trả lời một câu duy nhất: app lỗi ở chỗ này thì sửa file nào.**
> Không cần biết lập trình vẫn tra được. Mỗi thư mục có `README.md` riêng giải thích chi tiết bên trong.

---

## 1. SÁU THƯ MỤC — MỖI THƯ MỤC MỘT VIỆC

| Thư mục | Chứa gì | Sửa khi nào |
|---|---|---|
| **`1-giao-dien/`** | Mọi thứ người dùng **nhìn thấy** | Sai chữ, sai màu, sai bố cục, thiếu cột, muốn thêm nút |
| **`2-quy-trinh/`** | **Quy tắc nghiệp vụ**: tính toán, trạng thái, điều hướng | Số liệu tính sai, trạng thái sai, muốn thêm/bớt mục trong menu |
| **`3-du-lieu/`** | **Mô hình dữ liệu** + kho dữ liệu + dữ liệu mẫu | Thêm/bớt trường, đổi cấu trúc chứng từ, sửa dữ liệu chạy thử |
| **`4-phan-quyen/`** | **Ai được làm gì, ai được xem gì** | Sai quyền, cần thêm vai trò, chặn/mở việc xem giá |
| **`5-ket-noi/`** | Nối với **HPcore.vn / Firebase** | Đổi cấu hình kết nối, nối dữ liệu thật |
| **`6-tien-ich/`** | Hàm dùng chung nhỏ: định dạng số, ngày, đọc số tiền | Sai định dạng ngày, sai dấu phân cách số |

Thêm một thư mục kỹ thuật **không đổi tên được**:

| Thư mục | Vì sao phải giữ |
|---|---|
| **`app/`** | Next.js lấy **đúng tên thư mục làm địa chỉ URL**. `app/(app)/don-hang/[id]/page.tsx` chính là địa chỉ `/don-hang/po-001`. Đổi tên là đổi địa chỉ web. |

> ✅ **`app/` đã được làm mỏng còn 3 dòng mỗi file** — chỉ là **bảng chỉ đường**, không chứa code màn hình. Code màn hình thật nằm ở `1-giao-dien/trang/`.

---

## 2. TRA NHANH: LỖI Ở ĐÂU → SỬA FILE NÀO

### Giao diện

| Hiện tượng | Sửa file |
|---|---|
| Sai chữ / sai cột ở **Tổng quan** | `1-giao-dien/trang/tong-quan.tsx` |
| Sai ở **danh sách Đề nghị** (cả 2 cách xem) | `1-giao-dien/trang/de-nghi-danh-sach.tsx` |
| Sai ở **màn Nhận đề nghị mới (giả lập)** 🧪 | `1-giao-dien/trang/de-nghi-nhan-moi.tsx` |
| Sai ở **bảng quy trình 8 cột** (thẻ, màu thẻ, chữ trên thẻ, chiều cao cột) | `1-giao-dien/thanh-phan-nghiep-vu/bang-quy-trinh-mua-hang.tsx` |
| **Kéo thả thẻ** chuyển sai bước / báo sai lý do | `2-quy-trinh/giai-doan-mua-hang.ts` → `quyetDinhKeoTha` (**luật**) + `trang/de-nghi-danh-sach.tsx` → `xuLyTha` (**mở hộp xác nhận**) / `thucThiKeoTha` (**làm thật**) |
| **Hộp xác nhận chuyển bước** thiếu cảnh báo / sai chữ | `2-quy-trinh/giai-doan-mua-hang.ts` → `dungXacNhanKeoTha` (nội dung) + `trang/de-nghi-danh-sach.tsx` (hộp thoại) |
| **Chuông thông báo** 🔔 trên Header sai / không hiện | `1-giao-dien/khung-app/nut-thong-bao.tsx` (hiển thị) — nguồn dữ liệu ở `3-du-lieu/kho-du-lieu.tsx` |
| **Nút ⓘ Hướng dẫn bước** (đầu cột bảng quy trình + thanh giai đoạn) sai / không mở | Hộp: `thanh-phan-nghiep-vu/hop-huong-dan-giai-doan.tsx` · **Nội dung chữ**: `2-quy-trinh/huong-dan-giai-doan.ts` (🔴 văn bản nghiệp vụ, chép nguyên văn quy trình công ty — không tự sửa) |
| **Khối "Soát theo ngưỡng giá trị"** ở màn báo giá sai số / sai lời nhắc | Hiển thị: `thanh-phan-nghiep-vu/khoi-nguong-gia-tri.tsx` · **Luật**: `2-quy-trinh/nguong-gia-tri.ts` |
| Sai ở **chi tiết Đề nghị** | `1-giao-dien/trang/de-nghi-chi-tiet.tsx` |
| Sai ở **màn Phân bổ công việc** | `1-giao-dien/trang/phan-bo.tsx` + `thanh-phan-nghiep-vu/bang-phan-bo.tsx` |
| Sai ở **danh sách Đơn hàng** | `1-giao-dien/trang/don-hang-danh-sach.tsx` |
| Sai ở **chi tiết Đơn hàng** | `1-giao-dien/trang/don-hang-chi-tiet.tsx` |
| Sai ở **bảng tiến độ nhận hàng** (cột theo từng lần giao) | `thanh-phan-nghiep-vu/bang-tien-do-po.tsx` |
| 🔴 Sai ở **phần NHẬP LIỆU đơn mua hàng** (khối thông tin 3 cột **có nền tô**, sổ xuống Mã NCC, ô chọn Địa điểm giao hàng, hai khối dưới, **thanh nút cuối nền tối**, hai nút Excel, nút Hướng dẫn sử dụng, nút phím tắt, ô cảnh báo "Chưa cất được đơn") | `1-giao-dien/thanh-phan-nghiep-vu/form-lap-don-mua-hang.tsx` — **MỘT FORM, HAI CHẾ ĐỘ** (bảng so sánh ở đầu file), bám màn "Đơn mua hàng" của MISA. Thanh nút cuối **khác nhau theo chế độ**: có đề nghị → [Lưu] [Lưu và In] · mẫu → [In mẫu PO] [Xuất Excel]. 🔴 Nhãn là **"Lưu"**, không phải "Cất" (Ban lãnh đạo đổi 18/08/2026) — ảnh MISA ghi "Cất", đừng đổi lại theo ảnh. 🔴 **Tuyệt đối không chép ruột form ra hai bản**: hai bản chép tay sẽ lệch nhau sau vài lần sửa |
| **"Vào mục Lập đơn mua hàng (PO) mà không thấy nút Lưu — mất chức năng?"** | 🔴 **KHÔNG, đúng chỉ đạo Ban lãnh đạo 18/08/2026**: *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*. Chế độ đó **chỉ in / xuất mẫu, không ghi gì vào hệ thống**, nên hai nút là [In mẫu PO] và [Xuất Excel]. Xem mục **2c**. Cần đơn thật thì lập từ phiếu đề nghị (`/don-hang/tao-moi?prId=…`) — đường đó vẫn có [Lưu] và [Lưu và In] như cũ |
| **Đơn lập ra KHÔNG gắn đề nghị** (mặt hàng gõ tự do, không trừ khối lượng, không hiện trên bảng quy trình) | Chế độ **mẫu** (trước chiều 18/08/2026 gọi là *độc lập* và có cất đơn thật). Bật khi `FormLapDonMuaHang` nhận `deNghi={null}` (vào `/don-hang/tao-moi` không kèm `?prId=`). Cờ trong mã: `laDonDocLap`. 🔴 **Từ chiều 18/08/2026 chế độ này KHÔNG cất đơn** nên trong dữ liệu **không còn sinh ra** `DonDatHang` nào có `prId` rỗng. Kiểu dữ liệu vẫn cho phép (`prId`/`prCode` tùy chọn, `DongPO.sttDongDeNghi` là `undefined`) để đọc được đơn đã cất sáng cùng ngày |
| **Không thấy phần nhập liệu đơn mua hàng ở bước ④** trong trang chi tiết đề nghị | ⚠️ **Đúng như thiết kế từ 18/08/2026.** Ban lãnh đạo: *"sai ý a rồi, a cần e đưa CẢ mục import này ra"* → form đã **CHUYỂN HẲN** sang mục menu **Lập đơn mua hàng (PO)**. Khối bước ④ (`trang/de-nghi-chi-tiet.tsx`) nay chỉ còn danh sách đơn + nút dẫn sang `/don-hang/tao-moi?prId=…`, hiện khi `quyen.lapPO && !hoSoDaDong` |
| Sai ở **trang riêng Lập đơn mua hàng** `/don-hang/tao-moi` (breadcrumb, tiêu đề, **nút X đóng**, điều hướng sau khi cất, đọc tham số `prId`/`rfqId`/`nccId`) | `1-giao-dien/trang/don-hang-lap-moi.tsx` — **cái vỏ mỏng** bọc `FormLapDonMuaHang`. 🔴 **KHÔNG bỏ trang này**: nó là đường DUY NHẤT của chức năng tách PO theo phân bổ báo giá (chỉ nó nhận `rfqId` + `nccId` từ `bao-gia-chi-tiet.tsx`), bảng quy trình mở nó qua `quyetDinhKeoTha` → `mo_trang`, và nó cũng chính là **module lập đơn độc lập** của mục menu |
| **Mục menu "Lập đơn mua hàng (PO)"** sai nhãn / sai nhóm / hiện với vai trò không được lập đơn | `2-quy-trinh/dieu-huong.ts` → `MUC_DIEU_HUONG`. Thêm ngày **18/08/2026** theo chỉ đạo Ban lãnh đạo — xem **mục 2c** để biết vì sao việc này không trái quy ước cũ, **đừng gỡ đi** |
| **Mã đơn hàng sai dạng / trùng nhau** (`260001-HPCS-PO-001`) | `2-quy-trinh/dat-ma-don-hang.ts` → `maDonHangTiepTheo`, gọi từ `3-du-lieu/kho-du-lieu.tsx` → `themDonHang`. 🔴 Lấy **số lớn nhất đã dùng rồi +1**, không đếm số đơn hiện có. Mã dự án rỗng thì `themDonHang` **từ chối cất** thay vì cấp mã `-PO-001` |
| Sai ở **bảng "Hàng tiền"** của màn lập đơn (cột, thứ tự cột, nền hàng tiêu đề, dòng TỔNG CỘNG, **phân trang**, **ô tìm nhanh F3**, nút Thêm dòng / Thêm ghi chú / Xóa hết dòng) | `thanh-phan-nghiep-vu/bang-hang-tien.tsx`. 🔴 Con số tiền **không tính ở đó** — sửa công thức thì vào `2-quy-trinh/tinh-toan.ts` → `tinhTienChiTiet`. 🔴 **Tiền hoặc cột `#` lệch khi sang trang 2 / đang lọc** = ai đó đã đổi `dongTrang` sang `dong.slice().map((d,i)=>…)`; chỉ số phải lấy từ mảng cặp `{ d, viTri }`, xem chú thích đầu file |
| **Nhập Excel vào màn lập đơn** báo sai / bỏ sót dòng | Đọc file: `2-quy-trinh/doc-don-hang-excel.ts` (khớp cột theo TÊN tiêu đề, trả `dongLoi` kèm **số dòng thật trong file**) · Hộp xem trước: `thanh-phan-nghiep-vu/hop-xem-truoc-nhap-excel.tsx` · Đổ vào bảng: `thanh-phan-nghiep-vu/form-lap-don-mua-hang.tsx` → `doVaoBang` |
| **Trang IN đơn mua hàng A4** sai bố cục / thiếu ô so với biểu mẫu giấy | 🔴 **BẢN VẼ TỜ GIẤY nằm ở `1-giao-dien/thanh-phan-nghiep-vu/to-don-mua-hang-a4.tsx`** — sửa ở đây, **MỘT BẢN DUY NHẤT** cho cả đơn thật lẫn bản mẫu (tách ra 18/08/2026). Hai trang gọi nó chỉ lo *lấy dữ liệu + gác quyền*: `trang/don-hang-in.tsx` (`/in/don-hang/[id]`, tra kho theo id) và `trang/don-hang-mau-in.tsx` (`/in/don-hang-mau`, đọc bản mẫu chưa lưu). 🔴 **Cấm chép bố cục thành bản thứ hai** — bản in bám biểu mẫu giấy thật, hai bản sẽ lệch nhau rồi một trong hai gửi sai cho nhà cung cấp |
| **Bản in / file Excel MẪU** (chưa lưu) sai số, thiếu ô, hoặc bấm nút không phản ứng | Dựng đơn tạm: `2-quy-trinh/don-hang-mau.ts` → `dungDonHangMau` (**luật, hàm thuần**) · Hai nút: `thanh-phan-nghiep-vu/form-lap-don-mua-hang.tsx` → `inMauPO` / `xuatExcelMau` · Chuyển sang tab in: `3-du-lieu/ban-mau-don-mua-hang.ts` · Trang in: `trang/don-hang-mau-in.tsx`. Luật chặn dùng chung với đơn thật: `2-quy-trinh/xuat-don-hang-excel.ts` → `vuongMacXuatPO` |
| **Màn báo lỗi của các trang in** (nền trắng, không theo Dark Mode) | `1-giao-dien/thanh-phan-dung-chung/thong-bao-trang-in.tsx` — dùng chung cho cả hai trang in. 🔴 KHÔNG dùng `EmptyState` ở trang in: trang in nền trắng cố định |
| **File Excel xuất ra lệch biểu mẫu** (nút "Xuất Excel" ở chi tiết đơn hàng) | `2-quy-trinh/xuat-don-hang-excel.ts` — bố cục ô đọc từ XML biểu mẫu thật, xem mục "Ba file Excel" trong `2-quy-trinh/README.md` |
| **Nút "Xuất Excel" bị khóa** | `2-quy-trinh/xuat-don-hang-excel.ts` → `vuongMacXuatPO` (thường là chưa có đơn giá) |
| **Ô tìm kiếm** trên thanh trên không ra kết quả / ra sai | Giao diện: `khung-app/o-tim-kiem.tsx` · **Luật tìm và lọc quyền**: `2-quy-trinh/tim-kiem.ts` |
| **Khối "Người theo dõi"** sai / không thêm được người | `thanh-phan-nghiep-vu/khoi-nguoi-theo-doi.tsx` + danh sách người chọn ở `3-du-lieu/danh-ba-nhan-su.ts` |
| **Khối "Đã tách thành N đề xuất con"** — gập/mở, danh sách phiếu con, bảng "Ai đang làm phần nào" | `thanh-phan-nghiep-vu/khoi-de-xuat-con.tsx` (bọc `bang-nang-luc-theo-nhan-vien.tsx`). Quan hệ cha–con dựa trên `DeNghiMuaHang.deNghiGocId`, **không dựa vào tên** |
| **Sửa "SL Báo giá"** ở phần ĐẦU VÀO bước ② | Ô sửa: `thanh-phan-nghiep-vu/o-sua-so-bao-gia.tsx` · Ghi dữ liệu: `3-du-lieu/kho-du-lieu.tsx` → `datSoBaoGiaChoPhieu` (đặt cho **mọi dòng** của phiếu). Muốn mỗi dòng một số khác nhau thì sửa ở bảng Phân bổ công việc |
| 🔴 **"Không lập được bảng báo giá đầu tiên"** / mất đường vào module Báo giá | Đường vào là **menu ⋯ trên thẻ** ở bảng quy trình → *Lập bảng báo giá* (`thanh-phan-nghiep-vu/bang-quy-trinh-mua-hang.tsx` → `ThaoTacThe.onLapBaoGia`, nối ở `trang/de-nghi-danh-sach.tsx`). **Nút ở trang chi tiết đã bỏ 17/08/2026** theo chỉ đạo Ban lãnh đạo. Đường thứ hai là kéo thẻ cột ① → ②, nhưng **điện thoại không kéo được** nên mục menu là lối vào duy nhất trên điện thoại — bỏ nó là module thành mồ côi (mục 3.4b). ⚠️ Mục menu gọi `xuLyTha` chứ không gọi thẳng `taoBaoGiaGiaLap`, để vẫn qua chốt `quyetDinhKeoTha` và vẫn mở hộp xác nhận |
| Sai ở **màn Theo dõi đề nghị** (cho Phòng Thi công) | `1-giao-dien/trang/theo-doi-danh-sach.tsx` · `theo-doi-chi-tiet.tsx` |
| Sai ở **danh sách Báo giá** | `1-giao-dien/trang/bao-gia-danh-sach.tsx` |
| Sai ở **bảng so sánh giá nhà cung cấp** | `1-giao-dien/trang/bao-gia-chi-tiet.tsx` |
| Sai ở **màn Công nợ** (KPI · biểu đồ tuổi nợ · bảng hóa đơn) | `1-giao-dien/trang/cong-no.tsx` |
| Sai **thanh bên / menu** | `1-giao-dien/khung-app/thanh-ben-noi-dung.tsx` |
| Sai **thanh trên** (tìm kiếm, ngày giờ, tài khoản) | `1-giao-dien/khung-app/thanh-tren.tsx` |
| Sai **thanh dưới trên điện thoại** | `1-giao-dien/khung-app/thanh-duoi-mobile.tsx` |
| **Khoảng trắng** quá rộng / quá chật | `app/globals.css` (khối "MẬT ĐỘ HIỂN THỊ") + `khung-app/mat-do.tsx` |
| Sai **màu** | `app/globals.css` (khối token V1.1) — **không sửa màu trong file component** |
| **Màu chủ đạo** (bảng chọn màu 🎨 trên Header) sai / muốn thêm màu | `app/globals.css` (khối "MÀU CHỦ ĐẠO") + `khung-app/mau-chu-dao.tsx` + `khung-app/nut-mau-chu-dao.tsx` |
| **Bảng quy trình không sổ hết chiều cao** màn hình (còn trống phía dưới) | Chuỗi `flex-1` phải liền mạch: `khung-app/khung-tong.tsx` → `trang/de-nghi-danh-sach.tsx` → `bang-quy-trinh-mua-hang.tsx`. Đứt một mắt là bảng co lại |

### Nghiệp vụ và số liệu

| Hiện tượng | Sửa file |
|---|---|
| **Tính sai khối lượng đã nhận / còn lại / %** | `2-quy-trinh/tinh-toan.ts` |
| Sai **chữ trạng thái** hoặc **màu trạng thái** | `2-quy-trinh/trang-thai.ts` |
| Thiếu / thừa **mục trong menu**, hoặc **sai nhóm** (Quan trọng / Quy trình thu mua / Quản trị) | `2-quy-trinh/dieu-huong.ts` — mục ở `MUC_DIEU_HUONG`, nhãn nhóm ở `NHAN_NHOM_MENU`, thứ tự nhóm ở `THU_TU_NHOM`. Nhóm **chỉ để xếp cho dễ tìm, không ảnh hưởng quyền**; nhóm rỗng tự biến mất chứ không để tiêu đề trơ. 🔴 **KHÔNG cắt danh sách ở `khung-app/thanh-duoi-mobile.tsx`**; trước 11/08/2026 chỗ đó có `.slice(0,5)` nên thêm mục thứ 6 là âm thầm mất một mục trên điện thoại |
| **Lịch công việc** thiếu/thừa việc, sai ngày, hiện việc của người khác | Luật: `2-quy-trinh/lich-cong-viec.ts` → `dungLichCuaToi` · Giao diện: `1-giao-dien/trang/lich-cong-viec.tsx` |
| **Ghi chú trên lịch** mất, hoặc người khác đọc được | `3-du-lieu/ghi-chu-ca-nhan.ts` — lưu theo `uid` trong localStorage, **riêng tư tuyệt đối** (Sếp chốt 11/08/2026) |
| **"Sao không thấy Phân bổ / Đơn đặt hàng / Báo giá trong menu?"** | Xem mục 2b ngay dưới đây — **cố ý bỏ, không phải mất** |
| **"Menu có mục Lập đơn mua hàng (PO), trái quy ước 4 mục — gỡ đi?"** | 🔴 **KHÔNG.** Xem mục **2c**: quy ước đó đã được Ban lãnh đạo **đổi ngày 18/08/2026** |
| Sai **điều kiện hoàn thành PO** (4 lớp: giao đủ · phiếu giao nhận · kho · trưởng BP) | `2-quy-trinh/tinh-toan.ts` → `poDuDieuKienHoanThanh` |
| **Thủ kho không bấm được "xác nhận đã nhận đủ"** / bấm được khi lẽ ra không nên | `2-quy-trinh/tinh-toan.ts` → `vuongMacXacNhanKho` (**luật**) · nút ở `trang/don-hang-chi-tiet.tsx` |
| **Đính kèm tệp** không lưu / không mở xem lại được | Kho tệp: `3-du-lieu/kho-tep.ts` (cửa vào) → `kho-tep-firestore.ts` (**chỗ cất thật từ 12/08/2026**, cắt mảnh base64 vì Firestore chỉ cho 1MB/tài liệu) · ô giao diện dùng chung: `thanh-phan-dung-chung/o-dinh-kem-tep.tsx`. ⚠️ `npm run dev` **ngắt khỏi Firebase** nên ở máy lập trình việc đẩy tệp lên sẽ báo lỗi — đó là đúng, phải kiểm trên bản chạy |
| **Không đính kèm được tệp vào một BƯỚC** của quy trình (bước ② báo giá, hợp đồng, hóa đơn NCC…) | Giao diện: `thanh-phan-nghiep-vu/khu-dinh-kem-giai-doan.tsx` (một khu dùng chung cho **cả 6 bước**, nối vào ở `trang/de-nghi-chi-tiet.tsx` qua prop `khuDinhKem`) · Ghi dữ liệu: `3-du-lieu/kho-du-lieu.tsx` → `themTepGiaiDoan` / `goTepGiaiDoan` · Trường: `DeNghiMuaHang.tepGiaiDoan` (khóa = mã giai đoạn). 🔴 **KHÁC `taiLieu`** — `taiLieu` là hồ sơ đầu vào nộp lúc lập phiếu, `tepGiaiDoan` là chứng từ phát sinh trong từng bước, **đừng gộp**. Ban lãnh đạo 17/08/2026 |
| **Không ghi chú được cho một tệp đính kèm**, hoặc ghi chú lưu rồi mà không hiện ra | Giao diện: `thanh-phan-nghiep-vu/khu-dinh-kem-giai-doan.tsx` (nút `NotebookPen` trên từng dòng tệp + hộp "Ghi chú cho tệp") · Ghi dữ liệu: `3-du-lieu/kho-du-lieu.tsx` → `datGhiChuTepGiaiDoan` · Trường: `MoTaTep.ghiChu` ở `3-du-lieu/kho-tep.ts` · Giới hạn 200 ký tự: `DAI_TOI_DA_GHI_CHU_TEP` (**một chỗ duy nhất**, giao diện chỉ đọc lại). 🔴 **Ghi chú KHÔNG phải trang trí** — app không đổi được tên tệp, ảnh tải từ Zalo mang tên máy sinh `1785921139635_…jpg`, nên ghi chú là **nhãn người đọc được** để ba tháng sau còn tra ra đâu là báo giá, đâu là hóa đơn. Hiện **chữ in nghiêng** dưới tên tệp và có cả trong `aria-label` của dòng. Ban lãnh đạo 17/08/2026 |
| **Bấm tên tệp không xem được** / nút tải về sai tên tệp | Một chỗ duy nhất cho cả 5 nơi có tệp: `thanh-phan-dung-chung/lien-ket-tep.tsx` (dòng bấm được) + `hop-xem-tep.tsx` (pop-up căn giữa). Ảnh xem bằng `<img>`, PDF bằng `<iframe>`, Word/Excel **nói thẳng là không xem trước được** thay vì mở ra trang trắng |
| **Đề nghị nằm sai cột** trên bảng quy trình, hoặc sai chữ "Quá hạn / Còn N ngày" | `2-quy-trinh/giai-doan-mua-hang.ts` |
| Sai **phân nhóm tuổi nợ 30-60-90** hoặc **mức rủi ro NCC** | `2-quy-trinh/tuoi-no.ts` |
| Sai **ô "giá thấp nhất"** hoặc **tổng theo NCC** ở bảng so sánh báo giá | `2-quy-trinh/so-sanh-bao-gia.ts` |
| Sai **số báo giá tối thiểu** / **ai duyệt** / **ngưỡng 5–10–20 triệu** | **Luật**: `2-quy-trinh/nguong-gia-tri.ts` — nơi duy nhất đọc ba con số này, đừng viết số vào file khác. **Số thì sửa trên giao diện** ở `/cai-dat-quy-trinh` (từ 13/08/2026), mặc định nằm ở `2-quy-trinh/cau-hinh-quy-trinh.ts` → `CAU_HINH_MAC_DINH`. 🔴 Câu nhắc phải **sinh từ cấu hình** (`chuTien()`), viết cứng "5 triệu" là app xét một đằng nói một nẻo |
| **Trang Cài đặt quy trình** sai / lưu không ăn / mất số vừa lưu | Giao diện: `1-giao-dien/trang/cai-dat-quy-trinh.tsx` · Kiểu + kiểm tra chéo: `2-quy-trinh/cau-hinh-quy-trinh.ts` → `loiCauHinh` · Lưu: `3-du-lieu/kho-du-lieu.tsx` → `luuCauHinhQuyTrinh`. 🔴 **Mất số vừa lưu thì xem `3-du-lieu/luu-tren-may.ts` → `docDuLieuDaLuu`** — hàm đó dựng lại dữ liệu theo **danh sách trắng**, quên khai khóa mới là dữ liệu biến mất **không một dòng lỗi** |
| **Tên đề nghị** tự dựng sai / phòng khác cũng bị dựng tên | `2-quy-trinh/dat-ten-de-nghi.ts` — công thức `mã - hợp đồng, CÔNG TRÌNH`, hiện **chỉ áp cho Phòng Thi công** (`coCongThucTuDong`). Không đổi tên hồi tố phiếu cũ |
| **Nhân bản / tách phiếu** sai mã, mất liên kết cha–con | `2-quy-trinh/nhan-ban-de-nghi.ts` — `maBanSaoTiepTheo` (thêm `(copy)` vào **mã**, không phải tiêu đề) · `phieuGocCua` (cha–con theo **id**, chỉ **một cấp**) |
| Sai **tên / mã phòng ban** | `3-du-lieu/danh-muc-phong-ban.ts` — 16 phòng ban, một chỗ duy nhất, sẵn để nối App Tổng. Kiểu mở (`MaPhongBan = string`) nên App Tổng thêm phòng mới **không làm hỏng build** |
| **Đề xuất NCC của nhân viên** lẫn với **lý do chốt của trưởng bộ phận** | Hai trường **cố ý tách**: `deXuatNCC*` + `lyDoDeXuat` (nhân viên, bước ②) vs `lyDoChonNCC` (trưởng bộ phận, bước ③) — xem `3-du-lieu/kieu-du-lieu.ts` → `BaoGia`. Gộp lại là mất tiếng nói của người đi hỏi giá |
| Sai **chiết khấu · thuế GTGT · tổng tiền thanh toán** của đơn hàng | `2-quy-trinh/tinh-toan.ts` → `tinhTienChiTiet` (**nơi duy nhất** tính; `tinhKhoiTongTien`, `tinhTienDonHang`, `tongGiaTriPO` đều gọi vào đây, màn lập đơn / màn xem / trang in đều dùng chung) |
| **Cột tiền cộng lại không khớp dòng TỔNG CỘNG** | `2-quy-trinh/tinh-toan.ts` → `chiaTheoTyLe` (dồn phần dư vào dòng cuối có trọng số, nên cột luôn cộng đúng bằng tổng) |
| Đơn **trộn nhiều mức thuế** (8% + 10%) in ra sai thuế suất | `2-quy-trinh/tinh-toan.ts` → `moTaThueSuat` + cờ `nhieuMucThue`. 🔴 Không được in thẳng `thueSuatGTGT` khi cờ bật |
| **Nhập Excel không nhận cột / lấy nhầm cột** | `2-quy-trinh/doc-don-hang-excel.ts` → `CACH_VIET_COT` (khớp theo TÊN tiêu đề, không theo vị trí). Thêm cách viết mới thì thêm vào bảng đó |
| Sai **số tiền viết bằng chữ** | `6-tien-ich/doc-so-tien.ts` |
| Vai trò **tìm ra hồ sơ lẽ ra không được thấy** | `2-quy-trinh/tim-kiem.ts` — mọi loại hồ sơ mới đều phải khai quyền ở đây |

### Dữ liệu

| Hiện tượng | Sửa file |
|---|---|
| Cần **thêm/bớt trường** của Đề nghị, PO, Phiếu nhận hàng | `3-du-lieu/kieu-du-lieu.ts` |
| Cần đổi **dữ liệu chạy thử** | `3-du-lieu/du-lieu-mau.ts` |
| Thao tác **phân bổ / ghi phiếu nhận / xác nhận** không lưu | `3-du-lieu/kho-du-lieu.tsx` |
| **Nhật ký "Lịch sử"** thiếu dòng / ghi sai người thực hiện | `3-du-lieu/kho-du-lieu.tsx` → `ghiLichSuDeNghi` (mỗi thao tác ghi dữ liệu đều phải gọi) |
| **Chuông thông báo** không báo khi chuyển bước / báo sai | `3-du-lieu/kho-du-lieu.tsx` → khối "THÔNG BÁO CHUYỂN BƯỚC" (so bước trước/sau) + hiển thị ở `khung-app/nut-thong-bao.tsx` |
| Cần **chuyển việc** cho nhân viên khác | `3-du-lieu/kho-du-lieu.tsx` → `chuyenViecDong` + nút ở `thanh-phan-nghiep-vu/bang-phan-bo.tsx`. ⚠️ Bước "Nhận công tác" **đã bỏ hẳn 12/08/2026** — trưởng phòng giao việc thì chắc chắn phải làm, không cần bấm xác nhận |
| Sai **số người theo dõi** trên thẻ bảng quy trình | `3-du-lieu/du-lieu-mau.ts` (trường `nguoiTheoDoi`) + hiển thị ở `bang-quy-trinh-mua-hang.tsx` |
| **Nhận đề nghị giả lập báo "hết chỗ"**, hoặc bấm thẻ mới ra trang 404 | `3-du-lieu/du-lieu-mau.ts` → `ID_DE_NGHI_GIA_LAP` (12 id khai sẵn). Tăng số lượng thì phải build lại |

### Phân quyền

| Hiện tượng | Sửa file |
|---|---|
| Vai trò **thấy giá mà không được thấy** (hoặc ngược lại) | `4-phan-quyen/quyen.ts` → `tinhQuyen` |
| Cần **thêm vai trò** để chạy thử | `4-phan-quyen/quyen.ts` → `VAI_TRO_MAU` |
| Đổi vai trò trên Header không ăn | `4-phan-quyen/nguoi-dung-hien-tai.tsx` |
| **Ai đổi được quyền của ai**, đặt được tới cấp nào | `4-phan-quyen/luat-phan-quyen.ts` → `capDatDuocToiDa` |
| Màn **Phân quyền người dùng** (`/phan-quyen`) | `1-giao-dien/trang/phan-quyen.tsx` |
| Bấm Đổi quyền báo **máy chủ từ chối** | Đúng thiết kế — Firestore đang khóa ghi `nguoi-dung/{uid}`. Bộ rules mở khóa: `5-ket-noi/firestore-phan-quyen-DE-XUAT.rules`, 🔴 **chưa duyệt, chưa deploy** |

### Kết nối

| Hiện tượng | Sửa file |
|---|---|
| Nối Firebase / HPcore | `5-ket-noi/firebase/cau-hinh.ts` + file `.env.local` |
| Phân quyền **ở tầng dữ liệu** (ai đọc được đơn giá, báo giá, công nợ) | `5-ket-noi/firestore.rules` — 🔴 **bản nháp, chưa deploy, và KHÔNG được deploy đè** lên rules của App Tổng |

---

## 2b. BA MÀN HÌNH KHÔNG CÒN TRONG MENU — VẪN CHẠY, CHỈ ĐỔI LỐI VÀO

Chỉ đạo Ban lãnh đạo **06/08/2026**: việc nào đã nằm trong **bảng quy trình 8 cột** ở `/de-nghi`
thì không để thành mục menu riêng nữa. Vào bằng **thẻ trên bảng**, tra bằng **mã hồ sơ lấy từ Đề nghị**.

| Màn hình | Địa chỉ vẫn chạy | Vào bằng đường nào |
|---|---|---|
| Phân bổ công việc | `/phan-bo` | `/de-nghi/[id]` — bảng phân bổ nằm ngay trong trang. Thẻ trên bảng Kanban cũng cảnh báo "Thiếu N dòng chưa phân bổ" |
| Báo giá & so sánh NCC | `/bao-gia` · `/bao-gia/[id]` | `/de-nghi/[id]` — khối **"Bảng báo giá"** |
| Đơn đặt hàng | `/don-hang` · `/don-hang/[id]` | `/de-nghi/[id]` — khối **"Đơn đặt hàng đã tách"** |

🔴 **Không được xóa khối "Bảng báo giá" trong `de-nghi-chi-tiet.tsx`** — đó là lối vào **duy nhất**
tới module Báo giá sau khi bỏ menu. Xóa là module thành mồ côi, không ai vào được.

**Muốn trả một mục về menu:** thêm lại vào mảng `MUC_DIEU_HUONG` trong `2-quy-trinh/dieu-huong.ts`.
Không phải dựng lại gì, màn hình còn nguyên.

✅ **Ô tìm kiếm trên thanh trên ĐÃ CHẠY** (làm ngày 08/08/2026, phiên 05) — đây chính là đường vào
thay cho 3 mục menu trên. Tìm theo **mã hồ sơ · tên công trình · tên và mã vật tư**, gõ không dấu
vẫn ra. Kết quả **lọc theo quyền**: vai trò không được xem báo giá thì không tìm thấy bảng báo giá.

⚠️ **Ô tìm kiếm bị ẩn dưới bề ngang 640px** (`hidden sm:block`, có từ trước). Trên điện thoại
hiện **chưa có** đường vào tra mã hồ sơ — cần làm nút mở ô tìm kiếm cho mobile.

---

## 2c. 🔴 QUY ƯỚC "MENU CHỈ 4 MỤC" ĐÃ ĐƯỢC BAN LÃNH ĐẠO ĐỔI NGÀY 18/08/2026

Ban lãnh đạo **18/08/2026** gửi ảnh chụp khối *"NHẬP ĐƠN ĐẶT HÀNG MỚI"* nằm trong khối bước ④ của
trang chi tiết đề nghị, kèm yêu cầu:

> *"e đưa mục này ra thành 1 mục riêng bên tab trái, với tiêu đề là Lập đơn mua hàng (PO)"*

Nghĩa là quy ước ở mục 2b ngay trên (chốt 06/08/2026: *việc nào đã nằm trong bảng quy trình 8 cột
thì không để thành mục menu riêng*) — cũng chính là quy ước ghi ở `CLAUDE.md` mục **3.4b** —
**không còn tuyệt đối**. Bước ④ nay có **cả thẻ trên bảng quy trình lẫn một mục menu riêng**.

| | |
|---|---|
| Nhãn menu | **Lập đơn mua hàng (PO)** · nhãn ngắn trên điện thoại: **Lập PO** |
| Địa chỉ | `/don-hang/tao-moi` |
| Nhóm sidebar | **Quy trình thu mua** (`quy_trinh`), đặt ngay dưới "Quy trình mua hàng" |
| Ai thấy | Chỉ người có `quyen.lapPO` — đúng cờ mà `duocVaoDuongDan` đang gác địa chỉ này |
| Khai báo ở | `2-quy-trinh/dieu-huong.ts` → `MUC_DIEU_HUONG` |
| Màn hình | `1-giao-dien/trang/don-hang-lap-moi.tsx` |

🔴 **ĐỪNG GỠ MỤC NÀY VÌ "TRÁI QUY ƯỚC 06/08/2026".** Đây là **quyết định có chủ đích của Ban lãnh
đạo ngày 18/08/2026**, không phải sơ suất của người quên quy ước cũ. Muốn bỏ thì phải có chỉ đạo mới.

🔴 **FORM ĐÃ CHUYỂN HẲN RA KHỎI KHỐI BƯỚC ④** (chiều 18/08/2026). Chỉ đạo 17/08/2026 (*"phần nhập
liệu phải nằm trong khối"*) đã được Ban lãnh đạo nói lại ngay hôm sau: *"sai ý a rồi, a cần e đưa CẢ
mục import này ra"*. Khối bước ④ ở `trang/de-nghi-chi-tiet.tsx` nay chỉ còn **danh sách đơn + một
cái nút** dẫn sang `/don-hang/tao-moi?prId=…`.

### Module lập đơn ĐỘC LẬP → nay là **module TẠO MẪU PO** (18/08/2026)

> *"MUC NAY SE LA MODUL RIENG, KHONG LIEN QUAN GI TOI QUY TRINH, NO CHI DE PHUC VU LAP DON DAT
> HANG, NEN E KO CAN LINK NO TOI CAC BUOC QUY TRINH. va e hay hien thi cac truong nhap lieu cua
> modun nay luon"* (sáng 18/08/2026)
>
> *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"* (chiều 18/08/2026)

Ba đường vào, **cùng một component** `thanh-phan-nghiep-vu/form-lap-don-mua-hang.tsx`:

| Đường vào | Địa chỉ | Hành vi |
|---|---|---|
| Mục menu | `/don-hang/tao-moi` | 🔴 Hiện NGAY toàn bộ ô nhập liệu, chế độ **CHỈ TẠO MẪU — không lưu** |
| Thẻ trên bảng quy trình · nút ở khối bước ④ | `/don-hang/tao-moi?prId=…` | Vào thẳng form, **chế độ có đề nghị** (giữ nguyên như trước) |
| Tách PO từ bảng báo giá | `/don-hang/tao-moi?prId=…&rfqId=…&nccId=…` | Vào thẳng form, điền sẵn NCC và giá theo phân bổ |

🔴 **BƯỚC "CHỌN ĐỀ NGHỊ" ĐÃ XÓA HẲN.** Nó chỉ tồn tại sáng 18/08/2026 và bị Ban lãnh đạo bỏ ngay
chiều cùng ngày. Xóa cả `BuocChonDeNghi` lẫn hàm `dongThuocVeNguoi` đi kèm — mã chết thì xóa, cần
lại thì lấy ở lịch sử git.

**Hai chế độ khác nhau ở đâu** (bảng đầy đủ ở đầu `form-lap-don-mua-hang.tsx`):

| | Có đề nghị | CHỈ TẠO MẪU |
|---|---|---|
| Mã dự án | Từ phiếu đề nghị | Người lập **chọn dự án đã có** hoặc gõ mã mới |
| [Thêm dòng] | Hộp chọn mặt hàng của đề nghị | **Dòng trắng** gõ tay |
| Nhập Excel | Đối chiếu `khopVoiDeNghi` | Lấy thẳng mọi dòng đọc được |
| Khối lượng | Trừ vào dòng đề nghị, cắt về phần còn lại | Không trừ vào đâu |
| Thanh nút cuối | **[Lưu]** · **[Lưu và In]** | 🔴 **[In mẫu PO]** · **[Xuất Excel]** |
| Ghi vào hệ thống | Có, qua `themDonHang` | 🔴 **KHÔNG GHI GÌ CẢ** |
| Số đơn hàng | `themDonHang` cấp lúc cất, theo Thông báo 09/2026 | Không cấp — in ra `SO_DON_BAN_MAU` |
| Chốt `vuongMacLapDonHang` | Có | Không áp dụng (không cất nên không có gì để chặn) |
| Chốt để in / xuất được | `vuongMacXuatPO` ở nút Xuất Excel | Cùng `vuongMacXuatPO` ở **cả hai** nút |
| Ô "Tình trạng" | Có, chỉ đọc, luôn `da_chot` | 🔴 **Ẩn hẳn** — bản mẫu không ở trạng thái nào |
| Ô đính kèm tệp | Có — vào `DonDatHang.tepDinhKem` | 🔴 **Ẩn hẳn, thay bằng câu nói rõ lý do** |
| Nhật ký | `DeNghiMuaHang.lichSu` | Không có gì để ghi nhật ký |

🔴 **VÌ SAO CHẾ ĐỘ MẪU KHÔNG CÓ Ô ĐÍNH KÈM** (lỗi thật, sửa 18/08/2026 khi soi lại). `ODinhKemNhieuTep`
cất tệp vào kho tệp **ngay lúc chọn** (`3-du-lieu/kho-tep.ts` → `catTep`, ghi thẳng IndexedDB) rồi mới
trả mô tả về form. Ở chế độ mẫu thì `dungDonHangMau` không mang `tepDinhKem` sang và cũng không có đơn
nào được cất → tệp thành **khối dữ liệu mồ côi**, ăn dung lượng kho tệp mà không hồ sơ nào trỏ tới,
trong khi người lập nhìn nhãn *"Đính kèm cho ĐƠN này"* và tin là đã lưu. Đúng cái mục 3.5 của
`CLAUDE.md` cấm. Nay ẩn ô đó và nói rõ lý do.

🔴 **VÌ SAO CHIỀU 18/08 BỎ NÚT CẤT.** Sáng cùng ngày chế độ này còn cất đơn thật, và đã báo lên Ban
lãnh đạo một rủi ro: nó **ĐI VÒNG QUA CHỐT KIỂM SOÁT CHI TIÊU** `vuongMacLapDonHang` (chốt đòi bảng
báo giá đã chốt NCC mới cắt được đơn) — tức sinh ra cam kết trả tiền cho nhà cung cấp mà không qua
bước ③ *Xét duyệt báo giá*, đúng lỗ hổng chỉ đạo 15/08/2026 sinh ra để vá. Ban lãnh đạo trả lời:
*"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*.

✅ **KHÔNG LƯU THÌ KHÔNG CÓ ĐƠN TRONG DỮ LIỆU → KHÔNG ĐI VÒNG QUA CHỐT NÀO.** Vì vậy nhánh mẫu
**tuyệt đối không được gọi `themDonHang`**; đừng "cải tiến" nó thành đường cất đơn tắt, làm vậy là mở
lại đúng lỗ hổng vừa đóng.

🔴 **NHƯNG BỎ NÚT KHÔNG PHẢI LÀ CHẶN — ĐÃ SIẾT LẠI CẢ Ở TẦNG DỮ LIỆU.** `themDonHang` nay **từ chối
cất đơn thiếu `prId`**, không còn nhánh "bỏ qua chốt cho đơn độc lập" của bản sáng 18/08. Hai lý do:
① hàm ghi dữ liệu còn nhiều đường vào khác ngoài cái nút vừa bỏ (đúng nguyên tắc của chính nó:
*"khóa nút chỉ che một đường trong ba"*); ② có đường đua thật — hộp xác nhận Cất vẽ ngoài nhánh điều
kiện, nên nếu phiếu đề nghị biến mất khỏi kho chung đúng lúc hộp đang mở thì `dn` thành `null` mà
`luu()` vẫn chạy, và trước khi siết thì lần bấm đó cất ra một đơn không qua xét duyệt giá.
Muốn cho cất đơn không gắn đề nghị thì phải có **luật xét duyệt giá thay thế**, đừng chỉ xóa khối `if`.

🔴 **SỐ ĐƠN CỦA BẢN MẪU KHÔNG PHẢI MÃ HỒ SƠ**, cố ý. Hằng số `SO_DON_BAN_MAU` ở
`2-quy-trinh/don-hang-mau.ts` ghi thẳng *"(bản mẫu — chưa cấp số)"*. Không gọi `maDonHangTiepTheo`
vì: ① bản mẫu không cất nên sẽ **chiếm một số rồi bỏ trống**, dãy mã của dự án thủng một số và người
đối chiếu chứng từ giấy không hiểu vì sao thiếu; ② hàm đó **không giữ chỗ**, hai người lập cùng lúc
sẽ thấy cùng một số; ③ in một mã nhìn như thật lên tờ giấy có thể gửi ra ngoài, trong khi hệ thống
không có đơn nào mang mã đó, là **tạo chứng từ giả trôi ra ngoài công ty**.

⚠️ **NÓI RÕ VỚI NGƯỜI DÙNG Ở BA CHỖ**, đừng bỏ chỗ nào: dải cảnh báo đầu form · ô "Số đơn hàng" ·
và **một dòng in thẳng ra giấy** dưới tiêu đề tờ A4 (prop `banMau` của `ToDonMuaHangA4`). Tờ giấy
rời khỏi màn hình rồi thì không còn ngữ cảnh nào cho biết nó chưa vào hệ thống.

⚠️ **Thanh dưới điện thoại nay có tối đa 8 mục** (tài khoản quản trị): 8 × 44px = 352px, vẫn vừa màn
375px nhưng đã sát mép. **Mục thứ 9 là vượt** → khi đó phải xử lý thật ở
`khung-app/thanh-duoi-mobile.tsx`, **tuyệt đối không cắt ngầm bằng `slice`** như trước 11/08/2026.

### Giao diện PO bám màn MISA — vòng 18/08/2026: *"giống 100% như vậy"*

> *"giao diện phần PO e chỉnh lại giống 100% như vậy"* — kèm lại ảnh chụp màn
> **"Đơn mua hàng DMH0532-26"** của MISA.

**Nguyên tắc đã áp, theo đúng thứ tự ưu tiên:** bố cục · thứ tự trường · thứ tự cột bám MISA 100% →
màu thì dùng **token HPCons V1.1** (Ban lãnh đạo 16/08/2026: *"Về màu sắc thì vẫn theo design
system"*) → thành phần tương tác thì **làm thật hoặc không làm**.

| Thành phần MISA | Đã làm ở đâu |
|---|---|
| Nền tô kín khối thông tin chung | `form-lap-don-mua-hang.tsx` → `<Card className="bg-primary-bg">`. `bg-primary-bg` = `color-mix(--hp-primary 12%, transparent)` (Sáng) / `20%` (Tối) → **xanh DƯƠNG nhạt**, không phải xanh ngọc MISA |
| Ô nhập trắng nổi trên nền đã tô | Cùng chỗ → `[&_input]:bg-card dark:[&_input]:bg-card`. 🔴 Bản `dark:` **không phải viết thừa** — `Input` có `dark:bg-input/30` (0,2,0) thắng lớp con-cháu (0,1,1), thiếu nó là ô tan vào nền ở chế độ Tối |
| Nền hàng tiêu đề bảng | `bang-hang-tien.tsx` → `<TableRow className="bg-primary-bg hover:bg-primary-bg">`. 🔴 Sửa tại chỗ gọi, **KHÔNG sửa `nen-tang-ui/table.tsx`** (thư viện nền tảng, quy tắc 3.4b) |
| "Tổng tiền thanh toán" cỡ lớn **ngoài** khối | Đã dời ra ngoài `<Card>` của khối ① |
| Khối tổng hợp phải: không viền, không tiêu đề | Bỏ `<Card>` và bỏ tiêu đề "Tổng hợp". **Giữ mức thuế trong nhãn** — đơn trộn 8%/10% mà ghi một mức là ghi SAI chứng từ thuế |
| Thanh nút đáy nền tối | `bg-nav-base` = **#4B4F55**, cố định cả Sáng lẫn Tối. ⚠️ **KHÔNG đặt màu chữ lên cả thẻ** — nó chảy xuống nút `variant="outline"` (nền `bg-background` rất sáng) làm chữ vô hình |
| Ô nhiều dòng "Điều khoản khác" | Đổi `<textarea>` gốc sang `Textarea` của bộ nền tảng + `min-h-24` (≈4 dòng như MISA) |
| Nút **[Hướng dẫn sử dụng]** | `NutHuongDanGiaiDoan giaiDoan="lap_don_mua_hang" kieu="nut_chu" nhanNut="Hướng dẫn sử dụng"`. Nội dung có sẵn ở `2-quy-trinh/huong-dan-giai-doan.ts` |
| Biểu tượng bàn phím | `form-lap-don-mua-hang.tsx` → `NutPhimTat`. Liệt kê **đúng hai phím app bắt thật**: F3, F9 |
| Nút **X** đóng góc phải | `trang/don-hang-lap-moi.tsx` → `PageHeader.actions`, gọi `router.back()` |
| Nút **sổ xuống** ở Mã nhà cung cấp | `Popover` liệt kê danh mục `nhaCungCap`; chọn một dòng thì `dienNhaCungCap` điền mã / tên / MST / địa chỉ / người liên hệ |
| Ô **CHỌN** Địa điểm giao hàng | Ô chọn gom địa điểm **đã ghi trên đơn thật** (`diaDiemDaCo`), cùng cách `duAnDaCo` đang làm vì app chưa có danh mục. 🔴 Ô chọn chỉ ĐIỀN HỘ, **ô chữ mới giữ giá trị** — nếu ô chọn là nguồn duy nhất thì địa điểm đọc từ Excel sẽ không khớp lựa chọn nào và **biến mất khỏi màn hình** dù vẫn nằm trong đơn |
| Tiêu đề cột xuống 2 dòng | `% Thuế GTGT`, `Trường mở rộng 1` → `whitespace-normal` + bề rộng (lớp gốc `TableHead` có `whitespace-nowrap`) |
| Ba nút [Thêm dòng] [Thêm ghi chú] [Xóa hết dòng] sang **trái**, dưới phân trang | `bang-hang-tien.tsx`, hàng riêng dưới hàng phân trang |

#### 🔴 Hai thứ trước đây BỎ với lý do "app không có sẵn" — nay LÀM THẬT

| | Chỗ làm | Bẫy đã xử |
|---|---|---|
| **Phân trang "20 bản ghi trên 1 trang" + Trước · N · Sau** | `bang-hang-tien.tsx` → `dongCoViTri` / `dongLoc` / `dongTrang` | 🔴 Bảng tra tiền từng dòng bằng **chỉ số trong mảng `dong`** (`tienCuaDong(viTri)`), cột `#` cũng là `viTri + 1`. Cắt trang bằng `dong.slice().map((d,i)=>…)` là chỉ số về 0 → **tiền của trang 2 nhảy về dòng trang 1, cột `#` đánh lại từ 1**. Nên cắt trang trên mảng CẶP `{ d, viTri }`, `viTri` luôn là chỉ số thật. **Đã đo trên trình duyệt:** 22 dòng → trang 2 hiện đúng `#21`,`#22` và tiền nằm đúng dòng 21 |
| **"F3 - Tìm nhanh"** | Cùng file, ô tìm + hiệu ứng bắt phím F3 | Bỏ dấu, không phân biệt hoa thường. `preventDefault` bắt buộc vì F3 là phím tìm kiếm của trình duyệt |

| Sai ở **câu nhắc "Chưa tính vào đơn và không in ra — còn thiếu …"** trên một dòng hàng | `bang-hang-tien.tsx`, ngay dưới ô Số lượng (`boQuaSoDaGo`) | 🔴 Chỉ có ở **chế độ gõ tự do** (`nhapTuDo`). Điều kiện "dòng đã đủ chưa" lấy từ `2-quy-trinh/don-hang-mau.ts` → `dongTuDoDuVaoDon`, **không chép tay** — cùng luật với `hopLe`, khối tính tiền và `dungDonHangMau`. Chỉ nhắc khi người lập ĐÃ gõ Số lượng hoặc Đơn giá > 0; dòng vừa thêm còn trắng thì im lặng |

⚠️ **DÒNG GÕ TỰ DO THIẾU Ô THÌ TIỀN BẰNG 0 — PHẢI CÓ CHỮ GIẢI THÍCH TẠI DÒNG ĐÓ.** Lỗi thật, sửa
18/08/2026: gõ Tên hàng + Số lượng 5 + Đơn giá 2.000 mà bỏ trống ĐVT thì hai ô số vẫn hiện đúng,
nhưng Thành tiền = 0, TỔNG CỘNG = 0, "Tổng tiền thanh toán" = 0 ₫ và **không một chữ nào nói vì
sao**; dòng đó còn bị bỏ hẳn khỏi tờ PO in ra. Câu chung "Cần … ít nhất một dòng hàng có đủ tên
hàng, ĐVT và số lượng" cạnh nút **không chỉ ra dòng nào, ô nào** — bảng có thể dài hơn 20 dòng và
trải nhiều trang. Đừng bỏ câu nhắc này đi.

⚠️ **DÒNG TỔNG CỘNG KHÔNG THEO TRANG, KHÔNG THEO BỘ LỌC** — luôn là tổng của cả đơn, và có câu nói rõ
điều đó ngay dưới bảng khi đang lọc hoặc có nhiều trang. Tổng theo trang là con số vô nghĩa trên
chứng từ.

⚠️ **THÊM DÒNG KHI ĐANG LỌC / ĐANG Ở TRANG 1**: dòng mới nối vào CUỐI mảng nên có thể không khớp bộ
lọc hoặc rơi ra ngoài trang đang xem → người dùng bấm [Thêm dòng] mà **không thấy gì hiện ra**, bấm
tiếp mấy lần rồi sinh ra một loạt dòng trắng. Vì vậy hễ số dòng TĂNG là **tự xóa bộ lọc và nhảy tới
trang cuối** (hiệu ứng `soDongTruoc`). Đã kiểm thật.

#### 🔴 Cố ý KHÔNG làm — và lý do kỹ thuật, đừng "sửa cho giống"

| Thành phần MISA | Vì sao không làm |
|---|---|
| **Thanh nút đáy DÍNH ĐÁY màn hình** | `main` ở `khung-app/khung-tong.tsx` có `overflow-x-hidden`; theo chuẩn CSS một trục `hidden` làm trục còn lại từ `visible` thành `auto` → `main` thành khung cuộn, mà `main` lại cao đúng bằng nội dung nên **không bao giờ cuộn**. `sticky bottom-0` bên trong khung không cuộn là **vô hiệu**. Muốn dính đáy thật phải dùng `fixed`, mà `fixed` sẽ đè lên Bottom Navigation 60px trên điện thoại → **cần Ban lãnh đạo chốt** |
| Nút **"+"** thêm nhanh Nhà cung cấp | **Không tồn tại hàm nào ghi vào danh mục NCC** trong toàn bộ mã nguồn (`nhaCungCap` là hằng số `NHA_CUNG_CAP`, không có `themNhaCungCap`). Không mất việc: ô "Tên nhà cung cấp" cho gõ tự do |
| Nút **"+"** và sổ xuống **Điều khoản thanh toán** | **Không có danh mục điều khoản thanh toán** nào trong `3-du-lieu/` |
| Nút **"+"** Nhân viên mua hàng | Thêm nhân sự là việc của **App Tổng**, không phải app này. Ô vẫn `readOnly` vì tên phải khớp `nguoiPhuTrachUid` |
| **Biểu tượng đồng tiền** cạnh Mã NCC | App **ghi cứng `loaiTien: "VND"`**, không có tỷ giá, không có ô chọn loại tiền. Vẽ nút này là hứa đa tiền tệ mà app không có |
| **Biểu tượng quét mã** ở ô Diễn giải | Không có thư viện giải mã vạch, không có mã dùng camera. Thêm nữa MISA quét để điền **mã hàng**, copy y vị trí đó sang ô Diễn giải là copy **sai chức năng** |
| **Đồng hồ lịch sử** cạnh tiêu đề | Nhật ký của app gắn với **phiếu đề nghị**; một PO **chưa được cất** thì không có nhật ký nào. Làm thật được **chỉ ở màn chi tiết đơn** |
| **Ô tìm "Nhập số đơn đặt hàng"** ở thanh tiêu đề | Làm thật được (dữ liệu `donHang` có sẵn, `command.tsx` chưa nơi nào dùng), **nhưng chưa chốt nó LÀM GÌ**. MISA dùng để kéo đơn đặt hàng của khách vào — app không có khái niệm đó; việc thật gần nhất là *"sao chép nội dung từ một đơn đã lập"*. **Cần Ban lãnh đạo chốt hành vi**, không gắn một ô tìm trang trí |
| **Hai nút bánh răng** | Không rõ hai nút của MISA làm gì khác nhau. Nghĩa hợp lý nhất (ẩn/hiện cột) đụng vào phép tính `colSpan` của dòng ghi chú và dòng TỔNG CỘNG qua nhiều tổ hợp quyền × ẩn cột — rủi ro lệch số ô so với số cột cao hơn hẳn giá trị mang lại |
| **Mũi nhọn ▾ trên [Lưu và In]** | Ở chế độ có đề nghị chỉ có **một** việc in → menu một mục là menu giả. Ở chế độ mẫu đã có hai nút riêng rõ ràng hơn |
| Ô **"Tình trạng"** cho chọn | App có 6 trạng thái riêng đã chốt, đơn mới luôn vào `da_chot`. Bày ô chọn rồi bỏ qua lựa chọn = giao diện hứa việc app không làm |
| Nhãn nút **"Cất"** | 🔴 Ban lãnh đạo đổi thành **"Lưu" / "Lưu và In"** ngày 18/08/2026 |
| Số đơn kiểu **`DMH0532-26`** | Hệ mã bám **Thông báo 09/2026/TB-HPCS** (TGĐ ký) |
| Bỏ hai cột/trường công ty có thêm (`Mục đích sử dụng`, `Người nhận hàng`) | **Chưa bỏ, chờ Ban lãnh đạo quyết** — cả hai đang được biểu mẫu giấy `1. DON HANG HPCONS.xlsx` và trang in dùng |

📌 **Chế độ nhúng (`nhung`) hiện KHÔNG có đường vào nào** — form chỉ còn một chỗ gọi
(`trang/don-hang-lap-moi.tsx`) và chỗ đó không truyền `nhung`. Các nhánh gác `!nhung` (thanh nút tối,
nút phím tắt, dòng chữ F3/F9, `batPhimTat`) vì vậy là **đường dự phòng cho lần nhúng lại**, giữ đúng
để không phải nghĩ lại từ đầu.

---

## 3. HAI QUY TẮC BẮT BUỘC KHI SỬA

**1. Không sửa `1-giao-dien/nen-tang-ui/`.**
Đó là **thư viện ngoài** (shadcn/ui). Sửa vào đó là mất hết khi cập nhật thư viện. Cần khác đi thì sửa ở lớp trên (`thanh-phan-dung-chung/` hoặc `thanh-phan-nghiep-vu/`).

**2. Không viết cứng màu và khoảng cách trong component.**
Màu lấy từ token trong `app/globals.css` (vd `bg-primary`, `text-success-soft`).
Khoảng cách lấy từ biến mật độ (vd `p-(--hp-md-pad)`, `gap-(--hp-md-section)`).
Viết cứng `#096AA7` hay `p-6` là **sai quy chuẩn** — đây đúng là lỗi mà bản `thumua-next` cũ đã mắc.

---

## 4. LUỒNG DỮ LIỆU ĐI QUA CÁC THƯ MỤC

```
      3-du-lieu/du-lieu-mau.ts          (dữ liệu thô — sau này là Firestore)
                 │
                 ▼
      3-du-lieu/kho-du-lieu.tsx         (kho dữ liệu + các thao tác ghi)
                 │
                 ├──────────────► 4-phan-quyen/quyen.ts   (lọc: vai trò này thấy gì)
                 │                          │
                 ▼                          ▼
      2-quy-trinh/tinh-toan.ts        (tính đã nhận · còn lại · % · màu)
                 │
                 ▼
      1-giao-dien/trang/*.tsx          (màn hình hiển thị)
                 │
                 ▼
      app/(app)/*/page.tsx             (bảng chỉ đường → URL)
```

**Đọc bảng này từ dưới lên là cách gỡ lỗi nhanh nhất:** thấy số sai trên màn hình → không phải lỗi giao diện → lên `2-quy-trinh/tinh-toan.ts` xem công thức → vẫn đúng thì xuống `3-du-lieu/` xem dữ liệu vào.

---

## 5. CÁC FILE Ở THƯ MỤC GỐC

| File | Việc |
|---|---|
| `README.md` | Hướng dẫn chạy app, 6 màn hình, 3 điểm cốt lõi |
| `BAN-DO-MA-NGUON.md` | File này |
| `app/globals.css` | **Token màu V1.1 + mật độ hiển thị** — file quan trọng nhất về giao diện |
| `package.json` | Danh sách thư viện + các lệnh (`dev`, `verify`) |
| `next.config.ts` · `tsconfig.json` · `eslint.config.mjs` · `postcss.config.mjs` | Cấu hình kỹ thuật, hiếm khi sửa |
| `components.json` | Cấu hình thư viện shadcn (đã trỏ đúng thư mục mới) |
| `.env.local.example` | Mẫu khai cấu hình Firebase |
| `firebase.json` | **CHỈ còn Firestore rules.** Không có hosting — app chạy trên Vercel |

### 🌐 Phát hành: Vercel, không phải Firebase

`npm run deploy` = `npx --yes vercel --prod`, đẩy thẳng từ máy, không qua GitHub. Chi tiết ở [CLAUDE.md mục 6.3](../CLAUDE.md).

📌 **Cache do Vercel lo, không còn luật `headers` nào phải canh.** Trước 11/08/2026 dự án chạy Firebase Hosting và `firebase.json` có khối `headers` với một cái bẫy: `cleanUrls: true` biến địa chỉ thành `/de-nghi` (không đuôi `.html`) nên luật bắt theo đuôi tệp không khớp gì cả → HTML rơi về `max-age=3600`, deploy xong phải chờ tới **1 tiếng** mới thấy bản mới. Bỏ hosting là hết luôn loại lỗi này.

---

*Lập ngày 05/08/2026. Cấu trúc này sắp xếp theo yêu cầu của Ban lãnh đạo: mỗi thư mục chỉ chứa code của một việc, đặt tên rõ nghĩa để người vào sau tự tra được.*
