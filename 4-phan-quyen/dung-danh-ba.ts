"use client";

import { useMemo } from "react";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { maPhongBanTuTen, type MaPhongBan } from "@/3-du-lieu/danh-muc-phong-ban";
import { nhanSuDangLamViec, type NhanSu } from "@/3-du-lieu/danh-ba-nhan-su";
import type { ChucNang } from "@/4-phan-quyen/quyen";

/**
 * DANH BẠ NGƯỜI CHỌN ĐƯỢC — dựng từ TÀI KHOẢN THẬT trên máy chủ.
 *
 * 🔴 Chỉ đạo Ban lãnh đạo 12/08/2026: *"chưa cập nhật danh sách nhân sự mới"*. Ô "Người
 * theo dõi" vẫn đổ ra danh bạ mẫu (Trần Thị B, Nguyễn Văn A, Bùi Văn H…) trong khi công ty
 * đã có 8 tài khoản thật. Chọn một cái tên mẫu vào danh sách theo dõi là **chọn một người
 * không tồn tại**: họ không đăng nhập được nên không bao giờ xem được đề nghị đó.
 *
 * 📌 TRẢ VỀ ĐÚNG KIỂU `NhanSu` để mọi component đang dùng danh bạ **không phải sửa gì** —
 * chỉ đổi nguồn lấy dữ liệu. Đó cũng là lý do giữ nguyên tên các trường tiếng Anh.
 *
 * ⚠️ Khi chưa nối máy chủ (chế độ tài khoản mẫu, hoặc mất mạng) thì rơi về danh bạ tĩnh —
 * app vẫn dùng được, chỉ là danh sách cũ. Trả về mảng rỗng sẽ làm ô chọn trống trơn và
 * người dùng tưởng app hỏng.
 */

/** Đoán mã phòng ban từ chức năng nghiệp vụ — dùng khi tên phòng ban không khớp mã nào. */
function phongBanTheoChucNang(c: ChucNang): MaPhongBan {
  switch (c) {
    case "truong_bo_phan_thu_mua":
    case "nhan_vien_thu_mua":
      return "thu_mua_cung_ung";
    case "thu_kho_cong_trinh":
      return "kho";
    case "qlda":
      return "quan_ly_du_an";
    case "ke_toan":
      return "ke_toan_tai_chinh";
    case "phong_thi_cong":
    default:
      return "thi_cong";
  }
}

export function useDanhBa(): NhanSu[] {
  const { danhSachTaiKhoan, cheDoThu } = useNguoiDung();

  return useMemo(() => {
    // Chế độ tài khoản mẫu, hoặc chưa đọc được danh sách từ máy chủ → dùng danh bạ tĩnh.
    if (cheDoThu || danhSachTaiKhoan.length === 0) return nhanSuDangLamViec();

    return danhSachTaiKhoan.map((n) => ({
      uid: n.uid,
      displayName: n.tenHienThi,
      // Chưa có mã nhân viên thật từ App Tổng — để trống còn hơn bịa ra một mã trông như thật.
      employeeCode: "",
      department: maPhongBanTuTen(n.phongBan) ?? phongBanTheoChucNang(n.chucNang),
      title: n.chucDanh,
      status: "active" as const,
    }));
  }, [danhSachTaiKhoan, cheDoThu]);
}
