"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Info, Lock, PackageCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { OChonNgay } from "@/1-giao-dien/thanh-phan-dung-chung/o-chon-ngay";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";
import { ODinhKemTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { LY_DO_NHANH_PHONG_BAN } from "@/2-quy-trinh/ho-so-phong-ban";
import {
  vuongMacGhiThemPhieuNhan,
  vuongMacKhoiLuongNhan,
  vuongMacSoPhieuNCC,
} from "@/2-quy-trinh/tinh-toan";
import type { MoTaTep } from "@/3-du-lieu/kho-tep";
import type {
  DongNhanHang,
  DonDatHang,
  PhieuNhanHang,
  TienDoDongPO,
} from "@/3-du-lieu/kieu-du-lieu";

/**
 * ★★★ HỘP "GHI NHẬN GIAO HÀNG" — ĐƯỜNG GHI PHIẾU NHẬN BẰNG TAY CHO **HỒ SƠ PHÒNG BAN**.
 * Thêm 15/09/2026.
 *
 * 🔴 VÌ SAO PHẢI CÓ — SẾP BÁO TRÊN BẢN THẬT 15/09/2026, phiếu `000000089` (Phòng Pháp lý):
 * *"phiếu 89 này là phiếu của phòng ban, nhưng nhân viên vẫn chưa thể bấm xác nhận nhận hàng"*.
 * Màn hình ghi *"Phiếu nhận hàng (0 lần giao)"*, đã nhận 0/5.
 *
 * Đo ra nguyên nhân: tầng ghi `themPhieuNhanPhongBan` (`3-du-lieu/kho-du-lieu.tsx`) **đã có**
 * và đã qua bài kiểm luật, nhưng **KHÔNG MỘT NÚT NÀO GỌI NÓ**. Không tạo được phiếu nhận ⇒
 * `khoiLuongConLai` không bao giờ về 0 ⇒ `poDaGiaoDu` không bật ⇒ nút *"Xác nhận đã nhận đủ
 * hàng"* không bao giờ hiện. Hồ sơ phòng ban vẫn kẹt đúng chỗ cũ, chỉ khác là nay kẹt vì thiếu
 * giao diện chứ không phải thiếu luật.
 *
 * ⚠️ BÀI HỌC GHI LẠI: một hàm ghi có đủ luật, đủ bài kiểm, mà không có đường vào thì **đứng về
 * phía người dùng là chưa làm gì cả**. `npm run kiem-luat` xanh 149/149 trong khi Sếp không
 * bấm được nút nào — chốt luật không thay được việc đi thử màn hình thật.
 *
 * 🔴 CHỈ ĐẠO PHẢI GIỮ ĐÚNG:
 *   · Sếp 14/09/2026: *"Các đề xuất từ phòng ban thì sẽ đi nhánh riêng… nhân viên mua hàng sẽ là
 *     người bấm hoàn thành và đính kèm phiếu giao hàng."*
 *   · Sếp 15/09/2026: *"E mở cho nhánh phòng ban"* · *"nhân viên thu mua tự hoàn thành, **NHƯNG
 *     phải đính kèm phiếu giao hàng**"*.
 * ⇒ ĐỔI NGƯỜI GHI NHẬN, **KHÔNG BỎ BẰNG CHỨNG**. Không có tệp phiếu giao thì nút Lưu khóa, và
 *   khóa có nói ra lý do.
 *
 * 🔴 KHÔNG PHẢI MỞ LẠI ĐƯỜNG GHI TAY TOÀN CỤC (bỏ 30/08/2026). Hồ sơ công trình vẫn nhận phiếu
 * qua app QLK CTR — nút này không hiện ở đó, và nếu có đường nào gọi lọt thì tầng ghi vẫn chặn
 * (`vuongMacGhiNhanGiaoHangPhongBan`, điều kiện ②).
 *
 * 🔴 LUÔN NẰM TRONG CÂY, KHÔNG BỌC `{x && <Hop/>}`. Cờ quyền và cờ mở là HAI thứ khác nhau:
 * tháo hộp thoại giữa lúc nó đang mở để lại node "mồ côi" che kín màn hình — cả app bấm không
 * ăn, không cuộn được, phải F5 (sự cố 13–14/09/2026, mất 6 lượt sửa mới truy ra; phân tích ở
 * `thanh-phan-dung-chung/don-dep-hop-thoai-ket.ts`). Vì vậy: nơi gọi dựng component này VÔ ĐIỀU
 * KIỆN, `duocGhiNhan` chỉ ẩn **cái nút**, còn `<Dialog>` thì luôn được mount.
 */
export function HopGhiNhanGiaoHang({
  po,
  /** Tiến độ của CHÍNH PO này — nhận từ nơi gọi để hai chỗ không tự tính ra hai con số. */
  tienDo,
  /** Các phiếu nhận đã có của PO — để soát trùng số phiếu NCC ngay lúc gõ. */
  phieuCuaPO,
  /**
   * Người đang xem có được ghi nhận giao hàng bằng tay cho hồ sơ này không.
   *
   * 🔴 NƠI GỌI TÍNH BẰNG `laHoSoPhongBan(...) && duocGhiNhanGiaoHangCuaHoSo(...)` — đúng hai
   * điều kiện ② và ③ của tầng ghi. Đừng tự chế điều kiện khác ở đây: nút mở mà tầng ghi từ chối
   * (hoặc ngược lại) thì không một dòng nào báo, người dùng chỉ thấy bấm xong không có gì xảy ra.
   */
  duocGhiNhan,
  /** Việc này đang mở NHỜ nhánh phòng ban → in câu `LY_DO_NHANH_PHONG_BAN` ra cho rõ. */
  moNhoNhanhPhongBan,
}: {
  po: DonDatHang;
  tienDo: TienDoDongPO[];
  phieuCuaPO: PhieuNhanHang[];
  duocGhiNhan: boolean;
  moNhoNhanhPhongBan: boolean;
}) {
  const { themPhieuNhanPhongBan } = useDuLieu();
  const { nguoiDung } = useNguoiDung();

  const [mo, setMo] = useState(false);
  const [ngayNhan, setNgayNhan] = useState("");
  const [soPhieuNCC, setSoPhieuNCC] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [tep, setTep] = useState<MoTaTep | undefined>(undefined);
  /**
   * Khối lượng thực nhận từng dòng, GIỮ DẠNG CHUỖI theo số thứ tự dòng PO.
   *
   * 🔴 Giữ chuỗi chứ không giữ số: ô nhập xóa trắng thì `Number("")` ra `0`, và nếu ép về số
   * ngay thì ô tự nhảy về "0" ngay khi người dùng vừa bôi đen xóa để gõ lại — không gõ nổi.
   */
  const [khoiLuong, setKhoiLuong] = useState<Record<number, string>>({});

  /**
   * Các dòng sắp ghi vào phiếu — CHỈ dòng có khối lượng > 0.
   *
   * 📌 Dòng để trống / gõ 0 bị loại hẳn, không ghi dòng 0 vào chứng từ: phiếu giao nhận là bản
   * ghi "lần này nhận những gì", một dòng 0 là nhiễu và sau này đọc lại không biết là nhận 0 hay
   * quên nhập.
   */
  const lines: DongNhanHang[] = useMemo(
    () =>
      tienDo
        .map((d) => ({ sttDongPO: d.sttDong, khoiLuongThucNhan: Number(khoiLuong[d.sttDong]) }))
        .filter((l) => Number.isFinite(l.khoiLuongThucNhan) && l.khoiLuongThucNhan > 0),
    [tienDo, khoiLuong],
  );

  /**
   * ★ BA LUẬT SẴN CÓ, CHẠY NGAY LÚC GÕ — cùng ba hàm mà tầng ghi sẽ chạy lại
   * (`2-quy-trinh/tinh-toan.ts`). Gọi lại đúng hàm chứ KHÔNG chép điều kiện sang đây: chép là
   * hai bản, và hai bản thì sớm muộn lệch nhau.
   *
   * 📌 Đây chỉ là báo sớm cho đỡ phí một cú bấm. Chốt thật vẫn ở tầng ghi — dữ liệu là kho chung
   * nhiều máy cùng sửa, phiếu của người khác có thể vào giữa lúc hộp này đang mở.
   */
  const chanThemPhieu = vuongMacGhiThemPhieuNhan(tienDo);
  const chanKhoiLuong = vuongMacKhoiLuongNhan(tienDo, lines);
  const chanSoPhieu = vuongMacSoPhieuNCC(soPhieuNCC, phieuCuaPO);

  /**
   * ★★ VÌ SAO NÚT LƯU ĐANG KHÓA — `null` là mở.
   *
   * 🔴 KHÓA THÌ PHẢI NÓI RA LÝ DO, KHÔNG ĐỂ NÚT XÁM TRƠ. Người dùng nhìn nút mờ mà không biết
   * thiếu gì sẽ tưởng app hỏng rồi bỏ đi — đúng cái đã xảy ra với chính hồ sơ `000000089`.
   *
   * 🔴 THỨ TỰ CÓ CHỦ Ý: điều kiện tệp phiếu giao đứng NGAY SAU điều kiện "đơn đã nhận đủ", trước
   * mọi thứ khác — đó là câu thứ hai của Sếp, không phải một ô nhập cho đủ bộ.
   */
  const lyDoKhoaLuu: string | null =
    chanThemPhieu ??
    (!tep
      ? "Chưa đính kèm phiếu giao hàng của lần giao này — đây là bằng chứng bắt buộc, không có thì không ghi nhận được."
      : null) ??
    (ngayNhan === "" ? "Chưa chọn ngày nhận hàng thực tế." : null) ??
    (lines.length === 0
      ? "Chưa nhập khối lượng thực nhận cho dòng vật tư nào của lần giao này."
      : null) ??
    chanKhoiLuong ??
    chanSoPhieu;

  /**
   * Mở hộp và ĐIỀN SẴN khối lượng còn lại cho từng dòng — mặc định đúng ca hay gặp nhất (giao
   * đủ một lần), vẫn sửa được cho ca giao làm nhiều đợt.
   *
   * ⚠️ Chỉ điền lúc MỞ, không theo dõi `tienDo` về sau: đang gõ dở mà kho chung có phiếu mới về
   * thì con số tự nhảy dưới tay người dùng còn tệ hơn. Nhập thừa đã có `vuongMacKhoiLuongNhan`
   * bắt lại, cả ở đây lẫn ở tầng ghi.
   */
  function moHop() {
    const mac: Record<number, string> = {};
    for (const d of tienDo) mac[d.sttDong] = d.khoiLuongConLai > 0 ? String(d.khoiLuongConLai) : "";
    setKhoiLuong(mac);
    /* Ngày mặc định = hôm nay, theo giờ MÁY NGƯỜI DÙNG. Cố ý KHÔNG dùng `toISOString()`: hàm đó
       trả giờ UTC, nên ở Việt Nam (UTC+7) mọi thao tác trước 07:00 sáng sẽ ghi lùi một ngày —
       trên một tờ chứng từ giao nhận thì đó là sai ngày thật, không phải sai vặt. */
    const n = new Date();
    const hai = (x: number) => String(x).padStart(2, "0");
    setNgayNhan(`${n.getFullYear()}-${hai(n.getMonth() + 1)}-${hai(n.getDate())}`);
    setSoPhieuNCC("");
    setGhiChu("");
    setTep(undefined);
    setMo(true);
  }

  /** Đóng hộp. KHÔNG xóa dữ liệu ở đây — xem `luu()`. */
  function dong() {
    setMo(false);
  }

  function luu() {
    /**
     * 🔴🔴 ĐỌC GIÁ TRỊ TRẢ VỀ RỒI MỚI ĐƯỢC ĐÓNG — CLAUDE.md §3.5, bài học 24/08/2026:
     * *"nơi gọi xóa form rồi đóng khối coi như đã lưu, trong khi không phiếu nào được ghi"*.
     *
     * `null` = đã ghi thật · chuỗi = lý do bị chặn. Bị chặn thì **giữ nguyên hộp và giữ nguyên
     * mọi thứ người dùng vừa nhập** — kể cả tệp vừa đính kèm. Bắt họ gõ lại cả phiếu vì một câu
     * số phiếu trùng là cách chắc chắn để lần sau họ không dùng nút này nữa.
     */
    const loi = themPhieuNhanPhongBan({
      poId: po.id,
      poCode: po.code,
      ngayNhanThucTe: ngayNhan,
      nguoiNhanUid: nguoiDung.uid,
      nguoiNhanTen: nguoiDung.tenHienThi,
      soPhieuGiaoNCC: soPhieuNCC.trim() || undefined,
      tepPhieuGiao: tep,
      /* `da_nhap_kho` — hàng đã về thật và có phiếu giao nhận kèm theo, nên được tính ngay vào
         khối lượng đã nhận (nguyên tắc dữ liệu số 4: chỉ trạng thái này mới được tính).
         📌 Hồ sơ phòng ban KHÔNG có bước thủ kho kiểm tra ở giữa — để `cho_kiem_tra` thì khối
         lượng không được tính, và hồ sơ lại kẹt đúng như trước 15/09/2026, tức nút này vô nghĩa. */
      trangThai: "da_nhap_kho",
      ghiChuTinhTrangHang: ghiChu.trim() || undefined,
      lines,
    });
    if (loi) {
      toast.error("Chưa ghi nhận được lần giao này", { description: loi });
      return;
    }
    toast.success("Đã ghi nhận giao hàng", {
      description: `${po.code} — đã cộng khối lượng lần giao này vào tiến độ nhận hàng.`,
    });
    dong();
  }

  return (
    <>
      {/* 🔴 CHỈ CÁI NÚT bị ẩn theo quyền. `<Dialog>` bên dưới luôn nằm trong cây — xem chú thích
          đầu tệp về node "mồ côi" che kín màn hình. */}
      {duocGhiNhan && (
        <Button size="sm" variant="outline" className="min-h-11 md:min-h-9" onClick={moHop}>
          <PackageCheck className="size-4" aria-hidden />
          Ghi nhận giao hàng
        </Button>
      )}

      <Dialog open={mo && duocGhiNhan} onOpenChange={(v: boolean) => !v && dong()}>
        {/* 🔴 PHẢI VIẾT `sm:max-w-…`. `max-w-…` trơn bị lớp gốc `sm:max-w-sm` của base-nova đè
            IM LẶNG — không lỗi lint, không lỗi build, hộp cứ kẹt 384px và bảng khối lượng bên
            trong không đọc nổi (đã dính với 9 hộp thoại ngày 15/08/2026).
            `max-h` + cuộn DỌC ở phần thân: đơn nhiều dòng vật tư thì cuộn trong hộp, không đẩy
            nút "Lưu lần giao này" ra khỏi tầm mắt — đúng khuôn `hop-sua-truong-tuy-chinh.tsx`. */}
        <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ghi nhận giao hàng — {po.code}</DialogTitle>
            <DialogDescription>
              Ghi lại MỘT lần giao: nhận những gì, ngày nào, kèm phiếu giao hàng của nhà cung cấp.
              Giao làm nhiều đợt thì mỗi đợt ghi một lần, không cộng gộp.
            </DialogDescription>
          </DialogHeader>

          {/* ⚠️ Nới quyền thì phải nói ra ngay tại chỗ, không nới im lặng — người dùng thấy hồ sơ
              phòng ban làm được việc mà hồ sơ công trình không làm được sẽ tưởng luật đã đổi cho
              tất cả, rồi đi đòi làm y vậy trên hồ sơ công trình (nơi chốt "chỉ thủ kho xác nhận"
              là chốt kiểm soát nặng nhất của app).
              📌 Câu chữ lấy từ `LY_DO_NHANH_PHONG_BAN` — một chỗ duy nhất.
              ⚠️ Có CẢ MÀU LẪN CHỮ + icon (Design System V1.1). Ba token `border-warning` /
              `bg-warning-bg` / `text-warning-soft` đều có thật trong `app/globals.css`. */}
          {moNhoNhanhPhongBan && (
            <p className="flex items-start gap-1.5 rounded-lg border border-warning bg-warning-bg px-3 py-2 text-xs text-warning-soft">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                {LY_DO_NHANH_PHONG_BAN} Phiếu giao hàng vẫn là <strong>bắt buộc</strong> — đây là
                bằng chứng duy nhất còn lại khi không có thủ kho đứng giữa.
              </span>
            </p>
          )}

          {/* Đơn đã nhận đủ thì không còn lần giao nào để ghi. Nói thẳng, đừng để người dùng nhập
              hết cả phiếu rồi mới nhận câu từ chối ở tầng ghi. */}
          {chanThemPhieu && (
            <p className="flex items-start gap-1.5 rounded-lg border border-border bg-muted px-3 py-2 text-xs text-text-desc">
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{chanThemPhieu}</span>
            </p>
          )}

          {/* Phần thân CUỘN ĐƯỢC; hàng lý do khóa và nút bấm nằm NGOÀI nên luôn nhìn thấy —
              đơn nhiều dòng vật tư thì người dùng không phải cuộn xuống đáy mới biết vì sao chưa
              lưu được, và nút "Lưu lần giao này" không bị đẩy khỏi tầm mắt. */}
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
            <div className="flex flex-wrap gap-3">
              <div className="flex min-w-48 flex-1 flex-col gap-1.5">
                <Label htmlFor="ggh-ngay">Ngày nhận hàng thực tế</Label>
                <OChonNgay
                  id="ggh-ngay"
                  nhan="Ngày nhận hàng thực tế"
                  giaTri={ngayNhan}
                  onDoi={setNgayNhan}
                  xoaDuoc={false}
                />
              </div>
              <div className="flex min-w-48 flex-1 flex-col gap-1.5">
                <Label htmlFor="ggh-so-phieu">Số phiếu giao của nhà cung cấp</Label>
                <Input
                  id="ggh-so-phieu"
                  className="min-h-11 md:min-h-9"
                  placeholder="vd PGN-231"
                  value={soPhieuNCC}
                  onChange={(e) => setSoPhieuNCC(e.target.value)}
                />
                {/* 🔴 Ban lãnh đạo 15/08/2026: *"tên phiếu giao nhận phải khác nhau, không được
                    trùng tên"* — trùng số thì kế toán không biết hóa đơn nào ứng với lần giao
                    nào, và một lần giao có thể bị trả tiền hai lần. Luật ở `vuongMacSoPhieuNCC`.
                    📌 ĐỂ TRỐNG ĐƯỢC: không phải nhà cung cấp nào cũng đánh số phiếu. */}
                {chanSoPhieu ? (
                  <span className="flex items-start gap-1.5 text-xs text-danger">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{chanSoPhieu}</span>
                  </span>
                ) : (
                  <span className="text-xs text-text-desc">
                    Để trống được. Mỗi lần giao một số riêng thì sau này mới đối chiếu được.
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text-primary">
                Khối lượng thực nhận của lần giao này
              </span>
              {/* Card List cho mọi cỡ màn: mỗi dòng vật tư một thẻ, ô nhập không bao giờ bị ép
                  hẹp như trong bảng nhiều cột trên điện thoại (Design System V1.1). */}
              {/* KHÔNG đặt khung cuộn riêng ở đây: phần thân hộp đã cuộn rồi, lồng hai vùng cuộn
                  vào nhau là người dùng gặp hai thanh cuộn và không biết mình đang cuộn cái nào. */}
              <ul className="flex flex-col gap-2">
                {tienDo.map((d) => (
                  <li
                    key={d.sttDong}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-surface p-2.5"
                  >
                    <span className="flex min-w-40 flex-1 flex-col">
                      <span className="text-sm font-medium text-text-primary">
                        {d.sttDong}. {d.tenVatLieu}
                      </span>
                      <span className="text-xs text-text-desc">
                        Đặt {d.khoiLuongDat.toLocaleString("vi-VN")} · đã nhận{" "}
                        {d.khoiLuongDaNhan.toLocaleString("vi-VN")} ·{" "}
                        <span
                          className={
                            d.khoiLuongConLai > 0
                              ? "font-semibold text-warning-soft"
                              : "font-semibold text-success-soft"
                          }
                        >
                          {d.khoiLuongConLai > 0
                            ? `còn lại ${d.khoiLuongConLai.toLocaleString("vi-VN")} ${d.donViTinh}`
                            : "đã nhận đủ"}
                        </span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        className="min-h-11 w-28 text-right md:min-h-9"
                        aria-label={`Khối lượng thực nhận dòng ${d.sttDong} — ${d.tenVatLieu}`}
                        value={khoiLuong[d.sttDong] ?? ""}
                        onChange={(e) =>
                          setKhoiLuong((truoc) => ({ ...truoc, [d.sttDong]: e.target.value }))
                        }
                      />
                      <span className="w-14 text-xs text-text-desc">{d.donViTinh}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {chanKhoiLuong && (
                <span className="flex items-start gap-1.5 text-xs text-danger">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>{chanKhoiLuong}</span>
                </span>
              )}
            </div>

            {/* ---- PHIẾU GIAO HÀNG — BẮT BUỘC ----
                🔴 Câu thứ hai của Sếp 15/09/2026, và là chỉ đạo 11/08/2026 của Ban lãnh đạo.
                Tầng ghi chặn lại lần nữa (`vuongMacGhiNhanGiaoHangPhongBan`, điều kiện ④) nên
                không có đường nào lọt — ô này chỉ làm phần việc nói cho người dùng biết sớm.
                ⚠️ Người dùng đính tệp rồi bấm Hủy thì tệp đã nằm trong kho tệp mà không gắn vào
                hồ sơ nào (`kho-tep.ts` không tự dọn). Chấp nhận như mọi ô đính kèm khác trong
                app: mất một chỗ trống trong kho còn hơn mất chứng từ vì dọn nhầm. */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text-primary">
                Phiếu giao hàng của lần giao này <span className="text-danger">(bắt buộc)</span>
              </span>
              <ODinhKemTep
                tep={tep}
                nhanThem="Đính kèm phiếu giao hàng (bắt buộc)"
                batBuoc={!tep}
                nguoi={{ uid: nguoiDung.uid, ten: nguoiDung.tenHienThi }}
                /* Trả `null` = đã nhận. Ở đây chỉ giữ vào state của hộp, chưa ghi vào hồ sơ —
                   phiếu chỉ ra đời khi bấm Lưu, và tầng ghi mới là nơi nhận tệp thật. */
                onXong={(t) => {
                  setTep(t);
                  return null;
                }}
                onXoa={() => setTep(undefined)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ggh-ghi-chu">Ghi chú tình trạng hàng (không bắt buộc)</Label>
              <Textarea
                id="ggh-ghi-chu"
                rows={2}
                placeholder="vd Hàng về đủ, bao bì nguyên vẹn. Hoặc: thiếu 2 bao, NCC hẹn giao bù."
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
              />
            </div>
          </div>

          {/* 🔴 LÝ DO KHÓA HIỆN NGAY TRÊN NÚT, không giấu trong `title` của nút xám. Trạng thái
              có CẢ MÀU LẪN CHỮ + icon (Design System V1.1). */}
          {lyDoKhoaLuu && (
            <p className="flex items-start gap-1.5 rounded-lg border border-warning bg-warning-bg px-3 py-2 text-xs text-warning-soft">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                <strong>Chưa lưu được:</strong> {lyDoKhoaLuu}
              </span>
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={dong}>
              Hủy
            </Button>
            <Button disabled={lyDoKhoaLuu !== null} onClick={luu}>
              <PackageCheck className="size-4" aria-hidden />
              Lưu lần giao này
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
