"use client";

import { Plus, Trash2 } from "lucide-react";
import { KhoiGap } from "@/1-giao-dien/thanh-phan-dung-chung/khoi-gap";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import type { CauHinhQuyTrinh } from "@/2-quy-trinh/cau-hinh-quy-trinh";
import type { NhomVatTuDinhMuc } from "@/2-quy-trinh/kiem-soat-dinh-muc";

/**
 * DANH MỤC VẬT TƯ KIỂM SOÁT ĐỊNH MỨC — sửa được ngay trên trang Cài đặt quy trình.
 *
 * 🔴 Ban lãnh đạo 15/08/2026: *"danh sách này sẽ được thêm mới hoặc xóa bớt nên cấu hình
 * sao để có thể sửa"*. Vật tư kiểm soát thay đổi theo thời kỳ và theo loại công trình; sửa
 * mà phải nhờ đội triển khai thì cuối cùng không ai sửa, danh sách thành lạc hậu rồi cảnh
 * báo sai — tệ hơn là không có cảnh báo, vì người dùng tin là app đã kiểm hộ.
 */
export function KhoiVatTuDinhMuc({
  nhap,
  setNhap,
}: {
  nhap: CauHinhQuyTrinh;
  setNhap: (c: CauHinhQuyTrinh) => void;
}) {
  const nhomDs: NhomVatTuDinhMuc[] = nhap.vatTuDinhMuc ?? [];

  function doiNhom(ds: NhomVatTuDinhMuc[]) {
    setNhap({ ...nhap, vatTuDinhMuc: ds });
  }

  /** Sửa một nhóm, giữ nguyên các nhóm khác. */
  function suaNhom(ma: string, phan: Partial<NhomVatTuDinhMuc>) {
    doiNhom(nhomDs.map((n) => (n.ma === ma ? { ...n, ...phan } : n)));
  }

  const tongVatTu = nhomDs.reduce((s, n) => s + n.vatTu.length, 0);

  return (
    <div className="flex flex-col gap-2">
      {nhomDs.map((n) => (
        <KhoiGap key={n.ma} tieuDe={n.ten} soLuong={n.vatTu.length}>
          <div className="flex flex-col gap-2">
            {/* Tên nhóm sửa được, mã giữ nguyên — mã là khóa, đổi mã là mất dấu. */}
            <Input
              value={n.ten}
              aria-label={`Tên nhóm ${n.ten}`}
              placeholder="Tên nhóm, vd Vật tư kết cấu"
              onChange={(e) => suaNhom(n.ma, { ten: e.target.value })}
            />

            <ul className="flex flex-col gap-1.5">
              {n.vatTu.map((v, idx) => (
                <li key={`${n.ma}-${idx}`} className="flex items-center gap-2">
                  <Input
                    value={v}
                    aria-label={`Vật tư ${idx + 1} của nhóm ${n.ten}`}
                    placeholder="Tên vật tư, vd Xi măng"
                    onChange={(e) =>
                      suaNhom(n.ma, {
                        vatTu: n.vatTu.map((x, j) => (j === idx ? e.target.value : x)),
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Xóa ${v || `vật tư ${idx + 1}`}`}
                    onClick={() =>
                      suaNhom(n.ma, { vatTu: n.vatTu.filter((_, j) => j !== idx) })
                    }
                  >
                    <Trash2 className="size-4 text-danger-soft" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => suaNhom(n.ma, { vatTu: [...n.vatTu, ""] })}
              >
                <Plus className="size-4" aria-hidden />
                Thêm vật tư
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => doiNhom(nhomDs.filter((x) => x.ma !== n.ma))}
              >
                <Trash2 className="size-4 text-danger-soft" aria-hidden />
                Xóa cả nhóm
              </Button>
            </div>
          </div>
        </KhoiGap>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            doiNhom([
              ...nhomDs,
              {
                // Mã sinh theo số nhóm hiện có — ổn định, không dùng thời gian/ngẫu nhiên.
                ma: `nhom_${nhomDs.length + 1}`,
                ten: "",
                vatTu: [],
              },
            ])
          }
        >
          <Plus className="size-4" aria-hidden />
          Thêm nhóm
        </Button>
        <span className="text-xs text-text-desc tabular-nums">
          {nhomDs.length} nhóm · {tongVatTu} vật tư
        </span>
      </div>

      {/* 🔴 Nói rõ cách app so khớp. Người sửa danh mục cần biết "Xi măng" bắt luôn cả
          "Xi măng PCB40" — nếu không họ sẽ khai thừa hàng chục dòng biến thể. */}
      <p className="text-xs text-text-desc">
        App khớp <strong>mềm</strong>: gõ “Xi măng” là bắt được cả “Xi măng PCB40”, “Xi măng
        trắng”. Vì vậy nên khai <strong>tên chung</strong>, đừng khai từng biến thể. Đổi lại,
        tên quá ngắn dễ bắt nhầm — “Lưới” sẽ khớp cả “Lưới chắn côn trùng”; khi đó người lập
        phiếu bỏ tích được, app không tự bật lại.
      </p>
    </div>
  );
}
