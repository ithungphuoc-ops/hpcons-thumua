import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getHpcoreDb } from "@/5-ket-noi/hpcore-may-chu";
import { DUONG_DAN, bo0Undefined } from "@/3-du-lieu/kho-chung-firestore";
import { maDeNghiTiepTheo } from "@/2-quy-trinh/dat-ten-de-nghi";
import {
  quyDoiPhongBan,
  tachCongTrinhTuChuoi,
  xacDinhMaDuAnTamThoi,
} from "@/2-quy-trinh/tich-hop-app-request";
import type { DeNghiMuaHang, DongDeNghi } from "@/3-du-lieu/kieu-du-lieu";
import type { DuLieuLuu } from "@/3-du-lieu/luu-tren-may";
import type { DeNghiMoiTuAppRequest, KetQuaNhanDeNghiTuAppRequest } from "@/3-du-lieu/tich-hop-app-request-types";

// "Cửa tiếp nhận" của App Thu mua cho App Request — xem hợp đồng dữ liệu đầy đủ tại
// 3-du-lieu/tich-hop-app-request-types.ts.
//
// Gọi cho MỌI đề xuất duyệt xong bên App Request (có công trình hay không) — khác nhánh họ
// đang gọi sang QLK CTR (chỉ có ý nghĩa khi có công trình). Việc 1, Sếp chốt 19/08/2026.
//
//   POST /api/app-request/de-nghi-moi
//
// Bảo vệ tạm bằng header x-api-key nếu đã cấu hình APP_REQUEST_API_KEY — chưa cấu hình thì
// API vẫn chạy được ngay (để test trước khi 2 đội thống nhất khóa), đúng kiểu QLK CTR đang
// làm với chính App Request.
//
// 📌 Dùng CHUNG kết nối Admin SDK với cầu nối SSO (`getHpcoreDb()` ở
// `5-ket-noi/hpcore-may-chu.ts`) — cùng project `hpcons-portal`, không cần khóa/project riêng
// nào khác cho route này (20/08/2026, sau khi xác nhận lại với IT).
export async function POST(req: NextRequest): Promise<NextResponse<KetQuaNhanDeNghiTuAppRequest>> {
  const apiKeyYeuCau = process.env.APP_REQUEST_API_KEY;
  if (apiKeyYeuCau) {
    const apiKeyGui = req.headers.get("x-api-key");
    if (apiKeyGui !== apiKeyYeuCau) {
      return NextResponse.json({ ok: false, error: "Thiếu hoặc sai x-api-key." }, { status: 401 });
    }
  }

  let payload: DeNghiMoiTuAppRequest;
  try {
    payload = (await req.json()) as DeNghiMoiTuAppRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "Body gửi lên không phải JSON hợp lệ." }, { status: 400 });
  }

  if (!payload.requestCode?.trim() || !payload.nguoiGuiEmail?.trim() || !payload.vatTu?.length) {
    return NextResponse.json(
      { ok: false, error: "Thiếu dữ liệu bắt buộc (requestCode / nguoiGuiEmail / vatTu)." },
      { status: 400 },
    );
  }

  try {
    const db = getHpcoreDb();
    const docRef = db.collection(DUONG_DAN.boSuuTap).doc(DUONG_DAN.tep);

    // Transaction: đọc + kiểm trùng + ghi trong một bước — chặn trường hợp App Request gọi
    // lại 2 lần gần nhau (retry do mạng lỗi) tạo ra 2 đề nghị trùng mã đề xuất.
    const ketQua = await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      const data = (snap.exists ? snap.data() : {}) as Partial<DuLieuLuu>;
      const deNghiHienCo: DeNghiMuaHang[] = Array.isArray(data.deNghi) ? data.deNghi : [];

      const trungRoi = deNghiHienCo.find((d) => d.maDeXuatAppRequest === payload.requestCode);
      if (trungRoi) {
        return { moi: false as const, deNghi: trungRoi };
      }

      const congTrinh = tachCongTrinhTuChuoi(payload.congTrinhChuoi);
      const maPhongBan = quyDoiPhongBan(payload.phongBan);
      const maDuAnTam = xacDinhMaDuAnTamThoi(congTrinh, maPhongBan);
      const maDaDung = deNghiHienCo.map((d) => d.code);
      const maMoi = maDeNghiTiepTheo(maDuAnTam, maDaDung);

      const ngayCanHang = payload.ngayCanGiao || congThemNgay(payload.ngayDuyet, 7);

      const items: DongDeNghi[] = payload.vatTu.map((vt, i) => ({
        stt: i + 1,
        tenVatLieu: vt.tenVatTu,
        quyCach: vt.quyCach,
        donViTinh: vt.dvt,
        khoiLuongDeNghi: vt.soLuong,
        mucDichSuDung: vt.mucDichSuDung,
      }));

      const deNghiMoi: DeNghiMuaHang = {
        id: randomUUID(),
        code: maMoi,
        maDuAn: maDuAnTam,
        maHopDongCDT: congTrinh?.maHopDongCDT,
        tenCongTrinh: congTrinh?.tenCongTrinh ?? "",
        tieuDe: payload.tieuDe?.trim() || `Đề nghị từ App Request #${payload.requestCode}`,
        phongBanNguon: maPhongBan,
        nguoiDeNghiUid: payload.nguoiGuiUid || payload.nguoiGuiEmail,
        nguoiDeNghiTen: payload.nguoiGuiTen,
        ngayDeNghi: payload.ngayGui || payload.ngayDuyet,
        ngayDuyet: payload.ngayDuyet,
        ngayCanHang,
        mucDoUuTien: "binh_thuong",
        trangThai: "da_duyet",
        items,
        lichSu: [
          {
            thoiDiem: new Date().toISOString(),
            nguoiThucHien: "Hệ thống (App Request)",
            hanhDong: "Tạo tự động từ đề xuất đã duyệt",
            ghiChu: `Mã đề xuất App Request: ${payload.requestCode}`,
          },
        ],
        maDeXuatAppRequest: payload.requestCode,
      };

      tx.set(docRef, bo0Undefined({ deNghi: [...deNghiHienCo, deNghiMoi] }), { merge: true });
      return { moi: true as const, deNghi: deNghiMoi };
    });

    return NextResponse.json({
      ok: true,
      trangThai: ketQua.moi ? "da_tao" : "da_ton_tai",
      deNghiId: ketQua.deNghi.id,
      maDeNghi: ketQua.deNghi.code,
    });
  } catch (error) {
    console.error("Lỗi nhận đề nghị từ App Request:", error);
    const thongBaoLoi = error instanceof Error ? error.message : "Lỗi không xác định.";
    return NextResponse.json({ ok: false, error: thongBaoLoi }, { status: 500 });
  }
}

/** Cộng thêm N ngày vào một mốc ISO "YYYY-MM-DD", trả về cùng dạng. */
function congThemNgay(iso: string, soNgay: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + soNgay);
  return d.toISOString().slice(0, 10);
}
