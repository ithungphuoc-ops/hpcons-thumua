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
import { unstable_cache, revalidateTag } from "next/cache";
import type { VaiTroToanCucAppTong } from "@/4-phan-quyen/quyen";

// ============================================================
// CẦU NỐI SSO VỚI APP TỔNG (account.hpcore.vn) — PHÍA MÁY CHỦ
//
// 🔴 Chỉ đạo Ban lãnh đạo 20/08/2026: bỏ đăng nhập email/mật khẩu riêng của app này,
// dùng thẳng phiên đăng nhập App Tổng — đúng mẫu đã áp dụng cho các app con khác trong
// hệ sinh thái (Đấu Thầu, Booking, Cuộc Họp...).
//
// 📌 LỊCH SỬ — 20/08 đến 21/09/2026 app Thu mua dùng CHUNG project `hpcons-portal` với App
// Tổng, nên chỉ cần cấp lại Custom Token cho chính project đó. Sếp chốt 21/09/2026 TÁCH ra
// project riêng, nên nay đã giống các app con khác (Kho `qlk-ctr`, Task Manager
// `hpcons-thietke`, Cuộc họp): xác minh cookie ở project App Tổng rồi ký vé đăng nhập bằng
// chìa của project RIÊNG. Xem khối "PROJECT RIÊNG CỦA APP THU MUA" bên dưới.
//
// Điều KHÔNG đổi: trình duyệt không tự chia sẻ phiên đăng nhập giữa hai tên miền con, nên
// dù trước hay sau khi tách, `thumua.hpcore.vn` vẫn phải có phiên Firebase Auth của riêng nó.
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

/**
 * 📌 Export thêm 19/08/2026 (trước đó là hàm riêng, không lộ ra ngoài file này) — route
 * "cửa tiếp nhận" từ App Request (`app/api/app-request/de-nghi-moi`) cần đọc/ghi trực tiếp
 * document `chay-thu/du-lieu-chung` mà giao diện đang lắng nghe, không có sẵn hàm riêng nào
 * cho việc đó. Dùng CHUNG kết nối này thay vì mở thêm một Admin SDK app khác trỏ cùng
 * project — một chỗ khởi tạo duy nhất, đúng nguyên tắc app đang theo.
 */
export function getHpcoreDb(): Firestore {
  return (dbCache ??= getFirestore(getHpcoreApp()));
}

// ============================================================
// PROJECT RIÊNG CỦA APP THU MUA — tách khỏi `hpcons-portal` (Sếp chốt 21/09/2026)
//
// 🔴 VÌ SAO PHẢI CÓ HAI CHÌA KHÓA: trước đây MỘT chìa `HPCORE_FIREBASE_SERVICE_ACCOUNT` làm
// bốn việc cùng lúc. Sau khi tách, bốn việc đó thuộc HAI project khác nhau:
//
//   Ở LẠI `hpcons-portal`          │ SANG PROJECT MỚI
//   ───────────────────────────────┼──────────────────────────────────
//   verifyHpcore (cookie App Tổng) │ mintCustomToken (vé đăng nhập)
//   fetchVaiTroToanCuc (`users`)   │ verifyClientIdToken (ID token)
//   `users` + `departments`        │ dữ liệu nghiệp vụ + `nguoi-dung`
//
// Vé đăng nhập (Custom Token) CHỈ dùng được ở đúng project đã ký nó. Trình duyệt sau khi
// tách sẽ nối vào project mới, nên vé BẮT BUỘC do chìa mới ký — ký bằng chìa cũ thì
// `signInWithCustomToken` báo lỗi và không ai đăng nhập được.
//
// 📌 ĐƯỜNG LÙI: chưa khai `THUMUA_FIREBASE_SERVICE_ACCOUNT` thì mọi hàm dưới đây rơi về
// đúng kết nối `hpcons-portal` như trước — app chạy y hệt hiện nay. Nhờ vậy bản sửa này
// merge được mà KHÔNG đổi một hành vi nào trên production, và ngày chuyển đổi chỉ cần
// thêm biến môi trường rồi deploy lại, không phải sửa code lần nữa.
// ============================================================

const THUMUA_APP_NAME = "thumua";

/** Đã tách project chưa — nơi khác cần biết để bày cảnh báo / chọn nhánh xử lý. */
export function daTachProjectRieng(): boolean {
  return Boolean(process.env.THUMUA_FIREBASE_SERVICE_ACCOUNT);
}

let thuMuaAuthCache: Auth | null = null;
let thuMuaDbCache: Firestore | null = null;

function getThuMuaApp(): App {
  const existing = getApps().find((a) => a.name === THUMUA_APP_NAME);
  if (existing) return existing;
  const raw = process.env.THUMUA_FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Thiếu THUMUA_FIREBASE_SERVICE_ACCOUNT — gọi nhầm nhánh.");
  return initializeApp({ credential: cert(JSON.parse(raw) as Parameters<typeof cert>[0]) }, THUMUA_APP_NAME);
}

/** Auth của project Thu mua — ký và xác minh vé đăng nhập. Chưa tách thì dùng lại `hpcore`. */
function getThuMuaAuth(): Auth {
  if (!daTachProjectRieng()) return getHpcoreAuth();
  return (thuMuaAuthCache ??= getAuth(getThuMuaApp()));
}

/**
 * Firestore chứa DỮ LIỆU NGHIỆP VỤ của app Thu mua (`chay-thu/du-lieu-chung`, các khối
 * `tm_*`, `tep`, `nguoi-dung`). Chưa tách thì vẫn là `hpcons-portal` như cũ.
 *
 * 🔴 ĐỪNG dùng hàm này để đọc `users`/`departments` — hai khối đó do App Tổng sở hữu và ghi,
 * vĩnh viễn ở lại `hpcons-portal`; phải gọi `getHpcoreDb()`.
 */
export function getThuMuaDb(): Firestore {
  if (!daTachProjectRieng()) return getHpcoreDb();
  return (thuMuaDbCache ??= getFirestore(getThuMuaApp()));
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

// ⚠️ QUY ƯỚC HẠN MỨC FIRESTORE — ghi lại sau sự cố RESOURCE_EXHAUSTED thật ở app Kho công trình
// (QLK CTR) ngày 13/09/2026 (gói Spark, trần 50.000 lượt đọc/ngày, 1 trang quét toàn bộ lịch sử
// không giới hạn/không cache làm sập cả app). Rà soát 14/09/2026 phát hiện 2 hàm dưới đây
// (`fetchVaiTroToanCuc`, `fetchDanhBaCongTy`) đọc trực tiếp Firestore mỗi lần gọi, không cache:
// - `fetchVaiTroToanCuc(uid)` chạy mỗi lần xác minh phiên SSO (mỗi F5/mở app) — cache 30s AN
//   TOÀN không cần `revalidateTag` vì `users` do App Tổng SỞ HỮU VÀ GHI, app này chỉ đọc.
// - `fetchDanhBaCongTy()` quét TOÀN BỘ 3 collection (`users`, `departments`, `nguoi-dung`) mỗi
//   lần mở màn "Phân quyền người dùng" — cache 60s. KHÁC với hàm trên: collection `nguoi-dung`
//   trong hàm này DO CHÍNH APP NÀY GHI (`ghiHoSoNguoiDungMayChu`, đường ghi duy nhất tại
//   `app/api/phan-quyen/route.ts`), nên PHẢI nối `revalidateTag(TAG_DANH_BA, ...)` ngay sau khi
//   ghi — thiếu bước này sẽ tái diễn đúng lỗi đã gặp ở ITAsset (tạo/sửa quyền xong, danh sách
//   "đã có hồ sơ Thu mua" vẫn hiện sai tới 60 giây).
//
// Nếu sau này thêm hàm đọc mới cho dữ liệu do App Tổng ghi (KHÔNG phải app này ghi): cache +
// KHÔNG cần revalidateTag. Nếu dữ liệu do CHÍNH APP NÀY ghi: cache + BẮT BUỘC revalidateTag tại
// mọi nơi ghi liên quan, không được bỏ sót bất kỳ đường ghi nào.
const TAG_DANH_BA_CONG_TY = "thumua-danh-ba-cong-ty";

/**
 * Vai trò TOÀN CỤC của App Tổng (`users/{uid}.role`) — KHÔNG PHẢI vai trò riêng của app
 * Thu mua. Dùng Admin SDK nên đi vòng qua Security Rules — an toàn vì chỉ máy chủ gọi được.
 *
 * Trả `null` nếu không đọc được hoặc giá trị lạ — nơi gọi phải coi như "không phải owner",
 * không được ngầm định bất kỳ quyền nào khi không chắc chắn.
 */
export const fetchVaiTroToanCuc = unstable_cache(
  async (uid: string): Promise<VaiTroToanCucAppTong | null> => {
    try {
      const snap = await getHpcoreDb().collection("users").doc(uid).get();
      const role = snap.data()?.role;
      return typeof role === "string" && (VAI_TRO_HOP_LE as readonly string[]).includes(role)
        ? (role as VaiTroToanCucAppTong)
        : null;
    } catch {
      return null;
    }
  },
  ["thumua-vai-tro-toan-cuc"],
  { revalidate: 30 },
);

/**
 * Vé đăng nhập (Custom Token) cho trình duyệt — client tự `signInWithCustomToken`.
 *
 * 🔴 PHẢI ký bằng chìa của ĐÚNG project mà trình duyệt nối vào (`NEXT_PUBLIC_FIREBASE_PROJECT_ID`).
 * Sau khi tách, đó là project riêng của Thu mua, KHÔNG còn là `hpcons-portal`. Ký sai project
 * thì `signInWithCustomToken` ném `auth/invalid-custom-token` và KHÔNG AI đăng nhập được —
 * nên khi đổi biến môi trường phải đổi ĐỒNG THỜI cả `THUMUA_FIREBASE_SERVICE_ACCOUNT` lẫn
 * sáu biến `NEXT_PUBLIC_FIREBASE_*`, không được đổi lệch một bên.
 */
export async function mintCustomToken(uid: string): Promise<string> {
  return getThuMuaAuth().createCustomToken(uid);
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
    // Cùng project với nơi đã ký vé (`mintCustomToken`) — sau khi tách là project riêng.
    const decoded = await getThuMuaAuth().verifyIdToken(idToken);
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
 *
 * 🔴 LOẠI BỎ `role === "owner"` — phát hiện 20/08/2026: owner đã TỰ ĐỘNG toàn quyền ngay từ
 * SSO (xem `docHoSoTaiKhoan()` → nhánh owner, không cần hồ sơ `nguoi-dung` nào cả), nên bày
 * owner trong danh sách "cấp quyền" vừa thừa vừa gây hiểu lầm — có 2 người khác nhau trùng
 * tên thật ngoài đời (vd "Nguyễn Tấn Hậu": một là owner, một là nhân viên khác), owner lại
 * thường THIẾU `title`/`departmentId` (không cần khai vì không đi qua luồng phân quyền theo
 * app con) nên dòng của họ hiện trống trơn, dễ bị tưởng nhầm là lỗi đồng bộ dữ liệu.
 */
export const fetchDanhBaCongTy = unstable_cache(
  async (): Promise<ThanhVienDanhBa[]> => {
    // 🔴 HAI NGUỒN KHÁC PROJECT sau khi tách: `users`/`departments` vĩnh viễn ở App Tổng,
    // còn `nguoi-dung` (hồ sơ phân quyền riêng của Thu mua) đi theo project mới. Trước
    // 21/09/2026 cả ba cùng một `db` nên gộp chung được; nay phải tách đúng nguồn — nếu
    // không, sau ngày chuyển đổi cờ "đã có hồ sơ Thu mua" sẽ trống trơn toàn bộ.
    const dbAppTong = getHpcoreDb();
    const dbThuMua = getThuMuaDb();
    const [usersSnap, deptSnap, nguoiDungSnap] = await Promise.all([
      dbAppTong.collection("users").where("isActive", "==", true).get(),
      dbAppTong.collection("departments").get(),
      dbThuMua.collection("nguoi-dung").get(),
    ]);

    const tenPhongBan = new Map<string, string>();
    deptSnap.forEach((d) => tenPhongBan.set(d.id, (d.data().name as string) ?? ""));

    const daCoHoSo = new Set(nguoiDungSnap.docs.map((d) => d.id));

    return usersSnap.docs
      .filter((d) => d.data().role !== "owner")
      .map((d) => {
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
  },
  ["thumua-danh-ba-cong-ty"],
  { revalidate: 60, tags: [TAG_DANH_BA_CONG_TY] },
);

/** Đọc hồ sơ `nguoi-dung/{uid}` bằng Admin SDK (đi vòng qua Security Rules) — dùng ở API route
 *  để biết CHÍNH XÁC cấp quyền của người đang gọi, không tin dữ liệu do trình duyệt tự khai. */
export async function docHoSoNguoiDungMayChu(uid: string): Promise<Record<string, unknown> | null> {
  const snap = await getThuMuaDb().collection("nguoi-dung").doc(uid).get();
  return snap.exists ? (snap.data() ?? null) : null;
}

/**
 * Ghi hồ sơ `nguoi-dung/{uid}` bằng Admin SDK — đi vòng qua Security Rules (đang khóa ghi từ
 * trình duyệt, xem `firestore-chay-thu.rules`). Đây là đường ghi DUY NHẤT bây giờ — API route
 * gọi hàm này SAU KHI đã tự kiểm đủ luật ở `4-phan-quyen/luat-phan-quyen.ts`.
 */
export async function ghiHoSoNguoiDungMayChu(uid: string, data: Record<string, unknown>): Promise<void> {
  await getThuMuaDb().collection("nguoi-dung").doc(uid).set(data, { merge: true });
  // BẮT BUỘC — đây là đường ghi duy nhất tới `nguoi-dung`, mà `fetchDanhBaCongTy()` ở trên đọc
  // (cờ `daCoHoSoThuMua`) đang cache 60s. Thiếu dòng này thì màn "Phân quyền người dùng" sẽ hiện
  // sai cờ "đã có hồ sơ" tới 60 giây sau khi vừa cấp/sửa quyền — xem chú thích QUY ƯỚC HẠN MỨC
  // FIRESTORE ở đầu file.
  revalidateTag(TAG_DANH_BA_CONG_TY);
}
