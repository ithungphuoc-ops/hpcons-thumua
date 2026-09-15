// ============================================================
// HƯỚNG DẪN NGHIỆP VỤ TỪNG GIAI ĐOẠN — chép từ quy trình THẬT của công ty
//
// 🔴 NGUỒN: bảng "TM-QT Mua hàng (HP CONS)" đang chạy trên Base.vn, mục "Hướng dẫn hoàn
// thành các nhiệm vụ trong giai đoạn". Ban lãnh đạo cung cấp ảnh chụp 6 bước ngày
// 11/08/2026 kèm yêu cầu *"đọc kiểm tra và làm lại theo đúng quy trình này, thêm nút để
// bấm vô sẽ đọc được hướng dẫn sử dụng"*.
//
// 🔴 ĐÂY LÀ VĂN BẢN NGHIỆP VỤ, KHÔNG PHẢI CHỮ GIAO DIỆN. Chép nguyên văn, kể cả những ý
// app chưa làm được (hợp đồng ≥20 triệu, thiết bị hiệu chuẩn QA-QC, NCC Nam Hưng...).
// ⚠️ ĐỪNG "viết lại cho gọn" hay bỏ ý — người dùng đối chiếu chữ ở đây với quy trình giấy
// và với bảng Base; lệch một chữ là họ mất tin vào cả app. Muốn sửa phải có văn bản mới.
//
// 📌 Các ngưỡng tiền trong này (5 / 10 / 20 triệu) là LUẬT THẬT. Phần app đã cài đặt được
// nằm ở `nguong-gia-tri.ts`.
//
// 📌 15/08/2026 — Ban lãnh đạo: *"bỏ hết các ghi chú kiểu này đi"*. Khối "Phần app chưa làm
// thay được" đã BỎ KHỎI GIAO DIỆN (nó là ghi chú của đội triển khai, không phải việc người
// dùng cần đọc mỗi lần mở hướng dẫn). Nội dung giữ lại dưới dạng CHÚ THÍCH ngay tại từng
// giai đoạn bên dưới — người bảo trì vẫn tra được app còn thiếu gì so với quy trình giấy.
// ============================================================

import type { GiaiDoanMuaHang } from "@/2-quy-trinh/giai-doan-mua-hang";

export interface HuongDanGiaiDoan {
  /** Tên đầy đủ của giai đoạn đúng như trên bảng Base — dài hơn nhãn cột trong app. */
  tenDayDu: string;
  /** Thời lượng chuẩn của bước, tính bằng giờ làm việc (Base hiển thị "4.00h"). */
  gioChuan?: number;
  /** Nội dung hướng dẫn, mỗi phần tử là một đoạn. */
  noiDung: DoanHuongDan[];
  /**
   * ★ BƯỚC NÀY KHÔNG CÓ HƯỚNG DẪN TRÊN BẢNG BASE — nội dung bên trên là **cách app xác
   * định**, không phải văn bản quy trình của công ty.
   *
   * 🔴 Bắt buộc đánh dấu, và hộp hướng dẫn phải nói rõ ra. Trộn lẫn "quy trình công ty
   * quy định" với "app đang làm thế" là kiểu nhầm lẫn nguy hiểm nhất: người dùng sẽ trích
   * chữ trong app ra để tranh luận nghiệp vụ, trong khi đó chỉ là mô tả kỹ thuật.
   */
  khongCoTrenBase?: boolean;
  /**
   * ★ NỘI DUNG ĐANG HIỆN LÀ BẢN CÔNG TY TỰ SỬA, không phải bản gốc trong mã nguồn.
   *
   * 🔴 Bắt buộc hiện ra cho người đọc biết. Người dùng đối chiếu hộp này với quy trình giấy;
   * lệch nhau mà không nói rõ "bản này đã được chỉnh" thì họ tưởng app hiển thị sai, hoặc tệ
   * hơn là tưởng quy trình giấy đã đổi. Cờ do `huongDanHienThi` đặt, không tự khai trong dữ liệu.
   */
  daTuyChinh?: boolean;
}

export interface DoanHuongDan {
  /** Đoạn văn bình thường. */
  van?: string;
  /** Danh sách gạch đầu dòng. */
  gach?: string[];
  /** Đoạn cần nhấn — quy tắc có ngưỡng tiền, người duyệt, số lượng báo giá. */
  nhanManh?: boolean;
  /** Câu "Lưu ý" / "Chú ý" cuối mục. */
  luuY?: string;
}

/**
 * Hướng dẫn theo từng giai đoạn.
 *
 * ⚠️ `hoan_thanh` và `that_bai` KHÔNG có hướng dẫn trên bảng Base (hai cột kết thúc). Vẫn có
 * mục cho hai bước đó, nhưng nội dung là **điều kiện app dùng để xếp thẻ vào cột**, lấy thẳng
 * từ `xacDinhGiaiDoan` và `poDuDieuKienHoanThanh` — sự thật kỹ thuật, KHÔNG phải văn bản
 * nghiệp vụ. Bắt buộc kèm cờ `khongCoTrenBase` để hộp hướng dẫn nói rõ chuyện đó.
 * 🔴 Vẫn giữ nguyên luật: không bịa quy trình công ty cho đủ bộ.
 */
export const HUONG_DAN_GIAI_DOAN: Partial<Record<GiaiDoanMuaHang, HuongDanGiaiDoan>> = {
  tiep_nhan: {
    tenDayDu: "Tiếp nhận và kiểm tra phiếu đề nghị",
    gioChuan: 4,
    noiDung: [
      {
        van: "Các bộ phận có nhu cầu sẽ đề nghị trực tiếp cho Phòng Thu mua (P.TMCU) và Bộ phận Kho (BPK). Sau đó P.TMCU kiểm tra thông tin trên phiếu:",
      },
      {
        nhanManh: true,
        gach: [
          "Đầy đủ: TP.TMCU tiếp nhận, xác định số lượng báo giá NCC cần tìm và giao việc cho NV.TMCU",
          "Chưa đầy đủ: đề nghị bổ sung thêm hoặc từ chối tiếp nhận",
        ],
      },
      {
        gach: [
          "Nếu hàng hóa dịch vụ do NCC Nam Hưng cấp thì P.TMCU gửi thông tin cho NCC để giao hàng kịp thời, sau đó tiến hành bổ sung các bước theo quy trình mua hàng.",
          "Đối với máy móc hiệu chuẩn: các bộ phận làm danh sách đề xuất gửi QA-QC xem xét, duyệt mua mới hoặc xuất kho → chuyển phiếu đề nghị cho P.TMCU tiến hành thực hiện.",
          "Đối với thiết bị đo hiệu chuẩn: QA-QC gửi cho P.TMCU danh sách thiết bị đo phải hiệu chuẩn trước khi đơn vị sử dụng → chuyển phiếu đề nghị P.TMCU tiến hành thực hiện.",
          "Nếu nhận chỉ đạo trực tiếp từ Ban Tổng Giám đốc chỉ định NCC → P.TMCU tiến hành đặt hàng, đồng thời bổ sung hoàn thiện các bước trong quá trình mua hàng.",
        ],
      },
      { luuY: "Những máy móc — thiết bị đo phải có tem hiệu chuẩn của QA-QC mới được phép sử dụng." },
    ],
    /* 📌 App chưa làm thay được (bỏ khỏi giao diện 15/08/2026, giữ để tra):
     *   · App chưa có luồng “từ chối tiếp nhận” và “yêu cầu bổ sung” gửi ngược về bộ phận đề nghị — hiện chỉ có “Đánh dấu thất bại”.
     *   · App chưa phân biệt hàng hiệu chuẩn (QA-QC) hay NCC chỉ định sẵn — các trường hợp này vẫn phải xử lý ngoài app.
     */
  },

  yeu_cau_bao_gia: {
    tenDayDu: "Yêu cầu NCC báo giá, trình mẫu",
    gioChuan: 12,
    noiDung: [
      {
        van: "Nếu Ban Giám đốc chỉ định NCC thì TMCU tiến hành mua hàng theo bước “Lập đơn hàng, đàm phán và ký kết hợp đồng”.",
      },
      {
        van: "NV.TMCU tập hợp các báo giá, hàng mẫu… của các NCC, giải trình lựa chọn NCC và trình TP.TMCU xem xét.",
      },
      {
        nhanManh: true,
        van: "Số lượng báo giá tối thiểu:",
        gach: [
          "02 báo giá — khi giá trị đơn hàng từ 10 triệu đồng trở lên",
          "01 báo giá — khi NCC có trong danh mục NCC hàng năm và giá trị từ 5 triệu đồng trở lên; hoặc giá trị đơn hàng dưới 10 triệu đồng; hoặc TP.TMCU / quản lý phòng ban đề nghị chỉ định NCC",
        ],
      },
      {
        luuY: "Đối với NCC mới, nếu đơn hàng trị giá từ 20 triệu đồng trở lên thì NV.TMCU phải cập nhật “Danh sách nhà cung cấp” ngay sau khi hoàn thành công tác giao nhận hàng.",
      },
    ],
    /* 📌 App chưa làm thay được (bỏ khỏi giao diện 15/08/2026, giữ để tra):
     *   · App chưa có “Danh sách nhà cung cấp hàng năm” nên không tự biết NCC nào thuộc danh mục — điều kiện 01 báo giá cho NCC trong danh mục phải tự đối chiếu.
     *   · App chưa lưu hàng mẫu và văn bản giải trình lựa chọn NCC.
     */
  },

  xet_duyet_bao_gia: {
    tenDayDu: "Xét duyệt báo giá",
    gioChuan: 4,
    noiDung: [
      {
        van: "Các báo giá của NCC được xét duyệt dựa trên:",
        gach: [
          "So sánh báo giá và các điều kiện mua hàng cùng một mặt hàng của các NCC khác nhau",
          "So sánh báo giá mới với báo giá cũ cho cùng một mặt hàng của các NCC khác nhau",
        ],
      },
      {
        nhanManh: true,
        van: "Người xét duyệt tùy theo giá trị đơn hàng:",
        gach: [
          "Giá trị đơn hàng dưới 10 triệu đồng: TP.TMCU duyệt",
          "Giá trị đơn hàng từ 10 triệu đồng trở lên: Tổng Giám đốc duyệt",
        ],
      },
      {
        gach: [
          "Đồng ý: lập đơn hàng, ký kết hợp đồng.",
          "Không đồng ý: TP.TMCU đàm phán lại giá, hoặc phân công NV.TMCU tìm báo giá mới của NCC khác.",
        ],
      },
    ],
    /* 📌 App chưa làm thay được (bỏ khỏi giao diện 15/08/2026, giữ để tra):
     *   · App chưa có tài khoản Tổng Giám đốc ký duyệt — đơn từ 10 triệu đồng trở lên vẫn phải trình TGĐ ngoài app rồi mới bấm duyệt.
     *   · App chưa lưu lịch sử báo giá cũ của cùng một mặt hàng để so sánh theo thời gian.
     */
  },

  lap_don_mua_hang: {
    tenDayDu: "Lập đơn mua hàng, đàm phán và ký kết hợp đồng KT/MB/NT",
    gioChuan: 8,
    noiDung: [
      {
        van: "Sau khi hoàn tất việc phê duyệt báo giá, NV.TMCU lập “Đơn mua hàng” trình TP.TMCU kiểm tra — ký duyệt; đơn mua hàng phải được ký xác nhận giữa 2 bên.",
      },
      {
        nhanManh: true,
        van: "Đối với đơn hàng trên 5 triệu đồng:",
        gach: [
          "NV.TMCU lập Đơn mua hàng, trình TP.TMCU ký duyệt, sau đó gửi đến NCC ký xác nhận",
        ],
      },
      {
        nhanManh: true,
        van: "Đối với đơn hàng từ 20 triệu đồng trở lên:",
        gach: [
          "TP.TMCU đàm phán và soạn thảo Hợp đồng kinh tế / mua bán / nguyên tắc căn cứ nhu cầu của 02 bên, trình Tổng Giám đốc xem xét và ký duyệt hợp đồng",
          "Biểu mẫu hợp đồng: theo mẫu công ty, hoặc dùng mẫu của NCC (phải được Tổng Giám đốc thông qua)",
        ],
      },
      {
        luuY: "Trường hợp Tổng Giám đốc chưa ký duyệt hợp đồng, TP.TMCU có thể thực hiện các bước tiếp theo với điều kiện NCC đã ký tên đóng dấu trên hợp đồng và Tổng Giám đốc đã thông qua.",
      },
    ],
    /* 📌 App chưa làm thay được (bỏ khỏi giao diện 15/08/2026, giữ để tra):
     *   · App chưa quản lý hợp đồng kinh tế / mua bán / nguyên tắc — đơn từ 20 triệu đồng trở lên phải soạn và ký hợp đồng ngoài app.
     *   · App chưa lưu chữ ký xác nhận của NCC trên đơn mua hàng.
     */
  },

  dat_hang: {
    tenDayDu: "Tiến hành đặt hàng",
    gioChuan: 4,
    noiDung: [
      {
        van: "Sau khi đơn mua hàng và hợp đồng đã được ký kết đầy đủ giữa hai bên, NV.TMCU liên hệ NCC để xác định việc đặt hàng đúng như thỏa thuận trong hợp đồng.",
      },
      {
        van: "NV.TMCU thông báo cho phòng ban đã đề nghị cung cấp hàng hóa dịch vụ (nơi nhận) về thông tin hàng hóa và thời gian giao hàng, để họ có kế hoạch chuẩn bị mặt bằng lưu kho. Nếu là hàng hóa nhập kho tổng thì chuyển tiếp công việc sang Bộ phận Kho.",
      },
    ],
  },

  nhan_hang: {
    tenDayDu: "Tiến hành nhận hàng",
    gioChuan: 4,
    noiDung: [
      {
        van: "NV.TMCU theo dõi việc giao nhận hàng giữa NCC và phòng ban nhận hàng để kịp thời xử lý khi có vấn đề:",
      },
      {
        nhanManh: true,
        gach: [
          "Hàng hóa theo dõi trong kho: Thủ kho thực hiện theo quy trình nhập kho, sau đó cập nhật chứng từ giao nhận để xác nhận việc nhận hàng đầy đủ",
          "Hàng hóa mua ngoài: TP.TMCU tạo công việc giao cho thủ kho công trình / cán bộ kỹ thuật nơi tiếp nhận, để xác nhận việc nhận hàng đầy đủ từ NCC",
        ],
      },
      {
        luuY: "Khi phát sinh sự không phù hợp trong quá trình giao hàng thì ghi nhận thông tin vào “Phiếu theo dõi nhà cung cấp”.",
      },
    ],
    /* 📌 App chưa làm thay được (bỏ khỏi giao diện 15/08/2026, giữ để tra):
     *   · App chưa có “Phiếu theo dõi nhà cung cấp” để ghi sự không phù hợp khi giao hàng.
     */
  },

  // ---- HAI CỘT KẾT THÚC: nội dung là CÁCH APP XÁC ĐỊNH, không phải quy trình công ty ----

  hoan_thanh: {
    tenDayDu: "Hoàn thành",
    khongCoTrenBase: true,
    noiDung: [
      {
        van: "Đề nghị tự vào cột này khi mọi đơn đặt hàng của nó đều đã hoàn thành VÀ không còn dòng vật tư nào chưa lên đơn. Không kéo thẻ vào đây được — phải làm đủ việc thì thẻ mới sang.",
      },
      {
        nhanManh: true,
        van: "Một đơn đặt hàng chỉ được tính là hoàn thành khi đủ CẢ BỐN:",
        gach: [
          "Đã giao đủ khối lượng của mọi dòng vật tư",
          "Mọi lần giao đều có tệp phiếu giao nhận đính kèm",
          "Thủ kho xác nhận",
          "Trưởng bộ phận xác nhận",
        ],
      },
      {
        luuY: "Chỉ phiếu nhận hàng đã ở trạng thái “đã nhập kho” mới được tính vào khối lượng đã nhận. Hàng còn chờ kiểm tra KHÔNG tính — nếu tính thì app báo tiến độ ảo, hàng chưa kiểm chất lượng đã coi như xong.",
      },
    ],
  },

  that_bai: {
    tenDayDu: "Thất bại",
    khongCoTrenBase: true,
    noiDung: [
      {
        van: "Nhánh dừng, không phải một bước trong chuỗi. Đề nghị vào đây khi bị đóng dở — nghĩa là không mua tiếp.",
      },
      {
        van: "Cách đưa một đề nghị vào đây: kéo thẻ sang cột này, hoặc chọn “Đánh dấu thất bại” trong menu ⋯ của thẻ. Cả hai đều hỏi xác nhận trước.",
      },
      {
        luuY: "Đóng dở khác với lưu trữ. Lưu trữ chỉ giấu hồ sơ khỏi bảng cho đỡ rối, trạng thái nghiệp vụ giữ nguyên và bỏ lưu trữ là hồ sơ về đúng cột cũ. Đóng dở là kết luận nghiệp vụ: dừng mua.",
      },
    ],
  },
};

// ============================================================
// ★★ CẤP QUẢN LÝ TỰ SỬA NỘI DUNG HƯỚNG DẪN — Sếp 14/09/2026
//
// *"Ở thông tin hướng dẫn này, hãy tạo thành trường để cấp quản lý có thể chỉnh sửa nội dung"*.
//
// ⚠️ MÂU THUẪN CÓ CHỦ Ý với cảnh báo ở đầu file (*"đừng tự sửa, phải khớp quy trình giấy"*).
// Cảnh báo đó nói với NGƯỜI LẬP TRÌNH — cấm sửa lén trong mã nguồn. Nay công ty được quyền
// sửa qua giao diện, có ghi vết ai sửa lúc nào (`soSanhCauHinh`), và **luôn khôi phục được bản
// gốc** vì bản gốc vẫn nằm nguyên trong `HUONG_DAN_GIAI_DOAN`. Hai việc khác hẳn nhau.
//
// 🔴 BẢN SỬA LƯU DẠNG VĂN BẢN THUẦN, KHÔNG LƯU CẤU TRÚC. Người sửa là cán bộ nghiệp vụ, không
// phải lập trình viên — bắt họ nhập JSON là chức năng có cũng như không. Ba quy ước dưới đây
// đủ diễn đạt mọi kiểu đoạn đang dùng, và đều là thứ người ta viết tự nhiên.
// ============================================================

/** Đầu dòng đánh dấu câu "Lưu ý" — khối viền màu, tách khỏi thân bài. */
const DAU_LUU_Y = "Lưu ý:";
/** Dòng riêng đánh dấu khối quy định bắt buộc — nền xám, có nhãn in hoa phía trên. */
const DAU_NHAN_MANH = "Quy định bắt buộc:";

/** Ba quy ước soạn thảo, hiện ngay trong hộp sửa để người dùng khỏi phải đoán. */
export const QUY_UOC_SOAN_HUONG_DAN = [
  "Để trống một dòng để tách đoạn.",
  'Bắt đầu dòng bằng "- " để thành gạch đầu dòng.',
  `Đoạn bắt đầu bằng "${DAU_LUU_Y}" hiện thành khối Lưu ý; dòng riêng "${DAU_NHAN_MANH}" làm cả đoạn sau nó thành khối quy định bắt buộc.`,
] as const;

function laDongGach(dong: string): boolean {
  return /^[-*•]\s+/.test(dong);
}

function boDauGach(dong: string): string {
  return dong.replace(/^[-*•]\s+/, "").trim();
}

/**
 * Đổi nội dung có cấu trúc thành VĂN BẢN THUẦN để đổ vào ô soạn thảo.
 *
 * 📌 Dùng để mồi ô sửa bằng chính bản gốc — người quản lý sửa vài chữ trên nền có sẵn, chứ
 * không phải gõ lại từ đầu (gõ lại từ đầu là chắc chắn rơi mất ý).
 */
export function huongDanThanhVanBan(noiDung: DoanHuongDan[]): string {
  const khoi: string[] = [];
  for (const d of noiDung) {
    if (d.luuY) {
      khoi.push(`${DAU_LUU_Y} ${d.luuY}`);
      continue;
    }
    const dong: string[] = [];
    if (d.nhanManh) dong.push(DAU_NHAN_MANH);
    if (d.van) dong.push(d.van);
    for (const g of d.gach ?? []) dong.push(`- ${g}`);
    if (dong.length > 0) khoi.push(dong.join("\n"));
  }
  return khoi.join("\n\n");
}

/**
 * Đổi văn bản thuần người dùng gõ thành nội dung có cấu trúc để hiển thị.
 *
 * 🔴 KHÔNG BAO GIỜ NÉM LỖI. Đây là chỗ nhận chữ người dùng gõ tự do; ném lỗi ở đây là cả hộp
 * hướng dẫn trắng màn. Gõ sai quy ước thì cùng lắm ra một đoạn văn thường — vẫn đọc được.
 */
export function vanBanThanhHuongDan(van: string): DoanHuongDan[] {
  const ra: DoanHuongDan[] = [];
  for (const khoi of van.split(/\r?\n[ \t]*\r?\n/)) {
    const dong = khoi
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
    if (dong.length === 0) continue;

    if (dong[0].toLowerCase().startsWith(DAU_LUU_Y.toLowerCase())) {
      const luuY = [dong[0].slice(DAU_LUU_Y.length), ...dong.slice(1)].join(" ").trim();
      if (luuY) ra.push({ luuY });
      continue;
    }

    let nhanManh = false;
    let conLai = dong;
    if (dong[0].toLowerCase() === DAU_NHAN_MANH.toLowerCase()) {
      nhanManh = true;
      conLai = dong.slice(1);
    }

    const gach = conLai.filter(laDongGach).map(boDauGach).filter((x) => x.length > 0);
    const vanDoan = conLai.filter((x) => !laDongGach(x)).join(" ").trim();
    if (!vanDoan && gach.length === 0) continue;

    ra.push({
      ...(vanDoan ? { van: vanDoan } : {}),
      ...(gach.length > 0 ? { gach } : {}),
      ...(nhanManh ? { nhanManh: true } : {}),
    });
  }
  return ra;
}

/**
 * Hướng dẫn CUỐI CÙNG để hiển thị cho một bước — bản công ty sửa nếu có, không thì bản gốc.
 *
 * 🔴 CHỈ SỬA ĐƯỢC BƯỚC ĐÃ CÓ BẢN GỐC. Bước không có hướng dẫn trên bảng Base thì vẫn không có
 * — không mở đường "bịa quy trình công ty cho đủ bộ" qua ngả cấu hình.
 *
 * 🔴 BẢN SỬA RỖNG (hoặc gõ toàn khoảng trắng) TỰ VỀ BẢN GỐC, không để hộp trắng. Người dùng
 * xoá sạch ô rồi bấm Lưu là ý muốn "bỏ bản sửa", không phải "hướng dẫn bước này là không có gì".
 */
export function huongDanHienThi(
  giaiDoan: GiaiDoanMuaHang,
  huongDanTuyChinh?: Record<string, string>,
): HuongDanGiaiDoan | undefined {
  const goc = HUONG_DAN_GIAI_DOAN[giaiDoan];
  if (!goc) return undefined;

  const van = huongDanTuyChinh?.[giaiDoan]?.trim();
  if (!van) return goc;

  const noiDung = vanBanThanhHuongDan(van);
  if (noiDung.length === 0) return goc;

  return { ...goc, noiDung, daTuyChinh: true };
}
