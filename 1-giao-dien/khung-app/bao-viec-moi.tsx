"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDuLieu } from "@/3-du-lieu/kho-du-lieu";
import { useNguoiDung } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { thongBaoDanhChoToi } from "@/2-quy-trinh/giai-doan-mua-hang";

/**
 * 🔔 BẬT THÔNG BÁO NỔI KHI CÓ VIỆC MỚI — Ban lãnh đạo 18/08/2026: *"cài đặt thêm tính năng thông
 * báo khi có công việc mới"*.
 *
 * ---
 * ## VIỆC CỦA FILE NÀY
 * Chuông ở thanh trên đã có, nhưng chuông là thứ **phải tự nhớ mà bấm vào**. Người đang gõ dở
 * một phiếu khác thì con số đỏ bé xíu ở góc phải không kéo được mắt họ sang. File này làm phần
 * còn thiếu: việc mới tới thì **hiện hẳn một hộp nổi**, bấm vào là đi thẳng tới phiếu.
 *
 * 📌 CHỈ HIỂN THỊ, KHÔNG SINH DỮ LIỆU. Tin do `phanBoDong` / `chuyenViecDong` trong
 * `3-du-lieu/kho-du-lieu.tsx` sinh ra; ở đây chỉ đọc rồi báo. Đặt trong `khung-app/` vì nó thuộc
 * khung chung của app, không thuộc màn hình nào.
 *
 * ## VÌ SAO CHẠY ĐƯỢC LIÊN MÁY
 * Cả phòng dùng chung một document Firestore (`chay-thu/du-lieu-chung`), nên trưởng bộ phận bấm
 * giao việc ở máy này thì `onSnapshot` đẩy dữ liệu mới sang máy nhân viên, mảng `thongBao` của họ
 * dài ra, hiệu ứng dưới đây thấy id mới và bật hộp nổi. **Không cần thêm hạ tầng gì.**
 *
 * ## 🔴 BỐN CHỐT PHẢI GIỮ
 *
 * 1. **KHÔNG báo những tin đã có sẵn lúc mở app.** Vào app mà bị năm hộp nổi đập vào mặt là
 *    người dùng học cách tắt ngay không đọc. Lần chạy đầu chỉ GHI NHỚ danh sách id đang có; từ
 *    lần sau mới báo id lạ. Đó là việc của `daNapLanDau`.
 *
 * 2. **Nhớ id ĐÃ BÁO, không so theo số lượng.** So `length` là sai: tin cũ bị đẩy khỏi danh sách
 *    (giữ tối đa 30) làm số lượng đứng yên trong khi vẫn có tin mới, hoặc ngược lại xóa một
 *    phiếu làm số lượng tụt rồi tin kế tiếp bị báo hai lần.
 *
 * 3. **Chỉ báo tin CỦA MÌNH**, dùng đúng `thongBaoDanhChoToi` — cùng một luật với chuông, không
 *    chép lại điều kiện. Chép ra hai bản là sớm muộn chuông và hộp nổi nói khác nhau.
 *
 * 4. **Chỉ báo tin CHƯA ĐỌC.** Dữ liệu chung đồng bộ hai chiều: đọc ở máy A thì `daDoc` đổi và
 *    máy B nhận bản mới — không lọc `daDoc` thì mỗi lần đồng bộ lại bật hộp cho tin đã xem.
 *
 * ## ⚠️ GIỚI HẠN PHẢI NÓI THẬT
 * Hộp nổi chỉ hiện **khi app đang mở trên trình duyệt**. Người tắt app thì không nhận được gì
 * lúc đó; họ thấy con số đỏ trên chuông ở lần mở app kế tiếp. Muốn hiện cả khi app đóng thì phải
 * dùng thông báo của hệ điều hành (`Notification` API) — cần người dùng bấm đồng ý cấp quyền một
 * lần, và nếu họ bấm "Chặn" thì không xin lại được. Đó là một quyết định nên hỏi Ban lãnh đạo
 * trước, nên **chưa làm** ở đây.
 */
export function BaoViecMoi() {
  const router = useRouter();
  const { thongBao } = useDuLieu();
  const { quyen, nguoiDung } = useNguoiDung();

  /** Những id đã bật hộp nổi rồi — xem chốt số 2 ở khối chú thích trên. */
  const daBao = useRef<Set<string>>(new Set());
  const daNapLanDau = useRef(false);

  /**
   * Giữ `router` qua ref: để nó trong danh sách phụ thuộc thì mỗi lần điều hướng là hiệu ứng
   * chạy lại. Hiệu ứng này chỉ nên phản ứng với dữ liệu thông báo.
   */
  const dieuHuong = useRef(router);
  useEffect(() => {
    dieuHuong.current = router;
  }, [router]);

  useEffect(() => {
    const cuaToi = thongBao.filter(
      (t) =>
        t.laViecMoi &&
        !t.daDoc &&
        thongBaoDanhChoToi(t.guiToi, nguoiDung.tenHienThi, quyen.phanBoCongViec),
    );

    // Lần đầu: chỉ ghi nhớ, không báo (chốt số 1).
    if (!daNapLanDau.current) {
      daNapLanDau.current = true;
      for (const t of cuaToi) daBao.current.add(t.id);
      return;
    }

    for (const t of cuaToi) {
      if (daBao.current.has(t.id)) continue;
      daBao.current.add(t.id);

      toast.success(`Bạn có việc mới: ${t.prCode}`, {
        description: [
          `${t.soDongViec ?? ""} dòng vật tư · ${t.tieuDe}`,
          t.loiNhan ? `“${t.loiNhan}”` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        /* Để lâu hơn mặc định: đây là việc được giao, không phải xác nhận một cú bấm. Nhưng
           KHÔNG để vô hạn — hộp nổi đứng mãi thì che nội dung và thành thứ phải đi dọn. */
        duration: 10000,
        action: {
          label: "Mở phiếu",
          onClick: () => dieuHuong.current.push(`/de-nghi/${t.prId}`),
        },
      });
    }
  }, [thongBao, nguoiDung.tenHienThi, quyen.phanBoCongViec]);

  // Không vẽ gì — chỉ nghe dữ liệu rồi gọi hộp nổi dùng chung ở `app/layout.tsx`.
  return null;
}
