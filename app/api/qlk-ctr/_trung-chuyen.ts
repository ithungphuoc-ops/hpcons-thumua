import { NextResponse } from "next/server";

// Phần dùng chung của hai route trung chuyển `gui-po` và `gui-po-doc-lap` — 15/09/2026 (đêm), vá
// P0 chặn vòng lặp. Trước đây cả hai route đổi MỌI lỗi từ QLK CTR thành 502 và không chuyển
// `loaiLoi`, nên trình duyệt không phân biệt được "Kho hết hạn mức" (thử lại được) với "không có
// đề nghị" (thử lại vô ích) — đúng nhiên liệu của vòng lặp 13–15/09.
//
// Nay: 4xx của Kho → trả nguyên 4xx + body Kho (vĩnh viễn); 5xx/timeout/không phải JSON → 502
// (tạm thời). `loaiLoi` lấy từ Kho nếu Kho khai, không thì suy từ mã.

type PhanHoiKho = { ok?: boolean; error?: string; loaiLoi?: string; trangThai?: string };

export async function chuyenTiepSangQlkCtr(duongDan: string, payload: unknown) {
  const url = process.env.QLKCTR_API_URL;
  if (!url) {
    return NextResponse.json(
      { ok: false, loaiLoi: "tam_thoi", error: "Chưa cấu hình QLKCTR_API_URL." },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}${duongDan}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.QLKCTR_API_KEY ? { "x-api-key": process.env.QLKCTR_API_KEY } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    let data: PhanHoiKho = {};
    try {
      data = (await res.json()) as PhanHoiKho;
    } catch {
      // Kho trả body không phải JSON (trang lỗi HTML, body rỗng khi sập) → coi là tạm thời.
    }

    if (res.ok && data.ok) return NextResponse.json({ ok: true });

    const la4xx = res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429;
    const loaiLoi =
      data.loaiLoi === "vinh_vien" || data.loaiLoi === "tam_thoi" ? data.loaiLoi : la4xx ? "vinh_vien" : "tam_thoi";
    return NextResponse.json(
      { ok: false, loaiLoi, trangThai: data.trangThai, error: data.error ?? `HTTP ${res.status}` },
      { status: la4xx ? res.status : 502 },
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, loaiLoi: "tam_thoi", error: err instanceof Error ? err.message : "Lỗi không xác định." },
      { status: 502 },
    );
  }
}
