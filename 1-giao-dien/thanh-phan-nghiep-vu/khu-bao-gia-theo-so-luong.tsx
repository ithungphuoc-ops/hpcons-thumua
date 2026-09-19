"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Lock, LockOpen, Plus, Undo2, X } from "lucide-react";
import { ODinhKemTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { useDuLieu, TOI_DA_TEP_MOI_BUOC } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  BUOC_DINH_KEM_BAO_GIA,
  chiSoOBaoGia,
  KHOA_BO_QUA_SO_SANH,
  khoaLyDoBoQuaBaoGia,
  lyDoBoQuaBaoGia,
  lyDoBoQuaSoSanh,
  nhanOBaoGia,
  NHAN_O_SO_SANH,
  soBanBaoGiaThat,
  soBaoGiaCanCo,
  soOBaoGia,
  soSanhBaoGiaBatBuoc,
  tenNCCCuaO,
  tepBaoGiaDaCo,
  tepSoSanh,
  vuongMacTrinhXetDuyet,
} from "@/2-quy-trinh/bao-gia-dinh-kem";
import type { DeNghiMuaHang, MoTaTep } from "@/3-du-lieu/kieu-du-lieu";

/*
 * 📌 KHÓA `KHOA_BO_QUA_SO_SANH` và hàm đọc `lyDoBoQuaSoSanh` **đã dời sang
 * `2-quy-trinh/bao-gia-dinh-kem.ts`** ngày 14/09/2026 và nay được `import` ở đầu tệp — đúng
 * CLAUDE.md §3.4b (không để luật nghiệp vụ trong file giao diện).
 *
 * 🔴 VÌ SAO PHẢI DỜI, KHÔNG PHẢI CHO ĐẸP THƯ MỤC: khi khóa còn nằm ở đây thì
 * `vuongMacTrinhXetDuyet` không đọc được nó, nên bấm “Không cần đính kèm” chỉ tắt cảnh báo tại ô
 * mà cổng chuyển bước vẫn khóa — nút hứa một việc app không làm (§3.5). Nay cổng đọc chính khóa
 * đó nên hai bên không thể lệch nữa; lịch sử đầy đủ ghi tại chỗ khai báo mới.
 */

/**
 * Giá trị đánh dấu hộp “ghi lý do” đang hỏi cho ô **Bảng so sánh**, thay vì cho ô báo giá số mấy.
 *
 * 📌 Cố ý nhét vào chung state `hoiBoQuaO` (`number | typeof O_SO_SANH | null`) chứ không mở một
 * state + một `HopXacNhan` thứ hai: hai hộp thoại song song thì hai ô “Lý do” trùng `id`, và mỗi
 * lần đổi chữ trong hộp phải nhớ sửa cả hai chỗ — rồi sẽ lệch.
 */
const O_SO_SANH = "bang-so-sanh";

/**
 * ★ KHU ĐÍNH KÈM BÁO GIÁ — **số ô bằng đúng SL Báo giá đã yêu cầu**.
 *
 * 🔴 Ban lãnh đạo 20/08/2026: *"khi yêu cầu 2 báo giá thì phải có 2 mục đính kèm báo giá, và đó
 * là quy tắc bắt buộc để được chuyển bước"*.
 *
 * ## VÌ SAO KHÔNG DÙNG `KhuDinhKemGiaiDoan` NHƯ TRƯỚC
 * Khu đó là **một danh sách tệp không tên**. Nó không trả lời được câu *"đã có mấy bản báo giá
 * rồi"*: dán 3 ảnh của cùng một nhà cung cấp cũng thành 3 tệp, mà thực chất vẫn chỉ có một bản
 * báo giá. Không đếm được thì không chặn chuyển bước được.
 *
 * Ô có tên (`Báo giá NCC 1..N`) thì đếm được, và người lập nhìn là biết còn thiếu bản nào.
 *
 * ## 📌 LUẬT NẰM Ở `2-quy-trinh/bao-gia-dinh-kem.ts`
 * Component này chỉ VẼ. Số ô, cách đánh nhãn, và điều kiện chặn chuyển bước đều hỏi bên đó —
 * cùng một hàm mà nút "Trình xét duyệt" hỏi, nên hai chỗ không thể nói khác nhau.
 *
 * ## ⚠️ HAI CHỐT GIỮ TỆP KHÔNG BIẾN MẤT
 * ① Hạ SL Báo giá không được ẩn ô đang giữ tệp (`soOBaoGia` lấy max) — nếu không, tệp vẫn nằm
 *    trong hồ sơ mà không còn ô nào hiện nó ra, người dùng tưởng mất chứng từ.
 * ② Tệp mang nhãn vượt số ô đang vẽ, hoặc không có nhãn nào, đều được liệt kê riêng bên dưới —
 *    không tệp nào vô hình.
 */
export function KhuBaoGiaTheoSoLuong({
  deNghi,
  duocSua,
  khoa = false,
  hienTenNCC = false,
  onDuyetO,
  lyDoKhoa,
  onMoKhoa,
  chanXoaTep = false,
}: {
  deNghi: DeNghiMuaHang;
  /** Cấp quyền có được thêm/gỡ không. Chốt thật ở tầng dữ liệu, cờ này chỉ để không bày nút. */
  duocSua: boolean;
  /** Hồ sơ đã đóng (hoàn thành / đóng dở) — khóa thêm và gỡ, nhưng XEM thì vẫn xem được. */
  khoa?: boolean;
  /**
   * Có được xem / ghi tên nhà cung cấp không — truyền từ `quyen.xemNhaCungCap`.
   *
   * 🔴 GÁC QUYỀN, KHÔNG HIỆN MẶC ĐỊNH. Khối này hiện cho nhiều vai trò, trong đó có vai trò
   * **không được xem nhà cung cấp**. Bày tên NCC ra đây là rò đúng thứ đang bị chặn ở mọi chỗ
   * khác — cùng lý do khối Lịch sử không ghi tên NCC (quy ước CLAUDE.md mục 7).
   * Người không có quyền vẫn thấy nhãn “Báo giá NCC 1”, vẫn đính kèm được, chỉ không thấy tên.
   */
  hienTenNCC?: boolean;
  /**
   * ★ DUYỆT NGAY TRÊN MỘT BẢN BÁO GIÁ — Ban lãnh đạo 20/08/2026: *"bố cục thêm nút Duyệt và khi
   * bấm nút đó thì file sẽ tự chuyển sang bước tiếp theo"*.
   *
   * 🔴 KHÔNG TRUYỀN thì KHÔNG hiện nút. Trang chứa quyết định khi nào được duyệt (đúng bước ③,
   * có quyền trưởng bộ phận, hồ sơ chưa duyệt) — component này chỉ vẽ, không tự đoán quyền.
   *
   * Nhận `chiSoO` (đếm từ 0), `nhanO` để hiện trong hộp xác nhận, và `tenNCCDaGhi` là tên đã lưu
   * ở hồ sơ cũ nếu có (điền sẵn cho đỡ gõ lại).
   */
  /**
   * ⚠️ HIỆN KHÔNG CÒN NƠI NÀO TRUYỀN — Sếp 17/09/2026 dời nút "Duyệt bản này" sang bước ③
   * (`de-nghi-chi-tiet.tsx`, khối KẾT QUẢ "Xét duyệt phương án giá").
   *
   * 🔴 CỐ Ý GIỮ LẠI, KHÔNG XOÁ: nút này từng ở đây theo chỉ đạo Ban lãnh đạo 20/08 và 13/09/2026,
   * và Sếp có thể đổi lại bất cứ lúc nào — chỉ cần truyền `onDuyetO` là nút hiện lại nguyên vẹn.
   * Xoá đi thì lần sau phải dựng lại cả phép truyền `nhanO` (thứ giữ đường link *"Bản báo giá được
   * chọn"*), và đó đúng là chỗ vừa hỏng khi dời nút.
   *
   * 🔴 NHƯNG ĐỪNG TRUYỀN LẠI MÀ KHÔNG BỎ NÚT Ở BƯỚC ③ — hai nút Duyệt ở hai chỗ là hai chỗ làm
   * cùng một việc, đúng thứ dự án cấm.
   */
  onDuyetO?: (o: { chiSoO: number; nhanO: string; tenNCCDaGhi: string }) => void;
  /**
   * ★ LÝ DO ĐANG KHÓA — hiện thành dải thông báo trên đầu khu. `undefined` là không khóa.
   *
   * 🔴 Ban lãnh đạo 20/08/2026: *"khi đã duyệt thì khoá chức năng thay đổi báo giá và xoá sửa"*.
   * Nói RÕ vì sao khóa, không chỉ làm mờ nút: người dùng thấy nút Thay tệp biến mất mà không có
   * lời giải thích thì tưởng app lỗi, rồi đi hỏi vòng quanh.
   */
  lyDoKhoa?: string;
  /**
   * Cho mở khóa để sửa. `undefined` = người này KHÔNG được mở.
   *
   * 🔴 Ban lãnh đạo: *"chỉ có cấp trưởng phòng và quản trị được mở lại"* — trang chứa gác bằng
   * `quyen.xacNhanTruongBP` (đúng bằng *quản trị hoặc trưởng bộ phận cấp 3+*). Component này chỉ
   * vẽ nút khi được truyền hàm, không tự xét quyền.
   */
  onMoKhoa?: () => void;
  /**
   * ★ CHẶN BỎ TỆP TUYỆT ĐỐI — kể cả khi đã mở khóa.
   *
   * 🔴 Ban lãnh đạo 20/08/2026 hỏi lại *"sao vẫn xoá được"* sau khi đã chốt khóa-sau-duyệt. Bản
   * đầu của tôi cho mở khóa là mở cả THAY và BỎ, và người mở khóa xóa mất hai bản báo giá của một
   * hồ sơ **đã duyệt, đang ở bước Lập đơn mua hàng** — hồ sơ mất chứng từ mà quyết định duyệt vẫn
   * còn đó.
   *
   * Nay tách hai việc:
   *   · **Thay tệp** — mở khóa là làm được. Hồ sơ vẫn có chứng từ, chỉ là bản khác.
   *   · **Bỏ tệp** — KHÔNG, sau khi duyệt thì không ai bỏ được. Bỏ là hồ sơ trống chỗ đó, và
   *     không có cách nào biết trước kia có gì.
   *
   * 👉 Muốn thật sự bỏ thì phải trả hồ sơ về bước ② (nút "Không duyệt" ở bước ③) — lúc đó quyết
   * định duyệt cũng bị hủy theo, nên hồ sơ không bao giờ ở trạng thái "đã duyệt mà thiếu chứng từ".
   */
  chanXoaTep?: boolean;
}) {
  const { datTepVaoOGiaiDoan, datGhiChuTepGiaiDoan, goTepGiaiDoan, ghiLyDoThieuChungTu, cauHinh } =
    useDuLieu();
  const { nguoiDung } = useNguoiDung();

  const can = soBaoGiaCanCo(deNghi, cauHinh);
  const soO = soOBaoGia(deNghi, cauHinh);
  const tepDaCo = tepBaoGiaDaCo(deNghi);
  const vuongMac = vuongMacTrinhXetDuyet(deNghi, cauHinh);

  /**
   * ❌❌ ĐÃ BỎ NÚT *"Thêm báo giá NCC khác (ngoài số bắt buộc)"* — Sếp 19/09/2026, khoanh đỏ đúng
   * nút đó: ***"Bỏ trường thêm này, đã có ở nút tăng giảm số lượng rồi"***.
   *
   * 📌 ĐÂY LÀ THAY MỘT ĐƯỜNG BẰNG MỘT ĐƯỜNG KHÁC, KHÔNG PHẢI CẮT CHỨC NĂNG — đã kiểm trước khi
   * bỏ (quy ước §3.4b: bỏ lối vào nào thì phải chắc còn lối khác):
   *   · Ô **"SL Báo giá"** ở khối ĐẦU VÀO có nút ➕ ➖ (`o-sua-so-bao-gia.tsx`), tăng số đó là số
   *     ô đính kèm nhảy theo ngay — từ 18/09/2026 `soBaoGiaCanCo` lấy thẳng con số người dùng đặt.
   *   · Nhân viên **vẫn tăng được** (cờ `chiTang` chỉ chặn HẠ xuống dưới mốc Trưởng phòng giao).
   *
   * ⚠️ VIỆC NÀY ĐẢO MỘT CHỈ ĐẠO CŨ, ghi lại để người sau không tưởng là xoá nhầm rồi dựng lại:
   * Ban lãnh đạo 31/08/2026 từng yêu cầu *"nếu tìm được nhà cung cấp tốt hơn thì thêm 1 nút cho
   * nhân viên thêm báo giá nhà cung cấp khác"*. Lúc đó số ô do cấu hình quyết định nên cần một
   * nút riêng; nay ô SL Báo giá làm đúng việc ấy, nên hai nút thành hai chỗ cùng làm một chuyện.
   *
   * 🔴 KHÔNG XOÁ `soOBaoGia`: nó vẫn lấy `max(số cần, chỉ số ô cao nhất đang có tệp)` nên hồ sơ
   * cũ từng đính tệp ở ô thứ 4, 5 vẫn hiện đủ ô — bỏ nút không làm mất tệp nào.
   */
  const soOHienThi = soO;

  const tepTheoO = Array.from({ length: soOHienThi }, (_, i) =>
    tepDaCo.find((t) => chiSoOBaoGia(t.ghiChu) === i + 1),
  );
  /** Tệp ở ô "Bảng so sánh báo giá" — ô riêng, không tính vào số bản báo giá bắt buộc. */
  const tepBangSoSanh = tepSoSanh(deNghi);
  /* ★ Đúng MỘT LUẬT với `vuongMacTrinhXetDuyet` — gọi thẳng `soSanhBaoGiaBatBuoc` (xét CẢ
     `can === 0` lẫn số bản thật), không tự tính riêng. Trước 31/08/2026 thẻ này tự đặt
     `batBuoc={!tepBangSoSanh}`; sau đó tự đổi thành `soBanBaoGiaThat(deNghi) >= 2` nhưng quên
     lặp lại điều kiện `can === 0` — khi trưởng bộ phận chủ ý đặt "Không yêu cầu riêng" +
     `soBaoGiaToiThieu` = 0, thẻ vẫn hiện dấu * đỏ dù cổng ghi thật không hề chặn. */
  const soSanhBatBuoc = soSanhBaoGiaBatBuoc(deNghi, cauHinh);
  /**
   * ★ LÝ DO ĐÃ GHI CHO “KHÔNG CẦN ĐÍNH KÈM BẢNG SO SÁNH” — chuỗi rỗng nghĩa là chưa ai bấm.
   *
   * ✅ Từ 14/09/2026 gọi thẳng `lyDoBoQuaSoSanh` bên `2-quy-trinh/bao-gia-dinh-kem.ts` — **cùng
   * đúng một hàm mà `vuongMacTrinhXetDuyet` dùng**. Trước đó chỗ này tự đọc `lyDoThieuChungTu`
   * rồi `.trim()` lấy, tức hai nơi cùng trả lời một câu hỏi; chỉ cần một bên đổi cách `.trim()`
   * hay đổi khóa là ô báo hết thiếu trong khi cổng vẫn chặn.
   */
  const lyDoSoSanhDaGhi = lyDoBoQuaSoSanh(deNghi);
  /**
   * ★ Ô SO SÁNH CÒN “BÁO THIẾU” KHÔNG — Sếp 13/09/2026: bấm “Không cần đính kèm” thì ô phải
   * **thôi báo thiếu**.
   *
   * 🔴 CHỈ TẮT PHẦN NHẮC Ở Ô NÀY, KHÔNG ĐỘNG VÀO DÒNG CẢNH BÁO ĐẦU KHỐI (`vuongMac`). Dòng đó in
   * nguyên văn câu của `vuongMacTrinhXetDuyet` — tức điều kiện chuyển bước THẬT. Tự tắt nó ở đây
   * là giao diện nói “xong rồi” trong khi cổng ghi vẫn chặn, đúng thứ CLAUDE.md §3.5 cấm.
   */
  const soSanhConNhac = soSanhBatBuoc && lyDoSoSanhDaGhi === "";
  /**
   * Cổng chuyển bước CÓ CÒN đòi bảng so sánh không, dù đã ghi lý do.
   *
   * 📌 Hỏi bằng chính câu `vuongMacTrinhXetDuyet` trả về thay vì chép lại điều kiện: hôm nào luật
   * bên `2-quy-trinh/bao-gia-dinh-kem.ts` được sửa để chấp nhận lý do, câu đó không còn nhắc tên ô
   * nữa → dòng cảnh báo dưới đây **tự tắt**, không cần ai nhớ quay lại xóa.
   */
  const luatChuaBietBoQua = lyDoSoSanhDaGhi !== "" && (vuongMac ?? "").includes(NHAN_O_SO_SANH);
  /* Chốt ②: tệp không nhãn, hoặc nhãn vượt số ô, vẫn phải hiện ở đâu đó.
     ⚠️ TRỪ tệp của ô "Bảng so sánh báo giá" — nó đã có ô riêng bên dưới; không trừ thì nó hiện
     hai lần, và người dùng tưởng hồ sơ có hai tệp. */
  const tepKhac = tepDaCo.filter((t) => {
    if ((t.ghiChu ?? "").trim() === NHAN_O_SO_SANH) return false;
    const n = chiSoOBaoGia(t.ghiChu);
    return n === 0 || n > soOHienThi;
  });

  /**
   * ★ HỘP GHI LÝ DO BỎ QUA MỘT Ô — xem `khoaLyDoBoQuaBaoGia`. `null` = hộp đóng, số là chỉ số ô
   * báo giá (đếm từ 0) đang hỏi.
   *
   * ★ THÊM 13/09/2026: nhận thêm `O_SO_SANH` cho ô “Bảng so sánh báo giá” — Sếp: *"thêm 1 nút
   * không cần đính kèm báo giá bên cạnh"*. Dùng CHUNG một hộp, xem chú thích ở `O_SO_SANH`.
   */
  const [hoiBoQuaO, setHoiBoQuaO] = useState<number | typeof O_SO_SANH | null>(null);
  const [lyDoNhap, setLyDoNhap] = useState("");
  /**
   * Chỉ số các ô còn TRỐNG (đếm từ 0, khớp `nhanOBaoGia`) — để gán tệp sẵn có vào đúng ô.
   *
   * 🔴 Chỉ liệt kê ô TRỐNG: cho gán vào ô đang có tệp là âm thầm thay bản báo giá đã nộp bằng
   * bản khác, mà hai tệp cùng nhãn thì `tepTheoO` chỉ lấy được một — bản kia biến mất khỏi mọi
   * chỗ hiển thị dù vẫn nằm trong hồ sơ.
   */
  const oTrong = tepTheoO.map((t, i) => (t ? -1 : i)).filter((i) => i >= 0);

  /* 📌 ĐÃ BỎ phần gõ tên nhà cung cấp ở đây (20/08/2026) — việc đó chuyển sang bước ③ lúc trưởng
     bộ phận duyệt. Tên đã lưu ở hồ sơ cũ vẫn ĐỌC được qua `tenNCCCuaO`, chỉ không nhập mới. */

  /**
   * Gắn tệp vào MỘT Ô CÓ TÊN.
   *
   * 🔴 MỘT LẦN GHI DUY NHẤT qua `datTepVaoOGiaiDoan`. Bản đầu (20/08/2026) gọi
   * `themTepGiaiDoan` rồi gọi tiếp `datGhiChuTepGiaiDoan` — và **nhãn không bao giờ được ghi**:
   * hàm thứ hai đọc `deNghiRef.current`, mà ref chỉ cập nhật lúc render nên nó không thấy tệp
   * vừa thêm. Kết quả: ô luôn trống, app luôn báo thiếu bản báo giá, nút "Trình xét duyệt" khóa
   * vĩnh viễn — đúng triệu chứng Ban lãnh đạo báo. Đừng tách lại làm hai lần gọi.
   *
   * 📌 TRẢ CÂU LỖI cho `ODinhKemTep` thay vì tự `toast` — để nó đừng báo "Đã đính kèm" khi hồ sơ
   * thực ra đã từ chối.
   */
  function ganVaoO(tep: MoTaTep, nhan: string): string | null {
    return datTepVaoOGiaiDoan(
      deNghi.id,
      BUOC_DINH_KEM_BAO_GIA,
      tep,
      nhan,
      nguoiDung.tenHienThi,
    );
  }

  /**
   * Đang hỏi trước khi GHI ĐÈ ghi chú cũ của một tệp.
   *
   * 🔴 VÌ SAO PHẢI HỎI: nhãn ô nằm CHÍNH TRONG trường `ghiChu` — không có chỗ thứ hai để giữ cả
   * hai. Tệp cũ có thể mang ghi chú người dùng tự gõ ("Bản đã gồm VAT, giao 3 ngày"), gán vào ô
   * là mất câu đó. Mất không nhiều nhưng mất **im lặng** thì không được.
   */
  const [hoiGan, setHoiGan] = useState<{
    tepId: string;
    nhan: string;
    ghiChuCu: string;
    tenTep: string;
  } | null>(null);

  /**
   * ★ GÁN MỘT TỆP ĐÃ CÓ SẴN vào ô báo giá — Ban lãnh đạo 20/08/2026.
   *
   * 🔴 VÌ SAO BẮT BUỘC PHẢI CÓ. Ảnh chụp thực tế 20/08: người dùng đã tải 2 tệp lên bước này
   * từ trước (lúc chưa có ô có tên), nên chúng không mang nhãn ô nào. Kết quả: hồ sơ CÓ tệp
   * báo giá mà app vẫn báo *"còn thiếu 1 bản"*, và không có đường nào để sửa — tệp thì nằm đó
   * ở dạng chỉ-xem. Người dùng chỉ còn cách tải lên lần nữa, tức hồ sơ có hai bản trùng.
   *
   * Việc này chỉ ĐỔI NHÃN, không tạo tệp mới và không đụng nội dung tệp.
   */
  function ganTepSanCoVaoO(tepId: string, nhan: string) {
    const loi = datGhiChuTepGiaiDoan(
      deNghi.id,
      BUOC_DINH_KEM_BAO_GIA,
      tepId,
      nhan,
      nguoiDung.tenHienThi,
    );
    if (loi) {
      toast.error("Không gán được tệp vào ô", { description: loi });
      return;
    }
    toast.success(`Đã gán vào ô “${nhan}”`);
  }

  /**
   * Bỏ một tệp khỏi bước này.
   *
   * ⚠️ `goTepGiaiDoan` CHỈ gỡ khỏi hồ sơ, nội dung tệp vẫn trong kho — hộp xác nhận trong
   * `ODinhKemTep` đã nói đúng điều đó, đừng sửa thành "xóa vĩnh viễn".
   */
  function boTep(tepId: string) {
    const loi = goTepGiaiDoan(deNghi.id, BUOC_DINH_KEM_BAO_GIA, tepId, nguoiDung.tenHienThi);
    if (loi) {
      toast.error("Không bỏ được tệp", { description: loi });
      return;
    }
    toast.success("Đã bỏ tệp khỏi bước này");
  }

  /**
   * Khóa lưu và nhãn hiển thị của một ô có thể bỏ qua.
   *
   * 📌 Gom vào một chỗ để hai hàm ghi/hủy bên dưới không tự rẽ nhánh riêng — hai chỗ rẽ nhánh là
   * hai chỗ có thể lệch nhau, mà lệch ở đây nghĩa là ghi lý do vào một khóa rồi đi xóa một khóa
   * khác, người dùng bấm “Bỏ chọn” mà lý do vẫn còn nguyên trong hồ sơ.
   */
  function khoaVaNhanCuaO(o: number | typeof O_SO_SANH): { khoa: string; nhan: string } {
    return o === O_SO_SANH
      ? { khoa: KHOA_BO_QUA_SO_SANH, nhan: NHAN_O_SO_SANH }
      : { khoa: khoaLyDoBoQuaBaoGia(o), nhan: nhanOBaoGia(o) };
  }

  /** Ghi lý do bỏ qua ô đang hỏi (`hoiBoQuaO`) — dùng LẠI đúng cơ chế `lyDoThieuChungTu`. */
  function xacNhanBoQua() {
    if (hoiBoQuaO === null) return;
    const { khoa: khoaLuu, nhan } = khoaVaNhanCuaO(hoiBoQuaO);
    const loi = ghiLyDoThieuChungTu(deNghi.id, khoaLuu, lyDoNhap, nguoiDung.tenHienThi);
    if (loi) {
      toast.error("Không ghi được lý do", { description: loi });
      return;
    }
    toast.success(
      hoiBoQuaO === O_SO_SANH ? `Đã ghi: không cần “${nhan}”` : `Đã bỏ qua "${nhan}"`,
    );
    setHoiBoQuaO(null);
  }

  /**
   * Đổi ý sau khi đã bỏ qua — xóa lý do để ô trở lại trạng thái "còn thiếu".
   *
   * ★ Ô Bảng so sánh cũng đi đúng đường này (Sếp 13/09/2026 đòi *bỏ chọn được*): xóa lý do là ô
   * đòi tệp lại như chưa có gì xảy ra, đính kèm bình thường.
   */
  function huyBoQua(o: number | typeof O_SO_SANH) {
    const { khoa: khoaLuu, nhan } = khoaVaNhanCuaO(o);
    const loi = ghiLyDoThieuChungTu(deNghi.id, khoaLuu, "", nguoiDung.tenHienThi);
    if (loi) {
      toast.error("Không hủy được", { description: loi });
      return;
    }
    toast.success(o === O_SO_SANH ? `Đã bỏ chọn “không cần ${nhan}”` : `Đã hủy bỏ qua "${nhan}"`);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Chưa ai đặt SL Báo giá → không bịa ra ô nào, và cũng KHÔNG chặn chuyển bước.
          Nói rõ chỗ đặt con số thay vì để khu này trống trơn không giải thích.

          🔴 KHÔNG `return` SỚM Ở ĐÂY. Bản đầu (20/08/2026) trả về ngay câu này, nên khối "tệp
          chưa gán vào ô nào" nằm phía dưới KHÔNG BAO GIỜ chạy tới. Hồ sơ đã đính tệp báo giá từ
          trước mà chưa ai đặt SL Báo giá thì những tệp đó **vô hình hoàn toàn**: không xem,
          không tải về, không bỏ, không gán được — vẫn nằm trong `tepGiaiDoan` mà không chỗ nào
          hiện ra. Đúng cái "chứng từ bốc hơi" mà chú thích đầu file này cam kết chống. */}
      {soO === 0 && (
        <p className="text-sm text-text-secondary">
          Chưa đặt <strong>SL Báo giá</strong> nên chưa mở ô đính kèm nào. Số này do trưởng bộ
          phận đặt lúc giao việc ở bước “Tiếp nhận và kiểm tra”, sửa được ở ô{" "}
          <strong>SL Báo giá</strong> ngay phía trên.
        </p>
      )}

      {/* ★ DẢI THÔNG BÁO KHÓA — hiện khi hồ sơ đã duyệt (Ban lãnh đạo 20/08/2026). Nêu rõ lý do
          và ai mở được, kèm nút mở cho đúng người. */}
      {lyDoKhoa && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted p-(--hp-md-row-pad)">
          <Lock className="size-4 shrink-0 text-text-desc" aria-hidden />
          <span className="min-w-0 flex-1 text-sm text-text-secondary">{lyDoKhoa}</span>
          {onMoKhoa ? (
            <button
              type="button"
              onClick={onMoKhoa}
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-primary bg-primary-bg px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              <LockOpen className="size-3.5 shrink-0" aria-hidden />
              Mở khóa để sửa
            </button>
          ) : (
            /* Không được mở thì nói ai mở được — đừng để người dùng đi hỏi vòng quanh. */
            <span className="shrink-0 text-xs text-text-desc">
              Chỉ trưởng bộ phận hoặc quản trị mở lại được.
            </span>
          )}
        </div>
      )}

      {/* Trạng thái đủ/thiếu — CÓ CẢ MÀU LẪN CHỮ theo Design System V1.1, và luôn nói rõ
          còn thiếu mấy bản chứ không chỉ tô đỏ. Chưa đặt SL Báo giá thì không có gì để nói
          đủ/thiếu, nên ẩn hẳn dòng này. */}
      {soO === 0 ? null : vuongMac ? (
        <p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning-bg/40 p-(--hp-md-row-pad) text-sm text-text-secondary">
          <span aria-hidden>⚠️</span>
          <span>{vuongMac}</span>
        </p>
      ) : (
        <p className="flex items-center gap-2 text-sm text-success-soft">
          <Check className="size-4 shrink-0" aria-hidden />
          Đã đủ {can} bản báo giá theo yêu cầu — trình xét duyệt được.
        </p>
      )}

      {/* ★ BỐ CỤC LẠI 20/08/2026 — Ban lãnh đạo: *"bố cục lại giao diện này chuyên nghiệp hơn"*.
          Ba chỗ sửa so với bản trước:
            ① Mỗi ô là MỘT THẺ có viền, nền tách khỏi nền khối — trước đây các ô dính liền nhau
              nên hai bản báo giá nhìn như một khối chữ dài.
            ② Dòng hướng dẫn *"Nhận PDF, ảnh, Word, Excel · tối đa 10MB…"* chỉ hiện MỘT LẦN cho
              cả khu, thay vì lặp dưới từng ô (2 ô là 2 lần, 5 ô là 5 lần — chiếm nửa chiều cao
              khối mà không nói thêm gì).
            ③ Tên nhà cung cấp và nút đính kèm chia hai cột đều nhau, có nhãn cột ở trên, nên mắt
              chạy dọc một đường thẳng thay vì mỗi hàng một chiều rộng khác. */}
      <div className="flex flex-col gap-2">
        {tepTheoO.map((tep, i) => (
          <div
            key={nhanOBaoGia(i)}
            className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-(--hp-md-row-pad)"
          >
            <p className="flex items-center gap-2 text-xs font-semibold text-text-desc uppercase">
              {nhanOBaoGia(i)}
              {/* Ô nằm trong phạm vi bắt buộc thì đánh dấu * — ô vượt quá (do hồ sơ cũ) thì
                  không, vì nó không tính vào điều kiện chuyển bước. */}
              {i < can && (
                <>
                  <span aria-hidden className="text-danger">
                    *
                  </span>
                  <span className="sr-only">(bắt buộc)</span>
                </>
              )}
              {/* Tên NCC đã lưu hiện ngay trên nhãn ô — đọc được cả khi ô nhập bị khóa (hồ sơ
                  đã đóng) hoặc khi khối bị thu gọn. */}
              {hienTenNCC && tenNCCCuaO(tep?.ghiChu) !== "" && (
                <span className="font-semibold normal-case text-text-primary">
                  · {tenNCCCuaO(tep?.ghiChu)}
                </span>
              )}
              {tep && (
                <span className="font-normal normal-case text-success-soft">· đã có tệp</span>
              )}
            </p>
            {/* ★ CHỈ CÒN THANH ĐÍNH KÈM, CHIẾM HẾT CHIỀU RỘNG — Ban lãnh đạo 20/08/2026:
                *"bỏ mục này và kéo dài thanh đính kèm qua"* (chỉ vào ô "Báo giá của nhà cung cấp
                nào?").

                🔴 VIỆC GHI TÊN NHÀ CUNG CẤP ĐÃ CHUYỂN SANG BƯỚC ③, lúc trưởng bộ phận duyệt. Đây
                là hệ quả bắt buộc, không phải lựa chọn: bước ③ lấy tên nhà cung cấp để ghi vào
                quyết định duyệt, mà nay bước ② không thu tên nữa — nếu để nguyên thì nút Duyệt
                khóa vĩnh viễn vì không có tên nào. Đúng chỉ đạo *"chỉ đính kèm file và trưởng bộ
                phận chọn duyệt thôi"*: bước ② chỉ đính tệp, bước ③ mới quyết chọn ai.

                📌 Tên đã lưu ở hồ sơ CŨ vẫn hiện trên nhãn ô (phần `tenNCCCuaO` phía trên) —
                không xóa dữ liệu ai đã ghi, chỉ bỏ chỗ nhập mới. */}
            <ODinhKemTep
              tep={tep}
              nhanThem="Chọn tệp báo giá"
              nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
              batBuoc={i < can && !tep}
              khoa={!duocSua || khoa}
              /* Hướng dẫn định dạng in MỘT LẦN ở cuối khu, không lặp dưới từng ô. */
              anHuongDan
              /* Giữ nguyên tên đã lưu của ô khi thay tệp — đừng làm mất tên vì đổi tệp. */
              onXong={(t) => ganVaoO(t, nhanOBaoGia(i, tenNCCCuaO(tep?.ghiChu)))}
              /* Chỉ cho bỏ khi ô ĐANG có tệp — truyền `onXoa` lúc ô trống là bày một nút
                 không làm gì, đúng kiểu giao diện hứa việc app không làm. */
              onXoa={tep && duocSua && !khoa && !chanXoaTep ? () => boTep(tep.id) : undefined}
              /* ★ Nút DUYỆT của bản báo giá này — chỉ khi ô ĐANG CÓ TỆP. Bày nút duyệt ở ô trống
                 là mời người ta duyệt một bản báo giá không tồn tại. */
              nhanPhu={
                tep && onDuyetO ? (
                  <button
                    type="button"
                    onClick={() =>
                      onDuyetO({
                        chiSoO: i,
                        nhanO: nhanOBaoGia(i),
                        tenNCCDaGhi: tenNCCCuaO(tep.ghiChu),
                      })
                    }
                    /* Nền primary để tách hẳn khỏi bốn nút phụ bên cạnh (Xem / Tải về / Thay tệp
                       / Bỏ tệp đều là nút viền) — đây là hành động chính, và nó chuyển bước. */
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
                  >
                    <Check className="size-3.5 shrink-0" aria-hidden />
                    Duyệt bản này
                  </button>
                ) : undefined
              }
            />

            {/* ★ BỎ QUA MỘT Ô CÒN THIẾU — xem `khoaLyDoBoQuaBaoGia`. CHỈ hiện cho ô BẮT BUỘC
                (`i < can`) mà chưa có tệp — ô vượt số bắt buộc hoặc ô đã có tệp không có gì để
                bỏ qua. */}
            {i < can && !tep && duocSua && !khoa && (
              lyDoBoQuaBaoGia(deNghi, i) !== "" ? (
                <div className="flex items-start justify-between gap-2 rounded-lg border border-warning/40 bg-warning-bg/60 p-2.5 text-xs">
                  <span className="min-w-0 text-text-secondary">
                    <span className="font-semibold text-warning-soft">🚫 Đã bỏ qua ô này</span>
                    {" — "}
                    lý do: {lyDoBoQuaBaoGia(deNghi, i)}
                  </span>
                  <button
                    type="button"
                    onClick={() => huyBoQua(i)}
                    className="inline-flex shrink-0 items-center gap-1 text-text-desc hover:text-danger"
                    title="Tìm được nhà cung cấp rồi — hủy bỏ qua"
                  >
                    <Undo2 className="size-3.5" aria-hidden />
                    Hủy bỏ qua
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setHoiBoQuaO(i);
                    setLyDoNhap("");
                  }}
                  /* 🔴 `rounded-lg` (8px) — KHÔNG dùng `rounded-full`. Sếp 14/09/2026: *"Sửa lại
                     bodel hình chữ nhật… nếu có boder hình oval kiểu này thì chuyển về hình chữ
                     nhật bo góc hết"*. 8px là bán kính nút chuẩn của Design System V1.1
                     (`--radius: 0.5rem` trong `app/globals.css`, cũng là bán kính `Button` dùng).
                     Nút viền bo tròn hoàn toàn nằm cạnh các nút bo góc trông như của app khác. */
                  className="inline-flex min-h-9 w-fit items-center gap-1.5 rounded-lg border border-primary/50 bg-primary-bg px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  <X className="size-3.5 shrink-0" aria-hidden />
                  Không tìm được nhà cung cấp cho ô này — bỏ qua, ghi lý do
                </button>
              )
            )}
          </div>
        ))}
      </div>

      {/* ❌ NÚT "Thêm báo giá NCC khác" ĐÃ BỎ — Sếp 19/09/2026. Muốn thêm ô thì tăng ô
          "SL Báo giá" ở khối ĐẦU VÀO. Lý do đầy đủ ở chú thích chỗ khai `soOHienThi`. */}

      {/* ★ Ô "BẢNG SO SÁNH BÁO GIÁ" — Ban lãnh đạo 20/08/2026: *"thêm trường đính kèm file so
          sánh"*.

          🔴 KHÔNG BẮT BUỘC và KHÔNG TÍNH vào số bản báo giá. Đây là bảng do người lập tự làm ngoài
          Excel rồi đính vào — app đã bỏ hẳn chức năng so sánh giá nhập tay, nên bảng so sánh giờ
          là một chứng từ như mọi chứng từ khác.

          📌 Đặt SAU các ô báo giá, có đường kẻ tách: nó là kết quả đọc từ mấy bản báo giá phía
          trên, không phải một bản báo giá thứ N+1. */}
      {/**
        * ★★ CHỈ HIỆN KHI ĐÃ CÓ ĐỦ 2 BẢN BÁO GIÁ — Sếp 16/09/2026, nguyên văn: ***"Mục này đang hơi
        * thiếu thông minh, khi đính kèm 1 báo giá thì đâu cần phải đính kèm file so sánh. Vậy nên
        * sửa lại chỉ khi đính kèm 2 báo giá thì mới hiện nút đính kèm bảng so sánh"***.
        *
        * 🔴 TRƯỚC ĐÂY KHỐI NÀY HIỆN NGAY TỪ ĐẦU (`soO > 0`), nên hồ sơ chưa đính bản báo giá nào
        * vẫn thấy ô "Bảng so sánh báo giá" — mời người dùng so sánh một thứ chưa tồn tại. Nút
        * *"Không cần đính kèm"* bên trong thì lại gác `soSanhBatBuoc` (đòi ≥2 bản), nên người dùng
        * thấy ô mà không thấy đường thoát. Nay cả khối cùng một điều kiện, hết lệch.
        *
        * 🔴 VẾ `|| tepBangSoSanh` LÀ BẮT BUỘC, ĐỪNG BỎ CHO GỌN: hồ sơ đã đính bảng so sánh rồi mà
        * sau đó một bản báo giá bị gỡ (còn 1 bản) thì khối biến mất — **tệp vẫn nằm trong hồ sơ
        * nhưng không màn nào bày ra nữa**, người dùng không xem, không tải, không gỡ được. Giấu
        * chứng từ đi là thứ nguy hơn hẳn việc bày thừa một ô.
        *
        * 📌 `soO > 0` giữ nguyên ở đầu: bước chưa khai số báo giá nào thì cả khu này không có nghĩa.
        */}
      {soO > 0 && (soBanBaoGiaThat(deNghi) >= 2 || tepBangSoSanh) && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-dashed border-border bg-card p-(--hp-md-row-pad)">
          <p className="flex items-center gap-2 text-xs font-semibold text-text-desc uppercase">
            {NHAN_O_SO_SANH}
            {/* 🔴 BẮT BUỘC khi có ≥2 bản báo giá thật — Ban lãnh đạo 20/08/2026: *"mục này bắt
                buộc phải có"*; nới lại 31/08/2026: 1 bản thật thì không có gì để so sánh. Luật
                thật nằm ở `vuongMacTrinhXetDuyet`/`soSanhBaoGiaBatBuoc`, dấu * ở đây chỉ hiện đúng
                theo luật đó cho người dùng thấy — KHÔNG tự đặt điều kiện riêng. */}
            {/* Đã ghi “không cần đính kèm” thì THÔI đánh dấu * — Sếp 13/09/2026 đòi ô phải thôi
                báo thiếu. Xem `soSanhConNhac`. */}
            {soSanhConNhac && (
              <>
                <span aria-hidden className="text-danger">
                  *
                </span>
                <span className="sr-only">(bắt buộc)</span>
              </>
            )}
            {tepBangSoSanh && (
              <span className="font-normal normal-case text-success-soft">· đã có tệp</span>
            )}
          </p>

          {/* ★ HAI NÚT ĐỨNG CẠNH NHAU — Sếp 13/09/2026 (nguyên văn): *"Vẫn giữ nút đính kèm bảng
              so sánh báo giá và thêm 1 nút không cần đính kèm báo giá bên cạnh"*.

              🔴 NÚT ĐÍNH KÈM GIỮ NGUYÊN, KHÔNG ĐỘNG GÌ — Sếp nói *"vẫn giữ"*. Nút mới chỉ đứng
              thêm bên cạnh, không thay và không che nút cũ.

              📌 Vì sao KHÔNG dùng prop `nhanPhu` của `ODinhKemTep` cho nút mới: `nhanPhu` chỉ được
              vẽ ở nhánh ĐÃ CÓ TỆP (xem `o-dinh-kem-tep.tsx`), mà đây đúng là lúc CHƯA có tệp —
              truyền vào đó là nút không bao giờ hiện. */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Có tệp rồi thì thanh tệp trải hết chiều rộng như trước (`flex-1`); chưa có tệp thì
                co đúng bề rộng nút để nút “Không cần đính kèm” đứng SÁT bên phải nó, chứ không bị
                đẩy ra tận mép phải khối. */}
            <div className={tepBangSoSanh ? "min-w-0 flex-1" : "min-w-0"}>
              <ODinhKemTep
                tep={tepBangSoSanh}
                nhanThem="Chọn tệp bảng so sánh"
                nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
                batBuoc={soSanhConNhac && !tepBangSoSanh}
                khoa={!duocSua || khoa}
                anHuongDan
                onXong={(t) => ganVaoO(t, NHAN_O_SO_SANH)}
                onXoa={
                  tepBangSoSanh && duocSua && !khoa && !chanXoaTep
                    ? () => boTep(tepBangSoSanh.id)
                    : undefined
                }
              />
            </div>

            {/* Chỉ hiện khi ô này ĐANG bị đòi và còn trống: bảng so sánh vốn không bắt buộc (hồ sơ
                chỉ có 1 bản báo giá thật) thì chẳng có gì để “không cần”, bày nút ra là mời người
                dùng ghi một lý do vô nghĩa vào hồ sơ. Đã ghi lý do rồi thì nút nhường chỗ cho khối
                lý do bên dưới. */}
            {soSanhBatBuoc && !tepBangSoSanh && duocSua && !khoa && lyDoSoSanhDaGhi === "" && (
              <button
                type="button"
                onClick={() => {
                  setHoiBoQuaO(O_SO_SANH);
                  setLyDoNhap("");
                }}
                /* Cùng kiểu nút với “bỏ qua, ghi lý do” của các ô báo giá phía trên — cùng một
                   việc thì phải nhìn giống nhau, người dùng không phải học hai lần.
                   🔴 `rounded-lg` (8px, bán kính nút chuẩn V1.1) — Sếp 14/09/2026 chỉ đúng nút này
                   trong ảnh: *"chuyển về hình chữ nhật bo góc hết"*. Đổi ở đây thì đổi luôn nút
                   trên cho khớp, đừng để hai nút cùng việc mà khác hình. */
                className="inline-flex min-h-9 w-fit shrink-0 items-center gap-1.5 rounded-lg border border-primary/50 bg-primary-bg px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                <X className="size-3.5 shrink-0" aria-hidden />
                Không cần đính kèm
              </button>
            )}
          </div>

          {/* ★ LÝ DO ĐÃ GHI — luôn hiện, kể cả khi sau đó có người đính tệp vào ô: lý do đã vào hồ
              sơ thì phải đọc được, và phải có đường rút lại. Sếp 13/09/2026: *vẫn phải thấy được
              lý do đã ghi, và phải bỏ chọn được*. */}
          {lyDoSoSanhDaGhi !== "" && (
            <div className="flex items-start justify-between gap-2 rounded-lg border border-warning/40 bg-warning-bg/60 p-2.5 text-xs">
              <span className="min-w-0 text-text-secondary">
                <span className="font-semibold text-warning-soft">🚫 Không cần đính kèm</span>
                {" — "}
                lý do: {lyDoSoSanhDaGhi}
              </span>
              {duocSua && !khoa && (
                <button
                  type="button"
                  onClick={() => huyBoQua(O_SO_SANH)}
                  className="inline-flex shrink-0 items-center gap-1 text-text-desc hover:text-danger"
                  title="Đổi ý — bỏ chọn để đính kèm bảng so sánh như bình thường"
                >
                  <Undo2 className="size-3.5" aria-hidden />
                  Bỏ chọn
                </button>
              )}
            </div>
          )}

          {/* 🔴 NÓI THẲNG PHẦN APP CHƯA LÀM ĐƯỢC — CLAUDE.md §3.5.
              Lý do đã ghi vào hồ sơ thật, nhưng cổng `vuongMacTrinhXetDuyet` hiện vẫn đòi tệp bảng
              so sánh (xem chú thích `KHOA_BO_QUA_SO_SANH`). Im lặng ở đây thì người dùng bấm
              “Không cần đính kèm”, thấy ô hết báo thiếu, rồi bấm “Trình xét duyệt” mãi không được
              mà không hiểu vì sao.
              📌 Dòng này TỰ TẮT khi luật bên `2-quy-trinh/bao-gia-dinh-kem.ts` được sửa để chấp
              nhận lý do — xem `luatChuaBietBoQua`. */}
          {luatChuaBietBoQua && (
            <p className="text-xs text-warning-soft">
              ⚠️ Lý do đã lưu vào hồ sơ, nhưng điều kiện trình xét duyệt hiện <strong>vẫn</strong>{" "}
              đòi tệp bảng so sánh (xem dòng cảnh báo ở đầu khối) — nút “Trình xét duyệt báo giá”
              còn khóa. Báo quản trị cập nhật quy trình, hoặc đính kèm bảng so sánh để đi tiếp.
            </p>
          )}

          {!tepBangSoSanh && lyDoSoSanhDaGhi === "" && (
            /* ❌ ĐÃ BỎ vế *"— app không tự lập bảng so sánh nữa"* (Sếp 15/09/2026).
               Đó là câu kể lại một THAY ĐỔI CŨ của app (bỏ bảng so sánh nhập tay, 20/08/2026),
               chỉ có nghĩa với người từng dùng bản trước. Người dùng mới đọc vào chỉ thấy app
               kể chuyện mình, không giúp họ biết phải làm gì. Vế đầu đã nói đủ việc cần làm. */
            <p className="text-xs text-text-desc">
              Bảng so sánh giá lập ngoài (Excel/PDF) rồi đính vào đây.
            </p>
          )}
        </div>
      )}

      {/* ★ TỆP CHƯA GÁN VÀO Ô NÀO — trước đây khối này chỉ-xem, nay gán được vào ô và bỏ được.
          Xem chú thích của `ganTepSanCoVaoO` để biết vì sao bắt buộc phải có. */}
      {tepKhac.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-muted/40 p-(--hp-md-row-pad)">
          <p className="text-xs font-semibold text-text-desc uppercase">
            Tệp chưa gán vào ô nào ({tepKhac.length})
          </p>
          <p className="text-xs text-text-secondary">
            Những tệp này nằm trong bước nhưng chưa được tính là bản báo giá nào. Chọn ô để gán,
            hoặc bỏ nếu tải nhầm.
          </p>
          {tepKhac.map((t) => (
            <ODinhKemTep
              key={t.id}
              tep={t}
              nhanThem="Chọn tệp"
              nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
              /* `khoa` chỉ khóa việc THAY nội dung tệp — giữ khóa vì thay tệp ở đây dễ gây
                 nhầm: người dùng tưởng đang gán, thực ra đang ghi đè bằng tệp khác. */
              khoa
              onXong={() => {}}
              onXoa={duocSua && !khoa && !chanXoaTep ? () => boTep(t.id) : undefined}
              nhanPhu={
                duocSua && !khoa && oTrong.length > 0 ? (
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const nhan = e.target.value;
                      /* Đặt lại ô chọn về "Gán vào ô…" ngay: sau khi gán xong, tệp rời khỏi
                         danh sách này nên giữ lựa chọn cũ là vô nghĩa. Dùng `e.target` chứ
                         KHÔNG `e.currentTarget` — trong hàm bất đồng bộ/`setState` sau đó,
                         `currentTarget` có thể đã là `null`. */
                      e.target.value = "";
                      if (!nhan) return;
                      const ghiChuCu = (t.ghiChu ?? "").trim();
                      /* Có ghi chú cũ thì hỏi trước khi ghi đè; không có thì gán luôn, đừng
                         bắt người dùng bấm thêm một hộp thoại vô ích. */
                      if (ghiChuCu !== "") {
                        setHoiGan({ tepId: t.id, nhan, ghiChuCu, tenTep: t.tenTep });
                        return;
                      }
                      ganTepSanCoVaoO(t.id, nhan);
                    }}
                    aria-label={`Gán tệp ${t.tenTep} vào ô báo giá`}
                    className="min-h-9 rounded-lg border border-primary bg-card px-2 text-xs font-medium text-primary transition-colors hover:bg-primary-bg"
                  >
                    <option value="">Gán vào ô…</option>
                    {oTrong.map((i) => (
                      <option key={i} value={nhanOBaoGia(i)}>
                        {nhanOBaoGia(i)}
                      </option>
                    ))}
                  </select>
                ) : undefined
              }
            />
          ))}
          {oTrong.length === 0 && (
            <p className="text-xs text-text-desc">
              Các ô báo giá đã có tệp cả — muốn dùng tệp này thì bỏ tệp ở ô tương ứng trước.
            </p>
          )}
        </div>
      )}

      {/* Hướng dẫn định dạng — MỘT LẦN cho cả khu (xem prop `anHuongDan` của `ODinhKemTep`). */}
      {soO > 0 && (
        <p className="text-xs text-text-desc">
          Nhận PDF, ảnh, Word, Excel · tối đa 10MB mỗi tệp. Tệp lưu lên máy chủ nên người khác mở
          xem được.
          {soO >= TOI_DA_TEP_MOI_BUOC &&
            ` Mỗi bước giữ tối đa ${TOI_DA_TEP_MOI_BUOC} tệp — đây là mức trần của kho dữ liệu.`}
        </p>
      )}

      {/* Hỏi trước khi ghi đè ghi chú cũ — xem chú thích của `hoiGan`. */}
      <HopXacNhan
        mo={hoiGan !== null}
        tieuDe="Gán tệp này vào ô báo giá?"
        moTa={
          hoiGan && (
            <>
              Tệp <strong>{hoiGan.tenTep}</strong> đang có ghi chú{" "}
              <strong>“{hoiGan.ghiChuCu}”</strong>. Gán vào ô{" "}
              <strong>{hoiGan.nhan}</strong> sẽ thay ghi chú đó bằng tên ô, vì app chỉ có một chỗ
              để ghi nhãn cho mỗi tệp. Nội dung tệp không đổi.
            </>
          )
        }
        nhanDongY="Gán vào ô"
        onDong={() => setHoiGan(null)}
        onDongY={() => {
          if (hoiGan) ganTepSanCoVaoO(hoiGan.tepId, hoiGan.nhan);
          setHoiGan(null);
        }}
      />

      {/* Hỏi lý do trước khi bỏ qua một ô báo giá còn thiếu — xem `khoaLyDoBoQuaBaoGia`.
          ★ Từ 13/09/2026 hộp này dùng CHUNG cho cả ô “Bảng so sánh báo giá” (Sếp: *"thêm 1 nút
          không cần đính kèm báo giá bên cạnh"*) — chỉ đổi tiêu đề, câu mô tả và ví dụ trong ô nhập,
          còn cơ chế ghi thì y nguyên. Xem `O_SO_SANH`. */}
      <HopXacNhan
        mo={hoiBoQuaO !== null}
        tieuDe={
          hoiBoQuaO === O_SO_SANH
            ? `Không cần đính kèm “${NHAN_O_SO_SANH}”?`
            : `Bỏ qua "${typeof hoiBoQuaO === "number" ? nhanOBaoGia(hoiBoQuaO) : ""}"?`
        }
        moTa={
          hoiBoQuaO === O_SO_SANH
            ? "Ghi rõ vì sao hồ sơ này không cần bảng so sánh báo giá — bắt buộc phải có lý do. Đổi ý thì bấm “Bỏ chọn” ở ô đó rồi đính kèm lại bình thường."
            : "Ghi rõ vì sao chưa tìm được nhà cung cấp cho ô này — bắt buộc phải có lý do mới bỏ qua được. Tìm được nhà cung cấp sau thì vẫn đính kèm bình thường."
        }
        khoaDongY={lyDoNhap.trim() === "" ? "Nhập lý do trước khi bỏ qua." : undefined}
        /* ★ Nhãn đổi theo chỉ đạo Ban lãnh đạo 13/09/2026 ("Cập nhật").
           📌 Em có nêu lại với Sếp rằng nút này thực chất là *bỏ qua một ô báo giá bắt buộc kèm
           ghi lý do vào hồ sơ*, nên chữ "Cập nhật" không nói ra việc đó — Sếp vẫn chốt "Cập
           nhật", nên làm đúng vậy. Ghi lại đây để phiên sau đừng tự đổi về vì tưởng đặt nhầm.
           📌 Câu mô tả và ô "Lý do" phía dưới GIỮ NGUYÊN — chúng mới là chỗ nói rõ việc đang làm,
           và ô lý do vẫn bắt buộc (`khoaDongY` ngay trên). */
        nhanDongY="Cập nhật"
        onDong={() => setHoiBoQuaO(null)}
        onDongY={() => xacNhanBoQua()}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ly-do-bo-qua-bao-gia">Lý do</Label>
          <Textarea
            id="ly-do-bo-qua-bao-gia"
            value={lyDoNhap}
            onChange={(e) => setLyDoNhap(e.target.value)}
            /* Ví dụ đổi theo loại ô đang hỏi — gợi ý sai ngữ cảnh thì người dùng chép đại vào,
               rồi hồ sơ có một dòng lý do không liên quan đến việc thật sự đang bỏ qua. */
            placeholder={
              hoiBoQuaO === O_SO_SANH
                ? "VD: Giá và điều kiện đã so sánh trong biên bản họp, không lập bảng riêng…"
                : "VD: Mặt hàng đặc thù, chỉ một nhà cung cấp trong khu vực có hàng…"
            }
          />
        </div>
      </HopXacNhan>
    </div>
  );
}
