import { NextRequest, NextResponse } from "next/server";
import { chuyenTiepSangEqui } from "../_trung-chuyen";

// Route máy chủ — Liên kết mua hàng EQUI (Sếp duyệt 15/10/2026). Bản EQUI của
// `app/api/qlk-ctr/gui-po/route.ts`: cầu nối giữa trình duyệt Thu mua (kho EQUI) và App EQUI.
// Gọi từ `5-ket-noi/gui-po-equi.ts` → `guiPOSangEqui`. Giữ khoá `EQUI_API_KEY` — khoá đó KHÔNG BAO GIỜ
// được đưa xuống trình duyệt.
//
//   POST /api/equi/gui-po  →  POST {EQUI_API_URL}/api/app-mua-hang/po-moi
//
// 📌 Chốt quyền: CHÉP ĐÚNG bản gốc — bản QLK CTR không có chốt đăng nhập nào ở route (và repo không có
// `middleware.ts`), nên route này cũng không thêm chốt riêng. Không throw ra ngoài — mọi lỗi trả về
// { ok:false, error, loaiLoi }, xem `../_trung-chuyen.ts`.
export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body gửi lên không phải JSON hợp lệ." }, { status: 400 });
  }
  return chuyenTiepSangEqui("/api/app-mua-hang/po-moi", payload);
}
