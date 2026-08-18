# 2 — QUY TRÌNH

**Quy tắc nghiệp vụ**: tính toán số liệu, chữ và màu của trạng thái, danh sách mục điều hướng.

Thư mục này **không có giao diện** và **không chứa dữ liệu**. Sai số liệu trên màn hình thì tìm ở đây trước.

## Các file

| File | Việc | Sửa khi |
|---|---|---|
| **`huong-dan-giai-doan.ts`** | **Văn bản hướng dẫn nghiệp vụ** của 6 bước, chép nguyên văn quy trình "TM-QT Mua hàng (HP CONS)" trên Base.vn | Công ty ban hành quy trình mới. 🔴 Không tự viết lại cho gọn — người dùng đối chiếu với quy trình giấy |
| **`nguong-gia-tri.ts`** | Ba ngưỡng tiền **5 / 10 / 20 triệu**: số báo giá tối thiểu, ai duyệt, khi nào cần hợp đồng | Công ty đổi ngưỡng. Mọi nơi cần con số này đều gọi vào đây, không viết số vào chỗ khác |
| **`lich-cong-viec.ts`** | Suy ra **việc đến hạn theo ngày** của từng người + lưới tháng | Lịch thiếu/thừa việc, sai ngày, hiện việc của người khác |
| **`xuat-don-hang-excel.ts`** | **Xuất đơn ra .xlsx** đúng biểu mẫu công ty (gửi NCC, lưu hồ sơ). Hàm **thuần** — không đọc kho, không kiểm quyền, **không dùng `po.id`** — nên dùng được cho cả **bản mẫu chưa lưu** (18/08/2026). `vuongMacXuatPO` là **luật duy nhất** trả lời câu *"tờ PO này đã đủ để đưa ra ngoài chưa"*, dùng ở nút Xuất Excel của đơn thật **và** ở cả hai nút của chế độ mẫu | File xuất ra lệch biểu mẫu, sai ô, sai công thức; hoặc nút xuất bị khóa/không phản ứng |
| **`ghi-don-hang-excel.ts`** | **Biểu mẫu TRỐNG** để người lập điền đơn giá rồi nhập lại vào app. Cờ `nhapTuDo` đổi câu hướng dẫn cho đơn **không gắn đề nghị** (được gõ tên hàng tự do) | Nút "Tải file mẫu" ở màn lập đơn ra file sai |
| **`dat-ma-don-hang.ts`** | Sinh mã đơn `[mã dự án]-PO-[STT]` theo Thông báo 09/2026/TB-HPCS. 🔴 Lấy **số lớn nhất đã dùng rồi +1**, không đếm số đơn hiện có (đếm rồi +1 là sinh mã TRÙNG khi có đơn bị bỏ) | Mã đơn trùng, sai dạng, hoặc đổi mã loại `PO` khi được duyệt |
| **`don-hang-mau.ts`** | Dựng **đơn TẠM trong bộ nhớ** từ dữ liệu đang gõ trên form, để in / xuất Excel mà **KHÔNG lưu** (Ban lãnh đạo 18/08/2026: *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*). Gồm `dungDonHangMau` · `dongTuDoDuVaoDon` (luật "dòng gõ tự do đã đủ để vào đơn chưa", **chuyển từ file giao diện sang đây** cho đúng quy tắc 3.4b) · hằng `SO_DON_BAN_MAU` · `tenFileDonHangMau`. 🔴 **KHÔNG gọi `themDonHang`, không đụng kho dữ liệu** — chính điều đó làm chế độ mẫu không còn đi vòng qua chốt `vuongMacLapDonHang`. 🔴 **KHÔNG dùng `maDonHangTiepTheo`**: bản mẫu không cất nên chiếm số là **thủng số** trong dãy mã của dự án, và một mã nhìn như thật in ra giấy là chứng từ giả | Bản mẫu in/xuất ra thiếu ô, sai tiền, hoặc muốn đổi câu ghi ở ô "Số đơn hàng" |
| **`doc-don-hang-excel.ts`** | Đọc file Excel người dùng chọn để điền sẵn màn lập đơn. **Khớp cột theo TÊN tiêu đề**, báo rõ thiếu cột nào và dòng nào hỏng (kèm số dòng trong file) | Nhập từ Excel không nhận dòng, sai cột |
| **`tinh-toan.ts`** | Toàn bộ công thức của app | Số đã nhận / còn lại / % sai; điều kiện hoàn thành PO sai; sai chiết khấu / thuế / tổng thanh toán |
| **`tim-kiem.ts`** | Luật ô tìm kiếm trên thanh trên + **lọc kết quả theo quyền** | Tìm không ra hồ sơ; vai trò thấy hồ sơ lẽ ra không được thấy |
| **`trang-thai.ts`** | Chữ và tông màu cho mọi trạng thái | Muốn đổi cách gọi trạng thái, đổi màu badge |
| **`dieu-huong.ts`** | Danh sách mục trong menu + vai trò nào thấy mục nào | Thêm/bớt màn hình trong menu. 🔴 Quy ước *"menu chỉ 4 mục"* (06/08/2026) đã được Ban lãnh đạo **đổi ngày 18/08/2026** khi thêm mục **"Lập đơn mua hàng (PO)"** — đừng gỡ mục đó, xem `BAN-DO-MA-NGUON.md` mục 2c |
| **`tuoi-no.ts`** | Chia công nợ thành 5 mức tuổi nợ 30-60-90 + đánh giá rủi ro từng NCC | Sai cách chia mức, sai mức rủi ro |
| **`so-sanh-bao-gia.ts`** | Dựng ma trận vật tư × nhà cung cấp, đánh dấu giá thấp nhất | Sai ô "thấp nhất", sai tổng theo NCC |
| **`giai-doan-mua-hang.ts`** | 8 giai đoạn của **bảng quy trình dạng cột** (Kanban) ở màn `/de-nghi` | Đề nghị nằm sai cột, sai chữ "Quá hạn / Còn N ngày", muốn đổi tên cột |

### `giai-doan-mua-hang.ts` — điều quan trọng nhất

🔴 **Giai đoạn KHÔNG phải một trường lưu trong dữ liệu.** Nó được **suy ra** từ chứng từ có thật:
báo giá → đơn đặt hàng → phiếu nhận hàng. Xét từ giai đoạn xa nhất trở về.

Hệ quả: **kéo thả thẻ KHÔNG đổi nhãn chay, mà LÀM ĐÚNG NGHIỆP VỤ của cột đích**
(quyết định 22, Ban lãnh đạo chốt 07/08/2026). Bước làm ngay được thì thẻ tự chuyển; bước cần
quyết định thì mở đúng màn hình đó; kéo lùi / nhảy cóc / ép Hoàn thành đều bị chặn kèm lý do.
Nếu cho kéo tự do thì kéo thẻ sang cột "Tiến hành nhận hàng" khi chưa có phiếu nhận nào là báo
tiến độ ảo — đúng cái lỗi mà nguyên tắc dữ liệu số 4 của dự án cấm.

| Hàm | Trả về |
|---|---|
| `xacDinhGiaiDoan` | Một đề nghị đang ở cột nào trong 8 cột |
| `quyetDinhKeoTha` | Kéo thẻ từ cột A sang cột B thì **được phép không**, và **phải làm gì** |
| `dungXacNhanKeoTha` | Nội dung **hộp xác nhận** trước khi chuyển bước: bước cũ → bước mới, việc sẽ xảy ra, và **những gì còn dang dở ở bước hiện tại** |

🔴 **Hai hàm trên làm hai việc khác nhau, đừng gộp:**
`quyetDinhKeoTha` là **luật cứng** — sai thì chặn hẳn (kéo lùi, nhảy cóc, ép Hoàn thành).
`dungXacNhanKeoTha` là **cảnh báo mềm** — bước vẫn hợp lệ, chỉ nhắc người dùng nhìn lại
(còn dòng chưa phân bổ, còn đơn nháp, còn phiếu chờ kiểm tra, đề nghị đã quá hạn).
Cảnh báo **cố ý không chặn**: việc dang dở nhiều khi có lý do chính đáng, chặn cứng sẽ
làm người dùng bí việc. Muốn cấm hẳn một bước thì thêm luật vào `quyetDinhKeoTha`.
| `hanXuLyDeNghi` | "Quá hạn 2 ngày" / "Còn 9 ngày" / "Không còn thời hạn" + tông màu |
| `dungBangQuyTrinh` | Dựng đủ 8 cột kèm số thẻ và số việc quá hạn mỗi cột |
| `deNghiConDangChay` | Loại đề nghị đã hoàn thành / đóng dở khỏi hàng chờ phân bổ và thẻ KPI |
| `vuongMacLapDonHang` | Lý do đề nghị **chưa lập được đơn đặt hàng** (thường là bảng báo giá chưa được trưởng bộ phận duyệt), `null` là được phép. 🔴 Chính là luật `themDonHang` dùng để chặn lúc cất đơn — mọi chỗ giải thích cho người dùng đều phải gọi hàm này, không tự viết câu khác |
| `dongLapDuocDonHang` | Dòng nào của đề nghị mà **người này** lập được đơn ngay: còn khối lượng chưa lên đơn + đã có người phụ trách + là người đó (hoặc là người có quyền phân bổ) |

🔴 **`vuongMacLapDonHang` ÁP CHO MỌI ĐƠN ĐƯỢC CẤT — và `themDonHang` từ chối đơn không gắn đề nghị.**

Diễn biến ngày 18/08/2026, đọc cả hai đoạn để không dựng lại bản sáng:

- **Sáng:** module *"Lập đơn mua hàng (PO)"* thành module độc lập và **cất được đơn không gắn phiếu
  đề nghị**. Đơn đó không có bảng báo giá để đối chiếu nên `themDonHang` **bỏ qua** chốt này — tức
  đường độc lập **đi vòng qua một chốt kiểm soát chi tiêu**, đơn ra đời mà không qua bước ③ Xét
  duyệt báo giá. Rủi ro này đã được báo lên Ban lãnh đạo.
- **Chiều:** Ban lãnh đạo trả lời *"chỉ cần tạo mẫu PO thôi, chưa cần lưu"*. Module độc lập
  **không cất đơn nữa**, chỉ in / xuất mẫu (`don-hang-mau.ts` → `dungDonHangMau`). Không còn
  đường cất nào thiếu `prId`, nên chốt đã được **siết lại**: `themDonHang` trả lỗi ngay khi
  `prId` rỗng, rồi mới chạy `vuongMacLapDonHang` cho phần còn lại.

⚠️ **Đừng gỡ chốt `prId` ở `themDonHang` để "cho tiện".** Bỏ nút trên giao diện không phải là chặn:
hàm ghi dữ liệu còn nhiều đường vào khác, và hộp xác nhận Cất vẽ ngoài nhánh điều kiện nên vẫn có
đường đua khi phiếu đề nghị biến mất khỏi kho chung giữa lúc hộp đang mở. Muốn cho phép cất đơn
không gắn đề nghị thì phải có **luật xét duyệt giá thay thế** đặt vào đúng chỗ đó.

📌 **`dongLapDuocDonHang` tách ra khỏi file giao diện ngày 18/08/2026.** Hôm đó có hai nơi gọi (form
lập đơn + bước chọn đề nghị của `/don-hang/tao-moi`); bước chọn đã bị bỏ ngay chiều cùng ngày nên nay
chỉ còn form. Vẫn để ở đây vì quy tắc 3.4b cấm để hàm nghiệp vụ trong file giao diện.
Hàm `dongThuocVeNguoi` (đi cặp với nó, chỉ phục vụ bước chọn) đã **xóa hẳn** cùng lúc — mã chết thì
xóa, không để lại.

⚠️ Hàm này nhận `laNguoiPhanBo` là **boolean**, không nhận cả đối tượng `Quyen`: `2-quy-trinh/`
là quy tắc nghiệp vụ thuần, **không được phụ thuộc `4-phan-quyen/`**.

## `tinh-toan.ts` — các hàm chính

| Hàm | Trả về |
|---|---|
| `tinhTienDoPO` | Tiến độ từng dòng của một PO, kèm khối lượng nhận theo **từng lần giao** |
| `phanTramPO` | % của PO = số dòng đã nhận đủ ÷ tổng số dòng |
| `poDaGiaoDu` | Đã giao đủ mọi dòng chưa |
| `poDuDieuKienHoanThanh` | **Đủ cả 4 điều kiện chưa**: giao đủ + **mọi lần giao có phiếu giao nhận đính kèm** + kho xác nhận + trưởng bộ phận xác nhận |
| `vuongMacXacNhanKho` | Lý do thủ kho CHƯA được bấm xác nhận (còn phiếu nào thiếu tệp phiếu giao nhận), `null` là được phép |
| `tinhTienDoDeNghi` | Tiến độ từng dòng đề nghị, **gộp từ nhiều PO** |
| `tomTatTienDoDeNghi` | "6/10 mặt hàng đã nhận đủ" |
| `laDongHang` | Dòng PO này là **hàng thật** hay **dòng ghi chú** chèn giữa bảng. 🔴 Mọi vòng lặp qua `po.items` phải lọc qua đây |
| `tongGiaTriPO` | Tổng tiền hàng — **chỉ gọi khi vai trò được xem giá** |
| **`tinhTienChiTiet`** | ★ **MÁY TÍNH TIỀN — nơi duy nhất tính mọi con số tiền.** Nhận danh sách dòng + phần thương lượng, trả về **từng dòng** (thành tiền · chiết khấu phân bổ · % thuế · tiền thuế) **và khối tổng** |
| `tinhTienChiTietPO` | Như trên nhưng nhận thẳng (PO, chứng từ giá) — cho bảng "Hàng tiền" có dòng TỔNG CỘNG |
| `tinhKhoiTongTien` | Khối tổng từ **ba con số thô**, để **màn LẬP đơn xem trước được khi PO chưa tồn tại**. Chỉ là lớp vỏ gọi vào `tinhTienChiTiet` |
| `tinhTienDonHang` | Khối tổng của đơn đã lập — dùng ở màn xem và trang in |
| `lamTronDong` | Quy ước làm tròn tiền của toàn app: **về đồng, nửa lên** |
| `thanhTienDong` · `tienThueDong` · `tienChietKhau` | Ba phép tính lẻ, tách ra để gọi riêng được |
| `chiaTheoTyLe` | Chia một số tiền cho các dòng theo tỷ lệ, **không rơi mất đồng nào** |
| `moTaThueSuat` | Chữ in ra chứng từ: `"8%"` hoặc `"nhiều mức"` |
| `soNgayConLai` · `tongMauTheoThoiGian` | Số ngày còn lại và màu thanh timeline |

🔴 **Thuế GTGT tính TRÊN GIÁ ĐÃ TRỪ CHIẾT KHẤU** — đúng thứ tự các dòng trên biểu mẫu
`1. INPUT/Bieu mau/1. DON HANG HPCONS.xlsx`. Đảo thứ tự là ra số thuế khác.

### Ba quy ước làm tròn tiền (chỉ đạo Ban lãnh đạo 17/08/2026 — bám màn Đơn mua hàng MISA)

Lệch một đồng giữa màn hình và bản in là mất uy tín với nhà cung cấp, nên ba việc dưới đây
**không được đổi nếu chưa hiểu hết hậu quả**:

1. **Chiết khấu phân bổ về từng dòng theo tỷ lệ thành tiền.** Bắt buộc, không phải cho đẹp:
   đơn trộn nhiều mức thuế mà để chiết khấu ở mức tổng thì không biết phần nào thuộc hàng 8%,
   phần nào thuộc hàng 10% → không tính nổi tiền thuế.
2. **Thuế làm tròn MỘT LẦN cho mỗi MỨC thuế suất**, không phải làm tròn từng dòng rồi cộng.
   Đây là cách tờ khai thuế GTGT gộp số liệu, và nhờ nó mà đơn một mức thuế cho ra kết quả
   **trùng khít** với `tinhKhoiTongTien` — phần xem trước lúc lập đơn không bao giờ lệch số
   đã lưu của đơn.
3. **Cột "Tiền thuế GTGT" từng dòng là phần chia lại** từ số đã làm tròn của nhóm, qua
   `chiaTheoTyLe`. Nhờ vậy cộng cột luôn đúng bằng dòng TỔNG CỘNG.

🔴 **Đơn trộn nhiều mức thuế: KHÔNG được in `thueSuatGTGT` như thuế suất của cả đơn.** Lúc đó
trường ấy chỉ là mức của nhóm lớn nhất; in ra thành *"Tiền thuế GTGT (thuế suất 8%)"* trong khi
đơn có cả 10% là **ghi sai chứng từ thuế**. Kiểm cờ `nhieuMucThue`, dùng `moTaThueSuat`.

### Dòng ghi chú chèn giữa bảng

Nút "Thêm ghi chú" của MISA chèn một **dòng** vào bảng hàng chứ không mở ô ghi chú riêng.
Đánh dấu bằng `DongPO.laDongGhiChu`. 🔴 Quên lọc nó ra thì nó bị đếm vào mẫu số của
`phanTramPO` (sai % tiến độ) và **nằm chờ nhận hàng vĩnh viễn** ở bảng tiến độ.

## `lich-cong-viec.ts` — việc tự động SUY RA, không lưu bản sao

Bốn mốc tự lên lịch (Ban lãnh đạo chốt 11/08/2026): **ngày cần hàng** của đề nghị · **hạn giao hàng** của đơn · **hạn NCC nộp báo giá** · **hạn thanh toán công nợ**. Thêm mốc **chờ phân bổ** cho người có quyền phân bổ.

🔴 **Lịch KHÔNG có bảng dữ liệu riêng cho việc tự động.** Mỗi lần mở, `dungLichCuaToi` đọc chứng từ hiện có rồi tính ra — đúng cách `xacDinhGiaiDoan` suy giai đoạn. Lý do:

- Lưu bản sao là tạo **nguồn sự thật thứ hai**: `suaThoiHan` đổi `ngayCanHang` xong thì lịch vẫn treo ngày cũ.
- Không có chỗ để lưu — localStorage đang giữ toàn bộ chứng từ, nhân bản là ăn dung lượng cho thông tin đã có.
- Bản sao sinh **việc mồ côi**: đề nghị đóng dở mà mục lịch còn treo.
- Nếu là bản sao, người dùng sẽ tưởng **xóa được** mục "Hạn giao hàng" — mà xóa nó không làm đơn hết hạn.

**Hệ quả phải nhận:** mục tự động không có nút xóa và không giữ được trạng thái riêng. Xong hay chưa đọc từ chứng từ; hồ sơ kết thúc thì mục tự rụng.

🔴 **Lọc theo NGƯỜI PHỤ TRÁCH.** Một đề nghị có thể lên lịch của nhiều người vì mỗi dòng vật tư có người phụ trách riêng — mỗi người chỉ thấy phần của mình. Đổ hết mọi hồ sơ lên lịch là biến nó thành bảng quy trình thứ hai.

📌 **Ghi chú tay riêng tư tuyệt đối** (Sếp chốt 11/08/2026), lưu ở `3-du-lieu/ghi-chu-ca-nhan.ts` theo `uid`. Trường `ngayHan` là **tùy chọn** — không có ngày thì ghi chú vẫn ở sổ tay, chỉ không lên lịch. Bắt buộc nhập ngày sẽ giết công dụng ghi nhanh.

⚠️ **KHÔNG dùng `toISOString()` để lấy chuỗi ngày.** Nó trả giờ UTC nên ở UTC+7 mọi mốc trước 07:00 sáng lùi về hôm trước → lịch lệch một ngày. Dùng `getFullYear/getMonth/getDate` rồi ghép chuỗi.

## Ba file Excel — đừng lẫn với nhau

| File | Đầu vào | Có đơn giá? | Dùng để |
|---|---|---|---|
| `ghi-don-hang-excel.ts` | Đề nghị | ❌ | Người lập tải về, điền đơn giá, **nhập lại vào app** |
| `doc-don-hang-excel.ts` | File người dùng chọn | — | Đọc file trên để điền sẵn màn lập đơn |
| `xuat-don-hang-excel.ts` | Đơn hàng + chứng từ giá | ✅ | **Gửi nhà cung cấp** và lưu hồ sơ |

🔴 **Không gộp ba file này.** Hai luồng khác đầu vào, khác quyền (xuất PO **bắt buộc** quyền `xemGia`, tải mẫu thì không), khác mục đích. Gộp lại là sớm muộn có ngày xuất bản trống gửi cho nhà cung cấp.

📌 **Thứ tự cột A→J của biểu mẫu công ty**: `A=STT · B=Mã hàng · C=Tên hàng · D=Thông số kỹ thuật · E=ĐVT · F=SL · G=Đơn giá · H=Thành tiền (gộp H:I) · J=Mục đích sử dụng`. Hai file **ghi** (`ghi-` và `xuat-`) vẫn phải giữ đúng thứ tự này — đây là chứng từ đang lưu hành và trang in A4 bám theo.

🔴 **Từ 17/08/2026 bên ĐỌC không còn phụ thuộc vị trí cột — nó khớp theo TÊN TIÊU ĐỀ** (`CACH_VIET_COT` trong `doc-don-hang-excel.ts`), không phân biệt hoa thường, bỏ dấu cách thừa, bỏ dấu `*`.

Lý do đổi: màn Đơn mua hàng của MISA có thêm cột `% Thuế GTGT`, `Tiền thuế GTGT`, `Trường mở rộng 1` và cột đầu ghi `#` chứ không phải `STT`. Đọc theo vị trí thì **chỉ cần chèn một cột là mọi cột sau lệch hết, mà lệch IM LẶNG** — app vẫn đọc ra số, chỉ là lấy nhầm ô; đơn giá đọc trúng cột thành tiền thì đơn hàng sai giá mà không cảnh báo gì.

Nhờ vậy `ghi-don-hang-excel.ts` thêm được `K=% Thuế GTGT` và `L=Trường mở rộng 1` **vào cuối** mà không phải đụng vào A→J.

⚠️ **Đổi chữ ở dòng tiêu đề bảng thì phải thêm cách viết mới vào `CACH_VIET_COT`**, nếu không app báo "thiếu cột" và bỏ trống cột đó.

🔴 **So khớp tên cột phải là SO CẢ CHUỖI, không dùng "chứa".** `"tien thue gtgt"` chứa luôn `"thue gtgt"` → hai cột khác nhau tranh nhau một ô, cột nào thắng phụ thuộc thứ tự duyệt. Sai kiểu đó không có triệu chứng nào ngoài con số lệch.

📌 **Bố cục ô của `xuat-don-hang-excel.ts` đọc trực tiếp từ XML biểu mẫu thật**, không suy từ trang in. Cách đọc an toàn: copy file sang thư mục tạm → đổi đuôi `.zip` → giải nén → đọc `xl/worksheets/sheet1.xml`. 🔴 **KHÔNG mở bằng Excel COM** — Excel ghi lại metadata làm đổi file gốc, vi phạm quy tắc "không sửa file trong `1. INPUT/`".

## `nguong-gia-tri.ts` — luật tiền của quy trình thật

| Ngưỡng | Bắt buộc điều gì | App làm được gì |
|---|---|---|
| **Trên 5 triệu** | Đơn mua hàng phải trình TP.TMCU ký duyệt, rồi gửi NCC ký xác nhận | Chỉ **nhắc** — app chưa lưu chữ ký |
| **Từ 10 triệu** | Ít nhất **02 báo giá**; **Tổng Giám đốc** duyệt (dưới mức này TP.TMCU duyệt) | **Đếm được** số báo giá và cảnh báo. Cấp duyệt chỉ nhắc — app chưa có tài khoản TGĐ |
| **Từ 20 triệu** | Phải có **hợp đồng** do TGĐ ký; NCC mới phải cập nhật "Danh sách nhà cung cấp" | Chỉ **nhắc** — app chưa quản lý hợp đồng |

🔴 **Cố ý CHỈ NHẮC, KHÔNG CHẶN.** Quy trình cho phép 01 báo giá trong vài trường hợp mà app
không nhìn thấy được (NCC có trong danh mục hàng năm, Ban Giám đốc chỉ định, TP.TMCU đề nghị
chỉ định). Chặn cứng theo một luật thiếu dữ liệu để xét thì người dùng sẽ nhập báo giá ma cho
đủ số — dữ liệu hỏng còn tệ hơn thiếu kiểm.

🔴 **`giaTriUocTinh` lấy phương án ĐẮT NHẤT**, không lấy rẻ nhất hay trung bình. Ngưỡng duyệt
là để bảo vệ công ty; khi chưa biết sẽ chốt NCC nào mà xét theo giá rẻ nhất thì có trường hợp
lọt ngưỡng rồi cuối cùng chốt NCC đắt hơn — đơn đáng lẽ TGĐ duyệt lại chỉ có trưởng phòng duyệt.

## Ba quy tắc bất di bất dịch

**1. Chỉ phiếu nhận hàng ở trạng thái `da_nhap_kho` được tính vào khối lượng đã nhận.**
Phiếu `cho_kiem_tra` **không** tính — nếu tính thì app báo tiến độ ảo, hàng chưa kiểm tra chất lượng đã coi như xong.

**2. Phần trăm tính theo SỐ DÒNG, không theo giá trị tiền.**
Vì thủ kho và Phòng Thi công không được xem giá — tính theo tiền thì họ thấy con số khác Thu mua và QLDA, rất dễ tranh cãi số liệu.

**3. Khối lượng đối chiếu qua SỐ THỨ TỰ DÒNG, không qua tên vật tư.**
Dòng PO trỏ về `sttDongDeNghi`; dòng nhận hàng trỏ về `sttDongPO`. Nhờ vậy tính được "còn lại bao nhiêu" dù ver 1 chưa có mã vật tư.

## Nơi khác không được tự tính lại

Nếu một màn hình cần con số nào, **gọi hàm ở đây** — đừng tự cộng trừ trong file giao diện. Có hai chỗ cùng tính một con số là chắc chắn sẽ lệch nhau về sau.
