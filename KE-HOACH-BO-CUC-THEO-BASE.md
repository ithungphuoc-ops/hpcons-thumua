# KẾ HOẠCH: DỰNG BỐ CỤC TRANG CHI TIẾT GIỐNG BASE

> **Chỉ đạo Ban lãnh đạo 16/08/2026:** *"đây là quy trình thu mua khi mở trên 1 trang, e bố cục
> giống 100% như vậy"* — kèm 4 ảnh chụp trang `workflow.base.vn/job/3898671`.
> **Trạng thái:** chưa bắt đầu. Viết ra để phiên sau làm ngay, khỏi khảo sát lại.
> **File phải sửa chính:** `1-giao-dien/trang/de-nghi-chi-tiet.tsx`

---

## 1. Bố cục Base — đọc từ 4 ảnh

### Cột trái (vùng làm việc)

| # | Khối | Ghi chú |
|---|---|---|
| 1 | Tiêu đề `mã - hợp đồng - CÔNG TRÌNH` + avatar người phụ trách góc phải | app đã có |
| 2 | Dòng meta: Bộ phận · Nhóm đề xuất · Ngày đề nghị cấp · Chi tiết · Link phiếu | app đã có |
| 3 | `Thời hạn trong giai đoạn: Không thời hạn · SLA: 0m` | app **chưa có** |
| 4 | **Thanh 6 bước dạng mũi tên xanh lá liền khối** | app có nhưng khác kiểu |
| 5 | `MÔ TẢ` | app **chưa có** |
| 6 | `TRƯỜNG TUỲ CHỈNH` → `TRƯỜNG DỮ LIỆU KHI NHẬP MỚI` → **ĐẦU VÀO**: `01` Bộ phận · `02` Nhóm đề xuất · `03` Ngày đề nghị cấp · `04` Chi tiết (bảng) · `05` Link phiếu | 🔴 **phần khác biệt lớn nhất** |
| 7 | Khối gập `YÊU CẦU NCC BÁO GIÁ TRÌNH MẪU` → ĐẦU VÀO → `06` SL Báo giá | |
| 8 | Khối gập `XÉT DUYỆT BÁO GIÁ` → `07` Báo giá NCC 1 (PDF) + Preview/Download | |
| 9 | Khối gập `LẬP ĐƠN MUA HÀNG…` → `08` Báo giá được chọn | |
| 10 | Khối gập `TIẾN HÀNH ĐẶT HÀNG` → `12` Đơn mua hàng (PDF) | |
| 11 | Khối gập `DONE` → `13` Các chứng từ giao nhận | |
| 12 | `DANH SÁCH CÔNG VIỆC` (+ nút "Thêm công việc") → nhóm theo giai đoạn | app vừa đổi đúng tên 16/08 |
| 13 | `LIÊN KẾT` (+ nút "Thêm liên kết") | app **chưa có** |
| 14 | Ô thảo luận + `1 thảo luận` | app đã có (khối Bình luận) |

**🔴 Điểm cốt lõi:** mỗi giai đoạn là **một khối gập riêng chứa đúng phần đầu vào của giai đoạn
đó**, và các trường **đánh số liên tục 01 → 13 xuyên suốt cả trang**. App hiện gom theo loại
chứng từ (bảng báo giá, đơn hàng), không gom theo giai đoạn.

### Cột phải

| # | Khối | Ghi chú |
|---|---|---|
| 1 | `Giai đoạn: Hoàn thành` — **nền xanh lá đặc**, có icon ✓ | app có nhưng nền xanh dương |
| 2 | `THÔNG TIN NHIỆM VỤ`: Mã nhiệm vụ · Tạo bởi + lúc · Cập nhật gần nhất · Giai đoạn hiện tại · **Chuyển giai đoạn lúc** · Liên kết với | app thiếu 2 dòng cuối |
| 3 | `NGƯỜI THEO DÕI` — avatar tròn xếp ngang, nút "Thêm nhiều người theo dõi" / "Bỏ theo dõi" | app hiện dạng chữ |
| 4 | `TỔNG THỜI GIAN` — `Đã sử dụng 15.56 của 32.00h` + thanh | app có, đơn vị NGÀY |
| 5 | `TIẾN TRÌNH CỦA CÁC GIAI ĐOẠN` — mỗi bước: số tròn · tên · ngày giờ · thanh · **Kỳ vọng 4.00h / Thực tế 1.36h** · avatar người làm | 🔴 xem mục 3 |
| 6 | `HOẠT ĐỘNG CHÍNH` (gập) | app đã bỏ 15/08 theo chỉ đạo |
| 7 | `LỊCH SỬ HOẠT ĐỘNG` (gập) | app đang để trong khối Trao đổi |

---

## 2. Thứ tự làm (đề nghị)

1. **Khối "Đầu vào theo giai đoạn"** (mục 6–11 cột trái) — phần khác biệt lớn nhất, và cũng là
   thứ Ban lãnh đạo chỉ vào nhiều nhất. Component mới:
   `1-giao-dien/thanh-phan-nghiep-vu/khoi-dau-vao-theo-giai-doan.tsx`
2. Thanh 6 bước kiểu mũi tên liền khối (`thanh-giai-doan.tsx`)
3. Cột phải: đổi khối giai đoạn sang nền xanh lá, thêm 2 dòng thiếu ở Thông tin nhiệm vụ
4. `MÔ TẢ` + `LIÊN KẾT`
5. Người theo dõi dạng avatar tròn (đã có `AnhDaiDienChu` từ 16/08)

---

## 3. 🔴 BA THỨ KHÔNG LÀM GIỐNG ĐƯỢC — phải báo Ban lãnh đạo, đừng hứa

| Base có | Vì sao app không có |
|---|---|
| **Kỳ vọng 4.00h / Thực tế 1.36h** mỗi bước | App **không lưu lịch sử chuyển bước**. Giai đoạn được SUY RA từ chứng từ (`xacDinhGiaiDoan`) — đó là lựa chọn kiến trúc từ đầu, nhờ nó mà thẻ không bao giờ nói sai so với chứng từ. Muốn có con số này phải thêm một mảng mốc chuyển bước vào `DeNghiMuaHang` và ghi ở mọi đường chuyển bước |
| **Chuyển giai đoạn lúc 16:48** | Cùng lý do trên |
| **Avatar ảnh thật** | Chưa có ảnh nhân sự trong hệ thống. Đang dùng chữ tắt (`AnhDaiDienChu`) |

⚠️ Nếu Ban lãnh đạo cần đúng cả ba, phải làm trước việc **lưu mốc chuyển bước** — đó là thay
đổi mô hình dữ liệu, không phải giao diện.

---

## 4. Việc CÒN DANG DỞ, chưa liên quan bố cục

🔴 **Phân bổ đủ người là thẻ TỰ NHẢY sang bước ② dù chưa tích "Checkin hàng tồn kho".**

Ban lãnh đạo 16/08 yêu cầu *"chưa tích xác nhận thì chưa cho chuyển"*. Hiện mới chặn được
đường **kéo thẻ** (hộp chuyển bước khóa nút). Đường **tự nhảy** chưa chặn, vì `xacDinhGiaiDoan`
chỉ xét `daPhanBoDu`, không xét công việc bắt buộc — hàm đó là hàm thuần, không nhận `cauHinh`.

**Cách sửa:** thêm tham số `cauHinh` cho `xacDinhGiaiDoan` và giữ thẻ ở `tiep_nhan` khi công
việc bắt buộc của bước ① chưa xong.
⚠️ **Phải truyền `cauHinh` ở MỌI nơi gọi** — bỏ sót một chỗ là bảng quy trình và trang chi tiết
tính ra hai giai đoạn khác nhau cho cùng một hồ sơ.

---

*Lập ngày 16/08/2026. Xóa file này khi đã làm xong.*
