"use client";

import { useEffect, useState } from "react";
import { Check, ClipboardList, Plus, Trash2 } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Checkbox } from "@/1-giao-dien/nen-tang-ui/checkbox";
import { docGhiChu, ghiGhiChu, type GhiChuCongViec } from "@/3-du-lieu/ghi-chu-ca-nhan";
import { formatMocThoiGian, thoiDiemHienTai } from "@/6-tien-ich/dinh-dang";

/**
 * KHỐI GHI CHÚ CÔNG VIỆC CẦN GIẢI QUYẾT — sổ tay cá nhân trên màn "Công việc của tôi".
 *
 * 🔴 Chỉ đạo Ban lãnh đạo 10/08/2026: *"Thêm mục ghi chú công việc, các công việc cần giải
 * quyết"*.
 *
 * Nhiều việc thu mua không sinh ra chứng từ nào để app tự biết — "gọi lại NCC hỏi giá thép",
 * "hẹn thủ kho nghiệm thu sáng thứ 5". Ghi vào đây thì nó nằm ngay cạnh danh sách hồ sơ.
 *
 * ⚠️ Đây là SỔ TAY CÁ NHÂN, không phải giao việc — xem `3-du-lieu/ghi-chu-ca-nhan.ts`.
 */
export function KhoiGhiChuCongViec({ uid }: { uid: string }) {
  const [ds, setDs] = useState<GhiChuCongViec[]>([]);
  const [dangGo, setDangGo] = useState("");

  // Đọc trong useEffect, KHÔNG đọc lúc khởi tạo state: trang được dựng sẵn lúc build (hosting
  // tĩnh) nên lần render đầu không có localStorage — đọc sớm là lỗi hydrate.
  useEffect(() => {
    setDs(docGhiChu(uid));
  }, [uid]);

  function luu(moi: GhiChuCongViec[]) {
    setDs(moi);
    ghiGhiChu(uid, moi);
  }

  function them() {
    const noiDung = dangGo.trim();
    if (noiDung === "") return;
    luu([
      // Việc mới lên ĐẦU: người dùng vừa nghĩ ra là thấy ngay, không phải cuộn xuống cuối.
      {
        id: `gc-${uid}-${ds.length}-${noiDung.length}-${ds.filter((x) => !x.xong).length}`,
        noiDung,
        xong: false,
        thoiDiem: thoiDiemHienTai(),
      },
      ...ds,
    ]);
    setDangGo("");
  }

  const chuaXong = ds.filter((x) => !x.xong).length;

  return (
    <section className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-(--hp-md-card-pad)">
      <div className="flex flex-wrap items-center gap-2">
        <ClipboardList className="size-4 shrink-0 text-text-desc" aria-hidden />
        <h2 className="text-sm font-semibold text-text-primary">Công việc cần giải quyết</h2>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-text-secondary tabular-nums">
          {chuaXong} chưa xong
        </span>
        <span className="ml-auto text-[11px] text-text-desc">
          Sổ tay riêng của bạn — người khác không thấy
        </span>
      </div>

      {/* Ô thêm việc. Enter là thêm luôn, không phải rời tay khỏi bàn phím để bấm nút. */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={dangGo}
          onChange={(e) => setDangGo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              them();
            }
          }}
          placeholder="Gọi lại NCC B hỏi giá thép D14, hẹn thủ kho nghiệm thu sáng thứ 5..."
          aria-label="Thêm công việc cần giải quyết"
          className="min-w-0 flex-1"
        />
        <Button size="sm" onClick={them} disabled={dangGo.trim() === ""}>
          <Plus className="size-4" aria-hidden />
          Thêm
        </Button>
      </div>

      {ds.length === 0 ? (
        <p className="text-xs text-text-desc">
          Chưa có việc nào. Ghi những việc không sinh ra hồ sơ — gọi nhà cung cấp, xin duyệt tạm
          ứng, hẹn nghiệm thu.
        </p>
      ) : (
        <ul className="flex flex-col">
          {ds.map((g) => (
            <li
              key={g.id}
              className="flex items-start gap-2.5 border-b border-divider py-2 last:border-b-0"
            >
              <Checkbox
                checked={g.xong}
                onCheckedChange={(c) =>
                  luu(ds.map((x) => (x.id === g.id ? { ...x, xong: Boolean(c) } : x)))
                }
                aria-label={g.xong ? `Bỏ đánh dấu xong: ${g.noiDung}` : `Đánh dấu xong: ${g.noiDung}`}
                className="mt-0.5"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                {/* Việc đã xong gạch ngang VÀ đổi màu chữ — không chỉ dựa vào một dấu hiệu. */}
                <span
                  className={`text-sm break-words ${
                    g.xong ? "text-text-desc line-through" : "text-text-primary"
                  }`}
                >
                  {g.noiDung}
                </span>
                <span className="font-mono text-[11px] text-text-desc tabular-nums">
                  {formatMocThoiGian(g.thoiDiem)}
                  {g.xong ? " · đã xong" : ""}
                </span>
              </span>
              {/* Xóa hẳn — việc xong vẫn giữ lại cho người dùng tự quyết, không tự biến mất. */}
              <button
                type="button"
                onClick={() => luu(ds.filter((x) => x.id !== g.id))}
                aria-label={`Xóa việc: ${g.noiDung}`}
                className="flex size-11 shrink-0 items-center justify-center rounded-lg text-text-desc transition-colors hover:bg-muted hover:text-danger"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {ds.some((x) => x.xong) && (
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => luu(ds.filter((x) => !x.xong))}
        >
          <Check className="size-4" aria-hidden />
          Dọn các việc đã xong ({ds.filter((x) => x.xong).length})
        </Button>
      )}
    </section>
  );
}
