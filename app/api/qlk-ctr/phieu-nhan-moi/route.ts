import { NextRequest, NextResponse } from "next/server";
import { getHpcoreDb } from "@/5-ket-noi/hpcore-may-chu";
import { DUONG_DAN, bo0Undefined } from "@/3-du-lieu/kho-chung-firestore";
import {
  tinhTienDoPO,
  vuongMacGhiThemPhieuNhan,
  vuongMacKhoiLuongNhan,
  vuongMacSoPhieuNCC,
  laDongHang,
} from "@/2-quy-trinh/tinh-toan";
import type { DonDatHang, DongNhanHang, PhieuNhanHang } from "@/3-du-lieu/kieu-du-lieu";
import type { DuLieuLuu } from "@/3-du-lieu/luu-tren-may";
import type { PhieuNhanMoiTuQlkCtr, KetQuaNhanPhieuTuQlkCtr } from "@/3-du-lieu/tich-hop-qlk-ctr-nhan-hang-types";

// "Cửa tiếp nhận" của App Thu mua cho QLK CTR — mirror đúng khuôn `de-nghi-moi/route.ts`
// (Việc 1). Thủ kho ghi nhận nhập kho + tải ảnh MỘT LẦN ở QLK CTR, phiếu nhận hàng tự sinh
// ở đây, không ai ghi tay lần 2. Xem hợp đồng dữ liệu đầy đủ tại
// 3-du-lieu/tich-hop-qlk-ctr-nhan-hang-types.ts.
//
//   POST /api/qlk-ctr/phieu-nhan-moi
//
// Bảo vệ tạm bằng header x-api-key nếu đã cấu hình QLKCTR_PHIEU_NHAN_API_KEY — chưa cấu
// hình thì API vẫn chạy được ngay (để 2 đội test trước), đúng kiểu de-nghi-moi đang làm.
//
// 🔴 KHÔNG tái sử dụng `themPhieuNhan()` (kho-du-lieu.tsx) — đó là React hook chạy trong
// trình duyệt, không gọi được từ máy chủ. Viết lại đúng 3 luật `vuongMac*` + cách sinh
// lanGiaoThu/id/code tại đây, giống cách de-nghi-moi đã làm với maDeNghiTiepTheo.
export async function POST(req: NextRequest): Promise<NextResponse<KetQuaNhanPhieuTuQlkCtr>> {
  const apiKeyYeuCau = process.env.QLKCTR_PHIEU_NHAN_API_KEY;
  if (apiKeyYeuCau) {
    const apiKeyGui = req.headers.get("x-api-key");
    if (apiKeyGui !== apiKeyYeuCau) {
      return NextResponse.json({ ok: false, error: "Thiếu hoặc sai x-api-key." }, { status: 401 });
    }
  }

  let payload: PhieuNhanMoiTuQlkCtr;
  try {
    payload = (await req.json()) as PhieuNhanMoiTuQlkCtr;
  } catch {
    return NextResponse.json({ ok: false, error: "Body gửi lên không phải JSON hợp lệ." }, { status: 400 });
  }

  if (!payload.poCode?.trim() || !payload.maPhieuNhanQlkCtr?.trim() || !payload.lines?.length) {
    return NextResponse.json(
      { ok: false, error: "Thiếu dữ liệu bắt buộc (poCode / maPhieuNhanQlkCtr / lines)." },
      { status: 400 },
    );
  }

  try {
    const db = getHpcoreDb();
    const docRef = db.collection(DUONG_DAN.boSuuTap).doc(DUONG_DAN.tep);

    const ketQua = await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      const data = (snap.exists ? snap.data() : {}) as Partial<DuLieuLuu>;
      const donHangHienCo: DonDatHang[] = Array.isArray(data.donHang) ? data.donHang : [];
      const phieuNhanHienCo: PhieuNhanHang[] = Array.isArray(data.phieuNhan) ? data.phieuNhan : [];

      // Chống trùng khi QLK CTR gọi lại (retry do mạng lỗi) — trả lại đúng phiếu đã tạo.
      const trungRoi = phieuNhanHienCo.find((p) => p.maPhieuNhanQlkCtr === payload.maPhieuNhanQlkCtr);
      if (trungRoi) {
        return { moi: false as const, phieu: trungRoi };
      }

      const po = donHangHienCo.find((p) => p.code === payload.poCode);
      if (!po) {
        throw new Error(`Không tìm thấy đơn mua hàng "${payload.poCode}".`);
      }

      const phieuCuaPO = phieuNhanHienCo.filter((p) => p.poId === po.id);
      const tienDo = tinhTienDoPO(po, phieuCuaPO);

      // Khớp theo TÊN vật liệu (không theo số thứ tự) — cả 2 hệ thống đều có sẵn tên gốc
      // từ cùng 1 đề nghị, ổn định hơn số thứ tự có thể lệch giữa 2 hệ thống.
      //
      // 🔴 (29/08/2026): PO có thể có NHIỀU dòng CÙNG tên nhưng khác quy cách (vd "Ống nước"
      // D34 và D90, PO DMH260002) — Map cũ (1 tên → 1 dòng) bị dòng sau ghi đè dòng trước,
      // khiến khối lượng nhận bị gán nhầm sang dòng khác và kích hoạt nhầm chặn "vượt quá số
      // lượng" (vuongMacKhoiLuongNhan), rollback cả phiếu dù dữ liệu gửi lên đúng. Sửa: gom
      // theo tên thành MẢNG ứng viên, chỉ nhận khi đúng 1 ứng viên — nếu nhiều ứng viên trùng
      // tên thì bắt buộc phân biệt tiếp bằng thongSoKyThuat (mirror đúng cách QLK CTR tự dùng
      // nội bộ, hàm `chonMotVatTu` trong app-mua-hang-actions.ts).
      const chuanHoa = (s: string | undefined | null) => (s ?? "").trim().toLowerCase();
      const dongTheoTen = new Map<string, (typeof tienDo)[number][]>();
      for (const d of tienDo.filter(laDongHang)) {
        const key = chuanHoa(d.tenVatLieu);
        const ds = dongTheoTen.get(key);
        if (ds) ds.push(d);
        else dongTheoTen.set(key, [d]);
      }

      function chonMotDong(l: PhieuNhanMoiTuQlkCtr["lines"][number]) {
        const ungVien = dongTheoTen.get(chuanHoa(l.tenVatLieu)) ?? [];
        if (ungVien.length === 1) return ungVien[0];
        if (ungVien.length > 1) {
          const theoQuyCach = ungVien.filter((d) => chuanHoa(d.thongSoKyThuat) === chuanHoa(l.thongSoKyThuat));
          if (theoQuyCach.length === 1) return theoQuyCach[0];
        }
        return null;
      }

      const khongKhop: string[] = [];
      const lines: DongNhanHang[] = payload.lines.map((l) => {
        const dong = chonMotDong(l);
        if (!dong) {
          khongKhop.push(l.thongSoKyThuat ? `${l.tenVatLieu} (${l.thongSoKyThuat})` : l.tenVatLieu);
          return { sttDongPO: -1, khoiLuongThucNhan: l.khoiLuongThucNhan };
        }
        return { sttDongPO: dong.sttDong, khoiLuongThucNhan: l.khoiLuongThucNhan };
      });
      if (khongKhop.length > 0) {
        throw new Error(`Không khớp được vật liệu trong PO "${payload.poCode}": ${khongKhop.join(", ")}.`);
      }

      const vuongMac =
        vuongMacGhiThemPhieuNhan(tienDo) ??
        vuongMacKhoiLuongNhan(tienDo, lines) ??
        vuongMacSoPhieuNCC(payload.soPhieuGiaoNCC ?? "", phieuCuaPO);
      if (vuongMac) {
        throw new Error(vuongMac);
      }

      const lanGiaoThu = phieuCuaPO.length + 1;
      const phieuMoi: PhieuNhanHang = {
        id: `grn-${po.id}-${lanGiaoThu}`,
        code: `${po.code}-DO${String(lanGiaoThu).padStart(2, "0")}`,
        poId: po.id,
        poCode: po.code,
        lanGiaoThu,
        ngayNhanThucTe: payload.ngayNhanThucTe,
        nguoiNhanUid: "qlk-ctr",
        nguoiNhanTen: payload.nguoiNhanTen,
        soPhieuGiaoNCC: payload.soPhieuGiaoNCC,
        trangThai: "da_nhap_kho",
        lines,
        maPhieuNhanQlkCtr: payload.maPhieuNhanQlkCtr,
        anhQlkCtr: payload.anhQlkCtr,
      };

      const donHangMoi = donHangHienCo.map((p) =>
        p.id === po.id && p.trangThai === "da_chot" ? { ...p, trangThai: "dang_giao" as const } : p,
      );

      tx.set(
        docRef,
        bo0Undefined({ donHang: donHangMoi, phieuNhan: [...phieuNhanHienCo, phieuMoi] }),
        { merge: true },
      );
      return { moi: true as const, phieu: phieuMoi };
    });

    return NextResponse.json({
      ok: true,
      trangThai: ketQua.moi ? "da_tao" : "da_ton_tai",
      phieuId: ketQua.phieu.id,
      phieuCode: ketQua.phieu.code,
    });
  } catch (error) {
    console.error("Lỗi nhận phiếu nhận hàng từ QLK CTR:", error);
    const thongBaoLoi = error instanceof Error ? error.message : "Lỗi không xác định.";
    return NextResponse.json({ ok: false, error: thongBaoLoi }, { status: 500 });
  }
}
