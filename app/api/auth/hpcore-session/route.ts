import { NextRequest, NextResponse } from "next/server";
import { verifyHpcore, fetchVaiTroToanCuc, mintCustomToken, SSO_COOKIE_NAME } from "@/5-ket-noi/hpcore-may-chu";

function parseCookie(req: NextRequest, name: string): string | undefined {
  const header = req.headers.get("cookie") ?? "";
  return header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

/**
 * Cầu nối SSO: verify phiên App Tổng (account.hpcore.vn) → cấp Custom Token cho CHÍNH
 * project `hpcons-portal` (app này dùng chung project, không cần bắc cầu sang project
 * khác) → trả kèm vai trò toàn cục để client quyết định "owner toàn quyền hay không".
 *
 * Client sau đó tự `signInWithCustomToken()` rồi đọc `nguoi-dung/{uid}` như cũ.
 */
export async function GET(req: NextRequest) {
  const cookie = parseCookie(req, SSO_COOKIE_NAME);
  const identity = await verifyHpcore(cookie);
  if (!identity) {
    return NextResponse.json({ error: "NO_HPCORE_SESSION" }, { status: 401 });
  }

  try {
    const [vaiTroToanCuc, token] = await Promise.all([
      fetchVaiTroToanCuc(identity.uid),
      mintCustomToken(identity.uid),
    ]);
    return NextResponse.json({
      token,
      email: identity.email,
      tenHienThi: identity.fullName || identity.email,
      vaiTroToanCuc,
    });
  } catch (e) {
    console.error("[hpcore-session] Lỗi cấp Custom Token:", e);
    return NextResponse.json(
      { error: "ADMIN_SDK_NOT_CONFIGURED", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
