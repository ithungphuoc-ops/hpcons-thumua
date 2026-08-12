"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, UserPlus, X } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/1-giao-dien/nen-tang-ui/table";
import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { tinhTienDoDeNghi } from "@/2-quy-trinh/tinh-toan";
import { NHAN_TRANG_THAI_DONG } from "@/2-quy-trinh/trang-thai";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";
import { nhanVienThuMuaCoTaiKhoan } from "@/4-phan-quyen/quyen";

/**
 * Nhân viên thu mua nhận phân bổ — LẤY TỪ DANH BẠ, không chép cứng ở đây.
 *
 * 🔴 Trước 11/08/2026 chỗ này viết cứng 3 người, lệch với danh bạ (có 4) và lệch với danh
 * sách tài khoản đăng nhập (chỉ có 1). Hậu quả: phân bổ cho người **không đăng nhập được**
 * → việc treo, không ai nhận. Nay một nguồn duy nhất: `nhanVienThuMua()`.
 *
 * Bản thật sẽ đọc `users/{uid}` có `apps.tm >= 2` — vẫn chỉ thay ruột hàm đó.
 *
 * `ngan` là nhãn ngắn cho nút (TM1, TM2…), cắt từ chức danh "Nhân viên Thu mua (TM2)".
 */
const NHAN_VIEN_THU_MUA = nhanVienThuMuaCoTaiKhoan().map((n) => ({
  uid: n.uid,
  ten: n.tenHienThi,
  ngan: n.chucDanh.match(/\(([^)]+)\)/)?.[1] ?? n.tenDangNhap.toUpperCase(),
}));

/**
 * M3 — BẢNG PHÂN BỔ của Trưởng bộ phận thu mua.
 * Màn hình MỚI, bản thumua-next cũ không có.
 *
 * Giá trị: thấy ngay dòng nào CHƯA PHÂN BỔ và dòng nào ĐÃ PHÂN MÀ CHƯA LÊN PO —
 * đây là chỗ hay bỏ sót nhất trong mua hàng thực tế.
 */
export function BangPhanBo({ deNghi }: { deNghi: DeNghiMuaHang }) {
  const { donHang, phieuNhan, phanBoDong, boPhanBoDong } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  const [chon, setChon] = useState<number[]>([]);

  const tienDo = useMemo(
    () => tinhTienDoDeNghi(deNghi, donHang, phieuNhan),
    [deNghi, donHang, phieuNhan],
  );

  const soChuaPhanBo = tienDo.filter((d) => d.trangThaiDong === "chua_phan_bo").length;
  const soDaPhanChuaLenPO = tienDo.filter((d) => d.trangThaiDong === "da_phan_bo").length;

  function doiChon(stt: number, checked: boolean) {
    setChon((truoc) => (checked ? [...truoc, stt] : truoc.filter((x) => x !== stt)));
  }

  function phanBo(uid: string) {
    if (chon.length === 0) return;
    phanBoDong(deNghi.id, chon, uid, nguoiDung.tenHienThi);
    setChon([]);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
        {/* Tóm tắt cảnh báo */}
        <div className="flex flex-wrap items-center gap-3">
          {soChuaPhanBo > 0 ? (
            <span className="flex items-center gap-2 rounded-lg bg-danger-bg px-3 py-1.5 text-sm font-medium text-danger-soft">
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              {soChuaPhanBo} dòng chưa phân bổ
            </span>
          ) : (
            <span className="rounded-lg bg-success-bg px-3 py-1.5 text-sm font-medium text-success-soft">
              Đã phân bổ đủ {tienDo.length} dòng
            </span>
          )}
          {soDaPhanChuaLenPO > 0 && (
            <span className="rounded-lg bg-warning-bg px-3 py-1.5 text-sm font-medium text-warning-soft">
              {soDaPhanChuaLenPO} dòng đã phân nhưng chưa lên đơn hàng
            </span>
          )}
        </div>

        {/* Thanh hành động khi đã chọn dòng */}
        {quyen.phanBoCongViec && chon.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary-bg p-3">
            <span className="text-sm font-medium text-primary">Đã chọn {chon.length} dòng — phân cho:</span>
            {NHAN_VIEN_THU_MUA.map((nv) => (
              <Button key={nv.uid} size="sm" onClick={() => phanBo(nv.uid)}>
                <UserPlus className="size-4" aria-hidden />
                {nv.ngan} · {nv.ten}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setChon([])}>
              Bỏ chọn
            </Button>
          </div>
        )}

        {/* Bảng — Desktop/Tablet */}
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                {quyen.phanBoCongViec && <TableHead className="w-10" />}
                <TableHead className="w-12 text-right">Dòng</TableHead>
                <TableHead>Vật liệu</TableHead>
                <TableHead>ĐVT</TableHead>
                <TableHead className="text-right">KL đề nghị</TableHead>
                <TableHead>Người phụ trách</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Đơn hàng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tienDo.map((d) => {
                const tt = NHAN_TRANG_THAI_DONG[d.trangThaiDong];
                const daPhan = Boolean(d.nguoiPhuTrachUid);
                return (
                  <TableRow key={d.stt} className={d.trangThaiDong === "chua_phan_bo" ? "bg-danger-bg/40" : undefined}>
                    {quyen.phanBoCongViec && (
                      <TableCell>
                        <Checkbox
                          checked={chon.includes(d.stt)}
                          onCheckedChange={(c) => doiChon(d.stt, Boolean(c))}
                          aria-label={`Chọn dòng ${d.stt}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-right text-text-desc">{d.stt}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{d.tenVatLieu}</span>
                        {d.quyCach && <span className="text-xs text-text-desc">{d.quyCach}</span>}
                        {/* Mục đích sử dụng do người đề nghị ghi trên phiếu — hiện ngay
                            dưới tên vật liệu để người lập đơn biết mua cho hạng mục nào,
                            khỏi phải mở lại phiếu gốc. */}
                        {d.mucDichSuDung && (
                          <span className="text-xs text-text-desc">
                            Dùng cho: {d.mucDichSuDung}
                          </span>
                        )}
                        {d.vatTuKiemSoatDinhMuc && (
                          <span className="mt-0.5 w-fit rounded bg-warning-bg px-1.5 py-0.5 text-[10px] font-semibold text-warning-soft">
                            Vật tư kiểm soát định mức
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{d.donViTinh}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {d.khoiLuongDeNghi.toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      {daPhan ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{d.nguoiPhuTrachTen}</span>
                          {quyen.phanBoCongViec && d.trangThaiDong === "da_phan_bo" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Bỏ phân bổ dòng ${d.stt}`}
                              onClick={() => boPhanBoDong(deNghi.id, d.stt, nguoiDung.tenHienThi)}
                            >
                              <X className="size-4" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-text-desc italic">chưa phân</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={tt.nhan} tone={tt.tong} />
                    </TableCell>
                    <TableCell className="text-xs text-text-desc">
                      {d.maPOLienQuan.length > 0 ? d.maPOLienQuan.join(", ") : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Card List — Mobile (<768px): không ép bảng nhiều cột, luật V1.1 Phần F */}
        <div className="flex flex-col gap-(--hp-md-row-gap) md:hidden">
          {tienDo.map((d) => {
            const tt = NHAN_TRANG_THAI_DONG[d.trangThaiDong];
            return (
              <div key={d.stt} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold text-text-primary">
                      {d.stt}. {d.tenVatLieu}
                    </span>
                    {d.quyCach && <span className="text-xs text-text-desc">{d.quyCach}</span>}
                    {d.mucDichSuDung && (
                      <span className="text-xs text-text-desc">Dùng cho: {d.mucDichSuDung}</span>
                    )}
                  </div>
                  <StatusBadge label={tt.nhan} tone={tt.tong} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-desc">Đề nghị</span>
                  <span className="font-semibold">
                    {d.khoiLuongDeNghi.toLocaleString("vi-VN")} {d.donViTinh}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-desc">Người phụ trách</span>
                  <span>{d.nguoiPhuTrachTen ?? "chưa phân"}</span>
                </div>
                {quyen.phanBoCongViec && !d.nguoiPhuTrachUid && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {NHAN_VIEN_THU_MUA.map((nv) => (
                      <Button
                        key={nv.uid}
                        size="sm"
                        variant="outline"
                        className="min-h-11"
                        onClick={() => phanBoDong(deNghi.id, [d.stt], nv.uid, nguoiDung.tenHienThi)}
                      >
                        {nv.ngan}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
