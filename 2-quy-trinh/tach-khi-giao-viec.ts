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
  dongDaNhanBanSang,
  maBanSaoTiepTheo,
  phieuGocCua,
  tenBanSaoTheoMa,
} from "@/2-quy-trinh/nhan-ban-de-nghi";

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
 * ★ Dòng này đã có báo giá hoặc đơn hàng (chưa huỷ) trỏ tới chưa.
 *
 * 🔴 Dòng đã có chứng từ thì KHÔNG được chuyển việc / bỏ phân bổ: báo giá và PO trỏ về
 * `prId` + `sttDongDeNghi` của phiếu đang giữ nó; rút dòng đi là PO đã lập bị bỏ khỏi tiến độ còn
 * phiếu mới lại thấy dòng "chưa lên đơn" → mua hai lần (phản biện 26/09).
 */
export function dongDaCoChungTu(
  dnId: string,
  stt: number,
  baoGia: readonly Pick<BaoGia, "prId" | "trangThai" | "items">[],
  donHang: readonly Pick<DonDatHang, "prId" | "trangThai" | "items">[],
): boolean {
  const coBaoGia = baoGia.some(
    (bg) => bg.prId === dnId && bg.trangThai !== "huy" && bg.items.some((d) => d.sttDongDeNghi === stt),
  );
  if (coBaoGia) return true;
  return donHang.some(
    (po) => po.prId === dnId && po.trangThai !== "huy" && po.items.some((d) => d.sttDongDeNghi === stt),
  );
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
  if (g.ghiChu?.trim()) phanThem.push(`ghi chú: ${g.ghiChu.trim()}`);
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
    const conCuNguoiNay = g.gopConCu === false ? undefined : tatCa.find((d) => d.id === idConNguoiNay);
    const sttGop = new Set(
      (conCuNguoiNay?.items ?? [])
        .map((d) => d.sttDongCha)
        .filter((x): x is number => typeof x === "number"),
    );
    const moi = tatCa
      .filter((d) => !(conCuNguoiNay && d.id === conCuNguoiNay.id))
      .map((d) =>
      d.id !== goc.id
        ? d
        : {
            ...d,
            items: d.items.map((x) => (giao.has(x.stt) || sttGop.has(x.stt) ? ganNguoi(x) : x)),
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
  const dongGoc = goc.items.filter((d) => giao.has(d.stt));
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
    con = {
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
    };
  }

  const moi: DeNghiMuaHang[] = tatCa
    .filter((d) => d.id !== idCon)
    .map((d) =>
      d.id !== goc.id
        ? d
        : {
            ...d,
            /* Dòng giao đi: XOÁ người phụ trách trên phiếu gốc — để người nhận không thấy phiếu gốc
               là "việc của tôi". Dòng tự làm mờ vì phiếu con trỏ về nó (`sttDongCha`). */
            items: d.items.map((x) =>
              giao.has(x.stt)
                ? {
                    ...x,
                    nguoiPhuTrachUid: undefined,
                    nguoiPhuTrachTen: undefined,
                    nguoiPhanBoTen: undefined,
                    thoiDiemPhanBo: undefined,
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
): { loi: string } | { loi?: undefined; deNghi: DeNghiMuaHang[]; chaId: string; sttCha: number[] } {
  const con = tatCa.find((d) => d.id === idCon);
  if (!con || !laPhieuConKhiGiao(con)) return { loi: "Không phải phiếu tách khi giao việc." };
  const cha = tatCa.find((d) => d.id === con.deNghiChaId);
  if (!cha) return { loi: "Không tìm thấy phiếu gốc của phiếu này." };
  const rut = new Set(sttRut);
  const sttCha = con.items
    .filter((d) => rut.has(d.stt) && typeof d.sttDongCha === "number")
    .map((d) => d.sttDongCha as number);
  if (sttCha.length === 0) return { loi: "Không có dòng nào để rút." };
  const conLai = con.items.filter((d) => !rut.has(d.stt));
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
          lichSu: [
            ...d.lichSu,
            {
              thoiDiem,
              nguoiThucHien,
              hanhDong: `${hanhDongCha} dòng ${sttCha.join(", ")} (lấy lại từ ${con.code}${conLai.length === 0 ? ", phiếu đó đã bỏ" : ""})`,
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
  if (khoiLuongGiao > tong) return { loi: `Khối lượng giao vượt khối lượng của dòng (${tong}).` };
  /* Giao đủ cả dòng → không chia gì. */
  if (khoiLuongGiao === tong) return { deNghi: [...tatCa], sttMoi: null };
  const sttMoi = dn.items.reduce((m, d) => Math.max(m, d.stt), 0) + 1;
  const goc = dong.sttChiaTu ?? dong.stt;
  /* Làm tròn 3 chữ số lẻ — khối lượng có thể lẻ (2,5 tấn), tránh 4.999999 do cộng trừ số thực. */
  const conLai = Math.round((tong - khoiLuongGiao) * 1000) / 1000;
  const moi = tatCa.map((d) =>
    d.id !== prId
      ? d
      : {
          ...d,
          items: [
            ...d.items.map((x) => (x.stt === stt ? { ...x, khoiLuongDeNghi: khoiLuongGiao, sttChiaTu: goc } : x)),
            {
              ...dong,
              stt: sttMoi,
              khoiLuongDeNghi: conLai,
              sttChiaTu: goc,
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
