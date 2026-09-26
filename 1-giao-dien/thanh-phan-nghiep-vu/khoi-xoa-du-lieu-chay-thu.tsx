"use client";

import { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { formatDate } from "@/6-tien-ich/dinh-dang";

/**
 * ★★ VÙNG NGUY HIỂM — CHỌN TỪNG ĐỀ NGHỊ ĐỂ XOÁ.
 *
 * ❌ ĐÃ BỎ NÚT "Xóa toàn bộ dữ liệu của cả phòng" — Sếp 26/09/2026: *"Quá nguy hiểm"*, rồi chốt
 * *"nếu xoá thì sẽ cho chọn từng cái để xoá, ko được xoá toàn bộ"*. Phản biện cùng ngày cho thấy
 * làm nút khôi phục cho việc xoá toàn bộ không an toàn được (bản sao ai cũng ghi đè được, mã hồ
 * sơ bị cấp trùng sau khi xoá, máy khác đang mở app ghi đè ngược lại) — nên bỏ hẳn, không vá.
 * 🔴 ĐỪNG DỰNG LẠI NÚT XOÁ TOÀN BỘ. Cần dọn cả kho thì chạy lệnh quản trị có sao lưu ra tệp.
 *
 * 📌 Luật phiếu nào xoá được nằm ở `2-quy-trinh/xoa-de-nghi.ts` (đã có báo giá/đơn hàng thì
 * chặn, phiếu cha chỉ xoá được khi chọn cả bản con). Khối này chỉ hiện kết quả.
 *
 * 🔴 GÁC BẰNG `quyen.xoaToanBoDuLieu` (chỉ `admin`), không dùng cờ của trang chứa nó — trang Cài
 * đặt quy trình mở cho cả Trưởng bộ phận cấp 3. Tự trả `null` khi không đủ quyền.
 */
export function KhoiXoaDuLieuChayThu() {
  const { deNghi, xoaNhieuDeNghi } = useDuLieu();
  const { quyen } = useNguoiDung();
  const [tuKhoa, doiTuKhoa] = useState("");
  const [daChon, doiDaChon] = useState<ReadonlySet<string>>(new Set());
  const [hoiXoa, doiHoiXoa] = useState(false);

  const ketQua = useMemo(() => {
    const k = tuKhoa.trim().toLowerCase();
    const ds = [...deNghi].sort((a, b) => a.code.localeCompare(b.code));
    if (!k) return ds;
    return ds.filter((d) =>
      [d.code, d.maDeXuatAppRequest ?? "", d.tieuDe, d.tenCongTrinh]
        .join(" ")
        .toLowerCase()
        .includes(k),
    );
  }, [deNghi, tuKhoa]);

  if (!quyen.xoaToanBoDuLieu) return null;

  // Chỉ đếm phiếu còn tồn tại — phiếu đã bị xoá từ máy khác thì tự rơi khỏi lựa chọn.
  const chon = deNghi.filter((d) => daChon.has(d.id));

  const batTat = (id: string, bat: boolean) =>
    doiDaChon((truoc) => {
      const moi = new Set(truoc);
      if (bat) moi.add(id);
      else moi.delete(id);
      return moi;
    });

  const thucHienXoa = () => {
    const { daXoa, biChan } = xoaNhieuDeNghi(chon.map((d) => d.id));
    doiDaChon(new Set(biChan.map((b) => b.id)));
    if (daXoa.length > 0) toast.success(`Đã xóa ${daXoa.length} đề nghị`);
    if (biChan.length > 0) {
      const ma = (id: string) => deNghi.find((d) => d.id === id)?.code ?? id;
      toast.error(`${biChan.length} đề nghị không xóa được`, {
        description: biChan.map((b) => `${ma(b.id)}: ${b.lyDo}`).join("\n"),
      });
    }
  };

  return (
    <>
      <Card className="border-danger/40">
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-danger-soft">Vùng nguy hiểm — Xóa đề nghị</h2>
            <p className="text-sm text-text-secondary">
              Chọn từng đề nghị cần xóa hẳn khỏi kho dữ liệu chung. Cả phòng cùng mất các đề nghị
              đã xóa, không khôi phục lại được. Đề nghị đã có báo giá hoặc đơn đặt hàng thì không
              xóa được — dùng “Đánh dấu thất bại”.
            </p>
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-desc"
              aria-hidden
            />
            <Input
              value={tuKhoa}
              onChange={(e) => doiTuKhoa(e.target.value)}
              placeholder="Tìm theo mã, mã đề xuất, tiêu đề, công trình…"
              className="pl-9"
              aria-label="Tìm đề nghị cần xóa"
            />
          </div>

          <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
            {ketQua.length === 0 ? (
              <p className="p-4 text-center text-sm text-text-desc">Không có đề nghị nào khớp.</p>
            ) : (
              <ul className="divide-y divide-border">
                {ketQua.map((d) => (
                  <li key={d.id}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted">
                      <Checkbox
                        checked={daChon.has(d.id)}
                        onCheckedChange={(v) => batTat(d.id, v === true)}
                        aria-label={`Chọn xóa ${d.code}`}
                      />
                      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                        <span className="font-medium text-text-primary">{d.code}</span>
                        {d.maDeXuatAppRequest && (
                          <span className="text-text-desc">Mã đề xuất {d.maDeXuatAppRequest}</span>
                        )}
                        {d.deNghiChaId && <span className="text-text-desc">Bản con</span>}
                        <span className="min-w-0 truncate text-text-secondary">{d.tieuDe}</span>
                        <span className="text-text-desc">{formatDate(d.ngayDeNghi)}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="destructive"
              size="sm"
              disabled={chon.length === 0}
              onClick={() => doiHoiXoa(true)}
            >
              <Trash2 className="size-4 shrink-0" aria-hidden />
              Xóa {chon.length > 0 ? `${chon.length} ` : ""}đề nghị đã chọn
            </Button>
            {chon.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => doiDaChon(new Set())}>
                Bỏ chọn
              </Button>
            )}
            <span className="text-sm text-text-desc">Đang có {deNghi.length} đề nghị mua hàng.</span>
          </div>
        </CardContent>
      </Card>

      <HopXacNhan
        mo={hoiXoa}
        tieuDe={`Xóa hẳn ${chon.length} đề nghị?`}
        moTa={chon.map((d) => d.code).join(", ")}
        canhBao="Cả phòng đang dùng chung kho dữ liệu này — xóa xong thì MỌI NGƯỜI đều mất các đề nghị trên. Không khôi phục lại được."
        nhanDongY="Xóa hẳn"
        nguyHiem
        onDong={() => doiHoiXoa(false)}
        onDongY={thucHienXoa}
      />
    </>
  );
}
