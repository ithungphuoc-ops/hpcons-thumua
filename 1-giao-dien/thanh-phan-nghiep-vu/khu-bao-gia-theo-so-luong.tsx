"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Lock, LockOpen } from "lucide-react";
import { ODinhKemTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { useDuLieu, TOI_DA_TEP_MOI_BUOC } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  BUOC_DINH_KEM_BAO_GIA,
  chiSoOBaoGia,
  nhanOBaoGia,
  NHAN_O_SO_SANH,
  soBaoGiaCanCo,
  soOBaoGia,
  tenNCCCuaO,
  tepBaoGiaDaCo,
  tepSoSanh,
  vuongMacTrinhXetDuyet,
} from "@/2-quy-trinh/bao-gia-dinh-kem";
import type { DeNghiMuaHang, MoTaTep } from "@/3-du-lieu/kieu-du-lieu";

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
  const { datTepVaoOGiaiDoan, datGhiChuTepGiaiDoan, goTepGiaiDoan } = useDuLieu();
  const { nguoiDung } = useNguoiDung();

  const can = soBaoGiaCanCo(deNghi);
  const soO = soOBaoGia(deNghi);
  const tepDaCo = tepBaoGiaDaCo(deNghi);
  const vuongMac = vuongMacTrinhXetDuyet(deNghi);

  const tepTheoO = Array.from({ length: soO }, (_, i) =>
    tepDaCo.find((t) => chiSoOBaoGia(t.ghiChu) === i + 1),
  );
  /** Tệp ở ô "Bảng so sánh báo giá" — ô riêng, không tính vào số bản báo giá bắt buộc. */
  const tepBangSoSanh = tepSoSanh(deNghi);
  /* Chốt ②: tệp không nhãn, hoặc nhãn vượt số ô, vẫn phải hiện ở đâu đó.
     ⚠️ TRỪ tệp của ô "Bảng so sánh báo giá" — nó đã có ô riêng bên dưới; không trừ thì nó hiện
     hai lần, và người dùng tưởng hồ sơ có hai tệp. */
  const tepKhac = tepDaCo.filter((t) => {
    if ((t.ghiChu ?? "").trim() === NHAN_O_SO_SANH) return false;
    const n = chiSoOBaoGia(t.ghiChu);
    return n === 0 || n > soO;
  });
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
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-warning bg-warning-bg px-3 text-xs font-semibold text-warning-soft transition-colors hover:bg-warning hover:text-white"
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
          </div>
        ))}
      </div>

      {/* ★ Ô "BẢNG SO SÁNH BÁO GIÁ" — Ban lãnh đạo 20/08/2026: *"thêm trường đính kèm file so
          sánh"*.

          🔴 KHÔNG BẮT BUỘC và KHÔNG TÍNH vào số bản báo giá. Đây là bảng do người lập tự làm ngoài
          Excel rồi đính vào — app đã bỏ hẳn chức năng so sánh giá nhập tay, nên bảng so sánh giờ
          là một chứng từ như mọi chứng từ khác.

          📌 Đặt SAU các ô báo giá, có đường kẻ tách: nó là kết quả đọc từ mấy bản báo giá phía
          trên, không phải một bản báo giá thứ N+1. */}
      {soO > 0 && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-dashed border-border bg-card p-(--hp-md-row-pad)">
          <p className="flex items-center gap-2 text-xs font-semibold text-text-desc uppercase">
            {NHAN_O_SO_SANH}
            {/* 🔴 BẮT BUỘC từ 20/08/2026 — Ban lãnh đạo: *"mục này bắt buộc phải có"*. Luật thật
                nằm ở `vuongMacTrinhXetDuyet`, dấu * ở đây chỉ là hiện ra cho người dùng thấy. */}
            <span aria-hidden className="text-danger">
              *
            </span>
            <span className="sr-only">(bắt buộc)</span>
            {tepBangSoSanh && (
              <span className="font-normal normal-case text-success-soft">· đã có tệp</span>
            )}
          </p>
          <ODinhKemTep
            tep={tepBangSoSanh}
            nhanThem="Chọn tệp bảng so sánh"
            nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
            batBuoc={!tepBangSoSanh}
            khoa={!duocSua || khoa}
            anHuongDan
            onXong={(t) => ganVaoO(t, NHAN_O_SO_SANH)}
            onXoa={
              tepBangSoSanh && duocSua && !khoa && !chanXoaTep
                ? () => boTep(tepBangSoSanh.id)
                : undefined
            }
          />
          {!tepBangSoSanh && (
            <p className="text-xs text-text-desc">
              Bảng so sánh giá lập ngoài (Excel/PDF) rồi đính vào đây — app không tự lập bảng so
              sánh nữa.
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
    </div>
  );
}
