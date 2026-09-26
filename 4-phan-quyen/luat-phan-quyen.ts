// ============================================================
// LUẬT PHÂN QUYỀN — AI ĐƯỢC ĐỔI QUYỀN CỦA AI, TỚI CẤP NÀO
//
// 🔴 Ban lãnh đạo 18/08/2026: *"thêm tính năng phân quyền cho tài khoản quản trị và tài khoản
// trưởng bộ phận"*.
//
// 🔴 HÀM THUẦN, MỘT CHỖ DUY NHẤT. Màn hình hỏi luật ở đây, tầng ghi cũng hỏi lại đúng ở đây.
// Chép điều kiện ra hai nơi là kiểu lỗi tệ nhất của phân quyền: nút bị khóa trên giao diện nhưng
// đường ghi vẫn nhận, hoặc ngược lại — và không có gì báo cho tới khi ai đó khai thác được.
//
// ⚠️ ĐÂY CHƯA PHẢI CHỐT CHẶN THẬT. Chốt thật phải nằm ở Firestore Security Rules, vì người dùng
// gọi thẳng Firestore được mà không đi qua app. Xem `5-ket-noi/firestore-phan-quyen-DE-XUAT.rules`
// — bộ rules đó **chưa được duyệt và chưa deploy**, nên hiện tại máy chủ vẫn TỪ CHỐI mọi lệnh ghi
// hồ sơ phân quyền. Không được coi file này là hàng rào bảo mật.
// ============================================================

/**
 * 🔴 NHÃN CẤP QUYỀN LẤY TỪ `quyen.ts`, KHÔNG KHAI LẠI.
 *
 * Bản đầu của file này tự khai một bảng `NHAN_CAP_QUYEN` riêng ({0:"Không quyền", 1:"Xem"…})
 * trong khi `quyen.ts` đã có sẵn một bảng khác chữ ({0:"Không truy cập", 1:"Cấp 1 — Xem"…}).
 * Hai bảng cùng nói một thứ bằng hai cách gọi khác nhau: người dùng đọc màn phân quyền thấy
 * "Nhập liệu", đọc chỗ khác thấy "Cấp 2 — Nhập liệu", và không ai biết có phải một thứ không.
 * Đã bỏ bản trùng, dùng chung một bảng.
 */
import {
  NHAN_CAP_QUYEN,
  tinhQuyen,
  type CapQuyen,
  type NguoiDung,
  type Quyen,
  type VaiTroHeThong,
} from "@/4-phan-quyen/quyen";
import { CO_CHI_QUAN_TRI_TRAO, KHOA_TICK, nhanCoTick } from "@/4-phan-quyen/quyen-rieng";

export { NHAN_CAP_QUYEN };

/**
 * Cấp CAO NHẤT mà người này đặt được cho NGƯỜI KHÁC. `0` = không được phân quyền.
 *
 * 🔴 LUẬT NỀN: **không ai tạo ra được người ngang hoặc trên mình.** Đây là luật kinh điển của
 * phân quyền, và lý do rất cụ thể: nếu trưởng bộ phận (cấp 3) đặt được cấp 4 cho một tài khoản
 * bất kỳ, thì họ chỉ cần tạo/nhờ một tài khoản cấp 4 rồi dùng nó để tự nâng mình — vòng lách
 * quyền khép kín mà nhật ký nhìn vào vẫn "đúng quy trình".
 *
 * · Quản trị (4) → đặt được tới **4**: cấp 4 vốn đã "làm được mọi việc", cho tạo thêm quản trị
 *   khác là đúng vai trò, và công ty cần hơn một người giữ chìa khóa.
 * · Trưởng bộ phận (3) → đặt được tới **2** (Nhập liệu). Đủ để tự cấp quyền cho nhân viên trong
 *   bộ phận mà không phải nhờ IT, nhưng không đụng được vào cấp quản lý và quản trị.
 *
 * ⚠️ GIẢ ĐỊNH CỦA TÔI, CHƯA ĐƯỢC BAN LÃNH ĐẠO CHỐT. Đã hỏi ngày 18/08/2026 và chưa có trả lời,
 * nên chọn mức chặt nhất còn dùng được. Muốn nới cho trưởng bộ phận đặt tới cấp 3 thì sửa đúng
 * MỘT số ở dòng dưới — không phải sửa màn hình.
 */
export function capDatDuocToiDa(nguoiSua: NguoiDung): CapQuyen {
  if (nguoiSua.capTM >= 4) return 4;
  if (nguoiSua.capTM >= 3) return 2;
  return 0;
}

/** Người này có được vào màn phân quyền không. */
export function duocPhanQuyen(nguoiSua: NguoiDung): boolean {
  return capDatDuocToiDa(nguoiSua) > 0;
}

/**
 * Người này có được sửa hồ sơ của người kia không, kèm LÝ DO khi không được.
 *
 * 🔴 LUÔN TRẢ LÝ DO. Khóa một dòng mà không nói vì sao thì người dùng tưởng app hỏng, rồi đi hỏi
 * IT — mất thời gian của cả hai bên cho một luật vốn giải thích được bằng một câu.
 *
 * @param capNguoiBiSua Cấp hiện tại của người bị sửa.
 * @param laChinhMinh   Hồ sơ đang sửa có phải của chính người đang thao tác không.
 */
export function duocSuaHoSo(
  nguoiSua: NguoiDung,
  capNguoiBiSua: CapQuyen,
  laChinhMinh: boolean,
): { duoc: boolean; lyDo?: string } {
  if (capDatDuocToiDa(nguoiSua) === 0) {
    return { duoc: false, lyDo: "Bạn không có quyền phân quyền." };
  }

  /**
   * 🔴 KHÔNG AI TỰ SỬA HỒ SƠ CỦA CHÍNH MÌNH — kể cả quản trị.
   *
   * Hai lý do, cái thứ hai mới là cái quan trọng:
   *  ① Tự nâng cấp là vô nghĩa (đã cao nhất) còn tự hạ cấp là tự khóa mình ra ngoài — nếu đó là
   *     tài khoản quản trị duy nhất thì **không còn ai mở lại được**, phải dùng khóa Admin SDK.
   *  ② Mọi thay đổi quyền phải có người thứ hai nhìn thấy. Tự sửa mình là không ai đối chứng.
   */
  if (laChinhMinh) {
    return {
      duoc: false,
      lyDo: "Không tự sửa quyền của chính mình. Nhờ một tài khoản Quản trị khác đổi giúp.",
    };
  }

  /**
   * Không sửa được người có cấp CAO HƠN cấp mình đặt được.
   * Trưởng bộ phận (đặt tối đa 2) vì vậy không đụng được vào hồ sơ cấp 3 và cấp 4 — nếu không,
   * họ có thể HẠ một quản trị xuống rồi tự do làm phần còn lại.
   */
  const toiDa = capDatDuocToiDa(nguoiSua);
  if (capNguoiBiSua > toiDa) {
    return {
      duoc: false,
      lyDo: `Bạn chỉ đặt được tới cấp ${toiDa} (${NHAN_CAP_QUYEN[toiDa]}), không sửa được hồ sơ cấp ${capNguoiBiSua} (${NHAN_CAP_QUYEN[capNguoiBiSua]}).`,
    };
  }

  return { duoc: true };
}

/**
 * Kiểm một lần cuối trước khi ghi: cấp MỚI có nằm trong tầm của người sửa không.
 *
 * ⚠️ Tách khỏi `duocSuaHoSo` là cố ý: sửa được hồ sơ KHÔNG có nghĩa đặt được mọi cấp. Trưởng bộ
 * phận sửa được hồ sơ cấp 2, nhưng không được nâng nó lên cấp 3.
 */
export function duocDatCap(
  nguoiSua: NguoiDung,
  capMoi: CapQuyen,
): { duoc: boolean; lyDo?: string } {
  const toiDa = capDatDuocToiDa(nguoiSua);
  if (capMoi > toiDa) {
    return {
      duoc: false,
      lyDo: `Bạn chỉ đặt được tới cấp ${toiDa} (${NHAN_CAP_QUYEN[toiDa]}).`,
    };
  }
  return { duoc: true };
}

/** Các cấp mà người này chọn được trong ô chọn — dùng để dựng danh sách, khỏi bày rồi khóa. */
export function cacCapChonDuoc(nguoiSua: NguoiDung): CapQuyen[] {
  const toiDa = capDatDuocToiDa(nguoiSua);
  return ([0, 1, 2, 3, 4] as CapQuyen[]).filter((c) => c <= toiDa);
}

// ============================================================
// ★ AI ĐƯỢC TICK QUYỀN RIÊNG CHO AI — Sếp 26/09/2026 (phân quyền tick chọn)
//
// Cùng một hàm cho màn hình (khoá ô / báo trước) và cho route `app/api/quyen-rieng` (chặn thật trước
// khi ghi) — một luật, một chỗ, đúng nếp của cả tệp này.
//
// 📌 ĐẶT Ở ĐÂY CHỨ KHÔNG Ở `quyen-rieng.ts`: hàm cần `duocSuaHoSo`/`tinhQuyen` (nạp `quyen.ts`), mà
// `quyen.ts` lại nạp `quyen-rieng.ts` — để ở bên đó là vòng nạp.
// ============================================================

/** Cấp từ đây trở lên thì không bỏ được "Vào app" bằng tick — xem ④b ở `vuongMacTraoQuyen`. */
export const CAP_KHONG_BO_VAO_APP = 3;

/** Câu lý do dùng CHUNG cho route và màn hình (khoá ô "Vào app"), để hai nơi nói y một câu. */
export function lyDoKhongBoVaoApp(ten: string): string {
  return `${ten}: không bỏ được "Vào app" của người cấp Quản lý trở lên — máy chủ vẫn cho họ gán chức danh theo cấp. Muốn thu hồi thì hạ chức danh.`;
}

/** Người đang bấm Lưu. */
export interface NguoiGoiTraoQuyen {
  /**
   * 🔴 CÙNG LỚP DANH TÍNH với `DichTraoQuyen.uid` — ở route là MÃ FIREBASE. So lệch lớp (mã nghiệp vụ
   * `u-tm1` với mã Firebase) là chốt "không tự sửa mình" mất tác dụng mà không có gì báo.
   */
  uid: string;
  /** Hồ sơ người gọi, ĐÃ gắn `quyenRieng` của chính họ — quyền trao đi tính theo quyền HIỆU LỰC. */
  nguoiDung: NguoiDung;
}

/** Một người được tick quyền. */
export interface DichTraoQuyen {
  uid: string;
  ten: string;
  vaiTro: VaiTroHeThong;
  capTM: CapQuyen;
  /**
   * Quyền THEO CHỨC DANH của người nhận (sau khi đổi chức danh, nếu lần lưu này có đổi). Cờ chức danh
   * đã cho sẵn thì bật lại KHÔNG tính là "trao" — xem ⑤ ở `vuongMacTraoQuyen`.
   */
  quyenGoc: Quyen;
  /** Quyền hiệu lực TRƯỚC khi ghi. */
  quyenTruoc: Quyen;
  /** Quyền hiệu lực SAU khi ghi. */
  quyenSau: Quyen;
  /**
   * Lần lưu TẮT ô "Vào app" trong BẢN GHI — lấy từ `tinhTruocSauKhiLuu().boVaoApp`. Không so bằng
   * `quyenTruoc/quyenSau` được: với người cấp ≥ 3 `apDungQuyenRieng` ép hiệu lực "Vào app" luôn bật.
   */
  boVaoApp: boolean;
}

/**
 * Lý do KHÔNG cho ghi quyền riêng, hoặc `null` khi được.
 *
 * Chặn (theo thứ tự):
 *   ① Người gọi không có `phanQuyenNguoiDung` (theo quyền hiệu lực). Cờ này KHÔNG tick được — luôn
 *      theo chức danh (xem `CO_TICK_DUOC`), và với người cấp ≥ 3 "Vào app" bị ép bật
 *      (`apDungQuyenRieng` ⑤) nên bản riêng cũ cũng không tước được nó.
 *   ② Không chọn ai.
 *   ③ Luật sửa hồ sơ sẵn có (`duocSuaHoSo`): không tự sửa mình · không sửa người cấp cao hơn cấp
 *      mình đặt được (trưởng bộ phận không đụng cấp 3/4). Dùng lại, KHÔNG viết lại.
 *   ④ Tài khoản Quản trị / Ban Giám đốc chỉ Quản trị sửa được. BGĐ cấp 1 nhưng quyền xem rất rộng
 *      — đúng lý do `chiQuanTriGan` ở `vai-tro-chuan.ts`: cấp số không đo được mức nguy hiểm.
 *   ④b KHÔNG BỎ ĐƯỢC "Vào app" CỦA NGƯỜI CẤP ≥ 3 (soát chéo 26/09/2026) — kể cả Quản trị bỏ. Đường
 *      gán chức danh `app/api/phan-quyen` (phiên tích hợp, không sửa được) gác theo CẤP, không đọc
 *      quyền tick: bỏ "Vào app" chỉ khoá giao diện, người đó vẫn gọi thẳng cửa kia gán chức danh
 *      được. Giao diện nói "đã khoá" mà máy chủ vẫn mở là thứ nguy hiểm nhất ở màn này. Muốn thu
 *      hồi thật thì hạ chức danh. Câu lý do dùng chung với màn hình: `lyDoKhongBoVaoApp`.
 *   ⑤ CHỐNG LEO QUYỀN: cờ nào người nhận CHƯA có mà sắp có, VÀ chức danh của họ không cho sẵn, thì
 *      người trao phải đang có cờ đó; cờ `CO_CHI_QUAN_TRI_TRAO` thì chỉ Quản trị trao được.
 *
 * 📌 `quyenTruoc` phải tính từ bản riêng ĐÃ ĐỐI CHIẾU DẤU CHỨC DANH (`quyenRiengHieuLuc`), không từ
 * bản thô — nếu không, cờ đóng băng từ chức danh cũ bị coi là "đã có sẵn" và lọt qua ⑤.
 *
 * 📌 ⑤ SO "TRƯỚC → SAU" CHỨ KHÔNG SO CẢ BẢN GHI. Thủ kho vốn có "Ghi phiếu nhận hàng" mà trưởng bộ
 * phận không có; so cả bản ghi thì trưởng bộ phận không bao giờ lưu được quyền cho thủ kho (kể cả chỉ
 * bỏ tick "Xem nhà cung cấp"). Giữ nguyên thứ người ta đã có không phải là trao quyền.
 *
 * 📌 ⑤ MIỄN CỜ CHỨC DANH ĐÃ CHO. Người đã được tick riêng rồi đổi sang chức danh Thủ kho: bấm "Áp
 * mẫu theo chức danh" là bật lại "Ghi phiếu nhận hàng" — cờ trưởng bộ phận không có. Không miễn thì
 * trưởng bộ phận kẹt, không trả được người đó về đúng mẫu chức danh mà chính họ vừa được phép gán.
 * Miễn không mở thêm lỗ: gán chức danh đã do luật riêng (`duocDatCap` + `vaiTroGanDuocBoi`) gác.
 */
export function vuongMacTraoQuyen(
  nguoiGoi: NguoiGoiTraoQuyen,
  dich: readonly DichTraoQuyen[],
): string | null {
  const quyenGoi = tinhQuyen(nguoiGoi.nguoiDung);
  const laQuanTriGoi = nguoiGoi.nguoiDung.vaiTro === "admin";

  if (!quyenGoi.phanQuyenNguoiDung) return "Bạn không có quyền phân quyền người dùng.";
  if (dich.length === 0) return "Chưa chọn người nào để phân quyền.";

  for (const d of dich) {
    const xet = duocSuaHoSo(nguoiGoi.nguoiDung, d.capTM, d.uid === nguoiGoi.uid);
    if (!xet.duoc) return `${d.ten}: ${xet.lyDo ?? "không sửa được."}`;

    /* ④ — ★ SẾP CHỐT 26/09/2026: trưởng bộ phận KHÔNG sửa được tài khoản Ban Giám đốc trên màn Phân
       quyền (cả ô tick lẫn ô chức danh, vì màn khoá cả dòng theo lý do này) — chặt hơn bản trước
       26/09. Nguyên văn Sếp: *"Giữ quyền này"*. ⚠️ Máy chủ `/api/phan-quyen` (phiên tích hợp) CHƯA siết
       tương ứng: gọi thẳng cửa đó thì trưởng bộ phận vẫn đổi được chức danh BGĐ (cấp 1 ≤ 2). */
    if (!laQuanTriGoi && (d.vaiTro === "admin" || d.vaiTro === "director")) {
      const nhanVT = d.vaiTro === "admin" ? "Quản trị" : "Ban Giám đốc";
      return `${d.ten} là tài khoản ${nhanVT} — chỉ tài khoản Quản trị mới sửa được quyền của họ.`;
    }

    /* ④b — xem chú thích trên hàm. So trên BẢN GHI (trước bật → sau tắt), không trên hiệu lực: hiệu
       lực của người cấp ≥ 3 luôn bật "Vào app" (`apDungQuyenRieng` ⑤) nên so hiệu lực là không bao giờ
       thấy việc bỏ, còn bản ghi thì lặng lẽ tắt sạch mọi cờ khác theo dây chuyền của `ghepQuyenRieng`. */
    if (d.capTM >= CAP_KHONG_BO_VAO_APP && d.boVaoApp) {
      return lyDoKhongBoVaoApp(d.ten);
    }

    for (const k of KHOA_TICK) {
      if (d.quyenTruoc[k] || !d.quyenSau[k]) continue; // không phải cờ MỚI được trao
      /* Chức danh của người nhận đã cho sẵn — xem ⑤ ở trên.
         ★ SẾP CHỐT 26/09/2026 — GIỮ miễn trừ này KỂ CẢ KHI QUẢN TRỊ ĐÃ CHỦ ĐỘNG BỎ cờ đó: trưởng bộ
         phận ĐƯỢC bật lại. Nguyên văn Sếp: *"Có được bật lại quyền"*. Đừng "sửa cho chặt" thành chỉ
         người đã bỏ mới bật lại được — đó là đổi ngược chỉ đạo. */
      if (d.quyenGoc[k]) continue;
      if (!laQuanTriGoi && CO_CHI_QUAN_TRI_TRAO.includes(k)) {
        return `Chỉ tài khoản Quản trị trao được quyền “${nhanCoTick(k)}” (${d.ten}).`;
      }
      if (!quyenGoi[k]) {
        return `Bạn không có quyền “${nhanCoTick(k)}” nên không trao cho ${d.ten} được.`;
      }
    }
  }
  return null;
}
