"use client";

// ============================================================
// BẢNG HOÁ ĐƠN VAT — từng tờ một, nằm trong mục ⑥ của Bộ hồ sơ thanh toán.
//
// ★★ Sếp 19/09/2026 (ảnh chụp trang chi tiết đề nghị, khoanh đỏ mục ⑥): ***"Thêm các trường nhập
// liệu: 1. STT · 2. Số hoá đơn · 3. Ngày hoá đơn · 4. Số tiền trên hoá đơn · 5. Đính kèm"***.
//
// 🔴 VÌ SAO CẦN — ĐÂY LÀ LỚP TIỀN CỦA TỪNG LẦN GIAO. Bài toán Sếp đặt cùng ngày: *"đơn hàng khối
// lượng lớn như cát, đá, xi măng không thể giao trong 1 lần… mỗi lần giao nhỏ đó sẽ có hoá đơn
// thanh toán của đợt đó"*. Trước hôm nay app chỉ có MỘT ô số hoá đơn cho cả đơn, nên từ đợt thứ
// hai trở đi không còn chỗ ghi.
//
// 🔴 BẢNG NÀY LÀ NGUỒN DUY NHẤT của số hoá đơn và tiền hoá đơn — Sếp chốt 19/09/2026 khi được hỏi
// lại. Hai ô cùng tên bên màn Công nợ từ nay **tự cộng** từ đây và không gõ tay nữa (xem
// `tongTienHoaDonCuaDon` / `chuoiSoHoaDonCuaDon` ở `2-quy-trinh/tuoi-no.ts`). Để hai nơi cùng gõ
// tay thì cột "Còn phải trả" lấy theo số nào không ai biết, mà lệch thì không có gì báo.
//
// 🔴 KHỐI NÀY CHỈ VẼ. Mọi luật (ai được ghi, số tiền hợp lệ chưa, cộng dồn thế nào) nằm ở
// `3-du-lieu/kho-du-lieu.tsx` và `2-quy-trinh/tuoi-no.ts` — quy ước 3.4b cấm để hàm tính nghiệp
// vụ trong tệp giao diện. Ở đây chỉ gọi và hiện lại câu lý do khi bị chặn.
// ============================================================

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Pencil, Plus, ScanLine, Trash2, X } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { OChonNgay } from "@/1-giao-dien/thanh-phan-dung-chung/o-chon-ngay";
import { ODinhKemTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { chamNganCachNghin, formatCurrencyVnd, formatDate, homNayISO } from "@/6-tien-ich/dinh-dang";
import { catTep, coTep } from "@/3-du-lieu/kho-tep";
import { doHoaDon } from "@/2-quy-trinh/doc-hoa-don-van-ban";
import type { DongHoaDonVAT, MoTaTep } from "@/3-du-lieu/kieu-du-lieu";

/**
 * ★★ BỀ RỘNG CỘT — Sếp 20/09/2026: ***"Bố cục dãn ra cho hợp mắt, sao lại gom 1 lại góc vậy"***.
 *
 * 🔴 HAI LẦN SỬA, HAI LÝ DO NGƯỢC NHAU — chép đủ để đừng quay về bản nào cũng sai:
 *   ① Bản đầu dùng bề rộng CỨNG cho mọi cột ⇒ bảng co cụm vào mép trái, bỏ trống cả nửa phải.
 *   ② Bản thứ hai cho mọi cột `minmax(…, fr)` ⇒ ngược lại: cột Ngày phình ra, đẩy cột Số tiền
 *      sang tận giữa màn, giữa Ngày và Số tiền há một khoảng trống lớn. Sếp khoanh đúng chỗ đó
 *      và ghi *"Di chuyển qua đây"*.
 *
 * ✅ Nay: ba cột dữ liệu (số hoá đơn · ngày · số tiền) có bề rộng CỐ ĐỊNH vừa đủ nên chúng nằm
 * sát nhau bên trái, còn cột **Tệp đính kèm** lấy `1fr` — tức nó nuốt toàn bộ phần dư. Khoảng
 * trống dồn về cuối hàng thay vì há ra giữa bảng.
 *
 * 📌 Cột số tiền căn PHẢI kèm `tabular-nums` để hàng nghìn của dòng trên thẳng hàng nghìn của
 * dòng dưới — cùng nếp với bảng Công nợ.
 *
 * ⚠️ Khai thành hằng số để hàng tiêu đề, các dòng dữ liệu VÀ form sửa dùng CHUNG một chuỗi. Viết
 * lặp ba nơi là sớm muộn sửa một chỗ quên hai chỗ kia, rồi ô nhập lệch khỏi cột nó đang sửa.
 */
const LUOI_CO_GIA = "sm:grid-cols-[2rem_10rem_7.5rem_10rem_minmax(9rem,1fr)_auto]";
const LUOI_KHONG_GIA = "sm:grid-cols-[2rem_10rem_7.5rem_minmax(9rem,1fr)_auto]";

export function BangHoaDonVAT({
  poId,
  poCode,
  dong,
  soDotGiao,
  ghiDuoc,
  xemGia,
  nguoiGhi,
  tepDaDinh,
  onThem,
  onXoa,
  onSua,
  onDinhTep,
  onGoTep,
}: {
  poId: string;
  poCode: string;
  dong: readonly DongHoaDonVAT[];
  /** Số lần giao của đơn — chỉ dùng để NHẮC, không dùng để chặn (xem chú thích dưới). */
  soDotGiao: number;
  ghiDuoc: boolean;
  /** Không được xem giá thì ẩn cột tiền, vẫn thấy số hoá đơn + ngày + tệp. */
  xemGia: boolean;
  /** Người đang thao tác — `ODinhKemTep` ghi lại ai đính kèm. */
  nguoiGhi: { uid: string; ten: string };
  /**
   * ★ TOÀN BỘ tệp hoá đơn đang có trong hồ sơ. Mỗi dòng tự tra tệp của mình theo `nhanTep`.
   *
   * 🔴 NHẬN TỪ NƠI GỌI, không tự đọc — khối này là thành phần thuần hiển thị, kéo `useDuLieu` vào
   * đây là nó không dùng lại được ở trang in và các nơi chỉ bày.
   */
  tepDaDinh: readonly MoTaTep[];
  /**
   * Ghi một tờ mới. Trả `{ loi }` khi bị chặn, `{ id }` là mã dòng vừa tạo.
   *
   * 🔴 PHẢI TRẢ `id` — nút *"Đọc tệp hoá đơn"* cho chọn tệp TRƯỚC khi dòng tồn tại, nên sau khi
   * lưu còn phải đính đúng tệp đó vào đúng dòng. Xem chú thích ở `themHoaDonVAT`.
   */
  onThem: (d: {
    soHoaDon: string;
    ngayHoaDon: string;
    soTien: number;
  }) => { loi: string; id?: undefined } | { loi?: undefined; id: string };
  onXoa: (id: string) => string | null;
  /** Sửa số / ngày / số tiền của một tờ đã ghi (Sếp 20/09/2026). Không đụng bản chụp. */
  onSua: (id: string, d: { soHoaDon: string; ngayHoaDon: string; soTien: number }) => string | null;
  /** Đính bản chụp cho ĐÚNG tờ hoá đơn này. Trả câu lý do khi bị chặn, `null` là xong. */
  onDinhTep: (idDong: string, tep: MoTaTep) => string | null;
  /** Gỡ bản chụp khỏi tờ hoá đơn này (tệp vẫn nằm trong kho, chỉ rời khỏi hồ sơ). */
  onGoTep: (idDong: string) => string | null;
}) {
  const [dangThem, setDangThem] = useState(false);
  const [soHoaDon, setSoHoaDon] = useState("");
  const [ngayHoaDon, setNgayHoaDon] = useState<string>(homNayISO());
  const [soTien, setSoTien] = useState("");
  const [hoiXoa, setHoiXoa] = useState<string | null>(null);
  /** Tờ hoá đơn đang mở form sửa — `null` là không sửa tờ nào (Sếp 20/09/2026). */
  const [dangSua, setDangSua] = useState<string | null>(null);
  const [sSoHoaDon, setsSoHoaDon] = useState("");
  const [sNgay, setsNgay] = useState<string>(homNayISO());
  const [sTien, setsTien] = useState("");
  /**
   * ★★ TỆP PDF NGƯỜI DÙNG VỪA CHỌN ĐỂ APP TỰ ĐỌC — Sếp 20/09/2026: ***"a muốn đính kèm file hoá
   * đơn vào là app tự đọc thông tin trên hoá đơn và nhập số liệu vào trường dữ liệu đang có"***.
   *
   * 🔴 GIỮ NGUYÊN `File` TRONG BỘ NHỚ, CHƯA CẤT VÀO KHO. Đây chính là lý do không dùng được
   * `ODinhKemTep` ở form thêm: ô đó cất tệp **ngay khi chọn**, mà form này có nút *Huỷ* — bấm
   * Huỷ là tệp đã nằm trong kho mà không dòng nào trỏ tới (rác, ăn hạn mức). Tệp chỉ được cất
   * khi bấm **Lưu hoá đơn** và dòng đã ghi thành công.
   */
  const [tepChoDoc, setTepChoDoc] = useState<File | null>(null);
  const [dangDoc, setDangDoc] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);
  const oChonTep = useRef<HTMLInputElement>(null);

  /* 📌 SẮP THEO NGÀY rồi mới đánh STT. STT là số thứ tự HIỂN THỊ, cố ý không lưu vào dữ liệu —
     lưu lại là sớm muộn có hai dòng cùng STT 3 sau một lần xoá, hoặc STT nhảy cóc 1-2-4. */
  const dsSapXep = [...dong].sort(
    (a, b) => String(a.ngayHoaDon).localeCompare(String(b.ngayHoaDon)) || a.id.localeCompare(b.id),
  );
  const tong = dsSapXep.reduce((s, d) => s + (Number(d.soTien) || 0), 0);

  /**
   * ★★★ ĐỌC TỆP PDF RỒI ĐIỀN SẴN BA Ô — Sếp 20/09/2026, phạm vi Sếp chốt: ***"Hãy làm trước
   * nhánh với file PDF vector"***.
   *
   * 🔴 CHỈ ĐIỀN SẴN, KHÔNG TỰ LƯU. Hoá đơn có nhiều dòng tiền (tiền hàng chưa thuế · tiền thuế ·
   * tổng thanh toán) và mỗi nhà cung cấp một mẫu — app đọc nhầm dòng là sổ công nợ sai mà nhìn
   * vào bảng không thấy gì bất thường. Người dùng nhìn ba ô rồi mới bấm **Lưu hoá đơn**.
   *
   * 🔴 ĐỌC KHÔNG RA THÌ NÓI THẲNG, TUYỆT ĐỐI KHÔNG ĐỂ Ô TRỐNG IM LẶNG. PDF ảnh quét không có một
   * ký tự nào để trích; không báo gì thì người dùng tưởng app hỏng, hoặc tệ hơn là tưởng hoá đơn
   * không có số tiền. Tệp vẫn được giữ để đính kèm — đọc được hay không thì bản chụp vẫn cần.
   */
  async function docTep(f: File) {
    setTepChoDoc(f);
    setDangDoc(true);
    try {
      const { trichTextPdf } = await import("@/6-tien-ich/trich-text-pdf");
      const { vanBan, soKyTu, dong } = await trichTextPdf(f);
      if (soKyTu < 20) {
        toast.warning("Tệp này không có chữ để đọc", {
          description:
            "Có thể là hoá đơn chụp/quét thành ảnh. Mời nhập tay ba ô bên dưới — tệp vẫn được đính kèm khi bấm Lưu.",
        });
        return;
      }
      /* (25/09/2026) Đọc theo dòng dựng từ toạ độ trước, ô nào trượt mới lấy cách cũ. */
      const doc = doHoaDon(dong, vanBan);
      if (doc.soHoaDon) setSoHoaDon(doc.soHoaDon);
      if (doc.ngayHoaDon) setNgayHoaDon(doc.ngayHoaDon);
      if (doc.soTien !== undefined) setSoTien(chamNganCachNghin(String(doc.soTien)));
      /**
       * 🔴 CÓ CÂU CẢNH BÁO THÌ PHẢI HIỆN RA — hôm nay là ca **hoá đơn điều chỉnh giảm**: app đọc
       * ra số âm nên cố ý KHÔNG điền. Nuốt câu này đi thì ô tiền để trống mà không nói vì sao,
       * người dùng tưởng app hỏng hoặc tưởng hoá đơn không có số tiền.
       */
      if (doc.canhBao) {
        toast.warning(doc.canhBao, {
          description:
            doc.daDoc.length > 0
              ? `App vẫn điền được: ${doc.daDoc.join(" · ")}.`
              : "Mời nhập tay ba ô bên dưới.",
        });
        return;
      }
      if (doc.daDoc.length === 0) {
        toast.warning("Đọc được chữ nhưng không tìm ra thông tin hoá đơn", {
          description: "Mẫu hoá đơn này app chưa nhận ra. Mời nhập tay ba ô bên dưới.",
        });
        return;
      }
      /* (25/09/2026) Nói rõ Ô NÀO chưa đọc được — người dùng biết đúng chỗ phải nhập tay, và báo
         lại kèm tệp để bổ sung nhãn cho mẫu đó. `nhac` là câu nhắc xem lại, app VẪN đã điền. */
      const conThieu = ["số hoá đơn", "ngày", "số tiền"].filter((x) => !doc.daDoc.includes(x));
      const moTa = [
        ...doc.nhac,
        conThieu.length > 0 ? `Chưa đọc được: ${conThieu.join(" · ")} — mời nhập tay.` : "",
        "Mời kiểm lại ba ô bên dưới rồi bấm Lưu hoá đơn.",
      ]
        .filter(Boolean)
        .join(" ");
      const baoTin = doc.nhac.length > 0 ? toast.warning : toast.success;
      baoTin(`App đã đọc được: ${doc.daDoc.join(" · ")}`, { description: moTa });
    } catch (e) {
      /* 🔴 BÁO RA, ĐỪNG NUỐT. Nuốt lỗi ở đây thì người dùng ngồi chờ một việc đã hỏng. */
      toast.error("Không đọc được tệp PDF này", {
        description: `${e instanceof Error ? e.message : String(e)} — mời nhập tay ba ô bên dưới.`,
      });
    } finally {
      setDangDoc(false);
    }
  }

  /** Dọn sạch form thêm — gọi cả khi lưu xong lẫn khi bấm Huỷ, để hai đường không lệch nhau. */
  function donForm() {
    setDangThem(false);
    setSoHoaDon("");
    setSoTien("");
    setNgayHoaDon(homNayISO());
    setTepChoDoc(null);
    if (oChonTep.current) oChonTep.current.value = "";
  }

  async function luu() {
    if (dangLuu) return;
    /* 🔴 BỎ DẤU PHÂN CÁCH TRƯỚC KHI ĐỔI SANG SỐ. Người dùng gõ tiền theo thói quen kế toán
       ("45.522.000"); `Number("45.522.000")` cho `NaN`, và nếu để lọt thì tầng ghi từ chối với
       câu "số tiền phải là số không âm" — người dùng đọc mà không hiểu vì sao, vì họ vừa gõ đúng
       số tiền thật. Cùng cách xử với khối Đợt thanh toán. */
    const tien = Number(soTien.replace(/[.,\s]/g, ""));
    const kq = onThem({ soHoaDon, ngayHoaDon, soTien: tien });
    if (kq.loi) {
      toast.error(kq.loi);
      return;
    }
    toast.success(`Đã ghi hoá đơn ${soHoaDon.trim()} cho đơn ${poCode}`);

    /**
     * ★ CẤT TỆP VÀ ĐÍNH VÀO ĐÚNG DÒNG VỪA GHI.
     *
     * 🔴 LÀM SAU KHI DÒNG ĐÃ GHI THÀNH CÔNG, không làm trước. Cất trước rồi dòng bị chặn (hết
     * quyền, thiếu số) là tệp nằm trong kho mà không ai trỏ tới.
     *
     * 🔴 TỆP HỎNG THÌ TỜ HOÁ ĐƠN VẪN CÒN, chỉ báo riêng phần đính kèm. Cuộn ngược lại xoá tờ vừa
     * ghi là mất luôn con số người dùng vừa gõ đúng — họ phải gõ lại từ đầu vì một việc phụ.
     */
    if (tepChoDoc && kq.id) {
      setDangLuu(true);
      try {
        const mt = await catTep(tepChoDoc, nguoiGhi);
        const loiTep = onDinhTep(kq.id, mt);
        if (loiTep) toast.error("Đã ghi hoá đơn nhưng chưa đính được tệp", { description: loiTep });
        else toast.success("Đã đính kèm", { description: `${mt.tenTep} · ${coTep(mt.kichThuoc)}` });
      } catch (e) {
        toast.error("Đã ghi hoá đơn nhưng chưa đính được tệp", {
          description: `${e instanceof Error ? e.message : String(e)} — mời dùng nút Đính kèm trên dòng vừa ghi.`,
        });
      } finally {
        setDangLuu(false);
      }
    }
    donForm();
  }

  /** Lưu bản sửa của một tờ — Sếp 20/09/2026. Cùng cách xử số tiền với `luu()` ở trên. */
  function luuSua(id: string) {
    const tien = Number(sTien.replace(/[.,\s]/g, ""));
    const loi = onSua(id, { soHoaDon: sSoHoaDon, ngayHoaDon: sNgay, soTien: tien });
    if (loi) {
      toast.error(loi);
      return;
    }
    toast.success("Đã sửa thông tin hoá đơn");
    setDangSua(null);
  }

  return (
    /**
      * 🔴 KHÔNG CÓ VIỀN VÀ NỀN RIÊNG — sửa 19/09/2026 sau khi Sếp xem bản thật.
      *
      * Bản đầu bọc khối này trong `rounded-lg border border-border bg-card p-3`. Mục ⑥ vốn đã là
      * một thẻ trắng có viền, nên thành **hộp lồng trong hộp**: trên màn hình nó trông như một
      * mục thứ 10 nằm tách hẳn ra, không dính gì tới Hoá đơn VAT. Sếp khoanh đỏ đúng mục ⑥ để
      * nói "các trường nhập liệu phải ở trong đây".
      *
      * 📌 `pl-7` là bậc thụt của RUỘT MỤC trong khối này (xem chú thích nhóm con ở
      * `khoi-bo-ho-so-thanh-toan.tsx`) — để bảng thẳng hàng với tên chứng từ và danh sách tệp
      * phía trên, thay vì bắt đầu từ mép trái nơi đặt số thứ tự.
      *
      * 📌 Đường kẻ mảnh phía trên chỉ để tách phần *nhập liệu* khỏi phần *đính kèm* — nhẹ hơn
      * một cái viền kín, đủ để mắt thấy là hai việc khác nhau mà vẫn cùng một mục.
      */
    <div className="flex flex-col gap-2 border-t border-border/60 pt-2 pl-7">
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="size-4 shrink-0 text-text-desc" aria-hidden />
        <span className="text-sm font-semibold text-text-primary">Hoá đơn của đơn {poCode}</span>
        <span className="text-xs text-text-desc">
          {dsSapXep.length === 0
            ? "chưa ghi tờ nào"
            : `${dsSapXep.length} tờ${xemGia ? ` · tổng ${formatCurrencyVnd(tong)}` : ""}`}
        </span>
      </div>

      {/**
        * 🔴 NHẮC, TUYỆT ĐỐI KHÔNG CHẶN — Sếp chốt 19/09/2026 khi được hỏi thẳng câu này.
        *
        * Nhà cung cấp thường xuất **gộp** cuối tháng. Ép mỗi đợt giao một hoá đơn thì đơn giao 3
        * lần mà NCC xuất 1 tờ sẽ **kẹt vĩnh viễn**, không có đường gỡ — và mọi hồ sơ đang mở bị
        * chặn đóng ngay hôm triển khai. Luật đóng hồ sơ giữ nguyên ở
        * `vuongMacDuyetHoanThanhDeNghi` (`2-quy-trinh/chung-tu-cuoi-quy-trinh.ts`): có ít nhất
        * một hoá đơn là đủ. Đừng "siết cho chặt" ở đây.
        */}
      {soDotGiao > 0 && dsSapXep.length > 0 && dsSapXep.length < soDotGiao && (
        <span className="text-xs text-warning-soft">
          Đã ghi {dsSapXep.length} hoá đơn cho {soDotGiao} đợt giao — kiểm lại xem nhà cung cấp đã
          xuất đủ chưa (hoặc họ xuất gộp một tờ cho nhiều đợt).
        </span>
      )}

      {/**
        * ★★ BỐ CỤC DẠNG CỘT THẲNG HÀNG — Sếp 20/09/2026: ***"Bố cục lại giao diện cho đẹp mắt"***.
        *
        * 🔴 BA THỨ LÀM BẢN ĐẦU RỐI, sửa đúng ba thứ đó:
        *   ① Mỗi dòng in lại câu *"Nhận PDF, ảnh, Word, Excel · tối đa 10MB…"* — hai tờ hoá đơn là
        *      hai lần, ba tờ là ba lần. `ODinhKemTep` có sẵn cờ `anHuongDan` sinh ra đúng cho ca
        *      này (chú thích tại đó: *"khu báo giá có N ô, mỗi ô in lại đúng một câu"*).
        *   ② Nút xoá dùng `ml-auto` nên bị đẩy ra tận mép phải, để lại một khoảng trống lớn giữa
        *      nội dung và nút — đúng vùng Sếp khoanh đỏ bên phải.
        *   ③ Các ô co giãn theo nội dung nên số hoá đơn, ngày, tiền của hai dòng **không thẳng
        *      cột** với nhau, mắt phải dò từng dòng.
        *
        * 📌 Dùng `grid` với bề rộng cột cố định thay cho `flex-wrap`: cột số tiền căn PHẢI kèm
        * `tabular-nums` để hàng nghìn của dòng trên thẳng hàng nghìn của dòng dưới — cùng nếp với
        * bảng Công nợ. Điện thoại thì `grid-cols-1` cho xuống dòng, không ép cuộn ngang.
        */}
      {dsSapXep.length > 0 && (
        <div className="flex flex-col gap-1">
          {/* Hàng tiêu đề chỉ hiện từ màn tablet trở lên — trên điện thoại các ô xếp dọc nên
              tiêu đề cột thành vô nghĩa, còn tốn một dòng. */}
          <div
            className={`hidden gap-x-3 px-2 text-[11px] font-medium text-text-desc sm:grid ${
              xemGia ? LUOI_CO_GIA : LUOI_KHONG_GIA
            }`}
          >
            <span>#</span>
            <span>Số hoá đơn</span>
            <span>Ngày</span>
            {xemGia && <span className="text-right">Số tiền</span>}
            <span>Tệp đính kèm</span>
            <span />
          </div>
          {dsSapXep.map((d, i) =>
            /**
              * ★ ĐANG SỬA THÌ THAY CẢ DÒNG BẰNG FORM, không chen ô nhập vào giữa các cột.
              * Chen vào là hàng đó phình cao gấp đôi và mọi cột lệch khỏi tiêu đề — mắt mất chỗ
              * bám đúng lúc người dùng cần đối chiếu con số cũ với con số đang gõ.
              */
            dangSua === d.id ? (
              /**
                * ★ FORM SỬA DÙNG CHUNG LƯỚI CỘT VỚI HÀNG DỮ LIỆU — Sếp 20/09/2026: *"Dãn cột ra
                * chút"*.
                *
                * 🔴 Bản đầu dùng `flex` với bề rộng cứng (`w-44`, `w-40`) nên ba ô dồn sát nhau ở
                * mép trái, còn nửa phải bỏ trống — và tệ hơn: **không ô nào thẳng cột với con số
                * nó đang sửa** ở các hàng trên dưới. Người sửa phải nhớ trong đầu mình đang gõ
                * vào cột nào.
                *
                * 📌 Dùng lại `LUOI_CO_GIA` thì ô Số hoá đơn nằm đúng dưới cột Số hoá đơn, ô Ngày
                * dưới cột Ngày, ô Số tiền dưới cột Số tiền. Ô trống đầu tiên giữ chỗ cột STT.
                */
              <div
                key={d.id}
                className={`flex flex-wrap items-end gap-x-3 gap-y-2 rounded-md border border-primary/40 bg-card px-2 py-2 sm:grid ${LUOI_CO_GIA}`}
              >
                <span className="hidden sm:block" />
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`sua-so-${d.id}`}>Số hoá đơn</Label>
                  <Input
                    id={`sua-so-${d.id}`}
                    value={sSoHoaDon}
                    onChange={(e) => setsSoHoaDon(e.target.value)}
                    className="w-full"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") luuSua(d.id);
                      if (e.key === "Escape") setDangSua(null);
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`sua-ngay-${d.id}`}>Ngày</Label>
                  <OChonNgay
                    id={`sua-ngay-${d.id}`}
                    nhan="Ngày hoá đơn"
                    giaTri={sNgay}
                    onDoi={setsNgay}
                    xoaDuoc={false}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`sua-tien-${d.id}`}>Số tiền</Label>
                  <Input
                    id={`sua-tien-${d.id}`}
                    inputMode="numeric"
                    value={sTien}
                    onChange={(e) => setsTien(chamNganCachNghin(e.target.value))}
                    className="w-full text-right"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") luuSua(d.id);
                      if (e.key === "Escape") setDangSua(null);
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => luuSua(d.id)}>Lưu</Button>
                  <Button variant="ghost" onClick={() => setDangSua(null)}>
                    Huỷ
                  </Button>
                </div>
              </div>
            ) : (
            <div
              key={d.id}
              className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-muted/40 px-2 py-1.5 text-sm sm:grid ${
                xemGia ? LUOI_CO_GIA : LUOI_KHONG_GIA
              }`}
            >
              <span className="shrink-0 tabular-nums text-xs text-text-desc">{i + 1}.</span>
              {/* 📌 TÊN NGƯỜI GHI DỜI VÀO CHỮ RÊ CHUỘT, không còn in ra dòng. Tiền thì vẫn phải
                  truy lại được ai ghi, nhưng in cả tên ra giữa bảng làm gãy hàng cột — mà đây là
                  thứ người ta chỉ tra khi cần. Nhật ký chứng từ giá vẫn ghi đủ. */}
              <span
                className="truncate font-medium text-text-primary"
                title={`${d.soHoaDon} — ghi bởi ${d.nguoiGhiTen}`}
              >
                {d.soHoaDon}
              </span>
              <span className="tabular-nums text-text-secondary">{formatDate(d.ngayHoaDon)}</span>
              {/* Ẩn CỘT TIỀN cho người không được xem giá — họ vẫn cần biết đã có hoá đơn nào. */}
              {xemGia && (
                <span className="font-semibold tabular-nums text-text-primary sm:text-right">
                  {formatCurrencyVnd(d.soTien)}
                </span>
              )}
              {/**
                * ★★ Ô ĐÍNH KÈM CỦA RIÊNG TỜ NÀY — Sếp 20/09/2026: *"tích hợp mục đính kèm hoá đơn
                * đó xuống mục dưới"*, và khi được hỏi lại thì chốt **mỗi tờ hoá đơn một tệp riêng**.
                *
                * 🔴 ĐẶT TRÊN DÒNG ĐÃ LƯU, TUYỆT ĐỐI KHÔNG ĐẶT TRONG FORM "ĐANG THÊM".
                * `ODinhKemTep` cất tệp vào kho **ngay khi chọn**, trước khi nơi gọi kịp lưu. Form
                * thêm có nút *Huỷ* — đặt ô ở đó thì bấm Huỷ là tệp đã nằm trong kho (và đã đẩy đủ
                * mảnh lên máy chủ) mà **không dòng nào trỏ tới**. Rác trên máy chủ, ăn hạn mức.
                *
                * 🔴 TRA TỆP THEO NHÃN, KHÔNG GIỮ BẢN SAO trong dòng — xem chú thích `nhanTep` ở
                * `3-du-lieu/kieu-du-lieu.ts`. Một tệp, một chỗ.
                */}
              {(() => {
                const tepCuaDong = d.nhanTep
                  ? tepDaDinh.find((t) => t.ghiChu === d.nhanTep)
                  : undefined;
                return (
                  <ODinhKemTep
                    tep={tepCuaDong}
                    nhanThem="Đính kèm"
                    nguoi={nguoiGhi}
                    khoa={!ghiDuoc}
                    dangGon
                    /* 🔴 ẨN DÒNG HƯỚNG DẪN — bảng có N tờ hoá đơn, không bật cờ này thì câu
                       "Nhận PDF, ảnh, Word, Excel · tối đa 10MB…" in lại N lần, chiếm chỗ hơn cả
                       dữ liệu. Câu đó vẫn còn nguyên ở các ô nộp khác của mục ⑦ và ⑧. */
                    anHuongDan
                    onXong={(t) => onDinhTep(d.id, t)}
                    /**
                      * 🔴 KHÔNG TRUYỀN `onXoa` — Sếp 20/09/2026: ***"2 nút xoá là sao"***.
                      *
                      * Ô đính kèm tự vẽ một nút thùng rác (xoá TỆP), mà ngay cạnh nó dòng này
                      * đã có một nút thùng rác khác (xoá TỜ HOÁ ĐƠN). Hai icon giống hệt nhau,
                      * cách nhau vài chục pixel, làm hai việc khác hẳn về hậu quả — bấm nhầm
                      * cái thứ hai là mất cả số tiền của tờ.
                      *
                      * 📌 Vẫn thay được bản chụp: nút **đổi tệp** (mũi tên xoay) của chính ô đó
                      * cho chọn tệp khác. Còn muốn bỏ hẳn tờ thì xoá tờ — và `xoaHoaDonVAT` đã
                      * gỡ luôn bản chụp, không để tệp mồ côi.
                      */
                  />
                );
              })()}
              {/* 🔴 KHÔNG `ml-auto` — trong lưới cột thì nút tự nằm ở cột cuối. Dùng `ml-auto`
                  là nó bị đẩy ra tận mép phải thẻ, để lại đúng khoảng trống Sếp khoanh đỏ. */}
              {ghiDuoc && (
                <span className="ml-auto flex shrink-0 items-center sm:ml-0">
                  {/**
                    * ★★ NÚT SỬA — Sếp 20/09/2026: ***"Thêm nút chỉnh sửa thông tin trên hoá đơn"***.
                    *
                    * 🔴 VÌ SAO CẦN: gõ nhầm một chữ số tiền thì trước đây phải **xoá cả tờ rồi ghi
                    * lại** — mà xoá là gỡ luôn bản chụp đã đính và đẻ một dòng *"XOÁ hoá đơn…"*
                    * trong nhật ký. Sổ sách tiền bẩn vì một lỗi đánh máy.
                    *
                    * 📌 Sửa KHÔNG đụng bản chụp: nhãn tệp giữ nguyên nên mối nối tới tệp còn y
                    * nguyên (xem `suaHoaDonVAT` ở `3-du-lieu/kho-du-lieu.tsx`).
                    */}
                  <button
                    type="button"
                    onClick={() => {
                      setDangSua(d.id);
                      setsSoHoaDon(d.soHoaDon);
                      setsNgay(String(d.ngayHoaDon));
                      setsTien(chamNganCachNghin(String(d.soTien)));
                    }}
                    title={`Sửa hoá đơn ${d.soHoaDon}`}
                    className="inline-flex size-11 items-center justify-center rounded-lg text-text-desc transition-colors hover:bg-primary-bg hover:text-primary md:size-9"
                  >
                    <Pencil className="size-4" aria-hidden />
                    <span className="sr-only">Sửa hoá đơn {d.soHoaDon}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHoiXoa(d.id)}
                    title={`Xoá hoá đơn ${d.soHoaDon}`}
                    className="inline-flex size-11 items-center justify-center rounded-lg text-text-desc transition-colors hover:bg-danger-bg hover:text-danger md:size-9"
                  >
                    <Trash2 className="size-4" aria-hidden />
                    <span className="sr-only">Xoá hoá đơn {d.soHoaDon}</span>
                  </button>
                </span>
              )}
            </div>
            ),
          )}
        </div>
      )}

      {/* 🔴 HỎI TRƯỚC KHI XOÁ. Xoá một tờ hoá đơn là đổi số liệu công nợ của đơn — phải có một
          nhịp dừng, và nhật ký chứng từ giá vẫn ghi lại ai xoá (xem `xoaHoaDonVAT`). */}
      <HopXacNhan
        mo={hoiXoa !== null}
        onDong={() => setHoiXoa(null)}
        tieuDe="Xoá tờ hoá đơn này?"
        moTa="Tổng tiền theo hoá đơn của đơn sẽ giảm tương ứng, và cột Còn phải trả bên màn Công nợ đổi theo. Nhật ký vẫn ghi lại việc xoá."
        nhanDongY="Xoá hoá đơn"
        nguyHiem
        onDongY={() => {
          const id = hoiXoa;
          setHoiXoa(null);
          if (!id) return;
          const loi = onXoa(id);
          if (loi) toast.error(loi);
        }}
      />

      {ghiDuoc &&
        (dangThem ? (
          <div className="flex flex-wrap items-end gap-2 border-t border-border pt-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`so-hd-${poId}`}>Số hoá đơn</Label>
              <Input
                id={`so-hd-${poId}`}
                value={soHoaDon}
                onChange={(e) => setSoHoaDon(e.target.value)}
                placeholder="VD: 1C25TYY-0001234"
                className="w-48"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void luu();
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`ngay-hd-${poId}`}>Ngày hoá đơn</Label>
              <OChonNgay
                id={`ngay-hd-${poId}`}
                nhan="Ngày hoá đơn"
                giaTri={ngayHoaDon}
                onDoi={setNgayHoaDon}
                xoaDuoc={false}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`tien-hd-${poId}`}>Số tiền trên hoá đơn</Label>
              <Input
                id={`tien-hd-${poId}`}
                inputMode="numeric"
                value={soTien}
                onChange={(e) => setSoTien(chamNganCachNghin(e.target.value))}
                placeholder="VD: 45522000"
                className="w-44"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void luu();
                }}
              />
            </div>
            <Button onClick={() => void luu()} disabled={dangLuu || dangDoc}>
              {dangLuu ? "Đang lưu…" : "Lưu hoá đơn"}
            </Button>
            <Button variant="ghost" onClick={donForm} disabled={dangLuu}>
              Huỷ
            </Button>

            {/**
              * ★★★ NÚT ĐỌC TỆP — Sếp 20/09/2026: ***"Sao chưa có nút đính kèm hoá đơn để app tự
              * đọc là lấy thông tin"***.
              *
              * 🔴 KHÔNG DÙNG `ODinhKemTep` Ở ĐÂY. Ô đó cất tệp vào kho **ngay khi chọn**, mà form
              * này có nút Huỷ ⇒ bấm Huỷ là tệp đã nằm trong kho không ai trỏ tới. Dùng
              * `<input type="file">` thuần, giữ `File` trong bộ nhớ, chỉ cất khi bấm Lưu.
              *
              * 📌 `accept="application/pdf"` vì hôm nay mới làm nhánh PDF vector đúng như Sếp
              * chốt. Nhánh XML (`2-quy-trinh/doc-hoa-don-xml.ts`) và nhánh ảnh quét chưa nối.
              */}
            <div className="flex basis-full flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={oChonTep}
                  type="file"
                  accept="application/pdf,.pdf"
                  /* 🔴 `hidden` chứ KHÔNG PHẢI `sr-only`. `sr-only` là `position:absolute`; không
                     có tổ tiên `relative` thì nó bám vào khung chứa gốc và thoát khỏi
                     `overflow-x-hidden` của vùng nội dung, kéo giãn cả trang trên điện thoại
                     (đã dính khi làm bảng Kanban). `display:none` vẫn `.click()` được. */
                  className="hidden"
                  id={`doc-hd-${poId}`}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void docTep(f);
                  }}
                />
                <Button
                  variant="outline"
                  disabled={dangDoc || dangLuu}
                  onClick={() => oChonTep.current?.click()}
                >
                  <ScanLine className="size-4" aria-hidden />
                  {dangDoc ? "Đang đọc tệp…" : "Đính kèm hoá đơn PDF — app tự đọc"}
                </Button>
                {tepChoDoc && (
                  <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-primary-bg px-2 py-1 text-xs text-primary">
                    <FileText className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{tepChoDoc.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTepChoDoc(null);
                        if (oChonTep.current) oChonTep.current.value = "";
                      }}
                      title="Bỏ tệp này"
                      className="ml-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded hover:bg-danger-bg hover:text-danger"
                    >
                      <X className="size-3.5" aria-hidden />
                      <span className="sr-only">Bỏ tệp {tepChoDoc.name}</span>
                    </button>
                  </span>
                )}
              </div>
              {/* 🔴 NÓI THẲNG APP LÀM ĐƯỢC TỚI ĐÂU — §3.5: đừng để giao diện hứa việc app không
                  làm. Hoá đơn quét thành ảnh thì không có chữ nào để trích, và app không đoán bừa. */}
              <span className="text-xs text-text-desc">
                Chọn tệp PDF hoá đơn điện tử, app tự điền số hoá đơn · ngày · số tiền vào ba ô trên
                để bạn kiểm lại. Hoá đơn chụp/quét thành ảnh thì phải nhập tay. Tệp được đính kèm
                vào đúng tờ này khi bấm <strong>Lưu hoá đơn</strong>.
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDangThem(true)}
            className="inline-flex min-h-11 w-fit items-center gap-1 rounded-lg px-2 text-xs font-medium text-primary underline-offset-2 transition-colors hover:bg-primary-bg md:min-h-9"
          >
            <Plus className="size-4 shrink-0" aria-hidden />
            Thêm hoá đơn
          </button>
        ))}

      {!ghiDuoc && dsSapXep.length === 0 && (
        /* Nói rõ vì sao không có nút, đừng để khối trống trơn — người đọc tưởng app hỏng. */
        <span className="text-xs text-text-desc">
          Chỉ người lập đơn mua hàng mới ghi được hoá đơn.
        </span>
      )}
    </div>
  );
}
