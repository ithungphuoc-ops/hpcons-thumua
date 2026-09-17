import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getHpcoreDb } from "@/5-ket-noi/hpcore-may-chu";
import { DUONG_DAN_TACH } from "@/3-du-lieu/duong-dan-tach";
import type { DonDatHang, DeNghiMuaHang, GiaDonDatHang, NhaCungCap } from "@/3-du-lieu/kieu-du-lieu";
import { tinhTienChiTietPO } from "@/2-quy-trinh/tinh-toan";

/**
 * ★★★ BỘ NHỚ TẠM 5 PHÚT — THÊM 17/09/2026 CÙNG LÚC CHUYỂN SANG CẤU TRÚC TÁCH.
 *
 * 🔴 ĐÂY KHÔNG PHẢI TỐI ƯU CHO VUI, MÀ LÀ VÁ MỘT LỖ DO CHÍNH LƯỢT CHUYỂN NÀY MỞ RA.
 *
 * Mô hình cũ: cả kho nằm trong MỘT tài liệu → mỗi lần gọi API tốn đúng **1 lượt đọc** Firestore,
 * bất kể có bao nhiêu đơn hàng.
 * Mô hình tách: mỗi bản ghi một tài liệu → quét ba collection tốn **N lượt đọc**, N là tổng số
 * đơn + đề nghị + bảng giá, và N chỉ có tăng theo thời gian.
 *
 * 🔴 ĐÃ CÓ TIỀN LỆ THẬT, CÁCH ĐÂY ĐÚNG MỘT NGÀY: app Kho công trình sập ngày 15–16/09 vì
 * `RESOURCE_EXHAUSTED` — không phải do dữ liệu nhiều (chỉ ~110 tài liệu một lần quét) mà do quét
 * quá thường: bộ nhớ tạm chỉ 45 giây. Vá bằng cách nới lên 10 phút. Nếu bê nguyên lối cũ sang
 * đây thì App Thu mua sẽ đi đúng vào cái bẫy vừa thoát ra.
 *
 * 📌 VÌ SAO 5 PHÚT ĐỦ: đây là số liệu cho ô tổng quan của App Tổng — người xem cần biết "khoảng
 * bao nhiêu đơn đang chạy", không ai ra quyết định dựa trên con số lệch vài phút. Đổi lại, số
 * lượt đọc giảm theo đúng tần suất gọi: gọi 100 lần trong 5 phút cũng chỉ quét một lần.
 *
 * ⚠️ KHÔNG gắn `tags` và KHÔNG `revalidateTag` ở đâu cả — cố ý. Đây là đường CHỈ ĐỌC cho app
 * ngoài; xả bộ nhớ tạm mỗi lần có người sửa đơn là quay lại đúng bài toán cũ. Thà số liệu trễ
 * tối đa 5 phút.
 */
const docSoLieuTomTat = unstable_cache(
  async () => {
    const db = getHpcoreDb();
    /* Bốn lượt đọc chạy song song — tuần tự thì cộng dồn độ trễ mà chẳng được gì. */
    const [donHangSnap, deNghiSnap, giaSnap, caiDatSnap] = await Promise.all([
      db.collection(DUONG_DAN_TACH.donHang).get(),
      db.collection(DUONG_DAN_TACH.deNghi).get(),
      db.collection(DUONG_DAN_TACH.giaDonHang).get(),
      db.collection(DUONG_DAN_TACH.caiDat).doc(DUONG_DAN_TACH.tepCaiDat).get(),
    ]);
    return {
      donHang: donHangSnap.docs.map((d) => d.data() as DonDatHang),
      deNghi: deNghiSnap.docs.map((d) => d.data() as DeNghiMuaHang),
      giaDonHang: giaSnap.docs.map((d) => d.data() as GiaDonDatHang),
      nhaCungCapThem: ((caiDatSnap.data()?.nhaCungCapThem ?? []) as NhaCungCap[]),
    };
  },
  ["api-summary-thu-mua"],
  { revalidate: 300 },
);

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
    const data = await docSoLieuTomTat();

    const donHang: DonDatHang[] = data.donHang;
    const deNghi: DeNghiMuaHang[] = data.deNghi;
    const giaDonHang: GiaDonDatHang[] = data.giaDonHang;
    const giaTheoPoId = new Map(giaDonHang.map((g) => [g.poId, g]));

    const donHangHoanThanh = donHang.filter((p) => p.trangThai === "hoan_thanh");
    const donHangHuy = donHang.filter((p) => p.trangThai === "huy");
    const donHangDangXuLy = donHang.filter((p) => p.trangThai !== "hoan_thanh" && p.trangThai !== "huy");
    const donHangChoDeNghi = donHang.filter((p) => p.trangThai === "cho_de_nghi");

    let giaTriDangXuLy = 0;
    for (const p of donHangDangXuLy) {
      try {
        giaTriDangXuLy += tinhTienChiTietPO(p, giaTheoPoId.get(p.id)).tongThanhToan;
      } catch {
        // tinhTienChiTietPO() tự phòng thủ (đơn giá thiếu coi như 0₫, không throw) nên nhánh
        // này gần như không kích hoạt trong vận hành bình thường — chỉ chặn lỗi bất ngờ thật
        // sự, không để 1 đơn hỏng làm sập cả API.
      }
    }

    const deNghiHoanThanhHoacDong = deNghi.filter(
      (d) => d.trangThai === "hoan_thanh" || d.trangThai === "dong_do",
    );
    const deNghiDangXuLy = deNghi.filter(
      (d) => d.trangThai !== "hoan_thanh" && d.trangThai !== "dong_do",
    );

    return NextResponse.json({
      ok: true,
      don_hang_tong: donHang.length,
      don_hang_dang_xu_ly: donHangDangXuLy.length,
      don_hang_hoan_thanh: donHangHoanThanh.length,
      don_hang_huy: donHangHuy.length,
      don_hang_cho_de_nghi: donHangChoDeNghi.length,
      gia_tri_don_hang_dang_xu_ly: Math.round(giaTriDangXuLy),
      de_nghi_tong: deNghi.length,
      de_nghi_dang_xu_ly: deNghiDangXuLy.length,
      de_nghi_hoan_thanh_hoac_dong: deNghiHoanThanhHoacDong.length,
      nha_cung_cap_tong: data.nhaCungCapThem.length,
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
