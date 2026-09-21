import { NextRequest, NextResponse } from "next/server";
import { verifyClientIdToken } from "@/5-ket-noi/hpcore-may-chu";
import { daCauHinhR2, kyLinkTaiLen, kyLinkDoc, coTepTrongKho } from "@/5-ket-noi/kho-r2";

// ============================================================
// CỬA CẤP LINK CHO TỆP ĐÍNH KÈM TRÊN R2 (21/09/2026)
//
// 🔴 VÌ SAO KHÔNG ĐẨY TỆP QUA ĐÂY: Vercel chặn 4,5 MB mỗi lần gọi Route Handler. Tệp đính
// kèm của hồ sơ mua hàng (bản scan hợp đồng, hoá đơn) thường vượt xa con số đó. Nên route
// này CHỈ cấp link ký sẵn, còn trình duyệt tự PUT thẳng lên R2 — đúng cách app Đề xuất đã
// chuyển sang ngày 13/09/2026 sau khi vấp đúng trần này.
//
// 🔴 PHẢI ĐĂNG NHẬP. Link ký sẵn là chìa khoá tạm: ai cầm được link là đọc/ghi được đúng tệp
// đó mà không cần đăng nhập nữa. Nên chỗ duy nhất kiểm quyền là ngay tại đây, trước khi ký.
// Link hết hạn sau 5 phút để rơi vào tay người khác cũng vô dụng.
// ============================================================

function layIdToken(req: NextRequest): string | undefined {
  const m = (req.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
  return m?.[1];
}

/** Mã tệp do giao diện sinh (`tep-<mốc thời gian>-<số ngẫu nhiên>`). Chặn ký tự lạ để không
 *  ai lách sang đường dẫn khác trong kho bằng `../`. */
const MA_TEP_HOP_LE = /^[A-Za-z0-9_-]{1,120}$/;

/**
 * Hạn dùng — phải KHỚP với `conHanChayThu()` trong `5-ket-noi/firestore-gop-tach.rules`.
 *
 * 🔴 Luật Firestore cho `tep/{tepId}` đòi `conHanChayThu() && duocVao()`. Khi ruột tệp chuyển
 * sang R2 thì luật đó KHÔNG còn chắn nữa — chắn duy nhất là route này. Thiếu dòng kiểm hạn ở
 * đây là lặng lẽ nới lỏng bảo mật so với cách cũ, mà không ai thấy.
 *
 * ⚠️ ĐỔI NGÀY Ở ĐÂY THÌ PHẢI ĐỔI CẢ TRONG RULES, và ngược lại.
 */
const HAN_DUNG = new Date("2026-11-01T00:00:00+07:00");

export async function POST(req: NextRequest) {
  const nguoiGoi = await verifyClientIdToken(layIdToken(req));
  if (!nguoiGoi) return NextResponse.json({ loi: "CHUA_DANG_NHAP" }, { status: 401 });

  if (Date.now() >= HAN_DUNG.getTime()) {
    return NextResponse.json({ loi: "HET_HAN_CHAY_THU" }, { status: 403 });
  }

  if (!daCauHinhR2()) {
    return NextResponse.json({ loi: "CHUA_CAU_HINH_R2" }, { status: 503 });
  }

  let than: { viec?: string; tepId?: string; kieuMime?: string };
  try {
    than = await req.json();
  } catch {
    return NextResponse.json({ loi: "NOI_DUNG_KHONG_HOP_LE" }, { status: 400 });
  }

  const { viec, tepId, kieuMime } = than;
  if (!tepId || !MA_TEP_HOP_LE.test(tepId)) {
    return NextResponse.json({ loi: "MA_TEP_KHONG_HOP_LE" }, { status: 400 });
  }

  try {
    if (viec === "tai-len") {
      const link = await kyLinkTaiLen(tepId, kieuMime || "application/octet-stream");
      return NextResponse.json({ link });
    }
    if (viec === "doc") {
      const link = await kyLinkDoc(tepId);
      return NextResponse.json({ link });
    }
    /* Xác nhận tệp đã lên thật — trình duyệt gọi sau khi PUT xong. Không có bước này thì mọi
       thứ dựa vào lời khai của trình duyệt: mạng đứt giữa chừng là ghi nhận "đã lưu" cho một
       tệp rỗng. Đúng kiểu lỗi "báo thành công trong khi thực tế không có gì" đã gặp ở đường
       Đề xuất → Kho hồi 13–17/09/2026. */
    if (viec === "xac-nhan") {
      const co = await coTepTrongKho(tepId);
      return NextResponse.json({ coTrongKho: co !== null, coTep: co });
    }
    return NextResponse.json({ loi: "VIEC_KHONG_HOP_LE" }, { status: 400 });
  } catch (e) {
    console.error("[api/tep/ky-link] Lỗi:", e);
    return NextResponse.json({ loi: "KHONG_KY_DUOC_LINK" }, { status: 500 });
  }
}
