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
| Sai ở **chi tiết Đề nghị** | `1-giao-dien/trang/de-nghi-chi-tiet.tsx` |
| Sai ở **màn Phân bổ công việc** | `1-giao-dien/trang/phan-bo.tsx` + `thanh-phan-nghiep-vu/bang-phan-bo.tsx` |
| Sai ở **danh sách Đơn hàng** | `1-giao-dien/trang/don-hang-danh-sach.tsx` |
| Sai ở **chi tiết Đơn hàng** | `1-giao-dien/trang/don-hang-chi-tiet.tsx` |
| Sai ở **bảng tiến độ nhận hàng** (cột theo từng lần giao) | `thanh-phan-nghiep-vu/bang-tien-do-po.tsx` |
| Sai ở **màn Lập đơn đặt hàng** | `1-giao-dien/trang/don-hang-lap-moi.tsx` |
| **Trang IN đơn mua hàng A4** sai bố cục / thiếu ô so với biểu mẫu giấy | `1-giao-dien/trang/don-hang-in.tsx` — địa chỉ `/in/don-hang/[id]` |
| **Ô tìm kiếm** trên thanh trên không ra kết quả / ra sai | Giao diện: `khung-app/o-tim-kiem.tsx` · **Luật tìm và lọc quyền**: `2-quy-trinh/tim-kiem.ts` |
| **Khối "Người theo dõi"** sai / không thêm được người | `thanh-phan-nghiep-vu/khoi-nguoi-theo-doi.tsx` + danh sách người chọn ở `3-du-lieu/danh-ba-nhan-su.ts` |
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
| Thiếu / thừa **mục trong menu** | `2-quy-trinh/dieu-huong.ts` |
| **"Sao không thấy Phân bổ / Đơn đặt hàng / Báo giá trong menu?"** | Xem mục 2b ngay dưới đây — **cố ý bỏ, không phải mất** |
| Sai **điều kiện hoàn thành PO** (3 lớp xác nhận) | `2-quy-trinh/tinh-toan.ts` → `poDuDieuKienHoanThanh` |
| **Đề nghị nằm sai cột** trên bảng quy trình, hoặc sai chữ "Quá hạn / Còn N ngày" | `2-quy-trinh/giai-doan-mua-hang.ts` |
| Sai **phân nhóm tuổi nợ 30-60-90** hoặc **mức rủi ro NCC** | `2-quy-trinh/tuoi-no.ts` |
| Sai **ô "giá thấp nhất"** hoặc **tổng theo NCC** ở bảng so sánh báo giá | `2-quy-trinh/so-sanh-bao-gia.ts` |
| Sai **chiết khấu · thuế GTGT · tổng tiền thanh toán** của đơn hàng | `2-quy-trinh/tinh-toan.ts` → `tinhKhoiTongTien` (**nơi duy nhất** tính; màn lập đơn, màn xem, trang in đều gọi về đây) |
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
| Nút **"Nhận công tác"** / nhãn "Chờ tiếp nhận" sai | `3-du-lieu/kho-du-lieu.tsx` → `nhanCongTac` + thẻ ở `thanh-phan-nghiep-vu/bang-quy-trinh-mua-hang.tsx` |
| Sai **số người theo dõi** trên thẻ bảng quy trình | `3-du-lieu/du-lieu-mau.ts` (trường `nguoiTheoDoi`) + hiển thị ở `bang-quy-trinh-mua-hang.tsx` |
| **Nhận đề nghị giả lập báo "hết chỗ"**, hoặc bấm thẻ mới ra trang 404 | `3-du-lieu/du-lieu-mau.ts` → `ID_DE_NGHI_GIA_LAP` (12 id khai sẵn). Tăng số lượng thì phải build lại |

### Phân quyền

| Hiện tượng | Sửa file |
|---|---|
| Vai trò **thấy giá mà không được thấy** (hoặc ngược lại) | `4-phan-quyen/quyen.ts` → `tinhQuyen` |
| Cần **thêm vai trò** để chạy thử | `4-phan-quyen/quyen.ts` → `VAI_TRO_MAU` |
| Đổi vai trò trên Header không ăn | `4-phan-quyen/nguoi-dung-hien-tai.tsx` |

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
| `firebase.json` | Cấu hình phát hành. **Thứ tự luật `headers` rất quan trọng** |

### 🔴 `firebase.json` — luật cache, đừng đảo thứ tự

```
1. "**"                → no-cache          (mặc định: mọi thứ đều phải hỏi lại server)
2. "/_next/static/**"  → cache 1 năm       (tên tệp có mã băm nên đổi nội dung là đổi tên)
```

**Luật hẹp phải nằm SAU luật rộng thì mới đè lên được.** Đảo lại là tệp tĩnh mất cache, trang nặng hẳn.

Lỗi đã gặp ngày 06/08/2026: luật cũ bắt theo đuôi `**/*.@(html|txt|json)`, nhưng `cleanUrls: true`
biến địa chỉ thành `/de-nghi` **không có đuôi `.html`** → không khớp luật nào → rơi về mặc định
`max-age=3600`. Hậu quả: **deploy xong người dùng phải chờ tới 1 tiếng mới thấy bản mới.**
Cách kiểm nhanh sau mỗi lần đổi cấu hình này:

```js
fetch('/de-nghi?v=' + Date.now(), { cache: 'reload' }).then(r => r.headers.get('cache-control'))
// phải trả về: no-cache, no-store, must-revalidate
```

---

*Lập ngày 05/08/2026. Cấu trúc này sắp xếp theo yêu cầu của Ban lãnh đạo: mỗi thư mục chỉ chứa code của một việc, đặt tên rõ nghĩa để người vào sau tự tra được.*
