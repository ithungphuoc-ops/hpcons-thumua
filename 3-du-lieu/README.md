# 3 — DỮ LIỆU

**Mô hình dữ liệu** (chứng từ có những trường gì), **kho dữ liệu** (nơi giữ và ghi dữ liệu), **dữ liệu mẫu** để chạy thử.

## Các file

| File | Việc | Sửa khi |
|---|---|---|
| **`kieu-du-lieu.ts`** | Định nghĩa mọi chứng từ: Đề nghị, PO, Giá PO, Phiếu nhận hàng, Nhà cung cấp | Cần thêm/bớt trường của một chứng từ |
| **`kho-du-lieu.tsx`** | Giữ dữ liệu + các thao tác ghi (phân bổ, lập PO, ghi phiếu nhận, xác nhận) | Bấm nút mà dữ liệu không đổi |
| **`luu-tren-may.ts`** | Giữ dữ liệu nghiệp vụ qua mỗi lần tải lại trang (localStorage) | F5 mất dữ liệu |
| **`kho-tep.ts`** | **Nội dung tệp đính kèm** (IndexedDB) — phiếu giao nhận, bản báo giá gốc | Đính kèm không lưu, hoặc không mở xem lại được |
| **`danh-ba-nhan-su.ts`** | **Danh bạ nhân sự công ty** — nguồn cho ô chọn "Thêm người theo dõi" | Thiếu người, sai phòng ban, sai chức danh |
| **`du-lieu-mau.ts`** | Dữ liệu chạy thử: **9 đề nghị** (phủ đủ 8 giai đoạn của bảng quy trình), 8 PO, 8 phiếu nhận, 6 bảng báo giá | Muốn đổi số liệu để trình bày |

### `danh-ba-nhan-su.ts` — bám đúng `users/{uid}` của App Tổng

Kiểu `NhanSu` ánh xạ **1-1** với `users/{uid}` trong `CAU-TRUC-FIRESTORE.md` §3.1:
`displayName · employeeCode · department · title · status`.

⚠️ **Tên người là tên giả định**, không phải nhân sự thật của HP CONS.
⚠️ **Mã phòng ban do đội triển khai đặt** — App Tổng chưa ban hành danh mục chính thức
(tài liệu chỉ có một ví dụ `"thiet-ke"`). **Cần App Tổng xác nhận** trước khi nối dữ liệu thật.

Khi nối Firebase: xóa mảng `DANH_BA_NHAN_SU`, đọc collection `users` và lọc `status === "active"`.
Kiểu dữ liệu giữ nguyên → **giao diện không phải sửa**.

**Hai luật đã cài sẵn:** người `inactive` (đã nghỉ) không hiện trong ô chọn · người đã theo dõi
rồi cũng không hiện, nên không thêm trùng được.

### 🔴 `themDeNghiGiaLap` — CHỈ CÓ Ở BẢN CHẠY THỬ

Hàm này trong `kho-du-lieu.tsx` phục vụ màn `/de-nghi/nhan-moi`, mô phỏng việc Phòng Thi công
gửi đề nghị đã duyệt sang. **Ở bản thật KHÔNG được có hàm này** — app Thu mua chỉ đọc đề nghị,
không tạo. Khi nối Firestore: xóa hàm, xóa màn `de-nghi-nhan-moi.tsx`, xóa `ID_DE_NGHI_GIA_LAP`.

⚠️ **Đề nghị giả lập phải lấy id từ `ID_DE_NGHI_GIA_LAP`** (12 id khai sẵn trong `du-lieu-mau.ts`),
không được tự nghĩ id. Bản trên mạng là hosting tĩnh — địa chỉ nào không sinh sẵn lúc build thì
bấm vào ra trang 404. Hết 12 id thì hàm trả về chuỗi rỗng và màn hình báo "đã hết chỗ".

## Năm chứng từ và chỗ lưu trên Firestore

| Chứng từ | Đường dẫn Firestore (khi nối thật) |
|---|---|
| Đề nghị mua hàng | `projects/{maDuAn}/tm_denghi/{prId}` |
| Đơn đặt hàng — **không chứa giá** | `projects/{maDuAn}/tm_donhang/{poId}` |
| **Giá đơn hàng — tách riêng** | `projects/{maDuAn}/tm_donhang_gia/{poId}` |
| **Phiếu nhận hàng — mỗi lần giao một phiếu** | `projects/{maDuAn}/tm_donhang/{poId}/nhanhang/{grnId}` |
| Nhà cung cấp | `tm_ncc/{supplierId}` |

## Hai điểm thiết kế quan trọng nhất

**1. GIÁ NẰM Ở CHỨNG TỪ RIÊNG — không nằm trong PO.**

Firestore chặn quyền ở mức **chứng từ**, **không chặn được từng trường**. Nếu để đơn giá trong PO thì cho thủ kho quyền đọc PO là thủ kho đọc luôn cả giá. Ẩn cột giá trên giao diện **không phải bảo mật** — mở công cụ lập trình của trình duyệt ra là thấy.

→ Vì vậy có hai chứng từ: `tm_donhang` (ai trong dự án cũng đọc được) và `tm_donhang_gia` (chỉ thu mua, QLDA, kế toán).

🔴 **Khi thêm trường mới, phải hỏi: trường này có phải thông tin nhạy cảm không?** Nếu có, đặt vào `tm_donhang_gia`, đừng đặt vào `tm_donhang`.

🔴 **Danh sách `nguoiTheoDoi` KHÔNG được dùng để mở khóa xem giá.** Khi viết Security Rules,
có thể cho `nguoiTheoDoi` quyền đọc `tm_denghi` và `tm_donhang`, **nhưng tuyệt đối không cho đọc
`tm_donhang_gia`** — nếu không thì thêm thủ kho vào danh sách theo dõi là thủ kho thấy đơn giá,
trái quyết định số 8 đã chốt.

**2. MỖI LẦN GIAO LÀ MỘT PHIẾU RIÊNG.**

Bản app thu mua cũ chỉ cộng dồn một con số `receivedQuantity` trên dòng PO → mất ngày nhận từng lần, không biết lần nào nhận bao nhiêu.

Bản này mỗi lần giao lập một phiếu, ghi rõ ngày nhận và khối lượng **của chính lần đó**. Bảng tiến độ sinh một cột cho mỗi lần. Đây là yêu cầu số 1 của Ban lãnh đạo.

⚠️ Khối lượng trong phiếu là **của lần đó**, KHÔNG phải cộng dồn. Hệ thống tự cộng.

## Khóa đối chiếu khối lượng

Ver 1 **chưa có mã vật tư** (Ban lãnh đạo chốt làm sau), nên khối lượng đối chiếu bằng **số thứ tự dòng**:

```
Dòng đề nghị (stt)  ◄── sttDongDeNghi ── Dòng PO (sttDong)  ◄── sttDongPO ── Dòng nhận hàng
```

Khi có mã vật tư, chỉ thêm trường `maVatTu` vào dòng cũ — **không phải làm lại dữ liệu**.

## `kho-tep.ts` — nội dung tệp để riêng, không nhét chung

🔴 **Tệp KHÔNG được nhét vào localStorage.** localStorage chỉ nhận chuỗi (tệp phải mã hóa base64, phình thêm ~33%), giới hạn khoảng 5MB cho **cả tên miền**, mà chỗ đó đang giữ toàn bộ dữ liệu nghiệp vụ. Một ảnh chụp phiếu giao nhận đã 2–5MB → nhét vào là tràn, và `ghiDuLieu` đang **nuốt lỗi im lặng** nên người dùng mất dữ liệu mà không có cảnh báo nào.

IndexedDB chứa được hàng trăm MB và lưu thẳng Blob. Chứng từ chỉ giữ phần **mô tả** (`MoTaTep`: tên, cỡ, kiểu, ai tải, lúc nào, `id` để tra); nội dung nằm trong kho tệp.

| Hàm | Việc |
|---|---|
| `catTep(file, nguoi)` | Cất nội dung, trả `MoTaTep` để gắn vào chứng từ. **Ném lỗi khi quá cỡ** — nơi gọi phải bắt và báo |
| `layTep(id)` · `moTep(mt)` | Đọc lại / mở ra tab mới. Trả `null`/`false` khi máy này không có bản sao |
| `xoaTep(id)` | Dọn khi chứng từ bị xóa |

⚠️ **Tệp nằm trên máy đã tải lên, chưa lên mạng.** Máy khác thấy tên tệp nhưng mở thì báo không còn nội dung — giao diện **phải nói ra**, xem `thanh-phan-dung-chung/o-dinh-kem-tep.tsx`.

### Sáu chỗ hồ sơ giữ `MoTaTep` — đừng gộp chúng lại

| Trường | Nghĩa | Hàm ghi |
|---|---|---|
| `DeNghiMuaHang.taiLieu` | **Hồ sơ đầu vào** nộp kèm lúc lập phiếu: catalogue, bản vẽ, chứng chỉ. Cố định, không sinh thêm | `themDeNghiGiaLap` (một lần duy nhất) |
| `DeNghiMuaHang.tepGiaiDoan` | **Chứng từ phát sinh trong từng bước**, khóa = mã giai đoạn. Báo giá NCC ở bước ②, hợp đồng ở bước ④, hóa đơn ở bước ⑥ (Ban lãnh đạo 17/08/2026) | `themTepGiaiDoan` · `goTepGiaiDoan` |
| `PhieuNhanHang.tepPhieuGiao` | Phiếu giao nhận của **một lần giao**. 🔴 Luật `vuongMacXacNhanKho` kiểm **từng phiếu** qua trường này — `tepGiaiDoan` KHÔNG thay thế được | `themPhieuNhan` · `dinhKemPhieuGiao` |
| `BaoGia.tepBaoGia` | Bản báo giá gốc gắn **trong bảng báo giá**, có kèm `nccId` | `dinhKemBaoGia` |
| `BaoGia.tepChonNCC` | Dẫn chứng chốt nhà cung cấp | `chonNCCChoBaoGia` |
| `BinhLuan.tep` | Ảnh/tài liệu kèm một lời bình | `vietBinhLuan` · `suaBinhLuan` |

🔴 **Gộp bất kỳ hai cái nào là mất khả năng truy ngược.** Biết "hồ sơ có 8 tệp" mà không biết
tệp nào thuộc bước nào, tệp nào là phiếu giao của lần giao thứ mấy, thì lúc đối chiếu chứng
từ phải mở từng cái ra đoán.

⚠️ **Gỡ tệp khỏi hồ sơ KHÔNG xóa nội dung khỏi kho** ở hầu hết các chỗ (`themTepGiaiDoan`,
bình luận, `ODinhKemNhieuTep`) — cố ý, vì gỡ nhầm thì còn đường tìm lại. Chỉ
`de-nghi-nhan-moi.tsx` gọi `xoaTep` khi bỏ tài liệu lúc đang lập phiếu. Hệ quả: mảnh base64
đã đẩy lên Firestore nằm lại và ăn dần hạn mức — **chưa đo thực tế mức độ ảnh hưởng**.

## Khi nối Firebase thật

Chỉ cần thay phần trong `kho-du-lieu.tsx`: các hàm `phanBoDong`, `themDonHang`, `themPhieuNhan`, `xacNhanKho`, `xacNhanTruongBP` đổi từ ghi vào bộ nhớ sang ghi vào Firestore. **Giao diện không phải sửa một dòng nào.**

Tệp đính kèm cũng vậy: thay ruột 4 hàm của `kho-tep.ts` bằng Firebase Storage, giữ nguyên `MoTaTep`. Lúc đó tệp mới xem được từ máy khác.

🔴 **Đồng thời phải BỎ HẲN bộ giả lập:** hàm `themDeNghiGiaLap` · hằng `ID_DE_NGHI_GIA_LAP` ·
màn `1-giao-dien/trang/de-nghi-nhan-moi.tsx` · thư mục `app/(app)/de-nghi/nhan-moi/` ·
nút "Nhận đề nghị mới (giả lập)" trên màn `/de-nghi` · phần id dự phòng trong 2 file
`generateStaticParams` (`de-nghi/[id]`, `theo-doi/[id]`).
