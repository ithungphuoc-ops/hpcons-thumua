// ============================================================
// CẤU HÌNH FIREBASE — APP THU MUA (mã app: "tm")
// Dùng CHUNG 1 Firebase project với App Tổng HPCons (xem
// ../../12. APP TONG HPC/2. OUTPUT/firestore-design/CAU-TRUC-FIRESTORE.md).
// Giá trị lấy từ biến môi trường NEXT_PUBLIC_FIREBASE_* — xem .env.local.example.
// Các giá trị này KHÔNG phải bí mật (mọi web app Firebase đều lộ chúng ở client) —
// bảo mật thật sự nằm ở Firestore Security Rules.
// ============================================================
import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Mã app con dùng trong claims/rules/subcollection (quy ước tại CAU-TRUC-FIRESTORE.md §2.1)
export const APP_ID = "tm" as const;

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// true khi đã điền đủ cấu hình Firebase thật (chưa điền = chạy ở chế độ dữ liệu mẫu).
// Định nghĩa ở file riêng không import SDK — xem lib/firebase/is-configured.ts.
export { isFirebaseConfigured } from "@/5-ket-noi/firebase/da-cau-hinh";
import { isFirebaseConfigured } from "@/5-ket-noi/firebase/da-cau-hinh";

const app = isFirebaseConfigured
  ? getApps()[0] ?? initializeApp(firebaseConfig)
  : undefined;

export const firestore = app ? getFirestore(app) : undefined;
export const auth = app ? getAuth(app) : undefined;
export const storage = app ? getStorage(app) : undefined;
