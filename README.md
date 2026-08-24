# thumua-v1 — Khung chạy thử App Thu mua

Module Thu mua (mã app `tm`) trong hệ sinh thái HPcore. **Bản chạy thử của cả phòng**: giao diện đầy đủ, **đã nối Firestore** (kho dùng chung `chay-thu/du-lieu-chung`), **đăng nhập thật qua SSO App Tổng** (`account.hpcore.vn`) từ 20/08/2026.

| | |
|---|---|
| Đặc tả | [`../2. THIET KE/01-DAC-TA-APP-THU-MUA-v0.2.md`](../2.%20THIET%20KE/01-DAC-TA-APP-THU-MUA-v0.2.md) |
| Kế hoạch tái sử dụng | [`../2. THIET KE/02-KE-HOACH-TAI-SU-DUNG.md`](../2.%20THIET%20KE/02-KE-HOACH-TAI-SU-DUNG.md) |
| Quy chuẩn giao diện | HPCons Design System **V1.1** |
| Ngăn xếp | Next.js 15 · TypeScript strict · Tailwind v4 · shadcn/ui (`base-nova` trên `@base-ui/react`) · TanStack Table · Firebase (chưa bật) |

## 🌐 Bản đã đưa lên mạng

> **https://thumua.hpcore.vn** — địa chỉ chính thức, ✅ **đã trỏ và đang chạy** (xác nhận 19/08/2026: `nslookup` trả `76.76.21.21`, HTTP 200 không chuyển hướng). Đây là địa chỉ đưa cho người dùng.
> Alias cũ **https://hpcons-thumua-github.vercel.app** vẫn sống. Vercel, team `hpcons-ita-sset`, project `hpcons-thumua-github`.

🔴 **Từ 11/08/2026 chỉ còn MỘT nơi chạy.** Trước đó có tới **ba** bản song song, mỗi bản cũ một kiểu, không ai biết đâu là bản thật:

| Bản | Số phận |
|---|---|
| `thumua.hpcore.vn` | ✅ **Địa chỉ chính thức** |
| `hpcons-thumua-github.vercel.app` | ✅ Alias, vẫn sống |
| `thumua-v1.vercel.app` | ❌ Đã xóa project 11/08/2026, giờ trả 404 |
| ~~Firebase Hosting~~ | ❌ Đã bỏ khỏi dự án 11/08/2026. `firebase.json` không còn khối `hosting`, `npm run deploy` không gọi firebase |

🔴 **Bản ghi DNS phải giữ chế độ "DNS only" (mây XÁM) trên Cloudflare, KHÔNG bật Proxy (mây cam).** Proxy chồng lên Vercel gây lỗi chứng chỉ và chuyển hướng vòng. **Nếu địa chỉ hỏng, kiểm chỗ này trước tiên.**

⚠️ **Trang này công khai trên internet, nhưng dữ liệu thì KHÔNG.** Từ 12/08/2026 không đăng nhập là **không đọc được một dòng dữ liệu nào** (đã kiểm: gọi thẳng Firestore nhận HTTP 403). Đăng nhập là **thật**, qua SSO App Tổng — mỗi người một tài khoản riêng.

🔴 **Cả phòng dùng CHUNG MỘT tài liệu Firestore** `chay-thu/du-lieu-chung`. Hai người sửa cùng lúc thì người ghi sau đè người trước — chấp nhận được khi chạy thử, nhưng **`npm run dev` phải NGẮT khỏi kho chung** (đã có `.env.development.local` để trống 6 biến Firebase). Không có tệp đó thì mọi thao tác thử nghiệm trên máy lập trình hiện thẳng lên màn hình cả phòng.

## Chạy

```bash
npm install
npm run dev
```

Mở http://localhost:3000 → tự chuyển tới `/tong-quan`.

## 🔴🔴 ĐỌC TRƯỚC KHI PHÁT HÀNH — CÓ HAI PHIÊN LÀM SONG SONG

**Dự án này có HAI dòng công việc chạy cùng lúc, cùng phát hành lên MỘT project Vercel:**

| Phiên | Làm gì |
|---|---|
| **Tích hợp App Tổng** | SSO `account.hpcore.vn` · phân quyền · nhận đề nghị từ App Request · gửi PO sang QLK CTR · nhận phiếu nhận hàng từ QLK CTR |
| **Nghiệp vụ thu mua** | Quy trình 7 bước · báo giá · đơn hàng · kho · công nợ · giao diện |

### `vercel --prod` KHÔNG phải "cập nhật", nó là "THAY THẾ"

Lệnh đó lấy mã nguồn **ở máy đang chạy lệnh** rồi **thay toàn bộ production**. Không trộn, không cảnh báo, không hỏi. Nên nếu máy bạn không có tính năng mà người kia vừa đưa lên, **bạn xoá tính năng đó khỏi production** — và bạn không hề biết.

⚠️ **KHÔNG CÓ DẤU HIỆU NÀO CẢNH BÁO.** Deploy báo `● Ready`, alias trỏ đúng, `npm run verify` PASS. Chỉ là route của phiên kia **im lặng biến mất**.

📌 **Sự cố thật 23/08/2026:** route `/api/qlk-ctr/phieu-nhan-moi` của phiên tích hợp bị xoá khỏi production **12 lần trong một buổi** trước khi có người phát hiện. Hôm đó có 28 bản phát hành trong một ngày.

### ✅ TỪ 24/08/2026 CÁCH PHÁT HÀNH ĐÃ ĐỔI — ĐẨY LÊN GITHUB, KHÔNG DEPLOY TAY

Project Vercel **đã được nối với GitHub**, Production Branch = `main`. Muốn lên bản mới:

```bash
git push origin main
```

Vercel tự dựng và tự đưa lên `https://thumua.hpcore.vn`. **Không chạy `vercel --prod` nữa.**

### 🔴 Nếu bạn chạy `vercel --prod` và nó trả `UNKNOWN` — ĐÓ LÀ CHỐT ĐANG LÀM ĐÚNG VIỆC

**Không phải lỗi mạng. Không phải CLI hỏng.** Vercel cố ý chặn mọi deploy từ dòng lệnh khi project đã nối Git — nhưng **thông báo không nói lý do**, chỉ đứng ở `UNKNOWN` mãi.

⛔ **TUYỆT ĐỐI KHÔNG chạy `npx vercel git disconnect`.** Đó là **lệnh phá chốt**: một lệnh, không sinh commit nào, không ai được thông báo — và từ giây đó hai phiên lại đè code của nhau đúng như sự cố 23/08. Nếu bạn thấy tài liệu cũ nào hướng dẫn gỡ, tài liệu đó **đã lỗi thời**.

Gặp `UNKNOWN` thì: **đẩy code lên `main`**.

📌 **Vì sao `git push` an toàn mà `vercel --prod` thì không:** `git push` **bắt buộc fast-forward** — nếu người kia vừa đẩy gì mà bạn chưa có, Git **từ chối** và bắt bạn lấy về trước. Còn `vercel --prod` thì thay sạch, không hỏi ai. Push trở thành hàng đợi tự nhiên.

✅ **Đã đo thật 24/08/2026:** nối Git → chạy `vercel --prod` → bản deploy đứng `UNKNOWN` vĩnh viễn, **production không bị thay**, 6 cửa API còn nguyên.

### Chữa cháy gấp mà không phá chốt

Dùng **Instant Rollback** hoặc **Promote** ngay trên bảng điều khiển Vercel — chạy hoàn toàn trên web, không cần GitHub, **không phá chốt**.

### Trước khi push: chạy ba chốt kiểm

```bash
npm run kiem-truoc-deploy && npm run kiem-luat && npm run verify
```

Ba chốt này (`npm run deploy` cũ vẫn gọi chúng, nhưng bước `vercel --prod` giờ sẽ bị chặn):

| Chốt | Việc | Chặn thế nào |
|---|---|---|
| `kiem-truoc-deploy.mjs` | `git fetch` GitHub, soát **toàn bộ cây**: có tệp nào trên GitHub mà máy này thiếu | **Thoát mã 1** → `&&` dừng, `vercel` không được gọi. In sẵn lệnh lấy tệp về |
| `kiem-luat-dung-chung.mjs` | **Gọi thật** các hàm luật rồi đòi kết quả đúng | Thoát mã 1, và **nói rõ luật đó của phiên nào, ngày nào** |
| `kiem-route-san-xuat.mjs` | Gọi thật 6 cửa API trên bản vừa phát hành | Thoát mã 1 nếu có cửa nào 404 |

Chạy riêng: `npm run kiem-truoc-deploy` · `npm run kiem-luat` · `npm run kiem-route`

🔴 **`grep` dấu mốc KHÔNG bắt được việc xoá code — đừng tin nó.** Đo được ngày 24/08/2026: chuỗi `anhQlkCtr` có **hai lần** trong `2-quy-trinh/tinh-toan.ts`, một lần là **chú thích**. Xoá điều kiện thật mà để lại chú thích thì `grep -c` vẫn trả về đúng số, chốt vẫn xanh, luật đã chết. Đó là lý do có `kiem-luat-dung-chung.mjs`: **chú thích không chạy được nên không lừa được phép gọi hàm.**

### Nếu chốt chặn bạn

**Đừng vô hiệu hoá nó.** Trộn code của phiên kia vào rồi phát hành lại:

```bash
git fetch origin main
git log --oneline HEAD..FETCH_HEAD      # xem họ vừa đẩy gì
```

- Tệp **chỉ họ có** → lấy nguyên về: `git show FETCH_HEAD:"<đường/dẫn>" > "<đường/dẫn>"`
- Tệp **cả hai cùng sửa** → đọc `git show FETCH_HEAD -- <tệp>` rồi **áp tay từng đoạn**. Đừng `git checkout` cả tệp: làm vậy là xoá phần của mình, tức đổi một lỗi thành lỗi ngược lại.

🔴 **TUYỆT ĐỐI KHÔNG dùng `git merge` giữa repo gốc và nhánh GitHub.** Repo GitHub sinh bằng `git subtree split`, mỗi lần split Git băm lại SHA cả chuỗi commit, nên `merge-base` rơi về mốc rất cũ. Đo thật 24/08/2026: `git merge` sinh **7 conflict**, trong khi số tệp hai bên **thật sự** cùng sửa chỉ là **1**. Giải tay 6 conflict giả trong tệp 2.000 dòng là chỗ dễ xoá code của nhau nhất.

Cách đúng: **đối chiếu nội dung, không đối chiếu lịch sử** — lấy nền của họ (`git reset --hard FETCH_HEAD`), so toàn bộ cây, lọc dòng theo tác giả (`git log --author=`), rồi chốt cuối bằng `git merge-base --is-ancestor FETCH_HEAD HEAD` để bảo đảm push chỉ **thêm** commit.

### Chi tiết kỹ thuật

Build chạy trên máy chủ Vercel nên không đụng `.next/` ở máy này.

🔴 **KHÔNG BAO GIỜ dùng `--prebuilt`** (build tại máy). Bản lên mạng sẽ **sai chế độ đăng nhập**: `vercel build` tại máy đọc `.env.local` của máy đó, thiếu `NEXT_PUBLIC_XAC_THUC` là app **lặng lẽ** rơi về chế độ tài khoản mẫu và **cả phòng không đăng nhập được** — trong khi deploy vẫn báo `● Ready`. Đã dính thật 15/08/2026.

📌 Cố ý dùng `npx` chứ không gọi thẳng `vercel`: máy này có bản cài global nên gọi thẳng vẫn chạy, **nhưng máy khác thì không** — `vercel` không nằm trong `devDependencies`. `npx` tự lo cả hai trường hợp.

Lần đầu chạy trên một máy mới phải đăng nhập: `npx vercel login`, rồi `npx vercel link` chọn team `hpcons-ita-sset` / project `hpcons-thumua-github`.

🔴 **LUÔN chạy lệnh phát hành TRONG `thumua-v1/`, tuyệt đối không ở thư mục gốc.** Chạy ở gốc là gom cả `1. INPUT/` (hoá đơn VAT thật, báo giá giá thật, văn bản nội bộ) đưa lên internet. Đã suýt xảy ra hai lần, cả hai lần chỉ thoát nhờ Vercel từ chối ở bước đặt tên.

🔴 **Vercel gửi lên theo `.gitignore`.** Chạy từ trong `thumua-v1/` nên `1. INPUT/` không bao giờ lọt lên, còn `.env.local` bị chặn sẵn. **Sửa `.gitignore` là đổi luôn thứ được đưa lên Vercel** — nhớ cả hai việc.

⚠️ Deploy xong **phải mở bản thật kiểm lại**. Đã có lần lệnh báo thành công mà bản cũ vẫn nằm im 27 phút. Nhìn dòng `Aliased` trong kết quả, rồi mở link kiểm một tính năng vừa làm.

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
5. Bỏ đăng nhập chạy thử, thay bằng Firebase Authentication của HPcore

📌 `output: "export"` đang **bật sẵn** và nên giữ: app không có việc gì cần máy chủ, giữ bản tĩnh thì dời đi đâu cũng chỉ là bê thư mục `out` sang. Đổi ý thì đọc chú thích trong `next.config.ts` trước — bỏ nó là mất đường chạy trên mọi hosting tĩnh.
