import { NextResponse } from "next/server";

// Phần dùng chung của hai route trung chuyển `gui-po` và `gui-po-doc-lap` sang APP EQUI — Liên kết
// mua hàng EQUI (Sếp duyệt 15/10/2026). KHUÔN Y HỆT `app/api/qlk-ctr/_trung-chuyen.ts`, chỉ khác:
//   · đọc `EQUI_API_URL` / `EQUI_API_KEY` thay cho `QLKCTR_API_URL` / `QLKCTR_API_KEY`;
//   · câu báo nói đúng tên đích.
// Hợp đồng kết nối mục 3: phản hồi + mã HTTP + `loaiLoi`/`trangThai` của App EQUI y hệt QLK CTR, nên
// cách phân loại dưới đây giữ nguyên: 4xx của App EQUI → trả nguyên 4xx + body (vĩnh viễn);
// 5xx/timeout/không phải JSON → 502 (tạm thời). `loaiLoi` lấy từ App EQUI nếu có, không thì suy từ mã.
//
// 📌 Thiếu `EQUI_API_URL` → 500 + `loaiLoi: "tam_thoi"` (y như bản gốc thiếu `QLKCTR_API_URL`): đơn
// nằm ở hàng thử lại theo bậc chờ, khai biến xong là tự gửi được, không ai phải bấm gì.
// 🔴 Khoá `EQUI_API_KEY` CHỈ nằm ở máy chủ — không bao giờ đưa xuống trình duyệt.
//
// ⚠️ Chưa tách chung với bản QLK CTR: tệp gốc thuộc phiên làm trước, đổi nó thành hàm nhận tham số là
// đụng đường đang chạy của kho thường. Hai bản ngắn và cùng khuôn — sửa một bên thì soi bên kia.

type PhanHoiKho = { ok?: boolean; error?: string; loaiLoi?: string; trangThai?: string };

export async function chuyenTiepSangEqui(duongDan: string, payload: unknown) {
  const url = process.env.EQUI_API_URL;
  if (!url) {
    return NextResponse.json(
      { ok: false, loaiLoi: "tam_thoi", error: "Chưa cấu hình EQUI_API_URL." },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}${duongDan}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.EQUI_API_KEY ? { "x-api-key": process.env.EQUI_API_KEY } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    let data: PhanHoiKho = {};
    try {
      data = (await res.json()) as PhanHoiKho;
    } catch {
      // App EQUI trả body không phải JSON (trang lỗi HTML, body rỗng khi sập) → coi là tạm thời.
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
