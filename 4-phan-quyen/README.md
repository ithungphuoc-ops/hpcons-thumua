# 4 — PHÂN QUYỀN

**Ai được làm gì, ai được xem gì.** Đặc biệt: ai được xem giá.

## Các file

| File | Việc |
|---|---|
| **`quyen.ts`** | Định nghĩa cấp quyền, **công thức theo chức danh** (`tinhQuyenTheoChucDanh`), `tinhQuyen` (công thức + quyền riêng đã gộp), `quyenRiengConHieuLuc(banGhi, nd, oDeMau)` — 🔴 **tham số mẫu BẮT BUỘC** (truyền `null` tường minh khi không cần mẫu, B-F1), `ngoaiLeConHieuLuc` (ngoại lệ đang giữ của một bản ghi), ★ 07/10/2026 **chín cờ "Xem bước quy trình"** (`xemBuocTiepNhan`…`xemBuocThatBai`; `O_XEM_BUOC`, `duocXemBuoc`, `vaoDuocBangQuyTrinh` — cổng `/de-nghi*` + mục menu, `hoSoDuocXemTheoBuoc`, `lyDoKhongXemBuoc`, `poDuocXemTheoBuoc`; thay cờ `xemQuyTrinhTuBuocLapDon` đã bỏ), và các tài khoản mẫu để chạy thử (`VAI_TRO_MAU`, 13 tài khoản — thêm NV Nhân sự `nhansu`, NV Kho tổng `khotong` ngày 06/10/2026) |
| **`vai-tro-chuan.ts`** | **11 chức danh chuẩn** gán được trên màn Phân quyền (`VAI_TRO_CHUAN`), `vaiTroGanDuocBoi`, `vaiTroKhopVoiHoSo` (gắn nhãn chức danh cho hồ sơ — cũng là hàm khớp **mẫu chức danh**), `quyenCuaVaiTro`. Phiên tích hợp nạp tệp này — giữ chữ ký. ★ 06/10/2026: **bỏ `VIEC_TREN_BANG_DOI_CHIEU`** (dòng bảng mẫu nay chỉ một nguồn `CO_TICK_DUOC`); sửa mô tả Thủ kho / NV Kho tổng (bỏ "xác nhận nhập kho" — sau GĐ1 là việc của thu mua) |
| **`nguoi-dung-hien-tai.tsx`** | Giữ vai trò đang dùng; ở bản chạy thử thì đổi được trên Header. ★ 06/10/2026 (gói D): chế độ mẫu gộp quyền từ **kho demo** (`layKhoDemo`, chỉ tạo khi `CHE_DO === "mau"`) vào tài khoản mẫu → menu / nút / tầng ghi đổi theo bảng mẫu demo; chế độ `sso` **đọc lại quyền của chính mình** khi tab hiện lại và ngay sau khi chính mình lưu phân quyền (`yeuCauDocLaiQuyenCuaToi`, D-F2) — đọc lại lỗi thì GIỮ quyền đang có, mẫu hỏng thì chặn như lúc vào app (luật ở `ketQuaDocLaiQuyen`). Khối đăng nhập SSO / `docCheDo` của phiên tích hợp không đổi |
| **`luat-phan-quyen.ts`** | **Ai được đổi quyền của ai, tới cấp nào** — luật của màn "Phân quyền người dùng". Có cả `vuongMacTraoQuyen` (ai được tick quyền riêng cho ai), ★ `coQuyenPhanQuyen` và `duocSuaMauChucDanh` (ai sửa được bảng mẫu — B-F3, 06/10/2026; một chỗ, `mau-chuc-danh.ts` và `tinh-luu-phan-quyen.ts` nạp từ đây), ★ `lyDoKhongBatCoKhiTick` (khoá chiều BẬT ở khối tick — D-F3, cùng thân luật ⑤) |
| **`quyen-rieng.ts`** | ★ 26/09/2026 — **Quyền tick riêng từng người**: ô tick (`CO_TICK_DUOC`, nhãn đổi 06/10/2026; ★ 07/10/2026 **27 ô** = 18 cũ + 9 ô **"Xem bước quy trình"** nối cuối, nhóm thứ hai; `KHOA_XEM_BUOC`, `MO_TA_NHOM_XEM_BUOC`), `apDungQuyenRieng`, ghép phần thay đổi. ★ 06/10/2026: **khuôn ngoại lệ** (`chuanHoaBanGhiQuyenRieng`, `quyenRiengHieuLuc` đọc được cả khuôn cũ — `gocCu`/`coODeMau` bắt buộc, `rutNgoaiLe`, `ngoaiLeCuaBanGhi` = ô đang ghim, một chỗ suy ra), áp mẫu (`quyenTheoChucDanhCoMau`, `DONG_KHOA_MAU`). ★ 07/10/2026: dấu **`coOXemBuoc`** + **luật 8 / 8b** (`oBuocChoDuLieuCu`, `laKtQldaLuatCu0710`) cho dữ liệu cũ. Hàm thuần, chỉ `import type` từ `quyen.ts` |
| **`mau-chuc-danh.ts`** | ★ 06/10/2026 — **Mẫu quyền theo chức danh sửa được**: đọc tài liệu mẫu (`docMauChucDanh` — kèm dấu vết `phienBanMau`, B-F8; `chuanHoaMauChucDanh` — ★ 07/10 luật 8 / 8b cho mẫu không dấu, kết quả luôn mang dấu), ô khoá (`lyDoOKhoaMau`), **ai sửa được ô nào** (`lyDoKhongSuaOMau` — Câu 2 = B, một chỗ), leo quyền qua gán chức danh (`danhSachLeoQuyenQuaGanChucDanh`), `phienBanCuuMauHong` (B-F9), hai dòng ghi chú G1/G2, ô phụ thuộc (`phuThuocCuaO`), câu chỉ đạo + cảnh báo (`CHI_DAO_THEO_DONG`, `canhBaoChiDaoKhiDoiMau` — ★ 07/10 thêm ô bước cho Thủ kho / PTC; `canhBaoViecKhongAiLam` — ★ 07/10 thêm cặp việc–bước; `CAU_XEM_BUOC_THIEU_GIA`, `canhBaoXemBuocKhiThieuGia`), ảnh hưởng theo TỪNG Ô (`anhHuongKhiDoiMau`), mô tả chức danh sinh từ quyền thật. Hàm thuần |
| **`tinh-luu-phan-quyen.ts`** | ★ 06/10/2026 — **Một phép tính lưu cho cả máy chủ lẫn kho demo**: `tinhLuuQuyenRieng` (tick / bỏ quyền riêng → ghi khuôn 2 kèm `phienBanMau`, xoá, giữ nguyên; GIỮ ngoại lệ không bị chạm — B-F2), `tinhLuuMauChucDanh`, `tinhVeMacDinhMauToanBo`, `tinhCuuMauHong` (B-F9), `ganQuyenRiengHieuLuc`, export lại `coQuyenPhanQuyen` / `duocSuaMauChucDanh`, mã `hanhDong` nhật ký. ★ 07/10/2026: mọi bản ghi / mẫu ghi ra mang `coOXemBuoc: true`; đã gỡ chốt 409 của nhịp 1. Không nạp Firebase / React |
| `quyen-rieng-ket-noi.ts` | ★ 26/09/2026 — Gọi `/api/quyen-rieng` từ trình duyệt (đọc của mình · đọc tất cả · danh sách người bị khoá · lưu nhiều người). ★ 06/10/2026: hàm gọi chung `goiMayChuPhanQuyen` (trả kèm `maLoi`: `mau-doi` · `ban-cu` · `mau-hong`); `?tatCa=1` đọc thêm **mẫu** (`chuanHoaKetQuaTatCa` — thiếu mẫu hoặc **một bản ghi hỏng = lỗi cả lượt**, không bỏ qua); mọi lần lưu gửi **`phienBanMau`**; thêm `boQuyenRieng`; `ketQuaDocLaiQuyen` (luật đọc lại giữa phiên, D-F2) |
| `mau-chuc-danh-ket-noi.ts` | ★ 06/10/2026 — Gọi `POST /api/quyen-mau-chuc-danh`: `luuMauChucDanh(phienBan, thayDoi)` · `veMacDinhMauToanBo(phienBan?)` (bỏ `phienBan` CHỈ ở đường cứu mẫu hỏng) |
| `nguon-phan-quyen.ts` | ★ 06/10/2026 — **Một nguồn cho màn Phân quyền**: `layNguonPhanQuyen` chọn máy chủ thật (`sso`) hay **kho demo** (`3-du-lieu/kho-phan-quyen-demo.ts`, chế độ tài khoản mẫu). Ở demo `ganVaiTro` trả câu lý do (không đổi chức danh) |
| `dung-nguoi-khong-vao-app.ts` | ★ 26/09/2026 — Hook `useNguoiKhongVaoApp`: ai đang bị bỏ "Vào app" để danh sách Giao việc lọc ra (bộ nhớ 60 giây, lỗi thì không lọc + báo) |
| `xem-buoc-ho-so.ts` | ★ 07/10/2026 — Hook `useXemBuocHoSo()` cho ô tick **"Xem bước quy trình"**: `giaiDoanCua(prId)` · `duocXemHoSo(prId)` · `lyDoKhongXemHoSo(prId)` · `duocXemPO(po)` — các màn ngoài bảng (Tổng quan · Việc của tôi · Lịch · chuông · ô tìm · Phân bổ) hỏi "hồ sơ này có hiện không". Chỉ NỐI dữ liệu: bước do `boTraGiaiDoanTheoId` (`2-quy-trinh/giai-doan-mua-hang.ts`, bộ đệm lười), luật do `quyen.ts` (`duocXemBuoc` · `vaoDuocBangQuyTrinh` · `hoSoDuocXemTheoBuoc` · `lyDoKhongXemBuoc` · `poDuocXemTheoBuoc`). Chỉ ẩn hiển thị, không phải bảo mật |
| `dung-danh-ba.ts` · `quyen-theo-ho-so.ts` | Tra danh bạ nhân sự và suy quyền từ hồ sơ máy chủ |

### ★ Phân quyền tick chọn (Sếp 26/09/2026)

Sếp: *"khi chọn nhân viên A thì sẽ hiện 1 list quyền bên cạnh, a giao cho quyền gì thì chỉ cần tick zô là được"* · *"được chọn nhiều người cùng lúc"* · trưởng bộ phận là người tick.

- **Ba lớp (từ 06/10/2026):** công thức theo chức danh (gán qua `/api/phan-quyen`, vẫn quyết định danh sách Giao việc) → `tinhQuyenTheoChucDanh`; **mẫu chức danh** Sếp tick trên bảng (`quyen-mau-chuc-danh/chung`, xem mục "Mẫu chức danh sửa được" bên dưới); **ngoại lệ riêng** từng người (`tm_quyen_rieng/{mã Firebase}`, ghi qua `/api/quyen-rieng`). **Máy chủ gộp sẵn** mẫu + ngoại lệ thành đủ ô hiệu lực (`KHOA_TICK` — 27 ô từ 07/10/2026).
- 🔴 **Chưa tick riêng = giữ nguyên quyền theo MẪU chức danh** (công thức cộng ô Sếp sửa ở bảng mẫu; mẫu trống = y hệt công thức — không ai mất quyền khi deploy). ★ **Sếp chốt 26/09/2026: *"Tạm giữ theo chức danh"*** — chưa chuyển "mặc định trắng". Muốn chuyển thì phải đóng băng quyền hiện tại của mọi người vào `tm_quyen_rieng` TRƯỚC — xem chú thích `canGhiQuyenRieng`.
- `tinhQuyen(u)` = `apDungQuyenRieng(tinhQuyenTheoChucDanh(u), u.quyenRieng, …)`, với `u.quyenRieng` là **đủ ô hiệu lực (27) đã gộp mẫu + ngoại lệ** (máy chủ trả; `null` = chức danh không có ô đè và người đó không có ngoại lệ). Gắn vào `NguoiDung.quyenRieng` để tầng ghi `3-du-lieu/kho-du-lieu.tsx` (tự gọi `tinhQuyen(nguoiDung)`) cùng nhận quyền tick.
- Quản trị không tự khoá được · tài khoản "Ngừng truy cập" không mở lại được bằng tick · bỏ "Vào app" là mất hết.
- Chống leo quyền: chỉ trao được cờ mình đang có; "Xoá đề nghị" (`xoaToanBoDuLieu`) chỉ Quản trị trao. Bài kiểm hai chiều ở `kiem-luat-dung-chung.mjs` (khối "PHÂN QUYỀN TICK CHỌN").

#### Sửa theo soát chéo 26/09/2026

- 🔴 **Không đọc được quyền riêng lúc tải trang = KHÔNG cho vào app** (thử lại 1 lần). Chỉ khi máy chủ trả lời được `quyenRieng: null` mới là "chưa tick → theo chức danh". Đúng luật "thiếu thông tin thì quyền THẤP NHẤT" (CLAUDE.md §3.6c). Hệ quả: cửa `/api/quyen-rieng` chết là mọi người trừ Quản trị/owner không vào được.
- 🔴 **"Phân quyền người dùng" KHÔNG tick được** — luôn theo chức danh (`laQuanTri || capTM >= 3`). Lý do: `app/api/phan-quyen` (phiên tích hợp) gác gán chức danh theo CẤP, không đọc quyền tick; bỏ tick chỉ ẩn màn hình. Cùng lý do, **"Vào app" của người cấp ≥ 3 không bỏ được**. Muốn thu hồi thì hạ chức danh.
- 🔴 **Dấu chức danh** (`theoChucDanh`, route ghi từ hồ sơ máy chủ): khi chức danh đã đổi so với lúc lưu, bản quyền riêng cũ chỉ mang sang **những cờ đã bị bỏ thật** (`quyenRiengHieuLuc`, dùng qua `quyenRiengConHieuLuc` ở `quyen.ts`). Khuôn 1 (18 ô cũ): `ra[k] = goc[k] && !(gocCu[k] && rieng[k] !== true)`; khuôn 2 (ngoại lệ, từ 06/10/2026): `ra[k] = goc[k] && ngoaiLe[k] !== false` — **chỉ ô `false` được mang sang, không bao giờ ô `true`**. Hạ chức danh là hạ thật; nâng chức danh được đủ cờ mới của chức danh mới; cờ từng tick thêm vượt chức danh cũ không mang sang; không lách được "chỉ trao cờ mình có" bằng đổi chức danh vòng. Bản ghi **thiếu dấu** (hoặc dấu sai khuôn, kể cả `capKho` sai) → nhánh an toàn `goc[k] && rieng[k]`. `goc` từ 06/10/2026 là công thức **cộng mẫu chức danh**.
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

- **Ba quyền theo từng hồ sơ** ở `quyen-theo-ho-so.ts` — xác nhận nhận đủ hàng (`duocXacNhanNhanDuHangCuaHoSo`), ghi nhận giao hàng nhánh phòng ban (`duocGhiNhanGiaoHangCuaHoSo`), ghi dấu đối chiếu (`duocGhiDoiChieuThuMua`) — nay đòi thêm ô tick **"Làm việc thu mua" (`lapPO`; nhãn cũ trước 06/10/2026 là "Lập đơn mua hàng")** qua `tickChoLamThuMua`. Chọn `lapPO` vì nhánh đó hỏi *"người này có đang LÀM thu mua không"*; KHÔNG chọn `xacNhanKho` (Sếp 17/09 đã gỡ cờ kho khỏi luật xác nhận) hay `ghiPhieuNhanHang` (cờ thủ kho — dùng nó là cả phòng thu mua mất quyền). **Người chưa có quyền riêng: không xét, kết quả y hệt trước** (bài kiểm so với luật cũ trên mọi chức danh chuẩn). Chữ ký hàm KHÔNG đổi — điều kiện tính từ `nguoiDung.quyenRieng` mà `useNguoiDung()` đã gắn sẵn (một nơi gọi nằm ở `de-nghi-chi-tiet.tsx`), nên không sửa nơi gọi nào, kể cả `kho-du-lieu.tsx`.
- **Danh sách "Giao việc cho ai"** (`bang-phan-bo.tsx` → `nhanVienThuMua`): người đang bị bỏ "Vào app" bị lọc ra, qua hook `dung-nguoi-khong-vao-app.ts` ← `/api/quyen-rieng?biKhoa=1` (máy chủ tính bằng `nguoiBiKhoaVaoApp`, chỉ trả danh sách mã; người có `phanBoCongViec` hoặc quyền phân quyền đọc được). Bộ nhớ 60 giây, màn Phân quyền bỏ bộ nhớ ngay sau khi lưu. ⚠️ **Lỗi đọc → không lọc ai (fail-open) + báo một lần** — cố ý: lọc sót chỉ làm một việc bị giao cho người không mở app được (thấy ngay, giao lại được); chặn cả danh sách thì cả phòng không giao được việc. **Loại việc nhận được vẫn theo chức danh** — tick thêm không biến QLDA thành người nhận việc.

#### ⚠️ Giới hạn còn lại — chờ Sếp quyết

- **Người phụ trách tự sửa đơn của mình** (`kho-du-lieu.tsx` → `suaDonHang`, so `nguoiPhuTrachUid`) chưa theo ô tick — vùng đó đang có phiên khác sửa nên chưa đụng.
- **(H) Script di trú sang project riêng của phiên tích hợp chưa chép `tm_quyen_rieng`.** Ngày chuyển project mà không chép collection này thì mọi quyền riêng đã lưu mất — mọi người về "theo chức danh". Phải báo phiên tích hợp thêm collection này vào danh sách chép.

### ★ Mẫu chức danh sửa được — Sếp 06/10/2026

**Bốn câu Sếp chốt** (kế hoạch phân quyền 06/10/2026, mục 6):
- **Câu 1 = A** — bấm thẳng vào bảng "chức danh nào mặc định làm được gì" để đổi mẫu cho cả chức danh, áp luôn cho người được gán chức danh đó về sau.
- **Câu 2 = B** — cả Trưởng bộ phận sửa được bảng mẫu, giới hạn ở **cột của chức danh mình gán được** và **dòng (cờ) mình đang có**. Quản trị sửa mọi ô không khoá. ✅ Sếp xác nhận thêm 06/10/2026 *"Giữ vậy"*: dòng cờ Trưởng BP không có thì khoá **cả bật lẫn tắt** (khác khối tick từng người — chỉ khoá chiều bật).
- **Không buộc "Xem công nợ" đi kèm "Xem giá"** — Sếp 06/10/2026 *"Không bắt buộc"* (hỏi: người được tick "Xem công nợ" mà không có "Xem giá" vẫn thấy số tiền ở màn Công nợ — có buộc hai ô đi kèm không?). Hai ô độc lập; đừng thêm ràng buộc khi chưa có chỉ đạo mới.
- **Câu 3 = A** — người đã có quyền riêng chỉ giữ những ô cố ý tick khác; ô còn lại theo mẫu mới.
- **Câu 4 = B** — duyệt hoàn thành đơn giao thiếu, bắt buộc ghi lý do (tầng ghi, không ở thư mục này).

**Thứ tự áp:** công thức (`tinhQuyenTheoChucDanh`) → mẫu chức danh (bỏ mọi ô khoá — `quyenTheoChucDanhCoMau`) → ngoại lệ riêng (`quyenRiengHieuLuc`) → các chốt ①–⑥ của `apDungQuyenRieng` (giữ nguyên). Máy chủ gộp sẵn rồi trả đủ ô (27 từ 07/10/2026).

**Lưu ở đâu:** tài liệu `quyen-mau-chuc-danh/chung` (không tiền tố `tm_`, chỉ Admin SDK ghi): `{ khuon: 1, phienBan, de: { [chức danh]: { [ô]: bool } }, capNhat… }`. `de` **chỉ chứa ô khác công thức** — đặt về đúng công thức là xoá ô (bắt buộc: hàm khớp chức danh không so `capKho`). **Tài liệu chưa có (và không bản ghi nào mang `phienBanMau ≥ 1`) = mẫu trống bản 0 = y hệt trước 06/10/2026.** Đọc hỏng (khuôn lạ, giá trị không phải boolean ở ô đã biết, **ô lạ mang giá trị khác `true`** — B-F5, **mẫu vắng mà còn dấu vết** — B-F8) → **báo lỗi**, không rơi về công thức; ô lạ mang `true` / ô khoá / ô trùng công thức → bỏ kèm cảnh báo (`docMauChucDanh` → `chuanHoaMauChucDanh`).

**Ô khoá** (máy chủ từ chối kể cả Quản trị — `lyDoOKhoaMau`): cột Quản trị · cột Ngừng truy cập · dòng "Vào app Thu mua" · dòng "Xoá đề nghị". Hai dòng ghi chú không tick được (`DONG_GHI_CHU_MAU`): **G1** Phân quyền · Nhật ký hệ thống · Cài đặt quy trình (theo cấp ≥ 3 hoặc Quản trị) và **G2** Xác nhận nhận hàng bước ⑥ (luật cố định 17/09/2026). Giá trị hai dòng tính bằng chính hàm luật, không chép tay.

**Ai sửa được ô nào** — `lyDoKhongSuaOMau`, **một hàm** cho cả màn hình lẫn máy chủ:
- 🔴 **Chỉ hai loại người được sửa bảng mẫu** (B-F3, Sếp *"Quản trị sửa tất"* + *"Cả Trưởng BP"*): `vaiTro === "admin"` HOẶC hồ sơ **khớp chức danh** Trưởng bộ phận Thu mua (`vaiTroKhopVoiHoSo`) — `duocSuaMauChucDanh` ở `luat-phan-quyen.ts`. Hồ sơ cấp 3/4 "Tùy chỉnh" (vd kế toán cấp 3) có quyền phân quyền (tick riêng) nhưng **không** sửa được mẫu.
- Quản trị: mọi ô không khoá.
- Trưởng BP: chỉ cột trong `vaiTroGanDuocBoi(capDatDuocToiDa(nguoiGoi))` (= NVTM, Kế toán, Thủ kho, NV Nhân sự, NV Kho tổng, Phòng Thi công, QLDA) — 🔴 **không** viết cứng `vaiTroGanDuocBoi(3)`, nếu không cột Trưởng BP lọt vào và Trưởng BP tự sửa mẫu của chính mình. Và chỉ dòng mình có, **khoá cả hai chiều** (bật lẫn tắt) — cách hiểu câu *"chỉ các cờ mình có"*; muốn nới chỉ chặn chiều bật thì sửa đúng dòng ⑤ trong hàm đó. Hệ quả: Trưởng BP không sửa được "Đính / bổ sung phiếu giao nhận", "Vào Theo dõi đơn hàng (kho)", "Xoá đề nghị" ở bất kỳ cột nào.
- "Cờ mình có" là quyền **hiệu lực đã gộp mẫu** của người sửa (`ganQuyenRiengHieuLuc`).

**Leo quyền qua gán chức danh** (`danhSachLeoQuyenQuaGanChucDanh`): ô cột Trưởng BP gán được đang nhận cờ (nhờ mẫu) mà cột Trưởng BP không có — trừ cờ công thức đã cho sẵn (vd "Đính phiếu" của Thủ kho); xét cả khi chỉ bớt cờ ở cột Trưởng BP. ★ **B-F4 (Sếp *"Quản trị sửa tất"*): Quản trị KHÔNG bị chặn** — các ô đó thành **cảnh báo** trong hộp xác nhận. Trưởng BP: chặn (400) **chỉ ô leo quyền MỚI sinh ở lần lưu đó** — ca biên Trưởng BP có cờ nhờ ngoại lệ riêng bật cho cả cột; ô Quản trị đã chấp nhận không làm Trưởng BP kẹt. *(Bổ sung đặc tả ghi "không cần chặn thêm" cho Trưởng BP — chỗ chặn ca biên này chặt hơn, là một nhánh `else` trong `tinhLuuMauChucDanh` nếu cần bỏ.)* ⚠️ Chỗ hở còn lại ở `/api/phan-quyen` (vùng cấm): phải nhắn phiên tích hợp.

**Khuôn ngoại lệ `tm_quyen_rieng` + di trú:**
- Khuôn 2 (ghi từ 06/10/2026): `{ khuon: 2, ngoaiLe: {chỉ ô cố ý khác}, theoChucDanh (bắt buộc), quyen: {đủ ô `KHOA_TICK` — chỉ cho bản mã cũ khi rollback}, phienBanMau (bản mẫu lúc lưu — B-F8), coOXemBuoc: true (từ 07/10/2026), capNhat… }`. Ngoại lệ rỗng → **xoá tài liệu**, không cất `{}`.
- Khuôn 1 (cũ, 18 ô — không bao giờ có ô bước) **chuyển ngay khi đọc**, không ghi lại kho: ngoại lệ ngầm = ô khác **công thức** tại dấu lúc lưu. Chính xác vì công thức `tinhQuyenTheoChucDanh` không đổi từ `278f775` (đo lại 06/10/2026 bằng `git diff 278f775 HEAD`). Bản ghi thiếu dấu → luật hẹp như cũ. Lần lưu sau có chạm người đó (và kết quả khác) thì ghi lại thành khuôn 2.
- Nút **"Bỏ quyền riêng — về theo chức danh"** = xoá bản ghi, vẫn phải qua `vuongMacTraoQuyen` (xoá bản đã bỏ ô là trao lại cờ đó).
- Đọc tài liệu chỉ qua `chuanHoaBanGhiQuyenRieng`: khuôn 2 kiểm **chặt** (khoá lạ / không boolean / thiếu dấu → `null` → route ném lỗi), khuôn 1 lờ khoá lạ như cũ.

**Tab cũ:** mọi lần lưu (mẫu hoặc quyền riêng) gửi kèm `phienBan` của mẫu trang đang giữ; lệch → **409 `mau-doi`** (không có gì được ghi). **Lịch sử:** mỗi lần lưu ghi một dòng vào Nhật ký hệ thống (`hanhDong` tiền tố `phan_quyen_`, câu do `tinhLuuQuyenRieng` / `tinhLuuMauChucDanh` sinh, ≤ 1000 ký tự, không có tên nhà cung cấp).

#### ★ Sửa lõi sau phản biện — bổ sung đặc tả 06/10/2026 (B-F1 … B-F10)

- **B-F1** `quyenRiengConHieuLuc(banGhi, nd, oDeMau)` / `quyenRiengHieuLuc(…, gocCu, coODeMau)`: tham số mẫu **bắt buộc** — quên truyền là bỏ qua mẫu = rộng quyền, TypeScript không báo khi tham số tuỳ chọn. Bài kiểm quét mã: mọi lời gọi đủ đối số.
- **B-F2** Lưu tick: **giữ ngoại lệ không bị chạm** (kể cả khi đang trùng mẫu); ô vừa chạm = `goc` thì bỏ khỏi ngoại lệ. Dấu lệch / thiếu dấu / bỏ "Vào app" giữ luật cũ (`rutNgoaiLe`). Dấu "(khác chức danh)" trên màn: `k in ngoaiLeConHieuLuc(…).ngoaiLe`.
- **B-F5** Đọc mẫu: ô **lạ** (cột lạ / khoá lạ) mang giá trị khác `true` = **hỏng**; ô lạ `true` và ô **khoá** (giá trị gì cũng vậy) = bỏ kèm cảnh báo.
- **B-F6** `anhHuongKhiDoiMau` đếm theo **từng ô**: `doi[].soNguoi`, `doi[].soGiuNgoaiLe` (người giữ ngoại lệ đúng ô đó); đã bỏ số theo cột.
- **B-F7** Thứ tự kiểm mọi phép lưu: **quyền → `phienBan` → khuôn → từng ô / từng người**.
- **B-F8** Bản ghi khuôn 2 ghi `phienBanMau`. Đọc mẫu qua `docMauChucDanh(raw, banGhiDaDoc)`: mẫu **vắng** mà có bản ghi `phienBanMau ≥ 1` → **hỏng** (không phải mẫu trống). ⚠️ Mẫu bị xoá khi chưa có bản khuôn 2 nào mang `phienBanMau ≥ 1` thì không phát hiện được bằng dấu vết này.
- **B-F9** Cứu mẫu hỏng (`tinhCuuMauHong`, chỉ Quản trị — xác định KHÔNG qua mẫu): `phienBan = max(phienBan thô + 1, số giây epoch lúc cứu)` → chỉ tăng, tab cũ giữ số nhỏ vẫn bị 409.
- **B-F10** Mô tả ô nói đúng việc thật (Xem giá có In đơn mua hàng; Giao việc bỏ "xoá dòng mặt hàng · tick việc bắt buộc" — chưa Sếp chốt cờ; Làm việc thu mua bỏ câu "rút khỏi việc thu mua"; Đính phiếu có "ghi nhận giao hàng ở hồ sơ phòng ban"; G2 "cũng từ cấp 2"). `phuThuocCuaO`: Tạo đề nghị cần "Vào màn làm việc Thu mua" (nhãn trước 07/10/2026: "Vào Quy trình mua hàng"), Xoá đề nghị cần Phân quyền (Cài đặt quy trình). `CHI_DAO_THEO_DONG` thêm Xem giá / Xem NCC — **trích nguyên văn câu luật trong `quyen.ts`, không ghi ngày** (mã không có ngày); bật hai dòng này cho Thủ kho / Phòng Thi công (khi công thức không có) → cảnh báo trong hộp xác nhận.
- Bài kiểm: 10 bài "B-F1 … B-F10" cuối khối mẫu chức danh trong `kiem-luat-dung-chung.mjs`.

#### ★★ Ô tick "Xem bước quy trình" — NHỊP 2 (Sếp 07/10/2026)

Sếp: *"Điều chỉnh này thành chức năng phân quyền, và được tick chọn cho xem bước nào"*. Đặc tả + bổ sung + phản biện ở scratchpad phiên 07/10 (`xb2-*.md`); tóm tắt luật đã vào mã:

- **9 ô** `xemBuocTiepNhan` … `xemBuocThatBai` (thứ tự ①…⑨, `KHOA_XEM_BUOC`) **nối cuối** `CO_TICK_DUOC`, nhóm **"Xem bước quy trình"** (nhóm thứ hai của `NHOM_QUYEN_TICK`). Nhãn ô viết cứng, trùng `O_XEM_BUOC[ma].nhan` (`quyen.ts`). Có ít nhất một ô thì vào được `/de-nghi*` (`vaoDuocBangQuyTrinh`).
- Ô `xemQuyTrinhMuaHang` đổi nhãn **"Vào màn làm việc Thu mua"**: chỉ còn mở 5 màn (Tổng quan · Việc của tôi · Lịch · Theo dõi đơn hàng · Danh mục NCC), **không mở bảng**. Câu chỉ đạo 16/08 vẫn gắn ở dòng đó (`CHI_DAO_THEO_DONG.xemQuyTrinhMuaHang`).
- **Dấu `coOXemBuoc: true`** trên mọi bản ghi khuôn 2 và tài liệu mẫu ghi từ nhịp 2 (`tinhLuuQuyenRieng`, `tinhLuuMauChucDanh`, `tinhVeMacDinhMauToanBo`, `tinhCuuMauHong`); `chuanHoaMauChucDanh` trả kết quả LUÔN mang dấu; `MAU_TRONG` mang dấu; `chuanHoaBanGhiQuyenRieng` đọc dấu (trình duyệt cũng phải có — màn Phân quyền tự tính hiệu lực).
- **Luật 8 / 8b — CHỈ cho dữ liệu KHÔNG dấu** (ghi trước 07/10/2026): ô "Vào màn làm việc" đang **ghim** `true` → 9 ô bước BẬT (8b); ghim `false` → 9 ô TẮT (8), riêng Kế toán / QLDA (luật cũ sáng 07/10, `laKtQldaLuatCu0710`) chỉ TẮT ②③; không ghim → theo chức danh + mẫu. Áp ở `ngoaiLeCuaBanGhi` (ngoại lệ riêng — xét trên NGUỒN, không trên kết quả đã lọc) và `chuanHoaMauChucDanh` (ô mẫu — chỉ điền ô khác công thức, một câu cảnh báo mỗi cột). **Không áp cho công thức.** Nguyên tắc: khi lên bản **không ai mất, không ai được thêm** quyền xem bảng. Dữ liệu có dấu: hai loại ô **độc lập**.
- **Khuôn 1** (bản ghi thật 18 khoá): ô bước **vắng không thành ô "đã bỏ"** (sửa lỗi N1 — trước đó cả phòng mất bảng); khoá CŨ vắng vẫn là tắt như trước.
- **Đã gỡ nhịp 1**: `KHOA_XEM_BUOC_SAP_CO`, trường đọc `oBanSau`, nhánh ③a "giữ ô bản sau" trong `chuanHoaMauChucDanh`, chốt 409 trong `tinhLuuQuyenRieng`, nhánh khoan dung trong `chuanHoaKetQuaTatCa`. **Giữ** dấu (`DAU_CO_O_XEM_BUOC`).
- **Cảnh báo (chỉ báo, không chặn):** bật ô bước nhờ mẫu cho cột Thủ kho / Phòng Thi công → một câu mỗi cột kèm `CAU_XEM_BUOC_THIEU_GIA` + câu luật giá + câu chỉ đạo 16/08 (`canhBaoChiDaoKhiDoiMau`); tick riêng bật ô bước cho người không có "Xem giá" → `canhBaoXemBuocKhiThieuGia` (màn Phân quyền gọi); không còn chức danh nào (ngoài Quản trị) vừa có việc vừa xem được bước của việc đó → `canhBaoViecKhongAiLam` (cặp việc–bước, bổ sung N-B; chưa áp cho tick riêng).
- **Câu 2 = B không đổi:** Trưởng BP có đủ 9 ô theo công thức nên sửa được ô bước ở các cột mình gán được; cột BGĐ / TBP chỉ Quản trị sửa.
- 🔴 **CẤM Instant Rollback lùi qua nhịp 1** sau khi nhịp 2 đã lên — xem `thumua-v1/README.md`.
- ⚠️ Đây là **ẩn hiển thị, không phải bảo mật dữ liệu** (dữ liệu chạy thử vẫn tải về trình duyệt — CLAUDE.md §3.6b).
- Bài kiểm: các bài `A-T…` dưới dòng ⟦MỐC A⟧ trong khối mẫu chức danh của `kiem-luat-dung-chung.mjs` (+ các bài cũ đã đổi số cứng 18 → `KHOA_TICK.length`).

**Nhãn 18 ô đổi 06/10/2026** (không đổi khoá): `lapPO` → "Làm việc thu mua" · `taoPoDoiLap` → "Xác nhận khớp PO chờ đề nghị" · `ghiPhieuNhanHang` → "Đính / bổ sung phiếu giao nhận" · `xacNhanKho` → "Vào Theo dõi đơn hàng (kho)" · `xacNhanTruongBP` → "Duyệt báo giá & hoàn thành đơn, hồ sơ" · `phanBoCongViec` → "Giao việc" · `xoaToanBoDuLieu` → "Xoá đề nghị".

**Bài kiểm:** khối "PHÂN QUYỀN GĐ3 + GĐ3.5 + GĐ4a — Sếp 06/10/2026" trong `kiem-luat-dung-chung.mjs` (15 bài, gồm ảnh chụp ma trận 11 × 29 khoá công thức — 20 cờ trước 07/10/2026, khuôn 1 mẫu trống y hệt công thức cũ, lệch dấu chỉ mang ô `false`, Câu 2 = B, leo quyền — nay Quản trị chỉ bị cảnh báo theo B-F4, 409) + 10 bài B-F1 … B-F10 (mục dưới).

⚠️ **Giới hạn của bản demo (chế độ tài khoản mẫu):** luật lưu chạy đúng hai hàm thuần như máy chủ, nhưng giao dịch Firestore, 401/403 thật, nhật ký Firestore, rules và việc đổi chức danh **không** chứng minh được trên demo — phải thử trên bản thật với tài khoản Quản trị và Trưởng BP. Mẫu mới có hiệu lực từ **lần tải trang kế tiếp hoặc khi người đó quay lại tab** (D-F2).

#### ★ Giao diện + demo (gói D, 06/10/2026)

- **Màn Phân quyền** (`1-giao-dien/trang/phan-quyen.tsx`) đọc / ghi qua `nguon-phan-quyen.ts`. Quyền gốc mọi chỗ = công thức + **mẫu** (`quyenTheoChucDanhCoMau` / `quyenCuaVaiTroCoMau`), người gọi tính như máy chủ (`ganQuyenRiengHieuLuc` với mẫu đang cất). Lọc theo **chức danh** (11 chức danh · "Tùy chỉnh" · "Chưa có quyền ở app Thu mua"). Nút **"Bỏ quyền riêng — về theo chức danh"** thay "Áp mẫu theo chức danh". Ô người đó giữ riêng hiện **"(khác chức danh)"** (`k in ngoaiLe`). Hai bản nháp (tick từng người · bảng mẫu) **loại trừ nhau** khi lưu. 409 `mau-doi` → báo, bỏ nháp, đọc lại.
- **Khối tick từng người khoá chiều BẬT** ngay tại ô cho cờ người tick không có — `lyDoKhongBatCoKhiTick` ở `luat-phan-quyen.ts`, cùng thân luật ⑤ của `vuongMacTraoQuyen` (D-F3). TẮT luôn được. **Bảng mẫu khoá cả hai chiều** (`lyDoKhongSuaOMau` ⑤) — màn hình nói rõ khác biệt này.
- **Bảng mẫu** (`1-giao-dien/thanh-phan-nghiep-vu/bang-mau-chuc-danh.tsx`): ô khoá bấm vào báo lý do; ô khác mặc định gốc có viền; ô nháp nền xanh; ô phụ thuộc (`phuThuocCuaO`) mờ kèm chữ khi cột thiếu ô cần; đầu cột "N người · M có quyền riêng" (bấm = lọc khối Nhân sự); hộp xác nhận chạy thử `tinhLuuMauChucDanh`, hiện cảnh báo, ảnh hưởng **theo từng ô** và câu chỉ đạo `CHI_DAO_THEO_DONG`. Mẫu hỏng: chỉ Quản trị thấy nút cứu.
- **Kho demo** (`3-du-lieu/kho-phan-quyen-demo.ts`, chỉ chế độ mẫu): `taoKhoDemo("sso")` **ném**; một kho cho cả app (`layKhoDemo`); mọi thao tác đọc lại localStorage → sửa → ghi; tự dựng người gọi từ `VAI_TRO_MAU` + dữ liệu của nó; lưu bằng **đúng** `tinhLuuQuyenRieng` / `tinhLuuMauChucDanh`; mẫu / bản ghi hỏng → quyền hẹp nhất (Quản trị vẫn vào cứu). Demo không đổi chức danh.
- Bài kiểm: khối "GÓI D — GIAO DIỆN + DEMO" cuối `kiem-luat-dung-chung.mjs`.

### Màn "Phân quyền người dùng" (thêm 18/08/2026)

Ban lãnh đạo yêu cầu *"thêm tính năng phân quyền cho tài khoản quản trị và tài khoản trưởng bộ phận"*.

- Màn hình: `1-giao-dien/trang/phan-quyen.tsx` · địa chỉ `/phan-quyen`
- Luật ai-sửa-được-ai: **`luat-phan-quyen.ts`** (một chỗ duy nhất — màn hình và tầng ghi đều hỏi nó)
- Mặc định: Quản trị (4) đặt được tới cấp **4**; Trưởng bộ phận (3) đặt được tới cấp **2**. Không ai tự sửa hồ sơ của chính mình.

📌 **Đổi chức danh đi qua máy chủ:** `/api/phan-quyen` (phiên tích hợp — vùng cấm) ghi hồ sơ `nguoi-dung/{uid}` bằng **Admin SDK** (`ghiHoSoNguoiDungMayChu`), tự kiểm lại luật ở `luat-phan-quyen.ts`. Trình duyệt vẫn KHÔNG ghi thẳng được hồ sơ (rules khoá). *(Đoạn trước 06/10/2026 ghi "chưa lưu được lên máy chủ, phải chạy `tao-tai-khoan.js`" — đã cũ.)*

## Cấp quyền — theo đúng chuẩn App Tổng HPcore

| Cấp | Tên | Ý nghĩa |
|---:|---|---|
| 1 | Xem | Chỉ đọc |
| 2 | Nhập liệu | Tạo / sửa dữ liệu của mình |
| 3 | Quản lý | Duyệt, sửa dữ liệu của người khác trong module |
| 4 | Quản trị | Toàn quyền module |

Ở app này cấp nằm trong hồ sơ `nguoi-dung/{uid}.capTM` (đọc/ghi qua `5-ket-noi/ho-so-tai-khoan.ts` và `/api/phan-quyen`). Từ App Tổng app chỉ đọc vai trò toàn cục để biết người đó có phải `owner` không (owner → toàn quyền như Quản trị). *(Dòng cũ "lưu ở `users/{uid}.apps.tm`, đồng bộ token bằng Cloud Function" là thiết kế ban đầu, không phải cách đang chạy — đo lại 06/10/2026 bằng `grep` mã nguồn, không thấy chỗ đọc `apps.tm`.)*

🔴 **1 là thấp nhất, 4 là cao nhất.** Bản app thu mua cũ ghi nhãn **ngược lại** ("Level 1 = Trưởng phòng toàn quyền") — **đừng copy nhãn đó**. Căn cứ: `12. APP TONG HPC/2. OUTPUT/firestore-design/CAU-TRUC-FIRESTORE.md` §2.2.

## Cách dùng trong giao diện

Component **không tự suy cấp bậc**. Nó chỉ hỏi "tôi được làm gì":

```tsx
const { quyen } = useNguoiDung();
if (quyen.xemGia)          { /* hiện khối giá */ }
if (quyen.phanBoCongViec)  { /* hiện nút phân bổ */ }
```

Danh sách quyền (29 cờ, kiểu `Quyen`): `xemDuocApp` · `xemQuyTrinhMuaHang` · `xemMoiHoSo` · `xemGia` · `xemNhaCungCap` · `xemBaoGia` · `xemNguoiPhuTrach` · `xemCongNo` · `taoDeNghi` · `phanBoCongViec` · `lapPO` · `taoPoDoiLap` · `suaPODaChot` · `ghiPhieuNhanHang` · `xacNhanKho` · `xacNhanTruongBP` · `ghiThanhToan` · `xoaToanBoDuLieu` · ★ 9 cờ `xemBuoc…` (07/10/2026) · `phanQuyenNguoiDung` · `xuatHoSo`. 27 cờ tick được (`CO_TICK_DUOC`: 18 cũ + 9 ô bước); `phanQuyenNguoiDung` theo cấp; `xuatHoSo` là cờ chết (không chỗ đọc, không trên bảng). Hỏi "xem được bước nào" thì gọi `duocXemBuoc` / `hoSoDuocXemTheoBuoc` (`quyen.ts`), đừng đọc `quyen.xemBuoc…` tại chỗ vẽ.

Muốn đổi **mặc định** ai được làm gì:
- Đổi cho một chức danh → **Sếp / Quản trị tick trên bảng mẫu** ở màn Phân quyền (từ 06/10/2026, không phải sửa mã).
- Đổi **công thức** trong mã → `tinhQuyenTheoChucDanh` ở `quyen.ts`. 🔴 Đổi công thức là bài kiểm "Ảnh chụp 11 chức danh × 29 cờ" đỏ — phải **di trú `tm_quyen_rieng` khuôn 1 sang khuôn 2 TRƯỚC** (khuôn 1 được chuyển khi đọc dựa vào công thức không đổi).

## Tài khoản mẫu (chỉ dùng ở chế độ tài khoản mẫu — `NEXT_PUBLIC_XAC_THUC` trống / `mau`)

`VAI_TRO_MAU` có **13 tài khoản**: Quản trị · BGĐ · Trưởng BP · 4 NV Thu mua · Kế toán · Thủ kho · Phòng Thi công · QLDA · ★ NV Nhân sự (`nhansu`) · ★ NV Kho tổng (`khotong`) — hai tài khoản cuối thêm 06/10/2026 để demo được hai cột đó của bảng mẫu. Bảng dưới chỉ là ví dụ về giá / NCC:

| Vai trò | Cấp `tm` | Xem giá | Xem NCC |
|---|:---:|:---:|:---:|
| Trưởng bộ phận Thu mua | 3 | ✅ | ✅ |
| Nhân viên Thu mua | 2 | ✅ | ✅ |
| Thủ kho công trình | 1 (+ `kh` 2) | 🔒 ❌ | ✅ |
| NV Nhân sự · NV Kho tổng | 2 | 🔒 ❌ | ❌ |
| Phòng Thi công (người đề nghị) | 1 | 🔒 ❌ | ❌ |
| QLDA | 1 | ✅ | ✅ |

## ⚠️ Điều quan trọng nhất phải hiểu

**Quyền ở đây CHỈ điều khiển giao diện — không phải bảo mật.**

Bảo mật thật nằm ở **Firestore Security Rules** trên HPcore. Nếu chỉ ẩn ở giao diện mà rule cho đọc, thì mở công cụ lập trình của trình duyệt ra là thấy hết.

Đó là lý do đơn giá được tách sang chứng từ riêng `tm_donhang_gia` (xem `3-du-lieu/README.md`) — để rule chặn được thật.

**Việc chưa làm:** viết Security Rules. Phác thảo ở mục 3.7 của `../2. THIET KE/01-DAC-TA-APP-THU-MUA-v0.2.md`.
