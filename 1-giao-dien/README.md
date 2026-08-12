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
| `don-hang-lap-moi.tsx` | Lập đơn đặt hàng | `/don-hang/tao-moi` |
| `don-hang-in.tsx` | **In đơn mua hàng A4** theo đúng biểu mẫu giấy của công ty | `/in/don-hang/[id]` |
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
| `thanh-ben-noi-dung.tsx` | Nội dung menu — dùng chung cho thanh bên và ngăn kéo trên điện thoại |
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

## `thanh-phan-nghiep-vu/` — 5 file

| File | Việc |
|---|---|
| `bang-quy-trinh-mua-hang.tsx` | **Bảng quy trình 8 cột dạng Kanban** ở màn `/de-nghi` — dựng theo bảng "TM-QT Mua hàng" đang chạy trên Base.vn. Chỉ hiển thị; việc xác định thẻ thuộc cột nào nằm ở `2-quy-trinh/giai-doan-mua-hang.ts` |
| `bang-phan-bo.tsx` | Bảng phân bổ dòng đề nghị cho nhân viên (M3). Cảnh báo dòng chưa phân bổ |
| `bang-tien-do-po.tsx` | Bảng tiến độ nhận hàng **có cột động theo từng lần giao** + form ghi phiếu nhận hàng |
| `timeline-de-nghi.tsx` | Thanh 5 mốc tiến trình đề nghị, gộp từ nhiều PO |
| `thanh-tien-do.tsx` | Thanh tiến độ nhỏ dùng trong bảng và thẻ |

⚠️ **Không dùng lớp `sr-only` bên trong khung cuộn ngang.** `sr-only` là `position:absolute`,
nó thoát khỏi vùng cắt `overflow-x-hidden` của khung nội dung và kéo giãn cả trang — trên điện
thoại làm toàn bộ màn hình trôi ngang. Lỗi này đã xảy ra khi làm bảng quy trình.

## `thanh-phan-dung-chung/` — 9 file

`kpi-card` · `timeline-progress` · `status-badge` · `empty-state` · `skeletons` · `data-table` · `page-header` · `print-document` · `print-toolbar`

Đặt tên tiếng Anh **có lý do**: Design System V1.1 Phần E gọi đúng các tên này, giữ nguyên để đối chiếu được với quy chuẩn và với các app khác trong hệ sinh thái.

## Ba quy tắc bắt buộc

1. **Không viết cứng màu.** Dùng token: `bg-primary`, `text-success-soft`, `border-border`... Giá trị màu nằm ở `app/globals.css`.
2. **Không viết cứng khoảng cách bố cục.** Dùng biến mật độ: `p-(--hp-md-pad)`, `gap-(--hp-md-section)`, `gap-(--hp-md-card-gap)`.
3. **Mọi trạng thái phải có cả màu và chữ** — luật V1.1. Chữ và tông màu lấy từ `2-quy-trinh/trang-thai.ts`.
