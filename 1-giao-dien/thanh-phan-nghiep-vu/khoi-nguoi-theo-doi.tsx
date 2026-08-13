"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Eye, UserPlus, X } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { nhanPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/1-giao-dien/nen-tang-ui/dialog";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { THU_TU_PHONG_BAN, timNhanSu, type NhanSu } from "@/3-du-lieu/danh-ba-nhan-su";
import type { MaPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";
import { useDanhBa } from "@/4-phan-quyen/dung-danh-ba";
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

  /**
   * Áp dụng danh sách nháp từ hộp thoại — chỉ chạy khi người dùng bấm "Lưu thay đổi".
   *
   * 🔴 Chỉ đạo Ban lãnh đạo 10/08/2026: thêm người phải gom thành danh sách để soát
   * lại rồi mới đồng ý. Trước đây bấm vào tên là thêm ngay, rất dễ thêm nhầm mà
   * không kịp nhìn — nhất là khi danh bạ có nhiều người tên gần giống nhau.
   */
  function luuThayDoi(nhap: { uid: string; ten: string; chucDanh: string }[]) {
    const uidCu = dsTheoDoi.map((n) => n.uid);
    const uidMoi = nhap.map((n) => n.uid);

    const themVao = nhap.filter((n) => !uidCu.includes(n.uid));
    const boRa = dsTheoDoi.filter((n) => !uidMoi.includes(n.uid));

    themVao.forEach((n) => themNguoiTheoDoi(deNghi.id, n, nguoiDung.tenHienThi));
    boRa.forEach((n) => boNguoiTheoDoi(deNghi.id, n.uid));

    // Một dòng thông báo tổng, không bắn từng người một cho khỏi ngập màn hình.
    const phan: string[] = [];
    if (themVao.length > 0) phan.push(`thêm ${themVao.map((n) => n.ten).join(", ")}`);
    if (boRa.length > 0) phan.push(`bỏ ${boRa.map((n) => n.ten).join(", ")}`);
    if (phan.length > 0) {
      toast.success("Đã cập nhật người theo dõi", { description: `Đã ${phan.join(" · ")}.` });
    }
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
          khiLuu={luuThayDoi}
        />
      )}
    </section>
  );
}

// ------------------------------------------------------------
// HỘP CHỌN NHÂN SỰ — tìm kiếm + nhóm theo phòng ban
// ------------------------------------------------------------

/** Một dòng trong danh sách nháp — chỉ giữ đúng thứ cần để hiển thị và ghi lại. */
interface MucNhap {
  uid: string;
  ten: string;
  chucDanh: string;
}

function HopChonNhanSu({
  mo,
  doiMo,
  dangTheoDoi,
  khiLuu,
}: {
  mo: boolean;
  doiMo: (v: boolean) => void;
  dangTheoDoi: NguoiTheoDoi[];
  khiLuu: (nhap: MucNhap[]) => void;
}) {
  const [tuKhoa, setTuKhoa] = useState("");

  /**
   * DANH SÁCH NHÁP — mọi thao tác thêm/bỏ trong hộp chỉ sửa ở đây, dữ liệu thật
   * chưa đụng tới. Bấm "Lưu thay đổi" mới ghi (chỉ đạo Ban lãnh đạo 10/08/2026).
   */
  const [nhap, setNhap] = useState<MucNhap[]>([]);
  /** 🔴 Danh bạ đọc từ TÀI KHOẢN THẬT — xem `4-phan-quyen/dung-danh-ba.ts`. */
  const danhBa = useDanhBa();

  /**
   * Nạp lại nháp MỖI LẦN MỞ hộp, không phải mỗi lần `dangTheoDoi` đổi.
   * Nếu phụ thuộc `dangTheoDoi` thì sau khi lưu xong, dữ liệu thật đổi sẽ nạp đè
   * lên nháp ngay giữa lúc hộp đang đóng — thừa và dễ nhấp nháy.
   */
  useEffect(() => {
    if (mo) {
      setNhap(dangTheoDoi.map((n) => ({ uid: n.uid, ten: n.ten, chucDanh: n.chucDanh })));
      setTuKhoa("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mo]);

  const uidNhap = nhap.map((n) => n.uid);

  /** Người đã có trong nháp thì không hiện lại ở danh bạ — tránh thêm trùng. */
  const ketQua = useMemo(() => {
    const conLai = danhBa.filter((n) => !uidNhap.includes(n.uid));
    return timNhanSu(conLai, tuKhoa);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuKhoa, uidNhap.join(","), danhBa]);

  // So với danh sách thật để hiện rõ "sẽ thêm ai / sẽ bỏ ai" trước khi lưu.
  const uidCu = dangTheoDoi.map((n) => n.uid);
  const seThem = nhap.filter((n) => !uidCu.includes(n.uid));
  const seBo = dangTheoDoi.filter((n) => !uidNhap.includes(n.uid));
  const coThayDoi = seThem.length > 0 || seBo.length > 0;

  const theoPhongBan = useMemo(() => {
    const nhom = new Map<MaPhongBan, NhanSu[]>();
    for (const n of ketQua) {
      const ds = nhom.get(n.department) ?? [];
      ds.push(n);
      nhom.set(n.department, ds);
    }
    /**
     * 🔴 XẾP THEO ƯU TIÊN, KHÔNG LỌC. Bản trước viết
     * `THU_TU_PHONG_BAN.filter((pb) => nhom.has(pb))` — nghĩa là phòng ban nào không nằm
     * trong bảng thứ tự thì **cả phòng đó biến mất** khỏi hộp chọn. Công ty có 16 phòng
     * ban mà bảng thứ tự chỉ liệt kê vài phòng hay dùng, nên đó là cách chắc chắn làm
     * mất người: người dùng tìm không thấy đồng nghiệp và tưởng họ chưa có tài khoản.
     */
    const uuTien = (ma: MaPhongBan) => {
      const i = THU_TU_PHONG_BAN.indexOf(ma);
      return i < 0 ? THU_TU_PHONG_BAN.length : i;
    };
    return [...nhom.keys()]
      .sort((a, b) => uuTien(a) - uuTien(b) || nhanPhongBan(a).localeCompare(nhanPhongBan(b), "vi"))
      .map((pb) => ({ maPhongBan: pb, nhanSu: nhom.get(pb)! }));
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
            Bấm tên trong danh bạ để đưa vào danh sách, soát lại rồi bấm{" "}
            <strong>Lưu thay đổi</strong>. Chưa lưu thì chưa có gì thay đổi.
          </DialogDescription>
        </DialogHeader>

        {/* DANH SÁCH SẼ LƯU — gom mọi thao tác vào đây để soát trước khi đồng ý. */}
        <div className="flex flex-col gap-1.5 rounded-lg border border-border p-2.5">
          <span className="text-xs font-semibold text-text-desc">
            Danh sách theo dõi sau khi lưu ({nhap.length})
          </span>
          {nhap.length === 0 ? (
            <p className="py-1 text-sm text-text-desc">
              Chưa có ai. Chọn người từ danh bạ bên dưới.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {nhap.map((n) => {
                const laMoi = !uidCu.includes(n.uid);
                return (
                  <li
                    key={n.uid}
                    /* Người mới thêm viền xanh + chữ "mới" — nhìn ra ngay mình vừa
                       thêm ai trong lần này, không lẫn với người đã theo dõi từ trước. */
                    className={`inline-flex items-center gap-1 rounded-full py-0.5 pr-0.5 pl-2.5 text-sm ${
                      laMoi ? "border border-primary bg-primary-bg" : "bg-muted"
                    }`}
                  >
                    <span className="text-text-primary" title={n.chucDanh}>
                      {n.ten}
                    </span>
                    {laMoi && <span className="text-[10px] font-semibold text-primary">mới</span>}
                    <button
                      type="button"
                      onClick={() => setNhap((t) => t.filter((x) => x.uid !== n.uid))}
                      className="flex size-6 items-center justify-center rounded-full text-text-desc transition-colors hover:bg-danger-bg hover:text-danger"
                      aria-label={`Bỏ ${n.ten} khỏi danh sách`}
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Nhắc rõ người sắp bị bỏ — họ không còn nằm trong danh sách trên nên
              nếu không nói ra thì người dùng dễ bỏ nhầm mà không biết. */}
          {seBo.length > 0 && (
            <p className="text-xs text-danger-soft">
              Sẽ bỏ theo dõi: {seBo.map((n) => n.ten).join(", ")}
            </p>
          )}
        </div>

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
                  {nhanPhongBan(maPhongBan)} ({nhanSu.length})
                </span>
                {nhanSu.map((n) => (
                  <button
                    key={n.uid}
                    type="button"
                    onClick={() =>
                      setNhap((t) => [
                        ...t,
                        { uid: n.uid, ten: n.displayName, chucDanh: n.title },
                      ])
                    }
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

        <DialogFooter>
          <Button variant="outline" onClick={() => doiMo(false)}>
            Hủy
          </Button>
          <Button
            disabled={!coThayDoi}
            onClick={() => {
              khiLuu(nhap);
              doiMo(false);
            }}
          >
            <Check className="size-4" aria-hidden />
            {coThayDoi
              ? `Lưu thay đổi (${seThem.length > 0 ? `+${seThem.length}` : ""}${
                  seThem.length > 0 && seBo.length > 0 ? " " : ""
                }${seBo.length > 0 ? `−${seBo.length}` : ""})`
              : "Chưa có thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
