"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, UserPlus, X } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  NHAN_PHONG_BAN,
  THU_TU_PHONG_BAN,
  nhanSuDangLamViec,
  timNhanSu,
  type MaPhongBan,
  type NhanSu,
} from "@/3-du-lieu/danh-ba-nhan-su";
import type { DeNghiMuaHang, NguoiTheoDoi } from "@/3-du-lieu/kieu-du-lieu";
import { formatDate } from "@/6-tien-ich/dinh-dang";

/**
 * NGƯỜI THEO DÕI một đề nghị — tương đương "người theo dõi" của nhiệm vụ trên Base.vn.
 *
 * Người được chọn từ **danh bạ nhân sự công ty** (`3-du-lieu/danh-ba-nhan-su.ts`),
 * nhóm theo phòng ban, có ô tìm kiếm gõ không dấu vẫn ra.
 * Người đã nghỉ việc (`status: "inactive"`) không xuất hiện trong danh sách chọn.
 *
 * 🔴 Có tên ở đây KHÔNG mở khóa việc xem giá. Đơn giá nằm ở chứng từ riêng
 * `tm_donhang_gia` và chặn bằng Security Rule của chứng từ đó (nguyên tắc dữ liệu số 3).
 */
export function KhoiNguoiTheoDoi({ deNghi }: { deNghi: DeNghiMuaHang }) {
  const { themNguoiTheoDoi, boNguoiTheoDoi } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  const [moHopChon, setMoHopChon] = useState(false);

  const dsTheoDoi = useMemo(() => deNghi.nguoiTheoDoi ?? [], [deNghi.nguoiTheoDoi]);

  /** Chỉ Thu mua được sửa danh sách. Vai trò khác vẫn xem được, chỉ không thêm/bỏ. */
  const duocSua = quyen.phanBoCongViec || quyen.lapPO;
  const toiDangTheoDoi = dsTheoDoi.some((n) => n.uid === nguoiDung.uid);

  function them(nguoi: NhanSu) {
    themNguoiTheoDoi(
      deNghi.id,
      { uid: nguoi.uid, ten: nguoi.displayName, chucDanh: nguoi.title },
      nguoiDung.tenHienThi,
    );
    toast.success(`Đã thêm ${nguoi.displayName} vào danh sách theo dõi`);
  }

  function bo(uid: string, ten: string) {
    boNguoiTheoDoi(deNghi.id, uid);
    toast.info(`Đã bỏ ${ten} khỏi danh sách theo dõi`);
  }

  return (
    <section className="flex flex-col gap-(--hp-md-row-gap)">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-h3 text-text-primary">Người theo dõi ({dsTheoDoi.length})</h2>
        <div className="flex flex-wrap items-center gap-2">
          {toiDangTheoDoi && <StatusBadge label="Bạn đang theo dõi đề nghị này" tone="primary" />}
          {/* Đã có người thì nhãn phải là "Sửa" — vì việc bỏ theo dõi cũng nằm trong
              hộp này. Để nguyên chữ "Thêm" thì người muốn bỏ ai đó sẽ không nghĩ tới
              việc bấm vào đây. */}
          {duocSua && (
            <Button size="sm" variant="outline" onClick={() => setMoHopChon(true)}>
              <UserPlus className="size-4" aria-hidden />
              {dsTheoDoi.length > 0 ? "Sửa người theo dõi" : "Thêm người theo dõi"}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          {dsTheoDoi.length === 0 ? (
            <p className="text-sm text-text-desc">
              Chưa có ai theo dõi đề nghị này.
              {duocSua ? " Bấm “Thêm người theo dõi” để chọn từ danh bạ nhân sự công ty." : ""}
            </p>
          ) : (
            /* Một DÒNG LIÊN TỤC ngăn cách bằng dấu phẩy (chỉ đạo Ban lãnh đạo 08/08/2026)
               — mỗi người một dòng như trước chiếm quá nhiều chỗ trên trang.
               Chức danh · ai thêm · ngày thêm dồn vào `title`, rê chuột là thấy đủ,
               nên gọn đi mà KHÔNG mất thông tin nào.

               📌 CỐ Ý KHÔNG để nút ✕ xen giữa các tên: nút chen vào làm dấu phẩy
               bị đẩy xa khỏi tên, dòng chữ đứt quãng, đọc rất rối. Việc bỏ theo dõi
               chuyển vào hộp "Thêm người theo dõi" — nơi đã có sẵn danh bạ nhân sự. */
            <p className="flex flex-wrap items-baseline gap-x-1.5 text-sm leading-relaxed">
              <Eye className="size-4 shrink-0 translate-y-0.5 text-text-desc" aria-hidden />
              <span className="text-text-primary">
                {dsTheoDoi.map((n, i) => (
                  <span key={n.uid}>
                    <span
                      className="font-medium"
                      title={`${n.chucDanh} · ${n.nguoiThemTen} thêm ngày ${formatDate(n.thoiDiemThem)}`}
                    >
                      {n.ten}
                    </span>
                    {i < dsTheoDoi.length - 1 && <span className="text-text-desc">, </span>}
                  </span>
                ))}
              </span>
            </p>
          )}

          {duocSua && (
            <p className="text-xs text-text-desc">
              Người theo dõi nắm được tiến trình đề nghị nhưng <strong>không thấy đơn giá</strong> nếu
              vai trò của họ vốn không được xem giá — giá nằm ở chứng từ riêng, không mở theo danh sách này.
            </p>
          )}
        </CardContent>
      </Card>

      {duocSua && (
        <HopChonNhanSu
          mo={moHopChon}
          doiMo={setMoHopChon}
          dangTheoDoi={dsTheoDoi}
          khiChon={them}
          khiBo={bo}
        />
      )}
    </section>
  );
}

// ------------------------------------------------------------
// HỘP CHỌN NHÂN SỰ — tìm kiếm + nhóm theo phòng ban
// ------------------------------------------------------------

function HopChonNhanSu({
  mo,
  doiMo,
  dangTheoDoi,
  khiChon,
  khiBo,
}: {
  mo: boolean;
  doiMo: (v: boolean) => void;
  dangTheoDoi: NguoiTheoDoi[];
  khiChon: (n: NhanSu) => void;
  khiBo: (uid: string, ten: string) => void;
}) {
  const uidDaChon = dangTheoDoi.map((n) => n.uid);
  const [tuKhoa, setTuKhoa] = useState("");

  /** Người đã theo dõi rồi thì không hiện lại — tránh thêm trùng. */
  const ketQua = useMemo(() => {
    const conLai = nhanSuDangLamViec().filter((n) => !uidDaChon.includes(n.uid));
    return timNhanSu(conLai, tuKhoa);
  }, [tuKhoa, uidDaChon]);

  const theoPhongBan = useMemo(() => {
    const nhom = new Map<MaPhongBan, NhanSu[]>();
    for (const n of ketQua) {
      const ds = nhom.get(n.department) ?? [];
      ds.push(n);
      nhom.set(n.department, ds);
    }
    return THU_TU_PHONG_BAN.filter((pb) => nhom.has(pb)).map((pb) => ({
      maPhongBan: pb,
      nhanSu: nhom.get(pb)!,
    }));
  }, [ketQua]);

  return (
    <Dialog
      open={mo}
      onOpenChange={(v: boolean) => {
        doiMo(v);
        if (!v) setTuKhoa("");
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chọn người theo dõi</DialogTitle>
          <DialogDescription>
            Chọn thêm từ danh bạ nhân sự công ty, hoặc bấm ✕ để bỏ người đang theo dõi.
            Gõ tên, mã nhân viên hoặc phòng ban — không dấu vẫn tìm được.
          </DialogDescription>
        </DialogHeader>

        {/* ĐANG THEO DÕI — chỗ duy nhất bỏ người khỏi danh sách.
            Để ở đây thay vì xen nút ✕ vào dòng tên ngoài trang: dòng ngoài giữ được
            nếp đọc liên tục "A, B, C", còn thao tác sửa gom về một chỗ. */}
        {dangTheoDoi.length > 0 && (
          <div className="flex flex-col gap-1 rounded-lg border border-border p-2">
            <span className="text-xs font-semibold text-text-desc">
              Đang theo dõi ({dangTheoDoi.length})
            </span>
            <ul className="flex flex-wrap gap-1.5">
              {dangTheoDoi.map((n) => (
                <li
                  key={n.uid}
                  className="inline-flex items-center gap-1 rounded-full bg-muted py-0.5 pr-0.5 pl-2.5 text-sm"
                >
                  <span className="text-text-primary" title={n.chucDanh}>
                    {n.ten}
                  </span>
                  <button
                    type="button"
                    onClick={() => khiBo(n.uid, n.ten)}
                    className="flex size-6 items-center justify-center rounded-full text-text-desc transition-colors hover:bg-danger-bg hover:text-danger"
                    aria-label={`Bỏ ${n.ten} khỏi danh sách theo dõi`}
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Input
          autoFocus
          placeholder="Tìm: tên · mã nhân viên · chức danh · phòng ban"
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
          aria-label="Tìm nhân sự"
        />

        <div className="flex max-h-[50vh] flex-col gap-(--hp-md-card-gap) overflow-y-auto">
          {theoPhongBan.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-desc">
              Không tìm thấy ai khớp “{tuKhoa}”.
            </p>
          ) : (
            theoPhongBan.map(({ maPhongBan, nhanSu }) => (
              <div key={maPhongBan} className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text-desc">
                  {NHAN_PHONG_BAN[maPhongBan]} ({nhanSu.length})
                </span>
                {nhanSu.map((n) => (
                  <button
                    key={n.uid}
                    type="button"
                    onClick={() => khiChon(n)}
                    className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-0.5 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border hover:bg-surface"
                  >
                    <span className="text-sm font-medium text-text-primary">{n.displayName}</span>
                    <span className="text-xs text-text-desc">{n.title}</span>
                    <span className="ml-auto text-xs text-text-disabled">{n.employeeCode}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        <p className="text-xs text-text-desc">
          Danh bạ đang là <strong>dữ liệu mẫu</strong>. Khi nối Firebase sẽ đọc thẳng danh sách
          nhân sự thật từ App Tổng HPcore; người đã nghỉ việc tự động không hiện ở đây.
        </p>
      </DialogContent>
    </Dialog>
  );
}
