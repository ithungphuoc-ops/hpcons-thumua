import { NextRequest, NextResponse } from "next/server";
import { chuyenTiepSangQlkCtr } from "../_trung-chuyen";

// Route máy chủ cho PO ĐỘC LẬP (30/08/2026) — bản sao `../gui-po/route.ts`, chỉ khác URL forward
// (khớp theo công trình bên QLK CTR, không cần đề nghị gốc). Xem `5-ket-noi/gui-po-qlk-ctr.ts`
// (`guiPOSangQlkCtrDocLap`) và `app/api/app-mua-hang/po-doc-lap` bên QLK CTR. Route này giữ khóa
// `QLKCTR_API_KEY` — khóa đó KHÔNG BAO GIỜ được đưa xuống trình duyệt.
//
//   POST /api/qlk-ctr/gui-po-doc-lap
//
// Không throw ra ngoài — mọi lỗi (thiếu cấu hình, mạng, HTTP lỗi) trả về { ok:false, error, loaiLoi }.
// 15/09/2026: giữ nguyên mã 4xx của Kho (lỗi vĩnh viễn), chỉ 5xx/timeout mới thành 502 — xem
// `_trung-chuyen.ts`.
export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body gửi lên không phải JSON hợp lệ." }, { status: 400 });
  }
  return chuyenTiepSangQlkCtr("/api/app-mua-hang/po-doc-lap", payload);
}
