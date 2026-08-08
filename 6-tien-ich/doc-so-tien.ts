/**
 * Đọc số tiền thành chữ tiếng Việt — bắt buộc trên chứng từ đặt hàng/thanh toán.
 *
 * Quy tắc áp dụng (theo cách đọc phổ thông dùng trong chứng từ kế toán):
 *  - 21 → "hai mươi mốt" (không phải "hai mươi một")
 *  - 25 → "hai mươi lăm", 15 → "mười lăm"
 *  - 105 → "một trăm linh năm"
 *  - Nhóm nghìn/triệu/tỷ ở giữa mà hàng trăm bằng 0 vẫn phải đọc "không trăm"
 *    (1.000.005 → "một triệu không trăm linh năm đồng").
 */
export function docSoTien(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "—";
  const value = Math.round(n);
  if (value === 0) return "Không đồng";

  const chuSo = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

  /** Đọc đúng 3 chữ số. `dayDu` = true khi đây KHÔNG phải nhóm cao nhất. */
  const docBaSo = (block: number, dayDu: boolean): string => {
    const tram = Math.floor(block / 100);
    const chuc = Math.floor((block % 100) / 10);
    const donVi = block % 10;
    const out: string[] = [];

    if (tram > 0 || dayDu) out.push(`${chuSo[tram]} trăm`);

    if (chuc > 1) {
      out.push(`${chuSo[chuc]} mươi`);
      if (donVi === 1) out.push("mốt");
      else if (donVi === 5) out.push("lăm");
      else if (donVi > 0) out.push(chuSo[donVi]);
    } else if (chuc === 1) {
      out.push("mười");
      if (donVi === 5) out.push("lăm");
      else if (donVi > 0) out.push(chuSo[donVi]);
    } else if (donVi > 0) {
      // Hàng chục bằng 0 mà còn hàng đơn vị -> chèn "linh"
      if (tram > 0 || dayDu) out.push("linh");
      out.push(chuSo[donVi]);
    }
    return out.join(" ");
  };

  // Tách thành các nhóm 3 chữ số, nhóm nhỏ nhất đứng đầu mảng
  const blocks: number[] = [];
  let remain = value;
  while (remain > 0) {
    blocks.push(remain % 1000);
    remain = Math.floor(remain / 1000);
  }

  const donViLon = ["", "nghìn", "triệu", "tỷ"];
  const parts: string[] = [];
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (blocks[i] === 0) continue;
    const isHighest = i === blocks.length - 1;
    // Nhóm tỷ lặp lại sau mỗi 4 nhóm: nghìn tỷ, triệu tỷ...
    const donVi = i >= 4 ? `${donViLon[i % 4]} tỷ`.trim() : donViLon[i];
    parts.push(`${docBaSo(blocks[i], !isHighest)} ${donVi}`.trim());
  }

  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} đồng`;
}
