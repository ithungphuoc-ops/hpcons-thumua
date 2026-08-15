"use client";

import { Plus, Trash2 } from "lucide-react";
import { KhoiGap } from "@/1-giao-dien/thanh-phan-dung-chung/khoi-gap";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import {
  CAI_DAT_GIAI_DOAN_MAC_DINH,
  NHAN_CACH_GIAO_VIEC,
  caiDatCuaBuoc,
  type CachGiaoViec,
  type CaiDatGiaiDoan,
  type CauHinhQuyTrinh,
  type CongViecGiaiDoan,
} from "@/2-quy-trinh/cau-hinh-quy-trinh";
import { GIAI_DOAN_MUA_HANG } from "@/2-quy-trinh/giai-doan-mua-hang";

/**
 * CÀI ĐẶT TỪNG GIAI ĐOẠN — dựng theo tab cài đặt giai đoạn của Base.vn.
 *
 * 🔴 Ban lãnh đạo gửi ảnh CẢ 8 GIAI ĐOẠN ngày 14–15/08/2026 rồi chốt: *"đủ thông tin 8 bước,
 * em xây thêm tính năng cài đặt thông tin này"*.
 *
 * ⚠️ CHỈ DỰNG Ô BẤM ĐƯỢC CHO THỨ APP CHẠY THẬT. Tab của Base còn nhiều mục nữa (vai trò trong
 * giai đoạn · yêu cầu đánh giá công việc · nhảy bước theo điều kiện · SLA giao nhiệm vụ · bỏ
 * người nhận việc khỏi danh sách theo dõi). App chưa có cơ chế cho những thứ đó — dựng ô cho
 * đủ mặt là tạo ra một trang đầy nút bấm xong không đổi gì, đúng thứ quy tắc dự án cấm. Chúng
 * được liệt kê ở cuối trang cài đặt dưới dạng chỉ đọc kèm lý do.
 *
 * 📌 Hai bước kết thúc (Hoàn thành · Thất bại) không hiện ở đây: chúng là điểm dừng, không có
 * việc phải làm và không có hạn — đúng như ảnh Base (cả hai đều "Không có thời hạn · Không có
 * công việc").
 */
export function KhoiCaiDatGiaiDoan({
  nhap,
  setNhap,
}: {
  nhap: CauHinhQuyTrinh;
  setNhap: (c: CauHinhQuyTrinh) => void;
}) {
  const buocLamViec = GIAI_DOAN_MUA_HANG.filter(
    (g) => g.ma !== "hoan_thanh" && g.ma !== "that_bai",
  );

  /** Ghi đè cài đặt của một bước, giữ nguyên các bước khác. */
  function doiCaiDat(maBuoc: string, phan: Partial<CaiDatGiaiDoan>) {
    setNhap({
      ...nhap,
      caiDatTungBuoc: {
        ...nhap.caiDatTungBuoc,
        [maBuoc]: { ...caiDatCuaBuoc(nhap, maBuoc), ...phan },
      },
    });
  }

  /** Ghi đè danh sách công việc của một bước. */
  function doiCongViec(maBuoc: string, ds: CongViecGiaiDoan[]) {
    setNhap({
      ...nhap,
      congViecTheoBuoc: { ...nhap.congViecTheoBuoc, [maBuoc]: ds },
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {buocLamViec.map((g, i) => {
        const caiDat = caiDatCuaBuoc(nhap, g.ma);
        const congViec = nhap.congViecTheoBuoc?.[g.ma] ?? [];
        const han = nhap.hanGioTheoBuoc?.[g.ma] ?? 0;
        return (
          <KhoiGap
            key={g.ma}
            tieuDe={`${String(i + 1).padStart(2, "0")} · ${g.nhan}`}
            soLuong={congViec.length}
          >
            <div className="flex flex-col gap-(--hp-md-row-gap)">
              {/* --- Thời hạn --- */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`han-${g.ma}`}>Thời gian hoàn thành</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id={`han-${g.ma}`}
                    type="number"
                    min={0}
                    max={720}
                    value={han}
                    onChange={(e) =>
                      setNhap({
                        ...nhap,
                        hanGioTheoBuoc: {
                          ...nhap.hanGioTheoBuoc,
                          [g.ma]: Math.max(0, Math.trunc(Number(e.target.value))),
                        },
                      })
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-text-desc">giờ</span>
                  {han === 0 && (
                    <span className="text-xs text-text-desc">(không đặt thời hạn)</span>
                  )}
                </div>
                {/* 🔴 NÓI THẲNG LÀ CHƯA DÙNG. Con số này đang được lưu nhưng app chưa tính
                    "hồ sơ đã ngồi ở bước này bao lâu" — muốn tính phải biết thời điểm hồ sơ
                    VÀO bước, mà giai đoạn được suy ra từ chứng từ chứ không lưu lịch sử
                    chuyển bước. Giấu chuyện này đi là để người dùng tưởng app đang canh giờ
                    giúp họ. */}
                <p className="text-xs text-warning-soft">
                  Đang lưu để đối chiếu với quy trình, <strong>app chưa dùng để cảnh báo</strong>{" "}
                  quá hạn theo bước — hạn hiện tính theo ngày cần hàng của cả đề nghị.
                </p>
              </div>

              {/* --- Các cờ bật/tắt --- */}
              <div className="flex flex-col gap-2 border-t border-divider pt-3">
                <O
                  ma={`batbuoc-${g.ma}`}
                  nhan="Bắt buộc hoàn thành công việc của giai đoạn"
                  moTa="Chưa tích xong các việc bên dưới thì không chuyển sang bước sau được."
                  chay
                  bat={caiDat.batBuocXongCongViec}
                  doi={(v) => doiCaiDat(g.ma, { batBuocXongCongViec: v })}
                />
                <O
                  ma={`chuyenviec-${g.ma}`}
                  nhan="Cho phép giao lại nhiệm vụ cho người khác"
                  moTa="Bật thì trang chi tiết đề nghị có nút “Chuyển tiếp”. Base đang đặt KHÔNG CHO PHÉP ở cả 8 giai đoạn."
                  chay
                  bat={caiDat.chuyenViecDuoc}
                  doi={(v) => doiCaiDat(g.ma, { chuyenViecDuoc: v })}
                />
                <O
                  ma={`chunhat-${g.ma}`}
                  nhan="Bỏ qua Chủ nhật khi tính thời hạn"
                  moTa="Lưu theo quy trình, chưa ảnh hưởng vì thời hạn theo bước chưa được dùng để cảnh báo."
                  bat={caiDat.boQuaChuNhat}
                  doi={(v) => doiCaiDat(g.ma, { boQuaChuNhat: v })}
                />
              </div>

              {/* --- Cách giao việc --- */}
              <div className="flex flex-col gap-1.5 border-t border-divider pt-3">
                <Label htmlFor={`giaoviec-${g.ma}`}>Nhiệm vụ được giao tự động</Label>
                <select
                  id={`giaoviec-${g.ma}`}
                  value={caiDat.cachGiaoViec}
                  onChange={(e) =>
                    doiCaiDat(g.ma, { cachGiaoViec: e.target.value as CachGiaoViec })
                  }
                  className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none"
                >
                  {(Object.keys(NHAN_CACH_GIAO_VIEC) as CachGiaoViec[]).map((ma) => (
                    <option key={ma} value={ma}>
                      {NHAN_CACH_GIAO_VIEC[ma]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-text-desc">
                  Ghi theo quy trình để tra cứu. App giao việc theo <strong>từng dòng vật tư</strong>{" "}
                  ở bảng Phân bổ, không giao theo giai đoạn, nên ô này chưa đổi hành vi.
                </p>
              </div>

              {/* --- Danh sách công việc --- */}
              <div className="flex flex-col gap-2 border-t border-divider pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>Danh sách công việc</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      doiCongViec(g.ma, [
                        ...congViec,
                        {
                          // Mã sinh theo thứ tự, KHÔNG dùng thời gian/ngẫu nhiên: trang này
                          // dựng lại nhiều lần, mã phải ổn định để trạng thái "đã xong" của
                          // các đề nghị không bị mất dấu.
                          ma: `viec_${g.ma}_${congViec.length + 1}`,
                          ten: "",
                          moTa: "",
                          batBuoc: true,
                        },
                      ])
                    }
                  >
                    <Plus className="size-4" aria-hidden />
                    Thêm công việc
                  </Button>
                </div>

                {congViec.length === 0 ? (
                  <p className="text-xs text-text-desc">Không có công việc.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {congViec.map((cv, idx) => (
                      <li
                        key={cv.ma}
                        className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <Input
                              value={cv.ten}
                              placeholder="Tên công việc, vd Checkin hàng tồn kho"
                              aria-label={`Tên công việc ${idx + 1} của bước ${g.nhan}`}
                              onChange={(e) =>
                                doiCongViec(
                                  g.ma,
                                  congViec.map((x) =>
                                    x.ma === cv.ma ? { ...x, ten: e.target.value } : x,
                                  ),
                                )
                              }
                            />
                            <Input
                              value={cv.moTa ?? ""}
                              placeholder="Ai làm, làm gì — vd QLK/TK báo tồn kho thực tế"
                              aria-label={`Mô tả công việc ${idx + 1} của bước ${g.nhan}`}
                              onChange={(e) =>
                                doiCongViec(
                                  g.ma,
                                  congViec.map((x) =>
                                    x.ma === cv.ma ? { ...x, moTa: e.target.value } : x,
                                  ),
                                )
                              }
                            />
                          </div>
                          {/* Xóa việc — vùng chạm 44px theo Design System V1.1. */}
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Xóa công việc ${cv.ten || idx + 1}`}
                            onClick={() =>
                              doiCongViec(
                                g.ma,
                                congViec.filter((x) => x.ma !== cv.ma),
                              )
                            }
                          >
                            <Trash2 className="size-4 text-danger-soft" aria-hidden />
                          </Button>
                        </div>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            className="size-4 shrink-0 accent-primary"
                            checked={cv.batBuoc}
                            onChange={(e) =>
                              doiCongViec(
                                g.ma,
                                congViec.map((x) =>
                                  x.ma === cv.ma ? { ...x, batBuoc: e.target.checked } : x,
                                ),
                              )
                            }
                          />
                          <span className="text-xs text-text-secondary">
                            Bắt buộc — chưa xong thì không sang bước sau
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}

                {/* ⚠️ Cảnh báo mất dấu: trạng thái "đã xong" của từng đề nghị lưu theo MÃ
                    công việc. Xóa một việc là các đề nghị đang chạy mất dấu đã tích. */}
                {congViec.length > 0 && (
                  <p className="text-xs text-text-desc">
                    Xóa một công việc sẽ <strong>bỏ luôn dấu “đã xong”</strong> của việc đó ở mọi
                    đề nghị đang chạy. Sửa tên thì không sao — dấu đã xong bám theo mã, không
                    bám theo tên.
                  </p>
                )}
              </div>
            </div>
          </KhoiGap>
        );
      })}
    </div>
  );
}

/**
 * Một ô bật/tắt kèm mô tả.
 *
 * `chay` = cờ này ĐANG điều khiển hành vi thật của app. Cờ chưa áp dụng thì hiện nhãn "chưa
 * áp dụng" để người cài đặt không tưởng mình vừa đổi được điều gì.
 */
function O({
  ma,
  nhan,
  moTa,
  bat,
  doi,
  chay = false,
}: {
  ma: string;
  nhan: string;
  moTa: string;
  bat: boolean;
  doi: (v: boolean) => void;
  chay?: boolean;
}) {
  return (
    <label htmlFor={ma} className="flex cursor-pointer items-start gap-2.5">
      <input
        id={ma}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 accent-primary"
        checked={bat}
        onChange={(e) => doi(e.target.checked)}
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm text-text-primary">
          {nhan}
          {!chay && (
            <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[11px] text-text-desc">
              chưa áp dụng
            </span>
          )}
        </span>
        <span className="text-xs text-text-desc">{moTa}</span>
      </span>
    </label>
  );
}

/** Giữ để nơi khác dùng lại giá trị mặc định mà không phải import chéo. */
export { CAI_DAT_GIAI_DOAN_MAC_DINH };
