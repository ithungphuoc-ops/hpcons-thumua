"use client";

import { useState } from "react";
import { AlertTriangle, Check, Eye, Paperclip, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/1-giao-dien/nen-tang-ui/card";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { formatNumber, formatMocThoiGian } from "@/6-tien-ich/dinh-dang";
import { CO_TOI_DA, KIEU_CHO_PHEP, catTep, coTep, moTep } from "@/3-du-lieu/kho-tep";
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
  /**
   * Nhà cung cấp đang nhập giá.
   *
   * 🔴 KHÔNG BẮT CHỌN TỪ DANH MỤC (chỉ đạo Ban lãnh đạo 11/08/2026, cùng nguyên tắc đã chốt
   * cho màn lập đơn ngày 10/08): thực tế báo giá đến từ bất kỳ nhà cung cấp nào, danh mục
   * chạy thử chỉ có 4 cái. Bắt chọn trong 4 cái đó thì người dùng phải gán bừa một tên khác,
   * và cả bảng so sánh lẫn đơn hàng sau này đều sai đối tượng.
   *
   * `nccId` chỉ có khi tra ra trong danh mục; không tra ra thì sinh khóa từ mã số thuế (định
   * danh duy nhất) hoặc từ tên — để hai lần nhập cùng một nhà cung cấp vẫn gom về một cột
   * trên bảng so sánh.
   */
  const [tenNCC, setTenNCC] = useState("");
  const [mstNCC, setMstNCC] = useState("");
  /** Khóa ngoài là `DongBaoGia.id`; giữ nguyên chuỗi đang gõ để người dùng xóa trắng được. */
  const [gia, setGia] = useState<Record<string, string>>({});
  const [soNgayGiao, setSoNgayGiao] = useState("");
  const [dangTai, setDangTai] = useState(false);

  /** Bỏ mọi ký tự không phải chữ số khi so mã số thuế — phiếu hay ghi gạch/khoảng trắng. */
  const soThue = (x?: string) => (x ?? "").replace(/\D/g, "");
  const chuan = (x: string) => x.trim().toLowerCase().replace(/\s+/g, " ");

  /** Nhà cung cấp đang nhập — tra danh mục để LIÊN KẾT nếu có, không tra ra vẫn nhập được. */
  const trongDanhMuc =
    nhaCungCap.find((n) => n.maSoThue && soThue(n.maSoThue) === soThue(mstNCC) && soThue(mstNCC) !== "") ??
    nhaCungCap.find((n) => chuan(n.ten) === chuan(tenNCC) && chuan(tenNCC) !== "");

  const ncc =
    tenNCC.trim() === ""
      ? undefined
      : {
          id:
            trongDanhMuc?.id ??
            (soThue(mstNCC) !== "" ? `ncc-mst-${soThue(mstNCC)}` : `ncc-ten-${chuan(tenNCC)}`),
          ten: tenNCC.trim(),
        };

  /** Nhà cung cấp nào đã có giá trong bảng — hiện để biết còn phải hỏi ai. */
  const daCoGia = [
    ...new Map(
      baoGia.items.flatMap((d) => d.baoGiaNCC.map((q) => [q.nccId, q.tenNCC] as const)),
    ),
  ];

  const tepDaTai = baoGia.tepBaoGia ?? [];

  /**
   * Tải bản báo giá gốc — LƯU NỘI DUNG THẬT vào kho tệp.
   *
   * 🔴 Trước 11/08/2026 chỗ này chỉ lấy `f.name` và `f.size` rồi vứt nội dung đi, trong khi
   * nhật ký vẫn ghi *"Tải lên bản báo giá X"*. Người dùng tin là đã lưu vào hệ thống, còn
   * hồ sơ thì thiếu chứng từ mà không ai biết. Sửa cùng đợt làm phiếu giao nhận cho thủ kho.
   */
  async function taiBanBaoGia(f: File) {
    if (!ncc) return; // Không có NCC thì tệp không biết thuộc về ai — vô dụng khi đối chiếu.
    setDangTai(true);
    try {
      const mt = await catTep(f, { uid: `ncc-${ncc.id}`, ten: nguoiDungTen });
      onDinhKem({ ...mt, nccId: ncc.id, tenNCC: ncc.ten });
      toast.success("Đã lưu bản báo giá", { description: `${mt.tenTep} · ${coTep(mt.kichThuoc)}` });
    } catch (e) {
      toast.error("Không lưu được tệp", {
        description: e instanceof Error ? e.message : "Trình duyệt không cho lưu tệp.",
      });
    } finally {
      setDangTai(false);
    }
  }

  async function xemTep(t: TepBaoGiaNCC) {
    if (await moTep(t)) return;
    toast.error("Không còn nội dung tệp", {
      description:
        "Tệp lưu trong trình duyệt của máy đã tải lên. Máy này không có bản sao — nhờ người tải lên gửi lại.",
    });
  }

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
    setTenNCC("");
    setMstNCC("");
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
              Chưa nhập giá của nhà cung cấp nào. Gõ tên nhà cung cấp bên dưới để bắt đầu — không
              cần họ có sẵn trong danh mục.
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

          {/* 🔴 Ô NHẬP TỰ DO, không phải dãy nút chọn sẵn — xem chú thích ở `tenNCC`. */}
          <div className="grid gap-2 md:grid-cols-[1fr_200px]">
            <Input
              value={tenNCC}
              onChange={(e) => setTenNCC(e.target.value)}
              placeholder="Tên nhà cung cấp (vd CÔNG TY TNHH HIỆP PHÁT)"
              aria-label="Tên nhà cung cấp gửi báo giá"
            />
            <Input
              value={mstNCC}
              onChange={(e) => setMstNCC(e.target.value)}
              placeholder="Mã số thuế"
              inputMode="numeric"
              aria-label="Mã số thuế nhà cung cấp"
            />
          </div>

          {/* Gợi ý bấm nhanh từ danh mục + từ những nhà cung cấp ĐÃ nhập trong bảng này —
              đỡ phải gõ lại tên dài khi sửa giá lần hai. */}
          {(nhaCungCap.length > 0 || daCoGia.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-text-desc">Chọn nhanh:</span>
              {[
                ...daCoGia.map(([id, ten]) => ({ id, ten, daNhap: true })),
                ...nhaCungCap
                  .filter((n) => !daCoGia.some(([id]) => id === n.id))
                  .map((n) => ({ id: n.id, ten: n.ten, daNhap: false })),
              ].map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    setTenNCC(n.ten);
                    const trong = nhaCungCap.find((x) => x.id === n.id);
                    setMstNCC(trong?.maSoThue ?? "");
                    // Nạp lại giá đã nhập trước đó để sửa, không bắt gõ lại từ đầu.
                    const cu: Record<string, string> = {};
                    for (const d of baoGia.items) {
                      const q = d.baoGiaNCC.find((x) => x.nccId === n.id);
                      if (q) cu[d.id] = String(q.donGia);
                    }
                    setGia(cu);
                    const bat = baoGia.items.flatMap((d) => d.baoGiaNCC).find((q) => q.nccId === n.id);
                    setSoNgayGiao(bat ? String(bat.thoiGianGiao) : "");
                  }}
                  className={`rounded-md px-2 py-1 text-xs transition-colors ${
                    n.daNhap
                      ? "bg-success-bg text-success-soft hover:bg-success/20"
                      : "bg-muted text-text-secondary hover:bg-muted/70"
                  }`}
                >
                  {n.ten}
                  {n.daNhap ? " · sửa giá" : ""}
                </button>
              ))}
            </div>
          )}

          {ncc && (
            <div className="flex flex-col gap-2.5 rounded-lg border border-border p-(--hp-md-row-pad)">
              <p className="text-xs text-text-desc">
                Điền đơn giá từng mặt hàng theo báo giá của <strong>{ncc.ten}</strong>. Mặt hàng
                họ không báo giá thì <strong>để trống</strong> — bảng so sánh cần biết ai báo
                thiếu dòng.
                {trongDanhMuc
                  ? " Nhà cung cấp này có trong danh mục."
                  : " Nhà cung cấp này chưa có trong danh mục — vẫn nhập giá bình thường, nhờ quản trị bổ sung sau để tra được công nợ."}
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
          <p className="text-xs text-text-desc">
            Trưởng bộ phận duyệt giá cần xem được bản gốc nhà cung cấp gửi, không chỉ tin con số
            gõ tay. Tải lên xong bấm <strong>Xem</strong> để mở lại đúng tệp đó.
          </p>

          {tepDaTai.length > 0 && (
            <ul className="flex flex-col gap-1">
              {tepDaTai.map((t, i) => (
                <li
                  key={`${t.tenTep}-${i}`}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
                >
                  <Paperclip className="size-3.5 shrink-0 text-text-desc" aria-hidden />
                  <span className="font-medium text-text-primary">{t.tenTep}</span>
                  <span className="text-text-desc">
                    {t.tenNCC} · {coTep(t.kichThuoc)} · {t.nguoiTaiTen} ·{" "}
                    {formatMocThoiGian(t.thoiDiem)}
                  </span>
                  {/* Bản ghi trước 11/08/2026 không có `id` vì hồi đó nội dung tệp chưa từng
                      được lưu — hiện nút thì bấm vào chỉ báo lỗi, nên ẩn luôn cho khỏi hụt hẫng. */}
                  {t.id && (
                    <button
                      type="button"
                      onClick={() => void xemTep(t)}
                      className="inline-flex min-h-7 items-center gap-1 rounded-md border border-border px-2 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
                    >
                      <Eye className="size-3.5 shrink-0" aria-hidden />
                      Xem
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <label className="w-fit">
            <input
              type="file"
              accept={KIEU_CHO_PHEP}
              className="sr-only"
              disabled={!ncc || dangTai}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void taiBanBaoGia(f);
              }}
            />
            <span
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors ${
                ncc && !dangTai
                  ? "cursor-pointer hover:border-primary hover:bg-muted"
                  : "pointer-events-none opacity-60"
              }`}
            >
              <Paperclip className="size-4" aria-hidden />
              {dangTai
                ? "Đang lưu tệp…"
                : ncc
                  ? `Tải bản báo giá của ${ncc.ten}`
                  : "Nhập tên nhà cung cấp trước khi tải tệp"}
            </span>
          </label>

          {/* ⚠️ Nói thẳng chỗ tệp đang nằm. Trước đây khối này hứa "đã tải lên" trong khi
              không lưu gì — nay lưu thật, nhưng vẫn phải nói rõ là lưu ở máy này. */}
          <p className="text-xs text-text-desc">
            <strong>Bản chạy thử lưu tệp trong trình duyệt máy này</strong>, chưa đưa lên máy chủ
            nên máy khác chưa mở xem được. Tối đa {CO_TOI_DA / 1024 / 1024}MB mỗi tệp.
          </p>
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
