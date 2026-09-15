// ============================================================
// GỬI PO SANG QLK CTR — Việc 2 (20/08/2026)
//
// Ngược hướng Việc 1 (App Request gọi VÀO Thu mua): ở đây THU MUA là bên gọi ĐI. Nhưng PO được
// lập ở tầng TRÌNH DUYỆT (`kho-du-lieu.tsx` → `themDonHang`, chạy trong React, không phải route
// máy chủ) — gọi thẳng QLK CTR từ trình duyệt thì khóa API phải lộ ra client. Nên đường đi là:
//
//   trình duyệt Thu mua → route máy chủ CỦA CHÍNH THU MUA (/api/qlk-ctr/gui-po, giữ khóa)
//     → QLK CTR (POST /api/app-mua-hang/po-moi)
//
// File này chỉ là phần gọi từ trình duyệt sang route máy chủ của chính app — KHÔNG cầm khóa gì.
// ============================================================

import type { DeNghiMuaHang, DonDatHang } from "@/3-du-lieu/kieu-du-lieu";
import { laDongHang } from "@/2-quy-trinh/tinh-toan";
import { laHoSoPhongBan } from "@/2-quy-trinh/ho-so-phong-ban";

export type KetQuaGuiQlkCtr =
  | { apDung: false }
  | { apDung: true; thanhCong: true; snapshot: string }
  | { apDung: true; thanhCong: false; loi: string };

// ============================================================
// ★★ SỬA CÓ PHÉP CỦA SẾP — 15/09/2026
// Tệp này nằm trong danh sách 14 tệp CẤM SỬA của phiên tích hợp App Tổng (CLAUDE.md §6.6, lệnh
// Sếp 20/08/2026). Ngày 15/09/2026 Sếp đã báo phiên tích hợp và cho phép sửa ĐÚNG HAI VIỆC:
//   ① giữ lại nội dung lỗi khi gửi hỏng (`catNganLoiQlkCtr` dưới đây)
//   ② siết chốt "chỉ gửi hồ sơ CÔNG TRÌNH" (xem `guiPOSangQlkCtr` / `canDongBoLaiPO`)
//   ③ (chiều cùng ngày) vá NỐT chỗ hở của nhánh PO ĐỘC LẬP — chốt ② lúc đầu chỉ đặt ở nhánh PO
//      CÓ đề nghị, nhánh độc lập vẫn gửi PO phòng ban sang QLK CTR. Xem `laPOCuaHoSoPhongBan`
//   ④ (15/09/2026, tối — Sếp: *"Đề xuất từ phòng ban thì ko cần gửi sang app kho, nên e bỏ phần
//      ghi chú này và điều chỉnh lại phần code của phòng ban"*) MỞ `export` cho phép nhận diện
//      phòng ban ở tầng PO, và đổi tên `laPODocLapCuaPhongBan` → `laPOCuaHoSoPhongBan`.
//      🔴 VÌ SAO ĐỔI TÊN: giao diện (`trang/don-hang-chi-tiet.tsx`) và vòng tự đồng bộ
//      (`3-du-lieu/kho-du-lieu.tsx`) nay phải hỏi CÙNG MỘT phép nhận diện với nơi gửi — nếu không,
//      màn hình lại nói một đằng còn đường gửi làm một nẻo, đúng cái sai đang chữa. Hàm này từ nay
//      dùng cho CẢ HAI loại PO (có đề nghị và độc lập) nên chữ "DocLap" trong tên cũ thành sai.
//      Đây là hàm do chính đợt sửa 15/09 thêm vào, KHÔNG phải hàm của phiên tích hợp.
// Không dọn dẹp, không xoá gì khác của các anh — ghi ra đây để người đọc sau biết đây là sửa có
// phép chứ không phải ai đó tự tiện.
// ============================================================

/**
 * Trần độ dài nội dung lỗi lưu xuống `DonDatHang.qlkCtrSyncError`.
 *
 * 🔴 VÌ SAO PHẢI CÓ TRẦN: cả phòng dùng CHUNG MỘT document Firestore (`chay-thu/du-lieu-chung`,
 * CLAUDE.md §3.6b). Khi QLK CTR (hoặc một proxy nào đó trên đường đi) trả về nguyên một trang
 * HTML lỗi, `data.error` có thể vài chục KB — nhân với số PO hỏng là đủ làm phình document dùng
 * chung của mọi người. 500 ký tự đủ chứa câu lỗi thật của QLK CTR, còn thừa thì phần đuôi gần
 * như luôn là khung HTML vô nghĩa.
 */
export const DO_DAI_TOI_DA_LOI_QLK_CTR = 500;

/**
 * Cắt ngắn nội dung lỗi trước khi trả về cho nơi gọi.
 *
 * 🔴 CẮT NGAY TẠI NGUỒN, KHÔNG ĐỂ NƠI GHI TỰ NHỚ. Nếu để việc cắt cho `kho-du-lieu.tsx` thì mỗi
 * chỗ gọi (hiện đã 6 chỗ) phải nhớ cắt, và chỉ cần một chỗ quên là trần này thành vô nghĩa —
 * đúng kiểu luật chỉ ghi ra giấy mà CLAUDE.md §6.6 đã phải trả giá để học.
 * Có dán `[cắt bớt]` để người đọc biết đây là bản cắt, đừng đi tìm phần đuôi tưởng là mất.
 */
export function catNganLoiQlkCtr(loi: string): string {
  if (loi.length <= DO_DAI_TOI_DA_LOI_QLK_CTR) return loi;
  return `${loi.slice(0, DO_DAI_TOI_DA_LOI_QLK_CTR)}… [cắt bớt]`;
}

/**
 * Dựng đúng phần dữ liệu PO sẽ gửi sang QLK CTR — TÁCH RIÊNG khỏi `guiPOSangQlkCtr` để
 * `canDongBoLaiPO` dùng lại y hệt logic này mà so khớp, không viết trùng 2 nơi dễ lệch nhau.
 */
function xayDungPayloadPO(po: DonDatHang, maDeXuat: string) {
  return {
    maDeXuatAppRequest: maDeXuat,
    poIdThuMua: po.id,
    soPO: po.code,
    ncc: po.supplierTen,
    nccDiaChi: po.diaChiNCC,
    nccMST: po.maSoThueNCC,
    ngayLap: po.ngayLapPO,
    ngayGiao: po.ngayGiaoDuKien,
    // 🔴 (04/09/2026): Sếp phát hiện QLK CTR chỉ nhận đúng "từ ngày" (ngayGiaoDuKien), thiếu hẳn
    // "đến ngày" — bên Thu Mua ghi rõ 2 mốc "từ ngày – đến ngày" nhưng trước giờ chỉ gửi 1. Cần
    // cho "Hàng cần nhập" bên QLK CTR hiện đủ khoảng thật, không phải 1 mốc đơn.
    ngayGiaoDenNgay: po.ngayGiaoDenNgay,
    canCuHopDong: po.maHopDongCDT,
    diaDiemGiao: po.diaDiemGiaoHang,
    dieuKhoanKhac: po.dieuKhoanKhac,
    nguoiNhan: po.nguoiNhanHangTen,
    // 🔴 (30/08/2026): KHÔNG còn lọc bỏ dòng thiếu `sttDongDeNghi` — trước đây lọc ở đây làm PO
    // "độc lập" (lập trước khi có đề nghị, xem `DongPO.sttDongDeNghi`) mất sạch vật tư lúc gắn
    // vào đề nghị thật: dòng nào cũng thiếu `sttDongDeNghi` (đúng thiết kế, đơn độc lập chưa
    // trỏ về đề nghị nào) nên bị lọc hết, gửi sang QLK CTR một mảng RỖNG → QLK CTR từ chối vì
    // thiếu dữ liệu bắt buộc → `qlkCtrSyncStatus: "failed"` dù PO đã gắn đề nghị đúng và đã chốt.
    // QLK CTR đã có sẵn cơ chế dự phòng khớp theo TÊN + ĐVT khi thiếu `stt` (xem `chonMotVatTu`,
    // `app-mua-hang-actions.ts` bên QLK CTR) — bỏ lọc ở đây là tận dụng đúng cơ chế đó, không cần
    // sửa gì thêm bên QLK CTR.
    vatTu: po.items
      .filter(laDongHang) // bỏ dòng ghi chú — không có trong đề nghị gốc, QLK CTR tra theo stt sẽ hỏng
      .map((d) => ({
        stt: d.sttDongDeNghi,
        tenVatTu: d.tenVatLieu,
        dvt: d.donViTinh,
        soLuongDat: d.khoiLuongDat,
      })),
  };
}

/**
 * Gửi 1 PO sang QLK CTR — CHỈ gửi khi đề nghị gốc thoả ĐỦ HAI điều kiện:
 *   ① CÓ `maDeXuatAppRequest` — tức đã đồng bộ ở Việc 1, bên QLK CTR mới tra ngược được;
 *   ② KHÔNG phải hồ sơ phòng ban (`laHoSoPhongBan`) — tức hồ sơ này có công trình thật.
 * Thiếu một trong hai → trả `{ apDung: false }` NGAY, không gọi gì cả, không phải lỗi — nơi gọi
 * phải PHÂN BIỆT "không áp dụng" với "đã gửi thành công" (đừng gán `qlkCtrSyncStatus` cho PO
 * không liên quan việc này).
 *
 * 🔴 ĐIỀU KIỆN ② THÊM 15/09/2026 (Sếp cho phép sửa, xem khối đầu tệp). TRƯỚC ĐÓ CHỖ NÀY CHỈ CÓ ①,
 * kèm một chú thích giải thích rằng có `maDeXuatAppRequest` "nghĩa là đề nghị đó có công trình".
 * **Suy luận đó SAI**, đo được 15/09/2026:
 *   · `app/api/app-request/de-nghi-moi/route.ts` gán `maDeXuatAppRequest` cho **MỌI** đề nghị
 *     đến từ App Request, không phân biệt công trình hay phòng ban;
 *   · `congTrinhChuoi` là trường **tuỳ chọn** của App Request
 *     (`3-du-lieu/tich-hop-app-request-types.ts`);
 *   · thiếu nó thì `2-quy-trinh/tich-hop-app-request.ts` đặt `maDuAn = "PB-<mã phòng ban>"` và
 *     `tenCongTrinh = ""`.
 * ⇒ Hồ sơ PHÒNG BAN lọt chốt và vẫn được gửi PO sang QLK CTR với `tenCongTrinh` rỗng. Bên đó
 * hoặc treo ở một kho vô chủ, hoặc từ chối — và **không ai biết**, vì lỗi trước nay không được
 * lưu lại (xem `qlkCtrSyncError`, cùng đợt sửa này).
 *
 * 🔴 KHÔNG PHẢI CẮT ĐƯỜNG CỦA AI. Từ 15/09/2026 hồ sơ phòng ban đã có NHÁNH RIÊNG do Sếp duyệt
 * (`2-quy-trinh/ho-so-phong-ban.ts`): không có kho công trình nào nhận hàng, nhân viên mua hàng
 * tự ghi nhận giao hàng và đính kèm phiếu. Nên "không gửi sang QLK CTR" ở đây chính là đúng
 * nghiệp vụ, không phải bớt tính năng.
 *
 * 🔴 DÙNG `laHoSoPhongBan`, KHÔNG TỰ VIẾT LẠI PHÉP NHẬN DIỆN. Một luật một chỗ: hôm nào cách nhận
 * diện đổi (ví dụ App Request bổ sung trường `loaiHoSo` thật) thì chỉ phải sửa đúng một hàm, chứ
 * không phải đi soát xem còn chỗ nào trong app đang tự đoán theo kiểu riêng.
 *
 * QLK CTR nay TỰ CẬP NHẬT khi nhận lại cùng `poIdThuMua` (24/08/2026, xem `xuLyPOTuAppMuaHang`
 * bên QLK CTR) — nên gọi lại hàm này bao nhiêu lần cũng an toàn, kể cả PO đã "synced" từ trước.
 */
export async function guiPOSangQlkCtr(po: DonDatHang, deNghi: DeNghiMuaHang | undefined): Promise<KetQuaGuiQlkCtr> {
  const maDeXuat = deNghi?.maDeXuatAppRequest;
  if (!maDeXuat) return { apDung: false };
  if (laHoSoPhongBan(deNghi)) return { apDung: false };

  const payload = xayDungPayloadPO(po, maDeXuat);
  try {
    const res = await fetch("/api/qlk-ctr/gui-po", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      return { apDung: true, thanhCong: false, loi: catNganLoiQlkCtr(data.error ?? `HTTP ${res.status}`) };
    }
    return { apDung: true, thanhCong: true, snapshot: JSON.stringify(payload) };
  } catch (e) {
    return {
      apDung: true,
      thanhCong: false,
      loi: catNganLoiQlkCtr(e instanceof Error ? e.message : "Lỗi không xác định."),
    };
  }
}

/**
 * ★ (24/08/2026): PO này có thay đổi CHƯA ĐƯỢC gửi sang QLK CTR không — so khớp dấu vân tay
 * `qlkCtrSyncedSnapshot` (lưu lúc gửi thành công lần gần nhất) với dữ liệu HIỆN TẠI của PO.
 * Dùng ở `apDung()` để tự phát hiện Thu mua sửa PO sau khi đã đồng bộ, không chỉ retry khi lỗi.
 * Trả `false` luôn nếu đề nghị gốc không áp dụng (giống `guiPOSangQlkCtr`) — tránh gọi API vô ích.
 *
 * 🔴 CHỐT PHÒNG BAN PHẢI GIỐNG HỆT `guiPOSangQlkCtr` (thêm 15/09/2026). Hai hàm này là một cặp:
 * `kho-du-lieu.tsx` hỏi hàm này trước rồi mới gọi hàm kia. Để lệch nhau thì mỗi lần dữ liệu đổi,
 * vòng đồng bộ lại chấm PO phòng ban là "cần gửi lại", gọi sang `guiPOSangQlkCtr` để nhận đúng
 * `{ apDung: false }` — không hại gì nhưng là việc thừa lặp vĩnh viễn, và tệ hơn: người đọc sau
 * thấy hai chốt khác nhau sẽ tưởng sự khác nhau đó có chủ ý.
 */
export function canDongBoLaiPO(po: DonDatHang, deNghi: DeNghiMuaHang | undefined): boolean {
  const maDeXuat = deNghi?.maDeXuatAppRequest;
  if (!maDeXuat) return false;
  if (laHoSoPhongBan(deNghi)) return false;
  return JSON.stringify(xayDungPayloadPO(po, maDeXuat)) !== po.qlkCtrSyncedSnapshot;
}

// ============================================================
// PO ĐỘC LẬP (30/08/2026) — gửi ngay lúc lập, TRƯỚC KHI có đề nghị (`po.prId` chưa có), khớp bên
// QLK CTR theo CÔNG TRÌNH thay vì theo đề nghị. Xem `xuLyPoDocLapTuAppMuaHang` bên QLK CTR và kế
// hoạch đầy đủ đã duyệt. Đường đi giống hệt `guiPOSangQlkCtr`, chỉ khác route đích và payload
// không có `maDeXuatAppRequest`/`stt` (chưa có đề nghị nào để tra).
// ============================================================

function xayDungPayloadPODocLap(po: DonDatHang) {
  return {
    poIdThuMua: po.id,
    maDuAn: po.maDuAn,
    tenCongTrinh: po.tenCongTrinh,
    soPO: po.code,
    ncc: po.supplierTen,
    nccDiaChi: po.diaChiNCC,
    nccMST: po.maSoThueNCC,
    ngayLap: po.ngayLapPO,
    ngayGiao: po.ngayGiaoDuKien,
    // 🔴 (04/09/2026): Sếp phát hiện QLK CTR chỉ nhận đúng "từ ngày" (ngayGiaoDuKien), thiếu hẳn
    // "đến ngày" — bên Thu Mua ghi rõ 2 mốc "từ ngày – đến ngày" nhưng trước giờ chỉ gửi 1. Cần
    // cho "Hàng cần nhập" bên QLK CTR hiện đủ khoảng thật, không phải 1 mốc đơn.
    ngayGiaoDenNgay: po.ngayGiaoDenNgay,
    canCuHopDong: po.maHopDongCDT,
    diaDiemGiao: po.diaDiemGiaoHang,
    dieuKhoanKhac: po.dieuKhoanKhac,
    nguoiNhan: po.nguoiNhanHangTen,
    // Gửi kèm `quyCach` (khác `xayDungPayloadPO` ở trên) — không có dòng đề nghị gốc nào để đối
    // chiếu tên, quy cách là tín hiệu phân biệt DUY NHẤT khi công trình có nhiều vật tư trùng
    // tên+ĐVT.
    vatTu: po.items
      .filter(laDongHang)
      .map((d) => ({
        tenVatTu: d.tenVatLieu,
        quyCach: d.thongSoKyThuat,
        dvt: d.donViTinh,
        soLuongDat: d.khoiLuongDat,
      })),
  };
}

/**
 * ★★ PO NÀY THUỘC HỒ SƠ PHÒNG BAN? — THÊM 15/09/2026, SỬA CÓ PHÉP CỦA SẾP (xem khối đầu tệp).
 *
 * 🔴 `export` TỪ 15/09/2026 (tối) — ĐÂY LÀ PHÉP NHẬN DIỆN DUY NHẤT Ở TẦNG PO, cho cả ba nơi:
 *   · nơi GỬI (hai cặp hàm trong chính tệp này),
 *   · vòng TỰ ĐỒNG BỘ (`3-du-lieu/kho-du-lieu.tsx` → `apDung`),
 *   · GIAO DIỆN (`1-giao-dien/trang/don-hang-chi-tiet.tsx` → dải cảnh báo "chưa gửi được").
 * Ba nơi đó mà mỗi nơi tự đoán một kiểu thì lại sinh đúng cái sai Sếp vừa báo: đường gửi bỏ qua
 * hồ sơ phòng ban, còn màn hình vẫn la lên là "chưa gửi được".
 * ⚠️ Vẫn KHÔNG tự viết phép so sánh ở đây — mọi nhánh cuối cùng đều hỏi `laHoSoPhongBan`.
 *
 * 🔴 VÌ SAO PHẢI THÊM: sáng 15/09/2026 chốt "chỉ gửi hồ sơ CÔNG TRÌNH" mới chỉ được đặt ở
 * `guiPOSangQlkCtr`/`canDongBoLaiPO` (nhánh PO CÓ đề nghị). Nhánh PO ĐỘC LẬP vẫn hở nguyên: nó
 * không nhận `deNghi`, chỉ đọc `po.maDuAn`/`po.tenCongTrinh`, nên PO độc lập của phòng ban vẫn
 * gửi thẳng sang QLK CTR. Hở một nửa còn tệ hơn hở cả hai: người đọc thấy chốt ở nhánh trên sẽ
 * tưởng cả app đã được canh.
 *
 * 🔴 CÁCH NHẬN DIỆN — VÀ VÌ SAO CHỌN NHƯ VẬY:
 *   · CÓ đề nghị (nơi gọi tra ra được) → hỏi thẳng `laHoSoPhongBan(deNghi)`, y hệt nhánh trên.
 *     Tham số để tuỳ chọn vì hôm nay MỌI nơi gọi đều là PO chưa có đề nghị (`!po.prId`), nhưng
 *     để sẵn thì ngày nào có đề nghị trong tay là dùng được nguồn tốt hơn, không phải sửa lại
 *     chữ ký ở tệp thuộc vùng cấm §6.6.
 *   · KHÔNG có đề nghị → đưa CHÍNH `po.maHopDongCDT` vào `laHoSoPhongBan`. Vẫn là **một luật một
 *     chỗ** — không tự viết phép so sánh riêng ở đây. Ở PO không có trường `loaiHoSo` nên tầng ①
 *     của hàm đó tự nhiên không chạy, chỉ còn tầng ② ("không có hợp đồng chủ đầu tư = phòng ban").
 *
 * ⚠️ ĐÃ CÂN NHẮC VÀ LOẠI HAI PHƯƠNG ÁN KHÁC:
 *   · `po.tenCongTrinh` rỗng — đúng cái bẫy `ho-so-phong-ban.ts` đã phải sửa ngày 15/09: App
 *     Request nhét TIÊU ĐỀ ĐỀ NGHỊ vào ô tên công trình nên trường này gần như không bao giờ rỗng.
 *   · `po.maDuAn` bắt đầu `"PB-"` — đo thật cho **0/16**, và bám vào định dạng chuỗi của đội khác
 *     là tự buộc mình vào thứ họ đổi lúc nào cũng được.
 *
 * ⚠️ NHẬN DIỆN NHẦM CÓ THẬT, GHI RA ĐÂY ĐỂ KHÔNG AI TƯỞNG LÀ CHẮC CHẮN: ô "Số hợp đồng CĐT" trên
 * `form-lap-don-mua-hang.tsx` **cố ý KHÔNG bắt buộc** (chú thích tại đó nói rõ: bắt buộc là khoá
 * cứng nút Lưu với đơn phòng ban). Nên một PO độc lập của công trình THẬT mà người lập bỏ trống ô
 * đó sẽ bị chấm nhầm là phòng ban và **lặng lẽ không gửi sang QLK CTR**. Đây là đánh đổi có chủ ý:
 * gửi nhầm hồ sơ phòng ban sang QLK CTR thì hàng treo ở một kho vô chủ bên app của đội khác, còn
 * không gửi thì thủ kho không thấy đơn — cái sau người dùng phát hiện ngay, cái trước thì không.
 * Muốn chắc chắn thì phải có trường phân loại thật trên PO, không phải suy từ mã hợp đồng.
 */
export function laPOCuaHoSoPhongBan(po: DonDatHang, deNghi?: DeNghiMuaHang): boolean {
  if (deNghi) return laHoSoPhongBan(deNghi);
  return laHoSoPhongBan({ maHopDongCDT: po.maHopDongCDT });
}

/**
 * Gửi 1 PO ĐỘC LẬP sang QLK CTR — gọi ngay lúc lập (`po.prId` chưa có, `trangThai: "cho_de_nghi"`).
 * Khác `guiPOSangQlkCtr`: không cần đề nghị gốc, chỉ cần `po.maDuAn` (luôn bắt buộc khi tạo PO,
 * kể cả PO độc lập — xem `themDonHang`). Idempotent như hàm kia — gọi lại bao nhiêu lần cũng an
 * toàn (QLK CTR tự cập nhật theo `poIdThuMua`).
 *
 * 🔴 CHỐT PHÒNG BAN (15/09/2026, Sếp cho phép) — trả `{ apDung: false }` NGAY, giống hệt cách
 * `guiPOSangQlkCtr` xử hồ sơ phòng ban. Xem `laPOCuaHoSoPhongBan` ngay trên để biết vì sao.
 */
export async function guiPOSangQlkCtrDocLap(
  po: DonDatHang,
  deNghi?: DeNghiMuaHang,
): Promise<KetQuaGuiQlkCtr> {
  if (laPOCuaHoSoPhongBan(po, deNghi)) return { apDung: false };

  const payload = xayDungPayloadPODocLap(po);
  try {
    const res = await fetch("/api/qlk-ctr/gui-po-doc-lap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      return { apDung: true, thanhCong: false, loi: catNganLoiQlkCtr(data.error ?? `HTTP ${res.status}`) };
    }
    return { apDung: true, thanhCong: true, snapshot: JSON.stringify(payload) };
  } catch (e) {
    return {
      apDung: true,
      thanhCong: false,
      loi: catNganLoiQlkCtr(e instanceof Error ? e.message : "Lỗi không xác định."),
    };
  }
}

/**
 * Như `canDongBoLaiPO` nhưng cho PO độc lập — dùng khi `!po.prId`.
 *
 * 🔴 CHỐT PHÒNG BAN PHẢI GIỐNG HỆT `guiPOSangQlkCtrDocLap` (thêm 15/09/2026, Sếp cho phép). Đây
 * là CẶP HÀM thứ hai, đúng lý do đã ghi ở cặp `guiPOSangQlkCtr`/`canDongBoLaiPO`: `kho-du-lieu.tsx`
 * hỏi hàm này trước rồi mới gọi hàm kia. Để lệch nhau thì mỗi lần dữ liệu đổi, vòng đồng bộ lại
 * chấm PO phòng ban là "cần gửi lại", gọi sang `guiPOSangQlkCtrDocLap` để nhận đúng
 * `{ apDung: false }` — việc thừa lặp vĩnh viễn, và người đọc sau thấy hai chốt khác nhau sẽ
 * tưởng sự khác nhau đó có chủ ý.
 */
export function canDongBoLaiPODocLap(po: DonDatHang, deNghi?: DeNghiMuaHang): boolean {
  if (laPOCuaHoSoPhongBan(po, deNghi)) return false;
  return JSON.stringify(xayDungPayloadPODocLap(po)) !== po.qlkCtrSyncedSnapshot;
}
