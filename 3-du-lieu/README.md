# 3 — DỮ LIỆU

**Mô hình dữ liệu** (chứng từ có những trường gì), **kho dữ liệu** (nơi giữ và ghi dữ liệu), **dữ liệu mẫu** để chạy thử.

## Các file

| File | Việc | Sửa khi |
|---|---|---|
| **`kieu-du-lieu.ts`** | Định nghĩa mọi chứng từ: Đề nghị, PO, Giá PO, Phiếu nhận hàng, Nhà cung cấp | Cần thêm/bớt trường của một chứng từ |
| **`kho-du-lieu.tsx`** | Giữ dữ liệu + các thao tác ghi (phân bổ, lập PO, ghi phiếu nhận, xác nhận) | Bấm nút mà dữ liệu không đổi |
| **`luu-tren-may.ts`** | Giữ dữ liệu nghiệp vụ qua mỗi lần tải lại trang (localStorage) | F5 mất dữ liệu |
| **`kho-tep.ts`** | **Nội dung tệp đính kèm** (IndexedDB) — phiếu giao nhận, bản báo giá gốc | Đính kèm không lưu, hoặc không mở xem lại được |
| **`ban-mau-don-mua-hang.ts`** | **Chỗ cất TẠM để chuyển bản mẫu PO sang tab in** (18/08/2026). ⚠️ **KHÔNG phải dữ liệu nghiệp vụ** — bản mẫu không có mã hồ sơ, không ai tra cứu lại, và bị **xóa ngay khi tab in đọc xong** (để lại thì lần sau mở trang in sẽ in lại bản cũ mà không ai biết). Ghi vào **cả** `sessionStorage` **và** `localStorage` vì mỗi chỗ hụt một kiểu — xem chú thích trong file. Bản mẫu quá **10 phút** thì coi như không có | Bấm "In mẫu PO" mà tab in báo *"Không tìm thấy bản mẫu"* |
| **`danh-ba-nhan-su.ts`** | **Danh bạ nhân sự công ty** — nguồn cho ô chọn "Thêm người theo dõi" và ô chọn **thủ kho** ở màn lập đơn (lọc `department === "kho"`) | Thiếu người, sai phòng ban, sai chức danh |
| **`dieu-khoan-chuan-don-mua-hang.ts`** | **Văn bản điều khoản chuẩn in ở cuối tờ PO** (khối "Phương thức giao hàng" + 2 câu cam kết của mẫu Thỏa thuận), kèm `tachDongDieuKhoan` để tờ in và ô nhập trình bày giống nhau. Từ 22/08/2026 **người lập sửa được** — bản đã sửa lưu trên từng đơn (`DonDatHang.dieuKhoanGiaoHang`), bản chuẩn ở đây chỉ dùng khi đơn chưa sửa gì | Điều khoản in ra sai chữ · muốn đổi bản chuẩn cho **đơn lập từ nay** (đơn cũ giữ bản của nó) |
| **`du-lieu-mau.ts`** | Dữ liệu chạy thử: **9 đề nghị** (phủ đủ 8 giai đoạn của bảng quy trình), 8 PO, 8 phiếu nhận, 6 bảng báo giá | Muốn đổi số liệu để trình bày |

### 🔴 `DonDatHang.prId` / `prCode` LÀ TÙY CHỌN (từ 18/08/2026)

Ban lãnh đạo 18/08/2026 cho lập đơn **không gắn phiếu đề nghị nào** (module *"Lập đơn mua hàng
(PO)"*). Bỏ trống cả hai = **đơn độc lập**; `DongPO.sttDongDeNghi` của mọi dòng hàng khi đó là
`undefined`.

⚠️ **CHIỀU CÙNG NGÀY BAN LÃNH ĐẠO ĐỔI Ý: chế độ đó KHÔNG CẤT ĐƠN NỮA** (*"chỉ cần tạo mẫu PO thôi,
chưa cần lưu"*) — nó chỉ in / xuất mẫu qua `2-quy-trinh/don-hang-mau.ts`.

🔴 **VÀ `themDonHang` ĐÃ SIẾT LẠI: thiếu `prId` là TỪ CHỐI CẤT.** Không cất thì không qua được chốt
kiểm soát chi tiêu `vuongMacLapDonHang` (đòi bảng báo giá đã chốt NCC), nên để hàm ghi dữ liệu vẫn
cho qua là để sẵn một lỗ hổng chờ người vô tình mở lại — bỏ nút trên giao diện **không phải** là chặn.

📌 **PHÂN BIỆT RÕ HAI VIỆC, đừng gộp:**
- **GHI mới** đơn thiếu `prId` → 🔴 **không còn đường nào**, `themDonHang` trả lỗi.
- **ĐỌC** đơn thiếu `prId` → ✅ **vẫn phải chạy đúng ở mọi màn hình.** Kiểu dữ liệu giữ tùy chọn, và
  phần mô tả dưới đây vẫn nguyên hiệu lực, vì các đơn cất trong buổi sáng 18/08/2026 còn nằm trong
  kho chung của cả phòng. 🔴 **Đừng "dọn cho gọn" bằng cách bắt buộc `prId` trong kiểu dữ liệu** —
  làm vậy là những đơn cũ đó thành dữ liệu hỏng.

⚠️ **Ba giá trị của `sttDongDeNghi` mang ba nghĩa khác nhau, đừng gộp:** số ≥ 1 là dòng trừ khối
lượng vào phiếu đề nghị · `0` là **dòng ghi chú** (quy ước có từ trước) · `undefined` là dòng của
đơn độc lập.

🔴 **Nhật ký định tuyến ở `kho-du-lieu.tsx` → `ghiNhatKyDonHang`, MỘT chỗ duy nhất.** Đơn có `prId`
ghi vào `DeNghiMuaHang.lichSu` như cũ; đơn độc lập ghi vào `DonDatHang.lichSu` của chính nó. Không
có hàm này thì `ghiLichSuDeNghi(undefined, …)` **rơi mất im lặng** — sáu thao tác (lập đơn, ghi
phiếu nhận, duyệt/từ chối phiếu, đính kèm phiếu giao, thủ kho xác nhận, trưởng bộ phận xác nhận)
không để lại một dấu vết nào.

🔴 **`themDonHang` từ chối cất khi `maDuAn` rỗng.** Mã đơn `260001-HPCS-PO-001` lấy phần đầu từ mã
dự án; đơn độc lập để người lập tự chọn nên phải chặn ở tầng dữ liệu, không chỉ khóa nút.

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

#### Các trường thêm ngày 17/08/2026 — bám màn Đơn mua hàng của MISA

Chỉ đạo Ban lãnh đạo: *"cấu hình cho a bước lập đơn mua hàng có chức năng giống này 100% và được import được file excel"*.

| Vào `tm_donhang` (ai trong dự án cũng đọc được) | Vào `tm_donhang_gia` (chỉ vai trò xem giá) |
|---|---|
| `tenCongTrinh` · `maSoThueNCC` · `diaChiNCC` · `nguoiLienHeNCC` · `dienGiai` · `thamChieu` · `maHopDongCDT` · `tepDinhKem` | `DongGiaPO.thueSuatGTGT` (% thuế từng dòng) · `kieuChietKhau` · `tyLeChietKhau` · `soNgayDuocNo` |
| `DongPO.truongMoRong1` · `DongPO.laDongGhiChu` | |

📌 **`ngayHopDongCDT` đã rời khỏi bảng trên từ 27/08/2026** — form bỏ ô chọn ngày, ngày ký nay nằm ngay trong chuỗi ghi chú `maHopDongCDT`. Trường vẫn còn trong kiểu dữ liệu vì các đơn lập trước ngày đó đang mang giá trị này.

🔴 **`soNgayDuocNo` để bên GIÁ dù nghe như thông tin hành chính.** Đây là điều kiện thương mại đàm phán được — NCC cho nợ 45 ngày thường báo giá cao hơn NCC thu tiền ngay. Lộ nó ra `tm_donhang` là lộ một phần thế đàm phán.

🔴 **`maSoThueNCC` và `diaChiNCC` chép thẳng lên đơn là để VÁ MỘT LỖ HỔNG THẬT.** Trước 17/08/2026 màn lập đơn **có** hai ô nhập này nhưng **không lưu đi đâu cả** — chỉ `supplierId` + `supplierTen` được truyền vào `themDonHang`. Trang in phải tra ngược danh mục `NHA_CUNG_CAP`, mà danh mục đó là hằng số cứng và app **không có đường thêm NCC mới**. Hệ quả: nhà cung cấp ngoài danh mục thì đơn in ra hiện `—` ở dòng Địa chỉ và Mã số thuế — chứng từ gửi ra ngoài công ty thiếu mã số thuế.

⚠️ **`laDongGhiChu` — dòng ghi chú chèn giữa bảng hàng.** Nút "Thêm ghi chú" của MISA chèn một *dòng* vào bảng chứ không mở ô ghi chú riêng. Khi cờ này bật: `tenVatLieu` giữ nội dung ghi chú, `sttDongDeNghi = 0`, `khoiLuongDat = 0`. 🔴 **Mọi vòng lặp qua `po.items` phải lọc bằng `laDongHang()`** (`2-quy-trinh/tinh-toan.ts`) — quên lọc thì dòng ghi chú bị đếm vào mẫu số của `phanTramPO` và nằm chờ nhận hàng vĩnh viễn.

📌 **Mã đơn hàng KHÔNG đổi.** Vẫn là `260001-HPCS-PO-001` theo Thông báo 09/2026 (TGĐ ký), **không** lấy kiểu `DMH0532-26` của MISA. Bám màn hình MISA là bám *bố cục và chức năng*, không phải bám hệ mã hồ sơ.

🐛 **18/08/2026 — `NHA_CUNG_CAP` đã được bổ sung `maNCC` và `nguoiLienHe`, đây là SỬA LỖI THẬT.**
Hai trường đó được thêm vào kiểu `NhaCungCap` khi làm màn lập đơn theo MISA, nhưng **không bản ghi mẫu
nào được điền**. Hệ quả: ô "Mã nhà cung cấp" ở `form-lap-don-mua-hang.tsx` tra theo `n.maNCC` nên
**không bao giờ tra ra được gì** — gõ mã nào cũng không điền hộ được tên / MST / địa chỉ, và câu trạng
thái dưới ô luôn báo *"Chưa có trong danh mục"*. Một ô nhập bày ra mà không làm nổi việc nó hứa, đúng
thứ mục 3.5 của `CLAUDE.md` cấm. Nay danh mục có `NCC0001`…`NCC0004` và **nút sổ xuống** cạnh ô đó
liệt kê đúng danh mục này.

⚠️ **`maNCC` KHÁC `id`.** `id` (`ncc-01`) là khóa kỹ thuật — đổi là làm mồ côi mọi đơn cũ.
`maNCC` (`NCC0001`) là mã nghiệp vụ in trên chứng từ, đổi được. Đừng gộp hai thứ.

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

IndexedDB chứa được hàng trăm MB và lưu thẳng Blob. Chứng từ chỉ giữ phần **mô tả** (`MoTaTep`: tên, cỡ, kiểu, ai tải, lúc nào, `id` để tra, và `ghiChu` tùy chọn); nội dung nằm trong kho tệp.

🔴 **`MoTaTep.ghiChu` là NHÃN NGƯỜI ĐỌC ĐƯỢC của chứng từ, không phải trang trí** (Ban lãnh đạo 17/08/2026: *"thêm chức năng ghi chú cho mỗi tệp đính kèm thêm"*). App **không đổi được tên tệp**: ảnh nhà cung cấp gửi qua Zalo mang tên máy sinh kiểu `1785921139635_1967909016357413267_….jpg`. Ba tháng sau mở hồ sơ ra, năm tệp cùng kiểu tên đó thì không ai biết đâu là báo giá của NCC nào, đâu là hóa đơn, đâu là ảnh phiếu giao nhận — hồ sơ lưu chứng từ mà không tra cứu được thì coi như không lưu.

⚠️ **Trường để TÙY CHỌN là cố ý** — sáu chỗ dưới đây đều dùng `MoTaTep`, và mọi tệp đính kèm trước 17/08/2026 đều không có trường này. Hiện chỉ `tepGiaiDoan` có giao diện ghi chú (`datGhiChuTepGiaiDoan`); năm chỗ còn lại đọc được nhưng chưa có chỗ nhập.

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
| `DeNghiMuaHang.tepGiaiDoan` | **Chứng từ phát sinh trong từng bước**, khóa = mã giai đoạn. Báo giá NCC ở bước ②, hợp đồng ở bước ④, hóa đơn ở bước ⑥ (Ban lãnh đạo 17/08/2026) | `themTepGiaiDoan` · `goTepGiaiDoan` · `datGhiChuTepGiaiDoan` |
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
