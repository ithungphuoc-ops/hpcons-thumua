# 6 — TIỆN ÍCH

Các hàm nhỏ dùng chung. Không chứa nghiệp vụ, không chứa dữ liệu.

| File | Việc | Sửa khi |
|---|---|---|
| **`dinh-dang.ts`** | Định dạng ngày, số, tiền theo kiểu Việt Nam | Ngày hiện sai kiểu, số sai dấu phân cách |
| **`doc-so-tien.ts`** | Đọc số tiền thành chữ (dùng cho chứng từ in) | Đọc sai chữ số |
| **`gop-lop.ts`** | Hàm `cn()` — ghép các lớp CSS, xử lý trùng lặp | Hầu như không bao giờ sửa |

## Ghi chú

- `gop-lop.ts` được **mọi component giao diện** dùng. Sửa file này ảnh hưởng toàn app — cân nhắc kỹ.
- Đây là nơi để hàm **không thuộc nghiệp vụ nào**. Nếu một hàm dính tới quy tắc mua hàng (tính khối lượng, trạng thái, điều kiện hoàn thành) thì **phải đặt ở `2-quy-trinh/`**, không đặt ở đây.
