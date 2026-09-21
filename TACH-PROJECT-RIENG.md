# Tách app Thu mua sang project Firebase riêng

> Sếp chốt **21/09/2026**. Tài liệu này là bản hướng dẫn thi hành — làm theo đúng thứ tự.

## Vì sao tách

App Thu mua đang **ở nhờ** project `hpcons-portal` cùng App Tổng và Booking. Ba app chia
chung một hạn mức, một hoá đơn, một sự cố.

**Điều đã đo được (21/09/2026), không phải phỏng đoán:**

| Chỉ số | Giá trị |
|---|---|
| Gói cước `hpcons-portal` | **Blaze** (trả theo dùng) |
| Tín dụng còn lại | **$292,53**, hết hạn **06/10/2026** |
| Lượt đọc Firestore | ~160.000/ngày (đỉnh 307.645) |
| Lượt ghi | ~400–9.000/ngày (đỉnh 82.627 ngày 16/09 — dấu vết vòng lặp gửi PO, nay đã bịt) |
| Tệp đính kèm trong Firestore | **457 tệp + 750 mảnh ≈ 274,3 MB** |

> ⚠️ **Tách KHÔNG làm giảm chi phí.** Nó chia hoá đơn làm hai tờ, tổng tiền không đổi.
> Thứ thật sự tốn tiền là 274 MB tệp đính kèm nằm trong Firestore — mỗi lần mở một tệp là
> đọc hàng loạt mảnh. Việc giảm chi phí là **giai đoạn B** (chuyển tệp sang Cloudflare R2),
> làm sau khi tách xong.

## Cái gì đi, cái gì ở lại

| Khối dữ liệu | Số lượng | Đi đâu |
|---|---|---|
| `chay-thu/du-lieu-chung` | 1 tài liệu (~308 KB) | → project mới |
| `tep` (+ `manh`) | 457 + 750 | → project mới |
| `tm_denghi` | 19 | → project mới |
| `tm_donhang` (+ `nhanhang`) | 7 | → project mới |
| `tm_baogia` | 9 | → project mới |
| `tm_thongbao` | 30 | → project mới |
| `tm_donhang_gia` | 7 | → project mới |
| `tm_caidat` | 2 | → project mới |
| `nguoi-dung` | 14 | → project mới |
| `users` | 134 | **ở lại** — App Tổng sở hữu và ghi |
| `departments` | 20 | **ở lại** |
| `app_permissions` | 28 | **ở lại** |

## Ba điều đã kiểm chứng trước khi bắt tay

**① Không app nào gãy.** Mọi mối nối liên app đều qua HTTP, không qua Firestore:
- App Đề xuất → Thu mua: `POST /api/app-request/de-nghi-moi`
- Thu mua → Kho công trình: `POST /api/qlk-ctr/gui-po`
- App Kho không gọi ngược sang Thu mua

**② Luật truy cập không dùng custom claims.** Đã kiểm 138 tài khoản Auth: **0 tài khoản có
claims**. Luật đang chạy (`firestore-gop-tach.rules`) chỉ dựa vào `request.auth != null` và
tài liệu `nguoi-dung/{uid}` — mà `nguoi-dung` đi theo sang project mới. Nếu luật có dùng
claims thì tách project sẽ làm mọi người mất quyền ngay lập tức; đây là rủi ro đã loại trừ
bằng đo đạc, không phải bằng suy đoán.

**③ Toàn bộ 13 khối luật đều của Thu mua**, không lẫn App Tổng hay Booking — nên
`5-ket-noi/firestore-gop-tach.rules` dùng nguyên được cho project mới, không phải viết lại.

## Mã nguồn đã chuẩn bị sẵn — và có đường lùi

Một chìa khoá trước đây làm bốn việc; nay chẻ làm hai:

| Ở lại `hpcons-portal` | Sang project mới |
|---|---|
| `verifyHpcore` — xác minh cookie App Tổng | `mintCustomToken` — ký vé đăng nhập |
| `fetchVaiTroToanCuc` — đọc `users` | `verifyClientIdToken` — xác minh ID token |
| `users` + `departments` | dữ liệu nghiệp vụ + `nguoi-dung` |

> 🔴 **Vé đăng nhập chỉ dùng được ở đúng project đã ký nó.** Nên khi chuyển đổi phải đổi
> **đồng thời** `THUMUA_FIREBASE_SERVICE_ACCOUNT` và sáu biến `NEXT_PUBLIC_FIREBASE_*`.
> Đổi lệch một bên là `signInWithCustomToken` báo lỗi và **không ai đăng nhập được**.

**Đường lùi:** chưa khai `THUMUA_FIREBASE_SERVICE_ACCOUNT` thì mọi hàm rơi về đúng kết nối
`hpcons-portal` như trước. Nhờ vậy bản sửa này merge được mà không đổi một hành vi nào trên
production — ngày chuyển đổi chỉ cần thêm biến môi trường rồi deploy lại.

## Các bước thi hành

### Bước 1 — Dựng project mới _(cần quyền Firebase của Sếp)_

1. Firebase Console → **Add project** → đặt tên `hpcons-thumua`
2. **Gắn cùng tài khoản thanh toán** với `hpcons-portal` (nếu không, project mới ở gói Spark,
   trần 50.000 lượt đọc/ngày — sẽ chết trong vòng một ngày vì mức dùng thật là ~160.000)
3. Bật **Firestore** (chọn vùng `asia-southeast1`, cùng vùng với project cũ để giảm độ trễ)
4. Bật **Authentication** → phương thức đăng nhập không cần bật cái nào (chỉ dùng Custom Token)
5. Cài đặt project → **Tài khoản dịch vụ** → *Tạo khoá riêng tư mới* → tải tệp JSON về

### Bước 2 — Cấu hình _(em làm, sau khi có khoá)_

```bash
# Thêm vào .env.local
THUMUA_FIREBASE_SERVICE_ACCOUNT={...}   # nội dung tệp JSON vừa tải

# Publish luật truy cập sang project mới
npx firebase deploy --only firestore:rules --project hpcons-thumua
```

> ⚠️ Khoá JSON là **toàn quyền trên project**. Đừng dán vào chat, đừng commit. Tải tệp về rồi
> cho biết đường dẫn.

### Bước 3 — Chạy thử di trú _(không ghi gì)_

```bash
node di-tru-sang-project-rieng.mjs
```

In ra bảng đếm từng khối. Chưa ghi gì sang project mới.

### Bước 4 — Chọn cửa sổ ngừng dịch vụ

> ⚠️ **Bắt buộc.** Công cụ chép một lần, không theo dõi thay đổi. Ai nhập liệu trong lúc chép
> thì bản ghi đó nằm lại project cũ và **mất** sau khi chuyển đổi.

Đề nghị: ngoài giờ làm việc hoặc cuối tuần. Báo trước cho người đang dùng.

### Bước 5 — Di trú thật

```bash
node di-tru-sang-project-rieng.mjs --ghi-that
```

Tự sao lưu ra tệp JSON trước khi ghi, rồi đối chiếu số lượng hai bên sau khi ghi.

### Bước 6 — Chuyển đổi

Trên Vercel, đổi **đồng thời** 7 biến:

| Biến | Giá trị mới |
|---|---|
| `THUMUA_FIREBASE_SERVICE_ACCOUNT` | khoá JSON project mới |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `hpcons-thumua` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | của project mới |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | của project mới |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | của project mới |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | của project mới |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | của project mới |

Giữ nguyên `HPCORE_FIREBASE_SERVICE_ACCOUNT` — vẫn cần để đọc danh bạ và xác minh cookie.

Rồi deploy lại.

### Bước 7 — Kiểm ngay sau chuyển đổi

- [ ] Đăng nhập được (vé đăng nhập ký đúng project)
- [ ] Danh sách đề nghị / đơn hàng hiện đủ
- [ ] Mở được tệp đính kèm
- [ ] Màn "Phân quyền người dùng" bày đủ danh bạ **và** đúng cờ "đã có hồ sơ Thu mua"
      _(đây là chỗ đọc từ hai project khác nhau — dễ sai nhất)_
- [ ] Tạo thử một đề nghị từ App Đề xuất → sang được Thu mua
- [ ] Lập thử một PO → sang được app Kho
- [ ] `node di-tru-sang-project-rieng.mjs --doi-chieu` → hai bên khớp

### Bước 8 — Theo dõi

**Giữ nguyên dữ liệu ở project cũ ít nhất một tuần.** Hỏng thì gỡ
`THUMUA_FIREBASE_SERVICE_ACCOUNT` và trả sáu biến `NEXT_PUBLIC_FIREBASE_*` về giá trị cũ —
app chạy lại như chưa có gì.

---

## Việc còn treo, không thuộc phạm vi tách

- **Giai đoạn B** — chuyển 274 MB tệp đính kèm sang Cloudflare R2. Đây mới là thứ giảm được
  chi phí thật. Đã có khuôn mẫu sẵn ở app Quà tặng và app Đề xuất.
- **Hạn luật truy cập** — `conHanChayThu()` chặn mọi truy cập sau **01/11/2026**. Còn hơn một
  tháng, nhưng phải gia hạn trước ngày đó nếu không cả app dừng.
- **App Thu mua chưa có `instrumentation.ts`** — chưa báo sự cố về App Tổng. Các app khác đều
  có. Nghĩa là nếu Thu mua lỗi máy chủ thì không có bản ghi nào để tra lại.
