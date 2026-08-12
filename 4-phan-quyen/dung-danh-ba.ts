"use client";

import { useMemo } from "react";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { nhanSuDangLamViec, type MaPhongBan, type NhanSu } from "@/3-du-lieu/danh-ba-nhan-su";
import { boDau } from "@/6-tien-ich/bo-dau";
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

/**
 * Đọc mã phòng ban từ TÊN phòng ban ghi trong hồ sơ.
 *
 * 🔴 Phải thử tên trước, đoán theo chức năng sau. Tài khoản Quản trị hệ thống có
 * `chucNang: "truong_bo_phan_thu_mua"` (vì enum chức năng không có mục IT) nhưng phòng ban
 * thật là Hành chính Nhân sự — IT. Đoán theo chức năng thì hộp chọn người theo dõi xếp họ
 * vào nhóm "Phòng Thu mua", người dùng tìm mãi không thấy.
 *
 * ⚠️ So khớp bằng chuỗi nên chỉ là phương án tạm, sẽ sai nếu ai đó gõ tên phòng khác đi.
 * Cách đúng là App Tổng trả về mã phòng ban — việc còn lại.
 */
function maPhongBanTheoTen(ten: string): MaPhongBan | null {
  const t = boDau(ten);
  if (t.includes("giam doc")) return "ban-giam-doc";
  if (t.includes("thu mua")) return "thu-mua";
  if (t.includes("thi cong")) return "thi-cong";
  if (t.includes("kho")) return "kho";
  if (t.includes("qlda") || t.includes("quan ly du an")) return "qlda";
  if (t.includes("ke toan")) return "ke-toan";
  if (t.includes("hanh chinh") || t.includes("it")) return "hanh-chinh-nhan-su";
  if (t.includes("thiet ke")) return "thiet-ke";
  if (t.includes("kinh doanh")) return "kinh-doanh";
  if (t.includes("bao tri")) return "bao-tri";
  if (t.includes("qa") || t.includes("qc")) return "qa-qc";
  return null;
}

/** Đoán mã phòng ban từ chức năng nghiệp vụ — dùng khi tên phòng ban không khớp mã nào. */
function phongBanTheoChucNang(c: ChucNang): MaPhongBan {
  switch (c) {
    case "truong_bo_phan_thu_mua":
    case "nhan_vien_thu_mua":
      return "thu-mua";
    case "thu_kho_cong_trinh":
      return "kho";
    case "qlda":
      return "qlda";
    case "ke_toan":
      return "ke-toan";
    case "phong_thi_cong":
    default:
      return "thi-cong";
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
      department: maPhongBanTheoTen(n.phongBan) ?? phongBanTheoChucNang(n.chucNang),
      title: n.chucDanh,
      status: "active" as const,
    }));
  }, [danhSachTaiKhoan, cheDoThu]);
}
