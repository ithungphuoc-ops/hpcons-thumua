import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { VaiTroToanCucAppTong } from "@/4-phan-quyen/quyen";

// ============================================================
// CẦU NỐI SSO VỚI APP TỔNG (account.hpcore.vn) — PHÍA MÁY CHỦ
//
// 🔴 Chỉ đạo Ban lãnh đạo 20/08/2026: bỏ đăng nhập email/mật khẩu riêng của app này,
// dùng thẳng phiên đăng nhập App Tổng — đúng mẫu đã áp dụng cho các app con khác trong
// hệ sinh thái (Đấu Thầu, Booking, Cuộc Họp...).
//
// 📌 KHÁC VỚI CÁC APP CON RIÊNG PROJECT: app Thu mua dùng CHUNG project Firebase
// `hpcons-portal` với chính App Tổng (xem `5-ket-noi/firebase-chung.ts`). Nên KHÔNG cần
// "mint Custom Token sang project khác" — chỉ cần xác minh đúng người rồi cấp lại Custom
// Token CHO CHÍNH project đó, để trình duyệt (đang ở origin thumua.hpcore.vn, khác hẳn
// account.hpcore.vn) có được phiên đăng nhập Firebase Auth CỦA RIÊNG NÓ — trình duyệt
// không tự chia sẻ phiên đăng nhập giữa hai tên miền con dù cùng một project Firebase.
//
// File này CHỈ chạy phía máy chủ (`import "server-only"` chặn lọt vào bundle trình duyệt)
// vì nó cầm khóa Admin SDK — khóa đó TOÀN QUYỀN trên project, lộ ra ngoài là mất tất cả.
// ============================================================

const APP_NAME = "hpcore";
export const SSO_COOKIE_NAME = "session";

export const hpcoreLoginUrl = (returnTo: string): string =>
  `https://account.hpcore.vn/login?next=${encodeURIComponent(returnTo)}`;

function loadCredential(): object {
  const raw = process.env.HPCORE_FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      "Thiếu HPCORE_FIREBASE_SERVICE_ACCOUNT (JSON service account project hpcons-portal).",
    );
  }
  return JSON.parse(raw);
}

function getHpcoreApp(): App {
  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) return existing;
  return initializeApp({ credential: cert(loadCredential() as Parameters<typeof cert>[0]) }, APP_NAME);
}

let authCache: Auth | null = null;
let dbCache: Firestore | null = null;

function getHpcoreAuth(): Auth {
  return (authCache ??= getAuth(getHpcoreApp()));
}

function getHpcoreDb(): Firestore {
  return (dbCache ??= getFirestore(getHpcoreApp()));
}

export interface HpcoreIdentity {
  uid: string;
  email: string;
  fullName?: string;
}

/** Xác minh cookie phiên `account.hpcore.vn`. `null` = không hợp lệ/hết hạn/chưa đăng nhập. */
export async function verifyHpcore(cookie: string | undefined): Promise<HpcoreIdentity | null> {
  if (!cookie) return null;
  try {
    const decoded = await getHpcoreAuth().verifySessionCookie(cookie, true);
    const email = (decoded.email ?? "").trim().toLowerCase();
    if (!email) return null;
    return { uid: decoded.uid, email, fullName: decoded.name as string | undefined };
  } catch {
    return null;
  }
}

const VAI_TRO_HOP_LE: readonly VaiTroToanCucAppTong[] = ["owner", "admin", "manager", "employee"];

/**
 * Vai trò TOÀN CỤC của App Tổng (`users/{uid}.role`) — KHÔNG PHẢI vai trò riêng của app
 * Thu mua. Dùng Admin SDK nên đi vòng qua Security Rules — an toàn vì chỉ máy chủ gọi được.
 *
 * Trả `null` nếu không đọc được hoặc giá trị lạ — nơi gọi phải coi như "không phải owner",
 * không được ngầm định bất kỳ quyền nào khi không chắc chắn.
 */
export async function fetchVaiTroToanCuc(uid: string): Promise<VaiTroToanCucAppTong | null> {
  try {
    const snap = await getHpcoreDb().collection("users").doc(uid).get();
    const role = snap.data()?.role;
    return typeof role === "string" && (VAI_TRO_HOP_LE as readonly string[]).includes(role)
      ? (role as VaiTroToanCucAppTong)
      : null;
  } catch {
    return null;
  }
}

/** Custom Token cho CHÍNH project `hpcons-portal` — client tự `signInWithCustomToken`. */
export async function mintCustomToken(uid: string): Promise<string> {
  return getHpcoreAuth().createCustomToken(uid);
}
