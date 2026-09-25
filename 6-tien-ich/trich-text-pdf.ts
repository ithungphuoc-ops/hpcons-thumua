// ============================================================
// TRÍCH CHỮ TỪ TỆP PDF — chạy HOÀN TOÀN TRONG TRÌNH DUYỆT.
//
// ★★ Sếp 20/09/2026: ***"a muốn đính kèm file hoá đơn vào là app tự đọc thông tin trên hoá đơn và
// nhập số liệu vào trường dữ liệu đang có thì có được không?"***, rồi chốt phạm vi:
// ***"Hãy làm trước nhánh với file PDF vector"***.
//
// 🔴 TỆP KHÔNG RỜI MÁY NGƯỜI DÙNG. Không gửi lên máy chủ, không gọi dịch vụ ngoài — hoá đơn có giá
// thật và mã số thuế của cả hai bên. Người dùng chọn tệp, trình duyệt đọc, app điền sẵn ô; chỉ khi
// họ bấm **Lưu hoá đơn** rồi bấm **Đính kèm** thì tệp mới được cất.
//
// 🔴 CHỈ ĐỌC ĐƯỢC PDF VECTOR (PDF do phần mềm hoá đơn điện tử sinh ra — chữ là chữ thật). PDF
// **ảnh quét** không có một ký tự nào để trích: hàm trả `soKyTu: 0` và nơi gọi phải nói thẳng
// *"tệp này là ảnh quét, mời nhập tay"* — đúng luật §3.5, đừng để giao diện hứa việc app không làm.
//
// ⚠️ VÌ SAO WORKER NẰM Ở `public/pdfjs/`, KHÔNG NHÉT QUA BUNDLER: pdf.js bắt buộc phải có worker
// (bản 4.x ném lỗi *"No GlobalWorkerOptions.workerSrc specified"* nếu thiếu). Cách nhờ bundler
// dựng worker (`new Worker(new URL(...))`) phụ thuộc vào webpack hay Turbopack đang chạy và có
// thể hỏng **lúc chạy thật** mà `npm run verify` vẫn PASS. Phục vụ tệp tĩnh thì chắc chắn, đổi lại
// phải giữ đồng bộ phiên bản — có bài kiểm băm tệp trong `kiem-luat-dung-chung.mjs` canh việc đó.
// ============================================================

import { dungDongTuManhChu, type ManhChu } from "@/2-quy-trinh/doc-hoa-don-van-ban";

/** Đường dẫn worker của pdf.js. Đổi chỗ này thì phải đổi cả bài kiểm băm tệp. */
export const DUONG_DAN_WORKER_PDF = "/pdfjs/pdf.worker.min.mjs";

export interface KetQuaTrichPdf {
  /** Toàn bộ chữ của mọi trang, các mảnh nối bằng khoảng trắng. */
  vanBan: string;
  soTrang: number;
  soKyTu: number;
  /**
   * ★ (25/09/2026) Các DÒNG dựng lại theo TOẠ ĐỘ trên tờ — xem `dungDongTuManhChu`. Phần mềm HT
   * invoice vẽ chữ ngược thứ tự trong mỗi dòng, nên `vanBan` (theo thứ tự vẽ) đặt số trước nhãn.
   */
  dong: string[];
}

/**
 * ★★★ Đọc một tệp PDF và trả về toàn bộ chữ trong đó.
 *
 * 📌 Nạp pdf.js bằng `import()` ĐỘNG — thư viện nặng hơn 1MB, nạp tĩnh là mọi người mở trang chi
 * tiết đề nghị đều phải tải nó dù không ai đọc hoá đơn.
 *
 * ⚠️ Các mảnh chữ nối bằng **khoảng trắng**, không nối suông. pdf.js cắt một dòng thành nhiều mảnh
 * theo vị trí vẽ; nối suông thì `Số00001879` dính liền và không từ khoá nào khớp được.
 */
export async function trichTextPdf(tep: File | Blob): Promise<KetQuaTrichPdf> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = DUONG_DAN_WORKER_PDF;

  const duLieu = new Uint8Array(await tep.arrayBuffer());
  const tai = pdfjs.getDocument({ data: duLieu, useSystemFonts: true });
  const hoSo = await tai.promise;

  let vanBan = "";
  const manh: ManhChu[] = [];
  for (let i = 1; i <= hoSo.numPages; i++) {
    const trang = await hoSo.getPage(i);
    const noiDung = await trang.getTextContent();
    vanBan += noiDung.items.map((x) => ("str" in x ? x.str : "")).join(" ") + "\n";
    for (const x of noiDung.items) {
      if (!("str" in x)) continue;
      /* transform = [a, b, c, d, e, f]: e/f là toạ độ; b ≠ 0 nghĩa là chữ bị xoay. */
      manh.push({
        trang: i,
        chu: x.str,
        x: x.transform[4],
        y: x.transform[5],
        rong: x.width,
        xoay: Math.abs(x.transform[1]) > 0.01,
      });
    }
  }
  /* Dọn bộ nhớ ngay — người dùng có thể thử liên tiếp nhiều tệp trong một lần mở trang. */
  await hoSo.destroy();

  return {
    vanBan,
    soTrang: hoSo.numPages,
    soKyTu: vanBan.replace(/\s/g, "").length,
    dong: dungDongTuManhChu(manh),
  };
}
