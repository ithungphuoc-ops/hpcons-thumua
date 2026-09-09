"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Badge } from "@/1-giao-dien/nen-tang-ui/badge";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { Textarea } from "@/1-giao-dien/nen-tang-ui/textarea";
import { ODinhKemTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import type { BaoGia, TienDoDongDeNghi } from "@/3-du-lieu/kieu-du-lieu";
import type { MoTaTep } from "@/3-du-lieu/kho-tep";
import type { Quyen } from "@/4-phan-quyen/quyen";

/**
 * ★★ ĐA NHÀ CUNG CẤP THEO TỪNG DÒNG — Ban lãnh đạo 08/09/2026, ví dụ thật: đề nghị nhiều dòng
 * vật tư, mỗi dòng 1 NCC khác nhau, mỗi dòng tự có các bản báo giá riêng (số lượng theo
 * `DongDeNghi.soBaoGiaYeuCau`) — nhân viên đính kèm tệp, Trưởng bộ phận duyệt TỪNG BẢN độc
 * lập (gõ tên NCC ngay lúc duyệt). Duyệt xong dòng nào là dòng đó tự nhảy sang "Chờ lập PO"
 * ngay, không cần chờ dòng khác.
 *
 * 🔴 SONG SONG, KHÔNG THAY THẾ khối "Bảng báo giá"/"Xét duyệt phương án giá" đã có
 * (`KhuBaoGiaTheoSoLuong` + `chonNCCChoBaoGia`) — đúng cho ca đề nghị chỉ có 1 NCC quyết định
 * chung cho cả đơn, không đổi gì ở đó. Khối này chỉ dùng khi đề nghị thật sự có nhiều NCC
 * khác nhau theo dòng.
 *
 * 📌 CỐ Ý KHÔNG GẮN VÀO MÁY TRẠNG THÁI "GIAI ĐOẠN" (bước ①-⑥ ở đầu trang): quyết định theo
 * từng dòng độc lập với việc đề nghị đang ở giai đoạn nào.
 */
export function KhoiDaNccTheoDong({
  tienDoDong,
  baoGia,
  quyen,
  nguoiDung,
  hoSoDaDong,
  onDinhKem,
  onDuyet,
  onLapPO,
}: {
  tienDoDong: TienDoDongDeNghi[];
  /** `baoGiaLienQuan` của đề nghị — dùng để đọc tệp/quyết định đã lưu theo từng dòng. */
  baoGia: BaoGia[];
  quyen: Quyen;
  nguoiDung: { uid: string; ten: string };
  hoSoDaDong: boolean;
  onDinhKem: (sttDongDeNghi: number, viTri: number, tep: MoTaTep) => string | null | undefined;
  onDuyet: (
    bgId: string,
    sttDongDeNghi: number,
    quyetDinh: "da_duyet" | "khong_duyet",
    viTri: number,
    thongTin: { nccTen: string; lyDo?: string },
  ) => string | null | undefined;
  onLapPO: (sttDongDeNghi: number) => void;
}) {
  const [hoi, setHoi] = useState<{ stt: number; viTri: number; loai: "da_duyet" | "khong_duyet" } | null>(null);
  const [nccGo, setNccGo] = useState("");
  const [lyDoGo, setLyDoGo] = useState("");

  if (tienDoDong.length === 0) return null;

  /* Bảng "đang sống" gần nhất — bỏ qua bảng đã huỷ, cùng quy ước `baoGiaLienQuan` ở trang chứa. */
  const bgSong = baoGia.filter((b) => b.trangThai !== "huy").at(-1);

  function dongVatTu(stt: number) {
    return bgSong?.items.find((d) => d.sttDongDeNghi === stt);
  }

  const coQuyenDinhKem = quyen.lapPO && !hoSoDaDong;
  const coQuyenDuyet = quyen.xacNhanTruongBP && !hoSoDaDong;

  const conCho = tienDoDong.filter((d) => dongVatTu(d.stt)?.trangThaiQuyetDinhDong !== "da_duyet");
  const choLapPO = tienDoDong.filter((d) => dongVatTu(d.stt)?.trangThaiQuyetDinhDong === "da_duyet");

  const chuanHoa = (s: string) => s.trim().toLowerCase();
  const nhomTheoNCC: { ncc: string; dong: { stt: number; ten: string }[] }[] = [];
  for (const d of choLapPO) {
    const ncc = dongVatTu(d.stt)?.nccDuyetDongTen ?? "";
    let nhom = nhomTheoNCC.find((g) => chuanHoa(g.ncc) === chuanHoa(ncc));
    if (!nhom) {
      nhom = { ncc, dong: [] };
      nhomTheoNCC.push(nhom);
    }
    nhom.dong.push({ stt: d.stt, ten: d.tenVatLieu });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-(--hp-md-row-gap)">
        <div>
          <p className="text-h3 text-text-primary">Đa nhà cung cấp — đính kèm &amp; duyệt theo từng dòng</p>
          <p className="text-xs text-text-desc">
            Dùng khi đề nghị có nhiều dòng vật tư ứng nhiều nhà cung cấp khác nhau — mỗi dòng
            đính kèm và duyệt riêng, không cần chờ dòng khác. Đề nghị chỉ 1 nhà cung cấp thì
            dùng &quot;Xét duyệt phương án giá&quot; ở trên như cũ.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {conCho.map((d) => {
            const dong = dongVatTu(d.stt);
            const soO = d.soBaoGiaYeuCau ?? 2;
            const trangThai = dong?.trangThaiQuyetDinhDong;
            return (
              <div key={d.stt} className="flex flex-col gap-2 rounded-lg border border-border p-(--hp-md-row-pad)">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-primary">
                    Dòng {d.stt} · {d.tenVatLieu}
                  </span>
                  {trangThai === "khong_duyet" ? (
                    <Badge className="border-transparent bg-danger-bg text-danger-soft">Không duyệt</Badge>
                  ) : (dong?.tepBaoGiaTheoDong ?? []).filter(Boolean).length >= soO ? (
                    <Badge className="border-transparent bg-warning-bg text-warning-soft">Chờ duyệt</Badge>
                  ) : (
                    <Badge className="border-transparent bg-neutral-bg text-neutral-soft">Còn thiếu báo giá</Badge>
                  )}
                </div>

                {trangThai === "khong_duyet" && dong?.lyDoQuyetDinhDong && (
                  <p className="text-xs text-danger-soft">
                    Trưởng bộ phận không duyệt: {dong.lyDoQuyetDinhDong}. Đính kèm bản khác cho dòng này.
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  {Array.from({ length: soO }).map((_, viTri) => {
                    const tep = dong?.tepBaoGiaTheoDong?.[viTri] ?? undefined;
                    return (
                      <ODinhKemTep
                        key={viTri}
                        tep={tep}
                        nhanThem={`Chọn tệp báo giá NCC ${viTri + 1}`}
                        nguoi={nguoiDung}
                        khoa={!coQuyenDinhKem}
                        anHuongDan
                        onXong={(t) => onDinhKem(d.stt, viTri, t)}
                        nhanPhu={
                          tep && coQuyenDuyet ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                setNccGo("");
                                setLyDoGo("");
                                setHoi({ stt: d.stt, viTri, loai: "da_duyet" });
                              }}
                            >
                              <Check className="size-4" aria-hidden />
                              Duyệt bản này
                            </Button>
                          ) : undefined
                        }
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <p className="text-h3 text-text-primary">
            Chờ lập PO{choLapPO.length > 0 ? ` (${choLapPO.length})` : ""}
          </p>
          {nhomTheoNCC.length === 0 ? (
            <p className="text-sm text-text-desc">
              Duyệt 1 bản báo giá ở trên — dòng đó tự hiện ngay ở đây, không cần chờ dòng khác.
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-2">
              {nhomTheoNCC.map((g) => (
                <div
                  key={chuanHoa(g.ncc)}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-success/40 bg-success-bg p-(--hp-md-row-pad)"
                >
                  <span className="text-sm text-text-primary">
                    <strong>{g.ncc || "(chưa rõ tên)"}</strong>
                    {" — "}
                    {g.dong.map((x) => `Dòng ${x.stt} · ${x.ten}`).join(", ")}
                  </span>
                  {quyen.lapPO && (
                    <Button size="sm" onClick={() => onLapPO(g.dong[0].stt)}>
                      <ShoppingCart className="size-4" aria-hidden />
                      Lập PO{g.dong.length > 1 ? ` (${g.dong.length} dòng)` : ""}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <HopXacNhan
        mo={hoi !== null}
        tieuDe={hoi?.loai === "da_duyet" ? "Duyệt bản báo giá này?" : "Không duyệt bản báo giá này?"}
        moTa={
          hoi?.loai === "da_duyet"
            ? "Dòng vật tư này sẽ chuyển ngay sang \"Chờ lập PO\"."
            : "Đính kèm bản khác cho dòng này để duyệt lại — không ảnh hưởng các dòng khác."
        }
        nhanDongY={hoi?.loai === "da_duyet" ? "Duyệt" : "Không duyệt"}
        nguyHiem={hoi?.loai === "khong_duyet"}
        khoaDongY={
          hoi?.loai === "da_duyet"
            ? nccGo.trim() === ""
              ? "Ghi tên nhà cung cấp trước khi duyệt."
              : undefined
            : lyDoGo.trim() === ""
              ? "Phải ghi rõ vì sao không duyệt để nhân viên biết cần bổ sung gì."
              : undefined
        }
        onDong={() => setHoi(null)}
        onDongY={() => {
          if (!hoi || !bgSong) return;
          onDuyet(bgSong.id, hoi.stt, hoi.loai, hoi.viTri, { nccTen: nccGo, lyDo: lyDoGo });
        }}
      >
        {hoi?.loai === "da_duyet" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ncc-duyet-dong">Duyệt cho nhà cung cấp nào? *</Label>
            <Input id="ncc-duyet-dong" value={nccGo} onChange={(e) => setNccGo(e.target.value)} placeholder="Gõ tên nhà cung cấp" />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ly-do-khong-duyet-dong">Lý do không duyệt *</Label>
            <Textarea id="ly-do-khong-duyet-dong" rows={2} value={lyDoGo} onChange={(e) => setLyDoGo(e.target.value)} placeholder="Ví dụ: giá cao hơn hẳn, thiếu thông tin..." />
          </div>
        )}
      </HopXacNhan>
    </Card>
  );
}
