import { after, NextRequest, NextResponse } from "next/server";
import { verifyClientIdToken } from "@/5-ket-noi/hpcore-may-chu";
import {
  daBatThongBaoAppTong,
  guiCacTin,
  laNguoiDungThuMua,
  timTinCanGui,
} from "@/5-ket-noi/thong-bao-app-tong-may-chu";
import * as PQ from "@/5-ket-noi/phan-quyen-may-chu";
import { docMaTin, GioiHanTanSuat } from "@/2-quy-trinh/thong-bao-app-tong";

// ============================================================
// POST /api/thong-bao/day — ĐẨY TIN CHUÔNG VỪA TẠO SANG CHUÔNG APP TỔNG (Sếp duyệt demo 08/10/2026)
//
// Trình duyệt gọi NGAY SAU khi lần lưu chứa tin mới đã lên kho chung (`kho-du-lieu.tsx`, nhánh ghi
// thành công). Thân chỉ có `{ ids: string[] }` (≤ 20) — máy chủ đọc lại tin từ tài liệu chung, nên trình
// duyệt KHÔNG chèn được nội dung hay người nhận.
//
// Thứ tự: nguồn + JSON → vé đăng nhập → công tắc → là người dùng Thu mua được vào app (danh bạ quyền,
// đệm 5 phút) → giới hạn 10 lần/phút/người → PHA 1 (chỉ đọc khối `thongBao`) trả lời `timThay` để trình
// duyệt biết mã nào chưa lên tới nơi → PHA 2 (người nhận + gửi) chạy trong `after()`.
//
// 🔴 KHÔNG GHI GÌ vào dữ liệu nghiệp vụ. Gửi hỏng chỉ ghi log.
// 📌 Vé: `verifyClientIdToken` (tệp vùng cấm `hpcore-may-chu.ts`) KHÔNG kiểm thu hồi (`checkRevoked`) —
//    không sửa được ở đây; người bị khoá app vẫn bị chặn nhờ bước kiểm danh bạ quyền.
// Công tắc: thiếu / sai khuôn `NOTIFY_INGEST_KEY` → trả 200 `{ ok: true, tat: true }`, không đọc gì.
// ============================================================

/** Vercel: cho `after()` đủ thời gian (đợt gửi tự dừng nhận việc mới sau 20s). */
export const maxDuration = 30;

const gioiHan = new GioiHanTanSuat(10, 60_000);

function layIdToken(req: NextRequest): string | undefined {
  return (req.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i)?.[1];
}

/** Chỉ nhận gọi từ chính trang app (Origin cùng host). Không có Origin (công cụ máy chủ) → vẫn cần vé đăng nhập. */
function cungNguon(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].trim();
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!cungNguon(req)) return NextResponse.json({ ok: false, loi: "SAI_NGUON" }, { status: 403 });
  if (!(req.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) {
    return NextResponse.json({ ok: false, loi: "CAN_JSON" }, { status: 415 });
  }

  const nguoiGoi = await verifyClientIdToken(layIdToken(req));
  if (!nguoiGoi) return NextResponse.json({ ok: false, loi: "CHUA_DANG_NHAP" }, { status: 401 });

  if (!daBatThongBaoAppTong()) return NextResponse.json({ ok: true, tat: true });

  if (!gioiHan.choPhep(nguoiGoi.uid)) {
    return NextResponse.json({ ok: false, loi: "QUA_NHIEU" }, { status: 429 });
  }

  let than: unknown;
  try {
    than = await req.json();
  } catch {
    return NextResponse.json({ ok: false, loi: "THAN_KHONG_HOP_LE" }, { status: 400 });
  }
  const ids = docMaTin(than);
  if (!ids) return NextResponse.json({ ok: false, loi: "MA_KHONG_HOP_LE" }, { status: 400 });

  if (!(await laNguoiDungThuMua(nguoiGoi.uid, PQ))) {
    return NextResponse.json({ ok: false, loi: "KHONG_PHAI_NGUOI_DUNG_THU_MUA" }, { status: 403 });
  }

  let timThay: string[];
  let canGui: Awaited<ReturnType<typeof timTinCanGui>>["canGui"];
  try {
    ({ timThay, canGui } = await timTinCanGui(ids));
  } catch (e) {
    console.warn("[thong-bao-app-tong] pha 1 lỗi:", e instanceof Error ? e.message : e, `người gọi=${nguoiGoi.uid}`);
    return NextResponse.json({ ok: false, loi: "LOI_MAY_CHU" }, { status: 503 });
  }

  if (canGui.length > 0) after(() => guiCacTin(canGui, nguoiGoi.uid, PQ));
  return NextResponse.json({ ok: true, timThay }, { status: 202 });
}
