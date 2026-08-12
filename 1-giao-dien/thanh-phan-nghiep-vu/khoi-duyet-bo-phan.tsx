"use client";

import { useState } from "react";
import { BadgeCheck, Check, Clock } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { capDangCho, daDuyetBoPhan, lyDoKhongDuyetDuoc } from "@/2-quy-trinh/duyet-bo-phan";
import { formatMocThoiGian } from "@/6-tien-ich/dinh-dang";
import type { DeNghiMuaHang, MocDuyet, NguoiDuyetChiDinh } from "@/3-du-lieu/kieu-du-lieu";

/** Nhãn của hai cấp — viết một chỗ để giao diện và nhật ký gọi giống nhau. */
const NHAN_CAP: Record<1 | 2, string> = {
  1: "Trưởng phòng / Quản lý duyệt",
  2: "Tổng Giám đốc / Phó TGĐ duyệt",
};

/** Một dòng trong danh sách hai cấp: đã duyệt thì hiện ai/lúc nào, chưa thì hiện đang chờ. */
function DongCap({
  cap,
  moc,
  chiDinh,
  dangCho,
}: {
  cap: 1 | 2;
  moc?: MocDuyet;
  chiDinh?: NguoiDuyetChiDinh;
  dangCho: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
      {moc ? (
        <Check className="size-3.5 shrink-0 text-success-soft" aria-hidden />
      ) : (
        <Clock
          className={`size-3.5 shrink-0 ${dangCho ? "text-warning-soft" : "text-text-desc"}`}
          aria-hidden
        />
      )}
      {/* Trạng thái có CẢ biểu tượng và chữ, không chỉ dựa vào màu (Design System V1.1). */}
      <span className={moc ? "font-medium text-text-primary" : "text-text-secondary"}>
        Cấp {cap} · {NHAN_CAP[cap]}
      </span>
      {moc ? (
        <span className="text-text-desc">
          — {moc.ten} · {formatMocThoiGian(moc.thoiDiem)}
        </span>
      ) : (
        <span className={dangCho ? "font-medium text-warning-soft" : "text-text-desc"}>
          {/* 🔴 Hiện TÊN người được chỉ định. Chỉ ghi "đang chờ duyệt" thì người lập không
              biết phải nhắc ai — họ sẽ đi hỏi vòng quanh, đúng thứ app sinh ra để bỏ. */}
          — {dangCho ? "đang chờ" : "chờ cấp trước"}
          {chiDinh ? `: ${chiDinh.ten}` : ""}
        </span>
      )}
    </li>
  );
}

/**
 * KHỐI DUYỆT HAI CẤP CỦA BỘ PHẬN ĐỀ XUẤT.
 *
 * 🔴 Ban lãnh đạo 12/08/2026: *"Tô Trọng Hoài đề xuất → Chỉ huy trưởng duyệt → Trưởng phòng
 * duyệt mới đẩy qua cho phòng thu mua"*.
 *
 * Kể từ khi MỌI tài khoản đều lập được đề nghị, đây là khâu kiểm soát duy nhất trước khi
 * việc rơi sang Thu mua. Khối này phải trả lời đủ ba câu: **đang chờ cấp nào**, **ai duyệt
 * được**, và **cấp nào đã duyệt bởi ai lúc nào**.
 *
 * ⚠️ HIỆN CHO MỌI NGƯỜI xem được đề nghị, không riêng người duyệt. Người lập cần biết phiếu
 * mình gửi đang tắc ở cấp nào — giấu đi thì họ lại gọi điện hỏi, đúng thứ app sinh ra để bỏ.
 */
export function KhoiDuyetBoPhan({ deNghi }: { deNghi: DeNghiMuaHang }) {
  const { duyetDeNghiCuaBoPhan } = useDuLieu();
  const { nguoiDung, quyen } = useNguoiDung();
  /**
   * ⚠️ PHẢI truyền `laQuanTri` — nếu không, quản trị không duyệt thay được ở cấp 2 và phiếu
   * chỉ định một người đã nghỉ việc sẽ **kẹt vĩnh viễn**. Cả hai nơi gọi
   * `lyDoKhongDuyetDuoc` phải truyền giống nhau; lệch một chỗ là cùng một phiếu lúc duyệt
   * được lúc không, tùy vào đang đứng ở màn nào.
   */
  const quyenDuyet = { ...quyen, laQuanTri: nguoiDung.vaiTro === "admin" };

  const [moHop, setMoHop] = useState(false);

  const cap = capDangCho(deNghi);
  const vuongMac = lyDoKhongDuyetDuoc(deNghi, quyenDuyet, nguoiDung.uid);

  // Phiếu đã duyệt xong mà KHÔNG có mốc nào = nhận từ HPcore (hoặc dữ liệu cũ). Không hiện
  // gì — thêm một khối "đã duyệt" trống rỗng chỉ tổ chiếm chỗ và không nói được điều gì.
  if (daDuyetBoPhan(deNghi) && !deNghi.duyetCap1 && !deNghi.duyetCap2 && !deNghi.duyetBoPhan) {
    return null;
  }

  const daXong = cap === null;

  return (
    <>
      <div
        className={`flex flex-col gap-2 rounded-lg border p-(--hp-md-row-pad) ${
          daXong ? "border-success bg-success-bg" : "border-warning bg-warning-bg"
        }`}
      >
        <span className="flex flex-wrap items-center gap-2">
          {daXong ? (
            <BadgeCheck className="size-4 shrink-0 text-success-soft" aria-hidden />
          ) : (
            <Clock className="size-4 shrink-0 text-warning-soft" aria-hidden />
          )}
          <span className="text-sm font-semibold text-text-primary">
            {daXong ? "Đã duyệt đủ hai cấp" : `Chờ duyệt — cấp ${cap}: ${NHAN_CAP[cap]}`}
          </span>
        </span>

        {/* Bản duyệt MỘT cấp (sáng 12/08/2026) không có `duyetCap1`/`duyetCap2`. Hiện gọn
            một dòng thay vì bỏ trống, để người xem biết phiếu đã qua duyệt bằng bản cũ. */}
        {deNghi.duyetBoPhan && !deNghi.duyetCap1 ? (
          <p className="text-xs text-text-desc">
            Duyệt theo bản một cấp: {deNghi.duyetBoPhan.ten} ·{" "}
            {formatMocThoiGian(deNghi.duyetBoPhan.thoiDiem)}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            <DongCap
              cap={1}
              moc={deNghi.duyetCap1}
              chiDinh={deNghi.nguoiDuyetCap1}
              dangCho={cap === 1}
            />
            <DongCap
              cap={2}
              moc={deNghi.duyetCap2}
              chiDinh={deNghi.nguoiDuyetCap2}
              dangCho={cap === 2}
            />
          </ul>
        )}

        {!daXong && (
          <>
            <p className="text-xs text-text-secondary">
              Đề nghị này <strong>chưa chuyển sang Phòng Thu mua</strong>. Phải qua đủ cả hai
              cấp duyệt của bộ phận đề xuất.
            </p>
            <span className="flex flex-wrap items-center gap-2">
              <Button size="sm" disabled={vuongMac !== null} onClick={() => setMoHop(true)}>
                <BadgeCheck className="size-4" aria-hidden />
                Duyệt cấp {cap}
              </Button>
              {/* 🔴 Nút mờ PHẢI kèm lý do — nút mờ không giải thích là kiểu bí việc khó chịu
                  nhất, người dùng bấm mãi không được mà chẳng biết vì sao. */}
              {vuongMac && <span className="text-xs text-warning-soft">{vuongMac}</span>}
            </span>
          </>
        )}
      </div>

      <HopXacNhan
        mo={moHop}
        tieuDe={cap ? `Duyệt cấp ${cap} — ${NHAN_CAP[cap]}?` : "Duyệt đề nghị?"}
        moTa={`Đề nghị ${deNghi.code} — ${deNghi.tieuDe}, do ${deNghi.nguoiDeNghiTen} lập.`}
        canhBao={
          cap === 2
            ? "Đây là cấp duyệt cuối. Duyệt xong, đề nghị chuyển sang Phòng Thu mua và họ bắt đầu đi hỏi giá. Hãy soát lại danh mục vật tư và khối lượng trước khi bấm."
            : "Duyệt cấp 1 xong, đề nghị chuyển tiếp lên Trưởng phòng. Chưa sang Phòng Thu mua ở bước này."
        }
        nhanDongY={cap ? `Duyệt cấp ${cap}` : "Duyệt"}
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
