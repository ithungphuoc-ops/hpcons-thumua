"use client";

import { useState } from "react";
import { AlertTriangle, Check, Paperclip, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/1-giao-dien/nen-tang-ui/card";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { formatNumber, formatMocThoiGian, thoiDiemHienTai } from "@/6-tien-ich/dinh-dang";
import type { BaoGia, NhaCungCap, TepBaoGiaNCC } from "@/3-du-lieu/kieu-du-lieu";

/**
 * BƯỚC ② YÊU CẦU NCC BÁO GIÁ — nơi làm việc thật của nhân viên thu mua.
 *
 * 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 10/08/2026: *"chưa có tiến trình của bước yêu cầu NCC báo giá.
 * Mục đó nv tm sẽ up báo giá của các nhà cung cấp lên để trưởng bộ phận xem xét"*.
 *
 * Trước đây bước ② không có việc gì để làm: giá được điền GIẢ LẬP bằng một nút, nên nhân
 * viên không nhập được giá thật và trưởng bộ phận không có gì để xem xét.
 *
 * Ba việc ở đây, đúng thứ tự nhân viên làm:
 *   1. Nhập giá từng nhà cung cấp (mỗi lần một nhà cung cấp, đúng như nhận email báo giá)
 *   2. Tải lên bản báo giá gốc nhà cung cấp gửi về, làm bằng chứng cho trưởng bộ phận
 *   3. Trình trưởng bộ phận xem xét → chuyển sang bước ③
 *
 * ⚠️ Nút trình duyệt bị KHÓA khi chưa có giá của nhà cung cấp nào — trình một bảng trắng thì
 * trưởng bộ phận không có gì để duyệt.
 */
export function KhoiThuThapBaoGia({
  baoGia,
  nhaCungCap,
  nguoiDungTen,
  onNhapGia,
  onDinhKem,
  onTrinhXetDuyet,
}: {
  baoGia: BaoGia;
  nhaCungCap: NhaCungCap[];
  nguoiDungTen: string;
  onNhapGia: (
    ncc: { nccId: string; tenNCC: string },
    giaTheoDong: Record<string, { donGia: number; thoiGianGiao: number }>,
  ) => void;
  onDinhKem: (tep: TepBaoGiaNCC) => void;
  onTrinhXetDuyet: () => void;
}) {
  /** Nhà cung cấp đang nhập giá. Rỗng = chưa chọn ai. */
  const [nccDangNhap, setNccDangNhap] = useState("");
  /** Khóa ngoài là `DongBaoGia.id`; giữ nguyên chuỗi đang gõ để người dùng xóa trắng được. */
  const [gia, setGia] = useState<Record<string, string>>({});
  const [soNgayGiao, setSoNgayGiao] = useState("");

  const ncc = nhaCungCap.find((n) => n.id === nccDangNhap);

  /** Nhà cung cấp nào đã có giá trong bảng — hiện để biết còn phải hỏi ai. */
  const daCoGia = [
    ...new Map(
      baoGia.items.flatMap((d) => d.baoGiaNCC.map((q) => [q.nccId, q.tenNCC] as const)),
    ),
  ];

  const tepDaTai = baoGia.tepBaoGia ?? [];

  function luuGia() {
    if (!ncc) return;
    const ngayGiao = Number(soNgayGiao) || 0;
    const theoDong: Record<string, { donGia: number; thoiGianGiao: number }> = {};
    for (const d of baoGia.items) {
      const n = Number(gia[d.id]);
      // Ô trống hoặc gõ bậy = nhà cung cấp không báo giá dòng này. Không tự cho 0, vì 0 đồng
      // là một mức giá hợp lệ về mặt kỹ thuật và sẽ thắng mọi so sánh.
      if (Number.isFinite(n) && n > 0) theoDong[d.id] = { donGia: n, thoiGianGiao: ngayGiao };
    }
    onNhapGia({ nccId: ncc.id, tenNCC: ncc.ten }, theoDong);
    setNccDangNhap("");
    setGia({});
    setSoNgayGiao("");
  }

  return (
    <Card className="border-warning">
      <CardHeader>
        <CardTitle className="text-base">Thu thập báo giá nhà cung cấp</CardTitle>
        <p className="text-xs text-text-desc">
          Nhập giá từng nhà cung cấp và tải lên bản báo giá họ gửi về, rồi trình trưởng bộ phận
          xem xét. Hạn nộp báo giá: <strong>{formatMocThoiGian(baoGia.hanNop)}</strong>.
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
        {/* ---- Đã nhận báo giá của ai ---- */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-desc">
            Đã có giá của {daCoGia.length} nhà cung cấp
          </span>
          {daCoGia.length === 0 ? (
            <p className="text-sm text-text-desc">
              Chưa nhập giá của nhà cung cấp nào. Chọn một nhà cung cấp bên dưới để bắt đầu.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {daCoGia.map(([id, ten]) => (
                <span
                  key={id}
                  className="flex items-center gap-1 rounded-md bg-success-bg px-2 py-0.5 text-xs font-medium text-success-soft"
                >
                  <Check className="size-3.5 shrink-0" aria-hidden />
                  {ten}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ---- Nhập giá một nhà cung cấp ---- */}
        <div className="flex flex-col gap-2 border-t border-divider pt-(--hp-md-card-gap)">
          <Label>Nhập giá cho nhà cung cấp</Label>
          <div className="flex flex-wrap gap-2">
            {nhaCungCap.map((n) => (
              <Button
                key={n.id}
                size="sm"
                variant={nccDangNhap === n.id ? "default" : "outline"}
                onClick={() => {
                  // Bấm lại chính nhà cung cấp đang mở thì đóng khối nhập.
                  if (nccDangNhap === n.id) {
                    setNccDangNhap("");
                    setGia({});
                    return;
                  }
                  setNccDangNhap(n.id);
                  // Nạp lại giá đã nhập trước đó để sửa, không phải gõ lại từ đầu.
                  const cu: Record<string, string> = {};
                  for (const d of baoGia.items) {
                    const q = d.baoGiaNCC.find((x) => x.nccId === n.id);
                    if (q) cu[d.id] = String(q.donGia);
                  }
                  setGia(cu);
                  const bat = baoGia.items
                    .flatMap((d) => d.baoGiaNCC)
                    .find((q) => q.nccId === n.id);
                  setSoNgayGiao(bat ? String(bat.thoiGianGiao) : "");
                }}
              >
                {n.ten}
              </Button>
            ))}
          </div>

          {ncc && (
            <div className="flex flex-col gap-2.5 rounded-lg border border-border p-(--hp-md-row-pad)">
              <p className="text-xs text-text-desc">
                Điền đơn giá từng mặt hàng theo báo giá của <strong>{ncc.ten}</strong>. Mặt hàng
                họ không báo giá thì <strong>để trống</strong> — bảng so sánh cần biết ai báo
                thiếu dòng.
              </p>

              {baoGia.items.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 flex-1 text-sm text-text-primary">
                    {d.tenVatLieu}
                    <span className="text-text-desc">
                      {" "}
                      · {formatNumber(d.khoiLuong)} {d.donViTinh}
                    </span>
                  </span>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="Đơn giá (đ)"
                    value={gia[d.id] ?? ""}
                    onChange={(e) => setGia((t) => ({ ...t, [d.id]: e.target.value }))}
                    className="w-40"
                    aria-label={`Đơn giá ${d.tenVatLieu} của ${ncc.ten}`}
                  />
                </div>
              ))}

              <div className="flex flex-wrap items-end gap-3 border-t border-divider pt-2.5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ngay-giao-ncc">Số ngày giao hàng</Label>
                  <Input
                    id="ngay-giao-ncc"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="vd 3"
                    value={soNgayGiao}
                    onChange={(e) => setSoNgayGiao(e.target.value)}
                    className="w-28"
                  />
                </div>
                <Button size="sm" onClick={luuGia}>
                  <Check className="size-4" aria-hidden />
                  Lưu giá của {ncc.ten}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ---- Tải lên bản báo giá gốc ---- */}
        <div className="flex flex-col gap-2 border-t border-divider pt-(--hp-md-card-gap)">
          <Label>Bản báo giá nhà cung cấp gửi về ({tepDaTai.length})</Label>
          {/* ⚠️ Nói thẳng giới hạn: bản chạy thử chỉ ghi nhận đã nhận tệp, chưa mở xem được.
              Hứa hẹn mở được rồi bấm vào không có gì là mất lòng tin vào cả app. */}
          <p className="text-xs text-text-desc">
            Bản chạy thử chỉ <strong>ghi nhận đã nhận tệp nào, của ai, lúc nào</strong> để trưởng
            bộ phận đối chiếu — chưa lưu và chưa mở xem được nội dung tệp (cần nối Firebase
            Storage).
          </p>

          {tepDaTai.length > 0 && (
            <ul className="flex flex-col gap-1">
              {tepDaTai.map((t, i) => (
                <li key={`${t.tenTep}-${i}`} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <Paperclip className="size-3.5 shrink-0 text-text-desc" aria-hidden />
                  <span className="font-medium text-text-primary">{t.tenTep}</span>
                  <span className="text-text-desc">
                    {t.tenNCC} · {Math.max(1, Math.round(t.kichThuoc / 1024))} KB ·{" "}
                    {t.nguoiTaiTen} · {formatMocThoiGian(t.thoiDiem)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <label className="w-fit">
            <input
              type="file"
              accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                if (!ncc) {
                  // Không có nhà cung cấp thì tệp không biết thuộc về ai — vô dụng khi đối chiếu.
                  return;
                }
                onDinhKem({
                  nccId: ncc.id,
                  tenNCC: ncc.ten,
                  tenTep: f.name,
                  kichThuoc: f.size,
                  nguoiTaiTen: nguoiDungTen,
                  thoiDiem: thoiDiemHienTai(),
                });
              }}
            />
            <span
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors ${
                ncc ? "cursor-pointer hover:border-primary hover:bg-muted" : "pointer-events-none opacity-60"
              }`}
            >
              <Paperclip className="size-4" aria-hidden />
              {ncc ? `Tải bản báo giá của ${ncc.ten}` : "Chọn nhà cung cấp trước khi tải tệp"}
            </span>
          </label>
        </div>

        {/* ---- Trình trưởng bộ phận ---- */}
        <div className="flex flex-wrap items-center gap-3 border-t border-divider pt-(--hp-md-card-gap)">
          <Button onClick={onTrinhXetDuyet} disabled={daCoGia.length === 0}>
            <Send className="size-4" aria-hidden />
            Trình trưởng bộ phận xem xét
          </Button>
          {daCoGia.length === 0 ? (
            <span className="flex items-center gap-1.5 text-xs text-warning-soft">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              Cần nhập giá của ít nhất một nhà cung cấp trước khi trình.
            </span>
          ) : (
            <span className="text-xs text-text-desc">
              {/* Nhắc ra số, không phán "đủ" hay "thiếu" — chỉ người lập biết đã hỏi hết chưa. */}
              Đã có giá của {daCoGia.length} nhà cung cấp. Trình xong sẽ chuyển sang bước “Xét
              duyệt báo giá”, trưởng bộ phận là người chốt.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
