// ============================================================
// QUYỀN THEO TỪNG HỒ SƠ — khác quyền theo CẤP
//
// `quyen.ts` trả lời "cấp này có được xem báo giá không". File này trả lời câu hẹp hơn:
// "người này có được xem báo giá CỦA ĐỀ NGHỊ NÀY không".
//
// 🔴 CHỈ ĐẠO BAN LÃNH ĐẠO 10/08/2026: *"Chỉ nhân viên nào được chia việc thì mới xem được
// báo giá, hoặc được thêm vào mục người theo dõi"*.
//
// Vì sao cần: báo giá chứa ĐƠN GIÁ của nhiều nhà cung cấp — thông tin thương mại nhạy cảm
// nhất của phòng thu mua. Cho cả phòng xem thì ai cũng biết giá của mọi công trình, kể cả
// việc mình không tham gia.
//
// ⚠️ ĐÂY CHƯA PHẢI BẢO MẬT THẬT. Nó chỉ chặn ở giao diện. Khi nối Firestore, phải chặn
// bằng Security Rules ở mức document (xem nguyên tắc dữ liệu số 3 trong CLAUDE.md) — ẩn
// trên giao diện thì người biết đường vẫn đọc được dữ liệu qua API.
// ============================================================

import type { DeNghiMuaHang } from "@/3-du-lieu/kieu-du-lieu";
import { tinhQuyen, type NguoiDung, type Quyen } from "@/4-phan-quyen/quyen";
import { laHoSoPhongBan } from "@/2-quy-trinh/ho-so-phong-ban";

/** Người này có được chia việc trong đề nghị (phụ trách ít nhất một dòng vật tư) không. */
export function duocChiaViec(deNghi: DeNghiMuaHang, uid: string): boolean {
  return deNghi.items.some((d) => d.nguoiPhuTrachUid === uid);
}

/** Người này có tên trong danh sách người theo dõi của đề nghị không. */
export function laNguoiTheoDoi(deNghi: DeNghiMuaHang, uid: string): boolean {
  return deNghi.nguoiTheoDoi?.some((n) => n.uid === uid) ?? false;
}

/**
 * ★★ ĐƠN HÀNG (PO) NÀY CÓ PHẢI VIỆC CỦA TÔI KHÔNG — Sếp 19/09/2026.
 *
 * Nguyên văn: *"Tạo thêm nút lọc để nhân viên có thể chọn chỉ hiển thị các PO **do mình làm hoặc
 * được theo dõi**"* (ảnh chụp màn Công nợ).
 *
 * Hai đường, đúng hai vế trong câu của Sếp:
 *   ① **do mình làm** → `po.nguoiPhuTrachUid` — gán bằng uid người lập lúc chốt đơn
 *      (`form-lap-don-mua-hang.tsx`). Trường này BẮT BUỘC nên luôn có.
 *   ② **được theo dõi** → danh sách người theo dõi nằm trên ĐỀ NGHỊ, không nằm trên PO, nên phải
 *      tra ngược qua `po.prId`.
 *
 * ⚠️ `po.prId` LÀ TUỲ CHỌN. PO độc lập (lập thẳng, chưa gắn đề nghị) không có đề nghị nào để tra
 * → vế ② trả `false`, chỉ còn vế ①. Đó là hành vi ĐÚNG, không phải thiếu sót: đơn không gắn đề
 * nghị thì không có ai "theo dõi" nó cả.
 *
 * 🔴 SO BẰNG `uid`, KHÔNG SO BẰNG TÊN. Tên người trùng nhau được, và đổi tên hiển thị là bộ lọc
 * lặng lẽ sai — đây là nếp đã có sẵn của `duocChiaViec` / `laNguoiTheoDoi` ngay trên.
 */
export function laDonHangCuaToi(
  po: { nguoiPhuTrachUid?: string; prId?: string },
  tatCaDeNghi: readonly DeNghiMuaHang[],
  uid: string,
): boolean {
  if (!uid) return false;
  if (po.nguoiPhuTrachUid === uid) return true;
  if (!po.prId) return false;
  const dn = tatCaDeNghi.find((x) => x.id === po.prId);
  return dn ? laNguoiTheoDoi(dn, uid) || duocChiaViec(dn, uid) : false;
}

/**
 * Có được xem bảng báo giá của đề nghị này không.
 *
 * Ba đường được xem:
 *   1. Cấp quản lý trở lên (`xemMoiHoSo`) — trưởng bộ phận phải xem hết để duyệt.
 *   2. Được chia việc trong đề nghị.
 *   3. Được thêm vào mục người theo dõi.
 *
 * ⚠️ Vẫn phải qua `quyen.xemBaoGia` trước: cấp không được xem báo giá thì dù có được chia
 * việc cũng không mở được (vd thủ kho, Phòng Thi công).
 */
export function duocXemBaoGiaCuaDeNghi(
  deNghi: DeNghiMuaHang,
  uid: string,
  quyen: Quyen,
): boolean {
  if (!quyen.xemBaoGia) return false;
  if (quyen.xemMoiHoSo) return true;
  return duocChiaViec(deNghi, uid) || laNguoiTheoDoi(deNghi, uid);
}

/**
 * ★ CÓ ĐƯỢC NHÂN BẢN (TÁCH) ĐỀ NGHỊ NÀY KHÔNG.
 *
 * 🔴 Ban lãnh đạo 15/08/2026: *"nhân viên được phép nhân bản phiếu đề nghị **mà mình phụ
 * trách**"*.
 *
 * Hai đường được tách:
 *   1. Cấp quản lý (`xemMoiHoSo` — trưởng bộ phận, quản trị): tách được mọi phiếu, vì họ là
 *      người chia việc cho cả phòng.
 *   2. Nhân viên ĐƯỢC CHIA VIỆC trong chính phiếu đó — tự tách phần việc của mình ra để giao
 *      lại cho người phù hợp, không phải chờ trưởng bộ phận làm hộ.
 *
 * ⚠️ Trước 15/08/2026 chỉ xét cấp (`lapPO`), nên một nhân viên tách được cả phiếu của người
 * khác — phiếu đang chạy tự nhiên mọc thêm bản sao mà người phụ trách không hay.
 *
 * ⚠️ Vẫn phải qua `quyen.lapPO`: vai trò chỉ được xem (thủ kho, Phòng Thi công, Kế toán)
 * thì không tạo được hồ sơ mới dưới bất kỳ hình thức nào.
 */
export function duocNhanBanDeNghi(
  deNghi: DeNghiMuaHang,
  uid: string,
  quyen: Quyen,
): boolean {
  if (!quyen.lapPO) return false;
  if (quyen.xemMoiHoSo) return true;
  return duocChiaViec(deNghi, uid);
}

/**
 * NHỮNG DÒNG VẬT TƯ NGƯỜI NÀY ĐƯỢC NHÌN THẤY trong một đề nghị.
 *
 * 🔴 Chỉ đạo Ban lãnh đạo 12/08/2026: *"chỉ cần hiện công việc được phân công, không cần
 * hiển thị toàn bộ danh mục request"*.
 *
 * Trước đó nhân viên được giao 1 dòng vẫn nhìn thấy **cả 3 dòng** của đề nghị và nhập được
 * giá cho cả 3 — vừa lộ phần việc của đồng nghiệp, vừa dễ nhập nhầm vào dòng người khác
 * đang phụ trách.
 *
 * Luật:
 *   · Cấp quản lý trở lên (`xemMoiHoSo`) → thấy hết. Trưởng bộ phận phải nhìn toàn cảnh
 *     mới phân bổ và duyệt được.
 *   · Còn lại → chỉ thấy dòng ghi tên mình phụ trách.
 *
 * 📌 25/09/2026 — Sếp chốt ***"cách 2"***: bảng phân bổ nay HIỆN ĐỦ mọi dòng cho mọi nhân viên
 * Thu mua (chỉ xem), để chủ động trước khi được giao. Hàm này KHÔNG đổi: nó giờ trả lời *"dòng
 * nào là việc CỦA người này"* — vẫn dùng để khoá xoá/thêm dòng và đánh dấu dòng của mình. Xem
 * `bang-phan-bo.tsx` → `dongCuaMinh`.
 *
 * ⚠️ Người CHƯA được giao dòng nào sẽ nhận về danh sách RỖNG. Nơi gọi phải hiện câu giải
 * thích tử tế, đừng để màn hình trắng trơn — người dùng sẽ tưởng app hỏng.
 *
 * 📌 Trả về mảng số thứ tự dòng (`stt`) để nơi gọi tự lọc theo cấu trúc của mình: bảng
 * phân bổ lọc `deNghi.items`, còn bảng báo giá lọc theo `sttDongDeNghi`.
 */
export function sttDongDuocXem(
  deNghi: DeNghiMuaHang,
  uid: string,
  quyen: Quyen,
): number[] {
  if (quyen.xemMoiHoSo) return deNghi.items.map((d) => d.stt);
  return deNghi.items.filter((d) => d.nguoiPhuTrachUid === uid).map((d) => d.stt);
}

/**
 * AI ĐƯỢC CHUYỂN VIỆC của một dòng vật tư sang người khác.
 *
 * 🔴 SIẾT LẠI 15/08/2026 — Ban lãnh đạo: *"tài khoản của nhân viên thì không được có chức
 * năng này, chỉ cấp quản lý và cấp quản trị mới có quyền giao lại việc cho người khác"*.
 *
 * Chỉ `quyen.phanBoCongViec` (Trưởng bộ phận cấp 3 trở lên · Quản trị hệ thống).
 *
 * ⚠️ ĐỔI SO VỚI CHỈ ĐẠO 12/08/2026. Trước đó **chính người đang phụ trách** cũng tự chuyển
 * được, với lý lẽ "người biết mình không làm được là chính họ". Ban lãnh đạo cân nhắc lại và
 * quyết theo hướng chặt hơn: giao việc cho ai là quyết định của người điều phối, để nhân
 * viên tự đẩy việc qua lại thì trưởng bộ phận không còn nắm được ai đang làm gì.
 *
 * 📌 Nhân viên không làm được thì báo trưởng bộ phận — họ có nút này. Đường đi dài hơn một
 * nhịp, nhưng người chịu trách nhiệm phân công vẫn là người quyết.
 *
 * ⚠️ Tham số `dong` và `uid` GIỮ LẠI dù không còn dùng để xét: chữ ký hàm là chỗ mọi nơi gọi
 * đang bám vào, và nếu Ban lãnh đạo mở lại quyền cho người phụ trách thì chỉ sửa đúng thân
 * hàm này. Đổi chữ ký chỉ để bớt hai tham số là đụng vào mọi nơi gọi, lợi bất cập hại.
 */
export function duocChuyenViecDong(
  _dong: { nguoiPhuTrachUid?: string },
  _uid: string,
  quyen: Quyen,
): boolean {
  return quyen.phanBoCongViec;
}

/** Có bị giấu bớt dòng nào không — để giao diện nói rõ "đang chỉ hiện phần của bạn". */
export function coLocTheoPhanViec(
  deNghi: DeNghiMuaHang,
  uid: string,
  quyen: Quyen,
): boolean {
  return sttDongDuocXem(deNghi, uid, quyen).length < deNghi.items.length;
}


// ============================================================
// ★★ NHÁNH HỒ SƠ PHÒNG BAN — AI ĐƯỢC GHI NHẬN VIỆC GIAO HÀNG
//
// 🔴 CHỈ ĐẠO SẾP 14/09/2026, nguyên văn: *"Các đề xuất từ phòng ban thì sẽ đi nhánh riêng, không
// cần lấy dữ liệu từ app kho công trình mà nhân viên mua hàng sẽ là người bấm hoàn thành và đính
// kèm phiếu giao hàng."*
//
// VÌ SAO KHÔNG SỬA `quyen.ts`: `ghiPhieuNhanHang` / `xacNhanKho` ở đó là cờ TOÀN CỤC, tính một lần
// từ (vai trò, cấp quyền, chức năng) — nó **không biết đang đứng ở hồ sơ nào**. Nới ở đó là nới cho
// MỌI hồ sơ, kể cả hồ sơ công trình, tức xoá mất chốt "chỉ thủ kho xác nhận hàng về" của cả app.
// Câu hỏi ở đây hẹp hơn một bậc — *"người này có được ghi nhận giao hàng CỦA HỒ SƠ NÀY không"* —
// nên nó thuộc về tệp này, đúng khuôn `duocXemBaoGiaCuaDeNghi` ở trên.
// ============================================================

/**
 * Cấp tối thiểu để được ghi nhận giao hàng theo nhánh phòng ban.
 *
 * Cấp 1 là "Xem" theo chuẩn App Tổng (1 thấp nhất → 4 cao nhất, xem `quyen.ts`) — người chỉ được
 * xem thì không ghi chứng từ. Từ cấp 2 "Nhập liệu" trở lên mới là người làm dữ liệu.
 *
 * ⚠️ ĐỪNG ĐỌC NGƯỢC THANG NÀY. Bản `thumua-next` cũ ghi nhãn ngược (*"Level 1 = Trưởng phòng toàn
 * quyền"*); lấy nhầm nhãn đó là điều kiện `>= 2` biến thành "chặn đúng người cần mở".
 */
const CAP_TOI_THIEU_GHI_NHAN_GIAO_HANG = 2;

/**
 * Người này có phải là người THU MUA đủ tư cách ghi nhận giao hàng cho hồ sơ phòng ban không.
 *
 * Hai đường, cả hai đều nằm TRONG phòng thu mua:
 *   1. Nhân viên / trưởng bộ phận thu mua từ cấp 2 (Nhập liệu) trở lên — đúng đối tượng Sếp chỉ
 *      định ("nhân viên mua hàng sẽ là người bấm hoàn thành").
 *   2. Người được chia việc trong chính hồ sơ đó (phụ trách ít nhất một dòng vật tư).
 *
 * ⚠️ ĐƯỜNG 2 VẪN ĐÒI CẤP >= 2, KHÔNG mở trơn theo "có tên trong phân bổ". Phân bổ hiện chỉ chọn
 * được nhân viên thu mua có tài khoản (`nhanVienThuMuaCoTaiKhoan`) nên trên thực tế hai đường
 * trùng nhau — nhưng nếu sau này quản trị gán tay một dòng cho người ngoài phòng thu mua (QLDA,
 * Phòng Thi công, cấp 1 chỉ được xem) thì đường 2 sẽ lặng lẽ cấp cho họ quyền ghi chứng từ nhận
 * hàng. Giữ sàn cấp 2 ở đây thì cái đó không xảy ra được, đúng luật dự án *"thiếu thông tin thì
 * cho quyền THẤP NHẤT"*.
 */
/**
 * Người được xét ở nhánh "người thu mua" — `uid/chucNang/capTM` như trước, cộng (không bắt buộc) các
 * trường cần để tính QUYỀN HIỆU LỰC. Nơi gọi truyền nguyên `nguoiDung` của `useNguoiDung()` là đủ —
 * trường `quyenRieng` đã được `nguoi-dung-hien-tai.tsx` gắn sẵn. Kiểu cũ `Pick<…>` vẫn gán vào được,
 * nên không nơi gọi nào phải sửa (có nơi gọi nằm trong tệp đang cấm sửa).
 */
type NguoiDungXetThuMua = Pick<NguoiDung, "uid" | "chucNang" | "capTM"> &
  Partial<Pick<NguoiDung, "vaiTro" | "capKho" | "quyenRieng">>;

/**
 * ★★ Ô TICK CÓ CHO NGƯỜI NÀY LÀM VIỆC THU MUA KHÔNG — Sếp 26/09/2026: *"Nối vào ô tíck"* (giới hạn G
 * trong `4-phan-quyen/README.md`).
 *
 * 🔴 CHỌN CỜ `lapPO` ("Lập đơn mua hàng"), vì nhánh này hỏi đúng một câu: *người này có đang LÀM thu
 * mua không*. Bỏ tick "Lập đơn mua hàng" là rút người đó khỏi việc mua hàng → cũng không ghi nhận giao
 * hàng / xác nhận nhận đủ / ghi dấu đối chiếu thay phòng thu mua được nữa.
 *   · KHÔNG chọn `xacNhanKho`: Sếp 17/09/2026 chốt *"chỉ nhân viên thu mua"* bấm xác nhận nhận đủ hàng
 *     và đã CỐ Ý gỡ cờ kho khỏi luật này (xem chú thích `duocXacNhanNhanDuHangCuaHoSo`). Nối lại cờ kho
 *     là đảo chỉ đạo, và nhân viên thu mua (không có `xacNhanKho`) mất quyền ngay khi deploy.
 *   · KHÔNG chọn `ghiPhieuNhanHang`: đó là cờ của THỦ KHO (ghi số thực nhận). Nhân viên thu mua không
 *     có nó theo chức danh — dùng nó là cả phòng thu mua mất quyền ghi nhận nhánh phòng ban.
 *
 * 📌 NGƯỜI CHƯA CÓ QUYỀN RIÊNG → KHÔNG XÉT (trả `true`), để kết quả Y HỆT luật theo chức danh cũ — không
 * ai mất quyền khi deploy. Với mọi chức danh chuẩn cấp ≥ 2 (Quản trị · Trưởng BP · NV Thu mua · NV Nhân
 * sự · NV Kho tổng) `lapPO` theo chức danh vốn đã bật, nên xét hay không cũng như nhau; bỏ qua ở đây là
 * để hồ sơ "Tùy chỉnh" lạ (vd kế toán cấp 2 được chia việc) không bị đổi hành vi lặng lẽ. Bài kiểm hai
 * chiều ở `kiem-luat-dung-chung.mjs`.
 *
 * @param quyen Quyền HIỆU LỰC nếu nơi gọi đã có sẵn (vd `duocGhiNhanGiaoHangCuaHoSo`). Vắng thì tự tính
 *              từ `nguoiDung` bằng `tinhQuyen` — cùng một hàm cả app dùng.
 */
function tickChoLamThuMua(nguoiDung: NguoiDungXetThuMua, quyen?: Pick<Quyen, "lapPO">): boolean {
  if (!nguoiDung.quyenRieng) return true;
  const q =
    quyen ??
    tinhQuyen({
      uid: nguoiDung.uid,
      tenHienThi: "",
      chucDanh: "",
      phongBan: "",
      chucNang: nguoiDung.chucNang,
      capTM: nguoiDung.capTM,
      vaiTro: nguoiDung.vaiTro ?? "staff",
      capKho: nguoiDung.capKho,
      quyenRieng: nguoiDung.quyenRieng,
    });
  return q.lapPO;
}

function laNguoiThuMuaGhiNhanDuoc(
  deNghi: DeNghiMuaHang,
  nguoiDung: NguoiDungXetThuMua,
  quyen?: Pick<Quyen, "lapPO">,
): boolean {
  if (nguoiDung.capTM < CAP_TOI_THIEU_GHI_NHAN_GIAO_HANG) return false;
  /* ★ Sếp 26/09/2026 "Nối vào ô tíck" — xem `tickChoLamThuMua`. */
  if (!tickChoLamThuMua(nguoiDung, quyen)) return false;
  const laNguoiThuMua =
    nguoiDung.chucNang === "nhan_vien_thu_mua" ||
    nguoiDung.chucNang === "truong_bo_phan_thu_mua";
  return laNguoiThuMua || duocChiaViec(deNghi, nguoiDung.uid);
}

/**
 * ★★ CÓ ĐƯỢC ĐÍNH KÈM / GHI NHẬN PHIẾU GIAO HÀNG CỦA HỒ SƠ NÀY KHÔNG.
 *
 * Hai đường:
 *   1. `quyen.ghiPhieuNhanHang` — đường sẵn có, KHÔNG ĐỤNG TỚI (thủ kho công trình cấp kho >= 2,
 *      quản trị). Mọi hồ sơ, như từ trước tới nay.
 *   2. ★ MỚI: hồ sơ PHÒNG BAN + người thu mua đủ tư cách (xem `laNguoiThuMuaGhiNhanDuoc`).
 *
 * 🔴 KHOÁ CHẶT THEO `laHoSoPhongBan`, KHÔNG NỚI SANG HỒ SƠ CÔNG TRÌNH. Hồ sơ công trình có kho
 * công trình thật, và chốt "người xác nhận hàng về phải là người nhận hàng" là chốt kiểm soát
 * nặng nhất của app: người đi mua tự ký nhận hàng của chính mình thì không còn ai đối chứng. Nhánh
 * này mở được CHỈ VÌ hồ sơ phòng ban **không có kho nào để đối chứng** — bỏ điều kiện đó là mất
 * chốt của cả app, không phải nới một chút.
 *
 * ⚠️ `deNghi` là `null`/`undefined` (đơn hàng chưa gắn đề nghị — PO "chờ đề nghị") thì
 * `laHoSoPhongBan` trả `false` → KHÔNG nới. Cố ý: không biết hồ sơ nào thì không biết có kho hay
 * không, mà thiếu thông tin thì cho quyền thấp nhất.
 */
export function duocGhiNhanGiaoHangCuaHoSo(
  deNghi: DeNghiMuaHang | null | undefined,
  nguoiDung: NguoiDungXetThuMua,
  quyen: Quyen,
): boolean {
  if (quyen.ghiPhieuNhanHang) return true;
  if (!deNghi || !laHoSoPhongBan(deNghi)) return false;
  /* Truyền `quyen` (đã là quyền hiệu lực ở mọi nơi gọi) để ô tick "Lập đơn mua hàng" áp đúng một
     nguồn — Sếp 26/09/2026 "Nối vào ô tíck", xem `tickChoLamThuMua`. */
  return laNguoiThuMuaGhiNhanDuoc(deNghi, nguoiDung, quyen);
}

/**
 * ★★ CÓ ĐƯỢC XÁC NHẬN ĐÃ NHẬN ĐỦ HÀNG CỦA HỒ SƠ NÀY KHÔNG (điều kiện ② hoàn thành PO).
 *
 * Cùng khuôn `duocGhiNhanGiaoHangCuaHoSo` ngay trên, chỉ khác cờ nền là `quyen.xacNhanKho`.
 *
 * 🔴 TÁCH LÀM HAI HÀM DÙ THÂN GIỐNG NHAU. Hai cờ nền là hai quyền riêng trong `quyen.ts`
 * (`ghiPhieuNhanHang` và `xacNhanKho`) và Ban lãnh đạo có thể tách chúng bất cứ lúc nào — gộp làm
 * một hàm là tự buộc hai việc khác nhau vào cùng một câu trả lời, rồi lần sau nới một cái là nới
 * luôn cái kia mà không ai thấy.
 *
 * ⚠️ ĐÂY CHỈ LÀ QUYỀN, KHÔNG PHẢI ĐIỀU KIỆN NGHIỆP VỤ. Hàng đã về đủ chưa, mọi lần giao đã có
 * phiếu giao nhận chưa — đó là việc của `poDaGiaoDu` và `vuongMacXacNhanKho`
 * (`2-quy-trinh/tinh-toan.ts`). Nhánh phòng ban KHÔNG được bỏ qua hai luật đó: nhân viên mua hàng
 * vẫn phải đính kèm phiếu giao hàng cho từng lần giao rồi mới bấm hoàn thành được, đúng chỉ đạo
 * 11/08/2026 và đúng câu của Sếp 14/09/2026 (*"bấm hoàn thành **và** đính kèm phiếu giao hàng"*).
 */
/**
 * ════════════════════════════════════════════════════════════════════════════════════════
 * ★★★ ĐÃ ĐỔI 17/09/2026 — SẾP MÔ TẢ LẠI QUY TRÌNH THẬT. ĐỪNG SỬA NGƯỢC MÀ KHÔNG HỎI.
 * ════════════════════════════════════════════════════════════════════════════════════════
 * Nguyên văn Sếp: *"Kho chỉ gửi phiếu đánh đủ số lượng, còn thu mua trên app thu mua bấm
 * xác nhận nhận hàng qua bước chứ"*. Hỏi lại ai còn được bấm, Sếp chốt **phương án B: chỉ
 * nhân viên thu mua**.
 *
 * 🔴 HAI VIỆC KHÁC NHAU, TRƯỚC ĐÂY BỊ GỘP LÀM MỘT:
 *   ① GHI SỐ THỰC NHẬN — vẫn là việc của kho, không đổi một chữ. Kho ghi phiếu bên app QLK
 *      CTR, phiếu tự sinh sang đây. Luật *"kho là nguồn duy nhất của số thực nhận"* còn
 *      nguyên hiệu lực.
 *   ② BẤM XÁC NHẬN ĐỂ HỒ SƠ QUA BƯỚC — nay là việc của thu mua. Đây là thao tác quản lý
 *      quy trình, không phải khai số liệu.
 *
 * 🔴 VÌ SAO BỎ HẲN `quyen.xacNhanKho` CHỨ KHÔNG CỘNG THÊM: Sếp chọn B chứ không chọn "cả
 * hai cùng bấm được". Để cờ kho lại là hai bên cùng bấm được, và khi hồ sơ qua bước thì
 * không ai biết ai đã bấm — đúng thứ sinh ra tranh cãi trách nhiệm sau này.
 *
 * 🔴 VÌ SAO BỎ CHẶN `laHoSoPhongBan`: trước đây thu mua chỉ bấm được hồ sơ phòng ban, còn
 * hồ sơ công trình phải chờ thủ kho. Nay cả hai loại đều do thu mua bấm, nên phép chặn đó
 * mất lý do tồn tại.
 *
 * ⚠️ ĐÂY CHỈ LÀ QUYỀN, KHÔNG PHẢI ĐIỀU KIỆN NGHIỆP VỤ — phần này KHÔNG đổi:
 *   · `poDaGiaoDu` vẫn bắt hàng phải về đủ mới hiện nút;
 *   · `vuongMacXacNhanKho` vẫn bắt mọi lần giao phải có phiếu giao nhận.
 * Sếp xác nhận giữ cả hai ràng buộc này ngày 17/09/2026. Bỏ chúng là đóng đơn không chứng
 * từ — đúng thứ hai luật kia sinh ra để chặn.
 *
 * 📌 THAM SỐ `quyen` ĐÃ BỎ HẲN, không để lại dạng `_quyen`. Giữ một tham số không ai dùng
 * là mời người sau tưởng quyền kho vẫn còn tác dụng ở đây rồi nối lại nhầm.
 *
 * ★ Sếp 26/09/2026 *"Nối vào ô tíck"*: nay có thêm ô tick "Lập đơn mua hàng" (cờ `lapPO`, KHÔNG phải
 * cờ kho) — tính từ `nguoiDung.quyenRieng` bên trong `laNguoiThuMuaGhiNhanDuoc`, nên chữ ký hàm không
 * đổi (một nơi gọi nằm ở `de-nghi-chi-tiet.tsx`). Người chưa có quyền riêng: y hệt trước.
 */
export function duocXacNhanNhanDuHangCuaHoSo(
  deNghi: DeNghiMuaHang | null | undefined,
  nguoiDung: NguoiDungXetThuMua,
): boolean {
  if (!deNghi) return false;
  return laNguoiThuMuaGhiNhanDuoc(deNghi, nguoiDung);
}

/**
 * ★ VIỆC NÀY ĐANG MỞ **NHỜ** NHÁNH PHÒNG BAN (chứ không phải nhờ quyền sẵn có) — để giao diện
 * biết lúc nào phải in câu `LY_DO_NHANH_PHONG_BAN`.
 *
 * 🔴 KHÔNG NỚI IM LẶNG. Người dùng thấy hồ sơ phòng ban làm được việc mà hồ sơ công trình không
 * làm được sẽ tưởng app lỗi, hoặc tưởng luật đã đổi cho tất cả rồi đi đòi làm y vậy trên hồ sơ
 * công trình. Nói rõ ngay tại chỗ là cách rẻ nhất chặn hiểu nhầm đó.
 *
 * 📌 ĐẶT Ở ĐÂY CHỨ KHÔNG ĐỂ GIAO DIỆN TỰ SO `duocGhiNhan... && !quyen.ghiPhieuNhanHang`. Phép so
 * đó đúng hôm nay, nhưng thêm một đường mở thứ ba vào `duocGhiNhanGiaoHangCuaHoSo` là nó âm thầm
 * in nhầm lý do. Một luật, một chỗ.
 */
export function ghiNhanGiaoHangNhoNhanhPhongBan(
  deNghi: DeNghiMuaHang | null | undefined,
  nguoiDung: NguoiDungXetThuMua,
  quyen: Quyen,
): boolean {
  if (quyen.ghiPhieuNhanHang) return false; // đã có quyền sẵn, không phải nhờ nhánh này
  return duocGhiNhanGiaoHangCuaHoSo(deNghi, nguoiDung, quyen);
}

/**
 * ★★ CÓ ĐƯỢC GHI DẤU ĐỐI CHIẾU CỦA PHÒNG THU MUA LÊN MỘT PHIẾU NHẬN KHÔNG — Sếp 17/09/2026.
 *
 * Sếp: *"bước tiến hành nhận hàng… là bước **check song song** với dữ liệu từ app kho đưa về"*,
 * và chốt làm theo hướng **đối chiếu**, không phải hướng ghi thay kho.
 *
 * 🔴 MỞ CHO **MỌI HỒ SƠ**, KHÔNG KHOÁ THEO `laHoSoPhongBan` — khác hẳn hai hàm ghi nhận ở trên, và
 * đây là chỗ dễ hiểu nhầm nhất của tệp này. Hai hàm kia bị khoá vì chúng **sinh ra khối lượng**:
 * cho thu mua tự ghi trên hồ sơ công trình là mất người đối chứng, và đụng ngay lỗi đếm trùng mã
 * phiếu (xem `thuMuaDoiChieu` ở `kieu-du-lieu.ts`). Dấu này **không sinh khối lượng nào**, nó chỉ
 * nói *"thu mua đã soi phiếu này"* — mà soi chéo số của kho thì đúng việc của hồ sơ công trình
 * nhất, vì đó mới là nơi có phiếu kho để soi.
 *
 * 🔴 ĐÒI ĐÚNG NGƯỜI PHÒNG THU MUA, cấp ≥ 2 (Nhập liệu) — dùng lại `laNguoiThuMuaGhiNhanDuoc` để
 * không sinh thang cấp thứ hai. Thủ kho KHÔNG ghi dấu này: họ là bên bị đối chiếu, tự soi mình
 * thì dấu vô nghĩa.
 *
 * ★ Sếp 26/09/2026 *"Nối vào ô tíck"*: cùng điều kiện ô tick "Lập đơn mua hàng" như hai hàm trên
 * (qua `laNguoiThuMuaGhiNhanDuoc`).
 */
export function duocGhiDoiChieuThuMua(
  deNghi: DeNghiMuaHang | null | undefined,
  nguoiDung: NguoiDungXetThuMua,
): boolean {
  if (!deNghi) return false;
  return laNguoiThuMuaGhiNhanDuoc(deNghi, nguoiDung);
}

/** Lý do bị chặn, để nói cho người dùng biết phải làm gì. Trả `null` khi được xem. */
export function lyDoKhongXemBaoGia(
  deNghi: DeNghiMuaHang,
  uid: string,
  quyen: Quyen,
): string | null {
  if (duocXemBaoGiaCuaDeNghi(deNghi, uid, quyen)) return null;
  if (!quyen.xemBaoGia) {
    return "Cấp quyền của bạn không được xem bảng báo giá.";
  }
  return "Bảng báo giá chỉ mở cho người được chia việc trong đề nghị này, hoặc người được thêm vào mục người theo dõi. Đề nghị trưởng bộ phận phân bổ việc cho bạn hoặc thêm bạn vào người theo dõi.";
}

/**
 * ★★ NGƯỜI NÀY CÓ ĐƯỢC XEM TIẾN TRÌNH ĐỀ NGHỊ NÀY KHÔNG — màn "Theo dõi đề nghị" (danh sách,
 * cách xem theo mặt hàng, và trang chi tiết `/theo-doi/[id]`).
 *
 * 🔴 MỘT LUẬT CHO CẢ BA CHỖ (25/09/2026). Trước đây luật này viết TAY ngay trong
 * `theo-doi-danh-sach.tsx`, còn trang chi tiết thì KHÔNG kiểm gì — tìm thẳng đề nghị theo id trong
 * cả kho, nên ai biết địa chỉ `/theo-doi/<id>` là xem được tiến trình đề nghị của phòng khác
 * (agent phản biện 25/09 phát hiện). Nay cả ba chỗ hỏi cùng một hàm.
 *
 * Luật (giữ nguyên như bộ lọc danh sách từ 15/08/2026): cấp quản lý thấy hết; còn lại chỉ đề
 * nghị mình LẬP, được CHIA VIỆC, hoặc có tên trong danh sách THEO DÕI.
 *
 * ⚠️ Toàn bộ dữ liệu chạy thử vẫn tải về trình duyệt (CLAUDE.md §3.6b) — chặn ở đây là chặn
 * GIAO DIỆN, chưa phải bảo mật thật. Bảo mật thật cần tách document khi lên bản chính thức.
 */
export function duocXemTienTrinhDeNghi(deNghi: DeNghiMuaHang, uid: string, quyen: Quyen): boolean {
  if (quyen.xemMoiHoSo) return true;
  if (!uid) return false;
  return deNghi.nguoiDeNghiUid === uid || duocChiaViec(deNghi, uid) || laNguoiTheoDoi(deNghi, uid);
}
