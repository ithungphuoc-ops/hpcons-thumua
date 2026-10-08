import { after, NextRequest, NextResponse } from "next/server";
import { verifyClientIdToken } from "@/5-ket-noi/hpcore-may-chu";
import { daBatThongBaoAppTong, guiTinTheoMa } from "@/5-ket-noi/thong-bao-app-tong-may-chu";
import * as PQ from "@/5-ket-noi/phan-quyen-may-chu";
import { docMaTin, GioiHanTanSuat } from "@/2-quy-trinh/thong-bao-app-tong";

// ============================================================
// POST /api/thong-bao/day — ĐẨY TIN CHUÔNG VỪA TẠO SANG CHUÔNG APP TỔNG (Sếp duyệt demo 08/10/2026)
//
// Trình duyệt gọi NGAY SAU khi lần lưu chứa tin mới đã lên kho chung (`kho-du-lieu.tsx`, nhánh ghi
// thành công). Thân chỉ có `{ ids: string[] }` (≤ 20) — máy chủ đọc lại tin từ tài liệu chung, nên trình
// duyệt KHÔNG chèn được nội dung hay người nhận.
//
// 🔴 KHÔNG GHI GÌ vào dữ liệu nghiệp vụ. Việc gửi chạy trong `after()` — trả lời ngay 202, gửi hỏng chỉ ghi log.
// 🔴 Chống vòng lặp: trình duyệt chỉ gọi cho tin CHÍNH MÌNH vừa tạo (không bao giờ cho tin nhận qua
// onSnapshot); ở đây thêm giới hạn tần suất theo người + tối đa 20 mã + chỉ tin tạo trong 15 phút gần nhất.
//
// Công tắc: thiếu `NOTIFY_INGEST_KEY` → trả 200 `{ ok: true, tat: true }`, không đọc gì.
// ============================================================

const gioiHan = new GioiHanTanSuat(30, 60_000);

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

  after(() => guiTinTheoMa(ids, nguoiGoi.uid, PQ));
  return NextResponse.json({ ok: true }, { status: 202 });
}
