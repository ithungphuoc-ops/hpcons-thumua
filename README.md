# thumua-v1 — Khung chạy thử App Thu mua

Module Thu mua (mã app `tm`) trong hệ sinh thái HPcore. **Bản khung chạy thử**: giao diện đầy đủ, dữ liệu mẫu trong bộ nhớ, **chưa nối Firebase**.

| | |
|---|---|
| Đặc tả | [`../2. THIET KE/01-DAC-TA-APP-THU-MUA-v0.2.md`](../2.%20THIET%20KE/01-DAC-TA-APP-THU-MUA-v0.2.md) |
| Kế hoạch tái sử dụng | [`../2. THIET KE/02-KE-HOACH-TAI-SU-DUNG.md`](../2.%20THIET%20KE/02-KE-HOACH-TAI-SU-DUNG.md) |
| Quy chuẩn giao diện | HPCons Design System **V1.1** |
| Ngăn xếp | Next.js 15 · TypeScript strict · Tailwind v4 · shadcn/ui (`base-nova` trên `@base-ui/react`) · TanStack Table · Firebase (chưa bật) |

## 🌐 Bản đã đưa lên mạng

> **https://thumua-v1-hpcons.web.app** — Firebase Hosting, project `print-format-hpcons`, site `thumua-v1-hpcons`.
> Phát hành lần đầu 05/08/2026. Bản app thu mua **cũ** vẫn nguyên ở `thumua-hpcons.web.app`.

⚠️ **Trang này công khai trên internet, không có đăng nhập.** Ai có link đều xem được và đổi được vai trò để xem mọi màn hình. Dữ liệu là **dữ liệu mẫu** (tên nhà cung cấp và giá đều giả) nên không rò rỉ thông tin thật. Khi nối dữ liệu thật thì **bắt buộc phải có đăng nhập HPcore trước**.

Muốn tạm ẩn: `firebase hosting:disable --site thumua-v1-hpcons --project print-format-hpcons`

## Chạy

```bash
npm install
npm run dev
```

Mở http://localhost:3000 → tự chuyển tới `/tong-quan`.

## Phát hành lại sau khi sửa code

```bash
npm run deploy
```

⚠️ **Tắt dev server trước khi build** — nếu không sẽ lỗi `EINVAL readlink .next/diagnostics`.

```bash
npm run verify   # lint + typecheck + build (build vào .next-check, an toàn khi dev server đang chạy)
```

⚠️ **Không chạy `npm run build` khi dev server đang chạy** — hai tiến trình cùng ghi `.next/` sẽ làm hỏng build. Dùng `npm run verify`.

## 6 màn hình

| Đường dẫn | Màn hình | Ghi chú |
|---|---|---|
| `/tong-quan` | M1 Tổng quan | KPI Card đủ 4 thành phần theo V1.1 |
| `/viec-cua-toi` | **Việc của tôi** | ⭐ Màn cá nhân — lọc theo "đến lượt tôi", có ghim sao |
| `/de-nghi` · `/de-nghi/[id]` | M2 Đề nghị mua hàng | Chi tiết có kèm bảng phân bổ |
| `/phan-bo` | **M3 Phân bổ công việc** | ⭐ Mới — bản `thumua-next` cũ không có |
| `/don-hang/tao-moi?prId=` | M4 Lập đơn đặt hàng | Mã PO sinh theo mã dự án |
| `/don-hang` · `/don-hang/[id]` | M5 Theo dõi đơn hàng | ⭐ Bảng tiến độ **cột động theo từng lần giao** |
| `/theo-doi` · `/theo-doi/[id]` | **M6 Theo dõi đề nghị** | ⭐ Mới — cho Phòng Thi công, không thấy giá |

## Chạy thử theo vai trò

Nút **"Vai trò: …"** trên Header đổi giữa 5 vai trò mẫu — dùng để kiểm chứng phân quyền:

| Vai trò | `apps.tm` | Thấy giá | Việc làm được |
|---|:---:|:---:|---|
| Trưởng bộ phận Thu mua | 3 Quản lý | ✅ | Phân bổ · xác nhận hoàn thành PO |
| Nhân viên Thu mua | 2 Nhập liệu | ✅ | Lập PO cho phần được phân bổ |
| Thủ kho công trình | 1 Xem (+`kh` 2) | 🔒 ❌ | Ghi phiếu nhận hàng từng lần · xác nhận đã nhận đủ |
| Phòng Thi công | 1 Xem | 🔒 ❌ | Theo dõi đề nghị của mình (không thấy NCC, không thấy tên NV) |
| QLDA | 1 Xem | ✅ | Xem toàn bộ |

## Mật độ hiển thị — ✅ chốt mức **VỪA**

Ban lãnh đạo chốt ngày **05/08/2026**: **Vừa** là mức chuẩn của app. Hai mức còn lại giữ làm **tùy chọn cá nhân** (nút biểu tượng 3 dòng trên Header, lưu vào `localStorage` của từng máy, không đổi mặc định của app).

| Chế độ | Lề nội dung | Khoảng khu vực | Đệm thẻ | Đệm dòng | Chiều cao nội dung |
|---|---:|---:|---:|---:|---:|
| Thoáng — V1.1 gốc | 24px | 24px | 16px | 12px | 723px *(mốc)* |
| **Vừa** ✅ **chuẩn app** | **16px** | **16px** | **12px** | **10px** | **643px · −11%** |
| Gọn — tùy chọn | 12px | 12px | 8px | 8px | 571px · −21% |

*(Đo trên màn Bảng điều khiển, cửa sổ 800px.)*

Ngoài ra thẻ **"Tổng giá trị"** đã được gộp vào **cùng hàng KPI (5 cột)** thay vì chiếm riêng một hàng ngang — bỏ hẳn một dải ~130px (thẻ 106px + khoảng cách 24px). Tính cả việc này, **Vừa tiết kiệm ~25%** chiều cao so với bố cục trước đó.

**Cách cài:** biến CSS `--hp-md-*` trong `app/globals.css`, đổi theo `data-matdo` trên `<html>`; mặc định khai ở `MAT_DO_MAC_DINH` (`components/providers/mat-do-provider.tsx`). Trong component **chỉ dùng biến, không viết số cứng** cho khoảng cách bố cục.

⚠️ **V1.1 chỉ định nghĩa bộ giá trị "Thoáng"** — mức Vừa hiện chỉ có hiệu lực trong app này. Đã soạn văn bản đề nghị ban hành cho toàn hệ sinh thái: [`../2. THIET KE/03-DE-XUAT-BO-SUNG-MAT-DO-V1.1.md`](../2.%20THIET%20KE/03-DE-XUAT-BO-SUNG-MAT-DO-V1.1.md).

## Ba điểm cốt lõi của bản này

**1. Phiếu nhận hàng theo TỪNG LẦN GIAO** — `tm_donhang/{poId}/nhanhang/{grnId}`.
Bảng tiến độ sinh **một cột cho mỗi lần đã nhập kho**, ví dụ 06/08 nhận 10 bao, 09/08 nhận 5 bao → đã nhận 15, còn lại 5. Bản `thumua-next` cũ chỉ cộng dồn `receivedQuantity` nên mất ngày nhận từng lần.

**2. Chỉ phiếu "đã nhập kho" mới được tính.** Phiếu "chờ kiểm tra" không cộng vào khối lượng đã nhận — tránh báo tiến độ ảo.

**3. Giá tách sang document riêng** `tm_donhang_gia/{poId}`.
Firestore Security Rules chặn ở mức **document**, không chặn theo **trường** → để giá trong PO thì cho thủ kho đọc PO là thủ kho đọc luôn cả giá. Ẩn cột giá trên giao diện **không phải bảo mật**.

## Cấu trúc — mỗi thư mục một việc

> 📍 **Không biết sửa ở đâu? Mở [BAN-DO-MA-NGUON.md](BAN-DO-MA-NGUON.md)** — tra theo hiện tượng lỗi ra đúng tên file. Mỗi thư mục cũng có `README.md` riêng.

```
1-giao-dien/                  Mọi thứ NGƯỜI DÙNG NHÌN THẤY
  trang/                        9 màn hình (code thật của từng trang)
  khung-app/                    Thanh bên · thanh trên · thanh dưới mobile · nút sáng/tối · nút mật độ
  thanh-phan-nghiep-vu/         Bảng phân bổ · bảng tiến độ nhận hàng · timeline đề nghị
  thanh-phan-dung-chung/        Thư viện dùng chung HPCons theo V1.1 (KPI card, timeline, badge...)
  nen-tang-ui/                  🔴 Thư viện ngoài shadcn/ui — KHÔNG SỬA

2-quy-trinh/                  QUY TẮC NGHIỆP VỤ (không có giao diện)
  tinh-toan.ts                  Khối lượng đã nhận · còn lại · % · điều kiện hoàn thành PO
  trang-thai.ts                 Chữ + tông màu cho mọi trạng thái
  dieu-huong.ts                 Mục trong menu, vai trò nào thấy mục nào

3-du-lieu/                    MÔ HÌNH DỮ LIỆU + KHO DỮ LIỆU
  kieu-du-lieu.ts               Đề nghị · PO (không giá) · Giá PO (tách riêng) · Phiếu nhận hàng
  kho-du-lieu.tsx               Nơi giữ dữ liệu + các thao tác ghi
  du-lieu-mau.ts                Dữ liệu chạy thử

4-phan-quyen/                 AI ĐƯỢC LÀM GÌ, AI ĐƯỢC XEM GÌ
  quyen.ts                      Cấp quyền chuẩn App Tổng (1 Xem → 4 Quản trị) + 5 vai trò mẫu
  nguoi-dung-hien-tai.tsx       Vai trò đang dùng

5-ket-noi/                    NỐI VỚI HPCORE.VN
  firebase/                     Cấu hình project `hpcons-portal` — CHƯA bật

6-tien-ich/                   Hàm dùng chung nhỏ: định dạng ngày/số, đọc số tiền, ghép lớp CSS

app/                          ⚠️ CHỈ LÀ BẢNG CHỈ ĐƯỜNG (mỗi file 3 dòng)
  globals.css                   ★ Token màu V1.1 + mật độ hiển thị — file quan trọng nhất về giao diện
  layout.tsx                    Font Inter + các Provider
  (app)/*/page.tsx              Mỗi file 1 dòng trỏ về 1-giao-dien/trang/
```

**Vì sao `app/` không đổi tên được:** Next.js lấy **đúng tên thư mục làm địa chỉ URL** — `app/(app)/don-hang/[id]/page.tsx` chính là `/don-hang/po-001`. Đổi tên là đổi địa chỉ web. Nên `app/` đã được làm mỏng còn bảng chỉ đường, code màn hình dời hết sang `1-giao-dien/trang/`.

## Một lỗi đã sửa trong component tái sử dụng

`components/hpcons/timeline-progress.tsx` của bản cũ truyền `ProgressTrack`/`ProgressIndicator` làm children của `<Progress>`, nhưng chính `<Progress>` **lại tự vẽ thêm một Track nữa** → hiện **hai thanh chồng nhau** và không đổi được màu theo trạng thái. Bản này vẽ thanh trực tiếp bằng token, đồng thời thêm **mốc các lần nhận hàng** trên thanh.

## Việc còn lại để chạy thật

1. Xin App Tổng bổ sung mã app `tm` (document `apps/tm` + regex trong `firestore.rules`)
2. Cấp quyền truy cập Firebase project `hpcons-portal`, điền `.env.local` theo `.env.local.example`
3. Thay `DuLieuProvider` bằng lệnh đọc/ghi Firestore — **giao diện không phải sửa**
4. Viết Security Rules, đặc biệt phần tách `tm_donhang_gia`
5. Bật lại `output: "export"` trong `next.config.ts` + `generateStaticParams` nếu deploy Firebase Hosting
