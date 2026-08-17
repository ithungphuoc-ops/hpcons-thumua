# BẢN ĐỒ MÃ NGUỒN — App Thu mua

> **File này trả lời một câu duy nhất: app lỗi ở chỗ này thì sửa file nào.**
> Không cần biết lập trình vẫn tra được. Mỗi thư mục có `README.md` riêng giải thích chi tiết bên trong.

---

## 1. SÁU THƯ MỤC — MỖI THƯ MỤC MỘT VIỆC

| Thư mục | Chứa gì | Sửa khi nào |
|---|---|---|
| **`1-giao-dien/`** | Mọi thứ người dùng **nhìn thấy** | Sai chữ, sai màu, sai bố cục, thiếu cột, muốn thêm nút |
| **`2-quy-trinh/`** | **Quy tắc nghiệp vụ**: tính toán, trạng thái, điều hướng | Số liệu tính sai, trạng thái sai, muốn thêm/bớt mục trong menu |
| **`3-du-lieu/`** | **Mô hình dữ liệu** + kho dữ liệu + dữ liệu mẫu | Thêm/bớt trường, đổi cấu trúc chứng từ, sửa dữ liệu chạy thử |
| **`4-phan-quyen/`** | **Ai được làm gì, ai được xem gì** | Sai quyền, cần thêm vai trò, chặn/mở việc xem giá |
| **`5-ket-noi/`** | Nối với **HPcore.vn / Firebase** | Đổi cấu hình kết nối, nối dữ liệu thật |
| **`6-tien-ich/`** | Hàm dùng chung nhỏ: định dạng số, ngày, đọc số tiền | Sai định dạng ngày, sai dấu phân cách số |

Thêm một thư mục kỹ thuật **không đổi tên được**:

| Thư mục | Vì sao phải giữ |
|---|---|
| **`app/`** | Next.js lấy **đúng tên thư mục làm địa chỉ URL**. `app/(app)/don-hang/[id]/page.tsx` chính là địa chỉ `/don-hang/po-001`. Đổi tên là đổi địa chỉ web. |

> ✅ **`app/` đã được làm mỏng còn 3 dòng mỗi file** — chỉ là **bảng chỉ đường**, không chứa code màn hình. Code màn hình thật nằm ở `1-giao-dien/trang/`.

---

## 2. TRA NHANH: LỖI Ở ĐÂU → SỬA FILE NÀO

### Giao diện

| Hiện tượng | Sửa file |
|---|---|
| Sai chữ / sai cột ở **Tổng quan** | `1-giao-dien/trang/tong-quan.tsx` |
| Sai ở **danh sách Đề nghị** (cả 2 cách xem) | `1-giao-dien/trang/de-nghi-danh-sach.tsx` |
| Sai ở **màn Nhận đề nghị mới (giả lập)** 🧪 | `1-giao-dien/trang/de-nghi-nhan-moi.tsx` |
| Sai ở **bảng quy trình 8 cột** (thẻ, màu thẻ, chữ trên thẻ, chiều cao cột) | `1-giao-dien/thanh-phan-nghiep-vu/bang-quy-trinh-mua-hang.tsx` |
| **Kéo thả thẻ** chuyển sai bước / báo sai lý do | `2-quy-trinh/giai-doan-mua-hang.ts` → `quyetDinhKeoTha` (**luật**) + `trang/de-nghi-danh-sach.tsx` → `xuLyTha` (**mở hộp xác nhận**) / `thucThiKeoTha` (**làm thật**) |
| **Hộp xác nhận chuyển bước** thiếu cảnh báo / sai chữ | `2-quy-trinh/giai-doan-mua-hang.ts` → `dungXacNhanKeoTha` (nội dung) + `trang/de-nghi-danh-sach.tsx` (hộp thoại) |
| **Chuông thông báo** 🔔 trên Header sai / không hiện | `1-giao-dien/khung-app/nut-thong-bao.tsx` (hiển thị) — nguồn dữ liệu ở `3-du-lieu/kho-du-lieu.tsx` |
| **Nút ⓘ Hướng dẫn bước** (đầu cột bảng quy trình + thanh giai đoạn) sai / không mở | Hộp: `thanh-phan-nghiep-vu/hop-huong-dan-giai-doan.tsx` · **Nội dung chữ**: `2-quy-trinh/huong-dan-giai-doan.ts` (🔴 văn bản nghiệp vụ, chép nguyên văn quy trình công ty — không tự sửa) |
| **Khối "Soát theo ngưỡng giá trị"** ở màn báo giá sai số / sai lời nhắc | Hiển thị: `thanh-phan-nghiep-vu/khoi-nguong-gia-tri.tsx` · **Luật**: `2-quy-trinh/nguong-gia-tri.ts` |
| Sai ở **chi tiết Đề nghị** | `1-giao-dien/trang/de-nghi-chi-tiet.tsx` |
| Sai ở **màn Phân bổ công việc** | `1-giao-dien/trang/phan-bo.tsx` + `thanh-phan-nghiep-vu/bang-phan-bo.tsx` |
| Sai ở **danh sách Đơn hàng** | `1-giao-dien/trang/don-hang-danh-sach.tsx` |
| Sai ở **chi tiết Đơn hàng** | `1-giao-dien/trang/don-hang-chi-tiet.tsx` |
| Sai ở **bảng tiến độ nhận hàng** (cột theo từng lần giao) | `thanh-phan-nghiep-vu/bang-tien-do-po.tsx` |
| 🔴 Sai ở **phần NHẬP LIỆU đơn mua hàng** (khối thông tin 3 cột, hai khối dưới, thanh nút Hủy / Cất / Cất và In, hai nút Excel, ô cảnh báo "Chưa cất được đơn") | `1-giao-dien/thanh-phan-nghiep-vu/form-lap-don-mua-hang.tsx` — **MỘT FORM DÙNG CHUNG CHO HAI CHỖ** (từ 17/08/2026), bám màn "Đơn mua hàng" của MISA. 🔴 **Tuyệt đối không chép ruột form ra hai bản** cho hai bố cục: hai bản chép tay sẽ lệch nhau sau vài lần sửa |
| **Không thấy phần nhập liệu đơn mua hàng ở bước ④** trong trang chi tiết đề nghị | Chỗ nhúng: `1-giao-dien/trang/de-nghi-chi-tiet.tsx`, giai đoạn `lap_don_mua_hang` → `noiDungNghiepVu`. Điều kiện hiện: `quyen.lapPO && !hoSoDaDong` (chỉ đạo 17/08/2026 *"chỉ ai được cấp quyền thì mới xem được phần nhập liệu đó"* — dùng đúng cờ `lapPO`, **không bịa cờ mới**). ⚠️ Không thấy thì kiểm `apps.tm ≥ 2` và hồ sơ chưa đóng, chứ đừng sửa giao diện |
| **Gõ nửa cái đơn rồi gập khối bước là mất sạch** | `thanh-phan-nghiep-vu/khoi-dau-vao-theo-giai-doan.tsx` → `giuNoiDungKhiGap`. Bước ④ **bắt buộc bật cờ này**: mặc định khối gập THÁO nội dung khỏi cây React nên mọi ô đang gõ biến mất, còn làm các chốt "chỉ điền sẵn một lần" chạy lại và ghi đè số người dùng đã sửa tay |
| Sai ở **trang riêng Lập đơn mua hàng** `/don-hang/tao-moi` (breadcrumb, tiêu đề, điều hướng sau khi cất, đọc tham số `prId`/`rfqId`/`nccId`) | `1-giao-dien/trang/don-hang-lap-moi.tsx` — từ 17/08/2026 **chỉ còn là cái vỏ mỏng** bọc `FormLapDonMuaHang`. 🔴 **KHÔNG bỏ trang này**: nó là đường DUY NHẤT của chức năng tách PO theo phân bổ báo giá (chỉ nó nhận `rfqId` + `nccId` từ `bao-gia-chi-tiet.tsx`), và bảng quy trình cũng mở nó qua `quyetDinhKeoTha` → `mo_trang` |
| Sai ở **bảng "Hàng tiền"** của màn lập đơn (cột, thứ tự cột, dòng TỔNG CỘNG, nút Thêm dòng / Thêm ghi chú / Xóa hết dòng) | `thanh-phan-nghiep-vu/bang-hang-tien.tsx`. 🔴 Con số tiền **không tính ở đó** — sửa công thức thì vào `2-quy-trinh/tinh-toan.ts` → `tinhTienChiTiet` |
| **Nhập Excel vào màn lập đơn** báo sai / bỏ sót dòng | Đọc file: `2-quy-trinh/doc-don-hang-excel.ts` (khớp cột theo TÊN tiêu đề, trả `dongLoi` kèm **số dòng thật trong file**) · Hộp xem trước: `thanh-phan-nghiep-vu/hop-xem-truoc-nhap-excel.tsx` · Đổ vào bảng: `thanh-phan-nghiep-vu/form-lap-don-mua-hang.tsx` → `doVaoBang` |
| **Trang IN đơn mua hàng A4** sai bố cục / thiếu ô so với biểu mẫu giấy | `1-giao-dien/trang/don-hang-in.tsx` — địa chỉ `/in/don-hang/[id]` |
| **File Excel xuất ra lệch biểu mẫu** (nút "Xuất Excel" ở chi tiết đơn hàng) | `2-quy-trinh/xuat-don-hang-excel.ts` — bố cục ô đọc từ XML biểu mẫu thật, xem mục "Ba file Excel" trong `2-quy-trinh/README.md` |
| **Nút "Xuất Excel" bị khóa** | `2-quy-trinh/xuat-don-hang-excel.ts` → `vuongMacXuatPO` (thường là chưa có đơn giá) |
| **Ô tìm kiếm** trên thanh trên không ra kết quả / ra sai | Giao diện: `khung-app/o-tim-kiem.tsx` · **Luật tìm và lọc quyền**: `2-quy-trinh/tim-kiem.ts` |
| **Khối "Người theo dõi"** sai / không thêm được người | `thanh-phan-nghiep-vu/khoi-nguoi-theo-doi.tsx` + danh sách người chọn ở `3-du-lieu/danh-ba-nhan-su.ts` |
| **Khối "Đã tách thành N đề xuất con"** — gập/mở, danh sách phiếu con, bảng "Ai đang làm phần nào" | `thanh-phan-nghiep-vu/khoi-de-xuat-con.tsx` (bọc `bang-nang-luc-theo-nhan-vien.tsx`). Quan hệ cha–con dựa trên `DeNghiMuaHang.deNghiGocId`, **không dựa vào tên** |
| **Sửa "SL Báo giá"** ở phần ĐẦU VÀO bước ② | Ô sửa: `thanh-phan-nghiep-vu/o-sua-so-bao-gia.tsx` · Ghi dữ liệu: `3-du-lieu/kho-du-lieu.tsx` → `datSoBaoGiaChoPhieu` (đặt cho **mọi dòng** của phiếu). Muốn mỗi dòng một số khác nhau thì sửa ở bảng Phân bổ công việc |
| 🔴 **"Không lập được bảng báo giá đầu tiên"** / mất đường vào module Báo giá | Đường vào là **menu ⋯ trên thẻ** ở bảng quy trình → *Lập bảng báo giá* (`thanh-phan-nghiep-vu/bang-quy-trinh-mua-hang.tsx` → `ThaoTacThe.onLapBaoGia`, nối ở `trang/de-nghi-danh-sach.tsx`). **Nút ở trang chi tiết đã bỏ 17/08/2026** theo chỉ đạo Ban lãnh đạo. Đường thứ hai là kéo thẻ cột ① → ②, nhưng **điện thoại không kéo được** nên mục menu là lối vào duy nhất trên điện thoại — bỏ nó là module thành mồ côi (mục 3.4b). ⚠️ Mục menu gọi `xuLyTha` chứ không gọi thẳng `taoBaoGiaGiaLap`, để vẫn qua chốt `quyetDinhKeoTha` và vẫn mở hộp xác nhận |
| Sai ở **màn Theo dõi đề nghị** (cho Phòng Thi công) | `1-giao-dien/trang/theo-doi-danh-sach.tsx` · `theo-doi-chi-tiet.tsx` |
| Sai ở **danh sách Báo giá** | `1-giao-dien/trang/bao-gia-danh-sach.tsx` |
| Sai ở **bảng so sánh giá nhà cung cấp** | `1-giao-dien/trang/bao-gia-chi-tiet.tsx` |
| Sai ở **màn Công nợ** (KPI · biểu đồ tuổi nợ · bảng hóa đơn) | `1-giao-dien/trang/cong-no.tsx` |
| Sai **thanh bên / menu** | `1-giao-dien/khung-app/thanh-ben-noi-dung.tsx` |
| Sai **thanh trên** (tìm kiếm, ngày giờ, tài khoản) | `1-giao-dien/khung-app/thanh-tren.tsx` |
| Sai **thanh dưới trên điện thoại** | `1-giao-dien/khung-app/thanh-duoi-mobile.tsx` |
| **Khoảng trắng** quá rộng / quá chật | `app/globals.css` (khối "MẬT ĐỘ HIỂN THỊ") + `khung-app/mat-do.tsx` |
| Sai **màu** | `app/globals.css` (khối token V1.1) — **không sửa màu trong file component** |
| **Màu chủ đạo** (bảng chọn màu 🎨 trên Header) sai / muốn thêm màu | `app/globals.css` (khối "MÀU CHỦ ĐẠO") + `khung-app/mau-chu-dao.tsx` + `khung-app/nut-mau-chu-dao.tsx` |
| **Bảng quy trình không sổ hết chiều cao** màn hình (còn trống phía dưới) | Chuỗi `flex-1` phải liền mạch: `khung-app/khung-tong.tsx` → `trang/de-nghi-danh-sach.tsx` → `bang-quy-trinh-mua-hang.tsx`. Đứt một mắt là bảng co lại |

### Nghiệp vụ và số liệu

| Hiện tượng | Sửa file |
|---|---|
| **Tính sai khối lượng đã nhận / còn lại / %** | `2-quy-trinh/tinh-toan.ts` |
| Sai **chữ trạng thái** hoặc **màu trạng thái** | `2-quy-trinh/trang-thai.ts` |
| Thiếu / thừa **mục trong menu**, hoặc **sai nhóm** (Quan trọng / Quy trình thu mua / Quản trị) | `2-quy-trinh/dieu-huong.ts` — mục ở `MUC_DIEU_HUONG`, nhãn nhóm ở `NHAN_NHOM_MENU`, thứ tự nhóm ở `THU_TU_NHOM`. Nhóm **chỉ để xếp cho dễ tìm, không ảnh hưởng quyền**; nhóm rỗng tự biến mất chứ không để tiêu đề trơ. 🔴 **KHÔNG cắt danh sách ở `khung-app/thanh-duoi-mobile.tsx`**; trước 11/08/2026 chỗ đó có `.slice(0,5)` nên thêm mục thứ 6 là âm thầm mất một mục trên điện thoại |
| **Lịch công việc** thiếu/thừa việc, sai ngày, hiện việc của người khác | Luật: `2-quy-trinh/lich-cong-viec.ts` → `dungLichCuaToi` · Giao diện: `1-giao-dien/trang/lich-cong-viec.tsx` |
| **Ghi chú trên lịch** mất, hoặc người khác đọc được | `3-du-lieu/ghi-chu-ca-nhan.ts` — lưu theo `uid` trong localStorage, **riêng tư tuyệt đối** (Sếp chốt 11/08/2026) |
| **"Sao không thấy Phân bổ / Đơn đặt hàng / Báo giá trong menu?"** | Xem mục 2b ngay dưới đây — **cố ý bỏ, không phải mất** |
| Sai **điều kiện hoàn thành PO** (4 lớp: giao đủ · phiếu giao nhận · kho · trưởng BP) | `2-quy-trinh/tinh-toan.ts` → `poDuDieuKienHoanThanh` |
| **Thủ kho không bấm được "xác nhận đã nhận đủ"** / bấm được khi lẽ ra không nên | `2-quy-trinh/tinh-toan.ts` → `vuongMacXacNhanKho` (**luật**) · nút ở `trang/don-hang-chi-tiet.tsx` |
| **Đính kèm tệp** không lưu / không mở xem lại được | Kho tệp: `3-du-lieu/kho-tep.ts` (cửa vào) → `kho-tep-firestore.ts` (**chỗ cất thật từ 12/08/2026**, cắt mảnh base64 vì Firestore chỉ cho 1MB/tài liệu) · ô giao diện dùng chung: `thanh-phan-dung-chung/o-dinh-kem-tep.tsx`. ⚠️ `npm run dev` **ngắt khỏi Firebase** nên ở máy lập trình việc đẩy tệp lên sẽ báo lỗi — đó là đúng, phải kiểm trên bản chạy |
| **Không đính kèm được tệp vào một BƯỚC** của quy trình (bước ② báo giá, hợp đồng, hóa đơn NCC…) | Giao diện: `thanh-phan-nghiep-vu/khu-dinh-kem-giai-doan.tsx` (một khu dùng chung cho **cả 6 bước**, nối vào ở `trang/de-nghi-chi-tiet.tsx` qua prop `khuDinhKem`) · Ghi dữ liệu: `3-du-lieu/kho-du-lieu.tsx` → `themTepGiaiDoan` / `goTepGiaiDoan` · Trường: `DeNghiMuaHang.tepGiaiDoan` (khóa = mã giai đoạn). 🔴 **KHÁC `taiLieu`** — `taiLieu` là hồ sơ đầu vào nộp lúc lập phiếu, `tepGiaiDoan` là chứng từ phát sinh trong từng bước, **đừng gộp**. Ban lãnh đạo 17/08/2026 |
| **Không ghi chú được cho một tệp đính kèm**, hoặc ghi chú lưu rồi mà không hiện ra | Giao diện: `thanh-phan-nghiep-vu/khu-dinh-kem-giai-doan.tsx` (nút `NotebookPen` trên từng dòng tệp + hộp "Ghi chú cho tệp") · Ghi dữ liệu: `3-du-lieu/kho-du-lieu.tsx` → `datGhiChuTepGiaiDoan` · Trường: `MoTaTep.ghiChu` ở `3-du-lieu/kho-tep.ts` · Giới hạn 200 ký tự: `DAI_TOI_DA_GHI_CHU_TEP` (**một chỗ duy nhất**, giao diện chỉ đọc lại). 🔴 **Ghi chú KHÔNG phải trang trí** — app không đổi được tên tệp, ảnh tải từ Zalo mang tên máy sinh `1785921139635_…jpg`, nên ghi chú là **nhãn người đọc được** để ba tháng sau còn tra ra đâu là báo giá, đâu là hóa đơn. Hiện **chữ in nghiêng** dưới tên tệp và có cả trong `aria-label` của dòng. Ban lãnh đạo 17/08/2026 |
| **Bấm tên tệp không xem được** / nút tải về sai tên tệp | Một chỗ duy nhất cho cả 5 nơi có tệp: `thanh-phan-dung-chung/lien-ket-tep.tsx` (dòng bấm được) + `hop-xem-tep.tsx` (pop-up căn giữa). Ảnh xem bằng `<img>`, PDF bằng `<iframe>`, Word/Excel **nói thẳng là không xem trước được** thay vì mở ra trang trắng |
| **Đề nghị nằm sai cột** trên bảng quy trình, hoặc sai chữ "Quá hạn / Còn N ngày" | `2-quy-trinh/giai-doan-mua-hang.ts` |
| Sai **phân nhóm tuổi nợ 30-60-90** hoặc **mức rủi ro NCC** | `2-quy-trinh/tuoi-no.ts` |
| Sai **ô "giá thấp nhất"** hoặc **tổng theo NCC** ở bảng so sánh báo giá | `2-quy-trinh/so-sanh-bao-gia.ts` |
| Sai **số báo giá tối thiểu** / **ai duyệt** / **ngưỡng 5–10–20 triệu** | **Luật**: `2-quy-trinh/nguong-gia-tri.ts` — nơi duy nhất đọc ba con số này, đừng viết số vào file khác. **Số thì sửa trên giao diện** ở `/cai-dat-quy-trinh` (từ 13/08/2026), mặc định nằm ở `2-quy-trinh/cau-hinh-quy-trinh.ts` → `CAU_HINH_MAC_DINH`. 🔴 Câu nhắc phải **sinh từ cấu hình** (`chuTien()`), viết cứng "5 triệu" là app xét một đằng nói một nẻo |
| **Trang Cài đặt quy trình** sai / lưu không ăn / mất số vừa lưu | Giao diện: `1-giao-dien/trang/cai-dat-quy-trinh.tsx` · Kiểu + kiểm tra chéo: `2-quy-trinh/cau-hinh-quy-trinh.ts` → `loiCauHinh` · Lưu: `3-du-lieu/kho-du-lieu.tsx` → `luuCauHinhQuyTrinh`. 🔴 **Mất số vừa lưu thì xem `3-du-lieu/luu-tren-may.ts` → `docDuLieuDaLuu`** — hàm đó dựng lại dữ liệu theo **danh sách trắng**, quên khai khóa mới là dữ liệu biến mất **không một dòng lỗi** |
| **Tên đề nghị** tự dựng sai / phòng khác cũng bị dựng tên | `2-quy-trinh/dat-ten-de-nghi.ts` — công thức `mã - hợp đồng, CÔNG TRÌNH`, hiện **chỉ áp cho Phòng Thi công** (`coCongThucTuDong`). Không đổi tên hồi tố phiếu cũ |
| **Nhân bản / tách phiếu** sai mã, mất liên kết cha–con | `2-quy-trinh/nhan-ban-de-nghi.ts` — `maBanSaoTiepTheo` (thêm `(copy)` vào **mã**, không phải tiêu đề) · `phieuGocCua` (cha–con theo **id**, chỉ **một cấp**) |
| Sai **tên / mã phòng ban** | `3-du-lieu/danh-muc-phong-ban.ts` — 16 phòng ban, một chỗ duy nhất, sẵn để nối App Tổng. Kiểu mở (`MaPhongBan = string`) nên App Tổng thêm phòng mới **không làm hỏng build** |
| **Đề xuất NCC của nhân viên** lẫn với **lý do chốt của trưởng bộ phận** | Hai trường **cố ý tách**: `deXuatNCC*` + `lyDoDeXuat` (nhân viên, bước ②) vs `lyDoChonNCC` (trưởng bộ phận, bước ③) — xem `3-du-lieu/kieu-du-lieu.ts` → `BaoGia`. Gộp lại là mất tiếng nói của người đi hỏi giá |
| Sai **chiết khấu · thuế GTGT · tổng tiền thanh toán** của đơn hàng | `2-quy-trinh/tinh-toan.ts` → `tinhTienChiTiet` (**nơi duy nhất** tính; `tinhKhoiTongTien`, `tinhTienDonHang`, `tongGiaTriPO` đều gọi vào đây, màn lập đơn / màn xem / trang in đều dùng chung) |
| **Cột tiền cộng lại không khớp dòng TỔNG CỘNG** | `2-quy-trinh/tinh-toan.ts` → `chiaTheoTyLe` (dồn phần dư vào dòng cuối có trọng số, nên cột luôn cộng đúng bằng tổng) |
| Đơn **trộn nhiều mức thuế** (8% + 10%) in ra sai thuế suất | `2-quy-trinh/tinh-toan.ts` → `moTaThueSuat` + cờ `nhieuMucThue`. 🔴 Không được in thẳng `thueSuatGTGT` khi cờ bật |
| **Nhập Excel không nhận cột / lấy nhầm cột** | `2-quy-trinh/doc-don-hang-excel.ts` → `CACH_VIET_COT` (khớp theo TÊN tiêu đề, không theo vị trí). Thêm cách viết mới thì thêm vào bảng đó |
| Sai **số tiền viết bằng chữ** | `6-tien-ich/doc-so-tien.ts` |
| Vai trò **tìm ra hồ sơ lẽ ra không được thấy** | `2-quy-trinh/tim-kiem.ts` — mọi loại hồ sơ mới đều phải khai quyền ở đây |

### Dữ liệu

| Hiện tượng | Sửa file |
|---|---|
| Cần **thêm/bớt trường** của Đề nghị, PO, Phiếu nhận hàng | `3-du-lieu/kieu-du-lieu.ts` |
| Cần đổi **dữ liệu chạy thử** | `3-du-lieu/du-lieu-mau.ts` |
| Thao tác **phân bổ / ghi phiếu nhận / xác nhận** không lưu | `3-du-lieu/kho-du-lieu.tsx` |
| **Nhật ký "Lịch sử"** thiếu dòng / ghi sai người thực hiện | `3-du-lieu/kho-du-lieu.tsx` → `ghiLichSuDeNghi` (mỗi thao tác ghi dữ liệu đều phải gọi) |
| **Chuông thông báo** không báo khi chuyển bước / báo sai | `3-du-lieu/kho-du-lieu.tsx` → khối "THÔNG BÁO CHUYỂN BƯỚC" (so bước trước/sau) + hiển thị ở `khung-app/nut-thong-bao.tsx` |
| Cần **chuyển việc** cho nhân viên khác | `3-du-lieu/kho-du-lieu.tsx` → `chuyenViecDong` + nút ở `thanh-phan-nghiep-vu/bang-phan-bo.tsx`. ⚠️ Bước "Nhận công tác" **đã bỏ hẳn 12/08/2026** — trưởng phòng giao việc thì chắc chắn phải làm, không cần bấm xác nhận |
| Sai **số người theo dõi** trên thẻ bảng quy trình | `3-du-lieu/du-lieu-mau.ts` (trường `nguoiTheoDoi`) + hiển thị ở `bang-quy-trinh-mua-hang.tsx` |
| **Nhận đề nghị giả lập báo "hết chỗ"**, hoặc bấm thẻ mới ra trang 404 | `3-du-lieu/du-lieu-mau.ts` → `ID_DE_NGHI_GIA_LAP` (12 id khai sẵn). Tăng số lượng thì phải build lại |

### Phân quyền

| Hiện tượng | Sửa file |
|---|---|
| Vai trò **thấy giá mà không được thấy** (hoặc ngược lại) | `4-phan-quyen/quyen.ts` → `tinhQuyen` |
| Cần **thêm vai trò** để chạy thử | `4-phan-quyen/quyen.ts` → `VAI_TRO_MAU` |
| Đổi vai trò trên Header không ăn | `4-phan-quyen/nguoi-dung-hien-tai.tsx` |

### Kết nối

| Hiện tượng | Sửa file |
|---|---|
| Nối Firebase / HPcore | `5-ket-noi/firebase/cau-hinh.ts` + file `.env.local` |
| Phân quyền **ở tầng dữ liệu** (ai đọc được đơn giá, báo giá, công nợ) | `5-ket-noi/firestore.rules` — 🔴 **bản nháp, chưa deploy, và KHÔNG được deploy đè** lên rules của App Tổng |

---

## 2b. BA MÀN HÌNH KHÔNG CÒN TRONG MENU — VẪN CHẠY, CHỈ ĐỔI LỐI VÀO

Chỉ đạo Ban lãnh đạo **06/08/2026**: việc nào đã nằm trong **bảng quy trình 8 cột** ở `/de-nghi`
thì không để thành mục menu riêng nữa. Vào bằng **thẻ trên bảng**, tra bằng **mã hồ sơ lấy từ Đề nghị**.

| Màn hình | Địa chỉ vẫn chạy | Vào bằng đường nào |
|---|---|---|
| Phân bổ công việc | `/phan-bo` | `/de-nghi/[id]` — bảng phân bổ nằm ngay trong trang. Thẻ trên bảng Kanban cũng cảnh báo "Thiếu N dòng chưa phân bổ" |
| Báo giá & so sánh NCC | `/bao-gia` · `/bao-gia/[id]` | `/de-nghi/[id]` — khối **"Bảng báo giá"** |
| Đơn đặt hàng | `/don-hang` · `/don-hang/[id]` | `/de-nghi/[id]` — khối **"Đơn đặt hàng đã tách"** |

🔴 **Không được xóa khối "Bảng báo giá" trong `de-nghi-chi-tiet.tsx`** — đó là lối vào **duy nhất**
tới module Báo giá sau khi bỏ menu. Xóa là module thành mồ côi, không ai vào được.

**Muốn trả một mục về menu:** thêm lại vào mảng `MUC_DIEU_HUONG` trong `2-quy-trinh/dieu-huong.ts`.
Không phải dựng lại gì, màn hình còn nguyên.

✅ **Ô tìm kiếm trên thanh trên ĐÃ CHẠY** (làm ngày 08/08/2026, phiên 05) — đây chính là đường vào
thay cho 3 mục menu trên. Tìm theo **mã hồ sơ · tên công trình · tên và mã vật tư**, gõ không dấu
vẫn ra. Kết quả **lọc theo quyền**: vai trò không được xem báo giá thì không tìm thấy bảng báo giá.

⚠️ **Ô tìm kiếm bị ẩn dưới bề ngang 640px** (`hidden sm:block`, có từ trước). Trên điện thoại
hiện **chưa có** đường vào tra mã hồ sơ — cần làm nút mở ô tìm kiếm cho mobile.

---

## 3. HAI QUY TẮC BẮT BUỘC KHI SỬA

**1. Không sửa `1-giao-dien/nen-tang-ui/`.**
Đó là **thư viện ngoài** (shadcn/ui). Sửa vào đó là mất hết khi cập nhật thư viện. Cần khác đi thì sửa ở lớp trên (`thanh-phan-dung-chung/` hoặc `thanh-phan-nghiep-vu/`).

**2. Không viết cứng màu và khoảng cách trong component.**
Màu lấy từ token trong `app/globals.css` (vd `bg-primary`, `text-success-soft`).
Khoảng cách lấy từ biến mật độ (vd `p-(--hp-md-pad)`, `gap-(--hp-md-section)`).
Viết cứng `#096AA7` hay `p-6` là **sai quy chuẩn** — đây đúng là lỗi mà bản `thumua-next` cũ đã mắc.

---

## 4. LUỒNG DỮ LIỆU ĐI QUA CÁC THƯ MỤC

```
      3-du-lieu/du-lieu-mau.ts          (dữ liệu thô — sau này là Firestore)
                 │
                 ▼
      3-du-lieu/kho-du-lieu.tsx         (kho dữ liệu + các thao tác ghi)
                 │
                 ├──────────────► 4-phan-quyen/quyen.ts   (lọc: vai trò này thấy gì)
                 │                          │
                 ▼                          ▼
      2-quy-trinh/tinh-toan.ts        (tính đã nhận · còn lại · % · màu)
                 │
                 ▼
      1-giao-dien/trang/*.tsx          (màn hình hiển thị)
                 │
                 ▼
      app/(app)/*/page.tsx             (bảng chỉ đường → URL)
```

**Đọc bảng này từ dưới lên là cách gỡ lỗi nhanh nhất:** thấy số sai trên màn hình → không phải lỗi giao diện → lên `2-quy-trinh/tinh-toan.ts` xem công thức → vẫn đúng thì xuống `3-du-lieu/` xem dữ liệu vào.

---

## 5. CÁC FILE Ở THƯ MỤC GỐC

| File | Việc |
|---|---|
| `README.md` | Hướng dẫn chạy app, 6 màn hình, 3 điểm cốt lõi |
| `BAN-DO-MA-NGUON.md` | File này |
| `app/globals.css` | **Token màu V1.1 + mật độ hiển thị** — file quan trọng nhất về giao diện |
| `package.json` | Danh sách thư viện + các lệnh (`dev`, `verify`) |
| `next.config.ts` · `tsconfig.json` · `eslint.config.mjs` · `postcss.config.mjs` | Cấu hình kỹ thuật, hiếm khi sửa |
| `components.json` | Cấu hình thư viện shadcn (đã trỏ đúng thư mục mới) |
| `.env.local.example` | Mẫu khai cấu hình Firebase |
| `firebase.json` | **CHỈ còn Firestore rules.** Không có hosting — app chạy trên Vercel |

### 🌐 Phát hành: Vercel, không phải Firebase

`npm run deploy` = `npx --yes vercel --prod`, đẩy thẳng từ máy, không qua GitHub. Chi tiết ở [CLAUDE.md mục 6.3](../CLAUDE.md).

📌 **Cache do Vercel lo, không còn luật `headers` nào phải canh.** Trước 11/08/2026 dự án chạy Firebase Hosting và `firebase.json` có khối `headers` với một cái bẫy: `cleanUrls: true` biến địa chỉ thành `/de-nghi` (không đuôi `.html`) nên luật bắt theo đuôi tệp không khớp gì cả → HTML rơi về `max-age=3600`, deploy xong phải chờ tới **1 tiếng** mới thấy bản mới. Bỏ hosting là hết luôn loại lỗi này.

---

*Lập ngày 05/08/2026. Cấu trúc này sắp xếp theo yêu cầu của Ban lãnh đạo: mỗi thư mục chỉ chứa code của một việc, đặt tên rõ nghĩa để người vào sau tự tra được.*
