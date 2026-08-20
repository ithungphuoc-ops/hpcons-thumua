"use client";

import { toast } from "sonner";
import { Check } from "lucide-react";
import { ODinhKemTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { useDuLieu, TOI_DA_TEP_MOI_BUOC } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  BUOC_DINH_KEM_BAO_GIA,
  chiSoOBaoGia,
  nhanOBaoGia,
  soBaoGiaCanCo,
  soOBaoGia,
  tepBaoGiaDaCo,
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
}: {
  deNghi: DeNghiMuaHang;
  /** Cấp quyền có được thêm/gỡ không. Chốt thật ở tầng dữ liệu, cờ này chỉ để không bày nút. */
  duocSua: boolean;
  /** Hồ sơ đã đóng (hoàn thành / đóng dở) — khóa thêm và gỡ, nhưng XEM thì vẫn xem được. */
  khoa?: boolean;
}) {
  const { themTepGiaiDoan, datGhiChuTepGiaiDoan } = useDuLieu();
  const { nguoiDung } = useNguoiDung();

  const can = soBaoGiaCanCo(deNghi);
  const soO = soOBaoGia(deNghi);
  const tepDaCo = tepBaoGiaDaCo(deNghi);
  const vuongMac = vuongMacTrinhXetDuyet(deNghi);

  const tepTheoO = Array.from({ length: soO }, (_, i) =>
    tepDaCo.find((t) => chiSoOBaoGia(t.ghiChu) === i + 1),
  );
  /* Chốt ②: tệp không nhãn, hoặc nhãn vượt số ô, vẫn phải hiện ở đâu đó. */
  const tepKhac = tepDaCo.filter((t) => {
    const n = chiSoOBaoGia(t.ghiChu);
    return n === 0 || n > soO;
  });

  /**
   * Gắn tệp vào MỘT Ô CÓ TÊN: cất vào danh sách của bước rồi gắn nhãn ghi chú.
   *
   * ⚠️ Phải chờ `themTepGiaiDoan` xong (nó TRẢ VỀ lý do lỗi chứ không ném) rồi mới gắn ghi chú —
   * gắn trước thì tệp chưa tồn tại, ghi chú rơi mất lặng lẽ và tệp nằm sai ô.
   */
  function ganVaoO(tep: MoTaTep, nhan: string) {
    const loi = themTepGiaiDoan(deNghi.id, BUOC_DINH_KEM_BAO_GIA, [tep], nguoiDung.tenHienThi);
    if (loi) {
      toast.error("Không lưu được tệp vào hồ sơ", { description: loi });
      return;
    }
    datGhiChuTepGiaiDoan(
      deNghi.id,
      BUOC_DINH_KEM_BAO_GIA,
      tep.id,
      nhan,
      nguoiDung.tenHienThi,
    );
  }

  /* Chưa ai đặt SL Báo giá → không bịa ra ô nào, và cũng KHÔNG chặn chuyển bước.
     Nói rõ chỗ đặt con số thay vì để khu này trống trơn không giải thích. */
  if (soO === 0) {
    return (
      <p className="text-sm text-text-secondary">
        Chưa đặt <strong>SL Báo giá</strong> nên chưa mở ô đính kèm nào. Số này do trưởng bộ phận
        đặt lúc giao việc ở bước “Tiếp nhận và kiểm tra”, sửa được ở ô <strong>SL Báo giá</strong>
        {" "}ngay phía trên.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Trạng thái đủ/thiếu — CÓ CẢ MÀU LẪN CHỮ theo Design System V1.1, và luôn nói rõ
          còn thiếu mấy bản chứ không chỉ tô đỏ. */}
      {vuongMac ? (
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

      {tepTheoO.map((tep, i) => (
        <div key={nhanOBaoGia(i)} className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-text-desc uppercase">
            {nhanOBaoGia(i)}
            {/* Ô nằm trong phạm vi bắt buộc thì đánh dấu * — ô vượt quá (do hồ sơ cũ) thì không,
                vì nó không tính vào điều kiện chuyển bước. */}
            {i < can && (
              <>
                <span aria-hidden className="text-danger">
                  {" *"}
                </span>
                <span className="sr-only"> (bắt buộc)</span>
              </>
            )}
          </p>
          <ODinhKemTep
            tep={tep}
            nhanThem="Chọn tệp báo giá"
            nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
            batBuoc={i < can && !tep}
            khoa={!duocSua || khoa}
            onXong={(t) => ganVaoO(t, nhanOBaoGia(i))}
          />
        </div>
      ))}

      {/* Tệp ngoài các ô có tên — hiện để không tệp nào vô hình (chốt ②). */}
      {tepKhac.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-text-desc uppercase">Tệp khác của bước này</p>
          {tepKhac.map((t) => (
            <ODinhKemTep
              key={t.id}
              tep={t}
              nhanThem="Chọn tệp"
              nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
              khoa
              onXong={() => {}}
            />
          ))}
        </div>
      )}

      {soO >= TOI_DA_TEP_MOI_BUOC && (
        <p className="text-xs text-text-desc">
          Mỗi bước giữ tối đa {TOI_DA_TEP_MOI_BUOC} tệp — đây là mức trần của kho dữ liệu.
        </p>
      )}
    </div>
  );
}
