"use client";

// ============================================================
// NHỮNG AI ĐANG BỊ BỎ "VÀO APP" — cho danh sách "Giao việc cho ai" lọc họ ra
//
// ★ Sếp 26/09/2026: *"Nối vào ô tíck"* (giới hạn G trong `4-phan-quyen/README.md`). Danh sách giao việc
// ở `bang-phan-bo.tsx` vẫn lấy theo CHỨC DANH (`chucNang` quyết định loại việc nhận được), nhưng người
// đã bị bỏ tick "Vào app" thì không được giao việc nữa — giao cho họ là việc treo, họ không mở app ra
// nhận được.
//
// 📌 NGUỒN: `/api/quyen-rieng?biKhoa=1` — máy chủ tự tính quyền hiệu lực (chức danh + quyền riêng đã
// đối chiếu dấu) rồi trả ĐÚNG danh sách mã nghiệp vụ người bị khoá, không trả quyền của ai.
//
// ⚠️ LỖI ĐỌC → KHÔNG LỌC AI RA (fail-open) + báo một lần. Cân nhắc có chủ đích: lọc sai theo hướng này
// chỉ làm một việc được giao cho người không mở app được — thấy ngay, giao lại được. Còn chặn cả danh
// sách mỗi khi cửa này trục trặc là cả phòng không giao được việc nào. Đây là chọn lựa của phiên nghiệp
// vụ, KHÁC với lúc tải trang (ở đó lỗi = không cho vào app, vì lỗi theo hướng kia là lộ quyền).
// ============================================================

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CHE_DO_XAC_THUC } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import { docNguoiKhongVaoApp } from "@/4-phan-quyen/quyen-rieng-ket-noi";

/** Giữ kết quả 60 giây — nhiều bảng phân bổ trên cùng trang không gọi máy chủ nhiều lần. */
const HAN_BO_NHO_MS = 60_000;

let boNho: {
  luc: number;
  hua: Promise<{ khongVaoApp: string[] } | { loi: string }>;
} | null = null;
let daBaoLoi = false;

const RONG: ReadonlySet<string> = new Set();

function docCoBoNho() {
  const bayGio = Date.now();
  if (!boNho || bayGio - boNho.luc > HAN_BO_NHO_MS) {
    boNho = { luc: bayGio, hua: docNguoiKhongVaoApp() };
  }
  return boNho.hua;
}

/** Bỏ bộ nhớ — màn Phân quyền gọi ngay sau khi lưu, để bảng giao việc thấy thay đổi không phải chờ. */
export function lamMoiNguoiKhongVaoApp(): void {
  boNho = null;
}

/**
 * @param batDoc Chỉ đọc khi người đang xem THẬT SỰ giao việc được (`quyen.phanBoCongViec`) — người chỉ
 *               xem bảng phân bổ không cần, và máy chủ cũng không cho họ đọc.
 * @returns `khongVaoApp` — tập MÃ NGHIỆP VỤ (`NguoiDung.uid`) đang bị bỏ "Vào app". Đang tải / lỗi / chế
 *          độ tài khoản mẫu → tập rỗng (không lọc ai). `loi` để nơi cần có thể hiện thêm.
 */
export function useNguoiKhongVaoApp(batDoc: boolean): {
  khongVaoApp: ReadonlySet<string>;
  loi: string | null;
} {
  const [kq, setKq] = useState<{ ds: ReadonlySet<string>; loi: string | null }>({
    ds: RONG,
    loi: null,
  });

  useEffect(() => {
    if (!batDoc || CHE_DO_XAC_THUC !== "sso") return;
    let conSong = true;
    void docCoBoNho().then((r) => {
      if (!conSong) return;
      if ("loi" in r) {
        boNho = null; // lần mở sau thử lại, không giữ lỗi 60 giây
        if (!daBaoLoi) {
          daBaoLoi = true;
          toast.warning("Chưa kiểm được ai đang bị khoá khỏi app", {
            description: `Danh sách giao việc đang hiện đủ theo chức danh — có thể có người đã bị bỏ "Vào app". (${r.loi})`,
            duration: 10000,
          });
        }
        setKq({ ds: RONG, loi: r.loi });
        return;
      }
      setKq({ ds: new Set(r.khongVaoApp), loi: null });
    });
    return () => {
      conSong = false;
    };
  }, [batDoc]);

  return { khongVaoApp: kq.ds, loi: kq.loi };
}
