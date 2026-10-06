// ============================================================
// TỆP CỦA PHIÊN NGHIỆP VỤ — CHỈ MÁY CHỦ
//
// Phần dùng chung của hai cửa phân quyền (Sếp 06/10/2026 — mẫu chức danh sửa được, Câu 1 = A ·
// Câu 2 = B · Câu 3 = A):
//   · `app/api/quyen-rieng/route.ts`         — GET quyền của mình / `?tatCa=1` / `?biKhoa=1`, POST tick riêng
//   · `app/api/quyen-mau-chuc-danh/route.ts` — POST sửa bảng mẫu quyền theo chức danh
//
// 📌 VÌ SAO TÁCH RA TỆP NÀY: tệp `route.ts` của Next chỉ được export các tên route (`GET`, `POST`,
// `preferredRegion`…) — export thêm hàm là lỗi dựng. Hai cửa cần CHUNG cách đọc vé, đọc hồ sơ, đọc bản
// ghi quyền riêng, đọc mẫu và dựng người gọi; chép hai nơi là sớm muộn lệch nhau.
//
// 📌 KHÔNG PHẢI VÙNG CỦA PHIÊN TÍCH HỢP. Tệp này chỉ GỌI hàm/hằng export của `hpcore-may-chu.ts` và
// `ho-so-tai-khoan.ts` (vùng cấm — CLAUDE.md §6.6), không sửa chúng.
//
// 🔴 KHÔNG VIẾT LUẬT Ở ĐÂY. Mọi phép tính quyền (mẫu, ngoại lệ, ai sửa được gì, ghi gì / xoá gì) nằm ở
// hàm thuần của `4-phan-quyen/` — route và kho demo cùng gọi. Tệp này chỉ ĐỌC Firestore rồi trao dữ
// liệu cho các hàm đó.
//
// 🔴 ĐỌC LỖI KHÔNG BAO GIỜ THÀNH "CHƯA CÓ". Ở dự án này "chưa có bản ghi" / "mẫu trống" nghĩa là theo
// chức danh — quyền RỘNG hơn. Nên:
//   · bản ghi quyền riêng TỒN TẠI mà sai khuôn → NÉM (soát chéo lần 2 26/09/2026);
//   · tài liệu mẫu hỏng (hoặc vắng mà còn dấu vết đã từng có — bổ sung đặc tả B-F8) → NÉM `LoiMauHong`,
//     route trả 500 `maLoi:"mau-hong"`; trình duyệt chặn vào app (trừ Quản trị — họ cứu được mẫu).
//
// 📌 `import "server-only"` (bổ sung đặc tả C-F4): gói `server-only` KHÔNG nằm riêng ở
// `node_modules/server-only` — Next.js tự trỏ tên này vào bản kèm sẵn
// `node_modules/next/dist/compiled/server-only` (đã kiểm 06/10/2026). Cùng cách `hpcore-may-chu.ts` và
// `kho-r2.ts` đang dùng; không cài thêm gói nào. Lỡ có tệp phía trình duyệt nạp tệp này thì dựng hỏng
// ngay, không lặng lẽ kéo `firebase-admin` vào bundle.
// ============================================================

import "server-only";
import type { NextRequest } from "next/server";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { fetchVaiTroToanCuc, getThuMuaDb } from "@/5-ket-noi/hpcore-may-chu";
import {
  BO_SUU_TAP_NGUOI_DUNG,
  hopLe,
  thanhNguoiDung,
  type HoSoTaiKhoan,
} from "@/5-ket-noi/ho-so-tai-khoan";
import type { NguoiDung } from "@/4-phan-quyen/quyen";
import { VAI_TRO_CHUAN } from "@/4-phan-quyen/vai-tro-chuan";
import type { NguoiGoiTraoQuyen } from "@/4-phan-quyen/luat-phan-quyen";
import {
  BO_SUU_TAP_QUYEN_RIENG,
  chuanHoaBanGhiQuyenRieng,
  type BanGhiQuyenRieng,
} from "@/4-phan-quyen/quyen-rieng";
import {
  BO_SUU_TAP_MAU_CHUC_DANH,
  docMauChucDanh,
  MA_TAI_LIEU_MAU_CHUC_DANH,
  type MauChucDanh,
} from "@/4-phan-quyen/mau-chuc-danh";
import { ganQuyenRiengHieuLuc } from "@/4-phan-quyen/tinh-luu-phan-quyen";

/** Vé đăng nhập từ header `Authorization: Bearer …`. Không có → `undefined` (route trả 401). */
export function layIdToken(req: NextRequest): string | undefined {
  const m = (req.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
  return m?.[1];
}

/** Mã Firebase hợp lệ để làm id tài liệu — chặn chuỗi có `/` hay ký tự lạ lọt vào đường dẫn. */
export const MA_HOP_LE = /^[A-Za-z0-9_-]{1,128}$/;

export const refHoSo = (uid: string) => getThuMuaDb().collection(BO_SUU_TAP_NGUOI_DUNG).doc(uid);
export const refRieng = (uid: string) => getThuMuaDb().collection(BO_SUU_TAP_QUYEN_RIENG).doc(uid);
/**
 * Tài liệu mẫu chức danh `quyen-mau-chuc-danh/chung` — collection RIÊNG, không nằm trong
 * `tm_quyen_rieng` (cửa `?tatCa=1` đọc cả collection đó và ném khi gặp tài liệu sai khuôn).
 */
export const refMau = () => getThuMuaDb().collection(BO_SUU_TAP_MAU_CHUC_DANH).doc(MA_TAI_LIEU_MAU_CHUC_DANH);

/** Owner App Tổng (vai trò toàn cục ở project App Tổng, đã cache 30 giây). Đọc lỗi → `false`. */
export const laOwner = async (uid: string) => (await fetchVaiTroToanCuc(uid)) === "owner";

/**
 * Bản ghi quyền riêng từ ảnh tài liệu: KHÔNG tồn tại → `null` (chưa có); TỒN TẠI mà sai khuôn → NÉM.
 * Đọc qua `chuanHoaBanGhiQuyenRieng` — một chỗ đọc cho cả khuôn 1 (từ 26/09) lẫn khuôn 2 (06/10/2026).
 */
export function banGhiTuAnh(uid: string, anh: DocumentSnapshot | undefined): BanGhiQuyenRieng | null {
  if (!anh?.exists) return null;
  const b = chuanHoaBanGhiQuyenRieng(anh.data());
  if (!b) throw new Error(`${BO_SUU_TAP_QUYEN_RIENG}/${uid} sai khuôn — không đoán thành "chưa có".`);
  return b;
}

/**
 * Hồ sơ nghiệp vụ từ ảnh tài liệu `nguoi-dung/{uid}`. `null` = chưa có hồ sơ hợp lệ ở app Thu mua.
 *
 * 📌 Owner App Tổng → toàn quyền như Quản trị, BẤT KỂ hồ sơ riêng — đúng ngoại lệ ở
 * `docHoSoTaiKhoan()` (trình duyệt) và `app/api/phan-quyen` (máy chủ).
 */
export function nguoiDungTuAnh(
  uid: string,
  owner: boolean,
  anh: DocumentSnapshot | undefined,
): { nguoiDung: NguoiDung; dangLamViec: boolean } | null {
  if (owner) {
    const quanTri = VAI_TRO_CHUAN.find((v) => v.ma === "quan_tri")!;
    return {
      nguoiDung: {
        uid,
        tenHienThi: "Chủ sở hữu hệ thống",
        chucDanh: "—",
        phongBan: "—",
        chucNang: quanTri.chucNang,
        vaiTro: quanTri.vaiTro,
        capTM: quanTri.capTM,
        capKho: quanTri.capKho,
      },
      dangLamViec: true,
    };
  }
  const hs = (anh?.exists ? anh.data() : undefined) as Partial<HoSoTaiKhoan> | undefined;
  if (!hopLe(hs)) return null;
  return { nguoiDung: thanhNguoiDung(hs), dangLamViec: hs.dangLamViec !== false };
}

/**
 * Mẫu chức danh ĐỌC ĐƯỢC hay không. Route bắt lỗi này để trả 500 `maLoi:"mau-hong"` — tuyệt đối không
 * đổi thành "mẫu trống" (mẫu trống = mọi chức danh về công thức = rộng hơn mẫu Sếp đã siết).
 */
export class LoiMauHong extends Error {
  constructor(lyDo: string) {
    super(lyDo);
    this.name = "LoiMauHong";
  }
}

/**
 * Lỗi có phải mẫu hỏng không. So cả `name` ngoài `instanceof`: lỗi ném trong `runTransaction` đi qua
 * thư viện Firestore rồi mới tới `catch` của route — không đặt cược vào việc đối tượng lỗi còn nguyên lớp.
 */
export function laLoiMauHong(e: unknown): e is Error {
  return e instanceof LoiMauHong || (e instanceof Error && e.name === "LoiMauHong");
}

/**
 * ★ ĐỌC MẪU CHỨC DANH từ ảnh tài liệu — qua `docMauChucDanh` (gói B), KHÔNG gọi thẳng
 * `chuanHoaMauChucDanh`: bổ sung đặc tả B-F8 / C-F3 — tài liệu VẮNG mà có bản ghi quyền riêng mang
 * `phienBanMau ≥ 1` thì mẫu đã từng có, có thể đã bị xoá → HỎNG, không phải mẫu trống.
 *
 * @param vet Các bản ghi quyền riêng ĐÃ ĐỌC trong cùng lượt — làm dấu vết. BẮT BUỘC truyền (`[]` tường
 *            minh khi chưa đọc bản nào): GET của mình → bản của mình; `?tatCa=1` → MỌI bản (kể cả mồ
 *            côi); POST → bản của người gọi + mọi người nhận.
 * @throws LoiMauHong khi mẫu không đọc được.
 */
export function mauTuAnh(
  anh: DocumentSnapshot | undefined,
  vet: readonly (BanGhiQuyenRieng | null)[],
): { mau: MauChucDanh; canhBao: string[] } {
  const kq = docMauChucDanh(anh?.exists ? anh.data() : undefined, vet);
  if ("loi" in kq) throw new LoiMauHong(kq.loi);
  return kq;
}

/**
 * Người gọi + quyền HIỆU LỰC của họ — luôn QUA MẪU (bổ sung đặc tả C-F1): công thức chức danh + ô đè
 * mẫu của chức danh hiện tại + ngoại lệ riêng của chính họ (`ganQuyenRiengHieuLuc`). Nhờ vậy chốt "chỉ
 * trao cờ mình có" và luật Câu 2 = B tính theo quyền đã gộp mẫu (đặc tả 2.7).
 *
 * `null` = không có hồ sơ hợp lệ / đang tạm ngưng. Bản ghi của họ sai khuôn → NÉM (`banGhiTuAnh`).
 *
 * 🔴 Mẫu hỏng thì KHÔNG dựng được người gọi (không có `mau` để truyền vào) — đường cứu mẫu hỏng phải
 * xác định Quản trị bằng `laQuanTriKhongCanMau`, rẽ nhánh TRƯỚC khi gọi hàm này (bổ sung đặc tả C-F2).
 */
export function nguoiGoiTuAnh(
  uid: string,
  owner: boolean,
  anhHoSo: DocumentSnapshot | undefined,
  anhRieng: DocumentSnapshot | undefined,
  mau: MauChucDanh,
): NguoiGoiTraoQuyen | null {
  const goi = nguoiDungTuAnh(uid, owner, anhHoSo);
  if (!goi || !goi.dangLamViec) return null;
  return { uid, nguoiDung: ganQuyenRiengHieuLuc(goi.nguoiDung, banGhiTuAnh(uid, anhRieng), mau) };
}

/**
 * ★ QUẢN TRỊ KHÔNG CẦN MẪU — bổ sung đặc tả C-F2 (06/10/2026). Dùng DUY NHẤT cho đường cứu mẫu hỏng
 * (`veMacDinhToanBo` khi tài liệu mẫu không đọc được): lúc đó không dựng được người gọi qua mẫu, nên
 * xác định Quản trị CHỈ bằng hồ sơ / owner.
 *
 * `true` khi: owner App Tổng (`owner === true`) · HOẶC hồ sơ hợp lệ, đang làm việc, `vaiTro === "admin"`.
 * Mọi thứ khác (không hồ sơ, tạm ngưng, Trưởng bộ phận, Ban Giám đốc…) → `false`.
 *
 * 📌 HÀM THUẦN, không đọc gì, không nạp gì ngoài kiểu — bài kiểm-luật tách đúng hàm này ra khỏi tệp rồi
 * gọi thật (tệp này nạp `firebase-admin` nên không dựng nguyên tệp được). Đừng cho thân hàm gọi tên nào
 * ngoài tham số của nó, nếu không bài kiểm sẽ báo đỏ.
 *
 * @param hoSo Kết quả `nguoiDungTuAnh` (KHÔNG qua mẫu). `null` = không có hồ sơ hợp lệ.
 */
export function laQuanTriKhongCanMau(
  hoSo: { nguoiDung: Pick<NguoiDung, "vaiTro">; dangLamViec: boolean } | null,
  owner: boolean,
): boolean {
  if (owner === true) return true;
  return hoSo !== null && hoSo.dangLamViec === true && hoSo.nguoiDung.vaiTro === "admin";
}

/** Một bản ghi quyền riêng kèm hồ sơ của chủ nó. `hs = null` = bản ghi MỒ CÔI (không còn hồ sơ hợp lệ). */
export interface BanGhiKemHoSo {
  uid: string;
  b: BanGhiQuyenRieng;
  hs: { nguoiDung: NguoiDung; dangLamViec: boolean } | null;
}

/**
 * MỌI bản ghi quyền riêng kèm hồ sơ của chủ nó — cho `?tatCa=1` / `?biKhoa=1`.
 *
 * 📌 Trả CẢ bản mồ côi (`hs: null`) — nơi gọi tự lọc khi liệt kê người (màn Phân quyền và danh sách
 * Giao việc không hiện người không còn hồ sơ), nhưng VẪN dùng bản mồ côi làm dấu vết mẫu (C-F3): bản ghi
 * mang `phienBanMau ≥ 1` là bằng chứng mẫu đã từng có, dù chủ của nó đã bị xoá hồ sơ.
 *
 * 🔴 Bản ghi sai khuôn ở đây cũng NÉM — nơi gọi nhận lỗi, thay vì coi người đó "theo chức danh" trong
 * khi họ đang bị bỏ bớt quyền.
 */
export async function docTatCaKemHoSo(): Promise<BanGhiKemHoSo[]> {
  const db = getThuMuaDb();
  const ds = await db.collection(BO_SUU_TAP_QUYEN_RIENG).get();
  const banGhi = ds.docs.map((d) => ({ uid: d.id, b: banGhiTuAnh(d.id, d) as BanGhiQuyenRieng }));
  if (banGhi.length === 0) return [];
  const [anhHoSo, owner] = await Promise.all([
    db.getAll(...banGhi.map((x) => refHoSo(x.uid))),
    Promise.all(banGhi.map((x) => laOwner(x.uid))),
  ]);
  return banGhi.map(({ uid, b }, i) => ({ uid, b, hs: nguoiDungTuAnh(uid, owner[i], anhHoSo[i]) }));
}
