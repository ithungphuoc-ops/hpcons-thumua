# 1 — GIAO DIỆN

Mọi thứ người dùng **nhìn thấy**. Không chứa quy tắc nghiệp vụ, không chứa dữ liệu.

## Bốn thư mục con, theo thứ tự từ ngoài vào trong

| Thư mục | Là gì | Sửa được không |
|---|---|---|
| **`trang/`** | 12 màn hình của app — code thật của từng trang | ✅ Sửa ở đây khi màn hình nào sai |
| **`khung-app/`** | Khung chung mọi trang đều dùng: thanh bên, thanh trên, thanh dưới điện thoại, nút đổi sáng/tối, nút mật độ, nút vai trò | ✅ |
| **`thanh-phan-nghiep-vu/`** | Thành phần riêng của nghiệp vụ thu mua: bảng phân bổ, bảng tiến độ nhận hàng, thanh timeline đề nghị | ✅ |
| **`thanh-phan-dung-chung/`** | Thư viện dùng chung HPCons theo Design System V1.1: thẻ KPI, timeline, badge trạng thái, màn hình trống, bảng dữ liệu, trang in | ⚠️ Sửa cẩn thận — các app khác cũng dùng chung mẫu này |
| **`nen-tang-ui/`** | **Thư viện ngoài** (shadcn/ui): nút, ô nhập, thẻ, bảng, hộp thoại... | 🔴 **KHÔNG SỬA** — mất khi cập nhật thư viện |

## `trang/` — 13 màn hình (1 màn là công cụ chạy thử)

| File | Màn hình | Địa chỉ URL |
|---|---|---|
| `tong-quan.tsx` | Tổng quan | `/tong-quan` |
| `de-nghi-danh-sach.tsx` | Quy trình mua hàng — **2 cách xem: Dạng bảng (Kanban 8 cột) / Danh sách** | `/de-nghi` |
| `de-nghi-nhan-moi.tsx` | 🧪 **Nhận đề nghị mới (giả lập)** — CHỈ để chạy thử, bỏ khi nối Firebase | `/de-nghi/nhan-moi` |
| `de-nghi-chi-tiet.tsx` | Chi tiết đề nghị + bảng phân bổ | `/de-nghi/[id]` |
| `phan-bo.tsx` | Việc tồn cần phân bổ (Trưởng bộ phận) | `/phan-bo` |
| `don-hang-danh-sach.tsx` | Danh sách đơn đặt hàng | `/don-hang` |
| `don-hang-chi-tiet.tsx` | Chi tiết PO + tiến độ nhận hàng + xác nhận hoàn thành | `/don-hang/[id]` |
| `don-hang-lap-moi.tsx` | Lập đơn đặt hàng — **vỏ mỏng** bọc `thanh-phan-nghiep-vu/form-lap-don-mua-hang.tsx` (từ 17/08/2026). 🔴 Từ **18/08/2026 vào từ menu (không `prId`) là MODULE TẠO MẪU PO**: hiện ngay ô nhập liệu, nhưng **không cất đơn** — hai nút cuối là [In mẫu PO] và [Xuất Excel] (Ban lãnh đạo: *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*). Bước "chọn đề nghị" làm sáng hôm đó đã **xóa hẳn**. Vẫn là đường DUY NHẤT của chức năng tách PO theo phân bổ báo giá (`?prId=&rfqId=&nccId=`) | `/don-hang/tao-moi` |
| `don-hang-in.tsx` | **In đơn mua hàng A4** — chỉ lo *tra kho theo id + gác 3 lớp quyền*. 🔴 Bản vẽ tờ giấy ở `thanh-phan-nghiep-vu/to-don-mua-hang-a4.tsx` | `/in/don-hang/[id]` |
| `don-hang-mau-in.tsx` | **In BẢN MẪU đơn mua hàng** (chưa lưu, 18/08/2026) — dùng lại **đúng** tờ A4 của đơn thật, chỉ khác chỗ lấy dữ liệu: đọc kho tạm `3-du-lieu/ban-mau-don-mua-hang.ts` thay vì tra kho theo id. 🔴 Địa chỉ **không có tham số** vì bản mẫu không có id, mà `/in/don-hang/[id]` là trang tĩnh — bịa id tạm là ra 404 | `/in/don-hang-mau` |
| `theo-doi-danh-sach.tsx` | Phòng Thi công theo dõi đề nghị | `/theo-doi` |
| `theo-doi-chi-tiet.tsx` | Chi tiết tiến trình từng mặt hàng | `/theo-doi/[id]` |
| `bao-gia-danh-sach.tsx` | Danh sách bảng báo giá | `/bao-gia` |
| `bao-gia-chi-tiet.tsx` | Bảng so sánh giá nhiều nhà cung cấp | `/bao-gia/[id]` |
| `cong-no.tsx` | Công nợ nhà cung cấp + tuổi nợ 30-60-90 | `/cong-no` |

> Địa chỉ URL do thư mục `app/` quyết định (Next.js). File trong `app/` chỉ có **1 dòng** trỏ về đây.

## `khung-app/` — 12 file

| File | Việc |
|---|---|
| `khung-tong.tsx` | Ghép thanh bên + thanh trên + vùng nội dung. **Lề và khoảng cách toàn app đặt ở đây** |
| `thanh-ben.tsx` | Vỏ thanh bên cố định 260px (chỉ hiện từ 1280px) |
| `thanh-ben-noi-dung.tsx` | Nội dung menu — dùng chung cho thanh bên và ngăn kéo trên điện thoại. 🔴 Danh sách mục khai ở `2-quy-trinh/dieu-huong.ts`, **không sửa ở đây**. Từ 18/08/2026 có thêm mục **"Lập đơn mua hàng (PO)"** theo chỉ đạo Ban lãnh đạo — đừng gỡ vì tưởng trái quy ước "menu chỉ 4 mục", xem `BAN-DO-MA-NGUON.md` mục 2c |
| `thanh-tren.tsx` | Thanh trên 60px: nút menu, tìm kiếm, ngày giờ, các nút bên phải |
| `o-tim-kiem.tsx` | **Ô tìm kiếm hồ sơ theo mã** — đường vào thay 3 mục menu đã bỏ. Luật tìm ở `2-quy-trinh/tim-kiem.ts` |
| `thanh-duoi-mobile.tsx` | Thanh điều hướng dưới đáy, chỉ hiện dưới 768px |
| `dong-ho.tsx` | Ngày giờ trên thanh trên (V1.1 yêu cầu) |
| `nut-sang-toi.tsx` | Đổi giao diện Sáng / Tối |
| `nut-mat-do.tsx` | Đổi mật độ hiển thị (Thoáng / **Vừa** / Gọn) |
| `nut-mau-chu-dao.tsx` | Đổi **màu chủ đạo** của theme — đổi màu là toàn bộ nút, badge, sidebar active đổi theo (cả Sáng lẫn Tối) |
| `mau-chu-dao.tsx` | Bộ điều khiển màu chủ đạo — **mặc định "xanh-duong" #096AA7 chuẩn V1.1** (`MAU_MAC_DINH`), màu khác là tùy chọn cá nhân lưu riêng máy |
| `nut-thong-bao.tsx` | 🔔 **Chuông thông báo chuyển bước** — đề nghị đổi bước là báo. Chỉ BÁO TIN, không còn nút xác nhận (bỏ 12/08/2026) |
| `nut-vai-tro.tsx` | Đổi vai trò để chạy thử — **chỉ có ở bản chạy thử**, bỏ khi nối đăng nhập thật |
| `menu-tai-khoan.tsx` | Menu tài khoản, cho biết vai trò hiện tại có được xem giá hay không |
| `che-do-mau.tsx` | Bộ điều khiển Sáng/Tối (thư viện `next-themes`) |
| `mat-do.tsx` | Bộ điều khiển mật độ — **mức chuẩn "Vừa" khai ở đây** (`MAT_DO_MAC_DINH`) |

## `thanh-phan-nghiep-vu/` — 29 file

⚠️ Bảng dưới **chỉ liệt kê những file hay phải sửa nhất**, không phải danh sách đủ. Danh sách
đủ tra ở `BAN-DO-MA-NGUON.md` mục 2 (hiện tượng → sửa file nào).

| File | Việc |
|---|---|
| `bang-quy-trinh-mua-hang.tsx` | **Bảng quy trình 8 cột dạng Kanban** ở màn `/de-nghi` — dựng theo bảng "TM-QT Mua hàng" đang chạy trên Base.vn. Chỉ hiển thị; việc xác định thẻ thuộc cột nào nằm ở `2-quy-trinh/giai-doan-mua-hang.ts` |
| `bang-phan-bo.tsx` | Bảng phân bổ dòng đề nghị cho nhân viên (M3). Cảnh báo dòng chưa phân bổ |
| `bang-tien-do-po.tsx` | Bảng tiến độ nhận hàng **có cột động theo từng lần giao** + form ghi phiếu nhận hàng |
| `form-lap-don-mua-hang.tsx` | 🔴 **TOÀN BỘ PHẦN NHẬP LIỆU đơn mua hàng — MỘT FORM, HAI CHẾ ĐỘ.** Đề nghị nguồn **truyền vào qua prop `deNghi`** (form KHÔNG đọc `useSearchParams`). `deNghi` **khác `null`** = chế độ cũ: dòng hàng nối về đề nghị, khối lượng bị cắt theo phần còn được đặt, chốt `vuongMacLapDonHang` vẫn chạy, thanh nút **[Cất] [Cất và In]**. `deNghi` **là `null`** = **chế độ CHỈ TẠO MẪU** (Ban lãnh đạo chiều 18/08/2026 *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*): mặt hàng gõ tự do, mã dự án do người lập chọn, thanh nút **[In mẫu PO] [Xuất Excel]** và 🔴 **không gọi `themDonHang`, không ghi gì vào hệ thống** — nhờ vậy không còn đi vòng qua chốt kiểm soát chi tiêu (và `themDonHang` cũng đã siết lại: **thiếu `prId` là từ chối cất**, vì bỏ nút không phải là chặn). Chế độ mẫu còn **ẩn hẳn ô "Tình trạng" và ô đính kèm tệp** — tệp tải lên sẽ vào kho tệp ngay lúc chọn nhưng không có đơn nào để gắn, thành dữ liệu mồ côi (sửa 18/08/2026). Cổng gác `quyen.lapPO` nằm bên trong. 🔴 **Không chép ruột ra hai bản.** ⚠️ Prop `nhung` (bố cục nhúng trong khối bước ④, 17/08/2026) nay **không nơi nào truyền** — form đã dời hẳn sang trang riêng chiều 18/08/2026 |
| `to-don-mua-hang-a4.tsx` | 🔴 **BẢN VẼ TỜ ĐƠN MUA HÀNG A4 — MỘT BẢN DUY NHẤT** cho cả đơn đã cất và bản mẫu chưa lưu (tách khỏi `trang/don-hang-in.tsx` ngày 18/08/2026). Chỉ nhận `po` · `gia` · `ncc` qua prop: **không đọc kho dữ liệu, không đọc địa chỉ URL, không kiểm quyền** — mấy việc đó thuộc TRANG gọi nó. Prop `banMau` in thêm một dòng *"Bản mẫu — chưa cấp số, chưa lưu vào hệ thống"* ngay dưới tiêu đề. 🔴 **Cấm chép bố cục thành bản thứ hai**: tờ giấy bám biểu mẫu thật của công ty, hai bản sẽ lệch nhau rồi một trong hai gửi sai cho nhà cung cấp. ⚠️ Màu và cỡ chữ **viết cứng, cố ý** — chứng từ in ra không đổi màu theo Dark Mode hay tùy chọn cá nhân |
| `bang-hang-tien.tsx` | **Bảng "Hàng tiền" của phần nhập liệu đơn mua hàng**, bám cột và thứ tự cột của MISA (Ban lãnh đạo 17/08/2026) + dòng TỔNG CỘNG + ba nút Thêm dòng · Thêm ghi chú · Xóa hết dòng. 🔴 **Không tự tính một con số tiền nào** — nhận sẵn qua prop `tien` do `2-quy-trinh/tinh-toan.ts` → `tinhTienChiTiet` tính. 🔴 Bốn cột tiền chỉ hiện khi `quyen.xemGia`. Prop `tieuDeTrongKhoiGiaiDoan` hạ cỡ tiêu đề khi bảng nằm trong khối một bước |
| `hop-xem-truoc-nhap-excel.tsx` | **Hộp xem trước khi đổ file Excel vào bảng hàng tiền.** Bày TỪNG DÒNG file kèm **số dòng thật trong Excel** và kết luận riêng (đưa vào đơn · vượt khối lượng · không có trong đề nghị · chưa lập được đơn · ghi chú · không đọc được). Xem trước rồi mới đổ, vì đổ thẳng là xóa mất số liệu đang gõ dở mà không hoàn lại được |
| `khoi-dau-vao-theo-giai-doan.tsx` | Khối gập **theo từng bước** ở trang chi tiết đề nghị (bố cục Base). Mỗi bước ba phần ngang hàng: ĐẦU VÀO · phần làm việc (`noiDungNghiepVu`) · tệp đính kèm (`khuDinhKem`). Nhãn ba phần **bắt buộc dùng chung** `NhanPhanTrongGiaiDoan` để không lệch cỡ chữ. 🔴 Bước nào có **form nhập liệu** thì phải bật `giuNoiDungKhiGap` — mặc định gập là THÁO khỏi cây React, gõ nửa cái đơn rồi gập là mất sạch |
| `khu-dinh-kem-giai-doan.tsx` | **Chỗ đính kèm chứng từ của từng bước** (Ban lãnh đạo 17/08/2026). Một khu dùng chung cho cả 6 bước — báo giá NCC ở bước ②, hợp đồng ở bước ④, hóa đơn ở bước ⑥. Tối đa 5 tệp/bước, gỡ tệp **có hỏi xác nhận**. Mỗi tệp có **nút ghi chú** (17/08/2026): app không đổi được tên tệp nên ghi chú là **nhãn người đọc được** thay cho tên máy sinh của ảnh tải từ Zalo — hiện **chữ in nghiêng** ngay dưới tên tệp, tối đa 200 ký tự, ghi vào hồ sơ qua `datGhiChuTepGiaiDoan` |
| `khoi-de-xuat-con.tsx` | Khối **"Đã tách thành N đề xuất con"** ở trang chi tiết — gập lại được (Ban lãnh đạo 17/08/2026). Dòng tiêu đề luôn hiện kể cả khi gập, vì giấu đi thì người mở phiếu tưởng khối lượng trên màn là toàn bộ. Bên trong bọc `bang-nang-luc-theo-nhan-vien.tsx` |
| `timeline-de-nghi.tsx` | Thanh 5 mốc tiến trình đề nghị, gộp từ nhiều PO |
| `thanh-tien-do.tsx` | Thanh tiến độ nhỏ dùng trong bảng và thẻ |

⚠️ **Không dùng lớp `sr-only` bên trong khung cuộn ngang.** `sr-only` là `position:absolute`,
nó thoát khỏi vùng cắt `overflow-x-hidden` của khung nội dung và kéo giãn cả trang — trên điện
thoại làm toàn bộ màn hình trôi ngang. Lỗi này đã xảy ra khi làm bảng quy trình.

## `thanh-phan-dung-chung/` — 10 file

`kpi-card` · `timeline-progress` · `status-badge` · `empty-state` · `skeletons` · `data-table` · `page-header` · `print-document` · `print-toolbar` · `thong-bao-trang-in`

⚠️ `thong-bao-trang-in.tsx` là **màn báo lỗi riêng của các trang in** (chưa đăng nhập, không đủ
quyền, không tìm thấy hồ sơ). 🔴 Trang in **không dùng `empty-state`**: trang in nền trắng cố định,
không theo Dark Mode và không theo tùy chọn màu cá nhân (quy ước phiên 04), nên màu ở file đó viết
cứng — đúng như `print-toolbar.tsx` và `to-don-mua-hang-a4.tsx`.

Đặt tên tiếng Anh **có lý do**: Design System V1.1 Phần E gọi đúng các tên này, giữ nguyên để đối chiếu được với quy chuẩn và với các app khác trong hệ sinh thái.

## Ba quy tắc bắt buộc

1. **Không viết cứng màu.** Dùng token: `bg-primary`, `text-success-soft`, `border-border`... Giá trị màu nằm ở `app/globals.css`.
2. **Không viết cứng khoảng cách bố cục.** Dùng biến mật độ: `p-(--hp-md-pad)`, `gap-(--hp-md-section)`, `gap-(--hp-md-card-gap)`.
3. **Mọi trạng thái phải có cả màu và chữ** — luật V1.1. Chữ và tông màu lấy từ `2-quy-trinh/trang-thai.ts`.
