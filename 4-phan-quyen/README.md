# 4 — PHÂN QUYỀN

**Ai được làm gì, ai được xem gì.** Đặc biệt: ai được xem giá.

## Các file

| File | Việc |
|---|---|
| **`quyen.ts`** | Định nghĩa cấp quyền, tính ra danh sách việc được làm, và các vai trò mẫu để chạy thử |
| **`nguoi-dung-hien-tai.tsx`** | Giữ vai trò đang dùng; ở bản chạy thử thì đổi được trên Header |
| **`luat-phan-quyen.ts`** | **Ai được đổi quyền của ai, tới cấp nào** — luật của màn "Phân quyền người dùng". Có cả `vuongMacTraoQuyen` (ai được tick quyền riêng cho ai) |
| **`quyen-rieng.ts`** | ★ 26/09/2026 — **Quyền tick riêng từng người** (lớp đè lên chức danh): danh sách ô tick được, `apDungQuyenRieng`, ghép phần thay đổi. Hàm thuần, chỉ `import type` từ `quyen.ts` |
| `quyen-rieng-ket-noi.ts` | ★ 26/09/2026 — Gọi `/api/quyen-rieng` từ trình duyệt (đọc của mình · đọc tất cả · danh sách người bị khoá · lưu nhiều người) |
| `dung-nguoi-khong-vao-app.ts` | ★ 26/09/2026 — Hook `useNguoiKhongVaoApp`: ai đang bị bỏ "Vào app" để danh sách Giao việc lọc ra (bộ nhớ 60 giây, lỗi thì không lọc + báo) |
| `dung-danh-ba.ts` · `quyen-theo-ho-so.ts` | Tra danh bạ nhân sự và suy quyền từ hồ sơ máy chủ |

### ★ Phân quyền tick chọn (Sếp 26/09/2026)

Sếp: *"khi chọn nhân viên A thì sẽ hiện 1 list quyền bên cạnh, a giao cho quyền gì thì chỉ cần tick zô là được"* · *"được chọn nhiều người cùng lúc"* · trưởng bộ phận là người tick.

- **Hai lớp:** chức danh (gán qua `/api/phan-quyen`, vẫn quyết định danh sách Giao việc) → `tinhQuyenTheoChucDanh`; quyền tick riêng (`tm_quyen_rieng/{mã Firebase}`, ghi qua `/api/quyen-rieng`) đè lên.
- 🔴 **Chưa tick riêng = giữ nguyên quyền theo chức danh** (mặc định an toàn, không ai mất quyền khi deploy). ★ **Sếp chốt 26/09/2026: *"Tạm giữ theo chức danh"*** — chưa chuyển "mặc định trắng". Muốn chuyển thì phải đóng băng quyền hiện tại của mọi người vào `tm_quyen_rieng` TRƯỚC — xem chú thích `canGhiQuyenRieng`.
- `tinhQuyen(u)` = `apDungQuyenRieng(tinhQuyenTheoChucDanh(u), u.quyenRieng, …)`. Gắn vào `NguoiDung.quyenRieng` để tầng ghi `3-du-lieu/kho-du-lieu.tsx` (tự gọi `tinhQuyen(nguoiDung)`) cùng nhận quyền tick.
- Quản trị không tự khoá được · tài khoản "Ngừng truy cập" không mở lại được bằng tick · bỏ "Vào app" là mất hết.
- Chống leo quyền: chỉ trao được cờ mình đang có; "Xoá toàn bộ dữ liệu" chỉ Quản trị trao. Bài kiểm hai chiều ở `kiem-luat-dung-chung.mjs` (khối "PHÂN QUYỀN TICK CHỌN").

#### Sửa theo soát chéo 26/09/2026

- 🔴 **Không đọc được quyền riêng lúc tải trang = KHÔNG cho vào app** (thử lại 1 lần). Chỉ khi máy chủ trả lời được `quyenRieng: null` mới là "chưa tick → theo chức danh". Đúng luật "thiếu thông tin thì quyền THẤP NHẤT" (CLAUDE.md §3.6c). Hệ quả: cửa `/api/quyen-rieng` chết là mọi người trừ Quản trị/owner không vào được.
- 🔴 **"Phân quyền người dùng" KHÔNG tick được** — luôn theo chức danh (`laQuanTri || capTM >= 3`). Lý do: `app/api/phan-quyen` (phiên tích hợp) gác gán chức danh theo CẤP, không đọc quyền tick; bỏ tick chỉ ẩn màn hình. Cùng lý do, **"Vào app" của người cấp ≥ 3 không bỏ được**. Muốn thu hồi thì hạ chức danh.
- 🔴 **Dấu chức danh** (`theoChucDanh`, route ghi từ hồ sơ máy chủ): khi chức danh đã đổi so với lúc lưu, bản quyền riêng cũ chỉ mang sang **những cờ đã bị bỏ thật**: `ra[k] = goc[k] && !(gocCu[k] && rieng[k] !== true)` (`quyenRiengHieuLuc`, dùng qua `quyenRiengConHieuLuc` ở `quyen.ts`). Hạ chức danh là hạ thật; nâng chức danh được đủ cờ mới của chức danh mới; cờ từng tick thêm vượt chức danh cũ không mang sang; không lách được "chỉ trao cờ mình có" bằng đổi chức danh vòng. Bản ghi **thiếu dấu** (hoặc dấu sai khuôn, kể cả `capKho` sai) → nhánh an toàn `goc[k] && rieng[k]`.
- Nâng người lên "Quản trị hệ thống" / hạ về "Ngừng truy cập" chỉ đổi chức danh, không ghi quyền riêng. Chưa đọc được quyền riêng vẫn đổi được chức danh (phần tick khoá kèm lý do; hộp xác nhận ẩn danh sách Bật/Tắt vì không tính được).

#### Sửa theo soát chéo lần 2 26/09/2026

- 🔴 **Người chức danh cấp ≥ 3 luôn còn "Vào app"** (`apDungQuyenRieng` ⑤) — kể cả khi bản riêng cũ đã tắt từ lúc họ còn cấp 2. Không có chốt này thì dây chuyền tắt luôn "Phân quyền" trên giao diện trong khi `/api/phan-quyen` vẫn cho họ gán chức danh theo cấp. Chốt chặn BỎ mới (`vuongMacTraoQuyen` ④b) so trên BẢN GHI (`boVaoApp`), không trên hiệu lực.
- 🔴 **"Xuất hồ sơ" (`xuatHoSo`) KHÔNG tick được** — không nút xuất/in nào đọc cờ này. Bài kiểm-luật tự quét mã nguồn: **mọi ô tick phải có ít nhất một chỗ đọc thật** (bỏ chú thích; tính cả `duocVaoDuongDan` và `quyen-theo-ho-so.ts` vì chúng được gọi thật). Thêm ô tick mới mà chưa nối chỗ đọc là bài kiểm đỏ.
- Route: bản ghi `tm_quyen_rieng` tồn tại mà **sai khuôn → ném lỗi** (GET 500 → trình duyệt chặn), không coi là "chưa có". Kiểm quyền phân quyền của người gọi **trước** khi đọc hồ sơ người nhận. Trần **50 người/lượt**. Mã người nhận phải khớp `/^[A-Za-z0-9_-]{1,128}$/`. Đọc + kiểm + ghi trong **một `runTransaction`** — hai người lưu cùng lúc không đè nhau.
- Trình duyệt: lấy vé đăng nhập trong `try`, hẹn giờ bằng `AbortController` (trình duyệt cũ); lượt đăng nhập bọc `try/catch` — lỗi bất ngờ thành màn chặn kèm lý do thật, không trắng trang mãi.

#### ★ Sếp chốt 26/09/2026 — ĐỪNG "sửa cho đúng" ngược lại

- **Miễn trừ "cờ chức danh đã cho sẵn"** (`vuongMacTraoQuyen` ⑤): GIỮ kể cả khi Quản trị đã chủ động bỏ cờ đó — trưởng bộ phận được bật lại. Nguyên văn: *"Có được bật lại quyền"*. Có bài kiểm-luật.
- **Trưởng bộ phận KHÔNG sửa được tài khoản Ban Giám đốc trên màn Phân quyền** (cả ô tick lẫn chức danh) — chặt hơn bản trước 26/09. Nguyên văn: *"Giữ quyền này"*. ⚠️ Máy chủ `/api/phan-quyen` (phiên tích hợp) **chưa siết tương ứng**: gọi thẳng cửa đó thì trưởng bộ phận vẫn đổi được chức danh BGĐ (cấp 1 ≤ 2).
- **Người chưa có bản ghi quyền riêng: tạm giữ theo chức danh.** Nguyên văn: *"Tạm giữ theo chức danh"*. Có bài kiểm-luật.

#### ★ Đã nối vào ô tick — Sếp 26/09/2026 *"Nối vào ô tíck"* (trước là giới hạn G)

- **Ba quyền theo từng hồ sơ** ở `quyen-theo-ho-so.ts` — xác nhận nhận đủ hàng (`duocXacNhanNhanDuHangCuaHoSo`), ghi nhận giao hàng nhánh phòng ban (`duocGhiNhanGiaoHangCuaHoSo`), ghi dấu đối chiếu (`duocGhiDoiChieuThuMua`) — nay đòi thêm ô tick **"Lập đơn mua hàng" (`lapPO`)** qua `tickChoLamThuMua`. Chọn `lapPO` vì nhánh đó hỏi *"người này có đang LÀM thu mua không"*; KHÔNG chọn `xacNhanKho` (Sếp 17/09 đã gỡ cờ kho khỏi luật xác nhận) hay `ghiPhieuNhanHang` (cờ thủ kho — dùng nó là cả phòng thu mua mất quyền). **Người chưa có quyền riêng: không xét, kết quả y hệt trước** (bài kiểm so với luật cũ trên mọi chức danh chuẩn). Chữ ký hàm KHÔNG đổi — điều kiện tính từ `nguoiDung.quyenRieng` mà `useNguoiDung()` đã gắn sẵn (một nơi gọi nằm ở `de-nghi-chi-tiet.tsx`), nên không sửa nơi gọi nào, kể cả `kho-du-lieu.tsx`.
- **Danh sách "Giao việc cho ai"** (`bang-phan-bo.tsx` → `nhanVienThuMua`): người đang bị bỏ "Vào app" bị lọc ra, qua hook `dung-nguoi-khong-vao-app.ts` ← `/api/quyen-rieng?biKhoa=1` (máy chủ tính bằng `nguoiBiKhoaVaoApp`, chỉ trả danh sách mã; người có `phanBoCongViec` hoặc quyền phân quyền đọc được). Bộ nhớ 60 giây, màn Phân quyền bỏ bộ nhớ ngay sau khi lưu. ⚠️ **Lỗi đọc → không lọc ai (fail-open) + báo một lần** — cố ý: lọc sót chỉ làm một việc bị giao cho người không mở app được (thấy ngay, giao lại được); chặn cả danh sách thì cả phòng không giao được việc. **Loại việc nhận được vẫn theo chức danh** — tick thêm không biến QLDA thành người nhận việc.

#### ⚠️ Giới hạn còn lại — chờ Sếp quyết

- **Người phụ trách tự sửa đơn của mình** (`kho-du-lieu.tsx` → `suaDonHang`, so `nguoiPhuTrachUid`) chưa theo ô tick — vùng đó đang có phiên khác sửa nên chưa đụng.
- **(H) Script di trú sang project riêng của phiên tích hợp chưa chép `tm_quyen_rieng`.** Ngày chuyển project mà không chép collection này thì mọi quyền riêng đã lưu mất — mọi người về "theo chức danh". Phải báo phiên tích hợp thêm collection này vào danh sách chép.

### Màn "Phân quyền người dùng" (thêm 18/08/2026)

Ban lãnh đạo yêu cầu *"thêm tính năng phân quyền cho tài khoản quản trị và tài khoản trưởng bộ phận"*.

- Màn hình: `1-giao-dien/trang/phan-quyen.tsx` · địa chỉ `/phan-quyen`
- Luật ai-sửa-được-ai: **`luat-phan-quyen.ts`** (một chỗ duy nhất — màn hình và tầng ghi đều hỏi nó)
- Mặc định: Quản trị (4) đặt được tới cấp **4**; Trưởng bộ phận (3) đặt được tới cấp **2**. Không ai tự sửa hồ sơ của chính mình.

🔴 **Chưa lưu được lên máy chủ.** Firestore đang khóa ghi `nguoi-dung/{uid}` (`allow write: if false`) vì hồ sơ chứa `capTM` của chính người đó. Bộ rules mở khóa đã soạn ở `5-ket-noi/firestore-phan-quyen-DE-XUAT.rules` nhưng **chưa được duyệt và chưa deploy**. Cách đổi quyền dùng được ngay vẫn là chạy `tao-tai-khoan.js` bằng khóa Admin SDK.

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
