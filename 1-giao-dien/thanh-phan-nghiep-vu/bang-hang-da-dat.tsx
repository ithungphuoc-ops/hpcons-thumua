"use client";

import { StatusBadge } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { nhanAnToan, NHAN_TRANG_THAI_DONG_CHO_NGUOI_DE_NGHI } from "@/2-quy-trinh/trang-thai";
import type { TienDoDongDeNghi } from "@/3-du-lieu/kieu-du-lieu";

/**
 * ★★ BẢNG "HÀNG ĐÃ ĐẶT" — xổ ra dưới một đề nghị ở màn Theo dõi đề nghị.
 *
 * Sếp 27/09/2026 duyệt qua bản demo (artifact "Demo Theo dõi đề nghị"), lần lượt:
 *   *"khi a bấm zô thì sẽ thấy được danh sách thông tin hàng đã đặt"* · *"Dãn qua đây"* (giãn hết
 *   bề ngang) · *"Bỏ màu nền này đi"* · *"ưu tiên bề rộng cho 2 cột này, vì tên hàng thường dài"*
 *   (Tên hàng · Quy cách) · *"luôn canh giữa và luôn bật wrap text"*.
 *
 * 🔴 CHỈ BÀY, KHÔNG TÍNH. Số nhận vào là `TienDoDongDeNghi` do `tinhTienDoDeNghi` sinh ra (chỉ đếm
 * phiếu `da_nhap_kho` — §3.5.4), đã qua `locTienDoConPhaiMua` để trừ dòng tách sang phiếu con. Tính
 * lại ở đây là nguồn số thứ hai, sớm muộn lệch với trang chi tiết.
 *
 * 🔒 KHÔNG hiện đơn giá / nhà cung cấp — `TienDoDongDeNghi` CÓ hai trường đó nhưng màn Theo dõi cam
 * kết không bày ra (người ngoài phòng Thu mua xem được màn này).
 *
 * 📐 `table-fixed`, MỌI cột khai bề rộng: Tên hàng + Quy cách mỗi cột 18rem (Sếp 27/09/2026: *"không cần
 * quá rộng vậy, giảm còn 2/3"* — trước đó hai cột chia hết phần còn lại, ~431px ở màn 1920). Bảng vẫn
 * `w-full` nên phần dư chia theo tỷ lệ cho MỌI cột. `min-w-[88rem]` = tổng bề rộng các cột: khung
 * hẹp thì cuộn ngang chứ không bóp chữ. Thêm cột thì cộng vào sàn.
 */
const O = "px-3 py-2 text-center align-middle whitespace-normal wrap-break-word";
const TD = `${O} text-xs`;
const TH = `${O} text-xs font-semibold`;

const so = (n: number) => n.toLocaleString("vi-VN");
const ngay = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");

export function BangHangDaDat({
  tienDo,
  soDongDaTach,
}: {
  tienDo: TienDoDongDeNghi[];
  /** Số dòng của phiếu này đã tách hết sang phiếu con — nói ra để không ai tưởng mất hàng. */
  soDongDaTach: number;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <TieuDeHangDaDat soMatHang={tienDo.length} soDongDaTach={soDongDaTach} />
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[88rem] table-fixed">
          <thead>
            <tr className="border-b bg-primary/10 text-primary">
              <th className={`${TH} w-12`}>STT</th>
              <th className={`${TH} w-72`}>Tên hàng</th>
              <th className={`${TH} w-72`}>Quy cách</th>
              <th className={`${TH} w-20`}>ĐVT</th>
              <th className={`${TH} w-24`}>Đề nghị</th>
              <th className={`${TH} w-24`}>Đã đặt</th>
              <th className={`${TH} w-24`}>Đã nhận</th>
              <th className={`${TH} w-24`}>Còn lại</th>
              <th className={`${TH} w-32`}>Dự kiến giao</th>
              <th className={`${TH} w-48`}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {tienDo.map((d) => {
              const tt = nhanAnToan(NHAN_TRANG_THAI_DONG_CHO_NGUOI_DE_NGHI, d.trangThaiDong);
              return (
                <tr key={d.stt} className="border-b last:border-b-0">
                  <td className={`${TD} text-text-desc`}>{d.stt}</td>
                  <td className={`${TD} font-medium text-text-primary`}>{d.tenVatLieu}</td>
                  <td className={`${TD} text-text-secondary`}>{d.quyCach?.trim() || "—"}</td>
                  <td className={TD}>{d.donViTinh}</td>
                  <td className={`${TD} tabular-nums`}>{so(d.khoiLuongDeNghi)}</td>
                  <td className={`${TD} tabular-nums`}>{so(d.khoiLuongDaLenPO)}</td>
                  <td className={`${TD} font-semibold tabular-nums`}>{so(d.khoiLuongDaNhan)}</td>
                  <td
                    className={`${TD} font-semibold tabular-nums ${
                      d.khoiLuongConLai > 0 ? "text-warning-soft" : "text-success-soft"
                    }`}
                  >
                    {so(d.khoiLuongConLai)}
                  </td>
                  <td className={TD}>{ngay(d.ngayGiaoDuKien)}</td>
                  <td className={TD}>
                    <StatusBadge label={tt.nhan} tone={tt.tong} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Bản điện thoại — V1.1: bảng nhiều cột trên màn hẹp phải đổi sang thẻ. */
export function TheHangDaDat({
  tienDo,
  soDongDaTach,
}: {
  tienDo: TienDoDongDeNghi[];
  soDongDaTach: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <TieuDeHangDaDat soMatHang={tienDo.length} soDongDaTach={soDongDaTach} />
      {tienDo.map((d) => {
        const tt = nhanAnToan(NHAN_TRANG_THAI_DONG_CHO_NGUOI_DE_NGHI, d.trangThaiDong);
        return (
          <div key={d.stt} className="flex flex-col gap-1 rounded-lg border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium text-text-primary">
                {d.stt}. {d.tenVatLieu}
                {d.quyCach?.trim() ? ` — ${d.quyCach.trim()}` : ""}
              </span>
              <StatusBadge label={tt.nhan} tone={tt.tong} />
            </div>
            <span className="text-xs tabular-nums text-text-secondary">
              Đề nghị {so(d.khoiLuongDeNghi)} · Đã đặt {so(d.khoiLuongDaLenPO)} · Đã nhận{" "}
              {so(d.khoiLuongDaNhan)} · Còn {so(d.khoiLuongConLai)} {d.donViTinh}
            </span>
            <span className="text-xs text-text-desc">Dự kiến giao: {ngay(d.ngayGiaoDuKien)}</span>
          </div>
        );
      })}
    </div>
  );
}

function TieuDeHangDaDat({ soMatHang, soDongDaTach }: { soMatHang: number; soDongDaTach: number }) {
  return (
    <span className="text-xs font-semibold tracking-wide text-primary uppercase">
      Hàng đã đặt — {soMatHang} mặt hàng
      {soDongDaTach > 0 && (
        <span className="font-normal normal-case text-text-desc">
          {" "}
          · {soDongDaTach} dòng đã tách sang phiếu con, xem ở phiếu con
        </span>
      )}
    </span>
  );
}
