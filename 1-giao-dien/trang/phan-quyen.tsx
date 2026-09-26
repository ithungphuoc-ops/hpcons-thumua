"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Minus, RefreshCw, Search, ShieldAlert, TriangleAlert, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/1-giao-dien/thanh-phan-dung-chung/page-header";
import { EmptyState } from "@/1-giao-dien/thanh-phan-dung-chung/empty-state";
import { StatusBadge, type StatusTone } from "@/1-giao-dien/thanh-phan-dung-chung/status-badge";
import { AnhDaiDienChu } from "@/1-giao-dien/thanh-phan-dung-chung/anh-dai-dien-chu";
import { Card, CardContent } from "@/1-giao-dien/nen-tang-ui/card";
import { Button } from "@/1-giao-dien/nen-tang-ui/button";
import { Input } from "@/1-giao-dien/nen-tang-ui/input";
import { HopXacNhan } from "@/1-giao-dien/thanh-phan-dung-chung/hop-xac-nhan";
import { useNguoiDung, CHE_DO_XAC_THUC } from "@/4-phan-quyen/nguoi-dung-hien-tai";
import {
  CAP_KHONG_BO_VAO_APP,
  capDatDuocToiDa,
  duocDatCap,
  lyDoKhongBoVaoApp,
  NHAN_CAP_QUYEN,
  vuongMacTraoQuyen,
} from "@/4-phan-quyen/luat-phan-quyen";
import {
  quyenCuaVaiTro,
  timVaiTroChuan,
  vaiTroGanDuocBoi,
  vaiTroKhopVoiHoSo,
  VAI_TRO_CHUAN,
  VIEC_TREN_BANG_DOI_CHIEU,
  type VaiTroChuan,
} from "@/4-phan-quyen/vai-tro-chuan";
import {
  quyenRiengConHieuLuc,
  tinhQuyenTheoChucDanh,
  type NguoiDung,
  type Quyen,
} from "@/4-phan-quyen/quyen";
import {
  apDungQuyenRieng,
  CO_TICK_DUOC,
  demCoBat,
  KHOA_TICK,
  NHOM_QUYEN_TICK,
  nhanCoTick,
  quyenRiengGiongNhau,
  rutQuyenRieng,
  tinhTruocSauKhiLuu,
  TOI_DA_NGUOI_MOI_LAN,
  type BanGhiQuyenRiengHienThi,
  type QuyenRieng,
  type TruocSauKhiLuu,
} from "@/4-phan-quyen/quyen-rieng";
import { docQuyenRiengTatCa, luuQuyenRieng } from "@/4-phan-quyen/quyen-rieng-ket-noi";
import { lamMoiNguoiKhongVaoApp } from "@/4-phan-quyen/dung-nguoi-khong-vao-app";
import {
  docDanhBaCongTy,
  docHoSoDePhanQuyen,
  ganVaiTro,
  thanhNguoiDung,
  type HoSoKemMa,
  type ThanhVienDanhBa,
} from "@/5-ket-noi/ho-so-tai-khoan";
import { boDau } from "@/6-tien-ich/bo-dau";
import { formatDateTime } from "@/6-tien-ich/dinh-dang";

/**
 * Khóa cho nhóm người CHƯA khai bộ phận ở App Tổng.
 *
 * 🔴 Không dùng chuỗi rỗng làm khóa vì rỗng đã mang nghĩa "chưa chọn phòng ban nào" ở ô chọn.
 * Cũng không dùng tên đọc được (vd "Chưa gán") vì App Tổng có thể có phòng ban trùng đúng tên
 * đó, và khi ấy hai nhóm khác nhau bị trộn vào một mục.
 */
const CHUA_GAN_PHONG_BAN = "__chua-gan-phong-ban__";

const tenPhongBan = (pb: string) => (pb === CHUA_GAN_PHONG_BAN ? "Chưa gán phòng ban" : pb);

/** Một người trên danh sách phân quyền, đã tính sẵn mọi thứ màn hình cần. */
interface ThongTinNguoi {
  hs: HoSoKemMa;
  ten: string;
  phongBan: string;
  nd: NguoiDung;
  vtHienTai: VaiTroChuan | undefined;
  /** Quyền theo chức danh. */
  goc: Quyen;
  /** Bản ghi quyền riêng (gốc đã cất + phần máy chủ đã đối chiếu dấu chức danh). */
  rieng: BanGhiQuyenRiengHienThi | null;
  /** Quyền đang có hiệu lực (chức danh + quyền riêng CÒN HIỆU LỰC). */
  hieuLuc: Quyen;
  laQuanTri: boolean;
  /** Không sửa được người này — lý do. `null` = sửa được. */
  lyDoKhoa: string | null;
  /**
   * Mã đưa vào `vuongMacTraoQuyen`: mã Firebase của người này, TRỪ khi là chính mình (khớp ở một
   * trong hai lớp danh tính) thì dùng đúng mã của người gọi để chốt "không tự sửa" bắt được.
   */
  uidLuat: string;
}

/** Dự kiến sau khi lưu, cho từng người đang chọn. */
interface DuKien {
  t: ThongTinNguoi;
  /** Quyền theo chức danh SAU lần lưu (chức danh mới nếu lần lưu có đổi). */
  goc: Quyen;
  laQT: boolean;
  capTM: NguoiDung["capTM"];
  vaiTro: NguoiDung["vaiTro"];
  /** Mã chức danh SAU lần lưu — để câu lý do gọi đúng tên ("Ngừng truy cập" hay "cấp Không quyền"). */
  maVaiTro: string | undefined;
  ts: TruocSauKhiLuu;
}

/**
 * Vì sao KHÔNG TICK ĐƯỢC cho một người, `null` = tick được. Một chỗ cho cả nút "Chọn tất cả đang
 * lọc" lẫn khung khoá tick (soát chéo 26/09/2026: nút chọn tất cả từng gom cả tài khoản Quản trị và
 * người cấp 0, làm khoá tick cả nhóm).
 *
 * @param sau Chức danh sau lần lưu — truyền khi đang đổi chức danh, để người "Ngừng truy cập" được
 *            chọn chức danh mới là tick được ngay. Bỏ trống = xét theo chức danh hiện tại.
 */
function lyDoKhongTickNguoi(
  t: ThongTinNguoi,
  sau?: { laQT: boolean; goc: Quyen; maVaiTro?: string },
): string | null {
  if (t.lyDoKhoa) return t.lyDoKhoa;
  const laQT = sau ? sau.laQT : t.laQuanTri;
  const goc = sau ? sau.goc : t.goc;
  const ma = sau ? sau.maVaiTro : t.vtHienTai?.ma;
  if (laQT) {
    /* Nói đúng thời điểm: đang là Quản trị, hay SẼ thành Quản trị sau lần lưu này. */
    return t.laQuanTri
      ? `${t.ten} là tài khoản Quản trị — luôn đủ mọi quyền, tick không có tác dụng.`
      : `Sau khi lưu, ${t.ten} thành Quản trị — luôn đủ mọi quyền, không cần tick.`;
  }
  if (!goc.xemDuocApp) {
    /* Cấp 0 không phải lúc nào cũng là chức danh "Ngừng truy cập" — hồ sơ tạo tay/cũ có thể cấp 0
       với chức danh khác. Gọi sai tên là người phân quyền đi tìm nhầm chỗ. */
    return ma === "ngung_truy_cap"
      ? `${t.ten} đang ở chức danh "Ngừng truy cập" — chọn chức danh khác trước rồi mới tick quyền.`
      : `${t.ten} đang ở cấp Không quyền — chọn chức danh khác trước rồi mới tick quyền.`;
  }
  return null;
}

/** Tick được cho người này không (theo chức danh hiện tại). */
const tickDuoc = (t: ThongTinNguoi) => lyDoKhongTickNguoi(t) === null;

/** Nội dung hộp xác nhận — CHỤP LẠI lúc mở, bấm Đồng ý là lưu đúng thứ đã xem. */
interface TomTatLuu {
  uids: string[];
  ten: string[];
  vtMoi: VaiTroChuan | null;
  uidDoiChucDanh: string[];
  thayDoi: QuyenRieng;
  uidGhiQuyen: string[];
  bat: string[];
  tat: string[];
  soGiuTheoChucDanh: number;
  /** Lúc mở hộp chưa đọc được quyền riêng — lần lưu chỉ đổi chức danh. */
  chuaDocRieng: boolean;
}

/**
 * 🛡️ MÀN PHÂN QUYỀN NGƯỜI DÙNG — chọn người bên trái, tick quyền bên phải.
 *
 * ★★ Sếp 26/09/2026 (duyệt bản demo "Phân quyền tick chọn"):
 *   ① *"khi chọn nhân viên A thì sẽ hiện 1 list quyền bên cạnh, a giao cho quyền gì thì chỉ cần
 *      tick zô là được"*
 *   ② *"Thêm chức năng được chọn nhiều người cùng lúc để phân quyền"*
 *   ③ trưởng bộ phận là người tick phân quyền.
 *
 * ## HAI LỚP
 * · CHỨC DANH — vẫn gán qua `/api/phan-quyen` y như trước (route của phiên tích hợp, không sửa).
 *   PHẢI GIỮ: danh sách "giao việc cho ai" ở `bang-phan-bo.tsx` lọc theo chức danh.
 * · QUYỀN TICK RIÊNG — lớp đè, cất ở `tm_quyen_rieng` qua `/api/quyen-rieng`. Luật ở
 *   `4-phan-quyen/quyen-rieng.ts` (áp quyền) và `luat-phan-quyen.ts` → `vuongMacTraoQuyen` (ai
 *   trao được gì cho ai). Màn này CHỈ hỏi luật, không tự viết luật.
 *
 * ## 🔴 MẶC ĐỊNH AN TOÀN
 * Demo ghi "mặc định không xem được gì", nhưng làm vậy ngay hôm deploy là cả phòng mất quyền. Nên
 * người chưa được tick riêng GIỮ NGUYÊN quyền theo chức danh, và màn hình nói rõ điều đó.
 *
 * ## CHỌN NHIỀU NGƯỜI
 * Mỗi người một kiểu thì ô tích hiện trạng thái TRUNG GIAN, và chỉ những ô đã chạm mới được ghi —
 * ô chưa chạm giữ nguyên của từng người (máy chủ tự ghép với bản đang cất).
 *
 * ## 📌 LỊCH SỬ (vẫn đúng)
 * · 18/08/2026 — gán theo VAI TRÒ đóng gói (`vai-tro-chuan.ts`), không bắt ghép tay bốn trường.
 * · 20/08/2026 — ghi thật qua API máy chủ; khối "Thêm người dùng mới" lấy thẳng danh bạ App Tổng.
 */
export default function TrangPhanQuyen() {
  const { nguoiDung, quyen } = useNguoiDung();

  const [danhSach, setDanhSach] = useState<HoSoKemMa[] | null>(null);
  const [dangTai, setDangTai] = useState(false);
  /** Quyền riêng đang cất, khoá = mã Firebase. `null` = chưa đọc được. */
  const [banGhiRieng, setBanGhiRieng] = useState<Record<string, BanGhiQuyenRiengHienThi> | null>(null);
  const [loiRieng, setLoiRieng] = useState<string | null>(null);

  // ---------- Chọn người + bản nháp ----------
  /** Mã Firebase của những người đang chọn. */
  const [chon, setChon] = useState<string[]>([]);
  /** CHỈ các ô đã chạm. Ô vắng mặt = giữ nguyên của từng người. */
  const [nhapQuyen, setNhapQuyen] = useState<QuyenRieng>({});
  /** Chức danh mới. `""` = giữ nguyên. */
  const [nhapVaiTro, setNhapVaiTro] = useState("");
  const [tuKhoaDs, setTuKhoaDs] = useState("");
  const [phongBanDs, setPhongBanDs] = useState("");
  const [hoiLuu, setHoiLuu] = useState(false);
  /** Bản sao cuối của hộp xác nhận — xem chú thích ở `hoiThemMoiCuoi`. */
  const [hoiLuuCuoi, setHoiLuuCuoi] = useState<TomTatLuu | null>(null);
  const [dangLuu, setDangLuu] = useState(false);

  /**
   * ★★ ẨN TÀI KHOẢN ĐÃ NGỪNG TRUY CẬP — Sếp 17/09/2026: ***"nếu như tài khoản nào đã bị đổi
   * ngừng truy cập thì phải ẩn khỏi giao diện này"***.
   *
   * 🔴 ẨN CHO GỌN, NHƯNG PHẢI CÓ ĐƯỜNG QUAY LẠI — vì thứ duy nhất mở lại quyền cho một người
   * chính là màn này. Ẩn hẳn mà không chừa cửa là người bị ngừng nhầm **không ai khôi phục được
   * nữa**. Mặc định ẩn (đúng ý Sếp), ô tích mở lại khi cần, và luôn nói đã ẩn bao nhiêu người.
   */
  const [hienNgungTruyCap, setHienNgungTruyCap] = useState(false);

  // ---------- Khối "Thêm người dùng mới" — danh bạ công ty ----------
  const [danhBa, setDanhBa] = useState<ThanhVienDanhBa[] | null>(null);
  const [dangTaiDanhBa, setDangTaiDanhBa] = useState(false);
  const [tuKhoaTim, setTuKhoaTim] = useState("");
  /**
   * Phòng ban đang chọn để tìm người. `""` = chưa chọn → KHÔNG hiện ai (xem chú thích ở khối
   * "Thêm người dùng mới"). Giá trị là TÊN phòng ban đúng như App Tổng trả về, hoặc
   * `CHUA_GAN_PHONG_BAN` cho người chưa khai bộ phận.
   */
  const [phongBanChon, setPhongBanChon] = useState("");
  const [vaiTroChonMoi, setVaiTroChonMoi] = useState<Record<string, string>>({});
  const [hoiThemMoi, setHoiThemMoi] = useState<{ tv: ThanhVienDanhBa; vt: VaiTroChuan } | null>(null);
  /**
   * ★ BẢN SAO CUỐI của hộp xác nhận — giữ để hộp còn nội dung trong lúc chạy hiệu ứng đóng.
   *
   * 🔴 Hộp TRƯỚC ĐÂY bọc bằng `{hoiThemMoi && …}`. Bấm Đồng ý hay Hủy đều làm điều kiện thành
   * `false` và `<Dialog>` bị tháo khỏi cây NGAY trong lần commit mà `open` vừa chuyển sang `false`.
   * base-ui gỡ khoá cuộn và `data-base-ui-inert` bằng hàm cleanup của `useEffect`; bị tháo giữa
   * chừng là hai thứ đó kẹt lại trên DOM và **cả app bấm không ăn tới khi F5**. Sự cố Sếp báo 13 và
   * 14/09/2026. Chỉ cập nhật khi MỞ, không xoá khi đóng.
   */
  const [hoiThemMoiCuoi, setHoiThemMoiCuoi] = useState<{
    tv: ThanhVienDanhBa;
    vt: VaiTroChuan;
  } | null>(null);

  const laCheDoThat = CHE_DO_XAC_THUC === "sso";

  /**
   * Đọc CẢ hồ sơ lẫn quyền riêng một lượt — thứ hiện trên màn phải là thứ máy chủ THẬT SỰ đang giữ.
   *
   * ⚠️ Đọc quyền riêng hỏng thì GHI NHỚ LỖI (khoá ô tick), không coi như "chưa ai có quyền riêng":
   * coi nhầm vậy là màn hiện quyền theo chức danh trong khi người ta đang có quyền riêng khác hẳn.
   */
  /** Trả `true` khi KHÔNG đọc được quyền riêng — `docLai` dùng để dọn/dựng lại bản nháp tick. */
  const tai = useCallback(async (): Promise<boolean> => {
    if (!laCheDoThat) return false;
    setDangTai(true);
    try {
      const [ds, rieng] = await Promise.all([docHoSoDePhanQuyen(), docQuyenRiengTatCa()]);
      setDanhSach(ds);
      if ("loi" in rieng) {
        setBanGhiRieng(null);
        setLoiRieng(rieng.loi);
        return true;
      }
      setBanGhiRieng(rieng.tatCa);
      setLoiRieng(null);
      return false;
    } finally {
      setDangTai(false);
    }
  }, [laCheDoThat]);

  const taiDanhBa = useCallback(async () => {
    if (!laCheDoThat) return;
    setDangTaiDanhBa(true);
    try {
      setDanhBa(await docDanhBaCongTy());
    } finally {
      setDangTaiDanhBa(false);
    }
  }, [laCheDoThat]);

  useEffect(() => {
    void tai();
    void taiDanhBa();
  }, [tai, taiDanhBa]);

  /**
   * Danh sách phòng ban cho khối "Thêm người dùng mới" — gom từ CHÍNH danh bạ App Tổng, kèm số người
   * **chưa có hồ sơ Thu mua**. PHẢI có mục "Chưa gán phòng ban": người ở App Tổng có thể THIẾU
   * `departmentId` — không có mục này là họ không bao giờ tìm ra được, mà không có gì báo lỗi.
   */
  const dsPhongBan = useMemo(() => {
    const dem = new Map<string, number>();
    for (const tv of danhBa ?? []) {
      if (tv.daCoHoSoThuMua) continue;
      const k = tv.phongBan.trim() || CHUA_GAN_PHONG_BAN;
      dem.set(k, (dem.get(k) ?? 0) + 1);
    }
    return [...dem.entries()]
      .map(([ten, so]) => ({ ten, so }))
      .sort((a, b) =>
        a.ten === CHUA_GAN_PHONG_BAN
          ? 1
          : b.ten === CHUA_GAN_PHONG_BAN
            ? -1
            : a.ten.localeCompare(b.ten, "vi"),
      );
  }, [danhBa]);

  /**
   * 🔴 MÃ FIREBASE CỦA CHÍNH MÌNH — để chốt "không tự sửa mình" so CÙNG LỚP danh tính với danh sách
   * (khoá = mã Firebase). `nguoiDung.uid` là mã NGHIỆP VỤ (`u-tm1`…), so thẳng là lệch lớp và chốt
   * mất tác dụng mà không có gì báo. Owner thì hai mã trùng nhau nên đường lùi vẫn đúng.
   */
  const nguoiGoi = useMemo(
    () => ({
      uid: danhSach?.find((h) => h.hoSo.uidNghiepVu === nguoiDung.uid)?.firebaseUid ?? nguoiDung.uid,
      nguoiDung,
    }),
    [danhSach, nguoiDung],
  );

  const tatCaNguoi = useMemo<ThongTinNguoi[]>(
    () =>
      (danhSach ?? []).map((hs) => {
        const nd = thanhNguoiDung(hs.hoSo);
        const goc = tinhQuyenTheoChucDanh(nd);
        const laQuanTri = nd.vaiTro === "admin";
        const rieng = banGhiRieng?.[hs.firebaseUid] ?? null;
        /* `quyenHieuLuc` = máy chủ đã đối chiếu dấu chức danh — bản lưu cho chức danh cũ chỉ mang sang
           những cờ đã bị bỏ thật. Đừng dùng `rieng.quyen` (bản thô) ở đây. */
        const hieuLuc = apDungQuyenRieng(goc, rieng?.quyenHieuLuc, laQuanTri);
        /* Hỏi đúng luật route dùng, với "sau = trước" (chưa trao gì) → chỉ còn các chốt về NGƯỜI:
           tự sửa mình · cấp cao hơn · tài khoản Quản trị/BGĐ · người gọi hết quyền phân quyền.
           🔴 Chốt "tự sửa mình" so CẢ HAI lớp danh tính (soát chéo lần 2 26/09/2026): mã nghiệp vụ và
           mã Firebase. So một lớp thì hồ sơ nào có `uidNghiepVu` lệch (tài khoản mẫu cũ `u-tmX`) là chốt
           không bắt được — màn cho tự sửa, chỉ tới lúc máy chủ từ chối mới lộ. */
        const laChinhMinh =
          hs.hoSo.uidNghiepVu === nguoiDung.uid || hs.firebaseUid === nguoiGoi.uid;
        const uidLuat = laChinhMinh ? nguoiGoi.uid : hs.firebaseUid;
        const lyDoKhoa = vuongMacTraoQuyen(nguoiGoi, [
          {
            uid: uidLuat,
            ten: nd.tenHienThi,
            vaiTro: nd.vaiTro,
            capTM: nd.capTM,
            quyenGoc: goc,
            quyenTruoc: hieuLuc,
            quyenSau: hieuLuc,
            boVaoApp: false,
          },
        ]);
        return {
          hs,
          ten: hs.hoSo.tenHienThi,
          phongBan: hs.hoSo.phongBan?.trim() || CHUA_GAN_PHONG_BAN,
          nd,
          vtHienTai: vaiTroKhopVoiHoSo(hs.hoSo),
          goc,
          rieng,
          hieuLuc,
          laQuanTri,
          lyDoKhoa,
          uidLuat,
        };
      }),
    [danhSach, banGhiRieng, nguoiGoi, nguoiDung.uid],
  );

  /* Dùng `vaiTroKhopVoiHoSo` — đúng hàm ô chức danh dùng — để biết ai đang ngừng truy cập. Tự so
     tay `capTM` ở đây là hai chỗ cùng trả lời một câu, sớm muộn lệch nhau. */
  const laNgung = (t: ThongTinNguoi) => t.vtHienTai?.ma === "ngung_truy_cap";
  const soDaAn = tatCaNguoi.filter(laNgung).length;
  const dsHien = tatCaNguoi.filter((t) => hienNgungTruyCap || !laNgung(t));

  const dsPhongBanDs = [...new Set(dsHien.map((t) => t.phongBan))].sort((a, b) =>
    a === CHUA_GAN_PHONG_BAN ? 1 : b === CHUA_GAN_PHONG_BAN ? -1 : a.localeCompare(b, "vi"),
  );

  const tuKhoaLoc = boDau(tuKhoaDs.trim());
  const dsLoc = dsHien.filter(
    (t) =>
      (phongBanDs === "" || t.phongBan === phongBanDs) &&
      (tuKhoaLoc === "" ||
        boDau(t.ten).includes(tuKhoaLoc) ||
        boDau(t.hs.hoSo.email ?? "").includes(tuKhoaLoc)),
  );

  const dsChon = useMemo(
    () => tatCaNguoi.filter((t) => chon.includes(t.hs.firebaseUid)),
    [tatCaNguoi, chon],
  );
  const vtMoi = timVaiTroChuan(nhapVaiTro);

  /** Mỗi người đang chọn: quyền trước/sau khi lưu — CÙNG phép tính route dùng. */
  const duKien = useMemo<DuKien[]>(
    () =>
      dsChon.map((t) => {
        /* Chỉ coi là ĐỔI chức danh khi khác chức danh hiện tại — trùng thì lần lưu không gọi
           `/api/phan-quyen`, hồ sơ giữ nguyên, nên dấu chức danh cũng giữ nguyên. */
        const doiCD = Boolean(vtMoi) && t.vtHienTai?.ma !== vtMoi?.ma;
        const ndSau =
          doiCD && vtMoi
            ? { chucNang: vtMoi.chucNang, vaiTro: vtMoi.vaiTro, capTM: vtMoi.capTM, capKho: vtMoi.capKho ?? 0 }
            : t.nd;
        const goc = doiCD && vtMoi ? quyenCuaVaiTro(vtMoi) : t.goc;
        const laQT = ndSau.vaiTro === "admin";
        /* 🔴 Bản riêng cũ đối chiếu với chức danh SAU lần lưu — đúng như route sẽ làm sau khi
           `/api/phan-quyen` đổi hồ sơ. Đổi chức danh thì chỉ mang sang những cờ đã bị bỏ thật. */
        const riengCu = quyenRiengConHieuLuc(t.rieng, ndSau);
        return {
          t,
          goc,
          laQT,
          capTM: ndSau.capTM,
          vaiTro: ndSau.vaiTro,
          maVaiTro: doiCD && vtMoi ? vtMoi.ma : t.vtHienTai?.ma,
          ts: tinhTruocSauKhiLuu(goc, riengCu, laQT, nhapQuyen),
        };
      }),
    [dsChon, vtMoi, nhapQuyen],
  );

  /* Lớp chặn thứ ba — hai lớp kia là mục menu và `duocVaoDuongDan`. Mỗi lớp che một đường vào
     khác nhau (menu · gõ URL · điều hướng trong app). */
  if (!quyen.phanQuyenNguoiDung) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Không có quyền vào mục này"
        description="Chỉ tài khoản Quản trị và Trưởng bộ phận mới xem được phân quyền người dùng."
      />
    );
  }

  const toiDa = capDatDuocToiDa(nguoiDung);
  /* Vai trò người này gán được — luật ở `vaiTroGanDuocBoi`, KHÔNG lọc tay ở đây. */
  const vaiTroGanDuoc = vaiTroGanDuocBoi(toiDa);

  // ---------- Trạng thái bảng quyền ----------
  const coNhapQuyen = Object.keys(nhapQuyen).length > 0;
  /* KHÔNG ghi quyền riêng khi:
     · hạ về "Ngừng truy cập" — quyền riêng vô hiệu (`apDungQuyenRieng` ③);
     · nâng lên "Quản trị hệ thống" — quản trị luôn đủ quyền (soát chéo 26/09/2026 ca D: trước đây
       vẫn ghi nên khung khoá tick báo "tài khoản Quản trị" và khoá luôn nút Lưu → không nâng được);
     · chưa đọc được quyền riêng đang lưu — vẫn cho ĐỔI CHỨC DANH (chỉ gọi `/api/phan-quyen`), chỉ khoá
       phần tick (ca E). An toàn nhờ dấu chức danh: bản riêng cũ lệch dấu chỉ mang sang những cờ đã
       bị bỏ thật, không mang cờ vượt chức danh (`quyenRiengHieuLuc`). */
  const ghiQuyen =
    coNhapQuyen && !loiRieng && !(vtMoi && (vtMoi.capTM === 0 || vtMoi.vaiTro === "admin"));
  const coNhap = coNhapQuyen || nhapVaiTro !== "";

  /** Vì sao ô tick đang khoá. `null` = tick được. Luật từng người ở `lyDoKhongTickNguoi`. */
  const lyDoKhongTick: string | null = (() => {
    if (dsChon.length === 0) return "Chọn ít nhất một người ở cột trái.";
    const khoa = dsChon.find((t) => t.lyDoKhoa);
    if (khoa) return khoa.lyDoKhoa;
    if (loiRieng) {
      return `Chưa đọc được quyền riêng đang lưu (${loiRieng}). Bấm "Đọc lại" — tạm khoá tick để không lưu đè sai. Vẫn đổi được chức danh.`;
    }
    for (const d of duKien) {
      const ly = lyDoKhongTickNguoi(d.t, { laQT: d.laQT, goc: d.goc, maVaiTro: d.maVaiTro });
      if (ly) return ly;
    }
    return null;
  })();

  /**
   * 🔴 Ô "Vào app" KHÔNG BỎ ĐƯỢC khi trong nhóm có người cấp ≥ 3 (soát chéo 26/09/2026) — máy chủ
   * `/api/phan-quyen` vẫn cho họ gán chức danh theo cấp, bỏ ô này chỉ khoá giao diện. Luật + câu lý do
   * ở `luat-phan-quyen.ts` (`vuongMacTraoQuyen` ④b). Vẫn TICK LÊN được (bản riêng cũ đã lỡ khoá).
   */
  const nguoiKhongBoVaoApp = duKien.find((d) => d.capTM >= CAP_KHONG_BO_VAO_APP);
  const lyDoKhoaVaoApp = nguoiKhongBoVaoApp ? lyDoKhongBoVaoApp(nguoiKhongBoVaoApp.t.ten) : null;

  /** Giá trị hiện của một ô: đã chạm thì theo nháp; chưa chạm thì theo quyền hiện tại của nhóm. */
  function giaTriCo(k: keyof Quyen): boolean | "mixed" {
    if (k in nhapQuyen) return nhapQuyen[k] === true;
    if (duKien.length === 0) return false;
    const bat = duKien.filter((d) => d.ts.quyenTruoc[k]).length;
    return bat === 0 ? false : bat === duKien.length ? true : "mixed";
  }

  /* Tick một ô "Được làm/Được xem" thì tự tick "Vào app"; bỏ "Vào app" là bỏ hết — y như luật áp
     quyền ở `quyen-rieng.ts`, để thứ nhìn thấy khớp thứ được cất. */
  function doiCo(k: keyof Quyen, bat: boolean) {
    if (k === "xemDuocApp" && !bat && lyDoKhoaVaoApp) {
      toast.error("Không bỏ được", { description: lyDoKhoaVaoApp });
      return;
    }
    setNhapQuyen((c) => {
      const moi: QuyenRieng = { ...c, [k]: bat };
      if (k === "xemDuocApp" && !bat) for (const kk of KHOA_TICK) moi[kk] = false;
      if (k !== "xemDuocApp" && bat) moi.xemDuocApp = true;
      return moi;
    });
  }

  /**
   * "Bỏ hết": tắt mọi ô. Trong nhóm có người cấp ≥ 3 thì KHÔNG ĐƯA "Vào app" vào bản nháp (soát chéo
   * lần 2 26/09/2026) — mỗi người giữ "Vào app" của chính họ. Bản trước ghi `xemDuocApp: true` cho cả
   * nhóm, tức lặng lẽ BẬT "Vào app" cho người cấp thấp hơn trong nhóm vốn đang bị bỏ.
   */
  function boHet() {
    if (!lyDoKhoaVaoApp) {
      doiCo("xemDuocApp", false);
      return;
    }
    const moi: QuyenRieng = {};
    for (const kk of KHOA_TICK) if (kk !== "xemDuocApp") moi[kk] = false;
    setNhapQuyen(moi);
  }

  function datLaiNhap() {
    setNhapQuyen({});
    setNhapVaiTro("");
  }

  /** Bấm vào TÊN: chọn đúng một người. Bản nháp cũ bỏ đi — báo cho người dùng biết. */
  function chonMot(uid: string) {
    if (coNhap && !(chon.length === 1 && chon[0] === uid)) {
      toast.info("Đã bỏ thay đổi chưa lưu của lượt chọn trước.");
    }
    if (!(chon.length === 1 && chon[0] === uid)) datLaiNhap();
    setChon([uid]);
  }

  /** Bấm ô tích: thêm/bớt vào nhóm. GIỮ bản nháp — ô đã chạm áp cho cả nhóm mới. */
  function doiChonNhieu(uid: string, them: boolean) {
    setChon((c) => (them ? (c.includes(uid) ? c : [...c, uid]) : c.filter((x) => x !== uid)));
  }

  /* Chỉ gom người TICK ĐƯỢC (soát chéo 26/09/2026 ca F) — gom cả Quản trị / người cấp 0 là khoá tick
     cả nhóm. Muốn đổi chức danh cho họ thì chọn riêng từng người. */
  const dsLocSuaDuoc = dsLoc.filter(tickDuoc);
  /* Nói rõ đã bỏ qua ai — bỏ qua im lặng là người dùng tưởng "chọn tất cả" đã gom đủ. */
  const soBoQuaQtNgung = dsLoc.filter((t) => !t.lyDoKhoa && !tickDuoc(t)).length;
  const soBoQuaKhoa = dsLoc.filter((t) => t.lyDoKhoa).length;
  const soLocDaChon = dsLocSuaDuoc.filter((t) => chon.includes(t.hs.firebaseUid)).length;
  const giaTriChonTatCa: boolean | "mixed" =
    soLocDaChon === 0 ? false : soLocDaChon === dsLocSuaDuoc.length ? true : "mixed";

  function chonTatCaDangLoc(them: boolean) {
    const uids = dsLocSuaDuoc.map((t) => t.hs.firebaseUid);
    setChon((c) => (them ? [...new Set([...c, ...uids])] : c.filter((x) => !uids.includes(x))));
  }

  /* "Áp mẫu theo chức danh": chức danh mới nếu đang đổi; không thì mẫu chung của nhóm — chỉ áp được
     khi mọi người đang chọn có CÙNG một mẫu, không thì một bản nháp không diễn tả nổi. */
  const mauApDuoc: Quyen | null = vtMoi
    ? quyenCuaVaiTro(vtMoi)
    : dsChon.length > 0 &&
        dsChon.every((t) => quyenRiengGiongNhau(rutQuyenRieng(t.goc), rutQuyenRieng(dsChon[0].goc)))
      ? dsChon[0].goc
      : null;

  function doiChucDanhNhap(ma: string) {
    setNhapVaiTro(ma);
    const vt = timVaiTroChuan(ma);
    /* Đổi chức danh = tick lại toàn bộ theo mẫu của chức danh đó (đúng bản demo), rồi thêm/bớt
       tiếp. Giữ nguyên chức danh = bỏ bản nháp do lần đổi trước sinh ra.
       ⚠️ Chưa đọc được quyền riêng (`loiRieng`) thì KHÔNG dựng bản nháp — lần lưu đó chỉ đổi chức
       danh, bày một bộ ô "đã đổi" mà không ghi là giao diện hứa việc app không làm. Ô tick khi đó
       tự hiện mẫu chức danh mới (xem `giaTriCo`). */
    /* Cùng lý do: chức danh Quản trị / Ngừng truy cập thì lần lưu cũng không ghi ô tick (xem `ghiQuyen`). */
    const khongGhiTick = !vt || loiRieng || vt.vaiTro === "admin" || vt.capTM === 0;
    setNhapQuyen(khongGhiTick ? {} : rutQuyenRieng(quyenCuaVaiTro(vt)));
  }

  /**
   * ĐỌC LẠI + dọn/dựng lại bản nháp tick theo kết quả (soát chéo lần 2 26/09/2026, ca E):
   *   · Đọc quyền riêng HỎNG mà đang có bản nháp tick → XOÁ nháp + báo. Nháp đó dựng trên quyền riêng
   *     cũ; lưu lúc không biết quyền riêng hiện tại là lưu đè mù.
   *   · Đọc lại THÀNH CÔNG sau lúc hỏng, mà đang chọn một chức danh mới → dựng lại mẫu tick theo chức
   *     danh đó (lúc hỏng `doiChucDanhNhap` cố ý không dựng).
   * 📌 Giá trị `nhapQuyen`/`loiRieng`/`vtMoi` trong hàm là của lúc BẤM — đúng thứ cần so.
   */
  async function docLai() {
    const coLoi = await tai();
    if (coLoi && Object.keys(nhapQuyen).length > 0) {
      setNhapQuyen({});
      toast.warning("Đã bỏ các ô tick chưa lưu", {
        description: "Chưa đọc được quyền riêng đang lưu nên không lưu đè được. Chức danh đang chọn vẫn giữ.",
        duration: 10000,
      });
    }
    if (!coLoi && loiRieng && vtMoi && vtMoi.vaiTro !== "admin" && vtMoi.capTM !== 0) {
      setNhapQuyen(rutQuyenRieng(quyenCuaVaiTro(vtMoi)));
      toast.info(`Đã tick lại theo mẫu chức danh “${vtMoi.ten}”.`);
    }
  }

  // ---------- Lưu ----------
  const uidDoiChucDanh = vtMoi
    ? dsChon.filter((t) => t.vtHienTai?.ma !== vtMoi.ma).map((t) => t.hs.firebaseUid)
    : [];
  const uidGhiQuyen = ghiQuyen ? duKien.filter((d) => d.ts.canGhi).map((d) => d.t.hs.firebaseUid) : [];

  /** Vì sao nút Lưu đang khoá. `null` = lưu được. */
  const lyDoKhongLuu: string | null = (() => {
    if (dsChon.length === 0) return "Chưa chọn ai.";
    const khoa = dsChon.find((t) => t.lyDoKhoa);
    if (khoa) return khoa.lyDoKhoa;
    /* Cùng trần với route — báo trước ở đây thay vì để máy chủ trả 400 sau khi đã bấm. */
    if (uidGhiQuyen.length > TOI_DA_NGUOI_MOI_LAN) {
      return `Mỗi lần lưu quyền riêng tối đa ${TOI_DA_NGUOI_MOI_LAN} người (đang chọn ${uidGhiQuyen.length}) — bỏ bớt rồi lưu thành nhiều lượt.`;
    }
    if (vtMoi) {
      /* Hỏi lại đúng hai chốt `/api/phan-quyen` dùng — ô chọn đã lọc sẵn, đây là lưới thứ hai. */
      const xet = duocDatCap(nguoiDung, vtMoi.capTM);
      if (!xet.duoc) return xet.lyDo ?? "Không gán được chức danh này.";
      if (!vaiTroGanDuoc.some((x) => x.ma === vtMoi.ma)) {
        return `Chức danh “${vtMoi.ten}” chỉ tài khoản Quản trị mới gán được.`;
      }
    }
    if (ghiQuyen && lyDoKhongTick) return lyDoKhongTick;
    if (uidDoiChucDanh.length === 0 && uidGhiQuyen.length === 0) {
      return "Chưa có thay đổi nào so với hiện tại.";
    }
    if (ghiQuyen) {
      return vuongMacTraoQuyen(
        nguoiGoi,
        duKien.map((d) => ({
          uid: d.t.uidLuat,
          ten: d.t.ten,
          vaiTro: d.vaiTro,
          capTM: d.capTM,
          quyenGoc: d.goc,
          quyenTruoc: d.ts.quyenTruoc,
          quyenSau: d.ts.quyenSau,
          boVaoApp: d.ts.boVaoApp,
        })),
      );
    }
    return null;
  })();

  function moHopLuu() {
    if (lyDoKhongLuu) return;
    /* "Bật/Tắt" so với quyền ĐANG CÓ của từng người (trước cả lần đổi chức danh), để hộp nói đúng
       thứ người ta sẽ được thêm / bị mất — không phải so với bản nháp. Không ghi quyền riêng thì kết
       quả là chức danh sau lần lưu + bản riêng cũ ĐÃ đối chiếu dấu (`ts.quyenTruoc`). */
    const sau = (d: DuKien) => (ghiQuyen ? d.ts.quyenSau : d.ts.quyenTruoc);
    const bat = KHOA_TICK.filter((k) => duKien.some((d) => !d.t.hieuLuc[k] && sau(d)[k])).map(nhanCoTick);
    const tat = KHOA_TICK.filter((k) => duKien.some((d) => d.t.hieuLuc[k] && !sau(d)[k])).map(nhanCoTick);
    const tom: TomTatLuu = {
      uids: dsChon.map((t) => t.hs.firebaseUid),
      ten: dsChon.map((t) => t.ten),
      vtMoi: vtMoi ?? null,
      uidDoiChucDanh,
      thayDoi: { ...nhapQuyen },
      uidGhiQuyen,
      bat,
      tat,
      soGiuTheoChucDanh: ghiQuyen ? duKien.filter((d) => !d.ts.canGhi && !d.t.rieng).length : 0,
      chuaDocRieng: Boolean(loiRieng),
    };
    setHoiLuuCuoi(tom);
    setHoiLuu(true);
  }

  async function luuThat(tom: TomTatLuu) {
    setDangLuu(true);
    try {
      /* ① CHỨC DANH TRƯỚC — route quyền riêng đọc lại hồ sơ, nên phải thấy chức danh mới. Hỏng ai là
         DỪNG, không ghi quyền riêng: ghi tiếp là ghép quyền theo chức danh cũ, sai người sai việc. */
      if (tom.vtMoi && tom.uidDoiChucDanh.length > 0) {
        const loi: string[] = [];
        for (const uid of tom.uidDoiChucDanh) {
          const l = await ganVaiTro(uid, tom.vtMoi.ma);
          if (l) loi.push(`${tatCaNguoi.find((t) => t.hs.firebaseUid === uid)?.ten ?? uid}: ${l}`);
        }
        if (loi.length > 0) {
          toast.error("Chưa đổi được chức danh", { description: loi.join(" · "), duration: 12000 });
          await docLai();
          return;
        }
      }

      // ② QUYỀN RIÊNG — một lượt cho cả nhóm, máy chủ kiểm lại toàn bộ luật.
      if (tom.uidGhiQuyen.length > 0) {
        const kq = await luuQuyenRieng(tom.uidGhiQuyen, tom.thayDoi);
        if (kq.loi !== null) {
          toast.error("Chưa lưu được quyền", {
            description: tom.uidDoiChucDanh.length > 0 ? `${kq.loi} (Chức danh đã đổi xong.)` : kq.loi,
            duration: 12000,
          });
          await docLai();
          return;
        }
      }

      toast.success("Đã lưu phân quyền", {
        description: `${tom.ten.length} người · có hiệu lực từ lần tải trang kế tiếp của họ.`,
      });
      /* Bảng "Giao việc cho ai" giữ danh sách người bị khoá 60 giây — bỏ bộ nhớ để nó thấy ngay. */
      lamMoiNguoiKhongVaoApp();
      datLaiNhap();
      /* Đọc lại từ máy chủ thay vì tự sửa danh sách trong bộ nhớ: ghi hỏng một phần mà màn vẫn
         xanh là thứ tệ nhất ở màn này. */
      await tai();
    } finally {
      setDangLuu(false);
    }
  }

  async function themMoi(tv: ThanhVienDanhBa, vt: VaiTroChuan) {
    setDangLuu(true);
    try {
      const loi = await ganVaiTro(tv.uid, vt.ma);
      if (loi) {
        toast.error("Chưa cấp được quyền", { description: loi, duration: 12000 });
        return;
      }
      toast.success("Đã cấp quyền", { description: `${tv.hoTen} → ${vt.ten}` });
      // Đọc lại CẢ HAI danh sách: người mới vừa thêm phải biến mất khỏi danh bạ "chưa có hồ
      // sơ" và hiện ra ở danh sách phân quyền — không tự suy đoán, đọc lại máy chủ thật.
      await Promise.all([tai(), taiDanhBa()]);
      setVaiTroChonMoi((c) => {
        const conLai = { ...c };
        delete conLai[tv.uid];
        return conLai;
      });
    } finally {
      setDangLuu(false);
    }
  }

  const motNguoi = dsChon.length === 1 ? dsChon[0] : null;
  const soBatHien = KHOA_TICK.filter((k) => giaTriCo(k) === true).length;
  const soMixed = KHOA_TICK.filter((k) => giaTriCo(k) === "mixed").length;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Thu mua", href: "/tong-quan" }, { label: "Phân quyền người dùng" }]}
        title="Phân quyền người dùng"
        description={`Chọn người ở cột trái, tick quyền ở cột phải rồi bấm Lưu. Bạn gán chức danh được tới ${NHAN_CAP_QUYEN[toiDa]}.`}
      />

      {/* ---------- THÊM NGƯỜI DÙNG MỚI — lấy thẳng danh bạ App Tổng ---------- */}
      {laCheDoThat && (
        <Card>
          <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserPlus className="size-4 shrink-0 text-primary" aria-hidden />
                <p className="text-h3 text-text-primary">Thêm người dùng mới</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void taiDanhBa()}
                disabled={dangTaiDanhBa}
              >
                <RefreshCw className={`size-4 ${dangTaiDanhBa ? "animate-spin" : ""}`} aria-hidden />
                Đọc lại danh bạ
              </Button>
            </div>
            <p className="text-sm text-text-secondary">
              Chọn <strong>phòng ban</strong> của App Tổng để xem người trong phòng đó, hoặc gõ
              tên nếu đã biết. Không cần biết trước mã tài khoản, không cần làm gì bên ngoài app
              này.
            </p>

            {/* 🔴 KHÔNG TRẢI SẴN DANH BẠ CÔNG TY — Ban lãnh đạo 20/08/2026: *"ẩn thông tin này
                đi, để mục tìm kiếm theo phòng ban của app tổng"*.
                Bản trước bày sẵn tới 30 người kèm HỌ TÊN · EMAIL · CHỨC DANH · BỘ PHẬN ngay khi
                mở trang. Hai chỗ sai: ① phơi danh bạ nhân sự toàn công ty cho bất kỳ ai mở được
                màn phân quyền, trong khi việc cần làm chỉ là cấp quyền cho MỘT người; ② danh sách
                dài mà vẫn phải cuộn tìm, tức không giúp gì cho chính việc đó.
                Nay: chưa chọn phòng ban và chưa gõ gì thì KHÔNG hiện một ai. */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={phongBanChon}
                onChange={(e) => setPhongBanChon(e.target.value)}
                aria-label="Chọn phòng ban của App Tổng"
                className="min-h-11 rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors hover:border-primary focus:border-primary focus:outline-none sm:w-2/5"
              >
                <option value="">— chọn phòng ban —</option>
                {dsPhongBan.map((pb) => (
                  <option key={pb.ten} value={pb.ten}>
                    {tenPhongBan(pb.ten)} ({pb.so})
                  </option>
                ))}
              </select>

              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-desc"
                  aria-hidden
                />
                <Input
                  value={tuKhoaTim}
                  onChange={(e) => setTuKhoaTim(e.target.value)}
                  placeholder="Hoặc gõ tên / email…"
                  className="pl-9"
                  aria-label="Tìm người trong danh bạ công ty"
                />
              </div>
            </div>

            {dangTaiDanhBa && danhBa === null && (
              <p className="text-sm text-text-desc">Đang đọc danh bạ công ty…</p>
            )}

            {danhBa !== null && (() => {
              const chuaCoHoSo = danhBa.filter((tv) => !tv.daCoHoSoThuMua);
              const tuKhoa = boDau(tuKhoaTim.trim());

              if (chuaCoHoSo.length === 0) {
                return (
                  <p className="text-sm text-text-desc">
                    Toàn bộ công ty đã có hồ sơ ở app Thu mua, hoặc chưa đọc được danh bạ.
                  </p>
                );
              }

              /* Chưa chọn phòng ban VÀ chưa gõ gì → không hiện ai. Nói rõ phải làm gì thay vì
                 để khối trống trơn không giải thích. */
              if (phongBanChon === "" && tuKhoa === "") {
                return (
                  <p className="text-sm text-text-desc">
                    Chọn một phòng ban ở trên để xem người trong phòng đó, hoặc gõ tên/email nếu
                    đã biết cần cấp quyền cho ai. Danh bạ công ty không bày sẵn ở đây.
                  </p>
                );
              }

              /* Lọc theo phòng ban trước, rồi mới lọc theo từ khóa TRONG phạm vi đó — hai ô hoạt
                 động cùng lúc, không cái nào vô hiệu hóa cái nào. */
              const theoPhong =
                phongBanChon === ""
                  ? chuaCoHoSo
                  : chuaCoHoSo.filter(
                      (tv) => (tv.phongBan.trim() || CHUA_GAN_PHONG_BAN) === phongBanChon,
                    );
              const khop = tuKhoa
                ? theoPhong.filter(
                    (tv) => boDau(tv.hoTen).includes(tuKhoa) || boDau(tv.email).includes(tuKhoa),
                  )
                : theoPhong;
              const ketQua = khop.slice(0, 30);
              /* Bị cắt thì PHẢI NÓI — cắt im lặng làm người dùng tưởng đã xem hết phòng đó rồi
                 kết luận sai là "phòng này không có ai nữa". */
              const biCat = khop.length - ketQua.length;

              if (ketQua.length === 0) {
                return (
                  <p className="text-sm text-text-desc">
                    Không tìm thấy ai
                    {tuKhoa ? <> khớp &quot;{tuKhoaTim}&quot;</> : null}
                    {phongBanChon !== "" ? (
                      <>
                        {" "}
                        trong{" "}
                        {phongBanChon === CHUA_GAN_PHONG_BAN
                          ? "nhóm chưa gán phòng ban"
                          : `phòng ${phongBanChon}`}
                      </>
                    ) : null}
                    . Người đã có hồ sơ ở app Thu mua không hiện lại ở đây — xem danh sách bên dưới.
                  </p>
                );
              }

              return (
                <div className="flex flex-col gap-(--hp-md-row-gap)">
                  {ketQua.map((tv) => {
                    const maChon = vaiTroChonMoi[tv.uid] ?? "";
                    const vtChon = timVaiTroChuan(maChon);
                    return (
                      <div
                        key={tv.uid}
                        className="flex flex-col gap-3 rounded-xl border border-border p-(--hp-md-card-pad) sm:flex-row sm:items-start"
                      >
                        <div className="sm:w-1/3 sm:shrink-0">
                          <p className="font-medium text-text-primary">{tv.hoTen}</p>
                          <p className="text-xs text-text-desc">{tv.email}</p>
                          <p className="mt-1 text-xs text-text-secondary">
                            {tv.chucDanh || "—"} · {tv.phongBan || "—"}
                          </p>
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <select
                            value={maChon}
                            onChange={(e) =>
                              setVaiTroChonMoi((c) => ({ ...c, [tv.uid]: e.target.value }))
                            }
                            aria-label={`Vai trò cho ${tv.hoTen}`}
                            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors hover:border-primary focus:border-primary focus:outline-none"
                          >
                            <option value="">— chọn vai trò —</option>
                            {vaiTroGanDuoc
                              .filter((v) => v.ma !== "ngung_truy_cap")
                              .map((v) => (
                                <option key={v.ma} value={v.ma}>
                                  {v.ten}
                                </option>
                              ))}
                          </select>
                          {vtChon && (
                            <>
                              <p className="text-xs text-text-desc">{vtChon.moTa}</p>
                              <ViecLamDuoc vt={vtChon} />
                            </>
                          )}
                        </div>

                        <div className="sm:shrink-0">
                          <Button
                            size="sm"
                            disabled={!vtChon || dangLuu}
                            onClick={() => {
                              if (!vtChon) return;
                              /* Nhớ lại — hộp cần nội dung cả lúc đang đóng. */
                              setHoiThemMoiCuoi({ tv, vt: vtChon });
                              setHoiThemMoi({ tv, vt: vtChon });
                            }}
                          >
                            Cấp quyền
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {biCat > 0 && (
                    <p className="text-xs text-text-desc">
                      Còn <strong>{biCat} người</strong> nữa khớp nhưng không hiện ở đây (mỗi lần
                      chỉ hiện 30). Gõ thêm tên hoặc chọn phòng ban hẹp hơn để thấy họ.
                    </p>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {!laCheDoThat ? (
        <EmptyState
          icon={ShieldAlert}
          title="Bản chạy thử đang dùng tài khoản mẫu"
          description="Danh sách người dùng thật chỉ có khi app chạy chế độ đăng nhập Firebase. Ở chế độ tài khoản mẫu, vai trò được viết sẵn trong mã nguồn nên không có hồ sơ nào để phân quyền."
        />
      ) : (
        <>
          {/* 🔴 NÓI ĐÚNG MẶC ĐỊNH ĐANG CHẠY. Demo ghi "mặc định không xem được gì" — app thật đang để
              an toàn: chưa tick riêng thì giữ quyền theo chức danh. Ghi sai ở đây là người phân quyền
              tưởng người chưa tick đang bị khoá hết, trong khi họ vẫn làm việc bình thường.
              ★ Sếp chốt 26/09/2026: *"Tạm giữ theo chức danh"* — câu in đậm dưới đây đúng chỉ đạo đó. */}
          <div
            role="note"
            className="flex items-start gap-3 rounded-xl border border-warning bg-warning-bg p-(--hp-md-card-pad) text-sm text-text-secondary"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-soft" aria-hidden />
            <p>
              <strong className="text-text-primary">
                Người chưa được tick riêng vẫn giữ nguyên quyền theo chức danh.
              </strong>{" "}
              Lưu quyền riêng cho ai thì chỉ những ô được tick mới mở cho người đó. Danh sách
              &quot;Giao việc&quot; vẫn lấy theo <strong>chức danh</strong>, không theo ô tick. Thay
              đổi có hiệu lực từ lần tải trang kế tiếp của người đó — trang họ đang mở giữ quyền cũ
              tới khi tải lại. Lúc tải trang mà app không đọc được phân quyền thì người đó chưa vào
              được app cho tới khi đọc được. Đổi chức danh thì người đó nhận các quyền mặc định của
              chức danh mới, trừ những quyền đã bị bỏ ở quyền riêng cũ (vẫn bỏ); quyền từng được tick
              thêm vượt chức danh cũ không mang sang.
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-(--hp-md-card-gap) lg:grid-cols-[340px_minmax(0,1fr)]">
            {/* ================= CỘT TRÁI — NHÂN SỰ ================= */}
            <Card className="gap-0 py-0">
              <div className="flex items-center justify-between gap-2 border-b border-divider px-4 py-3">
                <div className="flex items-center gap-2">
                  <Users className="size-4 shrink-0 text-primary" aria-hidden />
                  <p className="text-h3 text-text-primary">Nhân sự</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-desc">
                    {danhSach === null ? "Đang đọc…" : `${dsLoc.length} người`}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => void docLai()}
                    disabled={dangTai}
                    aria-label="Đọc lại danh sách và quyền riêng"
                    title="Đọc lại"
                  >
                    <RefreshCw className={`size-4 ${dangTai ? "animate-spin" : ""}`} aria-hidden />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-b border-divider px-4 py-3">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-desc"
                    aria-hidden
                  />
                  <Input
                    value={tuKhoaDs}
                    onChange={(e) => setTuKhoaDs(e.target.value)}
                    placeholder="Gõ tên hoặc email…"
                    className="pl-9"
                    aria-label="Tìm người trong danh sách phân quyền"
                  />
                </div>
                <select
                  value={phongBanDs}
                  onChange={(e) => setPhongBanDs(e.target.value)}
                  aria-label="Lọc theo phòng ban"
                  className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors hover:border-primary focus:border-primary focus:outline-none"
                >
                  <option value="">Tất cả phòng ban</option>
                  {dsPhongBanDs.map((pb) => (
                    <option key={pb} value={pb}>
                      {tenPhongBan(pb)}
                    </option>
                  ))}
                </select>

                {/* ★ Chọn nhiều người (Sếp 26/09/2026 ②). Chỉ gom người SỬA ĐƯỢC — người bị khoá
                    (chính mình, cấp cao hơn, Quản trị) gom vào là cả lượt lưu bị từ chối. */}
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text-secondary has-disabled:cursor-not-allowed has-disabled:opacity-60">
                  <OTich
                    giaTri={giaTriChonTatCa}
                    onDoi={chonTatCaDangLoc}
                    disabled={dsLocSuaDuoc.length === 0}
                  />
                  <span>
                    Chọn tất cả đang lọc ({dsLocSuaDuoc.length})
                    {soBoQuaQtNgung > 0 && (
                      <span className="text-text-desc">
                        {" "}
                        · bỏ qua {soBoQuaQtNgung} người Quản trị/Ngừng truy cập
                      </span>
                    )}
                    {soBoQuaKhoa > 0 && (
                      <span className="text-text-desc"> · {soBoQuaKhoa} người bạn không sửa được</span>
                    )}
                    {chon.length > 0 && (
                      <span className="text-text-desc"> · đang chọn {chon.length}</span>
                    )}
                  </span>
                </label>

                {/* 🔴 CỬA QUAY LẠI — xem chú thích ở `hienNgungTruyCap`. Chỉ hiện khi THẬT SỰ có
                    người bị ẩn. */}
                {soDaAn > 0 && (
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text-secondary">
                    <OTich giaTri={hienNgungTruyCap} onDoi={setHienNgungTruyCap} />
                    Hiện cả {soDaAn} tài khoản đã ngừng truy cập
                  </label>
                )}
              </div>

              {danhSach !== null && dsLoc.length === 0 && (
                <p className="px-4 py-6 text-sm text-text-desc">
                  {dsHien.length === 0
                    ? "Không đọc được tài khoản nào. Kiểm tra lại kết nối máy chủ."
                    : "Không có ai khớp bộ lọc."}
                </p>
              )}

              {dsLoc.length > 0 && (
                <ul className="thanh-cuon-doc-ro max-h-[420px] overflow-y-auto lg:max-h-[640px]">
                  {dsLoc.map((t) => {
                    const uid = t.hs.firebaseUid;
                    const daChon = chon.includes(uid);
                    const tt = trangThaiNguoi(t, Boolean(loiRieng));
                    return (
                      <li
                        key={uid}
                        className={`flex min-h-14 items-stretch border-b border-l-4 border-divider ${
                          daChon ? "border-l-primary bg-primary-bg" : "border-l-transparent"
                        }`}
                      >
                        <label
                          className="flex w-11 shrink-0 cursor-pointer items-center justify-center has-disabled:cursor-not-allowed"
                          title={t.lyDoKhoa ?? `Chọn ${t.ten} để phân quyền cùng lúc`}
                        >
                          {/* Người bị khoá: không THÊM vào nhóm được, nhưng đã lỡ chọn (bấm vào tên)
                              thì vẫn BỎ ra được — khoá luôn là kẹt cả nhóm vì một người. */}
                          <OTich
                            giaTri={daChon}
                            onDoi={(b) => doiChonNhieu(uid, b)}
                            disabled={Boolean(t.lyDoKhoa) && !daChon}
                            ariaLabel={`Chọn ${t.ten} để phân quyền cùng lúc`}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => chonMot(uid)}
                          aria-pressed={daChon}
                          className="flex min-w-0 flex-1 items-center gap-3 py-2 pr-3 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        >
                          <AnhDaiDienChu ten={t.ten} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-text-primary">
                              {t.ten}
                            </span>
                            <span className="block truncate text-xs text-text-desc">
                              {tenPhongBan(t.phongBan)} ·{" "}
                              {t.vtHienTai?.ten ?? `Tùy chỉnh (${NHAN_CAP_QUYEN[t.nd.capTM]})`}
                            </span>
                          </span>
                          <StatusBadge label={tt.label} tone={tt.tone} className="shrink-0" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* ================= CỘT PHẢI — QUYỀN ================= */}
            <Card className="gap-0 py-0">
              {dsChon.length === 0 ? (
                <div className="p-(--hp-md-card-pad)">
                  <EmptyState
                    icon={ShieldAlert}
                    title="Chưa chọn ai"
                    description="Bấm vào tên một người ở cột trái để xem và tick quyền. Muốn phân quyền cùng lúc cho nhiều người thì tích ô vuông cạnh tên từng người."
                  />
                </div>
              ) : (
                <>
                  {/* ---- Ai đang được phân quyền ---- */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-divider px-4 py-4">
                    {motNguoi ? (
                      <div className="flex min-w-0 items-center gap-3">
                        <AnhDaiDienChu ten={motNguoi.ten} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-text-primary">{motNguoi.ten}</p>
                          <p className="truncate text-xs text-text-desc">
                            {motNguoi.hs.hoSo.email} · {tenPhongBan(motNguoi.phongBan)}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {loiRieng ? (
                              <StatusBadge label="Chưa đọc được quyền riêng" tone="warning" />
                            ) : motNguoi.rieng ? (
                              <>
                                {motNguoi.rieng.lechChucDanh ? (
                                  <StatusBadge label="Quyền riêng theo chức danh cũ" tone="warning" />
                                ) : (
                                  <StatusBadge label="Có quyền riêng" tone="success" />
                                )}
                                <span className="text-xs text-text-desc">
                                  lưu {formatDateTime(motNguoi.rieng.capNhatLuc)}
                                  {motNguoi.rieng.capNhatBoiTen
                                    ? ` bởi ${motNguoi.rieng.capNhatBoiTen}`
                                    : ""}
                                  {/* Nói rõ hệ quả của dấu chức danh lệch — xem `quyenRiengHieuLuc`. */}
                                  {motNguoi.rieng.lechChucDanh
                                    ? " · chức danh đã đổi từ lúc lưu: theo mẫu chức danh mới, chỉ giữ những quyền đã bị bỏ ở bản cũ"
                                    : ""}
                                </span>
                              </>
                            ) : (
                              <>
                                <StatusBadge label="Theo chức danh" tone="neutral" />
                                <span className="text-xs text-text-desc">
                                  Chưa có quyền riêng — đang theo chức danh
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <p className="font-semibold text-text-primary">
                          Đang chọn {dsChon.length} người
                        </p>
                        <p className="text-xs text-text-desc">
                          {dsChon
                            .slice(0, 6)
                            .map((t) => t.ten)
                            .join(", ")}
                          {dsChon.length > 6 ? ` và ${dsChon.length - 6} người nữa` : ""}
                        </p>
                        <p className="mt-1 text-xs text-text-desc">
                          {dsChon.filter((t) => t.rieng).length} người có quyền riêng ·{" "}
                          {dsChon.filter((t) => !t.rieng).length} người đang theo chức danh. Ô có
                          dấu gạch ngang là mỗi người một kiểu — chỉ ô bạn chạm mới được ghi.
                        </p>
                      </div>
                    )}
                    {!motNguoi && (
                      <Button variant="ghost" size="sm" onClick={() => setChon([])}>
                        Bỏ chọn tất cả
                      </Button>
                    )}
                  </div>

                  {/* ---- Chức danh + tick nhanh ---- */}
                  <div className="flex flex-col gap-3 border-b border-divider px-4 py-4 md:flex-row md:items-end">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <label htmlFor="chuc-danh-phan-quyen" className="text-xs font-semibold text-text-secondary">
                        Chức danh (quyết định có trong danh sách Giao việc không)
                      </label>
                      <select
                        id="chuc-danh-phan-quyen"
                        value={nhapVaiTro}
                        onChange={(e) => doiChucDanhNhap(e.target.value)}
                        disabled={dsChon.some((t) => t.lyDoKhoa) || dangLuu}
                        className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-text-primary transition-colors hover:border-primary focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">
                          {motNguoi
                            ? `Giữ nguyên: ${motNguoi.vtHienTai?.ten ?? `Tùy chỉnh (${NHAN_CAP_QUYEN[motNguoi.nd.capTM]})`}`
                            : "Giữ nguyên chức danh của từng người"}
                        </option>
                        {vaiTroGanDuoc.map((v) => (
                          <option key={v.ma} value={v.ma}>
                            {v.ten}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-text-desc">
                        {vtMoi
                          ? loiRieng
                            ? `Đổi sang “${vtMoi.ten}”: lần lưu này CHỈ đổi chức danh (chưa đọc được quyền riêng nên không ghi ô tick). ${vtMoi.moTa}`
                            : vtMoi.vaiTro === "admin" || vtMoi.capTM === 0
                              ? `Đổi sang “${vtMoi.ten}”: lần lưu này chỉ đổi chức danh — ${vtMoi.vaiTro === "admin" ? "Quản trị luôn đủ mọi quyền" : "Ngừng truy cập thì ô tick không có tác dụng"}. ${vtMoi.moTa}`
                              : `Đổi sang “${vtMoi.ten}”: đã tick lại theo mẫu của chức danh này — thêm/bớt tiếp nếu cần. ${vtMoi.moTa}`
                          : "Đổi chức danh là tick lại toàn bộ theo mẫu của chức danh đó."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        disabled={!mauApDuoc || Boolean(lyDoKhongTick) || dangLuu}
                        title={
                          mauApDuoc
                            ? undefined
                            : "Những người đang chọn khác mẫu chức danh — chọn một chức danh ở ô bên cạnh để áp."
                        }
                        onClick={() => mauApDuoc && setNhapQuyen(rutQuyenRieng(mauApDuoc))}
                      >
                        Áp mẫu theo chức danh
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={Boolean(lyDoKhongTick) || dangLuu}
                        title={lyDoKhoaVaoApp ? "Giữ “Vào app” — người cấp Quản lý trở lên không bỏ được ô này." : undefined}
                        onClick={boHet}
                      >
                        Bỏ hết
                      </Button>
                    </div>
                  </div>

                  {/* ---- Khoá tick thì PHẢI nói vì sao ---- */}
                  {lyDoKhongTick && (
                    <p className="border-b border-divider bg-muted px-4 py-3 text-sm text-text-secondary">
                      {lyDoKhongTick}
                    </p>
                  )}

                  {/* ---- Các nhóm quyền ---- */}
                  {NHOM_QUYEN_TICK.map((nhom) => {
                    const ds = CO_TICK_DUOC.filter((c) => c.nhom === nhom);
                    const soBat = ds.filter((c) => giaTriCo(c.khoa) === true).length;
                    return (
                      <fieldset key={nhom} className="border-b border-divider px-4 py-4">
                        <legend className="sr-only">{nhom}</legend>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
                            {nhom}
                          </p>
                          <span className="text-xs text-text-desc">
                            {soBat}/{ds.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-x-4 gap-y-1 md:grid-cols-2">
                          {ds.map((c) => {
                            const gt = giaTriCo(c.khoa);
                            const daDoi = c.khoa in nhapQuyen;
                            const idMoTa = `mo-ta-quyen-${c.khoa}`;
                            /* "Vào app" của người cấp ≥ 3: khoá khi ĐANG BẬT (không cho bỏ), vẫn mở
                               khi đang tắt / mỗi người một kiểu để tick lên được. */
                            const khoaBoVaoApp = c.khoa === "xemDuocApp" && Boolean(lyDoKhoaVaoApp) && gt === true;
                            return (
                              <label
                                key={c.khoa}
                                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted has-disabled:cursor-not-allowed has-disabled:opacity-60"
                              >
                                <OTich
                                  giaTri={gt}
                                  onDoi={(b) => doiCo(c.khoa, b)}
                                  disabled={Boolean(lyDoKhongTick) || dangLuu || khoaBoVaoApp}
                                  ariaDescribedBy={idMoTa}
                                  className="mt-0.5"
                                />
                                <span className="min-w-0">
                                  <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-text-primary">
                                    {c.nhan}
                                    {/* Trạng thái luôn có CHỮ, không chỉ dấu gạch — V1.1. */}
                                    {gt === "mixed" && (
                                      <span className="text-xs font-normal text-text-desc">
                                        (mỗi người một kiểu)
                                      </span>
                                    )}
                                    {daDoi && <StatusBadge label="đã đổi" tone="primary" />}
                                  </span>
                                  <span id={idMoTa} className="block text-xs text-text-desc">
                                    {c.moTa}
                                    {/* Khoá thì PHẢI nói vì sao, ngay tại ô. */}
                                    {khoaBoVaoApp && lyDoKhoaVaoApp && (
                                      <span className="mt-0.5 block text-warning-soft">{lyDoKhoaVaoApp}</span>
                                    )}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        {/* `phanQuyenNguoiDung` cố ý KHÔNG có ô tick — nói ra để người phân quyền
                            không đi tìm (xem chú thích `CO_TICK_DUOC`). */}
                        {nhom === "Quản trị" && (
                          <p className="mt-2 px-2 text-xs text-text-desc">
                            <strong className="text-text-secondary">Phân quyền người dùng</strong> không
                            tick được: luôn theo chức danh (cấp Quản lý trở lên), vì máy chủ gán chức danh
                            theo cấp. Muốn thu hồi thì hạ chức danh.
                          </p>
                        )}
                        {/* `xuatHoSo` cố ý KHÔNG có ô tick (soát chéo lần 2 26/09/2026) — không nút
                            xuất/in nào đọc cờ này, tick vào không chặn/mở được gì. */}
                        {nhom === "Được làm" && (
                          <p className="mt-2 px-2 text-xs text-text-desc">
                            <strong className="text-text-secondary">Xuất hồ sơ / in chứng từ</strong> không
                            có ô tick: các nút xuất Excel và in hiện chưa gác theo quyền riêng, tick vào cũng
                            không chặn được. Ai xem được hồ sơ thì xuất/in được hồ sơ đó.
                          </p>
                        )}
                      </fieldset>
                    );
                  })}

                  {/* ---- Chân: tổng + nút ---- */}
                  <div className="flex flex-col gap-3 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-text-secondary">
                        {motNguoi ? (
                          <>
                            Đang cấp <strong className="text-text-primary">{soBatHien}</strong>/
                            {KHOA_TICK.length} quyền
                          </>
                        ) : (
                          <>
                            {dsChon.length} người · <strong className="text-text-primary">{soBatHien}</strong>{" "}
                            ô chung đang bật{soMixed > 0 ? ` · ${soMixed} ô mỗi người một kiểu` : ""}
                          </>
                        )}
                        {coNhap && (
                          <span className="text-text-desc"> · có thay đổi chưa lưu</span>
                        )}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" disabled={!coNhap || dangLuu} onClick={datLaiNhap}>
                          Hoàn tác
                        </Button>
                        <Button disabled={Boolean(lyDoKhongLuu) || dangLuu} onClick={moHopLuu}>
                          {dangLuu ? "Đang lưu…" : "Lưu phân quyền"}
                        </Button>
                      </div>
                    </div>
                    {/* Nút mờ PHẢI kèm lý do — nhưng đừng nhắc lại lý do đã hiện ở khung khoá tick. */}
                    {lyDoKhongLuu && coNhap && lyDoKhongLuu !== lyDoKhongTick && (
                      <p className="text-xs text-warning-soft">{lyDoKhongLuu}</p>
                    )}
                  </div>
                </>
              )}
            </Card>
          </div>
        </>
      )}

      {/* ---------- BẢNG ĐỐI CHIẾU: chức danh nào mặc định làm được gì ---------- */}
      <Card>
        <CardContent className="flex flex-col gap-(--hp-md-card-gap)">
          <div>
            <p className="text-h3 text-text-primary">Chức danh nào mặc định làm được gì</p>
            <p className="text-sm text-text-secondary">
              Bảng này <strong>tự sinh từ luật phân quyền thật của app</strong>, không phải mô tả
              chép tay. Đây là MẪU theo chức danh — người đã được tick riêng có thể khác.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold tracking-wide text-text-desc uppercase">
                  <th className="px-2 py-2">Việc</th>
                  {VAI_TRO_CHUAN.map((v) => (
                    <th key={v.ma} className="px-2 py-2 text-center align-bottom">
                      {v.ten}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VIEC_TREN_BANG_DOI_CHIEU.map((viec) => (
                  <tr key={viec.khoa} className="border-b border-border">
                    <td className="px-2 py-2 text-text-secondary">{viec.nhan}</td>
                    {VAI_TRO_CHUAN.map((v) => {
                      const co = quyenCuaVaiTro(v)[viec.khoa];
                      return (
                        <td key={v.ma} className="relative px-2 py-2 text-center">
                          {/* 🔴 CÓ CẢ DẤU LẪN CHỮ CHO TRÌNH ĐỌC — Design System V1.1 cấm dùng
                              mỗi màu/biểu tượng để diễn tả trạng thái. `relative` ở ô để `sr-only`
                              bám vào ô, không thoát khỏi khung cuộn ngang (CLAUDE.md §5). */}
                          {co ? (
                            <>
                              <Check className="mx-auto size-4 text-success" aria-hidden />
                              <span className="sr-only">Được</span>
                            </>
                          ) : (
                            <>
                              <Minus className="mx-auto size-4 text-text-desc" aria-hidden />
                              <span className="sr-only">Không</span>
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 🔴 HỎI TRƯỚC KHI LƯU. Đổi quyền ảnh hưởng ngay tới việc người ta làm được gì — tắt nhầm là
          họ mất việc giữa lúc đang làm, và không tự lấy lại được. */}
      {/* 🔴 KHÔNG bọc bằng `{hoiLuu && …}` — xem chú thích ở `hoiThemMoiCuoi`. */}
      {hoiLuuCuoi && (
        <HopXacNhan
          mo={hoiLuu}
          tieuDe="Lưu phân quyền?"
          moTa={`Áp cho ${hoiLuuCuoi.ten.length} người: ${hoiLuuCuoi.ten.slice(0, 5).join(", ")}${
            hoiLuuCuoi.ten.length > 5 ? ` và ${hoiLuuCuoi.ten.length - 5} người nữa` : ""
          }. Có hiệu lực từ lần tải trang kế tiếp của họ — trang đang mở giữ quyền cũ tới khi tải lại.`}
          canhBao={
            /* Chưa đọc được quyền riêng thì danh sách Bật/Tắt KHÔNG tính được (không biết bản cũ có
               gì) — nói đúng công thức sẽ áp thay vì bày một danh sách sai (soát chéo lần 2). */
            hoiLuuCuoi.chuaDocRieng && hoiLuuCuoi.uidDoiChucDanh.length > 0
              ? "Chưa đọc được quyền riêng đang lưu nên không tính được quyền nào bật/tắt. Sau khi đổi chức danh: ai chưa có quyền riêng thì theo đúng chức danh mới; ai có quyền riêng cũ thì nhận các cờ mặc định của chức danh mới, TRỪ những cờ đã bị bỏ ở quyền riêng cũ (vẫn bỏ). Cờ từng được tick thêm vượt chức danh cũ không mang sang."
              : hoiLuuCuoi.tat.length > 0 || hoiLuuCuoi.vtMoi?.capTM === 0
                ? "Có quyền bị TẮT — người được chọn mất các việc đó từ lần tải trang kế tiếp (trang đang mở giữ quyền cũ tới khi tải lại)."
                : undefined
          }
          nhanDongY="Lưu phân quyền"
          nguyHiem={
            hoiLuuCuoi.vtMoi?.capTM === 0 || (!hoiLuuCuoi.chuaDocRieng && hoiLuuCuoi.tat.length > 0)
          }
          onDongY={() => {
            const tom = hoiLuuCuoi;
            setHoiLuu(false);
            void luuThat(tom);
          }}
          onDong={() => setHoiLuu(false)}
        >
          <ul className="flex flex-col gap-1.5 text-sm text-text-secondary">
            {hoiLuuCuoi.vtMoi && hoiLuuCuoi.uidDoiChucDanh.length > 0 && (
              <li>
                Đổi chức danh → <strong className="text-text-primary">{hoiLuuCuoi.vtMoi.ten}</strong>{" "}
                ({hoiLuuCuoi.uidDoiChucDanh.length} người)
              </li>
            )}
            {/* Ẩn Bật/Tắt khi chưa đọc được quyền riêng — hai danh sách đó tính như thể không ai có
                quyền riêng, tức có thể SAI (xem `canhBao` ngay trên). */}
            {!hoiLuuCuoi.chuaDocRieng && hoiLuuCuoi.bat.length > 0 && (
              <li>
                <span className="font-medium text-success-soft">Bật:</span> {hoiLuuCuoi.bat.join(", ")}
              </li>
            )}
            {!hoiLuuCuoi.chuaDocRieng && hoiLuuCuoi.tat.length > 0 && (
              <li>
                <span className="font-medium text-danger-soft">Tắt:</span> {hoiLuuCuoi.tat.join(", ")}
              </li>
            )}
            {hoiLuuCuoi.soGiuTheoChucDanh > 0 && (
              <li className="text-xs text-text-desc">
                {hoiLuuCuoi.soGiuTheoChucDanh} người có kết quả trùng mẫu chức danh — giữ &quot;theo
                chức danh&quot;, không lưu quyền riêng.
              </li>
            )}
            {/* Chưa đọc được quyền riêng: danh sách Bật/Tắt ở trên tính như thể không ai có quyền
                riêng — nói rõ để không ai tin nhầm (ca E, soát chéo 26/09/2026). */}
            {hoiLuuCuoi.chuaDocRieng && (
              <li className="text-xs text-warning-soft">
                Lần này chỉ đổi chức danh, không ghi ô tick nào.
              </li>
            )}
          </ul>
        </HopXacNhan>
      )}

      {/* Hỏi trước khi CẤP QUYỀN MỚI — người này trước đó chưa vào được app, cấp nhầm vai trò
          rộng là lộ dữ liệu ngay từ lần đăng nhập đầu tiên. */}
      {/* 🔴 KHÔNG bọc bằng `{hoiThemMoi && …}` — xem chú thích ở `hoiThemMoiCuoi`. */}
      {hoiThemMoiCuoi && (
        <HopXacNhan
          mo={hoiThemMoi !== null}
          tieuDe="Cấp quyền cho người này?"
          moTa={
            `Cấp cho ${hoiThemMoiCuoi.tv.hoTen} (${hoiThemMoiCuoi.tv.email}) vai trò “${hoiThemMoiCuoi.vt.ten}”. ` +
            `${hoiThemMoiCuoi.vt.moTa} Người này đăng nhập lần tới bằng đúng tài khoản HPcore của họ là vào được ngay.`
          }
          nhanDongY="Cấp quyền"
          onDongY={() => {
            const { tv, vt } = hoiThemMoiCuoi;
            setHoiThemMoi(null);
            const xet = duocDatCap(nguoiDung, vt.capTM);
            if (!xet.duoc) {
              toast.error("Không cấp được", { description: xet.lyDo });
              return;
            }
            /* 🔴 KIỂM CẢ CỜ `chiQuanTriGan`, không chỉ kiểm cấp. Vai trò "Ban Giám đốc" có cấp 1
               nên qua được `duocDatCap` của người cấp 3, trong khi nó mở quyền xem MỌI hồ sơ kèm
               giá — xem `chiQuanTriGan` ở `vai-tro-chuan.ts`. */
            if (!vaiTroGanDuocBoi(toiDa).some((x) => x.ma === vt.ma)) {
              toast.error("Không cấp được", {
                description: `Vai trò “${vt.ten}” chỉ tài khoản Quản trị mới gán được.`,
              });
              return;
            }
            void themMoi(tv, vt);
          }}
          onDong={() => setHoiThemMoi(null)}
        />
      )}
    </>
  );
}

/** Nhãn trạng thái một người trên danh sách — luôn có CẢ chữ lẫn màu (V1.1). */
function trangThaiNguoi(t: ThongTinNguoi, chuaDocRieng: boolean): { label: string; tone: StatusTone } {
  if (t.hs.hoSo.dangLamViec === false) return { label: "Tạm ngưng", tone: "neutral" };
  if (t.vtHienTai?.ma === "ngung_truy_cap") return { label: "Ngừng truy cập", tone: "neutral" };
  if (t.laQuanTri) return { label: "Quản trị", tone: "primary" };
  /* Chưa đọc được quyền riêng thì KHÔNG đếm — đếm theo chức danh là nói sai với người đã được tick. */
  if (chuaDocRieng) return { label: "Chưa rõ quyền riêng", tone: "warning" };
  if (!t.hieuLuc.xemDuocApp) return { label: "Chưa có quyền", tone: "danger" };
  const so = demCoBat(t.hieuLuc);
  if (t.rieng?.lechChucDanh) return { label: `${so} quyền · riêng (chức danh cũ)`, tone: "warning" };
  return t.rieng
    ? { label: `${so} quyền · riêng`, tone: "success" }
    : { label: `${so} quyền · chức danh`, tone: "neutral" };
}

/**
 * Ô tích ba trạng thái (bật / tắt / mỗi người một kiểu).
 *
 * 📌 DÙNG `<input type="checkbox">` GỐC, KHÔNG dùng `nen-tang-ui/checkbox`: `Checkbox.Indicator` của
 * base-ui vẽ DẤU TÍCH cho cả trạng thái `indeterminate` (đo trong `CheckboxIndicator.js`:
 * `rendered = checked || indeterminate`), tức ô "mỗi người một kiểu" trông y như ô đã bật — đúng
 * thứ dễ khiến người phân quyền hiểu nhầm nhất. Ô gốc vẽ dấu gạch ngang và tự báo `aria-checked=
 * "mixed"` cho trình đọc màn hình. Thư viện `nen-tang-ui/` là thư viện ngoài, không sửa.
 */
function OTich({
  giaTri,
  onDoi,
  disabled,
  ariaLabel,
  ariaDescribedBy,
  className = "",
}: {
  giaTri: boolean | "mixed";
  onDoi: (bat: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = giaTri === "mixed";
  }, [giaTri]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={giaTri === true}
      disabled={disabled}
      onChange={(e) => onDoi(e.target.checked)}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`size-4.5 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed ${className}`}
    />
  );
}

/** Xem trước: vai trò đang chọn làm được những việc nào. Dữ liệu từ `tinhQuyen`, không chép tay. */
function ViecLamDuoc({ vt }: { vt: VaiTroChuan }) {
  const q = quyenCuaVaiTro(vt);
  const duoc = VIEC_TREN_BANG_DOI_CHIEU.filter((v) => q[v.khoa]);
  if (duoc.length === 0) {
    return <p className="text-xs text-text-desc">Không làm được việc nào trong app.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {duoc.map((v) => (
        <li
          key={v.khoa}
          className="flex items-center gap-1 rounded-md bg-success-bg px-1.5 py-0.5 text-xs font-medium text-success-soft"
        >
          <Check className="size-3 shrink-0" aria-hidden />
          {v.nhan}
        </li>
      ))}
    </ul>
  );
}
