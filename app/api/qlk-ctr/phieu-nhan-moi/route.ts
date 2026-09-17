import { NextRequest, NextResponse } from "next/server";
import { getHpcoreDb } from "@/5-ket-noi/hpcore-may-chu";
import { bo0Undefined } from "@/3-du-lieu/kho-chung-firestore";
import { DUONG_DAN_TACH } from "@/3-du-lieu/duong-dan-tach";
import {
  tinhTienDoPO,
  vuongMacGhiThemPhieuNhan,
  vuongMacKhoiLuongNhan,
  vuongMacSoPhieuNCC,
  laDongHang,
} from "@/2-quy-trinh/tinh-toan";
import type { DonDatHang, DongNhanHang, PhieuNhanHang } from "@/3-du-lieu/kieu-du-lieu";
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

    /**
     * ★★ CHUYỂN SANG CẤU TRÚC TÁCH — 17/09/2026.
     *
     * Trước đây: đọc MỘT tài liệu chứa cả kho rồi lọc bằng `.find()` trong bộ nhớ.
     * Nay: đơn hàng là tài liệu riêng trong `tm_donhang`, phiếu nhận nằm LỒNG trong đơn tại
     * `tm_donhang/{poId}/nhanhang/{id}` — đúng quyết định ③ của Sếp ngày 16/09/2026.
     *
     * 🔴 PHẢI ĐỌC HẾT RỒI MỚI ĐƯỢC GHI. Transaction của Firestore bắt buộc mọi lượt đọc đứng
     * trước mọi lượt ghi; xen một lượt đọc vào sau lượt ghi là lỗi ngay lúc chạy.
     *
     * 📌 CHỐNG TRÙNG NAY CHỈ QUÉT TRONG ĐÚNG ĐƠN ĐÓ, không quét toàn bộ phiếu nhận của cả công
     * ty như bản cũ. Ba lý do: (a) phiếu nhận luôn thuộc đúng một đơn, mà đơn đã xác định được
     * từ `poCode` ngay trên; (b) rẻ hơn hẳn — quét một đơn thay vì mọi đơn, đúng bài học lượt
     * đọc Firestore rút ra từ sự cố app Kho ngày 15–16/09; (c) không phải dựng index
     * `collectionGroup` chỉ để phục vụ một phép chống trùng.
     */
    const donHangCol = db.collection(DUONG_DAN_TACH.donHang);

    const ketQua = await db.runTransaction(async (tx) => {
      const poSnap = await tx.get(donHangCol.where("code", "==", payload.poCode).limit(1));
      if (poSnap.empty) {
        throw new Error(`Không tìm thấy đơn mua hàng "${payload.poCode}".`);
      }
      const poDoc = poSnap.docs[0];
      const po = poDoc.data() as DonDatHang;
      const phieuCol = poDoc.ref.collection(DUONG_DAN_TACH.phieuNhanTrongDon);

      const phieuSnap = await tx.get(phieuCol);
      const phieuCuaPO: PhieuNhanHang[] = phieuSnap.docs.map((d) => d.data() as PhieuNhanHang);

      // Chống trùng khi QLK CTR gọi lại (retry do mạng lỗi) — trả lại đúng phiếu đã tạo.
      const trungRoi = phieuCuaPO.find((p) => p.maPhieuNhanQlkCtr === payload.maPhieuNhanQlkCtr);
      if (trungRoi) {
        return { moi: false as const, phieu: trungRoi };
      }

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

      /* Phiếu nhận thành MỘT tài liệu riêng lồng trong đơn — không còn nối vào mảng rồi ghi đè
         cả kho. Đây chính là điểm khiến hai thủ kho ghi hai đơn khác nhau không còn đè nhau. */
      tx.set(phieuCol.doc(phieuMoi.id), bo0Undefined(phieuMoi));

      /* 📌 CHỈ ĐỘNG VÀO ĐƠN KHI THẬT SỰ PHẢI ĐỔI TRẠNG THÁI. Bản cũ `map()` qua toàn bộ đơn rồi
         ghi lại tất cả, nên mỗi lần nhận hàng là một lượt ghi đè lên mọi đơn của cả phòng — đúng
         thứ đẻ ra vòng dội ngược. Nay chạm đúng một tài liệu, và chỉ khi cần. */
      if (po.trangThai === "da_chot") {
        tx.update(poDoc.ref, { trangThai: "dang_giao" });
      }
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
