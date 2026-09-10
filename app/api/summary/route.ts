import { NextRequest, NextResponse } from "next/server";
import { getHpcoreDb } from "@/5-ket-noi/hpcore-may-chu";
import { DUONG_DAN } from "@/3-du-lieu/kho-chung-firestore";
import type { DuLieuLuu } from "@/3-du-lieu/luu-tren-may";
import type { DonDatHang, DeNghiMuaHang, GiaDonDatHang } from "@/3-du-lieu/kieu-du-lieu";
import { tinhTienChiTietPO } from "@/2-quy-trinh/tinh-toan";

// Số liệu tóm tắt cho Dashboard toàn cảnh của App Tổng (09/2026) — đúng khuôn với 5 app con
// khác đã có (/api/summary hoặc /api/v1/summary ở PKD/Kho/Công nợ/Thiết kế/Đấu thầu): bảo vệ
// bằng 1 API Key riêng (header x-api-key), CHỈ ĐỌC — không có route nào khác ghi đè dữ liệu
// qua đây. Đọc thẳng document chay-thu/du-lieu-chung (đúng nguồn App Thu mua đang dùng thật,
// KHÔNG viết truy vấn/tổng hợp riêng để tránh tính sai lệch so với số nội bộ).
//
// GET /api/summary
export async function GET(req: NextRequest): Promise<NextResponse> {
  const apiKeyYeuCau = process.env.SUMMARY_API_KEY;
  if (!apiKeyYeuCau) {
    return NextResponse.json({ ok: false, error: "Chưa cấu hình SUMMARY_API_KEY." }, { status: 500 });
  }
  const apiKeyGui = req.headers.get("x-api-key");
  if (apiKeyGui !== apiKeyYeuCau) {
    return NextResponse.json({ ok: false, error: "Thiếu hoặc sai x-api-key." }, { status: 401 });
  }

  try {
    const db = getHpcoreDb();
    const snap = await db.collection(DUONG_DAN.boSuuTap).doc(DUONG_DAN.tep).get();
    const data = (snap.data() ?? {}) as Partial<DuLieuLuu>;

    const donHang: DonDatHang[] = data.donHang ?? [];
    const deNghi: DeNghiMuaHang[] = data.deNghi ?? [];
    const giaDonHang: GiaDonDatHang[] = data.giaDonHang ?? [];
    const giaTheoPoId = new Map(giaDonHang.map((g) => [g.poId, g]));

    const donHangHoanThanh = donHang.filter((p) => p.trangThai === "hoan_thanh");
    const donHangDangXuLy = donHang.filter((p) => p.trangThai !== "hoan_thanh" && p.trangThai !== "huy");
    const donHangChoDeNghi = donHang.filter((p) => p.trangThai === "cho_de_nghi");

    let giaTriDangXuLy = 0;
    for (const p of donHangDangXuLy) {
      try {
        giaTriDangXuLy += tinhTienChiTietPO(p, giaTheoPoId.get(p.id)).tongThanhToan;
      } catch {
        // Đơn thiếu dữ liệu giá/dòng hàng hợp lệ — bỏ qua đơn đó khỏi tổng, không sập cả API.
      }
    }

    const deNghiDangXuLy = deNghi.filter(
      (d) => d.trangThai !== "hoan_thanh" && d.trangThai !== "dong_do",
    );

    return NextResponse.json({
      ok: true,
      don_hang_tong: donHang.length,
      don_hang_dang_xu_ly: donHangDangXuLy.length,
      don_hang_hoan_thanh: donHangHoanThanh.length,
      don_hang_cho_de_nghi: donHangChoDeNghi.length,
      gia_tri_don_hang_dang_xu_ly: Math.round(giaTriDangXuLy),
      de_nghi_tong: deNghi.length,
      de_nghi_dang_xu_ly: deNghiDangXuLy.length,
      nha_cung_cap_tong: (data.nhaCungCapThem ?? []).length,
      cho_de_nghi_list: donHangChoDeNghi.slice(0, 8).map((p) => ({
        code: p.code,
        ma_du_an: p.maDuAn,
        ngay_lap: p.ngayLapPO,
      })),
    });
  } catch (err) {
    console.error("[api/summary] Lỗi đọc dữ liệu:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: "Lỗi đọc dữ liệu." }, { status: 500 });
  }
}
