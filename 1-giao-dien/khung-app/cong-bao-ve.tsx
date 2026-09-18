"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { ManDangNhap } from "@/1-giao-dien/khung-app/man-dang-nhap";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { duocVaoDuongDan } from "@/4-phan-quyen/quyen";

/**
 * CỔNG BẢO VỆ — chưa đăng nhập thì không thấy gì trong app.
 *
 * Bọc NGOÀI `AppShell` (xem `app/(app)/layout.tsx`) chứ không bọc trong: nếu bọc trong
 * thì thanh bên và thanh trên vẫn hiện ra sau lưng màn đăng nhập, để lộ danh sách chức
 * năng và tên người dùng.
 *
 * ⚠️ Đây là chặn Ở GIAO DIỆN. Trang được sinh sẵn dạng tĩnh nên mã HTML/JS vẫn tải về
 * máy người dùng — chặn thật phải nằm ở tầng dữ liệu (Firestore Security Rules).
 * Xem `5-ket-noi/firestore.rules` và ghi chú ở `4-phan-quyen/nguoi-dung-hien-tai.tsx`.
 */
/**
 * Trang app mở ra đầu tiên (`app/page.tsx` chuyển thẳng tới đây). Người ngoài phòng Thu mua
 * không vào được màn này kể từ 18/09/2026 — xem `duocVaoDuongDan`.
 */
const TRANG_MAC_DINH = "/tong-quan";
/** Màn mở cho mọi vai trò — chỗ đáp an toàn khi trang mặc định bị chặn. */
const TRANG_THAY_THE = "/theo-doi";

export function CongBaoVe({ children }: { children: ReactNode }) {
  const { daDangNhap, quyen } = useNguoiDung();
  const duongDan = usePathname();
  const router = useRouter();

  /**
   * ★★ ĐƯA NGƯỜI NGOÀI PHÒNG THU MUA VỀ MÀN HỌ XEM ĐƯỢC — Sếp 18/09/2026 siết menu còn mỗi
   * *"Theo dõi đề nghị"* cho các phòng ban khác.
   *
   * 🔴 VÌ SAO CẦN: `app/page.tsx` chuyển thẳng mọi người vào `/tong-quan`, nên sau khi siết
   * quyền thì người ngoài phòng Thu mua **mở app lên là gặp ngay màn "Bạn không có quyền"** —
   * trông như tài khoản hỏng, dù họ vẫn có việc xem tiến độ ở "Theo dõi đề nghị".
   *
   * ⚠️ CHỈ tự chuyển cho ĐÚNG trang mặc định. Người gõ thẳng `/lich` mà bị chặn thì vẫn phải
   * thấy câu từ chối — im lặng đưa họ đi nơi khác là giấu mất việc app vừa chặn một thao tác.
   */
  const bịChanTrangMacDinh =
    daDangNhap === true && duongDan === TRANG_MAC_DINH && !duocVaoDuongDan(duongDan, quyen);
  useEffect(() => {
    if (bịChanTrangMacDinh) router.replace(TRANG_THAY_THE);
  }, [bịChanTrangMacDinh, router]);

  // `null` = chưa đọc xong phiên cũ trong localStorage. Hiện khoảng trắng một nhịp,
  // KHÔNG hiện màn đăng nhập — nếu không thì người đã đăng nhập sẽ thấy nó chớp lên
  // rồi biến mất mỗi lần tải trang, trông như bị đăng xuất.
  if (daDangNhap === null) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }

  if (!daDangNhap) return <ManDangNhap />;

  /**
   * ★ CHẶN THEO TRANG — Ban lãnh đạo 16/08/2026: thủ kho và các phòng ban khác không được vào
   * màn "Quy trình mua hàng".
   *
   * 🔴 ẨN MỤC MENU KHÔNG PHẢI LÀ CHẶN. Địa chỉ `/de-nghi` gõ thẳng vào thanh địa chỉ vẫn vào
   * được, và người từng có quyền còn nguyên trong lịch sử trình duyệt. Đặt ở đây — nơi bọc
   * ngoài MỌI trang — thì mọi đường vào đều bị chặn như nhau.
   *
   * ⚠️ Đây vẫn là chặn Ở GIAO DIỆN, giống cảnh báo ở đầu file: trang sinh sẵn dạng tĩnh nên mã
   * vẫn tải về máy. Chặn thật nằm ở Firestore Security Rules.
   *
   * 📌 Luật ở `4-phan-quyen/quyen.ts` → `duocVaoDuongDan`, MỘT CHỖ DUY NHẤT — hàm đó trước đây
   * viết ra rồi không ai gọi, nên luật chặn nằm im trong khi màn hình vẫn mở.
   */
  /* Đang chuyển sang màn thay thế — hiện khoảng trắng một nhịp thay vì chớp câu từ chối. */
  if (bịChanTrangMacDinh) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }

  if (duongDan && !duocVaoDuongDan(duongDan, quyen)) {
    return (
      <div className="min-h-screen bg-background p-(--hp-md-section)">
        <EmptyState
          icon={Lock}
          title="Bạn không có quyền vào mục này"
          description="Tài khoản của bạn không được mở màn hình này. Theo dõi tiến độ hồ sơ ở mục “Theo dõi đề nghị”."
        />
      </div>
    );
  }

  return <>{children}</>;
}
