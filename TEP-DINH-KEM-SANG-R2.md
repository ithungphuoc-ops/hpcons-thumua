# Chuyển tệp đính kèm sang Cloudflare R2

> Sếp chốt **21/09/2026**, ngay sau khi tách project Firebase. Đây là **giai đoạn B** —
> phần thật sự cắt được hoá đơn.

## Vì sao làm

Tách project (giai đoạn A) chia hoá đơn làm hai tờ nhưng **không giảm đồng nào**. Thứ tốn
tiền là cách lưu tệp.

| | Trước | Sau |
|---|---|---|
| Nơi lưu ruột tệp | Firestore, cắt mảnh 600 KB | R2, nguyên tệp |
| 457 tệp thành | **1.207 tài liệu** (457 mô tả + 750 mảnh) | 457 đối tượng |
| Dung lượng | **274,3 MB** (base64 phình ~33%) | **205,6 MB** (nhị phân thật) |
| Cách tính tiền | theo **lượt đọc tài liệu** | theo **dung lượng lưu** |

Mỗi lần ai đó mở một tệp là Firestore đếm nhiều lượt đọc — đây là gốc của ~160.000 lượt
đọc/ngày đo được ngày 21/09. R2 tính theo dung lượng, lượt đọc gần như miễn phí.

Con số kiểm chứng lẫn nhau: 205,6 MB × 1,33 ≈ 273,5 MB, khớp với 274,3 MB đo trong
Firestore. Chênh lệch đúng bằng phần phình ra của base64 — **chuyển sang R2 tiết kiệm luôn
68 MB** ngoài chuyện giảm lượt đọc.

## Đã dựng những gì

| Tệp | Việc |
|---|---|
| `5-ket-noi/kho-r2.ts` | Lớp nối R2 — ký link, đẩy, tải, xoá, kiểm tệp có thật |
| `app/api/tep/ky-link/route.ts` | Cấp link ký sẵn (tải lên · đọc · xác nhận) |
| `app/api/tep/xoa/route.ts` | Cửa xoá riêng — **không** ký link xoá |
| `3-du-lieu/kho-tep-r2.ts` | Phía trình duyệt, giữ y nguyên ba hàm cũ |
| `3-du-lieu/kho-tep-may-chu.ts` | Bộ chọn Firestore ↔ R2 theo công tắc |
| `di-tru-tep-sang-r2.mjs` | Công cụ chuyển, mặc định chạy thử |

**Giao diện không phải sửa một dòng** — đúng như người viết `kho-tep-firestore.ts` đã dặn
trước từ 12/08/2026: *"Khi công ty bật Storage thì chỉ thay ruột file này."*

## Ba quyết định đáng ghi lại

**① Trình duyệt PUT thẳng lên R2, không đi qua máy chủ app.** Vercel chặn 4,5 MB mỗi lần gọi
Route Handler, mà bản scan hợp đồng thường vượt xa. App Đề xuất đã vấp đúng trần này ngày
13/09/2026.

**② Sau khi PUT xong phải hỏi lại máy chủ "tệp có thật trong kho chưa".** Không có bước này
thì mọi thứ dựa vào lời khai của trình duyệt — mạng đứt giữa chừng là app ghi nhận "đã lưu"
cho một tệp rỗng. Đúng kiểu lỗi đã đốt cả tuần 13–17/09/2026 ở đường Đề xuất → Kho.

**③ Xoá đi qua cửa riêng, không ký link xoá.** Link ký sẵn là chìa khoá tạm không cần đăng
nhập. Với việc *đọc* thì thiệt hại giới hạn ở một tệp và link hết hạn sau 5 phút. Với việc
*xoá* thì mất hẳn chứng từ.

## Các bước thi hành

### Bước 1 — Chuẩn bị trên Cloudflare _(Sếp đã làm 21/09)_

- [x] Bucket `hpcons-thumua`
- [x] API token **Object Read & Write**, **chỉ đúng bucket đó** _(không phải "all buckets" —
      một chìa lộ thì chỉ mất một kho)_
- [ ] **Bật CORS cho bucket** — xem bước 3

### Bước 2 — Đẩy tệp lên R2 _(không cần ngừng dịch vụ)_

```bash
node di-tru-tep-sang-r2.mjs             # chạy thử
node di-tru-tep-sang-r2.mjs --ghi-that  # đẩy thật
node di-tru-tep-sang-r2.mjs --doi-chieu # so từng tệp theo cỡ byte
```

App vẫn đang đọc Firestore (công tắc chưa bật) nên đẩy lên R2 không ảnh hưởng ai. Chạy lại
lần hai chỉ đẩy phần còn thiếu.

> Đối chiếu so **cỡ byte từng tệp**, không chỉ đếm số lượng. Bài học ngay trong ngày: bản
> đối chiếu đầu của công cụ tách project chỉ đếm tài liệu cấp gốc, báo "khớp hoàn toàn"
> trong khi thiếu mảnh — phải kiểm tay mới thấy.

### Bước 3 — Bật CORS cho bucket _(bắt buộc, Sếp làm tay)_

Khoá R2 của app **không có quyền đặt CORS**. Trên Cloudflare → R2 → bucket `hpcons-thumua`
→ Settings → CORS Policy:

```json
[
  {
    "AllowedOrigins": ["https://thumua.hpcore.vn"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["etag"],
    "MaxAgeSeconds": 3600
  }
]
```

Thiếu bước này thì trình duyệt chặn ngay trước khi gọi — người dùng thấy "không tải lên
được" mà log máy chủ sạch trơn, rất khó chẩn đoán.

### Bước 4 — Bật công tắc

Trên Vercel, thêm 5 biến:

```
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME=hpcons-thumua
NEXT_PUBLIC_KHO_TEP=r2
```

Rồi deploy lại.

### Bước 5 — Kiểm sau khi bật

- [ ] Mở một tệp đính kèm **cũ** (đã di trú) — phải xem được
- [ ] Tải lên một tệp **mới** — phải lưu được
- [ ] Tải lên tệp **lớn hơn 5 MB** — đây là chỗ cách cũ hay chết
- [ ] Xoá một tệp — phải mất ở cả hai kho
- [ ] Mở bằng **máy khác** — để chắc tệp thật sự nằm trên máy chủ

## Đường lùi

Gỡ biến `NEXT_PUBLIC_KHO_TEP` → app quay lại đọc Firestore ngay, không phải sửa code. Dữ
liệu cũ trong Firestore **không bị công cụ di trú xoá**, giữ nguyên ít nhất một tuần.

> ⚠️ **Nhưng đường lùi chỉ sạch khi chưa ai tải tệp mới.** Tệp tải lên trong lúc chạy R2 nằm
> ở R2 và **không tự theo về** Firestore — lùi sau đó là những tệp mới đó không mở được nữa.
> Muốn lùi lúc ấy phải chuyển ngược chúng về trước.

Có một lớp đỡ sẵn: khi chạy R2 mà không thấy tệp, app **tự thử lại Firestore**. Tệp cũ di trú
sót vẫn mở được thay vì hiện ô trống.

## Còn treo

- **Dọn tệp cũ trong Firestore** — chỉ làm sau khi R2 chạy ổn ít nhất một tuần. Đó mới là lúc
  274 MB kia thật sự rời khỏi hoá đơn Firestore.
- **1 mảnh mồ côi** `tep/tep-1789293178207-291321/manh/0` (586 KB, cha đã bị xoá từ 13/09) —
  rác, không thuộc tệp nào. Dọn cùng lúc.
