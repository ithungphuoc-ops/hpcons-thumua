"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import {
  dapNhip,
  nhaKhoa,
  ngheNguoiKhacDangSua,
  NHIP_DAP_MS,
  type NguoiDangSua,
} from "@/3-du-lieu/khoa-mem";

// ============================================================
// DẢI BÁO "AI ĐANG SỬA" — đợt 1 của lộ trình chống mất dữ liệu (Sếp chốt 22/09/2026)
//
// Mở một hồ sơ ra sửa thì người thứ hai thấy ngay ai đang ngồi trong đó. KHÔNG CHẶN — họ vẫn
// vào được nếu cần gấp; mục đích là để mọi người **tự tránh nhau**, không phải dựng rào.
//
// 🔴 VÌ SAO KHÔNG CHẶN CỨNG: chặn thì người quên đóng tab sẽ khoá hồ sơ của cả phòng, và ai
// cũng sẽ đi tìm cách lách. Một dòng cảnh báo mà người ta chịu đọc còn hơn một cái rào mà
// người ta tìm cách trèo.
// ============================================================

/** Khoảng cách từ lúc người kia mở hồ sơ, viết cho người Việt đọc. */
function dienDatKhoangCach(nhipCuoi: string): string {
  const giay = Math.max(0, Math.round((Date.now() - new Date(nhipCuoi).getTime()) / 1000));
  if (giay < 60) return "vừa xong";
  const phut = Math.round(giay / 60);
  if (phut < 60) return `${phut} phút trước`;
  return `${Math.round(phut / 60)} giờ trước`;
}

export default function BangAiDangSua({
  loai,
  id,
  uid,
  ten,
}: {
  /** Loại hồ sơ — `"don-hang"` hoặc `"de-nghi"`. Dùng để hai loại không lẫn mã với nhau. */
  loai: string;
  id: string | undefined;
  uid: string | undefined;
  ten: string;
}) {
  const [nguoiKhac, setNguoiKhac] = useState<NguoiDangSua[]>([]);

  useEffect(() => {
    if (!id || !uid) return;
    let con = true;
    let huyNghe: (() => void) | null = null;

    /* Đập nhịp NGAY rồi mới đặt hẹn — không thì người mở hồ sơ phải chờ hết một nhịp (20 giây)
       mới hiện ra cho người khác thấy, mà 20 giây đầu lại đúng lúc hay va nhau nhất. */
    void dapNhip(loai, id, uid, ten);
    const hen = setInterval(() => void dapNhip(loai, id, uid, ten), NHIP_DAP_MS);

    void ngheNguoiKhacDangSua(loai, id, uid, (ds) => {
      if (con) setNguoiKhac(ds);
    }).then((huy) => {
      if (!con) huy?.();
      else huyNghe = huy;
    });

    return () => {
      con = false;
      clearInterval(hen);
      huyNghe?.();
      void nhaKhoa(loai, id, uid);
    };
  }, [loai, id, uid, ten]);

  if (nguoiKhac.length === 0) return null;

  const dau = nguoiKhac[0];
  const conLai = nguoiKhac.length - 1;

  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-lg border px-4 py-3"
      style={{
        borderColor: "color-mix(in srgb, var(--hp-warning) 35%, transparent)",
        backgroundColor: "var(--hp-warning-bg)",
      }}
      role="status"
    >
      <Eye size={17} className="mt-0.5 flex-none" style={{ color: "#B26A00" }} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold" style={{ color: "#B26A00" }}>
          {dau.ten || "Một người khác"} đang mở hồ sơ này
          {conLai > 0 && ` (và ${conLai} người nữa)`}
        </p>
        <p className="mt-0.5 text-[12.5px]" style={{ color: "var(--hp-text-desc)" }}>
          Mở lúc {dienDatKhoangCach(dau.nhipCuoi)}. Bạn vẫn sửa được — nhưng nên hỏi nhau một
          tiếng để khỏi trùng việc, vì hai người lưu gần nhau thì một người có thể mất phần vừa nhập.
        </p>
      </div>
    </div>
  );
}
