import { NextResponse } from "next/server";

/**
 * CỬA TRẢ LỜI "MÁY CHỦ ĐANG CHẠY BẢN NÀO" — thêm 16/09/2026.
 *
 * Trình duyệt hỏi cửa này vài phút một lần. Câu trả lời khác câu lần đầu nghĩa là đã có bản mới
 * được deploy, và tab đang mở vẫn chạy mã cũ — xem `2-quy-trinh/nhip-kiem-ban-moi.ts` để biết vì
 * sao chuyện đó nguy hiểm (nó là gốc của sự cố 15–16/09/2026).
 *
 * 🔴 KHÔNG ĐỤNG FIRESTORE, KHÔNG ĐỌC DỮ LIỆU NGHIỆP VỤ. Cửa này bị gọi thường xuyên nhất trong
 * app, nên nó phải là thứ rẻ nhất: đọc một biến môi trường rồi trả về. Thêm bất cứ phép đọc nào
 * vào đây là nhân nó lên với số người × số giờ mở app — đúng cách hạn mức Firestore của app Kho
 * bị đốt sạch sáng 16/09.
 *
 * 🔴 KHÔNG CẦN XÁC THỰC. Nó không tiết lộ gì: chỉ là mã của bản đang chạy, thứ ai mở app cũng
 * đang dùng. Bắt đăng nhập ở đây chỉ làm chậm và thêm chỗ hỏng.
 */

/**
 * Mã của bản đang chạy.
 *
 * 🔴 ƯU TIÊN `VERCEL_DEPLOYMENT_ID` HƠN MÃ COMMIT: deploy lại cùng một commit (ví dụ để lấy biến
 * môi trường mới) vẫn là một bản KHÁC đang chạy, và tab cũ vẫn cần tải lại. Nếu chỉ so mã commit
 * thì lần deploy đó im lặng — đúng cái bẫy mà cửa này sinh ra để tránh.
 *
 * 📌 Chạy dưới máy (`npm run dev`) không có hai biến trên → trả `"cuc-bo"`. Giá trị cố định nên
 * không bao giờ báo "có bản mới" khi đang phát triển, đúng ý: lúc đó Next.js đã tự nạp lại rồi.
 */
const MA_BAN =
  process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "cuc-bo";

/**
 * 🔴 BẮT BUỘC `force-dynamic`. Thiếu nó, Next.js thấy route không đọc gì động sẽ **dựng sẵn một
 * lần lúc build rồi trả mãi bản đó** — cửa này sẽ vĩnh viễn trả mã của bản ĐẦU TIÊN, và không ai
 * được báo có bản mới nữa. Lỗi im lặng hoàn toàn: cửa vẫn trả 200, vẫn đúng định dạng, chỉ là
 * con số không bao giờ đổi.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { ban: MA_BAN },
    {
      /* Không cho bất cứ tầng đệm nào giữ lại — trình duyệt, CDN của Vercel, hay proxy công ty.
         Một câu trả lời bị đệm lại là cửa này mất hết tác dụng, y như trường hợp `force-dynamic`
         ở trên, và cũng im lặng y như vậy. */
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
