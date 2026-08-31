import { NextRequest, NextResponse } from "next/server";

// Route máy chủ cho PO ĐỘC LẬP (30/08/2026) — bản sao `../gui-po/route.ts`, chỉ khác URL forward
// (khớp theo công trình bên QLK CTR, không cần đề nghị gốc). Xem `5-ket-noi/gui-po-qlk-ctr.ts`
// (`guiPOSangQlkCtrDocLap`) và `app/api/app-mua-hang/po-doc-lap` bên QLK CTR. Route này giữ khóa
// `QLKCTR_API_KEY` — khóa đó KHÔNG BAO GIỜ được đưa xuống trình duyệt.
//
//   POST /api/qlk-ctr/gui-po-doc-lap
//
// Không throw ra ngoài — mọi lỗi (thiếu cấu hình, mạng, HTTP lỗi) trả về { ok:false, error }.
export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body gửi lên không phải JSON hợp lệ." }, { status: 400 });
  }

  const url = process.env.QLKCTR_API_URL;
  if (!url) {
    return NextResponse.json({ ok: false, error: "Chưa cấu hình QLKCTR_API_URL." }, { status: 500 });
  }

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/api/app-mua-hang/po-doc-lap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.QLKCTR_API_KEY ? { "x-api-key": process.env.QLKCTR_API_KEY } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      return NextResponse.json({ ok: false, error: data.error ?? `HTTP ${res.status}` }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Lỗi không xác định." },
      { status: 502 },
    );
  }
}
