# 4 — PHÂN QUYỀN

**Ai được làm gì, ai được xem gì.** Đặc biệt: ai được xem giá.

## Hai file

| File | Việc |
|---|---|
| **`quyen.ts`** | Định nghĩa cấp quyền, tính ra danh sách việc được làm, và 5 vai trò mẫu để chạy thử |
| **`nguoi-dung-hien-tai.tsx`** | Giữ vai trò đang dùng; ở bản chạy thử thì đổi được trên Header |

## Cấp quyền — theo đúng chuẩn App Tổng HPcore

| Cấp | Tên | Ý nghĩa |
|---:|---|---|
| 1 | Xem | Chỉ đọc |
| 2 | Nhập liệu | Tạo / sửa dữ liệu của mình |
| 3 | Quản lý | Duyệt, sửa dữ liệu của người khác trong module |
| 4 | Quản trị | Toàn quyền module |

Lưu ở `users/{uid}.apps.tm` trên Firestore của HPcore, đồng bộ sang token bằng Cloud Function.

🔴 **1 là thấp nhất, 4 là cao nhất.** Bản app thu mua cũ ghi nhãn **ngược lại** ("Level 1 = Trưởng phòng toàn quyền") — **đừng copy nhãn đó**. Căn cứ: `12. APP TONG HPC/2. OUTPUT/firestore-design/CAU-TRUC-FIRESTORE.md` §2.2.

## Cách dùng trong giao diện

Component **không tự suy cấp bậc**. Nó chỉ hỏi "tôi được làm gì":

```tsx
const { quyen } = useNguoiDung();
if (quyen.xemGia)          { /* hiện khối giá */ }
if (quyen.phanBoCongViec)  { /* hiện nút phân bổ */ }
```

Danh sách quyền: `xemGia` · `xemNhaCungCap` · `xemNguoiPhuTrach` · `phanBoCongViec` · `lapPO` · `suaPODaChot` · `ghiPhieuNhanHang` · `xacNhanKho` · `xacNhanTruongBP` · `xemMoiHoSo` · `xuatHoSo`.

Muốn đổi ai được làm gì → sửa **một chỗ duy nhất**: hàm `tinhQuyen` trong `quyen.ts`.

## Năm vai trò mẫu (chỉ dùng khi chưa nối đăng nhập thật)

| Vai trò | `apps.tm` | Xem giá | Xem NCC |
|---|:---:|:---:|:---:|
| Trưởng bộ phận Thu mua | 3 | ✅ | ✅ |
| Nhân viên Thu mua | 2 | ✅ | ✅ |
| Thủ kho công trình | 1 (+ `kh` 2) | 🔒 ❌ | ✅ |
| Phòng Thi công (người đề nghị) | 1 | 🔒 ❌ | ❌ |
| QLDA | 1 | ✅ | ✅ |

## ⚠️ Điều quan trọng nhất phải hiểu

**Quyền ở đây CHỈ điều khiển giao diện — không phải bảo mật.**

Bảo mật thật nằm ở **Firestore Security Rules** trên HPcore. Nếu chỉ ẩn ở giao diện mà rule cho đọc, thì mở công cụ lập trình của trình duyệt ra là thấy hết.

Đó là lý do đơn giá được tách sang chứng từ riêng `tm_donhang_gia` (xem `3-du-lieu/README.md`) — để rule chặn được thật.

**Việc chưa làm:** viết Security Rules. Phác thảo ở mục 3.7 của `../2. THIET KE/01-DAC-TA-APP-THU-MUA-v0.2.md`.
