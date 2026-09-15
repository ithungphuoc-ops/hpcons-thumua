import { NextRequest, NextResponse } from "next/server";
import { chuyenTiepSangQlkCtr } from "../_trung-chuyen";

// Route máy chủ MỚI (Việc 2, 20/08/2026) — cầu nối duy nhất giữa trình duyệt Thu mua và QLK CTR.
// PO được lập ở tầng trình duyệt (`kho-du-lieu.tsx` → `themDonHang`), gọi vào route này NGAY
// sau khi lưu PO thành công (xem `5-ket-noi/gui-po-qlk-ctr.ts`). Route này giữ khóa
// `QLKCTR_API_KEY` — khóa đó KHÔNG BAO GIỜ được đưa xuống trình duyệt.
//
//   POST /api/qlk-ctr/gui-po
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
  return chuyenTiepSangQlkCtr("/api/app-mua-hang/po-moi", payload);
}
