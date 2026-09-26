// ============================================================
// TÁCH PHIẾU NGAY LÚC GIAO VIỆC — mỗi người một phiếu con, người giao sau cùng giữ phiếu gốc.
//
// ★★★ Sếp 26/09/2026: ***"từ 1 phiếu đề nghị khi giao việc cho nhân viên sẽ tự động tách ra các
// phiếu riêng biệt để dễ kiểm soát, nhưng chúng vẫn phải có liên kết cha con để sau này có thể
// tìm lại được"***. Sếp chốt thêm cùng ngày:
//   ① Giao cả phiếu cho MỘT người → KHÔNG tách.
//   ② Người được giao SAU CÙNG giữ luôn phiếu gốc (phiếu tổng) — không sinh phiếu vỏ rỗng.
//   ③ Dòng đã giao đi hiện MỜ trên phiếu gốc, và CHỈ Trưởng bộ phận thấy (lọc ở giao diện).
//   ④ Chỉ một Trưởng phòng giao việc → không xử ca hai người giao cùng lúc.
//
// 🔴 VÌ SAO THAY CƠ CHẾ CŨ. Tách tự động 22/08/2026 chạy bằng một `useEffect` trên MỌI máy đang mở
// app ("Hệ thống" thấy phiếu ở bước ② còn nhiều người thì tách) và CẮT dòng khỏi phiếu gốc. Máy
// giữ bản cũ ghi đè → dòng quay lại → máy khác tách tiếp: một phiếu ra 14 bản (sự cố 24–25/09,
// commit 5569c9d chặn tạm). Nay việc tách chỉ xảy ra TRONG thao tác giao việc của Trưởng bộ phận:
//   · một máy, một lần bấm, nhật ký ghi đúng tên người giao;
//   · phiếu con có mã CỐ ĐỊNH theo (phiếu gốc, người nhận) — chạy lại cũng không sinh bản mới;
//   · phiếu gốc GIỮ NGUYÊN mọi dòng (không cắt, không đánh số lại) nên báo giá / PO trỏ theo số
//     dòng cũ không lệch; dòng đã giao đi được LÀM MỜ bằng cơ chế có sẵn `dongDaNhanBanSang`
//     (suy ra từ `deNghiChaId` + `sttDongCha` của phiếu con, KHÔNG lưu cờ lên phiếu gốc).
//
// 📌 HÀM THUẦN: nhận danh sách đề nghị, trả danh sách mới. Tầng ghi (`kho-du-lieu.tsx`) chỉ áp vào
// bên trong `setDeNghi((truoc) => …)`, nên luôn tính trên dữ liệu mới nhất, và bộ kiểm luật gọi
// thật được (CLAUDE.md §3.4b).
// ============================================================

import type { BaoGia, DeNghiMuaHang, DonDatHang, LoaiViecGiao } from "@/3-du-lieu/kieu-du-lieu";
import {
  dongDaChuyenDiHet,
  dongDaCoChungTu,
  dongDaNhanBanSang,
  khoiLuongDaTachTheoDong,
  lamTronKhoiLuong,
  maBanSaoTiepTheo,
  phieuGocCua,
  tenBanSaoTheoMa,
} from "@/2-quy-trinh/nhan-ban-de-nghi";
/* 📌 Không vòng import: `giai-doan-mua-hang.ts` không import ngược tệp này. */
import { deNghiConDangChay, xacDinhGiaiDoan } from "@/2-quy-trinh/giai-doan-mua-hang";

/**
 * ★ Hồ sơ đã đóng (hoàn thành / đóng dở) thì KHÔNG giao, chuyển, bỏ phân bổ nữa — soát giao việc
 * 25–26/09/2026 (#2, #17, #32, #52).
 *
 * 🔴 VÌ SAO Ở TẦNG LUẬT: từ 26/09 giao việc có thể TÁCH phiếu, và phiếu con được dựng với
 * `trangThai: "da_duyet"` — tức giao một dòng trên hồ sơ đã huỷ là **đẻ ra một hồ sơ sống mới** ở
 * bước ②, người nhận còn được chuông báo việc mới. Chặn ở đây thì cả `phanBoDong`, `chuyenViecDong`
 * và nhánh phiếu con của `boPhanBoDong` cùng được chặn, bộ kiểm luật gọi thật được.
 *
 * 📌 So `trangThai` là đủ: `that_bai` và `hoan_thanh` chỉ suy ra từ trường này
 * (`xacDinhGiaiDoan` dòng đầu) — cùng nghĩa với `giaiDoanDaKetThuc(xacDinhGiaiDoan(...))`.
 */
export function loiHoSoDaDongKhiGiaoViec(
  dn: Pick<DeNghiMuaHang, "trangThai">,
  viecDangLam = "giao việc",
): string | null {
  if (deNghiConDangChay(dn as DeNghiMuaHang)) return null;
  return dn.trangThai === "hoan_thanh"
    ? `Đề nghị đã hoàn thành nên không ${viecDangLam} được nữa.`
    : `Đề nghị đã đóng dở nên không ${viecDangLam} được nữa. Muốn mua tiếp thì lập một đề nghị mới.`;
}

/** Bốn trường YÊU CẦU giao việc trên một dòng — gỡ người thì gỡ luôn, chuyển việc thì mang theo. */
type DongDN = DeNghiMuaHang["items"][number];
type TruongYeuCauGiao = "soBaoGiaYeuCau" | "soBaoGiaTPGiao" | "ghiChuPhanBo" | "loaiViecGiao";
function yeuCauCuaDong(d: DongDN): Pick<DongDN, TruongYeuCauGiao> {
  return {
    soBaoGiaYeuCau: d.soBaoGiaYeuCau,
    soBaoGiaTPGiao: d.soBaoGiaTPGiao,
    ghiChuPhanBo: d.ghiChuPhanBo,
    loaiViecGiao: d.loaiViecGiao,
  };
}
const YEU_CAU_TRONG = {
  soBaoGiaYeuCau: undefined,
  soBaoGiaTPGiao: undefined,
  ghiChuPhanBo: undefined,
  loaiViecGiao: undefined,
} as const;

/**
 * ★ Mã phiếu con CỐ ĐỊNH theo (phiếu gốc, người nhận).
 *
 * 🔴 NỐI BẰNG `__`, KHÔNG DÙNG `~`: kho lưu theo đường dẫn `deNghi.<id>`, mà Firestore cấm `~ * / [ ]`
 * trong đường dẫn trường ("Invalid field path") — dùng `~` là MỌI lần lưu đều hỏng (agent phản
 * biện 26/09 đo trong mã thư viện). Uid được làm sạch về `[A-Za-z0-9_-]` vì cùng lý do (và `.`).
 */
export function idPhieuConTheoNguoi(gocId: string, uid: string): string {
  return `${gocId}__${uid.replace(/[^A-Za-z0-9_-]/g, "_")}`;
}

/** Phiếu này có phải phiếu con sinh ra lúc giao việc (cơ chế 26/09) không. */
export function laPhieuConKhiGiao(dn: Pick<DeNghiMuaHang, "id" | "deNghiChaId">): boolean {
  return Boolean(dn.deNghiChaId) && dn.id.startsWith(`${dn.deNghiChaId}__`);
}

/**
 * ★ `dongDaCoChungTu` — dời sang `nhan-ban-de-nghi.ts` ngày 26/09/2026 (luật nhân bản cũng cần, mà
 * tệp đó không import ngược tệp này được). Xuất lại y nguyên để mọi chỗ gọi cũ không đổi.
 */
export { dongDaCoChungTu };

/**
 * ★★ GIAO (ô tích / nút giao) CÓ ĐƯỢC ĐỤNG TỚI CÁC DÒNG NÀY KHÔNG — soát giao việc 25–26/09/2026
 * (#1, #18, #31, #51).
 *
 * 🔴 Hai ca bị chặn:
 *   · Dòng đã có báo giá / đơn hàng (chưa huỷ). Từ 26/09 giao có thể TÁCH dòng sang phiếu con,
 *     mà chứng từ vẫn trỏ `prId` phiếu cũ → phiếu con thấy dòng "chưa lên đơn" → MUA HAI LẦN.
 *     `chuyenViecDong` / `boPhanBoDong` đã chặn đúng điều này; chỉ đường giao còn hở.
 *   · Dòng đang do NGƯỜI KHÁC phụ trách. Giao đè qua ô tích là đổi chủ mà nhật ký không ghi người
 *     cũ, người cũ không biết, yêu cầu báo giá bị đè. Đổi người phải đi đường "Chuyển việc"
 *     (có lý do, có ghi "Từ …" theo chỉ đạo 12/08).
 *
 * 📌 Giao lại cho CHÍNH người đang giữ (đổi số báo giá / ghi chú) thì vẫn cho.
 * ⚠️ KHÔNG đặt chốt này trong `apDungGiaoViec`: `chuyenViecDong` cũng đi qua hàm đó với dòng
 * đang có người (đã rút về trước). Nơi gọi là `phanBoDong`.
 */
export function vuongMacGiaoDong(
  goc: Pick<DeNghiMuaHang, "id" | "items">,
  sttGiao: readonly number[],
  uidNhan: string,
  baoGia: readonly Pick<BaoGia, "prId" | "trangThai" | "items">[],
  donHang: readonly Pick<DonDatHang, "prId" | "trangThai" | "items">[],
): string | null {
  for (const stt of sttGiao) {
    if (dongDaCoChungTu(goc.id, stt, baoGia, donHang)) {
      return `Dòng ${stt} đã có báo giá hoặc đơn hàng — không giao lại được. Huỷ chứng từ đó trước.`;
    }
    const d = goc.items.find((x) => x.stt === stt);
    if (d?.nguoiPhuTrachUid && d.nguoiPhuTrachUid !== uidNhan) {
      const ten = d.nguoiPhuTrachTen?.trim() || "người khác";
      return `Dòng ${stt} đang do ${ten} phụ trách — dùng "Chuyển việc" để giao lại.`;
    }
  }
  return null;
}

export interface ThongTinGiaoViec {
  uid: string;
  ten: string;
  nguoiGiaoTen: string;
  /** ISO — mốc nhật ký. */
  thoiDiem: string;
  /** `yyyy-mm-dd` — ngày phân bổ / ngày lập phiếu con. */
  ngay: string;
  soBaoGia?: number;
  ghiChu?: string;
  /** Câu mở đầu nhật ký — "Phân bổ" (giao mới) hay "Chuyển việc" (giao lại). */
  loaiHanhDong?: "phan_bo" | "chuyen_viec";
  lyDo?: string;
  /** Chuyển việc: GIỮ yêu cầu số báo giá + ghi chú Trưởng bộ phận đã dặn trên dòng (y như cũ). */
  giuYeuCauCu?: boolean;
  /**
   * Người nhận là người SAU CÙNG mà đã có phiếu con từ trước → GỘP phiếu con đó về phiếu gốc để mỗi
   * người chỉ một phiếu. Nơi gọi đặt `false` khi phiếu con đã có báo giá / đơn hàng (không gộp được).
   */
  gopConCu?: boolean;
  /** Loại việc của người nhận (thủ kho → `xuat_kho`, nhân sự → `nhan_su`) — bỏ qua báo giá. 26/09/2026. */
  loaiViecGiao?: LoaiViecGiao;
}

export type KetQuaGiaoViec =
  | { loi: string }
  | {
      loi?: undefined;
      deNghi: DeNghiMuaHang[];
      /** Phiếu đang giữ các dòng vừa giao — để gửi thông báo đúng phiếu. */
      idDich: string;
      tach: boolean;
    };

/**
 * ★★★ GIAO các dòng `sttGiao` của phiếu `prId` cho một người — tách phiếu nếu cần.
 *
 * Luật tách (Sếp 26/09): sau lần giao này, trên phiếu còn dòng nào (chưa giao đi) KHÔNG thuộc
 * người nhận không? CÒN → tách các dòng vừa giao sang phiếu con của người đó. KHÔNG CÒN (người
 * nhận là người sau cùng / nhận cả phiếu) → gán ngay trên phiếu, phiếu đó thuộc về họ.
 */
export function apDungGiaoViec(
  tatCa: readonly DeNghiMuaHang[],
  prId: string,
  sttGiao: readonly number[],
  g: ThongTinGiaoViec,
): KetQuaGiaoViec {
  const goc = tatCa.find((d) => d.id === prId);
  if (!goc) return { loi: "Không tìm thấy đề nghị." };
  if (!g.uid) return { loi: "Chưa chọn người nhận việc." };
  {
    const daDong = loiHoSoDaDongKhiGiaoViec(
      goc,
      g.loaiHanhDong === "chuyen_viec" ? "chuyển việc" : "giao việc",
    );
    if (daDong) return { loi: daDong };
  }

  const daChuyen = dongDaNhanBanSang(goc, tatCa as DeNghiMuaHang[]);
  const conLai = goc.items.filter((d) => !dongDaChuyenDiHet(d.stt, daChuyen));
  const giao = new Set(sttGiao.filter((s) => conLai.some((d) => d.stt === s)));
  if (giao.size === 0) return { loi: "Các dòng này đã được giao sang phiếu khác." };
  /* Giao lại y hệt cho đúng người đang giữ (cùng loại việc, cùng yêu cầu báo giá, cùng ghi chú) là
     KHÔNG đổi gì — chặn để nhật ký không ghi hai lần. Đo trên phiếu 157 (26/09/2026): "Phân bổ dòng 5
     cho Phạm Thị Trà Quế — yêu cầu 2 báo giá" ghi hai lần cách nhau 8 giây. Đổi số báo giá / ghi chú
     thì vẫn cho giao lại. */
  const trungHet = [...giao].every((s) => {
    const d = conLai.find((x) => x.stt === s);
    return (
      d !== undefined &&
      d.nguoiPhuTrachUid === g.uid &&
      d.loaiViecGiao === g.loaiViecGiao &&
      (g.giuYeuCauCu ||
        (d.soBaoGiaYeuCau === g.soBaoGia && (d.ghiChuPhanBo ?? "") === (g.ghiChu?.trim() ?? "")))
    );
  });
  if (trungHet) return { loi: `Việc này đã giao cho ${g.ten} rồi.` };

  const tach = conLai.some((d) => !giao.has(d.stt) && d.nguoiPhuTrachUid !== g.uid);
  const ganNguoi = <T extends DeNghiMuaHang["items"][number]>(d: T): T => ({
    ...d,
    nguoiPhuTrachUid: g.uid,
    nguoiPhuTrachTen: g.ten,
    nguoiPhanBoTen: g.nguoiGiaoTen,
    thoiDiemPhanBo: g.ngay,
    loaiViecGiao: g.loaiViecGiao,
    ...(g.giuYeuCauCu
      ? {}
      : {
          soBaoGiaYeuCau: g.soBaoGia,
          soBaoGiaTPGiao: g.soBaoGia,
          ghiChuPhanBo: g.ghiChu?.trim() || undefined,
        }),
  });
  const dsStt = [...giao].sort((a, b) => a - b).join(", ");
  const phanThem: string[] = [];
  if (g.soBaoGia) phanThem.push(`yêu cầu ${g.soBaoGia} báo giá`);
  /* 🔴 KHÔNG chép NỘI DUNG ghi chú vào nhật ký (soát 25–26/09, #7 #22). Ghi chú giao việc hay chứa
     tên nhà cung cấp chỉ định, mà khối Lịch sử hiện cho mọi vai trò vào được /de-nghi — kể cả NV
     Nhân sự / NV Kho tổng không có quyền xem NCC (§7 CLAUDE.md: không ghi tên NCC vào nhật ký).
     Nội dung vẫn còn ở `ghiChuPhanBo` trên dòng và ở `loiNhan` của tin gửi riêng người nhận. */
  if (g.ghiChu?.trim()) phanThem.push(g.soBaoGia === 1 ? "có lý do chỉ định 1 báo giá" : "có ghi chú giao việc");
  const duoi = phanThem.length > 0 ? ` — ${phanThem.join("; ")}` : "";
  const moDau = g.loaiHanhDong === "chuyen_viec" ? "Chuyển việc dòng" : "Phân bổ dòng";

  if (!tach) {
    /**
     * ★ GỘP PHIẾU CON CŨ CỦA NGƯỜI SAU CÙNG (26/09/2026). Ví dụ: giao dòng 2 cho B lúc dòng 3 còn
     * trống → dòng 2 tách sang phiếu con của B; rồi giao dòng 3 cho B → B là người sau cùng, giữ
     * phiếu gốc. Không gộp thì B có HAI phiếu cho cùng một đề nghị. Gộp: bỏ phiếu con, trả dòng của
     * nó về phiếu gốc và gán lại cho B.
     */
    const idConNguoiNay = idPhieuConTheoNguoi(goc.id, g.uid);
    const conTimThay = g.gopConCu === false ? undefined : tatCa.find((d) => d.id === idConNguoiNay);
    /* 🔴 CHỈ GỘP KHI GỘP KHÔNG MẤT GÌ (soát 25–26/09, #12 + phát hiện (a)). Gộp = XOÁ phiếu con, nên:
         · phiếu con đang có bản nhân bản trỏ về nó → bản đó mồ côi, dòng hết mờ ở gốc, mua hai lần;
         · phiếu con có dòng THÊM THẲNG (không `sttDongCha`) → dòng đó mất hẳn;
         · phiếu con có bình luận / tệp đính kèm → mất theo.
       Không đủ điều kiện thì GIỮ phiếu con (người đó có hai phiếu) — an toàn, không mất dữ liệu. */
    const conCuNguoiNay =
      conTimThay &&
      !tatCa.some((d) => d.deNghiChaId === conTimThay.id) &&
      conTimThay.items.every((d) => typeof d.sttDongCha === "number") &&
      !conTimThay.binhLuan?.length &&
      !Object.values(conTimThay.tepGiaiDoan ?? {}).some((ds) => Array.isArray(ds) && ds.length > 0)
        ? conTimThay
        : undefined;
    /* Dòng gộp về giữ YÊU CẦU riêng của nó trên phiếu con (số báo giá, ghi chú, loại việc) — không
       nhận yêu cầu của lần giao mới (soát #18 #21: "3 báo giá, hỏi 3 NCC" bị đè thành "1 báo giá,
       chỉ định NCC Y" = lọt chốt cạnh tranh giá). */
    const yeuCauGop = new Map<number, ReturnType<typeof yeuCauCuaDong>>();
    for (const d of conCuNguoiNay?.items ?? []) {
      if (typeof d.sttDongCha === "number") yeuCauGop.set(d.sttDongCha, yeuCauCuaDong(d));
    }
    const moi = tatCa
      .filter((d) => !(conCuNguoiNay && d.id === conCuNguoiNay.id))
      .map((d) =>
      d.id !== goc.id
        ? d
        : {
            ...d,
            items: d.items.map((x) => {
              if (giao.has(x.stt)) return ganNguoi(x);
              const yc = yeuCauGop.get(x.stt);
              return yc ? { ...ganNguoi(x), ...yc } : x;
            }),
            lichSu: [
              ...d.lichSu,
              {
                thoiDiem: g.thoiDiem,
                nguoiThucHien: g.nguoiGiaoTen,
                hanhDong:
                  `${moDau} ${dsStt} cho ${g.ten}${duoi}` +
                  (conCuNguoiNay ? ` — gộp lại phiếu ${conCuNguoiNay.code} (${g.ten} giữ phiếu gốc)` : ""),
                ghiChu: g.lyDo?.trim() || undefined,
              },
            ],
          },
    );
    return { deNghi: moi, idDich: goc.id, tach: false };
  }

  /* ── Tách sang phiếu con của người nhận ── */
  const idCon = idPhieuConTheoNguoi(goc.id, g.uid);
  const conCu = tatCa.find((d) => d.id === idCon);
  /**
   * ★ Sếp 26/09/2026 (nhân bản theo NCC): dòng ĐÃ TÁCH MỘT PHẦN khối lượng sang bản nhân bản thì
   * phiếu con chỉ nhận PHẦN CÒN LẠI, ghi rõ `khoiLuongTuCha`. Chép nguyên khối lượng dòng là bản
   * nhân bản mua 60, phiếu con mua 100 — mua trùng 60.
   * 📌 Không bao giờ kế thừa `khoiLuongTuCha`/`khoiLuongVuotCha` của dòng nguồn: hai trường đó nói về
   * quan hệ của dòng nguồn với CHA CỦA NÓ, không phải với phiếu đang tách.
   */
  const phanKhoiLuong = (d: DongDN): Partial<DongDN> => {
    const x = daChuyen.khoiLuong?.get(d.stt);
    const dong = { khoiLuongTuCha: undefined, khoiLuongVuotCha: undefined, lyDoVuotCha: undefined };
    if (x && !x.caDong && x.conLai < x.khoiLuongDong) {
      return { ...dong, khoiLuongDeNghi: x.conLai, khoiLuongTuCha: x.conLai };
    }
    return dong;
  };
  const dongGoc = goc.items.filter((d) => giao.has(d.stt)).map((d) => ({ ...d, ...phanKhoiLuong(d) }));
  let con: DeNghiMuaHang;
  if (conCu) {
    /* Giao thêm cho cùng người → nối vào ĐÚNG phiếu con cũ, bỏ dòng đã có (theo `sttDongCha`). */
    const daCo = new Set(conCu.items.map((d) => d.sttDongCha));
    let stt = conCu.items.reduce((m, d) => Math.max(m, d.stt), 0);
    const them = dongGoc
      .filter((d) => !daCo.has(d.stt))
      .map((d) => ganNguoi({ ...d, stt: ++stt, sttDongCha: d.stt }));
    con = {
      ...conCu,
      items: [...conCu.items, ...them],
      lichSu: [
        ...conCu.lichSu,
        {
          thoiDiem: g.thoiDiem,
          nguoiThucHien: g.nguoiGiaoTen,
          hanhDong: `Nhận thêm dòng ${dsStt} của ${goc.code}${duoi}`,
          ghiChu: g.lyDo?.trim() || undefined,
        },
      ],
    };
  } else {
    const gocDau = phieuGocCua(goc, tatCa as DeNghiMuaHang[]);
    const ma = maBanSaoTiepTheo(goc, tatCa as DeNghiMuaHang[]);
    const conTam: DeNghiMuaHang = {
      ...goc,
      id: idCon,
      code: ma,
      tieuDe: tenBanSaoTheoMa(gocDau.tieuDe, ma),
      deNghiGocId: gocDau.id,
      maDeNghiGoc: gocDau.code,
      deNghiChaId: goc.id,
      ngayDeNghi: g.ngay,
      ngayDuyet: g.ngay,
      trangThai: "da_duyet",
      luuTru: undefined,
      binhLuan: undefined,
      tepGiaiDoan: undefined,
      /* ★ Sếp 26/09/2026 *"không chép các tệp đã đính kèm"* — cùng luật với bản nhân bản tay
         (`dungBanNhanBan`): phiếu con không mang tài liệu đính kèm lúc lập phiếu. Chỉ bỏ tham chiếu,
         nội dung tệp vẫn thuộc phiếu gốc. */
      taiLieu: undefined,
      taiLieuAppRequest: undefined,
      lyDoThieuChungTu: undefined,
      lyDoThatBai: undefined,
      items: dongGoc.map((d, k) => ganNguoi({ ...d, stt: k + 1, sttDongCha: d.stt })),
      lichSu: [
        {
          thoiDiem: g.thoiDiem,
          nguoiThucHien: g.nguoiGiaoTen,
          hanhDong: `Tách từ ${goc.code} khi giao việc cho ${g.ten}`,
          ghiChu: `Nhận dòng ${dsStt} (${dongGoc.length}/${goc.items.length} mặt hàng)${duoi}.`,
        },
      ],
      mocVaoBuoc: undefined,
    };
    /* ★ Mốc vào bước của phiếu con MỚI = lúc giao (soát #14). Trước đây `...goc` mang theo mốc của
       phiếu gốc (vd vào ② từ 20/09) → phiếu con vừa sinh đã báo "Trễ 5 ngày". Mảng chứng từ rỗng là
       CHÍNH XÁC: id mới chưa có báo giá / PO nào. Phiếu con cũ (nhánh trên) giữ nguyên mốc. */
    con = { ...conTam, mocVaoBuoc: { buoc: xacDinhGiaiDoan(conTam, [], [], []), thoiDiem: g.thoiDiem } };
  }

  const moi: DeNghiMuaHang[] = tatCa
    .filter((d) => d.id !== idCon)
    .map((d) =>
      d.id !== goc.id
        ? d
        : {
            ...d,
            /* Dòng giao đi: XOÁ người phụ trách trên phiếu gốc — để người nhận không thấy phiếu gốc
               là "việc của tôi". Dòng tự làm mờ vì phiếu con trỏ về nó (`sttDongCha`).
               🔴 Xoá cả 4 trường YÊU CẦU (soát #21 #34): `soBaoGiaCanCo` / `sanSoBaoGiaTPGiao` đọc
               MỌI dòng kể cả dòng mờ — để lại là phiếu gốc bị đòi số báo giá của người khác. */
            items: d.items.map((x) =>
              giao.has(x.stt)
                ? {
                    ...x,
                    nguoiPhuTrachUid: undefined,
                    nguoiPhuTrachTen: undefined,
                    nguoiPhanBoTen: undefined,
                    thoiDiemPhanBo: undefined,
                    ...YEU_CAU_TRONG,
                  }
                : x,
            ),
            lichSu: [
              ...d.lichSu,
              {
                thoiDiem: g.thoiDiem,
                nguoiThucHien: g.nguoiGiaoTen,
                hanhDong: `${moDau} ${dsStt} cho ${g.ten} — tách sang phiếu ${con.code}`,
                ghiChu: g.lyDo?.trim() || undefined,
              },
            ],
          },
    );
  moi.push(con);
  return { deNghi: moi, idDich: con.id, tach: true };
}

/**
 * ★ RÚT dòng khỏi một phiếu con sinh lúc giao việc — trả dòng về phiếu gốc (hết mờ, chưa ai phụ
 * trách). Phiếu con hết dòng thì bỏ luôn. Dùng cho "bỏ phân bổ" và bước đầu của "chuyển việc".
 *
 * 🔴 Nơi gọi PHẢI kiểm `dongDaCoChungTu` trước. Phiếu con còn chứng từ thì không bỏ được — hàm này
 * chỉ bỏ phiếu con khi nó HẾT dòng, mà dòng có chứng từ thì đã bị chặn từ trước.
 */
export function apDungRutDong(
  tatCa: readonly DeNghiMuaHang[],
  idCon: string,
  sttRut: readonly number[],
  nguoiThucHien: string,
  thoiDiem: string,
  hanhDongCha: string,
  /**
   * Soát giao việc 25–26/09/2026 (#18 #21 #34 #44):
   *   · `mangYeuCauVe: true` (chuyển việc) — chép 4 trường yêu cầu (số báo giá, mốc TP, ghi chú,
   *     loại việc) từ dòng phiếu con về dòng cha, để lần giao tiếp theo với `giuYeuCauCu` GIỮ đúng
   *     điều Trưởng bộ phận đã dặn (chỉ đạo 12/08). Trước đây mất sạch: con A {3, "hỏi 3 NCC"} → con C {}.
   *   · `false` / bỏ trống (bỏ phân bổ) — xoá 4 trường đó trên dòng cha.
   *   · `tenNguoiCu` — ghi vào nhật ký phiếu gốc "… của {tên}".
   */
  tuyChon?: { mangYeuCauVe?: boolean; tenNguoiCu?: string },
): { loi: string } | { loi?: undefined; deNghi: DeNghiMuaHang[]; chaId: string; sttCha: number[] } {
  const con = tatCa.find((d) => d.id === idCon);
  if (!con || !laPhieuConKhiGiao(con)) return { loi: "Không phải phiếu tách khi giao việc." };
  const cha = tatCa.find((d) => d.id === con.deNghiChaId);
  if (!cha) return { loi: "Không tìm thấy phiếu gốc của phiếu này." };
  {
    const viec = tuyChon?.mangYeuCauVe ? "chuyển việc" : "bỏ phân bổ";
    const daDong = loiHoSoDaDongKhiGiaoViec(cha, viec) ?? loiHoSoDaDongKhiGiaoViec(con, viec);
    if (daDong) return { loi: daDong };
  }
  const rut = new Set(sttRut);
  const dongRut = con.items.filter((d) => rut.has(d.stt) && typeof d.sttDongCha === "number");
  const sttCha = dongRut.map((d) => d.sttDongCha as number);
  if (sttCha.length === 0) return { loi: "Không có dòng nào để rút." };
  /**
   * ★ Sếp 26/09/2026 (nhân bản theo NCC, mục (4)): dòng của phiếu con đã được NHÂN BẢN TIẾP (toàn bộ
   * hay một phần) sang bản cháu thì KHÔNG rút về được. Rút về là dòng hết mờ ở phiếu gốc, trong khi
   * bản cháu vẫn đang mua phần của nó → MUA TRÙNG, và bản cháu mất cha (mồ côi).
   */
  {
    const daNhanBanTiep = dongDaNhanBanSang(con, tatCa as DeNghiMuaHang[]);
    const vuong = dongRut.find((d) => (daNhanBanTiep.get(d.stt)?.length ?? 0) > 0);
    if (vuong) {
      return {
        loi: `Dòng ${vuong.stt} của ${con.code} đã nhân bản sang ${(daNhanBanTiep.get(vuong.stt) ?? []).join(", ")} — xử lý (xoá / đóng) bản đó trước rồi mới rút được.`,
      };
    }
  }
  const conLai = con.items.filter((d) => !rut.has(d.stt));
  /* 🔴 Rút hết dòng = BỎ phiếu con. Còn bản nhân bản trỏ về nó thì bỏ là làm bản đó mồ côi (dòng
     hết mờ ở gốc, mua hai lần) — soát #12. Tệp / bình luận không chặn ở đây: hộp xác nhận nói trước. */
  if (conLai.length === 0 && tatCa.some((d) => d.deNghiChaId === con.id)) {
    return {
      loi: `Phiếu ${con.code} đang có bản con — bỏ hết dòng sẽ làm bản con mồ côi. Xử lý bản con trước.`,
    };
  }
  const yeuCauVe = new Map(dongRut.map((d) => [d.sttDongCha as number, yeuCauCuaDong(d)]));
  const cuaAi = tuyChon?.tenNguoiCu?.trim() ? ` của ${tuyChon.tenNguoiCu.trim()}` : "";
  const moi = tatCa
    .filter((d) => !(d.id === con.id && conLai.length === 0))
    .map((d) => {
      if (d.id === con.id) {
        return {
          ...d,
          items: conLai,
          lichSu: [
            ...d.lichSu,
            { thoiDiem, nguoiThucHien, hanhDong: `Trả dòng ${[...rut].join(", ")} về ${cha.code}` },
          ],
        };
      }
      if (d.id === cha.id) {
        return {
          ...d,
          items: d.items.map((x) => {
            const yc = yeuCauVe.get(x.stt);
            if (!yc) return x;
            return { ...x, ...(tuyChon?.mangYeuCauVe ? yc : YEU_CAU_TRONG) };
          }),
          lichSu: [
            ...d.lichSu,
            {
              thoiDiem,
              nguoiThucHien,
              hanhDong: `${hanhDongCha} dòng ${sttCha.join(", ")}${cuaAi} (lấy lại từ ${con.code}${conLai.length === 0 ? ", phiếu đó đã bỏ" : ""})`,
            },
          ],
        };
      }
      return d;
    });
  return { deNghi: moi, chaId: cha.id, sttCha };
}

/**
 * ★★ CHIA KHỐI LƯỢNG MỘT DÒNG trước khi giao — Sếp 26/09/2026: *"đề nghị có 10 tấn thép. A sẽ giao
 * cho 2 người 1 người lấy từ kho 5 tấn, còn 5 tấn giao cho người khác đặt mua. lưu ý phải liên kết
 * cha con được"*.
 *
 * Dòng `stt` GIỮ phần `khoiLuongGiao` (để giao ngay sau đó), phần còn lại thành dòng MỚI nối tiếp
 * cuối phiếu (không đánh số lại dòng nào) mang `sttChiaTu` = dòng đề nghị ban đầu. Tổng khối lượng
 * không đổi, nên tiến độ / báo giá / PO tính theo dòng vẫn đúng mà không phải sửa phép tính nào.
 *
 * 🔴 Nơi gọi PHẢI chặn dòng đã có báo giá / đơn hàng (`dongDaCoChungTu`) — chứng từ đang trỏ theo
 * khối lượng cũ của dòng.
 */
export function apDungChiaKhoiLuong(
  tatCa: readonly DeNghiMuaHang[],
  prId: string,
  stt: number,
  khoiLuongGiao: number,
  nguoiThucHien: string,
  thoiDiem: string,
): { loi: string } | { loi?: undefined; deNghi: DeNghiMuaHang[]; sttMoi: number | null } {
  const dn = tatCa.find((d) => d.id === prId);
  if (!dn) return { loi: "Không tìm thấy đề nghị." };
  const dong = dn.items.find((d) => d.stt === stt);
  if (!dong) return { loi: "Không tìm thấy dòng cần chia." };
  const tong = Number(dong.khoiLuongDeNghi) || 0;
  if (!(khoiLuongGiao > 0)) return { loi: "Khối lượng giao phải lớn hơn 0." };
  /**
   * ★ Sếp 26/09/2026 (nhân bản theo NCC): dòng ĐÃ TÁCH MỘT PHẦN sang bản nhân bản thì bản đó đang
   * trỏ vào dòng này theo khối lượng (`khoiLuongTuCha`). Chia dòng làm hai là phần đã tách bị tính
   * lệch sang một nửa, nửa kia hiện lại đủ khối lượng → mua trùng. Nên: giao cả phần còn lại thì
   * cho (không chia gì), giao ít hơn thì chặn.
   */
  {
    const x = khoiLuongDaTachTheoDong(dn, tatCa).get(stt);
    if (x) {
      if (khoiLuongGiao >= x.conLai) return { deNghi: [...tatCa], sttMoi: null };
      return {
        loi: `Dòng ${stt} đã tách một phần sang bản nhân bản (còn ${x.conLai} ${dong.donViTinh}) — không chia khối lượng thêm được. Giao cả phần còn lại, hoặc nhân bản tiếp phần muốn tách.`,
      };
    }
  }
  if (khoiLuongGiao > tong) return { loi: `Khối lượng giao vượt khối lượng của dòng (${tong}).` };
  /* Giao đủ cả dòng → không chia gì. */
  if (khoiLuongGiao === tong) return { deNghi: [...tatCa], sttMoi: null };
  const sttMoi = dn.items.reduce((m, d) => Math.max(m, d.stt), 0) + 1;
  const goc = dong.sttChiaTu ?? dong.stt;
  /* Làm tròn 3 chữ số lẻ — khối lượng có thể lẻ (2,5 tấn), tránh 4.999999 do cộng trừ số thực. */
  const conLai = Math.round((tong - khoiLuongGiao) * 1000) / 1000;
  /**
   * ★ Dòng này là dòng của BẢN NHÂN BẢN có ghi khối lượng lấy từ cha / mua thêm (26/09/2026) → chia
   * luôn hai con số đó cho hai nửa. Chép nguyên sang cả hai nửa là phiếu cha bị trừ HAI LẦN.
   * Phần lấy từ cha xếp vào nửa giao trước, phần mua thêm xếp sau.
   */
  const tuCha = typeof dong.khoiLuongTuCha === "number" ? dong.khoiLuongTuCha : undefined;
  const vuot = Math.max(0, Number(dong.khoiLuongVuotCha) || 0);
  const tuCha1 = tuCha === undefined ? undefined : Math.min(tuCha, khoiLuongGiao);
  const tuCha2 = tuCha === undefined ? undefined : lamTronKhoiLuong(tuCha - (tuCha1 ?? 0));
  const vuot1 = Math.min(vuot, Math.max(0, lamTronKhoiLuong(khoiLuongGiao - (tuCha1 ?? 0))));
  const vuot2 = lamTronKhoiLuong(vuot - vuot1);
  const truongChia = (tc: number | undefined, v: number) =>
    tuCha === undefined && vuot === 0
      ? {}
      : { khoiLuongTuCha: tc, khoiLuongVuotCha: v > 0 ? v : undefined, lyDoVuotCha: v > 0 ? dong.lyDoVuotCha : undefined };
  const moi = tatCa.map((d) =>
    d.id !== prId
      ? d
      : {
          ...d,
          items: [
            ...d.items.map((x) =>
              x.stt === stt
                ? { ...x, khoiLuongDeNghi: khoiLuongGiao, sttChiaTu: goc, ...truongChia(tuCha1, vuot1) }
                : x,
            ),
            {
              ...dong,
              stt: sttMoi,
              khoiLuongDeNghi: conLai,
              sttChiaTu: goc,
              ...truongChia(tuCha2, vuot2),
              nguoiPhuTrachUid: undefined,
              nguoiPhuTrachTen: undefined,
              nguoiPhanBoTen: undefined,
              thoiDiemPhanBo: undefined,
              soBaoGiaYeuCau: undefined,
              soBaoGiaTPGiao: undefined,
              ghiChuPhanBo: undefined,
              loaiViecGiao: undefined,
            },
          ],
          lichSu: [
            ...d.lichSu,
            {
              thoiDiem,
              nguoiThucHien,
              hanhDong: `Chia dòng ${stt} (${tong} ${dong.donViTinh}) thành ${khoiLuongGiao} + ${conLai} ${dong.donViTinh} — phần còn lại thành dòng ${sttMoi}`,
            },
          ],
        },
  );
  return { deNghi: moi, sttMoi };
}

/**
 * ★★ GỘP CÁC BẢN TÁCH VỀ PHIẾU GỐC khi kéo hồ sơ về bước ① (`luiVeBuoc`) — trả danh sách dòng mới
 * của phiếu gốc (đánh số lại từ 1, sạch phân bổ). Chuyển từ `kho-du-lieu.tsx` sang đây để bộ kiểm
 * luật gọi thật được — soát giao việc 25–26/09/2026 (#8).
 *
 * 🔴 LỖI ĐÃ VÁ: phiếu con 26/09 (`laPhieuConKhiGiao`) chép dòng kèm `sttDongCha` và KHÔNG có
 * `sttDongGoc`, trong khi phiếu gốc VẪN GIỮ nguyên mọi dòng. Phép khử trùng cũ chỉ nhìn
 * `sttDongGoc` → kéo về ① là NHÂN ĐÔI dòng (3 dòng + 1 dòng phiếu con = 4). Nay với phiếu con khi
 * giao: chỉ lấy dòng KHÔNG có `sttDongCha` (dòng thêm thẳng trên phiếu con); dòng có `sttDongCha`
 * là bản sao của dòng mà phiếu phía trên vẫn đang giữ (kể cả khi đã chia khối lượng ở phiếu con,
 * phiếu gốc vẫn giữ đủ khối lượng).
 *
 * 📌 Các bản khác giữ luật cũ: bản tách tự động cũ (cắt dòng, không `sttDongGoc`) gộp nguyên; bản
 * nhân bản tay có `sttDongGoc` thì bỏ dòng mà phiếu gốc còn giữ. Lọc bản nhân bản tay CŨ (không có
 * `sttDongGoc`) là việc của nơi gọi, trước khi truyền `banTach`.
 */
/**
 * ★★ CHẶN GỘP VỀ BƯỚC ① KHI GỘP SẼ LÀM MẤT LIÊN KẾT / MẤT KHỐI LƯỢNG — Sếp 26/09/2026 (nhân bản
 * theo NCC, mục (4)). Trả câu chặn, `null` = gộp được.
 *
 *   · Còn phiếu KHÔNG được gộp (vd bản nhân bản tay cũ không có `sttDongGoc`) mà cha trực tiếp của
 *     nó nằm trong nhóm sắp bị xoá → phiếu đó mồ côi: dòng ở gốc hết mờ trong khi nó vẫn mua → MUA
 *     TRÙNG. Đây đúng là ca phiếu cháu (nhân bản từ phiếu con giao việc) trước ngày 26/09.
 *   · Có bản đang MUA VƯỢT đề nghị (`khoiLuongVuotCha`) → gộp về là phần vượt (đã họp chốt, có lý do)
 *     biến mất không dấu vết, vì phiếu gốc chỉ giữ khối lượng đề nghị ban đầu.
 */
export function vuongMacGopVeBuoc1(
  idGoc: string,
  banTach: readonly Pick<DeNghiMuaHang, "id" | "code" | "items">[],
  tatCa: readonly Pick<DeNghiMuaHang, "id" | "code" | "deNghiChaId">[],
): string | null {
  const idGop = new Set(banTach.map((d) => d.id));
  const moCoi = tatCa.filter(
    (d) => d.id !== idGoc && !idGop.has(d.id) && d.deNghiChaId !== undefined && idGop.has(d.deNghiChaId),
  );
  if (moCoi.length > 0) {
    return `Không kéo về bước tiếp nhận được: ${moCoi.map((d) => d.code).join(", ")} là bản nhân bản của một phiếu sắp được gộp — gộp sẽ làm bản đó mất liên kết và mua trùng. Xử lý (xoá / đóng) bản đó trước.`;
  }
  const vuot = banTach.filter((d) => d.items.some((x) => (Number(x.khoiLuongVuotCha) || 0) > 0));
  if (vuot.length > 0) {
    return `Không kéo về bước tiếp nhận được: ${vuot.map((d) => d.code).join(", ")} đang mua vượt đề nghị (đã ghi lý do) — gộp về phiếu gốc sẽ mất phần vượt đó. Xử lý bản đó trước.`;
  }
  return null;
}

export function gopBanTachVeGoc(
  goc: Pick<DeNghiMuaHang, "items">,
  banTach: readonly Pick<DeNghiMuaHang, "id" | "code" | "deNghiChaId" | "items">[],
): DeNghiMuaHang["items"] {
  const sttGocConGiu = new Set(goc.items.map((d) => d.stt));
  return [
    ...goc.items,
    ...[...banTach]
      .sort((a, b) => a.code.localeCompare(b.code, "vi"))
      .flatMap((d) =>
        laPhieuConKhiGiao(d)
          ? d.items.filter((x) => typeof x.sttDongCha !== "number")
          : d.items.filter((x) => typeof x.sttDongGoc !== "number" || !sttGocConGiu.has(x.sttDongGoc)),
      ),
  ].map((d, i) => ({
    ...d,
    stt: i + 1,
    nguoiPhuTrachUid: undefined,
    nguoiPhuTrachTen: undefined,
    nguoiPhanBoTen: undefined,
    thoiDiemPhanBo: undefined,
    /* Xoá cả mốc sàn cùng lúc — Sếp 16/09/2026 (xem `soBaoGiaTPGiao` ở `kieu-du-lieu.ts`). */
    ...YEU_CAU_TRONG,
    /* Dòng thêm thẳng trên phiếu con mang `sttDongCha`/`sttDongGoc` không còn nghĩa sau khi gộp. */
    sttDongCha: undefined,
  }));
}
