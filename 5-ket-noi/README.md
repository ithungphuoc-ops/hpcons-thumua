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

## Hai file

| File | Việc |
|---|---|
| `firebase/cau-hinh.ts` | Khởi tạo Firebase. Khai `APP_ID = "tm"`. Chạy được ở **chế độ dữ liệu mẫu** khi chưa khai cấu hình |
| `firebase/da-cau-hinh.ts` | Cho biết đã khai đủ cấu hình chưa |

## Cần gì để nối thật

| # | Việc | Chờ ai |
|---|---|---|
| 1 | **Xin bổ sung mã app `tm`** vào App Tổng: tạo chứng từ `apps/tm` + thêm `tm` vào biểu thức module trong `firestore.rules` | Quản trị HPcore |
| 2 | **Cấp quyền truy cập project `hpcons-portal`** cho đội triển khai | Quản trị HPcore |
| 3 | Điền `.env.local` theo mẫu `.env.local.example` (6 biến `NEXT_PUBLIC_FIREBASE_*` + `NEXT_PUBLIC_APP_TONG_URL`) | Đội triển khai |
| 4 | Đổi các hàm ghi trong `3-du-lieu/kho-du-lieu.tsx` sang ghi Firestore | Đội triển khai |
| 5 | **Viết Security Rules** — đặc biệt phần tách `tm_donhang_gia` để chặn quyền xem giá | Đội triển khai + HPcore |

Bước 4 **không phải sửa giao diện** — chỉ thay phần ghi dữ liệu.

## ⚠️ Không copy `.env.local` bằng tay giữa các máy

Đó là cấu hình môi trường. Xin lại giá trị từ quản trị HPcore, hoặc copy có kiểm tra. Các giá trị `NEXT_PUBLIC_FIREBASE_*` **không phải bí mật** (mọi web app Firebase đều lộ chúng ở phía trình duyệt) — **bảo mật thật nằm ở Security Rules**.
