"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronRight, Lock, LogIn, LogOut, type LucideIcon } from "lucide-react";
import { HopXemTep } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xem-tep";
import { rutGonTenTep } from "@/1-giao-dien/thanh-phan-dung-chung/o-dinh-kem-tep";
import { coTep, type MoTaTep } from "@/3-du-lieu/kho-tep";
import { cn } from "@/6-tien-ich/gop-lop";

/**
 * KHỐI "ĐẦU VÀO THEO GIAI ĐOẠN" — dựng theo trang chi tiết job của Base.
 *
 * 🔴 Ban lãnh đạo 16/08/2026: *"đây là quy trình thu mua khi mở trên 1 trang, e bố cục giống
 * 100% như vậy"* (4 ảnh chụp `workflow.base.vn/job/3898671`).
 *
 * Điểm khác biệt lớn nhất so với bố cục cũ: Base gom dữ liệu **theo GIAI ĐOẠN** — mỗi giai
 * đoạn một khối gập, bên trong là đúng những thứ được nhập vào ở giai đoạn ấy. App trước đây
 * gom **theo LOẠI CHỨNG TỪ** (bảng báo giá một chỗ, đơn hàng một chỗ), nên muốn biết "bước ③
 * đã nộp những gì" thì phải đi tìm khắp trang.
 *
 * 📌 CÁC TRƯỜNG ĐÁNH SỐ LIÊN TỤC xuyên suốt cả trang (01, 02, … 13) đúng như Base — nhờ vậy
 * hai người trao đổi qua điện thoại nói "trường 07" là hiểu nhau ngay.
 */

/** Một trường đầu vào — giá trị là chữ hoặc danh sách tệp. */
export interface TruongDauVao {
  nhan: string;
  /** Giá trị dạng chữ. Bỏ trống nếu dùng `tep`. */
  giaTri?: string;
  /** Tệp đính kèm — hiện nút xem, không phải chữ trơn. */
  tep?: MoTaTep[];
  /** Nội dung tự do (bảng chi tiết mặt hàng chẳng hạn). */
  noiDung?: React.ReactNode;
}

/** Một giai đoạn và phần đầu vào của nó. */
export interface GiaiDoanDauVao {
  ma: string;
  nhan: string;
  truong: TruongDauVao[];
  /** Giai đoạn đang đứng — mở sẵn, các giai đoạn khác gập lại. */
  dangODay?: boolean;
  /**
   * ★ BƯỚC NÀY CÒN THIẾU GÌ — câu vướng mắc, hoặc `undefined` là đủ (23/08/2026).
   *
   * 🔴 Ban lãnh đạo: *"Các border này cần hiển thị màu đỏ nếu như công việc trong các mục này
   * chưa hoàn thành hoặc thiếu đính kèm file"*.
   *
   * VÌ SAO CẦN: mọi khối mặc định GẬP (chỉ đạo 18/08/2026 *"F5 là tự group lại"*), nên nhìn
   * trang chỉ thấy một dãy tiêu đề giống nhau — muốn biết bước nào còn nợ chứng từ thì phải mở
   * từng khối. Viền đỏ trả lời câu đó ngay khi khối vẫn đang gập.
   *
   * 🔴 NHẬN SẴN CÂU VƯỚNG MẮC, KHÔNG TỰ TÍNH. Khối này thuần hiển thị; luật "bước nào còn
   * thiếu" nằm ở `2-quy-trinh/giai-doan-mua-hang.ts` → `vuongMacSangBuocSau`. Để nó tự tính là
   * kéo cả cấu hình quy trình, bảng báo giá và kho dữ liệu vào một component chỉ để bày.
   *
   * ⚠️ NƠI GỌI PHẢI TỰ LỌC BƯỚC CHƯA TỚI LƯỢT. Bước chưa tới thì đương nhiên còn thiếu — truyền
   * hết vào là **tô đỏ cả tám khối**, đỏ khắp trang thành vô nghĩa và người dùng thôi để ý.
   */
  conThieu?: string;
  /**
   * Phần LÀM VIỆC thật của giai đoạn này (bảng phân bổ, bảng báo giá, đơn hàng…).
   *
   * 🔴 Ban lãnh đạo 16/08/2026 — về ba khối app có mà Base không có: *"những mục này base
   * ko có, e kiểm tra xem nó đang trùng ở bước nào thì thêm nó vào bước đó"*. Tức là KHÔNG
   * bỏ ba khối đó, mà đưa vào đúng giai đoạn của chúng, để trang vẫn gom theo GIAI ĐOẠN
   * như Base. Nhờ vậy đứng ở bước nào là thấy đủ cả *dữ liệu đã nhập* lẫn *việc phải làm*
   * của bước đó, không phải cuộn xuống cuối trang tìm bảng tương ứng.
   */
  noiDungNghiepVu?: React.ReactNode;
  /**
   * KHU ĐÍNH KÈM TỆP của riêng bước này — xem `khu-dinh-kem-giai-doan.tsx`.
   *
   * 🔴 Ban lãnh đạo 17/08/2026 khoanh đỏ khối "Bảng báo giá (0)" ở bước ② và ghi *"mục đính
   * kèm file"*. Trước đó bước ② không có chỗ nào bỏ tệp vào: bản báo giá nhà cung cấp gửi
   * về qua Zalo/email chỉ gắn được sau khi đã lập bảng báo giá.
   *
   * 📌 Nhận `ReactNode` chứ không nhận `MoTaTep[]`: khu đính kèm còn phải ghi dữ liệu và
   * kiểm quyền, mà khối này chỉ biết BÀY. Để nó tự đi lấy dữ liệu là kéo cả kho dữ liệu và
   * phân quyền vào một component vốn thuần hiển thị.
   */
  khuDinhKem?: React.ReactNode;
  /**
   * GẬP KHỐI THÌ CHỈ ẨN, KHÔNG THÁO KHỎI CÂY REACT.
   *
   * 🔴 BẮT BUỘC BẬT CHO BƯỚC CÓ FORM NHẬP LIỆU (từ 17/08/2026, khi form lập đơn mua hàng
   * chuyển vào trong khối bước ④ theo chỉ đạo *"phần nhập liệu phải nằm trong khối"*).
   *
   * Mặc định khối gập là `{dangMo && …}` — React THÁO nội dung, nên mọi thứ người dùng đang gõ
   * biến mất không có nút hoàn lại: gõ nửa cái đơn 20 dòng, bấm gập khối (hay chỉ mở khối khác
   * rồi gập khối này) là mất sạch. Tháo rồi gắn lại còn làm các chốt "chỉ điền sẵn một lần"
   * chạy lại từ đầu và ghi đè số người dùng đã sửa tay.
   *
   * ⚠️ Đánh đổi: nội dung của khối bật cờ này LUÔN được dựng, kể cả lúc đang gập — nặng hơn
   * một chút. Vì vậy CHỈ bật cho khối có form; các khối chỉ bày dữ liệu thì cứ để mặc định để
   * trang nhẹ.
   */
  giuNoiDungKhiGap?: boolean;
  /**
   * ★ KHÓA KHÔNG CHO XỔ KHỐI — Ban lãnh đạo 12/09/2026: *"phải bấm checkin xong thì mới được
   * xổ thông tin tiếp nhận xuống"*.
   *
   * Chuỗi = LÝ DO bị khóa, hiện thẳng dưới dòng tiêu đề. `undefined` = mở bình thường.
   *
   * 🔴 ĐIỀU KIỆN GỠ KHÓA PHẢI NẰM NGOÀI KHỐI NÀY, nếu không là kẹt vĩnh viễn: người dùng không
   * mở được khối thì cũng không bấm được thứ bên trong nó để tự gỡ. Ca đang dùng đạt điều kiện
   * đó — ô tích *"Checkin hàng tồn kho"* nằm ở khối "Danh sách công việc", một Card RIÊNG bên
   * dưới (xem chú thích *"CỐ Ý ĐỨNG RIÊNG"* trong `trang/de-nghi-chi-tiet.tsx`).
   * ⚠️ Trước khi dùng cờ này cho bước khác, phải kiểm lại đúng điều đó.
   *
   * 📌 Khóa luôn ép khối về trạng thái GẬP, kể cả khi người dùng đã mở nó từ trước rồi mới làm
   * mất điều kiện — trạng thái mở không được phép "lách" qua khóa.
   */
  khoaMoRong?: string;
  /**
   * ★ GỘP "ĐẦU VÀO" VÀO "KẾT QUẢ" — CHỈ DÀNH CHO BƯỚC NÀO ĐẦU VÀO CŨNG CHÍNH LÀ KẾT QUẢ.
   *
   * 🔴 Ban lãnh đạo 13/09/2026, đứng ở bước ③ *Xét duyệt báo giá*: *"Đổi chữ luôn, vì đầu vào
   * và kết quả của bước này là 1 nên hãy để chữ 'Kết quả'"*.
   *
   * VÌ SAO KHÔNG ĐỔI THẲNG CHỮ "ĐẦU VÀO": hai nhãn này dựng MỘT LẦN ở đây và cả 9 bước dùng
   * chung (xem chú thích *"SỬA MỘT LẦN ÁP CHO MỌI BƯỚC"* ở khối KẾT QUẢ). Đổi thẳng là đổi
   * HẾT mọi bước, xóa mất chính sự phân biệt đầu vào / kết quả mà Ban lãnh đạo yêu cầu dựng
   * lên ngày 19/08/2026 (*"Thêm nút 'Kết quả' để phân biệt rõ đâu là đầu vào đâu là đầu ra"*).
   *
   * 🔴 VÌ SAO PHẢI GỘP CHỨ KHÔNG CHỈ ĐỔI TÊN: bước ③ có ĐỦ CẢ HAI phần — danh sách trường
   * (bản báo giá được chọn, bảng so sánh) và phần nghiệp vụ (khối xét duyệt). Chỉ đổi chữ là
   * màn hình có HAI khối cùng tên "KẾT QUẢ" chồng nhau, rối hơn trước khi sửa. Bật cờ này thì
   * danh sách trường chuyển vào NẰM TRONG khối KẾT QUẢ, ngay trên phần nghiệp vụ — một khối,
   * một nhãn, đúng câu *"đầu vào và kết quả của bước này là 1"*.
   *
   * ⚠️ CÁI GIÁ: với bước bật cờ, danh sách trường tụt xuống DƯỚI khu đính kèm tệp (vì khối
   * KẾT QUẢ vốn đứng sau khu đính kèm từ 22/08/2026). Chấp nhận được, và vẫn đúng mạch đọc
   * *chứng từ đính kèm → kết quả*; số thứ tự 01→N không đổi vì nó tính theo thứ tự mảng
   * `truong`, không tính theo chỗ vẽ ra.
   *
   * ⚠️ CHỈ BẬT KHI BƯỚC ĐÓ THẬT SỰ CHỈ CÓ MỘT THỨ. Bật cho bước mà đầu vào khác hẳn kết quả
   * (bước ④ chẳng hạn: đầu vào là căn cứ chọn NCC, kết quả là đơn đặt hàng) thì hai thứ khác
   * nghĩa bị gom chung một nhãn — người đọc hồ sơ mất đúng thông tin mà nhãn sinh ra để nói.
   *
   * 📌 Bỏ trống = tự nhận theo mã giai đoạn (xem `MA_BUOC_GOP_DAU_VAO_VAO_KET_QUA`).
   * Truyền `false` để ép tắt, truyền `true` để ép bật cho bước khác.
   */
  gopDauVaoVaoKetQua?: boolean;
}

/**
 * NHÃN CỦA MỘT PHẦN BÊN TRONG KHỐI GIAI ĐOẠN.
 *
 * Một khối giai đoạn có hai phần NGANG HÀNG nhau: *dữ liệu đã nhập vào* ("ĐẦU VÀO") và
 * *việc phải làm* (Phân bổ công việc · Bảng báo giá · Đơn đặt hàng). Hai phần ngang hàng
 * thì phải cùng một cỡ chữ.
 *
 * 🔴 Ban lãnh đạo 16/08/2026 nhìn màn chi tiết và nói *"kiểm tra xem chiều cao chữ đang
 * ko đồng đều"*, khoanh đỏ đúng hai tiêu đề "Phân bổ công việc" và "Bảng báo giá". Nguyên
 * do: ba khối nghiệp vụ vốn đứng RỜI ngoài trang nên có tiêu đề `text-h3` 18px; cùng ngày
 * chúng được đưa VÀO trong khối giai đoạn (tiêu đề khối chỉ 11px) mà cỡ chữ giữ nguyên —
 * thành ra tiêu đề con to hơn tiêu đề cha 7px, ngược thứ bậc.
 *
 * 🔴 VÌ SAO PHẢI LÀ MỘT COMPONENT DÙNG CHUNG, không chép class ra bốn nơi: bốn nhãn này
 * bắt buộc phải luôn bằng nhau. Chép ra rồi lần sau ai đó chỉnh một nơi là lệch lại đúng
 * cái lỗi hôm nay, mà lệch 1–2px thì không ai soi ra khi đọc code.
 */
export function NhanPhanTrongGiaiDoan({
  icon: BieuTuong,
  the = "p",
  className,
  children,
}: {
  icon: LucideIcon;
  /**
   * Thẻ ngữ nghĩa. "ĐẦU VÀO" chỉ là nhãn của danh sách trường nên để `p`; còn ba khối
   * nghiệp vụ là tiêu đề thật của một vùng nội dung nên giữ `h2` cho trình đọc màn hình
   * và mục lục trang — đổi kiểu chữ KHÔNG được kéo theo hạ cấp ngữ nghĩa.
   */
  the?: "p" | "h2";
  className?: string;
  children: React.ReactNode;
}) {
  const lop = cn(
    "flex items-center gap-1.5 text-xs font-semibold text-text-desc uppercase",
    className,
  );
  const noiDung = (
    <>
      <BieuTuong className="size-3.5 shrink-0" aria-hidden />
      {children}
    </>
  );
  // Viết tách hai nhánh thay vì dựng thẻ động: TypeScript kiểm được đúng thuộc tính của
  // từng thẻ, và người đọc thấy ngay component này chỉ sinh ra p hoặc h2, không gì khác.
  return the === "h2" ? <h2 className={lop}>{noiDung}</h2> : <p className={lop}>{noiDung}</p>;
}

/**
 * ★ BƯỚC ĐƯỢC GỘP SẴN — xem `gopDauVaoVaoKetQua`. Đây là mã giai đoạn ③ *Xét duyệt báo giá*,
 * khai trong `2-quy-trinh/giai-doan-mua-hang.ts`.
 *
 * 🔴 VÌ SAO NHẬN THEO MÃ GIAI ĐOẠN CHỨ KHÔNG BẮT NƠI GỌI TRUYỀN CỜ: luật *"bước ③ chỉ có một
 * khối KẾT QUẢ"* là chỉ đạo về NGHIỆP VỤ của bước đó, đúng cho mọi chỗ dựng khối giai đoạn.
 * Để nơi gọi tự truyền thì chỗ nào quên truyền là bước ③ lại mọc ra hai khối cùng tên, mà
 * không có gì báo — đúng kiểu hỏng im lặng đã phải sửa nhiều lần trong dự án này.
 *
 * ⚠️ CÁI GIÁ: một component thuần hiển thị mà biết tên một bước nghiệp vụ — có coupling.
 * Chấp nhận đánh đổi này vì nó đổi lại việc luật không thể bị quên; và `gopDauVaoVaoKetQua`
 * vẫn là cửa để nơi gọi ép bật/ép tắt khi cần.
 *
 * 📌 Thêm bước thứ hai thì đổi hằng số này thành `Set` chứ đừng viết `||` nối chuỗi — nối
 * chuỗi tới cái thứ ba là không ai đọc ra điều kiện nữa.
 */
const MA_BUOC_GOP_DAU_VAO_VAO_KET_QUA = "xet_duyet_bao_gia";

/**
 * ★★ NEO TỚI ĐÚNG MỘT BƯỚC — Sếp 16/09/2026: *"Thêm nút bấm về đúng bước lập PO này"*, đứng ở
 * trang chi tiết đơn hàng.
 *
 * 🔴 TRƯỚC ĐÂY KHÔNG NEO TỚI BƯỚC NÀO ĐƯỢC. `<section>` của mỗi giai đoạn không có `id`, nên từ
 * đơn hàng chỉ quay về được ĐẦU trang đề nghị — người dùng vẫn phải tự dò xuống giữa một trang
 * dài rồi tự mở đúng khối. Neo duy nhất app có tới nay là `NEO_NHAT_KY` bên `khoi-trao-doi.tsx`.
 *
 * 📌 SINH BẰNG HÀM, KHÔNG GÕ CHUỖI Ở NƠI GỌI. Nơi đặt neo và nơi trỏ tới neo là hai tệp khác
 * nhau; gõ tay hai chuỗi là chúng lệch nhau lúc nào không ai biết, và hỏng im lặng — bấm nút thì
 * trang đứng yên, không một lỗi nào.
 *
 * ⚠️ Tiền tố `buoc-` để không đụng `NEO_NHAT_KY` hay bất kỳ id nào khác trên trang.
 */
export function neoBuoc(maGiaiDoan: string): string {
  return `buoc-${maGiaiDoan}`;
}

export function KhoiDauVaoTheoGiaiDoan({ giaiDoan }: { giaiDoan: GiaiDoanDauVao[] }) {
  /**
   * Giai đoạn nào đang mở. **Mặc định GẬP HẾT** — mỗi lần vào trang, hoặc F5, đều về gập.
   *
   * 🔴 Ban lãnh đạo nhắc HAI LẦN (18/08/2026): *"chỗ này sửa lại, khi F5 là tự group lại"*, rồi
   * *"mục này sao F5 vẫn chưa chịu group lại"*.
   *
   * 🔴 LẦN ĐẦU TÔI HIỂU NGƯỢC Ý và làm sai hẳn: tưởng đây là lời phàn nàn *"F5 là bị gập mất"*
   * nên đi lưu trạng thái đang mở vào `localStorage` để giữ qua F5 — tức làm đúng cái trái
   * ngược với yêu cầu. Yêu cầu là: **F5 thì gập lại**. Nay đã bỏ hết phần lưu đó.
   *
   * 🔴 CŨNG BỎ luôn nếp "tự mở giai đoạn đang đứng". Khối trong ảnh Ban lãnh đạo khoanh đỏ
   * (*Yêu cầu NCC báo giá*) CHÍNH LÀ giai đoạn hiện tại, nên chỉ bỏ `localStorage` thôi thì F5
   * nó vẫn bung ra — vẫn đúng lỗi vừa bị nhắc. Muốn "F5 là gập lại" thật thì trạng thái đầu
   * phải là RỖNG.
   *
   * 📌 Không mất thông tin: nhãn phải mỗi khối vẫn ghi số trường bên trong (*"THU GỌN · 4"*),
   * nên gập hết vẫn đọc được khối nào có gì mà không phải mở ra.
   */
  const [mo, setMo] = useState<string[]>([]);

  const [xemTep, setXemTep] = useState<MoTaTep | null>(null);

  /**
   * ★★ TỚI BẰNG NEO THÌ TỰ MỞ ĐÚNG KHỐI ĐÓ — Sếp 16/09/2026 (*"Thêm nút bấm về đúng bước lập PO
   * này"*).
   *
   * 🔴 KHÔNG ĐỔI MẶC ĐỊNH GẬP HẾT. Ban lãnh đạo nhắc HAI LẦN (18/08/2026, xem `mo` ở trên) rằng
   * F5 phải gập lại; mở thêm một khối vì có neo thì không phạm vào đó — vào trang không neo vẫn
   * gập sạch, và F5 khi neo còn trên URL thì mở lại đúng một khối người dùng vừa chủ động tìm.
   *
   * 🔴 PHẢI TỰ MỞ CHỨ KHÔNG CHỈ CUỘN: khối gập thì nhảy tới nơi người dùng vẫn chỉ thấy một
   * thanh tiêu đề đóng, tưởng nút bấm hỏng. Neo mà không mở là nửa vời hơn không có neo.
   *
   * 📌 CUỘN BẰNG TAY SAU KHI MỞ. Trình duyệt tự cuộn tới `id` ngay lúc tải, lúc đó khối còn gập
   * nên vị trí tính ra sai; `requestAnimationFrame` đợi React vẽ xong nội dung vừa bung mới cuộn.
   *
   * ⚠️ `hashchange` để bấm lại đúng nút đó lần thứ hai vẫn chạy — trình duyệt không tải lại
   * trang khi hash không đổi, nhưng `router.push` cùng hash thì cũng không bắn sự kiện; đó là
   * giới hạn đã biết, không chữa ở đây.
   */
  useEffect(() => {
    const ma = giaiDoan.map((g) => g.ma).find((m) => `#${neoBuoc(m)}` === window.location.hash);
    if (!ma) return;
    setMo((cu) => (cu.includes(ma) ? cu : [...cu, ma]));
    const khung = requestAnimationFrame(() => {
      document.getElementById(neoBuoc(ma))?.scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(khung);
  }, [giaiDoan]);

  // Đánh số liên tục qua MỌI giai đoạn, không đánh lại từ 01 ở mỗi khối.
  let so = 0;

  return (
    <div className="flex flex-col gap-(--hp-md-row-gap)">
      {giaiDoan.map((g) => {
        /* ★ Khóa xổ khối (12/09/2026) — xem `khoaMoRong`. Khóa THẮNG trạng thái mở: ép gập kể cả
           khi người dùng đã mở từ trước rồi mới làm mất điều kiện. */
        const biKhoa = Boolean(g.khoaMoRong);
        const dangMo = mo.includes(g.ma) && !biKhoa;
        // Tính số thứ tự trước khi vẽ, kể cả khi khối đang gập — số phải giữ nguyên dù
        // người dùng gập mở khối nào.
        const truongCoSo = g.truong.map((t) => ({ ...t, so: ++so }));

        /* ★ BƯỚC GỘP ĐẦU VÀO VÀO KẾT QUẢ (13/09/2026) — xem `gopDauVaoVaoKetQua`.
           Dùng `??` chứ không `||`: nơi gọi truyền `false` là ép TẮT, còn `||` sẽ nuốt mất
           `false` rồi vẫn bật theo mã giai đoạn. */
        const gopVaoKetQua = g.gopDauVaoVaoKetQua ?? g.ma === MA_BUOC_GOP_DAU_VAO_VAO_KET_QUA;

        /**
         * Giai đoạn KHÔNG có trường nhập nào nhưng CÓ phần làm việc (bước ① chỉ có bảng
         * Phân bổ chẳng hạn) hoặc CÓ khu đính kèm thì bỏ luôn con số trên nhãn gập.
         *
         * Ghi "THU GỌN · 0" là nói dối người xem: họ đọc số 0 rồi bỏ qua khối, trong khi
         * bên trong là đúng cái bảng họ cần làm việc. Con số chỉ đếm TRƯỜNG ĐẦU VÀO, cố
         * cộng thêm phần làm việc vào cũng sai vì đó không phải trường đánh số.
         *
         * 🔴 TÍNH CẢ `khuDinhKem` từ 17/08/2026. Bước ⑤ chẳng hạn có thể không có trường nào
         * mà vẫn đang giữ ba tệp hợp đồng — nhãn "THU GỌN · 0" khiến người dùng đọc số 0 rồi
         * bỏ qua, đúng cái bẫy khối chú thích này sinh ra để tránh. Không cộng số tệp vào con
         * số ấy được: nó đếm TRƯỜNG ĐẦU VÀO đánh số 01→N, tệp không nằm trong dãy đó.
         *
         * ⚠️ Không biết được khu đính kèm có thật sự vẽ ra gì không (nó trả `null` khi trống
         * và không được sửa) — nên ở đây chọn IM LẶNG về con số thay vì đoán. Nói ít mà đúng
         * hơn là nói một con số có thể sai.
         */
        const anSoTruong =
          g.truong.length === 0 && (Boolean(g.noiDungNghiepVu) || Boolean(g.khuDinhKem));
        const nhanKhiMo = anSoTruong ? "" : `${g.truong.length} trường`;
        const nhanKhiGap = anSoTruong ? "THU GỌN" : `THU GỌN · ${g.truong.length}`;
        const nhanGap = dangMo ? nhanKhiMo : nhanKhiGap;

        /**
         * ★ DANH SÁCH TRƯỜNG TÁCH RA BIẾN (13/09/2026) — vì từ nay nó được vẽ ở MỘT TRONG HAI
         * chỗ: khối "ĐẦU VÀO" như cũ, hoặc nằm trong khối "KẾT QUẢ" với bước được gộp.
         *
         * 🔴 CỐ Ý CHỈ VIẾT MỘT LẦN, không chép ra hai nhánh. Chép ra thì lần sau ai sửa cách
         * hiện tệp ở một nhánh là hai bước cùng một app bày dữ liệu theo hai kiểu, mà lệch
         * kiểu này không ai soi ra khi đọc code — đúng bài học đã ghi ở `NhanPhanTrongGiaiDoan`.
         *
         * 📌 Trả `null` khi không có trường nào, để nơi dùng tự chọn câu trống cho hợp văn cảnh
         * ("chưa có dữ liệu nhập vào" ở khối ĐẦU VÀO, "chưa có kết quả" ở khối KẾT QUẢ).
         */
        const danhSachTruong =
          truongCoSo.length === 0 ? null : (
            <dl className="flex flex-col gap-(--hp-md-row-gap)">
              {truongCoSo.map((t) => (
                <div key={t.nhan} className="flex gap-3">
                  {/* Số thứ tự cột trái, đúng kiểu Base — `tabular-nums` để 01 và 12
                      thẳng hàng nhau. */}
                  <dt className="w-6 shrink-0 pt-0.5 text-xs text-text-disabled tabular-nums">
                    {String(t.so).padStart(2, "0")}
                  </dt>
                  <dd className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-xs text-text-desc">{t.nhan}</span>

                    {t.giaTri !== undefined && (
                      <span className="text-sm font-medium text-text-primary">
                        {t.giaTri || "—"}
                      </span>
                    )}

                    {t.noiDung}

                    {(t.tep ?? []).length > 0 && (
                      <ul className="flex flex-wrap gap-1.5">
                        {(t.tep ?? []).map((tp) => (
                          <li key={tp.id}>
                            <button
                              type="button"
                              onClick={() => setXemTep(tp)}
                              className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-xs text-text-secondary transition-colors hover:border-primary hover:text-primary"
                            >
                              <span className="truncate" title={tp.tenTep}>
                                {rutGonTenTep(tp.tenTep, 34)}
                              </span>
                              <span className="shrink-0 text-text-desc">{coTep(tp.kichThuoc)}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          );

        return (
          /* 🔴 KHỐI BƯỚC CÓ VIỀN MÀU NHẬN DIỆN — Ban lãnh đạo 17/08/2026: *"các mục chính này
             e đánh màu lên cho dễ nhận dạng, đánh màu đường border và đổ nền nhạt thôi"*.

             VÌ SAO CẦN: sáu khối bước và các khối phụ (Thông tin đề nghị, Danh sách công việc,
             Trao đổi) trước đây dùng CÙNG một viền xám + nền `bg-surface`, nên nhìn cả trang
             là một dãy hộp giống hệt nhau — không đọc ra đâu là mốc chính của quy trình.

             📌 CHỈ đổi viền và nền, đúng chữ *"thôi"* của Ban lãnh đạo: không đổi cỡ chữ,
             không thêm biểu tượng, không đổi khoảng cách. `border-primary/30` + `bg-primary-bg`
             đều là token có sẵn (dùng ở khối "Đã tách thành N đề xuất con"), tự đổi theo
             Sáng/Tối, không có mã màu viết cứng.

             ⚠️ Chỉ tô DÒNG TIÊU ĐỀ, không tô cả thân khối: tô hết thì phần nội dung bên trong
             (bảng phân bổ, form lập đơn, danh sách tệp) chìm vào nền xanh và mất chỗ nghỉ mắt. */
          /* ★ VIỀN ĐỎ KHI BƯỚC CÒN THIẾU (23/08/2026) — xem chú thích ở khai báo `conThieu`.
             📌 Đổi CẢ viền lẫn nền dòng tiêu đề sang tông danger, giữ đúng nếp "chỉ tô dòng tiêu
             đề" của khối này. Và luôn kèm CHỮ (dòng lý do ngay dưới tiêu đề) — V1.1 buộc trạng
             thái phải có cả màu lẫn chữ, người không phân biệt được màu vẫn phải đọc ra. */
          <section
            key={g.ma}
            id={neoBuoc(g.ma)}
            /* Chừa chỗ cho thanh trên cố định 60px khi trình duyệt cuộn tới neo — không có nó thì
               tiêu đề khối chui lên dưới thanh và người dùng tưởng nhảy sai chỗ. */
            className={`scroll-mt-20 overflow-hidden rounded-xl border bg-surface ${
              g.conThieu ? "border-danger" : "border-primary/30"
            }`}
          >
            <button
              type="button"
              /* Bị khóa thì KHÔNG cho mở. Không dùng `disabled` để vẫn đọc được `aria-disabled`
                 và giữ nút trong thứ tự Tab — người dùng bấm vào phải thấy lý do ngay dưới,
                 chứ không phải bấm mãi mà không hiểu sao không mở. */
              onClick={() => {
                if (biKhoa) return;
                setMo((cu) => (cu.includes(g.ma) ? cu.filter((x) => x !== g.ma) : [...cu, g.ma]));
              }}
              aria-expanded={dangMo}
              aria-disabled={biKhoa}
              className={`flex min-h-11 w-full items-center gap-2 px-(--hp-md-card-pad) py-3 text-left transition-colors ${
                biKhoa
                  ? "cursor-not-allowed bg-muted"
                  : g.conThieu
                    ? "bg-danger-bg hover:bg-danger/10"
                    : "bg-primary-bg hover:bg-primary/10"
              }`}
            >
              <ChevronRight
                className={`size-4 shrink-0 transition-transform ${dangMo ? "rotate-90" : ""} ${
                  g.conThieu ? "text-danger" : "text-primary"
                }`}
                aria-hidden
              />
              {/* 🔴 DÙNG ĐÚNG KIỂU CHỮ CỦA `KhoiGap` (Ban lãnh đạo 16/08/2026: *"đưa cỡ chữ và
                  font chữ về giống nhau"*). Khối "Thông tin đề nghị" ngay phía trên là một
                  `KhoiGap`, nên hai khối nằm cạnh nhau mà lệch cỡ chữ là thấy ngay. Nếu sau
                  này đổi kiểu tiêu đề gập thì phải đổi cả hai chỗ.

                  📌 Màu chữ nâng từ `text-text-desc` lên `text-primary`: trên nền xanh nhạt,
                  chữ xám mờ tụt tương phản xuống dưới ngưỡng đọc được. */}
              <span
                className={`text-[11px] font-semibold tracking-wide uppercase ${
                  g.conThieu ? "text-danger" : "text-primary"
                }`}
              >
                {g.nhan}
              </span>
              {/* ★ CHỮ ĐI KÈM MÀU ĐỎ (23/08/2026) — V1.1 buộc trạng thái phải có cả màu lẫn chữ.
                  Chỉ một chữ "Còn thiếu" ở đây, còn lý do đầy đủ nằm ở `title` và ở dải đỏ trong
                  thân khối: tiêu đề khối phải giữ một dòng, nhồi cả câu vướng mắc vào là vỡ hàng
                  trên màn hẹp. */}
              {g.conThieu && (
                <span
                  title={g.conThieu}
                  className="shrink-0 rounded-md bg-card px-1.5 py-0.5 text-[11px] font-semibold text-danger"
                >
                  Còn thiếu
                </span>
              )}
              {/* Nhãn trạng thái gập bên phải — Base ghi "COLLAPSED" / "THU GỌN". Kèm số
                  trường để biết khối có gì mà không phải mở ra. Nhãn rỗng thì không vẽ ô,
                  một ô xám trống trơn còn khó hiểu hơn là không có gì. */}
              {/* Nền `bg-card` chứ không `bg-muted`: dòng tiêu đề giờ là nền xanh nhạt, mà
                  `--color-muted` trong `app/globals.css` đúng bằng `--hp-surface` nên ô nhãn
                  sẽ lẫn vào nền xanh thay vì nổi lên như khi nền còn trắng. */}
              {/* Bị khóa thì thay nhãn "THU GỌN · n" bằng ổ khóa — nhãn kia mời người ta bấm mở,
                  mà bấm thì không mở được. */}
              {biKhoa ? (
                <span className="ml-auto flex shrink-0 items-center gap-1 rounded-md bg-card px-1.5 py-0.5 text-[11px] font-semibold text-text-secondary">
                  <Lock className="size-3" aria-hidden />
                  Đang khóa
                </span>
              ) : (
                nhanGap && (
                  <span className="ml-auto shrink-0 rounded-md bg-card px-1.5 py-0.5 text-[11px] font-medium text-text-secondary tabular-nums">
                    {nhanGap}
                  </span>
                )
              )}
            </button>

            {/* ★ LÝ DO BỊ KHÓA (12/09/2026) — hiện THƯỜNG TRỰC, không đợi bấm mới biết.
                V1.1 buộc trạng thái phải có cả màu lẫn chữ; ổ khóa trên tiêu đề là màu, đây là chữ. */}
            {g.khoaMoRong && (
              <p className="flex items-start gap-2 border-t border-border bg-warning-bg px-(--hp-md-card-pad) py-2.5 text-sm text-warning-soft">
                <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{g.khoaMoRong}</span>
              </p>
            )}

            {/* 🔴 HAI CÁCH GẬP, tùy khối có form nhập liệu hay không — xem `giuNoiDungKhiGap`.
                · Khối thường: gập là THÁO khỏi cây React (nhẹ trang, không có gì để mất).
                · Khối có form (bước ④ từ 17/08/2026): gập chỉ ẩn bằng `hidden` (display:none),
                  giữ nguyên mọi ô người dùng đang gõ. `display:none` cũng đưa nội dung ra khỏi
                  thứ tự Tab và khỏi trình đọc màn hình, nên vẫn đúng nghĩa "đã thu gọn". */}
            {(dangMo || g.giuNoiDungKhiGap) && (
              <div className={dangMo ? undefined : "hidden"}>
              {/* `text-sm` khai rõ ở đây để chữ nào quên khai cỡ cũng ra 14px như phần còn
                  lại của trang, chứ không rơi về 16px mặc định của trình duyệt rồi to hơn
                  cả nội dung xung quanh. */}
              {/* ★ BƯỚC ĐƯỢC GỘP THÌ KHỐI NÀY CHỈ CÒN DẢI ĐỎ (13/09/2026) — danh sách trường
                  chuyển xuống nằm trong khối KẾT QUẢ, xem `gopDauVaoVaoKetQua`.
                  🔴 DẢI ĐỎ "CÒN THIẾU" PHẢI Ở LẠI ĐÂY, nên điều kiện vẽ tách riêng chứ không
                  gộp chung với `!gopVaoKetQua`. Đẩy dải đỏ xuống trong khối KẾT QUẢ là mất đúng
                  cái nếp "câu vướng mắc là thứ đọc được đầu tiên khi mở khối" (23/08/2026).
                  📌 Không còn gì để vẽ thì KHÔNG vẽ cả thẻ: một khung có viền trên cùng khoảng
                  đệm mà rỗng ruột còn khó hiểu hơn là không có gì (cùng lý do `empty:hidden` ở
                  khu đính kèm bên dưới). */}
              {(g.conThieu || !gopVaoKetQua) && (
                <div className="border-t border-divider p-(--hp-md-card-pad) text-sm">
                  {/* ★ DẢI ĐỎ NÓI RÕ CÒN THIẾU GÌ — đặt ở ĐẦU thân khối, trên cả "ĐẦU VÀO"
                      (23/08/2026). Người mở khối ra là để xử lý chỗ thiếu, nên câu đó phải là thứ
                      đọc được đầu tiên, không phải nằm lẫn giữa các trường dữ liệu.
                      📌 Câu chữ do `vuongMacSangBuocSau` sinh ra — CÙNG một câu với hộp kéo thả và
                      nút chuyển bước, nên ba chỗ không bao giờ nói khác nhau. */}
                  {g.conThieu && (
                    <p
                      className={`flex items-start gap-2 rounded-lg border border-danger bg-danger-bg p-(--hp-md-row-pad) text-xs font-medium text-danger ${
                        gopVaoKetQua ? "" : "mb-3"
                      }`}
                    >
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {g.conThieu}
                    </p>
                  )}

                  {!gopVaoKetQua && (
                    <>
                      <NhanPhanTrongGiaiDoan icon={LogIn} className="mb-2">
                        ĐẦU VÀO
                      </NhanPhanTrongGiaiDoan>

                      {danhSachTruong ?? (
                        <p className="text-sm text-text-desc">
                          Giai đoạn này chưa có dữ liệu nhập vào.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ★ TỆP ĐÍNH KÈM CỦA BƯỚC — Ban lãnh đạo 17/08/2026: *"mục đính kèm file"*.

                  🔴 ĐỨNG TRƯỚC KHỐI "KẾT QUẢ" từ 22/08/2026 — Ban lãnh đạo: *"Đưa trường này
                  xuống dưới phần đính kèm file"* (mũi tên chỉ khối KẾT QUẢ của bước ②).

                  VÌ SAO ĐÚNG: khối KẾT QUẢ chứa nút đi tiếp ("Trình xét duyệt báo giá", "Lập đơn
                  đặt hàng"), mà **điều kiện bấm được nút đó chính là các tệp ở khu đính kèm**.
                  Xếp nút lên trên các ô tệp là bắt người dùng đọc ngược: thấy nút khóa trước, rồi
                  mới thấy chỗ làm cho nó mở. Nay đọc từ trên xuống đúng mạch làm việc:
                  đầu vào → chứng từ đính kèm → kết quả và nút đi tiếp.

                  📌 SỬA MỘT LẦN ÁP CHO MỌI BƯỚC — thứ tự này chỉ dựng ở đây, cả 9 bước dùng chung.

                  🔴 NẰM NGOÀI nhánh "chưa có dữ liệu nhập vào" của phần ĐẦU VÀO — bước ②
                  chỉ có đúng một trường "SL Báo giá" và bước ③ có thể không có trường nào,
                  nhưng đó lại chính là hai bước cần chỗ dán báo giá nhất. Gộp vào nhánh ấy
                  là khu đính kèm biến mất đúng lúc cần nó nhất.

                  ⚠️ `empty:hidden` là CỐ Ý: `KhuDinhKemGiaiDoan` trả `null` khi bước chưa có
                  tệp và người xem không được thêm — lúc đó thẻ này rỗng và phải tự ẩn, nếu
                  không sẽ để lại một dải kẻ ngang cùng khoảng đệm trống trơn. Không thể kiểm
                  bằng `g.khuDinhKem && …` vì một phần tử React luôn "có thật" dù nó vẽ ra
                  `null`. */}
              {g.khuDinhKem && (
                <div className="border-t border-divider p-(--hp-md-card-pad) text-sm empty:hidden">
                  {g.khuDinhKem}
                </div>
              )}

              {/* PHẦN LÀM VIỆC của giai đoạn — nằm NGOÀI nhánh "chưa có dữ liệu nhập vào"
                  ở trên, vì hai thứ độc lập nhau: bước ① chưa nhập trường nào nhưng vẫn
                  phải phân bổ người phụ trách. Gộp vào nhánh đó là khối làm việc biến mất
                  đúng lúc cần nó nhất.
                  Đường kẻ ngang tách bạch "cái đã nhập vào" với "cái phải làm". */}
              {/* ★ BƯỚC ĐƯỢC GỘP THÌ LUÔN VẼ KHỐI NÀY (13/09/2026), kể cả khi không có phần
                  nghiệp vụ — vì danh sách trường nay nằm TRONG đây. Giữ nguyên điều kiện cũ là
                  người không có quyền xem báo giá (`noiDungNghiepVu` ra `false`) sẽ mất trắng cả
                  danh sách trường vốn vẫn hiện cho họ trước hôm nay: một thay đổi chữ nghĩa mà
                  âm thầm giấu mất dữ liệu. */}
              {(g.noiDungNghiepVu || gopVaoKetQua) && (
                /* Cũng khai `text-sm` như phần ĐẦU VÀO — hai phần nằm trong cùng một khối
                   thì nền cỡ chữ phải giống nhau, không để một bên 14px một bên 16px. */
                /* ★★★ TỰ ẨN KHI RUỘT KHÔNG VẼ RA GÌ (15/09/2026) — xem `.an-khi-ruot-rong` trong
                   `app/globals.css`, ở đó có đủ lý do và cả hai ca hiếm bị ẩn nhầm.
                   🔴 ĐẶT TRÊN THẺ NGOÀI CÙNG, không đặt trên khung xanh bên trong: thẻ này mang cả
                   đường kẻ `border-t` lẫn khoảng đệm, ẩn mỗi khung xanh là vẫn để lại một vệt kẻ
                   ngang với một khoảng trống — đúng cái Sếp bảo "Bỏ luôn". */
                <div className="an-khi-ruot-rong border-t border-divider p-(--hp-md-card-pad) text-sm">
                  {/**
                   * ★ NHÃN "KẾT QUẢ" — Ban lãnh đạo 19/08/2026: *"Thêm nút 'Kết quả' để phân biệt
                   * rõ đâu là đầu vào đâu là đầu ra. Thêm cho tất cả các bước luôn, và có border
                   * + fill màu xanh lá nhạt"*.
                   *
                   * VÌ SAO CẦN: mỗi khối bước có hai phần khác hẳn nhau về nghĩa — thứ **nhập
                   * vào** để làm bước đó, và thứ bước đó **đẻ ra**. Trước đây chỉ phần trên có
                   * nhãn ("ĐẦU VÀO"), phần dưới không có nhãn nào, nên bảng báo giá hay danh sách
                   * đơn hàng nhìn như phần nối tiếp của đầu vào. Người đọc hồ sơ không phân biệt
                   * được cái gì là dữ liệu đưa vào, cái gì là sản phẩm của bước.
                   *
                   * 🔴 MÀU XANH LÁ LÀ TOKEN `success`, KHÔNG phải mã màu viết cứng. Design System
                   * V1.1: `#60BB46` là tông Success — đúng nghĩa "đã làm ra được", và tương phản
                   * với xanh dương `primary` đang dùng cho dòng tiêu đề bước. Cả `border-success`
                   * lẫn `bg-success-bg` đều đã có sẵn trong `app/globals.css` (đã kiểm trước khi
                   * dùng — Tailwind bỏ qua IM LẶNG lớp màu không tồn tại, mất màu mà không báo).
                   *
                   * 📌 Đặt trong `noiDungNghiepVu` nên **tự áp cho mọi bước** có phần kết quả,
                   * không phải đi sửa từng khối ở `de-nghi-chi-tiet.tsx`. Bước nào chưa có kết
                   * quả thì cả cụm không vẽ ra — không để lại một khung xanh rỗng.
                   *
                   * ⚠️ MỘT NGOẠI LỆ TỪ 13/09/2026: bước bật `gopDauVaoVaoKetQua` thì cụm này VẪN
                   * vẽ dù `noiDungNghiepVu` trống, vì danh sách trường đã dời vào trong đây —
                   * không vẽ là giấu mất dữ liệu. Khung vẫn không bao giờ rỗng: trống cả hai thì
                   * có câu *"Bước này chưa có kết quả nào."* thế chỗ.
                   */}
                  {/* 🔴 NỀN XANH NHẠT HƠN — Ban lãnh đạo 21/08/2026: *"giảm màu xanh nhạt hơn,
                      sửa cho các bước khác luôn"*.
                      Hạ `bg-success-bg` → `/30` và viền `/30` → `/20`: khối KẾT QUẢ chứa cả bảng
                      dữ liệu, nền đậm làm chữ trong bảng phải cạnh tranh với nền. Vẫn giữ đủ sắc
                      xanh để phân biệt với khối ĐẦU VÀO.
                      📌 SỬA MỘT LẦN ÁP CHO MỌI BƯỚC: khối KẾT QUẢ chỉ dựng ở đây, cả 7 bước đều
                      dùng chung — không có chỗ thứ hai phải sửa theo.
                      ⚠️ Dùng ĐỘ MỜ của token thay vì thêm mã màu mới (quy tắc Design System: chỉ
                      4 tông ngữ nghĩa), nên Dark Mode tự thích ứng, không phải khai màu riêng. */}
                  <div className="rounded-xl border border-success/20 bg-success-bg/30 p-(--hp-md-card-pad)">
                    <NhanPhanTrongGiaiDoan icon={LogOut} className="mb-2 text-success-soft">
                      KẾT QUẢ
                    </NhanPhanTrongGiaiDoan>
                    {/* ★ BƯỚC GỘP (13/09/2026) — danh sách trường đứng TRONG khối KẾT QUẢ, ngay
                        trên phần nghiệp vụ, dưới đúng MỘT nhãn "KẾT QUẢ".
                        🔴 Ban lãnh đạo 13/09/2026 về bước ③: *"Đổi chữ luôn, vì đầu vào và kết quả
                        của bước này là 1 nên hãy để chữ 'Kết quả'"* — xem `gopDauVaoVaoKetQua`.
                        📌 Bọc bằng `flex flex-col gap-…` chứ không nhét khoảng cách bằng `mb-…`
                        vào từng phần: phần nào vắng thì không để lại khoảng trống thừa. */}
                    {/* ★★★ VÙNG RUỘT ĐƯỢC ĐÁNH DẤU (15/09/2026) — `.an-khi-ruot-rong` ở thẻ ngoài
                        cùng soi đúng vào đây để biết bước này có kết quả gì không. Nhãn "KẾT QUẢ"
                        phải nằm NGOÀI dấu này, nếu không chính nó lại làm vùng ruột thành "có nội
                        dung" và luật ẩn không bao giờ chạy. */}
                    <div data-ruot-khoi>
                      {gopVaoKetQua ? (
                        <div className="flex flex-col gap-(--hp-md-row-gap)">
                          {danhSachTruong}
                          {g.noiDungNghiepVu}
                          {/* Trống cả hai thì nói thẳng, đừng để một khung xanh rỗng không ai hiểu
                              là lỗi hay là chưa tới lượt. Câu này KHÔNG dùng chữ "nhập vào" như
                              khối ĐẦU VÀO: ở bước gộp, thứ đang thiếu là KẾT QUẢ.
                              📌 Câu này cũng chính là thứ giữ cho bước GỘP (bước ③) không bị luật
                              ẩn mới nuốt mất: nó là nội dung thật, nên vùng ruột không rỗng. */}
                          {!danhSachTruong && !g.noiDungNghiepVu && (
                            <p className="text-sm text-text-desc">Bước này chưa có kết quả nào.</p>
                          )}
                        </div>
                      ) : (
                        g.noiDungNghiepVu
                      )}
                    </div>
                  </div>
                </div>
              )}

              </div>
            )}
          </section>
        );
      })}

      {/* 🔴 GIỮ HỘP TRONG CÂY, CHỈ ĐỔI `mo`. Cách cũ `{xemTep && <HopXemTep … mo … />}` tháo cả
          `<Dialog>` khỏi cây React ngay trong lần commit mà `open` vẫn còn `true` → base-ui không
          chạy được hàm dọn, để kẹt `overflow:hidden` trên `<body>` và `data-base-ui-inert` trên
          app: cả app bấm không ăn, phải F5. Sự cố Sếp báo 13 và 14/09/2026.
          📌 `tep={xemTep}` kể cả khi về `null` là đúng — `HopXemTep` tự giữ tệp cuối cho hiệu ứng
          đóng chạy hết. Phân tích đầy đủ ở `thanh-phan-dung-chung/don-dep-hop-thoai-ket.ts`. */}
      <HopXemTep tep={xemTep} mo={xemTep !== null} onDong={() => setXemTep(null)} />
    </div>
  );
}
