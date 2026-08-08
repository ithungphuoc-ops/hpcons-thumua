# 6 — TIỆN ÍCH

Các hàm nhỏ dùng chung. Không chứa nghiệp vụ, không chứa dữ liệu.

| File | Việc | Sửa khi |
|---|---|---|
| **`dinh-dang.ts`** | Định dạng ngày, số, tiền theo kiểu Việt Nam | Ngày hiện sai kiểu, số sai dấu phân cách |
| **`doc-so-tien.ts`** | Đọc số tiền thành chữ (dùng cho chứng từ in) | Đọc sai chữ số |
| **`bo-dau.ts`** | Bỏ dấu tiếng Việt để **gõ không dấu vẫn tìm ra** | Gõ "de nghi" không ra "Đề nghị" |
| **`gop-lop.ts`** | Hàm `cn()` — ghép các lớp CSS, xử lý trùng lặp | Hầu như không bao giờ sửa |

## Ghi chú

- `gop-lop.ts` được **mọi component giao diện** dùng. Sửa file này ảnh hưởng toàn app — cân nhắc kỹ.
- `bo-dau.ts` dùng chung cho **danh bạ nhân sự** (`3-du-lieu/danh-ba-nhan-su.ts`) và **ô tìm kiếm hồ sơ** (`2-quy-trinh/tim-kiem.ts`). Trong đó dùng ký hiệu `\p{M}` chứ không viết dải ký tự dấu thô — ký tự thô là dấu vô hình trong mã nguồn, người sau mở file ra không thấy gì và dễ sửa hỏng.
- Đây là nơi để hàm **không thuộc nghiệp vụ nào**. Nếu một hàm dính tới quy tắc mua hàng (tính khối lượng, trạng thái, điều kiện hoàn thành) thì **phải đặt ở `2-quy-trinh/`**, không đặt ở đây.
