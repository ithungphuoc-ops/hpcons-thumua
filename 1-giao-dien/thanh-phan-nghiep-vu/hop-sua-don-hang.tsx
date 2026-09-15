"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Info, Lock, Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";
import { useDuLieu, type ThayDoiDonHang } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { dongPOBiKhoaNoiDung, laDongHang } from "@/2-quy-trinh/tinh-toan";
import type { DongPO, DonDatHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * ★★★ HỘP "SỬA ĐƠN HÀNG" — thêm 31/08/2026, Sếp demo bằng Artifact rồi chốt qua nhiều vòng.
 *
 * 🔴 CHỈ BÀY 3 NHÓM TRƯỜNG ĐÚNG NHƯ `ThayDoiDonHang` NHẬN — xem chú thích đầy đủ ở đó
 * (`3-du-lieu/kho-du-lieu.tsx`). Nhóm 3 (mã PO, trạng thái, đề nghị nguồn, mã dự án) không có ô
 * nào ở đây — sửa những thứ đó qua đúng luồng riêng của nó ("+ Gắn đề nghị", v.v.), không trộn
 * vào hộp này.
 *
 * 🔴 KHÓA TỪNG DÒNG THEO PHIẾU NHẬN — component TỰ tính lại đúng luật `suaDonHang` đã kiểm ở
 * tầng ghi (dòng có phiếu nhận "da_nhap_kho" thì khóa nội dung/số lượng) để BÀY ĐÚNG trạng thái
 * khóa, không hứa sửa được rồi bị cửa ghi từ chối im lặng.
 *
 * ---
 *
 * ⚠️⚠️ 13/09/2026 — VIỆC "MỞ LẠI ĐÚNG FORM LẬP ĐƠN ĐẦY ĐỦ" ĐÃ DỪNG GIỮA CHỪNG CÓ CHỦ Ý.
 *
 * Sếp chốt 13/09/2026: nút "Sửa đơn hàng" phải mở lại **đúng form lập đơn đầy đủ**, giữ nguyên dữ
 * liệu đã nhập — *"làm đầy đủ, không làm bản rút gọn"*. Việc đó **CHƯA LÀM** trong đợt này, và đây
 * là lý do đo được chứ không phải ngại khó:
 *
 * 🔴 `suaDonHang` chỉ nhận đúng kiểu `ThayDoiDonHang` (`3-du-lieu/kho-du-lieu.tsx` ~dòng 241).
 * Bày form đầy đủ ra mà tầng ghi không nhận thì **7 nhóm ô dưới đây bấm Lưu xong sẽ im lặng mất
 * thay đổi** — đúng điều CLAUDE.md §3.5 cấm (*"đừng để giao diện hứa một việc app không làm"*):
 *
 *   ❌ `mauPO` (mẫu in PO)                    ❌ `ghiChuHopDongNCC` ("Theo hợp đồng")
 *   ❌ chiết khấu (`kieuChietKhau`/`chietKhau`/`tyLeChietKhau`)   ❌ thuế suất chung (`thueSuatGTGT`)
 *   ❌ `dieuKhoanGiaoHang` · `camKetThoaThuan`  ❌ `loaiTien` · `ngayLapPO`
 *   ❌ `tenCongTrinh` · `maHopDongCDT` · `dieuKhoanThanhToan` · `soNgayDuocNo`
 *
 * Bốn nhóm cuối nằm ở CHỨNG TỪ GIÁ (`GiaDonDatHang`) — tách document cố ý theo nguyên tắc dữ liệu
 * số 3 của dự án, nên không thể nhét vào `DonDatHang` cho tiện.
 *
 * 📌 Mở được đường đó phải sửa `3-du-lieu/kho-du-lieu.tsx` — **ngoài phạm vi tệp được giao phiên
 * này, và có agent khác đang sửa tệp khác cùng lúc**. Bản mô tả cách làm đầy đủ (tệp · hàm · tham
 * số · thứ tự bước) đã báo Sếp quyết, không tự làm liều.
 *
 * ✅ PHẦN ĐÃ LÀM ĐƯỢC NGAY, VÌ KHÔNG CẦN SỬA TẦNG GHI: ô **"Ngày giao đến ngày"**
 * (`ngayGiaoDenNgay`) — `ThayDoiDonHang` đã khai sẵn trường này từ trước nhưng **chưa nơi gọi nào
 * truyền**, tức một khả năng dựng xong rồi bỏ quên. Xem state `ngayGiaoDen` ở NHÓM 2.
 *
 * 🔴 ĐỪNG CHÉP TỆP NÀY RA BẢN THỨ HAI khi làm tiếp. Cách an toàn đã chốt là thêm **CHẾ ĐỘ SỬA cho
 * chính `form-lap-don-mua-hang.tsx`** (prop `poDangSua?`), giữ nguyên đường lập đơn mới — hai bản
 * form chép tay sẽ lệch nhau sau vài lần sửa, đúng lỗi dự án đã dính.
 */

/**
 * ★★★ MÃ RIÊNG CHO CA "KHÔNG CÓ GÌ THAY ĐỔI NÊN KHÔNG GHI" — thêm 15/09/2026.
 *
 * 🔴 VÌ SAO CẦN: `suaDonHang` (`3-du-lieu/kho-du-lieu.tsx`) hiện trả `null` cho **HAI nghĩa khác
 * hẳn nhau** — (a) "đã ghi xong" và (b) "so ra không có gì đổi nên KHÔNG ghi gì cả"
 * (chỗ `if (moc.length === 0) return null;`, ~dòng 1999). Giao diện đọc `null` rồi báo xanh
 * *"Đã lưu thay đổi"* cho cả hai — tức app **nói dối** ở ca (b): người dùng tin là đã lưu, trong
 * khi không một dòng nào được ghi và nhật ký cũng không có dấu vết. Đúng thứ CLAUDE.md §3.5 cấm
 * (*"đừng để giao diện hứa một việc app không làm"*).
 *
 * 🔴🔴 GIÁ TRỊ NÀY PHẢI KHỚP VỚI THỨ TẦNG GHI TRẢ VỀ — xem `suaDonHang` trong
 * `3-du-lieu/kho-du-lieu.tsx`. Hiện tầng ghi **CHƯA** phân biệt hai ca (một phiên khác đang vá),
 * nên chừng nào nó còn trả `null` thì nhánh dưới không bao giờ chạy và hành vi y như cũ —
 * KHÔNG hỏng gì, chỉ là chưa có tác dụng.
 *
 * 📌 KHI TẦNG GHI ĐÃ CÓ HẰNG/KIỂU CỦA NÓ: **xoá hằng cục bộ này và `import` hằng của tầng ghi**.
 * Đây cố ý là MỘT chỗ duy nhất phải sửa — đừng rải chuỗi này ra nhiều nơi trong tệp.
 */
const MA_KHONG_CO_THAY_DOI = "KHONG_CO_THAY_DOI";

export function HopSuaDonHang({ po }: { po: DonDatHang }) {
  const { phieuNhan, giaDonHang, suaDonHang } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  const [mo, setMo] = useState(false);

  const laQuanLy = quyen.suaPODaChot;
  const laNguoiPhuTrach = po.nguoiPhuTrachUid === nguoiDung.uid;
  const duocSua = laQuanLy || laNguoiPhuTrach;

  const giaHienTai = giaDonHang.find((g) => g.poId === po.id);

  /** Dòng đang có phiếu nhận tham chiếu — khóa nội dung/số lượng, đúng luật DÙNG CHUNG với
   *  tầng ghi `suaDonHang`. Xem chú thích đầy đủ ở `dongPOBiKhoaNoiDung`. */
  const dongDaNhan = useMemo(() => {
    return dongPOBiKhoaNoiDung(phieuNhan.filter((p) => p.poId === po.id));
  }, [phieuNhan, po.id]);

  // ------------------------------------------------------------
  // NHÓM 1
  // ------------------------------------------------------------
  const [nguoiLienHeNCC, setNguoiLienHeNCC] = useState(po.nguoiLienHeNCC ?? "");
  const [diaChiNCC, setDiaChiNCC] = useState(po.diaChiNCC ?? "");
  const [maSoThueNCC, setMaSoThueNCC] = useState(po.maSoThueNCC ?? "");
  const [nguoiNhanHangTen, setNguoiNhanHangTen] = useState(po.nguoiNhanHangTen ?? "");
  const [nguoiNhanHangSdt, setNguoiNhanHangSdt] = useState(po.nguoiNhanHangSdt ?? "");
  const [diaDiemGiaoHang, setDiaDiemGiaoHang] = useState(po.diaDiemGiaoHang ?? "");
  const [dieuKienGiaoHang, setDieuKienGiaoHang] = useState(po.dieuKienGiaoHang ?? "");
  const [ghiChuThoiGianGiao, setGhiChuThoiGianGiao] = useState(po.ghiChuThoiGianGiao ?? "");
  const [ghiChu, setGhiChu] = useState(po.ghiChu ?? "");
  const [dieuKhoanKhac, setDieuKhoanKhac] = useState(po.dieuKhoanKhac ?? "");
  const [thamChieu, setThamChieu] = useState(po.thamChieu ?? "");

  // ------------------------------------------------------------
  // NHÓM 2
  // ------------------------------------------------------------
  const [supplierTen, setSupplierTen] = useState(po.supplierTen);
  const [ngayGiaoDuKien, setNgayGiaoDuKien] = useState(po.ngayGiaoDuKien);
  /**
   * ★ NGÀY GIAO **ĐẾN NGÀY** — thêm 13/09/2026. Sếp liệt ô này trong danh sách những thứ hộp rút
   * gọn còn thiếu so với form lập đơn đầy đủ.
   *
   * ✅ VÌ SAO LÀM ĐƯỢC NGAY MÀ KHÔNG ĐỤNG TẦNG GHI: `ThayDoiDonHang.ngayGiaoDenNgay` ĐÃ CÓ SẴN
   * trong `3-du-lieu/kho-du-lieu.tsx` (khoảng dòng 255) và `suaDonHang` đã xử lý đủ (dòng ~1890
   * tính `doiNgayGiao`, dòng ~2014 ghi vào đơn). Chỉ là **CHƯA CÓ NƠI GỌI NÀO TRUYỀN NÓ** — một
   * khả năng đã dựng xong nhưng nằm chết. Ô này nối vào đúng đường có sẵn, không thêm trường mới.
   *
   * 🔴 QUY ƯỚC `""` KHÁC `undefined` — đọc kỹ trước khi đổi: `""` nghĩa là **XOÁ ngày kết thúc**
   * (đơn quay về giao gọn một ngày), `undefined` nghĩa là **không đụng tới trường này**. State ở
   * đây luôn là chuỗi nên luôn gửi `""` hoặc một ngày thật — không bao giờ gửi `undefined`, vì
   * người dùng xoá trắng ô là họ CỐ Ý bỏ khoảng ngày, phải ghi nhận đúng ý đó.
   *
   * 💰 CÁI GIÁ / RỦI RO: ô này khiến `doiNgayGiao` bật lên trong nhiều trường hợp hơn trước →
   * BẮT LÝ DO nhiều hơn, kể cả với quản lý. Đó là ĐÚNG luật đã có (`suaDonHang`: *"Đổi ngày giao
   * phải ghi lý do, dù là ai sửa"*) — đổi cam kết giao hàng với NCC không phải việc nội bộ.
   */
  const [ngayGiaoDen, setNgayGiaoDen] = useState(po.ngayGiaoDenNgay ?? "");
  const [items, setItems] = useState<DongPO[]>(po.items);
  const [gia, setGia] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {};
    for (const l of giaHienTai?.lines ?? []) m[l.sttDong] = String(l.donGia);
    return m;
  });

  /* 🔴 PHẢI TÍNH GIỐNG HỆT `suaDonHang` (kho-du-lieu.tsx ~dòng 1888), kể cả phép `|| undefined`.
     Lệch một ly là hộp thoại bảo "không cần lý do" rồi tầng ghi từ chối — người dùng gõ xong cả
     hộp mới bị chặn, đúng kiểu lỗi mà chú thích `hopLe` trong form lập đơn đã dặn tránh.
     📌 `("" || undefined) !== undefined` là `false` — nên đơn vốn không có ngày kết thúc mà ô vẫn
     để trống thì KHÔNG bị coi là "đã đổi ngày giao". Không bắt lý do oan. */
  const doiNgayGiao =
    ngayGiaoDuKien !== po.ngayGiaoDuKien ||
    (ngayGiaoDen || undefined) !== po.ngayGiaoDenNgay;
  const doiNCC = supplierTen.trim() !== po.supplierTen && supplierTen.trim() !== "";
  const batBuocLyDo = !laQuanLy || doiNgayGiao || doiNCC;

  /**
   * 🔴 KHOẢNG NGÀY NGƯỢC THÌ CHẶN LƯU — cùng luật với `khoangGiaoNguoc` ở form lập đơn
   * (`form-lap-don-mua-hang.tsx`, khoảng dòng 1895) và cùng lý do đã ghi ở đó: thuộc tính `min`
   * của ô ngày chỉ là GỢI Ý của trình duyệt, dán ngày vào ô hoặc gõ tay vẫn lọt qua.
   *
   * ⚠️ CÁI GIÁ PHẢI NÓI THẲNG: `suaDonHang` ở tầng ghi **KHÔNG kiểm việc này** (đã đọc, không có
   * dòng nào so hai ngày). Nên đây là chốt DUY NHẤT, và nó chỉ là chốt giao diện — đúng bằng mức
   * bảo vệ mà đường lập đơn mới đang có, không hơn. Ai đưa luật này xuống tầng ghi thì xoá được
   * đoạn ở đây; chừng nào chưa, đừng bỏ nó đi.
   */
  const khoangGiaoNguoc = ngayGiaoDen !== "" && ngayGiaoDen < ngayGiaoDuKien;

  const [lyDo, setLyDo] = useState("");

  function moHop() {
    setNguoiLienHeNCC(po.nguoiLienHeNCC ?? "");
    setDiaChiNCC(po.diaChiNCC ?? "");
    setMaSoThueNCC(po.maSoThueNCC ?? "");
    setNguoiNhanHangTen(po.nguoiNhanHangTen ?? "");
    setNguoiNhanHangSdt(po.nguoiNhanHangSdt ?? "");
    setDiaDiemGiaoHang(po.diaDiemGiaoHang ?? "");
    setDieuKienGiaoHang(po.dieuKienGiaoHang ?? "");
    setGhiChuThoiGianGiao(po.ghiChuThoiGianGiao ?? "");
    setGhiChu(po.ghiChu ?? "");
    setDieuKhoanKhac(po.dieuKhoanKhac ?? "");
    setThamChieu(po.thamChieu ?? "");
    setSupplierTen(po.supplierTen);
    setNgayGiaoDuKien(po.ngayGiaoDuKien);
    /* Dọn về đúng giá trị đang có của đơn — hộp này KHÔNG unmount giữa hai lần mở (nút nằm sẵn
       trên trang chi tiết), nên không đặt lại là lần mở sau còn giữ ngày người dùng vừa gõ rồi
       bấm Hủy. Đúng bài học `setLyDoTaoDocLap("")` ở `donForm()` của form lập đơn. */
    setNgayGiaoDen(po.ngayGiaoDenNgay ?? "");
    setItems(po.items);
    const m: Record<number, string> = {};
    for (const l of giaHienTai?.lines ?? []) m[l.sttDong] = String(l.donGia);
    setGia(m);
    setLyDo("");
    setMo(true);
  }

  function themDongMoi() {
    /* 🔴 TÍNH `sttKeTiep` BÊN TRONG functional update, KHÔNG đọc `items` (closure ngoài) — đọc
       ngoài là snapshot tại thời điểm render, hai lần bấm liên tiếp trước khi React kịp render
       lại (double-click, giữ phím) sẽ tính ra CÙNG một `sttKeTiep` cho cả hai dòng mới, sinh 2
       dòng trùng `sttDong` (trùng React `key`, trùng key trong `gia`, phá giả định "sttDong duy
       nhất trong 1 PO" mà `dongPOBiKhoaNoiDung`/`DongNhanHang.sttDongPO` dựa vào). Tính bên trong
       updater thì luôn thấy đúng `truoc` mới nhất — React áp lần lượt các updater theo hàng đợi,
       không phụ thuộc closure cũ. */
    setItems((truoc) => [
      ...truoc,
      {
        sttDong: Math.max(0, ...truoc.map((d) => d.sttDong)) + 1,
        sttDongDeNghi: undefined,
        tenVatLieu: "",
        donViTinh: "",
        khoiLuongDat: 0,
      },
    ]);
  }

  function sua() {
    /* Chặn TRƯỚC khi hỏi lý do: khoảng ngày ngược là lỗi dữ liệu, ghi lý do hay không cũng không
       làm nó đúng lên được. Xem chú thích `khoangGiaoNguoc` phía trên. */
    if (khoangGiaoNguoc) {
      toast.error("Khoảng ngày giao bị ngược", {
        description: "Ngày giao đến phải bằng hoặc sau ngày giao dự kiến.",
      });
      return;
    }
    if (batBuocLyDo && lyDo.trim() === "") {
      toast.error("Chưa ghi lý do", {
        description: doiNgayGiao
          ? "Đổi ngày giao phải ghi lý do, dù là ai sửa."
          : doiNCC
            ? "Đổi nhà cung cấp phải ghi lý do, dù là ai sửa."
            : "Bạn không phải Trưởng bộ phận/quản trị — sửa đơn hàng phải ghi lý do.",
      });
      return;
    }

    const itemsConLai = items.filter((d) => d.tenVatLieu.trim() !== "");
    const thayDoi: ThayDoiDonHang = {
      nguoiLienHeNCC,
      diaChiNCC,
      maSoThueNCC,
      nguoiNhanHangTen,
      nguoiNhanHangSdt,
      diaDiemGiaoHang,
      dieuKienGiaoHang,
      ghiChuThoiGianGiao,
      ghiChu,
      dieuKhoanKhac,
      thamChieu,
      ngayGiaoDuKien,
      /* LUÔN gửi (chuỗi, có thể rỗng) chứ không `|| undefined`: `""` mang nghĩa "xoá ngày kết
         thúc", còn `undefined` mang nghĩa "không đụng tới". Dùng `|| undefined` ở đây là người
         dùng xoá trắng ô mà ngày cũ vẫn nằm nguyên trong đơn — xoá không có tác dụng, không một
         dòng báo nào. Xem chú thích state `ngayGiaoDen` ở NHÓM 2. */
      ngayGiaoDenNgay: ngayGiaoDen,
      items: itemsConLai,
    };
    if (doiNCC) {
      thayDoi.supplierTen = supplierTen.trim();
      // ⚠️ Đổi tên tự do không tra ra `supplierId` mới trong danh mục — giữ nguyên id cũ để
      // không phá khóa gộp công nợ theo nhà cung cấp bằng một id rác tự sinh ở đây. Đổi hẳn
      // sang một NCC khác trong danh mục là việc lớn hơn, để riêng cho một tính năng khác.
    }
    if (quyen.xemGia && Object.keys(gia).length > 0) {
      /* 🔴 CHỈ giữ giá của dòng CÒN TRONG `itemsConLai` — nút "Xóa dòng" chỉ xóa khỏi `items`,
         `gia` (state riêng, xem NHÓM 2) không tự dọn theo. Gửi cả giá của dòng đã xóa lên là để
         lại một dòng giá "mồ côi", trỏ về `sttDong` không còn tồn tại trong PO nữa. */
      const sttConLai = new Set(itemsConLai.map((d) => d.sttDong));
      /**
       * 🔴🔴 PHẢI MANG THEO `thueSuatGTGT` CŨ — vá 13/09/2026, một lượt soát chéo độc lập bắt được.
       *
       * Bản cũ dựng lại `lines` CHỈ với `sttDong` + `donGia`, mà `suaDonHang`
       * (`3-du-lieu/kho-du-lieu.tsx`) thay **toàn bộ** mảng `lines` bằng mảng này. Hậu quả: mở hộp
       * "Sửa đơn hàng" rồi bấm Lưu — DÙ CHỈ ĐỔI NGÀY GIAO — là xoá sạch thuế suất riêng của từng
       * dòng, tất cả rơi về mức thuế chung. Cái hỏng là TIỀN THUẾ trên chứng từ gửi nhà cung cấp,
       * và không một dòng lỗi nào báo.
       *
       * ⚠️ VÌ SAO TRƯỚC ĐÂY KHÔNG AI THẤY: đến 13/09/2026 thuế theo dòng chỉ vào được bằng đường
       * nhập từ file Excel nên hầu như không có đơn nào dùng. Cùng ngày, ô nhập "% Thuế GTGT" theo
       * dòng được mở lại trong bảng Hàng tiền (Ban lãnh đạo duyệt) — từ đó đây thành đường đi
       * thường xuyên, và lỗi ngủ yên thành lỗi gặp hằng ngày.
       *
       * 📌 Hộp này KHÔNG có ô sửa thuế, nên đúng việc của nó là GIỮ NGUYÊN giá trị cũ, không phải
       * đặt lại. Ai sau này thêm ô sửa thuế vào hộp thì thay `?? cu` bằng giá trị người dùng nhập.
       */
      thayDoi.gia = {
        lines: Object.entries(gia)
          .filter(([sttDong]) => sttConLai.has(Number(sttDong)))
          .map(([sttDong, donGia]) => {
            const stt = Number(sttDong);
            const cu = giaHienTai?.lines.find((l) => l.sttDong === stt);
            return {
              sttDong: stt,
              donGia: Number(donGia) || 0,
              /* `undefined` = dòng này vốn không có thuế riêng, dùng mức chung của đơn. Giữ
                 nguyên `undefined` chứ đừng đặt 0 — 0% là một mức thuế THẬT (hàng không chịu
                 thuế), khác hẳn "chưa đặt". */
              thueSuatGTGT: cu?.thueSuatGTGT,
            };
          }),
      };
    }

    const loi = suaDonHang(po.id, thayDoi, lyDo);
    /* 🔴 CA "KHÔNG CÓ GÌ ĐỔI" ĐI RIÊNG, TRƯỚC CẢ NHÁNH LỖI — xem chú thích `MA_KHONG_CO_THAY_DOI`
       ở đầu tệp. Đây KHÔNG phải lỗi (không có gì sai để sửa), cũng KHÔNG phải thành công (không
       có lần ghi nào xảy ra) — nên báo bằng tông trung tính và nói đúng sự thật. Vẫn đóng hộp vì
       người dùng đã bấm Lưu xong và không còn việc gì để làm tiếp trong hộp. */
    if (loi === MA_KHONG_CO_THAY_DOI) {
      toast.info("Không có gì thay đổi", {
        description: "Nội dung đơn hàng giữ nguyên như cũ nên app không ghi lại gì.",
      });
      setMo(false);
      return;
    }
    if (loi) {
      toast.error("Chưa sửa được", { description: loi });
      return;
    }
    toast.success("Đã lưu thay đổi");
    setMo(false);
  }

  if (!duocSua) return null;
  if (po.trangThai === "hoan_thanh" || po.trangThai === "huy") return null;

  return (
    <>
      <Button size="sm" variant="outline" onClick={moHop}>
        <Pencil className="size-4" aria-hidden />
        Sửa đơn hàng
      </Button>

      <Dialog open={mo} onOpenChange={(v: boolean) => !v && setMo(false)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sửa đơn hàng {po.code}</DialogTitle>
            <DialogDescription>
              {laQuanLy
                ? "Bạn là Trưởng bộ phận/quản trị — sửa xong lưu ngay, trừ ngày giao và đổi nhà cung cấp (luôn cần lý do)."
                : "Bạn là người phụ trách đơn này — mọi thay đổi phải ghi lý do để truy vết."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto pr-1">
            {/**
             * ★ CẢNH BÁO "ĐƠN ĐÃ GỬI SANG KHO CÔNG TRÌNH" — thêm 15/09/2026.
             *
             * 🔴 VÌ SAO PHẢI BÁO: `qlkCtrSyncStatus === "synced"` nghĩa là **một bản PO đã nằm bên
             * app QLK CTR rồi**. Người sửa ở đây không nhìn thấy điều đó, nên rất dễ tưởng mình
             * đang sửa một chứng từ còn nằm trong nội bộ Thu mua — trong khi thủ kho ngoài công
             * trình có thể vẫn đang cầm số lượng và ngày giao CŨ mà nhận hàng.
             *
             * ⚠️ CÂU CHỮ CỐ Ý KHÔNG HỨA "GỬI LẠI NGAY". Đã đọc `canDongBoLaiPO`
             * (`5-ket-noi/gui-po-qlk-ctr.ts`) — cơ chế gửi lại CÓ bắt được thay đổi (nó so ảnh
             * chụp `qlkCtrSyncedSnapshot` với đơn hiện tại). Nhưng nơi gọi nằm trong vòng đồng bộ
             * của `kho-du-lieu.tsx` (~dòng 1130), và **CHƯA AI ĐO THẬT** là nó có chạy ngay trong
             * phiên của chính người vừa bấm Lưu hay không — mới là suy luận từ mã nguồn. Nên ở
             * đây chỉ nói "sẽ được đồng bộ lại" và chỉ đường xử lý khi bên kho chưa thấy; tuyệt
             * đối không bịa ra một mốc thời gian.
             *
             * 📌 Trạng thái có CẢ MÀU LẪN CHỮ (Design System V1.1 §3.2) — bỏ màu đi vẫn đọc hiểu.
             */}
            {po.qlkCtrSyncStatus === "synced" && (
              <div className="flex items-start gap-2 rounded-lg border border-warning bg-warning-bg p-3 text-warning-soft">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold">Đơn này đã gửi sang Kho công trình</p>
                  <p className="text-xs">
                    Bản đơn hàng hiện có bên app Kho công trình (QLK CTR). Bản sửa sẽ được đồng bộ
                    lại sang đó; trong lúc chờ, thủ kho có thể vẫn đang thấy số lượng và ngày giao
                    cũ. Nếu bên kho chưa thấy bản mới, báo bộ phận kho đối chiếu trước khi giao
                    nhận.
                  </p>
                </div>
              </div>
            )}

            {/* NHÓM 1 */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-success-soft uppercase">
                Nhóm 1 — Thông tin hành chính
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-nguoi-lien-he-ncc">Người liên hệ NCC</Label>
                  <Input
                    id="sua-po-nguoi-lien-he-ncc"
                    value={nguoiLienHeNCC}
                    onChange={(e) => setNguoiLienHeNCC(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-dia-chi-ncc">Địa chỉ NCC</Label>
                  <Input id="sua-po-dia-chi-ncc" value={diaChiNCC} onChange={(e) => setDiaChiNCC(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-ma-so-thue-ncc">Mã số thuế NCC</Label>
                  <Input
                    id="sua-po-ma-so-thue-ncc"
                    value={maSoThueNCC}
                    onChange={(e) => setMaSoThueNCC(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-nguoi-nhan-hang">Người nhận hàng</Label>
                  <Input
                    id="sua-po-nguoi-nhan-hang"
                    value={nguoiNhanHangTen}
                    onChange={(e) => setNguoiNhanHangTen(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-sdt-nguoi-nhan">SĐT người nhận</Label>
                  <Input
                    id="sua-po-sdt-nguoi-nhan"
                    value={nguoiNhanHangSdt}
                    onChange={(e) => setNguoiNhanHangSdt(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-dia-diem-giao">Địa điểm giao hàng</Label>
                  <Input
                    id="sua-po-dia-diem-giao"
                    value={diaDiemGiaoHang}
                    onChange={(e) => setDiaDiemGiaoHang(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <Label htmlFor="sua-po-dieu-kien-giao">Điều kiện giao hàng</Label>
                  <Input
                    id="sua-po-dieu-kien-giao"
                    value={dieuKienGiaoHang}
                    onChange={(e) => setDieuKienGiaoHang(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <Label htmlFor="sua-po-ghi-chu-thoi-gian-giao">Ghi chú thời gian giao</Label>
                  <Input
                    id="sua-po-ghi-chu-thoi-gian-giao"
                    value={ghiChuThoiGianGiao}
                    onChange={(e) => setGhiChuThoiGianGiao(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <Label htmlFor="sua-po-ghi-chu-noi-bo">Ghi chú nội bộ</Label>
                  <Input id="sua-po-ghi-chu-noi-bo" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <Label htmlFor="sua-po-dieu-khoan-khac">Điều khoản khác</Label>
                  <Input
                    id="sua-po-dieu-khoan-khac"
                    value={dieuKhoanKhac}
                    onChange={(e) => setDieuKhoanKhac(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-tham-chieu">Tham chiếu</Label>
                  <Input id="sua-po-tham-chieu" value={thamChieu} onChange={(e) => setThamChieu(e.target.value)} />
                </div>
              </div>
            </div>

            {/* NHÓM 2 */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-warning-soft uppercase">
                Nhóm 2 — Sửa có điều kiện
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-ngay-giao">
                    Ngày giao dự kiến
                    {doiNgayGiao && (
                      <span className="ml-1.5 rounded-full bg-warning-bg px-2 py-0.5 text-[10px] font-semibold text-warning-soft">
                        đổi ngày — cần lý do
                      </span>
                    )}
                  </Label>
                  <Input
                    id="sua-po-ngay-giao"
                    type="date"
                    value={ngayGiaoDuKien}
                    onChange={(e) => setNgayGiaoDuKien(e.target.value)}
                  />
                </div>
                {/* ★ Ô "đến ngày" — thêm 13/09/2026 theo danh sách Sếp nêu. Xem chú thích state
                    `ngayGiaoDen` để biết vì sao ô này nối được vào tầng ghi mà không sửa gì ở đó. */}
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-ngay-giao-den">
                    Ngày giao đến ngày
                    <span className="ml-1.5 text-text-desc">(không bắt buộc)</span>
                  </Label>
                  <Input
                    id="sua-po-ngay-giao-den"
                    type="date"
                    value={ngayGiaoDen}
                    /* `min` chỉ là gợi ý trình duyệt — chốt thật là `khoangGiaoNguoc` ở hàm `sua()`. */
                    min={ngayGiaoDuKien || undefined}
                    aria-invalid={khoangGiaoNguoc || undefined}
                    onChange={(e) => setNgayGiaoDen(e.target.value)}
                  />
                  {/* 🔴 Báo lỗi bằng CẢ MÀU LẪN CHỮ (Design System V1.1 mục 3.2) — người không phân
                      biệt được màu vẫn đọc được lý do. */}
                  {khoangGiaoNguoc ? (
                    <p className="text-xs font-semibold text-danger">
                      Ngày giao đến đang SỚM HƠN ngày giao dự kiến — sửa lại mới lưu được.
                    </p>
                  ) : (
                    <p className="text-xs text-text-desc">
                      Để trống nếu đơn giao gọn trong một ngày.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <Label htmlFor="sua-po-nha-cung-cap">
                    Nhà cung cấp
                    {doiNCC && (
                      <span className="ml-1.5 rounded-full bg-warning-bg px-2 py-0.5 text-[10px] font-semibold text-warning-soft">
                        đổi NCC — cần lý do
                      </span>
                    )}
                  </Label>
                  <Input
                    id="sua-po-nha-cung-cap"
                    value={supplierTen}
                    onChange={(e) => setSupplierTen(e.target.value)}
                  />
                </div>
              </div>

              <p className="mt-1 text-xs font-semibold text-text-secondary">Mặt hàng / số lượng</p>
              <div className="flex flex-col gap-1.5">
                {items.map((d, idx) => {
                  if (!laDongHang(d)) return null;
                  const khoa = dongDaNhan.has(d.sttDong);
                  return (
                    <div
                      key={d.sttDong}
                      className={`flex flex-col gap-1.5 rounded-lg border p-2 sm:flex-row sm:items-center sm:gap-2 ${
                        khoa ? "border-dashed border-border bg-muted/40" : "border-border"
                      }`}
                    >
                      <Input
                        className="sm:flex-1"
                        value={d.tenVatLieu}
                        disabled={khoa}
                        placeholder="Tên hàng"
                        aria-label={`Tên hàng dòng ${idx + 1}`}
                        onChange={(e) =>
                          setItems((truoc) =>
                            truoc.map((x, i) => (i === idx ? { ...x, tenVatLieu: e.target.value } : x)),
                          )
                        }
                      />
                      <Input
                        className="sm:w-24"
                        value={d.donViTinh}
                        disabled={khoa}
                        placeholder="ĐVT"
                        aria-label={`Đơn vị tính dòng ${idx + 1}`}
                        onChange={(e) =>
                          setItems((truoc) =>
                            truoc.map((x, i) => (i === idx ? { ...x, donViTinh: e.target.value } : x)),
                          )
                        }
                      />
                      <Input
                        className="sm:w-28"
                        type="number"
                        value={d.khoiLuongDat}
                        disabled={khoa}
                        placeholder="Số lượng"
                        aria-label={`Số lượng dòng ${idx + 1}`}
                        onChange={(e) =>
                          setItems((truoc) =>
                            truoc.map((x, i) =>
                              i === idx ? { ...x, khoiLuongDat: Number(e.target.value) || 0 } : x,
                            ),
                          )
                        }
                      />
                      {quyen.xemGia && (
                        <Input
                          className="sm:w-28"
                          type="number"
                          value={gia[d.sttDong] ?? ""}
                          placeholder="Đơn giá"
                          aria-label={`Đơn giá dòng ${idx + 1}`}
                          disabled={!!po.xacNhanTruongBP}
                          onChange={(e) =>
                            setGia((truoc) => ({ ...truoc, [d.sttDong]: e.target.value }))
                          }
                        />
                      )}
                      {!khoa && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="shrink-0 text-text-desc hover:bg-danger-bg hover:text-danger"
                          aria-label={`Xóa dòng ${idx + 1}`}
                          title="Xóa dòng"
                          onClick={() => {
                            setItems((truoc) => truoc.filter((_, i) => i !== idx));
                            /* 🔴 DỌN LUÔN `gia[sttDong]` — nếu không, "Thêm dòng mới" ngay sau đó
                               (sttKeTiep = max(sttDong còn lại) + 1) HOÀN TOÀN có thể trùng đúng
                               `sttDong` vừa xóa (vd xóa dòng có stt cao nhất rồi thêm dòng mới),
                               khi đó ô Đơn giá của dòng MẶT HÀNG MỚI sẽ tự hiện lại giá của dòng
                               ĐÃ XÓA (đọc `gia[d.sttDong]` ở ô Đơn giá bên dưới) — gán nhầm giá
                               sang một mặt hàng khác hẳn mà người dùng chưa hề gõ gì. Bộ lọc "giá
                               mồ côi" (sttConLai) ở `sua()`/`suaDonHang` KHÔNG bắt được ca này vì
                               sttDong đó vẫn hợp lệ, chỉ là đã đổi chủ. */
                            setGia((truoc) => {
                              const con = { ...truoc };
                              delete con[d.sttDong];
                              return con;
                            });
                          }}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      )}
                      {khoa && (
                        <span
                          className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-text-desc"
                          title="Đã có phiếu nhận hàng — khóa mặt hàng/số lượng dòng này"
                        >
                          <Lock className="size-3.5" aria-hidden />
                          đã nhận
                        </span>
                      )}
                    </div>
                  );
                })}
                {/**
                 * ★ "THÊM DÒNG MỚI" CHỈ CÒN CHO ĐƠN ĐỘC LẬP — siết 15/09/2026.
                 *
                 * 🔴 VÌ SAO: trước đây nút này hiện VÔ ĐIỀU KIỆN. Với đơn lập từ một đề nghị
                 * (`po.prId` có giá trị), nó cho thêm mặt hàng + số lượng + đơn giá tuỳ ý vào một
                 * PO **đã chốt** — không đi qua bước ③ Xét duyệt báo giá, không đối chiếu khối
                 * lượng đã được duyệt của đề nghị. Tức là một đường vòng lặng lẽ quanh cả quy
                 * trình duyệt, ngay trong hộp "sửa vài thông tin hành chính".
                 *
                 * ⚠️ ẨN NÚT CHỈ LÀ LỚP MẶT, KHÔNG PHẢI CHỐT. Chốt thật phải nằm ở tầng ghi
                 * (`suaDonHang` trong `3-du-lieu/kho-du-lieu.tsx`) và đang do một phiên khác vá —
                 * CỐ Ý không chép luật đó sang tệp giao diện này, vì hai chỗ cùng viết một luật
                 * thì vài lần sửa nữa sẽ lệch nhau (lỗi dự án đã dính).
                 *
                 * 📌 Đơn KHÔNG có `prId` (đơn độc lập cũ) giữ nguyên nút — chúng không có đề nghị
                 * nào để đối chiếu, nên thêm dòng ở đây vẫn là đường hợp lệ duy nhất.
                 */}
                {po.prId ? (
                  /* Nói rõ VÌ SAO không có nút, và chỉ đường làm đúng — chứ không im lặng bỏ nút
                     đi để người dùng tưởng giao diện hỏng. */
                  <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-2.5 text-text-desc">
                    <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <p className="text-xs">
                      Đơn này lập từ đề nghị <span className="font-semibold">{po.prCode ?? ""}</span>{" "}
                      nên mặt hàng phải bám theo khối lượng đã được duyệt — không thêm dòng mới ở
                      đây. Cần đặt thêm hàng thì lập đề nghị mới, hoặc lập một đơn hàng khác.
                    </p>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="w-fit" onClick={themDongMoi}>
                    <Plus className="size-4" aria-hidden />
                    Thêm dòng mới
                  </Button>
                )}
                {po.xacNhanTruongBP && quyen.xemGia && (
                  <p className="text-xs text-text-desc">
                    Đã xác nhận hoàn thành — khóa sửa đơn giá.
                  </p>
                )}
              </div>
            </div>

            {/* NHÓM 3 */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-text-desc uppercase">
                Nhóm 3 — Không sửa qua đây
              </p>
              <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/40 p-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-ma-po" className="flex items-center gap-1.5">
                    Mã PO <Lock className="size-3" aria-hidden />
                  </Label>
                  <Input id="sua-po-ma-po" value={po.code} disabled />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-ma-du-an" className="flex items-center gap-1.5">
                    Mã dự án <Lock className="size-3" aria-hidden />
                  </Label>
                  <Input id="sua-po-ma-du-an" value={po.maDuAn} disabled />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-de-nghi-nguon" className="flex items-center gap-1.5">
                    Đề nghị nguồn <Lock className="size-3" aria-hidden />
                  </Label>
                  <Input id="sua-po-de-nghi-nguon" value={po.prCode ?? "Không gắn đề nghị"} disabled />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="sua-po-trang-thai" className="flex items-center gap-1.5">
                    Trạng thái <Lock className="size-3" aria-hidden />
                  </Label>
                  <Input id="sua-po-trang-thai" value={po.trangThai} disabled />
                </div>
              </div>
            </div>

            {batBuocLyDo && (
              <div className="flex flex-col gap-1.5 rounded-lg border border-warning/40 bg-warning-bg/60 p-3">
                <Label htmlFor="ly-do-sua-po">Lý do sửa (bắt buộc)</Label>
                <Textarea
                  id="ly-do-sua-po"
                  value={lyDo}
                  onChange={(e) => setLyDo(e.target.value)}
                  placeholder="VD: NCC báo giá lại do biến động giá thép tuần này…"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMo(false)}>
              <Undo2 className="size-4" aria-hidden />
              Hủy
            </Button>
            <Button onClick={sua}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
