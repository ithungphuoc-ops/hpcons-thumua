// ============================================================
// SOÁT TRƯỚC KHI GHI — nhịp 3c lộ trình chống mất dữ liệu (Sếp chốt 24/09/2026)
//
// 🔴 CHỖ CUỐI CÙNG CÒN MẤT VIỆC: hai người sửa ĐÚNG MỘT bản ghi. Đợt 2 đã bó thiệt hại lại còn
// một ô (17 đơn bên cạnh không còn bị đụng), nhưng trong cái ô đó thì người lưu sau vẫn đè lên
// người lưu trước, và người trước không được báo một tiếng nào.
//
// ✅ CÁCH CHỮA — HỎI MỘT CÂU THUẦN KỸ THUẬT, KHÔNG HỎI CÂU NGHIỆP VỤ.
//
// 🔴 VÌ SAO KHÔNG BÊ LUẬT NGHIỆP VỤ LÊN MÁY CHỦ (phương án bị loại 24/09/2026): thao tác như
// `xacNhanTruongBP` không chỉ đổi trạng thái — nó kiểm quyền người bấm, kiểm hoá đơn VAT bắt
// buộc, kiểm việc tồn của các bước trước, và vài luật Sếp chốt rải rác từ tháng 8. Bê sang là
// có HAI bản luật ở hai nơi, và vài lần sửa sau chúng lệch nhau — lệch kiểu im lặng, đúng loại
// lỗi khó tìm nhất.
//
// Nên không hỏi *"thao tác này có hợp lệ không"* mà hỏi *"bản ghi này có còn y như lúc tôi nhìn
// thấy không"*. Câu sau không cần biết một chữ nào về nghiệp vụ, mà lại chặn được MỌI thao tác
// chứ không riêng sáu cái — kể cả sửa tay từng ô.
//
// ⚠️ BA ĐIỀU PHẢI BIẾT:
//   ① Mỗi lần lưu tốn thêm một lượt đọc (đọc lại trong giao dịch).
//   ② Bị từ chối thì PHẢI báo cho người dùng, kèm ai vừa đổi và lúc nào. Nuốt lỗi ở đây là tệ
//      hơn cả cách cũ: người ta tưởng đã lưu xong.
//   ③ Kiểm tra chạy ở máy người dùng nên ai sửa mã trình duyệt vẫn lách được. Việc đang giải là
//      VÔ TÌNH đè nhau, không phải phá hoại.
// ============================================================

import { chuoiOnDinh, tuMap, type KhoiTheoId, type ThayDoi } from "@/2-quy-trinh/ghi-tung-phan";

/** Một ô bị người khác đổi mất trong lúc mình đang sửa. */
export interface XungDot {
  khoi: KhoiTheoId;
  khoa: string;
  duongDan: string;
  /** Tên người vừa đổi, tra từ nhật ký của bản ghi trên máy chủ. `null` khi không tra được. */
  aiDoi: string | null;
  /** Mốc thời gian của lần đổi đó, dạng ISO. `null` khi không tra được. */
  luc: string | null;
}

export interface KetQuaSoat {
  /** Những ô chưa ai đụng — ghi được. */
  ghiDuoc: ThayDoi[];
  /** Những ô người khác vừa đổi — KHÔNG ghi, phải báo cho người dùng. */
  xungDot: XungDot[];
}

/** Tách `donHang.DMH260012` thành khối và khoá. `null` khi đường dẫn không đúng dạng. */
export function tachDuongDan(duongDan: string): { khoi: KhoiTheoId; khoa: string } | null {
  const i = duongDan.indexOf(".");
  if (i <= 0 || i === duongDan.length - 1) return null;
  return { khoi: duongDan.slice(0, i) as KhoiTheoId, khoa: duongDan.slice(i + 1) };
}

/**
 * Tra xem AI vừa đổi bản ghi này, lấy từ mục cuối trong nhật ký của nó.
 *
 * 🔴 CÓ TÊN NGƯỜI THÌ THÔNG BÁO MỚI DÙNG ĐƯỢC. *"Có người khác vừa sửa"* làm người dùng đi hỏi
 * cả phòng; *"chị Thuỳ vừa xác nhận lúc 09:14"* thì họ biết gọi ai.
 *
 * ⚠️ Phòng thủ hết mức: bản ghi cũ có thể không có nhật ký, nhật ký có thể rỗng, mục cuối có
 * thể thiếu trường. Mọi ca đó trả `null` và nơi gọi hiện câu chung chung — thà nói ít hơn là
 * nói sai tên người.
 */
export function aiVuaDoi(banGhi: unknown): { ten: string | null; luc: string | null } {
  const o = (banGhi ?? {}) as { lichSu?: unknown };
  const ds = Array.isArray(o.lichSu) ? o.lichSu : [];
  if (ds.length === 0) return { ten: null, luc: null };
  const cuoi = (ds[ds.length - 1] ?? {}) as { nguoiThucHien?: unknown; thoiDiem?: unknown };
  const ten = typeof cuoi.nguoiThucHien === "string" && cuoi.nguoiThucHien.trim()
    ? cuoi.nguoiThucHien.trim()
    : null;
  const luc = typeof cuoi.thoiDiem === "string" && cuoi.thoiDiem.trim() ? cuoi.thoiDiem.trim() : null;
  return { ten, luc };
}

/**
 * Chia những thay đổi sắp ghi thành "ghi được" và "phải báo".
 *
 * Quy tắc đúng một câu: **ô nào trên máy chủ vẫn y như lúc mình nhận về thì ghi, khác đi thì
 * báo.** So bằng chuỗi ổn định nên thứ tự trường không gây báo nhầm.
 *
 * 🔴 BẢN GHI MỚI TOANH LÀ CA RIÊNG. Nó không có trong ảnh chụp (mình vừa tạo ra). Nếu máy chủ
 * cũng chưa có thì ghi bình thường — đây là đường tạo mới, tuyệt đối không được chặn. Nhưng nếu
 * máy chủ ĐÃ CÓ cùng khoá đó thì có người khác vừa tạo trùng, phải báo chứ không đè.
 *
 * ⚠️ XOÁ CŨNG PHẢI SOÁT. Mình xoá một đơn trong khi người khác vừa sửa chính đơn đó — xoá luôn
 * là nuốt mất việc của họ. Ca này đi cùng nhánh so ảnh chụp bên dưới, không cần nhánh riêng.
 */
export function soatTruocKhiGhi(
  thayDoi: readonly ThayDoi[],
  anhChup: Partial<Record<KhoiTheoId, Record<string, string>>>,
  khoTrenMayChu: Record<string, unknown>,
): KetQuaSoat {
  const ghiDuoc: ThayDoi[] = [];
  const xungDot: XungDot[] = [];

  /* Dựng sẵn map tra cứu cho từng khối, tránh quét lại danh sách ở mỗi thay đổi. */
  const traCuu = new Map<string, Map<string, Record<string, unknown>>>();
  const layBanGhi = (khoi: KhoiTheoId, khoa: string): Record<string, unknown> | undefined => {
    let m = traCuu.get(khoi);
    if (!m) {
      m = new Map();
      const tho = khoTrenMayChu[khoi];
      if (tho && typeof tho === "object" && !Array.isArray(tho)) {
        for (const [k, v] of Object.entries(tho as Record<string, unknown>)) {
          m.set(k, v as Record<string, unknown>);
        }
      } else {
        /* Kho còn dạng mảng (chưa bật đợt 2, hoặc đang chuyển đổi) — vẫn phải tra được. */
        for (const x of tuMap<Record<string, unknown>>(tho)) {
          const k = khoi === "giaDonHang" ? x.poId : x.id;
          if (typeof k === "string") m.set(k, x);
        }
      }
      traCuu.set(khoi, m);
    }
    return m.get(khoa);
  };

  for (const t of thayDoi) {
    const tach = tachDuongDan(t.duongDan);
    if (!tach) {
      /* Đường dẫn không theo dạng `khối.khoá` — là khoá nguyên khối (cấu hình, danh mục tự
         thêm). Chúng nhỏ và hiếm khi đổi; soát theo ô không áp dụng được, cho qua. */
      ghiDuoc.push(t);
      continue;
    }

    const { khoi, khoa } = tach;
    const banTrenMayChu = layBanGhi(khoi, khoa);
    const anhCuaToi = anhChup[khoi]?.[khoa];

    if (anhCuaToi === undefined) {
      /* Mình chưa từng thấy bản ghi này → mình đang TẠO MỚI. */
      if (banTrenMayChu === undefined) {
        ghiDuoc.push(t);
      } else {
        const { ten, luc } = aiVuaDoi(banTrenMayChu);
        xungDot.push({ khoi, khoa, duongDan: t.duongDan, aiDoi: ten, luc });
      }
      continue;
    }

    /* Bản ghi mình đã thấy: chỉ ghi nếu máy chủ vẫn y nguyên như lúc mình nhận về. */
    const hienTai = banTrenMayChu === undefined ? undefined : chuoiOnDinh(banTrenMayChu);
    if (hienTai === anhCuaToi) {
      ghiDuoc.push(t);
    } else {
      const { ten, luc } = aiVuaDoi(banTrenMayChu);
      xungDot.push({ khoi, khoa, duongDan: t.duongDan, aiDoi: ten, luc });
    }
  }

  return { ghiDuoc, xungDot };
}

/** Tên tiếng Việt của khối, để câu thông báo đọc ra người chứ không ra mã. */
export function tenKhoi(khoi: KhoiTheoId): string {
  const bang: Record<KhoiTheoId, string> = {
    deNghi: "đề nghị",
    donHang: "đơn hàng",
    giaDonHang: "giá đơn hàng",
    phieuNhan: "phiếu nhận",
    baoGia: "báo giá",
    thongBao: "thông báo",
  };
  return bang[khoi] ?? String(khoi);
}

/**
 * Dựng câu báo cho người dùng khi phần vừa nhập KHÔNG lưu được.
 *
 * 🔴 CÂU NÀY QUAN TRỌNG NGANG PHẦN MÃ. Người dùng vừa gõ xong, bấm Lưu, rồi bị từ chối — nếu
 * câu chữ mập mờ thì họ hoảng, tưởng mất hết, rồi gõ lại lần nữa và hỏng thêm. Ba thứ bắt buộc
 * phải có, theo đúng thứ tự:
 *   ① CHUYỆN GÌ ĐÃ XẢY RA — ai vừa đổi, lúc nào. Có tên thì họ biết gọi ai.
 *   ② PHẦN CỦA HỌ ĐANG Ở ĐÂU — còn trên màn hình, chưa mất. Đây là điều họ lo nhất.
 *   ③ LÀM GÌ TIẾP — một hành động cụ thể, không phải lời khuyên chung chung.
 *
 * ⚠️ KHÔNG XIN LỖI, KHÔNG ĐỔ TẠI AI. "Xin lỗi, đã có lỗi xảy ra" chẳng nói được gì; còn
 * "chị Thuỳ đã ghi đè lên bạn" thì biến một sự cố kỹ thuật thành chuyện giữa hai người.
 */
export function cauBaoXungDot(xungDot: readonly XungDot[]): { tieuDe: string; moTa: string } {
  if (xungDot.length === 0) return { tieuDe: "", moTa: "" };

  const dau = xungDot[0];
  const ten = tenKhoi(dau.khoi);
  const gio = gioNgan(dau.luc);

  const ai = dau.aiDoi
    ? `${dau.aiDoi} vừa sửa ${ten} này${gio ? ` lúc ${gio}` : ""}`
    : `${ten.charAt(0).toUpperCase()}${ten.slice(1)} này vừa được người khác sửa${gio ? ` lúc ${gio}` : ""}`;

  const them =
    xungDot.length > 1 ? ` (và ${xungDot.length - 1} mục khác cũng vừa đổi)` : "";

  return {
    tieuDe: "Chưa lưu được — hồ sơ vừa có người khác sửa",
    moTa:
      `${ai}${them}. Phần bạn vừa nhập vẫn còn nguyên trên màn hình, chưa mất. ` +
      `Mở lại hồ sơ để xem bản mới nhất rồi nhập lại phần của bạn — làm vậy để không ai mất việc của ai.`,
  };
}

/** `2026-09-24T09:14:32.000Z` → `09:14`. Trả chuỗi rỗng khi không đọc được. */
export function gioNgan(iso: string | null): string {
  if (!iso) return "";
  const t = new Date(iso);
  if (!Number.isFinite(t.getTime())) return "";
  return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
}
