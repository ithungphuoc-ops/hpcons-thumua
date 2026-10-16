import { NextRequest, NextResponse } from "next/server";
import { chuyenTiepSangEqui } from "../_trung-chuyen";

// Route máy chủ cho PO ĐỘC LẬP của kho EQUI — Liên kết mua hàng EQUI (Sếp duyệt 15/10/2026). Bản EQUI
// của `app/api/qlk-ctr/gui-po-doc-lap/route.ts`, chỉ khác đích. Gọi từ `5-ket-noi/gui-po-equi.ts` →
// `guiPOSangEquiDocLap`. Giữ khoá `EQUI_API_KEY` — KHÔNG BAO GIỜ đưa xuống trình duyệt.
//
//   POST /api/equi/gui-po-doc-lap  →  POST {EQUI_API_URL}/api/app-mua-hang/po-doc-lap
//
// 📌 Chốt quyền: y như bản gốc (không chốt đăng nhập ở route). Không throw ra ngoài.
export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body gửi lên không phải JSON hợp lệ." }, { status: 400 });
  }
  return chuyenTiepSangEqui("/api/app-mua-hang/po-doc-lap", payload);
}
