import {
  // ⚠️ ĐỔI TÊN `File` KHI NHẬP. `File` cũng là tên một kiểu sẵn có của trình duyệt (tệp người
  // dùng chọn lên); để nguyên là nó che mất kiểu kia, và lỗi kiểu chỉ hiện ra ở file nào lỡ
  // dùng cả hai — rất khó truy.
  File as TepChung,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  type LucideIcon,
} from "lucide-react";
import { duoiTep } from "@/3-du-lieu/kho-tep";

/**
 * BIỂU TƯỢNG VÀ TÊN LOẠI TỆP — suy từ đuôi tên tệp.
 *
 * 🔴 Ban lãnh đạo 17/08/2026 khoanh đỏ khu đính kèm và ghi *"thiết kế lại giao diện này
 * chuyên nghiệp hơn"*. Trước đó mọi tệp trong danh sách đều mang chung một cái ghim giấy, nên
 * nhìn năm dòng liền nhau không phân biệt được đâu là bản báo giá PDF, đâu là bảng tính Excel
 * — phải đọc hết tên tệp mới biết.
 *
 * 🔴 KHÔNG TÔ MÀU THEO LOẠI TỆP. Design System V1.1 chỉ có 4 tông ngữ nghĩa (success /
 * warning / danger / neutral) và chúng mang ý nghĩa TRẠNG THÁI. Lấy màu xanh lá gán cho tệp
 * Excel là dạy người dùng một nghĩa sai của màu. Ở đây chỉ khác nhau HÌNH biểu tượng.
 */

/**
 * 📌 Tra theo ĐUÔI TÊN TỆP trước, không tra theo MIME: nhiều máy trả `kieuMime` rỗng (rồi
 * thành `application/octet-stream`) cho ảnh `.heic` của iPhone và cho tệp Office, lúc đó MIME
 * chẳng nói được gì. Đuôi tên tệp thì luôn có.
 */
const THEO_DUOI: Record<string, LucideIcon> = {
  pdf: FileText,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  webp: FileImage,
  heic: FileImage,
  doc: FileType,
  docx: FileType,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
};

const TEN_THEO_DUOI: Record<string, string> = {
  pdf: "PDF",
  jpg: "Ảnh",
  jpeg: "Ảnh",
  png: "Ảnh",
  webp: "Ảnh",
  heic: "Ảnh",
  doc: "Word",
  docx: "Word",
  xls: "Excel",
  xlsx: "Excel",
};

export function bieuTuongTheoLoaiTep(tenTep: string, kieuMime?: string): LucideIcon {
  const theoDuoi = THEO_DUOI[duoiTep(tenTep)];
  if (theoDuoi) return theoDuoi;
  // Không đoán được từ đuôi thì còn MIME — vẫn hơn là rơi thẳng về biểu tượng chung.
  if (kieuMime?.startsWith("image/")) return FileImage;
  if (kieuMime === "application/pdf") return FileText;
  return TepChung;
}

/**
 * Tên loại tệp bằng chữ, cho trình đọc màn hình.
 *
 * 🔴 CẦN VÌ BIỂU TƯỢNG LÀ `aria-hidden`. Người dùng trình đọc màn hình không "thấy" hình
 * biểu tượng, nên thông tin loại tệp phải có đường ra bằng chữ — đúng nguyên tắc Design
 * System *"trạng thái luôn có cả màu và chữ, không chỉ dùng màu"*.
 */
export function tenLoaiTep(tenTep: string, kieuMime?: string): string {
  const theoDuoi = TEN_THEO_DUOI[duoiTep(tenTep)];
  if (theoDuoi) return theoDuoi;
  if (kieuMime?.startsWith("image/")) return "Ảnh";
  if (kieuMime === "application/pdf") return "PDF";
  return "Tệp";
}
