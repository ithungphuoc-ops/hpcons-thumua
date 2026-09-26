import { NextRequest, NextResponse } from "next/server";
import { getThuMuaDb, verifyClientIdToken } from "@/5-ket-noi/hpcore-may-chu";
import { DUONG_DAN } from "@/3-du-lieu/kho-chung-firestore";
import { tuMap } from "@/2-quy-trinh/ghi-tung-phan";
import {
  KHO_CAP_PHAT,
  khoaSoCapPhat,
  laLoaiMa,
  locGiuChoConHieuLuc,
  maTiepTheoTrenMayChu,
  type LoaiMa,
  type MaGiuCho,
} from "@/2-quy-trinh/cap-ma-may-chu";
import type { DuLieuLuu } from "@/3-du-lieu/luu-tren-may";

// ============================================================
// CỬA CẤP MÃ — nhịp 3b lộ trình chống mất dữ liệu (23/09/2026)
//
// 🔴 VẤN ĐỀ: mã đơn hàng / đề nghị / nhà cung cấp đang tính TRONG MÁY NGƯỜI DÙNG. Hai người bấm
// "Tạo" cùng lúc cùng thấy một số lớn nhất nên cùng cấp một mã — hai chứng từ khác nhau, cùng
// một số. Đối chiếu công nợ với nhà cung cấp sẽ lệch mà không ai biết lệch ở đâu.
//
// 🔴 VÌ SAO PHẢI GHI CHỨ KHÔNG CHỈ ĐỌC: giao dịch Firestore chỉ phát hiện tranh chấp khi có
// GHI. Hai giao dịch cùng đọc, cùng tính, cùng trả một mã mà không ghi gì thì cả hai đều
// "thành công" và vẫn trùng y như cũ. Lần ghi vào sổ giữ chỗ chính là thứ tạo ra tranh chấp.
//
// 📌 Luật sinh mã KHÔNG chép lại ở đây — route gọi đúng ba hàm thuần mà giao diện đang dùng
// (qua `2-quy-trinh/cap-ma-may-chu.ts`). Chép sang là hai bên lệch nhau sau vài lần sửa.
// ============================================================

/* 📌 25/09/2026: ĐÃ BỎ hạn dùng `HAN_DUNG` (01/11/2026) theo chỉ đạo Ban lãnh đạo, cùng lúc với
   `conHanChayThu()` trong `5-ket-noi/firestore-gop-tach.rules`. Bốn chỗ này phải luôn đi cùng nhau. */

function layIdToken(req: NextRequest): string | undefined {
  return (req.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i)?.[1];
}

/** Lấy danh sách mã ĐANG DÙNG THẬT trong kho, theo từng loại. */
function maTrongKho(d: Partial<DuLieuLuu>, loai: LoaiMa): string[] {
  if (loai === "don-hang") {
    return tuMap<{ code?: string }>(d.donHang).map((x) => String(x.code ?? ""));
  }
  if (loai === "de-nghi") {
    return tuMap<{ code?: string }>(d.deNghi).map((x) => String(x.code ?? ""));
  }
  /* Danh mục nhà cung cấp tự thêm LÀ toàn bộ danh mục — danh mục mẫu đã bỏ hẳn 21/08/2026. */
  return (Array.isArray(d.nhaCungCapThem) ? d.nhaCungCapThem : []).map((x) =>
    String((x as { maNCC?: string }).maNCC ?? ""),
  );
}

export async function POST(req: NextRequest) {
  const nguoiGoi = await verifyClientIdToken(layIdToken(req));
  if (!nguoiGoi) return NextResponse.json({ loi: "CHUA_DANG_NHAP" }, { status: 401 });

  let than: { loai?: unknown; thamSo?: unknown };
  try {
    than = (await req.json()) as typeof than;
  } catch {
    return NextResponse.json({ loi: "THAN_KHONG_HOP_LE" }, { status: 400 });
  }

  const loai = than.loai;
  if (!laLoaiMa(loai)) return NextResponse.json({ loi: "LOAI_KHONG_HOP_LE" }, { status: 400 });

  const thamSo = typeof than.thamSo === "string" ? than.thamSo.trim() : "";
  /* Đơn hàng cần NĂM, đề nghị cần MÃ DỰ ÁN. Thiếu thì không đoán — trả lỗi để nơi gọi biết,
     vì cấp nhầm phạm vi đánh số còn khó gỡ hơn không cấp. */
  if ((loai === "don-hang" || loai === "de-nghi") && !thamSo) {
    return NextResponse.json({ loi: "THIEU_THAM_SO" }, { status: 400 });
  }

  try {
    const db = getThuMuaDb();
    const tepKho = db.collection(DUONG_DAN.boSuuTap).doc(DUONG_DAN.tep);
    const tepSo = db.collection(KHO_CAP_PHAT).doc(khoaSoCapPhat(loai, thamSo));

    const ma = await db.runTransaction(async (tx) => {
      /* 🔴 ĐỌC HẾT RỒI MỚI GHI. Firestore cấm đọc sau khi đã ghi trong cùng giao dịch. */
      const [anhKho, anhSo] = await Promise.all([tx.get(tepKho), tx.get(tepSo)]);

      const kho = (anhKho.exists ? anhKho.data() : {}) as Partial<DuLieuLuu>;
      const daDung = maTrongKho(kho, loai);

      const soCu = (anhSo.exists ? anhSo.data() : {}) as { giuCho?: unknown };
      const giuChoCu = Array.isArray(soCu.giuCho) ? (soCu.giuCho as MaGiuCho[]) : [];
      const giuCho = locGiuChoConHieuLuc(giuChoCu, daDung);

      const maMoi = maTiepTheoTrenMayChu(loai, thamSo, daDung, giuCho);

      /* ★ CHÍNH LẦN GHI NÀY tạo ra tranh chấp để Firestore bắt được — xem chú thích đầu tệp. */
      tx.set(tepSo, { giuCho: [...giuCho, { ma: maMoi, luc: new Date().toISOString() }] });

      return maMoi;
    });

    return NextResponse.json({ ma });
  } catch (e) {
    console.error("[api/cap-ma] Không cấp được mã:", e);
    return NextResponse.json({ loi: "LOI_MAY_CHU" }, { status: 500 });
  }
}
