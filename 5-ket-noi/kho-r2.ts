import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ============================================================
// KHO TỆP ĐÍNH KÈM TRÊN CLOUDFLARE R2 — thay cho cách cắt mảnh base64 trong Firestore
//
// 🔴 VÌ SAO ĐỔI (Sếp chốt 21/09/2026): tệp đính kèm đang nằm TRONG Firestore, cắt thành
// mảnh 600 KB vì Firestore chặn 1 MB mỗi tài liệu. Đo ngày 21/09: 457 tệp hoá thành
// 457 + 750 = 1.207 tài liệu, tổng ~274 MB. Firestore tính tiền theo LƯỢT ĐỌC tài liệu,
// nên mỗi lần ai đó mở một tệp là đọc hàng loạt mảnh — đây là gốc của ~160.000 lượt
// đọc/ngày. R2 tính theo dung lượng lưu, đọc gần như miễn phí.
//
// 📌 Cách làm đúng theo khuôn mẫu đã chạy thật ở app Đề xuất (`base-request-app/lib/r2.ts`,
// 13/09/2026) và app Quà tặng: bucket KHÔNG công khai, mọi lượt đọc/ghi đều qua LINK KÝ SẴN
// hết hạn sau ít phút, và quyền được kiểm ở route trước khi phát link.
//
// ⚠️ TRẦN 4,5 MB CỦA VERCEL: đừng đẩy tệp qua Route Handler. Trình duyệt phải PUT THẲNG lên
// R2 bằng link ký sẵn — đúng bài học app Đề xuất đã vấp (xem `project_request_app_upload_vercel_limit`).
//
// ⚠️ CORS: bucket phải bật CORS cho đúng tên miền app (PUT + GET + header content-type).
// Khoá R2 của app KHÔNG có quyền đặt CORS — phải bật tay trên Cloudflare.
// ============================================================

let khachHang: S3Client | undefined;

/** Đã khai đủ cấu hình R2 chưa — nơi gọi dùng để chọn giữa R2 và cách cũ (Firestore). */
export function daCauHinhR2(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME,
  );
}

function moR2(): S3Client {
  if (khachHang) return khachHang;
  khachHang = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
  return khachHang;
}

function tenKho(): string {
  const kho = process.env.R2_BUCKET_NAME;
  if (!kho) throw new Error("Thiếu R2_BUCKET_NAME — chưa cấu hình kho tệp R2.");
  return kho;
}

/**
 * Đường dẫn của một tệp trong kho.
 *
 * 🔴 Gộp hết vào một thư mục `tep/` phẳng, KHÔNG chia theo ngày hay theo hồ sơ. Lý do: mã
 * tệp (`tepId`) đã là duy nhất và giao diện chỉ cầm mã đó — chia thêm tầng thì lúc đọc phải
 * tra ngược xem tệp nằm ở nhánh nào, thêm một lượt đọc Firestore mà chẳng được gì.
 */
export function duongDanTep(tepId: string): string {
  return `tep/${tepId}`;
}

/** Link để trình duyệt PUT THẲNG tệp lên kho. Chỉ ghi được ĐÚNG một đường dẫn, hết hạn sớm. */
export async function kyLinkTaiLen(
  tepId: string,
  kieuMime: string,
  hetHanSau = 300,
): Promise<string> {
  return getSignedUrl(
    moR2(),
    new PutObjectCommand({ Bucket: tenKho(), Key: duongDanTep(tepId), ContentType: kieuMime }),
    { expiresIn: hetHanSau },
  );
}

/** Link để trình duyệt tải tệp về. Kiểm quyền TRƯỚC khi gọi hàm này. */
export async function kyLinkDoc(tepId: string, hetHanSau = 300): Promise<string> {
  return getSignedUrl(
    moR2(),
    new GetObjectCommand({ Bucket: tenKho(), Key: duongDanTep(tepId) }),
    { expiresIn: hetHanSau },
  );
}

/** Đẩy tệp từ phía máy chủ (dùng cho công cụ di trú, không dùng cho người dùng tải lên). */
export async function dayLenTuMayChu(
  tepId: string,
  noiDung: Buffer,
  kieuMime: string,
): Promise<void> {
  await moR2().send(
    new PutObjectCommand({
      Bucket: tenKho(),
      Key: duongDanTep(tepId),
      Body: noiDung,
      ContentType: kieuMime,
    }),
  );
}

/** Tải tệp về phía máy chủ. */
export async function taiVeTuMayChu(tepId: string): Promise<Buffer> {
  const kq = await moR2().send(
    new GetObjectCommand({ Bucket: tenKho(), Key: duongDanTep(tepId) }),
  );
  return Buffer.from(await kq.Body!.transformToByteArray());
}

/**
 * Cỡ tệp trong kho, `null` nếu không có.
 *
 * 🔴 Dùng để XÁC NHẬN tệp đã lên thật sau khi trình duyệt PUT bằng link ký sẵn. Không có bước
 * này thì mọi thứ dựa vào lời khai của trình duyệt — mạng đứt giữa chừng là ghi nhận "đã lưu"
 * cho một tệp rỗng, đúng kiểu lỗi đã gặp ở đường Đề xuất → Kho hồi 13–17/09 (báo thành công
 * trong khi thực tế không có gì).
 */
export async function coTepTrongKho(tepId: string): Promise<number | null> {
  try {
    const kq = await moR2().send(
      new HeadObjectCommand({ Bucket: tenKho(), Key: duongDanTep(tepId) }),
    );
    return kq.ContentLength ?? null;
  } catch {
    return null;
  }
}

/** Xoá tệp khỏi kho. Không ném lỗi khi tệp vốn không tồn tại. */
export async function xoaKhoiKho(tepId: string): Promise<void> {
  await moR2().send(new DeleteObjectCommand({ Bucket: tenKho(), Key: duongDanTep(tepId) }));
}
