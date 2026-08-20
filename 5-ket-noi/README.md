# 5 — KẾT NỐI

Nối app này với **HPcore.vn**.

## Trạng thái hiện tại

🟡 **Chưa nối.** App đang chạy bằng dữ liệu mẫu trong bộ nhớ (`3-du-lieu/du-lieu-mau.ts`).

## Điều quan trọng nhất cần biết

> **HPcore.vn và mọi app con dùng CHUNG một Firebase project: `hpcons-portal`.**
> **KHÔNG có API giữa các app.** Các app đọc/ghi cùng một Firestore, khác nhau ở **quyền**.

Nghĩa là app Thu mua, app Kho, app QLDA, app Kế toán **không đẩy dữ liệu qua nhau** — cùng nhìn vào một kho dữ liệu.

Tài liệu chuẩn bắt buộc tuân thủ:
`6. UNG DUNG HPC/12. APP TONG HPC/2. OUTPUT/firestore-design/CAU-TRUC-FIRESTORE.md`

| Quy ước | Nội dung |
|---|---|
| Xương sống liên kết | `projects/{projectId}` |
| Dữ liệu app con | `projects/{id}/{mã app}_{tên}/...` — app này dùng tiền tố **`tm_`** |
| Phân quyền | `users/{uid}.apps.tm` = 1..4, đồng bộ sang token bằng Cloud Function `syncUserClaims` |

## Ba file

| File | Việc |
|---|---|
| `firebase/cau-hinh.ts` | Khởi tạo Firebase. Khai `APP_ID = "tm"`. Chạy được ở **chế độ dữ liệu mẫu** khi chưa khai cấu hình |
| `firebase/da-cau-hinh.ts` | Cho biết đã khai đủ cấu hình chưa |
| **`firestore.rules`** | Security Rules của module `tm` — **bản nháp, chưa deploy** |

### 🔴 `firestore.rules` — ĐỪNG DEPLOY ĐÈ

File này là **một mảnh ghép**, không phải file hoàn chỉnh. Project `hpcons-portal` dùng chung
toàn công ty và đã có `firestore.rules` của App Tổng — deploy đè lên đó là **xóa sạch rule của
mọi app khác**. Cách đúng: chép khối rule của module `tm` sang file của App Tổng, rồi App Tổng deploy.

Chưa kiểm thử vì đội triển khai chưa có quyền vào project. Bốn ca bắt buộc kiểm bằng
Firebase Emulator đã ghi sẵn ở cuối file — quan trọng nhất là **thủ kho đọc `tm_donhang` được
nhưng đọc `tm_donhang_gia` phải hỏng**.

## Cần gì để nối thật

| # | Việc | Chờ ai |
|---|---|---|
| 1 | **Xin bổ sung mã app `tm`** vào App Tổng: tạo chứng từ `apps/tm` + thêm `tm` vào biểu thức module trong `firestore.rules` | Quản trị HPcore |
| 2 | **Cấp quyền truy cập project `hpcons-portal`** cho đội triển khai | Quản trị HPcore |
| 3 | Điền `.env.local` theo mẫu `.env.local.example` (6 biến `NEXT_PUBLIC_FIREBASE_*` + `NEXT_PUBLIC_APP_TONG_URL`) | Đội triển khai |
| 4 | Đổi các hàm ghi trong `3-du-lieu/kho-du-lieu.tsx` sang ghi Firestore | Đội triển khai |
| 5 | **Viết Security Rules** — đặc biệt phần tách `tm_donhang_gia` để chặn quyền xem giá | Đội triển khai + HPcore |

Bước 4 **không phải sửa giao diện** — chỉ thay phần ghi dữ liệu.

## Nhận đề nghị từ App Request (Việc 1, 19–20/08/2026)

🔴 **Đây là ngoại lệ duy nhất so với nguyên tắc "không có API giữa các app" ở trên.** App
Request đứng NGOÀI hệ HPcore (repo/hạ tầng riêng do đội khác giữ) — nên không thể "cùng nhìn
vào một kho dữ liệu" theo cách App Tổng/App Kho/App QLDA đang làm. Phải đi qua REST API,
giống đúng cách QLK CTR đang nhận từ App Request.

| | |
|---|---|
| Route | `app/api/app-request/de-nghi-moi` (`POST`) |
| Hợp đồng dữ liệu | `3-du-lieu/tich-hop-app-request-types.ts` |
| Quy tắc đặt mã / phòng ban | `2-quy-trinh/tich-hop-app-request.ts` (hàm thuần) |
| Nối Firestore | `getHpcoreDb()` ở `5-ket-noi/hpcore-may-chu.ts` — **DÙNG CHUNG** đúng kết nối Admin SDK mà cầu nối SSO (`app/api/auth/hpcore-session`) đang dùng, cùng project `hpcons-portal`, KHÔNG cần khóa/project riêng |

🔴 **Route handler chỉ chạy được vì đã bỏ `output: "export"`** ở `next.config.ts` — việc này đã
làm chung với đợt chuyển sang SSO App Tổng (20/08/2026), cùng một lý do (route handler cần
máy chủ thật).

⚠️ Ghi vào ĐÚNG document `chay-thu/du-lieu-chung` mà giao diện đang lắng nghe qua
`noiKhoChung()` — nên đề nghị mới sẽ **tự hiện ra trên giao diện ngay** (kể cả màn "Theo dõi
đề nghị"), không cần sửa gì ở tầng giao diện/Provider. Chỉ cập nhật field `deNghi` bằng
`{merge: true}` — không đụng các mảng khác (`donHang`, `baoGia`…) trong cùng document, để
giảm rủi ro so với cách giao diện đang ghi đè cả document. Đây vẫn là giải pháp TẠM (một
document chứa cả bộ dữ liệu) — khi Thu mua tách từng chứng từ ra document riêng (theo đúng
kế hoạch "lên bản thật" đã ghi ở trên), điểm ghi này phải sửa theo.

## ⚠️ Không copy `.env.local` bằng tay giữa các máy

Đó là cấu hình môi trường. Xin lại giá trị từ quản trị HPcore, hoặc copy có kiểm tra. Các giá trị `NEXT_PUBLIC_FIREBASE_*` **không phải bí mật** (mọi web app Firebase đều lộ chúng ở phía trình duyệt) — **bảo mật thật nằm ở Security Rules**.
