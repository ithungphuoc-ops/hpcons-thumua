import "server-only";

// 🔴 `firebase-admin` GHIM CỨNG "13.5.0" (không dấu `^`) trong package.json — ĐỪNG nâng lên
// bản 14.x. Lỗi thật gặp trên Vercel 20/08/2026: bản 14.x kéo theo `jwks-rsa@^4` → phụ
// thuộc `jose@^6.1.3`, mà jose từ bản 6 đã BỎ HẲN bản CommonJS. `jwks-rsa` vẫn gọi
// `require("jose")` kiểu cũ nên crash ngay lúc import (`ERR_REQUIRE_ESM`) — xảy ra khi hàm
// `verifySessionCookie()` bên dưới nạp `firebase-admin/auth`, dù không hề dùng tới JWKS.
// Bản 13.5.0 kéo `jwks-rsa@3.2.2` → `jose@4.15.9` (còn bản CommonJS thật) nên không dính.
// Đã thử `serverExternalPackages` (không sửa được — đây là lỗi phiên bản thật giữa hai gói,
// không phải lỗi đóng gói webpack) trước khi tìm ra đây mới là gốc rễ.
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

/**
 * Xác minh ID Token của trình duyệt (header `Authorization: Bearer …`) cho các API NỘI BỘ
 * của app Thu mua (vd `/api/directory`, `/api/phan-quyen`) — KHÁC với `verifyHpcore` ở trên
 * (đó xác minh cookie phiên App Tổng lúc đăng nhập LẦN ĐẦU). Ở đây trình duyệt ĐÃ đăng nhập
 * Firebase (qua Custom Token, xem `xac-thuc-firebase.ts`) nên chỉ cần xác minh ID Token của
 * chính phiên đó — vẫn CÙNG project `hpcons-portal` nên dùng chung `getHpcoreAuth()`.
 */
export async function verifyClientIdToken(
  idToken: string | undefined | null,
): Promise<{ uid: string; email: string } | null> {
  if (!idToken) return null;
  try {
    const decoded = await getHpcoreAuth().verifyIdToken(idToken);
    return { uid: decoded.uid, email: (decoded.email ?? "").trim().toLowerCase() };
  } catch {
    return null;
  }
}

/** Một người trong danh bạ công ty (App Tổng), kèm cờ đã có hồ sơ Thu mua riêng chưa. */
export interface ThanhVienDanhBa {
  uid: string;
  hoTen: string;
  email: string;
  phongBan: string;
  chucDanh: string;
  daCoHoSoThuMua: boolean;
}

/**
 * Đọc TOÀN BỘ danh bạ nhân sự đang làm việc từ App Tổng (collection `users` + `departments`
 * của project `hpcons-portal`) — đúng mẫu đã dùng ở các app con khác (vd
 * `base-request-app/app/api/directory/route.ts`). Kèm luôn danh sách ai đã có hồ sơ
 * `nguoi-dung/{uid}` riêng ở app Thu mua, để màn "Thêm người dùng mới" không bày lại người
 * đã được cấp quyền rồi.
 */
export async function fetchDanhBaCongTy(): Promise<ThanhVienDanhBa[]> {
  const db = getHpcoreDb();
  const [usersSnap, deptSnap, nguoiDungSnap] = await Promise.all([
    db.collection("users").where("isActive", "==", true).get(),
    db.collection("departments").get(),
    db.collection("nguoi-dung").get(),
  ]);

  const tenPhongBan = new Map<string, string>();
  deptSnap.forEach((d) => tenPhongBan.set(d.id, (d.data().name as string) ?? ""));

  const daCoHoSo = new Set(nguoiDungSnap.docs.map((d) => d.id));

  return usersSnap.docs.map((d) => {
    const data = d.data();
    const departmentId = data.departmentId as string | null | undefined;
    return {
      uid: d.id,
      hoTen: (data.fullName as string)?.trim() || (data.email as string)?.split("@")[0] || d.id,
      email: (data.email as string) ?? "",
      phongBan: departmentId ? (tenPhongBan.get(departmentId) ?? "") : "",
      chucDanh: (data.title as string) ?? "",
      daCoHoSoThuMua: daCoHoSo.has(d.id),
    };
  });
}

/** Đọc hồ sơ `nguoi-dung/{uid}` bằng Admin SDK (đi vòng qua Security Rules) — dùng ở API route
 *  để biết CHÍNH XÁC cấp quyền của người đang gọi, không tin dữ liệu do trình duyệt tự khai. */
export async function docHoSoNguoiDungMayChu(uid: string): Promise<Record<string, unknown> | null> {
  const snap = await getHpcoreDb().collection("nguoi-dung").doc(uid).get();
  return snap.exists ? (snap.data() ?? null) : null;
}

/**
 * Ghi hồ sơ `nguoi-dung/{uid}` bằng Admin SDK — đi vòng qua Security Rules (đang khóa ghi từ
 * trình duyệt, xem `firestore-chay-thu.rules`). Đây là đường ghi DUY NHẤT bây giờ — API route
 * gọi hàm này SAU KHI đã tự kiểm đủ luật ở `4-phan-quyen/luat-phan-quyen.ts`.
 */
export async function ghiHoSoNguoiDungMayChu(uid: string, data: Record<string, unknown>): Promise<void> {
  await getHpcoreDb().collection("nguoi-dung").doc(uid).set(data, { merge: true });
}
