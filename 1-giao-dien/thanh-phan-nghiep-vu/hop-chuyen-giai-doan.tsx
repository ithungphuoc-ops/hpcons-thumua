"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import {
  NHAN_CACH_GIAO_VIEC,
  caiDatCuaBuoc,
  type CauHinhQuyTrinh,
  type CongViecGiaiDoan,
} from "@/2-quy-trinh/cau-hinh-quy-trinh";
import {
  NHAN_GIAI_DOAN,
  type DieuKienConVuong,
  type GiaiDoanMuaHang,
} from "@/2-quy-trinh/giai-doan-mua-hang";
import { chuTien } from "@/2-quy-trinh/nguong-gia-tri";
import {
  BUOC_DINH_KEM_HOP_DONG,
  BUOC_DINH_KEM_HO_SO_THANH_TOAN,
  KHOA_LY_DO_THIEU_HOP_DONG,
  lyDoThieuHopDong,
  NHAN_TEP_HOA_DON_VAT,
  NHAN_TEP_HOP_DONG,
  NHAN_TEP_UNC,
  TEN_HIEN_HOP_DONG,
  tepHoaDonVAT,
  tepHopDong,
  tepUNC,
} from "@/2-quy-trinh/chung-tu-cuoi-quy-trinh";
import { OChungTuBatBuoc } from "@/1-giao-dien/thanh-phan-nghiep-vu/o-chung-tu-bat-buoc";
import { KhuBaoGiaTheoSoLuong } from "@/1-giao-dien/thanh-phan-nghiep-vu/khu-bao-gia-theo-so-luong";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";

/**
 * HỘP CHUYỂN NHIỆM VỤ SANG GIAI ĐOẠN TIẾP THEO — dựng theo ảnh Base Ban lãnh đạo gửi
 * 15/08/2026: *"điều chỉnh tính năng kéo thả sang bước tiếp theo, sẽ có cửa sổ thông báo
 * giống vậy và các trường nhập thông tin tương tự"*.
 *
 * Bố cục bám đúng ảnh:
 *   ① Câu dẫn: "Vui lòng hoàn thành các bước sau trước khi chuyển <mã> đến <bước đích>"
 *   ② ĐẦU VÀO CHO GIAI ĐOẠN <bước đích> — hai ô KHÓA (giao lại cho · thời hạn) đọc từ cấu
 *      hình, và ô ghi chú "Những việc đã hoàn thành?" cho người dùng gõ
 *   ③ CÔNG VIỆC ĐANG CHỜ XỬ LÝ Ở GIAI ĐOẠN TRƯỚC — việc bắt buộc chưa tích xong
 *   ④ Nút "Chuyển sang giai đoạn kế tiếp" · "Đóng lại"
 *
 * 🔴 HAI Ô KHÓA LÀ CỐ Ý, đúng như Base (biểu tượng ổ khóa): chúng hiện giá trị đang áp dụng
 * để người chuyển bước biết mình đang giao việc theo luật nào, nhưng sửa thì phải vào trang
 * Cài đặt quy trình — đổi ngay tại đây là mỗi hồ sơ một luật, không ai đối chiếu nổi.
 *
 * ⚠️ Ghi chú "Những việc đã hoàn thành" VÀO NHẬT KÝ đề nghị, không lưu thành trường riêng.
 * Nó là lời kể của người chuyển bước tại một thời điểm — đúng bản chất một dòng nhật ký.
 */
export function HopChuyenGiaiDoan({
  mo,
  deNghi,
  tuBuoc,
  denBuoc,
  cauHinh,
  seLam,
  canhBao,
  nhanNut,
  nguyHiem = false,
  congViecChuaXong,
  daXong,
  dieuKienConVuong,
  onTichCongViec,
  duongDanChiTiet,
  chanCung,
  onDong,
  onXacNhan,
}: {
  mo: boolean;
  deNghi: DeNghiMuaHang | undefined;
  tuBuoc: GiaiDoanMuaHang;
  denBuoc: GiaiDoanMuaHang;
  cauHinh: CauHinhQuyTrinh;
  /** Điều app sẽ làm nếu bấm xác nhận — nói bằng lời người dùng hiểu. */
  seLam: string;
  /** Việc còn dang dở ở bước hiện tại (khác với công việc bắt buộc bên dưới). */
  canhBao: string[];
  nhanNut: string;
  nguyHiem?: boolean;
  /**
   * Công việc bắt buộc của bước ĐANG ĐỨNG.
   *
   * ⚠️ Danh sách này KHÔNG đổi khi người dùng tích trong hộp — nó là ảnh chụp lúc mở hộp. Ô
   * nào đã tích thì `daXong` biết, nhờ vậy việc vừa tích không biến mất khỏi danh sách giữa
   * chừng (biến mất thì người dùng tưởng mình bấm hụt).
   */
  congViecChuaXong: CongViecGiaiDoan[];
  /** Mã các công việc đã tích xong — cập nhật theo dữ liệu thật. */
  daXong: string[];
  /**
   * ★★ ĐIỀU KIỆN CHUYỂN BƯỚC CÒN VƯỚNG, gỡ được ngay trong hộp — Ban lãnh đạo 25/08/2026:
   * *"Kéo qua bước phải hiển thị các trường nhập nhanh các điều kiện chuyển bước"*.
   *
   * 🔴 PHẢI TÍNH LẠI MỖI LẦN VẼ Ở NƠI GỌI, không được là ảnh chụp lúc thả thẻ. Danh sách rỗng
   * chính là điều kiện mở khóa nút; đưa vào một ảnh chụp thì người dùng đính đủ tệp mà nút vẫn
   * khóa, phải đóng hộp mở lại mới thấy đổi — và họ sẽ tưởng việc đính kèm không ăn.
   */
  dieuKienConVuong: DieuKienConVuong[];
  /** Tích / bỏ tích một công việc ngay trong hộp. */
  onTichCongViec: (congViec: CongViecGiaiDoan, xong: boolean) => void;
  /**
   * ★★ ĐƯỜNG MỞ TRANG ĐẦY ĐỦ — thêm 27/08/2026 cùng việc bấm thẻ mở hộp này thay vì mở trang.
   *
   * 🔴 KHÔNG CÓ NÚT NÀY THÌ HỘP THÀNH ĐƯỜNG CỤT. Từ 27/08/2026 cú bấm thẻ dừng ở hộp, nên nếu
   * hộp không có đường đi tiếp thì mọi thứ chỉ xem được ở trang chi tiết (dòng vật tư, lịch sử,
   * trao đổi, bộ hồ sơ thanh toán) trở thành không tới được bằng chuột — người dùng phải biết
   * mẹo Ctrl+click mới vào nổi.
   *
   * Không truyền thì nút không hiện (hộp mở từ đường khác, VD kéo thả trước đây).
   */
  duongDanChiTiet?: string;
  /**
   * ★★ LÝ DO BƯỚC NÀY KHÔNG ĐI ĐƯỢC — hộp bày lý do và KHÓA nút (thêm 27/08/2026).
   *
   * Dùng cho ca luật trả `khong_the`: khác hẳn `dieuKienConVuong` (gỡ được ngay trong hộp bằng
   * cách đính tệp / tích việc), đây là "chưa tới lúc" — VD đang ở bước ② mà chưa có bản báo giá
   * nào thì không có gì để xét duyệt.
   *
   * 🔴 CÓ PROP NÀY LÀ VÌ KHÔNG ĐƯỢC MỞ HỘP MÀ ĐỂ NÚT BẤM ĐƯỢC. Hộp vốn chỉ mở cho ca đi tiếp
   * được; từ 27/08/2026 cú bấm thẻ mở hộp cho MỌI ca, và `dungXacNhanKeoTha` trả về nhãn nút
   * mặc định *"Xác nhận"* cho ca `khong_the` — bày nút đó không khóa là mời người dùng bấm một
   * việc luật vừa nói là không được, rồi app im lặng làm theo.
   */
  chanCung?: string;
  onDong: () => void;
  /**
   * `ghiChu` là nội dung ô "Những việc đã hoàn thành?" — rỗng thì không ghi nhật ký.
   * `soBaoGia` chỉ có khi chuyển sang bước ② (xem trường "SL Báo giá" bên dưới).
   */
  onXacNhan: (ghiChu: string, soBaoGia?: number) => void;
}) {
  const [ghiChu, setGhiChu] = useState("");

  /**
   * ★ Ô GHI CHÚ ĐỔI VAI KHI ĐÓNG DỞ — Ban lãnh đạo 24/08/2026: *"Ở bước thất bại chỉ cần ghi lý
   * do thất bại"*.
   *
   * 🔴 KHÔNG THÊM Ô MỚI, ĐỔI VAI Ô ĐANG CÓ. Hộp này đã có đúng một ô chữ tự do; thêm ô thứ hai
   * chỉ để hỏi lý do là bắt người dùng nhìn hai ô gần giống nhau rồi đoán điền vào đâu. Đổi nhãn
   * thì ô nói đúng việc của nó ở từng ngữ cảnh.
   *
   * 🔴 BẮT BUỘC nhập khi đóng dở, còn các bước khác vẫn để trống được. Hồ sơ vào cột Thất bại mà
   * không ai biết vì sao là thứ mất giá trị nhanh nhất: một tuần sau không ai nhớ, mà đây lại là
   * dữ liệu để thống kê nhà cung cấp trượt và giải trình với công trình.
   */
  const laDongDo = denBuoc === "that_bai";
  const nhanOChu = laDongDo ? "Lý do thất bại" : "Những việc đã hoàn thành?";
  const thieuLyDo = laDongDo && ghiChu.trim() === "";
  /**
   * ★ SL BÁO GIÁ — trường bắt buộc riêng của bước ② trong ảnh Base (*"SL Báo giá *"*).
   *
   * `""` = chưa chọn. Base cũng để "-- Lựa chọn --" và đánh dấu sao đỏ: người chuyển bước
   * phải quyết định đi hỏi mấy nhà cung cấp, vì đó là việc đầu tiên của bước sau.
   */
  const [soBaoGia, setSoBaoGia] = useState("");

  // Mỗi lần mở lại là ô ghi chú trắng. Giữ nội dung cũ thì lần sau người dùng vô tình gửi
  // lại ghi chú của hồ sơ khác — nhật ký ghi sai mà không ai để ý.
  useEffect(() => {
    if (mo) {
      setGhiChu("");
      setSoBaoGia("");
    }
  }, [mo]);

  const nhanDich = NHAN_GIAI_DOAN[denBuoc]?.nhan ?? denBuoc;
  const nhanNguon = NHAN_GIAI_DOAN[tuBuoc]?.nhan ?? tuBuoc;
  const caiDatDich = caiDatCuaBuoc(cauHinh, denBuoc);
  const hanDich = cauHinh.hanGioTheoBuoc?.[denBuoc] ?? 0;
  /** Bước ② mới hỏi số báo giá — các bước khác không có trường này (đúng như Base). */
  const hoiSoBaoGia = denBuoc === "yeu_cau_bao_gia";
  /** Việc trong danh sách mà người dùng CHƯA tích — tính theo dữ liệu thật, cập nhật ngay. */
  const conViecChuaTich = congViecChuaXong.filter((cv) => !daXong.includes(cv.ma)).length;
  /**
   * Nút khoá khi: còn việc bắt buộc chưa tích, HOẶC chưa chọn số báo giá ở bước ②.
   *
   * 🔴 Tích trong hộp KHÔNG PHẢI đường đi tắt: người dùng vẫn phải xác nhận từng việc, chỉ là
   * làm ngay tại chỗ thay vì bị đuổi sang màn khác. Luật chặn vẫn là `congViecChuaXongCuaBuoc`.
   */
  /**
   * `thieuLyDo`: đóng dở mà chưa ghi lý do — xem `laDongDo`. Cùng nếp với "SL Báo giá" của
   * bước ②: trường bắt buộc thì khóa nút, không cho bấm rồi mới báo lỗi.
   *
   * 🔴 ĐÓNG DỞ KHÔNG BỊ KHÓA BỞI CÔNG VIỆC BẮT BUỘC — sửa 24/08/2026.
   *
   * Đo được: hồ sơ ở bước ① còn treo việc "Checkin hàng tồn kho"; công trình hủy nhu cầu vật tư
   * nên chẳng ai cần kiểm tồn kho nữa. Nhưng `conViecChuaTich` khóa nút cho **cả ba hướng**
   * (tiến / lùi / đóng dở), nên app buộc người dùng **tích một việc không hề làm** — tức ghi một
   * dữ liệu SAI vào hồ sơ — chỉ để hủy nó. Người dùng sẽ tích bừa, và từ đó ô "đã hoàn thành"
   * mất hết ý nghĩa.
   *
   * ⚠️ Việc bắt buộc là điều kiện để ĐI TIẾP trong quy trình. Hủy hồ sơ là RA KHỎI quy trình —
   * hai chuyện khác nhau. Chốt duy nhất còn lại cho hướng này là **phải ghi lý do**, và đó là
   * chốt đúng: cần biết vì sao hủy, không cần biết tồn kho bao nhiêu.
   */
  /**
   * ★★ CÒN ĐIỀU KIỆN CHƯA GỠ THÌ KHÓA NÚT — Ban lãnh đạo 25/08/2026: *"Phải được duyệt thì mới
   * nhảy"*.
   *
   * 🔴 ĐÍNH TỆP KHÔNG PHẢI LÀ DUYỆT. Đính xong chỉ làm danh sách này rỗng đi, tức **mở khóa** nút;
   * thẻ chuyển bước khi và chỉ khi có người bấm nút đó. Kiến trúc đã bảo đảm phần còn lại:
   * `xacDinhGiaiDoan` suy giai đoạn từ đơn hàng · phiếu nhận · trạng thái PO, **không đọc tệp đính
   * kèm**, nên không có đường nào để một cú đính kèm tự đẩy thẻ sang cột.
   *
   * ⚠️ KHÔNG khóa khi đang ĐÓNG DỞ, cùng lý do với công việc bắt buộc (xem chú thích dưới): hủy
   * hồ sơ là RA KHỎI quy trình, đòi đủ chứng từ để hủy là bắt người dùng đi xin giấy tờ cho một
   * việc sắp bỏ.
   */
  const conDieuKienChuaGo = !laDongDo && dieuKienConVuong.length > 0;
  const bikhoa =
    (!laDongDo && conViecChuaTich > 0) ||
    conDieuKienChuaGo ||
    (hoiSoBaoGia && soBaoGia === "") ||
    thieuLyDo ||
    /* 🔴 CHẶN CỨNG — luật nói bước này không đi được, không gỡ bằng cách đính thêm gì.
       Xem chú thích `chanCung`. */
    Boolean(chanCung);

  return (
    <Dialog open={mo} onOpenChange={(v) => !v && onDong()}>
      {/* Dàn ngang cho gọn (Ban lãnh đạo 15/08/2026): hộp rộng ra, các trường xếp hai cột nên
          hộp ngắn lại rõ rệt — trước đây bốn khối xếp dọc làm hộp cao gần hết màn hình, phải
          cuộn mới thấy nút bấm. Màn hẹp tự về một cột. */}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chuyển nhiệm vụ sang giai đoạn tiếp theo</DialogTitle>
          <DialogDescription>
            Vui lòng hoàn thành các bước sau trước khi chuyển{" "}
            <strong className="text-text-primary">{deNghi?.code ?? "hồ sơ"}</strong> từ{" "}
            <strong className="text-text-primary">{nhanNguon}</strong> đến{" "}
            <strong className="text-text-primary">{nhanDich}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* ===== ② ĐẦU VÀO CHO GIAI ĐOẠN ===== */}
          <div className="flex flex-col gap-2 border-t border-divider pt-3">
            <p className="text-center text-xs font-semibold tracking-wide text-text-desc uppercase">
              Đầu vào cho giai đoạn{" "}
              <span className="rounded bg-muted px-1.5 py-0.5 normal-case text-text-primary">
                {nhanDich}
              </span>
            </p>

            {/* Hai ô KHÓA nằm cạnh nhau — chúng chỉ để đọc, ngắn, không đáng chiếm hai hàng. */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {/* Ô KHÓA 1 — cách giao việc của bước đích. */}
              <OKhoa nhan="Giao lại cho" giaTri={NHAN_CACH_GIAO_VIEC[caiDatDich.cachGiaoViec]} />

              {/* Ô KHÓA 2 — thời hạn chuẩn của bước đích (Base ghi "DURATION"). */}
              <OKhoa
                nhan="Thời hạn của bước"
                giaTri={hanDich > 0 ? `${hanDich} giờ` : "Không đặt thời hạn"}
              />
            </div>

            {/* Hai ô NHẬP cũng xếp cạnh nhau khi có cả hai. `items-start` để ô ngắn không bị
                kéo cao bằng ô dài. */}
            <div
              className={`grid grid-cols-1 items-start gap-2 ${hoiSoBaoGia ? "sm:grid-cols-2" : ""}`}
            >
            {/* Ô NHẬP — "Những việc đã hoàn thành?" đúng chữ trong ảnh Base; đổi thành
                "Lý do thất bại" khi đang đóng dở (xem `laDongDo`). */}
            <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3">
              <Label htmlFor="ghi-chu-chuyen-buoc">
                {nhanOChu}
                {/* Dấu sao đỏ theo đúng nếp ô "SL Báo giá" bên cạnh — bắt buộc thì phải thấy. */}
                {laDongDo && <span className="text-danger"> *</span>}
              </Label>
              <textarea
                id="ghi-chu-chuyen-buoc"
                rows={3}
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none"
              />
              {/* 📌 ĐÃ BỎ placeholder gợi ý và câu "Để trống cũng được. Có nội dung thì app ghi
                  vào Lịch sử…" (Ban lãnh đạo 16/08/2026). Nhãn ô đã nói rõ phải điền gì, và
                  trường không có dấu sao đỏ thì đương nhiên không bắt buộc. */}
              {laDongDo && (
                <span className="text-xs text-text-desc">
                  Lý do này hiện trên thẻ ở cột Thất bại và lưu vào Lịch sử hồ sơ.
                </span>
              )}
            </div>

            {/* ★ SL BÁO GIÁ — trường bắt buộc của bước ②, đúng ảnh Base (có dấu sao đỏ).
                Chỉ hỏi khi chuyển sang bước "Yêu cầu NCC báo giá": các bước khác không cần. */}
            {hoiSoBaoGia && (
              <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3">
                <Label htmlFor="so-bao-gia-chuyen-buoc">
                  SL Báo giá <span className="text-danger">*</span>
                </Label>
                <select
                  id="so-bao-gia-chuyen-buoc"
                  value={soBaoGia}
                  onChange={(e) => setSoBaoGia(e.target.value)}
                  className="min-h-11 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none"
                >
                  <option value="">— Lựa chọn —</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {String(n).padStart(2, "0")} báo giá
                    </option>
                  ))}
                </select>
                {/* GIỮ luật công ty (đây là quy định thật, sinh từ cấu hình nên không nói dối
                    khi ngưỡng đổi), BỎ vế chỉ đường "muốn khác nhau từng dòng thì sửa ở bảng
                    Phân bổ công việc" — Ban lãnh đạo 16/08/2026. */}
                <p className="text-xs text-text-desc">
                  Quy trình yêu cầu tối thiểu{" "}
                  <strong>
                    {String(cauHinh.soBaoGiaToiThieu).padStart(2, "0")} báo giá
                  </strong>{" "}
                  với đơn từ {chuTien(cauHinh.nguongHaiBaoGia)} đồng trở lên.
                </p>
              </div>
            )}
            </div>
          </div>

          {/* ===== ②b ĐIỀU KIỆN CHUYỂN BƯỚC — ĐÍNH KÈM NGAY TẠI ĐÂY =====
              ★★ Ban lãnh đạo 25/08/2026: *"Kéo qua bước phải hiển thị các trường nhập nhanh các
              điều kiện chuyển bước"*, sau khi báo ba lần rằng kéo thả và bấm nút không giống nhau.

              🔴 TRƯỚC HÔM NAY chỗ này là NGÕ CỤT: kéo thẻ mà thiếu chứng từ thì app hiện một toast
              đỏ rồi thôi — người dùng đang đứng ở bảng quy trình, phải tự đoán đường sang trang chi
              tiết, cuộn tìm đúng khối, đính kèm, rồi quay về kéo lại. Nay đính ngay tại đây.

              🔴 KHÔNG MỞ HỘP THOẠI LỒNG NHAU. Các ô dưới đây là ô đính kèm tại chỗ, dùng lại đúng
              hai thành phần trang chi tiết đang dùng (`KhuBaoGiaTheoSoLuong`, `OChungTuBatBuoc`) —
              nên tệp đính ở đây và đính ở trang chi tiết vào **cùng một chỗ**, không sinh hai
              đường lưu khác nhau.

              📌 CHỈ BÀY, KHÔNG TỰ QUYẾT ĐIỀU KIỆN. Danh sách do `dsDieuKienConVuong` sinh ở tầng
              quy trình — cùng hàm mà luật chặn hỏi, nên hộp không bao giờ nói khác thứ app chặn. */}
          {dieuKienConVuong.length > 0 && deNghi && (
            <div className="flex flex-col gap-3 border-t border-divider pt-3">
              <p className="text-center text-xs font-semibold tracking-wide text-text-desc uppercase">
                Điều kiện chuyển bước còn thiếu
              </p>
              {dieuKienConVuong.map((dk) => (
                <OGoDieuKien key={dk.ma} dieuKien={dk} deNghi={deNghi} />
              ))}
              {/* Nói trước là còn một nút phải bấm — người dùng đính tệp xong rất dễ tưởng xong
                  việc rồi đóng hộp, và thẻ đứng nguyên cột cũ mà không hiểu vì sao. */}
              <p className="text-xs text-warning-soft">
                Bổ sung đủ các mục trên thì nút bên dưới mở khóa. Thẻ chỉ chuyển bước sau khi bấm
                nút đó.
              </p>
            </div>
          )}

          {/* ===== ③ CÔNG VIỆC ĐANG CHỜ Ở GIAI ĐOẠN TRƯỚC =====
              ★ TÍCH ĐƯỢC NGAY TẠI ĐÂY — Ban lãnh đạo 16/08/2026: *"khi trưởng bộ phận kéo sang
              bước 2 là phải hiện xác nhận đã check hàng tồn kho, nếu chưa tích xác nhận thì
              chưa cho chuyển"*.

              🔴 Trước đây chỗ này chỉ liệt kê việc còn treo rồi bảo *"tích ở trang chi tiết đề
              nghị"* — người dùng đang đứng ở bảng quy trình, bị đuổi sang màn khác, làm xong
              lại phải quay về kéo lại. Nay tích ngay trong hộp, xong là nút mở khóa. */}
          {congViecChuaXong.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-divider pt-3">
              <p className="text-center text-xs font-semibold tracking-wide text-text-desc uppercase">
                Công việc đang chờ xử lý ở giai đoạn trước
              </p>
              <p className="text-xs text-text-desc">{nhanNguon}</p>
              <ul className="flex flex-col gap-1.5">
                {congViecChuaXong.map((cv) => {
                  const daTich = daXong.includes(cv.ma);
                  return (
                    <li key={cv.ma}>
                      {/* Cả dòng là vùng bấm — vùng chạm rộng hơn nhiều so với riêng ô tích,
                          đúng luật ≥44px của Design System. */}
                      <label
                        className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                          daTich
                            ? "border-success bg-success-bg"
                            : "border-warning/40 bg-warning-bg hover:border-warning"
                        }`}
                      >
                        <Checkbox
                          checked={daTich}
                          onCheckedChange={(v: boolean) => onTichCongViec(cv, Boolean(v))}
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-sm font-medium text-text-primary">{cv.ten}</span>
                          {cv.moTa && <span className="text-xs text-text-desc">{cv.moTa}</span>}
                        </span>
                        {/* Trạng thái luôn có CẢ MÀU LẪN CHỮ (Design System V1.1). */}
                        <StatusBadge
                          label={daTich ? "Hoàn thành" : "Chưa xong"}
                          tone={daTich ? "success" : "warning"}
                        />
                      </label>
                    </li>
                  );
                })}
              </ul>
              {conViecChuaTich > 0 && (
                <p className="text-xs text-warning-soft">
                  Còn {conViecChuaTich} việc chưa xác nhận — tích xong mới chuyển bước được.
                </p>
              )}
            </div>
          )}

          {/* ===== Việc app sẽ làm + cảnh báo ===== */}
          <div className="flex flex-col gap-2 border-t border-divider pt-3">
            {/* 🔴 LÝ DO CHẶN CỨNG đứng TRƯỚC `seLam`: ca này `seLam` rỗng (xem nhánh `default`
                của `dungXacNhanKeoTha`), nên nếu không in dòng này thì hộp mở ra trống trơn với
                một cái nút mờ — người dùng không biết vì sao. */}
            {chanCung && (
              <p className="flex items-start gap-1.5 text-sm text-danger">
                <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{chanCung}</span>
              </p>
            )}
            {seLam && <p className="text-sm text-text-secondary">{seLam}</p>}
            {canhBao.length > 0 && (
              <ul className="flex flex-col gap-1">
                {canhBao.map((c) => (
                  <li key={c} className="flex items-start gap-1.5 text-xs text-warning-soft">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            variant={nguyHiem ? "destructive" : "default"}
            disabled={bikhoa}
            onClick={() =>
              onXacNhan(ghiChu.trim(), hoiSoBaoGia && soBaoGia ? Number(soBaoGia) : undefined)
            }
          >
            {nhanNut}
          </Button>
          {/* 🔴 ĐƯỜNG RA TRANG ĐẦY ĐỦ — xem chú thích `duongDanChiTiet`. Đặt TRƯỚC "Đóng lại"
              để nó không bị coi là nút phụ của nút phụ. */}
          {duongDanChiTiet && (
            <Button
              variant="outline"
              className="w-full"
              nativeButton={false}
              render={<Link href={duongDanChiTiet} />}
            >
              <ExternalLink className="size-4 shrink-0" aria-hidden />
              Mở trang đầy đủ của đề nghị
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={onDong}>
            Đóng lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ★★ MỘT Ô GỠ MỘT ĐIỀU KIỆN — Ban lãnh đạo 25/08/2026.
 *
 * 🔴 CHỌN Ô THEO `ma`, KHÔNG THEO BƯỚC. Cùng một điều kiện có thể chặn ở nhiều cửa (hóa đơn VAT
 * chặn cả ⑦→⑧ lẫn nút "Hoàn thành quy trình"); bám theo bước là phải nhớ liệt kê đủ mọi cửa, kiểu
 * danh sách sớm muộn thiếu một mục rồi lọt im lặng.
 *
 * 🔴 TÁI SỬ DỤNG ĐÚNG THÀNH PHẦN CỦA TRANG CHI TIẾT, không dựng ô mới. Chúng ghi qua
 * `datTepVaoOGiaiDoan` với đúng nhãn mà các hàm luật (`tepHopDong`, `tepHoaDonVAT`,
 * `tepBaoGiaDaCo`) đi tìm. Dựng ô riêng ở đây là mở đường cho tệp đính trong hộp không được luật
 * nhận ra — người dùng đính xong mà nút vẫn khóa.
 *
 * ⚠️ Nhánh `default` CỐ Ý chỉ in câu chữ: nó chỉ tới được khi ai đó thêm mã điều kiện mới mà quên
 * khai ô. Khi ấy hộp vẫn nói rõ đang thiếu gì (không im lặng), còn nút thì vẫn khóa — an toàn
 * hơn là cho đi.
 */
function OGoDieuKien({
  dieuKien,
  deNghi,
}: {
  dieuKien: DieuKienConVuong;
  deNghi: DeNghiMuaHang;
}) {
  const { ghiLyDoThieuChungTu } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  /* Cùng điều kiện quyền với trang chi tiết (`duocSuaTepBuoc`) — hai nơi đính vào cùng một chỗ
     thì không được nơi cho nơi cấm. */
  const duocSua = quyen.phanBoCongViec || quyen.lapPO;

  /**
   * `hienCau` — có in câu vướng mắc ở đầu khối không.
   *
   * 🔴 MẶC ĐỊNH IN, NHƯNG TẮT ĐI KHI Ô BÊN TRONG ĐÃ NÓI ĐÚNG CÂU ĐÓ. Đo được ngay lần chạy thử
   * đầu tiên (25/08/2026): `KhuBaoGiaTheoSoLuong` tự in sẵn dòng cảnh báo *"Quy trình yêu cầu 2
   * bản báo giá, hiện còn thiếu 2 bản…"*, nên hộp hiện **y hệt câu đó hai lần liền nhau** — thừa
   * gần 150 ký tự trong một hộp vốn đã dài, đúng thứ Ban lãnh đạo bảo dẹp ngày 24/08/2026
   * (*"Tối giản ký tự thông báo lại"*).
   *
   * ⚠️ ĐỪNG bỏ hẳn câu này cho gọn: các ô khác (hợp đồng, hóa đơn VAT) KHÔNG tự nói lý do, tắt
   * chung là người dùng thấy một ô đính kèm mọc ra giữa hộp mà không biết vì sao nó ở đó.
   */
  const khung = (noiDung: React.ReactNode, hienCau = true) => (
    <div className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning-bg p-3">
      {hienCau && <p className="text-xs text-text-secondary">{dieuKien.cau}</p>}
      {noiDung}
    </div>
  );

  switch (dieuKien.ma) {
    case "thieu_ban_bao_gia":
      /* `false`: khu báo giá tự in đúng câu này rồi — xem chú thích `hienCau` ở trên. */
      return khung(
        <KhuBaoGiaTheoSoLuong deNghi={deNghi} duocSua={duocSua} chanXoaTep />,
        false,
      );

    case "thieu_hop_dong":
      return khung(
        <>
          <OChungTuBatBuoc
            deNghi={deNghi}
            maGiaiDoan={BUOC_DINH_KEM_HOP_DONG}
            nhanO={NHAN_TEP_HOP_DONG}
            tieuDe={TEN_HIEN_HOP_DONG}
            batBuoc
            duocSua={duocSua}
            tepDaCo={tepHopDong(deNghi)}
          />
          {/* ★ ĐƯỜNG THỨ HAI: chưa có bản ký thì GHI LÝ DO cũng đi tiếp được (Ban lãnh đạo
              23/08/2026). Không bày ô này ở đây là hồ sơ chưa kịp ký hợp đồng bị kẹt cứng trong
              hộp — đúng cái ngõ cụt hôm nay đang đi sửa, chỉ đổi chỗ. */}
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor="ly-do-thieu-hd-hop" className="shrink-0">
              Hoặc ghi lý do chưa có
            </Label>
            <Input
              id="ly-do-thieu-hd-hop"
              className="min-w-48 flex-1"
              /* 🔴 `defaultValue` + ghi khi RỜI Ô, giống hệt trang chi tiết: mỗi lần ghi là một
                 dòng nhật ký và một lần đẩy lên kho chung của cả phòng. Ghi theo từng ký tự thì
                 gõ một câu 60 chữ thành 60 dòng nhật ký. */
              defaultValue={lyDoThieuHopDong(deNghi)}
              disabled={!duocSua}
              placeholder="Ví dụ: hai bên đã thống nhất qua email, bản ký sẽ có trong tuần này."
              onBlur={(e) => {
                const loi = ghiLyDoThieuChungTu(
                  deNghi.id,
                  KHOA_LY_DO_THIEU_HOP_DONG,
                  e.target.value,
                  nguoiDung.tenHienThi,
                );
                if (loi) toast.error("Chưa ghi được lý do", { description: loi });
              }}
            />
          </div>
        </>,
      );

    case "thieu_hoa_don_vat":
      return khung(
        <OChungTuBatBuoc
          deNghi={deNghi}
          maGiaiDoan={BUOC_DINH_KEM_HO_SO_THANH_TOAN}
          nhanO={NHAN_TEP_HOA_DON_VAT}
          tieuDe="Hóa đơn VAT"
          batBuoc
          duocSua={duocSua}
          tepDaCo={tepHoaDonVAT(deNghi)}
        />,
      );

    case "chua_tich_unc":
      return khung(
        <OChungTuBatBuoc
          deNghi={deNghi}
          maGiaiDoan={BUOC_DINH_KEM_HO_SO_THANH_TOAN}
          nhanO={NHAN_TEP_UNC}
          tieuDe="Ủy nhiệm chi"
          duocSua={duocSua}
          tepDaCo={tepUNC(deNghi)}
        />,
      );

    default:
      return khung(null);
  }
}

/**
 * Ô chỉ đọc kèm biểu tượng ổ khóa — đúng cách Base thể hiện các giá trị lấy từ cài đặt quy
 * trình. Hiện để người chuyển bước BIẾT luật đang áp dụng, không phải để sửa tại chỗ.
 */
function OKhoa({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border border-border bg-muted px-3 py-2">
      <span className="flex min-w-0 flex-col">
        <span className="text-xs text-text-desc">{nhan}</span>
        <span className="text-sm text-text-primary">{giaTri}</span>
      </span>
      <Lock className="mt-0.5 size-3.5 shrink-0 text-text-desc" aria-hidden />
    </div>
  );
}
