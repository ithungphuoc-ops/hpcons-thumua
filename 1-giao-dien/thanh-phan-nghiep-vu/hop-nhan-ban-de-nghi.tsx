"use client";

import { useEffect, useState } from "react";
import { Copy, ListChecks } from "lucide-react";
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
import { formatNumber } from "@/6-tien-ich/dinh-dang";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import {
  maBanSaoTiepTheo,
  phieuGocCua,
  tenBanSaoTheoMa,
} from "@/2-quy-trinh/nhan-ban-de-nghi";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * HỘP NHÂN BẢN ĐỀ NGHỊ — chép phiếu rồi bỏ bớt mặt hàng ngay trong một thao tác.
 *
 * 🔴 Ban lãnh đạo 13/08/2026: *"nhân bản sẽ giữ nguyên toàn bộ thông tin chỉ thêm chữ
 * (copy) phía sau và có chức năng xóa bớt mặt hàng để giao cho nhân viên phù hợp"*.
 *
 * Đây là cách TÁCH PHIẾU: một đề nghị 10 mặt hàng cần hai người đi hỏi giá hai nhóm vật
 * tư khác nhau → nhân bản hai lần, mỗi lần giữ phần của một người, rồi giao riêng.
 *
 * 📌 Vì sao chọn ngay trong hộp nhân bản chứ không "nhân bản xong rồi vào sửa": tách phiếu
 * là một ý định trọn vẹn của người dùng. Bắt họ làm hai bước rời nhau thì bước hai dễ bị
 * quên, và một bản copy nguyên xi 10 mặt hàng nằm lại trong bảng trông y hệt phiếu gốc —
 * không ai biết cái nào là cái nào.
 *
 * ⚠️ Mặc định TÍCH HẾT. Người dùng chỉ muốn copy nguyên thì bấm thẳng nút, không phải đi
 * tick 10 dòng; còn muốn tách thì bỏ tick vài dòng. Mặc định trống sẽ khiến thao tác
 * thường gặp nhất thành thao tác tốn công nhất.
 */
export function HopNhanBanDeNghi({
  deNghi,
  mo,
  onDong,
  onXacNhan,
}: {
  /** Phiếu gốc. `null` khi chưa chọn phiếu nào — hộp vẫn dựng để hiệu ứng đóng chạy hết. */
  deNghi: DeNghiMuaHang | null;
  mo: boolean;
  onDong: () => void;
  /** Nhận danh sách `stt` các dòng được giữ lại. */
  onXacNhan: (sttGiuLai: number[]) => void;
}) {
  /** Cả kho đề nghị — cần để tra phiếu gốc và đếm số bản đã tách. */
  const { deNghi: dsDeNghi } = useDuLieu();
  const [chon, setChon] = useState<Set<number>>(new Set());

  /**
   * Mở hộp cho phiếu nào thì tích hết dòng của phiếu đó.
   * ⚠️ Phải phụ thuộc `deNghi?.id` chứ không phải `deNghi`: đối tượng dựng lại mỗi lần kho
   * dữ liệu đổi, để `deNghi` là lựa chọn của người dùng bị xóa sạch giữa chừng khi có
   * người khác trong phòng sửa một phiếu bất kỳ.
   */
  useEffect(() => {
    if (mo && deNghi) setChon(new Set(deNghi.items.map((d) => d.stt)));
  }, [mo, deNghi?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!deNghi) return null;

  const tatCa = deNghi.items;
  const soChon = chon.size;
  // Luật đặt tên và quan hệ cha–con: MỘT CHỖ DUY NHẤT, dùng chung với kho dữ liệu.
  const goc = phieuGocCua(deNghi, dsDeNghi);
  const maMoi = maBanSaoTiepTheo(deNghi, dsDeNghi);

  function doiDong(stt: number) {
    setChon((truoc) => {
      const s = new Set(truoc);
      if (s.has(stt)) s.delete(stt);
      else s.add(stt);
      return s;
    });
  }

  return (
    <Dialog open={mo} onOpenChange={(v: boolean) => !v && onDong()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nhân bản đề nghị {deNghi.code}</DialogTitle>
          {/**
           * 🔴 CÂU NÀY TỪNG NÓI SAI, ĐÃ SỬA 15/09/2026. Bản cũ ghi *"Bạn sẽ là người phụ trách
           * TOÀN BỘ mặt hàng của bản sao"*, trong khi `nhanBanDeNghi` (kho dữ liệu) **chỉ gán
           * người cho dòng gốc ĐÃ CÓ NGƯỜI** — chốt của Ban lãnh đạo 16/08/2026 (*"nhân bản ở
           * bước nào thì sẽ trả nhân bản ở đúng bước đó"*): dòng gốc chưa ai nhận thì bản copy
           * cũng để trống, nếu không bản copy tự nhảy sang bước ② trong khi phiếu gốc còn đứng
           * ở bước ①.
           *
           * ⚠️ Hộp nói quá phạm vi thật thì người dùng tưởng nhân bản là đã có người làm hết,
           * rồi dòng chưa ai nhận nằm treo — đúng kiểu giao diện hứa một việc app không làm.
           */}
          <DialogDescription>
            Bản sao giữ nguyên dự án, công trình, ngày cần hàng, người theo dõi và tài liệu
            đính kèm. <strong>Bạn nhận phần việc của những dòng đã có người phụ trách</strong>;
            dòng nào ở phiếu gốc chưa giao cho ai thì sang bản sao vẫn để trống, chờ phân bổ.
          </DialogDescription>
        </DialogHeader>

        {/* 🔴 Tên bản sao TÍNH BẰNG ĐÚNG HÀM mà kho dữ liệu dùng khi lưu
            (`2-quy-trinh/nhan-ban-de-nghi.ts`), không tự ghép chuỗi ở đây.

            Bản trước viết thẳng `{deNghi.tieuDe} (copy)` nên nhân bản từ một bản copy thì
            hộp báo *"… (copy) (copy)"* trong khi app lưu *"… (copy 2)"* — hộp nói một đằng,
            app làm một nẻo, và người dùng tin vào cái đọc được. Ban lãnh đạo phát hiện
            13/08/2026. */}
        <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
          <span className="text-text-desc">Mã phiếu mới: </span>
          <span className="font-semibold text-text-primary">{maMoi}</span>
          {/**
            * ★ IN ĐÚNG TÊN APP SẼ LƯU — sửa 17/09/2026.
            *
            * 🔴 Câu cũ ghi *"Tên đề xuất giữ nguyên: {goc.tieuDe}"*, nhưng từ 22/08/2026 Ban lãnh
            * đạo đã chốt tên bản tách **có thêm "(copy N)"** (*"tên của nó sẽ vẫn giống như công
            * việc cha chỉ thêm từ copy + số tt"*). Tức hộp hứa một đằng, app lưu một nẻo — đúng
            * loại lỗi mà chính khối chú thích ngay trên đây kể lại là Ban lãnh đạo đã bắt ngày
            * 13/08/2026, và nó quay lại lần thứ hai ở một câu khác.
            *
            * 📌 GỌI `tenBanSaoTheoMa` CHỨ KHÔNG TỰ GHÉP CHUỖI. Đó là bài học của chính file
            * `nhan-ban-de-nghi.ts`: hai chỗ cùng tính một cái tên thì sớm muộn lệch nhau.
            */}
          <span className="block text-xs text-text-desc">
            Tên đề xuất mới: {tenBanSaoTheoMa(goc.tieuDe, maMoi)}
          </span>
        </p>

        {/* Đứng ở một bản copy mà nhân bản tiếp thì nói rõ nó vẫn thuộc đề xuất lớn nào —
            quan hệ cha–con chỉ MỘT cấp, không sinh ra chuỗi cha–con–cháu. */}
        {goc.id !== deNghi.id && (
          <p className="text-xs text-text-desc">
            Bản mới vẫn thuộc đề xuất gốc <strong>{goc.code}</strong>, không phải con của{" "}
            {deNghi.code}.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
              <ListChecks className="size-4 shrink-0 text-text-desc" aria-hidden />
              Mặt hàng giữ lại ({soChon}/{tatCa.length})
            </span>
            {/* Hai nút này để tách phiếu nhanh: bỏ hết rồi tick vài dòng cần, thay vì bỏ
                tick từng dòng trong phiếu 20 mặt hàng. */}
            <span className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChon(new Set(tatCa.map((d) => d.stt)))}
              >
                Chọn hết
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setChon(new Set())}>
                Bỏ hết
              </Button>
            </span>
          </div>

          {/* Cuộn trong hộp: phiếu 20 mặt hàng thì danh sách dài hơn màn hình, mà nút xác
              nhận phải luôn nhìn thấy — đẩy nút xuống dưới màn là người dùng tưởng hộp hỏng. */}
          <ul className="flex max-h-64 flex-col divide-y divide-divider overflow-y-auto rounded-lg border border-border">
            {tatCa.map((d) => {
              const dangChon = chon.has(d.stt);
              return (
                <li key={d.stt}>
                  <label
                    className={`flex min-w-0 cursor-pointer items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-muted ${
                      dangChon ? "" : "opacity-55"
                    }`}
                  >
                    <Checkbox
                      checked={dangChon}
                      onCheckedChange={() => doiDong(d.stt)}
                      className="mt-0.5 shrink-0"
                      aria-label={`Giữ lại ${d.tenVatLieu}`}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-text-primary">
                        {d.stt}. {d.tenVatLieu}
                      </span>
                      <span className="truncate text-xs text-text-desc">
                        {d.quyCach ? `${d.quyCach} · ` : ""}
                        {formatNumber(d.khoiLuongDeNghi)} {d.donViTinh}
                        {/* Dòng đã có người phụ trách ở phiếu GỐC — nói rõ để người tách
                            biết mình đang cắt phần việc của ai ra. Ở BẢN SAO, người phụ
                            trách được gán cho chính người bấm nhân bản (15/08/2026). */}
                        {d.nguoiPhuTrachTen ? ` · đang giao ${d.nguoiPhuTrachTen}` : ""}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          {/* 🔴 Nút mờ PHẢI kèm lý do — nút mờ không giải thích là kiểu bí việc khó chịu
              nhất: người dùng bấm mãi không được mà chẳng biết vì sao. */}
          {soChon === 0 && (
            <p className="text-xs text-warning-soft">
              Chưa giữ mặt hàng nào. Phiếu không có vật tư thì không đi tiếp được bước nào —
              chọn ít nhất một dòng.
            </p>
          )}
          {/**
           * 🔴 LỜI DẶN CŨ ĐÃ BỎ — 15/09/2026. Bản cũ dặn: *"Muốn tách hẳn thì sau khi nhân bản,
           * vào phiếu gốc bỏ những dòng đã chuyển sang bản mới"*. **Nay không làm theo được**:
           * nút xoá dòng vật tư đã bị bỏ hẳn ngày 13/09/2026 theo chỉ đạo Sếp (*"Bỏ mục xoá
           * này"* — xem khối chú thích trong `bang-phan-bo.tsx`), nên người đọc câu đó sẽ đi tìm
           * một nút không còn tồn tại.
           *
           * ✅ Thay bằng đúng cách app đang làm từ 15/09/2026 — Sếp chốt: *"ở đề xuất chính sẽ
           * làm mờ các mặt hàng đã nhân bản đi"* và *"Không cần mua (nhưng hãy làm mờ đi để vẫn
           * xem được nhưng khi in ra sẽ ko thấy)"*. Tức là không phải dọn tay gì nữa.
           */}
          {soChon > 0 && soChon < tatCa.length && (
            <p className="text-xs text-text-desc">
              Phiếu gốc <strong>{deNghi.code}</strong> vẫn giữ đủ {tatCa.length} mặt hàng để tra
              lại, nhưng {soChon} dòng vừa chọn sẽ được{" "}
              <strong>làm mờ và ghi rõ đã nhân bản sang đâu</strong> — phiếu gốc không phải mua
              phần đó nữa, và khi in phiếu gốc ra giấy thì các dòng này không hiện. Không cần
              xóa tay dòng nào.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDong}>
            Hủy
          </Button>
          <Button
            disabled={soChon === 0}
            onClick={() => {
              onXacNhan([...chon]);
              onDong();
            }}
          >
            <Copy className="size-4" aria-hidden />
            Nhân bản {soChon} mặt hàng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
