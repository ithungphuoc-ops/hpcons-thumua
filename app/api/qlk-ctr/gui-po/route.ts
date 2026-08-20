import { NextRequest, NextResponse } from "next/server";

// Route máy chủ MỚI (Việc 2, 20/08/2026) — cầu nối duy nhất giữa trình duyệt Thu mua và QLK CTR.
// PO được lập ở tầng trình duyệt (`kho-du-lieu.tsx` → `themDonHang`), gọi vào route này NGAY
// sau khi lưu PO thành công (xem `5-ket-noi/gui-po-qlk-ctr.ts`). Route này giữ khóa
// `QLKCTR_API_KEY` — khóa đó KHÔNG BAO GIỜ được đưa xuống trình duyệt.
//
//   POST /api/qlk-ctr/gui-po
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
    const res = await fetch(`${url.replace(/\/$/, "")}/api/app-mua-hang/po-moi`, {
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
