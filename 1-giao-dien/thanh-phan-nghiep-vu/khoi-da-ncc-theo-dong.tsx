"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Send, ShoppingCart, X } from "lucide-react";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";
import { Badge } from "@/1-giao-dien/nen-tang-ui/badge";
import type { BaoGia, TienDoDongDeNghi } from "@/3-du-lieu/kieu-du-lieu";
import type { Quyen } from "@/4-phan-quyen/quyen";

/**
 * ★★ ĐA NHÀ CUNG CẤP THEO TỪNG DÒNG — Ban lãnh đạo 08/09/2026, ví dụ thật: *"đề nghị có 5 dòng
 * vật tư a-f, mỗi dòng 1 NCC khác nhau, mỗi NCC 2 báo giá — duyệt từng báo giá riêng, duyệt xong
 * tự nhân bản lên mục Lập PO để lập PO cho báo giá đó, không cần chờ NCC khác"*.
 *
 * 🔴 SONG SONG, KHÔNG THAY THẾ khối "Bảng báo giá"/"Xét duyệt phương án giá" đã có (dùng
 * `chonNCCChoBaoGia`/`KhuBaoGiaTheoSoLuong` — đúng cho ca đề nghị chỉ có 1 NCC quyết định chung
 * cho cả đơn). Khối này CHỈ dùng khi đề nghị thật sự có nhiều dòng cần nhiều NCC khác nhau, và
 * là khối ĐỘC LẬP: không đọc/ghi gì vào các trường cấp bảng (`nccDaChonTen`, `deXuatNCCTen`…),
 * chỉ đọc/ghi `DongBaoGia.nccDeXuatDongTen`/`trangThaiQuyetDinhDong` — xem chú thích các trường
 * đó ở `kieu-du-lieu.ts`.
 *
 * 📌 CỐ Ý KHÔNG GẮN VÀO MÁY TRẠNG THÁI "GIAI ĐOẠN" (bước ①-⑥ ở đầu trang): quyết định theo từng
 * dòng độc lập với việc đề nghị đang ở giai đoạn nào — hồ sơ có thể đã "Lập đơn mua hàng" cho 3/5
 * dòng mà 2 dòng còn lại vẫn đang chờ đề xuất NCC. Gắn vào máy trạng thái đó là ép một khái niệm
 * nhiều-quyết-định-độc-lập vào một khái niệm một-hồ-sơ-một-bước.
 */
export function KhoiDaNccTheoDong({
  tienDoDong,
  baoGia,
  quyen,
  hoSoDaDong,
  onLuuDeXuat,
  onDuyet,
  onLapPO,
}: {
  tienDoDong: TienDoDongDeNghi[];
  /** `baoGiaLienQuan` của đề nghị — dùng để đọc đề xuất/quyết định đã lưu theo từng dòng. */
  baoGia: BaoGia[];
  quyen: Quyen;
  hoSoDaDong: boolean;
  onLuuDeXuat: (
    sttDongDeNghi: number,
    deXuat: { nccTen: string; lyDo: string },
  ) => string | null;
  onDuyet: (
    bgId: string,
    sttDongDeNghi: number,
    quyetDinh: "da_duyet" | "khong_duyet",
  ) => string | null;
  onLapPO: (sttDongDeNghi: number) => void;
}) {
  /* Bảng "đang sống" gần nhất — bỏ qua bảng đã huỷ (cùng quy ước `baoGiaLienQuan` lọc ở trang
     chứa). Thường chỉ có 0 hoặc 1 bảng sống tại một thời điểm. */
  const bgSong = baoGia.filter((b) => b.trangThai !== "huy").at(-1);

  const [dangGo, setDangGo] = useState<Record<number, { ncc: string; lyDo: string }>>({});

  if (tienDoDong.length === 0) return null;

  const coQuyenDeXuat = quyen.lapPO && !hoSoDaDong;
  const coQuyenDuyet = quyen.xacNhanTruongBP && !hoSoDaDong;

  function dongVatTu(stt: number) {
    return bgSong?.items.find((d) => d.sttDongDeNghi === stt);
  }

  function luu(stt: number) {
    const nhap = dangGo[stt];
    if (!nhap || nhap.ncc.trim() === "" || nhap.lyDo.trim() === "") return;
    const loi = onLuuDeXuat(stt, { nccTen: nhap.ncc, lyDo: nhap.lyDo });
    if (loi) {
      toast.error("Chưa lưu được đề xuất", { description: loi });
      return;
    }
    setDangGo((truoc) => {
      const con = { ...truoc };
      delete con[stt];
      return con;
    });
  }

  const choLapPO = tienDoDong.filter((d) => {
    const dong = dongVatTu(d.stt);
    return dong?.trangThaiQuyetDinhDong === "da_duyet" && d.khoiLuongChuaLenPO > 0;
  });

  return (
    <Card>
      <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
        <div>
          <p className="text-h3 text-text-primary">Đa nhà cung cấp — đề xuất &amp; duyệt theo từng dòng</p>
          <p className="text-xs text-text-desc">
            Dùng khi đề nghị có nhiều dòng vật tư ứng nhiều nhà cung cấp khác nhau — mỗi dòng đề
            xuất và duyệt riêng, không cần chờ dòng khác. Đề nghị chỉ 1 nhà cung cấp thì dùng
            &quot;Xét duyệt phương án giá&quot; ở trên như cũ, không cần khối này.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {tienDoDong.map((d) => {
            const dong = dongVatTu(d.stt);
            const trangThai = dong?.trangThaiQuyetDinhDong;
            const nhap = dangGo[d.stt] ?? { ncc: dong?.nccDeXuatDongTen ?? "", lyDo: dong?.lyDoDeXuatDong ?? "" };

            return (
              <div key={d.stt} className="flex flex-col gap-2 rounded-lg border border-border p-(--hp-md-row-pad)">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-primary">
                    Dòng {d.stt} · {d.tenVatLieu}
                  </span>
                  {trangThai === "da_duyet" && (
                    <Badge className="border-transparent bg-success-bg text-success-soft">Đã duyệt</Badge>
                  )}
                  {trangThai === "khong_duyet" && (
                    <Badge className="border-transparent bg-danger-bg text-danger-soft">Không duyệt</Badge>
                  )}
                  {trangThai === "cho_duyet" && (
                    <Badge className="border-transparent bg-warning-bg text-warning-soft">Chờ duyệt</Badge>
                  )}
                  {!trangThai && (
                    <Badge className="border-transparent bg-neutral-bg text-neutral-soft">Chưa đề xuất</Badge>
                  )}
                </div>

                {(!trangThai || trangThai === "khong_duyet") && coQuyenDeXuat ? (
                  <>
                    {trangThai === "khong_duyet" && dong?.lyDoQuyetDinhDong && (
                      <p className="text-xs text-danger-soft">
                        Trưởng bộ phận không duyệt: {dong.lyDoQuyetDinhDong}. Đề xuất lại bên dưới.
                      </p>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`ncc-dong-${d.stt}`}>Đề xuất chọn nhà cung cấp nào cho dòng này? *</Label>
                      <Input
                        id={`ncc-dong-${d.stt}`}
                        value={nhap.ncc}
                        onChange={(e) =>
                          setDangGo((t) => ({ ...t, [d.stt]: { ncc: e.target.value, lyDo: nhap.lyDo } }))
                        }
                        placeholder="Gõ tên nhà cung cấp"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`ly-do-dong-${d.stt}`}>Dẫn chứng cụ thể *</Label>
                      <Textarea
                        id={`ly-do-dong-${d.stt}`}
                        rows={2}
                        value={nhap.lyDo}
                        onChange={(e) =>
                          setDangGo((t) => ({ ...t, [d.stt]: { ncc: nhap.ncc, lyDo: e.target.value } }))
                        }
                        placeholder="Ví dụ: rẻ hơn 4% so với báo giá còn lại, giao trong 3 ngày."
                      />
                    </div>
                    <div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={nhap.ncc.trim() === "" || nhap.lyDo.trim() === ""}
                        onClick={() => luu(d.stt)}
                      >
                        <Send className="size-4" aria-hidden />
                        Lưu đề xuất
                      </Button>
                    </div>
                  </>
                ) : trangThai === "cho_duyet" ? (
                  <>
                    <p className="text-sm text-text-secondary">
                      Đề xuất: <strong className="text-text-primary">{dong?.nccDeXuatDongTen}</strong>
                      {" — "}
                      {dong?.lyDoDeXuatDong}
                    </p>
                    {coQuyenDuyet && bgSong && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" onClick={() => onDuyet(bgSong.id, d.stt, "da_duyet")}>
                          <Check className="size-4" aria-hidden />
                          Duyệt
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDuyet(bgSong.id, d.stt, "khong_duyet")}
                        >
                          <X className="size-4" aria-hidden />
                          Không duyệt
                        </Button>
                      </div>
                    )}
                  </>
                ) : trangThai === "da_duyet" ? (
                  <p className="text-sm text-text-secondary">
                    Đã chọn: <strong className="text-text-primary">{dong?.nccDeXuatDongTen}</strong>
                  </p>
                ) : (
                  <p className="text-sm text-text-desc">Chưa có đề xuất nào cho dòng này.</p>
                )}
              </div>
            );
          })}
        </div>

        <div>
          <p className="text-h3 text-text-primary">
            Chờ lập PO{choLapPO.length > 0 ? ` (${choLapPO.length})` : ""}
          </p>
          {choLapPO.length === 0 ? (
            <p className="text-sm text-text-desc">
              Duyệt 1 dòng ở trên — nó tự hiện ngay ở đây, không cần chờ dòng khác.
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-2">
              {choLapPO.map((d) => {
                const dong = dongVatTu(d.stt);
                return (
                  <div
                    key={d.stt}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-success/40 bg-success-bg p-(--hp-md-row-pad)"
                  >
                    <span className="text-sm text-text-primary">
                      Dòng {d.stt} · {d.tenVatLieu} — <strong>{dong?.nccDeXuatDongTen}</strong>
                    </span>
                    {quyen.lapPO && (
                      <Button size="sm" onClick={() => onLapPO(d.stt)}>
                        <ShoppingCart className="size-4" aria-hidden />
                        Lập PO
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
