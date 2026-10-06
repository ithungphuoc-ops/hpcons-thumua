import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getThuMuaDb, verifyClientIdToken } from "@/5-ket-noi/hpcore-may-chu";
import { docMauChucDanh, type ThayDoiMau } from "@/4-phan-quyen/mau-chuc-danh";
import {
  coQuyenPhanQuyen,
  HANH_DONG_NHAT_KY,
  tinhCuuMauHong,
  tinhLuuMauChucDanh,
  tinhVeMacDinhMauToanBo,
  type KetQuaLuuMau,
} from "@/4-phan-quyen/tinh-luu-phan-quyen";
import { TEN_COLLECTION_NHAT_KY } from "@/3-du-lieu/nhat-ky-he-thong";
import {
  banGhiTuAnh,
  laOwner,
  laQuanTriKhongCanMau,
  layIdToken,
  nguoiDungTuAnh,
  nguoiGoiTuAnh,
  refHoSo,
  refMau,
  refRieng,
} from "@/5-ket-noi/phan-quyen-may-chu";

// ============================================================
// CỬA SỬA MẪU QUYỀN THEO CHỨC DANH — Sếp 06/10/2026 (Câu 1 = A · Câu 2 = B)
//
// `POST /api/quyen-mau-chuc-danh` (KHÔNG có GET — mẫu đọc qua `GET /api/quyen-rieng?tatCa=1`):
//   · `{ phienBan: number, thayDoi: ThayDoiMau }`       — sửa ô của bảng mẫu (`null` = về mặc định gốc)
//   · `{ veMacDinhToanBo: true, phienBan?: number }`   — đưa CẢ bảng mẫu về mặc định gốc (chỉ Quản trị)
// Thành công: 200 `{ ok: true, phienBan, soODoi, canhBao }`. Lỗi: 400 · 401 · 403 · 409 `maLoi:"mau-doi"` ·
// 500 `maLoi:"mau-hong"` (đặc tả 2.5).
//
// 📌 ROUTE CỦA PHIÊN NGHIỆP VỤ. Chỉ GỌI hàm export của `hpcore-may-chu.ts` (vùng của phiên tích hợp —
// CLAUDE.md §6.6), không sửa. Phần đọc vé / hồ sơ / bản ghi / mẫu dùng chung ở
// `5-ket-noi/phan-quyen-may-chu.ts`.
//
// 🔴 KHÔNG VIẾT LUẬT Ở ĐÂY: ai sửa được ô nào (Câu 2 = B), ô khoá, chống leo quyền, `phienBan`, câu nhật
// ký — đều do hàm thuần `tinhLuuMauChucDanh` / `tinhVeMacDinhMauToanBo` / `tinhCuuMauHong` quyết định
// (kho demo gọi y hệt). Route chỉ đọc, trao dữ liệu, rồi ghi đúng kết quả.
//
// 🔴 TẤT CẢ TRONG MỘT GIAO DỊCH: đọc lại hồ sơ + bản riêng người gọi + mẫu, tính, ghi mẫu, ghi MỘT dòng
// Nhật ký hệ thống (`tx.create`, tiền lệ `app/api/app-request/de-nghi-da-xoa/route.ts`). Hai người lưu
// cùng lúc thì Firestore chạy lại lượt sau trên mẫu mới → phép so `phienBan` trả 409 cho người sau.
//
// 🔴 MẪU HỎNG (bổ sung đặc tả C-F2): không dựng được người gọi qua mẫu (mẫu không đọc được), nên rẽ
// nhánh "mẫu hỏng + veMacDinhToanBo + Quản trị" TRƯỚC khi dựng người gọi, xác định Quản trị CHỈ bằng
// hồ sơ / owner (`laQuanTriKhongCanMau`). Mọi trường hợp khác với mẫu hỏng → 500 `mau-hong`.
// ============================================================

/** Chạy ở Singapore cạnh Firestore — lý do và kết quả đo xem `app/api/quyen-rieng/route.ts`. */
export const preferredRegion = "sin1";

/** Yêu cầu đã qua kiểm khuôn thân. */
type YeuCauMau =
  | { loai: "thay-doi"; phienBan: number; thayDoi: ThayDoiMau }
  | { loai: "ve-mac-dinh"; phienBan: number | null };

/** Kết quả giao dịch: lỗi của hàm thuần, mẫu hỏng, hoặc thành công. */
type KetQuaGiaoDich =
  | Extract<KetQuaLuuMau, { ok: false }>
  | { ok: false; status: 403; error: string }
  | { ok: false; status: 500; error: string; maLoi: "mau-hong" }
  | { ok: true; phienBan: number; soODoi: number; canhBao: string[] };

const LOI_CHUA_CAP_QUYEN = "Bạn chưa được cấp quyền ở app Thu mua.";
const cauMauHong = (lyDo: string) =>
  `Bảng mẫu quyền theo chức danh đang hỏng — chỉ Quản trị đưa được cả bảng về mặc định gốc để khôi phục. (${lyDo})`;

export async function POST(req: NextRequest) {
  /* Kiểm vé TRƯỚC khi đọc thân yêu cầu — `kiem-route` gửi `{}` và phải nhận 401 kèm JSON. */
  const caller = await verifyClientIdToken(layIdToken(req));
  if (!caller) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  // ---------- Kiểm KHUÔN thân yêu cầu (chỉ khuôn — luật nằm ở hàm thuần) ----------
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Thân yêu cầu không phải JSON object." }, { status: 400 });
  }
  const coVeMacDinh = body.veMacDinhToanBo !== undefined;
  const coThayDoi = body.thayDoi !== undefined;
  if (coVeMacDinh === coThayDoi) {
    return NextResponse.json(
      { error: "Phải có đúng một trong hai trường: thayDoi (sửa ô) hoặc veMacDinhToanBo (về mặc định gốc)." },
      { status: 400 },
    );
  }
  if (coVeMacDinh && body.veMacDinhToanBo !== true) {
    return NextResponse.json({ error: "veMacDinhToanBo chỉ nhận giá trị true." }, { status: 400 });
  }
  const pbTho = body.phienBan;
  if (pbTho !== undefined && (typeof pbTho !== "number" || !Number.isInteger(pbTho) || pbTho < 0)) {
    return NextResponse.json({ error: "phienBan phải là số nguyên ≥ 0." }, { status: 400 });
  }
  let yeuCau: YeuCauMau;
  if (coVeMacDinh) {
    /* `phienBan` tuỳ chọn: khi mẫu đang hỏng trang không có bản nào để gửi. Mẫu đọc được thì bắt buộc
       khớp (xử ở trong giao dịch). */
    yeuCau = { loai: "ve-mac-dinh", phienBan: typeof pbTho === "number" ? pbTho : null };
  } else {
    if (typeof pbTho !== "number") {
      return NextResponse.json({ error: "Thiếu phienBan của bảng mẫu đang mở." }, { status: 400 });
    }
    yeuCau = { loai: "thay-doi", phienBan: pbTho, thayDoi: body.thayDoi as ThayDoiMau };
  }

  try {
    const db = getThuMuaDb();
    const uid = caller.uid;
    /* Vai trò toàn cục App Tổng ở PROJECT KHÁC — không vào được giao dịch, đọc trước (đã cache 30s). */
    const owner = await laOwner(uid);

    // ---------- ① Kiểm sớm, ngoài giao dịch: hồ sơ + quyền phân quyền (hoặc đường cứu mẫu hỏng) ----------
    const [anhHoSo, anhRieng, anhMau] = await db.getAll(refHoSo(uid), refRieng(uid), refMau());
    const hs = nguoiDungTuAnh(uid, owner, anhHoSo);
    if (!hs || !hs.dangLamViec) {
      return NextResponse.json({ error: LOI_CHUA_CAP_QUYEN }, { status: 403 });
    }
    const docTruoc = docMauChucDanh(anhMau.exists ? anhMau.data() : undefined, [banGhiTuAnh(uid, anhRieng)]);
    if ("loi" in docTruoc) {
      /* C-F2: mẫu hỏng → chỉ còn đường cứu của Quản trị, xác định KHÔNG QUA MẪU. */
      if (yeuCau.loai !== "ve-mac-dinh" || !laQuanTriKhongCanMau(hs, owner)) {
        return NextResponse.json({ error: cauMauHong(docTruoc.loi), maLoi: "mau-hong" }, { status: 500 });
      }
    } else {
      const goi = nguoiGoiTuAnh(uid, owner, anhHoSo, anhRieng, docTruoc.mau);
      if (!goi || !coQuyenPhanQuyen(goi.nguoiDung)) {
        return NextResponse.json({ error: "Bạn không có quyền phân quyền người dùng." }, { status: 403 });
      }
    }

    // ---------- ② Đọc lại + tính + ghi mẫu + nhật ký trong MỘT giao dịch ----------
    const kq = await db.runTransaction(async (tx): Promise<KetQuaGiaoDich> => {
      const [aHoSo, aRieng, aMau] = await tx.getAll(refHoSo(uid), refRieng(uid), refMau());
      const hsTx = nguoiDungTuAnh(uid, owner, aHoSo);
      if (!hsTx || !hsTx.dangLamViec) return { ok: false, status: 403, error: LOI_CHUA_CAP_QUYEN };
      const rawMau = aMau.exists ? aMau.data() : undefined;
      /* Đọc mẫu qua `docMauChucDanh` (không gọi thẳng `chuanHoaMauChucDanh`) — bổ sung đặc tả B-F8:
         mẫu vắng mà bản ghi của người gọi mang `phienBanMau ≥ 1` → hỏng, không phải mẫu trống. */
      const docMau = docMauChucDanh(rawMau, [banGhiTuAnh(uid, aRieng)]);
      const luc = new Date().toISOString();

      let tinh: KetQuaLuuMau;
      let hanhDong: string;
      if ("loi" in docMau) {
        /* 🔴 C-F2: rẽ nhánh TRƯỚC khi dựng người gọi — xác định Quản trị CHỈ bằng hồ sơ / owner. */
        const laQT = laQuanTriKhongCanMau(hsTx, owner);
        if (yeuCau.loai !== "ve-mac-dinh" || !laQT) {
          return { ok: false, status: 500, error: cauMauHong(docMau.loi), maLoi: "mau-hong" };
        }
        /* Bỏ qua kiểm `phienBan` (không đọc được bản đang cất); `phienBan` mới CHỈ TĂNG (B-F9). */
        tinh = tinhCuuMauHong({
          laQuanTri: laQT,
          rawMau,
          lyDoHong: docMau.loi,
          luc,
          capNhatBoi: uid,
          capNhatBoiTen: hsTx.nguoiDung.tenHienThi,
        });
        hanhDong = HANH_DONG_NHAT_KY.veMacDinh;
      } else {
        /* Mẫu đọc được → người gọi dựng QUA MẪU (C-F1): "cờ mình có" của Câu 2 = B là cờ hiệu lực. */
        const nguoiGoi = nguoiGoiTuAnh(uid, owner, aHoSo, aRieng, docMau.mau);
        if (!nguoiGoi) return { ok: false, status: 403, error: LOI_CHUA_CAP_QUYEN };
        if (yeuCau.loai === "ve-mac-dinh") {
          if (yeuCau.phienBan === null) {
            /* Trang bấm "về mặc định" khi đang thấy mẫu hỏng, nay mẫu đã đọc được (có người vừa cứu /
               sửa) → trang cũ, không được ghi đè. */
            return {
              ok: false,
              status: 409,
              maLoi: "mau-doi",
              error: `Bảng mẫu đã đọc được lại (bản ${docMau.mau.phienBan}). Tải lại trang rồi làm lại.`,
            };
          }
          tinh = tinhVeMacDinhMauToanBo({
            nguoiGoi,
            mauCu: docMau.mau,
            phienBanGui: yeuCau.phienBan,
            luc,
            capNhatBoi: uid,
            capNhatBoiTen: nguoiGoi.nguoiDung.tenHienThi,
          });
          hanhDong = HANH_DONG_NHAT_KY.veMacDinh;
        } else {
          tinh = tinhLuuMauChucDanh({
            nguoiGoi,
            mauCu: docMau.mau,
            phienBanGui: yeuCau.phienBan,
            thayDoi: yeuCau.thayDoi,
            luc,
            capNhatBoi: uid,
            capNhatBoiTen: nguoiGoi.nguoiDung.tenHienThi,
          });
          hanhDong = HANH_DONG_NHAT_KY.mau;
        }
      }
      if (!tinh.ok) return tinh;

      /* Ghi NGUYÊN mẫu hàm thuần trả về (thay cả tài liệu — bỏ sạch trường hỏng ở đường cứu). */
      tx.set(refMau(), tinh.mauMoi);
      /* MỘT dòng nhật ký mỗi lần lưu, trong cùng giao dịch. `nguoiThucHienUid` = mã nghiệp vụ (owner
         không có hồ sơ thì là mã Firebase). Chỉ `create`. */
      tx.create(db.collection(TEN_COLLECTION_NHAT_KY).doc(), {
        thoiDiem: FieldValue.serverTimestamp(),
        nguoiThucHienUid: hsTx.nguoiDung.uid,
        nguoiThucHienTen: hsTx.nguoiDung.tenHienThi,
        hanhDong,
        moTa: tinh.moTaNhatKy,
      });
      return { ok: true, phienBan: tinh.mauMoi.phienBan, soODoi: tinh.soODoi, canhBao: tinh.canhBao };
    });

    if (!kq.ok) {
      return NextResponse.json(
        { error: kq.error, ...("maLoi" in kq && kq.maLoi ? { maLoi: kq.maLoi } : {}) },
        { status: kq.status },
      );
    }
    return NextResponse.json({ ok: true, phienBan: kq.phienBan, soODoi: kq.soODoi, canhBao: kq.canhBao });
  } catch (e) {
    /* Mẫu hỏng KHÔNG đi đường này — đã rẽ nhánh tường minh ở trên (`docMauChucDanh` không ném). Tới đây
       là lỗi khác (bản ghi quyền riêng sai khuôn, mạng, Firestore) → 500 chung, không ghi gì. */
    console.error("[api/quyen-mau-chuc-danh] POST hỏng:", e);
    return NextResponse.json({ error: "Không lưu được bảng mẫu quyền. Thử lại sau." }, { status: 500 });
  }
}
