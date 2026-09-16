"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";

/**
 * ★★ KHỐI "XOÁ TOÀN BỘ DỮ LIỆU CHẠY THỬ" — dời từ menu tài khoản sang trang Cài đặt quy trình.
 *
 * Sếp 16/09/2026, khoanh đỏ mục *"Xóa toàn bộ dữ liệu của cả phòng"* đang nằm trong menu tài
 * khoản: ***"Ẩn nút này ở mục này, đưa vào mục cài đặt quy trình. Và chức năng này chỉ hiện ở
 * tài khoản cấp quản trị"***.
 *
 * 🔴 VÌ SAO CHỖ CŨ NGUY: menu tài khoản là chỗ người ta bấm hàng ngày để **Đăng xuất**, và mục
 * xoá nằm ngay dưới *Đăng xuất* — hai mục sát nhau, một mục vô hại và một mục xoá sạch dữ liệu
 * cả phòng không khôi phục được. Bấm trượt một dòng là mất hết. Trang Cài đặt quy trình thì
 * người dùng phải chủ ý vào, và không có thao tác hàng ngày nào ở đó.
 *
 * 🔴 GÁC BẰNG `quyen.xoaToanBoDuLieu` (chỉ `admin`), KHÔNG dùng lại cờ của trang chứa nó. Trang
 * Cài đặt quy trình mở cho `suaPODaChot` — tức **Trưởng bộ phận cấp 3 cũng vào được**. Nếu khối
 * này không tự gác thì việc "chỉ hiện ở tài khoản cấp quản trị" **không thành**, mà lại trông
 * như đã làm xong. Xem chú thích đầy đủ ở khai báo cờ trong `4-phan-quyen/quyen.ts`.
 *
 * ⚠️ TỰ TRẢ `null` KHI KHÔNG ĐỦ QUYỀN, không bắt nơi gọi tự hỏi. Nơi gọi tự kiểm là kiểu hở đã
 * phải sửa nhiều lần trong dự án này: thêm đường vào thứ hai mà quên chép điều kiện.
 *
 * 📌 KHÔNG ĐỔI MỘT CHỮ trong hộp xác nhận — nhãn và câu cảnh báo là chỉ đạo Ban lãnh đạo
 * 20/08/2026 (nhãn cũ *"Xóa dữ liệu chạy thử"* làm người dùng tưởng là nút dọn dữ liệu mẫu vô
 * hại). Lượt này chỉ đổi CHỖ ĐẶT và AI THẤY, không đổi lời cảnh báo.
 */
export function KhoiXoaDuLieuChayThu() {
  const { deNghi, xoaDuLieuChayThu, trangThaiKhoChung } = useDuLieu();
  const { quyen } = useNguoiDung();
  const [hoiXoa, doiHoiXoa] = useState(false);

  if (!quyen.xoaToanBoDuLieu) return null;

  const dungChung = trangThaiKhoChung === "chung";

  return (
    <>
      {/* Viền danh nguy hiểm + tiêu đề nói thẳng — V1.1 buộc trạng thái có CẢ màu lẫn chữ, nên
          không dựa vào riêng màu đỏ để báo đây là vùng nguy hiểm. */}
      <Card className="border-danger/40">
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-danger-soft">Vùng nguy hiểm</h2>
            <p className="text-sm text-text-secondary">
              {dungChung
                ? "Xóa mọi đề nghị, báo giá, đơn đặt hàng và phiếu nhận hàng khỏi kho dữ liệu chung. Cả phòng cùng mất, không khôi phục lại được."
                : "Xóa mọi đề nghị, báo giá, đơn đặt hàng và phiếu nhận hàng đã nhập trên máy này. Không khôi phục lại được."}
            </p>
            <p className="text-sm text-text-desc">
              Đang có {deNghi.length} đề nghị mua hàng.
            </p>
          </div>
          <div>
            <Button variant="destructive" size="sm" onClick={() => doiHoiXoa(true)}>
              <Trash2 className="size-4 shrink-0" aria-hidden />
              Xóa toàn bộ dữ liệu {dungChung ? "của cả phòng" : "trên máy này"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 🔴 Từ 12/08/2026 dữ liệu để trên máy chủ dùng chung, nên lời cảnh báo phải nói
          đúng phạm vi: xóa là MỌI NGƯỜI cùng mất, không phải "trên máy này" như trước. */}
      <HopXacNhan
        mo={hoiXoa}
        tieuDe="Xóa toàn bộ dữ liệu chạy thử?"
        moTa={
          dungChung
            ? "Xóa mọi đề nghị, báo giá, đơn đặt hàng và phiếu nhận hàng khỏi kho dữ liệu chung."
            : "Xóa mọi đề nghị, báo giá, đơn đặt hàng và phiếu nhận hàng đã nhập trên máy này."
        }
        canhBao={
          dungChung
            ? `Đang có ${deNghi.length} đề nghị mua hàng. ⚠️ Cả phòng đang dùng chung kho dữ liệu này — xóa xong thì MỌI NGƯỜI đều mất, không riêng máy của bạn. Không khôi phục lại được.`
            : `Đang có ${deNghi.length} đề nghị mua hàng. Không khôi phục lại được — app sẽ về trạng thái trống như lần mở đầu tiên.`
        }
        nhanDongY="Xóa hết"
        nguyHiem
        onDong={() => doiHoiXoa(false)}
        onDongY={xoaDuLieuChayThu}
      />
    </>
  );
}
