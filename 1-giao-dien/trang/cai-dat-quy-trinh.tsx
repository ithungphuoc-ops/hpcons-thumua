"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Lock, RotateCcw, Save, Settings, Timer } from "lucide-react";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/1-giao-dien/nen-tang-ui/card";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { Label } from "@/1-giao-dien/nen-tang-ui/label";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  CAU_HINH_MAC_DINH,
  DIEU_KIEN_KHONG_SUA,
  THAM_SO_QUY_TRINH,
  loiCauHinh,
  type CauHinhQuyTrinh,
} from "@/2-quy-trinh/cau-hinh-quy-trinh";
import { GIAI_DOAN_MUA_HANG } from "@/2-quy-trinh/giai-doan-mua-hang";
import { formatCurrencyVnd, formatMocThoiGian } from "@/6-tien-ich/dinh-dang";

/**
 * CÀI ĐẶT QUY TRÌNH — Ban lãnh đạo 13/08/2026: *"em thêm chức năng cài đặt quy trình, có thể
 * chỉnh sửa các điều kiện trong quy trình"*, kèm ảnh tab "Cài đặt" của Base.
 *
 * Ba khối, đúng thứ tự người dùng cần:
 *   ① Tham số quy trình — ngưỡng tiền, số báo giá, số ngày (SỬA ĐƯỢC)
 *   ② Thời hạn từng giai đoạn — theo cột giai đoạn trong ảnh Base (SỬA ĐƯỢC)
 *   ③ Điều kiện cố định — hiện để biết app đang chạy theo luật gì (CHỈ ĐỌC, kèm lý do)
 *
 * 🔴 CHỈ NGƯỜI QUẢN LÝ VÀO ĐƯỢC. Cấu hình dùng chung cả phòng: một người sửa là đổi luật cho
 * mọi người, nên không thể để ai cũng vào được.
 *
 * ⚠️ Trang này KHÔNG bắt chước hết tab Cài đặt của Base. Base là nền tảng đa quy trình nên có
 * webhook, mẫu email, bộ đếm, mã QR, cấp số văn bản Office, chuyển tiếp sang quy trình khác.
 * App này là MỘT module — dựng những khối đó chỉ để trông giống là tạo ra một trang đầy nút
 * bấm không làm gì.
 */
export default function TrangCaiDatQuyTrinh() {
  const { cauHinh, luuCauHinhQuyTrinh, lichSuCauHinh } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();

  /** Bản đang sửa — chưa bấm Lưu thì không ảnh hưởng ai. */
  const [nhap, setNhap] = useState<CauHinhQuyTrinh>(cauHinh);

  /**
   * ⚠️ Nạp lại khi cấu hình trên máy chủ đổi (người khác vừa lưu). Không nạp lại thì màn này
   * hiện số cũ, và bấm Lưu là ghi đè thay đổi của người ta mà không ai hay.
   */
  useEffect(() => {
    setNhap(cauHinh);
  }, [cauHinh]);

  if (!quyen.suaPODaChot) {
    return (
      <EmptyState
        icon={Lock}
        title="Không có quyền vào cài đặt quy trình"
        description="Cấu hình quy trình dùng chung cho cả phòng — một người sửa là đổi luật cho mọi người, nên chỉ Trưởng bộ phận và Quản trị hệ thống vào được. Cần đổi điều kiện nào thì nhờ Trưởng bộ phận."
      />
    );
  }

  const loi = loiCauHinh(nhap);
  const daDoi = JSON.stringify(nhap) !== JSON.stringify(cauHinh);

  function luu() {
    const kq = luuCauHinhQuyTrinh(nhap, nguoiDung.tenHienThi);
    if (kq.length > 0) {
      toast.error("Chưa lưu được", { description: kq[0] });
      return;
    }
    toast.success("Đã lưu cài đặt quy trình", {
      description: "Cấu hình mới áp dụng cho cả phòng ngay lập tức.",
    });
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Thu mua", href: "/tong-quan" }, { label: "Cài đặt quy trình" }]}
        title="Cài đặt quy trình"
        description="Chỉnh các điều kiện của quy trình mua hàng — áp dụng cho cả phòng"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={JSON.stringify(nhap) === JSON.stringify(CAU_HINH_MAC_DINH)}
              onClick={() => setNhap(CAU_HINH_MAC_DINH)}
            >
              <RotateCcw className="size-4" aria-hidden />
              Về mặc định
            </Button>
            <Button size="sm" disabled={!daDoi || loi.length > 0} onClick={luu}>
              <Save className="size-4" aria-hidden />
              Lưu cài đặt
            </Button>
          </div>
        }
      />

      {/* 🔴 Nói RÕ phạm vi ảnh hưởng ngay đầu trang. Người dùng phải biết mình đang sửa luật
          của cả phòng, không phải tùy chọn cá nhân — trước khi họ gõ số đầu tiên. */}
      <Card className="border-warning/40 bg-warning-bg">
        <CardContent className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-soft" aria-hidden />
          <p className="text-xs text-text-secondary">
            Cấu hình này <strong>dùng chung cho cả phòng</strong> và có tác dụng{" "}
            <strong>hồi tố</strong>: app không lưu ngưỡng vào từng hồ sơ mà tính lại mỗi lần mở,
            nên đổi số là mọi hồ sơ cũ — kể cả hồ sơ đã xong — được xét theo luật mới. Ví dụ đơn
            12 triệu hôm qua đã trình Tổng Giám đốc ký; nâng ngưỡng lên 15 triệu thì hôm nay app
            ghi “Trưởng phòng duyệt”, lệch với hồ sơ giấy đang có chữ ký TGĐ. Mọi lần đổi được
            ghi vết ở cuối trang để giải thích được chuyện đó. Chỉ đổi khi Ban lãnh đạo đã chốt.
          </p>
        </CardContent>
      </Card>

      {/* ===== ① THAM SỐ QUY TRÌNH ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="size-4 shrink-0 text-primary" aria-hidden />
            Tham số quy trình
          </CardTitle>
          <p className="text-xs text-text-desc">
            Ngưỡng giá trị và số lượng bắt buộc theo quy trình TM-QT Mua hàng.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          {THAM_SO_QUY_TRINH.map((t) => (
            <div key={t.khoa} className="flex flex-col gap-1.5 border-b border-divider pb-3 last:border-0 last:pb-0">
              <Label htmlFor={`ts-${t.khoa}`}>{t.nhan}</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id={`ts-${t.khoa}`}
                  type="number"
                  min={t.toiThieu}
                  max={t.toiDa}
                  value={nhap[t.khoa]}
                  onChange={(e) =>
                    setNhap({ ...nhap, [t.khoa]: Math.trunc(Number(e.target.value)) })
                  }
                  className="w-48"
                />
                {/* Với ô tiền, hiện luôn số đã định dạng — 10000000 và 100000000 nhìn gần
                    giống nhau, gõ thừa một số 0 là ngưỡng lệch 10 lần mà mắt không bắt được. */}
                {t.kieu === "tien" && (
                  <span className="text-sm font-medium text-primary">
                    {formatCurrencyVnd(nhap[t.khoa])}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-desc">{t.moTa}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ===== ② THỜI HẠN TỪNG GIAI ĐOẠN =====
          Theo cột giai đoạn trong ảnh Base: "01 Tiếp nhận và kiểm tra · 4.00 Giờ". */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="size-4 shrink-0 text-primary" aria-hidden />
            Thời hạn xử lý từng giai đoạn
          </CardTitle>
          <p className="text-xs text-text-desc">
            Số giờ tối đa một hồ sơ được nằm ở mỗi bước. Đặt <strong>0</strong> nghĩa là bước đó
            không đặt thời hạn.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {GIAI_DOAN_MUA_HANG.filter(
            (g) => g.ma !== "hoan_thanh" && g.ma !== "that_bai",
          ).map((g, i) => (
            <div
              key={g.ma}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-divider pb-2 last:border-0 last:pb-0"
            >
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium text-text-primary">
                  {String(i + 1).padStart(2, "0")} · {g.nhan}
                </span>
                <span className="truncate text-xs text-text-desc">{g.moTa}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={720}
                  value={nhap.hanGioTheoBuoc[g.ma] ?? 0}
                  onChange={(e) =>
                    setNhap({
                      ...nhap,
                      hanGioTheoBuoc: {
                        ...nhap.hanGioTheoBuoc,
                        [g.ma]: Math.trunc(Number(e.target.value)),
                      },
                    })
                  }
                  className="w-24"
                  aria-label={`Thời hạn bước ${g.nhan}, tính bằng giờ`}
                />
                <span className="text-sm text-text-desc">giờ</span>
              </span>
            </div>
          ))}
          <p className="text-xs text-text-desc">
            Hai bước cuối (Hoàn thành · Thất bại) không có thời hạn — chúng là điểm dừng, không
            phải việc đang chờ ai làm.
          </p>
        </CardContent>
      </Card>

      {/* ===== ③ ĐIỀU KIỆN CỐ ĐỊNH ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="size-4 shrink-0 text-text-desc" aria-hidden />
            Điều kiện cố định
          </CardTitle>
          <p className="text-xs text-text-desc">
            Những luật app đang áp dụng mà <strong>không sửa được</strong> — hiện ở đây để biết
            app đang chạy theo gì, kèm lý do vì sao khóa.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {DIEU_KIEN_KHONG_SUA.map((d) => (
            <div
              key={d.nhan}
              className="flex flex-col gap-0.5 border-b border-divider pb-2 last:border-0 last:pb-0"
            >
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-medium text-text-primary">{d.nhan}</span>
                <span className="text-sm text-primary">{d.giaTri}</span>
              </span>
              <span className="text-xs text-text-desc">{d.lyDo}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ===== VẾT ĐỔI CẤU HÌNH =====
          Vì cấu hình có tác dụng hồi tố, đây là chỗ duy nhất giải thích được vì sao hồ sơ cũ
          và màn hình lệch nhau. Không có lần đổi nào thì không hiện — khối rỗng chiếm chỗ. */}
      {lichSuCauHinh.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lịch sử thay đổi cài đặt</CardTitle>
            <p className="text-xs text-text-desc">
              Ai đổi gì, lúc nào — giữ 50 lần gần nhất.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {lichSuCauHinh.map((v, i) => (
              <div
                key={`${v.thoiDiem}-${i}`}
                className="flex flex-col gap-0.5 border-b border-divider pb-2 last:border-0 last:pb-0"
              >
                <span className="text-xs text-text-desc">
                  {formatMocThoiGian(v.thoiDiem)} · {v.nguoiDoi}
                </span>
                {v.thayDoi.map((t, k) => (
                  <span key={k} className="text-sm text-text-primary">
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Danh sách lỗi đặt CUỐI, cạnh nút Lưu — chỗ người dùng đang nhìn khi bấm không được. */}
      {loi.length > 0 && (
        <Card className="border-danger/40 bg-danger-bg">
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-danger-soft">
              Còn {loi.length} chỗ chưa hợp lệ, chưa lưu được
            </p>
            <ul className="flex list-disc flex-col gap-0.5 pl-5">
              {loi.map((x, i) => (
                <li key={i} className="text-xs text-text-secondary">
                  {x}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
