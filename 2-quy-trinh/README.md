# 2 — QUY TRÌNH

**Quy tắc nghiệp vụ**: tính toán số liệu, chữ và màu của trạng thái, danh sách mục điều hướng.

Thư mục này **không có giao diện** và **không chứa dữ liệu**. Sai số liệu trên màn hình thì tìm ở đây trước.

## Các file

| File | Việc | Sửa khi |
|---|---|---|
| **`huong-dan-giai-doan.ts`** | **Văn bản hướng dẫn nghiệp vụ** của 6 bước, chép nguyên văn quy trình "TM-QT Mua hàng (HP CONS)" trên Base.vn | Công ty ban hành quy trình mới. 🔴 Không tự viết lại cho gọn — người dùng đối chiếu với quy trình giấy |
| **`nguong-gia-tri.ts`** | Ba ngưỡng tiền **5 / 10 / 20 triệu**: số báo giá tối thiểu, ai duyệt, khi nào cần hợp đồng | Công ty đổi ngưỡng. Mọi nơi cần con số này đều gọi vào đây, không viết số vào chỗ khác |
| **`xuat-don-hang-excel.ts`** | **Xuất đơn ĐÃ LẬP** ra .xlsx đúng biểu mẫu công ty (gửi NCC, lưu hồ sơ) | File xuất ra lệch biểu mẫu, sai ô, sai công thức |
| **`ghi-don-hang-excel.ts`** | **Biểu mẫu TRỐNG** để người lập điền đơn giá rồi nhập lại vào app | Nút "Tải file mẫu" ở màn lập đơn ra file sai |
| **`doc-don-hang-excel.ts`** | Đọc file Excel người dùng chọn để điền sẵn màn lập đơn | Nhập từ Excel không nhận dòng, sai cột |
| **`tinh-toan.ts`** | Toàn bộ công thức của app | Số đã nhận / còn lại / % sai; điều kiện hoàn thành PO sai; sai chiết khấu / thuế / tổng thanh toán |
| **`tim-kiem.ts`** | Luật ô tìm kiếm trên thanh trên + **lọc kết quả theo quyền** | Tìm không ra hồ sơ; vai trò thấy hồ sơ lẽ ra không được thấy |
| **`trang-thai.ts`** | Chữ và tông màu cho mọi trạng thái | Muốn đổi cách gọi trạng thái, đổi màu badge |
| **`dieu-huong.ts`** | Danh sách mục trong menu + vai trò nào thấy mục nào | Thêm/bớt màn hình trong menu |
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
| `tongGiaTriPO` | Tổng tiền hàng — **chỉ gọi khi vai trò được xem giá** |
| `tinhKhoiTongTien` | Khối tổng theo **đúng trình tự biểu mẫu công ty**: cộng tiền hàng → trừ CK → thuế GTGT → tổng thanh toán. Nhận ba con số thô nên **màn LẬP đơn xem trước được khi PO chưa tồn tại** |
| `tinhTienDonHang` | Như trên nhưng nhận thẳng (PO, chứng từ giá) — dùng ở màn xem và trang in |
| `soNgayConLai` · `tongMauTheoThoiGian` | Số ngày còn lại và màu thanh timeline |

🔴 **Thuế GTGT tính TRÊN GIÁ ĐÃ TRỪ CHIẾT KHẤU** — đúng thứ tự các dòng trên biểu mẫu
`1. INPUT/Bieu mau/1. DON HANG HPCONS.xlsx`. Đảo thứ tự là ra số thuế khác.

## Ba file Excel — đừng lẫn với nhau

| File | Đầu vào | Có đơn giá? | Dùng để |
|---|---|---|---|
| `ghi-don-hang-excel.ts` | Đề nghị | ❌ | Người lập tải về, điền đơn giá, **nhập lại vào app** |
| `doc-don-hang-excel.ts` | File người dùng chọn | — | Đọc file trên để điền sẵn màn lập đơn |
| `xuat-don-hang-excel.ts` | Đơn hàng + chứng từ giá | ✅ | **Gửi nhà cung cấp** và lưu hồ sơ |

🔴 **Không gộp ba file này.** Hai luồng khác đầu vào, khác quyền (xuất PO **bắt buộc** quyền `xemGia`, tải mẫu thì không), khác mục đích. Gộp lại là sớm muộn có ngày xuất bản trống gửi cho nhà cung cấp.

⚠️ **Thứ tự cột phải trùng nhau ở cả ba file**: `A=STT · B=Mã hàng · C=Tên hàng · D=Thông số kỹ thuật · E=ĐVT · F=SL · G=Đơn giá · H=Thành tiền (gộp H:I) · J=Mục đích sử dụng`. Sửa một bên mà quên bên kia là file app xuất ra chính app lại không đọc được.

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
