# 2 — QUY TRÌNH

**Quy tắc nghiệp vụ**: tính toán số liệu, chữ và màu của trạng thái, danh sách mục điều hướng.

Thư mục này **không có giao diện** và **không chứa dữ liệu**. Sai số liệu trên màn hình thì tìm ở đây trước.

## Bảy file

| File | Việc | Sửa khi |
|---|---|---|
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
| `poDuDieuKienHoanThanh` | **Đủ cả 3 điều kiện chưa**: giao đủ + kho xác nhận + trưởng bộ phận xác nhận |
| `tinhTienDoDeNghi` | Tiến độ từng dòng đề nghị, **gộp từ nhiều PO** |
| `tomTatTienDoDeNghi` | "6/10 mặt hàng đã nhận đủ" |
| `tongGiaTriPO` | Tổng tiền hàng — **chỉ gọi khi vai trò được xem giá** |
| `tinhKhoiTongTien` | Khối tổng theo **đúng trình tự biểu mẫu công ty**: cộng tiền hàng → trừ CK → thuế GTGT → tổng thanh toán. Nhận ba con số thô nên **màn LẬP đơn xem trước được khi PO chưa tồn tại** |
| `tinhTienDonHang` | Như trên nhưng nhận thẳng (PO, chứng từ giá) — dùng ở màn xem và trang in |
| `soNgayConLai` · `tongMauTheoThoiGian` | Số ngày còn lại và màu thanh timeline |

🔴 **Thuế GTGT tính TRÊN GIÁ ĐÃ TRỪ CHIẾT KHẤU** — đúng thứ tự các dòng trên biểu mẫu
`1. INPUT/Bieu mau/1. DON HANG HPCONS.xlsx`. Đảo thứ tự là ra số thuế khác.

## Ba quy tắc bất di bất dịch

**1. Chỉ phiếu nhận hàng ở trạng thái `da_nhap_kho` được tính vào khối lượng đã nhận.**
Phiếu `cho_kiem_tra` **không** tính — nếu tính thì app báo tiến độ ảo, hàng chưa kiểm tra chất lượng đã coi như xong.

**2. Phần trăm tính theo SỐ DÒNG, không theo giá trị tiền.**
Vì thủ kho và Phòng Thi công không được xem giá — tính theo tiền thì họ thấy con số khác Thu mua và QLDA, rất dễ tranh cãi số liệu.

**3. Khối lượng đối chiếu qua SỐ THỨ TỰ DÒNG, không qua tên vật tư.**
Dòng PO trỏ về `sttDongDeNghi`; dòng nhận hàng trỏ về `sttDongPO`. Nhờ vậy tính được "còn lại bao nhiêu" dù ver 1 chưa có mã vật tư.

## Nơi khác không được tự tính lại

Nếu một màn hình cần con số nào, **gọi hàm ở đây** — đừng tự cộng trừ trong file giao diện. Có hai chỗ cùng tính một con số là chắc chắn sẽ lệch nhau về sau.
