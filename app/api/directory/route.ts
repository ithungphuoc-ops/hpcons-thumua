import { NextRequest, NextResponse } from "next/server";
import { verifyClientIdToken, fetchDanhBaCongTy } from "@/5-ket-noi/hpcore-may-chu";

function layIdToken(req: NextRequest): string | undefined {
  const header = req.headers.get("authorization") ?? "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m?.[1];
}

/**
 * Danh bạ nhân sự công ty — đọc trực tiếp từ App Tổng (project `hpcons-portal`, collection
 * `users`/`departments`), đúng mẫu đã dùng ở các app con khác (vd
 * `base-request-app/app/api/directory/route.ts`). Dùng cho màn "Phân quyền người dùng" chọn
 * người để cấp quyền — xem `1-giao-dien/trang/phan-quyen.tsx`.
 *
 * Yêu cầu ĐÃ đăng nhập Firebase (ID Token ở header) — không công khai, vì lộ ra là lộ toàn bộ
 * họ tên/email/phòng ban của công ty.
 */
export async function GET(req: NextRequest) {
  const caller = await verifyClientIdToken(layIdToken(req));
  if (!caller) {
    return NextResponse.json({ error: "CHUA_DANG_NHAP" }, { status: 401 });
  }

  try {
    const danhBa = await fetchDanhBaCongTy();
    return NextResponse.json({ danhBa });
  } catch (e) {
    console.error("[api/directory] Lỗi đọc danh bạ:", e);
    return NextResponse.json({ error: "Không đọc được danh bạ công ty." }, { status: 500 });
  }
}
