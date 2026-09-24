import { NextRequest, NextResponse } from "next/server";
import { verifyClientIdToken } from "@/5-ket-noi/hpcore-may-chu";
import { daCauHinhR2, xoaKhoiKho } from "@/5-ket-noi/kho-r2";

// ============================================================
// CỬA XOÁ TỆP KHỎI KHO R2 (21/09/2026)
//
// 🔴 VÌ SAO KHÔNG KÝ LINK XOÁ như lúc tải lên/đọc: link ký sẵn là chìa khoá tạm không cần
// đăng nhập — ai nhặt được link là dùng được. Với việc ĐỌC thì thiệt hại giới hạn ở một tệp
// và link hết hạn sau 5 phút. Với việc XOÁ thì mất hẳn chứng từ, không lấy lại được. Nên
// việc xoá luôn đi qua đây, mỗi lần đều kiểm vé đăng nhập tại chỗ.
// ============================================================

function layIdToken(req: NextRequest): string | undefined {
  const m = (req.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
  return m?.[1];
}

const MA_TEP_HOP_LE = /^[A-Za-z0-9_-]{1,120}$/;

/** Khớp `conHanChayThu()` trong rules — xem giải thích ở `app/api/tep/ky-link/route.ts`. */
/* 🔴 MỐC UTC, KHỚP ĐÚNG RULES (sửa 23/09/2026, CodeRabbit chỉ ra ở PR #37).
   `timestamp.date(2026, 11, 1)` bên Firestore rules là mốc UTC. Ghi `+07:00` ở đây làm route
   đóng cửa SỚM HƠN RULES 7 TIẾNG — trong 7 tiếng đó route trả 403 còn rules vẫn cho ghi, tức
   hai chốt nói hai điều khác nhau về cùng một hạn dùng. */
const HAN_DUNG = new Date("2026-11-01T00:00:00Z");

export async function POST(req: NextRequest) {
  const nguoiGoi = await verifyClientIdToken(layIdToken(req));
  if (!nguoiGoi) return NextResponse.json({ loi: "CHUA_DANG_NHAP" }, { status: 401 });
  if (Date.now() >= HAN_DUNG.getTime()) {
    return NextResponse.json({ loi: "HET_HAN_CHAY_THU" }, { status: 403 });
  }
  if (!daCauHinhR2()) return NextResponse.json({ loi: "CHUA_CAU_HINH_R2" }, { status: 503 });

  let than: { tepId?: string };
  try {
    than = await req.json();
  } catch {
    return NextResponse.json({ loi: "NOI_DUNG_KHONG_HOP_LE" }, { status: 400 });
  }
  if (!than.tepId || !MA_TEP_HOP_LE.test(than.tepId)) {
    return NextResponse.json({ loi: "MA_TEP_KHONG_HOP_LE" }, { status: 400 });
  }

  try {
    await xoaKhoiKho(than.tepId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/tep/xoa] Lỗi:", e);
    return NextResponse.json({ loi: "KHONG_XOA_DUOC" }, { status: 500 });
  }
}
