"use client";

import { useState } from "react";
import { BadgeCheck, Clock } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { daDuyetBoPhan, lyDoKhongDuyetDuoc } from "@/2-quy-trinh/duyet-bo-phan";
import { formatMocThoiGian } from "@/6-tien-ich/dinh-dang";
import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";

/**
 * KHỐI DUYỆT CỦA QUẢN LÝ BỘ PHẬN ĐỀ XUẤT.
 *
 * 🔴 Ban lãnh đạo 12/08/2026: *"đề nghị có thêm mục duyệt bởi quản lý bộ phận thi công"*.
 *
 * Kể từ khi MỌI tài khoản đều lập được đề nghị, đây là khâu kiểm soát duy nhất trước khi
 * việc rơi sang Thu mua. Khối này phải nói rõ ba điều: đang chờ ai, ai duyệt được, và đã
 * duyệt thì ai duyệt lúc nào.
 *
 * ⚠️ HIỆN CHO MỌI NGƯỜI xem được đề nghị, không riêng người duyệt. Người lập cần biết phiếu
 * mình gửi đang nằm ở đâu — giấu đi thì họ lại gọi điện hỏi, đúng thứ app sinh ra để bỏ.
 */
export function KhoiDuyetBoPhan({ deNghi }: { deNghi: DeNghiMuaHang }) {
  const { duyetDeNghiCuaBoPhan } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  const [moHop, setMoHop] = useState(false);

  const daDuyet = daDuyetBoPhan(deNghi);
  const vuongMac = lyDoKhongDuyetDuoc(deNghi, quyen.duyetDeNghiBoPhan, nguoiDung.uid);

  // Đã duyệt từ trước mà KHÔNG có thông tin người duyệt = phiếu nhận từ HPcore (hoặc dữ
  // liệu cũ). Không hiện gì cả — thêm một khối "đã duyệt" trống rỗng chỉ tổ chiếm chỗ.
  if (daDuyet && !deNghi.duyetBoPhan) return null;

  if (daDuyet && deNghi.duyetBoPhan) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-success bg-success-bg p-(--hp-md-row-pad)">
        <BadgeCheck className="size-4 shrink-0 text-success-soft" aria-hidden />
        <span className="text-sm font-medium text-text-primary">
          Đã được quản lý bộ phận duyệt
        </span>
        <span className="text-xs text-text-desc">
          {deNghi.duyetBoPhan.ten} · {deNghi.duyetBoPhan.chucDanh} ·{" "}
          {formatMocThoiGian(deNghi.duyetBoPhan.thoiDiem)}
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 rounded-lg border border-warning bg-warning-bg p-(--hp-md-row-pad)">
        <span className="flex items-center gap-2">
          <Clock className="size-4 shrink-0 text-warning-soft" aria-hidden />
          <span className="text-sm font-semibold text-text-primary">
            Chờ quản lý bộ phận duyệt
          </span>
        </span>
        <p className="text-xs text-text-secondary">
          Đề nghị này <strong>chưa chuyển sang Phòng Thu mua</strong>. Quản lý bộ phận đề xuất
          duyệt xong thì phiếu mới vào bảng quy trình mua hàng.
        </p>

        {quyen.duyetDeNghiBoPhan ? (
          <span className="flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={vuongMac !== null} onClick={() => setMoHop(true)}>
              <BadgeCheck className="size-4" aria-hidden />
              Duyệt đề nghị
            </Button>
            {/* 🔴 Nút mờ PHẢI kèm lý do. Nút mờ không giải thích là kiểu bí việc khó chịu
                nhất — người dùng bấm mãi không được mà chẳng biết vì sao. */}
            {vuongMac && <span className="text-xs text-warning-soft">{vuongMac}</span>}
          </span>
        ) : (
          <span className="text-xs text-text-desc">
            Bạn không có quyền duyệt đề nghị. Liên hệ quản lý bộ phận đề xuất.
          </span>
        )}
      </div>

      <HopXacNhan
        mo={moHop}
        tieuDe="Duyệt đề nghị mua hàng?"
        moTa={`Duyệt đề nghị ${deNghi.code} — ${deNghi.tieuDe}, do ${deNghi.nguoiDeNghiTen} lập.`}
        canhBao="Duyệt xong, đề nghị chuyển sang Phòng Thu mua và họ bắt đầu đi hỏi giá. Hãy soát lại danh mục vật tư và khối lượng trước khi bấm."
        nhanDongY="Duyệt đề nghị"
        onDong={() => setMoHop(false)}
        onDongY={() =>
          duyetDeNghiCuaBoPhan(deNghi.id, {
            uid: nguoiDung.uid,
            ten: nguoiDung.tenHienThi,
            chucDanh: nguoiDung.chucDanh,
          })
        }
      />
    </>
  );
}
